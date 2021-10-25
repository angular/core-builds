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
    function analyzeResolvedTemplate(template, compilerModule) {
        const templateNodes = (0, parse_html_1.parseHtmlGracefully)(template.content, template.filePath, compilerModule);
        if (!templateNodes) {
            return null;
        }
        const visitor = new html_variable_assignment_visitor_1.HtmlVariableAssignmentVisitor(compilerModule);
        // Analyze the Angular Render3 HTML AST and collect all template variable assignments.
        visitor.visitAll(templateNodes);
        return visitor.variableAssignments.map(({ node, start, end }) => ({ node, start: start + node.span.start, end }));
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L2FuYWx5emVfdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBSUgsMEVBQTJEO0lBQzNELDJKQUF5RjtJQVF6Rjs7O09BR0c7SUFDSCxTQUFnQix1QkFBdUIsQ0FDbkMsUUFBMEIsRUFDMUIsY0FBa0Q7UUFDcEQsTUFBTSxhQUFhLEdBQUcsSUFBQSxnQ0FBbUIsRUFBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFL0YsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxnRUFBNkIsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUVsRSxzRkFBc0Y7UUFDdEYsT0FBTyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUVoQyxPQUFPLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQ2xDLENBQUMsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFoQkQsMERBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtQcm9wZXJ0eVdyaXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1Jlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge3BhcnNlSHRtbEdyYWNlZnVsbHl9IGZyb20gJy4uLy4uL3V0aWxzL3BhcnNlX2h0bWwnO1xuaW1wb3J0IHtIdG1sVmFyaWFibGVBc3NpZ25tZW50VmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL2h0bWxfdmFyaWFibGVfYXNzaWdubWVudF92aXNpdG9yJztcblxuZXhwb3J0IGludGVyZmFjZSBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudCB7XG4gIG5vZGU6IFByb3BlcnR5V3JpdGU7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFuYWx5emVzIGEgZ2l2ZW4gcmVzb2x2ZWQgdGVtcGxhdGUgYnkgbG9va2luZyBmb3IgcHJvcGVydHkgYXNzaWdubWVudHMgdG8gbG9jYWxcbiAqIHRlbXBsYXRlIHZhcmlhYmxlcyB3aXRoaW4gYm91bmQgZXZlbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUoXG4gICAgdGVtcGxhdGU6IFJlc29sdmVkVGVtcGxhdGUsXG4gICAgY29tcGlsZXJNb2R1bGU6IHR5cGVvZiBpbXBvcnQoJ0Bhbmd1bGFyL2NvbXBpbGVyJykpOiBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudFtdfG51bGwge1xuICBjb25zdCB0ZW1wbGF0ZU5vZGVzID0gcGFyc2VIdG1sR3JhY2VmdWxseSh0ZW1wbGF0ZS5jb250ZW50LCB0ZW1wbGF0ZS5maWxlUGF0aCwgY29tcGlsZXJNb2R1bGUpO1xuXG4gIGlmICghdGVtcGxhdGVOb2Rlcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgdmlzaXRvciA9IG5ldyBIdG1sVmFyaWFibGVBc3NpZ25tZW50VmlzaXRvcihjb21waWxlck1vZHVsZSk7XG5cbiAgLy8gQW5hbHl6ZSB0aGUgQW5ndWxhciBSZW5kZXIzIEhUTUwgQVNUIGFuZCBjb2xsZWN0IGFsbCB0ZW1wbGF0ZSB2YXJpYWJsZSBhc3NpZ25tZW50cy5cbiAgdmlzaXRvci52aXNpdEFsbCh0ZW1wbGF0ZU5vZGVzKTtcblxuICByZXR1cm4gdmlzaXRvci52YXJpYWJsZUFzc2lnbm1lbnRzLm1hcChcbiAgICAgICh7bm9kZSwgc3RhcnQsIGVuZH0pID0+ICh7bm9kZSwgc3RhcnQ6IHN0YXJ0ICsgbm9kZS5zcGFuLnN0YXJ0LCBlbmR9KSk7XG59XG4iXX0=