/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <amd-module name="@angular/core/schematics/migrations/template-var-assignment/angular/property_write_html_visitor" />
import { PropertyWrite } from '@angular/compiler';
import { BoundEvent, Element, NullVisitor, Template, Variable } from '@angular/compiler/src/render3/r3_ast';
export interface PropertyAssignment {
    start: number;
    end: number;
    node: PropertyWrite;
}
/**
 * AST visitor that traverses the Render3 HTML AST in order to find all declared
 * template variables and property assignments within bound events.
 */
export declare class PropertyWriteHtmlVisitor extends NullVisitor {
    templateVariables: Variable[];
    propertyAssignments: PropertyAssignment[];
    private expressionAstVisitor;
    visitElement(element: Element): void;
    visitTemplate(template: Template): void;
    visitBoundEvent(node: BoundEvent): void;
}
