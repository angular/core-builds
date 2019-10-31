/**
 * @fileoverview added by tsickle
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7Ozs7O0FBOEIvRCxrQ0F5Q0M7Ozs7OztJQXZDQywrQkFBdUI7Ozs7O0lBR3ZCLHNDQUF1Qjs7Ozs7SUFHdkIsbUNBQW9COzs7OztJQUdwQixzQ0FBdUI7Ozs7O0lBR3ZCLG9DQUFxQjs7Ozs7SUFHckIscUNBQXNCOzs7OztJQUd0QixtQ0FBb0I7Ozs7Ozs7Ozs7SUFVcEIsMENBQXlDOzs7Ozs7Ozs7O0lBVXpDLDBDQUF5Qzs7OztNQUlyQyxNQUFNLEdBQWlCO0lBQzNCLE9BQU8sRUFBRSxJQUFJO0lBQ2IsY0FBYyxFQUFFLENBQUMsQ0FBQztJQUNsQixXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ2YsY0FBYyxFQUFFLENBQUMsQ0FBQztJQUNsQixZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ2hCLGFBQWEsRUFBRSxDQUFDLENBQUM7SUFDakIsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUNmLGtCQUFrQixFQUFFLElBQUk7SUFDeEIsa0JBQWtCLEVBQUUsSUFBSTtDQUN6Qjs7TUFFSyxvQkFBb0IsR0FBRyxDQUFDOzs7TUFHeEIsaUJBQWlCLEdBQUcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCM0IsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUFpQixFQUFFLGNBQXNCO0lBQ3ZFLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxPQUFPLEVBQUU7UUFDOUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDekIsTUFBTSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDdkMsTUFBTSxDQUFDLFdBQVcsR0FBRyxjQUFjLEtBQUssd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sQ0FBQyxjQUFjLEdBQUcsb0JBQW9CLENBQUM7UUFDN0MsTUFBTSxDQUFDLFlBQVksR0FBRyxpQkFBaUIsQ0FBQztRQUN4QyxNQUFNLENBQUMsYUFBYSxHQUFHLG9CQUFvQixDQUFDO1FBQzVDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLENBQUM7UUFDdkMsTUFBTSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUNqQyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0tBQ2xDO1NBQU0sSUFBSSxNQUFNLENBQUMsY0FBYyxLQUFLLGNBQWMsRUFBRTtRQUNuRCxNQUFNLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUN2QyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDdEI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDOzs7OztBQUtELE1BQU0sVUFBVSxpQkFBaUI7SUFDL0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXl9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWH0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBhbGwgc3RhdGUtYmFzZWQgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBTdHlsaW5nIGluIEFuZ3VsYXIgaXMgZXZhbHVhdGVkIHdpdGggYSBzZXJpZXMgb2Ygc3R5bGluZy1zcGVjaWZpY1xuICogdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHdoaWNoIGFyZSBjYWxsZWQgb25lIGFmdGVyIGFub3RoZXIgZWFjaCB0aW1lXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uIG9jY3VycyBpbiBBbmd1bGFyLlxuICpcbiAqIFN0eWxpbmcgbWFrZXMgdXNlIG9mIHZhcmlvdXMgdGVtcG9yYXJ5LCBzdGF0ZS1iYXNlZCB2YXJpYWJsZXMgYmV0d2VlblxuICogaW5zdHJ1Y3Rpb25zIHNvIHRoYXQgaXQgY2FuIGJldHRlciBjYWNoZSBhbmQgb3B0aW1pemUgaXRzIHZhbHVlcy5cbiAqIFRoZXNlIHZhbHVlcyBhcmUgdXN1YWxseSBwb3B1bGF0ZWQgYW5kIGNsZWFyZWQgd2hlbiBhbiBlbGVtZW50IGlzXG4gKiBleGl0ZWQgaW4gY2hhbmdlIGRldGVjdGlvbiAob25jZSBhbGwgdGhlIGluc3RydWN0aW9ucyBhcmUgcnVuIGZvclxuICogdGhhdCBlbGVtZW50KS5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBVc2VkIGFzIGEgc3RhdGUgcmVmZXJlbmNlIGZvciB1cGRhdGUgdmFsdWVzIGJldHdlZW4gc3R5bGUvY2xhc3MgYmluZGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogSW4gYWRkaXRpb24gdG8gc3RvcmluZyB0aGUgZWxlbWVudCBhbmQgYml0LW1hc2sgcmVsYXRlZCB2YWx1ZXMsIHRoZSBzdGF0ZSBhbHNvXG4gKiBzdG9yZXMgdGhlIGBzb3VyY2VJbmRleGAgdmFsdWUuIFRoZSBgc291cmNlSW5kZXhgIHZhbHVlIGlzIGFuIGluY3JlbWVudGVkIHZhbHVlXG4gKiB0aGF0IGlkZW50aWZpZXMgd2hhdCBcInNvdXJjZVwiIChpLmUuIHRoZSB0ZW1wbGF0ZSwgYSBzcGVjaWZpYyBkaXJlY3RpdmUgYnkgaW5kZXggb3JcbiAqIGNvbXBvbmVudCkgaXMgY3VycmVudGx5IGFwcGx5aW5nIGl0cyBzdHlsaW5nIGJpbmRpbmdzIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdTdGF0ZSB7XG4gIC8qKiBUaGUgZWxlbWVudCB0aGF0IGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQgKi9cbiAgZWxlbWVudDogUkVsZW1lbnR8bnVsbDtcblxuICAvKiogVGhlIGRpcmVjdGl2ZSBpbmRleCB0aGF0IGlzIGN1cnJlbnRseSBhY3RpdmUgKGAwYCA9PT0gdGVtcGxhdGUpICovXG4gIGRpcmVjdGl2ZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBzb3VyY2UgKGNvbHVtbikgaW5kZXggdGhhdCBpcyBjdXJyZW50bHkgYWN0aXZlIChgMGAgPT09IHRlbXBsYXRlKSAqL1xuICBzb3VyY2VJbmRleDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgY2xhc3NlcyB1cGRhdGUgYml0IG1hc2sgdmFsdWUgdGhhdCBpcyBwcm9jZXNzZWQgZHVyaW5nIGVhY2ggY2xhc3MgYmluZGluZyAqL1xuICBjbGFzc2VzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKiBUaGUgY2xhc3NlcyB1cGRhdGUgYml0IGluZGV4IHZhbHVlIHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBlYWNoIGNsYXNzIGJpbmRpbmcgKi9cbiAgY2xhc3Nlc0luZGV4OiBudW1iZXI7XG5cbiAgLyoqIFRoZSBzdHlsZXMgdXBkYXRlIGJpdCBtYXNrIHZhbHVlIHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBlYWNoIHN0eWxlIGJpbmRpbmcgKi9cbiAgc3R5bGVzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKiBUaGUgc3R5bGVzIHVwZGF0ZSBiaXQgaW5kZXggdmFsdWUgdGhhdCBpcyBwcm9jZXNzZWQgZHVyaW5nIGVhY2ggc3R5bGUgYmluZGluZyAqL1xuICBzdHlsZXNJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBjbGFzcyBtYXAgdGhhdCB3YXMgYXBwbGllZCAoaS5lLiBgW2NsYXNzXT1cInhcImApLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBwcm9wZXJ0eSBpcyBvbmx5IHBvcHVsYXRlZCB3aGVuIGRpcmVjdCBjbGFzcyB2YWx1ZXMgYXJlIGFwcGxpZWRcbiAgICogKGkuZS4gY29udGV4dCByZXNvbHV0aW9uIGlzIG5vdCB1c2VkKS5cbiAgICpcbiAgICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdgIGZvciBtb3JlIGluZm8uXG4gICovXG4gIGxhc3REaXJlY3RDbGFzc01hcDogU3R5bGluZ01hcEFycmF5fG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHN0eWxlIG1hcCB0aGF0IHdhcyBhcHBsaWVkIChpLmUuIGBbc3R5bGVdPVwieFwiYClcbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgcHJvcGVydHkgaXMgb25seSBwb3B1bGF0ZWQgd2hlbiBkaXJlY3Qgc3R5bGUgdmFsdWVzIGFyZSBhcHBsaWVkXG4gICAqIChpLmUuIGNvbnRleHQgcmVzb2x1dGlvbiBpcyBub3QgdXNlZCkuXG4gICAqXG4gICAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nYCBmb3IgbW9yZSBpbmZvLlxuICAqL1xuICBsYXN0RGlyZWN0U3R5bGVNYXA6IFN0eWxpbmdNYXBBcnJheXxudWxsO1xufVxuXG4vLyB0aGVzZSB2YWx1ZXMgd2lsbCBnZXQgZmlsbGVkIGluIHRoZSB2ZXJ5IGZpcnN0IHRpbWUgdGhpcyBpcyBhY2Nlc3NlZC4uLlxuY29uc3QgX3N0YXRlOiBTdHlsaW5nU3RhdGUgPSB7XG4gIGVsZW1lbnQ6IG51bGwsXG4gIGRpcmVjdGl2ZUluZGV4OiAtMSxcbiAgc291cmNlSW5kZXg6IC0xLFxuICBjbGFzc2VzQml0TWFzazogLTEsXG4gIGNsYXNzZXNJbmRleDogLTEsXG4gIHN0eWxlc0JpdE1hc2s6IC0xLFxuICBzdHlsZXNJbmRleDogLTEsXG4gIGxhc3REaXJlY3RDbGFzc01hcDogbnVsbCxcbiAgbGFzdERpcmVjdFN0eWxlTWFwOiBudWxsLFxufTtcblxuY29uc3QgQklUX01BU0tfU1RBUlRfVkFMVUUgPSAwO1xuXG4vLyB0aGUgYDBgIHN0YXJ0IHZhbHVlIGlzIHJlc2VydmVkIGZvciBbbWFwXS1iYXNlZCBlbnRyaWVzXG5jb25zdCBJTkRFWF9TVEFSVF9WQUxVRSA9IDE7XG5cbi8qKlxuICogUmV0dXJucyAob3IgaW5zdGFudGlhdGVzKSB0aGUgc3R5bGluZyBzdGF0ZSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogU3R5bGluZyBzdGF0ZSBpcyBhY2Nlc3NlZCBhbmQgcHJvY2Vzc2VkIGVhY2ggdGltZSBhIHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdcbiAqIGlzIGV2YWx1YXRlZC5cbiAqXG4gKiBJZiBhbmQgd2hlbiB0aGUgcHJvdmlkZWQgYGVsZW1lbnRgIGRvZXNuJ3QgbWF0Y2ggdGhlIGN1cnJlbnQgZWxlbWVudCBpbiB0aGVcbiAqIHN0YXRlIHRoZW4gdGhpcyBtZWFucyB0aGF0IHN0eWxpbmcgd2FzIHJlY2VudGx5IGNsZWFyZWQgb3IgdGhlIGVsZW1lbnQgaGFzXG4gKiBjaGFuZ2VkIGluIGNoYW5nZSBkZXRlY3Rpb24uIEluIGJvdGggY2FzZXMgdGhlIHN0eWxpbmcgc3RhdGUgaXMgZnVsbHkgcmVzZXQuXG4gKlxuICogSWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBkaXJlY3RpdmVJbmRleGAgZG9lc24ndCBtYXRjaCB0aGUgY3VycmVudCBkaXJlY3RpdmVcbiAqIGluZGV4IGluIHRoZSBzdGF0ZSB0aGVuIHRoaXMgbWVhbnMgdGhhdCBhIG5ldyBzb3VyY2UgaGFzIGludHJvZHVjZWQgaXRzZWxmIGludG9cbiAqIHRoZSBzdHlsaW5nIGNvZGUgKG9yLCBpbiBvdGhlciB3b3JkcywgYW5vdGhlciBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGhhcyBzdGFydGVkXG4gKiB0byBhcHBseSBpdHMgc3R5bGluZyBob3N0IGJpbmRpbmdzIHRvIHRoZSBlbGVtZW50KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdTdGF0ZShlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IFN0eWxpbmdTdGF0ZSB7XG4gIGlmIChfc3RhdGUuZWxlbWVudCAhPT0gZWxlbWVudCkge1xuICAgIF9zdGF0ZS5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBfc3RhdGUuZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVJbmRleDtcbiAgICBfc3RhdGUuc291cmNlSW5kZXggPSBkaXJlY3RpdmVJbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYID8gMCA6IDE7XG4gICAgX3N0YXRlLmNsYXNzZXNCaXRNYXNrID0gQklUX01BU0tfU1RBUlRfVkFMVUU7XG4gICAgX3N0YXRlLmNsYXNzZXNJbmRleCA9IElOREVYX1NUQVJUX1ZBTFVFO1xuICAgIF9zdGF0ZS5zdHlsZXNCaXRNYXNrID0gQklUX01BU0tfU1RBUlRfVkFMVUU7XG4gICAgX3N0YXRlLnN0eWxlc0luZGV4ID0gSU5ERVhfU1RBUlRfVkFMVUU7XG4gICAgX3N0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA9IG51bGw7XG4gICAgX3N0YXRlLmxhc3REaXJlY3RTdHlsZU1hcCA9IG51bGw7XG4gIH0gZWxzZSBpZiAoX3N0YXRlLmRpcmVjdGl2ZUluZGV4ICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgIF9zdGF0ZS5kaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZUluZGV4O1xuICAgIF9zdGF0ZS5zb3VyY2VJbmRleCsrO1xuICB9XG4gIHJldHVybiBfc3RhdGU7XG59XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBzdHlsaW5nIHN0YXRlIHNvIHRoYXQgaXQgY2FuIGJlIHVzZWQgYnkgYW5vdGhlciBlbGVtZW50J3Mgc3R5bGluZyBjb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTdHlsaW5nU3RhdGUoKSB7XG4gIF9zdGF0ZS5lbGVtZW50ID0gbnVsbDtcbn1cbiJdfQ==