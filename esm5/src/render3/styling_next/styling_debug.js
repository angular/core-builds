import { attachDebugObject } from '../util/debug_utils';
import { BIT_MASK_APPLY_ALL, DEFAULT_BINDING_INDEX_VALUE, applyStyling } from './bindings';
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
            var start = 2 /* ValuesStartPosition */;
            var i = start;
            while (i < context.length) {
                var prop = getProp(context, i);
                var guardMask = getGuardMask(context, i);
                var valuesCount = getValuesCount(context, i);
                var defaultValue = getDefaultValue(context, i);
                var bindingsStartPosition = i + 3 /* BindingsStartOffset */;
                var sources = [];
                for (var j = 0; j < valuesCount; j++) {
                    sources.push(context[bindingsStartPosition + j]);
                }
                entries[prop] = { prop: prop, guardMask: guardMask, valuesCount: valuesCount, defaultValue: defaultValue, sources: sources };
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
        this._contextDebug = this.context.debug;
    }
    Object.defineProperty(NodeStylingDebug.prototype, "summary", {
        /**
         * Returns a detailed summary of each styling entry in the context and
         * what their runtime representation is.
         *
         * See `StylingSummary`.
         */
        get: function () {
            var _this = this;
            var contextEntries = this._contextDebug.entries;
            var finalValues = {};
            this._mapValues(function (prop, value, bindingIndex) {
                finalValues[prop] = { value: value, bindingIndex: bindingIndex };
            });
            var entries = {};
            var values = this.values;
            var props = Object.keys(values);
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                var contextEntry = contextEntries[prop];
                var sourceValues = contextEntry.sources.map(function (v) {
                    var value;
                    var bindingIndex;
                    if (typeof v === 'number') {
                        value = _this._data[v];
                        bindingIndex = v;
                    }
                    else {
                        value = v;
                        bindingIndex = null;
                    }
                    return { bindingIndex: bindingIndex, value: value };
                });
                var finalValue = finalValues[prop];
                var bindingIndex = finalValue.bindingIndex;
                bindingIndex = bindingIndex === DEFAULT_BINDING_INDEX_VALUE ? null : bindingIndex;
                entries[prop] = { prop: prop, value: finalValue.value, bindingIndex: bindingIndex, sourceValues: sourceValues };
            }
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
        var mapFn = function (renderer, element, prop, value, bindingIndex) {
            fn(prop, value, bindingIndex);
        };
        applyStyling(this.context, null, mockElement, this._data, BIT_MASK_APPLY_ALL, mapFn);
    };
    return NodeStylingDebug;
}());
export { NodeStylingDebug };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFdEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDJCQUEyQixFQUFFLFlBQVksRUFBQyxNQUFNLFlBQVksQ0FBQztBQUV6RixPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQXNFL0Y7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBd0I7SUFDL0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRCxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSDtJQUNFLDhCQUE0QixPQUF3QjtRQUF4QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtJQUFHLENBQUM7SUFFeEQsc0JBQUksMENBQVE7YUFBWixjQUFpQixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQU94RCxzQkFBSSx5Q0FBTztRQUxYOzs7O1dBSUc7YUFDSDtZQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDN0IsSUFBTSxPQUFPLEdBQTJDLEVBQUUsQ0FBQztZQUMzRCxJQUFNLEtBQUssOEJBQTJDLENBQUM7WUFDdkQsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ2QsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFD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SUFDSCx1QkFBQztBQUFELENBQUMsQUF0RUQsSUFzRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuXG5pbXBvcnQge0JJVF9NQVNLX0FQUExZX0FMTCwgREVGQVVMVF9CSU5ESU5HX0lOREVYX1ZBTFVFLCBhcHBseVN0eWxpbmd9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtTdHlsaW5nQmluZGluZ0RhdGEsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2dldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRWYWx1ZXNDb3VudCwgaXNDb250ZXh0TG9ja2VkfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYSBzdHlsaW5nIGVudHJ5LlxuICpcbiAqIEEgdmFsdWUgc3VjaCBhcyB0aGlzIGlzIGdlbmVyYXRlZCBhcyBhbiBhcnRpZmFjdCBvZiB0aGUgYERlYnVnU3R5bGluZ2BcbiAqIHN1bW1hcnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ1N1bW1hcnkge1xuICAvKiogVGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IHRoYXQgdGhlIHN1bW1hcnkgaXMgYXR0YWNoZWQgdG8gKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgbGFzdCBhcHBsaWVkIHZhbHVlIGZvciB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgdmFsdWU6IHN0cmluZ3xudWxsO1xuXG4gIC8qKiBUaGUgYmluZGluZyBpbmRleCBvZiB0aGUgbGFzdCBhcHBsaWVkIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgLyoqIEV2ZXJ5IGJpbmRpbmcgc291cmNlIHRoYXQgaXMgd3JpdGluZyB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgcmVwcmVzZW50ZWQgaW4gdGhpcyB0dXBsZSAqL1xuICBzb3VyY2VWYWx1ZXM6IHt2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbH1bXTtcbn1cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZyB7XG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBBIHN1bW1hcml6YXRpb24gb2YgZWFjaCBzdHlsZS9jbGFzcyBwcm9wZXJ0eVxuICAgKiBwcmVzZW50IGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgc3VtbWFyeToge1trZXk6IHN0cmluZ106IFN0eWxpbmdTdW1tYXJ5fXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGtleS92YWx1ZSBtYXAgb2YgYWxsIHN0eWxpbmcgcHJvcGVydGllcyBhbmQgdGhlaXJcbiAgICogcnVudGltZSB2YWx1ZXMuXG4gICAqL1xuICB2YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgYm9vbGVhbn07XG59XG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyB3aXRoaW4gYSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUU3R5bGluZ1R1cGxlU3VtbWFyeSB7XG4gIC8qKiBUaGUgcHJvcGVydHkgKHN0eWxlIG9yIGNsYXNzIHByb3BlcnR5KSB0aGF0IHRoaXMgdHVwbGUgcmVwcmVzZW50cyAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBlbnRyaWVzIGFwYXJ0IG9mIHRoaXMgdHVwbGUgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW5kIHN0eWxpbmcgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICBndWFyZE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeS5cbiAgICovXG4gIGRlZmF1bHRWYWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKipcbiAgICogQWxsIGJpbmRpbmdJbmRleCBzb3VyY2VzIHRoYXQgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgZm9yIHRoaXMgc3R5bGUuXG4gICAqL1xuICBzb3VyY2VzOiAobnVtYmVyfG51bGx8c3RyaW5nKVtdO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge31cblxuICBnZXQgaXNMb2NrZWQoKSB7IHJldHVybiBpc0NvbnRleHRMb2NrZWQodGhpcy5jb250ZXh0KTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFNlZSBgVFN0eWxpbmdUdXBsZVN1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBUU3R5bGluZ1R1cGxlU3VtbWFyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBUU3R5bGluZ1R1cGxlU3VtbWFyeX0gPSB7fTtcbiAgICBjb25zdCBzdGFydCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG5cbiAgICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRQb3NpdGlvbiA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZXNDb3VudDsgaisrKSB7XG4gICAgICAgIHNvdXJjZXMucHVzaChjb250ZXh0W2JpbmRpbmdzU3RhcnRQb3NpdGlvbiArIGpdIGFzIG51bWJlciB8IHN0cmluZyB8IG51bGwpO1xuICAgICAgfVxuXG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIGd1YXJkTWFzaywgdmFsdWVzQ291bnQsIGRlZmF1bHRWYWx1ZSwgc291cmNlc307XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmcge1xuICBwcml2YXRlIF9jb250ZXh0RGVidWc6IFRTdHlsaW5nQ29udGV4dERlYnVnO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2RhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSkge1xuICAgIHRoaXMuX2NvbnRleHREZWJ1ZyA9ICh0aGlzLmNvbnRleHQgYXMgYW55KS5kZWJ1ZyBhcyBhbnk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0IGFuZFxuICAgKiB3aGF0IHRoZWlyIHJ1bnRpbWUgcmVwcmVzZW50YXRpb24gaXMuXG4gICAqXG4gICAqIFNlZSBgU3R5bGluZ1N1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IHN1bW1hcnkoKToge1trZXk6IHN0cmluZ106IFN0eWxpbmdTdW1tYXJ5fSB7XG4gICAgY29uc3QgY29udGV4dEVudHJpZXMgPSB0aGlzLl9jb250ZXh0RGVidWcuZW50cmllcztcbiAgICBjb25zdCBmaW5hbFZhbHVlczoge1trZXk6IHN0cmluZ106IHt2YWx1ZTogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcn19ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICBmaW5hbFZhbHVlc1twcm9wXSA9IHt2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBTdHlsaW5nU3VtbWFyeX0gPSB7fTtcbiAgICBjb25zdCB2YWx1ZXMgPSB0aGlzLnZhbHVlcztcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHZhbHVlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgY29udGV4dEVudHJ5ID0gY29udGV4dEVudHJpZXNbcHJvcF07XG4gICAgICBjb25zdCBzb3VyY2VWYWx1ZXMgPSBjb250ZXh0RW50cnkuc291cmNlcy5tYXAodiA9PiB7XG4gICAgICAgIGxldCB2YWx1ZTogc3RyaW5nfG51bWJlcnxudWxsO1xuICAgICAgICBsZXQgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHZhbHVlID0gdGhpcy5fZGF0YVt2XTtcbiAgICAgICAgICBiaW5kaW5nSW5kZXggPSB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gdjtcbiAgICAgICAgICBiaW5kaW5nSW5kZXggPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7YmluZGluZ0luZGV4LCB2YWx1ZX07XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZmluYWxWYWx1ZSA9IGZpbmFsVmFsdWVzW3Byb3BdICE7XG4gICAgICBsZXQgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCA9IGZpbmFsVmFsdWUuYmluZGluZ0luZGV4O1xuICAgICAgYmluZGluZ0luZGV4ID0gYmluZGluZ0luZGV4ID09PSBERUZBVUxUX0JJTkRJTkdfSU5ERVhfVkFMVUUgPyBudWxsIDogYmluZGluZ0luZGV4O1xuXG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlOiBmaW5hbFZhbHVlLnZhbHVlLCBiaW5kaW5nSW5kZXgsIHNvdXJjZVZhbHVlc307XG4gICAgfVxuXG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGtleS92YWx1ZSBtYXAgb2YgYWxsIHRoZSBzdHlsZXMvY2xhc3NlcyB0aGF0IHdlcmUgbGFzdCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IHZhbHVlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgPT4geyBlbnRyaWVzW3Byb3BdID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWFwVmFsdWVzKGZuOiAocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlcikgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuXG4gICAgY29uc3QgbWFwRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgfTtcbiAgICBhcHBseVN0eWxpbmcodGhpcy5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgQklUX01BU0tfQVBQTFlfQUxMLCBtYXBGbik7XG4gIH1cbn1cbiJdfQ==