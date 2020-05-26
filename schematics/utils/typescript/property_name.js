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
        define("@angular/core/schematics/utils/typescript/property_name", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasPropertyNameText = exports.getPropertyNameText = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L3Byb3BlcnR5X25hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBS2pDOzs7T0FHRztJQUNILFNBQWdCLG1CQUFtQixDQUFDLElBQXFCO1FBQ3ZELElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQ2xCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBTEQsa0RBS0M7SUFFRCx5REFBeUQ7SUFDekQsU0FBZ0IsbUJBQW1CLENBQUMsSUFBcUI7UUFDdkQsT0FBTyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFGRCxrREFFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbi8qKiBUeXBlIHRoYXQgZGVzY3JpYmVzIGEgcHJvcGVydHkgbmFtZSB3aXRoIGFuIG9idGFpbmFibGUgdGV4dC4gKi9cbnR5cGUgUHJvcGVydHlOYW1lV2l0aFRleHQgPSBFeGNsdWRlPHRzLlByb3BlcnR5TmFtZSwgdHMuQ29tcHV0ZWRQcm9wZXJ0eU5hbWU+O1xuXG4vKipcbiAqIEdldHMgdGhlIHRleHQgb2YgdGhlIGdpdmVuIHByb3BlcnR5IG5hbWUuIFJldHVybnMgbnVsbCBpZiB0aGUgcHJvcGVydHlcbiAqIG5hbWUgY291bGRuJ3QgYmUgZGV0ZXJtaW5lZCBzdGF0aWNhbGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcGVydHlOYW1lVGV4dChub2RlOiB0cy5Qcm9wZXJ0eU5hbWUpOiBzdHJpbmd8bnVsbCB7XG4gIGlmICh0cy5pc0lkZW50aWZpZXIobm9kZSkgfHwgdHMuaXNTdHJpbmdMaXRlcmFsTGlrZShub2RlKSkge1xuICAgIHJldHVybiBub2RlLnRleHQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gcHJvcGVydHkgbmFtZSBoYXMgYSB0ZXh0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc1Byb3BlcnR5TmFtZVRleHQobm9kZTogdHMuUHJvcGVydHlOYW1lKTogbm9kZSBpcyBQcm9wZXJ0eU5hbWVXaXRoVGV4dCB7XG4gIHJldHVybiB0cy5pc1N0cmluZ0xpdGVyYWwobm9kZSkgfHwgdHMuaXNOdW1lcmljTGl0ZXJhbChub2RlKSB8fCB0cy5pc0lkZW50aWZpZXIobm9kZSk7XG59XG4iXX0=