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
        define("@angular/core/schematics/utils/parse_html", ["require", "exports", "@angular/compiler"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseHtmlGracefully = void 0;
    const compiler_1 = require("@angular/compiler");
    /**
     * Parses the given HTML content using the Angular compiler. In case the parsing
     * fails, null is being returned.
     */
    function parseHtmlGracefully(htmlContent, filePath) {
        try {
            return compiler_1.parseTemplate(htmlContent, filePath).nodes;
        }
        catch (_a) {
            // Do nothing if the template couldn't be parsed. We don't want to throw any
            // exception if a template is syntactically not valid. e.g. template could be
            // using preprocessor syntax.
            return null;
        }
    }
    exports.parseHtmlGracefully = parseHtmlGracefully;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VfaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wYXJzZV9odG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUFnRDtJQUdoRDs7O09BR0c7SUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxXQUFtQixFQUFFLFFBQWdCO1FBQ3ZFLElBQUk7WUFDRixPQUFPLHdCQUFhLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQztTQUNuRDtRQUFDLFdBQU07WUFDTiw0RUFBNEU7WUFDNUUsNkVBQTZFO1lBQzdFLDZCQUE2QjtZQUM3QixPQUFPLElBQUksQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQVRELGtEQVNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3BhcnNlVGVtcGxhdGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7Tm9kZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfYXN0JztcblxuLyoqXG4gKiBQYXJzZXMgdGhlIGdpdmVuIEhUTUwgY29udGVudCB1c2luZyB0aGUgQW5ndWxhciBjb21waWxlci4gSW4gY2FzZSB0aGUgcGFyc2luZ1xuICogZmFpbHMsIG51bGwgaXMgYmVpbmcgcmV0dXJuZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUh0bWxHcmFjZWZ1bGx5KGh0bWxDb250ZW50OiBzdHJpbmcsIGZpbGVQYXRoOiBzdHJpbmcpOiBOb2RlW118bnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHBhcnNlVGVtcGxhdGUoaHRtbENvbnRlbnQsIGZpbGVQYXRoKS5ub2RlcztcbiAgfSBjYXRjaCB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB0aGUgdGVtcGxhdGUgY291bGRuJ3QgYmUgcGFyc2VkLiBXZSBkb24ndCB3YW50IHRvIHRocm93IGFueVxuICAgIC8vIGV4Y2VwdGlvbiBpZiBhIHRlbXBsYXRlIGlzIHN5bnRhY3RpY2FsbHkgbm90IHZhbGlkLiBlLmcuIHRlbXBsYXRlIGNvdWxkIGJlXG4gICAgLy8gdXNpbmcgcHJlcHJvY2Vzc29yIHN5bnRheC5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19