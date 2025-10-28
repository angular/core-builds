'use strict';
/**
 * @license Angular v21.1.0-next.0+sha-f2de963
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var o = require('@angular/compiler');
var ts = require('typescript');
var p = require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-PsYr_U7n.cjs');
require('os');

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

const TS_EXTENSIONS = /\.tsx?$/i;
/**
 * Replace the .ts or .tsx extension of a file with the shim filename suffix.
 */
function makeShimFileName(fileName, suffix) {
    return project_tsconfig_paths.absoluteFrom(fileName.replace(TS_EXTENSIONS, suffix));
}

/**
 * Generates and tracks shim files for each original `ts.SourceFile`.
 *
 * The `ShimAdapter` provides an API that's designed to be used by a `ts.CompilerHost`
 * implementation and allows it to include synthetic "shim" files in the program that's being
 * created. It works for both freshly created programs as well as with reuse of an older program
 * (which already may contain shim files and thus have a different creation flow).
 */
class ShimAdapter {
    delegate;
    /**
     * A map of shim file names to the `ts.SourceFile` generated for those shims.
     */
    shims = new Map();
    /**
     * A map of shim file names to existing shims which were part of a previous iteration of this
     * program.
     *
     * Not all of these shims will be inherited into this program.
     */
    priorShims = new Map();
    /**
     * File names which are already known to not be shims.
     *
     * This allows for short-circuit returns without the expense of running regular expressions
     * against the filename repeatedly.
     */
    notShims = new Set();
    /**
     * The shim generators supported by this adapter as well as extra precalculated data facilitating
     * their use.
     */
    generators = [];
    /**
     * A `Set` of shim `ts.SourceFile`s which should not be emitted.
     */
    ignoreForEmit = new Set();
    /**
     * A list of extra filenames which should be considered inputs to program creation.
     *
     * This includes any top-level shims generated for the program, as well as per-file shim names for
     * those files which are included in the root files of the program.
     */
    extraInputFiles;
    /**
     * Extension prefixes of all installed per-file shims.
     */
    extensionPrefixes = [];
    constructor(delegate, tsRootFiles, topLevelGenerators, perFileGenerators, oldProgram) {
        this.delegate = delegate;
        // Initialize `this.generators` with a regex that matches each generator's paths.
        for (const gen of perFileGenerators) {
            // This regex matches paths for shims from this generator. The first (and only) capture group
            // extracts the filename prefix, which can be used to find the original file that was used to
            // generate this shim.
            const pattern = `^(.*)\\.${gen.extensionPrefix}\\.ts$`;
            const regexp = new RegExp(pattern, 'i');
            this.generators.push({
                generator: gen,
                test: regexp,
                suffix: `.${gen.extensionPrefix}.ts`,
            });
            this.extensionPrefixes.push(gen.extensionPrefix);
        }
        // Process top-level generators and pre-generate their shims. Accumulate the list of filenames
        // as extra input files.
        const extraInputFiles = [];
        for (const gen of topLevelGenerators) {
            const sf = gen.makeTopLevelShim();
            project_tsconfig_paths.sfExtensionData(sf).isTopLevelShim = true;
            if (!gen.shouldEmit) {
                this.ignoreForEmit.add(sf);
            }
            const fileName = project_tsconfig_paths.absoluteFromSourceFile(sf);
            this.shims.set(fileName, sf);
            extraInputFiles.push(fileName);
        }
        // Add to that list the per-file shims associated with each root file. This is needed because
        // reference tagging alone may not work in TS compilations that have `noResolve` set. Such
        // compilations rely on the list of input files completely describing the program.
        for (const rootFile of tsRootFiles) {
            for (const gen of this.generators) {
                extraInputFiles.push(makeShimFileName(rootFile, gen.suffix));
            }
        }
        this.extraInputFiles = extraInputFiles;
        // If an old program is present, extract all per-file shims into a map, which will be used to
        // generate new versions of those shims.
        if (oldProgram !== null) {
            for (const oldSf of oldProgram.getSourceFiles()) {
                if (oldSf.isDeclarationFile || !project_tsconfig_paths.isFileShimSourceFile(oldSf)) {
                    continue;
                }
                this.priorShims.set(project_tsconfig_paths.absoluteFromSourceFile(oldSf), oldSf);
            }
        }
    }
    /**
     * Produce a shim `ts.SourceFile` if `fileName` refers to a shim file which should exist in the
     * program.
     *
     * If `fileName` does not refer to a potential shim file, `null` is returned. If a corresponding
     * base file could not be determined, `undefined` is returned instead.
     */
    maybeGenerate(fileName) {
        // Fast path: either this filename has been proven not to be a shim before, or it is a known
        // shim and no generation is required.
        if (this.notShims.has(fileName)) {
            return null;
        }
        else if (this.shims.has(fileName)) {
            return this.shims.get(fileName);
        }
        // .d.ts files can't be shims.
        if (project_tsconfig_paths.isDtsPath(fileName)) {
            this.notShims.add(fileName);
            return null;
        }
        // This is the first time seeing this path. Try to match it against a shim generator.
        for (const record of this.generators) {
            const match = record.test.exec(fileName);
            if (match === null) {
                continue;
            }
            // The path matched. Extract the filename prefix without the extension.
            const prefix = match[1];
            // This _might_ be a shim, if an underlying base file exists. The base file might be .ts or
            // .tsx.
            let baseFileName = project_tsconfig_paths.absoluteFrom(prefix + '.ts');
            // Retrieve the original file for which the shim will be generated.
            let inputFile = this.delegate.getSourceFile(baseFileName, ts.ScriptTarget.Latest);
            if (inputFile === undefined) {
                // No .ts file by that name - try .tsx.
                baseFileName = project_tsconfig_paths.absoluteFrom(prefix + '.tsx');
                inputFile = this.delegate.getSourceFile(baseFileName, ts.ScriptTarget.Latest);
            }
            if (inputFile === undefined || project_tsconfig_paths.isShim(inputFile)) {
                // This isn't a shim after all since there is no original file which would have triggered
                // its generation, even though the path is right. There are a few reasons why this could
                // occur:
                //
                // * when resolving an import to an .ngfactory.d.ts file, the module resolution algorithm
                //   will first look for an .ngfactory.ts file in its place, which will be requested here.
                // * when the user writes a bad import.
                // * when a file is present in one compilation and removed in the next incremental step.
                //
                // Note that this does not add the filename to `notShims`, so this path is not cached.
                // That's okay as these cases above are edge cases and do not occur regularly in normal
                // operations.
                return undefined;
            }
            // Actually generate and cache the shim.
            return this.generateSpecific(fileName, record.generator, inputFile);
        }
        // No generator matched.
        this.notShims.add(fileName);
        return null;
    }
    generateSpecific(fileName, generator, inputFile) {
        let priorShimSf = null;
        if (this.priorShims.has(fileName)) {
            // In the previous program a shim with this name already existed. It's passed to the shim
            // generator which may reuse it instead of generating a fresh shim.
            priorShimSf = this.priorShims.get(fileName);
            this.priorShims.delete(fileName);
        }
        const shimSf = generator.generateShimForFile(inputFile, fileName, priorShimSf);
        // Mark the new generated source file as a shim that originated from this generator.
        project_tsconfig_paths.sfExtensionData(shimSf).fileShim = {
            extension: generator.extensionPrefix,
            generatedFrom: project_tsconfig_paths.absoluteFromSourceFile(inputFile),
        };
        if (!generator.shouldEmit) {
            this.ignoreForEmit.add(shimSf);
        }
        this.shims.set(fileName, shimSf);
        return shimSf;
    }
}

