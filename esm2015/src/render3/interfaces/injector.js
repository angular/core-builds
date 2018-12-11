/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
export const INJECTOR_SIZE = 9;
/**
 * Represents a relative location of parent injector.
 *
 * The interfaces encodes number of parents `LViewData`s to traverse and index in the `LViewData`
 * pointing to the parent injector.
 * @record
 */
export function RelativeInjectorLocation() { }
/** @type {?} */
RelativeInjectorLocation.prototype.__brand__;
/** @enum {number} */
var RelativeInjectorLocationFlags = {
    InjectorIndexMask: 32767,
    AcrossHostBoundary: 32768,
    ViewOffsetShift: 16,
    NO_PARENT: -1,
};
export { RelativeInjectorLocationFlags };
/** @type {?} */
export const NO_PARENT_INJECTOR = /** @type {?} */ (-1);
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
     * @param {?} injectImplementation
     */
    constructor(factory, /**
           * Set to `true` if the token is declared in `viewProviders` (or if it is component).
           */
    isViewProvider, injectImplementation) {
        this.factory = factory;
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
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBY0EsYUFBYSxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUN2QixhQUFhLGVBQWUsR0FBRyxDQUFDLENBQUM7O0FBQ2pDLGFBQWEsYUFBYSxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7OztJQVc3Qix3QkFBcUM7SUFDckMseUJBQXVDO0lBQ3ZDLG1CQUFvQjtJQUNwQixhQUFjOzs7O0FBR2hCLGFBQWEsa0JBQWtCLHFCQUE2QixDQUFDLENBQVEsRUFBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWlHdEUsTUFBTSxPQUFPLG1CQUFtQjs7Ozs7O0lBbUY5QixZQUlXOzs7SUFtQlAsY0FBdUIsRUFDdkIsb0JBQTJGO1FBcEJwRixZQUFPLEdBQVAsT0FBTzs7Ozs7UUE3RWxCLGlCQUFZLEtBQUssQ0FBQztRQWtHaEIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGNBQWMsQ0FBQztRQUMxQyxJQUFJLENBQUMsVUFBVSxHQUFHLG9CQUFvQixDQUFDO0tBQ3hDO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsU0FBUyxDQUFDOzs7OztBQUN2RCxNQUFNLFVBQVUsU0FBUyxDQUFDLEdBQVE7O0lBRWhDLE9BQU8sR0FBRyxJQUFJLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxRQUFRLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztDQUNoRzs7QUFJRCxhQUFhLDZCQUE2QixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7VEVsZW1lbnROb2RlfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtMVmlld0RhdGEsIFREYXRhfSBmcm9tICcuL3ZpZXcnO1xuXG5leHBvcnQgY29uc3QgVE5PREUgPSA4O1xuZXhwb3J0IGNvbnN0IFBBUkVOVF9JTkpFQ1RPUiA9IDg7XG5leHBvcnQgY29uc3QgSU5KRUNUT1JfU0laRSA9IDk7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHJlbGF0aXZlIGxvY2F0aW9uIG9mIHBhcmVudCBpbmplY3Rvci5cbiAqXG4gKiBUaGUgaW50ZXJmYWNlcyBlbmNvZGVzIG51bWJlciBvZiBwYXJlbnRzIGBMVmlld0RhdGFgcyB0byB0cmF2ZXJzZSBhbmQgaW5kZXggaW4gdGhlIGBMVmlld0RhdGFgXG4gKiBwb2ludGluZyB0byB0aGUgcGFyZW50IGluamVjdG9yLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7IF9fYnJhbmRfXzogJ1JlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzJzsgfVxuXG5leHBvcnQgY29uc3QgZW51bSBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncyB7XG4gIEluamVjdG9ySW5kZXhNYXNrID0gMGIxMTExMTExMTExMTExMTEsXG4gIEFjcm9zc0hvc3RCb3VuZGFyeSA9IDBiMTAwMDAwMDAwMDAwMDAwMCxcbiAgVmlld09mZnNldFNoaWZ0ID0gMTYsXG4gIE5PX1BBUkVOVCA9IC0xLFxufVxuXG5leHBvcnQgY29uc3QgTk9fUEFSRU5UX0lOSkVDVE9SOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24gPSAtMSBhcyBhbnk7XG5cbi8qKlxuICogRWFjaCBpbmplY3RvciBpcyBzYXZlZCBpbiA5IGNvbnRpZ3VvdXMgc2xvdHMgaW4gYExWaWV3RGF0YWAgYW5kIDkgY29udGlndW91cyBzbG90cyBpblxuICogYFRWaWV3LmRhdGFgLiBUaGlzIGFsbG93cyB1cyB0byBzdG9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBub2RlJ3MgdG9rZW5zICh3aGljaFxuICogY2FuIGJlIHNoYXJlZCBpbiBgVFZpZXdgKSBhcyB3ZWxsIGFzIHRoZSB0b2tlbnMgb2YgaXRzIGFuY2VzdG9yIG5vZGVzICh3aGljaCBjYW5ub3QgYmVcbiAqIHNoYXJlZCwgc28gdGhleSBsaXZlIGluIGBMVmlld0RhdGFgKS5cbiAqXG4gKiBFYWNoIG9mIHRoZXNlIHNsb3RzIChhc2lkZSBmcm9tIHRoZSBsYXN0IHNsb3QpIGNvbnRhaW5zIGEgYmxvb20gZmlsdGVyLiBUaGlzIGJsb29tIGZpbHRlclxuICogZGV0ZXJtaW5lcyB3aGV0aGVyIGEgZGlyZWN0aXZlIGlzIGF2YWlsYWJsZSBvbiB0aGUgYXNzb2NpYXRlZCBub2RlIG9yIG5vdC4gVGhpcyBwcmV2ZW50cyB1c1xuICogZnJvbSBzZWFyY2hpbmcgdGhlIGRpcmVjdGl2ZXMgYXJyYXkgYXQgdGhpcyBsZXZlbCB1bmxlc3MgaXQncyBwcm9iYWJsZSB0aGUgZGlyZWN0aXZlIGlzIGluIGl0LlxuICpcbiAqIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmxvb21fZmlsdGVyIGZvciBtb3JlIGFib3V0IGJsb29tIGZpbHRlcnMuXG4gKlxuICogQmVjYXVzZSBhbGwgaW5qZWN0b3JzIGhhdmUgYmVlbiBmbGF0dGVuZWQgaW50byBgTFZpZXdEYXRhYCBhbmQgYFRWaWV3RGF0YWAsIHRoZXkgY2Fubm90IHR5cGVkXG4gKiB1c2luZyBpbnRlcmZhY2VzIGFzIHRoZXkgd2VyZSBwcmV2aW91c2x5LiBUaGUgc3RhcnQgaW5kZXggb2YgZWFjaCBgTEluamVjdG9yYCBhbmQgYFRJbmplY3RvcmBcbiAqIHdpbGwgZGlmZmVyIGJhc2VkIG9uIHdoZXJlIGl0IGlzIGZsYXR0ZW5lZCBpbnRvIHRoZSBtYWluIGFycmF5LCBzbyBpdCdzIG5vdCBwb3NzaWJsZSB0byBrbm93XG4gKiB0aGUgaW5kaWNlcyBhaGVhZCBvZiB0aW1lIGFuZCBzYXZlIHRoZWlyIHR5cGVzIGhlcmUuIFRoZSBpbnRlcmZhY2VzIGFyZSBzdGlsbCBpbmNsdWRlZCBoZXJlXG4gKiBmb3IgZG9jdW1lbnRhdGlvbiBwdXJwb3Nlcy5cbiAqXG4gKiBleHBvcnQgaW50ZXJmYWNlIExJbmplY3RvciBleHRlbmRzIEFycmF5PGFueT4ge1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMC0zMSAgKElEcyBhcmUgJSBCTE9PTV9TSVpFKVxuICogICAgWzBdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAzMi02M1xuICogICAgWzFdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA2NC05NVxuICogICAgWzJdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA5Ni0xMjdcbiAqICAgIFszXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTI4LTE1OVxuICogICAgWzRdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAxNjAgLSAxOTFcbiAqICAgIFs1XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTkyIC0gMjIzXG4gKiAgICBbNl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDIyNCAtIDI1NVxuICogICAgWzddOiBudW1iZXI7XG4gKlxuICogICAgLy8gV2UgbmVlZCB0byBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgaW5qZWN0b3IncyBwYXJlbnQgc28gREkgY2FuIGtlZXAgbG9va2luZyB1cFxuICogICAgLy8gdGhlIGluamVjdG9yIHRyZWUgdW50aWwgaXQgZmluZHMgdGhlIGRlcGVuZGVuY3kgaXQncyBsb29raW5nIGZvci5cbiAqICAgIFtQQVJFTlRfSU5KRUNUT1JdOiBudW1iZXI7XG4gKiB9XG4gKlxuICogZXhwb3J0IGludGVyZmFjZSBUSW5qZWN0b3IgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAwLTMxICAoSURzIGFyZSAlIEJMT09NX1NJWkUpXG4gKiAgICBbMF06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAzMi02M1xuICogICAgWzFdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgNjQtOTVcbiAqICAgIFsyXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDk2LTEyN1xuICogICAgWzNdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTI4LTE1OVxuICogICAgWzRdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTYwIC0gMTkxXG4gKiAgICBbNV06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAxOTIgLSAyMjNcbiAqICAgIFs2XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDIyNCAtIDI1NVxuICogICAgWzddOiBudW1iZXI7XG4gKlxuICogICAgLy8gTmVjZXNzYXJ5IHRvIGZpbmQgZGlyZWN0aXZlIGluZGljZXMgZm9yIGEgcGFydGljdWxhciBub2RlLlxuICogICAgW1ROT0RFXTogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZTtcbiAqICB9XG4gKi9cblxuLyoqXG4qIEZhY3RvcnkgZm9yIGNyZWF0aW5nIGluc3RhbmNlcyBvZiBpbmplY3RvcnMgaW4gdGhlIE5vZGVJbmplY3Rvci5cbipcbiogVGhpcyBmYWN0b3J5IGlzIGNvbXBsaWNhdGVkIGJ5IHRoZSBmYWN0IHRoYXQgaXQgY2FuIHJlc29sdmUgYG11bHRpYCBmYWN0b3JpZXMgYXMgd2VsbC5cbipcbiogTk9URTogU29tZSBvZiB0aGUgZmllbGRzIGFyZSBvcHRpb25hbCB3aGljaCBtZWFucyB0aGF0IHRoaXMgY2xhc3MgaGFzIHR3byBoaWRkZW4gY2xhc3Nlcy5cbiogLSBPbmUgd2l0aG91dCBgbXVsdGlgIHN1cHBvcnQgKG1vc3QgY29tbW9uKVxuKiAtIE9uZSB3aXRoIGBtdWx0aWAgdmFsdWVzLCAocmFyZSkuXG4qXG4qIFNpbmNlIFZNcyBjYW4gY2FjaGUgdXAgdG8gNCBpbmxpbmUgaGlkZGVuIGNsYXNzZXMgdGhpcyBpcyBPSy5cbipcbiogLSBTaW5nbGUgZmFjdG9yeTogT25seSBgcmVzb2x2aW5nYCBhbmQgYGZhY3RvcnlgIGlzIGRlZmluZWQuXG4qIC0gYHByb3ZpZGVyc2AgZmFjdG9yeTogYGNvbXBvbmVudFByb3ZpZGVyc2AgaXMgYSBudW1iZXIgYW5kIGBpbmRleCA9IC0xYC5cbiogLSBgdmlld1Byb3ZpZGVyc2AgZmFjdG9yeTogYGNvbXBvbmVudFByb3ZpZGVyc2AgaXMgYSBudW1iZXIgYW5kIGBpbmRleGAgcG9pbnRzIHRvIGBwcm92aWRlcnNgLlxuKi9cbmV4cG9ydCBjbGFzcyBOb2RlSW5qZWN0b3JGYWN0b3J5IHtcbiAgLyoqXG4gICAqIFRoZSBpbmplY3QgaW1wbGVtZW50YXRpb24gdG8gYmUgYWN0aXZhdGVkIHdoZW4gdXNpbmcgdGhlIGZhY3RvcnkuXG4gICAqL1xuICBpbmplY3RJbXBsOiBudWxsfCg8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncykgPT4gVCk7XG5cbiAgLyoqXG4gICAqIE1hcmtlciBzZXQgdG8gdHJ1ZSBkdXJpbmcgZmFjdG9yeSBpbnZvY2F0aW9uIHRvIHNlZSBpZiB3ZSBnZXQgaW50byByZWN1cnNpdmUgbG9vcC5cbiAgICogUmVjdXJzaXZlIGxvb3AgY2F1c2VzIGFuIGVycm9yIHRvIGJlIGRpc3BsYXllZC5cbiAgICovXG4gIHJlc29sdmluZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGF0IHRoZSB0b2tlbiBjYW4gc2VlIG90aGVyIFRva2VucyBkZWNsYXJlZCBpbiBgdmlld1Byb3ZpZGVyc2Agb24gdGhlIHNhbWUgbm9kZS5cbiAgICovXG4gIGNhblNlZVZpZXdQcm92aWRlcnM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGZhY3RvcmllcyB0byB1c2UgaW4gY2FzZSBvZiBgbXVsdGlgIHByb3ZpZGVyLlxuICAgKi9cbiAgbXVsdGk/OiBBcnJheTwoKSA9PiBhbnk+O1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgYG11bHRpYC1wcm92aWRlcnMgd2hpY2ggYmVsb25nIHRvIHRoZSBjb21wb25lbnQuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugd2hlbiBtdWx0aXBsZSBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIGRlY2xhcmUgdGhlIGBtdWx0aWAgcHJvdmlkZXJcbiAgICogdGhleSBoYXZlIHRvIGJlIGNvbmNhdGVuYXRlZCBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogSWYgd2UgaGF2ZSBhIGNvbXBvbmVudCBhbmQgZGlyZWN0aXZlIGFjdGl2ZSBhbiBhIHNpbmdsZSBlbGVtZW50IGFzIGRlY2xhcmVkIGhlcmVcbiAgICogYGBgXG4gICAqIGNvbXBvbmVudDpcbiAgICogICBwcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2NvbXBvbmVudCcsIG11bHRpOiB0cnVlfSBdLFxuICAgKiAgIHZpZXdQcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2NvbXBvbmVudFZpZXcnLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICpcbiAgICogZGlyZWN0aXZlOlxuICAgKiAgIHByb3ZpZGVzOiBbIHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiAnZGlyZWN0aXZlJywgbXVsdGk6IHRydWV9IF0sXG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGVuIHRoZSBleHBlY3RlZCByZXN1bHRzIGFyZTpcbiAgICpcbiAgICogYGBgXG4gICAqIHByb3ZpZGVyczogWydjb21wb25lbnQnLCAnZGlyZWN0aXZlJ11cbiAgICogdmlld1Byb3ZpZGVyczogWydjb21wb25lbnQnLCAnY29tcG9uZW50VmlldycsICdkaXJlY3RpdmUnXVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhlIHdheSB0byB0aGluayBhYm91dCBpdCBpcyB0aGF0IHRoZSBgdmlld1Byb3ZpZGVyc2AgaGF2ZSBiZWVuIGluc2VydGVkIGFmdGVyIHRoZSBjb21wb25lbnRcbiAgICogYnV0IGJlZm9yZSB0aGUgZGlyZWN0aXZlcywgd2hpY2ggaXMgd2h5IHdlIG5lZWQgdG8ga25vdyBob3cgbWFueSBgbXVsdGlgcyBoYXZlIGJlZW4gZGVjbGFyZWQgYnlcbiAgICogdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGNvbXBvbmVudFByb3ZpZGVycz86IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBpbmRleCBvZiB0aGUgRmFjdG9yeSBpbiB0aGUgYGRhdGFgLiBOZWVkZWQgZm9yIGB2aWV3UHJvdmlkZXJzYCBhbmQgYHByb3ZpZGVyc2AgbWVyZ2luZy5cbiAgICogU2VlIGBwcm92aWRlckZhY3RvcnlgLlxuICAgKi9cbiAgaW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEJlY2F1c2UgdGhlIHNhbWUgYG11bHRpYCBwcm92aWRlciBjYW4gYmUgZGVjbGFyZWQgaW4gYHByb3ZpZGVzYCBhbmQgYHZpZXdQcm92aWRlc2AgaXQgaXNcbiAgICogcG9zc2libGUgZm9yIGB2aWV3UHJvdmlkZXNgIHRvIHNoYWRvdyB0aGUgYHByb3ZpZGVzYC4gRm9yIHRoaXMgcmVhc29uIHdlIHN0b3JlIHRoZVxuICAgKiBgcHJvdmlkZUZhY3RvcnlgIG9mIHRoZSBgcHJvdmlkZXJzYCBzbyB0aGF0IGBwcm92aWRlcnNgIGNhbiBiZSBleHRlbmRlZCB3aXRoIGB2aWV3UHJvdmlkZXJzYC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogR2l2ZW46XG4gICAqIGBgYFxuICAgKiBwcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2FsbCcsIG11bHRpOiB0cnVlfSBdLFxuICAgKiB2aWV3UHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICd2aWV3T25seScsIG11bHRpOiB0cnVlfSBdLFxuICAgKiBgYGBcbiAgICpcbiAgICogV2UgaGF2ZSB0byByZXR1cm4gYFsnYWxsJ11gIGluIGNhc2Ugb2YgY29udGVudCBpbmplY3Rpb24sIGJ1dCBgWydhbGwnLCAndmlld09ubHknXWAgaW4gY2FzZVxuICAgKiBvZiB2aWV3IGluamVjdGlvbi4gV2UgZnVydGhlciBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBzaGFyZWQgaW5zdGFuY2VzIChpbiBvdXIgY2FzZVxuICAgKiBgYWxsYCkgYXJlIHRoZSBleGFjdCBzYW1lIGluc3RhbmNlIGluIGJvdGggdGhlIGNvbnRlbnQgYXMgd2VsbCBhcyB0aGUgdmlldyBpbmplY3Rpb24uIChXZVxuICAgKiBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIGRvbid0IGRvdWJsZSBpbnN0YW50aWF0ZS4pIEZvciB0aGlzIHJlYXNvbiB0aGUgYHZpZXdQcm92aWRlc2BcbiAgICogYEZhY3RvcnlgIGhhcyBhIHBvaW50ZXIgdG8gdGhlIHNoYWRvd2VkIGBwcm92aWRlc2AgZmFjdG9yeSBzbyB0aGF0IGl0IGNhbiBpbnN0YW50aWF0ZSB0aGVcbiAgICogYHByb3ZpZGVyc2AgKGBbJ2FsbCddYCkgYW5kIHRoZW4gZXh0ZW5kIGl0IHdpdGggYHZpZXdQcm92aWRlcnNgIChgWydhbGwnXSArIFsndmlld09ubHknXSA9XG4gICAqIFsnYWxsJywgJ3ZpZXdPbmx5J11gKS5cbiAgICovXG4gIHByb3ZpZGVyRmFjdG9yeT86IE5vZGVJbmplY3RvckZhY3Rvcnl8bnVsbDtcblxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqXG4gICAgICAgKiBGYWN0b3J5IHRvIGludm9rZSBpbiBvcmRlciB0byBjcmVhdGUgYSBuZXcgaW5zdGFuY2UuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBmYWN0b3J5OlxuICAgICAgICAgICh0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLFxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogYXJyYXkgd2hlcmUgaW5qZWN0YWJsZXMgdG9rZW5zIGFyZSBzdG9yZWQuIFRoaXMgaXMgdXNlZCBpblxuICAgICAgICAgICAgKiBjYXNlIG9mIGFuIGVycm9yIHJlcG9ydGluZyB0byBwcm9kdWNlIGZyaWVuZGxpZXIgZXJyb3JzLlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgdERhdGE6IFREYXRhLFxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogYXJyYXkgd2hlcmUgZXhpc3RpbmcgaW5zdGFuY2VzIG9mIGluamVjdGFibGVzIGFyZSBzdG9yZWQuIFRoaXMgaXMgdXNlZCBpbiBjYXNlXG4gICAgICAgICAgICAqIG9mIG11bHRpIHNoYWRvdyBpcyBuZWVkZWQuIFNlZSBgbXVsdGlgIGZpZWxkIGRvY3VtZW50YXRpb24uXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICBsRGF0YTogTFZpZXdEYXRhLFxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogVGhlIFROb2RlIG9mIHRoZSBzYW1lIGVsZW1lbnQgaW5qZWN0b3IuXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICB0Tm9kZTogVEVsZW1lbnROb2RlKSA9PiBhbnksXG4gICAgICAvKipcbiAgICAgICAqIFNldCB0byBgdHJ1ZWAgaWYgdGhlIHRva2VuIGlzIGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCAob3IgaWYgaXQgaXMgY29tcG9uZW50KS5cbiAgICAgICAqL1xuICAgICAgaXNWaWV3UHJvdmlkZXI6IGJvb2xlYW4sXG4gICAgICBpbmplY3RJbXBsZW1lbnRhdGlvbjogbnVsbHwoPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpID0+IFQpKSB7XG4gICAgdGhpcy5jYW5TZWVWaWV3UHJvdmlkZXJzID0gaXNWaWV3UHJvdmlkZXI7XG4gICAgdGhpcy5pbmplY3RJbXBsID0gaW5qZWN0SW1wbGVtZW50YXRpb247XG4gIH1cbn1cblxuY29uc3QgRmFjdG9yeVByb3RvdHlwZSA9IE5vZGVJbmplY3RvckZhY3RvcnkucHJvdG90eXBlO1xuZXhwb3J0IGZ1bmN0aW9uIGlzRmFjdG9yeShvYmo6IGFueSk6IG9iaiBpcyBOb2RlSW5qZWN0b3JGYWN0b3J5IHtcbiAgLy8gU2VlOiBodHRwczovL2pzcGVyZi5jb20vaW5zdGFuY2VvZi12cy1nZXRwcm90b3R5cGVvZlxuICByZXR1cm4gb2JqICE9IG51bGwgJiYgdHlwZW9mIG9iaiA9PSAnb2JqZWN0JyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSA9PSBGYWN0b3J5UHJvdG90eXBlO1xufVxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19