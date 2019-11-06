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
    // `firstTemplatePass` here is false because the context has already been constructed
    // directly within the behavior of the debugging tools (outside of style/class debugging,
    // the context is constructed during the first template pass).
    var allowDirectStyling = _allowDirectStyling(context, false);
    return {
        hasMapBindings: hasMapBindings,
        hasPropBindings: hasPropBindings,
        hasCollisions: hasCollisions,
        hasTemplateBindings: hasTemplateBindings,
        hasHostBindings: hasHostBindings,
        allowDirectStyling: allowDirectStyling,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7RUFNRTtBQUNGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUk5QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixJQUFJLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU1VSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFxSS9EOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUFDLE9BQXdCLEVBQUUsWUFBcUI7SUFDdEYsSUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDOUQsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0g7SUFDRSw4QkFBNEIsT0FBd0IsRUFBVSxhQUFzQjtRQUF4RCxZQUFPLEdBQVAsT0FBTyxDQUFpQjtRQUFVLGtCQUFhLEdB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LGNBQWMsR0FBRyxTQUFTLENBQUMsT0FBTyx5QkFBZ0MsQ0FBQztJQUN6RSxJQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsT0FBTywwQkFBaUMsQ0FBQztJQUMzRSxJQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsT0FBTyx3QkFBK0IsQ0FBQztJQUN2RSxJQUFNLG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxPQUFPLCtCQUFxQyxDQUFDO0lBQ25GLElBQU0sZUFBZSxHQUFHLFNBQVMsQ0FBQyxPQUFPLDJCQUFpQyxDQUFDO0lBRTNFLHFGQUFxRjtJQUNyRix5RkFBeUY7SUFDekYsOERBQThEO0lBQzlELElBQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQy9ELE9BQU87UUFDSCxjQUFjLGdCQUFBO1FBQ2QsZUFBZSxpQkFBQTtRQUNmLGFBQWEsZUFBQTtRQUNiLG1CQUFtQixxQkFBQTtRQUNuQixlQUFlLGlCQUFBO1FBQ2Ysa0JBQWtCLG9CQUFBO0tBQ3JCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtjcmVhdGVQcm94eX0gZnJvbSAnLi4vLi4vZGVidWcvcHJveHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuaW1wb3J0IHtNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FLCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGFsbG93RGlyZWN0U3R5bGluZyBhcyBfYWxsb3dEaXJlY3RTdHlsaW5nLCBnZXRCaW5kaW5nVmFsdWUsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQsIGlzU3R5bGluZ0NvbnRleHQsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBzZXRWYWx1ZX0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHthcHBseVN0eWxpbmdWaWFDb250ZXh0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBkZWJ1ZyBmdW5jdGlvbmFsaXR5IGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBkZWJ1Zy1mcmllbmRseSB2ZXJzaW9uIG9mIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEFuIGluc3RhbmNlIG9mIHRoaXMgaXMgYXR0YWNoZWQgdG8gYHRTdHlsaW5nQ29udGV4dC5kZWJ1Z2Agd2hlbiBgbmdEZXZNb2RlYCBpcyBhY3RpdmUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIC8qKiBUaGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBvZiB0aGUgYXNzb2NpYXRlZCBgVFN0eWxpbmdDb250ZXh0YCAqL1xuICBjb25maWc6IERlYnVnU3R5bGluZ0NvbmZpZztcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fTtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgc291cmNlcyB3aXRoaW4gdGhlIGNvbnRleHQgKi9cbiAgcHJpbnRTb3VyY2VzKCk6IHZvaWQ7XG5cbiAgLyoqIEEgc3RhdHVzIHJlcG9ydCBvZiBhbGwgdGhlIGVudGlyZSBjb250ZXh0IGFzIGEgdGFibGUgKi9cbiAgcHJpbnRUYWJsZSgpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYFRTdHlsaW5nQ29uZmlnYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb25maWcge1xuICBoYXNNYXBCaW5kaW5nczogYm9vbGVhbjsgICAgICAgLy9cbiAgaGFzUHJvcEJpbmRpbmdzOiBib29sZWFuOyAgICAgIC8vXG4gIGhhc0NvbGxpc2lvbnM6IGJvb2xlYW47ICAgICAgICAvL1xuICBoYXNUZW1wbGF0ZUJpbmRpbmdzOiBib29sZWFuOyAgLy9cbiAgaGFzSG9zdEJpbmRpbmdzOiBib29sZWFuOyAgICAgIC8vXG4gIGFsbG93RGlyZWN0U3R5bGluZzogYm9vbGVhbjsgICAvL1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyB3aXRoaW4gYSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIGVudHJ5IHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhIHBhcnQgb2YgdGhpcyBlbnRyeSAqL1xuICB2YWx1ZXNDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgdGVtcGxhdGUgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICB0ZW1wbGF0ZUJpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IGhvc3Qgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICBob3N0QmluZGluZ3NCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSByZXF1aXJlcyBzYW5pdGl6YXRpb25cbiAgICovXG4gIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSB0aGF0IHdpbGwgYmUgYXBwbGllZCBpZiBhbnkgYmluZGluZ3MgYXJlIGZhbHN5XG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlXG4gICAqL1xuICBzb3VyY2VzOiAobnVtYmVyfG51bGx8c3RyaW5nKVtdO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgLyoqIFRoZSBhc3NvY2lhdGVkIGRlYnVnIGNvbnRleHQgb2YgdGhlIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBEZWJ1Z1N0eWxpbmdDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBBIHN1bW1hcml6YXRpb24gb2YgZWFjaCBzdHlsZS9jbGFzcyBwcm9wZXJ0eVxuICAgKiBwcmVzZW50IGluIHRoZSBjb250ZXh0XG4gICAqL1xuICBzdW1tYXJ5OiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fTtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzXG4gICAqL1xuICB2YWx1ZXM6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgYm9vbGVhbn07XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXNcbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYSBzdHlsaW5nIGVudHJ5LlxuICpcbiAqIEEgdmFsdWUgc3VjaCBhcyB0aGlzIGlzIGdlbmVyYXRlZCBhcyBhbiBhcnRpZmFjdCBvZiB0aGUgYERlYnVnU3R5bGluZ2BcbiAqIHN1bW1hcnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZ0VudHJ5IHtcbiAgLyoqIFRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSB0aGF0IHRoZSBzdW1tYXJ5IGlzIGF0dGFjaGVkIHRvICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIGxhc3QgYXBwbGllZCB2YWx1ZSBmb3IgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKiBUaGUgYmluZGluZyBpbmRleCBvZiB0aGUgbGFzdCBhcHBsaWVkIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG59XG5cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBkZWJ1ZyA9IG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0LCBpc0NsYXNzQmFzZWQpO1xuICBhdHRhY2hEZWJ1Z09iamVjdChjb250ZXh0LCBkZWJ1Zyk7XG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IHdpdGhpbiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5jbGFzcyBUU3R5bGluZ0NvbnRleHREZWJ1ZyBpbXBsZW1lbnRzIERlYnVnU3R5bGluZ0NvbnRleHQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHt9XG5cbiAgZ2V0IGNvbmZpZygpOiBEZWJ1Z1N0eWxpbmdDb25maWcgeyByZXR1cm4gYnVpbGRDb25maWcodGhpcy5jb250ZXh0KTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFNlZSBgRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5YC5cbiAgICovXG4gIGdldCBlbnRyaWVzKCk6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fSB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBlbnRyaWVzOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX0gPSB7fTtcbiAgICBjb25zdCBzdGFydCA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZUJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRQb3NpdGlvbiA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuXG4gICAgICBjb25zdCBzb3VyY2VzOiAobnVtYmVyIHwgc3RyaW5nIHwgbnVsbClbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbYmluZGluZ3NTdGFydFBvc2l0aW9uICsgal0gYXMgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgaWYgKGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIHNvdXJjZXMucHVzaChiaW5kaW5nSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVudHJpZXNbcHJvcF0gPSB7XG4gICAgICAgIHByb3AsXG4gICAgICAgIHRlbXBsYXRlQml0TWFzayxcbiAgICAgICAgaG9zdEJpbmRpbmdzQml0TWFzayxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQsXG4gICAgICAgIHZhbHVlc0NvdW50OiBzb3VyY2VzLmxlbmd0aCwgZGVmYXVsdFZhbHVlLCBzb3VyY2VzLFxuICAgICAgfTtcblxuICAgICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmludHMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBzb3VyY2UgZ3JvdXBlZCB0b2dldGhlciB3aXRoIGVhY2ggYmluZGluZyBpbmRleCBpblxuICAgKiB0aGUgY29udGV4dC5cbiAgICovXG4gIHByaW50U291cmNlcygpOiB2b2lkIHtcbiAgICBsZXQgb3V0cHV0ID0gJ1xcbic7XG5cbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHByZWZpeCA9IHRoaXMuX2lzQ2xhc3NCYXNlZCA/ICdjbGFzcycgOiAnc3R5bGUnO1xuICAgIGNvbnN0IGJpbmRpbmdzQnlTb3VyY2U6IHtcbiAgICAgIHR5cGU6IHN0cmluZyxcbiAgICAgIGVudHJpZXM6IHtiaW5kaW5nOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55LCBiaXRNYXNrOiBudW1iZXJ9W11cbiAgICB9W10gPSBbXTtcblxuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxDb2x1bW5zOyBpKyspIHtcbiAgICAgIGNvbnN0IGlzRGVmYXVsdENvbHVtbiA9IGkgPT09IHRvdGFsQ29sdW1ucyAtIDE7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaSAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xuICAgICAgY29uc3QgdHlwZSA9IGdldFR5cGVGcm9tQ29sdW1uKGksIHRvdGFsQ29sdW1ucyk7XG4gICAgICBjb25zdCBlbnRyaWVzOiB7YmluZGluZzogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgYml0TWFzazogbnVtYmVyfVtdID0gW107XG5cbiAgICAgIGxldCBqID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICAgIHdoaWxlIChqIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaiwgaSk7XG4gICAgICAgIGlmIChpc0RlZmF1bHRDb2x1bW4gfHwgdmFsdWUgPiAwKSB7XG4gICAgICAgICAgY29uc3QgYml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBqLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBpc0RlZmF1bHRDb2x1bW4gPyAtMSA6IHZhbHVlIGFzIG51bWJlcjtcbiAgICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgICBjb25zdCBpc01hcEJhc2VkID0gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbiAgICAgICAgICBjb25zdCBiaW5kaW5nID0gYCR7cHJlZml4fSR7aXNNYXBCYXNlZCA/ICcnIDogJy4nICsgcHJvcH1gO1xuICAgICAgICAgIGVudHJpZXMucHVzaCh7YmluZGluZywgdmFsdWUsIGJpbmRpbmdJbmRleCwgYml0TWFza30pO1xuICAgICAgICB9XG4gICAgICAgIGogKz0gaXRlbXNQZXJSb3c7XG4gICAgICB9XG5cbiAgICAgIGJpbmRpbmdzQnlTb3VyY2UucHVzaChcbiAgICAgICAgICB7dHlwZSwgZW50cmllczogZW50cmllcy5zb3J0KChhLCBiKSA9PiBhLmJpbmRpbmdJbmRleCAtIGIuYmluZGluZ0luZGV4KX0pO1xuICAgIH1cblxuICAgIGJpbmRpbmdzQnlTb3VyY2UuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBvdXRwdXQgKz0gYFske2VudHJ5LnR5cGUudG9VcHBlckNhc2UoKX1dXFxuYDtcbiAgICAgIG91dHB1dCArPSByZXBlYXQoJy0nLCBlbnRyeS50eXBlLmxlbmd0aCArIDIpICsgJ1xcbic7XG5cbiAgICAgIGxldCB0YWIgPSAnICAnO1xuICAgICAgZW50cnkuZW50cmllcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgY29uc3QgaXNEZWZhdWx0ID0gdHlwZW9mIGVudHJ5LnZhbHVlICE9PSAnbnVtYmVyJztcbiAgICAgICAgY29uc3QgdmFsdWUgPSBlbnRyeS52YWx1ZTtcbiAgICAgICAgaWYgKCFpc0RlZmF1bHQgfHwgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICBvdXRwdXQgKz0gYCR7dGFifVske2VudHJ5LmJpbmRpbmd9XSA9IFxcYCR7dmFsdWV9XFxgYDtcbiAgICAgICAgICBvdXRwdXQgKz0gJ1xcbic7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgb3V0cHV0ICs9ICdcXG4nO1xuICAgIH0pO1xuXG4gICAgLyogdHNsaW50OmRpc2FibGUgKi9cbiAgICBjb25zb2xlLmxvZyhvdXRwdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50cyBhIGRldGFpbGVkIHRhYmxlIG9mIHRoZSBlbnRpcmUgc3R5bGluZyBjb250ZXh0LlxuICAgKi9cbiAgcHJpbnRUYWJsZSgpOiB2b2lkIHtcbiAgICAvLyBJRSAobm90IEVkZ2UpIGlzIHRoZSBvbmx5IGJyb3dzZXIgdGhhdCBkb2Vzbid0IHN1cHBvcnQgdGhpcyBmZWF0dXJlLiBCZWNhdXNlXG4gICAgLy8gdGhlc2UgZGVidWdnaW5nIHRvb2xzIGFyZSBub3QgYXBhcnQgb2YgdGhlIGNvcmUgb2YgQW5ndWxhciAodGhleSBhcmUganVzdFxuICAgIC8vIGV4dHJhIHRvb2xzKSB3ZSBjYW4gc2tpcC1vdXQgb24gb2xkZXIgYnJvd3NlcnMuXG4gICAgaWYgKCFjb25zb2xlLnRhYmxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgZmVhdHVyZSBpcyBub3Qgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3NlcicpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdGFibGU6IGFueVtdID0gW107XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuICAgIGNvbnN0IHRvdGFsUHJvcHMgPSBNYXRoLmZsb29yKGNvbnRleHQubGVuZ3RoIC8gaXRlbXNQZXJSb3cpO1xuXG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgaXNNYXBCYXNlZCA9IHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG4gICAgICBjb25zdCBlbnRyeToge1trZXk6IHN0cmluZ106IGFueX0gPSB7XG4gICAgICAgIHByb3AsXG4gICAgICAgICd0cGwgbWFzayc6IGdlbmVyYXRlQml0U3RyaW5nKGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSksIGlzTWFwQmFzZWQsIHRvdGFsUHJvcHMpLFxuICAgICAgICAnaG9zdCBtYXNrJzogZ2VuZXJhdGVCaXRTdHJpbmcoZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpLCBpc01hcEJhc2VkLCB0b3RhbFByb3BzKSxcbiAgICAgIH07XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0VHlwZUZyb21Db2x1bW4oaiwgdG90YWxDb2x1bW5zKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgaik7XG4gICAgICAgIGVudHJ5W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgaSArPSBpdGVtc1BlclJvdztcbiAgICAgIHRhYmxlLnB1c2goZW50cnkpO1xuICAgIH1cblxuICAgIC8qIHRzbGludDpkaXNhYmxlICovXG4gICAgY29uc29sZS50YWJsZSh0YWJsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVCaXRTdHJpbmcodmFsdWU6IG51bWJlciwgaXNNYXBCYXNlZDogYm9vbGVhbiwgdG90YWxQcm9wczogbnVtYmVyKSB7XG4gIGlmIChpc01hcEJhc2VkIHx8IHZhbHVlID4gMSkge1xuICAgIHJldHVybiBgMGIke2xlZnRQYWQodmFsdWUudG9TdHJpbmcoMiksIHRvdGFsUHJvcHMsICcwJyl9YDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbGVmdFBhZCh2YWx1ZTogc3RyaW5nLCBtYXg6IG51bWJlciwgcGFkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHJlcGVhdChwYWQsIG1heCAtIHZhbHVlLmxlbmd0aCkgKyB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0VHlwZUZyb21Db2x1bW4oaW5kZXg6IG51bWJlciwgdG90YWxDb2x1bW5zOiBudW1iZXIpIHtcbiAgaWYgKGluZGV4ID09PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpIHtcbiAgICByZXR1cm4gJ3RlbXBsYXRlJztcbiAgfSBlbHNlIGlmIChpbmRleCA9PT0gdG90YWxDb2x1bW5zIC0gMSkge1xuICAgIHJldHVybiAnZGVmYXVsdHMnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgZGlyICMke2luZGV4fWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwZWF0KGM6IHN0cmluZywgdGltZXM6IG51bWJlcikge1xuICBsZXQgcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRpbWVzOyBpKyspIHtcbiAgICBzICs9IGM7XG4gIH1cbiAgcmV0dXJuIHM7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZVN0eWxpbmdEZWJ1ZyBpbXBsZW1lbnRzIERlYnVnTm9kZVN0eWxpbmcge1xuICBwcml2YXRlIF9zYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfZGVidWdDb250ZXh0OiBEZWJ1Z1N0eWxpbmdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0fERlYnVnU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2RhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIHByaXZhdGUgX2lzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQoY29udGV4dCkgP1xuICAgICAgICBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQsIF9pc0NsYXNzQmFzZWQpIDpcbiAgICAgICAgKGNvbnRleHQgYXMgRGVidWdTdHlsaW5nQ29udGV4dCk7XG4gIH1cblxuICBnZXQgY29udGV4dCgpIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dDsgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzLlxuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCkgeyB0aGlzLl9zYW5pdGl6ZXIgPSBzYW5pdGl6ZXI7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0IGFuZFxuICAgKiB3aGF0IHRoZWlyIHJ1bnRpbWUgcmVwcmVzZW50YXRpb24gaXMuXG4gICAqXG4gICAqIFNlZSBgTFN0eWxpbmdTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBzdW1tYXJ5KCk6IHtba2V5OiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSA9IHt9O1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IHRoaXMuX2lzQ2xhc3NCYXNlZDtcblxuICAgIGxldCBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgIC8vIHRoZSBkaXJlY3QgcGFzcyBjb2RlIGRvZXNuJ3QgY29udmVydCBbc3R5bGVdIG9yIFtjbGFzc10gdmFsdWVzXG4gICAgLy8gaW50byBTdHlsaW5nTWFwQXJyYXkgaW5zdGFuY2VzLiBGb3IgdGhpcyByZWFzb24sIHRoZSB2YWx1ZXNcbiAgICAvLyBuZWVkIHRvIGJlIGNvbnZlcnRlZCBhaGVhZCBvZiB0aW1lIHNpbmNlIHRoZSBzdHlsaW5nIGRlYnVnXG4gICAgLy8gcmVsaWVzIG9uIGNvbnRleHQgcmVzb2x1dGlvbiB0byBmaWd1cmUgb3V0IHdoYXQgc3R5bGluZ1xuICAgIC8vIHZhbHVlcyBoYXZlIGJlZW4gYWRkZWQvcmVtb3ZlZCBvbiB0aGUgZWxlbWVudC5cbiAgICBpZiAoY29uZmlnLmFsbG93RGlyZWN0U3R5bGluZyAmJiBjb25maWcuaGFzTWFwQmluZGluZ3MpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChbXSk7ICAvLyBtYWtlIGEgY29weVxuICAgICAgdGhpcy5fY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX21hcFZhbHVlcyhkYXRhLCAocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgIGVudHJpZXNbcHJvcF0gPSB7cHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleH07XG4gICAgfSk7XG5cbiAgICAvLyBiZWNhdXNlIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBydW5zIGludG8gdHdvIGRpZmZlcmVudFxuICAgIC8vIG1vZGVzOiBkaXJlY3QgYW5kIGNvbnRleHQtcmVzb2x1dGlvbiwgdGhlIG91dHB1dCBvZiB0aGUgZW50cmllc1xuICAgIC8vIG9iamVjdCBpcyBkaWZmZXJlbnQgYmVjYXVzZSB0aGUgcmVtb3ZlZCB2YWx1ZXMgYXJlIG5vdFxuICAgIC8vIHNhdmVkIGJldHdlZW4gdXBkYXRlcy4gRm9yIHRoaXMgcmVhc29uIGEgcHJveHkgaXMgY3JlYXRlZFxuICAgIC8vIHNvIHRoYXQgdGhlIGJlaGF2aW9yIGlzIHRoZSBzYW1lIHdoZW4gZXhhbWluaW5nIHZhbHVlc1xuICAgIC8vIHRoYXQgYXJlIG5vIGxvbmdlciBhY3RpdmUgb24gdGhlIGVsZW1lbnQuXG4gICAgcmV0dXJuIGNyZWF0ZVByb3h5KHtcbiAgICAgIGdldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcpOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl7XG4gICAgICAgIGxldCB2YWx1ZTogRGVidWdOb2RlU3R5bGluZ0VudHJ5ID0gZW50cmllc1twcm9wXTsgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgIHZhbHVlID0ge1xuICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgICAgIHZhbHVlOiBpc0NsYXNzQmFzZWQgPyBmYWxzZSA6IG51bGwsXG4gICAgICAgICAgICBiaW5kaW5nSW5kZXg6IG51bGwsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgc2V0KHRhcmdldDoge30sIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgeyByZXR1cm4gZmFsc2U7IH0sXG4gICAgICBvd25LZXlzKCkgeyByZXR1cm4gT2JqZWN0LmtleXMoZW50cmllcyk7IH0sXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoazogYW55KSB7XG4gICAgICAgIC8vIHdlIHVzZSBhIHNwZWNpYWwgcHJvcGVydHkgZGVzY3JpcHRvciBoZXJlIHNvIHRoYXQgZW51bWVyYXRpb24gb3BlcmF0aW9uc1xuICAgICAgICAvLyBzdWNoIGFzIGBPYmplY3Qua2V5c2Agd2lsbCB3b3JrIG9uIHRoaXMgcHJveHkuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuY29udGV4dC5jb250ZXh0KTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgdGhlIHN0eWxlcy9jbGFzc2VzIHRoYXQgd2VyZSBsYXN0IGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAqL1xuICBnZXQgdmFsdWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgIGxldCBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgIC8vIHRoZSBkaXJlY3QgcGFzcyBjb2RlIGRvZXNuJ3QgY29udmVydCBbc3R5bGVdIG9yIFtjbGFzc10gdmFsdWVzXG4gICAgLy8gaW50byBTdHlsaW5nTWFwQXJyYXkgaW5zdGFuY2VzLiBGb3IgdGhpcyByZWFzb24sIHRoZSB2YWx1ZXNcbiAgICAvLyBuZWVkIHRvIGJlIGNvbnZlcnRlZCBhaGVhZCBvZiB0aW1lIHNpbmNlIHRoZSBzdHlsaW5nIGRlYnVnXG4gICAgLy8gcmVsaWVzIG9uIGNvbnRleHQgcmVzb2x1dGlvbiB0byBmaWd1cmUgb3V0IHdoYXQgc3R5bGluZ1xuICAgIC8vIHZhbHVlcyBoYXZlIGJlZW4gYWRkZWQvcmVtb3ZlZCBvbiB0aGUgZWxlbWVudC5cbiAgICBpZiAoY29uZmlnLmFsbG93RGlyZWN0U3R5bGluZyAmJiBjb25maWcuaGFzTWFwQmluZGluZ3MpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChbXSk7ICAvLyBtYWtlIGEgY29weVxuICAgICAgdGhpcy5fY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX21hcFZhbHVlcyhkYXRhLCAocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7IGVudHJpZXNbcHJvcF0gPSB2YWx1ZTsgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICBwcml2YXRlIF9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YTogTFN0eWxpbmdEYXRhKSB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dC5jb250ZXh0O1xuICAgIGNvbnN0IGxpbWl0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgZm9yIChsZXQgaSA9XG4gICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgICAgICBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiaW5kaW5nVmFsdWUgPSBiaW5kaW5nSW5kZXggIT09IDAgPyBnZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgpIDogbnVsbDtcbiAgICAgIGlmIChiaW5kaW5nVmFsdWUgJiYgIUFycmF5LmlzQXJyYXkoYmluZGluZ1ZhbHVlKSkge1xuICAgICAgICBjb25zdCBzdHlsaW5nTWFwQXJyYXkgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChudWxsLCBiaW5kaW5nVmFsdWUsICF0aGlzLl9pc0NsYXNzQmFzZWQpO1xuICAgICAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnJheSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfbWFwVmFsdWVzKFxuICAgICAgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgICAgZm46IChwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCkgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuICAgIGNvbnN0IGhhc01hcHMgPSBoYXNDb25maWcodGhpcy5jb250ZXh0LmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKTtcbiAgICBpZiAoaGFzTWFwcykge1xuICAgICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IG1hcEZuOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgICAgIChyZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgIGJpbmRpbmdJbmRleD86IG51bWJlciB8IG51bGwpID0+IGZuKHByb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXggfHwgbnVsbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyBudWxsIDogKHRoaXMuX3Nhbml0aXplciB8fCBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSk7XG5cbiAgICAvLyBydW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbnRleHQsIG51bGwsIG1vY2tFbGVtZW50LCBkYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCBmYWxzZSk7XG5cbiAgICAvLyBhbmQgYWxzbyB0aGUgaG9zdCBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgdHJ1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGNvbnN0IGhhc01hcEJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKTtcbiAgY29uc3QgaGFzUHJvcEJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0NvbGxpc2lvbnMgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucyk7XG4gIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzVGVtcGxhdGVCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0hvc3RCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpO1xuXG4gIC8vIGBmaXJzdFRlbXBsYXRlUGFzc2AgaGVyZSBpcyBmYWxzZSBiZWNhdXNlIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gY29uc3RydWN0ZWRcbiAgLy8gZGlyZWN0bHkgd2l0aGluIHRoZSBiZWhhdmlvciBvZiB0aGUgZGVidWdnaW5nIHRvb2xzIChvdXRzaWRlIG9mIHN0eWxlL2NsYXNzIGRlYnVnZ2luZyxcbiAgLy8gdGhlIGNvbnRleHQgaXMgY29uc3RydWN0ZWQgZHVyaW5nIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzKS5cbiAgY29uc3QgYWxsb3dEaXJlY3RTdHlsaW5nID0gX2FsbG93RGlyZWN0U3R5bGluZyhjb250ZXh0LCBmYWxzZSk7XG4gIHJldHVybiB7XG4gICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgLy9cbiAgICAgIGhhc1Byb3BCaW5kaW5ncywgICAgICAvL1xuICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgIC8vXG4gICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgLy9cbiAgICAgIGhhc0hvc3RCaW5kaW5ncywgICAgICAvL1xuICAgICAgYWxsb3dEaXJlY3RTdHlsaW5nLCAgIC8vXG4gIH07XG59XG4iXX0=