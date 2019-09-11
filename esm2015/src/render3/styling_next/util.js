/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NO_CHANGE } from '../tokens';
/** @type {?} */
const MAP_BASED_ENTRY_PROP_NAME = '--MAP--';
/** @type {?} */
const TEMPLATE_DIRECTIVE_INDEX = 0;
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
    return [
        initialStyling || [''],
        0 /* Initial */,
        TEMPLATE_DIRECTIVE_INDEX,
        mapBasedConfig,
        0,
        MAP_BASED_ENTRY_PROP_NAME,
    ];
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
    if (lastDirectiveIndex === TEMPLATE_DIRECTIVE_INDEX) {
        /** @type {?} */
        const currentValue = context[2 /* LastDirectiveIndexPosition */];
        if (currentValue > TEMPLATE_DIRECTIVE_INDEX) {
            // This means that a directive or two contained a host bindings function, but
            // now the template function also contains styling. When this combination of sources
            // comes up then we need to tell the context to store the state between updates
            // (because host bindings evaluation happens after template binding evaluation).
            markContextToPersistState(context);
        }
    }
    else {
        context[2 /* LastDirectiveIndexPosition */] = lastDirectiveIndex;
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
    if (b === NO_CHANGE)
        return false;
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
    return !Object.is(compareValueA, compareValueB);
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
    return (tNode.flags & 16 /* hasClassInput */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasStyleInput(tNode) {
    return (tNode.flags & 32 /* hasStyleInput */) !== 0;
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
/**
 * @param {?} classes
 * @return {?}
 */
export function forceClassesAsString(classes) {
    if (classes && typeof classes !== 'string') {
        classes = Object.keys(classes).join(' ');
    }
    return ((/** @type {?} */ (classes))) || '';
}
/**
 * @param {?} styles
 * @return {?}
 */
export function forceStylesAsString(styles) {
    /** @type {?} */
    let str = '';
    if (styles) {
        /** @type {?} */
        const props = Object.keys(styles);
        for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = props[i];
            str = concatString(str, `${prop}:${styles[prop]}`, ';');
        }
    }
    return str;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7O01BRzlCLHlCQUF5QixHQUFHLFNBQVM7O01BQ3JDLHdCQUF3QixHQUFHLENBQUM7Ozs7Ozs7Ozs7O0FBVWxDLE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxjQUF1Qzs7Ozs7OztVQU1wRSxjQUFjLCtCQUFzRDtJQUMxRSxPQUFPO1FBQ0wsY0FBYyxJQUFJLENBQUMsRUFBRSxDQUFDOztRQUV0Qix3QkFBd0I7UUFDeEIsY0FBYztRQUNkLENBQUM7UUFDRCx5QkFBeUI7S0FDMUIsQ0FBQztBQUNKLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLE9BQXdCLEVBQUUsa0JBQTBCO0lBQ3RELElBQUksa0JBQWtCLEtBQUssd0JBQXdCLEVBQUU7O2NBQzdDLFlBQVksR0FBRyxPQUFPLG9DQUFpRDtRQUM3RSxJQUFJLFlBQVksR0FBRyx3QkFBd0IsRUFBRTtZQUMzQyw2RUFBNkU7WUFDN0Usb0ZBQW9GO1lBQ3BGLCtFQUErRTtZQUMvRSxnRkFBZ0Y7WUFDaEYseUJBQXlCLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDcEM7S0FDRjtTQUFNO1FBQ0wsT0FBTyxvQ0FBaUQsR0FBRyxrQkFBa0IsQ0FBQztLQUMvRTtBQUNILENBQUM7Ozs7O0FBRUQsU0FBUyxTQUFTLENBQUMsT0FBd0I7SUFDekMsT0FBTyxPQUFPLHdCQUFxQyxDQUFDO0FBQ3RELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsT0FBd0IsRUFBRSxLQUFhO0lBQy9ELE9BQU8sd0JBQXFDLEdBQUcsS0FBSyxDQUFDO0FBQ3ZELENBQUM7Ozs7OztBQUVE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R0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3pEO0tBQ0Y7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29uZmlnRmxhZ3MsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuY29uc3QgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSA9ICctLU1BUC0tJztcbmNvbnN0IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA9IDA7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHVzZWQgYXMgYSBtYW5pZmVzdCBvZiBhbGwgc3R5bGUgb3IgYWxsIGNsYXNzIGJpbmRpbmdzIG9uXG4gKiBhbiBlbGVtZW50LiBCZWNhdXNlIGl0IGlzIGEgVC1sZXZlbCBkYXRhLXN0cnVjdHVyZSwgaXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyXG4gKiB0Tm9kZSBmb3Igc3R5bGVzIGFuZCBmb3IgY2xhc3Nlcy4gVGhpcyBmdW5jdGlvbiBhbGxvY2F0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYVxuICogYFRTdHlsaW5nQ29udGV4dGAgd2l0aCB0aGUgaW5pdGlhbCB2YWx1ZXMgKHNlZSBgaW50ZXJmYWNlcy50c2AgZm9yIG1vcmUgaW5mbykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dChpbml0aWFsU3R5bGluZz86IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiBUU3R5bGluZ0NvbnRleHQge1xuICAvLyBiZWNhdXNlIG1hcC1iYXNlZCBiaW5kaW5ncyBkZWFsIHdpdGggYSBkeW5hbWljIHNldCBvZiB2YWx1ZXMsIHRoZXJlXG4gIC8vIGlzIG5vIHdheSB0byBrbm93IGFoZWFkIG9mIHRpbWUgd2hldGhlciBvciBub3Qgc2FuaXRpemF0aW9uIGlzIHJlcXVpcmVkLlxuICAvLyBGb3IgdGhpcyByZWFzb24gdGhlIGNvbmZpZ3VyYXRpb24gd2lsbCBhbHdheXMgbWFyayBzYW5pdGl6YXRpb24gYXMgYWN0aXZlXG4gIC8vICh0aGlzIG1lYW5zIHRoYXQgd2hlbiBtYXAtYmFzZWQgdmFsdWVzIGFyZSBhcHBsaWVkIHRoZW4gc2FuaXRpemF0aW9uIHdpbGxcbiAgLy8gYmUgY2hlY2tlZCBhZ2FpbnN0IGVhY2ggcHJvcGVydHkpLlxuICBjb25zdCBtYXBCYXNlZENvbmZpZyA9IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZDtcbiAgcmV0dXJuIFtcbiAgICBpbml0aWFsU3R5bGluZyB8fCBbJyddLCAgLy8gZW1wdHkgaW5pdGlhbC1zdHlsaW5nIG1hcCB2YWx1ZVxuICAgIFRTdHlsaW5nQ29uZmlnRmxhZ3MuSW5pdGlhbCxcbiAgICBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsXG4gICAgbWFwQmFzZWRDb25maWcsXG4gICAgMCxcbiAgICBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FLFxuICBdO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSBhcyB0aGUgbGFzdCBkaXJlY3RpdmUgaW5kZXggaW4gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFN0eWxpbmcgaW4gQW5ndWxhciBjYW4gYmUgYXBwbGllZCBmcm9tIHRoZSB0ZW1wbGF0ZSBhcyB3ZWxsIGFzIG11bHRpcGxlIHNvdXJjZXMgb2ZcbiAqIGhvc3QgYmluZGluZ3MuIFRoaXMgbWVhbnMgdGhhdCBlYWNoIGJpbmRpbmcgZnVuY3Rpb24gKHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciB0aGVcbiAqIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMpIHdpbGwgZ2VuZXJhdGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXMgd2VsbCBhcyBhIHN0eWxpbmdcbiAqIGFwcGx5IGZ1bmN0aW9uIChpLmUuIGBzdHlsaW5nQXBwbHkoKWApLiBCZWNhdXNlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25zIGFuZCB0aGVcbiAqIHRlbXBsYXRlIGZ1bmN0aW9uIGFyZSBpbmRlcGVuZGVudCBmcm9tIG9uZSBhbm90aGVyIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3R5bGluZyBhcHBseVxuICogZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMuIEJ5IHRyYWNraW5nIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbmRleCAod2hpY2hcbiAqIGlzIHdoYXQgaGFwcGVucyBpbiB0aGlzIGZ1bmN0aW9uKSB0aGUgc3R5bGluZyBhbGdvcml0aG0ga25vd3MgZXhhY3RseSB3aGVuIHRvIGZsdXNoXG4gKiBzdHlsaW5nICh3aGljaCBpcyB3aGVuIHRoZSBsYXN0IHN0eWxpbmcgYXBwbHkgZnVuY3Rpb24gaXMgZXhlY3V0ZWQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTGFzdERpcmVjdGl2ZUluZGV4KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgbGFzdERpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGxhc3REaXJlY3RpdmVJbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKSB7XG4gICAgY29uc3QgY3VycmVudFZhbHVlID0gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5MYXN0RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl07XG4gICAgaWYgKGN1cnJlbnRWYWx1ZSA+IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCkge1xuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IGEgZGlyZWN0aXZlIG9yIHR3byBjb250YWluZWQgYSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLCBidXRcbiAgICAgIC8vIG5vdyB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gYWxzbyBjb250YWlucyBzdHlsaW5nLiBXaGVuIHRoaXMgY29tYmluYXRpb24gb2Ygc291cmNlc1xuICAgICAgLy8gY29tZXMgdXAgdGhlbiB3ZSBuZWVkIHRvIHRlbGwgdGhlIGNvbnRleHQgdG8gc3RvcmUgdGhlIHN0YXRlIGJldHdlZW4gdXBkYXRlc1xuICAgICAgLy8gKGJlY2F1c2UgaG9zdCBiaW5kaW5ncyBldmFsdWF0aW9uIGhhcHBlbnMgYWZ0ZXIgdGVtcGxhdGUgYmluZGluZyBldmFsdWF0aW9uKS5cbiAgICAgIG1hcmtDb250ZXh0VG9QZXJzaXN0U3RhdGUoY29udGV4dCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguTGFzdERpcmVjdGl2ZUluZGV4UG9zaXRpb25dID0gbGFzdERpcmVjdGl2ZUluZGV4O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdmFsdWU6IG51bWJlcikge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldFByb3BDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnQW5kR3VhcmRPZmZzZXRdIGFzIG51bWJlcikgJlxuICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLk1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKGdldFByb3BDb25maWcoY29udGV4dCwgaW5kZXgpICYgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkKSA+IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHdWFyZE1hc2soY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IGNvbmZpZ0d1YXJkVmFsdWUgPSBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnQW5kR3VhcmRPZmZzZXRdIGFzIG51bWJlcjtcbiAgcmV0dXJuIGNvbmZpZ0d1YXJkVmFsdWUgPj4gVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlRvdGFsQml0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEd1YXJkTWFzayhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG1hc2tWYWx1ZTogbnVtYmVyKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGdldFByb3BDb25maWcoY29udGV4dCwgaW5kZXgpO1xuICBjb25zdCBndWFyZE1hc2sgPSBtYXNrVmFsdWUgPDwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlRvdGFsQml0cztcbiAgY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ0FuZEd1YXJkT2Zmc2V0XSA9IGNvbmZpZyB8IGd1YXJkTWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlc0NvdW50KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc0NvdW50T2Zmc2V0XSBhcyBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBvZmZzZXRdIGFzIG51bWJlciB8IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpbmRleCk7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50IC0gMV0gYXMgc3RyaW5nIHxcbiAgICAgIGJvb2xlYW4gfCBudWxsO1xufVxuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB3aGljaCBkZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IGEgY29udGV4dCBpc1xuICogYWxsb3dlZCB0byBiZSBmbHVzaGVkIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBkaXJlY3RpdmUgaW5kZXguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd1N0eWxpbmdGbHVzaChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBudWxsLCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoY29udGV4dCAmJiBpbmRleCA9PT0gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5MYXN0RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl0pID8gdHJ1ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgc2V0Q29uZmlnKGNvbnRleHQsIGdldENvbmZpZyhjb250ZXh0KSB8IFRTdHlsaW5nQ29uZmlnRmxhZ3MuTG9ja2VkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZ0ZsYWdzLkxvY2tlZCkgPiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdGVJc1BlcnNpc3RlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZ0ZsYWdzLlBlcnNpc3RTdGF0ZVZhbHVlcykgPiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya0NvbnRleHRUb1BlcnNpc3RTdGF0ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgc2V0Q29uZmlnKGNvbnRleHQsIGdldENvbmZpZyhjb250ZXh0KSB8IFRTdHlsaW5nQ29uZmlnRmxhZ3MuUGVyc2lzdFN0YXRlVmFsdWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NCaW5kaW5nc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1ZhbHVlc0NvdW50UG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNYXBCYXNlZChwcm9wOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNWYWx1ZUNoYW5nZWQoXG4gICAgYTogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfCB7fSxcbiAgICBiOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8XG4gICAgICAgIHt9KTogYm9vbGVhbiB7XG4gIGlmIChiID09PSBOT19DSEFOR0UpIHJldHVybiBmYWxzZTtcblxuICBsZXQgY29tcGFyZVZhbHVlQSA9IEFycmF5LmlzQXJyYXkoYSkgPyBhW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgbGV0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG5cbiAgLy8gdGhlc2UgYXJlIHNwZWNpYWwgY2FzZXMgZm9yIFN0cmluZyBiYXNlZCB2YWx1ZXMgKHdoaWNoIGFyZSBjcmVhdGVkIGFzIGFydGlmYWN0c1xuICAvLyB3aGVuIHNhbml0aXphdGlvbiBpcyBieXBhc3NlZCBvbiBhIHBhcnRpY3VsYXIgdmFsdWUpXG4gIGlmIChjb21wYXJlVmFsdWVBIGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgY29tcGFyZVZhbHVlQSA9IGNvbXBhcmVWYWx1ZUEudG9TdHJpbmcoKTtcbiAgfVxuICBpZiAoY29tcGFyZVZhbHVlQiBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgIGNvbXBhcmVWYWx1ZUIgPSBjb21wYXJlVmFsdWVCLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuICFPYmplY3QuaXMoY29tcGFyZVZhbHVlQSwgY29tcGFyZVZhbHVlQik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBzdHlsaW5nIHZhbHVlIGlzIHRydXRoeSBvciBmYWxzeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZTogYW55KSB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0U3RyaW5nKGE6IHN0cmluZywgYjogc3RyaW5nLCBzZXBhcmF0b3IgPSAnICcpOiBzdHJpbmcge1xuICByZXR1cm4gYSArICgoYi5sZW5ndGggJiYgYS5sZW5ndGgpID8gc2VwYXJhdG9yIDogJycpICsgYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB2LmNoYXJBdCgwKSArICctJyArIHYuY2hhckF0KDEpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBmaW5kIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgIGluIGNhc2UgaXQgaXMgc3RvcmVkXG4gKiBpbnNpZGUgb2YgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAuIFdoZW4gYSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBpdFxuICogd2lsbCBjb3B5IG92ZXIgYW4gaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSB0Tm9kZSAod2hpY2ggYXJlIHN0b3JlZCBhcyBhXG4gKiBgU3R5bGluZ01hcEFycmF5YCBvbiB0aGUgYHROb2RlLmNsYXNzZXNgIG9yIGB0Tm9kZS5zdHlsZXNgIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOlxuICAgIFN0eWxpbmdNYXBBcnJheXxudWxsIHtcbiAgcmV0dXJuIGlzU3R5bGluZ0NvbnRleHQodmFsdWUpID9cbiAgICAgICh2YWx1ZSBhcyBUU3R5bGluZ0NvbnRleHQpW1RTdHlsaW5nQ29udGV4dEluZGV4LkluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbl0gOlxuICAgICAgdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgIHZhbHVlLmxlbmd0aCA+PSBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc0JpbmRpbmdzU3RhcnRQb3NpdGlvbiAmJlxuICAgICAgdHlwZW9mIHZhbHVlWzFdICE9PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IHN0cmluZyB7XG4gIGNvbnN0IG1hcCA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KTtcbiAgcmV0dXJuIG1hcCAmJiAobWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIGFzIHN0cmluZyB8IG51bGwpIHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsZUlucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFByb3AobWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAoc3R5bGVzKSB7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhzdHlsZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGAke3Byb3B9OiR7c3R5bGVzW3Byb3BdfWAsICc7Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG4iXX0=