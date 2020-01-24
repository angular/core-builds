/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/features/ng_onchanges_feature.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SimpleChange } from '../../interface/simple_change';
import { EMPTY_OBJ } from '../empty';
/** @type {?} */
const PRIVATE_PREFIX = '__ngOnChanges_';
/**
 * The NgOnChangesFeature decorates a component with support for the ngOnChanges
 * lifecycle hook, so it should be included in any component that implements
 * that hook.
 *
 * If the component or directive uses inheritance, the NgOnChangesFeature MUST
 * be included as a feature AFTER {\@link InheritDefinitionFeature}, otherwise
 * inherited properties will not be propagated to the ngOnChanges lifecycle
 * hook.
 *
 * Example usage:
 *
 * ```
 * static ɵcmp = defineComponent({
 *   ...
 *   inputs: {name: 'publicName'},
 *   features: [NgOnChangesFeature()]
 * });
 * ```
 *
 * \@codeGenApi
 * @template T
 * @return {?}
 */
export function ɵɵNgOnChangesFeature() {
    // This option ensures that the ngOnChanges lifecycle hook will be inherited
    // from superclasses (in InheritDefinitionFeature).
    ((/** @type {?} */ (NgOnChangesFeatureImpl))).ngInherit = true;
    return NgOnChangesFeatureImpl;
}
/**
 * @template T
 * @param {?} definition
 * @return {?}
 */
function NgOnChangesFeatureImpl(definition) {
    if (definition.type.prototype.ngOnChanges) {
        definition.setInput = ngOnChangesSetInput;
        definition.onChanges = wrapOnChanges();
    }
}
/**
 * @return {?}
 */
function wrapOnChanges() {
    return (/**
     * @this {?}
     * @return {?}
     */
    function wrapOnChangesHook_inPreviousChangesStorage() {
        /** @type {?} */
        const simpleChangesStore = getSimpleChangesStore(this);
        /** @type {?} */
        const current = simpleChangesStore && simpleChangesStore.current;
        if (current) {
            /** @type {?} */
            const previous = (/** @type {?} */ (simpleChangesStore)).previous;
            if (previous === EMPTY_OBJ) {
                (/** @type {?} */ (simpleChangesStore)).previous = current;
            }
            else {
                // New changes are copied to the previous store, so that we don't lose history for inputs
                // which were not changed this time
                for (let key in current) {
                    previous[key] = current[key];
                }
            }
            (/** @type {?} */ (simpleChangesStore)).current = null;
            this.ngOnChanges(current);
        }
    });
}
/**
 * @template T
 * @this {?}
 * @param {?} instance
 * @param {?} value
 * @param {?} publicName
 * @param {?} privateName
 * @return {?}
 */
function ngOnChangesSetInput(instance, value, publicName, privateName) {
    /** @type {?} */
    const simpleChangesStore = getSimpleChangesStore(instance) ||
        setSimpleChangesStore(instance, { previous: EMPTY_OBJ, current: null });
    /** @type {?} */
    const current = simpleChangesStore.current || (simpleChangesStore.current = {});
    /** @type {?} */
    const previous = simpleChangesStore.previous;
    /** @type {?} */
    const declaredName = ((/** @type {?} */ (this.declaredInputs)))[publicName];
    /** @type {?} */
    const previousChange = previous[declaredName];
    current[declaredName] = new SimpleChange(previousChange && previousChange.currentValue, value, previous === EMPTY_OBJ);
    ((/** @type {?} */ (instance)))[privateName] = value;
}
/** @type {?} */
const SIMPLE_CHANGES_STORE = '__ngSimpleChanges__';
/**
 * @param {?} instance
 * @return {?}
 */
function getSimpleChangesStore(instance) {
    return instance[SIMPLE_CHANGES_STORE] || null;
}
/**
 * @param {?} instance
 * @param {?} store
 * @return {?}
 */
function setSimpleChangesStore(instance, store) {
    return instance[SIMPLE_CHANGES_STORE] = store;
}
/**
 * @record
 */
