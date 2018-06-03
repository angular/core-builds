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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQThhQSxNQUFNLENBQUMsdUJBQU0sNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcblxuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWYsIFBpcGVEZWZMaXN0fSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMRWxlbWVudE5vZGUsIExWaWV3Tm9kZSwgVE5vZGV9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7UmVuZGVyZXIzfSBmcm9tICcuL3JlbmRlcmVyJztcblxuXG5cbi8qKlxuICogYExWaWV3YCBzdG9yZXMgYWxsIG9mIHRoZSBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcHJvY2VzcyB0aGUgaW5zdHJ1Y3Rpb25zIGFzXG4gKiB0aGV5IGFyZSBpbnZva2VkIGZyb20gdGhlIHRlbXBsYXRlLiBFYWNoIGVtYmVkZGVkIHZpZXcgYW5kIGNvbXBvbmVudCB2aWV3IGhhcyBpdHNcbiAqIG93biBgTFZpZXdgLiBXaGVuIHByb2Nlc3NpbmcgYSBwYXJ0aWN1bGFyIHZpZXcsIHdlIHNldCB0aGUgYGN1cnJlbnRWaWV3YCB0byB0aGF0XG4gKiBgTFZpZXdgLiBXaGVuIHRoYXQgdmlldyBpcyBkb25lIHByb2Nlc3NpbmcsIHRoZSBgY3VycmVudFZpZXdgIGlzIHNldCBiYWNrIHRvXG4gKiB3aGF0ZXZlciB0aGUgb3JpZ2luYWwgYGN1cnJlbnRWaWV3YCB3YXMgYmVmb3JlICh0aGUgcGFyZW50IGBMVmlld2ApLlxuICpcbiAqIEtlZXBpbmcgc2VwYXJhdGUgc3RhdGUgZm9yIGVhY2ggdmlldyBmYWNpbGl0aWVzIHZpZXcgaW5zZXJ0aW9uIC8gZGVsZXRpb24sIHNvIHdlXG4gKiBkb24ndCBoYXZlIHRvIGVkaXQgdGhlIGRhdGEgYXJyYXkgYmFzZWQgb24gd2hpY2ggdmlld3MgYXJlIHByZXNlbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFZpZXcge1xuICAvKiogRmxhZ3MgZm9yIHRoaXMgdmlldyAoc2VlIExWaWV3RmxhZ3MgZm9yIGRlZmluaXRpb24gb2YgZWFjaCBiaXQpLiAqL1xuICBmbGFnczogTFZpZXdGbGFncztcblxuICAvKipcbiAgICogVGhlIHBhcmVudCB2aWV3IGlzIG5lZWRlZCB3aGVuIHdlIGV4aXQgdGhlIHZpZXcgYW5kIG11c3QgcmVzdG9yZSB0aGUgcHJldmlvdXNcbiAgICogYExWaWV3YC4gV2l0aG91dCB0aGlzLCB0aGUgcmVuZGVyIG1ldGhvZCB3b3VsZCBoYXZlIHRvIGtlZXAgYSBzdGFjayBvZlxuICAgKiB2aWV3cyBhcyBpdCBpcyByZWN1cnNpdmVseSByZW5kZXJpbmcgdGVtcGxhdGVzLlxuICAgKi9cbiAgcmVhZG9ubHkgcGFyZW50OiBMVmlld3xudWxsO1xuXG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgTFZpZXdOb2RlYCBvciBgTEVsZW1lbnROb2RlYCB3aGljaCByZXByZXNlbnRzIHRoZSByb290IG9mIHRoZSB2aWV3LlxuICAgKlxuICAgKiBJZiBgTFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLiBXZSBuZWVkIHRoaXMgdG8gYmUgYWJsZSB0b1xuICAgKiBlZmZpY2llbnRseSBmaW5kIHRoZSBgTFZpZXdOb2RlYCB3aGVuIGluc2VydGluZyB0aGUgdmlldyBpbnRvIGFuIGFuY2hvci5cbiAgICpcbiAgICogSWYgYExFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIExWaWV3IG9mIGEgY29tcG9uZW50LlxuICAgKi9cbiAgLy8gVE9ETyhrYXJhKTogUmVtb3ZlIHdoZW4gd2UgaGF2ZSBwYXJlbnQvY2hpbGQgb24gVE5vZGVzXG4gIHJlYWRvbmx5IG5vZGU6IExWaWV3Tm9kZXxMRWxlbWVudE5vZGU7XG5cbiAgLyoqXG4gICAqIElEIHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMgdmlldyBpcyB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgdmlld1xuICAgKiBpbiB0aGlzIHBvc2l0aW9uLiBJZiBpdCdzIG5vdCwgd2Uga25vdyB0aGlzIHZpZXcgbmVlZHMgdG8gYmUgaW5zZXJ0ZWRcbiAgICogYW5kIHRoZSBvbmUgdGhhdCBleGlzdHMgbmVlZHMgdG8gYmUgcmVtb3ZlZCAoZS5nLiBpZi9lbHNlIHN0YXRlbWVudHMpXG4gICAqL1xuICByZWFkb25seSBpZDogbnVtYmVyO1xuXG4gIC8qKiBSZW5kZXJlciB0byBiZSB1c2VkIGZvciB0aGlzIHZpZXcuICovXG4gIHJlYWRvbmx5IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5cbiAgLyoqXG4gICAqIFRoZSBiaW5kaW5nIGluZGV4IHdlIHNob3VsZCBhY2Nlc3MgbmV4dC5cbiAgICpcbiAgICogVGhpcyBpcyBzdG9yZWQgc28gdGhhdCBiaW5kaW5ncyBjYW4gY29udGludWUgd2hlcmUgdGhleSBsZWZ0IG9mZlxuICAgKiBpZiBhIHZpZXcgaXMgbGVmdCBtaWR3YXkgdGhyb3VnaCBwcm9jZXNzaW5nIGJpbmRpbmdzIChlLmcuIGlmIHRoZXJlIGlzXG4gICAqIGEgc2V0dGVyIHRoYXQgY3JlYXRlcyBhbiBlbWJlZGRlZCB2aWV3LCBsaWtlIGluIG5nSWYpLlxuICAgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICAgKiB1bnN1YnNjcmliZWQuIFRoaXMgY2xlYW51cCBhcnJheSBzdG9yZXMgYm90aCBsaXN0ZW5lciBkYXRhIChpbiBjaHVua3Mgb2YgNClcbiAgICogYW5kIG91dHB1dCBkYXRhIChpbiBjaHVua3Mgb2YgMikgZm9yIGEgcGFydGljdWxhciB2aWV3LiBDb21iaW5pbmcgdGhlIGFycmF5c1xuICAgKiBzYXZlcyBvbiBtZW1vcnkgKDcwIGJ5dGVzIHBlciBhcnJheSkgYW5kIG9uIGEgZmV3IGJ5dGVzIG9mIGNvZGUgc2l6ZSAoZm9yIHR3b1xuICAgKiBzZXBhcmF0ZSBmb3IgbG9vcHMpLlxuICAgKlxuICAgKiBJZiBpdCdzIGEgbGlzdGVuZXIgYmVpbmcgc3RvcmVkOlxuICAgKiAxc3QgaW5kZXggaXM6IGV2ZW50IG5hbWUgdG8gcmVtb3ZlXG4gICAqIDJuZCBpbmRleCBpczogbmF0aXZlIGVsZW1lbnRcbiAgICogM3JkIGluZGV4IGlzOiBsaXN0ZW5lciBmdW5jdGlvblxuICAgKiA0dGggaW5kZXggaXM6IHVzZUNhcHR1cmUgYm9vbGVhblxuICAgKlxuICAgKiBJZiBpdCdzIGFuIG91dHB1dCBzdWJzY3JpcHRpb246XG4gICAqIDFzdCBpbmRleCBpczogdW5zdWJzY3JpYmUgZnVuY3Rpb25cbiAgICogMm5kIGluZGV4IGlzOiBjb250ZXh0IGZvciBmdW5jdGlvblxuICAgKi9cbiAgY2xlYW51cDogYW55W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIGxhc3QgTFZpZXcgb3IgTENvbnRhaW5lciBiZW5lYXRoIHRoaXMgTFZpZXcgaW4gdGhlIGhpZXJhcmNoeS5cbiAgICpcbiAgICogVGhlIHRhaWwgYWxsb3dzIHVzIHRvIHF1aWNrbHkgYWRkIGEgbmV3IHN0YXRlIHRvIHRoZSBlbmQgb2YgdGhlIHZpZXcgbGlzdFxuICAgKiB3aXRob3V0IGhhdmluZyB0byBwcm9wYWdhdGUgc3RhcnRpbmcgZnJvbSB0aGUgZmlyc3QgY2hpbGQuXG4gICAqL1xuICB0YWlsOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgTFZpZXcgb3IgTENvbnRhaW5lci5cbiAgICpcbiAgICogQWxsb3dzIHVzIHRvIHByb3BhZ2F0ZSBiZXR3ZWVuIHNpYmxpbmcgdmlldyBzdGF0ZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIHNhbWVcbiAgICogY29udGFpbmVyLiBFbWJlZGRlZCB2aWV3cyBhbHJlYWR5IGhhdmUgYSBub2RlLm5leHQsIGJ1dCBpdCBpcyBvbmx5IHNldCBmb3JcbiAgICogdmlld3MgaW4gdGhlIHNhbWUgY29udGFpbmVyLiBXZSBuZWVkIGEgd2F5IHRvIGxpbmsgY29tcG9uZW50IHZpZXdzIGFuZCB2aWV3c1xuICAgKiBhY3Jvc3MgY29udGFpbmVycyBhcyB3ZWxsLlxuICAgKi9cbiAgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGlzIGFycmF5IHN0b3JlcyBhbGwgZWxlbWVudC90ZXh0L2NvbnRhaW5lciBub2RlcyBjcmVhdGVkIGluc2lkZSB0aGlzIHZpZXdcbiAgICogYW5kIHRoZWlyIGJpbmRpbmdzLiBTdG9yZWQgYXMgYW4gYXJyYXkgcmF0aGVyIHRoYW4gYSBsaW5rZWQgbGlzdCBzbyB3ZSBjYW5cbiAgICogbG9vayB1cCBub2RlcyBkaXJlY3RseSBpbiB0aGUgY2FzZSBvZiBmb3J3YXJkIGRlY2xhcmF0aW9uIG9yIGJpbmRpbmdzXG4gICAqIChlLmcuIEUoMSkpLlxuICAgKlxuICAgKiBBbGwgYmluZGluZ3MgZm9yIGEgZ2l2ZW4gdmlldyBhcmUgc3RvcmVkIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aGV5XG4gICAqIGFwcGVhciBpbiB0aGUgdGVtcGxhdGUsIHN0YXJ0aW5nIHdpdGggYGJpbmRpbmdTdGFydEluZGV4YC5cbiAgICogV2UgdXNlIGBiaW5kaW5nSW5kZXhgIHRvIGludGVybmFsbHkga2VlcCB0cmFjayBvZiB3aGljaCBiaW5kaW5nXG4gICAqIGlzIGN1cnJlbnRseSBhY3RpdmUuXG4gICAqL1xuICByZWFkb25seSBkYXRhOiBhbnlbXTtcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgZGlyZWN0aXZlIGluc3RhbmNlcyBpbiB0aGUgY3VycmVudCB2aWV3LlxuICAgKlxuICAgKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gTE5vZGVzIGJlY2F1c2UgdGhlaXIgcHJlc2VuY2UgaXNcbiAgICogdW5rbm93biBhdCBjb21waWxlLXRpbWUgYW5kIHRodXMgc3BhY2UgY2Fubm90IGJlIHJlc2VydmVkIGluIGRhdGFbXS5cbiAgICovXG4gIGRpcmVjdGl2ZXM6IGFueVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyB2aWV3LiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoaXMgc28gd2UgY2FuIGVhc2lseSB3YWxrIHVwIHRoZVxuICAgKiBub2RlIHRyZWUgaW4gREkgYW5kIGdldCB0aGUgVFZpZXcuZGF0YSBhcnJheSBhc3NvY2lhdGVkIHdpdGggYSBub2RlICh3aGVyZSB0aGVcbiAgICogZGlyZWN0aXZlIGRlZnMgYXJlIHN0b3JlZCkuXG4gICAqL1xuICB0VmlldzogVFZpZXc7XG5cbiAgLyoqXG4gICAqIEZvciBkeW5hbWljYWxseSBpbnNlcnRlZCB2aWV3cywgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIHRvIHJlZnJlc2ggdGhlIHZpZXcuXG4gICAqL1xuICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIC0gRm9yIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGV4dCB3aXRoIHdoaWNoIHRvIHJlbmRlciB0aGUgdGVtcGxhdGUuXG4gICAqIC0gRm9yIHJvb3QgdmlldyBvZiB0aGUgcm9vdCBjb21wb25lbnQgdGhlIGNvbnRleHQgY29udGFpbnMgY2hhbmdlIGRldGVjdGlvbiBkYXRhLlxuICAgKiAtIGBudWxsYCBvdGhlcndpc2UuXG4gICAqL1xuICBjb250ZXh0OiB7fXxSb290Q29udGV4dHxudWxsO1xuXG4gIC8qKlxuICAgKiBRdWVyaWVzIGFjdGl2ZSBmb3IgdGhpcyB2aWV3IC0gbm9kZXMgZnJvbSBhIHZpZXcgYXJlIHJlcG9ydGVkIHRvIHRob3NlIHF1ZXJpZXNcbiAgICovXG4gIHF1ZXJpZXM6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIE1vZHVsZSBJbmplY3RvciB0byBiZSB1c2VkIGFzIGZhbGwgYmFjayBhZnRlciBFbGVtZW50IEluamVjdG9ycyBhcmUgY29uc3VsdGVkLlxuICAgKi9cbiAgaW5qZWN0b3I6IEluamVjdG9yfG51bGw7XG5cbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGN1c3RvbSBzYW5pdGl6ZXJcbiAgICovXG4gIHNhbml0aXplcjogU2FuaXRpemVyfG51bGw7XG59XG5cbi8qKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggYW4gTFZpZXcgKHNhdmVkIGluIExWaWV3LmZsYWdzKSAqL1xuZXhwb3J0IGNvbnN0IGVudW0gTFZpZXdGbGFncyB7XG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgdmlldyBpcyBpbiBjcmVhdGlvbk1vZGUuXG4gICAqXG4gICAqIFRoaXMgbXVzdCBiZSBzdG9yZWQgaW4gdGhlIHZpZXcgcmF0aGVyIHRoYW4gdXNpbmcgYGRhdGFgIGFzIGEgbWFya2VyIHNvIHRoYXRcbiAgICogd2UgY2FuIHByb3Blcmx5IHN1cHBvcnQgZW1iZWRkZWQgdmlld3MuIE90aGVyd2lzZSwgd2hlbiBleGl0aW5nIGEgY2hpbGQgdmlld1xuICAgKiBiYWNrIGludG8gdGhlIHBhcmVudCB2aWV3LCBgZGF0YWAgd2lsbCBiZSBkZWZpbmVkIGFuZCBgY3JlYXRpb25Nb2RlYCB3aWxsIGJlXG4gICAqIGltcHJvcGVybHkgcmVwb3J0ZWQgYXMgZmFsc2UuXG4gICAqL1xuICBDcmVhdGlvbk1vZGUgPSAwYjAwMDAxLFxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgdmlldyBoYXMgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5IChjaGVja3MgYWx3YXlzKSBvciBvblB1c2ggKi9cbiAgQ2hlY2tBbHdheXMgPSAwYjAwMDEwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGRpcnR5IChuZWVkaW5nIGNoZWNrKSAqL1xuICBEaXJ0eSA9IDBiMDAxMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBjdXJyZW50bHkgYXR0YWNoZWQgdG8gY2hhbmdlIGRldGVjdGlvbiB0cmVlLiAqL1xuICBBdHRhY2hlZCA9IDBiMDEwMDAsXG5cbiAgLyoqXG4gICAqICBXaGV0aGVyIG9yIG5vdCB0aGUgaW5pdCBob29rcyBoYXZlIHJ1bi5cbiAgICpcbiAgICogSWYgb24sIHRoZSBpbml0IGhvb2tzIGhhdmVuJ3QgeWV0IGJlZW4gcnVuIGFuZCBzaG91bGQgYmUgZXhlY3V0ZWQgYnkgdGhlIGZpcnN0IGNvbXBvbmVudCB0aGF0XG4gICAqIHJ1bnMgT1IgdGhlIGZpcnN0IGNSKCkgaW5zdHJ1Y3Rpb24gdGhhdCBydW5zIChzbyBpbml0cyBhcmUgcnVuIGZvciB0aGUgdG9wIGxldmVsIHZpZXcgYmVmb3JlXG4gICAqIGFueSBlbWJlZGRlZCB2aWV3cykuXG4gICAqL1xuICBSdW5Jbml0ID0gMGIxMDAwMCxcbn1cblxuLyoqIEludGVyZmFjZSBuZWNlc3NhcnkgdG8gd29yayB3aXRoIHZpZXcgdHJlZSB0cmF2ZXJzYWwgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFZpZXdPckxDb250YWluZXIge1xuICBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG4gIHZpZXdzPzogTFZpZXdOb2RlW107XG4gIHRWaWV3PzogVFZpZXc7XG4gIHBhcmVudDogTFZpZXd8bnVsbDtcbn1cblxuLyoqXG4gKiBUaGUgc3RhdGljIGRhdGEgZm9yIGFuIExWaWV3IChzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIG9mIGFcbiAqIGdpdmVuIHR5cGUpLlxuICpcbiAqIFN0b3JlZCBvbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gYXMgbmdQcml2YXRlRGF0YS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlldyB7XG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgVE5vZGVgIHRoYXQgcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdmlldy5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhIGBUTm9kZWAgZm9yIGFuIGBMVmlld05vZGVgLCB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgYSBjb250YWluZXIuXG4gICAqIFdlIG5lZWQgdGhpcyBwb2ludGVyIHRvIGJlIGFibGUgdG8gZWZmaWNpZW50bHkgZmluZCB0aGlzIG5vZGUgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXdcbiAgICogaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVE5vZGVgIGZvciBhbiBgTEVsZW1lbnROb2RlYCwgdGhpcyBpcyB0aGUgVFZpZXcgb2YgYSBjb21wb25lbnQuXG4gICAqL1xuICBub2RlOiBUTm9kZTtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB0ZW1wbGF0ZSBoYXMgYmVlbiBwcm9jZXNzZWQuICovXG4gIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuO1xuXG4gIC8qKiBTdGF0aWMgZGF0YSBlcXVpdmFsZW50IG9mIExWaWV3LmRhdGFbXS4gQ29udGFpbnMgVE5vZGVzLiAqL1xuICBkYXRhOiBURGF0YTtcblxuICAvKipcbiAgICogVGhlIGJpbmRpbmcgc3RhcnQgaW5kZXggaXMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBkYXRhIGFycmF5XG4gICAqIHN0YXJ0cyB0byBzdG9yZSBiaW5kaW5ncyBvbmx5LiBTYXZpbmcgdGhpcyB2YWx1ZSBlbnN1cmVzIHRoYXQgd2VcbiAgICogd2lsbCBiZWdpbiByZWFkaW5nIGJpbmRpbmdzIGF0IHRoZSBjb3JyZWN0IHBvaW50IGluIHRoZSBhcnJheSB3aGVuXG4gICAqIHdlIGFyZSBpbiB1cGRhdGUgbW9kZS5cbiAgICovXG4gIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIHRoZSBob3N0IG5vZGUgb2YgdGhlIGZpcnN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluXG4gICAqIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIE5lY2Vzc2FyeSB0byBzdG9yZSB0aGlzIHNvIHZpZXdzIGNhbiB0cmF2ZXJzZSB0aHJvdWdoIHRoZWlyIG5lc3RlZCB2aWV3c1xuICAgKiB0byByZW1vdmUgbGlzdGVuZXJzIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gICAqXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3cywgd2Ugc3RvcmUgdGhlIGluZGV4IG9mIGFuIExDb250YWluZXIncyBob3N0IHJhdGhlciB0aGFuIHRoZSBmaXJzdFxuICAgKiBMVmlldyB0byBhdm9pZCBtYW5hZ2luZyBzcGxpY2luZyB3aGVuIHZpZXdzIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgKi9cbiAgY2hpbGRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTZWxlY3RvciBtYXRjaGVzIGZvciBhIG5vZGUgYXJlIHRlbXBvcmFyaWx5IGNhY2hlZCBvbiB0aGUgVFZpZXcgc28gdGhlXG4gICAqIERJIHN5c3RlbSBjYW4gZWFnZXJseSBpbnN0YW50aWF0ZSBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUgaWYgdGhleSBhcmVcbiAgICogY3JlYXRlZCBvdXQgb2Ygb3JkZXIuIFRoZXkgYXJlIG92ZXJ3cml0dGVuIGFmdGVyIGVhY2ggbm9kZS5cbiAgICpcbiAgICogPGRpdiBkaXJBIGRpckI+PC9kaXY+XG4gICAqXG4gICAqIGUuZy4gRGlyQSBpbmplY3RzIERpckIsIGJ1dCBEaXJBIGlzIGNyZWF0ZWQgZmlyc3QuIERJIHNob3VsZCBpbnN0YW50aWF0ZVxuICAgKiBEaXJCIHdoZW4gaXQgZmluZHMgdGhhdCBpdCdzIG9uIHRoZSBzYW1lIG5vZGUsIGJ1dCBub3QgeWV0IGNyZWF0ZWQuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGRlZnNcbiAgICogT2RkIGluZGljZXM6XG4gICAqICAgLSBOdWxsIGlmIHRoZSBhc3NvY2lhdGVkIGRpcmVjdGl2ZSBoYXNuJ3QgYmVlbiBpbnN0YW50aWF0ZWQgeWV0XG4gICAqICAgLSBEaXJlY3RpdmUgaW5kZXgsIGlmIGFzc29jaWF0ZWQgZGlyZWN0aXZlIGhhcyBiZWVuIGNyZWF0ZWRcbiAgICogICAtIFN0cmluZywgdGVtcG9yYXJ5ICdDSVJDVUxBUicgdG9rZW4gc2V0IHdoaWxlIGRlcGVuZGVuY2llcyBhcmUgYmVpbmcgcmVzb2x2ZWRcbiAgICovXG4gIGN1cnJlbnRNYXRjaGVzOiBDdXJyZW50TWF0Y2hlc0xpc3R8bnVsbDtcblxuICAvKipcbiAgICogRGlyZWN0aXZlIGFuZCBjb21wb25lbnQgZGVmcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIG1hdGNoZWQgdG8gbm9kZXMgb25cbiAgICogdGhpcyB2aWV3LlxuICAgKlxuICAgKiBEZWZzIGFyZSBzdG9yZWQgYXQgdGhlIHNhbWUgaW5kZXggaW4gVFZpZXcuZGlyZWN0aXZlc1tdIGFzIHRoZWlyIGluc3RhbmNlc1xuICAgKiBhcmUgc3RvcmVkIGluIExWaWV3LmRpcmVjdGl2ZXNbXS4gVGhpcyBzaW1wbGlmaWVzIGxvb2t1cCBpbiBESS5cbiAgICovXG4gIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSXQncyBuZWNlc3NhcnkgdG8ga2VlcCBhIGNvcHkgb2YgdGhlIGZ1bGwgZGVmIGxpc3Qgb24gdGhlIFRWaWV3IHNvIGl0J3MgcG9zc2libGVcbiAgICogdG8gcmVuZGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB3aXRob3V0IGEgaG9zdCBjb21wb25lbnQuXG4gICAqL1xuICBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBGdWxsIHJlZ2lzdHJ5IG9mIHBpcGVzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgUGlwZURlZnNgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBQaXBlRGVmc2BzLiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAgICpcbiAgICogSXQncyBuZWNlc3NhcnkgdG8ga2VlcCBhIGNvcHkgb2YgdGhlIGZ1bGwgZGVmIGxpc3Qgb24gdGhlIFRWaWV3IHNvIGl0J3MgcG9zc2libGVcbiAgICogdG8gcmVuZGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB3aXRob3V0IGEgaG9zdCBjb21wb25lbnQuXG4gICAqL1xuICBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nT25Jbml0IGFuZCBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgaW5pdEhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpbiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkXG4gICAqIGZvciB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlXG4gICAqIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdJbml0IGFuZCBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yXG4gICAqIHRoaXMgdmlldyBpbiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uRGVzdHJveSBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCB3aGVuIHRoaXMgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIHBpcGUgbmdPbkRlc3Ryb3kgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgd2hlbiB0aGlzIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IEluZGV4IG9mIHBpcGUgaW4gZGF0YVxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKlxuICAgKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gZGlyZWN0aXZlIGRlc3Ryb3kgaG9va3MgYmVjYXVzZSB0aGVpciBjb250ZXh0c1xuICAgKiBhcmUgc3RvcmVkIGluIGRhdGEuXG4gICAqL1xuICBwaXBlRGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgZGlyZWN0aXZlIGFuZCBlbGVtZW50IGluZGljZXMgZm9yIGNoaWxkIGNvbXBvbmVudHMgdGhhdCB3aWxsIG5lZWQgdG8gYmVcbiAgICogcmVmcmVzaGVkIHdoZW4gdGhlIGN1cnJlbnQgdmlldyBoYXMgZmluaXNoZWQgaXRzIGNoZWNrLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRpY2VzXG4gICAqIE9kZCBpbmRpY2VzOiBFbGVtZW50IGluZGljZXNcbiAgICovXG4gIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBpbmRpY2VzIGZvciBjaGlsZCBkaXJlY3RpdmVzIHRoYXQgaGF2ZSBob3N0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRpY2VzXG4gICAqIE9kZCBpbmRpY2VzOiBFbGVtZW50IGluZGljZXNcbiAgICovXG4gIGhvc3RCaW5kaW5nczogbnVtYmVyW118bnVsbDtcbn1cblxuLyoqXG4gKiBSb290Q29udGV4dCBjb250YWlucyBpbmZvcm1hdGlvbiB3aGljaCBpcyBzaGFyZWQgZm9yIGFsbCBjb21wb25lbnRzIHdoaWNoXG4gKiB3ZXJlIGJvb3RzdHJhcHBlZCB3aXRoIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJvb3RDb250ZXh0IHtcbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gdXNlZCBmb3Igc2NoZWR1bGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFVzdWFsbHlcbiAgICogdGhpcyBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYC5cbiAgICovXG4gIHNjaGVkdWxlcjogKHdvcmtGbjogKCkgPT4gdm9pZCkgPT4gdm9pZDtcblxuICAvKipcbiAgICogQSBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gYWxsIGNvbXBvbmVudHMgYXJlIGNvbnNpZGVyZWQgY2xlYW4gKG5vdCBkaXJ0eSkuXG4gICAqXG4gICAqIFRoaXMgcHJvbWlzZSBpcyBvdmVyd3JpdHRlbiBldmVyeSB0aW1lIGEgZmlyc3QgY2FsbCB0byB7QGxpbmsgbWFya0RpcnR5fSBpcyBpbnZva2VkLlxuICAgKi9cbiAgY2xlYW46IFByb21pc2U8bnVsbD47XG5cbiAgLyoqXG4gICAqIFJvb3RDb21wb25lbnQgLSBUaGUgY29tcG9uZW50IHdoaWNoIHdhcyBpbnN0YW50aWF0ZWQgYnkgdGhlIGNhbGwgdG9cbiAgICoge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gICAqL1xuICBjb21wb25lbnQ6IHt9O1xufVxuXG4vKipcbiAqIEFycmF5IG9mIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICovXG5leHBvcnQgdHlwZSBIb29rRGF0YSA9IChudW1iZXIgfCAoKCkgPT4gdm9pZCkpW107XG5cbi8qKlxuICogU3RhdGljIGRhdGEgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdGFuY2Utc3BlY2lmaWMgZGF0YSBhcnJheSBvbiBhbiBMVmlldy5cbiAqXG4gKiBFYWNoIG5vZGUncyBzdGF0aWMgZGF0YSBpcyBzdG9yZWQgaW4gdERhdGEgYXQgdGhlIHNhbWUgaW5kZXggdGhhdCBpdCdzIHN0b3JlZFxuICogaW4gdGhlIGRhdGEgYXJyYXkuIEVhY2ggcGlwZSdzIGRlZmluaXRpb24gaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXhcbiAqIGFzIGl0cyBwaXBlIGluc3RhbmNlIGluIHRoZSBkYXRhIGFycmF5LiBBbnkgbm9kZXMgdGhhdCBkbyBub3QgaGF2ZSBzdGF0aWNcbiAqIGRhdGEgc3RvcmUgYSBudWxsIHZhbHVlIGluIHREYXRhIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5LlxuICovXG5leHBvcnQgdHlwZSBURGF0YSA9IChUTm9kZSB8IFBpcGVEZWY8YW55PnwgbnVsbClbXTtcblxuLyoqIFR5cGUgZm9yIFRWaWV3LmN1cnJlbnRNYXRjaGVzICovXG5leHBvcnQgdHlwZSBDdXJyZW50TWF0Y2hlc0xpc3QgPSBbRGlyZWN0aXZlRGVmPGFueT4sIChzdHJpbmcgfCBudW1iZXIgfCBudWxsKV07XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=