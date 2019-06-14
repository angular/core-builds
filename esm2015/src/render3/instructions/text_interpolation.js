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
import { getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { ɵɵinterpolation1, ɵɵinterpolation2, ɵɵinterpolation3, ɵɵinterpolation4, ɵɵinterpolation5, ɵɵinterpolation6, ɵɵinterpolation7, ɵɵinterpolation8, ɵɵinterpolationV } from './interpolation';
import { textBindingInternal } from './shared';
/**
 *
 * Update text content with a lone bound value
 *
 * Used when a text node has 1 interpolated value in it, an no additional text
 * surrounds that interpolated value:
 *
 * ```html
 * <div>{{v0}}</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate(v0);
 * ```
 * @see textInterpolateV
 * \@codeGenApi
 * @param {?} v0
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate(v0) {
    ɵɵtextInterpolate1('', v0, '');
    return ɵɵtextInterpolate;
}
/**
 *
 * Update text content with single bound value surrounded by other text.
 *
 * Used when a text node has 1 interpolated value in it:
 *
 * ```html
 * <div>prefix{{v0}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate1('prefix', v0, 'suffix');
 * ```
 * @see textInterpolateV
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} suffix
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate1(prefix, v0, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation1(prefix, v0, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate1;
}
/**
 *
 * Update text content with 2 bound values surrounded by other text.
 *
 * Used when a text node has 2 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate2('prefix', v0, '-', v1, 'suffix');
 * ```
 * @see textInterpolateV
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} suffix
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate2(prefix, v0, i0, v1, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation2(prefix, v0, i0, v1, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate2;
}
/**
 *
 * Update text content with 3 bound values surrounded by other text.
 *
 * Used when a text node has 3 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate3(
 * 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 * @see textInterpolateV
 * \@codeGenApi
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} suffix
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate3(prefix, v0, i0, v1, i1, v2, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation3(prefix, v0, i0, v1, i1, v2, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate3;
}
/**
 *
 * Update text content with 4 bound values surrounded by other text.
 *
 * Used when a text node has 4 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate4(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 * @see ɵɵtextInterpolateV
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate4;
}
/**
 *
 * Update text content with 5 bound values surrounded by other text.
 *
 * Used when a text node has 5 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate5(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 * @see textInterpolateV
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate5;
}
/**
 *
 * Update text content with 6 bound values surrounded by other text.
 *
 * Used when a text node has 6 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate6(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @see textInterpolateV
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
 * @param {?} i4 Static value used for concatenation only.
 * @param {?} v5 Value checked for change. \@returns itself, so that it may be chained.
 * @param {?} suffix
 * @return {?}
 */
export function ɵɵtextInterpolate6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate6;
}
/**
 *
 * Update text content with 7 bound values surrounded by other text.
 *
 * Used when a text node has 7 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate7(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 * @see textInterpolateV
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate7;
}
/**
 *
 * Update text content with 8 bound values surrounded by other text.
 *
 * Used when a text node has 8 interpolated values in it:
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolate8(
 *  'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 * @see textInterpolateV
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
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolate8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolate8;
}
/**
 * Update text content with 9 or more bound values other surrounded by text.
 *
 * Used when the number of interpolated values exceeds 8.
 *
 * ```html
 * <div>prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix</div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵtextInterpolateV(
 *  ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 * .
 * \@codeGenApi
 * @param {?} values The a collection of values and the strings in between those values, beginning with
 * a string prefix and ending with a string suffix.
 * (e.g. `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 *
 * @return {?} itself, so that it may be chained.
 */
