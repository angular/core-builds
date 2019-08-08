/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4, getBinding, updateBinding } from './bindings';
import { getBindingRoot, getLView } from './state';
import { isCreationMode } from './util/view_utils';
/**
 * Bindings for pure functions are stored after regular bindings.
 *
 * |------consts------|---------vars---------|                 |----- hostVars (dir1) ------|
 * ------------------------------------------------------------------------------------------
 * | nodes/refs/pipes | bindings | fn slots  | injector | dir1 | host bindings | host slots |
 * ------------------------------------------------------------------------------------------
 *                    ^                      ^
 *      TView.bindingStartIndex      TView.expandoStartIndex
 *
 * Pure function instructions are given an offset from the binding root. Adding the offset to the
 * binding root gives the first index where the bindings are stored. In component views, the binding
 * root is the bindingStartIndex. In host bindings, the binding root is the expandoStartIndex +
 * any directive instances + any hostVars in directives evaluated before it.
 *
 * See VIEW_DATA.md for more information about host binding resolution.
 */
/**
 * If the value hasn't been saved, calls the pure function to store and return the
 * value. If it has been saved, returns the saved value.
 *
 * \@codeGenApi
 * @template T
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn Function that returns a value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} value
 *
 */
export function ɵɵpureFunction0(slotOffset, pureFn, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    return isCreationMode(lView) ?
        updateBinding(lView, bindingIndex, thisArg ? pureFn.call(thisArg) : pureFn()) :
        getBinding(lView, bindingIndex);
}
/**
 * If the value of the provided exp has changed, calls the pure function to return
 * an updated value. Or if the value has not changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn Function that returns an updated value
 * @param {?} exp Updated expression value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunction1(slotOffset, pureFn, exp, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    return bindingUpdated(lView, bindingIndex, exp) ?
        updateBinding(lView, bindingIndex + 1, thisArg ? pureFn.call(thisArg, exp) : pureFn(exp)) :
        getBinding(lView, bindingIndex + 1);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunction2(slotOffset, pureFn, exp1, exp2, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    return bindingUpdated2(lView, bindingIndex, exp1, exp2) ?
        updateBinding(lView, bindingIndex + 2, thisArg ? pureFn.call(thisArg, exp1, exp2) : pureFn(exp1, exp2)) :
        getBinding(lView, bindingIndex + 2);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunction3(slotOffset, pureFn, exp1, exp2, exp3, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    return bindingUpdated3(lView, bindingIndex, exp1, exp2, exp3) ?
        updateBinding(lView, bindingIndex + 3, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3) : pureFn(exp1, exp2, exp3)) :
        getBinding(lView, bindingIndex + 3);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunction4(slotOffset, pureFn, exp1, exp2, exp3, exp4, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    return bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4) ?
        updateBinding(lView, bindingIndex + 4, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4) : pureFn(exp1, exp2, exp3, exp4)) :
        getBinding(lView, bindingIndex + 4);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunction5(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
    return bindingUpdated(lView, bindingIndex + 4, exp5) || different ?
        updateBinding(lView, bindingIndex + 5, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5) :
            pureFn(exp1, exp2, exp3, exp4, exp5)) :
        getBinding(lView, bindingIndex + 5);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @param {?} exp5
 * @param {?} exp6
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunction6(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
    return bindingUpdated2(lView, bindingIndex + 4, exp5, exp6) || different ?
        updateBinding(lView, bindingIndex + 6, thisArg ?
            pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6)) :
        getBinding(lView, bindingIndex + 6);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
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
 *
 */
export function ɵɵpureFunction7(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
    return bindingUpdated3(lView, bindingIndex + 4, exp5, exp6, exp7) || different ?
        updateBinding(lView, bindingIndex + 7, thisArg ?
            pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7)) :
        getBinding(lView, bindingIndex + 7);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
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
 *
 */
export function ɵɵpureFunction8(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const different = bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4);
    return bindingUpdated4(lView, bindingIndex + 4, exp5, exp6, exp7, exp8) || different ?
        updateBinding(lView, bindingIndex + 8, thisArg ?
            pureFn.call(thisArg, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8) :
            pureFn(exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8)) :
        getBinding(lView, bindingIndex + 8);
}
/**
 * pureFunction instruction that can support any number of bindings.
 *
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * \@codeGenApi
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn A pure function that takes binding values and builds an object or array
 * containing those values.
 * @param {?} exps An array of binding values
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 *
 */
