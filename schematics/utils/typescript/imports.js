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
        define("@angular/core/schematics/utils/typescript/imports", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /** Gets import information about the specified identifier by using the Type checker. */
    function getImportOfIdentifier(typeChecker, node) {
        const symbol = typeChecker.getSymbolAtLocation(node);
        if (!symbol || !symbol.declarations.length) {
            return null;
        }
        const decl = symbol.declarations[0];
        if (!ts.isImportSpecifier(decl)) {
            return null;
        }
        const importDecl = decl.parent.parent.parent;
        if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
            return null;
        }
        return {
            // Handles aliased imports: e.g. "import {Component as myComp} from ...";
            name: decl.propertyName ? decl.propertyName.text : decl.name.text,
            importModule: importDecl.moduleSpecifier.text
        };
    }
    exports.getImportOfIdentifier = getImportOfIdentifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCxpQ0FBaUM7SUFPakMsd0ZBQXdGO0lBQ3hGLFNBQWdCLHFCQUFxQixDQUFDLFdBQTJCLEVBQUUsSUFBbUI7UUFFcEYsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJELElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRTtZQUMxQyxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwQyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFFN0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ25ELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxPQUFPO1lBQ0wseUVBQXlFO1lBQ3pFLElBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJO1lBQ2pFLFlBQVksRUFBRSxVQUFVLENBQUMsZUFBZSxDQUFDLElBQUk7U0FDOUMsQ0FBQztJQUNKLENBQUM7SUF6QkQsc0RBeUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuZXhwb3J0IHR5cGUgSW1wb3J0ID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGltcG9ydE1vZHVsZTogc3RyaW5nXG59O1xuXG4vKiogR2V0cyBpbXBvcnQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHNwZWNpZmllZCBpZGVudGlmaWVyIGJ5IHVzaW5nIHRoZSBUeXBlIGNoZWNrZXIuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbm9kZTogdHMuSWRlbnRpZmllcik6IEltcG9ydHxcbiAgICBudWxsIHtcbiAgY29uc3Qgc3ltYm9sID0gdHlwZUNoZWNrZXIuZ2V0U3ltYm9sQXRMb2NhdGlvbihub2RlKTtcblxuICBpZiAoIXN5bWJvbCB8fCAhc3ltYm9sLmRlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGRlY2wgPSBzeW1ib2wuZGVjbGFyYXRpb25zWzBdO1xuXG4gIGlmICghdHMuaXNJbXBvcnRTcGVjaWZpZXIoZGVjbCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGltcG9ydERlY2wgPSBkZWNsLnBhcmVudC5wYXJlbnQucGFyZW50O1xuXG4gIGlmICghdHMuaXNTdHJpbmdMaXRlcmFsKGltcG9ydERlY2wubW9kdWxlU3BlY2lmaWVyKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBIYW5kbGVzIGFsaWFzZWQgaW1wb3J0czogZS5nLiBcImltcG9ydCB7Q29tcG9uZW50IGFzIG15Q29tcH0gZnJvbSAuLi5cIjtcbiAgICBuYW1lOiBkZWNsLnByb3BlcnR5TmFtZSA/IGRlY2wucHJvcGVydHlOYW1lLnRleHQgOiBkZWNsLm5hbWUudGV4dCxcbiAgICBpbXBvcnRNb2R1bGU6IGltcG9ydERlY2wubW9kdWxlU3BlY2lmaWVyLnRleHRcbiAgfTtcbn1cbiJdfQ==