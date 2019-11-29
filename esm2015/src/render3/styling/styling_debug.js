/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/styling_debug.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * A debug-friendly version of `TStylingContext`.
 *
 * An instance of this is attached to `tStylingContext.debug` when `ngDevMode` is active.
 * @record
 */
export function DebugStylingContext() { }
if (false) {
    /**
     * The configuration settings of the associated `TStylingContext`
     * @type {?}
     */
    DebugStylingContext.prototype.config;
    /**
     * The associated TStylingContext instance
     * @type {?}
     */
    DebugStylingContext.prototype.context;
    /**
     * The associated TStylingContext instance
     * @type {?}
     */
    DebugStylingContext.prototype.entries;
    /**
     * A status report of all the sources within the context
     * @return {?}
     */
    DebugStylingContext.prototype.printSources = function () { };
    /**
     * A status report of all the entire context as a table
     * @return {?}
     */
    DebugStylingContext.prototype.printTable = function () { };
}
/**
 * A debug/testing-oriented summary of all styling information in `TNode.flags`.
 * @record
 */
export function DebugStylingConfig() { }
if (false) {
    /** @type {?} */
    DebugStylingConfig.prototype.hasMapBindings;
    /** @type {?} */
    DebugStylingConfig.prototype.hasPropBindings;
    /** @type {?} */
    DebugStylingConfig.prototype.hasCollisions;
    /** @type {?} */
    DebugStylingConfig.prototype.hasTemplateBindings;
    /** @type {?} */
    DebugStylingConfig.prototype.hasHostBindings;
    /** @type {?} */
    DebugStylingConfig.prototype.allowDirectStyling;
}
/**
 * A debug/testing-oriented summary of all styling entries within a `TStylingContext`.
 * @record
 */
export function DebugStylingContextEntry() { }
if (false) {
    /**
     * The property (style or class property) that this entry represents
     * @type {?}
     */
    DebugStylingContextEntry.prototype.prop;
    /**
     * The total amount of styling entries a part of this entry
     * @type {?}
     */
    DebugStylingContextEntry.prototype.valuesCount;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when any template style/class bindings update
     * @type {?}
     */
    DebugStylingContextEntry.prototype.templateBitMask;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when any host style/class bindings update
     * @type {?}
     */
    DebugStylingContextEntry.prototype.hostBindingsBitMask;
    /**
     * Whether or not the entry requires sanitization
     * @type {?}
     */
    DebugStylingContextEntry.prototype.sanitizationRequired;
    /**
     * The default value that will be applied if any bindings are falsy
     * @type {?}
     */
    DebugStylingContextEntry.prototype.defaultValue;
    /**
     * All bindingIndex sources that have been registered for this style
     * @type {?}
     */
    DebugStylingContextEntry.prototype.sources;
}
/**
 * A debug/testing-oriented summary of all styling entries for a `DebugNode` instance.
 * @record
 */
export function DebugNodeStyling() { }
if (false) {
    /**
     * The associated debug context of the TStylingContext instance
     * @type {?}
     */
    DebugNodeStyling.prototype.context;
    /**
     * A summarization of each style/class property
     * present in the context
     * @type {?}
     */
    DebugNodeStyling.prototype.summary;
    /**
     * A key/value map of all styling properties and their
     * runtime values
     * @type {?}
     */
    DebugNodeStyling.prototype.values;
    /**
     * Overrides the sanitizer used to process styles
     * @param {?} sanitizer
     * @return {?}
     */
    DebugNodeStyling.prototype.overrideSanitizer = function (sanitizer) { };
}
/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 * @record
 */
export function DebugNodeStylingEntry() { }
if (false) {
    /**
     * The style/class property that the summary is attached to
     * @type {?}
     */
    DebugNodeStylingEntry.prototype.prop;
    /**
     * The last applied value for the style/class property
     * @type {?}
     */
    DebugNodeStylingEntry.prototype.value;
    /**
     * The binding index of the last applied style/class property
     * @type {?}
     */
    DebugNodeStylingEntry.prototype.bindingIndex;
}
/**
 * Instantiates and attaches an instance of `TStylingContextDebug` to the provided context
 * @param {?} context
 * @param {?} tNode
 * @param {?} isClassBased
 * @return {?}
 */