function NgSimpleChangesStore() { }
if (false) {
    /** @type {?} */
    NgSimpleChangesStore.prototype.previous;
    /** @type {?} */
    NgSimpleChangesStore.prototype.current;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxZQUFZLEVBQWdCLE1BQU0sK0JBQStCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7TUFHN0IsY0FBYyxHQUFHLGdCQUFnQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThCdkMsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyw0RUFBNEU7SUFDNUUsbURBQW1EO0lBQ25ELENBQUMsbUJBQUEsc0JBQXNCLEVBQXVCLENBQUMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ2pFLE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxzQkFBc0IsQ0FBSSxVQUEyQjtJQUM1RCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRTtRQUN6QyxVQUFVLENBQUMsUUFBUSxHQUFHLG1CQUFtQixDQUFDO1FBQzFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsYUFBYSxFQUFFLENBQUM7S0FDeEM7QUFDSCxDQUFDOzs7O0FBRUQsU0FBUyxhQUFhO0lBQ3BCOzs7O0lBQU8sU0FBUywwQ0FBMEM7O2NBQ2xELGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQzs7Y0FDaEQsT0FBTyxHQUFHLGtCQUFrQixJQUFJLGtCQUFrQixDQUFDLE9BQU87UUFFaEUsSUFBSSxPQUFPLEVBQUU7O2tCQUNMLFFBQVEsR0FBRyxtQkFBQSxrQkFBa0IsRUFBRSxDQUFDLFFBQVE7WUFDOUMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO2dCQUMxQixtQkFBQSxrQkFBa0IsRUFBRSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7YUFDekM7aUJBQU07Z0JBQ0wseUZBQXlGO2dCQUN6RixtQ0FBbUM7Z0JBQ25DLEtBQUssSUFBSSxHQUFHLElBQUksT0FBTyxFQUFFO29CQUN2QixRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUM5QjthQUNGO1lBQ0QsbUJBQUEsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDM0I7SUFDSCxDQUFDLEVBQUM7QUFDSixDQUFDOzs7Ozs7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FDRCxRQUFXLEVBQUUsS0FBVSxFQUFFLFVBQWtCLEVBQUUsV0FBbUI7O1VBQ25GLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQztRQUN0RCxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQzs7VUFDbkUsT0FBTyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7O1VBQ3pFLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxRQUFROztVQUV0QyxZQUFZLEdBQUcsQ0FBQyxtQkFBQSxJQUFJLENBQUMsY0FBYyxFQUEwQixDQUFDLENBQUMsVUFBVSxDQUFDOztVQUMxRSxjQUFjLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQztJQUM3QyxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQ3BDLGNBQWMsSUFBSSxjQUFjLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUM7SUFFbEYsQ0FBQyxtQkFBQSxRQUFRLEVBQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUN6QyxDQUFDOztNQUVLLG9CQUFvQixHQUFHLHFCQUFxQjs7Ozs7QUFFbEQsU0FBUyxxQkFBcUIsQ0FBQyxRQUFhO0lBQzFDLE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDLElBQUksSUFBSSxDQUFDO0FBQ2hELENBQUM7Ozs7OztBQUVELFNBQVMscUJBQXFCLENBQUMsUUFBYSxFQUFFLEtBQTJCO0lBQ3ZFLE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ2hELENBQUM7Ozs7QUFFRCxtQ0FHQzs7O0lBRkMsd0NBQXdCOztJQUN4Qix1Q0FBNEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T25DaGFuZ2VzfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7U2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi8uLi9pbnRlcmZhY2Uvc2ltcGxlX2NoYW5nZSc7XG5pbXBvcnQge0VNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkZlYXR1cmV9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5cbmNvbnN0IFBSSVZBVEVfUFJFRklYID0gJ19fbmdPbkNoYW5nZXNfJztcblxudHlwZSBPbkNoYW5nZXNFeHBhbmRvID0gT25DaGFuZ2VzICYge1xuICBfX25nT25DaGFuZ2VzXzogU2ltcGxlQ2hhbmdlc3xudWxsfHVuZGVmaW5lZDtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueSBDYW4gaG9sZCBhbnkgdmFsdWVcbiAgW2tleTogc3RyaW5nXTogYW55O1xufTtcblxuLyoqXG4gKiBUaGUgTmdPbkNoYW5nZXNGZWF0dXJlIGRlY29yYXRlcyBhIGNvbXBvbmVudCB3aXRoIHN1cHBvcnQgZm9yIHRoZSBuZ09uQ2hhbmdlc1xuICogbGlmZWN5Y2xlIGhvb2ssIHNvIGl0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiBhbnkgY29tcG9uZW50IHRoYXQgaW1wbGVtZW50c1xuICogdGhhdCBob29rLlxuICpcbiAqIElmIHRoZSBjb21wb25lbnQgb3IgZGlyZWN0aXZlIHVzZXMgaW5oZXJpdGFuY2UsIHRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgTVVTVFxuICogYmUgaW5jbHVkZWQgYXMgYSBmZWF0dXJlIEFGVEVSIHtAbGluayBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmV9LCBvdGhlcndpc2VcbiAqIGluaGVyaXRlZCBwcm9wZXJ0aWVzIHdpbGwgbm90IGJlIHByb3BhZ2F0ZWQgdG8gdGhlIG5nT25DaGFuZ2VzIGxpZmVjeWNsZVxuICogaG9vay5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGBgYFxuICogc3RhdGljIMm1Y21wID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgLi4uXG4gKiAgIGlucHV0czoge25hbWU6ICdwdWJsaWNOYW1lJ30sXG4gKiAgIGZlYXR1cmVzOiBbTmdPbkNoYW5nZXNGZWF0dXJlKCldXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1TmdPbkNoYW5nZXNGZWF0dXJlPFQ+KCk6IERpcmVjdGl2ZURlZkZlYXR1cmUge1xuICAvLyBUaGlzIG9wdGlvbiBlbnN1cmVzIHRoYXQgdGhlIG5nT25DaGFuZ2VzIGxpZmVjeWNsZSBob29rIHdpbGwgYmUgaW5oZXJpdGVkXG4gIC8vIGZyb20gc3VwZXJjbGFzc2VzIChpbiBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUpLlxuICAoTmdPbkNoYW5nZXNGZWF0dXJlSW1wbCBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKS5uZ0luaGVyaXQgPSB0cnVlO1xuICByZXR1cm4gTmdPbkNoYW5nZXNGZWF0dXJlSW1wbDtcbn1cblxuZnVuY3Rpb24gTmdPbkNoYW5nZXNGZWF0dXJlSW1wbDxUPihkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkIHtcbiAgaWYgKGRlZmluaXRpb24udHlwZS5wcm90b3R5cGUubmdPbkNoYW5nZXMpIHtcbiAgICBkZWZpbml0aW9uLnNldElucHV0ID0gbmdPbkNoYW5nZXNTZXRJbnB1dDtcbiAgICBkZWZpbml0aW9uLm9uQ2hhbmdlcyA9IHdyYXBPbkNoYW5nZXMoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwT25DaGFuZ2VzKCkge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcE9uQ2hhbmdlc0hvb2tfaW5QcmV2aW91c0NoYW5nZXNTdG9yYWdlKHRoaXM6IE9uQ2hhbmdlcykge1xuICAgIGNvbnN0IHNpbXBsZUNoYW5nZXNTdG9yZSA9IGdldFNpbXBsZUNoYW5nZXNTdG9yZSh0aGlzKTtcbiAgICBjb25zdCBjdXJyZW50ID0gc2ltcGxlQ2hhbmdlc1N0b3JlICYmIHNpbXBsZUNoYW5nZXNTdG9yZS5jdXJyZW50O1xuXG4gICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gc2ltcGxlQ2hhbmdlc1N0b3JlICEucHJldmlvdXM7XG4gICAgICBpZiAocHJldmlvdXMgPT09IEVNUFRZX09CSikge1xuICAgICAgICBzaW1wbGVDaGFuZ2VzU3RvcmUgIS5wcmV2aW91cyA9IGN1cnJlbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOZXcgY2hhbmdlcyBhcmUgY29waWVkIHRvIHRoZSBwcmV2aW91cyBzdG9yZSwgc28gdGhhdCB3ZSBkb24ndCBsb3NlIGhpc3RvcnkgZm9yIGlucHV0c1xuICAgICAgICAvLyB3aGljaCB3ZXJlIG5vdCBjaGFuZ2VkIHRoaXMgdGltZVxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gY3VycmVudCkge1xuICAgICAgICAgIHByZXZpb3VzW2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNpbXBsZUNoYW5nZXNTdG9yZSAhLmN1cnJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5uZ09uQ2hhbmdlcyhjdXJyZW50KTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG5nT25DaGFuZ2VzU2V0SW5wdXQ8VD4oXG4gICAgdGhpczogRGlyZWN0aXZlRGVmPFQ+LCBpbnN0YW5jZTogVCwgdmFsdWU6IGFueSwgcHVibGljTmFtZTogc3RyaW5nLCBwcml2YXRlTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHNpbXBsZUNoYW5nZXNTdG9yZSA9IGdldFNpbXBsZUNoYW5nZXNTdG9yZShpbnN0YW5jZSkgfHxcbiAgICAgIHNldFNpbXBsZUNoYW5nZXNTdG9yZShpbnN0YW5jZSwge3ByZXZpb3VzOiBFTVBUWV9PQkosIGN1cnJlbnQ6IG51bGx9KTtcbiAgY29uc3QgY3VycmVudCA9IHNpbXBsZUNoYW5nZXNTdG9yZS5jdXJyZW50IHx8IChzaW1wbGVDaGFuZ2VzU3RvcmUuY3VycmVudCA9IHt9KTtcbiAgY29uc3QgcHJldmlvdXMgPSBzaW1wbGVDaGFuZ2VzU3RvcmUucHJldmlvdXM7XG5cbiAgY29uc3QgZGVjbGFyZWROYW1lID0gKHRoaXMuZGVjbGFyZWRJbnB1dHMgYXN7W2tleTogc3RyaW5nXTogc3RyaW5nfSlbcHVibGljTmFtZV07XG4gIGNvbnN0IHByZXZpb3VzQ2hhbmdlID0gcHJldmlvdXNbZGVjbGFyZWROYW1lXTtcbiAgY3VycmVudFtkZWNsYXJlZE5hbWVdID0gbmV3IFNpbXBsZUNoYW5nZShcbiAgICAgIHByZXZpb3VzQ2hhbmdlICYmIHByZXZpb3VzQ2hhbmdlLmN1cnJlbnRWYWx1ZSwgdmFsdWUsIHByZXZpb3VzID09PSBFTVBUWV9PQkopO1xuXG4gIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xufVxuXG5jb25zdCBTSU1QTEVfQ0hBTkdFU19TVE9SRSA9ICdfX25nU2ltcGxlQ2hhbmdlc19fJztcblxuZnVuY3Rpb24gZ2V0U2ltcGxlQ2hhbmdlc1N0b3JlKGluc3RhbmNlOiBhbnkpOiBudWxsfE5nU2ltcGxlQ2hhbmdlc1N0b3JlIHtcbiAgcmV0dXJuIGluc3RhbmNlW1NJTVBMRV9DSEFOR0VTX1NUT1JFXSB8fCBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRTaW1wbGVDaGFuZ2VzU3RvcmUoaW5zdGFuY2U6IGFueSwgc3RvcmU6IE5nU2ltcGxlQ2hhbmdlc1N0b3JlKTogTmdTaW1wbGVDaGFuZ2VzU3RvcmUge1xuICByZXR1cm4gaW5zdGFuY2VbU0lNUExFX0NIQU5HRVNfU1RPUkVdID0gc3RvcmU7XG59XG5cbmludGVyZmFjZSBOZ1NpbXBsZUNoYW5nZXNTdG9yZSB7XG4gIHByZXZpb3VzOiBTaW1wbGVDaGFuZ2VzO1xuICBjdXJyZW50OiBTaW1wbGVDaGFuZ2VzfG51bGw7XG59XG4iXX0=