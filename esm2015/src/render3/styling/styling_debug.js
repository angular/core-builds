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
import { getTStylingRangePrev } from '../interfaces/styling';
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
/**
 * Find the head of the styling binding linked list.
 * @param {?} tData
 * @param {?} tNode
 * @param {?} isClassBinding
 * @return {?}
 */
export function getStylingBindingHead(tData, tNode, isClassBinding) {
    /** @type {?} */
    let index = getTStylingRangePrev(isClassBinding ? tNode.classBindings : tNode.styleBindings);
    while (true) {
        /** @type {?} */
        const tStylingRange = (/** @type {?} */ (tData[index + 1]));
        /** @type {?} */
        const prev = getTStylingRangePrev(tStylingRange);
        if (prev === 0) {
            // found head exit.
            return index;
        }
        else {
            index = prev;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUk5QyxPQUFPLEVBQW1HLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFN0osT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxrQkFBa0IsSUFBSSxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFNVUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7O0FBbUIvRCx5Q0FlQzs7Ozs7O0lBYkMscUNBQTJCOzs7OztJQUczQixzQ0FBeUI7Ozs7O0lBR3pCLHNDQUFvRDs7Ozs7SUFHcEQsNkRBQXFCOzs7OztJQUdyQiwyREFBbUI7Ozs7OztBQU9yQix3Q0FPQzs7O0lBTkMsNENBQXdCOztJQUN4Qiw2Q0FBeUI7O0lBQ3pCLDJDQUF1Qjs7SUFDdkIsaURBQTZCOztJQUM3Qiw2Q0FBeUI7O0lBQ3pCLGdEQUE0Qjs7Ozs7O0FBTzlCLDhDQWlDQzs7Ozs7O0lBL0JDLHdDQUFhOzs7OztJQUdi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QUFxQixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsY0FBdUI7O1FBQ25GLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7SUFDNUYsT0FBTyxJQUFJLEVBQUU7O2NBQ0wsYUFBYSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQWlCOztjQUNqRCxJQUFJLEdBQUcsb0JBQW9CLENBQUMsYUFBYSxDQUFDO1FBQ2hELElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNkLG1CQUFtQjtZQUNuQixPQUFPLEtBQUssQ0FBQztTQUNkO2FBQU07WUFDTCxLQUFLLEdBQUcsSUFBSSxDQUFDO1NBQ2Q7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge2NyZWF0ZVByb3h5fSBmcm9tICcuLi8uLi9kZWJ1Zy9wcm94eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nTm9kZSwgVFN0eWxpbmdSYW5nZSwgZ2V0VFN0eWxpbmdSYW5nZVByZXZ9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge1REYXRhfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuaW1wb3J0IHtNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FLCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGFsbG93RGlyZWN0U3R5bGluZyBhcyBfYWxsb3dEaXJlY3RTdHlsaW5nLCBnZXRCaW5kaW5nVmFsdWUsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQsIGlzU3R5bGluZ0NvbnRleHQsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBzZXRWYWx1ZX0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHthcHBseVN0eWxpbmdWaWFDb250ZXh0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBkZWJ1ZyBmdW5jdGlvbmFsaXR5IGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBkZWJ1Zy1mcmllbmRseSB2ZXJzaW9uIG9mIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEFuIGluc3RhbmNlIG9mIHRoaXMgaXMgYXR0YWNoZWQgdG8gYHRTdHlsaW5nQ29udGV4dC5kZWJ1Z2Agd2hlbiBgbmdEZXZNb2RlYCBpcyBhY3RpdmUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIC8qKiBUaGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBvZiB0aGUgYXNzb2NpYXRlZCBgVFN0eWxpbmdDb250ZXh0YCAqL1xuICBjb25maWc6IERlYnVnU3R5bGluZ0NvbmZpZztcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fTtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgc291cmNlcyB3aXRoaW4gdGhlIGNvbnRleHQgKi9cbiAgcHJpbnRTb3VyY2VzKCk6IHZvaWQ7XG5cbiAgLyoqIEEgc3RhdHVzIHJlcG9ydCBvZiBhbGwgdGhlIGVudGlyZSBjb250ZXh0IGFzIGEgdGFibGUgKi9cbiAgcHJpbnRUYWJsZSgpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgaW5mb3JtYXRpb24gaW4gYFROb2RlLmZsYWdzYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb25maWcge1xuICBoYXNNYXBCaW5kaW5nczogYm9vbGVhbjsgICAgICAgLy9cbiAgaGFzUHJvcEJpbmRpbmdzOiBib29sZWFuOyAgICAgIC8vXG4gIGhhc0NvbGxpc2lvbnM6IGJvb2xlYW47ICAgICAgICAvL1xuICBoYXNUZW1wbGF0ZUJpbmRpbmdzOiBib29sZWFuOyAgLy9cbiAgaGFzSG9zdEJpbmRpbmdzOiBib29sZWFuOyAgICAgIC8vXG4gIGFsbG93RGlyZWN0U3R5bGluZzogYm9vbGVhbjsgICAvL1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyB3aXRoaW4gYSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIGVudHJ5IHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhIHBhcnQgb2YgdGhpcyBlbnRyeSAqL1xuICB2YWx1ZXNDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgdGVtcGxhdGUgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICB0ZW1wbGF0ZUJpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IGhvc3Qgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICBob3N0QmluZGluZ3NCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSByZXF1aXJlcyBzYW5pdGl6YXRpb25cbiAgICovXG4gIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSB0aGF0IHdpbGwgYmUgYXBwbGllZCBpZiBhbnkgYmluZGluZ3MgYXJlIGZhbHN5XG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlXG4gICAqL1xuICBzb3VyY2VzOiAobnVtYmVyfG51bGx8c3RyaW5nKVtdO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgLyoqIFRoZSBhc3NvY2lhdGVkIGRlYnVnIGNvbnRleHQgb2YgdGhlIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBEZWJ1Z1N0eWxpbmdDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBBIHN1bW1hcml6YXRpb24gb2YgZWFjaCBzdHlsZS9jbGFzcyBwcm9wZXJ0eVxuICAgKiBwcmVzZW50IGluIHRoZSBjb250ZXh0XG4gICAqL1xuICBzdW1tYXJ5OiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fTtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzXG4gICAqL1xuICB2YWx1ZXM6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgYm9vbGVhbn07XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXNcbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYSBzdHlsaW5nIGVudHJ5LlxuICpcbiAqIEEgdmFsdWUgc3VjaCBhcyB0aGlzIGlzIGdlbmVyYXRlZCBhcyBhbiBhcnRpZmFjdCBvZiB0aGUgYERlYnVnU3R5bGluZ2BcbiAqIHN1bW1hcnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZ0VudHJ5IHtcbiAgLyoqIFRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSB0aGF0IHRoZSBzdW1tYXJ5IGlzIGF0dGFjaGVkIHRvICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIGxhc3QgYXBwbGllZCB2YWx1ZSBmb3IgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKiBUaGUgYmluZGluZyBpbmRleCBvZiB0aGUgbGFzdCBhcHBsaWVkIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG59XG5cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBkZWJ1ZyA9IG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0LCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgYXR0YWNoRGVidWdPYmplY3QoY29udGV4dCwgZGVidWcpO1xuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCB3aXRoaW4gYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuY2xhc3MgVFN0eWxpbmdDb250ZXh0RGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgcmVhZG9ubHkgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBwcml2YXRlIF90Tm9kZTogVFN0eWxpbmdOb2RlLFxuICAgICAgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7fVxuXG4gIGdldCBjb25maWcoKTogRGVidWdTdHlsaW5nQ29uZmlnIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuX3ROb2RlLCB0aGlzLl9pc0NsYXNzQmFzZWQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogU2VlIGBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fSA9IHt9O1xuICAgIGNvbnN0IHN0YXJ0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCwgdGhpcy5fdE5vZGUsIHRoaXMuX2lzQ2xhc3NCYXNlZCk7XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZW50cmllc1twcm9wXSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgdGVtcGxhdGVCaXRNYXNrLFxuICAgICAgICBob3N0QmluZGluZ3NCaXRNYXNrLFxuICAgICAgICBzYW5pdGl6YXRpb25SZXF1aXJlZCxcbiAgICAgICAgdmFsdWVzQ291bnQ6IHNvdXJjZXMubGVuZ3RoLCBkZWZhdWx0VmFsdWUsIHNvdXJjZXMsXG4gICAgICB9O1xuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50cyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIHNvdXJjZSBncm91cGVkIHRvZ2V0aGVyIHdpdGggZWFjaCBiaW5kaW5nIGluZGV4IGluXG4gICAqIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgcHJpbnRTb3VyY2VzKCk6IHZvaWQge1xuICAgIGxldCBvdXRwdXQgPSAnXFxuJztcblxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgcHJlZml4ID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gJ2NsYXNzJyA6ICdzdHlsZSc7XG4gICAgY29uc3QgYmluZGluZ3NCeVNvdXJjZToge1xuICAgICAgdHlwZTogc3RyaW5nLFxuICAgICAgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnksIGJpdE1hc2s6IG51bWJlcn1bXVxuICAgIH1bXSA9IFtdO1xuXG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbENvbHVtbnM7IGkrKykge1xuICAgICAgY29uc3QgaXNEZWZhdWx0Q29sdW1uID0gaSA9PT0gdG90YWxDb2x1bW5zIC0gMTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpICE9PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG4gICAgICBjb25zdCB0eXBlID0gZ2V0VHlwZUZyb21Db2x1bW4oaSwgdG90YWxDb2x1bW5zKTtcbiAgICAgIGNvbnN0IGVudHJpZXM6IHtiaW5kaW5nOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyLCBiaXRNYXNrOiBudW1iZXJ9W10gPSBbXTtcblxuICAgICAgbGV0IGogPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgICAgd2hpbGUgKGogPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBqLCBpKTtcbiAgICAgICAgaWYgKGlzRGVmYXVsdENvbHVtbiB8fCB2YWx1ZSA+IDApIHtcbiAgICAgICAgICBjb25zdCBiaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGosIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGlzRGVmYXVsdENvbHVtbiA/IC0xIDogdmFsdWUgYXMgbnVtYmVyO1xuICAgICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmcgPSBgJHtwcmVmaXh9JHtpc01hcEJhc2VkID8gJycgOiAnLicgKyBwcm9wfWA7XG4gICAgICAgICAgZW50cmllcy5wdXNoKHtiaW5kaW5nLCB2YWx1ZSwgYmluZGluZ0luZGV4LCBiaXRNYXNrfSk7XG4gICAgICAgIH1cbiAgICAgICAgaiArPSBpdGVtc1BlclJvdztcbiAgICAgIH1cblxuICAgICAgYmluZGluZ3NCeVNvdXJjZS5wdXNoKFxuICAgICAgICAgIHt0eXBlLCBlbnRyaWVzOiBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGEuYmluZGluZ0luZGV4IC0gYi5iaW5kaW5nSW5kZXgpfSk7XG4gICAgfVxuXG4gICAgYmluZGluZ3NCeVNvdXJjZS5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgIG91dHB1dCArPSBgWyR7ZW50cnkudHlwZS50b1VwcGVyQ2FzZSgpfV1cXG5gO1xuICAgICAgb3V0cHV0ICs9IHJlcGVhdCgnLScsIGVudHJ5LnR5cGUubGVuZ3RoICsgMikgKyAnXFxuJztcblxuICAgICAgbGV0IHRhYiA9ICcgICc7XG4gICAgICBlbnRyeS5lbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBjb25zdCBpc0RlZmF1bHQgPSB0eXBlb2YgZW50cnkudmFsdWUgIT09ICdudW1iZXInO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGVudHJ5LnZhbHVlO1xuICAgICAgICBpZiAoIWlzRGVmYXVsdCB8fCB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgIG91dHB1dCArPSBgJHt0YWJ9WyR7ZW50cnkuYmluZGluZ31dID0gXFxgJHt2YWx1ZX1cXGBgO1xuICAgICAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBvdXRwdXQgKz0gJ1xcbic7XG4gICAgfSk7XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUubG9nKG91dHB1dCk7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgdGFibGUgb2YgdGhlIGVudGlyZSBzdHlsaW5nIGNvbnRleHQuXG4gICAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQge1xuICAgIC8vIElFIChub3QgRWRnZSkgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGRvZXNuJ3Qgc3VwcG9ydCB0aGlzIGZlYXR1cmUuIEJlY2F1c2VcbiAgICAvLyB0aGVzZSBkZWJ1Z2dpbmcgdG9vbHMgYXJlIG5vdCBhcGFydCBvZiB0aGUgY29yZSBvZiBBbmd1bGFyICh0aGV5IGFyZSBqdXN0XG4gICAgLy8gZXh0cmEgdG9vbHMpIHdlIGNhbiBza2lwLW91dCBvbiBvbGRlciBicm93c2Vycy5cbiAgICBpZiAoIWNvbnNvbGUudGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBmZWF0dXJlIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBicm93c2VyJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB0YWJsZTogYW55W10gPSBbXTtcbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgY29uc3QgdG90YWxQcm9wcyA9IE1hdGguZmxvb3IoY29udGV4dC5sZW5ndGggLyBpdGVtc1BlclJvdyk7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBpc01hcEJhc2VkID0gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbiAgICAgIGNvbnN0IGVudHJ5OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgJ3RwbCBtYXNrJzogZ2VuZXJhdGVCaXRTdHJpbmcoZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICAgICdob3N0IG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSksIGlzTWFwQmFzZWQsIHRvdGFsUHJvcHMpLFxuICAgICAgfTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRUeXBlRnJvbUNvbHVtbihqLCB0b3RhbENvbHVtbnMpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKTtcbiAgICAgICAgZW50cnlba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgICAgdGFibGUucHVzaChlbnRyeSk7XG4gICAgfVxuXG4gICAgLyogdHNsaW50OmRpc2FibGUgKi9cbiAgICBjb25zb2xlLnRhYmxlKHRhYmxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUJpdFN0cmluZyh2YWx1ZTogbnVtYmVyLCBpc01hcEJhc2VkOiBib29sZWFuLCB0b3RhbFByb3BzOiBudW1iZXIpIHtcbiAgaWYgKGlzTWFwQmFzZWQgfHwgdmFsdWUgPiAxKSB7XG4gICAgcmV0dXJuIGAwYiR7bGVmdFBhZCh2YWx1ZS50b1N0cmluZygyKSwgdG90YWxQcm9wcywgJzAnKX1gO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsZWZ0UGFkKHZhbHVlOiBzdHJpbmcsIG1heDogbnVtYmVyLCBwYWQ6IHN0cmluZykge1xuICByZXR1cm4gcmVwZWF0KHBhZCwgbWF4IC0gdmFsdWUubGVuZ3RoKSArIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRUeXBlRnJvbUNvbHVtbihpbmRleDogbnVtYmVyLCB0b3RhbENvbHVtbnM6IG51bWJlcikge1xuICBpZiAoaW5kZXggPT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCkge1xuICAgIHJldHVybiAndGVtcGxhdGUnO1xuICB9IGVsc2UgaWYgKGluZGV4ID09PSB0b3RhbENvbHVtbnMgLSAxKSB7XG4gICAgcmV0dXJuICdkZWZhdWx0cyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGBkaXIgIyR7aW5kZXh9YDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXBlYXQoYzogc3RyaW5nLCB0aW1lczogbnVtYmVyKSB7XG4gIGxldCBzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGltZXM7IGkrKykge1xuICAgIHMgKz0gYztcbiAgfVxuICByZXR1cm4gcztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlU3R5bGluZ0RlYnVnIGltcGxlbWVudHMgRGVidWdOb2RlU3R5bGluZyB7XG4gIHByaXZhdGUgX3Nhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9kZWJ1Z0NvbnRleHQ6IERlYnVnU3R5bGluZ0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHR8RGVidWdTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfdE5vZGU6IFRTdHlsaW5nTm9kZSxcbiAgICAgIHByaXZhdGUgX2RhdGE6IExTdHlsaW5nRGF0YSwgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSA/XG4gICAgICAgIG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCwgX3ROb2RlLCBfaXNDbGFzc0Jhc2VkKSA6XG4gICAgICAgIChjb250ZXh0IGFzIERlYnVnU3R5bGluZ0NvbnRleHQpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQ7IH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpIHsgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0gPSB7fTtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSB0aGlzLl9pc0NsYXNzQmFzZWQ7XG5cbiAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAvLyB0aGUgZGlyZWN0IHBhc3MgY29kZSBkb2Vzbid0IGNvbnZlcnQgW3N0eWxlXSBvciBbY2xhc3NdIHZhbHVlc1xuICAgIC8vIGludG8gU3R5bGluZ01hcEFycmF5IGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uLCB0aGUgdmFsdWVzXG4gICAgLy8gbmVlZCB0byBiZSBjb252ZXJ0ZWQgYWhlYWQgb2YgdGltZSBzaW5jZSB0aGUgc3R5bGluZyBkZWJ1Z1xuICAgIC8vIHJlbGllcyBvbiBjb250ZXh0IHJlc29sdXRpb24gdG8gZmlndXJlIG91dCB3aGF0IHN0eWxpbmdcbiAgICAvLyB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkL3JlbW92ZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGNvbmZpZy5hbGxvd0RpcmVjdFN0eWxpbmcgJiYgY29uZmlnLmhhc01hcEJpbmRpbmdzKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQoW10pOyAgLy8gbWFrZSBhIGNvcHlcbiAgICAgIHRoaXMuX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tYXBWYWx1ZXMoZGF0YSwgKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuXG4gICAgLy8gYmVjYXVzZSB0aGUgc3R5bGluZyBhbGdvcml0aG0gcnVucyBpbnRvIHR3byBkaWZmZXJlbnRcbiAgICAvLyBtb2RlczogZGlyZWN0IGFuZCBjb250ZXh0LXJlc29sdXRpb24sIHRoZSBvdXRwdXQgb2YgdGhlIGVudHJpZXNcbiAgICAvLyBvYmplY3QgaXMgZGlmZmVyZW50IGJlY2F1c2UgdGhlIHJlbW92ZWQgdmFsdWVzIGFyZSBub3RcbiAgICAvLyBzYXZlZCBiZXR3ZWVuIHVwZGF0ZXMuIEZvciB0aGlzIHJlYXNvbiBhIHByb3h5IGlzIGNyZWF0ZWRcbiAgICAvLyBzbyB0aGF0IHRoZSBiZWhhdmlvciBpcyB0aGUgc2FtZSB3aGVuIGV4YW1pbmluZyB2YWx1ZXNcbiAgICAvLyB0aGF0IGFyZSBubyBsb25nZXIgYWN0aXZlIG9uIHRoZSBlbGVtZW50LlxuICAgIHJldHVybiBjcmVhdGVQcm94eSh7XG4gICAgICBnZXQodGFyZ2V0OiB7fSwgcHJvcDogc3RyaW5nKTogRGVidWdOb2RlU3R5bGluZ0VudHJ5e1xuICAgICAgICBsZXQgdmFsdWU6IERlYnVnTm9kZVN0eWxpbmdFbnRyeSA9IGVudHJpZXNbcHJvcF07IGlmICghdmFsdWUpIHtcbiAgICAgICAgICB2YWx1ZSA9IHtcbiAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICB2YWx1ZTogaXNDbGFzc0Jhc2VkID8gZmFsc2UgOiBudWxsLFxuICAgICAgICAgICAgYmluZGluZ0luZGV4OiBudWxsLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gcmV0dXJuIHZhbHVlO1xuICAgICAgfSxcbiAgICAgIHNldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgb3duS2V5cygpIHsgcmV0dXJuIE9iamVjdC5rZXlzKGVudHJpZXMpOyB9LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGs6IGFueSkge1xuICAgICAgICAvLyB3ZSB1c2UgYSBzcGVjaWFsIHByb3BlcnR5IGRlc2NyaXB0b3IgaGVyZSBzbyB0aGF0IGVudW1lcmF0aW9uIG9wZXJhdGlvbnNcbiAgICAgICAgLy8gc3VjaCBhcyBgT2JqZWN0LmtleXNgIHdpbGwgd29yayBvbiB0aGlzIHByb3h5LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldCBjb25maWcoKSB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLl90Tm9kZSwgdGhpcy5faXNDbGFzc0Jhc2VkKTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgdGhlIHN0eWxlcy9jbGFzc2VzIHRoYXQgd2VyZSBsYXN0IGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAqL1xuICBnZXQgdmFsdWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgIGxldCBkYXRhID0gdGhpcy5fZGF0YTtcblxuICAgIC8vIHRoZSBkaXJlY3QgcGFzcyBjb2RlIGRvZXNuJ3QgY29udmVydCBbc3R5bGVdIG9yIFtjbGFzc10gdmFsdWVzXG4gICAgLy8gaW50byBTdHlsaW5nTWFwQXJyYXkgaW5zdGFuY2VzLiBGb3IgdGhpcyByZWFzb24sIHRoZSB2YWx1ZXNcbiAgICAvLyBuZWVkIHRvIGJlIGNvbnZlcnRlZCBhaGVhZCBvZiB0aW1lIHNpbmNlIHRoZSBzdHlsaW5nIGRlYnVnXG4gICAgLy8gcmVsaWVzIG9uIGNvbnRleHQgcmVzb2x1dGlvbiB0byBmaWd1cmUgb3V0IHdoYXQgc3R5bGluZ1xuICAgIC8vIHZhbHVlcyBoYXZlIGJlZW4gYWRkZWQvcmVtb3ZlZCBvbiB0aGUgZWxlbWVudC5cbiAgICBpZiAoY29uZmlnLmFsbG93RGlyZWN0U3R5bGluZyAmJiBjb25maWcuaGFzTWFwQmluZGluZ3MpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChbXSk7ICAvLyBtYWtlIGEgY29weVxuICAgICAgdGhpcy5fY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX21hcFZhbHVlcyhkYXRhLCAocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7IGVudHJpZXNbcHJvcF0gPSB2YWx1ZTsgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICBwcml2YXRlIF9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YTogTFN0eWxpbmdEYXRhKSB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dC5jb250ZXh0O1xuICAgIGNvbnN0IGxpbWl0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCwgdGhpcy5fdE5vZGUsIHRoaXMuX2lzQ2xhc3NCYXNlZCk7XG4gICAgZm9yIChsZXQgaSA9XG4gICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgICAgICBpIDwgbGltaXQ7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiaW5kaW5nVmFsdWUgPSBiaW5kaW5nSW5kZXggIT09IDAgPyBnZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgpIDogbnVsbDtcbiAgICAgIGlmIChiaW5kaW5nVmFsdWUgJiYgIUFycmF5LmlzQXJyYXkoYmluZGluZ1ZhbHVlKSkge1xuICAgICAgICBjb25zdCBzdHlsaW5nTWFwQXJyYXkgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChudWxsLCBiaW5kaW5nVmFsdWUsICF0aGlzLl9pc0NsYXNzQmFzZWQpO1xuICAgICAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnJheSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfbWFwVmFsdWVzKFxuICAgICAgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgICAgZm46IChwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCkgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuICAgIGNvbnN0IG1hcEJpbmRpbmdzRmxhZyA9XG4gICAgICAgIHRoaXMuX2lzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncztcbiAgICBjb25zdCBoYXNNYXBzID0gaGFzQ29uZmlnKHRoaXMuX3ROb2RlLCBtYXBCaW5kaW5nc0ZsYWcpO1xuICAgIGlmIChoYXNNYXBzKSB7XG4gICAgICBhY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFwRm46IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAgICAgKHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgYmluZGluZ0luZGV4PzogbnVtYmVyIHwgbnVsbCkgPT4gZm4ocHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleCB8fCBudWxsKTtcblxuICAgIGNvbnN0IHNhbml0aXplciA9IHRoaXMuX2lzQ2xhc3NCYXNlZCA/IG51bGwgOiAodGhpcy5fc2FuaXRpemVyIHx8IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpKTtcblxuICAgIC8vIHJ1biB0aGUgdGVtcGxhdGUgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgdGhpcy5fdE5vZGUsIG51bGwsIG1vY2tFbGVtZW50LCBkYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCBmYWxzZSxcbiAgICAgICAgdGhpcy5faXNDbGFzc0Jhc2VkKTtcblxuICAgIC8vIGFuZCBhbHNvIHRoZSBob3N0IGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbnRleHQsIHRoaXMuX3ROb2RlLCBudWxsLCBtb2NrRWxlbWVudCwgZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgdHJ1ZSxcbiAgICAgICAgdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZENvbmZpZyh0Tm9kZTogVFN0eWxpbmdOb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBEZWJ1Z1N0eWxpbmdDb25maWcge1xuICBjb25zdCBoYXNNYXBCaW5kaW5ncyA9IGhhc0NvbmZpZyhcbiAgICAgIHROb2RlLCBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzTWFwQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3MpO1xuICBjb25zdCBoYXNQcm9wQmluZGluZ3MgPSBoYXNDb25maWcoXG4gICAgICB0Tm9kZSwgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc1Byb3BCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVQcm9wQmluZGluZ3MpO1xuICBjb25zdCBoYXNDb2xsaXNpb25zID0gaGFzQ29uZmlnKFxuICAgICAgdE5vZGUsXG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0R1cGxpY2F0ZUNsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0R1cGxpY2F0ZVN0eWxlQmluZGluZ3MpO1xuICBjb25zdCBoYXNUZW1wbGF0ZUJpbmRpbmdzID0gaGFzQ29uZmlnKFxuICAgICAgdE5vZGUsXG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc1RlbXBsYXRlQ2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVTdHlsZUJpbmRpbmdzKTtcbiAgY29uc3QgaGFzSG9zdEJpbmRpbmdzID0gaGFzQ29uZmlnKFxuICAgICAgdE5vZGUsIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzKTtcblxuICAvLyBgZmlyc3RUZW1wbGF0ZVBhc3NgIGhlcmUgaXMgZmFsc2UgYmVjYXVzZSB0aGUgY29udGV4dCBoYXMgYWxyZWFkeSBiZWVuIGNvbnN0cnVjdGVkXG4gIC8vIGRpcmVjdGx5IHdpdGhpbiB0aGUgYmVoYXZpb3Igb2YgdGhlIGRlYnVnZ2luZyB0b29scyAob3V0c2lkZSBvZiBzdHlsZS9jbGFzcyBkZWJ1Z2dpbmcsXG4gIC8vIHRoZSBjb250ZXh0IGlzIGNvbnN0cnVjdGVkIGR1cmluZyB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcykuXG4gIGNvbnN0IGFsbG93RGlyZWN0U3R5bGluZyA9IF9hbGxvd0RpcmVjdFN0eWxpbmcodE5vZGUsIGlzQ2xhc3NCYXNlZCwgZmFsc2UpO1xuICByZXR1cm4ge1xuICAgICAgaGFzTWFwQmluZGluZ3MsICAgICAgIC8vXG4gICAgICBoYXNQcm9wQmluZGluZ3MsICAgICAgLy9cbiAgICAgIGhhc0NvbGxpc2lvbnMsICAgICAgICAvL1xuICAgICAgaGFzVGVtcGxhdGVCaW5kaW5ncywgIC8vXG4gICAgICBoYXNIb3N0QmluZGluZ3MsICAgICAgLy9cbiAgICAgIGFsbG93RGlyZWN0U3R5bGluZywgICAvL1xuICB9O1xufVxuXG5cbi8qKlxuICogRmluZCB0aGUgaGVhZCBvZiB0aGUgc3R5bGluZyBiaW5kaW5nIGxpbmtlZCBsaXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ0JpbmRpbmdIZWFkKHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmluZGluZzogYm9vbGVhbik6IG51bWJlciB7XG4gIGxldCBpbmRleCA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KGlzQ2xhc3NCaW5kaW5nID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3MpO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHRTdHlsaW5nUmFuZ2UgPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgY29uc3QgcHJldiA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsaW5nUmFuZ2UpO1xuICAgIGlmIChwcmV2ID09PSAwKSB7XG4gICAgICAvLyBmb3VuZCBoZWFkIGV4aXQuXG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGV4ID0gcHJldjtcbiAgICB9XG4gIH1cbn0iXX0=