'use strict';
/**
 * @license Angular v19.1.0-next.0+sha-281f747
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var core = require('@angular-devkit/core');
var posixPath = require('node:path/posix');
var os = require('os');
var ts = require('typescript');
var checker = require('./checker-e3da3b0a.js');
var program = require('./program-f984ab63.js');
require('path');

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

var posixPath__namespace = /*#__PURE__*/_interopNamespace(posixPath);
var os__namespace = /*#__PURE__*/_interopNamespace(os);
var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

/// <reference types="node" />
class NgtscCompilerHost {
    fs;
    options;
    constructor(fs, options = {}) {
        this.fs = fs;
        this.options = options;
    }
    getSourceFile(fileName, languageVersion) {
        const text = this.readFile(fileName);
        return text !== undefined
            ? ts__default["default"].createSourceFile(fileName, text, languageVersion, true)
            : undefined;
    }
    getDefaultLibFileName(options) {
        return this.fs.join(this.getDefaultLibLocation(), ts__default["default"].getDefaultLibFileName(options));
    }
    getDefaultLibLocation() {
        return this.fs.getDefaultLibLocation();
    }
    writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles) {
        const path = checker.absoluteFrom(fileName);
        this.fs.ensureDir(this.fs.dirname(path));
        this.fs.writeFile(path, data);
    }
    getCurrentDirectory() {
        return this.fs.pwd();
    }
    getCanonicalFileName(fileName) {
        return this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase();
    }
    useCaseSensitiveFileNames() {
        return this.fs.isCaseSensitive();
    }
    getNewLine() {
        switch (this.options.newLine) {
            case ts__default["default"].NewLineKind.CarriageReturnLineFeed:
                return '\r\n';
            case ts__default["default"].NewLineKind.LineFeed:
                return '\n';
            default:
                return os__namespace.EOL;
        }
    }
    fileExists(fileName) {
        const absPath = this.fs.resolve(fileName);
        return this.fs.exists(absPath) && this.fs.stat(absPath).isFile();
    }
    readFile(fileName) {
        const absPath = this.fs.resolve(fileName);
        if (!this.fileExists(absPath)) {
            return undefined;
        }
        return this.fs.readFile(absPath);
    }
    realpath(path) {
        return this.fs.realpath(this.fs.resolve(path));
    }
}

// We use TypeScript's native `ts.matchFiles` utility for the virtual file systems
/**
 * Creates a {@link ts.CompilerHost#readDirectory} implementation function,
 * that leverages the specified file system (that may be e.g. virtual).
 */
function createFileSystemTsReadDirectoryFn(fs) {
    if (ts__default["default"].matchFiles === undefined) {
        throw Error('Unable to read directory in configured file system. This means that ' +
            'TypeScript changed its file matching internals.\n\nPlease consider downgrading your ' +
            'TypeScript version, and report an issue in the Angular framework repository.');
    }
    const matchFilesFn = ts__default["default"].matchFiles.bind(ts__default["default"]);
    return (rootDir, extensions, excludes, includes, depth) => {
        const directoryExists = (p) => {
            const resolvedPath = fs.resolve(p);
            return fs.exists(resolvedPath) && fs.stat(resolvedPath).isDirectory();
        };
        return matchFilesFn(rootDir, extensions, excludes, includes, fs.isCaseSensitive(), fs.pwd(), depth, (p) => {
            const resolvedPath = fs.resolve(p);
            // TS also gracefully returns an empty file set.
            if (!directoryExists(resolvedPath)) {
                return { directories: [], files: [] };
            }
            const children = fs.readdir(resolvedPath);
            const files = [];
            const directories = [];
            for (const child of children) {
                if (fs.stat(fs.join(resolvedPath, child))?.isDirectory()) {
                    directories.push(child);
                }
                else {
                    files.push(child);
                }
            }
            return { files, directories };
        }, (p) => fs.resolve(p), (p) => directoryExists(p));
    };
}

function calcProjectFileAndBasePath(project, host = checker.getFileSystem()) {
    const absProject = host.resolve(project);
    const projectIsDir = host.lstat(absProject).isDirectory();
    const projectFile = projectIsDir ? host.join(absProject, 'tsconfig.json') : absProject;
    const projectDir = projectIsDir ? absProject : host.dirname(absProject);
    const basePath = host.resolve(projectDir);
    return { projectFile, basePath };
}
function readConfiguration(project, existingOptions, host = checker.getFileSystem()) {
    try {
        const fs = checker.getFileSystem();
        const readConfigFile = (configFile) => ts__default["default"].readConfigFile(configFile, (file) => host.readFile(host.resolve(file)));
        const readAngularCompilerOptions = (configFile, parentOptions = {}) => {
            const { config, error } = readConfigFile(configFile);
            if (error) {
                // Errors are handled later on by 'parseJsonConfigFileContent'
                return parentOptions;
            }
            // Note: In Google, `angularCompilerOptions` are stored in `bazelOptions`.
            // This function typically doesn't run for actual Angular compilations, but
            // tooling like Tsurge, or schematics may leverage this helper, so we account
            // for this here.
            const angularCompilerOptions = config.angularCompilerOptions ?? config.bazelOptions?.angularCompilerOptions;
            // we are only interested into merging 'angularCompilerOptions' as
            // other options like 'compilerOptions' are merged by TS
            let existingNgCompilerOptions = { ...angularCompilerOptions, ...parentOptions };
            if (!config.extends) {
                return existingNgCompilerOptions;
            }
            const extendsPaths = typeof config.extends === 'string' ? [config.extends] : config.extends;
            // Call readAngularCompilerOptions recursively to merge NG Compiler options
            // Reverse the array so the overrides happen from right to left.
            return [...extendsPaths].reverse().reduce((prevOptions, extendsPath) => {
                const extendedConfigPath = getExtendedConfigPath(configFile, extendsPath, host, fs);
                return extendedConfigPath === null
                    ? prevOptions
                    : readAngularCompilerOptions(extendedConfigPath, prevOptions);
            }, existingNgCompilerOptions);
        };
        const { projectFile, basePath } = calcProjectFileAndBasePath(project, host);
        const configFileName = host.resolve(host.pwd(), projectFile);
        const { config, error } = readConfigFile(projectFile);
        if (error) {
            return {
                project,
                errors: [error],
                rootNames: [],
                options: {},
                emitFlags: program.EmitFlags.Default,
            };
        }
        const existingCompilerOptions = {
            genDir: basePath,
            basePath,
            ...readAngularCompilerOptions(configFileName),
            ...existingOptions,
        };
        const parseConfigHost = createParseConfigHost(host, fs);
        const { options, errors, fileNames: rootNames, projectReferences, } = ts__default["default"].parseJsonConfigFileContent(config, parseConfigHost, basePath, existingCompilerOptions, configFileName);
        let emitFlags = program.EmitFlags.Default;
        if (!(options['skipMetadataEmit'] || options['flatModuleOutFile'])) {
            emitFlags |= program.EmitFlags.Metadata;
        }
        if (options['skipTemplateCodegen']) {
            emitFlags = emitFlags & ~program.EmitFlags.Codegen;
        }
        return { project: projectFile, rootNames, projectReferences, options, errors, emitFlags };
    }
    catch (e) {
        const errors = [
            {
                category: ts__default["default"].DiagnosticCategory.Error,
                messageText: e.stack ?? e.message,
                file: undefined,
                start: undefined,
                length: undefined,
                source: 'angular',
                code: program.UNKNOWN_ERROR_CODE,
            },
        ];
        return { project: '', errors, rootNames: [], options: {}, emitFlags: program.EmitFlags.Default };
    }
}
function createParseConfigHost(host, fs = checker.getFileSystem()) {
    return {
        fileExists: host.exists.bind(host),
        readDirectory: createFileSystemTsReadDirectoryFn(fs),
        readFile: host.readFile.bind(host),
        useCaseSensitiveFileNames: fs.isCaseSensitive(),
    };
}
function getExtendedConfigPath(configFile, extendsValue, host, fs) {
    const result = getExtendedConfigPathWorker(configFile, extendsValue, host, fs);
    if (result !== null) {
        return result;
    }
    // Try to resolve the paths with a json extension append a json extension to the file in case if
    // it is missing and the resolution failed. This is to replicate TypeScript behaviour, see:
    // https://github.com/microsoft/TypeScript/blob/294a5a7d784a5a95a8048ee990400979a6bc3a1c/src/compiler/commandLineParser.ts#L2806
    return getExtendedConfigPathWorker(configFile, `${extendsValue}.json`, host, fs);
}
function getExtendedConfigPathWorker(configFile, extendsValue, host, fs) {
    if (extendsValue.startsWith('.') || fs.isRooted(extendsValue)) {
        const extendedConfigPath = host.resolve(host.dirname(configFile), extendsValue);
        if (host.exists(extendedConfigPath)) {
            return extendedConfigPath;
        }
    }
    else {
        const parseConfigHost = createParseConfigHost(host, fs);
        // Path isn't a rooted or relative path, resolve like a module.
        const { resolvedModule } = ts__default["default"].nodeModuleNameResolver(extendsValue, configFile, { moduleResolution: ts__default["default"].ModuleResolutionKind.Node10, resolveJsonModule: true }, parseConfigHost);
        if (resolvedModule) {
            return checker.absoluteFrom(resolvedModule.resolvedFileName);
        }
    }
    return null;
}

