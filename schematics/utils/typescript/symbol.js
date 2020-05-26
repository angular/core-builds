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
        define("@angular/core/schematics/utils/typescript/symbol", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getValueSymbolOfDeclaration = void 0;
    const ts = require("typescript");
    function getValueSymbolOfDeclaration(node, typeChecker) {
        let symbol = typeChecker.getSymbolAtLocation(node);
        while (symbol && symbol.flags & ts.SymbolFlags.Alias) {
            symbol = typeChecker.getAliasedSymbol(symbol);
        }
        return symbol;
    }
    exports.getValueSymbolOfDeclaration = getValueSymbolOfDeclaration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zY2hlbWF0aWNzL3V0aWxzL3R5cGVzY3JpcHQvc3ltYm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQyxTQUFnQiwyQkFBMkIsQ0FBQyxJQUFhLEVBQUUsV0FBMkI7UUFFcEYsSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRW5ELE9BQU8sTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUU7WUFDcEQsTUFBTSxHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFURCxrRUFTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZVN5bWJvbE9mRGVjbGFyYXRpb24obm9kZTogdHMuTm9kZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogdHMuU3ltYm9sfFxuICAgIHVuZGVmaW5lZCB7XG4gIGxldCBzeW1ib2wgPSB0eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuXG4gIHdoaWxlIChzeW1ib2wgJiYgc3ltYm9sLmZsYWdzICYgdHMuU3ltYm9sRmxhZ3MuQWxpYXMpIHtcbiAgICBzeW1ib2wgPSB0eXBlQ2hlY2tlci5nZXRBbGlhc2VkU3ltYm9sKHN5bWJvbCk7XG4gIH1cblxuICByZXR1cm4gc3ltYm9sO1xufVxuIl19