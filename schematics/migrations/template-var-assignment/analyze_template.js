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
        define("@angular/core/schematics/migrations/template-var-assignment/analyze_template", ["require", "exports", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.analyzeResolvedTemplate = void 0;
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const html_variable_assignment_visitor_1 = require("@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor");
    /**
     * Analyzes a given resolved template by looking for property assignments to local
     * template variables within bound events.
     */
    function analyzeResolvedTemplate(template) {
        const templateNodes = (0, parse_html_1.parseHtmlGracefully)(template.content, template.filePath);
        if (!templateNodes) {
            return null;
        }
        const visitor = new html_variable_assignment_visitor_1.HtmlVariableAssignmentVisitor();
        // Analyze the Angular Render3 HTML AST and collect all template variable assignments.
        visitor.visitAll(templateNodes);
        return visitor.variableAssignments.map(({ node, start, end }) => ({ node, start: start + node.span.start, end }));
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L2FuYWx5emVfdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBSUgsMEVBQTJEO0lBQzNELDJKQUF5RjtJQVF6Rjs7O09BR0c7SUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxRQUEwQjtRQUVoRSxNQUFNLGFBQWEsR0FBRyxJQUFBLGdDQUFtQixFQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRS9FLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksZ0VBQTZCLEVBQUUsQ0FBQztRQUVwRCxzRkFBc0Y7UUFDdEYsT0FBTyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUVoQyxPQUFPLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQ2xDLENBQUMsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFmRCwwREFlQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Byb3BlcnR5V3JpdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7UmVzb2x2ZWRUZW1wbGF0ZX0gZnJvbSAnLi4vLi4vdXRpbHMvbmdfY29tcG9uZW50X3RlbXBsYXRlJztcbmltcG9ydCB7cGFyc2VIdG1sR3JhY2VmdWxseX0gZnJvbSAnLi4vLi4vdXRpbHMvcGFyc2VfaHRtbCc7XG5pbXBvcnQge0h0bWxWYXJpYWJsZUFzc2lnbm1lbnRWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvaHRtbF92YXJpYWJsZV9hc3NpZ25tZW50X3Zpc2l0b3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50IHtcbiAgbm9kZTogUHJvcGVydHlXcml0ZTtcbiAgc3RhcnQ6IG51bWJlcjtcbiAgZW5kOiBudW1iZXI7XG59XG5cbi8qKlxuICogQW5hbHl6ZXMgYSBnaXZlbiByZXNvbHZlZCB0ZW1wbGF0ZSBieSBsb29raW5nIGZvciBwcm9wZXJ0eSBhc3NpZ25tZW50cyB0byBsb2NhbFxuICogdGVtcGxhdGUgdmFyaWFibGVzIHdpdGhpbiBib3VuZCBldmVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmFseXplUmVzb2x2ZWRUZW1wbGF0ZSh0ZW1wbGF0ZTogUmVzb2x2ZWRUZW1wbGF0ZSk6IFRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50W118XG4gICAgbnVsbCB7XG4gIGNvbnN0IHRlbXBsYXRlTm9kZXMgPSBwYXJzZUh0bWxHcmFjZWZ1bGx5KHRlbXBsYXRlLmNvbnRlbnQsIHRlbXBsYXRlLmZpbGVQYXRoKTtcblxuICBpZiAoIXRlbXBsYXRlTm9kZXMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHZpc2l0b3IgPSBuZXcgSHRtbFZhcmlhYmxlQXNzaWdubWVudFZpc2l0b3IoKTtcblxuICAvLyBBbmFseXplIHRoZSBBbmd1bGFyIFJlbmRlcjMgSFRNTCBBU1QgYW5kIGNvbGxlY3QgYWxsIHRlbXBsYXRlIHZhcmlhYmxlIGFzc2lnbm1lbnRzLlxuICB2aXNpdG9yLnZpc2l0QWxsKHRlbXBsYXRlTm9kZXMpO1xuXG4gIHJldHVybiB2aXNpdG9yLnZhcmlhYmxlQXNzaWdubWVudHMubWFwKFxuICAgICAgKHtub2RlLCBzdGFydCwgZW5kfSkgPT4gKHtub2RlLCBzdGFydDogc3RhcnQgKyBub2RlLnNwYW4uc3RhcnQsIGVuZH0pKTtcbn1cbiJdfQ==