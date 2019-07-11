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
import { classMapInternal, getActiveDirectiveStylingIndex } from './styling';
/**
 *
 * Update an interpolated class on an element with single bound value surrounded by text.
 *
 * Used when the value passed to a property has 1 interpolated value in it:
 *
 * ```html
 * <div class="prefix{{v0}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate1('prefix', v0, 'suffix');
 * ```
 *
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate1(prefix, v0, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation1(lView, prefix, v0, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 2 bound values surrounded by text.
 *
 * Used when the value passed to a property has 2 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate2('prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate2(prefix, v0, i0, v1, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 3 bound values surrounded by text.
 *
 * Used when the value passed to a property has 3 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate3(
 * 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate3(prefix, v0, i0, v1, i1, v2, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 4 bound values surrounded by text.
 *
 * Used when the value passed to a property has 4 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate4(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 5 bound values surrounded by text.
 *
 * Used when the value passed to a property has 5 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate5(
 * 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
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
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation5(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 6 bound values surrounded by text.
 *
 * Used when the value passed to a property has 6 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate6(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
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
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation6(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 7 bound values surrounded by text.
 *
 * Used when the value passed to a property has 7 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate7(
 *    'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
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
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation7(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 *
 * Update an interpolated class on an element with 8 bound values surrounded by text.
 *
 * Used when the value passed to a property has 8 interpolated values in it:
 *
 * ```html
 * <div class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolate8(
 *  'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 *
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
 * @codeGenApi
 */
