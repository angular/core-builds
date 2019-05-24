/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { getProp as getOldProp, getSinglePropIndexValue as getOldSinglePropIndexValue } from '../styling/class_and_style_bindings';
/**
 * Creates a new instance of the `TStylingContext`.
 * @return {?}
 */
export function allocStylingContext() {
    return [0 /* Initial */, 0];
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
    return (/** @type {?} */ (context[index + 0 /* MaskOffset */]));
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
export function getValue(context, index, offset) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxPQUFPLElBQUksVUFBVSxFQUFFLHVCQUF1QixJQUFJLDBCQUEwQixFQUFDLE1BQU0scUNBQXFDLENBQUM7Ozs7O0FBTWpJLE1BQU0sVUFBVSxtQkFBbUI7SUFDakMsT0FBTyxrQkFBOEIsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLGNBQThCLEVBQUUsTUFBYyxFQUFFLGNBQXNCLEVBQUUsWUFBcUI7O1VBQ3pGLFdBQVcsR0FDYiwwQkFBMEIsQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUM7SUFDcEYsT0FBTyxVQUFVLENBQUMsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ2pELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDakYsT0FBTyxtQ0FBZ0QsR0FBRyxLQUFLLENBQUM7QUFDbEUsQ0FBQzs7Ozs7QUFFRCxTQUFTLFNBQVMsQ0FBQyxPQUF3QjtJQUN6QyxPQUFPLE9BQU8sd0JBQXFDLENBQUM7QUFDdEQsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDL0QsT0FBTyx3QkFBcUMsR0FBRyxLQUFLLENBQUM7QUFDdkQsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLE9BQU8sQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDN0QsT0FBTyxtQkFBQSxPQUFPLENBQUMsS0FBSyxxQkFBa0MsQ0FBQyxFQUFVLENBQUM7QUFDcEUsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDbEUsT0FBTyxtQkFBQSxPQUFPLENBQUMsS0FBSyxxQkFBa0MsQ0FBQyxFQUFVLENBQUM7QUFDcEUsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDcEUsT0FBTyxtQkFBQSxPQUFPLENBQUMsS0FBSyw0QkFBeUMsQ0FBQyxFQUFVLENBQUM7QUFDM0UsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxRQUFRLENBQUMsT0FBd0IsRUFBRSxLQUFhLEVBQUUsTUFBYztJQUM5RSxPQUFPLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLDhCQUEyQyxHQUFHLE1BQU0sQ0FBQyxFQUFtQixDQUFDO0FBQy9GLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBd0IsRUFBRSxLQUFhOztVQUMvRCxXQUFXLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7SUFDbEQsT0FBTyxtQkFBQSxPQUFPLENBQUMsS0FBSyw4QkFBMkMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQ2hFLENBQUM7QUFDckIsQ0FBQzs7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsT0FBd0IsRUFBRSxLQUFhO0lBQ3ZFLE9BQU8sS0FBSyxLQUFLLE9BQU8sbUNBQWdELENBQUM7QUFDM0UsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQXdCO0lBQ2xELFNBQVMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQkFBNkIsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QjtJQUN0RCxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQkFBNkIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Z2V0UHJvcCBhcyBnZXRPbGRQcm9wLCBnZXRTaW5nbGVQcm9wSW5kZXhWYWx1ZSBhcyBnZXRPbGRTaW5nbGVQcm9wSW5kZXhWYWx1ZX0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtUU3R5bGluZ0NvbmZpZ0ZsYWdzLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nQ29udGV4dCgpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gW1RTdHlsaW5nQ29uZmlnRmxhZ3MuSW5pdGlhbCwgMF07XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHRoYXQgYWxsb3dzIGZvciBhIHN0cmluZy1iYXNlZCBwcm9wZXJ0eSBuYW1lIHRvIGJlXG4gKiBvYnRhaW5lZCBmcm9tIGFuIGluZGV4LWJhc2VkIHByb3BlcnR5IGlkZW50aWZpZXIuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGJlIHJlbW92ZWQgb25jZSB0aGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgY29kZSAod2hpY2hcbiAqIGxpdmVzIGluc2lkZSBvZiBgcmVuZGVyMy9zdHlsaW5nX25leHQvYCkgcmVwbGFjZXMgdGhlIGV4aXN0aW5nIHN0eWxpbmdcbiAqIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ05hbWVGcm9tSW5kZXgoXG4gICAgc3R5bGluZ0NvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlciwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNpbmdsZUluZGV4ID1cbiAgICAgIGdldE9sZFNpbmdsZVByb3BJbmRleFZhbHVlKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgb2Zmc2V0LCBpc0NsYXNzQmFzZWQpO1xuICByZXR1cm4gZ2V0T2xkUHJvcChzdHlsaW5nQ29udGV4dCwgc2luZ2xlSW5kZXgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ29udGV4dERpcmVjdGl2ZUluZGV4KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4Lk1heERpcmVjdGl2ZUluZGV4UG9zaXRpb25dID0gaW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdmFsdWU6IG51bWJlcikge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHdWFyZE1hc2soY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFza09mZnNldF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzQ291bnRPZmZzZXRdIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgb2Zmc2V0XSBhcyBudW1iZXIgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaW5kZXgpO1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudCAtIDFdIGFzIHN0cmluZyB8XG4gICAgICBib29sZWFuIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCBhIGNvbnRleHQgaXNcbiAqIGFsbG93ZWQgdG8gYmUgZmx1c2hlZCBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlIGluZGV4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBpbmRleCA9PT0gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5NYXhEaXJlY3RpdmVJbmRleFBvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2tDb250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICBzZXRDb25maWcoY29udGV4dCwgZ2V0Q29uZmlnKGNvbnRleHQpIHwgVFN0eWxpbmdDb25maWdGbGFncy5Mb2NrZWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZXh0TG9ja2VkKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKGdldENvbmZpZyhjb250ZXh0KSAmIFRTdHlsaW5nQ29uZmlnRmxhZ3MuTG9ja2VkKSA+IDA7XG59XG4iXX0=