/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy } from '../change_detection/constants';
import { makeDecorator, makePropDecorator } from '../util/decorators';
/**
 * Type of the Directive decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function DirectiveDecorator() { }
function DirectiveDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (obj: Directive): TypeDecorator;
    */
    /* TODO: handle strange member:
    new (obj: Directive): Directive;
    */
}
/**
 * Directive decorator and metadata.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ Directive = makeDecorator('Directive', (dir = {}) => dir);
/**
 * Type of the Component decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function ComponentDecorator() { }
function ComponentDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (obj: Component): TypeDecorator;
    */
    /* TODO: handle strange member:
    new (obj: Component): Component;
    */
}
/**
 * Component decorator and metadata.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ Component = makeDecorator('Component', (c = {}) => (Object.assign({ changeDetection: ChangeDetectionStrategy.Default }, c)), Directive);
/**
 * Type of the Pipe decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function PipeDecorator() { }
function PipeDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (obj: Pipe): TypeDecorator;
    */
    /* TODO: handle strange member:
    new (obj: Pipe): Pipe;
    */
}
/**
 * Pipe decorator and metadata.
 *
 * Use the `\@Pipe` annotation to declare that a given class is a pipe. A pipe
 * class must also implement {\@link PipeTransform} interface.
 *
 * To use the pipe include a reference to the pipe class in
 * {\@link NgModule#declarations}.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ Pipe = makeDecorator('Pipe', (p) => (Object.assign({ pure: true }, p)));
/**
 * Type of the Input decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function InputDecorator() { }
function InputDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (bindingPropertyName?: string): any;
    */
    /* TODO: handle strange member:
    new (bindingPropertyName?: string): any;
    */
}
/**
 * Input decorator and metadata.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ Input = makePropDecorator('Input', (bindingPropertyName) => ({ bindingPropertyName }));
/**
 * Type of the Output decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function OutputDecorator() { }
function OutputDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (bindingPropertyName?: string): any;
    */
    /* TODO: handle strange member:
    new (bindingPropertyName?: string): any;
    */
}
/**
 * Output decorator and metadata.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ Output = makePropDecorator('Output', (bindingPropertyName) => ({ bindingPropertyName }));
/**
 * Type of the HostBinding decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function HostBindingDecorator() { }
function HostBindingDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (hostPropertyName?: string): any;
    */
    /* TODO: handle strange member:
    new (hostPropertyName?: string): any;
    */
}
/**
 * HostBinding decorator and metadata.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ HostBinding = makePropDecorator('HostBinding', (hostPropertyName) => ({ hostPropertyName }));
/**
 * Type of the HostListener decorator / constructor function.
 *
 * \@stable
 * @record
 */
export function HostListenerDecorator() { }
function HostListenerDecorator_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (eventName: string, args?: string[]): any;
    */
    /* TODO: handle strange member:
    new (eventName: string, args?: string[]): any;
    */
}
/**
 * HostListener decorator and metadata.
 *
 * \@stable
 * \@Annotation
 */
export const /** @type {?} */ HostListener = makePropDecorator('HostListener', (eventName, args) => ({ eventName, args }));
//# sourceMappingURL=directives.js.map