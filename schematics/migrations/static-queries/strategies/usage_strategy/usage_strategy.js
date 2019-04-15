/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/usage_strategy", ["require", "exports", "typescript", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/query-definition", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/declaration_usage_visitor", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/super_class_context", "@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/template_usage_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const declaration_usage_visitor_1 = require("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/declaration_usage_visitor");
    const super_class_context_1 = require("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/super_class_context");
    const template_usage_visitor_1 = require("@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/template_usage_visitor");
    /**
     * Object that maps a given type of query to a list of lifecycle hooks that
     * could be used to access such a query statically.
     */
    const STATIC_QUERY_LIFECYCLE_HOOKS = {
        [query_definition_1.QueryType.ViewChild]: ['ngOnChanges', 'ngOnInit', 'ngDoCheck', 'ngAfterContentInit', 'ngAfterContentChecked'],
        [query_definition_1.QueryType.ContentChild]: ['ngOnChanges', 'ngOnInit', 'ngDoCheck'],
    };
    /**
     * Query timing strategy that determines the timing of a given query by inspecting how
     * the query is accessed within the project's TypeScript source files. Read more about
     * this strategy here: https://hackmd.io/s/Hymvc2OKE
     */
    class QueryUsageStrategy {
        constructor(classMetadata, typeChecker) {
            this.classMetadata = classMetadata;
            this.typeChecker = typeChecker;
        }
        setup() {
            // No setup is needed for this strategy and therefore we always return "true" as
            // the setup is successful.
            return true;
        }
        /**
         * Analyzes the usage of the given query and determines the query timing based
         * on the current usage of the query.
         */
        detectTiming(query) {
            return {
                timing: isQueryUsedStatically(query.container, query, this.classMetadata, this.typeChecker, []) ?
                    query_definition_1.QueryTiming.STATIC :
                    query_definition_1.QueryTiming.DYNAMIC
            };
        }
    }
    exports.QueryUsageStrategy = QueryUsageStrategy;
    /**
     * Checks whether a given query is used statically within the given class, its super
     * class or derived classes.
     */
    function isQueryUsedStatically(classDecl, query, classMetadataMap, typeChecker, knownInputNames, functionCtx = new Map(), visitInheritedClasses = true) {
        const usageVisitor = new declaration_usage_visitor_1.DeclarationUsageVisitor(query.property, typeChecker, functionCtx);
        const classMetadata = classMetadataMap.get(classDecl);
        // In case there is metadata for the current class, we collect all resolved Angular input
        // names and add them to the list of known inputs that need to be checked for usages of
        // the current query. e.g. queries used in an @Input() *setter* are always static.
        if (classMetadata) {
            knownInputNames.push(...classMetadata.ngInputNames);
        }
        // Array of TypeScript nodes which can contain usages of the given query in
        // order to access it statically.
        const possibleStaticQueryNodes = filterQueryClassMemberNodes(classDecl, query, knownInputNames);
        // In case nodes that can possibly access a query statically have been found, check
        // if the query declaration is synchronously used within any of these nodes.
        if (possibleStaticQueryNodes.length &&
            possibleStaticQueryNodes.some(n => usageVisitor.isSynchronouslyUsedInNode(n))) {
            return true;
        }
        if (!classMetadata) {
            return false;
        }
        // In case there is a component template for the current class, we check if the
        // template statically accesses the current query. In case that's true, the query
        // can be marked as static.
        if (classMetadata.template && property_name_1.hasPropertyNameText(query.property.name)) {
            const template = classMetadata.template;
            const parsedHtml = parse_html_1.parseHtmlGracefully(template.content, template.filePath);
            const htmlVisitor = new template_usage_visitor_1.TemplateUsageVisitor(query.property.name.text);
            if (parsedHtml && htmlVisitor.isQueryUsedStatically(parsedHtml)) {
                return true;
            }
        }
        // In case derived classes should also be analyzed, we determine the classes that derive
        // from the current class and check if these have input setters or lifecycle hooks that
        // use the query statically.
        if (visitInheritedClasses) {
            if (classMetadata.derivedClasses.some(derivedClass => isQueryUsedStatically(derivedClass, query, classMetadataMap, typeChecker, knownInputNames))) {
                return true;
            }
        }
        // In case the current class has a super class, we determine declared abstract function-like
        // declarations in the super-class that are implemented in the current class. The super class
        // will then be analyzed with the abstract declarations mapped to the implemented TypeScript
        // nodes. This allows us to handle queries which are used in super classes through derived
        // abstract method declarations.
        if (classMetadata.superClass) {
            const superClassDecl = classMetadata.superClass;
            // Update the function context to map abstract declaration nodes to their implementation
            // node in the base class. This ensures that the declaration usage visitor can analyze
            // abstract class member declarations.
            super_class_context_1.updateSuperClassAbstractMembersContext(classDecl, functionCtx, classMetadataMap);
            if (isQueryUsedStatically(superClassDecl, query, classMetadataMap, typeChecker, [], functionCtx, false)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Filters all class members from the class declaration that can access the
     * given query statically (e.g. ngOnInit lifecycle hook or @Input setters)
     */
    function filterQueryClassMemberNodes(classDecl, query, knownInputNames) {
        // Returns an array of TypeScript nodes which can contain usages of the given query
        // in order to access it statically. e.g.
        //  (1) queries used in the "ngOnInit" lifecycle hook are static.
        //  (2) inputs with setters can access queries statically.
        return classDecl.members
            .filter(m => {
            if (ts.isMethodDeclaration(m) && m.body && property_name_1.hasPropertyNameText(m.name) &&
                STATIC_QUERY_LIFECYCLE_HOOKS[query.type].indexOf(m.name.text) !== -1) {
                return true;
            }
            else if (knownInputNames && ts.isSetAccessor(m) && m.body && property_name_1.hasPropertyNameText(m.name) &&
                knownInputNames.indexOf(m.name.text) !== -1) {
                return true;
            }
            return false;
        })
            .map((member) => member.body);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNhZ2Vfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLDBFQUFpRTtJQUNqRSwyRkFBK0U7SUFFL0Usa0hBQXlGO0lBR3pGLHNKQUFxRjtJQUNyRiwwSUFBNkU7SUFDN0UsZ0pBQThEO0lBRzlEOzs7T0FHRztJQUNILE1BQU0sNEJBQTRCLEdBQUc7UUFDbkMsQ0FBQyw0QkFBUyxDQUFDLFNBQVMsQ0FBQyxFQUNqQixDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixDQUFDO1FBQzNGLENBQUMsNEJBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDO0tBQ25FLENBQUM7SUFFRjs7OztPQUlHO0lBQ0gsTUFBYSxrQkFBa0I7UUFDN0IsWUFBb0IsYUFBK0IsRUFBVSxXQUEyQjtZQUFwRSxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7UUFBRyxDQUFDO1FBRTVGLEtBQUs7WUFDSCxnRkFBZ0Y7WUFDaEYsMkJBQTJCO1lBQzNCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVEOzs7V0FHRztRQUNILFlBQVksQ0FBQyxLQUF3QjtZQUNuQyxPQUFPO2dCQUNMLE1BQU0sRUFDRixxQkFBcUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDekYsOEJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDcEIsOEJBQVcsQ0FBQyxPQUFPO2FBQ3hCLENBQUM7UUFDSixDQUFDO0tBQ0Y7SUFyQkQsZ0RBcUJDO0lBR0Q7OztPQUdHO0lBQ0gsU0FBUyxxQkFBcUIsQ0FDMUIsU0FBOEIsRUFBRSxLQUF3QixFQUFFLGdCQUFrQyxFQUM1RixXQUEyQixFQUFFLGVBQXlCLEVBQ3RELGNBQStCLElBQUksR0FBRyxFQUFFLEVBQUUscUJBQXFCLEdBQUcsSUFBSTtRQUN4RSxNQUFNLFlBQVksR0FBRyxJQUFJLG1EQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzNGLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV0RCx5RkFBeUY7UUFDekYsdUZBQXVGO1FBQ3ZGLGtGQUFrRjtRQUNsRixJQUFJLGFBQWEsRUFBRTtZQUNqQixlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ3JEO1FBRUQsMkVBQTJFO1FBQzNFLGlDQUFpQztRQUNqQyxNQUFNLHdCQUF3QixHQUFHLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFaEcsbUZBQW1GO1FBQ25GLDRFQUE0RTtRQUM1RSxJQUFJLHdCQUF3QixDQUFDLE1BQU07WUFDL0Isd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDakYsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELCtFQUErRTtRQUMvRSxpRkFBaUY7UUFDakYsMkJBQTJCO1FBQzNCLElBQUksYUFBYSxDQUFDLFFBQVEsSUFBSSxtQ0FBbUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RFLE1BQU0sUUFBUSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUM7WUFDeEMsTUFBTSxVQUFVLEdBQUcsZ0NBQW1CLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUUsTUFBTSxXQUFXLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2RSxJQUFJLFVBQVUsSUFBSSxXQUFXLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQy9ELE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtRQUVELHdGQUF3RjtRQUN4Rix1RkFBdUY7UUFDdkYsNEJBQTRCO1FBQzVCLElBQUkscUJBQXFCLEVBQUU7WUFDekIsSUFBSSxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FDN0IsWUFBWSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FDakMsWUFBWSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUMsRUFBRTtnQkFDakYsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsNEZBQTRGO1FBQzVGLDZGQUE2RjtRQUM3Riw0RkFBNEY7UUFDNUYsMEZBQTBGO1FBQzFGLGdDQUFnQztRQUNoQyxJQUFJLGFBQWEsQ0FBQyxVQUFVLEVBQUU7WUFDNUIsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQztZQUVoRCx3RkFBd0Y7WUFDeEYsc0ZBQXNGO1lBQ3RGLHNDQUFzQztZQUN0Qyw0REFBc0MsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFakYsSUFBSSxxQkFBcUIsQ0FDakIsY0FBYyxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDckYsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBR0Q7OztPQUdHO0lBQ0gsU0FBUywyQkFBMkIsQ0FDaEMsU0FBOEIsRUFBRSxLQUF3QixFQUN4RCxlQUF5QjtRQUMzQixtRkFBbUY7UUFDbkYseUNBQXlDO1FBQ3pDLGlFQUFpRTtRQUNqRSwwREFBMEQ7UUFDMUQsT0FBTyxTQUFTLENBQUMsT0FBTzthQUNuQixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDVixJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xFLDRCQUE0QixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDeEUsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTSxJQUNILGVBQWUsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDL0UsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUMvQyxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsQ0FBQyxNQUF3RCxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBTSxDQUFDLENBQUM7SUFDeEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7cGFyc2VIdG1sR3JhY2VmdWxseX0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvcGFyc2VfaHRtbCc7XG5pbXBvcnQge2hhc1Byb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5pbXBvcnQge0NsYXNzTWV0YWRhdGFNYXB9IGZyb20gJy4uLy4uL2FuZ3VsYXIvbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVRpbWluZywgUXVlcnlUeXBlfSBmcm9tICcuLi8uLi9hbmd1bGFyL3F1ZXJ5LWRlZmluaXRpb24nO1xuaW1wb3J0IHtUaW1pbmdSZXN1bHQsIFRpbWluZ1N0cmF0ZWd5fSBmcm9tICcuLi90aW1pbmctc3RyYXRlZ3knO1xuXG5pbXBvcnQge0RlY2xhcmF0aW9uVXNhZ2VWaXNpdG9yLCBGdW5jdGlvbkNvbnRleHR9IGZyb20gJy4vZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvcic7XG5pbXBvcnQge3VwZGF0ZVN1cGVyQ2xhc3NBYnN0cmFjdE1lbWJlcnNDb250ZXh0fSBmcm9tICcuL3N1cGVyX2NsYXNzX2NvbnRleHQnO1xuaW1wb3J0IHtUZW1wbGF0ZVVzYWdlVmlzaXRvcn0gZnJvbSAnLi90ZW1wbGF0ZV91c2FnZV92aXNpdG9yJztcblxuXG4vKipcbiAqIE9iamVjdCB0aGF0IG1hcHMgYSBnaXZlbiB0eXBlIG9mIHF1ZXJ5IHRvIGEgbGlzdCBvZiBsaWZlY3ljbGUgaG9va3MgdGhhdFxuICogY291bGQgYmUgdXNlZCB0byBhY2Nlc3Mgc3VjaCBhIHF1ZXJ5IHN0YXRpY2FsbHkuXG4gKi9cbmNvbnN0IFNUQVRJQ19RVUVSWV9MSUZFQ1lDTEVfSE9PS1MgPSB7XG4gIFtRdWVyeVR5cGUuVmlld0NoaWxkXTpcbiAgICAgIFsnbmdPbkNoYW5nZXMnLCAnbmdPbkluaXQnLCAnbmdEb0NoZWNrJywgJ25nQWZ0ZXJDb250ZW50SW5pdCcsICduZ0FmdGVyQ29udGVudENoZWNrZWQnXSxcbiAgW1F1ZXJ5VHlwZS5Db250ZW50Q2hpbGRdOiBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjayddLFxufTtcblxuLyoqXG4gKiBRdWVyeSB0aW1pbmcgc3RyYXRlZ3kgdGhhdCBkZXRlcm1pbmVzIHRoZSB0aW1pbmcgb2YgYSBnaXZlbiBxdWVyeSBieSBpbnNwZWN0aW5nIGhvd1xuICogdGhlIHF1ZXJ5IGlzIGFjY2Vzc2VkIHdpdGhpbiB0aGUgcHJvamVjdCdzIFR5cGVTY3JpcHQgc291cmNlIGZpbGVzLiBSZWFkIG1vcmUgYWJvdXRcbiAqIHRoaXMgc3RyYXRlZ3kgaGVyZTogaHR0cHM6Ly9oYWNrbWQuaW8vcy9IeW12YzJPS0VcbiAqL1xuZXhwb3J0IGNsYXNzIFF1ZXJ5VXNhZ2VTdHJhdGVneSBpbXBsZW1lbnRzIFRpbWluZ1N0cmF0ZWd5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwLCBwcml2YXRlIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcikge31cblxuICBzZXR1cCgpIHtcbiAgICAvLyBObyBzZXR1cCBpcyBuZWVkZWQgZm9yIHRoaXMgc3RyYXRlZ3kgYW5kIHRoZXJlZm9yZSB3ZSBhbHdheXMgcmV0dXJuIFwidHJ1ZVwiIGFzXG4gICAgLy8gdGhlIHNldHVwIGlzIHN1Y2Nlc3NmdWwuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQW5hbHl6ZXMgdGhlIHVzYWdlIG9mIHRoZSBnaXZlbiBxdWVyeSBhbmQgZGV0ZXJtaW5lcyB0aGUgcXVlcnkgdGltaW5nIGJhc2VkXG4gICAqIG9uIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeS5cbiAgICovXG4gIGRldGVjdFRpbWluZyhxdWVyeTogTmdRdWVyeURlZmluaXRpb24pOiBUaW1pbmdSZXN1bHQge1xuICAgIHJldHVybiB7XG4gICAgICB0aW1pbmc6XG4gICAgICAgICAgaXNRdWVyeVVzZWRTdGF0aWNhbGx5KHF1ZXJ5LmNvbnRhaW5lciwgcXVlcnksIHRoaXMuY2xhc3NNZXRhZGF0YSwgdGhpcy50eXBlQ2hlY2tlciwgW10pID9cbiAgICAgICAgICBRdWVyeVRpbWluZy5TVEFUSUMgOlxuICAgICAgICAgIFF1ZXJ5VGltaW5nLkRZTkFNSUNcbiAgICB9O1xuICB9XG59XG5cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHF1ZXJ5IGlzIHVzZWQgc3RhdGljYWxseSB3aXRoaW4gdGhlIGdpdmVuIGNsYXNzLCBpdHMgc3VwZXJcbiAqIGNsYXNzIG9yIGRlcml2ZWQgY2xhc3Nlcy5cbiAqL1xuZnVuY3Rpb24gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSxcbiAgICBmdW5jdGlvbkN0eDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpLCB2aXNpdEluaGVyaXRlZENsYXNzZXMgPSB0cnVlKTogYm9vbGVhbiB7XG4gIGNvbnN0IHVzYWdlVmlzaXRvciA9IG5ldyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvcihxdWVyeS5wcm9wZXJ0eSwgdHlwZUNoZWNrZXIsIGZ1bmN0aW9uQ3R4KTtcbiAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGNsYXNzRGVjbCk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBpcyBtZXRhZGF0YSBmb3IgdGhlIGN1cnJlbnQgY2xhc3MsIHdlIGNvbGxlY3QgYWxsIHJlc29sdmVkIEFuZ3VsYXIgaW5wdXRcbiAgLy8gbmFtZXMgYW5kIGFkZCB0aGVtIHRvIHRoZSBsaXN0IG9mIGtub3duIGlucHV0cyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgdXNhZ2VzIG9mXG4gIC8vIHRoZSBjdXJyZW50IHF1ZXJ5LiBlLmcuIHF1ZXJpZXMgdXNlZCBpbiBhbiBASW5wdXQoKSAqc2V0dGVyKiBhcmUgYWx3YXlzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICBrbm93bklucHV0TmFtZXMucHVzaCguLi5jbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyk7XG4gIH1cblxuICAvLyBBcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnkgaW5cbiAgLy8gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuXG4gIGNvbnN0IHBvc3NpYmxlU3RhdGljUXVlcnlOb2RlcyA9IGZpbHRlclF1ZXJ5Q2xhc3NNZW1iZXJOb2RlcyhjbGFzc0RlY2wsIHF1ZXJ5LCBrbm93bklucHV0TmFtZXMpO1xuXG4gIC8vIEluIGNhc2Ugbm9kZXMgdGhhdCBjYW4gcG9zc2libHkgYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseSBoYXZlIGJlZW4gZm91bmQsIGNoZWNrXG4gIC8vIGlmIHRoZSBxdWVyeSBkZWNsYXJhdGlvbiBpcyBzeW5jaHJvbm91c2x5IHVzZWQgd2l0aGluIGFueSBvZiB0aGVzZSBub2Rlcy5cbiAgaWYgKHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5sZW5ndGggJiZcbiAgICAgIHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5zb21lKG4gPT4gdXNhZ2VWaXNpdG9yLmlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUobikpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoIWNsYXNzTWV0YWRhdGEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZXJlIGlzIGEgY29tcG9uZW50IHRlbXBsYXRlIGZvciB0aGUgY3VycmVudCBjbGFzcywgd2UgY2hlY2sgaWYgdGhlXG4gIC8vIHRlbXBsYXRlIHN0YXRpY2FsbHkgYWNjZXNzZXMgdGhlIGN1cnJlbnQgcXVlcnkuIEluIGNhc2UgdGhhdCdzIHRydWUsIHRoZSBxdWVyeVxuICAvLyBjYW4gYmUgbWFya2VkIGFzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEudGVtcGxhdGUgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChxdWVyeS5wcm9wZXJ0eS5uYW1lKSkge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gY2xhc3NNZXRhZGF0YS50ZW1wbGF0ZTtcbiAgICBjb25zdCBwYXJzZWRIdG1sID0gcGFyc2VIdG1sR3JhY2VmdWxseSh0ZW1wbGF0ZS5jb250ZW50LCB0ZW1wbGF0ZS5maWxlUGF0aCk7XG4gICAgY29uc3QgaHRtbFZpc2l0b3IgPSBuZXcgVGVtcGxhdGVVc2FnZVZpc2l0b3IocXVlcnkucHJvcGVydHkubmFtZS50ZXh0KTtcblxuICAgIGlmIChwYXJzZWRIdG1sICYmIGh0bWxWaXNpdG9yLmlzUXVlcnlVc2VkU3RhdGljYWxseShwYXJzZWRIdG1sKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSW4gY2FzZSBkZXJpdmVkIGNsYXNzZXMgc2hvdWxkIGFsc28gYmUgYW5hbHl6ZWQsIHdlIGRldGVybWluZSB0aGUgY2xhc3NlcyB0aGF0IGRlcml2ZVxuICAvLyBmcm9tIHRoZSBjdXJyZW50IGNsYXNzIGFuZCBjaGVjayBpZiB0aGVzZSBoYXZlIGlucHV0IHNldHRlcnMgb3IgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAgLy8gdXNlIHRoZSBxdWVyeSBzdGF0aWNhbGx5LlxuICBpZiAodmlzaXRJbmhlcml0ZWRDbGFzc2VzKSB7XG4gICAgaWYgKGNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXMuc29tZShcbiAgICAgICAgICAgIGRlcml2ZWRDbGFzcyA9PiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgICAgICAgICAgICAgZGVyaXZlZENsYXNzLCBxdWVyeSwgY2xhc3NNZXRhZGF0YU1hcCwgdHlwZUNoZWNrZXIsIGtub3duSW5wdXROYW1lcykpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZSBjdXJyZW50IGNsYXNzIGhhcyBhIHN1cGVyIGNsYXNzLCB3ZSBkZXRlcm1pbmUgZGVjbGFyZWQgYWJzdHJhY3QgZnVuY3Rpb24tbGlrZVxuICAvLyBkZWNsYXJhdGlvbnMgaW4gdGhlIHN1cGVyLWNsYXNzIHRoYXQgYXJlIGltcGxlbWVudGVkIGluIHRoZSBjdXJyZW50IGNsYXNzLiBUaGUgc3VwZXIgY2xhc3NcbiAgLy8gd2lsbCB0aGVuIGJlIGFuYWx5emVkIHdpdGggdGhlIGFic3RyYWN0IGRlY2xhcmF0aW9ucyBtYXBwZWQgdG8gdGhlIGltcGxlbWVudGVkIFR5cGVTY3JpcHRcbiAgLy8gbm9kZXMuIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBxdWVyaWVzIHdoaWNoIGFyZSB1c2VkIGluIHN1cGVyIGNsYXNzZXMgdGhyb3VnaCBkZXJpdmVkXG4gIC8vIGFic3RyYWN0IG1ldGhvZCBkZWNsYXJhdGlvbnMuXG4gIGlmIChjbGFzc01ldGFkYXRhLnN1cGVyQ2xhc3MpIHtcbiAgICBjb25zdCBzdXBlckNsYXNzRGVjbCA9IGNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcztcblxuICAgIC8vIFVwZGF0ZSB0aGUgZnVuY3Rpb24gY29udGV4dCB0byBtYXAgYWJzdHJhY3QgZGVjbGFyYXRpb24gbm9kZXMgdG8gdGhlaXIgaW1wbGVtZW50YXRpb25cbiAgICAvLyBub2RlIGluIHRoZSBiYXNlIGNsYXNzLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgZGVjbGFyYXRpb24gdXNhZ2UgdmlzaXRvciBjYW4gYW5hbHl6ZVxuICAgIC8vIGFic3RyYWN0IGNsYXNzIG1lbWJlciBkZWNsYXJhdGlvbnMuXG4gICAgdXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHQoY2xhc3NEZWNsLCBmdW5jdGlvbkN0eCwgY2xhc3NNZXRhZGF0YU1hcCk7XG5cbiAgICBpZiAoaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgICAgICAgICAgc3VwZXJDbGFzc0RlY2wsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhTWFwLCB0eXBlQ2hlY2tlciwgW10sIGZ1bmN0aW9uQ3R4LCBmYWxzZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG4vKipcbiAqIEZpbHRlcnMgYWxsIGNsYXNzIG1lbWJlcnMgZnJvbSB0aGUgY2xhc3MgZGVjbGFyYXRpb24gdGhhdCBjYW4gYWNjZXNzIHRoZVxuICogZ2l2ZW4gcXVlcnkgc3RhdGljYWxseSAoZS5nLiBuZ09uSW5pdCBsaWZlY3ljbGUgaG9vayBvciBASW5wdXQgc2V0dGVycylcbiAqL1xuZnVuY3Rpb24gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLFxuICAgIGtub3duSW5wdXROYW1lczogc3RyaW5nW10pOiB0cy5CbG9ja1tdIHtcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnlcbiAgLy8gaW4gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuIGUuZy5cbiAgLy8gICgxKSBxdWVyaWVzIHVzZWQgaW4gdGhlIFwibmdPbkluaXRcIiBsaWZlY3ljbGUgaG9vayBhcmUgc3RhdGljLlxuICAvLyAgKDIpIGlucHV0cyB3aXRoIHNldHRlcnMgY2FuIGFjY2VzcyBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gIHJldHVybiBjbGFzc0RlY2wubWVtYmVyc1xuICAgICAgLmZpbHRlcihtID0+IHtcbiAgICAgICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgU1RBVElDX1FVRVJZX0xJRkVDWUNMRV9IT09LU1txdWVyeS50eXBlXS5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIGtub3duSW5wdXROYW1lcyAmJiB0cy5pc1NldEFjY2Vzc29yKG0pICYmIG0uYm9keSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkgJiZcbiAgICAgICAgICAgIGtub3duSW5wdXROYW1lcy5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLm1hcCgobWVtYmVyOiB0cy5TZXRBY2Nlc3NvckRlY2xhcmF0aW9uIHwgdHMuTWV0aG9kRGVjbGFyYXRpb24pID0+IG1lbWJlci5ib2R5ICEpO1xufVxuIl19