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
import { assertEqual, assertLessThan } from '../../util/assert';
import { bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4 } from '../bindings';
import { BINDING_INDEX } from '../interfaces/view';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
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
 * @param {?} lView
 * @param {?} values
 * @return {?}
 */
export function interpolationV(lView, values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    /** @type {?} */
    let isBindingUpdated = false;
    /** @type {?} */
    let bindingIndex = lView[BINDING_INDEX];
    for (let i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        isBindingUpdated = bindingUpdated(lView, bindingIndex++, values[i]) || isBindingUpdated;
    }
    lView[BINDING_INDEX] = bindingIndex;
    if (!isBindingUpdated) {
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
 * @param {?} lView
 * @param {?} prefix static value used for concatenation only.
 * @param {?} v0 value checked for change.
 * @param {?} suffix static value used for concatenation only.
 * @return {?}
 */
export function interpolation1(lView, prefix, v0, suffix) {
    /** @type {?} */
    const different = bindingUpdated(lView, lView[BINDING_INDEX]++, v0);
    return different ? prefix + renderStringify(v0) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation binding with 2 expressions.
 * @param {?} lView
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} suffix
 * @return {?}
 */
export function interpolation2(lView, prefix, v0, i0, v1, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    const different = bindingUpdated2(lView, bindingIndex, v0, v1);
    lView[BINDING_INDEX] += 2;
    return different ? prefix + renderStringify(v0) + i0 + renderStringify(v1) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation binding with 3 expressions.
 * @param {?} lView
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} suffix
 * @return {?}
 */
export function interpolation3(lView, prefix, v0, i0, v1, i1, v2, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    const different = bindingUpdated3(lView, bindingIndex, v0, v1, v2);
    lView[BINDING_INDEX] += 3;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + suffix :
        NO_CHANGE;
}
/**
 * Create an interpolation binding with 4 expressions.
 * @param {?} lView
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
export function interpolation4(lView, prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    const different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    lView[BINDING_INDEX] += 4;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 5 expressions.
 * @param {?} lView
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
export function interpolation5(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated(lView, bindingIndex + 4, v4) || different;
    lView[BINDING_INDEX] += 5;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 6 expressions.
 * @param {?} lView
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
export function interpolation6(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated2(lView, bindingIndex + 4, v4, v5) || different;
    lView[BINDING_INDEX] += 6;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 7 expressions.
 * @param {?} lView
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
export function interpolation7(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated3(lView, bindingIndex + 4, v4, v5, v6) || different;
    lView[BINDING_INDEX] += 7;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 8 expressions.
 * @param {?} lView
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
export function interpolation8(lView, prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX];
    /** @type {?} */
    let different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated4(lView, bindingIndex + 4, v4, v5, v6, v7) || different;
    lView[BINDING_INDEX] += 8;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + i6 + renderStringify(v7) + suffix :
        NO_CHANGE;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJwb2xhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2ludGVycG9sYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlELE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDOUYsT0FBTyxFQUFDLGFBQWEsRUFBUSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JuRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVksRUFBRSxNQUFhO0lBQ3hELFNBQVMsSUFBSSxjQUFjLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUMvRSxTQUFTLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDOztRQUNsRixnQkFBZ0IsR0FBRyxLQUFLOztRQUN4QixZQUFZLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztJQUV2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3pDLCtDQUErQztRQUMvQyxnQkFBZ0IsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLGdCQUFnQixDQUFD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Q0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUNsRixLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTFCLE9BQU8sU0FBUyxDQUFDLENBQUM7UUFDZCxNQUFNLEdBQUcsZUFBZSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO1lBQ25GLGVBQWUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUM5RSxlQUFlLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUM3RCxTQUFTLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWQsIGJpbmRpbmdVcGRhdGVkMiwgYmluZGluZ1VwZGF0ZWQzLCBiaW5kaW5nVXBkYXRlZDR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb25WKGxWaWV3OiBMVmlldywgdmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oMiwgdmFsdWVzLmxlbmd0aCwgJ3Nob3VsZCBoYXZlIGF0IGxlYXN0IDMgdmFsdWVzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh2YWx1ZXMubGVuZ3RoICUgMiwgMSwgJ3Nob3VsZCBoYXZlIGFuIG9kZCBudW1iZXIgb2YgdmFsdWVzJyk7XG4gIGxldCBpc0JpbmRpbmdVcGRhdGVkID0gZmFsc2U7XG4gIGxldCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgaXNCaW5kaW5nVXBkYXRlZCA9IGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgrKywgdmFsdWVzW2ldKSB8fCBpc0JpbmRpbmdVcGRhdGVkO1xuICB9XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ0luZGV4O1xuXG4gIGlmICghaXNCaW5kaW5nVXBkYXRlZCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICAvLyBCdWlsZCB0aGUgdXBkYXRlZCBjb250ZW50XG4gIGxldCBjb250ZW50ID0gdmFsdWVzWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnRlbnQgKz0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlc1tpXSkgKyB2YWx1ZXNbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAxIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHByZWZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24xKGxWaWV3OiBMVmlldywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBsVmlld1tCSU5ESU5HX0lOREVYXSsrLCB2MCk7XG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24yKFxuICAgIGxWaWV3OiBMVmlldywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxKTtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gMjtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIGkwICsgcmVuZGVyU3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDMgZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBsVmlldzogTFZpZXcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2Mik7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDM7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNCBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNSBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjYoXG4gICAgbFZpZXc6IExWaWV3LCBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZyxcbiAgICB2MzogYW55LCBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNyBleHByZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIGxWaWV3OiBMVmlldywgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsXG4gICAgdjM6IGFueSwgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNztcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIGk0ICsgcmVuZGVyU3RyaW5naWZ5KHY1KSArIGk1ICtcbiAgICAgICAgICByZW5kZXJTdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDggZXhwcmVzc2lvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBsVmlldzogTFZpZXcsIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLFxuICAgIHYzOiBhbnksIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYsIHY3KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDg7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBpNSArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHY2KSArIGk2ICsgcmVuZGVyU3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG4iXX0=