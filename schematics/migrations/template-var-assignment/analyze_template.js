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
    function analyzeResolvedTemplate(template) {
        const templateNodes = parse_html_1.parseHtmlGracefully(template.content, template.filePath);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L2FuYWx5emVfdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFHSCxpRUFBd0U7SUFHeEUsMEVBQTJEO0lBRTNELGlKQUFtRztJQVFuRzs7O09BR0c7SUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxRQUEwQjtRQUVoRSxNQUFNLGFBQWEsR0FBRyxnQ0FBbUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUvRSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHNEQUF3QixFQUFFLENBQUM7UUFFL0MsZ0ZBQWdGO1FBQ2hGLHNCQUFzQjtRQUN0QixpQkFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUVqQyxPQUFPLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCLENBQUM7YUFDM0YsR0FBRyxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFoQkQsMERBZ0JDO0lBRUQ7OztPQUdHO0lBQ0gsU0FBUyxpQ0FBaUMsQ0FBQyxNQUE0QixFQUFFLFNBQXFCO1FBQzVGLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbkcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtQcm9wZXJ0eVdyaXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge1ZhcmlhYmxlLCB2aXNpdEFsbH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfYXN0JztcblxuaW1wb3J0IHtSZXNvbHZlZFRlbXBsYXRlfSBmcm9tICcuLi8uLi91dGlscy9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtwYXJzZUh0bWxHcmFjZWZ1bGx5fSBmcm9tICcuLi8uLi91dGlscy9wYXJzZV9odG1sJztcblxuaW1wb3J0IHtQcm9wZXJ0eUFzc2lnbm1lbnQsIFByb3BlcnR5V3JpdGVIdG1sVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL3Byb3BlcnR5X3dyaXRlX2h0bWxfdmlzaXRvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnQge1xuICBub2RlOiBQcm9wZXJ0eVdyaXRlO1xuICBzdGFydDogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBbmFseXplcyBhIGdpdmVuIHJlc29sdmVkIHRlbXBsYXRlIGJ5IGxvb2tpbmcgZm9yIHByb3BlcnR5IGFzc2lnbm1lbnRzIHRvIGxvY2FsXG4gKiB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2l0aGluIGJvdW5kIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlKTogVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRbXXxcbiAgICBudWxsIHtcbiAgY29uc3QgdGVtcGxhdGVOb2RlcyA9IHBhcnNlSHRtbEdyYWNlZnVsbHkodGVtcGxhdGUuY29udGVudCwgdGVtcGxhdGUuZmlsZVBhdGgpO1xuXG4gIGlmICghdGVtcGxhdGVOb2Rlcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgdmlzaXRvciA9IG5ldyBQcm9wZXJ0eVdyaXRlSHRtbFZpc2l0b3IoKTtcblxuICAvLyBBbmFseXplIHRoZSBBbmd1bGFyIFJlbmRlcjMgSFRNTCBBU1QgYW5kIGNvbGxlY3QgYWxsIHByb3BlcnR5IGFzc2lnbm1lbnRzIGFuZFxuICAvLyB0ZW1wbGF0ZSB2YXJpYWJsZXMuXG4gIHZpc2l0QWxsKHZpc2l0b3IsIHRlbXBsYXRlTm9kZXMpO1xuXG4gIHJldHVybiBmaWx0ZXJUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudHModmlzaXRvci5wcm9wZXJ0eUFzc2lnbm1lbnRzLCB2aXNpdG9yLnRlbXBsYXRlVmFyaWFibGVzKVxuICAgICAgLm1hcCgoe25vZGUsIHN0YXJ0LCBlbmR9KSA9PiAoe25vZGUsIHN0YXJ0OiBzdGFydCArIG5vZGUuc3Bhbi5zdGFydCwgZW5kfSkpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYWxsIHRlbXBsYXRlIHZhcmlhYmxlIGFzc2lnbm1lbnRzIGJ5IGxvb2tpbmcgaWYgYSBnaXZlbiBwcm9wZXJ0eVxuICogYXNzaWdubWVudCBpcyBzZXR0aW5nIHRoZSB2YWx1ZSBmb3Igb25lIG9mIHRoZSBzcGVjaWZpZWQgdGVtcGxhdGUgdmFyaWFibGVzLlxuICovXG5mdW5jdGlvbiBmaWx0ZXJUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudHMod3JpdGVzOiBQcm9wZXJ0eUFzc2lnbm1lbnRbXSwgdmFyaWFibGVzOiBWYXJpYWJsZVtdKSB7XG4gIHJldHVybiB3cml0ZXMuZmlsdGVyKHByb3BlcnR5V3JpdGUgPT4gISF2YXJpYWJsZXMuZmluZCh2ID0+IHYubmFtZSA9PT0gcHJvcGVydHlXcml0ZS5ub2RlLm5hbWUpKTtcbn1cbiJdfQ==