/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { applyReflow, applyTransition, computeStyle } from './util';
/** @type {?} */
let DEFAULT_RENDER_UTIL;
/**
 * @return {?}
 */
export function getDefaultRenderUtil() {
    return DEFAULT_RENDER_UTIL || (DEFAULT_RENDER_UTIL = new DefaultRenderUtil());
}
export class DefaultRenderUtil {
    /**
     * @param {?} element
     * @param {?} prop
     * @return {?}
     */
    getComputedStyle(element, prop) {
        return computeStyle(element, prop);
    }
    /**
     * @param {?} element
     * @param {?=} frameCallback
     * @return {?}
     */
    fireReflow(element, frameCallback) {
        applyReflow(element, frameCallback);
    }
    /**
     * @param {?} fn
     * @param {?} time
     * @return {?}
     */
    setTimeout(fn, time) { return setTimeout(fn, time); }
    /**
     * @param {?} timeoutVal
     * @return {?}
     */
    clearTimeout(timeoutVal) { clearTimeout(timeoutVal); }
    /**
     * @param {?} element
     * @param {?} value
     * @return {?}
     */
    setTransition(element, value) { applyTransition(element, value); }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9yZW5kZXJfdXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYW5pbWF0aW9ucy9kZWZhdWx0X3JlbmRlcl91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRWxFLElBQUksbUJBQW1CLENBQWE7Ozs7QUFDcEMsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLG1CQUFtQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7Q0FDL0U7QUFFRCxNQUFNLE9BQU8saUJBQWlCOzs7Ozs7SUFDNUIsZ0JBQWdCLENBQUMsT0FBb0IsRUFBRSxJQUFZO1FBQ2pELE9BQU8sWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNwQzs7Ozs7O0lBQ0QsVUFBVSxDQUFDLE9BQW9CLEVBQUUsYUFBeUI7UUFDeEQsV0FBVyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNyQzs7Ozs7O0lBQ0QsVUFBVSxDQUFDLEVBQVksRUFBRSxJQUFZLElBQVMsT0FBTyxVQUFVLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7Ozs7O0lBQzVFLFlBQVksQ0FBQyxVQUFlLElBQVUsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQUNqRSxhQUFhLENBQUMsT0FBb0IsRUFBRSxLQUFrQixJQUFVLGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtDQUNuRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7UmVuZGVyVXRpbH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YXBwbHlSZWZsb3csIGFwcGx5VHJhbnNpdGlvbiwgY29tcHV0ZVN0eWxlfSBmcm9tICcuL3V0aWwnO1xuXG5sZXQgREVGQVVMVF9SRU5ERVJfVVRJTDogUmVuZGVyVXRpbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0UmVuZGVyVXRpbCgpIHtcbiAgcmV0dXJuIERFRkFVTFRfUkVOREVSX1VUSUwgfHwgKERFRkFVTFRfUkVOREVSX1VUSUwgPSBuZXcgRGVmYXVsdFJlbmRlclV0aWwoKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0UmVuZGVyVXRpbCBpbXBsZW1lbnRzIFJlbmRlclV0aWwge1xuICBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBwcm9wOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBjb21wdXRlU3R5bGUoZWxlbWVudCwgcHJvcCk7XG4gIH1cbiAgZmlyZVJlZmxvdyhlbGVtZW50OiBIVE1MRWxlbWVudCwgZnJhbWVDYWxsYmFjaz86ICgpID0+IGFueSk6IHZvaWQge1xuICAgIGFwcGx5UmVmbG93KGVsZW1lbnQsIGZyYW1lQ2FsbGJhY2spO1xuICB9XG4gIHNldFRpbWVvdXQoZm46IEZ1bmN0aW9uLCB0aW1lOiBudW1iZXIpOiBhbnkgeyByZXR1cm4gc2V0VGltZW91dChmbiwgdGltZSk7IH1cbiAgY2xlYXJUaW1lb3V0KHRpbWVvdXRWYWw6IGFueSk6IHZvaWQgeyBjbGVhclRpbWVvdXQodGltZW91dFZhbCk7IH1cbiAgc2V0VHJhbnNpdGlvbihlbGVtZW50OiBIVE1MRWxlbWVudCwgdmFsdWU6IHN0cmluZ3xudWxsKTogdm9pZCB7IGFwcGx5VHJhbnNpdGlvbihlbGVtZW50LCB2YWx1ZSk7IH1cbn0iXX0=