/**
 * Manipulates the `referencedFiles` property of `ts.SourceFile`s to add references to shim files
 * for each original source file, causing the shims to be loaded into the program as well.
 *
 * `ShimReferenceTagger`s are intended to operate during program creation only.
 */
class ShimReferenceTagger {
    suffixes;
    /**
     * Tracks which original files have been processed and had shims generated if necessary.
     *
     * This is used to avoid generating shims twice for the same file.
     */
    tagged = new Set();
    /**
     * Whether shim tagging is currently being performed.
     */
    enabled = true;
    constructor(shimExtensions) {
        this.suffixes = shimExtensions.map((extension) => `.${extension}.ts`);
    }
    /**
     * Tag `sf` with any needed references if it's not a shim itself.
     */
    tag(sf) {
        if (!this.enabled ||
            sf.isDeclarationFile ||
            project_tsconfig_paths.isShim(sf) ||
            this.tagged.has(sf) ||
            !project_tsconfig_paths.isNonDeclarationTsPath(sf.fileName)) {
            return;
        }
        const ext = project_tsconfig_paths.sfExtensionData(sf);
        // If this file has never been tagged before, capture its `referencedFiles` in the extension
        // data.
        if (ext.originalReferencedFiles === null) {
            ext.originalReferencedFiles = sf.referencedFiles;
        }
        const referencedFiles = [...ext.originalReferencedFiles];
        const sfPath = project_tsconfig_paths.absoluteFromSourceFile(sf);
        for (const suffix of this.suffixes) {
            referencedFiles.push({
                fileName: makeShimFileName(sfPath, suffix),
                pos: 0,
                end: 0,
            });
        }
        ext.taggedReferenceFiles = referencedFiles;
        sf.referencedFiles = referencedFiles;
        this.tagged.add(sf);
    }
    /**
     * Disable the `ShimReferenceTagger` and free memory associated with tracking tagged files.
     */
    finalize() {
        this.enabled = false;
        this.tagged.clear();
    }
}

/**
 * Delegates all methods of `ts.CompilerHost` to a delegate, with the exception of
 * `getSourceFile`, `fileExists` and `writeFile` which are implemented in `TypeCheckProgramHost`.
 *
 * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
 * generated for this class.
 */
let DelegatingCompilerHost$1 = class DelegatingCompilerHost {
    delegate;
    createHash;
    directoryExists;
    getCancellationToken;
    getCanonicalFileName;
    getCurrentDirectory;
    getDefaultLibFileName;
    getDefaultLibLocation;
    getDirectories;
    getEnvironmentVariable;
    getNewLine;
    getParsedCommandLine;
    getSourceFileByPath;
    readDirectory;
    readFile;
    realpath;
    resolveModuleNames;
    resolveTypeReferenceDirectives;
    trace;
    useCaseSensitiveFileNames;
    getModuleResolutionCache;
    hasInvalidatedResolutions;
    resolveModuleNameLiterals;
    resolveTypeReferenceDirectiveReferences;
    // jsDocParsingMode is not a method like the other elements above
    // TODO: ignore usage can be dropped once 5.2 support is dropped
    get jsDocParsingMode() {
        // @ts-ignore
        return this.delegate.jsDocParsingMode;
    }
    set jsDocParsingMode(mode) {
        // @ts-ignore
        this.delegate.jsDocParsingMode = mode;
    }
    constructor(delegate) {
        // Excluded are 'getSourceFile', 'fileExists' and 'writeFile', which are actually implemented by
        // `TypeCheckProgramHost` below.
        this.delegate = delegate;
        this.createHash = this.delegateMethod('createHash');
        this.directoryExists = this.delegateMethod('directoryExists');
        this.getCancellationToken = this.delegateMethod('getCancellationToken');
        this.getCanonicalFileName = this.delegateMethod('getCanonicalFileName');
        this.getCurrentDirectory = this.delegateMethod('getCurrentDirectory');
        this.getDefaultLibFileName = this.delegateMethod('getDefaultLibFileName');
        this.getDefaultLibLocation = this.delegateMethod('getDefaultLibLocation');
        this.getDirectories = this.delegateMethod('getDirectories');
        this.getEnvironmentVariable = this.delegateMethod('getEnvironmentVariable');
        this.getNewLine = this.delegateMethod('getNewLine');
        this.getParsedCommandLine = this.delegateMethod('getParsedCommandLine');
        this.getSourceFileByPath = this.delegateMethod('getSourceFileByPath');
        this.readDirectory = this.delegateMethod('readDirectory');
        this.readFile = this.delegateMethod('readFile');
        this.realpath = this.delegateMethod('realpath');
        this.resolveModuleNames = this.delegateMethod('resolveModuleNames');
        this.resolveTypeReferenceDirectives = this.delegateMethod('resolveTypeReferenceDirectives');
        this.trace = this.delegateMethod('trace');
        this.useCaseSensitiveFileNames = this.delegateMethod('useCaseSensitiveFileNames');
        this.getModuleResolutionCache = this.delegateMethod('getModuleResolutionCache');
        this.hasInvalidatedResolutions = this.delegateMethod('hasInvalidatedResolutions');
        this.resolveModuleNameLiterals = this.delegateMethod('resolveModuleNameLiterals');
        this.resolveTypeReferenceDirectiveReferences = this.delegateMethod('resolveTypeReferenceDirectiveReferences');
    }
    delegateMethod(name) {
        return this.delegate[name] !== undefined
            ? this.delegate[name].bind(this.delegate)
            : undefined;
    }
};
/**
 * A `ts.CompilerHost` which augments source files.
 */
