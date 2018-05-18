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
import { bindingUpdated, bindingUpdated2, bindingUpdated4, checkAndUpdateBinding, consumeBinding, getCreationMode } from './instructions';
/**
 * If the value hasn't been saved, calls the pure function to store and return the
 * value. If it has been saved, returns the saved value.
 *
 * @template T
 * @param {?} pureFn Function that returns a value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} value
 */
export function pureFunction0(pureFn, thisArg) {
    return getCreationMode() ? checkAndUpdateBinding(thisArg ? pureFn.call(thisArg) : pureFn()) :
        consumeBinding();
}
/**
 * If the value of the provided exp has changed, calls the pure function to return
 * an updated value. Or if the value has not changed, returns cached value.
 *
 * @param {?} pureFn Function that returns an updated value
 * @param {?} exp Updated expression value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction1(pureFn, exp, thisArg) {
    return bindingUpdated(exp) ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp) : pureFn(exp)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction2(pureFn, exp1, exp2, thisArg) {
    return bindingUpdated2(exp1, exp2) ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2) : pureFn(exp1, exp2)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction3(pureFn, exp1, exp2, exp3, thisArg) {
    const /** @type {?} */ different = bindingUpdated2(exp1, exp2);
    return bindingUpdated(exp3) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3) : pureFn(exp1, exp2, exp3)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction4(pureFn, exp1, exp2, exp3, exp4, thisArg) {
    return bindingUpdated4(exp1, exp2, exp3, exp4) ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4) : pureFn(exp1, exp2, exp3, exp4)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction5(pureFn, exp1, exp2, exp3, exp4, exp5, thisArg) {
    const /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    return bindingUpdated(exp5) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5) :
            pureFn(exp1, exp2, exp3, exp4, exp5)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?} exp6
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction6(pureFn, exp1, exp2, exp3, exp4, exp5, exp6, thisArg) {
    const /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    return bindingUpdated2(exp5, exp6) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?} exp6
 * @param {?} exp7
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction7(pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, thisArg) {
    let /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    different = bindingUpdated2(exp5, exp6) || different;
    return bindingUpdated(exp7) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7)) :
        consumeBinding();
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?} exp6
 * @param {?} exp7
 * @param {?} exp8
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunction8(pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, thisArg) {
    const /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    return bindingUpdated4(exp5, exp6, exp7, exp8) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8)) :
        consumeBinding();
}
/**
 * pureFunction instruction that can support any number of bindings.
 *
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} pureFn A pure function that takes binding values and builds an object or array
 * containing those values.
 * @param {?} exps An array of binding values
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated value
 */
