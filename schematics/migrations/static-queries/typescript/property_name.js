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
        define("@angular/core/schematics/migrations/static-queries/typescript/property_name", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /**
     * Gets the text of the given property name. Returns null if the property
     * name couldn't be determined statically.
     */
    function getPropertyNameText(node) {
        if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
            return node.text;
        }
        return null;
    }
    exports.getPropertyNameText = getPropertyNameText;
    /** Checks whether the given property name has a text. */
    function hasPropertyNameText(node) {
        return ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isIdentifier(node);
    }
    exports.hasPropertyNameText = hasPropertyNameText;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3N0YXRpYy1xdWVyaWVzL3R5cGVzY3JpcHQvcHJvcGVydHlfbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUtqQzs7O09BR0c7SUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxJQUFxQjtRQUN2RCxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3pELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztTQUNsQjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUxELGtEQUtDO0lBRUQseURBQXlEO0lBQ3pELFNBQWdCLG1CQUFtQixDQUFDLElBQXFCO1FBQ3ZELE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RixDQUFDO0lBRkQsa0RBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG4vKiogVHlwZSB0aGF0IGRlc2NyaWJlcyBhIHByb3BlcnR5IG5hbWUgd2l0aCBhbiBvYnRhaW5hYmxlIHRleHQuICovXG50eXBlIFByb3BlcnR5TmFtZVdpdGhUZXh0ID0gRXhjbHVkZTx0cy5Qcm9wZXJ0eU5hbWUsIHRzLkNvbXB1dGVkUHJvcGVydHlOYW1lPjtcblxuLyoqXG4gKiBHZXRzIHRoZSB0ZXh0IG9mIHRoZSBnaXZlbiBwcm9wZXJ0eSBuYW1lLiBSZXR1cm5zIG51bGwgaWYgdGhlIHByb3BlcnR5XG4gKiBuYW1lIGNvdWxkbid0IGJlIGRldGVybWluZWQgc3RhdGljYWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3BlcnR5TmFtZVRleHQobm9kZTogdHMuUHJvcGVydHlOYW1lKTogc3RyaW5nfG51bGwge1xuICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpIHx8IHRzLmlzU3RyaW5nTGl0ZXJhbExpa2Uobm9kZSkpIHtcbiAgICByZXR1cm4gbm9kZS50ZXh0O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIHByb3BlcnR5IG5hbWUgaGFzIGEgdGV4dC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNQcm9wZXJ0eU5hbWVUZXh0KG5vZGU6IHRzLlByb3BlcnR5TmFtZSk6IG5vZGUgaXMgUHJvcGVydHlOYW1lV2l0aFRleHQge1xuICByZXR1cm4gdHMuaXNTdHJpbmdMaXRlcmFsKG5vZGUpIHx8IHRzLmlzTnVtZXJpY0xpdGVyYWwobm9kZSkgfHwgdHMuaXNJZGVudGlmaWVyKG5vZGUpO1xufVxuIl19