class UpdatedProgramHost extends DelegatingCompilerHost$1 {
    originalProgram;
    shimExtensionPrefixes;
    /**
     * Map of source file names to `ts.SourceFile` instances.
     */
    sfMap;
    /**
     * The `ShimReferenceTagger` responsible for tagging `ts.SourceFile`s loaded via this host.
     *
     * The `UpdatedProgramHost` is used in the creation of a new `ts.Program`. Even though this new
     * program is based on a prior one, TypeScript will still start from the root files and enumerate
     * all source files to include in the new program.  This means that just like during the original
     * program's creation, these source files must be tagged with references to per-file shims in
     * order for those shims to be loaded, and then cleaned up afterwards. Thus the
     * `UpdatedProgramHost` has its own `ShimReferenceTagger` to perform this function.
     */
    shimTagger;
    constructor(sfMap, originalProgram, delegate, shimExtensionPrefixes) {
        super(delegate);
        this.originalProgram = originalProgram;
        this.shimExtensionPrefixes = shimExtensionPrefixes;
        this.shimTagger = new ShimReferenceTagger(this.shimExtensionPrefixes);
        this.sfMap = sfMap;
    }
    getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) {
        // Try to use the same `ts.SourceFile` as the original program, if possible. This guarantees
        // that program reuse will be as efficient as possible.
        let delegateSf = this.originalProgram.getSourceFile(fileName);
        if (delegateSf === undefined) {
            // Something went wrong and a source file is being requested that's not in the original
            // program. Just in case, try to retrieve it from the delegate.
            delegateSf = this.delegate.getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile);
        }
        if (delegateSf === undefined) {
            return undefined;
        }
        // Look for replacements.
        let sf;
        if (this.sfMap.has(fileName)) {
            sf = this.sfMap.get(fileName);
            project_tsconfig_paths.copyFileShimData(delegateSf, sf);
        }
        else {
            sf = delegateSf;
        }
        // TypeScript doesn't allow returning redirect source files. To avoid unforeseen errors we
        // return the original source file instead of the redirect target.
        sf = project_tsconfig_paths.toUnredirectedSourceFile(sf);
        this.shimTagger.tag(sf);
        return sf;
    }
    postProgramCreationCleanup() {
        this.shimTagger.finalize();
    }
    writeFile() {
        throw new Error(`TypeCheckProgramHost should never write files`);
    }
    fileExists(fileName) {
        return this.sfMap.has(fileName) || this.delegate.fileExists(fileName);
    }
}
/**
 * Updates a `ts.Program` instance with a new one that incorporates specific changes, using the
 * TypeScript compiler APIs for incremental program creation.
 */
class TsCreateProgramDriver {
    originalProgram;
    originalHost;
    options;
    shimExtensionPrefixes;
    /**
     * A map of source file paths to replacement `ts.SourceFile`s for those paths.
     *
     * Effectively, this tracks the delta between the user's program (represented by the
     * `originalHost`) and the template type-checking program being managed.
     */
    sfMap = new Map();
    program;
    constructor(originalProgram, originalHost, options, shimExtensionPrefixes) {
        this.originalProgram = originalProgram;
        this.originalHost = originalHost;
        this.options = options;
        this.shimExtensionPrefixes = shimExtensionPrefixes;
        this.program = this.originalProgram;
    }
    supportsInlineOperations = true;
    getProgram() {
        return this.program;
    }
    updateFiles(contents, updateMode) {
        if (contents.size === 0) {
            // No changes have been requested. Is it safe to skip updating entirely?
            // If UpdateMode is Incremental, then yes. If UpdateMode is Complete, then it's safe to skip
            // only if there are no active changes already (that would be cleared by the update).
            if (updateMode !== project_tsconfig_paths.UpdateMode.Complete || this.sfMap.size === 0) {
                // No changes would be made to the `ts.Program` anyway, so it's safe to do nothing here.
                return;
            }
        }
        if (updateMode === project_tsconfig_paths.UpdateMode.Complete) {
            this.sfMap.clear();
        }
        for (const [filePath, { newText, originalFile }] of contents.entries()) {
            const sf = ts.createSourceFile(filePath, newText, ts.ScriptTarget.Latest, true);
            if (originalFile !== null) {
                sf[project_tsconfig_paths.NgOriginalFile] = originalFile;
            }
            this.sfMap.set(filePath, sf);
        }
        const host = new UpdatedProgramHost(this.sfMap, this.originalProgram, this.originalHost, this.shimExtensionPrefixes);
        const oldProgram = this.program;
        // Retag the old program's `ts.SourceFile`s with shim tags, to allow TypeScript to reuse the
        // most data.
        project_tsconfig_paths.retagAllTsFiles(oldProgram);
        this.program = ts.createProgram({
            host,
            rootNames: this.program.getRootFileNames(),
            options: this.options,
            oldProgram,
        });
        host.postProgramCreationCleanup();
        // Only untag the old program. The new program needs to keep the tagged files, because as of
        // TS 5.5 not having the files tagged while producing diagnostics can lead to errors. See:
        // https://github.com/microsoft/TypeScript/pull/58398
        project_tsconfig_paths.untagAllTsFiles(oldProgram);
    }
}

