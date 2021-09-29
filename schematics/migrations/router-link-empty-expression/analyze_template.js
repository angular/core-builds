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
        define("@angular/core/schematics/migrations/router-link-empty-expression/analyze_template", ["require", "exports", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.analyzeResolvedTemplate = void 0;
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const html_routerlink_empty_expr_visitor_1 = require("@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor");
    function analyzeResolvedTemplate(template) {
        const templateNodes = (0, parse_html_1.parseHtmlGracefully)(template.content, template.filePath);
        if (!templateNodes) {
            return null;
        }
        const visitor = new html_routerlink_empty_expr_visitor_1.RouterLinkEmptyExprVisitor();
        // Analyze the Angular Render3 HTML AST and collect all template variable assignments.
        visitor.visitAll(templateNodes);
        return visitor.emptyRouterLinkExpressions;
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vYW5hbHl6ZV90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFLSCwwRUFBMkQ7SUFFM0Qsb0tBQXdGO0lBRXhGLFNBQWdCLHVCQUF1QixDQUFDLFFBQTBCO1FBQ2hFLE1BQU0sYUFBYSxHQUFHLElBQUEsZ0NBQW1CLEVBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFL0UsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSwrREFBMEIsRUFBRSxDQUFDO1FBRWpELHNGQUFzRjtRQUN0RixPQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRWhDLE9BQU8sT0FBTyxDQUFDLDBCQUEwQixDQUFDO0lBQzVDLENBQUM7SUFiRCwwREFhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RtcGxBc3RCb3VuZEF0dHJpYnV0ZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge1Jlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge3BhcnNlSHRtbEdyYWNlZnVsbHl9IGZyb20gJy4uLy4uL3V0aWxzL3BhcnNlX2h0bWwnO1xuXG5pbXBvcnQge1JvdXRlckxpbmtFbXB0eUV4cHJWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvaHRtbF9yb3V0ZXJsaW5rX2VtcHR5X2V4cHJfdmlzaXRvcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplUmVzb2x2ZWRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRUZW1wbGF0ZSk6IFRtcGxBc3RCb3VuZEF0dHJpYnV0ZVtdfG51bGwge1xuICBjb25zdCB0ZW1wbGF0ZU5vZGVzID0gcGFyc2VIdG1sR3JhY2VmdWxseSh0ZW1wbGF0ZS5jb250ZW50LCB0ZW1wbGF0ZS5maWxlUGF0aCk7XG5cbiAgaWYgKCF0ZW1wbGF0ZU5vZGVzKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB2aXNpdG9yID0gbmV3IFJvdXRlckxpbmtFbXB0eUV4cHJWaXNpdG9yKCk7XG5cbiAgLy8gQW5hbHl6ZSB0aGUgQW5ndWxhciBSZW5kZXIzIEhUTUwgQVNUIGFuZCBjb2xsZWN0IGFsbCB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50cy5cbiAgdmlzaXRvci52aXNpdEFsbCh0ZW1wbGF0ZU5vZGVzKTtcblxuICByZXR1cm4gdmlzaXRvci5lbXB0eVJvdXRlckxpbmtFeHByZXNzaW9ucztcbn1cbiJdfQ==