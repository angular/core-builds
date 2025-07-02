'use strict';
/**
 * @license Angular v20.1.0-rc.0+sha-d5210f0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var checker = require('./checker-B80_1LIK.cjs');
var ts = require('typescript');
require('os');
var index$1 = require('./index-DG1xP_U-.cjs');
require('path');
var project_paths = require('./project_paths-19bdZDf8.cjs');
var apply_import_manager = require('./apply_import_manager-DZjixWWC.cjs');
var migrate_ts_type_references = require('./migrate_ts_type_references-Dz0klkwR.cjs');
var assert = require('assert');
var index = require('./index-DMnrzs3G.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-CDVxT6Ov.cjs');
require('./leading_space-D9nQ8UQC.cjs');

/**
 * Phase that migrates Angular host binding references to
 * unwrap signals.
 */
function migrateHostBindings(host, references, info) {
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
        host.replacements.push(new project_paths.Replacement(project_paths.projectFile(bindingField.getSourceFile(), info), new project_paths.TextUpdate({ position: readEndPos, end: readEndPos, toInsert: appendText })));
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
        if (!index.isTemplateReference(reference)) {
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
        host.replacements.push(new project_paths.Replacement(reference.from.templateFile, new project_paths.TextUpdate({
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
    if (ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'QueryList') {
        return node.typeArguments?.[0];
    }
    // Type variant of `: QueryList<T>`.
    if (ts.isTypeReferenceNode(node) &&
        ts.isIdentifier(node.typeName) &&
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
function computeReplacementsToMigrateQuery(node, metadata, importManager, info, printer, options, checker$1) {
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
        assert(metadata.queryInfo.read instanceof checker.WrappedNodeExpr);
        optionProperties.push(ts.factory.createPropertyAssignment('read', metadata.queryInfo.read.node));
    }
    if (metadata.queryInfo.descendants !== defaultDescendants) {
        optionProperties.push(ts.factory.createPropertyAssignment('descendants', metadata.queryInfo.descendants ? ts.factory.createTrue() : ts.factory.createFalse()));
    }
    if (optionProperties.length > 0) {
        args.push(ts.factory.createObjectLiteralExpression(optionProperties));
    }
    const strictNullChecksEnabled = options.strict === true || options.strictNullChecks === true;
    const strictPropertyInitialization = options.strict === true || options.strictPropertyInitialization === true;
    let isRequired = node.exclamationToken !== undefined;
    // If we come across an application with strict null checks enabled, but strict
    // property initialization is disabled, there are two options:
    //   - Either the query is already typed to include `undefined` explicitly,
    //     in which case an option query makes sense.
    //   - OR, the query is not typed to include `undefined`. In which case, the query
    //     should be marked as required to not break the app. The user-code throughout
    //     the application (given strict null checks) already assumes non-nullable!
    if (strictNullChecksEnabled &&
        !strictPropertyInitialization &&
        node.initializer === undefined &&
        node.questionToken === undefined &&
        type !== undefined &&
        !checker$1.isTypeAssignableTo(checker$1.getUndefinedType(), checker$1.getTypeFromTypeNode(type))) {
        isRequired = true;
    }
    if (isRequired && metadata.queryInfo.first) {
        // If the query is required already via some indicators, and this is a "single"
        // query, use the available `.required` method.
        newQueryFn = ts.factory.createPropertyAccessExpression(newQueryFn, 'required');
    }
    // If this query is still nullable (i.e. not required), attempt to remove
    // explicit `undefined` types if possible.
    if (!isRequired && type !== undefined && ts.isUnionTypeNode(type)) {
        type = migrate_ts_type_references.removeFromUnionIfPossible(type, (v) => v.kind !== ts.SyntaxKind.UndefinedKeyword);
    }
    let locatorType = Array.isArray(metadata.queryInfo.predicate)
        ? null
        : metadata.queryInfo.predicate.expression;
    let resolvedReadType = metadata.queryInfo.read ?? locatorType;
    // If the original property type and the read type are matching, we can rely
    // on the TS inference, instead of repeating types, like in `viewChild<Button>(Button)`.
    if (type !== undefined &&
        resolvedReadType instanceof checker.WrappedNodeExpr &&
        ts.isIdentifier(resolvedReadType.node) &&
        ts.isTypeReferenceNode(type) &&
        ts.isIdentifier(type.typeName) &&
        type.typeName.text === resolvedReadType.node.text) {
        locatorType = null;
    }
    const call = ts.factory.createCallExpression(newQueryFn, 
    // If there is no resolved `ReadT` (e.g. string predicate), we use the
    // original type explicitly as generic. Otherwise, query API is smart
    // enough to always infer.
    resolvedReadType === null && type !== undefined ? [type] : undefined, args);
    const accessibilityModifier = getAccessibilityModifier(node);
    let modifiers = [
        ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword),
    ];
    if (accessibilityModifier) {
        modifiers = [accessibilityModifier, ...modifiers];
    }
    const updated = ts.factory.createPropertyDeclaration(modifiers, node.name, undefined, undefined, call);
    return [
        new project_paths.Replacement(project_paths.projectFile(node.getSourceFile(), info), new project_paths.TextUpdate({
            position: node.getStart(),
            end: node.getEnd(),
            toInsert: printer.printNode(ts.EmitHint.Unspecified, updated, sf),
        })),
    ];
}
function getAccessibilityModifier(node) {
    return node.modifiers?.find((mod) => mod.kind === ts.SyntaxKind.PublicKeyword ||
        mod.kind === ts.SyntaxKind.PrivateKeyword ||
        mod.kind === ts.SyntaxKind.ProtectedKeyword);
}

/**
 * Attempts to get a class field descriptor if the given symbol
 * points to a class field.
 */
function getClassFieldDescriptorForSymbol(symbol, info) {
    if (symbol?.valueDeclaration === undefined ||
        !ts.isPropertyDeclaration(symbol.valueDeclaration)) {
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
    if (!ts.isClassDeclaration(property.parent) || property.parent.name === undefined) {
        return null;
    }
    if (property.name === undefined) {
        return null;
    }
    const id = project_paths.projectFile(property.getSourceFile(), info).id.replace(/\.d\.ts$/, '.ts');
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
    if ((!ts.isPropertyDeclaration(node) && !ts.isAccessor(node)) ||
        !ts.isClassDeclaration(node.parent) ||
        node.parent.name === undefined ||
        !ts.isIdentifier(node.name)) {
        return null;
    }
    const decorators = reflector.getDecoratorsOfDeclaration(node) ?? [];
    const ngDecorators = checker.getAngularDecorators(decorators, checker.queryDecoratorNames, /* isCore */ false);
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
    let queryInfo = null;
    try {
        queryInfo = checker.extractDecoratorQueryMetadata(node, decorator.name, decorator.args ?? [], node.name.text, reflector, evaluator);
    }
    catch (e) {
        if (!(e instanceof checker.FatalDiagnosticError)) {
            throw e;
        }
        console.error(`Skipping query: ${e.node.getSourceFile().fileName}: ${e.toString()}`);
        return null;
    }
    return {
        id,
        kind,
        args: decorator.args ?? [],
        queryInfo,
        node: node,
        fieldDecorators: decorators,
    };
}

function markFieldIncompatibleInMetadata(data, id, reason) {
    const existing = data[id];
    if (existing === undefined) {
        data[id] = {
            fieldReason: reason,
            classReason: null,
        };
    }
    else if (existing.fieldReason === null) {
        existing.fieldReason = reason;
    }
    else {
        existing.fieldReason = migrate_ts_type_references.pickFieldIncompatibility({ reason, context: null }, { reason: existing.fieldReason, context: null }).reason;
    }
}
function filterBestEffortIncompatibilities(knownQueries) {
    for (const query of Object.values(knownQueries.globalMetadata.problematicQueries)) {
        if (query.fieldReason !== null &&
            !migrate_ts_type_references.nonIgnorableFieldIncompatibilities.includes(query.fieldReason)) {
            query.fieldReason = null;
        }
    }
}

class KnownQueries {
    info;
    config;
    globalMetadata;
    classToQueryFields = new Map();
    knownQueryIDs = new Map();
    constructor(info, config, globalMetadata) {
        this.info = info;
        this.config = config;
        this.globalMetadata = globalMetadata;
    }
    isFieldIncompatible(descriptor) {
        return this.getIncompatibilityForField(descriptor) !== null;
    }
    markFieldIncompatible(field, incompatibility) {
        markFieldIncompatibleInMetadata(this.globalMetadata.problematicQueries, field.key, incompatibility.reason);
    }
    markClassIncompatible(node, reason) {
        this.classToQueryFields.get(node)?.forEach((f) => {
            this.globalMetadata.problematicQueries[f.key] ??= { classReason: null, fieldReason: null };
            this.globalMetadata.problematicQueries[f.key].classReason = reason;
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
        this.knownQueryIDs.set(id, { key: id, node: queryField });
        const descriptor = { key: id, node: queryField };
        const file = project_paths.projectFile(queryField.getSourceFile(), this.info);
        if (this.config.shouldMigrateQuery !== undefined &&
            !this.config.shouldMigrateQuery(descriptor, file)) {
            this.markFieldIncompatible(descriptor, {
                context: null,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.SkippedViaConfigFilter,
            });
        }
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
        return Array.from(this.classToQueryFields.keys()).filter((c) => ts.isClassDeclaration(c));
    }
    captureKnownFieldInheritanceRelationship(derived, parent) {
        // Note: The edge problematic pattern recognition is not as good as the one
        // we have in the signal input migration. That is because we couldn't trivially
        // build up an inheritance graph during analyze phase where we DON'T know what
        // fields refer to queries. Usually we'd use the graph to smartly propagate
        // incompatibilities using topological sort. This doesn't work here and is
        // unnecessarily complex, so we try our best at detecting direct edge
        // incompatibilities (which are quite order dependent).
        if (this.isFieldIncompatible(parent) && !this.isFieldIncompatible(derived)) {
            this.markFieldIncompatible(derived, {
                context: null,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.ParentIsIncompatible,
            });
            return;
        }
        if (this.isFieldIncompatible(derived) && !this.isFieldIncompatible(parent)) {
            this.markFieldIncompatible(parent, {
                context: null,
                reason: migrate_ts_type_references.FieldIncompatibilityReason.DerivedIsIncompatible,
            });
        }
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
    getIncompatibilityForField(descriptor) {
        const problematicInfo = this.globalMetadata.problematicQueries[descriptor.key];
        if (problematicInfo === undefined) {
            return null;
        }
        if (problematicInfo.fieldReason !== null) {
            return { context: null, reason: problematicInfo.fieldReason };
        }
        if (problematicInfo.classReason !== null) {
            return problematicInfo.classReason;
        }
        return null;
    }
    getIncompatibilityTextForField(field) {
        const incompatibilityInfo = this.globalMetadata.problematicQueries[field.key];
        if (incompatibilityInfo.fieldReason !== null) {
            return migrate_ts_type_references.getMessageForFieldIncompatibility(incompatibilityInfo.fieldReason, {
                single: 'query',
                plural: 'queries',
            });
        }
        if (incompatibilityInfo.classReason !== null) {
            return migrate_ts_type_references.getMessageForClassIncompatibility(incompatibilityInfo.classReason, {
                single: 'query',
                plural: 'queries',
            });
        }
        return null;
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
    const accessNode = index.traverseAccess(ref.from.node);
    // Check if the reference is part of a property access.
    if (!ts.isPropertyAccessExpression(accessNode.parent) ||
        !ts.isIdentifier(accessNode.parent.name)) {
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
    if (ts.isCallExpression(propertyAccess.parent) &&
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

function removeQueryListToArrayCall(ref, info, globalMetadata, knownQueries, replacements) {
    if (!index.isHostBindingReference(ref) && !index.isTemplateReference(ref) && !index.isTsReference(ref)) {
        return;
    }
    if (knownQueries.isFieldIncompatible(ref.target)) {
        return;
    }
    if (!globalMetadata.knownQueryFields[ref.target.key]?.isMulti) {
        return;
    }
    // TS references.
    if (index.isTsReference(ref)) {
        const toArrayCallExpr = checkTsReferenceCallsField(ref, 'toArray');
        if (toArrayCallExpr === null) {
            return;
        }
        const toArrayExpr = toArrayCallExpr.expression;
        replacements.push(new project_paths.Replacement(project_paths.projectFile(toArrayExpr.getSourceFile(), info), new project_paths.TextUpdate({
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
    const file = index.isHostBindingReference(ref) ? ref.from.file : ref.from.templateFile;
    const offset = index.isHostBindingReference(ref) ? ref.from.hostPropertyNode.getStart() + 1 : 0;
    replacements.push(new project_paths.Replacement(file, new project_paths.TextUpdate({
        // Delete from expression end to call end. E.g. `.toArray(<..>)`.
        position: offset + callExpr.receiver.receiver.sourceSpan.end,
        end: offset + callExpr.sourceSpan.end,
        toInsert: '',
    })));
}

function replaceQueryListGetCall(ref, info, globalMetadata, knownQueries, replacements) {
    if (!index.isHostBindingReference(ref) && !index.isTemplateReference(ref) && !index.isTsReference(ref)) {
        return;
    }
    if (knownQueries.isFieldIncompatible(ref.target)) {
        return;
    }
    if (!globalMetadata.knownQueryFields[ref.target.key]?.isMulti) {
        return;
    }
    if (index.isTsReference(ref)) {
        const getCallExpr = checkTsReferenceCallsField(ref, 'get');
        if (getCallExpr === null) {
            return;
        }
        const getExpr = getCallExpr.expression;
        replacements.push(new project_paths.Replacement(project_paths.projectFile(getExpr.getSourceFile(), info), new project_paths.TextUpdate({
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
    const file = index.isHostBindingReference(ref) ? ref.from.file : ref.from.templateFile;
    const offset = index.isHostBindingReference(ref) ? ref.from.hostPropertyNode.getStart() + 1 : 0;
    replacements.push(new project_paths.Replacement(file, new project_paths.TextUpdate({
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
    if (index.isTsReference(ref)) {
        for (const problematicFn of problematicQueryListMethods) {
            const access = checkTsReferenceAccessesField(ref, problematicFn);
            if (access !== null) {
                result.potentialProblematicReferenceForMultiQueries[ref.target.key] = true;
                return;
            }
        }
    }
    if (index.isHostBindingReference(ref) || index.isTemplateReference(ref)) {
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
function replaceQueryListFirstAndLastReferences(ref, info, globalMetadata, knownQueries, replacements) {
    if (!index.isHostBindingReference(ref) && !index.isTemplateReference(ref) && !index.isTsReference(ref)) {
        return;
    }
    if (knownQueries.isFieldIncompatible(ref.target)) {
        return;
    }
    if (!globalMetadata.knownQueryFields[ref.target.key]?.isMulti) {
        return;
    }
    if (index.isTsReference(ref)) {
        const expr = checkTsReferenceAccessesField(ref, 'first') ?? checkTsReferenceAccessesField(ref, 'last');
        if (expr === null) {
            return;
        }
        replacements.push(new project_paths.Replacement(project_paths.projectFile(expr.getSourceFile(), info), new project_paths.TextUpdate({
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
    const file = index.isHostBindingReference(ref) ? ref.from.file : ref.from.templateFile;
    const offset = index.isHostBindingReference(ref) ? ref.from.hostPropertyNode.getStart() + 1 : 0;
    replacements.push(new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: offset + expr.nameSpan.start,
        end: offset + expr.nameSpan.end,
        toInsert: mapping.get(expr.name),
    })));
}

class SignalQueriesMigration extends project_paths.TsurgeComplexMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        // Pre-Analyze the program and get access to the template type checker.
        const { templateTypeChecker } = info.ngCompiler?.['ensureAnalyzed']() ?? {
            templateTypeChecker: null,
        };
        const resourceLoader = info.ngCompiler?.['resourceManager'] ?? null;
        // Generate all type check blocks, if we have Angular template information.
        if (templateTypeChecker !== null) {
            templateTypeChecker.generateAllTypeCheckBlocks();
        }
        const { sourceFiles, program } = info;
        const checker$1 = program.getTypeChecker();
        const reflector = new checker.TypeScriptReflectionHost(checker$1);
        const evaluator = new index$1.PartialEvaluator(reflector, checker$1, null);
        const res = {
            knownQueryFields: {},
            potentialProblematicQueries: {},
            potentialProblematicReferenceForMultiQueries: {},
            reusableAnalysisReferences: null,
        };
        const groupedAstVisitor = new migrate_ts_type_references.GroupedTsAstVisitor(sourceFiles);
        const referenceResult = { references: [] };
        const classesWithFilteredQueries = new Set();
        const filteredQueriesForCompilationUnit = new Map();
        const findQueryDefinitionsVisitor = (node) => {
            const extractedQuery = extractSourceQueryDefinition(node, reflector, evaluator, info);
            if (extractedQuery !== null) {
                const queryNode = extractedQuery.node;
                const descriptor = {
                    key: extractedQuery.id,
                    node: queryNode,
                };
                const containingFile = project_paths.projectFile(queryNode.getSourceFile(), info);
                // If we have a config filter function, use it here for later
                // perf-boosted reference lookups. Useful in non-batch mode.
                if (this.config.shouldMigrateQuery === undefined ||
                    this.config.shouldMigrateQuery(descriptor, containingFile)) {
                    classesWithFilteredQueries.add(queryNode.parent);
                    filteredQueriesForCompilationUnit.set(extractedQuery.id, {
                        fieldName: extractedQuery.queryInfo.propertyName,
                    });
                }
                res.knownQueryFields[extractedQuery.id] = {
                    fieldName: extractedQuery.queryInfo.propertyName,
                    isMulti: extractedQuery.queryInfo.first === false,
                };
                if (ts.isAccessor(queryNode)) {
                    markFieldIncompatibleInMetadata(res.potentialProblematicQueries, extractedQuery.id, migrate_ts_type_references.FieldIncompatibilityReason.Accessor);
                }
                // Detect queries with union types that are uncommon to be
                // automatically migrate-able. E.g. `refs: ElementRef|null`,
                // or `ElementRef|SomeOtherType`.
                if (queryNode.type !== undefined &&
                    ts.isUnionTypeNode(queryNode.type) &&
                    // Either too large union, or doesn't match `T|undefined`.
                    (queryNode.type.types.length > 2 ||
                        !queryNode.type.types.some((t) => t.kind === ts.SyntaxKind.UndefinedKeyword))) {
                    markFieldIncompatibleInMetadata(res.potentialProblematicQueries, extractedQuery.id, migrate_ts_type_references.FieldIncompatibilityReason.SignalQueries__IncompatibleMultiUnionType);
                }
                // Migrating fields with `@HostBinding` is incompatible as
                // the host binding decorator does not invoke the signal.
                const hostBindingDecorators = checker.getAngularDecorators(extractedQuery.fieldDecorators, ['HostBinding'], 
                /* isCore */ false);
                if (hostBindingDecorators.length > 0) {
                    markFieldIncompatibleInMetadata(res.potentialProblematicQueries, extractedQuery.id, migrate_ts_type_references.FieldIncompatibilityReason.SignalIncompatibleWithHostBinding);
                }
            }
        };
        this.config.reportProgressFn?.(20, 'Scanning for queries..');
        groupedAstVisitor.register(findQueryDefinitionsVisitor);
        groupedAstVisitor.execute();
        const allFieldsOrKnownQueries = {
            // Note: We don't support cross-target migration of `Partial<T>` usages.
            // This is an acceptable limitation for performance reasons.
            shouldTrackClassReference: (node) => classesWithFilteredQueries.has(node),
            attemptRetrieveDescriptorFromSymbol: (s) => {
                const descriptor = getClassFieldDescriptorForSymbol(s, info);
                // If we are executing in upgraded analysis phase mode, we know all
                // of the queries since there aren't any other compilation units.
                // Ignore references to non-query class fields.
                if (this.config.assumeNonBatch &&
                    (descriptor === null || !filteredQueriesForCompilationUnit.has(descriptor.key))) {
                    return null;
                }
                // In batch mode, we eagerly, rather expensively, track all references.
                // We don't know yet if something refers to a different query or not, so we
                // eagerly detect such and later filter those problematic references that
                // turned out to refer to queries (once we have the global metadata).
                return descriptor;
            },
        };
        groupedAstVisitor.register(index.createFindAllSourceFileReferencesVisitor(info, checker$1, reflector, resourceLoader, evaluator, templateTypeChecker, allFieldsOrKnownQueries, 
        // In non-batch mode, we know what inputs exist and can optimize the reference
        // resolution significantly (for e.g. VSCode integration)— as we know what
        // field names may be used to reference potential queries.
        this.config.assumeNonBatch
            ? new Set(Array.from(filteredQueriesForCompilationUnit.values()).map((f) => f.fieldName))
            : null, referenceResult).visitor);
        const inheritanceGraph = new migrate_ts_type_references.InheritanceGraph(checker$1).expensivePopulate(info.sourceFiles);
        migrate_ts_type_references.checkIncompatiblePatterns(inheritanceGraph, checker$1, groupedAstVisitor, {
            ...allFieldsOrKnownQueries,
            isFieldIncompatible: (f) => res.potentialProblematicQueries[f.key]?.fieldReason !== null ||
                res.potentialProblematicQueries[f.key]?.classReason !== null,
            markClassIncompatible: (clazz, reason) => {
                for (const field of clazz.members) {
                    const key = getUniqueIDForClassProperty(field, info);
                    if (key !== null) {
                        res.potentialProblematicQueries[key] ??= { classReason: null, fieldReason: null };
                        res.potentialProblematicQueries[key].classReason = reason;
                    }
                }
            },
            markFieldIncompatible: (f, incompatibility) => markFieldIncompatibleInMetadata(res.potentialProblematicQueries, f.key, incompatibility.reason),
        }, () => Array.from(classesWithFilteredQueries));
        this.config.reportProgressFn?.(60, 'Scanning for references and problematic patterns..');
        groupedAstVisitor.execute();
        // Determine incompatible queries based on problematic references
        // we saw in TS code, templates or host bindings.
        for (const ref of referenceResult.references) {
            if (index.isTsReference(ref) && ref.from.isWrite) {
                markFieldIncompatibleInMetadata(res.potentialProblematicQueries, ref.target.key, migrate_ts_type_references.FieldIncompatibilityReason.WriteAssignment);
            }
            if ((index.isTemplateReference(ref) || index.isHostBindingReference(ref)) && ref.from.isWrite) {
                markFieldIncompatibleInMetadata(res.potentialProblematicQueries, ref.target.key, migrate_ts_type_references.FieldIncompatibilityReason.WriteAssignment);
            }
            // TODO: Remove this when we support signal narrowing in templates.
            // https://github.com/angular/angular/pull/55456.
            if (index.isTemplateReference(ref) && ref.from.isLikelyPartOfNarrowing) {
                markFieldIncompatibleInMetadata(res.potentialProblematicQueries, ref.target.key, migrate_ts_type_references.FieldIncompatibilityReason.PotentiallyNarrowedInTemplateButNoSupportYet);
            }
            // Check for other incompatible query list accesses.
            checkForIncompatibleQueryListAccesses(ref, res);
        }
        if (this.config.assumeNonBatch) {
            res.reusableAnalysisReferences = referenceResult.references;
        }
        return project_paths.confirmAsSerializable(res);
    }
    async combine(unitA, unitB) {
        const combined = {
            knownQueryFields: {},
            potentialProblematicQueries: {},
            potentialProblematicReferenceForMultiQueries: {},
            reusableAnalysisReferences: null,
        };
        for (const unit of [unitA, unitB]) {
            for (const [id, value] of Object.entries(unit.knownQueryFields)) {
                combined.knownQueryFields[id] = value;
            }
            for (const [id, info] of Object.entries(unit.potentialProblematicQueries)) {
                if (info.fieldReason !== null) {
                    markFieldIncompatibleInMetadata(combined.potentialProblematicQueries, id, info.fieldReason);
                }
                if (info.classReason !== null) {
                    combined.potentialProblematicQueries[id] ??= {
                        classReason: null,
                        fieldReason: null,
                    };
                    combined.potentialProblematicQueries[id].classReason =
                        info.classReason;
                }
            }
            for (const id of Object.keys(unit.potentialProblematicReferenceForMultiQueries)) {
                combined.potentialProblematicReferenceForMultiQueries[id] = true;
            }
            if (unit.reusableAnalysisReferences !== null) {
                combined.reusableAnalysisReferences = unit.reusableAnalysisReferences;
            }
        }
        for (const unit of [unitA, unitB]) {
            for (const id of Object.keys(unit.potentialProblematicReferenceForMultiQueries)) {
                if (combined.knownQueryFields[id]?.isMulti) {
                    markFieldIncompatibleInMetadata(combined.potentialProblematicQueries, id, migrate_ts_type_references.FieldIncompatibilityReason.SignalQueries__QueryListProblematicFieldAccessed);
                }
            }
        }
        return project_paths.confirmAsSerializable(combined);
    }
    async globalMeta(combinedData) {
        const globalUnitData = {
            knownQueryFields: combinedData.knownQueryFields,
            problematicQueries: combinedData.potentialProblematicQueries,
            reusableAnalysisReferences: combinedData.reusableAnalysisReferences,
        };
        for (const id of Object.keys(combinedData.potentialProblematicReferenceForMultiQueries)) {
            if (combinedData.knownQueryFields[id]?.isMulti) {
                markFieldIncompatibleInMetadata(globalUnitData.problematicQueries, id, migrate_ts_type_references.FieldIncompatibilityReason.SignalQueries__QueryListProblematicFieldAccessed);
            }
        }
        return project_paths.confirmAsSerializable(globalUnitData);
    }
    async migrate(globalMetadata, info) {
        // Pre-Analyze the program and get access to the template type checker.
        const { templateTypeChecker, metaReader } = info.ngCompiler?.['ensureAnalyzed']() ?? {
            templateTypeChecker: null,
            metaReader: null,
        };
        const resourceLoader = info.ngCompiler?.['resourceManager'] ?? null;
        const { program, sourceFiles } = info;
        const checker$1 = program.getTypeChecker();
        const reflector = new checker.TypeScriptReflectionHost(checker$1);
        const evaluator = new index$1.PartialEvaluator(reflector, checker$1, null);
        const replacements = [];
        const importManager = new checker.ImportManager();
        const printer = ts.createPrinter();
        const filesWithSourceQueries = new Map();
        const filesWithIncompleteMigration = new Map();
        const filesWithQueryListOutsideOfDeclarations = new WeakSet();
        const knownQueries = new KnownQueries(info, this.config, globalMetadata);
        const referenceResult = { references: [] };
        const sourceQueries = [];
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
            if (ts.isPropertyDeclaration(node) ||
                (ts.isAccessor(node) && ts.isClassDeclaration(node.parent))) {
                const classFieldID = getUniqueIDForClassProperty(node, info);
                if (classFieldID !== null && globalMetadata.knownQueryFields[classFieldID] !== undefined) {
                    knownQueries.registerQueryField(node, classFieldID);
                    return;
                }
            }
            // Detect potential usages of `QueryList` outside of queries or imports.
            // Those prevent us from removing the import later.
            if (ts.isIdentifier(node) &&
                node.text === 'QueryList' &&
                ts.findAncestor(node, ts.isImportDeclaration) === undefined) {
                filesWithQueryListOutsideOfDeclarations.add(node.getSourceFile());
            }
            ts.forEachChild(node, queryWholeProgramVisitor);
        };
        for (const sf of info.fullProgramSourceFiles) {
            ts.forEachChild(sf, queryWholeProgramVisitor);
        }
        // Set of all queries in the program. Useful for speeding up reference
        // lookups below.
        const fieldNamesToConsiderForReferenceLookup = new Set(Object.values(globalMetadata.knownQueryFields).map((f) => f.fieldName));
        // Find all references.
        const groupedAstVisitor = new migrate_ts_type_references.GroupedTsAstVisitor(sourceFiles);
        // Re-use previous reference result if available, instead of
        // looking for references which is quite expensive.
        if (globalMetadata.reusableAnalysisReferences !== null) {
            referenceResult.references = globalMetadata.reusableAnalysisReferences;
        }
        else {
            groupedAstVisitor.register(index.createFindAllSourceFileReferencesVisitor(info, checker$1, reflector, resourceLoader, evaluator, templateTypeChecker, knownQueries, fieldNamesToConsiderForReferenceLookup, referenceResult).visitor);
        }
        // Check inheritance.
        // NOTE: Inheritance is only checked in the migrate stage as we cannot reliably
        // check during analyze— where we don't know what fields from foreign `.d.ts`
        // files refer to queries or not.
        const inheritanceGraph = new migrate_ts_type_references.InheritanceGraph(checker$1).expensivePopulate(info.sourceFiles);
        migrate_ts_type_references.checkInheritanceOfKnownFields(inheritanceGraph, metaReader, knownQueries, {
            getFieldsForClass: (n) => knownQueries.getQueryFieldsOfClass(n) ?? [],
            isClassWithKnownFields: (clazz) => knownQueries.getQueryFieldsOfClass(clazz) !== undefined,
        });
        this.config.reportProgressFn?.(80, 'Checking inheritance..');
        groupedAstVisitor.execute();
        if (this.config.bestEffortMode) {
            filterBestEffortIncompatibilities(knownQueries);
        }
        this.config.reportProgressFn?.(90, 'Migrating queries..');
        // Migrate declarations.
        for (const extractedQuery of sourceQueries) {
            const node = extractedQuery.node;
            const sf = node.getSourceFile();
            const descriptor = { key: extractedQuery.id, node: extractedQuery.node };
            const incompatibility = knownQueries.getIncompatibilityForField(descriptor);
            updateFileState(filesWithSourceQueries, sf, extractedQuery.kind);
            if (incompatibility !== null) {
                // Add a TODO for the incompatible query, if desired.
                if (this.config.insertTodosForSkippedFields) {
                    replacements.push(...migrate_ts_type_references.insertTodoForIncompatibility(node, info, incompatibility, {
                        single: 'query',
                        plural: 'queries',
                    }));
                }
                updateFileState(filesWithIncompleteMigration, sf, extractedQuery.kind);
                continue;
            }
            replacements.push(...computeReplacementsToMigrateQuery(node, extractedQuery, importManager, info, printer, info.userOptions, checker$1));
        }
        // Migrate references.
        const referenceMigrationHost = {
            printer,
            replacements,
            shouldMigrateReferencesToField: (field) => !knownQueries.isFieldIncompatible(field),
            shouldMigrateReferencesToClass: (clazz) => !!knownQueries
                .getQueryFieldsOfClass(clazz)
                ?.some((q) => !knownQueries.isFieldIncompatible(q)),
        };
        migrate_ts_type_references.migrateTypeScriptReferences(referenceMigrationHost, referenceResult.references, checker$1, info);
        migrateTemplateReferences(referenceMigrationHost, referenceResult.references);
        migrateHostBindings(referenceMigrationHost, referenceResult.references, info);
        migrate_ts_type_references.migrateTypeScriptTypeReferences(referenceMigrationHost, referenceResult.references, importManager, info);
        // Fix problematic calls, like `QueryList#toArray`, or `QueryList#get`.
        for (const ref of referenceResult.references) {
            removeQueryListToArrayCall(ref, info, globalMetadata, knownQueries, replacements);
            replaceQueryListGetCall(ref, info, globalMetadata, knownQueries, replacements);
            replaceQueryListFirstAndLastReferences(ref, info, globalMetadata, knownQueries, replacements);
        }
        // Remove imports if possible.
        for (const [file, types] of filesWithSourceQueries) {
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
            if (!seenIncompatibleMultiQuery && !filesWithQueryListOutsideOfDeclarations.has(file)) {
                importManager.removeImport(file, 'QueryList', '@angular/core');
            }
        }
        apply_import_manager.applyImportManagerChanges(importManager, replacements, sourceFiles, info);
        return { replacements, knownQueries };
    }
    async stats(globalMetadata) {
        let queriesCount = 0;
        let multiQueries = 0;
        let incompatibleQueries = 0;
        const fieldIncompatibleCounts = {};
        const classIncompatibleCounts = {};
        for (const query of Object.values(globalMetadata.knownQueryFields)) {
            queriesCount++;
            if (query.isMulti) {
                multiQueries++;
            }
        }
        for (const [id, info] of Object.entries(globalMetadata.problematicQueries)) {
            if (globalMetadata.knownQueryFields[id] === undefined) {
                continue;
            }
            // Do not count queries that were forcibly ignored via best effort mode.
            if (this.config.bestEffortMode &&
                (info.fieldReason === null ||
                    !migrate_ts_type_references.nonIgnorableFieldIncompatibilities.includes(info.fieldReason))) {
                continue;
            }
            incompatibleQueries++;
            if (info.classReason !== null) {
                const reasonName = migrate_ts_type_references.ClassIncompatibilityReason[info.classReason];
                const key = `incompat-class-${reasonName}`;
                classIncompatibleCounts[key] ??= 0;
                classIncompatibleCounts[key]++;
            }
            if (info.fieldReason !== null) {
                const reasonName = migrate_ts_type_references.FieldIncompatibilityReason[info.fieldReason];
                const key = `incompat-field-${reasonName}`;
                fieldIncompatibleCounts[key] ??= 0;
                fieldIncompatibleCounts[key]++;
            }
        }
        return project_paths.confirmAsSerializable({
            queriesCount,
            multiQueries,
            incompatibleQueries,
            ...fieldIncompatibleCounts,
            ...classIncompatibleCounts,
        });
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
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new SignalQueriesMigration({
                bestEffortMode: options.bestEffortMode,
                insertTodosForSkippedFields: options.insertTodos,
                shouldMigrateQuery: (_query, file) => {
                    return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                        !/(^|\/)node_modules\//.test(file.rootRelativePath));
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
                context.logger.info(`Scanning for queries: ${tsconfigPath}...`);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            whenDone: ({ queriesCount, incompatibleQueries }) => {
                context.logger.info('');
                context.logger.info(`Successfully migrated to signal queries 🎉`);
                const migratedQueries = queriesCount - incompatibleQueries;
                context.logger.info('');
                context.logger.info(`Successfully migrated to signal queries 🎉`);
                context.logger.info(`  -> Migrated ${migratedQueries}/${queriesCount} queries.`);
                if (incompatibleQueries > 0 && !options.insertTodos) {
                    context.logger.warn(`To see why ${incompatibleQueries} queries couldn't be migrated`);
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
