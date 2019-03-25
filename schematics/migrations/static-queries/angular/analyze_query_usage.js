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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV9xdWVyeV91c2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywrR0FBZ0U7SUFDaEUsb0lBQW9FO0lBRXBFLGtIQUE2RTtJQUc3RTs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFDakIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUMzRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztLQUNuRSxDQUFDO0lBRUY7OztPQUdHO0lBQ0gsU0FBZ0IsbUJBQW1CLENBQy9CLEtBQXdCLEVBQUUsYUFBK0IsRUFDekQsV0FBMkI7UUFDN0IsT0FBTyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEYsOEJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQiw4QkFBVyxDQUFDLE9BQU8sQ0FBQztJQUMxQixDQUFDO0lBTkQsa0RBTUM7SUFFRCwrRkFBK0Y7SUFDL0YsU0FBUyxxQkFBcUIsQ0FDMUIsU0FBOEIsRUFBRSxLQUF3QixFQUFFLGdCQUFrQyxFQUM1RixXQUEyQixFQUFFLGVBQXlCO1FBQ3hELE1BQU0sWUFBWSxHQUFHLElBQUksbURBQXVCLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM5RSxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFdEQseUZBQXlGO1FBQ3pGLHVGQUF1RjtRQUN2RixrRkFBa0Y7UUFDbEYsSUFBSSxhQUFhLEVBQUU7WUFDakIsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNyRDtRQUVELG1GQUFtRjtRQUNuRiw2QkFBNkI7UUFDN0IsaUVBQWlFO1FBQ2pFLDBEQUEwRDtRQUMxRCxNQUFNLHdCQUF3QixHQUMxQixTQUFTLENBQUMsT0FBTzthQUNaLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNWLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbEUsNEJBQTRCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN4RSxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNLElBQ0gsZUFBZSxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxtQ0FBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMvRSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxDQUFDLE1BQXdELEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFNLENBQUMsQ0FBQztRQUUxRixtRkFBbUY7UUFDbkYsNEVBQTRFO1FBQzVFLElBQUksd0JBQXdCLENBQUMsTUFBTTtZQUMvQix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNqRixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsMkVBQTJFO1FBQzNFLCtEQUErRDtRQUMvRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUNwQyxZQUFZLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUNqQyxZQUFZLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQy9FO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtoYXNQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtEZWNsYXJhdGlvblVzYWdlVmlzaXRvcn0gZnJvbSAnLi9kZWNsYXJhdGlvbl91c2FnZV92aXNpdG9yJztcbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nLCBRdWVyeVR5cGV9IGZyb20gJy4vcXVlcnktZGVmaW5pdGlvbic7XG5cblxuLyoqXG4gKiBPYmplY3QgdGhhdCBtYXBzIGEgZ2l2ZW4gdHlwZSBvZiBxdWVyeSB0byBhIGxpc3Qgb2YgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAqIGNvdWxkIGJlIHVzZWQgdG8gYWNjZXNzIHN1Y2ggYSBxdWVyeSBzdGF0aWNhbGx5LlxuICovXG5jb25zdCBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTID0ge1xuICBbUXVlcnlUeXBlLlZpZXdDaGlsZF06XG4gICAgICBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjaycsICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ10sXG4gIFtRdWVyeVR5cGUuQ29udGVudENoaWxkXTogWyduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snXSxcbn07XG5cbi8qKlxuICogQW5hbHl6ZXMgdGhlIHVzYWdlIG9mIHRoZSBnaXZlbiBxdWVyeSBhbmQgZGV0ZXJtaW5lcyB0aGUgcXVlcnkgdGltaW5nIGJhc2VkXG4gKiBvbiB0aGUgY3VycmVudCB1c2FnZSBvZiB0aGUgcXVlcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplTmdRdWVyeVVzYWdlKFxuICAgIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCxcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBRdWVyeVRpbWluZyB7XG4gIHJldHVybiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkocXVlcnkuY29udGFpbmVyLCBxdWVyeSwgY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIsIFtdKSA/XG4gICAgICBRdWVyeVRpbWluZy5TVEFUSUMgOlxuICAgICAgUXVlcnlUaW1pbmcuRFlOQU1JQztcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gY2xhc3Mgb3IgaXQncyBkZXJpdmVkIGNsYXNzZXMgdXNlIHRoZSBzcGVjaWZpZWQgcXVlcnkgc3RhdGljYWxseS4gKi9cbmZ1bmN0aW9uIGlzUXVlcnlVc2VkU3RhdGljYWxseShcbiAgICBjbGFzc0RlY2w6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgY2xhc3NNZXRhZGF0YU1hcDogQ2xhc3NNZXRhZGF0YU1hcCxcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIGtub3duSW5wdXROYW1lczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgY29uc3QgdXNhZ2VWaXNpdG9yID0gbmV3IERlY2xhcmF0aW9uVXNhZ2VWaXNpdG9yKHF1ZXJ5LnByb3BlcnR5LCB0eXBlQ2hlY2tlcik7XG4gIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSBjbGFzc01ldGFkYXRhTWFwLmdldChjbGFzc0RlY2wpO1xuXG4gIC8vIEluIGNhc2UgdGhlcmUgaXMgbWV0YWRhdGEgZm9yIHRoZSBjdXJyZW50IGNsYXNzLCB3ZSBjb2xsZWN0IGFsbCByZXNvbHZlZCBBbmd1bGFyIGlucHV0XG4gIC8vIG5hbWVzIGFuZCBhZGQgdGhlbSB0byB0aGUgbGlzdCBvZiBrbm93biBpbnB1dHMgdGhhdCBuZWVkIHRvIGJlIGNoZWNrZWQgZm9yIHVzYWdlcyBvZlxuICAvLyB0aGUgY3VycmVudCBxdWVyeS4gZS5nLiBxdWVyaWVzIHVzZWQgaW4gYW4gQElucHV0KCkgKnNldHRlciogYXJlIGFsd2F5cyBzdGF0aWMuXG4gIGlmIChjbGFzc01ldGFkYXRhKSB7XG4gICAga25vd25JbnB1dE5hbWVzLnB1c2goLi4uY2xhc3NNZXRhZGF0YS5uZ0lucHV0TmFtZXMpO1xuICB9XG5cbiAgLy8gTGlzdCBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnkgaW4gb3JkZXIgdG9cbiAgLy8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuIGUuZy5cbiAgLy8gICgxKSBxdWVyaWVzIHVzZWQgaW4gdGhlIFwibmdPbkluaXRcIiBsaWZlY3ljbGUgaG9vayBhcmUgc3RhdGljLlxuICAvLyAgKDIpIGlucHV0cyB3aXRoIHNldHRlcnMgY2FuIGFjY2VzcyBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gIGNvbnN0IHBvc3NpYmxlU3RhdGljUXVlcnlOb2RlczogdHMuTm9kZVtdID1cbiAgICAgIGNsYXNzRGVjbC5tZW1iZXJzXG4gICAgICAgICAgLmZpbHRlcihtID0+IHtcbiAgICAgICAgICAgIGlmICh0cy5pc01ldGhvZERlY2xhcmF0aW9uKG0pICYmIG0uYm9keSAmJiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG0ubmFtZSkgJiZcbiAgICAgICAgICAgICAgICBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTW3F1ZXJ5LnR5cGVdLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAga25vd25JbnB1dE5hbWVzICYmIHRzLmlzU2V0QWNjZXNzb3IobSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgICAgIGtub3duSW5wdXROYW1lcy5pbmRleE9mKG0ubmFtZS50ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAubWFwKChtZW1iZXI6IHRzLlNldEFjY2Vzc29yRGVjbGFyYXRpb24gfCB0cy5NZXRob2REZWNsYXJhdGlvbikgPT4gbWVtYmVyLmJvZHkgISk7XG5cbiAgLy8gSW4gY2FzZSBub2RlcyB0aGF0IGNhbiBwb3NzaWJseSBhY2Nlc3MgYSBxdWVyeSBzdGF0aWNhbGx5IGhhdmUgYmVlbiBmb3VuZCwgY2hlY2tcbiAgLy8gaWYgdGhlIHF1ZXJ5IGRlY2xhcmF0aW9uIGlzIHN5bmNocm9ub3VzbHkgdXNlZCB3aXRoaW4gYW55IG9mIHRoZXNlIG5vZGVzLlxuICBpZiAocG9zc2libGVTdGF0aWNRdWVyeU5vZGVzLmxlbmd0aCAmJlxuICAgICAgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzLnNvbWUobiA9PiB1c2FnZVZpc2l0b3IuaXNTeW5jaHJvbm91c2x5VXNlZEluTm9kZShuKSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEluIGNhc2UgdGhlcmUgYXJlIGNsYXNzZXMgdGhhdCBkZXJpdmUgZnJvbSB0aGUgY3VycmVudCBjbGFzcywgdmlzaXQgZWFjaFxuICAvLyBkZXJpdmVkIGNsYXNzIGFzIGluaGVyaXRlZCBxdWVyaWVzIGNvdWxkIGJlIHVzZWQgc3RhdGljYWxseS5cbiAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICByZXR1cm4gY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlcy5zb21lKFxuICAgICAgICBkZXJpdmVkQ2xhc3MgPT4gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgICAgICAgICAgZGVyaXZlZENsYXNzLCBxdWVyeSwgY2xhc3NNZXRhZGF0YU1hcCwgdHlwZUNoZWNrZXIsIGtub3duSW5wdXROYW1lcykpO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19