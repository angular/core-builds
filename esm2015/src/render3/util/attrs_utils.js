/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { isProceduralRenderer } from '../interfaces/renderer';
/**
 * Assigns all attribute values to the provided element via the inferred renderer.
 *
 * This function accepts two forms of attribute entries:
 *
 * default: (key, value):
 *  attrs = [key1, value1, key2, value2]
 *
 * namespaced: (NAMESPACE_MARKER, uri, name, value)
 *  attrs = [NAMESPACE_MARKER, uri, name, value, NAMESPACE_MARKER, uri, name, value]
 *
 * The `attrs` array can contain a mix of both the default and namespaced entries.
 * The "default" values are set without a marker, but if the function comes across
 * a marker value then it will attempt to set a namespaced value. If the marker is
 * not of a namespaced value then the function will quit and return the index value
 * where it stopped during the iteration of the attrs array.
 *
 * See [AttributeMarker] to understand what the namespace marker value is.
 *
 * Note that this instruction does not support assigning style and class values to
 * an element. See `elementStart` and `elementHostAttrs` to learn how styling values
 * are applied to an element.
 * @param {?} renderer The renderer to be used
 * @param {?} native The element that the attributes will be assigned to
 * @param {?} attrs The attribute array of values that will be assigned to the element
 * @return {?} the index value that was last accessed in the attributes array
 */
export function setUpAttributes(renderer, native, attrs) {
    /** @type {?} */
    const isProc = isProceduralRenderer(renderer);
    /** @type {?} */
    let i = 0;
    while (i < attrs.length) {
        /** @type {?} */
        const value = attrs[i];
        if (typeof value === 'number') {
            // only namespaces are supported. Other value types (such as style/class
            // entries) are not supported in this function.
            if (value !== 0 /* NamespaceURI */) {
                break;
            }
            // we just landed on the marker value ... therefore
            // we should skip to the next entry
            i++;
            /** @type {?} */
            const namespaceURI = (/** @type {?} */ (attrs[i++]));
            /** @type {?} */
            const attrName = (/** @type {?} */ (attrs[i++]));
            /** @type {?} */
            const attrVal = (/** @type {?} */ (attrs[i++]));
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProc ?
                ((/** @type {?} */ (renderer))).setAttribute(native, attrName, attrVal, namespaceURI) :
                native.setAttributeNS(namespaceURI, attrName, attrVal);
        }
        else {
            // attrName is string;
            /** @type {?} */
            const attrName = (/** @type {?} */ (value));
            /** @type {?} */
            const attrVal = attrs[++i];
            // Standard attributes
            ngDevMode && ngDevMode.rendererSetAttribute++;
            if (isAnimationProp(attrName)) {
                if (isProc) {
                    ((/** @type {?} */ (renderer))).setProperty(native, attrName, attrVal);
                }
            }
            else {
                isProc ?
                    ((/** @type {?} */ (renderer))).setAttribute(native, attrName, (/** @type {?} */ (attrVal))) :
                    native.setAttribute(attrName, (/** @type {?} */ (attrVal)));
            }
            i++;
        }
    }
    // another piece of code may iterate over the same attributes array. Therefore
    // it may be helpful to return the exact spot where the attributes array exited
    // whether by running into an unsupported marker or if all the static values were
    // iterated over.
    return i;
}
/**
 * Test whether the given value is a marker that indicates that the following
 * attribute values in a `TAttributes` array are only the names of attributes,
 * and not name-value pairs.
 * @param {?} marker The attribute marker to test.
 * @return {?} true if the marker is a "name-only" marker (e.g. `Bindings`, `Template` or `I18n`).
 */
export function isNameOnlyAttributeMarker(marker) {
    return marker === 3 /* Bindings */ || marker === 4 /* Template */ ||
        marker === 6 /* I18n */;
}
/**
 * @param {?} name
 * @return {?}
 */
