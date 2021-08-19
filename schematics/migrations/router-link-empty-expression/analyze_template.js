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
        define("@angular/core/schematics/migrations/router-link-empty-expression/analyze_template", ["require", "exports", "@angular/compiler/src/render3/r3_ast", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.analyzeResolvedTemplate = void 0;
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const html_routerlink_empty_expr_visitor_1 = require("@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor");
    function analyzeResolvedTemplate(template) {
        const templateNodes = parse_html_1.parseHtmlGracefully(template.content, template.filePath);
        if (!templateNodes) {
            return null;
        }
        const visitor = new html_routerlink_empty_expr_visitor_1.RouterLinkEmptyExprVisitor();
        // Analyze the Angular Render3 HTML AST and collect all template variable assignments.
        r3_ast_1.visitAll(visitor, templateNodes);
        return visitor.emptyRouterLinkExpressions;
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vYW5hbHl6ZV90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpRUFBOEU7SUFHOUUsMEVBQTJEO0lBRTNELG9LQUF3RjtJQUV4RixTQUFnQix1QkFBdUIsQ0FBQyxRQUEwQjtRQUNoRSxNQUFNLGFBQWEsR0FBRyxnQ0FBbUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUvRSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLCtEQUEwQixFQUFFLENBQUM7UUFFakQsc0ZBQXNGO1FBQ3RGLGlCQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWpDLE9BQU8sT0FBTyxDQUFDLDBCQUEwQixDQUFDO0lBQzVDLENBQUM7SUFiRCwwREFhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JvdW5kQXR0cmlidXRlLCB2aXNpdEFsbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfYXN0JztcblxuaW1wb3J0IHtSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtwYXJzZUh0bWxHcmFjZWZ1bGx5fSBmcm9tICcuLi8uLi91dGlscy9wYXJzZV9odG1sJztcblxuaW1wb3J0IHtSb3V0ZXJMaW5rRW1wdHlFeHByVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL2h0bWxfcm91dGVybGlua19lbXB0eV9leHByX3Zpc2l0b3InO1xuXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUodGVtcGxhdGU6IFJlc29sdmVkVGVtcGxhdGUpOiBCb3VuZEF0dHJpYnV0ZVtdfG51bGwge1xuICBjb25zdCB0ZW1wbGF0ZU5vZGVzID0gcGFyc2VIdG1sR3JhY2VmdWxseSh0ZW1wbGF0ZS5jb250ZW50LCB0ZW1wbGF0ZS5maWxlUGF0aCk7XG5cbiAgaWYgKCF0ZW1wbGF0ZU5vZGVzKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB2aXNpdG9yID0gbmV3IFJvdXRlckxpbmtFbXB0eUV4cHJWaXNpdG9yKCk7XG5cbiAgLy8gQW5hbHl6ZSB0aGUgQW5ndWxhciBSZW5kZXIzIEhUTUwgQVNUIGFuZCBjb2xsZWN0IGFsbCB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50cy5cbiAgdmlzaXRBbGwodmlzaXRvciwgdGVtcGxhdGVOb2Rlcyk7XG5cbiAgcmV0dXJuIHZpc2l0b3IuZW1wdHlSb3V0ZXJMaW5rRXhwcmVzc2lvbnM7XG59XG4iXX0=