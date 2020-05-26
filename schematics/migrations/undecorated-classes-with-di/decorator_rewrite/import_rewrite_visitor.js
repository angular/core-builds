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
        define("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/import_rewrite_visitor", ["require", "exports", "path", "typescript", "@angular/core/schematics/utils/typescript/imports", "@angular/core/schematics/utils/typescript/symbol", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/path_format", "@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/source_file_exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnresolvedIdentifierError = exports.ImportRewriteTransformerFactory = void 0;
    const path_1 = require("path");
    const ts = require("typescript");
    const imports_1 = require("@angular/core/schematics/utils/typescript/imports");
    const symbol_1 = require("@angular/core/schematics/utils/typescript/symbol");
    const path_format_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/path_format");
    const source_file_exports_1 = require("@angular/core/schematics/migrations/undecorated-classes-with-di/decorator_rewrite/source_file_exports");
    /**
     * Factory that creates a TypeScript transformer which ensures that
     * referenced identifiers are available at the target file location.
     *
     * Imports cannot be just added as sometimes identifiers collide in the
     * target source file and the identifier needs to be aliased.
     */
    class ImportRewriteTransformerFactory {
        constructor(importManager, typeChecker, compilerHost) {
            this.importManager = importManager;
            this.typeChecker = typeChecker;
            this.compilerHost = compilerHost;
            this.sourceFileExports = new Map();
        }
        create(ctx, newSourceFile) {
            const visitNode = (node) => {
                if (ts.isIdentifier(node)) {
                    // Record the identifier reference and return the new identifier. The identifier
                    // name can change if the generated import uses an namespaced import or aliased
                    // import identifier (to avoid collisions).
                    return this._recordIdentifierReference(node, newSourceFile);
                }
                return ts.visitEachChild(node, visitNode, ctx);
            };
            return (node) => ts.visitNode(node, visitNode);
        }
        _recordIdentifierReference(node, targetSourceFile) {
            // For object literal elements we don't want to check identifiers that describe the
            // property name. These identifiers do not refer to a value but rather to a property
            // name and therefore don't need to be imported. The exception is that for shorthand
            // property assignments the "name" identifier is both used as value and property name.
            if (ts.isObjectLiteralElementLike(node.parent) &&
                !ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node) {
                return node;
            }
            const resolvedImport = imports_1.getImportOfIdentifier(this.typeChecker, node);
            const sourceFile = node.getSourceFile();
            if (resolvedImport) {
                const symbolName = resolvedImport.name;
                const moduleFileName = this.compilerHost.moduleNameToFileName(resolvedImport.importModule, sourceFile.fileName);
                // In case the identifier refers to an export in the target source file, we need to use
                // the local identifier in the scope of the target source file. This is necessary because
                // the export could be aliased and the alias is not available to the target source file.
                if (moduleFileName && path_1.resolve(moduleFileName) === path_1.resolve(targetSourceFile.fileName)) {
                    const resolvedExport = this._getSourceFileExports(targetSourceFile).find(e => e.exportName === symbolName);
                    if (resolvedExport) {
                        return resolvedExport.identifier;
                    }
                }
                return this.importManager.addImportToSourceFile(targetSourceFile, symbolName, this._rewriteModuleImport(resolvedImport, targetSourceFile));
            }
            else {
                let symbol = symbol_1.getValueSymbolOfDeclaration(node, this.typeChecker);
                if (symbol) {
                    // If the symbol refers to a shorthand property assignment, we want to resolve the
                    // value symbol of the shorthand property assignment. This is necessary because the
                    // value symbol is ambiguous for shorthand property assignment identifiers as the
                    // identifier resolves to both property name and property value.
                    if (symbol.valueDeclaration && ts.isShorthandPropertyAssignment(symbol.valueDeclaration)) {
                        symbol = this.typeChecker.getShorthandAssignmentValueSymbol(symbol.valueDeclaration);
                    }
                    const resolvedExport = this._getSourceFileExports(sourceFile).find(e => e.symbol === symbol);
                    if (resolvedExport) {
                        return this.importManager.addImportToSourceFile(targetSourceFile, resolvedExport.exportName, path_format_1.getPosixPath(this.compilerHost.fileNameToModuleName(sourceFile.fileName, targetSourceFile.fileName)));
                    }
                }
                // The referenced identifier cannot be imported. In that case we throw an exception
                // which can be handled outside of the transformer.
                throw new UnresolvedIdentifierError();
            }
        }
        /**
         * Gets the resolved exports of a given source file. Exports are cached
         * for subsequent calls.
         */
        _getSourceFileExports(sourceFile) {
            if (this.sourceFileExports.has(sourceFile)) {
                return this.sourceFileExports.get(sourceFile);
            }
            const sourceFileExports = source_file_exports_1.getExportSymbolsOfFile(sourceFile, this.typeChecker);
            this.sourceFileExports.set(sourceFile, sourceFileExports);
            return sourceFileExports;
        }
        /** Rewrites a module import to be relative to the target file location. */
        _rewriteModuleImport(resolvedImport, newSourceFile) {
            if (!resolvedImport.importModule.startsWith('.')) {
                return resolvedImport.importModule;
            }
            const importFilePath = resolvedImport.node.getSourceFile().fileName;
            const resolvedModulePath = path_1.resolve(path_1.dirname(importFilePath), resolvedImport.importModule);
            const relativeModuleName = this.compilerHost.fileNameToModuleName(resolvedModulePath, newSourceFile.fileName);
            return path_format_1.getPosixPath(relativeModuleName);
        }
    }
    exports.ImportRewriteTransformerFactory = ImportRewriteTransformerFactory;
    /** Error that will be thrown if a given identifier cannot be resolved. */
    class UnresolvedIdentifierError extends Error {
    }
    exports.UnresolvedIdentifierError = UnresolvedIdentifierError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0X3Jld3JpdGVfdmlzaXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc2NoZW1hdGljcy9taWdyYXRpb25zL3VuZGVjb3JhdGVkLWNsYXNzZXMtd2l0aC1kaS9kZWNvcmF0b3JfcmV3cml0ZS9pbXBvcnRfcmV3cml0ZV92aXNpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7OztJQUdILCtCQUFzQztJQUN0QyxpQ0FBaUM7SUFHakMsK0VBQWdGO0lBQ2hGLDZFQUE2RTtJQUU3RSwrSEFBMkM7SUFDM0MsK0lBQTZFO0lBRzdFOzs7Ozs7T0FNRztJQUNILE1BQWEsK0JBQStCO1FBRzFDLFlBQ1ksYUFBNEIsRUFBVSxXQUEyQixFQUNqRSxZQUE2QjtZQUQ3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFnQjtZQUNqRSxpQkFBWSxHQUFaLFlBQVksQ0FBaUI7WUFKakMsc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7UUFJM0IsQ0FBQztRQUU3QyxNQUFNLENBQW9CLEdBQTZCLEVBQUUsYUFBNEI7WUFFbkYsTUFBTSxTQUFTLEdBQWUsQ0FBQyxJQUFhLEVBQUUsRUFBRTtnQkFDOUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN6QixnRkFBZ0Y7b0JBQ2hGLCtFQUErRTtvQkFDL0UsMkNBQTJDO29CQUMzQyxPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7aUJBQzdEO2dCQUVELE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQztZQUVGLE9BQU8sQ0FBQyxJQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FB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QXlCO1lBQ3JELElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDMUMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBRSxDQUFDO2FBQ2hEO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyw0Q0FBc0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDMUQsT0FBTyxpQkFBaUIsQ0FBQztRQUMzQixDQUFDO1FBRUQsMkVBQTJFO1FBQ25FLG9CQUFvQixDQUFDLGNBQXNCLEVBQUUsYUFBNEI7WUFDL0UsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNoRCxPQUFPLGNBQWMsQ0FBQyxZQUFZLENBQUM7YUFDcEM7WUFFRCxNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQztZQUNwRSxNQUFNLGtCQUFrQixHQUFHLGNBQU8sQ0FBQyxjQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sa0JBQWtCLEdBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXZGLE9BQU8sMEJBQVksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FDRjtJQWhIRCwwRUFnSEM7SUFFRCwwRUFBMEU7SUFDMUUsTUFBYSx5QkFBMEIsU0FBUSxLQUFLO0tBQUc7SUFBdkQsOERBQXVEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FvdENvbXBpbGVySG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtkaXJuYW1lLCByZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0ltcG9ydE1hbmFnZXJ9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2ltcG9ydF9tYW5hZ2VyJztcbmltcG9ydCB7Z2V0SW1wb3J0T2ZJZGVudGlmaWVyLCBJbXBvcnR9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3R5cGVzY3JpcHQvaW1wb3J0cyc7XG5pbXBvcnQge2dldFZhbHVlU3ltYm9sT2ZEZWNsYXJhdGlvbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvdHlwZXNjcmlwdC9zeW1ib2wnO1xuXG5pbXBvcnQge2dldFBvc2l4UGF0aH0gZnJvbSAnLi9wYXRoX2Zvcm1hdCc7XG5pbXBvcnQge2dldEV4cG9ydFN5bWJvbHNPZkZpbGUsIFJlc29sdmVkRXhwb3J0fSBmcm9tICcuL3NvdXJjZV9maWxlX2V4cG9ydHMnO1xuXG5cbi8qKlxuICogRmFjdG9yeSB0aGF0IGNyZWF0ZXMgYSBUeXBlU2NyaXB0IHRyYW5zZm9ybWVyIHdoaWNoIGVuc3VyZXMgdGhhdFxuICogcmVmZXJlbmNlZCBpZGVudGlmaWVycyBhcmUgYXZhaWxhYmxlIGF0IHRoZSB0YXJnZXQgZmlsZSBsb2NhdGlvbi5cbiAqXG4gKiBJbXBvcnRzIGNhbm5vdCBiZSBqdXN0IGFkZGVkIGFzIHNvbWV0aW1lcyBpZGVudGlmaWVycyBjb2xsaWRlIGluIHRoZVxuICogdGFyZ2V0IHNvdXJjZSBmaWxlIGFuZCB0aGUgaWRlbnRpZmllciBuZWVkcyB0byBiZSBhbGlhc2VkLlxuICovXG5leHBvcnQgY2xhc3MgSW1wb3J0UmV3cml0ZVRyYW5zZm9ybWVyRmFjdG9yeSB7XG4gIHByaXZhdGUgc291cmNlRmlsZUV4cG9ydHMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIFJlc29sdmVkRXhwb3J0W10+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIGltcG9ydE1hbmFnZXI6IEltcG9ydE1hbmFnZXIsIHByaXZhdGUgdHlwZUNoZWNrZXI6IHRzLlR5cGVDaGVja2VyLFxuICAgICAgcHJpdmF0ZSBjb21waWxlckhvc3Q6IEFvdENvbXBpbGVySG9zdCkge31cblxuICBjcmVhdGU8VCBleHRlbmRzIHRzLk5vZGU+KGN0eDogdHMuVHJhbnNmb3JtYXRpb25Db250ZXh0LCBuZXdTb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTpcbiAgICAgIHRzLlRyYW5zZm9ybWVyPFQ+IHtcbiAgICBjb25zdCB2aXNpdE5vZGU6IHRzLlZpc2l0b3IgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSkge1xuICAgICAgICAvLyBSZWNvcmQgdGhlIGlkZW50aWZpZXIgcmVmZXJlbmNlIGFuZCByZXR1cm4gdGhlIG5ldyBpZGVudGlmaWVyLiBUaGUgaWRlbnRpZmllclxuICAgICAgICAvLyBuYW1lIGNhbiBjaGFuZ2UgaWYgdGhlIGdlbmVyYXRlZCBpbXBvcnQgdXNlcyBhbiBuYW1lc3BhY2VkIGltcG9ydCBvciBhbGlhc2VkXG4gICAgICAgIC8vIGltcG9ydCBpZGVudGlmaWVyICh0byBhdm9pZCBjb2xsaXNpb25zKS5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29yZElkZW50aWZpZXJSZWZlcmVuY2Uobm9kZSwgbmV3U291cmNlRmlsZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCB2aXNpdE5vZGUsIGN0eCk7XG4gICAgfTtcblxuICAgIHJldHVybiAobm9kZTogVCkgPT4gdHMudmlzaXROb2RlKG5vZGUsIHZpc2l0Tm9kZSk7XG4gIH1cblxuICBwcml2YXRlIF9yZWNvcmRJZGVudGlmaWVyUmVmZXJlbmNlKG5vZGU6IHRzLklkZW50aWZpZXIsIHRhcmdldFNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOlxuICAgICAgdHMuTm9kZSB7XG4gICAgLy8gRm9yIG9iamVjdCBsaXRlcmFsIGVsZW1lbnRzIHdlIGRvbid0IHdhbnQgdG8gY2hlY2sgaWRlbnRpZmllcnMgdGhhdCBkZXNjcmliZSB0aGVcbiAgICAvLyBwcm9wZXJ0eSBuYW1lLiBUaGVzZSBpZGVudGlmaWVycyBkbyBub3QgcmVmZXIgdG8gYSB2YWx1ZSBidXQgcmF0aGVyIHRvIGEgcHJvcGVydHlcbiAgICAvLyBuYW1lIGFuZCB0aGVyZWZvcmUgZG9uJ3QgbmVlZCB0byBiZSBpbXBvcnRlZC4gVGhlIGV4Y2VwdGlvbiBpcyB0aGF0IGZvciBzaG9ydGhhbmRcbiAgICAvLyBwcm9wZXJ0eSBhc3NpZ25tZW50cyB0aGUgXCJuYW1lXCIgaWRlbnRpZmllciBpcyBib3RoIHVzZWQgYXMgdmFsdWUgYW5kIHByb3BlcnR5IG5hbWUuXG4gICAgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEVsZW1lbnRMaWtlKG5vZGUucGFyZW50KSAmJlxuICAgICAgICAhdHMuaXNTaG9ydGhhbmRQcm9wZXJ0eUFzc2lnbm1lbnQobm9kZS5wYXJlbnQpICYmIG5vZGUucGFyZW50Lm5hbWUgPT09IG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc29sdmVkSW1wb3J0ID0gZ2V0SW1wb3J0T2ZJZGVudGlmaWVyKHRoaXMudHlwZUNoZWNrZXIsIG5vZGUpO1xuICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcblxuICAgIGlmIChyZXNvbHZlZEltcG9ydCkge1xuICAgICAgY29uc3Qgc3ltYm9sTmFtZSA9IHJlc29sdmVkSW1wb3J0Lm5hbWU7XG4gICAgICBjb25zdCBtb2R1bGVGaWxlTmFtZSA9XG4gICAgICAgICAgdGhpcy5jb21waWxlckhvc3QubW9kdWxlTmFtZVRvRmlsZU5hbWUocmVzb2x2ZWRJbXBvcnQuaW1wb3J0TW9kdWxlLCBzb3VyY2VGaWxlLmZpbGVOYW1lKTtcblxuICAgICAgLy8gSW4gY2FzZSB0aGUgaWRlbnRpZmllciByZWZlcnMgdG8gYW4gZXhwb3J0IGluIHRoZSB0YXJnZXQgc291cmNlIGZpbGUsIHdlIG5lZWQgdG8gdXNlXG4gICAgICAvLyB0aGUgbG9jYWwgaWRlbnRpZmllciBpbiB0aGUgc2NvcGUgb2YgdGhlIHRhcmdldCBzb3VyY2UgZmlsZS4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZVxuICAgICAgLy8gdGhlIGV4cG9ydCBjb3VsZCBiZSBhbGlhc2VkIGFuZCB0aGUgYWxpYXMgaXMgbm90IGF2YWlsYWJsZSB0byB0aGUgdGFyZ2V0IHNvdXJjZSBmaWxlLlxuICAgICAgaWYgKG1vZHVsZUZpbGVOYW1lICYmIHJlc29sdmUobW9kdWxlRmlsZU5hbWUpID09PSByZXNvbHZlKHRhcmdldFNvdXJjZUZpbGUuZmlsZU5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkRXhwb3J0ID1cbiAgICAgICAgICAgIHRoaXMuX2dldFNvdXJjZUZpbGVFeHBvcnRzKHRhcmdldFNvdXJjZUZpbGUpLmZpbmQoZSA9PiBlLmV4cG9ydE5hbWUgPT09IHN5bWJvbE5hbWUpO1xuICAgICAgICBpZiAocmVzb2x2ZWRFeHBvcnQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZWRFeHBvcnQuaWRlbnRpZmllcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5pbXBvcnRNYW5hZ2VyLmFkZEltcG9ydFRvU291cmNlRmlsZShcbiAgICAgICAgICB0YXJnZXRTb3VyY2VGaWxlLCBzeW1ib2xOYW1lLFxuICAgICAgICAgIHRoaXMuX3Jld3JpdGVNb2R1bGVJbXBvcnQocmVzb2x2ZWRJbXBvcnQsIHRhcmdldFNvdXJjZUZpbGUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHN5bWJvbCA9IGdldFZhbHVlU3ltYm9sT2ZEZWNsYXJhdGlvbihub2RlLCB0aGlzLnR5cGVDaGVja2VyKTtcblxuICAgICAgaWYgKHN5bWJvbCkge1xuICAgICAgICAvLyBJZiB0aGUgc3ltYm9sIHJlZmVycyB0byBhIHNob3J0aGFuZCBwcm9wZXJ0eSBhc3NpZ25tZW50LCB3ZSB3YW50IHRvIHJlc29sdmUgdGhlXG4gICAgICAgIC8vIHZhbHVlIHN5bWJvbCBvZiB0aGUgc2hvcnRoYW5kIHByb3BlcnR5IGFzc2lnbm1lbnQuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlXG4gICAgICAgIC8vIHZhbHVlIHN5bWJvbCBpcyBhbWJpZ3VvdXMgZm9yIHNob3J0aGFuZCBwcm9wZXJ0eSBhc3NpZ25tZW50IGlkZW50aWZpZXJzIGFzIHRoZVxuICAgICAgICAvLyBpZGVudGlmaWVyIHJlc29sdmVzIHRvIGJvdGggcHJvcGVydHkgbmFtZSBhbmQgcHJvcGVydHkgdmFsdWUuXG4gICAgICAgIGlmIChzeW1ib2wudmFsdWVEZWNsYXJhdGlvbiAmJiB0cy5pc1Nob3J0aGFuZFByb3BlcnR5QXNzaWdubWVudChzeW1ib2wudmFsdWVEZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICBzeW1ib2wgPSB0aGlzLnR5cGVDaGVja2VyLmdldFNob3J0aGFuZEFzc2lnbm1lbnRWYWx1ZVN5bWJvbChzeW1ib2wudmFsdWVEZWNsYXJhdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXNvbHZlZEV4cG9ydCA9XG4gICAgICAgICAgICB0aGlzLl9nZXRTb3VyY2VGaWxlRXhwb3J0cyhzb3VyY2VGaWxlKS5maW5kKGUgPT4gZS5zeW1ib2wgPT09IHN5bWJvbCk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVkRXhwb3J0KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW1wb3J0TWFuYWdlci5hZGRJbXBvcnRUb1NvdXJjZUZpbGUoXG4gICAgICAgICAgICAgIHRhcmdldFNvdXJjZUZpbGUsIHJlc29sdmVkRXhwb3J0LmV4cG9ydE5hbWUsXG4gICAgICAgICAgICAgIGdldFBvc2l4UGF0aCh0aGlzLmNvbXBpbGVySG9zdC5maWxlTmFtZVRvTW9kdWxlTmFtZShcbiAgICAgICAgICAgICAgICAgIHNvdXJjZUZpbGUuZmlsZU5hbWUsIHRhcmdldFNvdXJjZUZpbGUuZmlsZU5hbWUpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGhlIHJlZmVyZW5jZWQgaWRlbnRpZmllciBjYW5ub3QgYmUgaW1wb3J0ZWQuIEluIHRoYXQgY2FzZSB3ZSB0aHJvdyBhbiBleGNlcHRpb25cbiAgICAgIC8vIHdoaWNoIGNhbiBiZSBoYW5kbGVkIG91dHNpZGUgb2YgdGhlIHRyYW5zZm9ybWVyLlxuICAgICAgdGhyb3cgbmV3IFVucmVzb2x2ZWRJZGVudGlmaWVyRXJyb3IoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmVzb2x2ZWQgZXhwb3J0cyBvZiBhIGdpdmVuIHNvdXJjZSBmaWxlLiBFeHBvcnRzIGFyZSBjYWNoZWRcbiAgICogZm9yIHN1YnNlcXVlbnQgY2FsbHMuXG4gICAqL1xuICBwcml2YXRlIF9nZXRTb3VyY2VGaWxlRXhwb3J0cyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogUmVzb2x2ZWRFeHBvcnRbXSB7XG4gICAgaWYgKHRoaXMuc291cmNlRmlsZUV4cG9ydHMuaGFzKHNvdXJjZUZpbGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5zb3VyY2VGaWxlRXhwb3J0cy5nZXQoc291cmNlRmlsZSkhO1xuICAgIH1cblxuICAgIGNvbnN0IHNvdXJjZUZpbGVFeHBvcnRzID0gZ2V0RXhwb3J0U3ltYm9sc09mRmlsZShzb3VyY2VGaWxlLCB0aGlzLnR5cGVDaGVja2VyKTtcbiAgICB0aGlzLnNvdXJjZUZpbGVFeHBvcnRzLnNldChzb3VyY2VGaWxlLCBzb3VyY2VGaWxlRXhwb3J0cyk7XG4gICAgcmV0dXJuIHNvdXJjZUZpbGVFeHBvcnRzO1xuICB9XG5cbiAgLyoqIFJld3JpdGVzIGEgbW9kdWxlIGltcG9ydCB0byBiZSByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0IGZpbGUgbG9jYXRpb24uICovXG4gIHByaXZhdGUgX3Jld3JpdGVNb2R1bGVJbXBvcnQocmVzb2x2ZWRJbXBvcnQ6IEltcG9ydCwgbmV3U291cmNlRmlsZTogdHMuU291cmNlRmlsZSk6IHN0cmluZyB7XG4gICAgaWYgKCFyZXNvbHZlZEltcG9ydC5pbXBvcnRNb2R1bGUuc3RhcnRzV2l0aCgnLicpKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZWRJbXBvcnQuaW1wb3J0TW9kdWxlO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydEZpbGVQYXRoID0gcmVzb2x2ZWRJbXBvcnQubm9kZS5nZXRTb3VyY2VGaWxlKCkuZmlsZU5hbWU7XG4gICAgY29uc3QgcmVzb2x2ZWRNb2R1bGVQYXRoID0gcmVzb2x2ZShkaXJuYW1lKGltcG9ydEZpbGVQYXRoKSwgcmVzb2x2ZWRJbXBvcnQuaW1wb3J0TW9kdWxlKTtcbiAgICBjb25zdCByZWxhdGl2ZU1vZHVsZU5hbWUgPVxuICAgICAgICB0aGlzLmNvbXBpbGVySG9zdC5maWxlTmFtZVRvTW9kdWxlTmFtZShyZXNvbHZlZE1vZHVsZVBhdGgsIG5ld1NvdXJjZUZpbGUuZmlsZU5hbWUpO1xuXG4gICAgcmV0dXJuIGdldFBvc2l4UGF0aChyZWxhdGl2ZU1vZHVsZU5hbWUpO1xuICB9XG59XG5cbi8qKiBFcnJvciB0aGF0IHdpbGwgYmUgdGhyb3duIGlmIGEgZ2l2ZW4gaWRlbnRpZmllciBjYW5ub3QgYmUgcmVzb2x2ZWQuICovXG5leHBvcnQgY2xhc3MgVW5yZXNvbHZlZElkZW50aWZpZXJFcnJvciBleHRlbmRzIEVycm9yIHt9XG4iXX0=