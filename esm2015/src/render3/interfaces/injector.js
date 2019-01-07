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
/** @type {?} */
export const TNODE = 8;
/** @type {?} */
export const PARENT_INJECTOR = 8;
/** @type {?} */
export const INJECTOR_BLOOM_PARENT_SIZE = 9;
/**
 * Represents a relative location of parent injector.
 *
 * The interfaces encodes number of parents `LView`s to traverse and index in the `LView`
 * pointing to the parent injector.
 * @record
 */
export function RelativeInjectorLocation() { }
if (false) {
    /** @type {?} */
    RelativeInjectorLocation.prototype.__brand__;
}
/** @enum {number} */
const RelativeInjectorLocationFlags = {
    InjectorIndexMask: 32767,
    ViewOffsetShift: 16,
    NO_PARENT: -1,
};
export { RelativeInjectorLocationFlags };
/** @type {?} */
export const NO_PARENT_INJECTOR = (/** @type {?} */ (-1));
/**
 * Each injector is saved in 9 contiguous slots in `LView` and 9 contiguous slots in
 * `TView.data`. This allows us to store information about the current node's tokens (which
 * can be shared in `TView`) as well as the tokens of its ancestor nodes (which cannot be
 * shared, so they live in `LView`).
 *
 * Each of these slots (aside from the last slot) contains a bloom filter. This bloom filter
 * determines whether a directive is available on the associated node or not. This prevents us
 * from searching the directives array at this level unless it's probable the directive is in it.
 *
 * See: https://en.wikipedia.org/wiki/Bloom_filter for more about bloom filters.
 *
 * Because all injectors have been flattened into `LView` and `TViewData`, they cannot typed
 * using interfaces as they were previously. The start index of each `LInjector` and `TInjector`
 * will differ based on where it is flattened into the main array, so it's not possible to know
 * the indices ahead of time and save their types here. The interfaces are still included here
 * for documentation purposes.
 *
 * export interface LInjector extends Array<any> {
 *
 *    // Cumulative bloom for directive IDs 0-31  (IDs are % BLOOM_SIZE)
 *    [0]: number;
 *
 *    // Cumulative bloom for directive IDs 32-63
 *    [1]: number;
 *
 *    // Cumulative bloom for directive IDs 64-95
 *    [2]: number;
 *
 *    // Cumulative bloom for directive IDs 96-127
 *    [3]: number;
 *
 *    // Cumulative bloom for directive IDs 128-159
 *    [4]: number;
 *
 *    // Cumulative bloom for directive IDs 160 - 191
 *    [5]: number;
 *
 *    // Cumulative bloom for directive IDs 192 - 223
 *    [6]: number;
 *
 *    // Cumulative bloom for directive IDs 224 - 255
 *    [7]: number;
 *
 *    // We need to store a reference to the injector's parent so DI can keep looking up
 *    // the injector tree until it finds the dependency it's looking for.
 *    [PARENT_INJECTOR]: number;
 * }
 *
 * export interface TInjector extends Array<any> {
 *
 *    // Shared node bloom for directive IDs 0-31  (IDs are % BLOOM_SIZE)
 *    [0]: number;
 *
 *    // Shared node bloom for directive IDs 32-63
 *    [1]: number;
 *
 *    // Shared node bloom for directive IDs 64-95
 *    [2]: number;
 *
 *    // Shared node bloom for directive IDs 96-127
 *    [3]: number;
 *
 *    // Shared node bloom for directive IDs 128-159
 *    [4]: number;
 *
 *    // Shared node bloom for directive IDs 160 - 191
 *    [5]: number;
 *
 *    // Shared node bloom for directive IDs 192 - 223
 *    [6]: number;
 *
 *    // Shared node bloom for directive IDs 224 - 255
 *    [7]: number;
 *
 *    // Necessary to find directive indices for a particular node.
 *    [TNODE]: TElementNode|TElementContainerNode|TContainerNode;
 *  }
 */
