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
         * @param {?} bindingIndex
         * @return {?}
         */
        (renderer, element, prop, value, bindingIndex) => {
            fn(prop, value, bindingIndex || null);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVdBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXRELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFeEMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFN0QsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQWMsc0JBQXNCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7O0FBcUIvSixxQ0FTQzs7Ozs7O0lBUEMsK0JBQWE7Ozs7O0lBR2IsZ0NBQTJCOzs7OztJQUczQix1Q0FBMEI7Ozs7OztBQU01QixrQ0FvQkM7Ozs7OztJQWxCQywrQkFBeUI7Ozs7OztJQU16QiwrQkFBMEM7Ozs7OztJQU0xQyw4QkFBMEQ7Ozs7OztJQUsxRCxvRUFBeUQ7Ozs7OztBQU0zRCwwQ0EyQkM7Ozs7OztJQXpCQyxvQ0FBYTs7Ozs7SUFHYiwyQ0FBb0I7Ozs7OztJQU1wQix5Q0FBa0I7Ozs7O0lBS2xCLG9EQUE4Qjs7Ozs7SUFLOUIsNENBQWtDOzs7OztJQUtsQyx1Q0FBZ0M7Ozs7Ozs7QUFNbEMsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQXdCOztVQUN6RCxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7SUFDL0MsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7OztBQVFELE1BQU0sb0JBQW9COzs7O0lBQ3hCLFlBQTRCLE9BQXdCO1FBQXhCLFlB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MUYsSUFBSSxPQUFPLEVBQUU7WUFDWCx1QkFBdUIsRUFBRSxDQUFDO1NBQzNCOztjQUVLLEtBQUs7Ozs7Ozs7O1FBQ1AsQ0FBQyxRQUFhLEVBQUUsT0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLFlBQW9CLEVBQUUsRUFBRTtZQUNuRixFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxZQUFZLElBQUksSUFBSSxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFBOztjQUVDLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVU7WUFDZiwwQkFBMEIsQ0FBQyxtQkFBQSxJQUFJLENBQUMsS0FBSyxFQUFTLENBQUMsQ0FBQztRQUMvRixZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDO0NBQ0Y7Ozs7OztJQXJEQyxzQ0FBZ0Q7O0lBRzVDLG1DQUErQjs7Ozs7SUFBRSxpQ0FBMkI7Ozs7O0lBQzVELHlDQUErQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3LCBTQU5JVElaRVJ9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcblxuaW1wb3J0IHthcHBseVN0eWxpbmd9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHthY3RpdmVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDdXJyZW50T3JMVmlld1Nhbml0aXplciwgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldFByb3AsIGdldFZhbHVlc0NvdW50LCBpc0NvbnRleHRMb2NrZWQsIGlzTWFwQmFzZWQsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWR9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExTdHlsaW5nU3VtbWFyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nIHtcbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqXG4gICAqIEEgc3VtbWFyaXphdGlvbiBvZiBlYWNoIHN0eWxlL2NsYXNzIHByb3BlcnR5XG4gICAqIHByZXNlbnQgaW4gdGhlIGNvbnRleHQuXG4gICAqL1xuICBzdW1tYXJ5OiB7W2tleTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fTtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzLlxuICAgKi9cbiAgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzLlxuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyB3aXRoaW4gYSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUU3R5bGluZ1R1cGxlU3VtbWFyeSB7XG4gIC8qKiBUaGUgcHJvcGVydHkgKHN0eWxlIG9yIGNsYXNzIHByb3BlcnR5KSB0aGF0IHRoaXMgdHVwbGUgcmVwcmVzZW50cyAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBlbnRyaWVzIGFwYXJ0IG9mIHRoaXMgdHVwbGUgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW5kIHN0eWxpbmcgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICBndWFyZE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGVudHJ5IHJlcXVpcmVzIHNhbml0aXphdGlvblxuICAgKi9cbiAgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGlmIGFueSBiaW5kaW5ncyBhcmUgZmFsc3kuXG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlLlxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQpO1xuICBhdHRhY2hEZWJ1Z09iamVjdChjb250ZXh0LCBkZWJ1Zyk7XG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IHdpdGhpbiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5jbGFzcyBUU3R5bGluZ0NvbnRleHREZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHt9XG5cbiAgZ2V0IGlzTG9ja2VkKCkgeyByZXR1cm4gaXNDb250ZXh0TG9ja2VkKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYFRTdHlsaW5nVHVwbGVTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBlbnRyaWVzKCk6IHtbcHJvcDogc3RyaW5nXTogVFN0eWxpbmdUdXBsZVN1bW1hcnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogVFN0eWxpbmdUdXBsZVN1bW1hcnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICAgIC8vIHRoZSBjb250ZXh0IG1heSBjb250YWluIHBsYWNlaG9sZGVyIHZhbHVlcyB3aGljaCBhcmUgcG9wdWxhdGVkIGFoZWFkIG9mIHRpbWUsXG4gICAgICAvLyBidXQgY29udGFpbiBubyBhY3R1YWwgYmluZGluZyB2YWx1ZXMuIEluIHRoaXMgc2l0dWF0aW9uIHRoZXJlIGlzIG5vIHBvaW50IGluXG4gICAgICAvLyBjbGFzc2lmeWluZyB0aGlzIGFzIGFuIFwiZW50cnlcIiBzaW5jZSBubyByZWFsIGRhdGEgaXMgc3RvcmVkIGhlcmUgeWV0LlxuICAgICAgaWYgKHZhbHVlc0NvdW50KSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcblxuICAgICAgICBjb25zdCBzb3VyY2VzOiAobnVtYmVyIHwgc3RyaW5nIHwgbnVsbClbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlc0NvdW50OyBqKyspIHtcbiAgICAgICAgICBzb3VyY2VzLnB1c2goY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVudHJpZXNbcHJvcF0gPSB7cHJvcCwgZ3VhcmRNYXNrLCBzYW5pdGl6YXRpb25SZXF1aXJlZCwgdmFsdWVzQ291bnQsIGRlZmF1bHRWYWx1ZSwgc291cmNlc307XG4gICAgICB9XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmcge1xuICBwcml2YXRlIF9zYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2RhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIHByaXZhdGUgX2lzQ2xhc3NCYXNlZD86IGJvb2xlYW4pIHt9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXMuXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKSB7IHRoaXMuX3Nhbml0aXplciA9IHNhbml0aXplcjsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQgYW5kXG4gICAqIHdoYXQgdGhlaXIgcnVudGltZSByZXByZXNlbnRhdGlvbiBpcy5cbiAgICpcbiAgICogU2VlIGBMU3R5bGluZ1N1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IHN1bW1hcnkoKToge1trZXk6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBMU3R5bGluZ1N1bW1hcnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgdGhlIHN0eWxlcy9jbGFzc2VzIHRoYXQgd2VyZSBsYXN0IGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAqL1xuICBnZXQgdmFsdWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIHRoaXMuX21hcFZhbHVlcygocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7IGVudHJpZXNbcHJvcF0gPSB2YWx1ZTsgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICBwcml2YXRlIF9tYXBWYWx1ZXMoZm46IChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcbiAgICBjb25zdCBoYXNNYXBzID0gZ2V0VmFsdWVzQ291bnQodGhpcy5jb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uKSA+IDA7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFwRm46IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAgICAgKHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgZm4ocHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleCB8fCBudWxsKTtcbiAgICAgICAgfTtcblxuICAgIGNvbnN0IHNhbml0aXplciA9IHRoaXMuX2lzQ2xhc3NCYXNlZCA/IG51bGwgOiAodGhpcy5fc2FuaXRpemVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRDdXJyZW50T3JMVmlld1Nhbml0aXplcih0aGlzLl9kYXRhIGFzIExWaWV3KSk7XG4gICAgYXBwbHlTdHlsaW5nKHRoaXMuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIHRoaXMuX2RhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIpO1xuICB9XG59XG4iXX0=