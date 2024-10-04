'use strict';
/**
 * @license Angular v19.0.0-next.8+sha-84b6896
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var group_replacements = require('./group_replacements-2abd53dc.js');
var ts = require('typescript');
require('os');
var checker = require('./checker-e68dd7ce.js');
var program = require('./program-921f9663.js');
require('path');
var assert = require('assert');
var leading_space = require('./leading_space-d190b83b.js');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
require('@angular-devkit/core');
require('node:path');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);

/**
 * Gets human-readable message information for the given input incompatibility.
 * This text will be used by the language service, or CLI-based migration.
 */
function getMessageForInputIncompatibility(reason) {
    switch (reason) {
        case group_replacements.InputIncompatibilityReason.Accessor:
            return {
                short: 'Accessor inputs cannot be migrated as they are too complex.',
                extra: 'The migration potentially requires usage of `effect` or `computed`, but ' +
                    'the intent is unclear. The migration cannot safely migrate.',
            };
        case group_replacements.InputIncompatibilityReason.OverriddenByDerivedClass:
            return {
                short: 'The input cannot be migrated because the field is overridden by a subclass.',
                extra: 'The field in the subclass is not an input, so migrating would break your build.',
            };
        case group_replacements.InputIncompatibilityReason.ParentIsIncompatible:
            return {
                short: 'This input is inherited from a superclass, but the parent cannot be migrated.',
                extra: 'Migrating this input would cause your build to fail.',
            };
        case group_replacements.InputIncompatibilityReason.PotentiallyNarrowedInTemplateButNoSupportYet:
            return {
                short: 'This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and ' +
                    'migrating would break narrowing currently.',
                extra: `In the future, Angular intends to support narrowing of signals.`,
            };
        case group_replacements.InputIncompatibilityReason.RedeclaredViaDerivedClassInputsArray:
            return {
                short: 'The input is overridden by a subclass that cannot be migrated.',
                extra: 'The subclass re-declares this input via the `inputs` array in @Directive/@Component. ' +
                    'Migrating this input would break your build because the subclass input cannot be migrated.',
            };
        case group_replacements.InputIncompatibilityReason.RequiredInputButNoGoodExplicitTypeExtractable:
            return {
                short: `Input is required, but the migration cannot determine a good type for the input.`,
                extra: 'Consider adding an explicit type to make the migration possible.',
            };
        case group_replacements.InputIncompatibilityReason.InputWithQuestionMarkButNoGoodExplicitTypeExtractable:
            return {
                short: `Input is marked with a question mark. Migration could not determine a good type for the input.`,
                extra: 'The migration needs to be able to resolve a type, so that it can include `undefined` in your type. ' +
                    'Consider adding an explicit type to make the migration possible.',
            };
        case group_replacements.InputIncompatibilityReason.SkippedViaConfigFilter:
            return {
                short: `This input is not part of the current migration scope.`,
                extra: 'Skipped via migration config.',
            };
        case group_replacements.InputIncompatibilityReason.SpyOnThatOverwritesField:
            return {
                short: 'A jasmine `spyOn` call spies on this input. This breaks with signal inputs.',
                extra: `Migration cannot safely migrate as "spyOn" writes to the input. Signal inputs are readonly.`,
            };
        case group_replacements.InputIncompatibilityReason.TypeConflictWithBaseClass:
            return {
                short: 'This input overrides a field from a superclass, while the superclass field is not migrated.',
                extra: 'Migrating the input would break your build because of a type conflict then.',
            };
        case group_replacements.InputIncompatibilityReason.WriteAssignment:
            return {
                short: 'Your application code writes to the input. This prevents migration.',
                extra: 'Signal inputs are readonly, so migrating would break your build.',
            };
        case group_replacements.InputIncompatibilityReason.OutsideOfMigrationScope:
            return {
                short: 'This input is not part of any source files in your project.',
                extra: 'The migration excludes inputs if no source file declaring the input was seen.',
            };
    }
}
/**
 * Gets human-readable message information for the given input class incompatibility.
 * This text will be used by the language service, or CLI-based migration.
 */
function getMessageForClassIncompatibility(reason) {
    switch (reason) {
        case group_replacements.ClassIncompatibilityReason.InputOwningClassReferencedInClassProperty:
            return {
                short: 'Class of this input is referenced in the signature of another class.',
                extra: 'The other class is likely typed to expect a non-migrated field, so ' +
                    'migration is skipped to not break your build.',
            };
        case group_replacements.ClassIncompatibilityReason.ClassManuallyInstantiated:
            return {
                short: 'Class of this input is manually instantiated. ' +
                    'This is discouraged and prevents migration',
                extra: 'Signal inputs require a DI injection context. Manually instantiating ' +
                    'breaks this requirement in some cases, so the migration is skipped.',
            };
    }
}

/**
 * Class that holds information about a given directive and its input fields.
 */
