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
        define("@angular/core/schematics/migrations/renderer-to-renderer2/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findRendererReferences = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /**
     * Finds typed nodes (e.g. function parameters or class properties) that are referencing the old
     * `Renderer`, as well as calls to the `Renderer` methods.
     */
    function findRendererReferences(sourceFile, typeChecker, rendererImportSpecifier) {
        const typedNodes = new Set();
        const methodCalls = new Set();
        const forwardRefs = new Set();
        const forwardRefSpecifier = (0, imports_1.getImportSpecifier)(sourceFile, '@angular/core', 'forwardRef');
        typescript_1.default.forEachChild(sourceFile, function visitNode(node) {
            if ((typescript_1.default.isParameter(node) || typescript_1.default.isPropertyDeclaration(node)) &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.name, rendererImportSpecifier)) {
                typedNodes.add(node);
            }
            else if (typescript_1.default.isAsExpression(node) &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.type, rendererImportSpecifier)) {
                typedNodes.add(node);
            }
            else if (typescript_1.default.isCallExpression(node)) {
                if (typescript_1.default.isPropertyAccessExpression(node.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, node.expression.expression, rendererImportSpecifier)) {
                    methodCalls.add(node);
                }
                else if (
                // If we're dealing with a forwardRef that's returning a Renderer.
                forwardRefSpecifier && typescript_1.default.isIdentifier(node.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, forwardRefSpecifier) &&
                    node.arguments.length) {
                    const rendererIdentifier = findRendererIdentifierInForwardRef(typeChecker, node, rendererImportSpecifier);
                    if (rendererIdentifier) {
                        forwardRefs.add(rendererIdentifier);
                    }
                }
            }
            typescript_1.default.forEachChild(node, visitNode);
        });
        return { typedNodes, methodCalls, forwardRefs };
    }
    exports.findRendererReferences = findRendererReferences;
    /** Finds the identifier referring to the `Renderer` inside a `forwardRef` call expression. */
    function findRendererIdentifierInForwardRef(typeChecker, node, rendererImport) {
        const firstArg = node.arguments[0];
        if (typescript_1.default.isArrowFunction(firstArg) && rendererImport) {
            // Check if the function is `forwardRef(() => Renderer)`.
            if (typescript_1.default.isIdentifier(firstArg.body) &&
                (0, symbol_1.isReferenceToImport)(typeChecker, firstArg.body, rendererImport)) {
                return firstArg.body;
            }
            else if (typescript_1.default.isBlock(firstArg.body) && typescript_1.default.isReturnStatement(firstArg.body.statements[0])) {
                // Otherwise check if the expression is `forwardRef(() => { return Renderer })`.
                const returnStatement = firstArg.body.statements[0];
                if (returnStatement.expression && typescript_1.default.isIdentifier(returnStatement.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, returnStatement.expression, rendererImport)) {
                    return returnStatement.expression;
                }
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JlbmRlcmVyLXRvLXJlbmRlcmVyMi91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUU1QiwrRUFBa0U7SUFDbEUsNkVBQWtFO0lBRWxFOzs7T0FHRztJQUNILFNBQWdCLHNCQUFzQixDQUNsQyxVQUF5QixFQUFFLFdBQTJCLEVBQ3RELHVCQUEyQztRQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBa0UsQ0FBQztRQUM3RixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUNqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQUM3QyxNQUFNLG1CQUFtQixHQUFHLElBQUEsNEJBQWtCLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUUxRixvQkFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsU0FBUyxTQUFTLENBQUMsSUFBYTtZQUMxRCxJQUFJLENBQUMsb0JBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEQsSUFBQSw0QkFBbUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxFQUFFO2dCQUN4RSxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3RCO2lCQUFNLElBQ0gsb0JBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO2dCQUN2QixJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLEVBQUU7Z0JBQ3hFLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEI7aUJBQU0sSUFBSSxvQkFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNwQyxJQUFJLG9CQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDOUMsSUFBQSw0QkFBbUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtvQkFDekYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDdkI7cUJBQU07Z0JBQ0gsa0VBQWtFO2dCQUNsRSxtQkFBbUIsSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO29CQUN2RCxJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDO29CQUN0RSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtvQkFDekIsTUFBTSxrQkFBa0IsR0FDcEIsa0NBQWtDLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO29CQUNuRixJQUFJLGtCQUFrQixFQUFFO3dCQUN0QixXQUFXLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7cUJBQ3JDO2lCQUNGO2FBQ0Y7WUFFRCxvQkFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUMsQ0FBQztJQUNoRCxDQUFDO0lBckNELHdEQXFDQztJQUVELDhGQUE4RjtJQUM5RixTQUFTLGtDQUFrQyxDQUN2QyxXQUEyQixFQUFFLElBQXVCLEVBQ3BELGNBQXVDO1FBQ3pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbkMsSUFBSSxvQkFBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxjQUFjLEVBQUU7WUFDbEQseURBQXlEO1lBQ3pELElBQUksb0JBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDOUIsSUFBQSw0QkFBbUIsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsRUFBRTtnQkFDbkUsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO2FBQ3RCO2lCQUFNLElBQUksb0JBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFFLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDekYsZ0ZBQWdGO2dCQUNoRixNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQXVCLENBQUM7Z0JBRTFFLElBQUksZUFBZSxDQUFDLFVBQVUsSUFBSSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDO29CQUN6RSxJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxFQUFFO29CQUNoRixPQUFPLGVBQWUsQ0FBQyxVQUFVLENBQUM7aUJBQ25DO2FBQ0Y7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7Z2V0SW1wb3J0U3BlY2lmaWVyfSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L2ltcG9ydHMnO1xuaW1wb3J0IHtpc1JlZmVyZW5jZVRvSW1wb3J0fSBmcm9tICcuLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbi8qKlxuICogRmluZHMgdHlwZWQgbm9kZXMgKGUuZy4gZnVuY3Rpb24gcGFyYW1ldGVycyBvciBjbGFzcyBwcm9wZXJ0aWVzKSB0aGF0IGFyZSByZWZlcmVuY2luZyB0aGUgb2xkXG4gKiBgUmVuZGVyZXJgLCBhcyB3ZWxsIGFzIGNhbGxzIHRvIHRoZSBgUmVuZGVyZXJgIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUmVuZGVyZXJSZWZlcmVuY2VzKFxuICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlcixcbiAgICByZW5kZXJlckltcG9ydFNwZWNpZmllcjogdHMuSW1wb3J0U3BlY2lmaWVyKSB7XG4gIGNvbnN0IHR5cGVkTm9kZXMgPSBuZXcgU2V0PHRzLlBhcmFtZXRlckRlY2xhcmF0aW9ufHRzLlByb3BlcnR5RGVjbGFyYXRpb258dHMuQXNFeHByZXNzaW9uPigpO1xuICBjb25zdCBtZXRob2RDYWxscyA9IG5ldyBTZXQ8dHMuQ2FsbEV4cHJlc3Npb24+KCk7XG4gIGNvbnN0IGZvcndhcmRSZWZzID0gbmV3IFNldDx0cy5JZGVudGlmaWVyPigpO1xuICBjb25zdCBmb3J3YXJkUmVmU3BlY2lmaWVyID0gZ2V0SW1wb3J0U3BlY2lmaWVyKHNvdXJjZUZpbGUsICdAYW5ndWxhci9jb3JlJywgJ2ZvcndhcmRSZWYnKTtcblxuICB0cy5mb3JFYWNoQ2hpbGQoc291cmNlRmlsZSwgZnVuY3Rpb24gdmlzaXROb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAoKHRzLmlzUGFyYW1ldGVyKG5vZGUpIHx8IHRzLmlzUHJvcGVydHlEZWNsYXJhdGlvbihub2RlKSkgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5uYW1lLCByZW5kZXJlckltcG9ydFNwZWNpZmllcikpIHtcbiAgICAgIHR5cGVkTm9kZXMuYWRkKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHRzLmlzQXNFeHByZXNzaW9uKG5vZGUpICYmXG4gICAgICAgIGlzUmVmZXJlbmNlVG9JbXBvcnQodHlwZUNoZWNrZXIsIG5vZGUudHlwZSwgcmVuZGVyZXJJbXBvcnRTcGVjaWZpZXIpKSB7XG4gICAgICB0eXBlZE5vZGVzLmFkZChub2RlKTtcbiAgICB9IGVsc2UgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24obm9kZSkpIHtcbiAgICAgIGlmICh0cy5pc1Byb3BlcnR5QWNjZXNzRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLmV4cHJlc3Npb24sIHJlbmRlcmVySW1wb3J0U3BlY2lmaWVyKSkge1xuICAgICAgICBtZXRob2RDYWxscy5hZGQobm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCBhIGZvcndhcmRSZWYgdGhhdCdzIHJldHVybmluZyBhIFJlbmRlcmVyLlxuICAgICAgICAgIGZvcndhcmRSZWZTcGVjaWZpZXIgJiYgdHMuaXNJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24sIGZvcndhcmRSZWZTcGVjaWZpZXIpICYmXG4gICAgICAgICAgbm9kZS5hcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHJlbmRlcmVySWRlbnRpZmllciA9XG4gICAgICAgICAgICBmaW5kUmVuZGVyZXJJZGVudGlmaWVySW5Gb3J3YXJkUmVmKHR5cGVDaGVja2VyLCBub2RlLCByZW5kZXJlckltcG9ydFNwZWNpZmllcik7XG4gICAgICAgIGlmIChyZW5kZXJlcklkZW50aWZpZXIpIHtcbiAgICAgICAgICBmb3J3YXJkUmVmcy5hZGQocmVuZGVyZXJJZGVudGlmaWVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUpO1xuICB9KTtcblxuICByZXR1cm4ge3R5cGVkTm9kZXMsIG1ldGhvZENhbGxzLCBmb3J3YXJkUmVmc307XG59XG5cbi8qKiBGaW5kcyB0aGUgaWRlbnRpZmllciByZWZlcnJpbmcgdG8gdGhlIGBSZW5kZXJlcmAgaW5zaWRlIGEgYGZvcndhcmRSZWZgIGNhbGwgZXhwcmVzc2lvbi4gKi9cbmZ1bmN0aW9uIGZpbmRSZW5kZXJlcklkZW50aWZpZXJJbkZvcndhcmRSZWYoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5DYWxsRXhwcmVzc2lvbixcbiAgICByZW5kZXJlckltcG9ydDogdHMuSW1wb3J0U3BlY2lmaWVyfG51bGwpOiB0cy5JZGVudGlmaWVyfG51bGwge1xuICBjb25zdCBmaXJzdEFyZyA9IG5vZGUuYXJndW1lbnRzWzBdO1xuXG4gIGlmICh0cy5pc0Fycm93RnVuY3Rpb24oZmlyc3RBcmcpICYmIHJlbmRlcmVySW1wb3J0KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGZ1bmN0aW9uIGlzIGBmb3J3YXJkUmVmKCgpID0+IFJlbmRlcmVyKWAuXG4gICAgaWYgKHRzLmlzSWRlbnRpZmllcihmaXJzdEFyZy5ib2R5KSAmJlxuICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBmaXJzdEFyZy5ib2R5LCByZW5kZXJlckltcG9ydCkpIHtcbiAgICAgIHJldHVybiBmaXJzdEFyZy5ib2R5O1xuICAgIH0gZWxzZSBpZiAodHMuaXNCbG9jayhmaXJzdEFyZy5ib2R5KSAmJiB0cy5pc1JldHVyblN0YXRlbWVudChmaXJzdEFyZy5ib2R5LnN0YXRlbWVudHNbMF0pKSB7XG4gICAgICAvLyBPdGhlcndpc2UgY2hlY2sgaWYgdGhlIGV4cHJlc3Npb24gaXMgYGZvcndhcmRSZWYoKCkgPT4geyByZXR1cm4gUmVuZGVyZXIgfSlgLlxuICAgICAgY29uc3QgcmV0dXJuU3RhdGVtZW50ID0gZmlyc3RBcmcuYm9keS5zdGF0ZW1lbnRzWzBdIGFzIHRzLlJldHVyblN0YXRlbWVudDtcblxuICAgICAgaWYgKHJldHVyblN0YXRlbWVudC5leHByZXNzaW9uICYmIHRzLmlzSWRlbnRpZmllcihyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCByZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbiwgcmVuZGVyZXJJbXBvcnQpKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==