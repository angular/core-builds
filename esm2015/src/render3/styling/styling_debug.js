/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { getCurrentStyleSanitizer } from '../state';
import { attachDebugObject } from '../util/debug_utils';
import { allowDirectStyling as _allowDirectStyling, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValuesCount, hasConfig, isSanitizationRequired, isStylingContext } from '../util/styling_utils';
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
     * The property (style or class property) that this tuple represents
     * @type {?}
     */
    DebugStylingContextEntry.prototype.prop;
    /**
     * The total amount of styling entries a part of this tuple
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
 * @return {?}
 */
export function attachStylingDebugObject(context) {
    /** @type {?} */
    const debug = new TStylingContextDebug(context);
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
     */
    constructor(context) {
        this.context = context;
    }
    /**
     * @return {?}
     */
    get config() { return buildConfig(this.context); }
    /**
     * Returns a detailed summary of each styling entry in the context.
     *
     * See `TStylingTupleSummary`.
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
}
if (false) {
    /** @type {?} */
    TStylingContextDebug.prototype.context;
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
     * @param {?=} _isClassBased
     */
    constructor(context, _data, _isClassBased) {
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
        this._debugContext = isStylingContext(context) ?
            new TStylingContextDebug((/** @type {?} */ (context))) :
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
        this._mapValues((/**
         * @param {?} prop
         * @param {?} value
         * @param {?} bindingIndex
         * @return {?}
         */
        (prop, value, bindingIndex) => {
            entries[prop] = { prop, value, bindingIndex };
        }));
        return entries;
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
        this._mapValues((/**
         * @param {?} prop
         * @param {?} value
         * @return {?}
         */
        (prop, value) => { entries[prop] = value; }));
        return entries;
    }
    /**
     * @private
     * @param {?} fn
     * @return {?}
     */
    _mapValues(fn) {
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
        applyStylingViaContext(this.context.context, null, mockElement, this._data, true, mapFn, sanitizer, false);
        // and also the host bindings
        applyStylingViaContext(this.context.context, null, mockElement, this._data, true, mapFn, sanitizer, true);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy9zdHlsaW5nX2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFVQSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLGtCQUFrQixJQUFJLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQW1CLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFMU8sT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7O0FBbUIvRCx5Q0FTQzs7Ozs7O0lBUEMscUNBQTJCOzs7OztJQUczQixzQ0FBeUI7Ozs7O0lBR3pCLHNDQUFvRDs7Ozs7O0FBT3RELHdDQVNDOzs7SUFSQyw0Q0FBd0I7O0lBQ3hCLDZDQUF5Qjs7SUFDekIsMkNBQXVCOztJQUN2QixpREFBNkI7O0lBQzdCLDZDQUF5Qjs7SUFDekIsb0RBQWdDOztJQUNoQyxnREFBNEI7O0lBQzVCLGdEQUE0Qjs7Ozs7O0FBTzlCLDhDQWlDQzs7Ozs7O0lBL0JDLHdDQUFhOzs7OztJQUdiLCtDQUFvQjs7Ozs7O0lBTXBCLG1EQUF3Qjs7Ozs7O0lBTXhCLHVEQUE0Qjs7Ozs7SUFLNUIsd0RBQThCOzs7OztJQUs5QixnREFBa0M7Ozs7O0lBS2xDLDJDQUFnQzs7Ozs7O0FBT2xDLHNDQW9CQzs7Ozs7O0lBbEJDLG1DQUE2Qjs7Ozs7O0lBTTdCLG1DQUF5RDs7Ozs7O0lBTXpELGtDQUFtRTs7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QUNiLG1CQUFtQjtRQUNuQixlQUFlO1FBQ2Ysc0JBQXNCO1FBQ3RCLGtCQUFrQjtRQUNsQixrQkFBa0I7S0FDckIsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgVFN0eWxpbmdDb25maWcsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2FsbG93RGlyZWN0U3R5bGluZyBhcyBfYWxsb3dEaXJlY3RTdHlsaW5nLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzQ29udGV4dExvY2tlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHthcHBseVN0eWxpbmdWaWFDb250ZXh0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBkZWJ1ZyBmdW5jdGlvbmFsaXR5IGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBkZWJ1Zy1mcmllbmRseSB2ZXJzaW9uIG9mIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEFuIGluc3RhbmNlIG9mIHRoaXMgaXMgYXR0YWNoZWQgdG8gYHRTdHlsaW5nQ29udGV4dC5kZWJ1Z2Agd2hlbiBgbmdEZXZNb2RlYCBpcyBhY3RpdmUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIC8qKiBUaGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBvZiB0aGUgYXNzb2NpYXRlZCBgVFN0eWxpbmdDb250ZXh0YCAqL1xuICBjb25maWc6IERlYnVnU3R5bGluZ0NvbmZpZztcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fTtcbn1cblxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGBUU3R5bGluZ0NvbmZpZ2AuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdTdHlsaW5nQ29uZmlnIHtcbiAgaGFzTWFwQmluZGluZ3M6IGJvb2xlYW47ICAgICAgICAgIC8vXG4gIGhhc1Byb3BCaW5kaW5nczogYm9vbGVhbjsgICAgICAgICAvL1xuICBoYXNDb2xsaXNpb25zOiBib29sZWFuOyAgICAgICAgICAgLy9cbiAgaGFzVGVtcGxhdGVCaW5kaW5nczogYm9vbGVhbjsgICAgIC8vXG4gIGhhc0hvc3RCaW5kaW5nczogYm9vbGVhbjsgICAgICAgICAvL1xuICB0ZW1wbGF0ZUJpbmRpbmdzTG9ja2VkOiBib29sZWFuOyAgLy9cbiAgaG9zdEJpbmRpbmdzTG9ja2VkOiBib29sZWFuOyAgICAgIC8vXG4gIGFsbG93RGlyZWN0U3R5bGluZzogYm9vbGVhbjsgICAgICAvL1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyB3aXRoaW4gYSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIHR1cGxlIHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhIHBhcnQgb2YgdGhpcyB0dXBsZSAqL1xuICB2YWx1ZXNDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgdGVtcGxhdGUgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICB0ZW1wbGF0ZUJpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IGhvc3Qgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICBob3N0QmluZGluZ3NCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSByZXF1aXJlcyBzYW5pdGl6YXRpb25cbiAgICovXG4gIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSB0aGF0IHdpbGwgYmUgYXBwbGllZCBpZiBhbnkgYmluZGluZ3MgYXJlIGZhbHN5XG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlXG4gICAqL1xuICBzb3VyY2VzOiAobnVtYmVyfG51bGx8c3RyaW5nKVtdO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z05vZGVTdHlsaW5nIHtcbiAgLyoqIFRoZSBhc3NvY2lhdGVkIGRlYnVnIGNvbnRleHQgb2YgdGhlIFRTdHlsaW5nQ29udGV4dCBpbnN0YW5jZSAqL1xuICBjb250ZXh0OiBEZWJ1Z1N0eWxpbmdDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBBIHN1bW1hcml6YXRpb24gb2YgZWFjaCBzdHlsZS9jbGFzcyBwcm9wZXJ0eVxuICAgKiBwcmVzZW50IGluIHRoZSBjb250ZXh0XG4gICAqL1xuICBzdW1tYXJ5OiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fTtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzXG4gICAqL1xuICB2YWx1ZXM6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgYm9vbGVhbn07XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXNcbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYSBzdHlsaW5nIGVudHJ5LlxuICpcbiAqIEEgdmFsdWUgc3VjaCBhcyB0aGlzIGlzIGdlbmVyYXRlZCBhcyBhbiBhcnRpZmFjdCBvZiB0aGUgYERlYnVnU3R5bGluZ2BcbiAqIHN1bW1hcnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlU3R5bGluZ0VudHJ5IHtcbiAgLyoqIFRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSB0aGF0IHRoZSBzdW1tYXJ5IGlzIGF0dGFjaGVkIHRvICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIGxhc3QgYXBwbGllZCB2YWx1ZSBmb3IgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKiBUaGUgYmluZGluZyBpbmRleCBvZiB0aGUgbGFzdCBhcHBsaWVkIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG59XG5cblxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgYW5kIGF0dGFjaGVzIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHREZWJ1Z2AgdG8gdGhlIHByb3ZpZGVkIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgY29uc3QgZGVidWcgPSBuZXcgVFN0eWxpbmdDb250ZXh0RGVidWcoY29udGV4dCk7XG4gIGF0dGFjaERlYnVnT2JqZWN0KGNvbnRleHQsIGRlYnVnKTtcbiAgcmV0dXJuIGRlYnVnO1xufVxuXG4vKipcbiAqIEEgaHVtYW4tcmVhZGFibGUgZGVidWcgc3VtbWFyeSBvZiB0aGUgc3R5bGluZyBkYXRhIHByZXNlbnQgd2l0aGluIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgY2xhc3MgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoaW4gdGVzdGluZyBjb2RlIG9yIHdoZW4gYW5cbiAqIGFwcGxpY2F0aW9uIGhhcyBgbmdEZXZNb2RlYCBhY3RpdmF0ZWQuXG4gKi9cbmNsYXNzIFRTdHlsaW5nQ29udGV4dERlYnVnIGltcGxlbWVudHMgRGVidWdTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHt9XG5cbiAgZ2V0IGNvbmZpZygpOiBEZWJ1Z1N0eWxpbmdDb25maWcgeyByZXR1cm4gYnVpbGRDb25maWcodGhpcy5jb250ZXh0KTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZGV0YWlsZWQgc3VtbWFyeSBvZiBlYWNoIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFNlZSBgVFN0eWxpbmdUdXBsZVN1bW1hcnlgLlxuICAgKi9cbiAgZ2V0IGVudHJpZXMoKToge1twcm9wOiBzdHJpbmddOiBEZWJ1Z1N0eWxpbmdDb250ZXh0RW50cnl9IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IHRvdGFsQ29sdW1ucyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgIGNvbnN0IGVudHJpZXM6IHtbcHJvcDogc3RyaW5nXTogRGVidWdTdHlsaW5nQ29udGV4dEVudHJ5fSA9IHt9O1xuICAgIGNvbnN0IHN0YXJ0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZW50cmllc1twcm9wXSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgdGVtcGxhdGVCaXRNYXNrLFxuICAgICAgICBob3N0QmluZGluZ3NCaXRNYXNrLFxuICAgICAgICBzYW5pdGl6YXRpb25SZXF1aXJlZCxcbiAgICAgICAgdmFsdWVzQ291bnQ6IHNvdXJjZXMubGVuZ3RoLCBkZWZhdWx0VmFsdWUsIHNvdXJjZXMsXG4gICAgICB9O1xuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZVN0eWxpbmdEZWJ1ZyBpbXBsZW1lbnRzIERlYnVnTm9kZVN0eWxpbmcge1xuICBwcml2YXRlIF9zYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfZGVidWdDb250ZXh0OiBEZWJ1Z1N0eWxpbmdDb250ZXh0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0fERlYnVnU3R5bGluZ0NvbnRleHQsIHByaXZhdGUgX2RhdGE6IExTdHlsaW5nRGF0YSxcbiAgICAgIHByaXZhdGUgX2lzQ2xhc3NCYXNlZD86IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kZWJ1Z0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpID9cbiAgICAgICAgbmV3IFRTdHlsaW5nQ29udGV4dERlYnVnKGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0KSA6XG4gICAgICAgIChjb250ZXh0IGFzIERlYnVnU3R5bGluZ0NvbnRleHQpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQ7IH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpIHsgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogRGVidWdOb2RlU3R5bGluZ0VudHJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IERlYnVnTm9kZVN0eWxpbmdFbnRyeX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIGJ1aWxkQ29uZmlnKHRoaXMuY29udGV4dC5jb250ZXh0KTsgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEga2V5L3ZhbHVlIG1hcCBvZiBhbGwgdGhlIHN0eWxlcy9jbGFzc2VzIHRoYXQgd2VyZSBsYXN0IGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAqL1xuICBnZXQgdmFsdWVzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICBjb25zdCBlbnRyaWVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIHRoaXMuX21hcFZhbHVlcygocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7IGVudHJpZXNbcHJvcF0gPSB2YWx1ZTsgfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cblxuICBwcml2YXRlIF9tYXBWYWx1ZXMoZm46IChwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXJ8bnVsbCkgPT4gYW55KSB7XG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBzdG9yZS90cmFjayBhbiBlbGVtZW50IGluc3RhbmNlLiBUaGVcbiAgICAvLyBlbGVtZW50IGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBhdHRlbXB0cyB0b1xuICAgIC8vIHN0eWxlIHRoZSB2YWx1ZSAoYW5kIHdlIG1vY2sgb3V0IHRoZSBzdHlsaW5nQXBwbHlGbiBhbnl3YXkpLlxuICAgIGNvbnN0IG1vY2tFbGVtZW50ID0ge30gYXMgYW55O1xuICAgIGNvbnN0IGhhc01hcHMgPSBoYXNDb25maWcodGhpcy5jb250ZXh0LmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKTtcbiAgICBpZiAoaGFzTWFwcykge1xuICAgICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IG1hcEZuOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgICAgIChyZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgIGJpbmRpbmdJbmRleD86IG51bWJlciB8IG51bGwpID0+IGZuKHByb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXggfHwgbnVsbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyBudWxsIDogKHRoaXMuX3Nhbml0aXplciB8fCBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSk7XG5cbiAgICAvLyBydW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LmNvbnRleHQsIG51bGwsIG1vY2tFbGVtZW50LCB0aGlzLl9kYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCBmYWxzZSk7XG5cbiAgICAvLyBhbmQgYWxzbyB0aGUgaG9zdCBiaW5kaW5nc1xuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIHRoaXMuY29udGV4dC5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgdHJ1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGNvbnN0IGhhc01hcEJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKTtcbiAgY29uc3QgaGFzUHJvcEJpbmRpbmdzID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0NvbGxpc2lvbnMgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucyk7XG4gIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzVGVtcGxhdGVCaW5kaW5ncyk7XG4gIGNvbnN0IGhhc0hvc3RCaW5kaW5ncyA9IGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpO1xuICBjb25zdCB0ZW1wbGF0ZUJpbmRpbmdzTG9ja2VkID0gaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLlRlbXBsYXRlQmluZGluZ3NMb2NrZWQpO1xuICBjb25zdCBob3N0QmluZGluZ3NMb2NrZWQgPSBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSG9zdEJpbmRpbmdzTG9ja2VkKTtcbiAgY29uc3QgYWxsb3dEaXJlY3RTdHlsaW5nID1cbiAgICAgIF9hbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dCwgZmFsc2UpIHx8IF9hbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dCwgdHJ1ZSk7XG5cbiAgcmV0dXJuIHtcbiAgICAgIGhhc01hcEJpbmRpbmdzLCAgICAgICAgICAvL1xuICAgICAgaGFzUHJvcEJpbmRpbmdzLCAgICAgICAgIC8vXG4gICAgICBoYXNDb2xsaXNpb25zLCAgICAgICAgICAgLy9cbiAgICAgIGhhc1RlbXBsYXRlQmluZGluZ3MsICAgICAvL1xuICAgICAgaGFzSG9zdEJpbmRpbmdzLCAgICAgICAgIC8vXG4gICAgICB0ZW1wbGF0ZUJpbmRpbmdzTG9ja2VkLCAgLy9cbiAgICAgIGhvc3RCaW5kaW5nc0xvY2tlZCwgICAgICAvL1xuICAgICAgYWxsb3dEaXJlY3RTdHlsaW5nLCAgICAgIC8vXG4gIH07XG59XG4iXX0=