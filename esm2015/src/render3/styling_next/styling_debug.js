/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { attachDebugObject } from '../util/debug_utils';
import { applyStyling } from './bindings';
import { activeStylingMapFeature } from './map_based_bindings';
import { getCurrentOrLViewSanitizer, getDefaultValue, getGuardMask, getProp, getValuesCount, isContextLocked, isSanitizationRequired } from './util';
/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 * @record
 */
export function LStylingSummary() { }
if (false) {
    /**
     * The style/class property that the summary is attached to
     * @type {?}
     */
    LStylingSummary.prototype.prop;
    /**
     * The last applied value for the style/class property
     * @type {?}
     */
    LStylingSummary.prototype.value;
    /**
     * The binding index of the last applied style/class property
     * @type {?}
     */
    LStylingSummary.prototype.bindingIndex;
}
/**
 * A debug/testing-oriented summary of all styling entries for a `DebugNode` instance.
 * @record
 */
export function DebugStyling() { }
if (false) {
    /**
     * The associated TStylingContext instance
     * @type {?}
     */
    DebugStyling.prototype.context;
    /**
     * A summarization of each style/class property
     * present in the context.
     * @type {?}
     */
    DebugStyling.prototype.summary;
    /**
     * A key/value map of all styling properties and their
     * runtime values.
     * @type {?}
     */
    DebugStyling.prototype.values;
    /**
     * Overrides the sanitizer used to process styles.
     * @param {?} sanitizer
     * @return {?}
     */
    DebugStyling.prototype.overrideSanitizer = function (sanitizer) { };
}
/**
 * A debug/testing-oriented summary of all styling entries within a `TStylingContext`.
 * @record
 */
export function TStylingTupleSummary() { }
if (false) {
    /**
     * The property (style or class property) that this tuple represents
     * @type {?}
     */
    TStylingTupleSummary.prototype.prop;
    /**
     * The total amount of styling entries apart of this tuple
     * @type {?}
     */
    TStylingTupleSummary.prototype.valuesCount;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when and styling bindings update
     * @type {?}
     */
    TStylingTupleSummary.prototype.guardMask;
    /**
     * Whether or not the entry requires sanitization
     * @type {?}
     */
    TStylingTupleSummary.prototype.sanitizationRequired;
    /**
     * The default value that will be applied if any bindings are falsy.
     * @type {?}
     */
    TStylingTupleSummary.prototype.defaultValue;
    /**
     * All bindingIndex sources that have been registered for this style.
     * @type {?}
     */
    TStylingTupleSummary.prototype.sources;
}
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context.
 * @param {?} context
 * @return {?}
 */
