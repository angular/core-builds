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
export const T_HOST = 6;
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
    [T_HOST]: TViewNode|TElementNode|null;*/
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
    /** The state of the init phase on the first 2 bits */
    InitPhaseStateIncrementer: 1,
    InitPhaseStateMask: 3,
    /**
     * Whether or not the view is in creationMode.
     *
     * This must be stored in the view rather than using `data` as a marker so that
     * we can properly support embedded views. Otherwise, when exiting a child view
     * back into the parent view, `data` will be defined and `creationMode` will be
     * improperly reported as false.
     */
    CreationMode: 4,
    /**
     * Whether or not this LView instance is on its first processing pass.
     *
     * An LView instance is considered to be on its "first pass" until it
     * has completed one creation mode run and one update mode run. At this
     * time, the flag is turned off.
     */
    FirstLViewPass: 8,
    /** Whether this view has default change detection strategy (checks always) or onPush */
    CheckAlways: 16,
    /**
     * Whether or not manual change detection is turned on for onPush components.
     *
     * This is a special mode that only marks components dirty in two cases:
     * 1) There has been a change to an @Input property
     * 2) `markDirty()` has been called manually by the user
     *
     * Note that in this mode, the firing of events does NOT mark components
     * dirty automatically.
     *
     * Manual mode is turned off by default for backwards compatibility, as events
     * automatically mark OnPush components dirty in View Engine.
     *
     * TODO: Add a public API to ChangeDetectionStrategy to turn this mode on
     */
    ManualOnPush: 32,
    /** Whether or not this view is currently dirty (needing check) */
    Dirty: 64,
    /** Whether or not this view is currently attached to change detection tree. */
    Attached: 128,
    /** Whether or not this view is destroyed. */
    Destroyed: 256,
    /** Whether or not this view is the root view */
    IsRoot: 512,
    /**
     * Index of the current init phase on last 22 bits
     */
    IndexWithinInitPhaseIncrementer: 1024,
    IndexWithinInitPhaseShift: 10,
    IndexWithinInitPhaseReset: 1023,
};
export { LViewFlags };
/** @enum {number} */
const InitPhaseState = {
    OnInitHooksToBeRun: 0,
    AfterContentInitHooksToBeRun: 1,
    AfterViewInitHooksToBeRun: 2,
    InitPhaseCompleted: 3,
};
export { InitPhaseState };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUM7O0FBQ3RCLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sSUFBSSxHQUFHLENBQUM7O0FBQ3JCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDOztBQUNyQixNQUFNLE9BQU8sTUFBTSxHQUFHLENBQUM7O0FBQ3ZCLE1BQU0sT0FBTyxhQUFhLEdBQUcsQ0FBQzs7QUFDOUIsTUFBTSxPQUFPLE9BQU8sR0FBRyxDQUFDOztBQUN4QixNQUFNLE9BQU8sT0FBTyxHQUFHLENBQUM7O0FBQ3hCLE1BQU0sT0FBTyxRQUFRLEdBQUcsRUFBRTs7QUFDMUIsTUFBTSxPQUFPLGdCQUFnQixHQUFHLEVBQUU7O0FBQ2xDLE1BQU0sT0FBTyxRQUFRLEdBQUcsRUFBRTs7QUFDMUIsTUFBTSxPQUFPLFNBQVMsR0FBRyxFQUFFOztBQUMzQixNQUFNLE9BQU8sSUFBSSxHQUFHLEVBQUU7O0FBQ3RCLE1BQU0sT0FBTyxlQUFlLEdBQUcsRUFBRTs7QUFDakMsTUFBTSxPQUFPLGVBQWUsR0FBRyxFQUFFOztBQUNqQyxNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsRUFBRTs7Ozs7QUFFbEMsTUFBTSxPQUFPLGFBQWEsR0FBRyxFQUFFOzs7O0FBTS9CLHFDQUVDOzs7SUFEQyxvQ0FBaUU7Ozs7Ozs7Ozs7Ozs7QUFjbkUsMkJBaUpDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlDLHNEQUFzRDtJQUN0RCw0QkFBeUM7SUFDekMscUJBQWtDO0lBRWxDOzs7Ozs7O09BT0c7SUFDSCxlQUE0QjtJQUU1Qjs7Ozs7O09BTUc7SUFDSCxpQkFBOEI7SUFFOUIsd0ZBQXdGO0lBQ3hGLGVBQTJCO0lBRTNCOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsZ0JBQTRCO0lBRTVCLGtFQUFrRTtJQUNsRSxTQUFzQjtJQUV0QiwrRUFBK0U7SUFDL0UsYUFBeUI7SUFFekIsNkNBQTZDO0lBQzdDLGNBQTBCO0lBRTFCLGdEQUFnRDtJQUNoRCxXQUF1QjtJQUV2Qjs7T0FFRztJQUNILHFDQUFnRDtJQUNoRCw2QkFBOEI7SUFDOUIsK0JBQTBDOzs7OztJQVcxQyxxQkFBeUI7SUFDekIsK0JBQW1DO0lBQ25DLDRCQUFnQztJQUNoQyxxQkFBeUI7Ozs7Ozs7Ozs7QUFTM0IsMkJBc09DOzs7Ozs7Ozs7O0lBOU5DLG1CQUFvQjs7Ozs7O0lBTXBCLDBCQUFpQjs7Ozs7O0lBTWpCLHlCQUFxQzs7Ozs7SUFLckMsMEJBQW1DOzs7Ozs7Ozs7Ozs7Ozs7OztJQWlCbkMscUJBQWtDOzs7OztJQUdsQyxrQ0FBMkI7Ozs7O0lBRzNCLHFCQUFZOzs7Ozs7OztJQVFaLGtDQUEwQjs7Ozs7Ozs7Ozs7O0lBWTFCLGtDQUEwQjs7Ozs7Ozs7Ozs7SUFXMUIsb0NBQTRCOzs7Ozs7Ozs7Ozs7SUFZNUIsMkJBQW1COzs7OztJQUtuQiwyQkFBdUI7Ozs7Ozs7SUFPdkIsb0NBQW9FOzs7Ozs7OztJQVFwRSxrQ0FBeUM7Ozs7Ozs7Ozs7O0lBV3pDLDZCQUErQjs7Ozs7Ozs7O0lBUy9CLDBCQUF5Qjs7Ozs7Ozs7SUFRekIsMkJBQTBCOzs7Ozs7Ozs7SUFTMUIsNkJBQTRCOzs7Ozs7Ozs7SUFTNUIsa0NBQWlDOzs7Ozs7Ozs7SUFTakMsMEJBQXlCOzs7Ozs7Ozs7SUFTekIsK0JBQThCOzs7Ozs7OztJQVE5Qiw2QkFBNEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlDNUIsd0JBQW9COzs7Ozs7OztJQVFwQiwyQkFBMEI7Ozs7O0lBSzFCLCtCQUE4Qjs7OztJQUdJLFFBQVksRUFBRSxnQkFBb0IsRUFBRSxlQUFtQjs7Ozs7Ozs7QUFPM0YsaUNBNkJDOzs7Ozs7O0lBeEJDLGdDQUF3Qzs7Ozs7OztJQU94Qyw0QkFBcUI7Ozs7OztJQU1yQixpQ0FBaUI7Ozs7O0lBS2pCLG9DQUFrQzs7Ozs7SUFLbEMsNEJBQXdCOzs7OztBQTRDMUIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uLy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi8uLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgUGlwZURlZiwgUGlwZURlZkxpc3R9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0kxOG5VcGRhdGVPcENvZGVzLCBUSTE4bn0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0fSBmcm9tICcuL3N0eWxpbmcnO1xuXG5cblxuLy8gQmVsb3cgYXJlIGNvbnN0YW50cyBmb3IgTFZpZXcgaW5kaWNlcyB0byBoZWxwIHVzIGxvb2sgdXAgTFZpZXcgbWVtYmVyc1xuLy8gd2l0aG91dCBoYXZpbmcgdG8gcmVtZW1iZXIgdGhlIHNwZWNpZmljIGluZGljZXMuXG4vLyBVZ2xpZnkgd2lsbCBpbmxpbmUgdGhlc2Ugd2hlbiBtaW5pZnlpbmcgc28gdGhlcmUgc2hvdWxkbid0IGJlIGEgY29zdC5cbmV4cG9ydCBjb25zdCBUVklFVyA9IDA7XG5leHBvcnQgY29uc3QgRkxBR1MgPSAxO1xuZXhwb3J0IGNvbnN0IFBBUkVOVCA9IDI7XG5leHBvcnQgY29uc3QgTkVYVCA9IDM7XG5leHBvcnQgY29uc3QgUVVFUklFUyA9IDQ7XG5leHBvcnQgY29uc3QgSE9TVCA9IDU7XG5leHBvcnQgY29uc3QgVF9IT1NUID0gNjtcbmV4cG9ydCBjb25zdCBCSU5ESU5HX0lOREVYID0gNztcbmV4cG9ydCBjb25zdCBDTEVBTlVQID0gODtcbmV4cG9ydCBjb25zdCBDT05URVhUID0gOTtcbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IDEwO1xuZXhwb3J0IGNvbnN0IFJFTkRFUkVSX0ZBQ1RPUlkgPSAxMTtcbmV4cG9ydCBjb25zdCBSRU5ERVJFUiA9IDEyO1xuZXhwb3J0IGNvbnN0IFNBTklUSVpFUiA9IDEzO1xuZXhwb3J0IGNvbnN0IFRBSUwgPSAxNDtcbmV4cG9ydCBjb25zdCBDT05UQUlORVJfSU5ERVggPSAxNTtcbmV4cG9ydCBjb25zdCBDT05URU5UX1FVRVJJRVMgPSAxNjtcbmV4cG9ydCBjb25zdCBERUNMQVJBVElPTl9WSUVXID0gMTc7XG4vKiogU2l6ZSBvZiBMVmlldydzIGhlYWRlci4gTmVjZXNzYXJ5IHRvIGFkanVzdCBmb3IgaXQgd2hlbiBzZXR0aW5nIHNsb3RzLiAgKi9cbmV4cG9ydCBjb25zdCBIRUFERVJfT0ZGU0VUID0gMTg7XG5cblxuLy8gVGhpcyBpbnRlcmZhY2UgcmVwbGFjZXMgdGhlIHJlYWwgTFZpZXcgaW50ZXJmYWNlIGlmIGl0IGlzIGFuIGFyZyBvciBhXG4vLyByZXR1cm4gdmFsdWUgb2YgYSBwdWJsaWMgaW5zdHJ1Y3Rpb24uIFRoaXMgZW5zdXJlcyB3ZSBkb24ndCBuZWVkIHRvIGV4cG9zZVxuLy8gdGhlIGFjdHVhbCBpbnRlcmZhY2UsIHdoaWNoIHNob3VsZCBiZSBrZXB0IHByaXZhdGUuXG5leHBvcnQgaW50ZXJmYWNlIE9wYXF1ZVZpZXdTdGF0ZSB7XG4gICdfX2JyYW5kX18nOiAnQnJhbmQgZm9yIE9wYXF1ZVZpZXdTdGF0ZSB0aGF0IG5vdGhpbmcgd2lsbCBtYXRjaCc7XG59XG5cblxuLyoqXG4gKiBgTFZpZXdgIHN0b3JlcyBhbGwgb2YgdGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byBwcm9jZXNzIHRoZSBpbnN0cnVjdGlvbnMgYXNcbiAqIHRoZXkgYXJlIGludm9rZWQgZnJvbSB0aGUgdGVtcGxhdGUuIEVhY2ggZW1iZWRkZWQgdmlldyBhbmQgY29tcG9uZW50IHZpZXcgaGFzIGl0c1xuICogb3duIGBMVmlld2AuIFdoZW4gcHJvY2Vzc2luZyBhIHBhcnRpY3VsYXIgdmlldywgd2Ugc2V0IHRoZSBgdmlld0RhdGFgIHRvIHRoYXRcbiAqIGBMVmlld2AuIFdoZW4gdGhhdCB2aWV3IGlzIGRvbmUgcHJvY2Vzc2luZywgdGhlIGB2aWV3RGF0YWAgaXMgc2V0IGJhY2sgdG9cbiAqIHdoYXRldmVyIHRoZSBvcmlnaW5hbCBgdmlld0RhdGFgIHdhcyBiZWZvcmUgKHRoZSBwYXJlbnQgYExWaWV3YCkuXG4gKlxuICogS2VlcGluZyBzZXBhcmF0ZSBzdGF0ZSBmb3IgZWFjaCB2aWV3IGZhY2lsaXRpZXMgdmlldyBpbnNlcnRpb24gLyBkZWxldGlvbiwgc28gd2VcbiAqIGRvbid0IGhhdmUgdG8gZWRpdCB0aGUgZGF0YSBhcnJheSBiYXNlZCBvbiB3aGljaCB2aWV3cyBhcmUgcHJlc2VudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMVmlldyBleHRlbmRzIEFycmF5PGFueT4ge1xuICAvKipcbiAgICogVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIHZpZXcuIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhpcyBzbyB3ZSBjYW4gZWFzaWx5IHdhbGsgdXAgdGhlXG4gICAqIG5vZGUgdHJlZSBpbiBESSBhbmQgZ2V0IHRoZSBUVmlldy5kYXRhIGFycmF5IGFzc29jaWF0ZWQgd2l0aCBhIG5vZGUgKHdoZXJlIHRoZVxuICAgKiBkaXJlY3RpdmUgZGVmcyBhcmUgc3RvcmVkKS5cbiAgICovXG4gIHJlYWRvbmx5W1RWSUVXXTogVFZpZXc7XG5cbiAgLyoqIEZsYWdzIGZvciB0aGlzIHZpZXcuIFNlZSBMVmlld0ZsYWdzIGZvciBtb3JlIGluZm8uICovXG4gIFtGTEFHU106IExWaWV3RmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoZSBwYXJlbnQgdmlldyBpcyBuZWVkZWQgd2hlbiB3ZSBleGl0IHRoZSB2aWV3IGFuZCBtdXN0IHJlc3RvcmUgdGhlIHByZXZpb3VzXG4gICAqIGBMVmlld2AuIFdpdGhvdXQgdGhpcywgdGhlIHJlbmRlciBtZXRob2Qgd291bGQgaGF2ZSB0byBrZWVwIGEgc3RhY2sgb2ZcbiAgICogdmlld3MgYXMgaXQgaXMgcmVjdXJzaXZlbHkgcmVuZGVyaW5nIHRlbXBsYXRlcy5cbiAgICpcbiAgICogVGhpcyBpcyB0aGUgXCJpbnNlcnRpb25cIiB2aWV3IGZvciBlbWJlZGRlZCB2aWV3cy4gVGhpcyBhbGxvd3MgdXMgdG8gcHJvcGVybHlcbiAgICogZGVzdHJveSBlbWJlZGRlZCB2aWV3cy5cbiAgICovXG4gIFtQQVJFTlRdOiBMVmlld3xudWxsO1xuXG4gIC8qKlxuICAgKlxuICAgKiBUaGUgbmV4dCBzaWJsaW5nIExWaWV3IG9yIExDb250YWluZXIuXG4gICAqXG4gICAqIEFsbG93cyB1cyB0byBwcm9wYWdhdGUgYmV0d2VlbiBzaWJsaW5nIHZpZXcgc3RhdGVzIHRoYXQgYXJlbid0IGluIHRoZSBzYW1lXG4gICAqIGNvbnRhaW5lci4gRW1iZWRkZWQgdmlld3MgYWxyZWFkeSBoYXZlIGEgbm9kZS5uZXh0LCBidXQgaXQgaXMgb25seSBzZXQgZm9yXG4gICAqIHZpZXdzIGluIHRoZSBzYW1lIGNvbnRhaW5lci4gV2UgbmVlZCBhIHdheSB0byBsaW5rIGNvbXBvbmVudCB2aWV3cyBhbmQgdmlld3NcbiAgICogYWNyb3NzIGNvbnRhaW5lcnMgYXMgd2VsbC5cbiAgICovXG4gIFtORVhUXTogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKiBRdWVyaWVzIGFjdGl2ZSBmb3IgdGhpcyB2aWV3IC0gbm9kZXMgZnJvbSBhIHZpZXcgYXJlIHJlcG9ydGVkIHRvIHRob3NlIHF1ZXJpZXMuICovXG4gIFtRVUVSSUVTXTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGhvc3Qgbm9kZSBmb3IgdGhpcyBMVmlldyBpbnN0YW5jZSwgaWYgdGhpcyBpcyBhIGNvbXBvbmVudCB2aWV3LlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcsIEhPU1Qgd2lsbCBiZSBudWxsLlxuICAgKi9cbiAgW0hPU1RdOiBSRWxlbWVudHxTdHlsaW5nQ29udGV4dHxudWxsO1xuXG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgVFZpZXdOb2RlYCBvciBgVEVsZW1lbnROb2RlYCB3aGljaCByZXByZXNlbnRzIHRoZSByb290IG9mIHRoZSB2aWV3LlxuICAgKlxuICAgKiBJZiBgVFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLiBXZSBuZWVkIHRoaXMgdG8gYmUgYWJsZSB0b1xuICAgKiBlZmZpY2llbnRseSBmaW5kIHRoZSBgTFZpZXdOb2RlYCB3aGVuIGluc2VydGluZyB0aGUgdmlldyBpbnRvIGFuIGFuY2hvci5cbiAgICpcbiAgICogSWYgYFRFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIExWaWV3IG9mIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiBJZiBudWxsLCB0aGlzIGlzIHRoZSByb290IHZpZXcgb2YgYW4gYXBwbGljYXRpb24gKHJvb3QgY29tcG9uZW50IGlzIGluIHRoaXMgdmlldykuXG4gICAqL1xuICBbVF9IT1NUXTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgYmluZGluZyBpbmRleCB3ZSBzaG91bGQgYWNjZXNzIG5leHQuXG4gICAqXG4gICAqIFRoaXMgaXMgc3RvcmVkIHNvIHRoYXQgYmluZGluZ3MgY2FuIGNvbnRpbnVlIHdoZXJlIHRoZXkgbGVmdCBvZmZcbiAgICogaWYgYSB2aWV3IGlzIGxlZnQgbWlkd2F5IHRocm91Z2ggcHJvY2Vzc2luZyBiaW5kaW5ncyAoZS5nLiBpZiB0aGVyZSBpc1xuICAgKiBhIHNldHRlciB0aGF0IGNyZWF0ZXMgYW4gZW1iZWRkZWQgdmlldywgbGlrZSBpbiBuZ0lmKS5cbiAgICovXG4gIFtCSU5ESU5HX0lOREVYXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAgICogdW5zdWJzY3JpYmVkLiBUaGlzIGNvbnRleHQgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZnVuY3Rpb25zIHdyYXBwZWQgd2l0aFxuICAgKiB0aGVpciBjb250ZXh0IGFuZCBvdXRwdXQgc3Vic2NyaXB0aW9uIGluc3RhbmNlcyBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuXG4gICAqXG4gICAqIFRoZXNlIGNoYW5nZSBwZXIgTFZpZXcgaW5zdGFuY2UsIHNvIHRoZXkgY2Fubm90IGJlIHN0b3JlZCBvbiBUVmlldy4gSW5zdGVhZCxcbiAgICogVFZpZXcuY2xlYW51cCBzYXZlcyBhbiBpbmRleCB0byB0aGUgbmVjZXNzYXJ5IGNvbnRleHQgaW4gdGhpcyBhcnJheS5cbiAgICovXG4gIC8vIFRPRE86IGZsYXR0ZW4gaW50byBMVmlld1tdXG4gIFtDTEVBTlVQXTogYW55W118bnVsbDtcblxuICAvKipcbiAgICogLSBGb3IgZHluYW1pYyB2aWV3cywgdGhpcyBpcyB0aGUgY29udGV4dCB3aXRoIHdoaWNoIHRvIHJlbmRlciB0aGUgdGVtcGxhdGUgKGUuZy5cbiAgICogICBgTmdGb3JDb250ZXh0YCksIG9yIGB7fWAgaWYgbm90IGRlZmluZWQgZXhwbGljaXRseS5cbiAgICogLSBGb3Igcm9vdCB2aWV3IG9mIHRoZSByb290IGNvbXBvbmVudCB0aGUgY29udGV4dCBjb250YWlucyBjaGFuZ2UgZGV0ZWN0aW9uIGRhdGEuXG4gICAqIC0gRm9yIG5vbi1yb290IGNvbXBvbmVudHMsIHRoZSBjb250ZXh0IGlzIHRoZSBjb21wb25lbnQgaW5zdGFuY2UsXG4gICAqIC0gRm9yIGlubGluZSB2aWV3cywgdGhlIGNvbnRleHQgaXMgbnVsbC5cbiAgICovXG4gIFtDT05URVhUXToge318Um9vdENvbnRleHR8bnVsbDtcblxuICAvKiogQW4gb3B0aW9uYWwgTW9kdWxlIEluamVjdG9yIHRvIGJlIHVzZWQgYXMgZmFsbCBiYWNrIGFmdGVyIEVsZW1lbnQgSW5qZWN0b3JzIGFyZSBjb25zdWx0ZWQuICovXG4gIHJlYWRvbmx5W0lOSkVDVE9SXTogSW5qZWN0b3J8bnVsbDtcblxuICAvKiogUmVuZGVyZXIgdG8gYmUgdXNlZCBmb3IgdGhpcyB2aWV3LiAqL1xuICBbUkVOREVSRVJfRkFDVE9SWV06IFJlbmRlcmVyRmFjdG9yeTM7XG5cbiAgLyoqIFJlbmRlcmVyIHRvIGJlIHVzZWQgZm9yIHRoaXMgdmlldy4gKi9cbiAgW1JFTkRFUkVSXTogUmVuZGVyZXIzO1xuXG4gIC8qKiBBbiBvcHRpb25hbCBjdXN0b20gc2FuaXRpemVyLiAqL1xuICBbU0FOSVRJWkVSXTogU2FuaXRpemVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIFRoZSB0YWlsIGFsbG93cyB1cyB0byBxdWlja2x5IGFkZCBhIG5ldyBzdGF0ZSB0byB0aGUgZW5kIG9mIHRoZSB2aWV3IGxpc3RcbiAgICogd2l0aG91dCBoYXZpbmcgdG8gcHJvcGFnYXRlIHN0YXJ0aW5nIGZyb20gdGhlIGZpcnN0IGNoaWxkLlxuICAgKi9cbiAgW1RBSUxdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGNvbnRhaW5lcidzIGhvc3Qgbm9kZS4gQXBwbGljYWJsZSBvbmx5IHRvIGVtYmVkZGVkIHZpZXdzIHRoYXRcbiAgICogaGF2ZSBiZWVuIGluc2VydGVkIGR5bmFtaWNhbGx5LiBXaWxsIGJlIC0xIGZvciBjb21wb25lbnQgdmlld3MgYW5kIGlubGluZSB2aWV3cy5cbiAgICpcbiAgICogVGhpcyBpcyBuZWNlc3NhcnkgdG8ganVtcCBmcm9tIGR5bmFtaWNhbGx5IGNyZWF0ZWQgZW1iZWRkZWQgdmlld3MgdG8gdGhlaXIgcGFyZW50XG4gICAqIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGVpciBwYXJlbnQgY2Fubm90IGJlIHN0b3JlZCBvbiB0aGUgVFZpZXdOb2RlICh2aWV3cyBtYXkgYmUgaW5zZXJ0ZWRcbiAgICogaW4gbXVsdGlwbGUgY29udGFpbmVycywgc28gdGhlIHBhcmVudCBjYW5ub3QgYmUgc2hhcmVkIGJldHdlZW4gdmlldyBpbnN0YW5jZXMpLlxuICAgKi9cbiAgW0NPTlRBSU5FUl9JTkRFWF06IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIFF1ZXJ5TGlzdHMgYXNzb2NpYXRlZCB3aXRoIGNvbnRlbnQgcXVlcmllcyBvZiBhIGRpcmVjdGl2ZS4gVGhpcyBkYXRhIHN0cnVjdHVyZSBpc1xuICAgKiBmaWxsZWQtaW4gYXMgcGFydCBvZiBhIGRpcmVjdGl2ZSBjcmVhdGlvbiBwcm9jZXNzIGFuZCBpcyBsYXRlciB1c2VkIHRvIHJldHJpZXZlIGEgUXVlcnlMaXN0IHRvXG4gICAqIGJlIHJlZnJlc2hlZC5cbiAgICovXG4gIFtDT05URU5UX1FVRVJJRVNdOiBRdWVyeUxpc3Q8YW55PltdfG51bGw7XG5cbiAgLyoqXG4gICAqIFZpZXcgd2hlcmUgdGhpcyB2aWV3J3MgdGVtcGxhdGUgd2FzIGRlY2xhcmVkLlxuICAgKlxuICAgKiBPbmx5IGFwcGxpY2FibGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuIFdpbGwgYmUgbnVsbCBmb3IgaW5saW5lL2NvbXBvbmVudCB2aWV3cy5cbiAgICpcbiAgICogVGhlIHRlbXBsYXRlIGZvciBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBtYXkgYmUgZGVjbGFyZWQgaW4gYSBkaWZmZXJlbnQgdmlldyB0aGFuXG4gICAqIGl0IGlzIGluc2VydGVkLiBXZSBhbHJlYWR5IHRyYWNrIHRoZSBcImluc2VydGlvbiB2aWV3XCIgKHZpZXcgd2hlcmUgdGhlIHRlbXBsYXRlIHdhc1xuICAgKiBpbnNlcnRlZCkgaW4gTFZpZXdbUEFSRU5UXSwgYnV0IHdlIGFsc28gbmVlZCBhY2Nlc3MgdG8gdGhlIFwiZGVjbGFyYXRpb24gdmlld1wiXG4gICAqICh2aWV3IHdoZXJlIHRoZSB0ZW1wbGF0ZSB3YXMgZGVjbGFyZWQpLiBPdGhlcndpc2UsIHdlIHdvdWxkbid0IGJlIGFibGUgdG8gY2FsbCB0aGVcbiAgICogdmlldydzIHRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlciBjb250ZXh0cy4gQ29udGV4dCBzaG91bGQgYmUgaW5oZXJpdGVkIGZyb21cbiAgICogdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSwgbm90IHRoZSBpbnNlcnRpb24gdmlldyB0cmVlLlxuICAgKlxuICAgKiBFeGFtcGxlIChBcHBDb21wb25lbnQgdGVtcGxhdGUpOlxuICAgKlxuICAgKiA8bmctdGVtcGxhdGUgI2Zvbz48L25nLXRlbXBsYXRlPiAgICAgICA8LS0gZGVjbGFyZWQgaGVyZSAtLT5cbiAgICogPHNvbWUtY29tcCBbdHBsXT1cImZvb1wiPjwvc29tZS1jb21wPiAgICA8LS0gaW5zZXJ0ZWQgaW5zaWRlIHRoaXMgY29tcG9uZW50IC0tPlxuICAgKlxuICAgKiBUaGUgPG5nLXRlbXBsYXRlPiBhYm92ZSBpcyBkZWNsYXJlZCBpbiB0aGUgQXBwQ29tcG9uZW50IHRlbXBsYXRlLCBidXQgaXQgd2lsbCBiZSBwYXNzZWQgaW50b1xuICAgKiBTb21lQ29tcCBhbmQgaW5zZXJ0ZWQgdGhlcmUuIEluIHRoaXMgY2FzZSwgdGhlIGRlY2xhcmF0aW9uIHZpZXcgd291bGQgYmUgdGhlIEFwcENvbXBvbmVudCxcbiAgICogYnV0IHRoZSBpbnNlcnRpb24gdmlldyB3b3VsZCBiZSBTb21lQ29tcC4gV2hlbiB3ZSBhcmUgcmVtb3Zpbmcgdmlld3MsIHdlIHdvdWxkIHdhbnQgdG9cbiAgICogdHJhdmVyc2UgdGhyb3VnaCB0aGUgaW5zZXJ0aW9uIHZpZXcgdG8gY2xlYW4gdXAgbGlzdGVuZXJzLiBXaGVuIHdlIGFyZSBjYWxsaW5nIHRoZVxuICAgKiB0ZW1wbGF0ZSBmdW5jdGlvbiBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgd2UgbmVlZCB0aGUgZGVjbGFyYXRpb24gdmlldyB0byBnZXQgaW5oZXJpdGVkXG4gICAqIGNvbnRleHQuXG4gICAqL1xuICBbREVDTEFSQVRJT05fVklFV106IExWaWV3fG51bGw7XG59XG5cbi8qKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggYW4gTFZpZXcgKHNhdmVkIGluIExWaWV3W0ZMQUdTXSkgKi9cbmV4cG9ydCBjb25zdCBlbnVtIExWaWV3RmxhZ3Mge1xuICAvKiogVGhlIHN0YXRlIG9mIHRoZSBpbml0IHBoYXNlIG9uIHRoZSBmaXJzdCAyIGJpdHMgKi9cbiAgSW5pdFBoYXNlU3RhdGVJbmNyZW1lbnRlciA9IDBiMDAwMDAwMDAwMDEsXG4gIEluaXRQaGFzZVN0YXRlTWFzayA9IDBiMDAwMDAwMDAwMTEsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSB2aWV3IGlzIGluIGNyZWF0aW9uTW9kZS5cbiAgICpcbiAgICogVGhpcyBtdXN0IGJlIHN0b3JlZCBpbiB0aGUgdmlldyByYXRoZXIgdGhhbiB1c2luZyBgZGF0YWAgYXMgYSBtYXJrZXIgc28gdGhhdFxuICAgKiB3ZSBjYW4gcHJvcGVybHkgc3VwcG9ydCBlbWJlZGRlZCB2aWV3cy4gT3RoZXJ3aXNlLCB3aGVuIGV4aXRpbmcgYSBjaGlsZCB2aWV3XG4gICAqIGJhY2sgaW50byB0aGUgcGFyZW50IHZpZXcsIGBkYXRhYCB3aWxsIGJlIGRlZmluZWQgYW5kIGBjcmVhdGlvbk1vZGVgIHdpbGwgYmVcbiAgICogaW1wcm9wZXJseSByZXBvcnRlZCBhcyBmYWxzZS5cbiAgICovXG4gIENyZWF0aW9uTW9kZSA9IDBiMDAwMDAwMDAxMDAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgTFZpZXcgaW5zdGFuY2UgaXMgb24gaXRzIGZpcnN0IHByb2Nlc3NpbmcgcGFzcy5cbiAgICpcbiAgICogQW4gTFZpZXcgaW5zdGFuY2UgaXMgY29uc2lkZXJlZCB0byBiZSBvbiBpdHMgXCJmaXJzdCBwYXNzXCIgdW50aWwgaXRcbiAgICogaGFzIGNvbXBsZXRlZCBvbmUgY3JlYXRpb24gbW9kZSBydW4gYW5kIG9uZSB1cGRhdGUgbW9kZSBydW4uIEF0IHRoaXNcbiAgICogdGltZSwgdGhlIGZsYWcgaXMgdHVybmVkIG9mZi5cbiAgICovXG4gIEZpcnN0TFZpZXdQYXNzID0gMGIwMDAwMDAwMTAwMCxcblxuICAvKiogV2hldGhlciB0aGlzIHZpZXcgaGFzIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneSAoY2hlY2tzIGFsd2F5cykgb3Igb25QdXNoICovXG4gIENoZWNrQWx3YXlzID0gMGIwMDAwMDAxMDAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgbWFudWFsIGNoYW5nZSBkZXRlY3Rpb24gaXMgdHVybmVkIG9uIGZvciBvblB1c2ggY29tcG9uZW50cy5cbiAgICpcbiAgICogVGhpcyBpcyBhIHNwZWNpYWwgbW9kZSB0aGF0IG9ubHkgbWFya3MgY29tcG9uZW50cyBkaXJ0eSBpbiB0d28gY2FzZXM6XG4gICAqIDEpIFRoZXJlIGhhcyBiZWVuIGEgY2hhbmdlIHRvIGFuIEBJbnB1dCBwcm9wZXJ0eVxuICAgKiAyKSBgbWFya0RpcnR5KClgIGhhcyBiZWVuIGNhbGxlZCBtYW51YWxseSBieSB0aGUgdXNlclxuICAgKlxuICAgKiBOb3RlIHRoYXQgaW4gdGhpcyBtb2RlLCB0aGUgZmlyaW5nIG9mIGV2ZW50cyBkb2VzIE5PVCBtYXJrIGNvbXBvbmVudHNcbiAgICogZGlydHkgYXV0b21hdGljYWxseS5cbiAgICpcbiAgICogTWFudWFsIG1vZGUgaXMgdHVybmVkIG9mZiBieSBkZWZhdWx0IGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgYXMgZXZlbnRzXG4gICAqIGF1dG9tYXRpY2FsbHkgbWFyayBPblB1c2ggY29tcG9uZW50cyBkaXJ0eSBpbiBWaWV3IEVuZ2luZS5cbiAgICpcbiAgICogVE9ETzogQWRkIGEgcHVibGljIEFQSSB0byBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSB0byB0dXJuIHRoaXMgbW9kZSBvblxuICAgKi9cbiAgTWFudWFsT25QdXNoID0gMGIwMDAwMDEwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBkaXJ0eSAobmVlZGluZyBjaGVjaykgKi9cbiAgRGlydHkgPSAwYjAwMDAwMTAwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBhdHRhY2hlZCB0byBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuICovXG4gIEF0dGFjaGVkID0gMGIwMDAwMTAwMDAwMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBkZXN0cm95ZWQuICovXG4gIERlc3Ryb3llZCA9IDBiMDAwMTAwMDAwMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgdGhlIHJvb3QgdmlldyAqL1xuICBJc1Jvb3QgPSAwYjAwMTAwMDAwMDAwMCxcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIGN1cnJlbnQgaW5pdCBwaGFzZSBvbiBsYXN0IDIyIGJpdHNcbiAgICovXG4gIEluZGV4V2l0aGluSW5pdFBoYXNlSW5jcmVtZW50ZXIgPSAwYjAxMDAwMDAwMDAwMCxcbiAgSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdCA9IDEwLFxuICBJbmRleFdpdGhpbkluaXRQaGFzZVJlc2V0ID0gMGIwMDExMTExMTExMTEsXG59XG5cbi8qKlxuICogUG9zc2libGUgc3RhdGVzIG9mIHRoZSBpbml0IHBoYXNlOlxuICogLSAwMDogT25Jbml0IGhvb2tzIHRvIGJlIHJ1bi5cbiAqIC0gMDE6IEFmdGVyQ29udGVudEluaXQgaG9va3MgdG8gYmUgcnVuXG4gKiAtIDEwOiBBZnRlclZpZXdJbml0IGhvb2tzIHRvIGJlIHJ1blxuICogLSAxMTogQWxsIGluaXQgaG9va3MgaGF2ZSBiZWVuIHJ1blxuICovXG5leHBvcnQgY29uc3QgZW51bSBJbml0UGhhc2VTdGF0ZSB7XG4gIE9uSW5pdEhvb2tzVG9CZVJ1biA9IDBiMDAsXG4gIEFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4gPSAwYjAxLFxuICBBZnRlclZpZXdJbml0SG9va3NUb0JlUnVuID0gMGIxMCxcbiAgSW5pdFBoYXNlQ29tcGxldGVkID0gMGIxMSxcbn1cblxuLyoqXG4gKiBUaGUgc3RhdGljIGRhdGEgZm9yIGFuIExWaWV3IChzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIG9mIGFcbiAqIGdpdmVuIHR5cGUpLlxuICpcbiAqIFN0b3JlZCBvbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gYXMgbmdQcml2YXRlRGF0YS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlldyB7XG4gIC8qKlxuICAgKiBJRCBmb3IgaW5saW5lIHZpZXdzIHRvIGRldGVybWluZSB3aGV0aGVyIGEgdmlldyBpcyB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgdmlld1xuICAgKiBpbiBhIGNlcnRhaW4gcG9zaXRpb24uIElmIGl0J3Mgbm90LCB3ZSBrbm93IHRoZSBuZXcgdmlldyBuZWVkcyB0byBiZSBpbnNlcnRlZFxuICAgKiBhbmQgdGhlIG9uZSB0aGF0IGV4aXN0cyBuZWVkcyB0byBiZSByZW1vdmVkIChlLmcuIGlmL2Vsc2Ugc3RhdGVtZW50cylcbiAgICpcbiAgICogSWYgdGhpcyBpcyAtMSwgdGhlbiB0aGlzIGlzIGEgY29tcG9uZW50IHZpZXcgb3IgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcuXG4gICAqL1xuICByZWFkb25seSBpZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGEgYmx1ZXByaW50IHVzZWQgdG8gZ2VuZXJhdGUgTFZpZXcgaW5zdGFuY2VzIGZvciB0aGlzIFRWaWV3LiBDb3B5aW5nIHRoaXNcbiAgICogYmx1ZXByaW50IGlzIGZhc3RlciB0aGFuIGNyZWF0aW5nIGEgbmV3IExWaWV3IGZyb20gc2NyYXRjaC5cbiAgICovXG4gIGJsdWVwcmludDogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiB1c2VkIHRvIHJlZnJlc2ggdGhlIHZpZXcgb2YgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3c1xuICAgKiBhbmQgY29tcG9uZW50cy4gV2lsbCBiZSBudWxsIGZvciBpbmxpbmUgdmlld3MuXG4gICAqL1xuICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gY29udGFpbmluZyBxdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucy5cbiAgICovXG4gIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIFBvaW50ZXIgdG8gdGhlIGBUTm9kZWAgdGhhdCByZXByZXNlbnRzIHRoZSByb290IG9mIHRoZSB2aWV3LlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGEgYFRWaWV3Tm9kZWAgZm9yIGFuIGBMVmlld05vZGVgLCB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgYSBjb250YWluZXIuXG4gICAqIFdlIG5lZWQgdGhpcyBwb2ludGVyIHRvIGJlIGFibGUgdG8gZWZmaWNpZW50bHkgZmluZCB0aGlzIG5vZGUgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXdcbiAgICogaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVEVsZW1lbnROb2RlYCwgdGhpcyBpcyB0aGUgdmlldyBvZiBhIHJvb3QgY29tcG9uZW50LiBJdCBoYXMgZXhhY3RseSBvbmVcbiAgICogcm9vdCBUTm9kZS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBudWxsLCB0aGlzIGlzIHRoZSB2aWV3IG9mIGEgY29tcG9uZW50IHRoYXQgaXMgbm90IGF0IHJvb3QuIFdlIGRvIG5vdCBzdG9yZVxuICAgKiB0aGUgaG9zdCBUTm9kZXMgZm9yIGNoaWxkIGNvbXBvbmVudCB2aWV3cyBiZWNhdXNlIHRoZXkgY2FuIHBvdGVudGlhbGx5IGhhdmUgc2V2ZXJhbFxuICAgKiBkaWZmZXJlbnQgaG9zdCBUTm9kZXMsIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IGlzIGJlaW5nIHVzZWQuIFRoZXNlIGhvc3RcbiAgICogVE5vZGVzIGNhbm5vdCBiZSBzaGFyZWQgKGR1ZSB0byBkaWZmZXJlbnQgaW5kaWNlcywgZXRjKS5cbiAgICovXG4gIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbDtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB0ZW1wbGF0ZSBoYXMgYmVlbiBwcm9jZXNzZWQuICovXG4gIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuO1xuXG4gIC8qKiBTdGF0aWMgZGF0YSBlcXVpdmFsZW50IG9mIExWaWV3LmRhdGFbXS4gQ29udGFpbnMgVE5vZGVzLCBQaXBlRGVmSW50ZXJuYWwgb3IgVEkxOG4uICovXG4gIGRhdGE6IFREYXRhO1xuXG4gIC8qKlxuICAgKiBUaGUgYmluZGluZyBzdGFydCBpbmRleCBpcyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGRhdGEgYXJyYXlcbiAgICogc3RhcnRzIHRvIHN0b3JlIGJpbmRpbmdzIG9ubHkuIFNhdmluZyB0aGlzIHZhbHVlIGVuc3VyZXMgdGhhdCB3ZVxuICAgKiB3aWxsIGJlZ2luIHJlYWRpbmcgYmluZGluZ3MgYXQgdGhlIGNvcnJlY3QgcG9pbnQgaW4gdGhlIGFycmF5IHdoZW5cbiAgICogd2UgYXJlIGluIHVwZGF0ZSBtb2RlLlxuICAgKi9cbiAgYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGV4IHdoZXJlIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uIG9mIGBMVmlld2AgYmVnaW5zLiBUaGUgZXhwYW5kb1xuICAgKiBzZWN0aW9uIGNvbnRhaW5zIGluamVjdG9ycywgZGlyZWN0aXZlIGluc3RhbmNlcywgYW5kIGhvc3QgYmluZGluZyB2YWx1ZXMuXG4gICAqIFVubGlrZSB0aGUgXCJjb25zdHNcIiBhbmQgXCJ2YXJzXCIgc2VjdGlvbnMgb2YgYExWaWV3YCwgdGhlIGxlbmd0aCBvZiB0aGlzXG4gICAqIHNlY3Rpb24gY2Fubm90IGJlIGNhbGN1bGF0ZWQgYXQgY29tcGlsZS10aW1lIGJlY2F1c2UgZGlyZWN0aXZlcyBhcmUgbWF0Y2hlZFxuICAgKiBhdCBydW50aW1lIHRvIHByZXNlcnZlIGxvY2FsaXR5LlxuICAgKlxuICAgKiBXZSBzdG9yZSB0aGlzIHN0YXJ0IGluZGV4IHNvIHdlIGtub3cgd2hlcmUgdG8gc3RhcnQgY2hlY2tpbmcgaG9zdCBiaW5kaW5nc1xuICAgKiBpbiBgc2V0SG9zdEJpbmRpbmdzYC5cbiAgICovXG4gIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCB3aGVyZSB0aGUgdmlld1F1ZXJpZXMgc2VjdGlvbiBvZiBgTFZpZXdgIGJlZ2lucy4gVGhpcyBzZWN0aW9uIGNvbnRhaW5zXG4gICAqIHZpZXcgcXVlcmllcyBkZWZpbmVkIGZvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUuXG4gICAqXG4gICAqIFdlIHN0b3JlIHRoaXMgc3RhcnQgaW5kZXggc28gd2Uga25vdyB3aGVyZSB0aGUgbGlzdCBvZiB2aWV3IHF1ZXJpZXMgc3RhcnRzLlxuICAgKiBUaGlzIGlzIHJlcXVpcmVkIHdoZW4gd2UgaW52b2tlIHZpZXcgcXVlcmllcyBhdCBydW50aW1lLiBXZSBpbnZva2UgcXVlcmllcyBvbmUgYnkgb25lIGFuZFxuICAgKiBpbmNyZW1lbnQgcXVlcnkgaW5kZXggYWZ0ZXIgZWFjaCBpdGVyYXRpb24uIFRoaXMgaW5mb3JtYXRpb24gaGVscHMgdXMgdG8gcmVzZXQgaW5kZXggYmFjayB0b1xuICAgKiB0aGUgYmVnaW5uaW5nIG9mIHZpZXcgcXVlcnkgbGlzdCBiZWZvcmUgd2UgaW52b2tlIHZpZXcgcXVlcmllcyBhZ2Fpbi5cbiAgICovXG4gIHZpZXdRdWVyeVN0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIGhvc3Qgbm9kZSBvZiB0aGUgZmlyc3QgTFZpZXcgb3IgTENvbnRhaW5lciBiZW5lYXRoIHRoaXMgTFZpZXcgaW5cbiAgICogdGhlIGhpZXJhcmNoeS5cbiAgICpcbiAgICogTmVjZXNzYXJ5IHRvIHN0b3JlIHRoaXMgc28gdmlld3MgY2FuIHRyYXZlcnNlIHRocm91Z2ggdGhlaXIgbmVzdGVkIHZpZXdzXG4gICAqIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAgICpcbiAgICogRm9yIGVtYmVkZGVkIHZpZXdzLCB3ZSBzdG9yZSB0aGUgaW5kZXggb2YgYW4gTENvbnRhaW5lcidzIGhvc3QgcmF0aGVyIHRoYW4gdGhlIGZpcnN0XG4gICAqIExWaWV3IHRvIGF2b2lkIG1hbmFnaW5nIHNwbGljaW5nIHdoZW4gdmlld3MgYXJlIGFkZGVkL3JlbW92ZWQuXG4gICAqL1xuICBjaGlsZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIGxvY2F0ZWQgaW4gdGhlIHZpZXcuXG4gICAqL1xuICBmaXJzdENoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gcHJvY2VzcyBob3N0IGJpbmRpbmdzIGVmZmljaWVudGx5LlxuICAgKlxuICAgKiBTZWUgVklFV19EQVRBLm1kIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgZXhwYW5kb0luc3RydWN0aW9uczogKG51bWJlcnxIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+fG51bGwpW118bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSXQncyBuZWNlc3NhcnkgdG8ga2VlcCBhIGNvcHkgb2YgdGhlIGZ1bGwgZGVmIGxpc3Qgb24gdGhlIFRWaWV3IHNvIGl0J3MgcG9zc2libGVcbiAgICogdG8gcmVuZGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB3aXRob3V0IGEgaG9zdCBjb21wb25lbnQuXG4gICAqL1xuICBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBGdWxsIHJlZ2lzdHJ5IG9mIHBpcGVzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgUGlwZURlZnNgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBQaXBlRGVmc2BzLiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAgICpcbiAgICogSXQncyBuZWNlc3NhcnkgdG8ga2VlcCBhIGNvcHkgb2YgdGhlIGZ1bGwgZGVmIGxpc3Qgb24gdGhlIFRWaWV3IHNvIGl0J3MgcG9zc2libGVcbiAgICogdG8gcmVuZGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB3aXRob3V0IGEgaG9zdCBjb21wb25lbnQuXG4gICAqL1xuICBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nT25Jbml0IGFuZCBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgaW5pdEhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpbiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkXG4gICAqIGZvciB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlXG4gICAqIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdJbml0IGFuZCBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yXG4gICAqIHRoaXMgdmlldyBpbiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uRGVzdHJveSBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCB3aGVuIHRoaXMgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICAgKiB1bnN1YnNjcmliZWQuIFRoaXMgY2xlYW51cCBhcnJheSBzdG9yZXMgYm90aCBsaXN0ZW5lciBkYXRhIChpbiBjaHVua3Mgb2YgNClcbiAgICogYW5kIG91dHB1dCBkYXRhIChpbiBjaHVua3Mgb2YgMikgZm9yIGEgcGFydGljdWxhciB2aWV3LiBDb21iaW5pbmcgdGhlIGFycmF5c1xuICAgKiBzYXZlcyBvbiBtZW1vcnkgKDcwIGJ5dGVzIHBlciBhcnJheSkgYW5kIG9uIGEgZmV3IGJ5dGVzIG9mIGNvZGUgc2l6ZSAoZm9yIHR3b1xuICAgKiBzZXBhcmF0ZSBmb3IgbG9vcHMpLlxuICAgKlxuICAgKiBJZiBpdCdzIGEgbmF0aXZlIERPTSBsaXN0ZW5lciBvciBvdXRwdXQgc3Vic2NyaXB0aW9uIGJlaW5nIHN0b3JlZDpcbiAgICogMXN0IGluZGV4IGlzOiBldmVudCBuYW1lICBgbmFtZSA9IHRWaWV3LmNsZWFudXBbaSswXWBcbiAgICogMm5kIGluZGV4IGlzOiBpbmRleCBvZiBuYXRpdmUgZWxlbWVudCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0cmlldmVzIGdsb2JhbCB0YXJnZXQgKHdpbmRvdyxcbiAgICogICAgICAgICAgICAgICBkb2N1bWVudCBvciBib2R5KSByZWZlcmVuY2UgYmFzZWQgb24gdGhlIG5hdGl2ZSBlbGVtZW50OlxuICAgKiAgICBgdHlwZW9mIGlkeE9yVGFyZ2V0R2V0dGVyID09PSAnZnVuY3Rpb24nYDogZ2xvYmFsIHRhcmdldCBnZXR0ZXIgZnVuY3Rpb25cbiAgICogICAgYHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ251bWJlcidgOiBpbmRleCBvZiBuYXRpdmUgZWxlbWVudFxuICAgKlxuICAgKiAzcmQgaW5kZXggaXM6IGluZGV4IG9mIGxpc3RlbmVyIGZ1bmN0aW9uIGBsaXN0ZW5lciA9IGxWaWV3W0NMRUFOVVBdW3RWaWV3LmNsZWFudXBbaSsyXV1gXG4gICAqIDR0aCBpbmRleCBpczogYHVzZUNhcHR1cmVPckluZHggPSB0Vmlldy5jbGVhbnVwW2krM11gXG4gICAqICAgIGB0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PSAnYm9vbGVhbicgOiB1c2VDYXB0dXJlIGJvb2xlYW5cbiAgICogICAgYHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09ICdudW1iZXInOlxuICAgKiAgICAgICAgIGB1c2VDYXB0dXJlT3JJbmR4ID49IDBgIGByZW1vdmVMaXN0ZW5lciA9IExWaWV3W0NMRUFOVVBdW3VzZUNhcHR1cmVPckluZHhdYFxuICAgKiAgICAgICAgIGB1c2VDYXB0dXJlT3JJbmR4IDwgIDBgIGBzdWJzY3JpcHRpb24gPSBMVmlld1tDTEVBTlVQXVstdXNlQ2FwdHVyZU9ySW5keF1gXG4gICAqXG4gICAqIElmIGl0J3MgYSByZW5kZXJlcjIgc3R5bGUgbGlzdGVuZXIgb3IgVmlld1JlZiBkZXN0cm95IGhvb2sgYmVpbmcgc3RvcmVkOlxuICAgKiAxc3QgaW5kZXggaXM6IGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNbXVxuICAgKiAybmQgaW5kZXggaXM6IGBudWxsYFxuICAgKiAgICAgICAgICAgICAgIGBsVmlld1tDTEVBTlVQXVt0Vmlldy5jbGVhbnVwW2krMF1dKClgXG4gICAqXG4gICAqIElmIGl0J3MgYW4gb3V0cHV0IHN1YnNjcmlwdGlvbiBvciBxdWVyeSBsaXN0IGRlc3Ryb3kgaG9vazpcbiAgICogMXN0IGluZGV4IGlzOiBvdXRwdXQgdW5zdWJzY3JpYmUgZnVuY3Rpb24gLyBxdWVyeSBsaXN0IGRlc3Ryb3kgZnVuY3Rpb25cbiAgICogMm5kIGluZGV4IGlzOiBpbmRleCBvZiBmdW5jdGlvbiBjb250ZXh0IGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNbXVxuICAgKiAgICAgICAgICAgICAgIGB0Vmlldy5jbGVhbnVwW2krMF0uY2FsbChsVmlld1tDTEVBTlVQXVt0Vmlldy5jbGVhbnVwW2krMV1dKWBcbiAgICovXG4gIGNsZWFudXA6IGFueVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBlbGVtZW50IGluZGljZXMgZm9yIGNoaWxkIGNvbXBvbmVudHMgdGhhdCB3aWxsIG5lZWQgdG8gYmVcbiAgICogcmVmcmVzaGVkIHdoZW4gdGhlIGN1cnJlbnQgdmlldyBoYXMgZmluaXNoZWQgaXRzIGNoZWNrLiBUaGVzZSBpbmRpY2VzIGhhdmVcbiAgICogYWxyZWFkeSBiZWVuIGFkanVzdGVkIGZvciB0aGUgSEVBREVSX09GRlNFVC5cbiAgICpcbiAgICovXG4gIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBpbmRpY2VzIGZvciBjaGlsZCBkaXJlY3RpdmVzIHRoYXQgaGF2ZSBjb250ZW50IHF1ZXJpZXMuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUm9vdENvbnRleHRGbGFncyB7RW1wdHkgPSAwYjAwLCBEZXRlY3RDaGFuZ2VzID0gMGIwMSwgRmx1c2hQbGF5ZXJzID0gMGIxMH1cblxuXG4vKipcbiAqIFJvb3RDb250ZXh0IGNvbnRhaW5zIGluZm9ybWF0aW9uIHdoaWNoIGlzIHNoYXJlZCBmb3IgYWxsIGNvbXBvbmVudHMgd2hpY2hcbiAqIHdlcmUgYm9vdHN0cmFwcGVkIHdpdGgge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm9vdENvbnRleHQge1xuICAvKipcbiAgICogQSBmdW5jdGlvbiB1c2VkIGZvciBzY2hlZHVsaW5nIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGZ1dHVyZS4gVXN1YWxseVxuICAgKiB0aGlzIGlzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICAgKi9cbiAgc2NoZWR1bGVyOiAod29ya0ZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkO1xuXG4gIC8qKlxuICAgKiBBIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiBhbGwgY29tcG9uZW50cyBhcmUgY29uc2lkZXJlZCBjbGVhbiAobm90IGRpcnR5KS5cbiAgICpcbiAgICogVGhpcyBwcm9taXNlIGlzIG92ZXJ3cml0dGVuIGV2ZXJ5IHRpbWUgYSBmaXJzdCBjYWxsIHRvIHtAbGluayBtYXJrRGlydHl9IGlzIGludm9rZWQuXG4gICAqL1xuICBjbGVhbjogUHJvbWlzZTxudWxsPjtcblxuICAvKipcbiAgICogUm9vdENvbXBvbmVudHMgLSBUaGUgY29tcG9uZW50cyB0aGF0IHdlcmUgaW5zdGFudGlhdGVkIGJ5IHRoZSBjYWxsIHRvXG4gICAqIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICAgKi9cbiAgY29tcG9uZW50czoge31bXTtcblxuICAvKipcbiAgICogVGhlIHBsYXllciBmbHVzaGluZyBoYW5kbGVyIHRvIGtpY2sgb2ZmIGFsbCBhbmltYXRpb25zXG4gICAqL1xuICBwbGF5ZXJIYW5kbGVyOiBQbGF5ZXJIYW5kbGVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFdoYXQgcmVuZGVyLXJlbGF0ZWQgb3BlcmF0aW9ucyB0byBydW4gb25jZSBhIHNjaGVkdWxlciBoYXMgYmVlbiBzZXRcbiAgICovXG4gIGZsYWdzOiBSb290Q29udGV4dEZsYWdzO1xufVxuXG4vKipcbiAqIEFycmF5IG9mIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICovXG5leHBvcnQgdHlwZSBIb29rRGF0YSA9IChudW1iZXIgfCAoKCkgPT4gdm9pZCkpW107XG5cbi8qKlxuICogU3RhdGljIGRhdGEgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdGFuY2Utc3BlY2lmaWMgZGF0YSBhcnJheSBvbiBhbiBMVmlldy5cbiAqXG4gKiBFYWNoIG5vZGUncyBzdGF0aWMgZGF0YSBpcyBzdG9yZWQgaW4gdERhdGEgYXQgdGhlIHNhbWUgaW5kZXggdGhhdCBpdCdzIHN0b3JlZFxuICogaW4gdGhlIGRhdGEgYXJyYXkuICBBbnkgbm9kZXMgdGhhdCBkbyBub3QgaGF2ZSBzdGF0aWMgZGF0YSBzdG9yZSBhIG51bGwgdmFsdWUgaW5cbiAqIHREYXRhIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5LlxuICpcbiAqIEVhY2ggcGlwZSdzIGRlZmluaXRpb24gaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHBpcGUgaW5zdGFuY2UgaW5cbiAqIHRoZSBkYXRhIGFycmF5LlxuICpcbiAqIEVhY2ggaG9zdCBwcm9wZXJ0eSdzIG5hbWUgaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHZhbHVlIGluIHRoZVxuICogZGF0YSBhcnJheS5cbiAqXG4gKiBFYWNoIHByb3BlcnR5IGJpbmRpbmcgbmFtZSBpcyBzdG9yZWQgaGVyZSBhdCB0aGUgc2FtZSBpbmRleCBhcyBpdHMgdmFsdWUgaW5cbiAqIHRoZSBkYXRhIGFycmF5LiBJZiB0aGUgYmluZGluZyBpcyBhbiBpbnRlcnBvbGF0aW9uLCB0aGUgc3RhdGljIHN0cmluZyB2YWx1ZXNcbiAqIGFyZSBzdG9yZWQgcGFyYWxsZWwgdG8gdGhlIGR5bmFtaWMgdmFsdWVzLiBFeGFtcGxlOlxuICpcbiAqIGlkPVwicHJlZml4IHt7IHYwIH19IGEge3sgdjEgfX0gYiB7eyB2MiB9fSBzdWZmaXhcIlxuICpcbiAqIExWaWV3ICAgICAgIHwgICBUVmlldy5kYXRhXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHYwIHZhbHVlICAgfCAgICdhJ1xuICogIHYxIHZhbHVlICAgfCAgICdiJ1xuICogIHYyIHZhbHVlICAgfCAgIGlkIO+/vSBwcmVmaXgg77+9IHN1ZmZpeFxuICpcbiAqIEluamVjdG9yIGJsb29tIGZpbHRlcnMgYXJlIGFsc28gc3RvcmVkIGhlcmUuXG4gKi9cbmV4cG9ydCB0eXBlIFREYXRhID1cbiAgICAoVE5vZGUgfCBQaXBlRGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnwgbnVtYmVyIHwgVHlwZTxhbnk+fFxuICAgICBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUSTE4biB8IEkxOG5VcGRhdGVPcENvZGVzIHwgbnVsbCB8IHN0cmluZylbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==