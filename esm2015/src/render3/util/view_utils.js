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
import { assertDataInRange, assertDefined, assertDomNode, assertGreaterThan, assertLessThan } from '../../util/assert';
import { assertTNodeForLView } from '../assert';
import { TYPE } from '../interfaces/container';
import { MONKEY_PATCH_KEY_NAME } from '../interfaces/context';
import { isLContainer, isLView } from '../interfaces/type_checks';
import { FLAGS, HEADER_OFFSET, HOST, PARENT, PREORDER_HOOK_FLAGS, TVIEW } from '../interfaces/view';
/**
 * For efficiency reasons we often put several different data types (`RNode`, `LView`, `LContainer`)
 * in same location in `LView`. This is because we don't want to pre-allocate space for it
 * because the storage is sparse. This file contains utilities for dealing with such data types.
 *
 * How do we know what is stored at a given location in `LView`.
 * - `Array.isArray(value) === false` => `RNode` (The normal storage value)
 * - `Array.isArray(value) === true` => then the `value[0]` represents the wrapped value.
 *   - `typeof value[TYPE] === 'object'` => `LView`
 *      - This happens when we have a component at a given location
 *   - `typeof value[TYPE] === true` => `LContainer`
 *      - This happens when we have `LContainer` binding at a given location.
 *
 *
 * NOTE: it is assumed that `Array.isArray` and `typeof` operations are very efficient.
 */
/**
 * Returns `RNode`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`
 * @return {?}
 */
export function unwrapRNode(value) {
    while (Array.isArray(value)) {
        value = (/** @type {?} */ (value[HOST]));
    }
    return (/** @type {?} */ (value));
}
/**
 * Returns `LView` or `null` if not found.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`
 * @return {?}
 */
export function unwrapLView(value) {
    while (Array.isArray(value)) {
        // This check is same as `isLView()` but we don't call at as we don't want to call
        // `Array.isArray()` twice and give JITer more work for inlining.
        if (typeof value[TYPE] === 'object')
            return (/** @type {?} */ (value));
        value = (/** @type {?} */ (value[HOST]));
    }
    return null;
}
/**
 * Returns `LContainer` or `null` if not found.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`
 * @return {?}
 */
export function unwrapLContainer(value) {
    while (Array.isArray(value)) {
        // This check is same as `isLContainer()` but we don't call at as we don't want to call
        // `Array.isArray()` twice and give JITer more work for inlining.
        if (value[TYPE] === true)
            return (/** @type {?} */ (value));
        value = (/** @type {?} */ (value[HOST]));
    }
    return null;
}
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 * @param {?} index
 * @param {?} lView
 * @return {?}
 */
export function getNativeByIndex(index, lView) {
    return unwrapRNode(lView[index + HEADER_OFFSET]);
}
/**
 * Retrieve an `RNode` for a given `TNode` and `LView`.
 *
 * This function guarantees in dev mode to retrieve a non-null `RNode`.
 *
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function getNativeByTNode(tNode, lView) {
    ngDevMode && assertTNodeForLView(tNode, lView);
    ngDevMode && assertDataInRange(lView, tNode.index);
    /** @type {?} */
    const node = unwrapRNode(lView[tNode.index]);
    ngDevMode && assertDomNode(node);
    return node;
}
/**
 * Retrieve an `RNode` or `null` for a given `TNode` and `LView`.
 *
 * Some `TNode`s don't have associated `RNode`s. For example `Projection`
 *
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function getNativeByTNodeOrNull(tNode, lView) {
    /** @type {?} */
    const index = tNode.index;
    if (index !== -1) {
        ngDevMode && assertTNodeForLView(tNode, lView);
        /** @type {?} */
        const node = unwrapRNode(lView[index]);
        ngDevMode && node !== null && assertDomNode(node);
        return node;
    }
    return null;
}
/**
 * @param {?} index
 * @param {?} view
 * @return {?}
 */
export function getTNode(index, view) {
    ngDevMode && assertGreaterThan(index, -1, 'wrong index for TNode');
    ngDevMode && assertLessThan(index, view[TVIEW].data.length, 'wrong index for TNode');
    return (/** @type {?} */ (view[TVIEW].data[index + HEADER_OFFSET]));
}
/**
 * Retrieves a value from any `LView` or `TData`.
 * @template T
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function load(view, index) {
    ngDevMode && assertDataInRange(view, index + HEADER_OFFSET);
    return view[index + HEADER_OFFSET];
}
/**
 * @param {?} nodeIndex
 * @param {?} hostView
 * @return {?}
 */
export function getComponentViewByIndex(nodeIndex, hostView) {
    // Could be an LView or an LContainer. If LContainer, unwrap to find LView.
    ngDevMode && assertDataInRange(hostView, nodeIndex);
    /** @type {?} */
    const slotValue = hostView[nodeIndex];
    /** @type {?} */
    const lView = isLView(slotValue) ? slotValue : slotValue[HOST];
    return lView;
}
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 * @param {?} target
 * @return {?}
 */
export function readPatchedData(target) {
    ngDevMode && assertDefined(target, 'Target expected');
    return target[MONKEY_PATCH_KEY_NAME] || null;
}
/**
 * @param {?} target
 * @return {?}
 */
export function readPatchedLView(target) {
    /** @type {?} */
    const value = readPatchedData(target);
    if (value) {
        return Array.isArray(value) ? value : ((/** @type {?} */ (value))).lView;
    }
    return null;
}
/**
 * Checks whether a given view is in creation mode
 * @param {?} view
 * @return {?}
 */
export function isCreationMode(view) {
    return (view[FLAGS] & 4 /* CreationMode */) === 4 /* CreationMode */;
}
/**
 * Returns a boolean for whether the view is attached to the change detection tree.
 *
 * Note: This determines whether a view should be checked, not whether it's inserted
 * into a container. For that, you'll want `viewAttachedToContainer` below.
 * @param {?} view
 * @return {?}
 */
export function viewAttachedToChangeDetector(view) {
    return (view[FLAGS] & 128 /* Attached */) === 128 /* Attached */;
}
/**
 * Returns a boolean for whether the view is attached to a container.
 * @param {?} view
 * @return {?}
 */
export function viewAttachedToContainer(view) {
    return isLContainer(view[PARENT]);
}
/**
 * Resets the pre-order hook flags of the view.
 * @param {?} lView the LView on which the flags are reset
 * @return {?}
 */
