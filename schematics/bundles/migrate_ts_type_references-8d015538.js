'use strict';
/**
 * @license Angular v19.1.3+sha-cdb439b
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var checker = require('./checker-ca858016.js');
var ts = require('typescript');
require('os');
var assert = require('assert');
var index = require('./index-d05029f9.js');
var apply_import_manager = require('./apply_import_manager-40cd5384.js');
var leading_space = require('./leading_space-d190b83b.js');
require('./program-8e222816.js');
require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);

/**
 * Reasons why a field cannot be migrated.
 *
 * Higher values of incompatibility reasons indicate a more significant
 * incompatibility reason. Lower ones may be overridden by higher ones.
 * */
exports.FieldIncompatibilityReason = void 0;
(function (FieldIncompatibilityReason) {
    FieldIncompatibilityReason[FieldIncompatibilityReason["OverriddenByDerivedClass"] = 1] = "OverriddenByDerivedClass";
    FieldIncompatibilityReason[FieldIncompatibilityReason["RedeclaredViaDerivedClassInputsArray"] = 2] = "RedeclaredViaDerivedClassInputsArray";
    FieldIncompatibilityReason[FieldIncompatibilityReason["TypeConflictWithBaseClass"] = 3] = "TypeConflictWithBaseClass";
    FieldIncompatibilityReason[FieldIncompatibilityReason["ParentIsIncompatible"] = 4] = "ParentIsIncompatible";
    FieldIncompatibilityReason[FieldIncompatibilityReason["DerivedIsIncompatible"] = 5] = "DerivedIsIncompatible";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SpyOnThatOverwritesField"] = 6] = "SpyOnThatOverwritesField";
    FieldIncompatibilityReason[FieldIncompatibilityReason["PotentiallyNarrowedInTemplateButNoSupportYet"] = 7] = "PotentiallyNarrowedInTemplateButNoSupportYet";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SignalIncompatibleWithHostBinding"] = 8] = "SignalIncompatibleWithHostBinding";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SignalInput__RequiredButNoGoodExplicitTypeExtractable"] = 9] = "SignalInput__RequiredButNoGoodExplicitTypeExtractable";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SignalInput__QuestionMarkButNoGoodExplicitTypeExtractable"] = 10] = "SignalInput__QuestionMarkButNoGoodExplicitTypeExtractable";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SignalQueries__QueryListProblematicFieldAccessed"] = 11] = "SignalQueries__QueryListProblematicFieldAccessed";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SignalQueries__IncompatibleMultiUnionType"] = 12] = "SignalQueries__IncompatibleMultiUnionType";
    FieldIncompatibilityReason[FieldIncompatibilityReason["WriteAssignment"] = 13] = "WriteAssignment";
    FieldIncompatibilityReason[FieldIncompatibilityReason["Accessor"] = 14] = "Accessor";
    FieldIncompatibilityReason[FieldIncompatibilityReason["OutsideOfMigrationScope"] = 15] = "OutsideOfMigrationScope";
    FieldIncompatibilityReason[FieldIncompatibilityReason["SkippedViaConfigFilter"] = 16] = "SkippedViaConfigFilter";
})(exports.FieldIncompatibilityReason || (exports.FieldIncompatibilityReason = {}));
/** Field reasons that cannot be ignored. */
const nonIgnorableFieldIncompatibilities = [
    // Outside of scope fields should not be migrated. E.g. references to inputs in `node_modules/`.
    exports.FieldIncompatibilityReason.OutsideOfMigrationScope,
    // Explicitly filtered fields cannot be skipped via best effort mode.
    exports.FieldIncompatibilityReason.SkippedViaConfigFilter,
    // There is no good output for accessor fields.
    exports.FieldIncompatibilityReason.Accessor,
    // There is no good output for such inputs. We can't perform "conversion".
    exports.FieldIncompatibilityReason.SignalInput__RequiredButNoGoodExplicitTypeExtractable,
    exports.FieldIncompatibilityReason.SignalInput__QuestionMarkButNoGoodExplicitTypeExtractable,
];
/** Reasons why a whole class and its fields cannot be migrated. */
exports.ClassIncompatibilityReason = void 0;
(function (ClassIncompatibilityReason) {
    ClassIncompatibilityReason[ClassIncompatibilityReason["ClassManuallyInstantiated"] = 0] = "ClassManuallyInstantiated";
    ClassIncompatibilityReason[ClassIncompatibilityReason["OwningClassReferencedInClassProperty"] = 1] = "OwningClassReferencedInClassProperty";
})(exports.ClassIncompatibilityReason || (exports.ClassIncompatibilityReason = {}));
/** Whether the given value refers to an field incompatibility. */
function isFieldIncompatibility(value) {
    return (value.reason !== undefined &&
        value.context !== undefined &&
        exports.FieldIncompatibilityReason.hasOwnProperty(value.reason));
}
/** Picks the more significant field compatibility. */
function pickFieldIncompatibility(a, b) {
    if (b === null) {
        return a;
    }
    if (a.reason < b.reason) {
        return b;
    }
    return a;
}

/**
 * A lazily created TextEncoder instance for converting strings into UTF-8 bytes
 */
// Utils
var Endian;
(function (Endian) {
    Endian[Endian["Little"] = 0] = "Little";
    Endian[Endian["Big"] = 1] = "Big";
})(Endian || (Endian = {}));

