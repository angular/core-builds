import { getCurrentStyleSanitizer } from '../state';
import { attachDebugObject } from '../util/debug_utils';
import { MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, allowDirectStyling as _allowDirectStyling, getBindingValue, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValuesCount, hasConfig, isSanitizationRequired, isStylingContext } from '../util/styling_utils';
import { applyStylingViaContext } from './bindings';
import { activateStylingMapFeature } from './map_based_bindings';
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context
 */
export function attachStylingDebugObject(context, isClassBased) {
    var debug = new TStylingContextDebug(context, isClassBased);
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
    function TStylingContextDebug(context, _isClassBased) {
        this.context = context;
        this._isClassBased = _isClassBased;
    }
    Object.defineProperty(TStylingContextDebug.prototype, "config", {
        get: function () { return buildConfig(this.context); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TStylingContextDebug.prototype, "entries", {
        /**
         * Returns a detailed summary of each styling entry in the context.
         *
         * See `DebugStylingContextEntry`.
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
    /**
     * Prints a detailed summary of each styling source grouped together with each binding index in
     * the context.
     */
    TStylingContextDebug.prototype.printSources = function () {
        var output = '\n';
        var context = this.context;
        var prefix = this._isClassBased ? 'class' : 'style';
        var bindingsBySource = [];
        var totalColumns = getValuesCount(context);
        var itemsPerRow = 4 /* BindingsStartOffset */ + totalColumns;
        for (var i = 0; i < totalColumns; i++) {
            var isDefaultColumn = i === totalColumns - 1;
            var hostBindingsMode = i !== TEMPLATE_DIRECTIVE_INDEX;
            var type = getTypeFromColumn(i, totalColumns);
            var entries = [];
            var j = 3 /* ValuesStartPosition */;
            while (j < context.length) {
                var value = getBindingValue(context, j, i);
                if (isDefaultColumn || value > 0) {
                    var bitMask = getGuardMask(context, j, hostBindingsMode);
                    var bindingIndex = isDefaultColumn ? -1 : value;
                    var prop = getProp(context, j);
                    var isMapBased = prop === MAP_BASED_ENTRY_PROP_NAME;
                    var binding = "" + prefix + (isMapBased ? '' : '.' + prop);
                    entries.push({ binding: binding, value: value, bindingIndex: bindingIndex, bitMask: bitMask });
                }
                j += itemsPerRow;
            }
            bindingsBySource.push({ type: type, entries: entries.sort(function (a, b) { return a.bindingIndex - b.bindingIndex; }) });
        }
        bindingsBySource.forEach(function (entry) {
            output += "[" + entry.type.toUpperCase() + "]\n";
            output += repeat('-', entry.type.length + 2) + '\n';
            var tab = '  ';
            entry.entries.forEach(function (entry) {
                var isDefault = typeof entry.value !== 'number';
                var value = entry.value;
                if (!isDefault || value !== null) {
                    output += tab + "[" + entry.binding + "] = `" + value + "`";
                    output += '\n';
                }
            });
            output += '\n';
        });
        /* tslint:disable */
        console.log(output);
    };
    /**
     * Prints a detailed table of the entire styling context.
     */
    TStylingContextDebug.prototype.printTable = function () {
        // IE (not Edge) is the only browser that doesn't support this feature. Because
        // these debugging tools are not apart of the core of Angular (they are just
        // extra tools) we can skip-out on older browsers.
        if (!console.table) {
            throw new Error('This feature is not supported in your browser');
        }
        var context = this.context;
        var table = [];
        var totalColumns = getValuesCount(context);
        var itemsPerRow = 4 /* BindingsStartOffset */ + totalColumns;
        var totalProps = Math.floor(context.length / itemsPerRow);
        var i = 3 /* ValuesStartPosition */;
        while (i < context.length) {
            var prop = getProp(context, i);
            var isMapBased = prop === MAP_BASED_ENTRY_PROP_NAME;
            var entry = {
                prop: prop,
                'tpl mask': generateBitString(getGuardMask(context, i, false), isMapBased, totalProps),
                'host mask': generateBitString(getGuardMask(context, i, true), isMapBased, totalProps),
            };
            for (var j = 0; j < totalColumns; j++) {
                var key = getTypeFromColumn(j, totalColumns);
                var value = getBindingValue(context, i, j);
                entry[key] = value;
            }
            i += itemsPerRow;
            table.push(entry);
        }
        /* tslint:disable */
        console.table(table);
    };
    return TStylingContextDebug;
}());
function generateBitString(value, isMapBased, totalProps) {
    if (isMapBased || value > 1) {
        return "0b" + leftPad(value.toString(2), totalProps, '0');
    }
    return null;
}
function leftPad(value, max, pad) {
    return repeat(pad, max - value.length) + value;
}
function getTypeFromColumn(index, totalColumns) {
    if (index === TEMPLATE_DIRECTIVE_INDEX) {
        return 'template';
    }
    else if (index === totalColumns - 1) {
        return 'defaults';
    }
    else {
        return "dir #" + index;
    }
}
function repeat(c, times) {
    var s = '';
    for (var i = 0; i < times; i++) {
        s += c;
    }
    return s;
}
/**
 * A human-readable debug summary of the styling data present for a `DebugNode` instance.
 *
 * This class is designed to be used within testing code or when an
 * application has `ngDevMode` activated.
 */
var NodeStylingDebug = /** @class */ (function () {
    function NodeStylingDebug(context, _data, _isClassBased) {
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
        this._debugContext = isStylingContext(context) ?
            new TStylingContextDebug(context, _isClassBased) :
            context;
    }
    Object.defineProperty(NodeStylingDebug.prototype, "context", {
        get: function () { return this._debugContext; },
        enumerable: true,
        configurable: true
    });
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
        get: function () { return buildConfig(this.context.context); },
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
        var hasMaps = hasConfig(this.context.context, 4 /* HasMapBindings */);
        if (hasMaps) {
            activateStylingMapFeature();
        }
        var mapFn = function (renderer, element, prop, value, bindingIndex) { return fn(prop, value, bindingIndex || null); };
        var sanitizer = this._isClassBased ? null : (this._sanitizer || getCurrentStyleSanitizer());
        // run the template bindings
        applyStylingViaContext(this.context.context, null, mockElement, this._data, true, mapFn, sanitizer, false);
        // and also the host bindings
        applyStylingViaContext(this.context.context, null, mockElement, this._data, true, mapFn, sanitizer, true);
    };
    return NodeStylingDebug;
}());
export { NodeStylingDebug };
function buildConfig(context) {
    var hasMapBindings = hasConfig(context, 4 /* HasMapBindings */);
    var hasPropBindings = hasConfig(context, 2 /* HasPropBindings */);
    var hasCollisions = hasConfig(context, 8 /* HasCollisions */);
    var hasTemplateBindings = hasConfig(context, 32 /* HasTemplateBindings */);
    var hasHostBindings = hasConfig(context, 64 /* HasHostBindings */);
    var templateBindingsLocked = hasConfig(context, 128 /* TemplateBindingsLocked */);
    var hostBindingsLocked = hasConfig(context, 256 /* HostBindingsLocked */);
    var allowDirectStyling = _allowDirectStyling(context, false) || _allowDirectStyling(context, true);
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVBLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUUsa0JBQWtCLElBQUksbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQW1CLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFaFQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBdUkvRDs7R0FFRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxPQUF3QixFQUFFLFlBQXFCO0lBQ3RGLElBQU0sS0FBSyxHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzlELGlCQUFpQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNIO0lBQ0UsOEJBQTRCLE9BQXdCLEVBQVUsYUFBc0I7UUFBeEQsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7UUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBUztJQUFHLENBQUM7SUFFeEYsc0JBQUksd0NBQU07YUFBVixjQUFtQyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENB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bkYsSUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLE9BQU8sMkJBQWlDLENBQUM7SUFDM0UsSUFBTSxzQkFBc0IsR0FBRyxTQUFTLENBQUMsT0FBTyxtQ0FBd0MsQ0FBQztJQUN6RixJQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxPQUFPLCtCQUFvQyxDQUFDO0lBQ2pGLElBQU0sa0JBQWtCLEdBQ3BCLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFOUUsT0FBTztRQUNILGNBQWMsZ0JBQUE7UUFDZCxlQUFlLGlCQUFBO1FBQ2YsYUFBYSxlQUFBO1FBQ2IsbUJBQW1CLHFCQUFBO1FBQ25CLGVBQWUsaUJBQUE7UUFDZixzQkFBc0Isd0JBQUE7UUFDdEIsa0JBQWtCLG9CQUFBO1FBQ2xCLGtCQUFrQixvQkFBQTtLQUNyQixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Z2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7TUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBhbGxvd0RpcmVjdFN0eWxpbmcgYXMgX2FsbG93RGlyZWN0U3R5bGluZywgZ2V0QmluZGluZ1ZhbHVlLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzQ29udGV4dExvY2tlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHthcHBseVN0eWxpbmdWaWFDb250ZXh0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBkZWJ1ZyBmdW5jdGlvbmFsaXR5IGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBkZWJ1Zy1mcmllbmRseSB2ZXJzaW9uIG9mIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEFuIGluc3RhbmNlIG9mIHRoaXMgaXMgYXR0YWNoZWQgdG8gYHRTdHlsaW5nQ29udGV4dC5kZWJ1Z2Agd2hlbiBgbmdEZXZNb2RlYCBpcyBhY3RpdmUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIC8qKiBUaGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBvZiB0aGUgYXNzb2NpYXRlZCBgVFN0eWxpbmdDb250ZXh0YCAqL1xuICBjb25maWc6IERlYnVnU3R5bGluZ0NvbmZpZztcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fTtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgc291cmNlcyB3aXRoaW4gdGhlIGNvbnRleHQgKi9cbiAgcHJpbnRTb3VyY2VzKCk6IHZvaWQ7XG5cbiAgLyoqIEEgc3RhdHVzIHJlcG9ydCBvZiBhbGwgdGhlIGVudGlyZSBjb250ZXh0IGFzIGEgdGFibGUgKi9cbiAgcHJpbnRUYWJsZSgpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYFRTdHlsaW5nQ29uZmlnYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb25maWcge1xuICBoYXNNYXBCaW5kaW5nczogYm9vbGVhbjsgICAgICAgICAgLy9cbiAgaGFzUHJvcEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAgIC8vXG4gIGhhc0NvbGxpc2lvbnM6IGJvb2xlYW47ICAgICAgICAgICAvL1xuICBoYXNUZW1wbGF0ZUJpbmRpbmdzOiBib29sZWFuOyAgICAgLy9cbiAgaGFzSG9zdEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAgIC8vXG4gIHRlbXBsYXRlQmluZGluZ3NMb2NrZWQ6IGJvb2xlYW47ICAvL1xuICBob3N0QmluZGluZ3NMb2NrZWQ6IGJvb2xlYW47ICAgICAgLy9cbiAgYWxsb3dEaXJlY3RTdHlsaW5nOiBib29sZWFuOyAgICAgIC8vXG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIHdpdGhpbiBhIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeSB7XG4gIC8qKiBUaGUgcHJvcGVydHkgKHN0eWxlIG9yIGNsYXNzIHByb3BlcnR5KSB0aGF0IHRoaXMgZW50cnkgcmVwcmVzZW50cyAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBlbnRyaWVzIGEgcGFydCBvZiB0aGlzIGVudHJ5ICovXG4gIHZhbHVlc0NvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSB0ZW1wbGF0ZSBzdHlsZS9jbGFzcyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIHRlbXBsYXRlQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgaG9zdCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIGhvc3RCaW5kaW5nc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGVudHJ5IHJlcXVpcmVzIHNhbml0aXphdGlvblxuICAgKi9cbiAgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGlmIGFueSBiaW5kaW5ncyBhcmUgZmFsc3lcbiAgICovXG4gIGRlZmF1bHRWYWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKipcbiAgICogQWxsIGJpbmRpbmdJbmRleCBzb3VyY2VzIHRoYXQgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgZm9yIHRoaXMgc3R5bGVcbiAgICovXG4gIHNvdXJjZXM6IChudW1iZXJ8bnVsbHxzdHJpbmcpW107XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmcge1xuICAvKiogVGhlIGFzc29jaWF0ZWQgZGVidWcgY29udGV4dCBvZiB0aGUgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IERlYnVnU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqXG4gICAqIEEgc3VtbWFyaXphdGlvbiBvZiBlYWNoIHN0eWxlL2NsYXNzIHByb3BlcnR5XG4gICAqIHByZXNlbnQgaW4gdGhlIGNvbnRleHRcbiAgICovXG4gIHN1bW1hcnk6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9O1xuXG4gIC8qKlxuICAgKiBBIGtleS92YWx1ZSBtYXAgb2YgYWxsIHN0eWxpbmcgcHJvcGVydGllcyBhbmQgdGhlaXJcbiAgICogcnVudGltZSB2YWx1ZXNcbiAgICovXG4gIHZhbHVlczoge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCBib29sZWFufTtcblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlc1xuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhIHN0eWxpbmcgZW50cnkuXG4gKlxuICogQSB2YWx1ZSBzdWNoIGFzIHRoaXMgaXMgZ2VuZXJhdGVkIGFzIGFuIGFydGlmYWN0IG9mIHRoZSBgRGVidWdTdHlsaW5nYFxuICogc3VtbWFyeS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGVTdHlsaW5nRW50cnkge1xuICAvKiogVGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IHRoYXQgdGhlIHN1bW1hcnkgaXMgYXR0YWNoZWQgdG8gKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgbGFzdCBhcHBsaWVkIHZhbHVlIGZvciB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqIFRoZSBiaW5kaW5nIGluZGV4IG9mIHRoZSBsYXN0IGFwcGxpZWQgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQsIGlzQ2xhc3NCYXNlZCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIGltcGxlbWVudHMgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2lzQ2xhc3NCYXNlZDogYm9vbGVhbikge31cblxuICBnZXQgY29uZmlnKCk6IERlYnVnU3R5bGluZ0NvbmZpZyB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLmNvbnRleHQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogU2VlIGBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fSA9IHt9O1xuICAgIGNvbnN0IHN0YXJ0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZW50cmllc1twcm9wXSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgdGVtcGxhdGVCaXRNYXNrLFxuICAgICAgICBob3N0QmluZGluZ3NCaXRNYXNrLFxuICAgICAgICBzYW5pdGl6YXRpb25SZXF1aXJlZCxcbiAgICAgICAgdmFsdWVzQ291bnQ6IHNvdXJjZXMubGVuZ3RoLCBkZWZhdWx0VmFsdWUsIHNvdXJjZXMsXG4gICAgICB9O1xuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50cyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIHNvdXJjZSBncm91cGVkIHRvZ2V0aGVyIHdpdGggZWFjaCBiaW5kaW5nIGluZGV4IGluXG4gICAqIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgcHJpbnRTb3VyY2VzKCk6IHZvaWQge1xuICAgIGxldCBvdXRwdXQgPSAnXFxuJztcblxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgcHJlZml4ID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gJ2NsYXNzJyA6ICdzdHlsZSc7XG4gICAgY29uc3QgYmluZGluZ3NCeVNvdXJjZToge1xuICAgICAgdHlwZTogc3RyaW5nLFxuICAgICAgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnksIGJpdE1hc2s6IG51bWJlcn1bXVxuICAgIH1bXSA9IFtdO1xuXG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbENvbHVtbnM7IGkrKykge1xuICAgICAgY29uc3QgaXNEZWZhdWx0Q29sdW1uID0gaSA9PT0gdG90YWxDb2x1bW5zIC0gMTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpICE9PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG4gICAgICBjb25zdCB0eXBlID0gZ2V0VHlwZUZyb21Db2x1bW4oaSwgdG90YWxDb2x1bW5zKTtcbiAgICAgIGNvbnN0IGVudHJpZXM6IHtiaW5kaW5nOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyLCBiaXRNYXNrOiBudW1iZXJ9W10gPSBbXTtcblxuICAgICAgbGV0IGogPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgICAgd2hpbGUgKGogPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBqLCBpKTtcbiAgICAgICAgaWYgKGlzRGVmYXVsdENvbHVtbiB8fCB2YWx1ZSA+IDApIHtcbiAgICAgICAgICBjb25zdCBiaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGosIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGlzRGVmYXVsdENvbHVtbiA/IC0xIDogdmFsdWUgYXMgbnVtYmVyO1xuICAgICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmcgPSBgJHtwcmVmaXh9JHtpc01hcEJhc2VkID8gJycgOiAnLicgKyBwcm9wfWA7XG4gICAgICAgICAgZW50cmllcy5wdXNoKHtiaW5kaW5nLCB2YWx1ZSwgYmluZGluZ0luZGV4LCBiaXRNYXNrfSk7XG4gICAgICAgIH1cbiAgICAgICAgaiArPSBpdGVtc1BlclJvdztcbiAgICAgIH1cblxuICAgICAgYmluZGluZ3NCeVNvdXJjZS5wdXNoKFxuICAgICAgICAgIHt0eXBlLCBlbnRyaWVzOiBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGEuYmluZGluZ0luZGV4IC0gYi5iaW5kaW5nSW5kZXgpfSk7XG4gICAgfVxuXG4gICAgYmluZGluZ3NCeVNvdXJjZS5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgIG91dHB1dCArPSBgWyR7ZW50cnkudHlwZS50b1VwcGVyQ2FzZSgpfV1cXG5gO1xuICAgICAgb3V0cHV0ICs9IHJlcGVhdCgnLScsIGVudHJ5LnR5cGUubGVuZ3RoICsgMikgKyAnXFxuJztcblxuICAgICAgbGV0IHRhYiA9ICcgICc7XG4gICAgICBlbnRyeS5lbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBjb25zdCBpc0RlZmF1bHQgPSB0eXBlb2YgZW50cnkudmFsdWUgIT09ICdudW1iZXInO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGVudHJ5LnZhbHVlO1xuICAgICAgICBpZiAoIWlzRGVmYXVsdCB8fCB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgIG91dHB1dCArPSBgJHt0YWJ9WyR7ZW50cnkuYmluZGluZ31dID0gXFxgJHt2YWx1ZX1cXGBgO1xuICAgICAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBvdXRwdXQgKz0gJ1xcbic7XG4gICAgfSk7XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUubG9nKG91dHB1dCk7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgdGFibGUgb2YgdGhlIGVudGlyZSBzdHlsaW5nIGNvbnRleHQuXG4gICAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQge1xuICAgIC8vIElFIChub3QgRWRnZSkgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGRvZXNuJ3Qgc3VwcG9ydCB0aGlzIGZlYXR1cmUuIEJlY2F1c2VcbiAgICAvLyB0aGVzZSBkZWJ1Z2dpbmcgdG9vbHMgYXJlIG5vdCBhcGFydCBvZiB0aGUgY29yZSBvZiBBbmd1bGFyICh0aGV5IGFyZSBqdXN0XG4gICAgLy8gZXh0cmEgdG9vbHMpIHdlIGNhbiBza2lwLW91dCBvbiBvbGRlciBicm93c2Vycy5cbiAgICBpZiAoIWNvbnNvbGUudGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBmZWF0dXJlIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBicm93c2VyJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB0YWJsZTogYW55W10gPSBbXTtcbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgY29uc3QgdG90YWxQcm9wcyA9IE1hdGguZmxvb3IoY29udGV4dC5sZW5ndGggLyBpdGVtc1BlclJvdyk7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBpc01hcEJhc2VkID0gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbiAgICAgIGNvbnN0IGVudHJ5OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgJ3RwbCBtYXNrJzogZ2VuZXJhdGVCaXRTdHJpbmcoZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICAgICdob3N0IG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSksIGlzTWFwQmFzZWQsIHRvdGFsUHJvcHMpLFxuICAgICAgfTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRUeXBlRnJvbUNvbHVtbihqLCB0b3RhbENvbHVtbnMpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKTtcbiAgICAgICAgZW50cnlba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgICAgdGFibGUucHVzaChlbnRyeSk7XG4gICAgfVxuXG4gICAgLyogdHNsaW50OmRpc2FibGUgKi9cbiAgICBjb25zb2xlLnRhYmxlKHRhYmxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUJpdFN0cmluZyh2YWx1ZTogbnVtYmVyLCBpc01hcEJhc2VkOiBib29sZWFuLCB0b3RhbFByb3BzOiBudW1iZXIpIHtcbiAgaWYgKGlzTWFwQmFzZWQgfHwgdmFsdWUgPiAxKSB7XG4gICAgcmV0dXJuIGAwYiR7bGVmdFBhZCh2YWx1ZS50b1N0cmluZygyKSwgdG90YWxQcm9wcywgJzAnKX1gO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsZWZ0UGFkKHZhbHVlOiBzdHJpbmcsIG1heDogbnVtYmVyLCBwYWQ6IHN0cmluZykge1xuICByZXR1cm4gcmVwZWF0KHBhZCwgbWF4IC0gdmFsdWUubGVuZ3RoKSArIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRUeXBlRnJvbUNvbHVtbihpbmRleDogbnVtYmVyLCB0b3RhbENvbHVtbnM6IG51bWJlcikge1xuICBpZiAoaW5kZXggPT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCkge1xuICAgIHJldHVybiAndGVtcGxhdGUnO1xuICB9IGVsc2UgaWYgKGluZGV4ID09PSB0b3RhbENvbHVtbnMgLSAxKSB7XG4gICAgcmV0dXJuICdkZWZhdWx0cyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGBkaXIgIyR7aW5kZXh9YDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXBlYXQoYzogc3RyaW5nLCB0aW1lczogbnVtYmVyKSB7XG4gIGxldCBzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGltZXM7IGkrKykge1xuICAgIHMgKz0gYztcbiAgfVxuICByZXR1cm4gcztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlU3R5bGluZ0RlYnVnIGltcGxlbWVudHMgRGVidWdOb2RlU3R5bGluZyB7XG4gIHByaXZhdGUgX3Nhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9kZWJ1Z0NvbnRleHQ6IERlYnVnU3R5bGluZ0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHR8RGVidWdTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgICAgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSA/XG4gICAgICAgIG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCwgX2lzQ2xhc3NCYXNlZCkgOlxuICAgICAgICAoY29udGV4dCBhcyBEZWJ1Z1N0eWxpbmdDb250ZXh0KTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0OyB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXMuXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKSB7IHRoaXMuX3Nhbml0aXplciA9IHNhbml0aXplcjsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQgYW5kXG4gICAqIHdoYXQgdGhlaXIgcnVudGltZSByZXByZXNlbnRhdGlvbiBpcy5cbiAgICpcbiAgICogU2VlIGBMU3R5bGluZ1N1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IHN1bW1hcnkoKToge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIGdldCBjb25maWcoKSB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLmNvbnRleHQuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGtleS92YWx1ZSBtYXAgb2YgYWxsIHRoZSBzdHlsZXMvY2xhc3NlcyB0aGF0IHdlcmUgbGFzdCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IHZhbHVlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgPT4geyBlbnRyaWVzW3Byb3BdID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfbWFwVmFsdWVzKGZuOiAocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcbiAgICBjb25zdCBoYXNNYXBzID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dC5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICBiaW5kaW5nSW5kZXg/OiBudW1iZXIgfCBudWxsKSA9PiBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpO1xuXG4gICAgLy8gcnVuIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgZmFsc2UpO1xuXG4gICAgLy8gYW5kIGFsc28gdGhlIGhvc3QgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIHRoaXMuX2RhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICBjb25zdCBoYXNNYXBCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1Byb3BCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpO1xuICBjb25zdCBoYXNDb2xsaXNpb25zID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpO1xuICBjb25zdCBoYXNUZW1wbGF0ZUJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICBjb25zdCBoYXNIb3N0QmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzKTtcbiAgY29uc3QgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5UZW1wbGF0ZUJpbmRpbmdzTG9ja2VkKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTG9ja2VkID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhvc3RCaW5kaW5nc0xvY2tlZCk7XG4gIGNvbnN0IGFsbG93RGlyZWN0U3R5bGluZyA9XG4gICAgICBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIGZhbHNlKSB8fCBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIHRydWUpO1xuXG4gIHJldHVybiB7XG4gICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgICAgLy9cbiAgICAgIGhhc1Byb3BCaW5kaW5ncywgICAgICAgICAvL1xuICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgICAgIC8vXG4gICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgICAgLy9cbiAgICAgIGhhc0hvc3RCaW5kaW5ncywgICAgICAgICAvL1xuICAgICAgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCwgIC8vXG4gICAgICBob3N0QmluZGluZ3NMb2NrZWQsICAgICAgLy9cbiAgICAgIGFsbG93RGlyZWN0U3R5bGluZywgICAgICAvL1xuICB9O1xufVxuIl19