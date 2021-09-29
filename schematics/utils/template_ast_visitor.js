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
        define("@angular/core/schematics/utils/template_ast_visitor", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateAstVisitor = void 0;
    /**
     * A base class that can be used to implement a Render3 Template AST visitor.
     * This class is used instead of the `NullVisitor` found within the `@angular/compiler` because
     * the `NullVisitor` requires a deep import which is no longer supported with the ESM bundled
     * packages as of v13.
     * Schematics are also currently required to be CommonJS to support execution within the Angular
     * CLI. As a result, the ESM `@angular/compiler` package must be loaded via a native dynamic import.
     * Using a dynamic import makes classes extending from classes present in `@angular/compiler`
     * complicated due to the class not being present at module evaluation time. The classes using a
     * base class found within `@angular/compiler` must be wrapped in a factory to allow the class value
     * to be accessible at runtime after the dynamic import has completed. This class implements the
     * interface of the `TmplAstRecursiveVisitor` class (but does not extend) as the
     * `TmplAstRecursiveVisitor` as an interface provides the required set of visit methods. The base
     * interface `Visitor<T>` is not exported.
     */
    class TemplateAstVisitor {
        visitElement(element) { }
        visitTemplate(template) { }
        visitContent(content) { }
        visitVariable(variable) { }
        visitReference(reference) { }
        visitTextAttribute(attribute) { }
        visitBoundAttribute(attribute) { }
        visitBoundEvent(attribute) { }
        visitText(text) { }
        visitBoundText(text) { }
        visitIcu(icu) { }
        /**
         * Visits all the provided nodes in order using this Visitor's visit methods.
         * This is a simplified variant of the `visitAll` function found inside of (but not
         * exported from) the `@angular/compiler` that does not support returning a value
         * since the migrations do not directly transform the nodes.
         *
         * @param nodes An iterable of nodes to visit using this visitor.
         */
        visitAll(nodes) {
            for (const node of nodes) {
                node.visit(this);
            }
        }
    }
    exports.TemplateAstVisitor = TemplateAstVisitor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfYXN0X3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdGVtcGxhdGVfYXN0X3Zpc2l0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBSUg7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxNQUFhLGtCQUFrQjtRQUM3QixZQUFZLENBQUMsT0FBdUIsSUFBUyxDQUFDO1FBQzlDLGFBQWEsQ0FBQyxRQUF5QixJQUFTLENBQUM7UUFDakQsWUFBWSxDQUFDLE9BQXVCLElBQVMsQ0FBQztRQUM5QyxhQUFhLENBQUMsUUFBeUIsSUFBUyxDQUFDO1FBQ2pELGNBQWMsQ0FBQyxTQUEyQixJQUFTLENBQUM7UUFDcEQsa0JBQWtCLENBQUMsU0FBK0IsSUFBUyxDQUFDO1FBQzVELG1CQUFtQixDQUFDLFNBQWdDLElBQVMsQ0FBQztRQUM5RCxlQUFlLENBQUMsU0FBNEIsSUFBUyxDQUFDO1FBQ3RELFNBQVMsQ0FBQyxJQUFpQixJQUFTLENBQUM7UUFDckMsY0FBYyxDQUFDLElBQXNCLElBQVMsQ0FBQztRQUMvQyxRQUFRLENBQUMsR0FBZSxJQUFTLENBQUM7UUFFbEM7Ozs7Ozs7V0FPRztRQUNILFFBQVEsQ0FBQyxLQUE0QjtZQUNuQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtnQkFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsQjtRQUNILENBQUM7S0FDRjtJQTFCRCxnREEwQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUge1RtcGxBc3RCb3VuZEF0dHJpYnV0ZSwgVG1wbEFzdEJvdW5kRXZlbnQsIFRtcGxBc3RCb3VuZFRleHQsIFRtcGxBc3RDb250ZW50LCBUbXBsQXN0RWxlbWVudCwgVG1wbEFzdEljdSwgVG1wbEFzdE5vZGUsIFRtcGxBc3RSZWN1cnNpdmVWaXNpdG9yLCBUbXBsQXN0UmVmZXJlbmNlLCBUbXBsQXN0VGVtcGxhdGUsIFRtcGxBc3RUZXh0LCBUbXBsQXN0VGV4dEF0dHJpYnV0ZSwgVG1wbEFzdFZhcmlhYmxlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbi8qKlxuICogQSBiYXNlIGNsYXNzIHRoYXQgY2FuIGJlIHVzZWQgdG8gaW1wbGVtZW50IGEgUmVuZGVyMyBUZW1wbGF0ZSBBU1QgdmlzaXRvci5cbiAqIFRoaXMgY2xhc3MgaXMgdXNlZCBpbnN0ZWFkIG9mIHRoZSBgTnVsbFZpc2l0b3JgIGZvdW5kIHdpdGhpbiB0aGUgYEBhbmd1bGFyL2NvbXBpbGVyYCBiZWNhdXNlXG4gKiB0aGUgYE51bGxWaXNpdG9yYCByZXF1aXJlcyBhIGRlZXAgaW1wb3J0IHdoaWNoIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgd2l0aCB0aGUgRVNNIGJ1bmRsZWRcbiAqIHBhY2thZ2VzIGFzIG9mIHYxMy5cbiAqIFNjaGVtYXRpY3MgYXJlIGFsc28gY3VycmVudGx5IHJlcXVpcmVkIHRvIGJlIENvbW1vbkpTIHRvIHN1cHBvcnQgZXhlY3V0aW9uIHdpdGhpbiB0aGUgQW5ndWxhclxuICogQ0xJLiBBcyBhIHJlc3VsdCwgdGhlIEVTTSBgQGFuZ3VsYXIvY29tcGlsZXJgIHBhY2thZ2UgbXVzdCBiZSBsb2FkZWQgdmlhIGEgbmF0aXZlIGR5bmFtaWMgaW1wb3J0LlxuICogVXNpbmcgYSBkeW5hbWljIGltcG9ydCBtYWtlcyBjbGFzc2VzIGV4dGVuZGluZyBmcm9tIGNsYXNzZXMgcHJlc2VudCBpbiBgQGFuZ3VsYXIvY29tcGlsZXJgXG4gKiBjb21wbGljYXRlZCBkdWUgdG8gdGhlIGNsYXNzIG5vdCBiZWluZyBwcmVzZW50IGF0IG1vZHVsZSBldmFsdWF0aW9uIHRpbWUuIFRoZSBjbGFzc2VzIHVzaW5nIGFcbiAqIGJhc2UgY2xhc3MgZm91bmQgd2l0aGluIGBAYW5ndWxhci9jb21waWxlcmAgbXVzdCBiZSB3cmFwcGVkIGluIGEgZmFjdG9yeSB0byBhbGxvdyB0aGUgY2xhc3MgdmFsdWVcbiAqIHRvIGJlIGFjY2Vzc2libGUgYXQgcnVudGltZSBhZnRlciB0aGUgZHluYW1pYyBpbXBvcnQgaGFzIGNvbXBsZXRlZC4gVGhpcyBjbGFzcyBpbXBsZW1lbnRzIHRoZVxuICogaW50ZXJmYWNlIG9mIHRoZSBgVG1wbEFzdFJlY3Vyc2l2ZVZpc2l0b3JgIGNsYXNzIChidXQgZG9lcyBub3QgZXh0ZW5kKSBhcyB0aGVcbiAqIGBUbXBsQXN0UmVjdXJzaXZlVmlzaXRvcmAgYXMgYW4gaW50ZXJmYWNlIHByb3ZpZGVzIHRoZSByZXF1aXJlZCBzZXQgb2YgdmlzaXQgbWV0aG9kcy4gVGhlIGJhc2VcbiAqIGludGVyZmFjZSBgVmlzaXRvcjxUPmAgaXMgbm90IGV4cG9ydGVkLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVBc3RWaXNpdG9yIGltcGxlbWVudHMgVG1wbEFzdFJlY3Vyc2l2ZVZpc2l0b3Ige1xuICB2aXNpdEVsZW1lbnQoZWxlbWVudDogVG1wbEFzdEVsZW1lbnQpOiB2b2lkIHt9XG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFRtcGxBc3RUZW1wbGF0ZSk6IHZvaWQge31cbiAgdmlzaXRDb250ZW50KGNvbnRlbnQ6IFRtcGxBc3RDb250ZW50KTogdm9pZCB7fVxuICB2aXNpdFZhcmlhYmxlKHZhcmlhYmxlOiBUbXBsQXN0VmFyaWFibGUpOiB2b2lkIHt9XG4gIHZpc2l0UmVmZXJlbmNlKHJlZmVyZW5jZTogVG1wbEFzdFJlZmVyZW5jZSk6IHZvaWQge31cbiAgdmlzaXRUZXh0QXR0cmlidXRlKGF0dHJpYnV0ZTogVG1wbEFzdFRleHRBdHRyaWJ1dGUpOiB2b2lkIHt9XG4gIHZpc2l0Qm91bmRBdHRyaWJ1dGUoYXR0cmlidXRlOiBUbXBsQXN0Qm91bmRBdHRyaWJ1dGUpOiB2b2lkIHt9XG4gIHZpc2l0Qm91bmRFdmVudChhdHRyaWJ1dGU6IFRtcGxBc3RCb3VuZEV2ZW50KTogdm9pZCB7fVxuICB2aXNpdFRleHQodGV4dDogVG1wbEFzdFRleHQpOiB2b2lkIHt9XG4gIHZpc2l0Qm91bmRUZXh0KHRleHQ6IFRtcGxBc3RCb3VuZFRleHQpOiB2b2lkIHt9XG4gIHZpc2l0SWN1KGljdTogVG1wbEFzdEljdSk6IHZvaWQge31cblxuICAvKipcbiAgICogVmlzaXRzIGFsbCB0aGUgcHJvdmlkZWQgbm9kZXMgaW4gb3JkZXIgdXNpbmcgdGhpcyBWaXNpdG9yJ3MgdmlzaXQgbWV0aG9kcy5cbiAgICogVGhpcyBpcyBhIHNpbXBsaWZpZWQgdmFyaWFudCBvZiB0aGUgYHZpc2l0QWxsYCBmdW5jdGlvbiBmb3VuZCBpbnNpZGUgb2YgKGJ1dCBub3RcbiAgICogZXhwb3J0ZWQgZnJvbSkgdGhlIGBAYW5ndWxhci9jb21waWxlcmAgdGhhdCBkb2VzIG5vdCBzdXBwb3J0IHJldHVybmluZyBhIHZhbHVlXG4gICAqIHNpbmNlIHRoZSBtaWdyYXRpb25zIGRvIG5vdCBkaXJlY3RseSB0cmFuc2Zvcm0gdGhlIG5vZGVzLlxuICAgKlxuICAgKiBAcGFyYW0gbm9kZXMgQW4gaXRlcmFibGUgb2Ygbm9kZXMgdG8gdmlzaXQgdXNpbmcgdGhpcyB2aXNpdG9yLlxuICAgKi9cbiAgdmlzaXRBbGwobm9kZXM6IEl0ZXJhYmxlPFRtcGxBc3ROb2RlPik6IHZvaWQge1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgbm9kZS52aXNpdCh0aGlzKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==