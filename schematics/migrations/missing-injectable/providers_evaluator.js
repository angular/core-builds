/**
 * @license
 * Copyright Google LLC All Rights Reserved.
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
        define("@angular/core/schematics/migrations/missing-injectable/providers_evaluator", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createProvidersEvaluator = void 0;
    /**
     * A factory function to create an evaluator for providers. This is required to be a
     * factory function because the underlying class extends a class that is only available
     * from within a dynamically imported module (`@angular/compiler-cli/private/migrations`)
     * and is therefore not available at module evaluation time.
     */
    function createProvidersEvaluator(compilerCliMigrationsModule, host, checker) {
        /**
         * Providers evaluator that extends the ngtsc static interpreter. This is necessary because
         * the static interpreter by default only exposes the resolved value, but we are also interested
         * in the TypeScript nodes that declare providers. It would be possible to manually traverse the
         * AST to collect these nodes, but that would mean that we need to re-implement the static
         * interpreter in order to handle all possible scenarios. (e.g. spread operator, function calls,
         * callee scope). This can be avoided by simply extending the static interpreter and intercepting
         * the "visitObjectLiteralExpression" method.
         */
        class ProvidersEvaluator extends compilerCliMigrationsModule.StaticInterpreter {
            constructor() {
                super(...arguments);
                this._providerLiterals = [];
            }
            visitObjectLiteralExpression(node, context) {
                const resolvedValue = super.visitObjectLiteralExpression(node, Object.assign(Object.assign({}, context), { insideProviderDef: true }));
                // do not collect nested object literals. e.g. a provider could use a
                // spread assignment (which resolves to another object literal). In that
                // case the referenced object literal is not a provider object literal.
                if (!context.insideProviderDef) {
                    this._providerLiterals.push({ node, resolvedValue });
                }
                return resolvedValue;
            }
            /**
             * Evaluates the given expression and returns its statically resolved value
             * and a list of object literals which define Angular providers.
             */
            evaluate(expr) {
                this._providerLiterals = [];
                const resolvedValue = this.visit(expr, {
                    originatingFile: expr.getSourceFile(),
                    absoluteModuleName: null,
                    resolutionContext: expr.getSourceFile().fileName,
                    scope: new Map(),
                    foreignFunctionResolver: compilerCliMigrationsModule.forwardRefResolver
                });
                return { resolvedValue, literals: this._providerLiterals };
            }
        }
        return new ProvidersEvaluator(host, checker, /* dependencyTracker */ null);
    }
    exports.createProvidersEvaluator = createProvidersEvaluator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2V2YWx1YXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL21pc3NpbmctaW5qZWN0YWJsZS9wcm92aWRlcnNfZXZhbHVhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQVdIOzs7OztPQUtHO0lBQ0gsU0FBZ0Isd0JBQXdCLENBQ3BDLDJCQUFzRixFQUN0RixJQUE4QixFQUFFLE9BQXVCO1FBTXpEOzs7Ozs7OztXQVFHO1FBQ0gsTUFBTSxrQkFBbUIsU0FBUSwyQkFBMkIsQ0FBQyxpQkFBaUI7WUFBOUU7O2dCQUNVLHNCQUFpQixHQUFzQixFQUFFLENBQUM7WUE2QnBELENBQUM7WUEzQlUsNEJBQTRCLENBQUMsSUFBZ0MsRUFBRSxPQUFZO2dCQUNsRixNQUFNLGFBQWEsR0FDZixLQUFLLENBQUMsNEJBQTRCLENBQUMsSUFBSSxrQ0FBTSxPQUFPLEtBQUUsaUJBQWlCLEVBQUUsSUFBSSxJQUFFLENBQUM7Z0JBQ3BGLHFFQUFxRTtnQkFDckUsd0VBQXdFO2dCQUN4RSx1RUFBdUU7Z0JBQ3ZFLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUU7b0JBQzlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsYUFBYSxFQUFDLENBQUMsQ0FBQztpQkFDcEQ7Z0JBQ0QsT0FBTyxhQUFhLENBQUM7WUFDdkIsQ0FBQztZQUVEOzs7ZUFHRztZQUNILFFBQVEsQ0FBQyxJQUFtQjtnQkFDMUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7b0JBQ3JDLGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFO29CQUNyQyxrQkFBa0IsRUFBRSxJQUFJO29CQUN4QixpQkFBaUIsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUTtvQkFDaEQsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFFO29CQUNoQix1QkFBdUIsRUFBRSwyQkFBMkIsQ0FBQyxrQkFBa0I7aUJBQ3hFLENBQUMsQ0FBQztnQkFDSCxPQUFPLEVBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUMsQ0FBQztZQUMzRCxDQUFDO1NBQ0Y7UUFFRCxPQUFPLElBQUksa0JBQWtCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBbERELDREQWtEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB0eXBlIHtSZXNvbHZlZFZhbHVlLCBUeXBlU2NyaXB0UmVmbGVjdGlvbkhvc3R9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9wcml2YXRlL21pZ3JhdGlvbnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb3ZpZGVyTGl0ZXJhbCB7XG4gIG5vZGU6IHRzLk9iamVjdExpdGVyYWxFeHByZXNzaW9uO1xuICByZXNvbHZlZFZhbHVlOiBSZXNvbHZlZFZhbHVlO1xufVxuXG4vKipcbiAqIEEgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgYW4gZXZhbHVhdG9yIGZvciBwcm92aWRlcnMuIFRoaXMgaXMgcmVxdWlyZWQgdG8gYmUgYVxuICogZmFjdG9yeSBmdW5jdGlvbiBiZWNhdXNlIHRoZSB1bmRlcmx5aW5nIGNsYXNzIGV4dGVuZHMgYSBjbGFzcyB0aGF0IGlzIG9ubHkgYXZhaWxhYmxlXG4gKiBmcm9tIHdpdGhpbiBhIGR5bmFtaWNhbGx5IGltcG9ydGVkIG1vZHVsZSAoYEBhbmd1bGFyL2NvbXBpbGVyLWNsaS9wcml2YXRlL21pZ3JhdGlvbnNgKVxuICogYW5kIGlzIHRoZXJlZm9yZSBub3QgYXZhaWxhYmxlIGF0IG1vZHVsZSBldmFsdWF0aW9uIHRpbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm92aWRlcnNFdmFsdWF0b3IoXG4gICAgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlOiB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGkvcHJpdmF0ZS9taWdyYXRpb25zJyksXG4gICAgaG9zdDogVHlwZVNjcmlwdFJlZmxlY3Rpb25Ib3N0LCBjaGVja2VyOiB0cy5UeXBlQ2hlY2tlcik6IHtcbiAgZXZhbHVhdGU6XG4gICAgICAoZXhwcjogdHMuRXhwcmVzc2lvbikgPT4ge1xuICAgICAgICByZXNvbHZlZFZhbHVlOiBSZXNvbHZlZFZhbHVlLCBsaXRlcmFsczogUHJvdmlkZXJMaXRlcmFsW11cbiAgICAgIH1cbn0ge1xuICAvKipcbiAgICogUHJvdmlkZXJzIGV2YWx1YXRvciB0aGF0IGV4dGVuZHMgdGhlIG5ndHNjIHN0YXRpYyBpbnRlcnByZXRlci4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZVxuICAgKiB0aGUgc3RhdGljIGludGVycHJldGVyIGJ5IGRlZmF1bHQgb25seSBleHBvc2VzIHRoZSByZXNvbHZlZCB2YWx1ZSwgYnV0IHdlIGFyZSBhbHNvIGludGVyZXN0ZWRcbiAgICogaW4gdGhlIFR5cGVTY3JpcHQgbm9kZXMgdGhhdCBkZWNsYXJlIHByb3ZpZGVycy4gSXQgd291bGQgYmUgcG9zc2libGUgdG8gbWFudWFsbHkgdHJhdmVyc2UgdGhlXG4gICAqIEFTVCB0byBjb2xsZWN0IHRoZXNlIG5vZGVzLCBidXQgdGhhdCB3b3VsZCBtZWFuIHRoYXQgd2UgbmVlZCB0byByZS1pbXBsZW1lbnQgdGhlIHN0YXRpY1xuICAgKiBpbnRlcnByZXRlciBpbiBvcmRlciB0byBoYW5kbGUgYWxsIHBvc3NpYmxlIHNjZW5hcmlvcy4gKGUuZy4gc3ByZWFkIG9wZXJhdG9yLCBmdW5jdGlvbiBjYWxscyxcbiAgICogY2FsbGVlIHNjb3BlKS4gVGhpcyBjYW4gYmUgYXZvaWRlZCBieSBzaW1wbHkgZXh0ZW5kaW5nIHRoZSBzdGF0aWMgaW50ZXJwcmV0ZXIgYW5kIGludGVyY2VwdGluZ1xuICAgKiB0aGUgXCJ2aXNpdE9iamVjdExpdGVyYWxFeHByZXNzaW9uXCIgbWV0aG9kLlxuICAgKi9cbiAgY2xhc3MgUHJvdmlkZXJzRXZhbHVhdG9yIGV4dGVuZHMgY29tcGlsZXJDbGlNaWdyYXRpb25zTW9kdWxlLlN0YXRpY0ludGVycHJldGVyIHtcbiAgICBwcml2YXRlIF9wcm92aWRlckxpdGVyYWxzOiBQcm92aWRlckxpdGVyYWxbXSA9IFtdO1xuXG4gICAgb3ZlcnJpZGUgdmlzaXRPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiwgY29udGV4dDogYW55KSB7XG4gICAgICBjb25zdCByZXNvbHZlZFZhbHVlID1cbiAgICAgICAgICBzdXBlci52aXNpdE9iamVjdExpdGVyYWxFeHByZXNzaW9uKG5vZGUsIHsuLi5jb250ZXh0LCBpbnNpZGVQcm92aWRlckRlZjogdHJ1ZX0pO1xuICAgICAgLy8gZG8gbm90IGNvbGxlY3QgbmVzdGVkIG9iamVjdCBsaXRlcmFscy4gZS5nLiBhIHByb3ZpZGVyIGNvdWxkIHVzZSBhXG4gICAgICAvLyBzcHJlYWQgYXNzaWdubWVudCAod2hpY2ggcmVzb2x2ZXMgdG8gYW5vdGhlciBvYmplY3QgbGl0ZXJhbCkuIEluIHRoYXRcbiAgICAgIC8vIGNhc2UgdGhlIHJlZmVyZW5jZWQgb2JqZWN0IGxpdGVyYWwgaXMgbm90IGEgcHJvdmlkZXIgb2JqZWN0IGxpdGVyYWwuXG4gICAgICBpZiAoIWNvbnRleHQuaW5zaWRlUHJvdmlkZXJEZWYpIHtcbiAgICAgICAgdGhpcy5fcHJvdmlkZXJMaXRlcmFscy5wdXNoKHtub2RlLCByZXNvbHZlZFZhbHVlfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmFsdWF0ZXMgdGhlIGdpdmVuIGV4cHJlc3Npb24gYW5kIHJldHVybnMgaXRzIHN0YXRpY2FsbHkgcmVzb2x2ZWQgdmFsdWVcbiAgICAgKiBhbmQgYSBsaXN0IG9mIG9iamVjdCBsaXRlcmFscyB3aGljaCBkZWZpbmUgQW5ndWxhciBwcm92aWRlcnMuXG4gICAgICovXG4gICAgZXZhbHVhdGUoZXhwcjogdHMuRXhwcmVzc2lvbikge1xuICAgICAgdGhpcy5fcHJvdmlkZXJMaXRlcmFscyA9IFtdO1xuICAgICAgY29uc3QgcmVzb2x2ZWRWYWx1ZSA9IHRoaXMudmlzaXQoZXhwciwge1xuICAgICAgICBvcmlnaW5hdGluZ0ZpbGU6IGV4cHIuZ2V0U291cmNlRmlsZSgpLFxuICAgICAgICBhYnNvbHV0ZU1vZHVsZU5hbWU6IG51bGwsXG4gICAgICAgIHJlc29sdXRpb25Db250ZXh0OiBleHByLmdldFNvdXJjZUZpbGUoKS5maWxlTmFtZSxcbiAgICAgICAgc2NvcGU6IG5ldyBNYXAoKSxcbiAgICAgICAgZm9yZWlnbkZ1bmN0aW9uUmVzb2x2ZXI6IGNvbXBpbGVyQ2xpTWlncmF0aW9uc01vZHVsZS5mb3J3YXJkUmVmUmVzb2x2ZXJcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHtyZXNvbHZlZFZhbHVlLCBsaXRlcmFsczogdGhpcy5fcHJvdmlkZXJMaXRlcmFsc307XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm92aWRlcnNFdmFsdWF0b3IoaG9zdCwgY2hlY2tlciwgLyogZGVwZW5kZW5jeVRyYWNrZXIgKi8gbnVsbCk7XG59XG4iXX0=