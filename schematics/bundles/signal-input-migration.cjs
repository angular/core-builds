'use strict';
/**
 * @license Angular v20.2.0-rc.1+sha-c68a099
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var migrate_ts_type_references = require('./migrate_ts_type_references-ChhOPYQN.cjs');
var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-Bhn4jDr1.cjs');
var index$1 = require('./index-B2JqSpjn.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-0Ap2zKpJ.cjs');
var index = require('./index-B_y1Rk4s.cjs');
var assert = require('assert');
var apply_import_manager = require('./apply_import_manager-CV8wIfaD.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('./leading_space-D9nQ8UQC.cjs');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');

/**
 * Class that holds information about a given directive and its input fields.
 */
class DirectiveInfo {
    clazz;
    /**
     * Map of inputs detected in the given class.
     * Maps string-based input ids to the detailed input metadata.
     */
    inputFields = new Map();
    /** Map of input IDs and their incompatibilities. */
    memberIncompatibility = new Map();
    /**
     * Whether the whole class is incompatible.
     *
     * Class incompatibility precedes individual member incompatibility.
     * All members in the class are considered incompatible.
     */
    incompatible = null;
    constructor(clazz) {
        this.clazz = clazz;
    }
    /**
     * Checks whether there are any migrated inputs for the
     * given class.
     *
     * Returns `false` if all inputs are incompatible.
     */
    hasMigratedFields() {
        return Array.from(this.inputFields.values()).some(({ descriptor }) => !this.isInputMemberIncompatible(descriptor));
    }
    /**
     * Whether the given input member is incompatible. If the class is incompatible,
     * then the member is as well.
     */
    isInputMemberIncompatible(input) {
        return this.getInputMemberIncompatibility(input) !== null;
    }
    /** Get incompatibility of the given member, if it's incompatible for migration. */
    getInputMemberIncompatibility(input) {
        return this.memberIncompatibility.get(input.key) ?? this.incompatible ?? null;
    }
}

/**
 * A migration host is in practice a container object that
 * exposes commonly accessed contextual helpers throughout
 * the whole migration.
 */
class MigrationHost {
    isMigratingCore;
    programInfo;
    config;
    _sourceFiles;
    compilerOptions;
    constructor(isMigratingCore, programInfo, config, sourceFiles) {
        this.isMigratingCore = isMigratingCore;
        this.programInfo = programInfo;
        this.config = config;
        this._sourceFiles = new WeakSet(sourceFiles);
        this.compilerOptions = programInfo.userOptions;
    }
    /** Whether the given file is a source file to be migrated. */
    isSourceFileForCurrentMigration(file) {
        return this._sourceFiles.has(file);
    }
}

function getInputDescriptor(hostOrInfo, node) {
    let className;
    if (ts.isAccessor(node)) {
        className = node.parent.name?.text || '<anonymous>';
    }
    else {
        className = node.parent.name?.text ?? '<anonymous>';
    }
    const info = hostOrInfo instanceof MigrationHost ? hostOrInfo.programInfo : hostOrInfo;
    const file = project_paths.projectFile(node.getSourceFile(), info);
    // Inputs may be detected in `.d.ts` files. Ensure that if the file IDs
    // match regardless of extension. E.g. `/google3/blaze-out/bin/my_file.ts` should
    // have the same ID as `/google3/my_file.ts`.
    const id = file.id.replace(/\.d\.ts$/, '.ts');
    return {
        key: `${id}@@${className}@@${node.name.text}`,
        node,
    };
}

/**
 * Attempts to resolve the known `@Input` metadata for the given
 * type checking symbol. Returns `null` if it's not for an input.
 */
function attemptRetrieveInputFromSymbol(programInfo, memberSymbol, knownInputs) {
    // Even for declared classes from `.d.ts`, the value declaration
    // should exist and point to the property declaration.
    if (memberSymbol.valueDeclaration !== undefined &&
        index.isInputContainerNode(memberSymbol.valueDeclaration)) {
        const member = memberSymbol.valueDeclaration;
        // If the member itself is an input that is being migrated, we
        // do not need to check, as overriding would be fine then— like before.
        const memberInputDescr = index.isInputContainerNode(member)
            ? getInputDescriptor(programInfo, member)
            : null;
        return memberInputDescr !== null ? (knownInputs.get(memberInputDescr) ?? null) : null;
    }
    return null;
}

/**
 * Registry keeping track of all known `@Input()`s in the compilation.
 *
 *  A known `@Input()` may be defined in sources, or inside some `d.ts` files
 * loaded into the program.
 */
class KnownInputs {
    programInfo;
    config;
    /**
     * Known inputs from the whole program.
     */
    knownInputIds = new Map();
    /** Known container classes of inputs. */
    _allClasses = new Set();
    /** Maps classes to their directive info. */
    _classToDirectiveInfo = new Map();
    constructor(programInfo, config) {
        this.programInfo = programInfo;
        this.config = config;
    }
    /** Whether the given input exists. */
    has(descr) {
        return this.knownInputIds.has(descr.key);
    }
    /** Whether the given class contains `@Input`s. */
    isInputContainingClass(clazz) {
        return this._classToDirectiveInfo.has(clazz);
    }
    /** Gets precise `@Input()` information for the given class. */
    getDirectiveInfoForClass(clazz) {
        return this._classToDirectiveInfo.get(clazz);
    }
    /** Gets known input information for the given `@Input()`. */
    get(descr) {
        return this.knownInputIds.get(descr.key);
    }
    /** Gets all classes containing `@Input`s in the compilation. */
    getAllInputContainingClasses() {
        return Array.from(this._allClasses.values());
    }
    /** Registers an `@Input()` in the registry. */
    register(data) {
        if (!this._classToDirectiveInfo.has(data.node.parent)) {
            this._classToDirectiveInfo.set(data.node.parent, new DirectiveInfo(data.node.parent));
        }
        const directiveInfo = this._classToDirectiveInfo.get(data.node.parent);
        const inputInfo = {
            file: project_paths.projectFile(data.node.getSourceFile(), this.programInfo),
            metadata: data.metadata,
            descriptor: data.descriptor,
            container: directiveInfo,
            extendsFrom: null,
            isIncompatible: () => directiveInfo.isInputMemberIncompatible(data.descriptor),
        };
        directiveInfo.inputFields.set(data.descriptor.key, {
            descriptor: data.descriptor,
            metadata: data.metadata,
        });
        this.knownInputIds.set(data.descriptor.key, inputInfo);
        this._allClasses.add(data.node.parent);
    }
    /** Whether the given input is incompatible for migration. */
    isFieldIncompatible(descriptor) {
        return !!this.get(descriptor)?.isIncompatible();
    }
    /** Marks the given input as incompatible for migration. */
    markFieldIncompatible(input, incompatibility) {
        if (!this.knownInputIds.has(input.key)) {
            throw new Error(`Input cannot be marked as incompatible because it's not registered.`);
        }
        const inputInfo = this.knownInputIds.get(input.key);
        const existingIncompatibility = inputInfo.container.getInputMemberIncompatibility(input);
        // Ensure an existing more significant incompatibility is not overridden.
        if (existingIncompatibility !== null && migrate_ts_type_references.isFieldIncompatibility(existingIncompatibility)) {
            incompatibility = migrate_ts_type_references.pickFieldIncompatibility(existingIncompatibility, incompatibility);
        }
        this.knownInputIds
            .get(input.key)
            .container.memberIncompatibility.set(input.key, incompatibility);
    }
    /** Marks the given class as incompatible for migration. */
    markClassIncompatible(clazz, incompatibility) {
        if (!this._classToDirectiveInfo.has(clazz)) {
            throw new Error(`Class cannot be marked as incompatible because it's not known.`);
        }
        this._classToDirectiveInfo.get(clazz).incompatible = incompatibility;
    }
    attemptRetrieveDescriptorFromSymbol(symbol) {
        return attemptRetrieveInputFromSymbol(this.programInfo, symbol, this)?.descriptor ?? null;
    }
    shouldTrackClassReference(clazz) {
        return this.isInputContainingClass(clazz);
    }
    captureKnownFieldInheritanceRelationship(derived, parent) {
        if (!this.has(derived)) {
            throw new Error(`Expected input to exist in registry: ${derived.key}`);
        }
        this.get(derived).extendsFrom = parent;
    }
    captureUnknownDerivedField(field) {
        this.markFieldIncompatible(field, {
            context: null,
            reason: migrate_ts_type_references.FieldIncompatibilityReason.OverriddenByDerivedClass,
        });
    }
    captureUnknownParentField(field) {
        this.markFieldIncompatible(field, {
            context: null,
            reason: migrate_ts_type_references.FieldIncompatibilityReason.TypeConflictWithBaseClass,
        });
    }
}

