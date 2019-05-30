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
import { SecurityContext } from '../../sanitization/security';
import { SANITIZER } from '../interfaces/view';
import { getProp as getOldProp, getSinglePropIndexValue as getOldSinglePropIndexValue } from '../styling/class_and_style_bindings';
import { getCurrentStyleSanitizer, setCurrentStyleSanitizer } from './state';
/** @type {?} */
const MAP_BASED_ENTRY_PROP_NAME = '--MAP--';
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * This function will also pre-fill the context with data
 * for map-based bindings.
 * @return {?}
 */
export function allocTStylingContext() {
    // because map-based bindings deal with a dynamic set of values, there
    // is no way to know ahead of time whether or not sanitization is required.
    // For this reason the configuration will always mark sanitization as active
    // (this means that when map-based values are applied then sanitization will
    // be checked against each property).
    /** @type {?} */
    const mapBasedConfig = 1 /* SanitizationRequired */;
    return [0 /* Initial */, 0, mapBasedConfig, 0, MAP_BASED_ENTRY_PROP_NAME];
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
function getPropConfig(context, index) {
    return ((/** @type {?} */ (context[index + 0 /* ConfigAndGuardOffset */]))) &
        1 /* Mask */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function isSanitizationRequired(context, index) {
    return (getPropConfig(context, index) & 1 /* SanitizationRequired */) > 0;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getGuardMask(context, index) {
    /** @type {?} */
    const configGuardValue = (/** @type {?} */ (context[index + 0 /* ConfigAndGuardOffset */]));
    return configGuardValue >> 1 /* TotalBits */;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} maskValue
 * @return {?}
 */
export function setGuardMask(context, index, maskValue) {
    /** @type {?} */
    const config = getPropConfig(context, index);
    /** @type {?} */
    const guardMask = maskValue << 1 /* TotalBits */;
    context[index + 0 /* ConfigAndGuardOffset */] = config | guardMask;
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
/**
 * Returns the current style sanitizer function for the given view.
 *
 * The default style sanitizer (which lives inside of `LView`) will
 * be returned depending on whether the `styleSanitizer` instruction
 * was called or not prior to any styling instructions running.
 * @param {?} lView
 * @return {?}
 */
export function getCurrentOrLViewSanitizer(lView) {
    /** @type {?} */
    const sanitizer = (/** @type {?} */ ((getCurrentStyleSanitizer() || lView[SANITIZER])));
    if (sanitizer && typeof sanitizer !== 'function') {
        setCurrentStyleSanitizer(sanitizer);
        return sanitizeUsingSanitizerObject;
    }
    return sanitizer;
}
/**
 * Style sanitization function that internally uses a `Sanitizer` instance to handle style
 * sanitization.
 * @type {?}
 */
const sanitizeUsingSanitizerObject = (/**
 * @param {?} prop
 * @param {?} value
 * @param {?} mode
 * @return {?}
 */
(prop, value, mode) => {
    /** @type {?} */
    const sanitizer = (/** @type {?} */ (getCurrentStyleSanitizer()));
    if (sanitizer) {
        if (mode & 2 /* SanitizeOnly */) {
            return sanitizer.sanitize(SecurityContext.STYLE, value);
        }
        else {
            return true;
        }
    }
    return value;
});
const ɵ0 = sanitizeUsingSanitizerObject;
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFHdkUsT0FBTyxFQUFRLFNBQVMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxPQUFPLElBQUksVUFBVSxFQUFFLHVCQUF1QixJQUFJLDBCQUEwQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFHakksT0FBTyxFQUFDLHdCQUF3QixFQUFFLHdCQUF3QixFQUFDLE1BQU0sU0FBUyxDQUFDOztNQUVyRSx5QkFBeUIsR0FBRyxTQUFTOzs7Ozs7OztBQVEzQyxNQUFNLFVBQVUsb0JBQW9COzs7Ozs7O1VBTTVCLGNBQWMsK0JBQXNEO0lBQzFFLE9BQU8sa0JBQThCLENBQUMsRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLHlCQUF5QixDQUFDLENBQUM7QUFDeEYsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLGNBQThCLEVBQUUsTUFBYyxFQUFFLGNBQXNCLEVBQUUsWUFBcUI7O1VBQ3pGLFdBQVcsR0FDYiwwQkFBMEIsQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUM7SUFDcEYsT0FBTyxVQUFVLENBQUMsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ2pELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDakYsT0FBTyxtQ0FBZ0QsR0FBRyxLQUFLLENBQUM7QUFDbEUsQ0FBQzs7Ozs7QUFFRCxTQUFTLFNBQVMsQ0FBQyxPQUF3QjtJQUN6QyxPQUFPLE9BQU8sd0JBQXFDLENBQUM7QUFDdEQsQ0FB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QSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FuaXRpemVyLCBTZWN1cml0eUNvbnRleHR9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFNBTklUSVpFUn0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0UHJvcCBhcyBnZXRPbGRQcm9wLCBnZXRTaW5nbGVQcm9wSW5kZXhWYWx1ZSBhcyBnZXRPbGRTaW5nbGVQcm9wSW5kZXhWYWx1ZX0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuXG5pbXBvcnQge0xTdHlsaW5nTWFwLCBMU3R5bGluZ01hcEluZGV4LCBUU3R5bGluZ0NvbmZpZ0ZsYWdzLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuL3N0YXRlJztcblxuY29uc3QgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSA9ICctLU1BUC0tJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyBwcmUtZmlsbCB0aGUgY29udGV4dCB3aXRoIGRhdGFcbiAqIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dCgpOiBUU3R5bGluZ0NvbnRleHQge1xuICAvLyBiZWNhdXNlIG1hcC1iYXNlZCBiaW5kaW5ncyBkZWFsIHdpdGggYSBkeW5hbWljIHNldCBvZiB2YWx1ZXMsIHRoZXJlXG4gIC8vIGlzIG5vIHdheSB0byBrbm93IGFoZWFkIG9mIHRpbWUgd2hldGhlciBvciBub3Qgc2FuaXRpemF0aW9uIGlzIHJlcXVpcmVkLlxuICAvLyBGb3IgdGhpcyByZWFzb24gdGhlIGNvbmZpZ3VyYXRpb24gd2lsbCBhbHdheXMgbWFyayBzYW5pdGl6YXRpb24gYXMgYWN0aXZlXG4gIC8vICh0aGlzIG1lYW5zIHRoYXQgd2hlbiBtYXAtYmFzZWQgdmFsdWVzIGFyZSBhcHBsaWVkIHRoZW4gc2FuaXRpemF0aW9uIHdpbGxcbiAgLy8gYmUgY2hlY2tlZCBhZ2FpbnN0IGVhY2ggcHJvcGVydHkpLlxuICBjb25zdCBtYXBCYXNlZENvbmZpZyA9IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZDtcbiAgcmV0dXJuIFtUU3R5bGluZ0NvbmZpZ0ZsYWdzLkluaXRpYWwsIDAsIG1hcEJhc2VkQ29uZmlnLCAwLCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FXTtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdGhhdCBhbGxvd3MgZm9yIGEgc3RyaW5nLWJhc2VkIHByb3BlcnR5IG5hbWUgdG8gYmVcbiAqIG9idGFpbmVkIGZyb20gYW4gaW5kZXgtYmFzZWQgcHJvcGVydHkgaWRlbnRpZmllci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBjb2RlICh3aGljaFxuICogbGl2ZXMgaW5zaWRlIG9mIGByZW5kZXIzL3N0eWxpbmdfbmV4dC9gKSByZXBsYWNlcyB0aGUgZXhpc3Rpbmcgc3R5bGluZ1xuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nTmFtZUZyb21JbmRleChcbiAgICBzdHlsaW5nQ29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2luZ2xlSW5kZXggPVxuICAgICAgZ2V0T2xkU2luZ2xlUHJvcEluZGV4VmFsdWUoc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBvZmZzZXQsIGlzQ2xhc3NCYXNlZCk7XG4gIHJldHVybiBnZXRPbGRQcm9wKHN0eWxpbmdDb250ZXh0LCBzaW5nbGVJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDb250ZXh0RGlyZWN0aXZlSW5kZXgoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl0gPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB2YWx1ZTogbnVtYmVyKSB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdBbmRHdWFyZE9mZnNldF0gYXMgbnVtYmVyKSAmXG4gICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuTWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoZ2V0UHJvcENvbmZpZyhjb250ZXh0LCBpbmRleCkgJiBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQpID4gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEd1YXJkTWFzayhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgY29uZmlnR3VhcmRWYWx1ZSA9IGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdBbmRHdWFyZE9mZnNldF0gYXMgbnVtYmVyO1xuICByZXR1cm4gY29uZmlnR3VhcmRWYWx1ZSA+PiBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuVG90YWxCaXRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0R3VhcmRNYXNrKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgbWFza1ZhbHVlOiBudW1iZXIpIHtcbiAgY29uc3QgY29uZmlnID0gZ2V0UHJvcENvbmZpZyhjb250ZXh0LCBpbmRleCk7XG4gIGNvbnN0IGd1YXJkTWFzayA9IG1hc2tWYWx1ZSA8PCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuVG90YWxCaXRzO1xuICBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnQW5kR3VhcmRPZmZzZXRdID0gY29uZmlnIHwgZ3VhcmRNYXNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzQ291bnRPZmZzZXRdIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIG9mZnNldF0gYXMgbnVtYmVyIHwgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGluZGV4KTtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQgLSAxXSBhcyBzdHJpbmcgfFxuICAgICAgYm9vbGVhbiB8IG51bGw7XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgd2hldGhlciBvciBub3QgYSBjb250ZXh0IGlzXG4gKiBhbGxvd2VkIHRvIGJlIGZsdXNoZWQgYmFzZWQgb24gdGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSBpbmRleC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gaW5kZXggPT09IGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgc2V0Q29uZmlnKGNvbnRleHQsIGdldENvbmZpZyhjb250ZXh0KSB8IFRTdHlsaW5nQ29uZmlnRmxhZ3MuTG9ja2VkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZ0ZsYWdzLkxvY2tlZCkgPiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc0JpbmRpbmdzU3RhcnRQb3NpdGlvbiArXG4gICAgICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzVmFsdWVzQ291bnRQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01hcEJhc2VkKHByb3A6IHN0cmluZykge1xuICByZXR1cm4gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBMU3R5bGluZ01hcCB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogTFN0eWxpbmdNYXAgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9KTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtMU3R5bGluZ01hcEluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgY29uc3QgY29tcGFyZVZhbHVlQiA9IEFycmF5LmlzQXJyYXkoYikgPyBiW0xTdHlsaW5nTWFwSW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gOiBiO1xuICByZXR1cm4gY29tcGFyZVZhbHVlQSAhPT0gY29tcGFyZVZhbHVlQjtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHN0eWxpbmcgdmFsdWUgaXMgdHJ1dGh5IG9yIGZhbHN5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlOiBhbnkpIHtcbiAgLy8gdGhlIHJlYXNvbiB3aHkgbnVsbCBpcyBjb21wYXJlZCBhZ2FpbnN0IGlzIGJlY2F1c2VcbiAgLy8gYSBDU1MgY2xhc3MgdmFsdWUgdGhhdCBpcyBzZXQgdG8gYGZhbHNlYCBtdXN0IGJlXG4gIC8vIHJlc3BlY3RlZCAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIHRyZWF0ZWQgYXMgZmFsc3kpLlxuICAvLyBFbXB0eSBzdHJpbmcgdmFsdWVzIGFyZSBiZWNhdXNlIGRldmVsb3BlcnMgdXN1YWxseVxuICAvLyBzZXQgYSB2YWx1ZSB0byBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIGl0LlxuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJyc7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiB2aWV3LlxuICpcbiAqIFRoZSBkZWZhdWx0IHN0eWxlIHNhbml0aXplciAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBMVmlld2ApIHdpbGxcbiAqIGJlIHJldHVybmVkIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBgc3R5bGVTYW5pdGl6ZXJgIGluc3RydWN0aW9uXG4gKiB3YXMgY2FsbGVkIG9yIG5vdCBwcmlvciB0byBhbnkgc3R5bGluZyBpbnN0cnVjdGlvbnMgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRPckxWaWV3U2FuaXRpemVyKGxWaWV3OiBMVmlldyk6IFN0eWxlU2FuaXRpemVGbnxudWxsIHtcbiAgY29uc3Qgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCA9IChnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB8fCBsVmlld1tTQU5JVElaRVJdKSBhcyBhbnk7XG4gIGlmIChzYW5pdGl6ZXIgJiYgdHlwZW9mIHNhbml0aXplciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXIpO1xuICAgIHJldHVybiBzYW5pdGl6ZVVzaW5nU2FuaXRpemVyT2JqZWN0O1xuICB9XG4gIHJldHVybiBzYW5pdGl6ZXI7XG59XG5cbi8qKlxuICogU3R5bGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgaW50ZXJuYWxseSB1c2VzIGEgYFNhbml0aXplcmAgaW5zdGFuY2UgdG8gaGFuZGxlIHN0eWxlXG4gKiBzYW5pdGl6YXRpb24uXG4gKi9cbmNvbnN0IHNhbml0aXplVXNpbmdTYW5pdGl6ZXJPYmplY3Q6IFN0eWxlU2FuaXRpemVGbiA9XG4gICAgKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZywgbW9kZTogU3R5bGVTYW5pdGl6ZU1vZGUpID0+IHtcbiAgICAgIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpIGFzIFNhbml0aXplcjtcbiAgICAgIGlmIChzYW5pdGl6ZXIpIHtcbiAgICAgICAgaWYgKG1vZGUgJiBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIHtcbiAgICAgICAgICByZXR1cm4gc2FuaXRpemVyLnNhbml0aXplKFNlY3VyaXR5Q29udGV4dC5TVFlMRSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiJdfQ==