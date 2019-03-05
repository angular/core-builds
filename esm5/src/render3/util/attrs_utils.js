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
 * @param native The element that the attributes will be assigned to
 * @param attrs The attribute array of values that will be assigned to the element
 * @returns the index value that was last accessed in the attributes array
 */
export function setUpAttributes(native, attrs) {
    var renderer = getLView()[RENDERER];
    var isProc = isProceduralRenderer(renderer);
    var i = 0;
    while (i < attrs.length) {
        var value = attrs[i];
        if (typeof value === 'number') {
            // only namespaces are supported. Other value types (such as style/class
            // entries) are not supported in this function.
            if (value !== 0 /* NamespaceURI */) {
                break;
            }
            // we just landed on the marker value ... therefore
            // we should skip to the next entry
            i++;
            var namespaceURI = attrs[i++];
            var attrName = attrs[i++];
            var attrVal = attrs[i++];
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProc ?
                renderer.setAttribute(native, attrName, attrVal, namespaceURI) :
                native.setAttributeNS(namespaceURI, attrName, attrVal);
        }
        else {
            /// attrName is string;
            var attrName = value;
            var attrVal = attrs[++i];
            if (attrName !== NG_PROJECT_AS_ATTR_NAME) {
                // Standard attributes
                ngDevMode && ngDevMode.rendererSetAttribute++;
                if (isAnimationProp(attrName)) {
                    if (isProc) {
                        renderer.setProperty(native, attrName, attrVal);
                    }
                }
                else {
                    isProc ?
                        renderer
                            .setAttribute(native, attrName, attrVal) :
                        native.setAttribute(attrName, attrVal);
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
export function attrsStylingIndexOf(attrs, startIndex) {
    for (var i = startIndex; i < attrs.length; i++) {
        var val = attrs[i];
        if (val === 1 /* Classes */ || val === 2 /* Styles */) {
            return i;
        }
    }
    return -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cnNfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvYXR0cnNfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDakUsT0FBTyxFQUFnQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzNGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUloRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFDLE1BQWdCLEVBQUUsS0FBa0I7SUFDbEUsSUFBTSxRQUFRLEdBQUcsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEMsSUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUN2QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0Isd0VBQXdFO1lBQ3hFLCtDQUErQztZQUMvQyxJQUFJLEtBQUsseUJBQWlDLEVBQUU7Z0JBQzFDLE1BQU07YUFDUDtZQUVELG1EQUFtRDtZQUNuRCxtQ0FBbUM7WUFDbkMsQ0FBQyxFQUFFLENBQUM7WUFFSixJQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQVcsQ0FBQztZQUMxQyxJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQVcsQ0FBQztZQUN0QyxJQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQVcsQ0FBQztZQUNyQyxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDOUMsTUFBTSxDQUFDLENBQUM7Z0JBQ0gsUUFBZ0MsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDekYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVEO2FBQU07WUFDTCx1QkFBdUI7WUFDdkIsSUFBTSxRQUFRLEdBQUcsS0FBZSxDQUFDO1lBQ2pDLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksUUFBUSxLQUFLLHVCQUF1QixFQUFFO2dCQUN4QyxzQkFBc0I7Z0JBQ3RCLFNBQVMsSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQzdCLElBQUksTUFBTSxFQUFFO3dCQUNULFFBQWdDLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7cUJBQzFFO2lCQUNGO3FCQUFNO29CQUNMLE1BQU0sQ0FBQyxDQUFDO3dCQUNILFFBQWdDOzZCQUM1QixZQUFZLENBQUMsTUFBTSxFQUFFLFFBQWtCLEVBQUUsT0FBaUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2xFLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBa0IsRUFBRSxPQUFpQixDQUFDLENBQUM7aUJBQ2hFO2FBQ0Y7WUFDRCxDQUFDLEVBQUUsQ0FBQztTQUNMO0tBQ0Y7SUFFRCw4RUFBOEU7SUFDOUUsK0VBQStFO0lBQy9FLGlGQUFpRjtJQUNqRixpQkFBaUI7SUFDakIsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBR0QsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQWtCLEVBQUUsVUFBa0I7SUFDeEUsS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDOUMsSUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksR0FBRyxvQkFBNEIsSUFBSSxHQUFHLG1CQUEyQixFQUFFO1lBQ3JFLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkVOREVSRVJ9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcblxuXG5cbi8qKlxuICogQXNzaWducyBhbGwgYXR0cmlidXRlIHZhbHVlcyB0byB0aGUgcHJvdmlkZWQgZWxlbWVudCB2aWEgdGhlIGluZmVycmVkIHJlbmRlcmVyLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWNjZXB0cyB0d28gZm9ybXMgb2YgYXR0cmlidXRlIGVudHJpZXM6XG4gKlxuICogZGVmYXVsdDogKGtleSwgdmFsdWUpOlxuICogIGF0dHJzID0gW2tleTEsIHZhbHVlMSwga2V5MiwgdmFsdWUyXVxuICpcbiAqIG5hbWVzcGFjZWQ6IChOQU1FU1BBQ0VfTUFSS0VSLCB1cmksIG5hbWUsIHZhbHVlKVxuICogIGF0dHJzID0gW05BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWUsIE5BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWVdXG4gKlxuICogVGhlIGBhdHRyc2AgYXJyYXkgY2FuIGNvbnRhaW4gYSBtaXggb2YgYm90aCB0aGUgZGVmYXVsdCBhbmQgbmFtZXNwYWNlZCBlbnRyaWVzLlxuICogVGhlIFwiZGVmYXVsdFwiIHZhbHVlcyBhcmUgc2V0IHdpdGhvdXQgYSBtYXJrZXIsIGJ1dCBpZiB0aGUgZnVuY3Rpb24gY29tZXMgYWNyb3NzXG4gKiBhIG1hcmtlciB2YWx1ZSB0aGVuIGl0IHdpbGwgYXR0ZW1wdCB0byBzZXQgYSBuYW1lc3BhY2VkIHZhbHVlLiBJZiB0aGUgbWFya2VyIGlzXG4gKiBub3Qgb2YgYSBuYW1lc3BhY2VkIHZhbHVlIHRoZW4gdGhlIGZ1bmN0aW9uIHdpbGwgcXVpdCBhbmQgcmV0dXJuIHRoZSBpbmRleCB2YWx1ZVxuICogd2hlcmUgaXQgc3RvcHBlZCBkdXJpbmcgdGhlIGl0ZXJhdGlvbiBvZiB0aGUgYXR0cnMgYXJyYXkuXG4gKlxuICogU2VlIFtBdHRyaWJ1dGVNYXJrZXJdIHRvIHVuZGVyc3RhbmQgd2hhdCB0aGUgbmFtZXNwYWNlIG1hcmtlciB2YWx1ZSBpcy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpbnN0cnVjdGlvbiBkb2VzIG5vdCBzdXBwb3J0IGFzc2lnbmluZyBzdHlsZSBhbmQgY2xhc3MgdmFsdWVzIHRvXG4gKiBhbiBlbGVtZW50LiBTZWUgYGVsZW1lbnRTdGFydGAgYW5kIGBlbGVtZW50SG9zdEF0dHJzYCB0byBsZWFybiBob3cgc3R5bGluZyB2YWx1ZXNcbiAqIGFyZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSBUaGUgZWxlbWVudCB0aGF0IHRoZSBhdHRyaWJ1dGVzIHdpbGwgYmUgYXNzaWduZWQgdG9cbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlIGFycmF5IG9mIHZhbHVlcyB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIGVsZW1lbnRcbiAqIEByZXR1cm5zIHRoZSBpbmRleCB2YWx1ZSB0aGF0IHdhcyBsYXN0IGFjY2Vzc2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogbnVtYmVyIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRMVmlldygpW1JFTkRFUkVSXTtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuXG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBvbmx5IG5hbWVzcGFjZXMgYXJlIHN1cHBvcnRlZC4gT3RoZXIgdmFsdWUgdHlwZXMgKHN1Y2ggYXMgc3R5bGUvY2xhc3NcbiAgICAgIC8vIGVudHJpZXMpIGFyZSBub3Qgc3VwcG9ydGVkIGluIHRoaXMgZnVuY3Rpb24uXG4gICAgICBpZiAodmFsdWUgIT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIGp1c3QgbGFuZGVkIG9uIHRoZSBtYXJrZXIgdmFsdWUgLi4uIHRoZXJlZm9yZVxuICAgICAgLy8gd2Ugc2hvdWxkIHNraXAgdG8gdGhlIG5leHQgZW50cnlcbiAgICAgIGkrKztcblxuICAgICAgY29uc3QgbmFtZXNwYWNlVVJJID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jID9cbiAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwsIG5hbWVzcGFjZVVSSSkgOlxuICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8vIGF0dHJOYW1lIGlzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWUgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzWysraV07XG4gICAgICBpZiAoYXR0ck5hbWUgIT09IE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKSB7XG4gICAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgICBpZiAoaXNBbmltYXRpb25Qcm9wKGF0dHJOYW1lKSkge1xuICAgICAgICAgIGlmIChpc1Byb2MpIHtcbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRQcm9wZXJ0eShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZykgOlxuICAgICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgLy8gYW5vdGhlciBwaWVjZSBvZiBjb2RlIG1heSBpdGVyYXRlIG92ZXIgdGhlIHNhbWUgYXR0cmlidXRlcyBhcnJheS4gVGhlcmVmb3JlXG4gIC8vIGl0IG1heSBiZSBoZWxwZnVsIHRvIHJldHVybiB0aGUgZXhhY3Qgc3BvdCB3aGVyZSB0aGUgYXR0cmlidXRlcyBhcnJheSBleGl0ZWRcbiAgLy8gd2hldGhlciBieSBydW5uaW5nIGludG8gYW4gdW5zdXBwb3J0ZWQgbWFya2VyIG9yIGlmIGFsbCB0aGUgc3RhdGljIHZhbHVlcyB3ZXJlXG4gIC8vIGl0ZXJhdGVkIG92ZXIuXG4gIHJldHVybiBpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdHRyc1N0eWxpbmdJbmRleE9mKGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbCA9IGF0dHJzW2ldO1xuICAgIGlmICh2YWwgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8IHZhbCA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cbiJdfQ==