/**
 * Prepares migration analysis for the given program.
 *
 * Unlike {@link createAndPrepareAnalysisProgram} this does not create the program,
 * and can be used for integrations with e.g. the language service.
 */
function prepareAnalysisInfo(userProgram, compiler, programAbsoluteRootPaths) {
    let refEmitter = null;
    let metaReader = null;
    let templateTypeChecker = null;
    let resourceLoader = null;
    if (compiler !== null) {
        // Analyze sync and retrieve necessary dependencies.
        // Note: `getTemplateTypeChecker` requires the `enableTemplateTypeChecker` flag, but
        // this has negative effects as it causes optional TCB operations to execute, which may
        // error with unsuccessful reference emits that previously were ignored outside of the migration.
        // The migration is resilient to TCB information missing, so this is fine, and all the information
        // we need is part of required TCB operations anyway.
        const state = compiler['ensureAnalyzed']();
        resourceLoader = compiler['resourceManager'];
        refEmitter = state.refEmitter;
        metaReader = state.metaReader;
        templateTypeChecker = state.templateTypeChecker;
        // Generate all type check blocks.
        state.templateTypeChecker.generateAllTypeCheckBlocks();
    }
    const typeChecker = userProgram.getTypeChecker();
    const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(typeChecker);
    const evaluator = new index$1.PartialEvaluator(reflector, typeChecker, null);
    const dtsMetadataReader = new index$1.DtsMetadataReader(typeChecker, reflector);
    return {
        metaRegistry: metaReader,
        dtsMetadataReader,
        evaluator,
        reflector,
        typeChecker,
        refEmitter,
        templateTypeChecker,
        resourceLoader,
    };
}

/**
 * State of the migration that is passed between
 * the individual phases.
 *
 * The state/phase captures information like:
 *    - list of inputs that are defined in `.ts` and need migration.
 *    - list of references.
 *    - keeps track of computed replacements.
 *    - imports that may need to be updated.
 */
class MigrationResult {
    printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    // May be `null` if the input cannot be converted. This is also
    // signified by an incompatibility- but the input is tracked here as it
    // still is a "source input".
    sourceInputs = new Map();
    references = [];
    // Execution data
    replacements = [];
    inputDecoratorSpecifiers = new Map();
}

/** Attempts to extract metadata of a potential TypeScript `@Input()` declaration. */
function extractDecoratorInput(node, host, reflector, metadataReader, evaluator) {
    return (extractSourceCodeInput(node, host, reflector, evaluator) ??
        extractDtsInput(node, metadataReader));
}
/**
 * Attempts to extract `@Input()` information for the given node, assuming it's
 * part of a `.d.ts` file.
 */
function extractDtsInput(node, metadataReader) {
    if (!index.isInputContainerNode(node) ||
        !ts.isIdentifier(node.name) ||
        !node.getSourceFile().isDeclarationFile) {
        return null;
    }
    // If the potential node is not part of a valid input class, skip.
    if (!ts.isClassDeclaration(node.parent) ||
        node.parent.name === undefined ||
        !ts.isIdentifier(node.parent.name)) {
        return null;
    }
    let directiveMetadata = null;
    // Getting directive metadata can throw errors when e.g. types referenced
    // in the `.d.ts` aren't resolvable. This seems to be unexpected and shouldn't
    // result in the entire migration to be failing.
    try {
        directiveMetadata = metadataReader.getDirectiveMetadata(new project_tsconfig_paths.Reference(node.parent));
    }
    catch (e) {
        console.error('Unexpected error. Gracefully ignoring.');
        console.error('Could not parse directive metadata:', e);
        return null;
    }
    const inputMapping = directiveMetadata?.inputs.getByClassPropertyName(node.name.text);
    // Signal inputs are never tracked and migrated.
    if (inputMapping?.isSignal) {
        return null;
    }
    return inputMapping == null
        ? null
        : {
            ...inputMapping,
            inputDecorator: null,
            inSourceFile: false,
            // Inputs from `.d.ts` cannot have any field decorators applied.
            fieldDecorators: [],
        };
}
/**
 * Attempts to extract `@Input()` information for the given node, assuming it's
 * directly defined inside a source file (`.ts`).
 */
function extractSourceCodeInput(node, host, reflector, evaluator) {
    if (!index.isInputContainerNode(node) ||
        !ts.isIdentifier(node.name) ||
        node.getSourceFile().isDeclarationFile) {
        return null;
    }
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    if (decorators === null) {
        return null;
    }
    const ngDecorators = project_tsconfig_paths.getAngularDecorators(decorators, ['Input'], host.isMigratingCore);
    if (ngDecorators.length === 0) {
        return null;
    }
    const inputDecorator = ngDecorators[0];
    let publicName = node.name.text;
    let isRequired = false;
    let transformResult = null;
    // Check options object from `@Input()`.
    if (inputDecorator.args?.length === 1) {
        const evaluatedInputOpts = evaluator.evaluate(inputDecorator.args[0]);
        if (typeof evaluatedInputOpts === 'string') {
            publicName = evaluatedInputOpts;
        }
        else if (evaluatedInputOpts instanceof Map) {
            if (evaluatedInputOpts.has('alias') && typeof evaluatedInputOpts.get('alias') === 'string') {
                publicName = evaluatedInputOpts.get('alias');
            }
            if (evaluatedInputOpts.has('required') &&
                typeof evaluatedInputOpts.get('required') === 'boolean') {
                isRequired = !!evaluatedInputOpts.get('required');
            }
            if (evaluatedInputOpts.has('transform') && evaluatedInputOpts.get('transform') != null) {
                transformResult = parseTransformOfInput(evaluatedInputOpts, node, reflector);
            }
        }
    }
    return {
        bindingPropertyName: publicName,
        classPropertyName: node.name.text,
        required: isRequired,
        isSignal: false,
        inSourceFile: true,
        transform: transformResult,
        inputDecorator,
        fieldDecorators: decorators,
    };
}
/**
 * Gracefully attempts to parse the `transform` option of an `@Input()`
 * and extracts its metadata.
 */
function parseTransformOfInput(evaluatedInputOpts, node, reflector) {
    const transformValue = evaluatedInputOpts.get('transform');
    if (!(transformValue instanceof project_tsconfig_paths.DynamicValue) && !(transformValue instanceof project_tsconfig_paths.Reference)) {
        return null;
    }
    // For parsing the transform, we don't need a real reference emitter, as
    // the emitter is only used for verifying that the transform type could be
    // copied into e.g. an `ngInputAccept` class member.
    const noopRefEmitter = new project_tsconfig_paths.ReferenceEmitter([
        {
            emit: () => ({
                kind: project_tsconfig_paths.ReferenceEmitKind.Success,
                expression: project_tsconfig_paths.NULL_EXPR,
                importedFile: null,
            }),
        },
    ]);
    try {
        return project_tsconfig_paths.parseDecoratorInputTransformFunction(node.parent, node.name.text, transformValue, reflector, noopRefEmitter, project_tsconfig_paths.CompilationMode.FULL, 
        /* emitDeclarationOnly */ false);
    }
    catch (e) {
        if (!(e instanceof project_tsconfig_paths.FatalDiagnosticError)) {
            throw e;
        }
        // TODO: implement error handling.
        // See failing case: e.g. inherit_definition_feature_spec.ts
        console.error(`${e.node.getSourceFile().fileName}: ${e.toString()}`);
        return null;
    }
}