/**
 * Angular compiler file system implementation that leverages an
 * CLI schematic virtual file tree.
 */
class DevkitMigrationFilesystem {
    tree;
    constructor(tree) {
        this.tree = tree;
    }
    extname(path) {
        return core.extname(path);
    }
    isRoot(path) {
        return path === core.normalize('/');
    }
    isRooted(path) {
        return this.normalize(path).startsWith('/');
    }
    dirname(file) {
        return this.normalize(core.dirname(file));
    }
    join(basePath, ...paths) {
        return this.normalize(core.join(basePath, ...paths));
    }
    relative(from, to) {
        return this.normalize(core.relative(from, to));
    }
    basename(filePath, extension) {
        return posixPath__namespace.basename(filePath, extension);
    }
    normalize(path) {
        return core.normalize(path);
    }
    resolve(...paths) {
        const normalizedPaths = paths.map((p) => core.normalize(p));
        // In dev-kit, the NodeJS working directory should never be
        // considered, so `/` is the last resort over `cwd`.
        return this.normalize(posixPath__namespace.resolve(core.normalize('/'), ...normalizedPaths));
    }
    pwd() {
        return '/';
    }
    isCaseSensitive() {
        return true;
    }
    exists(path) {
        return statPath(this.tree, path) !== null;
    }
    readFile(path) {
        return this.tree.readText(path);
    }
    readFileBuffer(path) {
        const buffer = this.tree.read(path);
        if (buffer === null) {
            throw new Error(`File does not exist: ${path}`);
        }
        return buffer;
    }
    readdir(path) {
        const dir = this.tree.getDir(path);
        return [
            ...dir.subdirs,
            ...dir.subfiles,
        ];
    }
    lstat(path) {
        const stat = statPath(this.tree, path);
        if (stat === null) {
            throw new Error(`File does not exist for "lstat": ${path}`);
        }
        return stat;
    }
    stat(path) {
        const stat = statPath(this.tree, path);
        if (stat === null) {
            throw new Error(`File does not exist for "stat": ${path}`);
        }
        return stat;
    }
    realpath(filePath) {
        return filePath;
    }
    getDefaultLibLocation() {
        return 'node_modules/typescript/lib';
    }
    ensureDir(path) {
        // Migrations should compute replacements and not write directly.
        throw new Error('DevkitFilesystem#ensureDir is not supported.');
    }
    writeFile(path, data) {
        // Migrations should compute replacements and not write directly.
        throw new Error('DevkitFilesystem#writeFile is not supported.');
    }
    removeFile(path) {
        // Migrations should compute replacements and not write directly.
        throw new Error('DevkitFilesystem#removeFile is not supported.');
    }
    copyFile(from, to) {
        // Migrations should compute replacements and not write directly.
        throw new Error('DevkitFilesystem#copyFile is not supported.');
    }
    moveFile(from, to) {
        // Migrations should compute replacements and not write directly.
        throw new Error('DevkitFilesystem#moveFile is not supported.');
    }
    removeDeep(path) {
        // Migrations should compute replacements and not write directly.
        throw new Error('DevkitFilesystem#removeDeep is not supported.');
    }
    chdir(_path) {
        throw new Error('FileSystem#chdir is not supported.');
    }
    symlink() {
        throw new Error('FileSystem#symlink is not supported.');
    }
}
/** Stats the given path in the virtual tree. */
function statPath(tree, path) {
    let fileInfo = null;
    let dirInfo = null;
    try {
        fileInfo = tree.get(path);
    }
    catch (e) {
        if (e.constructor.name === 'PathIsDirectoryException') {
            dirInfo = tree.getDir(path);
        }
        else {
            throw e;
        }
    }
    if (fileInfo !== null || dirInfo !== null) {
        return {
            isDirectory: () => dirInfo !== null,
            isFile: () => fileInfo !== null,
            isSymbolicLink: () => false,
        };
    }
    return null;
}

/**
 * Groups the given replacements per project relative
 * file path.
 *
 * This allows for simple execution of the replacements
 * against a given file. E.g. via {@link applyTextUpdates}.
 */
function groupReplacementsByFile(replacements) {
    const result = new Map();
    for (const { projectFile, update } of replacements) {
        if (!result.has(projectFile.rootRelativePath)) {
            result.set(projectFile.rootRelativePath, []);
        }
        result.get(projectFile.rootRelativePath).push(update);
    }
    return result;
}

/**
 * By default, Tsurge will always create an Angular compiler program
 * for projects analyzed and migrated. This works perfectly fine in
 * third-party where Tsurge migrations run in Angular CLI projects.
 *
 * In first party, when running against full Google3, creating an Angular
 * program for e.g. plain `ts_library` targets is overly expensive and
 * can result in out of memory issues for large TS targets. In 1P we can
 * reliably distinguish between TS and Angular targets via the `angularCompilerOptions`.
 */
function google3UsePlainTsProgramIfNoKnownAngularOption() {
    return process.env['GOOGLE3_TSURGE'] === '1';
}

/** Options that are good defaults for Tsurge migrations. */
const defaultMigrationTsOptions = {
    // Avoid checking libraries to speed up migrations.
    skipLibCheck: true,
    skipDefaultLibCheck: true,
    noEmit: true,
};
/**
 * Creates an instance of a TypeScript program for the given project.
 */
function createPlainTsProgram(tsHost, tsconfig, optionOverrides) {
    const program = ts__default["default"].createProgram({
        rootNames: tsconfig.rootNames,
        options: {
            ...tsconfig.options,
            ...defaultMigrationTsOptions,
            ...optionOverrides,
        },
    });
    return {
        ngCompiler: null,
        program,
        userOptions: tsconfig.options,
        programAbsoluteRootFileNames: tsconfig.rootNames,
        host: tsHost,
    };
}

/**
 * Parses the configuration of the given TypeScript project and creates
 * an instance of the Angular compiler for the project.
 */
function createNgtscProgram(tsHost, tsconfig, optionOverrides) {
    const ngtscProgram = new program.NgtscProgram(tsconfig.rootNames, {
        ...tsconfig.options,
        ...defaultMigrationTsOptions,
        ...optionOverrides,
    }, tsHost);
    // Expose an easy way to debug-print ng semantic diagnostics.
    if (process.env['DEBUG_NG_SEMANTIC_DIAGNOSTICS'] === '1') {
        console.error(ts__default["default"].formatDiagnosticsWithColorAndContext(ngtscProgram.getNgSemanticDiagnostics(), tsHost));
    }
    return {
        ngCompiler: ngtscProgram.compiler,
        program: ngtscProgram.getTsProgram(),
        userOptions: tsconfig.options,
        programAbsoluteRootFileNames: tsconfig.rootNames,
        host: tsHost,
    };
}

