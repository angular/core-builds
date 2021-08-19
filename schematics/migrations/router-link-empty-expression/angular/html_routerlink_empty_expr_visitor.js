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
            r3_ast_1.visitAll(this, element.inputs);
            r3_ast_1.visitAll(this, element.children);
        }
        visitTemplate(t) {
            r3_ast_1.visitAll(this, t.inputs);
            r3_ast_1.visitAll(this, t.children);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9yb3V0ZXJsaW5rX2VtcHR5X2V4cHJfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vYW5ndWxhci9odG1sX3JvdXRlcmxpbmtfZW1wdHlfZXhwcl92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUEyRDtJQUMzRCxpRUFBOEc7SUFFOUc7OztPQUdHO0lBQ0gsTUFBYSwwQkFBMkIsU0FBUSxvQkFBVztRQUEzRDs7WUFDVywrQkFBMEIsR0FBcUIsRUFBRSxDQUFDO1FBa0I3RCxDQUFDO1FBaEJVLFlBQVksQ0FBQyxPQUFnQjtZQUNwQyxpQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFUSxhQUFhLENBQUMsQ0FBVztZQUNoQyxpQkFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekIsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFUSxtQkFBbUIsQ0FBQyxJQUFvQjtZQUMvQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksQ0FBQyxLQUFLLFlBQVksd0JBQWE7Z0JBQ2pFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxZQUFZLG9CQUFTLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDNUM7UUFDSCxDQUFDO0tBQ0Y7SUFuQkQsZ0VBbUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVNUV2l0aFNvdXJjZSwgRW1wdHlFeHByfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0JvdW5kQXR0cmlidXRlLCBFbGVtZW50LCBOdWxsVmlzaXRvciwgVGVtcGxhdGUsIHZpc2l0QWxsfSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvcmVuZGVyMy9yM19hc3QnO1xuXG4vKipcbiAqIEhUTUwgQVNUIHZpc2l0b3IgdGhhdCB0cmF2ZXJzZXMgdGhlIFJlbmRlcjMgSFRNTCBBU1QgaW4gb3JkZXIgdG8gZmluZCBhbGxcbiAqIHVuZGVmaW5lZCByb3V0ZXJMaW5rIGFzc3NpZ25tZW50IChbcm91dGVyTGlua109XCJcIikuXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZXJMaW5rRW1wdHlFeHByVmlzaXRvciBleHRlbmRzIE51bGxWaXNpdG9yIHtcbiAgcmVhZG9ubHkgZW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbnM6IEJvdW5kQXR0cmlidXRlW10gPSBbXTtcblxuICBvdmVycmlkZSB2aXNpdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IHZvaWQge1xuICAgIHZpc2l0QWxsKHRoaXMsIGVsZW1lbnQuaW5wdXRzKTtcbiAgICB2aXNpdEFsbCh0aGlzLCBlbGVtZW50LmNoaWxkcmVuKTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0VGVtcGxhdGUodDogVGVtcGxhdGUpOiB2b2lkIHtcbiAgICB2aXNpdEFsbCh0aGlzLCB0LmlucHV0cyk7XG4gICAgdmlzaXRBbGwodGhpcywgdC5jaGlsZHJlbik7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdEJvdW5kQXR0cmlidXRlKG5vZGU6IEJvdW5kQXR0cmlidXRlKSB7XG4gICAgaWYgKG5vZGUubmFtZSA9PT0gJ3JvdXRlckxpbmsnICYmIG5vZGUudmFsdWUgaW5zdGFuY2VvZiBBU1RXaXRoU291cmNlICYmXG4gICAgICAgIG5vZGUudmFsdWUuYXN0IGluc3RhbmNlb2YgRW1wdHlFeHByKSB7XG4gICAgICB0aGlzLmVtcHR5Um91dGVyTGlua0V4cHJlc3Npb25zLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG59XG4iXX0=