/**
 * Prepares a potential migration of the given node by performing
 * initial analysis and checking whether it an be migrated.
 *
 * For example, required inputs that don't have an explicit type may not
 * be migrated as we don't have a good type for `input.required<T>`.
 *   (Note: `typeof Bla` may be usable— but isn't necessarily a good practice
 *    for complex expressions)
 */
function prepareAndCheckForConversion(node, metadata, checker, options) {
    // Accessor inputs cannot be migrated right now.
    if (ts.isAccessor(node)) {
        return {
            context: node,
            reason: migrate_ts_type_references.FieldIncompatibilityReason.Accessor,
        };
    }
    assert(metadata.inputDecorator !== null, 'Expected an input decorator for inputs that are being migrated.');
    let initialValue = node.initializer;
    let isUndefinedInitialValue = node.initializer === undefined ||
        (ts.isIdentifier(node.initializer) && node.initializer.text === 'undefined');
    const strictNullChecksEnabled = options.strict === true || options.strictNullChecks === true;
    const strictPropertyInitialization = options.strict === true || options.strictPropertyInitialization === true;
    // Shorthand should never be used, as would expand the type of `T` to be `T|undefined`.
    // This wouldn't matter with strict null checks disabled, but it can break if this is
    // a library that is later consumed with strict null checks enabled.
    const avoidTypeExpansion = !strictNullChecksEnabled;
    // If an input can be required, due to the non-null assertion on the property,
    // make it required if there is no initializer.
    if (node.exclamationToken !== undefined && initialValue === undefined) {
        metadata.required = true;
    }
    let typeToAdd = node.type;
    let preferShorthandIfPossible = null;
    // If there is no initial value, or it's `undefined`, we can prefer the `input()`
    // shorthand which automatically uses `undefined` as initial value, and includes it
    // in the input type.
    if (!metadata.required &&
        node.type !== undefined &&
        isUndefinedInitialValue &&
        !avoidTypeExpansion) {
        preferShorthandIfPossible = { originalType: node.type };
    }
    // If the input is using `@Input() bla?: string;` with the "optional question mark",
    // then we try to explicitly add `undefined` as type, if it's not part of the type already.
    // This is ensuring correctness, as `bla?` automatically includes `undefined` currently.
    if (node.questionToken !== undefined) {
        // If there is no type, but we have an initial value, try inferring
        // it from the initializer.
        if (typeToAdd === undefined && initialValue !== undefined) {
            const inferredType = inferImportableTypeForInput(checker, node, initialValue);
            if (inferredType !== null) {
                typeToAdd = inferredType;
            }
        }
        if (typeToAdd === undefined) {
            return {
                context: node,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.SignalInput__QuestionMarkButNoGoodExplicitTypeExtractable,
            };
        }
        if (!checker.isTypeAssignableTo(checker.getUndefinedType(), checker.getTypeFromTypeNode(typeToAdd))) {
            typeToAdd = ts.factory.createUnionTypeNode([
                typeToAdd,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
            ]);
        }
    }
    let leadingTodoText = null;
    // If the input does not have an initial value, and strict property initialization
    // is disabled, while strict null checks are enabled; then we know that `undefined`
    // cannot be used as initial value, nor do we want to expand the input's type magically.
    // Instead, we detect this case and migrate to `undefined!` which leaves the behavior unchanged.
    if (strictNullChecksEnabled &&
        !strictPropertyInitialization &&
        node.initializer === undefined &&
        node.type !== undefined &&
        node.questionToken === undefined &&
        node.exclamationToken === undefined &&
        metadata.required === false &&
        !checker.isTypeAssignableTo(checker.getUndefinedType(), checker.getTypeFromTypeNode(node.type))) {
        leadingTodoText =
            'Input is initialized to `undefined` but type does not allow this value. ' +
                'This worked with `@Input` because your project uses `--strictPropertyInitialization=false`.';
        isUndefinedInitialValue = false;
        initialValue = ts.factory.createNonNullExpression(ts.factory.createIdentifier('undefined'));
    }
    // Attempt to extract type from input initial value. No explicit type, but input is required.
    // Hence we need an explicit type, or fall back to `typeof`.
    if (typeToAdd === undefined && initialValue !== undefined && metadata.required) {
        const inferredType = inferImportableTypeForInput(checker, node, initialValue);
        if (inferredType !== null) {
            typeToAdd = inferredType;
        }
        else {
            // Note that we could use `typeToTypeNode` here but it's likely breaking because
            // the generated type might depend on imports that we cannot add here (nor want).
            return {
                context: node,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.SignalInput__RequiredButNoGoodExplicitTypeExtractable,
            };
        }
    }
    return {
        requiredButIncludedUndefinedPreviously: metadata.required && node.questionToken !== undefined,
        resolvedMetadata: metadata,
        resolvedType: typeToAdd,
        preferShorthandIfPossible,
        originalInputDecorator: metadata.inputDecorator,
        initialValue: isUndefinedInitialValue ? undefined : initialValue,
        leadingTodoText,
    };
}
function inferImportableTypeForInput(checker, node, initialValue) {
    const propertyType = checker.getTypeAtLocation(node);
    // If the resolved type is a primitive, or union of primitive types,
    // return a type node fully derived from the resolved type.
    if (isPrimitiveImportableTypeNode(propertyType) ||
        (propertyType.isUnion() && propertyType.types.every(isPrimitiveImportableTypeNode))) {
        return checker.typeToTypeNode(propertyType, node, ts.NodeBuilderFlags.NoTypeReduction) ?? null;
    }
    // Alternatively, try to infer a simple importable type from\
    // the initializer.
    if (ts.isIdentifier(initialValue)) {
        // @Input({required: true}) bla = SOME_DEFAULT;
        return ts.factory.createTypeQueryNode(initialValue);
    }
    else if (ts.isPropertyAccessExpression(initialValue) &&
        ts.isIdentifier(initialValue.name) &&
        ts.isIdentifier(initialValue.expression)) {
        // @Input({required: true}) bla = prop.SOME_DEFAULT;
        return ts.factory.createTypeQueryNode(ts.factory.createQualifiedName(initialValue.name, initialValue.expression));
    }
    return null;
}
function isPrimitiveImportableTypeNode(type) {
    return !!(type.flags & ts.TypeFlags.BooleanLike ||
        type.flags & ts.TypeFlags.StringLike ||
        type.flags & ts.TypeFlags.NumberLike ||
        type.flags & ts.TypeFlags.Undefined ||
        type.flags & ts.TypeFlags.Null);
}

/**
 * Phase where we iterate through all source files of the program (including `.d.ts`)
 * and keep track of all `@Input`'s we discover.
 */
