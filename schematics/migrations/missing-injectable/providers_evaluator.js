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
        define("@angular/core/schematics/migrations/missing-injectable/providers_evaluator", ["require", "exports", "@angular/compiler-cli/src/ngtsc/annotations", "@angular/compiler-cli/src/ngtsc/partial_evaluator/src/interpreter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProvidersEvaluator = void 0;
    const annotations_1 = require("@angular/compiler-cli/src/ngtsc/annotations");
    const interpreter_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/interpreter");
    /**
     * Providers evaluator that extends the ngtsc static interpreter. This is necessary because
     * the static interpreter by default only exposes the resolved value, but we are also interested
     * in the TypeScript nodes that declare providers. It would be possible to manually traverse the
     * AST to collect these nodes, but that would mean that we need to re-implement the static
     * interpreter in order to handle all possible scenarios. (e.g. spread operator, function calls,
     * callee scope). This can be avoided by simply extending the static interpreter and intercepting
     * the "visitObjectLiteralExpression" method.
     */
    class ProvidersEvaluator extends interpreter_1.StaticInterpreter {
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
                foreignFunctionResolver: annotations_1.forwardRefResolver
            });
            return { resolvedValue, literals: this._providerLiterals };
        }
    }
    exports.ProvidersEvaluator = ProvidersEvaluator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzX2V2YWx1YXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL21pc3NpbmctaW5qZWN0YWJsZS9wcm92aWRlcnNfZXZhbHVhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILDZFQUErRTtJQUUvRSxtR0FBb0c7SUFRcEc7Ozs7Ozs7O09BUUc7SUFDSCxNQUFhLGtCQUFtQixTQUFRLCtCQUFpQjtRQUF6RDs7WUFDVSxzQkFBaUIsR0FBc0IsRUFBRSxDQUFDO1FBNkJwRCxDQUFDO1FBM0JDLDRCQUE0QixDQUFDLElBQWdDLEVBQUUsT0FBWTtZQUN6RSxNQUFNLGFBQWEsR0FDZixLQUFLLENBQUMsNEJBQTRCLENBQUMsSUFBSSxrQ0FBTSxPQUFPLEtBQUUsaUJBQWlCLEVBQUUsSUFBSSxJQUFFLENBQUM7WUFDcEYscUVBQXFFO1lBQ3JFLHdFQUF3RTtZQUN4RSx1RUFBdUU7WUFDdkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFDLElBQUksRUFBRSxhQUFhLEVBQUMsQ0FBQyxDQUFDO2FBQ3BEO1lBQ0QsT0FBTyxhQUFhLENBQUM7UUFDdkIsQ0FBQztRQUVEOzs7V0FHRztRQUNILFFBQVEsQ0FBQyxJQUFtQjtZQUMxQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDO1lBQzVCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNyQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDckMsa0JBQWtCLEVBQUUsSUFBSTtnQkFDeEIsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVE7Z0JBQ2hELEtBQUssRUFBRSxJQUFJLEdBQUcsRUFBRTtnQkFDaEIsdUJBQXVCLEVBQUUsZ0NBQWtCO2FBQzVDLENBQUMsQ0FBQztZQUNILE9BQU8sRUFBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBQyxDQUFDO1FBQzNELENBQUM7S0FDRjtJQTlCRCxnREE4QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Zm9yd2FyZFJlZlJlc29sdmVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL2Fubm90YXRpb25zJztcbmltcG9ydCB7UmVzb2x2ZWRWYWx1ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvcic7XG5pbXBvcnQge1N0YXRpY0ludGVycHJldGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yL3NyYy9pbnRlcnByZXRlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlckxpdGVyYWwge1xuICBub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbjtcbiAgcmVzb2x2ZWRWYWx1ZTogUmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcnMgZXZhbHVhdG9yIHRoYXQgZXh0ZW5kcyB0aGUgbmd0c2Mgc3RhdGljIGludGVycHJldGVyLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlXG4gKiB0aGUgc3RhdGljIGludGVycHJldGVyIGJ5IGRlZmF1bHQgb25seSBleHBvc2VzIHRoZSByZXNvbHZlZCB2YWx1ZSwgYnV0IHdlIGFyZSBhbHNvIGludGVyZXN0ZWRcbiAqIGluIHRoZSBUeXBlU2NyaXB0IG5vZGVzIHRoYXQgZGVjbGFyZSBwcm92aWRlcnMuIEl0IHdvdWxkIGJlIHBvc3NpYmxlIHRvIG1hbnVhbGx5IHRyYXZlcnNlIHRoZVxuICogQVNUIHRvIGNvbGxlY3QgdGhlc2Ugbm9kZXMsIGJ1dCB0aGF0IHdvdWxkIG1lYW4gdGhhdCB3ZSBuZWVkIHRvIHJlLWltcGxlbWVudCB0aGUgc3RhdGljXG4gKiBpbnRlcnByZXRlciBpbiBvcmRlciB0byBoYW5kbGUgYWxsIHBvc3NpYmxlIHNjZW5hcmlvcy4gKGUuZy4gc3ByZWFkIG9wZXJhdG9yLCBmdW5jdGlvbiBjYWxscyxcbiAqIGNhbGxlZSBzY29wZSkuIFRoaXMgY2FuIGJlIGF2b2lkZWQgYnkgc2ltcGx5IGV4dGVuZGluZyB0aGUgc3RhdGljIGludGVycHJldGVyIGFuZCBpbnRlcmNlcHRpbmdcbiAqIHRoZSBcInZpc2l0T2JqZWN0TGl0ZXJhbEV4cHJlc3Npb25cIiBtZXRob2QuXG4gKi9cbmV4cG9ydCBjbGFzcyBQcm92aWRlcnNFdmFsdWF0b3IgZXh0ZW5kcyBTdGF0aWNJbnRlcnByZXRlciB7XG4gIHByaXZhdGUgX3Byb3ZpZGVyTGl0ZXJhbHM6IFByb3ZpZGVyTGl0ZXJhbFtdID0gW107XG5cbiAgdmlzaXRPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihub2RlOiB0cy5PYmplY3RMaXRlcmFsRXhwcmVzc2lvbiwgY29udGV4dDogYW55KSB7XG4gICAgY29uc3QgcmVzb2x2ZWRWYWx1ZSA9XG4gICAgICAgIHN1cGVyLnZpc2l0T2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24obm9kZSwgey4uLmNvbnRleHQsIGluc2lkZVByb3ZpZGVyRGVmOiB0cnVlfSk7XG4gICAgLy8gZG8gbm90IGNvbGxlY3QgbmVzdGVkIG9iamVjdCBsaXRlcmFscy4gZS5nLiBhIHByb3ZpZGVyIGNvdWxkIHVzZSBhXG4gICAgLy8gc3ByZWFkIGFzc2lnbm1lbnQgKHdoaWNoIHJlc29sdmVzIHRvIGFub3RoZXIgb2JqZWN0IGxpdGVyYWwpLiBJbiB0aGF0XG4gICAgLy8gY2FzZSB0aGUgcmVmZXJlbmNlZCBvYmplY3QgbGl0ZXJhbCBpcyBub3QgYSBwcm92aWRlciBvYmplY3QgbGl0ZXJhbC5cbiAgICBpZiAoIWNvbnRleHQuaW5zaWRlUHJvdmlkZXJEZWYpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVyTGl0ZXJhbHMucHVzaCh7bm9kZSwgcmVzb2x2ZWRWYWx1ZX0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZXMgdGhlIGdpdmVuIGV4cHJlc3Npb24gYW5kIHJldHVybnMgaXRzIHN0YXRpY2FsbHkgcmVzb2x2ZWQgdmFsdWVcbiAgICogYW5kIGEgbGlzdCBvZiBvYmplY3QgbGl0ZXJhbHMgd2hpY2ggZGVmaW5lIEFuZ3VsYXIgcHJvdmlkZXJzLlxuICAgKi9cbiAgZXZhbHVhdGUoZXhwcjogdHMuRXhwcmVzc2lvbikge1xuICAgIHRoaXMuX3Byb3ZpZGVyTGl0ZXJhbHMgPSBbXTtcbiAgICBjb25zdCByZXNvbHZlZFZhbHVlID0gdGhpcy52aXNpdChleHByLCB7XG4gICAgICBvcmlnaW5hdGluZ0ZpbGU6IGV4cHIuZ2V0U291cmNlRmlsZSgpLFxuICAgICAgYWJzb2x1dGVNb2R1bGVOYW1lOiBudWxsLFxuICAgICAgcmVzb2x1dGlvbkNvbnRleHQ6IGV4cHIuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lLFxuICAgICAgc2NvcGU6IG5ldyBNYXAoKSxcbiAgICAgIGZvcmVpZ25GdW5jdGlvblJlc29sdmVyOiBmb3J3YXJkUmVmUmVzb2x2ZXJcbiAgICB9KTtcbiAgICByZXR1cm4ge3Jlc29sdmVkVmFsdWUsIGxpdGVyYWxzOiB0aGlzLl9wcm92aWRlckxpdGVyYWxzfTtcbiAgfVxufVxuIl19