/// <reference types="node" />
class FlatIndexGenerator {
    entryPoint;
    moduleName;
    flatIndexPath;
    shouldEmit = true;
    constructor(entryPoint, relativeFlatIndexPath, moduleName) {
        this.entryPoint = entryPoint;
        this.moduleName = moduleName;
        this.flatIndexPath =
            project_tsconfig_paths.join(project_tsconfig_paths.dirname(entryPoint), relativeFlatIndexPath).replace(/\.js$/, '') + '.ts';
    }
    makeTopLevelShim() {
        const relativeEntryPoint = project_tsconfig_paths.relativePathBetween(this.flatIndexPath, this.entryPoint);
        const contents = `/**
 * Generated bundle index. Do not edit.
 */

export * from '${relativeEntryPoint}';
`;
        const genFile = ts.createSourceFile(this.flatIndexPath, contents, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
        if (this.moduleName !== null) {
            genFile.moduleName = this.moduleName;
        }
        return genFile;
    }
}

function findFlatIndexEntryPoint(rootFiles) {
    // There are two ways for a file to be recognized as the flat module index:
    // 1) if it's the only file!!!!!!
    // 2) (deprecated) if it's named 'index.ts' and has the shortest path of all such files.
    const tsFiles = rootFiles.filter((file) => project_tsconfig_paths.isNonDeclarationTsPath(file));
    let resolvedEntryPoint = null;
    if (tsFiles.length === 1) {
        // There's only one file - this is the flat module index.
        resolvedEntryPoint = tsFiles[0];
    }
    else {
        // In the event there's more than one TS file, one of them can still be selected as the
        // flat module index if it's named 'index.ts'. If there's more than one 'index.ts', the one
        // with the shortest path wins.
        //
        // This behavior is DEPRECATED and only exists to support existing usages.
        for (const tsFile of tsFiles) {
            if (project_tsconfig_paths.getFileSystem().basename(tsFile) === 'index.ts' &&
                (resolvedEntryPoint === null || tsFile.length <= resolvedEntryPoint.length)) {
                resolvedEntryPoint = tsFile;
            }
        }
    }
    return resolvedEntryPoint;
}

/**
 * A noop implementation of `IncrementalBuildStrategy` which neither returns nor tracks any
 * incremental data.
 */
/**
 * Tracks an `IncrementalState` within the strategy itself.
 */
class TrackedIncrementalBuildStrategy {
    state = null;
    isSet = false;
    getIncrementalState() {
        return this.state;
    }
    setIncrementalState(state) {
        this.state = state;
        this.isSet = true;
    }
    toNextBuildStrategy() {
        const strategy = new TrackedIncrementalBuildStrategy();
        // Only reuse state that was explicitly set via `setIncrementalState`.
        strategy.state = this.isSet ? this.state : null;
        return strategy;
    }
}

// A persistent source of bugs in CompilerHost delegation has been the addition by TS of new,
// optional methods on ts.CompilerHost. Since these methods are optional, it's not a type error that
// the delegating host doesn't implement or delegate them. This causes subtle runtime failures. No
// more. This infrastructure ensures that failing to delegate a method is a compile-time error.
/**
 * Delegates all methods of `ExtendedTsCompilerHost` to a delegate, with the exception of
 * `getSourceFile` and `fileExists` which are implemented in `NgCompilerHost`.
 *
 * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
 * generated for this class.
 */
class DelegatingCompilerHost {
    delegate;
    createHash;
    directoryExists;
    fileNameToModuleName;
    getCancellationToken;
    getCanonicalFileName;
    getCurrentDirectory;
    getDefaultLibFileName;
    getDefaultLibLocation;
    getDirectories;
    getEnvironmentVariable;
    getModifiedResourceFiles;
    getNewLine;
    getParsedCommandLine;
    getSourceFileByPath;
    readDirectory;
    readFile;
    readResource;
    transformResource;
    realpath;
    resolveModuleNames;
    resolveTypeReferenceDirectives;
    resourceNameToFileName;
    trace;
    useCaseSensitiveFileNames;
    writeFile;
    getModuleResolutionCache;
    hasInvalidatedResolutions;
    resolveModuleNameLiterals;
    resolveTypeReferenceDirectiveReferences;
    // jsDocParsingMode is not a method like the other elements above
    // TODO: ignore usage can be dropped once 5.2 support is dropped
    get jsDocParsingMode() {
        // @ts-ignore
        return this.delegate.jsDocParsingMode;
    }
    set jsDocParsingMode(mode) {
        // @ts-ignore
        this.delegate.jsDocParsingMode = mode;
    }
    constructor(delegate) {
        this.delegate = delegate;
        // Excluded are 'getSourceFile' and 'fileExists', which are actually implemented by
        // NgCompilerHost
        // below.
        this.createHash = this.delegateMethod('createHash');
        this.directoryExists = this.delegateMethod('directoryExists');
        this.fileNameToModuleName = this.delegateMethod('fileNameToModuleName');
        this.getCancellationToken = this.delegateMethod('getCancellationToken');
        this.getCanonicalFileName = this.delegateMethod('getCanonicalFileName');
        this.getCurrentDirectory = this.delegateMethod('getCurrentDirectory');
        this.getDefaultLibFileName = this.delegateMethod('getDefaultLibFileName');
        this.getDefaultLibLocation = this.delegateMethod('getDefaultLibLocation');
        this.getDirectories = this.delegateMethod('getDirectories');
        this.getEnvironmentVariable = this.delegateMethod('getEnvironmentVariable');
        this.getModifiedResourceFiles = this.delegateMethod('getModifiedResourceFiles');
        this.getNewLine = this.delegateMethod('getNewLine');
        this.getParsedCommandLine = this.delegateMethod('getParsedCommandLine');
        this.getSourceFileByPath = this.delegateMethod('getSourceFileByPath');
        this.readDirectory = this.delegateMethod('readDirectory');
        this.readFile = this.delegateMethod('readFile');
        this.readResource = this.delegateMethod('readResource');
        this.transformResource = this.delegateMethod('transformResource');
        this.realpath = this.delegateMethod('realpath');
        this.resolveModuleNames = this.delegateMethod('resolveModuleNames');
        this.resolveTypeReferenceDirectives = this.delegateMethod('resolveTypeReferenceDirectives');
        this.resourceNameToFileName = this.delegateMethod('resourceNameToFileName');
        this.trace = this.delegateMethod('trace');
        this.useCaseSensitiveFileNames = this.delegateMethod('useCaseSensitiveFileNames');
        this.writeFile = this.delegateMethod('writeFile');
        this.getModuleResolutionCache = this.delegateMethod('getModuleResolutionCache');
        this.hasInvalidatedResolutions = this.delegateMethod('hasInvalidatedResolutions');
        this.resolveModuleNameLiterals = this.delegateMethod('resolveModuleNameLiterals');
        this.resolveTypeReferenceDirectiveReferences = this.delegateMethod('resolveTypeReferenceDirectiveReferences');
    }
    delegateMethod(name) {
        return this.delegate[name] !== undefined
            ? this.delegate[name].bind(this.delegate)
            : undefined;
    }
}
/**
 * A wrapper around `ts.CompilerHost` (plus any extension methods from `ExtendedTsCompilerHost`).
 *
 * In order for a consumer to include Angular compilation in their TypeScript compiler, the
 * `ts.Program` must be created with a host that adds Angular-specific files (e.g.
 * the template type-checking file, etc) to the compilation. `NgCompilerHost` is the
 * host implementation which supports this.
 *
 * The interface implementations here ensure that `NgCompilerHost` fully delegates to
 * `ExtendedTsCompilerHost` methods whenever present.
 */
class NgCompilerHost extends DelegatingCompilerHost {
    shimAdapter;
    shimTagger;
    entryPoint = null;
    constructionDiagnostics;
    inputFiles;
    rootDirs;
    constructor(delegate, inputFiles, rootDirs, shimAdapter, shimTagger, entryPoint, diagnostics) {
        super(delegate);
        this.shimAdapter = shimAdapter;
        this.shimTagger = shimTagger;
        this.entryPoint = entryPoint;
        this.constructionDiagnostics = diagnostics;
        this.inputFiles = [...inputFiles, ...shimAdapter.extraInputFiles];
        this.rootDirs = rootDirs;
        if (this.resolveModuleNames === undefined) {
            // In order to reuse the module resolution cache during the creation of the type-check
            // program, we'll need to provide `resolveModuleNames` if the delegate did not provide one.
            this.resolveModuleNames = this.createCachedResolveModuleNamesFunction();
        }
    }
    /**
     * Retrieves a set of `ts.SourceFile`s which should not be emitted as JS files.
     *
     * Available after this host is used to create a `ts.Program` (which causes all the files in the
     * program to be enumerated).
     */
    get ignoreForEmit() {
        return this.shimAdapter.ignoreForEmit;
    }
    /**
     * Retrieve the array of shim extension prefixes for which shims were created for each original
     * file.
     */
    get shimExtensionPrefixes() {
        return this.shimAdapter.extensionPrefixes;
    }
    /**
     * Performs cleanup that needs to happen after a `ts.Program` has been created using this host.
     */
    postProgramCreationCleanup() {
        this.shimTagger.finalize();
    }
    /**
     * Create an `NgCompilerHost` from a delegate host, an array of input filenames, and the full set
     * of TypeScript and Angular compiler options.
     */
    static wrap(delegate, inputFiles, options, oldProgram) {
        const topLevelShimGenerators = [];
        const perFileShimGenerators = [];
        const rootDirs = project_tsconfig_paths.getRootDirs(delegate, options);
        perFileShimGenerators.push(new project_tsconfig_paths.TypeCheckShimGenerator());
        let diagnostics = [];
        const normalizedTsInputFiles = [];
        for (const inputFile of inputFiles) {
            if (!project_tsconfig_paths.isNonDeclarationTsPath(inputFile)) {
                continue;
            }
            normalizedTsInputFiles.push(project_tsconfig_paths.resolve(inputFile));
        }
        let entryPoint = null;
        if (options.flatModuleOutFile != null && options.flatModuleOutFile !== '') {
            entryPoint = findFlatIndexEntryPoint(normalizedTsInputFiles);
            if (entryPoint === null) {
                // This error message talks specifically about having a single .ts file in "files". However
                // the actual logic is a bit more permissive. If a single file exists, that will be taken,
                // otherwise the highest level (shortest path) "index.ts" file will be used as the flat
                // module entry point instead. If neither of these conditions apply, the error below is
                // given.
                //
                // The user is not informed about the "index.ts" option as this behavior is deprecated -
                // an explicit entrypoint should always be specified.
                diagnostics.push({
                    category: ts.DiagnosticCategory.Error,
                    code: project_tsconfig_paths.ngErrorCode(project_tsconfig_paths.ErrorCode.CONFIG_FLAT_MODULE_NO_INDEX),
                    file: undefined,
                    start: undefined,
                    length: undefined,
                    messageText: 'Angular compiler option "flatModuleOutFile" requires one and only one .ts file in the "files" field.',
                });
            }
            else {
                const flatModuleId = options.flatModuleId || null;
                const flatModuleOutFile = project_tsconfig_paths.normalizeSeparators(options.flatModuleOutFile);
                const flatIndexGenerator = new FlatIndexGenerator(entryPoint, flatModuleOutFile, flatModuleId);
                topLevelShimGenerators.push(flatIndexGenerator);
            }
        }
        const shimAdapter = new ShimAdapter(delegate, normalizedTsInputFiles, topLevelShimGenerators, perFileShimGenerators, oldProgram);
        const shimTagger = new ShimReferenceTagger(perFileShimGenerators.map((gen) => gen.extensionPrefix));
        return new NgCompilerHost(delegate, inputFiles, rootDirs, shimAdapter, shimTagger, entryPoint, diagnostics);
    }
    /**
     * Check whether the given `ts.SourceFile` is a shim file.
     *
     * If this returns false, the file is user-provided.
     */
    isShim(sf) {
        return project_tsconfig_paths.isShim(sf);
    }
    /**
     * Check whether the given `ts.SourceFile` is a resource file.
     *
     * This simply returns `false` for the compiler-cli since resource files are not added as root
     * files to the project.
     */
    isResource(sf) {
        return false;
    }
    getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile) {
        // Is this a previously known shim?
        const shimSf = this.shimAdapter.maybeGenerate(project_tsconfig_paths.resolve(fileName));
        if (shimSf !== null) {
            // Yes, so return it.
            return shimSf;
        }
        // No, so it's a file which might need shims (or a file which doesn't exist).
        const sf = this.delegate.getSourceFile(fileName, languageVersionOrOptions, onError, shouldCreateNewSourceFile);
        if (sf === undefined) {
            return undefined;
        }
        this.shimTagger.tag(sf);
        return sf;
    }
    fileExists(fileName) {
        // Consider the file as existing whenever
        //  1) it really does exist in the delegate host, or
        //  2) at least one of the shim generators recognizes it
        // Note that we can pass the file name as branded absolute fs path because TypeScript
        // internally only passes POSIX-like paths.
        //
        // Also note that the `maybeGenerate` check below checks for both `null` and `undefined`.
        return (this.delegate.fileExists(fileName) ||
            this.shimAdapter.maybeGenerate(project_tsconfig_paths.resolve(fileName)) != null);
    }
    get unifiedModulesHost() {
        return this.fileNameToModuleName !== undefined ? this : null;
    }
    createCachedResolveModuleNamesFunction() {
        const moduleResolutionCache = ts.createModuleResolutionCache(this.getCurrentDirectory(), this.getCanonicalFileName.bind(this));
        return (moduleNames, containingFile, reusedNames, redirectedReference, options) => {
            return moduleNames.map((moduleName) => {
                const module = ts.resolveModuleName(moduleName, containingFile, options, this, moduleResolutionCache, redirectedReference);
                return module.resolvedModule;
            });
        };
    }
}