/** Code of the error raised by TypeScript when a tsconfig doesn't match any files. */
const NO_INPUTS_ERROR_CODE = 18003;
/** Parses the given tsconfig file, supporting Angular compiler options. */
function parseTsconfigOrDie(absoluteTsconfigPath, fs) {
    const tsconfig = readConfiguration(absoluteTsconfigPath, {}, fs);
    // Skip the "No inputs found..." error since we don't want to interrupt the migration if a
    // tsconfig doesn't match a file. This will result in an empty `Program` which is still valid.
    const errors = tsconfig.errors.filter((diag) => diag.code !== NO_INPUTS_ERROR_CODE);
    if (errors.length) {
        throw new Error(`Tsconfig could not be parsed or is invalid:\n\n` + `${errors.map((e) => e.messageText)}`);
    }
    return tsconfig;
}

/** Creates the base program info for the given tsconfig path. */
function createBaseProgramInfo(absoluteTsconfigPath, fs, optionOverrides = {}) {
    if (fs === undefined) {
        fs = new checker.NodeJSFileSystem();
        checker.setFileSystem(fs);
    }
    const tsconfig = parseTsconfigOrDie(absoluteTsconfigPath, fs);
    const tsHost = new NgtscCompilerHost(fs, tsconfig.options);
    // When enabled, use a plain TS program if we are sure it's not
    // an Angular project based on the `tsconfig.json`.
    if (google3UsePlainTsProgramIfNoKnownAngularOption() &&
        tsconfig.options['_useHostForImportGeneration'] === undefined) {
        return createPlainTsProgram(tsHost, tsconfig, optionOverrides);
    }
    return createNgtscProgram(tsHost, tsconfig, optionOverrides);
}

/**
 * @private
 *
 * Base class for the possible Tsurge migration variants.
 *
 * For example, this class exposes methods to conveniently create
 * TypeScript programs, while also allowing migration authors to override.
 */
class TsurgeBaseMigration {
    /**
     * Advanced Tsurge users can override this method, but most of the time,
     * overriding {@link prepareProgram} is more desirable.
     *
     * By default:
     *  - In 3P: Ngtsc programs are being created.
     *  - In 1P: Ngtsc or TS programs are created based on the Blaze target.
     */
    createProgram(tsconfigAbsPath, fs) {
        return createBaseProgramInfo(tsconfigAbsPath, fs);
    }
    // Optional function to prepare the base `ProgramInfo` even further,
    // for the analyze and migrate phases. E.g. determining source files.
    prepareProgram(info) {
        const fullProgramSourceFiles = [...info.program.getSourceFiles()];
        const sourceFiles = fullProgramSourceFiles.filter((f) => !f.isDeclarationFile &&
            // Note `isShim` will work for the initial program, but for TCB programs, the shims are no longer annotated.
            !checker.isShim(f) &&
            !f.fileName.endsWith('.ngtypecheck.ts'));
        // Sort it by length in reverse order (longest first). This speeds up lookups,
        // since there's no need to keep going through the array once a match is found.
        const sortedRootDirs = checker.getRootDirs(info.host, info.userOptions).sort((a, b) => b.length - a.length);
        // TODO: Consider also following TS's logic here, finding the common source root.
        // See: Program#getCommonSourceDirectory.
        const primaryRoot = checker.absoluteFrom(info.userOptions.rootDir ?? sortedRootDirs.at(-1) ?? info.program.getCurrentDirectory());
        return {
            ...info,
            sourceFiles,
            fullProgramSourceFiles,
            sortedRootDirs,
            projectRoot: primaryRoot,
        };
    }
}

/**
 * A simpler variant of a {@link TsurgeComplexMigration} that does not
 * fan-out into multiple workers per compilation unit to compute
 * the final migration replacements.
 *
 * This is faster and less resource intensive as workers and TS programs
 * are only ever created once.
 *
 * This is commonly the case when migrations are refactored to eagerly
 * compute replacements in the analyze stage, and then leverage the
 * global unit data to filter replacements that turned out to be "invalid".
 */
class TsurgeFunnelMigration extends TsurgeBaseMigration {
}
/**
 * Complex variant of a `Tsurge` migration.
 *
 * For example, every analyze worker may contribute to a list of TS
 * references that are later combined. The migrate phase can then compute actual
 * file updates for all individual compilation units, leveraging the global metadata
 * to e.g. see if there are any references from other compilation units that may be
 * problematic and prevent migration of a given file.
 */
class TsurgeComplexMigration extends TsurgeBaseMigration {
}

/** A text replacement for the given file. */
class Replacement {
    projectFile;
    update;
    constructor(projectFile, update) {
        this.projectFile = projectFile;
        this.update = update;
    }
}
/** An isolated text update that may be applied to a file. */
class TextUpdate {
    data;
    constructor(data) {
        this.data = data;
    }
}

/** Confirms that the given data `T` is serializable. */
function confirmAsSerializable(data) {
    return data;
}

/**
 * Gets a project file instance for the given file.
 *
 * Use this helper for dealing with project paths throughout your
 * migration. The return type is serializable.
 *
 * See {@link ProjectFile}.
 */
function projectFile(file, { sortedRootDirs, projectRoot }) {
    const fs = checker.getFileSystem();
    const filePath = fs.resolve(typeof file === 'string' ? file : file.fileName);
    // Sorted root directories are sorted longest to shortest. First match
    // is the appropriate root directory for ID computation.
    for (const rootDir of sortedRootDirs) {
        if (!isWithinBasePath(fs, rootDir, filePath)) {
            continue;
        }
        return {
            id: fs.relative(rootDir, filePath),
            rootRelativePath: fs.relative(projectRoot, filePath),
        };
    }
    // E.g. project directory may be `src/`, but files may be looked up
    // from `node_modules/`. This is fine, but in those cases, no root
    // directory matches.
    const rootRelativePath = fs.relative(projectRoot, filePath);
    return {
        id: rootRelativePath,
        rootRelativePath: rootRelativePath,
    };
}
/**
 * Whether `path` is a descendant of the `base`?
 * E.g. `a/b/c` is within `a/b` but not within `a/x`.
 */
function isWithinBasePath(fs, base, path) {
    return checker.isLocalRelativePath(fs.relative(base, path));
}

/**
 * Applies import manager changes, and writes them as replacements the
 * given result array.
 */
function applyImportManagerChanges(importManager, replacements, sourceFiles, info) {
    const { newImports, updatedImports, deletedImports } = importManager.finalize();
    const printer = ts__default["default"].createPrinter({});
    const pathToFile = new Map(sourceFiles.map((s) => [s.fileName, s]));
    // Capture new imports
    newImports.forEach((newImports, fileName) => {
        newImports.forEach((newImport) => {
            const printedImport = printer.printNode(ts__default["default"].EmitHint.Unspecified, newImport, pathToFile.get(fileName));
            replacements.push(new Replacement(projectFile(checker.absoluteFrom(fileName), info), new TextUpdate({ position: 0, end: 0, toInsert: `${printedImport}\n` })));
        });
    });
    // Capture updated imports
    for (const [oldBindings, newBindings] of updatedImports.entries()) {
        // The import will be generated as multi-line if it already is multi-line,
        // or if the number of elements significantly increased and it previously
        // consisted of very few specifiers.
        const isMultiline = oldBindings.getText().includes('\n') ||
            (newBindings.elements.length >= 6 && oldBindings.elements.length <= 3);
        const hasSpaceBetweenBraces = oldBindings.getText().startsWith('{ ');
        let formatFlags = ts__default["default"].ListFormat.NamedImportsOrExportsElements |
            ts__default["default"].ListFormat.Indented |
            ts__default["default"].ListFormat.Braces |
            ts__default["default"].ListFormat.PreserveLines |
            (isMultiline ? ts__default["default"].ListFormat.MultiLine : ts__default["default"].ListFormat.SingleLine);
        if (hasSpaceBetweenBraces) {
            formatFlags |= ts__default["default"].ListFormat.SpaceBetweenBraces;
        }
        else {
            formatFlags &= ~ts__default["default"].ListFormat.SpaceBetweenBraces;
        }
        const printedBindings = printer.printList(formatFlags, newBindings.elements, oldBindings.getSourceFile());
        replacements.push(new Replacement(projectFile(oldBindings.getSourceFile(), info), new TextUpdate({
            position: oldBindings.getStart(),
            end: oldBindings.getEnd(),
            // TS uses four spaces as indent. We migrate to two spaces as we
            // assume this to be more common.
            toInsert: printedBindings.replace(/^ {4}/gm, '  '),
        })));
    }
    // Update removed imports
    for (const removedImport of deletedImports) {
        replacements.push(new Replacement(projectFile(removedImport.getSourceFile(), info), new TextUpdate({
            position: removedImport.getStart(),
            end: removedImport.getEnd(),
            toInsert: '',
        })));
    }
}

