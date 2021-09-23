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
            const symbol = (0, symbol_1.getValueSymbolOfDeclaration)(identifier, typeChecker);
            if (symbol) {
                resolvedExports.push({ symbol, identifier, exportName });
            }
        });
        return resolvedExports;
    }
    exports.getExportSymbolsOfFile = getExportSymbolsOfFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlX2ZpbGVfZXhwb3J0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3VuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaS9kZWNvcmF0b3JfcmV3cml0ZS9zb3VyY2VfZmlsZV9leHBvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUVILGlDQUFpQztJQUNqQyw2RUFBNkU7SUFRN0UsNERBQTREO0lBQzVELFNBQWdCLHNCQUFzQixDQUNsQyxFQUFpQixFQUFFLFdBQTJCO1FBQ2hELE1BQU0sT0FBTyxHQUFzRCxFQUFFLENBQUM7UUFDdEUsTUFBTSxlQUFlLEdBQXFCLEVBQUUsQ0FBQztRQUU3QyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxTQUFTLFNBQVMsQ0FBQyxJQUFJO1lBQ3pDLElBQUksRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7Z0JBQzdELEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7b0JBQzNCLENBQUMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLElBQXNCLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDN0YsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDO2lCQUNuRTthQUNGO2lCQUFNLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN2QyxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFO29CQUNwRCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ2pCO2FBQ0Y7aUJBQU0sSUFBSSxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQyxFQUFFLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNsRSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUM7aUJBQ25FO2FBQ0Y7aUJBQU0sSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsZUFBZSxJQUFJLFlBQVksSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFO29CQUN2RSxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7d0JBQy9DLFVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUk7d0JBQ3hCLFVBQVUsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSTtxQkFDeEQsQ0FBQyxDQUFDLENBQUM7aUJBQ0w7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBQyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBQSxvQ0FBMkIsRUFBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDcEUsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFDLENBQUMsQ0FBQzthQUN4RDtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQXhDRCx3REF3Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQge2dldFZhbHVlU3ltYm9sT2ZEZWNsYXJhdGlvbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9zeW1ib2wnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkRXhwb3J0IHtcbiAgc3ltYm9sOiB0cy5TeW1ib2w7XG4gIGV4cG9ydE5hbWU6IHN0cmluZztcbiAgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcjtcbn1cblxuLyoqIENvbXB1dGVzIHRoZSByZXNvbHZlZCBleHBvcnRzIG9mIGEgZ2l2ZW4gc291cmNlIGZpbGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwb3J0U3ltYm9sc09mRmlsZShcbiAgICBzZjogdHMuU291cmNlRmlsZSwgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogUmVzb2x2ZWRFeHBvcnRbXSB7XG4gIGNvbnN0IGV4cG9ydHM6IHtleHBvcnROYW1lOiBzdHJpbmcsIGlkZW50aWZpZXI6IHRzLklkZW50aWZpZXJ9W10gPSBbXTtcbiAgY29uc3QgcmVzb2x2ZWRFeHBvcnRzOiBSZXNvbHZlZEV4cG9ydFtdID0gW107XG5cbiAgdHMuZm9yRWFjaENoaWxkKHNmLCBmdW5jdGlvbiB2aXNpdE5vZGUobm9kZSkge1xuICAgIGlmICh0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkgfHwgdHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHx8XG4gICAgICAgIHRzLmlzSW50ZXJmYWNlRGVjbGFyYXRpb24obm9kZSkgJiZcbiAgICAgICAgICAgICh0cy5nZXRDb21iaW5lZE1vZGlmaWVyRmxhZ3Mobm9kZSBhcyB0cy5EZWNsYXJhdGlvbikgJiB0cy5Nb2RpZmllckZsYWdzLkV4cG9ydCkgIT09IDApIHtcbiAgICAgIGlmIChub2RlLm5hbWUpIHtcbiAgICAgICAgZXhwb3J0cy5wdXNoKHtleHBvcnROYW1lOiBub2RlLm5hbWUudGV4dCwgaWRlbnRpZmllcjogbm9kZS5uYW1lfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0cy5pc1ZhcmlhYmxlU3RhdGVtZW50KG5vZGUpKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlY2wgb2Ygbm9kZS5kZWNsYXJhdGlvbkxpc3QuZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIHZpc2l0Tm9kZShkZWNsKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRzLmlzVmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgaWYgKCh0cy5nZXRDb21iaW5lZE1vZGlmaWVyRmxhZ3Mobm9kZSkgJiB0cy5Nb2RpZmllckZsYWdzLkV4cG9ydCkgIT0gMCAmJlxuICAgICAgICAgIHRzLmlzSWRlbnRpZmllcihub2RlLm5hbWUpKSB7XG4gICAgICAgIGV4cG9ydHMucHVzaCh7ZXhwb3J0TmFtZTogbm9kZS5uYW1lLnRleHQsIGlkZW50aWZpZXI6IG5vZGUubmFtZX0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHMuaXNFeHBvcnREZWNsYXJhdGlvbihub2RlKSkge1xuICAgICAgY29uc3Qge21vZHVsZVNwZWNpZmllciwgZXhwb3J0Q2xhdXNlfSA9IG5vZGU7XG4gICAgICBpZiAoIW1vZHVsZVNwZWNpZmllciAmJiBleHBvcnRDbGF1c2UgJiYgdHMuaXNOYW1lZEV4cG9ydHMoZXhwb3J0Q2xhdXNlKSkge1xuICAgICAgICBleHBvcnRDbGF1c2UuZWxlbWVudHMuZm9yRWFjaChlbCA9PiBleHBvcnRzLnB1c2goe1xuICAgICAgICAgIGV4cG9ydE5hbWU6IGVsLm5hbWUudGV4dCxcbiAgICAgICAgICBpZGVudGlmaWVyOiBlbC5wcm9wZXJ0eU5hbWUgPyBlbC5wcm9wZXJ0eU5hbWUgOiBlbC5uYW1lXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGV4cG9ydHMuZm9yRWFjaCgoe2lkZW50aWZpZXIsIGV4cG9ydE5hbWV9KSA9PiB7XG4gICAgY29uc3Qgc3ltYm9sID0gZ2V0VmFsdWVTeW1ib2xPZkRlY2xhcmF0aW9uKGlkZW50aWZpZXIsIHR5cGVDaGVja2VyKTtcbiAgICBpZiAoc3ltYm9sKSB7XG4gICAgICByZXNvbHZlZEV4cG9ydHMucHVzaCh7c3ltYm9sLCBpZGVudGlmaWVyLCBleHBvcnROYW1lfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzb2x2ZWRFeHBvcnRzO1xufVxuIl19