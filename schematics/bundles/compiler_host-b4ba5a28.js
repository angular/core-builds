'use strict';
/**
 * @license Angular v19.0.0-next.9+sha-6530c5e
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
var checker = require('./checker-3b2ea20f.js');
require('os');
var p = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var p__namespace = /*#__PURE__*/_interopNamespace(p);

/** Tracks changes that have to be made for specific files. */
class ChangeTracker {
    _printer;
    _importRemapper;
    _changes = new Map();
    _importManager;
    _quotesCache = new WeakMap();
    constructor(_printer, _importRemapper) {
        this._printer = _printer;
        this._importRemapper = _importRemapper;
        this._importManager = new checker.ImportManager({
            shouldUseSingleQuotes: (file) => this._getQuoteKind(file) === 0 /* QuoteKind.SINGLE */,
        });
    }
    /**
     * Tracks the insertion of some text.
     * @param sourceFile File in which the text is being inserted.
     * @param start Index at which the text is insert.
     * @param text Text to be inserted.
     */
    insertText(sourceFile, index, text) {
        this._trackChange(sourceFile, { start: index, text });
    }
    /**
     * Replaces text within a file.
     * @param sourceFile File in which to replace the text.
     * @param start Index from which to replace the text.
     * @param removeLength Length of the text being replaced.
     * @param text Text to be inserted instead of the old one.
     */
    replaceText(sourceFile, start, removeLength, text) {
        this._trackChange(sourceFile, { start, removeLength, text });
    }
    /**
     * Replaces the text of an AST node with a new one.
     * @param oldNode Node to be replaced.
     * @param newNode New node to be inserted.
     * @param emitHint Hint when formatting the text of the new node.
     * @param sourceFileWhenPrinting File to use when printing out the new node. This is important
     * when copying nodes from one file to another, because TypeScript might not output literal nodes
     * without it.
     */
    replaceNode(oldNode, newNode, emitHint = ts__default["default"].EmitHint.Unspecified, sourceFileWhenPrinting) {
        const sourceFile = oldNode.getSourceFile();
        this.replaceText(sourceFile, oldNode.getStart(), oldNode.getWidth(), this._printer.printNode(emitHint, newNode, sourceFileWhenPrinting || sourceFile));
    }
    /**
     * Removes the text of an AST node from a file.
     * @param node Node whose text should be removed.
     */
    removeNode(node) {
        this._trackChange(node.getSourceFile(), {
            start: node.getStart(),
            removeLength: node.getWidth(),
            text: '',
        });
    }
    /**
     * Adds an import to a file.
     * @param sourceFile File to which to add the import.
     * @param symbolName Symbol being imported.
     * @param moduleName Module from which the symbol is imported.
     * @param alias Alias to use for the import.
     */
    addImport(sourceFile, symbolName, moduleName, alias) {
        if (this._importRemapper) {
            moduleName = this._importRemapper(moduleName, sourceFile.fileName);
        }
        // It's common for paths to be manipulated with Node's `path` utilties which
        // can yield a path with back slashes. Normalize them since outputting such
        // paths will also cause TS to escape the forward slashes.
        moduleName = normalizePath(moduleName);
        if (!this._changes.has(sourceFile)) {
            this._changes.set(sourceFile, []);
        }
        return this._importManager.addImport({
            requestedFile: sourceFile,
            exportSymbolName: symbolName,
            exportModuleSpecifier: moduleName,
            unsafeAliasOverride: alias,
        });
    }
    /**
     * Removes an import from a file.
     * @param sourceFile File from which to remove the import.
     * @param symbolName Original name of the symbol to be removed. Used even if the import is aliased.
     * @param moduleName Module from which the symbol is imported.
     */
    removeImport(sourceFile, symbolName, moduleName) {
        // It's common for paths to be manipulated with Node's `path` utilties which
        // can yield a path with back slashes. Normalize them since outputting such
        // paths will also cause TS to escape the forward slashes.
        moduleName = normalizePath(moduleName);
        if (!this._changes.has(sourceFile)) {
            this._changes.set(sourceFile, []);
        }
        this._importManager.removeImport(sourceFile, symbolName, moduleName);
    }
    /**
     * Gets the changes that should be applied to all the files in the migration.
     * The changes are sorted in the order in which they should be applied.
     */
    recordChanges() {
        this._recordImports();
        return this._changes;
    }
    /**
     * Clear the tracked changes
     */
    clearChanges() {
        this._changes.clear();
    }
    /**
     * Adds a change to a `ChangesByFile` map.
     * @param file File that the change is associated with.
     * @param change Change to be added.
     */
    _trackChange(file, change) {
        const changes = this._changes.get(file);
        if (changes) {
            // Insert the changes in reverse so that they're applied in reverse order.
            // This ensures that the offsets of subsequent changes aren't affected by
            // previous changes changing the file's text.
            const insertIndex = changes.findIndex((current) => current.start <= change.start);
            if (insertIndex === -1) {
                changes.push(change);
            }
            else {
                changes.splice(insertIndex, 0, change);
            }
        }
        else {
            this._changes.set(file, [change]);
        }
    }
    /** Determines what kind of quotes to use for a specific file. */
    _getQuoteKind(sourceFile) {
        if (this._quotesCache.has(sourceFile)) {
            return this._quotesCache.get(sourceFile);
        }
        let kind = 0 /* QuoteKind.SINGLE */;
        for (const statement of sourceFile.statements) {
            if (ts__default["default"].isImportDeclaration(statement) && ts__default["default"].isStringLiteral(statement.moduleSpecifier)) {
                kind = statement.moduleSpecifier.getText()[0] === '"' ? 1 /* QuoteKind.DOUBLE */ : 0 /* QuoteKind.SINGLE */;
                this._quotesCache.set(sourceFile, kind);
                break;
            }
        }
        return kind;
    }
    /** Records the pending import changes from the import manager. */
    _recordImports() {
        const { newImports, updatedImports, deletedImports } = this._importManager.finalize();
        for (const [original, replacement] of updatedImports) {
            this.replaceNode(original, replacement);
        }
        for (const node of deletedImports) {
            this.removeNode(node);
        }
        for (const [sourceFile] of this._changes) {
            const importsToAdd = newImports.get(sourceFile.fileName);
            if (!importsToAdd) {
                continue;
            }
            const importLines = [];
            let lastImport = null;
            for (const statement of sourceFile.statements) {
                if (ts__default["default"].isImportDeclaration(statement)) {
                    lastImport = statement;
                }
            }
            for (const decl of importsToAdd) {
                importLines.push(this._printer.printNode(ts__default["default"].EmitHint.Unspecified, decl, sourceFile));
            }
            this.insertText(sourceFile, lastImport ? lastImport.getEnd() : 0, (lastImport ? '\n' : '') + importLines.join('\n'));
        }
    }
}
/** Normalizes a path to use posix separators. */
function normalizePath(path) {
    return path.replace(/\\/g, '/');
}

