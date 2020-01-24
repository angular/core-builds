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
            return entries;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVdBLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUUsa0JBQWtCLElBQUksbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTVVLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNsRCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQXFJL0Q7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLE9BQXdCLEVBQUUsS0FBbUIsRUFBRSxZQUFxQjtJQUN0RSxJQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDckUsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0g7SUFDRSw4QkFDb0IsT0FBd0IsRUFBVSxNQUFvQixFQUM5RCxhQUFzQjtRQURkLFlBQU8sR0FBUCxPQUFPLENBQWlCO1FBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBYztRQUM5RCxrQkFBYSxHQUFiLGFBQWEsQ0FBUztJQUFHLENBQUM7SUFFdEMsc0JBQUksd0NBQU07YUFBVixjQUFtQyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBT3pGLHNCQUFJLHlDQUFPO1FBTFg7Ozs7V0FJRzthQUNIO1lBQ0UsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUM3QixJQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsSUFBTSxPQUFPLEdBQStDLEVBQUUsQ0FBQztZQUMvRCxJQUFNLEtBQUssR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbkYsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ2QsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRTtnQkFDekIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakMsSUFBTSxlQUFlLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hELElBQU0sbUJBQW1CLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNELElBQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQU0sb0JBQW9CLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxJQUFNLHFCQUFxQixHQUFHLENBQUMsOEJBQTJDLENBQUM7Z0JBRTNFLElBQU0sT0FBTyxHQUErQixFQUFFLENBQUM7Z0JBRS9DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3JDLElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQTJCLENBQUM7b0JBQ2xGLElBQUksWUFBWSxLQUFLLENBQUMsRUFBRTt3QkFDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDNUI7aUJBQ0Y7Z0JBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHO29CQUNkLElBQUksTUFBQTtvQkFDSixlQUFlLGlCQUFBO29CQUNmLG1CQUFtQixxQkFBQTtvQkFDbkIsb0JBQW9CLHNCQUFBO29CQUNwQixXQUFXLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxZQUFZLGNBQUEsRUFBRSxPQUFPLFNBQUE7aUJBQ25ELENBQUM7Z0JBRUYsQ0FBQyxJQUFJLDhCQUEyQyxZQUFZLENBQUM7YUFDOUQ7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDOzs7T0FBQTtJQUVEOzs7T0FHRztJQUNILDJDQUFZLEdBQVo7UUFDRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFFbEIsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN0RCxJQUFNLGdCQUFnQixHQUdoQixFQUFFLENBQUM7UUFFVCxJQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0MsSUFBTSxXQUFXLEdBQUcsOEJBQTJDLFlBQVksQ0FBQztRQUU1RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLElBQU0sZUFBZSxHQUFHLENBQUMsS0FBSyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLElBQU0sZ0JBQWdCLEdBQUcsQ0FBQyxLQUFLLHdCQUF3QixDQUFDO1lBQ3hELElBQU0sSUFBSSxHQUFHLGlCQUFpQixDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNoRCxJQUFNLE9BQU8sR0FBMkUsRUFBRSxDQUFDO1lBRTNGLElBQUksQ0FBQyw4QkFBMkMsQ0FBQztZQUNqRCxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFO2dCQUN6QixJQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxlQUFlLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtvQkFDaEMsSUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDM0QsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBZSxDQUFDO29CQUM1RCxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNqQyxJQUFNLFVBQVUsR0FBRyxJQUFJLEtBQUsseUJBQXlCLENBQUM7b0JBQ3RELElBQU0sT0FBTyxHQUFHLEtBQUcsTUFBTSxJQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFFLENBQUM7b0JBQzNELE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLFNBQUEsRUFBRSxLQUFLLE9BQUEsRUFBRSxZQUFZLGNBQUEsRUFBRSxPQUFPLFNBQUEsRUFBQyxDQUFDLENBQUM7aUJBQ3ZEO2dCQUNELENBQUMsSUFBSSxXQUFXLENBQUM7YUFDbEI7WUFFRCxnQkFBZ0IsQ0FBQyxJQUFJLENBQ2pCLEVBQUMsSUFBSSxNQUFBLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsWUFBWSxFQUEvQixDQUErQixDQUFDLEVBQUMsQ0FBQyxDQUFDO1NBQy9FO1FBRUQsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSztZQUM1QixNQUFNLElBQUksTUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFLLENBQUM7WUFDNUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBRXBELElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztZQUNmLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSztnQkFDekIsSUFBTSxTQUFTLEdBQUcsT0FBTyxLQUFLLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQztnQkFDbEQsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO29CQUNoQyxNQUFNLElBQU8sR0FBRyxTQUFJLEtBQUssQ0FBQyxPQUFPLGFBQVMsS0FBSyxNQUFJLENBQUM7b0JBQ3BELE1BQU0sSUFBSSxJQUFJLENBQUM7aUJBQ2hCO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLElBQUksSUFBSSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsb0JBQW9CO1FBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gseUNBQVUsR0FBVjtRQUNFLCtFQUErRTtRQUMvRSw0RUFBNEU7UUFDNUUsa0RBQWtEO1FBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztTQUNsRTtRQUVELElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDN0IsSUFBTSxLQUFLLEdBQVUsRUFBRSxDQUFDO1FBQ3hCLElBQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxJQUFNLFdBQVcsR0FBRyw4QkFBMkMsWUFBWSxDQUFDO1FBQzVFLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQztRQUU1RCxJQUFJLENBQUMsOEJBQTJDLENBQUM7UUFDakQsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUN6QixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLElBQU0sVUFBVSxHQUFHLElBQUksS0FBSyx5QkFBeUIsQ0FBQztZQUN0RCxJQUFNLEtBQUssR0FBeUI7Z0JBQ2xDLElBQUksTUFBQTtnQkFDSixVQUFVLEVBQUUsaUJBQWlCLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQztnQkFDdEYsV0FBVyxFQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUM7YUFDdkYsQ0FBQztZQUVGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3JDLElBQU0sR0FBRyxHQUFHLGlCQUFpQixDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDL0MsSUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7YUFDcEI7WUFFRCxDQUFDLElBQUksV0FBVyxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbkI7UUFFRCxvQkFBb0I7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBQ0gsMkJBQUM7QUFBRCxDQUFDLEFBckpELElBcUpDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFhLEVBQUUsVUFBbUIsRUFBRSxVQUFrQjtJQUMvRSxJQUFJLFVBQVUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQzNCLE9BQU8sT0FBSyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFHLENBQUM7S0FDM0Q7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxLQUFhLEVBQUUsR0FBVyxFQUFFLEdBQVc7SUFDdEQsT0FBTyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ2pELENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQWEsRUFBRSxZQUFvQjtJQUM1RCxJQUFJLEtBQUssS0FBSyx3QkFBd0IsRUFBRTtRQUN0QyxPQUFPLFVBQVUsQ0FBQztLQUNuQjtTQUFNLElBQUksS0FBSyxLQUFLLFlBQVksR0FBRyxDQUFDLEVBQUU7UUFDckMsT0FBTyxVQUFVLENBQUM7S0FDbkI7U0FBTTtRQUNMLE9BQU8sVUFBUSxLQUFPLENBQUM7S0FDeEI7QUFDSCxDQUFDO0FBRUQsU0FBUyxNQUFNLENBQUMsQ0FBUyxFQUFFLEtBQWE7SUFDdEMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ1gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM5QixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ1I7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNIO0lBSUUsMEJBQ0ksT0FBNEMsRUFBVSxNQUFvQixFQUNsRSxLQUFtQixFQUFVLGFBQXNCO1FBREwsV0FBTSxHQUFOLE1BQU0sQ0FBYztRQUNsRSxVQUFLLEdBQUwsS0FBSyxDQUFjO1FBQVUsa0JBQWEsR0FBYixhQUFhLENBQVM7UUFMdkQsZUFBVSxHQUF5QixJQUFJLENBQUM7UUFNOUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzVDLElBQUksb0JBQW9CLENBQUMsT0FBMEIsRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUM1RSxPQUErQixDQUFDO0lBQ3ZDLENBQUM7SUFFRCxzQkFBSSxxQ0FBTzthQUFYLGNBQWdCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRTVDOztPQUVHO0lBQ0gsNENBQWlCLEdBQWpCLFVBQWtCLFNBQStCLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBUW5GLHNCQUFJLHFDQUFPO1FBTlg7Ozs7O1dBS0c7YUFDSDtZQUNFLElBQU0sT0FBTyxHQUEyQyxFQUFFLENBQUM7WUFDM0QsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUUzQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBRXRCLGlFQUFpRTtZQUNqRSw4REFBOEQ7WUFDOUQsNkRBQTZEO1lBQzdELDBEQUEwRDtZQUMxRCxpREFBaUQ7WUFDakQsSUFBSSxNQUFNLENBQUMsa0JBQWtCLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRTtnQkFDdEQsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxjQUFjO2dCQUN2QyxJQUFJLENBQUMscUNBQXFDLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEQ7WUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFDLElBQVksRUFBRSxLQUFVLEVBQUUsWUFBMkI7Z0JBQzFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDLElBQUksTUFBQSxFQUFFLEtBQUssT0FBQSxFQUFFLFlBQVksY0FBQSxFQUFDLENBQUM7WUFDOUMsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDOzs7T0FBQTtJQUVELHNCQUFJLG9DQUFNO2FBQVYsY0FBZSxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBS3JFLHNCQUFJLG9DQUFNO1FBSFY7O1dBRUc7YUFDSDtZQUNFLElBQU0sT0FBTyxHQUF5QixFQUFFLENBQUM7WUFDekMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUMzQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBRXRCLGlFQUFpRTtZQUNqRSw4REFBOEQ7WUFDOUQsNkRBQTZEO1lBQzdELDBEQUEwRDtZQUMxRCxpREFBaUQ7WUFDakQsSUFBSSxNQUFNLENBQUMsa0JBQWtCLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRTtnQkFDdEQsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBRSxjQUFjO2dCQUN2QyxJQUFJLENBQUMscUNBQXFDLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEQ7WUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxVQUFDLElBQVksRUFBRSxLQUFVLElBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUM7OztPQUFBO0lBRU8sZ0VBQXFDLEdBQTdDLFVBQThDLElBQWtCO1FBQzlELElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3JDLElBQU0sS0FBSyxHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRixLQUFLLElBQUksQ0FBQyxHQUNELHlEQUFtRixFQUN2RixDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ25CLElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQVcsQ0FBQztZQUMxQyxJQUFNLFlBQVksR0FBRyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDOUUsSUFBSSxZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUNoRCxJQUFNLGVBQWUsR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN6RixRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQzthQUMvQztTQUNGO0lBQ0gsQ0FBQztJQUVPLHFDQUFVLEdBQWxCLFVBQ0ksSUFBa0IsRUFDbEIsRUFBd0U7UUFDMUUsMkRBQTJEO1FBQzNELDhEQUE4RDtRQUM5RCwrREFBK0Q7UUFDL0QsSUFBTSxXQUFXLEdBQUcsRUFBUyxDQUFDO1FBQzlCLElBQU0sZUFBZSxHQUNqQixJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsK0JBQWdDLENBQUMsZ0NBQStCLENBQUM7UUFDekYsSUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDeEQsSUFBSSxPQUFPLEVBQUU7WUFDWCx5QkFBeUIsRUFBRSxDQUFDO1NBQzdCO1FBRUQsSUFBTSxLQUFLLEdBQ1AsVUFBQyxRQUFhLEVBQUUsT0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBb0IsRUFDcEUsWUFBNEIsSUFBSyxPQUFBLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFlBQVksSUFBSSxJQUFJLENBQUMsRUFBckMsQ0FBcUMsQ0FBQztRQUU1RSxJQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSx3QkFBd0IsRUFBRSxDQUFDLENBQUM7UUFFOUYsNEJBQTRCO1FBQzVCLHNCQUFzQixDQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFDekYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXhCLDZCQUE2QjtRQUM3QixzQkFBc0IsQ0FDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQ3hGLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0gsdUJBQUM7QUFBRCxDQUFDLEFBckhELElBcUhDOztBQUVELFNBQVMsV0FBVyxDQUFDLEtBQW1CLEVBQUUsWUFBcUI7SUFDN0QsSUFBTSxjQUFjLEdBQUcsU0FBUyxDQUM1QixLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUMsK0JBQWdDLENBQUMsZ0NBQStCLENBQUMsQ0FBQztJQUMzRixJQUFNLGVBQWUsR0FBRyxTQUFTLENBQzdCLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxpQ0FBZ0MsQ0FBQyxDQUFDO0lBQzdGLElBQU0sYUFBYSxHQUFHLFNBQVMsQ0FDM0IsS0FBSyxFQUNMLFlBQVksQ0FBQyxDQUFDLHNDQUFzQyxDQUFDLHVDQUFxQyxDQUFDLENBQUM7SUFDaEcsSUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQ2pDLEtBQUssRUFDTCxZQUFZLENBQUMsQ0FBQyxxQ0FBcUMsQ0FBQyxxQ0FBb0MsQ0FBQyxDQUFDO0lBQzlGLElBQU0sZUFBZSxHQUFHLFNBQVMsQ0FDN0IsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLGtDQUFnQyxDQUFDLENBQUM7SUFFN0YscUZBQXFGO0lBQ3JGLHlGQUF5RjtJQUN6Riw4REFBOEQ7SUFDOUQsSUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNFLE9BQU87UUFDSCxjQUFjLGdCQUFBO1FBQ2QsZUFBZSxpQkFBQTtRQUNmLGFBQWEsZUFBQTtRQUNiLG1CQUFtQixxQkFBQTtRQUNuQixlQUFlLGlCQUFBO1FBQ2Ysa0JBQWtCLG9CQUFBO0tBQ3JCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Z2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2F0dGFjaERlYnVnT2JqZWN0fSBmcm9tICcuLi91dGlsL2RlYnVnX3V0aWxzJztcbmltcG9ydCB7TUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBhbGxvd0RpcmVjdFN0eWxpbmcgYXMgX2FsbG93RGlyZWN0U3R5bGluZywgZ2V0QmluZGluZ1ZhbHVlLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaGFzQ29uZmlnLCBpc1Nhbml0aXphdGlvblJlcXVpcmVkLCBpc1N0eWxpbmdDb250ZXh0LCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgc2V0VmFsdWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7YXBwbHlTdHlsaW5nVmlhQ29udGV4dH0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge2FjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmV9IGZyb20gJy4vbWFwX2Jhc2VkX2JpbmRpbmdzJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgZGVidWcgZnVuY3Rpb25hbGl0eSBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIEEgZGVidWctZnJpZW5kbHkgdmVyc2lvbiBvZiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBBbiBpbnN0YW5jZSBvZiB0aGlzIGlzIGF0dGFjaGVkIHRvIGB0U3R5bGluZ0NvbnRleHQuZGVidWdgIHdoZW4gYG5nRGV2TW9kZWAgaXMgYWN0aXZlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbnRleHQge1xuICAvKiogVGhlIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3Mgb2YgdGhlIGFzc29jaWF0ZWQgYFRTdHlsaW5nQ29udGV4dGAgKi9cbiAgY29uZmlnOiBEZWJ1Z1N0eWxpbmdDb25maWc7XG5cbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqIFRoZSBhc3NvY2lhdGVkIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBlbnRyaWVzOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX07XG5cbiAgLyoqIEEgc3RhdHVzIHJlcG9ydCBvZiBhbGwgdGhlIHNvdXJjZXMgd2l0aGluIHRoZSBjb250ZXh0ICovXG4gIHByaW50U291cmNlcygpOiB2b2lkO1xuXG4gIC8qKiBBIHN0YXR1cyByZXBvcnQgb2YgYWxsIHRoZSBlbnRpcmUgY29udGV4dCBhcyBhIHRhYmxlICovXG4gIHByaW50VGFibGUoKTogdm9pZDtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGluZm9ybWF0aW9uIGluIGBUTm9kZS5mbGFnc2AuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29uZmlnIHtcbiAgaGFzTWFwQmluZGluZ3M6IGJvb2xlYW47ICAgICAgIC8vXG4gIGhhc1Byb3BCaW5kaW5nczogYm9vbGVhbjsgICAgICAvL1xuICBoYXNDb2xsaXNpb25zOiBib29sZWFuOyAgICAgICAgLy9cbiAgaGFzVGVtcGxhdGVCaW5kaW5nczogYm9vbGVhbjsgIC8vXG4gIGhhc0hvc3RCaW5kaW5nczogYm9vbGVhbjsgICAgICAvL1xuICBhbGxvd0RpcmVjdFN0eWxpbmc6IGJvb2xlYW47ICAgLy9cbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5IHtcbiAgLyoqIFRoZSBwcm9wZXJ0eSAoc3R5bGUgb3IgY2xhc3MgcHJvcGVydHkpIHRoYXQgdGhpcyBlbnRyeSByZXByZXNlbnRzICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIGVudHJpZXMgYSBwYXJ0IG9mIHRoaXMgZW50cnkgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IHRlbXBsYXRlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgdGVtcGxhdGVCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSBob3N0IHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgaG9zdEJpbmRpbmdzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgcmVxdWlyZXMgc2FuaXRpemF0aW9uXG4gICAqL1xuICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeVxuICAgKi9cbiAgZGVmYXVsdFZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGwgYmluZGluZ0luZGV4IHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBzdHlsZVxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZyB7XG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBkZWJ1ZyBjb250ZXh0IG9mIHRoZSBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dFxuICAgKi9cbiAgc3VtbWFyeToge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX07XG5cbiAgLyoqXG4gICAqIEEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgc3R5bGluZyBwcm9wZXJ0aWVzIGFuZCB0aGVpclxuICAgKiBydW50aW1lIHZhbHVlc1xuICAgKi9cbiAgdmFsdWVzOiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKTogdm9pZDtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmdFbnRyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqIFRoZSBiaW5kaW5nIGluZGV4IG9mIHRoZSBsYXN0IGFwcGxpZWQgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICBhdHRhY2hEZWJ1Z09iamVjdChjb250ZXh0LCBkZWJ1Zyk7XG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IHdpdGhpbiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5jbGFzcyBUU3R5bGluZ0NvbnRleHREZWJ1ZyBpbXBsZW1lbnRzIERlYnVnU3R5bGluZ0NvbnRleHQge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX3ROb2RlOiBUU3R5bGluZ05vZGUsXG4gICAgICBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHt9XG5cbiAgZ2V0IGNvbmZpZygpOiBEZWJ1Z1N0eWxpbmdDb25maWcgeyByZXR1cm4gYnVpbGRDb25maWcodGhpcy5fdE5vZGUsIHRoaXMuX2lzQ2xhc3NCYXNlZCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeWAuXG4gICAqL1xuICBnZXQgZW50cmllcygpOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0LCB0aGlzLl90Tm9kZSwgdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICBsZXQgaSA9IHN0YXJ0O1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgdGVtcGxhdGVCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc0JpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcblxuICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2JpbmRpbmdzU3RhcnRQb3NpdGlvbiArIGpdIGFzIG51bWJlciB8IHN0cmluZyB8IG51bGw7XG4gICAgICAgIGlmIChiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBzb3VyY2VzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlbnRyaWVzW3Byb3BdID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICB0ZW1wbGF0ZUJpdE1hc2ssXG4gICAgICAgIGhvc3RCaW5kaW5nc0JpdE1hc2ssXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkLFxuICAgICAgICB2YWx1ZXNDb3VudDogc291cmNlcy5sZW5ndGgsIGRlZmF1bHRWYWx1ZSwgc291cmNlcyxcbiAgICAgIH07XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgc291cmNlIGdyb3VwZWQgdG9nZXRoZXIgd2l0aCBlYWNoIGJpbmRpbmcgaW5kZXggaW5cbiAgICogdGhlIGNvbnRleHQuXG4gICAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZCB7XG4gICAgbGV0IG91dHB1dCA9ICdcXG4nO1xuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyAnY2xhc3MnIDogJ3N0eWxlJztcbiAgICBjb25zdCBiaW5kaW5nc0J5U291cmNlOiB7XG4gICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICBlbnRyaWVzOiB7YmluZGluZzogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSwgYml0TWFzazogbnVtYmVyfVtdXG4gICAgfVtdID0gW107XG5cbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQ29sdW1uczsgaSsrKSB7XG4gICAgICBjb25zdCBpc0RlZmF1bHRDb2x1bW4gPSBpID09PSB0b3RhbENvbHVtbnMgLSAxO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGkgIT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbiAgICAgIGNvbnN0IHR5cGUgPSBnZXRUeXBlRnJvbUNvbHVtbihpLCB0b3RhbENvbHVtbnMpO1xuICAgICAgY29uc3QgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIsIGJpdE1hc2s6IG51bWJlcn1bXSA9IFtdO1xuXG4gICAgICBsZXQgaiA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgICB3aGlsZSAoaiA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGosIGkpO1xuICAgICAgICBpZiAoaXNEZWZhdWx0Q29sdW1uIHx8IHZhbHVlID4gMCkge1xuICAgICAgICAgIGNvbnN0IGJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaiwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gaXNEZWZhdWx0Q29sdW1uID8gLTEgOiB2YWx1ZSBhcyBudW1iZXI7XG4gICAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgaXNNYXBCYXNlZCA9IHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG4gICAgICAgICAgY29uc3QgYmluZGluZyA9IGAke3ByZWZpeH0ke2lzTWFwQmFzZWQgPyAnJyA6ICcuJyArIHByb3B9YDtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goe2JpbmRpbmcsIHZhbHVlLCBiaW5kaW5nSW5kZXgsIGJpdE1hc2t9KTtcbiAgICAgICAgfVxuICAgICAgICBqICs9IGl0ZW1zUGVyUm93O1xuICAgICAgfVxuXG4gICAgICBiaW5kaW5nc0J5U291cmNlLnB1c2goXG4gICAgICAgICAge3R5cGUsIGVudHJpZXM6IGVudHJpZXMuc29ydCgoYSwgYikgPT4gYS5iaW5kaW5nSW5kZXggLSBiLmJpbmRpbmdJbmRleCl9KTtcbiAgICB9XG5cbiAgICBiaW5kaW5nc0J5U291cmNlLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgb3V0cHV0ICs9IGBbJHtlbnRyeS50eXBlLnRvVXBwZXJDYXNlKCl9XVxcbmA7XG4gICAgICBvdXRwdXQgKz0gcmVwZWF0KCctJywgZW50cnkudHlwZS5sZW5ndGggKyAyKSArICdcXG4nO1xuXG4gICAgICBsZXQgdGFiID0gJyAgJztcbiAgICAgIGVudHJ5LmVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIGNvbnN0IGlzRGVmYXVsdCA9IHR5cGVvZiBlbnRyeS52YWx1ZSAhPT0gJ251bWJlcic7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZW50cnkudmFsdWU7XG4gICAgICAgIGlmICghaXNEZWZhdWx0IHx8IHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgb3V0cHV0ICs9IGAke3RhYn1bJHtlbnRyeS5iaW5kaW5nfV0gPSBcXGAke3ZhbHVlfVxcYGA7XG4gICAgICAgICAgb3V0cHV0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICB9KTtcblxuICAgIC8qIHRzbGludDpkaXNhYmxlICovXG4gICAgY29uc29sZS5sb2cob3V0cHV0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmludHMgYSBkZXRhaWxlZCB0YWJsZSBvZiB0aGUgZW50aXJlIHN0eWxpbmcgY29udGV4dC5cbiAgICovXG4gIHByaW50VGFibGUoKTogdm9pZCB7XG4gICAgLy8gSUUgKG5vdCBFZGdlKSBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgZG9lc24ndCBzdXBwb3J0IHRoaXMgZmVhdHVyZS4gQmVjYXVzZVxuICAgIC8vIHRoZXNlIGRlYnVnZ2luZyB0b29scyBhcmUgbm90IGFwYXJ0IG9mIHRoZSBjb3JlIG9mIEFuZ3VsYXIgKHRoZXkgYXJlIGp1c3RcbiAgICAvLyBleHRyYSB0b29scykgd2UgY2FuIHNraXAtb3V0IG9uIG9sZGVyIGJyb3dzZXJzLlxuICAgIGlmICghY29uc29sZS50YWJsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGZlYXR1cmUgaXMgbm90IHN1cHBvcnRlZCBpbiB5b3VyIGJyb3dzZXInKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRhYmxlOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICBjb25zdCB0b3RhbFByb3BzID0gTWF0aC5mbG9vcihjb250ZXh0Lmxlbmd0aCAvIGl0ZW1zUGVyUm93KTtcblxuICAgIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgY29uc3QgZW50cnk6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICAndHBsIG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpLCBpc01hcEJhc2VkLCB0b3RhbFByb3BzKSxcbiAgICAgICAgJ2hvc3QgbWFzayc6IGdlbmVyYXRlQml0U3RyaW5nKGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldFR5cGVGcm9tQ29sdW1uKGosIHRvdGFsQ29sdW1ucyk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopO1xuICAgICAgICBlbnRyeVtrZXldID0gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGkgKz0gaXRlbXNQZXJSb3c7XG4gICAgICB0YWJsZS5wdXNoKGVudHJ5KTtcbiAgICB9XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUudGFibGUodGFibGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQml0U3RyaW5nKHZhbHVlOiBudW1iZXIsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIHRvdGFsUHJvcHM6IG51bWJlcikge1xuICBpZiAoaXNNYXBCYXNlZCB8fCB2YWx1ZSA+IDEpIHtcbiAgICByZXR1cm4gYDBiJHtsZWZ0UGFkKHZhbHVlLnRvU3RyaW5nKDIpLCB0b3RhbFByb3BzLCAnMCcpfWA7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxlZnRQYWQodmFsdWU6IHN0cmluZywgbWF4OiBudW1iZXIsIHBhZDogc3RyaW5nKSB7XG4gIHJldHVybiByZXBlYXQocGFkLCBtYXggLSB2YWx1ZS5sZW5ndGgpICsgdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFR5cGVGcm9tQ29sdW1uKGluZGV4OiBudW1iZXIsIHRvdGFsQ29sdW1uczogbnVtYmVyKSB7XG4gIGlmIChpbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKSB7XG4gICAgcmV0dXJuICd0ZW1wbGF0ZSc7XG4gIH0gZWxzZSBpZiAoaW5kZXggPT09IHRvdGFsQ29sdW1ucyAtIDEpIHtcbiAgICByZXR1cm4gJ2RlZmF1bHRzJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYGRpciAjJHtpbmRleH1gO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGVhdChjOiBzdHJpbmcsIHRpbWVzOiBudW1iZXIpIHtcbiAgbGV0IHMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lczsgaSsrKSB7XG4gICAgcyArPSBjO1xuICB9XG4gIHJldHVybiBzO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgcHJpdmF0ZSBfc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2RlYnVnQ29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dHxEZWJ1Z1N0eWxpbmdDb250ZXh0LCBwcml2YXRlIF90Tm9kZTogVFN0eWxpbmdOb2RlLFxuICAgICAgcHJpdmF0ZSBfZGF0YTogTFN0eWxpbmdEYXRhLCBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpID9cbiAgICAgICAgbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCBfdE5vZGUsIF9pc0NsYXNzQmFzZWQpIDpcbiAgICAgICAgKGNvbnRleHQgYXMgRGVidWdTdHlsaW5nQ29udGV4dCk7XG4gIH1cblxuICBnZXQgY29udGV4dCgpIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dDsgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzLlxuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCkgeyB0aGlzLl9zYW5pdGl6ZXIgPSBzYW5pdGl6ZXI7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0IGFuZFxuICAgKiB3aGF0IHRoZWlyIHJ1bnRpbWUgcmVwcmVzZW50YXRpb24gaXMuXG4gICAqXG4gICAqIFNlZSBgTFN0eWxpbmdTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBzdW1tYXJ5KCk6IHtba2V5OiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSA9IHt9O1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuXG4gICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgLy8gdGhlIGRpcmVjdCBwYXNzIGNvZGUgZG9lc24ndCBjb252ZXJ0IFtzdHlsZV0gb3IgW2NsYXNzXSB2YWx1ZXNcbiAgICAvLyBpbnRvIFN0eWxpbmdNYXBBcnJheSBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiwgdGhlIHZhbHVlc1xuICAgIC8vIG5lZWQgdG8gYmUgY29udmVydGVkIGFoZWFkIG9mIHRpbWUgc2luY2UgdGhlIHN0eWxpbmcgZGVidWdcbiAgICAvLyByZWxpZXMgb24gY29udGV4dCByZXNvbHV0aW9uIHRvIGZpZ3VyZSBvdXQgd2hhdCBzdHlsaW5nXG4gICAgLy8gdmFsdWVzIGhhdmUgYmVlbiBhZGRlZC9yZW1vdmVkIG9uIHRoZSBlbGVtZW50LlxuICAgIGlmIChjb25maWcuYWxsb3dEaXJlY3RTdHlsaW5nICYmIGNvbmZpZy5oYXNNYXBCaW5kaW5ncykge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KFtdKTsgIC8vIG1ha2UgYSBjb3B5XG4gICAgICB0aGlzLl9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWFwVmFsdWVzKGRhdGEsIChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcblxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuX3ROb2RlLCB0aGlzLl9pc0NsYXNzQmFzZWQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgLy8gdGhlIGRpcmVjdCBwYXNzIGNvZGUgZG9lc24ndCBjb252ZXJ0IFtzdHlsZV0gb3IgW2NsYXNzXSB2YWx1ZXNcbiAgICAvLyBpbnRvIFN0eWxpbmdNYXBBcnJheSBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiwgdGhlIHZhbHVlc1xuICAgIC8vIG5lZWQgdG8gYmUgY29udmVydGVkIGFoZWFkIG9mIHRpbWUgc2luY2UgdGhlIHN0eWxpbmcgZGVidWdcbiAgICAvLyByZWxpZXMgb24gY29udGV4dCByZXNvbHV0aW9uIHRvIGZpZ3VyZSBvdXQgd2hhdCBzdHlsaW5nXG4gICAgLy8gdmFsdWVzIGhhdmUgYmVlbiBhZGRlZC9yZW1vdmVkIG9uIHRoZSBlbGVtZW50LlxuICAgIGlmIChjb25maWcuYWxsb3dEaXJlY3RTdHlsaW5nICYmIGNvbmZpZy5oYXNNYXBCaW5kaW5ncykge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KFtdKTsgIC8vIG1ha2UgYSBjb3B5XG4gICAgICB0aGlzLl9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWFwVmFsdWVzKGRhdGEsIChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhOiBMU3R5bGluZ0RhdGEpIHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0LmNvbnRleHQ7XG4gICAgY29uc3QgbGltaXQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0LCB0aGlzLl90Tm9kZSwgdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICBmb3IgKGxldCBpID1cbiAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICAgICAgIGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2ldIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IGJpbmRpbmdWYWx1ZSA9IGJpbmRpbmdJbmRleCAhPT0gMCA/IGdldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCkgOiBudWxsO1xuICAgICAgaWYgKGJpbmRpbmdWYWx1ZSAmJiAhQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IHN0eWxpbmdNYXBBcnJheSA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG51bGwsIGJpbmRpbmdWYWx1ZSwgIXRoaXMuX2lzQ2xhc3NCYXNlZCk7XG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycmF5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9tYXBWYWx1ZXMoXG4gICAgICBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgICBmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsKSA9PiBhbnkpIHtcbiAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIHN0b3JlL3RyYWNrIGFuIGVsZW1lbnQgaW5zdGFuY2UuIFRoZVxuICAgIC8vIGVsZW1lbnQgaXMgb25seSB1c2VkIHdoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGF0dGVtcHRzIHRvXG4gICAgLy8gc3R5bGUgdGhlIHZhbHVlIChhbmQgd2UgbW9jayBvdXQgdGhlIHN0eWxpbmdBcHBseUZuIGFueXdheSkuXG4gICAgY29uc3QgbW9ja0VsZW1lbnQgPSB7fSBhcyBhbnk7XG4gICAgY29uc3QgbWFwQmluZGluZ3NGbGFnID1cbiAgICAgICAgdGhpcy5faXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc01hcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZU1hcEJpbmRpbmdzO1xuICAgIGNvbnN0IGhhc01hcHMgPSBoYXNDb25maWcodGhpcy5fdE5vZGUsIG1hcEJpbmRpbmdzRmxhZyk7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICBiaW5kaW5nSW5kZXg/OiBudW1iZXIgfCBudWxsKSA9PiBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpO1xuXG4gICAgLy8gcnVuIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCB0aGlzLl90Tm9kZSwgbnVsbCwgbW9ja0VsZW1lbnQsIGRhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIGZhbHNlLFxuICAgICAgICB0aGlzLl9pc0NsYXNzQmFzZWQpO1xuXG4gICAgLy8gYW5kIGFsc28gdGhlIGhvc3QgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgdGhpcy5fdE5vZGUsIG51bGwsIG1vY2tFbGVtZW50LCBkYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCB0cnVlLFxuICAgICAgICB0aGlzLl9pc0NsYXNzQmFzZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29uZmlnKHROb2RlOiBUU3R5bGluZ05vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IERlYnVnU3R5bGluZ0NvbmZpZyB7XG4gIGNvbnN0IGhhc01hcEJpbmRpbmdzID0gaGFzQ29uZmlnKFxuICAgICAgdE5vZGUsIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1Byb3BCaW5kaW5ncyA9IGhhc0NvbmZpZyhcbiAgICAgIHROb2RlLCBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzUHJvcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZVByb3BCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0NvbGxpc2lvbnMgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSxcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzRHVwbGljYXRlQ2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzRHVwbGljYXRlU3R5bGVCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSxcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3MpO1xuICBjb25zdCBoYXNIb3N0QmluZGluZ3MgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSwgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNIb3N0Q2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzSG9zdFN0eWxlQmluZGluZ3MpO1xuXG4gIC8vIGBmaXJzdFRlbXBsYXRlUGFzc2AgaGVyZSBpcyBmYWxzZSBiZWNhdXNlIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gY29uc3RydWN0ZWRcbiAgLy8gZGlyZWN0bHkgd2l0aGluIHRoZSBiZWhhdmlvciBvZiB0aGUgZGVidWdnaW5nIHRvb2xzIChvdXRzaWRlIG9mIHN0eWxlL2NsYXNzIGRlYnVnZ2luZyxcbiAgLy8gdGhlIGNvbnRleHQgaXMgY29uc3RydWN0ZWQgZHVyaW5nIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzKS5cbiAgY29uc3QgYWxsb3dEaXJlY3RTdHlsaW5nID0gX2FsbG93RGlyZWN0U3R5bGluZyh0Tm9kZSwgaXNDbGFzc0Jhc2VkLCBmYWxzZSk7XG4gIHJldHVybiB7XG4gICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgLy9cbiAgICAgIGhhc1Byb3BCaW5kaW5ncywgICAgICAvL1xuICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgIC8vXG4gICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgLy9cbiAgICAgIGhhc0hvc3RCaW5kaW5ncywgICAgICAvL1xuICAgICAgYWxsb3dEaXJlY3RTdHlsaW5nLCAgIC8vXG4gIH07XG59XG4iXX0=