/**
 * Factory for creating instances of injectors in the NodeInjector.
 *
 * This factory is complicated by the fact that it can resolve `multi` factories as well.
 *
 * NOTE: Some of the fields are optional which means that this class has two hidden classes.
 * - One without `multi` support (most common)
 * - One with `multi` values, (rare).
 *
 * Since VMs can cache up to 4 inline hidden classes this is OK.
 *
 * - Single factory: Only `resolving` and `factory` is defined.
 * - `providers` factory: `componentProviders` is a number and `index = -1`.
 * - `viewProviders` factory: `componentProviders` is a number and `index` points to `providers`.
 */
export class NodeInjectorFactory {
    /**
     * @param {?} factory
     * @param {?} isViewProvider
     * @param {?} isProvider
     * @param {?} injectImplementation
     */
    constructor(factory, 
    /**
     * Set to `true` if the token is declared in `viewProviders` (or if it is component).
     */
    isViewProvider, isProvider, injectImplementation) {
        this.factory = factory;
        this.isProvider = isProvider;
        /**
         * Marker set to true during factory invocation to see if we get into recursive loop.
         * Recursive loop causes an error to be displayed.
         */
        this.resolving = false;
        this.canSeeViewProviders = isViewProvider;
        this.injectImpl = injectImplementation;
    }
}
if (false) {
    /**
     * The inject implementation to be activated when using the factory.
     * @type {?}
     */
    NodeInjectorFactory.prototype.injectImpl;
    /**
     * Marker set to true during factory invocation to see if we get into recursive loop.
     * Recursive loop causes an error to be displayed.
     * @type {?}
     */
    NodeInjectorFactory.prototype.resolving;
    /**
     * Marks that the token can see other Tokens declared in `viewProviders` on the same node.
     * @type {?}
     */
    NodeInjectorFactory.prototype.canSeeViewProviders;
    /**
     * An array of factories to use in case of `multi` provider.
     * @type {?}
     */
    NodeInjectorFactory.prototype.multi;
    /**
     * Number of `multi`-providers which belong to the component.
     *
     * This is needed because when multiple components and directives declare the `multi` provider
     * they have to be concatenated in the correct order.
     *
     * Example:
     *
     * If we have a component and directive active an a single element as declared here
     * ```
     * component:
     *   provides: [ {provide: String, useValue: 'component', multi: true} ],
     *   viewProvides: [ {provide: String, useValue: 'componentView', multi: true} ],
     *
     * directive:
     *   provides: [ {provide: String, useValue: 'directive', multi: true} ],
     * ```
     *
     * Then the expected results are:
     *
     * ```
     * providers: ['component', 'directive']
     * viewProviders: ['component', 'componentView', 'directive']
     * ```
     *
     * The way to think about it is that the `viewProviders` have been inserted after the component
     * but before the directives, which is why we need to know how many `multi`s have been declared by
     * the component.
     * @type {?}
     */
    NodeInjectorFactory.prototype.componentProviders;
    /**
     * Current index of the Factory in the `data`. Needed for `viewProviders` and `providers` merging.
     * See `providerFactory`.
     * @type {?}
     */
    NodeInjectorFactory.prototype.index;
    /**
     * Because the same `multi` provider can be declared in `provides` and `viewProvides` it is
     * possible for `viewProvides` to shadow the `provides`. For this reason we store the
     * `provideFactory` of the `providers` so that `providers` can be extended with `viewProviders`.
     *
     * Example:
     *
     * Given:
     * ```
     * provides: [ {provide: String, useValue: 'all', multi: true} ],
     * viewProvides: [ {provide: String, useValue: 'viewOnly', multi: true} ],
     * ```
     *
     * We have to return `['all']` in case of content injection, but `['all', 'viewOnly']` in case
     * of view injection. We further have to make sure that the shared instances (in our case
     * `all`) are the exact same instance in both the content as well as the view injection. (We
     * have to make sure that we don't double instantiate.) For this reason the `viewProvides`
     * `Factory` has a pointer to the shadowed `provides` factory so that it can instantiate the
     * `providers` (`['all']`) and then extend it with `viewProviders` (`['all'] + ['viewOnly'] =
     * ['all', 'viewOnly']`).
     * @type {?}
     */
    NodeInjectorFactory.prototype.providerFactory;
    /**
     * Factory to invoke in order to create a new instance.
     * @type {?}
     */
    NodeInjectorFactory.prototype.factory;
    /**
     * Set to `true` if the token is a provider, and not a directive.
     * @type {?}
     */
    NodeInjectorFactory.prototype.isProvider;
}
/** @type {?} */
const FactoryPrototype = NodeInjectorFactory.prototype;
/**
 * @param {?} obj
 * @return {?}
 */
