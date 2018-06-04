/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * `LView` stores all of the information needed to process the instructions as
 * they are invoked from the template. Each embedded view and component view has its
 * own `LView`. When processing a particular view, we set the `currentView` to that
 * `LView`. When that view is done processing, the `currentView` is set back to
 * whatever the original `currentView` was before (the parent `LView`).
 *
 * Keeping separate state for each view facilities view insertion / deletion, so we
 * don't have to edit the data array based on which views are present.
 * @record
 */
export function LView() { }
function LView_tsickle_Closure_declarations() {
    /**
     * Flags for this view (see LViewFlags for definition of each bit).
     * @type {?}
     */
    LView.prototype.flags;
    /**
     * The parent view is needed when we exit the view and must restore the previous
     * `LView`. Without this, the render method would have to keep a stack of
     * views as it is recursively rendering templates.
     * @type {?}
     */
    LView.prototype.parent;
    /**
     * Pointer to the `LViewNode` or `LElementNode` which represents the root of the view.
     *
     * If `LViewNode`, this is an embedded view of a container. We need this to be able to
     * efficiently find the `LViewNode` when inserting the view into an anchor.
     *
     * If `LElementNode`, this is the LView of a component.
     * @type {?}
     */
    LView.prototype.node;
    /**
     * Renderer to be used for this view.
     * @type {?}
     */
    LView.prototype.renderer;
    /**
     * The binding index we should access next.
     *
     * This is stored so that bindings can continue where they left off
     * if a view is left midway through processing bindings (e.g. if there is
     * a setter that creates an embedded view, like in ngIf).
     * @type {?}
     */
    LView.prototype.bindingIndex;
    /**
     * When a view is destroyed, listeners need to be released and outputs need to be
     * unsubscribed. This cleanup array stores both listener data (in chunks of 4)
     * and output data (in chunks of 2) for a particular view. Combining the arrays
     * saves on memory (70 bytes per array) and on a few bytes of code size (for two
     * separate for loops).
     *
     * If it's a listener being stored:
     * 1st index is: event name to remove
     * 2nd index is: native element
     * 3rd index is: listener function
     * 4th index is: useCapture boolean
     *
     * If it's an output subscription:
     * 1st index is: unsubscribe function
     * 2nd index is: context for function
     * @type {?}
     */
    LView.prototype.cleanup;
    /**
     * The last LView or LContainer beneath this LView in the hierarchy.
     *
     * The tail allows us to quickly add a new state to the end of the view list
     * without having to propagate starting from the first child.
     * @type {?}
     */
    LView.prototype.tail;
    /**
     * The next sibling LView or LContainer.
     *
     * Allows us to propagate between sibling view states that aren't in the same
     * container. Embedded views already have a node.next, but it is only set for
     * views in the same container. We need a way to link component views and views
     * across containers as well.
     * @type {?}
     */
    LView.prototype.next;
    /**
     * This array stores all element/text/container nodes created inside this view
     * and their bindings. Stored as an array rather than a linked list so we can
     * look up nodes directly in the case of forward declaration or bindings
     * (e.g. E(1)).
     *
     * All bindings for a given view are stored in the order in which they
     * appear in the template, starting with `bindingStartIndex`.
     * We use `bindingIndex` to internally keep track of which binding
     * is currently active.
     * @type {?}
     */
    LView.prototype.data;
    /**
     * An array of directive instances in the current view.
     *
     * These must be stored separately from LNodes because their presence is
     * unknown at compile-time and thus space cannot be reserved in data[].
     * @type {?}
     */
    LView.prototype.directives;
    /**
     * The static data for this view. We need a reference to this so we can easily walk up the
     * node tree in DI and get the TView.data array associated with a node (where the
     * directive defs are stored).
     * @type {?}
     */
    LView.prototype.tView;
    /**
     * For dynamically inserted views, the template function to refresh the view.
     * @type {?}
     */
    LView.prototype.template;
    /**
     * - For embedded views, the context with which to render the template.
     * - For root view of the root component the context contains change detection data.
     * - `null` otherwise.
     * @type {?}
     */
    LView.prototype.context;
    /**
     * Queries active for this view - nodes from a view are reported to those queries
     * @type {?}
     */
    LView.prototype.queries;
    /**
     * An optional Module Injector to be used as fall back after Element Injectors are consulted.
     * @type {?}
     */
    LView.prototype.injector;
    /**
     * An optional custom sanitizer
     * @type {?}
     */
    LView.prototype.sanitizer;
}
/** @enum {number} */
const LViewFlags = {
    /**
       * Whether or not the view is in creationMode.
       *
       * This must be stored in the view rather than using `data` as a marker so that
       * we can properly support embedded views. Otherwise, when exiting a child view
       * back into the parent view, `data` will be defined and `creationMode` will be
       * improperly reported as false.
       */
    CreationMode: 1,
    /** Whether this view has default change detection strategy (checks always) or onPush */
    CheckAlways: 2,
    /** Whether or not this view is currently dirty (needing check) */
    Dirty: 4,
    /** Whether or not this view is currently attached to change detection tree. */
    Attached: 8,
    /**
       *  Whether or not the init hooks have run.
       *
       * If on, the init hooks haven't yet been run and should be executed by the first component that
       * runs OR the first cR() instruction that runs (so inits are run for the top level view before
       * any embedded views).
       */
    RunInit: 16,
};
export { LViewFlags };
/**
 * Interface necessary to work with view tree traversal
 * @record
 */
