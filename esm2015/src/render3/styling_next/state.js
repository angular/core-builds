/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { TEMPLATE_DIRECTIVE_INDEX } from './util';
/**
 * Used as a state reference for update values between style/class binding instructions.
 *
 * In addition to storing the element and bit-mask related values, the state also
 * stores the `sourceIndex` value. The `sourceIndex` value is an incremented value
 * that identifies what "source" (i.e. the template, a specific directive by index or
 * component) is currently applying its styling bindings to the element.
 * @record
 */
export function StylingState() { }
if (false) {
    /**
     * The element that is currently being processed
     * @type {?}
     */
    StylingState.prototype.element;
    /**
     * The directive index that is currently active (`0` === template)
     * @type {?}
     */
    StylingState.prototype.directiveIndex;
    /**
     * The source (column) index that is currently active (`0` === template)
     * @type {?}
     */
    StylingState.prototype.sourceIndex;
    /**
     * The classes update bit mask value that is processed during each class binding
     * @type {?}
     */
    StylingState.prototype.classesBitMask;
    /**
     * The classes update bit index value that is processed during each class binding
     * @type {?}
     */
    StylingState.prototype.classesIndex;
    /**
     * The styles update bit mask value that is processed during each style binding
     * @type {?}
     */
    StylingState.prototype.stylesBitMask;
    /**
     * The styles update bit index value that is processed during each style binding
     * @type {?}
     */
    StylingState.prototype.stylesIndex;
}
// these values will get filled in the very first time this is accessed...
/** @type {?} */
const _state = {
    element: null,
    directiveIndex: -1,
    sourceIndex: -1,
    classesBitMask: -1,
    classesIndex: -1,
    stylesBitMask: -1,
    stylesIndex: -1,
};
/** @type {?} */
const BIT_MASK_START_VALUE = 0;
// the `0` start value is reserved for [map]-based entries
/** @type {?} */
const INDEX_START_VALUE = 1;
/**
 * Returns (or instantiates) the styling state for the given element.
 *
 * Styling state is accessed and processed each time a style or class binding
 * is evaluated.
 *
 * If and when the provided `element` doesn't match the current element in the
 * state then this means that styling was recently cleared or the element has
 * changed in change detection. In both cases the styling state is fully reset.
 *
 * If and when the provided `directiveIndex` doesn't match the current directive
 * index in the state then this means that a new source has introduced itself into
 * the styling code (or, in other words, another directive or component has started
 * to apply its styling host bindings to the element).
 * @param {?} element
 * @param {?} directiveIndex
 * @return {?}
 */
export function getStylingState(element, directiveIndex) {
    if (_state.element !== element) {
        _state.element = element;
        _state.directiveIndex = directiveIndex;
        _state.sourceIndex = directiveIndex === TEMPLATE_DIRECTIVE_INDEX ? 0 : 1;
        _state.classesBitMask = BIT_MASK_START_VALUE;
        _state.classesIndex = INDEX_START_VALUE;
        _state.stylesBitMask = BIT_MASK_START_VALUE;
        _state.stylesIndex = INDEX_START_VALUE;
    }
    else if (_state.directiveIndex !== directiveIndex) {
        _state.directiveIndex = directiveIndex;
        _state.sourceIndex++;
    }
    return _state;
}
/**
 * Clears the styling state so that it can be used by another element's styling code.
 * @return {?}
 */
