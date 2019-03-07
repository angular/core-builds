/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NG_PROJECT_AS_ATTR_NAME } from '../interfaces/projection';
import { isProceduralRenderer } from '../interfaces/renderer';
import { RENDERER } from '../interfaces/view';
import { getLView } from '../state';
import { isAnimationProp } from '../styling/util';
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
 *
 * @param {?} native The element that the attributes will be assigned to
 * @param {?} attrs The attribute array of values that will be assigned to the element
 * @return {?} the index value that was last accessed in the attributes array
 */
export function setUpAttributes(native, attrs) {
    /** @type {?} */
    const renderer = getLView()[RENDERER];
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
            /// attrName is string;
            /** @type {?} */
            const attrName = (/** @type {?} */ (value));
            /** @type {?} */
            const attrVal = attrs[++i];
            if (attrName !== NG_PROJECT_AS_ATTR_NAME) {
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
 * @param {?} attrs
 * @param {?} startIndex
 * @return {?}
 */
export function attrsStylingIndexOf(attrs, startIndex) {
    for (let i = startIndex; i < attrs.length; i++) {
        /** @type {?} */
        const val = attrs[i];
        if (val === 1 /* Classes */ || val === 2 /* Styles */) {
            return i;
        }
    }
    return -1;
}
/**
 * Test whether the given value is a marker that indicates that the following
 * attribute values in a `TAttributes` array are only the names of attributes,
 * and not name-value pairs.
 * @param {?} marker The attribute marker to test.
 * @return {?} true if the marker is a "name-only" marker (e.g. `Bindings` or `Template`).
 */
export function isNameOnlyAttributeMarker(marker) {
    return marker === 3 /* Bindings */ || marker === 4 /* Template */;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cnNfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvYXR0cnNfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2pFLE9BQU8sRUFBZ0Msb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0saUJBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQmhELE1BQU0sVUFBVSxlQUFlLENBQUMsTUFBZ0IsRUFBRSxLQUFrQjs7VUFDNUQsUUFBUSxHQUFHLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQzs7VUFDL0IsTUFBTSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQzs7UUFFekMsQ0FBQyxHQUFHLENBQUM7SUFDVCxPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFOztjQUNqQixLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0QixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUM3Qix3RUFBd0U7WUFDeEUsK0NBQStDO1lBQy9DLElBQUksS0FBSyx5QkFBaUMsRUFBRTtnQkFDMUMsTUFBTTthQUNQO1lBRUQsbURBQW1EO1lBQ25ELG1DQUFtQztZQUNuQyxDQUFDLEVBQUUsQ0FBQzs7a0JBRUUsWUFBWSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFVOztrQkFDbkMsUUFBUSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFVOztrQkFDL0IsT0FBTyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFVO1lBQ3BDLFNBQVMsSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsQ0FBQztnQkFDSixDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUN6RixNQUFNLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDNUQ7YUFBTTs7O2tCQUVDLFFBQVEsR0FBRyxtQkFBQSxLQUFLLEVBQVU7O2tCQUMxQixPQUFPLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLElBQUksUUFBUSxLQUFLLHVCQUF1QixFQUFFO2dCQUN4QyxzQkFBc0I7Z0JBQ3RCLFNBQVMsSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQzdCLElBQUksTUFBTSxFQUFFO3dCQUNWLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7cUJBQzFFO2lCQUNGO3FCQUFNO29CQUNMLE1BQU0sQ0FBQyxDQUFDO3dCQUNKLENBQUMsbUJBQUEsUUFBUSxFQUF1QixDQUFDOzZCQUM1QixZQUFZLENBQUMsTUFBTSxFQUFFLG1CQUFBLFFBQVEsRUFBVSxFQUFFLG1CQUFBLE9BQU8sRUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDbEUsTUFBTSxDQUFDLFlBQVksQ0FBQyxtQkFBQSxRQUFRLEVBQVUsRUFBRSxtQkFBQSxPQUFPLEVBQVUsQ0FBQyxDQUFDO2lCQUNoRTthQUNGO1lBQ0QsQ0FBQyxFQUFFLENBQUM7U0FDTDtLQUNGO0lBRUQsOEVBQThFO0lBQzlFLCtFQUErRTtJQUMvRSxpRkFBaUY7SUFDakYsaUJBQWlCO0lBQ2pCLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQzs7Ozs7O0FBR0QsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQWtCLEVBQUUsVUFBa0I7SUFDeEUsS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQ3hDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLElBQUksR0FBRyxvQkFBNEIsSUFBSSxHQUFHLG1CQUEyQixFQUFFO1lBQ3JFLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDOzs7Ozs7OztBQVNELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxNQUFnQztJQUN4RSxPQUFPLE1BQU0scUJBQTZCLElBQUksTUFBTSxxQkFBNkIsQ0FBQztBQUNwRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkVOREVSRVJ9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcblxuXG5cbi8qKlxuICogQXNzaWducyBhbGwgYXR0cmlidXRlIHZhbHVlcyB0byB0aGUgcHJvdmlkZWQgZWxlbWVudCB2aWEgdGhlIGluZmVycmVkIHJlbmRlcmVyLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWNjZXB0cyB0d28gZm9ybXMgb2YgYXR0cmlidXRlIGVudHJpZXM6XG4gKlxuICogZGVmYXVsdDogKGtleSwgdmFsdWUpOlxuICogIGF0dHJzID0gW2tleTEsIHZhbHVlMSwga2V5MiwgdmFsdWUyXVxuICpcbiAqIG5hbWVzcGFjZWQ6IChOQU1FU1BBQ0VfTUFSS0VSLCB1cmksIG5hbWUsIHZhbHVlKVxuICogIGF0dHJzID0gW05BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWUsIE5BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWVdXG4gKlxuICogVGhlIGBhdHRyc2AgYXJyYXkgY2FuIGNvbnRhaW4gYSBtaXggb2YgYm90aCB0aGUgZGVmYXVsdCBhbmQgbmFtZXNwYWNlZCBlbnRyaWVzLlxuICogVGhlIFwiZGVmYXVsdFwiIHZhbHVlcyBhcmUgc2V0IHdpdGhvdXQgYSBtYXJrZXIsIGJ1dCBpZiB0aGUgZnVuY3Rpb24gY29tZXMgYWNyb3NzXG4gKiBhIG1hcmtlciB2YWx1ZSB0aGVuIGl0IHdpbGwgYXR0ZW1wdCB0byBzZXQgYSBuYW1lc3BhY2VkIHZhbHVlLiBJZiB0aGUgbWFya2VyIGlzXG4gKiBub3Qgb2YgYSBuYW1lc3BhY2VkIHZhbHVlIHRoZW4gdGhlIGZ1bmN0aW9uIHdpbGwgcXVpdCBhbmQgcmV0dXJuIHRoZSBpbmRleCB2YWx1ZVxuICogd2hlcmUgaXQgc3RvcHBlZCBkdXJpbmcgdGhlIGl0ZXJhdGlvbiBvZiB0aGUgYXR0cnMgYXJyYXkuXG4gKlxuICogU2VlIFtBdHRyaWJ1dGVNYXJrZXJdIHRvIHVuZGVyc3RhbmQgd2hhdCB0aGUgbmFtZXNwYWNlIG1hcmtlciB2YWx1ZSBpcy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpbnN0cnVjdGlvbiBkb2VzIG5vdCBzdXBwb3J0IGFzc2lnbmluZyBzdHlsZSBhbmQgY2xhc3MgdmFsdWVzIHRvXG4gKiBhbiBlbGVtZW50LiBTZWUgYGVsZW1lbnRTdGFydGAgYW5kIGBlbGVtZW50SG9zdEF0dHJzYCB0byBsZWFybiBob3cgc3R5bGluZyB2YWx1ZXNcbiAqIGFyZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSBUaGUgZWxlbWVudCB0aGF0IHRoZSBhdHRyaWJ1dGVzIHdpbGwgYmUgYXNzaWduZWQgdG9cbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlIGFycmF5IG9mIHZhbHVlcyB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIGVsZW1lbnRcbiAqIEByZXR1cm5zIHRoZSBpbmRleCB2YWx1ZSB0aGF0IHdhcyBsYXN0IGFjY2Vzc2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogbnVtYmVyIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRMVmlldygpW1JFTkRFUkVSXTtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuXG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBvbmx5IG5hbWVzcGFjZXMgYXJlIHN1cHBvcnRlZC4gT3RoZXIgdmFsdWUgdHlwZXMgKHN1Y2ggYXMgc3R5bGUvY2xhc3NcbiAgICAgIC8vIGVudHJpZXMpIGFyZSBub3Qgc3VwcG9ydGVkIGluIHRoaXMgZnVuY3Rpb24uXG4gICAgICBpZiAodmFsdWUgIT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIGp1c3QgbGFuZGVkIG9uIHRoZSBtYXJrZXIgdmFsdWUgLi4uIHRoZXJlZm9yZVxuICAgICAgLy8gd2Ugc2hvdWxkIHNraXAgdG8gdGhlIG5leHQgZW50cnlcbiAgICAgIGkrKztcblxuICAgICAgY29uc3QgbmFtZXNwYWNlVVJJID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jID9cbiAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwsIG5hbWVzcGFjZVVSSSkgOlxuICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8vIGF0dHJOYW1lIGlzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWUgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzWysraV07XG4gICAgICBpZiAoYXR0ck5hbWUgIT09IE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKSB7XG4gICAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgICBpZiAoaXNBbmltYXRpb25Qcm9wKGF0dHJOYW1lKSkge1xuICAgICAgICAgIGlmIChpc1Byb2MpIHtcbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRQcm9wZXJ0eShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZykgOlxuICAgICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgLy8gYW5vdGhlciBwaWVjZSBvZiBjb2RlIG1heSBpdGVyYXRlIG92ZXIgdGhlIHNhbWUgYXR0cmlidXRlcyBhcnJheS4gVGhlcmVmb3JlXG4gIC8vIGl0IG1heSBiZSBoZWxwZnVsIHRvIHJldHVybiB0aGUgZXhhY3Qgc3BvdCB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcnJheSBleGl0ZWRcbiAgLy8gd2hldGhlciBieSBydW5uaW5nIGludG8gYW4gdW5zdXBwb3J0ZWQgbWFya2VyIG9yIGlmIGFsbCB0aGUgc3RhdGljIHZhbHVlcyB3ZXJlXG4gIC8vIGl0ZXJhdGVkIG92ZXIuXG4gIHJldHVybiBpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRyc1N0eWxpbmdJbmRleE9mKGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbCA9IGF0dHJzW2ldO1xuICAgIGlmICh2YWwgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8IHZhbCA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBUZXN0IHdoZXRoZXIgdGhlIGdpdmVuIHZhbHVlIGlzIGEgbWFya2VyIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIGZvbGxvd2luZ1xuICogYXR0cmlidXRlIHZhbHVlcyBpbiBhIGBUQXR0cmlidXRlc2AgYXJyYXkgYXJlIG9ubHkgdGhlIG5hbWVzIG9mIGF0dHJpYnV0ZXMsXG4gKiBhbmQgbm90IG5hbWUtdmFsdWUgcGFpcnMuXG4gKiBAcGFyYW0gbWFya2VyIFRoZSBhdHRyaWJ1dGUgbWFya2VyIHRvIHRlc3QuXG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBtYXJrZXIgaXMgYSBcIm5hbWUtb25seVwiIG1hcmtlciAoZS5nLiBgQmluZGluZ3NgIG9yIGBUZW1wbGF0ZWApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcihtYXJrZXI6IHN0cmluZyB8IEF0dHJpYnV0ZU1hcmtlcikge1xuICByZXR1cm4gbWFya2VyID09PSBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MgfHwgbWFya2VyID09PSBBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGU7XG59XG4iXX0=