'use strict';
/**
 * @license Angular v22.1.0-next.5+sha-6d043f8
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-LBcwW5BF.cjs');
var compiler = require('@angular/compiler');
var ts = require('typescript');
var ng_component_template = require('./ng_component_template-DPAF1aEA.cjs');
var ng_decorators = require('./ng_decorators-IVztR9rk.cjs');
require('@angular/compiler-cli');
require('@angular/compiler-cli/private/migrations');
require('node:path');
var property_name = require('./property_name-BCpALNpZ.cjs');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-BejwmdOG.cjs');
require('./imports-CKV-ITqD.cjs');

const SAFE_NAVIGATION_MIGRATION_FN = '$safeNavigationMigration';
/**
 * This migration wraps optional chaining expressions in Angular templates with a call to the
 * `$safeNavigationMigration()` magic function. This function doesn't exist at runtime, but is
 * used as a marker for the Angular compiler to transform the expression to keep the legacy
 * behavior of returning `null`.
 *
 * The migration uses a top-down "sink" approach: each expression is visited with a boolean
 * `nullSensitive` context that indicates whether the consumer of the expression's value
 * distinguishes between `null` and `undefined`. Safe navigation operators (`?.`) wrap themselves
 * when their sink is null-sensitive.
 */
class SafeOptionalChainingMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const replacements = [];
        // Template Iteration
        const templateVisitor = new ng_component_template.NgComponentTemplateVisitor(info.program.getTypeChecker());
        for (const sourceFile of info.sourceFiles) {
            templateVisitor.visitNode(sourceFile);
        }
        for (const template of templateVisitor.resolvedTemplates) {
            const nodes = compiler.parseTemplate(template.content, template.filePath.toString(), {
                preserveWhitespaces: true,
                preserveLineEndings: true,
                preserveSignificantWhitespace: true,
                leadingTriviaChars: [],
            }).nodes;
            const file = template.inline
                ? project_paths.projectFile(template.container.getSourceFile(), info)
                : project_paths.projectFile(template.filePath, info);
            const exprMigrator = new ExpressionMigrator(file, template.start);
            const visitor = new TmplVisitor(exprMigrator);
            for (const node of nodes) {
                if (node.visit) {
                    node.visit(visitor);
                }
            }
            replacements.push(...exprMigrator.replacements);
        }
        for (const sourceFile of info.sourceFiles) {
            replacements.push(...migrateHostBindingsInSourceFile(sourceFile, info));
        }
        return project_paths.confirmAsSerializable({ replacements });
    }
    async combine(unitA, unitB) {
        const seen = new Set();
        const deduped = [];
        for (const r of [...unitA.replacements, ...unitB.replacements]) {
            const key = `${r.projectFile.rootRelativePath}:${r.update.data.position}:${r.update.data.end}:${r.update.data.toInsert}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push(r);
            }
        }
        return project_paths.confirmAsSerializable({ replacements: deduped });
    }
    async globalMeta(data) {
        return project_paths.confirmAsSerializable(data);
    }
    async stats(data) {
        return project_paths.confirmAsSerializable({});
    }
    async migrate(data) {
        return { replacements: data.replacements };
    }
}
function migrateHostBindingsInSourceFile(sourceFile, info) {
    const replacements = [];
    const file = project_paths.projectFile(sourceFile, info);
    const typeChecker = info.program.getTypeChecker();
    const visitNode = (node) => {
        if (ts.isClassDeclaration(node)) {
            const decorators = ts.getDecorators(node) ?? [];
            const ngDecorators = ng_decorators.getAngularDecorators(typeChecker, decorators);
            for (const decorator of ngDecorators) {
                if (decorator.name !== 'Component' && decorator.name !== 'Directive') {
                    continue;
                }
                const metadata = decorator.node.expression.arguments[0];
                if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
                    continue;
                }
                for (const prop of metadata.properties) {
                    if (!ts.isPropertyAssignment(prop)) {
                        continue;
                    }
                    const propName = property_name.getPropertyNameText(prop.name);
                    if (propName !== 'host' || !ts.isObjectLiteralExpression(prop.initializer)) {
                        continue;
                    }
                    for (const hostProp of prop.initializer.properties) {
                        if (!ts.isPropertyAssignment(hostProp) ||
                            !ts.isStringLiteralLike(hostProp.initializer)) {
                            continue;
                        }
                        const hostKey = property_name.getPropertyNameText(hostProp.name);
                        if (hostKey === null || (!hostKey.startsWith('[') && !hostKey.startsWith('('))) {
                            continue;
                        }
                        // Preserve raw text between quotes/backticks so source offsets stay aligned.
                        const hostExpression = hostProp.initializer.getText().slice(1, -1);
                        const fakeTemplatePrefix = `<div ${hostKey}="`;
                        const fakeTemplate = `${fakeTemplatePrefix}${hostExpression}"></div>`;
                        const parsedNodes = compiler.parseTemplate(fakeTemplate, sourceFile.fileName, {
                            preserveWhitespaces: true,
                        }).nodes;
                        const hostExpressionStart = hostProp.initializer.getStart() + 1;
                        const exprMigrator = new ExpressionMigrator(file, hostExpressionStart - fakeTemplatePrefix.length);
                        const visitor = new HostBindingVisitor(exprMigrator);
                        for (const parsedNode of parsedNodes) {
                            if (parsedNode.visit) {
                                parsedNode.visit(visitor);
                            }
                        }
                        replacements.push(...exprMigrator.replacements);
                    }
                }
            }
        }
        ts.forEachChild(node, visitNode);
    };
    visitNode(sourceFile);
    return replacements;
}
/** Returns whether the given attribute is a class, style, or attribute binding. */
function isClassStyleOrAttrBinding(attribute) {
    return (attribute.type === compiler.BindingType.Class ||
        attribute.type === compiler.BindingType.Style ||
        attribute.type === compiler.BindingType.Attribute ||
        (attribute.type === compiler.BindingType.Property &&
            (attribute.name === 'class' || attribute.name === 'className' || attribute.name === 'style')));
}
class HostBindingVisitor extends compiler.TmplAstRecursiveVisitor {
    hostExprMigrator;
    constructor(hostExprMigrator) {
        super();
        this.hostExprMigrator = hostExprMigrator;
    }
    visitBoundAttribute(attribute) {
        if (isClassStyleOrAttrBinding(attribute)) {
            // Class/style/attr bindings use truthiness — not null-sensitive by default.
            // Safe navs inside function calls or pipes will still be wrapped by the migrator.
            attribute.value.visit(this.hostExprMigrator, false);
        }
        else {
            // Regular property bindings are null-sensitive.
            attribute.value.visit(this.hostExprMigrator, true);
        }
        super.visitBoundAttribute(attribute);
    }
    visitBoundEvent(event) {
        if (event.handler && event.handler.visit) {
            // Event handlers are not null-sensitive; safe navs inside function calls will
            // still be wrapped because function arguments are always null-sensitive.
            event.handler.visit(this.hostExprMigrator, false);
        }
        super.visitBoundEvent(event);
    }
}
/**
 * Visits template expressions and inserts `$safeNavigationMigration(…)` wrappers around safe
 * navigation chains whose result is consumed by a null-sensitive sink.
 *
 * The `context` parameter at every visit call is a boolean `nullSensitive` flag that answers:
 * "does the parent care whether this expression's value is `null` vs. `undefined`?"
 *
 * Propagation rules:
 * - `||`, `&&`, `??`: children are **not** null-sensitive (both normalise null/undefined).
 * - `===` / `!==` with a nullish literal on one side: the other operand **is** null-sensitive.
 * - All other binary operators: propagate the parent's null-sensitivity.
 * - `!` (prefix not): operand is **not** null-sensitive (uses truthiness).
 * - Ternary condition: **not** null-sensitive; branches inherit the parent's null-sensitivity.
 * - Function call arguments and pipe inputs: **always** null-sensitive.
 * - Receivers of property/keyed/call reads: **not** null-sensitive by default.
 *   For property/keyed/call continuations, when the receiver is a safe node and the parent sink
 *   is null-sensitive, wrap the full continuation node (e.g. `foo?.bar.baz`, `foo?.save()`) rather
 *   than the inner safe receiver (`foo?.bar`, `foo?.save`) so runtime behavior is preserved.
 * - `NonNullAssert` (`!`): propagates the parent's null-sensitivity (type-only assertion).
 */
