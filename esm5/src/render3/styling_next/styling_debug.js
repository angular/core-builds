import { attachDebugObject } from '../util/debug_utils';
import { applyStyling } from './bindings';
import { activeStylingMapFeature } from './map_based_bindings';
import { getCurrentOrLViewSanitizer, getDefaultValue, getGuardMask, getProp, getValuesCount, isContextLocked, isSanitizationRequired } from './util';
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context.
 */
export function attachStylingDebugObject(context) {
    var debug = new TStylingContextDebug(context);
    attachDebugObject(context, debug);
    return debug;
}
/**
 * A human-readable debug summary of the styling data present within `TStylingContext`.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
var TStylingContextDebug = /** @class */ (function () {
    function TStylingContextDebug(context) {
        this.context = context;
    }
    Object.defineProperty(TStylingContextDebug.prototype, "isLocked", {
        get: function () { return isContextLocked(this.context); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TStylingContextDebug.prototype, "entries", {
        /**
         * Returns a detailed summary of each styling entry in the context.
         *
         * See `TStylingTupleSummary`.
         */
        get: function () {
            var context = this.context;
            var entries = {};
            var start = 2 /* MapBindingsPosition */;
            var i = start;
            while (i < context.length) {
                var valuesCount = getValuesCount(context, i);
                // the context may contain placeholder values which are populated ahead of time,
                // but contain no actual binding values. In this situation there is no point in
                // classifying this as an "entry" since no real data is stored here yet.
                if (valuesCount) {
                    var prop = getProp(context, i);
                    var guardMask = getGuardMask(context, i);
                    var defaultValue = getDefaultValue(context, i);
                    var sanitizationRequired = isSanitizationRequired(context, i);
                    var bindingsStartPosition = i + 3 /* BindingsStartOffset */;
                    var sources = [];
                    for (var j = 0; j < valuesCount; j++) {
                        sources.push(context[bindingsStartPosition + j]);
                    }
                    entries[prop] = { prop: prop, guardMask: guardMask, sanitizationRequired: sanitizationRequired, valuesCount: valuesCount, defaultValue: defaultValue, sources: sources };
                }
                i += 3 /* BindingsStartOffset */ + valuesCount;
            }
            return entries;
        },
        enumerable: true,
        configurable: true
    });
    return TStylingContextDebug;
}());
/**
 * A human-readable debug summary of the styling data present for a `DebugNode` instance.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
var NodeStylingDebug = /** @class */ (function () {
    function NodeStylingDebug(context, _data, _isClassBased) {
        this.context = context;
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
    }
    /**
     * Overrides the sanitizer used to process styles.
     */
    NodeStylingDebug.prototype.overrideSanitizer = function (sanitizer) { this._sanitizer = sanitizer; };
    Object.defineProperty(NodeStylingDebug.prototype, "summary", {
        /**
         * Returns a detailed summary of each styling entry in the context and
         * what their runtime representation is.
         *
         * See `LStylingSummary`.
         */
        get: function () {
            var entries = {};
            this._mapValues(function (prop, value, bindingIndex) {
                entries[prop] = { prop: prop, value: value, bindingIndex: bindingIndex };
            });
            return entries;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NodeStylingDebug.prototype, "values", {
        /**
         * Returns a key/value map of all the styles/classes that were last applied to the element.
         */
        get: function () {
            var entries = {};
            this._mapValues(function (prop, value) { entries[prop] = value; });
            return entries;
        },
        enumerable: true,
        configurable: true
    });
    NodeStylingDebug.prototype._mapValues = function (fn) {
        // there is no need to store/track an element instance. The
        // element is only used when the styling algorithm attempts to
        // style the value (and we mock out the stylingApplyFn anyway).
        var mockElement = {};
        var hasMaps = getValuesCount(this.context, 2 /* MapBindingsPosition */) > 0;
        if (hasMaps) {
            activeStylingMapFeature();
        }
        var mapFn = function (renderer, element, prop, value, bindingIndex) {
            fn(prop, value, bindingIndex || null);
        };
        var sanitizer = this._isClassBased ? null : (this._sanitizer ||
            getCurrentOrLViewSanitizer(this._data));
        applyStyling(this.context, null, mockElement, this._data, true, mapFn, sanitizer);
    };
    return NodeStylingDebug;
}());
export { NodeStylingDebug };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0EsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFdEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFlBQVksQ0FBQztBQUV4QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUU3RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBYyxzQkFBc0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQXlGL0o7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBd0I7SUFDL0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRCxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSDtJQUNFLDhCQUE0QixPQUF3QjtRQUF4QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtJQUFHLENBQUM7SUFFeEQsc0JBQUksMENBQVE7YUFBWixjQUFpQixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQU94RCxzQkFBSSx5Q0FBTztRQUxYOzs7O1dBSUc7YUFDSDtZQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDN0IsSUFBTSxPQUFPLEdBQTJDLEVBQUUsQ0FBQztZQUMzRCxJQUFNLEtBQUssOEJBQTJDLENBQUM7WUFDdkQsSUFBSSxDQUFD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SSxPQUFPLEVBQUU7WUFDWCx1QkFBdUIsRUFBRSxDQUFDO1NBQzNCO1FBRUQsSUFBTSxLQUFLLEdBQ1AsVUFBQyxRQUFhLEVBQUUsT0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLFlBQW9CO1lBQy9FLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUM7UUFFTixJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVU7WUFDZiwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsS0FBYyxDQUFDLENBQUMsQ0FBQztRQUNoRyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBQ0gsdUJBQUM7QUFBRCxDQUFDLEFBdERELElBc0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFNBTklUSVpFUn0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ30gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldEN1cnJlbnRPckxWaWV3U2FuaXRpemVyLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0VmFsdWVzQ291bnQsIGlzQ29udGV4dExvY2tlZCwgaXNNYXBCYXNlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZH0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgZGVidWcgZnVuY3Rpb25hbGl0eSBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYSBzdHlsaW5nIGVudHJ5LlxuICpcbiAqIEEgdmFsdWUgc3VjaCBhcyB0aGlzIGlzIGdlbmVyYXRlZCBhcyBhbiBhcnRpZmFjdCBvZiB0aGUgYERlYnVnU3R5bGluZ2BcbiAqIHN1bW1hcnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFN0eWxpbmdTdW1tYXJ5IHtcbiAgLyoqIFRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSB0aGF0IHRoZSBzdW1tYXJ5IGlzIGF0dGFjaGVkIHRvICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIGxhc3QgYXBwbGllZCB2YWx1ZSBmb3IgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKiBUaGUgYmluZGluZyBpbmRleCBvZiB0aGUgbGFzdCBhcHBsaWVkIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG59XG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmcge1xuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dC5cbiAgICovXG4gIHN1bW1hcnk6IHtba2V5OiBzdHJpbmddOiBMU3R5bGluZ1N1bW1hcnl9O1xuXG4gIC8qKlxuICAgKiBBIGtleS92YWx1ZSBtYXAgb2YgYWxsIHN0eWxpbmcgcHJvcGVydGllcyBhbmQgdGhlaXJcbiAgICogcnVudGltZSB2YWx1ZXMuXG4gICAqL1xuICB2YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgYm9vbGVhbn07XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXMuXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIHdpdGhpbiBhIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nVHVwbGVTdW1tYXJ5IHtcbiAgLyoqIFRoZSBwcm9wZXJ0eSAoc3R5bGUgb3IgY2xhc3MgcHJvcGVydHkpIHRoYXQgdGhpcyB0dXBsZSByZXByZXNlbnRzICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIGVudHJpZXMgYXBhcnQgb2YgdGhpcyB0dXBsZSAqL1xuICB2YWx1ZXNDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbmQgc3R5bGluZyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIGd1YXJkTWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgcmVxdWlyZXMgc2FuaXRpemF0aW9uXG4gICAqL1xuICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeS5cbiAgICovXG4gIGRlZmF1bHRWYWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKipcbiAgICogQWxsIGJpbmRpbmdJbmRleCBzb3VyY2VzIHRoYXQgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgZm9yIHRoaXMgc3R5bGUuXG4gICAqL1xuICBzb3VyY2VzOiAobnVtYmVyfG51bGx8c3RyaW5nKVtdO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge31cblxuICBnZXQgaXNMb2NrZWQoKSB7IHJldHVybiBpc0NvbnRleHRMb2NrZWQodGhpcy5jb250ZXh0KTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFNlZSBgVFN0eWxpbmdUdXBsZVN1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBUU3R5bGluZ1R1cGxlU3VtbWFyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBUU3R5bGluZ1R1cGxlU3VtbWFyeX0gPSB7fTtcbiAgICBjb25zdCBzdGFydCA9IFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb247XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgICAgLy8gdGhlIGNvbnRleHQgbWF5IGNvbnRhaW4gcGxhY2Vob2xkZXIgdmFsdWVzIHdoaWNoIGFyZSBwb3B1bGF0ZWQgYWhlYWQgb2YgdGltZSxcbiAgICAgIC8vIGJ1dCBjb250YWluIG5vIGFjdHVhbCBiaW5kaW5nIHZhbHVlcy4gSW4gdGhpcyBzaXR1YXRpb24gdGhlcmUgaXMgbm8gcG9pbnQgaW5cbiAgICAgIC8vIGNsYXNzaWZ5aW5nIHRoaXMgYXMgYW4gXCJlbnRyeVwiIHNpbmNlIG5vIHJlYWwgZGF0YSBpcyBzdG9yZWQgaGVyZSB5ZXQuXG4gICAgICBpZiAodmFsdWVzQ291bnQpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRQb3NpdGlvbiA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuXG4gICAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVzQ291bnQ7IGorKykge1xuICAgICAgICAgIHNvdXJjZXMucHVzaChjb250ZXh0W2JpbmRpbmdzU3RhcnRQb3NpdGlvbiArIGpdIGFzIG51bWJlciB8IHN0cmluZyB8IG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCBndWFyZE1hc2ssIHNhbml0aXphdGlvblJlcXVpcmVkLCB2YWx1ZXNDb3VudCwgZGVmYXVsdFZhbHVlLCBzb3VyY2VzfTtcbiAgICAgIH1cblxuICAgICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZVN0eWxpbmdEZWJ1ZyBpbXBsZW1lbnRzIERlYnVnU3R5bGluZyB7XG4gIHByaXZhdGUgX3Nhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgICAgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkPzogYm9vbGVhbikge31cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpIHsgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCkgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuICAgIGNvbnN0IGhhc01hcHMgPSBnZXRWYWx1ZXNDb3VudCh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pID4gMDtcbiAgICBpZiAoaGFzTWFwcykge1xuICAgICAgYWN0aXZlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuICAgICAgICB9O1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldEN1cnJlbnRPckxWaWV3U2FuaXRpemVyKHRoaXMuX2RhdGEgYXMgTFZpZXcpKTtcbiAgICBhcHBseVN0eWxpbmcodGhpcy5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplcik7XG4gIH1cbn1cbiJdfQ==