export function attachStylingDebugObject(context) {
    /** @type {?} */
    const debug = new TStylingContextDebug(context);
    attachDebugObject(context, debug);
    return debug;
}
/**
 * A human-readable debug summary of the styling data present within `TStylingContext`.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
class TStylingContextDebug {
    /**
     * @param {?} context
     */
    constructor(context) {
        this.context = context;
    }
    /**
     * @return {?}
     */
    get isLocked() { return isContextLocked(this.context); }
    /**
     * Returns a detailed summary of each styling entry in the context.
     *
     * See `TStylingTupleSummary`.
     * @return {?}
     */
    get entries() {
        /** @type {?} */
        const context = this.context;
        /** @type {?} */
        const entries = {};
        /** @type {?} */
        const start = 2 /* MapBindingsPosition */;
        /** @type {?} */
        let i = start;
        while (i < context.length) {
            /** @type {?} */
            const valuesCount = getValuesCount(context, i);
            // the context may contain placeholder values which are populated ahead of time,
            // but contain no actual binding values. In this situation there is no point in
            // classifying this as an "entry" since no real data is stored here yet.
            if (valuesCount) {
                /** @type {?} */
                const prop = getProp(context, i);
                /** @type {?} */
                const guardMask = getGuardMask(context, i);
                /** @type {?} */
                const defaultValue = getDefaultValue(context, i);
                /** @type {?} */
                const sanitizationRequired = isSanitizationRequired(context, i);
                /** @type {?} */
                const bindingsStartPosition = i + 3 /* BindingsStartOffset */;
                /** @type {?} */
                const sources = [];
                for (let j = 0; j < valuesCount; j++) {
                    sources.push((/** @type {?} */ (context[bindingsStartPosition + j])));
                }
                entries[prop] = { prop, guardMask, sanitizationRequired, valuesCount, defaultValue, sources };
            }
            i += 3 /* BindingsStartOffset */ + valuesCount;
        }
        return entries;
    }
}
if (false) {
    /** @type {?} */
    TStylingContextDebug.prototype.context;
}
/**
 * A human-readable debug summary of the styling data present for a `DebugNode` instance.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
export class NodeStylingDebug {
    /**
     * @param {?} context
     * @param {?} _data
     * @param {?=} _isClassBased
     */
    constructor(context, _data, _isClassBased) {
        this.context = context;
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
    }
    /**
     * Overrides the sanitizer used to process styles.
     * @param {?} sanitizer
     * @return {?}
     */
    overrideSanitizer(sanitizer) { this._sanitizer = sanitizer; }
    /**
     * Returns a detailed summary of each styling entry in the context and
     * what their runtime representation is.
     *
     * See `LStylingSummary`.
     * @return {?}
     */
    get summary() {
        /** @type {?} */
        const entries = {};
        this._mapValues((/**
         * @param {?} prop
         * @param {?} value
         * @param {?} bindingIndex
         * @return {?}
         */
        (prop, value, bindingIndex) => {
            entries[prop] = { prop, value, bindingIndex };
        }));
        return entries;
    }
    /**
     * Returns a key/value map of all the styles/classes that were last applied to the element.
     * @return {?}
     */
    get values() {
        /** @type {?} */
        const entries = {};
        this._mapValues((/**
         * @param {?} prop
         * @param {?} value
         * @return {?}
         */
        (prop, value) => { entries[prop] = value; }));
        return entries;
    }
    /**
     * @private
     * @param {?} fn
     * @return {?}
     */
    _mapValues(fn) {
        // there is no need to store/track an element instance. The
        // element is only used when the styling algorithm attempts to
        // style the value (and we mock out the stylingApplyFn anyway).
        /** @type {?} */
        const mockElement = (/** @type {?} */ ({}));
        /** @type {?} */
        const hasMaps = getValuesCount(this.context, 2 /* MapBindingsPosition */) > 0;
        if (hasMaps) {
            activeStylingMapFeature();
        }
        /** @type {?} */
        const mapFn = (/**
         * @param {?} renderer
         * @param {?} element
         * @param {?} prop
         * @param {?} value
         * @param {?=} bindingIndex
         * @return {?}
         */
        (renderer, element, prop, value, bindingIndex) => { fn(prop, value, bindingIndex || null); });
        /** @type {?} */
        const sanitizer = this._isClassBased ? null : (this._sanitizer ||
            getCurrentOrLViewSanitizer((/** @type {?} */ (this._data))));
        applyStyling(this.context, null, mockElement, this._data, true, mapFn, sanitizer);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._sanitizer;
    /** @type {?} */
    NodeStylingDebug.prototype.context;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._data;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._isClassBased;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVdBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXRELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFeEMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFN0QsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQWMsc0JBQXNCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7O0FBcUIvSixxQ0FTQzs7Ozs7O0lBUEMsK0JBQWE7Ozs7O0lBR2IsZ0NBQTJCOzs7OztJQUczQix1Q0FBMEI7Ozs7OztBQU01QixrQ0FvQkM7Ozs7OztJQWxCQywrQkFBeUI7Ozs7OztJQU16QiwrQkFBMEM7Ozs7OztJQU0xQyw4QkFBMEQ7Ozs7OztJQUsxRCxvRUFBeUQ7Ozs7OztBQU0zRCwwQ0EyQkM7Ozs7OztJQXpCQyxvQ0FBYTs7Ozs7SUFHYiwyQ0FBb0I7Ozs7OztJQU1wQix5Q0FBa0I7Ozs7O0lBS2xCLG9EQUE4Qjs7Ozs7SUFLOUIsNENBQWtDOzs7OztJQUtsQyx1Q0FBZ0M7Ozs7Ozs7QUFNbEMsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQXdCOztVQUN6RCxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7SUFDL0MsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7OztBQVFELE1BQU0sb0JBQW9COzs7O0lBQ3hCLFlBQTRCLE9BQXdCO1FBQXhCLFlB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MUYsSUFBSSxPQUFPLEVBQUU7WUFDWCx1QkFBdUIsRUFBRSxDQUFDO1NBQzNCOztjQUVLLEtBQUs7Ozs7Ozs7O1FBQ1AsQ0FBQyxRQUFhLEVBQUUsT0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBb0IsRUFDcEUsWUFBNEIsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBOztjQUUxRSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVO1lBQ2YsMEJBQTBCLENBQUMsbUJBQUEsSUFBSSxDQUFDLEtBQUssRUFBUyxDQUFDLENBQUM7UUFDL0YsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDcEYsQ0FBQztDQUNGOzs7Ozs7SUFwREMsc0NBQWdEOztJQUc1QyxtQ0FBK0I7Ozs7O0lBQUUsaUNBQTJCOzs7OztJQUM1RCx5Q0FBK0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlldywgU0FOSVRJWkVSfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5cbmltcG9ydCB7YXBwbHlTdHlsaW5nfSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWN0aXZlU3R5bGluZ01hcEZlYXR1cmV9IGZyb20gJy4vbWFwX2Jhc2VkX2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0Q3VycmVudE9yTFZpZXdTYW5pdGl6ZXIsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRWYWx1ZXNDb3VudCwgaXNDb250ZXh0TG9ja2VkLCBpc01hcEJhc2VkLCBpc1Nhbml0aXphdGlvblJlcXVpcmVkfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBkZWJ1ZyBmdW5jdGlvbmFsaXR5IGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhIHN0eWxpbmcgZW50cnkuXG4gKlxuICogQSB2YWx1ZSBzdWNoIGFzIHRoaXMgaXMgZ2VuZXJhdGVkIGFzIGFuIGFydGlmYWN0IG9mIHRoZSBgRGVidWdTdHlsaW5nYFxuICogc3VtbWFyeS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMU3R5bGluZ1N1bW1hcnkge1xuICAvKiogVGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IHRoYXQgdGhlIHN1bW1hcnkgaXMgYXR0YWNoZWQgdG8gKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgbGFzdCBhcHBsaWVkIHZhbHVlIGZvciB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqIFRoZSBiaW5kaW5nIGluZGV4IG9mIHRoZSBsYXN0IGFwcGxpZWQgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZyB7XG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBBIHN1bW1hcml6YXRpb24gb2YgZWFjaCBzdHlsZS9jbGFzcyBwcm9wZXJ0eVxuICAgKiBwcmVzZW50IGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgc3VtbWFyeToge1trZXk6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX07XG5cbiAgLyoqXG4gICAqIEEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgc3R5bGluZyBwcm9wZXJ0aWVzIGFuZCB0aGVpclxuICAgKiBydW50aW1lIHZhbHVlcy5cbiAgICovXG4gIHZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCBib29sZWFufTtcblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpOiB2b2lkO1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdUdXBsZVN1bW1hcnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIHR1cGxlIHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhcGFydCBvZiB0aGlzIHR1cGxlICovXG4gIHZhbHVlc0NvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFuZCBzdHlsaW5nIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgZ3VhcmRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSByZXF1aXJlcyBzYW5pdGl6YXRpb25cbiAgICovXG4gIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSB0aGF0IHdpbGwgYmUgYXBwbGllZCBpZiBhbnkgYmluZGluZ3MgYXJlIGZhbHN5LlxuICAgKi9cbiAgZGVmYXVsdFZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGwgYmluZGluZ0luZGV4IHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBzdHlsZS5cbiAgICovXG4gIHNvdXJjZXM6IChudW1iZXJ8bnVsbHxzdHJpbmcpW107XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGFuZCBhdHRhY2hlcyBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0RGVidWdgIHRvIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICBjb25zdCBkZWJ1ZyA9IG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0KTtcbiAgYXR0YWNoRGVidWdPYmplY3QoY29udGV4dCwgZGVidWcpO1xuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCB3aXRoaW4gYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuY2xhc3MgVFN0eWxpbmdDb250ZXh0RGVidWcge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7fVxuXG4gIGdldCBpc0xvY2tlZCgpIHsgcmV0dXJuIGlzQ29udGV4dExvY2tlZCh0aGlzLmNvbnRleHQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogU2VlIGBUU3R5bGluZ1R1cGxlU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgZW50cmllcygpOiB7W3Byb3A6IHN0cmluZ106IFRTdHlsaW5nVHVwbGVTdW1tYXJ5fSB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBlbnRyaWVzOiB7W3Byb3A6IHN0cmluZ106IFRTdHlsaW5nVHVwbGVTdW1tYXJ5fSA9IHt9O1xuICAgIGNvbnN0IHN0YXJ0ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbjtcbiAgICBsZXQgaSA9IHN0YXJ0O1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgICAvLyB0aGUgY29udGV4dCBtYXkgY29udGFpbiBwbGFjZWhvbGRlciB2YWx1ZXMgd2hpY2ggYXJlIHBvcHVsYXRlZCBhaGVhZCBvZiB0aW1lLFxuICAgICAgLy8gYnV0IGNvbnRhaW4gbm8gYWN0dWFsIGJpbmRpbmcgdmFsdWVzLiBJbiB0aGlzIHNpdHVhdGlvbiB0aGVyZSBpcyBubyBwb2ludCBpblxuICAgICAgLy8gY2xhc3NpZnlpbmcgdGhpcyBhcyBhbiBcImVudHJ5XCIgc2luY2Ugbm8gcmVhbCBkYXRhIGlzIHN0b3JlZCBoZXJlIHlldC5cbiAgICAgIGlmICh2YWx1ZXNDb3VudCkge1xuICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZXNDb3VudDsgaisrKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGNvbnRleHRbYmluZGluZ3NTdGFydFBvc2l0aW9uICsgal0gYXMgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIGd1YXJkTWFzaywgc2FuaXRpemF0aW9uUmVxdWlyZWQsIHZhbHVlc0NvdW50LCBkZWZhdWx0VmFsdWUsIHNvdXJjZXN9O1xuICAgICAgfVxuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlU3R5bGluZ0RlYnVnIGltcGxlbWVudHMgRGVidWdTdHlsaW5nIHtcbiAgcHJpdmF0ZSBfc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBwcml2YXRlIF9kYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgICBwcml2YXRlIF9pc0NsYXNzQmFzZWQ/OiBib29sZWFuKSB7fVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzLlxuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCkgeyB0aGlzLl9zYW5pdGl6ZXIgPSBzYW5pdGl6ZXI7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0IGFuZFxuICAgKiB3aGF0IHRoZWlyIHJ1bnRpbWUgcmVwcmVzZW50YXRpb24gaXMuXG4gICAqXG4gICAqIFNlZSBgTFN0eWxpbmdTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBzdW1tYXJ5KCk6IHtba2V5OiBzdHJpbmddOiBMU3R5bGluZ1N1bW1hcnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fSA9IHt9O1xuICAgIHRoaXMuX21hcFZhbHVlcygocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgIGVudHJpZXNbcHJvcF0gPSB7cHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleH07XG4gICAgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGtleS92YWx1ZSBtYXAgb2YgYWxsIHRoZSBzdHlsZXMvY2xhc3NlcyB0aGF0IHdlcmUgbGFzdCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IHZhbHVlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgPT4geyBlbnRyaWVzW3Byb3BdID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWFwVmFsdWVzKGZuOiAocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcbiAgICBjb25zdCBoYXNNYXBzID0gZ2V0VmFsdWVzQ291bnQodGhpcy5jb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uKSA+IDA7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFwRm46IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAgICAgKHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgYmluZGluZ0luZGV4PzogbnVtYmVyIHwgbnVsbCkgPT4geyBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpOyB9O1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEN1cnJlbnRPckxWaWV3U2FuaXRpemVyKHRoaXMuX2RhdGEgYXMgTFZpZXcpKTtcbiAgICBhcHBseVN0eWxpbmcodGhpcy5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplcik7XG4gIH1cbn1cbiJdfQ==