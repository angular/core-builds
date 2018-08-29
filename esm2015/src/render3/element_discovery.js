/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { HEADER_OFFSET } from './interfaces/view';
/** @type {?} */
export const MONKEY_PATCH_KEY_NAME = '__ng_data__';
/**
 * The internal element context which is specific to a given DOM node
 * @record
 */
export function ElementContext() { }
/**
 * The component\'s view data
 * @type {?}
 */
ElementContext.prototype.lViewData;
/**
 * The index of the element within the view data array
 * @type {?}
 */
ElementContext.prototype.index;
/**
 * The instance of the DOM node
 * @type {?}
 */
ElementContext.prototype.native;
/**
 * Returns the matching `ElementContext` data for a given DOM node.
 *
 * This function will examine the provided DOM element's monkey-patched property to figure out the
 * associated index and view data (`LViewData`).
 *
 * If the monkey-patched value is the `LViewData` instance then the element context for that
 * element will be created and the monkey-patch reference will be updated. Therefore when this
 * function is called it may mutate the provided element\'s monkey-patch value.
 *
 * If the monkey-patch value is not detected then the code will walk up the DOM until an element
 * is found which contains a monkey-patch reference. When that occurs then the provided element
 * will be updated with a new context (which is then returned).
 * @param {?} element
 * @return {?}
 */
export function getElementContext(element) {
    /** @type {?} */
    let context = /** @type {?} */ ((/** @type {?} */ (element))[MONKEY_PATCH_KEY_NAME]);
    if (context) {
        if (Array.isArray(context)) {
            /** @type {?} */
            const lViewData = /** @type {?} */ (context);
            /** @type {?} */
            const index = findMatchingElement(element, lViewData);
            context = { index, native: element, lViewData };
            attachLViewDataToNode(element, context);
        }
    }
    else {
        /** @type {?} */
        let parent = /** @type {?} */ (element);
        while (parent = parent.parentNode) {
            /** @type {?} */
            const parentContext = /** @type {?} */ ((/** @type {?} */ (parent))[MONKEY_PATCH_KEY_NAME]);
            if (parentContext) {
                /** @type {?} */
                const lViewData = Array.isArray(parentContext) ? (/** @type {?} */ (parentContext)) : parentContext.lViewData;
                /** @type {?} */
                const index = findMatchingElement(element, lViewData);
                if (index >= 0) {
                    context = { index, native: element, lViewData };
                    attachLViewDataToNode(element, context);
                    break;
                }
            }
        }
    }
    return (/** @type {?} */ (context)) || null;
}
/**
 * Locates the element within the given LViewData and returns the matching index
 * @param {?} element
 * @param {?} lViewData
 * @return {?}
 */
function findMatchingElement(element, lViewData) {
    for (let i = HEADER_OFFSET; i < lViewData.length; i++) {
        /** @type {?} */
        let result = lViewData[i];
        if (result) {
            // special case for styling since when [class] and [style] bindings
            // are used they will wrap the element into a StylingContext array
            if (Array.isArray(result)) {
                result = result[0 /* ElementPosition */];
            }
            if (result.native === element)
                return i;
        }
    }
    return -1;
}
/**
 * Assigns the given data to a DOM element using monkey-patching
 * @param {?} node
 * @param {?} data
 * @return {?}
 */