function pass1__IdentifySourceFileAndDeclarationInputs(sf, host, checker, reflector, dtsMetadataReader, evaluator, knownDecoratorInputs, result) {
    const visitor = (node) => {
        const decoratorInput = extractDecoratorInput(node, host, reflector, dtsMetadataReader, evaluator);
        if (decoratorInput !== null) {
            assert(index.isInputContainerNode(node), 'Expected input to be declared on accessor or property.');
            const inputDescr = getInputDescriptor(host, node);
            // track all inputs, even from declarations for reference resolution.
            knownDecoratorInputs.register({ descriptor: inputDescr, metadata: decoratorInput, node });
            // track source file inputs in the result of this target.
            // these are then later migrated in the migration phase.
            if (decoratorInput.inSourceFile && host.isSourceFileForCurrentMigration(sf)) {
                const conversionPreparation = prepareAndCheckForConversion(node, decoratorInput, checker, host.compilerOptions);
                if (migrate_ts_type_references.isFieldIncompatibility(conversionPreparation)) {
                    knownDecoratorInputs.markFieldIncompatible(inputDescr, conversionPreparation);
                    result.sourceInputs.set(inputDescr, null);
                }
                else {
                    result.sourceInputs.set(inputDescr, conversionPreparation);
                }
            }
        }
        // track all imports to `Input` or `input`.
        let importName = null;
        if (ts.isImportSpecifier(node) &&
            ((importName = (node.propertyName ?? node.name).text) === 'Input' ||
                importName === 'input') &&
            ts.isStringLiteral(node.parent.parent.parent.moduleSpecifier) &&
            (host.isMigratingCore || node.parent.parent.parent.moduleSpecifier.text === '@angular/core')) {
            if (!result.inputDecoratorSpecifiers.has(sf)) {
                result.inputDecoratorSpecifiers.set(sf, []);
            }
            result.inputDecoratorSpecifiers.get(sf).push({
                kind: importName === 'input' ? 'signal-input-import' : 'decorator-input-import',
                node,
            });
        }
        ts.forEachChild(node, visitor);
    };
    ts.forEachChild(sf, visitor);
}

/**
 * Phase where problematic patterns are detected and advise
 * the migration to skip certain inputs.
 *
 * For example, detects classes that are instantiated manually. Those
 * cannot be migrated as `input()` requires an injection context.
 *
 * In addition, spying onto an input may be problematic- so we skip migrating
 * such.
 */
function pass3__checkIncompatiblePatterns(host, inheritanceGraph, checker, groupedTsAstVisitor, knownInputs) {
    migrate_ts_type_references.checkIncompatiblePatterns(inheritanceGraph, checker, groupedTsAstVisitor, knownInputs, () => knownInputs.getAllInputContainingClasses());
    for (const input of knownInputs.knownInputIds.values()) {
        const hostBindingDecorators = project_tsconfig_paths.getAngularDecorators(input.metadata.fieldDecorators, ['HostBinding'], host.isMigratingCore);
        if (hostBindingDecorators.length > 0) {
            knownInputs.markFieldIncompatible(input.descriptor, {
                context: hostBindingDecorators[0].node,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.SignalIncompatibleWithHostBinding,
            });
        }
    }
}

/**
 * Phase where problematic patterns are detected and advise
 * the migration to skip certain inputs.
 *
 * For example, detects classes that are instantiated manually. Those
 * cannot be migrated as `input()` requires an injection context.
 *
 * In addition, spying onto an input may be problematic- so we skip migrating
 * such.
 */
function pass2_IdentifySourceFileReferences(programInfo, checker, reflector, resourceLoader, evaluator, templateTypeChecker, groupedTsAstVisitor, knownInputs, result, fieldNamesToConsiderForReferenceLookup) {
    groupedTsAstVisitor.register(index.createFindAllSourceFileReferencesVisitor(programInfo, checker, reflector, resourceLoader, evaluator, templateTypeChecker, knownInputs, fieldNamesToConsiderForReferenceLookup, result).visitor);
}

/**
 * Executes the analysis phase of the migration.
 *
 * This includes:
 *   - finding all inputs
 *   - finding all references
 *   - determining incompatible inputs
 *   - checking inheritance
 */
function executeAnalysisPhase(host, knownInputs, result, { sourceFiles, fullProgramSourceFiles, reflector, dtsMetadataReader, typeChecker, templateTypeChecker, resourceLoader, evaluator, }) {
    // Pass 1
    fullProgramSourceFiles.forEach((sf) => 
    // Shim shim files. Those are unnecessary and might cause unexpected slowness.
    // e.g. `ngtypecheck` files.
    !project_tsconfig_paths.isShim(sf) &&
        pass1__IdentifySourceFileAndDeclarationInputs(sf, host, typeChecker, reflector, dtsMetadataReader, evaluator, knownInputs, result));
    const fieldNamesToConsiderForReferenceLookup = new Set();
    for (const input of knownInputs.knownInputIds.values()) {
        if (host.config.shouldMigrateInput?.(input) === false) {
            continue;
        }
        fieldNamesToConsiderForReferenceLookup.add(input.descriptor.node.name.text);
    }
    // A graph starting with source files is sufficient. We will resolve into
    // declaration files if a source file depends on such.
    const inheritanceGraph = new migrate_ts_type_references.InheritanceGraph(typeChecker).expensivePopulate(sourceFiles);
    const pass2And3SourceFileVisitor = new migrate_ts_type_references.GroupedTsAstVisitor(sourceFiles);
    // Register pass 2. Find all source file references.
    pass2_IdentifySourceFileReferences(host.programInfo, typeChecker, reflector, resourceLoader, evaluator, templateTypeChecker, pass2And3SourceFileVisitor, knownInputs, result, fieldNamesToConsiderForReferenceLookup);
    // Register pass 3. Check incompatible patterns pass.
    pass3__checkIncompatiblePatterns(host, inheritanceGraph, typeChecker, pass2And3SourceFileVisitor, knownInputs);
    // Perform Pass 2 and Pass 3, efficiently in one pass.
    pass2And3SourceFileVisitor.execute();
    // Determine incompatible inputs based on resolved references.
    for (const reference of result.references) {
        if (index.isTsReference(reference) && reference.from.isWrite) {
            knownInputs.markFieldIncompatible(reference.target, {
                reason: migrate_ts_type_references.FieldIncompatibilityReason.WriteAssignment,
                context: reference.from.node,
            });
        }
        if (index.isTemplateReference(reference) || index.isHostBindingReference(reference)) {
            if (reference.from.isWrite) {
                knownInputs.markFieldIncompatible(reference.target, {
                    reason: migrate_ts_type_references.FieldIncompatibilityReason.WriteAssignment,
                    // No TS node context available for template or host bindings.
                    context: null,
                });
            }
        }
        // TODO: Remove this when we support signal narrowing in templates.
        // https://github.com/angular/angular/pull/55456.
        if (index.isTemplateReference(reference)) {
            if (reference.from.isLikelyPartOfNarrowing) {
                knownInputs.markFieldIncompatible(reference.target, {
                    reason: migrate_ts_type_references.FieldIncompatibilityReason.PotentiallyNarrowedInTemplateButNoSupportYet,
                    context: null,
                });
            }
        }
    }
    return { inheritanceGraph };
}

/**
 * Phase that propagates incompatibilities to derived classes or
 * base classes. For example, consider:
 *
 * ```ts
 * class Base {
 *   bla = true;
 * }
 *
 * class Derived extends Base {
 *   @Input() bla = false;
 * }
 * ```
 *
 * Whenever we migrate `Derived`, the inheritance would fail
 * and result in a build breakage because `Base#bla` is not an Angular input.
 *
 * The logic here detects such cases and marks `bla` as incompatible. If `Derived`
 * would then have other derived classes as well, it would propagate the status.
 */
function pass4__checkInheritanceOfInputs(inheritanceGraph, metaRegistry, knownInputs) {
    migrate_ts_type_references.checkInheritanceOfKnownFields(inheritanceGraph, metaRegistry, knownInputs, {
        isClassWithKnownFields: (clazz) => knownInputs.isInputContainingClass(clazz),
        getFieldsForClass: (clazz) => {
            const directiveInfo = knownInputs.getDirectiveInfoForClass(clazz);
            assert(directiveInfo !== undefined, 'Expected directive info to exist for input.');
            return Array.from(directiveInfo.inputFields.values()).map((i) => i.descriptor);
        },
    });
}

