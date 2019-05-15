/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4, getBinding, updateBinding } from './bindings';
import { getBindingRoot, getLView, isCreationMode } from './state';
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
export function ΔpureFunction0(slotOffset, pureFn, thisArg) {
    // TODO(kara): use bindingRoot instead of bindingStartIndex when implementing host bindings
    /** @type {?} */
    const bindingIndex = getBindingRoot() + slotOffset;
    /** @type {?} */
    const lView = getLView();
    return isCreationMode() ?
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
export function ΔpureFunction1(slotOffset, pureFn, exp, thisArg) {
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
export function ΔpureFunction2(slotOffset, pureFn, exp1, exp2, thisArg) {
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
export function ΔpureFunction3(slotOffset, pureFn, exp1, exp2, exp3, thisArg) {
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
export function ΔpureFunction4(slotOffset, pureFn, exp1, exp2, exp3, exp4, thisArg) {
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
export function ΔpureFunction5(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, thisArg) {
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
export function ΔpureFunction6(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, thisArg) {
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
export function ΔpureFunction7(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, thisArg) {
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
export function ΔpureFunction8(slotOffset, pureFn, exp1, exp2, exp3, exp4, exp5, exp6, exp7, exp8, thisArg) {
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
export function ΔpureFunctionV(slotOffset, pureFn, exps, thisArg) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcHVyZV9mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN4SCxPQUFPLEVBQUMsY0FBYyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlDakUsTUFBTSxVQUFVLGNBQWMsQ0FBSSxVQUFrQixFQUFFLE1BQWUsRUFBRSxPQUFhOzs7VUFFNUUsWUFBWSxHQUFHLGNBQWMsRUFBRSxHQUFHLFVBQVU7O1VBQzVDLEtBQUssR0FBRyxRQUFRLEVBQUU7SUFDeEIsT0FBTyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ3JCLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9FLFVBQVUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDdEMsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sVUFBVSxjQUFjLENBQzFCLFVBQWtCLEVBQUUsTUFBdUIsRUFBRSxHQUFRLEVBQUUsT0FBYTs7O1VBRWhFLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLFlBQVksR0FBRyxjQUFjLEVBQUUsR0FBRyxVQUFVO0lBQ2xELE9BQU8sY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3QyxhQUFhLENBQUMsS0FBSyxFQUFF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SUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUM7UUFDdEUsYUFBYSxDQUNULEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsVUFBVSxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CRCxNQUFNLFVBQVUsY0FBYyxDQUMxQixVQUFrQixFQUNsQixNQUE4RSxFQUFFLElBQVMsRUFDekYsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsT0FBYTs7O1VBRTNFLFlBQVksR0FBRyxjQUFjLEVBQUUsR0FBRyxVQUFVOztVQUM1QyxLQUFLLEdBQUcsUUFBUSxFQUFFOztRQUNwQixTQUFTLEdBQUcsZUFBZSxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQzVFLE9BQU8sZUFBZSxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUM7UUFDNUUsYUFBYSxDQUNULEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRCxVQUFVLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMxQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCRCxNQUFNLFVBQVUsY0FBYyxDQUMxQixVQUFrQixFQUNsQixNQUF1RixFQUN2RixJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUN0RixPQUFhOzs7VUFFVCxZQUFZLEdBQUcsY0FBYyxFQUFFLEdBQUcsVUFBVTs7VUFDNUMsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsU0FBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQztJQUM5RSxPQUFPLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQztRQUNsRixhQUFhLENBQ1QsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsVUFBVSxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxNQUFNLFVBQVUsY0FBYyxDQUMxQixVQUFrQixFQUFFLE1BQTRCLEVBQUUsSUFBVyxFQUFFLE9BQWE7OztRQUUxRSxZQUFZLEdBQUcsY0FBYyxFQUFFLEdBQUcsVUFBVTs7UUFDNUMsU0FBUyxHQUFHLEtBQUs7O1VBQ2YsS0FBSyxHQUFHLFFBQVEsRUFBRTtJQUN4QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ3RFO0lBQ0QsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRSxVQUFVLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3JELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YmluZGluZ1VwZGF0ZWQsIGJpbmRpbmdVcGRhdGVkMiwgYmluZGluZ1VwZGF0ZWQzLCBiaW5kaW5nVXBkYXRlZDQsIGdldEJpbmRpbmcsIHVwZGF0ZUJpbmRpbmd9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRCaW5kaW5nUm9vdCwgZ2V0TFZpZXcsIGlzQ3JlYXRpb25Nb2RlfSBmcm9tICcuL3N0YXRlJztcblxuXG5cbi8qKlxuICogQmluZGluZ3MgZm9yIHB1cmUgZnVuY3Rpb25zIGFyZSBzdG9yZWQgYWZ0ZXIgcmVndWxhciBiaW5kaW5ncy5cbiAqXG4gKiB8LS0tLS0tY29uc3RzLS0tLS0tfC0tLS0tLS0tLXZhcnMtLS0tLS0tLS18ICAgICAgICAgICAgICAgICB8LS0tLS0gaG9zdFZhcnMgKGRpcjEpIC0tLS0tLXxcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogfCBub2Rlcy9yZWZzL3BpcGVzIHwgYmluZGluZ3MgfCBmbiBzbG90cyAgfCBpbmplY3RvciB8IGRpcjEgfCBob3N0IGJpbmRpbmdzIHwgaG9zdCBzbG90cyB8XG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF5cbiAqICAgICAgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggICAgICBUVmlldy5leHBhbmRvU3RhcnRJbmRleFxuICpcbiAqIFB1cmUgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zIGFyZSBnaXZlbiBhbiBvZmZzZXQgZnJvbSB0aGUgYmluZGluZyByb290LiBBZGRpbmcgdGhlIG9mZnNldCB0byB0aGVcbiAqIGJpbmRpbmcgcm9vdCBnaXZlcyB0aGUgZmlyc3QgaW5kZXggd2hlcmUgdGhlIGJpbmRpbmdzIGFyZSBzdG9yZWQuIEluIGNvbXBvbmVudCB2aWV3cywgdGhlIGJpbmRpbmdcbiAqIHJvb3QgaXMgdGhlIGJpbmRpbmdTdGFydEluZGV4LiBJbiBob3N0IGJpbmRpbmdzLCB0aGUgYmluZGluZyByb290IGlzIHRoZSBleHBhbmRvU3RhcnRJbmRleCArXG4gKiBhbnkgZGlyZWN0aXZlIGluc3RhbmNlcyArIGFueSBob3N0VmFycyBpbiBkaXJlY3RpdmVzIGV2YWx1YXRlZCBiZWZvcmUgaXQuXG4gKlxuICogU2VlIFZJRVdfREFUQS5tZCBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBob3N0IGJpbmRpbmcgcmVzb2x1dGlvbi5cbiAqL1xuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBoYXNuJ3QgYmVlbiBzYXZlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gc3RvcmUgYW5kIHJldHVybiB0aGVcbiAqIHZhbHVlLiBJZiBpdCBoYXMgYmVlbiBzYXZlZCwgcmV0dXJucyB0aGUgc2F2ZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGbiBGdW5jdGlvbiB0aGF0IHJldHVybnMgYSB2YWx1ZVxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRwdXJlRnVuY3Rpb24wPFQ+KHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAoKSA9PiBULCB0aGlzQXJnPzogYW55KTogVCB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKCkgP1xuICAgICAgdXBkYXRlQmluZGluZyhsVmlldywgYmluZGluZ0luZGV4LCB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZykgOiBwdXJlRm4oKSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4KTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiB1cGRhdGVkIHZhbHVlXG4gKiBAcGFyYW0gZXhwIFVwZGF0ZWQgZXhwcmVzc2lvbiB2YWx1ZVxuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRwdXJlRnVuY3Rpb24xKFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjogYW55KSA9PiBhbnksIGV4cDogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgLy8gVE9ETyhrYXJhKTogdXNlIGJpbmRpbmdSb290IGluc3RlYWQgb2YgYmluZGluZ1N0YXJ0SW5kZXggd2hlbiBpbXBsZW1lbnRpbmcgaG9zdCBiaW5kaW5nc1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwKSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyAxLCB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwKSA6IHB1cmVGbihleHApKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyAxKTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UcHVyZUZ1bmN0aW9uMihcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnkpID0+IGFueSwgZXhwMTogYW55LCBleHAyOiBhbnksXG4gICAgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyKSA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyAyLFxuICAgICAgICAgIHRoaXNBcmcgPyBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyKSA6IHB1cmVGbihleHAxLCBleHAyKSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgMik7XG59XG5cbi8qKlxuICogSWYgdGhlIHZhbHVlIG9mIGFueSBwcm92aWRlZCBleHAgaGFzIGNoYW5nZWQsIGNhbGxzIHRoZSBwdXJlIGZ1bmN0aW9uIHRvIHJldHVyblxuICogYW4gdXBkYXRlZCB2YWx1ZS4gT3IgaWYgbm8gdmFsdWVzIGhhdmUgY2hhbmdlZCwgcmV0dXJucyBjYWNoZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHNsb3RPZmZzZXQgdGhlIG9mZnNldCBmcm9tIGJpbmRpbmcgcm9vdCB0byB0aGUgcmVzZXJ2ZWQgc2xvdFxuICogQHBhcmFtIHB1cmVGblxuICogQHBhcmFtIGV4cDFcbiAqIEBwYXJhbSBleHAyXG4gKiBAcGFyYW0gZXhwM1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRwdXJlRnVuY3Rpb24zKFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlciwgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSkgPT4gYW55LCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICAvLyBUT0RPKGthcmEpOiB1c2UgYmluZGluZ1Jvb3QgaW5zdGVhZCBvZiBiaW5kaW5nU3RhcnRJbmRleCB3aGVuIGltcGxlbWVudGluZyBob3N0IGJpbmRpbmdzXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMiwgZXhwMykgP1xuICAgICAgdXBkYXRlQmluZGluZyhcbiAgICAgICAgICBsVmlldywgYmluZGluZ0luZGV4ICsgMyxcbiAgICAgICAgICB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMykgOiBwdXJlRm4oZXhwMSwgZXhwMiwgZXhwMykpIDpcbiAgICAgIGdldEJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCArIDMpO1xufVxuXG4vKipcbiAqIElmIHRoZSB2YWx1ZSBvZiBhbnkgcHJvdmlkZWQgZXhwIGhhcyBjaGFuZ2VkLCBjYWxscyB0aGUgcHVyZSBmdW5jdGlvbiB0byByZXR1cm5cbiAqIGFuIHVwZGF0ZWQgdmFsdWUuIE9yIGlmIG5vIHZhbHVlcyBoYXZlIGNoYW5nZWQsIHJldHVybnMgY2FjaGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzbG90T2Zmc2V0IHRoZSBvZmZzZXQgZnJvbSBiaW5kaW5nIHJvb3QgdG8gdGhlIHJlc2VydmVkIHNsb3RcbiAqIEBwYXJhbSBwdXJlRm5cbiAqIEBwYXJhbSBleHAxXG4gKiBAcGFyYW0gZXhwMlxuICogQHBhcmFtIGV4cDNcbiAqIEBwYXJhbSBleHA0XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHB1cmVGdW5jdGlvbjQoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55KSA9PiBhbnksIGV4cDE6IGFueSwgZXhwMjogYW55LFxuICAgIGV4cDM6IGFueSwgZXhwNDogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgLy8gVE9ETyhrYXJhKTogdXNlIGJpbmRpbmdSb290IGluc3RlYWQgb2YgYmluZGluZ1N0YXJ0SW5kZXggd2hlbiBpbXBsZW1lbnRpbmcgaG9zdCBiaW5kaW5nc1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nUm9vdCgpICsgc2xvdE9mZnNldDtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgbFZpZXcsIGJpbmRpbmdJbmRleCArIDQsXG4gICAgICAgICAgdGhpc0FyZyA/IHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpIDogcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0KTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UcHVyZUZ1bmN0aW9uNShcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsIHB1cmVGbjogKHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnkpID0+IGFueSwgZXhwMTogYW55LFxuICAgIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnksIGV4cDU6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIGV4cDUpIHx8IGRpZmZlcmVudCA/XG4gICAgICB1cGRhdGVCaW5kaW5nKFxuICAgICAgICAgIGxWaWV3LCBiaW5kaW5nSW5kZXggKyA1LCB0aGlzQXJnID8gcHVyZUZuLmNhbGwodGhpc0FyZywgZXhwMSwgZXhwMiwgZXhwMywgZXhwNCwgZXhwNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUpKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA1KTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSBleHA2XG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHB1cmVGdW5jdGlvbjYoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55KSA9PiBhbnksXG4gICAgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55LCBleHA1OiBhbnksIGV4cDY6IGFueSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1Jvb3QoKSArIHNsb3RPZmZzZXQ7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LCBleHA1LCBleHA2KSB8fCBkaWZmZXJlbnQgP1xuICAgICAgdXBkYXRlQmluZGluZyhcbiAgICAgICAgICBsVmlldywgYmluZGluZ0luZGV4ICsgNiwgdGhpc0FyZyA/XG4gICAgICAgICAgICAgIHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYpIDpcbiAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYpKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA2KTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSBleHA2XG4gKiBAcGFyYW0gZXhwN1xuICogQHBhcmFtIHRoaXNBcmcgT3B0aW9uYWwgY2FsbGluZyBjb250ZXh0IG9mIHB1cmVGblxuICogQHJldHVybnMgVXBkYXRlZCBvciBjYWNoZWQgdmFsdWVcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRwdXJlRnVuY3Rpb243KFxuICAgIHNsb3RPZmZzZXQ6IG51bWJlcixcbiAgICBwdXJlRm46ICh2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LCB2NzogYW55KSA9PiBhbnksIGV4cDE6IGFueSxcbiAgICBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55LCBleHA1OiBhbnksIGV4cDY6IGFueSwgZXhwNzogYW55LCB0aGlzQXJnPzogYW55KTogYW55IHtcbiAgLy8gVE9ETyhrYXJhKTogdXNlIGJpbmRpbmdSb290IGluc3RlYWQgb2YgYmluZGluZ1N0YXJ0SW5kZXggd2hlbiBpbXBsZW1lbnRpbmcgaG9zdCBiaW5kaW5nc1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nUm9vdCgpICsgc2xvdE9mZnNldDtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQzKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LCBleHA1LCBleHA2LCBleHA3KSB8fCBkaWZmZXJlbnQgP1xuICAgICAgdXBkYXRlQmluZGluZyhcbiAgICAgICAgICBsVmlldywgYmluZGluZ0luZGV4ICsgNywgdGhpc0FyZyA/XG4gICAgICAgICAgICAgIHB1cmVGbi5jYWxsKHRoaXNBcmcsIGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYsIGV4cDcpIDpcbiAgICAgICAgICAgICAgcHVyZUZuKGV4cDEsIGV4cDIsIGV4cDMsIGV4cDQsIGV4cDUsIGV4cDYsIGV4cDcpKSA6XG4gICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA3KTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuXG4gKiBAcGFyYW0gZXhwMVxuICogQHBhcmFtIGV4cDJcbiAqIEBwYXJhbSBleHAzXG4gKiBAcGFyYW0gZXhwNFxuICogQHBhcmFtIGV4cDVcbiAqIEBwYXJhbSBleHA2XG4gKiBAcGFyYW0gZXhwN1xuICogQHBhcmFtIGV4cDhcbiAqIEBwYXJhbSB0aGlzQXJnIE9wdGlvbmFsIGNhbGxpbmcgY29udGV4dCBvZiBwdXJlRm5cbiAqIEByZXR1cm5zIFVwZGF0ZWQgb3IgY2FjaGVkIHZhbHVlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UcHVyZUZ1bmN0aW9uOChcbiAgICBzbG90T2Zmc2V0OiBudW1iZXIsXG4gICAgcHVyZUZuOiAodjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSwgdjc6IGFueSwgdjg6IGFueSkgPT4gYW55LFxuICAgIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSwgZXhwNTogYW55LCBleHA2OiBhbnksIGV4cDc6IGFueSwgZXhwODogYW55LFxuICAgIHRoaXNBcmc/OiBhbnkpOiBhbnkge1xuICAvLyBUT0RPKGthcmEpOiB1c2UgYmluZGluZ1Jvb3QgaW5zdGVhZCBvZiBiaW5kaW5nU3RhcnRJbmRleCB3aGVuIGltcGxlbWVudGluZyBob3N0IGJpbmRpbmdzXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyLCBleHAzLCBleHA0KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgZXhwNSwgZXhwNiwgZXhwNywgZXhwOCkgfHwgZGlmZmVyZW50ID9cbiAgICAgIHVwZGF0ZUJpbmRpbmcoXG4gICAgICAgICAgbFZpZXcsIGJpbmRpbmdJbmRleCArIDgsIHRoaXNBcmcgP1xuICAgICAgICAgICAgICBwdXJlRm4uY2FsbCh0aGlzQXJnLCBleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3LCBleHA4KSA6XG4gICAgICAgICAgICAgIHB1cmVGbihleHAxLCBleHAyLCBleHAzLCBleHA0LCBleHA1LCBleHA2LCBleHA3LCBleHA4KSkgOlxuICAgICAgZ2V0QmluZGluZyhsVmlldywgYmluZGluZ0luZGV4ICsgOCk7XG59XG5cbi8qKlxuICogcHVyZUZ1bmN0aW9uIGluc3RydWN0aW9uIHRoYXQgY2FuIHN1cHBvcnQgYW55IG51bWJlciBvZiBiaW5kaW5ncy5cbiAqXG4gKiBJZiB0aGUgdmFsdWUgb2YgYW55IHByb3ZpZGVkIGV4cCBoYXMgY2hhbmdlZCwgY2FsbHMgdGhlIHB1cmUgZnVuY3Rpb24gdG8gcmV0dXJuXG4gKiBhbiB1cGRhdGVkIHZhbHVlLiBPciBpZiBubyB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLCByZXR1cm5zIGNhY2hlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gc2xvdE9mZnNldCB0aGUgb2Zmc2V0IGZyb20gYmluZGluZyByb290IHRvIHRoZSByZXNlcnZlZCBzbG90XG4gKiBAcGFyYW0gcHVyZUZuIEEgcHVyZSBmdW5jdGlvbiB0aGF0IHRha2VzIGJpbmRpbmcgdmFsdWVzIGFuZCBidWlsZHMgYW4gb2JqZWN0IG9yIGFycmF5XG4gKiBjb250YWluaW5nIHRob3NlIHZhbHVlcy5cbiAqIEBwYXJhbSBleHBzIEFuIGFycmF5IG9mIGJpbmRpbmcgdmFsdWVzXG4gKiBAcGFyYW0gdGhpc0FyZyBPcHRpb25hbCBjYWxsaW5nIGNvbnRleHQgb2YgcHVyZUZuXG4gKiBAcmV0dXJucyBVcGRhdGVkIG9yIGNhY2hlZCB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHB1cmVGdW5jdGlvblYoXG4gICAgc2xvdE9mZnNldDogbnVtYmVyLCBwdXJlRm46ICguLi52OiBhbnlbXSkgPT4gYW55LCBleHBzOiBhbnlbXSwgdGhpc0FyZz86IGFueSk6IGFueSB7XG4gIC8vIFRPRE8oa2FyYSk6IHVzZSBiaW5kaW5nUm9vdCBpbnN0ZWFkIG9mIGJpbmRpbmdTdGFydEluZGV4IHdoZW4gaW1wbGVtZW50aW5nIGhvc3QgYmluZGluZ3NcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdSb290KCkgKyBzbG90T2Zmc2V0O1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBzLmxlbmd0aDsgaSsrKSB7XG4gICAgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCsrLCBleHBzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHVwZGF0ZUJpbmRpbmcobFZpZXcsIGJpbmRpbmdJbmRleCwgcHVyZUZuLmFwcGx5KHRoaXNBcmcsIGV4cHMpKSA6XG4gICAgICAgICAgICAgICAgICAgICBnZXRCaW5kaW5nKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xufVxuIl19