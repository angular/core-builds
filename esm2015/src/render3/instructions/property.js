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
import { bindingUpdated } from '../bindings';
import { BINDING_INDEX } from '../interfaces/view';
import { getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { elementPropertyInternal, storeBindingMetadata } from './shared';
/**
 * Update a property on a selected element.
 *
 * Operates on the element selected by index via the {\@link select} instruction.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled
 *
 * \@codeGenApi
 * @template T
 * @param {?} propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value New value to write.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @return {?} This function returns itself so that it may be chained
 * (e.g. `property('name', ctx.name)('title', ctx.title)`)
 *
 */
export function ɵɵproperty(propName, value, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindReconciledValue = bind(lView, value);
    if (bindReconciledValue !== NO_CHANGE) {
        elementPropertyInternal(getSelectedIndex(), propName, bindReconciledValue, sanitizer);
    }
    return ɵɵproperty;
}
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} lView Current view
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(lView, value) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    ngDevMode && storeBindingMetadata(lView);
    return bindingUpdated(lView, bindingIndex, value) ? value : NO_CHANGE;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9wcm9wZXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFM0MsT0FBTyxFQUFDLGFBQWEsRUFBUSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVwQyxPQUFPLEVBQW1CLHVCQUF1QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCekYsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsUUFBZ0IsRUFBRSxLQUFRLEVBQUUsU0FBOEI7O1VBQ3RELEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0lBQzlDLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO1FBQ3JDLHVCQUF1QixDQUFDLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLElBQUksQ0FBSSxLQUFZLEVBQUUsS0FBUTs7VUFDdEMsWUFBWSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUMzQyxTQUFTLElBQUksb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekMsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDeEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuaW1wb3J0IHtUc2lja2xlSXNzdWUxMDA5LCBlbGVtZW50UHJvcGVydHlJbnRlcm5hbCwgc3RvcmVCaW5kaW5nTWV0YWRhdGF9IGZyb20gJy4vc2hhcmVkJztcblxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGEgc2VsZWN0ZWQgZWxlbWVudC5cbiAqXG4gKiBPcGVyYXRlcyBvbiB0aGUgZWxlbWVudCBzZWxlY3RlZCBieSBpbmRleCB2aWEgdGhlIHtAbGluayBzZWxlY3R9IGluc3RydWN0aW9uLlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWRcbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHJldHVybnMgVGhpcyBmdW5jdGlvbiByZXR1cm5zIGl0c2VsZiBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkXG4gKiAoZS5nLiBgcHJvcGVydHkoJ25hbWUnLCBjdHgubmFtZSkoJ3RpdGxlJywgY3R4LnRpdGxlKWApXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eTxUPihcbiAgICBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZFJlY29uY2lsZWRWYWx1ZSA9IGJpbmQobFZpZXcsIHZhbHVlKTtcbiAgaWYgKGJpbmRSZWNvbmNpbGVkVmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcE5hbWUsIGJpbmRSZWNvbmNpbGVkVmFsdWUsIHNhbml0aXplcik7XG4gIH1cbiAgcmV0dXJuIMm1ybVwcm9wZXJ0eTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgc2luZ2xlIHZhbHVlIGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgdmlld1xuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGRpZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmQ8VD4obFZpZXc6IExWaWV3LCB2YWx1ZTogVCk6IFR8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0rKztcbiAgbmdEZXZNb2RlICYmIHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlKSA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuIl19