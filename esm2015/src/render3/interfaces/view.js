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
// Below are constants for LView indices to help us look up LView members
// without having to remember the specific indices.
// Uglify will inline these when minifying so there shouldn't be a cost.
/** @type {?} */
export const TVIEW = 0;
/** @type {?} */
export const FLAGS = 1;
/** @type {?} */
export const PARENT = 2;
/** @type {?} */
export const NEXT = 3;
/** @type {?} */
export const QUERIES = 4;
/** @type {?} */
export const HOST = 5;
/** @type {?} */
export const HOST_NODE = 6;
// Rename to `T_HOST`?
/** @type {?} */
export const BINDING_INDEX = 7;
/** @type {?} */
export const CLEANUP = 8;
/** @type {?} */
export const CONTEXT = 9;
/** @type {?} */
export const INJECTOR = 10;
/** @type {?} */
export const RENDERER_FACTORY = 11;
/** @type {?} */
export const RENDERER = 12;
/** @type {?} */
export const SANITIZER = 13;
/** @type {?} */
export const TAIL = 14;
/** @type {?} */
export const CONTAINER_INDEX = 15;
/** @type {?} */
export const CONTENT_QUERIES = 16;
/** @type {?} */
export const DECLARATION_VIEW = 17;
/**
 * Size of LView's header. Necessary to adjust for it when setting slots.
 * @type {?}
 */
export const HEADER_OFFSET = 18;
/**
 * @record
 */
export function OpaqueViewState() { }
if (false) {
    /** @type {?} */
    OpaqueViewState.prototype.__brand__;
}
/**
 * `LView` stores all of the information needed to process the instructions as
 * they are invoked from the template. Each embedded view and component view has its
 * own `LView`. When processing a particular view, we set the `viewData` to that
 * `LView`. When that view is done processing, the `viewData` is set back to
 * whatever the original `viewData` was before (the parent `LView`).
 *
 * Keeping separate state for each view facilities view insertion / deletion, so we
 * don't have to edit the data array based on which views are present.
 * @record
 */
export function LView() { }
if (false) {
    /* Skipping unnamed member:
    readonly[TVIEW]: TView;*/
    /* Skipping unnamed member:
    [FLAGS]: LViewFlags;*/
    /* Skipping unnamed member:
    [PARENT]: LView|null;*/
    /* Skipping unnamed member:
    [NEXT]: LView|LContainer|null;*/
    /* Skipping unnamed member:
    [QUERIES]: LQueries|null;*/
    /* Skipping unnamed member:
    [HOST]: RElement|StylingContext|null;*/
    /* Skipping unnamed member:
    [HOST_NODE]: TViewNode|TElementNode|null;*/
    /* Skipping unnamed member:
    [BINDING_INDEX]: number;*/
    /* Skipping unnamed member:
    [CLEANUP]: any[]|null;*/
    /* Skipping unnamed member:
    [CONTEXT]: {}|RootContext|null;*/
    /* Skipping unnamed member:
    readonly[INJECTOR]: Injector|null;*/
    /* Skipping unnamed member:
    [RENDERER_FACTORY]: RendererFactory3;*/
    /* Skipping unnamed member:
    [RENDERER]: Renderer3;*/
    /* Skipping unnamed member:
    [SANITIZER]: Sanitizer|null;*/
    /* Skipping unnamed member:
    [TAIL]: LView|LContainer|null;*/
    /* Skipping unnamed member:
    [CONTAINER_INDEX]: number;*/
    /* Skipping unnamed member:
    [CONTENT_QUERIES]: QueryList<any>[]|null;*/
    /* Skipping unnamed member:
    [DECLARATION_VIEW]: LView|null;*/
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
    /**
     * Whether or not this LView instance is on its first processing pass.
     *
     * An LView instance is considered to be on its "first pass" until it
     * has completed one creation mode run and one update mode run. At this
     * time, the flag is turned off.
     */
    FirstLViewPass: 2,
    /** Whether this view has default change detection strategy (checks always) or onPush */
    CheckAlways: 4,
    /** Whether or not this view is currently dirty (needing check) */
    Dirty: 8,
    /** Whether or not this view is currently attached to change detection tree. */
    Attached: 16,
    /**
     *  Whether or not the init hooks have run.
     *
     * If on, the init hooks haven't yet been run and should be executed by the first component that
     * runs OR the first cR() instruction that runs (so inits are run for the top level view before
     * any embedded views).
     */
    RunInit: 32,
    /** Whether or not this view is destroyed. */
    Destroyed: 64,
    /** Whether or not this view is the root view */
    IsRoot: 128,
};
export { LViewFlags };
/**
 * The static data for an LView (shared between all templates of a
 * given type).
 *
 * Stored on the template function as ngPrivateData.
 * @record
 */
export function TView() { }
if (false) {
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
     * This is a blueprint used to generate LView instances for this TView. Copying this
     * blueprint is faster than creating a new LView from scratch.
     * @type {?}
     */
    TView.prototype.blueprint;
    /**
     * The template function used to refresh the view of dynamically created views
     * and components. Will be null for inline views.
     * @type {?}
     */
    TView.prototype.template;
    /**
     * A function containing query-related instructions.
     * @type {?}
     */
    TView.prototype.viewQuery;
    /**
     * Pointer to the `TNode` that represents the root of the view.
     *
     * If this is a `TViewNode` for an `LViewNode`, this is an embedded view of a container.
     * We need this pointer to be able to efficiently find this node when inserting the view
     * into an anchor.
     *
     * If this is a `TElementNode`, this is the view of a root component. It has exactly one
     * root TNode.
     *
     * If this is null, this is the view of a component that is not at root. We do not store
     * the host TNodes for child component views because they can potentially have several
     * different host TNodes, depending on where the component is being used. These host
     * TNodes cannot be shared (due to different indices, etc).
     * @type {?}
     */
    TView.prototype.node;
    /**
     * Whether or not this template has been processed.
     * @type {?}
     */
    TView.prototype.firstTemplatePass;
    /**
     * Static data equivalent of LView.data[]. Contains TNodes, PipeDefInternal or TI18n.
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
     * The index where the "expando" section of `LView` begins. The expando
     * section contains injectors, directive instances, and host binding values.
     * Unlike the "consts" and "vars" sections of `LView`, the length of this
     * section cannot be calculated at compile-time because directives are matched
     * at runtime to preserve locality.
     *
     * We store this start index so we know where to start checking host bindings
     * in `setHostBindings`.
     * @type {?}
     */
    TView.prototype.expandoStartIndex;
    /**
     * The index where the viewQueries section of `LView` begins. This section contains
     * view queries defined for a component/directive.
     *
     * We store this start index so we know where the list of view queries starts.
     * This is required when we invoke view queries at runtime. We invoke queries one by one and
     * increment query index after each iteration. This information helps us to reset index back to
     * the beginning of view query list before we invoke view queries again.
     * @type {?}
     */
    TView.prototype.viewQueryStartIndex;
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
     * A reference to the first child node located in the view.
     * @type {?}
     */
    TView.prototype.firstChild;
    /**
     * Set of instructions used to process host bindings efficiently.
     *
     * See VIEW_DATA.md for more information.
     * @type {?}
     */
    TView.prototype.expandoInstructions;
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
     * When a view is destroyed, listeners need to be released and outputs need to be
     * unsubscribed. This cleanup array stores both listener data (in chunks of 4)
     * and output data (in chunks of 2) for a particular view. Combining the arrays
     * saves on memory (70 bytes per array) and on a few bytes of code size (for two
     * separate for loops).
     *
     * If it's a native DOM listener or output subscription being stored:
     * 1st index is: event name  `name = tView.cleanup[i+0]`
     * 2nd index is: index of native element or a function that retrieves global target (window,
     *               document or body) reference based on the native element:
     *    `typeof idxOrTargetGetter === 'function'`: global target getter function
     *    `typeof idxOrTargetGetter === 'number'`: index of native element
     *
     * 3rd index is: index of listener function `listener = lView[CLEANUP][tView.cleanup[i+2]]`
     * 4th index is: `useCaptureOrIndx = tView.cleanup[i+3]`
     *    `typeof useCaptureOrIndx == 'boolean' : useCapture boolean
     *    `typeof useCaptureOrIndx == 'number':
     *         `useCaptureOrIndx >= 0` `removeListener = LView[CLEANUP][useCaptureOrIndx]`
     *         `useCaptureOrIndx <  0` `subscription = LView[CLEANUP][-useCaptureOrIndx]`
     *
     * If it's a renderer2 style listener or ViewRef destroy hook being stored:
     * 1st index is: index of the cleanup function in LView.cleanupInstances[]
     * 2nd index is: `null`
     *               `lView[CLEANUP][tView.cleanup[i+0]]()`
     *
     * If it's an output subscription or query list destroy hook:
     * 1st index is: output unsubscribe function / query list destroy function
     * 2nd index is: index of function context in LView.cleanupInstances[]
     *               `tView.cleanup[i+0].call(lView[CLEANUP][tView.cleanup[i+1]])`
     * @type {?}
     */
    TView.prototype.cleanup;
    /**
     * A list of element indices for child components that will need to be
     * refreshed when the current view has finished its check. These indices have
     * already been adjusted for the HEADER_OFFSET.
     *
     * @type {?}
     */
    TView.prototype.components;
    /**
     * A list of indices for child directives that have content queries.
     *
     * Even indices: Directive indices
     * Odd indices: Starting index of content queries (stored in CONTENT_QUERIES) for this directive
     * @type {?}
     */
    TView.prototype.contentQueries;
}
/** @enum {number} */
const RootContextFlags = {
    Empty: 0, DetectChanges: 1, FlushPlayers: 2,
};
export { RootContextFlags };
/**
 * RootContext contains information which is shared for all components which
 * were bootstrapped with {\@link renderComponent}.
 * @record
 */
