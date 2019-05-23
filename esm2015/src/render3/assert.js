/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual, throwError } from '../util/assert';
import { getComponentDef, getNgModuleDef } from './definition';
import { isLContainer, isLView } from './util/view_utils';
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertComponentType(actual, msg = 'Type passed in is not ComponentType, it does not have \'ngComponentDef\' property.') {
    if (!getComponentDef(actual)) {
        throwError(msg);
    }
}
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertNgModuleType(actual, msg = 'Type passed in is not NgModuleType, it does not have \'ngModuleDef\' property.') {
    if (!getNgModuleDef(actual)) {
        throwError(msg);
    }
}
/**
 * @param {?} isParent
 * @return {?}
 */
export function assertPreviousIsParent(isParent) {
    assertEqual(isParent, true, 'previousOrParentTNode should be a parent');
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function assertHasParent(tNode) {
    assertDefined(tNode, 'previousOrParentTNode should exist!');
    assertDefined((/** @type {?} */ (tNode)).parent, 'previousOrParentTNode should have a parent');
}
/**
 * @param {?} lView
 * @param {?} index
 * @param {?=} arr
 * @return {?}
 */
export function assertDataNext(lView, index, arr) {
    if (arr == null)
        arr = lView;
    assertEqual(arr.length, index, `index ${index} expected to be at the end of arr (length ${arr.length})`);
}
/**
 * @param {?} value
 * @return {?}
 */
export function assertLContainerOrUndefined(value) {
    value && assertEqual(isLContainer(value), true, 'Expecting LContainer or undefined or null');
}
/**
 * @param {?} value
 * @return {?}
 */
export function assertLContainer(value) {
    assertDefined(value, 'LContainer must be defined');
    assertEqual(isLContainer(value), true, 'Expecting LContainer');
}
/**
 * @param {?} value
 * @return {?}
 */
export function assertLViewOrUndefined(value) {
    value && assertEqual(isLView(value), true, 'Expecting LView or undefined or null');
}
/**
 * @param {?} value
 * @return {?}
 */
export function assertLView(value) {
    assertDefined(value, 'LView must be defined');
    assertEqual(isLView(value), true, 'Expecting LView');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV0RSxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUc3RCxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7QUFHeEQsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixNQUFXLEVBQ1gsTUFDSSxvRkFBb0Y7SUFDMUYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUM1QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7QUFDSCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE1BQVcsRUFDWCxNQUNJLGdGQUFnRjtJQUN0RixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzNCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtBQUNILENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFFBQWlCO0lBQ3RELFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7QUFDMUUsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQW1CO0lBQ2pELGFBQWEsQ0FBQyxLQUFLLEVBQUUscUNBQXFDLENBQUMsQ0FBQztJQUM1RCxhQUFhLENBQUMsbUJBQUEsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLDRDQUE0QyxDQUFDLENBQUM7QUFDOUUsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxHQUFXO0lBQ3JFLElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQzdCLFdBQVcsQ0FDUCxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEtBQUssNkNBQTZDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ25HLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEtBQVU7SUFDcEQsS0FBSyxJQUFJLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDL0YsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBVTtJQUN6QyxhQUFhLENBQUMsS0FBSyxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDbkQsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztBQUNqRSxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFVO0lBQy9DLEtBQUssSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFVO0lBQ3BDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUM5QyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldE5nTW9kdWxlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Q29tcG9uZW50VHlwZShcbiAgICBhY3R1YWw6IGFueSxcbiAgICBtc2c6IHN0cmluZyA9XG4gICAgICAgICdUeXBlIHBhc3NlZCBpbiBpcyBub3QgQ29tcG9uZW50VHlwZSwgaXQgZG9lcyBub3QgaGF2ZSBcXCduZ0NvbXBvbmVudERlZlxcJyBwcm9wZXJ0eS4nKSB7XG4gIGlmICghZ2V0Q29tcG9uZW50RGVmKGFjdHVhbCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5nTW9kdWxlVHlwZShcbiAgICBhY3R1YWw6IGFueSxcbiAgICBtc2c6IHN0cmluZyA9XG4gICAgICAgICdUeXBlIHBhc3NlZCBpbiBpcyBub3QgTmdNb2R1bGVUeXBlLCBpdCBkb2VzIG5vdCBoYXZlIFxcJ25nTW9kdWxlRGVmXFwnIHByb3BlcnR5LicpIHtcbiAgaWYgKCFnZXROZ01vZHVsZURlZihhY3R1YWwpKSB7XG4gICAgdGhyb3dFcnJvcihtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KGlzUGFyZW50OiBib29sZWFuKSB7XG4gIGFzc2VydEVxdWFsKGlzUGFyZW50LCB0cnVlLCAncHJldmlvdXNPclBhcmVudFROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SGFzUGFyZW50KHROb2RlOiBUTm9kZSB8IG51bGwpIHtcbiAgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZSBzaG91bGQgZXhpc3QhJyk7XG4gIGFzc2VydERlZmluZWQodE5vZGUgIS5wYXJlbnQsICdwcmV2aW91c09yUGFyZW50VE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydERhdGFOZXh0KGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBsVmlldztcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBhcnIubGVuZ3RoLCBpbmRleCwgYGluZGV4ICR7aW5kZXh9IGV4cGVjdGVkIHRvIGJlIGF0IHRoZSBlbmQgb2YgYXJyIChsZW5ndGggJHthcnIubGVuZ3RofSlgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydExDb250YWluZXJPclVuZGVmaW5lZCh2YWx1ZTogYW55KTogdm9pZCB7XG4gIHZhbHVlICYmIGFzc2VydEVxdWFsKGlzTENvbnRhaW5lcih2YWx1ZSksIHRydWUsICdFeHBlY3RpbmcgTENvbnRhaW5lciBvciB1bmRlZmluZWQgb3IgbnVsbCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TENvbnRhaW5lcih2YWx1ZTogYW55KTogdm9pZCB7XG4gIGFzc2VydERlZmluZWQodmFsdWUsICdMQ29udGFpbmVyIG11c3QgYmUgZGVmaW5lZCcpO1xuICBhc3NlcnRFcXVhbChpc0xDb250YWluZXIodmFsdWUpLCB0cnVlLCAnRXhwZWN0aW5nIExDb250YWluZXInKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydExWaWV3T3JVbmRlZmluZWQodmFsdWU6IGFueSk6IHZvaWQge1xuICB2YWx1ZSAmJiBhc3NlcnRFcXVhbChpc0xWaWV3KHZhbHVlKSwgdHJ1ZSwgJ0V4cGVjdGluZyBMVmlldyBvciB1bmRlZmluZWQgb3IgbnVsbCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TFZpZXcodmFsdWU6IGFueSkge1xuICBhc3NlcnREZWZpbmVkKHZhbHVlLCAnTFZpZXcgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGFzc2VydEVxdWFsKGlzTFZpZXcodmFsdWUpLCB0cnVlLCAnRXhwZWN0aW5nIExWaWV3Jyk7XG59XG4iXX0=