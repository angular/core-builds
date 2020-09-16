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
        define("@angular/core/schematics/migrations/renderer-to-renderer2/util", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNamedImports = exports.findRendererReferences = void 0;
    const ts = require("typescript");
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
        const forwardRefSpecifier = imports_1.getImportSpecifier(sourceFile, '@angular/core', 'forwardRef');
        ts.forEachChild(sourceFile, function visitNode(node) {
            if ((ts.isParameter(node) || ts.isPropertyDeclaration(node)) &&
                symbol_1.isReferenceToImport(typeChecker, node.name, rendererImportSpecifier)) {
                typedNodes.add(node);
            }
            else if (ts.isAsExpression(node) &&
                symbol_1.isReferenceToImport(typeChecker, node.type, rendererImportSpecifier)) {
                typedNodes.add(node);
            }
            else if (ts.isCallExpression(node)) {
                if (ts.isPropertyAccessExpression(node.expression) &&
                    symbol_1.isReferenceToImport(typeChecker, node.expression.expression, rendererImportSpecifier)) {
                    methodCalls.add(node);
                }
                else if (
                // If we're dealing with a forwardRef that's returning a Renderer.
                forwardRefSpecifier && ts.isIdentifier(node.expression) &&
                    symbol_1.isReferenceToImport(typeChecker, node.expression, forwardRefSpecifier) &&
                    node.arguments.length) {
                    const rendererIdentifier = findRendererIdentifierInForwardRef(typeChecker, node, rendererImportSpecifier);
                    if (rendererIdentifier) {
                        forwardRefs.add(rendererIdentifier);
                    }
                }
            }
            ts.forEachChild(node, visitNode);
        });
        return { typedNodes, methodCalls, forwardRefs };
    }
    exports.findRendererReferences = findRendererReferences;
    /** Gets the closest `NamedImports` to an `ImportSpecifier`. */
    function getNamedImports(specifier) {
        let current = specifier;
        while (current && !ts.isSourceFile(current)) {
            if (ts.isNamedImports(current)) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }
    exports.getNamedImports = getNamedImports;
    /** Finds the identifier referring to the `Renderer` inside a `forwardRef` call expression. */
    function findRendererIdentifierInForwardRef(typeChecker, node, rendererImport) {
        const firstArg = node.arguments[0];
        if (ts.isArrowFunction(firstArg) && rendererImport) {
            // Check if the function is `forwardRef(() => Renderer)`.
            if (ts.isIdentifier(firstArg.body) &&
                symbol_1.isReferenceToImport(typeChecker, firstArg.body, rendererImport)) {
                return firstArg.body;
            }
            else if (ts.isBlock(firstArg.body) && ts.isReturnStatement(firstArg.body.statements[0])) {
                // Otherwise check if the expression is `forwardRef(() => { return Renderer })`.
                const returnStatement = firstArg.body.statements[0];
                if (returnStatement.expression && ts.isIdentifier(returnStatement.expression) &&
                    symbol_1.isReferenceToImport(typeChecker, returnStatement.expression, rendererImport)) {
                    return returnStatement.expression;
                }
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JlbmRlcmVyLXRvLXJlbmRlcmVyMi91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywrRUFBa0U7SUFDbEUsNkVBQWtFO0lBRWxFOzs7T0FHRztJQUNILFNBQWdCLHNCQUFzQixDQUNsQyxVQUF5QixFQUFFLFdBQTJCLEVBQ3RELHVCQUEyQztRQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBa0UsQ0FBQztRQUM3RixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUNqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQUM3QyxNQUFNLG1CQUFtQixHQUFHLDRCQUFrQixDQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFMUYsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsU0FBUyxTQUFTLENBQUMsSUFBYTtZQUMxRCxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hELDRCQUFtQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLEVBQUU7Z0JBQ3hFLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEI7aUJBQU0sSUFDSCxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQztnQkFDdkIsNEJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtnQkFDeEUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENB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KlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtnZXRJbXBvcnRTcGVjaWZpZXJ9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5pbXBvcnQge2lzUmVmZXJlbmNlVG9JbXBvcnR9IGZyb20gJy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvc3ltYm9sJztcblxuLyoqXG4gKiBGaW5kcyB0eXBlZCBub2RlcyAoZS5nLiBmdW5jdGlvbiBwYXJhbWV0ZXJzIG9yIGNsYXNzIHByb3BlcnRpZXMpIHRoYXQgYXJlIHJlZmVyZW5jaW5nIHRoZSBvbGRcbiAqIGBSZW5kZXJlcmAsIGFzIHdlbGwgYXMgY2FsbHMgdG8gdGhlIGBSZW5kZXJlcmAgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRSZW5kZXJlclJlZmVyZW5jZXMoXG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgIHJlbmRlcmVySW1wb3J0U3BlY2lmaWVyOiB0cy5JbXBvcnRTcGVjaWZpZXIpIHtcbiAgY29uc3QgdHlwZWROb2RlcyA9IG5ldyBTZXQ8dHMuUGFyYW1ldGVyRGVjbGFyYXRpb258dHMuUHJvcGVydHlEZWNsYXJhdGlvbnx0cy5Bc0V4cHJlc3Npb24+KCk7XG4gIGNvbnN0IG1ldGhvZENhbGxzID0gbmV3IFNldDx0cy5DYWxsRXhwcmVzc2lvbj4oKTtcbiAgY29uc3QgZm9yd2FyZFJlZnMgPSBuZXcgU2V0PHRzLklkZW50aWZpZXI+KCk7XG4gIGNvbnN0IGZvcndhcmRSZWZTcGVjaWZpZXIgPSBnZXRJbXBvcnRTcGVjaWZpZXIoc291cmNlRmlsZSwgJ0Bhbmd1bGFyL2NvcmUnLCAnZm9yd2FyZFJlZicpO1xuXG4gIHRzLmZvckVhY2hDaGlsZChzb3VyY2VGaWxlLCBmdW5jdGlvbiB2aXNpdE5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGlmICgodHMuaXNQYXJhbWV0ZXIobm9kZSkgfHwgdHMuaXNQcm9wZXJ0eURlY2xhcmF0aW9uKG5vZGUpKSAmJlxuICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBub2RlLm5hbWUsIHJlbmRlcmVySW1wb3J0U3BlY2lmaWVyKSkge1xuICAgICAgdHlwZWROb2Rlcy5hZGQobm9kZSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgdHMuaXNBc0V4cHJlc3Npb24obm9kZSkgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS50eXBlLCByZW5kZXJlckltcG9ydFNwZWNpZmllcikpIHtcbiAgICAgIHR5cGVkTm9kZXMuYWRkKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAodHMuaXNDYWxsRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgaWYgKHRzLmlzUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBub2RlLmV4cHJlc3Npb24uZXhwcmVzc2lvbiwgcmVuZGVyZXJJbXBvcnRTcGVjaWZpZXIpKSB7XG4gICAgICAgIG1ldGhvZENhbGxzLmFkZChub2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgLy8gSWYgd2UncmUgZGVhbGluZyB3aXRoIGEgZm9yd2FyZFJlZiB0aGF0J3MgcmV0dXJuaW5nIGEgUmVuZGVyZXIuXG4gICAgICAgICAgZm9yd2FyZFJlZlNwZWNpZmllciAmJiB0cy5pc0lkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKSAmJlxuICAgICAgICAgIGlzUmVmZXJlbmNlVG9JbXBvcnQodHlwZUNoZWNrZXIsIG5vZGUuZXhwcmVzc2lvbiwgZm9yd2FyZFJlZlNwZWNpZmllcikgJiZcbiAgICAgICAgICBub2RlLmFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcmVuZGVyZXJJZGVudGlmaWVyID1cbiAgICAgICAgICAgIGZpbmRSZW5kZXJlcklkZW50aWZpZXJJbkZvcndhcmRSZWYodHlwZUNoZWNrZXIsIG5vZGUsIHJlbmRlcmVySW1wb3J0U3BlY2lmaWVyKTtcbiAgICAgICAgaWYgKHJlbmRlcmVySWRlbnRpZmllcikge1xuICAgICAgICAgIGZvcndhcmRSZWZzLmFkZChyZW5kZXJlcklkZW50aWZpZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIHZpc2l0Tm9kZSk7XG4gIH0pO1xuXG4gIHJldHVybiB7dHlwZWROb2RlcywgbWV0aG9kQ2FsbHMsIGZvcndhcmRSZWZzfTtcbn1cblxuLyoqIEdldHMgdGhlIGNsb3Nlc3QgYE5hbWVkSW1wb3J0c2AgdG8gYW4gYEltcG9ydFNwZWNpZmllcmAuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZWRJbXBvcnRzKHNwZWNpZmllcjogdHMuSW1wb3J0U3BlY2lmaWVyKTogdHMuTmFtZWRJbXBvcnRzfG51bGwge1xuICBsZXQgY3VycmVudDogdHMuTm9kZSA9IHNwZWNpZmllcjtcblxuICB3aGlsZSAoY3VycmVudCAmJiAhdHMuaXNTb3VyY2VGaWxlKGN1cnJlbnQpKSB7XG4gICAgaWYgKHRzLmlzTmFtZWRJbXBvcnRzKGN1cnJlbnQpKSB7XG4gICAgICByZXR1cm4gY3VycmVudDtcbiAgICB9XG4gICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBGaW5kcyB0aGUgaWRlbnRpZmllciByZWZlcnJpbmcgdG8gdGhlIGBSZW5kZXJlcmAgaW5zaWRlIGEgYGZvcndhcmRSZWZgIGNhbGwgZXhwcmVzc2lvbi4gKi9cbmZ1bmN0aW9uIGZpbmRSZW5kZXJlcklkZW50aWZpZXJJbkZvcndhcmRSZWYoXG4gICAgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLCBub2RlOiB0cy5DYWxsRXhwcmVzc2lvbixcbiAgICByZW5kZXJlckltcG9ydDogdHMuSW1wb3J0U3BlY2lmaWVyfG51bGwpOiB0cy5JZGVudGlmaWVyfG51bGwge1xuICBjb25zdCBmaXJzdEFyZyA9IG5vZGUuYXJndW1lbnRzWzBdO1xuXG4gIGlmICh0cy5pc0Fycm93RnVuY3Rpb24oZmlyc3RBcmcpICYmIHJlbmRlcmVySW1wb3J0KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGZ1bmN0aW9uIGlzIGBmb3J3YXJkUmVmKCgpID0+IFJlbmRlcmVyKWAuXG4gICAgaWYgKHRzLmlzSWRlbnRpZmllcihmaXJzdEFyZy5ib2R5KSAmJlxuICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBmaXJzdEFyZy5ib2R5LCByZW5kZXJlckltcG9ydCkpIHtcbiAgICAgIHJldHVybiBmaXJzdEFyZy5ib2R5O1xuICAgIH0gZWxzZSBpZiAodHMuaXNCbG9jayhmaXJzdEFyZy5ib2R5KSAmJiB0cy5pc1JldHVyblN0YXRlbWVudChmaXJzdEFyZy5ib2R5LnN0YXRlbWVudHNbMF0pKSB7XG4gICAgICAvLyBPdGhlcndpc2UgY2hlY2sgaWYgdGhlIGV4cHJlc3Npb24gaXMgYGZvcndhcmRSZWYoKCkgPT4geyByZXR1cm4gUmVuZGVyZXIgfSlgLlxuICAgICAgY29uc3QgcmV0dXJuU3RhdGVtZW50ID0gZmlyc3RBcmcuYm9keS5zdGF0ZW1lbnRzWzBdIGFzIHRzLlJldHVyblN0YXRlbWVudDtcblxuICAgICAgaWYgKHJldHVyblN0YXRlbWVudC5leHByZXNzaW9uICYmIHRzLmlzSWRlbnRpZmllcihyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCByZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbiwgcmVuZGVyZXJJbXBvcnQpKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==