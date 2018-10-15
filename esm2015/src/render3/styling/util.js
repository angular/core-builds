/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { getContext } from '../context_discovery';
/** @type {?} */
export const EMPTY_ARR = [];
/** @type {?} */
export const EMPTY_OBJ = {};
/**
 * @param {?=} element
 * @param {?=} sanitizer
 * @param {?=} initialStylingValues
 * @return {?}
 */
export function createEmptyStylingContext(element, sanitizer, initialStylingValues) {
    return [
        element || null, null, sanitizer || null, initialStylingValues || [null], 0, 0, null, null
    ];
}
/**
 * @param {?} target
 * @param {?=} context
 * @return {?}
 */
export function getOrCreatePlayerContext(target, context) {
    context = context || /** @type {?} */ ((getContext(target)));
    if (ngDevMode && !context) {
        throw new Error('Only elements that exist in an Angular application can be used for player access');
    }
    const { lViewData, nodeIndex } = context;
    /** @type {?} */
    const value = lViewData[nodeIndex];
    /** @type {?} */
    let stylingContext = /** @type {?} */ (value);
    if (!Array.isArray(value)) {
        stylingContext = lViewData[nodeIndex] = createEmptyStylingContext(/** @type {?} */ (value));
    }
    return stylingContext[1 /* PlayerContext */] || allocPlayerContext(stylingContext);
}
/**
 * @param {?} data
 * @return {?}
 */
function allocPlayerContext(data) {
    return data[1 /* PlayerContext */] = [];
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQVcsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7O0FBSzFELGFBQWEsU0FBUyxHQUFVLEVBQUUsQ0FBQzs7QUFDbkMsYUFBYSxTQUFTLEdBQXlCLEVBQUUsQ0FBQzs7Ozs7OztBQUVsRCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLE9BQTZCLEVBQUUsU0FBa0MsRUFDakUsb0JBQW9DO0lBQ3RDLE9BQU87UUFDTCxPQUFPLElBQUksSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLElBQUksSUFBSSxFQUFFLG9CQUFvQixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSTtLQUMzRixDQUFDO0NBQ0g7Ozs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxNQUFVLEVBQUUsT0FBeUI7SUFDNUUsT0FBTyxHQUFHLE9BQU8sdUJBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDMUMsSUFBSSxTQUFTLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDekIsTUFBTSxJQUFJLEtBQUssQ0FDWCxrRkFBa0YsQ0FBQyxDQUFDO0tBQ3pGO0lBRUQsTUFBTSxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsR0FBRyxPQUFPLENBQUM7O0lBQ3ZDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7SUFDbkMsSUFBSSxjQUFjLHFCQUFHLEtBQXVCLEVBQUM7SUFDN0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDekIsY0FBYyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyx5QkFBeUIsbUJBQUMsS0FBcUIsRUFBQyxDQUFDO0tBQzFGO0lBQ0QsT0FBTyxjQUFjLHVCQUE0QixJQUFJLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0NBQ3pGOzs7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsSUFBb0I7SUFDOUMsT0FBTyxJQUFJLHVCQUE0QixHQUFHLEVBQUUsQ0FBQztDQUM5QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7TENvbnRleHQsIGdldENvbnRleHR9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7TEVsZW1lbnROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0luaXRpYWxTdHlsZXMsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5cbmV4cG9ydCBjb25zdCBFTVBUWV9BUlI6IGFueVtdID0gW107XG5leHBvcnQgY29uc3QgRU1QVFlfT0JKOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dChcbiAgICBlbGVtZW50PzogTEVsZW1lbnROb2RlIHwgbnVsbCwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBpbml0aWFsU3R5bGluZ1ZhbHVlcz86IEluaXRpYWxTdHlsZXMpOiBTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBbXG4gICAgZWxlbWVudCB8fCBudWxsLCBudWxsLCBzYW5pdGl6ZXIgfHwgbnVsbCwgaW5pdGlhbFN0eWxpbmdWYWx1ZXMgfHwgW251bGxdLCAwLCAwLCBudWxsLCBudWxsXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQodGFyZ2V0OiB7fSwgY29udGV4dD86IExDb250ZXh0IHwgbnVsbCk6IFBsYXllckNvbnRleHQge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCBnZXRDb250ZXh0KHRhcmdldCkgITtcbiAgaWYgKG5nRGV2TW9kZSAmJiAhY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ09ubHkgZWxlbWVudHMgdGhhdCBleGlzdCBpbiBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBiZSB1c2VkIGZvciBwbGF5ZXIgYWNjZXNzJyk7XG4gIH1cblxuICBjb25zdCB7bFZpZXdEYXRhLCBub2RlSW5kZXh9ID0gY29udGV4dDtcbiAgY29uc3QgdmFsdWUgPSBsVmlld0RhdGFbbm9kZUluZGV4XTtcbiAgbGV0IHN0eWxpbmdDb250ZXh0ID0gdmFsdWUgYXMgU3R5bGluZ0NvbnRleHQ7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBzdHlsaW5nQ29udGV4dCA9IGxWaWV3RGF0YVtub2RlSW5kZXhdID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCh2YWx1ZSBhcyBMRWxlbWVudE5vZGUpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gfHwgYWxsb2NQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gYWxsb2NQbGF5ZXJDb250ZXh0KGRhdGE6IFN0eWxpbmdDb250ZXh0KTogUGxheWVyQ29udGV4dCB7XG4gIHJldHVybiBkYXRhW1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSA9IFtdO1xufVxuIl19