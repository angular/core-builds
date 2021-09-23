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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VfaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy9wYXJzZV9odG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGdEQUFnRDtJQUdoRDs7O09BR0c7SUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxXQUFtQixFQUFFLFFBQWdCO1FBQ3ZFLElBQUk7WUFDRixPQUFPLElBQUEsd0JBQWEsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDO1NBQ25EO1FBQUMsV0FBTTtZQUNOLDRFQUE0RTtZQUM1RSw2RUFBNkU7WUFDN0UsNkJBQTZCO1lBQzdCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBVEQsa0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtwYXJzZVRlbXBsYXRlfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge05vZGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3IzX2FzdCc7XG5cbi8qKlxuICogUGFyc2VzIHRoZSBnaXZlbiBIVE1MIGNvbnRlbnQgdXNpbmcgdGhlIEFuZ3VsYXIgY29tcGlsZXIuIEluIGNhc2UgdGhlIHBhcnNpbmdcbiAqIGZhaWxzLCBudWxsIGlzIGJlaW5nIHJldHVybmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIdG1sR3JhY2VmdWxseShodG1sQ29udGVudDogc3RyaW5nLCBmaWxlUGF0aDogc3RyaW5nKTogTm9kZVtdfG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBwYXJzZVRlbXBsYXRlKGh0bWxDb250ZW50LCBmaWxlUGF0aCkubm9kZXM7XG4gIH0gY2F0Y2gge1xuICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIHRlbXBsYXRlIGNvdWxkbid0IGJlIHBhcnNlZC4gV2UgZG9uJ3Qgd2FudCB0byB0aHJvdyBhbnlcbiAgICAvLyBleGNlcHRpb24gaWYgYSB0ZW1wbGF0ZSBpcyBzeW50YWN0aWNhbGx5IG5vdCB2YWxpZC4gZS5nLiB0ZW1wbGF0ZSBjb3VsZCBiZVxuICAgIC8vIHVzaW5nIHByZXByb2Nlc3NvciBzeW50YXguXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==