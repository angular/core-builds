/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { isDifferent } from '../util/misc_utils';
/** @type {?} */
const MAP_BASED_ENTRY_PROP_NAME = '--MAP--';
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * The `TStylingContext` is used as a manifest of all style or all class bindings on
 * an element. Because it is a T-level data-structure, it is only created once per
 * tNode for styles and for classes. This function allocates a new instance of a
 * `TStylingContext` with the initial values (see `interfaces.ts` for more info).
 * @param {?=} initialStyling
 * @return {?}
 */
export function allocTStylingContext(initialStyling) {
    // because map-based bindings deal with a dynamic set of values, there
    // is no way to know ahead of time whether or not sanitization is required.
    // For this reason the configuration will always mark sanitization as active
    // (this means that when map-based values are applied then sanitization will
    // be checked against each property).
    /** @type {?} */
    const mapBasedConfig = 1 /* SanitizationRequired */;
    /** @type {?} */
    const context = [
        initialStyling || null,
        0 /* Initial */,
        // the LastDirectiveIndex value in the context is used to track which directive is the last
        // to call `stylingApply()`. The `-1` value implies that no directive has been set yet.
        -1,
        mapBasedConfig,
        0,
        MAP_BASED_ENTRY_PROP_NAME,
    ];
    return context;
}
/**
 * Sets the provided directive as the last directive index in the provided `TStylingContext`.
 *
 * Styling in Angular can be applied from the template as well as multiple sources of
 * host bindings. This means that each binding function (the template function or the
 * hostBindings functions) will generate styling instructions as well as a styling
 * apply function (i.e. `stylingApply()`). Because host bindings functions and the
 * template function are independent from one another this means that the styling apply
 * function will be called multiple times. By tracking the last directive index (which
 * is what happens in this function) the styling algorithm knows exactly when to flush
 * styling (which is when the last styling apply function is executed).
 * @param {?} context
 * @param {?} lastDirectiveIndex
 * @return {?}
 */
export function updateLastDirectiveIndex(context, lastDirectiveIndex) {
    /** @type {?} */
    const currentValue = context[2 /* LastDirectiveIndexPosition */];
    if (lastDirectiveIndex !== currentValue) {
        context[2 /* LastDirectiveIndexPosition */] = lastDirectiveIndex;
        if (currentValue === 0 && lastDirectiveIndex > 0) {
            markContextToPersistState(context);
        }
    }
}
/**
 * @param {?} context
 * @return {?}
 */
function getConfig(context) {
    return context[1 /* ConfigPosition */];
}
/**
 * @param {?} context
 * @param {?} value
 * @return {?}
 */
