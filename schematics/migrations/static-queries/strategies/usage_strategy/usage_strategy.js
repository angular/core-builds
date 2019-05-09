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
        setup() { }
        /**
         * Analyzes the usage of the given query and determines the query timing based
         * on the current usage of the query.
         */
        detectTiming(query) {
            if (query.property === null) {
                return { timing: null, message: 'Queries defined on accessors cannot be analyzed.' };
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNhZ2Vfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLDBFQUFpRTtJQUNqRSwyRkFBK0U7SUFFL0Usa0hBQXlGO0lBR3pGLHNKQUFxRjtJQUNyRiwwSUFBNkU7SUFDN0UsZ0pBQThEO0lBRzlEOzs7T0FHRztJQUNILE1BQU0sNEJBQTRCLEdBQUc7UUFDbkMsQ0FBQyw0QkFBUyxDQUFDLFNBQVMsQ0FBQyxFQUNqQixDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixDQUFDO1FBQzNGLENBQUMsNEJBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDO0tBQ25FLENBQUM7SUFFRjs7OztPQUlHO0lBQ0gsTUFBYSxrQkFBa0I7UUFDN0IsWUFBb0IsYUFBK0IsRUFBVSxXQUEyQjtZQUFwRSxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7UUFBRyxDQUFDO1FBRTVGLEtBQUssS0FBSSxDQUFDO1FBRVY7OztXQUdHO1FBQ0gsWUFBWSxDQUFDLEtBQXdCO1lBQ25DLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUU7Z0JBQzNCLE9BQU8sRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxrREFBa0QsRUFBQyxDQUFDO2FBQ3BGO1lBRUQsT0FBTztnQkFDTCxNQUFNLEVBQ0YscUJBQXFCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFL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IFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge3BhcnNlSHRtbEdyYWNlZnVsbHl9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3BhcnNlX2h0bWwnO1xuaW1wb3J0IHtoYXNQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuLi8uLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi4vLi4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7VGltaW5nUmVzdWx0LCBUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi4vdGltaW5nLXN0cmF0ZWd5JztcblxuaW1wb3J0IHtEZWNsYXJhdGlvblVzYWdlVmlzaXRvciwgRnVuY3Rpb25Db250ZXh0fSBmcm9tICcuL2RlY2xhcmF0aW9uX3VzYWdlX3Zpc2l0b3InO1xuaW1wb3J0IHt1cGRhdGVTdXBlckNsYXNzQWJzdHJhY3RNZW1iZXJzQ29udGV4dH0gZnJvbSAnLi9zdXBlcl9jbGFzc19jb250ZXh0JztcbmltcG9ydCB7VGVtcGxhdGVVc2FnZVZpc2l0b3J9IGZyb20gJy4vdGVtcGxhdGVfdXNhZ2VfdmlzaXRvcic7XG5cblxuLyoqXG4gKiBPYmplY3QgdGhhdCBtYXBzIGEgZ2l2ZW4gdHlwZSBvZiBxdWVyeSB0byBhIGxpc3Qgb2YgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAqIGNvdWxkIGJlIHVzZWQgdG8gYWNjZXNzIHN1Y2ggYSBxdWVyeSBzdGF0aWNhbGx5LlxuICovXG5jb25zdCBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTID0ge1xuICBbUXVlcnlUeXBlLlZpZXdDaGlsZF06XG4gICAgICBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjaycsICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ10sXG4gIFtRdWVyeVR5cGUuQ29udGVudENoaWxkXTogWyduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snXSxcbn07XG5cbi8qKlxuICogUXVlcnkgdGltaW5nIHN0cmF0ZWd5IHRoYXQgZGV0ZXJtaW5lcyB0aGUgdGltaW5nIG9mIGEgZ2l2ZW4gcXVlcnkgYnkgaW5zcGVjdGluZyBob3dcbiAqIHRoZSBxdWVyeSBpcyBhY2Nlc3NlZCB3aXRoaW4gdGhlIHByb2plY3QncyBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcy4gUmVhZCBtb3JlIGFib3V0XG4gKiB0aGlzIHN0cmF0ZWd5IGhlcmU6IGh0dHBzOi8vaGFja21kLmlvL3MvSHltdmMyT0tFXG4gKi9cbmV4cG9ydCBjbGFzcyBRdWVyeVVzYWdlU3RyYXRlZ3kgaW1wbGVtZW50cyBUaW1pbmdTdHJhdGVneSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCwgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHt9XG5cbiAgc2V0dXAoKSB7fVxuXG4gIC8qKlxuICAgKiBBbmFseXplcyB0aGUgdXNhZ2Ugb2YgdGhlIGdpdmVuIHF1ZXJ5IGFuZCBkZXRlcm1pbmVzIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWRcbiAgICogb24gdGhlIGN1cnJlbnQgdXNhZ2Ugb2YgdGhlIHF1ZXJ5LlxuICAgKi9cbiAgZGV0ZWN0VGltaW5nKHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbik6IFRpbWluZ1Jlc3VsdCB7XG4gICAgaWYgKHF1ZXJ5LnByb3BlcnR5ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ1F1ZXJpZXMgZGVmaW5lZCBvbiBhY2Nlc3NvcnMgY2Fubm90IGJlIGFuYWx5emVkLid9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0aW1pbmc6XG4gICAgICAgICAgaXNRdWVyeVVzZWRTdGF0aWNhbGx5KHF1ZXJ5LmNvbnRhaW5lciwgcXVlcnksIHRoaXMuY2xhc3NNZXRhZGF0YSwgdGhpcy50eXBlQ2hlY2tlciwgW10pID9cbiAgICAgICAgICBRdWVyeVRpbWluZy5TVEFUSUMgOlxuICAgICAgICAgIFF1ZXJ5VGltaW5nLkRZTkFNSUNcbiAgICB9O1xuICB9XG59XG5cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHF1ZXJ5IGlzIHVzZWQgc3RhdGljYWxseSB3aXRoaW4gdGhlIGdpdmVuIGNsYXNzLCBpdHMgc3VwZXJcbiAqIGNsYXNzIG9yIGRlcml2ZWQgY2xhc3Nlcy5cbiAqL1xuZnVuY3Rpb24gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSxcbiAgICBmdW5jdGlvbkN0eDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpLCB2aXNpdEluaGVyaXRlZENsYXNzZXMgPSB0cnVlKTogYm9vbGVhbiB7XG4gIGNvbnN0IHVzYWdlVmlzaXRvciA9IG5ldyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvcihxdWVyeS5wcm9wZXJ0eSAhLCB0eXBlQ2hlY2tlciwgZnVuY3Rpb25DdHgpO1xuICBjb25zdCBjbGFzc01ldGFkYXRhID0gY2xhc3NNZXRhZGF0YU1hcC5nZXQoY2xhc3NEZWNsKTtcblxuICAvLyBJbiBjYXNlIHRoZXJlIGlzIG1ldGFkYXRhIGZvciB0aGUgY3VycmVudCBjbGFzcywgd2UgY29sbGVjdCBhbGwgcmVzb2x2ZWQgQW5ndWxhciBpbnB1dFxuICAvLyBuYW1lcyBhbmQgYWRkIHRoZW0gdG8gdGhlIGxpc3Qgb2Yga25vd24gaW5wdXRzIHRoYXQgbmVlZCB0byBiZSBjaGVja2VkIGZvciB1c2FnZXMgb2ZcbiAgLy8gdGhlIGN1cnJlbnQgcXVlcnkuIGUuZy4gcXVlcmllcyB1c2VkIGluIGFuIEBJbnB1dCgpICpzZXR0ZXIqIGFyZSBhbHdheXMgc3RhdGljLlxuICBpZiAoY2xhc3NNZXRhZGF0YSkge1xuICAgIGtub3duSW5wdXROYW1lcy5wdXNoKC4uLmNsYXNzTWV0YWRhdGEubmdJbnB1dE5hbWVzKTtcbiAgfVxuXG4gIC8vIEFycmF5IG9mIFR5cGVTY3JpcHQgbm9kZXMgd2hpY2ggY2FuIGNvbnRhaW4gdXNhZ2VzIG9mIHRoZSBnaXZlbiBxdWVyeSBpblxuICAvLyBvcmRlciB0byBhY2Nlc3MgaXQgc3RhdGljYWxseS5cbiAgY29uc3QgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzID0gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKGNsYXNzRGVjbCwgcXVlcnksIGtub3duSW5wdXROYW1lcyk7XG5cbiAgLy8gSW4gY2FzZSBub2RlcyB0aGF0IGNhbiBwb3NzaWJseSBhY2Nlc3MgYSBxdWVyeSBzdGF0aWNhbGx5IGhhdmUgYmVlbiBmb3VuZCwgY2hlY2tcbiAgLy8gaWYgdGhlIHF1ZXJ5IGRlY2xhcmF0aW9uIGlzIHN5bmNocm9ub3VzbHkgdXNlZCB3aXRoaW4gYW55IG9mIHRoZXNlIG5vZGVzLlxuICBpZiAocG9zc2libGVTdGF0aWNRdWVyeU5vZGVzLmxlbmd0aCAmJlxuICAgICAgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzLnNvbWUobiA9PiB1c2FnZVZpc2l0b3IuaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShuKSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICghY2xhc3NNZXRhZGF0YSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIEluIGNhc2UgdGhlcmUgaXMgYSBjb21wb25lbnQgdGVtcGxhdGUgZm9yIHRoZSBjdXJyZW50IGNsYXNzLCB3ZSBjaGVjayBpZiB0aGVcbiAgLy8gdGVtcGxhdGUgc3RhdGljYWxseSBhY2Nlc3NlcyB0aGUgY3VycmVudCBxdWVyeS4gSW4gY2FzZSB0aGF0J3MgdHJ1ZSwgdGhlIHF1ZXJ5XG4gIC8vIGNhbiBiZSBtYXJrZWQgYXMgc3RhdGljLlxuICBpZiAoY2xhc3NNZXRhZGF0YS50ZW1wbGF0ZSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KHF1ZXJ5LnByb3BlcnR5ICEubmFtZSkpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IGNsYXNzTWV0YWRhdGEudGVtcGxhdGU7XG4gICAgY29uc3QgcGFyc2VkSHRtbCA9IHBhcnNlSHRtbEdyYWNlZnVsbHkodGVtcGxhdGUuY29udGVudCwgdGVtcGxhdGUuZmlsZVBhdGgpO1xuICAgIGNvbnN0IGh0bWxWaXNpdG9yID0gbmV3IFRlbXBsYXRlVXNhZ2VWaXNpdG9yKHF1ZXJ5LnByb3BlcnR5ICEubmFtZS50ZXh0KTtcblxuICAgIGlmIChwYXJzZWRIdG1sICYmIGh0bWxWaXNpdG9yLmlzUXVlcnlVc2VkU3RhdGljYWxseShwYXJzZWRIdG1sKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gSW4gY2FzZSBkZXJpdmVkIGNsYXNzZXMgc2hvdWxkIGFsc28gYmUgYW5hbHl6ZWQsIHdlIGRldGVybWluZSB0aGUgY2xhc3NlcyB0aGF0IGRlcml2ZVxuICAvLyBmcm9tIHRoZSBjdXJyZW50IGNsYXNzIGFuZCBjaGVjayBpZiB0aGVzZSBoYXZlIGlucHV0IHNldHRlcnMgb3IgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAgLy8gdXNlIHRoZSBxdWVyeSBzdGF0aWNhbGx5LlxuICBpZiAodmlzaXRJbmhlcml0ZWRDbGFzc2VzKSB7XG4gICAgaWYgKGNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXMuc29tZShcbiAgICAgICAgICAgIGRlcml2ZWRDbGFzcyA9PiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgICAgICAgICAgICAgZGVyaXZlZENsYXNzLCBxdWVyeSwgY2xhc3NNZXRhZGF0YU1hcCwgdHlwZUNoZWNrZXIsIGtub3duSW5wdXROYW1lcykpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZSBjdXJyZW50IGNsYXNzIGhhcyBhIHN1cGVyIGNsYXNzLCB3ZSBkZXRlcm1pbmUgZGVjbGFyZWQgYWJzdHJhY3QgZnVuY3Rpb24tbGlrZVxuICAvLyBkZWNsYXJhdGlvbnMgaW4gdGhlIHN1cGVyLWNsYXNzIHRoYXQgYXJlIGltcGxlbWVudGVkIGluIHRoZSBjdXJyZW50IGNsYXNzLiBUaGUgc3VwZXIgY2xhc3NcbiAgLy8gd2lsbCB0aGVuIGJlIGFuYWx5emVkIHdpdGggdGhlIGFic3RyYWN0IGRlY2xhcmF0aW9ucyBtYXBwZWQgdG8gdGhlIGltcGxlbWVudGVkIFR5cGVTY3JpcHRcbiAgLy8gbm9kZXMuIFRoaXMgYWxsb3dzIHVzIHRvIGhhbmRsZSBxdWVyaWVzIHdoaWNoIGFyZSB1c2VkIGluIHN1cGVyIGNsYXNzZXMgdGhyb3VnaCBkZXJpdmVkXG4gIC8vIGFic3RyYWN0IG1ldGhvZCBkZWNsYXJhdGlvbnMuXG4gIGlmIChjbGFzc01ldGFkYXRhLnN1cGVyQ2xhc3MpIHtcbiAgICBjb25zdCBzdXBlckNsYXNzRGVjbCA9IGNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcztcblxuICAgIC8vIFVwZGF0ZSB0aGUgZnVuY3Rpb24gY29udGV4dCB0byBtYXAgYWJzdHJhY3QgZGVjbGFyYXRpb24gbm9kZXMgdG8gdGhlaXIgaW1wbGVtZW50YXRpb25cbiAgICAvLyBub2RlIGluIHRoZSBiYXNlIGNsYXNzLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGUgZGVjbGFyYXRpb24gdXNhZ2UgdmlzaXRvciBjYW4gYW5hbHl6ZVxuICAgIC8vIGFic3RyYWN0IGNsYXNzIG1lbWJlciBkZWNsYXJhdGlvbnMuXG4gICAgdXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHQoY2xhc3NEZWNsLCBmdW5jdGlvbkN0eCwgY2xhc3NNZXRhZGF0YU1hcCk7XG5cbiAgICBpZiAoaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgICAgICAgICAgc3VwZXJDbGFzc0RlY2wsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhTWFwLCB0eXBlQ2hlY2tlciwgW10sIGZ1bmN0aW9uQ3R4LCBmYWxzZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG4vKipcbiAqIEZpbHRlcnMgYWxsIGNsYXNzIG1lbWJlcnMgZnJvbSB0aGUgY2xhc3MgZGVjbGFyYXRpb24gdGhhdCBjYW4gYWNjZXNzIHRoZVxuICogZ2l2ZW4gcXVlcnkgc3RhdGljYWxseSAoZS5nLiBuZ09uSW5pdCBsaWZlY3ljbGUgaG9vayBvciBASW5wdXQgc2V0dGVycylcbiAqL1xuZnVuY3Rpb24gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLFxuICAgIGtub3duSW5wdXROYW1lczogc3RyaW5nW10pOiB0cy5CbG9ja1tdIHtcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnlcbiAgLy8gaW4gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuIGUuZy5cbiAgLy8gICgxKSBxdWVyaWVzIHVzZWQgaW4gdGhlIFwibmdPbkluaXRcIiBsaWZlY3ljbGUgaG9vayBhcmUgc3RhdGljLlxuICAvLyAgKDIpIGlucHV0cyB3aXRoIHNldHRlcnMgY2FuIGFjY2VzcyBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gIHJldHVybiBjbGFzc0RlY2wubWVtYmVyc1xuICAgICAgLmZpbHRlcihtID0+IHtcbiAgICAgICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgU1RBVElDX1FVRVJZX0xJRkVDWUNMRV9IT09LU1txdWVyeS50eXBlXS5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIGtub3duSW5wdXROYW1lcyAmJiB0cy5pc1NldEFjY2Vzc29yKG0pICYmIG0uYm9keSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkgJiZcbiAgICAgICAgICAgIGtub3duSW5wdXROYW1lcy5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLm1hcCgobWVtYmVyOiB0cy5TZXRBY2Nlc3NvckRlY2xhcmF0aW9uIHwgdHMuTWV0aG9kRGVjbGFyYXRpb24pID0+IG1lbWJlci5ib2R5ICEpO1xufVxuIl19