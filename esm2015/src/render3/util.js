/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { devModeEqual } from '../change_detection/change_detection_util';
import { global } from '../util';
import { assertDefined, assertLessThan } from './assert';
import { ACTIVE_INDEX } from './interfaces/container';
import { MONKEY_PATCH_KEY_NAME } from './interfaces/context';
import { NO_PARENT_INJECTOR } from './interfaces/injector';
import { CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, PARENT, TVIEW } from './interfaces/view';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 * @param {?} a
 * @param {?} b
 * @param {?} checkNoChangesMode
 * @return {?}
 */
export function isDifferent(a, b, checkNoChangesMode) {
    if (ngDevMode && checkNoChangesMode) {
        return !devModeEqual(a, b);
    }
    // NaN is the only value that is not equal to itself so the first
    // test checks if both a and b are not NaN
    return !(a !== a && b !== b) && a !== b;
}
/**
 * @param {?} value
 * @return {?}
 */
export function stringify(value) {
    if (typeof value == 'function')
        return value.name || value;
    if (typeof value == 'string')
        return value;
    if (value == null)
        return '';
    return '' + value;
}
/**
 * Flattens an array in non-recursive way. Input arrays are not modified.
 * @param {?} list
 * @return {?}
 */
export function flatten(list) {
    /** @type {?} */
    const result = [];
    /** @type {?} */
    let i = 0;
    while (i < list.length) {
        /** @type {?} */
        const item = list[i];
        if (Array.isArray(item)) {
            if (item.length > 0) {
                list = item.concat(list.slice(i + 1));
                i = 0;
            }
            else {
                i++;
            }
        }
        else {
            result.push(item);
            i++;
        }
    }
    return result;
}
/**
 * Retrieves a value from any `LViewData` or `TData`.
 * @template T
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function loadInternal(index, arr) {
    ngDevMode && assertDataInRangeInternal(index + HEADER_OFFSET, arr);
    return arr[index + HEADER_OFFSET];
}
/**
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function assertDataInRangeInternal(index, arr) {
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
/**
 * Takes the value of a slot in `LViewData` and returns the element node.
 *
 * Normally, element nodes are stored flat, but if the node has styles/classes on it,
 * it might be wrapped in a styling context. Or if that node has a directive that injects
 * ViewContainerRef, it may be wrapped in an LContainer. Or if that node is a component,
 * it will be wrapped in LViewData. It could even have all three, so we keep looping
 * until we find something that isn't an array.
 *
 * @param {?} value The initial value in `LViewData`
 * @return {?}
 */
export function readElementValue(value) {
    while (Array.isArray(value)) {
        value = /** @type {?} */ (value[HOST]);
    }
    return value;
}
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function getNativeByIndex(index, arr) {
    return readElementValue(arr[index + HEADER_OFFSET]);
}
/**
 * @param {?} tNode
 * @param {?} hostView
 * @return {?}
 */
export function getNativeByTNode(tNode, hostView) {
    return readElementValue(hostView[tNode.index]);
}
/**
 * @param {?} index
 * @param {?} view
 * @return {?}
 */
export function getTNode(index, view) {
    return /** @type {?} */ (view[TVIEW].data[index + HEADER_OFFSET]);
}
/**
 * @param {?} nodeIndex
 * @param {?} hostView
 * @return {?}
 */
