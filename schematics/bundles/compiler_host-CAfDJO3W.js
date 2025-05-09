'use strict';
/**
 * @license Angular v20.1.0-next.0+sha-c8dfe6d
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var p = require('path');
var ts = require('typescript');

function _interopNamespaceDefault(e) {
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
    n.default = e;
    return Object.freeze(n);
}

var p__namespace = /*#__PURE__*/_interopNamespaceDefault(p);

function parseTsconfigFile(tsconfigPath, basePath) {
    const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const parseConfigHost = {
        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
        fileExists: ts.sys.fileExists,
        readDirectory: ts.sys.readDirectory,
        readFile: ts.sys.readFile,
    };
    // Throw if incorrect arguments are passed to this function. Passing relative base paths
    // results in root directories not being resolved and in later type checking runtime errors.
    // More details can be found here: https://github.com/microsoft/TypeScript/issues/37731.
    if (!p__namespace.isAbsolute(basePath)) {
        throw Error('Unexpected relative base path has been specified.');
    }
    return ts.parseJsonConfigFileContent(config, parseConfigHost, basePath, {});
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
    const { rootNames, options, host } = createProgramOptions(tree, tsconfigPath, basePath, fakeFileRead);
    return ts.createProgram(rootNames, options, host);
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
    return { rootNames: parsed.fileNames.concat([]), options, host };
}
function createMigrationCompilerHost(tree, options, basePath, fakeRead) {
    const host = ts.createCompilerHost(options, true);
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

exports.canMigrateFile = canMigrateFile;
exports.createMigrationProgram = createMigrationProgram;
exports.createProgramOptions = createProgramOptions;