export function isFactory(obj) {
    // See: https://jsperf.com/instanceof-vs-getprototypeof
    return obj != null && typeof obj == 'object' && Object.getPrototypeOf(obj) == FactoryPrototype;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBY0EsTUFBTSxPQUFPLEtBQUssR0FBRyxDQUFDOztBQUN0QixNQUFNLE9BQU8sZUFBZSxHQUFHLENBQUM7O0FBQ2hDLE1BQU0sT0FBTywwQkFBMEIsR0FBRyxDQUFDOzs7Ozs7OztBQVEzQyw4Q0FBeUY7OztJQUE3Qyw2Q0FBMkM7Ozs7SUFHckYsd0JBQXFDO0lBQ3JDLG1CQUFvQjtJQUNwQixhQUFjOzs7O0FBR2hCLE1BQU0sT0FBTyxrQkFBa0IsR0FBNkIsbUJBQUEsQ0FBQyxDQUFDLEVBQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUdyRSxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7O0lBbUY5QixZQUlXLE9BZXlCO0lBQ2hDOztPQUVHO0lBQ0gsY0FBdUIsRUFJaEIsVUFBbUIsRUFDMUIsb0JBQTJGO1FBeEJwRixZQUFPLEdBQVAsT0FBTyxDQWVrQjtRQVF6QixlQUFVLEdBQVYsVUFBVSxDQUFTOzs7OztRQXBHOUIsY0FBUyxHQUFHLEtBQUssQ0FBQztRQXNHaEIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGNBQWMsQ0FBQztRQUMxQyxJQUFJLENBQUMsVUFBVSxHQUFHLG9CQUFvQixDQUFDO0lBQ3pDLENBQUM7Q0FDRjs7Ozs7O0lBL0dDLHlDQUFrRjs7Ozs7O0lBTWxGLHdDQUFrQjs7Ozs7SUFLbEIsa0RBQTZCOzs7OztJQUs3QixvQ0FBeUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUErQnpCLGlEQUE0Qjs7Ozs7O0lBTTVCLG9DQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXVCZiw4Q0FBMkM7Ozs7O0lBT3ZDLHNDQWVnQzs7Ozs7SUFRaEMseUNBQTBCOzs7TUFPMUIsZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsU0FBUzs7Ozs7QUFDdEQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxHQUFRO0lBQ2hDLHVEQUF1RDtJQUN2RCxPQUFPLEdBQUcsSUFBSSxJQUFJLElBQUksT0FBTyxHQUFHLElBQUksUUFBUSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksZ0JBQWdCLENBQUM7QUFDakcsQ0FBQzs7OztBQUlELE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtURWxlbWVudE5vZGV9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge0xWaWV3LCBURGF0YX0gZnJvbSAnLi92aWV3JztcblxuZXhwb3J0IGNvbnN0IFROT0RFID0gODtcbmV4cG9ydCBjb25zdCBQQVJFTlRfSU5KRUNUT1IgPSA4O1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFID0gOTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgcmVsYXRpdmUgbG9jYXRpb24gb2YgcGFyZW50IGluamVjdG9yLlxuICpcbiAqIFRoZSBpbnRlcmZhY2VzIGVuY29kZXMgbnVtYmVyIG9mIHBhcmVudHMgYExWaWV3YHMgdG8gdHJhdmVyc2UgYW5kIGluZGV4IGluIHRoZSBgTFZpZXdgXG4gKiBwb2ludGluZyB0byB0aGUgcGFyZW50IGluamVjdG9yLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7IF9fYnJhbmRfXzogJ1JlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzJzsgfVxuXG5leHBvcnQgY29uc3QgZW51bSBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncyB7XG4gIEluamVjdG9ySW5kZXhNYXNrID0gMGIxMTExMTExMTExMTExMTEsXG4gIFZpZXdPZmZzZXRTaGlmdCA9IDE2LFxuICBOT19QQVJFTlQgPSAtMSxcbn1cblxuZXhwb3J0IGNvbnN0IE5PX1BBUkVOVF9JTkpFQ1RPUjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gLTEgYXMgYW55O1xuXG4vKipcbiAqIEVhY2ggaW5qZWN0b3IgaXMgc2F2ZWQgaW4gOSBjb250aWd1b3VzIHNsb3RzIGluIGBMVmlld2AgYW5kIDkgY29udGlndW91cyBzbG90cyBpblxuICogYFRWaWV3LmRhdGFgLiBUaGlzIGFsbG93cyB1cyB0byBzdG9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBub2RlJ3MgdG9rZW5zICh3aGljaFxuICogY2FuIGJlIHNoYXJlZCBpbiBgVFZpZXdgKSBhcyB3ZWxsIGFzIHRoZSB0b2tlbnMgb2YgaXRzIGFuY2VzdG9yIG5vZGVzICh3aGljaCBjYW5ub3QgYmVcbiAqIHNoYXJlZCwgc28gdGhleSBsaXZlIGluIGBMVmlld2ApLlxuICpcbiAqIEVhY2ggb2YgdGhlc2Ugc2xvdHMgKGFzaWRlIGZyb20gdGhlIGxhc3Qgc2xvdCkgY29udGFpbnMgYSBibG9vbSBmaWx0ZXIuIFRoaXMgYmxvb20gZmlsdGVyXG4gKiBkZXRlcm1pbmVzIHdoZXRoZXIgYSBkaXJlY3RpdmUgaXMgYXZhaWxhYmxlIG9uIHRoZSBhc3NvY2lhdGVkIG5vZGUgb3Igbm90LiBUaGlzIHByZXZlbnRzIHVzXG4gKiBmcm9tIHNlYXJjaGluZyB0aGUgZGlyZWN0aXZlcyBhcnJheSBhdCB0aGlzIGxldmVsIHVubGVzcyBpdCdzIHByb2JhYmxlIHRoZSBkaXJlY3RpdmUgaXMgaW4gaXQuXG4gKlxuICogU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CbG9vbV9maWx0ZXIgZm9yIG1vcmUgYWJvdXQgYmxvb20gZmlsdGVycy5cbiAqXG4gKiBCZWNhdXNlIGFsbCBpbmplY3RvcnMgaGF2ZSBiZWVuIGZsYXR0ZW5lZCBpbnRvIGBMVmlld2AgYW5kIGBUVmlld0RhdGFgLCB0aGV5IGNhbm5vdCB0eXBlZFxuICogdXNpbmcgaW50ZXJmYWNlcyBhcyB0aGV5IHdlcmUgcHJldmlvdXNseS4gVGhlIHN0YXJ0IGluZGV4IG9mIGVhY2ggYExJbmplY3RvcmAgYW5kIGBUSW5qZWN0b3JgXG4gKiB3aWxsIGRpZmZlciBiYXNlZCBvbiB3aGVyZSBpdCBpcyBmbGF0dGVuZWQgaW50byB0aGUgbWFpbiBhcnJheSwgc28gaXQncyBub3QgcG9zc2libGUgdG8ga25vd1xuICogdGhlIGluZGljZXMgYWhlYWQgb2YgdGltZSBhbmQgc2F2ZSB0aGVpciB0eXBlcyBoZXJlLiBUaGUgaW50ZXJmYWNlcyBhcmUgc3RpbGwgaW5jbHVkZWQgaGVyZVxuICogZm9yIGRvY3VtZW50YXRpb24gcHVycG9zZXMuXG4gKlxuICogZXhwb3J0IGludGVyZmFjZSBMSW5qZWN0b3IgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDAtMzEgIChJRHMgYXJlICUgQkxPT01fU0laRSlcbiAqICAgIFswXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMzItNjNcbiAqICAgIFsxXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgNjQtOTVcbiAqICAgIFsyXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgOTYtMTI3XG4gKiAgICBbM106IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDEyOC0xNTlcbiAqICAgIFs0XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTYwIC0gMTkxXG4gKiAgICBbNV06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDE5MiAtIDIyM1xuICogICAgWzZdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAyMjQgLSAyNTVcbiAqICAgIFs3XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFdlIG5lZWQgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGluamVjdG9yJ3MgcGFyZW50IHNvIERJIGNhbiBrZWVwIGxvb2tpbmcgdXBcbiAqICAgIC8vIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIGl0IGZpbmRzIHRoZSBkZXBlbmRlbmN5IGl0J3MgbG9va2luZyBmb3IuXG4gKiAgICBbUEFSRU5UX0lOSkVDVE9SXTogbnVtYmVyO1xuICogfVxuICpcbiAqIGV4cG9ydCBpbnRlcmZhY2UgVEluamVjdG9yIGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMC0zMSAgKElEcyBhcmUgJSBCTE9PTV9TSVpFKVxuICogICAgWzBdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMzItNjNcbiAqICAgIFsxXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDY0LTk1XG4gKiAgICBbMl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA5Ni0xMjdcbiAqICAgIFszXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDEyOC0xNTlcbiAqICAgIFs0XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDE2MCAtIDE5MVxuICogICAgWzVdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTkyIC0gMjIzXG4gKiAgICBbNl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAyMjQgLSAyNTVcbiAqICAgIFs3XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIE5lY2Vzc2FyeSB0byBmaW5kIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBhIHBhcnRpY3VsYXIgbm9kZS5cbiAqICAgIFtUTk9ERV06IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGU7XG4gKiAgfVxuICovXG5cbi8qKlxuKiBGYWN0b3J5IGZvciBjcmVhdGluZyBpbnN0YW5jZXMgb2YgaW5qZWN0b3JzIGluIHRoZSBOb2RlSW5qZWN0b3IuXG4qXG4qIFRoaXMgZmFjdG9yeSBpcyBjb21wbGljYXRlZCBieSB0aGUgZmFjdCB0aGF0IGl0IGNhbiByZXNvbHZlIGBtdWx0aWAgZmFjdG9yaWVzIGFzIHdlbGwuXG4qXG4qIE5PVEU6IFNvbWUgb2YgdGhlIGZpZWxkcyBhcmUgb3B0aW9uYWwgd2hpY2ggbWVhbnMgdGhhdCB0aGlzIGNsYXNzIGhhcyB0d28gaGlkZGVuIGNsYXNzZXMuXG4qIC0gT25lIHdpdGhvdXQgYG11bHRpYCBzdXBwb3J0IChtb3N0IGNvbW1vbilcbiogLSBPbmUgd2l0aCBgbXVsdGlgIHZhbHVlcywgKHJhcmUpLlxuKlxuKiBTaW5jZSBWTXMgY2FuIGNhY2hlIHVwIHRvIDQgaW5saW5lIGhpZGRlbiBjbGFzc2VzIHRoaXMgaXMgT0suXG4qXG4qIC0gU2luZ2xlIGZhY3Rvcnk6IE9ubHkgYHJlc29sdmluZ2AgYW5kIGBmYWN0b3J5YCBpcyBkZWZpbmVkLlxuKiAtIGBwcm92aWRlcnNgIGZhY3Rvcnk6IGBjb21wb25lbnRQcm92aWRlcnNgIGlzIGEgbnVtYmVyIGFuZCBgaW5kZXggPSAtMWAuXG4qIC0gYHZpZXdQcm92aWRlcnNgIGZhY3Rvcnk6IGBjb21wb25lbnRQcm92aWRlcnNgIGlzIGEgbnVtYmVyIGFuZCBgaW5kZXhgIHBvaW50cyB0byBgcHJvdmlkZXJzYC5cbiovXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yRmFjdG9yeSB7XG4gIC8qKlxuICAgKiBUaGUgaW5qZWN0IGltcGxlbWVudGF0aW9uIHRvIGJlIGFjdGl2YXRlZCB3aGVuIHVzaW5nIHRoZSBmYWN0b3J5LlxuICAgKi9cbiAgaW5qZWN0SW1wbDogbnVsbHwoPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpID0+IFQpO1xuXG4gIC8qKlxuICAgKiBNYXJrZXIgc2V0IHRvIHRydWUgZHVyaW5nIGZhY3RvcnkgaW52b2NhdGlvbiB0byBzZWUgaWYgd2UgZ2V0IGludG8gcmVjdXJzaXZlIGxvb3AuXG4gICAqIFJlY3Vyc2l2ZSBsb29wIGNhdXNlcyBhbiBlcnJvciB0byBiZSBkaXNwbGF5ZWQuXG4gICAqL1xuICByZXNvbHZpbmcgPSBmYWxzZTtcblxuICAvKipcbiAgICogTWFya3MgdGhhdCB0aGUgdG9rZW4gY2FuIHNlZSBvdGhlciBUb2tlbnMgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIG9uIHRoZSBzYW1lIG5vZGUuXG4gICAqL1xuICBjYW5TZWVWaWV3UHJvdmlkZXJzOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBmYWN0b3JpZXMgdG8gdXNlIGluIGNhc2Ugb2YgYG11bHRpYCBwcm92aWRlci5cbiAgICovXG4gIG11bHRpPzogQXJyYXk8KCkgPT4gYW55PjtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIGBtdWx0aWAtcHJvdmlkZXJzIHdoaWNoIGJlbG9uZyB0byB0aGUgY29tcG9uZW50LlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHdoZW4gbXVsdGlwbGUgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBkZWNsYXJlIHRoZSBgbXVsdGlgIHByb3ZpZGVyXG4gICAqIHRoZXkgaGF2ZSB0byBiZSBjb25jYXRlbmF0ZWQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqXG4gICAqIElmIHdlIGhhdmUgYSBjb21wb25lbnQgYW5kIGRpcmVjdGl2ZSBhY3RpdmUgYW4gYSBzaW5nbGUgZWxlbWVudCBhcyBkZWNsYXJlZCBoZXJlXG4gICAqIGBgYFxuICAgKiBjb21wb25lbnQ6XG4gICAqICAgcHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICdjb21wb25lbnQnLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICogICB2aWV3UHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICdjb21wb25lbnRWaWV3JywgbXVsdGk6IHRydWV9IF0sXG4gICAqXG4gICAqIGRpcmVjdGl2ZTpcbiAgICogICBwcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2RpcmVjdGl2ZScsIG11bHRpOiB0cnVlfSBdLFxuICAgKiBgYGBcbiAgICpcbiAgICogVGhlbiB0aGUgZXhwZWN0ZWQgcmVzdWx0cyBhcmU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBwcm92aWRlcnM6IFsnY29tcG9uZW50JywgJ2RpcmVjdGl2ZSddXG4gICAqIHZpZXdQcm92aWRlcnM6IFsnY29tcG9uZW50JywgJ2NvbXBvbmVudFZpZXcnLCAnZGlyZWN0aXZlJ11cbiAgICogYGBgXG4gICAqXG4gICAqIFRoZSB3YXkgdG8gdGhpbmsgYWJvdXQgaXQgaXMgdGhhdCB0aGUgYHZpZXdQcm92aWRlcnNgIGhhdmUgYmVlbiBpbnNlcnRlZCBhZnRlciB0aGUgY29tcG9uZW50XG4gICAqIGJ1dCBiZWZvcmUgdGhlIGRpcmVjdGl2ZXMsIHdoaWNoIGlzIHdoeSB3ZSBuZWVkIHRvIGtub3cgaG93IG1hbnkgYG11bHRpYHMgaGF2ZSBiZWVuIGRlY2xhcmVkIGJ5XG4gICAqIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBjb21wb25lbnRQcm92aWRlcnM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgaW5kZXggb2YgdGhlIEZhY3RvcnkgaW4gdGhlIGBkYXRhYC4gTmVlZGVkIGZvciBgdmlld1Byb3ZpZGVyc2AgYW5kIGBwcm92aWRlcnNgIG1lcmdpbmcuXG4gICAqIFNlZSBgcHJvdmlkZXJGYWN0b3J5YC5cbiAgICovXG4gIGluZGV4PzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBCZWNhdXNlIHRoZSBzYW1lIGBtdWx0aWAgcHJvdmlkZXIgY2FuIGJlIGRlY2xhcmVkIGluIGBwcm92aWRlc2AgYW5kIGB2aWV3UHJvdmlkZXNgIGl0IGlzXG4gICAqIHBvc3NpYmxlIGZvciBgdmlld1Byb3ZpZGVzYCB0byBzaGFkb3cgdGhlIGBwcm92aWRlc2AuIEZvciB0aGlzIHJlYXNvbiB3ZSBzdG9yZSB0aGVcbiAgICogYHByb3ZpZGVGYWN0b3J5YCBvZiB0aGUgYHByb3ZpZGVyc2Agc28gdGhhdCBgcHJvdmlkZXJzYCBjYW4gYmUgZXh0ZW5kZWQgd2l0aCBgdmlld1Byb3ZpZGVyc2AuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqXG4gICAqIEdpdmVuOlxuICAgKiBgYGBcbiAgICogcHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICdhbGwnLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICogdmlld1Byb3ZpZGVzOiBbIHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiAndmlld09ubHknLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICogYGBgXG4gICAqXG4gICAqIFdlIGhhdmUgdG8gcmV0dXJuIGBbJ2FsbCddYCBpbiBjYXNlIG9mIGNvbnRlbnQgaW5qZWN0aW9uLCBidXQgYFsnYWxsJywgJ3ZpZXdPbmx5J11gIGluIGNhc2VcbiAgICogb2YgdmlldyBpbmplY3Rpb24uIFdlIGZ1cnRoZXIgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgc2hhcmVkIGluc3RhbmNlcyAoaW4gb3VyIGNhc2VcbiAgICogYGFsbGApIGFyZSB0aGUgZXhhY3Qgc2FtZSBpbnN0YW5jZSBpbiBib3RoIHRoZSBjb250ZW50IGFzIHdlbGwgYXMgdGhlIHZpZXcgaW5qZWN0aW9uLiAoV2VcbiAgICogaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBkb3VibGUgaW5zdGFudGlhdGUuKSBGb3IgdGhpcyByZWFzb24gdGhlIGB2aWV3UHJvdmlkZXNgXG4gICAqIGBGYWN0b3J5YCBoYXMgYSBwb2ludGVyIHRvIHRoZSBzaGFkb3dlZCBgcHJvdmlkZXNgIGZhY3Rvcnkgc28gdGhhdCBpdCBjYW4gaW5zdGFudGlhdGUgdGhlXG4gICAqIGBwcm92aWRlcnNgIChgWydhbGwnXWApIGFuZCB0aGVuIGV4dGVuZCBpdCB3aXRoIGB2aWV3UHJvdmlkZXJzYCAoYFsnYWxsJ10gKyBbJ3ZpZXdPbmx5J10gPVxuICAgKiBbJ2FsbCcsICd2aWV3T25seSddYCkuXG4gICAqL1xuICBwcm92aWRlckZhY3Rvcnk/OiBOb2RlSW5qZWN0b3JGYWN0b3J5fG51bGw7XG5cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogRmFjdG9yeSB0byBpbnZva2UgaW4gb3JkZXIgdG8gY3JlYXRlIGEgbmV3IGluc3RhbmNlLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgZmFjdG9yeTpcbiAgICAgICAgICAodGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogbnVsbCxcbiAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqIGFycmF5IHdoZXJlIGluamVjdGFibGVzIHRva2VucyBhcmUgc3RvcmVkLiBUaGlzIGlzIHVzZWQgaW5cbiAgICAgICAgICAgICogY2FzZSBvZiBhbiBlcnJvciByZXBvcnRpbmcgdG8gcHJvZHVjZSBmcmllbmRsaWVyIGVycm9ycy5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgIHREYXRhOiBURGF0YSxcbiAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqIGFycmF5IHdoZXJlIGV4aXN0aW5nIGluc3RhbmNlcyBvZiBpbmplY3RhYmxlcyBhcmUgc3RvcmVkLiBUaGlzIGlzIHVzZWQgaW4gY2FzZVxuICAgICAgICAgICAgKiBvZiBtdWx0aSBzaGFkb3cgaXMgbmVlZGVkLiBTZWUgYG11bHRpYCBmaWVsZCBkb2N1bWVudGF0aW9uLlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgbFZpZXc6IExWaWV3LFxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogVGhlIFROb2RlIG9mIHRoZSBzYW1lIGVsZW1lbnQgaW5qZWN0b3IuXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICB0Tm9kZTogVEVsZW1lbnROb2RlKSA9PiBhbnksXG4gICAgICAvKipcbiAgICAgICAqIFNldCB0byBgdHJ1ZWAgaWYgdGhlIHRva2VuIGlzIGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCAob3IgaWYgaXQgaXMgY29tcG9uZW50KS5cbiAgICAgICAqL1xuICAgICAgaXNWaWV3UHJvdmlkZXI6IGJvb2xlYW4sXG4gICAgICAvKipcbiAgICAgICAqIFNldCB0byBgdHJ1ZWAgaWYgdGhlIHRva2VuIGlzIGEgcHJvdmlkZXIsIGFuZCBub3QgYSBkaXJlY3RpdmUuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBpc1Byb3ZpZGVyOiBib29sZWFuLFxuICAgICAgaW5qZWN0SW1wbGVtZW50YXRpb246IG51bGx8KDxUPih0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKSA9PiBUKSkge1xuICAgIHRoaXMuY2FuU2VlVmlld1Byb3ZpZGVycyA9IGlzVmlld1Byb3ZpZGVyO1xuICAgIHRoaXMuaW5qZWN0SW1wbCA9IGluamVjdEltcGxlbWVudGF0aW9uO1xuICB9XG59XG5cbmNvbnN0IEZhY3RvcnlQcm90b3R5cGUgPSBOb2RlSW5qZWN0b3JGYWN0b3J5LnByb3RvdHlwZTtcbmV4cG9ydCBmdW5jdGlvbiBpc0ZhY3Rvcnkob2JqOiBhbnkpOiBvYmogaXMgTm9kZUluamVjdG9yRmFjdG9yeSB7XG4gIC8vIFNlZTogaHR0cHM6Ly9qc3BlcmYuY29tL2luc3RhbmNlb2YtdnMtZ2V0cHJvdG90eXBlb2ZcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmIHR5cGVvZiBvYmogPT0gJ29iamVjdCcgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikgPT0gRmFjdG9yeVByb3RvdHlwZTtcbn1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==