function getMemberName(member) {
    if (member.name === undefined) {
        return null;
    }
    if (ts__default["default"].isIdentifier(member.name) || ts__default["default"].isStringLiteralLike(member.name)) {
        return member.name.text;
    }
    if (ts__default["default"].isPrivateIdentifier(member.name)) {
        return `#${member.name.text}`;
    }
    return null;
}

/** Checks whether the given node can be an `@Input()` declaration node. */
function isInputContainerNode(node) {
    return (((ts__default["default"].isAccessor(node) && ts__default["default"].isClassDeclaration(node.parent)) ||
        ts__default["default"].isPropertyDeclaration(node)) &&
        getMemberName(node) !== null);
}

/**
 * Detects `query(By.directive(T)).componentInstance` patterns and enhances
 * them with information of `T`. This is important because `.componentInstance`
 * is currently typed as `any` and may cause runtime test failures after input
 * migrations then.
 *
 * The reference resolution pass leverages information from this pattern
 * recognizer.
 */
class DebugElementComponentInstance {
    checker;
    cache = new WeakMap();
    constructor(checker) {
        this.checker = checker;
    }
    detect(node) {
        if (this.cache.has(node)) {
            return this.cache.get(node);
        }
        if (!ts__default["default"].isPropertyAccessExpression(node)) {
            return null;
        }
        // Check for `<>.componentInstance`.
        if (!ts__default["default"].isIdentifier(node.name) || node.name.text !== 'componentInstance') {
            return null;
        }
        // Check for `<>.query(..).<>`.
        if (!ts__default["default"].isCallExpression(node.expression) ||
            !ts__default["default"].isPropertyAccessExpression(node.expression.expression) ||
            !ts__default["default"].isIdentifier(node.expression.expression.name) ||
            node.expression.expression.name.text !== 'query') {
            return null;
        }
        const queryCall = node.expression;
        if (queryCall.arguments.length !== 1) {
            return null;
        }
        const queryArg = queryCall.arguments[0];
        let typeExpr;
        if (ts__default["default"].isCallExpression(queryArg) &&
            queryArg.arguments.length === 1 &&
            ts__default["default"].isIdentifier(queryArg.arguments[0])) {
            // Detect references, like: `query(By.directive(T))`.
            typeExpr = queryArg.arguments[0];
        }
        else if (ts__default["default"].isIdentifier(queryArg)) {
            // Detect references, like: `harness.query(T)`.
            typeExpr = queryArg;
        }
        else {
            return null;
        }
        const symbol = this.checker.getSymbolAtLocation(typeExpr);
        if (symbol?.valueDeclaration === undefined ||
            !ts__default["default"].isClassDeclaration(symbol?.valueDeclaration)) {
            // Cache this as we use the expensive type checker.
            this.cache.set(node, null);
            return null;
        }
        const type = this.checker.getTypeAtLocation(symbol.valueDeclaration);
        this.cache.set(node, type);
        return type;
    }
}

/**
 * Recognizes `Partial<T>` instances in Catalyst tests. Those type queries
 * are likely used for typing property initialization values for the given class `T`
 * and we have a few scenarios:
 *
 *   1. The API does not unwrap signal inputs. In which case, the values are likely no
 *      longer assignable to an `InputSignal`.
 *   2. The API does unwrap signal inputs, in which case we need to unwrap the `Partial`
 *      because the values are raw initial values, like they were before.
 *
 * We can enable this heuristic when we detect Catalyst as we know it supports unwrapping.
 */
class PartialDirectiveTypeInCatalystTests {
    checker;
    knownFields;
    constructor(checker, knownFields) {
        this.checker = checker;
        this.knownFields = knownFields;
    }
    detect(node) {
        // Detect `Partial<...>`
        if (!ts__default["default"].isTypeReferenceNode(node) ||
            !ts__default["default"].isIdentifier(node.typeName) ||
            node.typeName.text !== 'Partial') {
            return null;
        }
        // Ignore if the source file doesn't reference Catalyst.
        if (!node.getSourceFile().text.includes('angular2/testing/catalyst')) {
            return null;
        }
        // Extract T of `Partial<T>`.
        const cmpTypeArg = node.typeArguments?.[0];
        if (!cmpTypeArg ||
            !ts__default["default"].isTypeReferenceNode(cmpTypeArg) ||
            !ts__default["default"].isIdentifier(cmpTypeArg.typeName)) {
            return null;
        }
        const cmpType = cmpTypeArg.typeName;
        const symbol = this.checker.getSymbolAtLocation(cmpType);
        // Note: Technically the class might be derived of an input-containing class,
        // but this is out of scope for now. We can expand if we see it's a common case.
        if (symbol?.valueDeclaration === undefined ||
            !ts__default["default"].isClassDeclaration(symbol.valueDeclaration) ||
            !this.knownFields.shouldTrackClassReference(symbol.valueDeclaration)) {
            return null;
        }
        return { referenceNode: node, targetClass: symbol.valueDeclaration };
    }
}

/**
 * Attempts to look up the given property access chain using
 * the type checker.
 *
 * Notably this is not as safe as using the type checker directly to
 * retrieve symbols of a given identifier, but in some cases this is
 * a necessary approach to compensate e.g. for a lack of TCB information
 * when processing Angular templates.
 *
 * The path is a list of properties to be accessed sequentially on the
 * given type.
 */
function lookupPropertyAccess(checker, type, path, options = {}) {
    let symbol = null;
    for (const propName of path) {
        // Note: We support assuming `NonNullable` for the pathl This is necessary
        // in some situations as otherwise the lookups would fail to resolve the target
        // symbol just because of e.g. a ternary. This is used in the signal input migration
        // for host bindings.
        type = options.ignoreNullability ? type.getNonNullableType() : type;
        const propSymbol = type.getProperty(propName);
        if (propSymbol === undefined) {
            return null;
        }
        symbol = propSymbol;
        type = checker.getTypeOfSymbol(propSymbol);
    }
    if (symbol === null) {
        return null;
    }
    return { symbol, type };
}

/**
 * AST visitor that iterates through a template and finds all
 * input references.
 *
 * This resolution is important to be able to migrate references to inputs
 * that will be migrated to signal inputs.
 */
