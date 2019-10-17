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
import { isProceduralRenderer } from '../interfaces/renderer';
import { isLContainer, isLView } from '../interfaces/type_checks';
import { FLAGS, HEADER_OFFSET, HOST, PARENT, PREORDER_HOOK_FLAGS, RENDERER, TVIEW } from '../interfaces/view';
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
    ngDevMode && !isProceduralRenderer(lView[RENDERER]) && assertDomNode(node);
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
        ngDevMode && node !== null && !isProceduralRenderer(lView[RENDERER]) && assertDomNode(node);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckgsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzlDLE9BQU8sRUFBYSxJQUFJLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQVcscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUV0RSxPQUFPLEVBQVEsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRSxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBcUIsTUFBTSxFQUFFLG1CQUFtQixFQUFFLFFBQVEsRUFBUyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlCdEksTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFpQztJQUMzRCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDM0IsS0FBSyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBTyxDQUFDO0tBQzVCO0lBQ0QsT0FBTyxtQkFBQSxLQUFLLEVBQVMsQ0FBQztBQUN4QixDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQWlDO0lBQzNELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMzQixrRkFBa0Y7UUFDbEYsaUVBQWlFO1FB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WSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFZO0lBQ2pELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7TENvbnRhaW5lciwgVFlQRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dCwgTU9OS0VZX1BBVENIX0tFWV9OQU1FfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Uk5vZGUsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFBSRU9SREVSX0hPT0tfRkxBR1MsIFJFTkRFUkVSLCBURGF0YSwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5cblxuXG4vKipcbiAqIEZvciBlZmZpY2llbmN5IHJlYXNvbnMgd2Ugb2Z0ZW4gcHV0IHNldmVyYWwgZGlmZmVyZW50IGRhdGEgdHlwZXMgKGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYClcbiAqIGluIHNhbWUgbG9jYXRpb24gaW4gYExWaWV3YC4gVGhpcyBpcyBiZWNhdXNlIHdlIGRvbid0IHdhbnQgdG8gcHJlLWFsbG9jYXRlIHNwYWNlIGZvciBpdFxuICogYmVjYXVzZSB0aGUgc3RvcmFnZSBpcyBzcGFyc2UuIFRoaXMgZmlsZSBjb250YWlucyB1dGlsaXRpZXMgZm9yIGRlYWxpbmcgd2l0aCBzdWNoIGRhdGEgdHlwZXMuXG4gKlxuICogSG93IGRvIHdlIGtub3cgd2hhdCBpcyBzdG9yZWQgYXQgYSBnaXZlbiBsb2NhdGlvbiBpbiBgTFZpZXdgLlxuICogLSBgQXJyYXkuaXNBcnJheSh2YWx1ZSkgPT09IGZhbHNlYCA9PiBgUk5vZGVgIChUaGUgbm9ybWFsIHN0b3JhZ2UgdmFsdWUpXG4gKiAtIGBBcnJheS5pc0FycmF5KHZhbHVlKSA9PT0gdHJ1ZWAgPT4gdGhlbiB0aGUgYHZhbHVlWzBdYCByZXByZXNlbnRzIHRoZSB3cmFwcGVkIHZhbHVlLlxuICogICAtIGB0eXBlb2YgdmFsdWVbVFlQRV0gPT09ICdvYmplY3QnYCA9PiBgTFZpZXdgXG4gKiAgICAgIC0gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBhIGNvbXBvbmVudCBhdCBhIGdpdmVuIGxvY2F0aW9uXG4gKiAgIC0gYHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gdHJ1ZWAgPT4gYExDb250YWluZXJgXG4gKiAgICAgIC0gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBgTENvbnRhaW5lcmAgYmluZGluZyBhdCBhIGdpdmVuIGxvY2F0aW9uLlxuICpcbiAqXG4gKiBOT1RFOiBpdCBpcyBhc3N1bWVkIHRoYXQgYEFycmF5LmlzQXJyYXlgIGFuZCBgdHlwZW9mYCBvcGVyYXRpb25zIGFyZSB2ZXJ5IGVmZmljaWVudC5cbiAqL1xuXG4vKipcbiAqIFJldHVybnMgYFJOb2RlYC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwUk5vZGUodmFsdWU6IFJOb2RlIHwgTFZpZXcgfCBMQ29udGFpbmVyKTogUk5vZGUge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdIGFzIGFueTtcbiAgfVxuICByZXR1cm4gdmFsdWUgYXMgUk5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyBgTFZpZXdgIG9yIGBudWxsYCBpZiBub3QgZm91bmQuXG4gKiBAcGFyYW0gdmFsdWUgd3JhcHBlZCB2YWx1ZSBvZiBgUk5vZGVgLCBgTFZpZXdgLCBgTENvbnRhaW5lcmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcExWaWV3KHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lcik6IExWaWV3fG51bGwge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGNoZWNrIGlzIHNhbWUgYXMgYGlzTFZpZXcoKWAgYnV0IHdlIGRvbid0IGNhbGwgYXQgYXMgd2UgZG9uJ3Qgd2FudCB0byBjYWxsXG4gICAgLy8gYEFycmF5LmlzQXJyYXkoKWAgdHdpY2UgYW5kIGdpdmUgSklUZXIgbW9yZSB3b3JrIGZvciBpbmxpbmluZy5cbiAgICBpZiAodHlwZW9mIHZhbHVlW1RZUEVdID09PSAnb2JqZWN0JykgcmV0dXJuIHZhbHVlIGFzIExWaWV3O1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF0gYXMgYW55O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYExDb250YWluZXJgIG9yIGBudWxsYCBpZiBub3QgZm91bmQuXG4gKiBAcGFyYW0gdmFsdWUgd3JhcHBlZCB2YWx1ZSBvZiBgUk5vZGVgLCBgTFZpZXdgLCBgTENvbnRhaW5lcmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVud3JhcExDb250YWluZXIodmFsdWU6IFJOb2RlIHwgTFZpZXcgfCBMQ29udGFpbmVyKTogTENvbnRhaW5lcnxudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBzYW1lIGFzIGBpc0xDb250YWluZXIoKWAgYnV0IHdlIGRvbid0IGNhbGwgYXQgYXMgd2UgZG9uJ3Qgd2FudCB0byBjYWxsXG4gICAgLy8gYEFycmF5LmlzQXJyYXkoKWAgdHdpY2UgYW5kIGdpdmUgSklUZXIgbW9yZSB3b3JrIGZvciBpbmxpbmluZy5cbiAgICBpZiAodmFsdWVbVFlQRV0gPT09IHRydWUpIHJldHVybiB2YWx1ZSBhcyBMQ29udGFpbmVyO1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF0gYXMgYW55O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbiBlbGVtZW50IHZhbHVlIGZyb20gdGhlIHByb3ZpZGVkIGB2aWV3RGF0YWAsIGJ5IHVud3JhcHBpbmdcbiAqIGZyb20gYW55IGNvbnRhaW5lcnMsIGNvbXBvbmVudCB2aWV3cywgb3Igc3R5bGUgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVCeUluZGV4KGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IFJOb2RlIHtcbiAgcmV0dXJuIHVud3JhcFJOb2RlKGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0pO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGFuIGBSTm9kZWAgZm9yIGEgZ2l2ZW4gYFROb2RlYCBhbmQgYExWaWV3YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGd1YXJhbnRlZXMgaW4gZGV2IG1vZGUgdG8gcmV0cmlldmUgYSBub24tbnVsbCBgUk5vZGVgLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVCeVROb2RlKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIHROb2RlLmluZGV4KTtcbiAgY29uc3Qgbm9kZTogUk5vZGUgPSB1bndyYXBSTm9kZShsVmlld1t0Tm9kZS5pbmRleF0pO1xuICBuZ0Rldk1vZGUgJiYgIWlzUHJvY2VkdXJhbFJlbmRlcmVyKGxWaWV3W1JFTkRFUkVSXSkgJiYgYXNzZXJ0RG9tTm9kZShub2RlKTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogUmV0cmlldmUgYW4gYFJOb2RlYCBvciBgbnVsbGAgZm9yIGEgZ2l2ZW4gYFROb2RlYCBhbmQgYExWaWV3YC5cbiAqXG4gKiBTb21lIGBUTm9kZWBzIGRvbid0IGhhdmUgYXNzb2NpYXRlZCBgUk5vZGVgcy4gRm9yIGV4YW1wbGUgYFByb2plY3Rpb25gXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5hdGl2ZUJ5VE5vZGVPck51bGwodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZXxudWxsIHtcbiAgY29uc3QgaW5kZXggPSB0Tm9kZS5pbmRleDtcbiAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBsVmlldyk7XG4gICAgY29uc3Qgbm9kZTogUk5vZGV8bnVsbCA9IHVud3JhcFJOb2RlKGxWaWV3W2luZGV4XSk7XG4gICAgbmdEZXZNb2RlICYmIG5vZGUgIT09IG51bGwgJiYgIWlzUHJvY2VkdXJhbFJlbmRlcmVyKGxWaWV3W1JFTkRFUkVSXSkgJiYgYXNzZXJ0RG9tTm9kZShub2RlKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VE5vZGUoaW5kZXg6IG51bWJlciwgdmlldzogTFZpZXcpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICd3cm9uZyBpbmRleCBmb3IgVE5vZGUnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKGluZGV4LCB2aWV3W1RWSUVXXS5kYXRhLmxlbmd0aCwgJ3dyb25nIGluZGV4IGZvciBUTm9kZScpO1xuICByZXR1cm4gdmlld1tUVklFV10uZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFROb2RlO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBhbnkgYExWaWV3YCBvciBgVERhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4odmlldzogTFZpZXcgfCBURGF0YSwgaW5kZXg6IG51bWJlcik6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgcmV0dXJuIHZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudFZpZXdCeUluZGV4KG5vZGVJbmRleDogbnVtYmVyLCBob3N0VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIC8vIENvdWxkIGJlIGFuIExWaWV3IG9yIGFuIExDb250YWluZXIuIElmIExDb250YWluZXIsIHVud3JhcCB0byBmaW5kIExWaWV3LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaG9zdFZpZXcsIG5vZGVJbmRleCk7XG4gIGNvbnN0IHNsb3RWYWx1ZSA9IGhvc3RWaWV3W25vZGVJbmRleF07XG4gIGNvbnN0IGxWaWV3ID0gaXNMVmlldyhzbG90VmFsdWUpID8gc2xvdFZhbHVlIDogc2xvdFZhbHVlW0hPU1RdO1xuICByZXR1cm4gbFZpZXc7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXd8TENvbnRleHR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRhcmdldCwgJ1RhcmdldCBleHBlY3RlZCcpO1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV0gfHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkTFZpZXcodGFyZ2V0OiBhbnkpOiBMVmlld3xudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiAodmFsdWUgYXMgTENvbnRleHQpLmxWaWV3O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NyZWF0aW9uTW9kZSh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICpcbiAqIE5vdGU6IFRoaXMgZGV0ZXJtaW5lcyB3aGV0aGVyIGEgdmlldyBzaG91bGQgYmUgY2hlY2tlZCwgbm90IHdoZXRoZXIgaXQncyBpbnNlcnRlZFxuICogaW50byBhIGNvbnRhaW5lci4gRm9yIHRoYXQsIHlvdSdsbCB3YW50IGB2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcmAgYmVsb3cuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqIFJldHVybnMgYSBib29sZWFuIGZvciB3aGV0aGVyIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIGEgY29udGFpbmVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyKHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0xDb250YWluZXIodmlld1tQQVJFTlRdKTtcbn1cblxuLyoqXG4gKiBSZXNldHMgdGhlIHByZS1vcmRlciBob29rIGZsYWdzIG9mIHRoZSB2aWV3LlxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlldyBvbiB3aGljaCB0aGUgZmxhZ3MgYXJlIHJlc2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3OiBMVmlldykge1xuICBsVmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSA9IDA7XG59XG4iXX0=