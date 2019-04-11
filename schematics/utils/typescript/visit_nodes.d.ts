/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/utils/typescript/visit_nodes" />
import * as ts from 'typescript';
export interface TypeScriptVisitor {
    visitNode(node: ts.Node): any;
}
export declare function visitAllNodes(node: ts.Node, visitors: TypeScriptVisitor[]): void;