function parseTsconfigFile(tsconfigPath, basePath) {
    const { config } = ts__default["default"].readConfigFile(tsconfigPath, ts__default["default"].sys.readFile);
    const parseConfigHost = {
        useCaseSensitiveFileNames: ts__default["default"].sys.useCaseSensitiveFileNames,
        fileExists: ts__default["default"].sys.fileExists,
        readDirectory: ts__default["default"].sys.readDirectory,
        readFile: ts__default["default"].sys.readFile,
    };
    // Throw if incorrect arguments are passed to this function. Passing relative base paths
    // results in root directories not being resolved and in later type checking runtime errors.
    // More details can be found here: https://github.com/microsoft/TypeScript/issues/37731.
    if (!p__namespace.isAbsolute(basePath)) {
        throw Error('Unexpected relative base path has been specified.');
    }
    return ts__default["default"].parseJsonConfigFileContent(config, parseConfigHost, basePath, {});
}

/**
 * Creates a TypeScript program instance for a TypeScript project within
 * the virtual file system tree.
 * @param tree Virtual file system tree that contains the source files.
 * @param tsconfigPath Virtual file system path that resolves to the TypeScript project.
 * @param basePath Base path for the virtual file system tree.
 * @param fakeFileRead Optional file reader function. Can be used to overwrite files in
 *   the TypeScript program, or to add in-memory files (e.g. to add global types).
 * @param additionalFiles Additional file paths that should be added to the program.
 */
