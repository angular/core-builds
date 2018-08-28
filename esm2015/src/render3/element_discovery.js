import { HEADER_OFFSET } from './interfaces/view';
export const MONKEY_PATCH_KEY_NAME = '__ng_data__';
/** Returns the matching `ElementContext` data for a given DOM node.
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
 */
export function getElementContext(element) {
    let context = element[MONKEY_PATCH_KEY_NAME];
    if (context) {
        if (Array.isArray(context)) {
            const lViewData = context;
            const index = findMatchingElement(element, lViewData);
            context = { index, native: element, lViewData };
            attachLViewDataToNode(element, context);
        }
    }
    else {
        let parent = element;
        while (parent = parent.parentNode) {
            const parentContext = parent[MONKEY_PATCH_KEY_NAME];
            if (parentContext) {
                const lViewData = Array.isArray(parentContext) ? parentContext : parentContext.lViewData;
                const index = findMatchingElement(element, lViewData);
                if (index >= 0) {
                    context = { index, native: element, lViewData };
                    attachLViewDataToNode(element, context);
                    break;
                }
            }
        }
    }
    return context || null;
}
/** Locates the element within the given LViewData and returns the matching index */
function findMatchingElement(element, lViewData) {
    for (let i = HEADER_OFFSET; i < lViewData.length; i++) {
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
/** Assigns the given data to a DOM element using monkey-patching */
export function attachLViewDataToNode(node, data) {
    node[MONKEY_PATCH_KEY_NAME] = data;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9kaXNjb3ZlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2VsZW1lbnRfZGlzY292ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxhQUFhLEVBQVksTUFBTSxtQkFBbUIsQ0FBQztBQUczRCxNQUFNLENBQUMsTUFBTSxxQkFBcUIsR0FBRyxhQUFhLENBQUM7QUFjbkQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLE9BQWlCO0lBQ2pELElBQUksT0FBTyxHQUFJLE9BQWUsQ0FBQyxxQkFBcUIsQ0FBc0MsQ0FBQztJQUMzRixJQUFJLE9BQU8sRUFBRTtRQUNYLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMxQixNQUFNLFNBQVMsR0FBRyxPQUFvQixDQUFDO1lBQ3ZDLE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0RCxPQUFPLEdBQUcsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUMsQ0FBQztZQUM5QyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDekM7S0FDRjtTQUFNO1FBQ0wsSUFBSSxNQUFNLEdBQUcsT0FBYyxDQUFDO1FBQzVCLE9BQU8sTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUU7WUFDakMsTUFBTSxhQUFhLEdBQ2QsTUFBYyxDQUFDLHFCQUFxQixDQUFzQyxDQUFDO1lBQ2hGLElBQUksYUFBYSxFQUFFO2dCQUNqQixNQUFNLFNBQVMsR0FDWCxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBRSxhQUEyQixDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDO2dCQUMxRixNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3RELElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtvQkFDZCxPQUFPLEdBQUcsRUFBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUMsQ0FBQztvQkFDOUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUN4QyxNQUFNO2lCQUNQO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsT0FBUSxPQUEwQixJQUFJLElBQUksQ0FBQztBQUM3QyxDQUFDO0FBRUQsb0ZBQW9GO0FBQ3BGLFNBQVMsbUJBQW1CLENBQUMsT0FBaUIsRUFBRSxTQUFvQjtJQUNsRSxLQUFLLElBQUksQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNyRCxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxNQUFNLEVBQUU7WUFDVixtRUFBbUU7WUFDbkUsa0VBQWtFO1lBQ2xFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDekIsTUFBTSxHQUFHLE1BQU0seUJBQThCLENBQUM7YUFDL0M7WUFDRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssT0FBTztnQkFBRSxPQUFPLENBQUMsQ0FBQztTQUN6QztLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRCxvRUFBb0U7QUFDcEUsTUFBTSxVQUFVLHFCQUFxQixDQUFDLElBQVMsRUFBRSxJQUFnQztJQUMvRSxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3RGF0YX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtTdHlsaW5nSW5kZXh9IGZyb20gJy4vc3R5bGluZyc7XG5cbmV4cG9ydCBjb25zdCBNT05LRVlfUEFUQ0hfS0VZX05BTUUgPSAnX19uZ19kYXRhX18nO1xuXG4vKiogVGhlIGludGVybmFsIGVsZW1lbnQgY29udGV4dCB3aGljaCBpcyBzcGVjaWZpYyB0byBhIGdpdmVuIERPTSBub2RlICovXG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnRDb250ZXh0IHtcbiAgLyoqIFRoZSBjb21wb25lbnRcXCdzIHZpZXcgZGF0YSAqL1xuICBsVmlld0RhdGE6IExWaWV3RGF0YTtcblxuICAvKiogVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgdmlldyBkYXRhIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBpbnN0YW5jZSBvZiB0aGUgRE9NIG5vZGUgKi9cbiAgbmF0aXZlOiBSRWxlbWVudDtcbn1cblxuLyoqIFJldHVybnMgdGhlIG1hdGNoaW5nIGBFbGVtZW50Q29udGV4dGAgZGF0YSBmb3IgYSBnaXZlbiBET00gbm9kZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZXhhbWluZSB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnQncyBtb25rZXktcGF0Y2hlZCBwcm9wZXJ0eSB0byBmaWd1cmUgb3V0IHRoZVxuICogYXNzb2NpYXRlZCBpbmRleCBhbmQgdmlldyBkYXRhIChgTFZpZXdEYXRhYCkuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaGVkIHZhbHVlIGlzIHRoZSBgTFZpZXdEYXRhYCBpbnN0YW5jZSB0aGVuIHRoZSBlbGVtZW50IGNvbnRleHQgZm9yIHRoYXRcbiAqIGVsZW1lbnQgd2lsbCBiZSBjcmVhdGVkIGFuZCB0aGUgbW9ua2V5LXBhdGNoIHJlZmVyZW5jZSB3aWxsIGJlIHVwZGF0ZWQuIFRoZXJlZm9yZSB3aGVuIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCBtYXkgbXV0YXRlIHRoZSBwcm92aWRlZCBlbGVtZW50XFwncyBtb25rZXktcGF0Y2ggdmFsdWUuXG4gKlxuICogSWYgdGhlIG1vbmtleS1wYXRjaCB2YWx1ZSBpcyBub3QgZGV0ZWN0ZWQgdGhlbiB0aGUgY29kZSB3aWxsIHdhbGsgdXAgdGhlIERPTSB1bnRpbCBhbiBlbGVtZW50XG4gKiBpcyBmb3VuZCB3aGljaCBjb250YWlucyBhIG1vbmtleS1wYXRjaCByZWZlcmVuY2UuIFdoZW4gdGhhdCBvY2N1cnMgdGhlbiB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICogd2lsbCBiZSB1cGRhdGVkIHdpdGggYSBuZXcgY29udGV4dCAod2hpY2ggaXMgdGhlbiByZXR1cm5lZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50Q29udGV4dChlbGVtZW50OiBSRWxlbWVudCk6IEVsZW1lbnRDb250ZXh0fG51bGwge1xuICBsZXQgY29udGV4dCA9IChlbGVtZW50IGFzIGFueSlbTU9OS0VZX1BBVENIX0tFWV9OQU1FXSBhcyBFbGVtZW50Q29udGV4dCB8IExWaWV3RGF0YSB8IG51bGw7XG4gIGlmIChjb250ZXh0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY29udGV4dCkpIHtcbiAgICAgIGNvbnN0IGxWaWV3RGF0YSA9IGNvbnRleHQgYXMgTFZpZXdEYXRhO1xuICAgICAgY29uc3QgaW5kZXggPSBmaW5kTWF0Y2hpbmdFbGVtZW50KGVsZW1lbnQsIGxWaWV3RGF0YSk7XG4gICAgICBjb250ZXh0ID0ge2luZGV4LCBuYXRpdmU6IGVsZW1lbnQsIGxWaWV3RGF0YX07XG4gICAgICBhdHRhY2hMVmlld0RhdGFUb05vZGUoZWxlbWVudCwgY29udGV4dCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBwYXJlbnQgPSBlbGVtZW50IGFzIGFueTtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IHBhcmVudENvbnRleHQgPVxuICAgICAgICAgIChwYXJlbnQgYXMgYW55KVtNT05LRVlfUEFUQ0hfS0VZX05BTUVdIGFzIEVsZW1lbnRDb250ZXh0IHwgTFZpZXdEYXRhIHwgbnVsbDtcbiAgICAgIGlmIChwYXJlbnRDb250ZXh0KSB7XG4gICAgICAgIGNvbnN0IGxWaWV3RGF0YSA9XG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHBhcmVudENvbnRleHQpID8gKHBhcmVudENvbnRleHQgYXMgTFZpZXdEYXRhKSA6IHBhcmVudENvbnRleHQubFZpZXdEYXRhO1xuICAgICAgICBjb25zdCBpbmRleCA9IGZpbmRNYXRjaGluZ0VsZW1lbnQoZWxlbWVudCwgbFZpZXdEYXRhKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBjb250ZXh0ID0ge2luZGV4LCBuYXRpdmU6IGVsZW1lbnQsIGxWaWV3RGF0YX07XG4gICAgICAgICAgYXR0YWNoTFZpZXdEYXRhVG9Ob2RlKGVsZW1lbnQsIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiAoY29udGV4dCBhcyBFbGVtZW50Q29udGV4dCkgfHwgbnVsbDtcbn1cblxuLyoqIExvY2F0ZXMgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBnaXZlbiBMVmlld0RhdGEgYW5kIHJldHVybnMgdGhlIG1hdGNoaW5nIGluZGV4ICovXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdFbGVtZW50KGVsZW1lbnQ6IFJFbGVtZW50LCBsVmlld0RhdGE6IExWaWV3RGF0YSk6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgbFZpZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHJlc3VsdCA9IGxWaWV3RGF0YVtpXTtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIHN0eWxpbmcgc2luY2Ugd2hlbiBbY2xhc3NdIGFuZCBbc3R5bGVdIGJpbmRpbmdzXG4gICAgICAvLyBhcmUgdXNlZCB0aGV5IHdpbGwgd3JhcCB0aGUgZWxlbWVudCBpbnRvIGEgU3R5bGluZ0NvbnRleHQgYXJyYXlcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dO1xuICAgICAgfVxuICAgICAgaWYgKHJlc3VsdC5uYXRpdmUgPT09IGVsZW1lbnQpIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKiBBc3NpZ25zIHRoZSBnaXZlbiBkYXRhIHRvIGEgRE9NIGVsZW1lbnQgdXNpbmcgbW9ua2V5LXBhdGNoaW5nICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoTFZpZXdEYXRhVG9Ob2RlKG5vZGU6IGFueSwgZGF0YTogTFZpZXdEYXRhIHwgRWxlbWVudENvbnRleHQpIHtcbiAgbm9kZVtNT05LRVlfUEFUQ0hfS0VZX05BTUVdID0gZGF0YTtcbn1cbiJdfQ==