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
import { readElementValue, readPatchedLViewData } from './context_discovery';
import { CONTEXT, FLAGS, HEADER_OFFSET, PARENT } from './interfaces/view';
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
 *  Function that throws a "not implemented" error so it's clear certain
 *  behaviors/methods aren't yet ready.
 *
 * @return {?} Not implemented error
 */
export function notImplemented() {
    return new Error('NotImplemented');
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
 * Retrieves an element value from the provided `viewData`.
 *
 * Elements that are read may be wrapped in a style context,
 * therefore reading the value may involve unwrapping that.
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function loadElementInternal(index, arr) {
    /** @type {?} */
    const value = loadInternal(index, arr);
    return readElementValue(value);
}
/**
 * @param {?} tNode
 * @param {?} hostView
 * @return {?}
 */
export function getLNode(tNode, hostView) {
    return readElementValue(hostView[tNode.index]);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUV2RSxPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUUzRSxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQXlCLE1BQU0sRUFBcUIsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7Ozs7OztBQVNuSCxNQUFNLFVBQVUsV0FBVyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsa0JBQTJCO0lBQ3JFLElBQUksU0FBUyxJQUFJLGtCQUFrQixFQUFFO1FBQ25DLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzVCOzs7SUFHRCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3pDOzs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBVTtJQUNsQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFVBQVU7UUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO0lBQzNELElBQUksT0FBTyxLQUFLLElBQUksUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzNDLElBQUksS0FBSyxJQUFJLElBQUk7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUM3QixPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7Q0FDbkI7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsY0FBYztJQUM1QixPQUFPLElBQUks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Q0FDN0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ZGV2TW9kZUVxdWFsfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7cmVhZEVsZW1lbnRWYWx1ZSwgcmVhZFBhdGNoZWRMVmlld0RhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnRDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFREYXRhfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciB0aGUgdmFsdWVzIGFyZSBkaWZmZXJlbnQgZnJvbSBhIGNoYW5nZSBkZXRlY3Rpb24gc3RhbmQgcG9pbnQuXG4gKlxuICogQ29uc3RyYWludHMgYXJlIHJlbGF4ZWQgaW4gY2hlY2tOb0NoYW5nZXMgbW9kZS4gU2VlIGBkZXZNb2RlRXF1YWxgIGZvciBkZXRhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaWZmZXJlbnQoYTogYW55LCBiOiBhbnksIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAobmdEZXZNb2RlICYmIGNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIHJldHVybiAhZGV2TW9kZUVxdWFsKGEsIGIpO1xuICB9XG4gIC8vIE5hTiBpcyB0aGUgb25seSB2YWx1ZSB0aGF0IGlzIG5vdCBlcXVhbCB0byBpdHNlbGYgc28gdGhlIGZpcnN0XG4gIC8vIHRlc3QgY2hlY2tzIGlmIGJvdGggYSBhbmQgYiBhcmUgbm90IE5hTlxuICByZXR1cm4gIShhICE9PSBhICYmIGIgIT09IGIpICYmIGEgIT09IGI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHZhbHVlLm5hbWUgfHwgdmFsdWU7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgdmFsdWU7XG59XG5cbi8qKlxuICogIEZ1bmN0aW9uIHRoYXQgdGhyb3dzIGEgXCJub3QgaW1wbGVtZW50ZWRcIiBlcnJvciBzbyBpdCdzIGNsZWFyIGNlcnRhaW5cbiAqICBiZWhhdmlvcnMvbWV0aG9kcyBhcmVuJ3QgeWV0IHJlYWR5LlxuICpcbiAqIEByZXR1cm5zIE5vdCBpbXBsZW1lbnRlZCBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQoKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKCdOb3RJbXBsZW1lbnRlZCcpO1xufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFuIGFycmF5IGluIG5vbi1yZWN1cnNpdmUgd2F5LiBJbnB1dCBhcnJheXMgYXJlIG5vdCBtb2RpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdDogYW55W10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgbGlzdC5sZW5ndGgpIHtcbiAgICBjb25zdCBpdGVtID0gbGlzdFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICBsaXN0ID0gaXRlbS5jb25jYXQobGlzdC5zbGljZShpICsgMSkpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld0RhdGFgIG9yIGBURGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEludGVybmFsPFQ+KGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhIHwgVERhdGEpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBhcnIpO1xuICByZXR1cm4gYXJyW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogYW55W10pIHtcbiAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIGFyciA/IGFyci5sZW5ndGggOiAwLCAnaW5kZXggZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBkYXRhIGluZGV4Jyk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYW4gZWxlbWVudCB2YWx1ZSBmcm9tIHRoZSBwcm92aWRlZCBgdmlld0RhdGFgLlxuICAqXG4gICogRWxlbWVudHMgdGhhdCBhcmUgcmVhZCBtYXkgYmUgd3JhcHBlZCBpbiBhIHN0eWxlIGNvbnRleHQsXG4gICogdGhlcmVmb3JlIHJlYWRpbmcgdGhlIHZhbHVlIG1heSBpbnZvbHZlIHVud3JhcHBpbmcgdGhhdC5cbiAgKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRWxlbWVudEludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdmFsdWUgPSBsb2FkSW50ZXJuYWw8TEVsZW1lbnROb2RlPihpbmRleCwgYXJyKTtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TE5vZGUodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfFxuICAgIExFbGVtZW50Q29udGFpbmVyTm9kZSB7XG4gIHJldHVybiByZWFkRWxlbWVudFZhbHVlKGhvc3RWaWV3W3ROb2RlLmluZGV4XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xufVxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3RGF0YWAgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld0RhdGFgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcodGFyZ2V0OiBMVmlld0RhdGEgfCB7fSk6IExWaWV3RGF0YSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRhcmdldCwgJ2NvbXBvbmVudCcpO1xuICBsZXQgbFZpZXdEYXRhID0gQXJyYXkuaXNBcnJheSh0YXJnZXQpID8gKHRhcmdldCBhcyBMVmlld0RhdGEpIDogcmVhZFBhdGNoZWRMVmlld0RhdGEodGFyZ2V0KSAhO1xuICB3aGlsZSAobFZpZXdEYXRhICYmICEobFZpZXdEYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3RGF0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KHZpZXdPckNvbXBvbmVudDogTFZpZXdEYXRhIHwge30pOiBSb290Q29udGV4dCB7XG4gIHJldHVybiBnZXRSb290Vmlldyh2aWV3T3JDb21wb25lbnQpW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuIl19