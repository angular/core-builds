import { getCurrentStyleSanitizer } from '../state';
import { attachDebugObject } from '../util/debug_utils';
import { applyStylingViaContext } from './bindings';
import { activateStylingMapFeature } from './map_based_bindings';
import { allowDirectStyling as _allowDirectStyling, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValuesCount, hasConfig, isContextLocked, isSanitizationRequired } from './util';
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context
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
    Object.defineProperty(TStylingContextDebug.prototype, "isTemplateLocked", {
        get: function () { return isContextLocked(this.context, true); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TStylingContextDebug.prototype, "isHostBindingsLocked", {
        get: function () { return isContextLocked(this.context, false); },
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
            var totalColumns = getValuesCount(context);
            var entries = {};
            var start = getPropValuesStartPosition(context);
            var i = start;
            while (i < context.length) {
                var prop = getProp(context, i);
                var templateBitMask = getGuardMask(context, i, false);
                var hostBindingsBitMask = getGuardMask(context, i, true);
                var defaultValue = getDefaultValue(context, i);
                var sanitizationRequired = isSanitizationRequired(context, i);
                var bindingsStartPosition = i + 4 /* BindingsStartOffset */;
                var sources = [];
                for (var j = 0; j < totalColumns; j++) {
                    var bindingIndex = context[bindingsStartPosition + j];
                    if (bindingIndex !== 0) {
                        sources.push(bindingIndex);
                    }
                }
                entries[prop] = {
                    prop: prop,
                    templateBitMask: templateBitMask,
                    hostBindingsBitMask: hostBindingsBitMask,
                    sanitizationRequired: sanitizationRequired,
                    valuesCount: sources.length, defaultValue: defaultValue, sources: sources,
                };
                i += 4 /* BindingsStartOffset */ + totalColumns;
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
    Object.defineProperty(NodeStylingDebug.prototype, "config", {
        get: function () {
            var hasMapBindings = hasConfig(this.context, 2 /* HasMapBindings */);
            var hasPropBindings = hasConfig(this.context, 1 /* HasPropBindings */);
            var hasCollisions = hasConfig(this.context, 4 /* HasCollisions */);
            var hasTemplateBindings = hasConfig(this.context, 16 /* HasTemplateBindings */);
            var hasHostBindings = hasConfig(this.context, 32 /* HasHostBindings */);
            var templateBindingsLocked = hasConfig(this.context, 64 /* TemplateBindingsLocked */);
            var hostBindingsLocked = hasConfig(this.context, 128 /* HostBindingsLocked */);
            var allowDirectStyling = _allowDirectStyling(this.context, false) || _allowDirectStyling(this.context, true);
            return {
                hasMapBindings: hasMapBindings,
                hasPropBindings: hasPropBindings,
                hasCollisions: hasCollisions,
                hasTemplateBindings: hasTemplateBindings,
                hasHostBindings: hasHostBindings,
                templateBindingsLocked: templateBindingsLocked,
                hostBindingsLocked: hostBindingsLocked,
                allowDirectStyling: allowDirectStyling,
            };
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
        var hasMaps = hasConfig(this.context, 2 /* HasMapBindings */);
        if (hasMaps) {
            activateStylingMapFeature();
        }
        var mapFn = function (renderer, element, prop, value, bindingIndex) { return fn(prop, value, bindingIndex || null); };
        var sanitizer = this._isClassBased ? null : (this._sanitizer || getCurrentStyleSanitizer());
        // run the template bindings
        applyStylingViaContext(this.context, null, mockElement, this._data, true, mapFn, sanitizer, false);
        // and also the host bindings
        applyStylingViaContext(this.context, null, mockElement, this._data, true, mapFn, sanitizer, true);
    };
    return NodeStylingDebug;
}());
export { NodeStylingDebug };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXRELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVsRCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMvRCxPQUFPLEVBQUMsa0JBQWtCLElBQUksbUJBQW1CLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQWMsc0JBQXNCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUEyR3JOOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQXdCO0lBQy9ELElBQU0sS0FBSyxHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEQsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0g7SUFDRSw4QkFBNEIsT0FBd0I7UUFBeEIsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7SUFBRyxDQUFDO0lBRXhELHNCQUFJLGtEQUFnQjthQUFwQixjQUF5QixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDdEUsc0JBQUksc0RBQW9CO2FBQXhCLGNBQTZCLE9BQU8sZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFP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bUIsRUFBd0U7UUFDekYsMkRBQTJEO1FBQzNELDhEQUE4RDtRQUM5RCwrREFBK0Q7UUFDL0QsSUFBTSxXQUFXLEdBQUcsRUFBUyxDQUFDO1FBQzlCLElBQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyx5QkFBZ0MsQ0FBQztRQUN2RSxJQUFJLE9BQU8sRUFBRTtZQUNYLHlCQUF5QixFQUFFLENBQUM7U0FDN0I7UUFFRCxJQUFNLEtBQUssR0FDUCxVQUFDLFFBQWEsRUFBRSxPQUFpQixFQUFFLElBQVksRUFBRSxLQUFvQixFQUNwRSxZQUE0QixJQUFLLE9BQUEsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxFQUFyQyxDQUFxQyxDQUFDO1FBRTVFLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLHdCQUF3QixFQUFFLENBQUMsQ0FBQztRQUU5Riw0QkFBNEI7UUFDNUIsc0JBQXNCLENBQ2xCLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWhGLDZCQUE2QjtRQUM3QixzQkFBc0IsQ0FDbEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUNILHVCQUFDO0FBQUQsQ0FBQyxBQWxGRCxJQWtGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ1ZpYUNvbnRleHR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuaW1wb3J0IHthbGxvd0RpcmVjdFN0eWxpbmcgYXMgX2FsbG93RGlyZWN0U3R5bGluZywgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRWYWx1ZXNDb3VudCwgaGFzQ29uZmlnLCBpc0NvbnRleHRMb2NrZWQsIGlzTWFwQmFzZWQsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWR9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExTdHlsaW5nU3VtbWFyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nIHtcbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqIFdoaWNoIGNvbmZpZ3VyYXRpb24gZmxhZ3MgYXJlIGFjdGl2ZSAoc2VlIGBUU3R5bGluZ0NvbnRleHRDb25maWdgKSAqL1xuICBjb25maWc6IHtcbiAgICBoYXNNYXBCaW5kaW5nczogYm9vbGVhbjsgICAgICAgICAgLy9cbiAgICBoYXNQcm9wQmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgLy9cbiAgICBoYXNDb2xsaXNpb25zOiBib29sZWFuOyAgICAgICAgICAgLy9cbiAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzOiBib29sZWFuOyAgICAgLy9cbiAgICBoYXNIb3N0QmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgLy9cbiAgICB0ZW1wbGF0ZUJpbmRpbmdzTG9ja2VkOiBib29sZWFuOyAgLy9cbiAgICBob3N0QmluZGluZ3NMb2NrZWQ6IGJvb2xlYW47ICAgICAgLy9cbiAgICBhbGxvd0RpcmVjdFN0eWxpbmc6IGJvb2xlYW47ICAgICAgLy9cbiAgfTtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dFxuICAgKi9cbiAgc3VtbWFyeToge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX07XG5cbiAgLyoqXG4gICAqIEEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgc3R5bGluZyBwcm9wZXJ0aWVzIGFuZCB0aGVpclxuICAgKiBydW50aW1lIHZhbHVlc1xuICAgKi9cbiAgdmFsdWVzOiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKTogdm9pZDtcbn1cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIHdpdGhpbiBhIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nVHVwbGVTdW1tYXJ5IHtcbiAgLyoqIFRoZSBwcm9wZXJ0eSAoc3R5bGUgb3IgY2xhc3MgcHJvcGVydHkpIHRoYXQgdGhpcyB0dXBsZSByZXByZXNlbnRzICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIGVudHJpZXMgYSBwYXJ0IG9mIHRoaXMgdHVwbGUgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IHRlbXBsYXRlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgdGVtcGxhdGVCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSBob3N0IHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgaG9zdEJpbmRpbmdzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgcmVxdWlyZXMgc2FuaXRpemF0aW9uXG4gICAqL1xuICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeVxuICAgKi9cbiAgZGVmYXVsdFZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGwgYmluZGluZ0luZGV4IHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBzdHlsZVxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge31cblxuICBnZXQgaXNUZW1wbGF0ZUxvY2tlZCgpIHsgcmV0dXJuIGlzQ29udGV4dExvY2tlZCh0aGlzLmNvbnRleHQsIHRydWUpOyB9XG4gIGdldCBpc0hvc3RCaW5kaW5nc0xvY2tlZCgpIHsgcmV0dXJuIGlzQ29udGV4dExvY2tlZCh0aGlzLmNvbnRleHQsIGZhbHNlKTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFNlZSBgVFN0eWxpbmdUdXBsZVN1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBUU3R5bGluZ1R1cGxlU3VtbWFyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBUU3R5bGluZ1R1cGxlU3VtbWFyeX0gPSB7fTtcbiAgICBjb25zdCBzdGFydCA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZUJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRQb3NpdGlvbiA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuXG4gICAgICBjb25zdCBzb3VyY2VzOiAobnVtYmVyIHwgc3RyaW5nIHwgbnVsbClbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbYmluZGluZ3NTdGFydFBvc2l0aW9uICsgal0gYXMgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgaWYgKGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIHNvdXJjZXMucHVzaChiaW5kaW5nSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVudHJpZXNbcHJvcF0gPSB7XG4gICAgICAgIHByb3AsXG4gICAgICAgIHRlbXBsYXRlQml0TWFzayxcbiAgICAgICAgaG9zdEJpbmRpbmdzQml0TWFzayxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQsXG4gICAgICAgIHZhbHVlc0NvdW50OiBzb3VyY2VzLmxlbmd0aCwgZGVmYXVsdFZhbHVlLCBzb3VyY2VzLFxuICAgICAgfTtcblxuICAgICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmcge1xuICBwcml2YXRlIF9zYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2RhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIHByaXZhdGUgX2lzQ2xhc3NCYXNlZD86IGJvb2xlYW4pIHt9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXMuXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKSB7IHRoaXMuX3Nhbml0aXplciA9IHNhbml0aXplcjsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQgYW5kXG4gICAqIHdoYXQgdGhlaXIgcnVudGltZSByZXByZXNlbnRhdGlvbiBpcy5cbiAgICpcbiAgICogU2VlIGBMU3R5bGluZ1N1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IHN1bW1hcnkoKToge1trZXk6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBMU3R5bGluZ1N1bW1hcnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIGdldCBjb25maWcoKSB7XG4gICAgY29uc3QgaGFzTWFwQmluZGluZ3MgPSBoYXNDb25maWcodGhpcy5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gICAgY29uc3QgaGFzUHJvcEJpbmRpbmdzID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzUHJvcEJpbmRpbmdzKTtcbiAgICBjb25zdCBoYXNDb2xsaXNpb25zID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucyk7XG4gICAgY29uc3QgaGFzVGVtcGxhdGVCaW5kaW5ncyA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICAgIGNvbnN0IGhhc0hvc3RCaW5kaW5ncyA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0hvc3RCaW5kaW5ncyk7XG4gICAgY29uc3QgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLlRlbXBsYXRlQmluZGluZ3NMb2NrZWQpO1xuICAgIGNvbnN0IGhvc3RCaW5kaW5nc0xvY2tlZCA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhvc3RCaW5kaW5nc0xvY2tlZCk7XG4gICAgY29uc3QgYWxsb3dEaXJlY3RTdHlsaW5nID1cbiAgICAgICAgX2FsbG93RGlyZWN0U3R5bGluZyh0aGlzLmNvbnRleHQsIGZhbHNlKSB8fCBfYWxsb3dEaXJlY3RTdHlsaW5nKHRoaXMuY29udGV4dCwgdHJ1ZSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgICAgLy9cbiAgICAgICAgaGFzUHJvcEJpbmRpbmdzLCAgICAgICAgIC8vXG4gICAgICAgIGhhc0NvbGxpc2lvbnMsICAgICAgICAgICAvL1xuICAgICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgICAgLy9cbiAgICAgICAgaGFzSG9zdEJpbmRpbmdzLCAgICAgICAgIC8vXG4gICAgICAgIHRlbXBsYXRlQmluZGluZ3NMb2NrZWQsICAvL1xuICAgICAgICBob3N0QmluZGluZ3NMb2NrZWQsICAgICAgLy9cbiAgICAgICAgYWxsb3dEaXJlY3RTdHlsaW5nLCAgICAgIC8vXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgdGhlIHN0eWxlcy9jbGFzc2VzIHRoYXQgd2VyZSBsYXN0IGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAqL1xuICBnZXQgdmFsdWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIHRoaXMuX21hcFZhbHVlcygocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7IGVudHJpZXNbcHJvcF0gPSB2YWx1ZTsgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICBwcml2YXRlIF9tYXBWYWx1ZXMoZm46IChwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCkgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuICAgIGNvbnN0IGhhc01hcHMgPSBoYXNDb25maWcodGhpcy5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICBiaW5kaW5nSW5kZXg/OiBudW1iZXIgfCBudWxsKSA9PiBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpO1xuXG4gICAgLy8gcnVuIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIHRoaXMuX2RhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIGZhbHNlKTtcblxuICAgIC8vIGFuZCBhbHNvIHRoZSBob3N0IGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgdHJ1ZSk7XG4gIH1cbn1cbiJdfQ==