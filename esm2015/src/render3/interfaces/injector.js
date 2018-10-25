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
    ViewOffsetShift: 15,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBY0EsYUFBYSxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUN2QixhQUFhLGVBQWUsR0FBRyxDQUFDLENBQUM7O0FBQ2pDLGFBQWEsYUFBYSxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7OztJQVc3Qix3QkFBcUM7SUFDckMsbUJBQW9CO0lBQ3BCLGFBQWM7Ozs7QUFHaEIsYUFBYSxrQkFBa0IscUJBQTZCLENBQUMsQ0FBUSxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUd0RSxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFtRjlCLFlBSVc7OztJQW1CUCxjQUF1QixFQUN2QixvQkFBMkY7UUFwQnBGLFlBQU8sR0FBUCxPQUFPOzs7OztRQTdFbEIsaUJBQVksS0FBSyxDQUFDO1FBa0doQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsY0FBYyxDQUFDO1FBQzFDLElBQUksQ0FBQyxVQUFVLEdBQUcsb0JBQW9CLENBQUM7S0FDeEM7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUM7Ozs7O0FBQ3ZELE1BQU0sVUFBVSxTQUFTLENBQUMsR0FBUTs7SUFFaEMsT0FBTyxHQUFHLElBQUksSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO0NBQ2hHOztBQUlELGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7VEVsZW1lbnROb2RlfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtMVmlld0RhdGEsIFREYXRhfSBmcm9tICcuL3ZpZXcnO1xuXG5leHBvcnQgY29uc3QgVE5PREUgPSA4O1xuZXhwb3J0IGNvbnN0IFBBUkVOVF9JTkpFQ1RPUiA9IDg7XG5leHBvcnQgY29uc3QgSU5KRUNUT1JfU0laRSA9IDk7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHJlbGF0aXZlIGxvY2F0aW9uIG9mIHBhcmVudCBpbmplY3Rvci5cbiAqXG4gKiBUaGUgaW50ZXJmYWNlcyBlbmNvZGVzIG51bWJlciBvZiBwYXJlbnRzIGBMVmlld0RhdGFgcyB0byB0cmF2ZXJzZSBhbmQgaW5kZXggaW4gdGhlIGBMVmlld0RhdGFgXG4gKiBwb2ludGluZyB0byB0aGUgcGFyZW50IGluamVjdG9yLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7IF9fYnJhbmRfXzogJ1JlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzJzsgfVxuXG5leHBvcnQgY29uc3QgZW51bSBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncyB7XG4gIEluamVjdG9ySW5kZXhNYXNrID0gMGIxMTExMTExMTExMTExMTEsXG4gIFZpZXdPZmZzZXRTaGlmdCA9IDE1LFxuICBOT19QQVJFTlQgPSAtMSxcbn1cblxuZXhwb3J0IGNvbnN0IE5PX1BBUkVOVF9JTkpFQ1RPUjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gLTEgYXMgYW55O1xuXG4vKipcbiAqIEVhY2ggaW5qZWN0b3IgaXMgc2F2ZWQgaW4gOSBjb250aWd1b3VzIHNsb3RzIGluIGBMVmlld0RhdGFgIGFuZCA5IGNvbnRpZ3VvdXMgc2xvdHMgaW5cbiAqIGBUVmlldy5kYXRhYC4gVGhpcyBhbGxvd3MgdXMgdG8gc3RvcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgbm9kZSdzIHRva2VucyAod2hpY2hcbiAqIGNhbiBiZSBzaGFyZWQgaW4gYFRWaWV3YCkgYXMgd2VsbCBhcyB0aGUgdG9rZW5zIG9mIGl0cyBhbmNlc3RvciBub2RlcyAod2hpY2ggY2Fubm90IGJlXG4gKiBzaGFyZWQsIHNvIHRoZXkgbGl2ZSBpbiBgTFZpZXdEYXRhYCkuXG4gKlxuICogRWFjaCBvZiB0aGVzZSBzbG90cyAoYXNpZGUgZnJvbSB0aGUgbGFzdCBzbG90KSBjb250YWlucyBhIGJsb29tIGZpbHRlci4gVGhpcyBibG9vbSBmaWx0ZXJcbiAqIGRldGVybWluZXMgd2hldGhlciBhIGRpcmVjdGl2ZSBpcyBhdmFpbGFibGUgb24gdGhlIGFzc29jaWF0ZWQgbm9kZSBvciBub3QuIFRoaXMgcHJldmVudHMgdXNcbiAqIGZyb20gc2VhcmNoaW5nIHRoZSBkaXJlY3RpdmVzIGFycmF5IGF0IHRoaXMgbGV2ZWwgdW5sZXNzIGl0J3MgcHJvYmFibGUgdGhlIGRpcmVjdGl2ZSBpcyBpbiBpdC5cbiAqXG4gKiBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jsb29tX2ZpbHRlciBmb3IgbW9yZSBhYm91dCBibG9vbSBmaWx0ZXJzLlxuICpcbiAqIEJlY2F1c2UgYWxsIGluamVjdG9ycyBoYXZlIGJlZW4gZmxhdHRlbmVkIGludG8gYExWaWV3RGF0YWAgYW5kIGBUVmlld0RhdGFgLCB0aGV5IGNhbm5vdCB0eXBlZFxuICogdXNpbmcgaW50ZXJmYWNlcyBhcyB0aGV5IHdlcmUgcHJldmlvdXNseS4gVGhlIHN0YXJ0IGluZGV4IG9mIGVhY2ggYExJbmplY3RvcmAgYW5kIGBUSW5qZWN0b3JgXG4gKiB3aWxsIGRpZmZlciBiYXNlZCBvbiB3aGVyZSBpdCBpcyBmbGF0dGVuZWQgaW50byB0aGUgbWFpbiBhcnJheSwgc28gaXQncyBub3QgcG9zc2libGUgdG8ga25vd1xuICogdGhlIGluZGljZXMgYWhlYWQgb2YgdGltZSBhbmQgc2F2ZSB0aGVpciB0eXBlcyBoZXJlLiBUaGUgaW50ZXJmYWNlcyBhcmUgc3RpbGwgaW5jbHVkZWQgaGVyZVxuICogZm9yIGRvY3VtZW50YXRpb24gcHVycG9zZXMuXG4gKlxuICogZXhwb3J0IGludGVyZmFjZSBMSW5qZWN0b3IgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDAtMzEgIChJRHMgYXJlICUgQkxPT01fU0laRSlcbiAqICAgIFswXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMzItNjNcbiAqICAgIFsxXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgNjQtOTVcbiAqICAgIFsyXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgOTYtMTI3XG4gKiAgICBbM106IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDEyOC0xNTlcbiAqICAgIFs0XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTYwIC0gMTkxXG4gKiAgICBbNV06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDE5MiAtIDIyM1xuICogICAgWzZdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAyMjQgLSAyNTVcbiAqICAgIFs3XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFdlIG5lZWQgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGluamVjdG9yJ3MgcGFyZW50IHNvIERJIGNhbiBrZWVwIGxvb2tpbmcgdXBcbiAqICAgIC8vIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIGl0IGZpbmRzIHRoZSBkZXBlbmRlbmN5IGl0J3MgbG9va2luZyBmb3IuXG4gKiAgICBbUEFSRU5UX0lOSkVDVE9SXTogbnVtYmVyO1xuICogfVxuICpcbiAqIGV4cG9ydCBpbnRlcmZhY2UgVEluamVjdG9yIGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMC0zMSAgKElEcyBhcmUgJSBCTE9PTV9TSVpFKVxuICogICAgWzBdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMzItNjNcbiAqICAgIFsxXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDY0LTk1XG4gKiAgICBbMl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA5Ni0xMjdcbiAqICAgIFszXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDEyOC0xNTlcbiAqICAgIFs0XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDE2MCAtIDE5MVxuICogICAgWzVdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTkyIC0gMjIzXG4gKiAgICBbNl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAyMjQgLSAyNTVcbiAqICAgIFs3XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIE5lY2Vzc2FyeSB0byBmaW5kIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBhIHBhcnRpY3VsYXIgbm9kZS5cbiAqICAgIFtUTk9ERV06IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGU7XG4gKiAgfVxuICovXG5cbi8qKlxuKiBGYWN0b3J5IGZvciBjcmVhdGluZyBpbnN0YW5jZXMgb2YgaW5qZWN0b3JzIGluIHRoZSBOb2RlSW5qZWN0b3IuXG4qXG4qIFRoaXMgZmFjdG9yeSBpcyBjb21wbGljYXRlZCBieSB0aGUgZmFjdCB0aGF0IGl0IGNhbiByZXNvbHZlIGBtdWx0aWAgZmFjdG9yaWVzIGFzIHdlbGwuXG4qXG4qIE5PVEU6IFNvbWUgb2YgdGhlIGZpZWxkcyBhcmUgb3B0aW9uYWwgd2hpY2ggbWVhbnMgdGhhdCB0aGlzIGNsYXNzIGhhcyB0d28gaGlkZGVuIGNsYXNzZXMuXG4qIC0gT25lIHdpdGhvdXQgYG11bHRpYCBzdXBwb3J0IChtb3N0IGNvbW1vbilcbiogLSBPbmUgd2l0aCBgbXVsdGlgIHZhbHVlcywgKHJhcmUpLlxuKlxuKiBTaW5jZSBWTXMgY2FuIGNhY2hlIHVwIHRvIDQgaW5saW5lIGhpZGRlbiBjbGFzc2VzIHRoaXMgaXMgT0suXG4qXG4qIC0gU2luZ2xlIGZhY3Rvcnk6IE9ubHkgYHJlc29sdmluZ2AgYW5kIGBmYWN0b3J5YCBpcyBkZWZpbmVkLlxuKiAtIGBwcm92aWRlcnNgIGZhY3Rvcnk6IGBjb21wb25lbnRQcm92aWRlcnNgIGlzIGEgbnVtYmVyIGFuZCBgaW5kZXggPSAtMWAuXG4qIC0gYHZpZXdQcm92aWRlcnNgIGZhY3Rvcnk6IGBjb21wb25lbnRQcm92aWRlcnNgIGlzIGEgbnVtYmVyIGFuZCBgaW5kZXhgIHBvaW50cyB0byBgcHJvdmlkZXJzYC5cbiovXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yRmFjdG9yeSB7XG4gIC8qKlxuICAgKiBUaGUgaW5qZWN0IGltcGxlbWVudGF0aW9uIHRvIGJlIGFjdGl2YXRlZCB3aGVuIHVzaW5nIHRoZSBmYWN0b3J5LlxuICAgKi9cbiAgaW5qZWN0SW1wbDogbnVsbHwoPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpID0+IFQpO1xuXG4gIC8qKlxuICAgKiBNYXJrZXIgc2V0IHRvIHRydWUgZHVyaW5nIGZhY3RvcnkgaW52b2NhdGlvbiB0byBzZWUgaWYgd2UgZ2V0IGludG8gcmVjdXJzaXZlIGxvb3AuXG4gICAqIFJlY3Vyc2l2ZSBsb29wIGNhdXNlcyBhbiBlcnJvciB0byBiZSBkaXNwbGF5ZWQuXG4gICAqL1xuICByZXNvbHZpbmcgPSBmYWxzZTtcblxuICAvKipcbiAgICogTWFya3MgdGhhdCB0aGUgdG9rZW4gY2FuIHNlZSBvdGhlciBUb2tlbnMgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIG9uIHRoZSBzYW1lIG5vZGUuXG4gICAqL1xuICBjYW5TZWVWaWV3UHJvdmlkZXJzOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBmYWN0b3JpZXMgdG8gdXNlIGluIGNhc2Ugb2YgYG11bHRpYCBwcm92aWRlci5cbiAgICovXG4gIG11bHRpPzogQXJyYXk8KCkgPT4gYW55PjtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIGBtdWx0aWAtcHJvdmlkZXJzIHdoaWNoIGJlbG9uZyB0byB0aGUgY29tcG9uZW50LlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHdoZW4gbXVsdGlwbGUgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBkZWNsYXJlIHRoZSBgbXVsdGlgIHByb3ZpZGVyXG4gICAqIHRoZXkgaGF2ZSB0byBiZSBjb25jYXRlbmF0ZWQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqXG4gICAqIElmIHdlIGhhdmUgYSBjb21wb25lbnQgYW5kIGRpcmVjdGl2ZSBhY3RpdmUgYW4gYSBzaW5nbGUgZWxlbWVudCBhcyBkZWNsYXJlZCBoZXJlXG4gICAqIGBgYFxuICAgKiBjb21wb25lbnQ6XG4gICAqICAgcHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICdjb21wb25lbnQnLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICogICB2aWV3UHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICdjb21wb25lbnRWaWV3JywgbXVsdGk6IHRydWV9IF0sXG4gICAqXG4gICAqIGRpcmVjdGl2ZTpcbiAgICogICBwcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2RpcmVjdGl2ZScsIG11bHRpOiB0cnVlfSBdLFxuICAgKiBgYGBcbiAgICpcbiAgICogVGhlbiB0aGUgZXhwZWN0ZWQgcmVzdWx0cyBhcmU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBwcm92aWRlcnM6IFsnY29tcG9uZW50JywgJ2RpcmVjdGl2ZSddXG4gICAqIHZpZXdQcm92aWRlcnM6IFsnY29tcG9uZW50JywgJ2NvbXBvbmVudFZpZXcnLCAnZGlyZWN0aXZlJ11cbiAgICogYGBgXG4gICAqXG4gICAqIFRoZSB3YXkgdG8gdGhpbmsgYWJvdXQgaXQgaXMgdGhhdCB0aGUgYHZpZXdQcm92aWRlcnNgIGhhdmUgYmVlbiBpbnNlcnRlZCBhZnRlciB0aGUgY29tcG9uZW50XG4gICAqIGJ1dCBiZWZvcmUgdGhlIGRpcmVjdGl2ZXMsIHdoaWNoIGlzIHdoeSB3ZSBuZWVkIHRvIGtub3cgaG93IG1hbnkgYG11bHRpYHMgaGF2ZSBiZWVuIGRlY2xhcmVkIGJ5XG4gICAqIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBjb21wb25lbnRQcm92aWRlcnM/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgaW5kZXggb2YgdGhlIEZhY3RvcnkgaW4gdGhlIGBkYXRhYC4gTmVlZGVkIGZvciBgdmlld1Byb3ZpZGVyc2AgYW5kIGBwcm92aWRlcnNgIG1lcmdpbmcuXG4gICAqIFNlZSBgcHJvdmlkZXJGYWN0b3J5YC5cbiAgICovXG4gIGluZGV4PzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBCZWNhdXNlIHRoZSBzYW1lIGBtdWx0aWAgcHJvdmlkZXIgY2FuIGJlIGRlY2xhcmVkIGluIGBwcm92aWRlc2AgYW5kIGB2aWV3UHJvdmlkZXNgIGl0IGlzXG4gICAqIHBvc3NpYmxlIGZvciBgdmlld1Byb3ZpZGVzYCB0byBzaGFkb3cgdGhlIGBwcm92aWRlc2AuIEZvciB0aGlzIHJlYXNvbiB3ZSBzdG9yZSB0aGVcbiAgICogYHByb3ZpZGVGYWN0b3J5YCBvZiB0aGUgYHByb3ZpZGVyc2Agc28gdGhhdCBgcHJvdmlkZXJzYCBjYW4gYmUgZXh0ZW5kZWQgd2l0aCBgdmlld1Byb3ZpZGVyc2AuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqXG4gICAqIEdpdmVuOlxuICAgKiBgYGBcbiAgICogcHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICdhbGwnLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICogdmlld1Byb3ZpZGVzOiBbIHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiAndmlld09ubHknLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICogYGBgXG4gICAqXG4gICAqIFdlIGhhdmUgdG8gcmV0dXJuIGBbJ2FsbCddYCBpbiBjYXNlIG9mIGNvbnRlbnQgaW5qZWN0aW9uLCBidXQgYFsnYWxsJywgJ3ZpZXdPbmx5J11gIGluIGNhc2VcbiAgICogb2YgdmlldyBpbmplY3Rpb24uIFdlIGZ1cnRoZXIgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgc2hhcmVkIGluc3RhbmNlcyAoaW4gb3VyIGNhc2VcbiAgICogYGFsbGApIGFyZSB0aGUgZXhhY3Qgc2FtZSBpbnN0YW5jZSBpbiBib3RoIHRoZSBjb250ZW50IGFzIHdlbGwgYXMgdGhlIHZpZXcgaW5qZWN0aW9uLiAoV2VcbiAgICogaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBkb3VibGUgaW5zdGFudGlhdGUuKSBGb3IgdGhpcyByZWFzb24gdGhlIGB2aWV3UHJvdmlkZXNgXG4gICAqIGBGYWN0b3J5YCBoYXMgYSBwb2ludGVyIHRvIHRoZSBzaGFkb3dlZCBgcHJvdmlkZXNgIGZhY3Rvcnkgc28gdGhhdCBpdCBjYW4gaW5zdGFudGlhdGUgdGhlXG4gICAqIGBwcm92aWRlcnNgIChgWydhbGwnXWApIGFuZCB0aGVuIGV4dGVuZCBpdCB3aXRoIGB2aWV3UHJvdmlkZXJzYCAoYFsnYWxsJ10gKyBbJ3ZpZXdPbmx5J10gPVxuICAgKiBbJ2FsbCcsICd2aWV3T25seSddYCkuXG4gICAqL1xuICBwcm92aWRlckZhY3Rvcnk/OiBOb2RlSW5qZWN0b3JGYWN0b3J5fG51bGw7XG5cblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogRmFjdG9yeSB0byBpbnZva2UgaW4gb3JkZXIgdG8gY3JlYXRlIGEgbmV3IGluc3RhbmNlLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgZmFjdG9yeTpcbiAgICAgICAgICAodGhpczogTm9kZUluamVjdG9yRmFjdG9yeSwgXzogbnVsbCxcbiAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqIGFycmF5IHdoZXJlIGluamVjdGFibGVzIHRva2VucyBhcmUgc3RvcmVkLiBUaGlzIGlzIHVzZWQgaW5cbiAgICAgICAgICAgICogY2FzZSBvZiBhbiBlcnJvciByZXBvcnRpbmcgdG8gcHJvZHVjZSBmcmllbmRsaWVyIGVycm9ycy5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgIHREYXRhOiBURGF0YSxcbiAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqIGFycmF5IHdoZXJlIGV4aXN0aW5nIGluc3RhbmNlcyBvZiBpbmplY3RhYmxlcyBhcmUgc3RvcmVkLiBUaGlzIGlzIHVzZWQgaW4gY2FzZVxuICAgICAgICAgICAgKiBvZiBtdWx0aSBzaGFkb3cgaXMgbmVlZGVkLiBTZWUgYG11bHRpYCBmaWVsZCBkb2N1bWVudGF0aW9uLlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgbERhdGE6IExWaWV3RGF0YSxcbiAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqIFRoZSBUTm9kZSBvZiB0aGUgc2FtZSBlbGVtZW50IGluamVjdG9yLlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgdE5vZGU6IFRFbGVtZW50Tm9kZSkgPT4gYW55LFxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgdG8gYHRydWVgIGlmIHRoZSB0b2tlbiBpcyBkZWNsYXJlZCBpbiBgdmlld1Byb3ZpZGVyc2AgKG9yIGlmIGl0IGlzIGNvbXBvbmVudCkuXG4gICAgICAgKi9cbiAgICAgIGlzVmlld1Byb3ZpZGVyOiBib29sZWFuLFxuICAgICAgaW5qZWN0SW1wbGVtZW50YXRpb246IG51bGx8KDxUPih0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKSA9PiBUKSkge1xuICAgIHRoaXMuY2FuU2VlVmlld1Byb3ZpZGVycyA9IGlzVmlld1Byb3ZpZGVyO1xuICAgIHRoaXMuaW5qZWN0SW1wbCA9IGluamVjdEltcGxlbWVudGF0aW9uO1xuICB9XG59XG5cbmNvbnN0IEZhY3RvcnlQcm90b3R5cGUgPSBOb2RlSW5qZWN0b3JGYWN0b3J5LnByb3RvdHlwZTtcbmV4cG9ydCBmdW5jdGlvbiBpc0ZhY3Rvcnkob2JqOiBhbnkpOiBvYmogaXMgTm9kZUluamVjdG9yRmFjdG9yeSB7XG4gIC8vIFNlZTogaHR0cHM6Ly9qc3BlcmYuY29tL2luc3RhbmNlb2YtdnMtZ2V0cHJvdG90eXBlb2ZcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmIHR5cGVvZiBvYmogPT0gJ29iamVjdCcgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikgPT0gRmFjdG9yeVByb3RvdHlwZTtcbn1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==