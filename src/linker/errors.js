/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { wrappedError } from '../error_handler';
import { ERROR_DEBUG_CONTEXT, ERROR_TYPE } from '../errors';
/**
 * An error thrown if application changes model breaking the top-down data flow.
 *
 * This exception is only thrown in dev mode.
 *
 * <!-- TODO: Add a link once the dev mode option is configurable -->
 *
 * ### Example
 *
 * ```typescript
 * \@Component({
 *   selector: 'parent',
 *   template: '<child [prop]="parentProp"></child>',
 * })
 * class Parent {
 *   parentProp = 'init';
 * }
 *
 * \@Directive({selector: 'child', inputs: ['prop']})
 * class Child {
 *   constructor(public parent: Parent) {}
 *
 *   set prop(v) {
 *     // this updates the parent property, which is disallowed during change detection
 *     // this will result in ExpressionChangedAfterItHasBeenCheckedError
 *     this.parent.parentProp = 'updated';
 *   }
 * }
 * ```
 * @param {?} oldValue
 * @param {?} currValue
 * @param {?} isFirstCheck
 * @return {?}
 */
export function expressionChangedAfterItHasBeenCheckedError(oldValue, currValue, isFirstCheck) {
    var /** @type {?} */ msg = "Expression has changed after it was checked. Previous value: '" + oldValue + "'. Current value: '" + currValue + "'.";
    if (isFirstCheck) {
        msg +=
            " It seems like the view has been created after its parent and its children have been dirty checked." +
                " Has it been created in a change detection hook ?";
    }
    var /** @type {?} */ error = Error(msg);
    ((error))[ERROR_TYPE] = expressionChangedAfterItHasBeenCheckedError;
    return error;
}
/**
 * Thrown when an exception was raised during view creation, change detection or destruction.
 *
 * This error wraps the original exception to attach additional contextual information that can
 * be useful for debugging.
 * @param {?} originalError
 * @param {?} context
 * @return {?}
 */
export function viewWrappedError(originalError, context) {
    var /** @type {?} */ error = wrappedError("Error in " + context.source, originalError);
    ((error))[ERROR_DEBUG_CONTEXT] = context;
    ((error))[ERROR_TYPE] = viewWrappedError;
    return error;
}
/**
 * Thrown when a destroyed view is used.
 *
 * This error indicates a bug in the framework.
 *
 * This is an internal Angular error.
 * @param {?} details
 * @return {?}
 */
export function viewDestroyedError(details) {
    return Error("Attempt to use a destroyed view: " + details);
}
//# sourceMappingURL=errors.js.map