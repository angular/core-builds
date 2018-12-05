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
export const INJECTOR_BLOOM_PARENT_SIZE = 9;
/**
 * Represents a relative location of parent injector.
 *
 * The interfaces encodes number of parents `LView`s to traverse and index in the `LView`
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBY0EsYUFBYSxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUN2QixhQUFhLGVBQWUsR0FBRyxDQUFDLENBQUM7O0FBQ2pDLGFBQWEsMEJBQTBCLEdBQUcsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7O0lBVzFDLHdCQUFxQztJQUNyQyx5QkFBdUM7SUFDdkMsbUJBQW9CO0lBQ3BCLGFBQWM7Ozs7QUFHaEIsYUFBYSxrQkFBa0IscUJBQTZCLENBQUMsQ0FBUSxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUd0RSxNQUFNLE9BQU8sbUJBQW1COzs7Ozs7SUFtRjlCLFlBSVc7OztJQW1CUCxjQUF1QixFQUN2QixvQkFBMkY7UUFwQnBGLFlBQU8sR0FBUCxPQUFPOzs7OztRQTdFbEIsaUJBQVksS0FBSyxDQUFDO1FBa0doQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsY0FBYyxDQUFDO1FBQzFDLElBQUksQ0FBQyxVQUFVLEdBQUcsb0JBQW9CLENBQUM7S0FDeEM7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUM7Ozs7O0FBQ3ZELE1BQU0sVUFBVSxTQUFTLENBQUMsR0FBUTs7SUFFaEMsT0FBTyxHQUFHLElBQUksSUFBSSxJQUFJLE9BQU8sR0FBRyxJQUFJLFFBQVEsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDO0NBQ2hHOztBQUlELGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtURWxlbWVudE5vZGV9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge0xWaWV3LCBURGF0YX0gZnJvbSAnLi92aWV3JztcblxuZXhwb3J0IGNvbnN0IFROT0RFID0gODtcbmV4cG9ydCBjb25zdCBQQVJFTlRfSU5KRUNUT1IgPSA4O1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFID0gOTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgcmVsYXRpdmUgbG9jYXRpb24gb2YgcGFyZW50IGluamVjdG9yLlxuICpcbiAqIFRoZSBpbnRlcmZhY2VzIGVuY29kZXMgbnVtYmVyIG9mIHBhcmVudHMgYExWaWV3YHMgdG8gdHJhdmVyc2UgYW5kIGluZGV4IGluIHRoZSBgTFZpZXdgXG4gKiBwb2ludGluZyB0byB0aGUgcGFyZW50IGluamVjdG9yLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7IF9fYnJhbmRfXzogJ1JlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzJzsgfVxuXG5leHBvcnQgY29uc3QgZW51bSBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncyB7XG4gIEluamVjdG9ySW5kZXhNYXNrID0gMGIxMTExMTExMTExMTExMTEsXG4gIEFjcm9zc0hvc3RCb3VuZGFyeSA9IDBiMTAwMDAwMDAwMDAwMDAwMCxcbiAgVmlld09mZnNldFNoaWZ0ID0gMTYsXG4gIE5PX1BBUkVOVCA9IC0xLFxufVxuXG5leHBvcnQgY29uc3QgTk9fUEFSRU5UX0lOSkVDVE9SOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24gPSAtMSBhcyBhbnk7XG5cbi8qKlxuICogRWFjaCBpbmplY3RvciBpcyBzYXZlZCBpbiA5IGNvbnRpZ3VvdXMgc2xvdHMgaW4gYExWaWV3YCBhbmQgOSBjb250aWd1b3VzIHNsb3RzIGluXG4gKiBgVFZpZXcuZGF0YWAuIFRoaXMgYWxsb3dzIHVzIHRvIHN0b3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IG5vZGUncyB0b2tlbnMgKHdoaWNoXG4gKiBjYW4gYmUgc2hhcmVkIGluIGBUVmlld2ApIGFzIHdlbGwgYXMgdGhlIHRva2VucyBvZiBpdHMgYW5jZXN0b3Igbm9kZXMgKHdoaWNoIGNhbm5vdCBiZVxuICogc2hhcmVkLCBzbyB0aGV5IGxpdmUgaW4gYExWaWV3YCkuXG4gKlxuICogRWFjaCBvZiB0aGVzZSBzbG90cyAoYXNpZGUgZnJvbSB0aGUgbGFzdCBzbG90KSBjb250YWlucyBhIGJsb29tIGZpbHRlci4gVGhpcyBibG9vbSBmaWx0ZXJcbiAqIGRldGVybWluZXMgd2hldGhlciBhIGRpcmVjdGl2ZSBpcyBhdmFpbGFibGUgb24gdGhlIGFzc29jaWF0ZWQgbm9kZSBvciBub3QuIFRoaXMgcHJldmVudHMgdXNcbiAqIGZyb20gc2VhcmNoaW5nIHRoZSBkaXJlY3RpdmVzIGFycmF5IGF0IHRoaXMgbGV2ZWwgdW5sZXNzIGl0J3MgcHJvYmFibGUgdGhlIGRpcmVjdGl2ZSBpcyBpbiBpdC5cbiAqXG4gKiBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jsb29tX2ZpbHRlciBmb3IgbW9yZSBhYm91dCBibG9vbSBmaWx0ZXJzLlxuICpcbiAqIEJlY2F1c2UgYWxsIGluamVjdG9ycyBoYXZlIGJlZW4gZmxhdHRlbmVkIGludG8gYExWaWV3YCBhbmQgYFRWaWV3RGF0YWAsIHRoZXkgY2Fubm90IHR5cGVkXG4gKiB1c2luZyBpbnRlcmZhY2VzIGFzIHRoZXkgd2VyZSBwcmV2aW91c2x5LiBUaGUgc3RhcnQgaW5kZXggb2YgZWFjaCBgTEluamVjdG9yYCBhbmQgYFRJbmplY3RvcmBcbiAqIHdpbGwgZGlmZmVyIGJhc2VkIG9uIHdoZXJlIGl0IGlzIGZsYXR0ZW5lZCBpbnRvIHRoZSBtYWluIGFycmF5LCBzbyBpdCdzIG5vdCBwb3NzaWJsZSB0byBrbm93XG4gKiB0aGUgaW5kaWNlcyBhaGVhZCBvZiB0aW1lIGFuZCBzYXZlIHRoZWlyIHR5cGVzIGhlcmUuIFRoZSBpbnRlcmZhY2VzIGFyZSBzdGlsbCBpbmNsdWRlZCBoZXJlXG4gKiBmb3IgZG9jdW1lbnRhdGlvbiBwdXJwb3Nlcy5cbiAqXG4gKiBleHBvcnQgaW50ZXJmYWNlIExJbmplY3RvciBleHRlbmRzIEFycmF5PGFueT4ge1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMC0zMSAgKElEcyBhcmUgJSBCTE9PTV9TSVpFKVxuICogICAgWzBdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAzMi02M1xuICogICAgWzFdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA2NC05NVxuICogICAgWzJdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyA5Ni0xMjdcbiAqICAgIFszXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTI4LTE1OVxuICogICAgWzRdOiBudW1iZXI7XG4gKlxuICogICAgLy8gQ3VtdWxhdGl2ZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAxNjAgLSAxOTFcbiAqICAgIFs1XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIEN1bXVsYXRpdmUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTkyIC0gMjIzXG4gKiAgICBbNl06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBDdW11bGF0aXZlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDIyNCAtIDI1NVxuICogICAgWzddOiBudW1iZXI7XG4gKlxuICogICAgLy8gV2UgbmVlZCB0byBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgaW5qZWN0b3IncyBwYXJlbnQgc28gREkgY2FuIGtlZXAgbG9va2luZyB1cFxuICogICAgLy8gdGhlIGluamVjdG9yIHRyZWUgdW50aWwgaXQgZmluZHMgdGhlIGRlcGVuZGVuY3kgaXQncyBsb29raW5nIGZvci5cbiAqICAgIFtQQVJFTlRfSU5KRUNUT1JdOiBudW1iZXI7XG4gKiB9XG4gKlxuICogZXhwb3J0IGludGVyZmFjZSBUSW5qZWN0b3IgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAwLTMxICAoSURzIGFyZSAlIEJMT09NX1NJWkUpXG4gKiAgICBbMF06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAzMi02M1xuICogICAgWzFdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgNjQtOTVcbiAqICAgIFsyXTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDk2LTEyN1xuICogICAgWzNdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTI4LTE1OVxuICogICAgWzRdOiBudW1iZXI7XG4gKlxuICogICAgLy8gU2hhcmVkIG5vZGUgYmxvb20gZm9yIGRpcmVjdGl2ZSBJRHMgMTYwIC0gMTkxXG4gKiAgICBbNV06IG51bWJlcjtcbiAqXG4gKiAgICAvLyBTaGFyZWQgbm9kZSBibG9vbSBmb3IgZGlyZWN0aXZlIElEcyAxOTIgLSAyMjNcbiAqICAgIFs2XTogbnVtYmVyO1xuICpcbiAqICAgIC8vIFNoYXJlZCBub2RlIGJsb29tIGZvciBkaXJlY3RpdmUgSURzIDIyNCAtIDI1NVxuICogICAgWzddOiBudW1iZXI7XG4gKlxuICogICAgLy8gTmVjZXNzYXJ5IHRvIGZpbmQgZGlyZWN0aXZlIGluZGljZXMgZm9yIGEgcGFydGljdWxhciBub2RlLlxuICogICAgW1ROT0RFXTogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZTtcbiAqICB9XG4gKi9cblxuLyoqXG4qIEZhY3RvcnkgZm9yIGNyZWF0aW5nIGluc3RhbmNlcyBvZiBpbmplY3RvcnMgaW4gdGhlIE5vZGVJbmplY3Rvci5cbipcbiogVGhpcyBmYWN0b3J5IGlzIGNvbXBsaWNhdGVkIGJ5IHRoZSBmYWN0IHRoYXQgaXQgY2FuIHJlc29sdmUgYG11bHRpYCBmYWN0b3JpZXMgYXMgd2VsbC5cbipcbiogTk9URTogU29tZSBvZiB0aGUgZmllbGRzIGFyZSBvcHRpb25hbCB3aGljaCBtZWFucyB0aGF0IHRoaXMgY2xhc3MgaGFzIHR3byBoaWRkZW4gY2xhc3Nlcy5cbiogLSBPbmUgd2l0aG91dCBgbXVsdGlgIHN1cHBvcnQgKG1vc3QgY29tbW9uKVxuKiAtIE9uZSB3aXRoIGBtdWx0aWAgdmFsdWVzLCAocmFyZSkuXG4qXG4qIFNpbmNlIFZNcyBjYW4gY2FjaGUgdXAgdG8gNCBpbmxpbmUgaGlkZGVuIGNsYXNzZXMgdGhpcyBpcyBPSy5cbipcbiogLSBTaW5nbGUgZmFjdG9yeTogT25seSBgcmVzb2x2aW5nYCBhbmQgYGZhY3RvcnlgIGlzIGRlZmluZWQuXG4qIC0gYHByb3ZpZGVyc2AgZmFjdG9yeTogYGNvbXBvbmVudFByb3ZpZGVyc2AgaXMgYSBudW1iZXIgYW5kIGBpbmRleCA9IC0xYC5cbiogLSBgdmlld1Byb3ZpZGVyc2AgZmFjdG9yeTogYGNvbXBvbmVudFByb3ZpZGVyc2AgaXMgYSBudW1iZXIgYW5kIGBpbmRleGAgcG9pbnRzIHRvIGBwcm92aWRlcnNgLlxuKi9cbmV4cG9ydCBjbGFzcyBOb2RlSW5qZWN0b3JGYWN0b3J5IHtcbiAgLyoqXG4gICAqIFRoZSBpbmplY3QgaW1wbGVtZW50YXRpb24gdG8gYmUgYWN0aXZhdGVkIHdoZW4gdXNpbmcgdGhlIGZhY3RvcnkuXG4gICAqL1xuICBpbmplY3RJbXBsOiBudWxsfCg8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncykgPT4gVCk7XG5cbiAgLyoqXG4gICAqIE1hcmtlciBzZXQgdG8gdHJ1ZSBkdXJpbmcgZmFjdG9yeSBpbnZvY2F0aW9uIHRvIHNlZSBpZiB3ZSBnZXQgaW50byByZWN1cnNpdmUgbG9vcC5cbiAgICogUmVjdXJzaXZlIGxvb3AgY2F1c2VzIGFuIGVycm9yIHRvIGJlIGRpc3BsYXllZC5cbiAgICovXG4gIHJlc29sdmluZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBNYXJrcyB0aGF0IHRoZSB0b2tlbiBjYW4gc2VlIG90aGVyIFRva2VucyBkZWNsYXJlZCBpbiBgdmlld1Byb3ZpZGVyc2Agb24gdGhlIHNhbWUgbm9kZS5cbiAgICovXG4gIGNhblNlZVZpZXdQcm92aWRlcnM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGZhY3RvcmllcyB0byB1c2UgaW4gY2FzZSBvZiBgbXVsdGlgIHByb3ZpZGVyLlxuICAgKi9cbiAgbXVsdGk/OiBBcnJheTwoKSA9PiBhbnk+O1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgYG11bHRpYC1wcm92aWRlcnMgd2hpY2ggYmVsb25nIHRvIHRoZSBjb21wb25lbnQuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugd2hlbiBtdWx0aXBsZSBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIGRlY2xhcmUgdGhlIGBtdWx0aWAgcHJvdmlkZXJcbiAgICogdGhleSBoYXZlIHRvIGJlIGNvbmNhdGVuYXRlZCBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogSWYgd2UgaGF2ZSBhIGNvbXBvbmVudCBhbmQgZGlyZWN0aXZlIGFjdGl2ZSBhbiBhIHNpbmdsZSBlbGVtZW50IGFzIGRlY2xhcmVkIGhlcmVcbiAgICogYGBgXG4gICAqIGNvbXBvbmVudDpcbiAgICogICBwcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2NvbXBvbmVudCcsIG11bHRpOiB0cnVlfSBdLFxuICAgKiAgIHZpZXdQcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2NvbXBvbmVudFZpZXcnLCBtdWx0aTogdHJ1ZX0gXSxcbiAgICpcbiAgICogZGlyZWN0aXZlOlxuICAgKiAgIHByb3ZpZGVzOiBbIHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiAnZGlyZWN0aXZlJywgbXVsdGk6IHRydWV9IF0sXG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGVuIHRoZSBleHBlY3RlZCByZXN1bHRzIGFyZTpcbiAgICpcbiAgICogYGBgXG4gICAqIHByb3ZpZGVyczogWydjb21wb25lbnQnLCAnZGlyZWN0aXZlJ11cbiAgICogdmlld1Byb3ZpZGVyczogWydjb21wb25lbnQnLCAnY29tcG9uZW50VmlldycsICdkaXJlY3RpdmUnXVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhlIHdheSB0byB0aGluayBhYm91dCBpdCBpcyB0aGF0IHRoZSBgdmlld1Byb3ZpZGVyc2AgaGF2ZSBiZWVuIGluc2VydGVkIGFmdGVyIHRoZSBjb21wb25lbnRcbiAgICogYnV0IGJlZm9yZSB0aGUgZGlyZWN0aXZlcywgd2hpY2ggaXMgd2h5IHdlIG5lZWQgdG8ga25vdyBob3cgbWFueSBgbXVsdGlgcyBoYXZlIGJlZW4gZGVjbGFyZWQgYnlcbiAgICogdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGNvbXBvbmVudFByb3ZpZGVycz86IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBpbmRleCBvZiB0aGUgRmFjdG9yeSBpbiB0aGUgYGRhdGFgLiBOZWVkZWQgZm9yIGB2aWV3UHJvdmlkZXJzYCBhbmQgYHByb3ZpZGVyc2AgbWVyZ2luZy5cbiAgICogU2VlIGBwcm92aWRlckZhY3RvcnlgLlxuICAgKi9cbiAgaW5kZXg/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEJlY2F1c2UgdGhlIHNhbWUgYG11bHRpYCBwcm92aWRlciBjYW4gYmUgZGVjbGFyZWQgaW4gYHByb3ZpZGVzYCBhbmQgYHZpZXdQcm92aWRlc2AgaXQgaXNcbiAgICogcG9zc2libGUgZm9yIGB2aWV3UHJvdmlkZXNgIHRvIHNoYWRvdyB0aGUgYHByb3ZpZGVzYC4gRm9yIHRoaXMgcmVhc29uIHdlIHN0b3JlIHRoZVxuICAgKiBgcHJvdmlkZUZhY3RvcnlgIG9mIHRoZSBgcHJvdmlkZXJzYCBzbyB0aGF0IGBwcm92aWRlcnNgIGNhbiBiZSBleHRlbmRlZCB3aXRoIGB2aWV3UHJvdmlkZXJzYC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogR2l2ZW46XG4gICAqIGBgYFxuICAgKiBwcm92aWRlczogWyB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogJ2FsbCcsIG11bHRpOiB0cnVlfSBdLFxuICAgKiB2aWV3UHJvdmlkZXM6IFsge3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6ICd2aWV3T25seScsIG11bHRpOiB0cnVlfSBdLFxuICAgKiBgYGBcbiAgICpcbiAgICogV2UgaGF2ZSB0byByZXR1cm4gYFsnYWxsJ11gIGluIGNhc2Ugb2YgY29udGVudCBpbmplY3Rpb24sIGJ1dCBgWydhbGwnLCAndmlld09ubHknXWAgaW4gY2FzZVxuICAgKiBvZiB2aWV3IGluamVjdGlvbi4gV2UgZnVydGhlciBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBzaGFyZWQgaW5zdGFuY2VzIChpbiBvdXIgY2FzZVxuICAgKiBgYWxsYCkgYXJlIHRoZSBleGFjdCBzYW1lIGluc3RhbmNlIGluIGJvdGggdGhlIGNvbnRlbnQgYXMgd2VsbCBhcyB0aGUgdmlldyBpbmplY3Rpb24uIChXZVxuICAgKiBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIGRvbid0IGRvdWJsZSBpbnN0YW50aWF0ZS4pIEZvciB0aGlzIHJlYXNvbiB0aGUgYHZpZXdQcm92aWRlc2BcbiAgICogYEZhY3RvcnlgIGhhcyBhIHBvaW50ZXIgdG8gdGhlIHNoYWRvd2VkIGBwcm92aWRlc2AgZmFjdG9yeSBzbyB0aGF0IGl0IGNhbiBpbnN0YW50aWF0ZSB0aGVcbiAgICogYHByb3ZpZGVyc2AgKGBbJ2FsbCddYCkgYW5kIHRoZW4gZXh0ZW5kIGl0IHdpdGggYHZpZXdQcm92aWRlcnNgIChgWydhbGwnXSArIFsndmlld09ubHknXSA9XG4gICAqIFsnYWxsJywgJ3ZpZXdPbmx5J11gKS5cbiAgICovXG4gIHByb3ZpZGVyRmFjdG9yeT86IE5vZGVJbmplY3RvckZhY3Rvcnl8bnVsbDtcblxuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqXG4gICAgICAgKiBGYWN0b3J5IHRvIGludm9rZSBpbiBvcmRlciB0byBjcmVhdGUgYSBuZXcgaW5zdGFuY2UuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBmYWN0b3J5OlxuICAgICAgICAgICh0aGlzOiBOb2RlSW5qZWN0b3JGYWN0b3J5LCBfOiBudWxsLFxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogYXJyYXkgd2hlcmUgaW5qZWN0YWJsZXMgdG9rZW5zIGFyZSBzdG9yZWQuIFRoaXMgaXMgdXNlZCBpblxuICAgICAgICAgICAgKiBjYXNlIG9mIGFuIGVycm9yIHJlcG9ydGluZyB0byBwcm9kdWNlIGZyaWVuZGxpZXIgZXJyb3JzLlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgdERhdGE6IFREYXRhLFxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogYXJyYXkgd2hlcmUgZXhpc3RpbmcgaW5zdGFuY2VzIG9mIGluamVjdGFibGVzIGFyZSBzdG9yZWQuIFRoaXMgaXMgdXNlZCBpbiBjYXNlXG4gICAgICAgICAgICAqIG9mIG11bHRpIHNoYWRvdyBpcyBuZWVkZWQuIFNlZSBgbXVsdGlgIGZpZWxkIGRvY3VtZW50YXRpb24uXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICBsVmlldzogTFZpZXcsXG4gICAgICAgICAgIC8qKlxuICAgICAgICAgICAgKiBUaGUgVE5vZGUgb2YgdGhlIHNhbWUgZWxlbWVudCBpbmplY3Rvci5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgIHROb2RlOiBURWxlbWVudE5vZGUpID0+IGFueSxcbiAgICAgIC8qKlxuICAgICAgICogU2V0IHRvIGB0cnVlYCBpZiB0aGUgdG9rZW4gaXMgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIChvciBpZiBpdCBpcyBjb21wb25lbnQpLlxuICAgICAgICovXG4gICAgICBpc1ZpZXdQcm92aWRlcjogYm9vbGVhbixcbiAgICAgIGluamVjdEltcGxlbWVudGF0aW9uOiBudWxsfCg8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncykgPT4gVCkpIHtcbiAgICB0aGlzLmNhblNlZVZpZXdQcm92aWRlcnMgPSBpc1ZpZXdQcm92aWRlcjtcbiAgICB0aGlzLmluamVjdEltcGwgPSBpbmplY3RJbXBsZW1lbnRhdGlvbjtcbiAgfVxufVxuXG5jb25zdCBGYWN0b3J5UHJvdG90eXBlID0gTm9kZUluamVjdG9yRmFjdG9yeS5wcm90b3R5cGU7XG5leHBvcnQgZnVuY3Rpb24gaXNGYWN0b3J5KG9iajogYW55KTogb2JqIGlzIE5vZGVJbmplY3RvckZhY3Rvcnkge1xuICAvLyBTZWU6IGh0dHBzOi8vanNwZXJmLmNvbS9pbnN0YW5jZW9mLXZzLWdldHByb3RvdHlwZW9mXG4gIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09ICdvYmplY3QnICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopID09IEZhY3RvcnlQcm90b3R5cGU7XG59XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=