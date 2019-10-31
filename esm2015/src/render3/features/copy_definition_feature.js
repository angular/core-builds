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
import { isComponentDef } from '../interfaces/type_checks';
import { getSuperType } from './inherit_definition_feature';
/**
 * Fields which exist on either directive or component definitions, and need to be copied from
 * parent to child classes by the `ɵɵCopyDefinitionFeature`.
 * @type {?}
 */
const COPY_DIRECTIVE_FIELDS = [
    // The child class should use the providers of its parent.
    'providersResolver',
];
/**
 * Fields which exist only on component definitions, and need to be copied from parent to child
 * classes by the `ɵɵCopyDefinitionFeature`.
 *
 * The type here allows any field of `ComponentDef` which is not also a property of `DirectiveDef`,
 * since those should go in `COPY_DIRECTIVE_FIELDS` above.
 * @type {?}
 */
const COPY_COMPONENT_FIELDS = [
    // The child class should use the template function of its parent, including all template
    // semantics.
    'template',
    'decls',
    'consts',
    'vars',
    'onPush',
    'ngContentSelectors',
    // The child class should use the CSS styles of its parent, including all styling semantics.
    'styles',
    'encapsulation',
    // The child class should be checked by the runtime in the same way as its parent.
    'schemas',
];
/**
 * Copies the fields not handled by the `ɵɵInheritDefinitionFeature` from the supertype of a
 * definition.
 *
 * This exists primarily to support ngcc migration of an existing View Engine pattern, where an
 * entire decorator is inherited from a parent to a child class. When ngcc detects this case, it
 * generates a skeleton definition on the child class, and applies this feature.
 *
 * The `ɵɵCopyDefinitionFeature` then copies any needed fields from the parent class' definition,
 * including things like the component template function.
 *
 * \@codeGenApi
 * @param {?} definition The definition of a child class which inherits from a parent class with its
 * own definition.
 *
 * @return {?}
 */
