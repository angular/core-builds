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
import { stringify } from '../util';
/**
 * An interface that a function passed into {\@link forwardRef} has to implement.
 *
 * ### Example
 *
 * {\@example core/di/ts/forward_ref/forward_ref_spec.ts region='forward_ref_fn'}
 * \@experimental
 * @record
 */
export function ForwardRefFn() { }
function ForwardRefFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (): any;
    */
}
/**
 * Allows to refer to references which are not yet defined.
 *
 * For instance, `forwardRef` is used when the `token` which we need to refer to for the purposes of
 * DI is declared,
 * but not yet defined. It is also used when the `token` which we use when creating a query is not
 * yet defined.
 *
 * ### Example
 * {\@example core/di/ts/forward_ref/forward_ref_spec.ts region='forward_ref'}
 * \@experimental
 * @param {?} forwardRefFn
 * @return {?}
 */
export function forwardRef(forwardRefFn) {
    (/** @type {?} */ (forwardRefFn)).__forward_ref__ = forwardRef;
    (/** @type {?} */ (forwardRefFn)).toString = function () { return stringify(this()); };
    return (/** @type {?} */ (/** @type {?} */ (forwardRefFn)));
}
/**
 * Lazily retrieves the reference value from a forwardRef.
 *
 * Acts as the identity function when given a non-forward-ref value.
 *
 * ### Example ([live demo](http://plnkr.co/edit/GU72mJrk1fiodChcmiDR?p=preview))
 *
 * {\@example core/di/ts/forward_ref/forward_ref_spec.ts region='resolve_forward_ref'}
 *
 * See: {\@link forwardRef}
 * \@experimental
 * @param {?} type
 * @return {?}
 */
export function resolveForwardRef(type) {
    if (typeof type === 'function' && type.hasOwnProperty('__forward_ref__') &&
        type.__forward_ref__ === forwardRef) {
        return (/** @type {?} */ (type))();
    }
    else {
        return type;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yd2FyZF9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9mb3J3YXJkX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBCbEMsTUFBTSxxQkFBcUIsWUFBMEI7SUFDbkQsbUJBQU0sWUFBWSxFQUFDLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQztJQUNqRCxtQkFBTSxZQUFZLEVBQUMsQ0FBQyxRQUFRLEdBQUcsY0FBYSxPQUFPLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN4RSxPQUFPLG1CQUFDLGtCQUFnQixZQUFZLENBQUEsRUFBQyxDQUFDO0NBQ3ZDOzs7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLDRCQUE0QixJQUFTO0lBQ3pDLElBQUksT0FBTyxJQUFJLEtBQUssVUFBVSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUM7UUFDcEUsSUFBSSxDQUFDLGVBQWUsS0FBSyxVQUFVLEVBQUU7UUFDdkMsT0FBTyxtQkFBZSxJQUFJLEVBQUMsRUFBRSxDQUFDO0tBQy9CO1NBQU07UUFDTCxPQUFPLElBQUksQ0FBQztLQUNiO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cblxuXG4vKipcbiAqIEFuIGludGVyZmFjZSB0aGF0IGEgZnVuY3Rpb24gcGFzc2VkIGludG8ge0BsaW5rIGZvcndhcmRSZWZ9IGhhcyB0byBpbXBsZW1lbnQuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9mb3J3YXJkX3JlZi9mb3J3YXJkX3JlZl9zcGVjLnRzIHJlZ2lvbj0nZm9yd2FyZF9yZWZfZm4nfVxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvcndhcmRSZWZGbiB7ICgpOiBhbnk7IH1cblxuLyoqXG4gKiBBbGxvd3MgdG8gcmVmZXIgdG8gcmVmZXJlbmNlcyB3aGljaCBhcmUgbm90IHlldCBkZWZpbmVkLlxuICpcbiAqIEZvciBpbnN0YW5jZSwgYGZvcndhcmRSZWZgIGlzIHVzZWQgd2hlbiB0aGUgYHRva2VuYCB3aGljaCB3ZSBuZWVkIHRvIHJlZmVyIHRvIGZvciB0aGUgcHVycG9zZXMgb2ZcbiAqIERJIGlzIGRlY2xhcmVkLFxuICogYnV0IG5vdCB5ZXQgZGVmaW5lZC4gSXQgaXMgYWxzbyB1c2VkIHdoZW4gdGhlIGB0b2tlbmAgd2hpY2ggd2UgdXNlIHdoZW4gY3JlYXRpbmcgYSBxdWVyeSBpcyBub3RcbiAqIHlldCBkZWZpbmVkLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9mb3J3YXJkX3JlZi9mb3J3YXJkX3JlZl9zcGVjLnRzIHJlZ2lvbj0nZm9yd2FyZF9yZWYnfVxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9yd2FyZFJlZihmb3J3YXJkUmVmRm46IEZvcndhcmRSZWZGbik6IFR5cGU8YW55PiB7XG4gICg8YW55PmZvcndhcmRSZWZGbikuX19mb3J3YXJkX3JlZl9fID0gZm9yd2FyZFJlZjtcbiAgKDxhbnk+Zm9yd2FyZFJlZkZuKS50b1N0cmluZyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3RyaW5naWZ5KHRoaXMoKSk7IH07XG4gIHJldHVybiAoPFR5cGU8YW55Pj48YW55PmZvcndhcmRSZWZGbik7XG59XG5cbi8qKlxuICogTGF6aWx5IHJldHJpZXZlcyB0aGUgcmVmZXJlbmNlIHZhbHVlIGZyb20gYSBmb3J3YXJkUmVmLlxuICpcbiAqIEFjdHMgYXMgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIHdoZW4gZ2l2ZW4gYSBub24tZm9yd2FyZC1yZWYgdmFsdWUuXG4gKlxuICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L0dVNzJtSnJrMWZpb2RDaGNtaURSP3A9cHJldmlldykpXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvZm9yd2FyZF9yZWYvZm9yd2FyZF9yZWZfc3BlYy50cyByZWdpb249J3Jlc29sdmVfZm9yd2FyZF9yZWYnfVxuICpcbiAqIFNlZToge0BsaW5rIGZvcndhcmRSZWZ9XG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRm9yd2FyZFJlZih0eXBlOiBhbnkpOiBhbnkge1xuICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicgJiYgdHlwZS5oYXNPd25Qcm9wZXJ0eSgnX19mb3J3YXJkX3JlZl9fJykgJiZcbiAgICAgIHR5cGUuX19mb3J3YXJkX3JlZl9fID09PSBmb3J3YXJkUmVmKSB7XG4gICAgcmV0dXJuICg8Rm9yd2FyZFJlZkZuPnR5cGUpKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cbn1cbiJdfQ==