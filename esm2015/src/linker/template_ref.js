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
import { R3_TEMPLATE_REF_FACTORY } from '../ivy_switch/runtime/index';
import { ElementRef } from './element_ref';
/**
 * Represents an embedded template that can be used to instantiate embedded views.
 * To instantiate embedded views based on a template, use the `ViewContainerRef`
 * method `createEmbeddedView()`.
 *
 * Access a `TemplateRef` instance by placing a directive on an `<ng-template>`
 * element (or directive prefixed with `*`). The `TemplateRef` for the embedded view
 * is injected into the constructor of the directive,
 * using the `TemplateRef` token.
 *
 * You can also use a `Query` to find a `TemplateRef` associated with
 * a component or a directive.
 *
 * @see `ViewContainerRef`
 * @see [Navigate the Component Tree with DI](guide/dependency-injection-navtree)
 *
 * @abstract
 * @template C
 */
export class TemplateRef {
}
/**
 * \@internal
 */
TemplateRef.__NG_ELEMENT_ID__ = () => R3_TEMPLATE_REF_FACTORY(TemplateRef, ElementRef);
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    TemplateRef.__NG_ELEMENT_ID__;
    /**
     * The anchor element in the parent view for this embedded view.
     *
     * The data-binding and injection contexts of embedded views created from this `TemplateRef`
     * inherit from the contexts of this location.
     *
     * Typically new embedded views are attached to the view container of this location, but in
     * advanced use-cases, the view can be attached to a different container while keeping the
     * data-binding and injection context from the original location.
     *
     * @abstract
     * @return {?}
     */
    TemplateRef.prototype.elementRef = function () { };
    /**
     * Creates a view object and attaches it to the view container of the parent view.
     * @abstract
     * @param {?} context The context for the new view, inherited from the anchor element.
     * @return {?} The new view object.
     */
    TemplateRef.prototype.createEmbeddedView = function (context) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3RlbXBsYXRlX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRXBFLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJ6QyxNQUFNLE9BQWdCLFdBQVc7Ozs7O0FBdUIvQixnQ0FDNkIsR0FBRyxFQUFFLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzX1RFTVBMQVRFX1JFRl9GQUNUT1JZfSBmcm9tICcuLi9pdnlfc3dpdGNoL3J1bnRpbWUvaW5kZXgnO1xuXG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJy4vZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGluc3RhbnRpYXRlIGVtYmVkZGVkIHZpZXdzLlxuICogVG8gaW5zdGFudGlhdGUgZW1iZWRkZWQgdmlld3MgYmFzZWQgb24gYSB0ZW1wbGF0ZSwgdXNlIHRoZSBgVmlld0NvbnRhaW5lclJlZmBcbiAqIG1ldGhvZCBgY3JlYXRlRW1iZWRkZWRWaWV3KClgLlxuICpcbiAqIEFjY2VzcyBhIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2UgYnkgcGxhY2luZyBhIGRpcmVjdGl2ZSBvbiBhbiBgPG5nLXRlbXBsYXRlPmBcbiAqIGVsZW1lbnQgKG9yIGRpcmVjdGl2ZSBwcmVmaXhlZCB3aXRoIGAqYCkuIFRoZSBgVGVtcGxhdGVSZWZgIGZvciB0aGUgZW1iZWRkZWQgdmlld1xuICogaXMgaW5qZWN0ZWQgaW50byB0aGUgY29uc3RydWN0b3Igb2YgdGhlIGRpcmVjdGl2ZSxcbiAqIHVzaW5nIHRoZSBgVGVtcGxhdGVSZWZgIHRva2VuLlxuICpcbiAqIFlvdSBjYW4gYWxzbyB1c2UgYSBgUXVlcnlgIHRvIGZpbmQgYSBgVGVtcGxhdGVSZWZgIGFzc29jaWF0ZWQgd2l0aFxuICogYSBjb21wb25lbnQgb3IgYSBkaXJlY3RpdmUuXG4gKlxuICogQHNlZSBgVmlld0NvbnRhaW5lclJlZmBcbiAqIEBzZWUgW05hdmlnYXRlIHRoZSBDb21wb25lbnQgVHJlZSB3aXRoIERJXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbi1uYXZ0cmVlKVxuICpcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRlbXBsYXRlUmVmPEM+IHtcbiAgLyoqXG4gICAqIFRoZSBhbmNob3IgZWxlbWVudCBpbiB0aGUgcGFyZW50IHZpZXcgZm9yIHRoaXMgZW1iZWRkZWQgdmlldy5cbiAgICpcbiAgICogVGhlIGRhdGEtYmluZGluZyBhbmQgaW5qZWN0aW9uIGNvbnRleHRzIG9mIGVtYmVkZGVkIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGlzIGBUZW1wbGF0ZVJlZmBcbiAgICogaW5oZXJpdCBmcm9tIHRoZSBjb250ZXh0cyBvZiB0aGlzIGxvY2F0aW9uLlxuICAgKlxuICAgKiBUeXBpY2FsbHkgbmV3IGVtYmVkZGVkIHZpZXdzIGFyZSBhdHRhY2hlZCB0byB0aGUgdmlldyBjb250YWluZXIgb2YgdGhpcyBsb2NhdGlvbiwgYnV0IGluXG4gICAqIGFkdmFuY2VkIHVzZS1jYXNlcywgdGhlIHZpZXcgY2FuIGJlIGF0dGFjaGVkIHRvIGEgZGlmZmVyZW50IGNvbnRhaW5lciB3aGlsZSBrZWVwaW5nIHRoZVxuICAgKiBkYXRhLWJpbmRpbmcgYW5kIGluamVjdGlvbiBjb250ZXh0IGZyb20gdGhlIG9yaWdpbmFsIGxvY2F0aW9uLlxuICAgKlxuICAgKi9cbiAgLy8gVE9ETyhpKTogcmVuYW1lIHRvIGFuY2hvciBvciBsb2NhdGlvblxuICBhYnN0cmFjdCBnZXQgZWxlbWVudFJlZigpOiBFbGVtZW50UmVmO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmlldyBvYmplY3QgYW5kIGF0dGFjaGVzIGl0IHRvIHRoZSB2aWV3IGNvbnRhaW5lciBvZiB0aGUgcGFyZW50IHZpZXcuXG4gICAqIEBwYXJhbSBjb250ZXh0IFRoZSBjb250ZXh0IGZvciB0aGUgbmV3IHZpZXcsIGluaGVyaXRlZCBmcm9tIHRoZSBhbmNob3IgZWxlbWVudC5cbiAgICogQHJldHVybnMgVGhlIG5ldyB2aWV3IG9iamVjdC5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0OiBDKTogRW1iZWRkZWRWaWV3UmVmPEM+O1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOlxuICAgICAgKCkgPT4gVGVtcGxhdGVSZWY8YW55PiA9ICgpID0+IFIzX1RFTVBMQVRFX1JFRl9GQUNUT1JZKFRlbXBsYXRlUmVmLCBFbGVtZW50UmVmKVxufVxuIl19