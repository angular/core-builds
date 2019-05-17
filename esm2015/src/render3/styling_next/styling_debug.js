/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { attachDebugObject } from '../util/debug_utils';
import { BIT_MASK_APPLY_ALL, DEFAULT_BINDING_INDEX_VALUE, applyStyling } from './bindings';
import { getDefaultValue, getGuardMask, getProp, getValuesCount, isContextLocked } from './util';
/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 * @record
 */
export function StylingSummary() { }
if (false) {
    /**
     * The style/class property that the summary is attached to
     * @type {?}
     */
    StylingSummary.prototype.prop;
    /**
     * The last applied value for the style/class property
     * @type {?}
     */
    StylingSummary.prototype.value;
    /**
     * The binding index of the last applied style/class property
     * @type {?}
     */
    StylingSummary.prototype.bindingIndex;
    /**
     * Every binding source that is writing the style/class property represented in this tuple
     * @type {?}
     */
    StylingSummary.prototype.sourceValues;
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
        const start = 2 /* ValuesStartPosition */;
        /** @type {?} */
        let i = start;
        while (i < context.length) {
            /** @type {?} */
            const prop = getProp(context, i);
            /** @type {?} */
            const guardMask = getGuardMask(context, i);
            /** @type {?} */
            const valuesCount = getValuesCount(context, i);
            /** @type {?} */
            const defaultValue = getDefaultValue(context, i);
            /** @type {?} */
            const bindingsStartPosition = i + 3 /* BindingsStartOffset */;
            /** @type {?} */
            const sources = [];
            for (let j = 0; j < valuesCount; j++) {
                sources.push((/** @type {?} */ (context[bindingsStartPosition + j])));
            }
            entries[prop] = { prop, guardMask, valuesCount, defaultValue, sources };
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
     */
    constructor(context, _data) {
        this.context = context;
        this._data = _data;
        this._contextDebug = (/** @type {?} */ (((/** @type {?} */ (this.context))).debug));
    }
    /**
     * Returns a detailed summary of each styling entry in the context and
     * what their runtime representation is.
     *
     * See `StylingSummary`.
     * @return {?}
     */
    get summary() {
        /** @type {?} */
        const contextEntries = this._contextDebug.entries;
        /** @type {?} */
        const finalValues = {};
        this._mapValues((/**
         * @param {?} prop
         * @param {?} value
         * @param {?} bindingIndex
         * @return {?}
         */
        (prop, value, bindingIndex) => {
            finalValues[prop] = { value, bindingIndex };
        }));
        /** @type {?} */
        const entries = {};
        /** @type {?} */
        const values = this.values;
        /** @type {?} */
        const props = Object.keys(values);
        for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = props[i];
            /** @type {?} */
            const contextEntry = contextEntries[prop];
            /** @type {?} */
            const sourceValues = contextEntry.sources.map((/**
             * @param {?} v
             * @return {?}
             */
            v => {
                /** @type {?} */
                let value;
                /** @type {?} */
                let bindingIndex;
                if (typeof v === 'number') {
                    value = this._data[v];
                    bindingIndex = v;
                }
                else {
                    value = v;
                    bindingIndex = null;
                }
                return { bindingIndex, value };
            }));
            /** @type {?} */
            const finalValue = (/** @type {?} */ (finalValues[prop]));
            /** @type {?} */
            let bindingIndex = finalValue.bindingIndex;
            bindingIndex = bindingIndex === DEFAULT_BINDING_INDEX_VALUE ? null : bindingIndex;
            entries[prop] = { prop, value: finalValue.value, bindingIndex, sourceValues };
        }
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
        const mapFn = (/**
         * @param {?} renderer
         * @param {?} element
         * @param {?} prop
         * @param {?} value
         * @param {?} bindingIndex
         * @return {?}
         */
        (renderer, element, prop, value, bindingIndex) => {
            fn(prop, value, bindingIndex);
        });
        applyStyling(this.context, null, mockElement, this._data, BIT_MASK_APPLY_ALL, mapFn);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._contextDebug;
    /** @type {?} */
    NodeStylingDebug.prototype.context;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._data;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXRELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSwyQkFBMkIsRUFBRSxZQUFZLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFekYsT0FBTyxFQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7O0FBUy9GLG9DQVlDOzs7Ozs7SUFWQyw4QkFBYTs7Ozs7SUFHYiwrQkFBbUI7Ozs7O0lBR25CLHNDQUEwQjs7Ozs7SUFHMUIsc0NBQTJFOzs7Ozs7QUFNN0Usa0NBZUM7Ozs7OztJQWJDLCtCQUF5Qjs7Ozs7O0lBTXpCLCtCQUE4Qzs7Ozs7O0lBTTlDLDhCQUEwRDs7Ozs7O0FBTTVELDBDQXNCQzs7Ozs7O0lBcEJDLG9DQUFhOzs7OztJQUdiLDJDQUFvQjs7Ozs7O0lBTXBCLHlDQUFrQjs7Ozs7SUFLbEIsNENBQWtDOzs7OztJQUtsQyx1Q0FBZ0M7Ozs7Ozs7QUFNbEMsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQXdCOztVQUN6RCxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7SUFDL0MsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7OztBQVFELE1BQU0sb0JBQW9COzs7O0lBQ3hCLFlBQTRCLE9BQXdCO1FBQXhCLFlBQU8sR0FBUCxPQUFPLENBQWlCO0lBQUcsQ0FBQzs7OztJQUV4RCxJQUFJLFFBQVEsS0FBSyxPQUFPLGVBQWUsQ0FB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QWlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcblxuaW1wb3J0IHtCSVRfTUFTS19BUFBMWV9BTEwsIERFRkFVTFRfQklORElOR19JTkRFWF9WQUxVRSwgYXBwbHlTdHlsaW5nfSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7U3R5bGluZ0JpbmRpbmdEYXRhLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0VmFsdWVzQ291bnQsIGlzQ29udGV4dExvY2tlZH0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdTdW1tYXJ5IHtcbiAgLyoqIFRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSB0aGF0IHRoZSBzdW1tYXJ5IGlzIGF0dGFjaGVkIHRvICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIGxhc3QgYXBwbGllZCB2YWx1ZSBmb3IgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIHZhbHVlOiBzdHJpbmd8bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xuXG4gIC8qKiBFdmVyeSBiaW5kaW5nIHNvdXJjZSB0aGF0IGlzIHdyaXRpbmcgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IHJlcHJlc2VudGVkIGluIHRoaXMgdHVwbGUgKi9cbiAgc291cmNlVmFsdWVzOiB7dmFsdWU6IHN0cmluZyB8IG51bWJlciB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGx9W107XG59XG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmcge1xuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dC5cbiAgICovXG4gIHN1bW1hcnk6IHtba2V5OiBzdHJpbmddOiBTdHlsaW5nU3VtbWFyeX18bnVsbDtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzLlxuICAgKi9cbiAgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdUdXBsZVN1bW1hcnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIHR1cGxlIHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhcGFydCBvZiB0aGlzIHR1cGxlICovXG4gIHZhbHVlc0NvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFuZCBzdHlsaW5nIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgZ3VhcmRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGlmIGFueSBiaW5kaW5ncyBhcmUgZmFsc3kuXG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlLlxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQpO1xuICBhdHRhY2hEZWJ1Z09iamVjdChjb250ZXh0LCBkZWJ1Zyk7XG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IHdpdGhpbiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5jbGFzcyBUU3R5bGluZ0NvbnRleHREZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHt9XG5cbiAgZ2V0IGlzTG9ja2VkKCkgeyByZXR1cm4gaXNDb250ZXh0TG9ja2VkKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYFRTdHlsaW5nVHVwbGVTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBlbnRyaWVzKCk6IHtbcHJvcDogc3RyaW5nXTogVFN0eWxpbmdUdXBsZVN1bW1hcnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogVFN0eWxpbmdUdXBsZVN1bW1hcnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSk7XG4gICAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuXG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVzQ291bnQ7IGorKykge1xuICAgICAgICBzb3VyY2VzLnB1c2goY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsKTtcbiAgICAgIH1cblxuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCBndWFyZE1hc2ssIHZhbHVlc0NvdW50LCBkZWZhdWx0VmFsdWUsIHNvdXJjZXN9O1xuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlU3R5bGluZ0RlYnVnIGltcGxlbWVudHMgRGVidWdTdHlsaW5nIHtcbiAgcHJpdmF0ZSBfY29udGV4dERlYnVnOiBUU3R5bGluZ0NvbnRleHREZWJ1ZztcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBwcml2YXRlIF9kYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEpIHtcbiAgICB0aGlzLl9jb250ZXh0RGVidWcgPSAodGhpcy5jb250ZXh0IGFzIGFueSkuZGVidWcgYXMgYW55O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYFN0eWxpbmdTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBzdW1tYXJ5KCk6IHtba2V5OiBzdHJpbmddOiBTdHlsaW5nU3VtbWFyeX0ge1xuICAgIGNvbnN0IGNvbnRleHRFbnRyaWVzID0gdGhpcy5fY29udGV4dERlYnVnLmVudHJpZXM7XG4gICAgY29uc3QgZmluYWxWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiB7dmFsdWU6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXJ9fSA9IHt9O1xuICAgIHRoaXMuX21hcFZhbHVlcygocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgZmluYWxWYWx1ZXNbcHJvcF0gPSB7dmFsdWUsIGJpbmRpbmdJbmRleH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogU3R5bGluZ1N1bW1hcnl9ID0ge307XG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy52YWx1ZXM7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIGNvbnN0IGNvbnRleHRFbnRyeSA9IGNvbnRleHRFbnRyaWVzW3Byb3BdO1xuICAgICAgY29uc3Qgc291cmNlVmFsdWVzID0gY29udGV4dEVudHJ5LnNvdXJjZXMubWFwKHYgPT4ge1xuICAgICAgICBsZXQgdmFsdWU6IHN0cmluZ3xudW1iZXJ8bnVsbDtcbiAgICAgICAgbGV0IGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICB2YWx1ZSA9IHRoaXMuX2RhdGFbdl07XG4gICAgICAgICAgYmluZGluZ0luZGV4ID0gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IHY7XG4gICAgICAgICAgYmluZGluZ0luZGV4ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2JpbmRpbmdJbmRleCwgdmFsdWV9O1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBmaW5hbFZhbHVlc1twcm9wXSAhO1xuICAgICAgbGV0IGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwgPSBmaW5hbFZhbHVlLmJpbmRpbmdJbmRleDtcbiAgICAgIGJpbmRpbmdJbmRleCA9IGJpbmRpbmdJbmRleCA9PT0gREVGQVVMVF9CSU5ESU5HX0lOREVYX1ZBTFVFID8gbnVsbCA6IGJpbmRpbmdJbmRleDtcblxuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZTogZmluYWxWYWx1ZS52YWx1ZSwgYmluZGluZ0luZGV4LCBzb3VyY2VWYWx1ZXN9O1xuICAgIH1cblxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcblxuICAgIGNvbnN0IG1hcEZuID1cbiAgICAgICAgKHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgZm4ocHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH07XG4gICAgYXBwbHlTdHlsaW5nKHRoaXMuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIHRoaXMuX2RhdGEsIEJJVF9NQVNLX0FQUExZX0FMTCwgbWFwRm4pO1xuICB9XG59XG4iXX0=