export function resetPreOrderHookFlags(lView) {
    lView[PREORDER_HOOK_FLAGS] = 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckgsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzlDLE9BQU8sRUFBYSxJQUFJLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQVcscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUd0RSxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBcUIsTUFBTSxFQUFFLG1CQUFtQixFQUFTLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUI1SCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQWlDO0lBQzNELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMzQixLQUFLLEdBQUcsbUJBQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFPLENBQUM7S0FDNUI7SUFDRCxPQUFPLG1CQUFBLEtBQUssRUFBUyxDQUFDO0FBQ3hCLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxXQUFXLENBQUMsS0FBaUM7SUFDM0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzNCLGtGQUFrRjtRQUNsRixpRUFBaUU7UUFDakUsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRO1lBQUUsT0FBTyxt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b250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge0xDb250YWluZXIsIFRZUEV9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRleHQsIE1PTktFWV9QQVRDSF9LRVlfTkFNRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFBSRU9SREVSX0hPT0tfRkxBR1MsIFREYXRhLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuXG5cbi8qKlxuICogRm9yIGVmZmljaWVuY3kgcmVhc29ucyB3ZSBvZnRlbiBwdXQgc2V2ZXJhbCBkaWZmZXJlbnQgZGF0YSB0eXBlcyAoYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgKVxuICogaW4gc2FtZSBsb2NhdGlvbiBpbiBgTFZpZXdgLiBUaGlzIGlzIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCB0byBwcmUtYWxsb2NhdGUgc3BhY2UgZm9yIGl0XG4gKiBiZWNhdXNlIHRoZSBzdG9yYWdlIGlzIHNwYXJzZS4gVGhpcyBmaWxlIGNvbnRhaW5zIHV0aWxpdGllcyBmb3IgZGVhbGluZyB3aXRoIHN1Y2ggZGF0YSB0eXBlcy5cbiAqXG4gKiBIb3cgZG8gd2Uga25vdyB3aGF0IGlzIHN0b3JlZCBhdCBhIGdpdmVuIGxvY2F0aW9uIGluIGBMVmlld2AuXG4gKiAtIGBBcnJheS5pc0FycmF5KHZhbHVlKSA9PT0gZmFsc2VgID0+IGBSTm9kZWAgKFRoZSBub3JtYWwgc3RvcmFnZSB2YWx1ZSlcbiAqIC0gYEFycmF5LmlzQXJyYXkodmFsdWUpID09PSB0cnVlYCA9PiB0aGVuIHRoZSBgdmFsdWVbMF1gIHJlcHJlc2VudHMgdGhlIHdyYXBwZWQgdmFsdWUuXG4gKiAgIC0gYHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gJ29iamVjdCdgID0+IGBMVmlld2BcbiAqICAgICAgLSBUaGlzIGhhcHBlbnMgd2hlbiB3ZSBoYXZlIGEgY29tcG9uZW50IGF0IGEgZ2l2ZW4gbG9jYXRpb25cbiAqICAgLSBgdHlwZW9mIHZhbHVlW1RZUEVdID09PSB0cnVlYCA9PiBgTENvbnRhaW5lcmBcbiAqICAgICAgLSBUaGlzIGhhcHBlbnMgd2hlbiB3ZSBoYXZlIGBMQ29udGFpbmVyYCBiaW5kaW5nIGF0IGEgZ2l2ZW4gbG9jYXRpb24uXG4gKlxuICpcbiAqIE5PVEU6IGl0IGlzIGFzc3VtZWQgdGhhdCBgQXJyYXkuaXNBcnJheWAgYW5kIGB0eXBlb2ZgIG9wZXJhdGlvbnMgYXJlIHZlcnkgZWZmaWNpZW50LlxuICovXG5cbi8qKlxuICogUmV0dXJucyBgUk5vZGVgLlxuICogQHBhcmFtIHZhbHVlIHdyYXBwZWQgdmFsdWUgb2YgYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBSTm9kZSh2YWx1ZTogUk5vZGUgfCBMVmlldyB8IExDb250YWluZXIpOiBSTm9kZSB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF0gYXMgYW55O1xuICB9XG4gIHJldHVybiB2YWx1ZSBhcyBSTm9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGBMVmlld2Agb3IgYG51bGxgIGlmIG5vdCBmb3VuZC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwTFZpZXcodmFsdWU6IFJOb2RlIHwgTFZpZXcgfCBMQ29udGFpbmVyKTogTFZpZXd8bnVsbCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFRoaXMgY2hlY2sgaXMgc2FtZSBhcyBgaXNMVmlldygpYCBidXQgd2UgZG9uJ3QgY2FsbCBhdCBhcyB3ZSBkb24ndCB3YW50IHRvIGNhbGxcbiAgICAvLyBgQXJyYXkuaXNBcnJheSgpYCB0d2ljZSBhbmQgZ2l2ZSBKSVRlciBtb3JlIHdvcmsgZm9yIGlubGluaW5nLlxuICAgIGlmICh0eXBlb2YgdmFsdWVbVFlQRV0gPT09ICdvYmplY3QnKSByZXR1cm4gdmFsdWUgYXMgTFZpZXc7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXSBhcyBhbnk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBgTENvbnRhaW5lcmAgb3IgYG51bGxgIGlmIG5vdCBmb3VuZC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwTENvbnRhaW5lcih2YWx1ZTogUk5vZGUgfCBMVmlldyB8IExDb250YWluZXIpOiBMQ29udGFpbmVyfG51bGwge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGNoZWNrIGlzIHNhbWUgYXMgYGlzTENvbnRhaW5lcigpYCBidXQgd2UgZG9uJ3QgY2FsbCBhdCBhcyB3ZSBkb24ndCB3YW50IHRvIGNhbGxcbiAgICAvLyBgQXJyYXkuaXNBcnJheSgpYCB0d2ljZSBhbmQgZ2l2ZSBKSVRlciBtb3JlIHdvcmsgZm9yIGlubGluaW5nLlxuICAgIGlmICh2YWx1ZVtUWVBFXSA9PT0gdHJ1ZSkgcmV0dXJuIHZhbHVlIGFzIExDb250YWluZXI7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXSBhcyBhbnk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFuIGVsZW1lbnQgdmFsdWUgZnJvbSB0aGUgcHJvdmlkZWQgYHZpZXdEYXRhYCwgYnkgdW53cmFwcGluZ1xuICogZnJvbSBhbnkgY29udGFpbmVycywgY29tcG9uZW50IHZpZXdzLCBvciBzdHlsZSBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KTogUk5vZGUge1xuICByZXR1cm4gdW53cmFwUk5vZGUobFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgYW4gYFJOb2RlYCBmb3IgYSBnaXZlbiBgVE5vZGVgIGFuZCBgTFZpZXdgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZ3VhcmFudGVlcyBpbiBkZXYgbW9kZSB0byByZXRyaWV2ZSBhIG5vbi1udWxsIGBSTm9kZWAuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgdE5vZGUuaW5kZXgpO1xuICBjb25zdCBub2RlOiBSTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W3ROb2RlLmluZGV4XSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5vZGUpO1xuICByZXR1cm4gbm9kZTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBhbiBgUk5vZGVgIG9yIGBudWxsYCBmb3IgYSBnaXZlbiBgVE5vZGVgIGFuZCBgTFZpZXdgLlxuICpcbiAqIFNvbWUgYFROb2RlYHMgZG9uJ3QgaGF2ZSBhc3NvY2lhdGVkIGBSTm9kZWBzLiBGb3IgZXhhbXBsZSBgUHJvamVjdGlvbmBcbiAqXG4gKiBAcGFyYW0gdE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfG51bGwge1xuICBjb25zdCBpbmRleCA9IHROb2RlLmluZGV4O1xuICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGxWaWV3KTtcbiAgICBjb25zdCBub2RlOiBSTm9kZXxudWxsID0gdW53cmFwUk5vZGUobFZpZXdbaW5kZXhdKTtcbiAgICBuZ0Rldk1vZGUgJiYgbm9kZSAhPT0gbnVsbCAmJiBhc3NlcnREb21Ob2RlKG5vZGUpO1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUTm9kZShpbmRleDogbnVtYmVyLCB2aWV3OiBMVmlldyk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ3dyb25nIGluZGV4IGZvciBUTm9kZScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHZpZXdbVFZJRVddLmRhdGEubGVuZ3RoLCAnd3JvbmcgaW5kZXggZm9yIFROb2RlJyk7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGFueSBgTFZpZXdgIG9yIGBURGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPih2aWV3OiBMVmlldyB8IFREYXRhLCBpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh2aWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICByZXR1cm4gdmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgobm9kZUluZGV4OiBudW1iZXIsIGhvc3RWaWV3OiBMVmlldyk6IExWaWV3IHtcbiAgLy8gQ291bGQgYmUgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lci4gSWYgTENvbnRhaW5lciwgdW53cmFwIHRvIGZpbmQgTFZpZXcuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShob3N0Vmlldywgbm9kZUluZGV4KTtcbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbbm9kZUluZGV4XTtcbiAgY29uc3QgbFZpZXcgPSBpc0xWaWV3KHNsb3RWYWx1ZSkgPyBzbG90VmFsdWUgOiBzbG90VmFsdWVbSE9TVF07XG4gIHJldHVybiBsVmlldztcbn1cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBkYXRhIHByZXNlbnQgb24gdGhlIHRhcmdldCAod2hpY2ggY291bGQgYmVcbiAqIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgYSBET00gbm9kZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZERhdGEodGFyZ2V0OiBhbnkpOiBMVmlld3xMQ29udGV4dHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGFyZ2V0LCAnVGFyZ2V0IGV4cGVjdGVkJyk7XG4gIHJldHVybiB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXSB8fCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWRMVmlldyh0YXJnZXQ6IGFueSk6IExWaWV3fG51bGwge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6ICh2YWx1ZSBhcyBMQ29udGV4dCkubFZpZXc7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQ3JlYXRpb25Nb2RlKHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBib29sZWFuIGZvciB3aGV0aGVyIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gKlxuICogTm90ZTogVGhpcyBkZXRlcm1pbmVzIHdoZXRoZXIgYSB2aWV3IHNob3VsZCBiZSBjaGVja2VkLCBub3Qgd2hldGhlciBpdCdzIGluc2VydGVkXG4gKiBpbnRvIGEgY29udGFpbmVyLiBGb3IgdGhhdCwgeW91J2xsIHdhbnQgYHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyYCBiZWxvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IodmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgdG8gYSBjb250YWluZXIuICovXG5leHBvcnQgZnVuY3Rpb24gdmlld0F0dGFjaGVkVG9Db250YWluZXIodmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzTENvbnRhaW5lcih2aWV3W1BBUkVOVF0pO1xufVxuXG4vKipcbiAqIFJlc2V0cyB0aGUgcHJlLW9yZGVyIGhvb2sgZmxhZ3Mgb2YgdGhlIHZpZXcuXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9uIHdoaWNoIHRoZSBmbGFncyBhcmUgcmVzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXc6IExWaWV3KSB7XG4gIGxWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdID0gMDtcbn1cbiJdfQ==