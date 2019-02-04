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
import { assertDataInRange, assertDefined, assertGreaterThan, assertLessThan } from '../util/assert';
import { global } from '../util/global';
import { LCONTAINER_LENGTH } from './interfaces/container';
import { MONKEY_PATCH_KEY_NAME } from './interfaces/context';
import { NO_PARENT_INJECTOR } from './interfaces/injector';
import { CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, PARENT, TVIEW } from './interfaces/view';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function isDifferent(a, b) {
    // NaN is the only value that is not equal to itself so the first
    // test checks if both a and b are not NaN
    return !(a !== a && b !== b) && a !== b;
}
/**
 * Used for stringify render output in Ivy.
 * @param {?} value
 * @return {?}
 */
export function renderStringify(value) {
    if (typeof value == 'function')
        return value.name || value;
    if (typeof value == 'string')
        return value;
    if (value == null)
        return '';
    if (typeof value == 'object' && typeof value.type == 'function')
        return value.type.name || value.type;
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
 * Takes the value of a slot in `LView` and returns the element node.
 *
 * Normally, element nodes are stored flat, but if the node has styles/classes on it,
 * it might be wrapped in a styling context. Or if that node has a directive that injects
 * ViewContainerRef, it may be wrapped in an LContainer. Or if that node is a component,
 * it will be wrapped in LView. It could even have all three, so we keep looping
 * until we find something that isn't an array.
 *
 * @param {?} value The initial value in `LView`
 * @return {?}
 */
export function readElementValue(value) {
    while (Array.isArray(value)) {
        value = (/** @type {?} */ (value[HOST]));
    }
    return value;
}
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 * @param {?} index
 * @param {?} lView
 * @return {?}
 */
export function getNativeByIndex(index, lView) {
    return readElementValue(lView[index + HEADER_OFFSET]);
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
    ngDevMode && assertGreaterThan(index, -1, 'wrong index for TNode');
    ngDevMode && assertLessThan(index, view[TVIEW].data.length, 'wrong index for TNode');
    return (/** @type {?} */ (view[TVIEW].data[index + HEADER_OFFSET]));
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
    return slotValue.length >= HEADER_OFFSET ? slotValue : slotValue[HOST];
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
 * @param {?} value
 * @return {?}
 */
export function isLContainer(value) {
    // Styling contexts are also arrays, but their first index contains an element node
    return Array.isArray(value) && value.length === LCONTAINER_LENGTH;
}
/**
 * @param {?} target
 * @return {?}
 */
export function isRootView(target) {
    return (target[FLAGS] & 512 /* IsRoot */) !== 0;
}
/**
 * Retrieve the root view from any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param {?} target
 * @return {?}
 */
export function getRootView(target) {
    ngDevMode && assertDefined(target, 'component');
    /** @type {?} */
    let lView = Array.isArray(target) ? ((/** @type {?} */ (target))) : (/** @type {?} */ (readPatchedLView(target)));
    while (lView && !(lView[FLAGS] & 512 /* IsRoot */)) {
        lView = (/** @type {?} */ (lView[PARENT]));
    }
    return lView;
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
    return (/** @type {?} */ (rootView[CONTEXT]));
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
    return ((/** @type {?} */ ((/** @type {?} */ (parentLocation))))) & 32767 /* InjectorIndexMask */;
}
/**
 * @param {?} parentLocation
 * @return {?}
 */
export function getParentInjectorViewOffset(parentLocation) {
    return ((/** @type {?} */ ((/** @type {?} */ (parentLocation))))) >> 16 /* ViewOffsetShift */;
}
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the view is found that contains the parent
 * injector.
 *
 * @param {?} location The location of the parent injector, which contains the view offset
 * @param {?} startView The LView instance from which to start walking up the view tree
 * @return {?} The LView instance that contains the parent injector
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
        parentView = (/** @type {?} */ (parentView[DECLARATION_VIEW]));
        viewOffset--;
    }
    return parentView;
}
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the TNode of the parent injector is found.
 *
 * @param {?} location The location of the parent injector, which contains the view offset
 * @param {?} startView The LView instance from which to start walking up the view tree
 * @param {?} startTNode The TNode instance of the starting element
 * @return {?} The TNode of the parent injector
 */