export function ɵɵpureFunctionV(slotOffset, pureFn, exps, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    let bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    let different = false;
    /** @type {?} */
    const lView = getLView();
    for (let i = 0; i < exps.length; i++) {
        bindingUpdated(lView, bindingIndex++, exps[i]) && (different = true);
    }
    return different ? updateBinding(lView, bindingIndex, pureFn.apply(thisArg, exps)) :
        getBinding(lView, bindingIndex);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcHVyZV9mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN4SCxPQUFPLEVBQUMsY0FBYyxFQUFFLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNqRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDakQsTUFBTSxVQUFVLGVBQWUsQ0FBSSxVQUFrQixFQUFFLE1BQWUsRUFBRSxPQUFhOzs7VUFFN0UsWUFBWSxHQUFHLGNBQWMsRUFBRSxHQUFHLFVBQVU7O1VBQzVDLEtBQUssR0FBRyxRQUFRLEVBQUU7SUFDeEIsT0FBTyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMxQixhQUFhLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRSxVQUFVLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3RDLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixVQUFrQixFQUFFLE1BQXVCLEVBQUUsR0FBUSxFQUFFLE9BQWE7OztVQUVoRSxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixZQUFZLEdBQUcsY0FBYyxFQUFFLEdBQUcsVUFBVTtJQUNsRCxPQUFPLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEdB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LElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsVUFBa0IsRUFBRSxNQUE0QixFQUFFLElBQVcsRUFBRSxPQUFhOzs7UUFFMUUsWUFBWSxHQUFHLGNBQWMsRUFBRSxHQUFHLFVBQVU7O1FBQzVDLFNBQVMsR0FBRyxLQUFLOztVQUNmLEtBQUssR0FBRyxRQUFRLEVBQUU7SUFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEMsY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUN0RTtJQUNELE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsVUFBVSxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNyRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkLCBiaW5kaW5nVXBkYXRlZDIsIGJpbmRpbmdVcGRhdGVkMywgYmluZGluZ1VwZGF0ZWQ0LCBnZXRCaW5kaW5nLCB1cGRhdGVCaW5kaW5nfSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0QmluZGluZ1Jvb3QsIGdldExWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNDcmVhdGlvbk1vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG4vKipcbiAqIEJpbmRpbmdzIGZvciBwdXJlIGZ1bmN0aW9ucyBhcmUgc3RvcmVkIGFmdGVyIHJlZ3VsYXIgYmluZGluZ3MuXG4gKlxuICogfC0tLS0tLWNvbnN0cy0tLS0tLXwtLS0tLS0tLS12YXJzLS0tLS0tLS0tfCAgICAgICAgICAgICAgICAgfC0tLS0tIGhvc3RWYXJzIChkaXIxKSAtLS0tLS18XG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIHwgbm9kZXMvcmVmcy9waXBlcyB8IGJpbmRpbmdzIHwgZm4gc2xvdHMgIHwgaW5qZWN0b3IgfCBkaXIxIHwgaG9zdCBiaW5kaW5ncyB8IGhvc3Qgc2xvdHMgfFxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeXG4gKiAgICAgIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4ICAgICAgVFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXhcbiAqXG4gKiBQdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBhcmUgZ2l2ZW4gYW4gb2Zmc2V0IGZyb20gdGhlIGJpbmRpbmcgcm9vdC4gQWRkaW5nIHRoZSBvZmZzZXQgdG8gdGhlXG4gKiBiaW5kaW5nIHJvb3QgZ2l2ZXMgdGhlIGZpcnN0IGluZGV4IHdoZXJlIHRoZSBiaW5kaW5ncyBhcmUgc3RvcmVkLiBJbiBjb21wb25lbnQgdmlld3MsIHRoZSBiaW5kaW5nXG4gKiByb290IGlzIHRoZSBiaW5kaW5nU3RhcnRJbmRleC4gSW4gaG9zdCBiaW5kaW5ncywgdGhlIGJpbmRpbmcgcm9vdCBpcyB0aGUgZXhwYW5kb1N0YXJ0SW5kZXggK1xuICogYW55IGRpcmVjdGl2ZSBpbnN0YW5jZXMgKyBhbnkgaG9zdFZhcnMgaW4gZGlyZWN0aXZlcyBldmFsdWF0ZWQgYmVmb3JlIGl0LlxuICpcbiAqIFNlZSBWSUVXX0RBVEEubWQgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgaG9zdCBiaW5kaW5nIHJlc29sdXRpb24uXG4gKi9cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgaGFzbid0IGJlZW4gc2F2ZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHN0b3JlIGFuZCByZXR1cm4gdGhlXG4gKiB2YWx1ZS4gSWYgaXQgaGFzIGJlZW4gc2F2ZWQsIHJldHVybnMgdGhlIHNhdmVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgZnJvbSBiaW5kaW5nIHJvb3QgdG8gdGhlIHJlc2VydmVkIHNsb3RcbiAqIEBwYXJhbSBwdXJlRm4gRnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgdmFsdWVcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwdXJlRnVuY3Rpb24wPFQ+KHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAoKSA9PiBULCB0aGlzQXJnPzogYW55KTogVCB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnKSA6IHB1cmVGbigpKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiB0aGUgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgZnJvbSBiaW5kaW5nIHJvb3QgdG8gdGhlIHJlc2VydmVkIHNsb3RcbiAqIEBwYXJhbSBwdXJlRm4gRnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIHVwZGF0ZWQgdmFsdWVcbiAqIEBwYXJhbSBleHAgVXBkYXRlZCBleHByZXNzaW9uIHZhbHVlXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uMShcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHY6IGFueSkgPT4gYW55LCBleHA6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nUm9vdCgpICsgc2xvdE9mZnNldDtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cCkgP1xuICAgICAgdXBkYXRlQmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgMSwgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cCkgOiBwdXJlRm4oZXhwKSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgMSk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uMihcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyKSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyAyLFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyKSA6IHB1cmVGbihleHAxLCBleHAyKSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgMik7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXB1cmVGdW5jdGlvbjMoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMyhsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzKSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyAzLFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzKSA6IHB1cmVGbihleHAxLCBleHAyLCBleHAzKSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgMyk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwdXJlRnVuY3Rpb240KFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSkgPT4gYW55LCBleHAxOiBhbnksIGV4cDI6IGFueSxcbiAgICBleHAzOiBhbnksIGV4cDQ6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0KSA6IHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgNCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uNShcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnkpID0+IGFueSwgZXhwMTogYW55LFxuICAgIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnksIGV4cDU6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIGV4cDUpIHx8IGRpZmZlcmVudCA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyA1LCB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA1KTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSBleHA2XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uNihcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnksIHY2OiBhbnkpID0+IGFueSxcbiAgICBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnksIGV4cDU6IGFueSwgZXhwNjogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgLy8gVE9ETyhrYXJhKTogdXNlIGJpbmRpbmdSb290IGluc3RlYWQgb2YgYmluZGluZ1N0YXJ0SW5kZXggd2hlbiBpbXBsZW1lbnRpbmcgaG9zdCBiaW5kaW5nc1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nUm9vdCgpICsgc2xvdE9mZnNldDtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIGV4cDUsIGV4cDYpIHx8IGRpZmZlcmVudCA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyA2LCB0aGlzQXJnID9cbiAgICAgICAgICAgICAgcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNikgOlxuICAgICAgICAgICAgICBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNikpIDpcbiAgICAgIGdldEJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCArIDYpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgZnJvbSBiaW5kaW5nIHJvb3QgdG8gdGhlIHJlc2VydmVkIHNsb3RcbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSBleHA0XG4gKiBAcGFyYW0gZXhwNVxuICogQHBhcmFtIGV4cDZcbiAqIEBwYXJhbSBleHA3XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uNyhcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSkgPT4gYW55LCBleHAxOiBhbnksXG4gICAgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMyhsVmlldywgYmluZGluZ0luZGV4ICsgNCwgZXhwNSwgZXhwNiwgZXhwNykgfHwgZGlmZmVyZW50ID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgbFZpZXcsIGJpbmRpbmdJbmRleCArIDcsIHRoaXNBcmcgP1xuICAgICAgICAgICAgICBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3KSA6XG4gICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgNyk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gZXhwNlxuICogQHBhcmFtIGV4cDdcbiAqIEBwYXJhbSBleHA4XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uOChcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSwgdjg6IGFueSkgPT4gYW55LFxuICAgIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgZXhwODogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICAvLyBUT0RPKGthcmEpOiB1c2UgYmluZGluZ1Jvb3QgaW5zdGVhZCBvZiBiaW5kaW5nU3RhcnRJbmRleCB3aGVuIGltcGxlbWVudGluZyBob3N0IGJpbmRpbmdzXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkgfHwgZGlmZmVyZW50ID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgbFZpZXcsIGJpbmRpbmdJbmRleCArIDgsIHRoaXNBcmcgP1xuICAgICAgICAgICAgICBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3LCBleHA4KSA6XG4gICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3LCBleHA4KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgOCk7XG59XG5cbi8qKlxuICogcHVyZUZ1bmN0aW9uIGluc3RydWN0aW9uIHRoYXQgY2FuIHN1cHBvcnQgYW55IG51bWJlciBvZiBiaW5kaW5ncy5cbiAqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuIEEgcHVyZSBmdW5jdGlvbiB0aGF0IHRha2VzIGJpbmRpbmcgdmFsdWVzIGFuZCBidWlsZHMgYW4gb2JqZWN0IG9yIGFycmF5XG4gKiBjb250YWluaW5nIHRob3NlIHZhbHVlcy5cbiAqIEBwYXJhbSBleHBzIEFuIGFycmF5IG9mIGJpbmRpbmcgdmFsdWVzXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uVihcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKC4uLnY6IGFueVtdKSA9PiBhbnksIGV4cHM6IGFueVtdLCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgLy8gVE9ETyhrYXJhKTogdXNlIGJpbmRpbmdSb290IGluc3RlYWQgb2YgYmluZGluZ1N0YXJ0SW5kZXggd2hlbiBpbXBsZW1lbnRpbmcgaG9zdCBiaW5kaW5nc1xuICBsZXQgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGxldCBkaWZmZXJlbnQgPSBmYWxzZTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cHMubGVuZ3RoOyBpKyspIHtcbiAgICBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4KyssIGV4cHNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICByZXR1cm4gZGlmZmVyZW50ID8gdXBkYXRlQmluZGluZyhsVmlldywgYmluZGluZ0luZGV4LCBwdXJlRm4uYXBwbHkodGhpc0FyZywgZXhwcykpIDpcbiAgICAgICAgICAgICAgICAgICAgIGdldEJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCk7XG59XG4iXX0=