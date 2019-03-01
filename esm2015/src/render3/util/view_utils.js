/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDataInRange, assertDefined, assertGreaterThan, assertLessThan } from '../../util/assert';
import { TYPE } from '../interfaces/container';
import { MONKEY_PATCH_KEY_NAME } from '../interfaces/context';
import { FLAGS, HEADER_OFFSET, HOST, PARENT, TVIEW } from '../interfaces/view';
/**
 * For efficiency reasons we often put several different data types (`RNode`, `LView`, `LContainer`,
 * `StylingContext`) in same location in `LView`. This is because we don't want to pre-allocate
 * space for it because the storage is sparse. This file contains utilities for dealing with such
 * data types.
 *
 * How do we know what is stored at a given location in `LView`.
 * - `Array.isArray(value) === false` => `RNode` (The normal storage value)
 * - `Array.isArray(value) === true` => then the `value[0]` represents the wrapped value.
 *   - `typeof value[TYPE] === 'object'` => `LView`
 *      - This happens when we have a component at a given location
 *   - `typeof value[TYPE] === 'number'` => `StylingContext`
 *      - This happens when we have style/class binding at a given location.
 *   - `typeof value[TYPE] === true` => `LContainer`
 *      - This happens when we have `LContainer` binding at a given location.
 *
 *
 * NOTE: it is assumed that `Array.isArray` and `typeof` operations are very efficient.
 */
/**
 * Returns `RNode`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
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
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
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
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
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
 * Returns `StylingContext` or `null` if not found.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 * @return {?}
 */
export function unwrapStylingContext(value) {
    while (Array.isArray(value)) {
        // This check is same as `isStylingContext()` but we don't call at as we don't want to call
        // `Array.isArray()` twice and give JITer more work for inlining.
        if (typeof value[TYPE] === 'number')
            return (/** @type {?} */ (value));
        value = (/** @type {?} */ (value[HOST]));
    }
    return null;
}
/**
 * True if `value` is `LView`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 * @return {?}
 */
export function isLView(value) {
    return Array.isArray(value) && typeof value[TYPE] === 'object';
}
/**
 * True if `value` is `LContainer`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 * @return {?}
 */
export function isLContainer(value) {
    return Array.isArray(value) && value[TYPE] === true;
}
/**
 * True if `value` is `StylingContext`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 * @return {?}
 */
