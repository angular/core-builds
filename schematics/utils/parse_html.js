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
            return (0, compiler_1.parseTemplate)(htmlContent, filePath).nodes;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VfaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wYXJzZV9odG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUE2RDtJQUU3RDs7O09BR0c7SUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxXQUFtQixFQUFFLFFBQWdCO1FBQ3ZFLElBQUk7WUFDRixPQUFPLElBQUEsd0JBQWEsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDO1NBQ25EO1FBQUMsV0FBTTtZQUNOLDRFQUE0RTtZQUM1RSw2RUFBNkU7WUFDN0UsNkJBQTZCO1lBQzdCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBVEQsa0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtwYXJzZVRlbXBsYXRlLCBUbXBsQXN0Tm9kZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG4vKipcbiAqIFBhcnNlcyB0aGUgZ2l2ZW4gSFRNTCBjb250ZW50IHVzaW5nIHRoZSBBbmd1bGFyIGNvbXBpbGVyLiBJbiBjYXNlIHRoZSBwYXJzaW5nXG4gKiBmYWlscywgbnVsbCBpcyBiZWluZyByZXR1cm5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSHRtbEdyYWNlZnVsbHkoaHRtbENvbnRlbnQ6IHN0cmluZywgZmlsZVBhdGg6IHN0cmluZyk6IFRtcGxBc3ROb2RlW118bnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHBhcnNlVGVtcGxhdGUoaHRtbENvbnRlbnQsIGZpbGVQYXRoKS5ub2RlcztcbiAgfSBjYXRjaCB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB0aGUgdGVtcGxhdGUgY291bGRuJ3QgYmUgcGFyc2VkLiBXZSBkb24ndCB3YW50IHRvIHRocm93IGFueVxuICAgIC8vIGV4Y2VwdGlvbiBpZiBhIHRlbXBsYXRlIGlzIHN5bnRhY3RpY2FsbHkgbm90IHZhbGlkLiBlLmcuIHRlbXBsYXRlIGNvdWxkIGJlXG4gICAgLy8gdXNpbmcgcHJlcHJvY2Vzc29yIHN5bnRheC5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl19