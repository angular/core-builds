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
 * \@usageNotes
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
 * DI is declared, but not yet defined. It is also used when the `token` which we use when creating
 * a query is not yet defined.
 *
 * \@usageNotes
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
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/forward_ref/forward_ref_spec.ts region='resolve_forward_ref'}
 *
 * @see `forwardRef`
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yd2FyZF9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9mb3J3YXJkX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQmxDLE1BQU0scUJBQXFCLFlBQTBCO0lBQ25ELG1CQUFNLFlBQVksRUFBQyxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUM7SUFDakQsbUJBQU0sWUFBWSxFQUFDLENBQUMsUUFBUSxHQUFHLGNBQWEsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDeEUsT0FBTyxtQkFBQyxrQkFBZ0IsWUFBWSxDQUFBLEVBQUMsQ0FBQztDQUN2Qzs7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sNEJBQTRCLElBQVM7SUFDekMsSUFBSSxPQUFPLElBQUksS0FBSyxVQUFVLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQztRQUNwRSxJQUFJLENBQUMsZUFBZSxLQUFLLFVBQVUsRUFBRTtRQUN2QyxPQUFPLG1CQUFlLElBQUksRUFBQyxFQUFFLENBQUM7S0FDL0I7U0FBTTtRQUNMLE9BQU8sSUFBSSxDQUFDO0tBQ2I7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuXG5cbi8qKlxuICogQW4gaW50ZXJmYWNlIHRoYXQgYSBmdW5jdGlvbiBwYXNzZWQgaW50byB7QGxpbmsgZm9yd2FyZFJlZn0gaGFzIHRvIGltcGxlbWVudC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9mb3J3YXJkX3JlZi9mb3J3YXJkX3JlZl9zcGVjLnRzIHJlZ2lvbj0nZm9yd2FyZF9yZWZfZm4nfVxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZvcndhcmRSZWZGbiB7ICgpOiBhbnk7IH1cblxuLyoqXG4gKiBBbGxvd3MgdG8gcmVmZXIgdG8gcmVmZXJlbmNlcyB3aGljaCBhcmUgbm90IHlldCBkZWZpbmVkLlxuICpcbiAqIEZvciBpbnN0YW5jZSwgYGZvcndhcmRSZWZgIGlzIHVzZWQgd2hlbiB0aGUgYHRva2VuYCB3aGljaCB3ZSBuZWVkIHRvIHJlZmVyIHRvIGZvciB0aGUgcHVycG9zZXMgb2ZcbiAqIERJIGlzIGRlY2xhcmVkLCBidXQgbm90IHlldCBkZWZpbmVkLiBJdCBpcyBhbHNvIHVzZWQgd2hlbiB0aGUgYHRva2VuYCB3aGljaCB3ZSB1c2Ugd2hlbiBjcmVhdGluZ1xuICogYSBxdWVyeSBpcyBub3QgeWV0IGRlZmluZWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9mb3J3YXJkX3JlZi9mb3J3YXJkX3JlZl9zcGVjLnRzIHJlZ2lvbj0nZm9yd2FyZF9yZWYnfVxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9yd2FyZFJlZihmb3J3YXJkUmVmRm46IEZvcndhcmRSZWZGbik6IFR5cGU8YW55PiB7XG4gICg8YW55PmZvcndhcmRSZWZGbikuX19mb3J3YXJkX3JlZl9fID0gZm9yd2FyZFJlZjtcbiAgKDxhbnk+Zm9yd2FyZFJlZkZuKS50b1N0cmluZyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gc3RyaW5naWZ5KHRoaXMoKSk7IH07XG4gIHJldHVybiAoPFR5cGU8YW55Pj48YW55PmZvcndhcmRSZWZGbik7XG59XG5cbi8qKlxuICogTGF6aWx5IHJldHJpZXZlcyB0aGUgcmVmZXJlbmNlIHZhbHVlIGZyb20gYSBmb3J3YXJkUmVmLlxuICpcbiAqIEFjdHMgYXMgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIHdoZW4gZ2l2ZW4gYSBub24tZm9yd2FyZC1yZWYgdmFsdWUuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvZm9yd2FyZF9yZWYvZm9yd2FyZF9yZWZfc3BlYy50cyByZWdpb249J3Jlc29sdmVfZm9yd2FyZF9yZWYnfVxuICpcbiAqIEBzZWUgYGZvcndhcmRSZWZgXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRm9yd2FyZFJlZih0eXBlOiBhbnkpOiBhbnkge1xuICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicgJiYgdHlwZS5oYXNPd25Qcm9wZXJ0eSgnX19mb3J3YXJkX3JlZl9fJykgJiZcbiAgICAgIHR5cGUuX19mb3J3YXJkX3JlZl9fID09PSBmb3J3YXJkUmVmKSB7XG4gICAgcmV0dXJuICg8Rm9yd2FyZFJlZkZuPnR5cGUpKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cbn1cbiJdfQ==