class ExpressionMigrator extends compiler.RecursiveAstVisitor {
    file;
    templateStart;
    replacements = [];
    constructor(file, templateStart) {
        super();
        this.file = file;
        this.templateStart = templateStart;
    }
    // ---------------------------------------------------------------------------
    // Safe navigation nodes — wrap when the sink is null-sensitive
    // ---------------------------------------------------------------------------
    visitSafePropertyRead(ast, nullSensitive) {
        if (nullSensitive) {
            this.addReplacement(ast);
        }
        // Receiver: not null-sensitive (further access on null/undefined throws either way).
        this.visit(ast.receiver, false);
    }
    visitSafeKeyedRead(ast, nullSensitive) {
        if (nullSensitive) {
            this.addReplacement(ast);
        }
        this.visit(ast.receiver, false);
        this.visit(ast.key, false);
    }
    visitSafeCall(ast, nullSensitive) {
        if (nullSensitive) {
            this.addReplacement(ast);
        }
        this.visit(ast.receiver, false);
        this.visitAll(ast.args, true);
    }
    hasSafeReceiver(receiver) {
        if (receiver instanceof compiler.SafePropertyRead ||
            receiver instanceof compiler.SafeKeyedRead ||
            receiver instanceof compiler.SafeCall) {
            return true;
        }
        if (receiver instanceof compiler.NonNullAssert) {
            return this.hasSafeReceiver(receiver.expression);
        }
        return false;
    }
    // ---------------------------------------------------------------------------
    // Non-safe access — receiver is never null-sensitive
    // ---------------------------------------------------------------------------
    visitPropertyRead(ast, nullSensitive) {
        if (nullSensitive && this.hasSafeReceiver(ast.receiver)) {
            this.addReplacement(ast);
        }
        this.visit(ast.receiver, false);
    }
    visitKeyedRead(ast, nullSensitive) {
        if (nullSensitive && this.hasSafeReceiver(ast.receiver)) {
            this.addReplacement(ast);
        }
        this.visit(ast.receiver, false);
        this.visit(ast.key, false);
    }
    // ---------------------------------------------------------------------------
    // Function calls — arguments are always null-sensitive
    // ---------------------------------------------------------------------------
    visitCall(ast, nullSensitive) {
        if (isSafeNavigationMigrationCall(ast)) {
            this.visit(ast.receiver, false);
            return;
        }
        if (nullSensitive && this.hasSafeReceiver(ast.receiver)) {
            this.addReplacement(ast);
        }
        this.visit(ast.receiver, false);
        this.visitAll(ast.args, true);
    }
    // ---------------------------------------------------------------------------
    // Pipes — input and arguments are always null-sensitive
    // ---------------------------------------------------------------------------
    visitPipe(ast, _nullSensitive) {
        this.visit(ast.exp, true);
        this.visitAll(ast.args, true);
    }
    // ---------------------------------------------------------------------------
    // Binary operators
    // ---------------------------------------------------------------------------
    visitBinary(ast, nullSensitive) {
        if (ast.operation === '||' ||
            ast.operation === '&&' ||
            ast.operation === '??' ||
            ast.operation === '==' ||
            ast.operation === '!=') {
            // These operators normalise null and undefined (both produce the same result),
            // so the operands are not null-sensitive.
            this.visit(ast.left, false);
            this.visit(ast.right, false);
        }
        else if (ast.operation === '===' || ast.operation === '!==') {
            // A strict comparison with a nullish literal makes the other side null-sensitive
            // (null === null is true but undefined === null is false).
            const leftIsNullish = isNullishLiteralAST(ast.left);
            const rightIsNullish = isNullishLiteralAST(ast.right);
            this.visit(ast.left, rightIsNullish);
            this.visit(ast.right, leftIsNullish);
        }
        else {
            // All other binary operators (<, >, +, -, …): propagate the parent's null-sensitivity
            // because null and undefined can produce different numeric results (null → 0,
            // undefined → NaN for arithmetic/comparison).
            this.visit(ast.left, nullSensitive);
            this.visit(ast.right, nullSensitive);
        }
    }
    // ---------------------------------------------------------------------------
    // Unary / logical operators
    // ---------------------------------------------------------------------------
    visitPrefixNot(ast, _nullSensitive) {
        // Logical negation uses truthiness — null and undefined are both falsy.
        this.visit(ast.expression, false);
    }
    // ---------------------------------------------------------------------------
    // Ternary
    // ---------------------------------------------------------------------------
    visitConditional(ast, nullSensitive) {
        // The condition is evaluated as a boolean — not null-sensitive.
        this.visit(ast.condition, false);
        // The result of a branch is consumed by the parent, so it inherits null-sensitivity.
        this.visit(ast.trueExp, nullSensitive);
        this.visit(ast.falseExp, nullSensitive);
    }
    // ---------------------------------------------------------------------------
    // NonNullAssert — a compile-time type annotation, no runtime effect
    // ---------------------------------------------------------------------------
    visitNonNullAssert(ast, nullSensitive) {
        this.visit(ast.expression, nullSensitive);
    }
    // ---------------------------------------------------------------------------
    // Chain (event handler statements) — never null-sensitive
    // ---------------------------------------------------------------------------
    visitChain(ast, _nullSensitive) {
        this.visitAll(ast.expressions, false);
    }
    // ---------------------------------------------------------------------------
    // Interpolation — coerces to string, so null and undefined produce identical
    // output; sub-expressions are therefore never null-sensitive.
    // ---------------------------------------------------------------------------
    visitInterpolation(ast, _nullSensitive) {
        this.visitAll(ast.expressions, false);
    }
    // ---------------------------------------------------------------------------
    // All other nodes (LiteralArray, LiteralMap, Unary, …) use the default
    // RecursiveAstVisitor which propagates the current context to every child —
    // the correct "inherit parent null-sensitivity" fallback.
    // ---------------------------------------------------------------------------
    addReplacement(ast) {
        const startArg = ast.sourceSpan.start;
        const endArg = ast.sourceSpan.end;
        this.replacements.push(new project_paths.Replacement(this.file, new project_paths.TextUpdate({
            position: this.templateStart + endArg,
            end: this.templateStart + endArg,
            toInsert: ')',
        })), new project_paths.Replacement(this.file, new project_paths.TextUpdate({
            position: this.templateStart + startArg,
            end: this.templateStart + startArg,
            toInsert: '$safeNavigationMigration(',
        })));
    }
}
// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
/** Returns true if the AST node is a literal `null` or `undefined`. */
function isNullishLiteralAST(ast) {
    const innerAst = ast instanceof compiler.ASTWithSource ? ast.ast : ast;
    return (innerAst instanceof compiler.LiteralPrimitive &&
        (innerAst.value === null || innerAst.value === undefined));
}
function isSafeNavigationMigrationCall(ast) {
    const innerAst = ast instanceof compiler.ASTWithSource ? ast.ast : ast;
    return (innerAst instanceof compiler.Call &&
        innerAst.receiver instanceof compiler.PropertyRead &&
        innerAst.receiver.name === SAFE_NAVIGATION_MIGRATION_FN);
}
/** Returns true if the AST node is a non-null, non-undefined primitive literal. */
function isNonNullishLiteralAST(ast) {
    const innerAst = ast instanceof compiler.ASTWithSource ? ast.ast : ast;
    return (innerAst instanceof compiler.LiteralPrimitive && innerAst.value !== null && innerAst.value !== undefined);
}
// ---------------------------------------------------------------------------
// Template visitor
// ---------------------------------------------------------------------------
/**
 * Returns true if all *ngSwitchCase bindings in the given nodes (and their children)
 * are non-null/non-undefined literal expressions — meaning the switch expression
 * doesn't need null-sensitivity migration.
 */
