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
    DebugStylingConfig.prototype.templateBindingsLocked;
    /** @type {?} */
    DebugStylingConfig.prototype.hostBindingsLocked;
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
    /** @type {?} */
    const templateBindingsLocked = hasConfig(context, 128 /* TemplateBindingsLocked */);
    /** @type {?} */
    const hostBindingsLocked = hasConfig(context, 256 /* HostBindingsLocked */);
    /** @type {?} */
    const allowDirectStyling = _allowDirectStyling(context, false) || _allowDirectStyling(context, true);
    return {
        hasMapBindings,
        hasPropBindings,
        hasCollisions,
        hasTemplateBindings,
        hasHostBindings,
        templateBindingsLocked,
        hostBindingsLocked,
        allowDirectStyling,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSTlDLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUUsa0JBQWtCLElBQUksbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFtQixzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU3VixPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7Ozs7Ozs7QUFtQi9ELHlDQWVDOzs7Ozs7SUFiQyxxQ0FBMkI7Ozs7O0lBRzNCLHNDQUF5Qjs7Ozs7SUFHekIsc0NBQW9EOzs7OztJQUdwRCw2REFBcUI7Ozs7O0lBR3JCLDJEQUFtQjs7Ozs7O0FBT3JCLHdDQVNDOzs7SUFSQyw0Q0FBd0I7O0lBQ3hCLDZDQUF5Qjs7SUFDekIsMkNBQXVCOztJQUN2QixpREFBNkI7O0lBQzdCLDZDQUF5Qjs7SUFDekIsb0RBQWdDOztJQUNoQyxnREFBNEI7O0lBQzVCLGdEQUE0Qjs7Ozs7O0FBTzlCLDhDQWlDQzs7Ozs7O0lBL0JDLHdDQUFhOzs7OztJQUdiLCtDQUFvQjs7Ozs7O0lBTXBC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LFNBQVMsQ0FBQyxPQUFPLHdCQUErQjs7VUFDaEUsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLE9BQU8sK0JBQXFDOztVQUM1RSxlQUFlLEdBQUcsU0FBUyxDQUFDLE9BQU8sMkJBQWlDOztVQUNwRSxzQkFBc0IsR0FBRyxTQUFTLENBQUMsT0FBTyxtQ0FBd0M7O1VBQ2xGLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxPQUFPLCtCQUFvQzs7VUFDMUUsa0JBQWtCLEdBQ3BCLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDO0lBRTdFLE9BQU87UUFDSCxjQUFjO1FBQ2QsZUFBZTtRQUNmLGFBQWE7UUFDYixtQkFBbUI7UUFDbkIsZUFBZTtRQUNmLHNCQUFzQjtRQUN0QixrQkFBa0I7UUFDbEIsa0JBQWtCO0tBQ3JCLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtjcmVhdGVQcm94eX0gZnJvbSAnLi4vLi4vZGVidWcvcHJveHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoRGVidWdPYmplY3R9IGZyb20gJy4uL3V0aWwvZGVidWdfdXRpbHMnO1xuaW1wb3J0IHtNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FLCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGFsbG93RGlyZWN0U3R5bGluZyBhcyBfYWxsb3dEaXJlY3RTdHlsaW5nLCBnZXRCaW5kaW5nVmFsdWUsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzQ29udGV4dExvY2tlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nQ29udGV4dCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHNldFZhbHVlfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5U3R5bGluZ1ZpYUNvbnRleHR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGRlYnVnIGZ1bmN0aW9uYWxpdHkgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBBIGRlYnVnLWZyaWVuZGx5IHZlcnNpb24gb2YgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhpcyBpcyBhdHRhY2hlZCB0byBgdFN0eWxpbmdDb250ZXh0LmRlYnVnYCB3aGVuIGBuZ0Rldk1vZGVgIGlzIGFjdGl2ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgLyoqIFRoZSBjb25maWd1cmF0aW9uIHNldHRpbmdzIG9mIHRoZSBhc3NvY2lhdGVkIGBUU3R5bGluZ0NvbnRleHRgICovXG4gIGNvbmZpZzogRGVidWdTdHlsaW5nQ29uZmlnO1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0O1xuXG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9O1xuXG4gIC8qKiBBIHN0YXR1cyByZXBvcnQgb2YgYWxsIHRoZSBzb3VyY2VzIHdpdGhpbiB0aGUgY29udGV4dCAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZDtcblxuICAvKiogQSBzdGF0dXMgcmVwb3J0IG9mIGFsbCB0aGUgZW50aXJlIGNvbnRleHQgYXMgYSB0YWJsZSAqL1xuICBwcmludFRhYmxlKCk6IHZvaWQ7XG59XG5cblxuLyoqXG4gKiBBIGRlYnVnL3Rlc3Rpbmctb3JpZW50ZWQgc3VtbWFyeSBvZiBgVFN0eWxpbmdDb25maWdgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnU3R5bGluZ0NvbmZpZyB7XG4gIGhhc01hcEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAgICAvL1xuICBoYXNQcm9wQmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgLy9cbiAgaGFzQ29sbGlzaW9uczogYm9vbGVhbjsgICAgICAgICAgIC8vXG4gIGhhc1RlbXBsYXRlQmluZGluZ3M6IGJvb2xlYW47ICAgICAvL1xuICBoYXNIb3N0QmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgLy9cbiAgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZDogYm9vbGVhbjsgIC8vXG4gIGhvc3RCaW5kaW5nc0xvY2tlZDogYm9vbGVhbjsgICAgICAvL1xuICBhbGxvd0RpcmVjdFN0eWxpbmc6IGJvb2xlYW47ICAgICAgLy9cbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5IHtcbiAgLyoqIFRoZSBwcm9wZXJ0eSAoc3R5bGUgb3IgY2xhc3MgcHJvcGVydHkpIHRoYXQgdGhpcyBlbnRyeSByZXByZXNlbnRzICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIGVudHJpZXMgYSBwYXJ0IG9mIHRoaXMgZW50cnkgKi9cbiAgdmFsdWVzQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IHRlbXBsYXRlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgdGVtcGxhdGVCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaXQgZ3VhcmQgbWFzayB0aGF0IGlzIHVzZWQgdG8gY29tcGFyZSBhbmQgcHJvdGVjdCBhZ2FpbnN0XG4gICAqIHN0eWxpbmcgY2hhbmdlcyB3aGVuIGFueSBob3N0IHN0eWxlL2NsYXNzIGJpbmRpbmdzIHVwZGF0ZVxuICAgKi9cbiAgaG9zdEJpbmRpbmdzQml0TWFzazogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgcmVxdWlyZXMgc2FuaXRpemF0aW9uXG4gICAqL1xuICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgdmFsdWUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgaWYgYW55IGJpbmRpbmdzIGFyZSBmYWxzeVxuICAgKi9cbiAgZGVmYXVsdFZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGwgYmluZGluZ0luZGV4IHNvdXJjZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgdGhpcyBzdHlsZVxuICAgKi9cbiAgc291cmNlczogKG51bWJlcnxudWxsfHN0cmluZylbXTtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZyB7XG4gIC8qKiBUaGUgYXNzb2NpYXRlZCBkZWJ1ZyBjb250ZXh0IG9mIHRoZSBUU3R5bGluZ0NvbnRleHQgaW5zdGFuY2UgKi9cbiAgY29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICAvKipcbiAgICogQSBzdW1tYXJpemF0aW9uIG9mIGVhY2ggc3R5bGUvY2xhc3MgcHJvcGVydHlcbiAgICogcHJlc2VudCBpbiB0aGUgY29udGV4dFxuICAgKi9cbiAgc3VtbWFyeToge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX07XG5cbiAgLyoqXG4gICAqIEEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgc3R5bGluZyBwcm9wZXJ0aWVzIGFuZCB0aGVpclxuICAgKiBydW50aW1lIHZhbHVlc1xuICAgKi9cbiAgdmFsdWVzOiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IGJvb2xlYW59O1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHNhbml0aXplciB1c2VkIHRvIHByb2Nlc3Mgc3R5bGVzXG4gICAqL1xuICBvdmVycmlkZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsKTogdm9pZDtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGEgc3R5bGluZyBlbnRyeS5cbiAqXG4gKiBBIHZhbHVlIHN1Y2ggYXMgdGhpcyBpcyBnZW5lcmF0ZWQgYXMgYW4gYXJ0aWZhY3Qgb2YgdGhlIGBEZWJ1Z1N0eWxpbmdgXG4gKiBzdW1tYXJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnTm9kZVN0eWxpbmdFbnRyeSB7XG4gIC8qKiBUaGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgdGhhdCB0aGUgc3VtbWFyeSBpcyBhdHRhY2hlZCB0byAqL1xuICBwcm9wOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBsYXN0IGFwcGxpZWQgdmFsdWUgZm9yIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbDtcblxuICAvKiogVGhlIGJpbmRpbmcgaW5kZXggb2YgdGhlIGxhc3QgYXBwbGllZCBzdHlsZS9jbGFzcyBwcm9wZXJ0eSAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGFuZCBhdHRhY2hlcyBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0RGVidWdgIHRvIHRoZSBwcm92aWRlZCBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCwgaXNDbGFzc0Jhc2VkKTtcbiAgYXR0YWNoRGVidWdPYmplY3QoY29udGV4dCwgZGVidWcpO1xuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCB3aXRoaW4gYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuY2xhc3MgVFN0eWxpbmdDb250ZXh0RGVidWcgaW1wbGVtZW50cyBEZWJ1Z1N0eWxpbmdDb250ZXh0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7fVxuXG4gIGdldCBjb25maWcoKTogRGVidWdTdHlsaW5nQ29uZmlnIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGRldGFpbGVkIHN1bW1hcnkgb2YgZWFjaCBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBTZWUgYERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeWAuXG4gICAqL1xuICBnZXQgZW50cmllcygpOiB7W3Byb3A6IHN0cmluZ106IERlYnVnU3R5bGluZ0NvbnRleHRFbnRyeX0ge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgY29uc3QgdG90YWxDb2x1bW5zID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgY29uc3QgZW50cmllczoge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9ID0ge307XG4gICAgY29uc3Qgc3RhcnQgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgICBsZXQgaSA9IHN0YXJ0O1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgdGVtcGxhdGVCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIGNvbnN0IGhvc3RCaW5kaW5nc0JpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgdHJ1ZSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcblxuICAgICAgY29uc3Qgc291cmNlczogKG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbENvbHVtbnM7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2JpbmRpbmdzU3RhcnRQb3NpdGlvbiArIGpdIGFzIG51bWJlciB8IHN0cmluZyB8IG51bGw7XG4gICAgICAgIGlmIChiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBzb3VyY2VzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlbnRyaWVzW3Byb3BdID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICB0ZW1wbGF0ZUJpdE1hc2ssXG4gICAgICAgIGhvc3RCaW5kaW5nc0JpdE1hc2ssXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkLFxuICAgICAgICB2YWx1ZXNDb3VudDogc291cmNlcy5sZW5ndGgsIGRlZmF1bHRWYWx1ZSwgc291cmNlcyxcbiAgICAgIH07XG5cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJpbnRzIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgc291cmNlIGdyb3VwZWQgdG9nZXRoZXIgd2l0aCBlYWNoIGJpbmRpbmcgaW5kZXggaW5cbiAgICogdGhlIGNvbnRleHQuXG4gICAqL1xuICBwcmludFNvdXJjZXMoKTogdm9pZCB7XG4gICAgbGV0IG91dHB1dCA9ICdcXG4nO1xuXG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyAnY2xhc3MnIDogJ3N0eWxlJztcbiAgICBjb25zdCBiaW5kaW5nc0J5U291cmNlOiB7XG4gICAgICB0eXBlOiBzdHJpbmcsXG4gICAgICBlbnRyaWVzOiB7YmluZGluZzogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSwgYml0TWFzazogbnVtYmVyfVtdXG4gICAgfVtdID0gW107XG5cbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQ29sdW1uczsgaSsrKSB7XG4gICAgICBjb25zdCBpc0RlZmF1bHRDb2x1bW4gPSBpID09PSB0b3RhbENvbHVtbnMgLSAxO1xuICAgICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGkgIT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbiAgICAgIGNvbnN0IHR5cGUgPSBnZXRUeXBlRnJvbUNvbHVtbihpLCB0b3RhbENvbHVtbnMpO1xuICAgICAgY29uc3QgZW50cmllczoge2JpbmRpbmc6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIsIGJpdE1hc2s6IG51bWJlcn1bXSA9IFtdO1xuXG4gICAgICBsZXQgaiA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgICB3aGlsZSAoaiA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGosIGkpO1xuICAgICAgICBpZiAoaXNEZWZhdWx0Q29sdW1uIHx8IHZhbHVlID4gMCkge1xuICAgICAgICAgIGNvbnN0IGJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaiwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gaXNEZWZhdWx0Q29sdW1uID8gLTEgOiB2YWx1ZSBhcyBudW1iZXI7XG4gICAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgaXNNYXBCYXNlZCA9IHByb3AgPT09IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG4gICAgICAgICAgY29uc3QgYmluZGluZyA9IGAke3ByZWZpeH0ke2lzTWFwQmFzZWQgPyAnJyA6ICcuJyArIHByb3B9YDtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goe2JpbmRpbmcsIHZhbHVlLCBiaW5kaW5nSW5kZXgsIGJpdE1hc2t9KTtcbiAgICAgICAgfVxuICAgICAgICBqICs9IGl0ZW1zUGVyUm93O1xuICAgICAgfVxuXG4gICAgICBiaW5kaW5nc0J5U291cmNlLnB1c2goXG4gICAgICAgICAge3R5cGUsIGVudHJpZXM6IGVudHJpZXMuc29ydCgoYSwgYikgPT4gYS5iaW5kaW5nSW5kZXggLSBiLmJpbmRpbmdJbmRleCl9KTtcbiAgICB9XG5cbiAgICBiaW5kaW5nc0J5U291cmNlLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgb3V0cHV0ICs9IGBbJHtlbnRyeS50eXBlLnRvVXBwZXJDYXNlKCl9XVxcbmA7XG4gICAgICBvdXRwdXQgKz0gcmVwZWF0KCctJywgZW50cnkudHlwZS5sZW5ndGggKyAyKSArICdcXG4nO1xuXG4gICAgICBsZXQgdGFiID0gJyAgJztcbiAgICAgIGVudHJ5LmVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIGNvbnN0IGlzRGVmYXVsdCA9IHR5cGVvZiBlbnRyeS52YWx1ZSAhPT0gJ251bWJlcic7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZW50cnkudmFsdWU7XG4gICAgICAgIGlmICghaXNEZWZhdWx0IHx8IHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgb3V0cHV0ICs9IGAke3RhYn1bJHtlbnRyeS5iaW5kaW5nfV0gPSBcXGAke3ZhbHVlfVxcYGA7XG4gICAgICAgICAgb3V0cHV0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG91dHB1dCArPSAnXFxuJztcbiAgICB9KTtcblxuICAgIC8qIHRzbGludDpkaXNhYmxlICovXG4gICAgY29uc29sZS5sb2cob3V0cHV0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmludHMgYSBkZXRhaWxlZCB0YWJsZSBvZiB0aGUgZW50aXJlIHN0eWxpbmcgY29udGV4dC5cbiAgICovXG4gIHByaW50VGFibGUoKTogdm9pZCB7XG4gICAgLy8gSUUgKG5vdCBFZGdlKSBpcyB0aGUgb25seSBicm93c2VyIHRoYXQgZG9lc24ndCBzdXBwb3J0IHRoaXMgZmVhdHVyZS4gQmVjYXVzZVxuICAgIC8vIHRoZXNlIGRlYnVnZ2luZyB0b29scyBhcmUgbm90IGFwYXJ0IG9mIHRoZSBjb3JlIG9mIEFuZ3VsYXIgKHRoZXkgYXJlIGp1c3RcbiAgICAvLyBleHRyYSB0b29scykgd2UgY2FuIHNraXAtb3V0IG9uIG9sZGVyIGJyb3dzZXJzLlxuICAgIGlmICghY29uc29sZS50YWJsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGZlYXR1cmUgaXMgbm90IHN1cHBvcnRlZCBpbiB5b3VyIGJyb3dzZXInKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRhYmxlOiBhbnlbXSA9IFtdO1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHRvdGFsQ29sdW1ucztcbiAgICBjb25zdCB0b3RhbFByb3BzID0gTWF0aC5mbG9vcihjb250ZXh0Lmxlbmd0aCAvIGl0ZW1zUGVyUm93KTtcblxuICAgIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGlzTWFwQmFzZWQgPSBwcm9wID09PSBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuICAgICAgY29uc3QgZW50cnk6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge1xuICAgICAgICBwcm9wLFxuICAgICAgICAndHBsIG1hc2snOiBnZW5lcmF0ZUJpdFN0cmluZyhnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgZmFsc2UpLCBpc01hcEJhc2VkLCB0b3RhbFByb3BzKSxcbiAgICAgICAgJ2hvc3QgbWFzayc6IGdlbmVyYXRlQml0U3RyaW5nKGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCB0cnVlKSwgaXNNYXBCYXNlZCwgdG90YWxQcm9wcyksXG4gICAgICB9O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQ29sdW1uczsgaisrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGdldFR5cGVGcm9tQ29sdW1uKGosIHRvdGFsQ29sdW1ucyk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopO1xuICAgICAgICBlbnRyeVtrZXldID0gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGkgKz0gaXRlbXNQZXJSb3c7XG4gICAgICB0YWJsZS5wdXNoKGVudHJ5KTtcbiAgICB9XG5cbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgIGNvbnNvbGUudGFibGUodGFibGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQml0U3RyaW5nKHZhbHVlOiBudW1iZXIsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIHRvdGFsUHJvcHM6IG51bWJlcikge1xuICBpZiAoaXNNYXBCYXNlZCB8fCB2YWx1ZSA+IDEpIHtcbiAgICByZXR1cm4gYDBiJHtsZWZ0UGFkKHZhbHVlLnRvU3RyaW5nKDIpLCB0b3RhbFByb3BzLCAnMCcpfWA7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxlZnRQYWQodmFsdWU6IHN0cmluZywgbWF4OiBudW1iZXIsIHBhZDogc3RyaW5nKSB7XG4gIHJldHVybiByZXBlYXQocGFkLCBtYXggLSB2YWx1ZS5sZW5ndGgpICsgdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFR5cGVGcm9tQ29sdW1uKGluZGV4OiBudW1iZXIsIHRvdGFsQ29sdW1uczogbnVtYmVyKSB7XG4gIGlmIChpbmRleCA9PT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKSB7XG4gICAgcmV0dXJuICd0ZW1wbGF0ZSc7XG4gIH0gZWxzZSBpZiAoaW5kZXggPT09IHRvdGFsQ29sdW1ucyAtIDEpIHtcbiAgICByZXR1cm4gJ2RlZmF1bHRzJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYGRpciAjJHtpbmRleH1gO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcGVhdChjOiBzdHJpbmcsIHRpbWVzOiBudW1iZXIpIHtcbiAgbGV0IHMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lczsgaSsrKSB7XG4gICAgcyArPSBjO1xuICB9XG4gIHJldHVybiBzO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgZm9yIGEgYERlYnVnTm9kZWAgaW5zdGFuY2UuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVTdHlsaW5nRGVidWcgaW1wbGVtZW50cyBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgcHJpdmF0ZSBfc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2RlYnVnQ29udGV4dDogRGVidWdTdHlsaW5nQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dHxEZWJ1Z1N0eWxpbmdDb250ZXh0LCBwcml2YXRlIF9kYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgICBwcml2YXRlIF9pc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpID9cbiAgICAgICAgbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCBfaXNDbGFzc0Jhc2VkKSA6XG4gICAgICAgIChjb250ZXh0IGFzIERlYnVnU3R5bGluZ0NvbnRleHQpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQ7IH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpIHsgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0gPSB7fTtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSB0aGlzLl9pc0NsYXNzQmFzZWQ7XG5cbiAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAvLyB0aGUgZGlyZWN0IHBhc3MgY29kZSBkb2Vzbid0IGNvbnZlcnQgW3N0eWxlXSBvciBbY2xhc3NdIHZhbHVlc1xuICAgIC8vIGludG8gU3R5bGluZ01hcEFycmF5IGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uLCB0aGUgdmFsdWVzXG4gICAgLy8gbmVlZCB0byBiZSBjb252ZXJ0ZWQgYWhlYWQgb2YgdGltZSBzaW5jZSB0aGUgc3R5bGluZyBkZWJ1Z1xuICAgIC8vIHJlbGllcyBvbiBjb250ZXh0IHJlc29sdXRpb24gdG8gZmlndXJlIG91dCB3aGF0IHN0eWxpbmdcbiAgICAvLyB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkL3JlbW92ZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGNvbmZpZy5hbGxvd0RpcmVjdFN0eWxpbmcgJiYgY29uZmlnLmhhc01hcEJpbmRpbmdzKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQoW10pOyAgLy8gbWFrZSBhIGNvcHlcbiAgICAgIHRoaXMuX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tYXBWYWx1ZXMoZGF0YSwgKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuXG4gICAgLy8gYmVjYXVzZSB0aGUgc3R5bGluZyBhbGdvcml0aG0gcnVucyBpbnRvIHR3byBkaWZmZXJlbnRcbiAgICAvLyBtb2RlczogZGlyZWN0IGFuZCBjb250ZXh0LXJlc29sdXRpb24sIHRoZSBvdXRwdXQgb2YgdGhlIGVudHJpZXNcbiAgICAvLyBvYmplY3QgaXMgZGlmZmVyZW50IGJlY2F1c2UgdGhlIHJlbW92ZWQgdmFsdWVzIGFyZSBub3RcbiAgICAvLyBzYXZlZCBiZXR3ZWVuIHVwZGF0ZXMuIEZvciB0aGlzIHJlYXNvbiBhIHByb3h5IGlzIGNyZWF0ZWRcbiAgICAvLyBzbyB0aGF0IHRoZSBiZWhhdmlvciBpcyB0aGUgc2FtZSB3aGVuIGV4YW1pbmluZyB2YWx1ZXNcbiAgICAvLyB0aGF0IGFyZSBubyBsb25nZXIgYWN0aXZlIG9uIHRoZSBlbGVtZW50LlxuICAgIHJldHVybiBjcmVhdGVQcm94eSh7XG4gICAgICBnZXQodGFyZ2V0OiB7fSwgcHJvcDogc3RyaW5nKTogRGVidWdOb2RlU3R5bGluZ0VudHJ5e1xuICAgICAgICBsZXQgdmFsdWU6IERlYnVnTm9kZVN0eWxpbmdFbnRyeSA9IGVudHJpZXNbcHJvcF07IGlmICghdmFsdWUpIHtcbiAgICAgICAgICB2YWx1ZSA9IHtcbiAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICB2YWx1ZTogaXNDbGFzc0Jhc2VkID8gZmFsc2UgOiBudWxsLFxuICAgICAgICAgICAgYmluZGluZ0luZGV4OiBudWxsLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gcmV0dXJuIHZhbHVlO1xuICAgICAgfSxcbiAgICAgIHNldCh0YXJnZXQ6IHt9LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgb3duS2V5cygpIHsgcmV0dXJuIE9iamVjdC5rZXlzKGVudHJpZXMpOyB9LFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGs6IGFueSkge1xuICAgICAgICAvLyB3ZSB1c2UgYSBzcGVjaWFsIHByb3BlcnR5IGRlc2NyaXB0b3IgaGVyZSBzbyB0aGF0IGVudW1lcmF0aW9uIG9wZXJhdGlvbnNcbiAgICAgICAgLy8gc3VjaCBhcyBgT2JqZWN0LmtleXNgIHdpbGwgd29yayBvbiB0aGlzIHByb3h5LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldCBjb25maWcoKSB7IHJldHVybiBidWlsZENvbmZpZyh0aGlzLmNvbnRleHQuY29udGV4dCk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGtleS92YWx1ZSBtYXAgb2YgYWxsIHRoZSBzdHlsZXMvY2xhc3NlcyB0aGF0IHdlcmUgbGFzdCBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgKi9cbiAgZ2V0IHZhbHVlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGE7XG5cbiAgICAvLyB0aGUgZGlyZWN0IHBhc3MgY29kZSBkb2Vzbid0IGNvbnZlcnQgW3N0eWxlXSBvciBbY2xhc3NdIHZhbHVlc1xuICAgIC8vIGludG8gU3R5bGluZ01hcEFycmF5IGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uLCB0aGUgdmFsdWVzXG4gICAgLy8gbmVlZCB0byBiZSBjb252ZXJ0ZWQgYWhlYWQgb2YgdGltZSBzaW5jZSB0aGUgc3R5bGluZyBkZWJ1Z1xuICAgIC8vIHJlbGllcyBvbiBjb250ZXh0IHJlc29sdXRpb24gdG8gZmlndXJlIG91dCB3aGF0IHN0eWxpbmdcbiAgICAvLyB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkL3JlbW92ZWQgb24gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGNvbmZpZy5hbGxvd0RpcmVjdFN0eWxpbmcgJiYgY29uZmlnLmhhc01hcEJpbmRpbmdzKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQoW10pOyAgLy8gbWFrZSBhIGNvcHlcbiAgICAgIHRoaXMuX2NvbnZlcnRNYXBCaW5kaW5nc1RvU3R5bGluZ01hcEFycmF5cyhkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tYXBWYWx1ZXMoZGF0YSwgKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkgPT4geyBlbnRyaWVzW3Byb3BdID0gdmFsdWU7IH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29udmVydE1hcEJpbmRpbmdzVG9TdHlsaW5nTWFwQXJyYXlzKGRhdGE6IExTdHlsaW5nRGF0YSkge1xuICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmNvbnRleHQuY29udGV4dDtcbiAgICBjb25zdCBsaW1pdCA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIGZvciAobGV0IGkgPVxuICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgICAgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYmluZGluZ1ZhbHVlID0gYmluZGluZ0luZGV4ICE9PSAwID8gZ2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4KSA6IG51bGw7XG4gICAgICBpZiAoYmluZGluZ1ZhbHVlICYmICFBcnJheS5pc0FycmF5KGJpbmRpbmdWYWx1ZSkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGluZ01hcEFycmF5ID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAobnVsbCwgYmluZGluZ1ZhbHVlLCAhdGhpcy5faXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyYXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhcbiAgICAgIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIGZuOiAocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGwpID0+IGFueSkge1xuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3RvcmUvdHJhY2sgYW4gZWxlbWVudCBpbnN0YW5jZS4gVGhlXG4gICAgLy8gZWxlbWVudCBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gYXR0ZW1wdHMgdG9cbiAgICAvLyBzdHlsZSB0aGUgdmFsdWUgKGFuZCB3ZSBtb2NrIG91dCB0aGUgc3R5bGluZ0FwcGx5Rm4gYW55d2F5KS5cbiAgICBjb25zdCBtb2NrRWxlbWVudCA9IHt9IGFzIGFueTtcbiAgICBjb25zdCBoYXNNYXBzID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dC5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gICAgaWYgKGhhc01hcHMpIHtcbiAgICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXBGbjogQXBwbHlTdHlsaW5nRm4gPVxuICAgICAgICAocmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsXG4gICAgICAgICBiaW5kaW5nSW5kZXg/OiBudW1iZXIgfCBudWxsKSA9PiBmbihwcm9wLCB2YWx1ZSwgYmluZGluZ0luZGV4IHx8IG51bGwpO1xuXG4gICAgY29uc3Qgc2FuaXRpemVyID0gdGhpcy5faXNDbGFzc0Jhc2VkID8gbnVsbCA6ICh0aGlzLl9zYW5pdGl6ZXIgfHwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpO1xuXG4gICAgLy8gcnVuIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgZmFsc2UpO1xuXG4gICAgLy8gYW5kIGFsc28gdGhlIGhvc3QgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQuY29udGV4dCwgbnVsbCwgbW9ja0VsZW1lbnQsIGRhdGEsIHRydWUsIG1hcEZuLCBzYW5pdGl6ZXIsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICBjb25zdCBoYXNNYXBCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc1Byb3BCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpO1xuICBjb25zdCBoYXNDb2xsaXNpb25zID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpO1xuICBjb25zdCBoYXNUZW1wbGF0ZUJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICBjb25zdCBoYXNIb3N0QmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzKTtcbiAgY29uc3QgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5UZW1wbGF0ZUJpbmRpbmdzTG9ja2VkKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTG9ja2VkID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhvc3RCaW5kaW5nc0xvY2tlZCk7XG4gIGNvbnN0IGFsbG93RGlyZWN0U3R5bGluZyA9XG4gICAgICBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIGZhbHNlKSB8fCBfYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIHRydWUpO1xuXG4gIHJldHVybiB7XG4gICAgICBoYXNNYXBCaW5kaW5ncywgICAgICAgICAgLy9cbiAgICAgIGhhc1Byb3BCaW5kaW5ncywgICAgICAgICAvL1xuICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgICAgIC8vXG4gICAgICBoYXNUZW1wbGF0ZUJpbmRpbmdzLCAgICAgLy9cbiAgICAgIGhhc0hvc3RCaW5kaW5ncywgICAgICAgICAvL1xuICAgICAgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCwgIC8vXG4gICAgICBob3N0QmluZGluZ3NMb2NrZWQsICAgICAgLy9cbiAgICAgIGFsbG93RGlyZWN0U3R5bGluZywgICAgICAvL1xuICB9O1xufVxuIl19