export function attachStylingDebugObject(context, tNode, isClassBased) {
    /** @type {?} */
    const debug = new TStylingContextDebug(context, tNode, isClassBased);
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
     * @param {?} _tNode
     * @param {?} _isClassBased
     */
    constructor(context, _tNode, _isClassBased) {
        this.context = context;
        this._tNode = _tNode;
        this._isClassBased = _isClassBased;
    }
    /**
     * @return {?}
     */
    get config() { return buildConfig(this._tNode, this._isClassBased); }
    /**
     * Returns a detailed summary of each styling entry in the context.
     *
     * See `DebugStylingContextEntry`.
     * @return {?}
     */
    get entries() {
        /** @type {?} */
        const context = this.context;
        /** @type {?} */
        const totalColumns = getValuesCount(context);
        /** @type {?} */
        const entries = {};
        /** @type {?} */
        const start = getPropValuesStartPosition(context, this._tNode, this._isClassBased);
        /** @type {?} */
        let i = start;
        while (i < context.length) {
            /** @type {?} */
            const prop = getProp(context, i);
            /** @type {?} */
            const templateBitMask = getGuardMask(context, i, false);
            /** @type {?} */
            const hostBindingsBitMask = getGuardMask(context, i, true);
            /** @type {?} */
            const defaultValue = getDefaultValue(context, i);
            /** @type {?} */
            const sanitizationRequired = isSanitizationRequired(context, i);
            /** @type {?} */
            const bindingsStartPosition = i + 4 /* BindingsStartOffset */;
            /** @type {?} */
            const sources = [];
            for (let j = 0; j < totalColumns; j++) {
                /** @type {?} */
                const bindingIndex = (/** @type {?} */ (context[bindingsStartPosition + j]));
                if (bindingIndex !== 0) {
                    sources.push(bindingIndex);
                }
            }
            entries[prop] = {
                prop,
                templateBitMask,
                hostBindingsBitMask,
                sanitizationRequired,
                valuesCount: sources.length, defaultValue, sources,
            };
            i += 4 /* BindingsStartOffset */ + totalColumns;
        }
        return entries;
    }
    /**
     * Prints a detailed summary of each styling source grouped together with each binding index in
     * the context.
     * @return {?}
     */
    printSources() {
        /** @type {?} */
        let output = '\n';
        /** @type {?} */
        const context = this.context;
        /** @type {?} */
        const prefix = this._isClassBased ? 'class' : 'style';
        /** @type {?} */
        const bindingsBySource = [];
        /** @type {?} */
        const totalColumns = getValuesCount(context);
        /** @type {?} */
        const itemsPerRow = 4 /* BindingsStartOffset */ + totalColumns;
        for (let i = 0; i < totalColumns; i++) {
            /** @type {?} */
            const isDefaultColumn = i === totalColumns - 1;
            /** @type {?} */
            const hostBindingsMode = i !== TEMPLATE_DIRECTIVE_INDEX;
            /** @type {?} */
            const type = getTypeFromColumn(i, totalColumns);
            /** @type {?} */
            const entries = [];
            /** @type {?} */
            let j = 2 /* ValuesStartPosition */;
            while (j < context.length) {
                /** @type {?} */
                const value = getBindingValue(context, j, i);
                if (isDefaultColumn || value > 0) {
                    /** @type {?} */
                    const bitMask = getGuardMask(context, j, hostBindingsMode);
                    /** @type {?} */
                    const bindingIndex = isDefaultColumn ? -1 : (/** @type {?} */ (value));
                    /** @type {?} */
                    const prop = getProp(context, j);
                    /** @type {?} */
                    const isMapBased = prop === MAP_BASED_ENTRY_PROP_NAME;
                    /** @type {?} */
                    const binding = `${prefix}${isMapBased ? '' : '.' + prop}`;
                    entries.push({ binding, value, bindingIndex, bitMask });
                }
                j += itemsPerRow;
            }
            bindingsBySource.push({ type, entries: entries.sort((/**
                 * @param {?} a
                 * @param {?} b
                 * @return {?}
                 */
                (a, b) => a.bindingIndex - b.bindingIndex)) });
        }
        bindingsBySource.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        entry => {
            output += `[${entry.type.toUpperCase()}]\n`;
            output += repeat('-', entry.type.length + 2) + '\n';
            /** @type {?} */
            let tab = '  ';
            entry.entries.forEach((/**
             * @param {?} entry
             * @return {?}
             */
            entry => {
                /** @type {?} */
                const isDefault = typeof entry.value !== 'number';
                /** @type {?} */
                const value = entry.value;
                if (!isDefault || value !== null) {
                    output += `${tab}[${entry.binding}] = \`${value}\``;
                    output += '\n';
                }
            }));
            output += '\n';
        }));
        /* tslint:disable */
        console.log(output);
    }
    /**
     * Prints a detailed table of the entire styling context.
     * @return {?}
     */
    printTable() {
        // IE (not Edge) is the only browser that doesn't support this feature. Because
        // these debugging tools are not apart of the core of Angular (they are just
        // extra tools) we can skip-out on older browsers.
        if (!console.table) {
            throw new Error('This feature is not supported in your browser');
        }
        /** @type {?} */
        const context = this.context;
        /** @type {?} */
        const table = [];
        /** @type {?} */
        const totalColumns = getValuesCount(context);
        /** @type {?} */
        const itemsPerRow = 4 /* BindingsStartOffset */ + totalColumns;
        /** @type {?} */
        const totalProps = Math.floor(context.length / itemsPerRow);
        /** @type {?} */
        let i = 2 /* ValuesStartPosition */;
        while (i < context.length) {
            /** @type {?} */
            const prop = getProp(context, i);
            /** @type {?} */
            const isMapBased = prop === MAP_BASED_ENTRY_PROP_NAME;
            /** @type {?} */
            const entry = {
                prop,
                'tpl mask': generateBitString(getGuardMask(context, i, false), isMapBased, totalProps),
                'host mask': generateBitString(getGuardMask(context, i, true), isMapBased, totalProps),
            };
            for (let j = 0; j < totalColumns; j++) {
                /** @type {?} */
                const key = getTypeFromColumn(j, totalColumns);
                /** @type {?} */
                const value = getBindingValue(context, i, j);
                entry[key] = value;
            }
            i += itemsPerRow;
            table.push(entry);
        }
        /* tslint:disable */
        console.table(table);
    }
}
if (false) {
    /** @type {?} */
    TStylingContextDebug.prototype.context;
    /**
     * @type {?}
     * @private
     */
    TStylingContextDebug.prototype._tNode;
    /**
     * @type {?}
     * @private
     */
    TStylingContextDebug.prototype._isClassBased;
}
/**
 * @param {?} value
 * @param {?} isMapBased
 * @param {?} totalProps
 * @return {?}
 */
function generateBitString(value, isMapBased, totalProps) {
    if (isMapBased || value > 1) {
        return `0b${leftPad(value.toString(2), totalProps, '0')}`;
    }
    return null;
}
/**
 * @param {?} value
 * @param {?} max
 * @param {?} pad
 * @return {?}
 */
function leftPad(value, max, pad) {
    return repeat(pad, max - value.length) + value;
}
/**
 * @param {?} index
 * @param {?} totalColumns
 * @return {?}
 */
function getTypeFromColumn(index, totalColumns) {
    if (index === TEMPLATE_DIRECTIVE_INDEX) {
        return 'template';
    }
    else if (index === totalColumns - 1) {
        return 'defaults';
    }
    else {
        return `dir #${index}`;
    }
}
/**
 * @param {?} c
 * @param {?} times
 * @return {?}
 */