function allNgSwitchCasesAreLiterals(nodes) {
    for (const node of nodes) {
        for (const input of node.inputs) {
            if (input.name === 'ngSwitchCase' && input.value) {
                if (!isNonNullishLiteralAST(input.value)) {
                    return false;
                }
            }
        }
        if (node instanceof compiler.TmplAstTemplate) {
            for (const attr of node.templateAttrs) {
                if (attr instanceof compiler.TmplAstBoundAttribute && attr.name === 'ngSwitchCase' && attr.value) {
                    if (!isNonNullishLiteralAST(attr.value)) {
                        return false;
                    }
                }
            }
        }
        const childHosts = node.children.filter((child) => child instanceof compiler.TmplAstElement || child instanceof compiler.TmplAstTemplate);
        if (!allNgSwitchCasesAreLiterals(childHosts)) {
            return false;
        }
    }
    return true;
}
class TmplVisitor extends compiler.TmplAstRecursiveVisitor {
    exprMigrator;
    migratableSwitchCases = new WeakSet();
    /**
     * Stack tracking whether the current ngSwitch context should be migrated.
     * False when all *ngSwitchCase expressions are non-null literals.
     */
    ngSwitchShouldMigrateStack = [];
    constructor(exprMigrator) {
        super();
        this.exprMigrator = exprMigrator;
    }
    shouldMigrateCurrentNgSwitchContext() {
        return this.ngSwitchShouldMigrateStack[this.ngSwitchShouldMigrateStack.length - 1] ?? true;
    }
    hasNgSwitchBinding(node) {
        return (node.inputs.some((attr) => attr.name === 'ngSwitch') ||
            (node instanceof compiler.TmplAstTemplate &&
                node.templateAttrs.some((attr) => attr.name === 'ngSwitch')));
    }
    visitElement(element) {
        const hasNgSwitch = this.hasNgSwitchBinding(element);
        if (hasNgSwitch) {
            const childHosts = element.children.filter((child) => child instanceof compiler.TmplAstElement || child instanceof compiler.TmplAstTemplate);
            this.ngSwitchShouldMigrateStack.push(!allNgSwitchCasesAreLiterals(childHosts));
        }
        super.visitElement(element);
        if (hasNgSwitch) {
            this.ngSwitchShouldMigrateStack.pop();
        }
    }
    visitBoundAttribute(attribute) {
        if (attribute.name === 'ngForOf') {
            // ngFor/@for item expressions are not null-sensitive by default.
            // Still visit so inner null-sensitive sinks (e.g. pipes/functions) are migrated.
            attribute.value.visit(this.exprMigrator, false);
        }
        else if (attribute.name === 'ngIf') {
            // ngIf evaluates as a boolean; null-sensitivity only arises when the expression
            // itself contains a strict null comparison (handled inside ExpressionMigrator).
            attribute.value.visit(this.exprMigrator, false);
        }
        else if (attribute.name === 'ngSwitch' || attribute.name === 'ngSwitchCase') {
            attribute.value.visit(this.exprMigrator, this.shouldMigrateCurrentNgSwitchContext());
        }
        else if (isClassStyleOrAttrBinding(attribute)) {
            // Class/style/attr bindings use truthiness — not null-sensitive by default.
            attribute.value.visit(this.exprMigrator, false);
        }
        else {
            // Regular property bindings are null-sensitive.
            attribute.value.visit(this.exprMigrator, true);
        }
        super.visitBoundAttribute(attribute);
    }
    visitBoundEvent(event) {
        if (event.handler && event.handler.visit) {
            // Event handlers are not null-sensitive.  Safe navs inside function calls
            // (e.g. `compute(user?.save())`) are still migrated because function arguments
            // are always null-sensitive in ExpressionMigrator.
            event.handler.visit(this.exprMigrator, false);
        }
        super.visitBoundEvent(event);
    }
    visitBoundText(text) {
        // Interpolation text is not null-sensitive by default; null-sensitivity is
        // introduced by pipes, function calls, or strict null comparisons inside
        // the expression, all handled by ExpressionMigrator.
        text.value.visit(this.exprMigrator, false);
        super.visitBoundText(text);
    }
    visitTemplate(template) {
        const hasNgSwitch = this.hasNgSwitchBinding(template);
        if (hasNgSwitch) {
            const childHosts = template.children.filter((child) => child instanceof compiler.TmplAstElement || child instanceof compiler.TmplAstTemplate);
            this.ngSwitchShouldMigrateStack.push(!allNgSwitchCasesAreLiterals(childHosts));
        }
        for (const attr of template.templateAttrs) {
            if (!(attr instanceof compiler.TmplAstBoundAttribute)) {
                continue;
            }
            if (attr.name === 'ngIf') {
                attr.value.visit(this.exprMigrator, false);
            }
            else if (attr.name === 'ngSwitch' || attr.name === 'ngSwitchCase') {
                attr.value.visit(this.exprMigrator, this.shouldMigrateCurrentNgSwitchContext());
            }
            else if (attr.name === 'ngForOf') {
                // ngFor microsyntax expressions are not null-sensitive by default.
                // Still visit so nested null-sensitive sinks are handled.
                attr.value.visit(this.exprMigrator, false);
            }
            else {
                attr.value.visit(this.exprMigrator, true);
            }
        }
        super.visitTemplate(template);
        if (hasNgSwitch) {
            this.ngSwitchShouldMigrateStack.pop();
        }
    }
    visitIfBlockBranch(block) {
        if (block.expression) {
            // @if condition: not null-sensitive by default (same logic as ngIf).
            block.expression.visit(this.exprMigrator, false);
        }
        super.visitIfBlockBranch(block);
    }
    visitForLoopBlock(block) {
        block.expression.visit(this.exprMigrator, false);
        block.trackBy?.visit(this.exprMigrator, false);
        super.visitForLoopBlock(block);
    }
    visitLetDeclaration(decl) {
        // @let value is assigned directly — null-sensitive.
        decl.value.visit(this.exprMigrator, true);
        super.visitLetDeclaration(decl);
    }
    visitSwitchBlock(block) {
        const switchCases = block.groups.flatMap((group) => group.cases);
        // Don't migrate if every case expression is a non-null/non-undefined literal
        // (e.g. strings, numbers, booleans). In that case null-vs-undefined can never
        // match a case, so wrapping the switch expression would be pointless.
        const shouldMigrate = !switchCases
            .filter((switchCase) => switchCase.expression)
            .every((switchCase) => isNonNullishLiteralAST(switchCase.expression));
        if (shouldMigrate) {
            block.expression.visit(this.exprMigrator, true);
            for (const switchCase of switchCases) {
                this.migratableSwitchCases.add(switchCase);
            }
        }
        super.visitSwitchBlock(block);
    }
    visitSwitchBlockCase(block) {
        if (this.migratableSwitchCases.has(block) && block.expression) {
            block.expression.visit(this.exprMigrator, true);
        }
        super.visitSwitchBlockCase(block);
    }
    visitDeferredTrigger(trigger) {
        if (trigger instanceof compiler.TmplAstBoundDeferredTrigger) {
            // @defer (when …): same logic as @if — not null-sensitive by default.
            trigger.value.visit(this.exprMigrator, false);
        }
        super.visitDeferredTrigger(trigger);
    }
}

function migrate() {
    return async (tree) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new SafeOptionalChainingMigration(),
        });
    };
}

exports.migrate = migrate;