/**
 * @module
 * @description
 * Entry point for all public APIs of the compiler-cli package.
 */
new o.Version('21.1.0-next.0+sha-f2de963');

const UNKNOWN_ERROR_CODE = 500;
exports.EmitFlags = void 0;
(function (EmitFlags) {
    EmitFlags[EmitFlags["DTS"] = 1] = "DTS";
    EmitFlags[EmitFlags["JS"] = 2] = "JS";
    EmitFlags[EmitFlags["Metadata"] = 4] = "Metadata";
    EmitFlags[EmitFlags["I18nBundle"] = 8] = "I18nBundle";
    EmitFlags[EmitFlags["Codegen"] = 16] = "Codegen";
    EmitFlags[EmitFlags["Default"] = 19] = "Default";
    EmitFlags[EmitFlags["All"] = 31] = "All";
})(exports.EmitFlags || (exports.EmitFlags = {}));

function i18nGetExtension(formatName) {
    const format = formatName.toLowerCase();
    switch (format) {
        case 'xmb':
            return 'xmb';
        case 'xlf':
        case 'xlif':
        case 'xliff':
        case 'xlf2':
        case 'xliff2':
            return 'xlf';
    }
    throw new Error(`Unsupported format "${formatName}"`);
}
function i18nExtract(formatName, outFile, host, options, bundle, pathResolve = p__namespace.resolve) {
    formatName = formatName || 'xlf';
    // Checks the format and returns the extension
    const ext = i18nGetExtension(formatName);
    const content = i18nSerialize(bundle, formatName, options);
    const dstFile = outFile || `messages.${ext}`;
    const dstPath = pathResolve(options.outDir || options.basePath, dstFile);
    host.writeFile(dstPath, content, false, undefined, []);
    return [dstPath];
}
function i18nSerialize(bundle, formatName, options) {
    const format = formatName.toLowerCase();
    let serializer;
    switch (format) {
        case 'xmb':
            serializer = new o.Xmb();
            break;
        case 'xliff2':
        case 'xlf2':
            serializer = new o.Xliff2();
            break;
        case 'xlf':
        case 'xliff':
        default:
            serializer = new o.Xliff();
    }
    return bundle.write(serializer, getPathNormalizer(options.basePath));
}
function getPathNormalizer(basePath) {
    // normalize source paths by removing the base path and always using "/" as a separator
    return (sourcePath) => {
        sourcePath = basePath ? p__namespace.relative(basePath, sourcePath) : sourcePath;
        return sourcePath.split(p__namespace.sep).join('/');
    };
}

