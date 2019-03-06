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
        define("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", ["require", "exports", "typescript", "@angular/core/schematics/migrations/static-queries/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/migrations/static-queries/typescript/property_name");
    const declaration_usage_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
    /**
     * Object that maps a given type of query to a list of lifecycle hooks that
     * could be used to access such a query statically.
     */
    const STATIC_QUERY_LIFECYCLE_HOOKS = {
        [query_definition_1.QueryType.ViewChild]: ['ngOnInit', 'ngAfterContentInit', 'ngAfterContentChecked'],
        [query_definition_1.QueryType.ContentChild]: ['ngOnInit'],
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
    /** Checks whether a given class or it's derived classes use the specified query statically. */
    function isQueryUsedStatically(classDecl, query, classMetadataMap, typeChecker, knownInputNames) {
        const usageVisitor = new declaration_usage_visitor_1.DeclarationUsageVisitor(query.property, typeChecker);
        const classMetadata = classMetadataMap.get(classDecl);
        // In case there is metadata for the current class, we collect all resolved Angular input
        // names and add them to the list of known inputs that need to be checked for usages of
        // the current query. e.g. queries used in an @Input() *setter* are always static.
        if (classMetadata) {
            knownInputNames.push(...classMetadata.ngInputNames);
        }
        // List of TypeScript nodes which can contain usages of the given query in order to
        // access it statically. e.g.
        //  (1) queries used in the "ngOnInit" lifecycle hook are static.
        //  (2) inputs with setters can access queries statically.
        const possibleStaticQueryNodes = classDecl.members.filter(m => {
            if (ts.isMethodDeclaration(m) && property_name_1.hasPropertyNameText(m.name) &&
                STATIC_QUERY_LIFECYCLE_HOOKS[query.type].indexOf(m.name.text) !== -1) {
                return true;
            }
            else if (knownInputNames && ts.isSetAccessor(m) && property_name_1.hasPropertyNameText(m.name) &&
                knownInputNames.indexOf(m.name.text) !== -1) {
                return true;
            }
            return false;
        });
        // In case nodes that can possibly access a query statically have been found, check
        // if the query declaration is used within any of these nodes.
        if (possibleStaticQueryNodes.length &&
            possibleStaticQueryNodes.some(hookNode => usageVisitor.isUsedInNode(hookNode))) {
            return true;
        }
        // In case there are classes that derive from the current class, visit each
        // derived class as inherited queries could be used statically.
        if (classMetadata) {
            return classMetadata.derivedClasses.some(derivedClass => isQueryUsedStatically(derivedClass, query, classMetadataMap, typeChecker, knownInputNames));
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV9xdWVyeV91c2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywrR0FBZ0U7SUFDaEUsb0lBQW9FO0lBRXBFLGtIQUE2RTtJQUc3RTs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUNsRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7S0FDdkMsQ0FBQztJQUVGOzs7T0FHRztJQUNILFNBQWdCLG1CQUFtQixDQUMvQixLQUF3QixFQUFFLGFBQStCLEVBQ3pELFdBQTJCO1FBQzdCLE9BQU8scUJBQXFCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEIsOEJBQVcsQ0FBQyxPQUFPLENBQUM7SUFDMUIsQ0FBQztJQU5ELGtEQU1DO0lBRUQsK0ZBQStGO0lBQy9GLFNBQVMscUJBQXFCLENBQzFCLFNBQThCLEVBQUUsS0FBd0IsRUFBRSxnQkFBa0MsRUFDNUYsV0FBMkIsRUFBRSxlQUF5QjtRQUN4RCxNQUFNLFlBQVksR0FBRyxJQUFJLG1EQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDOUUsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXRELHlGQUF5RjtRQUN6Rix1RkFBdUY7UUFDdkYsa0ZBQWtGO1FBQ2xGLElBQUksYUFBYSxFQUFFO1lBQ2pCLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDckQ7UUFFRCxtRkFBbUY7UUFDbkYsNkJBQTZCO1FBQzdCLGlFQUFpRTtRQUNqRSwwREFBMEQ7UUFDMUQsTUFBTSx3QkFBd0IsR0FBYyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN2RSxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUN4RCw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hFLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU0sSUFDSCxlQUFlLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNyRSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsbUZBQW1GO1FBQ25GLDhEQUE4RDtRQUM5RCxJQUFJLHdCQUF3QixDQUFDLE1BQU07WUFDL0Isd0JBQXdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFO1lBQ2xGLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCwyRUFBMkU7UUFDM0UsK0RBQStEO1FBQy9ELElBQUksYUFBYSxFQUFFO1lBQ2pCLE9BQU8sYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQ3BDLFlBQVksQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQ2pDLFlBQVksRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7U0FDL0U7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2hhc1Byb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5pbXBvcnQge0RlY2xhcmF0aW9uVXNhZ2VWaXNpdG9yfSBmcm9tICcuL2RlY2xhcmF0aW9uX3VzYWdlX3Zpc2l0b3InO1xuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi9xdWVyeS1kZWZpbml0aW9uJztcblxuXG4vKipcbiAqIE9iamVjdCB0aGF0IG1hcHMgYSBnaXZlbiB0eXBlIG9mIHF1ZXJ5IHRvIGEgbGlzdCBvZiBsaWZlY3ljbGUgaG9va3MgdGhhdFxuICogY291bGQgYmUgdXNlZCB0byBhY2Nlc3Mgc3VjaCBhIHF1ZXJ5IHN0YXRpY2FsbHkuXG4gKi9cbmNvbnN0IFNUQVRJQ19RVUVSWV9MSUZFQ1lDTEVfSE9PS1MgPSB7XG4gIFtRdWVyeVR5cGUuVmlld0NoaWxkXTogWyduZ09uSW5pdCcsICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ10sXG4gIFtRdWVyeVR5cGUuQ29udGVudENoaWxkXTogWyduZ09uSW5pdCddLFxufTtcblxuLyoqXG4gKiBBbmFseXplcyB0aGUgdXNhZ2Ugb2YgdGhlIGdpdmVuIHF1ZXJ5IGFuZCBkZXRlcm1pbmVzIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWRcbiAqIG9uIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVOZ1F1ZXJ5VXNhZ2UoXG4gICAgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6IFF1ZXJ5VGltaW5nIHtcbiAgcmV0dXJuIGlzUXVlcnlVc2VkU3RhdGljYWxseShxdWVyeS5jb250YWluZXIsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlciwgW10pID9cbiAgICAgIFF1ZXJ5VGltaW5nLlNUQVRJQyA6XG4gICAgICBRdWVyeVRpbWluZy5EWU5BTUlDO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBjbGFzcyBvciBpdCdzIGRlcml2ZWQgY2xhc3NlcyB1c2UgdGhlIHNwZWNpZmllZCBxdWVyeSBzdGF0aWNhbGx5LiAqL1xuZnVuY3Rpb24gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBjb25zdCB1c2FnZVZpc2l0b3IgPSBuZXcgRGVjbGFyYXRpb25Vc2FnZVZpc2l0b3IocXVlcnkucHJvcGVydHksIHR5cGVDaGVja2VyKTtcbiAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGNsYXNzRGVjbCk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBpcyBtZXRhZGF0YSBmb3IgdGhlIGN1cnJlbnQgY2xhc3MsIHdlIGNvbGxlY3QgYWxsIHJlc29sdmVkIEFuZ3VsYXIgaW5wdXRcbiAgLy8gbmFtZXMgYW5kIGFkZCB0aGVtIHRvIHRoZSBsaXN0IG9mIGtub3duIGlucHV0cyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgdXNhZ2VzIG9mXG4gIC8vIHRoZSBjdXJyZW50IHF1ZXJ5LiBlLmcuIHF1ZXJpZXMgdXNlZCBpbiBhbiBASW5wdXQoKSAqc2V0dGVyKiBhcmUgYWx3YXlzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICBrbm93bklucHV0TmFtZXMucHVzaCguLi5jbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyk7XG4gIH1cblxuICAvLyBMaXN0IG9mIFR5cGVTY3JpcHQgbm9kZXMgd2hpY2ggY2FuIGNvbnRhaW4gdXNhZ2VzIG9mIHRoZSBnaXZlbiBxdWVyeSBpbiBvcmRlciB0b1xuICAvLyBhY2Nlc3MgaXQgc3RhdGljYWxseS4gZS5nLlxuICAvLyAgKDEpIHF1ZXJpZXMgdXNlZCBpbiB0aGUgXCJuZ09uSW5pdFwiIGxpZmVjeWNsZSBob29rIGFyZSBzdGF0aWMuXG4gIC8vICAoMikgaW5wdXRzIHdpdGggc2V0dGVycyBjYW4gYWNjZXNzIHF1ZXJpZXMgc3RhdGljYWxseS5cbiAgY29uc3QgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzOiB0cy5Ob2RlW10gPSBjbGFzc0RlY2wubWVtYmVycy5maWx0ZXIobSA9PiB7XG4gICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChtLm5hbWUpICYmXG4gICAgICAgIFNUQVRJQ19RVUVSWV9MSUZFQ1lDTEVfSE9PS1NbcXVlcnkudHlwZV0uaW5kZXhPZihtLm5hbWUudGV4dCkgIT09IC0xKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICBrbm93bklucHV0TmFtZXMgJiYgdHMuaXNTZXRBY2Nlc3NvcihtKSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkgJiZcbiAgICAgICAga25vd25JbnB1dE5hbWVzLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG5cbiAgLy8gSW4gY2FzZSBub2RlcyB0aGF0IGNhbiBwb3NzaWJseSBhY2Nlc3MgYSBxdWVyeSBzdGF0aWNhbGx5IGhhdmUgYmVlbiBmb3VuZCwgY2hlY2tcbiAgLy8gaWYgdGhlIHF1ZXJ5IGRlY2xhcmF0aW9uIGlzIHVzZWQgd2l0aGluIGFueSBvZiB0aGVzZSBub2Rlcy5cbiAgaWYgKHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5sZW5ndGggJiZcbiAgICAgIHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5zb21lKGhvb2tOb2RlID0+IHVzYWdlVmlzaXRvci5pc1VzZWRJbk5vZGUoaG9va05vZGUpKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgY2xhc3NlcyB0aGF0IGRlcml2ZSBmcm9tIHRoZSBjdXJyZW50IGNsYXNzLCB2aXNpdCBlYWNoXG4gIC8vIGRlcml2ZWQgY2xhc3MgYXMgaW5oZXJpdGVkIHF1ZXJpZXMgY291bGQgYmUgdXNlZCBzdGF0aWNhbGx5LlxuICBpZiAoY2xhc3NNZXRhZGF0YSkge1xuICAgIHJldHVybiBjbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzLnNvbWUoXG4gICAgICAgIGRlcml2ZWRDbGFzcyA9PiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgICAgICAgICBkZXJpdmVkQ2xhc3MsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhTWFwLCB0eXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzKSk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=