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
import * as tslib_1 from "tslib";
import { ChangeDetectionStrategy } from '../change_detection/constants';
import { makeDecorator, makePropDecorator } from '../util/decorators';
/**
 * Type of the Directive decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ Directive = makeDecorator('Directive', function (dir) {
    if (dir === void 0) { dir = {}; }
    return dir;
});
/**
 * Type of the Component decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ Component = makeDecorator('Component', function (c) {
    if (c === void 0) { c = {}; }
    return (tslib_1.__assign({ changeDetection: ChangeDetectionStrategy.Default }, c));
}, Directive);
/**
 * Type of the Pipe decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ Pipe = makeDecorator('Pipe', function (p) { return (tslib_1.__assign({ pure: true }, p)); });
/**
 * Type of the Input decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ Input = makePropDecorator('Input', function (bindingPropertyName) { return ({ bindingPropertyName: bindingPropertyName }); });
/**
 * Type of the Output decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ Output = makePropDecorator('Output', function (bindingPropertyName) { return ({ bindingPropertyName: bindingPropertyName }); });
/**
 * Type of the HostBinding decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ HostBinding = makePropDecorator('HostBinding', function (hostPropertyName) { return ({ hostPropertyName: hostPropertyName }); });
/**
 * Type of the HostListener decorator / constructor function.
 *
 *
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
 *
 * \@Annotation
 */
export var /** @type {?} */ HostListener = makePropDecorator('HostListener', function (eventName, args) { return ({ eventName: eventName, args: args }); });
//# sourceMappingURL=directives.js.map