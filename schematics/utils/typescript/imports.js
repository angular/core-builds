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
    exports.getImportOfIdentifier = void 0;
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
            importModule: importDecl.moduleSpecifier.text,
            node: importDecl
        };
    }
    exports.getImportOfIdentifier = getImportOfIdentifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBUWpDLHdGQUF3RjtJQUN4RixTQUFnQixxQkFBcUIsQ0FBQyxXQUEyQixFQUFFLElBQW1CO1FBRXBGLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7WUFDMUMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFcEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRTdDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNuRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTztZQUNMLHlFQUF5RTtZQUN6RSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUNqRSxZQUFZLEVBQUUsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJO1lBQzdDLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUM7SUFDSixDQUFDO0lBMUJELHNEQTBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmV4cG9ydCB0eXBlIEltcG9ydCA9IHtcbiAgbmFtZTogc3RyaW5nLFxuICBpbXBvcnRNb2R1bGU6IHN0cmluZyxcbiAgbm9kZTogdHMuSW1wb3J0RGVjbGFyYXRpb25cbn07XG5cbi8qKiBHZXRzIGltcG9ydCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgc3BlY2lmaWVkIGlkZW50aWZpZXIgYnkgdXNpbmcgdGhlIFR5cGUgY2hlY2tlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbXBvcnRPZklkZW50aWZpZXIodHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5JZGVudGlmaWVyKTogSW1wb3J0fFxuICAgIG51bGwge1xuICBjb25zdCBzeW1ib2wgPSB0eXBlQ2hlY2tlci5nZXRTeW1ib2xBdExvY2F0aW9uKG5vZGUpO1xuXG4gIGlmICghc3ltYm9sIHx8ICFzeW1ib2wuZGVjbGFyYXRpb25zLmxlbmd0aCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgZGVjbCA9IHN5bWJvbC5kZWNsYXJhdGlvbnNbMF07XG5cbiAgaWYgKCF0cy5pc0ltcG9ydFNwZWNpZmllcihkZWNsKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgaW1wb3J0RGVjbCA9IGRlY2wucGFyZW50LnBhcmVudC5wYXJlbnQ7XG5cbiAgaWYgKCF0cy5pc1N0cmluZ0xpdGVyYWwoaW1wb3J0RGVjbC5tb2R1bGVTcGVjaWZpZXIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8vIEhhbmRsZXMgYWxpYXNlZCBpbXBvcnRzOiBlLmcuIFwiaW1wb3J0IHtDb21wb25lbnQgYXMgbXlDb21wfSBmcm9tIC4uLlwiO1xuICAgIG5hbWU6IGRlY2wucHJvcGVydHlOYW1lID8gZGVjbC5wcm9wZXJ0eU5hbWUudGV4dCA6IGRlY2wubmFtZS50ZXh0LFxuICAgIGltcG9ydE1vZHVsZTogaW1wb3J0RGVjbC5tb2R1bGVTcGVjaWZpZXIudGV4dCxcbiAgICBub2RlOiBpbXBvcnREZWNsXG4gIH07XG59XG4iXX0=