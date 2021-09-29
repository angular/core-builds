/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/static-queries/strategies/usage_strategy/template_usage_visitor" />
import type { TmplAstBoundAttribute, TmplAstBoundEvent, TmplAstBoundText, TmplAstElement, TmplAstNode, TmplAstTemplate } from '@angular/compiler';
import { TemplateAstVisitor } from '../../../../utils/template_ast_visitor';
/**
 * AST visitor that traverses the Render3 HTML AST in order to check if the given
 * query property is accessed statically in the template.
 */
export declare class TemplateUsageVisitor extends TemplateAstVisitor {
    queryPropertyName: string;
    private hasQueryTemplateReference;
    private expressionAstVisitor;
    constructor(queryPropertyName: string, compilerModule: typeof import('@angular/compiler'));
    /** Checks whether the given query is statically accessed within the specified HTML nodes. */
    isQueryUsedStatically(htmlNodes: TmplAstNode[]): boolean;
    visitElement(element: TmplAstElement): void;
    visitTemplate(template: TmplAstTemplate): void;
    visitBoundAttribute(attribute: TmplAstBoundAttribute): void;
    visitBoundText(text: TmplAstBoundText): void;
    visitBoundEvent(node: TmplAstBoundEvent): void;
}
