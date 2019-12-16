/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { createProxy } from '../../debug/proxy';
import { getTStylingRangePrev } from '../interfaces/styling';
import { getCurrentStyleSanitizer } from '../state';
import { attachDebugObject } from '../util/debug_utils';
import { MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, allowDirectStyling as _allowDirectStyling, getBindingValue, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValue, getValuesCount, hasConfig, isSanitizationRequired, isStylingContext, normalizeIntoStylingMap, setValue } from '../util/styling_utils';
import { applyStylingViaContext } from './bindings';
import { activateStylingMapFeature } from './map_based_bindings';
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context
 */
export function attachStylingDebugObject(context, tNode, isClassBased) {
    var debug = new TStylingContextDebug(context, tNode, isClassBased);
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
    function TStylingContextDebug(context, _tNode, _isClassBased) {
        this.context = context;
        this._tNode = _tNode;
        this._isClassBased = _isClassBased;
    }
    Object.defineProperty(TStylingContextDebug.prototype, "config", {
        get: function () { return buildConfig(this._tNode, this._isClassBased); },
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
            var start = getPropValuesStartPosition(context, this._tNode, this._isClassBased);
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
            var j = 2 /* ValuesStartPosition */;
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
        var i = 2 /* ValuesStartPosition */;
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
    function NodeStylingDebug(context, _tNode, _data, _isClassBased) {
        this._tNode = _tNode;
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
        this._debugContext = isStylingContext(context) ?
            new TStylingContextDebug(context, _tNode, _isClassBased) :
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
        get: function () { return buildConfig(this._tNode, this._isClassBased); },
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
        var limit = getPropValuesStartPosition(context, this._tNode, this._isClassBased);
        for (var i = 2 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */; i < limit; i++) {
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
        var mapBindingsFlag = this._isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
        var hasMaps = hasConfig(this._tNode, mapBindingsFlag);
        if (hasMaps) {
            activateStylingMapFeature();
        }
        var mapFn = function (renderer, element, prop, value, bindingIndex) { return fn(prop, value, bindingIndex || null); };
        var sanitizer = this._isClassBased ? null : (this._sanitizer || getCurrentStyleSanitizer());
        // run the template bindings
        applyStylingViaContext(this.context.context, this._tNode, null, mockElement, data, true, mapFn, sanitizer, false, this._isClassBased);
        // and also the host bindings
        applyStylingViaContext(this.context.context, this._tNode, null, mockElement, data, true, mapFn, sanitizer, true, this._isClassBased);
    };
    return NodeStylingDebug;
}());
export { NodeStylingDebug };
function buildConfig(tNode, isClassBased) {
    var hasMapBindings = hasConfig(tNode, isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */);
    var hasPropBindings = hasConfig(tNode, isClassBased ? 1024 /* hasClassPropBindings */ : 32768 /* hasStylePropBindings */);
    var hasCollisions = hasConfig(tNode, isClassBased ? 8192 /* hasDuplicateClassBindings */ : 262144 /* hasDuplicateStyleBindings */);
    var hasTemplateBindings = hasConfig(tNode, isClassBased ? 2048 /* hasTemplateClassBindings */ : 65536 /* hasTemplateStyleBindings */);
    var hasHostBindings = hasConfig(tNode, isClassBased ? 4096 /* hasHostClassBindings */ : 131072 /* hasHostStyleBindings */);
    // `firstTemplatePass` here is false because the context has already been constructed
    // directly within the behavior of the debugging tools (outside of style/class debugging,
    // the context is constructed during the first template pass).
    var allowDirectStyling = _allowDirectStyling(tNode, isClassBased, false);
    return {
        hasMapBindings: hasMapBindings,
        hasPropBindings: hasPropBindings,
        hasCollisions: hasCollisions,
        hasTemplateBindings: hasTemplateBindings,
        hasHostBindings: hasHostBindings,
        allowDirectStyling: allowDirectStyling,
    };
}
/**
 * Find the head of the styling binding linked list.
 */
export function getStylingBindingHead(tData, tNode, isClassBinding) {
    var index = getTStylingRangePrev(isClassBinding ? tNode.classBindings : tNode.styleBindings);
    while (true) {
        var tStylingRange = tData[index + 1];
        var prev = getTStylingRangePrev(tStylingRange);
        if (prev === 0) {
            // found head exit.
            return index;
        }
        else {
            index = prev;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7RUFNRTtBQUNGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUk5QyxPQUFPLEVBQW1HLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFN0osT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxrQkFBa0IsSUFBSSxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFNVUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBcUkvRDs7R0FFRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FDcEMsT0FBd0IsRUFBRSxLQUFtQixFQUFFLFlBQXFCO0lBQ3RFLElBQU0sS0FBSyxHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNyRSxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSDtJ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LEdBQUcsbUJBQW1CLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzRSxPQUFPO1FBQ0gsY0FBYyxnQkFBQTtRQUNkLGVBQWUsaUJBQUE7UUFDZixhQUFhLGVBQUE7UUFDYixtQkFBbUIscUJBQUE7UUFDbkIsZUFBZSxpQkFBQTtRQUNmLGtCQUFrQixvQkFBQTtLQUNyQixDQUFDO0FBQ0osQ0FBQztBQUdEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsY0FBdUI7SUFDdkYsSUFBSSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDN0YsT0FBTyxJQUFJLEVBQUU7UUFDWCxJQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBa0IsQ0FBQztRQUN4RCxJQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNqRCxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDZCxtQkFBbUI7WUFDbkIsT0FBTyxLQUFLLENBQUM7U0FDZDthQUFNO1lBQ0wsS0FBSyxHQUFHLElBQUksQ0FBQztTQUNkO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtjcmVhdGVQcm94eX0gZnJvbSAnLi4vLi4vZGVidWcvcHJveHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ05vZGUsIFRTdHlsaW5nUmFuZ2UsIGdldFRTdHlsaW5nUmFuZ2VQcmV2fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtURGF0YX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7TUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBhbGxvd0RpcmVjdFN0eWxpbmcgYXMgX2FsbG93RGlyZWN0U3R5bGluZywgZ2V0QmluZGluZ1ZhbHVlLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaGFzQ29uZmlnLCBpc1Nhbml0aXphdGlvblJlcXVpcmVkLCBpc1N0eWxpbmdDb250ZXh0LCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgc2V0VmFsdWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7YXBwbHlTdHlsaW5nVmlhQ29udGV4dH0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge2FjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmV9IGZyb20gJy4vbWFwX2Jhc2VkX2JpbmRpbmdzJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgZGVidWcgZnVuY3Rpb25hbGl0eSBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIEEgZGVidWctZnJpZW5kbHkgdmVyc2lvbiBvZiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBBbiBpbnN0YW5jZSBvZiB0aGlzIGlzIGF0dGFjaGVkIHRvIGB0U3R5bGluZ0NvbnRleHQuZGVidWdgIHdoZW4gYG5nRGV2TW9kZWAgaXMgYWN0aXZlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbnRleHQge1xuICAvKiogVGhlIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2YgdGhlIGFzc29jaWF0ZWQgYFRTdHlsaW5nQ29udGV4dGAgKi9cbiAgY29uZmlnOiBEZWJ1Z1N0eWxpbmdDb25maWc7XG5cbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBlbnRyaWVzOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX07XG5cbiAgLyoqIEEgc3RhdHVzIHJlcG9ydCBvZiBhbGwgdGhlIHNvdXJjZXMgd2l0aGluIHRoZSBjb250ZXh0ICovXG4gIHByaW50U291cmNlcygpOiB2b2lkO1xuXG4gIC8qKiBBIHN0YXR1cyByZXBvcnQgb2YgYWxsIHRoZSBlbnRpcmUgY29udGV4dCBhcyBhIHRhYmxlICovXG4gIHByaW50VGFibGUoKTogdm9pZDtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGluZm9ybWF0aW9uIGluIGBUTm9kZS5mbGFnc2AuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29uZmlnIHtcbiAgaGFzTWFwQmluZGluZ3M6IGJvb2xlYW47ICAgICAgIC8vXG4gIGhhc1Byb3BCaW5kaW5nczogYm9vbGVhbjsgICAgICAvL1xuICBoYXNDb2xsaXNpb25zOiBib29sZWFuOyAgICAgICAgLy9cbiAgaGFzVGVtcGxhdGVCaW5kaW5nczogYm9vbGVhbjsgIC8vXG4gIGhhc0hvc3RCaW5kaW5nczogYm9vbGVhbjsgICAgICAvL1xuICBhbGxvd0RpcmVjdFN0eWxpbmc6IGJvb2xlYW47ICAgLy9cbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5IHtcbiAgLyoqIFRoZSBwcm9wZXJ0eSAoc3R5bGUgb3IgY2xhc3MgcHJvcGVydHkpIHRoYXQgdGhpcyBlbnRyeSByZXByZXNlbnRzICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIGVudHJpZXMgYSBwYXJ0IG9mIHRoaXMgZW50cnkgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IHRlbXBsYXRlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgdGVtcGxhdGVCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSBob3N0IHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgaG9zdEJpbmRpbmdzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgcmVxdWlyZXMgc2FuaXRpemF0aW9uXG4gICAqL1xuICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeVxuICAgKi9cbiAgZGVmYXVsdFZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGwgYmluZGluZ0luZGV4IHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBzdHlsZVxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZyB7XG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBkZWJ1ZyBjb250ZXh0IG9mIHRoZSBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dFxuICAgKi9cbiAgc3VtbWFyeToge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX07XG5cbiAgLyoqXG4gICAqIEEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgc3R5bGluZyBwcm9wZXJ0aWVzIGFuZCB0aGVpclxuICAgKiBydW50aW1lIHZhbHVlc1xuICAgKi9cbiAgdmFsdWVzOiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKTogdm9pZDtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmdFbnRyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGFuZCBhdHRhY2hlcyBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0RGVidWdgIHRvIHRoZSBwcm92aWRlZCBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVFN0eWxpbmdOb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIGltcGxlbWVudHMgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfdE5vZGU6IFRTdHlsaW5nTm9kZSxcbiAgICAgIHByaXZhdGUgX2lzQ2xhc3NCYXNlZDogYm9vbGVhbikge31cblxuICBnZXQgY29uZmlnKCk6IERlYnVnU3R5bGluZ0NvbmZpZyB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLl90Tm9kZSwgdGhpcy5faXNDbGFzc0Jhc2VkKTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFNlZSBgRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5YC5cbiAgICovXG4gIGdldCBlbnRyaWVzKCk6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fSB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBlbnRyaWVzOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX0gPSB7fTtcbiAgICBjb25zdCBzdGFydCA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQsIHRoaXMuX3ROb2RlLCB0aGlzLl9pc0NsYXNzQmFzZWQpO1xuICAgIGxldCBpID0gc3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZUJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRQb3NpdGlvbiA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuXG4gICAgICBjb25zdCBzb3VyY2VzOiAobnVtYmVyIHwgc3RyaW5nIHwgbnVsbClbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbYmluZGluZ3NTdGFydFBvc2l0aW9uICsgal0gYXMgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgaWYgKGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIHNvdXJjZXMucHVzaChiaW5kaW5nSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVudHJpZXNbcHJvcF0gPSB7XG4gICAgICAgIHByb3AsXG4gICAgICAgIHRlbXBsYXRlQml0TWFzayxcbiAgICAgICAgaG9zdEJpbmRpbmdzQml0TWFzayxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQsXG4gICAgICAgIHZhbHVlc0NvdW50OiBzb3VyY2VzLmxlbmd0aCwgZGVmYXVsdFZhbHVlLCBzb3VyY2VzLFxuICAgICAgfTtcblxuICAgICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmludHMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBzb3VyY2UgZ3JvdXBlZCB0b2dldGhlciB3aXRoIGVhY2ggYmluZGluZyBpbmRleCBpblxuICAgKiB0aGUgY29udGV4dC5cbiAgICovXG4gIHByaW50U291cmNlcygpOiB2b2lkIHtcbiAgICBsZXQgb3V0cHV0ID0gJ1xcbic7XG5cbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHByZWZpeCA9IHRoaXMuX2lzQ2xhc3NCYXNlZCA/ICdjbGFzcycgOiAnc3R5bGUnO1xuICAgIGNvbnN0IGJpbmRpbmdzQnlTb3VyY2U6IHtcbiAgICAgIHR5cGU6IHN0cmluZyxcbiAgICAgIGVudHJpZXM6IHtiaW5kaW5nOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55LCBiaXRNYXNrOiBudW1iZXJ9W11cbiAgICB9W10gPSBbXTtcblxuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxDb2x1bW5zOyBpKyspIHtcbiAgICAgIGNvbnN0IGlzRGVmYXVsdENvbHVtbiA9IGkgPT09IHRvdGFsQ29sdW1ucyAtIDE7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaSAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xuICAgICAgY29uc3QgdHlwZSA9IGdldFR5cGVGcm9tQ29sdW1uKGksIHRvdGFsQ29sdW1ucyk7XG4gICAgICBjb25zdCBlbnRyaWVzOiB7YmluZGluZzogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgYml0TWFzazogbnVtYmVyfVtdID0gW107XG5cbiAgICAgIGxldCBqID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICAgIHdoaWxlIChqIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaiwgaSk7XG4gICAgICAgIGlmIChpc0RlZmF1bHRDb2x1bW4gfHwgdmFsdWUgPiAwKSB7XG4gICAgICAgICAgY29uc3QgYml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBqLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBpc0RlZmF1bHRDb2x1bW4gPyAtMSA6IHZhbHVlIGFzIG51bWJlcjtcbiAgICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgICBjb25zdCBpc01hcEJhc2VkID0gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbiAgICAgICAgICBjb25zdCBiaW5kaW5nID0gYCR7cHJlZml4fSR7aXNNYXBCYXNlZCA/ICcnIDogJy4nICsgcHJvcH1gO1xuICAgICAgICAgIGVudHJpZXMucHVzaCh7YmluZGluZywgdmFsdWUsIGJpbmRpbmdJbmRleCwgYml0TWFza30pO1xuICAgICAgICB9XG4gICAgICAgIGogKz0gaXRlbXNQZXJSb3c7XG4gICAgICB9XG5cbiAgICAgIGJpbmRpbmdzQnlTb3VyY2UucHVzaChcbiAgICAgICAgICB7dHlwZSwgZW50cmllczogZW50cmllcy5zb3J0KChhLCBiKSA9PiBhLmJpbmRpbmdJbmRleCAtIGIuYmluZGluZ0luZGV4KX0pO1xuICAgIH1cblxuICAgIGJpbmRpbmdzQnlTb3VyY2UuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBvdXRwdXQgKz0gYFske2VudHJ5LnR5cGUudG9VcHBlckNhc2UoKX1dXFxuYDtcbiAgICAgIG91dHB1dCArPSByZXBlYXQoJy0nLCBlbnRyeS50eXBlLmxlbmd0aCArIDIpICsgJ1xcbic7XG5cbiAgICAgIGxldCB0YWIgPSAnICAnO1xuICAgICAgZW50cnkuZW50cmllcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgY29uc3QgaXNEZWZhdWx0ID0gdHlwZW9mIGVudHJ5LnZhbHVlICE9PSAnbnVtYmVyJztcbiAgICAgICAgY29uc3QgdmFsdWUgPSBlbnRyeS52YWx1ZTtcbiAgICAgICAgaWYgKCFpc0RlZmF1bHQgfHwgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICBvdXRwdXQgKz0gYCR7dGFifVske2VudHJ5LmJpbmRpbmd9XSA9IFxcYCR7dmFsdWV9XFxgYDtcbiAgICAgICAgICBvdXRwdXQgKz0gJ1xcbic7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgb3V0cHV0ICs9ICdcXG4nO1xuICAgIH0pO1xuXG4gICAgLyogdHNsaW50OmRpc2FibGUgKi9cbiAgICBjb25zb2xlLmxvZyhvdXRwdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50cyBhIGRldGFpbGVkIHRhYmxlIG9mIHRoZSBlbnRpcmUgc3R5bGluZyBjb250ZXh0LlxuICAgKi9cbiAgcHJpbnRUYWJsZSgpOiB2b2lkIHtcbiAgICAvLyBJRSAobm90IEVkZ2UpIGlzIHRoZSBvbmx5IGJyb3dzZXIgdGhhdCBkb2Vzbid0IHN1cHBvcnQgdGhpcyBmZWF0dXJlLiBCZWNhdXNlXG4gICAgLy8gdGhlc2UgZGVidWdnaW5nIHRvb2xzIGFyZSBub3QgYXBhcnQgb2YgdGhlIGNvcmUgb2YgQW5ndWxhciAodGhleSBhcmUganVzdFxuICAgIC8vIGV4dHJhIHRvb2xzKSB3ZSBjYW4gc2tpcC1vdXQgb24gb2xkZXIgYnJvd3NlcnMuXG4gICAgaWYgKCFjb25zb2xlLnRhYmxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgZmVhdHVyZSBpcyBub3Qgc3VwcG9ydGVkIGluIHlvdXIgYnJvd3NlcicpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdGFibGU6IGFueVtdID0gW107XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuICAgIGNvbnN0IHRvdGFsUHJvcHMgPSBNYXRoLmZsb29yKGNvbnRleHQubGVuZ3RoIC8gaXRlbXNQZXJSb3cpO1xuXG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgaXNNYXBCYXNlZCA9IHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG4gICAgICBjb25zdCBlbnRyeToge1trZXk6IHN0cmluZ106IGFueX0gPSB7XG4gICAgICAgIHByb3AsXG4gICAgICAgICd0cGwgbWFzayc6IGdlbmVyYXRlQml0U3RyaW5nKGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSksIGlzTWFwQmFzZWQsIHRvdGFsUHJvcHMpLFxuICAgICAgICAnaG9zdCBtYXNrJzogZ2VuZXJhdGVCaXRTdHJpbmcoZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpLCBpc01hcEJhc2VkLCB0b3RhbFByb3BzKSxcbiAgICAgIH07XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZ2V0VHlwZUZyb21Db2x1bW4oaiwgdG90YWxDb2x1bW5zKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgaik7XG4gICAgICAgIGVudHJ5W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgaSArPSBpdGVtc1BlclJvdztcbiAgICAgIHRhYmxlLnB1c2goZW50cnkpO1xuICAgIH1cblxuICAgIC8qIHRzbGludDpkaXNhYmxlICovXG4gICAgY29uc29sZS50YWJsZSh0YWJsZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVCaXRTdHJpbmcodmFsdWU6IG51bWJlciwgaXNNYXBCYXNlZDogYm9vbGVhbiwgdG90YWxQcm9wczogbnVtYmVyKSB7XG4gIGlmIChpc01hcEJhc2VkIHx8IHZhbHVlID4gMSkge1xuICAgIHJldHVybiBgMGIke2xlZnRQYWQodmFsdWUudG9TdHJpbmcoMiksIHRvdGFsUHJvcHMsICcwJyl9YDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbGVmdFBhZCh2YWx1ZTogc3RyaW5nLCBtYXg6IG51bWJlciwgcGFkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHJlcGVhdChwYWQsIG1heCAtIHZhbHVlLmxlbmd0aCkgKyB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0VHlwZUZyb21Db2x1bW4oaW5kZXg6IG51bWJlciwgdG90YWxDb2x1bW5zOiBudW1iZXIpIHtcbiAgaWYgKGluZGV4ID09PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpIHtcbiAgICByZXR1cm4gJ3RlbXBsYXRlJztcbiAgfSBlbHNlIGlmIChpbmRleCA9PT0gdG90YWxDb2x1bW5zIC0gMSkge1xuICAgIHJldHVybiAnZGVmYXVsdHMnO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgZGlyICMke2luZGV4fWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwZWF0KGM6IHN0cmluZywgdGltZXM6IG51bWJlcikge1xuICBsZXQgcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRpbWVzOyBpKyspIHtcbiAgICBzICs9IGM7XG4gIH1cbiAgcmV0dXJuIHM7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZVN0eWxpbmdEZWJ1ZyBpbXBsZW1lbnRzIERlYnVnTm9kZVN0eWxpbmcge1xuICBwcml2YXRlIF9zYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfZGVidWdDb250ZXh0OiBEZWJ1Z1N0eWxpbmdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0fERlYnVnU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX3ROb2RlOiBUU3R5bGluZ05vZGUsXG4gICAgICBwcml2YXRlIF9kYXRhOiBMU3R5bGluZ0RhdGEsIHByaXZhdGUgX2lzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQoY29udGV4dCkgP1xuICAgICAgICBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQsIF90Tm9kZSwgX2lzQ2xhc3NCYXNlZCkgOlxuICAgICAgICAoY29udGV4dCBhcyBEZWJ1Z1N0eWxpbmdDb250ZXh0KTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0OyB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXMuXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKSB7IHRoaXMuX3Nhbml0aXplciA9IHNhbml0aXplcjsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQgYW5kXG4gICAqIHdoYXQgdGhlaXIgcnVudGltZSByZXByZXNlbnRhdGlvbiBpcy5cbiAgICpcbiAgICogU2VlIGBMU3R5bGluZ1N1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IHN1bW1hcnkoKToge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9ID0ge307XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gdGhpcy5faXNDbGFzc0Jhc2VkO1xuXG4gICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgLy8gdGhlIGRpcmVjdCBwYXNzIGNvZGUgZG9lc24ndCBjb252ZXJ0IFtzdHlsZV0gb3IgW2NsYXNzXSB2YWx1ZXNcbiAgICAvLyBpbnRvIFN0eWxpbmdNYXBBcnJheSBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiwgdGhlIHZhbHVlc1xuICAgIC8vIG5lZWQgdG8gYmUgY29udmVydGVkIGFoZWFkIG9mIHRpbWUgc2luY2UgdGhlIHN0eWxpbmcgZGVidWdcbiAgICAvLyByZWxpZXMgb24gY29udGV4dCByZXNvbHV0aW9uIHRvIGZpZ3VyZSBvdXQgd2hhdCBzdHlsaW5nXG4gICAgLy8gdmFsdWVzIGhhdmUgYmVlbiBhZGRlZC9yZW1vdmVkIG9uIHRoZSBlbGVtZW50LlxuICAgIGlmIChjb25maWcuYWxsb3dEaXJlY3RTdHlsaW5nICYmIGNvbmZpZy5oYXNNYXBCaW5kaW5ncykge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KFtdKTsgIC8vIG1ha2UgYSBjb3B5XG4gICAgICB0aGlzLl9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWFwVmFsdWVzKGRhdGEsIChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcblxuICAgIC8vIGJlY2F1c2UgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHJ1bnMgaW50byB0d28gZGlmZmVyZW50XG4gICAgLy8gbW9kZXM6IGRpcmVjdCBhbmQgY29udGV4dC1yZXNvbHV0aW9uLCB0aGUgb3V0cHV0IG9mIHRoZSBlbnRyaWVzXG4gICAgLy8gb2JqZWN0IGlzIGRpZmZlcmVudCBiZWNhdXNlIHRoZSByZW1vdmVkIHZhbHVlcyBhcmUgbm90XG4gICAgLy8gc2F2ZWQgYmV0d2VlbiB1cGRhdGVzLiBGb3IgdGhpcyByZWFzb24gYSBwcm94eSBpcyBjcmVhdGVkXG4gICAgLy8gc28gdGhhdCB0aGUgYmVoYXZpb3IgaXMgdGhlIHNhbWUgd2hlbiBleGFtaW5pbmcgdmFsdWVzXG4gICAgLy8gdGhhdCBhcmUgbm8gbG9uZ2VyIGFjdGl2ZSBvbiB0aGUgZWxlbWVudC5cbiAgICByZXR1cm4gY3JlYXRlUHJveHkoe1xuICAgICAgZ2V0KHRhcmdldDoge30sIHByb3A6IHN0cmluZyk6IERlYnVnTm9kZVN0eWxpbmdFbnRyeXtcbiAgICAgICAgbGV0IHZhbHVlOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnkgPSBlbnRyaWVzW3Byb3BdOyBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgdmFsdWUgPSB7XG4gICAgICAgICAgICBwcm9wLFxuICAgICAgICAgICAgdmFsdWU6IGlzQ2xhc3NCYXNlZCA/IGZhbHNlIDogbnVsbCxcbiAgICAgICAgICAgIGJpbmRpbmdJbmRleDogbnVsbCxcbiAgICAgICAgICB9O1xuICAgICAgICB9IHJldHVybiB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBzZXQodGFyZ2V0OiB7fSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7IHJldHVybiBmYWxzZTsgfSxcbiAgICAgIG93bktleXMoKSB7IHJldHVybiBPYmplY3Qua2V5cyhlbnRyaWVzKTsgfSxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihrOiBhbnkpIHtcbiAgICAgICAgLy8gd2UgdXNlIGEgc3BlY2lhbCBwcm9wZXJ0eSBkZXNjcmlwdG9yIGhlcmUgc28gdGhhdCBlbnVtZXJhdGlvbiBvcGVyYXRpb25zXG4gICAgICAgIC8vIHN1Y2ggYXMgYE9iamVjdC5rZXlzYCB3aWxsIHdvcmsgb24gdGhpcyBwcm94eS5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBnZXQgY29uZmlnKCkgeyByZXR1cm4gYnVpbGRDb25maWcodGhpcy5fdE5vZGUsIHRoaXMuX2lzQ2xhc3NCYXNlZCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGtleS92YWx1ZSBtYXAgb2YgYWxsIHRoZSBzdHlsZXMvY2xhc3NlcyB0aGF0IHdlcmUgbGFzdCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IHZhbHVlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAvLyB0aGUgZGlyZWN0IHBhc3MgY29kZSBkb2Vzbid0IGNvbnZlcnQgW3N0eWxlXSBvciBbY2xhc3NdIHZhbHVlc1xuICAgIC8vIGludG8gU3R5bGluZ01hcEFycmF5IGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uLCB0aGUgdmFsdWVzXG4gICAgLy8gbmVlZCB0byBiZSBjb252ZXJ0ZWQgYWhlYWQgb2YgdGltZSBzaW5jZSB0aGUgc3R5bGluZyBkZWJ1Z1xuICAgIC8vIHJlbGllcyBvbiBjb250ZXh0IHJlc29sdXRpb24gdG8gZmlndXJlIG91dCB3aGF0IHN0eWxpbmdcbiAgICAvLyB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkL3JlbW92ZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGNvbmZpZy5hbGxvd0RpcmVjdFN0eWxpbmcgJiYgY29uZmlnLmhhc01hcEJpbmRpbmdzKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQoW10pOyAgLy8gbWFrZSBhIGNvcHlcbiAgICAgIHRoaXMuX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tYXBWYWx1ZXMoZGF0YSwgKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgPT4geyBlbnRyaWVzW3Byb3BdID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGE6IExTdHlsaW5nRGF0YSkge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQuY29udGV4dDtcbiAgICBjb25zdCBsaW1pdCA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQsIHRoaXMuX3ROb2RlLCB0aGlzLl9pc0NsYXNzQmFzZWQpO1xuICAgIGZvciAobGV0IGkgPVxuICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgICAgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlID0gYmluZGluZ0luZGV4ICE9PSAwID8gZ2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4KSA6IG51bGw7XG4gICAgICBpZiAoYmluZGluZ1ZhbHVlICYmICFBcnJheS5pc0FycmF5KGJpbmRpbmdWYWx1ZSkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGluZ01hcEFycmF5ID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAobnVsbCwgYmluZGluZ1ZhbHVlLCAhdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyYXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhcbiAgICAgIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIGZuOiAocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcbiAgICBjb25zdCBtYXBCaW5kaW5nc0ZsYWcgPVxuICAgICAgICB0aGlzLl9pc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzTWFwQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3M7XG4gICAgY29uc3QgaGFzTWFwcyA9IGhhc0NvbmZpZyh0aGlzLl90Tm9kZSwgbWFwQmluZGluZ3NGbGFnKTtcbiAgICBpZiAoaGFzTWFwcykge1xuICAgICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IG1hcEZuOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgICAgIChyZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgIGJpbmRpbmdJbmRleD86IG51bWJlciB8IG51bGwpID0+IGZuKHByb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXggfHwgbnVsbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyBudWxsIDogKHRoaXMuX3Nhbml0aXplciB8fCBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSk7XG5cbiAgICAvLyBydW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbnRleHQsIHRoaXMuX3ROb2RlLCBudWxsLCBtb2NrRWxlbWVudCwgZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgZmFsc2UsXG4gICAgICAgIHRoaXMuX2lzQ2xhc3NCYXNlZCk7XG5cbiAgICAvLyBhbmQgYWxzbyB0aGUgaG9zdCBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCB0aGlzLl90Tm9kZSwgbnVsbCwgbW9ja0VsZW1lbnQsIGRhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIHRydWUsXG4gICAgICAgIHRoaXMuX2lzQ2xhc3NCYXNlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRDb25maWcodE5vZGU6IFRTdHlsaW5nTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogRGVidWdTdHlsaW5nQ29uZmlnIHtcbiAgY29uc3QgaGFzTWFwQmluZGluZ3MgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSwgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc01hcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZU1hcEJpbmRpbmdzKTtcbiAgY29uc3QgaGFzUHJvcEJpbmRpbmdzID0gaGFzQ29uZmlnKFxuICAgICAgdE5vZGUsIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NQcm9wQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlUHJvcEJpbmRpbmdzKTtcbiAgY29uc3QgaGFzQ29sbGlzaW9ucyA9IGhhc0NvbmZpZyhcbiAgICAgIHROb2RlLFxuICAgICAgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNEdXBsaWNhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNEdXBsaWNhdGVTdHlsZUJpbmRpbmdzKTtcbiAgY29uc3QgaGFzVGVtcGxhdGVCaW5kaW5ncyA9IGhhc0NvbmZpZyhcbiAgICAgIHROb2RlLFxuICAgICAgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNUZW1wbGF0ZUNsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1RlbXBsYXRlU3R5bGVCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0hvc3RCaW5kaW5ncyA9IGhhc0NvbmZpZyhcbiAgICAgIHROb2RlLCBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0hvc3RDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNIb3N0U3R5bGVCaW5kaW5ncyk7XG5cbiAgLy8gYGZpcnN0VGVtcGxhdGVQYXNzYCBoZXJlIGlzIGZhbHNlIGJlY2F1c2UgdGhlIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBjb25zdHJ1Y3RlZFxuICAvLyBkaXJlY3RseSB3aXRoaW4gdGhlIGJlaGF2aW9yIG9mIHRoZSBkZWJ1Z2dpbmcgdG9vbHMgKG91dHNpZGUgb2Ygc3R5bGUvY2xhc3MgZGVidWdnaW5nLFxuICAvLyB0aGUgY29udGV4dCBpcyBjb25zdHJ1Y3RlZCBkdXJpbmcgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MpLlxuICBjb25zdCBhbGxvd0RpcmVjdFN0eWxpbmcgPSBfYWxsb3dEaXJlY3RTdHlsaW5nKHROb2RlLCBpc0NsYXNzQmFzZWQsIGZhbHNlKTtcbiAgcmV0dXJuIHtcbiAgICAgIGhhc01hcEJpbmRpbmdzLCAgICAgICAvL1xuICAgICAgaGFzUHJvcEJpbmRpbmdzLCAgICAgIC8vXG4gICAgICBoYXNDb2xsaXNpb25zLCAgICAgICAgLy9cbiAgICAgIGhhc1RlbXBsYXRlQmluZGluZ3MsICAvL1xuICAgICAgaGFzSG9zdEJpbmRpbmdzLCAgICAgIC8vXG4gICAgICBhbGxvd0RpcmVjdFN0eWxpbmcsICAgLy9cbiAgfTtcbn1cblxuXG4vKipcbiAqIEZpbmQgdGhlIGhlYWQgb2YgdGhlIHN0eWxpbmcgYmluZGluZyBsaW5rZWQgbGlzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdCaW5kaW5nSGVhZCh0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgaXNDbGFzc0JpbmRpbmc6IGJvb2xlYW4pOiBudW1iZXIge1xuICBsZXQgaW5kZXggPSBnZXRUU3R5bGluZ1JhbmdlUHJldihpc0NsYXNzQmluZGluZyA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzKTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCB0U3R5bGluZ1JhbmdlID0gdERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGNvbnN0IHByZXYgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGluZ1JhbmdlKTtcbiAgICBpZiAocHJldiA9PT0gMCkge1xuICAgICAgLy8gZm91bmQgaGVhZCBleGl0LlxuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmRleCA9IHByZXY7XG4gICAgfVxuICB9XG59Il19