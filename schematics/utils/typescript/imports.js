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
        define("@angular/core/schematics/utils/typescript/imports", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getImportSpecifier = exports.getImportOfIdentifier = void 0;
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
    /**
     * Gets a top-level import specifier with a specific name that is imported from a particular module.
     * E.g. given a file that looks like:
     *
     * ```
     * import { Component, Directive } from '@angular/core';
     * import { Foo } from './foo';
     * ```
     *
     * Calling `getImportSpecifier(sourceFile, '@angular/core', 'Directive')` will yield the node
     * referring to `Directive` in the top import.
     *
     * @param sourceFile File in which to look for imports.
     * @param moduleName Name of the import's module.
     * @param specifierName Original name of the specifier to look for. Aliases will be resolved to
     *    their original name.
     */
    function getImportSpecifier(sourceFile, moduleName, specifierName) {
        for (const node of sourceFile.statements) {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
                node.moduleSpecifier.text === moduleName) {
                const namedBindings = node.importClause && node.importClause.namedBindings;
                if (namedBindings && ts.isNamedImports(namedBindings)) {
                    const match = namedBindings.elements.find(element => {
                        const { name, propertyName } = element;
                        return propertyName ? propertyName.text === specifierName : name.text === specifierName;
                    });
                    if (match) {
                        return match;
                    }
                }
            }
        }
        return null;
    }
    exports.getImportSpecifier = getImportSpecifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBUWpDLHdGQUF3RjtJQUN4RixTQUFnQixxQkFBcUIsQ0FBQyxXQUEyQixFQUFFLElBQW1CO1FBRXBGLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7WUFDMUMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFcEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBRTdDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNuRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsT0FBTztZQUNMLHlFQUF5RTtZQUN6RSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUNqRSxZQUFZLEVBQUUsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJO1lBQzdDLElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUM7SUFDSixDQUFDO0lBMUJELHNEQTBCQztJQUdEOzs7Ozs7Ozs7Ozs7Ozs7O09BZ0JHO0lBQ0gsU0FBZ0Isa0JBQWtCLENBQzlCLFVBQXlCLEVBQUUsVUFBa0IsRUFBRSxhQUFxQjtRQUN0RSxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUU7WUFDeEMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUN4RSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7Z0JBQzVDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUM7Z0JBQzNFLElBQUksYUFBYSxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUU7b0JBQ3JELE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUNsRCxNQUFNLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQyxHQUFHLE9BQU8sQ0FBQzt3QkFDckMsT0FBTyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGFBQWEsQ0FBQztvQkFDMUYsQ0FBQyxDQUFDLENBQUM7b0JBRUgsSUFBSSxLQUFLLEVBQUU7d0JBQ1QsT0FBTyxLQUFLLENBQUM7cUJBQ2Q7aUJBQ0Y7YUFDRjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBcEJELGdEQW9CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuZXhwb3J0IHR5cGUgSW1wb3J0ID0ge1xuICBuYW1lOiBzdHJpbmcsXG4gIGltcG9ydE1vZHVsZTogc3RyaW5nLFxuICBub2RlOiB0cy5JbXBvcnREZWNsYXJhdGlvblxufTtcblxuLyoqIEdldHMgaW1wb3J0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBzcGVjaWZpZWQgaWRlbnRpZmllciBieSB1c2luZyB0aGUgVHlwZSBjaGVja2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEltcG9ydE9mSWRlbnRpZmllcih0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsIG5vZGU6IHRzLklkZW50aWZpZXIpOiBJbXBvcnR8XG4gICAgbnVsbCB7XG4gIGNvbnN0IHN5bWJvbCA9IHR5cGVDaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24obm9kZSk7XG5cbiAgaWYgKCFzeW1ib2wgfHwgIXN5bWJvbC5kZWNsYXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBkZWNsID0gc3ltYm9sLmRlY2xhcmF0aW9uc1swXTtcblxuICBpZiAoIXRzLmlzSW1wb3J0U3BlY2lmaWVyKGRlY2wpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBpbXBvcnREZWNsID0gZGVjbC5wYXJlbnQucGFyZW50LnBhcmVudDtcblxuICBpZiAoIXRzLmlzU3RyaW5nTGl0ZXJhbChpbXBvcnREZWNsLm1vZHVsZVNwZWNpZmllcikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLy8gSGFuZGxlcyBhbGlhc2VkIGltcG9ydHM6IGUuZy4gXCJpbXBvcnQge0NvbXBvbmVudCBhcyBteUNvbXB9IGZyb20gLi4uXCI7XG4gICAgbmFtZTogZGVjbC5wcm9wZXJ0eU5hbWUgPyBkZWNsLnByb3BlcnR5TmFtZS50ZXh0IDogZGVjbC5uYW1lLnRleHQsXG4gICAgaW1wb3J0TW9kdWxlOiBpbXBvcnREZWNsLm1vZHVsZVNwZWNpZmllci50ZXh0LFxuICAgIG5vZGU6IGltcG9ydERlY2xcbiAgfTtcbn1cblxuXG4vKipcbiAqIEdldHMgYSB0b3AtbGV2ZWwgaW1wb3J0IHNwZWNpZmllciB3aXRoIGEgc3BlY2lmaWMgbmFtZSB0aGF0IGlzIGltcG9ydGVkIGZyb20gYSBwYXJ0aWN1bGFyIG1vZHVsZS5cbiAqIEUuZy4gZ2l2ZW4gYSBmaWxlIHRoYXQgbG9va3MgbGlrZTpcbiAqXG4gKiBgYGBcbiAqIGltcG9ydCB7IENvbXBvbmVudCwgRGlyZWN0aXZlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQgeyBGb28gfSBmcm9tICcuL2Zvbyc7XG4gKiBgYGBcbiAqXG4gKiBDYWxsaW5nIGBnZXRJbXBvcnRTcGVjaWZpZXIoc291cmNlRmlsZSwgJ0Bhbmd1bGFyL2NvcmUnLCAnRGlyZWN0aXZlJylgIHdpbGwgeWllbGQgdGhlIG5vZGVcbiAqIHJlZmVycmluZyB0byBgRGlyZWN0aXZlYCBpbiB0aGUgdG9wIGltcG9ydC5cbiAqXG4gKiBAcGFyYW0gc291cmNlRmlsZSBGaWxlIGluIHdoaWNoIHRvIGxvb2sgZm9yIGltcG9ydHMuXG4gKiBAcGFyYW0gbW9kdWxlTmFtZSBOYW1lIG9mIHRoZSBpbXBvcnQncyBtb2R1bGUuXG4gKiBAcGFyYW0gc3BlY2lmaWVyTmFtZSBPcmlnaW5hbCBuYW1lIG9mIHRoZSBzcGVjaWZpZXIgdG8gbG9vayBmb3IuIEFsaWFzZXMgd2lsbCBiZSByZXNvbHZlZCB0b1xuICogICAgdGhlaXIgb3JpZ2luYWwgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEltcG9ydFNwZWNpZmllcihcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBtb2R1bGVOYW1lOiBzdHJpbmcsIHNwZWNpZmllck5hbWU6IHN0cmluZyk6IHRzLkltcG9ydFNwZWNpZmllcnxudWxsIHtcbiAgZm9yIChjb25zdCBub2RlIG9mIHNvdXJjZUZpbGUuc3RhdGVtZW50cykge1xuICAgIGlmICh0cy5pc0ltcG9ydERlY2xhcmF0aW9uKG5vZGUpICYmIHRzLmlzU3RyaW5nTGl0ZXJhbChub2RlLm1vZHVsZVNwZWNpZmllcikgJiZcbiAgICAgICAgbm9kZS5tb2R1bGVTcGVjaWZpZXIudGV4dCA9PT0gbW9kdWxlTmFtZSkge1xuICAgICAgY29uc3QgbmFtZWRCaW5kaW5ncyA9IG5vZGUuaW1wb3J0Q2xhdXNlICYmIG5vZGUuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3M7XG4gICAgICBpZiAobmFtZWRCaW5kaW5ncyAmJiB0cy5pc05hbWVkSW1wb3J0cyhuYW1lZEJpbmRpbmdzKSkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5hbWVkQmluZGluZ3MuZWxlbWVudHMuZmluZChlbGVtZW50ID0+IHtcbiAgICAgICAgICBjb25zdCB7bmFtZSwgcHJvcGVydHlOYW1lfSA9IGVsZW1lbnQ7XG4gICAgICAgICAgcmV0dXJuIHByb3BlcnR5TmFtZSA/IHByb3BlcnR5TmFtZS50ZXh0ID09PSBzcGVjaWZpZXJOYW1lIDogbmFtZS50ZXh0ID09PSBzcGVjaWZpZXJOYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==