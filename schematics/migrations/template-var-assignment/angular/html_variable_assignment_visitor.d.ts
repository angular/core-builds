/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/template-var-assignment/angular/html_variable_assignment_visitor" />
import type { PropertyWrite, TmplAstBoundEvent, TmplAstElement, TmplAstTemplate } from '@angular/compiler';
import { TemplateAstVisitor } from '../../../utils/template_ast_visitor';
export interface TemplateVariableAssignment {
    start: number;
    end: number;
    node: PropertyWrite;
}
/**
 * HTML AST visitor that traverses the Render3 HTML AST in order to find all
 * expressions that write to local template variables within bound events.
 */
export declare class HtmlVariableAssignmentVisitor extends TemplateAstVisitor {
    variableAssignments: TemplateVariableAssignment[];
    private currentVariables;
    private expressionAstVisitor;
    constructor(compilerModule: typeof import('@angular/compiler'));
    visitElement(element: TmplAstElement): void;
    visitTemplate(template: TmplAstTemplate): void;
    visitBoundEvent(node: TmplAstBoundEvent): void;
}