/**
 * Converts a `string` version into an array of numbers
 * @example
 * toNumbers('2.0.1'); // returns [2, 0, 1]
 */
function toNumbers(value) {
    // Drop any suffixes starting with `-` so that versions like `1.2.3-rc.5` are treated as `1.2.3`.
    const suffixIndex = value.lastIndexOf('-');
    return value
        .slice(0, suffixIndex === -1 ? value.length : suffixIndex)
        .split('.')
        .map((segment) => {
        const parsed = parseInt(segment, 10);
        if (isNaN(parsed)) {
            throw Error(`Unable to parse version string ${value}.`);
        }
        return parsed;
    });
}
/**
 * Compares two arrays of positive numbers with lexicographical order in mind.
 *
 * However - unlike lexicographical order - for arrays of different length we consider:
 * [1, 2, 3] = [1, 2, 3, 0] instead of [1, 2, 3] < [1, 2, 3, 0]
 *
 * @param a The 'left hand' array in the comparison test
 * @param b The 'right hand' in the comparison test
 * @returns {-1|0|1} The comparison result: 1 if a is greater, -1 if b is greater, 0 is the two
 * arrays are equals
 */
function compareNumbers(a, b) {
    const max = Math.max(a.length, b.length);
    const min = Math.min(a.length, b.length);
    for (let i = 0; i < min; i++) {
        if (a[i] > b[i])
            return 1;
        if (a[i] < b[i])
            return -1;
    }
    if (min !== max) {
        const longestArray = a.length === max ? a : b;
        // The result to return in case the to arrays are considered different (1 if a is greater,
        // -1 if b is greater)
        const comparisonResult = a.length === max ? 1 : -1;
        // Check that at least one of the remaining elements is greater than 0 to consider that the two
        // arrays are different (e.g. [1, 0] and [1] are considered the same but not [1, 0, 1] and [1])
        for (let i = min; i < max; i++) {
            if (longestArray[i] > 0) {
                return comparisonResult;
            }
        }
    }
    return 0;
}
/**
 * Compares two versions
 *
 * @param v1 The 'left hand' version in the comparison test
 * @param v2 The 'right hand' version in the comparison test
 * @returns {-1|0|1} The comparison result: 1 if v1 is greater, -1 if v2 is greater, 0 is the two
 * versions are equals
 */
function compareVersions(v1, v2) {
    return compareNumbers(toNumbers(v1), toNumbers(v2));
}

/**
 * Minimum supported TypeScript version
 * ∀ supported typescript version v, v >= MIN_TS_VERSION
 *
 * Note: this check is disabled in g3, search for
 * `angularCompilerOptions.disableTypeScriptVersionCheck` config param value in g3.
 */
const MIN_TS_VERSION = '5.9.0';
/**
 * Supremum of supported TypeScript versions
 * ∀ supported typescript version v, v < MAX_TS_VERSION
 * MAX_TS_VERSION is not considered as a supported TypeScript version
 *
 * Note: this check is disabled in g3, search for
 * `angularCompilerOptions.disableTypeScriptVersionCheck` config param value in g3.
 */
const MAX_TS_VERSION = '6.0.0';
/**
 * The currently used version of TypeScript, which can be adjusted for testing purposes using
 * `setTypeScriptVersionForTesting` and `restoreTypeScriptVersionForTesting` below.
 */
let tsVersion = ts.version;
/**
 * Checks whether a given version ∈ [minVersion, maxVersion[.
 * An error will be thrown when the given version ∉ [minVersion, maxVersion[.
 *
 * @param version The version on which the check will be performed
 * @param minVersion The lower bound version. A valid version needs to be greater than minVersion
 * @param maxVersion The upper bound version. A valid version needs to be strictly less than
 * maxVersion
 *
 * @throws Will throw an error if the given version ∉ [minVersion, maxVersion[
 */
