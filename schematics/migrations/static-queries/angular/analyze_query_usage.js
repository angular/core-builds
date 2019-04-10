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
        define("@angular/core/schematics/migrations/static-queries/angular/analyze_query_usage", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/property_name", "@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor", "@angular/core/schematics/migrations/static-queries/angular/query-definition", "@angular/core/schematics/migrations/static-queries/angular/super_class"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    const property_name_1 = require("@angular/core/schematics/utils/typescript/property_name");
    const declaration_usage_visitor_1 = require("@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor");
    const query_definition_1 = require("@angular/core/schematics/migrations/static-queries/angular/query-definition");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV9xdWVyeV91c2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL2FuZ3VsYXIvYW5hbHl6ZV9xdWVyeV91c2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQywyRkFBNEU7SUFFNUUsb0lBQXFGO0lBRXJGLGtIQUE2RTtJQUM3RSx3R0FBcUU7SUFFckU7OztPQUdHO0lBQ0gsTUFBTSw0QkFBNEIsR0FBRztRQUNuQyxDQUFDLDRCQUFTLENBQUMsU0FBUyxDQUFDLEVBQ2pCLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUUsdUJBQXVCLENBQUM7UUFDM0YsQ0FBQyw0QkFBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUM7S0FDbkUsQ0FBQztJQUVGOzs7T0FHRztJQUNILFNBQWdCLG1CQUFtQixDQUMvQixLQUF3QixFQUFFLGFBQStCLEVBQ3pELFdBQTJCO1FBQzdCLE9BQU8scUJBQXFCLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLDhCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEIsOEJBQVcsQ0FBQyxPQUFPLENBQUM7SUFDMUIsQ0FBQztJQU5ELGtEQU1DO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyxxQkFBcUIsQ0FDMUIsU0FBOEIsRUFBRSxLQUF3QixFQUFFLGdCQUFrQyxFQUM1RixXQUEyQixFQUFFLGVBQXlCLEVBQ3RELGNBQStCLElBQUksR0FBRyxFQUFFLEVBQUUscUJBQXFCLEdBQUcsSUFBSTtRQUN4RSxNQUFNLFlB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QUNiO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsQ0FBQyxNQUF3RCxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBTSxDQUFDLENBQUM7SUFDeEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2hhc1Byb3BlcnR5TmFtZVRleHR9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZSc7XG5cbmltcG9ydCB7RGVjbGFyYXRpb25Vc2FnZVZpc2l0b3IsIEZ1bmN0aW9uQ29udGV4dH0gZnJvbSAnLi9kZWNsYXJhdGlvbl91c2FnZV92aXNpdG9yJztcbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nLCBRdWVyeVR5cGV9IGZyb20gJy4vcXVlcnktZGVmaW5pdGlvbic7XG5pbXBvcnQge3VwZGF0ZVN1cGVyQ2xhc3NBYnN0cmFjdE1lbWJlcnNDb250ZXh0fSBmcm9tICcuL3N1cGVyX2NsYXNzJztcblxuLyoqXG4gKiBPYmplY3QgdGhhdCBtYXBzIGEgZ2l2ZW4gdHlwZSBvZiBxdWVyeSB0byBhIGxpc3Qgb2YgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAqIGNvdWxkIGJlIHVzZWQgdG8gYWNjZXNzIHN1Y2ggYSBxdWVyeSBzdGF0aWNhbGx5LlxuICovXG5jb25zdCBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTID0ge1xuICBbUXVlcnlUeXBlLlZpZXdDaGlsZF06XG4gICAgICBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjaycsICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ10sXG4gIFtRdWVyeVR5cGUuQ29udGVudENoaWxkXTogWyduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snXSxcbn07XG5cbi8qKlxuICogQW5hbHl6ZXMgdGhlIHVzYWdlIG9mIHRoZSBnaXZlbiBxdWVyeSBhbmQgZGV0ZXJtaW5lcyB0aGUgcXVlcnkgdGltaW5nIGJhc2VkXG4gKiBvbiB0aGUgY3VycmVudCB1c2FnZSBvZiB0aGUgcXVlcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplTmdRdWVyeVVzYWdlKFxuICAgIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCxcbiAgICB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBRdWVyeVRpbWluZyB7XG4gIHJldHVybiBpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkocXVlcnkuY29udGFpbmVyLCBxdWVyeSwgY2xhc3NNZXRhZGF0YSwgdHlwZUNoZWNrZXIsIFtdKSA/XG4gICAgICBRdWVyeVRpbWluZy5TVEFUSUMgOlxuICAgICAgUXVlcnlUaW1pbmcuRFlOQU1JQztcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHF1ZXJ5IGlzIHVzZWQgc3RhdGljYWxseSB3aXRoaW4gdGhlIGdpdmVuIGNsYXNzLCBpdHMgc3VwZXJcbiAqIGNsYXNzIG9yIGRlcml2ZWQgY2xhc3Nlcy5cbiAqL1xuZnVuY3Rpb24gaXNRdWVyeVVzZWRTdGF0aWNhbGx5KFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLCBjbGFzc01ldGFkYXRhTWFwOiBDbGFzc01ldGFkYXRhTWFwLFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSxcbiAgICBmdW5jdGlvbkN0eDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpLCB2aXNpdEluaGVyaXRlZENsYXNzZXMgPSB0cnVlKTogYm9vbGVhbiB7XG4gIGNvbnN0IHVzYWdlVmlzaXRvciA9IG5ldyBEZWNsYXJhdGlvblVzYWdlVmlzaXRvcihxdWVyeS5wcm9wZXJ0eSwgdHlwZUNoZWNrZXIsIGZ1bmN0aW9uQ3R4KTtcbiAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IGNsYXNzTWV0YWRhdGFNYXAuZ2V0KGNsYXNzRGVjbCk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBpcyBtZXRhZGF0YSBmb3IgdGhlIGN1cnJlbnQgY2xhc3MsIHdlIGNvbGxlY3QgYWxsIHJlc29sdmVkIEFuZ3VsYXIgaW5wdXRcbiAgLy8gbmFtZXMgYW5kIGFkZCB0aGVtIHRvIHRoZSBsaXN0IG9mIGtub3duIGlucHV0cyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgdXNhZ2VzIG9mXG4gIC8vIHRoZSBjdXJyZW50IHF1ZXJ5LiBlLmcuIHF1ZXJpZXMgdXNlZCBpbiBhbiBASW5wdXQoKSAqc2V0dGVyKiBhcmUgYWx3YXlzIHN0YXRpYy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEpIHtcbiAgICBrbm93bklucHV0TmFtZXMucHVzaCguLi5jbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyk7XG4gIH1cblxuICAvLyBBcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnkgaW5cbiAgLy8gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuXG4gIGNvbnN0IHBvc3NpYmxlU3RhdGljUXVlcnlOb2RlcyA9IGZpbHRlclF1ZXJ5Q2xhc3NNZW1iZXJOb2RlcyhjbGFzc0RlY2wsIHF1ZXJ5LCBrbm93bklucHV0TmFtZXMpO1xuXG4gIC8vIEluIGNhc2Ugbm9kZXMgdGhhdCBjYW4gcG9zc2libHkgYWNjZXNzIGEgcXVlcnkgc3RhdGljYWxseSBoYXZlIGJlZW4gZm91bmQsIGNoZWNrXG4gIC8vIGlmIHRoZSBxdWVyeSBkZWNsYXJhdGlvbiBpcyBzeW5jaHJvbm91c2x5IHVzZWQgd2l0aGluIGFueSBvZiB0aGVzZSBub2Rlcy5cbiAgaWYgKHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5sZW5ndGggJiZcbiAgICAgIHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5zb21lKG4gPT4gdXNhZ2VWaXNpdG9yLmlzU3luY2hyb25vdXNseVVzZWRJbk5vZGUobikpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoIWNsYXNzTWV0YWRhdGEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBJbiBjYXNlIGRlcml2ZWQgY2xhc3NlcyBzaG91bGQgYWxzbyBiZSBhbmFseXplZCwgd2UgZGV0ZXJtaW5lIHRoZSBjbGFzc2VzIHRoYXQgZGVyaXZlXG4gIC8vIGZyb20gdGhlIGN1cnJlbnQgY2xhc3MgYW5kIGNoZWNrIGlmIHRoZXNlIGhhdmUgaW5wdXQgc2V0dGVycyBvciBsaWZlY3ljbGUgaG9va3MgdGhhdFxuICAvLyB1c2UgdGhlIHF1ZXJ5IHN0YXRpY2FsbHkuXG4gIGlmICh2aXNpdEluaGVyaXRlZENsYXNzZXMpIHtcbiAgICBpZiAoY2xhc3NNZXRhZGF0YS5kZXJpdmVkQ2xhc3Nlcy5zb21lKFxuICAgICAgICAgICAgZGVyaXZlZENsYXNzID0+IGlzUXVlcnlVc2VkU3RhdGljYWxseShcbiAgICAgICAgICAgICAgICBkZXJpdmVkQ2xhc3MsIHF1ZXJ5LCBjbGFzc01ldGFkYXRhTWFwLCB0eXBlQ2hlY2tlciwga25vd25JbnB1dE5hbWVzKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIEluIGNhc2UgdGhlIGN1cnJlbnQgY2xhc3MgaGFzIGEgc3VwZXIgY2xhc3MsIHdlIGRldGVybWluZSBkZWNsYXJlZCBhYnN0cmFjdCBmdW5jdGlvbi1saWtlXG4gIC8vIGRlY2xhcmF0aW9ucyBpbiB0aGUgc3VwZXItY2xhc3MgdGhhdCBhcmUgaW1wbGVtZW50ZWQgaW4gdGhlIGN1cnJlbnQgY2xhc3MuIFRoZSBzdXBlciBjbGFzc1xuICAvLyB3aWxsIHRoZW4gYmUgYW5hbHl6ZWQgd2l0aCB0aGUgYWJzdHJhY3QgZGVjbGFyYXRpb25zIG1hcHBlZCB0byB0aGUgaW1wbGVtZW50ZWQgVHlwZVNjcmlwdFxuICAvLyBub2Rlcy4gVGhpcyBhbGxvd3MgdXMgdG8gaGFuZGxlIHF1ZXJpZXMgd2hpY2ggYXJlIHVzZWQgaW4gc3VwZXIgY2xhc3NlcyB0aHJvdWdoIGRlcml2ZWRcbiAgLy8gYWJzdHJhY3QgbWV0aG9kIGRlY2xhcmF0aW9ucy5cbiAgaWYgKGNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcykge1xuICAgIGNvbnN0IHN1cGVyQ2xhc3NEZWNsID0gY2xhc3NNZXRhZGF0YS5zdXBlckNsYXNzO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBmdW5jdGlvbiBjb250ZXh0IHRvIG1hcCBhYnN0cmFjdCBkZWNsYXJhdGlvbiBub2RlcyB0byB0aGVpciBpbXBsZW1lbnRhdGlvblxuICAgIC8vIG5vZGUgaW4gdGhlIGJhc2UgY2xhc3MuIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBkZWNsYXJhdGlvbiB1c2FnZSB2aXNpdG9yIGNhbiBhbmFseXplXG4gICAgLy8gYWJzdHJhY3QgY2xhc3MgbWVtYmVyIGRlY2xhcmF0aW9ucy5cbiAgICB1cGRhdGVTdXBlckNsYXNzQWJzdHJhY3RNZW1iZXJzQ29udGV4dChjbGFzc0RlY2wsIGZ1bmN0aW9uQ3R4LCBjbGFzc01ldGFkYXRhTWFwKTtcblxuICAgIGlmIChpc1F1ZXJ5VXNlZFN0YXRpY2FsbHkoXG4gICAgICAgICAgICBzdXBlckNsYXNzRGVjbCwgcXVlcnksIGNsYXNzTWV0YWRhdGFNYXAsIHR5cGVDaGVja2VyLCBbXSwgZnVuY3Rpb25DdHgsIGZhbHNlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbi8qKlxuICogRmlsdGVycyBhbGwgY2xhc3MgbWVtYmVycyBmcm9tIHRoZSBjbGFzcyBkZWNsYXJhdGlvbiB0aGF0IGNhbiBhY2Nlc3MgdGhlXG4gKiBnaXZlbiBxdWVyeSBzdGF0aWNhbGx5IChlLmcuIG5nT25Jbml0IGxpZmVjeWNsZSBob29rIG9yIEBJbnB1dCBzZXR0ZXJzKVxuICovXG5mdW5jdGlvbiBmaWx0ZXJRdWVyeUNsYXNzTWVtYmVyTm9kZXMoXG4gICAgY2xhc3NEZWNsOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sXG4gICAga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSk6IHRzLkJsb2NrW10ge1xuICAvLyBSZXR1cm5zIGFuIGFycmF5IG9mIFR5cGVTY3JpcHQgbm9kZXMgd2hpY2ggY2FuIGNvbnRhaW4gdXNhZ2VzIG9mIHRoZSBnaXZlbiBxdWVyeVxuICAvLyBpbiBvcmRlciB0byBhY2Nlc3MgaXQgc3RhdGljYWxseS4gZS5nLlxuICAvLyAgKDEpIHF1ZXJpZXMgdXNlZCBpbiB0aGUgXCJuZ09uSW5pdFwiIGxpZmVjeWNsZSBob29rIGFyZSBzdGF0aWMuXG4gIC8vICAoMikgaW5wdXRzIHdpdGggc2V0dGVycyBjYW4gYWNjZXNzIHF1ZXJpZXMgc3RhdGljYWxseS5cbiAgcmV0dXJuIGNsYXNzRGVjbC5tZW1iZXJzXG4gICAgICAuZmlsdGVyKG0gPT4ge1xuICAgICAgICBpZiAodHMuaXNNZXRob2REZWNsYXJhdGlvbihtKSAmJiBtLmJvZHkgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChtLm5hbWUpICYmXG4gICAgICAgICAgICBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTW3F1ZXJ5LnR5cGVdLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAga25vd25JbnB1dE5hbWVzICYmIHRzLmlzU2V0QWNjZXNzb3IobSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAga25vd25JbnB1dE5hbWVzLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAubWFwKChtZW1iZXI6IHRzLlNldEFjY2Vzc29yRGVjbGFyYXRpb24gfCB0cy5NZXRob2REZWNsYXJhdGlvbikgPT4gbWVtYmVyLmJvZHkgISk7XG59XG4iXX0=