class TemplateReferenceVisitor extends checker.RecursiveVisitor$1 {
    result = [];
    /**
     * Whether we are currently descending into HTML AST nodes
     * where all bound attributes are considered potentially narrowing.
     *
     * Keeps track of all referenced inputs in such attribute expressions.
     */
    templateAttributeReferencedFields = null;
    expressionVisitor;
    seenKnownFieldsCount = new Map();
    constructor(typeChecker, templateTypeChecker, componentClass, knownFields, fieldNamesToConsiderForReferenceLookup) {
        super();
        this.expressionVisitor = new TemplateExpressionReferenceVisitor(typeChecker, templateTypeChecker, componentClass, knownFields, fieldNamesToConsiderForReferenceLookup);
    }
    checkExpressionForReferencedFields(activeNode, expressionNode) {
        const referencedFields = this.expressionVisitor.checkTemplateExpression(activeNode, expressionNode);
        // Add all references to the overall visitor result.
        this.result.push(...referencedFields);
        // Count usages of seen input references. We'll use this to make decisions
        // based on whether inputs are potentially narrowed or not.
        for (const input of referencedFields) {
            this.seenKnownFieldsCount.set(input.targetField.key, (this.seenKnownFieldsCount.get(input.targetField.key) ?? 0) + 1);
        }
        return referencedFields;
    }
    descendAndCheckForNarrowedSimilarReferences(potentiallyNarrowedInputs, descend) {
        const inputs = potentiallyNarrowedInputs.map((i) => ({
            ref: i,
            key: i.targetField.key,
            pastCount: this.seenKnownFieldsCount.get(i.targetField.key) ?? 0,
        }));
        descend();
        for (const input of inputs) {
            // Input was referenced inside a narrowable spot, and is used in child nodes.
            // This is a sign for the input to be narrowed. Mark it as such.
            if ((this.seenKnownFieldsCount.get(input.key) ?? 0) > input.pastCount) {
                input.ref.isLikelyNarrowed = true;
            }
        }
    }
    visitTemplate(template) {
        // Note: We assume all bound expressions for templates may be subject
        // to TCB narrowing. This is relevant for now until we support narrowing
        // of signal calls in templates.
        // TODO: Remove with: https://github.com/angular/angular/pull/55456.
        this.templateAttributeReferencedFields = [];
        checker.visitAll$1(this, template.attributes);
        checker.visitAll$1(this, template.templateAttrs);
        // If we are dealing with a microsyntax template, do not check
        // inputs and outputs as those are already passed to the children.
        // Template attributes may contain relevant expressions though.
        if (template.tagName === 'ng-template') {
            checker.visitAll$1(this, template.inputs);
            checker.visitAll$1(this, template.outputs);
        }
        const referencedInputs = this.templateAttributeReferencedFields;
        this.templateAttributeReferencedFields = null;
        this.descendAndCheckForNarrowedSimilarReferences(referencedInputs, () => {
            checker.visitAll$1(this, template.children);
            checker.visitAll$1(this, template.references);
            checker.visitAll$1(this, template.variables);
        });
    }
    visitIfBlockBranch(block) {
        if (block.expression) {
            const referencedFields = this.checkExpressionForReferencedFields(block, block.expression);
            this.descendAndCheckForNarrowedSimilarReferences(referencedFields, () => {
                super.visitIfBlockBranch(block);
            });
        }
        else {
            super.visitIfBlockBranch(block);
        }
    }
    visitForLoopBlock(block) {
        this.checkExpressionForReferencedFields(block, block.expression);
        this.checkExpressionForReferencedFields(block, block.trackBy);
        super.visitForLoopBlock(block);
    }
    visitSwitchBlock(block) {
        const referencedFields = this.checkExpressionForReferencedFields(block, block.expression);
        this.descendAndCheckForNarrowedSimilarReferences(referencedFields, () => {
            super.visitSwitchBlock(block);
        });
    }
    visitSwitchBlockCase(block) {
        if (block.expression) {
            const referencedFields = this.checkExpressionForReferencedFields(block, block.expression);
            this.descendAndCheckForNarrowedSimilarReferences(referencedFields, () => {
                super.visitSwitchBlockCase(block);
            });
        }
        else {
            super.visitSwitchBlockCase(block);
        }
    }
    visitDeferredBlock(deferred) {
        if (deferred.triggers.when) {
            this.checkExpressionForReferencedFields(deferred, deferred.triggers.when.value);
        }
        if (deferred.prefetchTriggers.when) {
            this.checkExpressionForReferencedFields(deferred, deferred.prefetchTriggers.when.value);
        }
        super.visitDeferredBlock(deferred);
    }
    visitBoundText(text) {
        this.checkExpressionForReferencedFields(text, text.value);
    }
    visitBoundEvent(attribute) {
        this.checkExpressionForReferencedFields(attribute, attribute.handler);
    }
    visitBoundAttribute(attribute) {
        const referencedFields = this.checkExpressionForReferencedFields(attribute, attribute.value);
        // Attributes inside templates are potentially "narrowed" and hence we
        // keep track of all referenced inputs to see if they actually are.
        if (this.templateAttributeReferencedFields !== null) {
            this.templateAttributeReferencedFields.push(...referencedFields);
        }
    }
}
/**
 * Expression AST visitor that checks whether a given expression references
 * a known `@Input()`.
 *
 * This resolution is important to be able to migrate references to inputs
 * that will be migrated to signal inputs.
 */
class TemplateExpressionReferenceVisitor extends checker.RecursiveAstVisitor$1 {
    typeChecker;
    templateTypeChecker;
    componentClass;
    knownFields;
    fieldNamesToConsiderForReferenceLookup;
    activeTmplAstNode = null;
    detectedInputReferences = [];
    isInsideObjectShorthandExpression = false;
    insideConditionalExpressionsWithReads = [];
    constructor(typeChecker, templateTypeChecker, componentClass, knownFields, fieldNamesToConsiderForReferenceLookup) {
        super();
        this.typeChecker = typeChecker;
        this.templateTypeChecker = templateTypeChecker;
        this.componentClass = componentClass;
        this.knownFields = knownFields;
        this.fieldNamesToConsiderForReferenceLookup = fieldNamesToConsiderForReferenceLookup;
    }
    /** Checks the given AST expression. */
    checkTemplateExpression(activeNode, expressionNode) {
        this.detectedInputReferences = [];
        this.activeTmplAstNode = activeNode;
        expressionNode.visit(this, []);
        return this.detectedInputReferences;
    }
    visit(ast, context) {
        super.visit(ast, [...context, ast]);
    }
    // Keep track when we are inside an object shorthand expression. This is
    // necessary as we need to expand the shorthand to invoke a potential new signal.
    // E.g. `{bla}` may be transformed to `{bla: bla()}`.
    visitLiteralMap(ast, context) {
        for (const [idx, key] of ast.keys.entries()) {
            this.isInsideObjectShorthandExpression = !!key.isShorthandInitialized;
            ast.values[idx].visit(this, context);
            this.isInsideObjectShorthandExpression = false;
        }
    }
    visitPropertyRead(ast, context) {
        this._inspectPropertyAccess(ast, context);
        super.visitPropertyRead(ast, context);
    }
    visitSafePropertyRead(ast, context) {
        this._inspectPropertyAccess(ast, context);
        super.visitPropertyRead(ast, context);
    }
    visitPropertyWrite(ast, context) {
        this._inspectPropertyAccess(ast, context);
        super.visitPropertyWrite(ast, context);
    }
    visitConditional(ast, context) {
        this.visit(ast.condition, context);
        this.insideConditionalExpressionsWithReads.push(ast.condition);
        this.visit(ast.trueExp, context);
        this.visit(ast.falseExp, context);
        this.insideConditionalExpressionsWithReads.pop();
    }
    /**
     * Inspects the property access and attempts to resolve whether they access
     * a known field. If so, the result is captured.
     */
    _inspectPropertyAccess(ast, astPath) {
        if (this.fieldNamesToConsiderForReferenceLookup !== null &&
            !this.fieldNamesToConsiderForReferenceLookup.has(ast.name)) {
            return;
        }
        const isWrite = !!(ast instanceof checker.PropertyWrite ||
            (this.activeTmplAstNode && isTwoWayBindingNode(this.activeTmplAstNode)));
        this._checkAccessViaTemplateTypeCheckBlock(ast, isWrite, astPath) ||
            this._checkAccessViaOwningComponentClassType(ast, isWrite, astPath);
    }
    /**
     * Checks whether the node refers to an input using the TCB information.
     * Type check block may not exist for e.g. test components, so this can return `null`.
     */
    _checkAccessViaTemplateTypeCheckBlock(ast, isWrite, astPath) {
        // There might be no template type checker. E.g. if we check host bindings.
        if (this.templateTypeChecker === null) {
            return false;
        }
        const symbol = this.templateTypeChecker.getSymbolOfNode(ast, this.componentClass);
        if (symbol?.kind !== checker.SymbolKind.Expression || symbol.tsSymbol === null) {
            return false;
        }
        // Dangerous: Type checking symbol retrieval is a totally different `ts.Program`,
        // than the one where we analyzed `knownInputs`.
        // --> Find the input via its input id.
        const targetInput = this.knownFields.attemptRetrieveDescriptorFromSymbol(symbol.tsSymbol);
        if (targetInput === null) {
            return false;
        }
        this.detectedInputReferences.push({
            targetNode: targetInput.node,
            targetField: targetInput,
            read: ast,
            readAstPath: astPath,
            context: this.activeTmplAstNode,
            isLikelyNarrowed: this._isPartOfNarrowingTernary(ast),
            isObjectShorthandExpression: this.isInsideObjectShorthandExpression,
            isWrite,
        });
        return true;
    }
    /**
     * Simple resolution checking whether the given AST refers to a known input.
     * This is a fallback for when there is no type checking information (e.g. in host bindings).
     *
     * It attempts to resolve references by traversing accesses of the "component class" type.
     * e.g. `this.bla` is resolved via `CompType#bla` and further.
     */
    _checkAccessViaOwningComponentClassType(ast, isWrite, astPath) {
        // We might check host bindings, which can never point to template variables or local refs.
        const expressionTemplateTarget = this.templateTypeChecker === null
            ? null
            : this.templateTypeChecker.getExpressionTarget(ast, this.componentClass);
        // Skip checking if:
        // - the reference resolves to a template variable or local ref. No way to resolve without TCB.
        // - the owning component does not have a name (should not happen technically).
        if (expressionTemplateTarget !== null || this.componentClass.name === undefined) {
            return;
        }
        const property = traverseReceiverAndLookupSymbol(ast, this.componentClass, this.typeChecker);
        if (property === null) {
            return;
        }
        const matchingTarget = this.knownFields.attemptRetrieveDescriptorFromSymbol(property);
        if (matchingTarget === null) {
            return;
        }
        this.detectedInputReferences.push({
            targetNode: matchingTarget.node,
            targetField: matchingTarget,
            read: ast,
            readAstPath: astPath,
            context: this.activeTmplAstNode,
            isLikelyNarrowed: this._isPartOfNarrowingTernary(ast),
            isObjectShorthandExpression: this.isInsideObjectShorthandExpression,
            isWrite,
        });
    }
    _isPartOfNarrowingTernary(read) {
        // Note: We do not safe check that the reads are fully matching 1:1. This is acceptable
        // as worst case we just skip an input from being migrated. This is very unlikely too.
        return this.insideConditionalExpressionsWithReads.some((r) => (r instanceof checker.PropertyRead ||
            r instanceof checker.PropertyWrite ||
            r instanceof checker.SafePropertyRead) &&
            r.name === read.name);
    }
}
/**
 * Emulates an access to a given field using the TypeScript `ts.Type`
 * of the given class. The resolved symbol of the access is returned.
 */
