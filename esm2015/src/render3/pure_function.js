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
import { assertReservedSlotInitialized, bindingUpdated, bindingUpdated2, bindingUpdated4, checkAndUpdateBinding, consumeBinding, getCreationMode, moveBindingIndexToReservedSlot, restoreBindingIndex } from './instructions';
/**
 * If the value hasn't been saved, calls the pure function to store and return the
 * value. If it has been saved, returns the saved value.
 *
 * @template T
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn Function that returns a value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} value
 */
export function pureFunction0(slotOffset, pureFn, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 1);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ value = getCreationMode() ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg) : pureFn()) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of the provided exp has changed, calls the pure function to return
 * an updated value. Or if the value has not changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn Function that returns an updated value
 * @param {?} exp Updated expression value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction1(slotOffset, pureFn, exp, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 2);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ value = bindingUpdated(exp) ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp) : pureFn(exp)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction2(slotOffset, pureFn, exp1, exp2, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 3);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ value = bindingUpdated2(exp1, exp2) ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2) : pureFn(exp1, exp2)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction3(slotOffset, pureFn, exp1, exp2, exp3, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 4);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ different = bindingUpdated2(exp1, exp2);
    const /** @type {?} */ value = bindingUpdated(exp3) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3) : pureFn(exp1, exp2, exp3)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction4(slotOffset, pureFn, exp1, exp2, exp3, exp4, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 5);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ value = bindingUpdated4(exp1, exp2, exp3, exp4) ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4) : pureFn(exp1, exp2, exp3, exp4)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction5(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 6);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    const /** @type {?} */ value = bindingUpdated(exp5) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5) :
            pureFn(exp1, exp2, exp3, exp4, exp5)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?} exp6
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction6(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 7);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    const /** @type {?} */ value = bindingUpdated2(exp5, exp6) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?} exp6
 * @param {?} exp7
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction7(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 8);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    let /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    different = bindingUpdated2(exp5, exp6) || different;
    const /** @type {?} */ value = bindingUpdated(exp7) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
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
 * @return {?} Updated or cached value
 */
