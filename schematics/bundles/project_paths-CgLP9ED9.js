'use strict';
/**
 * @license Angular v20.0.0-next.6+sha-2b59031
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var index = require('./index-CoAGLFOm.js');
var schematics = require('@angular-devkit/schematics');
var core = require('@angular-devkit/core');
var posixPath = require('node:path/posix');
var os = require('os');
var ts = require('typescript');
var checker = require('./checker-BFBQyesT.js');
require('./compiler-BQ7R7w2v.js');
require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.js');

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

var posixPath__namespace = /*#__PURE__*/_interopNamespaceDefault(posixPath);
var os__namespace = /*#__PURE__*/_interopNamespaceDefault(os);

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
            ? ts.createSourceFile(fileName, text, languageVersion, true)
            : undefined;
    }
    getDefaultLibFileName(options) {
        return this.fs.join(this.getDefaultLibLocation(), ts.getDefaultLibFileName(options));
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
            case ts.NewLineKind.CarriageReturnLineFeed:
                return '\r\n';
            case ts.NewLineKind.LineFeed:
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
// and their TypeScript compiler host `readDirectory` implementation. TypeScript's
// function implements complex logic for matching files with respect to root
// directory, extensions, excludes, includes etc. The function is currently
// internal but we can use it as the API most likely will not change any time soon,
// nor does it seem like this is being made public any time soon.
// Related issue for tracking: https://github.com/microsoft/TypeScript/issues/13793.
/**
 * Creates a {@link ts.CompilerHost#readDirectory} implementation function,
 * that leverages the specified file system (that may be e.g. virtual).
 */
function createFileSystemTsReadDirectoryFn(fs) {
    if (ts.matchFiles === undefined) {
        throw Error('Unable to read directory in configured file system. This means that ' +
            'TypeScript changed its file matching internals.\n\nPlease consider downgrading your ' +
            'TypeScript version, and report an issue in the Angular framework repository.');
    }
    const matchFilesFn = ts.matchFiles.bind(ts);
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
        const readConfigFile = (configFile) => ts.readConfigFile(configFile, (file) => host.readFile(host.resolve(file)));
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
                emitFlags: index.EmitFlags.Default,
            };
        }
        const existingCompilerOptions = {
            genDir: basePath,
            basePath,
            ...readAngularCompilerOptions(configFileName),
            ...existingOptions,
        };
        const parseConfigHost = createParseConfigHost(host, fs);
        const { options, errors, fileNames: rootNames, projectReferences, } = ts.parseJsonConfigFileContent(config, parseConfigHost, basePath, existingCompilerOptions, configFileName);
        let emitFlags = index.EmitFlags.Default;
        if (!(options['skipMetadataEmit'] || options['flatModuleOutFile'])) {
            emitFlags |= index.EmitFlags.Metadata;
        }
        if (options['skipTemplateCodegen']) {
            emitFlags = emitFlags & ~index.EmitFlags.Codegen;
        }
        return { project: projectFile, rootNames, projectReferences, options, errors, emitFlags };
    }
    catch (e) {
        const errors = [
            {
                category: ts.DiagnosticCategory.Error,
                messageText: e.stack ?? e.message,
                file: undefined,
                start: undefined,
                length: undefined,
                source: 'angular',
                code: index.UNKNOWN_ERROR_CODE,
            },
        ];
        return { project: '', errors, rootNames: [], options: {}, emitFlags: index.EmitFlags.Default };
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
        const { resolvedModule } = ts.nodeModuleNameResolver(extendsValue, configFile, { moduleResolution: ts.ModuleResolutionKind.Node10, resolveJsonModule: true }, parseConfigHost);
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
    // Does not apply to g3 and externally is enforced when the app is built by the compiler.
    disableTypeScriptVersionCheck: true,
};
/**
 * Creates an instance of a TypeScript program for the given project.
 */
