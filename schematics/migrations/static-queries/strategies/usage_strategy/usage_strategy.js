/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
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
        constructor(classMetadata, typeChecker, compilerModule) {
            this.classMetadata = classMetadata;
            this.typeChecker = typeChecker;
            this.compilerModule = compilerModule;
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
            if (classMetadata.template && (0, property_name_1.hasPropertyNameText)(query.property.name)) {
                const template = classMetadata.template;
                const parsedHtml = (0, parse_html_1.parseHtmlGracefully)(template.content, template.filePath, this.compilerModule);
                const htmlVisitor = new template_usage_visitor_1.TemplateUsageVisitor(query.property.name.text, this.compilerModule);
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
                (0, super_class_context_1.updateSuperClassAbstractMembersContext)(classDecl, functionCtx, this.classMetadata);
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
            if (typescript_1.default.isMethodDeclaration(m) && m.body && (0, property_name_1.hasPropertyNameText)(m.name) &&
                STATIC_QUERY_LIFECYCLE_HOOKS[query.type].indexOf(m.name.text) !== -1) {
                return true;
            }
            else if (knownInputNames && typescript_1.default.isSetAccessor(m) && m.body &&
                (0, property_name_1.hasPropertyNameText)(m.name) && knownInputNames.indexOf(m.name.text) !== -1) {
                return true;
            }
            return false;
        })
            .map(member => member.body);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNhZ2Vfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvbWlncmF0aW9ucy9zdGF0aWMtcXVlcmllcy9zdHJhdGVnaWVzL3VzYWdlX3N0cmF0ZWd5L3VzYWdlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUU1QiwwRUFBaUU7SUFDakUsMkZBQStFO0lBRS9FLGtIQUF5RjtJQUd6RixzSkFBb0c7SUFDcEcsMElBQTZFO0lBQzdFLGdKQUE4RDtJQUc5RDs7O09BR0c7SUFDSCxNQUFNLDRCQUE0QixHQUFHO1FBQ25DLENBQUMsNEJBQVMsQ0FBQyxTQUFTLENBQUMsRUFDakIsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUMzRixDQUFDLDRCQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztLQUNuRSxDQUFDO0lBRUY7Ozs7T0FJRztJQUNILE1BQWEsa0JBQWtCO1FBQzdCLFlBQ1ksYUFBK0IsRUFBVSxXQUEyQixFQUNwRSxjQUFrRDtZQURsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7WUFDcEUsbUJBQWMsR0FBZCxjQUFjLENBQW9DO1FBQUcsQ0FBQztRQUVsRSxLQUFLLEtBQUksQ0FBQztRQUVWOzs7V0FHRztRQUNILFlBQVksQ0FBQyxLQUF3QjtZQUNuQyxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO2dCQUMzQixPQUFPLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsa0RBQWtELEVBQUMsQ0FBQzthQUNwRjtZQUVELE1BQU0sS0FBSyxHQUFH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O1lBQ3ZELElBQUksb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUEsbUNBQW1CLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbEUsNEJBQTRCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN4RSxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNLElBQ0gsZUFBZSxJQUFJLG9CQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJO2dCQUNoRCxJQUFBLG1DQUFtQixFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQzlFLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQzthQUNULEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtwYXJzZUh0bWxHcmFjZWZ1bGx5fSBmcm9tICcuLi8uLi8uLi8uLi91dGlscy9wYXJzZV9odG1sJztcbmltcG9ydCB7aGFzUHJvcGVydHlOYW1lVGV4dH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9wcm9wZXJ0eV9uYW1lJztcbmltcG9ydCB7Q2xhc3NNZXRhZGF0YU1hcH0gZnJvbSAnLi4vLi4vYW5ndWxhci9uZ19xdWVyeV92aXNpdG9yJztcbmltcG9ydCB7TmdRdWVyeURlZmluaXRpb24sIFF1ZXJ5VGltaW5nLCBRdWVyeVR5cGV9IGZyb20gJy4uLy4uL2FuZ3VsYXIvcXVlcnktZGVmaW5pdGlvbic7XG5pbXBvcnQge1RpbWluZ1Jlc3VsdCwgVGltaW5nU3RyYXRlZ3l9IGZyb20gJy4uL3RpbWluZy1zdHJhdGVneSc7XG5cbmltcG9ydCB7RGVjbGFyYXRpb25Vc2FnZVZpc2l0b3IsIEZ1bmN0aW9uQ29udGV4dCwgUmVzb2x2ZWRVc2FnZX0gZnJvbSAnLi9kZWNsYXJhdGlvbl91c2FnZV92aXNpdG9yJztcbmltcG9ydCB7dXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHR9IGZyb20gJy4vc3VwZXJfY2xhc3NfY29udGV4dCc7XG5pbXBvcnQge1RlbXBsYXRlVXNhZ2VWaXNpdG9yfSBmcm9tICcuL3RlbXBsYXRlX3VzYWdlX3Zpc2l0b3InO1xuXG5cbi8qKlxuICogT2JqZWN0IHRoYXQgbWFwcyBhIGdpdmVuIHR5cGUgb2YgcXVlcnkgdG8gYSBsaXN0IG9mIGxpZmVjeWNsZSBob29rcyB0aGF0XG4gKiBjb3VsZCBiZSB1c2VkIHRvIGFjY2VzcyBzdWNoIGEgcXVlcnkgc3RhdGljYWxseS5cbiAqL1xuY29uc3QgU1RBVElDX1FVRVJZX0xJRkVDWUNMRV9IT09LUyA9IHtcbiAgW1F1ZXJ5VHlwZS5WaWV3Q2hpbGRdOlxuICAgICAgWyduZ09uQ2hhbmdlcycsICduZ09uSW5pdCcsICduZ0RvQ2hlY2snLCAnbmdBZnRlckNvbnRlbnRJbml0JywgJ25nQWZ0ZXJDb250ZW50Q2hlY2tlZCddLFxuICBbUXVlcnlUeXBlLkNvbnRlbnRDaGlsZF06IFsnbmdPbkNoYW5nZXMnLCAnbmdPbkluaXQnLCAnbmdEb0NoZWNrJ10sXG59O1xuXG4vKipcbiAqIFF1ZXJ5IHRpbWluZyBzdHJhdGVneSB0aGF0IGRldGVybWluZXMgdGhlIHRpbWluZyBvZiBhIGdpdmVuIHF1ZXJ5IGJ5IGluc3BlY3RpbmcgaG93XG4gKiB0aGUgcXVlcnkgaXMgYWNjZXNzZWQgd2l0aGluIHRoZSBwcm9qZWN0J3MgVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMuIFJlYWQgbW9yZSBhYm91dFxuICogdGhpcyBzdHJhdGVneSBoZXJlOiBodHRwczovL2hhY2ttZC5pby9zL0h5bXZjMk9LRVxuICovXG5leHBvcnQgY2xhc3MgUXVlcnlVc2FnZVN0cmF0ZWd5IGltcGxlbWVudHMgVGltaW5nU3RyYXRlZ3kge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgY2xhc3NNZXRhZGF0YTogQ2xhc3NNZXRhZGF0YU1hcCwgcHJpdmF0ZSB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgICBwcml2YXRlIGNvbXBpbGVyTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlcicpKSB7fVxuXG4gIHNldHVwKCkge31cblxuICAvKipcbiAgICogQW5hbHl6ZXMgdGhlIHVzYWdlIG9mIHRoZSBnaXZlbiBxdWVyeSBhbmQgZGV0ZXJtaW5lcyB0aGUgcXVlcnkgdGltaW5nIGJhc2VkXG4gICAqIG9uIHRoZSBjdXJyZW50IHVzYWdlIG9mIHRoZSBxdWVyeS5cbiAgICovXG4gIGRldGVjdFRpbWluZyhxdWVyeTogTmdRdWVyeURlZmluaXRpb24pOiBUaW1pbmdSZXN1bHQge1xuICAgIGlmIChxdWVyeS5wcm9wZXJ0eSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt0aW1pbmc6IG51bGwsIG1lc3NhZ2U6ICdRdWVyaWVzIGRlZmluZWQgb24gYWNjZXNzb3JzIGNhbm5vdCBiZSBhbmFseXplZC4nfTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2FnZSA9IHRoaXMuYW5hbHl6ZVF1ZXJ5VXNhZ2UocXVlcnkuY29udGFpbmVyLCBxdWVyeSwgW10pO1xuXG4gICAgaWYgKHVzYWdlID09PSBSZXNvbHZlZFVzYWdlLkFNQklHVU9VUykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGltaW5nOiBRdWVyeVRpbWluZy5TVEFUSUMsXG4gICAgICAgIG1lc3NhZ2U6ICdRdWVyeSB0aW1pbmcgaXMgYW1iaWd1b3VzLiBQbGVhc2UgY2hlY2sgaWYgdGhlIHF1ZXJ5IGNhbiBiZSBtYXJrZWQgYXMgZHluYW1pYy4nXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAodXNhZ2UgPT09IFJlc29sdmVkVXNhZ2UuU1lOQ0hST05PVVMpIHtcbiAgICAgIHJldHVybiB7dGltaW5nOiBRdWVyeVRpbWluZy5TVEFUSUN9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge3RpbWluZzogUXVlcnlUaW1pbmcuRFlOQU1JQ307XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gcXVlcnkgaXMgdXNlZCBzdGF0aWNhbGx5IHdpdGhpbiB0aGUgZ2l2ZW4gY2xhc3MsIGl0cyBzdXBlclxuICAgKiBjbGFzcyBvciBkZXJpdmVkIGNsYXNzZXMuXG4gICAqL1xuICBwcml2YXRlIGFuYWx5emVRdWVyeVVzYWdlKFxuICAgICAgY2xhc3NEZWNsOiB0cy5DbGFzc0RlY2xhcmF0aW9uLCBxdWVyeTogTmdRdWVyeURlZmluaXRpb24sIGtub3duSW5wdXROYW1lczogc3RyaW5nW10sXG4gICAgICBmdW5jdGlvbkN0eDogRnVuY3Rpb25Db250ZXh0ID0gbmV3IE1hcCgpLCB2aXNpdEluaGVyaXRlZENsYXNzZXMgPSB0cnVlKTogUmVzb2x2ZWRVc2FnZSB7XG4gICAgY29uc3QgdXNhZ2VWaXNpdG9yID1cbiAgICAgICAgbmV3IERlY2xhcmF0aW9uVXNhZ2VWaXNpdG9yKHF1ZXJ5LnByb3BlcnR5ISwgdGhpcy50eXBlQ2hlY2tlciwgZnVuY3Rpb25DdHgpO1xuICAgIGNvbnN0IGNsYXNzTWV0YWRhdGEgPSB0aGlzLmNsYXNzTWV0YWRhdGEuZ2V0KGNsYXNzRGVjbCk7XG4gICAgbGV0IHVzYWdlOiBSZXNvbHZlZFVzYWdlID0gUmVzb2x2ZWRVc2FnZS5BU1lOQ0hST05PVVM7XG5cbiAgICAvLyBJbiBjYXNlIHRoZXJlIGlzIG1ldGFkYXRhIGZvciB0aGUgY3VycmVudCBjbGFzcywgd2UgY29sbGVjdCBhbGwgcmVzb2x2ZWQgQW5ndWxhciBpbnB1dFxuICAgIC8vIG5hbWVzIGFuZCBhZGQgdGhlbSB0byB0aGUgbGlzdCBvZiBrbm93biBpbnB1dHMgdGhhdCBuZWVkIHRvIGJlIGNoZWNrZWQgZm9yIHVzYWdlcyBvZlxuICAgIC8vIHRoZSBjdXJyZW50IHF1ZXJ5LiBlLmcuIHF1ZXJpZXMgdXNlZCBpbiBhbiBASW5wdXQoKSAqc2V0dGVyKiBhcmUgYWx3YXlzIHN0YXRpYy5cbiAgICBpZiAoY2xhc3NNZXRhZGF0YSkge1xuICAgICAga25vd25JbnB1dE5hbWVzLnB1c2goLi4uY2xhc3NNZXRhZGF0YS5uZ0lucHV0TmFtZXMpO1xuICAgIH1cblxuICAgIC8vIEFycmF5IG9mIFR5cGVTY3JpcHQgbm9kZXMgd2hpY2ggY2FuIGNvbnRhaW4gdXNhZ2VzIG9mIHRoZSBnaXZlbiBxdWVyeSBpblxuICAgIC8vIG9yZGVyIHRvIGFjY2VzcyBpdCBzdGF0aWNhbGx5LlxuICAgIGNvbnN0IHBvc3NpYmxlU3RhdGljUXVlcnlOb2RlcyA9IGZpbHRlclF1ZXJ5Q2xhc3NNZW1iZXJOb2RlcyhjbGFzc0RlY2wsIHF1ZXJ5LCBrbm93bklucHV0TmFtZXMpO1xuXG4gICAgLy8gSW4gY2FzZSBub2RlcyB0aGF0IGNhbiBwb3NzaWJseSBhY2Nlc3MgYSBxdWVyeSBzdGF0aWNhbGx5IGhhdmUgYmVlbiBmb3VuZCwgY2hlY2tcbiAgICAvLyBpZiB0aGUgcXVlcnkgZGVjbGFyYXRpb24gaXMgc3luY2hyb25vdXNseSB1c2VkIHdpdGhpbiBhbnkgb2YgdGhlc2Ugbm9kZXMuXG4gICAgaWYgKHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5sZW5ndGgpIHtcbiAgICAgIHBvc3NpYmxlU3RhdGljUXVlcnlOb2Rlcy5mb3JFYWNoKFxuICAgICAgICAgIG4gPT4gdXNhZ2UgPSBjb21iaW5lUmVzb2x2ZWRVc2FnZSh1c2FnZSwgdXNhZ2VWaXNpdG9yLmdldFJlc29sdmVkTm9kZVVzYWdlKG4pKSk7XG4gICAgfVxuXG4gICAgaWYgKCFjbGFzc01ldGFkYXRhKSB7XG4gICAgICByZXR1cm4gdXNhZ2U7XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSB0aGVyZSBpcyBhIGNvbXBvbmVudCB0ZW1wbGF0ZSBmb3IgdGhlIGN1cnJlbnQgY2xhc3MsIHdlIGNoZWNrIGlmIHRoZVxuICAgIC8vIHRlbXBsYXRlIHN0YXRpY2FsbHkgYWNjZXNzZXMgdGhlIGN1cnJlbnQgcXVlcnkuIEluIGNhc2UgdGhhdCdzIHRydWUsIHRoZSBxdWVyeVxuICAgIC8vIGNhbiBiZSBtYXJrZWQgYXMgc3RhdGljLlxuICAgIGlmIChjbGFzc01ldGFkYXRhLnRlbXBsYXRlICYmIGhhc1Byb3BlcnR5TmFtZVRleHQocXVlcnkucHJvcGVydHkhLm5hbWUpKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IGNsYXNzTWV0YWRhdGEudGVtcGxhdGU7XG4gICAgICBjb25zdCBwYXJzZWRIdG1sID1cbiAgICAgICAgICBwYXJzZUh0bWxHcmFjZWZ1bGx5KHRlbXBsYXRlLmNvbnRlbnQsIHRlbXBsYXRlLmZpbGVQYXRoLCB0aGlzLmNvbXBpbGVyTW9kdWxlKTtcbiAgICAgIGNvbnN0IGh0bWxWaXNpdG9yID0gbmV3IFRlbXBsYXRlVXNhZ2VWaXNpdG9yKHF1ZXJ5LnByb3BlcnR5IS5uYW1lLnRleHQsIHRoaXMuY29tcGlsZXJNb2R1bGUpO1xuXG4gICAgICBpZiAocGFyc2VkSHRtbCAmJiBodG1sVmlzaXRvci5pc1F1ZXJ5VXNlZFN0YXRpY2FsbHkocGFyc2VkSHRtbCkpIHtcbiAgICAgICAgcmV0dXJuIFJlc29sdmVkVXNhZ2UuU1lOQ0hST05PVVM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSBkZXJpdmVkIGNsYXNzZXMgc2hvdWxkIGFsc28gYmUgYW5hbHl6ZWQsIHdlIGRldGVybWluZSB0aGUgY2xhc3NlcyB0aGF0IGRlcml2ZVxuICAgIC8vIGZyb20gdGhlIGN1cnJlbnQgY2xhc3MgYW5kIGNoZWNrIGlmIHRoZXNlIGhhdmUgaW5wdXQgc2V0dGVycyBvciBsaWZlY3ljbGUgaG9va3MgdGhhdFxuICAgIC8vIHVzZSB0aGUgcXVlcnkgc3RhdGljYWxseS5cbiAgICBpZiAodmlzaXRJbmhlcml0ZWRDbGFzc2VzKSB7XG4gICAgICBjbGFzc01ldGFkYXRhLmRlcml2ZWRDbGFzc2VzLmZvckVhY2goZGVyaXZlZENsYXNzID0+IHtcbiAgICAgICAgdXNhZ2UgPSBjb21iaW5lUmVzb2x2ZWRVc2FnZShcbiAgICAgICAgICAgIHVzYWdlLCB0aGlzLmFuYWx5emVRdWVyeVVzYWdlKGRlcml2ZWRDbGFzcywgcXVlcnksIGtub3duSW5wdXROYW1lcykpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSW4gY2FzZSB0aGUgY3VycmVudCBjbGFzcyBoYXMgYSBzdXBlciBjbGFzcywgd2UgZGV0ZXJtaW5lIGRlY2xhcmVkIGFic3RyYWN0IGZ1bmN0aW9uLWxpa2VcbiAgICAvLyBkZWNsYXJhdGlvbnMgaW4gdGhlIHN1cGVyLWNsYXNzIHRoYXQgYXJlIGltcGxlbWVudGVkIGluIHRoZSBjdXJyZW50IGNsYXNzLiBUaGUgc3VwZXIgY2xhc3NcbiAgICAvLyB3aWxsIHRoZW4gYmUgYW5hbHl6ZWQgd2l0aCB0aGUgYWJzdHJhY3QgZGVjbGFyYXRpb25zIG1hcHBlZCB0byB0aGUgaW1wbGVtZW50ZWQgVHlwZVNjcmlwdFxuICAgIC8vIG5vZGVzLiBUaGlzIGFsbG93cyB1cyB0byBoYW5kbGUgcXVlcmllcyB3aGljaCBhcmUgdXNlZCBpbiBzdXBlciBjbGFzc2VzIHRocm91Z2ggZGVyaXZlZFxuICAgIC8vIGFic3RyYWN0IG1ldGhvZCBkZWNsYXJhdGlvbnMuXG4gICAgaWYgKGNsYXNzTWV0YWRhdGEuc3VwZXJDbGFzcykge1xuICAgICAgY29uc3Qgc3VwZXJDbGFzc0RlY2wgPSBjbGFzc01ldGFkYXRhLnN1cGVyQ2xhc3M7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgZnVuY3Rpb24gY29udGV4dCB0byBtYXAgYWJzdHJhY3QgZGVjbGFyYXRpb24gbm9kZXMgdG8gdGhlaXIgaW1wbGVtZW50YXRpb25cbiAgICAgIC8vIG5vZGUgaW4gdGhlIGJhc2UgY2xhc3MuIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBkZWNsYXJhdGlvbiB1c2FnZSB2aXNpdG9yIGNhbiBhbmFseXplXG4gICAgICAvLyBhYnN0cmFjdCBjbGFzcyBtZW1iZXIgZGVjbGFyYXRpb25zLlxuICAgICAgdXBkYXRlU3VwZXJDbGFzc0Fic3RyYWN0TWVtYmVyc0NvbnRleHQoY2xhc3NEZWNsLCBmdW5jdGlvbkN0eCwgdGhpcy5jbGFzc01ldGFkYXRhKTtcblxuICAgICAgdXNhZ2UgPSBjb21iaW5lUmVzb2x2ZWRVc2FnZShcbiAgICAgICAgICB1c2FnZSwgdGhpcy5hbmFseXplUXVlcnlVc2FnZShzdXBlckNsYXNzRGVjbCwgcXVlcnksIFtdLCBmdW5jdGlvbkN0eCwgZmFsc2UpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXNhZ2U7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21iaW5lcyB0d28gcmVzb2x2ZWQgdXNhZ2VzIGJhc2VkIG9uIGEgZml4ZWQgcHJpb3JpdHkuIFwiU3luY2hyb25vdXNcIiB0YWtlc1xuICogcHJlY2VkZW5jZSBvdmVyIFwiQW1iaWd1b3VzXCIgd2hlcmVhcyBhbWJpZ3VvdXMgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIFwiQXN5bmNocm9ub3VzXCIuXG4gKi9cbmZ1bmN0aW9uIGNvbWJpbmVSZXNvbHZlZFVzYWdlKGJhc2U6IFJlc29sdmVkVXNhZ2UsIHRhcmdldDogUmVzb2x2ZWRVc2FnZSk6IFJlc29sdmVkVXNhZ2Uge1xuICBpZiAoYmFzZSA9PT0gUmVzb2x2ZWRVc2FnZS5TWU5DSFJPTk9VUykge1xuICAgIHJldHVybiBiYXNlO1xuICB9IGVsc2UgaWYgKHRhcmdldCAhPT0gUmVzb2x2ZWRVc2FnZS5BU1lOQ0hST05PVVMpIHtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBSZXNvbHZlZFVzYWdlLkFTWU5DSFJPTk9VUztcbiAgfVxufVxuXG4vKipcbiAqIEZpbHRlcnMgYWxsIGNsYXNzIG1lbWJlcnMgZnJvbSB0aGUgY2xhc3MgZGVjbGFyYXRpb24gdGhhdCBjYW4gYWNjZXNzIHRoZVxuICogZ2l2ZW4gcXVlcnkgc3RhdGljYWxseSAoZS5nLiBuZ09uSW5pdCBsaWZlY3ljbGUgaG9vayBvciBASW5wdXQgc2V0dGVycylcbiAqL1xuZnVuY3Rpb24gZmlsdGVyUXVlcnlDbGFzc01lbWJlck5vZGVzKFxuICAgIGNsYXNzRGVjbDogdHMuQ2xhc3NEZWNsYXJhdGlvbiwgcXVlcnk6IE5nUXVlcnlEZWZpbml0aW9uLFxuICAgIGtub3duSW5wdXROYW1lczogc3RyaW5nW10pOiB0cy5CbG9ja1tdIHtcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlU2NyaXB0IG5vZGVzIHdoaWNoIGNhbiBjb250YWluIHVzYWdlcyBvZiB0aGUgZ2l2ZW4gcXVlcnlcbiAgLy8gaW4gb3JkZXIgdG8gYWNjZXNzIGl0IHN0YXRpY2FsbHkuIGUuZy5cbiAgLy8gICgxKSBxdWVyaWVzIHVzZWQgaW4gdGhlIFwibmdPbkluaXRcIiBsaWZlY3ljbGUgaG9vayBhcmUgc3RhdGljLlxuICAvLyAgKDIpIGlucHV0cyB3aXRoIHNldHRlcnMgY2FuIGFjY2VzcyBxdWVyaWVzIHN0YXRpY2FsbHkuXG4gIHJldHVybiBjbGFzc0RlY2wubWVtYmVyc1xuICAgICAgLmZpbHRlcihcbiAgICAgICAgICAobSk6XG4gICAgICAgICAgICAgIG0gaXModHMuU2V0QWNjZXNzb3JEZWNsYXJhdGlvbiB8IHRzLk1ldGhvZERlY2xhcmF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRzLmlzTWV0aG9kRGVjbGFyYXRpb24obSkgJiYgbS5ib2R5ICYmIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJlxuICAgICAgICAgICAgICAgICAgICBTVEFUSUNfUVVFUllfTElGRUNZQ0xFX0hPT0tTW3F1ZXJ5LnR5cGVdLmluZGV4T2YobS5uYW1lLnRleHQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAga25vd25JbnB1dE5hbWVzICYmIHRzLmlzU2V0QWNjZXNzb3IobSkgJiYgbS5ib2R5ICYmXG4gICAgICAgICAgICAgICAgICAgIGhhc1Byb3BlcnR5TmFtZVRleHQobS5uYW1lKSAmJiBrbm93bklucHV0TmFtZXMuaW5kZXhPZihtLm5hbWUudGV4dCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9KVxuICAgICAgLm1hcChtZW1iZXIgPT4gbWVtYmVyLmJvZHkhKTtcbn1cbiJdfQ==