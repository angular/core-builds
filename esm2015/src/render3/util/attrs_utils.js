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
                    ((/** @type {?} */ (renderer)))
                        .setAttribute(native, (/** @type {?} */ (attrName)), (/** @type {?} */ (attrVal))) :
                    native.setAttribute((/** @type {?} */ (attrName)), (/** @type {?} */ (attrVal)));
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
/** @type {?} */
export const ANIMATION_PROP_PREFIX = '@';
/**
 * @param {?} name
 * @return {?}
 */
export function isAnimationProp(name) {
    return name[0] === ANIMATION_PROP_PREFIX;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cnNfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvYXR0cnNfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBMkMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThCdEcsTUFBTSxVQUFVLGVBQWUsQ0FBQyxRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBa0I7O1VBQ2pGLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUM7O1FBRXpDLENBQUMsR0FBRyxDQUFDO0lBQ1QsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTs7Y0FDakIsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0Isd0VBQXdFO1lBQ3hFLCtDQUErQztZQUMvQyxJQUFJLEtBQUsseUJBQWlDLEVBQUU7Z0JBQzFDLE1BQU07YUFDUDtZQUVELG1EQUFtRDtZQUNuRCxtQ0FBbUM7WUFDbkMsQ0FBQyxFQUFFLENBQUM7O2tCQUVFLFlBQVksR0FBRyxtQkFBQSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTs7a0JBQ25DLFFBQVEsR0FBRyxtQkFBQSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTs7a0JBQy9CLE9BQU8sR0FBRyxtQkFBQSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTtZQUNwQyxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDOUMsTUFBTSxDQUFDLENBQUM7Z0JBQ0osQ0FBQyxtQkFBQSxRQUFRLEVBQXVCLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVEO2FBQU07OztrQkFFQyxRQUFRLEdBQUcsbUJBQUEsS0FBSyxFQUFVOztrQkFDMUIsT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxQixzQkFBc0I7WUFDdEIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlDLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUM3QixJQUFJLE1BQU0sRUFBRTtvQkFDVixDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUMxRTthQUNGO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxDQUFDO29CQUNKLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDO3lCQUM1QixZQUFZLENBQUMsTUFBTSxFQUFFLG1CQUFBLFFBQVEsRUFBVSxFQUFFLG1CQUFBLE9BQU8sRUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDbEUsTUFBTSxDQUFDLFlBQVksQ0FBQyxtQkFBQSxRQUFRLEVBQVUsRUFBRSxtQkFBQSxPQUFPLEVBQVUsQ0FBQyxDQUFDO2FBQ2hFO1lBQ0QsQ0FBQyxFQUFFLENBQUM7U0FDTDtLQUNGO0lBRUQsOEVBQThFO0lBQzlFLCtFQUErRTtJQUMvRSxpRkFBaUY7SUFDakYsaUJBQWlCO0lBQ2pCLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsTUFBOEM7SUFDdEYsT0FBTyxNQUFNLHFCQUE2QixJQUFJLE1BQU0scUJBQTZCO1FBQzdFLE1BQU0saUJBQXlCLENBQUM7QUFDdEMsQ0FBQzs7QUFFRCxNQUFNLE9BQU8scUJBQXFCLEdBQUcsR0FBRzs7Ozs7QUFFeEMsTUFBTSxVQUFVLGVBQWUsQ0FBQyxJQUFZO0lBQzFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLHFCQUFxQixDQUFDO0FBQzNDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cblxuLyoqXG4gKiBBc3NpZ25zIGFsbCBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHZpYSB0aGUgaW5mZXJyZWQgcmVuZGVyZXIuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIHR3byBmb3JtcyBvZiBhdHRyaWJ1dGUgZW50cmllczpcbiAqXG4gKiBkZWZhdWx0OiAoa2V5LCB2YWx1ZSk6XG4gKiAgYXR0cnMgPSBba2V5MSwgdmFsdWUxLCBrZXkyLCB2YWx1ZTJdXG4gKlxuICogbmFtZXNwYWNlZDogKE5BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWUpXG4gKiAgYXR0cnMgPSBbTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZSwgTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZV1cbiAqXG4gKiBUaGUgYGF0dHJzYCBhcnJheSBjYW4gY29udGFpbiBhIG1peCBvZiBib3RoIHRoZSBkZWZhdWx0IGFuZCBuYW1lc3BhY2VkIGVudHJpZXMuXG4gKiBUaGUgXCJkZWZhdWx0XCIgdmFsdWVzIGFyZSBzZXQgd2l0aG91dCBhIG1hcmtlciwgYnV0IGlmIHRoZSBmdW5jdGlvbiBjb21lcyBhY3Jvc3NcbiAqIGEgbWFya2VyIHZhbHVlIHRoZW4gaXQgd2lsbCBhdHRlbXB0IHRvIHNldCBhIG5hbWVzcGFjZWQgdmFsdWUuIElmIHRoZSBtYXJrZXIgaXNcbiAqIG5vdCBvZiBhIG5hbWVzcGFjZWQgdmFsdWUgdGhlbiB0aGUgZnVuY3Rpb24gd2lsbCBxdWl0IGFuZCByZXR1cm4gdGhlIGluZGV4IHZhbHVlXG4gKiB3aGVyZSBpdCBzdG9wcGVkIGR1cmluZyB0aGUgaXRlcmF0aW9uIG9mIHRoZSBhdHRycyBhcnJheS5cbiAqXG4gKiBTZWUgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gdW5kZXJzdGFuZCB3aGF0IHRoZSBuYW1lc3BhY2UgbWFya2VyIHZhbHVlIGlzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGluc3RydWN0aW9uIGRvZXMgbm90IHN1cHBvcnQgYXNzaWduaW5nIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXMgdG9cbiAqIGFuIGVsZW1lbnQuIFNlZSBgZWxlbWVudFN0YXJ0YCBhbmQgYGVsZW1lbnRIb3N0QXR0cnNgIHRvIGxlYXJuIGhvdyBzdHlsaW5nIHZhbHVlc1xuICogYXJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqIEBwYXJhbSByZW5kZXJlciBUaGUgcmVuZGVyZXIgdG8gYmUgdXNlZFxuICogQHBhcmFtIG5hdGl2ZSBUaGUgZWxlbWVudCB0aGF0IHRoZSBhdHRyaWJ1dGVzIHdpbGwgYmUgYXNzaWduZWQgdG9cbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlIGFycmF5IG9mIHZhbHVlcyB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIGVsZW1lbnRcbiAqIEByZXR1cm5zIHRoZSBpbmRleCB2YWx1ZSB0aGF0IHdhcyBsYXN0IGFjY2Vzc2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMocmVuZGVyZXI6IFJlbmRlcmVyMywgbmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogbnVtYmVyIHtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuXG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBvbmx5IG5hbWVzcGFjZXMgYXJlIHN1cHBvcnRlZC4gT3RoZXIgdmFsdWUgdHlwZXMgKHN1Y2ggYXMgc3R5bGUvY2xhc3NcbiAgICAgIC8vIGVudHJpZXMpIGFyZSBub3Qgc3VwcG9ydGVkIGluIHRoaXMgZnVuY3Rpb24uXG4gICAgICBpZiAodmFsdWUgIT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIGp1c3QgbGFuZGVkIG9uIHRoZSBtYXJrZXIgdmFsdWUgLi4uIHRoZXJlZm9yZVxuICAgICAgLy8gd2Ugc2hvdWxkIHNraXAgdG8gdGhlIG5leHQgZW50cnlcbiAgICAgIGkrKztcblxuICAgICAgY29uc3QgbmFtZXNwYWNlVVJJID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jID9cbiAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwsIG5hbWVzcGFjZVVSSSkgOlxuICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYXR0ck5hbWUgaXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbKytpXTtcbiAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlmIChpc0FuaW1hdGlvblByb3AoYXR0ck5hbWUpKSB7XG4gICAgICAgIGlmIChpc1Byb2MpIHtcbiAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0UHJvcGVydHkobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMylcbiAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZykgOlxuICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICAvLyBhbm90aGVyIHBpZWNlIG9mIGNvZGUgbWF5IGl0ZXJhdGUgb3ZlciB0aGUgc2FtZSBhdHRyaWJ1dGVzIGFycmF5LiBUaGVyZWZvcmVcbiAgLy8gaXQgbWF5IGJlIGhlbHBmdWwgdG8gcmV0dXJuIHRoZSBleGFjdCBzcG90IHdoZXJlIHRoZSBhdHRyaWJ1dGVzIGFycmF5IGV4aXRlZFxuICAvLyB3aGV0aGVyIGJ5IHJ1bm5pbmcgaW50byBhbiB1bnN1cHBvcnRlZCBtYXJrZXIgb3IgaWYgYWxsIHRoZSBzdGF0aWMgdmFsdWVzIHdlcmVcbiAgLy8gaXRlcmF0ZWQgb3Zlci5cbiAgcmV0dXJuIGk7XG59XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIG1hcmtlciB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmdcbiAqIGF0dHJpYnV0ZSB2YWx1ZXMgaW4gYSBgVEF0dHJpYnV0ZXNgIGFycmF5IGFyZSBvbmx5IHRoZSBuYW1lcyBvZiBhdHRyaWJ1dGVzLFxuICogYW5kIG5vdCBuYW1lLXZhbHVlIHBhaXJzLlxuICogQHBhcmFtIG1hcmtlciBUaGUgYXR0cmlidXRlIG1hcmtlciB0byB0ZXN0LlxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgbWFya2VyIGlzIGEgXCJuYW1lLW9ubHlcIiBtYXJrZXIgKGUuZy4gYEJpbmRpbmdzYCwgYFRlbXBsYXRlYCBvciBgSTE4bmApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcihtYXJrZXI6IHN0cmluZyB8IEF0dHJpYnV0ZU1hcmtlciB8IENzc1NlbGVjdG9yKSB7XG4gIHJldHVybiBtYXJrZXIgPT09IEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncyB8fCBtYXJrZXIgPT09IEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSB8fFxuICAgICAgbWFya2VyID09PSBBdHRyaWJ1dGVNYXJrZXIuSTE4bjtcbn1cblxuZXhwb3J0IGNvbnN0IEFOSU1BVElPTl9QUk9QX1BSRUZJWCA9ICdAJztcblxuZXhwb3J0IGZ1bmN0aW9uIGlzQW5pbWF0aW9uUHJvcChuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5hbWVbMF0gPT09IEFOSU1BVElPTl9QUk9QX1BSRUZJWDtcbn1cbiJdfQ==