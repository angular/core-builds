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
        define("@angular/core/schematics/utils/import_manager", ["require", "exports", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path_1 = require("path");
    const ts = require("typescript");
    /**
     * Import manager that can be used to add TypeScript imports to given source
     * files. The manager ensures that multiple transformations are applied properly
     * without shifted offsets and that similar existing import declarations are re-used.
     */
    class ImportManager {
        constructor(getUpdateRecorder, printer) {
            this.getUpdateRecorder = getUpdateRecorder;
            this.printer = printer;
            /** Map of import declarations that need to be updated to include the given symbols. */
            this.updatedImports = new Map();
            /** Map of source-files and their previously used identifier names. */
            this.usedIdentifierNames = new Map();
            /**
             * Array of previously resolved symbol imports. Cache can be re-used to return
             * the same identifier without checking the source-file again.
             */
            this.importCache = [];
        }
        /**
         * Adds an import to the given source-file and returns the TypeScript
         * identifier that can be used to access the newly imported symbol.
         */
        addImportToSourceFile(sourceFile, symbolName, moduleName, typeImport = false) {
            const sourceDir = path_1.dirname(sourceFile.fileName);
            let importStartIndex = 0;
            let existingImport = null;
            // In case the given import has been already generated previously, we just return
            // the previous generated identifier in order to avoid duplicate generated imports.
            const cachedImport = this.importCache.find(c => c.sourceFile === sourceFile && c.symbolName === symbolName &&
                c.moduleName === moduleName);
            if (cachedImport) {
                return cachedImport.identifier;
            }
            // Walk through all source-file top-level statements and search for import declarations
            // that already match the specified "moduleName" and can be updated to import the
            // given symbol. If no matching import can be found, the last import in the source-file
            // will be used as starting point for a new import that will be generated.
            for (let i = sourceFile.statements.length - 1; i >= 0; i--) {
                const statement = sourceFile.statements[i];
                if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
                    !statement.importClause) {
                    continue;
                }
                if (importStartIndex === 0) {
                    importStartIndex = this._getEndPositionOfNode(statement);
                }
                const moduleSpecifier = statement.moduleSpecifier.text;
                if (moduleSpecifier.startsWith('.') &&
                    path_1.resolve(sourceDir, moduleSpecifier) !== path_1.resolve(sourceDir, moduleName) ||
                    moduleSpecifier !== moduleName) {
                    continue;
                }
                if (statement.importClause.namedBindings) {
                    const namedBindings = statement.importClause.namedBindings;
                    // In case a "Type" symbol is imported, we can't use namespace imports
                    // because these only export symbols available at runtime (no types)
                    if (ts.isNamespaceImport(namedBindings) && !typeImport) {
                        return ts.createPropertyAccess(ts.createIdentifier(namedBindings.name.text), ts.createIdentifier(symbolName || 'default'));
                    }
                    else if (ts.isNamedImports(namedBindings) && symbolName) {
                        const existingElement = namedBindings.elements.find(e => e.propertyName ? e.propertyName.text === symbolName : e.name.text === symbolName);
                        if (existingElement) {
                            return ts.createIdentifier(existingElement.name.text);
                        }
                        // In case the symbol could not be found in an existing import, we
                        // keep track of the import declaration as it can be updated to include
                        // the specified symbol name without having to create a new import.
                        existingImport = statement;
                    }
                }
                else if (statement.importClause.name && !symbolName) {
                    return ts.createIdentifier(statement.importClause.name.text);
                }
            }
            if (existingImport) {
                const propertyIdentifier = ts.createIdentifier(symbolName);
                const generatedUniqueIdentifier = this._getUniqueIdentifier(sourceFile, symbolName);
                const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== symbolName;
                const importName = needsGeneratedUniqueName ? generatedUniqueIdentifier : propertyIdentifier;
                // Since it can happen that multiple classes need to be imported within the
                // specified source file and we want to add the identifiers to the existing
                // import declaration, we need to keep track of the updated import declarations.
                // We can't directly update the import declaration for each identifier as this
                // would throw off the recorder offsets. We need to keep track of the new identifiers
                // for the import and perform the import transformation as batches per source-file.
                this.updatedImports.set(existingImport, (this.updatedImports.get(existingImport) || []).concat({
                    propertyName: needsGeneratedUniqueName ? propertyIdentifier : undefined,
                    importName: importName,
                }));
                // Keep track of all updated imports so that we don't generate duplicate
                // similar imports as these can't be statically analyzed in the source-file yet.
                this.importCache.push({ sourceFile, moduleName, symbolName, identifier: importName });
                return importName;
            }
            let identifier = null;
            let newImport = null;
            if (symbolName) {
                const propertyIdentifier = ts.createIdentifier(symbolName);
                const generatedUniqueIdentifier = this._getUniqueIdentifier(sourceFile, symbolName);
                const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== symbolName;
                identifier = needsGeneratedUniqueName ? generatedUniqueIdentifier : propertyIdentifier;
                newImport = ts.createImportDeclaration(undefined, undefined, ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(needsGeneratedUniqueName ? propertyIdentifier : undefined, identifier)])), ts.createStringLiteral(moduleName));
            }
            else {
                identifier = this._getUniqueIdentifier(sourceFile, 'defaultExport');
                newImport = ts.createImportDeclaration(undefined, undefined, ts.createImportClause(identifier, undefined), ts.createStringLiteral(moduleName));
            }
            const newImportText = this.printer.printNode(ts.EmitHint.Unspecified, newImport, sourceFile);
            // If the import is generated at the start of the source file, we want to add
            // a new-line after the import. Otherwise if the import is generated after an
            // existing import, we need to prepend a new-line so that the import is not on
            // the same line as the existing import anchor.
            this.getUpdateRecorder(sourceFile)
                .addNewImport(importStartIndex, importStartIndex === 0 ? `${newImportText}\n` : `\n${newImportText}`);
            // Keep track of all generated imports so that we don't generate duplicate
            // similar imports as these can't be statically analyzed in the source-file yet.
            this.importCache.push({ sourceFile, symbolName, moduleName, identifier });
            return identifier;
        }
        /**
         * Stores the collected import changes within the appropriate update recorders. The
         * updated imports can only be updated *once* per source-file because previous updates
         * could otherwise shift the source-file offsets.
         */
        recordChanges() {
            this.updatedImports.forEach((expressions, importDecl) => {
                const sourceFile = importDecl.getSourceFile();
                const recorder = this.getUpdateRecorder(sourceFile);
                const namedBindings = importDecl.importClause.namedBindings;
                const newNamedBindings = ts.updateNamedImports(namedBindings, namedBindings.elements.concat(expressions.map(({ propertyName, importName }) => ts.createImportSpecifier(propertyName, importName))));
                const newNamedBindingsText = this.printer.printNode(ts.EmitHint.Unspecified, newNamedBindings, sourceFile);
                recorder.updateExistingImport(namedBindings, newNamedBindingsText);
            });
        }
        /** Gets an unique identifier with a base name for the given source file. */
        _getUniqueIdentifier(sourceFile, baseName) {
            if (this.isUniqueIdentifierName(sourceFile, baseName)) {
                this._recordUsedIdentifier(sourceFile, baseName);
                return ts.createIdentifier(baseName);
            }
            let name = null;
            let counter = 1;
            do {
                name = `${baseName}_${counter++}`;
            } while (!this.isUniqueIdentifierName(sourceFile, name));
            this._recordUsedIdentifier(sourceFile, name);
            return ts.createIdentifier(name);
        }
        /**
         * Checks whether the specified identifier name is used within the given
         * source file.
         */
        isUniqueIdentifierName(sourceFile, name) {
            if (this.usedIdentifierNames.has(sourceFile) &&
                this.usedIdentifierNames.get(sourceFile).indexOf(name) !== -1) {
                return false;
            }
            // Walk through the source file and search for an identifier matching
            // the given name. In that case, it's not guaranteed that this name
            // is unique in the given declaration scope and we just return false.
            const nodeQueue = [sourceFile];
            while (nodeQueue.length) {
                const node = nodeQueue.shift();
                if (ts.isIdentifier(node) && node.text === name) {
                    return false;
                }
                nodeQueue.push(...node.getChildren());
            }
            return true;
        }
        _recordUsedIdentifier(sourceFile, identifierName) {
            this.usedIdentifierNames.set(sourceFile, (this.usedIdentifierNames.get(sourceFile) || []).concat(identifierName));
        }
        /**
         * Determines the full end of a given node. By default the end position of a node is
         * before all trailing comments. This could mean that generated imports shift comments.
         */
        _getEndPositionOfNode(node) {
            const nodeEndPos = node.getEnd();
            const commentRanges = ts.getTrailingCommentRanges(node.getSourceFile().text, nodeEndPos);
            if (!commentRanges || !commentRanges.length) {
                return nodeEndPos;
            }
            return commentRanges[commentRanges.length - 1].end;
        }
    }
    exports.ImportManager = ImportManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0X21hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvaW1wb3J0X21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7SUFFSCwrQkFBc0M7SUFDdEMsaUNBQWlDO0lBUWpDOzs7O09BSUc7SUFDSCxNQUFhLGFBQWE7UUFpQnhCLFlBQ1ksaUJBQXFFLEVBQ3JFLE9BQW1CO1lBRG5CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0Q7WUFDckUsWUFBTyxHQUFQLE9BQU8sQ0FBWTtZQWxCL0IsdUZBQXVGO1lBQy9FLG1CQUFjLEdBQ2xCLElBQUksR0FBRyxFQUFxRixDQUFDO1lBQ2pHLHNFQUFzRTtZQUM5RCx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUNqRTs7O2VBR0c7WUFDSyxnQkFBVyxHQUtiLEVBQUUsQ0FBQztRQUl5QixDQUFDO1FBRW5DOzs7V0FHRztRQUNILHFCQUFxQixDQUNqQixVQUF5QixFQUFFLFVBQXVCLEVBQUUsVUFBa0IsRUFDdEUsVUFBVSxHQUFHLEtBQUs7WUFDcEIsTUFBTSxTQUFTLEdBQUcsY0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztZQUN6QixJQUFJLGNBQWMsR0FBOEIsSUFBSSxDQUFDO1lBRXJELGlGQUFpRjtZQUNqRixtRkFBbUY7WUFDbkYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQ3RDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLElBQUksQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVO2dCQUMzRCxDQUFDLENBQUMsVUFBVSxLQUFLLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLElBQUksWUFBWSxF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QUFDO2FBQ3ZDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRU8scUJBQXFCLENBQUMsVUFBeUIsRUFBRSxjQUFzQjtZQUM3RSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUN4QixVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQzNGLENBQUM7UUFFRDs7O1dBR0c7UUFDSyxxQkFBcUIsQ0FBQyxJQUFhO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQyxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtnQkFDM0MsT0FBTyxVQUFVLENBQUM7YUFDbkI7WUFDRCxPQUFPLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBRyxDQUFDLEdBQUcsQ0FBQztRQUN2RCxDQUFDO0tBQ0Y7SUE1T0Qsc0NBNE9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Rpcm5hbWUsIHJlc29sdmV9IGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbi8qKiBVcGRhdGUgcmVjb3JkZXIgZm9yIG1hbmFnaW5nIGltcG9ydHMuICovXG5leHBvcnQgaW50ZXJmYWNlIEltcG9ydE1hbmFnZXJVcGRhdGVSZWNvcmRlciB7XG4gIGFkZE5ld0ltcG9ydChzdGFydDogbnVtYmVyLCBpbXBvcnRUZXh0OiBzdHJpbmcpOiB2b2lkO1xuICB1cGRhdGVFeGlzdGluZ0ltcG9ydChuYW1lZEJpbmRpbmdzOiB0cy5OYW1lZEltcG9ydHMsIG5ld05hbWVkQmluZGluZ3M6IHN0cmluZyk6IHZvaWQ7XG59XG5cbi8qKlxuICogSW1wb3J0IG1hbmFnZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBhZGQgVHlwZVNjcmlwdCBpbXBvcnRzIHRvIGdpdmVuIHNvdXJjZVxuICogZmlsZXMuIFRoZSBtYW5hZ2VyIGVuc3VyZXMgdGhhdCBtdWx0aXBsZSB0cmFuc2Zvcm1hdGlvbnMgYXJlIGFwcGxpZWQgcHJvcGVybHlcbiAqIHdpdGhvdXQgc2hpZnRlZCBvZmZzZXRzIGFuZCB0aGF0IHNpbWlsYXIgZXhpc3RpbmcgaW1wb3J0IGRlY2xhcmF0aW9ucyBhcmUgcmUtdXNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEltcG9ydE1hbmFnZXIge1xuICAvKiogTWFwIG9mIGltcG9ydCBkZWNsYXJhdGlvbnMgdGhhdCBuZWVkIHRvIGJlIHVwZGF0ZWQgdG8gaW5jbHVkZSB0aGUgZ2l2ZW4gc3ltYm9scy4gKi9cbiAgcHJpdmF0ZSB1cGRhdGVkSW1wb3J0cyA9XG4gICAgICBuZXcgTWFwPHRzLkltcG9ydERlY2xhcmF0aW9uLCB7cHJvcGVydHlOYW1lPzogdHMuSWRlbnRpZmllciwgaW1wb3J0TmFtZTogdHMuSWRlbnRpZmllcn1bXT4oKTtcbiAgLyoqIE1hcCBvZiBzb3VyY2UtZmlsZXMgYW5kIHRoZWlyIHByZXZpb3VzbHkgdXNlZCBpZGVudGlmaWVyIG5hbWVzLiAqL1xuICBwcml2YXRlIHVzZWRJZGVudGlmaWVyTmFtZXMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIHN0cmluZ1tdPigpO1xuICAvKipcbiAgICogQXJyYXkgb2YgcHJldmlvdXNseSByZXNvbHZlZCBzeW1ib2wgaW1wb3J0cy4gQ2FjaGUgY2FuIGJlIHJlLXVzZWQgdG8gcmV0dXJuXG4gICAqIHRoZSBzYW1lIGlkZW50aWZpZXIgd2l0aG91dCBjaGVja2luZyB0aGUgc291cmNlLWZpbGUgYWdhaW4uXG4gICAqL1xuICBwcml2YXRlIGltcG9ydENhY2hlOiB7XG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSxcbiAgICBzeW1ib2xOYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBtb2R1bGVOYW1lOiBzdHJpbmcsXG4gICAgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllclxuICB9W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gSW1wb3J0TWFuYWdlclVwZGF0ZVJlY29yZGVyLFxuICAgICAgcHJpdmF0ZSBwcmludGVyOiB0cy5QcmludGVyKSB7fVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGltcG9ydCB0byB0aGUgZ2l2ZW4gc291cmNlLWZpbGUgYW5kIHJldHVybnMgdGhlIFR5cGVTY3JpcHRcbiAgICogaWRlbnRpZmllciB0aGF0IGNhbiBiZSB1c2VkIHRvIGFjY2VzcyB0aGUgbmV3bHkgaW1wb3J0ZWQgc3ltYm9sLlxuICAgKi9cbiAgYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKFxuICAgICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgc3ltYm9sTmFtZTogc3RyaW5nfG51bGwsIG1vZHVsZU5hbWU6IHN0cmluZyxcbiAgICAgIHR5cGVJbXBvcnQgPSBmYWxzZSk6IHRzLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IHNvdXJjZURpciA9IGRpcm5hbWUoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgbGV0IGltcG9ydFN0YXJ0SW5kZXggPSAwO1xuICAgIGxldCBleGlzdGluZ0ltcG9ydDogdHMuSW1wb3J0RGVjbGFyYXRpb258bnVsbCA9IG51bGw7XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBnaXZlbiBpbXBvcnQgaGFzIGJlZW4gYWxyZWFkeSBnZW5lcmF0ZWQgcHJldmlvdXNseSwgd2UganVzdCByZXR1cm5cbiAgICAvLyB0aGUgcHJldmlvdXMgZ2VuZXJhdGVkIGlkZW50aWZpZXIgaW4gb3JkZXIgdG8gYXZvaWQgZHVwbGljYXRlIGdlbmVyYXRlZCBpbXBvcnRzLlxuICAgIGNvbnN0IGNhY2hlZEltcG9ydCA9IHRoaXMuaW1wb3J0Q2FjaGUuZmluZChcbiAgICAgICAgYyA9PiBjLnNvdXJjZUZpbGUgPT09IHNvdXJjZUZpbGUgJiYgYy5zeW1ib2xOYW1lID09PSBzeW1ib2xOYW1lICYmXG4gICAgICAgICAgICBjLm1vZHVsZU5hbWUgPT09IG1vZHVsZU5hbWUpO1xuICAgIGlmIChjYWNoZWRJbXBvcnQpIHtcbiAgICAgIHJldHVybiBjYWNoZWRJbXBvcnQuaWRlbnRpZmllcjtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRocm91Z2ggYWxsIHNvdXJjZS1maWxlIHRvcC1sZXZlbCBzdGF0ZW1lbnRzIGFuZCBzZWFyY2ggZm9yIGltcG9ydCBkZWNsYXJhdGlvbnNcbiAgICAvLyB0aGF0IGFscmVhZHkgbWF0Y2ggdGhlIHNwZWNpZmllZCBcIm1vZHVsZU5hbWVcIiBhbmQgY2FuIGJlIHVwZGF0ZWQgdG8gaW1wb3J0IHRoZVxuICAgIC8vIGdpdmVuIHN5bWJvbC4gSWYgbm8gbWF0Y2hpbmcgaW1wb3J0IGNhbiBiZSBmb3VuZCwgdGhlIGxhc3QgaW1wb3J0IGluIHRoZSBzb3VyY2UtZmlsZVxuICAgIC8vIHdpbGwgYmUgdXNlZCBhcyBzdGFydGluZyBwb2ludCBmb3IgYSBuZXcgaW1wb3J0IHRoYXQgd2lsbCBiZSBnZW5lcmF0ZWQuXG4gICAgZm9yIChsZXQgaSA9IHNvdXJjZUZpbGUuc3RhdGVtZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3Qgc3RhdGVtZW50ID0gc291cmNlRmlsZS5zdGF0ZW1lbnRzW2ldO1xuXG4gICAgICBpZiAoIXRzLmlzSW1wb3J0RGVjbGFyYXRpb24oc3RhdGVtZW50KSB8fCAhdHMuaXNTdHJpbmdMaXRlcmFsKHN0YXRlbWVudC5tb2R1bGVTcGVjaWZpZXIpIHx8XG4gICAgICAgICAgIXN0YXRlbWVudC5pbXBvcnRDbGF1c2UpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbXBvcnRTdGFydEluZGV4ID09PSAwKSB7XG4gICAgICAgIGltcG9ydFN0YXJ0SW5kZXggPSB0aGlzLl9nZXRFbmRQb3NpdGlvbk9mTm9kZShzdGF0ZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2R1bGVTcGVjaWZpZXIgPSBzdGF0ZW1lbnQubW9kdWxlU3BlY2lmaWVyLnRleHQ7XG5cbiAgICAgIGlmIChtb2R1bGVTcGVjaWZpZXIuc3RhcnRzV2l0aCgnLicpICYmXG4gICAgICAgICAgICAgIHJlc29sdmUoc291cmNlRGlyLCBtb2R1bGVTcGVjaWZpZXIpICE9PSByZXNvbHZlKHNvdXJjZURpciwgbW9kdWxlTmFtZSkgfHxcbiAgICAgICAgICBtb2R1bGVTcGVjaWZpZXIgIT09IG1vZHVsZU5hbWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZW1lbnQuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MpIHtcbiAgICAgICAgY29uc3QgbmFtZWRCaW5kaW5ncyA9IHN0YXRlbWVudC5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncztcblxuICAgICAgICAvLyBJbiBjYXNlIGEgXCJUeXBlXCIgc3ltYm9sIGlzIGltcG9ydGVkLCB3ZSBjYW4ndCB1c2UgbmFtZXNwYWNlIGltcG9ydHNcbiAgICAgICAgLy8gYmVjYXVzZSB0aGVzZSBvbmx5IGV4cG9ydCBzeW1ib2xzIGF2YWlsYWJsZSBhdCBydW50aW1lIChubyB0eXBlcylcbiAgICAgICAgaWYgKHRzLmlzTmFtZXNwYWNlSW1wb3J0KG5hbWVkQmluZGluZ3MpICYmICF0eXBlSW1wb3J0KSB7XG4gICAgICAgICAgcmV0dXJuIHRzLmNyZWF0ZVByb3BlcnR5QWNjZXNzKFxuICAgICAgICAgICAgICB0cy5jcmVhdGVJZGVudGlmaWVyKG5hbWVkQmluZGluZ3MubmFtZS50ZXh0KSxcbiAgICAgICAgICAgICAgdHMuY3JlYXRlSWRlbnRpZmllcihzeW1ib2xOYW1lIHx8ICdkZWZhdWx0JykpO1xuICAgICAgICB9IGVsc2UgaWYgKHRzLmlzTmFtZWRJbXBvcnRzKG5hbWVkQmluZGluZ3MpICYmIHN5bWJvbE5hbWUpIHtcbiAgICAgICAgICBjb25zdCBleGlzdGluZ0VsZW1lbnQgPSBuYW1lZEJpbmRpbmdzLmVsZW1lbnRzLmZpbmQoXG4gICAgICAgICAgICAgIGUgPT5cbiAgICAgICAgICAgICAgICAgIGUucHJvcGVydHlOYW1lID8gZS5wcm9wZXJ0eU5hbWUudGV4dCA9PT0gc3ltYm9sTmFtZSA6IGUubmFtZS50ZXh0ID09PSBzeW1ib2xOYW1lKTtcblxuICAgICAgICAgIGlmIChleGlzdGluZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cy5jcmVhdGVJZGVudGlmaWVyKGV4aXN0aW5nRWxlbWVudC5uYW1lLnRleHQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEluIGNhc2UgdGhlIHN5bWJvbCBjb3VsZCBub3QgYmUgZm91bmQgaW4gYW4gZXhpc3RpbmcgaW1wb3J0LCB3ZVxuICAgICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIGltcG9ydCBkZWNsYXJhdGlvbiBhcyBpdCBjYW4gYmUgdXBkYXRlZCB0byBpbmNsdWRlXG4gICAgICAgICAgLy8gdGhlIHNwZWNpZmllZCBzeW1ib2wgbmFtZSB3aXRob3V0IGhhdmluZyB0byBjcmVhdGUgYSBuZXcgaW1wb3J0LlxuICAgICAgICAgIGV4aXN0aW5nSW1wb3J0ID0gc3RhdGVtZW50O1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlbWVudC5pbXBvcnRDbGF1c2UubmFtZSAmJiAhc3ltYm9sTmFtZSkge1xuICAgICAgICByZXR1cm4gdHMuY3JlYXRlSWRlbnRpZmllcihzdGF0ZW1lbnQuaW1wb3J0Q2xhdXNlLm5hbWUudGV4dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4aXN0aW5nSW1wb3J0KSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eUlkZW50aWZpZXIgPSB0cy5jcmVhdGVJZGVudGlmaWVyKHN5bWJvbE5hbWUgISk7XG4gICAgICBjb25zdCBnZW5lcmF0ZWRVbmlxdWVJZGVudGlmaWVyID0gdGhpcy5fZ2V0VW5pcXVlSWRlbnRpZmllcihzb3VyY2VGaWxlLCBzeW1ib2xOYW1lICEpO1xuICAgICAgY29uc3QgbmVlZHNHZW5lcmF0ZWRVbmlxdWVOYW1lID0gZ2VuZXJhdGVkVW5pcXVlSWRlbnRpZmllci50ZXh0ICE9PSBzeW1ib2xOYW1lO1xuICAgICAgY29uc3QgaW1wb3J0TmFtZSA9IG5lZWRzR2VuZXJhdGVkVW5pcXVlTmFtZSA/IGdlbmVyYXRlZFVuaXF1ZUlkZW50aWZpZXIgOiBwcm9wZXJ0eUlkZW50aWZpZXI7XG5cbiAgICAgIC8vIFNpbmNlIGl0IGNhbiBoYXBwZW4gdGhhdCBtdWx0aXBsZSBjbGFzc2VzIG5lZWQgdG8gYmUgaW1wb3J0ZWQgd2l0aGluIHRoZVxuICAgICAgLy8gc3BlY2lmaWVkIHNvdXJjZSBmaWxlIGFuZCB3ZSB3YW50IHRvIGFkZCB0aGUgaWRlbnRpZmllcnMgdG8gdGhlIGV4aXN0aW5nXG4gICAgICAvLyBpbXBvcnQgZGVjbGFyYXRpb24sIHdlIG5lZWQgdG8ga2VlcCB0cmFjayBvZiB0aGUgdXBkYXRlZCBpbXBvcnQgZGVjbGFyYXRpb25zLlxuICAgICAgLy8gV2UgY2FuJ3QgZGlyZWN0bHkgdXBkYXRlIHRoZSBpbXBvcnQgZGVjbGFyYXRpb24gZm9yIGVhY2ggaWRlbnRpZmllciBhcyB0aGlzXG4gICAgICAvLyB3b3VsZCB0aHJvdyBvZmYgdGhlIHJlY29yZGVyIG9mZnNldHMuIFdlIG5lZWQgdG8ga2VlcCB0cmFjayBvZiB0aGUgbmV3IGlkZW50aWZpZXJzXG4gICAgICAvLyBmb3IgdGhlIGltcG9ydCBhbmQgcGVyZm9ybSB0aGUgaW1wb3J0IHRyYW5zZm9ybWF0aW9uIGFzIGJhdGNoZXMgcGVyIHNvdXJjZS1maWxlLlxuICAgICAgdGhpcy51cGRhdGVkSW1wb3J0cy5zZXQoXG4gICAgICAgICAgZXhpc3RpbmdJbXBvcnQsICh0aGlzLnVwZGF0ZWRJbXBvcnRzLmdldChleGlzdGluZ0ltcG9ydCkgfHwgW10pLmNvbmNhdCh7XG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IG5lZWRzR2VuZXJhdGVkVW5pcXVlTmFtZSA/IHByb3BlcnR5SWRlbnRpZmllciA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGltcG9ydE5hbWU6IGltcG9ydE5hbWUsXG4gICAgICAgICAgfSkpO1xuXG4gICAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCB1cGRhdGVkIGltcG9ydHMgc28gdGhhdCB3ZSBkb24ndCBnZW5lcmF0ZSBkdXBsaWNhdGVcbiAgICAgIC8vIHNpbWlsYXIgaW1wb3J0cyBhcyB0aGVzZSBjYW4ndCBiZSBzdGF0aWNhbGx5IGFuYWx5emVkIGluIHRoZSBzb3VyY2UtZmlsZSB5ZXQuXG4gICAgICB0aGlzLmltcG9ydENhY2hlLnB1c2goe3NvdXJjZUZpbGUsIG1vZHVsZU5hbWUsIHN5bWJvbE5hbWUsIGlkZW50aWZpZXI6IGltcG9ydE5hbWV9KTtcblxuICAgICAgcmV0dXJuIGltcG9ydE5hbWU7XG4gICAgfVxuXG4gICAgbGV0IGlkZW50aWZpZXI6IHRzLklkZW50aWZpZXJ8bnVsbCA9IG51bGw7XG4gICAgbGV0IG5ld0ltcG9ydDogdHMuSW1wb3J0RGVjbGFyYXRpb258bnVsbCA9IG51bGw7XG5cbiAgICBpZiAoc3ltYm9sTmFtZSkge1xuICAgICAgY29uc3QgcHJvcGVydHlJZGVudGlmaWVyID0gdHMuY3JlYXRlSWRlbnRpZmllcihzeW1ib2xOYW1lKTtcbiAgICAgIGNvbnN0IGdlbmVyYXRlZFVuaXF1ZUlkZW50aWZpZXIgPSB0aGlzLl9nZXRVbmlxdWVJZGVudGlmaWVyKHNvdXJjZUZpbGUsIHN5bWJvbE5hbWUpO1xuICAgICAgY29uc3QgbmVlZHNHZW5lcmF0ZWRVbmlxdWVOYW1lID0gZ2VuZXJhdGVkVW5pcXVlSWRlbnRpZmllci50ZXh0ICE9PSBzeW1ib2xOYW1lO1xuICAgICAgaWRlbnRpZmllciA9IG5lZWRzR2VuZXJhdGVkVW5pcXVlTmFtZSA/IGdlbmVyYXRlZFVuaXF1ZUlkZW50aWZpZXIgOiBwcm9wZXJ0eUlkZW50aWZpZXI7XG5cbiAgICAgIG5ld0ltcG9ydCA9IHRzLmNyZWF0ZUltcG9ydERlY2xhcmF0aW9uKFxuICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuICAgICAgICAgIHRzLmNyZWF0ZUltcG9ydENsYXVzZShcbiAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB0cy5jcmVhdGVOYW1lZEltcG9ydHMoW3RzLmNyZWF0ZUltcG9ydFNwZWNpZmllcihcbiAgICAgICAgICAgICAgICAgIG5lZWRzR2VuZXJhdGVkVW5pcXVlTmFtZSA/IHByb3BlcnR5SWRlbnRpZmllciA6IHVuZGVmaW5lZCwgaWRlbnRpZmllcildKSksXG4gICAgICAgICAgdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChtb2R1bGVOYW1lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkZW50aWZpZXIgPSB0aGlzLl9nZXRVbmlxdWVJZGVudGlmaWVyKHNvdXJjZUZpbGUsICdkZWZhdWx0RXhwb3J0Jyk7XG4gICAgICBuZXdJbXBvcnQgPSB0cy5jcmVhdGVJbXBvcnREZWNsYXJhdGlvbihcbiAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHMuY3JlYXRlSW1wb3J0Q2xhdXNlKGlkZW50aWZpZXIsIHVuZGVmaW5lZCksXG4gICAgICAgICAgdHMuY3JlYXRlU3RyaW5nTGl0ZXJhbChtb2R1bGVOYW1lKSk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3SW1wb3J0VGV4dCA9IHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0ltcG9ydCwgc291cmNlRmlsZSk7XG4gICAgLy8gSWYgdGhlIGltcG9ydCBpcyBnZW5lcmF0ZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzb3VyY2UgZmlsZSwgd2Ugd2FudCB0byBhZGRcbiAgICAvLyBhIG5ldy1saW5lIGFmdGVyIHRoZSBpbXBvcnQuIE90aGVyd2lzZSBpZiB0aGUgaW1wb3J0IGlzIGdlbmVyYXRlZCBhZnRlciBhblxuICAgIC8vIGV4aXN0aW5nIGltcG9ydCwgd2UgbmVlZCB0byBwcmVwZW5kIGEgbmV3LWxpbmUgc28gdGhhdCB0aGUgaW1wb3J0IGlzIG5vdCBvblxuICAgIC8vIHRoZSBzYW1lIGxpbmUgYXMgdGhlIGV4aXN0aW5nIGltcG9ydCBhbmNob3IuXG4gICAgdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKVxuICAgICAgICAuYWRkTmV3SW1wb3J0KFxuICAgICAgICAgICAgaW1wb3J0U3RhcnRJbmRleCwgaW1wb3J0U3RhcnRJbmRleCA9PT0gMCA/IGAke25ld0ltcG9ydFRleHR9XFxuYCA6IGBcXG4ke25ld0ltcG9ydFRleHR9YCk7XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBnZW5lcmF0ZWQgaW1wb3J0cyBzbyB0aGF0IHdlIGRvbid0IGdlbmVyYXRlIGR1cGxpY2F0ZVxuICAgIC8vIHNpbWlsYXIgaW1wb3J0cyBhcyB0aGVzZSBjYW4ndCBiZSBzdGF0aWNhbGx5IGFuYWx5emVkIGluIHRoZSBzb3VyY2UtZmlsZSB5ZXQuXG4gICAgdGhpcy5pbXBvcnRDYWNoZS5wdXNoKHtzb3VyY2VGaWxlLCBzeW1ib2xOYW1lLCBtb2R1bGVOYW1lLCBpZGVudGlmaWVyfSk7XG5cbiAgICByZXR1cm4gaWRlbnRpZmllcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGNvbGxlY3RlZCBpbXBvcnQgY2hhbmdlcyB3aXRoaW4gdGhlIGFwcHJvcHJpYXRlIHVwZGF0ZSByZWNvcmRlcnMuIFRoZVxuICAgKiB1cGRhdGVkIGltcG9ydHMgY2FuIG9ubHkgYmUgdXBkYXRlZCAqb25jZSogcGVyIHNvdXJjZS1maWxlIGJlY2F1c2UgcHJldmlvdXMgdXBkYXRlc1xuICAgKiBjb3VsZCBvdGhlcndpc2Ugc2hpZnQgdGhlIHNvdXJjZS1maWxlIG9mZnNldHMuXG4gICAqL1xuICByZWNvcmRDaGFuZ2VzKCkge1xuICAgIHRoaXMudXBkYXRlZEltcG9ydHMuZm9yRWFjaCgoZXhwcmVzc2lvbnMsIGltcG9ydERlY2wpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBpbXBvcnREZWNsLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKTtcbiAgICAgIGNvbnN0IG5hbWVkQmluZGluZ3MgPSBpbXBvcnREZWNsLmltcG9ydENsYXVzZSAhLm5hbWVkQmluZGluZ3MgYXMgdHMuTmFtZWRJbXBvcnRzO1xuICAgICAgY29uc3QgbmV3TmFtZWRCaW5kaW5ncyA9IHRzLnVwZGF0ZU5hbWVkSW1wb3J0cyhcbiAgICAgICAgICBuYW1lZEJpbmRpbmdzLFxuICAgICAgICAgIG5hbWVkQmluZGluZ3MuZWxlbWVudHMuY29uY2F0KGV4cHJlc3Npb25zLm1hcChcbiAgICAgICAgICAgICAgKHtwcm9wZXJ0eU5hbWUsIGltcG9ydE5hbWV9KSA9PiB0cy5jcmVhdGVJbXBvcnRTcGVjaWZpZXIocHJvcGVydHlOYW1lLCBpbXBvcnROYW1lKSkpKTtcblxuICAgICAgY29uc3QgbmV3TmFtZWRCaW5kaW5nc1RleHQgPVxuICAgICAgICAgIHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld05hbWVkQmluZGluZ3MsIHNvdXJjZUZpbGUpO1xuICAgICAgcmVjb3JkZXIudXBkYXRlRXhpc3RpbmdJbXBvcnQobmFtZWRCaW5kaW5ncywgbmV3TmFtZWRCaW5kaW5nc1RleHQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEdldHMgYW4gdW5pcXVlIGlkZW50aWZpZXIgd2l0aCBhIGJhc2UgbmFtZSBmb3IgdGhlIGdpdmVuIHNvdXJjZSBmaWxlLiAqL1xuICBwcml2YXRlIF9nZXRVbmlxdWVJZGVudGlmaWVyKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIGJhc2VOYW1lOiBzdHJpbmcpOiB0cy5JZGVudGlmaWVyIHtcbiAgICBpZiAodGhpcy5pc1VuaXF1ZUlkZW50aWZpZXJOYW1lKHNvdXJjZUZpbGUsIGJhc2VOYW1lKSkge1xuICAgICAgdGhpcy5fcmVjb3JkVXNlZElkZW50aWZpZXIoc291cmNlRmlsZSwgYmFzZU5hbWUpO1xuICAgICAgcmV0dXJuIHRzLmNyZWF0ZUlkZW50aWZpZXIoYmFzZU5hbWUpO1xuICAgIH1cblxuICAgIGxldCBuYW1lID0gbnVsbDtcbiAgICBsZXQgY291bnRlciA9IDE7XG4gICAgZG8ge1xuICAgICAgbmFtZSA9IGAke2Jhc2VOYW1lfV8ke2NvdW50ZXIrK31gO1xuICAgIH0gd2hpbGUgKCF0aGlzLmlzVW5pcXVlSWRlbnRpZmllck5hbWUoc291cmNlRmlsZSwgbmFtZSkpO1xuXG4gICAgdGhpcy5fcmVjb3JkVXNlZElkZW50aWZpZXIoc291cmNlRmlsZSwgbmFtZSAhKTtcbiAgICByZXR1cm4gdHMuY3JlYXRlSWRlbnRpZmllcihuYW1lICEpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgaWRlbnRpZmllciBuYW1lIGlzIHVzZWQgd2l0aGluIHRoZSBnaXZlblxuICAgKiBzb3VyY2UgZmlsZS5cbiAgICovXG4gIHByaXZhdGUgaXNVbmlxdWVJZGVudGlmaWVyTmFtZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy51c2VkSWRlbnRpZmllck5hbWVzLmhhcyhzb3VyY2VGaWxlKSAmJlxuICAgICAgICB0aGlzLnVzZWRJZGVudGlmaWVyTmFtZXMuZ2V0KHNvdXJjZUZpbGUpICEuaW5kZXhPZihuYW1lKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRocm91Z2ggdGhlIHNvdXJjZSBmaWxlIGFuZCBzZWFyY2ggZm9yIGFuIGlkZW50aWZpZXIgbWF0Y2hpbmdcbiAgICAvLyB0aGUgZ2l2ZW4gbmFtZS4gSW4gdGhhdCBjYXNlLCBpdCdzIG5vdCBndWFyYW50ZWVkIHRoYXQgdGhpcyBuYW1lXG4gICAgLy8gaXMgdW5pcXVlIGluIHRoZSBnaXZlbiBkZWNsYXJhdGlvbiBzY29wZSBhbmQgd2UganVzdCByZXR1cm4gZmFsc2UuXG4gICAgY29uc3Qgbm9kZVF1ZXVlOiB0cy5Ob2RlW10gPSBbc291cmNlRmlsZV07XG4gICAgd2hpbGUgKG5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSAhO1xuICAgICAgaWYgKHRzLmlzSWRlbnRpZmllcihub2RlKSAmJiBub2RlLnRleHQgPT09IG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgbm9kZVF1ZXVlLnB1c2goLi4ubm9kZS5nZXRDaGlsZHJlbigpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9yZWNvcmRVc2VkSWRlbnRpZmllcihzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlLCBpZGVudGlmaWVyTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy51c2VkSWRlbnRpZmllck5hbWVzLnNldChcbiAgICAgICAgc291cmNlRmlsZSwgKHRoaXMudXNlZElkZW50aWZpZXJOYW1lcy5nZXQoc291cmNlRmlsZSkgfHwgW10pLmNvbmNhdChpZGVudGlmaWVyTmFtZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgdGhlIGZ1bGwgZW5kIG9mIGEgZ2l2ZW4gbm9kZS4gQnkgZGVmYXVsdCB0aGUgZW5kIHBvc2l0aW9uIG9mIGEgbm9kZSBpc1xuICAgKiBiZWZvcmUgYWxsIHRyYWlsaW5nIGNvbW1lbnRzLiBUaGlzIGNvdWxkIG1lYW4gdGhhdCBnZW5lcmF0ZWQgaW1wb3J0cyBzaGlmdCBjb21tZW50cy5cbiAgICovXG4gIHByaXZhdGUgX2dldEVuZFBvc2l0aW9uT2ZOb2RlKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBjb25zdCBub2RlRW5kUG9zID0gbm9kZS5nZXRFbmQoKTtcbiAgICBjb25zdCBjb21tZW50UmFuZ2VzID0gdHMuZ2V0VHJhaWxpbmdDb21tZW50UmFuZ2VzKG5vZGUuZ2V0U291cmNlRmlsZSgpLnRleHQsIG5vZGVFbmRQb3MpO1xuICAgIGlmICghY29tbWVudFJhbmdlcyB8fCAhY29tbWVudFJhbmdlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBub2RlRW5kUG9zO1xuICAgIH1cbiAgICByZXR1cm4gY29tbWVudFJhbmdlc1tjb21tZW50UmFuZ2VzLmxlbmd0aCAtIDFdICEuZW5kO1xuICB9XG59XG4iXX0=