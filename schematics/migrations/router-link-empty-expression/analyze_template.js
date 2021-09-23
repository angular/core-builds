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
        const templateNodes = (0, parse_html_1.parseHtmlGracefully)(template.content, template.filePath);
        if (!templateNodes) {
            return null;
        }
        const visitor = new html_routerlink_empty_expr_visitor_1.RouterLinkEmptyExprVisitor();
        // Analyze the Angular Render3 HTML AST and collect all template variable assignments.
        (0, r3_ast_1.visitAll)(visitor, templateNodes);
        return visitor.emptyRouterLinkExpressions;
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JvdXRlci1saW5rLWVtcHR5LWV4cHJlc3Npb24vYW5hbHl6ZV90ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxpRUFBOEU7SUFHOUUsMEVBQTJEO0lBRTNELG9LQUF3RjtJQUV4RixTQUFnQix1QkFBdUIsQ0FBQyxRQUEwQjtRQUNoRSxNQUFNLGFBQWEsR0FBRyxJQUFBLGdDQUFtQixFQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRS9FLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksK0RBQTBCLEVBQUUsQ0FBQztRQUVqRCxzRkFBc0Y7UUFDdEYsSUFBQSxpQkFBUSxFQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVqQyxPQUFPLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztJQUM1QyxDQUFDO0lBYkQsMERBYUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCb3VuZEF0dHJpYnV0ZSwgdmlzaXRBbGx9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX2FzdCc7XG5cbmltcG9ydCB7UmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7cGFyc2VIdG1sR3JhY2VmdWxseX0gZnJvbSAnLi4vLi4vdXRpbHMvcGFyc2VfaHRtbCc7XG5cbmltcG9ydCB7Um91dGVyTGlua0VtcHR5RXhwclZpc2l0b3J9IGZyb20gJy4vYW5ndWxhci9odG1sX3JvdXRlcmxpbmtfZW1wdHlfZXhwcl92aXNpdG9yJztcblxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlKTogQm91bmRBdHRyaWJ1dGVbXXxudWxsIHtcbiAgY29uc3QgdGVtcGxhdGVOb2RlcyA9IHBhcnNlSHRtbEdyYWNlZnVsbHkodGVtcGxhdGUuY29udGVudCwgdGVtcGxhdGUuZmlsZVBhdGgpO1xuXG4gIGlmICghdGVtcGxhdGVOb2Rlcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgdmlzaXRvciA9IG5ldyBSb3V0ZXJMaW5rRW1wdHlFeHByVmlzaXRvcigpO1xuXG4gIC8vIEFuYWx5emUgdGhlIEFuZ3VsYXIgUmVuZGVyMyBIVE1MIEFTVCBhbmQgY29sbGVjdCBhbGwgdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudHMuXG4gIHZpc2l0QWxsKHZpc2l0b3IsIHRlbXBsYXRlTm9kZXMpO1xuXG4gIHJldHVybiB2aXNpdG9yLmVtcHR5Um91dGVyTGlua0V4cHJlc3Npb25zO1xufVxuIl19