/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries/angular/declaration_usage_visitor" />
import * as ts from 'typescript';
/**
 * Class that can be used to determine if a given TypeScript node is used within
 * other given TypeScript nodes. This is achieved by walking through all children
 * of the given node and checking for usages of the given declaration. The visitor
 * also handles potential control flow changes caused by call/new expressions.
 */
export declare class DeclarationUsageVisitor {
    private declaration;
    private typeChecker;
    /** Set of visited symbols that caused a jump in control flow. */
    private visitedJumpExprNodes;
    /** Queue of nodes that need to be checked for declaration usage. */
    private nodeQueue;
    /**
     * Function context that holds the TypeScript node values for all parameters
     * of the currently analyzed function block.
     */
    private context;
    constructor(declaration: ts.Node, typeChecker: ts.TypeChecker);
    private isReferringToSymbol;
    private addJumpExpressionToQueue;
    private addNewExpressionToQueue;
    private visitPropertyAccessors;
    private visitBinaryExpression;
    isSynchronouslyUsedInNode(searchNode: ts.Node): boolean;
    /**
     * Resolves a given node from the context. In case the node is not mapped in
     * the context, the original node is returned.
     */
    private _resolveNodeFromContext;
    /**
     * Updates the context to reflect the newly set parameter values. This allows future
     * references to function parameters to be resolved to the actual node through the context.
     */
    private _updateContext;
    /**
     * Resolves a TypeScript identifier node. For example an identifier can refer to a
     * function parameter which can be resolved through the function context.
     */
    private _resolveIdentifier;
    /**
     * Gets the declaration symbol of a given TypeScript node. Resolves aliased
     * symbols to the symbol containing the value declaration.
     */
    private _getDeclarationSymbolOfNode;
}
