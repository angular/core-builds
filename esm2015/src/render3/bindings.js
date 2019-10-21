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
import { devModeEqual } from '../change_detection/change_detection_util';
import { assertDataInRange, assertLessThan, assertNotSame } from '../util/assert';
import { throwErrorIfNoChangesMode } from './errors';
import { getCheckNoChangesMode } from './state';
import { NO_CHANGE } from './tokens';
// TODO(misko): consider inlining
/**
 * Updates binding and returns the value.
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} value
 * @return {?}
 */
export function updateBinding(lView, bindingIndex, value) {
    return lView[bindingIndex] = value;
}
/**
 * Gets the current binding value.
 * @param {?} lView
 * @param {?} bindingIndex
 * @return {?}
 */
export function getBinding(lView, bindingIndex) {
    ngDevMode && assertDataInRange(lView, bindingIndex);
    ngDevMode &&
        assertNotSame(lView[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return lView[bindingIndex];
}
/**
 * Updates binding if changed, then returns whether it was updated.
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} value
 * @return {?}
 */
export function bindingUpdated(lView, bindingIndex, value) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode &&
        assertLessThan(bindingIndex, lView.length, `Slot should have been initialized to NO_CHANGE`);
    /** @type {?} */
    const oldValue = lView[bindingIndex];
    if (Object.is(oldValue, value)) {
        return false;
    }
    else {
        if (ngDevMode && getCheckNoChangesMode()) {
            // View engine didn't report undefined values as changed on the first checkNoChanges pass
            // (before the change detection was run).
            /** @type {?} */
            const oldValueToCompare = oldValue !== NO_CHANGE ? oldValue : undefined;
            if (!devModeEqual(oldValueToCompare, value)) {
                throwErrorIfNoChangesMode(oldValue === NO_CHANGE, oldValueToCompare, value);
            }
        }
        lView[bindingIndex] = value;
        return true;
    }
}
/**
 * Updates 2 bindings if changed, then returns whether either was updated.
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} exp1
 * @param {?} exp2
 * @return {?}
 */
export function bindingUpdated2(lView, bindingIndex, exp1, exp2) {
    /** @type {?} */
    const different = bindingUpdated(lView, bindingIndex, exp1);
    return bindingUpdated(lView, bindingIndex + 1, exp2) || different;
}
/**
 * Updates 3 bindings if changed, then returns whether any was updated.
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @return {?}
 */
export function bindingUpdated3(lView, bindingIndex, exp1, exp2, exp3) {
    /** @type {?} */
    const different = bindingUpdated2(lView, bindingIndex, exp1, exp2);
    return bindingUpdated(lView, bindingIndex + 2, exp3) || different;
}
/**
 * Updates 4 bindings if changed, then returns whether any was updated.
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @return {?}
 */
export function bindingUpdated4(lView, bindingIndex, exp1, exp2, exp3, exp4) {
    /** @type {?} */
    const different = bindingUpdated2(lView, bindingIndex, exp1, exp2);
    return bindingUpdated2(lView, bindingIndex + 2, exp3, exp4) || different;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRW5ELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM5QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7QUFLbkMsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxLQUFVO0lBQzFFLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNyQyxDQUFDOzs7Ozs7O0FBSUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxLQUFZLEVBQUUsWUFBb0I7SUFDM0QsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNwRCxTQUFTO1FBQ0wsYUFBYSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUseUNBQXlDLENBQUMsQ0FBQztJQUM3RixPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUM3QixDQUFDOzs7Ozs7OztBQUdELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWSxFQUFFLFlBQW9CLEVBQUUsS0FBVTtJQUMzRSxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztJQUMxRixTQUFTO1FBQ0wsY0FBYyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLGdEQUFnRCxDQUFDLENBQUM7O1VBQzNGLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBRXBDLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUU7UUFDOUIsT0FBTyxLQUFLLENBQUM7S0FDZDtTQUFNO1FBQ0wsSUFBSSxTQUFTLElBQUkscUJBQXFCLEVBQUUsRUFBRTs7OztrQkFHbEMsaUJBQWlCLEdBQUcsUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQ3ZFLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQzNDLHlCQUF5QixDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDN0U7U0FDRjtRQUNELEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7S0FDYjtBQUNILENBQUM7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBWSxFQUFFLFlBQW9CLEVBQUUsSUFBUyxFQUFFLElBQVM7O1VBQ2hGLFNBQVMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUM7SUFDM0QsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3BFLENBQUM7Ozs7Ozs7Ozs7QUFHRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixLQUFZLEVBQUUsWUFBb0IsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVM7O1VBQy9ELFNBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ2xFLE9BQU8sY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUNwRSxDQUFDOzs7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSxlQUFlLENBQzNCLEtBQVksRUFBRSxZQUFvQixFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVM7O1VBQzFFLFNBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ2xFLE9BQU8sZUFBZSxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7QUFDM0UsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZXZNb2RlRXF1YWx9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RTYW1lfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3Rocm93RXJyb3JJZk5vQ2hhbmdlc01vZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q2hlY2tOb0NoYW5nZXNNb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5cblxuLy8gVE9ETyhtaXNrbyk6IGNvbnNpZGVyIGlubGluaW5nXG4vKiogVXBkYXRlcyBiaW5kaW5nIGFuZCByZXR1cm5zIHRoZSB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVCaW5kaW5nKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBhbnkge1xuICByZXR1cm4gbFZpZXdbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG5cbi8qKiBHZXRzIHRoZSBjdXJyZW50IGJpbmRpbmcgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZyhsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdFNhbWUobFZpZXdbYmluZGluZ0luZGV4XSwgTk9fQ0hBTkdFLCAnU3RvcmVkIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIHJldHVybiBsVmlld1tiaW5kaW5nSW5kZXhdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oYmluZGluZ0luZGV4LCBsVmlldy5sZW5ndGgsIGBTbG90IHNob3VsZCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQgdG8gTk9fQ0hBTkdFYCk7XG4gIGNvbnN0IG9sZFZhbHVlID0gbFZpZXdbYmluZGluZ0luZGV4XTtcblxuICBpZiAoT2JqZWN0LmlzKG9sZFZhbHVlLCB2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgICAgLy8gVmlldyBlbmdpbmUgZGlkbid0IHJlcG9ydCB1bmRlZmluZWQgdmFsdWVzIGFzIGNoYW5nZWQgb24gdGhlIGZpcnN0IGNoZWNrTm9DaGFuZ2VzIHBhc3NcbiAgICAgIC8vIChiZWZvcmUgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2FzIHJ1bikuXG4gICAgICBjb25zdCBvbGRWYWx1ZVRvQ29tcGFyZSA9IG9sZFZhbHVlICE9PSBOT19DSEFOR0UgPyBvbGRWYWx1ZSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmICghZGV2TW9kZUVxdWFsKG9sZFZhbHVlVG9Db21wYXJlLCB2YWx1ZSkpIHtcbiAgICAgICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShvbGRWYWx1ZSA9PT0gTk9fQ0hBTkdFLCBvbGRWYWx1ZVRvQ29tcGFyZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDEsIGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgMyBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQzKFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDIsIGV4cDMpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCArIDIsIGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cbiJdfQ==