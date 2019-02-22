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
import { devModeEqual } from '../change_detection/change_detection_util';
import { assertDataInRange, assertLessThan, assertNotEqual } from '../util/assert';
import { throwErrorIfNoChangesMode } from './errors';
import { getCheckNoChangesMode } from './state';
import { NO_CHANGE } from './tokens';
import { isDifferent } from './util/misc_utils';
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
    ngDevMode && assertDataInRange(lView, lView[bindingIndex]);
    ngDevMode &&
        assertNotEqual(lView[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
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
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode &&
        assertLessThan(bindingIndex, lView.length, `Slot should have been initialized to NO_CHANGE`);
    /** @type {?} */
    const oldValue = lView[bindingIndex];
    if (isDifferent(oldValue, value)) {
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
    return false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRW5ELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM5QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7Ozs7O0FBTTlDLE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWSxFQUFFLFlBQW9CLEVBQUUsS0FBVTtJQUMxRSxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDckMsQ0FBQzs7Ozs7OztBQUlELE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBWSxFQUFFLFlBQW9CO0lBQzNELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDM0QsU0FBUztRQUNMLGNBQWMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLENBQUM7SUFDOUYsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDN0IsQ0FBQzs7Ozs7Ozs7QUFHRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVksRUFBRSxZQUFvQixFQUFFLEtBQVU7SUFDM0UsU0FBUyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLDJDQUEyQyxDQUFDLENBQUM7SUFDM0YsU0FBUztRQUNMLGNBQWMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxnREFBZ0QsQ0FBQyxDQUFDOztVQUUzRixRQUFRLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUNwQyxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUU7UUFDaEMsSUFBSSxTQUFTLElBQUkscUJBQXFCLEVBQUUsRUFBRTs7OztrQkFHbEMsaUJBQWlCLEdBQUcsUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQ3ZFLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQzNDLHlCQUF5QixDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDN0U7U0FDRjtRQUNELEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxJQUFTLEVBQUUsSUFBUzs7VUFDaEYsU0FBUyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQztJQUMzRCxPQUFPLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7QUFDcEUsQ0FBQzs7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSxlQUFlLENBQzNCLEtBQVksRUFBRSxZQUFvQixFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUzs7VUFDL0QsU0FBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7SUFDbEUsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3BFLENBQUM7Ozs7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsS0FBWSxFQUFFLFlBQW9CLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUzs7VUFDMUUsU0FBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7SUFDbEUsT0FBTyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUMzRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Rldk1vZGVFcXVhbH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3Rocm93RXJyb3JJZk5vQ2hhbmdlc01vZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q2hlY2tOb0NoYW5nZXNNb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2lzRGlmZmVyZW50fSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5cblxuXG4vLyBUT0RPKG1pc2tvKTogY29uc2lkZXIgaW5saW5pbmdcbi8qKiBVcGRhdGVzIGJpbmRpbmcgYW5kIHJldHVybnMgdGhlIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmcobFZpZXc6IExWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IGFueSB7XG4gIHJldHVybiBsVmlld1tiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cblxuLyoqIEdldHMgdGhlIGN1cnJlbnQgYmluZGluZyB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGxWaWV3W2JpbmRpbmdJbmRleF0pO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKGxWaWV3W2JpbmRpbmdJbmRleF0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gbFZpZXdbYmluZGluZ0luZGV4XTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBpdCB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZChsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbCh2YWx1ZSwgTk9fQ0hBTkdFLCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRMZXNzVGhhbihiaW5kaW5nSW5kZXgsIGxWaWV3Lmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB0byBOT19DSEFOR0VgKTtcblxuICBjb25zdCBvbGRWYWx1ZSA9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gIGlmIChpc0RpZmZlcmVudChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgICAgLy8gVmlldyBlbmdpbmUgZGlkbid0IHJlcG9ydCB1bmRlZmluZWQgdmFsdWVzIGFzIGNoYW5nZWQgb24gdGhlIGZpcnN0IGNoZWNrTm9DaGFuZ2VzIHBhc3NcbiAgICAgIC8vIChiZWZvcmUgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2FzIHJ1bikuXG4gICAgICBjb25zdCBvbGRWYWx1ZVRvQ29tcGFyZSA9IG9sZFZhbHVlICE9PSBOT19DSEFOR0UgPyBvbGRWYWx1ZSA6IHVuZGVmaW5lZDtcbiAgICAgIGlmICghZGV2TW9kZUVxdWFsKG9sZFZhbHVlVG9Db21wYXJlLCB2YWx1ZSkpIHtcbiAgICAgICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShvbGRWYWx1ZSA9PT0gTk9fQ0hBTkdFLCBvbGRWYWx1ZVRvQ29tcGFyZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBVcGRhdGVzIDIgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgZWl0aGVyIHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMihsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCBleHAxKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXggKyAxLCBleHAyKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDMgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMyhcbiAgICBsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4LCBleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXggKyAyLCBleHAzKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDQgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkNChcbiAgICBsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXggKyAyLCBleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG4iXX0=