export function RootContext() { }
if (false) {
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
     * RootComponents - The components that were instantiated by the call to
     * {\@link renderComponent}.
     * @type {?}
     */
    RootContext.prototype.components;
    /**
     * The player flushing handler to kick off all animations
     * @type {?}
     */
    RootContext.prototype.playerHandler;
    /**
     * What render-related operations to run once a scheduler has been set
     * @type {?}
     */
    RootContext.prototype.flags;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUM7O0FBQ3RCLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sSUFBSSxHQUFHLENBQUM7O0FBQ3JCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDOztBQUNyQixNQUFNLE9BQU8sU0FBUyxHQUFHLENBQUM7OztBQUMxQixNQUFNLE9BQU8sYUFBYSxHQUFHLENBQUM7O0FBQzlCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLE9BQU8sR0FBRyxDQUFDOztBQUN4QixNQUFNLE9BQU8sUUFBUSxHQUFHLEVBQUU7O0FBQzFCLE1BQU0sT0FBTyxnQkFBZ0IsR0FBRyxFQUFFOztBQUNsQyxNQUFNLE9BQU8sUUFBUSxHQUFHLEVBQUU7O0FBQzFCLE1BQU0sT0FBTyxTQUFTLEdBQUcsRUFBRTs7QUFDM0IsTUFBTSxPQUFPLElBQUksR0FBRyxFQUFFOztBQUN0QixNQUFNLE9BQU8sZUFBZSxHQUFHLEVBQUU7O0FBQ2pDLE1BQU0sT0FBTyxlQUFlLEdBQUcsRUFBRTs7QUFDakMsTUFBTSxPQUFPLGdCQUFnQixHQUFHLEVBQUU7Ozs7O0FBRWxDLE1BQU0sT0FBTyxhQUFhLEdBQUcsRUFBRTs7OztBQU0vQixxQ0FFQzs7O0lBREMsb0NBQWlFOzs7Ozs7Ozs7Ozs7O0FBY25FLDJCQWlKQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJQzs7Ozs7OztPQU9HO0lBQ0gsZUFBMEI7SUFFMUI7Ozs7OztPQU1HO0lBQ0gsaUJBQTRCO0lBRTVCLHdGQUF3RjtJQUN4RixjQUF5QjtJQUV6QixrRUFBa0U7SUFDbEUsUUFBbUI7SUFFbkIsK0VBQStFO0lBQy9FLFlBQXNCO0lBRXRCOzs7Ozs7T0FNRztJQUNILFdBQXFCO0lBRXJCLDZDQUE2QztJQUM3QyxhQUF1QjtJQUV2QixnREFBZ0Q7SUFDaEQsV0FBb0I7Ozs7Ozs7Ozs7QUFTdEIsMkJBeU9DOzs7Ozs7Ozs7O0lBak9DLG1CQUFvQjs7Ozs7O0lBTXBCLDBCQUFpQjs7Ozs7O0lBTWpCLHlCQUFxQzs7Ozs7SUFLckMsMEJBQW1DOzs7Ozs7Ozs7Ozs7Ozs7OztJQWlCbkMscUJBQWtDOzs7OztJQUdsQyxrQ0FBMkI7Ozs7O0lBRzNCLHFCQUFZOzs7Ozs7OztJQVFaLGtDQUEwQjs7Ozs7Ozs7Ozs7O0lBWTFCLGtDQUEwQjs7Ozs7Ozs7Ozs7SUFXMUIsb0NBQTRCOzs7Ozs7Ozs7Ozs7SUFZNUIsMkJBQW1COzs7OztJQUtuQiwyQkFBdUI7Ozs7Ozs7SUFPdkIsb0NBQW9FOzs7Ozs7OztJQVFwRSxrQ0FBeUM7Ozs7Ozs7Ozs7O0lBV3pDLDZCQUErQjs7Ozs7Ozs7O0lBUy9CLDBCQUF5Qjs7Ozs7Ozs7SUFRekIsMkJBQTBCOzs7Ozs7Ozs7SUFTMUIsNkJBQTRCOzs7Ozs7Ozs7SUFTNUIsa0NBQWlDOzs7Ozs7Ozs7SUFTakMsMEJBQXlCOzs7Ozs7Ozs7SUFTekIsK0JBQThCOzs7Ozs7OztJQVE5Qiw2QkFBNEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlDNUIsd0JBQW9COzs7Ozs7OztJQVFwQiwyQkFBMEI7Ozs7Ozs7O0lBUTFCLCtCQUE4Qjs7OztJQUdJLFFBQVksRUFBRSxnQkFBb0IsRUFBRSxlQUFtQjs7Ozs7Ozs7QUFPM0YsaUNBNkJDOzs7Ozs7O0lBeEJDLGdDQUF3Qzs7Ozs7OztJQU94Qyw0QkFBcUI7Ozs7OztJQU1yQixpQ0FBaUI7Ozs7O0lBS2pCLG9DQUFrQzs7Ozs7SUFLbEMsNEJBQXdCOzs7OztBQTRDMUIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uLy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi8uLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgUGlwZURlZiwgUGlwZURlZkxpc3R9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0kxOG5VcGRhdGVPcENvZGVzLCBUSTE4bn0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0fSBmcm9tICcuL3N0eWxpbmcnO1xuXG5cblxuLy8gQmVsb3cgYXJlIGNvbnN0YW50cyBmb3IgTFZpZXcgaW5kaWNlcyB0byBoZWxwIHVzIGxvb2sgdXAgTFZpZXcgbWVtYmVyc1xuLy8gd2l0aG91dCBoYXZpbmcgdG8gcmVtZW1iZXIgdGhlIHNwZWNpZmljIGluZGljZXMuXG4vLyBVZ2xpZnkgd2lsbCBpbmxpbmUgdGhlc2Ugd2hlbiBtaW5pZnlpbmcgc28gdGhlcmUgc2hvdWxkbid0IGJlIGEgY29zdC5cbmV4cG9ydCBjb25zdCBUVklFVyA9IDA7XG5leHBvcnQgY29uc3QgRkxBR1MgPSAxO1xuZXhwb3J0IGNvbnN0IFBBUkVOVCA9IDI7XG5leHBvcnQgY29uc3QgTkVYVCA9IDM7XG5leHBvcnQgY29uc3QgUVVFUklFUyA9IDQ7XG5leHBvcnQgY29uc3QgSE9TVCA9IDU7XG5leHBvcnQgY29uc3QgSE9TVF9OT0RFID0gNjsgIC8vIFJlbmFtZSB0byBgVF9IT1NUYD9cbmV4cG9ydCBjb25zdCBCSU5ESU5HX0lOREVYID0gNztcbmV4cG9ydCBjb25zdCBDTEVBTlVQID0gODtcbmV4cG9ydCBjb25zdCBDT05URVhUID0gOTtcbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IDEwO1xuZXhwb3J0IGNvbnN0IFJFTkRFUkVSX0ZBQ1RPUlkgPSAxMTtcbmV4cG9ydCBjb25zdCBSRU5ERVJFUiA9IDEyO1xuZXhwb3J0IGNvbnN0IFNBTklUSVpFUiA9IDEzO1xuZXhwb3J0IGNvbnN0IFRBSUwgPSAxNDtcbmV4cG9ydCBjb25zdCBDT05UQUlORVJfSU5ERVggPSAxNTtcbmV4cG9ydCBjb25zdCBDT05URU5UX1FVRVJJRVMgPSAxNjtcbmV4cG9ydCBjb25zdCBERUNMQVJBVElPTl9WSUVXID0gMTc7XG4vKiogU2l6ZSBvZiBMVmlldydzIGhlYWRlci4gTmVjZXNzYXJ5IHRvIGFkanVzdCBmb3IgaXQgd2hlbiBzZXR0aW5nIHNsb3RzLiAgKi9cbmV4cG9ydCBjb25zdCBIRUFERVJfT0ZGU0VUID0gMTg7XG5cblxuLy8gVGhpcyBpbnRlcmZhY2UgcmVwbGFjZXMgdGhlIHJlYWwgTFZpZXcgaW50ZXJmYWNlIGlmIGl0IGlzIGFuIGFyZyBvciBhXG4vLyByZXR1cm4gdmFsdWUgb2YgYSBwdWJsaWMgaW5zdHJ1Y3Rpb24uIFRoaXMgZW5zdXJlcyB3ZSBkb24ndCBuZWVkIHRvIGV4cG9zZVxuLy8gdGhlIGFjdHVhbCBpbnRlcmZhY2UsIHdoaWNoIHNob3VsZCBiZSBrZXB0IHByaXZhdGUuXG5leHBvcnQgaW50ZXJmYWNlIE9wYXF1ZVZpZXdTdGF0ZSB7XG4gICdfX2JyYW5kX18nOiAnQnJhbmQgZm9yIE9wYXF1ZVZpZXdTdGF0ZSB0aGF0IG5vdGhpbmcgd2lsbCBtYXRjaCc7XG59XG5cblxuLyoqXG4gKiBgTFZpZXdgIHN0b3JlcyBhbGwgb2YgdGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwcm9jZXNzIHRoZSBpbnN0cnVjdGlvbnMgYXNcbiAqIHRoZXkgYXJlIGludm9rZWQgZnJvbSB0aGUgdGVtcGxhdGUuIEVhY2ggZW1iZWRkZWQgdmlldyBhbmQgY29tcG9uZW50IHZpZXcgaGFzIGl0c1xuICogb3duIGBMVmlld2AuIFdoZW4gcHJvY2Vzc2luZyBhIHBhcnRpY3VsYXIgdmlldywgd2Ugc2V0IHRoZSBgdmlld0RhdGFgIHRvIHRoYXRcbiAqIGBMVmlld2AuIFdoZW4gdGhhdCB2aWV3IGlzIGRvbmUgcHJvY2Vzc2luZywgdGhlIGB2aWV3RGF0YWAgaXMgc2V0IGJhY2sgdG9cbiAqIHdoYXRldmVyIHRoZSBvcmlnaW5hbCBgdmlld0RhdGFgIHdhcyBiZWZvcmUgKHRoZSBwYXJlbnQgYExWaWV3YCkuXG4gKlxuICogS2VlcGluZyBzZXBhcmF0ZSBzdGF0ZSBmb3IgZWFjaCB2aWV3IGZhY2lsaXRpZXMgdmlldyBpbnNlcnRpb24gLyBkZWxldGlvbiwgc28gd2VcbiAqIGRvbid0IGhhdmUgdG8gZWRpdCB0aGUgZGF0YSBhcnJheSBiYXNlZCBvbiB3aGljaCB2aWV3cyBhcmUgcHJlc2VudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMVmlldyBleHRlbmRzIEFycmF5PGFueT4ge1xuICAvKipcbiAgICogVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIHZpZXcuIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhpcyBzbyB3ZSBjYW4gZWFzaWx5IHdhbGsgdXAgdGhlXG4gICAqIG5vZGUgdHJlZSBpbiBESSBhbmQgZ2V0IHRoZSBUVmlldy5kYXRhIGFycmF5IGFzc29jaWF0ZWQgd2l0aCBhIG5vZGUgKHdoZXJlIHRoZVxuICAgKiBkaXJlY3RpdmUgZGVmcyBhcmUgc3RvcmVkKS5cbiAgICovXG4gIHJlYWRvbmx5W1RWSUVXXTogVFZpZXc7XG5cbiAgLyoqIEZsYWdzIGZvciB0aGlzIHZpZXcuIFNlZSBMVmlld0ZsYWdzIGZvciBtb3JlIGluZm8uICovXG4gIFtGTEFHU106IExWaWV3RmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgdmlldyBpcyBuZWVkZWQgd2hlbiB3ZSBleGl0IHRoZSB2aWV3IGFuZCBtdXN0IHJlc3RvcmUgdGhlIHByZXZpb3VzXG4gICAqIGBMVmlld2AuIFdpdGhvdXQgdGhpcywgdGhlIHJlbmRlciBtZXRob2Qgd291bGQgaGF2ZSB0byBrZWVwIGEgc3RhY2sgb2ZcbiAgICogdmlld3MgYXMgaXQgaXMgcmVjdXJzaXZlbHkgcmVuZGVyaW5nIHRlbXBsYXRlcy5cbiAgICpcbiAgICogVGhpcyBpcyB0aGUgXCJpbnNlcnRpb25cIiB2aWV3IGZvciBlbWJlZGRlZCB2aWV3cy4gVGhpcyBhbGxvd3MgdXMgdG8gcHJvcGVybHlcbiAgICogZGVzdHJveSBlbWJlZGRlZCB2aWV3cy5cbiAgICovXG4gIFtQQVJFTlRdOiBMVmlld3xudWxsO1xuXG4gIC8qKlxuICAgKlxuICAgKiBUaGUgbmV4dCBzaWJsaW5nIExWaWV3IG9yIExDb250YWluZXIuXG4gICAqXG4gICAqIEFsbG93cyB1cyB0byBwcm9wYWdhdGUgYmV0d2VlbiBzaWJsaW5nIHZpZXcgc3RhdGVzIHRoYXQgYXJlbid0IGluIHRoZSBzYW1lXG4gICAqIGNvbnRhaW5lci4gRW1iZWRkZWQgdmlld3MgYWxyZWFkeSBoYXZlIGEgbm9kZS5uZXh0LCBidXQgaXQgaXMgb25seSBzZXQgZm9yXG4gICAqIHZpZXdzIGluIHRoZSBzYW1lIGNvbnRhaW5lci4gV2UgbmVlZCBhIHdheSB0byBsaW5rIGNvbXBvbmVudCB2aWV3cyBhbmQgdmlld3NcbiAgICogYWNyb3NzIGNvbnRhaW5lcnMgYXMgd2VsbC5cbiAgICovXG4gIFtORVhUXTogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKiBRdWVyaWVzIGFjdGl2ZSBmb3IgdGhpcyB2aWV3IC0gbm9kZXMgZnJvbSBhIHZpZXcgYXJlIHJlcG9ydGVkIHRvIHRob3NlIHF1ZXJpZXMuICovXG4gIFtRVUVSSUVTXTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGhvc3Qgbm9kZSBmb3IgdGhpcyBMVmlldyBpbnN0YW5jZSwgaWYgdGhpcyBpcyBhIGNvbXBvbmVudCB2aWV3LlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcsIEhPU1Qgd2lsbCBiZSBudWxsLlxuICAgKi9cbiAgW0hPU1RdOiBSRWxlbWVudHxTdHlsaW5nQ29udGV4dHxudWxsO1xuXG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgVFZpZXdOb2RlYCBvciBgVEVsZW1lbnROb2RlYCB3aGljaCByZXByZXNlbnRzIHRoZSByb290IG9mIHRoZSB2aWV3LlxuICAgKlxuICAgKiBJZiBgVFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLiBXZSBuZWVkIHRoaXMgdG8gYmUgYWJsZSB0b1xuICAgKiBlZmZpY2llbnRseSBmaW5kIHRoZSBgTFZpZXdOb2RlYCB3aGVuIGluc2VydGluZyB0aGUgdmlldyBpbnRvIGFuIGFuY2hvci5cbiAgICpcbiAgICogSWYgYFRFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIExWaWV3IG9mIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiBJZiBudWxsLCB0aGlzIGlzIHRoZSByb290IHZpZXcgb2YgYW4gYXBwbGljYXRpb24gKHJvb3QgY29tcG9uZW50IGlzIGluIHRoaXMgdmlldykuXG4gICAqL1xuICBbSE9TVF9OT0RFXTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgYmluZGluZyBpbmRleCB3ZSBzaG91bGQgYWNjZXNzIG5leHQuXG4gICAqXG4gICAqIFRoaXMgaXMgc3RvcmVkIHNvIHRoYXQgYmluZGluZ3MgY2FuIGNvbnRpbnVlIHdoZXJlIHRoZXkgbGVmdCBvZmZcbiAgICogaWYgYSB2aWV3IGlzIGxlZnQgbWlkd2F5IHRocm91Z2ggcHJvY2Vzc2luZyBiaW5kaW5ncyAoZS5nLiBpZiB0aGVyZSBpc1xuICAgKiBhIHNldHRlciB0aGF0IGNyZWF0ZXMgYW4gZW1iZWRkZWQgdmlldywgbGlrZSBpbiBuZ0lmKS5cbiAgICovXG4gIFtCSU5ESU5HX0lOREVYXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAgICogdW5zdWJzY3JpYmVkLiBUaGlzIGNvbnRleHQgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZnVuY3Rpb25zIHdyYXBwZWQgd2l0aFxuICAgKiB0aGVpciBjb250ZXh0IGFuZCBvdXRwdXQgc3Vic2NyaXB0aW9uIGluc3RhbmNlcyBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuXG4gICAqXG4gICAqIFRoZXNlIGNoYW5nZSBwZXIgTFZpZXcgaW5zdGFuY2UsIHNvIHRoZXkgY2Fubm90IGJlIHN0b3JlZCBvbiBUVmlldy4gSW5zdGVhZCxcbiAgICogVFZpZXcuY2xlYW51cCBzYXZlcyBhbiBpbmRleCB0byB0aGUgbmVjZXNzYXJ5IGNvbnRleHQgaW4gdGhpcyBhcnJheS5cbiAgICovXG4gIC8vIFRPRE86IGZsYXR0ZW4gaW50byBMVmlld1tdXG4gIFtDTEVBTlVQXTogYW55W118bnVsbDtcblxuICAvKipcbiAgICogLSBGb3IgZHluYW1pYyB2aWV3cywgdGhpcyBpcyB0aGUgY29udGV4dCB3aXRoIHdoaWNoIHRvIHJlbmRlciB0aGUgdGVtcGxhdGUgKGUuZy5cbiAgICogICBgTmdGb3JDb250ZXh0YCksIG9yIGB7fWAgaWYgbm90IGRlZmluZWQgZXhwbGljaXRseS5cbiAgICogLSBGb3Igcm9vdCB2aWV3IG9mIHRoZSByb290IGNvbXBvbmVudCB0aGUgY29udGV4dCBjb250YWlucyBjaGFuZ2UgZGV0ZWN0aW9uIGRhdGEuXG4gICAqIC0gRm9yIG5vbi1yb290IGNvbXBvbmVudHMsIHRoZSBjb250ZXh0IGlzIHRoZSBjb21wb25lbnQgaW5zdGFuY2UsXG4gICAqIC0gRm9yIGlubGluZSB2aWV3cywgdGhlIGNvbnRleHQgaXMgbnVsbC5cbiAgICovXG4gIFtDT05URVhUXToge318Um9vdENvbnRleHR8bnVsbDtcblxuICAvKiogQW4gb3B0aW9uYWwgTW9kdWxlIEluamVjdG9yIHRvIGJlIHVzZWQgYXMgZmFsbCBiYWNrIGFmdGVyIEVsZW1lbnQgSW5qZWN0b3JzIGFyZSBjb25zdWx0ZWQuICovXG4gIHJlYWRvbmx5W0lOSkVDVE9SXTogSW5qZWN0b3J8bnVsbDtcblxuICAvKiogUmVuZGVyZXIgdG8gYmUgdXNlZCBmb3IgdGhpcyB2aWV3LiAqL1xuICBbUkVOREVSRVJfRkFDVE9SWV06IFJlbmRlcmVyRmFjdG9yeTM7XG5cbiAgLyoqIFJlbmRlcmVyIHRvIGJlIHVzZWQgZm9yIHRoaXMgdmlldy4gKi9cbiAgW1JFTkRFUkVSXTogUmVuZGVyZXIzO1xuXG4gIC8qKiBBbiBvcHRpb25hbCBjdXN0b20gc2FuaXRpemVyLiAqL1xuICBbU0FOSVRJWkVSXTogU2FuaXRpemVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIFRoZSB0YWlsIGFsbG93cyB1cyB0byBxdWlja2x5IGFkZCBhIG5ldyBzdGF0ZSB0byB0aGUgZW5kIG9mIHRoZSB2aWV3IGxpc3RcbiAgICogd2l0aG91dCBoYXZpbmcgdG8gcHJvcGFnYXRlIHN0YXJ0aW5nIGZyb20gdGhlIGZpcnN0IGNoaWxkLlxuICAgKi9cbiAgW1RBSUxdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGNvbnRhaW5lcidzIGhvc3Qgbm9kZS4gQXBwbGljYWJsZSBvbmx5IHRvIGVtYmVkZGVkIHZpZXdzIHRoYXRcbiAgICogaGF2ZSBiZWVuIGluc2VydGVkIGR5bmFtaWNhbGx5LiBXaWxsIGJlIC0xIGZvciBjb21wb25lbnQgdmlld3MgYW5kIGlubGluZSB2aWV3cy5cbiAgICpcbiAgICogVGhpcyBpcyBuZWNlc3NhcnkgdG8ganVtcCBmcm9tIGR5bmFtaWNhbGx5IGNyZWF0ZWQgZW1iZWRkZWQgdmlld3MgdG8gdGhlaXIgcGFyZW50XG4gICAqIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGVpciBwYXJlbnQgY2Fubm90IGJlIHN0b3JlZCBvbiB0aGUgVFZpZXdOb2RlICh2aWV3cyBtYXkgYmUgaW5zZXJ0ZWRcbiAgICogaW4gbXVsdGlwbGUgY29udGFpbmVycywgc28gdGhlIHBhcmVudCBjYW5ub3QgYmUgc2hhcmVkIGJldHdlZW4gdmlldyBpbnN0YW5jZXMpLlxuICAgKi9cbiAgW0NPTlRBSU5FUl9JTkRFWF06IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIFF1ZXJ5TGlzdHMgYXNzb2NpYXRlZCB3aXRoIGNvbnRlbnQgcXVlcmllcyBvZiBhIGRpcmVjdGl2ZS4gVGhpcyBkYXRhIHN0cnVjdHVyZSBpc1xuICAgKiBmaWxsZWQtaW4gYXMgcGFydCBvZiBhIGRpcmVjdGl2ZSBjcmVhdGlvbiBwcm9jZXNzIGFuZCBpcyBsYXRlciB1c2VkIHRvIHJldHJpZXZlIGEgUXVlcnlMaXN0IHRvXG4gICAqIGJlIHJlZnJlc2hlZC5cbiAgICovXG4gIFtDT05URU5UX1FVRVJJRVNdOiBRdWVyeUxpc3Q8YW55PltdfG51bGw7XG5cbiAgLyoqXG4gICAqIFZpZXcgd2hlcmUgdGhpcyB2aWV3J3MgdGVtcGxhdGUgd2FzIGRlY2xhcmVkLlxuICAgKlxuICAgKiBPbmx5IGFwcGxpY2FibGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuIFdpbGwgYmUgbnVsbCBmb3IgaW5saW5lL2NvbXBvbmVudCB2aWV3cy5cbiAgICpcbiAgICogVGhlIHRlbXBsYXRlIGZvciBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBtYXkgYmUgZGVjbGFyZWQgaW4gYSBkaWZmZXJlbnQgdmlldyB0aGFuXG4gICAqIGl0IGlzIGluc2VydGVkLiBXZSBhbHJlYWR5IHRyYWNrIHRoZSBcImluc2VydGlvbiB2aWV3XCIgKHZpZXcgd2hlcmUgdGhlIHRlbXBsYXRlIHdhc1xuICAgKiBpbnNlcnRlZCkgaW4gTFZpZXdbUEFSRU5UXSwgYnV0IHdlIGFsc28gbmVlZCBhY2Nlc3MgdG8gdGhlIFwiZGVjbGFyYXRpb24gdmlld1wiXG4gICAqICh2aWV3IHdoZXJlIHRoZSB0ZW1wbGF0ZSB3YXMgZGVjbGFyZWQpLiBPdGhlcndpc2UsIHdlIHdvdWxkbid0IGJlIGFibGUgdG8gY2FsbCB0aGVcbiAgICogdmlldydzIHRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlciBjb250ZXh0cy4gQ29udGV4dCBzaG91bGQgYmUgaW5oZXJpdGVkIGZyb21cbiAgICogdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSwgbm90IHRoZSBpbnNlcnRpb24gdmlldyB0cmVlLlxuICAgKlxuICAgKiBFeGFtcGxlIChBcHBDb21wb25lbnQgdGVtcGxhdGUpOlxuICAgKlxuICAgKiA8bmctdGVtcGxhdGUgI2Zvbz48L25nLXRlbXBsYXRlPiAgICAgICA8LS0gZGVjbGFyZWQgaGVyZSAtLT5cbiAgICogPHNvbWUtY29tcCBbdHBsXT1cImZvb1wiPjwvc29tZS1jb21wPiAgICA8LS0gaW5zZXJ0ZWQgaW5zaWRlIHRoaXMgY29tcG9uZW50IC0tPlxuICAgKlxuICAgKiBUaGUgPG5nLXRlbXBsYXRlPiBhYm92ZSBpcyBkZWNsYXJlZCBpbiB0aGUgQXBwQ29tcG9uZW50IHRlbXBsYXRlLCBidXQgaXQgd2lsbCBiZSBwYXNzZWQgaW50b1xuICAgKiBTb21lQ29tcCBhbmQgaW5zZXJ0ZWQgdGhlcmUuIEluIHRoaXMgY2FzZSwgdGhlIGRlY2xhcmF0aW9uIHZpZXcgd291bGQgYmUgdGhlIEFwcENvbXBvbmVudCxcbiAgICogYnV0IHRoZSBpbnNlcnRpb24gdmlldyB3b3VsZCBiZSBTb21lQ29tcC4gV2hlbiB3ZSBhcmUgcmVtb3Zpbmcgdmlld3MsIHdlIHdvdWxkIHdhbnQgdG9cbiAgICogdHJhdmVyc2UgdGhyb3VnaCB0aGUgaW5zZXJ0aW9uIHZpZXcgdG8gY2xlYW4gdXAgbGlzdGVuZXJzLiBXaGVuIHdlIGFyZSBjYWxsaW5nIHRoZVxuICAgKiB0ZW1wbGF0ZSBmdW5jdGlvbiBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgd2UgbmVlZCB0aGUgZGVjbGFyYXRpb24gdmlldyB0byBnZXQgaW5oZXJpdGVkXG4gICAqIGNvbnRleHQuXG4gICAqL1xuICBbREVDTEFSQVRJT05fVklFV106IExWaWV3fG51bGw7XG59XG5cbi8qKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggYW4gTFZpZXcgKHNhdmVkIGluIExWaWV3W0ZMQUdTXSkgKi9cbmV4cG9ydCBjb25zdCBlbnVtIExWaWV3RmxhZ3Mge1xuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHZpZXcgaXMgaW4gY3JlYXRpb25Nb2RlLlxuICAgKlxuICAgKiBUaGlzIG11c3QgYmUgc3RvcmVkIGluIHRoZSB2aWV3IHJhdGhlciB0aGFuIHVzaW5nIGBkYXRhYCBhcyBhIG1hcmtlciBzbyB0aGF0XG4gICAqIHdlIGNhbiBwcm9wZXJseSBzdXBwb3J0IGVtYmVkZGVkIHZpZXdzLiBPdGhlcndpc2UsIHdoZW4gZXhpdGluZyBhIGNoaWxkIHZpZXdcbiAgICogYmFjayBpbnRvIHRoZSBwYXJlbnQgdmlldywgYGRhdGFgIHdpbGwgYmUgZGVmaW5lZCBhbmQgYGNyZWF0aW9uTW9kZWAgd2lsbCBiZVxuICAgKiBpbXByb3Blcmx5IHJlcG9ydGVkIGFzIGZhbHNlLlxuICAgKi9cbiAgQ3JlYXRpb25Nb2RlID0gMGIwMDAwMDAwMDEsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgTFZpZXcgaW5zdGFuY2UgaXMgb24gaXRzIGZpcnN0IHByb2Nlc3NpbmcgcGFzcy5cbiAgICpcbiAgICogQW4gTFZpZXcgaW5zdGFuY2UgaXMgY29uc2lkZXJlZCB0byBiZSBvbiBpdHMgXCJmaXJzdCBwYXNzXCIgdW50aWwgaXRcbiAgICogaGFzIGNvbXBsZXRlZCBvbmUgY3JlYXRpb24gbW9kZSBydW4gYW5kIG9uZSB1cGRhdGUgbW9kZSBydW4uIEF0IHRoaXNcbiAgICogdGltZSwgdGhlIGZsYWcgaXMgdHVybmVkIG9mZi5cbiAgICovXG4gIEZpcnN0TFZpZXdQYXNzID0gMGIwMDAwMDAwMTAsXG5cbiAgLyoqIFdoZXRoZXIgdGhpcyB2aWV3IGhhcyBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kgKGNoZWNrcyBhbHdheXMpIG9yIG9uUHVzaCAqL1xuICBDaGVja0Fsd2F5cyA9IDBiMDAwMDAwMTAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGRpcnR5IChuZWVkaW5nIGNoZWNrKSAqL1xuICBEaXJ0eSA9IDBiMDAwMDAxMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGF0dGFjaGVkIHRvIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS4gKi9cbiAgQXR0YWNoZWQgPSAwYjAwMDAxMDAwMCxcblxuICAvKipcbiAgICogIFdoZXRoZXIgb3Igbm90IHRoZSBpbml0IGhvb2tzIGhhdmUgcnVuLlxuICAgKlxuICAgKiBJZiBvbiwgdGhlIGluaXQgaG9va3MgaGF2ZW4ndCB5ZXQgYmVlbiBydW4gYW5kIHNob3VsZCBiZSBleGVjdXRlZCBieSB0aGUgZmlyc3QgY29tcG9uZW50IHRoYXRcbiAgICogcnVucyBPUiB0aGUgZmlyc3QgY1IoKSBpbnN0cnVjdGlvbiB0aGF0IHJ1bnMgKHNvIGluaXRzIGFyZSBydW4gZm9yIHRoZSB0b3AgbGV2ZWwgdmlldyBiZWZvcmVcbiAgICogYW55IGVtYmVkZGVkIHZpZXdzKS5cbiAgICovXG4gIFJ1bkluaXQgPSAwYjAwMDEwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC4gKi9cbiAgRGVzdHJveWVkID0gMGIwMDEwMDAwMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyB0aGUgcm9vdCB2aWV3ICovXG4gIElzUm9vdCA9IDBiMDEwMDAwMDAwLFxufVxuXG4vKipcbiAqIFRoZSBzdGF0aWMgZGF0YSBmb3IgYW4gTFZpZXcgKHNoYXJlZCBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXMgb2YgYVxuICogZ2l2ZW4gdHlwZSkuXG4gKlxuICogU3RvcmVkIG9uIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBhcyBuZ1ByaXZhdGVEYXRhLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRWaWV3IHtcbiAgLyoqXG4gICAqIElEIGZvciBpbmxpbmUgdmlld3MgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSB2aWV3IGlzIHRoZSBzYW1lIGFzIHRoZSBwcmV2aW91cyB2aWV3XG4gICAqIGluIGEgY2VydGFpbiBwb3NpdGlvbi4gSWYgaXQncyBub3QsIHdlIGtub3cgdGhlIG5ldyB2aWV3IG5lZWRzIHRvIGJlIGluc2VydGVkXG4gICAqIGFuZCB0aGUgb25lIHRoYXQgZXhpc3RzIG5lZWRzIHRvIGJlIHJlbW92ZWQgKGUuZy4gaWYvZWxzZSBzdGF0ZW1lbnRzKVxuICAgKlxuICAgKiBJZiB0aGlzIGlzIC0xLCB0aGVuIHRoaXMgaXMgYSBjb21wb25lbnQgdmlldyBvciBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldy5cbiAgICovXG4gIHJlYWRvbmx5IGlkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYSBibHVlcHJpbnQgdXNlZCB0byBnZW5lcmF0ZSBMVmlldyBpbnN0YW5jZXMgZm9yIHRoaXMgVFZpZXcuIENvcHlpbmcgdGhpc1xuICAgKiBibHVlcHJpbnQgaXMgZmFzdGVyIHRoYW4gY3JlYXRpbmcgYSBuZXcgTFZpZXcgZnJvbSBzY3JhdGNoLlxuICAgKi9cbiAgYmx1ZXByaW50OiBMVmlldztcblxuICAvKipcbiAgICogVGhlIHRlbXBsYXRlIGZ1bmN0aW9uIHVzZWQgdG8gcmVmcmVzaCB0aGUgdmlldyBvZiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzXG4gICAqIGFuZCBjb21wb25lbnRzLiBXaWxsIGJlIG51bGwgZm9yIGlubGluZSB2aWV3cy5cbiAgICovXG4gIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbDtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiBjb250YWluaW5nIHF1ZXJ5LXJlbGF0ZWQgaW5zdHJ1Y3Rpb25zLlxuICAgKi9cbiAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgYFROb2RlYCB0aGF0IHJlcHJlc2VudHMgdGhlIHJvb3Qgb2YgdGhlIHZpZXcuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVFZpZXdOb2RlYCBmb3IgYW4gYExWaWV3Tm9kZWAsIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiBhIGNvbnRhaW5lci5cbiAgICogV2UgbmVlZCB0aGlzIHBvaW50ZXIgdG8gYmUgYWJsZSB0byBlZmZpY2llbnRseSBmaW5kIHRoaXMgbm9kZSB3aGVuIGluc2VydGluZyB0aGUgdmlld1xuICAgKiBpbnRvIGFuIGFuY2hvci5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhIGBURWxlbWVudE5vZGVgLCB0aGlzIGlzIHRoZSB2aWV3IG9mIGEgcm9vdCBjb21wb25lbnQuIEl0IGhhcyBleGFjdGx5IG9uZVxuICAgKiByb290IFROb2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIG51bGwsIHRoaXMgaXMgdGhlIHZpZXcgb2YgYSBjb21wb25lbnQgdGhhdCBpcyBub3QgYXQgcm9vdC4gV2UgZG8gbm90IHN0b3JlXG4gICAqIHRoZSBob3N0IFROb2RlcyBmb3IgY2hpbGQgY29tcG9uZW50IHZpZXdzIGJlY2F1c2UgdGhleSBjYW4gcG90ZW50aWFsbHkgaGF2ZSBzZXZlcmFsXG4gICAqIGRpZmZlcmVudCBob3N0IFROb2RlcywgZGVwZW5kaW5nIG9uIHdoZXJlIHRoZSBjb21wb25lbnQgaXMgYmVpbmcgdXNlZC4gVGhlc2UgaG9zdFxuICAgKiBUTm9kZXMgY2Fubm90IGJlIHNoYXJlZCAoZHVlIHRvIGRpZmZlcmVudCBpbmRpY2VzLCBldGMpLlxuICAgKi9cbiAgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsO1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHRlbXBsYXRlIGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbiAgZmlyc3RUZW1wbGF0ZVBhc3M6IGJvb2xlYW47XG5cbiAgLyoqIFN0YXRpYyBkYXRhIGVxdWl2YWxlbnQgb2YgTFZpZXcuZGF0YVtdLiBDb250YWlucyBUTm9kZXMsIFBpcGVEZWZJbnRlcm5hbCBvciBUSTE4bi4gKi9cbiAgZGF0YTogVERhdGE7XG5cbiAgLyoqXG4gICAqIFRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4IGlzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgZGF0YSBhcnJheVxuICAgKiBzdGFydHMgdG8gc3RvcmUgYmluZGluZ3Mgb25seS4gU2F2aW5nIHRoaXMgdmFsdWUgZW5zdXJlcyB0aGF0IHdlXG4gICAqIHdpbGwgYmVnaW4gcmVhZGluZyBiaW5kaW5ncyBhdCB0aGUgY29ycmVjdCBwb2ludCBpbiB0aGUgYXJyYXkgd2hlblxuICAgKiB3ZSBhcmUgaW4gdXBkYXRlIG1vZGUuXG4gICAqL1xuICBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggd2hlcmUgdGhlIFwiZXhwYW5kb1wiIHNlY3Rpb24gb2YgYExWaWV3YCBiZWdpbnMuIFRoZSBleHBhbmRvXG4gICAqIHNlY3Rpb24gY29udGFpbnMgaW5qZWN0b3JzLCBkaXJlY3RpdmUgaW5zdGFuY2VzLCBhbmQgaG9zdCBiaW5kaW5nIHZhbHVlcy5cbiAgICogVW5saWtlIHRoZSBcImNvbnN0c1wiIGFuZCBcInZhcnNcIiBzZWN0aW9ucyBvZiBgTFZpZXdgLCB0aGUgbGVuZ3RoIG9mIHRoaXNcbiAgICogc2VjdGlvbiBjYW5ub3QgYmUgY2FsY3VsYXRlZCBhdCBjb21waWxlLXRpbWUgYmVjYXVzZSBkaXJlY3RpdmVzIGFyZSBtYXRjaGVkXG4gICAqIGF0IHJ1bnRpbWUgdG8gcHJlc2VydmUgbG9jYWxpdHkuXG4gICAqXG4gICAqIFdlIHN0b3JlIHRoaXMgc3RhcnQgaW5kZXggc28gd2Uga25vdyB3aGVyZSB0byBzdGFydCBjaGVja2luZyBob3N0IGJpbmRpbmdzXG4gICAqIGluIGBzZXRIb3N0QmluZGluZ3NgLlxuICAgKi9cbiAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGV4IHdoZXJlIHRoZSB2aWV3UXVlcmllcyBzZWN0aW9uIG9mIGBMVmlld2AgYmVnaW5zLiBUaGlzIHNlY3Rpb24gY29udGFpbnNcbiAgICogdmlldyBxdWVyaWVzIGRlZmluZWQgZm9yIGEgY29tcG9uZW50L2RpcmVjdGl2ZS5cbiAgICpcbiAgICogV2Ugc3RvcmUgdGhpcyBzdGFydCBpbmRleCBzbyB3ZSBrbm93IHdoZXJlIHRoZSBsaXN0IG9mIHZpZXcgcXVlcmllcyBzdGFydHMuXG4gICAqIFRoaXMgaXMgcmVxdWlyZWQgd2hlbiB3ZSBpbnZva2UgdmlldyBxdWVyaWVzIGF0IHJ1bnRpbWUuIFdlIGludm9rZSBxdWVyaWVzIG9uZSBieSBvbmUgYW5kXG4gICAqIGluY3JlbWVudCBxdWVyeSBpbmRleCBhZnRlciBlYWNoIGl0ZXJhdGlvbi4gVGhpcyBpbmZvcm1hdGlvbiBoZWxwcyB1cyB0byByZXNldCBpbmRleCBiYWNrIHRvXG4gICAqIHRoZSBiZWdpbm5pbmcgb2YgdmlldyBxdWVyeSBsaXN0IGJlZm9yZSB3ZSBpbnZva2UgdmlldyBxdWVyaWVzIGFnYWluLlxuICAgKi9cbiAgdmlld1F1ZXJ5U3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgaG9zdCBub2RlIG9mIHRoZSBmaXJzdCBMVmlldyBvciBMQ29udGFpbmVyIGJlbmVhdGggdGhpcyBMVmlldyBpblxuICAgKiB0aGUgaGllcmFyY2h5LlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3RvcmUgdGhpcyBzbyB2aWV3cyBjYW4gdHJhdmVyc2UgdGhyb3VnaCB0aGVpciBuZXN0ZWQgdmlld3NcbiAgICogdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBGb3IgZW1iZWRkZWQgdmlld3MsIHdlIHN0b3JlIHRoZSBpbmRleCBvZiBhbiBMQ29udGFpbmVyJ3MgaG9zdCByYXRoZXIgdGhhbiB0aGUgZmlyc3RcbiAgICogTFZpZXcgdG8gYXZvaWQgbWFuYWdpbmcgc3BsaWNpbmcgd2hlbiB2aWV3cyBhcmUgYWRkZWQvcmVtb3ZlZC5cbiAgICovXG4gIGNoaWxkSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgbG9jYXRlZCBpbiB0aGUgdmlldy5cbiAgICovXG4gIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byBwcm9jZXNzIGhvc3QgYmluZGluZ3MgZWZmaWNpZW50bHkuXG4gICAqXG4gICAqIFNlZSBWSUVXX0RBVEEubWQgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiAobnVtYmVyfEhvc3RCaW5kaW5nc0Z1bmN0aW9uPGFueT58bnVsbClbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBGdWxsIHJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBJdCdzIG5lY2Vzc2FyeSB0byBrZWVwIGEgY29weSBvZiB0aGUgZnVsbCBkZWYgbGlzdCBvbiB0aGUgVFZpZXcgc28gaXQncyBwb3NzaWJsZVxuICAgKiB0byByZW5kZXIgdGVtcGxhdGUgZnVuY3Rpb25zIHdpdGhvdXQgYSBob3N0IGNvbXBvbmVudC5cbiAgICovXG4gIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bGwgcmVnaXN0cnkgb2YgcGlwZXMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBUaGUgcHJvcGVydHkgaXMgZWl0aGVyIGFuIGFycmF5IG9mIGBQaXBlRGVmc2BzIG9yIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgYXJyYXkgb2ZcbiAgICogYFBpcGVEZWZzYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKlxuICAgKiBJdCdzIG5lY2Vzc2FyeSB0byBrZWVwIGEgY29weSBvZiB0aGUgZnVsbCBkZWYgbGlzdCBvbiB0aGUgVFZpZXcgc28gaXQncyBwb3NzaWJsZVxuICAgKiB0byByZW5kZXIgdGVtcGxhdGUgZnVuY3Rpb25zIHdpdGhvdXQgYSBob3N0IGNvbXBvbmVudC5cbiAgICovXG4gIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkluaXQgYW5kIG5nRG9DaGVjayBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluXG4gICAqIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBpbml0SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nRG9DaGVjayBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluIHVwZGF0ZSBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgY2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlckNvbnRlbnRJbml0IGFuZCBuZ0FmdGVyQ29udGVudENoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWRcbiAgICogZm9yIHRoaXMgdmlldyBpbiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgY29udGVudEhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyQ29udGVudENoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpbiB1cGRhdGVcbiAgICogbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyVmlld0luaXQgYW5kIG5nQWZ0ZXJWaWV3Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3JcbiAgICogdGhpcyB2aWV3IGluIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICB2aWV3SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJWaWV3Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluXG4gICAqIHVwZGF0ZSBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nT25EZXN0cm95IGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIHdoZW4gdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogV2hlbiBhIHZpZXcgaXMgZGVzdHJveWVkLCBsaXN0ZW5lcnMgbmVlZCB0byBiZSByZWxlYXNlZCBhbmQgb3V0cHV0cyBuZWVkIHRvIGJlXG4gICAqIHVuc3Vic2NyaWJlZC4gVGhpcyBjbGVhbnVwIGFycmF5IHN0b3JlcyBib3RoIGxpc3RlbmVyIGRhdGEgKGluIGNodW5rcyBvZiA0KVxuICAgKiBhbmQgb3V0cHV0IGRhdGEgKGluIGNodW5rcyBvZiAyKSBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuIENvbWJpbmluZyB0aGUgYXJyYXlzXG4gICAqIHNhdmVzIG9uIG1lbW9yeSAoNzAgYnl0ZXMgcGVyIGFycmF5KSBhbmQgb24gYSBmZXcgYnl0ZXMgb2YgY29kZSBzaXplIChmb3IgdHdvXG4gICAqIHNlcGFyYXRlIGZvciBsb29wcykuXG4gICAqXG4gICAqIElmIGl0J3MgYSBuYXRpdmUgRE9NIGxpc3RlbmVyIG9yIG91dHB1dCBzdWJzY3JpcHRpb24gYmVpbmcgc3RvcmVkOlxuICAgKiAxc3QgaW5kZXggaXM6IGV2ZW50IG5hbWUgIGBuYW1lID0gdFZpZXcuY2xlYW51cFtpKzBdYFxuICAgKiAybmQgaW5kZXggaXM6IGluZGV4IG9mIG5hdGl2ZSBlbGVtZW50IG9yIGEgZnVuY3Rpb24gdGhhdCByZXRyaWV2ZXMgZ2xvYmFsIHRhcmdldCAod2luZG93LFxuICAgKiAgICAgICAgICAgICAgIGRvY3VtZW50IG9yIGJvZHkpIHJlZmVyZW5jZSBiYXNlZCBvbiB0aGUgbmF0aXZlIGVsZW1lbnQ6XG4gICAqICAgIGB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdmdW5jdGlvbidgOiBnbG9iYWwgdGFyZ2V0IGdldHRlciBmdW5jdGlvblxuICAgKiAgICBgdHlwZW9mIGlkeE9yVGFyZ2V0R2V0dGVyID09PSAnbnVtYmVyJ2A6IGluZGV4IG9mIG5hdGl2ZSBlbGVtZW50XG4gICAqXG4gICAqIDNyZCBpbmRleCBpczogaW5kZXggb2YgbGlzdGVuZXIgZnVuY3Rpb24gYGxpc3RlbmVyID0gbFZpZXdbQ0xFQU5VUF1bdFZpZXcuY2xlYW51cFtpKzJdXWBcbiAgICogNHRoIGluZGV4IGlzOiBgdXNlQ2FwdHVyZU9ySW5keCA9IHRWaWV3LmNsZWFudXBbaSszXWBcbiAgICogICAgYHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09ICdib29sZWFuJyA6IHVzZUNhcHR1cmUgYm9vbGVhblxuICAgKiAgICBgdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT0gJ251bWJlcic6XG4gICAqICAgICAgICAgYHVzZUNhcHR1cmVPckluZHggPj0gMGAgYHJlbW92ZUxpc3RlbmVyID0gTFZpZXdbQ0xFQU5VUF1bdXNlQ2FwdHVyZU9ySW5keF1gXG4gICAqICAgICAgICAgYHVzZUNhcHR1cmVPckluZHggPCAgMGAgYHN1YnNjcmlwdGlvbiA9IExWaWV3W0NMRUFOVVBdWy11c2VDYXB0dXJlT3JJbmR4XWBcbiAgICpcbiAgICogSWYgaXQncyBhIHJlbmRlcmVyMiBzdHlsZSBsaXN0ZW5lciBvciBWaWV3UmVmIGRlc3Ryb3kgaG9vayBiZWluZyBzdG9yZWQ6XG4gICAqIDFzdCBpbmRleCBpczogaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1tdXG4gICAqIDJuZCBpbmRleCBpczogYG51bGxgXG4gICAqICAgICAgICAgICAgICAgYGxWaWV3W0NMRUFOVVBdW3RWaWV3LmNsZWFudXBbaSswXV0oKWBcbiAgICpcbiAgICogSWYgaXQncyBhbiBvdXRwdXQgc3Vic2NyaXB0aW9uIG9yIHF1ZXJ5IGxpc3QgZGVzdHJveSBob29rOlxuICAgKiAxc3QgaW5kZXggaXM6IG91dHB1dCB1bnN1YnNjcmliZSBmdW5jdGlvbiAvIHF1ZXJ5IGxpc3QgZGVzdHJveSBmdW5jdGlvblxuICAgKiAybmQgaW5kZXggaXM6IGluZGV4IG9mIGZ1bmN0aW9uIGNvbnRleHQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1tdXG4gICAqICAgICAgICAgICAgICAgYHRWaWV3LmNsZWFudXBbaSswXS5jYWxsKGxWaWV3W0NMRUFOVVBdW3RWaWV3LmNsZWFudXBbaSsxXV0pYFxuICAgKi9cbiAgY2xlYW51cDogYW55W118bnVsbDtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGVsZW1lbnQgaW5kaWNlcyBmb3IgY2hpbGQgY29tcG9uZW50cyB0aGF0IHdpbGwgbmVlZCB0byBiZVxuICAgKiByZWZyZXNoZWQgd2hlbiB0aGUgY3VycmVudCB2aWV3IGhhcyBmaW5pc2hlZCBpdHMgY2hlY2suIFRoZXNlIGluZGljZXMgaGF2ZVxuICAgKiBhbHJlYWR5IGJlZW4gYWRqdXN0ZWQgZm9yIHRoZSBIRUFERVJfT0ZGU0VULlxuICAgKlxuICAgKi9cbiAgY29tcG9uZW50czogbnVtYmVyW118bnVsbDtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGluZGljZXMgZm9yIGNoaWxkIGRpcmVjdGl2ZXMgdGhhdCBoYXZlIGNvbnRlbnQgcXVlcmllcy5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kaWNlc1xuICAgKiBPZGQgaW5kaWNlczogU3RhcnRpbmcgaW5kZXggb2YgY29udGVudCBxdWVyaWVzIChzdG9yZWQgaW4gQ09OVEVOVF9RVUVSSUVTKSBmb3IgdGhpcyBkaXJlY3RpdmVcbiAgICovXG4gIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBSb290Q29udGV4dEZsYWdzIHtFbXB0eSA9IDBiMDAsIERldGVjdENoYW5nZXMgPSAwYjAxLCBGbHVzaFBsYXllcnMgPSAwYjEwfVxuXG5cbi8qKlxuICogUm9vdENvbnRleHQgY29udGFpbnMgaW5mb3JtYXRpb24gd2hpY2ggaXMgc2hhcmVkIGZvciBhbGwgY29tcG9uZW50cyB3aGljaFxuICogd2VyZSBib290c3RyYXBwZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb290Q29udGV4dCB7XG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHVzZWQgZm9yIHNjaGVkdWxpbmcgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgZnV0dXJlLiBVc3VhbGx5XG4gICAqIHRoaXMgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gICAqL1xuICBzY2hlZHVsZXI6ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCB3aGVuIGFsbCBjb21wb25lbnRzIGFyZSBjb25zaWRlcmVkIGNsZWFuIChub3QgZGlydHkpLlxuICAgKlxuICAgKiBUaGlzIHByb21pc2UgaXMgb3ZlcndyaXR0ZW4gZXZlcnkgdGltZSBhIGZpcnN0IGNhbGwgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gaXMgaW52b2tlZC5cbiAgICovXG4gIGNsZWFuOiBQcm9taXNlPG51bGw+O1xuXG4gIC8qKlxuICAgKiBSb290Q29tcG9uZW50cyAtIFRoZSBjb21wb25lbnRzIHRoYXQgd2VyZSBpbnN0YW50aWF0ZWQgYnkgdGhlIGNhbGwgdG9cbiAgICoge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gICAqL1xuICBjb21wb25lbnRzOiB7fVtdO1xuXG4gIC8qKlxuICAgKiBUaGUgcGxheWVyIGZsdXNoaW5nIGhhbmRsZXIgdG8ga2ljayBvZmYgYWxsIGFuaW1hdGlvbnNcbiAgICovXG4gIHBsYXllckhhbmRsZXI6IFBsYXllckhhbmRsZXJ8bnVsbDtcblxuICAvKipcbiAgICogV2hhdCByZW5kZXItcmVsYXRlZCBvcGVyYXRpb25zIHRvIHJ1biBvbmNlIGEgc2NoZWR1bGVyIGhhcyBiZWVuIHNldFxuICAgKi9cbiAgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3M7XG59XG5cbi8qKlxuICogQXJyYXkgb2YgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIGEgdmlldyBhbmQgdGhlaXIgZGlyZWN0aXZlIGluZGljZXMuXG4gKlxuICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCB0eXBlIEhvb2tEYXRhID0gKG51bWJlciB8ICgoKSA9PiB2b2lkKSlbXTtcblxuLyoqXG4gKiBTdGF0aWMgZGF0YSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpbnN0YW5jZS1zcGVjaWZpYyBkYXRhIGFycmF5IG9uIGFuIExWaWV3LlxuICpcbiAqIEVhY2ggbm9kZSdzIHN0YXRpYyBkYXRhIGlzIHN0b3JlZCBpbiB0RGF0YSBhdCB0aGUgc2FtZSBpbmRleCB0aGF0IGl0J3Mgc3RvcmVkXG4gKiBpbiB0aGUgZGF0YSBhcnJheS4gIEFueSBub2RlcyB0aGF0IGRvIG5vdCBoYXZlIHN0YXRpYyBkYXRhIHN0b3JlIGEgbnVsbCB2YWx1ZSBpblxuICogdERhdGEgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKlxuICogRWFjaCBwaXBlJ3MgZGVmaW5pdGlvbiBpcyBzdG9yZWQgaGVyZSBhdCB0aGUgc2FtZSBpbmRleCBhcyBpdHMgcGlwZSBpbnN0YW5jZSBpblxuICogdGhlIGRhdGEgYXJyYXkuXG4gKlxuICogRWFjaCBob3N0IHByb3BlcnR5J3MgbmFtZSBpcyBzdG9yZWQgaGVyZSBhdCB0aGUgc2FtZSBpbmRleCBhcyBpdHMgdmFsdWUgaW4gdGhlXG4gKiBkYXRhIGFycmF5LlxuICpcbiAqIEVhY2ggcHJvcGVydHkgYmluZGluZyBuYW1lIGlzIHN0b3JlZCBoZXJlIGF0IHRoZSBzYW1lIGluZGV4IGFzIGl0cyB2YWx1ZSBpblxuICogdGhlIGRhdGEgYXJyYXkuIElmIHRoZSBiaW5kaW5nIGlzIGFuIGludGVycG9sYXRpb24sIHRoZSBzdGF0aWMgc3RyaW5nIHZhbHVlc1xuICogYXJlIHN0b3JlZCBwYXJhbGxlbCB0byB0aGUgZHluYW1pYyB2YWx1ZXMuIEV4YW1wbGU6XG4gKlxuICogaWQ9XCJwcmVmaXgge3sgdjAgfX0gYSB7eyB2MSB9fSBiIHt7IHYyIH19IHN1ZmZpeFwiXG4gKlxuICogTFZpZXcgICAgICAgfCAgIFRWaWV3LmRhdGFcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgdjAgdmFsdWUgICB8ICAgJ2EnXG4gKiAgdjEgdmFsdWUgICB8ICAgJ2InXG4gKiAgdjIgdmFsdWUgICB8ICAgaWQg77+9IHByZWZpeCDvv70gc3VmZml4XG4gKlxuICogSW5qZWN0b3IgYmxvb20gZmlsdGVycyBhcmUgYWxzbyBzdG9yZWQgaGVyZS5cbiAqL1xuZXhwb3J0IHR5cGUgVERhdGEgPVxuICAgIChUTm9kZSB8IFBpcGVEZWY8YW55PnwgRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+fCBudW1iZXIgfCBUeXBlPGFueT58XG4gICAgIEluamVjdGlvblRva2VuPGFueT58IFRJMThuIHwgSTE4blVwZGF0ZU9wQ29kZXMgfCBudWxsIHwgc3RyaW5nKVtdO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19