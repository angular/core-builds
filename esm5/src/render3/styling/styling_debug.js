/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { createProxy } from '../../debug/proxy';
import { getCurrentStyleSanitizer } from '../state';
import { attachDebugObject } from '../util/debug_utils';
import { MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, allowDirectStyling as _allowDirectStyling, getBindingValue, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValue, getValuesCount, hasConfig, isSanitizationRequired, isStylingContext, normalizeIntoStylingMap, setValue } from '../util/styling_utils';
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
            var config = this.config;
            var isClassBased = this._isClassBased;
            var data = this._data;
            // the direct pass code doesn't convert [style] or [class] values
            // into StylingMapArray instances. For this reason, the values
            // need to be converted ahead of time since the styling debug
            // relies on context resolution to figure out what styling
            // values have been added/removed on the element.
            if (config.allowDirectStyling && config.hasMapBindings) {
                data = data.concat([]); // make a copy
                this._convertMapBindingsToStylingMapArrays(data);
            }
            this._mapValues(data, function (prop, value, bindingIndex) {
                entries[prop] = { prop: prop, value: value, bindingIndex: bindingIndex };
            });
            // because the styling algorithm runs into two different
            // modes: direct and context-resolution, the output of the entries
            // object is different because the removed values are not
            // saved between updates. For this reason a proxy is created
            // so that the behavior is the same when examining values
            // that are no longer active on the element.
            return createProxy({
                get: function (target, prop) {
                    var value = entries[prop];
                    if (!value) {
                        value = {
                            prop: prop,
                            value: isClassBased ? false : null,
                            bindingIndex: null,
                        };
                    }
                    return value;
                },
                set: function (target, prop, value) { return false; },
                ownKeys: function () { return Object.keys(entries); },
                getOwnPropertyDescriptor: function (k) {
                    // we use a special property descriptor here so that enumeration operations
                    // such as `Object.keys` will work on this proxy.
                    return {
                        enumerable: true,
                        configurable: true,
                    };
                },
            });
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
            var config = this.config;
            var data = this._data;
            // the direct pass code doesn't convert [style] or [class] values
            // into StylingMapArray instances. For this reason, the values
            // need to be converted ahead of time since the styling debug
            // relies on context resolution to figure out what styling
            // values have been added/removed on the element.
            if (config.allowDirectStyling && config.hasMapBindings) {
                data = data.concat([]); // make a copy
                this._convertMapBindingsToStylingMapArrays(data);
            }
            this._mapValues(data, function (prop, value) { entries[prop] = value; });
            return entries;
        },
        enumerable: true,
        configurable: true
    });
    NodeStylingDebug.prototype._convertMapBindingsToStylingMapArrays = function (data) {
        var context = this.context.context;
        var limit = getPropValuesStartPosition(context);
        for (var i = 3 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */; i < limit; i++) {
            var bindingIndex = context[i];
            var bindingValue = bindingIndex !== 0 ? getValue(data, bindingIndex) : null;
            if (bindingValue && !Array.isArray(bindingValue)) {
                var stylingMapArray = normalizeIntoStylingMap(null, bindingValue, !this._isClassBased);
                setValue(data, bindingIndex, stylingMapArray);
            }
        }
    };
    NodeStylingDebug.prototype._mapValues = function (data, fn) {
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
        applyStylingViaContext(this.context.context, null, mockElement, data, true, mapFn, sanitizer, false);
        // and also the host bindings
        applyStylingViaContext(this.context.context, null, mockElement, data, true, mapFn, sanitizer, true);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7RUFNRTtBQUNGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUk5QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixJQUFJLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBbUIsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFN1YsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBdUkvRDs7R0FFRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxPQUF3QixFQUFFLFlBQXFCO0lBQ3RGLElBQU0sS0FBSyxHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzlELGlCQUFpQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNIO0lBQ0UsOEJBQTRCLE9BQXdCLEVBQVUsYUFBc0I7UUFBeEQsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7UUFBVSxrQkFBYSxH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TSxjQUFjLEdBQUcsU0FBUyxDQUFDLE9BQU8seUJBQWdDLENBQUM7SUFDekUsSUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLE9BQU8sMEJBQWlDLENBQUM7SUFDM0UsSUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLE9BQU8sd0JBQStCLENBQUM7SUFDdkUsSUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUMsT0FBTywrQkFBcUMsQ0FBQztJQUNuRixJQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsT0FBTywyQkFBaUMsQ0FBQztJQUMzRSxJQUFNLHNCQUFzQixHQUFHLFNBQVMsQ0FBQyxPQUFPLG1DQUF3QyxDQUFDO0lBQ3pGLElBQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDLE9BQU8sK0JBQW9DLENBQUM7SUFDakYsSUFBTSxrQkFBa0IsR0FDcEIsbUJBQW1CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUU5RSxPQUFPO1FBQ0gsY0FBYyxnQkFBQTtRQUNkLGVBQWUsaUJBQUE7UUFDZixhQUFhLGVBQUE7UUFDYixtQkFBbUIscUJBQUE7UUFDbkIsZUFBZSxpQkFBQTtRQUNmLHNCQUFzQix3QkFBQTtRQUN0QixrQkFBa0Isb0JBQUE7UUFDbEIsa0JBQWtCLG9CQUFBO0tBQ3JCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtjcmVhdGVQcm94eX0gZnJvbSAnLi4vLi4vZGVidWcvcHJveHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuaW1wb3J0IHtNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FLCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGFsbG93RGlyZWN0U3R5bGluZyBhcyBfYWxsb3dEaXJlY3RTdHlsaW5nLCBnZXRCaW5kaW5nVmFsdWUsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzQ29udGV4dExvY2tlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nQ29udGV4dCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHNldFZhbHVlfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ1ZpYUNvbnRleHR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBBIGRlYnVnLWZyaWVuZGx5IHZlcnNpb24gb2YgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhpcyBpcyBhdHRhY2hlZCB0byBgdFN0eWxpbmdDb250ZXh0LmRlYnVnYCB3aGVuIGBuZ0Rldk1vZGVgIGlzIGFjdGl2ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgLyoqIFRoZSBjb25maWd1cmF0aW9uIHNldHRpbmdzIG9mIHRoZSBhc3NvY2lhdGVkIGBUU3R5bGluZ0NvbnRleHRgICovXG4gIGNvbmZpZzogRGVidWdTdHlsaW5nQ29uZmlnO1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0O1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9O1xuXG4gIC8qKiBBIHN0YXR1cyByZXBvcnQgb2YgYWxsIHRoZSBzb3VyY2VzIHdpdGhpbiB0aGUgY29udGV4dCAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZDtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgZW50aXJlIGNvbnRleHQgYXMgYSB0YWJsZSAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBgVFN0eWxpbmdDb25maWdgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbmZpZyB7XG4gIGhhc01hcEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAgICAvL1xuICBoYXNQcm9wQmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgLy9cbiAgaGFzQ29sbGlzaW9uczogYm9vbGVhbjsgICAgICAgICAgIC8vXG4gIGhhc1RlbXBsYXRlQmluZGluZ3M6IGJvb2xlYW47ICAgICAvL1xuICBoYXNIb3N0QmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgLy9cbiAgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZDogYm9vbGVhbjsgIC8vXG4gIGhvc3RCaW5kaW5nc0xvY2tlZDogYm9vbGVhbjsgICAgICAvL1xuICBhbGxvd0RpcmVjdFN0eWxpbmc6IGJvb2xlYW47ICAgICAgLy9cbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5IHtcbiAgLyoqIFRoZSBwcm9wZXJ0eSAoc3R5bGUgb3IgY2xhc3MgcHJvcGVydHkpIHRoYXQgdGhpcyBlbnRyeSByZXByZXNlbnRzICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIGVudHJpZXMgYSBwYXJ0IG9mIHRoaXMgZW50cnkgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IHRlbXBsYXRlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgdGVtcGxhdGVCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSBob3N0IHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgaG9zdEJpbmRpbmdzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgcmVxdWlyZXMgc2FuaXRpemF0aW9uXG4gICAqL1xuICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeVxuICAgKi9cbiAgZGVmYXVsdFZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGwgYmluZGluZ0luZGV4IHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBzdHlsZVxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZyB7XG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBkZWJ1ZyBjb250ZXh0IG9mIHRoZSBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dFxuICAgKi9cbiAgc3VtbWFyeToge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX07XG5cbiAgLyoqXG4gICAqIEEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgc3R5bGluZyBwcm9wZXJ0aWVzIGFuZCB0aGVpclxuICAgKiBydW50aW1lIHZhbHVlc1xuICAgKi9cbiAgdmFsdWVzOiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKTogdm9pZDtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmdFbnRyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGFuZCBhdHRhY2hlcyBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0RGVidWdgIHRvIHRoZSBwcm92aWRlZCBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCwgaXNDbGFzc0Jhc2VkKTtcbiAgYXR0YWNoRGVidWdPYmplY3QoY29udGV4dCwgZGVidWcpO1xuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCB3aXRoaW4gYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuY2xhc3MgVFN0eWxpbmdDb250ZXh0RGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7fVxuXG4gIGdldCBjb25maWcoKTogRGVidWdTdHlsaW5nQ29uZmlnIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeWAuXG4gICAqL1xuICBnZXQgZW50cmllcygpOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgICBsZXQgaSA9IHN0YXJ0O1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgdGVtcGxhdGVCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc0JpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcblxuICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2JpbmRpbmdzU3RhcnRQb3NpdGlvbiArIGpdIGFzIG51bWJlciB8IHN0cmluZyB8IG51bGw7XG4gICAgICAgIGlmIChiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBzb3VyY2VzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlbnRyaWVzW3Byb3BdID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICB0ZW1wbGF0ZUJpdE1hc2ssXG4gICAgICAgIGhvc3RCaW5kaW5nc0JpdE1hc2ssXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkLFxuICAgICAgICB2YWx1ZXNDb3VudDogc291cmNlcy5sZW5ndGgsIGRlZmF1bHRWYWx1ZSwgc291cmNlcyxcbiAgICAgIH07XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgc291cmNlIGdyb3VwZWQgdG9nZXRoZXIgd2l0aCBlYWNoIGJpbmRpbmcgaW5kZXggaW5cbiAgICogdGhlIGNvbnRleHQuXG4gICAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZCB7XG4gICAgbGV0IG91dHB1dCA9ICdcXG4nO1xuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyAnY2xhc3MnIDogJ3N0eWxlJztcbiAgICBjb25zdCBiaW5kaW5nc0J5U291cmNlOiB7XG4gICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICBlbnRyaWVzOiB7YmluZGluZzogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSwgYml0TWFzazogbnVtYmVyfVtdXG4gICAgfVtdID0gW107XG5cbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQ29sdW1uczsgaSsrKSB7XG4gICAgICBjb25zdCBpc0RlZmF1bHRDb2x1bW4gPSBpID09PSB0b3RhbENvbHVtbnMgLSAxO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGkgIT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbiAgICAgIGNvbnN0IHR5cGUgPSBnZXRUeXBlRnJvbUNvbHVtbihpLCB0b3RhbENvbHVtbnMpO1xuICAgICAgY29uc3QgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIsIGJpdE1hc2s6IG51bWJlcn1bXSA9IFtdO1xuXG4gICAgICBsZXQgaiA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgICB3aGlsZSAoaiA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGosIGkpO1xuICAgICAgICBpZiAoaXNEZWZhdWx0Q29sdW1uIHx8IHZhbHVlID4gMCkge1xuICAgICAgICAgIGNvbnN0IGJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaiwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gaXNEZWZhdWx0Q29sdW1uID8gLTEgOiB2YWx1ZSBhcyBudW1iZXI7XG4gICAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgaXNNYXBCYXNlZCA9IHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG4gICAgICAgICAgY29uc3QgYmluZGluZyA9IGAke3ByZWZpeH0ke2lzTWFwQmFzZWQgPyAnJyA6ICcuJyArIHByb3B9YDtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goe2JpbmRpbmcsIHZhbHVlLCBiaW5kaW5nSW5kZXgsIGJpdE1hc2t9KTtcbiAgICAgICAgfVxuICAgICAgICBqICs9IGl0ZW1zUGVyUm93O1xuICAgICAgfVxuXG4gICAgICBiaW5kaW5nc0J5U291cmNlLnB1c2goXG4gICAgICAgICAge3R5cGUsIGVudHJpZXM6IGVudHJpZXMuc29ydCgoYSwgYikgPT4gYS5iaW5kaW5nSW5kZXggLSBiLmJpbmRpbmdJbmRleCl9KTtcbiAgICB9XG5cbiAgICBiaW5kaW5nc0J5U291cmNlLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgb3V0cHV0ICs9IGBbJHtlbnRyeS50eXBlLnRvVXBwZXJDYXNlKCl9XVxcbmA7XG4gICAgICBvdXRwdXQgKz0gcmVwZWF0KCctJywgZW50cnkudHlwZS5sZW5ndGggKyAyKSArICdcXG4nO1xuXG4gICAgICBsZXQgdGFiID0gJyAgJztcbiAgICAgIGVudHJ5LmVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIGNvbnN0IGlzRGVmYXVsdCA9IHR5cGVvZiBlbnRyeS52YWx1ZSAhPT0gJ251bWJlcic7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZW50cnkudmFsdWU7XG4gICAgICAgIGlmICghaXNEZWZhdWx0IHx8IHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgb3V0cHV0ICs9IGAke3RhYn1bJHtlbnRyeS5iaW5kaW5nfV0gPSBcXGAke3ZhbHVlfVxcYGA7XG4gICAgICAgICAgb3V0cHV0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICB9KTtcblxuICAgIC8qIHRzbGludDpkaXNhYmxlICovXG4gICAgY29uc29sZS5sb2cob3V0cHV0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmludHMgYSBkZXRhaWxlZCB0YWJsZSBvZiB0aGUgZW50aXJlIHN0eWxpbmcgY29udGV4dC5cbiAgICovXG4gIHByaW50VGFibGUoKTogdm9pZCB7XG4gICAgLy8gSUUgKG5vdCBFZGdlKSBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgZG9lc24ndCBzdXBwb3J0IHRoaXMgZmVhdHVyZS4gQmVjYXVzZVxuICAgIC8vIHRoZXNlIGRlYnVnZ2luZyB0b29scyBhcmUgbm90IGFwYXJ0IG9mIHRoZSBjb3JlIG9mIEFuZ3VsYXIgKHRoZXkgYXJlIGp1c3RcbiAgICAvLyBleHRyYSB0b29scykgd2UgY2FuIHNraXAtb3V0IG9uIG9sZGVyIGJyb3dzZXJzLlxuICAgIGlmICghY29uc29sZS50YWJsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGZlYXR1cmUgaXMgbm90IHN1cHBvcnRlZCBpbiB5b3VyIGJyb3dzZXInKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRhYmxlOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICBjb25zdCB0b3RhbFByb3BzID0gTWF0aC5mbG9vcihjb250ZXh0Lmxlbmd0aCAvIGl0ZW1zUGVyUm93KTtcblxuICAgIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgY29uc3QgZW50cnk6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICAndHBsIG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpLCBpc01hcEJhc2VkLCB0b3RhbFByb3BzKSxcbiAgICAgICAgJ2hvc3QgbWFzayc6IGdlbmVyYXRlQml0U3RyaW5nKGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldFR5cGVGcm9tQ29sdW1uKGosIHRvdGFsQ29sdW1ucyk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopO1xuICAgICAgICBlbnRyeVtrZXldID0gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGkgKz0gaXRlbXNQZXJSb3c7XG4gICAgICB0YWJsZS5wdXNoKGVudHJ5KTtcbiAgICB9XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUudGFibGUodGFibGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQml0U3RyaW5nKHZhbHVlOiBudW1iZXIsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIHRvdGFsUHJvcHM6IG51bWJlcikge1xuICBpZiAoaXNNYXBCYXNlZCB8fCB2YWx1ZSA+IDEpIHtcbiAgICByZXR1cm4gYDBiJHtsZWZ0UGFkKHZhbHVlLnRvU3RyaW5nKDIpLCB0b3RhbFByb3BzLCAnMCcpfWA7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxlZnRQYWQodmFsdWU6IHN0cmluZywgbWF4OiBudW1iZXIsIHBhZDogc3RyaW5nKSB7XG4gIHJldHVybiByZXBlYXQocGFkLCBtYXggLSB2YWx1ZS5sZW5ndGgpICsgdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFR5cGVGcm9tQ29sdW1uKGluZGV4OiBudW1iZXIsIHRvdGFsQ29sdW1uczogbnVtYmVyKSB7XG4gIGlmIChpbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKSB7XG4gICAgcmV0dXJuICd0ZW1wbGF0ZSc7XG4gIH0gZWxzZSBpZiAoaW5kZXggPT09IHRvdGFsQ29sdW1ucyAtIDEpIHtcbiAgICByZXR1cm4gJ2RlZmF1bHRzJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYGRpciAjJHtpbmRleH1gO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGVhdChjOiBzdHJpbmcsIHRpbWVzOiBudW1iZXIpIHtcbiAgbGV0IHMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lczsgaSsrKSB7XG4gICAgcyArPSBjO1xuICB9XG4gIHJldHVybiBzO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgcHJpdmF0ZSBfc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2RlYnVnQ29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dHxEZWJ1Z1N0eWxpbmdDb250ZXh0LCBwcml2YXRlIF9kYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgICBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpID9cbiAgICAgICAgbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCBfaXNDbGFzc0Jhc2VkKSA6XG4gICAgICAgIChjb250ZXh0IGFzIERlYnVnU3R5bGluZ0NvbnRleHQpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQ7IH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpIHsgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0gPSB7fTtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSB0aGlzLl9pc0NsYXNzQmFzZWQ7XG5cbiAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAvLyB0aGUgZGlyZWN0IHBhc3MgY29kZSBkb2Vzbid0IGNvbnZlcnQgW3N0eWxlXSBvciBbY2xhc3NdIHZhbHVlc1xuICAgIC8vIGludG8gU3R5bGluZ01hcEFycmF5IGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uLCB0aGUgdmFsdWVzXG4gICAgLy8gbmVlZCB0byBiZSBjb252ZXJ0ZWQgYWhlYWQgb2YgdGltZSBzaW5jZSB0aGUgc3R5bGluZyBkZWJ1Z1xuICAgIC8vIHJlbGllcyBvbiBjb250ZXh0IHJlc29sdXRpb24gdG8gZmlndXJlIG91dCB3aGF0IHN0eWxpbmdcbiAgICAvLyB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkL3JlbW92ZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGNvbmZpZy5hbGxvd0RpcmVjdFN0eWxpbmcgJiYgY29uZmlnLmhhc01hcEJpbmRpbmdzKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQoW10pOyAgLy8gbWFrZSBhIGNvcHlcbiAgICAgIHRoaXMuX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tYXBWYWx1ZXMoZGF0YSwgKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuXG4gICAgLy8gYmVjYXVzZSB0aGUgc3R5bGluZyBhbGdvcml0aG0gcnVucyBpbnRvIHR3byBkaWZmZXJlbnRcbiAgICAvLyBtb2RlczogZGlyZWN0IGFuZCBjb250ZXh0LXJlc29sdXRpb24sIHRoZSBvdXRwdXQgb2YgdGhlIGVudHJpZXNcbiAgICAvLyBvYmplY3QgaXMgZGlmZmVyZW50IGJlY2F1c2UgdGhlIHJlbW92ZWQgdmFsdWVzIGFyZSBub3RcbiAgICAvLyBzYXZlZCBiZXR3ZWVuIHVwZGF0ZXMuIEZvciB0aGlzIHJlYXNvbiBhIHByb3h5IGlzIGNyZWF0ZWRcbiAgICAvLyBzbyB0aGF0IHRoZSBiZWhhdmlvciBpcyB0aGUgc2FtZSB3aGVuIGV4YW1pbmluZyB2YWx1ZXNcbiAgICAvLyB0aGF0IGFyZSBubyBsb25nZXIgYWN0aXZlIG9uIHRoZSBlbGVtZW50LlxuICAgIHJldHVybiBjcmVhdGVQcm94eSh7XG4gICAgICBnZXQodGFyZ2V0OiB7fSwgcHJvcDogc3RyaW5nKTogRGVidWdOb2RlU3R5bGluZ0VudHJ5e1xuICAgICAgICBsZXQgdmFsdWU6IERlYnVnTm9kZVN0eWxpbmdFbnRyeSA9IGVudHJpZXNbcHJvcF07IGlmICghdmFsdWUpIHtcbiAgICAgICAgICB2YWx1ZSA9IHtcbiAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICB2YWx1ZTogaXNDbGFzc0Jhc2VkID8gZmFsc2UgOiBudWxsLFxuICAgICAgICAgICAgYmluZGluZ0luZGV4OiBudWxsLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gcmV0dXJuIHZhbHVlO1xuICAgICAgfSxcbiAgICAgIHNldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgb3duS2V5cygpIHsgcmV0dXJuIE9iamVjdC5rZXlzKGVudHJpZXMpOyB9LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGs6IGFueSkge1xuICAgICAgICAvLyB3ZSB1c2UgYSBzcGVjaWFsIHByb3BlcnR5IGRlc2NyaXB0b3IgaGVyZSBzbyB0aGF0IGVudW1lcmF0aW9uIG9wZXJhdGlvbnNcbiAgICAgICAgLy8gc3VjaCBhcyBgT2JqZWN0LmtleXNgIHdpbGwgd29yayBvbiB0aGlzIHByb3h5LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldCBjb25maWcoKSB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLmNvbnRleHQuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGtleS92YWx1ZSBtYXAgb2YgYWxsIHRoZSBzdHlsZXMvY2xhc3NlcyB0aGF0IHdlcmUgbGFzdCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IHZhbHVlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAvLyB0aGUgZGlyZWN0IHBhc3MgY29kZSBkb2Vzbid0IGNvbnZlcnQgW3N0eWxlXSBvciBbY2xhc3NdIHZhbHVlc1xuICAgIC8vIGludG8gU3R5bGluZ01hcEFycmF5IGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uLCB0aGUgdmFsdWVzXG4gICAgLy8gbmVlZCB0byBiZSBjb252ZXJ0ZWQgYWhlYWQgb2YgdGltZSBzaW5jZSB0aGUgc3R5bGluZyBkZWJ1Z1xuICAgIC8vIHJlbGllcyBvbiBjb250ZXh0IHJlc29sdXRpb24gdG8gZmlndXJlIG91dCB3aGF0IHN0eWxpbmdcbiAgICAvLyB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkL3JlbW92ZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGNvbmZpZy5hbGxvd0RpcmVjdFN0eWxpbmcgJiYgY29uZmlnLmhhc01hcEJpbmRpbmdzKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQoW10pOyAgLy8gbWFrZSBhIGNvcHlcbiAgICAgIHRoaXMuX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tYXBWYWx1ZXMoZGF0YSwgKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgPT4geyBlbnRyaWVzW3Byb3BdID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGE6IExTdHlsaW5nRGF0YSkge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQuY29udGV4dDtcbiAgICBjb25zdCBsaW1pdCA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIGZvciAobGV0IGkgPVxuICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgICAgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlID0gYmluZGluZ0luZGV4ICE9PSAwID8gZ2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4KSA6IG51bGw7XG4gICAgICBpZiAoYmluZGluZ1ZhbHVlICYmICFBcnJheS5pc0FycmF5KGJpbmRpbmdWYWx1ZSkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGluZ01hcEFycmF5ID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAobnVsbCwgYmluZGluZ1ZhbHVlLCAhdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyYXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhcbiAgICAgIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIGZuOiAocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcbiAgICBjb25zdCBoYXNNYXBzID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dC5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICBiaW5kaW5nSW5kZXg/OiBudW1iZXIgfCBudWxsKSA9PiBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpO1xuXG4gICAgLy8gcnVuIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgZmFsc2UpO1xuXG4gICAgLy8gYW5kIGFsc28gdGhlIGhvc3QgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIGRhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICBjb25zdCBoYXNNYXBCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1Byb3BCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpO1xuICBjb25zdCBoYXNDb2xsaXNpb25zID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpO1xuICBjb25zdCBoYXNUZW1wbGF0ZUJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICBjb25zdCBoYXNIb3N0QmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzKTtcbiAgY29uc3QgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5UZW1wbGF0ZUJpbmRpbmdzTG9ja2VkKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTG9ja2VkID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhvc3RCaW5kaW5nc0xvY2tlZCk7XG4gIGNvbnN0IGFsbG93RGlyZWN0U3R5bGluZyA9XG4gICAgICBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIGZhbHNlKSB8fCBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIHRydWUpO1xuXG4gIHJldHVybiB7XG4gICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgICAgLy9cbiAgICAgIGhhc1Byb3BCaW5kaW5ncywgICAgICAgICAvL1xuICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgICAgIC8vXG4gICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgICAgLy9cbiAgICAgIGhhc0hvc3RCaW5kaW5ncywgICAgICAgICAvL1xuICAgICAgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCwgIC8vXG4gICAgICBob3N0QmluZGluZ3NMb2NrZWQsICAgICAgLy9cbiAgICAgIGFsbG93RGlyZWN0U3R5bGluZywgICAgICAvL1xuICB9O1xufVxuIl19