function createPlainTsProgram(tsHost, tsconfig, optionOverrides) {
    const program = ts.createProgram({
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
    const ngtscProgram = new index.NgtscProgram(tsconfig.rootNames, {
        ...tsconfig.options,
        ...defaultMigrationTsOptions,
        ...optionOverrides,
    }, tsHost);
    // Expose an easy way to debug-print ng semantic diagnostics.
    if (process.env['DEBUG_NG_SEMANTIC_DIAGNOSTICS'] === '1') {
        console.error(ts.formatDiagnosticsWithColorAndContext(ngtscProgram.getNgSemanticDiagnostics(), tsHost));
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
    createProgram(tsconfigAbsPath, fs, optionOverrides) {
        return createBaseProgramInfo(tsconfigAbsPath, fs, optionOverrides);
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

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
exports.MigrationStage = void 0;
(function (MigrationStage) {
    /** The migration is analyzing an entrypoint */
    MigrationStage[MigrationStage["Analysis"] = 0] = "Analysis";
    /** The migration is about to migrate an entrypoint */
    MigrationStage[MigrationStage["Migrate"] = 1] = "Migrate";
})(exports.MigrationStage || (exports.MigrationStage = {}));
/** Runs a Tsurge within an Angular Devkit context. */
async function runMigrationInDevkit(config) {
    const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(config.tree);
    if (!buildPaths.length && !testPaths.length) {
        throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the migration.');
    }
    const tsconfigPaths = [...buildPaths, ...testPaths];
    const fs = new DevkitMigrationFilesystem(config.tree);
    checker.setFileSystem(fs);
    const migration = config.getMigration(fs);
    const unitResults = [];
    const isFunnelMigration = migration instanceof TsurgeFunnelMigration;
    for (const tsconfigPath of tsconfigPaths) {
        config.beforeProgramCreation?.(tsconfigPath, exports.MigrationStage.Analysis);
        const baseInfo = migration.createProgram(tsconfigPath, fs);
        const info = migration.prepareProgram(baseInfo);
        config.afterProgramCreation?.(info, fs, exports.MigrationStage.Analysis);
        config.beforeUnitAnalysis?.(tsconfigPath);
        unitResults.push(await migration.analyze(info));
    }
    config.afterAllAnalyzed?.();
    const combined = await synchronouslyCombineUnitData(migration, unitResults);
    if (combined === null) {
        config.afterAnalysisFailure?.();
        return;
    }
    const globalMeta = await migration.globalMeta(combined);
    let replacements;
    if (isFunnelMigration) {
        replacements = (await migration.migrate(globalMeta)).replacements;
    }
    else {
        replacements = [];
        for (const tsconfigPath of tsconfigPaths) {
            config.beforeProgramCreation?.(tsconfigPath, exports.MigrationStage.Migrate);
            const baseInfo = migration.createProgram(tsconfigPath, fs);
            const info = migration.prepareProgram(baseInfo);
            config.afterProgramCreation?.(info, fs, exports.MigrationStage.Migrate);
            const result = await migration.migrate(globalMeta, info);
            replacements.push(...result.replacements);
        }
    }
    const replacementsPerFile = new Map();
    const changesPerFile = groupReplacementsByFile(replacements);
    for (const [file, changes] of changesPerFile) {
        if (!replacementsPerFile.has(file)) {
            replacementsPerFile.set(file, changes);
        }
    }
    for (const [file, changes] of replacementsPerFile) {
        const recorder = config.tree.beginUpdate(file);
        for (const c of changes) {
            recorder
                .remove(c.data.position, c.data.end - c.data.position)
                .insertRight(c.data.position, c.data.toInsert);
        }
        config.tree.commitUpdate(recorder);
    }
    config.whenDone?.(await migration.stats(globalMeta));
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

exports.Replacement = Replacement;
exports.TextUpdate = TextUpdate;
exports.TsurgeComplexMigration = TsurgeComplexMigration;
exports.TsurgeFunnelMigration = TsurgeFunnelMigration;
exports.confirmAsSerializable = confirmAsSerializable;
exports.createBaseProgramInfo = createBaseProgramInfo;
exports.projectFile = projectFile;
exports.runMigrationInDevkit = runMigrationInDevkit;