function traverseReceiverAndLookupSymbol(readOrWrite, componentClass, checker$1) {
    const path = [readOrWrite.name];
    let node = readOrWrite;
    while (node.receiver instanceof checker.PropertyRead || node.receiver instanceof checker.PropertyWrite) {
        node = node.receiver;
        path.unshift(node.name);
    }
    if (!(node.receiver instanceof checker.ImplicitReceiver || node.receiver instanceof checker.ThisReceiver)) {
        return null;
    }
    const classType = checker$1.getTypeAtLocation(componentClass.name);
    return (lookupPropertyAccess(checker$1, classType, path, {
        // Necessary to avoid breaking the resolution if there is
        // some narrowing involved. E.g. `myClass ? myClass.input`.
        ignoreNullability: true,
    })?.symbol ?? null);
}
/** Whether the given node refers to a two-way binding AST node. */
function isTwoWayBindingNode(node) {
    return ((node instanceof checker.BoundAttribute && node.type === checker.BindingType.TwoWay) ||
        (node instanceof checker.BoundEvent && node.type === checker.ParsedEventType.TwoWay));
}

/** Possible types of references to known fields detected. */
exports.ReferenceKind = void 0;
(function (ReferenceKind) {
    ReferenceKind[ReferenceKind["InTemplate"] = 0] = "InTemplate";
    ReferenceKind[ReferenceKind["InHostBinding"] = 1] = "InHostBinding";
    ReferenceKind[ReferenceKind["TsReference"] = 2] = "TsReference";
    ReferenceKind[ReferenceKind["TsClassTypeReference"] = 3] = "TsClassTypeReference";
})(exports.ReferenceKind || (exports.ReferenceKind = {}));
/** Whether the given reference is a TypeScript reference. */
function isTsReference(ref) {
    return ref.kind === exports.ReferenceKind.TsReference;
}
/** Whether the given reference is a template reference. */
function isTemplateReference(ref) {
    return ref.kind === exports.ReferenceKind.InTemplate;
}
/** Whether the given reference is a host binding reference. */
function isHostBindingReference(ref) {
    return ref.kind === exports.ReferenceKind.InHostBinding;
}
/**
 * Whether the given reference is a TypeScript `ts.Type` reference
 * to a class containing known fields.
 */
function isTsClassTypeReference(ref) {
    return ref.kind === exports.ReferenceKind.TsClassTypeReference;
}

/**
 * Checks host bindings of the given class and tracks all
 * references to inputs within bindings.
 */
function identifyHostBindingReferences(node, programInfo, checker$1, reflector, result, knownFields, fieldNamesToConsiderForReferenceLookup) {
    if (node.name === undefined) {
        return;
    }
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    if (decorators === null) {
        return;
    }
    const angularDecorators = checker.getAngularDecorators(decorators, ['Directive', 'Component'], 
    /* isAngularCore */ false);
    if (angularDecorators.length === 0) {
        return;
    }
    // Assume only one Angular decorator per class.
    const ngDecorator = angularDecorators[0];
    if (ngDecorator.args?.length !== 1) {
        return;
    }
    const metadataNode = checker.unwrapExpression(ngDecorator.args[0]);
    if (!ts__default["default"].isObjectLiteralExpression(metadataNode)) {
        return;
    }
    const metadata = checker.reflectObjectLiteral(metadataNode);
    if (!metadata.has('host')) {
        return;
    }
    let hostField = checker.unwrapExpression(metadata.get('host'));
    // Special-case in case host bindings are shared via a variable.
    // e.g. Material button shares host bindings as a constant in the same target.
    if (ts__default["default"].isIdentifier(hostField)) {
        let symbol = checker$1.getSymbolAtLocation(hostField);
        // Plain identifier references can point to alias symbols (e.g. imports).
        if (symbol !== undefined && symbol.flags & ts__default["default"].SymbolFlags.Alias) {
            symbol = checker$1.getAliasedSymbol(symbol);
        }
        if (symbol !== undefined &&
            symbol.valueDeclaration !== undefined &&
            ts__default["default"].isVariableDeclaration(symbol.valueDeclaration)) {
            hostField = symbol?.valueDeclaration.initializer;
        }
    }
    if (hostField === undefined || !ts__default["default"].isObjectLiteralExpression(hostField)) {
        return;
    }
    const hostMap = checker.reflectObjectLiteral(hostField);
    const expressionResult = [];
    const expressionVisitor = new TemplateExpressionReferenceVisitor(checker$1, null, node, knownFields, fieldNamesToConsiderForReferenceLookup);
    for (const [rawName, expression] of hostMap.entries()) {
        if (!ts__default["default"].isStringLiteralLike(expression)) {
            continue;
        }
        const isEventBinding = rawName.startsWith('(');
        const isPropertyBinding = rawName.startsWith('[');
        // Only migrate property or event bindings.
        if (!isPropertyBinding && !isEventBinding) {
            continue;
        }
        const parser = checker.makeBindingParser();
        const sourceSpan = new checker.ParseSourceSpan(
        // Fake source span to keep parsing offsets zero-based.
        // We then later combine these with the expression TS node offsets.
        new checker.ParseLocation({ content: '', url: '' }, 0, 0, 0), new checker.ParseLocation({ content: '', url: '' }, 0, 0, 0));
        const name = rawName.substring(1, rawName.length - 1);
        let parsed = undefined;
        if (isEventBinding) {
            const result = [];
            parser.parseEvent(name.substring(1, name.length - 1), expression.text, false, sourceSpan, sourceSpan, [], result, sourceSpan);
            parsed = result[0].handler;
        }
        else {
            const result = [];
            parser.parsePropertyBinding(name, expression.text, true, 
            /* isTwoWayBinding */ false, sourceSpan, 0, sourceSpan, [], result, sourceSpan);
            parsed = result[0].expression;
        }
        if (parsed != null) {
            expressionResult.push(...expressionVisitor.checkTemplateExpression(expression, parsed));
        }
    }
    for (const ref of expressionResult) {
        result.references.push({
            kind: exports.ReferenceKind.InHostBinding,
            from: {
                read: ref.read,
                readAstPath: ref.readAstPath,
                isObjectShorthandExpression: ref.isObjectShorthandExpression,
                isWrite: ref.isWrite,
                file: projectFile(ref.context.getSourceFile(), programInfo),
                hostPropertyNode: ref.context,
            },
            target: ref.targetField,
        });
    }
}

/**
 * Attempts to extract the `TemplateDefinition` for the given
 * class, if possible.
 *
 * The definition can then be used with the Angular compiler to
 * load/parse the given template.
 */
