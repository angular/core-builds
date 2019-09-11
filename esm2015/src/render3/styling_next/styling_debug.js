/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { getCurrentStyleSanitizer } from '../state';
import { attachDebugObject } from '../util/debug_utils';
import { applyStylingViaContext } from './bindings';
import { activateStylingMapFeature } from './map_based_bindings';
import { allowDirectStyling as _allowDirectStyling, getDefaultValue, getGuardMask, getProp, getPropValuesStartPosition, getValuesCount, hasConfig, isContextLocked, isSanitizationRequired } from './util';
/**
 * A debug/testing-oriented summary of a styling entry.
 *
 * A value such as this is generated as an artifact of the `DebugStyling`
 * summary.
 * @record
 */
export function LStylingSummary() { }
if (false) {
    /**
     * The style/class property that the summary is attached to
     * @type {?}
     */
    LStylingSummary.prototype.prop;
    /**
     * The last applied value for the style/class property
     * @type {?}
     */
    LStylingSummary.prototype.value;
    /**
     * The binding index of the last applied style/class property
     * @type {?}
     */
    LStylingSummary.prototype.bindingIndex;
}
/**
 * A debug/testing-oriented summary of all styling entries for a `DebugNode` instance.
 * @record
 */
export function DebugStyling() { }
if (false) {
    /**
     * The associated TStylingContext instance
     * @type {?}
     */
    DebugStyling.prototype.context;
    /**
     * Which configuration flags are active (see `TStylingContextConfig`)
     * @type {?}
     */
    DebugStyling.prototype.config;
    /**
     * A summarization of each style/class property
     * present in the context
     * @type {?}
     */
    DebugStyling.prototype.summary;
    /**
     * A key/value map of all styling properties and their
     * runtime values
     * @type {?}
     */
    DebugStyling.prototype.values;
    /**
     * Overrides the sanitizer used to process styles
     * @param {?} sanitizer
     * @return {?}
     */
    DebugStyling.prototype.overrideSanitizer = function (sanitizer) { };
}
/**
 * A debug/testing-oriented summary of all styling entries within a `TStylingContext`.
 * @record
 */
