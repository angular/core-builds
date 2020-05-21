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
    exports.QueryUsageStrategy = void 0;
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
            const usage = this.analyzeQueryUsage(query.container, query, []);
            if (usage === declaration_usage_visitor_1.ResolvedUsage.AMBIGUOUS) {
                return {
                    timing: query_definition_1.QueryTiming.STATIC,
                    message: 'Query timing is ambiguous. Please check if the query can be marked as dynamic.'
                };
            }
            else if (usage === declaration_usage_visitor_1.ResolvedUsage.SYNCHRONOUS) {
                return { timing: query_definition_1.QueryTiming.STATIC };
            }
            else {
                return { timing: query_definition_1.QueryTiming.DYNAMIC };
            }
        }
        /**
         * Checks whether a given query is used statically within the given class, its super
         * class or derived classes.
         */
        analyzeQueryUsage(classDecl, query, knownInputNames, functionCtx = new Map(), visitInheritedClasses = true) {
            const usageVisitor = new declaration_usage_visitor_1.DeclarationUsageVisitor(query.property, this.typeChecker, functionCtx);
            const classMetadata = this.classMetadata.get(classDecl);
            let usage = declaration_usage_visitor_1.ResolvedUsage.ASYNCHRONOUS;
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
            if (possibleStaticQueryNodes.length) {
                possibleStaticQueryNodes.forEach(n => usage = combineResolvedUsage(usage, usageVisitor.getResolvedNodeUsage(n)));
            }
            if (!classMetadata) {
                return usage;
            }
            // In case there is a component template for the current class, we check if the
            // template statically accesses the current query. In case that's true, the query
            // can be marked as static.
            if (classMetadata.template && property_name_1.hasPropertyNameText(query.property.name)) {
                const template = classMetadata.template;
                const parsedHtml = parse_html_1.parseHtmlGracefully(template.content, template.filePath);
                const htmlVisitor = new template_usage_visitor_1.TemplateUsageVisitor(query.property.name.text);
                if (parsedHtml && htmlVisitor.isQueryUsedStatically(parsedHtml)) {
                    return declaration_usage_visitor_1.ResolvedUsage.SYNCHRONOUS;
                }
            }
            // In case derived classes should also be analyzed, we determine the classes that derive
            // from the current class and check if these have input setters or lifecycle hooks that
            // use the query statically.
            if (visitInheritedClasses) {
                classMetadata.derivedClasses.forEach(derivedClass => {
                    usage = combineResolvedUsage(usage, this.analyzeQueryUsage(derivedClass, query, knownInputNames));
                });
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
                super_class_context_1.updateSuperClassAbstractMembersContext(classDecl, functionCtx, this.classMetadata);
                usage = combineResolvedUsage(usage, this.analyzeQueryUsage(superClassDecl, query, [], functionCtx, false));
            }
            return usage;
        }
    }
    exports.QueryUsageStrategy = QueryUsageStrategy;
    /**
     * Combines two resolved usages based on a fixed priority. "Synchronous" takes
     * precedence over "Ambiguous" whereas ambiguous takes precedence over "Asynchronous".
     */
    function combineResolvedUsage(base, target) {
        if (base === declaration_usage_visitor_1.ResolvedUsage.SYNCHRONOUS) {
            return base;
        }
        else if (target !== declaration_usage_visitor_1.ResolvedUsage.ASYNCHRONOUS) {
            return target;
        }
        else {
            return declaration_usage_visitor_1.ResolvedUsage.ASYNCHRONOUS;
        }
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
            .filter((m) => {
            if (ts.isMethodDeclaration(m) && m.body && property_name_1.hasPropertyNameText(m.name) &&
                STATIC_QUERY_LIFECYCLE_HOOKS[query.type].indexOf(m.name.text) !== -1) {
                return true;
            }
            else if (knownInputNames && ts.isSetAccessor(m) && m.body &&
                property_name_1.hasPropertyNameText(m.name) && knownInputNames.indexOf(m.name.text) !== -1) {
                return true;
            }
            return false;
        })
            .map(member => member.body);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNhZ2Vfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywwRUFBaUU7SUFDakUsMkZBQStFO0lBRS9FLGtIQUF5RjtJQUd6RixzSkFBb0c7SUFDcEcsMElBQTZFO0lBQzdFLGdKQUE4RDtJQUc5RDs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFDakIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUMzRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztLQUNuRSxDQUFDO0lBRUY7Ozs7T0FJRztJQUNILE1BQWEsa0JBQWtCO1FBQzdCLFlBQW9CLGFBQStCLEVBQVUsV0FBMkI7WUFBcEUsa0JBQWEsR0FBYixhQUFhLENBQWtCO1lBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWdCO1FBQUcsQ0FBQztRQUU1RixLQUFLLEtBQUksQ0FBQztRQUVWOzs7V0FHRztRQUNILFlBQVksQ0FBQyxLQUF3QjtZQUNuQyxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO2dCQUMzQixPQUFPLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsa0RBQWtELEVBQUMsQ0FBQzthQUNwRjtZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFF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QUFDO2dCQUNsRSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hFLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU0sSUFDSCxlQUFlLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSTtnQkFDaEQsbUNBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDOUUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFDO2FBQ1QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge3BhcnNlSHRtbEdyYWNlZnVsbHl9IGZyb20gJy4uLy4uLy4uLy4uL3V0aWxzL3BhcnNlX2h0bWwnO1xuaW1wb3J0IHtoYXNQcm9wZXJ0eU5hbWVUZXh0fSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUnO1xuaW1wb3J0IHtDbGFzc01ldGFkYXRhTWFwfSBmcm9tICcuLi8uLi9hbmd1bGFyL25nX3F1ZXJ5X3Zpc2l0b3InO1xuaW1wb3J0IHtOZ1F1ZXJ5RGVmaW5pdGlvbiwgUXVlcnlUaW1pbmcsIFF1ZXJ5VHlwZX0gZnJvbSAnLi4vLi4vYW5ndWxhci9xdWVyeS1kZWZpbml0aW9uJztcbmltcG9ydCB7VGltaW5nUmVzdWx0LCBUaW1pbmdTdHJhdGVneX0gZnJvbSAnLi4vdGltaW5nLXN0cmF0ZWd5JztcblxuaW1wb3J0IHtEZWNsYXJhdGlvblVzYWdlVmlzaXRvciwgRnVuY3Rpb25Db250ZXh0LCBSZXNvbHZlZFVzYWdlfSBmcm9tICcuL2RlY2xhcmF0aW9uX3VzYWdlX3Zpc2l0b3InO1xuaW1wb3J0IHt1cGRhdGVTdXBlckNsYXNzQWJzdHJhY3RNZW1iZXJzQ29udGV4dH0gZnJvbSAnLi9zdXBlcl9jbGFzc19jb250ZXh0JztcbmltcG9ydCB7VGVtcGxhdGVVc2FnZVZpc2l0b3J9IGZyb20gJy4vdGVtcGxhdGVfdXNhZ2VfdmlzaXRvcic7XG5cblxuLyoqXG4gKiBPYmplY3QgdGhhdCBtYXBzIGEgZ2l2ZW4gdHlwZSBvZiBxdWVyeSB0byBhIGxpc3Qgb2YgbGlmZWN5Y2xlIGhvb2tzIHRoYXRcbiAqIGNvdWxkIGJlIHVzZWQgdG8gYWNjZXNzIHN1Y2ggYSBxdWVyeSBzdGF0aWNhbGx5LlxuICovXG5jb25zdCBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTID0ge1xuICBbUXVlcnlUeXBlLlZpZXdDaGlsZF06XG4gICAgICBbJ25nT25DaGFuZ2VzJywgJ25nT25Jbml0JywgJ25nRG9DaGVjaycsICduZ0FmdGVyQ29udGVudEluaXQnLCAnbmdBZnRlckNvbnRlbnRDaGVja2VkJ10sXG4gIFtRdWVyeVR5cGUuQ29udGVudENoaWxkXTogWyduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snXSxcbn07XG5cbi8qKlxuICogUXVlcnkgdGltaW5nIHN0cmF0ZWd5IHRoYXQgZGV0ZXJtaW5lcyB0aGUgdGltaW5nIG9mIGEgZ2l2ZW4gcXVlcnkgYnkgaW5zcGVjdGluZyBob3dcbiAqIHRoZSBxdWVyeSBpcyBhY2Nlc3NlZCB3aXRoaW4gdGhlIHByb2plY3QncyBUeXBlU2NyaXB0IHNvdXJjZSBmaWxlcy4gUmVhZCBtb3JlIGFib3V0XG4gKiB0aGlzIHN0cmF0ZWd5IGhlcmU6IGh0dHBzOi8vaGFja21kLmlvL3MvSHltdmMyT0tFXG4gKi9cbmV4cG9ydCBjbGFzcyBRdWVyeVVzYWdlU3RyYXRlZ3kgaW1wbGVtZW50cyBUaW1pbmdTdHJhdGVneSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCwgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpIHt9XG5cbiAgc2V0dXAoKSB7fVxuXG4gIC8qKlxuICAgKiBBbmFseXplcyB0aGUgdXNhZ2Ugb2YgdGhlIGdpdmVuIHF1ZXJ5IGFuZCBkZXRlcm1pbmVzIHRoZSBxdWVyeSB0aW1pbmcgYmFzZWRcbiAgICogb24gdGhlIGN1cnJlbnQgdXNhZ2Ugb2YgdGhlIHF1ZXJ5LlxuICAgKi9cbiAgZGV0ZWN0VGltaW5nKHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbik6IFRpbWluZ1Jlc3VsdCB7XG4gICAgaWYgKHF1ZXJ5LnByb3BlcnR5ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4ge3RpbWluZzogbnVsbCwgbWVzc2FnZTogJ1F1ZXJpZXMgZGVmaW5lZCBvbiBhY2Nlc3NvcnMgY2Fubm90IGJlIGFuYWx5emVkLid9O1xuICAgIH1cblxuICAgIGNvbnN0IHVzYWdlID0gdGhpcy5hbmFseXplUXVlcnlVc2FnZShxdWVyeS5jb250YWluZXIsIHF1ZXJ5LCBbXSk7XG5cbiAgICBpZiAodXNhZ2UgPT09IFJlc29sdmVkVXNhZ2UuQU1CSUdVT1VTKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aW1pbmc6IFF1ZXJ5VGltaW5nLlNUQVRJQyxcbiAgICAgICAgbWVzc2FnZTogJ1F1ZXJ5IHRpbWluZyBpcyBhbWJpZ3VvdXMuIFBsZWFzZSBjaGVjayBpZiB0aGUgcXVlcnkgY2FuIGJlIG1hcmtlZCBhcyBkeW5hbWljLidcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh1c2FnZSA9PT0gUmVzb2x2ZWRVc2FnZS5TWU5DSFJPTk9VUykge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IFF1ZXJ5VGltaW5nLlNUQVRJQ307XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBRdWVyeVRpbWluZy5EWU5BTUlDfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBxdWVyeSBpcyB1c2VkIHN0YXRpY2FsbHkgd2l0aGluIHRoZSBnaXZlbiBjbGFzcywgaXRzIHN1cGVyXG4gICAqIGNsYXNzIG9yIGRlcml2ZWQgY2xhc3Nlcy5cbiAgICovXG4gIHByaXZhdGUgYW5hbHl6ZVF1ZXJ5VXNhZ2UoXG4gICAgICBjbGFzc0RlY2w6IHRzLkNsYXNzRGVjbGFyYXRpb24sIHF1ZXJ5OiBOZ1F1ZXJ5RGVmaW5pdGlvbiwga25vd25JbnB1dE5hbWVzOiBzdHJpbmdbXSxcbiAgICAgIGZ1bmN0aW9uQ3R4OiBGdW5jdGlvbkNvbnRleHQgPSBuZXcgTWFwKCksIHZpc2l0SW5oZXJpdGVkQ2xhc3NlcyA9IHRydWUpOiBSZXNvbHZlZFVzYWdlIHtcbiAgICBjb25zdCB1c2FnZVZpc2l0b3IgPVxuICAgICAgICBuZXcgRGVjbGFyYXRpb25Vc2FnZVZpc2l0b3IocXVlcnkucHJvcGVydHkhLCB0aGlzLnR5cGVDaGVja2VyLCBmdW5jdGlvbkN0eCk7XG4gICAgY29uc3QgY2xhc3NNZXRhZGF0YSA9IHRoaXMuY2xhc3NNZXRhZGF0YS5nZXQoY2xhc3NEZWNsKTtcbiAgICBsZXQgdXNhZ2U6IFJlc29sdmVkVXNhZ2UgPSBSZXNvbHZlZFVzYWdlLkFTWU5DSFJPTk9VUztcblxuICAgIC8vIEluIGNhc2UgdGhlcmUgaXMgbWV0YWRhdGEgZm9yIHRoZSBjdXJyZW50IGNsYXNzLCB3ZSBjb2xsZWN0IGFsbCByZXNvbHZlZCBBbmd1bGFyIGlucHV0XG4gICAgLy8gbmFtZXMgYW5kIGFkZCB0aGVtIHRvIHRoZSBsaXN0IG9mIGtub3duIGlucHV0cyB0aGF0IG5lZWQgdG8gYmUgY2hlY2tlZCBmb3IgdXNhZ2VzIG9mXG4gICAgLy8gdGhlIGN1cnJlbnQgcXVlcnkuIGUuZy4gcXVlcmllcyB1c2VkIGluIGFuIEBJbnB1dCgpICpzZXR0ZXIqIGFyZSBhbHdheXMgc3RhdGljLlxuICAgIGlmIChjbGFzc01ldGFkYXRhKSB7XG4gICAgICBrbm93bklucHV0TmFtZXMucHVzaCguLi5jbGFzc01ldGFkYXRhLm5nSW5wdXROYW1lcyk7XG4gICAgfVxuXG4gICAgLy8gQXJyYXkgb2YgVHlwZVNjcmlwdCBub2RlcyB3aGljaCBjYW4gY29udGFpbiB1c2FnZXMgb2YgdGhlIGdpdmVuIHF1ZXJ5IGluXG4gICAgLy8gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuXG4gICAgY29uc3QgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzID0gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKGNsYXNzRGVjbCwgcXVlcnksIGtub3duSW5wdXROYW1lcyk7XG5cbiAgICAvLyBJbiBjYXNlIG5vZGVzIHRoYXQgY2FuIHBvc3NpYmx5IGFjY2VzcyBhIHF1ZXJ5IHN0YXRpY2FsbHkgaGF2ZSBiZWVuIGZvdW5kLCBjaGVja1xuICAgIC8vIGlmIHRoZSBxdWVyeSBkZWNsYXJhdGlvbiBpcyBzeW5jaHJvbm91c2x5IHVzZWQgd2l0aGluIGFueSBvZiB0aGVzZSBub2Rlcy5cbiAgICBpZiAocG9zc2libGVTdGF0aWNRdWVyeU5vZGVzLmxlbmd0aCkge1xuICAgICAgcG9zc2libGVTdGF0aWNRdWVyeU5vZGVzLmZvckVhY2goXG4gICAgICAgICAgbiA9PiB1c2FnZSA9IGNvbWJpbmVSZXNvbHZlZFVzYWdlKHVzYWdlLCB1c2FnZVZpc2l0b3IuZ2V0UmVzb2x2ZWROb2RlVXNhZ2UobikpKTtcbiAgICB9XG5cbiAgICBpZiAoIWNsYXNzTWV0YWRhdGEpIHtcbiAgICAgIHJldHVybiB1c2FnZTtcbiAgICB9XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIGEgY29tcG9uZW50IHRlbXBsYXRlIGZvciB0aGUgY3VycmVudCBjbGFzcywgd2UgY2hlY2sgaWYgdGhlXG4gICAgLy8gdGVtcGxhdGUgc3RhdGljYWxseSBhY2Nlc3NlcyB0aGUgY3VycmVudCBxdWVyeS4gSW4gY2FzZSB0aGF0J3MgdHJ1ZSwgdGhlIHF1ZXJ5XG4gICAgLy8gY2FuIGJlIG1hcmtlZCBhcyBzdGF0aWMuXG4gICAgaWYgKGNsYXNzTWV0YWRhdGEudGVtcGxhdGUgJiYgaGFzUHJvcGVydHlOYW1lVGV4dChxdWVyeS5wcm9wZXJ0eSEubmFtZSkpIHtcbiAgICAgIGNvbnN0IHRlbXBsYXRlID0gY2xhc3NNZXRhZGF0YS50ZW1wbGF0ZTtcbiAgICAgIGNvbnN0IHBhcnNlZEh0bWwgPSBwYXJzZUh0bWxHcmFjZWZ1bGx5KHRlbXBsYXRlLmNvbnRlbnQsIHRlbXBsYXRlLmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGh0bWxWaXNpdG9yID0gbmV3IFRlbXBsYXRlVXNhZ2VWaXNpdG9yKHF1ZXJ5LnByb3BlcnR5IS5uYW1lLnRleHQpO1xuXG4gICAgICBpZiAocGFyc2VkSHRtbCAmJiBodG1sVmlzaXRvci5pc1F1ZXJ5VXNlZFN0YXRpY2FsbHkocGFyc2VkSHRtbCkpIHtcbiAgICAgICAgcmV0dXJuIFJlc29sdmVkVXNhZ2UuU1lOQ0hST05PVVM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSBkZXJpdmVkIGNsYXNzZXMgc2hvdWxkIGFsc28gYmUgYW5hbHl6ZWQsIHdlIGRldGVybWluZSB0aGUgY2xhc3NlcyB0aGF0IGRlcml2ZVxuICAgIC8vIGZyb20gdGhlIGN1cnJlbnQgY2xhc3MgYW5kIGNoZWNrIGlmIHRoZXNlIGhhdmUgaW5wdXQgc2V0dGVycyBvciBsaWZlY3ljbGUgaG9va3MgdGhhdFxuICAgIC8vIHVzZSB0aGUgcXVlcnkgc3RhdGljYWxseS5cbiAgICBpZiAodmlzaXRJbmhlcml0ZWRDbGFzc2VzKSB7XG4gICAgICBjbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzLmZvckVhY2goZGVyaXZlZENsYXNzID0+IHtcbiAgICAgICAgdXNhZ2UgPSBjb21iaW5lUmVzb2x2ZWRVc2FnZShcbiAgICAgICAgICAgIHVzYWdlLCB0aGlzLmFuYWx5emVRdWVyeVVzYWdlKGRlcml2ZWRDbGFzcywgcXVlcnksIGtub3duSW5wdXROYW1lcykpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSB0aGUgY3VycmVudCBjbGFzcyBoYXMgYSBzdXBlciBjbGFzcywgd2UgZGV0ZXJtaW5lIGRlY2xhcmVkIGFic3RyYWN0IGZ1bmN0aW9uLWxpa2VcbiAgICAvLyBkZWNsYXJhdGlvbnMgaW4gdGhlIHN1cGVyLWNsYXNzIHRoYXQgYXJlIGltcGxlbWVudGVkIGluIHRoZSBjdXJyZW50IGNsYXNzLiBUaGUgc3VwZXIgY2xhc3NcbiAgICAvLyB3aWxsIHRoZW4gYmUgYW5hbHl6ZWQgd2l0aCB0aGUgYWJzdHJhY3QgZGVjbGFyYXRpb25zIG1hcHBlZCB0byB0aGUgaW1wbGVtZW50ZWQgVHlwZVNjcmlwdFxuICAgIC8vIG5vZGVzLiBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgcXVlcmllcyB3aGljaCBhcmUgdXNlZCBpbiBzdXBlciBjbGFzc2VzIHRocm91Z2ggZGVyaXZlZFxuICAgIC8vIGFic3RyYWN0IG1ldGhvZCBkZWNsYXJhdGlvbnMuXG4gICAgaWYgKGNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcykge1xuICAgICAgY29uc3Qgc3VwZXJDbGFzc0RlY2wgPSBjbGFzc01ldGFkYXRhLnN1cGVyQ2xhc3M7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgZnVuY3Rpb24gY29udGV4dCB0byBtYXAgYWJzdHJhY3QgZGVjbGFyYXRpb24gbm9kZXMgdG8gdGhlaXIgaW1wbGVtZW50YXRpb25cbiAgICAgIC8vIG5vZGUgaW4gdGhlIGJhc2UgY2xhc3MuIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBkZWNsYXJhdGlvbiB1c2FnZSB2aXNpdG9yIGNhbiBhbmFseXplXG4gICAgICAvLyBhYnN0cmFjdCBjbGFzcyBtZW1iZXIgZGVjbGFyYXRpb25zLlxuICAgICAgdXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHQoY2xhc3NEZWNsLCBmdW5jdGlvbkN0eCwgdGhpcy5jbGFzc01ldGFkYXRhKTtcblxuICAgICAgdXNhZ2UgPSBjb21iaW5lUmVzb2x2ZWRVc2FnZShcbiAgICAgICAgICB1c2FnZSwgdGhpcy5hbmFseXplUXVlcnlVc2FnZShzdXBlckNsYXNzRGVjbCwgcXVlcnksIFtdLCBmdW5jdGlvbkN0eCwgZmFsc2UpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXNhZ2U7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21iaW5lcyB0d28gcmVzb2x2ZWQgdXNhZ2VzIGJhc2VkIG9uIGEgZml4ZWQgcHJpb3JpdHkuIFwiU3luY2hyb25vdXNcIiB0YWtlc1xuICogcHJlY2VkZW5jZSBvdmVyIFwiQW1iaWd1b3VzXCIgd2hlcmVhcyBhbWJpZ3VvdXMgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIFwiQXN5bmNocm9ub3VzXCIuXG4gKi9cbmZ1bmN0aW9uIGNvbWJpbmVSZXNvbHZlZFVzYWdlKGJhc2U6IFJlc29sdmVkVXNhZ2UsIHRhcmdldDogUmVzb2x2ZWRVc2FnZSk6IFJlc29sdmVkVXNhZ2Uge1xuICBpZiAoYmFzZSA9PT0gUmVzb2x2ZWRVc2FnZS5TWU5DSFJPTk9VUykge1xuICAgIHJldHVybiBiYXNlO1xuICB9IGVsc2UgaWYgKHRhcmdldCAhPT0gUmVzb2x2ZWRVc2FnZS5BU1lOQ0hST05PVVMpIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBSZXNvbHZlZFVzYWdlLkFTWU5DSFJPTk9VUztcbiAgfVxufVxuXG4vKipcbiAqIEZpbHRlcnMgYWxsIGNsYXNzIG1lbWJlcnMgZnJvbSB0aGUgY2xhc3MgZGVjbGFyYXRpb24gdGhhdCBjYW4gYWNjZXNzIHRoZVxuICogZ2l2ZW4gcXVlcnkgc3RhdGljYWxseSAoZS5nLiBuZ09uSW5pdCBsaWZlY3ljbGUgaG9vayBvciBASW5wdXQgc2V0dGVycylcbiAqL1xuZnVuY3Rpb24gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLFxuICAgIGtub3duSW5wdXROYW1lczogc3RyaW5nW10pOiB0cy5CbG9ja1tdIHtcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnlcbiAgLy8gaW4gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuIGUuZy5cbiAgLy8gICgxKSBxdWVyaWVzIHVzZWQgaW4gdGhlIFwibmdPbkluaXRcIiBsaWZlY3ljbGUgaG9vayBhcmUgc3RhdGljLlxuICAvLyAgKDIpIGlucHV0cyB3aXRoIHNldHRlcnMgY2FuIGFjY2VzcyBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gIHJldHVybiBjbGFzc0RlY2wubWVtYmVyc1xuICAgICAgLmZpbHRlcihcbiAgICAgICAgICAobSk6XG4gICAgICAgICAgICAgIG0gaXModHMuU2V0QWNjZXNzb3JEZWNsYXJhdGlvbiB8IHRzLk1ldGhvZERlY2xhcmF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTW3F1ZXJ5LnR5cGVdLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAga25vd25JbnB1dE5hbWVzICYmIHRzLmlzU2V0QWNjZXNzb3IobSkgJiYgbS5ib2R5ICYmXG4gICAgICAgICAgICAgICAgICAgIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJiBrbm93bklucHV0TmFtZXMuaW5kZXhPZihtLm5hbWUudGV4dCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9KVxuICAgICAgLm1hcChtZW1iZXIgPT4gbWVtYmVyLmJvZHkhKTtcbn1cbiJdfQ==