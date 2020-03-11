/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/pure_function.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDataInRange } from '../util/assert';
import { bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4, getBinding, updateBinding } from './bindings';
import { getBindingRoot, getLView } from './state';
import { NO_CHANGE } from './tokens';
/**
 * Bindings for pure functions are stored after regular bindings.
 *
 * |-------decls------|---------vars---------|                 |----- hostVars (dir1) ------|
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
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    return lView[bindingIndex] === NO_CHANGE ?
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
    return pureFunction1Internal(getLView(), getBindingRoot(), slotOffset, pureFn, exp, thisArg);
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
    return pureFunction2Internal(getLView(), getBindingRoot(), slotOffset, pureFn, exp1, exp2, thisArg);
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
    return pureFunction3Internal(getLView(), getBindingRoot(), slotOffset, pureFn, exp1, exp2, exp3, thisArg);
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
    return pureFunction4Internal(getLView(), getBindingRoot(), slotOffset, pureFn, exp1, exp2, exp3, exp4, thisArg);
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
    return pureFunctionVInternal(getLView(), getBindingRoot(), slotOffset, pureFn, exps, thisArg);
}
/**
 * Results of a pure function invocation are stored in LView in a dedicated slot that is initialized
 * to NO_CHANGE. In rare situations a pure pipe might throw an exception on the very first
 * invocation and not produce any valid results. In this case LView would keep holding the NO_CHANGE
 * value. The NO_CHANGE is not something that we can use in expressions / bindings thus we convert
 * it to `undefined`.
 * @param {?} lView
 * @param {?} returnValueIndex
 * @return {?}
 */
function getPureFunctionReturnValue(lView, returnValueIndex) {
    ngDevMode && assertDataInRange(lView, returnValueIndex);
    /** @type {?} */
    const lastReturnValue = lView[returnValueIndex];
    return lastReturnValue === NO_CHANGE ? undefined : lastReturnValue;
}
/**
 * If the value of the provided exp has changed, calls the pure function to return
 * an updated value. Or if the value has not changed, returns cached value.
 *
 * @param {?} lView LView in which the function is being executed.
 * @param {?} bindingRoot Binding root index.
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn Function that returns an updated value
 * @param {?} exp Updated expression value
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction1Internal(lView, bindingRoot, slotOffset, pureFn, exp, thisArg) {
    /** @type {?} */
    const bindingIndex = bindingRoot + slotOffset;
    return bindingUpdated(lView, bindingIndex, exp) ?
        updateBinding(lView, bindingIndex + 1, thisArg ? pureFn.call(thisArg, exp) : pureFn(exp)) :
        getPureFunctionReturnValue(lView, bindingIndex + 1);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} lView LView in which the function is being executed.
 * @param {?} bindingRoot Binding root index.
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction2Internal(lView, bindingRoot, slotOffset, pureFn, exp1, exp2, thisArg) {
    /** @type {?} */
    const bindingIndex = bindingRoot + slotOffset;
    return bindingUpdated2(lView, bindingIndex, exp1, exp2) ?
        updateBinding(lView, bindingIndex + 2, thisArg ? pureFn.call(thisArg, exp1, exp2) : pureFn(exp1, exp2)) :
        getPureFunctionReturnValue(lView, bindingIndex + 2);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} lView LView in which the function is being executed.
 * @param {?} bindingRoot Binding root index.
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunction3Internal(lView, bindingRoot, slotOffset, pureFn, exp1, exp2, exp3, thisArg) {
    /** @type {?} */
    const bindingIndex = bindingRoot + slotOffset;
    return bindingUpdated3(lView, bindingIndex, exp1, exp2, exp3) ?
        updateBinding(lView, bindingIndex + 3, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3) : pureFn(exp1, exp2, exp3)) :
        getPureFunctionReturnValue(lView, bindingIndex + 3);
}
/**
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} lView LView in which the function is being executed.
 * @param {?} bindingRoot Binding root index.
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
export function pureFunction4Internal(lView, bindingRoot, slotOffset, pureFn, exp1, exp2, exp3, exp4, thisArg) {
    /** @type {?} */
    const bindingIndex = bindingRoot + slotOffset;
    return bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4) ?
        updateBinding(lView, bindingIndex + 4, thisArg ? pureFn.call(thisArg, exp1, exp2, exp3, exp4) : pureFn(exp1, exp2, exp3, exp4)) :
        getPureFunctionReturnValue(lView, bindingIndex + 4);
}
/**
 * pureFunction instruction that can support any number of bindings.
 *
 * If the value of any provided exp has changed, calls the pure function to return
 * an updated value. Or if no values have changed, returns cached value.
 *
 * @param {?} lView LView in which the function is being executed.
 * @param {?} bindingRoot Binding root index.
 * @param {?} slotOffset the offset from binding root to the reserved slot
 * @param {?} pureFn A pure function that takes binding values and builds an object or array
 * containing those values.
 * @param {?} exps An array of binding values
 * @param {?=} thisArg Optional calling context of pureFn
 * @return {?} Updated or cached value
 */
