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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/source_file_exports", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getExportSymbolsOfFile = void 0;
    const ts = require("typescript");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /** Computes the resolved exports of a given source file. */
    function getExportSymbolsOfFile(sf, typeChecker) {
        const exports = [];
        const resolvedExports = [];
        ts.forEachChild(sf, function visitNode(node) {
            if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) ||
                ts.isInterfaceDeclaration(node) &&
                    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0) {
                if (node.name) {
                    exports.push({ exportName: node.name.text, identifier: node.name });
                }
            }
            else if (ts.isVariableStatement(node)) {
                for (const decl of node.declarationList.declarations) {
                    visitNode(decl);
                }
            }
            else if (ts.isVariableDeclaration(node)) {
                if ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) != 0 &&
                    ts.isIdentifier(node.name)) {
                    exports.push({ exportName: node.name.text, identifier: node.name });
                }
            }
            else if (ts.isExportDeclaration(node)) {
                const { moduleSpecifier, exportClause } = node;
                if (!moduleSpecifier && exportClause && ts.isNamedExports(exportClause)) {
                    exportClause.elements.forEach(el => exports.push({
                        exportName: el.name.text,
                        identifier: el.propertyName ? el.propertyName : el.name
                    }));
                }
            }
        });
        exports.forEach(({ identifier, exportName }) => {
            const symbol = symbol_1.getValueSymbolOfDeclaration(identifier, typeChecker);
            if (symbol) {
                resolvedExports.push({ symbol, identifier, exportName });
            }
        });
        return resolvedExports;
    }
    exports.getExportSymbolsOfFile = getExportSymbolsOfFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2ZpbGVfZXhwb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3VuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaS9kZWNvcmF0b3JfcmV3cml0ZS9zb3VyY2VfZmlsZV9leHBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyw2RUFBNkU7SUFRN0UsNERBQTREO0lBQzVELFNBQWdCLHNCQUFzQixDQUNsQyxFQUFpQixFQUFFLFdBQTJCO1FBQ2hELE1BQU0sT0FBTyxHQUFzRCxFQUFFLENBQUM7UUFDdEUsTUFBTSxlQUFlLEdBQXFCLEVBQUUsQ0FBQztRQUU3QyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxTQUFTLFNBQVMsQ0FBQyxJQUFJO1lBQ3pDLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7Z0JBQzdELEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7b0JBQzNCLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQXNCLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDN0YsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDO2lCQUNuRTthQUNGO2lCQUFNLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFO29CQUNwRCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ2pCO2FBQ0Y7aUJBQU0sSUFBSSxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNsRSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUM7aUJBQ25FO2FBQ0Y7aUJBQU0sSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsZUFBZSxJQUFJLFlBQVksSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFO29CQUN2RSxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0JBQy9DLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7d0JBQ3hCLFVBQVUsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSTtxQkFDeEQsQ0FBQyxDQUFDLENBQUM7aUJBQ0w7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBQyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxNQUFNLEdBQUcsb0NBQTJCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3BFLElBQUksTUFBTSxFQUFFO2dCQUNWLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUM7YUFDeEQ7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sZUFBZSxDQUFDO0lBQ3pCLENBQUM7SUF4Q0Qsd0RBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0VmFsdWVTeW1ib2xPZkRlY2xhcmF0aW9ufSBmcm9tICcuLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWRFeHBvcnQge1xuICBzeW1ib2w6IHRzLlN5bWJvbDtcbiAgZXhwb3J0TmFtZTogc3RyaW5nO1xuICBpZGVudGlmaWVyOiB0cy5JZGVudGlmaWVyO1xufVxuXG4vKiogQ29tcHV0ZXMgdGhlIHJlc29sdmVkIGV4cG9ydHMgb2YgYSBnaXZlbiBzb3VyY2UgZmlsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHBvcnRTeW1ib2xzT2ZGaWxlKFxuICAgIHNmOiB0cy5Tb3VyY2VGaWxlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBSZXNvbHZlZEV4cG9ydFtdIHtcbiAgY29uc3QgZXhwb3J0czoge2V4cG9ydE5hbWU6IHN0cmluZywgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcn1bXSA9IFtdO1xuICBjb25zdCByZXNvbHZlZEV4cG9ydHM6IFJlc29sdmVkRXhwb3J0W10gPSBbXTtcblxuICB0cy5mb3JFYWNoQ2hpbGQoc2YsIGZ1bmN0aW9uIHZpc2l0Tm9kZShub2RlKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc0Z1bmN0aW9uRGVjbGFyYXRpb24obm9kZSkgfHxcbiAgICAgICAgdHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihub2RlKSAmJlxuICAgICAgICAgICAgKHRzLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlIGFzIHRzLkRlY2xhcmF0aW9uKSAmIHRzLk1vZGlmaWVyRmxhZ3MuRXhwb3J0KSAhPT0gMCkge1xuICAgICAgaWYgKG5vZGUubmFtZSkge1xuICAgICAgICBleHBvcnRzLnB1c2goe2V4cG9ydE5hbWU6IG5vZGUubmFtZS50ZXh0LCBpZGVudGlmaWVyOiBub2RlLm5hbWV9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgdmlzaXROb2RlKGRlY2wpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBpZiAoKHRzLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlKSAmIHRzLk1vZGlmaWVyRmxhZ3MuRXhwb3J0KSAhPSAwICYmXG4gICAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUubmFtZSkpIHtcbiAgICAgICAgZXhwb3J0cy5wdXNoKHtleHBvcnROYW1lOiBub2RlLm5hbWUudGV4dCwgaWRlbnRpZmllcjogbm9kZS5uYW1lfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc0V4cG9ydERlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBjb25zdCB7bW9kdWxlU3BlY2lmaWVyLCBleHBvcnRDbGF1c2V9ID0gbm9kZTtcbiAgICAgIGlmICghbW9kdWxlU3BlY2lmaWVyICYmIGV4cG9ydENsYXVzZSAmJiB0cy5pc05hbWVkRXhwb3J0cyhleHBvcnRDbGF1c2UpKSB7XG4gICAgICAgIGV4cG9ydENsYXVzZS5lbGVtZW50cy5mb3JFYWNoKGVsID0+IGV4cG9ydHMucHVzaCh7XG4gICAgICAgICAgZXhwb3J0TmFtZTogZWwubmFtZS50ZXh0LFxuICAgICAgICAgIGlkZW50aWZpZXI6IGVsLnByb3BlcnR5TmFtZSA/IGVsLnByb3BlcnR5TmFtZSA6IGVsLm5hbWVcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgZXhwb3J0cy5mb3JFYWNoKCh7aWRlbnRpZmllciwgZXhwb3J0TmFtZX0pID0+IHtcbiAgICBjb25zdCBzeW1ib2wgPSBnZXRWYWx1ZVN5bWJvbE9mRGVjbGFyYXRpb24oaWRlbnRpZmllciwgdHlwZUNoZWNrZXIpO1xuICAgIGlmIChzeW1ib2wpIHtcbiAgICAgIHJlc29sdmVkRXhwb3J0cy5wdXNoKHtzeW1ib2wsIGlkZW50aWZpZXIsIGV4cG9ydE5hbWV9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByZXNvbHZlZEV4cG9ydHM7XG59XG4iXX0=