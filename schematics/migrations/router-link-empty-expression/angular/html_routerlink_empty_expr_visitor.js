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
        define("@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor", ["require", "exports", "@angular/compiler", "@angular/compiler/src/render3/r3_ast"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RouterLinkEmptyExprVisitor = void 0;
    const compiler_1 = require("@angular/compiler");
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    /**
     * HTML AST visitor that traverses the Render3 HTML AST in order to find all
     * undefined routerLink asssignment ([routerLink]="").
     */
    class RouterLinkEmptyExprVisitor extends r3_ast_1.NullVisitor {
        constructor() {
            super(...arguments);
            this.emptyRouterLinkExpressions = [];
        }
        visitElement(element) {
            (0, r3_ast_1.visitAll)(this, element.inputs);
            (0, r3_ast_1.visitAll)(this, element.children);
        }
        visitTemplate(t) {
            (0, r3_ast_1.visitAll)(this, t.inputs);
            (0, r3_ast_1.visitAll)(this, t.children);
        }
        visitBoundAttribute(node) {
            if (node.name === 'routerLink' && node.value instanceof compiler_1.ASTWithSource &&
                node.value.ast instanceof compiler_1.EmptyExpr) {
                this.emptyRouterLinkExpressions.push(node);
            }
        }
    }
    exports.RouterLinkEmptyExprVisitor = RouterLinkEmptyExprVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9yb3V0ZXJsaW5rX2VtcHR5X2V4cHJfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vYW5ndWxhci9odG1sX3JvdXRlcmxpbmtfZW1wdHlfZXhwcl92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUEyRDtJQUMzRCxpRUFBOEc7SUFFOUc7OztPQUdHO0lBQ0gsTUFBYSwwQkFBMkIsU0FBUSxvQkFBVztRQUEzRDs7WUFDVywrQkFBMEIsR0FBcUIsRUFBRSxDQUFDO1FBa0I3RCxDQUFDO1FBaEJVLFlBQVksQ0FBQyxPQUFnQjtZQUNwQyxJQUFBLGlCQUFRLEVBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixJQUFBLGlCQUFRLEVBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRVEsYUFBYSxDQUFDLENBQVc7WUFDaEMsSUFBQSxpQkFBUSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekIsSUFBQSxpQkFBUSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVRLG1CQUFtQixDQUFDLElBQW9CO1lBQy9DLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxZQUFZLElBQUksSUFBSSxDQUFDLEtBQUssWUFBWSx3QkFBYTtnQkFDakUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLFlBQVksb0JBQVMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM1QztRQUNILENBQUM7S0FDRjtJQW5CRCxnRUFtQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBU1RXaXRoU291cmNlLCBFbXB0eUV4cHJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Qm91bmRBdHRyaWJ1dGUsIEVsZW1lbnQsIE51bGxWaXNpdG9yLCBUZW1wbGF0ZSwgdmlzaXRBbGx9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX2FzdCc7XG5cbi8qKlxuICogSFRNTCBBU1QgdmlzaXRvciB0aGF0IHRyYXZlcnNlcyB0aGUgUmVuZGVyMyBIVE1MIEFTVCBpbiBvcmRlciB0byBmaW5kIGFsbFxuICogdW5kZWZpbmVkIHJvdXRlckxpbmsgYXNzc2lnbm1lbnQgKFtyb3V0ZXJMaW5rXT1cIlwiKS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdXRlckxpbmtFbXB0eUV4cHJWaXNpdG9yIGV4dGVuZHMgTnVsbFZpc2l0b3Ige1xuICByZWFkb25seSBlbXB0eVJvdXRlckxpbmtFeHByZXNzaW9uczogQm91bmRBdHRyaWJ1dGVbXSA9IFtdO1xuXG4gIG92ZXJyaWRlIHZpc2l0RWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogdm9pZCB7XG4gICAgdmlzaXRBbGwodGhpcywgZWxlbWVudC5pbnB1dHMpO1xuICAgIHZpc2l0QWxsKHRoaXMsIGVsZW1lbnQuY2hpbGRyZW4pO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRUZW1wbGF0ZSh0OiBUZW1wbGF0ZSk6IHZvaWQge1xuICAgIHZpc2l0QWxsKHRoaXMsIHQuaW5wdXRzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCB0LmNoaWxkcmVuKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0Qm91bmRBdHRyaWJ1dGUobm9kZTogQm91bmRBdHRyaWJ1dGUpIHtcbiAgICBpZiAobm9kZS5uYW1lID09PSAncm91dGVyTGluaycgJiYgbm9kZS52YWx1ZSBpbnN0YW5jZW9mIEFTVFdpdGhTb3VyY2UgJiZcbiAgICAgICAgbm9kZS52YWx1ZS5hc3QgaW5zdGFuY2VvZiBFbXB0eUV4cHIpIHtcbiAgICAgIHRoaXMuZW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbnMucHVzaChub2RlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==