function getCompilationUnitMetadata(knownInputs) {
    const struct = {
        knownInputs: Array.from(knownInputs.knownInputIds.entries()).reduce((res, [inputClassFieldIdStr, info]) => {
            const classIncompatibility = info.container.incompatible !== null ? info.container.incompatible : null;
            const memberIncompatibility = info.container.memberIncompatibility.has(inputClassFieldIdStr)
                ? info.container.memberIncompatibility.get(inputClassFieldIdStr).reason
                : null;
            // Note: Trim off the `context` as it cannot be serialized with e.g. TS nodes.
            return {
                ...res,
                [inputClassFieldIdStr]: {
                    owningClassIncompatibility: classIncompatibility,
                    memberIncompatibility,
                    seenAsSourceInput: info.metadata.inSourceFile,
                    extendsFrom: info.extendsFrom?.key ?? null,
                },
            };
        }, {}),
    };
    return struct;
}

/**
 * Sorts the inheritance graph topologically, so that
 * nodes without incoming edges are returned first.
 *
 * I.e. The returned list is sorted, so that dependencies
 * of a given class are guaranteed to be included at
 * an earlier position than the inspected class.
 *
 * This sort is helpful for detecting inheritance problems
 * for the migration in simpler ways, without having to
 * check in both directions (base classes, and derived classes).
 */
function topologicalSort(graph) {
    // All nodes without incoming edges.
    const S = graph.filter((n) => n.incoming.size === 0);
    const result = [];
    const invalidatedEdges = new WeakMap();
    const invalidateEdge = (from, to) => {
        if (!invalidatedEdges.has(from)) {
            invalidatedEdges.set(from, new Set());
        }
        invalidatedEdges.get(from).add(to);
    };
    const filterEdges = (from, edges) => {
        return Array.from(edges).filter((e) => !invalidatedEdges.has(from) || !invalidatedEdges.get(from).has(e));
    };
    while (S.length) {
        const node = S.pop();
        result.push(node);
        for (const next of filterEdges(node, node.outgoing)) {
            // Remove edge from "node -> next".
            invalidateEdge(node, next);
            // Remove edge from "next -> node".
            invalidateEdge(next, node);
            // if there are no incoming edges for `next`. add it to `S`.
            if (filterEdges(next, next.incoming).length === 0) {
                S.push(next);
            }
        }
    }
    return result;
}

/** Merges a list of compilation units into a combined unit. */
function combineCompilationUnitData(unitA, unitB) {
    const result = {
        knownInputs: {},
    };
    for (const file of [unitA, unitB]) {
        for (const [key, info] of Object.entries(file.knownInputs)) {
            const existing = result.knownInputs[key];
            if (existing === undefined) {
                result.knownInputs[key] = info;
                continue;
            }
            // Merge metadata.
            if (existing.extendsFrom === null && info.extendsFrom !== null) {
                existing.extendsFrom = info.extendsFrom;
            }
            if (!existing.seenAsSourceInput && info.seenAsSourceInput) {
                existing.seenAsSourceInput = true;
            }
            // Merge member incompatibility.
            if (info.memberIncompatibility !== null) {
                if (existing.memberIncompatibility === null) {
                    existing.memberIncompatibility = info.memberIncompatibility;
                }
                else {
                    // Input might not be incompatible in one target, but others might invalidate it.
                    // merge the incompatibility state.
                    existing.memberIncompatibility = migrate_ts_type_references.pickFieldIncompatibility({ reason: info.memberIncompatibility, context: null }, { reason: existing.memberIncompatibility, context: null }).reason;
                }
            }
            // Merge incompatibility of the class owning the input.
            // Note: This metadata is stored per field for simplicity currently,
            // but in practice it could be a separate field in the compilation data.
            if (info.owningClassIncompatibility !== null &&
                existing.owningClassIncompatibility === null) {
                existing.owningClassIncompatibility = info.owningClassIncompatibility;
            }
        }
    }
    return result;
}
function convertToGlobalMeta(combinedData) {
    const globalMeta = {
        knownInputs: {},
    };
    const idToGraphNode = new Map();
    const inheritanceGraph = [];
    const isNodeIncompatible = (node) => node.info.memberIncompatibility !== null || node.info.owningClassIncompatibility !== null;
    for (const [key, info] of Object.entries(combinedData.knownInputs)) {
        const existing = globalMeta.knownInputs[key];
        if (existing !== undefined) {
            continue;
        }
        const node = {
            incoming: new Set(),
            outgoing: new Set(),
            data: { info, key },
        };
        inheritanceGraph.push(node);
        idToGraphNode.set(key, node);
        globalMeta.knownInputs[key] = info;
    }
    for (const [key, info] of Object.entries(globalMeta.knownInputs)) {
        if (info.extendsFrom !== null) {
            const from = idToGraphNode.get(key);
            const target = idToGraphNode.get(info.extendsFrom);
            from.outgoing.add(target);
            target.incoming.add(from);
        }
    }
    // Sort topologically and iterate super classes first, so that we can trivially
    // propagate incompatibility statuses (and other checks) without having to check
    // in both directions (derived classes, or base classes). This simplifies the
    // propagation.
    for (const node of topologicalSort(inheritanceGraph).reverse()) {
        const existingMemberIncompatibility = node.data.info.memberIncompatibility !== null
            ? { reason: node.data.info.memberIncompatibility, context: null }
            : null;
        for (const parent of node.outgoing) {
            // If parent is incompatible and not migrated, then this input
            // cannot be migrated either. Try propagating parent incompatibility then.
            if (isNodeIncompatible(parent.data)) {
                node.data.info.memberIncompatibility = migrate_ts_type_references.pickFieldIncompatibility({ reason: migrate_ts_type_references.FieldIncompatibilityReason.ParentIsIncompatible, context: null }, existingMemberIncompatibility).reason;
                break;
            }
        }
    }
    for (const info of Object.values(combinedData.knownInputs)) {
        // We never saw a source file for this input, globally. Try marking it as incompatible,
        // so that all references and inheritance checks can propagate accordingly.
        if (!info.seenAsSourceInput) {
            const existingMemberIncompatibility = info.memberIncompatibility !== null
                ? { reason: info.memberIncompatibility, context: null }
                : null;
            info.memberIncompatibility = migrate_ts_type_references.pickFieldIncompatibility({ reason: migrate_ts_type_references.FieldIncompatibilityReason.OutsideOfMigrationScope, context: null }, existingMemberIncompatibility).reason;
        }
    }
    return globalMeta;
}

function populateKnownInputsFromGlobalData(knownInputs, globalData) {
    // Populate from batch metadata.
    for (const [_key, info] of Object.entries(globalData.knownInputs)) {
        const key = _key;
        // irrelevant for this compilation unit.
        if (!knownInputs.has({ key })) {
            continue;
        }
        const inputMetadata = knownInputs.get({ key });
        if (info.memberIncompatibility !== null) {
            knownInputs.markFieldIncompatible(inputMetadata.descriptor, {
                context: null, // No context serializable.
                reason: info.memberIncompatibility,
            });
        }
        if (info.owningClassIncompatibility !== null) {
            knownInputs.markClassIncompatible(inputMetadata.container.clazz, info.owningClassIncompatibility);
        }
    }
}

// TODO: Consider initializations inside the constructor. Those are not migrated right now
// though, as they are writes.
/**
 * Converts an `@Input()` property declaration to a signal input.
 *
 * @returns Replacements for converting the input.
 */