export function setConfig(context, value) {
    context[1 /* ConfigPosition */] = value;
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
    return (context && index === context[2 /* LastDirectiveIndexPosition */]) ? true :
        false;
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
export function stateIsPersisted(context) {
    return (getConfig(context) & 2 /* PersistStateValues */) > 0;
}
/**
 * @param {?} context
 * @return {?}
 */
export function markContextToPersistState(context) {
    setConfig(context, getConfig(context) | 2 /* PersistStateValues */);
}
/**
 * @param {?} context
 * @return {?}
 */
export function getPropValuesStartPosition(context) {
    return 6 /* MapBindingsBindingsStartPosition */ +
        context[4 /* MapBindingsValuesCountPosition */];
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
    let compareValueA = Array.isArray(a) ? a[0 /* RawValuePosition */] : a;
    /** @type {?} */
    let compareValueB = Array.isArray(b) ? b[0 /* RawValuePosition */] : b;
    // these are special cases for String based values (which are created as artifacts
    // when sanitization is bypassed on a particular value)
    if (compareValueA instanceof String) {
        compareValueA = compareValueA.toString();
    }
    if (compareValueB instanceof String) {
        compareValueB = compareValueB.toString();
    }
    return isDifferent(compareValueA, compareValueB);
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
 * @param {?} a
 * @param {?} b
 * @param {?=} separator
 * @return {?}
 */
export function concatString(a, b, separator = ' ') {
    return a + ((b.length && a.length) ? separator : '') + b;
}
/**
 * @param {?} value
 * @return {?}
 */
export function hyphenate(value) {
    return value.replace(/[a-z][A-Z]/g, (/**
     * @param {?} v
     * @return {?}
     */
    v => v.charAt(0) + '-' + v.charAt(1))).toLowerCase();
}
/**
 * Returns an instance of `StylingMapArray`.
 *
 * This function is designed to find an instance of `StylingMapArray` in case it is stored
 * inside of an instance of `TStylingContext`. When a styling context is created it
 * will copy over an initial styling values from the tNode (which are stored as a
 * `StylingMapArray` on the `tNode.classes` or `tNode.styles` values).
 * @param {?} value
 * @return {?}
 */
export function getStylingMapArray(value) {
    return isStylingContext(value) ?
        ((/** @type {?} */ (value)))[0 /* InitialStylingValuePosition */] :
        value;
}
/**
 * @param {?} value
 * @return {?}
 */
export function isStylingContext(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) &&
        value.length >= 6 /* MapBindingsBindingsStartPosition */ &&
        typeof value[1] !== 'string';
}
/**
 * @param {?} context
 * @return {?}
 */
export function getInitialStylingValue(context) {
    /** @type {?} */
    const map = getStylingMapArray(context);
    return map && ((/** @type {?} */ (map[0 /* RawValuePosition */]))) || '';
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasClassInput(tNode) {
    return (tNode.flags & 8 /* hasClassInput */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasStyleInput(tNode) {
    return (tNode.flags & 16 /* hasStyleInput */) !== 0;
}
/**
 * @param {?} map
 * @param {?} index
 * @return {?}
 */
export function getMapProp(map, index) {
    return (/** @type {?} */ (map[index + 0 /* PropOffset */]));
}
/**
 * @param {?} map
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
export function setMapValue(map, index, value) {
    map[index + 1 /* ValueOffset */] = value;
}
/**
 * @param {?} map
 * @param {?} index
 * @return {?}
 */
export function getMapValue(map, index) {
    return (/** @type {?} */ (map[index + 1 /* ValueOffset */]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQzs7TUFJekMseUJBQXlCLEdBQUcsU0FBUzs7Ozs7Ozs7Ozs7QUFVM0MsTUFBTSxVQUFVLG9CQUFvQixDQUFDLGNBQXVDOzs7Ozs7O1VBTXBFLGNBQWMsK0JBQXNEOztVQUNwRSxPQUFPLEdBQW9CO1FBQy9CLGNBQWMsSUFBSSxJQUFJOztRQUV0QiwyRkFBMkY7UUFDM0YsdUZBQXVGO1FBQ3ZGLENBQUMsQ0FBQztRQUNGLGNBQWM7UUFDZCxDQUFDO1FBQ0QseUJBQXlCO0tBQzFCO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sVUFBVSx3QkFBd0IsQ0FDcEMsT0FBd0IsRUFBRSxrQkFBMEI7O1VBQ2hELFlBQVksR0FBRyxPQUFPLG9DQUFpRDtJQUM3RSxJQUFJLGtCQUFrQixLQUFLLFlBQVksRUFBRTtRQUN2QyxPQUFPLG9DQUFpRCxHQUFHLGtCQUFrQixDQUFDO1FBQzlFLElBQUksWUFBWSxLQUFLLENBQUMsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLEVBQUU7WUFDaEQseUJBQXlCLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDcEM7S0FDRjtBQUNILENBQUM7Ozs7O0FBRUQsU0FBUyxTQUFTLENBQUMsT0FBd0I7SUFDekMsT0FBTyxPQUFPLHdCQUFxQyxDQUFDO0FBQ3RELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsT0FBd0IsRUFBRSxLQUFhO0lBQy9ELE9BQU8sd0JBQXFDLEdBQUcsS0FBSyxDQUFDO0FBQ3ZELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxPQUFPLENBQUMsT0FB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QUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsR0FBb0IsRUFBRSxLQUFhO0lBQzVELE9BQU8sbUJBQUEsR0FBRyxDQUFDLEtBQUsscUJBQWtDLENBQUMsRUFBVSxDQUFDO0FBQ2hFLENBQUM7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixHQUFvQixFQUFFLEtBQWEsRUFBRSxLQUE4QjtJQUNyRSxHQUFHLENBQUMsS0FBSyxzQkFBbUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUN4RCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLEdBQW9CLEVBQUUsS0FBYTtJQUM3RCxPQUFPLG1CQUFBLEdBQUcsQ0FBQyxLQUFLLHNCQUFtQyxDQUFDLEVBQWlCLENBQUM7QUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7VE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGlmZmVyZW50fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuXG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29uZmlnRmxhZ3MsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuY29uc3QgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSA9ICctLU1BUC0tJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGUgYFRTdHlsaW5nQ29udGV4dGAgaXMgdXNlZCBhcyBhIG1hbmlmZXN0IG9mIGFsbCBzdHlsZSBvciBhbGwgY2xhc3MgYmluZGluZ3Mgb25cbiAqIGFuIGVsZW1lbnQuIEJlY2F1c2UgaXQgaXMgYSBULWxldmVsIGRhdGEtc3RydWN0dXJlLCBpdCBpcyBvbmx5IGNyZWF0ZWQgb25jZSBwZXJcbiAqIHROb2RlIGZvciBzdHlsZXMgYW5kIGZvciBjbGFzc2VzLiBUaGlzIGZ1bmN0aW9uIGFsbG9jYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhXG4gKiBgVFN0eWxpbmdDb250ZXh0YCB3aXRoIHRoZSBpbml0aWFsIHZhbHVlcyAoc2VlIGBpbnRlcmZhY2VzLnRzYCBmb3IgbW9yZSBpbmZvKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jVFN0eWxpbmdDb250ZXh0KGluaXRpYWxTdHlsaW5nPzogU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIC8vIGJlY2F1c2UgbWFwLWJhc2VkIGJpbmRpbmdzIGRlYWwgd2l0aCBhIGR5bmFtaWMgc2V0IG9mIHZhbHVlcywgdGhlcmVcbiAgLy8gaXMgbm8gd2F5IHRvIGtub3cgYWhlYWQgb2YgdGltZSB3aGV0aGVyIG9yIG5vdCBzYW5pdGl6YXRpb24gaXMgcmVxdWlyZWQuXG4gIC8vIEZvciB0aGlzIHJlYXNvbiB0aGUgY29uZmlndXJhdGlvbiB3aWxsIGFsd2F5cyBtYXJrIHNhbml0aXphdGlvbiBhcyBhY3RpdmVcbiAgLy8gKHRoaXMgbWVhbnMgdGhhdCB3aGVuIG1hcC1iYXNlZCB2YWx1ZXMgYXJlIGFwcGxpZWQgdGhlbiBzYW5pdGl6YXRpb24gd2lsbFxuICAvLyBiZSBjaGVja2VkIGFnYWluc3QgZWFjaCBwcm9wZXJ0eSkuXG4gIGNvbnN0IG1hcEJhc2VkQ29uZmlnID0gVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkO1xuICBjb25zdCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgPSBbXG4gICAgaW5pdGlhbFN0eWxpbmcgfHwgbnVsbCxcbiAgICBUU3R5bGluZ0NvbmZpZ0ZsYWdzLkluaXRpYWwsXG4gICAgLy8gdGhlIExhc3REaXJlY3RpdmVJbmRleCB2YWx1ZSBpbiB0aGUgY29udGV4dCBpcyB1c2VkIHRvIHRyYWNrIHdoaWNoIGRpcmVjdGl2ZSBpcyB0aGUgbGFzdFxuICAgIC8vIHRvIGNhbGwgYHN0eWxpbmdBcHBseSgpYC4gVGhlIGAtMWAgdmFsdWUgaW1wbGllcyB0aGF0IG5vIGRpcmVjdGl2ZSBoYXMgYmVlbiBzZXQgeWV0LlxuICAgIC0xLFxuICAgIG1hcEJhc2VkQ29uZmlnLFxuICAgIDAsXG4gICAgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSxcbiAgXTtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlIGFzIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbmRleCBpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogU3R5bGluZyBpbiBBbmd1bGFyIGNhbiBiZSBhcHBsaWVkIGZyb20gdGhlIHRlbXBsYXRlIGFzIHdlbGwgYXMgbXVsdGlwbGUgc291cmNlcyBvZlxuICogaG9zdCBiaW5kaW5ncy4gVGhpcyBtZWFucyB0aGF0IGVhY2ggYmluZGluZyBmdW5jdGlvbiAodGhlIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIHRoZVxuICogaG9zdEJpbmRpbmdzIGZ1bmN0aW9ucykgd2lsbCBnZW5lcmF0ZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhcyB3ZWxsIGFzIGEgc3R5bGluZ1xuICogYXBwbHkgZnVuY3Rpb24gKGkuZS4gYHN0eWxpbmdBcHBseSgpYCkuIEJlY2F1c2UgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbnMgYW5kIHRoZVxuICogdGVtcGxhdGUgZnVuY3Rpb24gYXJlIGluZGVwZW5kZW50IGZyb20gb25lIGFub3RoZXIgdGhpcyBtZWFucyB0aGF0IHRoZSBzdHlsaW5nIGFwcGx5XG4gKiBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcy4gQnkgdHJhY2tpbmcgdGhlIGxhc3QgZGlyZWN0aXZlIGluZGV4ICh3aGljaFxuICogaXMgd2hhdCBoYXBwZW5zIGluIHRoaXMgZnVuY3Rpb24pIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoZW4gdG8gZmx1c2hcbiAqIHN0eWxpbmcgKHdoaWNoIGlzIHdoZW4gdGhlIGxhc3Qgc3R5bGluZyBhcHBseSBmdW5jdGlvbiBpcyBleGVjdXRlZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVMYXN0RGlyZWN0aXZlSW5kZXgoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBsYXN0RGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjdXJyZW50VmFsdWUgPSBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4Lkxhc3REaXJlY3RpdmVJbmRleFBvc2l0aW9uXTtcbiAgaWYgKGxhc3REaXJlY3RpdmVJbmRleCAhPT0gY3VycmVudFZhbHVlKSB7XG4gICAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5MYXN0RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl0gPSBsYXN0RGlyZWN0aXZlSW5kZXg7XG4gICAgaWYgKGN1cnJlbnRWYWx1ZSA9PT0gMCAmJiBsYXN0RGlyZWN0aXZlSW5kZXggPiAwKSB7XG4gICAgICBtYXJrQ29udGV4dFRvUGVyc2lzdFN0YXRlKGNvbnRleHQpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHZhbHVlOiBudW1iZXIpIHtcbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ0FuZEd1YXJkT2Zmc2V0XSBhcyBudW1iZXIpICZcbiAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5NYXNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIChnZXRQcm9wQ29uZmlnKGNvbnRleHQsIGluZGV4KSAmIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCkgPiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R3VhcmRNYXNrKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBjb25maWdHdWFyZFZhbHVlID0gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ0FuZEd1YXJkT2Zmc2V0XSBhcyBudW1iZXI7XG4gIHJldHVybiBjb25maWdHdWFyZFZhbHVlID4+IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5Ub3RhbEJpdHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRHdWFyZE1hc2soY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBtYXNrVmFsdWU6IG51bWJlcikge1xuICBjb25zdCBjb25maWcgPSBnZXRQcm9wQ29uZmlnKGNvbnRleHQsIGluZGV4KTtcbiAgY29uc3QgZ3VhcmRNYXNrID0gbWFza1ZhbHVlIDw8IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5Ub3RhbEJpdHM7XG4gIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdBbmRHdWFyZE9mZnNldF0gPSBjb25maWcgfCBndWFyZE1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZXNDb3VudChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNDb3VudE9mZnNldF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgb2Zmc2V0XSBhcyBudW1iZXIgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaW5kZXgpO1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudCAtIDFdIGFzIHN0cmluZyB8XG4gICAgICBib29sZWFuIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCBhIGNvbnRleHQgaXNcbiAqIGFsbG93ZWQgdG8gYmUgZmx1c2hlZCBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlIGluZGV4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKGNvbnRleHQgJiYgaW5kZXggPT09IGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTGFzdERpcmVjdGl2ZUluZGV4UG9zaXRpb25dKSA/IHRydWUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9ja0NvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHNldENvbmZpZyhjb250ZXh0LCBnZXRDb25maWcoY29udGV4dCkgfCBUU3R5bGluZ0NvbmZpZ0ZsYWdzLkxvY2tlZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHRMb2NrZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgVFN0eWxpbmdDb25maWdGbGFncy5Mb2NrZWQpID4gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXRlSXNQZXJzaXN0ZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgVFN0eWxpbmdDb25maWdGbGFncy5QZXJzaXN0U3RhdGVWYWx1ZXMpID4gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtDb250ZXh0VG9QZXJzaXN0U3RhdGUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHNldENvbmZpZyhjb250ZXh0LCBnZXRDb25maWcoY29udGV4dCkgfCBUU3R5bGluZ0NvbmZpZ0ZsYWdzLlBlcnNpc3RTdGF0ZVZhbHVlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgcmV0dXJuIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzQmluZGluZ3NTdGFydFBvc2l0aW9uICtcbiAgICAgIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NWYWx1ZXNDb3VudFBvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFwQmFzZWQocHJvcDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGE6IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfCB7fSk6IGJvb2xlYW4ge1xuICBsZXQgY29tcGFyZVZhbHVlQSA9IEFycmF5LmlzQXJyYXkoYSkgPyBhW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgbGV0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG5cbiAgLy8gdGhlc2UgYXJlIHNwZWNpYWwgY2FzZXMgZm9yIFN0cmluZyBiYXNlZCB2YWx1ZXMgKHdoaWNoIGFyZSBjcmVhdGVkIGFzIGFydGlmYWN0c1xuICAvLyB3aGVuIHNhbml0aXphdGlvbiBpcyBieXBhc3NlZCBvbiBhIHBhcnRpY3VsYXIgdmFsdWUpXG4gIGlmIChjb21wYXJlVmFsdWVBIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgY29tcGFyZVZhbHVlQSA9IGNvbXBhcmVWYWx1ZUEudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAoY29tcGFyZVZhbHVlQiBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgIGNvbXBhcmVWYWx1ZUIgPSBjb21wYXJlVmFsdWVCLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIGlzRGlmZmVyZW50KGNvbXBhcmVWYWx1ZUEsIGNvbXBhcmVWYWx1ZUIpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZSBpcyB0cnV0aHkgb3IgZmFsc3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWU6IGFueSkge1xuICAvLyB0aGUgcmVhc29uIHdoeSBudWxsIGlzIGNvbXBhcmVkIGFnYWluc3QgaXMgYmVjYXVzZVxuICAvLyBhIENTUyBjbGFzcyB2YWx1ZSB0aGF0IGlzIHNldCB0byBgZmFsc2VgIG11c3QgYmVcbiAgLy8gcmVzcGVjdGVkIChvdGhlcndpc2UgaXQgd291bGQgYmUgdHJlYXRlZCBhcyBmYWxzeSkuXG4gIC8vIEVtcHR5IHN0cmluZyB2YWx1ZXMgYXJlIGJlY2F1c2UgZGV2ZWxvcGVycyB1c3VhbGx5XG4gIC8vIHNldCBhIHZhbHVlIHRvIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUgaXQuXG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHZhbHVlICE9PSAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdFN0cmluZyhhOiBzdHJpbmcsIGI6IHN0cmluZywgc2VwYXJhdG9yID0gJyAnKTogc3RyaW5nIHtcbiAgcmV0dXJuIGEgKyAoKGIubGVuZ3RoICYmIGEubGVuZ3RoKSA/IHNlcGFyYXRvciA6ICcnKSArIGI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoeXBoZW5hdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bYS16XVtBLVpdL2csIHYgPT4gdi5jaGFyQXQoMCkgKyAnLScgKyB2LmNoYXJBdCgxKSkudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gZmluZCBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YCBpbiBjYXNlIGl0IGlzIHN0b3JlZFxuICogaW5zaWRlIG9mIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgLiBXaGVuIGEgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgaXRcbiAqIHdpbGwgY29weSBvdmVyIGFuIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgZnJvbSB0aGUgdE5vZGUgKHdoaWNoIGFyZSBzdG9yZWQgYXMgYVxuICogYFN0eWxpbmdNYXBBcnJheWAgb24gdGhlIGB0Tm9kZS5jbGFzc2VzYCBvciBgdE5vZGUuc3R5bGVzYCB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcEFycmF5KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTpcbiAgICBTdHlsaW5nTWFwQXJyYXl8bnVsbCB7XG4gIHJldHVybiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlKSA/XG4gICAgICAodmFsdWUgYXMgVFN0eWxpbmdDb250ZXh0KVtUU3R5bGluZ0NvbnRleHRJbmRleC5Jbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb25dIDpcbiAgICAgIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZTogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IGJvb2xlYW4ge1xuICAvLyB0aGUgU3R5bGluZ01hcEFycmF5IGlzIGluIHRoZSBmb3JtYXQgb2YgW2luaXRpYWwsIHByb3AsIHN0cmluZywgcHJvcCwgc3RyaW5nXVxuICAvLyBhbmQgdGhpcyBpcyB0aGUgZGVmaW5pbmcgdmFsdWUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBhcnJheXNcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmXG4gICAgICB2YWx1ZS5sZW5ndGggPj0gVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NCaW5kaW5nc1N0YXJ0UG9zaXRpb24gJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVsxXSAhPT0gJ3N0cmluZyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiBzdHJpbmcge1xuICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gIHJldHVybiBtYXAgJiYgKG1hcFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSBhcyBzdHJpbmcgfCBudWxsKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3R5bGVJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBQcm9wKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcFZhbHVlKFxuICAgIG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBWYWx1ZShtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBudWxsO1xufVxuIl19