function createMigrationProgram(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles) {
    const { rootNames, options, host } = createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles);
    return ts__default["default"].createProgram(rootNames, options, host);
}
/**
 * Creates the options necessary to instantiate a TypeScript program.
 * @param tree Virtual file system tree that contains the source files.
 * @param tsconfigPath Virtual file system path that resolves to the TypeScript project.
 * @param basePath Base path for the virtual file system tree.
 * @param fakeFileRead Optional file reader function. Can be used to overwrite files in
 *   the TypeScript program, or to add in-memory files (e.g. to add global types).
 * @param additionalFiles Additional file paths that should be added to the program.
 * @param optionOverrides Overrides of the parsed compiler options.
 */
function createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead, additionalFiles, optionOverrides) {
    // Resolve the tsconfig path to an absolute path. This is needed as TypeScript otherwise
    // is not able to resolve root directories in the given tsconfig. More details can be found
    // in the following issue: https://github.com/microsoft/TypeScript/issues/37731.
    tsconfigPath = p.resolve(basePath, tsconfigPath);
    const parsed = parseTsconfigFile(tsconfigPath, p.dirname(tsconfigPath));
    const options = optionOverrides ? { ...parsed.options, ...optionOverrides } : parsed.options;
    const host = createMigrationCompilerHost(tree, options, basePath, fakeFileRead);
    return { rootNames: parsed.fileNames.concat(additionalFiles || []), options, host };
}
function createMigrationCompilerHost(tree, options, basePath, fakeRead) {
    const host = ts__default["default"].createCompilerHost(options, true);
    const defaultReadFile = host.readFile;
    // We need to overwrite the host "readFile" method, as we want the TypeScript
    // program to be based on the file contents in the virtual file tree. Otherwise
    // if we run multiple migrations we might have intersecting changes and
    // source files.
    host.readFile = (fileName) => {
        const treeRelativePath = p.relative(basePath, fileName);
        let result = fakeRead?.(treeRelativePath);
        if (typeof result !== 'string') {
            // If the relative path resolved to somewhere outside of the tree, fall back to
            // TypeScript's default file reading function since the `tree` will throw an error.
            result = treeRelativePath.startsWith('..')
                ? defaultReadFile.call(host, fileName)
                : tree.read(treeRelativePath)?.toString();
        }
        // Strip BOM as otherwise TSC methods (Ex: getWidth) will return an offset,
        // which breaks the CLI UpdateRecorder.
        // See: https://github.com/angular/angular/pull/30719
        return typeof result === 'string' ? result.replace(/^\uFEFF/, '') : undefined;
    };
    return host;
}
/**
 * Checks whether a file can be migrate by our automated migrations.
 * @param basePath Absolute path to the project.
 * @param sourceFile File being checked.
 * @param program Program that includes the source file.
 */
function canMigrateFile(basePath, sourceFile, program) {
    // We shouldn't migrate .d.ts files, files from an external library or type checking files.
    if (sourceFile.fileName.endsWith('.ngtypecheck.ts') ||
        sourceFile.isDeclarationFile ||
        program.isSourceFileFromExternalLibrary(sourceFile)) {
        return false;
    }
    // Our migrations are set up to create a `Program` from the project's tsconfig and to migrate all
    // the files within the program. This can include files that are outside of the Angular CLI
    // project. We can't migrate files outside of the project, because our file system interactions
    // go through the CLI's `Tree` which assumes that all files are within the project. See:
    // https://github.com/angular/angular-cli/blob/0b0961c9c233a825b6e4bb59ab7f0790f9b14676/packages/angular_devkit/schematics/src/tree/host-tree.ts#L131
    return !p.relative(basePath, sourceFile.fileName).startsWith('..');
}

exports.ChangeTracker = ChangeTracker;
exports.canMigrateFile = canMigrateFile;
exports.createMigrationProgram = createMigrationProgram;
exports.createProgramOptions = createProgramOptions;
exports.normalizePath = normalizePath;
