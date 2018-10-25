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
    return /** @type {?} */ (getRootView(viewOrComponent)[CONTEXT]);
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
    return (/** @type {?} */ ((parentLocation))) >> 15 /* ViewOffsetShift */;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUV2RSxPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2RCxPQUFPLEVBQUMsWUFBWSxFQUFhLE1BQU0sd0JBQXdCLENBQUM7QUFDaEUsT0FBTyxFQUFXLHFCQUFxQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFckUsT0FBTyxFQUFDLGtCQUFrQixFQUEwRCxNQUFNLHVCQUF1QixDQUFDO0FBSWxILE9BQU8sRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUF5QixNQUFNLEVBQXNCLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7O0FBUzdKLE1BQU0sVUFBVSxXQUFXLENBQUMsQ0FBTSxFQUFFLENBQU0sRUFBRSxrQkFBMkI7SUFDckUsSUFBSSxTQUFTLElBQUksa0JBQWtCLEVBQUU7UUFDbkMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDNUI7OztJQUdELE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDekM7Ozs7O0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFVO0lBQ2xDLElBQUksT0FBTyxLQUFLLElBQUksVUFBVTtRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7SUFDM0QsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDM0Ms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O1FBQ3BDLE9BQU8sV0FBVyxDQUFDLE1BQU0sSUFBSSxJQUFJLElBQUksYUFBYSxJQUFJLFdBQVcsQ0FBQyxhQUFhLEVBQUU7WUFDL0UsV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7U0FDbEM7UUFDRCxPQUFPLFdBQVcsQ0FBQztLQUNwQjs7SUFFRCxJQUFJLFVBQVUsR0FBRywyQkFBMkIsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7SUFDdkQsSUFBSSxVQUFVLEdBQUcsU0FBUyxDQUFDOztJQUMzQixJQUFJLFdBQVcscUJBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBaUIsRUFBQztJQUN2RCxPQUFPLFVBQVUsR0FBRyxDQUFDLEVBQUU7UUFDckIsVUFBVSxzQkFBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1FBQzVDLFdBQVcscUJBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBaUIsQ0FBQSxDQUFDO1FBQ3BELFVBQVUsRUFBRSxDQUFDO0tBQ2Q7SUFDRCxPQUFPLFdBQVcsQ0FBQztDQUNwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZXZNb2RlRXF1YWx9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dCwgTU9OS0VZX1BBVENIX0tFWV9OQU1FfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05PX1BBUkVOVF9JTkpFQ1RPUiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Q09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhPU1RfTk9ERSwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBQQVJFTlQsIFJvb3RDb250ZXh0LCBURGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuXG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIHRoZSB2YWx1ZXMgYXJlIGRpZmZlcmVudCBmcm9tIGEgY2hhbmdlIGRldGVjdGlvbiBzdGFuZCBwb2ludC5cbiAqXG4gKiBDb25zdHJhaW50cyBhcmUgcmVsYXhlZCBpbiBjaGVja05vQ2hhbmdlcyBtb2RlLiBTZWUgYGRldk1vZGVFcXVhbGAgZm9yIGRldGFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RpZmZlcmVudChhOiBhbnksIGI6IGFueSwgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmIChuZ0Rldk1vZGUgJiYgY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgcmV0dXJuICFkZXZNb2RlRXF1YWwoYSwgYik7XG4gIH1cbiAgLy8gTmFOIGlzIHRoZSBvbmx5IHZhbHVlIHRoYXQgaXMgbm90IGVxdWFsIHRvIGl0c2VsZiBzbyB0aGUgZmlyc3RcbiAgLy8gdGVzdCBjaGVja3MgaWYgYm90aCBhIGFuZCBiIGFyZSBub3QgTmFOXG4gIHJldHVybiAhKGEgIT09IGEgJiYgYiAhPT0gYikgJiYgYSAhPT0gYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWUubmFtZSB8fCB2YWx1ZTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykgcmV0dXJuIHZhbHVlO1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuICcnO1xuICByZXR1cm4gJycgKyB2YWx1ZTtcbn1cblxuLyoqXG4gKiBGbGF0dGVucyBhbiBhcnJheSBpbiBub24tcmVjdXJzaXZlIHdheS4gSW5wdXQgYXJyYXlzIGFyZSBub3QgbW9kaWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuKGxpc3Q6IGFueVtdKTogYW55W10ge1xuICBjb25zdCByZXN1bHQ6IGFueVtdID0gW107XG4gIGxldCBpID0gMDtcblxuICB3aGlsZSAoaSA8IGxpc3QubGVuZ3RoKSB7XG4gICAgY29uc3QgaXRlbSA9IGxpc3RbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgIGlmIChpdGVtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGlzdCA9IGl0ZW0uY29uY2F0KGxpc3Quc2xpY2UoaSArIDEpKTtcbiAgICAgICAgaSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGFueSBgTFZpZXdEYXRhYCBvciBgVERhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbnRlcm5hbDxUPihpbmRleDogbnVtYmVyLCBhcnI6IExWaWV3RGF0YSB8IFREYXRhKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4ICsgSEVBREVSX09GRlNFVCwgYXJyKTtcbiAgcmV0dXJuIGFycltpbmRleCArIEhFQURFUl9PRkZTRVRdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbChpbmRleDogbnVtYmVyLCBhcnI6IGFueVtdKSB7XG4gIGFzc2VydExlc3NUaGFuKGluZGV4LCBhcnIgPyBhcnIubGVuZ3RoIDogMCwgJ2luZGV4IGV4cGVjdGVkIHRvIGJlIGEgdmFsaWQgZGF0YSBpbmRleCcpO1xufVxuXG4vKipcbiAqIFRha2VzIHRoZSB2YWx1ZSBvZiBhIHNsb3QgaW4gYExWaWV3RGF0YWAgYW5kIHJldHVybnMgdGhlIGVsZW1lbnQgbm9kZS5cbiAqXG4gKiBOb3JtYWxseSwgZWxlbWVudCBub2RlcyBhcmUgc3RvcmVkIGZsYXQsIGJ1dCBpZiB0aGUgbm9kZSBoYXMgc3R5bGVzL2NsYXNzZXMgb24gaXQsXG4gKiBpdCBtaWdodCBiZSB3cmFwcGVkIGluIGEgc3R5bGluZyBjb250ZXh0LiBPciBpZiB0aGF0IG5vZGUgaGFzIGEgZGlyZWN0aXZlIHRoYXQgaW5qZWN0c1xuICogVmlld0NvbnRhaW5lclJlZiwgaXQgbWF5IGJlIHdyYXBwZWQgaW4gYW4gTENvbnRhaW5lci4gT3IgaWYgdGhhdCBub2RlIGlzIGEgY29tcG9uZW50LFxuICogaXQgd2lsbCBiZSB3cmFwcGVkIGluIExWaWV3RGF0YS4gSXQgY291bGQgZXZlbiBoYXZlIGFsbCB0aHJlZSwgc28gd2Uga2VlcCBsb29waW5nXG4gKiB1bnRpbCB3ZSBmaW5kIHNvbWV0aGluZyB0aGF0IGlzbid0IGFuIGFycmF5LlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgaW5pdGlhbCB2YWx1ZSBpbiBgTFZpZXdEYXRhYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZTogUkVsZW1lbnQgfCBTdHlsaW5nQ29udGV4dCB8IExDb250YWluZXIgfCBMVmlld0RhdGEpOlxuICAgIFJFbGVtZW50IHtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdmFsdWUgPSB2YWx1ZVtIT1NUXSBhcyBhbnk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbiBlbGVtZW50IHZhbHVlIGZyb20gdGhlIHByb3ZpZGVkIGB2aWV3RGF0YWAsIGJ5IHVud3JhcHBpbmdcbiAqIGZyb20gYW55IGNvbnRhaW5lcnMsIGNvbXBvbmVudCB2aWV3cywgb3Igc3R5bGUgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVCeUluZGV4KGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhKTogUkVsZW1lbnQge1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZShhcnJbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYXRpdmVCeVROb2RlKHROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSk6IFJFbGVtZW50fFJUZXh0fFJDb21tZW50IHtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUoaG9zdFZpZXdbdE5vZGUuaW5kZXhdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFROb2RlKGluZGV4OiBudW1iZXIsIHZpZXc6IExWaWV3RGF0YSk6IFROb2RlIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudFZpZXdCeUluZGV4KG5vZGVJbmRleDogbnVtYmVyLCBob3N0VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhIHtcbiAgLy8gQ291bGQgYmUgYW4gTFZpZXdEYXRhIG9yIGFuIExDb250YWluZXIuIElmIExDb250YWluZXIsIHVud3JhcCB0byBmaW5kIExWaWV3RGF0YS5cbiAgY29uc3Qgc2xvdFZhbHVlID0gaG9zdFZpZXdbbm9kZUluZGV4XTtcbiAgcmV0dXJuIHNsb3RWYWx1ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCA/IHNsb3RWYWx1ZSA6IHNsb3RWYWx1ZVtIT1NUXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudERlZjxUPihkZWY6IERpcmVjdGl2ZURlZjxUPik6IGRlZiBpcyBDb21wb25lbnREZWY8VD4ge1xuICByZXR1cm4gKGRlZiBhcyBDb21wb25lbnREZWY8VD4pLnRlbXBsYXRlICE9PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMQ29udGFpbmVyKHZhbHVlOiBSRWxlbWVudCB8IFJDb21tZW50IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIC8vIFN0eWxpbmcgY29udGV4dHMgYXJlIGFsc28gYXJyYXlzLCBidXQgdGhlaXIgZmlyc3QgaW5kZXggY29udGFpbnMgYW4gZWxlbWVudCBub2RlXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB0eXBlb2YgdmFsdWVbQUNUSVZFX0lOREVYXSA9PT0gJ251bWJlcic7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgdmlldyBmcm9tIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld0RhdGFgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdEYXRhYC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KHRhcmdldDogTFZpZXdEYXRhIHwge30pOiBMVmlld0RhdGEge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0YXJnZXQsICdjb21wb25lbnQnKTtcbiAgbGV0IGxWaWV3RGF0YSA9IEFycmF5LmlzQXJyYXkodGFyZ2V0KSA/ICh0YXJnZXQgYXMgTFZpZXdEYXRhKSA6IHJlYWRQYXRjaGVkTFZpZXdEYXRhKHRhcmdldCkgITtcbiAgd2hpbGUgKGxWaWV3RGF0YSAmJiAhKGxWaWV3RGF0YVtGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlld0RhdGEgPSBsVmlld0RhdGFbUEFSRU5UXSAhO1xuICB9XG4gIHJldHVybiBsVmlld0RhdGE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29udGV4dCh2aWV3T3JDb21wb25lbnQ6IExWaWV3RGF0YSB8IHt9KTogUm9vdENvbnRleHQge1xuICByZXR1cm4gZ2V0Um9vdFZpZXcodmlld09yQ29tcG9uZW50KVtDT05URVhUXSBhcyBSb290Q29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBtb25rZXktcGF0Y2ggdmFsdWUgZGF0YSBwcmVzZW50IG9uIHRoZSB0YXJnZXQgKHdoaWNoIGNvdWxkIGJlXG4gKiBhIGNvbXBvbmVudCwgZGlyZWN0aXZlIG9yIGEgRE9NIG5vZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFBhdGNoZWREYXRhKHRhcmdldDogYW55KTogTFZpZXdEYXRhfExDb250ZXh0fG51bGwge1xuICByZXR1cm4gdGFyZ2V0W01PTktFWV9QQVRDSF9LRVlfTkFNRV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZExWaWV3RGF0YSh0YXJnZXQ6IGFueSk6IExWaWV3RGF0YXxudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiAodmFsdWUgYXMgTENvbnRleHQpLmxWaWV3RGF0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHBhcmVudExvY2F0aW9uICE9PSBOT19QQVJFTlRfSU5KRUNUT1I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24pOiBudW1iZXIge1xuICByZXR1cm4gKHBhcmVudExvY2F0aW9uIGFzIGFueSBhcyBudW1iZXIpICYgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclZpZXdPZmZzZXQocGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbik6IG51bWJlciB7XG4gIHJldHVybiAocGFyZW50TG9jYXRpb24gYXMgYW55IGFzIG51bWJlcikgPj4gUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0O1xufVxuXG4vKipcbiAqIFVud3JhcHMgYSBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24gbnVtYmVyIHRvIGZpbmQgdGhlIHZpZXcgb2Zmc2V0IGZyb20gdGhlIGN1cnJlbnQgaW5qZWN0b3IsXG4gKiB0aGVuIHdhbGtzIHVwIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgdW50aWwgdGhlIHZpZXcgaXMgZm91bmQgdGhhdCBjb250YWlucyB0aGUgcGFyZW50XG4gKiBpbmplY3Rvci5cbiAqXG4gKiBAcGFyYW0gbG9jYXRpb24gVGhlIGxvY2F0aW9uIG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdoaWNoIGNvbnRhaW5zIHRoZSB2aWV3IG9mZnNldFxuICogQHBhcmFtIHN0YXJ0VmlldyBUaGUgTFZpZXdEYXRhIGluc3RhbmNlIGZyb20gd2hpY2ggdG8gc3RhcnQgd2Fsa2luZyB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgTFZpZXdEYXRhIGluc3RhbmNlIHRoYXQgY29udGFpbnMgdGhlIHBhcmVudCBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KFxuICAgIGxvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIHN0YXJ0VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhIHtcbiAgbGV0IHZpZXdPZmZzZXQgPSBnZXRQYXJlbnRJbmplY3RvclZpZXdPZmZzZXQobG9jYXRpb24pO1xuICBsZXQgcGFyZW50VmlldyA9IHN0YXJ0VmlldztcbiAgLy8gRm9yIG1vc3QgY2FzZXMsIHRoZSBwYXJlbnQgaW5qZWN0b3IgY2FuIGJlIGZvdW5kIG9uIHRoZSBob3N0IG5vZGUgKGUuZy4gZm9yIGNvbXBvbmVudFxuICAvLyBvciBjb250YWluZXIpLCBidXQgd2UgbXVzdCBrZWVwIHRoZSBsb29wIGhlcmUgdG8gc3VwcG9ydCB0aGUgcmFyZXIgY2FzZSBvZiBkZWVwbHkgbmVzdGVkXG4gIC8vIDxuZy10ZW1wbGF0ZT4gdGFncyBvciBpbmxpbmUgdmlld3MsIHdoZXJlIHRoZSBwYXJlbnQgaW5qZWN0b3IgbWlnaHQgbGl2ZSBtYW55IHZpZXdzXG4gIC8vIGFib3ZlIHRoZSBjaGlsZCBpbmplY3Rvci5cbiAgd2hpbGUgKHZpZXdPZmZzZXQgPiAwKSB7XG4gICAgcGFyZW50VmlldyA9IHBhcmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICB2aWV3T2Zmc2V0LS07XG4gIH1cbiAgcmV0dXJuIHBhcmVudFZpZXc7XG59XG5cbi8qKlxuICogVW53cmFwcyBhIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbiBudW1iZXIgdG8gZmluZCB0aGUgdmlldyBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBpbmplY3RvcixcbiAqIHRoZW4gd2Fsa3MgdXAgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSB1bnRpbCB0aGUgVE5vZGUgb2YgdGhlIHBhcmVudCBpbmplY3RvciBpcyBmb3VuZC5cbiAqXG4gKiBAcGFyYW0gbG9jYXRpb24gVGhlIGxvY2F0aW9uIG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdoaWNoIGNvbnRhaW5zIHRoZSB2aWV3IG9mZnNldFxuICogQHBhcmFtIHN0YXJ0VmlldyBUaGUgTFZpZXdEYXRhIGluc3RhbmNlIGZyb20gd2hpY2ggdG8gc3RhcnQgd2Fsa2luZyB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcGFyYW0gc3RhcnRUTm9kZSBUaGUgVE5vZGUgaW5zdGFuY2Ugb2YgdGhlIHN0YXJ0aW5nIGVsZW1lbnRcbiAqIEByZXR1cm5zIFRoZSBUTm9kZSBvZiB0aGUgcGFyZW50IGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclROb2RlKFxuICAgIGxvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIHN0YXJ0VmlldzogTFZpZXdEYXRhLCBzdGFydFROb2RlOiBUTm9kZSk6IFRFbGVtZW50Tm9kZXxcbiAgICBUQ29udGFpbmVyTm9kZXxudWxsIHtcbiAgaWYgKHN0YXJ0VE5vZGUucGFyZW50ICYmIHN0YXJ0VE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgLy8gdmlldyBvZmZzZXQgaXMgMFxuICAgIGNvbnN0IGluamVjdG9ySW5kZXggPSBzdGFydFROb2RlLnBhcmVudC5pbmplY3RvckluZGV4O1xuICAgIGxldCBwYXJlbnRUTm9kZSA9IHN0YXJ0VE5vZGUucGFyZW50O1xuICAgIHdoaWxlIChwYXJlbnRUTm9kZS5wYXJlbnQgIT0gbnVsbCAmJiBpbmplY3RvckluZGV4ID09IHBhcmVudFROb2RlLmluamVjdG9ySW5kZXgpIHtcbiAgICAgIHBhcmVudFROb2RlID0gcGFyZW50VE5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50VE5vZGU7XG4gIH1cblxuICBsZXQgdmlld09mZnNldCA9IGdldFBhcmVudEluamVjdG9yVmlld09mZnNldChsb2NhdGlvbik7XG4gIGxldCBwYXJlbnRWaWV3ID0gc3RhcnRWaWV3O1xuICBsZXQgcGFyZW50VE5vZGUgPSBzdGFydFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gIHdoaWxlICh2aWV3T2Zmc2V0ID4gMCkge1xuICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgcGFyZW50VE5vZGUgPSBwYXJlbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgIHZpZXdPZmZzZXQtLTtcbiAgfVxuICByZXR1cm4gcGFyZW50VE5vZGU7XG59XG4iXX0=