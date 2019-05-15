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
 * static ngComponentDef = defineComponent({
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
export function ΔNgOnChangesFeature() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFlBQVksRUFBZ0IsTUFBTSwrQkFBK0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDOztNQUc3QixjQUFjLEdBQUcsZ0JBQWdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOEJ2QyxNQUFNLFVBQVUsbUJBQW1CO0lBQ2pDLDRFQUE0RTtJQUM1RSxtREFBbUQ7SUFDbkQsQ0FBQyxtQkFBQSxzQkFBc0IsRUFBdUIsQ0FBQyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDakUsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDOzs7Ozs7QUFFRCxTQUFTLHNCQUFzQixDQUFJLFVBQTJCO0lBQzVELElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFO1FBQ3pDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsbUJBQW1CLENBQUM7UUFDMUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxhQUFhLEVBQUUsQ0FBQztLQUN4QztBQUNILENBQUM7Ozs7QUFFRCxTQUFTLGFBQWE7SUFDcEI7Ozs7SUFBTyxTQUFTLDBDQUEwQzs7Y0FDbEQsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDOztjQUNoRCxPQUFPLEdBQUcsa0JBQWtCLElBQUksa0JBQWtCLENBQUMsT0FBTztRQUVoRSxJQUFJLE9BQU8sRUFBRTs7a0JBQ0wsUUFBUSxHQUFHLG1CQUFBLGtCQUFrQixFQUFFLENBQUMsUUFBUTtZQUM5QyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7Z0JBQzFCLG1CQUFBLGtCQUFrQixFQUFFLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQzthQUN6QztpQkFBTTtnQkFDTCx5RkFBeUY7Z0JBQ3pGLG1DQUFtQztnQkFDbkMsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLEVBQUU7b0JBQ3ZCLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQzlCO2FBQ0Y7WUFDRCxtQkFBQSxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMzQjtJQUNILENBQUMsRUFBQztBQUNKLENBQUM7Ozs7Ozs7Ozs7QUFFRCxTQUFTLG1CQUFtQixDQUNELFFBQVcsRUFBRSxLQUFVLEVBQUUsVUFBa0IsRUFBRSxXQUFtQjs7VUFDbkYsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDO1FBQ3RELHFCQUFxQixDQUFDLFFBQVEsRUFBRSxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDOztVQUNuRSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7VUFDekUsUUFBUSxHQUFHLGtCQUFrQixDQUFDLFFBQVE7O1VBRXRDLFlBQVksR0FBRyxDQUFDLG1CQUFBLElBQUksQ0FBQyxjQUFjLEVBQTBCLENBQUMsQ0FBQyxVQUFVLENBQUM7O1VBQzFFLGNBQWMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDO0lBQzdDLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FDcEMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQztJQUVsRixDQUFDLG1CQUFBLFFBQVEsRUFBTyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLENBQUM7O01BRUssb0JBQW9CLEdBQUcscUJBQXFCOzs7OztBQUVsRCxTQUFTLHFCQUFxQixDQUFDLFFBQWE7SUFDMUMsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDaEQsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxRQUFhLEVBQUUsS0FBMkI7SUFDdkUsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDaEQsQ0FBQzs7OztBQUVELG1DQUdDOzs7SUFGQyx3Q0FBd0I7O0lBQ3hCLHVDQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPbkNoYW5nZXN9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXN9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9zaW1wbGVfY2hhbmdlJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmRmVhdHVyZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuY29uc3QgUFJJVkFURV9QUkVGSVggPSAnX19uZ09uQ2hhbmdlc18nO1xuXG50eXBlIE9uQ2hhbmdlc0V4cGFuZG8gPSBPbkNoYW5nZXMgJiB7XG4gIF9fbmdPbkNoYW5nZXNfOiBTaW1wbGVDaGFuZ2VzfG51bGx8dW5kZWZpbmVkO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55IENhbiBob2xkIGFueSB2YWx1ZVxuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG4vKipcbiAqIFRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgZGVjb3JhdGVzIGEgY29tcG9uZW50IHdpdGggc3VwcG9ydCBmb3IgdGhlIG5nT25DaGFuZ2VzXG4gKiBsaWZlY3ljbGUgaG9vaywgc28gaXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIGFueSBjb21wb25lbnQgdGhhdCBpbXBsZW1lbnRzXG4gKiB0aGF0IGhvb2suXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgdXNlcyBpbmhlcml0YW5jZSwgdGhlIE5nT25DaGFuZ2VzRmVhdHVyZSBNVVNUXG4gKiBiZSBpbmNsdWRlZCBhcyBhIGZlYXR1cmUgQUZURVIge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0sIG90aGVyd2lzZVxuICogaW5oZXJpdGVkIHByb3BlcnRpZXMgd2lsbCBub3QgYmUgcHJvcGFnYXRlZCB0byB0aGUgbmdPbkNoYW5nZXMgbGlmZWN5Y2xlXG4gKiBob29rLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKlxuICogYGBgXG4gKiBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAuLi5cbiAqICAgaW5wdXRzOiB7bmFtZTogJ3B1YmxpY05hbWUnfSxcbiAqICAgZmVhdHVyZXM6IFtOZ09uQ2hhbmdlc0ZlYXR1cmUoKV1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UTmdPbkNoYW5nZXNGZWF0dXJlPFQ+KCk6IERpcmVjdGl2ZURlZkZlYXR1cmUge1xuICAvLyBUaGlzIG9wdGlvbiBlbnN1cmVzIHRoYXQgdGhlIG5nT25DaGFuZ2VzIGxpZmVjeWNsZSBob29rIHdpbGwgYmUgaW5oZXJpdGVkXG4gIC8vIGZyb20gc3VwZXJjbGFzc2VzIChpbiBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmUpLlxuICAoTmdPbkNoYW5nZXNGZWF0dXJlSW1wbCBhcyBEaXJlY3RpdmVEZWZGZWF0dXJlKS5uZ0luaGVyaXQgPSB0cnVlO1xuICByZXR1cm4gTmdPbkNoYW5nZXNGZWF0dXJlSW1wbDtcbn1cblxuZnVuY3Rpb24gTmdPbkNoYW5nZXNGZWF0dXJlSW1wbDxUPihkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkIHtcbiAgaWYgKGRlZmluaXRpb24udHlwZS5wcm90b3R5cGUubmdPbkNoYW5nZXMpIHtcbiAgICBkZWZpbml0aW9uLnNldElucHV0ID0gbmdPbkNoYW5nZXNTZXRJbnB1dDtcbiAgICBkZWZpbml0aW9uLm9uQ2hhbmdlcyA9IHdyYXBPbkNoYW5nZXMoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwT25DaGFuZ2VzKCkge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcE9uQ2hhbmdlc0hvb2tfaW5QcmV2aW91c0NoYW5nZXNTdG9yYWdlKHRoaXM6IE9uQ2hhbmdlcykge1xuICAgIGNvbnN0IHNpbXBsZUNoYW5nZXNTdG9yZSA9IGdldFNpbXBsZUNoYW5nZXNTdG9yZSh0aGlzKTtcbiAgICBjb25zdCBjdXJyZW50ID0gc2ltcGxlQ2hhbmdlc1N0b3JlICYmIHNpbXBsZUNoYW5nZXNTdG9yZS5jdXJyZW50O1xuXG4gICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzID0gc2ltcGxlQ2hhbmdlc1N0b3JlICEucHJldmlvdXM7XG4gICAgICBpZiAocHJldmlvdXMgPT09IEVNUFRZX09CSikge1xuICAgICAgICBzaW1wbGVDaGFuZ2VzU3RvcmUgIS5wcmV2aW91cyA9IGN1cnJlbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOZXcgY2hhbmdlcyBhcmUgY29waWVkIHRvIHRoZSBwcmV2aW91cyBzdG9yZSwgc28gdGhhdCB3ZSBkb24ndCBsb3NlIGhpc3RvcnkgZm9yIGlucHV0c1xuICAgICAgICAvLyB3aGljaCB3ZXJlIG5vdCBjaGFuZ2VkIHRoaXMgdGltZVxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gY3VycmVudCkge1xuICAgICAgICAgIHByZXZpb3VzW2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNpbXBsZUNoYW5nZXNTdG9yZSAhLmN1cnJlbnQgPSBudWxsO1xuICAgICAgdGhpcy5uZ09uQ2hhbmdlcyhjdXJyZW50KTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIG5nT25DaGFuZ2VzU2V0SW5wdXQ8VD4oXG4gICAgdGhpczogRGlyZWN0aXZlRGVmPFQ+LCBpbnN0YW5jZTogVCwgdmFsdWU6IGFueSwgcHVibGljTmFtZTogc3RyaW5nLCBwcml2YXRlTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHNpbXBsZUNoYW5nZXNTdG9yZSA9IGdldFNpbXBsZUNoYW5nZXNTdG9yZShpbnN0YW5jZSkgfHxcbiAgICAgIHNldFNpbXBsZUNoYW5nZXNTdG9yZShpbnN0YW5jZSwge3ByZXZpb3VzOiBFTVBUWV9PQkosIGN1cnJlbnQ6IG51bGx9KTtcbiAgY29uc3QgY3VycmVudCA9IHNpbXBsZUNoYW5nZXNTdG9yZS5jdXJyZW50IHx8IChzaW1wbGVDaGFuZ2VzU3RvcmUuY3VycmVudCA9IHt9KTtcbiAgY29uc3QgcHJldmlvdXMgPSBzaW1wbGVDaGFuZ2VzU3RvcmUucHJldmlvdXM7XG5cbiAgY29uc3QgZGVjbGFyZWROYW1lID0gKHRoaXMuZGVjbGFyZWRJbnB1dHMgYXN7W2tleTogc3RyaW5nXTogc3RyaW5nfSlbcHVibGljTmFtZV07XG4gIGNvbnN0IHByZXZpb3VzQ2hhbmdlID0gcHJldmlvdXNbZGVjbGFyZWROYW1lXTtcbiAgY3VycmVudFtkZWNsYXJlZE5hbWVdID0gbmV3IFNpbXBsZUNoYW5nZShcbiAgICAgIHByZXZpb3VzQ2hhbmdlICYmIHByZXZpb3VzQ2hhbmdlLmN1cnJlbnRWYWx1ZSwgdmFsdWUsIHByZXZpb3VzID09PSBFTVBUWV9PQkopO1xuXG4gIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xufVxuXG5jb25zdCBTSU1QTEVfQ0hBTkdFU19TVE9SRSA9ICdfX25nU2ltcGxlQ2hhbmdlc19fJztcblxuZnVuY3Rpb24gZ2V0U2ltcGxlQ2hhbmdlc1N0b3JlKGluc3RhbmNlOiBhbnkpOiBudWxsfE5nU2ltcGxlQ2hhbmdlc1N0b3JlIHtcbiAgcmV0dXJuIGluc3RhbmNlW1NJTVBMRV9DSEFOR0VTX1NUT1JFXSB8fCBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRTaW1wbGVDaGFuZ2VzU3RvcmUoaW5zdGFuY2U6IGFueSwgc3RvcmU6IE5nU2ltcGxlQ2hhbmdlc1N0b3JlKTogTmdTaW1wbGVDaGFuZ2VzU3RvcmUge1xuICByZXR1cm4gaW5zdGFuY2VbU0lNUExFX0NIQU5HRVNfU1RPUkVdID0gc3RvcmU7XG59XG5cbmludGVyZmFjZSBOZ1NpbXBsZUNoYW5nZXNTdG9yZSB7XG4gIHByZXZpb3VzOiBTaW1wbGVDaGFuZ2VzO1xuICBjdXJyZW50OiBTaW1wbGVDaGFuZ2VzfG51bGw7XG59XG4iXX0=