function convertToSignalInput(node, { resolvedMetadata: metadata, resolvedType, preferShorthandIfPossible, originalInputDecorator, initialValue, leadingTodoText, }, info, checker, importManager, result) {
    let optionsLiteral = null;
    // We need an options array for the input because:
    //   - the input is either aliased,
    //   - or we have a transform.
    if (metadata.bindingPropertyName !== metadata.classPropertyName || metadata.transform !== null) {
        const properties = [];
        if (metadata.bindingPropertyName !== metadata.classPropertyName) {
            properties.push(ts.factory.createPropertyAssignment('alias', ts.factory.createStringLiteral(metadata.bindingPropertyName)));
        }
        if (metadata.transform !== null) {
            const transformRes = extractTransformOfInput(metadata.transform, resolvedType, checker);
            properties.push(transformRes.node);
            // Propagate TODO if one was requested from the transform extraction/validation.
            if (transformRes.leadingTodoText !== null) {
                leadingTodoText =
                    (leadingTodoText ? `${leadingTodoText} ` : '') + transformRes.leadingTodoText;
            }
        }
        optionsLiteral = ts.factory.createObjectLiteralExpression(properties);
    }
    // The initial value is `undefined` or none is present:
    //    - We may be able to use the `input()` shorthand
    //    - or we use an explicit `undefined` initial value.
    if (initialValue === undefined) {
        // Shorthand not possible, so explicitly add `undefined`.
        if (preferShorthandIfPossible === null) {
            initialValue = ts.factory.createIdentifier('undefined');
        }
        else {
            resolvedType = preferShorthandIfPossible.originalType;
            // When using the `input()` shorthand, try cutting of `undefined` from potential
            // union types. `undefined` will be automatically included in the type.
            if (ts.isUnionTypeNode(resolvedType)) {
                resolvedType = migrate_ts_type_references.removeFromUnionIfPossible(resolvedType, (t) => t.kind !== ts.SyntaxKind.UndefinedKeyword);
            }
        }
    }
    const inputArgs = [];
    const typeArguments = [];
    if (resolvedType !== undefined) {
        typeArguments.push(resolvedType);
        if (metadata.transform !== null) {
            // Note: The TCB code generation may use the same type node and attach
            // synthetic comments for error reporting. We remove those explicitly here.
            typeArguments.push(ts.setSyntheticTrailingComments(metadata.transform.type.node, undefined));
        }
    }
    // Always add an initial value when the input is optional, and we have one, or we need one
    // to be able to pass options as the second argument.
    if (!metadata.required && (initialValue !== undefined || optionsLiteral !== null)) {
        inputArgs.push(initialValue ?? ts.factory.createIdentifier('undefined'));
    }
    if (optionsLiteral !== null) {
        inputArgs.push(optionsLiteral);
    }
    const inputFnRef = importManager.addImport({
        exportModuleSpecifier: '@angular/core',
        exportSymbolName: 'input',
        requestedFile: node.getSourceFile(),
    });
    const inputInitializerFn = metadata.required
        ? ts.factory.createPropertyAccessExpression(inputFnRef, 'required')
        : inputFnRef;
    const inputInitializer = ts.factory.createCallExpression(inputInitializerFn, typeArguments, inputArgs);
    let modifiersWithoutInputDecorator = node.modifiers?.filter((m) => m !== originalInputDecorator.node) ?? [];
    // Add `readonly` to all new signal input declarations.
    if (!modifiersWithoutInputDecorator?.some((s) => s.kind === ts.SyntaxKind.ReadonlyKeyword)) {
        modifiersWithoutInputDecorator.push(ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword));
    }
    const newNode = ts.factory.createPropertyDeclaration(modifiersWithoutInputDecorator, node.name, undefined, undefined, inputInitializer);
    const newPropertyText = result.printer.printNode(ts.EmitHint.Unspecified, newNode, node.getSourceFile());
    const replacements = [];
    if (leadingTodoText !== null) {
        replacements.push(migrate_ts_type_references.insertPrecedingLine(node, info, '// TODO: Notes from signal input migration:'), ...migrate_ts_type_references.cutStringToLineLimit(leadingTodoText, 70).map((line) => migrate_ts_type_references.insertPrecedingLine(node, info, `//  ${line}`)));
    }
    replacements.push(new project_paths.Replacement(project_paths.projectFile(node.getSourceFile(), info), new project_paths.TextUpdate({
        position: node.getStart(),
        end: node.getEnd(),
        toInsert: newPropertyText,
    })));
    return replacements;
}
/**
 * Extracts the transform for the given input and returns a property assignment
 * that works for the new signal `input()` API.
 */
