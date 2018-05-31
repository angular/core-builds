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
     * ID to determine whether this view is the same as the previous view
     * in this position. If it's not, we know this view needs to be inserted
     * and the one that exists needs to be removed (e.g. if/else statements)
     * @type {?}
     */
    LView.prototype.id;
    /**
     * Renderer to be used for this view.
     * @type {?}
     */
    LView.prototype.renderer;
    /**
     * The binding start index is the index at which the nodes array
     * starts to store bindings only. Saving this value ensures that we
     * will begin reading bindings at the correct point in the array when
     * we are in update mode.
     * @type {?}
     */
    LView.prototype.bindingStartIndex;
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
     * This number tracks the next lifecycle hook that needs to be run.
     *
     * If lifecycleStage === LifecycleStage.ON_INIT, the init hooks haven't yet been run
     * and should be executed by the first r() instruction that runs OR the first
     * cR() instruction that runs (so inits are run for the top level view before any
     * embedded views).
     *
     * If lifecycleStage === LifecycleStage.CONTENT_INIT, the init hooks have been run, but
     * the content hooks have not yet been run. They should be executed on the first
     * r() instruction that runs.
     *
     * If lifecycleStage === LifecycleStage.VIEW_INIT, both the init hooks and content hooks
     * have already been run.
     * @type {?}
     */
    LView.prototype.lifecycleStage;
    /**
     * The first LView or LContainer beneath this LView in the hierarchy.
     *
     * Necessary to store this so views can traverse through their nested views
     * to remove listeners and call onDestroy callbacks.
     *
     * For embedded views, we store the LContainer rather than the first ViewState
     * to avoid managing splicing when views are added/removed.
     * @type {?}
     */
    LView.prototype.child;
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
    LViewOrLContainer.prototype.child;
    /** @type {?|undefined} */
    LViewOrLContainer.prototype.views;
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
/** @enum {number} */
const LifecycleStage = {
    /* Init hooks need to be run, if any. */
    Init: 1,
    /* Content hooks need to be run, if any. Init hooks have already run. */
    AfterInit: 2,
};
export { LifecycleStage };
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnY0EsTUFBTSxDQUFDLHVCQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmLCBQaXBlRGVmTGlzdH0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBMVmlld05vZGUsIFROb2RlfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9yZW5kZXJlcic7XG5cblxuXG4vKipcbiAqIGBMVmlld2Agc3RvcmVzIGFsbCBvZiB0aGUgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHByb2Nlc3MgdGhlIGluc3RydWN0aW9ucyBhc1xuICogdGhleSBhcmUgaW52b2tlZCBmcm9tIHRoZSB0ZW1wbGF0ZS4gRWFjaCBlbWJlZGRlZCB2aWV3IGFuZCBjb21wb25lbnQgdmlldyBoYXMgaXRzXG4gKiBvd24gYExWaWV3YC4gV2hlbiBwcm9jZXNzaW5nIGEgcGFydGljdWxhciB2aWV3LCB3ZSBzZXQgdGhlIGBjdXJyZW50Vmlld2AgdG8gdGhhdFxuICogYExWaWV3YC4gV2hlbiB0aGF0IHZpZXcgaXMgZG9uZSBwcm9jZXNzaW5nLCB0aGUgYGN1cnJlbnRWaWV3YCBpcyBzZXQgYmFjayB0b1xuICogd2hhdGV2ZXIgdGhlIG9yaWdpbmFsIGBjdXJyZW50Vmlld2Agd2FzIGJlZm9yZSAodGhlIHBhcmVudCBgTFZpZXdgKS5cbiAqXG4gKiBLZWVwaW5nIHNlcGFyYXRlIHN0YXRlIGZvciBlYWNoIHZpZXcgZmFjaWxpdGllcyB2aWV3IGluc2VydGlvbiAvIGRlbGV0aW9uLCBzbyB3ZVxuICogZG9uJ3QgaGF2ZSB0byBlZGl0IHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHdoaWNoIHZpZXdzIGFyZSBwcmVzZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExWaWV3IHtcbiAgLyoqIEZsYWdzIGZvciB0aGlzIHZpZXcgKHNlZSBMVmlld0ZsYWdzIGZvciBkZWZpbml0aW9uIG9mIGVhY2ggYml0KS4gKi9cbiAgZmxhZ3M6IExWaWV3RmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgdmlldyBpcyBuZWVkZWQgd2hlbiB3ZSBleGl0IHRoZSB2aWV3IGFuZCBtdXN0IHJlc3RvcmUgdGhlIHByZXZpb3VzXG4gICAqIGBMVmlld2AuIFdpdGhvdXQgdGhpcywgdGhlIHJlbmRlciBtZXRob2Qgd291bGQgaGF2ZSB0byBrZWVwIGEgc3RhY2sgb2ZcbiAgICogdmlld3MgYXMgaXQgaXMgcmVjdXJzaXZlbHkgcmVuZGVyaW5nIHRlbXBsYXRlcy5cbiAgICovXG4gIHJlYWRvbmx5IHBhcmVudDogTFZpZXd8bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgYExWaWV3Tm9kZWAgb3IgYExFbGVtZW50Tm9kZWAgd2hpY2ggcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdmlldy5cbiAgICpcbiAgICogSWYgYExWaWV3Tm9kZWAsIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiBhIGNvbnRhaW5lci4gV2UgbmVlZCB0aGlzIHRvIGJlIGFibGUgdG9cbiAgICogZWZmaWNpZW50bHkgZmluZCB0aGUgYExWaWV3Tm9kZWAgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXcgaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIGBMRWxlbWVudE5vZGVgLCB0aGlzIGlzIHRoZSBMVmlldyBvZiBhIGNvbXBvbmVudC5cbiAgICovXG4gIC8vIFRPRE8oa2FyYSk6IFJlbW92ZSB3aGVuIHdlIGhhdmUgcGFyZW50L2NoaWxkIG9uIFROb2Rlc1xuICByZWFkb25seSBub2RlOiBMVmlld05vZGV8TEVsZW1lbnROb2RlO1xuXG4gIC8qKlxuICAgKiBJRCB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHZpZXcgaXMgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHZpZXdcbiAgICogaW4gdGhpcyBwb3NpdGlvbi4gSWYgaXQncyBub3QsIHdlIGtub3cgdGhpcyB2aWV3IG5lZWRzIHRvIGJlIGluc2VydGVkXG4gICAqIGFuZCB0aGUgb25lIHRoYXQgZXhpc3RzIG5lZWRzIHRvIGJlIHJlbW92ZWQgKGUuZy4gaWYvZWxzZSBzdGF0ZW1lbnRzKVxuICAgKi9cbiAgcmVhZG9ubHkgaWQ6IG51bWJlcjtcblxuICAvKiogUmVuZGVyZXIgdG8gYmUgdXNlZCBmb3IgdGhpcyB2aWV3LiAqL1xuICByZWFkb25seSByZW5kZXJlcjogUmVuZGVyZXIzO1xuXG4gIC8qKlxuICAgKiBUaGUgYmluZGluZyBzdGFydCBpbmRleCBpcyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIG5vZGVzIGFycmF5XG4gICAqIHN0YXJ0cyB0byBzdG9yZSBiaW5kaW5ncyBvbmx5LiBTYXZpbmcgdGhpcyB2YWx1ZSBlbnN1cmVzIHRoYXQgd2VcbiAgICogd2lsbCBiZWdpbiByZWFkaW5nIGJpbmRpbmdzIGF0IHRoZSBjb3JyZWN0IHBvaW50IGluIHRoZSBhcnJheSB3aGVuXG4gICAqIHdlIGFyZSBpbiB1cGRhdGUgbW9kZS5cbiAgICovXG4gIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBiaW5kaW5nIGluZGV4IHdlIHNob3VsZCBhY2Nlc3MgbmV4dC5cbiAgICpcbiAgICogVGhpcyBpcyBzdG9yZWQgc28gdGhhdCBiaW5kaW5ncyBjYW4gY29udGludWUgd2hlcmUgdGhleSBsZWZ0IG9mZlxuICAgKiBpZiBhIHZpZXcgaXMgbGVmdCBtaWR3YXkgdGhyb3VnaCBwcm9jZXNzaW5nIGJpbmRpbmdzIChlLmcuIGlmIHRoZXJlIGlzXG4gICAqIGEgc2V0dGVyIHRoYXQgY3JlYXRlcyBhbiBlbWJlZGRlZCB2aWV3LCBsaWtlIGluIG5nSWYpLlxuICAgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICAgKiB1bnN1YnNjcmliZWQuIFRoaXMgY2xlYW51cCBhcnJheSBzdG9yZXMgYm90aCBsaXN0ZW5lciBkYXRhIChpbiBjaHVua3Mgb2YgNClcbiAgICogYW5kIG91dHB1dCBkYXRhIChpbiBjaHVua3Mgb2YgMikgZm9yIGEgcGFydGljdWxhciB2aWV3LiBDb21iaW5pbmcgdGhlIGFycmF5c1xuICAgKiBzYXZlcyBvbiBtZW1vcnkgKDcwIGJ5dGVzIHBlciBhcnJheSkgYW5kIG9uIGEgZmV3IGJ5dGVzIG9mIGNvZGUgc2l6ZSAoZm9yIHR3b1xuICAgKiBzZXBhcmF0ZSBmb3IgbG9vcHMpLlxuICAgKlxuICAgKiBJZiBpdCdzIGEgbGlzdGVuZXIgYmVpbmcgc3RvcmVkOlxuICAgKiAxc3QgaW5kZXggaXM6IGV2ZW50IG5hbWUgdG8gcmVtb3ZlXG4gICAqIDJuZCBpbmRleCBpczogbmF0aXZlIGVsZW1lbnRcbiAgICogM3JkIGluZGV4IGlzOiBsaXN0ZW5lciBmdW5jdGlvblxuICAgKiA0dGggaW5kZXggaXM6IHVzZUNhcHR1cmUgYm9vbGVhblxuICAgKlxuICAgKiBJZiBpdCdzIGFuIG91dHB1dCBzdWJzY3JpcHRpb246XG4gICAqIDFzdCBpbmRleCBpczogdW5zdWJzY3JpYmUgZnVuY3Rpb25cbiAgICogMm5kIGluZGV4IGlzOiBjb250ZXh0IGZvciBmdW5jdGlvblxuICAgKi9cbiAgY2xlYW51cDogYW55W118bnVsbDtcblxuICAvKipcbiAgICogVGhpcyBudW1iZXIgdHJhY2tzIHRoZSBuZXh0IGxpZmVjeWNsZSBob29rIHRoYXQgbmVlZHMgdG8gYmUgcnVuLlxuICAgKlxuICAgKiBJZiBsaWZlY3ljbGVTdGFnZSA9PT0gTGlmZWN5Y2xlU3RhZ2UuT05fSU5JVCwgdGhlIGluaXQgaG9va3MgaGF2ZW4ndCB5ZXQgYmVlbiBydW5cbiAgICogYW5kIHNob3VsZCBiZSBleGVjdXRlZCBieSB0aGUgZmlyc3QgcigpIGluc3RydWN0aW9uIHRoYXQgcnVucyBPUiB0aGUgZmlyc3RcbiAgICogY1IoKSBpbnN0cnVjdGlvbiB0aGF0IHJ1bnMgKHNvIGluaXRzIGFyZSBydW4gZm9yIHRoZSB0b3AgbGV2ZWwgdmlldyBiZWZvcmUgYW55XG4gICAqIGVtYmVkZGVkIHZpZXdzKS5cbiAgICpcbiAgICogSWYgbGlmZWN5Y2xlU3RhZ2UgPT09IExpZmVjeWNsZVN0YWdlLkNPTlRFTlRfSU5JVCwgdGhlIGluaXQgaG9va3MgaGF2ZSBiZWVuIHJ1biwgYnV0XG4gICAqIHRoZSBjb250ZW50IGhvb2tzIGhhdmUgbm90IHlldCBiZWVuIHJ1bi4gVGhleSBzaG91bGQgYmUgZXhlY3V0ZWQgb24gdGhlIGZpcnN0XG4gICAqIHIoKSBpbnN0cnVjdGlvbiB0aGF0IHJ1bnMuXG4gICAqXG4gICAqIElmIGxpZmVjeWNsZVN0YWdlID09PSBMaWZlY3ljbGVTdGFnZS5WSUVXX0lOSVQsIGJvdGggdGhlIGluaXQgaG9va3MgYW5kIGNvbnRlbnQgaG9va3NcbiAgICogaGF2ZSBhbHJlYWR5IGJlZW4gcnVuLlxuICAgKi9cbiAgbGlmZWN5Y2xlU3RhZ2U6IExpZmVjeWNsZVN0YWdlO1xuXG4gIC8qKlxuICAgKiBUaGUgZmlyc3QgTFZpZXcgb3IgTENvbnRhaW5lciBiZW5lYXRoIHRoaXMgTFZpZXcgaW4gdGhlIGhpZXJhcmNoeS5cbiAgICpcbiAgICogTmVjZXNzYXJ5IHRvIHN0b3JlIHRoaXMgc28gdmlld3MgY2FuIHRyYXZlcnNlIHRocm91Z2ggdGhlaXIgbmVzdGVkIHZpZXdzXG4gICAqIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAgICpcbiAgICogRm9yIGVtYmVkZGVkIHZpZXdzLCB3ZSBzdG9yZSB0aGUgTENvbnRhaW5lciByYXRoZXIgdGhhbiB0aGUgZmlyc3QgVmlld1N0YXRlXG4gICAqIHRvIGF2b2lkIG1hbmFnaW5nIHNwbGljaW5nIHdoZW4gdmlld3MgYXJlIGFkZGVkL3JlbW92ZWQuXG4gICAqL1xuICBjaGlsZDogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBMVmlldyBvciBMQ29udGFpbmVyIGJlbmVhdGggdGhpcyBMVmlldyBpbiB0aGUgaGllcmFyY2h5LlxuICAgKlxuICAgKiBUaGUgdGFpbCBhbGxvd3MgdXMgdG8gcXVpY2tseSBhZGQgYSBuZXcgc3RhdGUgdG8gdGhlIGVuZCBvZiB0aGUgdmlldyBsaXN0XG4gICAqIHdpdGhvdXQgaGF2aW5nIHRvIHByb3BhZ2F0ZSBzdGFydGluZyBmcm9tIHRoZSBmaXJzdCBjaGlsZC5cbiAgICovXG4gIHRhaWw6IExWaWV3fExDb250YWluZXJ8bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgc2libGluZyBMVmlldyBvciBMQ29udGFpbmVyLlxuICAgKlxuICAgKiBBbGxvd3MgdXMgdG8gcHJvcGFnYXRlIGJldHdlZW4gc2libGluZyB2aWV3IHN0YXRlcyB0aGF0IGFyZW4ndCBpbiB0aGUgc2FtZVxuICAgKiBjb250YWluZXIuIEVtYmVkZGVkIHZpZXdzIGFscmVhZHkgaGF2ZSBhIG5vZGUubmV4dCwgYnV0IGl0IGlzIG9ubHkgc2V0IGZvclxuICAgKiB2aWV3cyBpbiB0aGUgc2FtZSBjb250YWluZXIuIFdlIG5lZWQgYSB3YXkgdG8gbGluayBjb21wb25lbnQgdmlld3MgYW5kIHZpZXdzXG4gICAqIGFjcm9zcyBjb250YWluZXJzIGFzIHdlbGwuXG4gICAqL1xuICBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoaXMgYXJyYXkgc3RvcmVzIGFsbCBlbGVtZW50L3RleHQvY29udGFpbmVyIG5vZGVzIGNyZWF0ZWQgaW5zaWRlIHRoaXMgdmlld1xuICAgKiBhbmQgdGhlaXIgYmluZGluZ3MuIFN0b3JlZCBhcyBhbiBhcnJheSByYXRoZXIgdGhhbiBhIGxpbmtlZCBsaXN0IHNvIHdlIGNhblxuICAgKiBsb29rIHVwIG5vZGVzIGRpcmVjdGx5IGluIHRoZSBjYXNlIG9mIGZvcndhcmQgZGVjbGFyYXRpb24gb3IgYmluZGluZ3NcbiAgICogKGUuZy4gRSgxKSkuXG4gICAqXG4gICAqIEFsbCBiaW5kaW5ncyBmb3IgYSBnaXZlbiB2aWV3IGFyZSBzdG9yZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHRoZXlcbiAgICogYXBwZWFyIGluIHRoZSB0ZW1wbGF0ZSwgc3RhcnRpbmcgd2l0aCBgYmluZGluZ1N0YXJ0SW5kZXhgLlxuICAgKiBXZSB1c2UgYGJpbmRpbmdJbmRleGAgdG8gaW50ZXJuYWxseSBrZWVwIHRyYWNrIG9mIHdoaWNoIGJpbmRpbmdcbiAgICogaXMgY3VycmVudGx5IGFjdGl2ZS5cbiAgICovXG4gIHJlYWRvbmx5IGRhdGE6IGFueVtdO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gICAqXG4gICAqIFRoZXNlIG11c3QgYmUgc3RvcmVkIHNlcGFyYXRlbHkgZnJvbSBMTm9kZXMgYmVjYXVzZSB0aGVpciBwcmVzZW5jZSBpc1xuICAgKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICAgKi9cbiAgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIHZpZXcuIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhpcyBzbyB3ZSBjYW4gZWFzaWx5IHdhbGsgdXAgdGhlXG4gICAqIG5vZGUgdHJlZSBpbiBESSBhbmQgZ2V0IHRoZSBUVmlldy5kYXRhIGFycmF5IGFzc29jaWF0ZWQgd2l0aCBhIG5vZGUgKHdoZXJlIHRoZVxuICAgKiBkaXJlY3RpdmUgZGVmcyBhcmUgc3RvcmVkKS5cbiAgICovXG4gIHRWaWV3OiBUVmlldztcblxuICAvKipcbiAgICogRm9yIGR5bmFtaWNhbGx5IGluc2VydGVkIHZpZXdzLCB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gdG8gcmVmcmVzaCB0aGUgdmlldy5cbiAgICovXG4gIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbDtcblxuICAvKipcbiAgICogLSBGb3IgZW1iZWRkZWQgdmlld3MsIHRoZSBjb250ZXh0IHdpdGggd2hpY2ggdG8gcmVuZGVyIHRoZSB0ZW1wbGF0ZS5cbiAgICogLSBGb3Igcm9vdCB2aWV3IG9mIHRoZSByb290IGNvbXBvbmVudCB0aGUgY29udGV4dCBjb250YWlucyBjaGFuZ2UgZGV0ZWN0aW9uIGRhdGEuXG4gICAqIC0gYG51bGxgIG90aGVyd2lzZS5cbiAgICovXG4gIGNvbnRleHQ6IHt9fFJvb3RDb250ZXh0fG51bGw7XG5cbiAgLyoqXG4gICAqIFF1ZXJpZXMgYWN0aXZlIGZvciB0aGlzIHZpZXcgLSBub2RlcyBmcm9tIGEgdmlldyBhcmUgcmVwb3J0ZWQgdG8gdGhvc2UgcXVlcmllc1xuICAgKi9cbiAgcXVlcmllczogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogQW4gb3B0aW9uYWwgTW9kdWxlIEluamVjdG9yIHRvIGJlIHVzZWQgYXMgZmFsbCBiYWNrIGFmdGVyIEVsZW1lbnQgSW5qZWN0b3JzIGFyZSBjb25zdWx0ZWQuXG4gICAqL1xuICBpbmplY3RvcjogSW5qZWN0b3J8bnVsbDtcblxuICAvKipcbiAgICogQW4gb3B0aW9uYWwgY3VzdG9tIHNhbml0aXplclxuICAgKi9cbiAgc2FuaXRpemVyOiBTYW5pdGl6ZXJ8bnVsbDtcbn1cblxuLyoqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCBhbiBMVmlldyAoc2F2ZWQgaW4gTFZpZXcuZmxhZ3MpICovXG5leHBvcnQgY29uc3QgZW51bSBMVmlld0ZsYWdzIHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSB2aWV3IGlzIGluIGNyZWF0aW9uTW9kZS5cbiAgICpcbiAgICogVGhpcyBtdXN0IGJlIHN0b3JlZCBpbiB0aGUgdmlldyByYXRoZXIgdGhhbiB1c2luZyBgZGF0YWAgYXMgYSBtYXJrZXIgc28gdGhhdFxuICAgKiB3ZSBjYW4gcHJvcGVybHkgc3VwcG9ydCBlbWJlZGRlZCB2aWV3cy4gT3RoZXJ3aXNlLCB3aGVuIGV4aXRpbmcgYSBjaGlsZCB2aWV3XG4gICAqIGJhY2sgaW50byB0aGUgcGFyZW50IHZpZXcsIGBkYXRhYCB3aWxsIGJlIGRlZmluZWQgYW5kIGBjcmVhdGlvbk1vZGVgIHdpbGwgYmVcbiAgICogaW1wcm9wZXJseSByZXBvcnRlZCBhcyBmYWxzZS5cbiAgICovXG4gIENyZWF0aW9uTW9kZSA9IDBiMDAwMSxcblxuICAvKiogV2hldGhlciB0aGlzIHZpZXcgaGFzIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneSAoY2hlY2tzIGFsd2F5cykgb3Igb25QdXNoICovXG4gIENoZWNrQWx3YXlzID0gMGIwMDEwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGRpcnR5IChuZWVkaW5nIGNoZWNrKSAqL1xuICBEaXJ0eSA9IDBiMDEwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBhdHRhY2hlZCB0byBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuICovXG4gIEF0dGFjaGVkID0gMGIxMDAwLFxufVxuXG4vKiogSW50ZXJmYWNlIG5lY2Vzc2FyeSB0byB3b3JrIHdpdGggdmlldyB0cmVlIHRyYXZlcnNhbCAqL1xuZXhwb3J0IGludGVyZmFjZSBMVmlld09yTENvbnRhaW5lciB7XG4gIG5leHQ6IExWaWV3fExDb250YWluZXJ8bnVsbDtcbiAgY2hpbGQ/OiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG4gIHZpZXdzPzogTFZpZXdOb2RlW107XG4gIHBhcmVudDogTFZpZXd8bnVsbDtcbn1cblxuLyoqXG4gKiBUaGUgc3RhdGljIGRhdGEgZm9yIGFuIExWaWV3IChzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIG9mIGFcbiAqIGdpdmVuIHR5cGUpLlxuICpcbiAqIFN0b3JlZCBvbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gYXMgbmdQcml2YXRlRGF0YS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlldyB7XG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgVE5vZGVgIHRoYXQgcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdmlldy5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhIGBUTm9kZWAgZm9yIGFuIGBMVmlld05vZGVgLCB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgYSBjb250YWluZXIuXG4gICAqIFdlIG5lZWQgdGhpcyBwb2ludGVyIHRvIGJlIGFibGUgdG8gZWZmaWNpZW50bHkgZmluZCB0aGlzIG5vZGUgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXdcbiAgICogaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVE5vZGVgIGZvciBhbiBgTEVsZW1lbnROb2RlYCwgdGhpcyBpcyB0aGUgVFZpZXcgb2YgYSBjb21wb25lbnQuXG4gICAqL1xuICBub2RlOiBUTm9kZTtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB0ZW1wbGF0ZSBoYXMgYmVlbiBwcm9jZXNzZWQuICovXG4gIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuO1xuXG4gIC8qKiBTdGF0aWMgZGF0YSBlcXVpdmFsZW50IG9mIExWaWV3LmRhdGFbXS4gQ29udGFpbnMgVE5vZGVzLiAqL1xuICBkYXRhOiBURGF0YTtcblxuICAvKipcbiAgICogU2VsZWN0b3IgbWF0Y2hlcyBmb3IgYSBub2RlIGFyZSB0ZW1wb3JhcmlseSBjYWNoZWQgb24gdGhlIFRWaWV3IHNvIHRoZVxuICAgKiBESSBzeXN0ZW0gY2FuIGVhZ2VybHkgaW5zdGFudGlhdGUgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlIGlmIHRoZXkgYXJlXG4gICAqIGNyZWF0ZWQgb3V0IG9mIG9yZGVyLiBUaGV5IGFyZSBvdmVyd3JpdHRlbiBhZnRlciBlYWNoIG5vZGUuXG4gICAqXG4gICAqIDxkaXYgZGlyQSBkaXJCPjwvZGl2PlxuICAgKlxuICAgKiBlLmcuIERpckEgaW5qZWN0cyBEaXJCLCBidXQgRGlyQSBpcyBjcmVhdGVkIGZpcnN0LiBESSBzaG91bGQgaW5zdGFudGlhdGVcbiAgICogRGlyQiB3aGVuIGl0IGZpbmRzIHRoYXQgaXQncyBvbiB0aGUgc2FtZSBub2RlLCBidXQgbm90IHlldCBjcmVhdGVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBkZWZzXG4gICAqIE9kZCBpbmRpY2VzOlxuICAgKiAgIC0gTnVsbCBpZiB0aGUgYXNzb2NpYXRlZCBkaXJlY3RpdmUgaGFzbid0IGJlZW4gaW5zdGFudGlhdGVkIHlldFxuICAgKiAgIC0gRGlyZWN0aXZlIGluZGV4LCBpZiBhc3NvY2lhdGVkIGRpcmVjdGl2ZSBoYXMgYmVlbiBjcmVhdGVkXG4gICAqICAgLSBTdHJpbmcsIHRlbXBvcmFyeSAnQ0lSQ1VMQVInIHRva2VuIHNldCB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkXG4gICAqL1xuICBjdXJyZW50TWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIERpcmVjdGl2ZSBhbmQgY29tcG9uZW50IGRlZnMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBtYXRjaGVkIHRvIG5vZGVzIG9uXG4gICAqIHRoaXMgdmlldy5cbiAgICpcbiAgICogRGVmcyBhcmUgc3RvcmVkIGF0IHRoZSBzYW1lIGluZGV4IGluIFRWaWV3LmRpcmVjdGl2ZXNbXSBhcyB0aGVpciBpbnN0YW5jZXNcbiAgICogYXJlIHN0b3JlZCBpbiBMVmlldy5kaXJlY3RpdmVzW10uIFRoaXMgc2ltcGxpZmllcyBsb29rdXAgaW4gREkuXG4gICAqL1xuICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bGwgcmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uSW5pdCBhbmQgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGluaXRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZFxuICAgKiBmb3IgdGhpcyB2aWV3IGluIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluIHVwZGF0ZVxuICAgKiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJWaWV3SW5pdCBhbmQgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvclxuICAgKiB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkRlc3Ryb3kgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgd2hlbiB0aGlzIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBwaXBlIG5nT25EZXN0cm95IGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIHdoZW4gdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBJbmRleCBvZiBwaXBlIGluIGRhdGFcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICpcbiAgICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIGRpcmVjdGl2ZSBkZXN0cm95IGhvb2tzIGJlY2F1c2UgdGhlaXIgY29udGV4dHNcbiAgICogYXJlIHN0b3JlZCBpbiBkYXRhLlxuICAgKi9cbiAgcGlwZURlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGRpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciBjaGlsZCBjb21wb25lbnRzIHRoYXQgd2lsbCBuZWVkIHRvIGJlXG4gICAqIHJlZnJlc2hlZCB3aGVuIHRoZSBjdXJyZW50IHZpZXcgaGFzIGZpbmlzaGVkIGl0cyBjaGVjay5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kaWNlc1xuICAgKiBPZGQgaW5kaWNlczogRWxlbWVudCBpbmRpY2VzXG4gICAqL1xuICBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgaW5kaWNlcyBmb3IgY2hpbGQgZGlyZWN0aXZlcyB0aGF0IGhhdmUgaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kaWNlc1xuICAgKiBPZGQgaW5kaWNlczogRWxlbWVudCBpbmRpY2VzXG4gICAqL1xuICBob3N0QmluZGluZ3M6IG51bWJlcltdfG51bGw7XG59XG5cbi8qKlxuICogUm9vdENvbnRleHQgY29udGFpbnMgaW5mb3JtYXRpb24gd2hpY2ggaXMgc2hhcmVkIGZvciBhbGwgY29tcG9uZW50cyB3aGljaFxuICogd2VyZSBib290c3RyYXBwZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb290Q29udGV4dCB7XG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHVzZWQgZm9yIHNjaGVkdWxpbmcgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgZnV0dXJlLiBVc3VhbGx5XG4gICAqIHRoaXMgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gICAqL1xuICBzY2hlZHVsZXI6ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCB3aGVuIGFsbCBjb21wb25lbnRzIGFyZSBjb25zaWRlcmVkIGNsZWFuIChub3QgZGlydHkpLlxuICAgKlxuICAgKiBUaGlzIHByb21pc2UgaXMgb3ZlcndyaXR0ZW4gZXZlcnkgdGltZSBhIGZpcnN0IGNhbGwgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gaXMgaW52b2tlZC5cbiAgICovXG4gIGNsZWFuOiBQcm9taXNlPG51bGw+O1xuXG4gIC8qKlxuICAgKiBSb290Q29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB3aGljaCB3YXMgaW5zdGFudGlhdGVkIGJ5IHRoZSBjYWxsIHRvXG4gICAqIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICAgKi9cbiAgY29tcG9uZW50OiB7fTtcbn1cblxuLyoqXG4gKiBBcnJheSBvZiBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgYSB2aWV3IGFuZCB0aGVpciBkaXJlY3RpdmUgaW5kaWNlcy5cbiAqXG4gKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IHR5cGUgSG9va0RhdGEgPSAobnVtYmVyIHwgKCgpID0+IHZvaWQpKVtdO1xuXG4vKiogUG9zc2libGUgdmFsdWVzIG9mIExWaWV3LmxpZmVjeWNsZVN0YWdlLCB1c2VkIHRvIGRldGVybWluZSB3aGljaCBob29rcyB0byBydW4uICAqL1xuLy8gVE9ETzogUmVtb3ZlIHRoaXMgZW51bSB3aGVuIGNvbnRhaW5lclJlZnJlc2ggaW5zdHJ1Y3Rpb25zIGFyZSByZW1vdmVkXG5leHBvcnQgY29uc3QgZW51bSBMaWZlY3ljbGVTdGFnZSB7XG5cbiAgLyogSW5pdCBob29rcyBuZWVkIHRvIGJlIHJ1biwgaWYgYW55LiAqL1xuICBJbml0ID0gMSxcblxuICAvKiBDb250ZW50IGhvb2tzIG5lZWQgdG8gYmUgcnVuLCBpZiBhbnkuIEluaXQgaG9va3MgaGF2ZSBhbHJlYWR5IHJ1bi4gKi9cbiAgQWZ0ZXJJbml0ID0gMixcbn1cblxuLyoqXG4gKiBTdGF0aWMgZGF0YSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpbnN0YW5jZS1zcGVjaWZpYyBkYXRhIGFycmF5IG9uIGFuIExWaWV3LlxuICpcbiAqIEVhY2ggbm9kZSdzIHN0YXRpYyBkYXRhIGlzIHN0b3JlZCBpbiB0RGF0YSBhdCB0aGUgc2FtZSBpbmRleCB0aGF0IGl0J3Mgc3RvcmVkXG4gKiBpbiB0aGUgZGF0YSBhcnJheS4gRWFjaCBwaXBlJ3MgZGVmaW5pdGlvbiBpcyBzdG9yZWQgaGVyZSBhdCB0aGUgc2FtZSBpbmRleFxuICogYXMgaXRzIHBpcGUgaW5zdGFuY2UgaW4gdGhlIGRhdGEgYXJyYXkuIEFueSBub2RlcyB0aGF0IGRvIG5vdCBoYXZlIHN0YXRpY1xuICogZGF0YSBzdG9yZSBhIG51bGwgdmFsdWUgaW4gdERhdGEgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKi9cbmV4cG9ydCB0eXBlIFREYXRhID0gKFROb2RlIHwgUGlwZURlZjxhbnk+fCBudWxsKVtdO1xuXG4vKiogVHlwZSBmb3IgVFZpZXcuY3VycmVudE1hdGNoZXMgKi9cbmV4cG9ydCB0eXBlIEN1cnJlbnRNYXRjaGVzTGlzdCA9IFtEaXJlY3RpdmVEZWY8YW55PiwgKHN0cmluZyB8IG51bWJlciB8IG51bGwpXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==