export function ɵɵCopyDefinitionFeature(definition) {
    /** @type {?} */
    let superType = (/** @type {?} */ (getSuperType(definition.type)));
    /** @type {?} */
    let superDef = undefined;
    if (isComponentDef(definition)) {
        // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
        superDef = (/** @type {?} */ (superType.ɵcmp));
    }
    else {
        // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
        superDef = (/** @type {?} */ (superType.ɵdir));
    }
    // Needed because `definition` fields are readonly.
    /** @type {?} */
    const defAny = ((/** @type {?} */ (definition)));
    // Copy over any fields that apply to either directives or components.
    for (const field of COPY_DIRECTIVE_FIELDS) {
        defAny[field] = superDef[field];
    }
    if (isComponentDef(superDef)) {
        // Copy over any component-specific fields.
        for (const field of COPY_COMPONENT_FIELDS) {
            defAny[field] = superDef[field];
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weV9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2NvcHlfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRXpELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQzs7Ozs7O01BTXBELHFCQUFxQixHQUFvQztJQUM3RCwwREFBMEQ7SUFDMUQsbUJBQW1CO0NBSXBCOzs7Ozs7Ozs7TUFTSyxxQkFBcUIsR0FBd0U7SUFDakcseUZBQXlGO0lBQ3pGLGFBQWE7SUFDYixVQUFVO0lBQ1YsT0FBTztJQUNQLFFBQVE7SUFDUixNQUFNO0lBQ04sUUFBUTtJQUNSLG9CQUFvQjtJQUVwQiw0RkFBNEY7SUFDNUYsUUFBUTtJQUNSLGVBQWU7SUFFZixrRkFBa0Y7SUFDbEYsU0FBUztDQUNWOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkQsTUFBTSxVQUFVLHVCQUF1QixDQUFDLFVBQWdEOztRQUNsRixTQUFTLEdBQUcsbUJBQUEsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7UUFFM0MsUUFBUSxHQUFrRCxTQUFTO0lBQ3ZFLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzlCLCtFQUErRTtRQUMvRSxRQUFRLEdBQUcsbUJBQUEsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzdCO1NBQU07UUFDTCwrRUFBK0U7UUFDL0UsUUFBUSxHQUFHLG1CQUFBLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUM3Qjs7O1VBR0ssTUFBTSxHQUFHLENBQUMsbUJBQUEsVUFBVSxFQUFPLENBQUM7SUFFbEMsc0VBQXNFO0lBQ3RFLEtBQUssTUFBTSxLQUFLLElBQUkscUJBQXFCLEVBQUU7UUFDekMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNqQztJQUVELElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzVCLDJDQUEyQztRQUMzQyxLQUFLLE1BQU0sS0FBSyxJQUFJLHFCQUFxQixFQUFFO1lBQ3pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDakM7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcblxuaW1wb3J0IHtnZXRTdXBlclR5cGV9IGZyb20gJy4vaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUnO1xuXG4vKipcbiAqIEZpZWxkcyB3aGljaCBleGlzdCBvbiBlaXRoZXIgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBkZWZpbml0aW9ucywgYW5kIG5lZWQgdG8gYmUgY29waWVkIGZyb21cbiAqIHBhcmVudCB0byBjaGlsZCBjbGFzc2VzIGJ5IHRoZSBgybXJtUNvcHlEZWZpbml0aW9uRmVhdHVyZWAuXG4gKi9cbmNvbnN0IENPUFlfRElSRUNUSVZFX0ZJRUxEUzogKGtleW9mIERpcmVjdGl2ZURlZjx1bmtub3duPilbXSA9IFtcbiAgLy8gVGhlIGNoaWxkIGNsYXNzIHNob3VsZCB1c2UgdGhlIHByb3ZpZGVycyBvZiBpdHMgcGFyZW50LlxuICAncHJvdmlkZXJzUmVzb2x2ZXInLFxuXG4gIC8vIE5vdCBsaXN0ZWQgaGVyZSBhcmUgYW55IGZpZWxkcyB3aGljaCBhcmUgaGFuZGxlZCBieSB0aGUgYMm1ybVJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmVgLCBzdWNoXG4gIC8vIGFzIGlucHV0cywgb3V0cHV0cywgYW5kIGhvc3QgYmluZGluZyBmdW5jdGlvbnMuXG5dO1xuXG4vKipcbiAqIEZpZWxkcyB3aGljaCBleGlzdCBvbmx5IG9uIGNvbXBvbmVudCBkZWZpbml0aW9ucywgYW5kIG5lZWQgdG8gYmUgY29waWVkIGZyb20gcGFyZW50IHRvIGNoaWxkXG4gKiBjbGFzc2VzIGJ5IHRoZSBgybXJtUNvcHlEZWZpbml0aW9uRmVhdHVyZWAuXG4gKlxuICogVGhlIHR5cGUgaGVyZSBhbGxvd3MgYW55IGZpZWxkIG9mIGBDb21wb25lbnREZWZgIHdoaWNoIGlzIG5vdCBhbHNvIGEgcHJvcGVydHkgb2YgYERpcmVjdGl2ZURlZmAsXG4gKiBzaW5jZSB0aG9zZSBzaG91bGQgZ28gaW4gYENPUFlfRElSRUNUSVZFX0ZJRUxEU2AgYWJvdmUuXG4gKi9cbmNvbnN0IENPUFlfQ09NUE9ORU5UX0ZJRUxEUzogRXhjbHVkZTxrZXlvZiBDb21wb25lbnREZWY8dW5rbm93bj4sIGtleW9mIERpcmVjdGl2ZURlZjx1bmtub3duPj5bXSA9IFtcbiAgLy8gVGhlIGNoaWxkIGNsYXNzIHNob3VsZCB1c2UgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIG9mIGl0cyBwYXJlbnQsIGluY2x1ZGluZyBhbGwgdGVtcGxhdGVcbiAgLy8gc2VtYW50aWNzLlxuICAndGVtcGxhdGUnLFxuICAnZGVjbHMnLFxuICAnY29uc3RzJyxcbiAgJ3ZhcnMnLFxuICAnb25QdXNoJyxcbiAgJ25nQ29udGVudFNlbGVjdG9ycycsXG5cbiAgLy8gVGhlIGNoaWxkIGNsYXNzIHNob3VsZCB1c2UgdGhlIENTUyBzdHlsZXMgb2YgaXRzIHBhcmVudCwgaW5jbHVkaW5nIGFsbCBzdHlsaW5nIHNlbWFudGljcy5cbiAgJ3N0eWxlcycsXG4gICdlbmNhcHN1bGF0aW9uJyxcblxuICAvLyBUaGUgY2hpbGQgY2xhc3Mgc2hvdWxkIGJlIGNoZWNrZWQgYnkgdGhlIHJ1bnRpbWUgaW4gdGhlIHNhbWUgd2F5IGFzIGl0cyBwYXJlbnQuXG4gICdzY2hlbWFzJyxcbl07XG5cbi8qKlxuICogQ29waWVzIHRoZSBmaWVsZHMgbm90IGhhbmRsZWQgYnkgdGhlIGDJtcm1SW5oZXJpdERlZmluaXRpb25GZWF0dXJlYCBmcm9tIHRoZSBzdXBlcnR5cGUgb2YgYVxuICogZGVmaW5pdGlvbi5cbiAqXG4gKiBUaGlzIGV4aXN0cyBwcmltYXJpbHkgdG8gc3VwcG9ydCBuZ2NjIG1pZ3JhdGlvbiBvZiBhbiBleGlzdGluZyBWaWV3IEVuZ2luZSBwYXR0ZXJuLCB3aGVyZSBhblxuICogZW50aXJlIGRlY29yYXRvciBpcyBpbmhlcml0ZWQgZnJvbSBhIHBhcmVudCB0byBhIGNoaWxkIGNsYXNzLiBXaGVuIG5nY2MgZGV0ZWN0cyB0aGlzIGNhc2UsIGl0XG4gKiBnZW5lcmF0ZXMgYSBza2VsZXRvbiBkZWZpbml0aW9uIG9uIHRoZSBjaGlsZCBjbGFzcywgYW5kIGFwcGxpZXMgdGhpcyBmZWF0dXJlLlxuICpcbiAqIFRoZSBgybXJtUNvcHlEZWZpbml0aW9uRmVhdHVyZWAgdGhlbiBjb3BpZXMgYW55IG5lZWRlZCBmaWVsZHMgZnJvbSB0aGUgcGFyZW50IGNsYXNzJyBkZWZpbml0aW9uLFxuICogaW5jbHVkaW5nIHRoaW5ncyBsaWtlIHRoZSBjb21wb25lbnQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIGRlZmluaXRpb24gVGhlIGRlZmluaXRpb24gb2YgYSBjaGlsZCBjbGFzcyB3aGljaCBpbmhlcml0cyBmcm9tIGEgcGFyZW50IGNsYXNzIHdpdGggaXRzXG4gKiBvd24gZGVmaW5pdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtUNvcHlEZWZpbml0aW9uRmVhdHVyZShkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4pOiB2b2lkIHtcbiAgbGV0IHN1cGVyVHlwZSA9IGdldFN1cGVyVHlwZShkZWZpbml0aW9uLnR5cGUpICE7XG5cbiAgbGV0IHN1cGVyRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGlmIChpc0NvbXBvbmVudERlZihkZWZpbml0aW9uKSkge1xuICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS7JtWNtcCAhO1xuICB9IGVsc2Uge1xuICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS7JtWRpciAhO1xuICB9XG5cbiAgLy8gTmVlZGVkIGJlY2F1c2UgYGRlZmluaXRpb25gIGZpZWxkcyBhcmUgcmVhZG9ubHkuXG4gIGNvbnN0IGRlZkFueSA9IChkZWZpbml0aW9uIGFzIGFueSk7XG5cbiAgLy8gQ29weSBvdmVyIGFueSBmaWVsZHMgdGhhdCBhcHBseSB0byBlaXRoZXIgZGlyZWN0aXZlcyBvciBjb21wb25lbnRzLlxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIENPUFlfRElSRUNUSVZFX0ZJRUxEUykge1xuICAgIGRlZkFueVtmaWVsZF0gPSBzdXBlckRlZltmaWVsZF07XG4gIH1cblxuICBpZiAoaXNDb21wb25lbnREZWYoc3VwZXJEZWYpKSB7XG4gICAgLy8gQ29weSBvdmVyIGFueSBjb21wb25lbnQtc3BlY2lmaWMgZmllbGRzLlxuICAgIGZvciAoY29uc3QgZmllbGQgb2YgQ09QWV9DT01QT05FTlRfRklFTERTKSB7XG4gICAgICBkZWZBbnlbZmllbGRdID0gc3VwZXJEZWZbZmllbGRdO1xuICAgIH1cbiAgfVxufVxuIl19