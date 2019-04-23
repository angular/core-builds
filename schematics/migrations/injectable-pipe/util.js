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
        define("@angular/core/schematics/migrations/injectable-pipe/util", ["require", "exports", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ts = require("typescript");
    /** Name of the Injectable decorator. */
    exports.INJECTABLE_DECORATOR_NAME = 'Injectable';
    /**
     * Adds a named import to an import declaration node.
     * @param node Node to which to add the import.
     * @param importName Name of the import that should be added.
     */
    function addNamedImport(node, importName) {
        const namedImports = getNamedImports(node);
        if (namedImports && ts.isNamedImports(namedImports)) {
            const elements = namedImports.elements;
            const isAlreadyImported = elements.some(element => element.name.text === importName);
            if (!isAlreadyImported) {
                // If there are named imports, there will be an import clause as well.
                const importClause = node.importClause;
                const newImportClause = ts.createNamedImports([...elements, ts.createImportSpecifier(undefined, ts.createIdentifier(importName))]);
                return ts.updateImportDeclaration(node, node.decorators, node.modifiers, ts.updateImportClause(importClause, importClause.name, newImportClause), node.moduleSpecifier);
            }
        }
        return node;
    }
    exports.addNamedImport = addNamedImport;
    /** Gets the named imports node from an import declaration. */
    function getNamedImports(node) {
        const importClause = node.importClause;
        const namedImports = importClause && importClause.namedBindings;
        return (namedImports && ts.isNamedImports(namedImports)) ? namedImports : null;
    }
    exports.getNamedImports = getNamedImports;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL2luamVjdGFibGUtcGlwZS91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLHdDQUF3QztJQUMzQixRQUFBLHlCQUF5QixHQUFHLFlBQVksQ0FBQztJQUV0RDs7OztPQUlHO0lBQ0gsU0FBZ0IsY0FBYyxDQUFDLElBQTBCLEVBQUUsVUFBa0I7UUFDM0UsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTNDLElBQUksWUFBWSxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDbkQsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztZQUN2QyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztZQUVyRixJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ3RCLHNFQUFzRTtnQkFDdEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQWMsQ0FBQztnQkFDekMsTUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUN6QyxDQUFDLEdBQUcsUUFBUSxFQUFFLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV6RixPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FDN0IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFDckMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxFQUN2RSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDM0I7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQXJCRCx3Q0FxQkM7SUFFRCw4REFBOEQ7SUFDOUQsU0FBZ0IsZUFBZSxDQUFDLElBQTBCO1FBQ3hELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDdkMsTUFBTSxZQUFZLEdBQUcsWUFBWSxJQUFJLFlBQVksQ0FBQyxhQUFhLENBQUM7UUFDaEUsT0FBTyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2pGLENBQUM7SUFKRCwwQ0FJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbi8qKiBOYW1lIG9mIHRoZSBJbmplY3RhYmxlIGRlY29yYXRvci4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RBQkxFX0RFQ09SQVRPUl9OQU1FID0gJ0luamVjdGFibGUnO1xuXG4vKipcbiAqIEFkZHMgYSBuYW1lZCBpbXBvcnQgdG8gYW4gaW1wb3J0IGRlY2xhcmF0aW9uIG5vZGUuXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHRvIHdoaWNoIHRvIGFkZCB0aGUgaW1wb3J0LlxuICogQHBhcmFtIGltcG9ydE5hbWUgTmFtZSBvZiB0aGUgaW1wb3J0IHRoYXQgc2hvdWxkIGJlIGFkZGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkTmFtZWRJbXBvcnQobm9kZTogdHMuSW1wb3J0RGVjbGFyYXRpb24sIGltcG9ydE5hbWU6IHN0cmluZykge1xuICBjb25zdCBuYW1lZEltcG9ydHMgPSBnZXROYW1lZEltcG9ydHMobm9kZSk7XG5cbiAgaWYgKG5hbWVkSW1wb3J0cyAmJiB0cy5pc05hbWVkSW1wb3J0cyhuYW1lZEltcG9ydHMpKSB7XG4gICAgY29uc3QgZWxlbWVudHMgPSBuYW1lZEltcG9ydHMuZWxlbWVudHM7XG4gICAgY29uc3QgaXNBbHJlYWR5SW1wb3J0ZWQgPSBlbGVtZW50cy5zb21lKGVsZW1lbnQgPT4gZWxlbWVudC5uYW1lLnRleHQgPT09IGltcG9ydE5hbWUpO1xuXG4gICAgaWYgKCFpc0FscmVhZHlJbXBvcnRlZCkge1xuICAgICAgLy8gSWYgdGhlcmUgYXJlIG5hbWVkIGltcG9ydHMsIHRoZXJlIHdpbGwgYmUgYW4gaW1wb3J0IGNsYXVzZSBhcyB3ZWxsLlxuICAgICAgY29uc3QgaW1wb3J0Q2xhdXNlID0gbm9kZS5pbXBvcnRDbGF1c2UgITtcbiAgICAgIGNvbnN0IG5ld0ltcG9ydENsYXVzZSA9IHRzLmNyZWF0ZU5hbWVkSW1wb3J0cyhcbiAgICAgICAgICBbLi4uZWxlbWVudHMsIHRzLmNyZWF0ZUltcG9ydFNwZWNpZmllcih1bmRlZmluZWQsIHRzLmNyZWF0ZUlkZW50aWZpZXIoaW1wb3J0TmFtZSkpXSk7XG5cbiAgICAgIHJldHVybiB0cy51cGRhdGVJbXBvcnREZWNsYXJhdGlvbihcbiAgICAgICAgICBub2RlLCBub2RlLmRlY29yYXRvcnMsIG5vZGUubW9kaWZpZXJzLFxuICAgICAgICAgIHRzLnVwZGF0ZUltcG9ydENsYXVzZShpbXBvcnRDbGF1c2UsIGltcG9ydENsYXVzZS5uYW1lLCBuZXdJbXBvcnRDbGF1c2UpLFxuICAgICAgICAgIG5vZGUubW9kdWxlU3BlY2lmaWVyKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIG5hbWVkIGltcG9ydHMgbm9kZSBmcm9tIGFuIGltcG9ydCBkZWNsYXJhdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lZEltcG9ydHMobm9kZTogdHMuSW1wb3J0RGVjbGFyYXRpb24pOiB0cy5OYW1lZEltcG9ydHN8bnVsbCB7XG4gIGNvbnN0IGltcG9ydENsYXVzZSA9IG5vZGUuaW1wb3J0Q2xhdXNlO1xuICBjb25zdCBuYW1lZEltcG9ydHMgPSBpbXBvcnRDbGF1c2UgJiYgaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3M7XG4gIHJldHVybiAobmFtZWRJbXBvcnRzICYmIHRzLmlzTmFtZWRJbXBvcnRzKG5hbWVkSW1wb3J0cykpID8gbmFtZWRJbXBvcnRzIDogbnVsbDtcbn1cbiJdfQ==