function extractTransformOfInput(transform, resolvedType, checker) {
    assert(ts.isExpression(transform.node), `Expected transform to be an expression.`);
    let transformFn = transform.node;
    let leadingTodoText = null;
    // If there is an explicit type, check if the transform return type actually works.
    // In some cases, the transform function is not compatible because with decorator inputs,
    // those were not checked. We cast the transform to `any` and add a TODO.
    // TODO: Capture this in the design doc.
    if (resolvedType !== undefined && !ts.isSyntheticExpression(resolvedType)) {
        // Note: If the type is synthetic, we cannot check, and we accept that in the worst case
        // we will create code that is not necessarily compiling. This is unlikely, but notably
        // the errors would be correct and valuable.
        const transformType = checker.getTypeAtLocation(transform.node);
        const transformSignature = transformType.getCallSignatures()[0];
        assert(transformSignature !== undefined, 'Expected transform to be an invoke-able.');
        if (!checker.isTypeAssignableTo(checker.getReturnTypeOfSignature(transformSignature), checker.getTypeFromTypeNode(resolvedType))) {
            leadingTodoText =
                'Input type is incompatible with transform. The migration added an `any` cast. ' +
                    'This worked previously because Angular was unable to check transforms.';
            transformFn = ts.factory.createAsExpression(ts.factory.createParenthesizedExpression(transformFn), ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        }
    }
    return {
        node: ts.factory.createPropertyAssignment('transform', transformFn),
        leadingTodoText,
    };
}

/**
 * Phase that migrates `@Input()` declarations to signal inputs and
 * manages imports within the given file.
 */
function pass6__migrateInputDeclarations(host, checker, result, knownInputs, importManager, info) {
    let filesWithMigratedInputs = new Set();
    let filesWithIncompatibleInputs = new WeakSet();
    for (const [input, metadata] of result.sourceInputs) {
        const sf = input.node.getSourceFile();
        const inputInfo = knownInputs.get(input);
        // Do not migrate incompatible inputs.
        if (inputInfo.isIncompatible()) {
            const incompatibilityReason = inputInfo.container.getInputMemberIncompatibility(input);
            // Add a TODO for the incompatible input, if desired.
            if (incompatibilityReason !== null && host.config.insertTodosForSkippedFields) {
                result.replacements.push(...migrate_ts_type_references.insertTodoForIncompatibility(input.node, info, incompatibilityReason, {
                    single: 'input',
                    plural: 'inputs',
                }));
            }
            filesWithIncompatibleInputs.add(sf);
            continue;
        }
        assert(metadata !== null, `Expected metadata to exist for input isn't marked incompatible.`);
        assert(!ts.isAccessor(input.node), 'Accessor inputs are incompatible.');
        filesWithMigratedInputs.add(sf);
        result.replacements.push(...convertToSignalInput(input.node, metadata, info, checker, importManager, result));
    }
    for (const file of filesWithMigratedInputs) {
        // All inputs were migrated, so we can safely remove the `Input` symbol.
        if (!filesWithIncompatibleInputs.has(file)) {
            importManager.removeImport(file, 'Input', '@angular/core');
        }
    }
}

/**
 * Phase that applies all changes recorded by the import manager in
 * previous migrate phases.
 */
function pass10_applyImportManager(importManager, result, sourceFiles, info) {
    apply_import_manager.applyImportManagerChanges(importManager, result.replacements, sourceFiles, info);
}

/**
 * Phase that migrates TypeScript input references to be signal compatible.
 *
 * The phase takes care of control flow analysis and generates temporary variables
 * where needed to ensure narrowing continues to work. E.g.
 */
function pass5__migrateTypeScriptReferences(host, references, checker, info) {
    migrate_ts_type_references.migrateTypeScriptReferences(host, references, checker, info);
}

/**
 * Phase that migrates Angular template references to
 * unwrap signals.
 */
function pass7__migrateTemplateReferences(host, references) {
    const seenFileReferences = new Set();
    for (const reference of references) {
        // This pass only deals with HTML template references.
        if (!index.isTemplateReference(reference)) {
            continue;
        }
        // Skip references to incompatible inputs.
        if (!host.shouldMigrateReferencesToField(reference.target)) {
            continue;
        }
        const parent = reference.from.readAstPath.at(-2);
        let readEndPos;
        if (reference.from.isWrite && parent) {
            readEndPos = parent.sourceSpan.end;
        }
        else {
            readEndPos = reference.from.read.sourceSpan.end;
        }
        // Skip duplicate references. E.g. if a template is shared.
        const fileReferenceId = `${reference.from.templateFile.id}:${readEndPos}`;
        if (seenFileReferences.has(fileReferenceId)) {
            continue;
        }
        seenFileReferences.add(fileReferenceId);
        // Expand shorthands like `{bla}` to `{bla: bla()}`.
        const appendText = reference.from.isObjectShorthandExpression
            ? `: ${reference.from.read.name}()`
            : `()`;
        host.replacements.push(new project_paths.Replacement(reference.from.templateFile, new project_paths.TextUpdate({
            position: readEndPos,
            end: readEndPos,
            toInsert: appendText,
        })));
    }
}

/**
 * Phase that migrates Angular host binding references to
 * unwrap signals.
 */
function pass8__migrateHostBindings(host, references, info) {
    const seenReferences = new WeakMap();
    for (const reference of references) {
        // This pass only deals with host binding references.
        if (!index.isHostBindingReference(reference)) {
            continue;
        }
        // Skip references to incompatible inputs.
        if (!host.shouldMigrateReferencesToField(reference.target)) {
            continue;
        }
        const bindingField = reference.from.hostPropertyNode;
        const expressionOffset = bindingField.getStart() + 1; // account for quotes.
        const parent = reference.from.readAstPath.at(-2);
        let readEndPos;
        if (reference.from.isWrite && parent) {
            readEndPos = expressionOffset + parent.sourceSpan.end;
        }
        else {
            readEndPos = expressionOffset + reference.from.read.sourceSpan.end;
        }
        // Skip duplicate references. Can happen if the host object is shared.
        if (seenReferences.get(bindingField)?.has(readEndPos)) {
            continue;
        }
        if (seenReferences.has(bindingField)) {
            seenReferences.get(bindingField).add(readEndPos);
        }
        else {
            seenReferences.set(bindingField, new Set([readEndPos]));
        }
        // Expand shorthands like `{bla}` to `{bla: bla()}`.
        const appendText = reference.from.isObjectShorthandExpression
            ? `: ${reference.from.read.name}()`
            : `()`;
        host.replacements.push(new project_paths.Replacement(project_paths.projectFile(bindingField.getSourceFile(), info), new project_paths.TextUpdate({ position: readEndPos, end: readEndPos, toInsert: appendText })));
    }
}

/**
 * Migrates TypeScript "ts.Type" references. E.g.

 *  - `Partial<MyComp>` will be converted to `UnwrapSignalInputs<Partial<MyComp>>`.
      in Catalyst test files.
 */
function pass9__migrateTypeScriptTypeReferences(host, references, importManager, info) {
    migrate_ts_type_references.migrateTypeScriptTypeReferences(host, references, importManager, info);
}

/**
 * Executes the migration phase.
 *
 * This involves:
 *   - migrating TS references.
 *   - migrating `@Input()` declarations.
 *   - migrating template references.
 *   - migrating host binding references.
 */
function executeMigrationPhase(host, knownInputs, result, info) {
    const { typeChecker, sourceFiles } = info;
    const importManager = new project_tsconfig_paths.ImportManager({
        // For the purpose of this migration, we always use `input` and don't alias
        // it to e.g. `input_1`.
        generateUniqueIdentifier: () => null,
    });
    const referenceMigrationHost = {
        printer: result.printer,
        replacements: result.replacements,
        shouldMigrateReferencesToField: (inputDescr) => knownInputs.has(inputDescr) && knownInputs.get(inputDescr).isIncompatible() === false,
        shouldMigrateReferencesToClass: (clazz) => knownInputs.getDirectiveInfoForClass(clazz) !== undefined &&
            knownInputs.getDirectiveInfoForClass(clazz).hasMigratedFields(),
    };
    // Migrate passes.
    pass5__migrateTypeScriptReferences(referenceMigrationHost, result.references, typeChecker, info);
    pass6__migrateInputDeclarations(host, typeChecker, result, knownInputs, importManager, info);
    pass7__migrateTemplateReferences(referenceMigrationHost, result.references);
    pass8__migrateHostBindings(referenceMigrationHost, result.references, info);
    pass9__migrateTypeScriptTypeReferences(referenceMigrationHost, result.references, importManager, info);
    pass10_applyImportManager(importManager, result, sourceFiles, info);
}

/** Filters ignorable input incompatibilities when best effort mode is enabled. */
function filterIncompatibilitiesForBestEffortMode(knownInputs) {
    knownInputs.knownInputIds.forEach(({ container: c }) => {
        // All class incompatibilities are "filterable" right now.
        c.incompatible = null;
        for (const [key, i] of c.memberIncompatibility.entries()) {
            if (!migrate_ts_type_references.nonIgnorableFieldIncompatibilities.includes(i.reason)) {
                c.memberIncompatibility.delete(key);
            }
        }
    });
}

/**
 * Tsurge migration for migrating Angular `@Input()` declarations to
 * signal inputs, with support for batch execution.
 */
class SignalInputMigration extends project_paths.TsurgeComplexMigration {
    config;
    upgradedAnalysisPhaseResults = null;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    createProgram(tsconfigAbsPath, fs) {
        return super.createProgram(tsconfigAbsPath, fs, {
            _compilePoisonedComponents: true,
            // We want to migrate non-exported classes too.
            compileNonExportedClasses: true,
            // Always generate as much TCB code as possible.
            // This allows us to check references in templates as much as possible.
            // Note that this may yield more diagnostics, but we are not collecting these anyway.
            strictTemplates: true,
        });
    }
    /**
     * Prepares the program for this migration with additional custom
     * fields to allow for batch-mode testing.
     */
    _prepareProgram(info) {
        // Optional filter for testing. Allows for simulation of parallel execution
        // even if some tsconfig's have overlap due to sharing of TS sources.
        // (this is commonly not the case in g3 where deps are `.d.ts` files).
        const limitToRootNamesOnly = process.env['LIMIT_TO_ROOT_NAMES_ONLY'] === '1';
        const filteredSourceFiles = info.sourceFiles.filter((f) => 
        // Optional replacement filter. Allows parallel execution in case
        // some tsconfig's have overlap due to sharing of TS sources.
        // (this is commonly not the case in g3 where deps are `.d.ts` files).
        !limitToRootNamesOnly || info.__programAbsoluteRootFileNames.includes(f.fileName));
        return {
            ...info,
            sourceFiles: filteredSourceFiles,
        };
    }
    // Extend the program info with the analysis information we need in every phase.
    prepareAnalysisDeps(info) {
        const analysisInfo = {
            ...info,
            ...prepareAnalysisInfo(info.program, info.ngCompiler, info.__programAbsoluteRootFileNames),
        };
        return analysisInfo;
    }
    async analyze(info) {
        info = this._prepareProgram(info);
        const analysisDeps = this.prepareAnalysisDeps(info);
        const knownInputs = new KnownInputs(info, this.config);
        const result = new MigrationResult();
        const host = createMigrationHost(info, this.config);
        this.config.reportProgressFn?.(10, 'Analyzing project (input usages)..');
        const { inheritanceGraph } = executeAnalysisPhase(host, knownInputs, result, analysisDeps);
        // Mark filtered inputs before checking inheritance. This ensures filtered
        // inputs properly influence e.g. inherited or derived inputs that now wouldn't
        // be safe either (BUT can still be skipped via best effort mode later).
        filterInputsViaConfig(result, knownInputs, this.config);
        // Analyze inheritance, track edges etc. and later propagate incompatibilities in
        // the merge stage.
        this.config.reportProgressFn?.(40, 'Checking inheritance..');
        pass4__checkInheritanceOfInputs(inheritanceGraph, analysisDeps.metaRegistry, knownInputs);
        // Filter best effort incompatibilities, so that the new filtered ones can
        // be accordingly respected in the merge phase.
        if (this.config.bestEffortMode) {
            filterIncompatibilitiesForBestEffortMode(knownInputs);
        }
        const unitData = getCompilationUnitMetadata(knownInputs);
        // Non-batch mode!
        if (this.config.upgradeAnalysisPhaseToAvoidBatch) {
            const globalMeta = await this.globalMeta(unitData);
            const { replacements } = await this.migrate(globalMeta, info, {
                knownInputs,
                result,
                host,
                analysisDeps,
            });
            this.config.reportProgressFn?.(100, 'Completed migration.');
            // Expose the upgraded analysis stage results.
            this.upgradedAnalysisPhaseResults = {
                replacements,
                projectRoot: info.projectRoot,
                knownInputs,
            };
        }
        return project_paths.confirmAsSerializable(unitData);
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable(combineCompilationUnitData(unitA, unitB));
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(convertToGlobalMeta(combinedData));
    }
    async migrate(globalMetadata, info, nonBatchData) {
        info = this._prepareProgram(info);
        const knownInputs = nonBatchData?.knownInputs ?? new KnownInputs(info, this.config);
        const result = nonBatchData?.result ?? new MigrationResult();
        const host = nonBatchData?.host ?? createMigrationHost(info, this.config);
        const analysisDeps = nonBatchData?.analysisDeps ?? this.prepareAnalysisDeps(info);
        // Can't re-use analysis structures, so re-build them.
        if (nonBatchData === undefined) {
            executeAnalysisPhase(host, knownInputs, result, analysisDeps);
        }
        // Incorporate global metadata into known inputs.
        populateKnownInputsFromGlobalData(knownInputs, globalMetadata);
        if (this.config.bestEffortMode) {
            filterIncompatibilitiesForBestEffortMode(knownInputs);
        }
        this.config.reportProgressFn?.(60, 'Collecting migration changes..');
        executeMigrationPhase(host, knownInputs, result, analysisDeps);
        return { replacements: result.replacements };
    }
    async stats(globalMetadata) {
        let fullCompilationInputs = 0;
        let sourceInputs = 0;
        let incompatibleInputs = 0;
        const fieldIncompatibleCounts = {};
        const classIncompatibleCounts = {};
        for (const [id, input] of Object.entries(globalMetadata.knownInputs)) {
            fullCompilationInputs++;
            const isConsideredSourceInput = input.seenAsSourceInput &&
                input.memberIncompatibility !== migrate_ts_type_references.FieldIncompatibilityReason.OutsideOfMigrationScope &&
                input.memberIncompatibility !== migrate_ts_type_references.FieldIncompatibilityReason.SkippedViaConfigFilter;
            // We won't track incompatibilities to inputs that aren't considered source inputs.
            // Tracking their statistics wouldn't provide any value.
            if (!isConsideredSourceInput) {
                continue;
            }
            sourceInputs++;
            if (input.memberIncompatibility !== null || input.owningClassIncompatibility !== null) {
                incompatibleInputs++;
            }
            if (input.memberIncompatibility !== null) {
                const reasonName = migrate_ts_type_references.FieldIncompatibilityReason[input.memberIncompatibility];
                const key = `input-field-incompatibility-${reasonName}`;
                fieldIncompatibleCounts[key] ??= 0;
                fieldIncompatibleCounts[key]++;
            }
            if (input.owningClassIncompatibility !== null) {
                const reasonName = migrate_ts_type_references.ClassIncompatibilityReason[input.owningClassIncompatibility];
                const key = `input-owning-class-incompatibility-${reasonName}`;
                classIncompatibleCounts[key] ??= 0;
                classIncompatibleCounts[key]++;
            }
        }
        return project_paths.confirmAsSerializable({
            fullCompilationInputs,
            sourceInputs,
            incompatibleInputs,
            ...fieldIncompatibleCounts,
            ...classIncompatibleCounts,
        });
    }
}
/**
 * Updates the migration state to filter inputs based on a filter
 * method defined in the migration config.
 */
function filterInputsViaConfig(result, knownInputs, config) {
    if (config.shouldMigrateInput === undefined) {
        return;
    }
    const skippedInputs = new Set();
    // Mark all skipped inputs as incompatible for migration.
    for (const input of knownInputs.knownInputIds.values()) {
        if (!config.shouldMigrateInput(input)) {
            skippedInputs.add(input.descriptor.key);
            knownInputs.markFieldIncompatible(input.descriptor, {
                context: null,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.SkippedViaConfigFilter,
            });
        }
    }
}
function createMigrationHost(info, config) {
    return new MigrationHost(/* isMigratingCore */ false, info, config, info.sourceFiles);
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new SignalInputMigration({
                bestEffortMode: options.bestEffortMode,
                insertTodosForSkippedFields: options.insertTodos,
                shouldMigrateInput: (input) => {
                    return (input.file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                        !/(^|\/)node_modules\//.test(input.file.rootRelativePath));
                },
            }),
            beforeProgramCreation: (tsconfigPath, stage) => {
                if (stage === project_paths.MigrationStage.Analysis) {
                    context.logger.info(`Preparing analysis for: ${tsconfigPath}...`);
                }
                else {
                    context.logger.info(`Running migration for: ${tsconfigPath}...`);
                }
            },
            afterProgramCreation: (info, fs) => {
                const analysisPath = fs.resolve(options.analysisDir);
                // Support restricting the analysis to subfolders for larger projects.
                if (analysisPath !== '/') {
                    info.sourceFiles = info.sourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                    info.fullProgramSourceFiles = info.fullProgramSourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                }
            },
            beforeUnitAnalysis: (tsconfigPath) => {
                context.logger.info(`Scanning for inputs: ${tsconfigPath}...`);
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            whenDone: ({ sourceInputs, incompatibleInputs }) => {
                const migratedInputs = sourceInputs - incompatibleInputs;
                context.logger.info('');
                context.logger.info(`Successfully migrated to signal inputs 🎉`);
                context.logger.info(`  -> Migrated ${migratedInputs}/${sourceInputs} inputs.`);
                if (incompatibleInputs > 0 && !options.insertTodos) {
                    context.logger.warn(`To see why ${incompatibleInputs} inputs couldn't be migrated`);
                    context.logger.warn(`consider re-running with "--insert-todos" or "--best-effort-mode".`);
                }
                if (options.bestEffortMode) {
                    context.logger.warn(`You ran with best effort mode. Manually verify all code ` +
                        `works as intended, and fix where necessary.`);
                }
            },
        });
    };
}

exports.migrate = migrate;
