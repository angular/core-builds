'use strict';
/**
 * @license Angular v20.0.0+sha-9a24a2b
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var checker = require('./checker-Bu1Wu4f7.cjs');
var index = require('./index-CCX_cTPD.cjs');
require('path');
var project_paths = require('./project_paths-BjQra9mv.cjs');

function getMemberName(member) {
    if (member.name === undefined) {
        return null;
    }
    if (ts.isIdentifier(member.name) || ts.isStringLiteralLike(member.name)) {
        return member.name.text;
    }
    if (ts.isPrivateIdentifier(member.name)) {
        return `#${member.name.text}`;
    }
    return null;
}

/** Checks whether the given node can be an `@Input()` declaration node. */
function isInputContainerNode(node) {
    return (((ts.isAccessor(node) && ts.isClassDeclaration(node.parent)) ||
        ts.isPropertyDeclaration(node)) &&
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
        if (!ts.isPropertyAccessExpression(node)) {
            return null;
        }
        // Check for `<>.componentInstance`.
        if (!ts.isIdentifier(node.name) || node.name.text !== 'componentInstance') {
            return null;
        }
        // Check for `<>.query(..).<>`.
        if (!ts.isCallExpression(node.expression) ||
            !ts.isPropertyAccessExpression(node.expression.expression) ||
            !ts.isIdentifier(node.expression.expression.name) ||
            node.expression.expression.name.text !== 'query') {
            return null;
        }
        const queryCall = node.expression;
        if (queryCall.arguments.length !== 1) {
            return null;
        }
        const queryArg = queryCall.arguments[0];
        let typeExpr;
        if (ts.isCallExpression(queryArg) &&
            queryArg.arguments.length === 1 &&
            ts.isIdentifier(queryArg.arguments[0])) {
            // Detect references, like: `query(By.directive(T))`.
            typeExpr = queryArg.arguments[0];
        }
        else if (ts.isIdentifier(queryArg)) {
            // Detect references, like: `harness.query(T)`.
            typeExpr = queryArg;
        }
        else {
            return null;
        }
        const symbol = this.checker.getSymbolAtLocation(typeExpr);
        if (symbol?.valueDeclaration === undefined ||
            !ts.isClassDeclaration(symbol?.valueDeclaration)) {
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
        if (!ts.isTypeReferenceNode(node) ||
            !ts.isIdentifier(node.typeName) ||
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
            !ts.isTypeReferenceNode(cmpTypeArg) ||
            !ts.isIdentifier(cmpTypeArg.typeName)) {
            return null;
        }
        const cmpType = cmpTypeArg.typeName;
        const symbol = this.checker.getSymbolAtLocation(cmpType);
        // Note: Technically the class might be derived of an input-containing class,
        // but this is out of scope for now. We can expand if we see it's a common case.
        if (symbol?.valueDeclaration === undefined ||
            !ts.isClassDeclaration(symbol.valueDeclaration) ||
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
class TemplateReferenceVisitor extends checker.RecursiveVisitor {
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
        checker.visitAll(this, template.attributes);
        checker.visitAll(this, template.templateAttrs);
        // If we are dealing with a microsyntax template, do not check
        // inputs and outputs as those are already passed to the children.
        // Template attributes may contain relevant expressions though.
        if (template.tagName === 'ng-template') {
            checker.visitAll(this, template.inputs);
            checker.visitAll(this, template.outputs);
        }
        const referencedInputs = this.templateAttributeReferencedFields;
        this.templateAttributeReferencedFields = null;
        this.descendAndCheckForNarrowedSimilarReferences(referencedInputs, () => {
            checker.visitAll(this, template.children);
            checker.visitAll(this, template.references);
            checker.visitAll(this, template.variables);
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
class TemplateExpressionReferenceVisitor extends checker.RecursiveAstVisitor {
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
    if (!ts.isObjectLiteralExpression(metadataNode)) {
        return;
    }
    const metadata = checker.reflectObjectLiteral(metadataNode);
    if (!metadata.has('host')) {
        return;
    }
    let hostField = checker.unwrapExpression(metadata.get('host'));
    // Special-case in case host bindings are shared via a variable.
    // e.g. Material button shares host bindings as a constant in the same target.
    if (ts.isIdentifier(hostField)) {
        let symbol = checker$1.getSymbolAtLocation(hostField);
        // Plain identifier references can point to alias symbols (e.g. imports).
        if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) {
            symbol = checker$1.getAliasedSymbol(symbol);
        }
        if (symbol !== undefined &&
            symbol.valueDeclaration !== undefined &&
            ts.isVariableDeclaration(symbol.valueDeclaration)) {
            hostField = symbol?.valueDeclaration.initializer;
        }
    }
    if (hostField === undefined || !ts.isObjectLiteralExpression(hostField)) {
        return;
    }
    const hostMap = checker.reflectObjectLiteral(hostField);
    const expressionResult = [];
    const expressionVisitor = new TemplateExpressionReferenceVisitor(checker$1, null, node, knownFields, fieldNamesToConsiderForReferenceLookup);
    for (const [rawName, expression] of hostMap.entries()) {
        if (!ts.isStringLiteralLike(expression)) {
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
                file: project_paths.projectFile(ref.context.getSourceFile(), programInfo),
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
    const evaluator = new index.PartialEvaluator(reflector, checker$1, null);
    const ngDecorators = classDecorators !== null
        ? checker.getAngularDecorators(classDecorators, ['Component'], /* isAngularCore */ false)
        : [];
    if (ngDecorators.length === 0 ||
        ngDecorators[0].args === null ||
        ngDecorators[0].args.length === 0 ||
        !ts.isObjectLiteralExpression(ngDecorators[0].args[0])) {
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
                    originatingTsFile: project_paths.projectFile(node.getSourceFile(), programInfo),
                    templateFile: project_paths.projectFile(checker.absoluteFrom(templateFilePath), programInfo),
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
    return index.extractTemplate(node, tmplDef, evaluator, null, resourceLoader, {
        enableBlockSyntax: true,
        enableLetSyntax: true,
        usePoisonedData: true,
        enableI18nLegacyMessageIdFormat: options.enableI18nLegacyMessageIdFormat !== false,
        i18nNormalizeLineEndingsInICUs: options.i18nNormalizeLineEndingsInICUs === true,
        enableSelectorless: false,
    }, checker.CompilationMode.FULL).nodes;
}

/** Gets the pattern and property name for a given binding element. */
function resolveBindingElement(node) {
    const name = node.propertyName ?? node.name;
    // If we are discovering a non-analyzable element in the path, abort.
    if (!ts.isStringLiteralLike(name) && !ts.isIdentifier(name)) {
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
        if (ts.isBindingElement(node.parent.parent)) {
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
    if (ts.isPropertyAccessExpression(access.parent) && access.parent.name === access) {
        return access.parent;
    }
    else if (ts.isElementAccessExpression(access.parent) &&
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
    if (ts.isParenthesizedExpression(node.parent)) {
        return unwrapParent(node.parent);
    }
    else if (ts.isAsExpression(node.parent)) {
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
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.BarBarEqualsToken,
    ts.SyntaxKind.BarEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.CaretEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
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
    try {
        // Resolve binding elements to their declaration symbol.
        // Commonly inputs are accessed via object expansion. e.g. `const {input} = this;`.
        if (ts.isBindingElement(node.parent)) {
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
    }
    catch (e) {
        console.error('Unexpected error while trying to resolve identifier reference:');
        console.error(e);
        // Gracefully skip analyzing. This can happen when e.g. a reference is named similar
        // to an input, but is dependant on `.d.ts` that is not necessarily available (clutz dts).
        return;
    }
    noTargetSymbolCheck: if (target === undefined) {
        if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
            const propAccessSymbol = checker.getSymbolAtLocation(node.parent.expression);
            if (propAccessSymbol !== undefined &&
                propAccessSymbol.valueDeclaration !== undefined &&
                ts.isVariableDeclaration(propAccessSymbol.valueDeclaration) &&
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
    const isWriteReference = ts.isBinaryExpression(accessParent) &&
        accessParent.left === access &&
        writeBinaryOperators.includes(accessParent.operatorToken.kind);
    // track accesses from source files to known fields.
    result.references.push({
        kind: exports.ReferenceKind.TsReference,
        from: {
            node,
            file: project_paths.projectFile(node.getSourceFile(), programInfo),
            isWrite: isWriteReference,
            isPartOfElementBinding: ts.isBindingElement(node.parent),
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
        if (ts.isClassDeclaration(node) && templateTypeChecker !== null && resourceLoader !== null) {
            identifyTemplateReferences(programInfo, node, reflector, checker, evaluator, templateTypeChecker, resourceLoader, programInfo.userOptions, result, knownFields, fieldNamesToConsiderForReferenceLookup);
            perfCounters.template += (currentTimeInMs() - lastTime) / 1000;
            lastTime = currentTimeInMs();
            identifyHostBindingReferences(node, programInfo, checker, reflector, result, knownFields, fieldNamesToConsiderForReferenceLookup);
            perfCounters.hostBindings += (currentTimeInMs() - lastTime) / 1000;
            lastTime = currentTimeInMs();
        }
        lastTime = currentTimeInMs();
        // find references, but do not capture input declarations itself.
        if (ts.isIdentifier(node) &&
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
                    file: project_paths.projectFile(partialDirectiveInCatalyst.referenceNode.getSourceFile(), programInfo),
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

exports.createFindAllSourceFileReferencesVisitor = createFindAllSourceFileReferencesVisitor;
exports.getBindingElementDeclaration = getBindingElementDeclaration;
exports.getMemberName = getMemberName;
exports.isHostBindingReference = isHostBindingReference;
exports.isInputContainerNode = isInputContainerNode;
exports.isTemplateReference = isTemplateReference;
exports.isTsClassTypeReference = isTsClassTypeReference;
exports.isTsReference = isTsReference;
exports.traverseAccess = traverseAccess;
exports.unwrapParent = unwrapParent;
