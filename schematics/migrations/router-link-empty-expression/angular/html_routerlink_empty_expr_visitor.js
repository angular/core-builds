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
        define("@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor", ["require", "exports", "@angular/compiler", "@angular/core/schematics/utils/template_ast_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RouterLinkEmptyExprVisitor = void 0;
    const compiler_1 = require("@angular/compiler");
    const template_ast_visitor_1 = require("@angular/core/schematics/utils/template_ast_visitor");
    /**
     * HTML AST visitor that traverses the Render3 HTML AST in order to find all
     * undefined routerLink asssignment ([routerLink]="").
     */
    class RouterLinkEmptyExprVisitor extends template_ast_visitor_1.TemplateAstVisitor {
        constructor() {
            super(...arguments);
            this.emptyRouterLinkExpressions = [];
        }
        visitElement(element) {
            this.visitAll(element.inputs);
            this.visitAll(element.children);
        }
        visitTemplate(t) {
            this.visitAll(t.inputs);
            this.visitAll(t.children);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbF9yb3V0ZXJsaW5rX2VtcHR5X2V4cHJfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vYW5ndWxhci9odG1sX3JvdXRlcmxpbmtfZW1wdHlfZXhwcl92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUFtSDtJQUNuSCw4RkFBdUU7SUFFdkU7OztPQUdHO0lBQ0gsTUFBYSwwQkFBMkIsU0FBUSx5Q0FBa0I7UUFBbEU7O1lBQ1csK0JBQTBCLEdBQTRCLEVBQUUsQ0FBQztRQWtCcEUsQ0FBQztRQWhCVSxZQUFZLENBQUMsT0FBdUI7WUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVRLGFBQWEsQ0FBQyxDQUFrQjtZQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRVEsbUJBQW1CLENBQUMsSUFBMkI7WUFDdEQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFlBQVksSUFBSSxJQUFJLENBQUMsS0FBSyxZQUFZLHdCQUFhO2dCQUNqRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsWUFBWSxvQkFBUyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzVDO1FBQ0gsQ0FBQztLQUNGO0lBbkJELGdFQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FTVFdpdGhTb3VyY2UsIEVtcHR5RXhwciwgVG1wbEFzdEJvdW5kQXR0cmlidXRlLCBUbXBsQXN0RWxlbWVudCwgVG1wbEFzdFRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1RlbXBsYXRlQXN0VmlzaXRvcn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdGVtcGxhdGVfYXN0X3Zpc2l0b3InO1xuXG4vKipcbiAqIEhUTUwgQVNUIHZpc2l0b3IgdGhhdCB0cmF2ZXJzZXMgdGhlIFJlbmRlcjMgSFRNTCBBU1QgaW4gb3JkZXIgdG8gZmluZCBhbGxcbiAqIHVuZGVmaW5lZCByb3V0ZXJMaW5rIGFzc3NpZ25tZW50IChbcm91dGVyTGlua109XCJcIikuXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZXJMaW5rRW1wdHlFeHByVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlQXN0VmlzaXRvciB7XG4gIHJlYWRvbmx5IGVtcHR5Um91dGVyTGlua0V4cHJlc3Npb25zOiBUbXBsQXN0Qm91bmRBdHRyaWJ1dGVbXSA9IFtdO1xuXG4gIG92ZXJyaWRlIHZpc2l0RWxlbWVudChlbGVtZW50OiBUbXBsQXN0RWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5pbnB1dHMpO1xuICAgIHRoaXMudmlzaXRBbGwoZWxlbWVudC5jaGlsZHJlbik7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdFRlbXBsYXRlKHQ6IFRtcGxBc3RUZW1wbGF0ZSk6IHZvaWQge1xuICAgIHRoaXMudmlzaXRBbGwodC5pbnB1dHMpO1xuICAgIHRoaXMudmlzaXRBbGwodC5jaGlsZHJlbik7XG4gIH1cblxuICBvdmVycmlkZSB2aXNpdEJvdW5kQXR0cmlidXRlKG5vZGU6IFRtcGxBc3RCb3VuZEF0dHJpYnV0ZSkge1xuICAgIGlmIChub2RlLm5hbWUgPT09ICdyb3V0ZXJMaW5rJyAmJiBub2RlLnZhbHVlIGluc3RhbmNlb2YgQVNUV2l0aFNvdXJjZSAmJlxuICAgICAgICBub2RlLnZhbHVlLmFzdCBpbnN0YW5jZW9mIEVtcHR5RXhwcikge1xuICAgICAgdGhpcy5lbXB0eVJvdXRlckxpbmtFeHByZXNzaW9ucy5wdXNoKG5vZGUpO1xuICAgIH1cbiAgfVxufVxuIl19