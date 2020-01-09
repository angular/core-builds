import { __read, __spread } from "tslib";
import { TVIEW } from '../interfaces/view';
import { getBindingIndex, getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { interpolation1, interpolation2, interpolation3, interpolation4, interpolation5, interpolation6, interpolation7, interpolation8, interpolationV } from './interpolation';
import { elementAttributeInternal, storePropertyBindingMetadata } from './shared';
/**
 *
 * Update an interpolated attribute on an element with single bound value surrounded by text.
 *
 * Used when the value passed to a property has 1 interpolated value in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate1('title', 'prefix', v0, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate1(attrName, prefix, v0, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation1(lView, prefix, v0, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 1, prefix, suffix);
    }
    return ɵɵattributeInterpolate1;
}
/**
 *
 * Update an interpolated attribute on an element with 2 bound values surrounded by text.
 *
 * Used when the value passed to a property has 2 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate2('title', 'prefix', v0, '-', v1, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate2(attrName, prefix, v0, i0, v1, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation2(lView, prefix, v0, i0, v1, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 2, prefix, i0, suffix);
    }
    return ɵɵattributeInterpolate2;
}
/**
 *
 * Update an interpolated attribute on an element with 3 bound values surrounded by text.
 *
 * Used when the value passed to a property has 3 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate3(
 * 'title', 'prefix', v0, '-', v1, '-', v2, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate3(attrName, prefix, v0, i0, v1, i1, v2, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 3, prefix, i0, i1, suffix);
    }
    return ɵɵattributeInterpolate3;
}
/**
 *
 * Update an interpolated attribute on an element with 4 bound values surrounded by text.
 *
 * Used when the value passed to a property has 4 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate4(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
 * @param prefix Static value used for concatenation only.
 * @param v0 Value checked for change.
 * @param i0 Static value used for concatenation only.
 * @param v1 Value checked for change.
 * @param i1 Static value used for concatenation only.
 * @param v2 Value checked for change.
 * @param i2 Static value used for concatenation only.
 * @param v3 Value checked for change.
 * @param suffix Static value used for concatenation only.
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate4(attrName, prefix, v0, i0, v1, i1, v2, i2, v3, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 4, prefix, i0, i1, i2, suffix);
    }
    return ɵɵattributeInterpolate4;
}
/**
 *
 * Update an interpolated attribute on an element with 5 bound values surrounded by text.
 *
 * Used when the value passed to a property has 5 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate5(
 * 'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
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
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate5(attrName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation5(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 5, prefix, i0, i1, i2, i3, suffix);
    }
    return ɵɵattributeInterpolate5;
}
/**
 *
 * Update an interpolated attribute on an element with 6 bound values surrounded by text.
 *
 * Used when the value passed to a property has 6 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate6(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
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
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate6(attrName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation6(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 6, prefix, i0, i1, i2, i3, i4, suffix);
    }
    return ɵɵattributeInterpolate6;
}
/**
 *
 * Update an interpolated attribute on an element with 7 bound values surrounded by text.
 *
 * Used when the value passed to a property has 7 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate7(
 *    'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
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
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate7(attrName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation7(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 7, prefix, i0, i1, i2, i3, i4, i5, suffix);
    }
    return ɵɵattributeInterpolate7;
}
/**
 *
 * Update an interpolated attribute on an element with 8 bound values surrounded by text.
 *
 * Used when the value passed to a property has 8 interpolated values in it:
 *
 * ```html
 * <div attr.title="prefix{{v0}}-{{v1}}-{{v2}}-{{v3}}-{{v4}}-{{v5}}-{{v6}}-{{v7}}suffix"></div>
 * ```
 *
 * Its compiled representation is::
 *
 * ```ts
 * ɵɵattributeInterpolate8(
 *  'title', 'prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, 'suffix');
 * ```
 *
 * @param attrName The name of the attribute to update
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
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolate8(attrName, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix, sanitizer, namespace) {
    var lView = getLView();
    var interpolatedValue = interpolation8(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix);
    if (interpolatedValue !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolatedValue, lView, sanitizer, namespace);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, 'attr.' + attrName, getBindingIndex() - 8, prefix, i0, i1, i2, i3, i4, i5, i6, suffix);
    }
    return ɵɵattributeInterpolate8;
}
/**
 * Update an interpolated attribute on an element with 8 or more bound values surrounded by text.
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
 * ɵɵattributeInterpolateV(
 *  'title', ['prefix', v0, '-', v1, '-', v2, '-', v3, '-', v4, '-', v5, '-', v6, '-', v7, '-', v9,
 *  'suffix']);
 * ```
 *
 * @param attrName The name of the attribute to update.
 * @param values The a collection of values and the strings in-between those values, beginning with
 * a string prefix and ending with a string suffix.
 * (e.g. `['prefix', value0, '-', value1, '-', value2, ..., value99, 'suffix']`)
 * @param sanitizer An optional sanitizer function
 * @returns itself, so that it may be chained.
 * @codeGenApi
 */
export function ɵɵattributeInterpolateV(attrName, values, sanitizer, namespace) {
    var lView = getLView();
    var interpolated = interpolationV(lView, values);
    if (interpolated !== NO_CHANGE) {
        var nodeIndex = getSelectedIndex();
        elementAttributeInternal(nodeIndex, attrName, interpolated, lView, sanitizer, namespace);
        if (ngDevMode) {
            var interpolationInBetween = [values[0]]; // prefix
            for (var i = 2; i < values.length; i += 2) {
                interpolationInBetween.push(values[i]);
            }
            storePropertyBindingMetadata.apply(void 0, __spread([lView[TVIEW].data, nodeIndex, 'attr.' + attrName,
                getBindingIndex() - interpolationInBetween.length + 1], interpolationInBetween));
        }
    }
    return ɵɵattributeInterpolateV;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXR0cmlidXRlX2ludGVycG9sYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9hdHRyaWJ1dGVfaW50ZXJwb2xhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBUUEsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDL0ssT0FBTyxFQUFDLHdCQUF3QixFQUFFLDRCQUE0QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSWhGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVCRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsRUFBTyxFQUFFLE1BQWMsRUFBRSxTQUF1QixFQUNsRixTQUFrQjtJQUNwQixJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRSxJQUFJLGlCQUFpQixLQUFLLFNBQVMsRUFBRTtRQUNuQyxJQUFNLFNBQVMsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3JDLHdCQUF3QixDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFB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QUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxHQUFHLFFBQVE7Z0JBQ2hELGVBQWUsRUFBRSxHQUFHLHNCQUFzQixDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUssc0JBQXNCLEdBQUU7U0FDdkY7S0FDRjtJQUNELE9BQU8sdUJBQXVCLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7VFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuXG5pbXBvcnQge2ludGVycG9sYXRpb24xLCBpbnRlcnBvbGF0aW9uMiwgaW50ZXJwb2xhdGlvbjMsIGludGVycG9sYXRpb240LCBpbnRlcnBvbGF0aW9uNSwgaW50ZXJwb2xhdGlvbjYsIGludGVycG9sYXRpb243LCBpbnRlcnBvbGF0aW9uOCwgaW50ZXJwb2xhdGlvblZ9IGZyb20gJy4vaW50ZXJwb2xhdGlvbic7XG5pbXBvcnQge2VsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbCwgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKlxuICogVXBkYXRlIGFuIGludGVycG9sYXRlZCBhdHRyaWJ1dGUgb24gYW4gZWxlbWVudCB3aXRoIHNpbmdsZSBib3VuZCB2YWx1ZSBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgMSBpbnRlcnBvbGF0ZWQgdmFsdWUgaW4gaXQ6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBhdHRyLnRpdGxlPVwicHJlZml4e3t2MH19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUxKCd0aXRsZScsICdwcmVmaXgnLCB2MCwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUxKFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4sXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nKTogdHlwZW9mIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTEge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjEobFZpZXcsIHByZWZpeCwgdjAsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChub2RlSW5kZXgsIGF0dHJOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgbFZpZXcsIHNhbml0aXplciwgbmFtZXNwYWNlKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsICdhdHRyLicgKyBhdHRyTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSAxLFxuICAgICAgICAgICAgICAgICAgICAgcHJlZml4LCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUxO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50IHdpdGggMiBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDIgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGF0dHIudGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUyKCd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUyKFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBzdWZmaXg6IHN0cmluZyxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiwgbmFtZXNwYWNlPzogc3RyaW5nKTogdHlwZW9mIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTIge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjIobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgc3VmZml4KTtcbiAgaWYgKGludGVycG9sYXRlZFZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBub2RlSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKG5vZGVJbmRleCwgYXR0ck5hbWUsIGludGVycG9sYXRlZFZhbHVlLCBsVmlldywgc2FuaXRpemVyLCBuYW1lc3BhY2UpO1xuICAgIG5nRGV2TW9kZSAmJiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgICAgICAgICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGEsIG5vZGVJbmRleCwgJ2F0dHIuJyArIGF0dHJOYW1lLCBnZXRCaW5kaW5nSW5kZXgoKSAtIDIsXG4gICAgICAgICAgICAgICAgICAgICBwcmVmaXgsIGkwLCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUyO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50IHdpdGggMyBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDMgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGF0dHIudGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOjpcbiAqXG4gKiBgYGB0c1xuICogybXJtWF0dHJpYnV0ZUludGVycG9sYXRlMyhcbiAqICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUzKFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiwgbmFtZXNwYWNlPzogc3RyaW5nKTogdHlwZW9mIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTMge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjMobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwobm9kZUluZGV4LCBhdHRyTmFtZSwgaW50ZXJwb2xhdGVkVmFsdWUsIGxWaWV3LCBzYW5pdGl6ZXIsIG5hbWVzcGFjZSk7XG4gICAgbmdEZXZNb2RlICYmIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgICAgICBsVmlld1tUVklFV10uZGF0YSwgbm9kZUluZGV4LCAnYXR0ci4nICsgYXR0ck5hbWUsIGdldEJpbmRpbmdJbmRleCgpIC0gMyxcbiAgICAgICAgICAgICAgICAgICAgIHByZWZpeCwgaTAsIGkxLCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGUzO1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50IHdpdGggNCBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDQgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGF0dHIudGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX1zdWZmaXhcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEl0cyBjb21waWxlZCByZXByZXNlbnRhdGlvbiBpczo6XG4gKlxuICogYGBgdHNcbiAqIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTQoXG4gKiAndGl0bGUnLCAncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICdzdWZmaXgnKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBhdHRyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVwZGF0ZVxuICogQHBhcmFtIHByZWZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYxIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMSBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYyIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBpMiBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYzIFZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyBpdHNlbGYsIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWF0dHJpYnV0ZUludGVycG9sYXRlNChcbiAgICBhdHRyTmFtZTogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZyxcbiAgICB2MzogYW55LCBzdWZmaXg6IHN0cmluZywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4sXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nKTogdHlwZW9mIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGludGVycG9sYXRlZFZhbHVlID0gaW50ZXJwb2xhdGlvbjQobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChub2RlSW5kZXgsIGF0dHJOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgbFZpZXcsIHNhbml0aXplciwgbmFtZXNwYWNlKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsICdhdHRyLicgKyBhdHRyTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSA0LFxuICAgICAgICAgICAgICAgICAgICAgcHJlZml4LCBpMCwgaTEsIGkyLCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU0O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50IHdpdGggNSBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDUgaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGF0dHIudGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU1KFxuICogJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gYXR0ck5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvblxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTUoXG4gICAgYXR0ck5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcsIHNhbml0aXplcj86IFNhbml0aXplckZuLFxuICAgIG5hbWVzcGFjZT86IHN0cmluZyk6IHR5cGVvZiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU1IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9XG4gICAgICBpbnRlcnBvbGF0aW9uNShsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBzdWZmaXgpO1xuICBpZiAoaW50ZXJwb2xhdGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwobm9kZUluZGV4LCBhdHRyTmFtZSwgaW50ZXJwb2xhdGVkVmFsdWUsIGxWaWV3LCBzYW5pdGl6ZXIsIG5hbWVzcGFjZSk7XG4gICAgbmdEZXZNb2RlICYmIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgICAgICBsVmlld1tUVklFV10uZGF0YSwgbm9kZUluZGV4LCAnYXR0ci4nICsgYXR0ck5hbWUsIGdldEJpbmRpbmdJbmRleCgpIC0gNSxcbiAgICAgICAgICAgICAgICAgICAgIHByZWZpeCwgaTAsIGkxLCBpMiwgaTMsIHN1ZmZpeCk7XG4gIH1cbiAgcmV0dXJuIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTU7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgYXR0cmlidXRlIG9uIGFuIGVsZW1lbnQgd2l0aCA2IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgNiBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgYXR0ci50aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU2KFxuICogICAgJ3RpdGxlJywgJ3ByZWZpeCcsIHYwLCAnLScsIHYxLCAnLScsIHYyLCAnLScsIHYzLCAnLScsIHY0LCAnLScsIHY1LCAnc3VmZml4Jyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gYXR0ck5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byB1cGRhdGVcbiAqIEBwYXJhbSBwcmVmaXggU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTAgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTEgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MiBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTIgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MyBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTMgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NCBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gaTQgU3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2NSBWYWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvblxuICogQHJldHVybnMgaXRzZWxmLCBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTYoXG4gICAgYXR0ck5hbWU6IHN0cmluZywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcsIHNhbml0aXplcj86IFNhbml0aXplckZuLFxuICAgIG5hbWVzcGFjZT86IHN0cmluZyk6IHR5cGVvZiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU2IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWRWYWx1ZSA9XG4gICAgICBpbnRlcnBvbGF0aW9uNihsVmlldywgcHJlZml4LCB2MCwgaTAsIHYxLCBpMSwgdjIsIGkyLCB2MywgaTMsIHY0LCBpNCwgdjUsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChub2RlSW5kZXgsIGF0dHJOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgbFZpZXcsIHNhbml0aXplciwgbmFtZXNwYWNlKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsICdhdHRyLicgKyBhdHRyTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSA2LFxuICAgICAgICAgICAgICAgICAgICAgcHJlZml4LCBpMCwgaTEsIGkyLCBpMywgaTQsIHN1ZmZpeCk7XG4gIH1cbiAgcmV0dXJuIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZTY7XG59XG5cbi8qKlxuICpcbiAqIFVwZGF0ZSBhbiBpbnRlcnBvbGF0ZWQgYXR0cmlidXRlIG9uIGFuIGVsZW1lbnQgd2l0aCA3IGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSB2YWx1ZSBwYXNzZWQgdG8gYSBwcm9wZXJ0eSBoYXMgNyBpbnRlcnBvbGF0ZWQgdmFsdWVzIGluIGl0OlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgYXR0ci50aXRsZT1cInByZWZpeHt7djB9fS17e3YxfX0te3t2Mn19LXt7djN9fS17e3Y0fX0te3t2NX19LXt7djZ9fXN1ZmZpeFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogSXRzIGNvbXBpbGVkIHJlcHJlc2VudGF0aW9uIGlzOjpcbiAqXG4gKiBgYGB0c1xuICogybXJtWF0dHJpYnV0ZUludGVycG9sYXRlNyhcbiAqICAgICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJy0nLCB2NiwgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU3KFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLFxuICAgIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplckZuLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB0eXBlb2YgybXJtWF0dHJpYnV0ZUludGVycG9sYXRlNyB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPVxuICAgICAgaW50ZXJwb2xhdGlvbjcobFZpZXcsIHByZWZpeCwgdjAsIGkwLCB2MSwgaTEsIHYyLCBpMiwgdjMsIGkzLCB2NCwgaTQsIHY1LCBpNSwgdjYsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChub2RlSW5kZXgsIGF0dHJOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgbFZpZXcsIHNhbml0aXplciwgbmFtZXNwYWNlKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsICdhdHRyLicgKyBhdHRyTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSA3LFxuICAgICAgICAgICAgICAgICAgICAgcHJlZml4LCBpMCwgaTEsIGkyLCBpMywgaTQsIGk1LCBzdWZmaXgpO1xuICB9XG4gIHJldHVybiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU3O1xufVxuXG4vKipcbiAqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50IHdpdGggOCBib3VuZCB2YWx1ZXMgc3Vycm91bmRlZCBieSB0ZXh0LlxuICpcbiAqIFVzZWQgd2hlbiB0aGUgdmFsdWUgcGFzc2VkIHRvIGEgcHJvcGVydHkgaGFzIDggaW50ZXJwb2xhdGVkIHZhbHVlcyBpbiBpdDpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IGF0dHIudGl0bGU9XCJwcmVmaXh7e3YwfX0te3t2MX19LXt7djJ9fS17e3YzfX0te3t2NH19LXt7djV9fS17e3Y2fX0te3t2N319c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU4KFxuICogICd0aXRsZScsICdwcmVmaXgnLCB2MCwgJy0nLCB2MSwgJy0nLCB2MiwgJy0nLCB2MywgJy0nLCB2NCwgJy0nLCB2NSwgJy0nLCB2NiwgJy0nLCB2NywgJ3N1ZmZpeCcpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIGF0dHJOYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gdXBkYXRlXG4gKiBAcGFyYW0gcHJlZml4IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkwIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjEgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkxIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjIgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkyIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjMgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGkzIFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjQgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk0IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjUgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk1IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjYgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIGk2IFN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjcgVmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBTdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGU4KFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLFxuICAgIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcsIHNhbml0aXplcj86IFNhbml0aXplckZuLCBuYW1lc3BhY2U/OiBzdHJpbmcpOiB0eXBlb2YgybXJtWF0dHJpYnV0ZUludGVycG9sYXRlOCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW50ZXJwb2xhdGVkVmFsdWUgPSBpbnRlcnBvbGF0aW9uOChcbiAgICAgIGxWaWV3LCBwcmVmaXgsIHYwLCBpMCwgdjEsIGkxLCB2MiwgaTIsIHYzLCBpMywgdjQsIGk0LCB2NSwgaTUsIHY2LCBpNiwgdjcsIHN1ZmZpeCk7XG4gIGlmIChpbnRlcnBvbGF0ZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChub2RlSW5kZXgsIGF0dHJOYW1lLCBpbnRlcnBvbGF0ZWRWYWx1ZSwgbFZpZXcsIHNhbml0aXplciwgbmFtZXNwYWNlKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhLCBub2RlSW5kZXgsICdhdHRyLicgKyBhdHRyTmFtZSwgZ2V0QmluZGluZ0luZGV4KCkgLSA4LFxuICAgICAgICAgICAgICAgICAgICAgcHJlZml4LCBpMCwgaTEsIGkyLCBpMywgaTQsIGk1LCBpNiwgc3VmZml4KTtcbiAgfVxuICByZXR1cm4gybXJtWF0dHJpYnV0ZUludGVycG9sYXRlODtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYW4gaW50ZXJwb2xhdGVkIGF0dHJpYnV0ZSBvbiBhbiBlbGVtZW50IHdpdGggOCBvciBtb3JlIGJvdW5kIHZhbHVlcyBzdXJyb3VuZGVkIGJ5IHRleHQuXG4gKlxuICogVXNlZCB3aGVuIHRoZSBudW1iZXIgb2YgaW50ZXJwb2xhdGVkIHZhbHVlcyBleGNlZWRzIDcuXG4gKlxuICogYGBgaHRtbFxuICogPGRpdlxuICogIHRpdGxlPVwicHJlZml4e3t2MH19LXt7djF9fS17e3YyfX0te3t2M319LXt7djR9fS17e3Y1fX0te3t2Nn19LXt7djd9fS17e3Y4fX0te3t2OX19c3VmZml4XCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBJdHMgY29tcGlsZWQgcmVwcmVzZW50YXRpb24gaXM6OlxuICpcbiAqIGBgYHRzXG4gKiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGVWKFxuICogICd0aXRsZScsIFsncHJlZml4JywgdjAsICctJywgdjEsICctJywgdjIsICctJywgdjMsICctJywgdjQsICctJywgdjUsICctJywgdjYsICctJywgdjcsICctJywgdjksXG4gKiAgJ3N1ZmZpeCddKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBhdHRyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB2YWx1ZXMgVGhlIGEgY29sbGVjdGlvbiBvZiB2YWx1ZXMgYW5kIHRoZSBzdHJpbmdzIGluLWJldHdlZW4gdGhvc2UgdmFsdWVzLCBiZWdpbm5pbmcgd2l0aFxuICogYSBzdHJpbmcgcHJlZml4IGFuZCBlbmRpbmcgd2l0aCBhIHN0cmluZyBzdWZmaXguXG4gKiAoZS5nLiBgWydwcmVmaXgnLCB2YWx1ZTAsICctJywgdmFsdWUxLCAnLScsIHZhbHVlMiwgLi4uLCB2YWx1ZTk5LCAnc3VmZml4J11gKVxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb25cbiAqIEByZXR1cm5zIGl0c2VsZiwgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGVWKFxuICAgIGF0dHJOYW1lOiBzdHJpbmcsIHZhbHVlczogYW55W10sIHNhbml0aXplcj86IFNhbml0aXplckZuLFxuICAgIG5hbWVzcGFjZT86IHN0cmluZyk6IHR5cGVvZiDJtcm1YXR0cmlidXRlSW50ZXJwb2xhdGVWIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbnRlcnBvbGF0ZWQgPSBpbnRlcnBvbGF0aW9uVihsVmlldywgdmFsdWVzKTtcbiAgaWYgKGludGVycG9sYXRlZCAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChub2RlSW5kZXgsIGF0dHJOYW1lLCBpbnRlcnBvbGF0ZWQsIGxWaWV3LCBzYW5pdGl6ZXIsIG5hbWVzcGFjZSk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgY29uc3QgaW50ZXJwb2xhdGlvbkluQmV0d2VlbiA9IFt2YWx1ZXNbMF1dOyAgLy8gcHJlZml4XG4gICAgICBmb3IgKGxldCBpID0gMjsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBpbnRlcnBvbGF0aW9uSW5CZXR3ZWVuLnB1c2godmFsdWVzW2ldKTtcbiAgICAgIH1cbiAgICAgIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGEsIG5vZGVJbmRleCwgJ2F0dHIuJyArIGF0dHJOYW1lLFxuICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpIC0gaW50ZXJwb2xhdGlvbkluQmV0d2Vlbi5sZW5ndGggKyAxLCAuLi5pbnRlcnBvbGF0aW9uSW5CZXR3ZWVuKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIMm1ybVhdHRyaWJ1dGVJbnRlcnBvbGF0ZVY7XG59XG4iXX0=