/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { TVIEW } from '../interfaces/view';
import { getBindingIndex, getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { interpolation1, interpolation2, interpolation3, interpolation4, interpolation5, interpolation6, interpolation7, interpolation8, interpolationV } from './interpolation';
import { elementPropertyInternal, storePropertyBindingMetadata } from './shared';
/**
 *
 * Update an interpolated property on an element with a lone bound value
 *
 * Used when the value passed to a property has 1 interpolated value in it, an no additional text
 * surrounds that interpolated value:
 *
 * ```html
 * <div title="{{v0}}"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate('title', v0);
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} v0 Value checked for change.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate(propName, v0, sanitizer) {
    ɵɵpropertyInterpolate1(propName, '', v0, '', sanitizer);
    return ɵɵpropertyInterpolate;
}
/**
 *
 * Update an interpolated property on an element with single bound value surrounded by text.
 *
 * Used when the value passed to a property has 1 interpolated value in it:
 *
 * ```html
 * <div title="prefix{{v0}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate1('title', 'prefix', v0, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate1(propName, prefix, v0, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation1(lView, prefix, v0, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        elementPropertyInternal(lView, getSelectedIndex(), propName, interpolatedValue, sanitizer);
        ngDevMode &&
            storePropertyBindingMetadata(lView[TVIEW].data, getSelectedIndex(), propName, getBindingIndex() - 1, prefix, suffix);
    }
    return ɵɵpropertyInterpolate1;
}
/**
 *
 * Update an interpolated property on an element with 2 bound values surrounded by text.
 *
 * Used when the value passed to a property has 2 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate2('title', 'prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate2(propName, prefix, v0, i0, v1, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode &&
            storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 2, prefix, i0, suffix);
    }
    return ɵɵpropertyInterpolate2;
}
/**
 *
 * Update an interpolated property on an element with 3 bound values surrounded by text.
 *
 * Used when the value passed to a property has 3 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate3(
 * 'title', 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} i1 Static value used for concatenation only.
 * @param {?} v2 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate3(propName, prefix, v0, i0, v1, i1, v2, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode &&
            storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 3, prefix, i0, i1, suffix);
    }
    return ɵɵpropertyInterpolate3;
}
/**
 *
 * Update an interpolated property on an element with 4 bound values surrounded by text.
 *
 * Used when the value passed to a property has 4 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate4(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} i1 Static value used for concatenation only.
 * @param {?} v2 Value checked for change.
 * @param {?} i2 Static value used for concatenation only.
 * @param {?} v3 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate4(propName, prefix, v0, i0, v1, i1, v2, i2, v3, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 4, prefix, i0, i1, i2, suffix);
    }
    return ɵɵpropertyInterpolate4;
}
/**
 *
 * Update an interpolated property on an element with 5 bound values surrounded by text.
 *
 * Used when the value passed to a property has 5 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate5(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} i1 Static value used for concatenation only.
 * @param {?} v2 Value checked for change.
 * @param {?} i2 Static value used for concatenation only.
 * @param {?} v3 Value checked for change.
 * @param {?} i3 Static value used for concatenation only.
 * @param {?} v4 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate5(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation5(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 5, prefix, i0, i1, i2, i3, suffix);
    }
    return ɵɵpropertyInterpolate5;
}
/**
 *
 * Update an interpolated property on an element with 6 bound values surrounded by text.
 *
 * Used when the value passed to a property has 6 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate6(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} i1 Static value used for concatenation only.
 * @param {?} v2 Value checked for change.
 * @param {?} i2 Static value used for concatenation only.
 * @param {?} v3 Value checked for change.
 * @param {?} i3 Static value used for concatenation only.
 * @param {?} v4 Value checked for change.
 * @param {?} i4 Static value used for concatenation only.
 * @param {?} v5 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate6(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation6(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 6, prefix, i0, i1, i2, i3, i4, suffix);
    }
    return ɵɵpropertyInterpolate6;
}
/**
 *
 * Update an interpolated property on an element with 7 bound values surrounded by text.
 *
 * Used when the value passed to a property has 7 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate7(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} i1 Static value used for concatenation only.
 * @param {?} v2 Value checked for change.
 * @param {?} i2 Static value used for concatenation only.
 * @param {?} v3 Value checked for change.
 * @param {?} i3 Static value used for concatenation only.
 * @param {?} v4 Value checked for change.
 * @param {?} i4 Static value used for concatenation only.
 * @param {?} v5 Value checked for change.
 * @param {?} i5 Static value used for concatenation only.
 * @param {?} v6 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate7(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation7(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 7, prefix, i0, i1, i2, i3, i4, i5, suffix);
    }
    return ɵɵpropertyInterpolate7;
}
/**
 *
 * Update an interpolated property on an element with 8 bound values surrounded by text.
 *
 * Used when the value passed to a property has 8 interpolated values in it:
 *
 * ```html
 * <div title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolate8(
 *  'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update
 * @param {?} prefix Static value used for concatenation only.
 * @param {?} v0 Value checked for change.
 * @param {?} i0 Static value used for concatenation only.
 * @param {?} v1 Value checked for change.
 * @param {?} i1 Static value used for concatenation only.
 * @param {?} v2 Value checked for change.
 * @param {?} i2 Static value used for concatenation only.
 * @param {?} v3 Value checked for change.
 * @param {?} i3 Static value used for concatenation only.
 * @param {?} v4 Value checked for change.
 * @param {?} i4 Static value used for concatenation only.
 * @param {?} v5 Value checked for change.
 * @param {?} i5 Static value used for concatenation only.
 * @param {?} v6 Value checked for change.
 * @param {?} i6 Static value used for concatenation only.
 * @param {?} v7 Value checked for change.
 * @param {?} suffix Static value used for concatenation only.
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate8(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolation8(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - 8, prefix, i0, i1, i2, i3, i4, i5, i6, suffix);
    }
    return ɵɵpropertyInterpolate8;
}
/**
 * Update an interpolated property on an element with 8 or more bound values surrounded by text.
 *
 * Used when the number of interpolated values exceeds 7.
 *
 * ```html
 * <div
 *  title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵpropertyInterpolateV(
 *  'title', ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled.
 *
 * \@codeGenApi
 * @param {?} propName The name of the property to update.
 * @param {?} values The a collection of values and the strings inbetween those values, beginning with a
 * string prefix and ending with a string suffix.
 * (e.g. `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @param {?=} sanitizer An optional sanitizer function
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolateV(propName, values, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolatedValue = interpolationV(lView, values);
    if (interpolatedValue !== NO_CHANGE) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, interpolatedValue, sanitizer);
        if (ngDevMode) {
            /** @type {?} */
            const interpolationInBetween = [values[0]];
            for (let i = 2; i < values.length; i += 2) {
                interpolationInBetween.push(values[i]);
            }
            storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, getBindingIndex() - interpolationInBetween.length + 1, ...interpolationInBetween);
        }
    }
    return ɵɵpropertyInterpolateV;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfaW50ZXJwb2xhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3Byb3BlcnR5X2ludGVycG9sYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6QyxPQUFPLEVBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRXBDLE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQy9LLE9BQU8sRUFBbUIsdUJBQXVCLEVBQUUsNEJBQTRCLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQ2pHLE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsUUFBZ0IsRUFBRSxFQUFPLEVBQUUsU0FBdUI7SUFDcEQsc0JBQXNCLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hELE9BQU8scUJBQXFCLENBQUM7QUFDL0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQkQsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxRQUFnQixFQUFFLE1BQWMsRUFBRSxFQUFPLEVBQUUsTUFBYyxFQUN6RCxTQUF1Qjs7VUFDbkIsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsaUJBQWlCLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFF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QVUsc0JBQXNCLENBQ2xDLFFBQWdCLEVBQUUsTUFBYSxFQUFFLFNBQXVCOztVQUNwRCxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixpQkFBaUIsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQztJQUN2RCxJQUFJLGlCQUFpQixLQUFLLFNBQVMsRUFBRTs7Y0FDN0IsU0FBUyxHQUFHLGdCQUFnQixFQUFFO1FBQ3BDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2xGLElBQUksU0FBUyxFQUFFOztrQkFDUCxzQkFBc0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDeEM7WUFDRCw0QkFBNEIsQ0FDeEIsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUN0QyxlQUFlLEVBQUUsR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEdBQUcsc0JBQXNCLENBQUMsQ0FBQztTQUN2RjtLQUNGO0lBQ0QsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QmluZGluZ0luZGV4LCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmltcG9ydCB7aW50ZXJwb2xhdGlvbjEsIGludGVycG9sYXRpb24yLCBpbnRlcnBvbGF0aW9uMywgaW50ZXJwb2xhdGlvbjQsIGludGVycG9sYXRpb241LCBpbnRlcnBvbGF0aW9uNiwgaW50ZXJwb2xhdGlvbjcsIGludGVycG9sYXRpb244LCBpbnRlcnBvbGF0aW9uVn0gZnJvbSAnLi9pbnRlcnBvbGF0aW9uJztcbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwsIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGF9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIGEgbG9uZSBib3VuZCB2YWx1ZVxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDEgaW50ZXJwb2xhdGVkIHZhbHVlIGluIGl0LCBhbiBubyBhZGRpdGlvbmFsIHRleHRcbiAqIHN1cnJvdW5kcyB0aGF0IGludGVycG9sYXRlZCB2YWx1ZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHRpdGxlPVwie3t2MH19XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZSgndGl0bGUnLCB2MCk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZShcbiAgICBwcm9wTmFtZTogc3RyaW5nLCB2MDogYW55LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTEocHJvcE5hbWUsICcnLCB2MCwgJycsIHNhbml0aXplcik7XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTtcbn1cblxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCBzaW5nbGUgYm91bmQgdmFsdWUgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDEgaW50ZXJwb2xhdGVkIHZhbHVlIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMSgndGl0bGUnLCAncHJlZml4JywgdjAsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvblxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMShcbiAgICBwcm9wTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb24xKGxWaWV3LCBwcmVmaXgsIHYwLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIHByb3BOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgc2FuaXRpemVyKTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBnZXRTZWxlY3RlZEluZGV4KCksIHByb3BOYW1lLCBnZXRCaW5kaW5nSW5kZXgoKSAtIDEsIHByZWZpeCwgc3VmZml4KTtcbiAgfVxuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGUxO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCAyIGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMiBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTIoJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTIoXG4gICAgcHJvcE5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplckZuKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uMihsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChsVmlldywgbm9kZUluZGV4LCBwcm9wTmFtZSwgaW50ZXJwb2xhdGVkVmFsdWUsIHNhbml0aXplcik7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgICAgICAgICBsVmlld1tUVklFV10uZGF0YSwgbm9kZUluZGV4LCBwcm9wTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSAyLCBwcmVmaXgsIGkwLCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTI7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDMgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyAzIGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTMoXG4gKiAndGl0bGUnLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvblxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMyhcbiAgICBwcm9wTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb24zKGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2Miwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwobFZpZXcsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGludGVycG9sYXRlZFZhbHVlLCBzYW5pdGl6ZXIpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGEsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGdldEJpbmRpbmdJbmRleCgpIC0gMywgcHJlZml4LCBpMCwgaTEsIHN1ZmZpeCk7XG4gIH1cbiAgcmV0dXJuIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMztcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggNCBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDQgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHRpdGxlPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTQoXG4gKiAndGl0bGUnLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvblxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNChcbiAgICBwcm9wTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZyxcbiAgICB2MzogYW55LCBzdWZmaXg6IHN0cmluZywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb240KGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChsVmlldywgbm9kZUluZGV4LCBwcm9wTmFtZSwgaW50ZXJwb2xhdGVkVmFsdWUsIHNhbml0aXplcik7XG4gICAgbmdEZXZNb2RlICYmIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgICAgICBsVmlld1tUVklFV10uZGF0YSwgbm9kZUluZGV4LCBwcm9wTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSA0LCBwcmVmaXgsIGkwLCBpMSxcbiAgICAgICAgICAgICAgICAgICAgIGkyLCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTQ7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDUgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyA1IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNShcbiAqICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHVwZGF0ZVxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMyBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY0IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5SW50ZXJwb2xhdGU1KFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLFxuICAgIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID1cbiAgICAgIGludGVycG9sYXRpb241KGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGxWaWV3LCBub2RlSW5kZXgsIHByb3BOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgc2FuaXRpemVyKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsIHByb3BOYW1lLCBnZXRCaW5kaW5nSW5kZXgoKSAtIDUsIHByZWZpeCwgaTAsIGkxLFxuICAgICAgICAgICAgICAgICAgICAgaTIsIGkzLCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTU7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDYgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyA2IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTYoXG4gKiAgICAndGl0bGUnLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTQgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvblxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNihcbiAgICBwcm9wTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZyxcbiAgICB2MzogYW55LCBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID1cbiAgICAgIGludGVycG9sYXRpb242KGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwobFZpZXcsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGludGVycG9sYXRlZFZhbHVlLCBzYW5pdGl6ZXIpO1xuICAgIG5nRGV2TW9kZSAmJiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgICAgICAgICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGEsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGdldEJpbmRpbmdJbmRleCgpIC0gNiwgcHJlZml4LCBpMCwgaTEsXG4gICAgICAgICAgICAgICAgICAgICBpMiwgaTMsIGk0LCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTY7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDcgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyA3IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19LXt7djZ9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOjpcbiAqXG4gKiBgYGB0c1xuICogybXJtXByb3BlcnR5SW50ZXJwb2xhdGU3KFxuICogICAgJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTcoXG4gICAgcHJvcE5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9XG4gICAgICBpbnRlcnBvbGF0aW9uNyhsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIGk1LCB2Niwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwobFZpZXcsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGludGVycG9sYXRlZFZhbHVlLCBzYW5pdGl6ZXIpO1xuICAgIG5nRGV2TW9kZSAmJiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgICAgICAgICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGEsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGdldEJpbmRpbmdJbmRleCgpIC0gNywgcHJlZml4LCBpMCwgaTEsXG4gICAgICAgICAgICAgICAgICAgICBpMiwgaTMsIGk0LCBpNSwgc3VmZml4KTtcbiAgfVxuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGU3O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCA4IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgOCBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTgoXG4gKiAgJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnLScsIHY3LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk2IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjcgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTgoXG4gICAgcHJvcE5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZywgdjc6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb244KFxuICAgICAgbFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBpNSwgdjYsIGk2LCB2Nywgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwobFZpZXcsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGludGVycG9sYXRlZFZhbHVlLCBzYW5pdGl6ZXIpO1xuICAgIG5nRGV2TW9kZSAmJiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgICAgICAgICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGEsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGdldEJpbmRpbmdJbmRleCgpIC0gOCwgcHJlZml4LCBpMCwgaTEsXG4gICAgICAgICAgICAgICAgICAgICBpMiwgaTMsIGk0LCBpNSwgaTYsIHN1ZmZpeCk7XG4gIH1cbiAgcmV0dXJuIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlODtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCA4IG9yIG1vcmUgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIG51bWJlciBvZiBpbnRlcnBvbGF0ZWQgdmFsdWVzIGV4Y2VlZHMgNy5cbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2XG4gKiAgdGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319LXt7djh9fS17e3Y5fX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlVihcbiAqICAndGl0bGUnLCBbJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnLScsIHY3LCAnLScsIHY5LFxuICogICdzdWZmaXgnXSk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlLlxuICogQHBhcmFtIHZhbHVlcyBUaGUgYSBjb2xsZWN0aW9uIG9mIHZhbHVlcyBhbmQgdGhlIHN0cmluZ3MgaW5iZXR3ZWVuIHRob3NlIHZhbHVlcywgYmVnaW5uaW5nIHdpdGggYVxuICogc3RyaW5nIHByZWZpeCBhbmQgZW5kaW5nIHdpdGggYSBzdHJpbmcgc3VmZml4LlxuICogKGUuZy4gYFsncHJlZml4JywgdmFsdWUwLCAnLScsIHZhbHVlMSwgJy0nLCB2YWx1ZTIsIC4uLiwgdmFsdWU5OSwgJ3N1ZmZpeCddYClcbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5SW50ZXJwb2xhdGVWKFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlczogYW55W10sIHNhbml0aXplcj86IFNhbml0aXplckZuKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uVihsVmlldywgdmFsdWVzKTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwobFZpZXcsIG5vZGVJbmRleCwgcHJvcE5hbWUsIGludGVycG9sYXRlZFZhbHVlLCBzYW5pdGl6ZXIpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGNvbnN0IGludGVycG9sYXRpb25JbkJldHdlZW4gPSBbdmFsdWVzWzBdXTsgIC8vIHByZWZpeFxuICAgICAgZm9yIChsZXQgaSA9IDI7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgaW50ZXJwb2xhdGlvbkluQmV0d2Vlbi5wdXNoKHZhbHVlc1tpXSk7XG4gICAgICB9XG4gICAgICBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsIHByb3BOYW1lLFxuICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpIC0gaW50ZXJwb2xhdGlvbkluQmV0d2Vlbi5sZW5ndGggKyAxLCAuLi5pbnRlcnBvbGF0aW9uSW5CZXR3ZWVuKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlVjtcbn1cbiJdfQ==