//// Types
var TypeModifier;
(function (TypeModifier) {
    TypeModifier[TypeModifier["None"] = 0] = "None";
    TypeModifier[TypeModifier["Const"] = 1] = "Const";
})(TypeModifier || (TypeModifier = {}));
class Type {
    modifiers;
    constructor(modifiers = TypeModifier.None) {
        this.modifiers = modifiers;
    }
    hasModifier(modifier) {
        return (this.modifiers & modifier) !== 0;
    }
}
var BuiltinTypeName;
(function (BuiltinTypeName) {
    BuiltinTypeName[BuiltinTypeName["Dynamic"] = 0] = "Dynamic";
    BuiltinTypeName[BuiltinTypeName["Bool"] = 1] = "Bool";
    BuiltinTypeName[BuiltinTypeName["String"] = 2] = "String";
    BuiltinTypeName[BuiltinTypeName["Int"] = 3] = "Int";
    BuiltinTypeName[BuiltinTypeName["Number"] = 4] = "Number";
    BuiltinTypeName[BuiltinTypeName["Function"] = 5] = "Function";
    BuiltinTypeName[BuiltinTypeName["Inferred"] = 6] = "Inferred";
    BuiltinTypeName[BuiltinTypeName["None"] = 7] = "None";
})(BuiltinTypeName || (BuiltinTypeName = {}));
class BuiltinType extends Type {
    name;
    constructor(name, modifiers) {
        super(modifiers);
        this.name = name;
    }
    visitType(visitor, context) {
        return visitor.visitBuiltinType(this, context);
    }
}
new BuiltinType(BuiltinTypeName.Dynamic);
const INFERRED_TYPE = new BuiltinType(BuiltinTypeName.Inferred);
new BuiltinType(BuiltinTypeName.Bool);
new BuiltinType(BuiltinTypeName.Int);
new BuiltinType(BuiltinTypeName.Number);
new BuiltinType(BuiltinTypeName.String);
new BuiltinType(BuiltinTypeName.Function);
new BuiltinType(BuiltinTypeName.None);
///// Expressions
var UnaryOperator;
(function (UnaryOperator) {
    UnaryOperator[UnaryOperator["Minus"] = 0] = "Minus";
    UnaryOperator[UnaryOperator["Plus"] = 1] = "Plus";
})(UnaryOperator || (UnaryOperator = {}));
var BinaryOperator;
(function (BinaryOperator) {
    BinaryOperator[BinaryOperator["Equals"] = 0] = "Equals";
    BinaryOperator[BinaryOperator["NotEquals"] = 1] = "NotEquals";
    BinaryOperator[BinaryOperator["Identical"] = 2] = "Identical";
    BinaryOperator[BinaryOperator["NotIdentical"] = 3] = "NotIdentical";
    BinaryOperator[BinaryOperator["Minus"] = 4] = "Minus";
    BinaryOperator[BinaryOperator["Plus"] = 5] = "Plus";
    BinaryOperator[BinaryOperator["Divide"] = 6] = "Divide";
    BinaryOperator[BinaryOperator["Multiply"] = 7] = "Multiply";
    BinaryOperator[BinaryOperator["Modulo"] = 8] = "Modulo";
    BinaryOperator[BinaryOperator["And"] = 9] = "And";
    BinaryOperator[BinaryOperator["Or"] = 10] = "Or";
    BinaryOperator[BinaryOperator["BitwiseOr"] = 11] = "BitwiseOr";
    BinaryOperator[BinaryOperator["BitwiseAnd"] = 12] = "BitwiseAnd";
    BinaryOperator[BinaryOperator["Lower"] = 13] = "Lower";
    BinaryOperator[BinaryOperator["LowerEquals"] = 14] = "LowerEquals";
    BinaryOperator[BinaryOperator["Bigger"] = 15] = "Bigger";
    BinaryOperator[BinaryOperator["BiggerEquals"] = 16] = "BiggerEquals";
    BinaryOperator[BinaryOperator["NullishCoalesce"] = 17] = "NullishCoalesce";
})(BinaryOperator || (BinaryOperator = {}));
function nullSafeIsEquivalent(base, other) {
    if (base == null || other == null) {
        return base == other;
    }
    return base.isEquivalent(other);
}
function areAllEquivalentPredicate(base, other, equivalentPredicate) {
    const len = base.length;
    if (len !== other.length) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if (!equivalentPredicate(base[i], other[i])) {
            return false;
        }
    }
    return true;
}
function areAllEquivalent(base, other) {
    return areAllEquivalentPredicate(base, other, (baseElement, otherElement) => baseElement.isEquivalent(otherElement));
}
class Expression {
    type;
    sourceSpan;
    constructor(type, sourceSpan) {
        this.type = type || null;
        this.sourceSpan = sourceSpan || null;
    }
    prop(name, sourceSpan) {
        return new ReadPropExpr(this, name, null, sourceSpan);
    }
    key(index, type, sourceSpan) {
        return new ReadKeyExpr(this, index, type, sourceSpan);
    }
    callFn(params, sourceSpan, pure) {
        return new InvokeFunctionExpr(this, params, null, sourceSpan, pure);
    }
    instantiate(params, type, sourceSpan) {
        return new InstantiateExpr(this, params, type, sourceSpan);
    }
    conditional(trueCase, falseCase = null, sourceSpan) {
        return new ConditionalExpr(this, trueCase, falseCase, null, sourceSpan);
    }
    equals(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Equals, this, rhs, null, sourceSpan);
    }
    notEquals(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.NotEquals, this, rhs, null, sourceSpan);
    }
    identical(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Identical, this, rhs, null, sourceSpan);
    }
    notIdentical(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.NotIdentical, this, rhs, null, sourceSpan);
    }
    minus(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Minus, this, rhs, null, sourceSpan);
    }
    plus(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Plus, this, rhs, null, sourceSpan);
    }
    divide(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Divide, this, rhs, null, sourceSpan);
    }
    multiply(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Multiply, this, rhs, null, sourceSpan);
    }
    modulo(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Modulo, this, rhs, null, sourceSpan);
    }
    and(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.And, this, rhs, null, sourceSpan);
    }
    bitwiseOr(rhs, sourceSpan, parens = true) {
        return new BinaryOperatorExpr(BinaryOperator.BitwiseOr, this, rhs, null, sourceSpan, parens);
    }
    bitwiseAnd(rhs, sourceSpan, parens = true) {
        return new BinaryOperatorExpr(BinaryOperator.BitwiseAnd, this, rhs, null, sourceSpan, parens);
    }
    or(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Or, this, rhs, null, sourceSpan);
    }
    lower(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Lower, this, rhs, null, sourceSpan);
    }
    lowerEquals(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.LowerEquals, this, rhs, null, sourceSpan);
    }
    bigger(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.Bigger, this, rhs, null, sourceSpan);
    }
    biggerEquals(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.BiggerEquals, this, rhs, null, sourceSpan);
    }
    isBlank(sourceSpan) {
        // Note: We use equals by purpose here to compare to null and undefined in JS.
        // We use the typed null to allow strictNullChecks to narrow types.
        return this.equals(TYPED_NULL_EXPR, sourceSpan);
    }
    nullishCoalesce(rhs, sourceSpan) {
        return new BinaryOperatorExpr(BinaryOperator.NullishCoalesce, this, rhs, null, sourceSpan);
    }
    toStmt() {
        return new ExpressionStatement(this, null);
    }
}
class WriteKeyExpr extends Expression {
    receiver;
    index;
    value;
    constructor(receiver, index, value, type, sourceSpan) {
        super(type || value.type, sourceSpan);
        this.receiver = receiver;
        this.index = index;
        this.value = value;
    }
    isEquivalent(e) {
        return (e instanceof WriteKeyExpr &&
            this.receiver.isEquivalent(e.receiver) &&
            this.index.isEquivalent(e.index) &&
            this.value.isEquivalent(e.value));
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitWriteKeyExpr(this, context);
    }
    clone() {
        return new WriteKeyExpr(this.receiver.clone(), this.index.clone(), this.value.clone(), this.type, this.sourceSpan);
    }
}
class WritePropExpr extends Expression {
    receiver;
    name;
    value;
    constructor(receiver, name, value, type, sourceSpan) {
        super(type || value.type, sourceSpan);
        this.receiver = receiver;
        this.name = name;
        this.value = value;
    }
    isEquivalent(e) {
        return (e instanceof WritePropExpr &&
            this.receiver.isEquivalent(e.receiver) &&
            this.name === e.name &&
            this.value.isEquivalent(e.value));
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitWritePropExpr(this, context);
    }
    clone() {
        return new WritePropExpr(this.receiver.clone(), this.name, this.value.clone(), this.type, this.sourceSpan);
    }
}
class InvokeFunctionExpr extends Expression {
    fn;
    args;
    pure;
    constructor(fn, args, type, sourceSpan, pure = false) {
        super(type, sourceSpan);
        this.fn = fn;
        this.args = args;
        this.pure = pure;
    }
    // An alias for fn, which allows other logic to handle calls and property reads together.
    get receiver() {
        return this.fn;
    }
    isEquivalent(e) {
        return (e instanceof InvokeFunctionExpr &&
            this.fn.isEquivalent(e.fn) &&
            areAllEquivalent(this.args, e.args) &&
            this.pure === e.pure);
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitInvokeFunctionExpr(this, context);
    }
    clone() {
        return new InvokeFunctionExpr(this.fn.clone(), this.args.map((arg) => arg.clone()), this.type, this.sourceSpan, this.pure);
    }
}
class InstantiateExpr extends Expression {
    classExpr;
    args;
    constructor(classExpr, args, type, sourceSpan) {
        super(type, sourceSpan);
        this.classExpr = classExpr;
        this.args = args;
    }
    isEquivalent(e) {
        return (e instanceof InstantiateExpr &&
            this.classExpr.isEquivalent(e.classExpr) &&
            areAllEquivalent(this.args, e.args));
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitInstantiateExpr(this, context);
    }
    clone() {
        return new InstantiateExpr(this.classExpr.clone(), this.args.map((arg) => arg.clone()), this.type, this.sourceSpan);
    }
}
class LiteralExpr extends Expression {
    value;
    constructor(value, type, sourceSpan) {
        super(type, sourceSpan);
        this.value = value;
    }
    isEquivalent(e) {
        return e instanceof LiteralExpr && this.value === e.value;
    }
    isConstant() {
        return true;
    }
    visitExpression(visitor, context) {
        return visitor.visitLiteralExpr(this, context);
    }
    clone() {
        return new LiteralExpr(this.value, this.type, this.sourceSpan);
    }
}
class ConditionalExpr extends Expression {
    condition;
    falseCase;
    trueCase;
    constructor(condition, trueCase, falseCase = null, type, sourceSpan) {
        super(type || trueCase.type, sourceSpan);
        this.condition = condition;
        this.falseCase = falseCase;
        this.trueCase = trueCase;
    }
    isEquivalent(e) {
        return (e instanceof ConditionalExpr &&
            this.condition.isEquivalent(e.condition) &&
            this.trueCase.isEquivalent(e.trueCase) &&
            nullSafeIsEquivalent(this.falseCase, e.falseCase));
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitConditionalExpr(this, context);
    }
    clone() {
        return new ConditionalExpr(this.condition.clone(), this.trueCase.clone(), this.falseCase?.clone(), this.type, this.sourceSpan);
    }
}
class BinaryOperatorExpr extends Expression {
    operator;
    rhs;
    parens;
    lhs;
    constructor(operator, lhs, rhs, type, sourceSpan, parens = true) {
        super(type || lhs.type, sourceSpan);
        this.operator = operator;
        this.rhs = rhs;
        this.parens = parens;
        this.lhs = lhs;
    }
    isEquivalent(e) {
        return (e instanceof BinaryOperatorExpr &&
            this.operator === e.operator &&
            this.lhs.isEquivalent(e.lhs) &&
            this.rhs.isEquivalent(e.rhs));
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitBinaryOperatorExpr(this, context);
    }
    clone() {
        return new BinaryOperatorExpr(this.operator, this.lhs.clone(), this.rhs.clone(), this.type, this.sourceSpan, this.parens);
    }
}
class ReadPropExpr extends Expression {
    receiver;
    name;
    constructor(receiver, name, type, sourceSpan) {
        super(type, sourceSpan);
        this.receiver = receiver;
        this.name = name;
    }
    // An alias for name, which allows other logic to handle property reads and keyed reads together.
    get index() {
        return this.name;
    }
    isEquivalent(e) {
        return (e instanceof ReadPropExpr && this.receiver.isEquivalent(e.receiver) && this.name === e.name);
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitReadPropExpr(this, context);
    }
    set(value) {
        return new WritePropExpr(this.receiver, this.name, value, null, this.sourceSpan);
    }
    clone() {
        return new ReadPropExpr(this.receiver.clone(), this.name, this.type, this.sourceSpan);
    }
}
class ReadKeyExpr extends Expression {
    receiver;
    index;
    constructor(receiver, index, type, sourceSpan) {
        super(type, sourceSpan);
        this.receiver = receiver;
        this.index = index;
    }
    isEquivalent(e) {
        return (e instanceof ReadKeyExpr &&
            this.receiver.isEquivalent(e.receiver) &&
            this.index.isEquivalent(e.index));
    }
    isConstant() {
        return false;
    }
    visitExpression(visitor, context) {
        return visitor.visitReadKeyExpr(this, context);
    }
    set(value) {
        return new WriteKeyExpr(this.receiver, this.index, value, null, this.sourceSpan);
    }
    clone() {
        return new ReadKeyExpr(this.receiver.clone(), this.index.clone(), this.type, this.sourceSpan);
    }
}
const NULL_EXPR = new LiteralExpr(null, null, null);
const TYPED_NULL_EXPR = new LiteralExpr(null, INFERRED_TYPE, null);
//// Statements
var StmtModifier;
(function (StmtModifier) {
    StmtModifier[StmtModifier["None"] = 0] = "None";
    StmtModifier[StmtModifier["Final"] = 1] = "Final";
    StmtModifier[StmtModifier["Private"] = 2] = "Private";
    StmtModifier[StmtModifier["Exported"] = 4] = "Exported";
    StmtModifier[StmtModifier["Static"] = 8] = "Static";
})(StmtModifier || (StmtModifier = {}));
class Statement {
    modifiers;
    sourceSpan;
    leadingComments;
    constructor(modifiers = StmtModifier.None, sourceSpan = null, leadingComments) {
        this.modifiers = modifiers;
        this.sourceSpan = sourceSpan;
        this.leadingComments = leadingComments;
    }
    hasModifier(modifier) {
        return (this.modifiers & modifier) !== 0;
    }
    addLeadingComment(leadingComment) {
        this.leadingComments = this.leadingComments ?? [];
        this.leadingComments.push(leadingComment);
    }
}
class ExpressionStatement extends Statement {
    expr;
    constructor(expr, sourceSpan, leadingComments) {
        super(StmtModifier.None, sourceSpan, leadingComments);
        this.expr = expr;
    }
    isEquivalent(stmt) {
        return stmt instanceof ExpressionStatement && this.expr.isEquivalent(stmt.expr);
    }
    visitStatement(visitor, context) {
        return visitor.visitExpressionStmt(this, context);
    }
}

