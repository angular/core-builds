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
    exports.findRendererReferences = void 0;
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
        const forwardRefSpecifier = (0, imports_1.getImportSpecifier)(sourceFile, '@angular/core', 'forwardRef');
        ts.forEachChild(sourceFile, function visitNode(node) {
            if ((ts.isParameter(node) || ts.isPropertyDeclaration(node)) &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.name, rendererImportSpecifier)) {
                typedNodes.add(node);
            }
            else if (ts.isAsExpression(node) &&
                (0, symbol_1.isReferenceToImport)(typeChecker, node.type, rendererImportSpecifier)) {
                typedNodes.add(node);
            }
            else if (ts.isCallExpression(node)) {
                if (ts.isPropertyAccessExpression(node.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, node.expression.expression, rendererImportSpecifier)) {
                    methodCalls.add(node);
                }
                else if (
                // If we're dealing with a forwardRef that's returning a Renderer.
                forwardRefSpecifier && ts.isIdentifier(node.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, node.expression, forwardRefSpecifier) &&
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
    /** Finds the identifier referring to the `Renderer` inside a `forwardRef` call expression. */
    function findRendererIdentifierInForwardRef(typeChecker, node, rendererImport) {
        const firstArg = node.arguments[0];
        if (ts.isArrowFunction(firstArg) && rendererImport) {
            // Check if the function is `forwardRef(() => Renderer)`.
            if (ts.isIdentifier(firstArg.body) &&
                (0, symbol_1.isReferenceToImport)(typeChecker, firstArg.body, rendererImport)) {
                return firstArg.body;
            }
            else if (ts.isBlock(firstArg.body) && ts.isReturnStatement(firstArg.body.statements[0])) {
                // Otherwise check if the expression is `forwardRef(() => { return Renderer })`.
                const returnStatement = firstArg.body.statements[0];
                if (returnStatement.expression && ts.isIdentifier(returnStatement.expression) &&
                    (0, symbol_1.isReferenceToImport)(typeChecker, returnStatement.expression, rendererImport)) {
                    return returnStatement.expression;
                }
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3JlbmRlcmVyLXRvLXJlbmRlcmVyMi91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUVqQywrRUFBa0U7SUFDbEUsNkVBQWtFO0lBRWxFOzs7T0FHRztJQUNILFNBQWdCLHNCQUFzQixDQUNsQyxVQUF5QixFQUFFLFdBQTJCLEVBQ3RELHVCQUEyQztRQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBa0UsQ0FBQztRQUM3RixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUNqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBaUIsQ0FBQztRQUM3QyxNQUFNLG1CQUFtQixHQUFHLElBQUEsNEJBQWtCLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUUxRixFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxTQUFTLFNBQVMsQ0FBQyxJQUFhO1lBQzFELElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEQsSUFBQSw0QkFBbUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSx1QkFBdUIsQ0FBQyxFQUFFO2dCQUN4RSxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3RCO2lCQUFNLElBQ0gsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7Z0JBQ3ZCLElBQUEsNEJBQW1CLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtnQkFDeEUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDcEMsSUFBSSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztvQkFDOUMsSUFBQSw0QkFBbUIsRUFBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsdUJBQXVCLENBQUMsRUFBRTtvQkFDekYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDdkI7cUJBQU07Z0JBQ0gsa0VBQWtFO2dCQUNsRSxtQkFBbUIsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBQ3ZELElBQUEsNEJBQW1CLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUM7b0JBQ3RFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO29CQUN6QixNQUFNLGtCQUFrQixHQUNwQixrQ0FBa0MsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7b0JBQ25GLElBQUksa0JBQWtCLEVBQUU7d0JBQ3RCLFdBQVcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztxQkFDckM7aUJBQ0Y7YUFDRjtZQUVELEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFDLENBQUM7SUFDaEQsQ0FBQztJQXJDRCx3REFxQ0M7SUFFRCw4RkFBOEY7SUFDOUYsU0FBUyxrQ0FBa0MsQ0FDdkMsV0FBMkIsRUFBRSxJQUF1QixFQUNwRCxjQUF1QztRQUN6QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRW5DLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxjQUFjLEVBQUU7WUFDbEQseURBQXlEO1lBQ3pELElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUM5QixJQUFBLDRCQUFtQixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxFQUFFO2dCQUNuRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7YUFDdEI7aUJBQU0sSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDekYsZ0ZBQWdGO2dCQUNoRixNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQXVCLENBQUM7Z0JBRTFFLElBQUksZUFBZSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUM7b0JBQ3pFLElBQUEsNEJBQW1CLEVBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLEVBQUU7b0JBQ2hGLE9BQU8sZUFBZSxDQUFDLFVBQVUsQ0FBQztpQkFDbkM7YUFDRjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2dldEltcG9ydFNwZWNpZmllcn0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9pbXBvcnRzJztcbmltcG9ydCB7aXNSZWZlcmVuY2VUb0ltcG9ydH0gZnJvbSAnLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9zeW1ib2wnO1xuXG4vKipcbiAqIEZpbmRzIHR5cGVkIG5vZGVzIChlLmcuIGZ1bmN0aW9uIHBhcmFtZXRlcnMgb3IgY2xhc3MgcHJvcGVydGllcykgdGhhdCBhcmUgcmVmZXJlbmNpbmcgdGhlIG9sZFxuICogYFJlbmRlcmVyYCwgYXMgd2VsbCBhcyBjYWxscyB0byB0aGUgYFJlbmRlcmVyYCBtZXRob2RzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZFJlbmRlcmVyUmVmZXJlbmNlcyhcbiAgICBzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIsXG4gICAgcmVuZGVyZXJJbXBvcnRTcGVjaWZpZXI6IHRzLkltcG9ydFNwZWNpZmllcikge1xuICBjb25zdCB0eXBlZE5vZGVzID0gbmV3IFNldDx0cy5QYXJhbWV0ZXJEZWNsYXJhdGlvbnx0cy5Qcm9wZXJ0eURlY2xhcmF0aW9ufHRzLkFzRXhwcmVzc2lvbj4oKTtcbiAgY29uc3QgbWV0aG9kQ2FsbHMgPSBuZXcgU2V0PHRzLkNhbGxFeHByZXNzaW9uPigpO1xuICBjb25zdCBmb3J3YXJkUmVmcyA9IG5ldyBTZXQ8dHMuSWRlbnRpZmllcj4oKTtcbiAgY29uc3QgZm9yd2FyZFJlZlNwZWNpZmllciA9IGdldEltcG9ydFNwZWNpZmllcihzb3VyY2VGaWxlLCAnQGFuZ3VsYXIvY29yZScsICdmb3J3YXJkUmVmJyk7XG5cbiAgdHMuZm9yRWFjaENoaWxkKHNvdXJjZUZpbGUsIGZ1bmN0aW9uIHZpc2l0Tm9kZShub2RlOiB0cy5Ob2RlKSB7XG4gICAgaWYgKCh0cy5pc1BhcmFtZXRlcihub2RlKSB8fCB0cy5pc1Byb3BlcnR5RGVjbGFyYXRpb24obm9kZSkpICYmXG4gICAgICAgIGlzUmVmZXJlbmNlVG9JbXBvcnQodHlwZUNoZWNrZXIsIG5vZGUubmFtZSwgcmVuZGVyZXJJbXBvcnRTcGVjaWZpZXIpKSB7XG4gICAgICB0eXBlZE5vZGVzLmFkZChub2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICB0cy5pc0FzRXhwcmVzc2lvbihub2RlKSAmJlxuICAgICAgICBpc1JlZmVyZW5jZVRvSW1wb3J0KHR5cGVDaGVja2VyLCBub2RlLnR5cGUsIHJlbmRlcmVySW1wb3J0U3BlY2lmaWVyKSkge1xuICAgICAgdHlwZWROb2Rlcy5hZGQobm9kZSk7XG4gICAgfSBlbHNlIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICBpZiAodHMuaXNQcm9wZXJ0eUFjY2Vzc0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSAmJlxuICAgICAgICAgIGlzUmVmZXJlbmNlVG9JbXBvcnQodHlwZUNoZWNrZXIsIG5vZGUuZXhwcmVzc2lvbi5leHByZXNzaW9uLCByZW5kZXJlckltcG9ydFNwZWNpZmllcikpIHtcbiAgICAgICAgbWV0aG9kQ2FsbHMuYWRkKG5vZGUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAvLyBJZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBmb3J3YXJkUmVmIHRoYXQncyByZXR1cm5pbmcgYSBSZW5kZXJlci5cbiAgICAgICAgICBmb3J3YXJkUmVmU3BlY2lmaWVyICYmIHRzLmlzSWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgbm9kZS5leHByZXNzaW9uLCBmb3J3YXJkUmVmU3BlY2lmaWVyKSAmJlxuICAgICAgICAgIG5vZGUuYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCByZW5kZXJlcklkZW50aWZpZXIgPVxuICAgICAgICAgICAgZmluZFJlbmRlcmVySWRlbnRpZmllckluRm9yd2FyZFJlZih0eXBlQ2hlY2tlciwgbm9kZSwgcmVuZGVyZXJJbXBvcnRTcGVjaWZpZXIpO1xuICAgICAgICBpZiAocmVuZGVyZXJJZGVudGlmaWVyKSB7XG4gICAgICAgICAgZm9yd2FyZFJlZnMuYWRkKHJlbmRlcmVySWRlbnRpZmllcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cy5mb3JFYWNoQ2hpbGQobm9kZSwgdmlzaXROb2RlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHt0eXBlZE5vZGVzLCBtZXRob2RDYWxscywgZm9yd2FyZFJlZnN9O1xufVxuXG4vKiogRmluZHMgdGhlIGlkZW50aWZpZXIgcmVmZXJyaW5nIHRvIHRoZSBgUmVuZGVyZXJgIGluc2lkZSBhIGBmb3J3YXJkUmVmYCBjYWxsIGV4cHJlc3Npb24uICovXG5mdW5jdGlvbiBmaW5kUmVuZGVyZXJJZGVudGlmaWVySW5Gb3J3YXJkUmVmKFxuICAgIHR5cGVDaGVja2VyOiB0cy5UeXBlQ2hlY2tlciwgbm9kZTogdHMuQ2FsbEV4cHJlc3Npb24sXG4gICAgcmVuZGVyZXJJbXBvcnQ6IHRzLkltcG9ydFNwZWNpZmllcnxudWxsKTogdHMuSWRlbnRpZmllcnxudWxsIHtcbiAgY29uc3QgZmlyc3RBcmcgPSBub2RlLmFyZ3VtZW50c1swXTtcblxuICBpZiAodHMuaXNBcnJvd0Z1bmN0aW9uKGZpcnN0QXJnKSAmJiByZW5kZXJlckltcG9ydCkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBmdW5jdGlvbiBpcyBgZm9yd2FyZFJlZigoKSA9PiBSZW5kZXJlcilgLlxuICAgIGlmICh0cy5pc0lkZW50aWZpZXIoZmlyc3RBcmcuYm9keSkgJiZcbiAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgZmlyc3RBcmcuYm9keSwgcmVuZGVyZXJJbXBvcnQpKSB7XG4gICAgICByZXR1cm4gZmlyc3RBcmcuYm9keTtcbiAgICB9IGVsc2UgaWYgKHRzLmlzQmxvY2soZmlyc3RBcmcuYm9keSkgJiYgdHMuaXNSZXR1cm5TdGF0ZW1lbnQoZmlyc3RBcmcuYm9keS5zdGF0ZW1lbnRzWzBdKSkge1xuICAgICAgLy8gT3RoZXJ3aXNlIGNoZWNrIGlmIHRoZSBleHByZXNzaW9uIGlzIGBmb3J3YXJkUmVmKCgpID0+IHsgcmV0dXJuIFJlbmRlcmVyIH0pYC5cbiAgICAgIGNvbnN0IHJldHVyblN0YXRlbWVudCA9IGZpcnN0QXJnLmJvZHkuc3RhdGVtZW50c1swXSBhcyB0cy5SZXR1cm5TdGF0ZW1lbnQ7XG5cbiAgICAgIGlmIChyZXR1cm5TdGF0ZW1lbnQuZXhwcmVzc2lvbiAmJiB0cy5pc0lkZW50aWZpZXIocmV0dXJuU3RhdGVtZW50LmV4cHJlc3Npb24pICYmXG4gICAgICAgICAgaXNSZWZlcmVuY2VUb0ltcG9ydCh0eXBlQ2hlY2tlciwgcmV0dXJuU3RhdGVtZW50LmV4cHJlc3Npb24sIHJlbmRlcmVySW1wb3J0KSkge1xuICAgICAgICByZXR1cm4gcmV0dXJuU3RhdGVtZW50LmV4cHJlc3Npb247XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG4iXX0=