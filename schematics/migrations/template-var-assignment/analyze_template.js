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
        define("@angular/core/schematics/migrations/template-var-assignment/analyze_template", ["require", "exports", "@angular/compiler/src/render3/r3_ast", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.analyzeResolvedTemplate = void 0;
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const html_variable_assignment_visitor_1 = require("@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor");
    /**
     * Analyzes a given resolved template by looking for property assignments to local
     * template variables within bound events.
     */
    function analyzeResolvedTemplate(template) {
        const templateNodes = parse_html_1.parseHtmlGracefully(template.content, template.filePath);
        if (!templateNodes) {
            return null;
        }
        const visitor = new html_variable_assignment_visitor_1.HtmlVariableAssignmentVisitor();
        // Analyze the Angular Render3 HTML AST and collect all template variable assignments.
        r3_ast_1.visitAll(visitor, templateNodes);
        return visitor.variableAssignments.map(({ node, start, end }) => ({ node, start: start + node.span.start, end }));
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L2FuYWx5emVfdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBR0gsaUVBQThEO0lBRTlELDBFQUEyRDtJQUMzRCwySkFBeUY7SUFRekY7OztPQUdHO0lBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsUUFBMEI7UUFFaEUsTUFBTSxhQUFhLEdBQUcsZ0NBQW1CLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFL0UsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxnRUFBNkIsRUFBRSxDQUFDO1FBRXBELHNGQUFzRjtRQUN0RixpQkFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVqQyxPQUFPLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQ2xDLENBQUMsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFmRCwwREFlQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQcm9wZXJ0eVdyaXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge3Zpc2l0QWxsfSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvcmVuZGVyMy9yM19hc3QnO1xuaW1wb3J0IHtSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtwYXJzZUh0bWxHcmFjZWZ1bGx5fSBmcm9tICcuLi8uLi91dGlscy9wYXJzZV9odG1sJztcbmltcG9ydCB7SHRtbFZhcmlhYmxlQXNzaWdubWVudFZpc2l0b3J9IGZyb20gJy4vYW5ndWxhci9odG1sX3ZhcmlhYmxlX2Fzc2lnbm1lbnRfdmlzaXRvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnQge1xuICBub2RlOiBQcm9wZXJ0eVdyaXRlO1xuICBzdGFydDogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBbmFseXplcyBhIGdpdmVuIHJlc29sdmVkIHRlbXBsYXRlIGJ5IGxvb2tpbmcgZm9yIHByb3BlcnR5IGFzc2lnbm1lbnRzIHRvIGxvY2FsXG4gKiB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2l0aGluIGJvdW5kIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlKTogVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRbXXxcbiAgICBudWxsIHtcbiAgY29uc3QgdGVtcGxhdGVOb2RlcyA9IHBhcnNlSHRtbEdyYWNlZnVsbHkodGVtcGxhdGUuY29udGVudCwgdGVtcGxhdGUuZmlsZVBhdGgpO1xuXG4gIGlmICghdGVtcGxhdGVOb2Rlcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgdmlzaXRvciA9IG5ldyBIdG1sVmFyaWFibGVBc3NpZ25tZW50VmlzaXRvcigpO1xuXG4gIC8vIEFuYWx5emUgdGhlIEFuZ3VsYXIgUmVuZGVyMyBIVE1MIEFTVCBhbmQgY29sbGVjdCBhbGwgdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudHMuXG4gIHZpc2l0QWxsKHZpc2l0b3IsIHRlbXBsYXRlTm9kZXMpO1xuXG4gIHJldHVybiB2aXNpdG9yLnZhcmlhYmxlQXNzaWdubWVudHMubWFwKFxuICAgICAgKHtub2RlLCBzdGFydCwgZW5kfSkgPT4gKHtub2RlLCBzdGFydDogc3RhcnQgKyBub2RlLnNwYW4uc3RhcnQsIGVuZH0pKTtcbn1cbiJdfQ==