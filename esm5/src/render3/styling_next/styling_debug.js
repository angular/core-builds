import { attachDebugObject } from '../util/debug_utils';
import { applyStyling } from './bindings';
import { activeStylingMapFeature } from './map_based_bindings';
import { getDefaultValue, getGuardMask, getProp, getValuesCount, isContextLocked } from './util';
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
                    var bindingsStartPosition = i + 3 /* BindingsStartOffset */;
                    var sources = [];
                    for (var j = 0; j < valuesCount; j++) {
                        sources.push(context[bindingsStartPosition + j]);
                    }
                    entries[prop] = { prop: prop, guardMask: guardMask, valuesCount: valuesCount, defaultValue: defaultValue, sources: sources };
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
    function NodeStylingDebug(context, _data) {
        this.context = context;
        this._data = _data;
    }
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
        applyStyling(this.context, null, mockElement, this._data, true, mapFn);
    };
    return NodeStylingDebug;
}());
export { NodeStylingDebug };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFdEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFlBQVksQ0FBQztBQUV4QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBYSxNQUFNLFFBQVEsQ0FBQztBQTZFM0c7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBd0I7SUFDL0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRCxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSDtJQUNFLDhCQUE0QixPQUF3QjtRQUF4QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtJQUFHLENBQUM7SUFFeEQsc0JBQUksMENBQVE7YUFBWixjQUFpQixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQU94RCxzQkFBSSx5Q0FBTztRQUxYOzs7O1dBSUc7YUFDSDtZQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDN0IsSUFBTSxPQUFPLEdBQTJDLEVBQUUsQ0FBQztZQUMzRCxJQUFNLEtBQUssOEJBQTJDLENBQUM7WUFDdkQsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ2QsT0FB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QUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFDSCx1QkFBQztBQUFELENBQUMsQUEzQ0QsSUEyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ30gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2dldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRWYWx1ZXNDb3VudCwgaXNDb250ZXh0TG9ja2VkLCBpc01hcEJhc2VkfSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExTdHlsaW5nU3VtbWFyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nIHtcbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqXG4gICAqIEEgc3VtbWFyaXphdGlvbiBvZiBlYWNoIHN0eWxlL2NsYXNzIHByb3BlcnR5XG4gICAqIHByZXNlbnQgaW4gdGhlIGNvbnRleHQuXG4gICAqL1xuICBzdW1tYXJ5OiB7W2tleTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fTtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzLlxuICAgKi9cbiAgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdUdXBsZVN1bW1hcnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIHR1cGxlIHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhcGFydCBvZiB0aGlzIHR1cGxlICovXG4gIHZhbHVlc0NvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFuZCBzdHlsaW5nIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgZ3VhcmRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGlmIGFueSBiaW5kaW5ncyBhcmUgZmFsc3kuXG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlLlxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQpO1xuICBhdHRhY2hEZWJ1Z09iamVjdChjb250ZXh0LCBkZWJ1Zyk7XG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IHdpdGhpbiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5jbGFzcyBUU3R5bGluZ0NvbnRleHREZWJ1ZyB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHt9XG5cbiAgZ2V0IGlzTG9ja2VkKCkgeyByZXR1cm4gaXNDb250ZXh0TG9ja2VkKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYFRTdHlsaW5nVHVwbGVTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBlbnRyaWVzKCk6IHtbcHJvcDogc3RyaW5nXTogVFN0eWxpbmdUdXBsZVN1bW1hcnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogVFN0eWxpbmdUdXBsZVN1bW1hcnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICAgIC8vIHRoZSBjb250ZXh0IG1heSBjb250YWluIHBsYWNlaG9sZGVyIHZhbHVlcyB3aGljaCBhcmUgcG9wdWxhdGVkIGFoZWFkIG9mIHRpbWUsXG4gICAgICAvLyBidXQgY29udGFpbiBubyBhY3R1YWwgYmluZGluZyB2YWx1ZXMuIEluIHRoaXMgc2l0dWF0aW9uIHRoZXJlIGlzIG5vIHBvaW50IGluXG4gICAgICAvLyBjbGFzc2lmeWluZyB0aGlzIGFzIGFuIFwiZW50cnlcIiBzaW5jZSBubyByZWFsIGRhdGEgaXMgc3RvcmVkIGhlcmUgeWV0LlxuICAgICAgaWYgKHZhbHVlc0NvdW50KSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZXNDb3VudDsgaisrKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGNvbnRleHRbYmluZGluZ3NTdGFydFBvc2l0aW9uICsgal0gYXMgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIGd1YXJkTWFzaywgdmFsdWVzQ291bnQsIGRlZmF1bHRWYWx1ZSwgc291cmNlc307XG4gICAgICB9XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmcge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBwcml2YXRlIF9kYXRhOiBMU3R5bGluZ0RhdGEpIHt9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCkgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuICAgIGNvbnN0IGhhc01hcHMgPSBnZXRWYWx1ZXNDb3VudCh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pID4gMDtcbiAgICBpZiAoaGFzTWFwcykge1xuICAgICAgYWN0aXZlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuICAgICAgICB9O1xuXG4gICAgYXBwbHlTdHlsaW5nKHRoaXMuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIHRoaXMuX2RhdGEsIHRydWUsIG1hcEZuKTtcbiAgfVxufVxuIl19