export function LViewOrLContainer() { }
function LViewOrLContainer_tsickle_Closure_declarations() {
    /** @type {?} */
    LViewOrLContainer.prototype.next;
    /** @type {?|undefined} */
    LViewOrLContainer.prototype.views;
    /** @type {?|undefined} */
    LViewOrLContainer.prototype.tView;
    /** @type {?} */
    LViewOrLContainer.prototype.parent;
}
/**
 * The static data for an LView (shared between all templates of a
 * given type).
 *
 * Stored on the template function as ngPrivateData.
 * @record
 */
export function TView() { }
function TView_tsickle_Closure_declarations() {
    /**
     * ID for inline views to determine whether a view is the same as the previous view
     * in a certain position. If it's not, we know the new view needs to be inserted
     * and the one that exists needs to be removed (e.g. if/else statements)
     *
     * If this is -1, then this is a component view or a dynamically created view.
     * @type {?}
     */
    TView.prototype.id;
    /**
     * Pointer to the `TNode` that represents the root of the view.
     *
     * If this is a `TNode` for an `LViewNode`, this is an embedded view of a container.
     * We need this pointer to be able to efficiently find this node when inserting the view
     * into an anchor.
     *
     * If this is a `TNode` for an `LElementNode`, this is the TView of a component.
     * @type {?}
     */
    TView.prototype.node;
    /**
     * Whether or not this template has been processed.
     * @type {?}
     */
    TView.prototype.firstTemplatePass;
    /**
     * Static data equivalent of LView.data[]. Contains TNodes.
     * @type {?}
     */
    TView.prototype.data;
    /**
     * The binding start index is the index at which the data array
     * starts to store bindings only. Saving this value ensures that we
     * will begin reading bindings at the correct point in the array when
     * we are in update mode.
     * @type {?}
     */
    TView.prototype.bindingStartIndex;
    /**
     * Index of the host node of the first LView or LContainer beneath this LView in
     * the hierarchy.
     *
     * Necessary to store this so views can traverse through their nested views
     * to remove listeners and call onDestroy callbacks.
     *
     * For embedded views, we store the index of an LContainer's host rather than the first
     * LView to avoid managing splicing when views are added/removed.
     * @type {?}
     */
    TView.prototype.childIndex;
    /**
     * Selector matches for a node are temporarily cached on the TView so the
     * DI system can eagerly instantiate directives on the same node if they are
     * created out of order. They are overwritten after each node.
     *
     * <div dirA dirB></div>
     *
     * e.g. DirA injects DirB, but DirA is created first. DI should instantiate
     * DirB when it finds that it's on the same node, but not yet created.
     *
     * Even indices: Directive defs
     * Odd indices:
     *   - Null if the associated directive hasn't been instantiated yet
     *   - Directive index, if associated directive has been created
     *   - String, temporary 'CIRCULAR' token set while dependencies are being resolved
     * @type {?}
     */
    TView.prototype.currentMatches;
    /**
     * Directive and component defs that have already been matched to nodes on
     * this view.
     *
     * Defs are stored at the same index in TView.directives[] as their instances
     * are stored in LView.directives[]. This simplifies lookup in DI.
     * @type {?}
     */
    TView.prototype.directives;
    /**
     * Full registry of directives and components that may be found in this view.
     *
     * It's necessary to keep a copy of the full def list on the TView so it's possible
     * to render template functions without a host component.
     * @type {?}
     */
    TView.prototype.directiveRegistry;
    /**
     * Full registry of pipes that may be found in this view.
     *
     * The property is either an array of `PipeDefs`s or a function which returns the array of
     * `PipeDefs`s. The function is necessary to be able to support forward declarations.
     *
     * It's necessary to keep a copy of the full def list on the TView so it's possible
     * to render template functions without a host component.
     * @type {?}
     */
    TView.prototype.pipeRegistry;
    /**
     * Array of ngOnInit and ngDoCheck hooks that should be executed for this view in
     * creation mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.initHooks;
    /**
     * Array of ngDoCheck hooks that should be executed for this view in update mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.checkHooks;
    /**
     * Array of ngAfterContentInit and ngAfterContentChecked hooks that should be executed
     * for this view in creation mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.contentHooks;
    /**
     * Array of ngAfterContentChecked hooks that should be executed for this view in update
     * mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.contentCheckHooks;
    /**
     * Array of ngAfterViewInit and ngAfterViewChecked hooks that should be executed for
     * this view in creation mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.viewHooks;
    /**
     * Array of ngAfterViewChecked hooks that should be executed for this view in
     * update mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.viewCheckHooks;
    /**
     * Array of ngOnDestroy hooks that should be executed when this view is destroyed.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.destroyHooks;
    /**
     * Array of pipe ngOnDestroy hooks that should be executed when this view is destroyed.
     *
     * Even indices: Index of pipe in data
     * Odd indices: Hook function
     *
     * These must be stored separately from directive destroy hooks because their contexts
     * are stored in data.
     * @type {?}
     */
    TView.prototype.pipeDestroyHooks;
    /**
     * A list of directive and element indices for child components that will need to be
     * refreshed when the current view has finished its check.
     *
     * Even indices: Directive indices
     * Odd indices: Element indices
     * @type {?}
     */
    TView.prototype.components;
    /**
     * A list of indices for child directives that have host bindings.
     *
     * Even indices: Directive indices
     * Odd indices: Element indices
     * @type {?}
     */
    TView.prototype.hostBindings;
}
/**
 * RootContext contains information which is shared for all components which
 * were bootstrapped with {\@link renderComponent}.
 * @record
 */
