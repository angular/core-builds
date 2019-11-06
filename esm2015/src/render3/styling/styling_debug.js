/**
 * @fileoverview added by tsickle
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
 * A debug/testing-oriented summary of `TStylingConfig`.
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
 * @param {?} isClassBased
 * @return {?}
 */
export function attachStylingDebugObject(context, isClassBased) {
    /** @type {?} */
    const debug = new TStylingContextDebug(context, isClassBased);
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
     * @param {?} _isClassBased
     */
    constructor(context, _isClassBased) {
        this.context = context;
        this._isClassBased = _isClassBased;
    }
    /**
     * @return {?}
     */
    get config() { return buildConfig(this.context); }
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
        const start = getPropValuesStartPosition(context);
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
            let j = 3 /* ValuesStartPosition */;
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
        let i = 3 /* ValuesStartPosition */;
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
     * @param {?} _data
     * @param {?} _isClassBased
     */
    constructor(context, _data, _isClassBased) {
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
        this._debugContext = isStylingContext(context) ?
            new TStylingContextDebug((/** @type {?} */ (context)), _isClassBased) :
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
    get config() { return buildConfig(this.context.context); }
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
        const limit = getPropValuesStartPosition(context);
        for (let i = 3 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */; i < limit; i++) {
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
        const hasMaps = hasConfig(this.context.context, 4 /* HasMapBindings */);
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
        applyStylingViaContext(this.context.context, null, mockElement, data, true, mapFn, sanitizer, false);
        // and also the host bindings
        applyStylingViaContext(this.context.context, null, mockElement, data, true, mapFn, sanitizer, true);
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
    NodeStylingDebug.prototype._data;
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._isClassBased;
}
/**
 * @param {?} context
 * @return {?}
 */
function buildConfig(context) {
    /** @type {?} */
    const hasMapBindings = hasConfig(context, 4 /* HasMapBindings */);
    /** @type {?} */
    const hasPropBindings = hasConfig(context, 2 /* HasPropBindings */);
    /** @type {?} */
    const hasCollisions = hasConfig(context, 8 /* HasCollisions */);
    /** @type {?} */
    const hasTemplateBindings = hasConfig(context, 32 /* HasTemplateBindings */);
    /** @type {?} */
    const hasHostBindings = hasConfig(context, 64 /* HasHostBindings */);
    // `firstTemplatePass` here is false because the context has already been constructed
    // directly within the behavior of the debugging tools (outside of style/class debugging,
    // the context is constructed during the first template pass).
    /** @type {?} */
    const allowDirectStyling = _allowDirectStyling(context, false);
    return {
        hasMapBindings,
        hasPropBindings,
        hasCollisions,
        hasTemplateBindings,
        hasHostBindings,
        allowDirectStyling,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSTlDLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUUsa0JBQWtCLElBQUksbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTVVLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNsRCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQzs7Ozs7OztBQW1CL0QseUNBZUM7Ozs7OztJQWJDLHFDQUEyQjs7Ozs7SUFHM0Isc0NBQXlCOzs7OztJQUd6QixzQ0FBb0Q7Ozs7O0lBR3BELDZEQUFxQjs7Ozs7SUFHckIsMkRBQW1COzs7Ozs7QUFPckIsd0NBT0M7OztJQU5DLDRDQUF3Qjs7SUFDeEIsNkNBQXlCOztJQUN6QiwyQ0FBdUI7O0lBQ3ZCLGlEQUE2Qjs7SUFDN0IsNkNBQXlCOztJQUN6QixnREFBNEI7Ozs7OztBQU85Qiw4Q0FpQ0M7Ozs7OztJQS9CQyx3Q0FBYTs7Ozs7SUFHYiwrQ0FBb0I7Ozs7OztJQU1wQixtREFBd0I7Ozs7OztJQU14Qix1REFBNEI7Ozs7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LG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxPQUFPLCtCQUFxQzs7VUFDNUUsZUFBZSxHQUFHLFNBQVMsQ0FBQyxPQUFPLDJCQUFpQzs7Ozs7VUFLcEUsa0JBQWtCLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQztJQUM5RCxPQUFPO1FBQ0gsY0FBYztRQUNkLGVBQWU7UUFDZixhQUFhO1FBQ2IsbUJBQW1CO1FBQ25CLGVBQWU7UUFDZixrQkFBa0I7S0FDckIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge2NyZWF0ZVByb3h5fSBmcm9tICcuLi8uLi9kZWJ1Zy9wcm94eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgVFN0eWxpbmdDb25maWcsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge01BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgYWxsb3dEaXJlY3RTdHlsaW5nIGFzIF9hbGxvd0RpcmVjdFN0eWxpbmcsIGdldEJpbmRpbmdWYWx1ZSwgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGhhc0NvbmZpZywgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nQ29udGV4dCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHNldFZhbHVlfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ1ZpYUNvbnRleHR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBBIGRlYnVnLWZyaWVuZGx5IHZlcnNpb24gb2YgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhpcyBpcyBhdHRhY2hlZCB0byBgdFN0eWxpbmdDb250ZXh0LmRlYnVnYCB3aGVuIGBuZ0Rldk1vZGVgIGlzIGFjdGl2ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgLyoqIFRoZSBjb25maWd1cmF0aW9uIHNldHRpbmdzIG9mIHRoZSBhc3NvY2lhdGVkIGBUU3R5bGluZ0NvbnRleHRgICovXG4gIGNvbmZpZzogRGVidWdTdHlsaW5nQ29uZmlnO1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0O1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9O1xuXG4gIC8qKiBBIHN0YXR1cyByZXBvcnQgb2YgYWxsIHRoZSBzb3VyY2VzIHdpdGhpbiB0aGUgY29udGV4dCAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZDtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgZW50aXJlIGNvbnRleHQgYXMgYSB0YWJsZSAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBgVFN0eWxpbmdDb25maWdgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbmZpZyB7XG4gIGhhc01hcEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAvL1xuICBoYXNQcm9wQmluZGluZ3M6IGJvb2xlYW47ICAgICAgLy9cbiAgaGFzQ29sbGlzaW9uczogYm9vbGVhbjsgICAgICAgIC8vXG4gIGhhc1RlbXBsYXRlQmluZGluZ3M6IGJvb2xlYW47ICAvL1xuICBoYXNIb3N0QmluZGluZ3M6IGJvb2xlYW47ICAgICAgLy9cbiAgYWxsb3dEaXJlY3RTdHlsaW5nOiBib29sZWFuOyAgIC8vXG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIHdpdGhpbiBhIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeSB7XG4gIC8qKiBUaGUgcHJvcGVydHkgKHN0eWxlIG9yIGNsYXNzIHByb3BlcnR5KSB0aGF0IHRoaXMgZW50cnkgcmVwcmVzZW50cyAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBlbnRyaWVzIGEgcGFydCBvZiB0aGlzIGVudHJ5ICovXG4gIHZhbHVlc0NvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSB0ZW1wbGF0ZSBzdHlsZS9jbGFzcyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIHRlbXBsYXRlQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgaG9zdCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB1cGRhdGVcbiAgICovXG4gIGhvc3RCaW5kaW5nc0JpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGVudHJ5IHJlcXVpcmVzIHNhbml0aXphdGlvblxuICAgKi9cbiAgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBiZSBhcHBsaWVkIGlmIGFueSBiaW5kaW5ncyBhcmUgZmFsc3lcbiAgICovXG4gIGRlZmF1bHRWYWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKipcbiAgICogQWxsIGJpbmRpbmdJbmRleCBzb3VyY2VzIHRoYXQgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgZm9yIHRoaXMgc3R5bGVcbiAgICovXG4gIHNvdXJjZXM6IChudW1iZXJ8bnVsbHxzdHJpbmcpW107XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhbGwgc3R5bGluZyBlbnRyaWVzIGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmcge1xuICAvKiogVGhlIGFzc29jaWF0ZWQgZGVidWcgY29udGV4dCBvZiB0aGUgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IERlYnVnU3R5bGluZ0NvbnRleHQ7XG5cbiAgLyoqXG4gICAqIEEgc3VtbWFyaXphdGlvbiBvZiBlYWNoIHN0eWxlL2NsYXNzIHByb3BlcnR5XG4gICAqIHByZXNlbnQgaW4gdGhlIGNvbnRleHRcbiAgICovXG4gIHN1bW1hcnk6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9O1xuXG4gIC8qKlxuICAgKiBBIGtleS92YWx1ZSBtYXAgb2YgYWxsIHN0eWxpbmcgcHJvcGVydGllcyBhbmQgdGhlaXJcbiAgICogcnVudGltZSB2YWx1ZXNcbiAgICovXG4gIHZhbHVlczoge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCBib29sZWFufTtcblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlc1xuICAgKi9cbiAgb3ZlcnJpZGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBhIHN0eWxpbmcgZW50cnkuXG4gKlxuICogQSB2YWx1ZSBzdWNoIGFzIHRoaXMgaXMgZ2VuZXJhdGVkIGFzIGFuIGFydGlmYWN0IG9mIHRoZSBgRGVidWdTdHlsaW5nYFxuICogc3VtbWFyeS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGVTdHlsaW5nRW50cnkge1xuICAvKiogVGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IHRoYXQgdGhlIHN1bW1hcnkgaXMgYXR0YWNoZWQgdG8gKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgbGFzdCBhcHBsaWVkIHZhbHVlIGZvciB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqIFRoZSBiaW5kaW5nIGluZGV4IG9mIHRoZSBsYXN0IGFwcGxpZWQgc3R5bGUvY2xhc3MgcHJvcGVydHkgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGRlYnVnID0gbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQsIGlzQ2xhc3NCYXNlZCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIGltcGxlbWVudHMgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2lzQ2xhc3NCYXNlZDogYm9vbGVhbikge31cblxuICBnZXQgY29uZmlnKCk6IERlYnVnU3R5bGluZ0NvbmZpZyB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLmNvbnRleHQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogU2VlIGBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fSA9IHt9O1xuICAgIGNvbnN0IHN0YXJ0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZW50cmllc1twcm9wXSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgdGVtcGxhdGVCaXRNYXNrLFxuICAgICAgICBob3N0QmluZGluZ3NCaXRNYXNrLFxuICAgICAgICBzYW5pdGl6YXRpb25SZXF1aXJlZCxcbiAgICAgICAgdmFsdWVzQ291bnQ6IHNvdXJjZXMubGVuZ3RoLCBkZWZhdWx0VmFsdWUsIHNvdXJjZXMsXG4gICAgICB9O1xuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50cyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIHNvdXJjZSBncm91cGVkIHRvZ2V0aGVyIHdpdGggZWFjaCBiaW5kaW5nIGluZGV4IGluXG4gICAqIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgcHJpbnRTb3VyY2VzKCk6IHZvaWQge1xuICAgIGxldCBvdXRwdXQgPSAnXFxuJztcblxuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgcHJlZml4ID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gJ2NsYXNzJyA6ICdzdHlsZSc7XG4gICAgY29uc3QgYmluZGluZ3NCeVNvdXJjZToge1xuICAgICAgdHlwZTogc3RyaW5nLFxuICAgICAgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnksIGJpdE1hc2s6IG51bWJlcn1bXVxuICAgIH1bXSA9IFtdO1xuXG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdG90YWxDb2x1bW5zO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbENvbHVtbnM7IGkrKykge1xuICAgICAgY29uc3QgaXNEZWZhdWx0Q29sdW1uID0gaSA9PT0gdG90YWxDb2x1bW5zIC0gMTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpICE9PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG4gICAgICBjb25zdCB0eXBlID0gZ2V0VHlwZUZyb21Db2x1bW4oaSwgdG90YWxDb2x1bW5zKTtcbiAgICAgIGNvbnN0IGVudHJpZXM6IHtiaW5kaW5nOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyLCBiaXRNYXNrOiBudW1iZXJ9W10gPSBbXTtcblxuICAgICAgbGV0IGogPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgICAgd2hpbGUgKGogPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBqLCBpKTtcbiAgICAgICAgaWYgKGlzRGVmYXVsdENvbHVtbiB8fCB2YWx1ZSA+IDApIHtcbiAgICAgICAgICBjb25zdCBiaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGosIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGlzRGVmYXVsdENvbHVtbiA/IC0xIDogdmFsdWUgYXMgbnVtYmVyO1xuICAgICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmcgPSBgJHtwcmVmaXh9JHtpc01hcEJhc2VkID8gJycgOiAnLicgKyBwcm9wfWA7XG4gICAgICAgICAgZW50cmllcy5wdXNoKHtiaW5kaW5nLCB2YWx1ZSwgYmluZGluZ0luZGV4LCBiaXRNYXNrfSk7XG4gICAgICAgIH1cbiAgICAgICAgaiArPSBpdGVtc1BlclJvdztcbiAgICAgIH1cblxuICAgICAgYmluZGluZ3NCeVNvdXJjZS5wdXNoKFxuICAgICAgICAgIHt0eXBlLCBlbnRyaWVzOiBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGEuYmluZGluZ0luZGV4IC0gYi5iaW5kaW5nSW5kZXgpfSk7XG4gICAgfVxuXG4gICAgYmluZGluZ3NCeVNvdXJjZS5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgIG91dHB1dCArPSBgWyR7ZW50cnkudHlwZS50b1VwcGVyQ2FzZSgpfV1cXG5gO1xuICAgICAgb3V0cHV0ICs9IHJlcGVhdCgnLScsIGVudHJ5LnR5cGUubGVuZ3RoICsgMikgKyAnXFxuJztcblxuICAgICAgbGV0IHRhYiA9ICcgICc7XG4gICAgICBlbnRyeS5lbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBjb25zdCBpc0RlZmF1bHQgPSB0eXBlb2YgZW50cnkudmFsdWUgIT09ICdudW1iZXInO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGVudHJ5LnZhbHVlO1xuICAgICAgICBpZiAoIWlzRGVmYXVsdCB8fCB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgIG91dHB1dCArPSBgJHt0YWJ9WyR7ZW50cnkuYmluZGluZ31dID0gXFxgJHt2YWx1ZX1cXGBgO1xuICAgICAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBvdXRwdXQgKz0gJ1xcbic7XG4gICAgfSk7XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUubG9nKG91dHB1dCk7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgdGFibGUgb2YgdGhlIGVudGlyZSBzdHlsaW5nIGNvbnRleHQuXG4gICAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQge1xuICAgIC8vIElFIChub3QgRWRnZSkgaXMgdGhlIG9ubHkgYnJvd3NlciB0aGF0IGRvZXNuJ3Qgc3VwcG9ydCB0aGlzIGZlYXR1cmUuIEJlY2F1c2VcbiAgICAvLyB0aGVzZSBkZWJ1Z2dpbmcgdG9vbHMgYXJlIG5vdCBhcGFydCBvZiB0aGUgY29yZSBvZiBBbmd1bGFyICh0aGV5IGFyZSBqdXN0XG4gICAgLy8gZXh0cmEgdG9vbHMpIHdlIGNhbiBza2lwLW91dCBvbiBvbGRlciBicm93c2Vycy5cbiAgICBpZiAoIWNvbnNvbGUudGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBmZWF0dXJlIGlzIG5vdCBzdXBwb3J0ZWQgaW4geW91ciBicm93c2VyJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB0YWJsZTogYW55W10gPSBbXTtcbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgY29uc3QgdG90YWxQcm9wcyA9IE1hdGguZmxvb3IoY29udGV4dC5sZW5ndGggLyBpdGVtc1BlclJvdyk7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBpc01hcEJhc2VkID0gcHJvcCA9PT0gTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcbiAgICAgIGNvbnN0IGVudHJ5OiB7W2tleTogc3RyaW5nXTogYW55fSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgJ3RwbCBtYXNrJzogZ2VuZXJhdGVCaXRTdHJpbmcoZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICAgICdob3N0IG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSksIGlzTWFwQmFzZWQsIHRvdGFsUHJvcHMpLFxuICAgICAgfTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRUeXBlRnJvbUNvbHVtbihqLCB0b3RhbENvbHVtbnMpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKTtcbiAgICAgICAgZW50cnlba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgICAgdGFibGUucHVzaChlbnRyeSk7XG4gICAgfVxuXG4gICAgLyogdHNsaW50OmRpc2FibGUgKi9cbiAgICBjb25zb2xlLnRhYmxlKHRhYmxlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUJpdFN0cmluZyh2YWx1ZTogbnVtYmVyLCBpc01hcEJhc2VkOiBib29sZWFuLCB0b3RhbFByb3BzOiBudW1iZXIpIHtcbiAgaWYgKGlzTWFwQmFzZWQgfHwgdmFsdWUgPiAxKSB7XG4gICAgcmV0dXJuIGAwYiR7bGVmdFBhZCh2YWx1ZS50b1N0cmluZygyKSwgdG90YWxQcm9wcywgJzAnKX1gO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsZWZ0UGFkKHZhbHVlOiBzdHJpbmcsIG1heDogbnVtYmVyLCBwYWQ6IHN0cmluZykge1xuICByZXR1cm4gcmVwZWF0KHBhZCwgbWF4IC0gdmFsdWUubGVuZ3RoKSArIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRUeXBlRnJvbUNvbHVtbihpbmRleDogbnVtYmVyLCB0b3RhbENvbHVtbnM6IG51bWJlcikge1xuICBpZiAoaW5kZXggPT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCkge1xuICAgIHJldHVybiAndGVtcGxhdGUnO1xuICB9IGVsc2UgaWYgKGluZGV4ID09PSB0b3RhbENvbHVtbnMgLSAxKSB7XG4gICAgcmV0dXJuICdkZWZhdWx0cyc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGBkaXIgIyR7aW5kZXh9YDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXBlYXQoYzogc3RyaW5nLCB0aW1lczogbnVtYmVyKSB7XG4gIGxldCBzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGltZXM7IGkrKykge1xuICAgIHMgKz0gYztcbiAgfVxuICByZXR1cm4gcztcbn1cblxuLyoqXG4gKiBBIGh1bWFuLXJlYWRhYmxlIGRlYnVnIHN1bW1hcnkgb2YgdGhlIHN0eWxpbmcgZGF0YSBwcmVzZW50IGZvciBhIGBEZWJ1Z05vZGVgIGluc3RhbmNlLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlU3R5bGluZ0RlYnVnIGltcGxlbWVudHMgRGVidWdOb2RlU3R5bGluZyB7XG4gIHByaXZhdGUgX3Nhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9kZWJ1Z0NvbnRleHQ6IERlYnVnU3R5bGluZ0NvbnRleHQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHR8RGVidWdTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgICAgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGVidWdDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSA/XG4gICAgICAgIG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCwgX2lzQ2xhc3NCYXNlZCkgOlxuICAgICAgICAoY29udGV4dCBhcyBEZWJ1Z1N0eWxpbmdDb250ZXh0KTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCkgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0OyB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXMuXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKSB7IHRoaXMuX3Nhbml0aXplciA9IHNhbml0aXplcjsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQgYW5kXG4gICAqIHdoYXQgdGhlaXIgcnVudGltZSByZXByZXNlbnRhdGlvbiBpcy5cbiAgICpcbiAgICogU2VlIGBMU3R5bGluZ1N1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IHN1bW1hcnkoKToge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnl9ID0ge307XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gdGhpcy5faXNDbGFzc0Jhc2VkO1xuXG4gICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgLy8gdGhlIGRpcmVjdCBwYXNzIGNvZGUgZG9lc24ndCBjb252ZXJ0IFtzdHlsZV0gb3IgW2NsYXNzXSB2YWx1ZXNcbiAgICAvLyBpbnRvIFN0eWxpbmdNYXBBcnJheSBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiwgdGhlIHZhbHVlc1xuICAgIC8vIG5lZWQgdG8gYmUgY29udmVydGVkIGFoZWFkIG9mIHRpbWUgc2luY2UgdGhlIHN0eWxpbmcgZGVidWdcbiAgICAvLyByZWxpZXMgb24gY29udGV4dCByZXNvbHV0aW9uIHRvIGZpZ3VyZSBvdXQgd2hhdCBzdHlsaW5nXG4gICAgLy8gdmFsdWVzIGhhdmUgYmVlbiBhZGRlZC9yZW1vdmVkIG9uIHRoZSBlbGVtZW50LlxuICAgIGlmIChjb25maWcuYWxsb3dEaXJlY3RTdHlsaW5nICYmIGNvbmZpZy5oYXNNYXBCaW5kaW5ncykge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KFtdKTsgIC8vIG1ha2UgYSBjb3B5XG4gICAgICB0aGlzLl9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWFwVmFsdWVzKGRhdGEsIChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGJpbmRpbmdJbmRleDogbnVtYmVyIHwgbnVsbCkgPT4ge1xuICAgICAgZW50cmllc1twcm9wXSA9IHtwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4fTtcbiAgICB9KTtcblxuICAgIC8vIGJlY2F1c2UgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHJ1bnMgaW50byB0d28gZGlmZmVyZW50XG4gICAgLy8gbW9kZXM6IGRpcmVjdCBhbmQgY29udGV4dC1yZXNvbHV0aW9uLCB0aGUgb3V0cHV0IG9mIHRoZSBlbnRyaWVzXG4gICAgLy8gb2JqZWN0IGlzIGRpZmZlcmVudCBiZWNhdXNlIHRoZSByZW1vdmVkIHZhbHVlcyBhcmUgbm90XG4gICAgLy8gc2F2ZWQgYmV0d2VlbiB1cGRhdGVzLiBGb3IgdGhpcyByZWFzb24gYSBwcm94eSBpcyBjcmVhdGVkXG4gICAgLy8gc28gdGhhdCB0aGUgYmVoYXZpb3IgaXMgdGhlIHNhbWUgd2hlbiBleGFtaW5pbmcgdmFsdWVzXG4gICAgLy8gdGhhdCBhcmUgbm8gbG9uZ2VyIGFjdGl2ZSBvbiB0aGUgZWxlbWVudC5cbiAgICByZXR1cm4gY3JlYXRlUHJveHkoe1xuICAgICAgZ2V0KHRhcmdldDoge30sIHByb3A6IHN0cmluZyk6IERlYnVnTm9kZVN0eWxpbmdFbnRyeXtcbiAgICAgICAgbGV0IHZhbHVlOiBEZWJ1Z05vZGVTdHlsaW5nRW50cnkgPSBlbnRyaWVzW3Byb3BdOyBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgdmFsdWUgPSB7XG4gICAgICAgICAgICBwcm9wLFxuICAgICAgICAgICAgdmFsdWU6IGlzQ2xhc3NCYXNlZCA/IGZhbHNlIDogbnVsbCxcbiAgICAgICAgICAgIGJpbmRpbmdJbmRleDogbnVsbCxcbiAgICAgICAgICB9O1xuICAgICAgICB9IHJldHVybiB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBzZXQodGFyZ2V0OiB7fSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7IHJldHVybiBmYWxzZTsgfSxcbiAgICAgIG93bktleXMoKSB7IHJldHVybiBPYmplY3Qua2V5cyhlbnRyaWVzKTsgfSxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihrOiBhbnkpIHtcbiAgICAgICAgLy8gd2UgdXNlIGEgc3BlY2lhbCBwcm9wZXJ0eSBkZXNjcmlwdG9yIGhlcmUgc28gdGhhdCBlbnVtZXJhdGlvbiBvcGVyYXRpb25zXG4gICAgICAgIC8vIHN1Y2ggYXMgYE9iamVjdC5rZXlzYCB3aWxsIHdvcmsgb24gdGhpcyBwcm94eS5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBnZXQgY29uZmlnKCkgeyByZXR1cm4gYnVpbGRDb25maWcodGhpcy5jb250ZXh0LmNvbnRleHQpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWc7XG4gICAgbGV0IGRhdGEgPSB0aGlzLl9kYXRhO1xuXG4gICAgLy8gdGhlIGRpcmVjdCBwYXNzIGNvZGUgZG9lc24ndCBjb252ZXJ0IFtzdHlsZV0gb3IgW2NsYXNzXSB2YWx1ZXNcbiAgICAvLyBpbnRvIFN0eWxpbmdNYXBBcnJheSBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiwgdGhlIHZhbHVlc1xuICAgIC8vIG5lZWQgdG8gYmUgY29udmVydGVkIGFoZWFkIG9mIHRpbWUgc2luY2UgdGhlIHN0eWxpbmcgZGVidWdcbiAgICAvLyByZWxpZXMgb24gY29udGV4dCByZXNvbHV0aW9uIHRvIGZpZ3VyZSBvdXQgd2hhdCBzdHlsaW5nXG4gICAgLy8gdmFsdWVzIGhhdmUgYmVlbiBhZGRlZC9yZW1vdmVkIG9uIHRoZSBlbGVtZW50LlxuICAgIGlmIChjb25maWcuYWxsb3dEaXJlY3RTdHlsaW5nICYmIGNvbmZpZy5oYXNNYXBCaW5kaW5ncykge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KFtdKTsgIC8vIG1ha2UgYSBjb3B5XG4gICAgICB0aGlzLl9jb252ZXJ0TWFwQmluZGluZ3NUb1N0eWxpbmdNYXBBcnJheXMoZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbWFwVmFsdWVzKGRhdGEsIChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhOiBMU3R5bGluZ0RhdGEpIHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0LmNvbnRleHQ7XG4gICAgY29uc3QgbGltaXQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgICBmb3IgKGxldCBpID1cbiAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICAgICAgIGkgPCBsaW1pdDsgaSsrKSB7XG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2ldIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IGJpbmRpbmdWYWx1ZSA9IGJpbmRpbmdJbmRleCAhPT0gMCA/IGdldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCkgOiBudWxsO1xuICAgICAgaWYgKGJpbmRpbmdWYWx1ZSAmJiAhQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IHN0eWxpbmdNYXBBcnJheSA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG51bGwsIGJpbmRpbmdWYWx1ZSwgIXRoaXMuX2lzQ2xhc3NCYXNlZCk7XG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycmF5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9tYXBWYWx1ZXMoXG4gICAgICBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgICBmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsKSA9PiBhbnkpIHtcbiAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIHN0b3JlL3RyYWNrIGFuIGVsZW1lbnQgaW5zdGFuY2UuIFRoZVxuICAgIC8vIGVsZW1lbnQgaXMgb25seSB1c2VkIHdoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGF0dGVtcHRzIHRvXG4gICAgLy8gc3R5bGUgdGhlIHZhbHVlIChhbmQgd2UgbW9jayBvdXQgdGhlIHN0eWxpbmdBcHBseUZuIGFueXdheSkuXG4gICAgY29uc3QgbW9ja0VsZW1lbnQgPSB7fSBhcyBhbnk7XG4gICAgY29uc3QgaGFzTWFwcyA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQuY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpO1xuICAgIGlmIChoYXNNYXBzKSB7XG4gICAgICBhY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFwRm46IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAgICAgKHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLFxuICAgICAgICAgYmluZGluZ0luZGV4PzogbnVtYmVyIHwgbnVsbCkgPT4gZm4ocHJvcCwgdmFsdWUsIGJpbmRpbmdJbmRleCB8fCBudWxsKTtcblxuICAgIGNvbnN0IHNhbml0aXplciA9IHRoaXMuX2lzQ2xhc3NCYXNlZCA/IG51bGwgOiAodGhpcy5fc2FuaXRpemVyIHx8IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpKTtcblxuICAgIC8vIHJ1biB0aGUgdGVtcGxhdGUgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIGRhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIGZhbHNlKTtcblxuICAgIC8vIGFuZCBhbHNvIHRoZSBob3N0IGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbnRleHQsIG51bGwsIG1vY2tFbGVtZW50LCBkYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgY29uc3QgaGFzTWFwQmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpO1xuICBjb25zdCBoYXNQcm9wQmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzUHJvcEJpbmRpbmdzKTtcbiAgY29uc3QgaGFzQ29sbGlzaW9ucyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNDb2xsaXNpb25zKTtcbiAgY29uc3QgaGFzVGVtcGxhdGVCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNUZW1wbGF0ZUJpbmRpbmdzKTtcbiAgY29uc3QgaGFzSG9zdEJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0hvc3RCaW5kaW5ncyk7XG5cbiAgLy8gYGZpcnN0VGVtcGxhdGVQYXNzYCBoZXJlIGlzIGZhbHNlIGJlY2F1c2UgdGhlIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBjb25zdHJ1Y3RlZFxuICAvLyBkaXJlY3RseSB3aXRoaW4gdGhlIGJlaGF2aW9yIG9mIHRoZSBkZWJ1Z2dpbmcgdG9vbHMgKG91dHNpZGUgb2Ygc3R5bGUvY2xhc3MgZGVidWdnaW5nLFxuICAvLyB0aGUgY29udGV4dCBpcyBjb25zdHJ1Y3RlZCBkdXJpbmcgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MpLlxuICBjb25zdCBhbGxvd0RpcmVjdFN0eWxpbmcgPSBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIGZhbHNlKTtcbiAgcmV0dXJuIHtcbiAgICAgIGhhc01hcEJpbmRpbmdzLCAgICAgICAvL1xuICAgICAgaGFzUHJvcEJpbmRpbmdzLCAgICAgIC8vXG4gICAgICBoYXNDb2xsaXNpb25zLCAgICAgICAgLy9cbiAgICAgIGhhc1RlbXBsYXRlQmluZGluZ3MsICAvL1xuICAgICAgaGFzSG9zdEJpbmRpbmdzLCAgICAgIC8vXG4gICAgICBhbGxvd0RpcmVjdFN0eWxpbmcsICAgLy9cbiAgfTtcbn1cbiJdfQ==