/**
 * Detects `spyOn(dirInstance, 'myInput')` calls that likely modify
 * the input signal. There is no way to change the value inside the input signal,
 * and hence observing is not possible.
 */
class SpyOnFieldPattern {
    checker;
    fields;
    constructor(checker, fields) {
        this.checker = checker;
        this.fields = fields;
    }
    detect(node) {
        if (ts__default["default"].isCallExpression(node) &&
            ts__default["default"].isIdentifier(node.expression) &&
            node.expression.text === 'spyOn' &&
            node.arguments.length === 2 &&
            ts__default["default"].isStringLiteralLike(node.arguments[1])) {
            const spyTargetType = this.checker.getTypeAtLocation(node.arguments[0]);
            const spyProperty = spyTargetType.getProperty(node.arguments[1].text);
            if (spyProperty === undefined) {
                return;
            }
            const fieldTarget = this.fields.attemptRetrieveDescriptorFromSymbol(spyProperty);
            if (fieldTarget === null) {
                return;
            }
            this.fields.markFieldIncompatible(fieldTarget, {
                reason: exports.FieldIncompatibilityReason.SpyOnThatOverwritesField,
                context: node,
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
function checkIncompatiblePatterns(inheritanceGraph, checker$1, groupedTsAstVisitor, fields, getAllClassesWithKnownFields) {
    const inputClassSymbolsToClass = new Map();
    for (const knownFieldClass of getAllClassesWithKnownFields()) {
        const classSymbol = checker$1.getTypeAtLocation(knownFieldClass).symbol;
        assert__default["default"](classSymbol != null, 'Expected a symbol to exist for the container of known field class.');
        assert__default["default"](classSymbol.valueDeclaration !== undefined, 'Expected declaration to exist for known field class.');
        assert__default["default"](ts__default["default"].isClassDeclaration(classSymbol.valueDeclaration), 'Expected declaration to be a class.');
        // track class symbol for derived class checks.
        inputClassSymbolsToClass.set(classSymbol, classSymbol.valueDeclaration);
    }
    const spyOnPattern = new SpyOnFieldPattern(checker$1, fields);
    const visitor = (node) => {
        // Check for manual class instantiations.
        if (ts__default["default"].isNewExpression(node) && ts__default["default"].isIdentifier(checker.unwrapExpression(node.expression))) {
            let newTarget = checker$1.getSymbolAtLocation(checker.unwrapExpression(node.expression));
            // Plain identifier references can point to alias symbols (e.g. imports).
            if (newTarget !== undefined && newTarget.flags & ts__default["default"].SymbolFlags.Alias) {
                newTarget = checker$1.getAliasedSymbol(newTarget);
            }
            if (newTarget && inputClassSymbolsToClass.has(newTarget)) {
                fields.markClassIncompatible(inputClassSymbolsToClass.get(newTarget), exports.ClassIncompatibilityReason.ClassManuallyInstantiated);
            }
        }
        // Detect `spyOn` problematic usages and record them.
        spyOnPattern.detect(node);
        const insidePropertyDeclaration = groupedTsAstVisitor.state.insidePropertyDeclaration;
        // Check for problematic class references inside property declarations.
        // These are likely problematic, causing type conflicts, if the containing
        // class inherits a non-input member with the same name.
        // Suddenly the derived class changes its signature, but the base class may not.
        problematicReferencesCheck: if (insidePropertyDeclaration !== null &&
            ts__default["default"].isIdentifier(node) &&
            insidePropertyDeclaration.parent.heritageClauses !== undefined) {
            let newTarget = checker$1.getSymbolAtLocation(checker.unwrapExpression(node));
            // Plain identifier references can point to alias symbols (e.g. imports).
            if (newTarget !== undefined && newTarget.flags & ts__default["default"].SymbolFlags.Alias) {
                newTarget = checker$1.getAliasedSymbol(newTarget);
            }
            if (newTarget && inputClassSymbolsToClass.has(newTarget)) {
                const memberName = index.getMemberName(insidePropertyDeclaration);
                if (memberName === null) {
                    break problematicReferencesCheck;
                }
                const { derivedMembers, inherited } = inheritanceGraph.checkOverlappingMembers(insidePropertyDeclaration.parent, insidePropertyDeclaration, memberName);
                // Member is not inherited, or derived.
                // Hence the reference is unproblematic and is expected to not
                // cause any type conflicts.
                if (derivedMembers.length === 0 && inherited === undefined) {
                    break problematicReferencesCheck;
                }
                fields.markClassIncompatible(inputClassSymbolsToClass.get(newTarget), exports.ClassIncompatibilityReason.OwningClassReferencedInClassProperty);
            }
        }
    };
    groupedTsAstVisitor.register(visitor);
}

/** Gets all types that are inherited (implemented or extended). */
function getInheritedTypes(node, checker) {
    if (node.heritageClauses === undefined) {
        return [];
    }
    const heritageTypes = [];
    for (const heritageClause of node.heritageClauses) {
        for (const typeNode of heritageClause.types) {
            heritageTypes.push(checker.getTypeFromTypeNode(typeNode));
        }
    }
    return heritageTypes;
}

/**
 * Inheritance graph tracks edges between classes that describe
 * heritage.
 *
 * This graph is helpful for efficient lookups whether e.g. an input
 * is overridden, or inherited etc. This is helpful when detecting
 * and propagating input incompatibility statuses.
 */
class InheritanceGraph {
    checker;
    /** Maps nodes to their parent nodes. */
    classToParents = new Map();
    /** Maps nodes to their derived nodes. */
    parentToChildren = new Map();
    /** All classes seen participating in inheritance chains. */
    allClassesInInheritance = new Set();
    constructor(checker) {
        this.checker = checker;
    }
    /** Registers a given class in the graph. */
    registerClass(clazz, parents) {
        this.classToParents.set(clazz, parents);
        this.allClassesInInheritance.add(clazz);
        for (const parent of parents) {
            this.allClassesInInheritance.add(parent);
            if (!this.parentToChildren.has(parent)) {
                this.parentToChildren.set(parent, []);
            }
            this.parentToChildren.get(parent).push(clazz);
        }
    }
    /**
     * Checks if the given class has overlapping members, either
     * inherited or derived.
     *
     * @returns Symbols of the inherited or derived members, if they exist.
     */
    checkOverlappingMembers(clazz, member, memberName) {
        const inheritedTypes = (this.classToParents.get(clazz) ?? []).map((c) => this.checker.getTypeAtLocation(c));
        const derivedLeafs = this._traceDerivedChainToLeafs(clazz).map((c) => this.checker.getTypeAtLocation(c));
        const inheritedMember = inheritedTypes
            .map((t) => t.getProperty(memberName))
            .find((m) => m !== undefined);
        const derivedMembers = derivedLeafs
            .map((t) => t.getProperty(memberName))
            // Skip members that point back to the current class element. The derived type
            // might look up back to our starting point— which we ignore.
            .filter((m) => m !== undefined && m.valueDeclaration !== member);
        return { inherited: inheritedMember, derivedMembers };
    }
    /** Gets all leaf derived classes that extend from the given class. */
    _traceDerivedChainToLeafs(clazz) {
        const queue = [clazz];
        const leafs = [];
        while (queue.length) {
            const node = queue.shift();
            if (!this.parentToChildren.has(node)) {
                if (node !== clazz) {
                    leafs.push(node);
                }
                continue;
            }
            queue.push(...this.parentToChildren.get(node));
        }
        return leafs;
    }
    /** Gets all derived classes of the given node. */
    traceDerivedClasses(clazz) {
        const queue = [clazz];
        const derived = [];
        while (queue.length) {
            const node = queue.shift();
            if (node !== clazz) {
                derived.push(node);
            }
            if (!this.parentToChildren.has(node)) {
                continue;
            }
            queue.push(...this.parentToChildren.get(node));
        }
        return derived;
    }
    /**
     * Populates the graph.
     *
     * NOTE: This is expensive and should be called with caution.
     */
    expensivePopulate(files) {
        for (const file of files) {
            const visitor = (node) => {
                if ((ts__default["default"].isClassLike(node) || ts__default["default"].isInterfaceDeclaration(node)) &&
                    node.heritageClauses !== undefined) {
                    const heritageTypes = getInheritedTypes(node, this.checker);
                    const parents = heritageTypes
                        // Interfaces participate in the graph and are not "value declarations".
                        // Also, symbol may be undefined for unresolvable nodes.
                        .map((t) => (t.symbol ? t.symbol.declarations?.[0] : undefined))
                        .filter((d) => d !== undefined && (ts__default["default"].isClassLike(d) || ts__default["default"].isInterfaceDeclaration(d)));
                    this.registerClass(node, parents);
                }
                ts__default["default"].forEachChild(node, visitor);
            };
            ts__default["default"].forEachChild(file, visitor);
        }
        return this;
    }
}

/**
 * Class that allows for efficient grouping of TypeScript node AST
 * traversal.
 *
 * Allows visitors to execute in a single pass when visiting all
 * children of source files.
 */
class GroupedTsAstVisitor {
    files;
    visitors = [];
    doneFns = [];
    constructor(files) {
        this.files = files;
    }
    state = {
        insidePropertyDeclaration: null,
    };
    register(visitor, done) {
        this.visitors.push(visitor);
        if (done !== undefined) {
            this.doneFns.push(done);
        }
    }
    execute() {
        const visitor = (node) => {
            for (const v of this.visitors) {
                v(node);
            }
            if (ts__default["default"].isPropertyDeclaration(node)) {
                this.state.insidePropertyDeclaration = node;
                ts__default["default"].forEachChild(node, visitor);
                this.state.insidePropertyDeclaration = null;
            }
            else {
                ts__default["default"].forEachChild(node, visitor);
            }
        };
        for (const file of this.files) {
            ts__default["default"].forEachChild(file, visitor);
        }
        for (const doneFn of this.doneFns) {
            doneFn();
        }
        this.visitors = [];
    }
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
function checkInheritanceOfKnownFields(inheritanceGraph, metaRegistry, fields, opts) {
    const allInputClasses = Array.from(inheritanceGraph.allClassesInInheritance).filter((t) => ts__default["default"].isClassDeclaration(t) && opts.isClassWithKnownFields(t));
    for (const inputClass of allInputClasses) {
        // Note: Class parents of `inputClass` were already checked by
        // the previous iterations (given the reverse topological sort)—
        // hence it's safe to assume that incompatibility of parent classes will
        // not change again, at a later time.
        assert__default["default"](ts__default["default"].isClassDeclaration(inputClass), 'Expected input graph node to be always a class.');
        const classFields = opts.getFieldsForClass(inputClass);
        const inputFieldNamesFromMetadataArray = new Set();
        // Iterate through derived class chains and determine all inputs that are overridden
        // via class metadata fields. e.g `@Component#inputs`. This is later used to mark a
        // potential similar class input as incompatible— because those cannot be migrated.
        if (metaRegistry !== null) {
            for (const derivedClasses of inheritanceGraph.traceDerivedClasses(inputClass)) {
                const derivedMeta = ts__default["default"].isClassDeclaration(derivedClasses) && derivedClasses.name !== undefined
                    ? metaRegistry.getDirectiveMetadata(new checker.Reference(derivedClasses))
                    : null;
                if (derivedMeta !== null && derivedMeta.inputFieldNamesFromMetadataArray !== null) {
                    derivedMeta.inputFieldNamesFromMetadataArray.forEach((b) => inputFieldNamesFromMetadataArray.add(b));
                }
            }
        }
        // Check inheritance of every input in the given "directive class".
        inputCheck: for (const fieldDescr of classFields) {
            const inputNode = fieldDescr.node;
            const { derivedMembers, inherited } = inheritanceGraph.checkOverlappingMembers(inputClass, inputNode, index.getMemberName(inputNode));
            // If we discover a derived, input re-declared via class metadata, then it
            // will cause conflicts as we cannot migrate it/ nor mark it as signal-based.
            if (fieldDescr.node.name !== undefined &&
                (ts__default["default"].isIdentifier(fieldDescr.node.name) || ts__default["default"].isStringLiteralLike(fieldDescr.node.name)) &&
                inputFieldNamesFromMetadataArray.has(fieldDescr.node.name.text)) {
                fields.captureUnknownDerivedField(fieldDescr);
            }
            for (const derived of derivedMembers) {
                const derivedInput = fields.attemptRetrieveDescriptorFromSymbol(derived);
                if (derivedInput !== null) {
                    // Note: We always track dependencies from the child to the parent,
                    // so skip here for now.
                    continue;
                }
                // If we discover a derived, non-input member, then it will cause
                // conflicts, and we mark the current input as incompatible.
                fields.captureUnknownDerivedField(fieldDescr);
                continue inputCheck;
            }
            // If there is no parent, we are done. Otherwise, check the parent
            // to either inherit or check the incompatibility with the inheritance.
            if (inherited === undefined) {
                continue;
            }
            const inheritedMemberInput = fields.attemptRetrieveDescriptorFromSymbol(inherited);
            // Parent is not an input, and hence will conflict..
            if (inheritedMemberInput === null) {
                fields.captureUnknownParentField(fieldDescr);
                continue;
            }
            fields.captureKnownFieldInheritanceRelationship(fieldDescr, inheritedMemberInput);
        }
    }
}

function removeFromUnionIfPossible(union, filter) {
    const filtered = union.types.filter(filter);
    if (filtered.length === union.types.length) {
        return union;
    }
    // If there is only item at this point, avoid the union structure.
    if (filtered.length === 1) {
        return filtered[0];
    }
    return ts__default["default"].factory.updateUnionTypeNode(union, ts__default["default"].factory.createNodeArray(filtered));
}

/**
 * Inserts a leading string for the given node, respecting
 * indentation of the given anchor node.
 *
 * Useful for inserting TODOs.
 */
function insertPrecedingLine(node, info, text) {
    const leadingSpace = leading_space.getLeadingLineWhitespaceOfNode(node);
    return new apply_import_manager.Replacement(apply_import_manager.projectFile(node.getSourceFile(), info), new apply_import_manager.TextUpdate({
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

/**
 * Gets human-readable message information for the given field incompatibility.
 * This text will be used by the language service, or CLI-based migration.
 */
function getMessageForFieldIncompatibility(reason, fieldName) {
    switch (reason) {
        case exports.FieldIncompatibilityReason.Accessor:
            return {
                short: `Accessor ${fieldName.plural} cannot be migrated as they are too complex.`,
                extra: 'The migration potentially requires usage of `effect` or `computed`, but ' +
                    'the intent is unclear. The migration cannot safely migrate.',
            };
        case exports.FieldIncompatibilityReason.OverriddenByDerivedClass:
            return {
                short: `The ${fieldName.single} cannot be migrated because the field is overridden by a subclass.`,
                extra: 'The field in the subclass is not a signal, so migrating would break your build.',
            };
        case exports.FieldIncompatibilityReason.ParentIsIncompatible:
            return {
                short: `This ${fieldName.single} is inherited from a superclass, but the parent cannot be migrated.`,
                extra: 'Migrating this field would cause your build to fail.',
            };
        case exports.FieldIncompatibilityReason.DerivedIsIncompatible:
            return {
                short: `This ${fieldName.single} cannot be migrated because the field is overridden by a subclass.`,
                extra: 'The field in the subclass is incompatible for migration, so migrating this field would ' +
                    'break your build.',
            };
        case exports.FieldIncompatibilityReason.SignalIncompatibleWithHostBinding:
            return {
                short: `This ${fieldName.single} is used in combination with \`@HostBinding\` and ` +
                    `migrating would break.`,
                extra: `\`@HostBinding\` does not invoke the signal automatically and your code would ` +
                    `break after migration. Use \`host\` of \`@Directive\`/\`@Component\`for host bindings.`,
            };
        case exports.FieldIncompatibilityReason.PotentiallyNarrowedInTemplateButNoSupportYet:
            return {
                short: `This ${fieldName.single} is used in a control flow expression (e.g. \`@if\` or \`*ngIf\`) and ` +
                    'migrating would break narrowing currently.',
                extra: `In the future, Angular intends to support narrowing of signals.`,
            };
        case exports.FieldIncompatibilityReason.RedeclaredViaDerivedClassInputsArray:
            return {
                short: `The ${fieldName.single} is overridden by a subclass that cannot be migrated.`,
                extra: `The subclass overrides this ${fieldName.single} via the \`inputs\` array in @Directive/@Component. ` +
                    'Migrating the field would break your build because the subclass field cannot be a signal.',
            };
        case exports.FieldIncompatibilityReason.SignalInput__RequiredButNoGoodExplicitTypeExtractable:
            return {
                short: `Input is required, but the migration cannot determine a good type for the input.`,
                extra: 'Consider adding an explicit type to make the migration possible.',
            };
        case exports.FieldIncompatibilityReason.SignalInput__QuestionMarkButNoGoodExplicitTypeExtractable:
            return {
                short: `Input is marked with a question mark. Migration could not determine a good type for the input.`,
                extra: 'The migration needs to be able to resolve a type, so that it can include `undefined` in your type. ' +
                    'Consider adding an explicit type to make the migration possible.',
            };
        case exports.FieldIncompatibilityReason.SignalQueries__QueryListProblematicFieldAccessed:
            return {
                short: `There are references to this query that cannot be migrated automatically.`,
                extra: "For example, it's not possible to migrate `.changes` or `.dirty` trivially.",
            };
        case exports.FieldIncompatibilityReason.SignalQueries__IncompatibleMultiUnionType:
            return {
                short: `Query type is too complex to automatically migrate.`,
                extra: "The new query API doesn't allow us to migrate safely without breaking your app.",
            };
        case exports.FieldIncompatibilityReason.SkippedViaConfigFilter:
            return {
                short: `This ${fieldName.single} is not part of the current migration scope.`,
                extra: 'Skipped via migration config.',
            };
        case exports.FieldIncompatibilityReason.SpyOnThatOverwritesField:
            return {
                short: 'A jasmine `spyOn` call spies on this field. This breaks with signals.',
                extra: `Migration cannot safely migrate as "spyOn" writes to the ${fieldName.single}. ` +
                    `Signal ${fieldName.plural} are readonly.`,
            };
        case exports.FieldIncompatibilityReason.TypeConflictWithBaseClass:
            return {
                short: `This ${fieldName.single} overrides a field from a superclass, while the superclass ` +
                    `field is not migrated.`,
                extra: 'Migrating the field would break your build because of a type conflict.',
            };
        case exports.FieldIncompatibilityReason.WriteAssignment:
            return {
                short: `Your application code writes to the ${fieldName.single}. This prevents migration.`,
                extra: `Signal ${fieldName.plural} are readonly, so migrating would break your build.`,
            };
        case exports.FieldIncompatibilityReason.OutsideOfMigrationScope:
            return {
                short: `This ${fieldName.single} is not part of any source files in your project.`,
                extra: `The migration excludes ${fieldName.plural} if no source file declaring them was seen.`,
            };
    }
}
/**
 * Gets human-readable message information for the given class incompatibility.
 * This text will be used by the language service, or CLI-based migration.
 */
function getMessageForClassIncompatibility(reason, fieldName) {
    switch (reason) {
        case exports.ClassIncompatibilityReason.OwningClassReferencedInClassProperty:
            return {
                short: `Class of this ${fieldName.single} is referenced in the signature of another class.`,
                extra: 'The other class is likely typed to expect a non-migrated field, so ' +
                    'migration is skipped to not break your build.',
            };
        case exports.ClassIncompatibilityReason.ClassManuallyInstantiated:
            return {
                short: `Class of this ${fieldName.single} is manually instantiated. ` +
                    'This is discouraged and prevents migration.',
                extra: `Signal ${fieldName.plural} require a DI injection context. Manually instantiating ` +
                    'breaks this requirement in some cases, so the migration is skipped.',
            };
    }
}

/**
 * Inserts a TODO for the incompatibility blocking the given node
 * from being migrated.
 */
function insertTodoForIncompatibility(node, programInfo, incompatibility, fieldName) {
    // If a field is skipped via config filter or outside migration scope, do not
    // insert TODOs, as this could results in lots of unnecessary comments.
    if (isFieldIncompatibility(incompatibility) &&
        (incompatibility.reason === exports.FieldIncompatibilityReason.SkippedViaConfigFilter ||
            incompatibility.reason === exports.FieldIncompatibilityReason.OutsideOfMigrationScope)) {
        return [];
    }
    const message = isFieldIncompatibility(incompatibility)
        ? getMessageForFieldIncompatibility(incompatibility.reason, fieldName).short
        : getMessageForClassIncompatibility(incompatibility, fieldName).short;
    const lines = cutStringToLineLimit(message, 70);
    return [
        insertPrecedingLine(node, programInfo, `// TODO: Skipped for migration because:`),
        ...lines.map((line) => insertPrecedingLine(node, programInfo, `//  ${line}`)),
    ];
}

/** Whether the given node is a descendant of the given ancestor. */
function isNodeDescendantOf(node, ancestor) {
    while (node) {
        if (node === ancestor)
            return true;
        node = node.parent;
    }
    return false;
}

/** Symbol that can be used to mark a variable as reserved, synthetically. */
const ReservedMarker = Symbol();
/**
 * Gets whether the given identifier name is free for use in the
 * given location, avoiding shadowed variable names.
 *
 */
function isIdentifierFreeInScope(name, location) {
    const startContainer = findClosestParentLocalsContainer(location);
    assert__default["default"](startContainer !== undefined, 'Expecting a locals container.');
    // Traverse up and check for potential collisions.
    let container = startContainer;
    let firstNextContainer = undefined;
    while (container !== undefined) {
        if (!isIdentifierFreeInContainer(name, container)) {
            return null;
        }
        if (firstNextContainer === undefined && container.nextContainer !== undefined) {
            firstNextContainer = container.nextContainer;
        }
        container = findClosestParentLocalsContainer(container.parent);
    }
    // Check descendent local containers to avoid shadowing variables.
    // Note that this is not strictly needed, but it's helping avoid
    // some lint errors, like TSLint's no shadowed variables.
    container = firstNextContainer;
    while (container && isNodeDescendantOf(container, startContainer)) {
        if (!isIdentifierFreeInContainer(name, container)) {
            return null;
        }
        container = container.nextContainer;
    }
    return { container: startContainer };
}
/** Finds the closest parent locals container. */
function findClosestParentLocalsContainer(node) {
    return ts__default["default"].findAncestor(node, isLocalsContainer);
}
/** Whether the given identifier is free in the given locals container. */
function isIdentifierFreeInContainer(name, container) {
    if (container.locals === undefined || !container.locals.has(name)) {
        return true;
    }
    // We consider alias symbols as locals conservatively.
    // Note: This check is similar to the check by the TypeScript emitter.
    // typescript/stable/src/compiler/emitter.ts;l=5436;rcl=651008033
    const local = container.locals.get(name);
    return (local !== ReservedMarker &&
        !(local.flags & (ts__default["default"].SymbolFlags.Value | ts__default["default"].SymbolFlags.ExportValue | ts__default["default"].SymbolFlags.Alias)));
}
/**
 * Whether the given node can contain local variables.
 *
 * Note: This is similar to TypeScript's `canHaveLocals` internal helper.
 * typescript/stable/src/compiler/utilitiesPublic.ts;l=2265;rcl=651008033
 */
function isLocalsContainer(node) {
    switch (node.kind) {
        case ts__default["default"].SyntaxKind.ArrowFunction:
        case ts__default["default"].SyntaxKind.Block:
        case ts__default["default"].SyntaxKind.CallSignature:
        case ts__default["default"].SyntaxKind.CaseBlock:
        case ts__default["default"].SyntaxKind.CatchClause:
        case ts__default["default"].SyntaxKind.ClassStaticBlockDeclaration:
        case ts__default["default"].SyntaxKind.ConditionalType:
        case ts__default["default"].SyntaxKind.Constructor:
        case ts__default["default"].SyntaxKind.ConstructorType:
        case ts__default["default"].SyntaxKind.ConstructSignature:
        case ts__default["default"].SyntaxKind.ForStatement:
        case ts__default["default"].SyntaxKind.ForInStatement:
        case ts__default["default"].SyntaxKind.ForOfStatement:
        case ts__default["default"].SyntaxKind.FunctionDeclaration:
        case ts__default["default"].SyntaxKind.FunctionExpression:
        case ts__default["default"].SyntaxKind.FunctionType:
        case ts__default["default"].SyntaxKind.GetAccessor:
        case ts__default["default"].SyntaxKind.IndexSignature:
        case ts__default["default"].SyntaxKind.JSDocCallbackTag:
        case ts__default["default"].SyntaxKind.JSDocEnumTag:
        case ts__default["default"].SyntaxKind.JSDocFunctionType:
        case ts__default["default"].SyntaxKind.JSDocSignature:
        case ts__default["default"].SyntaxKind.JSDocTypedefTag:
        case ts__default["default"].SyntaxKind.MappedType:
        case ts__default["default"].SyntaxKind.MethodDeclaration:
        case ts__default["default"].SyntaxKind.MethodSignature:
        case ts__default["default"].SyntaxKind.ModuleDeclaration:
        case ts__default["default"].SyntaxKind.SetAccessor:
        case ts__default["default"].SyntaxKind.SourceFile:
        case ts__default["default"].SyntaxKind.TypeAliasDeclaration:
            return true;
        default:
            return false;
    }
}

/**
 * Helper that can generate unique identifier names at a
 * given location.
 *
 * Used for generating unique names to extract input reads
 * to support narrowing.
 */
class UniqueNamesGenerator {
    fallbackSuffixes;
    constructor(fallbackSuffixes) {
        this.fallbackSuffixes = fallbackSuffixes;
    }
    generate(base, location) {
        const checkNameAndClaimIfAvailable = (name) => {
            const freeInfo = isIdentifierFreeInScope(name, location);
            if (freeInfo === null) {
                return false;
            }
            // Claim the locals to avoid conflicts with future generations.
            freeInfo.container.locals ??= new Map();
            freeInfo.container.locals.set(name, ReservedMarker);
            return true;
        };
        // Check the base name. Ideally, we'd use this one.
        if (checkNameAndClaimIfAvailable(base)) {
            return base;
        }
        // Try any of the possible suffixes.
        for (const suffix of this.fallbackSuffixes) {
            const name = `${base}${suffix}`;
            if (checkNameAndClaimIfAvailable(name)) {
                return name;
            }
        }
        // Worst case, suffix the base name with a unique number until
        // we find an available name.
        let name = null;
        let counter = 1;
        do {
            name = `${base}_${counter++}`;
        } while (!checkNameAndClaimIfAvailable(name));
        return name;
    }
}

/**
 * Creates replacements to insert the given statement as
 * first statement into the arrow function.
 *
 * The arrow function is converted to a block-based arrow function
 * that can hold multiple statements. The original expression is
 * simply returned like before.
 */
function createNewBlockToInsertVariable(node, file, toInsert) {
    const sf = node.getSourceFile();
    // For indentation, we traverse up and find the earliest statement.
    // This node is most of the time a good candidate for acceptable
    // indentation of a new block.
    const spacingNode = ts__default["default"].findAncestor(node, ts__default["default"].isStatement) ?? node.parent;
    const { character } = ts__default["default"].getLineAndCharacterOfPosition(sf, spacingNode.getStart());
    const blockSpace = ' '.repeat(character);
    const contentSpace = ' '.repeat(character + 2);
    return [
        // Delete leading whitespace of the concise body.
        new apply_import_manager.Replacement(file, new apply_import_manager.TextUpdate({
            position: node.body.getFullStart(),
            end: node.body.getStart(),
            toInsert: '',
        })),
        // Insert leading block braces, and `toInsert` content.
        // Wrap the previous expression in a return now.
        new apply_import_manager.Replacement(file, new apply_import_manager.TextUpdate({
            position: node.body.getStart(),
            end: node.body.getStart(),
            toInsert: ` {\n${contentSpace}${toInsert}\n${contentSpace}return `,
        })),
        // Add trailing brace.
        new apply_import_manager.Replacement(file, new apply_import_manager.TextUpdate({
            position: node.body.getEnd(),
            end: node.body.getEnd(),
            toInsert: `;\n${blockSpace}}`,
        })),
    ];
}

/**
 * Migrates a binding element that refers to an Angular input.
 *
 * E.g. `const {myInput} = this`.
 *
 * For references in binding elements, we extract the element into a variable
 * where we unwrap the input. This ensures narrowing naturally works in subsequent
 * places, and we also don't need to detect potential aliases.
 *
 * ```ts
 *   const {myInput} = this;
 *   // turns into
 *   const {myInput: myInputValue} = this;
 *   const myInput = myInputValue();
 * ```
 */
function migrateBindingElementInputReference(tsReferencesInBindingElements, info, replacements, printer) {
    const nameGenerator = new UniqueNamesGenerator(['Input', 'Signal', 'Ref']);
    for (const reference of tsReferencesInBindingElements) {
        const bindingElement = reference.parent;
        const bindingDecl = index.getBindingElementDeclaration(bindingElement);
        const sourceFile = bindingElement.getSourceFile();
        const file = apply_import_manager.projectFile(sourceFile, info);
        const inputFieldName = bindingElement.propertyName ?? bindingElement.name;
        assert__default["default"](!ts__default["default"].isObjectBindingPattern(inputFieldName) && !ts__default["default"].isArrayBindingPattern(inputFieldName), 'Property of binding element cannot be another pattern.');
        const tmpName = nameGenerator.generate(reference.text, bindingElement);
        // Only use the temporary name, if really needed. A temporary name is needed if
        // the input field simply aliased via the binding element, or if the exposed identifier
        // is a string-literal like.
        const useTmpNameForInputField = !ts__default["default"].isObjectBindingPattern(bindingElement.name) || !ts__default["default"].isIdentifier(inputFieldName);
        const propertyName = useTmpNameForInputField ? inputFieldName : undefined;
        const exposedName = useTmpNameForInputField
            ? ts__default["default"].factory.createIdentifier(tmpName)
            : inputFieldName;
        const newBindingToAccessInputField = ts__default["default"].factory.updateBindingElement(bindingElement, bindingElement.dotDotDotToken, propertyName, exposedName, bindingElement.initializer);
        const temporaryVariableReplacements = insertTemporaryVariableForBindingElement(bindingDecl, file, `const ${bindingElement.name.getText()} = ${exposedName.text}();`);
        if (temporaryVariableReplacements === null) {
            console.error(`Could not migrate reference ${reference.text} in ${file.rootRelativePath}`);
            continue;
        }
        replacements.push(new apply_import_manager.Replacement(file, new apply_import_manager.TextUpdate({
            position: bindingElement.getStart(),
            end: bindingElement.getEnd(),
            toInsert: printer.printNode(ts__default["default"].EmitHint.Unspecified, newBindingToAccessInputField, sourceFile),
        })), ...temporaryVariableReplacements);
    }
}
/**
 * Inserts the given code snippet after the given variable or
 * parameter declaration.
 *
 * If this is a parameter of an arrow function, a block may be
 * added automatically.
 */
function insertTemporaryVariableForBindingElement(expansionDecl, file, toInsert) {
    const sf = expansionDecl.getSourceFile();
    const parent = expansionDecl.parent;
    // The snippet is simply inserted after the variable declaration.
    // The other case of a variable declaration inside a catch clause is handled
    // below.
    if (ts__default["default"].isVariableDeclaration(expansionDecl) && ts__default["default"].isVariableDeclarationList(parent)) {
        const leadingSpaceCount = ts__default["default"].getLineAndCharacterOfPosition(sf, parent.getStart()).character;
        const leadingSpace = ' '.repeat(leadingSpaceCount);
        const statement = parent.parent;
        return [
            new apply_import_manager.Replacement(file, new apply_import_manager.TextUpdate({
                position: statement.getEnd(),
                end: statement.getEnd(),
                toInsert: `\n${leadingSpace}${toInsert}`,
            })),
        ];
    }
    // If we are dealing with a object expansion inside a parameter of
    // a function-like declaration w/ block, add the variable as the first
    // node inside the block.
    const bodyBlock = getBodyBlockOfNode(parent);
    if (bodyBlock !== null) {
        const firstElementInBlock = bodyBlock.statements[0];
        const spaceReferenceNode = firstElementInBlock ?? bodyBlock;
        const spaceOffset = firstElementInBlock !== undefined ? 0 : 2;
        const leadingSpaceCount = ts__default["default"].getLineAndCharacterOfPosition(sf, spaceReferenceNode.getStart()).character + spaceOffset;
        const leadingSpace = ' '.repeat(leadingSpaceCount);
        return [
            new apply_import_manager.Replacement(file, new apply_import_manager.TextUpdate({
                position: bodyBlock.getStart() + 1,
                end: bodyBlock.getStart() + 1,
                toInsert: `\n${leadingSpace}${toInsert}`,
            })),
        ];
    }
    // Other cases where we see an arrow function without a block.
    // We need to create one now.
    if (ts__default["default"].isArrowFunction(parent) && !ts__default["default"].isBlock(parent.body)) {
        return createNewBlockToInsertVariable(parent, file, toInsert);
    }
    return null;
}
/** Gets the body block of a given node, if available. */
function getBodyBlockOfNode(node) {
    if ((ts__default["default"].isMethodDeclaration(node) ||
        ts__default["default"].isFunctionDeclaration(node) ||
        ts__default["default"].isGetAccessorDeclaration(node) ||
        ts__default["default"].isConstructorDeclaration(node) ||
        ts__default["default"].isArrowFunction(node)) &&
        node.body !== undefined &&
        ts__default["default"].isBlock(node.body)) {
        return node.body;
    }
    if (ts__default["default"].isCatchClause(node.parent)) {
        return node.parent.block;
    }
    return null;
}

/**
 * Whether the given node represents a control flow container boundary.
 * E.g. variables cannot be narrowed when descending into children of `node`.
 */
function isControlFlowBoundary(node) {
    return ((ts__default["default"].isFunctionLike(node) && !getImmediatelyInvokedFunctionExpression(node)) ||
        node.kind === ts__default["default"].SyntaxKind.ModuleBlock ||
        node.kind === ts__default["default"].SyntaxKind.SourceFile ||
        node.kind === ts__default["default"].SyntaxKind.PropertyDeclaration);
}
/** Determines the current flow container of a given node. */
function getControlFlowContainer(node) {
    return ts__default["default"].findAncestor(node.parent, (node) => isControlFlowBoundary(node));
}
/** Checks whether the given node refers to an IIFE declaration. */
function getImmediatelyInvokedFunctionExpression(func) {
    if (func.kind === ts__default["default"].SyntaxKind.FunctionExpression || func.kind === ts__default["default"].SyntaxKind.ArrowFunction) {
        let prev = func;
        let parent = func.parent;
        while (parent.kind === ts__default["default"].SyntaxKind.ParenthesizedExpression) {
            prev = parent;
            parent = parent.parent;
        }
        if (parent.kind === ts__default["default"].SyntaxKind.CallExpression &&
            parent.expression === prev) {
            return parent;
        }
    }
    return undefined;
}

/** @internal */
var FlowFlags;
(function (FlowFlags) {
    FlowFlags[FlowFlags["Unreachable"] = 1] = "Unreachable";
    FlowFlags[FlowFlags["Start"] = 2] = "Start";
    FlowFlags[FlowFlags["BranchLabel"] = 4] = "BranchLabel";
    FlowFlags[FlowFlags["LoopLabel"] = 8] = "LoopLabel";
    FlowFlags[FlowFlags["Assignment"] = 16] = "Assignment";
    FlowFlags[FlowFlags["TrueCondition"] = 32] = "TrueCondition";
    FlowFlags[FlowFlags["FalseCondition"] = 64] = "FalseCondition";
    FlowFlags[FlowFlags["SwitchClause"] = 128] = "SwitchClause";
    FlowFlags[FlowFlags["ArrayMutation"] = 256] = "ArrayMutation";
    FlowFlags[FlowFlags["Call"] = 512] = "Call";
    FlowFlags[FlowFlags["ReduceLabel"] = 1024] = "ReduceLabel";
    FlowFlags[FlowFlags["Referenced"] = 2048] = "Referenced";
    FlowFlags[FlowFlags["Shared"] = 4096] = "Shared";
    FlowFlags[FlowFlags["Label"] = 12] = "Label";
    FlowFlags[FlowFlags["Condition"] = 96] = "Condition";
})(FlowFlags || (FlowFlags = {}));

/**
 * Traverses the graph of the TypeScript flow nodes, exploring all possible branches
 * and keeps track of interesting nodes that may contribute to "narrowing".
 *
 * This allows us to figure out which nodes may be narrowed or not, and need
 * temporary variables in the migration to allowing narrowing to continue working.
 *
 * Some resources on flow nodes by TypeScript:
 * https://effectivetypescript.com/2024/03/24/flownodes/.
 */
function traverseFlowForInterestingNodes(flow) {
    let flowDepth = 0;
    let interestingNodes = [];
    const queue = new Set([flow]);
    // Queue is evolved during iteration, and new items will be added
    // to the end of the iteration. Effectively implementing a queue
    // with deduping out of the box.
    for (const flow of queue) {
        if (++flowDepth === 2000) {
            // We have made 2000 recursive invocations. To avoid overflowing the call stack we report an
            // error and disable further control flow analysis in the containing function or module body.
            return interestingNodes;
        }
        const flags = flow.flags;
        if (flags & FlowFlags.Assignment) {
            const assignment = flow;
            queue.add(assignment.antecedent);
            if (ts__default["default"].isVariableDeclaration(assignment.node)) {
                interestingNodes.push(assignment.node.name);
            }
            else if (ts__default["default"].isBindingElement(assignment.node)) {
                interestingNodes.push(assignment.node.name);
            }
            else {
                interestingNodes.push(assignment.node);
            }
        }
        else if (flags & FlowFlags.Call) {
            queue.add(flow.antecedent);
            // Arguments can be narrowed using `FlowCall`s.
            // See: node_modules/typescript/stable/src/compiler/checker.ts;l=28786-28810
            interestingNodes.push(...flow.node.arguments);
        }
        else if (flags & FlowFlags.Condition) {
            queue.add(flow.antecedent);
            interestingNodes.push(flow.node);
        }
        else if (flags & FlowFlags.SwitchClause) {
            queue.add(flow.antecedent);
            // The switch expression can be narrowed, so it's an interesting node.
            interestingNodes.push(flow.node.switchStatement.expression);
        }
        else if (flags & FlowFlags.Label) {
            // simple label, a single ancestor.
            if (flow.antecedent?.length === 1) {
                queue.add(flow.antecedent[0]);
                continue;
            }
            if (flags & FlowFlags.BranchLabel) {
                // Normal branches. e.g. switch.
                for (const f of flow.antecedent ?? []) {
                    queue.add(f);
                }
            }
            else {
                // Branch for loops.
                // The first antecedent always points to the flow node before the loop
                // was entered. All other narrowing expressions, if present, are direct
                // antecedents of the starting flow node, so we only need to look at the first.
                // See: node_modules/typescript/stable/src/compiler/checker.ts;l=28108-28109
                queue.add(flow.antecedent[0]);
            }
        }
        else if (flags & FlowFlags.ArrayMutation) {
            queue.add(flow.antecedent);
            // Array mutations are never interesting for inputs, as we cannot migrate
            // assignments to inputs.
        }
        else if (flags & FlowFlags.ReduceLabel) {
            // reduce label is a try/catch re-routing.
            // visit all possible branches.
            // TODO: explore this more.
            // See: node_modules/typescript/stable/src/compiler/binder.ts;l=1636-1649.
            queue.add(flow.antecedent);
            for (const f of flow.node.antecedents) {
                queue.add(f);
            }
        }
        else if (flags & FlowFlags.Start) {
            // Note: TS itself only ever continues with parent control flows, if the pre-determined `flowContainer`
            // of the referenced is different. E.g. narrowing might decide to choose a higher flow container if we
            // reference a constant. In which case, TS allows escaping the flow container for narrowing. See:
            // http://google3/third_party/javascript/node_modules/typescript/stable/src/compiler/checker.ts;l=29399-29414;rcl=623599846.
            // and TypeScript's `narrowedConstInMethod` baseline test.
            // --> We don't need this as an input cannot be a constant!
            return interestingNodes;
        }
        else {
            break;
        }
    }
    return null;
}
/** Gets the flow node for the given node. */
function getFlowNode(node) {
    return node.flowNode ?? null;
}

/**
 * Analyzes the control flow of a list of references and returns
 * information about which nodes can be shared via a temporary variable
 * to enable narrowing.
 *
 * E.g. consider the following snippet:
 *
 * ```ts
 * someMethod() {
 *   if (this.bla) {
 *     this.bla.charAt(0);
 *   }
 * }
 * ```
 *
 * The analysis would inform the caller that `this.bla.charAt` can
 * be shared with the `this.bla` of the `if` condition.
 *
 * This is useful for the signal migration as it allows us to efficiently,
 * and minimally transform references into shared variables where needed.
 * Needed because signals are not narrowable by default, as they are functions.
 */
function analyzeControlFlow(entries, checker) {
    const result = [];
    const referenceToMetadata = new Map();
    // Prepare easy lookups for reference nodes to flow info.
    for (const [idx, entry] of entries.entries()) {
        const flowContainer = getControlFlowContainer(entry);
        referenceToMetadata.set(entry, {
            flowContainer,
            resultIndex: idx,
        });
        result.push({
            flowContainer,
            id: idx,
            originalNode: entry,
            recommendedNode: 'preserve',
        });
    }
    for (const entry of entries) {
        const { flowContainer, resultIndex } = referenceToMetadata.get(entry);
        const flowPathInterestingNodes = traverseFlowForInterestingNodes(getFlowNode(entry));
        assert__default["default"](flowContainer !== null && flowPathInterestingNodes !== null, 'Expected a flow container to exist.');
        const narrowPartners = getAllMatchingReferencesInFlowPath(flowPathInterestingNodes, entry, referenceToMetadata, flowContainer, checker);
        if (narrowPartners.length !== 0) {
            connectSharedReferences(result, narrowPartners, resultIndex);
        }
    }
    return result;
}
/**
 * Iterates through all partner flow nodes and connects them so that
 * the first node will act as the share partner, while all subsequent
 * nodes will point to the share node.
 */
function connectSharedReferences(result, flowPartners, refId) {
    const refFlowContainer = result[refId].flowContainer;
    // Inside the list of flow partners (i.e. references to the same target),
    // find the node that is the first one in the flow container (via its start pos).
    let earliestPartner = null;
    let earliestPartnerId = null;
    for (const partnerId of flowPartners) {
        if (earliestPartner === null ||
            result[partnerId].originalNode.getStart() < earliestPartner.getStart()) {
            earliestPartner = result[partnerId].originalNode;
            earliestPartnerId = partnerId;
        }
    }
    assert__default["default"](earliestPartner !== null, 'Expected an earliest partner to be found.');
    assert__default["default"](earliestPartnerId !== null, 'Expected an earliest partner to be found.');
    // Earliest partner ID could be higher than `refId` in cyclic
    // situations like `loop` flow nodes. We need to find the minimum
    // and maximum to iterate through partners in between.
    const min = Math.min(earliestPartnerId, refId);
    const max = Math.max(earliestPartnerId, refId);
    // Then, incorporate all similar references (or flow nodes) in between
    // the reference and the earliest partner. References in between can also
    // use the shared flow node and not preserve their original reference— as
    // this would be rather unreadable and inefficient.
    const seenBlocks = new Set();
    let highestBlock = null;
    for (let i = min; i <= max; i++) {
        // Different flow container captured sequentially in result. Ignore.
        if (result[i].flowContainer !== refFlowContainer) {
            continue;
        }
        // Iterate up the block, find the highest block within the flow container.
        let current = result[i].originalNode.parent;
        while (current !== undefined) {
            if (isPotentialInsertionAncestor(current)) {
                // If we saw this block already, it is a common ancestor from another
                // partner. Check if it would be higher than the current highest block;
                // and choose it accordingly.
                if (seenBlocks.has(current)) {
                    if (highestBlock === null || current.getStart() < highestBlock.getStart()) {
                        highestBlock = current;
                    }
                    break;
                }
                seenBlocks.add(current);
            }
            current = current.parent;
        }
        if (i !== earliestPartnerId) {
            result[i].recommendedNode = earliestPartnerId;
        }
    }
    if (!highestBlock) {
        console.error(earliestPartnerId, refId, refFlowContainer.getText(), seenBlocks);
    }
    assert__default["default"](highestBlock, 'Expected a block anchor to be found');
    result[earliestPartnerId].recommendedNode = highestBlock;
}
function isPotentialInsertionAncestor(node) {
    // Note: Arrow functions may not have a block, but instead use an expression
    // directly. This still signifies a "block" as we can convert the concise body
    // to a block.
    return (ts__default["default"].isSourceFile(node) || ts__default["default"].isBlock(node) || ts__default["default"].isArrowFunction(node) || ts__default["default"].isClassLike(node));
}
/**
 * Looks through the flow path and interesting nodes to determine which
 * of the potential "interesting" nodes point to the same reference.
 *
 * These nodes are then considered "partners" and will be returned via
 * their IDs (or practically their result indices).
 */
function getAllMatchingReferencesInFlowPath(flowPathInterestingNodes, reference, referenceToMetadata, restrainingFlowContainer, checker) {
    const partners = [];
    for (const flowNode of flowPathInterestingNodes) {
        // quick naive perf-optimized check to see if the flow node has a potential
        // similar reference.
        if (!flowNode.getText().includes(reference.getText())) {
            continue;
        }
        const similarRefNodeId = findSimilarReferenceNode(flowNode, reference, referenceToMetadata, restrainingFlowContainer, checker);
        if (similarRefNodeId !== null) {
            partners.push(similarRefNodeId);
        }
    }
    return partners;
}
/**
 * Checks if the given node contains an identifier that
 * matches the given reference. If so, returns its flow ID.
 */
function findSimilarReferenceNode(start, reference, referenceToMetadata, restrainingFlowContainer, checker) {
    return (ts__default["default"].forEachChild(start, function visitChild(node) {
        // do not descend into control flow boundaries.
        // only references sharing the same container are relevant.
        // This is a performance optimization.
        if (isControlFlowBoundary(node)) {
            return;
        }
        // If this is not a potential matching identifier, check its children.
        if (!ts__default["default"].isIdentifier(node) ||
            referenceToMetadata.get(node)?.flowContainer !== restrainingFlowContainer) {
            return ts__default["default"].forEachChild(node, visitChild);
        }
        // If this refers to a different instantiation of the input reference,
        // continue looking.
        if (!isLexicalSameReference(checker, node, reference)) {
            return;
        }
        return { idx: referenceToMetadata.get(node).resultIndex };
    })?.idx ?? null);
}
/**
 * Checks whether a given identifier is lexically equivalent.
 * e.g. checks that they have similar property receiver accesses.
 */
function isLexicalSameReference(checker, sharePartner, reference) {
    const aParent = index.unwrapParent(reference.parent);
    // If the reference is not part a property access, return true. The references
    // are guaranteed symbol matches.
    if (!ts__default["default"].isPropertyAccessExpression(aParent) && !ts__default["default"].isElementAccessExpression(aParent)) {
        return sharePartner.text === reference.text;
    }
    // If reference parent is part of a property expression, but the share
    // partner not, then this cannot be shared.
    const bParent = index.unwrapParent(sharePartner.parent);
    if (aParent.kind !== bParent.kind) {
        return false;
    }
    const aParentExprSymbol = checker.getSymbolAtLocation(aParent.expression);
    const bParentExprSymbol = checker.getSymbolAtLocation(bParent.expression);
    return aParentExprSymbol === bParentExprSymbol;
}

function migrateStandardTsReference(tsReferencesWithNarrowing, checker, info, replacements) {
    const nameGenerator = new UniqueNamesGenerator(['Value', 'Val', 'Input']);
    // TODO: Consider checking/properly handling optional chaining and narrowing.
    for (const reference of tsReferencesWithNarrowing.values()) {
        const controlFlowResult = analyzeControlFlow(reference.accesses, checker);
        const idToSharedField = new Map();
        const isSharePartnerRef = (val) => {
            return val !== 'preserve' && typeof val !== 'number';
        };
        // Ensure we generate shared fields before reference entries.
        // This allows us to safely make use of `idToSharedField` whenever we come
        // across a referenced pointing to a share partner.
        controlFlowResult.sort((a, b) => {
            const aPriority = isSharePartnerRef(a.recommendedNode) ? 1 : 0;
            const bPriority = isSharePartnerRef(b.recommendedNode) ? 1 : 0;
            return bPriority - aPriority;
        });
        for (const { id, originalNode, recommendedNode } of controlFlowResult) {
            const sf = originalNode.getSourceFile();
            // Original node is preserved. No narrowing, and hence not shared.
            // Unwrap the signal directly.
            if (recommendedNode === 'preserve') {
                // Append `()` to unwrap the signal.
                replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sf, info), new apply_import_manager.TextUpdate({
                    position: originalNode.getEnd(),
                    end: originalNode.getEnd(),
                    toInsert: '()',
                })));
                continue;
            }
            // This reference is shared with a previous reference. Replace the access
            // with the temporary variable.
            if (typeof recommendedNode === 'number') {
                // Extract the shared field name.
                const toInsert = idToSharedField.get(recommendedNode);
                const replaceNode = index.traverseAccess(originalNode);
                assert__default["default"](toInsert, 'no shared variable yet available');
                replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sf, info), new apply_import_manager.TextUpdate({
                    position: replaceNode.getStart(),
                    end: replaceNode.getEnd(),
                    toInsert,
                })));
                continue;
            }
            // Otherwise, we are creating a "shared reference" at the given node and
            // block.
            // Iterate up the original node, until we hit the "recommended block" level.
            // We then use the previous child as anchor for inserting. This allows us
            // to insert right before the first reference in the container, at the proper
            // block level— instead of always inserting at the beginning of the container.
            let parent = originalNode.parent;
            let referenceNodeInBlock = originalNode;
            while (parent !== recommendedNode) {
                referenceNodeInBlock = parent;
                parent = parent.parent;
            }
            const replaceNode = index.traverseAccess(originalNode);
            const filePath = apply_import_manager.projectFile(sf, info);
            const initializer = `${replaceNode.getText()}()`;
            const fieldName = nameGenerator.generate(originalNode.text, referenceNodeInBlock);
            let sharedValueAccessExpr;
            let temporaryVariableStr;
            if (ts__default["default"].isClassLike(recommendedNode)) {
                sharedValueAccessExpr = `this.${fieldName}`;
                temporaryVariableStr = `private readonly ${fieldName} = ${initializer};`;
            }
            else {
                sharedValueAccessExpr = fieldName;
                temporaryVariableStr = `const ${fieldName} = ${initializer};`;
            }
            idToSharedField.set(id, sharedValueAccessExpr);
            // If the common ancestor block of all shared references is an arrow function
            // without a block, convert the arrow function to a block and insert the temporary
            // variable at the beginning.
            if (ts__default["default"].isArrowFunction(parent) && !ts__default["default"].isBlock(parent.body)) {
                replacements.push(...createNewBlockToInsertVariable(parent, filePath, temporaryVariableStr));
            }
            else {
                const leadingSpace = ts__default["default"].getLineAndCharacterOfPosition(sf, referenceNodeInBlock.getStart());
                replacements.push(new apply_import_manager.Replacement(filePath, new apply_import_manager.TextUpdate({
                    position: referenceNodeInBlock.getStart(),
                    end: referenceNodeInBlock.getStart(),
                    toInsert: `${temporaryVariableStr}\n${' '.repeat(leadingSpace.character)}`,
                })));
            }
            replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sf, info), new apply_import_manager.TextUpdate({
                position: replaceNode.getStart(),
                end: replaceNode.getEnd(),
                toInsert: sharedValueAccessExpr,
            })));
        }
    }
}

/**
 * Migrates TypeScript input references to be signal compatible.
 *
 * The phase takes care of control flow analysis and generates temporary variables
 * where needed to ensure narrowing continues to work. E.g.
 *
 * ```ts
 * someMethod() {
 *   if (this.input) {
 *     this.input.charAt(0);
 *   }
 * }
 * ```
 *
 * will be transformed into:
 *
 * ```ts
 * someMethod() {
 *   const input_1 = this.input();
 *   if (input_1) {
 *     input_1.charAt(0);
 *   }
 * }
 * ```
 */
function migrateTypeScriptReferences(host, references, checker, info) {
    const tsReferencesWithNarrowing = new Map();
    const tsReferencesInBindingElements = new Set();
    const seenIdentifiers = new WeakSet();
    for (const reference of references) {
        // This pass only deals with TS references.
        if (!index.isTsReference(reference)) {
            continue;
        }
        // Skip references to incompatible inputs.
        if (!host.shouldMigrateReferencesToField(reference.target)) {
            continue;
        }
        // Never attempt to migrate write references.
        // Those usually invalidate the target input most of the time, but in
        // best-effort mode they are not.
        if (reference.from.isWrite) {
            continue;
        }
        // Skip duplicate references. E.g. in batching.
        if (seenIdentifiers.has(reference.from.node)) {
            continue;
        }
        seenIdentifiers.add(reference.from.node);
        const targetKey = reference.target.key;
        if (reference.from.isPartOfElementBinding) {
            tsReferencesInBindingElements.add(reference.from.node);
        }
        else {
            if (!tsReferencesWithNarrowing.has(targetKey)) {
                tsReferencesWithNarrowing.set(targetKey, { accesses: [] });
            }
            tsReferencesWithNarrowing.get(targetKey).accesses.push(reference.from.node);
        }
    }
    migrateBindingElementInputReference(tsReferencesInBindingElements, info, host.replacements, host.printer);
    migrateStandardTsReference(tsReferencesWithNarrowing, checker, info, host.replacements);
}

/**
 * Migrates TypeScript "ts.Type" references. E.g.

 *  - `Partial<MyComp>` will be converted to `UnwrapSignalInputs<Partial<MyComp>>`.
      in Catalyst test files.
 */
function migrateTypeScriptTypeReferences(host, references, importManager, info) {
    const seenTypeNodes = new WeakSet();
    for (const reference of references) {
        // This pass only deals with TS input class type references.
        if (!index.isTsClassTypeReference(reference)) {
            continue;
        }
        // Skip references to classes that are not fully migrated.
        if (!host.shouldMigrateReferencesToClass(reference.target)) {
            continue;
        }
        // Skip duplicate references. E.g. in batching.
        if (seenTypeNodes.has(reference.from.node)) {
            continue;
        }
        seenTypeNodes.add(reference.from.node);
        if (reference.isPartialReference && reference.isPartOfCatalystFile) {
            assert__default["default"](reference.from.node.typeArguments, 'Expected type arguments for partial reference.');
            assert__default["default"](reference.from.node.typeArguments.length === 1, 'Expected an argument for reference.');
            const firstArg = reference.from.node.typeArguments[0];
            const sf = firstArg.getSourceFile();
            // Naive detection of the import. Sufficient for this test file migration.
            const catalystImport = sf.text.includes('google3/javascript/angular2/testing/catalyst/fake_async')
                ? 'google3/javascript/angular2/testing/catalyst/fake_async'
                : 'google3/javascript/angular2/testing/catalyst/async';
            const unwrapImportExpr = importManager.addImport({
                exportModuleSpecifier: catalystImport,
                exportSymbolName: 'UnwrapSignalInputs',
                requestedFile: sf,
            });
            host.replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sf, info), new apply_import_manager.TextUpdate({
                position: firstArg.getStart(),
                end: firstArg.getStart(),
                toInsert: `${host.printer.printNode(ts__default["default"].EmitHint.Unspecified, unwrapImportExpr, sf)}<`,
            })));
            host.replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sf, info), new apply_import_manager.TextUpdate({ position: firstArg.getEnd(), end: firstArg.getEnd(), toInsert: '>' })));
        }
    }
}

exports.GroupedTsAstVisitor = GroupedTsAstVisitor;
exports.InheritanceGraph = InheritanceGraph;
exports.NULL_EXPR = NULL_EXPR;
exports.checkIncompatiblePatterns = checkIncompatiblePatterns;
exports.checkInheritanceOfKnownFields = checkInheritanceOfKnownFields;
exports.cutStringToLineLimit = cutStringToLineLimit;
exports.getMessageForClassIncompatibility = getMessageForClassIncompatibility;
exports.getMessageForFieldIncompatibility = getMessageForFieldIncompatibility;
exports.insertPrecedingLine = insertPrecedingLine;
exports.insertTodoForIncompatibility = insertTodoForIncompatibility;
exports.isFieldIncompatibility = isFieldIncompatibility;
exports.migrateTypeScriptReferences = migrateTypeScriptReferences;
exports.migrateTypeScriptTypeReferences = migrateTypeScriptTypeReferences;
exports.nonIgnorableFieldIncompatibilities = nonIgnorableFieldIncompatibilities;
exports.pickFieldIncompatibility = pickFieldIncompatibility;
exports.removeFromUnionIfPossible = removeFromUnionIfPossible;