function checkVersion(version, minVersion, maxVersion) {
    if (compareVersions(version, minVersion) < 0 || compareVersions(version, maxVersion) >= 0) {
        throw new Error(`The Angular Compiler requires TypeScript >=${minVersion} and <${maxVersion} but ${version} was found instead.`);
    }
}
function verifySupportedTypeScriptVersion() {
    checkVersion(tsVersion, MIN_TS_VERSION, MAX_TS_VERSION);
}

/**
 * Entrypoint to the Angular Compiler (Ivy+) which sits behind the `api.Program` interface, allowing
 * it to be a drop-in replacement for the legacy View Engine compiler to tooling such as the
 * command-line main() function or the Angular CLI.
 */
class NgtscProgram {
    options;
    compiler;
    /**
     * The primary TypeScript program, which is used for analysis and emit.
     */
    tsProgram;
    host;
    incrementalStrategy;
    constructor(rootNames, options, delegateHost, oldProgram) {
        this.options = options;
        const perfRecorder = project_tsconfig_paths.ActivePerfRecorder.zeroedToNow();
        perfRecorder.phase(project_tsconfig_paths.PerfPhase.Setup);
        // First, check whether the current TS version is supported.
        if (!options.disableTypeScriptVersionCheck) {
            verifySupportedTypeScriptVersion();
        }
        // In local compilation mode there are almost always (many) emit errors due to imports that
        // cannot be resolved. So we should emit regardless.
        if (options.compilationMode === 'experimental-local') {
            options.noEmitOnError = false;
        }
        const reuseProgram = oldProgram?.compiler.getCurrentProgram();
        this.host = NgCompilerHost.wrap(delegateHost, rootNames, options, reuseProgram ?? null);
        if (reuseProgram !== undefined) {
            // Prior to reusing the old program, restore shim tagging for all its `ts.SourceFile`s.
            // TypeScript checks the `referencedFiles` of `ts.SourceFile`s for changes when evaluating
            // incremental reuse of data from the old program, so it's important that these match in order
            // to get the most benefit out of reuse.
            project_tsconfig_paths.retagAllTsFiles(reuseProgram);
        }
        this.tsProgram = perfRecorder.inPhase(project_tsconfig_paths.PerfPhase.TypeScriptProgramCreate, () => ts.createProgram(this.host.inputFiles, options, this.host, reuseProgram));
        perfRecorder.phase(project_tsconfig_paths.PerfPhase.Unaccounted);
        perfRecorder.memory(project_tsconfig_paths.PerfCheckpoint.TypeScriptProgramCreate);
        this.host.postProgramCreationCleanup();
        const programDriver = new TsCreateProgramDriver(this.tsProgram, this.host, this.options, this.host.shimExtensionPrefixes);
        this.incrementalStrategy =
            oldProgram !== undefined
                ? oldProgram.incrementalStrategy.toNextBuildStrategy()
                : new TrackedIncrementalBuildStrategy();
        const modifiedResourceFiles = new Set();
        if (this.host.getModifiedResourceFiles !== undefined) {
            const strings = this.host.getModifiedResourceFiles();
            if (strings !== undefined) {
                for (const fileString of strings) {
                    modifiedResourceFiles.add(project_tsconfig_paths.absoluteFrom(fileString));
                }
            }
        }
        let ticket;
        if (oldProgram === undefined) {
            ticket = project_tsconfig_paths.freshCompilationTicket(this.tsProgram, options, this.incrementalStrategy, programDriver, perfRecorder, 
            /* enableTemplateTypeChecker */ false, 
            /* usePoisonedData */ false);
        }
        else {
            ticket = project_tsconfig_paths.incrementalFromCompilerTicket(oldProgram.compiler, this.tsProgram, this.incrementalStrategy, programDriver, modifiedResourceFiles, perfRecorder);
        }
        // Create the NgCompiler which will drive the rest of the compilation.
        this.compiler = project_tsconfig_paths.NgCompiler.fromTicket(ticket, this.host);
    }
    getTsProgram() {
        return this.tsProgram;
    }
    getReuseTsProgram() {
        return this.compiler.getCurrentProgram();
    }
    getTsOptionDiagnostics(cancellationToken) {
        return this.compiler.perfRecorder.inPhase(project_tsconfig_paths.PerfPhase.TypeScriptDiagnostics, () => this.tsProgram.getOptionsDiagnostics(cancellationToken));
    }
    getTsSyntacticDiagnostics(sourceFile, cancellationToken) {
        return this.compiler.perfRecorder.inPhase(project_tsconfig_paths.PerfPhase.TypeScriptDiagnostics, () => {
            const ignoredFiles = this.compiler.ignoreForDiagnostics;
            let res;
            if (sourceFile !== undefined) {
                if (ignoredFiles.has(sourceFile)) {
                    return [];
                }
                res = this.tsProgram.getSyntacticDiagnostics(sourceFile, cancellationToken);
            }
            else {
                const diagnostics = [];
                for (const sf of this.tsProgram.getSourceFiles()) {
                    if (!ignoredFiles.has(sf)) {
                        diagnostics.push(...this.tsProgram.getSyntacticDiagnostics(sf, cancellationToken));
                    }
                }
                res = diagnostics;
            }
            return res;
        });
    }
    getTsSemanticDiagnostics(sourceFile, cancellationToken) {
        // No TS semantic check should be done in local compilation mode, as it is always full of errors
        // due to cross file imports.
        if (this.options.compilationMode === 'experimental-local') {
            return [];
        }
        return this.compiler.perfRecorder.inPhase(project_tsconfig_paths.PerfPhase.TypeScriptDiagnostics, () => {
            const ignoredFiles = this.compiler.ignoreForDiagnostics;
            let res;
            if (sourceFile !== undefined) {
                if (ignoredFiles.has(sourceFile)) {
                    return [];
                }
                res = this.tsProgram.getSemanticDiagnostics(sourceFile, cancellationToken);
            }
            else {
                const diagnostics = [];
                for (const sf of this.tsProgram.getSourceFiles()) {
                    if (!ignoredFiles.has(sf)) {
                        diagnostics.push(...this.tsProgram.getSemanticDiagnostics(sf, cancellationToken));
                    }
                }
                res = diagnostics;
            }
            return res;
        });
    }
    getNgOptionDiagnostics(cancellationToken) {
        return this.compiler.getOptionDiagnostics();
    }
    getNgStructuralDiagnostics(cancellationToken) {
        return [];
    }
    getNgSemanticDiagnostics(fileName, cancellationToken) {
        let sf = undefined;
        if (fileName !== undefined) {
            sf = this.tsProgram.getSourceFile(fileName);
            if (sf === undefined) {
                // There are no diagnostics for files which don't exist in the program - maybe the caller
                // has stale data?
                return [];
            }
        }
        if (sf === undefined) {
            return this.compiler.getDiagnostics();
        }
        else {
            return this.compiler.getDiagnosticsForFile(sf, project_tsconfig_paths.OptimizeFor.WholeProgram);
        }
    }
    /**
     * Ensure that the `NgCompiler` has properly analyzed the program, and allow for the asynchronous
     * loading of any resources during the process.
     *
     * This is used by the Angular CLI to allow for spawning (async) child compilations for things
     * like SASS files used in `styleUrls`.
     */
    loadNgStructureAsync() {
        return this.compiler.analyzeAsync();
    }
    listLazyRoutes(entryRoute) {
        return [];
    }
    emitXi18n() {
        const ctx = new o.MessageBundle(new o.HtmlParser(), [], {}, this.options.i18nOutLocale ?? null, this.options.i18nPreserveWhitespaceForLegacyExtraction);
        this.compiler.xi18n(ctx);
        i18nExtract(this.options.i18nOutFormat ?? null, this.options.i18nOutFile ?? null, this.host, this.options, ctx, project_tsconfig_paths.resolve);
    }
    emit(opts) {
        // Check if emission of the i18n messages bundle was requested.
        if (opts !== undefined &&
            opts.emitFlags !== undefined &&
            opts.emitFlags & exports.EmitFlags.I18nBundle) {
            this.emitXi18n();
            // `api.EmitFlags` is a View Engine compiler concept. We only pay attention to the absence of
            // the other flags here if i18n emit was requested (since this is usually done in the xi18n
            // flow, where we don't want to emit JS at all).
            if (!(opts.emitFlags & exports.EmitFlags.JS)) {
                return {
                    diagnostics: [],
                    emitSkipped: true,
                    emittedFiles: [],
                };
            }
        }
        const forceEmit = opts?.forceEmit ?? false;
        this.compiler.perfRecorder.memory(project_tsconfig_paths.PerfCheckpoint.PreEmit);
        const res = this.compiler.perfRecorder.inPhase(project_tsconfig_paths.PerfPhase.TypeScriptEmit, () => {
            const { transformers } = this.compiler.prepareEmit();
            const ignoreFiles = this.compiler.ignoreForEmit;
            const emitCallback = (opts?.emitCallback ??
                defaultEmitCallback);
            const writeFile = (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
                if (sourceFiles !== undefined) {
                    // Record successful writes for any `ts.SourceFile` (that's not a declaration file)
                    // that's an input to this write.
                    for (const writtenSf of sourceFiles) {
                        if (writtenSf.isDeclarationFile) {
                            continue;
                        }
                        this.compiler.incrementalCompilation.recordSuccessfulEmit(writtenSf);
                    }
                }
                this.host.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
            };
            const customTransforms = opts && opts.customTransformers;
            const beforeTransforms = transformers.before || [];
            const afterDeclarationsTransforms = transformers.afterDeclarations;
            if (customTransforms !== undefined && customTransforms.beforeTs !== undefined) {
                beforeTransforms.push(...customTransforms.beforeTs);
            }
            const emitResults = [];
            for (const targetSourceFile of this.tsProgram.getSourceFiles()) {
                if (targetSourceFile.isDeclarationFile || ignoreFiles.has(targetSourceFile)) {
                    continue;
                }
                if (!forceEmit && this.compiler.incrementalCompilation.safeToSkipEmit(targetSourceFile)) {
                    this.compiler.perfRecorder.eventCount(project_tsconfig_paths.PerfEvent.EmitSkipSourceFile);
                    continue;
                }
                this.compiler.perfRecorder.eventCount(project_tsconfig_paths.PerfEvent.EmitSourceFile);
                emitResults.push(emitCallback({
                    targetSourceFile,
                    program: this.tsProgram,
                    host: this.host,
                    options: this.options,
                    emitOnlyDtsFiles: false,
                    writeFile,
                    customTransformers: {
                        before: beforeTransforms,
                        after: customTransforms && customTransforms.afterTs,
                        afterDeclarations: afterDeclarationsTransforms,
                    },
                }));
            }
            this.compiler.perfRecorder.memory(project_tsconfig_paths.PerfCheckpoint.Emit);
            // Run the emit, including a custom transformer that will downlevel the Ivy decorators in
            // code.
            return ((opts && opts.mergeEmitResultsCallback) || mergeEmitResults)(emitResults);
        });
        // Record performance analysis information to disk if we've been asked to do so.
        if (this.options.tracePerformance !== undefined) {
            const perf = this.compiler.perfRecorder.finalize();
            project_tsconfig_paths.getFileSystem().writeFile(project_tsconfig_paths.getFileSystem().resolve(this.options.tracePerformance), JSON.stringify(perf, null, 2));
        }
        return res;
    }
    getIndexedComponents() {
        return this.compiler.getIndexedComponents();
    }
    /**
     * Gets information for the current program that may be used to generate API
     * reference documentation. This includes Angular-specific information, such
     * as component inputs and outputs.
     *
     * @param entryPoint Path to the entry point for the package for which API
     *     docs should be extracted.
     */
    getApiDocumentation(entryPoint, privateModules) {
        return this.compiler.getApiDocumentation(entryPoint, privateModules);
    }
    getEmittedSourceFiles() {
        throw new Error('Method not implemented.');
    }
}
const defaultEmitCallback = ({ program, targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers, }) => program.emit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers);
function mergeEmitResults(emitResults) {
    const diagnostics = [];
    let emitSkipped = false;
    const emittedFiles = [];
    for (const er of emitResults) {
        diagnostics.push(...er.diagnostics);
        emitSkipped = emitSkipped || er.emitSkipped;
        emittedFiles.push(...(er.emittedFiles || []));
    }
    return { diagnostics, emitSkipped, emittedFiles };
}

var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["debug"] = 0] = "debug";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["error"] = 3] = "error";
})(LogLevel || (LogLevel = {}));

project_tsconfig_paths.setFileSystem(new project_tsconfig_paths.NodeJSFileSystem());

exports.NgtscProgram = NgtscProgram;
exports.UNKNOWN_ERROR_CODE = UNKNOWN_ERROR_CODE;
