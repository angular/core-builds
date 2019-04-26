/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertLessThan } from '../../util/assert';
import { bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4 } from '../bindings';
import { BINDING_INDEX, TVIEW } from '../interfaces/view';
import { getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { elementPropertyInternal, storeBindingMetadata } from './shared';
/**
 * Create interpolation bindings with a variable number of expressions.
 *
 * If there are 1 to 8 expressions `interpolation1()` to `interpolation8()` should be used instead.
 * Those are faster because there is no need to create an array of expressions and iterate over it.
 *
 * `values`:
 * - has static text at even indexes,
 * - has evaluated expressions at odd indexes.
 *
 * Returns the concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 *
 * \@codeGenApi
 * @param {?} values
 * @return {?}
 */
export function ɵɵinterpolationV(values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    /** @type {?} */
    let different = false;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tData = lView[TVIEW].data;
    /** @type {?} */
    let bindingIndex = lView[BINDING_INDEX];
    if (tData[bindingIndex] == null) {
        // 2 is the index of the first static interstitial value (ie. not prefix)
        for (let i = 2; i < values.length; i += 2) {
            tData[bindingIndex++] = values[i];
        }
        bindingIndex = lView[BINDING_INDEX];
    }
    for (let i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(lView, bindingIndex++, values[i]) && (different = true);
    }
    lView[BINDING_INDEX] = bindingIndex;
    storeBindingMetadata(lView, values[0], values[values.length - 1]);
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    /** @type {?} */
    let content = values[0];
    for (let i = 1; i < values.length; i += 2) {
        content += renderStringify(values[i]) + values[i + 1];
    }
    return content;
}
/**
 * Creates an interpolation binding with 1 expression.
 *
 * \@codeGenApi
 * @param {?} prefix static value used for concatenation only.
 * @param {?} v0 value checked for change.
 * @param {?} suffix static value used for concatenation only.
 *
 * @return {?}
 */
export function ɵɵinterpolation1(prefix, v0, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const different = bindingUpdated(lView, lView[BINDING_INDEX]++, v0);
    storeBindingMetadata(lView, prefix, suffix);
    return different ? prefix + renderStringify(v0) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation binding with 2 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation2(prefix, v0, i0, v1, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    const different = bindingUpdated2(lView, bindingIndex, v0, v1);
    lView[BINDING_INDEX] += 2;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        lView[TVIEW].data[bindingIndex] = i0;
    }
    return different ? prefix + renderStringify(v0) + i0 + renderStringify(v1) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation binding with 3 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    const different = bindingUpdated3(lView, bindingIndex, v0, v1, v2);
    lView[BINDING_INDEX] += 3;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        /** @type {?} */
        const tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + suffix :
        NO_CHANGE;
}
/**
 * Create an interpolation binding with 4 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    const different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    lView[BINDING_INDEX] += 4;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        /** @type {?} */
        const tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 5 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated(lView, bindingIndex + 4, v4) || different;
    lView[BINDING_INDEX] += 5;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        /** @type {?} */
        const tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 6 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} i4
 * @param {?} v5
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated2(lView, bindingIndex + 4, v4, v5) || different;
    lView[BINDING_INDEX] += 6;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        /** @type {?} */
        const tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
        tData[bindingIndex + 4] = i4;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 7 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} i4
 * @param {?} v5
 * @param {?} i5
 * @param {?} v6
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated3(lView, bindingIndex + 4, v4, v5, v6) || different;
    lView[BINDING_INDEX] += 7;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        /** @type {?} */
        const tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
        tData[bindingIndex + 4] = i4;
        tData[bindingIndex + 5] = i5;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 8 expressions.
 *
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} i4
 * @param {?} v5
 * @param {?} i5
 * @param {?} v6
 * @param {?} i6
 * @param {?} v7
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵinterpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated4(lView, bindingIndex + 4, v4, v5, v6, v7) || different;
    lView[BINDING_INDEX] += 8;
    // Only set static strings the first time (data will be null subsequent runs).
    /** @type {?} */
    const data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        /** @type {?} */
        const tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
        tData[bindingIndex + 4] = i4;
        tData[bindingIndex + 5] = i5;
        tData[bindingIndex + 6] = i6;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + i6 + renderStringify(v7) + suffix :
        NO_CHANGE;
}
/////////////////////////////////////////////////////////////////////
/// NEW INSTRUCTIONS
/////////////////////////////////////////////////////////////////////
/**
 * Shared reference to a string, used in `ɵɵpropertyInterpolate`.
 * @type {?}
 */
