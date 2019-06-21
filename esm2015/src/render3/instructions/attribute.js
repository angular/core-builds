/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { bind } from './property';
import { elementAttributeInternal } from './shared';
/**
 * Updates the value of or removes a bound attribute on an Element.
 *
 * Used in the case of `[attr.title]="value"`
 *
 * \@codeGenApi
 * @param {?} name name The name of the attribute.
 * @param {?} value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @param {?=} namespace Optional namespace to use when setting the attribute.
 *
 * @return {?}
 */
export function ɵɵattribute(name, value, sanitizer, namespace) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    // TODO(FW-1340): Refactor to remove the use of other instructions here.
    /** @type {?} */
    const bound = bind(lView, value);
    if (bound !== NO_CHANGE) {
        return elementAttributeInternal(index, name, bound, lView, sanitizer, namespace);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cmlidXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvYXR0cmlidXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNoQyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWlCbEQsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsSUFBWSxFQUFFLEtBQVUsRUFBRSxTQUE4QixFQUFFLFNBQWtCOztVQUN4RSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUU7O1VBQzFCLEtBQUssR0FBRyxRQUFRLEVBQUU7OztVQUVsQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7SUFDaEMsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLE9BQU8sd0JBQXdCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUNsRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2dldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuaW1wb3J0IHtiaW5kfSBmcm9tICcuL3Byb3BlcnR5JztcbmltcG9ydCB7ZWxlbWVudEF0dHJpYnV0ZUludGVybmFsfSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIG9yIHJlbW92ZXMgYSBib3VuZCBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBVc2VkIGluIHRoZSBjYXNlIG9mIGBbYXR0ci50aXRsZV09XCJ2YWx1ZVwiYFxuICpcbiAqIEBwYXJhbSBuYW1lIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBUaGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgd2hlbiB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKiAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSB0aGUgYXR0cmlidXRlIHZhbHVlIGlzIHNldCB0byB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHBhcmFtIG5hbWVzcGFjZSBPcHRpb25hbCBuYW1lc3BhY2UgdG8gdXNlIHdoZW4gc2V0dGluZyB0aGUgYXR0cmlidXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlKFxuICAgIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLCBuYW1lc3BhY2U/OiBzdHJpbmcpIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgLy8gVE9ETyhGVy0xMzQwKTogUmVmYWN0b3IgdG8gcmVtb3ZlIHRoZSB1c2Ugb2Ygb3RoZXIgaW5zdHJ1Y3Rpb25zIGhlcmUuXG4gIGNvbnN0IGJvdW5kID0gYmluZChsVmlldywgdmFsdWUpO1xuICBpZiAoYm91bmQgIT09IE5PX0NIQU5HRSkge1xuICAgIHJldHVybiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoaW5kZXgsIG5hbWUsIGJvdW5kLCBsVmlldywgc2FuaXRpemVyLCBuYW1lc3BhY2UpO1xuICB9XG59XG4iXX0=