export function TStylingTupleSummary() { }
if (false) {
    /**
     * The property (style or class property) that this tuple represents
     * @type {?}
     */
    TStylingTupleSummary.prototype.prop;
    /**
     * The total amount of styling entries a part of this tuple
     * @type {?}
     */
    TStylingTupleSummary.prototype.valuesCount;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when any template style/class bindings update
     * @type {?}
     */
    TStylingTupleSummary.prototype.templateBitMask;
    /**
     * The bit guard mask that is used to compare and protect against
     * styling changes when any host style/class bindings update
     * @type {?}
     */
    TStylingTupleSummary.prototype.hostBindingsBitMask;
    /**
     * Whether or not the entry requires sanitization
     * @type {?}
     */
    TStylingTupleSummary.prototype.sanitizationRequired;
    /**
     * The default value that will be applied if any bindings are falsy
     * @type {?}
     */
    TStylingTupleSummary.prototype.defaultValue;
    /**
     * All bindingIndex sources that have been registered for this style
     * @type {?}
     */
    TStylingTupleSummary.prototype.sources;
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
    get isTemplateLocked() { return isContextLocked(this.context, true); }
    /**
     * @return {?}
     */
    get isHostBindingsLocked() { return isContextLocked(this.context, false); }
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
        this.context = context;
        this._data = _data;
        this._isClassBased = _isClassBased;
        this._sanitizer = null;
    }
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
    get config() {
        /** @type {?} */
        const hasMapBindings = hasConfig(this.context, 2 /* HasMapBindings */);
        /** @type {?} */
        const hasPropBindings = hasConfig(this.context, 1 /* HasPropBindings */);
        /** @type {?} */
        const hasCollisions = hasConfig(this.context, 4 /* HasCollisions */);
        /** @type {?} */
        const hasTemplateBindings = hasConfig(this.context, 16 /* HasTemplateBindings */);
        /** @type {?} */
        const hasHostBindings = hasConfig(this.context, 32 /* HasHostBindings */);
        /** @type {?} */
        const templateBindingsLocked = hasConfig(this.context, 64 /* TemplateBindingsLocked */);
        /** @type {?} */
        const hostBindingsLocked = hasConfig(this.context, 128 /* HostBindingsLocked */);
        /** @type {?} */
        const allowDirectStyling = _allowDirectStyling(this.context, false) || _allowDirectStyling(this.context, true);
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
        const hasMaps = hasConfig(this.context, 2 /* HasMapBindings */);
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
        applyStylingViaContext(this.context, null, mockElement, this._data, true, mapFn, sanitizer, false);
        // and also the host bindings
        applyStylingViaContext(this.context, null, mockElement, this._data, true, mapFn, sanitizer, true);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    NodeStylingDebug.prototype._sanitizer;
    /** @type {?} */
    NodeStylingDebug.prototype.context;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19kZWJ1Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L3N0eWxpbmdfZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUV0RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFbEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0QsT0FBTyxFQUFDLGtCQUFrQixJQUFJLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFjLHNCQUFzQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7OztBQXFCck4scUNBU0M7Ozs7OztJQVBDLCtCQUFhOzs7OztJQUdiLGdDQUEyQjs7Ozs7SUFHM0IsdUNBQTBCOzs7Ozs7QUFNNUIsa0NBZ0NDOzs7Ozs7SUE5QkMsK0JBQXlCOzs7OztJQUd6Qiw4QkFTRTs7Ozs7O0lBTUYsK0JBQW1EOzs7Ozs7SUFNbkQsOEJBQW1FOzs7Ozs7SUFLbkUsb0VBQXlEOzs7Ozs7QUFNM0QsMENBaUNDOzs7Ozs7SUEvQkMsb0NBQWE7Ozs7O0lBR2IsMkNBQW9COzs7Ozs7SUFNcEIsK0NBQXdCOzs7Ozs7SUFNeEIsbURBQTRCOzs7OztJQUs1QixvREFBOEI7Ozs7O0lBSzlCLDRDQUFrQzs7Ozs7SUFLbEMsdUNBQWdDOzs7Ozs7O0FBTWxDLE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxPQUF3Qjs7VUFDekQsS0FBSyxHQUFHLElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDO0lBQy9DLGlCQUFpQixD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eUJBQWdDO1FBQ3RFLElBQUksT0FBTyxFQUFFO1lBQ1gseUJBQXlCLEVBQUUsQ0FBQztTQUM3Qjs7Y0FFSyxLQUFLOzs7Ozs7OztRQUNQLENBQUMsUUFBYSxFQUFFLE9BQWlCLEVBQUUsSUFBWSxFQUFFLEtBQW9CLEVBQ3BFLFlBQTRCLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQTs7Y0FFckUsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLHdCQUF3QixFQUFFLENBQUM7UUFFN0YsNEJBQTRCO1FBQzVCLHNCQUFzQixDQUNsQixJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVoRiw2QkFBNkI7UUFDN0Isc0JBQXNCLENBQ2xCLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pGLENBQUM7Q0FDRjs7Ozs7O0lBakZDLHNDQUFnRDs7SUFHNUMsbUNBQStCOzs7OztJQUFFLGlDQUEyQjs7Ozs7SUFDNUQseUNBQStCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z09iamVjdH0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5cbmltcG9ydCB7YXBwbHlTdHlsaW5nVmlhQ29udGV4dH0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2FsbG93RGlyZWN0U3R5bGluZyBhcyBfYWxsb3dEaXJlY3RTdHlsaW5nLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGlzQ29udGV4dExvY2tlZCwgaXNNYXBCYXNlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZH0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgZGVidWcgZnVuY3Rpb25hbGl0eSBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYSBzdHlsaW5nIGVudHJ5LlxuICpcbiAqIEEgdmFsdWUgc3VjaCBhcyB0aGlzIGlzIGdlbmVyYXRlZCBhcyBhbiBhcnRpZmFjdCBvZiB0aGUgYERlYnVnU3R5bGluZ2BcbiAqIHN1bW1hcnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFN0eWxpbmdTdW1tYXJ5IHtcbiAgLyoqIFRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSB0aGF0IHRoZSBzdW1tYXJ5IGlzIGF0dGFjaGVkIHRvICovXG4gIHByb3A6IHN0cmluZztcblxuICAvKiogVGhlIGxhc3QgYXBwbGllZCB2YWx1ZSBmb3IgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsO1xuXG4gIC8qKiBUaGUgYmluZGluZyBpbmRleCBvZiB0aGUgbGFzdCBhcHBsaWVkIHN0eWxlL2NsYXNzIHByb3BlcnR5ICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyfG51bGw7XG59XG5cbi8qKlxuICogQSBkZWJ1Zy90ZXN0aW5nLW9yaWVudGVkIHN1bW1hcnkgb2YgYWxsIHN0eWxpbmcgZW50cmllcyBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJ1Z1N0eWxpbmcge1xuICAvKiogVGhlIGFzc29jaWF0ZWQgVFN0eWxpbmdDb250ZXh0IGluc3RhbmNlICovXG4gIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dDtcblxuICAvKiogV2hpY2ggY29uZmlndXJhdGlvbiBmbGFncyBhcmUgYWN0aXZlIChzZWUgYFRTdHlsaW5nQ29udGV4dENvbmZpZ2ApICovXG4gIGNvbmZpZzoge1xuICAgIGhhc01hcEJpbmRpbmdzOiBib29sZWFuOyAgICAgICAgICAvL1xuICAgIGhhc1Byb3BCaW5kaW5nczogYm9vbGVhbjsgICAgICAgICAvL1xuICAgIGhhc0NvbGxpc2lvbnM6IGJvb2xlYW47ICAgICAgICAgICAvL1xuICAgIGhhc1RlbXBsYXRlQmluZGluZ3M6IGJvb2xlYW47ICAgICAvL1xuICAgIGhhc0hvc3RCaW5kaW5nczogYm9vbGVhbjsgICAgICAgICAvL1xuICAgIHRlbXBsYXRlQmluZGluZ3NMb2NrZWQ6IGJvb2xlYW47ICAvL1xuICAgIGhvc3RCaW5kaW5nc0xvY2tlZDogYm9vbGVhbjsgICAgICAvL1xuICAgIGFsbG93RGlyZWN0U3R5bGluZzogYm9vbGVhbjsgICAgICAvL1xuICB9O1xuXG4gIC8qKlxuICAgKiBBIHN1bW1hcml6YXRpb24gb2YgZWFjaCBzdHlsZS9jbGFzcyBwcm9wZXJ0eVxuICAgKiBwcmVzZW50IGluIHRoZSBjb250ZXh0XG4gICAqL1xuICBzdW1tYXJ5OiB7W3Byb3BlcnR5TmFtZTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fTtcblxuICAvKipcbiAgICogQSBrZXkvdmFsdWUgbWFwIG9mIGFsbCBzdHlsaW5nIHByb3BlcnRpZXMgYW5kIHRoZWlyXG4gICAqIHJ1bnRpbWUgdmFsdWVzXG4gICAqL1xuICB2YWx1ZXM6IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgYm9vbGVhbn07XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc2FuaXRpemVyIHVzZWQgdG8gcHJvY2VzcyBzdHlsZXNcbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpOiB2b2lkO1xufVxuXG4vKipcbiAqIEEgZGVidWcvdGVzdGluZy1vcmllbnRlZCBzdW1tYXJ5IG9mIGFsbCBzdHlsaW5nIGVudHJpZXMgd2l0aGluIGEgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdUdXBsZVN1bW1hcnkge1xuICAvKiogVGhlIHByb3BlcnR5IChzdHlsZSBvciBjbGFzcyBwcm9wZXJ0eSkgdGhhdCB0aGlzIHR1cGxlIHJlcHJlc2VudHMgKi9cbiAgcHJvcDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgZW50cmllcyBhIHBhcnQgb2YgdGhpcyB0dXBsZSAqL1xuICB2YWx1ZXNDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgYml0IGd1YXJkIG1hc2sgdGhhdCBpcyB1c2VkIHRvIGNvbXBhcmUgYW5kIHByb3RlY3QgYWdhaW5zdFxuICAgKiBzdHlsaW5nIGNoYW5nZXMgd2hlbiBhbnkgdGVtcGxhdGUgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICB0ZW1wbGF0ZUJpdE1hc2s6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGJpdCBndWFyZCBtYXNrIHRoYXQgaXMgdXNlZCB0byBjb21wYXJlIGFuZCBwcm90ZWN0IGFnYWluc3RcbiAgICogc3R5bGluZyBjaGFuZ2VzIHdoZW4gYW55IGhvc3Qgc3R5bGUvY2xhc3MgYmluZGluZ3MgdXBkYXRlXG4gICAqL1xuICBob3N0QmluZGluZ3NCaXRNYXNrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSByZXF1aXJlcyBzYW5pdGl6YXRpb25cbiAgICovXG4gIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCB2YWx1ZSB0aGF0IHdpbGwgYmUgYXBwbGllZCBpZiBhbnkgYmluZGluZ3MgYXJlIGZhbHN5XG4gICAqL1xuICBkZWZhdWx0VmFsdWU6IHN0cmluZ3xib29sZWFufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbCBiaW5kaW5nSW5kZXggc291cmNlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciB0aGlzIHN0eWxlXG4gICAqL1xuICBzb3VyY2VzOiAobnVtYmVyfG51bGx8c3RyaW5nKVtdO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlcyBhbmQgYXR0YWNoZXMgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dERlYnVnYCB0byB0aGUgcHJvdmlkZWQgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICBjb25zdCBkZWJ1ZyA9IG5ldyBUU3R5bGluZ0NvbnRleHREZWJ1Zyhjb250ZXh0KTtcbiAgYXR0YWNoRGVidWdPYmplY3QoY29udGV4dCwgZGVidWcpO1xuICByZXR1cm4gZGVidWc7XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCB3aXRoaW4gYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSB1c2VkIHdpdGhpbiB0ZXN0aW5nIGNvZGUgb3Igd2hlbiBhblxuICogYXBwbGljYXRpb24gaGFzIGBuZ0Rldk1vZGVgIGFjdGl2YXRlZC5cbiAqL1xuY2xhc3MgVFN0eWxpbmdDb250ZXh0RGVidWcge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7fVxuXG4gIGdldCBpc1RlbXBsYXRlTG9ja2VkKCkgeyByZXR1cm4gaXNDb250ZXh0TG9ja2VkKHRoaXMuY29udGV4dCwgdHJ1ZSk7IH1cbiAgZ2V0IGlzSG9zdEJpbmRpbmdzTG9ja2VkKCkgeyByZXR1cm4gaXNDb250ZXh0TG9ja2VkKHRoaXMuY29udGV4dCwgZmFsc2UpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogU2VlIGBUU3R5bGluZ1R1cGxlU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgZW50cmllcygpOiB7W3Byb3A6IHN0cmluZ106IFRTdHlsaW5nVHVwbGVTdW1tYXJ5fSB7XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB0b3RhbENvbHVtbnMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICBjb25zdCBlbnRyaWVzOiB7W3Byb3A6IHN0cmluZ106IFRTdHlsaW5nVHVwbGVTdW1tYXJ5fSA9IHt9O1xuICAgIGNvbnN0IHN0YXJ0ID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgbGV0IGkgPSBzdGFydDtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHRlbXBsYXRlQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICBjb25zdCBob3N0QmluZGluZ3NCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIHRydWUpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydFBvc2l0aW9uID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG5cbiAgICAgIGNvbnN0IHNvdXJjZXM6IChudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxDb2x1bW5zOyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtiaW5kaW5nc1N0YXJ0UG9zaXRpb24gKyBqXSBhcyBudW1iZXIgfCBzdHJpbmcgfCBudWxsO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc291cmNlcy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZW50cmllc1twcm9wXSA9IHtcbiAgICAgICAgcHJvcCxcbiAgICAgICAgdGVtcGxhdGVCaXRNYXNrLFxuICAgICAgICBob3N0QmluZGluZ3NCaXRNYXNrLFxuICAgICAgICBzYW5pdGl6YXRpb25SZXF1aXJlZCxcbiAgICAgICAgdmFsdWVzQ291bnQ6IHNvdXJjZXMubGVuZ3RoLCBkZWZhdWx0VmFsdWUsIHNvdXJjZXMsXG4gICAgICB9O1xuXG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB0b3RhbENvbHVtbnM7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG59XG5cbi8qKlxuICogQSBodW1hbi1yZWFkYWJsZSBkZWJ1ZyBzdW1tYXJ5IG9mIHRoZSBzdHlsaW5nIGRhdGEgcHJlc2VudCBmb3IgYSBgRGVidWdOb2RlYCBpbnN0YW5jZS5cbiAqXG4gKiBUaGlzIGNsYXNzIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgd2l0aGluIHRlc3RpbmcgY29kZSBvciB3aGVuIGFuXG4gKiBhcHBsaWNhdGlvbiBoYXMgYG5nRGV2TW9kZWAgYWN0aXZhdGVkLlxuICovXG5leHBvcnQgY2xhc3MgTm9kZVN0eWxpbmdEZWJ1ZyBpbXBsZW1lbnRzIERlYnVnU3R5bGluZyB7XG4gIHByaXZhdGUgX3Nhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcHJpdmF0ZSBfZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgICAgcHJpdmF0ZSBfaXNDbGFzc0Jhc2VkPzogYm9vbGVhbikge31cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBzYW5pdGl6ZXIgdXNlZCB0byBwcm9jZXNzIHN0eWxlcy5cbiAgICovXG4gIG92ZXJyaWRlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwpIHsgdGhpcy5fc2FuaXRpemVyID0gc2FuaXRpemVyOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBkZXRhaWxlZCBzdW1tYXJ5IG9mIGVhY2ggc3R5bGluZyBlbnRyeSBpbiB0aGUgY29udGV4dCBhbmRcbiAgICogd2hhdCB0aGVpciBydW50aW1lIHJlcHJlc2VudGF0aW9uIGlzLlxuICAgKlxuICAgKiBTZWUgYExTdHlsaW5nU3VtbWFyeWAuXG4gICAqL1xuICBnZXQgc3VtbWFyeSgpOiB7W2tleTogc3RyaW5nXTogTFN0eWxpbmdTdW1tYXJ5fSB7XG4gICAgY29uc3QgZW50cmllczoge1trZXk6IHN0cmluZ106IExTdHlsaW5nU3VtbWFyeX0gPSB7fTtcbiAgICB0aGlzLl9tYXBWYWx1ZXMoKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYmluZGluZ0luZGV4OiBudW1iZXIgfCBudWxsKSA9PiB7XG4gICAgICBlbnRyaWVzW3Byb3BdID0ge3Byb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXh9O1xuICAgIH0pO1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHtcbiAgICBjb25zdCBoYXNNYXBCaW5kaW5ncyA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKTtcbiAgICBjb25zdCBoYXNQcm9wQmluZGluZ3MgPSBoYXNDb25maWcodGhpcy5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpO1xuICAgIGNvbnN0IGhhc0NvbGxpc2lvbnMgPSBoYXNDb25maWcodGhpcy5jb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNDb2xsaXNpb25zKTtcbiAgICBjb25zdCBoYXNUZW1wbGF0ZUJpbmRpbmdzID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzVGVtcGxhdGVCaW5kaW5ncyk7XG4gICAgY29uc3QgaGFzSG9zdEJpbmRpbmdzID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzKTtcbiAgICBjb25zdCB0ZW1wbGF0ZUJpbmRpbmdzTG9ja2VkID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dCwgVFN0eWxpbmdDb25maWcuVGVtcGxhdGVCaW5kaW5nc0xvY2tlZCk7XG4gICAgY29uc3QgaG9zdEJpbmRpbmdzTG9ja2VkID0gaGFzQ29uZmlnKHRoaXMuY29udGV4dCwgVFN0eWxpbmdDb25maWcuSG9zdEJpbmRpbmdzTG9ja2VkKTtcbiAgICBjb25zdCBhbGxvd0RpcmVjdFN0eWxpbmcgPVxuICAgICAgICBfYWxsb3dEaXJlY3RTdHlsaW5nKHRoaXMuY29udGV4dCwgZmFsc2UpIHx8IF9hbGxvd0RpcmVjdFN0eWxpbmcodGhpcy5jb250ZXh0LCB0cnVlKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGhhc01hcEJpbmRpbmdzLCAgICAgICAgICAvL1xuICAgICAgICBoYXNQcm9wQmluZGluZ3MsICAgICAgICAgLy9cbiAgICAgICAgaGFzQ29sbGlzaW9ucywgICAgICAgICAgIC8vXG4gICAgICAgIGhhc1RlbXBsYXRlQmluZGluZ3MsICAgICAvL1xuICAgICAgICBoYXNIb3N0QmluZGluZ3MsICAgICAgICAgLy9cbiAgICAgICAgdGVtcGxhdGVCaW5kaW5nc0xvY2tlZCwgIC8vXG4gICAgICAgIGhvc3RCaW5kaW5nc0xvY2tlZCwgICAgICAvL1xuICAgICAgICBhbGxvd0RpcmVjdFN0eWxpbmcsICAgICAgLy9cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBrZXkvdmFsdWUgbWFwIG9mIGFsbCB0aGUgc3R5bGVzL2NsYXNzZXMgdGhhdCB3ZXJlIGxhc3QgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICovXG4gIGdldCB2YWx1ZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgdGhpcy5fbWFwVmFsdWVzKChwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHsgZW50cmllc1twcm9wXSA9IHZhbHVlOyB9KTtcbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuXG4gIHByaXZhdGUgX21hcFZhbHVlcyhmbjogKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcnxudWxsKSA9PiBhbnkpIHtcbiAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIHN0b3JlL3RyYWNrIGFuIGVsZW1lbnQgaW5zdGFuY2UuIFRoZVxuICAgIC8vIGVsZW1lbnQgaXMgb25seSB1c2VkIHdoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGF0dGVtcHRzIHRvXG4gICAgLy8gc3R5bGUgdGhlIHZhbHVlIChhbmQgd2UgbW9jayBvdXQgdGhlIHN0eWxpbmdBcHBseUZuIGFueXdheSkuXG4gICAgY29uc3QgbW9ja0VsZW1lbnQgPSB7fSBhcyBhbnk7XG4gICAgY29uc3QgaGFzTWFwcyA9IGhhc0NvbmZpZyh0aGlzLmNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKTtcbiAgICBpZiAoaGFzTWFwcykge1xuICAgICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IG1hcEZuOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgICAgIChyZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgIGJpbmRpbmdJbmRleD86IG51bWJlciB8IG51bGwpID0+IGZuKHByb3AsIHZhbHVlLCBiaW5kaW5nSW5kZXggfHwgbnVsbCk7XG5cbiAgICBjb25zdCBzYW5pdGl6ZXIgPSB0aGlzLl9pc0NsYXNzQmFzZWQgPyBudWxsIDogKHRoaXMuX3Nhbml0aXplciB8fCBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSk7XG5cbiAgICAvLyBydW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgdGhpcy5jb250ZXh0LCBudWxsLCBtb2NrRWxlbWVudCwgdGhpcy5fZGF0YSwgdHJ1ZSwgbWFwRm4sIHNhbml0aXplciwgZmFsc2UpO1xuXG4gICAgLy8gYW5kIGFsc28gdGhlIGhvc3QgYmluZGluZ3NcbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICB0aGlzLmNvbnRleHQsIG51bGwsIG1vY2tFbGVtZW50LCB0aGlzLl9kYXRhLCB0cnVlLCBtYXBGbiwgc2FuaXRpemVyLCB0cnVlKTtcbiAgfVxufVxuIl19