class DirectiveInfo {
    constructor(clazz) {
        this.clazz = clazz;
        /**
         * Map of inputs detected in the given class.
         * Maps string-based input ids to the detailed input metadata.
         */
        this.inputFields = new Map();
        /** Map of input IDs and their incompatibilities. */
        this.memberIncompatibility = new Map();
        /**
         * Whether the whole class is incompatible.
         *
         * Class incompatibility precedes individual member incompatibility.
         * All members in the class are considered incompatible.
         */
        this.incompatible = null;
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
    if (ts__default["default"].isAccessor(node)) {
        className = node.parent.name?.text || '<anonymous>';
    }
    else {
        className = node.parent.name?.text ?? '<anonymous>';
    }
    const info = hostOrInfo instanceof MigrationHost ? hostOrInfo.programInfo : hostOrInfo;
    const file = group_replacements.projectFile(node.getSourceFile(), info);
    // Inputs may be detected in `.d.ts` files. Ensure that if the file IDs
    // match regardless of extension. E.g. `/google3/blaze-out/bin/my_file.ts` should
    // have the same ID as `/google3/my_file.ts`.
    const id = file.id.replace(/\.d\.ts$/, '.ts');
    return {
        key: `${id}@@${className}@@${node.name.text}`,
        node,
    };
}
/** Whether the given value is an input descriptor. */
function isInputDescriptor(v) {
    return (v.key !== undefined &&
        v.node !== undefined);
}

/**
 * Attempts to resolve the known `@Input` metadata for the given
 * type checking symbol. Returns `null` if it's not for an input.
 */
function attemptRetrieveInputFromSymbol(programInfo, memberSymbol, knownInputs) {
    // Even for declared classes from `.d.ts`, the value declaration
    // should exist and point to the property declaration.
    if (memberSymbol.valueDeclaration !== undefined &&
        group_replacements.isInputContainerNode(memberSymbol.valueDeclaration)) {
        const member = memberSymbol.valueDeclaration;
        // If the member itself is an input that is being migrated, we
        // do not need to check, as overriding would be fine then— like before.
        const memberInputDescr = group_replacements.isInputContainerNode(member)
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
    constructor(programInfo, config) {
        this.programInfo = programInfo;
        this.config = config;
        /**
         * Known inputs from the whole program.
         */
        this.knownInputIds = new Map();
        /** Known container classes of inputs. */
        this._allClasses = new Set();
        /** Maps classes to their directive info. */
        this._classToDirectiveInfo = new Map();
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
            file: group_replacements.projectFile(data.node.getSourceFile(), this.programInfo),
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
        if (existingIncompatibility !== null && group_replacements.isInputMemberIncompatibility(existingIncompatibility)) {
            incompatibility = group_replacements.pickInputIncompatibility(existingIncompatibility, incompatibility);
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
            reason: group_replacements.InputIncompatibilityReason.OverriddenByDerivedClass,
        });
    }
    captureUnknownParentField(field) {
        this.markFieldIncompatible(field, {
            context: null,
            reason: group_replacements.InputIncompatibilityReason.TypeConflictWithBaseClass,
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
    // Analyze sync and retrieve necessary dependencies.
    // Note: `getTemplateTypeChecker` requires the `enableTemplateTypeChecker` flag, but
    // this has negative effects as it causes optional TCB operations to execute, which may
    // error with unsuccessful reference emits that previously were ignored outside of the migration.
    // The migration is resilient to TCB information missing, so this is fine, and all the information
    // we need is part of required TCB operations anyway.
    const { refEmitter, metaReader, templateTypeChecker } = compiler['ensureAnalyzed']();
    // Generate all type check blocks.
    templateTypeChecker.generateAllTypeCheckBlocks();
    const typeChecker = userProgram.getTypeChecker();
    const reflector = new checker.TypeScriptReflectionHost(typeChecker);
    const evaluator = new program.PartialEvaluator(reflector, typeChecker, null);
    const dtsMetadataReader = new program.DtsMetadataReader(typeChecker, reflector);
    const resourceLoader = compiler['resourceManager'];
    // Optional filter for testing. Allows for simulation of parallel execution
    // even if some tsconfig's have overlap due to sharing of TS sources.
    // (this is commonly not the case in g3 where deps are `.d.ts` files).
    const limitToRootNamesOnly = process.env['LIMIT_TO_ROOT_NAMES_ONLY'] === '1';
    if (limitToRootNamesOnly) {
        assert__default["default"](programAbsoluteRootPaths !== undefined, 'Expected absolute root paths when limiting to root names.');
    }
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
    constructor() {
        this.printer = ts__default["default"].createPrinter({ newLine: ts__default["default"].NewLineKind.LineFeed });
        // May be `null` if the input cannot be converted. This is also
        // signified by an incompatibility- but the input is tracked here as it
        // still is a "source input".
        this.sourceInputs = new Map();
        this.references = [];
        // Execution data
        this.replacements = [];
        this.inputDecoratorSpecifiers = new Map();
    }
}

/** Attempts to extract metadata of a potential TypeScript `@Input()` declaration. */
function extractDecoratorInput(node, host, reflector, metadataReader, evaluator, refEmitter) {
    return (extractSourceCodeInput(node, host, reflector, evaluator, refEmitter) ??
        extractDtsInput(node, metadataReader));
}
/**
 * Attempts to extract `@Input()` information for the given node, assuming it's
 * part of a `.d.ts` file.
 */
function extractDtsInput(node, metadataReader) {
    if (!group_replacements.isInputContainerNode(node) ||
        !ts__default["default"].isIdentifier(node.name) ||
        !node.getSourceFile().isDeclarationFile) {
        return null;
    }
    // If the potential node is not part of a valid input class, skip.
    if (!ts__default["default"].isClassDeclaration(node.parent) ||
        node.parent.name === undefined ||
        !ts__default["default"].isIdentifier(node.parent.name)) {
        return null;
    }
    const directiveMetadata = metadataReader.getDirectiveMetadata(new checker.Reference(node.parent));
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
        };
}
/**
 * Attempts to extract `@Input()` information for the given node, assuming it's
 * directly defined inside a source file (`.ts`).
 */
function extractSourceCodeInput(node, host, reflector, evaluator, refEmitter) {
    if (!group_replacements.isInputContainerNode(node) ||
        !ts__default["default"].isIdentifier(node.name) ||
        node.getSourceFile().isDeclarationFile) {
        return null;
    }
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    if (decorators === null) {
        return null;
    }
    const ngDecorators = checker.getAngularDecorators(decorators, ['Input'], host.isMigratingCore);
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
                transformResult = parseTransformOfInput(evaluatedInputOpts, node, reflector, refEmitter);
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
    };
}
/**
 * Gracefully attempts to parse the `transform` option of an `@Input()`
 * and extracts its metadata.
 */
function parseTransformOfInput(evaluatedInputOpts, node, reflector, refEmitter) {
    const transformValue = evaluatedInputOpts.get('transform');
    if (!(transformValue instanceof checker.DynamicValue) && !(transformValue instanceof checker.Reference)) {
        return null;
    }
    try {
        return program.parseDecoratorInputTransformFunction(node.parent, node.name.text, transformValue, reflector, refEmitter, checker.CompilationMode.FULL);
    }
    catch (e) {
        if (!(e instanceof checker.FatalDiagnosticError)) {
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
    if (ts__default["default"].isAccessor(node)) {
        return {
            context: node,
            reason: group_replacements.InputIncompatibilityReason.Accessor,
        };
    }
    assert__default["default"](metadata.inputDecorator !== null, 'Expected an input decorator for inputs that are being migrated.');
    let initialValue = node.initializer;
    let isUndefinedInitialValue = node.initializer === undefined ||
        (ts__default["default"].isIdentifier(node.initializer) && node.initializer.text === 'undefined');
    const loosePropertyInitializationWithStrictNullChecks = options.strict !== true && options.strictPropertyInitialization !== true;
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
        !loosePropertyInitializationWithStrictNullChecks) {
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
                reason: group_replacements.InputIncompatibilityReason.InputWithQuestionMarkButNoGoodExplicitTypeExtractable,
            };
        }
        if (!checker.isTypeAssignableTo(checker.getUndefinedType(), checker.getTypeFromTypeNode(typeToAdd))) {
            typeToAdd = ts__default["default"].factory.createUnionTypeNode([
                typeToAdd,
                ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.UndefinedKeyword),
            ]);
        }
    }
    let leadingTodoText = null;
    // If the input does not have an initial value, and strict property initialization
    // is disabled, while strict null checks are enabled; then we know that `undefined`
    // cannot be used as initial value, nor do we want to expand the input's type magically.
    // Instead, we detect this case and migrate to `undefined!` which leaves the behavior unchanged.
    // TODO: This would be a good spot for a clean-up TODO.
    if (loosePropertyInitializationWithStrictNullChecks &&
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
        initialValue = ts__default["default"].factory.createNonNullExpression(ts__default["default"].factory.createIdentifier('undefined'));
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
                reason: group_replacements.InputIncompatibilityReason.RequiredInputButNoGoodExplicitTypeExtractable,
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
        return checker.typeToTypeNode(propertyType, node, ts__default["default"].NodeBuilderFlags.NoTypeReduction) ?? null;
    }
    // Alternatively, try to infer a simple importable type from\
    // the initializer.
    if (ts__default["default"].isIdentifier(initialValue)) {
        // @Input({required: true}) bla = SOME_DEFAULT;
        return ts__default["default"].factory.createTypeQueryNode(initialValue);
    }
    else if (ts__default["default"].isPropertyAccessExpression(initialValue) &&
        ts__default["default"].isIdentifier(initialValue.name) &&
        ts__default["default"].isIdentifier(initialValue.expression)) {
        // @Input({required: true}) bla = prop.SOME_DEFAULT;
        return ts__default["default"].factory.createTypeQueryNode(ts__default["default"].factory.createQualifiedName(initialValue.name, initialValue.expression));
    }
    return null;
}
function isPrimitiveImportableTypeNode(type) {
    return !!(type.flags & ts__default["default"].TypeFlags.BooleanLike ||
        type.flags & ts__default["default"].TypeFlags.StringLike ||
        type.flags & ts__default["default"].TypeFlags.NumberLike ||
        type.flags & ts__default["default"].TypeFlags.Undefined ||
        type.flags & ts__default["default"].TypeFlags.Null);
}