export function ɵɵclassMapInterpolate8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    var lView = getLView();
    var interpolatedValue = interpolation8(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
/**
 * Update an interpolated class on an element with 8 or more bound values surrounded by text.
 *
 * Used when the number of interpolated values exceeds 7.
 *
 * ```html
 * <div
 *  class="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}-{{v8}}-{{v9}}suffix"></div>
 * ```
 *
 * Its compiled representation is:
 *
 * ```ts
 * ɵɵclassMapInterpolateV(
 *  ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *.
 * @param values The a collection of values and the strings in-between those values, beginning with
 * a string prefix and ending with a string suffix.
 * (e.g. `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @codeGenApi
 */
export function ɵɵclassMapInterpolateV(values) {
    var lView = getLView();
    var interpolatedValue = interpolationV(lView, values);
    if (interpolatedValue !== NO_CHANGE) {
        classMapInternal(lView, getSelectedIndex(), getActiveDirectiveStylingIndex(), interpolatedValue);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfbWFwX2ludGVycG9sYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9jbGFzc19tYXBfaW50ZXJwb2xhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDL0ssT0FBTyxFQUFDLGdCQUFnQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRzNFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxNQUFjLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFDNUUsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEUsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7UUFDbkMsZ0JBQWdCLENBQ1osS0FBSyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsOEJBQThCLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3JGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0JHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFB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QUFnQixFQUFFLEVBQUUsOEJBQThCLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3JGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmltcG9ydCB7aW50ZXJwb2xhdGlvbjEsIGludGVycG9sYXRpb24yLCBpbnRlcnBvbGF0aW9uMywgaW50ZXJwb2xhdGlvbjQsIGludGVycG9sYXRpb241LCBpbnRlcnBvbGF0aW9uNiwgaW50ZXJwb2xhdGlvbjcsIGludGVycG9sYXRpb244LCBpbnRlcnBvbGF0aW9uVn0gZnJvbSAnLi9pbnRlcnBvbGF0aW9uJztcbmltcG9ydCB7Y2xhc3NNYXBJbnRlcm5hbCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4fSBmcm9tICcuL3N0eWxpbmcnO1xuXG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgY2xhc3Mgb24gYW4gZWxlbWVudCB3aXRoIHNpbmdsZSBib3VuZCB2YWx1ZSBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMSBpbnRlcnBvbGF0ZWQgdmFsdWUgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBjbGFzcz1cInByZWZpeHt7djB9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTEoJ3ByZWZpeCcsIHYwLCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcEludGVycG9sYXRlMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb24xKGxWaWV3LCBwcmVmaXgsIHYwLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLCBpbnRlcnBvbGF0ZWRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBjbGFzcyBvbiBhbiBlbGVtZW50IHdpdGggMiBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDIgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGNsYXNzPVwicHJlZml4e3t2MH19LXt7djF9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTIoJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcEludGVycG9sYXRlMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb24yKGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2xhc3NNYXBJbnRlcm5hbChcbiAgICAgICAgbFZpZXcsIGdldFNlbGVjdGVkSW5kZXgoKSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksIGludGVycG9sYXRlZFZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGNsYXNzIG9uIGFuIGVsZW1lbnQgd2l0aCAzIGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMyBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgY2xhc3M9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTMoXG4gKiAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwSW50ZXJwb2xhdGUzKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjMobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLCBpbnRlcnBvbGF0ZWRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBjbGFzcyBvbiBhbiBlbGVtZW50IHdpdGggNCBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDQgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGNsYXNzPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVjbGFzc01hcEludGVycG9sYXRlNChcbiAqICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9IGludGVycG9sYXRpb240KGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLCBpbnRlcnBvbGF0ZWRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBjbGFzcyBvbiBhbiBlbGVtZW50IHdpdGggNSBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDUgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGNsYXNzPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTUoXG4gKiAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwSW50ZXJwb2xhdGU1KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPVxuICAgICAgaW50ZXJwb2xhdGlvbjUobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjbGFzc01hcEludGVybmFsKFxuICAgICAgICBsVmlldywgZ2V0U2VsZWN0ZWRJbmRleCgpLCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSwgaW50ZXJwb2xhdGVkVmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgY2xhc3Mgb24gYW4gZWxlbWVudCB3aXRoIDYgYm91bmQgdmFsdWVzIHN1cnJvdW5kZWQgYnkgdGV4dC5cbiAqXG4gKiBVc2VkIHdoZW4gdGhlIHZhbHVlIHBhc3NlZCB0byBhIHByb3BlcnR5IGhhcyA2IGludGVycG9sYXRlZCB2YWx1ZXMgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBjbGFzcz1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVjbGFzc01hcEludGVycG9sYXRlNihcbiAqICAgICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMyBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY0IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpNCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHY1IFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9XG4gICAgICBpbnRlcnBvbGF0aW9uNihsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2xhc3NNYXBJbnRlcm5hbChcbiAgICAgICAgbFZpZXcsIGdldFNlbGVjdGVkSW5kZXgoKSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksIGludGVycG9sYXRlZFZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGNsYXNzIG9uIGFuIGVsZW1lbnQgd2l0aCA3IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgNyBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgY2xhc3M9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczpcbiAqXG4gKiBgYGB0c1xuICogybXJtWNsYXNzTWFwSW50ZXJwb2xhdGU3KFxuICogICAgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcEludGVycG9sYXRlNyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID1cbiAgICAgIGludGVycG9sYXRpb243KGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgaTUsIHY2LCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgICAgIGxWaWV3LCBnZXRTZWxlY3RlZEluZGV4KCksIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpLCBpbnRlcnBvbGF0ZWRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBjbGFzcyBvbiBhbiBlbGVtZW50IHdpdGggOCBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDggaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGNsYXNzPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19LXt7djd9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZTgoXG4gKiAgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnLScsIHY2LCAnLScsIHY3LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk2IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjcgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcEludGVycG9sYXRlOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uOChcbiAgICAgIGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgaTUsIHY2LCBpNiwgdjcsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2xhc3NNYXBJbnRlcm5hbChcbiAgICAgICAgbFZpZXcsIGdldFNlbGVjdGVkSW5kZXgoKSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksIGludGVycG9sYXRlZFZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgY2xhc3Mgb24gYW4gZWxlbWVudCB3aXRoIDggb3IgbW9yZSBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgbnVtYmVyIG9mIGludGVycG9sYXRlZCB2YWx1ZXMgZXhjZWVkcyA3LlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXZcbiAqICBjbGFzcz1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19LXt7djZ9fS17e3Y3fX0te3t2OH19LXt7djl9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZVYoXG4gKiAgWydwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJy0nLCB2NiwgJy0nLCB2NywgJy0nLCB2OSxcbiAqICAnc3VmZml4J10pO1xuICogYGBgXG4gKi5cbiAqIEBwYXJhbSB2YWx1ZXMgVGhlIGEgY29sbGVjdGlvbiBvZiB2YWx1ZXMgYW5kIHRoZSBzdHJpbmdzIGluLWJldHdlZW4gdGhvc2UgdmFsdWVzLCBiZWdpbm5pbmcgd2l0aFxuICogYSBzdHJpbmcgcHJlZml4IGFuZCBlbmRpbmcgd2l0aCBhIHN0cmluZyBzdWZmaXguXG4gKiAoZS5nLiBgWydwcmVmaXgnLCB2YWx1ZTAsICctJywgdmFsdWUxLCAnLScsIHZhbHVlMiwgLi4uLCB2YWx1ZTk5LCAnc3VmZml4J11gKVxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcEludGVycG9sYXRlVih2YWx1ZXM6IGFueVtdKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uVihsVmlldywgdmFsdWVzKTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjbGFzc01hcEludGVybmFsKFxuICAgICAgICBsVmlldywgZ2V0U2VsZWN0ZWRJbmRleCgpLCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSwgaW50ZXJwb2xhdGVkVmFsdWUpO1xuICB9XG59XG4iXX0=