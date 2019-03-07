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
    private visitedJumpExprSymbols;
    constructor(declaration: ts.Node, typeChecker: ts.TypeChecker);
    private isReferringToSymbol;
    private addJumpExpressionToQueue;
    private addNewExpressionToQueue;
    isUsedInNode(searchNode: ts.Node): boolean;
}
