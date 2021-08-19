/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/router-link-empty-expression/angular/html_routerlink_empty_expr_visitor" />
import { BoundAttribute, Element, NullVisitor, Template } from '@angular/compiler/src/render3/r3_ast';
/**
 * HTML AST visitor that traverses the Render3 HTML AST in order to find all
 * undefined routerLink asssignment ([routerLink]="").
 */
export declare class RouterLinkEmptyExprVisitor extends NullVisitor {
    readonly emptyRouterLinkExpressions: BoundAttribute[];
    visitElement(element: Element): void;
    visitTemplate(t: Template): void;
    visitBoundAttribute(node: BoundAttribute): void;
}