export function resetStylingState() {
    _state.element = null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9zdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7O0FBOEJoRCxrQ0FxQkM7Ozs7OztJQW5CQywrQkFBdUI7Ozs7O0lBR3ZCLHNDQUF1Qjs7Ozs7SUFHdkIsbUNBQW9COzs7OztJQUdwQixzQ0FBdUI7Ozs7O0lBR3ZCLG9DQUFxQjs7Ozs7SUFHckIscUNBQXNCOzs7OztJQUd0QixtQ0FBb0I7Ozs7TUFJaEIsTUFBTSxHQUFpQjtJQUMzQixPQUFPLEVBQUUsSUFBSTtJQUNiLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDbEIsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUNmLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDbEIsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUNoQixhQUFhLEVBQUUsQ0FBQyxDQUFDO0lBQ2pCLFdBQVcsRUFBRSxDQUFDLENBQUM7Q0FDaEI7O01BRUssb0JBQW9CLEdBQUcsQ0FBQzs7O01BR3hCLGlCQUFpQixHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQjNCLE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBaUIsRUFBRSxjQUFzQjtJQUN2RSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO1FBQzlCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsY0FBYyxLQUFLLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSxNQUFNLENBQUMsY0FBYyxHQUFHLG9CQUFvQixDQUFDO1FBQzdDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsaUJBQWlCLENBQUM7UUFDeEMsTUFBTSxDQUFDLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQztRQUM1QyxNQUFNLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDO0tBQ3hDO1NBQU0sSUFBSSxNQUFNLENBQUMsY0FBYyxLQUFLLGNBQWMsRUFBRTtRQUNuRCxNQUFNLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUN2QyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDdEI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDOzs7OztBQUtELE1BQU0sVUFBVSxpQkFBaUI7SUFDL0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgYWxsIHN0YXRlLWJhc2VkIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogU3R5bGluZyBpbiBBbmd1bGFyIGlzIGV2YWx1YXRlZCB3aXRoIGEgc2VyaWVzIG9mIHN0eWxpbmctc3BlY2lmaWNcbiAqIHRlbXBsYXRlIGluc3RydWN0aW9ucyB3aGljaCBhcmUgY2FsbGVkIG9uZSBhZnRlciBhbm90aGVyIGVhY2ggdGltZVxuICogY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgaW4gQW5ndWxhci5cbiAqXG4gKiBTdHlsaW5nIG1ha2VzIHVzZSBvZiB2YXJpb3VzIHRlbXBvcmFyeSwgc3RhdGUtYmFzZWQgdmFyaWFibGVzIGJldHdlZW5cbiAqIGluc3RydWN0aW9ucyBzbyB0aGF0IGl0IGNhbiBiZXR0ZXIgY2FjaGUgYW5kIG9wdGltaXplIGl0cyB2YWx1ZXMuXG4gKiBUaGVzZSB2YWx1ZXMgYXJlIHVzdWFsbHkgcG9wdWxhdGVkIGFuZCBjbGVhcmVkIHdoZW4gYW4gZWxlbWVudCBpc1xuICogZXhpdGVkIGluIGNoYW5nZSBkZXRlY3Rpb24gKG9uY2UgYWxsIHRoZSBpbnN0cnVjdGlvbnMgYXJlIHJ1biBmb3JcbiAqIHRoYXQgZWxlbWVudCkuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogVXNlZCBhcyBhIHN0YXRlIHJlZmVyZW5jZSBmb3IgdXBkYXRlIHZhbHVlcyBiZXR3ZWVuIHN0eWxlL2NsYXNzIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIEluIGFkZGl0aW9uIHRvIHN0b3JpbmcgdGhlIGVsZW1lbnQgYW5kIGJpdC1tYXNrIHJlbGF0ZWQgdmFsdWVzLCB0aGUgc3RhdGUgYWxzb1xuICogc3RvcmVzIHRoZSBgc291cmNlSW5kZXhgIHZhbHVlLiBUaGUgYHNvdXJjZUluZGV4YCB2YWx1ZSBpcyBhbiBpbmNyZW1lbnRlZCB2YWx1ZVxuICogdGhhdCBpZGVudGlmaWVzIHdoYXQgXCJzb3VyY2VcIiAoaS5lLiB0aGUgdGVtcGxhdGUsIGEgc3BlY2lmaWMgZGlyZWN0aXZlIGJ5IGluZGV4IG9yXG4gKiBjb21wb25lbnQpIGlzIGN1cnJlbnRseSBhcHBseWluZyBpdHMgc3R5bGluZyBiaW5kaW5ncyB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nU3RhdGUge1xuICAvKiogVGhlIGVsZW1lbnQgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkICovXG4gIGVsZW1lbnQ6IFJFbGVtZW50fG51bGw7XG5cbiAgLyoqIFRoZSBkaXJlY3RpdmUgaW5kZXggdGhhdCBpcyBjdXJyZW50bHkgYWN0aXZlIChgMGAgPT09IHRlbXBsYXRlKSAqL1xuICBkaXJlY3RpdmVJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc291cmNlIChjb2x1bW4pIGluZGV4IHRoYXQgaXMgY3VycmVudGx5IGFjdGl2ZSAoYDBgID09PSB0ZW1wbGF0ZSkgKi9cbiAgc291cmNlSW5kZXg6IG51bWJlcjtcblxuICAvKiogVGhlIGNsYXNzZXMgdXBkYXRlIGJpdCBtYXNrIHZhbHVlIHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBlYWNoIGNsYXNzIGJpbmRpbmcgKi9cbiAgY2xhc3Nlc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKiogVGhlIGNsYXNzZXMgdXBkYXRlIGJpdCBpbmRleCB2YWx1ZSB0aGF0IGlzIHByb2Nlc3NlZCBkdXJpbmcgZWFjaCBjbGFzcyBiaW5kaW5nICovXG4gIGNsYXNzZXNJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3R5bGVzIHVwZGF0ZSBiaXQgbWFzayB2YWx1ZSB0aGF0IGlzIHByb2Nlc3NlZCBkdXJpbmcgZWFjaCBzdHlsZSBiaW5kaW5nICovXG4gIHN0eWxlc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKiogVGhlIHN0eWxlcyB1cGRhdGUgYml0IGluZGV4IHZhbHVlIHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBlYWNoIHN0eWxlIGJpbmRpbmcgKi9cbiAgc3R5bGVzSW5kZXg6IG51bWJlcjtcbn1cblxuLy8gdGhlc2UgdmFsdWVzIHdpbGwgZ2V0IGZpbGxlZCBpbiB0aGUgdmVyeSBmaXJzdCB0aW1lIHRoaXMgaXMgYWNjZXNzZWQuLi5cbmNvbnN0IF9zdGF0ZTogU3R5bGluZ1N0YXRlID0ge1xuICBlbGVtZW50OiBudWxsLFxuICBkaXJlY3RpdmVJbmRleDogLTEsXG4gIHNvdXJjZUluZGV4OiAtMSxcbiAgY2xhc3Nlc0JpdE1hc2s6IC0xLFxuICBjbGFzc2VzSW5kZXg6IC0xLFxuICBzdHlsZXNCaXRNYXNrOiAtMSxcbiAgc3R5bGVzSW5kZXg6IC0xLFxufTtcblxuY29uc3QgQklUX01BU0tfU1RBUlRfVkFMVUUgPSAwO1xuXG4vLyB0aGUgYDBgIHN0YXJ0IHZhbHVlIGlzIHJlc2VydmVkIGZvciBbbWFwXS1iYXNlZCBlbnRyaWVzXG5jb25zdCBJTkRFWF9TVEFSVF9WQUxVRSA9IDE7XG5cbi8qKlxuICogUmV0dXJucyAob3IgaW5zdGFudGlhdGVzKSB0aGUgc3R5bGluZyBzdGF0ZSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogU3R5bGluZyBzdGF0ZSBpcyBhY2Nlc3NlZCBhbmQgcHJvY2Vzc2VkIGVhY2ggdGltZSBhIHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdcbiAqIGlzIGV2YWx1YXRlZC5cbiAqXG4gKiBJZiBhbmQgd2hlbiB0aGUgcHJvdmlkZWQgYGVsZW1lbnRgIGRvZXNuJ3QgbWF0Y2ggdGhlIGN1cnJlbnQgZWxlbWVudCBpbiB0aGVcbiAqIHN0YXRlIHRoZW4gdGhpcyBtZWFucyB0aGF0IHN0eWxpbmcgd2FzIHJlY2VudGx5IGNsZWFyZWQgb3IgdGhlIGVsZW1lbnQgaGFzXG4gKiBjaGFuZ2VkIGluIGNoYW5nZSBkZXRlY3Rpb24uIEluIGJvdGggY2FzZXMgdGhlIHN0eWxpbmcgc3RhdGUgaXMgZnVsbHkgcmVzZXQuXG4gKlxuICogSWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBkaXJlY3RpdmVJbmRleGAgZG9lc24ndCBtYXRjaCB0aGUgY3VycmVudCBkaXJlY3RpdmVcbiAqIGluZGV4IGluIHRoZSBzdGF0ZSB0aGVuIHRoaXMgbWVhbnMgdGhhdCBhIG5ldyBzb3VyY2UgaGFzIGludHJvZHVjZWQgaXRzZWxmIGludG9cbiAqIHRoZSBzdHlsaW5nIGNvZGUgKG9yLCBpbiBvdGhlciB3b3JkcywgYW5vdGhlciBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGhhcyBzdGFydGVkXG4gKiB0byBhcHBseSBpdHMgc3R5bGluZyBob3N0IGJpbmRpbmdzIHRvIHRoZSBlbGVtZW50KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdTdGF0ZShlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IFN0eWxpbmdTdGF0ZSB7XG4gIGlmIChfc3RhdGUuZWxlbWVudCAhPT0gZWxlbWVudCkge1xuICAgIF9zdGF0ZS5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBfc3RhdGUuZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVJbmRleDtcbiAgICBfc3RhdGUuc291cmNlSW5kZXggPSBkaXJlY3RpdmVJbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYID8gMCA6IDE7XG4gICAgX3N0YXRlLmNsYXNzZXNCaXRNYXNrID0gQklUX01BU0tfU1RBUlRfVkFMVUU7XG4gICAgX3N0YXRlLmNsYXNzZXNJbmRleCA9IElOREVYX1NUQVJUX1ZBTFVFO1xuICAgIF9zdGF0ZS5zdHlsZXNCaXRNYXNrID0gQklUX01BU0tfU1RBUlRfVkFMVUU7XG4gICAgX3N0YXRlLnN0eWxlc0luZGV4ID0gSU5ERVhfU1RBUlRfVkFMVUU7XG4gIH0gZWxzZSBpZiAoX3N0YXRlLmRpcmVjdGl2ZUluZGV4ICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgIF9zdGF0ZS5kaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZUluZGV4O1xuICAgIF9zdGF0ZS5zb3VyY2VJbmRleCsrO1xuICB9XG4gIHJldHVybiBfc3RhdGU7XG59XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBzdHlsaW5nIHN0YXRlIHNvIHRoYXQgaXQgY2FuIGJlIHVzZWQgYnkgYW5vdGhlciBlbGVtZW50J3Mgc3R5bGluZyBjb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTdHlsaW5nU3RhdGUoKSB7XG4gIF9zdGF0ZS5lbGVtZW50ID0gbnVsbDtcbn1cbiJdfQ==