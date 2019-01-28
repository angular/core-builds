/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * @template T
 * @return {?}
 */
export function NgOnChangesFeature() {
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
    return function () {
        /** @type {?} */
        const simpleChangesStore = getSimpleChangesStore(this);
        /** @type {?} */
        const current = simpleChangesStore && simpleChangesStore.current;
        if (current) {
            (/** @type {?} */ (simpleChangesStore)).previous = current;
            (/** @type {?} */ (simpleChangesStore)).current = null;
            this.ngOnChanges(current);
        }
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfb25jaGFuZ2VzX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL25nX29uY2hhbmdlc19mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFlBQVksRUFBZ0IsTUFBTSwrQkFBK0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDOztNQUc3QixjQUFjLEdBQUcsZ0JBQWdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRCdkMsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyw0RUFBNEU7SUFDNUUsbURBQW1EO0lBQ25ELENBQUMsbUJBQUEsc0JBQXNCLEVBQXVCLENBQUMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ2pFLE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxzQkFBc0IsQ0FBSSxVQUEyQjtJQUM1RCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRTtRQUN6QyxVQUFVLENBQUMsUUFBUSxHQUFHLG1CQUFtQixDQUFDO1FBQzFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsYUFBYSxFQUFFLENBQUM7S0FDeEM7QUFDSCxDQUFDOzs7O0FBRUQsU0FBUyxhQUFhO0lBQ3BCLE9BQU87O2NBQ0Msa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDOztjQUNoRCxPQUFPLEdBQUcsa0JBQWtCLElBQUksa0JBQWtCLENBQUMsT0FBTztRQUVoRSxJQUFJLE9BQU8sRUFBRTtZQUNYLG1CQUFBLGtCQUFrQixFQUFFLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QyxtQkFBQSxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMzQjtJQUNILENBQUMsQ0FBQztBQUNKLENBQUM7Ozs7Ozs7Ozs7QUFFRCxTQUFTLG1CQUFtQixDQUNELFFBQVcsRUFBRSxLQUFVLEVBQUUsVUFBa0IsRUFBRSxXQUFtQjs7VUFDbkYsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDO1FBQ3RELHFCQUFxQixDQUFDLFFBQVEsRUFBRSxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDOztVQUNuRSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzs7VUFDekUsUUFBUSxHQUFHLGtCQUFrQixDQUFDLFFBQVE7O1VBRXRDLFlBQVksR0FBRyxDQUFDLG1CQUFBLElBQUksQ0FBQyxjQUFjLEVBQTBCLENBQUMsQ0FBQyxVQUFVLENBQUM7O1VBQzFFLGNBQWMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDO0lBQzdDLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FDcEMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQztJQUVsRixDQUFDLG1CQUFBLFFBQVEsRUFBTyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLENBQUM7O01BRUssb0JBQW9CLEdBQUcscUJBQXFCOzs7OztBQUVsRCxTQUFTLHFCQUFxQixDQUFDLFFBQWE7SUFDMUMsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDaEQsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxRQUFhLEVBQUUsS0FBMkI7SUFDdkUsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDaEQsQ0FBQzs7OztBQUVELG1DQUdDOzs7SUFGQyx3Q0FBd0I7O0lBQ3hCLHVDQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPbkNoYW5nZXN9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtTaW1wbGVDaGFuZ2UsIFNpbXBsZUNoYW5nZXN9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9zaW1wbGVfY2hhbmdlJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmRmVhdHVyZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcblxuY29uc3QgUFJJVkFURV9QUkVGSVggPSAnX19uZ09uQ2hhbmdlc18nO1xuXG50eXBlIE9uQ2hhbmdlc0V4cGFuZG8gPSBPbkNoYW5nZXMgJiB7XG4gIF9fbmdPbkNoYW5nZXNfOiBTaW1wbGVDaGFuZ2VzfG51bGx8dW5kZWZpbmVkO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55IENhbiBob2xkIGFueSB2YWx1ZVxuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG4vKipcbiAqIFRoZSBOZ09uQ2hhbmdlc0ZlYXR1cmUgZGVjb3JhdGVzIGEgY29tcG9uZW50IHdpdGggc3VwcG9ydCBmb3IgdGhlIG5nT25DaGFuZ2VzXG4gKiBsaWZlY3ljbGUgaG9vaywgc28gaXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIGFueSBjb21wb25lbnQgdGhhdCBpbXBsZW1lbnRzXG4gKiB0aGF0IGhvb2suXG4gKlxuICogSWYgdGhlIGNvbXBvbmVudCBvciBkaXJlY3RpdmUgdXNlcyBpbmhlcml0YW5jZSwgdGhlIE5nT25DaGFuZ2VzRmVhdHVyZSBNVVNUXG4gKiBiZSBpbmNsdWRlZCBhcyBhIGZlYXR1cmUgQUZURVIge0BsaW5rIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZX0sIG90aGVyd2lzZVxuICogaW5oZXJpdGVkIHByb3BlcnRpZXMgd2lsbCBub3QgYmUgcHJvcGFnYXRlZCB0byB0aGUgbmdPbkNoYW5nZXMgbGlmZWN5Y2xlXG4gKiBob29rLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKlxuICogYGBgXG4gKiBzdGF0aWMgbmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICAuLi5cbiAqICAgaW5wdXRzOiB7bmFtZTogJ3B1YmxpY05hbWUnfSxcbiAqICAgZmVhdHVyZXM6IFtOZ09uQ2hhbmdlc0ZlYXR1cmUoKV1cbiAqIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBOZ09uQ2hhbmdlc0ZlYXR1cmU8VD4oKTogRGlyZWN0aXZlRGVmRmVhdHVyZSB7XG4gIC8vIFRoaXMgb3B0aW9uIGVuc3VyZXMgdGhhdCB0aGUgbmdPbkNoYW5nZXMgbGlmZWN5Y2xlIGhvb2sgd2lsbCBiZSBpbmhlcml0ZWRcbiAgLy8gZnJvbSBzdXBlcmNsYXNzZXMgKGluIEluaGVyaXREZWZpbml0aW9uRmVhdHVyZSkuXG4gIChOZ09uQ2hhbmdlc0ZlYXR1cmVJbXBsIGFzIERpcmVjdGl2ZURlZkZlYXR1cmUpLm5nSW5oZXJpdCA9IHRydWU7XG4gIHJldHVybiBOZ09uQ2hhbmdlc0ZlYXR1cmVJbXBsO1xufVxuXG5mdW5jdGlvbiBOZ09uQ2hhbmdlc0ZlYXR1cmVJbXBsPFQ+KGRlZmluaXRpb246IERpcmVjdGl2ZURlZjxUPik6IHZvaWQge1xuICBpZiAoZGVmaW5pdGlvbi50eXBlLnByb3RvdHlwZS5uZ09uQ2hhbmdlcykge1xuICAgIGRlZmluaXRpb24uc2V0SW5wdXQgPSBuZ09uQ2hhbmdlc1NldElucHV0O1xuICAgIGRlZmluaXRpb24ub25DaGFuZ2VzID0gd3JhcE9uQ2hhbmdlcygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBPbkNoYW5nZXMoKSB7XG4gIHJldHVybiBmdW5jdGlvbih0aGlzOiBPbkNoYW5nZXMpIHtcbiAgICBjb25zdCBzaW1wbGVDaGFuZ2VzU3RvcmUgPSBnZXRTaW1wbGVDaGFuZ2VzU3RvcmUodGhpcyk7XG4gICAgY29uc3QgY3VycmVudCA9IHNpbXBsZUNoYW5nZXNTdG9yZSAmJiBzaW1wbGVDaGFuZ2VzU3RvcmUuY3VycmVudDtcblxuICAgIGlmIChjdXJyZW50KSB7XG4gICAgICBzaW1wbGVDaGFuZ2VzU3RvcmUgIS5wcmV2aW91cyA9IGN1cnJlbnQ7XG4gICAgICBzaW1wbGVDaGFuZ2VzU3RvcmUgIS5jdXJyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMubmdPbkNoYW5nZXMoY3VycmVudCk7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBuZ09uQ2hhbmdlc1NldElucHV0PFQ+KFxuICAgIHRoaXM6IERpcmVjdGl2ZURlZjxUPiwgaW5zdGFuY2U6IFQsIHZhbHVlOiBhbnksIHB1YmxpY05hbWU6IHN0cmluZywgcHJpdmF0ZU5hbWU6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBzaW1wbGVDaGFuZ2VzU3RvcmUgPSBnZXRTaW1wbGVDaGFuZ2VzU3RvcmUoaW5zdGFuY2UpIHx8XG4gICAgICBzZXRTaW1wbGVDaGFuZ2VzU3RvcmUoaW5zdGFuY2UsIHtwcmV2aW91czogRU1QVFlfT0JKLCBjdXJyZW50OiBudWxsfSk7XG4gIGNvbnN0IGN1cnJlbnQgPSBzaW1wbGVDaGFuZ2VzU3RvcmUuY3VycmVudCB8fCAoc2ltcGxlQ2hhbmdlc1N0b3JlLmN1cnJlbnQgPSB7fSk7XG4gIGNvbnN0IHByZXZpb3VzID0gc2ltcGxlQ2hhbmdlc1N0b3JlLnByZXZpb3VzO1xuXG4gIGNvbnN0IGRlY2xhcmVkTmFtZSA9ICh0aGlzLmRlY2xhcmVkSW5wdXRzIGFze1trZXk6IHN0cmluZ106IHN0cmluZ30pW3B1YmxpY05hbWVdO1xuICBjb25zdCBwcmV2aW91c0NoYW5nZSA9IHByZXZpb3VzW2RlY2xhcmVkTmFtZV07XG4gIGN1cnJlbnRbZGVjbGFyZWROYW1lXSA9IG5ldyBTaW1wbGVDaGFuZ2UoXG4gICAgICBwcmV2aW91c0NoYW5nZSAmJiBwcmV2aW91c0NoYW5nZS5jdXJyZW50VmFsdWUsIHZhbHVlLCBwcmV2aW91cyA9PT0gRU1QVFlfT0JKKTtcblxuICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbn1cblxuY29uc3QgU0lNUExFX0NIQU5HRVNfU1RPUkUgPSAnX19uZ1NpbXBsZUNoYW5nZXNfXyc7XG5cbmZ1bmN0aW9uIGdldFNpbXBsZUNoYW5nZXNTdG9yZShpbnN0YW5jZTogYW55KTogbnVsbHxOZ1NpbXBsZUNoYW5nZXNTdG9yZSB7XG4gIHJldHVybiBpbnN0YW5jZVtTSU1QTEVfQ0hBTkdFU19TVE9SRV0gfHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0U2ltcGxlQ2hhbmdlc1N0b3JlKGluc3RhbmNlOiBhbnksIHN0b3JlOiBOZ1NpbXBsZUNoYW5nZXNTdG9yZSk6IE5nU2ltcGxlQ2hhbmdlc1N0b3JlIHtcbiAgcmV0dXJuIGluc3RhbmNlW1NJTVBMRV9DSEFOR0VTX1NUT1JFXSA9IHN0b3JlO1xufVxuXG5pbnRlcmZhY2UgTmdTaW1wbGVDaGFuZ2VzU3RvcmUge1xuICBwcmV2aW91czogU2ltcGxlQ2hhbmdlcztcbiAgY3VycmVudDogU2ltcGxlQ2hhbmdlc3xudWxsO1xufVxuIl19