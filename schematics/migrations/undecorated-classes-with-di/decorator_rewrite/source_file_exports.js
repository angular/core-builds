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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/source_file_exports", ["require", "exports", "typescript", "@angular/core/schematics/utils/typescript/symbol"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getExportSymbolsOfFile = void 0;
    const typescript_1 = __importDefault(require("typescript"));
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    /** Computes the resolved exports of a given source file. */
    function getExportSymbolsOfFile(sf, typeChecker) {
        const exports = [];
        const resolvedExports = [];
        typescript_1.default.forEachChild(sf, function visitNode(node) {
            if (typescript_1.default.isClassDeclaration(node) || typescript_1.default.isFunctionDeclaration(node) ||
                typescript_1.default.isInterfaceDeclaration(node) &&
                    (typescript_1.default.getCombinedModifierFlags(node) & typescript_1.default.ModifierFlags.Export) !== 0) {
                if (node.name) {
                    exports.push({ exportName: node.name.text, identifier: node.name });
                }
            }
            else if (typescript_1.default.isVariableStatement(node)) {
                for (const decl of node.declarationList.declarations) {
                    visitNode(decl);
                }
            }
            else if (typescript_1.default.isVariableDeclaration(node)) {
                if ((typescript_1.default.getCombinedModifierFlags(node) & typescript_1.default.ModifierFlags.Export) != 0 &&
                    typescript_1.default.isIdentifier(node.name)) {
                    exports.push({ exportName: node.name.text, identifier: node.name });
                }
            }
            else if (typescript_1.default.isExportDeclaration(node)) {
                const { moduleSpecifier, exportClause } = node;
                if (!moduleSpecifier && exportClause && typescript_1.default.isNamedExports(exportClause)) {
                    exportClause.elements.forEach(el => exports.push({
                        exportName: el.name.text,
                        identifier: el.propertyName ? el.propertyName : el.name
                    }));
                }
            }
        });
        exports.forEach(({ identifier, exportName }) => {
            const symbol = (0, symbol_1.getValueSymbolOfDeclaration)(identifier, typeChecker);
            if (symbol) {
                resolvedExports.push({ symbol, identifier, exportName });
            }
        });
        return resolvedExports;
    }
    exports.getExportSymbolsOfFile = getExportSymbolsOfFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2ZpbGVfZXhwb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3VuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaS9kZWNvcmF0b3JfcmV3cml0ZS9zb3VyY2VfZmlsZV9leHBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7OztJQUVILDREQUE0QjtJQUM1Qiw2RUFBNkU7SUFRN0UsNERBQTREO0lBQzVELFNBQWdCLHNCQUFzQixDQUNsQyxFQUFpQixFQUFFLFdBQTJCO1FBQ2hELE1BQU0sT0FBTyxHQUFzRCxFQUFFLENBQUM7UUFDdEUsTUFBTSxlQUFlLEdBQXFCLEVBQUUsQ0FBQztRQUU3QyxvQkFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsU0FBUyxTQUFTLENBQUMsSUFBSTtZQUN6QyxJQUFJLG9CQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksb0JBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7Z0JBQzdELG9CQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDO29CQUMzQixDQUFDLG9CQUFFLENBQUMsd0JBQXdCLENBQUMsSUFBc0IsQ0FBQyxHQUFHLG9CQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDN0YsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDO2lCQUNuRTthQUNGO2lCQUFNLElBQUksb0JBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkMsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRTtvQkFDcEQsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNqQjthQUNGO2lCQUFNLElBQUksb0JBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekMsSUFBSSxDQUFDLG9CQUFFLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDbEUsb0JBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUM5QixPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztpQkFDbkU7YUFDRjtpQkFBTSxJQUFJLG9CQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsZUFBZSxJQUFJLFlBQVksSUFBSSxvQkFBRSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDdkUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO3dCQUMvQyxVQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJO3dCQUN4QixVQUFVLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUk7cUJBQ3hELENBQUMsQ0FBQyxDQUFDO2lCQUNMO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFO1lBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUEsb0NBQTJCLEVBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3BFLElBQUksTUFBTSxFQUFFO2dCQUNWLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxDQUFDLENBQUM7YUFDeEQ7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sZUFBZSxDQUFDO0lBQ3pCLENBQUM7SUF4Q0Qsd0RBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7Z2V0VmFsdWVTeW1ib2xPZkRlY2xhcmF0aW9ufSBmcm9tICcuLi8uLi8uLi91dGlscy90eXBlc2NyaXB0L3N5bWJvbCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWRFeHBvcnQge1xuICBzeW1ib2w6IHRzLlN5bWJvbDtcbiAgZXhwb3J0TmFtZTogc3RyaW5nO1xuICBpZGVudGlmaWVyOiB0cy5JZGVudGlmaWVyO1xufVxuXG4vKiogQ29tcHV0ZXMgdGhlIHJlc29sdmVkIGV4cG9ydHMgb2YgYSBnaXZlbiBzb3VyY2UgZmlsZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHBvcnRTeW1ib2xzT2ZGaWxlKFxuICAgIHNmOiB0cy5Tb3VyY2VGaWxlLCB0eXBlQ2hlY2tlcjogdHMuVHlwZUNoZWNrZXIpOiBSZXNvbHZlZEV4cG9ydFtdIHtcbiAgY29uc3QgZXhwb3J0czoge2V4cG9ydE5hbWU6IHN0cmluZywgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcn1bXSA9IFtdO1xuICBjb25zdCByZXNvbHZlZEV4cG9ydHM6IFJlc29sdmVkRXhwb3J0W10gPSBbXTtcblxuICB0cy5mb3JFYWNoQ2hpbGQoc2YsIGZ1bmN0aW9uIHZpc2l0Tm9kZShub2RlKSB7XG4gICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc0Z1bmN0aW9uRGVjbGFyYXRpb24obm9kZSkgfHxcbiAgICAgICAgdHMuaXNJbnRlcmZhY2VEZWNsYXJhdGlvbihub2RlKSAmJlxuICAgICAgICAgICAgKHRzLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlIGFzIHRzLkRlY2xhcmF0aW9uKSAmIHRzLk1vZGlmaWVyRmxhZ3MuRXhwb3J0KSAhPT0gMCkge1xuICAgICAgaWYgKG5vZGUubmFtZSkge1xuICAgICAgICBleHBvcnRzLnB1c2goe2V4cG9ydE5hbWU6IG5vZGUubmFtZS50ZXh0LCBpZGVudGlmaWVyOiBub2RlLm5hbWV9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVTdGF0ZW1lbnQobm9kZSkpIHtcbiAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBub2RlLmRlY2xhcmF0aW9uTGlzdC5kZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgdmlzaXROb2RlKGRlY2wpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBpZiAoKHRzLmdldENvbWJpbmVkTW9kaWZpZXJGbGFncyhub2RlKSAmIHRzLk1vZGlmaWVyRmxhZ3MuRXhwb3J0KSAhPSAwICYmXG4gICAgICAgICAgdHMuaXNJZGVudGlmaWVyKG5vZGUubmFtZSkpIHtcbiAgICAgICAgZXhwb3J0cy5wdXNoKHtleHBvcnROYW1lOiBub2RlLm5hbWUudGV4dCwgaWRlbnRpZmllcjogbm9kZS5uYW1lfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc0V4cG9ydERlY2xhcmF0aW9uKG5vZGUpKSB7XG4gICAgICBjb25zdCB7bW9kdWxlU3BlY2lmaWVyLCBleHBvcnRDbGF1c2V9ID0gbm9kZTtcbiAgICAgIGlmICghbW9kdWxlU3BlY2lmaWVyICYmIGV4cG9ydENsYXVzZSAmJiB0cy5pc05hbWVkRXhwb3J0cyhleHBvcnRDbGF1c2UpKSB7XG4gICAgICAgIGV4cG9ydENsYXVzZS5lbGVtZW50cy5mb3JFYWNoKGVsID0+IGV4cG9ydHMucHVzaCh7XG4gICAgICAgICAgZXhwb3J0TmFtZTogZWwubmFtZS50ZXh0LFxuICAgICAgICAgIGlkZW50aWZpZXI6IGVsLnByb3BlcnR5TmFtZSA/IGVsLnByb3BlcnR5TmFtZSA6IGVsLm5hbWVcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgZXhwb3J0cy5mb3JFYWNoKCh7aWRlbnRpZmllciwgZXhwb3J0TmFtZX0pID0+IHtcbiAgICBjb25zdCBzeW1ib2wgPSBnZXRWYWx1ZVN5bWJvbE9mRGVjbGFyYXRpb24oaWRlbnRpZmllciwgdHlwZUNoZWNrZXIpO1xuICAgIGlmIChzeW1ib2wpIHtcbiAgICAgIHJlc29sdmVkRXhwb3J0cy5wdXNoKHtzeW1ib2wsIGlkZW50aWZpZXIsIGV4cG9ydE5hbWV9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByZXNvbHZlZEV4cG9ydHM7XG59XG4iXX0=