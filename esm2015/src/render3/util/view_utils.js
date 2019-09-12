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
    return target[MONKEY_PATCH_KEY_NAME];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckgsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzlDLE9BQU8sRUFBYSxJQUFJLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQVcscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUd0RSxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBcUIsTUFBTSxFQUFFLG1CQUFtQixFQUFTLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUI1SCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQWlDO0lBQzNELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMzQixLQUFLLEdBQUcsbUJBQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFPLENBQUM7S0FDNUI7SUFDRCxPQUFPLG1CQUFBLEtBQUssRUFBUyxDQUFDO0FBQ3hCLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxXQUFXLENBQUMsS0FBaUM7SUFDM0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzNCLGtGQUFrRjtRQUNsRixpRUFBaUU7UUFDakUsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxRQUFRO1lBQUUsT0FBTyxtQkFBQSxLQUFLLEVBQVMsQ0FBQztRQUMzRCxLQUFLLEdBQUcsbUJBQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFPLENBQUM7S0FDNUI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFpQztJQUNoRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDM0IsdUZBQXVGO1FBQ3ZGLGlFQUFpRTtRQUNqRSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJO1lBQUUsT0FBTyxtQkFBQSxLQUFLLEVBQWMsQ0FBQztRQUNyRCxLQUFLLEdBQUcsbUJBQUEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFPLENBQUM7S0FDNUI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQWEsRUFBRSxLQUFZO0lBQzFELE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDOzs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3pELFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0MsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7O1VBQzdDLElBQUksR0FBVSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxTQUFTLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFZLEVBQUUsS0FBWTs7VUFDekQsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLO0lBQ3pCLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ2hCLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7O2NBQ3pDLElBQUksR0FBZSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELFNBQVMsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRCxPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDOzs7Ozs7QUFHRCxNQUFNLFVBQVUsUUFBUSxDQUFDLEtBQWEsRUFBRSxJQUFXO0lBQ2pELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUNuRSxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3JGLE9BQU8sbUJBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLEVBQVMsQ0FBQztBQUMxRCxDQUFDOzs7Ozs7OztBQUdELE1BQU0sVUFBVSxJQUFJLENBQUksSUFBbUIsRUFBRSxLQUFhO0lBQ3hELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0lBQzVELE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztBQUNyQyxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsU0FBaUIsRUFBRSxRQUFlO0lBQ3hFLDJFQUEyRTtJQUMzRSxTQUFTLElBQUksaUJBQWlCLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztVQUM5QyxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQzs7VUFDL0IsS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQzlELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7OztBQU9ELE1BQU0sVUFBVSxlQUFlLENBQUMsTUFBVztJQUN6QyxTQUFTLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDdkMsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsTUFBVzs7VUFDcEMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7SUFDckMsSUFBSSxLQUFLLEVBQUU7UUFDVCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxLQUFLLEVBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQztLQUNqRTtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7O0FBR0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxJQUFXO0lBQ3hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUEwQixDQUFDLHlCQUE0QixDQUFDO0FBQzdFLENBQUM7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxJQUFXO0lBQ3RELE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFzQixDQUFDLHVCQUF3QixDQUFDO0FBQ3JFLENBQUM7Ozs7OztBQUdELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxJQUFXO0lBQ2pELE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFZO0lBQ2pELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7TENvbnRhaW5lciwgVFlQRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dCwgTU9OS0VZX1BBVENIX0tFWV9OQU1FfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Uk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUFJFT1JERVJfSE9PS19GTEFHUywgVERhdGEsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cblxuLyoqXG4gKiBGb3IgZWZmaWNpZW5jeSByZWFzb25zIHdlIG9mdGVuIHB1dCBzZXZlcmFsIGRpZmZlcmVudCBkYXRhIHR5cGVzIChgUk5vZGVgLCBgTFZpZXdgLCBgTENvbnRhaW5lcmApXG4gKiBpbiBzYW1lIGxvY2F0aW9uIGluIGBMVmlld2AuIFRoaXMgaXMgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvIHByZS1hbGxvY2F0ZSBzcGFjZSBmb3IgaXRcbiAqIGJlY2F1c2UgdGhlIHN0b3JhZ2UgaXMgc3BhcnNlLiBUaGlzIGZpbGUgY29udGFpbnMgdXRpbGl0aWVzIGZvciBkZWFsaW5nIHdpdGggc3VjaCBkYXRhIHR5cGVzLlxuICpcbiAqIEhvdyBkbyB3ZSBrbm93IHdoYXQgaXMgc3RvcmVkIGF0IGEgZ2l2ZW4gbG9jYXRpb24gaW4gYExWaWV3YC5cbiAqIC0gYEFycmF5LmlzQXJyYXkodmFsdWUpID09PSBmYWxzZWAgPT4gYFJOb2RlYCAoVGhlIG5vcm1hbCBzdG9yYWdlIHZhbHVlKVxuICogLSBgQXJyYXkuaXNBcnJheSh2YWx1ZSkgPT09IHRydWVgID0+IHRoZW4gdGhlIGB2YWx1ZVswXWAgcmVwcmVzZW50cyB0aGUgd3JhcHBlZCB2YWx1ZS5cbiAqICAgLSBgdHlwZW9mIHZhbHVlW1RZUEVdID09PSAnb2JqZWN0J2AgPT4gYExWaWV3YFxuICogICAgICAtIFRoaXMgaGFwcGVucyB3aGVuIHdlIGhhdmUgYSBjb21wb25lbnQgYXQgYSBnaXZlbiBsb2NhdGlvblxuICogICAtIGB0eXBlb2YgdmFsdWVbVFlQRV0gPT09IHRydWVgID0+IGBMQ29udGFpbmVyYFxuICogICAgICAtIFRoaXMgaGFwcGVucyB3aGVuIHdlIGhhdmUgYExDb250YWluZXJgIGJpbmRpbmcgYXQgYSBnaXZlbiBsb2NhdGlvbi5cbiAqXG4gKlxuICogTk9URTogaXQgaXMgYXNzdW1lZCB0aGF0IGBBcnJheS5pc0FycmF5YCBhbmQgYHR5cGVvZmAgb3BlcmF0aW9ucyBhcmUgdmVyeSBlZmZpY2llbnQuXG4gKi9cblxuLyoqXG4gKiBSZXR1cm5zIGBSTm9kZWAuXG4gKiBAcGFyYW0gdmFsdWUgd3JhcHBlZCB2YWx1ZSBvZiBgUk5vZGVgLCBgTFZpZXdgLCBgTENvbnRhaW5lcmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcFJOb2RlKHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lcik6IFJOb2RlIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXSBhcyBhbnk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlIGFzIFJOb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYExWaWV3YCBvciBgbnVsbGAgaWYgbm90IGZvdW5kLlxuICogQHBhcmFtIHZhbHVlIHdyYXBwZWQgdmFsdWUgb2YgYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBMVmlldyh2YWx1ZTogUk5vZGUgfCBMVmlldyB8IExDb250YWluZXIpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBzYW1lIGFzIGBpc0xWaWV3KClgIGJ1dCB3ZSBkb24ndCBjYWxsIGF0IGFzIHdlIGRvbid0IHdhbnQgdG8gY2FsbFxuICAgIC8vIGBBcnJheS5pc0FycmF5KClgIHR3aWNlIGFuZCBnaXZlIEpJVGVyIG1vcmUgd29yayBmb3IgaW5saW5pbmcuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gJ29iamVjdCcpIHJldHVybiB2YWx1ZSBhcyBMVmlldztcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdIGFzIGFueTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGBMQ29udGFpbmVyYCBvciBgbnVsbGAgaWYgbm90IGZvdW5kLlxuICogQHBhcmFtIHZhbHVlIHdyYXBwZWQgdmFsdWUgb2YgYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBMQ29udGFpbmVyKHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lcik6IExDb250YWluZXJ8bnVsbCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFRoaXMgY2hlY2sgaXMgc2FtZSBhcyBgaXNMQ29udGFpbmVyKClgIGJ1dCB3ZSBkb24ndCBjYWxsIGF0IGFzIHdlIGRvbid0IHdhbnQgdG8gY2FsbFxuICAgIC8vIGBBcnJheS5pc0FycmF5KClgIHR3aWNlIGFuZCBnaXZlIEpJVGVyIG1vcmUgd29yayBmb3IgaW5saW5pbmcuXG4gICAgaWYgKHZhbHVlW1RZUEVdID09PSB0cnVlKSByZXR1cm4gdmFsdWUgYXMgTENvbnRhaW5lcjtcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdIGFzIGFueTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYW4gZWxlbWVudCB2YWx1ZSBmcm9tIHRoZSBwcm92aWRlZCBgdmlld0RhdGFgLCBieSB1bndyYXBwaW5nXG4gKiBmcm9tIGFueSBjb250YWluZXJzLCBjb21wb25lbnQgdmlld3MsIG9yIHN0eWxlIGNvbnRleHRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlQnlJbmRleChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiBSTm9kZSB7XG4gIHJldHVybiB1bndyYXBSTm9kZShsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdKTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBhbiBgUk5vZGVgIGZvciBhIGdpdmVuIGBUTm9kZWAgYW5kIGBMVmlld2AuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBndWFyYW50ZWVzIGluIGRldiBtb2RlIHRvIHJldHJpZXZlIGEgbm9uLW51bGwgYFJOb2RlYC5cbiAqXG4gKiBAcGFyYW0gdE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCB0Tm9kZS5pbmRleCk7XG4gIGNvbnN0IG5vZGU6IFJOb2RlID0gdW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUobm9kZSk7XG4gIHJldHVybiBub2RlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGFuIGBSTm9kZWAgb3IgYG51bGxgIGZvciBhIGdpdmVuIGBUTm9kZWAgYW5kIGBMVmlld2AuXG4gKlxuICogU29tZSBgVE5vZGVgcyBkb24ndCBoYXZlIGFzc29jaWF0ZWQgYFJOb2RlYHMuIEZvciBleGFtcGxlIGBQcm9qZWN0aW9uYFxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVCeVROb2RlT3JOdWxsKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGV8bnVsbCB7XG4gIGNvbnN0IGluZGV4ID0gdE5vZGUuaW5kZXg7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICAgIGNvbnN0IG5vZGU6IFJOb2RlfG51bGwgPSB1bndyYXBSTm9kZShsVmlld1tpbmRleF0pO1xuICAgIG5nRGV2TW9kZSAmJiBub2RlICE9PSBudWxsICYmIGFzc2VydERvbU5vZGUobm9kZSk7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFROb2RlKGluZGV4OiBudW1iZXIsIHZpZXc6IExWaWV3KTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnd3JvbmcgaW5kZXggZm9yIFROb2RlJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihpbmRleCwgdmlld1tUVklFV10uZGF0YS5sZW5ndGgsICd3cm9uZyBpbmRleCBmb3IgVE5vZGUnKTtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld2Agb3IgYFREYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkPFQ+KHZpZXc6IExWaWV3IHwgVERhdGEsIGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIHJldHVybiB2aWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRWaWV3QnlJbmRleChub2RlSW5kZXg6IG51bWJlciwgaG9zdFZpZXc6IExWaWV3KTogTFZpZXcge1xuICAvLyBDb3VsZCBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyLiBJZiBMQ29udGFpbmVyLCB1bndyYXAgdG8gZmluZCBMVmlldy5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGhvc3RWaWV3LCBub2RlSW5kZXgpO1xuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tub2RlSW5kZXhdO1xuICBjb25zdCBsVmlldyA9IGlzTFZpZXcoc2xvdFZhbHVlKSA/IHNsb3RWYWx1ZSA6IHNsb3RWYWx1ZVtIT1NUXTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGRhdGEgcHJlc2VudCBvbiB0aGUgdGFyZ2V0ICh3aGljaCBjb3VsZCBiZVxuICogYSBjb21wb25lbnQsIGRpcmVjdGl2ZSBvciBhIERPTSBub2RlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3fExDb250ZXh0fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0YXJnZXQsICdUYXJnZXQgZXhwZWN0ZWQnKTtcbiAgcmV0dXJuIHRhcmdldFtNT05LRVlfUEFUQ0hfS0VZX05BTUVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWRMVmlldyh0YXJnZXQ6IGFueSk6IExWaWV3fG51bGwge1xuICBjb25zdCB2YWx1ZSA9IHJlYWRQYXRjaGVkRGF0YSh0YXJnZXQpO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6ICh2YWx1ZSBhcyBMQ29udGV4dCkubFZpZXc7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQ3JlYXRpb25Nb2RlKHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBib29sZWFuIGZvciB3aGV0aGVyIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuXG4gKlxuICogTm90ZTogVGhpcyBkZXRlcm1pbmVzIHdoZXRoZXIgYSB2aWV3IHNob3VsZCBiZSBjaGVja2VkLCBub3Qgd2hldGhlciBpdCdzIGluc2VydGVkXG4gKiBpbnRvIGEgY29udGFpbmVyLiBGb3IgdGhhdCwgeW91J2xsIHdhbnQgYHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyYCBiZWxvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IodmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgdG8gYSBjb250YWluZXIuICovXG5leHBvcnQgZnVuY3Rpb24gdmlld0F0dGFjaGVkVG9Db250YWluZXIodmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzTENvbnRhaW5lcih2aWV3W1BBUkVOVF0pO1xufVxuXG4vKipcbiAqIFJlc2V0cyB0aGUgcHJlLW9yZGVyIGhvb2sgZmxhZ3Mgb2YgdGhlIHZpZXcuXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IG9uIHdoaWNoIHRoZSBmbGFncyBhcmUgcmVzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXc6IExWaWV3KSB7XG4gIGxWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdID0gMDtcbn1cbiJdfQ==