export function getComponentViewByIndex(nodeIndex, hostView) {
    /** @type {?} */
    const slotValue = hostView[nodeIndex];
    return slotValue.length >= HEADER_OFFSET ? slotValue : slotValue[HOST];
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isContentQueryHost(tNode) {
    return (tNode.flags & 16384 /* hasContentQuery */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}
/**
 * @template T
 * @param {?} def
 * @return {?}
 */
export function isComponentDef(def) {
    return (/** @type {?} */ (def)).template !== null;
}
/**
 * @param {?} value
 * @return {?}
 */
export function isLContainer(value) {
    // Styling contexts are also arrays, but their first index contains an element node
    return Array.isArray(value) && typeof value[ACTIVE_INDEX] === 'number';
}
/**
 * @param {?} target
 * @return {?}
 */
export function isRootView(target) {
    return (target[FLAGS] & 64 /* IsRoot */) !== 0;
}
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param {?} target
 * @return {?}
 */
export function getRootView(target) {
    ngDevMode && assertDefined(target, 'component');
    /** @type {?} */
    let lViewData = Array.isArray(target) ? (/** @type {?} */ (target)) : /** @type {?} */ ((readPatchedLViewData(target)));
    while (lViewData && !(lViewData[FLAGS] & 64 /* IsRoot */)) {
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
    }
    return lViewData;
}
/**
 * @param {?} viewOrComponent
 * @return {?}
 */
export function getRootContext(viewOrComponent) {
    /** @type {?} */
    const rootView = getRootView(viewOrComponent);
    ngDevMode &&
        assertDefined(rootView[CONTEXT], 'RootView has no context. Perhaps it is disconnected?');
    return /** @type {?} */ (rootView[CONTEXT]);
}
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 * @param {?} target
 * @return {?}
 */
export function readPatchedData(target) {
    return target[MONKEY_PATCH_KEY_NAME];
}
/**
 * @param {?} target
 * @return {?}
 */
export function readPatchedLViewData(target) {
    /** @type {?} */
    const value = readPatchedData(target);
    if (value) {
        return Array.isArray(value) ? value : (/** @type {?} */ (value)).lViewData;
    }
    return null;
}
/**
 * @param {?} parentLocation
 * @return {?}
 */
export function hasParentInjector(parentLocation) {
    return parentLocation !== NO_PARENT_INJECTOR;
}
/**
 * @param {?} parentLocation
 * @return {?}
 */
export function getParentInjectorIndex(parentLocation) {
    return (/** @type {?} */ ((parentLocation))) & 32767 /* InjectorIndexMask */;
}
/**
 * @param {?} parentLocation
 * @return {?}
 */
export function getParentInjectorViewOffset(parentLocation) {
    return (/** @type {?} */ ((parentLocation))) >> 16 /* ViewOffsetShift */;
}
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the view is found that contains the parent
 * injector.
 *
 * @param {?} location The location of the parent injector, which contains the view offset
 * @param {?} startView The LViewData instance from which to start walking up the view tree
 * @return {?} The LViewData instance that contains the parent injector
 */
export function getParentInjectorView(location, startView) {
    /** @type {?} */
    let viewOffset = getParentInjectorViewOffset(location);
    /** @type {?} */
    let parentView = startView;
    // For most cases, the parent injector can be found on the host node (e.g. for component
    // or container), but we must keep the loop here to support the rarer case of deeply nested
    // <ng-template> tags or inline views, where the parent injector might live many views
    // above the child injector.
    while (viewOffset > 0) {
        parentView = /** @type {?} */ ((parentView[DECLARATION_VIEW]));
        viewOffset--;
    }
    return parentView;
}
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the TNode of the parent injector is found.
 *
 * @param {?} location The location of the parent injector, which contains the view offset
 * @param {?} startView The LViewData instance from which to start walking up the view tree
 * @param {?} startTNode The TNode instance of the starting element
 * @return {?} The TNode of the parent injector
 */
export function getParentInjectorTNode(location, startView, startTNode) {
    if (startTNode.parent && startTNode.parent.injectorIndex !== -1) {
        /** @type {?} */
        const injectorIndex = startTNode.parent.injectorIndex;
        /** @type {?} */
        let parentTNode = startTNode.parent;
        while (parentTNode.parent != null && injectorIndex == parentTNode.injectorIndex) {
            parentTNode = parentTNode.parent;
        }
        return parentTNode;
    }
    /** @type {?} */
    let viewOffset = getParentInjectorViewOffset(location);
    /** @type {?} */
    let parentView = startView;
    /** @type {?} */
    let parentTNode = /** @type {?} */ (startView[HOST_NODE]);
    while (viewOffset > 0) {
        parentView = /** @type {?} */ ((parentView[DECLARATION_VIEW]));
        parentTNode = /** @type {?} */ (parentView[HOST_NODE]);
        viewOffset--;
    }
    return parentTNode;
}
/** @type {?} */
export const defaultScheduler = (typeof requestAnimationFrame !== 'undefined' && requestAnimationFrame || // browser only
    setTimeout // everything else
).bind(global);
/**
 * Equivalent to ES6 spread, add each item to an array.
 *
 * @param {?} items The items to add
 * @param {?} arr The array to which you want to add the items
 * @return {?}
 */
export function addAllToArray(items, arr) {
    for (let i = 0; i < items.length; i++) {
        arr.push(items[i]);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUN2RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRS9CLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxZQUFZLEVBQWEsTUFBTSx3QkFBd0IsQ0FBQztBQUNoRSxPQUFPLEVBQVcscUJBQXFCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVyRSxPQUFPLEVBQUMsa0JBQWtCLEVBQTBELE1BQU0sdUJBQXVCLENBQUM7QUFJbEgsT0FBTyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQXlCLE1BQU0sRUFBc0IsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7QUFTN0osTUFBTSxVQUFVLFdBQVcsQ0FBQyxDQUFNLEVBQUUsQ0FBTSxFQUFFLGtCQUEyQjtJQUNyRSxJQUFJLFNBQVMsSUFBSSxrQkFBa0IsRUFBRTtRQUNuQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM1Qjs7O0lBR0QsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUN6Qzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLEtBQVU7SUFDbEMsSUFBSSxPQUFPLEtBQUssSUFBSSxVQUFVO1FBQUUsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztJQUMzRCxJQUFJLE9BQU8s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QyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDckMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwQjtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Rldk1vZGVFcXVhbH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250ZXh0LCBNT05LRVlfUEFUQ0hfS0VZX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tk9fUEFSRU5UX0lOSkVDVE9SLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSE9TVF9OT0RFLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFREYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHZhbHVlcyBhcmUgZGlmZmVyZW50IGZyb20gYSBjaGFuZ2UgZGV0ZWN0aW9uIHN0YW5kIHBvaW50LlxuICpcbiAqIENvbnN0cmFpbnRzIGFyZSByZWxheGVkIGluIGNoZWNrTm9DaGFuZ2VzIG1vZGUuIFNlZSBgZGV2TW9kZUVxdWFsYCBmb3IgZGV0YWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGlmZmVyZW50KGE6IGFueSwgYjogYW55LCBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKG5nRGV2TW9kZSAmJiBjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICByZXR1cm4gIWRldk1vZGVFcXVhbChhLCBiKTtcbiAgfVxuICAvLyBOYU4gaXMgdGhlIG9ubHkgdmFsdWUgdGhhdCBpcyBub3QgZXF1YWwgdG8gaXRzZWxmIHNvIHRoZSBmaXJzdFxuICAvLyB0ZXN0IGNoZWNrcyBpZiBib3RoIGEgYW5kIGIgYXJlIG5vdCBOYU5cbiAgcmV0dXJuICEoYSAhPT0gYSAmJiBiICE9PSBiKSAmJiBhICE9PSBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZS5uYW1lIHx8IHZhbHVlO1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gJyc7XG4gIHJldHVybiAnJyArIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFuIGFycmF5IGluIG5vbi1yZWN1cnNpdmUgd2F5LiBJbnB1dCBhcnJheXMgYXJlIG5vdCBtb2RpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdDogYW55W10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgbGlzdC5sZW5ndGgpIHtcbiAgICBjb25zdCBpdGVtID0gbGlzdFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICBsaXN0ID0gaXRlbS5jb25jYXQobGlzdC5zbGljZShpICsgMSkpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld0RhdGFgIG9yIGBURGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEludGVybmFsPFQ+KGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhIHwgVERhdGEpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBhcnIpO1xuICByZXR1cm4gYXJyW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogYW55W10pIHtcbiAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIGFyciA/IGFyci5sZW5ndGggOiAwLCAnaW5kZXggZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBkYXRhIGluZGV4Jyk7XG59XG5cbi8qKlxuICogVGFrZXMgdGhlIHZhbHVlIG9mIGEgc2xvdCBpbiBgTFZpZXdEYXRhYCBhbmQgcmV0dXJucyB0aGUgZWxlbWVudCBub2RlLlxuICpcbiAqIE5vcm1hbGx5LCBlbGVtZW50IG5vZGVzIGFyZSBzdG9yZWQgZmxhdCwgYnV0IGlmIHRoZSBub2RlIGhhcyBzdHlsZXMvY2xhc3NlcyBvbiBpdCxcbiAqIGl0IG1pZ2h0IGJlIHdyYXBwZWQgaW4gYSBzdHlsaW5nIGNvbnRleHQuIE9yIGlmIHRoYXQgbm9kZSBoYXMgYSBkaXJlY3RpdmUgdGhhdCBpbmplY3RzXG4gKiBWaWV3Q29udGFpbmVyUmVmLCBpdCBtYXkgYmUgd3JhcHBlZCBpbiBhbiBMQ29udGFpbmVyLiBPciBpZiB0aGF0IG5vZGUgaXMgYSBjb21wb25lbnQsXG4gKiBpdCB3aWxsIGJlIHdyYXBwZWQgaW4gTFZpZXdEYXRhLiBJdCBjb3VsZCBldmVuIGhhdmUgYWxsIHRocmVlLCBzbyB3ZSBrZWVwIGxvb3BpbmdcbiAqIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHRoYXQgaXNuJ3QgYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBpbml0aWFsIHZhbHVlIGluIGBMVmlld0RhdGFgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkRWxlbWVudFZhbHVlKHZhbHVlOiBSRWxlbWVudCB8IFN0eWxpbmdDb250ZXh0IHwgTENvbnRhaW5lciB8IExWaWV3RGF0YSk6XG4gICAgUkVsZW1lbnQge1xuICB3aGlsZSAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICB2YWx1ZSA9IHZhbHVlW0hPU1RdIGFzIGFueTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFuIGVsZW1lbnQgdmFsdWUgZnJvbSB0aGUgcHJvdmlkZWQgYHZpZXdEYXRhYCwgYnkgdW53cmFwcGluZ1xuICogZnJvbSBhbnkgY29udGFpbmVycywgY29tcG9uZW50IHZpZXdzLCBvciBzdHlsZSBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEpOiBSRWxlbWVudCB7XG4gIHJldHVybiByZWFkRWxlbWVudFZhbHVlKGFycltpbmRleCArIEhFQURFUl9PRkZTRVRdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogUkVsZW1lbnR8UlRleHR8UkNvbW1lbnQge1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZShob3N0Vmlld1t0Tm9kZS5pbmRleF0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VE5vZGUoaW5kZXg6IG51bWJlciwgdmlldzogTFZpZXdEYXRhKTogVE5vZGUge1xuICByZXR1cm4gdmlld1tUVklFV10uZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgobm9kZUluZGV4OiBudW1iZXIsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICAvLyBDb3VsZCBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lci4gSWYgTENvbnRhaW5lciwgdW53cmFwIHRvIGZpbmQgTFZpZXdEYXRhLlxuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tub2RlSW5kZXhdO1xuICByZXR1cm4gc2xvdFZhbHVlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUID8gc2xvdFZhbHVlIDogc2xvdFZhbHVlW0hPU1RdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZW50UXVlcnlIb3N0KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnkpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogZGVmIGlzIENvbXBvbmVudERlZjxUPiB7XG4gIHJldHVybiAoZGVmIGFzIENvbXBvbmVudERlZjxUPikudGVtcGxhdGUgIT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xDb250YWluZXIodmFsdWU6IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMQ29udGFpbmVyIHwgU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgLy8gU3R5bGluZyBjb250ZXh0cyBhcmUgYWxzbyBhcnJheXMsIGJ1dCB0aGVpciBmaXJzdCBpbmRleCBjb250YWlucyBhbiBlbGVtZW50IG5vZGVcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZVtBQ1RJVkVfSU5ERVhdID09PSAnbnVtYmVyJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUm9vdFZpZXcodGFyZ2V0OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0YXJnZXRbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpICE9PSAwO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdEYXRhYCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3RGF0YWAuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBhbnkgY29tcG9uZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyh0YXJnZXQ6IExWaWV3RGF0YSB8IHt9KTogTFZpZXdEYXRhIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGFyZ2V0LCAnY29tcG9uZW50Jyk7XG4gIGxldCBsVmlld0RhdGEgPSBBcnJheS5pc0FycmF5KHRhcmdldCkgPyAodGFyZ2V0IGFzIExWaWV3RGF0YSkgOiByZWFkUGF0Y2hlZExWaWV3RGF0YSh0YXJnZXQpICE7XG4gIHdoaWxlIChsVmlld0RhdGEgJiYgIShsVmlld0RhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgfVxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQodmlld09yQ29tcG9uZW50OiBMVmlld0RhdGEgfCB7fSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyh2aWV3T3JDb21wb25lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQocm9vdFZpZXdbQ09OVEVYVF0sICdSb290VmlldyBoYXMgbm8gY29udGV4dC4gUGVyaGFwcyBpdCBpcyBkaXNjb25uZWN0ZWQ/Jyk7XG4gIHJldHVybiByb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfExDb250ZXh0fG51bGwge1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZExWaWV3RGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiAodmFsdWUgYXMgTENvbnRleHQpLmxWaWV3RGF0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHBhcmVudExvY2F0aW9uICE9PSBOT19QQVJFTlRfSU5KRUNUT1I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24pOiBudW1iZXIge1xuICByZXR1cm4gKHBhcmVudExvY2F0aW9uIGFzIGFueSBhcyBudW1iZXIpICYgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclZpZXdPZmZzZXQocGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbik6IG51bWJlciB7XG4gIHJldHVybiAocGFyZW50TG9jYXRpb24gYXMgYW55IGFzIG51bWJlcikgPj4gUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0O1xufVxuXG4vKipcbiAqIFVud3JhcHMgYSBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24gbnVtYmVyIHRvIGZpbmQgdGhlIHZpZXcgb2Zmc2V0IGZyb20gdGhlIGN1cnJlbnQgaW5qZWN0b3IsXG4gKiB0aGVuIHdhbGtzIHVwIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgdW50aWwgdGhlIHZpZXcgaXMgZm91bmQgdGhhdCBjb250YWlucyB0aGUgcGFyZW50XG4gKiBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gbG9jYXRpb24gVGhlIGxvY2F0aW9uIG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdoaWNoIGNvbnRhaW5zIHRoZSB2aWV3IG9mZnNldFxuICogQHBhcmFtIHN0YXJ0VmlldyBUaGUgTFZpZXdEYXRhIGluc3RhbmNlIGZyb20gd2hpY2ggdG8gc3RhcnQgd2Fsa2luZyB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgTFZpZXdEYXRhIGluc3RhbmNlIHRoYXQgY29udGFpbnMgdGhlIHBhcmVudCBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KFxuICAgIGxvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIHN0YXJ0VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhIHtcbiAgbGV0IHZpZXdPZmZzZXQgPSBnZXRQYXJlbnRJbmplY3RvclZpZXdPZmZzZXQobG9jYXRpb24pO1xuICBsZXQgcGFyZW50VmlldyA9IHN0YXJ0VmlldztcbiAgLy8gRm9yIG1vc3QgY2FzZXMsIHRoZSBwYXJlbnQgaW5qZWN0b3IgY2FuIGJlIGZvdW5kIG9uIHRoZSBob3N0IG5vZGUgKGUuZy4gZm9yIGNvbXBvbmVudFxuICAvLyBvciBjb250YWluZXIpLCBidXQgd2UgbXVzdCBrZWVwIHRoZSBsb29wIGhlcmUgdG8gc3VwcG9ydCB0aGUgcmFyZXIgY2FzZSBvZiBkZWVwbHkgbmVzdGVkXG4gIC8vIDxuZy10ZW1wbGF0ZT4gdGFncyBvciBpbmxpbmUgdmlld3MsIHdoZXJlIHRoZSBwYXJlbnQgaW5qZWN0b3IgbWlnaHQgbGl2ZSBtYW55IHZpZXdzXG4gIC8vIGFib3ZlIHRoZSBjaGlsZCBpbmplY3Rvci5cbiAgd2hpbGUgKHZpZXdPZmZzZXQgPiAwKSB7XG4gICAgcGFyZW50VmlldyA9IHBhcmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICB2aWV3T2Zmc2V0LS07XG4gIH1cbiAgcmV0dXJuIHBhcmVudFZpZXc7XG59XG5cbi8qKlxuICogVW53cmFwcyBhIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbiBudW1iZXIgdG8gZmluZCB0aGUgdmlldyBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBpbmplY3RvcixcbiAqIHRoZW4gd2Fsa3MgdXAgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSB1bnRpbCB0aGUgVE5vZGUgb2YgdGhlIHBhcmVudCBpbmplY3RvciBpcyBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gbG9jYXRpb24gVGhlIGxvY2F0aW9uIG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdoaWNoIGNvbnRhaW5zIHRoZSB2aWV3IG9mZnNldFxuICogQHBhcmFtIHN0YXJ0VmlldyBUaGUgTFZpZXdEYXRhIGluc3RhbmNlIGZyb20gd2hpY2ggdG8gc3RhcnQgd2Fsa2luZyB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcGFyYW0gc3RhcnRUTm9kZSBUaGUgVE5vZGUgaW5zdGFuY2Ugb2YgdGhlIHN0YXJ0aW5nIGVsZW1lbnRcbiAqIEByZXR1cm5zIFRoZSBUTm9kZSBvZiB0aGUgcGFyZW50IGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclROb2RlKFxuICAgIGxvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIHN0YXJ0VmlldzogTFZpZXdEYXRhLCBzdGFydFROb2RlOiBUTm9kZSk6IFRFbGVtZW50Tm9kZXxcbiAgICBUQ29udGFpbmVyTm9kZXxudWxsIHtcbiAgaWYgKHN0YXJ0VE5vZGUucGFyZW50ICYmIHN0YXJ0VE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgLy8gdmlldyBvZmZzZXQgaXMgMFxuICAgIGNvbnN0IGluamVjdG9ySW5kZXggPSBzdGFydFROb2RlLnBhcmVudC5pbmplY3RvckluZGV4O1xuICAgIGxldCBwYXJlbnRUTm9kZSA9IHN0YXJ0VE5vZGUucGFyZW50O1xuICAgIHdoaWxlIChwYXJlbnRUTm9kZS5wYXJlbnQgIT0gbnVsbCAmJiBpbmplY3RvckluZGV4ID09IHBhcmVudFROb2RlLmluamVjdG9ySW5kZXgpIHtcbiAgICAgIHBhcmVudFROb2RlID0gcGFyZW50VE5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50VE5vZGU7XG4gIH1cblxuICBsZXQgdmlld09mZnNldCA9IGdldFBhcmVudEluamVjdG9yVmlld09mZnNldChsb2NhdGlvbik7XG4gIGxldCBwYXJlbnRWaWV3ID0gc3RhcnRWaWV3O1xuICBsZXQgcGFyZW50VE5vZGUgPSBzdGFydFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gIHdoaWxlICh2aWV3T2Zmc2V0ID4gMCkge1xuICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgcGFyZW50VE5vZGUgPSBwYXJlbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgIHZpZXdPZmZzZXQtLTtcbiAgfVxuICByZXR1cm4gcGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0U2NoZWR1bGVyID1cbiAgICAodHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gJ3VuZGVmaW5lZCcgJiYgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICAvLyBicm93c2VyIG9ubHlcbiAgICAgc2V0VGltZW91dCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgKS5iaW5kKGdsb2JhbCk7XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBFUzYgc3ByZWFkLCBhZGQgZWFjaCBpdGVtIHRvIGFuIGFycmF5LlxuICpcbiAqIEBwYXJhbSBpdGVtcyBUaGUgaXRlbXMgdG8gYWRkXG4gKiBAcGFyYW0gYXJyIFRoZSBhcnJheSB0byB3aGljaCB5b3Ugd2FudCB0byBhZGQgdGhlIGl0ZW1zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRBbGxUb0FycmF5KGl0ZW1zOiBhbnlbXSwgYXJyOiBhbnlbXSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgYXJyLnB1c2goaXRlbXNbaV0pO1xuICB9XG59XG4iXX0=