export function pureFunctionV(pureFn, exps, thisArg) {
    let /** @type {?} */ different = false;
    for (let /** @type {?} */ i = 0; i < exps.length; i++) {
        bindingUpdated(exps[i]) && (different = true);
    }
    return different ? checkAndUpdateBinding(pureFn.apply(thisArg, exps)) : consumeBinding();
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcHVyZV9mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7Ozs7Ozs7QUFZeEksTUFBTSx3QkFBMkIsTUFBZSxFQUFFLE9BQWE7SUFDN0QsT0FBTyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEUsY0FBYyxFQUFFLENBQUM7Q0FDN0M7Ozs7Ozs7Ozs7QUFXRCxNQUFNLHdCQUF3QixNQUF1QixFQUFFLEdBQVEsRUFBRSxPQUFhO0lBQzVFLE9BQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEIscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRSxjQUFjLEVBQUUsQ0FBQztDQUN0Qjs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLHdCQUNGLE1BQWlDLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxPQUFhO0lBQ3hFLE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFB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QixDQUNqQixPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLGNBQWMsRUFBRSxDQUFDO0NBQ3RCOzs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSx3QkFBd0IsTUFBNEIsRUFBRSxJQUFXLEVBQUUsT0FBYTtJQUNwRixxQkFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBRXRCLEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Q0FDMUYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YmluZGluZ1VwZGF0ZWQsIGJpbmRpbmdVcGRhdGVkMiwgYmluZGluZ1VwZGF0ZWQ0LCBjaGVja0FuZFVwZGF0ZUJpbmRpbmcsIGNvbnN1bWVCaW5kaW5nLCBnZXRDcmVhdGlvbk1vZGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcblxuXG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIGhhc24ndCBiZWVuIHNhdmVkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byBzdG9yZSBhbmQgcmV0dXJuIHRoZVxuICogdmFsdWUuIElmIGl0IGhhcyBiZWVuIHNhdmVkLCByZXR1cm5zIHRoZSBzYXZlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gcHVyZUZuIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHZhbHVlXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uMDxUPihwdXJlRm46ICgpID0+IFQsIHRoaXNBcmc/OiBhbnkpOiBUIHtcbiAgcmV0dXJuIGdldENyZWF0aW9uTW9kZSgpID8gY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnKSA6IHB1cmVGbigpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIHRoZSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHB1cmVGbiBGdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gdXBkYXRlZCB2YWx1ZVxuICogQHBhcmFtIGV4cCBVcGRhdGVkIGV4cHJlc3Npb24gdmFsdWVcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjEocHVyZUZuOiAodjogYW55KSA9PiBhbnksIGV4cDogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGV4cCkgP1xuICAgICAgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHApIDogcHVyZUZuKGV4cCkpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb24yKFxuICAgIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGV4cDEsIGV4cDIpID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyh0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMikgOiBwdXJlRm4oZXhwMSwgZXhwMikpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uMyhcbiAgICBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGV4cDMpIHx8IGRpZmZlcmVudCA/XG4gICAgICBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMpIDogcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMpKSA6XG4gICAgICBjb25zdW1lQmluZGluZygpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSBleHA0XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb240KFxuICAgIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQ0KGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyhcbiAgICAgICAgICB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCkgOiBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMywgZXhwNCkpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb241KFxuICAgIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSxcbiAgICBleHA0OiBhbnksIGV4cDU6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGV4cDUpIHx8IGRpZmZlcmVudCA/XG4gICAgICBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpIDpcbiAgICAgICAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpKSA6XG4gICAgICBjb25zdW1lQmluZGluZygpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSBleHA0XG4gKiBAcGFyYW0gZXhwNVxuICogQHBhcmFtIGV4cDZcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjYoXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSkgPT4gYW55LCBleHAxOiBhbnksIGV4cDI6IGFueSxcbiAgICBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIoZXhwNSwgZXhwNikgfHwgZGlmZmVyZW50ID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyhcbiAgICAgICAgICB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNikgOlxuICAgICAgICAgICAgICAgICAgICBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNikpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gZXhwNlxuICogQHBhcmFtIGV4cDdcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjcoXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSkgPT4gYW55LCBleHAxOiBhbnksXG4gICAgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHA1LCBleHA2KSB8fCBkaWZmZXJlbnQ7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChleHA3KSB8fCBkaWZmZXJlbnQgP1xuICAgICAgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3KSA6XG4gICAgICAgICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3KSkgOlxuICAgICAgY29uc3VtZUJpbmRpbmcoKTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSBleHA2XG4gKiBAcGFyYW0gZXhwN1xuICogQHBhcmFtIGV4cDhcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjgoXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSwgdjg6IGFueSkgPT4gYW55LFxuICAgIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgZXhwODogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDQoZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkgfHwgZGlmZmVyZW50ID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyhcbiAgICAgICAgICB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkgOlxuICAgICAgICAgICAgICAgICAgICBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG59XG5cbi8qKlxuICogcHVyZUZ1bmN0aW9uIGluc3RydWN0aW9uIHRoYXQgY2FuIHN1cHBvcnQgYW55IG51bWJlciBvZiBiaW5kaW5ncy5cbiAqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gcHVyZUZuIEEgcHVyZSBmdW5jdGlvbiB0aGF0IHRha2VzIGJpbmRpbmcgdmFsdWVzIGFuZCBidWlsZHMgYW4gb2JqZWN0IG9yIGFycmF5XG4gKiBjb250YWluaW5nIHRob3NlIHZhbHVlcy5cbiAqIEBwYXJhbSBleHBzIEFuIGFycmF5IG9mIGJpbmRpbmcgdmFsdWVzXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb25WKHB1cmVGbjogKC4uLnY6IGFueVtdKSA9PiBhbnksIGV4cHM6IGFueVtdLCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwcy5sZW5ndGg7IGkrKykge1xuICAgIGJpbmRpbmdVcGRhdGVkKGV4cHNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICByZXR1cm4gZGlmZmVyZW50ID8gY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHB1cmVGbi5hcHBseSh0aGlzQXJnLCBleHBzKSkgOiBjb25zdW1lQmluZGluZygpO1xufVxuIl19