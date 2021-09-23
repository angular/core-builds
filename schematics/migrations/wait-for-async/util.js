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
        define("@angular/core/schematics/migrations/wait-for-async/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findAsyncReferences = void 0;
    const ts = require("typescript");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /** Finds calls to the `async` function. */
    function findAsyncReferences(sourceFile, typeChecker, asyncImportSpecifier) {
        const results = new Set();
        ts.forEachChild(sourceFile, function visitNode(node) {
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
                node.expression.text === 'async' &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, asyncImportSpecifier)) {
                results.add(node.expression);
            }
            ts.forEachChild(node, visitNode);
        });
        return results;
    }
    exports.findAsyncReferences = findAsyncReferences;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3dhaXQtZm9yLWFzeW5jL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsaUNBQWlDO0lBRWpDLDZFQUFrRTtJQUVsRSwyQ0FBMkM7SUFDM0MsU0FBZ0IsbUJBQW1CLENBQy9CLFVBQXlCLEVBQUUsV0FBMkIsRUFDdEQsb0JBQXdDO1FBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1FBRXpDLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFNBQVMsU0FBUyxDQUFDLElBQWE7WUFDMUQsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM3RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxPQUFPO2dCQUNoQyxJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLEVBQUU7Z0JBQzNFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQzlCO1lBRUQsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBaEJELGtEQWdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtpc1JlZmVyZW5jZVRvSW1wb3J0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbi8qKiBGaW5kcyBjYWxscyB0byB0aGUgYGFzeW5jYCBmdW5jdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQXN5bmNSZWZlcmVuY2VzKFxuICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICBhc3luY0ltcG9ydFNwZWNpZmllcjogdHMuSW1wb3J0U3BlY2lmaWVyKSB7XG4gIGNvbnN0IHJlc3VsdHMgPSBuZXcgU2V0PHRzLklkZW50aWZpZXI+KCk7XG5cbiAgdHMuZm9yRWFjaENoaWxkKHNvdXJjZUZpbGUsIGZ1bmN0aW9uIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgbm9kZS5leHByZXNzaW9uLnRleHQgPT09ICdhc3luYycgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCBhc3luY0ltcG9ydFNwZWNpZmllcikpIHtcbiAgICAgIHJlc3VsdHMuYWRkKG5vZGUuZXhwcmVzc2lvbik7XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIHZpc2l0Tm9kZSk7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHRzO1xufVxuIl19