/**
 * Phase where we iterate through all source files of the program (including `.d.ts`)
 * and keep track of all `@Input`'s we discover.
 */
function pass1__IdentifySourceFileAndDeclarationInputs(sf, host, checker, reflector, dtsMetadataReader, evaluator, refEmitter, knownDecoratorInputs, result) {
    const visitor = (node) => {
        const decoratorInput = extractDecoratorInput(node, host, reflector, dtsMetadataReader, evaluator, refEmitter);
        if (decoratorInput !== null) {
            assert__default["default"](group_replacements.isInputContainerNode(node), 'Expected input to be declared on accessor or property.');
            const inputDescr = getInputDescriptor(host, node);
            // track all inputs, even from declarations for reference resolution.
            knownDecoratorInputs.register({ descriptor: inputDescr, metadata: decoratorInput, node });
            // track source file inputs in the result of this target.
            // these are then later migrated in the migration phase.
            if (decoratorInput.inSourceFile && host.isSourceFileForCurrentMigration(sf)) {
                const conversionPreparation = prepareAndCheckForConversion(node, decoratorInput, checker, host.compilerOptions);
                if (group_replacements.isInputMemberIncompatibility(conversionPreparation)) {
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
        if (ts__default["default"].isImportSpecifier(node) &&
            ((importName = (node.propertyName ?? node.name).text) === 'Input' ||
                importName === 'input') &&
            ts__default["default"].isStringLiteral(node.parent.parent.parent.moduleSpecifier) &&
            (host.isMigratingCore || node.parent.parent.parent.moduleSpecifier.text === '@angular/core')) {
            if (!result.inputDecoratorSpecifiers.has(sf)) {
                result.inputDecoratorSpecifiers.set(sf, []);
            }
            result.inputDecoratorSpecifiers.get(sf).push({
                kind: importName === 'input' ? 'signal-input-import' : 'decorator-input-import',
                node,
            });
        }
        ts__default["default"].forEachChild(node, visitor);
    };
    ts__default["default"].forEachChild(sf, visitor);
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
function pass3__checkIncompatiblePatterns(inheritanceGraph, checker, groupedTsAstVisitor, knownInputs) {
    group_replacements.checkIncompatiblePatterns(inheritanceGraph, checker, groupedTsAstVisitor, knownInputs, () => knownInputs.getAllInputContainingClasses());
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
    groupedTsAstVisitor.register(group_replacements.createFindAllSourceFileReferencesVisitor(programInfo, checker, reflector, resourceLoader, evaluator, templateTypeChecker, knownInputs, fieldNamesToConsiderForReferenceLookup, result).visitor);
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
function executeAnalysisPhase(host, knownInputs, result, { sourceFiles, fullProgramSourceFiles, reflector, dtsMetadataReader, typeChecker, templateTypeChecker, resourceLoader, evaluator, refEmitter, }) {
    // Pass 1
    fullProgramSourceFiles.forEach((sf) => 
    // Shim shim files. Those are unnecessary and might cause unexpected slowness.
    // e.g. `ngtypecheck` files.
    !checker.isShim(sf) &&
        pass1__IdentifySourceFileAndDeclarationInputs(sf, host, typeChecker, reflector, dtsMetadataReader, evaluator, refEmitter, knownInputs, result));
    const fieldNamesToConsiderForReferenceLookup = new Set();
    for (const input of knownInputs.knownInputIds.values()) {
        if (host.config.shouldMigrateInput?.(input) === false) {
            continue;
        }
        fieldNamesToConsiderForReferenceLookup.add(input.descriptor.node.name.text);
    }
    // A graph starting with source files is sufficient. We will resolve into
    // declaration files if a source file depends on such.
    const inheritanceGraph = new group_replacements.InheritanceGraph(typeChecker).expensivePopulate(sourceFiles);
    const pass2And3SourceFileVisitor = new group_replacements.GroupedTsAstVisitor(sourceFiles);
    // Register pass 2. Find all source file references.
    pass2_IdentifySourceFileReferences(host.programInfo, typeChecker, reflector, resourceLoader, evaluator, templateTypeChecker, pass2And3SourceFileVisitor, knownInputs, result, fieldNamesToConsiderForReferenceLookup);
    // Register pass 3. Check incompatible patterns pass.
    pass3__checkIncompatiblePatterns(inheritanceGraph, typeChecker, pass2And3SourceFileVisitor, knownInputs);
    // Perform Pass 2 and Pass 3, efficiently in one pass.
    pass2And3SourceFileVisitor.execute();
    // Determine incompatible inputs based on resolved references.
    for (const reference of result.references) {
        if (group_replacements.isTsReference(reference) && reference.from.isWrite) {
            knownInputs.markFieldIncompatible(reference.target, {
                reason: group_replacements.InputIncompatibilityReason.WriteAssignment,
                context: reference.from.node,
            });
        }
        if (group_replacements.isTemplateReference(reference) || group_replacements.isHostBindingReference(reference)) {
            if (reference.from.isWrite) {
                knownInputs.markFieldIncompatible(reference.target, {
                    reason: group_replacements.InputIncompatibilityReason.WriteAssignment,
                    // No TS node context available for template or host bindings.
                    context: null,
                });
            }
        }
        // TODO: Remove this when we support signal narrowing in templates.
        // https://github.com/angular/angular/pull/55456.
        if (group_replacements.isTemplateReference(reference)) {
            if (reference.from.isLikelyPartOfNarrowing) {
                knownInputs.markFieldIncompatible(reference.target, {
                    reason: group_replacements.InputIncompatibilityReason.PotentiallyNarrowedInTemplateButNoSupportYet,
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
 * ```
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
    group_replacements.checkInheritanceOfKnownFields(inheritanceGraph, metaRegistry, knownInputs, {
        isClassWithKnownFields: (clazz) => knownInputs.isInputContainingClass(clazz),
        getFieldsForClass: (clazz) => {
            const directiveInfo = knownInputs.getDirectiveInfoForClass(clazz);
            assert__default["default"](directiveInfo !== undefined, 'Expected directive info to exist for input.');
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
function mergeCompilationUnitData(metadataFiles) {
    const result = {
        knownInputs: {},
    };
    const idToGraphNode = new Map();
    const inheritanceGraph = [];
    const isNodeIncompatible = (node) => node.info.memberIncompatibility !== null || node.info.owningClassIncompatibility !== null;
    for (const file of metadataFiles) {
        for (const [key, info] of Object.entries(file.knownInputs)) {
            const existing = result.knownInputs[key];
            if (existing === undefined) {
                result.knownInputs[key] = info;
                const node = {
                    incoming: new Set(),
                    outgoing: new Set(),
                    data: { info, key },
                };
                inheritanceGraph.push(node);
                idToGraphNode.set(key, node);
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
                    existing.memberIncompatibility = group_replacements.pickInputIncompatibility({ reason: info.memberIncompatibility, context: null }, { reason: existing.memberIncompatibility, context: null }).reason;
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
    for (const [key, info] of Object.entries(result.knownInputs)) {
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
                node.data.info.memberIncompatibility = group_replacements.pickInputIncompatibility({ reason: group_replacements.InputIncompatibilityReason.ParentIsIncompatible, context: null }, existingMemberIncompatibility).reason;
                break;
            }
        }
    }
    for (const info of Object.values(result.knownInputs)) {
        // We never saw a source file for this input, globally. Try marking it as incompatible,
        // so that all references and inheritance checks can propagate accordingly.
        if (!info.seenAsSourceInput) {
            const existingMemberIncompatibility = info.memberIncompatibility !== null
                ? { reason: info.memberIncompatibility, context: null }
                : null;
            info.memberIncompatibility = group_replacements.pickInputIncompatibility({ reason: group_replacements.InputIncompatibilityReason.OutsideOfMigrationScope, context: null }, existingMemberIncompatibility).reason;
        }
    }
    return result;
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

/**
 * Inserts a leading string for the given node, respecting
 * indentation of the given anchor node.
 *
 * Useful for inserting TODOs.
 */
function insertPrecedingLine(node, info, text) {
    const leadingSpace = leading_space.getLeadingLineWhitespaceOfNode(node);
    return new group_replacements.Replacement(group_replacements.projectFile(node.getSourceFile(), info), new group_replacements.TextUpdate({
        position: node.getStart(),
        end: node.getStart(),
        toInsert: `${text}\n${leadingSpace}`,
    }));
}

/**
 * Cuts the given string into lines basing around the specified
 * line length limit. This function breaks the string on a per-word basis.
 */
function cutStringToLineLimit(str, limit) {
    const words = str.split(' ');
    const chunks = [];
    let chunkIdx = 0;
    while (words.length) {
        // New line if we exceed limit.
        if (chunks[chunkIdx] !== undefined && chunks[chunkIdx].length > limit) {
            chunkIdx++;
        }
        // Ensure line is initialized for the given index.
        if (chunks[chunkIdx] === undefined) {
            chunks[chunkIdx] = '';
        }
        const word = words.shift();
        const needsSpace = chunks[chunkIdx].length > 0;
        // Insert word. Add space before, if the line already contains text.
        chunks[chunkIdx] += `${needsSpace ? ' ' : ''}${word}`;
    }
    return chunks;
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
            properties.push(ts__default["default"].factory.createPropertyAssignment('alias', ts__default["default"].factory.createStringLiteral(metadata.bindingPropertyName)));
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
        optionsLiteral = ts__default["default"].factory.createObjectLiteralExpression(properties);
    }
    // The initial value is `undefined` or none is present:
    //    - We may be able to use the `input()` shorthand
    //    - or we use an explicit `undefined` initial value.
    if (initialValue === undefined) {
        // Shorthand not possible, so explicitly add `undefined`.
        if (preferShorthandIfPossible === null) {
            initialValue = ts__default["default"].factory.createIdentifier('undefined');
        }
        else {
            resolvedType = preferShorthandIfPossible.originalType;
            // When using the `input()` shorthand, try cutting of `undefined` from potential
            // union types. `undefined` will be automatically included in the type.
            if (ts__default["default"].isUnionTypeNode(resolvedType)) {
                resolvedType = group_replacements.removeFromUnionIfPossible(resolvedType, (t) => t.kind !== ts__default["default"].SyntaxKind.UndefinedKeyword);
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
            typeArguments.push(ts__default["default"].setSyntheticTrailingComments(metadata.transform.type.node, undefined));
        }
    }
    // Always add an initial value when the input is optional, and we have one, or we need one
    // to be able to pass options as the second argument.
    if (!metadata.required && (initialValue !== undefined || optionsLiteral !== null)) {
        inputArgs.push(initialValue ?? ts__default["default"].factory.createIdentifier('undefined'));
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
        ? ts__default["default"].factory.createPropertyAccessExpression(inputFnRef, 'required')
        : inputFnRef;
    const inputInitializer = ts__default["default"].factory.createCallExpression(inputInitializerFn, typeArguments, inputArgs);
    let modifiersWithoutInputDecorator = node.modifiers?.filter((m) => m !== originalInputDecorator.node) ?? [];
    // Add `readonly` to all new signal input declarations.
    if (!modifiersWithoutInputDecorator?.some((s) => s.kind === ts__default["default"].SyntaxKind.ReadonlyKeyword)) {
        modifiersWithoutInputDecorator.push(ts__default["default"].factory.createModifier(ts__default["default"].SyntaxKind.ReadonlyKeyword));
    }
    const newNode = ts__default["default"].factory.createPropertyDeclaration(modifiersWithoutInputDecorator, node.name, undefined, undefined, inputInitializer);
    const newPropertyText = result.printer.printNode(ts__default["default"].EmitHint.Unspecified, newNode, node.getSourceFile());
    const replacements = [];
    if (leadingTodoText !== null) {
        replacements.push(insertPrecedingLine(node, info, '// TODO: Notes from signal input migration:'), ...cutStringToLineLimit(leadingTodoText, 70).map((line) => insertPrecedingLine(node, info, `//  ${line}`)));
    }
    replacements.push(new group_replacements.Replacement(group_replacements.projectFile(node.getSourceFile(), info), new group_replacements.TextUpdate({
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
    assert__default["default"](ts__default["default"].isExpression(transform.node), `Expected transform to be an expression.`);
    let transformFn = transform.node;
    let leadingTodoText = null;
    // If there is an explicit type, check if the transform return type actually works.
    // In some cases, the transform function is not compatible because with decorator inputs,
    // those were not checked. We cast the transform to `any` and add a TODO.
    // TODO: Capture this in the design doc.
    if (resolvedType !== undefined && !ts__default["default"].isSyntheticExpression(resolvedType)) {
        // Note: If the type is synthetic, we cannot check, and we accept that in the worst case
        // we will create code that is not necessarily compiling. This is unlikely, but notably
        // the errors would be correct and valuable.
        const transformType = checker.getTypeAtLocation(transform.node);
        const transformSignature = transformType.getCallSignatures()[0];
        assert__default["default"](transformSignature !== undefined, 'Expected transform to be an invoke-able.');
        if (!checker.isTypeAssignableTo(checker.getReturnTypeOfSignature(transformSignature), checker.getTypeFromTypeNode(resolvedType))) {
            leadingTodoText =
                'Input type is incompatible with transform. The migration added an `any` cast. ' +
                    'This worked previously because Angular was unable to check transforms.';
            transformFn = ts__default["default"].factory.createAsExpression(ts__default["default"].factory.createParenthesizedExpression(transformFn), ts__default["default"].factory.createKeywordTypeNode(ts__default["default"].SyntaxKind.AnyKeyword));
        }
    }
    return {
        node: ts__default["default"].factory.createPropertyAssignment('transform', transformFn),
        leadingTodoText,
    };
}

/**
 * Inserts a TODO for the incompatibility blocking the given node
 * from being migrated.
 */
function insertTodoForIncompatibility(node, programInfo, input) {
    const incompatibility = input.container.getInputMemberIncompatibility(input.descriptor);
    if (incompatibility === null) {
        return [];
    }
    // If an input is skipped via config filter or outside migration scope, do not
    // insert TODOs, as this could results in lots of unnecessary comments.
    if (group_replacements.isInputMemberIncompatibility(incompatibility) &&
        (incompatibility.reason === group_replacements.InputIncompatibilityReason.SkippedViaConfigFilter ||
            incompatibility.reason === group_replacements.InputIncompatibilityReason.OutsideOfMigrationScope)) {
        return [];
    }
    const message = group_replacements.isInputMemberIncompatibility(incompatibility)
        ? getMessageForInputIncompatibility(incompatibility.reason).short
        : getMessageForClassIncompatibility(incompatibility).short;
    const lines = cutStringToLineLimit(message, 70);
    return [
        insertPrecedingLine(node, programInfo, `// TODO: Skipped for migration because:`),
        ...lines.map((line) => insertPrecedingLine(node, programInfo, `//  ${line}`)),
    ];
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
            // Add a TODO for the incompatible input, if desired.
            if (host.config.insertTodosForSkippedFields) {
                result.replacements.push(...insertTodoForIncompatibility(input.node, info, inputInfo));
            }
            filesWithIncompatibleInputs.add(sf);
            continue;
        }
        assert__default["default"](metadata !== null, `Expected metadata to exist for input isn't marked incompatible.`);
        assert__default["default"](!ts__default["default"].isAccessor(input.node), 'Accessor inputs are incompatible.');
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
    group_replacements.applyImportManagerChanges(importManager, result.replacements, sourceFiles, info);
}

/**
 * Phase that migrates TypeScript input references to be signal compatible.
 *
 * The phase takes care of control flow analysis and generates temporary variables
 * where needed to ensure narrowing continues to work. E.g.
 */
function pass5__migrateTypeScriptReferences(host, references, checker, info) {
    group_replacements.migrateTypeScriptReferences(host, references, checker, info);
}

/**
 * Phase that migrates Angular template references to
 * unwrap signals.
 */
function pass7__migrateTemplateReferences(host, references) {
    const seenFileReferences = new Set();
    for (const reference of references) {
        // This pass only deals with HTML template references.
        if (!group_replacements.isTemplateReference(reference)) {
            continue;
        }
        // Skip references to incompatible inputs.
        if (!host.shouldMigrateReferencesToField(reference.target)) {
            continue;
        }
        // Skip duplicate references. E.g. if a template is shared.
        const fileReferenceId = `${reference.from.templateFile.id}:${reference.from.read.sourceSpan.end}`;
        if (seenFileReferences.has(fileReferenceId)) {
            continue;
        }
        seenFileReferences.add(fileReferenceId);
        // Expand shorthands like `{bla}` to `{bla: bla()}`.
        const appendText = reference.from.isObjectShorthandExpression
            ? `: ${reference.from.read.name}()`
            : `()`;
        host.replacements.push(new group_replacements.Replacement(reference.from.templateFile, new group_replacements.TextUpdate({
            position: reference.from.read.sourceSpan.end,
            end: reference.from.read.sourceSpan.end,
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
        if (!group_replacements.isHostBindingReference(reference)) {
            continue;
        }
        // Skip references to incompatible inputs.
        if (!host.shouldMigrateReferencesToField(reference.target)) {
            continue;
        }
        const bindingField = reference.from.hostPropertyNode;
        const expressionOffset = bindingField.getStart() + 1; // account for quotes.
        const readEndPos = expressionOffset + reference.from.read.sourceSpan.end;
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
        host.replacements.push(new group_replacements.Replacement(group_replacements.projectFile(bindingField.getSourceFile(), info), new group_replacements.TextUpdate({ position: readEndPos, end: readEndPos, toInsert: appendText })));
    }
}

/**
 * Migrates TypeScript "ts.Type" references. E.g.

 *  - `Partial<MyComp>` will be converted to `UnwrapSignalInputs<Partial<MyComp>>`.
      in Catalyst test files.
 */
function pass9__migrateTypeScriptTypeReferences(host, references, importManager, info) {
    group_replacements.migrateTypeScriptTypeReferences(host, references, importManager, info);
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
    const importManager = new checker.ImportManager({
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

/** Input reasons that cannot be ignored. */
const nonIgnorableInputIncompatibilities = [
    // Outside of scope inputs should not be migrated. E.g. references to inputs in `node_modules/`.
    group_replacements.InputIncompatibilityReason.OutsideOfMigrationScope,
    // Explicitly filtered inputs cannot be skipped via best effort mode.
    group_replacements.InputIncompatibilityReason.SkippedViaConfigFilter,
    // There is no good output for accessor inputs.
    group_replacements.InputIncompatibilityReason.Accessor,
    // There is no good output for such inputs. We can't perform "conversion".
    group_replacements.InputIncompatibilityReason.RequiredInputButNoGoodExplicitTypeExtractable,
];
/** Filters ignorable input incompatibilities when best effort mode is enabled. */
function filterIncompatibilitiesForBestEffortMode(knownInputs) {
    knownInputs.knownInputIds.forEach(({ container: c }) => {
        // All class incompatibilities are "filterable" right now.
        c.incompatible = null;
        for (const [key, i] of c.memberIncompatibility.entries()) {
            if (!nonIgnorableInputIncompatibilities.includes(i.reason)) {
                c.memberIncompatibility.delete(key);
            }
        }
    });
}

/**
 * Tsurge migration for migrating Angular `@Input()` declarations to
 * signal inputs, with support for batch execution.
 */
class SignalInputMigration extends group_replacements.TsurgeComplexMigration {
    constructor(config = {}) {
        super();
        this.config = config;
        this.upgradedAnalysisPhaseResults = null;
    }
    // Override the default ngtsc program creation, to add extra flags.
    createProgram(tsconfigAbsPath, fs) {
        return group_replacements.createNgtscProgram(tsconfigAbsPath, fs, {
            _compilePoisonedComponents: true,
            // We want to migrate non-exported classes too.
            compileNonExportedClasses: true,
            // Always generate as much TCB code as possible.
            // This allows us to check references in templates as much as possible.
            // Note that this may yield more diagnostics, but we are not collecting these anyway.
            strictTemplates: true,
        });
    }
    prepareProgram(baseInfo) {
        const info = super.prepareProgram(baseInfo);
        // Optional filter for testing. Allows for simulation of parallel execution
        // even if some tsconfig's have overlap due to sharing of TS sources.
        // (this is commonly not the case in g3 where deps are `.d.ts` files).
        const limitToRootNamesOnly = process.env['LIMIT_TO_ROOT_NAMES_ONLY'] === '1';
        const filteredSourceFiles = info.sourceFiles.filter((f) => 
        // Optional replacement filter. Allows parallel execution in case
        // some tsconfig's have overlap due to sharing of TS sources.
        // (this is commonly not the case in g3 where deps are `.d.ts` files).
        !limitToRootNamesOnly || info.programAbsoluteRootFileNames.includes(f.fileName));
        return {
            ...info,
            sourceFiles: filteredSourceFiles,
        };
    }
    // Extend the program info with the analysis information we need in every phase.
    prepareAnalysisDeps(info) {
        assert__default["default"](info.ngCompiler !== null, 'Expected `NgCompiler` to be configured.');
        const analysisInfo = {
            ...info,
            ...prepareAnalysisInfo(info.program, info.ngCompiler, info.programAbsoluteRootFileNames),
        };
        return analysisInfo;
    }
    async analyze(info) {
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
            const merged = await this.merge([unitData]);
            const replacements = await this.migrate(merged, info, {
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
        return group_replacements.confirmAsSerializable(unitData);
    }
    async merge(units) {
        return group_replacements.confirmAsSerializable(mergeCompilationUnitData(units));
    }
    async migrate(globalMetadata, info, nonBatchData) {
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
        return result.replacements;
    }
    async stats(globalMetadata) {
        let fullCompilationInputs = 0;
        let sourceInputs = 0;
        let incompatibleInputs = 0;
        const fieldIncompatibleCounts = {};
        const classIncompatibleCounts = {};
        for (const [id, input] of Object.entries(globalMetadata.knownInputs)) {
            fullCompilationInputs++;
            if (input.seenAsSourceInput) {
                sourceInputs++;
            }
            if (input.memberIncompatibility !== null || input.owningClassIncompatibility !== null) {
                incompatibleInputs++;
            }
            if (input.memberIncompatibility !== null) {
                const reasonName = group_replacements.InputIncompatibilityReason[input.memberIncompatibility];
                const key = `input-field-incompatibility-${reasonName}`;
                fieldIncompatibleCounts[key] ??= 0;
                fieldIncompatibleCounts[key]++;
            }
            if (input.owningClassIncompatibility !== null) {
                const reasonName = group_replacements.ClassIncompatibilityReason[input.owningClassIncompatibility];
                const key = `input-owning-class-incompatibility-${reasonName}`;
                classIncompatibleCounts[key] ??= 0;
                classIncompatibleCounts[key]++;
            }
        }
        return {
            counters: {
                fullCompilationInputs,
                sourceInputs,
                incompatibleInputs,
                ...fieldIncompatibleCounts,
                ...classIncompatibleCounts,
            },
        };
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
                reason: group_replacements.InputIncompatibilityReason.SkippedViaConfigFilter,
            });
        }
    }
    result.references = result.references.filter((reference) => {
        if (isInputDescriptor(reference.target)) {
            // Only migrate the reference if the target is NOT skipped.
            return !skippedInputs.has(reference.target.key);
        }
        // Class references may be migrated. This is up to the logic handling
        // the class reference. E.g. it may not migrate if any member is incompatible.
        return true;
    });
}
function createMigrationHost(info, config) {
    return new MigrationHost(/* isMigratingCore */ false, info, config, info.sourceFiles);
}

function migrate(options) {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        if (!buildPaths.length && !testPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run signal input migration.');
        }
        const fs = new group_replacements.DevkitMigrationFilesystem(tree);
        checker.setFileSystem(fs);
        const migration = new SignalInputMigration({
            bestEffortMode: options.bestEffortMode,
            insertTodosForSkippedFields: options.insertTodos,
            shouldMigrateInput: (input) => {
                return (input.file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                    !/(^|\/)node_modules\//.test(input.file.rootRelativePath));
            },
        });
        const analysisPath = fs.resolve(options.analysisDir);
        const unitResults = [];
        const programInfos = [...buildPaths, ...testPaths].map((tsconfigPath) => {
            context.logger.info(`Preparing analysis for: ${tsconfigPath}..`);
            const baseInfo = migration.createProgram(tsconfigPath, fs);
            const info = migration.prepareProgram(baseInfo);
            // Support restricting the analysis to subfolders for larger projects.
            if (analysisPath !== '/') {
                info.sourceFiles = info.sourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                info.fullProgramSourceFiles = info.fullProgramSourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
            }
            return { info, tsconfigPath };
        });
        // Analyze phase. Treat all projects as compilation units as
        // this allows us to support references between those.
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Scanning for inputs: ${tsconfigPath}..`);
            unitResults.push(await migration.analyze(info));
        }
        context.logger.info(``);
        context.logger.info(`Processing analysis data between targets..`);
        context.logger.info(``);
        const merged = await migration.merge(unitResults);
        const replacementsPerFile = new Map();
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Migrating: ${tsconfigPath}..`);
            const replacements = await migration.migrate(merged, info);
            const changesPerFile = group_replacements.groupReplacementsByFile(replacements);
            for (const [file, changes] of changesPerFile) {
                if (!replacementsPerFile.has(file)) {
                    replacementsPerFile.set(file, changes);
                }
            }
        }
        context.logger.info(`Applying changes..`);
        for (const [file, changes] of replacementsPerFile) {
            const recorder = tree.beginUpdate(file);
            for (const c of changes) {
                recorder
                    .remove(c.data.position, c.data.end - c.data.position)
                    .insertLeft(c.data.position, c.data.toInsert);
            }
            tree.commitUpdate(recorder);
        }
        const { counters } = await migration.stats(merged);
        const migratedInputs = counters.sourceInputs - counters.incompatibleInputs;
        context.logger.info('');
        context.logger.info(`Successfully migrated to signal inputs 🎉`);
        context.logger.info(`  -> Migrated ${migratedInputs}/${counters.sourceInputs} inputs.`);
        if (counters.incompatibleInputs > 0 && !options.insertTodos) {
            context.logger.warn(`To see why ${counters.incompatibleInputs} inputs couldn't be migrated`);
            context.logger.warn(`consider re-running with "--insert-todos" or "--best-effort-mode".`);
        }
        if (options.bestEffortMode) {
            context.logger.warn(`You ran with best effort mode. Manually verify all code ` +
                `works as intended, and fix where necessary.`);
        }
    };
}

exports.migrate = migrate;
