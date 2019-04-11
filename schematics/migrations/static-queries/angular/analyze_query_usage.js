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
        define("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", ["require", "exports", "typescript", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", "@angular/core/schematics/migrations/static-queries/angular/query-definition", "@angular/core/schematics/migrations/static-queries/angular/query_read_html_visitor", "@angular/core/schematics/migrations/static-queries/angular/super_class"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const declaration_usage_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    const query_read_html_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/query_read_html_visitor");
    const super_class_1 = require("@angular/core/schematics/migrations/static-queries/angular/super_class");
    /**
     * Object that maps a given type of query to a list of lifecycle hooks that
     * could be used to access such a query statically.
     */
    const STATIC_QUERY_LIFECYCLE_HOOKS = {
        [query_definition_1.QueryType.ViewChild]: ['ngOnChanges', 'ngOnInit', 'ngDoCheck', 'ngAfterContentInit', 'ngAfterContentChecked'],
        [query_definition_1.QueryType.ContentChild]: ['ngOnChanges', 'ngOnInit', 'ngDoCheck'],
    };
    /**
     * Analyzes the usage of the given query and determines the query timing based
     * on the current usage of the query.
     */
    function analyzeNgQueryUsage(query, classMetadata, typeChecker) {
        return isQueryUsedStatically(query.container, query, classMetadata, typeChecker, []) ?
            query_definition_1.QueryTiming.STATIC :
            query_definition_1.QueryTiming.DYNAMIC;
    }
    exports.analyzeNgQueryUsage = analyzeNgQueryUsage;
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
            const htmlVisitor = new query_read_html_visitor_1.QueryReadHtmlVisitor(query.property.name.text);
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
            super_class_1.updateSuperClassAbstractMembersContext(classDecl, functionCtx, classMetadataMap);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV9xdWVyeV91c2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywwRUFBOEQ7SUFDOUQsMkZBQTRFO0lBRTVFLG9JQUFxRjtJQUVyRixrSEFBNkU7SUFDN0UsZ0lBQStEO0lBQy9ELHdHQUFxRTtJQUdyRTs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFDakIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUMzRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztLQUNuRSxDQUFDO0lBRUY7OztPQUdHO0lBQ0gsU0FBZ0IsbUJBQW1CLENBQy9CLEtBQXdCLEVBQUUsYUFBK0IsRUFDekQsV0FBMkI7UUFDN0IsT0FBTyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsOEJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQiw4QkFBVyxDQUFDLE9BQU8sQ0FBQztJQUMxQixDQUFDO0lBTkQsa0RBTUM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLHFCQUFxQixDQUMxQixTQUE4QixFQUFFLEtBQXdCLEVBQUUsZ0JBQWtDLEVBQzVGLFdBQTJCLEVBQUUsZUFBeUIsRUFDdEQsY0FBK0IsSUFBSSxHQUFHLEVBQUUsRUFBRSxxQkFBcUIsR0FBRyxJQUFJO1FBQ3hFLE1BQU0sWUFBWSxHQUFHLElBQUksbURBQXVCLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDM0YsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXRELHlGQUF5RjtRQUN6Rix1RkFBdUY7UUFDdkYsa0ZBQWtGO1FBQ2xGLElBQUksYUFBYSxFQUFFO1lBQ2pCLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDckQ7UUFFRCwyRUFBMkU7UUFDM0UsaUNBQWlDO1FBQ2pDLE1BQU0sd0JBQXdCLEdBQUcsMkJBQTJCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztRQUVoRyxtRkFBbUY7UUFDbkYsNEVBQTRFO1FBQzVFLElBQUksd0JBQXdCLENBQUMsTUFBTTtZQUMvQix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNqRixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsK0VBQStFO1FBQy9FLGlGQUFpRjtRQUNqRiwyQkFBMkI7UUFDM0IsSUFBSSxhQUFhLENBQUMsUUFBUSxJQUFJLG1DQUFtQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEUsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQztZQUN4QyxNQUFNLFVBQVUsR0FBRyxnQ0FBbUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RSxNQUFNLFdBQVcsR0FBRyxJQUFJLDhDQUFvQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZFLElBQUksVUFBVSxJQUFJLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDL0QsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsd0ZBQXdGO1FBQ3hGLHVGQUF1RjtRQUN2Riw0QkFBNEI7UUFDNUIsSUFBSSxxQkFBcUIsRUFBRTtZQUN6QixJQUFJLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUM3QixZQUFZLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUNqQyxZQUFZLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQyxFQUFFO2dCQUNqRixPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFFRCw0RkFBNEY7UUFDNUYsNkZBQTZGO1FBQzdGLDRGQUE0RjtRQUM1RiwwRkFBMEY7UUFDMUYsZ0NBQWdDO1FBQ2hDLElBQUksYUFBYSxDQUFDLFVBQVUsRUFBRTtZQUM1QixNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDO1lBRWhELHdGQUF3RjtZQUN4RixzRkFBc0Y7WUFDdEYsc0NBQXNDO1lBQ3RDLG9EQUFzQyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUVqRixJQUFJLHFCQUFxQixDQUNqQixjQUFjLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUNyRixPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFHRDs7O09BR0c7SUFDSCxTQUFTLDJCQUEyQixDQUNoQyxTQUE4QixFQUFFLEtBQXdCLEVBQ3hELGVBQXlCO1FBQzNCLG1GQUFtRjtRQUNuRix5Q0FBeUM7UUFDekMsaUVBQWlFO1FBQ2pFLDBEQUEwRDtRQUMxRCxPQUFPLFNBQVMsQ0FBQyxPQUFPO2FBQ25CLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNWLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbEUsNEJBQTRCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN4RSxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNLElBQ0gsZUFBZSxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMvRSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxDQUFDLE1BQXdELEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFNLENBQUMsQ0FBQztJQUN4RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtwYXJzZUh0bWxHcmFjZWZ1bGx5fSBmcm9tICcuLi8uLi8uLi91dGlscy9wYXJzZV9odG1sJztcbmltcG9ydCB7aGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcblxuaW1wb3J0IHtEZWNsYXJhdGlvblVzYWdlVmlzaXRvciwgRnVuY3Rpb25Db250ZXh0fSBmcm9tICcuL2RlY2xhcmF0aW9uX3VzYWdlX3Zpc2l0b3InO1xuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7UXVlcnlSZWFkSHRtbFZpc2l0b3J9IGZyb20gJy4vcXVlcnlfcmVhZF9odG1sX3Zpc2l0b3InO1xuaW1wb3J0IHt1cGRhdGVTdXBlckNsYXNzQWJzdHJhY3RNZW1iZXJzQ29udGV4dH0gZnJvbSAnLi9zdXBlcl9jbGFzcyc7XG5cblxuLyoqXG4gKiBPYmplY3QgdGhhdCBtYXBzIGEgZ2l2ZW4gdHlwZSBvZiBxdWVyeSB0byBhIGxpc3Qgb2YgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAqIGNvdWxkIGJlIHVzZWQgdG8gYWNjZXNzIHN1Y2ggYSBxdWVyeSBzdGF0aWNhbGx5LlxuICovXG5jb25zdCBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTID0ge1xuICBbUXVlcnlUeXBlLlZpZXdDaGlsZF06XG4gICAgICBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjaycsICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ10sXG4gIFtRdWVyeVR5cGUuQ29udGVudENoaWxkXTogWyduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snXSxcbn07XG5cbi8qKlxuICogQW5hbHl6ZXMgdGhlIHVzYWdlIG9mIHRoZSBnaXZlbiBxdWVyeSBhbmQgZGV0ZXJtaW5lcyB0aGUgcXVlcnkgdGltaW5nIGJhc2VkXG4gKiBvbiB0aGUgY3VycmVudCB1c2FnZSBvZiB0aGUgcXVlcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplTmdRdWVyeVVzYWdlKFxuICAgIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCxcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBRdWVyeVRpbWluZyB7XG4gIHJldHVybiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkocXVlcnkuY29udGFpbmVyLCBxdWVyeSwgY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIsIFtdKSA/XG4gICAgICBRdWVyeVRpbWluZy5TVEFUSUMgOlxuICAgICAgUXVlcnlUaW1pbmcuRFlOQU1JQztcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHF1ZXJ5IGlzIHVzZWQgc3RhdGljYWxseSB3aXRoaW4gdGhlIGdpdmVuIGNsYXNzLCBpdHMgc3VwZXJcbiAqIGNsYXNzIG9yIGRlcml2ZWQgY2xhc3Nlcy5cbiAqL1xuZnVuY3Rpb24gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSxcbiAgICBmdW5jdGlvbkN0eDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpLCB2aXNpdEluaGVyaXRlZENsYXNzZXMgPSB0cnVlKTogYm9vbGVhbiB7XG4gIGNvbnN0IHVzYWdlVmlzaXRvciA9IG5ldyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvcihxdWVyeS5wcm9wZXJ0eSwgdHlwZUNoZWNrZXIsIGZ1bmN0aW9uQ3R4KTtcbiAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGNsYXNzRGVjbCk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBpcyBtZXRhZGF0YSBmb3IgdGhlIGN1cnJlbnQgY2xhc3MsIHdlIGNvbGxlY3QgYWxsIHJlc29sdmVkIEFuZ3VsYXIgaW5wdXRcbiAgLy8gbmFtZXMgYW5kIGFkZCB0aGVtIHRvIHRoZSBsaXN0IG9mIGtub3duIGlucHV0cyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgdXNhZ2VzIG9mXG4gIC8vIHRoZSBjdXJyZW50IHF1ZXJ5LiBlLmcuIHF1ZXJpZXMgdXNlZCBpbiBhbiBASW5wdXQoKSAqc2V0dGVyKiBhcmUgYWx3YXlzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICBrbm93bklucHV0TmFtZXMucHVzaCguLi5jbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyk7XG4gIH1cblxuICAvLyBBcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnkgaW5cbiAgLy8gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuXG4gIGNvbnN0IHBvc3NpYmxlU3RhdGljUXVlcnlOb2RlcyA9IGZpbHRlclF1ZXJ5Q2xhc3NNZW1iZXJOb2RlcyhjbGFzc0RlY2wsIHF1ZXJ5LCBrbm93bklucHV0TmFtZXMpO1xuXG4gIC8vIEluIGNhc2Ugbm9kZXMgdGhhdCBjYW4gcG9zc2libHkgYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseSBoYXZlIGJlZW4gZm91bmQsIGNoZWNrXG4gIC8vIGlmIHRoZSBxdWVyeSBkZWNsYXJhdGlvbiBpcyBzeW5jaHJvbm91c2x5IHVzZWQgd2l0aGluIGFueSBvZiB0aGVzZSBub2Rlcy5cbiAgaWYgKHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5sZW5ndGggJiZcbiAgICAgIHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5zb21lKG4gPT4gdXNhZ2VWaXNpdG9yLmlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUobikpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoIWNsYXNzTWV0YWRhdGEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZXJlIGlzIGEgY29tcG9uZW50IHRlbXBsYXRlIGZvciB0aGUgY3VycmVudCBjbGFzcywgd2UgY2hlY2sgaWYgdGhlXG4gIC8vIHRlbXBsYXRlIHN0YXRpY2FsbHkgYWNjZXNzZXMgdGhlIGN1cnJlbnQgcXVlcnkuIEluIGNhc2UgdGhhdCdzIHRydWUsIHRoZSBxdWVyeVxuICAvLyBjYW4gYmUgbWFya2VkIGFzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEudGVtcGxhdGUgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChxdWVyeS5wcm9wZXJ0eS5uYW1lKSkge1xuICAgIGNvbnN0IHRlbXBsYXRlID0gY2xhc3NNZXRhZGF0YS50ZW1wbGF0ZTtcbiAgICBjb25zdCBwYXJzZWRIdG1sID0gcGFyc2VIdG1sR3JhY2VmdWxseSh0ZW1wbGF0ZS5jb250ZW50LCB0ZW1wbGF0ZS5maWxlUGF0aCk7XG4gICAgY29uc3QgaHRtbFZpc2l0b3IgPSBuZXcgUXVlcnlSZWFkSHRtbFZpc2l0b3IocXVlcnkucHJvcGVydHkubmFtZS50ZXh0KTtcblxuICAgIGlmIChwYXJzZWRIdG1sICYmIGh0bWxWaXNpdG9yLmlzUXVlcnlVc2VkU3RhdGljYWxseShwYXJzZWRIdG1sKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSW4gY2FzZSBkZXJpdmVkIGNsYXNzZXMgc2hvdWxkIGFsc28gYmUgYW5hbHl6ZWQsIHdlIGRldGVybWluZSB0aGUgY2xhc3NlcyB0aGF0IGRlcml2ZVxuICAvLyBmcm9tIHRoZSBjdXJyZW50IGNsYXNzIGFuZCBjaGVjayBpZiB0aGVzZSBoYXZlIGlucHV0IHNldHRlcnMgb3IgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAgLy8gdXNlIHRoZSBxdWVyeSBzdGF0aWNhbGx5LlxuICBpZiAodmlzaXRJbmhlcml0ZWRDbGFzc2VzKSB7XG4gICAgaWYgKGNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXMuc29tZShcbiAgICAgICAgICAgIGRlcml2ZWRDbGFzcyA9PiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgICAgICAgICAgICAgZGVyaXZlZENsYXNzLCBxdWVyeSwgY2xhc3NNZXRhZGF0YU1hcCwgdHlwZUNoZWNrZXIsIGtub3duSW5wdXROYW1lcykpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZSBjdXJyZW50IGNsYXNzIGhhcyBhIHN1cGVyIGNsYXNzLCB3ZSBkZXRlcm1pbmUgZGVjbGFyZWQgYWJzdHJhY3QgZnVuY3Rpb24tbGlrZVxuICAvLyBkZWNsYXJhdGlvbnMgaW4gdGhlIHN1cGVyLWNsYXNzIHRoYXQgYXJlIGltcGxlbWVudGVkIGluIHRoZSBjdXJyZW50IGNsYXNzLiBUaGUgc3VwZXIgY2xhc3NcbiAgLy8gd2lsbCB0aGVuIGJlIGFuYWx5emVkIHdpdGggdGhlIGFic3RyYWN0IGRlY2xhcmF0aW9ucyBtYXBwZWQgdG8gdGhlIGltcGxlbWVudGVkIFR5cGVTY3JpcHRcbiAgLy8gbm9kZXMuIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBxdWVyaWVzIHdoaWNoIGFyZSB1c2VkIGluIHN1cGVyIGNsYXNzZXMgdGhyb3VnaCBkZXJpdmVkXG4gIC8vIGFic3RyYWN0IG1ldGhvZCBkZWNsYXJhdGlvbnMuXG4gIGlmIChjbGFzc01ldGFkYXRhLnN1cGVyQ2xhc3MpIHtcbiAgICBjb25zdCBzdXBlckNsYXNzRGVjbCA9IGNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcztcblxuICAgIC8vIFVwZGF0ZSB0aGUgZnVuY3Rpb24gY29udGV4dCB0byBtYXAgYWJzdHJhY3QgZGVjbGFyYXRpb24gbm9kZXMgdG8gdGhlaXIgaW1wbGVtZW50YXRpb25cbiAgICAvLyBub2RlIGluIHRoZSBiYXNlIGNsYXNzLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgZGVjbGFyYXRpb24gdXNhZ2UgdmlzaXRvciBjYW4gYW5hbHl6ZVxuICAgIC8vIGFic3RyYWN0IGNsYXNzIG1lbWJlciBkZWNsYXJhdGlvbnMuXG4gICAgdXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHQoY2xhc3NEZWNsLCBmdW5jdGlvbkN0eCwgY2xhc3NNZXRhZGF0YU1hcCk7XG5cbiAgICBpZiAoaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgICAgICAgICAgc3VwZXJDbGFzc0RlY2wsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhTWFwLCB0eXBlQ2hlY2tlciwgW10sIGZ1bmN0aW9uQ3R4LCBmYWxzZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG4vKipcbiAqIEZpbHRlcnMgYWxsIGNsYXNzIG1lbWJlcnMgZnJvbSB0aGUgY2xhc3MgZGVjbGFyYXRpb24gdGhhdCBjYW4gYWNjZXNzIHRoZVxuICogZ2l2ZW4gcXVlcnkgc3RhdGljYWxseSAoZS5nLiBuZ09uSW5pdCBsaWZlY3ljbGUgaG9vayBvciBASW5wdXQgc2V0dGVycylcbiAqL1xuZnVuY3Rpb24gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLFxuICAgIGtub3duSW5wdXROYW1lczogc3RyaW5nW10pOiB0cy5CbG9ja1tdIHtcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnlcbiAgLy8gaW4gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuIGUuZy5cbiAgLy8gICgxKSBxdWVyaWVzIHVzZWQgaW4gdGhlIFwibmdPbkluaXRcIiBsaWZlY3ljbGUgaG9vayBhcmUgc3RhdGljLlxuICAvLyAgKDIpIGlucHV0cyB3aXRoIHNldHRlcnMgY2FuIGFjY2VzcyBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gIHJldHVybiBjbGFzc0RlY2wubWVtYmVyc1xuICAgICAgLmZpbHRlcihtID0+IHtcbiAgICAgICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgU1RBVElDX1FVRVJZX0xJRkVDWUNMRV9IT09LU1txdWVyeS50eXBlXS5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIGtub3duSW5wdXROYW1lcyAmJiB0cy5pc1NldEFjY2Vzc29yKG0pICYmIG0uYm9keSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkgJiZcbiAgICAgICAgICAgIGtub3duSW5wdXROYW1lcy5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLm1hcCgobWVtYmVyOiB0cy5TZXRBY2Nlc3NvckRlY2xhcmF0aW9uIHwgdHMuTWV0aG9kRGVjbGFyYXRpb24pID0+IG1lbWJlci5ib2R5ICEpO1xufVxuIl19