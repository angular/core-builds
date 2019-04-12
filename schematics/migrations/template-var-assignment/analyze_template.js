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
        define("@angular/core/schematics/migrations/template-var-assignment/analyze_template", ["require", "exports", "@angular/compiler/src/render3/r3_ast", "@angular/core/schematics/utils/parse_html", "@angular/core/schematics/migrations/template-var-assignment/angular/property_write_html_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    const parse_html_1 = require("@angular/core/schematics/utils/parse_html");
    const property_write_html_visitor_1 = require("@angular/core/schematics/migrations/template-var-assignment/angular/property_write_html_visitor");
    /**
     * Analyzes a given resolved template by looking for property assignments to local
     * template variables within bound events.
     */
    function analyzeResolvedTemplate(filePath, template) {
        const templateNodes = parse_html_1.parseHtmlGracefully(template.content, filePath);
        if (!templateNodes) {
            return null;
        }
        const visitor = new property_write_html_visitor_1.PropertyWriteHtmlVisitor();
        // Analyze the Angular Render3 HTML AST and collect all property assignments and
        // template variables.
        r3_ast_1.visitAll(visitor, templateNodes);
        return filterTemplateVariableAssignments(visitor.propertyAssignments, visitor.templateVariables)
            .map(({ node, start, end }) => ({ node, start: start + node.span.start, end }));
    }
    exports.analyzeResolvedTemplate = analyzeResolvedTemplate;
    /**
     * Returns all template variable assignments by looking if a given property
     * assignment is setting the value for one of the specified template variables.
     */
    function filterTemplateVariableAssignments(writes, variables) {
        return writes.filter(propertyWrite => !!variables.find(v => v.name === propertyWrite.node.name));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L2FuYWx5emVfdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCxpRUFBd0U7SUFHeEUsMEVBQTJEO0lBRTNELGlKQUFtRztJQVFuRzs7O09BR0c7SUFDSCxTQUFnQix1QkFBdUIsQ0FDbkMsUUFBZ0IsRUFBRSxRQUEwQjtRQUM5QyxNQUFNLGFBQWEsR0FBRyxnQ0FBbUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXRFLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksc0RBQXdCLEVBQUUsQ0FBQztRQUUvQyxnRkFBZ0Y7UUFDaEYsc0JBQXNCO1FBQ3RCLGlCQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWpDLE9BQU8saUNBQWlDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzthQUMzRixHQUFHLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQWhCRCwwREFnQkM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGlDQUFpQyxDQUFDLE1BQTRCLEVBQUUsU0FBcUI7UUFDNUYsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Byb3BlcnR5V3JpdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7VmFyaWFibGUsIHZpc2l0QWxsfSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvcmVuZGVyMy9yM19hc3QnO1xuXG5pbXBvcnQge1Jlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4uLy4uL3V0aWxzL25nX2NvbXBvbmVudF90ZW1wbGF0ZSc7XG5pbXBvcnQge3BhcnNlSHRtbEdyYWNlZnVsbHl9IGZyb20gJy4uLy4uL3V0aWxzL3BhcnNlX2h0bWwnO1xuXG5pbXBvcnQge1Byb3BlcnR5QXNzaWdubWVudCwgUHJvcGVydHlXcml0ZUh0bWxWaXNpdG9yfSBmcm9tICcuL2FuZ3VsYXIvcHJvcGVydHlfd3JpdGVfaHRtbF92aXNpdG9yJztcblxuZXhwb3J0IGludGVyZmFjZSBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudCB7XG4gIG5vZGU6IFByb3BlcnR5V3JpdGU7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIGVuZDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFuYWx5emVzIGEgZ2l2ZW4gcmVzb2x2ZWQgdGVtcGxhdGUgYnkgbG9va2luZyBmb3IgcHJvcGVydHkgYXNzaWdubWVudHMgdG8gbG9jYWxcbiAqIHRlbXBsYXRlIHZhcmlhYmxlcyB3aXRoaW4gYm91bmQgZXZlbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZVJlc29sdmVkVGVtcGxhdGUoXG4gICAgZmlsZVBhdGg6IHN0cmluZywgdGVtcGxhdGU6IFJlc29sdmVkVGVtcGxhdGUpOiBUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudFtdfG51bGwge1xuICBjb25zdCB0ZW1wbGF0ZU5vZGVzID0gcGFyc2VIdG1sR3JhY2VmdWxseSh0ZW1wbGF0ZS5jb250ZW50LCBmaWxlUGF0aCk7XG5cbiAgaWYgKCF0ZW1wbGF0ZU5vZGVzKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB2aXNpdG9yID0gbmV3IFByb3BlcnR5V3JpdGVIdG1sVmlzaXRvcigpO1xuXG4gIC8vIEFuYWx5emUgdGhlIEFuZ3VsYXIgUmVuZGVyMyBIVE1MIEFTVCBhbmQgY29sbGVjdCBhbGwgcHJvcGVydHkgYXNzaWdubWVudHMgYW5kXG4gIC8vIHRlbXBsYXRlIHZhcmlhYmxlcy5cbiAgdmlzaXRBbGwodmlzaXRvciwgdGVtcGxhdGVOb2Rlcyk7XG5cbiAgcmV0dXJuIGZpbHRlclRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50cyh2aXNpdG9yLnByb3BlcnR5QXNzaWdubWVudHMsIHZpc2l0b3IudGVtcGxhdGVWYXJpYWJsZXMpXG4gICAgICAubWFwKCh7bm9kZSwgc3RhcnQsIGVuZH0pID0+ICh7bm9kZSwgc3RhcnQ6IHN0YXJ0ICsgbm9kZS5zcGFuLnN0YXJ0LCBlbmR9KSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbGwgdGVtcGxhdGUgdmFyaWFibGUgYXNzaWdubWVudHMgYnkgbG9va2luZyBpZiBhIGdpdmVuIHByb3BlcnR5XG4gKiBhc3NpZ25tZW50IGlzIHNldHRpbmcgdGhlIHZhbHVlIGZvciBvbmUgb2YgdGhlIHNwZWNpZmllZCB0ZW1wbGF0ZSB2YXJpYWJsZXMuXG4gKi9cbmZ1bmN0aW9uIGZpbHRlclRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50cyh3cml0ZXM6IFByb3BlcnR5QXNzaWdubWVudFtdLCB2YXJpYWJsZXM6IFZhcmlhYmxlW10pIHtcbiAgcmV0dXJuIHdyaXRlcy5maWx0ZXIocHJvcGVydHlXcml0ZSA9PiAhIXZhcmlhYmxlcy5maW5kKHYgPT4gdi5uYW1lID09PSBwcm9wZXJ0eVdyaXRlLm5vZGUubmFtZSkpO1xufVxuIl19