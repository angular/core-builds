/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/state.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { TEMPLATE_DIRECTIVE_INDEX } from '../util/styling_utils';
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
    /**
     * The last class map that was applied (i.e. `[class]="x"`).
     *
     * Note that this property is only populated when direct class values are applied
     * (i.e. context resolution is not used).
     *
     * See `allowDirectStyling` for more info.
     * @type {?}
     */
    StylingState.prototype.lastDirectClassMap;
    /**
     * The last style map that was applied (i.e. `[style]="x"`)
     *
     * Note that this property is only populated when direct style values are applied
     * (i.e. context resolution is not used).
     *
     * See `allowDirectStyling` for more info.
     * @type {?}
     */
    StylingState.prototype.lastDirectStyleMap;
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
    lastDirectClassMap: null,
    lastDirectStyleMap: null,
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
        _state.lastDirectClassMap = null;
        _state.lastDirectStyleMap = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFTQSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7Ozs7Ozs7OztBQThCL0Qsa0NBeUNDOzs7Ozs7SUF2Q0MsK0JBQXVCOzs7OztJQUd2QixzQ0FBdUI7Ozs7O0lBR3ZCLG1DQUFvQjs7Ozs7SUFHcEIsc0NBQXVCOzs7OztJQUd2QixvQ0FBcUI7Ozs7O0lBR3JCLHFDQUFzQjs7Ozs7SUFHdEIsbUNBQW9COzs7Ozs7Ozs7O0lBVXBCLDBDQUF5Qzs7Ozs7Ozs7OztJQVV6QywwQ0FBeUM7Ozs7TUFJckMsTUFBTSxHQUFpQjtJQUMzQixPQUFPLEVBQUUsSUFBSTtJQUNiLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDbEIsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUNmLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDbEIsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUNoQixhQUFhLEVBQUUsQ0FBQyxDQUFDO0lBQ2pCLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDZixrQkFBa0IsRUFBRSxJQUFJO0lBQ3hCLGtCQUFrQixFQUFFLElBQUk7Q0FDekI7O01BRUssb0JBQW9CLEdBQUcsQ0FBQzs7O01BR3hCLGlCQUFpQixHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQjNCLE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBaUIsRUFBRSxjQUFzQjtJQUN2RSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO1FBQzlCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsY0FBYyxLQUFLLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSxNQUFNLENBQUMsY0FBYyxHQUFHLG9CQUFvQixDQUFDO1FBQzdDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsaUJBQWlCLENBQUM7UUFDeEMsTUFBTSxDQUFDLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQztRQUM1QyxNQUFNLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDakMsTUFBTSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztLQUNsQztTQUFNLElBQUksTUFBTSxDQUFDLGNBQWMsS0FBSyxjQUFjLEVBQUU7UUFDbkQsTUFBTSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDdkMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQ3RCO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQzs7Ozs7QUFLRCxNQUFNLFVBQVUsaUJBQWlCO0lBQy9CLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ01hcEFycmF5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgYWxsIHN0YXRlLWJhc2VkIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogU3R5bGluZyBpbiBBbmd1bGFyIGlzIGV2YWx1YXRlZCB3aXRoIGEgc2VyaWVzIG9mIHN0eWxpbmctc3BlY2lmaWNcbiAqIHRlbXBsYXRlIGluc3RydWN0aW9ucyB3aGljaCBhcmUgY2FsbGVkIG9uZSBhZnRlciBhbm90aGVyIGVhY2ggdGltZVxuICogY2hhbmdlIGRldGVjdGlvbiBvY2N1cnMgaW4gQW5ndWxhci5cbiAqXG4gKiBTdHlsaW5nIG1ha2VzIHVzZSBvZiB2YXJpb3VzIHRlbXBvcmFyeSwgc3RhdGUtYmFzZWQgdmFyaWFibGVzIGJldHdlZW5cbiAqIGluc3RydWN0aW9ucyBzbyB0aGF0IGl0IGNhbiBiZXR0ZXIgY2FjaGUgYW5kIG9wdGltaXplIGl0cyB2YWx1ZXMuXG4gKiBUaGVzZSB2YWx1ZXMgYXJlIHVzdWFsbHkgcG9wdWxhdGVkIGFuZCBjbGVhcmVkIHdoZW4gYW4gZWxlbWVudCBpc1xuICogZXhpdGVkIGluIGNoYW5nZSBkZXRlY3Rpb24gKG9uY2UgYWxsIHRoZSBpbnN0cnVjdGlvbnMgYXJlIHJ1biBmb3JcbiAqIHRoYXQgZWxlbWVudCkuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogVXNlZCBhcyBhIHN0YXRlIHJlZmVyZW5jZSBmb3IgdXBkYXRlIHZhbHVlcyBiZXR3ZWVuIHN0eWxlL2NsYXNzIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIEluIGFkZGl0aW9uIHRvIHN0b3JpbmcgdGhlIGVsZW1lbnQgYW5kIGJpdC1tYXNrIHJlbGF0ZWQgdmFsdWVzLCB0aGUgc3RhdGUgYWxzb1xuICogc3RvcmVzIHRoZSBgc291cmNlSW5kZXhgIHZhbHVlLiBUaGUgYHNvdXJjZUluZGV4YCB2YWx1ZSBpcyBhbiBpbmNyZW1lbnRlZCB2YWx1ZVxuICogdGhhdCBpZGVudGlmaWVzIHdoYXQgXCJzb3VyY2VcIiAoaS5lLiB0aGUgdGVtcGxhdGUsIGEgc3BlY2lmaWMgZGlyZWN0aXZlIGJ5IGluZGV4IG9yXG4gKiBjb21wb25lbnQpIGlzIGN1cnJlbnRseSBhcHBseWluZyBpdHMgc3R5bGluZyBiaW5kaW5ncyB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nU3RhdGUge1xuICAvKiogVGhlIGVsZW1lbnQgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkICovXG4gIGVsZW1lbnQ6IFJFbGVtZW50fG51bGw7XG5cbiAgLyoqIFRoZSBkaXJlY3RpdmUgaW5kZXggdGhhdCBpcyBjdXJyZW50bHkgYWN0aXZlIChgMGAgPT09IHRlbXBsYXRlKSAqL1xuICBkaXJlY3RpdmVJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc291cmNlIChjb2x1bW4pIGluZGV4IHRoYXQgaXMgY3VycmVudGx5IGFjdGl2ZSAoYDBgID09PSB0ZW1wbGF0ZSkgKi9cbiAgc291cmNlSW5kZXg6IG51bWJlcjtcblxuICAvKiogVGhlIGNsYXNzZXMgdXBkYXRlIGJpdCBtYXNrIHZhbHVlIHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBlYWNoIGNsYXNzIGJpbmRpbmcgKi9cbiAgY2xhc3Nlc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKiogVGhlIGNsYXNzZXMgdXBkYXRlIGJpdCBpbmRleCB2YWx1ZSB0aGF0IGlzIHByb2Nlc3NlZCBkdXJpbmcgZWFjaCBjbGFzcyBiaW5kaW5nICovXG4gIGNsYXNzZXNJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3R5bGVzIHVwZGF0ZSBiaXQgbWFzayB2YWx1ZSB0aGF0IGlzIHByb2Nlc3NlZCBkdXJpbmcgZWFjaCBzdHlsZSBiaW5kaW5nICovXG4gIHN0eWxlc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKiogVGhlIHN0eWxlcyB1cGRhdGUgYml0IGluZGV4IHZhbHVlIHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBlYWNoIHN0eWxlIGJpbmRpbmcgKi9cbiAgc3R5bGVzSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGxhc3QgY2xhc3MgbWFwIHRoYXQgd2FzIGFwcGxpZWQgKGkuZS4gYFtjbGFzc109XCJ4XCJgKS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgcHJvcGVydHkgaXMgb25seSBwb3B1bGF0ZWQgd2hlbiBkaXJlY3QgY2xhc3MgdmFsdWVzIGFyZSBhcHBsaWVkXG4gICAqIChpLmUuIGNvbnRleHQgcmVzb2x1dGlvbiBpcyBub3QgdXNlZCkuXG4gICAqXG4gICAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nYCBmb3IgbW9yZSBpbmZvLlxuICAqL1xuICBsYXN0RGlyZWN0Q2xhc3NNYXA6IFN0eWxpbmdNYXBBcnJheXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBzdHlsZSBtYXAgdGhhdCB3YXMgYXBwbGllZCAoaS5lLiBgW3N0eWxlXT1cInhcImApXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIHByb3BlcnR5IGlzIG9ubHkgcG9wdWxhdGVkIHdoZW4gZGlyZWN0IHN0eWxlIHZhbHVlcyBhcmUgYXBwbGllZFxuICAgKiAoaS5lLiBjb250ZXh0IHJlc29sdXRpb24gaXMgbm90IHVzZWQpLlxuICAgKlxuICAgKiBTZWUgYGFsbG93RGlyZWN0U3R5bGluZ2AgZm9yIG1vcmUgaW5mby5cbiAgKi9cbiAgbGFzdERpcmVjdFN0eWxlTWFwOiBTdHlsaW5nTWFwQXJyYXl8bnVsbDtcbn1cblxuLy8gdGhlc2UgdmFsdWVzIHdpbGwgZ2V0IGZpbGxlZCBpbiB0aGUgdmVyeSBmaXJzdCB0aW1lIHRoaXMgaXMgYWNjZXNzZWQuLi5cbmNvbnN0IF9zdGF0ZTogU3R5bGluZ1N0YXRlID0ge1xuICBlbGVtZW50OiBudWxsLFxuICBkaXJlY3RpdmVJbmRleDogLTEsXG4gIHNvdXJjZUluZGV4OiAtMSxcbiAgY2xhc3Nlc0JpdE1hc2s6IC0xLFxuICBjbGFzc2VzSW5kZXg6IC0xLFxuICBzdHlsZXNCaXRNYXNrOiAtMSxcbiAgc3R5bGVzSW5kZXg6IC0xLFxuICBsYXN0RGlyZWN0Q2xhc3NNYXA6IG51bGwsXG4gIGxhc3REaXJlY3RTdHlsZU1hcDogbnVsbCxcbn07XG5cbmNvbnN0IEJJVF9NQVNLX1NUQVJUX1ZBTFVFID0gMDtcblxuLy8gdGhlIGAwYCBzdGFydCB2YWx1ZSBpcyByZXNlcnZlZCBmb3IgW21hcF0tYmFzZWQgZW50cmllc1xuY29uc3QgSU5ERVhfU1RBUlRfVkFMVUUgPSAxO1xuXG4vKipcbiAqIFJldHVybnMgKG9yIGluc3RhbnRpYXRlcykgdGhlIHN0eWxpbmcgc3RhdGUgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFN0eWxpbmcgc3RhdGUgaXMgYWNjZXNzZWQgYW5kIHByb2Nlc3NlZCBlYWNoIHRpbWUgYSBzdHlsZSBvciBjbGFzcyBiaW5kaW5nXG4gKiBpcyBldmFsdWF0ZWQuXG4gKlxuICogSWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBlbGVtZW50YCBkb2Vzbid0IG1hdGNoIHRoZSBjdXJyZW50IGVsZW1lbnQgaW4gdGhlXG4gKiBzdGF0ZSB0aGVuIHRoaXMgbWVhbnMgdGhhdCBzdHlsaW5nIHdhcyByZWNlbnRseSBjbGVhcmVkIG9yIHRoZSBlbGVtZW50IGhhc1xuICogY2hhbmdlZCBpbiBjaGFuZ2UgZGV0ZWN0aW9uLiBJbiBib3RoIGNhc2VzIHRoZSBzdHlsaW5nIHN0YXRlIGlzIGZ1bGx5IHJlc2V0LlxuICpcbiAqIElmIGFuZCB3aGVuIHRoZSBwcm92aWRlZCBgZGlyZWN0aXZlSW5kZXhgIGRvZXNuJ3QgbWF0Y2ggdGhlIGN1cnJlbnQgZGlyZWN0aXZlXG4gKiBpbmRleCBpbiB0aGUgc3RhdGUgdGhlbiB0aGlzIG1lYW5zIHRoYXQgYSBuZXcgc291cmNlIGhhcyBpbnRyb2R1Y2VkIGl0c2VsZiBpbnRvXG4gKiB0aGUgc3R5bGluZyBjb2RlIChvciwgaW4gb3RoZXIgd29yZHMsIGFub3RoZXIgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBoYXMgc3RhcnRlZFxuICogdG8gYXBwbHkgaXRzIHN0eWxpbmcgaG9zdCBiaW5kaW5ncyB0byB0aGUgZWxlbWVudCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBTdHlsaW5nU3RhdGUge1xuICBpZiAoX3N0YXRlLmVsZW1lbnQgIT09IGVsZW1lbnQpIHtcbiAgICBfc3RhdGUuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgX3N0YXRlLmRpcmVjdGl2ZUluZGV4ID0gZGlyZWN0aXZlSW5kZXg7XG4gICAgX3N0YXRlLnNvdXJjZUluZGV4ID0gZGlyZWN0aXZlSW5kZXggPT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA/IDAgOiAxO1xuICAgIF9zdGF0ZS5jbGFzc2VzQml0TWFzayA9IEJJVF9NQVNLX1NUQVJUX1ZBTFVFO1xuICAgIF9zdGF0ZS5jbGFzc2VzSW5kZXggPSBJTkRFWF9TVEFSVF9WQUxVRTtcbiAgICBfc3RhdGUuc3R5bGVzQml0TWFzayA9IEJJVF9NQVNLX1NUQVJUX1ZBTFVFO1xuICAgIF9zdGF0ZS5zdHlsZXNJbmRleCA9IElOREVYX1NUQVJUX1ZBTFVFO1xuICAgIF9zdGF0ZS5sYXN0RGlyZWN0Q2xhc3NNYXAgPSBudWxsO1xuICAgIF9zdGF0ZS5sYXN0RGlyZWN0U3R5bGVNYXAgPSBudWxsO1xuICB9IGVsc2UgaWYgKF9zdGF0ZS5kaXJlY3RpdmVJbmRleCAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICBfc3RhdGUuZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVJbmRleDtcbiAgICBfc3RhdGUuc291cmNlSW5kZXgrKztcbiAgfVxuICByZXR1cm4gX3N0YXRlO1xufVxuXG4vKipcbiAqIENsZWFycyB0aGUgc3R5bGluZyBzdGF0ZSBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGJ5IGFub3RoZXIgZWxlbWVudCdzIHN0eWxpbmcgY29kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0U3R5bGluZ1N0YXRlKCkge1xuICBfc3RhdGUuZWxlbWVudCA9IG51bGw7XG59XG4iXX0=