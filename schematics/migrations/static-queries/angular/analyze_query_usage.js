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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV9xdWVyeV91c2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywrR0FBZ0U7SUFDaEUsb0lBQW9FO0lBRXBFLGtIQUE2RTtJQUc3RTs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUNsRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUM7S0FDdkMsQ0FBQztJQUVGOzs7T0FHRztJQUNILFNBQWdCLG1CQUFtQixDQUMvQixLQUF3QixFQUFFLGFBQStCLEVBQ3pELFdBQTJCO1FBQzdCLE9BQU8scUJBQXFCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEIsOEJBQVcsQ0FBQyxPQUFPLENBQUM7SUFDMUIsQ0FBQztJQU5ELGtEQU1DO0lBRUQsK0ZBQStGO0lBQy9GLFNBQVMscUJBQXFCLENBQzFCLFNBQThCLEVBQUUsS0FBd0IsRUFBRSxnQkFBa0MsRUFDNUYsV0FBMkIsRUFBRSxlQUF5QjtRQUN4RCxNQUFNLFlBQVksR0FBRyxJQUFJLG1EQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDOUUsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXRELHlGQUF5RjtRQUN6Rix1RkFBdUY7UUFDdkYsa0ZBQWtGO1FBQ2xGLElBQUksYUFBYSxFQUFFO1lBQ2pCLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDckQ7UUFFRCxtRkFBbUY7UUFDbkYsNkJBQTZCO1FBQzdCLGlFQUFpRTtRQUNqRSwwREFBMEQ7UUFDMUQsTUFBTSx3QkFBd0IsR0FDMUIsU0FBUyxDQUFDLE9BQU87YUFDWixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDVixJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xFLDRCQUE0QixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDeEUsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTSxJQUNILGVBQWUsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDL0UsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUMvQyxPQUFPLElBQUksQ0FBQzthQUNiO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsQ0FBQyxNQUF3RCxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBTSxDQUFDLENBQUM7UUFFMUYsbUZBQW1GO1FBQ25GLDRFQUE0RTtRQUM1RSxJQUFJLHdCQUF3QixDQUFDLE1BQU07WUFDL0Isd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDakYsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELDJFQUEyRTtRQUMzRSwrREFBK0Q7UUFDL0QsSUFBSSxhQUFhLEVBQUU7WUFDakIsT0FBTyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FDcEMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FDakMsWUFBWSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztTQUMvRTtRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7aGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7RGVjbGFyYXRpb25Vc2FnZVZpc2l0b3J9IGZyb20gJy4vZGVjbGFyYXRpb25fdXNhZ2VfdmlzaXRvcic7XG5pbXBvcnQge0NsYXNzTWV0YWRhdGFNYXB9IGZyb20gJy4vbmdfcXVlcnlfdmlzaXRvcic7XG5pbXBvcnQge05nUXVlcnlEZWZpbml0aW9uLCBRdWVyeVRpbWluZywgUXVlcnlUeXBlfSBmcm9tICcuL3F1ZXJ5LWRlZmluaXRpb24nO1xuXG5cbi8qKlxuICogT2JqZWN0IHRoYXQgbWFwcyBhIGdpdmVuIHR5cGUgb2YgcXVlcnkgdG8gYSBsaXN0IG9mIGxpZmVjeWNsZSBob29rcyB0aGF0XG4gKiBjb3VsZCBiZSB1c2VkIHRvIGFjY2VzcyBzdWNoIGEgcXVlcnkgc3RhdGljYWxseS5cbiAqL1xuY29uc3QgU1RBVElDX1FVRVJZX0xJRkVDWUNMRV9IT09LUyA9IHtcbiAgW1F1ZXJ5VHlwZS5WaWV3Q2hpbGRdOiBbJ25nT25Jbml0JywgJ25nQWZ0ZXJDb250ZW50SW5pdCcsICduZ0FmdGVyQ29udGVudENoZWNrZWQnXSxcbiAgW1F1ZXJ5VHlwZS5Db250ZW50Q2hpbGRdOiBbJ25nT25Jbml0J10sXG59O1xuXG4vKipcbiAqIEFuYWx5emVzIHRoZSB1c2FnZSBvZiB0aGUgZ2l2ZW4gcXVlcnkgYW5kIGRldGVybWluZXMgdGhlIHF1ZXJ5IHRpbWluZyBiYXNlZFxuICogb24gdGhlIGN1cnJlbnQgdXNhZ2Ugb2YgdGhlIHF1ZXJ5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZU5nUXVlcnlVc2FnZShcbiAgICBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sIGNsYXNzTWV0YWRhdGE6IENsYXNzTWV0YWRhdGFNYXAsXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogUXVlcnlUaW1pbmcge1xuICByZXR1cm4gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KHF1ZXJ5LmNvbnRhaW5lciwgcXVlcnksIGNsYXNzTWV0YWRhdGEsIHR5cGVDaGVja2VyLCBbXSkgP1xuICAgICAgUXVlcnlUaW1pbmcuU1RBVElDIDpcbiAgICAgIFF1ZXJ5VGltaW5nLkRZTkFNSUM7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIGNsYXNzIG9yIGl0J3MgZGVyaXZlZCBjbGFzc2VzIHVzZSB0aGUgc3BlY2lmaWVkIHF1ZXJ5IHN0YXRpY2FsbHkuICovXG5mdW5jdGlvbiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgY2xhc3NEZWNsOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sIGNsYXNzTWV0YWRhdGFNYXA6IENsYXNzTWV0YWRhdGFNYXAsXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBrbm93bklucHV0TmFtZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGNvbnN0IHVzYWdlVmlzaXRvciA9IG5ldyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvcihxdWVyeS5wcm9wZXJ0eSwgdHlwZUNoZWNrZXIpO1xuICBjb25zdCBjbGFzc01ldGFkYXRhID0gY2xhc3NNZXRhZGF0YU1hcC5nZXQoY2xhc3NEZWNsKTtcblxuICAvLyBJbiBjYXNlIHRoZXJlIGlzIG1ldGFkYXRhIGZvciB0aGUgY3VycmVudCBjbGFzcywgd2UgY29sbGVjdCBhbGwgcmVzb2x2ZWQgQW5ndWxhciBpbnB1dFxuICAvLyBuYW1lcyBhbmQgYWRkIHRoZW0gdG8gdGhlIGxpc3Qgb2Yga25vd24gaW5wdXRzIHRoYXQgbmVlZCB0byBiZSBjaGVja2VkIGZvciB1c2FnZXMgb2ZcbiAgLy8gdGhlIGN1cnJlbnQgcXVlcnkuIGUuZy4gcXVlcmllcyB1c2VkIGluIGFuIEBJbnB1dCgpICpzZXR0ZXIqIGFyZSBhbHdheXMgc3RhdGljLlxuICBpZiAoY2xhc3NNZXRhZGF0YSkge1xuICAgIGtub3duSW5wdXROYW1lcy5wdXNoKC4uLmNsYXNzTWV0YWRhdGEubmdJbnB1dE5hbWVzKTtcbiAgfVxuXG4gIC8vIExpc3Qgb2YgVHlwZVNjcmlwdCBub2RlcyB3aGljaCBjYW4gY29udGFpbiB1c2FnZXMgb2YgdGhlIGdpdmVuIHF1ZXJ5IGluIG9yZGVyIHRvXG4gIC8vIGFjY2VzcyBpdCBzdGF0aWNhbGx5LiBlLmcuXG4gIC8vICAoMSkgcXVlcmllcyB1c2VkIGluIHRoZSBcIm5nT25Jbml0XCIgbGlmZWN5Y2xlIGhvb2sgYXJlIHN0YXRpYy5cbiAgLy8gICgyKSBpbnB1dHMgd2l0aCBzZXR0ZXJzIGNhbiBhY2Nlc3MgcXVlcmllcyBzdGF0aWNhbGx5LlxuICBjb25zdCBwb3NzaWJsZVN0YXRpY1F1ZXJ5Tm9kZXM6IHRzLk5vZGVbXSA9XG4gICAgICBjbGFzc0RlY2wubWVtYmVyc1xuICAgICAgICAgIC5maWx0ZXIobSA9PiB7XG4gICAgICAgICAgICBpZiAodHMuaXNNZXRob2REZWNsYXJhdGlvbihtKSAmJiBtLmJvZHkgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChtLm5hbWUpICYmXG4gICAgICAgICAgICAgICAgU1RBVElDX1FVRVJZX0xJRkVDWUNMRV9IT09LU1txdWVyeS50eXBlXS5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIGtub3duSW5wdXROYW1lcyAmJiB0cy5pc1NldEFjY2Vzc29yKG0pICYmIG0uYm9keSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkgJiZcbiAgICAgICAgICAgICAgICBrbm93bklucHV0TmFtZXMuaW5kZXhPZihtLm5hbWUudGV4dCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLm1hcCgobWVtYmVyOiB0cy5TZXRBY2Nlc3NvckRlY2xhcmF0aW9uIHwgdHMuTWV0aG9kRGVjbGFyYXRpb24pID0+IG1lbWJlci5ib2R5ICEpO1xuXG4gIC8vIEluIGNhc2Ugbm9kZXMgdGhhdCBjYW4gcG9zc2libHkgYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseSBoYXZlIGJlZW4gZm91bmQsIGNoZWNrXG4gIC8vIGlmIHRoZSBxdWVyeSBkZWNsYXJhdGlvbiBpcyBzeW5jaHJvbm91c2x5IHVzZWQgd2l0aGluIGFueSBvZiB0aGVzZSBub2Rlcy5cbiAgaWYgKHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5sZW5ndGggJiZcbiAgICAgIHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5zb21lKG4gPT4gdXNhZ2VWaXNpdG9yLmlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUobikpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBjbGFzc2VzIHRoYXQgZGVyaXZlIGZyb20gdGhlIGN1cnJlbnQgY2xhc3MsIHZpc2l0IGVhY2hcbiAgLy8gZGVyaXZlZCBjbGFzcyBhcyBpbmhlcml0ZWQgcXVlcmllcyBjb3VsZCBiZSB1c2VkIHN0YXRpY2FsbHkuXG4gIGlmIChjbGFzc01ldGFkYXRhKSB7XG4gICAgcmV0dXJuIGNsYXNzTWV0YWRhdGEuZGVyaXZlZENsYXNzZXMuc29tZShcbiAgICAgICAgZGVyaXZlZENsYXNzID0+IGlzUXVlcnlVc2VkU3RhdGljYWxseShcbiAgICAgICAgICAgIGRlcml2ZWRDbGFzcywgcXVlcnksIGNsYXNzTWV0YWRhdGFNYXAsIHR5cGVDaGVja2VyLCBrbm93bklucHV0TmFtZXMpKTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==