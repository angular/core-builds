/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { getProp as getOldProp, getSinglePropIndexValue as getOldSinglePropIndexValue } from '../styling/class_and_style_bindings';
/** @type {?} */
const MAP_BASED_ENTRY_PROP_NAME = '--MAP--';
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * This function will also pre-fill the context with data
 * for map-based bindings.
 * @return {?}
 */
export function allocStylingContext() {
    return [0 /* Initial */, 0, 0, 0, MAP_BASED_ENTRY_PROP_NAME];
}
/**
 * Temporary function that allows for a string-based property name to be
 * obtained from an index-based property identifier.
 *
 * This function will be removed once the new styling refactor code (which
 * lives inside of `render3/styling_next/`) replaces the existing styling
 * implementation.
 * @param {?} stylingContext
 * @param {?} offset
 * @param {?} directiveIndex
 * @param {?} isClassBased
 * @return {?}
 */
export function getBindingNameFromIndex(stylingContext, offset, directiveIndex, isClassBased) {
    /** @type {?} */
    const singleIndex = getOldSinglePropIndexValue(stylingContext, directiveIndex, offset, isClassBased);
    return getOldProp(stylingContext, singleIndex);
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function updateContextDirectiveIndex(context, index) {
    context[1 /* MaxDirectiveIndexPosition */] = index;
}
/**
 * @param {?} context
 * @return {?}
 */
function getConfig(context) {
    return context[0 /* ConfigPosition */];
}
/**
 * @param {?} context
 * @param {?} value
 * @return {?}
 */
export function setConfig(context, value) {
    context[0 /* ConfigPosition */] = value;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getProp(context, index) {
    return (/** @type {?} */ (context[index + 2 /* PropOffset */]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getGuardMask(context, index) {
    return (/** @type {?} */ (context[index + 0 /* GuardOffset */]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getValuesCount(context, index) {
    return (/** @type {?} */ (context[index + 1 /* ValuesCountOffset */]));
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} offset
 * @return {?}
 */
export function getBindingValue(context, index, offset) {
    return (/** @type {?} */ (context[index + 3 /* BindingsStartOffset */ + offset]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getDefaultValue(context, index) {
    /** @type {?} */
    const valuesCount = getValuesCount(context, index);
    return (/** @type {?} */ (context[index + 3 /* BindingsStartOffset */ + valuesCount - 1]));
}
/**
 * Temporary function which determines whether or not a context is
 * allowed to be flushed based on the provided directive index.
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function allowStylingFlush(context, index) {
    return index === context[1 /* MaxDirectiveIndexPosition */];
}
/**
 * @param {?} context
 * @return {?}
 */
export function lockContext(context) {
    setConfig(context, getConfig(context) | 1 /* Locked */);
}
/**
 * @param {?} context
 * @return {?}
 */
export function isContextLocked(context) {
    return (getConfig(context) & 1 /* Locked */) > 0;
}
/**
 * @param {?} context
 * @return {?}
 */
export function getPropValuesStartPosition(context) {
    return 5 /* MapBindingsBindingsStartPosition */ +
        context[3 /* MapBindingsValuesCountPosition */];
}
/**
 * @param {?} prop
 * @return {?}
 */
export function isMapBased(prop) {
    return prop === MAP_BASED_ENTRY_PROP_NAME;
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function hasValueChanged(a, b) {
    /** @type {?} */
    const compareValueA = Array.isArray(a) ? a[0 /* RawValuePosition */] : a;
    /** @type {?} */
    const compareValueB = Array.isArray(b) ? b[0 /* RawValuePosition */] : b;
    return compareValueA !== compareValueB;
}
/**
 * Determines whether the provided styling value is truthy or falsy.
 * @param {?} value
 * @return {?}
 */
export function isStylingValueDefined(value) {
    // the reason why null is compared against is because
    // a CSS class value that is set to `false` must be
    // respected (otherwise it would be treated as falsy).
    // Empty string values are because developers usually
    // set a value to an empty string to remove it.
    return value != null && value !== '';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxPQUFPLElBQUksVUFBVSxFQUFFLHVCQUF1QixJQUFJLDBCQUEwQixFQUFDLE1BQU0scUNBQXFDLENBQUM7O01BSTNILHlCQUF5QixHQUFHLFNBQVM7Ozs7Ozs7O0FBUTNDLE1BQU0sVUFBVSxtQkFBbUI7SUFDakMsT0FBTyxrQkFBOEIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUseUJBQXlCLENBQUMsQ0FBQztBQUMzRSxDQUFDOzs7Ozs7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsY0FBOEIsRUFBRSxNQUFjLEVBQUUsY0FBc0IsRUFBRSxZQUFxQjs7VUFDekYsV0FBVyxHQUNiLDBCQUEwQixDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQztJQUNwRixPQUFPLFVBQVUsQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakQsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLDJCQUEyQixDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUNqRixPQUFPLG1DQUFnRCxHQUFHLEtBQUssQ0FBQztBQUNsRSxDQUFDOzs7OztBQUVELFNBQVMsU0FBUyxDQUFDLE9BQXdCO0lBQ3pDLE9BQU8sT0FBTyx3QkFBcUMsQ0FBQztBQUN0RCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUMvRCxPQUFPLHdCQUFxQyxHQUFHLEtBQUssQ0FBQztBQUN2RCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUM3RCxPQUFPLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLHFCQUFrQyxDQUFDLEVBQVUsQ0FBQztBQUNwRSxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUNsRSxPQUFPLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLHNCQUFtQyxDQUFDLEVBQVUsQ0FBQztBQUNyRSxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUNwRSxPQUFPLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLDRCQUF5QyxDQUFDLEVBQVUsQ0FBQztBQUMzRSxDQUFDOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QixFQUFFLEtBQWEsRUFBRSxNQUFjO0lBQ3JGLE9BQU8sbUJBQUEsT0FBTyxDQUFDLEtBQUssOEJBQTJDLEdBQUcsTUFBTSxDQUFDLEVBQW1CLENBQUM7QUFDL0YsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QixFQUFFLEtBQWE7O1VBQy9ELFdBQVcsR0FBRyxjQUFjLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQztJQUNsRCxPQUFPLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLDhCQUEyQyxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUMsRUFDaEUsQ0FBQztBQUNyQixDQUFDOzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDdkUsT0FBTyxLQUFLLEtBQUssT0FBTyxtQ0FBZ0QsQ0FBQztBQUMzRSxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBd0I7SUFDbEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUE2QixDQUFDLENBQUM7QUFDdEUsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQXdCO0lBQ3RELE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUE2QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9ELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDBCQUEwQixDQUFDLE9BQXdCO0lBQ2pFLE9BQU87UUFDSCxPQUFPLHdDQUFxRCxDQUFDO0FBQ25FLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxJQUFZO0lBQ3JDLE9BQU8sSUFBSSxLQUFLLHlCQUF5QixDQUFDO0FBQzVDLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxlQUFlLENBQzNCLENBQTJFLEVBQzNFLENBQTJFOztVQUN2RSxhQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQywwQkFBbUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7VUFDM0UsYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsMEJBQW1DLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakYsT0FBTyxhQUFhLEtBQUssYUFBYSxDQUFDO0FBQ3pDLENBQUM7Ozs7OztBQUtELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFVO0lBQzlDLHFEQUFxRDtJQUNyRCxtREFBbUQ7SUFDbkQsc0RBQXNEO0lBQ3RELHFEQUFxRDtJQUNyRCwrQ0FBK0M7SUFDL0MsT0FBTyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFLENBQUM7QUFDdkMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2dldFByb3AgYXMgZ2V0T2xkUHJvcCwgZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUgYXMgZ2V0T2xkU2luZ2xlUHJvcEluZGV4VmFsdWV9IGZyb20gJy4uL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcblxuaW1wb3J0IHtMU3R5bGluZ01hcCwgTFN0eWxpbmdNYXBJbmRleCwgVFN0eWxpbmdDb25maWdGbGFncywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuY29uc3QgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSA9ICctLU1BUC0tJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyBwcmUtZmlsbCB0aGUgY29udGV4dCB3aXRoIGRhdGFcbiAqIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdDb250ZXh0KCk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBbVFN0eWxpbmdDb25maWdGbGFncy5Jbml0aWFsLCAwLCAwLCAwLCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FXTtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdGhhdCBhbGxvd3MgZm9yIGEgc3RyaW5nLWJhc2VkIHByb3BlcnR5IG5hbWUgdG8gYmVcbiAqIG9idGFpbmVkIGZyb20gYW4gaW5kZXgtYmFzZWQgcHJvcGVydHkgaWRlbnRpZmllci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBjb2RlICh3aGljaFxuICogbGl2ZXMgaW5zaWRlIG9mIGByZW5kZXIzL3N0eWxpbmdfbmV4dC9gKSByZXBsYWNlcyB0aGUgZXhpc3Rpbmcgc3R5bGluZ1xuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nTmFtZUZyb21JbmRleChcbiAgICBzdHlsaW5nQ29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2luZ2xlSW5kZXggPVxuICAgICAgZ2V0T2xkU2luZ2xlUHJvcEluZGV4VmFsdWUoc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBvZmZzZXQsIGlzQ2xhc3NCYXNlZCk7XG4gIHJldHVybiBnZXRPbGRQcm9wKHN0eWxpbmdDb250ZXh0LCBzaW5nbGVJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDb250ZXh0RGlyZWN0aXZlSW5kZXgoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl0gPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB2YWx1ZTogbnVtYmVyKSB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEd1YXJkTWFzayhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5HdWFyZE9mZnNldF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzQ291bnRPZmZzZXRdIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIG9mZnNldF0gYXMgbnVtYmVyIHwgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGluZGV4KTtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQgLSAxXSBhcyBzdHJpbmcgfFxuICAgICAgYm9vbGVhbiB8IG51bGw7XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgd2hldGhlciBvciBub3QgYSBjb250ZXh0IGlzXG4gKiBhbGxvd2VkIHRvIGJlIGZsdXNoZWQgYmFzZWQgb24gdGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSBpbmRleC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gaW5kZXggPT09IGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgc2V0Q29uZmlnKGNvbnRleHQsIGdldENvbmZpZyhjb250ZXh0KSB8IFRTdHlsaW5nQ29uZmlnRmxhZ3MuTG9ja2VkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZ0ZsYWdzLkxvY2tlZCkgPiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc0JpbmRpbmdzU3RhcnRQb3NpdGlvbiArXG4gICAgICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzVmFsdWVzQ291bnRQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01hcEJhc2VkKHByb3A6IHN0cmluZykge1xuICByZXR1cm4gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBMU3R5bGluZ01hcCB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogTFN0eWxpbmdNYXAgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9KTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtMU3R5bGluZ01hcEluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgY29uc3QgY29tcGFyZVZhbHVlQiA9IEFycmF5LmlzQXJyYXkoYikgPyBiW0xTdHlsaW5nTWFwSW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gOiBiO1xuICByZXR1cm4gY29tcGFyZVZhbHVlQSAhPT0gY29tcGFyZVZhbHVlQjtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHN0eWxpbmcgdmFsdWUgaXMgdHJ1dGh5IG9yIGZhbHN5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlOiBhbnkpIHtcbiAgLy8gdGhlIHJlYXNvbiB3aHkgbnVsbCBpcyBjb21wYXJlZCBhZ2FpbnN0IGlzIGJlY2F1c2VcbiAgLy8gYSBDU1MgY2xhc3MgdmFsdWUgdGhhdCBpcyBzZXQgdG8gYGZhbHNlYCBtdXN0IGJlXG4gIC8vIHJlc3BlY3RlZCAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIHRyZWF0ZWQgYXMgZmFsc3kpLlxuICAvLyBFbXB0eSBzdHJpbmcgdmFsdWVzIGFyZSBiZWNhdXNlIGRldmVsb3BlcnMgdXN1YWxseVxuICAvLyBzZXQgYSB2YWx1ZSB0byBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIGl0LlxuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJyc7XG59XG4iXX0=