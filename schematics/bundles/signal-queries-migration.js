'use strict';
/**
 * @license Angular v19.0.0-next.8+sha-837af44
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
var group_replacements = require('./group_replacements-edfda3b8.js');
require('os');
var ts = require('typescript');
var checker = require('./checker-f67479eb.js');
var program = require('./program-c1191cec.js');
require('path');
var assert = require('assert');
require('@angular-devkit/core');
require('node:path');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);

/**
 * Phase that migrates Angular host binding references to
 * unwrap signals.
 */
function migrateHostBindings(host, references, info) {
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
 * Phase that migrates Angular template references to
 * unwrap signals.
 */
function migrateTemplateReferences(host, references) {
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
 * Extracts the type `T` of expressions referencing `QueryList<T>`.
 */
function extractQueryListType(node) {
    // Initializer variant of `new QueryList<T>()`.
    if (ts__default["default"].isNewExpression(node) &&
        ts__default["default"].isIdentifier(node.expression) &&
        node.expression.text === 'QueryList') {
        return node.typeArguments?.[0];
    }
    // Type variant of `: QueryList<T>`.
    if (ts__default["default"].isTypeReferenceNode(node) &&
        ts__default["default"].isIdentifier(node.typeName) &&
        node.typeName.text === 'QueryList') {
        return node.typeArguments?.[0];
    }
    return undefined;
}

/**
 *  A few notes on changes:
 *
 *    @ViewChild()
 *       --> static is gone!
 *       --> read stays
 *
 *    @ViewChildren()
 *       --> emitDistinctChangesOnly is gone!
 *       --> read stays
 *
 *    @ContentChild()
 *       --> descendants stays
 *       --> read stays
 *       --> static is gone!
 *
 *    @ContentChildren()
 *       --> descendants stays
 *       --> read stays
 *       --> emitDistinctChangesOnly is gone!
 */
function computeReplacementsToMigrateQuery(node, metadata, importManager, info, printer) {
    const sf = node.getSourceFile();
    let newQueryFn = importManager.addImport({
        requestedFile: sf,
        exportModuleSpecifier: '@angular/core',
        exportSymbolName: metadata.kind,
    });
    // The default value for descendants is `true`, except for `ContentChildren`.
    const defaultDescendants = metadata.kind !== 'contentChildren';
    const optionProperties = [];
    const args = [
        metadata.args[0], // Locator.
    ];
    let type = node.type;
    // For multi queries, attempt to unwrap `QueryList` types, or infer the
    // type from the initializer, if possible.
    if (!metadata.queryInfo.first) {
        if (type === undefined && node.initializer !== undefined) {
            type = extractQueryListType(node.initializer);
        }
        else if (type !== undefined) {
            type = extractQueryListType(type);
        }
    }
    if (metadata.queryInfo.read !== null) {
        assert__default["default"](metadata.queryInfo.read instanceof checker.WrappedNodeExpr);
        optionProperties.push(ts__default["default"].factory.createPropertyAssignment('read', metadata.queryInfo.read.node));
    }
    if (metadata.queryInfo.descendants !== defaultDescendants) {
        optionProperties.push(ts__default["default"].factory.createPropertyAssignment('descendants', metadata.queryInfo.descendants ? ts__default["default"].factory.createTrue() : ts__default["default"].factory.createFalse()));
    }
    if (optionProperties.length > 0) {
        args.push(ts__default["default"].factory.createObjectLiteralExpression(optionProperties));
    }
    // TODO: Can we consult, based on references and non-null assertions?
    const isIndicatedAsRequired = node.exclamationToken !== undefined;
    // If the query is required already via some indicators, and this is a "single"
    // query, use the available `.required` method.
    if (isIndicatedAsRequired && metadata.queryInfo.first) {
        newQueryFn = ts__default["default"].factory.createPropertyAccessExpression(newQueryFn, 'required');
    }
    // If this query is still nullable (i.e. not required), attempt to remove
    // explicit `undefined` types if possible.
    if (!isIndicatedAsRequired && type !== undefined && ts__default["default"].isUnionTypeNode(type)) {
        type = group_replacements.removeFromUnionIfPossible(type, (v) => v.kind !== ts__default["default"].SyntaxKind.UndefinedKeyword);
    }
    const locatorType = Array.isArray(metadata.queryInfo.predicate)
        ? null
        : metadata.queryInfo.predicate.expression;
    const readType = metadata.queryInfo.read ?? locatorType;
    // If the type and the read type are matching, we can rely on the TS generic
    // signature rather than repeating e.g. `viewChild<Button>(Button)`.
    if (type !== undefined &&
        readType instanceof checker.WrappedNodeExpr &&
        ts__default["default"].isIdentifier(readType.node) &&
        ts__default["default"].isTypeReferenceNode(type) &&
        ts__default["default"].isIdentifier(type.typeName) &&
        type.typeName.text === readType.node.text) {
        type = undefined;
    }
    const call = ts__default["default"].factory.createCallExpression(newQueryFn, type ? [type] : undefined, args);
    const updated = ts__default["default"].factory.updatePropertyDeclaration(node, [ts__default["default"].factory.createModifier(ts__default["default"].SyntaxKind.ReadonlyKeyword)], node.name, undefined, undefined, call);
    return [
        new group_replacements.Replacement(group_replacements.projectFile(node.getSourceFile(), info), new group_replacements.TextUpdate({
            position: node.getStart(),
            end: node.getEnd(),
            toInsert: printer.printNode(ts__default["default"].EmitHint.Unspecified, updated, sf),
        })),
    ];
}

/**
 * Attempts to get a class field descriptor if the given symbol
 * points to a class field.
 */
function getClassFieldDescriptorForSymbol(symbol, info) {
    if (symbol?.valueDeclaration === undefined ||
        !ts__default["default"].isPropertyDeclaration(symbol.valueDeclaration)) {
        return null;
    }
    const key = getUniqueIDForClassProperty(symbol.valueDeclaration, info);
    if (key === null) {
        return null;
    }
    return {
        key,
        node: symbol.valueDeclaration,
    };
}
/**
 * Gets a unique ID for the given class property.
 *
 * This is useful for matching class fields across compilation units.
 * E.g. a reference may point to the field via `.d.ts`, while the other
 * may reference it via actual `.ts` sources. IDs for the same fields
 * would then match identity.
 */
function getUniqueIDForClassProperty(property, info) {
    if (!ts__default["default"].isClassDeclaration(property.parent) || property.parent.name === undefined) {
        return null;
    }
    const id = group_replacements.projectFile(property.getSourceFile(), info).id.replace(/\.d\.ts$/, '.ts');
    // Note: If a class is nested, there could be an ID clash.
    // This is highly unlikely though, and this is not a problem because
    // in such cases, there is even less chance there are any references to
    // a non-exported classes; in which case, cross-compilation unit references
    // likely can't exist anyway.
    return `${id}-${property.parent.name.text}-${property.name.getText()}`;
}

/**
 * Determines if the given node refers to a decorator-based query, and
 * returns its resolved metadata if possible.
 */
function extractSourceQueryDefinition(node, reflector, evaluator, info) {
    if (!ts__default["default"].isPropertyDeclaration(node) ||
        !ts__default["default"].isClassDeclaration(node.parent) ||
        node.parent.name === undefined ||
        !ts__default["default"].isIdentifier(node.name)) {
        return null;
    }
    const decorators = reflector.getDecoratorsOfDeclaration(node) ?? [];
    const ngDecorators = checker.getAngularDecorators(decorators, program.queryDecoratorNames, /* isCore */ false);
    if (ngDecorators.length === 0) {
        return null;
    }
    const decorator = ngDecorators[0];
    const id = getUniqueIDForClassProperty(node, info);
    if (id === null) {
        return null;
    }
    let kind;
    if (decorator.name === 'ViewChild') {
        kind = 'viewChild';
    }
    else if (decorator.name === 'ViewChildren') {
        kind = 'viewChildren';
    }
    else if (decorator.name === 'ContentChild') {
        kind = 'contentChild';
    }
    else if (decorator.name === 'ContentChildren') {
        kind = 'contentChildren';
    }
    else {
        throw new Error('Unexpected query decorator detected.');
    }
    const queryInfo = program.extractDecoratorQueryMetadata(node, decorator.name, decorator.args ?? [], node.name.text, reflector, evaluator);
    return {
        id,
        kind,
        args: decorator.args ?? [],
        queryInfo,
        node,
    };
}

class KnownQueries {
    constructor(info, globalMetadata) {
        this.info = info;
        this.globalMetadata = globalMetadata;
        this.classToQueryFields = new Map();
        this.knownQueryIDs = new Set();
    }
    isFieldIncompatible(descriptor) {
        return this.globalMetadata.problematicQueries[descriptor.key] !== undefined;
    }
    markFieldIncompatible(field) {
        this.globalMetadata.problematicQueries[field.key] = true;
    }
    markClassIncompatible(node) {
        this.classToQueryFields.get(node)?.forEach((f) => {
            this.globalMetadata.problematicQueries[f.key] = true;
        });
    }
    registerQueryField(queryField, id) {
        if (!this.classToQueryFields.has(queryField.parent)) {
            this.classToQueryFields.set(queryField.parent, []);
        }
        this.classToQueryFields.get(queryField.parent).push({
            key: id,
            node: queryField,
        });
        this.knownQueryIDs.add(id);
    }
    attemptRetrieveDescriptorFromSymbol(symbol) {
        const descriptor = getClassFieldDescriptorForSymbol(symbol, this.info);
        if (descriptor !== null && this.knownQueryIDs.has(descriptor.key)) {
            return descriptor;
        }
        return null;
    }
    shouldTrackClassReference(clazz) {
        return this.classToQueryFields.has(clazz);
    }
    getQueryFieldsOfClass(clazz) {
        return this.classToQueryFields.get(clazz);
    }
    getAllClassesWithQueries() {
        return Array.from(this.classToQueryFields.keys()).filter((c) => ts__default["default"].isClassDeclaration(c));
    }
    captureKnownFieldInheritanceRelationship(derived, parent) {
        if (this.isFieldIncompatible(parent) || this.isFieldIncompatible(derived)) {
            this.markFieldIncompatible(parent);
            this.markFieldIncompatible(derived);
        }
    }
    captureUnknownDerivedField(field) {
        this.markFieldIncompatible(field);
    }
    captureUnknownParentField(field) {
        this.markFieldIncompatible(field);
    }
}

/** Converts an initializer query API name to its decorator-equivalent. */
function queryFunctionNameToDecorator(name) {
    if (name === 'viewChild') {
        return 'ViewChild';
    }
    else if (name === 'viewChildren') {
        return 'ViewChildren';
    }
    else if (name === 'contentChild') {
        return 'ContentChild';
    }
    else if (name === 'contentChildren') {
        return 'ContentChildren';
    }
    throw new Error(`Unexpected query function name: ${name}`);
}

/**
 * Gets whether the given field is accessed via the
 * given reference.
 *
 * E.g. whether `<my-read>.toArray` is detected.
 */
function checkTsReferenceAccessesField(ref, fieldName) {
    const accessNode = group_replacements.traverseAccess(ref.from.node);
    // Check if the reference is part of a property access.
    if (!ts__default["default"].isPropertyAccessExpression(accessNode.parent) ||
        !ts__default["default"].isIdentifier(accessNode.parent.name)) {
        return null;
    }
    // Check if the reference is refers to the given field name.
    if (accessNode.parent.name.text !== fieldName) {
        return null;
    }
    return accessNode.parent;
}
/**
 * Gets whether the given read is used to access
 * the specified field.
 *
 * E.g. whether `<my-read>.toArray` is detected.
 */
function checkNonTsReferenceAccessesField(ref, fieldName) {
    const readFromPath = ref.from.readAstPath.at(-1);
    const parentRead = ref.from.readAstPath.at(-2);
    if (ref.from.read !== readFromPath) {
        return null;
    }
    if (!(parentRead instanceof checker.PropertyRead) || parentRead.name !== fieldName) {
        return null;
    }
    return parentRead;
}
/**
 * Gets whether the given reference is accessed to call the
 * specified function on it.
 *
 * E.g. whether `<my-read>.toArray()` is detected.
 */
function checkTsReferenceCallsField(ref, fieldName) {
    const propertyAccess = checkTsReferenceAccessesField(ref, fieldName);
    if (propertyAccess === null) {
        return null;
    }
    if (ts__default["default"].isCallExpression(propertyAccess.parent) &&
        propertyAccess.parent.expression === propertyAccess) {
        return propertyAccess.parent;
    }
    return null;
}
/**
 * Gets whether the given reference is accessed to call the
 * specified function on it.
 *
 * E.g. whether `<my-read>.toArray()` is detected.
 */
function checkNonTsReferenceCallsField(ref, fieldName) {
    const propertyAccess = checkNonTsReferenceAccessesField(ref, fieldName);
    if (propertyAccess === null) {
        return null;
    }
    const accessIdx = ref.from.readAstPath.indexOf(propertyAccess);
    if (accessIdx === -1) {
        return null;
    }
    const potentialCall = ref.from.readAstPath[accessIdx - 1];
    if (potentialCall === undefined || !(potentialCall instanceof checker.Call)) {
        return null;
    }
    return potentialCall;
}

function removeQueryListToArrayCall(ref, info, globalMetadata, replacements) {
    if (!group_replacements.isHostBindingReference(ref) && !group_replacements.isTemplateReference(ref) && !group_replacements.isTsReference(ref)) {
        return;
    }
    if (!globalMetadata.knownQueryFields[ref.target.key]?.isMulti) {
        return;
    }
    // TS references.
    if (group_replacements.isTsReference(ref)) {
        const toArrayCallExpr = checkTsReferenceCallsField(ref, 'toArray');
        if (toArrayCallExpr === null) {
            return;
        }
        const toArrayExpr = toArrayCallExpr.expression;
        replacements.push(new group_replacements.Replacement(group_replacements.projectFile(toArrayExpr.getSourceFile(), info), new group_replacements.TextUpdate({
            // Delete from expression end to call end. E.g. `.toArray(<..>)`.
            position: toArrayExpr.expression.getEnd(),
            end: toArrayCallExpr.getEnd(),
            toInsert: '',
        })));
        return;
    }
    // Template and host binding references.
    const callExpr = checkNonTsReferenceCallsField(ref, 'toArray');
    if (callExpr === null) {
        return;
    }
    const file = group_replacements.isHostBindingReference(ref) ? ref.from.file : ref.from.templateFile;
    const offset = group_replacements.isHostBindingReference(ref) ? ref.from.hostPropertyNode.getStart() + 1 : 0;
    replacements.push(new group_replacements.Replacement(file, new group_replacements.TextUpdate({
        // Delete from expression end to call end. E.g. `.toArray(<..>)`.
        position: offset + callExpr.receiver.receiver.sourceSpan.end,
        end: offset + callExpr.sourceSpan.end,
        toInsert: '',
    })));
}

function replaceQueryListGetCall(ref, info, globalMetadata, replacements) {
    if (!group_replacements.isHostBindingReference(ref) && !group_replacements.isTemplateReference(ref) && !group_replacements.isTsReference(ref)) {
        return;
    }
    if (!globalMetadata.knownQueryFields[ref.target.key]?.isMulti) {
        return;
    }
    if (group_replacements.isTsReference(ref)) {
        const getCallExpr = checkTsReferenceCallsField(ref, 'get');
        if (getCallExpr === null) {
            return;
        }
        const getExpr = getCallExpr.expression;
        replacements.push(new group_replacements.Replacement(group_replacements.projectFile(getExpr.getSourceFile(), info), new group_replacements.TextUpdate({
            position: getExpr.name.getStart(),
            end: getExpr.name.getEnd(),
            toInsert: 'at',
        })));
        return;
    }
    // Template and host binding references.
    const callExpr = checkNonTsReferenceCallsField(ref, 'get');
    if (callExpr === null) {
        return;
    }
    const file = group_replacements.isHostBindingReference(ref) ? ref.from.file : ref.from.templateFile;
    const offset = group_replacements.isHostBindingReference(ref) ? ref.from.hostPropertyNode.getStart() + 1 : 0;
    replacements.push(new group_replacements.Replacement(file, new group_replacements.TextUpdate({
        position: offset + callExpr.receiver.nameSpan.start,
        end: offset + callExpr.receiver.nameSpan.end,
        toInsert: 'at',
    })));
}

const problematicQueryListMethods = [
    'dirty',
    'changes',
    'setDirty',
    'reset',
    'notifyOnChanges',
    'destroy',
];
function checkForIncompatibleQueryListAccesses(ref, result) {
    if (group_replacements.isTsReference(ref)) {
        for (const problematicFn of problematicQueryListMethods) {
            const access = checkTsReferenceAccessesField(ref, problematicFn);
            if (access !== null) {
                result.potentialProblematicReferenceForMultiQueries[ref.target.key] = true;
                return;
            }
        }
    }
    if (group_replacements.isHostBindingReference(ref) || group_replacements.isTemplateReference(ref)) {
        for (const problematicFn of problematicQueryListMethods) {
            const access = checkNonTsReferenceAccessesField(ref, problematicFn);
            if (access !== null) {
                result.potentialProblematicReferenceForMultiQueries[ref.target.key] = true;
                return;
            }
        }
    }
}

const mapping = new Map([
    ['first', 'at(0)!'],
    ['last', 'at(-1)!'],
]);
function replaceQueryListFirstAndLastReferences(ref, info, globalMetadata, replacements) {
    if (!group_replacements.isHostBindingReference(ref) && !group_replacements.isTemplateReference(ref) && !group_replacements.isTsReference(ref)) {
        return;
    }
    if (!globalMetadata.knownQueryFields[ref.target.key]?.isMulti) {
        return;
    }
    if (group_replacements.isTsReference(ref)) {
        const expr = checkTsReferenceAccessesField(ref, 'first') ?? checkTsReferenceAccessesField(ref, 'last');
        if (expr === null) {
            return;
        }
        replacements.push(new group_replacements.Replacement(group_replacements.projectFile(expr.getSourceFile(), info), new group_replacements.TextUpdate({
            position: expr.name.getStart(),
            end: expr.name.getEnd(),
            toInsert: mapping.get(expr.name.text),
        })));
        return;
    }
    // Template and host binding references.
    const expr = checkNonTsReferenceAccessesField(ref, 'first') ?? checkNonTsReferenceAccessesField(ref, 'last');
    if (expr === null) {
        return;
    }
    const file = group_replacements.isHostBindingReference(ref) ? ref.from.file : ref.from.templateFile;
    const offset = group_replacements.isHostBindingReference(ref) ? ref.from.hostPropertyNode.getStart() + 1 : 0;
    replacements.push(new group_replacements.Replacement(file, new group_replacements.TextUpdate({
        position: offset + expr.nameSpan.start,
        end: offset + expr.nameSpan.end,
        toInsert: mapping.get(expr.name),
    })));
}

class SignalQueriesMigration extends group_replacements.TsurgeComplexMigration {
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        assert__default["default"](info.ngCompiler !== null, 'Expected queries migration to have an Angular program.');
        // TODO: This stage for this migration doesn't necessarily need a full
        // compilation unit program.
        // Pre-Analyze the program and get access to the template type checker.
        const { templateTypeChecker } = info.ngCompiler['ensureAnalyzed']();
        const { sourceFiles, program: program$1 } = info;
        const checker$1 = program$1.getTypeChecker();
        const reflector = new checker.TypeScriptReflectionHost(checker$1);
        const evaluator = new program.PartialEvaluator(reflector, checker$1, null);
        const res = {
            knownQueryFields: {},
            potentialProblematicQueries: {},
            potentialProblematicReferenceForMultiQueries: {},
        };
        const groupedAstVisitor = new group_replacements.GroupedTsAstVisitor(sourceFiles);
        const referenceResult = { references: [] };
        const findQueryDefinitionsVisitor = (node) => {
            const extractedQuery = extractSourceQueryDefinition(node, reflector, evaluator, info);
            if (extractedQuery !== null) {
                res.knownQueryFields[extractedQuery.id] = {
                    fieldName: extractedQuery.queryInfo.propertyName,
                    isMulti: extractedQuery.queryInfo.first === false,
                };
            }
        };
        groupedAstVisitor.register(findQueryDefinitionsVisitor);
        groupedAstVisitor.register(group_replacements.createFindAllSourceFileReferencesVisitor(info, checker$1, reflector, info.ngCompiler['resourceManager'], evaluator, templateTypeChecker, 
        // Eager, rather expensive tracking of all references.
        // We don't know yet if something refers to a different query or not, so we
        // eagerly detect such and later filter those problematic references that
        // turned out to refer to queries.
        // TODO: Consider skipping this extra work when running in non-batch mode.
        // TODO: Also consider skipping if we know this query cannot be part.
        {
            shouldTrackClassReference: (_class) => false,
            attemptRetrieveDescriptorFromSymbol: (s) => getClassFieldDescriptorForSymbol(s, info),
        }, null, referenceResult).visitor);
        groupedAstVisitor.execute();
        // Determine incompatible queries based on problematic references
        // we saw in TS code, templates or host bindings.
        for (const ref of referenceResult.references) {
            if (group_replacements.isTsReference(ref) && ref.from.isWrite) {
                res.potentialProblematicQueries[ref.target.key] = true;
            }
            if ((group_replacements.isTemplateReference(ref) || group_replacements.isHostBindingReference(ref)) && ref.from.isWrite) {
                res.potentialProblematicQueries[ref.target.key] = true;
            }
            // TODO: Remove this when we support signal narrowing in templates.
            // https://github.com/angular/angular/pull/55456.
            if (group_replacements.isTemplateReference(ref) && ref.from.isLikelyPartOfNarrowing) {
                res.potentialProblematicQueries[ref.target.key] = true;
            }
            // Check for other incompatible query list accesses.
            checkForIncompatibleQueryListAccesses(ref, res);
        }
        return group_replacements.confirmAsSerializable(res);
    }
    async merge(units) {
        const merged = {
            knownQueryFields: {},
            problematicQueries: {},
        };
        for (const unit of units) {
            for (const [id, value] of Object.entries(unit.knownQueryFields)) {
                merged.knownQueryFields[id] = value;
            }
            for (const id of Object.keys(unit.potentialProblematicQueries)) {
                merged.problematicQueries[id] = true;
            }
        }
        for (const unit of units) {
            for (const id of Object.keys(unit.potentialProblematicReferenceForMultiQueries)) {
                if (merged.knownQueryFields[id]?.isMulti) {
                    merged.problematicQueries[id] = true;
                }
            }
        }
        return group_replacements.confirmAsSerializable(merged);
    }
    async migrate(globalMetadata, info) {
        assert__default["default"](info.ngCompiler !== null, 'Expected queries migration to have an Angular program.');
        // Pre-Analyze the program and get access to the template type checker.
        const { templateTypeChecker, metaReader } = await info.ngCompiler['ensureAnalyzed']();
        const { program: program$1, sourceFiles } = info;
        const checker$1 = program$1.getTypeChecker();
        const reflector = new checker.TypeScriptReflectionHost(checker$1);
        const evaluator = new program.PartialEvaluator(reflector, checker$1, null);
        const replacements = [];
        const importManager = new checker.ImportManager();
        const printer = ts__default["default"].createPrinter();
        const filesWithMigratedQueries = new Map();
        const filesWithIncompleteMigration = new Map();
        const filesWithUnrelatedQueryListImports = new WeakSet();
        const knownQueries = new KnownQueries(info, globalMetadata);
        const referenceResult = { references: [] };
        const sourceQueries = [];
        const isMigratedQuery = (descriptor) => globalMetadata.knownQueryFields[descriptor.key] !== undefined &&
            globalMetadata.problematicQueries[descriptor.key] === undefined &&
            (this.config.shouldMigrateQuery === undefined ||
                this.config.shouldMigrateQuery(descriptor, group_replacements.projectFile(descriptor.node.getSourceFile(), info)));
        // Detect all queries in this unit.
        const queryWholeProgramVisitor = (node) => {
            // Detect all SOURCE queries and migrate them, if possible.
            const extractedQuery = extractSourceQueryDefinition(node, reflector, evaluator, info);
            if (extractedQuery !== null) {
                knownQueries.registerQueryField(extractedQuery.node, extractedQuery.id);
                sourceQueries.push(extractedQuery);
                return;
            }
            // Detect OTHER queries, inside `.d.ts`. Needed for reference resolution below.
            if (ts__default["default"].isPropertyDeclaration(node)) {
                const classFieldID = getUniqueIDForClassProperty(node, info);
                if (classFieldID !== null && globalMetadata.knownQueryFields[classFieldID] !== undefined) {
                    knownQueries.registerQueryField(node, classFieldID);
                    return;
                }
            }
            // Detect potential usages of `QueryList` outside of queries or imports.
            // Those prevent us from removing the import later.
            if (ts__default["default"].isIdentifier(node) &&
                node.text === 'QueryList' &&
                ts__default["default"].findAncestor(node, ts__default["default"].isImportDeclaration) === undefined) {
                filesWithUnrelatedQueryListImports.add(node.getSourceFile());
            }
            ts__default["default"].forEachChild(node, queryWholeProgramVisitor);
        };
        for (const sf of info.fullProgramSourceFiles) {
            ts__default["default"].forEachChild(sf, queryWholeProgramVisitor);
        }
        // Set of all queries in the program. Useful for speeding up reference
        // lookups below.
        const fieldNamesToConsiderForReferenceLookup = new Set(Object.values(globalMetadata.knownQueryFields).map((f) => f.fieldName));
        // Find all references.
        const groupedAstVisitor = new group_replacements.GroupedTsAstVisitor(sourceFiles);
        groupedAstVisitor.register(group_replacements.createFindAllSourceFileReferencesVisitor(info, checker$1, reflector, info.ngCompiler['resourceManager'], evaluator, templateTypeChecker, knownQueries, fieldNamesToConsiderForReferenceLookup, referenceResult).visitor);
        const inheritanceGraph = new group_replacements.InheritanceGraph(checker$1).expensivePopulate(info.sourceFiles);
        group_replacements.checkIncompatiblePatterns(inheritanceGraph, checker$1, groupedAstVisitor, knownQueries, () => knownQueries.getAllClassesWithQueries());
        groupedAstVisitor.execute();
        // Check inheritance.
        group_replacements.checkInheritanceOfKnownFields(inheritanceGraph, metaReader, knownQueries, {
            getFieldsForClass: (n) => knownQueries.getQueryFieldsOfClass(n) ?? [],
            isClassWithKnownFields: (clazz) => knownQueries.getQueryFieldsOfClass(clazz) !== undefined,
        });
        // Migrate declarations.
        for (const extractedQuery of sourceQueries) {
            const node = extractedQuery.node;
            const sf = node.getSourceFile();
            const descriptor = { key: extractedQuery.id, node: extractedQuery.node };
            if (!isMigratedQuery(descriptor)) {
                updateFileState(filesWithIncompleteMigration, sf, extractedQuery.kind);
                continue;
            }
            updateFileState(filesWithMigratedQueries, sf, extractedQuery.kind);
            replacements.push(...computeReplacementsToMigrateQuery(node, extractedQuery, importManager, info, printer));
        }
        // Migrate references.
        const referenceMigrationHost = {
            printer,
            replacements,
            shouldMigrateReferencesToField: (field) => isMigratedQuery(field),
            shouldMigrateReferencesToClass: (clazz) => !!knownQueries.getQueryFieldsOfClass(clazz)?.some((q) => isMigratedQuery(q)),
        };
        group_replacements.migrateTypeScriptReferences(referenceMigrationHost, referenceResult.references, checker$1, info);
        migrateTemplateReferences(referenceMigrationHost, referenceResult.references);
        migrateHostBindings(referenceMigrationHost, referenceResult.references, info);
        group_replacements.migrateTypeScriptTypeReferences(referenceMigrationHost, referenceResult.references, importManager, info);
        // Fix problematic calls, like `QueryList#toArray`, or `QueryList#get`.
        for (const ref of referenceResult.references) {
            removeQueryListToArrayCall(ref, info, globalMetadata, replacements);
            replaceQueryListGetCall(ref, info, globalMetadata, replacements);
            replaceQueryListFirstAndLastReferences(ref, info, globalMetadata, replacements);
        }
        // Remove imports if possible.
        for (const [file, types] of filesWithMigratedQueries) {
            let seenIncompatibleMultiQuery = false;
            for (const type of types) {
                const incompatibleQueryTypesForFile = filesWithIncompleteMigration.get(file);
                // Query type is fully migrated. No incompatible queries in file.
                if (!incompatibleQueryTypesForFile?.has(type)) {
                    importManager.removeImport(file, queryFunctionNameToDecorator(type), '@angular/core');
                }
                else if (type === 'viewChildren' || type === 'contentChildren') {
                    seenIncompatibleMultiQuery = true;
                }
            }
            if (!seenIncompatibleMultiQuery && !filesWithUnrelatedQueryListImports.has(file)) {
                importManager.removeImport(file, 'QueryList', '@angular/core');
            }
        }
        group_replacements.applyImportManagerChanges(importManager, replacements, sourceFiles, info);
        return replacements;
    }
    async stats(globalMetadata) {
        // TODO: Add statistics.
        return { counters: {} };
    }
}
/**
 * Updates the given map to capture the given query type.
 * The map may track migrated queries in a file, or query types
 * that couldn't be migrated.
 */
function updateFileState(stateMap, node, queryType) {
    const file = node.getSourceFile();
    if (!stateMap.has(file)) {
        stateMap.set(file, new Set());
    }
    stateMap.get(file).add(queryType);
}

function migrate(options) {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        if (!buildPaths.length && !testPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run signal input migration.');
        }
        const fs = new group_replacements.DevkitMigrationFilesystem(tree);
        checker.setFileSystem(fs);
        const migration = new SignalQueriesMigration({
            shouldMigrateQuery: (_query, file) => {
                return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                    !/(^|\/)node_modules\//.test(file.rootRelativePath));
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
            context.logger.info(`Scanning for queries: ${tsconfigPath}..`);
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
        context.logger.info('');
        context.logger.info(`Successfully migrated to signal queries 🎉`);
    };
}

exports.migrate = migrate;