export function pureFunction8(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, 9);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    const /** @type {?} */ different = bindingUpdated4(exp1, exp2, exp3, exp4);
    const /** @type {?} */ value = bindingUpdated4(exp5, exp6, exp7, exp8) || different ?
        checkAndUpdateBinding(thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8)) :
        consumeBinding();
    restoreBindingIndex(index);
    return value;
}
/**
 * pureFunction instruction that can support any number of bindings.
 *
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} slotOffset the offset in the reserved slot space {\@link reserveSlots}
 * @param {?} pureFn A pure function that takes binding values and builds an object or array
 * containing those values.
 * @param {?} exps An array of binding values
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunctionV(slotOffset, pureFn, exps, thisArg) {
    ngDevMode && assertReservedSlotInitialized(slotOffset, exps.length + 1);
    const /** @type {?} */ index = moveBindingIndexToReservedSlot(slotOffset);
    let /** @type {?} */ different = false;
    for (let /** @type {?} */ i = 0; i < exps.length; i++) {
        bindingUpdated(exps[i]) && (different = true);
    }
    const /** @type {?} */ value = different ? checkAndUpdateBinding(pureFn.apply(thisArg, exps)) : consumeBinding();
    restoreBindingIndex(index);
    return value;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcHVyZV9mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyw2QkFBNkIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLDhCQUE4QixFQUFFLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7Ozs7Ozs7O0FBYTVOLE1BQU0sd0JBQTJCLFVBQWtCLEVBQUUsTUFBZSxFQUFFLE9BQWE7SUFDakYsU0FBUyxJQUFJLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRCx1QkFBTSxLQUFLLEdBQUcsOEJBQThCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDekQsdUJBQU0sS0FBSyxHQUFHLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDN0IscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEUsY0FBYyxFQUFFLENBQUM7SUFDckIsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLHdCQUNGLFVBQWtCLEVBQUUsTUFBdUIsRUFBRSxHQUFRLEVBQUUsT0FBYTtJQUN0RSxTQUFTLElBQUksNkJBQTZCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFELHVCQUFNLEtBQUssR0FBRyw4QkFBOEIsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN6RCx1QkFBTSxLQUFLLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7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QUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkUsY0FBYyxFQUFFLENBQUM7SUFDckIsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7Ozs7Ozs7Ozs7QUFlRCxNQUFNLHdCQUNGLFVBQWtCLEVBQUUsTUFBNEIsRUFBRSxJQUFXLEVBQUUsT0FBYTtJQUM5RSxTQUFTLElBQUksNkJBQTZCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDeEUsdUJBQU0sS0FBSyxHQUFHLDhCQUE4QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRXpELHFCQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDdEIsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUMvQztJQUNELHVCQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ2hHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE9BQU8sS0FBSyxDQUFDO0NBQ2QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0UmVzZXJ2ZWRTbG90SW5pdGlhbGl6ZWQsIGJpbmRpbmdVcGRhdGVkLCBiaW5kaW5nVXBkYXRlZDIsIGJpbmRpbmdVcGRhdGVkNCwgY2hlY2tBbmRVcGRhdGVCaW5kaW5nLCBjb25zdW1lQmluZGluZywgZ2V0Q3JlYXRpb25Nb2RlLCBtb3ZlQmluZGluZ0luZGV4VG9SZXNlcnZlZFNsb3QsIHJlc3RvcmVCaW5kaW5nSW5kZXh9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcblxuXG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIGhhc24ndCBiZWVuIHNhdmVkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byBzdG9yZSBhbmQgcmV0dXJuIHRoZVxuICogdmFsdWUuIElmIGl0IGhhcyBiZWVuIHNhdmVkLCByZXR1cm5zIHRoZSBzYXZlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gcHVyZUZuIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHZhbHVlXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlIHtAbGluayByZXNlcnZlU2xvdHN9XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uMDxUPihzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKCkgPT4gVCwgdGhpc0FyZz86IGFueSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UmVzZXJ2ZWRTbG90SW5pdGlhbGl6ZWQoc2xvdE9mZnNldCwgMSk7XG4gIGNvbnN0IGluZGV4ID0gbW92ZUJpbmRpbmdJbmRleFRvUmVzZXJ2ZWRTbG90KHNsb3RPZmZzZXQpO1xuICBjb25zdCB2YWx1ZSA9IGdldENyZWF0aW9uTW9kZSgpID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyh0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZykgOiBwdXJlRm4oKSkgOlxuICAgICAgY29uc3VtZUJpbmRpbmcoKTtcbiAgcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleCk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlIHtAbGluayByZXNlcnZlU2xvdHN9XG4gKiBAcGFyYW0gcHVyZUZuIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiB1cGRhdGVkIHZhbHVlXG4gKiBAcGFyYW0gZXhwIFVwZGF0ZWQgZXhwcmVzc2lvbiB2YWx1ZVxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjEoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2OiBhbnkpID0+IGFueSwgZXhwOiBhbnksIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UmVzZXJ2ZWRTbG90SW5pdGlhbGl6ZWQoc2xvdE9mZnNldCwgMik7XG4gIGNvbnN0IGluZGV4ID0gbW92ZUJpbmRpbmdJbmRleFRvUmVzZXJ2ZWRTbG90KHNsb3RPZmZzZXQpO1xuICBjb25zdCB2YWx1ZSA9IGJpbmRpbmdVcGRhdGVkKGV4cCkgP1xuICAgICAgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHApIDogcHVyZUZuKGV4cCkpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG4gIHJlc3RvcmVCaW5kaW5nSW5kZXgoaW5kZXgpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBpbiB0aGUgcmVzZXJ2ZWQgc2xvdCBzcGFjZSB7QGxpbmsgcmVzZXJ2ZVNsb3RzfVxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uMihcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0LCAzKTtcbiAgY29uc3QgaW5kZXggPSBtb3ZlQmluZGluZ0luZGV4VG9SZXNlcnZlZFNsb3Qoc2xvdE9mZnNldCk7XG4gIGNvbnN0IHZhbHVlID0gYmluZGluZ1VwZGF0ZWQyKGV4cDEsIGV4cDIpID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyh0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMikgOiBwdXJlRm4oZXhwMSwgZXhwMikpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG4gIHJlc3RvcmVCaW5kaW5nSW5kZXgoaW5kZXgpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBpbiB0aGUgcmVzZXJ2ZWQgc2xvdCBzcGFjZSB7QGxpbmsgcmVzZXJ2ZVNsb3RzfVxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjMoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0LCA0KTtcbiAgY29uc3QgaW5kZXggPSBtb3ZlQmluZGluZ0luZGV4VG9SZXNlcnZlZFNsb3Qoc2xvdE9mZnNldCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHAxLCBleHAyKTtcbiAgY29uc3QgdmFsdWUgPSBiaW5kaW5nVXBkYXRlZChleHAzKSB8fCBkaWZmZXJlbnQgP1xuICAgICAgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzKSA6IHB1cmVGbihleHAxLCBleHAyLCBleHAzKSkgOlxuICAgICAgY29uc3VtZUJpbmRpbmcoKTtcbiAgcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleCk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlIHtAbGluayByZXNlcnZlU2xvdHN9XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjQoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LFxuICAgIGV4cDM6IGFueSwgZXhwNDogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFJlc2VydmVkU2xvdEluaXRpYWxpemVkKHNsb3RPZmZzZXQsIDUpO1xuICBjb25zdCBpbmRleCA9IG1vdmVCaW5kaW5nSW5kZXhUb1Jlc2VydmVkU2xvdChzbG90T2Zmc2V0KTtcbiAgY29uc3QgdmFsdWUgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCkgP1xuICAgICAgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0KSA6IHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0KSkgOlxuICAgICAgY29uc3VtZUJpbmRpbmcoKTtcbiAgcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleCk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGluIHRoZSByZXNlcnZlZCBzbG90IHNwYWNlIHtAbGluayByZXNlcnZlU2xvdHN9XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb241KFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSkgPT4gYW55LCBleHAxOiBhbnksXG4gICAgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFJlc2VydmVkU2xvdEluaXRpYWxpemVkKHNsb3RPZmZzZXQsIDYpO1xuICBjb25zdCBpbmRleCA9IG1vdmVCaW5kaW5nSW5kZXhUb1Jlc2VydmVkU2xvdChzbG90T2Zmc2V0KTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpO1xuICBjb25zdCB2YWx1ZSA9IGJpbmRpbmdVcGRhdGVkKGV4cDUpIHx8IGRpZmZlcmVudCA/XG4gICAgICBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpIDpcbiAgICAgICAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpKSA6XG4gICAgICBjb25zdW1lQmluZGluZygpO1xuICByZXN0b3JlQmluZGluZ0luZGV4KGluZGV4KTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2Uge0BsaW5rIHJlc2VydmVTbG90c31cbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSBleHA0XG4gKiBAcGFyYW0gZXhwNVxuICogQHBhcmFtIGV4cDZcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb242KFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSkgPT4gYW55LFxuICAgIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UmVzZXJ2ZWRTbG90SW5pdGlhbGl6ZWQoc2xvdE9mZnNldCwgNyk7XG4gIGNvbnN0IGluZGV4ID0gbW92ZUJpbmRpbmdJbmRleFRvUmVzZXJ2ZWRTbG90KHNsb3RPZmZzZXQpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIGNvbnN0IHZhbHVlID0gYmluZGluZ1VwZGF0ZWQyKGV4cDUsIGV4cDYpIHx8IGRpZmZlcmVudCA/XG4gICAgICBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYpIDpcbiAgICAgICAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYpKSA6XG4gICAgICBjb25zdW1lQmluZGluZygpO1xuICByZXN0b3JlQmluZGluZ0luZGV4KGluZGV4KTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgaW4gdGhlIHJlc2VydmVkIHNsb3Qgc3BhY2Uge0BsaW5rIHJlc2VydmVTbG90c31cbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSBleHA0XG4gKiBAcGFyYW0gZXhwNVxuICogQHBhcmFtIGV4cDZcbiAqIEBwYXJhbSBleHA3XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uNyhcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSkgPT4gYW55LCBleHAxOiBhbnksXG4gICAgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0LCA4KTtcbiAgY29uc3QgaW5kZXggPSBtb3ZlQmluZGluZ0luZGV4VG9SZXNlcnZlZFNsb3Qoc2xvdE9mZnNldCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHA1LCBleHA2KSB8fCBkaWZmZXJlbnQ7XG4gIGNvbnN0IHZhbHVlID0gYmluZGluZ1VwZGF0ZWQoZXhwNykgfHwgZGlmZmVyZW50ID9cbiAgICAgIGNoZWNrQW5kVXBkYXRlQmluZGluZyhcbiAgICAgICAgICB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNiwgZXhwNykgOlxuICAgICAgICAgICAgICAgICAgICBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNiwgZXhwNykpIDpcbiAgICAgIGNvbnN1bWVCaW5kaW5nKCk7XG4gIHJlc3RvcmVCaW5kaW5nSW5kZXgoaW5kZXgpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBpbiB0aGUgcmVzZXJ2ZWQgc2xvdCBzcGFjZSB7QGxpbmsgcmVzZXJ2ZVNsb3RzfVxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gZXhwNlxuICogQHBhcmFtIGV4cDdcbiAqIEBwYXJhbSBleHA4XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uOChcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSwgdjg6IGFueSkgPT4gYW55LFxuICAgIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgZXhwODogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UmVzZXJ2ZWRTbG90SW5pdGlhbGl6ZWQoc2xvdE9mZnNldCwgOSk7XG4gIGNvbnN0IGluZGV4ID0gbW92ZUJpbmRpbmdJbmRleFRvUmVzZXJ2ZWRTbG90KHNsb3RPZmZzZXQpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQoZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIGNvbnN0IHZhbHVlID0gYmluZGluZ1VwZGF0ZWQ0KGV4cDUsIGV4cDYsIGV4cDcsIGV4cDgpIHx8IGRpZmZlcmVudCA/XG4gICAgICBjaGVja0FuZFVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYsIGV4cDcsIGV4cDgpIDpcbiAgICAgICAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYsIGV4cDcsIGV4cDgpKSA6XG4gICAgICBjb25zdW1lQmluZGluZygpO1xuICByZXN0b3JlQmluZGluZ0luZGV4KGluZGV4KTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIHB1cmVGdW5jdGlvbiBpbnN0cnVjdGlvbiB0aGF0IGNhbiBzdXBwb3J0IGFueSBudW1iZXIgb2YgYmluZGluZ3MuXG4gKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBpbiB0aGUgcmVzZXJ2ZWQgc2xvdCBzcGFjZSB7QGxpbmsgcmVzZXJ2ZVNsb3RzfVxuICogQHBhcmFtIHB1cmVGbiBBIHB1cmUgZnVuY3Rpb24gdGhhdCB0YWtlcyBiaW5kaW5nIHZhbHVlcyBhbmQgYnVpbGRzIGFuIG9iamVjdCBvciBhcnJheVxuICogY29udGFpbmluZyB0aG9zZSB2YWx1ZXMuXG4gKiBAcGFyYW0gZXhwcyBBbiBhcnJheSBvZiBiaW5kaW5nIHZhbHVlc1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvblYoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICguLi52OiBhbnlbXSkgPT4gYW55LCBleHBzOiBhbnlbXSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0LCBleHBzLmxlbmd0aCArIDEpO1xuICBjb25zdCBpbmRleCA9IG1vdmVCaW5kaW5nSW5kZXhUb1Jlc2VydmVkU2xvdChzbG90T2Zmc2V0KTtcblxuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwcy5sZW5ndGg7IGkrKykge1xuICAgIGJpbmRpbmdVcGRhdGVkKGV4cHNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICBjb25zdCB2YWx1ZSA9IGRpZmZlcmVudCA/IGNoZWNrQW5kVXBkYXRlQmluZGluZyhwdXJlRm4uYXBwbHkodGhpc0FyZywgZXhwcykpIDogY29uc3VtZUJpbmRpbmcoKTtcbiAgcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleCk7XG4gIHJldHVybiB2YWx1ZTtcbn1cbiJdfQ==