export function ɵɵtextInterpolateV(values) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const interpolated = ɵɵinterpolationV(values);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, (/** @type {?} */ (interpolated)));
    }
    return ɵɵtextInterpolateV;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dF9pbnRlcnBvbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGV4dF9pbnRlcnBvbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRXBDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ2pNLE9BQU8sRUFBbUIsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1Qi9ELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxFQUFPO0lBQ3ZDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDL0IsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNCRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsTUFBYyxFQUFFLEVBQU8sRUFBRSxNQUFjOztVQUNsRSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUU7O1VBQzFCLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQztJQUN6RCxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUU7UUFDOUIsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxtQkFBQSxZQUFZLEVBQVUsQ0FBQyxDQUFDO0tB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RyxRQUFRLEVBQUU7O1VBQ2xCLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7SUFDN0MsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO1FBQzlCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsbUJBQUEsWUFBWSxFQUFVLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Z2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuXG5pbXBvcnQge8m1ybVpbnRlcnBvbGF0aW9uMSwgybXJtWludGVycG9sYXRpb24yLCDJtcm1aW50ZXJwb2xhdGlvbjMsIMm1ybVpbnRlcnBvbGF0aW9uNCwgybXJtWludGVycG9sYXRpb241LCDJtcm1aW50ZXJwb2xhdGlvbjYsIMm1ybVpbnRlcnBvbGF0aW9uNywgybXJtWludGVycG9sYXRpb244LCDJtcm1aW50ZXJwb2xhdGlvblZ9IGZyb20gJy4vaW50ZXJwb2xhdGlvbic7XG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDksIHRleHRCaW5kaW5nSW50ZXJuYWx9IGZyb20gJy4vc2hhcmVkJztcblxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggYSBsb25lIGJvdW5kIHZhbHVlXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyAxIGludGVycG9sYXRlZCB2YWx1ZSBpbiBpdCwgYW4gbm8gYWRkaXRpb25hbCB0ZXh0XG4gKiBzdXJyb3VuZHMgdGhhdCBpbnRlcnBvbGF0ZWQgdmFsdWU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj57e3YwfX08L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXRleHRJbnRlcnBvbGF0ZSh2MCk7XG4gKiBgYGBcbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBzZWUgdGV4dEludGVycG9sYXRlVlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0SW50ZXJwb2xhdGUodjA6IGFueSk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICDJtcm1dGV4dEludGVycG9sYXRlMSgnJywgdjAsICcnKTtcbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGU7XG59XG5cblxuLyoqXG4gKlxuICogVXBkYXRlIHRleHQgY29udGVudCB3aXRoIHNpbmdsZSBib3VuZCB2YWx1ZSBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyAxIGludGVycG9sYXRlZCB2YWx1ZSBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2PnByZWZpeHt7djB9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlMSgncHJlZml4JywgdjAsICdzdWZmaXgnKTtcbiAqIGBgYFxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSB0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZTEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IMm1ybVpbnRlcnBvbGF0aW9uMShwcmVmaXgsIHYwLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGUxO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggMiBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSBvdGhlciB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiBhIHRleHQgbm9kZSBoYXMgMiBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXY+cHJlZml4e3t2MH19LXt7djF9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlMigncHJlZml4JywgdjAsICctJywgdjEsICdzdWZmaXgnKTtcbiAqIGBgYFxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSB0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZTIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IMm1ybVpbnRlcnBvbGF0aW9uMihwcmVmaXgsIHYwLCBpMCwgdjEsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTI7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCAzIGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyAzIGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlMyhcbiAqICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIHRleHRJbnRlcnBvbGF0ZVZcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWQgPSDJtcm1aW50ZXJwb2xhdGlvbjMocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTM7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCA0IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyA0IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX1zdWZmaXg8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXRleHRJbnRlcnBvbGF0ZTQoXG4gKiAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICdzdWZmaXgnKTtcbiAqIGBgYFxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSDJtcm1dGV4dEludGVycG9sYXRlVlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0SW50ZXJwb2xhdGU0KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IMm1ybVpbnRlcnBvbGF0aW9uNChwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGU0O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggNSBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSBvdGhlciB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiBhIHRleHQgbm9kZSBoYXMgNSBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXY+cHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlNShcbiAqICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIHRleHRJbnRlcnBvbGF0ZVZcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlNShcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWQgPSDJtcm1aW50ZXJwb2xhdGlvbjUocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGU1O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggNiBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSBvdGhlciB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiBhIHRleHQgbm9kZSBoYXMgNiBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXY+cHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX1zdWZmaXg8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXRleHRJbnRlcnBvbGF0ZTYoXG4gKiAgICAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBpNCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY1IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS4gQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSB0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZTYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkID0gybXJtWludGVycG9sYXRpb242KHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGU2O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggNyBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSBvdGhlciB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiBhIHRleHQgbm9kZSBoYXMgNyBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXY+cHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19c3VmZml4PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybV0ZXh0SW50ZXJwb2xhdGU3KFxuICogICAgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBzZWUgdGV4dEludGVycG9sYXRlVlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0SW50ZXJwb2xhdGU3KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkID1cbiAgICAgIMm1ybVpbnRlcnBvbGF0aW9uNyhwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgaTUsIHY2LCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGU3O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggOCBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSBvdGhlciB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiBhIHRleHQgbm9kZSBoYXMgOCBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXY+cHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19LXt7djd9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlOChcbiAqICAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICctJywgdjYsICctJywgdjcsICdzdWZmaXgnKTtcbiAqIGBgYFxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSB0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZTgoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZywgdjc6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWQgPVxuICAgICAgybXJtWludGVycG9sYXRpb244KHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBpNSwgdjYsIGk2LCB2Nywgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZCAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldywgaW5kZXgsIGludGVycG9sYXRlZCBhcyBzdHJpbmcpO1xuICB9XG4gIHJldHVybiDJtcm1dGV4dEludGVycG9sYXRlODtcbn1cblxuLyoqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggOSBvciBtb3JlIGJvdW5kIHZhbHVlcyBvdGhlciBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSBudW1iZXIgb2YgaW50ZXJwb2xhdGVkIHZhbHVlcyBleGNlZWRzIDguXG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319LXt7djh9fS17e3Y5fX1zdWZmaXg8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXRleHRJbnRlcnBvbGF0ZVYoXG4gKiAgWydwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJy0nLCB2NiwgJy0nLCB2NywgJy0nLCB2OSxcbiAqICAnc3VmZml4J10pO1xuICogYGBgXG4gKi5cbiAqIEBwYXJhbSB2YWx1ZXMgVGhlIGEgY29sbGVjdGlvbiBvZiB2YWx1ZXMgYW5kIHRoZSBzdHJpbmdzIGluIGJldHdlZW4gdGhvc2UgdmFsdWVzLCBiZWdpbm5pbmcgd2l0aFxuICogYSBzdHJpbmcgcHJlZml4IGFuZCBlbmRpbmcgd2l0aCBhIHN0cmluZyBzdWZmaXguXG4gKiAoZS5nLiBgWydwcmVmaXgnLCB2YWx1ZTAsICctJywgdmFsdWUxLCAnLScsIHZhbHVlMiwgLi4uLCB2YWx1ZTk5LCAnc3VmZml4J11gKVxuICpcbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlVih2YWx1ZXM6IGFueVtdKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IMm1ybVpbnRlcnBvbGF0aW9uVih2YWx1ZXMpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGVWO1xufVxuIl19