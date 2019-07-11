/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { interpolation1, interpolation2, interpolation3, interpolation4, interpolation5, interpolation6, interpolation7, interpolation8, interpolationV } from './interpolation';
import { getActiveDirectiveStylingIndex, stylePropInternal } from './styling';
/**
 *
 * Update an interpolated style property on an element with single bound value surrounded by text.
 *
 * Used when the value passed to a property has 1 interpolated value in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate1(0, 'prefix', v0, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate1(styleIndex, prefix, v0, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation1(lView, prefix, v0, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate1;
}
/**
 *
 * Update an interpolated style property on an element with 2 bound values surrounded by text.
 *
 * Used when the value passed to a property has 2 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate2(0, 'prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate2(styleIndex, prefix, v0, i0, v1, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate2;
}
/**
 *
 * Update an interpolated style property on an element with 3 bound values surrounded by text.
 *
 * Used when the value passed to a property has 3 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate3(0, 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate3(styleIndex, prefix, v0, i0, v1, i1, v2, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate3;
}
/**
 *
 * Update an interpolated style property on an element with 4 bound values surrounded by text.
 *
 * Used when the value passed to a property has 4 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate4(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate4(styleIndex, prefix, v0, i0, v1, i1, v2, i2, v3, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate4;
}
/**
 *
 * Update an interpolated style property on an element with 5 bound values surrounded by text.
 *
 * Used when the value passed to a property has 5 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate5(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param i3 Static value used for concatenation only.
 * @param v4 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate5(styleIndex, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation5(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate5;
}
/**
 *
 * Update an interpolated style property on an element with 6 bound values surrounded by text.
 *
 * Used when the value passed to a property has 6 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate6(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param i3 Static value used for concatenation only.
 * @param v4 Value checked for change.
 * @param i4 Static value used for concatenation only.
 * @param v5 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate6(styleIndex, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation6(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate6;
}
/**
 *
 * Update an interpolated style property on an element with 7 bound values surrounded by text.
 *
 * Used when the value passed to a property has 7 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate7(
 *    0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param i3 Static value used for concatenation only.
 * @param v4 Value checked for change.
 * @param i4 Static value used for concatenation only.
 * @param v5 Value checked for change.
 * @param i5 Static value used for concatenation only.
 * @param v6 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate7(styleIndex, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation7(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate7;
}
/**
 *
 * Update an interpolated style property on an element with 8 bound values surrounded by text.
 *
 * Used when the value passed to a property has 8 interpolated values in it:
 *
 * ```html
 * <div style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolate8(0, 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6,
 * '-', v7, 'suffix');
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param i3 Static value used for concatenation only.
 * @param v4 Value checked for change.
 * @param i4 Static value used for concatenation only.
 * @param v5 Value checked for change.
 * @param i5 Static value used for concatenation only.
 * @param v6 Value checked for change.
 * @param i6 Static value used for concatenation only.
 * @param v7 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolate8(styleIndex, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolatedValue = interpolation8(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolatedValue, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolate8;
}
/**
 * Update an interpolated style property on an element with 8 or more bound values surrounded by
 * text.
 *
 * Used when the number of interpolated values exceeds 7.
 *
 * ```html
 * <div
 *  style.color="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix">
 * </div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵstylePropInterpolateV(
 *  0, ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`..
 * @param values The a collection of values and the strings in-between those values, beginning with
 * a string prefix and ending with a string suffix.
 * (e.g. `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @param valueSuffix Optional suffix. Used with scalar values to add unit such as `px`.
 * @param forceOverride Whether or not to update the styling value immediately.
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵstylePropInterpolateV(styleIndex, values, valueSuffix, forceOverride) {
    var lView = getLView();
    var interpolated = interpolationV(lView, values);
    if (interpolated !== NO_CHANGE) {
        stylePropInternal(lView, getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), interpolated, valueSuffix, forceOverride);
    }
    return ɵɵstylePropInterpolateV;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfcHJvcF9pbnRlcnBvbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc3R5bGVfcHJvcF9pbnRlcnBvbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVwQyxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUUvSyxPQUFPLEVBQUMsOEJBQThCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFJNUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMEJHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxVQUFrQixFQUFFLE1BQWMsRUFBRSxFQUFPLEVBQUUsTUFBYyxFQUFFLFdBQTJCLEVBQ3hGLGFBQXVCO0lBQ3pCLElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3BFLElBQUksaUJBQWlCLEtBQUssU0FBUyxFQUFFO1FBQ25DLGlCQUFpQixDQUNiLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLFVBQVUsRUFBRSw4QkFBOEIsRUFBRSxFQUN2RSxpQkFBMkIsRUFBRSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDOUQ7SUFDRCxPQUFPLHVCQUF1QixDQUFDO0FB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akMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Z2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuXG5pbXBvcnQge2ludGVycG9sYXRpb24xLCBpbnRlcnBvbGF0aW9uMiwgaW50ZXJwb2xhdGlvbjMsIGludGVycG9sYXRpb240LCBpbnRlcnBvbGF0aW9uNSwgaW50ZXJwb2xhdGlvbjYsIGludGVycG9sYXRpb243LCBpbnRlcnBvbGF0aW9uOCwgaW50ZXJwb2xhdGlvblZ9IGZyb20gJy4vaW50ZXJwb2xhdGlvbic7XG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDl9IGZyb20gJy4vc2hhcmVkJztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4LCBzdHlsZVByb3BJbnRlcm5hbH0gZnJvbSAnLi9zdHlsaW5nJztcblxuXG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgc3R5bGUgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIHNpbmdsZSBib3VuZCB2YWx1ZSBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMSBpbnRlcnBvbGF0ZWQgdmFsdWUgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBzdHlsZS5jb2xvcj1cInByZWZpeHt7djB9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGUxKDAsICdwcmVmaXgnLCB2MCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgLlxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2YWx1ZVN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGUxKFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nLCB2YWx1ZVN1ZmZpeD86IHN0cmluZyB8IG51bGwsXG4gICAgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb24xKGxWaWV3LCBwcmVmaXgsIHYwLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIHN0eWxlUHJvcEludGVybmFsKFxuICAgICAgICBsVmlldywgZ2V0U2VsZWN0ZWRJbmRleCgpLCBzdHlsZUluZGV4LCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSxcbiAgICAgICAgaW50ZXJwb2xhdGVkVmFsdWUgYXMgc3RyaW5nLCB2YWx1ZVN1ZmZpeCwgZm9yY2VPdmVycmlkZSk7XG4gIH1cbiAgcmV0dXJuIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTE7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgc3R5bGUgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDIgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyAyIGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBzdHlsZS5jb2xvcj1cInByZWZpeHt7djB9fS17e3YxfX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXN0eWxlUHJvcEludGVycG9sYXRlMigwLCAncHJlZml4JywgdjAsICctJywgdjEsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYC5cbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdmFsdWVTdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcEludGVycG9sYXRlMihcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBzdWZmaXg6IHN0cmluZyxcbiAgICB2YWx1ZVN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uMihsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIHN0eWxlUHJvcEludGVybmFsKFxuICAgICAgICBsVmlldywgZ2V0U2VsZWN0ZWRJbmRleCgpLCBzdHlsZUluZGV4LCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSxcbiAgICAgICAgaW50ZXJwb2xhdGVkVmFsdWUgYXMgc3RyaW5nLCB2YWx1ZVN1ZmZpeCwgZm9yY2VPdmVycmlkZSk7XG4gIH1cbiAgcmV0dXJuIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTI7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgc3R5bGUgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDMgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyAzIGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBzdHlsZS5jb2xvcj1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTMoMCwgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AuXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHZhbHVlU3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdG8gdXBkYXRlIHRoZSBzdHlsaW5nIHZhbHVlIGltbWVkaWF0ZWx5LlxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTMoXG4gICAgc3R5bGVJbmRleDogbnVtYmVyLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZywgdmFsdWVTdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjMobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIHN0eWxlUHJvcEludGVybmFsKFxuICAgICAgICBsVmlldywgZ2V0U2VsZWN0ZWRJbmRleCgpLCBzdHlsZUluZGV4LCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSxcbiAgICAgICAgaW50ZXJwb2xhdGVkVmFsdWUgYXMgc3RyaW5nLCB2YWx1ZVN1ZmZpeCwgZm9yY2VPdmVycmlkZSk7XG4gIH1cbiAgcmV0dXJuIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTM7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgc3R5bGUgcHJvcGVydHkgb24gYW4gZWxlbWVudCB3aXRoIDQgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyA0IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBzdHlsZS5jb2xvcj1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGU0KDAsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgLlxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2YWx1ZVN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGU0KFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksXG4gICAgaTI6IHN0cmluZywgdjM6IGFueSwgc3VmZml4OiBzdHJpbmcsIHZhbHVlU3VmZml4Pzogc3RyaW5nIHwgbnVsbCxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjQobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIHN0eWxlSW5kZXgsIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLFxuICAgICAgICBpbnRlcnBvbGF0ZWRWYWx1ZSBhcyBzdHJpbmcsIHZhbHVlU3VmZml4LCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuICByZXR1cm4gybXJtXN0eWxlUHJvcEludGVycG9sYXRlNDtcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBzdHlsZSBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggNSBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDUgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHN0eWxlLmNvbG9yPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGU1KDAsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgLlxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMyBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY0IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2YWx1ZVN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGU1KFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksXG4gICAgaTI6IHN0cmluZywgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcsIHZhbHVlU3VmZml4Pzogc3RyaW5nIHwgbnVsbCxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID1cbiAgICAgIGludGVycG9sYXRpb241KGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIHN0eWxlSW5kZXgsIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLFxuICAgICAgICBpbnRlcnBvbGF0ZWRWYWx1ZSBhcyBzdHJpbmcsIHZhbHVlU3VmZml4LCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuICByZXR1cm4gybXJtXN0eWxlUHJvcEludGVycG9sYXRlNTtcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBzdHlsZSBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggNiBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDYgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHN0eWxlLmNvbG9yPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXN0eWxlUHJvcEludGVycG9sYXRlNigwLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYC5cbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTQgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdmFsdWVTdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcEludGVycG9sYXRlNihcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LFxuICAgIGkyOiBzdHJpbmcsIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nLFxuICAgIHZhbHVlU3VmZml4Pzogc3RyaW5nIHwgbnVsbCwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9XG4gICAgICBpbnRlcnBvbGF0aW9uNihsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIHN0eWxlSW5kZXgsIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLFxuICAgICAgICBpbnRlcnBvbGF0ZWRWYWx1ZSBhcyBzdHJpbmcsIHZhbHVlU3VmZml4LCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuICByZXR1cm4gybXJtXN0eWxlUHJvcEludGVycG9sYXRlNjtcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBzdHlsZSBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50IHdpdGggNyBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDcgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHN0eWxlLmNvbG9yPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTcoXG4gKiAgICAwLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICctJywgdjYsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYC5cbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTQgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTUgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdmFsdWVTdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcEludGVycG9sYXRlNyhcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LFxuICAgIGkyOiBzdHJpbmcsIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcsIHZhbHVlU3VmZml4Pzogc3RyaW5nIHwgbnVsbCwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9XG4gICAgICBpbnRlcnBvbGF0aW9uNyhsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIGk1LCB2Niwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBzdHlsZVByb3BJbnRlcm5hbChcbiAgICAgICAgbFZpZXcsIGdldFNlbGVjdGVkSW5kZXgoKSwgc3R5bGVJbmRleCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksXG4gICAgICAgIGludGVycG9sYXRlZFZhbHVlIGFzIHN0cmluZywgdmFsdWVTdWZmaXgsIGZvcmNlT3ZlcnJpZGUpO1xuICB9XG4gIHJldHVybiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGU3O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHN0eWxlIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCA4IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgOCBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgc3R5bGUuY29sb3I9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZTgoMCwgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LFxuICogJy0nLCB2NywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgLlxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMyBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY0IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpNCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY1IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpNSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY2IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpNiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY3IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2YWx1ZVN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseS5cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGU4KFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksXG4gICAgaTI6IHN0cmluZywgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZyxcbiAgICB2NzogYW55LCBzdWZmaXg6IHN0cmluZywgdmFsdWVTdWZmaXg/OiBzdHJpbmcgfCBudWxsLFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uOChcbiAgICAgIGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgaTUsIHY2LCBpNiwgdjcsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIHN0eWxlSW5kZXgsIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLFxuICAgICAgICBpbnRlcnBvbGF0ZWRWYWx1ZSBhcyBzdHJpbmcsIHZhbHVlU3VmZml4LCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuICByZXR1cm4gybXJtXN0eWxlUHJvcEludGVycG9sYXRlODtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIHN0eWxlIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQgd2l0aCA4IG9yIG1vcmUgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnlcbiAqIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSBudW1iZXIgb2YgaW50ZXJwb2xhdGVkIHZhbHVlcyBleGNlZWRzIDcuXG4gKlxuICogYGBgaHRtbFxuICogPGRpdlxuICogIHN0eWxlLmNvbG9yPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19LXt7djd9fS17e3Y4fX0te3t2OX19c3VmZml4XCI+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXN0eWxlUHJvcEludGVycG9sYXRlVihcbiAqICAwLCBbJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnLScsIHY3LCAnLScsIHY5LFxuICogICdzdWZmaXgnXSk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AuLlxuICogQHBhcmFtIHZhbHVlcyBUaGUgYSBjb2xsZWN0aW9uIG9mIHZhbHVlcyBhbmQgdGhlIHN0cmluZ3MgaW4tYmV0d2VlbiB0aG9zZSB2YWx1ZXMsIGJlZ2lubmluZyB3aXRoXG4gKiBhIHN0cmluZyBwcmVmaXggYW5kIGVuZGluZyB3aXRoIGEgc3RyaW5nIHN1ZmZpeC5cbiAqIChlLmcuIGBbJ3ByZWZpeCcsIHZhbHVlMCwgJy0nLCB2YWx1ZTEsICctJywgdmFsdWUyLCAuLi4sIHZhbHVlOTksICdzdWZmaXgnXWApXG4gKiBAcGFyYW0gdmFsdWVTdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHkuXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcEludGVycG9sYXRlVihcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlczogYW55W10sIHZhbHVlU3VmZml4Pzogc3RyaW5nIHwgbnVsbCxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IGludGVycG9sYXRpb25WKGxWaWV3LCB2YWx1ZXMpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICBzdHlsZVByb3BJbnRlcm5hbChcbiAgICAgICAgbFZpZXcsIGdldFNlbGVjdGVkSW5kZXgoKSwgc3R5bGVJbmRleCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksXG4gICAgICAgIGludGVycG9sYXRlZCBhcyBzdHJpbmcsIHZhbHVlU3VmZml4LCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuICByZXR1cm4gybXJtXN0eWxlUHJvcEludGVycG9sYXRlVjtcbn1cbiJdfQ==