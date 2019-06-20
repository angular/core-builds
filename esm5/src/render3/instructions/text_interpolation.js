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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate1(prefix, v0, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation1(prefix, v0, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate2(prefix, v0, i0, v1, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation2(prefix, v0, i0, v1, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate3(prefix, v0, i0, v1, i1, v2, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation3(prefix, v0, i0, v1, i1, v2, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @returns itself, so that it may be chained.
 * @see ɵɵtextInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @param i4 Static value used for concatenation only.
 * @param v5 Value checked for change. @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 * @returns itself, so that it may be chained.
 * @see textInterpolateV
 * @codeGenApi
 */
export function ɵɵtextInterpolate8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
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
 *.
 * @param values The a collection of values and the strings in between those values, beginning with
 * a string prefix and ending with a string suffix.
 * (e.g. `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 *
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵtextInterpolateV(values) {
    var index = getSelectedIndex();
    var lView = getLView();
    var interpolated = ɵɵinterpolationV(values);
    if (interpolated !== NO_CHANGE) {
        textBindingInternal(lView, index, interpolated);
    }
    return ɵɵtextInterpolateV;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dF9pbnRlcnBvbGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGV4dF9pbnRlcnBvbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVwQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNqTSxPQUFPLEVBQW1CLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRy9EOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEVBQU87SUFDdkMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMvQixPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUM7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLE1BQWMsRUFBRSxFQUFPLEVBQUUsTUFBYztJQUN4RSxJQUFNLEtBQUssR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ2pDLElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDMUQsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO1FBQzlCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBc0IsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtCRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFDOUQsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEUsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO1FBQzlCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBc0IsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUNqRSxNQUFjO0lBQ2hCLElBQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDakMsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDMUUsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO1FBQzlCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBc0IsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQ3RGLE1BQWM7SUFDaEIsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xGLElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRTtRQUM5QixtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQXNCLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUN0RixFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFDckMsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDMUYsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO1FBQzlCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBc0IsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDdEYsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFDMUQsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsRyxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUU7UUFDOUIsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFzQixDQUFDLENBQUM7S0FDM0Q7SUFDRCxPQUFPLGtCQUFrQixDQUFDO0FBQzVCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDdEYsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQzdELE1BQWM7SUFDaEIsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLFlBQVksR0FDZCxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pGLElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRTtRQUM5QixtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQXNCLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUN0RixFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUNsRixNQUFjO0lBQ2hCLElBQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDakMsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxZQUFZLEdBQ2QsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pHLElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRTtRQUM5QixtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQXNCLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVCRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxNQUFhO0lBQzlDLElBQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDakMsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUMsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO1FBQzlCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBc0IsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmltcG9ydCB7ybXJtWludGVycG9sYXRpb24xLCDJtcm1aW50ZXJwb2xhdGlvbjIsIMm1ybVpbnRlcnBvbGF0aW9uMywgybXJtWludGVycG9sYXRpb240LCDJtcm1aW50ZXJwb2xhdGlvbjUsIMm1ybVpbnRlcnBvbGF0aW9uNiwgybXJtWludGVycG9sYXRpb243LCDJtcm1aW50ZXJwb2xhdGlvbjgsIMm1ybVpbnRlcnBvbGF0aW9uVn0gZnJvbSAnLi9pbnRlcnBvbGF0aW9uJztcbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgdGV4dEJpbmRpbmdJbnRlcm5hbH0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCBhIGxvbmUgYm91bmQgdmFsdWVcbiAqXG4gKiBVc2VkIHdoZW4gYSB0ZXh0IG5vZGUgaGFzIDEgaW50ZXJwb2xhdGVkIHZhbHVlIGluIGl0LCBhbiBubyBhZGRpdGlvbmFsIHRleHRcbiAqIHN1cnJvdW5kcyB0aGF0IGludGVycG9sYXRlZCB2YWx1ZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2Pnt7djB9fTwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlKHYwKTtcbiAqIGBgYFxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSB0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZSh2MDogYW55KTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIMm1ybV0ZXh0SW50ZXJwb2xhdGUxKCcnLCB2MCwgJycpO1xuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTtcbn1cblxuXG4vKipcbiAqXG4gKiBVcGRhdGUgdGV4dCBjb250ZW50IHdpdGggc2luZ2xlIGJvdW5kIHZhbHVlIHN1cnJvdW5kZWQgYnkgb3RoZXIgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gYSB0ZXh0IG5vZGUgaGFzIDEgaW50ZXJwb2xhdGVkIHZhbHVlIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXY+cHJlZml4e3t2MH19c3VmZml4PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybV0ZXh0SW50ZXJwb2xhdGUxKCdwcmVmaXgnLCB2MCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIHRleHRJbnRlcnBvbGF0ZVZcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkID0gybXJtWludGVycG9sYXRpb24xKHByZWZpeCwgdjAsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTE7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCAyIGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyAyIGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19c3VmZml4PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybV0ZXh0SW50ZXJwb2xhdGUyKCdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIHRleHRJbnRlcnBvbGF0ZVZcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkID0gybXJtWludGVycG9sYXRpb24yKHByZWZpeCwgdjAsIGkwLCB2MSwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZCAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldywgaW5kZXgsIGludGVycG9sYXRlZCBhcyBzdHJpbmcpO1xuICB9XG4gIHJldHVybiDJtcm1dGV4dEludGVycG9sYXRlMjtcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIHRleHQgY29udGVudCB3aXRoIDMgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgb3RoZXIgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gYSB0ZXh0IG5vZGUgaGFzIDMgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2PnByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19c3VmZml4PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybV0ZXh0SW50ZXJwb2xhdGUzKFxuICogJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBzZWUgdGV4dEludGVycG9sYXRlVlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0SW50ZXJwb2xhdGUzKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IMm1ybVpbnRlcnBvbGF0aW9uMyhwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2Miwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZCAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldywgaW5kZXgsIGludGVycG9sYXRlZCBhcyBzdHJpbmcpO1xuICB9XG4gIHJldHVybiDJtcm1dGV4dEludGVycG9sYXRlMztcbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIHRleHQgY29udGVudCB3aXRoIDQgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgb3RoZXIgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gYSB0ZXh0IG5vZGUgaGFzIDQgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2PnByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlNChcbiAqICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIMm1ybV0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZTQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkID0gybXJtWludGVycG9sYXRpb240KHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTQ7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCA1IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyA1IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19c3VmZml4PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybV0ZXh0SW50ZXJwb2xhdGU1KFxuICogJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBzZWUgdGV4dEludGVycG9sYXRlVlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0SW50ZXJwb2xhdGU1KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9IMm1ybVpbnRlcnBvbGF0aW9uNShwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTU7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCA2IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyA2IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlNihcbiAqICAgICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIHRleHRJbnRlcnBvbGF0ZVZcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlNihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWQgPSDJtcm1aW50ZXJwb2xhdGlvbjYocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTY7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCA3IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyA3IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX1zdWZmaXg8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtXRleHRJbnRlcnBvbGF0ZTcoXG4gKiAgICAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICctJywgdjYsICdzdWZmaXgnKTtcbiAqIGBgYFxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQHNlZSB0ZXh0SW50ZXJwb2xhdGVWXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHRJbnRlcnBvbGF0ZTcoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWQgPVxuICAgICAgybXJtWludGVycG9sYXRpb243KHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBpNSwgdjYsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZTc7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCA4IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IG90aGVyIHRleHQuXG4gKlxuICogVXNlZCB3aGVuIGEgdGV4dCBub2RlIGhhcyA4IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdj5wcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319c3VmZml4PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybV0ZXh0SW50ZXJwb2xhdGU4KFxuICogICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJy0nLCB2NiwgJy0nLCB2NywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAc2VlIHRleHRJbnRlcnBvbGF0ZVZcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dEludGVycG9sYXRlOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZCA9XG4gICAgICDJtcm1aW50ZXJwb2xhdGlvbjgocHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIGk1LCB2NiwgaTYsIHY3LCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgaW50ZXJwb2xhdGVkIGFzIHN0cmluZyk7XG4gIH1cbiAgcmV0dXJuIMm1ybV0ZXh0SW50ZXJwb2xhdGU4O1xufVxuXG4vKipcbiAqIFVwZGF0ZSB0ZXh0IGNvbnRlbnQgd2l0aCA5IG9yIG1vcmUgYm91bmQgdmFsdWVzIG90aGVyIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIG51bWJlciBvZiBpbnRlcnBvbGF0ZWQgdmFsdWVzIGV4Y2VlZHMgOC5cbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2PnByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19LXt7djZ9fS17e3Y3fX0te3t2OH19LXt7djl9fXN1ZmZpeDwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1dGV4dEludGVycG9sYXRlVihcbiAqICBbJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnLScsIHY3LCAnLScsIHY5LFxuICogICdzdWZmaXgnXSk7XG4gKiBgYGBcbiAqLlxuICogQHBhcmFtIHZhbHVlcyBUaGUgYSBjb2xsZWN0aW9uIG9mIHZhbHVlcyBhbmQgdGhlIHN0cmluZ3MgaW4gYmV0d2VlbiB0aG9zZSB2YWx1ZXMsIGJlZ2lubmluZyB3aXRoXG4gKiBhIHN0cmluZyBwcmVmaXggYW5kIGVuZGluZyB3aXRoIGEgc3RyaW5nIHN1ZmZpeC5cbiAqIChlLmcuIGBbJ3ByZWZpeCcsIHZhbHVlMCwgJy0nLCB2YWx1ZTEsICctJywgdmFsdWUyLCAuLi4sIHZhbHVlOTksICdzdWZmaXgnXWApXG4gKlxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0SW50ZXJwb2xhdGVWKHZhbHVlczogYW55W10pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkID0gybXJtWludGVycG9sYXRpb25WKHZhbHVlcyk7XG4gIGlmIChpbnRlcnBvbGF0ZWQgIT09IE5PX0NIQU5HRSkge1xuICAgIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXcsIGluZGV4LCBpbnRlcnBvbGF0ZWQgYXMgc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gybXJtXRleHRJbnRlcnBvbGF0ZVY7XG59XG4iXX0=