export function pureFunctionVInternal(lView, bindingRoot, slotOffset, pureFn, exps, thisArg) {
    /** @type {?} */
    let bindingIndex = bindingRoot + slotOffset;
    /** @type {?} */
    let different = false;
    for (let i = 0; i < exps.length; i++) {
        bindingUpdated(lView, bindingIndex++, exps[i]) && (different = true);
    }
    return different ? updateBinding(lView, bindingIndex, pureFn.apply(thisArg, exps)) :
        getPureFunctionReturnValue(lView, bindingIndex);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcHVyZV9mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFeEgsT0FBTyxFQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDakQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0NuQyxNQUFNLFVBQVUsZUFBZSxDQUFJLFVBQWtCLEVBQUUsTUFBZSxFQUFFLE9BQWE7O1VBQzdFLFlBQVksR0FBRyxjQUFjLEVBQUUsR0FBRyxVQUFVOztVQUM1QyxLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9FLFVBQVUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDdEMsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sVUFBVSxlQUFlLENBQzNCLFVBQWtCLEVBQUUsTUFBdUIsRUFBRSxHQUFRLEVBQUUsT0FBYTtJQUN0RSxPQUFPLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxFQUFFLGNBQWMsRUFBRSxFQUFFLFVB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RUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLDBCQUEwQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkLCBiaW5kaW5nVXBkYXRlZDIsIGJpbmRpbmdVcGRhdGVkMywgYmluZGluZ1VwZGF0ZWQ0LCBnZXRCaW5kaW5nLCB1cGRhdGVCaW5kaW5nfSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QmluZGluZ1Jvb3QsIGdldExWaWV3fSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5cblxuLyoqXG4gKiBCaW5kaW5ncyBmb3IgcHVyZSBmdW5jdGlvbnMgYXJlIHN0b3JlZCBhZnRlciByZWd1bGFyIGJpbmRpbmdzLlxuICpcbiAqIHwtLS0tLS0tZGVjbHMtLS0tLS18LS0tLS0tLS0tdmFycy0tLS0tLS0tLXwgICAgICAgICAgICAgICAgIHwtLS0tLSBob3N0VmFycyAoZGlyMSkgLS0tLS0tfFxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiB8IG5vZGVzL3JlZnMvcGlwZXMgfCBiaW5kaW5ncyB8IGZuIHNsb3RzICB8IGluamVjdG9yIHwgZGlyMSB8IGhvc3QgYmluZGluZ3MgfCBob3N0IHNsb3RzIHxcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXlxuICogICAgICBUVmlldy5iaW5kaW5nU3RhcnRJbmRleCAgICAgIFRWaWV3LmV4cGFuZG9TdGFydEluZGV4XG4gKlxuICogUHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgYXJlIGdpdmVuIGFuIG9mZnNldCBmcm9tIHRoZSBiaW5kaW5nIHJvb3QuIEFkZGluZyB0aGUgb2Zmc2V0IHRvIHRoZVxuICogYmluZGluZyByb290IGdpdmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgYmluZGluZ3MgYXJlIHN0b3JlZC4gSW4gY29tcG9uZW50IHZpZXdzLCB0aGUgYmluZGluZ1xuICogcm9vdCBpcyB0aGUgYmluZGluZ1N0YXJ0SW5kZXguIEluIGhvc3QgYmluZGluZ3MsIHRoZSBiaW5kaW5nIHJvb3QgaXMgdGhlIGV4cGFuZG9TdGFydEluZGV4ICtcbiAqIGFueSBkaXJlY3RpdmUgaW5zdGFuY2VzICsgYW55IGhvc3RWYXJzIGluIGRpcmVjdGl2ZXMgZXZhbHVhdGVkIGJlZm9yZSBpdC5cbiAqXG4gKiBTZWUgVklFV19EQVRBLm1kIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IGhvc3QgYmluZGluZyByZXNvbHV0aW9uLlxuICovXG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIGhhc24ndCBiZWVuIHNhdmVkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byBzdG9yZSBhbmQgcmV0dXJuIHRoZVxuICogdmFsdWUuIElmIGl0IGhhcyBiZWVuIHNhdmVkLCByZXR1cm5zIHRoZSBzYXZlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHZhbHVlXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uMDxUPihzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKCkgPT4gVCwgdGhpc0FyZz86IGFueSk6IFQge1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nUm9vdCgpICsgc2xvdE9mZnNldDtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICByZXR1cm4gbFZpZXdbYmluZGluZ0luZGV4XSA9PT0gTk9fQ0hBTkdFID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCwgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcpIDogcHVyZUZuKCkpIDpcbiAgICAgIGdldEJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIHRoZSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGbiBGdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gdXBkYXRlZCB2YWx1ZVxuICogQHBhcmFtIGV4cCBVcGRhdGVkIGV4cHJlc3Npb24gdmFsdWVcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwdXJlRnVuY3Rpb24xKFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjogYW55KSA9PiBhbnksIGV4cDogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgcmV0dXJuIHB1cmVGdW5jdGlvbjFJbnRlcm5hbChnZXRMVmlldygpLCBnZXRCaW5kaW5nUm9vdCgpLCBzbG90T2Zmc2V0LCBwdXJlRm4sIGV4cCwgdGhpc0FyZyk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uMihcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIHJldHVybiBwdXJlRnVuY3Rpb24ySW50ZXJuYWwoXG4gICAgICBnZXRMVmlldygpLCBnZXRCaW5kaW5nUm9vdCgpLCBzbG90T2Zmc2V0LCBwdXJlRm4sIGV4cDEsIGV4cDIsIHRoaXNBcmcpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgZnJvbSBiaW5kaW5nIHJvb3QgdG8gdGhlIHJlc2VydmVkIHNsb3RcbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwdXJlRnVuY3Rpb24zKFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSkgPT4gYW55LCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICByZXR1cm4gcHVyZUZ1bmN0aW9uM0ludGVybmFsKFxuICAgICAgZ2V0TFZpZXcoKSwgZ2V0QmluZGluZ1Jvb3QoKSwgc2xvdE9mZnNldCwgcHVyZUZuLCBleHAxLCBleHAyLCBleHAzLCB0aGlzQXJnKTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXB1cmVGdW5jdGlvbjQoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LFxuICAgIGV4cDM6IGFueSwgZXhwNDogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgcmV0dXJuIHB1cmVGdW5jdGlvbjRJbnRlcm5hbChcbiAgICAgIGdldExWaWV3KCksIGdldEJpbmRpbmdSb290KCksIHNsb3RPZmZzZXQsIHB1cmVGbiwgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgdGhpc0FyZyk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uNShcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnkpID0+IGFueSwgZXhwMTogYW55LFxuICAgIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnksIGV4cDU6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LCBleHA1KSB8fCBkaWZmZXJlbnQgP1xuICAgICAgdXBkYXRlQmluZGluZyhcbiAgICAgICAgICBsVmlldywgYmluZGluZ0luZGV4ICsgNSwgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgNSk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gZXhwNlxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXB1cmVGdW5jdGlvbjYoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55KSA9PiBhbnksXG4gICAgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55LCBleHA1OiBhbnksIGV4cDY6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4ICsgNCwgZXhwNSwgZXhwNikgfHwgZGlmZmVyZW50ID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgbFZpZXcsIGJpbmRpbmdJbmRleCArIDYsIHRoaXNBcmcgP1xuICAgICAgICAgICAgICBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2KSA6XG4gICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgNik7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gZXhwNlxuICogQHBhcmFtIGV4cDdcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwdXJlRnVuY3Rpb243KFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlcixcbiAgICBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LCB2NzogYW55KSA9PiBhbnksIGV4cDE6IGFueSxcbiAgICBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55LCBleHA1OiBhbnksIGV4cDY6IGFueSwgZXhwNzogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMyhsVmlldywgYmluZGluZ0luZGV4ICsgNCwgZXhwNSwgZXhwNiwgZXhwNykgfHwgZGlmZmVyZW50ID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgbFZpZXcsIGJpbmRpbmdJbmRleCArIDcsIHRoaXNBcmcgP1xuICAgICAgICAgICAgICBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3KSA6XG4gICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgNyk7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIGV4cDRcbiAqIEBwYXJhbSBleHA1XG4gKiBAcGFyYW0gZXhwNlxuICogQHBhcmFtIGV4cDdcbiAqIEBwYXJhbSBleHA4XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHVyZUZ1bmN0aW9uOChcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSwgdjg6IGFueSkgPT4gYW55LFxuICAgIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgZXhwODogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nUm9vdCgpICsgc2xvdE9mZnNldDtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIGV4cDUsIGV4cDYsIGV4cDcsIGV4cDgpIHx8IGRpZmZlcmVudCA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyA4LCB0aGlzQXJnID9cbiAgICAgICAgICAgICAgcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkgOlxuICAgICAgICAgICAgICBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkpIDpcbiAgICAgIGdldEJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCArIDgpO1xufVxuXG4vKipcbiAqIHB1cmVGdW5jdGlvbiBpbnN0cnVjdGlvbiB0aGF0IGNhbiBzdXBwb3J0IGFueSBudW1iZXIgb2YgYmluZGluZ3MuXG4gKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGbiBBIHB1cmUgZnVuY3Rpb24gdGhhdCB0YWtlcyBiaW5kaW5nIHZhbHVlcyBhbmQgYnVpbGRzIGFuIG9iamVjdCBvciBhcnJheVxuICogY29udGFpbmluZyB0aG9zZSB2YWx1ZXMuXG4gKiBAcGFyYW0gZXhwcyBBbiBhcnJheSBvZiBiaW5kaW5nIHZhbHVlc1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXB1cmVGdW5jdGlvblYoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICguLi52OiBhbnlbXSkgPT4gYW55LCBleHBzOiBhbnlbXSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIHJldHVybiBwdXJlRnVuY3Rpb25WSW50ZXJuYWwoZ2V0TFZpZXcoKSwgZ2V0QmluZGluZ1Jvb3QoKSwgc2xvdE9mZnNldCwgcHVyZUZuLCBleHBzLCB0aGlzQXJnKTtcbn1cblxuLyoqXG4gKiBSZXN1bHRzIG9mIGEgcHVyZSBmdW5jdGlvbiBpbnZvY2F0aW9uIGFyZSBzdG9yZWQgaW4gTFZpZXcgaW4gYSBkZWRpY2F0ZWQgc2xvdCB0aGF0IGlzIGluaXRpYWxpemVkXG4gKiB0byBOT19DSEFOR0UuIEluIHJhcmUgc2l0dWF0aW9ucyBhIHB1cmUgcGlwZSBtaWdodCB0aHJvdyBhbiBleGNlcHRpb24gb24gdGhlIHZlcnkgZmlyc3RcbiAqIGludm9jYXRpb24gYW5kIG5vdCBwcm9kdWNlIGFueSB2YWxpZCByZXN1bHRzLiBJbiB0aGlzIGNhc2UgTFZpZXcgd291bGQga2VlcCBob2xkaW5nIHRoZSBOT19DSEFOR0VcbiAqIHZhbHVlLiBUaGUgTk9fQ0hBTkdFIGlzIG5vdCBzb21ldGhpbmcgdGhhdCB3ZSBjYW4gdXNlIGluIGV4cHJlc3Npb25zIC8gYmluZGluZ3MgdGh1cyB3ZSBjb252ZXJ0XG4gKiBpdCB0byBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0UHVyZUZ1bmN0aW9uUmV0dXJuVmFsdWUobFZpZXc6IExWaWV3LCByZXR1cm5WYWx1ZUluZGV4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCByZXR1cm5WYWx1ZUluZGV4KTtcbiAgY29uc3QgbGFzdFJldHVyblZhbHVlID0gbFZpZXdbcmV0dXJuVmFsdWVJbmRleF07XG4gIHJldHVybiBsYXN0UmV0dXJuVmFsdWUgPT09IE5PX0NIQU5HRSA/IHVuZGVmaW5lZCA6IGxhc3RSZXR1cm5WYWx1ZTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGZ1bmN0aW9uIGlzIGJlaW5nIGV4ZWN1dGVkLlxuICogQHBhcmFtIGJpbmRpbmdSb290IEJpbmRpbmcgcm9vdCBpbmRleC5cbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgZnJvbSBiaW5kaW5nIHJvb3QgdG8gdGhlIHJlc2VydmVkIHNsb3RcbiAqIEBwYXJhbSBwdXJlRm4gRnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIHVwZGF0ZWQgdmFsdWVcbiAqIEBwYXJhbSBleHAgVXBkYXRlZCBleHByZXNzaW9uIHZhbHVlXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uMUludGVybmFsKFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ1Jvb3Q6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2OiBhbnkpID0+IGFueSwgZXhwOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdSb290ICsgc2xvdE9mZnNldDtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cCkgP1xuICAgICAgdXBkYXRlQmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgMSwgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cCkgOiBwdXJlRm4oZXhwKSkgOlxuICAgICAgZ2V0UHVyZUZ1bmN0aW9uUmV0dXJuVmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCArIDEpO1xufVxuXG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSBmdW5jdGlvbiBpcyBiZWluZyBleGVjdXRlZC5cbiAqIEBwYXJhbSBiaW5kaW5nUm9vdCBCaW5kaW5nIHJvb3QgaW5kZXguXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb24ySW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCBiaW5kaW5nUm9vdDogbnVtYmVyLCBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnkpID0+IGFueSxcbiAgICBleHAxOiBhbnksIGV4cDI6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdSb290ICsgc2xvdE9mZnNldDtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyKSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyAyLFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyKSA6IHB1cmVGbihleHAxLCBleHAyKSkgOlxuICAgICAgZ2V0UHVyZUZ1bmN0aW9uUmV0dXJuVmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCArIDIpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZnVuY3Rpb24gaXMgYmVpbmcgZXhlY3V0ZWQuXG4gKiBAcGFyYW0gYmluZGluZ1Jvb3QgQmluZGluZyByb290IGluZGV4LlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1cmVGdW5jdGlvbjNJbnRlcm5hbChcbiAgICBsVmlldzogTFZpZXcsIGJpbmRpbmdSb290OiBudW1iZXIsIHNsb3RPZmZzZXQ6IG51bWJlcixcbiAgICBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdSb290ICsgc2xvdE9mZnNldDtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMyhsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzKSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyAzLFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzKSA6IHB1cmVGbihleHAxLCBleHAyLCBleHAzKSkgOlxuICAgICAgZ2V0UHVyZUZ1bmN0aW9uUmV0dXJuVmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCArIDMpO1xufVxuXG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSBmdW5jdGlvbiBpcyBiZWluZyBleGVjdXRlZC5cbiAqIEBwYXJhbSBiaW5kaW5nUm9vdCBCaW5kaW5nIHJvb3QgaW5kZXguXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXJlRnVuY3Rpb240SW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCBiaW5kaW5nUm9vdDogbnVtYmVyLCBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSkgPT4gYW55LCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdSb290ICsgc2xvdE9mZnNldDtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0KSA6IHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0KSkgOlxuICAgICAgZ2V0UHVyZUZ1bmN0aW9uUmV0dXJuVmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCArIDQpO1xufVxuXG4vKipcbiAqIHB1cmVGdW5jdGlvbiBpbnN0cnVjdGlvbiB0aGF0IGNhbiBzdXBwb3J0IGFueSBudW1iZXIgb2YgYmluZGluZ3MuXG4gKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSBmdW5jdGlvbiBpcyBiZWluZyBleGVjdXRlZC5cbiAqIEBwYXJhbSBiaW5kaW5nUm9vdCBCaW5kaW5nIHJvb3QgaW5kZXguXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuIEEgcHVyZSBmdW5jdGlvbiB0aGF0IHRha2VzIGJpbmRpbmcgdmFsdWVzIGFuZCBidWlsZHMgYW4gb2JqZWN0IG9yIGFycmF5XG4gKiBjb250YWluaW5nIHRob3NlIHZhbHVlcy5cbiAqIEBwYXJhbSBleHBzIEFuIGFycmF5IG9mIGJpbmRpbmcgdmFsdWVzXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUZ1bmN0aW9uVkludGVybmFsKFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ1Jvb3Q6IG51bWJlciwgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICguLi52OiBhbnlbXSkgPT4gYW55LFxuICAgIGV4cHM6IGFueVtdLCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdSb290ICsgc2xvdE9mZnNldDtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cHMubGVuZ3RoOyBpKyspIHtcbiAgICBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4KyssIGV4cHNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICByZXR1cm4gZGlmZmVyZW50ID8gdXBkYXRlQmluZGluZyhsVmlldywgYmluZGluZ0luZGV4LCBwdXJlRm4uYXBwbHkodGhpc0FyZywgZXhwcykpIDpcbiAgICAgICAgICAgICAgICAgICAgIGdldFB1cmVGdW5jdGlvblJldHVyblZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xufVxuIl19