const EMPTY_STRING = '';
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate(propName, v0) {
    ɵɵpropertyInterpolate1(propName, EMPTY_STRING, v0, EMPTY_STRING);
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate1(propName, prefix, v0, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation1(prefix, v0, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate2(propName, prefix, v0, i0, v1, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation2(prefix, v0, i0, v1, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate3(propName, prefix, v0, i0, v1, i1, v2, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation3(prefix, v0, i0, v1, i1, v2, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate4(propName, prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate5(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate6(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate7(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolate8(propName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix));
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵpropertyInterpolateV(propName, values) {
    /** @type {?} */
    const index = getSelectedIndex();
    elementPropertyInternal(index, propName, ɵɵinterpolationV(values));
    return ɵɵpropertyInterpolateV;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfaW50ZXJwb2xhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3Byb3BlcnR5X2ludGVycG9sYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlELE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDOUYsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRW5ELE9BQU8sRUFBbUIsdUJBQXVCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJ6RixNQUFNLFVBQVUsZ0JBQWdCLENBQUMsTUFBYTtJQUM1QyxTQUFTLElBQUksY0FBYyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLCtCQUErQixDQUFDLENBQUM7SUFDL0UsU0FBUyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUscUNBQXFDLENBQUMsQ0FBQzs7UUFDbEYsU0FBUyxHQUFHLEtBQUs7O1VBQ2YsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJOztRQUMzQixZQUFZLEdBQUcsS0FBSyxDQUFDLGFB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Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRDRCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLFFBQWdCLEVBQUUsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUMvRixFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDM0YsTUFBYzs7VUFDVixLQUFLLEdBQUcsZ0JBQWdCLEVBQUU7SUFDaEMsdUJBQXVCLENBQ25CLEtBQUssRUFBRSxRQUFRLEVBQ2YsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbEcsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQkQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFFBQWdCLEVBQUUsTUFBYTs7VUFDOUQsS0FBSyxHQUFHLGdCQUFnQixFQUFFO0lBRWhDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNuRSxPQUFPLHNCQUFzQixDQUFDO0FBQ2hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZCwgYmluZGluZ1VwZGF0ZWQyLCBiaW5kaW5nVXBkYXRlZDMsIGJpbmRpbmdVcGRhdGVkNH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwsIHN0b3JlQmluZGluZ01ldGFkYXRhfSBmcm9tICcuL3NoYXJlZCc7XG5cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWludGVycG9sYXRpb25WKHZhbHVlczogYW55W10pOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKDIsIHZhbHVlcy5sZW5ndGgsICdzaG91bGQgaGF2ZSBhdCBsZWFzdCAzIHZhbHVlcycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodmFsdWVzLmxlbmd0aCAlIDIsIDEsICdzaG91bGQgaGF2ZSBhbiBvZGQgbnVtYmVyIG9mIHZhbHVlcycpO1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuXG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXhdID09IG51bGwpIHtcbiAgICAvLyAyIGlzIHRoZSBpbmRleCBvZiB0aGUgZmlyc3Qgc3RhdGljIGludGVyc3RpdGlhbCB2YWx1ZSAoaWUuIG5vdCBwcmVmaXgpXG4gICAgZm9yIChsZXQgaSA9IDI7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHREYXRhW2JpbmRpbmdJbmRleCsrXSA9IHZhbHVlc1tpXTtcbiAgICB9XG4gICAgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIH1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCsrLCB2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdJbmRleDtcbiAgc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHZhbHVlc1swXSwgdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXSk7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgbFZpZXdbQklORElOR19JTkRFWF0rKywgdjApO1xuICBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSk7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDI7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGxWaWV3W1RWSUVXXS5kYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgfVxuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2Mik7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDM7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIsIHYzKTtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNDtcblxuICAvLyBPbmx5IHNldCBzdGF0aWMgc3RyaW5ncyB0aGUgZmlyc3QgdGltZSAoZGF0YSB3aWxsIGJlIG51bGwgc3Vic2VxdWVudCBydW5zKS5cbiAgY29uc3QgZGF0YSA9IHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3LCBwcmVmaXgsIHN1ZmZpeCk7XG4gIGlmIChkYXRhKSB7XG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gaTA7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMV0gPSBpMTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAyXSA9IGkyO1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNSBleHByZXNzaW9ucy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNTtcblxuICAvLyBPbmx5IHNldCBzdGF0aWMgc3RyaW5ncyB0aGUgZmlyc3QgdGltZSAoZGF0YSB3aWxsIGJlIG51bGwgc3Vic2VxdWVudCBydW5zKS5cbiAgY29uc3QgZGF0YSA9IHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3LCBwcmVmaXgsIHN1ZmZpeCk7XG4gIGlmIChkYXRhKSB7XG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gaTA7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMV0gPSBpMTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAyXSA9IGkyO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDNdID0gaTM7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aW50ZXJwb2xhdGlvbjYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMl0gPSBpMjtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAzXSA9IGkzO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDRdID0gaTQ7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIGk0ICsgcmVuZGVyU3RyaW5naWZ5KHY1KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aW50ZXJwb2xhdGlvbjcoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyhsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1LCB2NikgfHwgZGlmZmVyZW50O1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSA3O1xuXG4gIC8vIE9ubHkgc2V0IHN0YXRpYyBzdHJpbmdzIHRoZSBmaXJzdCB0aW1lIChkYXRhIHdpbGwgYmUgbnVsbCBzdWJzZXF1ZW50IHJ1bnMpLlxuICBjb25zdCBkYXRhID0gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgaWYgKGRhdGEpIHtcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9IGkxO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDJdID0gaTI7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgM10gPSBpMztcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA0XSA9IGk0O1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDVdID0gaTU7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIGk0ICsgcmVuZGVyU3RyaW5naWZ5KHY1KSArIGk1ICtcbiAgICAgICAgICByZW5kZXJTdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDggZXhwcmVzc2lvbnMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYsIHY3KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDg7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMl0gPSBpMjtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAzXSA9IGkzO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDRdID0gaTQ7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgNV0gPSBpNTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA2XSA9IGk2O1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBpNSArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHY2KSArIGk2ICsgcmVuZGVyU3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vIE5FVyBJTlNUUlVDVElPTlNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8qKlxuICogU2hhcmVkIHJlZmVyZW5jZSB0byBhIHN0cmluZywgdXNlZCBpbiBgybXJtXByb3BlcnR5SW50ZXJwb2xhdGVgLlxuICovXG5jb25zdCBFTVBUWV9TVFJJTkcgPSAnJztcblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggYSBsb25lIGJvdW5kIHZhbHVlXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMSBpbnRlcnBvbGF0ZWQgdmFsdWUgaW4gaXQsIGFuIG5vIGFkZGl0aW9uYWwgdGV4dFxuICogc3Vycm91bmRzIHRoYXQgaW50ZXJwb2xhdGVkIHZhbHVlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJ7e3YwfX1cIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlKCd0aXRsZScsIHYwKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5SW50ZXJwb2xhdGUocHJvcE5hbWU6IHN0cmluZywgdjA6IGFueSk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTEocHJvcE5hbWUsIEVNUFRZX1NUUklORywgdjAsIEVNUFRZX1NUUklORyk7XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTtcbn1cblxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCBzaW5nbGUgYm91bmQgdmFsdWUgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDEgaW50ZXJwb2xhdGVkIHZhbHVlIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMSgndGl0bGUnLCAncHJlZml4JywgdjAsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5SW50ZXJwb2xhdGUxKFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCDJtcm1aW50ZXJwb2xhdGlvbjEocHJlZml4LCB2MCwgc3VmZml4KSk7XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTE7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDIgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyAyIGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMigndGl0bGUnLCAncHJlZml4JywgdjAsICctJywgdjEsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5SW50ZXJwb2xhdGUyKFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChpbmRleCwgcHJvcE5hbWUsIMm1ybVpbnRlcnBvbGF0aW9uMihwcmVmaXgsIHYwLCBpMCwgdjEsIHN1ZmZpeCkpO1xuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGUyO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCAzIGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMyBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOjpcbiAqXG4gKiBgYGB0c1xuICogybXJtXByb3BlcnR5SW50ZXJwb2xhdGUzKFxuICogJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlMyhcbiAgICBwcm9wTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCDJtcm1aW50ZXJwb2xhdGlvbjMocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIHN1ZmZpeCkpO1xuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGUzO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCA0IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgNCBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNChcbiAqICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHVwZGF0ZVxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTQoXG4gICAgcHJvcE5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKFxuICAgICAgaW5kZXgsIHByb3BOYW1lLCDJtcm1aW50ZXJwb2xhdGlvbjQocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2Mywgc3VmZml4KSk7XG4gIHJldHVybiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTQ7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDUgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyA1IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNShcbiAqICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHVwZGF0ZVxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMyBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY0IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTUoXG4gICAgcHJvcE5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKFxuICAgICAgaW5kZXgsIHByb3BOYW1lLCDJtcm1aW50ZXJwb2xhdGlvbjUocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBzdWZmaXgpKTtcbiAgcmV0dXJuIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNTtcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggNiBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDYgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHRpdGxlPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNihcbiAqICAgICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHVwZGF0ZVxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMyBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY0IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpNCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY1IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTYoXG4gICAgcHJvcE5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKFxuICAgICAgaW5kZXgsIHByb3BOYW1lLFxuICAgICAgybXJtWludGVycG9sYXRpb242KHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBzdWZmaXgpKTtcbiAgcmV0dXJuIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlNjtcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggNyBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDcgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHRpdGxlPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTcoXG4gKiAgICAndGl0bGUnLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICctJywgdjYsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTQgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTUgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5SW50ZXJwb2xhdGU3KFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLFxuICAgIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKFxuICAgICAgaW5kZXgsIHByb3BOYW1lLFxuICAgICAgybXJtWludGVycG9sYXRpb243KHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBpNSwgdjYsIHN1ZmZpeCkpO1xuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGU3O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCA4IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgOCBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgdGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1cHJvcGVydHlJbnRlcnBvbGF0ZTgoXG4gKiAgJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnLScsIHY3LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IGBASW5wdXRzYCBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBUaGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk2IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjcgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlOChcbiAgICBwcm9wTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZyxcbiAgICB2MzogYW55LCBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChcbiAgICAgIGluZGV4LCBwcm9wTmFtZSxcbiAgICAgIMm1ybVpbnRlcnBvbGF0aW9uOChwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgaTUsIHY2LCBpNiwgdjcsIHN1ZmZpeCkpO1xuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGU4O1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDggb3IgbW9yZSBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgbnVtYmVyIG9mIGludGVycG9sYXRlZCB2YWx1ZXMgZXhjZWVkcyA3LlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXZcbiAqICB0aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19LXt7djZ9fS17e3Y3fX0te3t2OH19LXt7djl9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOjpcbiAqXG4gKiBgYGB0c1xuICogybXJtXByb3BlcnR5SW50ZXJwb2xhdGVWKFxuICogICd0aXRsZScsIFsncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICctJywgdjYsICctJywgdjcsICctJywgdjksXG4gKiAgJ3N1ZmZpeCddKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIHByb3BOYW1lIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGUuXG4gKiBAcGFyYW0gdmFsdWVzIFRoZSBhIGNvbGxlY3Rpb24gb2YgdmFsdWVzIGFuZCB0aGUgc3RyaW5ncyBpbmJldHdlZW4gdGhvc2UgdmFsdWVzLCBiZWdpbm5pbmcgd2l0aCBhXG4gKiBzdHJpbmcgcHJlZml4IGFuZCBlbmRpbmcgd2l0aCBhIHN0cmluZyBzdWZmaXguXG4gKiAoZS5nLiBgWydwcmVmaXgnLCB2YWx1ZTAsICctJywgdmFsdWUxLCAnLScsIHZhbHVlMiwgLi4uLCB2YWx1ZTk5LCAnc3VmZml4J11gKVxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eUludGVycG9sYXRlVihwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZXM6IGFueVtdKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuXG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGluZGV4LCBwcm9wTmFtZSwgybXJtWludGVycG9sYXRpb25WKHZhbHVlcykpO1xuICByZXR1cm4gybXJtXByb3BlcnR5SW50ZXJwb2xhdGVWO1xufVxuIl19