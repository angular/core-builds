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
        define("@angular/core/schematics/utils/import_manager", ["require", "exports", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImportManager = void 0;
    const path_1 = require("path");
    const typescript_1 = __importDefault(require("typescript"));
    /** Whether the current TypeScript version is after 4.9. */
    const IS_AFTER_TS_49 = isAfterVersion(4, 9);
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
            const sourceDir = (0, path_1.dirname)(sourceFile.fileName);
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
                if (!typescript_1.default.isImportDeclaration(statement) || !typescript_1.default.isStringLiteral(statement.moduleSpecifier) ||
                    !statement.importClause) {
                    continue;
                }
                if (importStartIndex === 0) {
                    importStartIndex = this._getEndPositionOfNode(statement);
                }
                const moduleSpecifier = statement.moduleSpecifier.text;
                if (moduleSpecifier.startsWith('.') &&
                    (0, path_1.resolve)(sourceDir, moduleSpecifier) !== (0, path_1.resolve)(sourceDir, moduleName) ||
                    moduleSpecifier !== moduleName) {
                    continue;
                }
                if (statement.importClause.namedBindings) {
                    const namedBindings = statement.importClause.namedBindings;
                    // In case a "Type" symbol is imported, we can't use namespace imports
                    // because these only export symbols available at runtime (no types)
                    if (typescript_1.default.isNamespaceImport(namedBindings) && !typeImport) {
                        return typescript_1.default.factory.createPropertyAccessExpression(typescript_1.default.factory.createIdentifier(namedBindings.name.text), typescript_1.default.factory.createIdentifier(symbolName || 'default'));
                    }
                    else if (typescript_1.default.isNamedImports(namedBindings) && symbolName) {
                        const existingElement = namedBindings.elements.find(e => e.propertyName ? e.propertyName.text === symbolName : e.name.text === symbolName);
                        if (existingElement) {
                            return typescript_1.default.factory.createIdentifier(existingElement.name.text);
                        }
                        // In case the symbol could not be found in an existing import, we
                        // keep track of the import declaration as it can be updated to include
                        // the specified symbol name without having to create a new import.
                        existingImport = statement;
                    }
                }
                else if (statement.importClause.name && !symbolName) {
                    return typescript_1.default.factory.createIdentifier(statement.importClause.name.text);
                }
            }
            if (existingImport) {
                const propertyIdentifier = typescript_1.default.factory.createIdentifier(symbolName);
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
                const propertyIdentifier = typescript_1.default.factory.createIdentifier(symbolName);
                const generatedUniqueIdentifier = this._getUniqueIdentifier(sourceFile, symbolName);
                const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== symbolName;
                identifier = needsGeneratedUniqueName ? generatedUniqueIdentifier : propertyIdentifier;
                newImport = createImportDeclaration(undefined, typescript_1.default.factory.createImportClause(false, undefined, typescript_1.default.factory.createNamedImports([typescript_1.default.factory.createImportSpecifier(false, needsGeneratedUniqueName ? propertyIdentifier : undefined, identifier)])), typescript_1.default.factory.createStringLiteral(moduleName));
            }
            else {
                identifier = this._getUniqueIdentifier(sourceFile, 'defaultExport');
                newImport = createImportDeclaration(undefined, typescript_1.default.factory.createImportClause(false, identifier, undefined), typescript_1.default.factory.createStringLiteral(moduleName));
            }
            const newImportText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newImport, sourceFile);
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
                const newNamedBindings = typescript_1.default.factory.updateNamedImports(namedBindings, namedBindings.elements.concat(expressions.map(({ propertyName, importName }) => typescript_1.default.factory.createImportSpecifier(false, propertyName, importName))));
                const newNamedBindingsText = this.printer.printNode(typescript_1.default.EmitHint.Unspecified, newNamedBindings, sourceFile);
                recorder.updateExistingImport(namedBindings, newNamedBindingsText);
            });
        }
        /** Gets an unique identifier with a base name for the given source file. */
        _getUniqueIdentifier(sourceFile, baseName) {
            if (this.isUniqueIdentifierName(sourceFile, baseName)) {
                this._recordUsedIdentifier(sourceFile, baseName);
                return typescript_1.default.factory.createIdentifier(baseName);
            }
            let name = null;
            let counter = 1;
            do {
                name = `${baseName}_${counter++}`;
            } while (!this.isUniqueIdentifierName(sourceFile, name));
            this._recordUsedIdentifier(sourceFile, name);
            return typescript_1.default.factory.createIdentifier(name);
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
                if (typescript_1.default.isIdentifier(node) && node.text === name) {
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
            const commentRanges = typescript_1.default.getTrailingCommentRanges(node.getSourceFile().text, nodeEndPos);
            if (!commentRanges || !commentRanges.length) {
                return nodeEndPos;
            }
            return commentRanges[commentRanges.length - 1].end;
        }
    }
    exports.ImportManager = ImportManager;
    /**
     * Creates a `ts.ImportDeclaration` declaration.
     *
     * TODO(crisbeto): this is a backwards-compatibility layer for versions of TypeScript less than 4.9.
     * We should remove it once we have dropped support for the older versions.
     */
    function createImportDeclaration(modifiers, importClause, moduleSpecifier, assertClause) {
        return IS_AFTER_TS_49 ? typescript_1.default.factory.createImportDeclaration(modifiers, importClause, moduleSpecifier, assertClause) :
            typescript_1.default.factory.createImportDeclaration(undefined, modifiers, importClause, moduleSpecifier, assertClause);
    }
    /** Checks if the current version of TypeScript is after the specified major/minor versions. */
    function isAfterVersion(targetMajor, targetMinor) {
        const [major, minor] = typescript_1.default.versionMajorMinor.split('.').map(part => parseInt(part));
        if (major < targetMajor) {
            return false;
        }
        return major === targetMajor ? minor >= targetMinor : true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0X21hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NjaGVtYXRpY3MvdXRpbHMvaW1wb3J0X21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7O0lBRUgsK0JBQXNDO0lBQ3RDLDREQUE0QjtJQUU1QiwyREFBMkQ7SUFDM0QsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQVE1Qzs7OztPQUlHO0lBQ0gsTUFBYSxhQUFhO1FBaUJ4QixZQUNZLGlCQUFxRSxFQUNyRSxPQUFtQjtZQURuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9EO1lBQ3JFLFlBQU8sR0FBUCxPQUFPLENBQVk7WUFsQi9CLHVGQUF1RjtZQUMvRSxtQkFBYyxHQUNsQixJQUFJLEdBQUcsRUFBcUYsQ0FBQztZQUNqRyxzRUFBc0U7WUFDOUQsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQTJCLENBQUM7WUFDakU7OztlQUdHO1lBQ0ssZ0JBQVcsR0FLYixFQUFFLENBQUM7UUFJeUIsQ0FBQztRQUVuQzs7O1dBR0c7UUFDSCxxQkFBcUIsQ0FDakIsVUFBeUIsRUFBRSxVQUF1QixFQUFFLFVBQWtCLEVBQ3RFLFVBQVUsR0FBRyxLQUFLO1lBQ3BCLE1BQU0sU0FBUyxHQUFHLElBQUEsY0FBTyxFQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvQyxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztZQUN6QixJQUFJLGNBQWMsR0FBOEIsSUFBSSxDQUFDO1lBRXJELGlGQUFpRjtZQUNqRixtRkFBbUY7WUFDbkYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQ3RDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLElBQUksQ0FBQyxD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QTJDLEVBQUUsWUFBdUMsRUFDcEYsZUFBOEIsRUFBRSxZQUE4QjtRQUNoRSxPQUFPLGNBQWMsQ0FBQyxDQUFDLENBQUUsb0JBQUUsQ0FBQyxPQUFPLENBQUMsdUJBQStCLENBQ3ZDLFNBQVMsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDNUQsb0JBQUUsQ0FBQyxPQUFPLENBQUMsdUJBQStCLENBQ3ZDLFNBQVMsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBRUQsK0ZBQStGO0lBQy9GLFNBQVMsY0FBYyxDQUFDLFdBQW1CLEVBQUUsV0FBbUI7UUFDOUQsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxvQkFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUVuRixJQUFJLEtBQUssR0FBRyxXQUFXLEVBQUU7WUFDdkIsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELE9BQU8sS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzdELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkaXJuYW1lLCByZXNvbHZlfSBmcm9tICdwYXRoJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuLyoqIFdoZXRoZXIgdGhlIGN1cnJlbnQgVHlwZVNjcmlwdCB2ZXJzaW9uIGlzIGFmdGVyIDQuOS4gKi9cbmNvbnN0IElTX0FGVEVSX1RTXzQ5ID0gaXNBZnRlclZlcnNpb24oNCwgOSk7XG5cbi8qKiBVcGRhdGUgcmVjb3JkZXIgZm9yIG1hbmFnaW5nIGltcG9ydHMuICovXG5leHBvcnQgaW50ZXJmYWNlIEltcG9ydE1hbmFnZXJVcGRhdGVSZWNvcmRlciB7XG4gIGFkZE5ld0ltcG9ydChzdGFydDogbnVtYmVyLCBpbXBvcnRUZXh0OiBzdHJpbmcpOiB2b2lkO1xuICB1cGRhdGVFeGlzdGluZ0ltcG9ydChuYW1lZEJpbmRpbmdzOiB0cy5OYW1lZEltcG9ydHMsIG5ld05hbWVkQmluZGluZ3M6IHN0cmluZyk6IHZvaWQ7XG59XG5cbi8qKlxuICogSW1wb3J0IG1hbmFnZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBhZGQgVHlwZVNjcmlwdCBpbXBvcnRzIHRvIGdpdmVuIHNvdXJjZVxuICogZmlsZXMuIFRoZSBtYW5hZ2VyIGVuc3VyZXMgdGhhdCBtdWx0aXBsZSB0cmFuc2Zvcm1hdGlvbnMgYXJlIGFwcGxpZWQgcHJvcGVybHlcbiAqIHdpdGhvdXQgc2hpZnRlZCBvZmZzZXRzIGFuZCB0aGF0IHNpbWlsYXIgZXhpc3RpbmcgaW1wb3J0IGRlY2xhcmF0aW9ucyBhcmUgcmUtdXNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEltcG9ydE1hbmFnZXIge1xuICAvKiogTWFwIG9mIGltcG9ydCBkZWNsYXJhdGlvbnMgdGhhdCBuZWVkIHRvIGJlIHVwZGF0ZWQgdG8gaW5jbHVkZSB0aGUgZ2l2ZW4gc3ltYm9scy4gKi9cbiAgcHJpdmF0ZSB1cGRhdGVkSW1wb3J0cyA9XG4gICAgICBuZXcgTWFwPHRzLkltcG9ydERlY2xhcmF0aW9uLCB7cHJvcGVydHlOYW1lPzogdHMuSWRlbnRpZmllciwgaW1wb3J0TmFtZTogdHMuSWRlbnRpZmllcn1bXT4oKTtcbiAgLyoqIE1hcCBvZiBzb3VyY2UtZmlsZXMgYW5kIHRoZWlyIHByZXZpb3VzbHkgdXNlZCBpZGVudGlmaWVyIG5hbWVzLiAqL1xuICBwcml2YXRlIHVzZWRJZGVudGlmaWVyTmFtZXMgPSBuZXcgTWFwPHRzLlNvdXJjZUZpbGUsIHN0cmluZ1tdPigpO1xuICAvKipcbiAgICogQXJyYXkgb2YgcHJldmlvdXNseSByZXNvbHZlZCBzeW1ib2wgaW1wb3J0cy4gQ2FjaGUgY2FuIGJlIHJlLXVzZWQgdG8gcmV0dXJuXG4gICAqIHRoZSBzYW1lIGlkZW50aWZpZXIgd2l0aG91dCBjaGVja2luZyB0aGUgc291cmNlLWZpbGUgYWdhaW4uXG4gICAqL1xuICBwcml2YXRlIGltcG9ydENhY2hlOiB7XG4gICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSxcbiAgICBzeW1ib2xOYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBtb2R1bGVOYW1lOiBzdHJpbmcsXG4gICAgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllclxuICB9W10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZ2V0VXBkYXRlUmVjb3JkZXI6IChzZjogdHMuU291cmNlRmlsZSkgPT4gSW1wb3J0TWFuYWdlclVwZGF0ZVJlY29yZGVyLFxuICAgICAgcHJpdmF0ZSBwcmludGVyOiB0cy5QcmludGVyKSB7fVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGltcG9ydCB0byB0aGUgZ2l2ZW4gc291cmNlLWZpbGUgYW5kIHJldHVybnMgdGhlIFR5cGVTY3JpcHRcbiAgICogaWRlbnRpZmllciB0aGF0IGNhbiBiZSB1c2VkIHRvIGFjY2VzcyB0aGUgbmV3bHkgaW1wb3J0ZWQgc3ltYm9sLlxuICAgKi9cbiAgYWRkSW1wb3J0VG9Tb3VyY2VGaWxlKFxuICAgICAgc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgc3ltYm9sTmFtZTogc3RyaW5nfG51bGwsIG1vZHVsZU5hbWU6IHN0cmluZyxcbiAgICAgIHR5cGVJbXBvcnQgPSBmYWxzZSk6IHRzLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IHNvdXJjZURpciA9IGRpcm5hbWUoc291cmNlRmlsZS5maWxlTmFtZSk7XG4gICAgbGV0IGltcG9ydFN0YXJ0SW5kZXggPSAwO1xuICAgIGxldCBleGlzdGluZ0ltcG9ydDogdHMuSW1wb3J0RGVjbGFyYXRpb258bnVsbCA9IG51bGw7XG5cbiAgICAvLyBJbiBjYXNlIHRoZSBnaXZlbiBpbXBvcnQgaGFzIGJlZW4gYWxyZWFkeSBnZW5lcmF0ZWQgcHJldmlvdXNseSwgd2UganVzdCByZXR1cm5cbiAgICAvLyB0aGUgcHJldmlvdXMgZ2VuZXJhdGVkIGlkZW50aWZpZXIgaW4gb3JkZXIgdG8gYXZvaWQgZHVwbGljYXRlIGdlbmVyYXRlZCBpbXBvcnRzLlxuICAgIGNvbnN0IGNhY2hlZEltcG9ydCA9IHRoaXMuaW1wb3J0Q2FjaGUuZmluZChcbiAgICAgICAgYyA9PiBjLnNvdXJjZUZpbGUgPT09IHNvdXJjZUZpbGUgJiYgYy5zeW1ib2xOYW1lID09PSBzeW1ib2xOYW1lICYmXG4gICAgICAgICAgICBjLm1vZHVsZU5hbWUgPT09IG1vZHVsZU5hbWUpO1xuICAgIGlmIChjYWNoZWRJbXBvcnQpIHtcbiAgICAgIHJldHVybiBjYWNoZWRJbXBvcnQuaWRlbnRpZmllcjtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRocm91Z2ggYWxsIHNvdXJjZS1maWxlIHRvcC1sZXZlbCBzdGF0ZW1lbnRzIGFuZCBzZWFyY2ggZm9yIGltcG9ydCBkZWNsYXJhdGlvbnNcbiAgICAvLyB0aGF0IGFscmVhZHkgbWF0Y2ggdGhlIHNwZWNpZmllZCBcIm1vZHVsZU5hbWVcIiBhbmQgY2FuIGJlIHVwZGF0ZWQgdG8gaW1wb3J0IHRoZVxuICAgIC8vIGdpdmVuIHN5bWJvbC4gSWYgbm8gbWF0Y2hpbmcgaW1wb3J0IGNhbiBiZSBmb3VuZCwgdGhlIGxhc3QgaW1wb3J0IGluIHRoZSBzb3VyY2UtZmlsZVxuICAgIC8vIHdpbGwgYmUgdXNlZCBhcyBzdGFydGluZyBwb2ludCBmb3IgYSBuZXcgaW1wb3J0IHRoYXQgd2lsbCBiZSBnZW5lcmF0ZWQuXG4gICAgZm9yIChsZXQgaSA9IHNvdXJjZUZpbGUuc3RhdGVtZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3Qgc3RhdGVtZW50ID0gc291cmNlRmlsZS5zdGF0ZW1lbnRzW2ldO1xuXG4gICAgICBpZiAoIXRzLmlzSW1wb3J0RGVjbGFyYXRpb24oc3RhdGVtZW50KSB8fCAhdHMuaXNTdHJpbmdMaXRlcmFsKHN0YXRlbWVudC5tb2R1bGVTcGVjaWZpZXIpIHx8XG4gICAgICAgICAgIXN0YXRlbWVudC5pbXBvcnRDbGF1c2UpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbXBvcnRTdGFydEluZGV4ID09PSAwKSB7XG4gICAgICAgIGltcG9ydFN0YXJ0SW5kZXggPSB0aGlzLl9nZXRFbmRQb3NpdGlvbk9mTm9kZShzdGF0ZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2R1bGVTcGVjaWZpZXIgPSBzdGF0ZW1lbnQubW9kdWxlU3BlY2lmaWVyLnRleHQ7XG5cbiAgICAgIGlmIChtb2R1bGVTcGVjaWZpZXIuc3RhcnRzV2l0aCgnLicpICYmXG4gICAgICAgICAgICAgIHJlc29sdmUoc291cmNlRGlyLCBtb2R1bGVTcGVjaWZpZXIpICE9PSByZXNvbHZlKHNvdXJjZURpciwgbW9kdWxlTmFtZSkgfHxcbiAgICAgICAgICBtb2R1bGVTcGVjaWZpZXIgIT09IG1vZHVsZU5hbWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZW1lbnQuaW1wb3J0Q2xhdXNlLm5hbWVkQmluZGluZ3MpIHtcbiAgICAgICAgY29uc3QgbmFtZWRCaW5kaW5ncyA9IHN0YXRlbWVudC5pbXBvcnRDbGF1c2UubmFtZWRCaW5kaW5ncztcblxuICAgICAgICAvLyBJbiBjYXNlIGEgXCJUeXBlXCIgc3ltYm9sIGlzIGltcG9ydGVkLCB3ZSBjYW4ndCB1c2UgbmFtZXNwYWNlIGltcG9ydHNcbiAgICAgICAgLy8gYmVjYXVzZSB0aGVzZSBvbmx5IGV4cG9ydCBzeW1ib2xzIGF2YWlsYWJsZSBhdCBydW50aW1lIChubyB0eXBlcylcbiAgICAgICAgaWYgKHRzLmlzTmFtZXNwYWNlSW1wb3J0KG5hbWVkQmluZGluZ3MpICYmICF0eXBlSW1wb3J0KSB7XG4gICAgICAgICAgcmV0dXJuIHRzLmZhY3RvcnkuY3JlYXRlUHJvcGVydHlBY2Nlc3NFeHByZXNzaW9uKFxuICAgICAgICAgICAgICB0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIobmFtZWRCaW5kaW5ncy5uYW1lLnRleHQpLFxuICAgICAgICAgICAgICB0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIoc3ltYm9sTmFtZSB8fCAnZGVmYXVsdCcpKTtcbiAgICAgICAgfSBlbHNlIGlmICh0cy5pc05hbWVkSW1wb3J0cyhuYW1lZEJpbmRpbmdzKSAmJiBzeW1ib2xOYW1lKSB7XG4gICAgICAgICAgY29uc3QgZXhpc3RpbmdFbGVtZW50ID0gbmFtZWRCaW5kaW5ncy5lbGVtZW50cy5maW5kKFxuICAgICAgICAgICAgICBlID0+XG4gICAgICAgICAgICAgICAgICBlLnByb3BlcnR5TmFtZSA/IGUucHJvcGVydHlOYW1lLnRleHQgPT09IHN5bWJvbE5hbWUgOiBlLm5hbWUudGV4dCA9PT0gc3ltYm9sTmFtZSk7XG5cbiAgICAgICAgICBpZiAoZXhpc3RpbmdFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdHMuZmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKGV4aXN0aW5nRWxlbWVudC5uYW1lLnRleHQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEluIGNhc2UgdGhlIHN5bWJvbCBjb3VsZCBub3QgYmUgZm91bmQgaW4gYW4gZXhpc3RpbmcgaW1wb3J0LCB3ZVxuICAgICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgdGhlIGltcG9ydCBkZWNsYXJhdGlvbiBhcyBpdCBjYW4gYmUgdXBkYXRlZCB0byBpbmNsdWRlXG4gICAgICAgICAgLy8gdGhlIHNwZWNpZmllZCBzeW1ib2wgbmFtZSB3aXRob3V0IGhhdmluZyB0byBjcmVhdGUgYSBuZXcgaW1wb3J0LlxuICAgICAgICAgIGV4aXN0aW5nSW1wb3J0ID0gc3RhdGVtZW50O1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlbWVudC5pbXBvcnRDbGF1c2UubmFtZSAmJiAhc3ltYm9sTmFtZSkge1xuICAgICAgICByZXR1cm4gdHMuZmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKHN0YXRlbWVudC5pbXBvcnRDbGF1c2UubmFtZS50ZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXhpc3RpbmdJbXBvcnQpIHtcbiAgICAgIGNvbnN0IHByb3BlcnR5SWRlbnRpZmllciA9IHRzLmZhY3RvcnkuY3JlYXRlSWRlbnRpZmllcihzeW1ib2xOYW1lISk7XG4gICAgICBjb25zdCBnZW5lcmF0ZWRVbmlxdWVJZGVudGlmaWVyID0gdGhpcy5fZ2V0VW5pcXVlSWRlbnRpZmllcihzb3VyY2VGaWxlLCBzeW1ib2xOYW1lISk7XG4gICAgICBjb25zdCBuZWVkc0dlbmVyYXRlZFVuaXF1ZU5hbWUgPSBnZW5lcmF0ZWRVbmlxdWVJZGVudGlmaWVyLnRleHQgIT09IHN5bWJvbE5hbWU7XG4gICAgICBjb25zdCBpbXBvcnROYW1lID0gbmVlZHNHZW5lcmF0ZWRVbmlxdWVOYW1lID8gZ2VuZXJhdGVkVW5pcXVlSWRlbnRpZmllciA6IHByb3BlcnR5SWRlbnRpZmllcjtcblxuICAgICAgLy8gU2luY2UgaXQgY2FuIGhhcHBlbiB0aGF0IG11bHRpcGxlIGNsYXNzZXMgbmVlZCB0byBiZSBpbXBvcnRlZCB3aXRoaW4gdGhlXG4gICAgICAvLyBzcGVjaWZpZWQgc291cmNlIGZpbGUgYW5kIHdlIHdhbnQgdG8gYWRkIHRoZSBpZGVudGlmaWVycyB0byB0aGUgZXhpc3RpbmdcbiAgICAgIC8vIGltcG9ydCBkZWNsYXJhdGlvbiwgd2UgbmVlZCB0byBrZWVwIHRyYWNrIG9mIHRoZSB1cGRhdGVkIGltcG9ydCBkZWNsYXJhdGlvbnMuXG4gICAgICAvLyBXZSBjYW4ndCBkaXJlY3RseSB1cGRhdGUgdGhlIGltcG9ydCBkZWNsYXJhdGlvbiBmb3IgZWFjaCBpZGVudGlmaWVyIGFzIHRoaXNcbiAgICAgIC8vIHdvdWxkIHRocm93IG9mZiB0aGUgcmVjb3JkZXIgb2Zmc2V0cy4gV2UgbmVlZCB0byBrZWVwIHRyYWNrIG9mIHRoZSBuZXcgaWRlbnRpZmllcnNcbiAgICAgIC8vIGZvciB0aGUgaW1wb3J0IGFuZCBwZXJmb3JtIHRoZSBpbXBvcnQgdHJhbnNmb3JtYXRpb24gYXMgYmF0Y2hlcyBwZXIgc291cmNlLWZpbGUuXG4gICAgICB0aGlzLnVwZGF0ZWRJbXBvcnRzLnNldChcbiAgICAgICAgICBleGlzdGluZ0ltcG9ydCwgKHRoaXMudXBkYXRlZEltcG9ydHMuZ2V0KGV4aXN0aW5nSW1wb3J0KSB8fCBbXSkuY29uY2F0KHtcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZTogbmVlZHNHZW5lcmF0ZWRVbmlxdWVOYW1lID8gcHJvcGVydHlJZGVudGlmaWVyIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaW1wb3J0TmFtZTogaW1wb3J0TmFtZSxcbiAgICAgICAgICB9KSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHVwZGF0ZWQgaW1wb3J0cyBzbyB0aGF0IHdlIGRvbid0IGdlbmVyYXRlIGR1cGxpY2F0ZVxuICAgICAgLy8gc2ltaWxhciBpbXBvcnRzIGFzIHRoZXNlIGNhbid0IGJlIHN0YXRpY2FsbHkgYW5hbHl6ZWQgaW4gdGhlIHNvdXJjZS1maWxlIHlldC5cbiAgICAgIHRoaXMuaW1wb3J0Q2FjaGUucHVzaCh7c291cmNlRmlsZSwgbW9kdWxlTmFtZSwgc3ltYm9sTmFtZSwgaWRlbnRpZmllcjogaW1wb3J0TmFtZX0pO1xuXG4gICAgICByZXR1cm4gaW1wb3J0TmFtZTtcbiAgICB9XG5cbiAgICBsZXQgaWRlbnRpZmllcjogdHMuSWRlbnRpZmllcnxudWxsID0gbnVsbDtcbiAgICBsZXQgbmV3SW1wb3J0OiB0cy5JbXBvcnREZWNsYXJhdGlvbnxudWxsID0gbnVsbDtcblxuICAgIGlmIChzeW1ib2xOYW1lKSB7XG4gICAgICBjb25zdCBwcm9wZXJ0eUlkZW50aWZpZXIgPSB0cy5mYWN0b3J5LmNyZWF0ZUlkZW50aWZpZXIoc3ltYm9sTmFtZSk7XG4gICAgICBjb25zdCBnZW5lcmF0ZWRVbmlxdWVJZGVudGlmaWVyID0gdGhpcy5fZ2V0VW5pcXVlSWRlbnRpZmllcihzb3VyY2VGaWxlLCBzeW1ib2xOYW1lKTtcbiAgICAgIGNvbnN0IG5lZWRzR2VuZXJhdGVkVW5pcXVlTmFtZSA9IGdlbmVyYXRlZFVuaXF1ZUlkZW50aWZpZXIudGV4dCAhPT0gc3ltYm9sTmFtZTtcbiAgICAgIGlkZW50aWZpZXIgPSBuZWVkc0dlbmVyYXRlZFVuaXF1ZU5hbWUgPyBnZW5lcmF0ZWRVbmlxdWVJZGVudGlmaWVyIDogcHJvcGVydHlJZGVudGlmaWVyO1xuXG4gICAgICBuZXdJbXBvcnQgPSBjcmVhdGVJbXBvcnREZWNsYXJhdGlvbihcbiAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgdHMuZmFjdG9yeS5jcmVhdGVJbXBvcnRDbGF1c2UoXG4gICAgICAgICAgICAgIGZhbHNlLCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlTmFtZWRJbXBvcnRzKFt0cy5mYWN0b3J5LmNyZWF0ZUltcG9ydFNwZWNpZmllcihcbiAgICAgICAgICAgICAgICAgIGZhbHNlLCBuZWVkc0dlbmVyYXRlZFVuaXF1ZU5hbWUgPyBwcm9wZXJ0eUlkZW50aWZpZXIgOiB1bmRlZmluZWQsIGlkZW50aWZpZXIpXSkpLFxuICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlU3RyaW5nTGl0ZXJhbChtb2R1bGVOYW1lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkZW50aWZpZXIgPSB0aGlzLl9nZXRVbmlxdWVJZGVudGlmaWVyKHNvdXJjZUZpbGUsICdkZWZhdWx0RXhwb3J0Jyk7XG4gICAgICBuZXdJbXBvcnQgPSBjcmVhdGVJbXBvcnREZWNsYXJhdGlvbihcbiAgICAgICAgICB1bmRlZmluZWQsIHRzLmZhY3RvcnkuY3JlYXRlSW1wb3J0Q2xhdXNlKGZhbHNlLCBpZGVudGlmaWVyLCB1bmRlZmluZWQpLFxuICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlU3RyaW5nTGl0ZXJhbChtb2R1bGVOYW1lKSk7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3SW1wb3J0VGV4dCA9IHRoaXMucHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIG5ld0ltcG9ydCwgc291cmNlRmlsZSk7XG4gICAgLy8gSWYgdGhlIGltcG9ydCBpcyBnZW5lcmF0ZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzb3VyY2UgZmlsZSwgd2Ugd2FudCB0byBhZGRcbiAgICAvLyBhIG5ldy1saW5lIGFmdGVyIHRoZSBpbXBvcnQuIE90aGVyd2lzZSBpZiB0aGUgaW1wb3J0IGlzIGdlbmVyYXRlZCBhZnRlciBhblxuICAgIC8vIGV4aXN0aW5nIGltcG9ydCwgd2UgbmVlZCB0byBwcmVwZW5kIGEgbmV3LWxpbmUgc28gdGhhdCB0aGUgaW1wb3J0IGlzIG5vdCBvblxuICAgIC8vIHRoZSBzYW1lIGxpbmUgYXMgdGhlIGV4aXN0aW5nIGltcG9ydCBhbmNob3IuXG4gICAgdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKVxuICAgICAgICAuYWRkTmV3SW1wb3J0KFxuICAgICAgICAgICAgaW1wb3J0U3RhcnRJbmRleCwgaW1wb3J0U3RhcnRJbmRleCA9PT0gMCA/IGAke25ld0ltcG9ydFRleHR9XFxuYCA6IGBcXG4ke25ld0ltcG9ydFRleHR9YCk7XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBnZW5lcmF0ZWQgaW1wb3J0cyBzbyB0aGF0IHdlIGRvbid0IGdlbmVyYXRlIGR1cGxpY2F0ZVxuICAgIC8vIHNpbWlsYXIgaW1wb3J0cyBhcyB0aGVzZSBjYW4ndCBiZSBzdGF0aWNhbGx5IGFuYWx5emVkIGluIHRoZSBzb3VyY2UtZmlsZSB5ZXQuXG4gICAgdGhpcy5pbXBvcnRDYWNoZS5wdXNoKHtzb3VyY2VGaWxlLCBzeW1ib2xOYW1lLCBtb2R1bGVOYW1lLCBpZGVudGlmaWVyfSk7XG5cbiAgICByZXR1cm4gaWRlbnRpZmllcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGNvbGxlY3RlZCBpbXBvcnQgY2hhbmdlcyB3aXRoaW4gdGhlIGFwcHJvcHJpYXRlIHVwZGF0ZSByZWNvcmRlcnMuIFRoZVxuICAgKiB1cGRhdGVkIGltcG9ydHMgY2FuIG9ubHkgYmUgdXBkYXRlZCAqb25jZSogcGVyIHNvdXJjZS1maWxlIGJlY2F1c2UgcHJldmlvdXMgdXBkYXRlc1xuICAgKiBjb3VsZCBvdGhlcndpc2Ugc2hpZnQgdGhlIHNvdXJjZS1maWxlIG9mZnNldHMuXG4gICAqL1xuICByZWNvcmRDaGFuZ2VzKCkge1xuICAgIHRoaXMudXBkYXRlZEltcG9ydHMuZm9yRWFjaCgoZXhwcmVzc2lvbnMsIGltcG9ydERlY2wpID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZUZpbGUgPSBpbXBvcnREZWNsLmdldFNvdXJjZUZpbGUoKTtcbiAgICAgIGNvbnN0IHJlY29yZGVyID0gdGhpcy5nZXRVcGRhdGVSZWNvcmRlcihzb3VyY2VGaWxlKTtcbiAgICAgIGNvbnN0IG5hbWVkQmluZGluZ3MgPSBpbXBvcnREZWNsLmltcG9ydENsYXVzZSEubmFtZWRCaW5kaW5ncyBhcyB0cy5OYW1lZEltcG9ydHM7XG4gICAgICBjb25zdCBuZXdOYW1lZEJpbmRpbmdzID0gdHMuZmFjdG9yeS51cGRhdGVOYW1lZEltcG9ydHMoXG4gICAgICAgICAgbmFtZWRCaW5kaW5ncyxcbiAgICAgICAgICBuYW1lZEJpbmRpbmdzLmVsZW1lbnRzLmNvbmNhdChleHByZXNzaW9ucy5tYXAoXG4gICAgICAgICAgICAgICh7cHJvcGVydHlOYW1lLCBpbXBvcnROYW1lfSkgPT5cbiAgICAgICAgICAgICAgICAgIHRzLmZhY3RvcnkuY3JlYXRlSW1wb3J0U3BlY2lmaWVyKGZhbHNlLCBwcm9wZXJ0eU5hbWUsIGltcG9ydE5hbWUpKSkpO1xuXG4gICAgICBjb25zdCBuZXdOYW1lZEJpbmRpbmdzVGV4dCA9XG4gICAgICAgICAgdGhpcy5wcmludGVyLnByaW50Tm9kZSh0cy5FbWl0SGludC5VbnNwZWNpZmllZCwgbmV3TmFtZWRCaW5kaW5ncywgc291cmNlRmlsZSk7XG4gICAgICByZWNvcmRlci51cGRhdGVFeGlzdGluZ0ltcG9ydChuYW1lZEJpbmRpbmdzLCBuZXdOYW1lZEJpbmRpbmdzVGV4dCk7XG4gICAgfSk7XG4gIH1cblxuICAvKiogR2V0cyBhbiB1bmlxdWUgaWRlbnRpZmllciB3aXRoIGEgYmFzZSBuYW1lIGZvciB0aGUgZ2l2ZW4gc291cmNlIGZpbGUuICovXG4gIHByaXZhdGUgX2dldFVuaXF1ZUlkZW50aWZpZXIoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgYmFzZU5hbWU6IHN0cmluZyk6IHRzLklkZW50aWZpZXIge1xuICAgIGlmICh0aGlzLmlzVW5pcXVlSWRlbnRpZmllck5hbWUoc291cmNlRmlsZSwgYmFzZU5hbWUpKSB7XG4gICAgICB0aGlzLl9yZWNvcmRVc2VkSWRlbnRpZmllcihzb3VyY2VGaWxlLCBiYXNlTmFtZSk7XG4gICAgICByZXR1cm4gdHMuZmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKGJhc2VOYW1lKTtcbiAgICB9XG5cbiAgICBsZXQgbmFtZSA9IG51bGw7XG4gICAgbGV0IGNvdW50ZXIgPSAxO1xuICAgIGRvIHtcbiAgICAgIG5hbWUgPSBgJHtiYXNlTmFtZX1fJHtjb3VudGVyKyt9YDtcbiAgICB9IHdoaWxlICghdGhpcy5pc1VuaXF1ZUlkZW50aWZpZXJOYW1lKHNvdXJjZUZpbGUsIG5hbWUpKTtcblxuICAgIHRoaXMuX3JlY29yZFVzZWRJZGVudGlmaWVyKHNvdXJjZUZpbGUsIG5hbWUhKTtcbiAgICByZXR1cm4gdHMuZmFjdG9yeS5jcmVhdGVJZGVudGlmaWVyKG5hbWUhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgc3BlY2lmaWVkIGlkZW50aWZpZXIgbmFtZSBpcyB1c2VkIHdpdGhpbiB0aGUgZ2l2ZW5cbiAgICogc291cmNlIGZpbGUuXG4gICAqL1xuICBwcml2YXRlIGlzVW5pcXVlSWRlbnRpZmllck5hbWUoc291cmNlRmlsZTogdHMuU291cmNlRmlsZSwgbmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMudXNlZElkZW50aWZpZXJOYW1lcy5oYXMoc291cmNlRmlsZSkgJiZcbiAgICAgICAgdGhpcy51c2VkSWRlbnRpZmllck5hbWVzLmdldChzb3VyY2VGaWxlKSEuaW5kZXhPZihuYW1lKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRocm91Z2ggdGhlIHNvdXJjZSBmaWxlIGFuZCBzZWFyY2ggZm9yIGFuIGlkZW50aWZpZXIgbWF0Y2hpbmdcbiAgICAvLyB0aGUgZ2l2ZW4gbmFtZS4gSW4gdGhhdCBjYXNlLCBpdCdzIG5vdCBndWFyYW50ZWVkIHRoYXQgdGhpcyBuYW1lXG4gICAgLy8gaXMgdW5pcXVlIGluIHRoZSBnaXZlbiBkZWNsYXJhdGlvbiBzY29wZSBhbmQgd2UganVzdCByZXR1cm4gZmFsc2UuXG4gICAgY29uc3Qgbm9kZVF1ZXVlOiB0cy5Ob2RlW10gPSBbc291cmNlRmlsZV07XG4gICAgd2hpbGUgKG5vZGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2RlUXVldWUuc2hpZnQoKSE7XG4gICAgICBpZiAodHMuaXNJZGVudGlmaWVyKG5vZGUpICYmIG5vZGUudGV4dCA9PT0gbmFtZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBub2RlUXVldWUucHVzaCguLi5ub2RlLmdldENoaWxkcmVuKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX3JlY29yZFVzZWRJZGVudGlmaWVyKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUsIGlkZW50aWZpZXJOYW1lOiBzdHJpbmcpIHtcbiAgICB0aGlzLnVzZWRJZGVudGlmaWVyTmFtZXMuc2V0KFxuICAgICAgICBzb3VyY2VGaWxlLCAodGhpcy51c2VkSWRlbnRpZmllck5hbWVzLmdldChzb3VyY2VGaWxlKSB8fCBbXSkuY29uY2F0KGlkZW50aWZpZXJOYW1lKSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgZnVsbCBlbmQgb2YgYSBnaXZlbiBub2RlLiBCeSBkZWZhdWx0IHRoZSBlbmQgcG9zaXRpb24gb2YgYSBub2RlIGlzXG4gICAqIGJlZm9yZSBhbGwgdHJhaWxpbmcgY29tbWVudHMuIFRoaXMgY291bGQgbWVhbiB0aGF0IGdlbmVyYXRlZCBpbXBvcnRzIHNoaWZ0IGNvbW1lbnRzLlxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0RW5kUG9zaXRpb25PZk5vZGUobm9kZTogdHMuTm9kZSkge1xuICAgIGNvbnN0IG5vZGVFbmRQb3MgPSBub2RlLmdldEVuZCgpO1xuICAgIGNvbnN0IGNvbW1lbnRSYW5nZXMgPSB0cy5nZXRUcmFpbGluZ0NvbW1lbnRSYW5nZXMobm9kZS5nZXRTb3VyY2VGaWxlKCkudGV4dCwgbm9kZUVuZFBvcyk7XG4gICAgaWYgKCFjb21tZW50UmFuZ2VzIHx8ICFjb21tZW50UmFuZ2VzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG5vZGVFbmRQb3M7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50UmFuZ2VzW2NvbW1lbnRSYW5nZXMubGVuZ3RoIC0gMV0hLmVuZDtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBgdHMuSW1wb3J0RGVjbGFyYXRpb25gIGRlY2xhcmF0aW9uLlxuICpcbiAqIFRPRE8oY3Jpc2JldG8pOiB0aGlzIGlzIGEgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgbGF5ZXIgZm9yIHZlcnNpb25zIG9mIFR5cGVTY3JpcHQgbGVzcyB0aGFuIDQuOS5cbiAqIFdlIHNob3VsZCByZW1vdmUgaXQgb25jZSB3ZSBoYXZlIGRyb3BwZWQgc3VwcG9ydCBmb3IgdGhlIG9sZGVyIHZlcnNpb25zLlxuICovXG5mdW5jdGlvbiBjcmVhdGVJbXBvcnREZWNsYXJhdGlvbihcbiAgICBtb2RpZmllcnM6IHJlYWRvbmx5IHRzLk1vZGlmaWVyW118dW5kZWZpbmVkLCBpbXBvcnRDbGF1c2U6IHRzLkltcG9ydENsYXVzZXx1bmRlZmluZWQsXG4gICAgbW9kdWxlU3BlY2lmaWVyOiB0cy5FeHByZXNzaW9uLCBhc3NlcnRDbGF1c2U/OiB0cy5Bc3NlcnRDbGF1c2UpOiB0cy5JbXBvcnREZWNsYXJhdGlvbiB7XG4gIHJldHVybiBJU19BRlRFUl9UU180OSA/ICh0cy5mYWN0b3J5LmNyZWF0ZUltcG9ydERlY2xhcmF0aW9uIGFzIGFueSkoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcnMsIGltcG9ydENsYXVzZSwgbW9kdWxlU3BlY2lmaWVyLCBhc3NlcnRDbGF1c2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKHRzLmZhY3RvcnkuY3JlYXRlSW1wb3J0RGVjbGFyYXRpb24gYXMgYW55KShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgbW9kaWZpZXJzLCBpbXBvcnRDbGF1c2UsIG1vZHVsZVNwZWNpZmllciwgYXNzZXJ0Q2xhdXNlKTtcbn1cblxuLyoqIENoZWNrcyBpZiB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIFR5cGVTY3JpcHQgaXMgYWZ0ZXIgdGhlIHNwZWNpZmllZCBtYWpvci9taW5vciB2ZXJzaW9ucy4gKi9cbmZ1bmN0aW9uIGlzQWZ0ZXJWZXJzaW9uKHRhcmdldE1ham9yOiBudW1iZXIsIHRhcmdldE1pbm9yOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgW21ham9yLCBtaW5vcl0gPSB0cy52ZXJzaW9uTWFqb3JNaW5vci5zcGxpdCgnLicpLm1hcChwYXJ0ID0+IHBhcnNlSW50KHBhcnQpKTtcblxuICBpZiAobWFqb3IgPCB0YXJnZXRNYWpvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBtYWpvciA9PT0gdGFyZ2V0TWFqb3IgPyBtaW5vciA+PSB0YXJnZXRNaW5vciA6IHRydWU7XG59XG4iXX0=