export function isAnimationProp(name) {
    // Perf note: accessing charCodeAt to check for the first character of a string is faster as
    // compared to accessing a character at index 0 (ex. name[0]). The main reason for this is that
    // charCodeAt doesn't allocate memory to return a substring.
    return name.charCodeAt(0) === 64; // @
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cnNfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvYXR0cnNfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBMkMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThCdEcsTUFBTSxVQUFVLGVBQWUsQ0FBQyxRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBa0I7O1VBQ2pGLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUM7O1FBRXpDLENBQUMsR0FBRyxDQUFDO0lBQ1QsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTs7Y0FDakIsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0Isd0VBQXdFO1lBQ3hFLCtDQUErQztZQUMvQyxJQUFJLEtBQUsseUJBQWlDLEVBQUU7Z0JBQzFDLE1BQU07YUFDUDtZQUVELG1EQUFtRDtZQUNuRCxtQ0FBbUM7WUFDbkMsQ0FBQyxFQUFFLENBQUM7O2tCQUVFLFlBQVksR0FBRyxtQkFBQSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTs7a0JBQ25DLFFBQVEsR0FBRyxtQkFBQSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTs7a0JBQy9CLE9BQU8sR0FBRyxtQkFBQSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTtZQUNwQyxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDOUMsTUFBTSxDQUFDLENBQUM7Z0JBQ0osQ0FBQyxtQkFBQSxRQUFRLEVBQXVCLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVEO2FBQU07OztrQkFFQyxRQUFRLEdBQUcsbUJBQUEsS0FBSyxFQUFVOztrQkFDMUIsT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxQixzQkFBc0I7WUFDdEIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlDLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM3QixJQUFJLE1BQU0sRUFBRTtvQkFDVixDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUMxRTthQUNGO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxDQUFDO29CQUNKLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsbUJBQUEsT0FBTyxFQUFVLENBQUMsQ0FBQyxDQUFDO29CQUNyRixNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxtQkFBQSxPQUFPLEVBQVUsQ0FBQyxDQUFDO2FBQ3REO1lBQ0QsQ0FBQyxFQUFFLENBQUM7U0FDTDtLQUNGO0lBRUQsOEVBQThFO0lBQzlFLCtFQUErRTtJQUMvRSxpRkFBaUY7SUFDakYsaUJBQWlCO0lBQ2pCLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsTUFBOEM7SUFDdEYsT0FBTyxNQUFNLHFCQUE2QixJQUFJLE1BQU0scUJBQTZCO1FBQzdFLE1BQU0saUJBQXlCLENBQUM7QUFDdEMsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLElBQVk7SUFDMUMsNEZBQTRGO0lBQzVGLCtGQUErRjtJQUMvRiw0REFBNEQ7SUFDNUQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFFLElBQUk7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3J9IGZyb20gJy4uL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuXG4vKipcbiAqIEFzc2lnbnMgYWxsIGF0dHJpYnV0ZSB2YWx1ZXMgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQgdmlhIHRoZSBpbmZlcnJlZCByZW5kZXJlci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFjY2VwdHMgdHdvIGZvcm1zIG9mIGF0dHJpYnV0ZSBlbnRyaWVzOlxuICpcbiAqIGRlZmF1bHQ6IChrZXksIHZhbHVlKTpcbiAqICBhdHRycyA9IFtrZXkxLCB2YWx1ZTEsIGtleTIsIHZhbHVlMl1cbiAqXG4gKiBuYW1lc3BhY2VkOiAoTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZSlcbiAqICBhdHRycyA9IFtOQU1FU1BBQ0VfTUFSS0VSLCB1cmksIG5hbWUsIHZhbHVlLCBOQU1FU1BBQ0VfTUFSS0VSLCB1cmksIG5hbWUsIHZhbHVlXVxuICpcbiAqIFRoZSBgYXR0cnNgIGFycmF5IGNhbiBjb250YWluIGEgbWl4IG9mIGJvdGggdGhlIGRlZmF1bHQgYW5kIG5hbWVzcGFjZWQgZW50cmllcy5cbiAqIFRoZSBcImRlZmF1bHRcIiB2YWx1ZXMgYXJlIHNldCB3aXRob3V0IGEgbWFya2VyLCBidXQgaWYgdGhlIGZ1bmN0aW9uIGNvbWVzIGFjcm9zc1xuICogYSBtYXJrZXIgdmFsdWUgdGhlbiBpdCB3aWxsIGF0dGVtcHQgdG8gc2V0IGEgbmFtZXNwYWNlZCB2YWx1ZS4gSWYgdGhlIG1hcmtlciBpc1xuICogbm90IG9mIGEgbmFtZXNwYWNlZCB2YWx1ZSB0aGVuIHRoZSBmdW5jdGlvbiB3aWxsIHF1aXQgYW5kIHJldHVybiB0aGUgaW5kZXggdmFsdWVcbiAqIHdoZXJlIGl0IHN0b3BwZWQgZHVyaW5nIHRoZSBpdGVyYXRpb24gb2YgdGhlIGF0dHJzIGFycmF5LlxuICpcbiAqIFNlZSBbQXR0cmlidXRlTWFya2VyXSB0byB1bmRlcnN0YW5kIHdoYXQgdGhlIG5hbWVzcGFjZSBtYXJrZXIgdmFsdWUgaXMuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaW5zdHJ1Y3Rpb24gZG9lcyBub3Qgc3VwcG9ydCBhc3NpZ25pbmcgc3R5bGUgYW5kIGNsYXNzIHZhbHVlcyB0b1xuICogYW4gZWxlbWVudC4gU2VlIGBlbGVtZW50U3RhcnRgIGFuZCBgZWxlbWVudEhvc3RBdHRyc2AgdG8gbGVhcm4gaG93IHN0eWxpbmcgdmFsdWVzXG4gKiBhcmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICogQHBhcmFtIHJlbmRlcmVyIFRoZSByZW5kZXJlciB0byBiZSB1c2VkXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBlbGVtZW50IHRoYXQgdGhlIGF0dHJpYnV0ZXMgd2lsbCBiZSBhc3NpZ25lZCB0b1xuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGUgYXJyYXkgb2YgdmFsdWVzIHRoYXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgZWxlbWVudFxuICogQHJldHVybnMgdGhlIGluZGV4IHZhbHVlIHRoYXQgd2FzIGxhc3QgYWNjZXNzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhyZW5kZXJlcjogUmVuZGVyZXIzLCBuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogVEF0dHJpYnV0ZXMpOiBudW1iZXIge1xuICBjb25zdCBpc1Byb2MgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG5cbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbaV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIG9ubHkgbmFtZXNwYWNlcyBhcmUgc3VwcG9ydGVkLiBPdGhlciB2YWx1ZSB0eXBlcyAoc3VjaCBhcyBzdHlsZS9jbGFzc1xuICAgICAgLy8gZW50cmllcykgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBmdW5jdGlvbi5cbiAgICAgIGlmICh2YWx1ZSAhPT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gd2UganVzdCBsYW5kZWQgb24gdGhlIG1hcmtlciB2YWx1ZSAuLi4gdGhlcmVmb3JlXG4gICAgICAvLyB3ZSBzaG91bGQgc2tpcCB0byB0aGUgbmV4dCBlbnRyeVxuICAgICAgaSsrO1xuXG4gICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBpc1Byb2MgP1xuICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCwgbmFtZXNwYWNlVVJJKSA6XG4gICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgYXR0ck5hbWUsIGF0dHJWYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBhdHRyTmFtZSBpcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHZhbHVlIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1srK2ldO1xuICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGlzQW5pbWF0aW9uUHJvcChhdHRyTmFtZSkpIHtcbiAgICAgICAgaWYgKGlzUHJvYykge1xuICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRQcm9wZXJ0eShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICAvLyBhbm90aGVyIHBpZWNlIG9mIGNvZGUgbWF5IGl0ZXJhdGUgb3ZlciB0aGUgc2FtZSBhdHRyaWJ1dGVzIGFycmF5LiBUaGVyZWZvcmVcbiAgLy8gaXQgbWF5IGJlIGhlbHBmdWwgdG8gcmV0dXJuIHRoZSBleGFjdCBzcG90IHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFycmF5IGV4aXRlZFxuICAvLyB3aGV0aGVyIGJ5IHJ1bm5pbmcgaW50byBhbiB1bnN1cHBvcnRlZCBtYXJrZXIgb3IgaWYgYWxsIHRoZSBzdGF0aWMgdmFsdWVzIHdlcmVcbiAgLy8gaXRlcmF0ZWQgb3Zlci5cbiAgcmV0dXJuIGk7XG59XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIG1hcmtlciB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmdcbiAqIGF0dHJpYnV0ZSB2YWx1ZXMgaW4gYSBgVEF0dHJpYnV0ZXNgIGFycmF5IGFyZSBvbmx5IHRoZSBuYW1lcyBvZiBhdHRyaWJ1dGVzLFxuICogYW5kIG5vdCBuYW1lLXZhbHVlIHBhaXJzLlxuICogQHBhcmFtIG1hcmtlciBUaGUgYXR0cmlidXRlIG1hcmtlciB0byB0ZXN0LlxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgbWFya2VyIGlzIGEgXCJuYW1lLW9ubHlcIiBtYXJrZXIgKGUuZy4gYEJpbmRpbmdzYCwgYFRlbXBsYXRlYCBvciBgSTE4bmApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcihtYXJrZXI6IHN0cmluZyB8IEF0dHJpYnV0ZU1hcmtlciB8IENzc1NlbGVjdG9yKSB7XG4gIHJldHVybiBtYXJrZXIgPT09IEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncyB8fCBtYXJrZXIgPT09IEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSB8fFxuICAgICAgbWFya2VyID09PSBBdHRyaWJ1dGVNYXJrZXIuSTE4bjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQW5pbWF0aW9uUHJvcChuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgLy8gUGVyZiBub3RlOiBhY2Nlc3NpbmcgY2hhckNvZGVBdCB0byBjaGVjayBmb3IgdGhlIGZpcnN0IGNoYXJhY3RlciBvZiBhIHN0cmluZyBpcyBmYXN0ZXIgYXNcbiAgLy8gY29tcGFyZWQgdG8gYWNjZXNzaW5nIGEgY2hhcmFjdGVyIGF0IGluZGV4IDAgKGV4LiBuYW1lWzBdKS4gVGhlIG1haW4gcmVhc29uIGZvciB0aGlzIGlzIHRoYXRcbiAgLy8gY2hhckNvZGVBdCBkb2Vzbid0IGFsbG9jYXRlIG1lbW9yeSB0byByZXR1cm4gYSBzdWJzdHJpbmcuXG4gIHJldHVybiBuYW1lLmNoYXJDb2RlQXQoMCkgPT09IDY0OyAgLy8gQFxufVxuIl19