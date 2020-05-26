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
        define("@angular/core/schematics/utils/typescript/nodes", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasModifier = void 0;
    /** Checks whether the given TypeScript node has the specified modifier set. */
    function hasModifier(node, modifierKind) {
        return !!node.modifiers && node.modifiers.some(m => m.kind === modifierKind);
    }
    exports.hasModifier = hasModifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvdHlwZXNjcmlwdC9ub2Rlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFJSCwrRUFBK0U7SUFDL0UsU0FBZ0IsV0FBVyxDQUFDLElBQWEsRUFBRSxZQUEyQjtRQUNwRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRkQsa0NBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIFR5cGVTY3JpcHQgbm9kZSBoYXMgdGhlIHNwZWNpZmllZCBtb2RpZmllciBzZXQuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzTW9kaWZpZXIobm9kZTogdHMuTm9kZSwgbW9kaWZpZXJLaW5kOiB0cy5TeW50YXhLaW5kKSB7XG4gIHJldHVybiAhIW5vZGUubW9kaWZpZXJzICYmIG5vZGUubW9kaWZpZXJzLnNvbWUobSA9PiBtLmtpbmQgPT09IG1vZGlmaWVyS2luZCk7XG59XG4iXX0=