export function isStylingContext(value) {
    return Array.isArray(value) && typeof value[TYPE] === 'number';
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
 * @param {?} tNode
 * @param {?} hostView
 * @return {?}
 */
export function getNativeByTNode(tNode, hostView) {
    return unwrapRNode(hostView[tNode.index]);
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
export function loadInternal(view, index) {
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
    /** @type {?} */
    const slotValue = hostView[nodeIndex];
    /** @type {?} */
    const lView = isLView(slotValue) ? slotValue : slotValue[HOST];
    return lView;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isContentQueryHost(tNode) {
    return (tNode.flags & 4 /* hasContentQuery */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isComponent(tNode) {
    return (tNode.flags & 1 /* isComponent */) === 1 /* isComponent */;
}
/**
 * @template T
 * @param {?} def
 * @return {?}
 */
export function isComponentDef(def) {
    return ((/** @type {?} */ (def))).template !== null;
}
/**
 * @param {?} target
 * @return {?}
 */
export function isRootView(target) {
    return (target[FLAGS] & 512 /* IsRoot */) !== 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RyxPQUFPLEVBQWEsSUFBSSxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDekQsT0FBTyxFQUFXLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFLdEUsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFxQixNQUFNLEVBQVMsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QnZHLE1BQU0sVUFBVSxXQUFXLENBQUMsS0FBa0Q7SUFDNUUsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzNCLEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQU8sQ0FBQztLQUM1QjtJQUNELE9BQU8sbUJBQUEsS0FBSyxFQUFTLENBQUM7QUFDeEIsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFrRDtJQUM1RSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDM0Isa0ZBQWtGO1FBQ2xGLGlFQUFpRTtRQUNqRSxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLFFBQVE7WUFBRSxPQUFPLG1CQUFBLEtBQUssRUFBUyxDQUFDO1FBQzNELEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQU8sQ0FBQztLQUM1QjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7O0FB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SUFBVztJQUN0RCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBc0IsQ0FBQyx1QkFBd0IsQ0FBQztBQUNyRSxDQUFDOzs7Ozs7QUFHRCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBVztJQUNqRCxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7TENvbnRhaW5lciwgVFlQRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dCwgTU9OS0VZX1BBVENIX0tFWV9OQU1FfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIERpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBURGF0YSwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5cblxuXG4vKipcbiAqIEZvciBlZmZpY2llbmN5IHJlYXNvbnMgd2Ugb2Z0ZW4gcHV0IHNldmVyYWwgZGlmZmVyZW50IGRhdGEgdHlwZXMgKGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYCxcbiAqIGBTdHlsaW5nQ29udGV4dGApIGluIHNhbWUgbG9jYXRpb24gaW4gYExWaWV3YC4gVGhpcyBpcyBiZWNhdXNlIHdlIGRvbid0IHdhbnQgdG8gcHJlLWFsbG9jYXRlXG4gKiBzcGFjZSBmb3IgaXQgYmVjYXVzZSB0aGUgc3RvcmFnZSBpcyBzcGFyc2UuIFRoaXMgZmlsZSBjb250YWlucyB1dGlsaXRpZXMgZm9yIGRlYWxpbmcgd2l0aCBzdWNoXG4gKiBkYXRhIHR5cGVzLlxuICpcbiAqIEhvdyBkbyB3ZSBrbm93IHdoYXQgaXMgc3RvcmVkIGF0IGEgZ2l2ZW4gbG9jYXRpb24gaW4gYExWaWV3YC5cbiAqIC0gYEFycmF5LmlzQXJyYXkodmFsdWUpID09PSBmYWxzZWAgPT4gYFJOb2RlYCAoVGhlIG5vcm1hbCBzdG9yYWdlIHZhbHVlKVxuICogLSBgQXJyYXkuaXNBcnJheSh2YWx1ZSkgPT09IHRydWVgID0+IHRoZW4gdGhlIGB2YWx1ZVswXWAgcmVwcmVzZW50cyB0aGUgd3JhcHBlZCB2YWx1ZS5cbiAqICAgLSBgdHlwZW9mIHZhbHVlW1RZUEVdID09PSAnb2JqZWN0J2AgPT4gYExWaWV3YFxuICogICAgICAtIFRoaXMgaGFwcGVucyB3aGVuIHdlIGhhdmUgYSBjb21wb25lbnQgYXQgYSBnaXZlbiBsb2NhdGlvblxuICogICAtIGB0eXBlb2YgdmFsdWVbVFlQRV0gPT09ICdudW1iZXInYCA9PiBgU3R5bGluZ0NvbnRleHRgXG4gKiAgICAgIC0gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBzdHlsZS9jbGFzcyBiaW5kaW5nIGF0IGEgZ2l2ZW4gbG9jYXRpb24uXG4gKiAgIC0gYHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gdHJ1ZWAgPT4gYExDb250YWluZXJgXG4gKiAgICAgIC0gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBgTENvbnRhaW5lcmAgYmluZGluZyBhdCBhIGdpdmVuIGxvY2F0aW9uLlxuICpcbiAqXG4gKiBOT1RFOiBpdCBpcyBhc3N1bWVkIHRoYXQgYEFycmF5LmlzQXJyYXlgIGFuZCBgdHlwZW9mYCBvcGVyYXRpb25zIGFyZSB2ZXJ5IGVmZmljaWVudC5cbiAqL1xuXG4vKipcbiAqIFJldHVybnMgYFJOb2RlYC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYCwgYFN0eWxpbmdDb250ZXh0YFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwUk5vZGUodmFsdWU6IFJOb2RlIHwgTFZpZXcgfCBMQ29udGFpbmVyIHwgU3R5bGluZ0NvbnRleHQpOiBSTm9kZSB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF0gYXMgYW55O1xuICB9XG4gIHJldHVybiB2YWx1ZSBhcyBSTm9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGBMVmlld2Agb3IgYG51bGxgIGlmIG5vdCBmb3VuZC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYCwgYFN0eWxpbmdDb250ZXh0YFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW53cmFwTFZpZXcodmFsdWU6IFJOb2RlIHwgTFZpZXcgfCBMQ29udGFpbmVyIHwgU3R5bGluZ0NvbnRleHQpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBzYW1lIGFzIGBpc0xWaWV3KClgIGJ1dCB3ZSBkb24ndCBjYWxsIGF0IGFzIHdlIGRvbid0IHdhbnQgdG8gY2FsbFxuICAgIC8vIGBBcnJheS5pc0FycmF5KClgIHR3aWNlIGFuZCBnaXZlIEpJVGVyIG1vcmUgd29yayBmb3IgaW5saW5pbmcuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gJ29iamVjdCcpIHJldHVybiB2YWx1ZSBhcyBMVmlldztcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdIGFzIGFueTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGBMQ29udGFpbmVyYCBvciBgbnVsbGAgaWYgbm90IGZvdW5kLlxuICogQHBhcmFtIHZhbHVlIHdyYXBwZWQgdmFsdWUgb2YgYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgLCBgU3R5bGluZ0NvbnRleHRgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBMQ29udGFpbmVyKHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0KTogTENvbnRhaW5lcnxcbiAgICBudWxsIHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgLy8gVGhpcyBjaGVjayBpcyBzYW1lIGFzIGBpc0xDb250YWluZXIoKWAgYnV0IHdlIGRvbid0IGNhbGwgYXQgYXMgd2UgZG9uJ3Qgd2FudCB0byBjYWxsXG4gICAgLy8gYEFycmF5LmlzQXJyYXkoKWAgdHdpY2UgYW5kIGdpdmUgSklUZXIgbW9yZSB3b3JrIGZvciBpbmxpbmluZy5cbiAgICBpZiAodmFsdWVbVFlQRV0gPT09IHRydWUpIHJldHVybiB2YWx1ZSBhcyBMQ29udGFpbmVyO1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF0gYXMgYW55O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgYFN0eWxpbmdDb250ZXh0YCBvciBgbnVsbGAgaWYgbm90IGZvdW5kLlxuICogQHBhcmFtIHZhbHVlIHdyYXBwZWQgdmFsdWUgb2YgYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgLCBgU3R5bGluZ0NvbnRleHRgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bndyYXBTdHlsaW5nQ29udGV4dCh2YWx1ZTogUk5vZGUgfCBMVmlldyB8IExDb250YWluZXIgfCBTdHlsaW5nQ29udGV4dCk6XG4gICAgU3R5bGluZ0NvbnRleHR8bnVsbCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFRoaXMgY2hlY2sgaXMgc2FtZSBhcyBgaXNTdHlsaW5nQ29udGV4dCgpYCBidXQgd2UgZG9uJ3QgY2FsbCBhdCBhcyB3ZSBkb24ndCB3YW50IHRvIGNhbGxcbiAgICAvLyBgQXJyYXkuaXNBcnJheSgpYCB0d2ljZSBhbmQgZ2l2ZSBKSVRlciBtb3JlIHdvcmsgZm9yIGlubGluaW5nLlxuICAgIGlmICh0eXBlb2YgdmFsdWVbVFlQRV0gPT09ICdudW1iZXInKSByZXR1cm4gdmFsdWUgYXMgU3R5bGluZ0NvbnRleHQ7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXSBhcyBhbnk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogVHJ1ZSBpZiBgdmFsdWVgIGlzIGBMVmlld2AuXG4gKiBAcGFyYW0gdmFsdWUgd3JhcHBlZCB2YWx1ZSBvZiBgUk5vZGVgLCBgTFZpZXdgLCBgTENvbnRhaW5lcmAsIGBTdHlsaW5nQ29udGV4dGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTFZpZXcodmFsdWU6IFJOb2RlIHwgTFZpZXcgfCBMQ29udGFpbmVyIHwgU3R5bGluZ0NvbnRleHQgfCB7fSB8IG51bGwpOlxuICAgIHZhbHVlIGlzIExWaWV3IHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogVHJ1ZSBpZiBgdmFsdWVgIGlzIGBMQ29udGFpbmVyYC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYCwgYFN0eWxpbmdDb250ZXh0YFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMQ29udGFpbmVyKHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0IHwge30gfCBudWxsKTpcbiAgICB2YWx1ZSBpcyBMQ29udGFpbmVyIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlW1RZUEVdID09PSB0cnVlO1xufVxuXG4vKipcbiAqIFRydWUgaWYgYHZhbHVlYCBpcyBgU3R5bGluZ0NvbnRleHRgLlxuICogQHBhcmFtIHZhbHVlIHdyYXBwZWQgdmFsdWUgb2YgYFJOb2RlYCwgYExWaWV3YCwgYExDb250YWluZXJgLCBgU3R5bGluZ0NvbnRleHRgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0IHwge30gfCBudWxsKTpcbiAgICB2YWx1ZSBpcyBTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB0eXBlb2YgdmFsdWVbVFlQRV0gPT09ICdudW1iZXInO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbiBlbGVtZW50IHZhbHVlIGZyb20gdGhlIHByb3ZpZGVkIGB2aWV3RGF0YWAsIGJ5IHVud3JhcHBpbmdcbiAqIGZyb20gYW55IGNvbnRhaW5lcnMsIGNvbXBvbmVudCB2aWV3cywgb3Igc3R5bGUgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVCeUluZGV4KGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IFJOb2RlIHtcbiAgcmV0dXJuIHVud3JhcFJOb2RlKGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IFJOb2RlIHtcbiAgcmV0dXJuIHVud3JhcFJOb2RlKGhvc3RWaWV3W3ROb2RlLmluZGV4XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUTm9kZShpbmRleDogbnVtYmVyLCB2aWV3OiBMVmlldyk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ3dyb25nIGluZGV4IGZvciBUTm9kZScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHZpZXdbVFZJRVddLmRhdGEubGVuZ3RoLCAnd3JvbmcgaW5kZXggZm9yIFROb2RlJyk7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGFueSBgTFZpZXdgIG9yIGBURGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEludGVybmFsPFQ+KHZpZXc6IExWaWV3IHwgVERhdGEsIGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIHJldHVybiB2aWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnRWaWV3QnlJbmRleChub2RlSW5kZXg6IG51bWJlciwgaG9zdFZpZXc6IExWaWV3KTogTFZpZXcge1xuICAvLyBDb3VsZCBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyLiBJZiBMQ29udGFpbmVyLCB1bndyYXAgdG8gZmluZCBMVmlldy5cbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbbm9kZUluZGV4XTtcbiAgY29uc3QgbFZpZXcgPSBpc0xWaWV3KHNsb3RWYWx1ZSkgPyBzbG90VmFsdWUgOiBzbG90VmFsdWVbSE9TVF07XG4gIHJldHVybiBsVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudERlZjxUPihkZWY6IERpcmVjdGl2ZURlZjxUPik6IGRlZiBpcyBDb21wb25lbnREZWY8VD4ge1xuICByZXR1cm4gKGRlZiBhcyBDb21wb25lbnREZWY8VD4pLnRlbXBsYXRlICE9PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNSb290Vmlldyh0YXJnZXQ6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodGFyZ2V0W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSAhPT0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXd8TENvbnRleHR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRhcmdldCwgJ1RhcmdldCBleHBlY3RlZCcpO1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZExWaWV3KHRhcmdldDogYW55KTogTFZpZXd8bnVsbCB7XG4gIGNvbnN0IHZhbHVlID0gcmVhZFBhdGNoZWREYXRhKHRhcmdldCk7XG4gIGlmICh2YWx1ZSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogKHZhbHVlIGFzIExDb250ZXh0KS5sVmlldztcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCB0byB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmVlLlxuICpcbiAqIE5vdGU6IFRoaXMgZGV0ZXJtaW5lcyB3aGV0aGVyIGEgdmlldyBzaG91bGQgYmUgY2hlY2tlZCwgbm90IHdoZXRoZXIgaXQncyBpbnNlcnRlZFxuICogaW50byBhIGNvbnRhaW5lci4gRm9yIHRoYXQsIHlvdSdsbCB3YW50IGB2aWV3QXR0YWNoZWRUb0NvbnRhaW5lcmAgYmVsb3cuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqIFJldHVybnMgYSBib29sZWFuIGZvciB3aGV0aGVyIHRoZSB2aWV3IGlzIGF0dGFjaGVkIHRvIGEgY29udGFpbmVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZFRvQ29udGFpbmVyKHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0xDb250YWluZXIodmlld1tQQVJFTlRdKTtcbn1cbiJdfQ==