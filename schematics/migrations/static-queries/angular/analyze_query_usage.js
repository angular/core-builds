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
        define("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", "@angular/core/schematics/migrations/static-queries/angular/query-definition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const declaration_usage_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
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
        const possibleStaticQueryNodes = classDecl.members
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
        // In case nodes that can possibly access a query statically have been found, check
        // if the query declaration is synchronously used within any of these nodes.
        if (possibleStaticQueryNodes.length &&
            possibleStaticQueryNodes.some(n => usageVisitor.isSynchronouslyUsedInNode(n))) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV9xdWVyeV91c2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywyRkFBNEU7SUFDNUUsb0lBQW9FO0lBRXBFLGtIQUE2RTtJQUU3RTs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFDakIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUMzRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztLQUNuRSxDQUFDO0lBRUY7OztPQUdHO0lBQ0gsU0FBZ0IsbUJBQW1CLENBQy9CLEtBQXdCLEVBQUUsYUFBK0IsRUFDekQsV0FBMkI7UUFDN0IsT0FBTyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsOEJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQiw4QkFBVyxDQUFDLE9BQU8sQ0FBQztJQUMxQixDQUFDO0lBTkQsa0RBTUM7SUFFRCwrRkFBK0Y7SUFDL0YsU0FBUyxxQkFBcUIsQ0FDMUIsU0FBOEIsRUFBRSxLQUF3QixFQUFFLGdCQUFrQyxFQUM1RixXQUEyQixFQUFFLGVBQXlCO1FBQ3hELE1BQU0sWUFBWSxHQUFHLElBQUksbURBQXVCLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM5RSxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFdEQseUZBQXlGO1FBQ3pGLHVGQUF1RjtRQUN2RixrRkFBa0Y7UUFDbEYsSUFBSSxhQUFhLEVBQUU7WUFDakIsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNyRDtRQUVELG1GQUFtRjtRQUNuRiw2QkFBNkI7UUFDN0IsaUVBQWlFO1FBQ2pFLDBEQUEwRDtRQUMxRCxNQUFNLHdCQUF3QixHQUMxQixTQUFTLENBQUMsT0FBTzthQUNaLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNWLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbEUsNEJBQTRCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN4RSxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNLElBQ0gsZUFBZSxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMvRSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxDQUFDLE1BQXdELEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFNLENBQUMsQ0FBQztRQUUxRixtRkFBbUY7UUFDbkYsNEVBQTRFO1FBQzVFLElBQUksd0JBQXdCLENBQUMsTUFBTTtZQUMvQix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNqRixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsMkVBQTJFO1FBQzNFLCtEQUErRDtRQUMvRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUNwQyxZQUFZLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUNqQyxZQUFZLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQy9FO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7aGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7RGVjbGFyYXRpb25Vc2FnZVZpc2l0b3J9IGZyb20gJy4vZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvcic7XG5pbXBvcnQge0NsYXNzTWV0YWRhdGFNYXB9IGZyb20gJy4vbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVRpbWluZywgUXVlcnlUeXBlfSBmcm9tICcuL3F1ZXJ5LWRlZmluaXRpb24nO1xuXG4vKipcbiAqIE9iamVjdCB0aGF0IG1hcHMgYSBnaXZlbiB0eXBlIG9mIHF1ZXJ5IHRvIGEgbGlzdCBvZiBsaWZlY3ljbGUgaG9va3MgdGhhdFxuICogY291bGQgYmUgdXNlZCB0byBhY2Nlc3Mgc3VjaCBhIHF1ZXJ5IHN0YXRpY2FsbHkuXG4gKi9cbmNvbnN0IFNUQVRJQ19RVUVSWV9MSUZFQ1lDTEVfSE9PS1MgPSB7XG4gIFtRdWVyeVR5cGUuVmlld0NoaWxkXTpcbiAgICAgIFsnbmdPbkNoYW5nZXMnLCAnbmdPbkluaXQnLCAnbmdEb0NoZWNrJywgJ25nQWZ0ZXJDb250ZW50SW5pdCcsICduZ0FmdGVyQ29udGVudENoZWNrZWQnXSxcbiAgW1F1ZXJ5VHlwZS5Db250ZW50Q2hpbGRdOiBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjayddLFxufTtcblxuLyoqXG4gKiBBbmFseXplcyB0aGUgdXNhZ2Ugb2YgdGhlIGdpdmVuIHF1ZXJ5IGFuZCBkZXRlcm1pbmVzIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWRcbiAqIG9uIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVOZ1F1ZXJ5VXNhZ2UoXG4gICAgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6IFF1ZXJ5VGltaW5nIHtcbiAgcmV0dXJuIGlzUXVlcnlVc2VkU3RhdGljYWxseShxdWVyeS5jb250YWluZXIsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhLCB0eXBlQ2hlY2tlciwgW10pID9cbiAgICAgIFF1ZXJ5VGltaW5nLlNUQVRJQyA6XG4gICAgICBRdWVyeVRpbWluZy5EWU5BTUlDO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBjbGFzcyBvciBpdCdzIGRlcml2ZWQgY2xhc3NlcyB1c2UgdGhlIHNwZWNpZmllZCBxdWVyeSBzdGF0aWNhbGx5LiAqL1xuZnVuY3Rpb24gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBjb25zdCB1c2FnZVZpc2l0b3IgPSBuZXcgRGVjbGFyYXRpb25Vc2FnZVZpc2l0b3IocXVlcnkucHJvcGVydHksIHR5cGVDaGVja2VyKTtcbiAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGNsYXNzRGVjbCk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBpcyBtZXRhZGF0YSBmb3IgdGhlIGN1cnJlbnQgY2xhc3MsIHdlIGNvbGxlY3QgYWxsIHJlc29sdmVkIEFuZ3VsYXIgaW5wdXRcbiAgLy8gbmFtZXMgYW5kIGFkZCB0aGVtIHRvIHRoZSBsaXN0IG9mIGtub3duIGlucHV0cyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgdXNhZ2VzIG9mXG4gIC8vIHRoZSBjdXJyZW50IHF1ZXJ5LiBlLmcuIHF1ZXJpZXMgdXNlZCBpbiBhbiBASW5wdXQoKSAqc2V0dGVyKiBhcmUgYWx3YXlzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICBrbm93bklucHV0TmFtZXMucHVzaCguLi5jbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyk7XG4gIH1cblxuICAvLyBMaXN0IG9mIFR5cGVTY3JpcHQgbm9kZXMgd2hpY2ggY2FuIGNvbnRhaW4gdXNhZ2VzIG9mIHRoZSBnaXZlbiBxdWVyeSBpbiBvcmRlciB0b1xuICAvLyBhY2Nlc3MgaXQgc3RhdGljYWxseS4gZS5nLlxuICAvLyAgKDEpIHF1ZXJpZXMgdXNlZCBpbiB0aGUgXCJuZ09uSW5pdFwiIGxpZmVjeWNsZSBob29rIGFyZSBzdGF0aWMuXG4gIC8vICAoMikgaW5wdXRzIHdpdGggc2V0dGVycyBjYW4gYWNjZXNzIHF1ZXJpZXMgc3RhdGljYWxseS5cbiAgY29uc3QgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzOiB0cy5Ob2RlW10gPVxuICAgICAgY2xhc3NEZWNsLm1lbWJlcnNcbiAgICAgICAgICAuZmlsdGVyKG0gPT4ge1xuICAgICAgICAgICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgICAgIFNUQVRJQ19RVUVSWV9MSUZFQ1lDTEVfSE9PS1NbcXVlcnkudHlwZV0uaW5kZXhPZihtLm5hbWUudGV4dCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICBrbm93bklucHV0TmFtZXMgJiYgdHMuaXNTZXRBY2Nlc3NvcihtKSAmJiBtLmJvZHkgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChtLm5hbWUpICYmXG4gICAgICAgICAgICAgICAga25vd25JbnB1dE5hbWVzLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5tYXAoKG1lbWJlcjogdHMuU2V0QWNjZXNzb3JEZWNsYXJhdGlvbiB8IHRzLk1ldGhvZERlY2xhcmF0aW9uKSA9PiBtZW1iZXIuYm9keSAhKTtcblxuICAvLyBJbiBjYXNlIG5vZGVzIHRoYXQgY2FuIHBvc3NpYmx5IGFjY2VzcyBhIHF1ZXJ5IHN0YXRpY2FsbHkgaGF2ZSBiZWVuIGZvdW5kLCBjaGVja1xuICAvLyBpZiB0aGUgcXVlcnkgZGVjbGFyYXRpb24gaXMgc3luY2hyb25vdXNseSB1c2VkIHdpdGhpbiBhbnkgb2YgdGhlc2Ugbm9kZXMuXG4gIGlmIChwb3NzaWJsZVN0YXRpY1F1ZXJ5Tm9kZXMubGVuZ3RoICYmXG4gICAgICBwb3NzaWJsZVN0YXRpY1F1ZXJ5Tm9kZXMuc29tZShuID0+IHVzYWdlVmlzaXRvci5pc1N5bmNocm9ub3VzbHlVc2VkSW5Ob2RlKG4pKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgY2xhc3NlcyB0aGF0IGRlcml2ZSBmcm9tIHRoZSBjdXJyZW50IGNsYXNzLCB2aXNpdCBlYWNoXG4gIC8vIGRlcml2ZWQgY2xhc3MgYXMgaW5oZXJpdGVkIHF1ZXJpZXMgY291bGQgYmUgdXNlZCBzdGF0aWNhbGx5LlxuICBpZiAoY2xhc3NNZXRhZGF0YSkge1xuICAgIHJldHVybiBjbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzLnNvbWUoXG4gICAgICAgIGRlcml2ZWRDbGFzcyA9PiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgICAgICAgICBkZXJpdmVkQ2xhc3MsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhTWFwLCB0eXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzKSk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=