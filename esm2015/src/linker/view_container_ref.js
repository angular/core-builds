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
/**
 * Represents a container where one or more Views can be attached.
 *
 * The container can contain two kinds of Views. Host Views, created by instantiating a
 * {\@link Component} via {\@link #createComponent}, and Embedded Views, created by instantiating an
 * {\@link TemplateRef Embedded Template} via {\@link #createEmbeddedView}.
 *
 * The location of the View Container within the containing View is specified by the Anchor
 * `element`. Each View Container can have only one Anchor Element and each Anchor Element can only
 * have a single View Container.
 *
 * Root elements of Views attached to this container become siblings of the Anchor Element in
 * the Rendered View.
 *
 * To access a `ViewContainerRef` of an Element, you can either place a {\@link Directive} injected
 * with `ViewContainerRef` on the Element, or you obtain it via a {\@link ViewChild} query.
 *
 * @abstract
 */
export class ViewContainerRef {
}
if (false) {
    /**
     * Anchor element that specifies the location of this container in the containing View.
     * <!-- TODO: rename to anchorElement -->
     * @abstract
     * @return {?}
     */
    ViewContainerRef.prototype.element = function () { };
    /**
     * @abstract
     * @return {?}
     */
    ViewContainerRef.prototype.injector = function () { };
    /**
     * @deprecated No replacement
     * @abstract
     * @return {?}
     */
    ViewContainerRef.prototype.parentInjector = function () { };
    /**
     * Destroys all Views in this container.
     * @abstract
     * @return {?}
     */
    ViewContainerRef.prototype.clear = function () { };
    /**
     * Returns the {\@link ViewRef} for the View located in this container at the specified index.
     * @abstract
     * @param {?} index
     * @return {?}
     */
    ViewContainerRef.prototype.get = function (index) { };
    /**
     * Returns the number of Views currently attached to this container.
     * @abstract
     * @return {?}
     */
    ViewContainerRef.prototype.length = function () { };
    /**
     * Instantiates an Embedded View based on the {\@link TemplateRef `templateRef`} and inserts it
     * into this container at the specified `index`.
     *
     * If `index` is not specified, the new View will be inserted as the last View in the container.
     *
     * Returns the {\@link ViewRef} for the newly created View.
     * @abstract
     * @template C
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.createEmbeddedView = function (templateRef, context, index) { };
    /**
     * Instantiates a single {\@link Component} and inserts its Host View into this container at the
     * specified `index`.
     *
     * The component is instantiated using its {\@link ComponentFactory} which can be obtained via
     * {\@link ComponentFactoryResolver#resolveComponentFactory resolveComponentFactory}.
     *
     * If `index` is not specified, the new View will be inserted as the last View in the container.
     *
     * You can optionally specify the {\@link Injector} that will be used as parent for the Component.
     *
     * Returns the {\@link ComponentRef} of the Host View created for the newly instantiated Component.
     * @abstract
     * @template C
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @param {?=} ngModule
     * @return {?}
     */
    ViewContainerRef.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModule) { };
    /**
     * Inserts a View identified by a {\@link ViewRef} into the container at the specified `index`.
     *
     * If `index` is not specified, the new View will be inserted as the last View in the container.
     *
     * Returns the inserted {\@link ViewRef}.
     * @abstract
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.insert = function (viewRef, index) { };
    /**
     * Moves a View identified by a {\@link ViewRef} into the container at the specified `index`.
     *
     * Returns the inserted {\@link ViewRef}.
     * @abstract
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    ViewContainerRef.prototype.move = function (viewRef, currentIndex) { };
    /**
     * Returns the index of the View, specified via {\@link ViewRef}, within the current container or
     * `-1` if this container doesn't contain the View.
     * @abstract
     * @param {?} viewRef
     * @return {?}
     */
    ViewContainerRef.prototype.indexOf = function (viewRef) { };
    /**
     * Destroys a View attached to this container at the specified `index`.
     *
     * If `index` is not specified, the last View in the container will be removed.
     * @abstract
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.remove = function (index) { };
    /**
     * Use along with {\@link #insert} to move a View within the current container.
     *
     * If the `index` param is omitted, the last {\@link ViewRef} is detached.
     * @abstract
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.detach = function (index) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld19jb250YWluZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQ0EsTUFBTTtDQTBGTCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4vY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZn0gZnJvbSAnLi90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbnRhaW5lciB3aGVyZSBvbmUgb3IgbW9yZSBWaWV3cyBjYW4gYmUgYXR0YWNoZWQuXG4gKlxuICogVGhlIGNvbnRhaW5lciBjYW4gY29udGFpbiB0d28ga2luZHMgb2YgVmlld3MuIEhvc3QgVmlld3MsIGNyZWF0ZWQgYnkgaW5zdGFudGlhdGluZyBhXG4gKiB7QGxpbmsgQ29tcG9uZW50fSB2aWEge0BsaW5rICNjcmVhdGVDb21wb25lbnR9LCBhbmQgRW1iZWRkZWQgVmlld3MsIGNyZWF0ZWQgYnkgaW5zdGFudGlhdGluZyBhblxuICoge0BsaW5rIFRlbXBsYXRlUmVmIEVtYmVkZGVkIFRlbXBsYXRlfSB2aWEge0BsaW5rICNjcmVhdGVFbWJlZGRlZFZpZXd9LlxuICpcbiAqIFRoZSBsb2NhdGlvbiBvZiB0aGUgVmlldyBDb250YWluZXIgd2l0aGluIHRoZSBjb250YWluaW5nIFZpZXcgaXMgc3BlY2lmaWVkIGJ5IHRoZSBBbmNob3JcbiAqIGBlbGVtZW50YC4gRWFjaCBWaWV3IENvbnRhaW5lciBjYW4gaGF2ZSBvbmx5IG9uZSBBbmNob3IgRWxlbWVudCBhbmQgZWFjaCBBbmNob3IgRWxlbWVudCBjYW4gb25seVxuICogaGF2ZSBhIHNpbmdsZSBWaWV3IENvbnRhaW5lci5cbiAqXG4gKiBSb290IGVsZW1lbnRzIG9mIFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyIGJlY29tZSBzaWJsaW5ncyBvZiB0aGUgQW5jaG9yIEVsZW1lbnQgaW5cbiAqIHRoZSBSZW5kZXJlZCBWaWV3LlxuICpcbiAqIFRvIGFjY2VzcyBhIGBWaWV3Q29udGFpbmVyUmVmYCBvZiBhbiBFbGVtZW50LCB5b3UgY2FuIGVpdGhlciBwbGFjZSBhIHtAbGluayBEaXJlY3RpdmV9IGluamVjdGVkXG4gKiB3aXRoIGBWaWV3Q29udGFpbmVyUmVmYCBvbiB0aGUgRWxlbWVudCwgb3IgeW91IG9idGFpbiBpdCB2aWEgYSB7QGxpbmsgVmlld0NoaWxkfSBxdWVyeS5cbiAqXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3Q29udGFpbmVyUmVmIHtcbiAgLyoqXG4gICAqIEFuY2hvciBlbGVtZW50IHRoYXQgc3BlY2lmaWVzIHRoZSBsb2NhdGlvbiBvZiB0aGlzIGNvbnRhaW5lciBpbiB0aGUgY29udGFpbmluZyBWaWV3LlxuICAgKiA8IS0tIFRPRE86IHJlbmFtZSB0byBhbmNob3JFbGVtZW50IC0tPlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGVsZW1lbnQoKTogRWxlbWVudFJlZjtcblxuICBhYnN0cmFjdCBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3I7XG5cbiAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gIGFic3RyYWN0IGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogRGVzdHJveXMgYWxsIFZpZXdzIGluIHRoaXMgY29udGFpbmVyLlxuICAgKi9cbiAgYWJzdHJhY3QgY2xlYXIoKTogdm9pZDtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUge0BsaW5rIFZpZXdSZWZ9IGZvciB0aGUgVmlldyBsb2NhdGVkIGluIHRoaXMgY29udGFpbmVyIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqL1xuICBhYnN0cmFjdCBnZXQoaW5kZXg6IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIFZpZXdzIGN1cnJlbnRseSBhdHRhY2hlZCB0byB0aGlzIGNvbnRhaW5lci5cbiAgICovXG4gIGFic3RyYWN0IGdldCBsZW5ndGgoKTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gRW1iZWRkZWQgVmlldyBiYXNlZCBvbiB0aGUge0BsaW5rIFRlbXBsYXRlUmVmIGB0ZW1wbGF0ZVJlZmB9IGFuZCBpbnNlcnRzIGl0XG4gICAqIGludG8gdGhpcyBjb250YWluZXIgYXQgdGhlIHNwZWNpZmllZCBgaW5kZXhgLlxuICAgKlxuICAgKiBJZiBgaW5kZXhgIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBuZXcgVmlldyB3aWxsIGJlIGluc2VydGVkIGFzIHRoZSBsYXN0IFZpZXcgaW4gdGhlIGNvbnRhaW5lci5cbiAgICpcbiAgICogUmV0dXJucyB0aGUge0BsaW5rIFZpZXdSZWZ9IGZvciB0aGUgbmV3bHkgY3JlYXRlZCBWaWV3LlxuICAgKi9cbiAgYWJzdHJhY3QgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiBUZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIEVtYmVkZGVkVmlld1JlZjxDPjtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGEgc2luZ2xlIHtAbGluayBDb21wb25lbnR9IGFuZCBpbnNlcnRzIGl0cyBIb3N0IFZpZXcgaW50byB0aGlzIGNvbnRhaW5lciBhdCB0aGVcbiAgICogc3BlY2lmaWVkIGBpbmRleGAuXG4gICAqXG4gICAqIFRoZSBjb21wb25lbnQgaXMgaW5zdGFudGlhdGVkIHVzaW5nIGl0cyB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX0gd2hpY2ggY2FuIGJlIG9idGFpbmVkIHZpYVxuICAgKiB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyI3Jlc29sdmVDb21wb25lbnRGYWN0b3J5IHJlc29sdmVDb21wb25lbnRGYWN0b3J5fS5cbiAgICpcbiAgICogSWYgYGluZGV4YCBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgbmV3IFZpZXcgd2lsbCBiZSBpbnNlcnRlZCBhcyB0aGUgbGFzdCBWaWV3IGluIHRoZSBjb250YWluZXIuXG4gICAqXG4gICAqIFlvdSBjYW4gb3B0aW9uYWxseSBzcGVjaWZ5IHRoZSB7QGxpbmsgSW5qZWN0b3J9IHRoYXQgd2lsbCBiZSB1c2VkIGFzIHBhcmVudCBmb3IgdGhlIENvbXBvbmVudC5cbiAgICpcbiAgICogUmV0dXJucyB0aGUge0BsaW5rIENvbXBvbmVudFJlZn0gb2YgdGhlIEhvc3QgVmlldyBjcmVhdGVkIGZvciB0aGUgbmV3bHkgaW5zdGFudGlhdGVkIENvbXBvbmVudC5cbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyLCBpbmplY3Rvcj86IEluamVjdG9yLFxuICAgICAgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sIG5nTW9kdWxlPzogTmdNb2R1bGVSZWY8YW55Pik6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogSW5zZXJ0cyBhIFZpZXcgaWRlbnRpZmllZCBieSBhIHtAbGluayBWaWV3UmVmfSBpbnRvIHRoZSBjb250YWluZXIgYXQgdGhlIHNwZWNpZmllZCBgaW5kZXhgLlxuICAgKlxuICAgKiBJZiBgaW5kZXhgIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBuZXcgVmlldyB3aWxsIGJlIGluc2VydGVkIGFzIHRoZSBsYXN0IFZpZXcgaW4gdGhlIGNvbnRhaW5lci5cbiAgICpcbiAgICogUmV0dXJucyB0aGUgaW5zZXJ0ZWQge0BsaW5rIFZpZXdSZWZ9LlxuICAgKi9cbiAgYWJzdHJhY3QgaW5zZXJ0KHZpZXdSZWY6IFZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogVmlld1JlZjtcblxuICAvKipcbiAgICogTW92ZXMgYSBWaWV3IGlkZW50aWZpZWQgYnkgYSB7QGxpbmsgVmlld1JlZn0gaW50byB0aGUgY29udGFpbmVyIGF0IHRoZSBzcGVjaWZpZWQgYGluZGV4YC5cbiAgICpcbiAgICogUmV0dXJucyB0aGUgaW5zZXJ0ZWQge0BsaW5rIFZpZXdSZWZ9LlxuICAgKi9cbiAgYWJzdHJhY3QgbW92ZSh2aWV3UmVmOiBWaWV3UmVmLCBjdXJyZW50SW5kZXg6IG51bWJlcik6IFZpZXdSZWY7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBWaWV3LCBzcGVjaWZpZWQgdmlhIHtAbGluayBWaWV3UmVmfSwgd2l0aGluIHRoZSBjdXJyZW50IGNvbnRhaW5lciBvclxuICAgKiBgLTFgIGlmIHRoaXMgY29udGFpbmVyIGRvZXNuJ3QgY29udGFpbiB0aGUgVmlldy5cbiAgICovXG4gIGFic3RyYWN0IGluZGV4T2Yodmlld1JlZjogVmlld1JlZik6IG51bWJlcjtcblxuICAvKipcbiAgICogRGVzdHJveXMgYSBWaWV3IGF0dGFjaGVkIHRvIHRoaXMgY29udGFpbmVyIGF0IHRoZSBzcGVjaWZpZWQgYGluZGV4YC5cbiAgICpcbiAgICogSWYgYGluZGV4YCBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgbGFzdCBWaWV3IGluIHRoZSBjb250YWluZXIgd2lsbCBiZSByZW1vdmVkLlxuICAgKi9cbiAgYWJzdHJhY3QgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZDtcblxuICAvKipcbiAgICogVXNlIGFsb25nIHdpdGgge0BsaW5rICNpbnNlcnR9IHRvIG1vdmUgYSBWaWV3IHdpdGhpbiB0aGUgY3VycmVudCBjb250YWluZXIuXG4gICAqXG4gICAqIElmIHRoZSBgaW5kZXhgIHBhcmFtIGlzIG9taXR0ZWQsIHRoZSBsYXN0IHtAbGluayBWaWV3UmVmfSBpcyBkZXRhY2hlZC5cbiAgICovXG4gIGFic3RyYWN0IGRldGFjaChpbmRleD86IG51bWJlcik6IFZpZXdSZWZ8bnVsbDtcbn1cbiJdfQ==