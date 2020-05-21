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
        define("@angular/core/schematics/utils/typescript/decorators", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCallDecoratorImport = void 0;
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    function getCallDecoratorImport(typeChecker, decorator) {
        // Note that this does not cover the edge case where decorators are called from
        // a namespace import: e.g. "@core.Component()". This is not handled by Ngtsc either.
        if (!ts.isCallExpression(decorator.expression) ||
            !ts.isIdentifier(decorator.expression.expression)) {
            return null;
        }
        const identifier = decorator.expression.expression;
        return imports_1.getImportOfIdentifier(typeChecker, identifier);
    }
    exports.getCallDecoratorImport = getCallDecoratorImport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy91dGlscy90eXBlc2NyaXB0L2RlY29yYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLCtFQUF3RDtJQUV4RCxTQUFnQixzQkFBc0IsQ0FDbEMsV0FBMkIsRUFBRSxTQUF1QjtRQUN0RCwrRUFBK0U7UUFDL0UscUZBQXFGO1FBQ3JGLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUMxQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNyRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDbkQsT0FBTywrQkFBcUIsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQVhELHdEQVdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRJbXBvcnRPZklkZW50aWZpZXIsIEltcG9ydH0gZnJvbSAnLi9pbXBvcnRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhbGxEZWNvcmF0b3JJbXBvcnQoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBkZWNvcmF0b3I6IHRzLkRlY29yYXRvcik6IEltcG9ydHxudWxsIHtcbiAgLy8gTm90ZSB0aGF0IHRoaXMgZG9lcyBub3QgY292ZXIgdGhlIGVkZ2UgY2FzZSB3aGVyZSBkZWNvcmF0b3JzIGFyZSBjYWxsZWQgZnJvbVxuICAvLyBhIG5hbWVzcGFjZSBpbXBvcnQ6IGUuZy4gXCJAY29yZS5Db21wb25lbnQoKVwiLiBUaGlzIGlzIG5vdCBoYW5kbGVkIGJ5IE5ndHNjIGVpdGhlci5cbiAgaWYgKCF0cy5pc0NhbGxFeHByZXNzaW9uKGRlY29yYXRvci5leHByZXNzaW9uKSB8fFxuICAgICAgIXRzLmlzSWRlbnRpZmllcihkZWNvcmF0b3IuZXhwcmVzc2lvbi5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgaWRlbnRpZmllciA9IGRlY29yYXRvci5leHByZXNzaW9uLmV4cHJlc3Npb247XG4gIHJldHVybiBnZXRJbXBvcnRPZklkZW50aWZpZXIodHlwZUNoZWNrZXIsIGlkZW50aWZpZXIpO1xufVxuIl19