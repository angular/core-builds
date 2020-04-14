/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/assert.ts
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
// [Assert functions do not constraint type when they are guarded by a truthy
// expression.](https://github.com/microsoft/TypeScript/issues/37295)
/**
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function assertTNodeForLView(tNode, lView) {
    tNode.hasOwnProperty('tView_') &&
        assertEqual(((/** @type {?} */ ((/** @type {?} */ (tNode))))).tView_, lView[TVIEW], 'This TNode does not belong to this LView.');
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
/**
 * @param {?} tView
 * @param {?=} errMessage
 * @return {?}
 */
export function assertFirstUpdatePass(tView, errMessage) {
    assertEqual(tView.firstUpdatePass, true, errMessage || 'Should only be called in first update pass.');
}
/**
 * This is a basic sanity check that an object is probably a directive def. DirectiveDef is
 * an interface, so we can't do a direct instanceof check.
 * @template T
 * @param {?} obj
 * @return {?}
 */
export function assertDirectiveDef(obj) {
    if (obj.type === undefined || obj.selectors == undefined || obj.inputs === undefined) {
        throwError(`Expected a DirectiveDef/ComponentDef and this object does not seem to have the expected shape.`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hc3NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFdEUsT0FBTyxFQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFJN0QsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUMvRCxPQUFPLEVBQVEsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7O0FBTXRELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUM1RCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQztRQUMxQixXQUFXLENBQ1AsQ0FBQyxtQkFBQSxtQkFBQSxLQUFLLEVBQU8sRUFBbUIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQ3RELDJDQUEyQyxDQUFDLENBQUM7QUFDdkQsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixNQUFXLEVBQ1gsTUFBYywwRUFBMEU7SUFDMUYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUM1QixVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDakI7QUFDSCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE1BQVcsRUFDWCxNQUFjLHlFQUF5RTtJQUN6RixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzNCLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNqQjtBQUNILENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFFBQWlCO0lBQ3RELFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7QUFDMUUsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQWlCO0lBQy9DLGFBQWEsQ0FBQyxLQUFLLEVBQUUscUNBQXFDLENBQUMsQ0FBQztJQUM1RCxhQUFhLENBQUMsbUJBQUEsS0FBSyxFQUFDLENBQUMsTUFBTSxFQUFFLDRDQUE0QyxDQUFDLENBQUM7QUFDN0UsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxHQUFXO0lBQ3JFLElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQzdCLFdBQVcsQ0FDUCxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEtBQUssNkNBQTZDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ25HLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEtBQVU7SUFFcEQsS0FBSyxJQUFJLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDL0YsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBVTtJQUN6QyxhQUFhLENBQUMsS0FBSyxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDbkQsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztBQUNqRSxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFVO0lBQy9DLEtBQUssSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFVO0lBQ3BDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztJQUM5QyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsVUFBbUI7SUFDckUsV0FBVyxDQUNQLEtBQUssQ0FBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLFVBQVUsSUFBSSw2Q0FBNkMsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsVUFBbUI7SUFDckUsV0FBVyxDQUNQLEtBQUssQ0FBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLFVBQVUsSUFBSSw2Q0FBNkMsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLGtCQUFrQixDQUFJLEdBQVE7SUFDNUMsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxHQUFHLENBQUMsU0FBUyxJQUFJLFNBQVMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUNwRixVQUFVLENBQ04sZ0dBQWdHLENBQUMsQ0FBQztLQUN2RztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldE5nTW9kdWxlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vLyBbQXNzZXJ0IGZ1bmN0aW9ucyBkbyBub3QgY29uc3RyYWludCB0eXBlIHdoZW4gdGhleSBhcmUgZ3VhcmRlZCBieSBhIHRydXRoeVxuLy8gZXhwcmVzc2lvbi5dKGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzcyOTUpXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgdE5vZGUuaGFzT3duUHJvcGVydHkoJ3RWaWV3XycpICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAodE5vZGUgYXMgYW55IGFzIHt0Vmlld186IFRWaWV3fSkudFZpZXdfLCBsVmlld1tUVklFV10sXG4gICAgICAgICAgJ1RoaXMgVE5vZGUgZG9lcyBub3QgYmVsb25nIHRvIHRoaXMgTFZpZXcuJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRDb21wb25lbnRUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID0gJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBDb21wb25lbnRUeXBlLCBpdCBkb2VzIG5vdCBoYXZlIFxcJ8m1Y21wXFwnIHByb3BlcnR5LicpIHtcbiAgaWYgKCFnZXRDb21wb25lbnREZWYoYWN0dWFsKSkge1xuICAgIHRocm93RXJyb3IobXNnKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TmdNb2R1bGVUeXBlKFxuICAgIGFjdHVhbDogYW55LFxuICAgIG1zZzogc3RyaW5nID0gJ1R5cGUgcGFzc2VkIGluIGlzIG5vdCBOZ01vZHVsZVR5cGUsIGl0IGRvZXMgbm90IGhhdmUgXFwnybVtb2RcXCcgcHJvcGVydHkuJykge1xuICBpZiAoIWdldE5nTW9kdWxlRGVmKGFjdHVhbCkpIHtcbiAgICB0aHJvd0Vycm9yKG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIHRydWUsICdwcmV2aW91c09yUGFyZW50VE5vZGUgc2hvdWxkIGJlIGEgcGFyZW50Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQodE5vZGU6IFROb2RlfG51bGwpIHtcbiAgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZSBzaG91bGQgZXhpc3QhJyk7XG4gIGFzc2VydERlZmluZWQodE5vZGUhLnBhcmVudCwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZSBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IGxWaWV3O1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TENvbnRhaW5lck9yVW5kZWZpbmVkKHZhbHVlOiBhbnkpOiBhc3NlcnRzIHZhbHVlIGlzIExDb250YWluZXJ8dW5kZWZpbmVkfFxuICAgIG51bGwge1xuICB2YWx1ZSAmJiBhc3NlcnRFcXVhbChpc0xDb250YWluZXIodmFsdWUpLCB0cnVlLCAnRXhwZWN0aW5nIExDb250YWluZXIgb3IgdW5kZWZpbmVkIG9yIG51bGwnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydExDb250YWluZXIodmFsdWU6IGFueSk6IGFzc2VydHMgdmFsdWUgaXMgTENvbnRhaW5lciB7XG4gIGFzc2VydERlZmluZWQodmFsdWUsICdMQ29udGFpbmVyIG11c3QgYmUgZGVmaW5lZCcpO1xuICBhc3NlcnRFcXVhbChpc0xDb250YWluZXIodmFsdWUpLCB0cnVlLCAnRXhwZWN0aW5nIExDb250YWluZXInKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydExWaWV3T3JVbmRlZmluZWQodmFsdWU6IGFueSk6IGFzc2VydHMgdmFsdWUgaXMgTFZpZXd8bnVsbHx1bmRlZmluZWQge1xuICB2YWx1ZSAmJiBhc3NlcnRFcXVhbChpc0xWaWV3KHZhbHVlKSwgdHJ1ZSwgJ0V4cGVjdGluZyBMVmlldyBvciB1bmRlZmluZWQgb3IgbnVsbCcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TFZpZXcodmFsdWU6IGFueSk6IGFzc2VydHMgdmFsdWUgaXMgTFZpZXcge1xuICBhc3NlcnREZWZpbmVkKHZhbHVlLCAnTFZpZXcgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGFzc2VydEVxdWFsKGlzTFZpZXcodmFsdWUpLCB0cnVlLCAnRXhwZWN0aW5nIExWaWV3Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXc6IFRWaWV3LCBlcnJNZXNzYWdlPzogc3RyaW5nKSB7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzLCB0cnVlLCBlcnJNZXNzYWdlIHx8ICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgY3JlYXRlIHBhc3MuJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXc6IFRWaWV3LCBlcnJNZXNzYWdlPzogc3RyaW5nKSB7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzLCB0cnVlLCBlcnJNZXNzYWdlIHx8ICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdXBkYXRlIHBhc3MuJyk7XG59XG5cbi8qKlxuICogVGhpcyBpcyBhIGJhc2ljIHNhbml0eSBjaGVjayB0aGF0IGFuIG9iamVjdCBpcyBwcm9iYWJseSBhIGRpcmVjdGl2ZSBkZWYuIERpcmVjdGl2ZURlZiBpc1xuICogYW4gaW50ZXJmYWNlLCBzbyB3ZSBjYW4ndCBkbyBhIGRpcmVjdCBpbnN0YW5jZW9mIGNoZWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RGlyZWN0aXZlRGVmPFQ+KG9iajogYW55KTogYXNzZXJ0cyBvYmogaXMgRGlyZWN0aXZlRGVmPFQ+IHtcbiAgaWYgKG9iai50eXBlID09PSB1bmRlZmluZWQgfHwgb2JqLnNlbGVjdG9ycyA9PSB1bmRlZmluZWQgfHwgb2JqLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3dFcnJvcihcbiAgICAgICAgYEV4cGVjdGVkIGEgRGlyZWN0aXZlRGVmL0NvbXBvbmVudERlZiBhbmQgdGhpcyBvYmplY3QgZG9lcyBub3Qgc2VlbSB0byBoYXZlIHRoZSBleHBlY3RlZCBzaGFwZS5gKTtcbiAgfVxufVxuIl19