function attemptExtractTemplateDefinition(node, checker$1, reflector, resourceLoader) {
    const classDecorators = reflector.getDecoratorsOfDeclaration(node);
    const evaluator = new program.PartialEvaluator(reflector, checker$1, null);
    const ngDecorators = classDecorators !== null
        ? checker.getAngularDecorators(classDecorators, ['Component'], /* isAngularCore */ false)
        : [];
    if (ngDecorators.length === 0 ||
        ngDecorators[0].args === null ||
        ngDecorators[0].args.length === 0 ||
        !ts__default["default"].isObjectLiteralExpression(ngDecorators[0].args[0])) {
        return null;
    }
    const properties = checker.reflectObjectLiteral(ngDecorators[0].args[0]);
    const templateProp = properties.get('template');
    const templateUrlProp = properties.get('templateUrl');
    const containingFile = node.getSourceFile().fileName;
    // inline template.
    if (templateProp !== undefined) {
        const templateStr = evaluator.evaluate(templateProp);
        if (typeof templateStr === 'string') {
            return {
                isInline: true,
                expression: templateProp,
                interpolationConfig: checker.DEFAULT_INTERPOLATION_CONFIG,
                preserveWhitespaces: false,
                resolvedTemplateUrl: containingFile,
                templateUrl: containingFile,
            };
        }
    }
    try {
        // external template.
        if (templateUrlProp !== undefined) {
            const templateUrl = evaluator.evaluate(templateUrlProp);
            if (typeof templateUrl === 'string') {
                return {
                    isInline: false,
                    interpolationConfig: checker.DEFAULT_INTERPOLATION_CONFIG,
                    preserveWhitespaces: false,
                    templateUrlExpression: templateUrlProp,
                    templateUrl,
                    resolvedTemplateUrl: resourceLoader.resolve(templateUrl, containingFile),
                };
            }
        }
    }
    catch (e) {
        console.error(`Could not parse external template: ${e}`);
    }
    return null;
}

/**
 * Checks whether the given class has an Angular template, and resolves
 * all of the references to inputs.
 */
function identifyTemplateReferences(programInfo, node, reflector, checker$1, evaluator, templateTypeChecker, resourceLoader, options, result, knownFields, fieldNamesToConsiderForReferenceLookup) {
    const template = templateTypeChecker.getTemplate(node, checker.OptimizeFor.WholeProgram) ??
        // If there is no template registered in the TCB or compiler, the template may
        // be skipped due to an explicit `jit: true` setting. We try to detect this case
        // and parse the template manually.
        extractTemplateWithoutCompilerAnalysis(node, checker$1, reflector, resourceLoader, evaluator, options);
    if (template !== null) {
        const visitor = new TemplateReferenceVisitor(checker$1, templateTypeChecker, node, knownFields, fieldNamesToConsiderForReferenceLookup);
        template.forEach((node) => node.visit(visitor));
        for (const res of visitor.result) {
            const templateFilePath = res.context.sourceSpan.start.file.url;
            // Templates without an URL are non-mappable artifacts of e.g.
            // string concatenated templates. See the `indirect` template
            // source mapping concept in the compiler. We skip such references
            // as those cannot be migrated, but print an error for now.
            if (templateFilePath === '') {
                // TODO: Incorporate a TODO potentially.
                console.error(`Found reference to field ${res.targetField.key} that cannot be ` +
                    `migrated because the template cannot be parsed with source map information ` +
                    `(in file: ${node.getSourceFile().fileName}).`);
                continue;
            }
            result.references.push({
                kind: exports.ReferenceKind.InTemplate,
                from: {
                    read: res.read,
                    readAstPath: res.readAstPath,
                    node: res.context,
                    isObjectShorthandExpression: res.isObjectShorthandExpression,
                    originatingTsFile: projectFile(node.getSourceFile(), programInfo),
                    templateFile: projectFile(checker.absoluteFrom(templateFilePath), programInfo),
                    isLikelyPartOfNarrowing: res.isLikelyNarrowed,
                    isWrite: res.isWrite,
                },
                target: res.targetField,
            });
        }
    }
}
/**
 * Attempts to extract a `@Component` template from the given class,
 * without relying on the `NgCompiler` program analysis.
 *
 * This is useful for JIT components using `jit: true` which were not
 * processed by the Angular compiler, but may still have templates that
 * contain references to inputs that we can resolve via the fallback
 * reference resolutions (that does not use the type check block).
 */
function extractTemplateWithoutCompilerAnalysis(node, checker$1, reflector, resourceLoader, evaluator, options) {
    if (node.name === undefined) {
        return null;
    }
    const tmplDef = attemptExtractTemplateDefinition(node, checker$1, reflector, resourceLoader);
    if (tmplDef === null) {
        return null;
    }
    return program.extractTemplate(node, tmplDef, evaluator, null, resourceLoader, {
        enableBlockSyntax: true,
        enableLetSyntax: true,
        usePoisonedData: true,
        enableI18nLegacyMessageIdFormat: options.enableI18nLegacyMessageIdFormat !== false,
        i18nNormalizeLineEndingsInICUs: options.i18nNormalizeLineEndingsInICUs === true,
    }, checker.CompilationMode.FULL).nodes;
}

/** Gets the pattern and property name for a given binding element. */
function resolveBindingElement(node) {
    const name = node.propertyName ?? node.name;
    // If we are discovering a non-analyzable element in the path, abort.
    if (!ts__default["default"].isStringLiteralLike(name) && !ts__default["default"].isIdentifier(name)) {
        return null;
    }
    return {
        pattern: node.parent,
        propertyName: name.text,
    };
}
/** Gets the declaration node of the given binding element. */
function getBindingElementDeclaration(node) {
    while (true) {
        if (ts__default["default"].isBindingElement(node.parent.parent)) {
            node = node.parent.parent;
        }
        else {
            return node.parent.parent;
        }
    }
}

/**
 * Expands the given reference to its containing expression, capturing
 * the full context.
 *
 * E.g. `traverseAccess(ref<`bla`>)` may return `this.bla`
 *   or `traverseAccess(ref<`bla`>)` may return `this.someObj.a.b.c.bla`.
 *
 * This helper is useful as we will replace the full access with a temporary
 * variable for narrowing. Replacing just the identifier is wrong.
 */
function traverseAccess(access) {
    if (ts__default["default"].isPropertyAccessExpression(access.parent) && access.parent.name === access) {
        return access.parent;
    }
    else if (ts__default["default"].isElementAccessExpression(access.parent) &&
        access.parent.argumentExpression === access) {
        return access.parent;
    }
    return access;
}

/**
 * Unwraps the parent of the given node, if it's a
 * parenthesized expression or `as` expression.
 */
function unwrapParent(node) {
    if (ts__default["default"].isParenthesizedExpression(node.parent)) {
        return unwrapParent(node.parent);
    }
    else if (ts__default["default"].isAsExpression(node.parent)) {
        return unwrapParent(node.parent);
    }
    return node;
}

/**
 * List of binary operators that indicate a write operation.
 *
 * Useful for figuring out whether an expression assigns to
 * something or not.
 */
const writeBinaryOperators = [
    ts__default["default"].SyntaxKind.EqualsToken,
    ts__default["default"].SyntaxKind.BarBarEqualsToken,
    ts__default["default"].SyntaxKind.BarEqualsToken,
    ts__default["default"].SyntaxKind.AmpersandEqualsToken,
    ts__default["default"].SyntaxKind.AmpersandAmpersandEqualsToken,
    ts__default["default"].SyntaxKind.SlashEqualsToken,
    ts__default["default"].SyntaxKind.MinusEqualsToken,
    ts__default["default"].SyntaxKind.PlusEqualsToken,
    ts__default["default"].SyntaxKind.CaretEqualsToken,
    ts__default["default"].SyntaxKind.PercentEqualsToken,
    ts__default["default"].SyntaxKind.AsteriskEqualsToken,
    ts__default["default"].SyntaxKind.ExclamationEqualsToken,
];

/**
 * Checks whether given TypeScript reference refers to an Angular input, and captures
 * the reference if possible.
 *
 * @param fieldNamesToConsiderForReferenceLookup List of field names that should be
 *   respected when expensively looking up references to known fields.
 *   May be null if all identifiers should be inspected.
 */