export function getParentInjectorTNode(location, startView, startTNode) {
    if (startTNode.parent && startTNode.parent.injectorIndex !== -1) {
        // view offset is 0
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
    // view offset is 1
    /** @type {?} */
    let parentView = startView;
    /** @type {?} */
    let parentTNode = (/** @type {?} */ (startView[HOST_NODE]));
    // view offset is superior to 1
    while (viewOffset > 1) {
        parentView = (/** @type {?} */ (parentView[DECLARATION_VIEW]));
        parentTNode = (/** @type {?} */ (parentView[HOST_NODE]));
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
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param {?} lView LView for which we want a host element node
 * @return {?} The host node
 */
export function findComponentView(lView) {
    /** @type {?} */
    let rootTNode = lView[HOST_NODE];
    while (rootTNode && rootTNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lView[DECLARATION_VIEW], 'lView[DECLARATION_VIEW]');
        lView = (/** @type {?} */ (lView[DECLARATION_VIEW]));
        rootTNode = lView[HOST_NODE];
    }
    return lView;
}
/**
 * @param {?} element
 * @return {?}
 */
export function resolveWindow(element) {
    return { name: 'window', target: element.ownerDocument.defaultView };
}
/**
 * @param {?} element
 * @return {?}
 */
export function resolveDocument(element) {
    return { name: 'document', target: element.ownerDocument };
}
/**
 * @param {?} element
 * @return {?}
 */
export function resolveBody(element) {
    return { name: 'body', target: element.ownerDocument.body };
}
/**
 * The special delimiter we use to separate property names, prefixes, and suffixes
 * in property binding metadata. See storeBindingMetadata().
 *
 * We intentionally use the Unicode "REPLACEMENT CHARACTER" (U+FFFD) as a delimiter
 * because it is a very uncommon character that is unlikely to be part of a user's
 * property names or interpolation strings. If it is in fact used in a property
 * binding, DebugElement.properties will not return the correct value for that
 * binding. However, there should be no runtime effect for real applications.
 *
 * This character is typically rendered as a question mark inside of a diamond.
 * See https://en.wikipedia.org/wiki/Specials_(Unicode_block)
 *
 * @type {?}
 */
export const INTERPOLATION_DELIMITER = `�`;
/**
 * Determines whether or not the given string is a property metadata string.
 * See storeBindingMetadata().
 * @param {?} str
 * @return {?}
 */
export function isPropMetadataString(str) {
    return str.indexOf(INTERPOLATION_DELIMITER) >= 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbkcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRDLE9BQU8sRUFBQyxpQkFBaUIsRUFBYSxNQUFNLHdCQUF3QixDQUFDO0FBQ3JFLE9BQU8sRUFBVyxxQkFBcUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRXJFLE9BQU8sRUFBQyxrQkFBa0IsRUFBMEQsTUFBTSx1QkFBdUIsQ0FBQztBQUlsSCxPQUFPLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBcUIsTUFBTSxFQUFzQixLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7Ozs7O0FBUWhLLE1BQU0sVUFBVSxXQUFXLENBQUMsQ0FBTSxFQUFFLENBQU07SUFDeEMsaUVBQWlFO0lBQ2pFLDBDQUEwQztJQUMxQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLENBQUM7Ozs7OztBQUtELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBVTtJQUN4QyxJQUFJLE9BQU8sS0FBSyxJQUFJLFVBQVU7UUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO0lBQzNELElBQUksT0FBTyxLQUFLLElBQUksUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzNDLElBQUksS0FBSyxJQUFJLElBQUk7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUM3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QUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsYUFBYSxFQUFDLENBQUM7QUFDM0QsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQTZDO0lBQ3ZFLE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksRUFBQyxDQUFDO0FBQzVELENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSxPQUFPLHVCQUF1QixHQUFHLEdBQUc7Ozs7Ozs7QUFNMUMsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEdBQVc7SUFDOUMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcblxuaW1wb3J0IHtMQ09OVEFJTkVSX0xFTkdUSCwgTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250ZXh0LCBNT05LRVlfUEFUQ0hfS0VZX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tk9fUEFSRU5UX0lOSkVDVE9SLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIT1NUX05PREUsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFJvb3RDb250ZXh0LCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHZhbHVlcyBhcmUgZGlmZmVyZW50IGZyb20gYSBjaGFuZ2UgZGV0ZWN0aW9uIHN0YW5kIHBvaW50LlxuICpcbiAqIENvbnN0cmFpbnRzIGFyZSByZWxheGVkIGluIGNoZWNrTm9DaGFuZ2VzIG1vZGUuIFNlZSBgZGV2TW9kZUVxdWFsYCBmb3IgZGV0YWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGlmZmVyZW50KGE6IGFueSwgYjogYW55KTogYm9vbGVhbiB7XG4gIC8vIE5hTiBpcyB0aGUgb25seSB2YWx1ZSB0aGF0IGlzIG5vdCBlcXVhbCB0byBpdHNlbGYgc28gdGhlIGZpcnN0XG4gIC8vIHRlc3QgY2hlY2tzIGlmIGJvdGggYSBhbmQgYiBhcmUgbm90IE5hTlxuICByZXR1cm4gIShhICE9PSBhICYmIGIgIT09IGIpICYmIGEgIT09IGI7XG59XG5cbi8qKlxuICogVXNlZCBmb3Igc3RyaW5naWZ5IHJlbmRlciBvdXRwdXQgaW4gSXZ5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RyaW5naWZ5KHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZS5uYW1lIHx8IHZhbHVlO1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gJyc7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlLnR5cGUgPT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gdmFsdWUudHlwZS5uYW1lIHx8IHZhbHVlLnR5cGU7XG4gIHJldHVybiAnJyArIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFuIGFycmF5IGluIG5vbi1yZWN1cnNpdmUgd2F5LiBJbnB1dCBhcnJheXMgYXJlIG5vdCBtb2RpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdDogYW55W10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgbGlzdC5sZW5ndGgpIHtcbiAgICBjb25zdCBpdGVtID0gbGlzdFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICBsaXN0ID0gaXRlbS5jb25jYXQobGlzdC5zbGljZShpICsgMSkpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld2Agb3IgYFREYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW50ZXJuYWw8VD4odmlldzogTFZpZXcgfCBURGF0YSwgaW5kZXg6IG51bWJlcik6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UodmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgcmV0dXJuIHZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXTtcbn1cblxuLyoqXG4gKiBUYWtlcyB0aGUgdmFsdWUgb2YgYSBzbG90IGluIGBMVmlld2AgYW5kIHJldHVybnMgdGhlIGVsZW1lbnQgbm9kZS5cbiAqXG4gKiBOb3JtYWxseSwgZWxlbWVudCBub2RlcyBhcmUgc3RvcmVkIGZsYXQsIGJ1dCBpZiB0aGUgbm9kZSBoYXMgc3R5bGVzL2NsYXNzZXMgb24gaXQsXG4gKiBpdCBtaWdodCBiZSB3cmFwcGVkIGluIGEgc3R5bGluZyBjb250ZXh0LiBPciBpZiB0aGF0IG5vZGUgaGFzIGEgZGlyZWN0aXZlIHRoYXQgaW5qZWN0c1xuICogVmlld0NvbnRhaW5lclJlZiwgaXQgbWF5IGJlIHdyYXBwZWQgaW4gYW4gTENvbnRhaW5lci4gT3IgaWYgdGhhdCBub2RlIGlzIGEgY29tcG9uZW50LFxuICogaXQgd2lsbCBiZSB3cmFwcGVkIGluIExWaWV3LiBJdCBjb3VsZCBldmVuIGhhdmUgYWxsIHRocmVlLCBzbyB3ZSBrZWVwIGxvb3BpbmdcbiAqIHVudGlsIHdlIGZpbmQgc29tZXRoaW5nIHRoYXQgaXNuJ3QgYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBpbml0aWFsIHZhbHVlIGluIGBMVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRFbGVtZW50VmFsdWUodmFsdWU6IFJFbGVtZW50IHwgU3R5bGluZ0NvbnRleHQgfCBMQ29udGFpbmVyIHwgTFZpZXcpOiBSRWxlbWVudCB7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHZhbHVlID0gdmFsdWVbSE9TVF0gYXMgYW55O1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYW4gZWxlbWVudCB2YWx1ZSBmcm9tIHRoZSBwcm92aWRlZCBgdmlld0RhdGFgLCBieSB1bndyYXBwaW5nXG4gKiBmcm9tIGFueSBjb250YWluZXJzLCBjb21wb25lbnQgdmlld3MsIG9yIHN0eWxlIGNvbnRleHRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlQnlJbmRleChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiBSRWxlbWVudCB7XG4gIHJldHVybiByZWFkRWxlbWVudFZhbHVlKGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IFJFbGVtZW50fFJUZXh0fFJDb21tZW50IHtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUoaG9zdFZpZXdbdE5vZGUuaW5kZXhdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFROb2RlKGluZGV4OiBudW1iZXIsIHZpZXc6IExWaWV3KTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnd3JvbmcgaW5kZXggZm9yIFROb2RlJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihpbmRleCwgdmlld1tUVklFV10uZGF0YS5sZW5ndGgsICd3cm9uZyBpbmRleCBmb3IgVE5vZGUnKTtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbXBvbmVudFZpZXdCeUluZGV4KG5vZGVJbmRleDogbnVtYmVyLCBob3N0VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIC8vIENvdWxkIGJlIGFuIExWaWV3IG9yIGFuIExDb250YWluZXIuIElmIExDb250YWluZXIsIHVud3JhcCB0byBmaW5kIExWaWV3LlxuICBjb25zdCBzbG90VmFsdWUgPSBob3N0Vmlld1tub2RlSW5kZXhdO1xuICByZXR1cm4gc2xvdFZhbHVlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUID8gc2xvdFZhbHVlIDogc2xvdFZhbHVlW0hPU1RdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZW50UXVlcnlIb3N0KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnkpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogZGVmIGlzIENvbXBvbmVudERlZjxUPiB7XG4gIHJldHVybiAoZGVmIGFzIENvbXBvbmVudERlZjxUPikudGVtcGxhdGUgIT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xDb250YWluZXIoXG4gICAgdmFsdWU6IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMQ29udGFpbmVyIHwgTFZpZXcgfCBTdHlsaW5nQ29udGV4dCB8IG51bGwpOiBib29sZWFuIHtcbiAgLy8gU3R5bGluZyBjb250ZXh0cyBhcmUgYWxzbyBhcnJheXMsIGJ1dCB0aGVpciBmaXJzdCBpbmRleCBjb250YWlucyBhbiBlbGVtZW50IG5vZGVcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gTENPTlRBSU5FUl9MRU5HVEg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Jvb3RWaWV3KHRhcmdldDogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0YXJnZXRbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpICE9PSAwO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcodGFyZ2V0OiBMVmlldyB8IHt9KTogTFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0YXJnZXQsICdjb21wb25lbnQnKTtcbiAgbGV0IGxWaWV3ID0gQXJyYXkuaXNBcnJheSh0YXJnZXQpID8gKHRhcmdldCBhcyBMVmlldykgOiByZWFkUGF0Y2hlZExWaWV3KHRhcmdldCkgITtcbiAgd2hpbGUgKGxWaWV3ICYmICEobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgbFZpZXcgPSBsVmlld1tQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQodmlld09yQ29tcG9uZW50OiBMVmlldyB8IHt9KTogUm9vdENvbnRleHQge1xuICBjb25zdCByb290VmlldyA9IGdldFJvb3RWaWV3KHZpZXdPckNvbXBvbmVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChyb290Vmlld1tDT05URVhUXSwgJ1Jvb3RWaWV3IGhhcyBubyBjb250ZXh0LiBQZXJoYXBzIGl0IGlzIGRpc2Nvbm5lY3RlZD8nKTtcbiAgcmV0dXJuIHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBkYXRhIHByZXNlbnQgb24gdGhlIHRhcmdldCAod2hpY2ggY291bGQgYmVcbiAqIGEgY29tcG9uZW50LCBkaXJlY3RpdmUgb3IgYSBET00gbm9kZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkUGF0Y2hlZERhdGEodGFyZ2V0OiBhbnkpOiBMVmlld3xMQ29udGV4dHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodGFyZ2V0LCAnVGFyZ2V0IGV4cGVjdGVkJyk7XG4gIHJldHVybiB0YXJnZXRbTU9OS0VZX1BBVENIX0tFWV9OQU1FXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRQYXRjaGVkTFZpZXcodGFyZ2V0OiBhbnkpOiBMVmlld3xudWxsIHtcbiAgY29uc3QgdmFsdWUgPSByZWFkUGF0Y2hlZERhdGEodGFyZ2V0KTtcbiAgaWYgKHZhbHVlKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiAodmFsdWUgYXMgTENvbnRleHQpLmxWaWV3O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbik6IGJvb2xlYW4ge1xuICByZXR1cm4gcGFyZW50TG9jYXRpb24gIT09IE5PX1BBUkVOVF9JTkpFQ1RPUjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbik6IG51bWJlciB7XG4gIHJldHVybiAocGFyZW50TG9jYXRpb24gYXMgYW55IGFzIG51bWJlcikgJiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncy5JbmplY3RvckluZGV4TWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9yVmlld09mZnNldChwYXJlbnRMb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uKTogbnVtYmVyIHtcbiAgcmV0dXJuIChwYXJlbnRMb2NhdGlvbiBhcyBhbnkgYXMgbnVtYmVyKSA+PiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncy5WaWV3T2Zmc2V0U2hpZnQ7XG59XG5cbi8qKlxuICogVW53cmFwcyBhIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbiBudW1iZXIgdG8gZmluZCB0aGUgdmlldyBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBpbmplY3RvcixcbiAqIHRoZW4gd2Fsa3MgdXAgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSB1bnRpbCB0aGUgdmlldyBpcyBmb3VuZCB0aGF0IGNvbnRhaW5zIHRoZSBwYXJlbnRcbiAqIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBsb2NhdGlvbiBUaGUgbG9jYXRpb24gb2YgdGhlIHBhcmVudCBpbmplY3Rvciwgd2hpY2ggY29udGFpbnMgdGhlIHZpZXcgb2Zmc2V0XG4gKiBAcGFyYW0gc3RhcnRWaWV3IFRoZSBMVmlldyBpbnN0YW5jZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHdhbGtpbmcgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIExWaWV3IGluc3RhbmNlIHRoYXQgY29udGFpbnMgdGhlIHBhcmVudCBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KGxvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIHN0YXJ0VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIGxldCB2aWV3T2Zmc2V0ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3T2Zmc2V0KGxvY2F0aW9uKTtcbiAgbGV0IHBhcmVudFZpZXcgPSBzdGFydFZpZXc7XG4gIC8vIEZvciBtb3N0IGNhc2VzLCB0aGUgcGFyZW50IGluamVjdG9yIGNhbiBiZSBmb3VuZCBvbiB0aGUgaG9zdCBub2RlIChlLmcuIGZvciBjb21wb25lbnRcbiAgLy8gb3IgY29udGFpbmVyKSwgYnV0IHdlIG11c3Qga2VlcCB0aGUgbG9vcCBoZXJlIHRvIHN1cHBvcnQgdGhlIHJhcmVyIGNhc2Ugb2YgZGVlcGx5IG5lc3RlZFxuICAvLyA8bmctdGVtcGxhdGU+IHRhZ3Mgb3IgaW5saW5lIHZpZXdzLCB3aGVyZSB0aGUgcGFyZW50IGluamVjdG9yIG1pZ2h0IGxpdmUgbWFueSB2aWV3c1xuICAvLyBhYm92ZSB0aGUgY2hpbGQgaW5qZWN0b3IuXG4gIHdoaWxlICh2aWV3T2Zmc2V0ID4gMCkge1xuICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgdmlld09mZnNldC0tO1xuICB9XG4gIHJldHVybiBwYXJlbnRWaWV3O1xufVxuXG4vKipcbiAqIFVud3JhcHMgYSBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24gbnVtYmVyIHRvIGZpbmQgdGhlIHZpZXcgb2Zmc2V0IGZyb20gdGhlIGN1cnJlbnQgaW5qZWN0b3IsXG4gKiB0aGVuIHdhbGtzIHVwIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgdW50aWwgdGhlIFROb2RlIG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IgaXMgZm91bmQuXG4gKlxuICogQHBhcmFtIGxvY2F0aW9uIFRoZSBsb2NhdGlvbiBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aGljaCBjb250YWlucyB0aGUgdmlldyBvZmZzZXRcbiAqIEBwYXJhbSBzdGFydFZpZXcgVGhlIExWaWV3IGluc3RhbmNlIGZyb20gd2hpY2ggdG8gc3RhcnQgd2Fsa2luZyB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcGFyYW0gc3RhcnRUTm9kZSBUaGUgVE5vZGUgaW5zdGFuY2Ugb2YgdGhlIHN0YXJ0aW5nIGVsZW1lbnRcbiAqIEByZXR1cm5zIFRoZSBUTm9kZSBvZiB0aGUgcGFyZW50IGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclROb2RlKFxuICAgIGxvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIHN0YXJ0VmlldzogTFZpZXcsIHN0YXJ0VE5vZGU6IFROb2RlKTogVEVsZW1lbnROb2RlfFxuICAgIFRDb250YWluZXJOb2RlfG51bGwge1xuICBpZiAoc3RhcnRUTm9kZS5wYXJlbnQgJiYgc3RhcnRUTm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAvLyB2aWV3IG9mZnNldCBpcyAwXG4gICAgY29uc3QgaW5qZWN0b3JJbmRleCA9IHN0YXJ0VE5vZGUucGFyZW50LmluamVjdG9ySW5kZXg7XG4gICAgbGV0IHBhcmVudFROb2RlID0gc3RhcnRUTm9kZS5wYXJlbnQ7XG4gICAgd2hpbGUgKHBhcmVudFROb2RlLnBhcmVudCAhPSBudWxsICYmIGluamVjdG9ySW5kZXggPT0gcGFyZW50VE5vZGUuaW5qZWN0b3JJbmRleCkge1xuICAgICAgcGFyZW50VE5vZGUgPSBwYXJlbnRUTm9kZS5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBwYXJlbnRUTm9kZTtcbiAgfVxuXG4gIGxldCB2aWV3T2Zmc2V0ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3T2Zmc2V0KGxvY2F0aW9uKTtcbiAgLy8gdmlldyBvZmZzZXQgaXMgMVxuICBsZXQgcGFyZW50VmlldyA9IHN0YXJ0VmlldztcbiAgbGV0IHBhcmVudFROb2RlID0gc3RhcnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIHZpZXcgb2Zmc2V0IGlzIHN1cGVyaW9yIHRvIDFcbiAgd2hpbGUgKHZpZXdPZmZzZXQgPiAxKSB7XG4gICAgcGFyZW50VmlldyA9IHBhcmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBwYXJlbnRUTm9kZSA9IHBhcmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gICAgdmlld09mZnNldC0tO1xuICB9XG4gIHJldHVybiBwYXJlbnRUTm9kZTtcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTY2hlZHVsZXIgPVxuICAgICh0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyAmJiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIC8vIGJyb3dzZXIgb25seVxuICAgICBzZXRUaW1lb3V0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICApLmJpbmQoZ2xvYmFsKTtcblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEVTNiBzcHJlYWQsIGFkZCBlYWNoIGl0ZW0gdG8gYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIGl0ZW1zIFRoZSBpdGVtcyB0byBhZGRcbiAqIEBwYXJhbSBhcnIgVGhlIGFycmF5IHRvIHdoaWNoIHlvdSB3YW50IHRvIGFkZCB0aGUgaXRlbXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEFsbFRvQXJyYXkoaXRlbXM6IGFueVtdLCBhcnI6IGFueVtdKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICBhcnIucHVzaChpdGVtc1tpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50VmlldyhsVmlldzogTFZpZXcpOiBMVmlldyB7XG4gIGxldCByb290VE5vZGUgPSBsVmlld1tIT1NUX05PREVdO1xuXG4gIHdoaWxlIChyb290VE5vZGUgJiYgcm9vdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbREVDTEFSQVRJT05fVklFV10sICdsVmlld1tERUNMQVJBVElPTl9WSUVXXScpO1xuICAgIGxWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICByb290VE5vZGUgPSBsVmlld1tIT1NUX05PREVdO1xuICB9XG5cbiAgcmV0dXJuIGxWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVdpbmRvdyhlbGVtZW50OiBSRWxlbWVudCAmIHtvd25lckRvY3VtZW50OiBEb2N1bWVudH0pIHtcbiAgcmV0dXJuIHtuYW1lOiAnd2luZG93JywgdGFyZ2V0OiBlbGVtZW50Lm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXd9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURvY3VtZW50KGVsZW1lbnQ6IFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSkge1xuICByZXR1cm4ge25hbWU6ICdkb2N1bWVudCcsIHRhcmdldDogZWxlbWVudC5vd25lckRvY3VtZW50fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCb2R5KGVsZW1lbnQ6IFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSkge1xuICByZXR1cm4ge25hbWU6ICdib2R5JywgdGFyZ2V0OiBlbGVtZW50Lm93bmVyRG9jdW1lbnQuYm9keX07XG59XG5cbi8qKlxuICogVGhlIHNwZWNpYWwgZGVsaW1pdGVyIHdlIHVzZSB0byBzZXBhcmF0ZSBwcm9wZXJ0eSBuYW1lcywgcHJlZml4ZXMsIGFuZCBzdWZmaXhlc1xuICogaW4gcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YS4gU2VlIHN0b3JlQmluZGluZ01ldGFkYXRhKCkuXG4gKlxuICogV2UgaW50ZW50aW9uYWxseSB1c2UgdGhlIFVuaWNvZGUgXCJSRVBMQUNFTUVOVCBDSEFSQUNURVJcIiAoVStGRkZEKSBhcyBhIGRlbGltaXRlclxuICogYmVjYXVzZSBpdCBpcyBhIHZlcnkgdW5jb21tb24gY2hhcmFjdGVyIHRoYXQgaXMgdW5saWtlbHkgdG8gYmUgcGFydCBvZiBhIHVzZXInc1xuICogcHJvcGVydHkgbmFtZXMgb3IgaW50ZXJwb2xhdGlvbiBzdHJpbmdzLiBJZiBpdCBpcyBpbiBmYWN0IHVzZWQgaW4gYSBwcm9wZXJ0eVxuICogYmluZGluZywgRGVidWdFbGVtZW50LnByb3BlcnRpZXMgd2lsbCBub3QgcmV0dXJuIHRoZSBjb3JyZWN0IHZhbHVlIGZvciB0aGF0XG4gKiBiaW5kaW5nLiBIb3dldmVyLCB0aGVyZSBzaG91bGQgYmUgbm8gcnVudGltZSBlZmZlY3QgZm9yIHJlYWwgYXBwbGljYXRpb25zLlxuICpcbiAqIFRoaXMgY2hhcmFjdGVyIGlzIHR5cGljYWxseSByZW5kZXJlZCBhcyBhIHF1ZXN0aW9uIG1hcmsgaW5zaWRlIG9mIGEgZGlhbW9uZC5cbiAqIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TcGVjaWFsc18oVW5pY29kZV9ibG9jaylcbiAqXG4gKi9cbmV4cG9ydCBjb25zdCBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiA9IGDvv71gO1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIHN0cmluZyBpcyBhIHByb3BlcnR5IG1ldGFkYXRhIHN0cmluZy5cbiAqIFNlZSBzdG9yZUJpbmRpbmdNZXRhZGF0YSgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9wTWV0YWRhdGFTdHJpbmcoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKElOVEVSUE9MQVRJT05fREVMSU1JVEVSKSA+PSAwO1xufVxuIl19