export function attachLViewDataToNode(node, data) {
    node[MONKEY_PATCH_KEY_NAME] = data;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2VsZW1lbnRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFZLE1BQU0sbUJBQW1CLENBQUM7O0FBRzNELGFBQWEscUJBQXFCLEdBQUcsYUFBYSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJuRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsT0FBaUI7O0lBQ2pELElBQUksT0FBTyxxQkFBRyxtQkFBQyxPQUFjLEVBQUMsQ0FBQyxxQkFBcUIsQ0FBc0MsRUFBQztJQUMzRixJQUFJLE9BQU8sRUFBRTtRQUNYLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTs7WUFDMUIsTUFBTSxTQUFTLHFCQUFHLE9BQW9CLEVBQUM7O1lBQ3ZDLE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxPQUFPLEdBQUcsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUMsQ0FBQztZQUM5QyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDekM7S0FDRjtTQUFNOztRQUNMLElBQUksTUFBTSxxQkFBRyxPQUFjLEVBQUM7UUFDNUIsT0FBTyxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRTs7WUFDakMsTUFBTSxhQUFhLHFCQUNmLG1CQUFDLE1BQWEsRUFBQyxDQUFDLHFCQUFxQixDQUFzQyxFQUFDO1lBQ2hGLElBQUksYUFBYSxFQUFFOztnQkFDakIsTUFBTSxTQUFTLEdBQ1gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUMsYUFBMEIsRUFBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDOztnQkFDMUYsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7b0JBQ2QsT0FBTyxHQUFHLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFDLENBQUM7b0JBQzlDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDeEMsTUFBTTtpQkFDUDthQUNGO1NBQ0Y7S0FDRjtJQUNELE9BQU8sbUJBQUMsT0FBeUIsRUFBQyxJQUFJLElBQUksQ0FBQztDQUM1Qzs7Ozs7OztBQUdELFNBQVMsbUJBQW1CLENBQUMsT0FBaUIsRUFBRSxTQUFvQjtJQUNsRSxLQUFLLElBQUksQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7UUFDckQsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLElBQUksTUFBTSxFQUFFOzs7WUFHVixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3pCLE1BQU0sR0FBRyxNQUFNLHlCQUE4QixDQUFDO2FBQy9DO1lBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLE9BQU87Z0JBQUUsT0FBTyxDQUFDLENBQUM7U0FDekM7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7Q0FDWDs7Ozs7OztBQUdELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxJQUFTLEVBQUUsSUFBZ0M7SUFDL0UsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxDQUFDO0NBQ3BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXdEYXRhfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1N0eWxpbmdJbmRleH0gZnJvbSAnLi9zdHlsaW5nJztcblxuZXhwb3J0IGNvbnN0IE1PTktFWV9QQVRDSF9LRVlfTkFNRSA9ICdfX25nX2RhdGFfXyc7XG5cbi8qKiBUaGUgaW50ZXJuYWwgZWxlbWVudCBjb250ZXh0IHdoaWNoIGlzIHNwZWNpZmljIHRvIGEgZ2l2ZW4gRE9NIG5vZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudENvbnRleHQge1xuICAvKiogVGhlIGNvbXBvbmVudFxcJ3MgdmlldyBkYXRhICovXG4gIGxWaWV3RGF0YTogTFZpZXdEYXRhO1xuXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSB2aWV3IGRhdGEgYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcblxuICAvKiogVGhlIGluc3RhbmNlIG9mIHRoZSBET00gbm9kZSAqL1xuICBuYXRpdmU6IFJFbGVtZW50O1xufVxuXG4vKiogUmV0dXJucyB0aGUgbWF0Y2hpbmcgYEVsZW1lbnRDb250ZXh0YCBkYXRhIGZvciBhIGdpdmVuIERPTSBub2RlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBleGFtaW5lIHRoZSBwcm92aWRlZCBET00gZWxlbWVudCdzIG1vbmtleS1wYXRjaGVkIHByb3BlcnR5IHRvIGZpZ3VyZSBvdXQgdGhlXG4gKiBhc3NvY2lhdGVkIGluZGV4IGFuZCB2aWV3IGRhdGEgKGBMVmlld0RhdGFgKS5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoZWQgdmFsdWUgaXMgdGhlIGBMVmlld0RhdGFgIGluc3RhbmNlIHRoZW4gdGhlIGVsZW1lbnQgY29udGV4dCBmb3IgdGhhdFxuICogZWxlbWVudCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHRoZSBtb25rZXktcGF0Y2ggcmVmZXJlbmNlIHdpbGwgYmUgdXBkYXRlZC4gVGhlcmVmb3JlIHdoZW4gdGhpc1xuICogZnVuY3Rpb24gaXMgY2FsbGVkIGl0IG1heSBtdXRhdGUgdGhlIHByb3ZpZGVkIGVsZW1lbnRcXCdzIG1vbmtleS1wYXRjaCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgbW9ua2V5LXBhdGNoIHZhbHVlIGlzIG5vdCBkZXRlY3RlZCB0aGVuIHRoZSBjb2RlIHdpbGwgd2FsayB1cCB0aGUgRE9NIHVudGlsIGFuIGVsZW1lbnRcbiAqIGlzIGZvdW5kIHdoaWNoIGNvbnRhaW5zIGEgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZS4gV2hlbiB0aGF0IG9jY3VycyB0aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50XG4gKiB3aWxsIGJlIHVwZGF0ZWQgd2l0aCBhIG5ldyBjb250ZXh0ICh3aGljaCBpcyB0aGVuIHJldHVybmVkKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnRDb250ZXh0KGVsZW1lbnQ6IFJFbGVtZW50KTogRWxlbWVudENvbnRleHR8bnVsbCB7XG4gIGxldCBjb250ZXh0ID0gKGVsZW1lbnQgYXMgYW55KVtNT05LRVlfUEFUQ0hfS0VZX05BTUVdIGFzIEVsZW1lbnRDb250ZXh0IHwgTFZpZXdEYXRhIHwgbnVsbDtcbiAgaWYgKGNvbnRleHQpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjb250ZXh0KSkge1xuICAgICAgY29uc3QgbFZpZXdEYXRhID0gY29udGV4dCBhcyBMVmlld0RhdGE7XG4gICAgICBjb25zdCBpbmRleCA9IGZpbmRNYXRjaGluZ0VsZW1lbnQoZWxlbWVudCwgbFZpZXdEYXRhKTtcbiAgICAgIGNvbnRleHQgPSB7aW5kZXgsIG5hdGl2ZTogZWxlbWVudCwgbFZpZXdEYXRhfTtcbiAgICAgIGF0dGFjaExWaWV3RGF0YVRvTm9kZShlbGVtZW50LCBjb250ZXh0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IHBhcmVudCA9IGVsZW1lbnQgYXMgYW55O1xuICAgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuICAgICAgY29uc3QgcGFyZW50Q29udGV4dCA9XG4gICAgICAgICAgKHBhcmVudCBhcyBhbnkpW01PTktFWV9QQVRDSF9LRVlfTkFNRV0gYXMgRWxlbWVudENvbnRleHQgfCBMVmlld0RhdGEgfCBudWxsO1xuICAgICAgaWYgKHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgY29uc3QgbFZpZXdEYXRhID1cbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkocGFyZW50Q29udGV4dCkgPyAocGFyZW50Q29udGV4dCBhcyBMVmlld0RhdGEpIDogcGFyZW50Q29udGV4dC5sVmlld0RhdGE7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gZmluZE1hdGNoaW5nRWxlbWVudChlbGVtZW50LCBsVmlld0RhdGEpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGNvbnRleHQgPSB7aW5kZXgsIG5hdGl2ZTogZWxlbWVudCwgbFZpZXdEYXRhfTtcbiAgICAgICAgICBhdHRhY2hMVmlld0RhdGFUb05vZGUoZWxlbWVudCwgY29udGV4dCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChjb250ZXh0IGFzIEVsZW1lbnRDb250ZXh0KSB8fCBudWxsO1xufVxuXG4vKiogTG9jYXRlcyB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGdpdmVuIExWaWV3RGF0YSBhbmQgcmV0dXJucyB0aGUgbWF0Y2hpbmcgaW5kZXggKi9cbmZ1bmN0aW9uIGZpbmRNYXRjaGluZ0VsZW1lbnQoZWxlbWVudDogUkVsZW1lbnQsIGxWaWV3RGF0YTogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCBsVmlld0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgcmVzdWx0ID0gbFZpZXdEYXRhW2ldO1xuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3Igc3R5bGluZyBzaW5jZSB3aGVuIFtjbGFzc10gYW5kIFtzdHlsZV0gYmluZGluZ3NcbiAgICAgIC8vIGFyZSB1c2VkIHRoZXkgd2lsbCB3cmFwIHRoZSBlbGVtZW50IGludG8gYSBTdHlsaW5nQ29udGV4dCBhcnJheVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0KSkge1xuICAgICAgICByZXN1bHQgPSByZXN1bHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl07XG4gICAgICB9XG4gICAgICBpZiAocmVzdWx0Lm5hdGl2ZSA9PT0gZWxlbWVudCkgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqIEFzc2lnbnMgdGhlIGdpdmVuIGRhdGEgdG8gYSBET00gZWxlbWVudCB1c2luZyBtb25rZXktcGF0Y2hpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hMVmlld0RhdGFUb05vZGUobm9kZTogYW55LCBkYXRhOiBMVmlld0RhdGEgfCBFbGVtZW50Q29udGV4dCkge1xuICBub2RlW01PTktFWV9QQVRDSF9LRVlfTkFNRV0gPSBkYXRhO1xufVxuIl19