function identifyPotentialTypeScriptReference(node, programInfo, checker, knownFields, result, fieldNamesToConsiderForReferenceLookup, advisors) {
    // Skip all identifiers that never can point to a migrated field.
    // TODO: Capture these assumptions and performance optimizations in the design doc.
    if (fieldNamesToConsiderForReferenceLookup !== null &&
        !fieldNamesToConsiderForReferenceLookup.has(node.text)) {
        return;
    }
    let target = undefined;
    // Resolve binding elements to their declaration symbol.
    // Commonly inputs are accessed via object expansion. e.g. `const {input} = this;`.
    if (ts__default["default"].isBindingElement(node.parent)) {
        // Skip binding elements that are using spread.
        if (node.parent.dotDotDotToken !== undefined) {
            return;
        }
        const bindingInfo = resolveBindingElement(node.parent);
        if (bindingInfo === null) {
            // The declaration could not be resolved. Skip analyzing this.
            return;
        }
        const bindingType = checker.getTypeAtLocation(bindingInfo.pattern);
        const resolved = lookupPropertyAccess(checker, bindingType, [bindingInfo.propertyName]);
        target = resolved?.symbol;
    }
    else {
        target = checker.getSymbolAtLocation(node);
    }
    noTargetSymbolCheck: if (target === undefined) {
        if (ts__default["default"].isPropertyAccessExpression(node.parent) && node.parent.name === node) {
            const propAccessSymbol = checker.getSymbolAtLocation(node.parent.expression);
            if (propAccessSymbol !== undefined &&
                propAccessSymbol.valueDeclaration !== undefined &&
                ts__default["default"].isVariableDeclaration(propAccessSymbol.valueDeclaration) &&
                propAccessSymbol.valueDeclaration.initializer !== undefined) {
                target = advisors.debugElComponentInstanceTracker
                    .detect(propAccessSymbol.valueDeclaration.initializer)
                    ?.getProperty(node.text);
                // We found a target in the fallback path. Break out.
                if (target !== undefined) {
                    break noTargetSymbolCheck;
                }
            }
        }
        return;
    }
    let targetInput = knownFields.attemptRetrieveDescriptorFromSymbol(target);
    if (targetInput === null) {
        return;
    }
    const access = unwrapParent(traverseAccess(node));
    const accessParent = access.parent;
    const isWriteReference = ts__default["default"].isBinaryExpression(accessParent) &&
        accessParent.left === access &&
        writeBinaryOperators.includes(accessParent.operatorToken.kind);
    // track accesses from source files to known fields.
    result.references.push({
        kind: exports.ReferenceKind.TsReference,
        from: {
            node,
            file: projectFile(node.getSourceFile(), programInfo),
            isWrite: isWriteReference,
            isPartOfElementBinding: ts__default["default"].isBindingElement(node.parent),
        },
        target: targetInput,
    });
}

/**
 * Phase where we iterate through all source file references and
 * detect references to known fields (e.g. commonly inputs).
 *
 * This is useful, for example in the signal input migration whe
 * references need to be migrated to unwrap signals, given that
 * their target properties is no longer holding a raw value, but
 * instead an `InputSignal`.
 *
 * This phase detects references in all types of locations:
 *    - TS source files
 *    - Angular templates (inline or external)
 *    - Host binding expressions.
 */
function createFindAllSourceFileReferencesVisitor(programInfo, checker, reflector, resourceLoader, evaluator, templateTypeChecker, knownFields, fieldNamesToConsiderForReferenceLookup, result) {
    const debugElComponentInstanceTracker = new DebugElementComponentInstance(checker);
    const partialDirectiveCatalystTracker = new PartialDirectiveTypeInCatalystTests(checker, knownFields);
    const perfCounters = {
        template: 0,
        hostBindings: 0,
        tsReferences: 0,
        tsTypes: 0,
    };
    // Schematic NodeJS execution may not have `global.performance` defined.
    const currentTimeInMs = () => typeof global.performance !== 'undefined' ? global.performance.now() : Date.now();
    const visitor = (node) => {
        let lastTime = currentTimeInMs();
        // Note: If there is no template type checker and resource loader, we aren't processing
        // an Angular program, and can skip template detection.
        if (ts__default["default"].isClassDeclaration(node) && templateTypeChecker !== null && resourceLoader !== null) {
            identifyTemplateReferences(programInfo, node, reflector, checker, evaluator, templateTypeChecker, resourceLoader, programInfo.userOptions, result, knownFields, fieldNamesToConsiderForReferenceLookup);
            perfCounters.template += (currentTimeInMs() - lastTime) / 1000;
            lastTime = currentTimeInMs();
            identifyHostBindingReferences(node, programInfo, checker, reflector, result, knownFields, fieldNamesToConsiderForReferenceLookup);
            perfCounters.hostBindings += (currentTimeInMs() - lastTime) / 1000;
            lastTime = currentTimeInMs();
        }
        lastTime = currentTimeInMs();
        // find references, but do not capture input declarations itself.
        if (ts__default["default"].isIdentifier(node) &&
            !(isInputContainerNode(node.parent) && node.parent.name === node)) {
            identifyPotentialTypeScriptReference(node, programInfo, checker, knownFields, result, fieldNamesToConsiderForReferenceLookup, {
                debugElComponentInstanceTracker,
            });
        }
        perfCounters.tsReferences += (currentTimeInMs() - lastTime) / 1000;
        lastTime = currentTimeInMs();
        // Detect `Partial<T>` references.
        // Those are relevant to be tracked as they may be updated in Catalyst to
        // unwrap signal inputs. Commonly people use `Partial` in Catalyst to type
        // some "component initial values".
        const partialDirectiveInCatalyst = partialDirectiveCatalystTracker.detect(node);
        if (partialDirectiveInCatalyst !== null) {
            result.references.push({
                kind: exports.ReferenceKind.TsClassTypeReference,
                from: {
                    file: projectFile(partialDirectiveInCatalyst.referenceNode.getSourceFile(), programInfo),
                    node: partialDirectiveInCatalyst.referenceNode,
                },
                isPartialReference: true,
                isPartOfCatalystFile: true,
                target: partialDirectiveInCatalyst.targetClass,
            });
        }
        perfCounters.tsTypes += (currentTimeInMs() - lastTime) / 1000;
    };
    return {
        visitor,
        debugPrintMetrics: () => {
            console.info('Source file analysis performance', perfCounters);
        },
    };
}

/**
 * Synchronously combines unit data for the given migration.
 *
 * Note: This helper is useful for testing and execution of
 * Tsurge migrations in non-batchable environments. In general,
 * prefer parallel execution of combining via e.g. Beam combiners.
 */
async function synchronouslyCombineUnitData(migration, unitDatas) {
    if (unitDatas.length === 0) {
        return null;
    }
    if (unitDatas.length === 1) {
        return unitDatas[0];
    }
    let combined = unitDatas[0];
    for (let i = 1; i < unitDatas.length; i++) {
        const other = unitDatas[i];
        combined = await migration.combine(combined, other);
    }
    return combined;
}

exports.DevkitMigrationFilesystem = DevkitMigrationFilesystem;
exports.Replacement = Replacement;
exports.TextUpdate = TextUpdate;
exports.TsurgeComplexMigration = TsurgeComplexMigration;
exports.TsurgeFunnelMigration = TsurgeFunnelMigration;
exports.applyImportManagerChanges = applyImportManagerChanges;
exports.confirmAsSerializable = confirmAsSerializable;
exports.createBaseProgramInfo = createBaseProgramInfo;
exports.createFindAllSourceFileReferencesVisitor = createFindAllSourceFileReferencesVisitor;
exports.getBindingElementDeclaration = getBindingElementDeclaration;
exports.getMemberName = getMemberName;
exports.groupReplacementsByFile = groupReplacementsByFile;
exports.isHostBindingReference = isHostBindingReference;
exports.isInputContainerNode = isInputContainerNode;
exports.isTemplateReference = isTemplateReference;
exports.isTsClassTypeReference = isTsClassTypeReference;
exports.isTsReference = isTsReference;
exports.projectFile = projectFile;
exports.synchronouslyCombineUnitData = synchronouslyCombineUnitData;
exports.traverseAccess = traverseAccess;
exports.unwrapParent = unwrapParent;
