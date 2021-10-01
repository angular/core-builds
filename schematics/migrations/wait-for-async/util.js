/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
    const typescript_1 = __importDefault(require("typescript"));
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /** Finds calls to the `async` function. */
    function findAsyncReferences(sourceFile, typeChecker, asyncImportSpecifier) {
        const results = new Set();
        typescript_1.default.forEachChild(sourceFile, function visitNode(node) {
            if (typescript_1.default.isCallExpression(node) && typescript_1.default.isIdentifier(node.expression) &&
                node.expression.text === 'async' &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, asyncImportSpecifier)) {
                results.add(node.expression);
            }
            typescript_1.default.forEachChild(node, visitNode);
        });
        return results;
    }
    exports.findAsyncReferences = findAsyncReferences;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3dhaXQtZm9yLWFzeW5jL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsNERBQTRCO0lBRTVCLDZFQUFrRTtJQUVsRSwyQ0FBMkM7SUFDM0MsU0FBZ0IsbUJBQW1CLENBQy9CLFVBQXlCLEVBQUUsV0FBMkIsRUFDdEQsb0JBQXdDO1FBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFpQixDQUFDO1FBRXpDLG9CQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxTQUFTLFNBQVMsQ0FBQyxJQUFhO1lBQzFELElBQUksb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM3RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxPQUFPO2dCQUNoQyxJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDLEVBQUU7Z0JBQzNFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQzlCO1lBRUQsb0JBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQWhCRCxrREFnQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2lzUmVmZXJlbmNlVG9JbXBvcnR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvc3ltYm9sJztcblxuLyoqIEZpbmRzIGNhbGxzIHRvIHRoZSBgYXN5bmNgIGZ1bmN0aW9uLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBc3luY1JlZmVyZW5jZXMoXG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgIGFzeW5jSW1wb3J0U3BlY2lmaWVyOiB0cy5JbXBvcnRTcGVjaWZpZXIpIHtcbiAgY29uc3QgcmVzdWx0cyA9IG5ldyBTZXQ8dHMuSWRlbnRpZmllcj4oKTtcblxuICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgZnVuY3Rpb24gdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSAmJiB0cy5pc0lkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKSAmJlxuICAgICAgICBub2RlLmV4cHJlc3Npb24udGV4dCA9PT0gJ2FzeW5jJyAmJlxuICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24sIGFzeW5jSW1wb3J0U3BlY2lmaWVyKSkge1xuICAgICAgcmVzdWx0cy5hZGQobm9kZS5leHByZXNzaW9uKTtcbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG4iXX0=