function repeat(c, times) {
    /** @type {?} */
    let s = '';
    for (let i = 0; i < times; i++) {
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
export class NodeStylingDebug {
    /**
     * @param {?} context
     * @param {?} _tNode
     * @param {?} _data
     * @param {?} _isClassBased
     */
    constructor(context, _tNode, _data, _isClassBased) {
        this._tNode = _tNode;
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
        this._debugContext = isStylingContext(context) ?
            new TStylingContextDebug((/** @type {?} */ (context)), _tNode, _isClassBased) :
            ((/** @type {?} */ (context)));
    }
    /**
     * @return {?}
     */
    get context() { return this._debugContext; }
    /**
     * Overrides the sanitizer used to process styles.
     * @param {?} sanitizer
     * @return {?}
     */
    overrideSanitizer(sanitizer) { this._sanitizer = sanitizer; }
    /**
     * Returns a detailed summary of each styling entry in the context and
     * what their runtime representation is.
     *
     * See `LStylingSummary`.
     * @return {?}
     */
    get summary() {
        /** @type {?} */
        const entries = {};
        /** @type {?} */
        const config = this.config;
        /** @type {?} */
        const isClassBased = this._isClassBased;
        /** @type {?} */
        let data = this._data;
        // the direct pass code doesn't convert [style] or [class] values
        // into StylingMapArray instances. For this reason, the values
        // need to be converted ahead of time since the styling debug
        // relies on context resolution to figure out what styling
        // values have been added/removed on the element.
        if (config.allowDirectStyling && config.hasMapBindings) {
            data = data.concat([]); // make a copy
            this._convertMapBindingsToStylingMapArrays(data);
        }
        this._mapValues(data, (/**
         * @param {?} prop
         * @param {?} value
         * @param {?} bindingIndex
         * @return {?}
         */
        (prop, value, bindingIndex) => {
            entries[prop] = { prop, value, bindingIndex };
        }));
        // because the styling algorithm runs into two different
        // modes: direct and context-resolution, the output of the entries
        // object is different because the removed values are not
        // saved between updates. For this reason a proxy is created
        // so that the behavior is the same when examining values
        // that are no longer active on the element.
        return createProxy({
            /**
             * @param {?} target
             * @param {?} prop
             * @return {?}
             */
            get(target, prop) {
                /** @type {?} */
                let value = entries[prop];
                if (!value) {
                    value = {
                        prop,
                        value: isClassBased ? false : null,
                        bindingIndex: null,
                    };
                }
                return value;
            },
            /**
             * @param {?} target
             * @param {?} prop
             * @param {?} value
             * @return {?}
             */
            set(target, prop, value) { return false; },
            /**
             * @return {?}
             */
            ownKeys() { return Object.keys(entries); },
            /**
             * @param {?} k
             * @return {?}
             */
            getOwnPropertyDescriptor(k) {
                // we use a special property descriptor here so that enumeration operations
                // such as `Object.keys` will work on this proxy.
                return {
                    enumerable: true,
                    configurable: true,
                };
            },
        });
    }
    /**
     * @return {?}
     */
    get config() { return buildConfig(this._tNode, this._isClassBased); }
    /**
     * Returns a key/value map of all the styles/classes that were last applied to the element.
     * @return {?}
     */
    get values() {
        /** @type {?} */
        const entries = {};
        /** @type {?} */
        const config = this.config;
        /** @type {?} */
        let data = this._data;
        // the direct pass code doesn't convert [style] or [class] values
        // into StylingMapArray instances. For this reason, the values
        // need to be converted ahead of time since the styling debug
        // relies on context resolution to figure out what styling
        // values have been added/removed on the element.
        if (config.allowDirectStyling && config.hasMapBindings) {
            data = data.concat([]); // make a copy
            this._convertMapBindingsToStylingMapArrays(data);
        }
        this._mapValues(data, (/**
         * @param {?} prop
         * @param {?} value
         * @return {?}
         */
        (prop, value) => { entries[prop] = value; }));
        return entries;
    }
    /**
     * @private
     * @param {?} data
     * @return {?}
     */
    _convertMapBindingsToStylingMapArrays(data) {
        /** @type {?} */
        const context = this.context.context;
        /** @type {?} */
        const limit = getPropValuesStartPosition(context, this._tNode, this._isClassBased);
        for (let i = 2 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */; i < limit; i++) {
            /** @type {?} */
            const bindingIndex = (/** @type {?} */ (context[i]));
            /** @type {?} */
            const bindingValue = bindingIndex !== 0 ? getValue(data, bindingIndex) : null;
            if (bindingValue && !Array.isArray(bindingValue)) {
                /** @type {?} */
                const stylingMapArray = normalizeIntoStylingMap(null, bindingValue, !this._isClassBased);
                setValue(data, bindingIndex, stylingMapArray);
            }
        }
    }
    /**
     * @private
     * @param {?} data
     * @param {?} fn
     * @return {?}
     */
    _mapValues(data, fn) {
        // there is no need to store/track an element instance. The
        // element is only used when the styling algorithm attempts to
        // style the value (and we mock out the stylingApplyFn anyway).
        /** @type {?} */
        const mockElement = (/** @type {?} */ ({}));
        /** @type {?} */
        const mapBindingsFlag = this._isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
        /** @type {?} */
        const hasMaps = hasConfig(this._tNode, mapBindingsFlag);
        if (hasMaps) {
            activateStylingMapFeature();
        }
        /** @type {?} */
        const mapFn = (/**
         * @param {?} renderer
         * @param {?} element
         * @param {?} prop
         * @param {?} value
         * @param {?=} bindingIndex
         * @return {?}
         */
        (renderer, element, prop, value, bindingIndex) => fn(prop, value, bindingIndex || null));
        /** @type {?} */
        const sanitizer = this._isClassBased ? null : (this._sanitizer || getCurrentStyleSanitizer());
        // run the template bindings
        applyStylingViaContext(this.context.context, this._tNode, null, mockElement, data, true, mapFn, sanitizer, false, this._isClassBased);
        // and also the host bindings
        applyStylingViaContext(this.context.context, this._tNode, null, mockElement, data, true, mapFn, sanitizer, true, this._isClassBased);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._sanitizer;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._debugContext;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._tNode;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._data;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._isClassBased;
}
/**
 * @param {?} tNode
 * @param {?} isClassBased
 * @return {?}
 */
function buildConfig(tNode, isClassBased) {
    /** @type {?} */
    const hasMapBindings = hasConfig(tNode, isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */);
    /** @type {?} */
    const hasPropBindings = hasConfig(tNode, isClassBased ? 1024 /* hasClassPropBindings */ : 32768 /* hasStylePropBindings */);
    /** @type {?} */
    const hasCollisions = hasConfig(tNode, isClassBased ? 8192 /* hasDuplicateClassBindings */ : 262144 /* hasDuplicateStyleBindings */);
    /** @type {?} */
    const hasTemplateBindings = hasConfig(tNode, isClassBased ? 2048 /* hasTemplateClassBindings */ : 65536 /* hasTemplateStyleBindings */);
    /** @type {?} */
    const hasHostBindings = hasConfig(tNode, isClassBased ? 4096 /* hasHostClassBindings */ : 131072 /* hasHostStyleBindings */);
    // `firstTemplatePass` here is false because the context has already been constructed
    // directly within the behavior of the debugging tools (outside of style/class debugging,
    // the context is constructed during the first template pass).
    /** @type {?} */
    const allowDirectStyling = _allowDirectStyling(tNode, isClassBased, false);
    return {
        hasMapBindings,
        hasPropBindings,
        hasCollisions,
        hasTemplateBindings,
        hasHostBindings,
        allowDirectStyling,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUs5QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixJQUFJLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU1VSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7Ozs7Ozs7QUFtQi9ELHlDQWVDOzs7Ozs7SUFiQyxxQ0FBMkI7Ozs7O0lBRzNCLHNDQUF5Qjs7Ozs7SUFHekIsc0NBQW9EOzs7OztJQUdwRCw2REFBcUI7Ozs7O0lBR3JCLDJEQUFtQjs7Ozs7O0FBT3JCLHdDQU9DOzs7SUFOQyw0Q0FBd0I7O0lBQ3hCLDZDQUF5Qjs7SUFDekIsMkNBQXVCOztJQUN2QixpREFBNkI7O0lBQzdCLDZDQUF5Qjs7SUFDekIsZ0RBQTRCOzs7Ozs7QUFPOUIsOENBaUNDOzs7Ozs7SUEvQkMsd0NBQWE7Ozs7O0lBR2IsK0NBQW9COzs7Ozs7SUFNcEIsbURBQXdCOzs7Ozs7SUFNeEIsdURBQTRCOzs7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LE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQ3hGLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMxQixDQUFDO0NBQ0Y7Ozs7OztJQS9JQyxzQ0FBZ0Q7Ozs7O0lBQ2hELHlDQUEyQzs7Ozs7SUFHTyxrQ0FBNEI7Ozs7O0lBQzFFLGlDQUEyQjs7Ozs7SUFBRSx5Q0FBOEI7Ozs7Ozs7QUE0SWpFLFNBQVMsV0FBVyxDQUFDLEtBQW1CLEVBQUUsWUFBcUI7O1VBQ3ZELGNBQWMsR0FBRyxTQUFTLENBQzVCLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQywrQkFBZ0MsQ0FBQyxnQ0FBK0IsQ0FBQzs7VUFDcEYsZUFBZSxHQUFHLFNBQVMsQ0FDN0IsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLGlDQUFnQyxDQUFDOztVQUN0RixhQUFhLEdBQUcsU0FBUyxDQUMzQixLQUFLLEVBQ0wsWUFBWSxDQUFDLENBQUMsc0NBQXNDLENBQUMsdUNBQXFDLENBQUM7O1VBQ3pGLG1CQUFtQixHQUFHLFNBQVMsQ0FDakMsS0FBSyxFQUNMLFlBQVksQ0FBQyxDQUFDLHFDQUFxQyxDQUFDLHFDQUFvQyxDQUFDOztVQUN2RixlQUFlLEdBQUcsU0FBUyxDQUM3QixLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUMsaUNBQWlDLENBQUMsa0NBQWdDLENBQUM7Ozs7O1VBS3RGLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDO0lBQzFFLE9BQU87UUFDSCxjQUFjO1FBQ2QsZUFBZTtRQUNmLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsZUFBZTtRQUNmLGtCQUFrQjtLQUNyQixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7Y3JlYXRlUHJveHl9IGZyb20gJy4uLy4uL2RlYnVnL3Byb3h5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7VE5vZGVGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ05vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge01BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgYWxsb3dEaXJlY3RTdHlsaW5nIGFzIF9hbGxvd0RpcmVjdFN0eWxpbmcsIGdldEJpbmRpbmdWYWx1ZSwgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGhhc0NvbmZpZywgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nQ29udGV4dCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHNldFZhbHVlfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ1ZpYUNvbnRleHR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBBIGRlYnVnLWZyaWVuZGx5IHZlcnNpb24gb2YgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhpcyBpcyBhdHRhY2hlZCB0byBgdFN0eWxpbmdDb250ZXh0LmRlYnVnYCB3aGVuIGBuZ0Rldk1vZGVgIGlzIGFjdGl2ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgLyoqIFRoZSBjb25maWd1cmF0aW9uIHNldHRpbmdzIG9mIHRoZSBhc3NvY2lhdGVkIGBUU3R5bGluZ0NvbnRleHRgICovXG4gIGNvbmZpZzogRGVidWdTdHlsaW5nQ29uZmlnO1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0O1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9O1xuXG4gIC8qKiBBIHN0YXR1cyByZXBvcnQgb2YgYWxsIHRoZSBzb3VyY2VzIHdpdGhpbiB0aGUgY29udGV4dCAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZDtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgZW50aXJlIGNvbnRleHQgYXMgYSB0YWJsZSAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBpbmZvcm1hdGlvbiBpbiBgVE5vZGUuZmxhZ3NgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbmZpZyB7XG4gIGhhc01hcEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAvL1xuICBoYXNQcm9wQmluZGluZ3M6IGJvb2xlYW47ICAgICAgLy9cbiAgaGFzQ29sbGlzaW9uczogYm9vbGVhbjsgICAgICAgIC8vXG4gIGhhc1RlbXBsYXRlQmluZGluZ3M6IGJvb2xlYW47ICAvL1xuICBoYXNIb3N0QmluZGluZ3M6IGJvb2xlYW47ICAgICAgLy9cbiAgYWxsb3dEaXJlY3RTdHlsaW5nOiBib29sZWFuOyAgIC8vXG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIHdpdGhpbiBhIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeSB7XG4gIC8qKiBUaGUgcHJvcGVydHkgKHN0eWxlIG9yIGNsYXNzIHByb3BlcnR5KSB0aGF0IHRoaXMgZW50cnkgcmVwcmVzZW50cyAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBlbnRyaWVzIGEgcGFydCBvZiB0aGlzIGVudHJ5ICovXG4gIHZhbHVlc0NvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSB0ZW1wbGF0ZSBzdHlsZS9jbGFzcyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIHRlbXBsYXRlQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgaG9zdCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIGhvc3RCaW5kaW5nc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGVudHJ5IHJlcXVpcmVzIHNhbml0aXphdGlvblxuICAgKi9cbiAgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGlmIGFueSBiaW5kaW5ncyBhcmUgZmFsc3lcbiAgICovXG4gIGRlZmF1bHRWYWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKipcbiAgICogQWxsIGJpbmRpbmdJbmRleCBzb3VyY2VzIHRoYXQgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgZm9yIHRoaXMgc3R5bGVcbiAgICovXG4gIHNvdXJjZXM6IChudW1iZXJ8bnVsbHxzdHJpbmcpW107XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmcge1xuICAvKiogVGhlIGFzc29jaWF0ZWQgZGVidWcgY29udGV4dCBvZiB0aGUgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IERlYnVnU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqXG4gICAqIEEgc3VtbWFyaXphdGlvbiBvZiBlYWNoIHN0eWxlL2NsYXNzIHByb3BlcnR5XG4gICAqIHByZXNlbnQgaW4gdGhlIGNvbnRleHRcbiAgICovXG4gIHN1bW1hcnk6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9O1xuXG4gIC8qKlxuICAgKiBBIGtleS92YWx1ZSBtYXAgb2YgYWxsIHN0eWxpbmcgcHJvcGVydGllcyBhbmQgdGhlaXJcbiAgICogcnVudGltZSB2YWx1ZXNcbiAgICovXG4gIHZhbHVlczoge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCBib29sZWFufTtcblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlc1xuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhIHN0eWxpbmcgZW50cnkuXG4gKlxuICogQSB2YWx1ZSBzdWNoIGFzIHRoaXMgaXMgZ2VuZXJhdGVkIGFzIGFuIGFydGlmYWN0IG9mIHRoZSBgRGVidWdTdHlsaW5nYFxuICogc3VtbWFyeS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGVTdHlsaW5nRW50cnkge1xuICAvKiogVGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IHRoYXQgdGhlIHN1bW1hcnkgaXMgYXR0YWNoZWQgdG8gKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgbGFzdCBhcHBsaWVkIHZhbHVlIGZvciB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqIFRoZSBiaW5kaW5nIGluZGV4IG9mIHRoZSBsYXN0IGFwcGxpZWQgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICBhdHRhY2hEZWJ1Z09iamVjdChjb250ZXh0LCBkZWJ1Zyk7XG4gIHJldHVybiBkZWJ1Zztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IHdpdGhpbiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5jbGFzcyBUU3R5bGluZ0NvbnRleHREZWJ1ZyBpbXBsZW1lbnRzIERlYnVnU3R5bGluZ0NvbnRleHQge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX3ROb2RlOiBUU3R5bGluZ05vZGUsXG4gICAgICBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHt9XG5cbiAgZ2V0IGNvbmZpZygpOiBEZWJ1Z1N0eWxpbmdDb25maWcgeyByZXR1cm4gYnVpbGRDb25maWcodGhpcy5fdE5vZGUsIHRoaXMuX2lzQ2xhc3NCYXNlZCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeWAuXG4gICAqL1xuICBnZXQgZW50cmllcygpOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0LCB0aGlzLl90Tm9kZSwgdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICBsZXQgaSA9IHN0YXJ0O1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgdGVtcGxhdGVCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc0JpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcblxuICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2JpbmRpbmdzU3RhcnRQb3NpdGlvbiArIGpdIGFzIG51bWJlciB8IHN0cmluZyB8IG51bGw7XG4gICAgICAgIGlmIChiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBzb3VyY2VzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlbnRyaWVzW3Byb3BdID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICB0ZW1wbGF0ZUJpdE1hc2ssXG4gICAgICAgIGhvc3RCaW5kaW5nc0JpdE1hc2ssXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkLFxuICAgICAgICB2YWx1ZXNDb3VudDogc291cmNlcy5sZW5ndGgsIGRlZmF1bHRWYWx1ZSwgc291cmNlcyxcbiAgICAgIH07XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgc291cmNlIGdyb3VwZWQgdG9nZXRoZXIgd2l0aCBlYWNoIGJpbmRpbmcgaW5kZXggaW5cbiAgICogdGhlIGNvbnRleHQuXG4gICAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZCB7XG4gICAgbGV0IG91dHB1dCA9ICdcXG4nO1xuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyAnY2xhc3MnIDogJ3N0eWxlJztcbiAgICBjb25zdCBiaW5kaW5nc0J5U291cmNlOiB7XG4gICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICBlbnRyaWVzOiB7YmluZGluZzogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSwgYml0TWFzazogbnVtYmVyfVtdXG4gICAgfVtdID0gW107XG5cbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQ29sdW1uczsgaSsrKSB7XG4gICAgICBjb25zdCBpc0RlZmF1bHRDb2x1bW4gPSBpID09PSB0b3RhbENvbHVtbnMgLSAxO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGkgIT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbiAgICAgIGNvbnN0IHR5cGUgPSBnZXRUeXBlRnJvbUNvbHVtbihpLCB0b3RhbENvbHVtbnMpO1xuICAgICAgY29uc3QgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIsIGJpdE1hc2s6IG51bWJlcn1bXSA9IFtdO1xuXG4gICAgICBsZXQgaiA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgICB3aGlsZSAoaiA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGosIGkpO1xuICAgICAgICBpZiAoaXNEZWZhdWx0Q29sdW1uIHx8IHZhbHVlID4gMCkge1xuICAgICAgICAgIGNvbnN0IGJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaiwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gaXNEZWZhdWx0Q29sdW1uID8gLTEgOiB2YWx1ZSBhcyBudW1iZXI7XG4gICAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgaXNNYXBCYXNlZCA9IHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG4gICAgICAgICAgY29uc3QgYmluZGluZyA9IGAke3ByZWZpeH0ke2lzTWFwQmFzZWQgPyAnJyA6ICcuJyArIHByb3B9YDtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goe2JpbmRpbmcsIHZhbHVlLCBiaW5kaW5nSW5kZXgsIGJpdE1hc2t9KTtcbiAgICAgICAgfVxuICAgICAgICBqICs9IGl0ZW1zUGVyUm93O1xuICAgICAgfVxuXG4gICAgICBiaW5kaW5nc0J5U291cmNlLnB1c2goXG4gICAgICAgICAge3R5cGUsIGVudHJpZXM6IGVudHJpZXMuc29ydCgoYSwgYikgPT4gYS5iaW5kaW5nSW5kZXggLSBiLmJpbmRpbmdJbmRleCl9KTtcbiAgICB9XG5cbiAgICBiaW5kaW5nc0J5U291cmNlLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgb3V0cHV0ICs9IGBbJHtlbnRyeS50eXBlLnRvVXBwZXJDYXNlKCl9XVxcbmA7XG4gICAgICBvdXRwdXQgKz0gcmVwZWF0KCctJywgZW50cnkudHlwZS5sZW5ndGggKyAyKSArICdcXG4nO1xuXG4gICAgICBsZXQgdGFiID0gJyAgJztcbiAgICAgIGVudHJ5LmVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIGNvbnN0IGlzRGVmYXVsdCA9IHR5cGVvZiBlbnRyeS52YWx1ZSAhPT0gJ251bWJlcic7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZW50cnkudmFsdWU7XG4gICAgICAgIGlmICghaXNEZWZhdWx0IHx8IHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgb3V0cHV0ICs9IGAke3RhYn1bJHtlbnRyeS5iaW5kaW5nfV0gPSBcXGAke3ZhbHVlfVxcYGA7XG4gICAgICAgICAgb3V0cHV0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICB9KTtcblxuICAgIC8qIHRzbGludDpkaXNhYmxlICovXG4gICAgY29uc29sZS5sb2cob3V0cHV0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmludHMgYSBkZXRhaWxlZCB0YWJsZSBvZiB0aGUgZW50aXJlIHN0eWxpbmcgY29udGV4dC5cbiAgICovXG4gIHByaW50VGFibGUoKTogdm9pZCB7XG4gICAgLy8gSUUgKG5vdCBFZGdlKSBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgZG9lc24ndCBzdXBwb3J0IHRoaXMgZmVhdHVyZS4gQmVjYXVzZVxuICAgIC8vIHRoZXNlIGRlYnVnZ2luZyB0b29scyBhcmUgbm90IGFwYXJ0IG9mIHRoZSBjb3JlIG9mIEFuZ3VsYXIgKHRoZXkgYXJlIGp1c3RcbiAgICAvLyBleHRyYSB0b29scykgd2UgY2FuIHNraXAtb3V0IG9uIG9sZGVyIGJyb3dzZXJzLlxuICAgIGlmICghY29uc29sZS50YWJsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGZlYXR1cmUgaXMgbm90IHN1cHBvcnRlZCBpbiB5b3VyIGJyb3dzZXInKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRhYmxlOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICBjb25zdCB0b3RhbFByb3BzID0gTWF0aC5mbG9vcihjb250ZXh0Lmxlbmd0aCAvIGl0ZW1zUGVyUm93KTtcblxuICAgIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgY29uc3QgZW50cnk6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICAndHBsIG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpLCBpc01hcEJhc2VkLCB0b3RhbFByb3BzKSxcbiAgICAgICAgJ2hvc3QgbWFzayc6IGdlbmVyYXRlQml0U3RyaW5nKGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldFR5cGVGcm9tQ29sdW1uKGosIHRvdGFsQ29sdW1ucyk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopO1xuICAgICAgICBlbnRyeVtrZXldID0gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGkgKz0gaXRlbXNQZXJSb3c7XG4gICAgICB0YWJsZS5wdXNoKGVudHJ5KTtcbiAgICB9XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUudGFibGUodGFibGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQml0U3RyaW5nKHZhbHVlOiBudW1iZXIsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIHRvdGFsUHJvcHM6IG51bWJlcikge1xuICBpZiAoaXNNYXBCYXNlZCB8fCB2YWx1ZSA+IDEpIHtcbiAgICByZXR1cm4gYDBiJHtsZWZ0UGFkKHZhbHVlLnRvU3RyaW5nKDIpLCB0b3RhbFByb3BzLCAnMCcpfWA7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxlZnRQYWQodmFsdWU6IHN0cmluZywgbWF4OiBudW1iZXIsIHBhZDogc3RyaW5nKSB7XG4gIHJldHVybiByZXBlYXQocGFkLCBtYXggLSB2YWx1ZS5sZW5ndGgpICsgdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFR5cGVGcm9tQ29sdW1uKGluZGV4OiBudW1iZXIsIHRvdGFsQ29sdW1uczogbnVtYmVyKSB7XG4gIGlmIChpbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKSB7XG4gICAgcmV0dXJuICd0ZW1wbGF0ZSc7XG4gIH0gZWxzZSBpZiAoaW5kZXggPT09IHRvdGFsQ29sdW1ucyAtIDEpIHtcbiAgICByZXR1cm4gJ2RlZmF1bHRzJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYGRpciAjJHtpbmRleH1gO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGVhdChjOiBzdHJpbmcsIHRpbWVzOiBudW1iZXIpIHtcbiAgbGV0IHMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lczsgaSsrKSB7XG4gICAgcyArPSBjO1xuICB9XG4gIHJldHVybiBzO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgcHJpdmF0ZSBfc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2RlYnVnQ29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dHxEZWJ1Z1N0eWxpbmdDb250ZXh0LCBwcml2YXRlIF90Tm9kZTogVFN0eWxpbmdOb2RlLFxuICAgICAgcHJpdmF0ZSBfZGF0YTogTFN0eWxpbmdEYXRhLCBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpID9cbiAgICAgICAgbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCBfdE5vZGUsIF9pc0NsYXNzQmFzZWQpIDpcbiAgICAgICAgKGNvbnRleHQgYXMgRGVidWdTdHlsaW5nQ29udGV4dCk7XG4gIH1cblxuICBnZXQgY29udGV4dCgpIHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dDsgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzLlxuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCkgeyB0aGlzLl9zYW5pdGl6ZXIgPSBzYW5pdGl6ZXI7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0IGFuZFxuICAgKiB3aGF0IHRoZWlyIHJ1bnRpbWUgcmVwcmVzZW50YXRpb24gaXMuXG4gICAqXG4gICAqIFNlZSBgTFN0eWxpbmdTdW1tYXJ5YC5cbiAgICovXG4gIGdldCBzdW1tYXJ5KCk6IHtba2V5OiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSA9IHt9O1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IHRoaXMuX2lzQ2xhc3NCYXNlZDtcblxuICAgIGxldCBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgIC8vIHRoZSBkaXJlY3QgcGFzcyBjb2RlIGRvZXNuJ3QgY29udmVydCBbc3R5bGVdIG9yIFtjbGFzc10gdmFsdWVzXG4gICAgLy8gaW50byBTdHlsaW5nTWFwQXJyYXkgaW5zdGFuY2VzLiBGb3IgdGhpcyByZWFzb24sIHRoZSB2YWx1ZXNcbiAgICAvLyBuZWVkIHRvIGJlIGNvbnZlcnRlZCBhaGVhZCBvZiB0aW1lIHNpbmNlIHRoZSBzdHlsaW5nIGRlYnVnXG4gICAgLy8gcmVsaWVzIG9uIGNvbnRleHQgcmVzb2x1dGlvbiB0byBmaWd1cmUgb3V0IHdoYXQgc3R5bGluZ1xuICAgIC8vIHZhbHVlcyBoYXZlIGJlZW4gYWRkZWQvcmVtb3ZlZCBvbiB0aGUgZWxlbWVudC5cbiAgICBpZiAoY29uZmlnLmFsbG93RGlyZWN0U3R5bGluZyAmJiBjb25maWcuaGFzTWFwQmluZGluZ3MpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChbXSk7ICAvLyBtYWtlIGEgY29weVxuICAgICAgdGhpcy5fY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX21hcFZhbHVlcyhkYXRhLCAocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBiaW5kaW5nSW5kZXg6IG51bWJlciB8IG51bGwpID0+IHtcbiAgICAgIGVudHJpZXNbcHJvcF0gPSB7cHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleH07XG4gICAgfSk7XG5cbiAgICAvLyBiZWNhdXNlIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBydW5zIGludG8gdHdvIGRpZmZlcmVudFxuICAgIC8vIG1vZGVzOiBkaXJlY3QgYW5kIGNvbnRleHQtcmVzb2x1dGlvbiwgdGhlIG91dHB1dCBvZiB0aGUgZW50cmllc1xuICAgIC8vIG9iamVjdCBpcyBkaWZmZXJlbnQgYmVjYXVzZSB0aGUgcmVtb3ZlZCB2YWx1ZXMgYXJlIG5vdFxuICAgIC8vIHNhdmVkIGJldHdlZW4gdXBkYXRlcy4gRm9yIHRoaXMgcmVhc29uIGEgcHJveHkgaXMgY3JlYXRlZFxuICAgIC8vIHNvIHRoYXQgdGhlIGJlaGF2aW9yIGlzIHRoZSBzYW1lIHdoZW4gZXhhbWluaW5nIHZhbHVlc1xuICAgIC8vIHRoYXQgYXJlIG5vIGxvbmdlciBhY3RpdmUgb24gdGhlIGVsZW1lbnQuXG4gICAgcmV0dXJuIGNyZWF0ZVByb3h5KHtcbiAgICAgIGdldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcpOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl7XG4gICAgICAgIGxldCB2YWx1ZTogRGVidWdOb2RlU3R5bGluZ0VudHJ5ID0gZW50cmllc1twcm9wXTsgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgIHZhbHVlID0ge1xuICAgICAgICAgICAgcHJvcCxcbiAgICAgICAgICAgIHZhbHVlOiBpc0NsYXNzQmFzZWQgPyBmYWxzZSA6IG51bGwsXG4gICAgICAgICAgICBiaW5kaW5nSW5kZXg6IG51bGwsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSByZXR1cm4gdmFsdWU7XG4gICAgICB9LFxuICAgICAgc2V0KHRhcmdldDoge30sIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgeyByZXR1cm4gZmFsc2U7IH0sXG4gICAgICBvd25LZXlzKCkgeyByZXR1cm4gT2JqZWN0LmtleXMoZW50cmllcyk7IH0sXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoazogYW55KSB7XG4gICAgICAgIC8vIHdlIHVzZSBhIHNwZWNpYWwgcHJvcGVydHkgZGVzY3JpcHRvciBoZXJlIHNvIHRoYXQgZW51bWVyYXRpb24gb3BlcmF0aW9uc1xuICAgICAgICAvLyBzdWNoIGFzIGBPYmplY3Qua2V5c2Agd2lsbCB3b3JrIG9uIHRoaXMgcHJveHkuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuX3ROb2RlLCB0aGlzLl9pc0NsYXNzQmFzZWQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgLy8gdGhlIGRpcmVjdCBwYXNzIGNvZGUgZG9lc24ndCBjb252ZXJ0IFtzdHlsZV0gb3IgW2NsYXNzXSB2YWx1ZXNcbiAgICAvLyBpbnRvIFN0eWxpbmdNYXBBcnJheSBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiwgdGhlIHZhbHVlc1xuICAgIC8vIG5lZWQgdG8gYmUgY29udmVydGVkIGFoZWFkIG9mIHRpbWUgc2luY2UgdGhlIHN0eWxpbmcgZGVidWdcbiAgICAvLyByZWxpZXMgb24gY29udGV4dCByZXNvbHV0aW9uIHRvIGZpZ3VyZSBvdXQgd2hhdCBzdHlsaW5nXG4gICAgLy8gdmFsdWVzIGhhdmUgYmVlbiBhZGRlZC9yZW1vdmVkIG9uIHRoZSBlbGVtZW50LlxuICAgIGlmIChjb25maWcuYWxsb3dEaXJlY3RTdHlsaW5nICYmIGNvbmZpZy5oYXNNYXBCaW5kaW5ncykge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KFtdKTsgIC8vIG1ha2UgYSBjb3B5XG4gICAgICB0aGlzLl9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWFwVmFsdWVzKGRhdGEsIChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhOiBMU3R5bGluZ0RhdGEpIHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0LmNvbnRleHQ7XG4gICAgY29uc3QgbGltaXQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0LCB0aGlzLl90Tm9kZSwgdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICBmb3IgKGxldCBpID1cbiAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICAgICAgIGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2ldIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IGJpbmRpbmdWYWx1ZSA9IGJpbmRpbmdJbmRleCAhPT0gMCA/IGdldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCkgOiBudWxsO1xuICAgICAgaWYgKGJpbmRpbmdWYWx1ZSAmJiAhQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IHN0eWxpbmdNYXBBcnJheSA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG51bGwsIGJpbmRpbmdWYWx1ZSwgIXRoaXMuX2lzQ2xhc3NCYXNlZCk7XG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycmF5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9tYXBWYWx1ZXMoXG4gICAgICBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgICBmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsKSA9PiBhbnkpIHtcbiAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIHN0b3JlL3RyYWNrIGFuIGVsZW1lbnQgaW5zdGFuY2UuIFRoZVxuICAgIC8vIGVsZW1lbnQgaXMgb25seSB1c2VkIHdoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGF0dGVtcHRzIHRvXG4gICAgLy8gc3R5bGUgdGhlIHZhbHVlIChhbmQgd2UgbW9jayBvdXQgdGhlIHN0eWxpbmdBcHBseUZuIGFueXdheSkuXG4gICAgY29uc3QgbW9ja0VsZW1lbnQgPSB7fSBhcyBhbnk7XG4gICAgY29uc3QgbWFwQmluZGluZ3NGbGFnID1cbiAgICAgICAgdGhpcy5faXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc01hcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZU1hcEJpbmRpbmdzO1xuICAgIGNvbnN0IGhhc01hcHMgPSBoYXNDb25maWcodGhpcy5fdE5vZGUsIG1hcEJpbmRpbmdzRmxhZyk7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICBiaW5kaW5nSW5kZXg/OiBudW1iZXIgfCBudWxsKSA9PiBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpO1xuXG4gICAgLy8gcnVuIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCB0aGlzLl90Tm9kZSwgbnVsbCwgbW9ja0VsZW1lbnQsIGRhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIGZhbHNlLFxuICAgICAgICB0aGlzLl9pc0NsYXNzQmFzZWQpO1xuXG4gICAgLy8gYW5kIGFsc28gdGhlIGhvc3QgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgdGhpcy5fdE5vZGUsIG51bGwsIG1vY2tFbGVtZW50LCBkYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCB0cnVlLFxuICAgICAgICB0aGlzLl9pc0NsYXNzQmFzZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29uZmlnKHROb2RlOiBUU3R5bGluZ05vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IERlYnVnU3R5bGluZ0NvbmZpZyB7XG4gIGNvbnN0IGhhc01hcEJpbmRpbmdzID0gaGFzQ29uZmlnKFxuICAgICAgdE5vZGUsIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1Byb3BCaW5kaW5ncyA9IGhhc0NvbmZpZyhcbiAgICAgIHROb2RlLCBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzUHJvcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZVByb3BCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0NvbGxpc2lvbnMgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSxcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzRHVwbGljYXRlQ2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzRHVwbGljYXRlU3R5bGVCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSxcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3MpO1xuICBjb25zdCBoYXNIb3N0QmluZGluZ3MgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSwgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNIb3N0Q2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzSG9zdFN0eWxlQmluZGluZ3MpO1xuXG4gIC8vIGBmaXJzdFRlbXBsYXRlUGFzc2AgaGVyZSBpcyBmYWxzZSBiZWNhdXNlIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gY29uc3RydWN0ZWRcbiAgLy8gZGlyZWN0bHkgd2l0aGluIHRoZSBiZWhhdmlvciBvZiB0aGUgZGVidWdnaW5nIHRvb2xzIChvdXRzaWRlIG9mIHN0eWxlL2NsYXNzIGRlYnVnZ2luZyxcbiAgLy8gdGhlIGNvbnRleHQgaXMgY29uc3RydWN0ZWQgZHVyaW5nIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzKS5cbiAgY29uc3QgYWxsb3dEaXJlY3RTdHlsaW5nID0gX2FsbG93RGlyZWN0U3R5bGluZyh0Tm9kZSwgaXNDbGFzc0Jhc2VkLCBmYWxzZSk7XG4gIHJldHVybiB7XG4gICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgLy9cbiAgICAgIGhhc1Byb3BCaW5kaW5ncywgICAgICAvL1xuICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgIC8vXG4gICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgLy9cbiAgICAgIGhhc0hvc3RCaW5kaW5ncywgICAgICAvL1xuICAgICAgYWxsb3dEaXJlY3RTdHlsaW5nLCAgIC8vXG4gIH07XG59XG4iXX0=