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
 *   features: [NgOnChangesFeature]
 * });
 * ```
 *
 * \@codeGenApi
 * @template T
 * @param {?} definition
 * @return {?}
 */
export function ɵɵNgOnChangesFeature(definition) {
    if (definition.type.prototype.ngOnChanges) {
        definition.setInput = ngOnChangesSetInput;
        ((/** @type {?} */ (definition))).onChanges = wrapOnChanges();
    }
}
// This option ensures that the ngOnChanges lifecycle hook will be inherited
// from superclasses (in InheritDefinitionFeature).
/** @nocollapse */
// tslint:disable-next-line:no-toplevel-property-access
((/** @type {?} */ (ɵɵNgOnChangesFeature))).ngInherit = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxZQUFZLEVBQWdCLE1BQU0sK0JBQStCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7TUFHN0IsY0FBYyxHQUFHLGdCQUFnQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQnZDLE1BQU0sVUFBVSxvQkFBb0IsQ0FBSSxVQUEyQjtJQUNqRSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRTtRQUN6QyxVQUFVLENBQUMsUUFBUSxHQUFHLG1CQUFtQixDQUFDO1FBQzFDLENBQUMsbUJBQUEsVUFBVSxFQUF3QixDQUFDLENBQUMsU0FBUyxHQUFHLGFBQWEsRUFBRSxDQUFDO0tBQ2xFO0FBQ0gsQ0FBQzs7Ozs7QUFNRCxDQUFDLG1CQUFBLG9CQUFvQixFQUF1QixDQUFDLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzs7OztBQUUvRCxTQUFTLGFBQWE7SUFDcEI7Ozs7SUFBTyxTQUFTLDBDQUEwQzs7Y0FDbEQsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDOztjQUNoRCxPQUFPLEdBQUcsa0JBQWtCLElBQUksa0JBQWtCLENBQUMsT0FBTztRQUVoRSxJQUFJLE9BQU8sRUFBRTs7a0JBQ0wsUUFBUSxHQUFHLG1CQUFBLGtCQUFrQixFQUFFLENBQUMsUUFBUTtZQUM5QyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7Z0JBQzFCLG1CQUFBLGtCQUFrQixFQUFFLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQzthQUN6QztpQkFBTTtnQkFDTCx5RkFBeUY7Z0JBQ3pGLG1DQUFtQztnQkFDbkMsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLEVBQUU7b0JBQ3ZCLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQzlCO2FBQ0Y7WUFDRCxtQkFBQSxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMzQjtJQUNILENBQUMsRUFBQztBQUNKLENBQUM7Ozs7Ozs7Ozs7QUFFRCxTQUFTLG1CQUFtQixDQUNELFFBQVcsRUFBRSxLQUFVLEVBQUUsVUFBa0IsRUFBRSxXQUFtQjs7VUFDbkYsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDO1FBQ3RELHFCQUFxQixDQUFDLFFBQVEsRUFBRSxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDOztVQUNuRSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7VUFDekUsUUFBUSxHQUFHLGtCQUFrQixDQUFDLFFBQVE7O1VBRXRDLFlBQVksR0FBRyxDQUFDLG1CQUFBLElBQUksQ0FBQyxjQUFjLEVBQTBCLENBQUMsQ0FBQyxVQUFVLENBQUM7O1VBQzFFLGNBQWMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDO0lBQzdDLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FDcEMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQztJQUVsRixDQUFDLG1CQUFBLFFBQVEsRUFBTyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLENBQUM7O01BRUssb0JBQW9CLEdBQUcscUJBQXFCOzs7OztBQUVsRCxTQUFTLHFCQUFxQixDQUFDLFFBQWE7SUFDMUMsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDaEQsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxRQUFhLEVBQUUsS0FBMkI7SUFDdkUsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDaEQsQ0FBQzs7OztBQUVELG1DQUdDOzs7SUFGQyx3Q0FBd0I7O0lBQ3hCLHVDQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPbkNoYW5nZXN9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXN9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9zaW1wbGVfY2hhbmdlJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmRmVhdHVyZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuY29uc3QgUFJJVkFURV9QUkVGSVggPSAnX19uZ09uQ2hhbmdlc18nO1xuXG50eXBlIE9uQ2hhbmdlc0V4cGFuZG8gPSBPbkNoYW5nZXMgJiB7XG4gIF9fbmdPbkNoYW5nZXNfOiBTaW1wbGVDaGFuZ2VzfG51bGx8dW5kZWZpbmVkO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55IENhbiBob2xkIGFueSB2YWx1ZVxuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG4vKipcbiAqIFRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgZGVjb3JhdGVzIGEgY29tcG9uZW50IHdpdGggc3VwcG9ydCBmb3IgdGhlIG5nT25DaGFuZ2VzXG4gKiBsaWZlY3ljbGUgaG9vaywgc28gaXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIGFueSBjb21wb25lbnQgdGhhdCBpbXBsZW1lbnRzXG4gKiB0aGF0IGhvb2suXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgdXNlcyBpbmhlcml0YW5jZSwgdGhlIE5nT25DaGFuZ2VzRmVhdHVyZSBNVVNUXG4gKiBiZSBpbmNsdWRlZCBhcyBhIGZlYXR1cmUgQUZURVIge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0sIG90aGVyd2lzZVxuICogaW5oZXJpdGVkIHByb3BlcnRpZXMgd2lsbCBub3QgYmUgcHJvcGFnYXRlZCB0byB0aGUgbmdPbkNoYW5nZXMgbGlmZWN5Y2xlXG4gKiBob29rLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKlxuICogYGBgXG4gKiBzdGF0aWMgybVjbXAgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAuLi5cbiAqICAgaW5wdXRzOiB7bmFtZTogJ3B1YmxpY05hbWUnfSxcbiAqICAgZmVhdHVyZXM6IFtOZ09uQ2hhbmdlc0ZlYXR1cmVdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIMm1ybVOZ09uQ2hhbmdlc0ZlYXR1cmU8VD4oZGVmaW5pdGlvbjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIGlmIChkZWZpbml0aW9uLnR5cGUucHJvdG90eXBlLm5nT25DaGFuZ2VzKSB7XG4gICAgZGVmaW5pdGlvbi5zZXRJbnB1dCA9IG5nT25DaGFuZ2VzU2V0SW5wdXQ7XG4gICAgKGRlZmluaXRpb24gYXN7b25DaGFuZ2VzOiBGdW5jdGlvbn0pLm9uQ2hhbmdlcyA9IHdyYXBPbkNoYW5nZXMoKTtcbiAgfVxufVxuXG4vLyBUaGlzIG9wdGlvbiBlbnN1cmVzIHRoYXQgdGhlIG5nT25DaGFuZ2VzIGxpZmVjeWNsZSBob29rIHdpbGwgYmUgaW5oZXJpdGVkXG4vLyBmcm9tIHN1cGVyY2xhc3NlcyAoaW4gSW5oZXJpdERlZmluaXRpb25GZWF0dXJlKS5cbi8qKiBAbm9jb2xsYXBzZSAqL1xuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXRvcGxldmVsLXByb3BlcnR5LWFjY2Vzc1xuKMm1ybVOZ09uQ2hhbmdlc0ZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkubmdJbmhlcml0ID0gdHJ1ZTtcblxuZnVuY3Rpb24gd3JhcE9uQ2hhbmdlcygpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBPbkNoYW5nZXNIb29rX2luUHJldmlvdXNDaGFuZ2VzU3RvcmFnZSh0aGlzOiBPbkNoYW5nZXMpIHtcbiAgICBjb25zdCBzaW1wbGVDaGFuZ2VzU3RvcmUgPSBnZXRTaW1wbGVDaGFuZ2VzU3RvcmUodGhpcyk7XG4gICAgY29uc3QgY3VycmVudCA9IHNpbXBsZUNoYW5nZXNTdG9yZSAmJiBzaW1wbGVDaGFuZ2VzU3RvcmUuY3VycmVudDtcblxuICAgIGlmIChjdXJyZW50KSB7XG4gICAgICBjb25zdCBwcmV2aW91cyA9IHNpbXBsZUNoYW5nZXNTdG9yZSAhLnByZXZpb3VzO1xuICAgICAgaWYgKHByZXZpb3VzID09PSBFTVBUWV9PQkopIHtcbiAgICAgICAgc2ltcGxlQ2hhbmdlc1N0b3JlICEucHJldmlvdXMgPSBjdXJyZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTmV3IGNoYW5nZXMgYXJlIGNvcGllZCB0byB0aGUgcHJldmlvdXMgc3RvcmUsIHNvIHRoYXQgd2UgZG9uJ3QgbG9zZSBoaXN0b3J5IGZvciBpbnB1dHNcbiAgICAgICAgLy8gd2hpY2ggd2VyZSBub3QgY2hhbmdlZCB0aGlzIHRpbWVcbiAgICAgICAgZm9yIChsZXQga2V5IGluIGN1cnJlbnQpIHtcbiAgICAgICAgICBwcmV2aW91c1trZXldID0gY3VycmVudFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzaW1wbGVDaGFuZ2VzU3RvcmUgIS5jdXJyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMubmdPbkNoYW5nZXMoY3VycmVudCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBuZ09uQ2hhbmdlc1NldElucHV0PFQ+KFxuICAgIHRoaXM6IERpcmVjdGl2ZURlZjxUPiwgaW5zdGFuY2U6IFQsIHZhbHVlOiBhbnksIHB1YmxpY05hbWU6IHN0cmluZywgcHJpdmF0ZU5hbWU6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBzaW1wbGVDaGFuZ2VzU3RvcmUgPSBnZXRTaW1wbGVDaGFuZ2VzU3RvcmUoaW5zdGFuY2UpIHx8XG4gICAgICBzZXRTaW1wbGVDaGFuZ2VzU3RvcmUoaW5zdGFuY2UsIHtwcmV2aW91czogRU1QVFlfT0JKLCBjdXJyZW50OiBudWxsfSk7XG4gIGNvbnN0IGN1cnJlbnQgPSBzaW1wbGVDaGFuZ2VzU3RvcmUuY3VycmVudCB8fCAoc2ltcGxlQ2hhbmdlc1N0b3JlLmN1cnJlbnQgPSB7fSk7XG4gIGNvbnN0IHByZXZpb3VzID0gc2ltcGxlQ2hhbmdlc1N0b3JlLnByZXZpb3VzO1xuXG4gIGNvbnN0IGRlY2xhcmVkTmFtZSA9ICh0aGlzLmRlY2xhcmVkSW5wdXRzIGFze1trZXk6IHN0cmluZ106IHN0cmluZ30pW3B1YmxpY05hbWVdO1xuICBjb25zdCBwcmV2aW91c0NoYW5nZSA9IHByZXZpb3VzW2RlY2xhcmVkTmFtZV07XG4gIGN1cnJlbnRbZGVjbGFyZWROYW1lXSA9IG5ldyBTaW1wbGVDaGFuZ2UoXG4gICAgICBwcmV2aW91c0NoYW5nZSAmJiBwcmV2aW91c0NoYW5nZS5jdXJyZW50VmFsdWUsIHZhbHVlLCBwcmV2aW91cyA9PT0gRU1QVFlfT0JKKTtcblxuICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbn1cblxuY29uc3QgU0lNUExFX0NIQU5HRVNfU1RPUkUgPSAnX19uZ1NpbXBsZUNoYW5nZXNfXyc7XG5cbmZ1bmN0aW9uIGdldFNpbXBsZUNoYW5nZXNTdG9yZShpbnN0YW5jZTogYW55KTogbnVsbHxOZ1NpbXBsZUNoYW5nZXNTdG9yZSB7XG4gIHJldHVybiBpbnN0YW5jZVtTSU1QTEVfQ0hBTkdFU19TVE9SRV0gfHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0U2ltcGxlQ2hhbmdlc1N0b3JlKGluc3RhbmNlOiBhbnksIHN0b3JlOiBOZ1NpbXBsZUNoYW5nZXNTdG9yZSk6IE5nU2ltcGxlQ2hhbmdlc1N0b3JlIHtcbiAgcmV0dXJuIGluc3RhbmNlW1NJTVBMRV9DSEFOR0VTX1NUT1JFXSA9IHN0b3JlO1xufVxuXG5pbnRlcmZhY2UgTmdTaW1wbGVDaGFuZ2VzU3RvcmUge1xuICBwcmV2aW91czogU2ltcGxlQ2hhbmdlcztcbiAgY3VycmVudDogU2ltcGxlQ2hhbmdlc3xudWxsO1xufVxuIl19