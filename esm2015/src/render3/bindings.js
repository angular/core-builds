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
import { assertDataInRange, assertLessThan, assertNotEqual } from './assert';
import { throwErrorIfNoChangesMode } from './errors';
import { getCheckNoChangesMode, getCreationMode } from './state';
import { NO_CHANGE } from './tokens';
import { isDifferent } from './util';
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
    if (lView[bindingIndex] === NO_CHANGE) {
        // initial pass
        lView[bindingIndex] = value;
    }
    else if (isDifferent(lView[bindingIndex], value)) {
        if (ngDevMode && getCheckNoChangesMode()) {
            if (!devModeEqual(lView[bindingIndex], value)) {
                throwErrorIfNoChangesMode(getCreationMode(), lView[bindingIndex], value);
            }
        }
        lView[bindingIndex] = value;
    }
    else {
        return false;
    }
    return true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBRXZFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVuRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQy9ELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbkMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7QUFNbkMsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxLQUFVO0lBQzFFLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQztDQUNwQzs7Ozs7OztBQUlELE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBWSxFQUFFLFlBQW9CO0lBQzNELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDM0QsU0FBUztRQUNMLGNBQWMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLENBQUM7SUFDOUYsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7Q0FDNUI7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxLQUFVO0lBQzNFLFNBQVMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0lBQzNGLFNBQVM7UUFDTCxjQUFjLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztJQUVqRyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxTQUFTLEVBQUU7O1FBRXJDLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUM7S0FDN0I7U0FBTSxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUU7UUFDbEQsSUFBSSxTQUFTLElBQUkscUJBQXFCLEVBQUUsRUFBRTtZQUN4QyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDN0MseUJBQXlCLENBQUMsZUFBZSxFQUFFLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzFFO1NBQ0Y7UUFDRCxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQzdCO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxJQUFTLEVBQUUsSUFBUzs7SUFDdEYsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUQsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0NBQ25FOzs7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsS0FBWSxFQUFFLFlBQW9CLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTOztJQUNyRSxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkUsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0NBQ25FOzs7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSxlQUFlLENBQzNCLEtBQVksRUFBRSxZQUFvQixFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVM7O0lBQ2hGLE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRSxPQUFPLGVBQWUsQ0FBQyxLQUFLLEVBQUUsWUFBWSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0NBQzFFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Rldk1vZGVFcXVhbH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7dGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldENyZWF0aW9uTW9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtpc0RpZmZlcmVudH0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8vIFRPRE8obWlza28pOiBjb25zaWRlciBpbmxpbmluZ1xuLyoqIFVwZGF0ZXMgYmluZGluZyBhbmQgcmV0dXJucyB0aGUgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQmluZGluZyhsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KTogYW55IHtcbiAgcmV0dXJuIGxWaWV3W2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbn1cblxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmcobFZpZXc6IExWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgbFZpZXdbYmluZGluZ0luZGV4XSk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwobFZpZXdbYmluZGluZ0luZGV4XSwgTk9fQ0hBTkdFLCAnU3RvcmVkIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIHJldHVybiBsVmlld1tiaW5kaW5nSW5kZXhdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKGJpbmRpbmdJbmRleCwgbFZpZXcubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHRvIE5PX0NIQU5HRWApO1xuXG4gIGlmIChsVmlld1tiaW5kaW5nSW5kZXhdID09PSBOT19DSEFOR0UpIHtcbiAgICAvLyBpbml0aWFsIHBhc3NcbiAgICBsVmlld1tiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoaXNEaWZmZXJlbnQobFZpZXdbYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgICAgaWYgKCFkZXZNb2RlRXF1YWwobFZpZXdbYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoZ2V0Q3JlYXRpb25Nb2RlKCksIGxWaWV3W2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFZpZXdbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDEsIGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgMyBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQzKFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDIsIGV4cDMpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCArIDIsIGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cbiJdfQ==