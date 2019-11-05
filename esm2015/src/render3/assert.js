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
import { assertDefined, assertEqual, throwError } from '../util/assert';
import { getComponentDef, getNgModuleDef } from './definition';
import { isLContainer, isLView } from './interfaces/type_checks';
import { TVIEW } from './interfaces/view';
/**
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function assertTNodeForLView(tNode, lView) {
    tNode.hasOwnProperty('tView_') && assertEqual(((/** @type {?} */ ((/** @type {?} */ (tNode))))).tView_, lView[TVIEW], 'This TNode does not belong to this LView.');
}
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertComponentType(actual, msg = 'Type passed in is not ComponentType, it does not have \'ɵcmp\' property.') {
    if (!getComponentDef(actual)) {
        throwError(msg);
    }
}
/**
 * @param {?} actual
 * @param {?=} msg
 * @return {?}
 */
export function assertNgModuleType(actual, msg = 'Type passed in is not NgModuleType, it does not have \'ɵmod\' property.') {
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
/**
 * @param {?} tView
 * @param {?=} errMessage
 * @return {?}
 */
export function assertFirstCreatePass(tView, errMessage) {
    assertEqual(tView.firstCreatePass, true, errMessage || 'Should only be called in first create pass.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV0RSxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUU3RCxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQy9ELE9BQU8sRUFBUSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7O0FBRXRELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUM1RCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFdBQVcsQ0FDUCxDQUFDLG1CQUFBLG1CQUFBLEtBQUssRUFBTyxFQUFrQixDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFDckQsMkNBQTJDLENBQUMsQ0FBQztBQUNyRixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLE1BQVcsRUFDWCxNQUFjLDBFQUEwRTtJQUMxRixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzVCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtBQUNILENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsTUFBVyxFQUNYLE1BQWMseUVBQXlFO0lBQ3pGLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDM0IsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2pCO0FBQ0gsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsUUFBaUI7SUFDdEQsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsMENBQTBDLENBQUMsQ0FBQztBQUMxRSxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBbUI7SUFDakQsYUFBYSxDQUFDLEtBQUssRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDO0lBQzVELGFBQWEsQ0FBQyxtQkFBQSxLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsNENBQTRDLENBQUMsQ0FBQztBQUM5RSxDQUFDOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLEdBQVc7SUFDckUsSUFBSSxHQUFHLElBQUksSUFBSTtRQUFFLEdBQUcsR0FBRyxLQUFLLENBQUM7SUFDN0IsV0FBVyxDQUNQLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsS0FBSyw2Q0FBNkMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDbkcsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsMkJBQTJCLENBQUMsS0FBVTtJQUNwRCxLQUFLLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztBQUMvRixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFVO0lBQ3pDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUNuRCxXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEtBQVU7SUFDL0MsS0FBSyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLHNDQUFzQyxDQUFDLENBQUM7QUFDckYsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQVU7SUFDcEMsYUFBYSxDQUFDLEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0lBQzlDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDdkQsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxVQUFtQjtJQUNyRSxXQUFXLENBQ1AsS0FBSyxDQUFDLGVBQWUsRUFBRSxJQUFJLEVBQUUsVUFBVSxJQUFJLDZDQUE2QyxDQUFDLENBQUM7QUFDaEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICB0Tm9kZS5oYXNPd25Qcm9wZXJ0eSgndFZpZXdfJykgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHROb2RlIGFzIGFueSBhc3t0Vmlld186IFRWaWV3fSkudFZpZXdfLCBsVmlld1tUVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1RoaXMgVE5vZGUgZG9lcyBub3QgYmVsb25nIHRvIHRoaXMgTFZpZXcuJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRDb21wb25lbnRUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID0gJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBDb21wb25lbnRUeXBlLCBpdCBkb2VzIG5vdCBoYXZlIFxcJ8m1Y21wXFwnIHByb3BlcnR5LicpIHtcbiAgaWYgKCFnZXRDb21wb25lbnREZWYoYWN0dWFsKSkge1xuICAgIHRocm93RXJyb3IobXNnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TmdNb2R1bGVUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID0gJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBOZ01vZHVsZVR5cGUsIGl0IGRvZXMgbm90IGhhdmUgXFwnybVtb2RcXCcgcHJvcGVydHkuJykge1xuICBpZiAoIWdldE5nTW9kdWxlRGVmKGFjdHVhbCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIHRydWUsICdwcmV2aW91c09yUGFyZW50VE5vZGUgc2hvdWxkIGJlIGEgcGFyZW50Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQodE5vZGU6IFROb2RlIHwgbnVsbCkge1xuICBhc3NlcnREZWZpbmVkKHROb2RlLCAncHJldmlvdXNPclBhcmVudFROb2RlIHNob3VsZCBleGlzdCEnKTtcbiAgYXNzZXJ0RGVmaW5lZCh0Tm9kZSAhLnBhcmVudCwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZSBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IGxWaWV3O1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TENvbnRhaW5lck9yVW5kZWZpbmVkKHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgdmFsdWUgJiYgYXNzZXJ0RXF1YWwoaXNMQ29udGFpbmVyKHZhbHVlKSwgdHJ1ZSwgJ0V4cGVjdGluZyBMQ29udGFpbmVyIG9yIHVuZGVmaW5lZCBvciBudWxsJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRMQ29udGFpbmVyKHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgYXNzZXJ0RGVmaW5lZCh2YWx1ZSwgJ0xDb250YWluZXIgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGFzc2VydEVxdWFsKGlzTENvbnRhaW5lcih2YWx1ZSksIHRydWUsICdFeHBlY3RpbmcgTENvbnRhaW5lcicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TFZpZXdPclVuZGVmaW5lZCh2YWx1ZTogYW55KTogdm9pZCB7XG4gIHZhbHVlICYmIGFzc2VydEVxdWFsKGlzTFZpZXcodmFsdWUpLCB0cnVlLCAnRXhwZWN0aW5nIExWaWV3IG9yIHVuZGVmaW5lZCBvciBudWxsJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRMVmlldyh2YWx1ZTogYW55KSB7XG4gIGFzc2VydERlZmluZWQodmFsdWUsICdMVmlldyBtdXN0IGJlIGRlZmluZWQnKTtcbiAgYXNzZXJ0RXF1YWwoaXNMVmlldyh2YWx1ZSksIHRydWUsICdFeHBlY3RpbmcgTFZpZXcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0VmlldzogVFZpZXcsIGVyck1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MsIHRydWUsIGVyck1lc3NhZ2UgfHwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBmaXJzdCBjcmVhdGUgcGFzcy4nKTtcbn1cbiJdfQ==