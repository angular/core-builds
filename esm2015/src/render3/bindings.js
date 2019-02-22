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
import { isDifferent } from './util';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRW5ELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM5QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7OztBQU1uQyxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVksRUFBRSxZQUFvQixFQUFFLEtBQVU7SUFDMUUsT0FBTyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3JDLENBQUM7Ozs7Ozs7QUFJRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQVksRUFBRSxZQUFvQjtJQUMzRCxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzNELFNBQVM7UUFDTCxjQUFjLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFFLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO0lBQzlGLE9BQU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzdCLENBQUM7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsWUFBb0IsRUFBRSxLQUFVO0lBQzNFLFNBQVMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0lBQzNGLFNBQVM7UUFDTCxjQUFjLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsZ0RBQWdELENBQUMsQ0FBQzs7VUFFM0YsUUFBUSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDcEMsSUFBSSxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLElBQUksU0FBUyxJQUFJLHFCQUFxQixFQUFFLEVBQUU7Ozs7a0JBR2xDLGlCQUFpQixHQUFHLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUN2RSxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUMzQyx5QkFBeUIsQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzdFO1NBQ0Y7UUFDRCxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBWSxFQUFFLFlBQW9CLEVBQUUsSUFBUyxFQUFFLElBQVM7O1VBQ2hGLFNBQVMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUM7SUFDM0QsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3BFLENBQUM7Ozs7Ozs7Ozs7QUFHRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixLQUFZLEVBQUUsWUFBb0IsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVM7O1VBQy9ELFNBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ2xFLE9BQU8sY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUNwRSxDQUFDOzs7Ozs7Ozs7OztBQUdELE1BQU0sVUFBVSxlQUFlLENBQzNCLEtBQVksRUFBRSxZQUFvQixFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVM7O1VBQzFFLFNBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO0lBQ2xFLE9BQU8sZUFBZSxDQUFDLEtBQUssRUFBRSxZQUFZLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7QUFDM0UsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZXZNb2RlRXF1YWx9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHt0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge0xWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENoZWNrTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtpc0RpZmZlcmVudH0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8vIFRPRE8obWlza28pOiBjb25zaWRlciBpbmxpbmluZ1xuLyoqIFVwZGF0ZXMgYmluZGluZyBhbmQgcmV0dXJucyB0aGUgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQmluZGluZyhsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KTogYW55IHtcbiAgcmV0dXJuIGxWaWV3W2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbn1cblxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmcobFZpZXc6IExWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgbFZpZXdbYmluZGluZ0luZGV4XSk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwobFZpZXdbYmluZGluZ0luZGV4XSwgTk9fQ0hBTkdFLCAnU3RvcmVkIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIHJldHVybiBsVmlld1tiaW5kaW5nSW5kZXhdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKGJpbmRpbmdJbmRleCwgbFZpZXcubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHRvIE5PX0NIQU5HRWApO1xuXG4gIGNvbnN0IG9sZFZhbHVlID0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgaWYgKGlzRGlmZmVyZW50KG9sZFZhbHVlLCB2YWx1ZSkpIHtcbiAgICBpZiAobmdEZXZNb2RlICYmIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgICAvLyBWaWV3IGVuZ2luZSBkaWRuJ3QgcmVwb3J0IHVuZGVmaW5lZCB2YWx1ZXMgYXMgY2hhbmdlZCBvbiB0aGUgZmlyc3QgY2hlY2tOb0NoYW5nZXMgcGFzc1xuICAgICAgLy8gKGJlZm9yZSB0aGUgY2hhbmdlIGRldGVjdGlvbiB3YXMgcnVuKS5cbiAgICAgIGNvbnN0IG9sZFZhbHVlVG9Db21wYXJlID0gb2xkVmFsdWUgIT09IE5PX0NIQU5HRSA/IG9sZFZhbHVlIDogdW5kZWZpbmVkO1xuICAgICAgaWYgKCFkZXZNb2RlRXF1YWwob2xkVmFsdWVUb0NvbXBhcmUsIHZhbHVlKSkge1xuICAgICAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKG9sZFZhbHVlID09PSBOT19DSEFOR0UsIG9sZFZhbHVlVG9Db21wYXJlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxWaWV3W2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDEsIGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgMyBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQzKFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDIsIGV4cDMpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KFxuICAgIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCArIDIsIGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cbiJdfQ==