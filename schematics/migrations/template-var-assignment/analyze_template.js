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
        define("@angular/core/schematics/migrations/template-var-assignment/analyze_template", ["require", "exports", "@angular/compiler", "@angular/compiler/src/render3/r3_ast", "@angular/core/schematics/migrations/template-var-assignment/angular/property_write_html_visitor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compiler_1 = require("@angular/compiler");
    const r3_ast_1 = require("@angular/compiler/src/render3/r3_ast");
    const property_write_html_visitor_1 = require("@angular/core/schematics/migrations/template-var-assignment/angular/property_write_html_visitor");
    /**
     * Analyzes a given resolved template by looking for property assignments to local
     * template variables within bound events.
     */
    function analyzeResolvedTemplate(filePath, template) {
        try {
            const templateNodes = compiler_1.parseTemplate(template.content, filePath).nodes;
            const visitor = new property_write_html_visitor_1.PropertyWriteHtmlVisitor();
            // Analyze the Angular Render3 HTML AST and collect all property assignments and
            // template variables.
            r3_ast_1.visitAll(visitor, templateNodes);
            return filterTemplateVariableAssignments(visitor.propertyAssignments, visitor.templateVariables)
                .map(({ node, start, end }) => ({ node, start: start + node.span.start, end }));
        }
        catch (_a) {
            // Do nothing if the template couldn't be parsed. We don't want to throw any
            // exception if a template is syntactically not valid. e.g. template could be
            // using preprocessor syntax.
            return null;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZV90ZW1wbGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3RlbXBsYXRlLXZhci1hc3NpZ25tZW50L2FuYWx5emVfdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxnREFBK0Q7SUFDL0QsaUVBQXdFO0lBR3hFLGlKQUFtRztJQVFuRzs7O09BR0c7SUFDSCxTQUFnQix1QkFBdUIsQ0FDbkMsUUFBZ0IsRUFBRSxRQUEwQjtRQUM5QyxJQUFJO1lBQ0YsTUFBTSxhQUFhLEdBQUcsd0JBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN0RSxNQUFNLE9BQU8sR0FBRyxJQUFJLHNEQUF3QixFQUFFLENBQUM7WUFFL0MsZ0ZBQWdGO1lBQ2hGLHNCQUFzQjtZQUN0QixpQkFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVqQyxPQUFPLGlDQUFpQyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCLENBQUM7aUJBQzNGLEdBQUcsQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUMsQ0FBQztTQUNqRjtRQUFDLFdBQU07WUFDTiw0RUFBNEU7WUFDNUUsNkVBQTZFO1lBQzdFLDZCQUE2QjtZQUM3QixPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQWxCRCwwREFrQkM7SUFFRDs7O09BR0c7SUFDSCxTQUFTLGlDQUFpQyxDQUFDLE1BQTRCLEVBQUUsU0FBcUI7UUFDNUYsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Byb3BlcnR5V3JpdGUsIHBhcnNlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7VmFyaWFibGUsIHZpc2l0QWxsfSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvcmVuZGVyMy9yM19hc3QnO1xuXG5pbXBvcnQge1Jlc29sdmVkVGVtcGxhdGV9IGZyb20gJy4vYW5ndWxhci9uZ19jb21wb25lbnRfdGVtcGxhdGUnO1xuaW1wb3J0IHtQcm9wZXJ0eUFzc2lnbm1lbnQsIFByb3BlcnR5V3JpdGVIdG1sVmlzaXRvcn0gZnJvbSAnLi9hbmd1bGFyL3Byb3BlcnR5X3dyaXRlX2h0bWxfdmlzaXRvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnQge1xuICBub2RlOiBQcm9wZXJ0eVdyaXRlO1xuICBzdGFydDogbnVtYmVyO1xuICBlbmQ6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBbmFseXplcyBhIGdpdmVuIHJlc29sdmVkIHRlbXBsYXRlIGJ5IGxvb2tpbmcgZm9yIHByb3BlcnR5IGFzc2lnbm1lbnRzIHRvIGxvY2FsXG4gKiB0ZW1wbGF0ZSB2YXJpYWJsZXMgd2l0aGluIGJvdW5kIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVSZXNvbHZlZFRlbXBsYXRlKFxuICAgIGZpbGVQYXRoOiBzdHJpbmcsIHRlbXBsYXRlOiBSZXNvbHZlZFRlbXBsYXRlKTogVGVtcGxhdGVWYXJpYWJsZUFzc2lnbm1lbnRbXXxudWxsIHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0ZW1wbGF0ZU5vZGVzID0gcGFyc2VUZW1wbGF0ZSh0ZW1wbGF0ZS5jb250ZW50LCBmaWxlUGF0aCkubm9kZXM7XG4gICAgY29uc3QgdmlzaXRvciA9IG5ldyBQcm9wZXJ0eVdyaXRlSHRtbFZpc2l0b3IoKTtcblxuICAgIC8vIEFuYWx5emUgdGhlIEFuZ3VsYXIgUmVuZGVyMyBIVE1MIEFTVCBhbmQgY29sbGVjdCBhbGwgcHJvcGVydHkgYXNzaWdubWVudHMgYW5kXG4gICAgLy8gdGVtcGxhdGUgdmFyaWFibGVzLlxuICAgIHZpc2l0QWxsKHZpc2l0b3IsIHRlbXBsYXRlTm9kZXMpO1xuXG4gICAgcmV0dXJuIGZpbHRlclRlbXBsYXRlVmFyaWFibGVBc3NpZ25tZW50cyh2aXNpdG9yLnByb3BlcnR5QXNzaWdubWVudHMsIHZpc2l0b3IudGVtcGxhdGVWYXJpYWJsZXMpXG4gICAgICAgIC5tYXAoKHtub2RlLCBzdGFydCwgZW5kfSkgPT4gKHtub2RlLCBzdGFydDogc3RhcnQgKyBub2RlLnNwYW4uc3RhcnQsIGVuZH0pKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB0aGUgdGVtcGxhdGUgY291bGRuJ3QgYmUgcGFyc2VkLiBXZSBkb24ndCB3YW50IHRvIHRocm93IGFueVxuICAgIC8vIGV4Y2VwdGlvbiBpZiBhIHRlbXBsYXRlIGlzIHN5bnRhY3RpY2FsbHkgbm90IHZhbGlkLiBlLmcuIHRlbXBsYXRlIGNvdWxkIGJlXG4gICAgLy8gdXNpbmcgcHJlcHJvY2Vzc29yIHN5bnRheC5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYWxsIHRlbXBsYXRlIHZhcmlhYmxlIGFzc2lnbm1lbnRzIGJ5IGxvb2tpbmcgaWYgYSBnaXZlbiBwcm9wZXJ0eVxuICogYXNzaWdubWVudCBpcyBzZXR0aW5nIHRoZSB2YWx1ZSBmb3Igb25lIG9mIHRoZSBzcGVjaWZpZWQgdGVtcGxhdGUgdmFyaWFibGVzLlxuICovXG5mdW5jdGlvbiBmaWx0ZXJUZW1wbGF0ZVZhcmlhYmxlQXNzaWdubWVudHMod3JpdGVzOiBQcm9wZXJ0eUFzc2lnbm1lbnRbXSwgdmFyaWFibGVzOiBWYXJpYWJsZVtdKSB7XG4gIHJldHVybiB3cml0ZXMuZmlsdGVyKHByb3BlcnR5V3JpdGUgPT4gISF2YXJpYWJsZXMuZmluZCh2ID0+IHYubmFtZSA9PT0gcHJvcGVydHlXcml0ZS5ub2RlLm5hbWUpKTtcbn1cbiJdfQ==