export function RootContext() { }
function RootContext_tsickle_Closure_declarations() {
    /**
     * A function used for scheduling change detection in the future. Usually
     * this is `requestAnimationFrame`.
     * @type {?}
     */
    RootContext.prototype.scheduler;
    /**
     * A promise which is resolved when all components are considered clean (not dirty).
     *
     * This promise is overwritten every time a first call to {\@link markDirty} is invoked.
     * @type {?}
     */
    RootContext.prototype.clean;
    /**
     * RootComponent - The component which was instantiated by the call to
     * {\@link renderComponent}.
     * @type {?}
     */
    RootContext.prototype.component;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ2JBLE1BQU0sQ0FBQyx1QkFBTSw2QkFBNkIsR0FBRyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZiwgUGlwZURlZkxpc3R9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZX0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtSZW5kZXJlcjN9IGZyb20gJy4vcmVuZGVyZXInO1xuXG5cblxuLyoqXG4gKiBgTFZpZXdgIHN0b3JlcyBhbGwgb2YgdGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwcm9jZXNzIHRoZSBpbnN0cnVjdGlvbnMgYXNcbiAqIHRoZXkgYXJlIGludm9rZWQgZnJvbSB0aGUgdGVtcGxhdGUuIEVhY2ggZW1iZWRkZWQgdmlldyBhbmQgY29tcG9uZW50IHZpZXcgaGFzIGl0c1xuICogb3duIGBMVmlld2AuIFdoZW4gcHJvY2Vzc2luZyBhIHBhcnRpY3VsYXIgdmlldywgd2Ugc2V0IHRoZSBgY3VycmVudFZpZXdgIHRvIHRoYXRcbiAqIGBMVmlld2AuIFdoZW4gdGhhdCB2aWV3IGlzIGRvbmUgcHJvY2Vzc2luZywgdGhlIGBjdXJyZW50Vmlld2AgaXMgc2V0IGJhY2sgdG9cbiAqIHdoYXRldmVyIHRoZSBvcmlnaW5hbCBgY3VycmVudFZpZXdgIHdhcyBiZWZvcmUgKHRoZSBwYXJlbnQgYExWaWV3YCkuXG4gKlxuICogS2VlcGluZyBzZXBhcmF0ZSBzdGF0ZSBmb3IgZWFjaCB2aWV3IGZhY2lsaXRpZXMgdmlldyBpbnNlcnRpb24gLyBkZWxldGlvbiwgc28gd2VcbiAqIGRvbid0IGhhdmUgdG8gZWRpdCB0aGUgZGF0YSBhcnJheSBiYXNlZCBvbiB3aGljaCB2aWV3cyBhcmUgcHJlc2VudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMVmlldyB7XG4gIC8qKiBGbGFncyBmb3IgdGhpcyB2aWV3IChzZWUgTFZpZXdGbGFncyBmb3IgZGVmaW5pdGlvbiBvZiBlYWNoIGJpdCkuICovXG4gIGZsYWdzOiBMVmlld0ZsYWdzO1xuXG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IHZpZXcgaXMgbmVlZGVkIHdoZW4gd2UgZXhpdCB0aGUgdmlldyBhbmQgbXVzdCByZXN0b3JlIHRoZSBwcmV2aW91c1xuICAgKiBgTFZpZXdgLiBXaXRob3V0IHRoaXMsIHRoZSByZW5kZXIgbWV0aG9kIHdvdWxkIGhhdmUgdG8ga2VlcCBhIHN0YWNrIG9mXG4gICAqIHZpZXdzIGFzIGl0IGlzIHJlY3Vyc2l2ZWx5IHJlbmRlcmluZyB0ZW1wbGF0ZXMuXG4gICAqL1xuICByZWFkb25seSBwYXJlbnQ6IExWaWV3fG51bGw7XG5cbiAgLyoqXG4gICAqIFBvaW50ZXIgdG8gdGhlIGBMVmlld05vZGVgIG9yIGBMRWxlbWVudE5vZGVgIHdoaWNoIHJlcHJlc2VudHMgdGhlIHJvb3Qgb2YgdGhlIHZpZXcuXG4gICAqXG4gICAqIElmIGBMVmlld05vZGVgLCB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgYSBjb250YWluZXIuIFdlIG5lZWQgdGhpcyB0byBiZSBhYmxlIHRvXG4gICAqIGVmZmljaWVudGx5IGZpbmQgdGhlIGBMVmlld05vZGVgIHdoZW4gaW5zZXJ0aW5nIHRoZSB2aWV3IGludG8gYW4gYW5jaG9yLlxuICAgKlxuICAgKiBJZiBgTEVsZW1lbnROb2RlYCwgdGhpcyBpcyB0aGUgTFZpZXcgb2YgYSBjb21wb25lbnQuXG4gICAqL1xuICAvLyBUT0RPKGthcmEpOiBSZW1vdmUgd2hlbiB3ZSBoYXZlIHBhcmVudC9jaGlsZCBvbiBUTm9kZXNcbiAgcmVhZG9ubHkgbm9kZTogTFZpZXdOb2RlfExFbGVtZW50Tm9kZTtcblxuICAvKiogUmVuZGVyZXIgdG8gYmUgdXNlZCBmb3IgdGhpcyB2aWV3LiAqL1xuICByZWFkb25seSByZW5kZXJlcjogUmVuZGVyZXIzO1xuXG4gIC8qKlxuICAgKiBUaGUgYmluZGluZyBpbmRleCB3ZSBzaG91bGQgYWNjZXNzIG5leHQuXG4gICAqXG4gICAqIFRoaXMgaXMgc3RvcmVkIHNvIHRoYXQgYmluZGluZ3MgY2FuIGNvbnRpbnVlIHdoZXJlIHRoZXkgbGVmdCBvZmZcbiAgICogaWYgYSB2aWV3IGlzIGxlZnQgbWlkd2F5IHRocm91Z2ggcHJvY2Vzc2luZyBiaW5kaW5ncyAoZS5nLiBpZiB0aGVyZSBpc1xuICAgKiBhIHNldHRlciB0aGF0IGNyZWF0ZXMgYW4gZW1iZWRkZWQgdmlldywgbGlrZSBpbiBuZ0lmKS5cbiAgICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAgICogdW5zdWJzY3JpYmVkLiBUaGlzIGNsZWFudXAgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZGF0YSAoaW4gY2h1bmtzIG9mIDQpXG4gICAqIGFuZCBvdXRwdXQgZGF0YSAoaW4gY2h1bmtzIG9mIDIpIGZvciBhIHBhcnRpY3VsYXIgdmlldy4gQ29tYmluaW5nIHRoZSBhcnJheXNcbiAgICogc2F2ZXMgb24gbWVtb3J5ICg3MCBieXRlcyBwZXIgYXJyYXkpIGFuZCBvbiBhIGZldyBieXRlcyBvZiBjb2RlIHNpemUgKGZvciB0d29cbiAgICogc2VwYXJhdGUgZm9yIGxvb3BzKS5cbiAgICpcbiAgICogSWYgaXQncyBhIGxpc3RlbmVyIGJlaW5nIHN0b3JlZDpcbiAgICogMXN0IGluZGV4IGlzOiBldmVudCBuYW1lIHRvIHJlbW92ZVxuICAgKiAybmQgaW5kZXggaXM6IG5hdGl2ZSBlbGVtZW50XG4gICAqIDNyZCBpbmRleCBpczogbGlzdGVuZXIgZnVuY3Rpb25cbiAgICogNHRoIGluZGV4IGlzOiB1c2VDYXB0dXJlIGJvb2xlYW5cbiAgICpcbiAgICogSWYgaXQncyBhbiBvdXRwdXQgc3Vic2NyaXB0aW9uOlxuICAgKiAxc3QgaW5kZXggaXM6IHVuc3Vic2NyaWJlIGZ1bmN0aW9uXG4gICAqIDJuZCBpbmRleCBpczogY29udGV4dCBmb3IgZnVuY3Rpb25cbiAgICovXG4gIGNsZWFudXA6IGFueVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIFRoZSB0YWlsIGFsbG93cyB1cyB0byBxdWlja2x5IGFkZCBhIG5ldyBzdGF0ZSB0byB0aGUgZW5kIG9mIHRoZSB2aWV3IGxpc3RcbiAgICogd2l0aG91dCBoYXZpbmcgdG8gcHJvcGFnYXRlIHN0YXJ0aW5nIGZyb20gdGhlIGZpcnN0IGNoaWxkLlxuICAgKi9cbiAgdGFpbDogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbmV4dCBzaWJsaW5nIExWaWV3IG9yIExDb250YWluZXIuXG4gICAqXG4gICAqIEFsbG93cyB1cyB0byBwcm9wYWdhdGUgYmV0d2VlbiBzaWJsaW5nIHZpZXcgc3RhdGVzIHRoYXQgYXJlbid0IGluIHRoZSBzYW1lXG4gICAqIGNvbnRhaW5lci4gRW1iZWRkZWQgdmlld3MgYWxyZWFkeSBoYXZlIGEgbm9kZS5uZXh0LCBidXQgaXQgaXMgb25seSBzZXQgZm9yXG4gICAqIHZpZXdzIGluIHRoZSBzYW1lIGNvbnRhaW5lci4gV2UgbmVlZCBhIHdheSB0byBsaW5rIGNvbXBvbmVudCB2aWV3cyBhbmQgdmlld3NcbiAgICogYWNyb3NzIGNvbnRhaW5lcnMgYXMgd2VsbC5cbiAgICovXG4gIG5leHQ6IExWaWV3fExDb250YWluZXJ8bnVsbDtcblxuICAvKipcbiAgICogVGhpcyBhcnJheSBzdG9yZXMgYWxsIGVsZW1lbnQvdGV4dC9jb250YWluZXIgbm9kZXMgY3JlYXRlZCBpbnNpZGUgdGhpcyB2aWV3XG4gICAqIGFuZCB0aGVpciBiaW5kaW5ncy4gU3RvcmVkIGFzIGFuIGFycmF5IHJhdGhlciB0aGFuIGEgbGlua2VkIGxpc3Qgc28gd2UgY2FuXG4gICAqIGxvb2sgdXAgbm9kZXMgZGlyZWN0bHkgaW4gdGhlIGNhc2Ugb2YgZm9yd2FyZCBkZWNsYXJhdGlvbiBvciBiaW5kaW5nc1xuICAgKiAoZS5nLiBFKDEpKS5cbiAgICpcbiAgICogQWxsIGJpbmRpbmdzIGZvciBhIGdpdmVuIHZpZXcgYXJlIHN0b3JlZCBpbiB0aGUgb3JkZXIgaW4gd2hpY2ggdGhleVxuICAgKiBhcHBlYXIgaW4gdGhlIHRlbXBsYXRlLCBzdGFydGluZyB3aXRoIGBiaW5kaW5nU3RhcnRJbmRleGAuXG4gICAqIFdlIHVzZSBgYmluZGluZ0luZGV4YCB0byBpbnRlcm5hbGx5IGtlZXAgdHJhY2sgb2Ygd2hpY2ggYmluZGluZ1xuICAgKiBpcyBjdXJyZW50bHkgYWN0aXZlLlxuICAgKi9cbiAgcmVhZG9ubHkgZGF0YTogYW55W107XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGRpcmVjdGl2ZSBpbnN0YW5jZXMgaW4gdGhlIGN1cnJlbnQgdmlldy5cbiAgICpcbiAgICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gICAqIHVua25vd24gYXQgY29tcGlsZS10aW1lIGFuZCB0aHVzIHNwYWNlIGNhbm5vdCBiZSByZXNlcnZlZCBpbiBkYXRhW10uXG4gICAqL1xuICBkaXJlY3RpdmVzOiBhbnlbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgdmlldy4gV2UgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGlzIHNvIHdlIGNhbiBlYXNpbHkgd2FsayB1cCB0aGVcbiAgICogbm9kZSB0cmVlIGluIERJIGFuZCBnZXQgdGhlIFRWaWV3LmRhdGEgYXJyYXkgYXNzb2NpYXRlZCB3aXRoIGEgbm9kZSAod2hlcmUgdGhlXG4gICAqIGRpcmVjdGl2ZSBkZWZzIGFyZSBzdG9yZWQpLlxuICAgKi9cbiAgdFZpZXc6IFRWaWV3O1xuXG4gIC8qKlxuICAgKiBGb3IgZHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MsIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiB0byByZWZyZXNoIHRoZSB2aWV3LlxuICAgKi9cbiAgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsO1xuXG4gIC8qKlxuICAgKiAtIEZvciBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRleHQgd2l0aCB3aGljaCB0byByZW5kZXIgdGhlIHRlbXBsYXRlLlxuICAgKiAtIEZvciByb290IHZpZXcgb2YgdGhlIHJvb3QgY29tcG9uZW50IHRoZSBjb250ZXh0IGNvbnRhaW5zIGNoYW5nZSBkZXRlY3Rpb24gZGF0YS5cbiAgICogLSBgbnVsbGAgb3RoZXJ3aXNlLlxuICAgKi9cbiAgY29udGV4dDoge318Um9vdENvbnRleHR8bnVsbDtcblxuICAvKipcbiAgICogUXVlcmllcyBhY3RpdmUgZm9yIHRoaXMgdmlldyAtIG5vZGVzIGZyb20gYSB2aWV3IGFyZSByZXBvcnRlZCB0byB0aG9zZSBxdWVyaWVzXG4gICAqL1xuICBxdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBNb2R1bGUgSW5qZWN0b3IgdG8gYmUgdXNlZCBhcyBmYWxsIGJhY2sgYWZ0ZXIgRWxlbWVudCBJbmplY3RvcnMgYXJlIGNvbnN1bHRlZC5cbiAgICovXG4gIGluamVjdG9yOiBJbmplY3RvcnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBjdXN0b20gc2FuaXRpemVyXG4gICAqL1xuICBzYW5pdGl6ZXI6IFNhbml0aXplcnxudWxsO1xufVxuXG4vKiogRmxhZ3MgYXNzb2NpYXRlZCB3aXRoIGFuIExWaWV3IChzYXZlZCBpbiBMVmlldy5mbGFncykgKi9cbmV4cG9ydCBjb25zdCBlbnVtIExWaWV3RmxhZ3Mge1xuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHZpZXcgaXMgaW4gY3JlYXRpb25Nb2RlLlxuICAgKlxuICAgKiBUaGlzIG11c3QgYmUgc3RvcmVkIGluIHRoZSB2aWV3IHJhdGhlciB0aGFuIHVzaW5nIGBkYXRhYCBhcyBhIG1hcmtlciBzbyB0aGF0XG4gICAqIHdlIGNhbiBwcm9wZXJseSBzdXBwb3J0IGVtYmVkZGVkIHZpZXdzLiBPdGhlcndpc2UsIHdoZW4gZXhpdGluZyBhIGNoaWxkIHZpZXdcbiAgICogYmFjayBpbnRvIHRoZSBwYXJlbnQgdmlldywgYGRhdGFgIHdpbGwgYmUgZGVmaW5lZCBhbmQgYGNyZWF0aW9uTW9kZWAgd2lsbCBiZVxuICAgKiBpbXByb3Blcmx5IHJlcG9ydGVkIGFzIGZhbHNlLlxuICAgKi9cbiAgQ3JlYXRpb25Nb2RlID0gMGIwMDAwMSxcblxuICAvKiogV2hldGhlciB0aGlzIHZpZXcgaGFzIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneSAoY2hlY2tzIGFsd2F5cykgb3Igb25QdXNoICovXG4gIENoZWNrQWx3YXlzID0gMGIwMDAxMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBkaXJ0eSAobmVlZGluZyBjaGVjaykgKi9cbiAgRGlydHkgPSAwYjAwMTAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGF0dGFjaGVkIHRvIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS4gKi9cbiAgQXR0YWNoZWQgPSAwYjAxMDAwLFxuXG4gIC8qKlxuICAgKiAgV2hldGhlciBvciBub3QgdGhlIGluaXQgaG9va3MgaGF2ZSBydW4uXG4gICAqXG4gICAqIElmIG9uLCB0aGUgaW5pdCBob29rcyBoYXZlbid0IHlldCBiZWVuIHJ1biBhbmQgc2hvdWxkIGJlIGV4ZWN1dGVkIGJ5IHRoZSBmaXJzdCBjb21wb25lbnQgdGhhdFxuICAgKiBydW5zIE9SIHRoZSBmaXJzdCBjUigpIGluc3RydWN0aW9uIHRoYXQgcnVucyAoc28gaW5pdHMgYXJlIHJ1biBmb3IgdGhlIHRvcCBsZXZlbCB2aWV3IGJlZm9yZVxuICAgKiBhbnkgZW1iZWRkZWQgdmlld3MpLlxuICAgKi9cbiAgUnVuSW5pdCA9IDBiMTAwMDAsXG59XG5cbi8qKiBJbnRlcmZhY2UgbmVjZXNzYXJ5IHRvIHdvcmsgd2l0aCB2aWV3IHRyZWUgdHJhdmVyc2FsICovXG5leHBvcnQgaW50ZXJmYWNlIExWaWV3T3JMQ29udGFpbmVyIHtcbiAgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuICB2aWV3cz86IExWaWV3Tm9kZVtdO1xuICB0Vmlldz86IFRWaWV3O1xuICBwYXJlbnQ6IExWaWV3fG51bGw7XG59XG5cbi8qKlxuICogVGhlIHN0YXRpYyBkYXRhIGZvciBhbiBMVmlldyAoc2hhcmVkIGJldHdlZW4gYWxsIHRlbXBsYXRlcyBvZiBhXG4gKiBnaXZlbiB0eXBlKS5cbiAqXG4gKiBTdG9yZWQgb24gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGFzIG5nUHJpdmF0ZURhdGEuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFZpZXcge1xuICAvKipcbiAgICogSUQgZm9yIGlubGluZSB2aWV3cyB0byBkZXRlcm1pbmUgd2hldGhlciBhIHZpZXcgaXMgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHZpZXdcbiAgICogaW4gYSBjZXJ0YWluIHBvc2l0aW9uLiBJZiBpdCdzIG5vdCwgd2Uga25vdyB0aGUgbmV3IHZpZXcgbmVlZHMgdG8gYmUgaW5zZXJ0ZWRcbiAgICogYW5kIHRoZSBvbmUgdGhhdCBleGlzdHMgbmVlZHMgdG8gYmUgcmVtb3ZlZCAoZS5nLiBpZi9lbHNlIHN0YXRlbWVudHMpXG4gICAqXG4gICAqIElmIHRoaXMgaXMgLTEsIHRoZW4gdGhpcyBpcyBhIGNvbXBvbmVudCB2aWV3IG9yIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgcmVhZG9ubHkgaWQ6IG51bWJlcjtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgYFROb2RlYCB0aGF0IHJlcHJlc2VudHMgdGhlIHJvb3Qgb2YgdGhlIHZpZXcuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVE5vZGVgIGZvciBhbiBgTFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLlxuICAgKiBXZSBuZWVkIHRoaXMgcG9pbnRlciB0byBiZSBhYmxlIHRvIGVmZmljaWVudGx5IGZpbmQgdGhpcyBub2RlIHdoZW4gaW5zZXJ0aW5nIHRoZSB2aWV3XG4gICAqIGludG8gYW4gYW5jaG9yLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGEgYFROb2RlYCBmb3IgYW4gYExFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIFRWaWV3IG9mIGEgY29tcG9uZW50LlxuICAgKi9cbiAgbm9kZTogVE5vZGU7XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdGVtcGxhdGUgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xuICBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbjtcblxuICAvKiogU3RhdGljIGRhdGEgZXF1aXZhbGVudCBvZiBMVmlldy5kYXRhW10uIENvbnRhaW5zIFROb2Rlcy4gKi9cbiAgZGF0YTogVERhdGE7XG5cbiAgLyoqXG4gICAqIFRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4IGlzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgZGF0YSBhcnJheVxuICAgKiBzdGFydHMgdG8gc3RvcmUgYmluZGluZ3Mgb25seS4gU2F2aW5nIHRoaXMgdmFsdWUgZW5zdXJlcyB0aGF0IHdlXG4gICAqIHdpbGwgYmVnaW4gcmVhZGluZyBiaW5kaW5ncyBhdCB0aGUgY29ycmVjdCBwb2ludCBpbiB0aGUgYXJyYXkgd2hlblxuICAgKiB3ZSBhcmUgaW4gdXBkYXRlIG1vZGUuXG4gICAqL1xuICBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgaG9zdCBub2RlIG9mIHRoZSBmaXJzdCBMVmlldyBvciBMQ29udGFpbmVyIGJlbmVhdGggdGhpcyBMVmlldyBpblxuICAgKiB0aGUgaGllcmFyY2h5LlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3RvcmUgdGhpcyBzbyB2aWV3cyBjYW4gdHJhdmVyc2UgdGhyb3VnaCB0aGVpciBuZXN0ZWQgdmlld3NcbiAgICogdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBGb3IgZW1iZWRkZWQgdmlld3MsIHdlIHN0b3JlIHRoZSBpbmRleCBvZiBhbiBMQ29udGFpbmVyJ3MgaG9zdCByYXRoZXIgdGhhbiB0aGUgZmlyc3RcbiAgICogTFZpZXcgdG8gYXZvaWQgbWFuYWdpbmcgc3BsaWNpbmcgd2hlbiB2aWV3cyBhcmUgYWRkZWQvcmVtb3ZlZC5cbiAgICovXG4gIGNoaWxkSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU2VsZWN0b3IgbWF0Y2hlcyBmb3IgYSBub2RlIGFyZSB0ZW1wb3JhcmlseSBjYWNoZWQgb24gdGhlIFRWaWV3IHNvIHRoZVxuICAgKiBESSBzeXN0ZW0gY2FuIGVhZ2VybHkgaW5zdGFudGlhdGUgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlIGlmIHRoZXkgYXJlXG4gICAqIGNyZWF0ZWQgb3V0IG9mIG9yZGVyLiBUaGV5IGFyZSBvdmVyd3JpdHRlbiBhZnRlciBlYWNoIG5vZGUuXG4gICAqXG4gICAqIDxkaXYgZGlyQSBkaXJCPjwvZGl2PlxuICAgKlxuICAgKiBlLmcuIERpckEgaW5qZWN0cyBEaXJCLCBidXQgRGlyQSBpcyBjcmVhdGVkIGZpcnN0LiBESSBzaG91bGQgaW5zdGFudGlhdGVcbiAgICogRGlyQiB3aGVuIGl0IGZpbmRzIHRoYXQgaXQncyBvbiB0aGUgc2FtZSBub2RlLCBidXQgbm90IHlldCBjcmVhdGVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBkZWZzXG4gICAqIE9kZCBpbmRpY2VzOlxuICAgKiAgIC0gTnVsbCBpZiB0aGUgYXNzb2NpYXRlZCBkaXJlY3RpdmUgaGFzbid0IGJlZW4gaW5zdGFudGlhdGVkIHlldFxuICAgKiAgIC0gRGlyZWN0aXZlIGluZGV4LCBpZiBhc3NvY2lhdGVkIGRpcmVjdGl2ZSBoYXMgYmVlbiBjcmVhdGVkXG4gICAqICAgLSBTdHJpbmcsIHRlbXBvcmFyeSAnQ0lSQ1VMQVInIHRva2VuIHNldCB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkXG4gICAqL1xuICBjdXJyZW50TWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIERpcmVjdGl2ZSBhbmQgY29tcG9uZW50IGRlZnMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBtYXRjaGVkIHRvIG5vZGVzIG9uXG4gICAqIHRoaXMgdmlldy5cbiAgICpcbiAgICogRGVmcyBhcmUgc3RvcmVkIGF0IHRoZSBzYW1lIGluZGV4IGluIFRWaWV3LmRpcmVjdGl2ZXNbXSBhcyB0aGVpciBpbnN0YW5jZXNcbiAgICogYXJlIHN0b3JlZCBpbiBMVmlldy5kaXJlY3RpdmVzW10uIFRoaXMgc2ltcGxpZmllcyBsb29rdXAgaW4gREkuXG4gICAqL1xuICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bGwgcmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uSW5pdCBhbmQgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGluaXRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZFxuICAgKiBmb3IgdGhpcyB2aWV3IGluIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluIHVwZGF0ZVxuICAgKiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJWaWV3SW5pdCBhbmQgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvclxuICAgKiB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkRlc3Ryb3kgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgd2hlbiB0aGlzIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBwaXBlIG5nT25EZXN0cm95IGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIHdoZW4gdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBJbmRleCBvZiBwaXBlIGluIGRhdGFcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICpcbiAgICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIGRpcmVjdGl2ZSBkZXN0cm95IGhvb2tzIGJlY2F1c2UgdGhlaXIgY29udGV4dHNcbiAgICogYXJlIHN0b3JlZCBpbiBkYXRhLlxuICAgKi9cbiAgcGlwZURlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGRpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciBjaGlsZCBjb21wb25lbnRzIHRoYXQgd2lsbCBuZWVkIHRvIGJlXG4gICAqIHJlZnJlc2hlZCB3aGVuIHRoZSBjdXJyZW50IHZpZXcgaGFzIGZpbmlzaGVkIGl0cyBjaGVjay5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kaWNlc1xuICAgKiBPZGQgaW5kaWNlczogRWxlbWVudCBpbmRpY2VzXG4gICAqL1xuICBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgaW5kaWNlcyBmb3IgY2hpbGQgZGlyZWN0aXZlcyB0aGF0IGhhdmUgaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kaWNlc1xuICAgKiBPZGQgaW5kaWNlczogRWxlbWVudCBpbmRpY2VzXG4gICAqL1xuICBob3N0QmluZGluZ3M6IG51bWJlcltdfG51bGw7XG59XG5cbi8qKlxuICogUm9vdENvbnRleHQgY29udGFpbnMgaW5mb3JtYXRpb24gd2hpY2ggaXMgc2hhcmVkIGZvciBhbGwgY29tcG9uZW50cyB3aGljaFxuICogd2VyZSBib290c3RyYXBwZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb290Q29udGV4dCB7XG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHVzZWQgZm9yIHNjaGVkdWxpbmcgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgZnV0dXJlLiBVc3VhbGx5XG4gICAqIHRoaXMgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gICAqL1xuICBzY2hlZHVsZXI6ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCB3aGVuIGFsbCBjb21wb25lbnRzIGFyZSBjb25zaWRlcmVkIGNsZWFuIChub3QgZGlydHkpLlxuICAgKlxuICAgKiBUaGlzIHByb21pc2UgaXMgb3ZlcndyaXR0ZW4gZXZlcnkgdGltZSBhIGZpcnN0IGNhbGwgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gaXMgaW52b2tlZC5cbiAgICovXG4gIGNsZWFuOiBQcm9taXNlPG51bGw+O1xuXG4gIC8qKlxuICAgKiBSb290Q29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB3aGljaCB3YXMgaW5zdGFudGlhdGVkIGJ5IHRoZSBjYWxsIHRvXG4gICAqIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICAgKi9cbiAgY29tcG9uZW50OiB7fTtcbn1cblxuLyoqXG4gKiBBcnJheSBvZiBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgYSB2aWV3IGFuZCB0aGVpciBkaXJlY3RpdmUgaW5kaWNlcy5cbiAqXG4gKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IHR5cGUgSG9va0RhdGEgPSAobnVtYmVyIHwgKCgpID0+IHZvaWQpKVtdO1xuXG4vKipcbiAqIFN0YXRpYyBkYXRhIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGluc3RhbmNlLXNwZWNpZmljIGRhdGEgYXJyYXkgb24gYW4gTFZpZXcuXG4gKlxuICogRWFjaCBub2RlJ3Mgc3RhdGljIGRhdGEgaXMgc3RvcmVkIGluIHREYXRhIGF0IHRoZSBzYW1lIGluZGV4IHRoYXQgaXQncyBzdG9yZWRcbiAqIGluIHRoZSBkYXRhIGFycmF5LiBFYWNoIHBpcGUncyBkZWZpbml0aW9uIGlzIHN0b3JlZCBoZXJlIGF0IHRoZSBzYW1lIGluZGV4XG4gKiBhcyBpdHMgcGlwZSBpbnN0YW5jZSBpbiB0aGUgZGF0YSBhcnJheS4gQW55IG5vZGVzIHRoYXQgZG8gbm90IGhhdmUgc3RhdGljXG4gKiBkYXRhIHN0b3JlIGEgbnVsbCB2YWx1ZSBpbiB0RGF0YSB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqL1xuZXhwb3J0IHR5cGUgVERhdGEgPSAoVE5vZGUgfCBQaXBlRGVmPGFueT58IG51bGwpW107XG5cbi8qKiBUeXBlIGZvciBUVmlldy5jdXJyZW50TWF0Y2hlcyAqL1xuZXhwb3J0IHR5cGUgQ3VycmVudE1hdGNoZXNMaXN0ID0gW0RpcmVjdGl2ZURlZjxhbnk+LCAoc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCldO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19