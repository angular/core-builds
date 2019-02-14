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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUM7O0FBQ3RCLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sSUFBSSxHQUFHLENBQUM7O0FBQ3JCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDOztBQUNyQixNQUFNLE9BQU8sTUFBTSxHQUFHLENBQUM7O0FBQ3ZCLE1BQU0sT0FBTyxhQUFhLEdBQUcsQ0FBQzs7QUFDOUIsTUFBTSxPQUFPLE9BQU8sR0FBRyxDQUFDOztBQUN4QixNQUFNLE9BQU8sT0FBTyxHQUFHLENBQUM7O0FBQ3hCLE1BQU0sT0FBTyxRQUFRLEdBQUcsRUFBRTs7QUFDMUIsTUFBTSxPQUFPLGdCQUFnQixHQUFHLEVBQUU7O0FBQ2xDLE1BQU0sT0FBTyxRQUFRLEdBQUcsRUFBRTs7QUFDMUIsTUFBTSxPQUFPLFNBQVMsR0FBRyxFQUFFOztBQUMzQixNQUFNLE9BQU8sSUFBSSxHQUFHLEVBQUU7O0FBQ3RCLE1BQU0sT0FBTyxlQUFlLEdBQUcsRUFBRTs7QUFDakMsTUFBTSxPQUFPLGVBQWUsR0FBRyxFQUFFOztBQUNqQyxNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsRUFBRTs7Ozs7QUFFbEMsTUFBTSxPQUFPLGFBQWEsR0FBRyxFQUFFOzs7O0FBTS9CLHFDQUVDOzs7SUFEQyxvQ0FBaUU7Ozs7Ozs7Ozs7Ozs7QUFjbkUsMkJBaUpDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlDLHNEQUFzRDtJQUN0RCw0QkFBeUM7SUFDekMscUJBQWtDO0lBRWxDOzs7Ozs7O09BT0c7SUFDSCxlQUE0QjtJQUU1Qjs7Ozs7O09BTUc7SUFDSCxpQkFBOEI7SUFFOUIsd0ZBQXdGO0lBQ3hGLGVBQTJCO0lBRTNCOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsZ0JBQTRCO0lBRTVCLGtFQUFrRTtJQUNsRSxTQUFzQjtJQUV0QiwrRUFBK0U7SUFDL0UsYUFBeUI7SUFFekIsNkNBQTZDO0lBQzdDLGNBQTBCO0lBRTFCLGdEQUFnRDtJQUNoRCxXQUF1QjtJQUV2Qjs7T0FFRztJQUNILHFDQUFnRDtJQUNoRCw2QkFBOEI7SUFDOUIsK0JBQTBDOzs7OztJQVcxQyxxQkFBeUI7SUFDekIsK0JBQW1DO0lBQ25DLDRCQUFnQztJQUNoQyxxQkFBeUI7Ozs7Ozs7Ozs7QUFTM0IsMkJBc09DOzs7Ozs7Ozs7O0lBOU5DLG1CQUFvQjs7Ozs7O0lBTXBCLDBCQUFpQjs7Ozs7O0lBTWpCLHlCQUFxQzs7Ozs7SUFLckMsMEJBQXdDOzs7Ozs7Ozs7Ozs7Ozs7OztJQWlCeEMscUJBQWtDOzs7OztJQUdsQyxrQ0FBMkI7Ozs7O0lBRzNCLHFCQUFZOzs7Ozs7OztJQVFaLGtDQUEwQjs7Ozs7Ozs7Ozs7O0lBWTFCLGtDQUEwQjs7Ozs7Ozs7Ozs7SUFXMUIsb0NBQTRCOzs7Ozs7Ozs7Ozs7SUFZNUIsMkJBQW1COzs7OztJQUtuQiwyQkFBdUI7Ozs7Ozs7SUFPdkIsb0NBQW9FOzs7Ozs7OztJQVFwRSxrQ0FBeUM7Ozs7Ozs7Ozs7O0lBV3pDLDZCQUErQjs7Ozs7Ozs7O0lBUy9CLDBCQUF5Qjs7Ozs7Ozs7SUFRekIsMkJBQTBCOzs7Ozs7Ozs7SUFTMUIsNkJBQTRCOzs7Ozs7Ozs7SUFTNUIsa0NBQWlDOzs7Ozs7Ozs7SUFTakMsMEJBQXlCOzs7Ozs7Ozs7SUFTekIsK0JBQThCOzs7Ozs7OztJQVE5Qiw2QkFBNEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlDNUIsd0JBQW9COzs7Ozs7OztJQVFwQiwyQkFBMEI7Ozs7O0lBSzFCLCtCQUE4Qjs7OztJQUdJLFFBQVksRUFBRSxnQkFBb0IsRUFBRSxlQUFtQjs7Ozs7Ozs7QUFPM0YsaUNBNkJDOzs7Ozs7O0lBeEJDLGdDQUF3Qzs7Ozs7OztJQU94Qyw0QkFBcUI7Ozs7OztJQU1yQixpQ0FBaUI7Ozs7O0lBS2pCLG9DQUFrQzs7Ozs7SUFLbEMsNEJBQXdCOzs7OztBQTRDMUIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uLy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi8uLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBQaXBlRGVmLCBQaXBlRGVmTGlzdCwgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7STE4blVwZGF0ZU9wQ29kZXMsIFRJMThufSBmcm9tICcuL2kxOG4nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUVmlld05vZGV9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge1BsYXllckhhbmRsZXJ9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vcXVlcnknO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vc3R5bGluZyc7XG5cblxuXG4vLyBCZWxvdyBhcmUgY29uc3RhbnRzIGZvciBMVmlldyBpbmRpY2VzIHRvIGhlbHAgdXMgbG9vayB1cCBMVmlldyBtZW1iZXJzXG4vLyB3aXRob3V0IGhhdmluZyB0byByZW1lbWJlciB0aGUgc3BlY2lmaWMgaW5kaWNlcy5cbi8vIFVnbGlmeSB3aWxsIGlubGluZSB0aGVzZSB3aGVuIG1pbmlmeWluZyBzbyB0aGVyZSBzaG91bGRuJ3QgYmUgYSBjb3N0LlxuZXhwb3J0IGNvbnN0IFRWSUVXID0gMDtcbmV4cG9ydCBjb25zdCBGTEFHUyA9IDE7XG5leHBvcnQgY29uc3QgUEFSRU5UID0gMjtcbmV4cG9ydCBjb25zdCBORVhUID0gMztcbmV4cG9ydCBjb25zdCBRVUVSSUVTID0gNDtcbmV4cG9ydCBjb25zdCBIT1NUID0gNTtcbmV4cG9ydCBjb25zdCBUX0hPU1QgPSA2O1xuZXhwb3J0IGNvbnN0IEJJTkRJTkdfSU5ERVggPSA3O1xuZXhwb3J0IGNvbnN0IENMRUFOVVAgPSA4O1xuZXhwb3J0IGNvbnN0IENPTlRFWFQgPSA5O1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SID0gMTA7XG5leHBvcnQgY29uc3QgUkVOREVSRVJfRkFDVE9SWSA9IDExO1xuZXhwb3J0IGNvbnN0IFJFTkRFUkVSID0gMTI7XG5leHBvcnQgY29uc3QgU0FOSVRJWkVSID0gMTM7XG5leHBvcnQgY29uc3QgVEFJTCA9IDE0O1xuZXhwb3J0IGNvbnN0IENPTlRBSU5FUl9JTkRFWCA9IDE1O1xuZXhwb3J0IGNvbnN0IENPTlRFTlRfUVVFUklFUyA9IDE2O1xuZXhwb3J0IGNvbnN0IERFQ0xBUkFUSU9OX1ZJRVcgPSAxNztcbi8qKiBTaXplIG9mIExWaWV3J3MgaGVhZGVyLiBOZWNlc3NhcnkgdG8gYWRqdXN0IGZvciBpdCB3aGVuIHNldHRpbmcgc2xvdHMuICAqL1xuZXhwb3J0IGNvbnN0IEhFQURFUl9PRkZTRVQgPSAxODtcblxuXG4vLyBUaGlzIGludGVyZmFjZSByZXBsYWNlcyB0aGUgcmVhbCBMVmlldyBpbnRlcmZhY2UgaWYgaXQgaXMgYW4gYXJnIG9yIGFcbi8vIHJldHVybiB2YWx1ZSBvZiBhIHB1YmxpYyBpbnN0cnVjdGlvbi4gVGhpcyBlbnN1cmVzIHdlIGRvbid0IG5lZWQgdG8gZXhwb3NlXG4vLyB0aGUgYWN0dWFsIGludGVyZmFjZSwgd2hpY2ggc2hvdWxkIGJlIGtlcHQgcHJpdmF0ZS5cbmV4cG9ydCBpbnRlcmZhY2UgT3BhcXVlVmlld1N0YXRlIHtcbiAgJ19fYnJhbmRfXyc6ICdCcmFuZCBmb3IgT3BhcXVlVmlld1N0YXRlIHRoYXQgbm90aGluZyB3aWxsIG1hdGNoJztcbn1cblxuXG4vKipcbiAqIGBMVmlld2Agc3RvcmVzIGFsbCBvZiB0aGUgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHByb2Nlc3MgdGhlIGluc3RydWN0aW9ucyBhc1xuICogdGhleSBhcmUgaW52b2tlZCBmcm9tIHRoZSB0ZW1wbGF0ZS4gRWFjaCBlbWJlZGRlZCB2aWV3IGFuZCBjb21wb25lbnQgdmlldyBoYXMgaXRzXG4gKiBvd24gYExWaWV3YC4gV2hlbiBwcm9jZXNzaW5nIGEgcGFydGljdWxhciB2aWV3LCB3ZSBzZXQgdGhlIGB2aWV3RGF0YWAgdG8gdGhhdFxuICogYExWaWV3YC4gV2hlbiB0aGF0IHZpZXcgaXMgZG9uZSBwcm9jZXNzaW5nLCB0aGUgYHZpZXdEYXRhYCBpcyBzZXQgYmFjayB0b1xuICogd2hhdGV2ZXIgdGhlIG9yaWdpbmFsIGB2aWV3RGF0YWAgd2FzIGJlZm9yZSAodGhlIHBhcmVudCBgTFZpZXdgKS5cbiAqXG4gKiBLZWVwaW5nIHNlcGFyYXRlIHN0YXRlIGZvciBlYWNoIHZpZXcgZmFjaWxpdGllcyB2aWV3IGluc2VydGlvbiAvIGRlbGV0aW9uLCBzbyB3ZVxuICogZG9uJ3QgaGF2ZSB0byBlZGl0IHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHdoaWNoIHZpZXdzIGFyZSBwcmVzZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExWaWV3IGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gIC8qKlxuICAgKiBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgdmlldy4gV2UgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGlzIHNvIHdlIGNhbiBlYXNpbHkgd2FsayB1cCB0aGVcbiAgICogbm9kZSB0cmVlIGluIERJIGFuZCBnZXQgdGhlIFRWaWV3LmRhdGEgYXJyYXkgYXNzb2NpYXRlZCB3aXRoIGEgbm9kZSAod2hlcmUgdGhlXG4gICAqIGRpcmVjdGl2ZSBkZWZzIGFyZSBzdG9yZWQpLlxuICAgKi9cbiAgcmVhZG9ubHlbVFZJRVddOiBUVmlldztcblxuICAvKiogRmxhZ3MgZm9yIHRoaXMgdmlldy4gU2VlIExWaWV3RmxhZ3MgZm9yIG1vcmUgaW5mby4gKi9cbiAgW0ZMQUdTXTogTFZpZXdGbGFncztcblxuICAvKipcbiAgICogVGhlIHBhcmVudCB2aWV3IGlzIG5lZWRlZCB3aGVuIHdlIGV4aXQgdGhlIHZpZXcgYW5kIG11c3QgcmVzdG9yZSB0aGUgcHJldmlvdXNcbiAgICogYExWaWV3YC4gV2l0aG91dCB0aGlzLCB0aGUgcmVuZGVyIG1ldGhvZCB3b3VsZCBoYXZlIHRvIGtlZXAgYSBzdGFjayBvZlxuICAgKiB2aWV3cyBhcyBpdCBpcyByZWN1cnNpdmVseSByZW5kZXJpbmcgdGVtcGxhdGVzLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBcImluc2VydGlvblwiIHZpZXcgZm9yIGVtYmVkZGVkIHZpZXdzLiBUaGlzIGFsbG93cyB1cyB0byBwcm9wZXJseVxuICAgKiBkZXN0cm95IGVtYmVkZGVkIHZpZXdzLlxuICAgKi9cbiAgW1BBUkVOVF06IExWaWV3fG51bGw7XG5cbiAgLyoqXG4gICAqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgTFZpZXcgb3IgTENvbnRhaW5lci5cbiAgICpcbiAgICogQWxsb3dzIHVzIHRvIHByb3BhZ2F0ZSBiZXR3ZWVuIHNpYmxpbmcgdmlldyBzdGF0ZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIHNhbWVcbiAgICogY29udGFpbmVyLiBFbWJlZGRlZCB2aWV3cyBhbHJlYWR5IGhhdmUgYSBub2RlLm5leHQsIGJ1dCBpdCBpcyBvbmx5IHNldCBmb3JcbiAgICogdmlld3MgaW4gdGhlIHNhbWUgY29udGFpbmVyLiBXZSBuZWVkIGEgd2F5IHRvIGxpbmsgY29tcG9uZW50IHZpZXdzIGFuZCB2aWV3c1xuICAgKiBhY3Jvc3MgY29udGFpbmVycyBhcyB3ZWxsLlxuICAgKi9cbiAgW05FWFRdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqIFF1ZXJpZXMgYWN0aXZlIGZvciB0aGlzIHZpZXcgLSBub2RlcyBmcm9tIGEgdmlldyBhcmUgcmVwb3J0ZWQgdG8gdGhvc2UgcXVlcmllcy4gKi9cbiAgW1FVRVJJRVNdOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgaG9zdCBub2RlIGZvciB0aGlzIExWaWV3IGluc3RhbmNlLCBpZiB0aGlzIGlzIGEgY29tcG9uZW50IHZpZXcuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldywgSE9TVCB3aWxsIGJlIG51bGwuXG4gICAqL1xuICBbSE9TVF06IFJFbGVtZW50fFN0eWxpbmdDb250ZXh0fG51bGw7XG5cbiAgLyoqXG4gICAqIFBvaW50ZXIgdG8gdGhlIGBUVmlld05vZGVgIG9yIGBURWxlbWVudE5vZGVgIHdoaWNoIHJlcHJlc2VudHMgdGhlIHJvb3Qgb2YgdGhlIHZpZXcuXG4gICAqXG4gICAqIElmIGBUVmlld05vZGVgLCB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgYSBjb250YWluZXIuIFdlIG5lZWQgdGhpcyB0byBiZSBhYmxlIHRvXG4gICAqIGVmZmljaWVudGx5IGZpbmQgdGhlIGBMVmlld05vZGVgIHdoZW4gaW5zZXJ0aW5nIHRoZSB2aWV3IGludG8gYW4gYW5jaG9yLlxuICAgKlxuICAgKiBJZiBgVEVsZW1lbnROb2RlYCwgdGhpcyBpcyB0aGUgTFZpZXcgb2YgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIElmIG51bGwsIHRoaXMgaXMgdGhlIHJvb3QgdmlldyBvZiBhbiBhcHBsaWNhdGlvbiAocm9vdCBjb21wb25lbnQgaXMgaW4gdGhpcyB2aWV3KS5cbiAgICovXG4gIFtUX0hPU1RdOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBiaW5kaW5nIGluZGV4IHdlIHNob3VsZCBhY2Nlc3MgbmV4dC5cbiAgICpcbiAgICogVGhpcyBpcyBzdG9yZWQgc28gdGhhdCBiaW5kaW5ncyBjYW4gY29udGludWUgd2hlcmUgdGhleSBsZWZ0IG9mZlxuICAgKiBpZiBhIHZpZXcgaXMgbGVmdCBtaWR3YXkgdGhyb3VnaCBwcm9jZXNzaW5nIGJpbmRpbmdzIChlLmcuIGlmIHRoZXJlIGlzXG4gICAqIGEgc2V0dGVyIHRoYXQgY3JlYXRlcyBhbiBlbWJlZGRlZCB2aWV3LCBsaWtlIGluIG5nSWYpLlxuICAgKi9cbiAgW0JJTkRJTkdfSU5ERVhdOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICAgKiB1bnN1YnNjcmliZWQuIFRoaXMgY29udGV4dCBhcnJheSBzdG9yZXMgYm90aCBsaXN0ZW5lciBmdW5jdGlvbnMgd3JhcHBlZCB3aXRoXG4gICAqIHRoZWlyIGNvbnRleHQgYW5kIG91dHB1dCBzdWJzY3JpcHRpb24gaW5zdGFuY2VzIGZvciBhIHBhcnRpY3VsYXIgdmlldy5cbiAgICpcbiAgICogVGhlc2UgY2hhbmdlIHBlciBMVmlldyBpbnN0YW5jZSwgc28gdGhleSBjYW5ub3QgYmUgc3RvcmVkIG9uIFRWaWV3LiBJbnN0ZWFkLFxuICAgKiBUVmlldy5jbGVhbnVwIHNhdmVzIGFuIGluZGV4IHRvIHRoZSBuZWNlc3NhcnkgY29udGV4dCBpbiB0aGlzIGFycmF5LlxuICAgKi9cbiAgLy8gVE9ETzogZmxhdHRlbiBpbnRvIExWaWV3W11cbiAgW0NMRUFOVVBdOiBhbnlbXXxudWxsO1xuXG4gIC8qKlxuICAgKiAtIEZvciBkeW5hbWljIHZpZXdzLCB0aGlzIGlzIHRoZSBjb250ZXh0IHdpdGggd2hpY2ggdG8gcmVuZGVyIHRoZSB0ZW1wbGF0ZSAoZS5nLlxuICAgKiAgIGBOZ0ZvckNvbnRleHRgKSwgb3IgYHt9YCBpZiBub3QgZGVmaW5lZCBleHBsaWNpdGx5LlxuICAgKiAtIEZvciByb290IHZpZXcgb2YgdGhlIHJvb3QgY29tcG9uZW50IHRoZSBjb250ZXh0IGNvbnRhaW5zIGNoYW5nZSBkZXRlY3Rpb24gZGF0YS5cbiAgICogLSBGb3Igbm9uLXJvb3QgY29tcG9uZW50cywgdGhlIGNvbnRleHQgaXMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSxcbiAgICogLSBGb3IgaW5saW5lIHZpZXdzLCB0aGUgY29udGV4dCBpcyBudWxsLlxuICAgKi9cbiAgW0NPTlRFWFRdOiB7fXxSb290Q29udGV4dHxudWxsO1xuXG4gIC8qKiBBbiBvcHRpb25hbCBNb2R1bGUgSW5qZWN0b3IgdG8gYmUgdXNlZCBhcyBmYWxsIGJhY2sgYWZ0ZXIgRWxlbWVudCBJbmplY3RvcnMgYXJlIGNvbnN1bHRlZC4gKi9cbiAgcmVhZG9ubHlbSU5KRUNUT1JdOiBJbmplY3RvcnxudWxsO1xuXG4gIC8qKiBSZW5kZXJlciB0byBiZSB1c2VkIGZvciB0aGlzIHZpZXcuICovXG4gIFtSRU5ERVJFUl9GQUNUT1JZXTogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogUmVuZGVyZXIgdG8gYmUgdXNlZCBmb3IgdGhpcyB2aWV3LiAqL1xuICBbUkVOREVSRVJdOiBSZW5kZXJlcjM7XG5cbiAgLyoqIEFuIG9wdGlvbmFsIGN1c3RvbSBzYW5pdGl6ZXIuICovXG4gIFtTQU5JVElaRVJdOiBTYW5pdGl6ZXJ8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGxhc3QgTFZpZXcgb3IgTENvbnRhaW5lciBiZW5lYXRoIHRoaXMgTFZpZXcgaW4gdGhlIGhpZXJhcmNoeS5cbiAgICpcbiAgICogVGhlIHRhaWwgYWxsb3dzIHVzIHRvIHF1aWNrbHkgYWRkIGEgbmV3IHN0YXRlIHRvIHRoZSBlbmQgb2YgdGhlIHZpZXcgbGlzdFxuICAgKiB3aXRob3V0IGhhdmluZyB0byBwcm9wYWdhdGUgc3RhcnRpbmcgZnJvbSB0aGUgZmlyc3QgY2hpbGQuXG4gICAqL1xuICBbVEFJTF06IExWaWV3fExDb250YWluZXJ8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgY29udGFpbmVyJ3MgaG9zdCBub2RlLiBBcHBsaWNhYmxlIG9ubHkgdG8gZW1iZWRkZWQgdmlld3MgdGhhdFxuICAgKiBoYXZlIGJlZW4gaW5zZXJ0ZWQgZHluYW1pY2FsbHkuIFdpbGwgYmUgLTEgZm9yIGNvbXBvbmVudCB2aWV3cyBhbmQgaW5saW5lIHZpZXdzLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBqdW1wIGZyb20gZHluYW1pY2FsbHkgY3JlYXRlZCBlbWJlZGRlZCB2aWV3cyB0byB0aGVpciBwYXJlbnRcbiAgICogY29udGFpbmVycyBiZWNhdXNlIHRoZWlyIHBhcmVudCBjYW5ub3QgYmUgc3RvcmVkIG9uIHRoZSBUVmlld05vZGUgKHZpZXdzIG1heSBiZSBpbnNlcnRlZFxuICAgKiBpbiBtdWx0aXBsZSBjb250YWluZXJzLCBzbyB0aGUgcGFyZW50IGNhbm5vdCBiZSBzaGFyZWQgYmV0d2VlbiB2aWV3IGluc3RhbmNlcykuXG4gICAqL1xuICBbQ09OVEFJTkVSX0lOREVYXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgUXVlcnlMaXN0cyBhc3NvY2lhdGVkIHdpdGggY29udGVudCBxdWVyaWVzIG9mIGEgZGlyZWN0aXZlLiBUaGlzIGRhdGEgc3RydWN0dXJlIGlzXG4gICAqIGZpbGxlZC1pbiBhcyBwYXJ0IG9mIGEgZGlyZWN0aXZlIGNyZWF0aW9uIHByb2Nlc3MgYW5kIGlzIGxhdGVyIHVzZWQgdG8gcmV0cmlldmUgYSBRdWVyeUxpc3QgdG9cbiAgICogYmUgcmVmcmVzaGVkLlxuICAgKi9cbiAgW0NPTlRFTlRfUVVFUklFU106IFF1ZXJ5TGlzdDxhbnk+W118bnVsbDtcblxuICAvKipcbiAgICogVmlldyB3aGVyZSB0aGlzIHZpZXcncyB0ZW1wbGF0ZSB3YXMgZGVjbGFyZWQuXG4gICAqXG4gICAqIE9ubHkgYXBwbGljYWJsZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cy4gV2lsbCBiZSBudWxsIGZvciBpbmxpbmUvY29tcG9uZW50IHZpZXdzLlxuICAgKlxuICAgKiBUaGUgdGVtcGxhdGUgZm9yIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IG1heSBiZSBkZWNsYXJlZCBpbiBhIGRpZmZlcmVudCB2aWV3IHRoYW5cbiAgICogaXQgaXMgaW5zZXJ0ZWQuIFdlIGFscmVhZHkgdHJhY2sgdGhlIFwiaW5zZXJ0aW9uIHZpZXdcIiAodmlldyB3aGVyZSB0aGUgdGVtcGxhdGUgd2FzXG4gICAqIGluc2VydGVkKSBpbiBMVmlld1tQQVJFTlRdLCBidXQgd2UgYWxzbyBuZWVkIGFjY2VzcyB0byB0aGUgXCJkZWNsYXJhdGlvbiB2aWV3XCJcbiAgICogKHZpZXcgd2hlcmUgdGhlIHRlbXBsYXRlIHdhcyBkZWNsYXJlZCkuIE90aGVyd2lzZSwgd2Ugd291bGRuJ3QgYmUgYWJsZSB0byBjYWxsIHRoZVxuICAgKiB2aWV3J3MgdGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyIGNvbnRleHRzLiBDb250ZXh0IHNob3VsZCBiZSBpbmhlcml0ZWQgZnJvbVxuICAgKiB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlLCBub3QgdGhlIGluc2VydGlvbiB2aWV3IHRyZWUuXG4gICAqXG4gICAqIEV4YW1wbGUgKEFwcENvbXBvbmVudCB0ZW1wbGF0ZSk6XG4gICAqXG4gICAqIDxuZy10ZW1wbGF0ZSAjZm9vPjwvbmctdGVtcGxhdGU+ICAgICAgIDwtLSBkZWNsYXJlZCBoZXJlIC0tPlxuICAgKiA8c29tZS1jb21wIFt0cGxdPVwiZm9vXCI+PC9zb21lLWNvbXA+ICAgIDwtLSBpbnNlcnRlZCBpbnNpZGUgdGhpcyBjb21wb25lbnQgLS0+XG4gICAqXG4gICAqIFRoZSA8bmctdGVtcGxhdGU+IGFib3ZlIGlzIGRlY2xhcmVkIGluIHRoZSBBcHBDb21wb25lbnQgdGVtcGxhdGUsIGJ1dCBpdCB3aWxsIGJlIHBhc3NlZCBpbnRvXG4gICAqIFNvbWVDb21wIGFuZCBpbnNlcnRlZCB0aGVyZS4gSW4gdGhpcyBjYXNlLCB0aGUgZGVjbGFyYXRpb24gdmlldyB3b3VsZCBiZSB0aGUgQXBwQ29tcG9uZW50LFxuICAgKiBidXQgdGhlIGluc2VydGlvbiB2aWV3IHdvdWxkIGJlIFNvbWVDb21wLiBXaGVuIHdlIGFyZSByZW1vdmluZyB2aWV3cywgd2Ugd291bGQgd2FudCB0b1xuICAgKiB0cmF2ZXJzZSB0aHJvdWdoIHRoZSBpbnNlcnRpb24gdmlldyB0byBjbGVhbiB1cCBsaXN0ZW5lcnMuIFdoZW4gd2UgYXJlIGNhbGxpbmcgdGhlXG4gICAqIHRlbXBsYXRlIGZ1bmN0aW9uIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCB3ZSBuZWVkIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRvIGdldCBpbmhlcml0ZWRcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtERUNMQVJBVElPTl9WSUVXXTogTFZpZXd8bnVsbDtcbn1cblxuLyoqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCBhbiBMVmlldyAoc2F2ZWQgaW4gTFZpZXdbRkxBR1NdKSAqL1xuZXhwb3J0IGNvbnN0IGVudW0gTFZpZXdGbGFncyB7XG4gIC8qKiBUaGUgc3RhdGUgb2YgdGhlIGluaXQgcGhhc2Ugb24gdGhlIGZpcnN0IDIgYml0cyAqL1xuICBJbml0UGhhc2VTdGF0ZUluY3JlbWVudGVyID0gMGIwMDAwMDAwMDAwMSxcbiAgSW5pdFBoYXNlU3RhdGVNYXNrID0gMGIwMDAwMDAwMDAxMSxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHZpZXcgaXMgaW4gY3JlYXRpb25Nb2RlLlxuICAgKlxuICAgKiBUaGlzIG11c3QgYmUgc3RvcmVkIGluIHRoZSB2aWV3IHJhdGhlciB0aGFuIHVzaW5nIGBkYXRhYCBhcyBhIG1hcmtlciBzbyB0aGF0XG4gICAqIHdlIGNhbiBwcm9wZXJseSBzdXBwb3J0IGVtYmVkZGVkIHZpZXdzLiBPdGhlcndpc2UsIHdoZW4gZXhpdGluZyBhIGNoaWxkIHZpZXdcbiAgICogYmFjayBpbnRvIHRoZSBwYXJlbnQgdmlldywgYGRhdGFgIHdpbGwgYmUgZGVmaW5lZCBhbmQgYGNyZWF0aW9uTW9kZWAgd2lsbCBiZVxuICAgKiBpbXByb3Blcmx5IHJlcG9ydGVkIGFzIGZhbHNlLlxuICAgKi9cbiAgQ3JlYXRpb25Nb2RlID0gMGIwMDAwMDAwMDEwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhpcyBMVmlldyBpbnN0YW5jZSBpcyBvbiBpdHMgZmlyc3QgcHJvY2Vzc2luZyBwYXNzLlxuICAgKlxuICAgKiBBbiBMVmlldyBpbnN0YW5jZSBpcyBjb25zaWRlcmVkIHRvIGJlIG9uIGl0cyBcImZpcnN0IHBhc3NcIiB1bnRpbCBpdFxuICAgKiBoYXMgY29tcGxldGVkIG9uZSBjcmVhdGlvbiBtb2RlIHJ1biBhbmQgb25lIHVwZGF0ZSBtb2RlIHJ1bi4gQXQgdGhpc1xuICAgKiB0aW1lLCB0aGUgZmxhZyBpcyB0dXJuZWQgb2ZmLlxuICAgKi9cbiAgRmlyc3RMVmlld1Bhc3MgPSAwYjAwMDAwMDAxMDAwLFxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgdmlldyBoYXMgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5IChjaGVja3MgYWx3YXlzKSBvciBvblB1c2ggKi9cbiAgQ2hlY2tBbHdheXMgPSAwYjAwMDAwMDEwMDAwLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBtYW51YWwgY2hhbmdlIGRldGVjdGlvbiBpcyB0dXJuZWQgb24gZm9yIG9uUHVzaCBjb21wb25lbnRzLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgc3BlY2lhbCBtb2RlIHRoYXQgb25seSBtYXJrcyBjb21wb25lbnRzIGRpcnR5IGluIHR3byBjYXNlczpcbiAgICogMSkgVGhlcmUgaGFzIGJlZW4gYSBjaGFuZ2UgdG8gYW4gQElucHV0IHByb3BlcnR5XG4gICAqIDIpIGBtYXJrRGlydHkoKWAgaGFzIGJlZW4gY2FsbGVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyXG4gICAqXG4gICAqIE5vdGUgdGhhdCBpbiB0aGlzIG1vZGUsIHRoZSBmaXJpbmcgb2YgZXZlbnRzIGRvZXMgTk9UIG1hcmsgY29tcG9uZW50c1xuICAgKiBkaXJ0eSBhdXRvbWF0aWNhbGx5LlxuICAgKlxuICAgKiBNYW51YWwgbW9kZSBpcyB0dXJuZWQgb2ZmIGJ5IGRlZmF1bHQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCBhcyBldmVudHNcbiAgICogYXV0b21hdGljYWxseSBtYXJrIE9uUHVzaCBjb21wb25lbnRzIGRpcnR5IGluIFZpZXcgRW5naW5lLlxuICAgKlxuICAgKiBUT0RPOiBBZGQgYSBwdWJsaWMgQVBJIHRvIENoYW5nZURldGVjdGlvblN0cmF0ZWd5IHRvIHR1cm4gdGhpcyBtb2RlIG9uXG4gICAqL1xuICBNYW51YWxPblB1c2ggPSAwYjAwMDAwMTAwMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGRpcnR5IChuZWVkaW5nIGNoZWNrKSAqL1xuICBEaXJ0eSA9IDBiMDAwMDAxMDAwMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGF0dGFjaGVkIHRvIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS4gKi9cbiAgQXR0YWNoZWQgPSAwYjAwMDAxMDAwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC4gKi9cbiAgRGVzdHJveWVkID0gMGIwMDAxMDAwMDAwMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyB0aGUgcm9vdCB2aWV3ICovXG4gIElzUm9vdCA9IDBiMDAxMDAwMDAwMDAwLFxuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgY3VycmVudCBpbml0IHBoYXNlIG9uIGxhc3QgMjIgYml0c1xuICAgKi9cbiAgSW5kZXhXaXRoaW5Jbml0UGhhc2VJbmNyZW1lbnRlciA9IDBiMDEwMDAwMDAwMDAwLFxuICBJbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0ID0gMTAsXG4gIEluZGV4V2l0aGluSW5pdFBoYXNlUmVzZXQgPSAwYjAwMTExMTExMTExMSxcbn1cblxuLyoqXG4gKiBQb3NzaWJsZSBzdGF0ZXMgb2YgdGhlIGluaXQgcGhhc2U6XG4gKiAtIDAwOiBPbkluaXQgaG9va3MgdG8gYmUgcnVuLlxuICogLSAwMTogQWZ0ZXJDb250ZW50SW5pdCBob29rcyB0byBiZSBydW5cbiAqIC0gMTA6IEFmdGVyVmlld0luaXQgaG9va3MgdG8gYmUgcnVuXG4gKiAtIDExOiBBbGwgaW5pdCBob29rcyBoYXZlIGJlZW4gcnVuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEluaXRQaGFzZVN0YXRlIHtcbiAgT25Jbml0SG9va3NUb0JlUnVuID0gMGIwMCxcbiAgQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1biA9IDBiMDEsXG4gIEFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4gPSAwYjEwLFxuICBJbml0UGhhc2VDb21wbGV0ZWQgPSAwYjExLFxufVxuXG4vKipcbiAqIFRoZSBzdGF0aWMgZGF0YSBmb3IgYW4gTFZpZXcgKHNoYXJlZCBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXMgb2YgYVxuICogZ2l2ZW4gdHlwZSkuXG4gKlxuICogU3RvcmVkIG9uIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBhcyBuZ1ByaXZhdGVEYXRhLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRWaWV3IHtcbiAgLyoqXG4gICAqIElEIGZvciBpbmxpbmUgdmlld3MgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSB2aWV3IGlzIHRoZSBzYW1lIGFzIHRoZSBwcmV2aW91cyB2aWV3XG4gICAqIGluIGEgY2VydGFpbiBwb3NpdGlvbi4gSWYgaXQncyBub3QsIHdlIGtub3cgdGhlIG5ldyB2aWV3IG5lZWRzIHRvIGJlIGluc2VydGVkXG4gICAqIGFuZCB0aGUgb25lIHRoYXQgZXhpc3RzIG5lZWRzIHRvIGJlIHJlbW92ZWQgKGUuZy4gaWYvZWxzZSBzdGF0ZW1lbnRzKVxuICAgKlxuICAgKiBJZiB0aGlzIGlzIC0xLCB0aGVuIHRoaXMgaXMgYSBjb21wb25lbnQgdmlldyBvciBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldy5cbiAgICovXG4gIHJlYWRvbmx5IGlkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgYSBibHVlcHJpbnQgdXNlZCB0byBnZW5lcmF0ZSBMVmlldyBpbnN0YW5jZXMgZm9yIHRoaXMgVFZpZXcuIENvcHlpbmcgdGhpc1xuICAgKiBibHVlcHJpbnQgaXMgZmFzdGVyIHRoYW4gY3JlYXRpbmcgYSBuZXcgTFZpZXcgZnJvbSBzY3JhdGNoLlxuICAgKi9cbiAgYmx1ZXByaW50OiBMVmlldztcblxuICAvKipcbiAgICogVGhlIHRlbXBsYXRlIGZ1bmN0aW9uIHVzZWQgdG8gcmVmcmVzaCB0aGUgdmlldyBvZiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzXG4gICAqIGFuZCBjb21wb25lbnRzLiBXaWxsIGJlIG51bGwgZm9yIGlubGluZSB2aWV3cy5cbiAgICovXG4gIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbDtcblxuICAvKipcbiAgICogQSBmdW5jdGlvbiBjb250YWluaW5nIHF1ZXJ5LXJlbGF0ZWQgaW5zdHJ1Y3Rpb25zLlxuICAgKi9cbiAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsO1xuXG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgVE5vZGVgIHRoYXQgcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdmlldy5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhIGBUVmlld05vZGVgIGZvciBhbiBgTFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLlxuICAgKiBXZSBuZWVkIHRoaXMgcG9pbnRlciB0byBiZSBhYmxlIHRvIGVmZmljaWVudGx5IGZpbmQgdGhpcyBub2RlIHdoZW4gaW5zZXJ0aW5nIHRoZSB2aWV3XG4gICAqIGludG8gYW4gYW5jaG9yLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGEgYFRFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIHZpZXcgb2YgYSByb290IGNvbXBvbmVudC4gSXQgaGFzIGV4YWN0bHkgb25lXG4gICAqIHJvb3QgVE5vZGUuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbnVsbCwgdGhpcyBpcyB0aGUgdmlldyBvZiBhIGNvbXBvbmVudCB0aGF0IGlzIG5vdCBhdCByb290LiBXZSBkbyBub3Qgc3RvcmVcbiAgICogdGhlIGhvc3QgVE5vZGVzIGZvciBjaGlsZCBjb21wb25lbnQgdmlld3MgYmVjYXVzZSB0aGV5IGNhbiBwb3RlbnRpYWxseSBoYXZlIHNldmVyYWxcbiAgICogZGlmZmVyZW50IGhvc3QgVE5vZGVzLCBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIGNvbXBvbmVudCBpcyBiZWluZyB1c2VkLiBUaGVzZSBob3N0XG4gICAqIFROb2RlcyBjYW5ub3QgYmUgc2hhcmVkIChkdWUgdG8gZGlmZmVyZW50IGluZGljZXMsIGV0YykuXG4gICAqL1xuICBub2RlOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdGVtcGxhdGUgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xuICBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbjtcblxuICAvKiogU3RhdGljIGRhdGEgZXF1aXZhbGVudCBvZiBMVmlldy5kYXRhW10uIENvbnRhaW5zIFROb2RlcywgUGlwZURlZkludGVybmFsIG9yIFRJMThuLiAqL1xuICBkYXRhOiBURGF0YTtcblxuICAvKipcbiAgICogVGhlIGJpbmRpbmcgc3RhcnQgaW5kZXggaXMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBkYXRhIGFycmF5XG4gICAqIHN0YXJ0cyB0byBzdG9yZSBiaW5kaW5ncyBvbmx5LiBTYXZpbmcgdGhpcyB2YWx1ZSBlbnN1cmVzIHRoYXQgd2VcbiAgICogd2lsbCBiZWdpbiByZWFkaW5nIGJpbmRpbmdzIGF0IHRoZSBjb3JyZWN0IHBvaW50IGluIHRoZSBhcnJheSB3aGVuXG4gICAqIHdlIGFyZSBpbiB1cGRhdGUgbW9kZS5cbiAgICovXG4gIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCB3aGVyZSB0aGUgXCJleHBhbmRvXCIgc2VjdGlvbiBvZiBgTFZpZXdgIGJlZ2lucy4gVGhlIGV4cGFuZG9cbiAgICogc2VjdGlvbiBjb250YWlucyBpbmplY3RvcnMsIGRpcmVjdGl2ZSBpbnN0YW5jZXMsIGFuZCBob3N0IGJpbmRpbmcgdmFsdWVzLlxuICAgKiBVbmxpa2UgdGhlIFwiY29uc3RzXCIgYW5kIFwidmFyc1wiIHNlY3Rpb25zIG9mIGBMVmlld2AsIHRoZSBsZW5ndGggb2YgdGhpc1xuICAgKiBzZWN0aW9uIGNhbm5vdCBiZSBjYWxjdWxhdGVkIGF0IGNvbXBpbGUtdGltZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYXJlIG1hdGNoZWRcbiAgICogYXQgcnVudGltZSB0byBwcmVzZXJ2ZSBsb2NhbGl0eS5cbiAgICpcbiAgICogV2Ugc3RvcmUgdGhpcyBzdGFydCBpbmRleCBzbyB3ZSBrbm93IHdoZXJlIHRvIHN0YXJ0IGNoZWNraW5nIGhvc3QgYmluZGluZ3NcbiAgICogaW4gYHNldEhvc3RCaW5kaW5nc2AuXG4gICAqL1xuICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggd2hlcmUgdGhlIHZpZXdRdWVyaWVzIHNlY3Rpb24gb2YgYExWaWV3YCBiZWdpbnMuIFRoaXMgc2VjdGlvbiBjb250YWluc1xuICAgKiB2aWV3IHF1ZXJpZXMgZGVmaW5lZCBmb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlLlxuICAgKlxuICAgKiBXZSBzdG9yZSB0aGlzIHN0YXJ0IGluZGV4IHNvIHdlIGtub3cgd2hlcmUgdGhlIGxpc3Qgb2YgdmlldyBxdWVyaWVzIHN0YXJ0cy5cbiAgICogVGhpcyBpcyByZXF1aXJlZCB3aGVuIHdlIGludm9rZSB2aWV3IHF1ZXJpZXMgYXQgcnVudGltZS4gV2UgaW52b2tlIHF1ZXJpZXMgb25lIGJ5IG9uZSBhbmRcbiAgICogaW5jcmVtZW50IHF1ZXJ5IGluZGV4IGFmdGVyIGVhY2ggaXRlcmF0aW9uLiBUaGlzIGluZm9ybWF0aW9uIGhlbHBzIHVzIHRvIHJlc2V0IGluZGV4IGJhY2sgdG9cbiAgICogdGhlIGJlZ2lubmluZyBvZiB2aWV3IHF1ZXJ5IGxpc3QgYmVmb3JlIHdlIGludm9rZSB2aWV3IHF1ZXJpZXMgYWdhaW4uXG4gICAqL1xuICB2aWV3UXVlcnlTdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIHRoZSBob3N0IG5vZGUgb2YgdGhlIGZpcnN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluXG4gICAqIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIE5lY2Vzc2FyeSB0byBzdG9yZSB0aGlzIHNvIHZpZXdzIGNhbiB0cmF2ZXJzZSB0aHJvdWdoIHRoZWlyIG5lc3RlZCB2aWV3c1xuICAgKiB0byByZW1vdmUgbGlzdGVuZXJzIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gICAqXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3cywgd2Ugc3RvcmUgdGhlIGluZGV4IG9mIGFuIExDb250YWluZXIncyBob3N0IHJhdGhlciB0aGFuIHRoZSBmaXJzdFxuICAgKiBMVmlldyB0byBhdm9pZCBtYW5hZ2luZyBzcGxpY2luZyB3aGVuIHZpZXdzIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgKi9cbiAgY2hpbGRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgZmlyc3QgY2hpbGQgbm9kZSBsb2NhdGVkIGluIHRoZSB2aWV3LlxuICAgKi9cbiAgZmlyc3RDaGlsZDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogU2V0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHByb2Nlc3MgaG9zdCBiaW5kaW5ncyBlZmZpY2llbnRseS5cbiAgICpcbiAgICogU2VlIFZJRVdfREFUQS5tZCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGV4cGFuZG9JbnN0cnVjdGlvbnM6IChudW1iZXJ8SG9zdEJpbmRpbmdzRnVuY3Rpb248YW55PnxudWxsKVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bGwgcmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uSW5pdCBhbmQgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGluaXRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZFxuICAgKiBmb3IgdGhpcyB2aWV3IGluIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluIHVwZGF0ZVxuICAgKiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJWaWV3SW5pdCBhbmQgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvclxuICAgKiB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkRlc3Ryb3kgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgd2hlbiB0aGlzIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAgICogdW5zdWJzY3JpYmVkLiBUaGlzIGNsZWFudXAgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZGF0YSAoaW4gY2h1bmtzIG9mIDQpXG4gICAqIGFuZCBvdXRwdXQgZGF0YSAoaW4gY2h1bmtzIG9mIDIpIGZvciBhIHBhcnRpY3VsYXIgdmlldy4gQ29tYmluaW5nIHRoZSBhcnJheXNcbiAgICogc2F2ZXMgb24gbWVtb3J5ICg3MCBieXRlcyBwZXIgYXJyYXkpIGFuZCBvbiBhIGZldyBieXRlcyBvZiBjb2RlIHNpemUgKGZvciB0d29cbiAgICogc2VwYXJhdGUgZm9yIGxvb3BzKS5cbiAgICpcbiAgICogSWYgaXQncyBhIG5hdGl2ZSBET00gbGlzdGVuZXIgb3Igb3V0cHV0IHN1YnNjcmlwdGlvbiBiZWluZyBzdG9yZWQ6XG4gICAqIDFzdCBpbmRleCBpczogZXZlbnQgbmFtZSAgYG5hbWUgPSB0Vmlldy5jbGVhbnVwW2krMF1gXG4gICAqIDJuZCBpbmRleCBpczogaW5kZXggb2YgbmF0aXZlIGVsZW1lbnQgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHJpZXZlcyBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csXG4gICAqICAgICAgICAgICAgICAgZG9jdW1lbnQgb3IgYm9keSkgcmVmZXJlbmNlIGJhc2VkIG9uIHRoZSBuYXRpdmUgZWxlbWVudDpcbiAgICogICAgYHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJ2A6IGdsb2JhbCB0YXJnZXQgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqICAgIGB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdudW1iZXInYDogaW5kZXggb2YgbmF0aXZlIGVsZW1lbnRcbiAgICpcbiAgICogM3JkIGluZGV4IGlzOiBpbmRleCBvZiBsaXN0ZW5lciBmdW5jdGlvbiBgbGlzdGVuZXIgPSBsVmlld1tDTEVBTlVQXVt0Vmlldy5jbGVhbnVwW2krMl1dYFxuICAgKiA0dGggaW5kZXggaXM6IGB1c2VDYXB0dXJlT3JJbmR4ID0gdFZpZXcuY2xlYW51cFtpKzNdYFxuICAgKiAgICBgdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT0gJ2Jvb2xlYW4nIDogdXNlQ2FwdHVyZSBib29sZWFuXG4gICAqICAgIGB0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PSAnbnVtYmVyJzpcbiAgICogICAgICAgICBgdXNlQ2FwdHVyZU9ySW5keCA+PSAwYCBgcmVtb3ZlTGlzdGVuZXIgPSBMVmlld1tDTEVBTlVQXVt1c2VDYXB0dXJlT3JJbmR4XWBcbiAgICogICAgICAgICBgdXNlQ2FwdHVyZU9ySW5keCA8ICAwYCBgc3Vic2NyaXB0aW9uID0gTFZpZXdbQ0xFQU5VUF1bLXVzZUNhcHR1cmVPckluZHhdYFxuICAgKlxuICAgKiBJZiBpdCdzIGEgcmVuZGVyZXIyIHN0eWxlIGxpc3RlbmVyIG9yIFZpZXdSZWYgZGVzdHJveSBob29rIGJlaW5nIHN0b3JlZDpcbiAgICogMXN0IGluZGV4IGlzOiBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzW11cbiAgICogMm5kIGluZGV4IGlzOiBgbnVsbGBcbiAgICogICAgICAgICAgICAgICBgbFZpZXdbQ0xFQU5VUF1bdFZpZXcuY2xlYW51cFtpKzBdXSgpYFxuICAgKlxuICAgKiBJZiBpdCdzIGFuIG91dHB1dCBzdWJzY3JpcHRpb24gb3IgcXVlcnkgbGlzdCBkZXN0cm95IGhvb2s6XG4gICAqIDFzdCBpbmRleCBpczogb3V0cHV0IHVuc3Vic2NyaWJlIGZ1bmN0aW9uIC8gcXVlcnkgbGlzdCBkZXN0cm95IGZ1bmN0aW9uXG4gICAqIDJuZCBpbmRleCBpczogaW5kZXggb2YgZnVuY3Rpb24gY29udGV4dCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzW11cbiAgICogICAgICAgICAgICAgICBgdFZpZXcuY2xlYW51cFtpKzBdLmNhbGwobFZpZXdbQ0xFQU5VUF1bdFZpZXcuY2xlYW51cFtpKzFdXSlgXG4gICAqL1xuICBjbGVhbnVwOiBhbnlbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgZWxlbWVudCBpbmRpY2VzIGZvciBjaGlsZCBjb21wb25lbnRzIHRoYXQgd2lsbCBuZWVkIHRvIGJlXG4gICAqIHJlZnJlc2hlZCB3aGVuIHRoZSBjdXJyZW50IHZpZXcgaGFzIGZpbmlzaGVkIGl0cyBjaGVjay4gVGhlc2UgaW5kaWNlcyBoYXZlXG4gICAqIGFscmVhZHkgYmVlbiBhZGp1c3RlZCBmb3IgdGhlIEhFQURFUl9PRkZTRVQuXG4gICAqXG4gICAqL1xuICBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgaW5kaWNlcyBmb3IgY2hpbGQgZGlyZWN0aXZlcyB0aGF0IGhhdmUgY29udGVudCBxdWVyaWVzLlxuICAgKi9cbiAgY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFJvb3RDb250ZXh0RmxhZ3Mge0VtcHR5ID0gMGIwMCwgRGV0ZWN0Q2hhbmdlcyA9IDBiMDEsIEZsdXNoUGxheWVycyA9IDBiMTB9XG5cblxuLyoqXG4gKiBSb290Q29udGV4dCBjb250YWlucyBpbmZvcm1hdGlvbiB3aGljaCBpcyBzaGFyZWQgZm9yIGFsbCBjb21wb25lbnRzIHdoaWNoXG4gKiB3ZXJlIGJvb3RzdHJhcHBlZCB3aXRoIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJvb3RDb250ZXh0IHtcbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gdXNlZCBmb3Igc2NoZWR1bGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFVzdWFsbHlcbiAgICogdGhpcyBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYC5cbiAgICovXG4gIHNjaGVkdWxlcjogKHdvcmtGbjogKCkgPT4gdm9pZCkgPT4gdm9pZDtcblxuICAvKipcbiAgICogQSBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gYWxsIGNvbXBvbmVudHMgYXJlIGNvbnNpZGVyZWQgY2xlYW4gKG5vdCBkaXJ0eSkuXG4gICAqXG4gICAqIFRoaXMgcHJvbWlzZSBpcyBvdmVyd3JpdHRlbiBldmVyeSB0aW1lIGEgZmlyc3QgY2FsbCB0byB7QGxpbmsgbWFya0RpcnR5fSBpcyBpbnZva2VkLlxuICAgKi9cbiAgY2xlYW46IFByb21pc2U8bnVsbD47XG5cbiAgLyoqXG4gICAqIFJvb3RDb21wb25lbnRzIC0gVGhlIGNvbXBvbmVudHMgdGhhdCB3ZXJlIGluc3RhbnRpYXRlZCBieSB0aGUgY2FsbCB0b1xuICAgKiB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAgICovXG4gIGNvbXBvbmVudHM6IHt9W107XG5cbiAgLyoqXG4gICAqIFRoZSBwbGF5ZXIgZmx1c2hpbmcgaGFuZGxlciB0byBraWNrIG9mZiBhbGwgYW5pbWF0aW9uc1xuICAgKi9cbiAgcGxheWVySGFuZGxlcjogUGxheWVySGFuZGxlcnxudWxsO1xuXG4gIC8qKlxuICAgKiBXaGF0IHJlbmRlci1yZWxhdGVkIG9wZXJhdGlvbnMgdG8gcnVuIG9uY2UgYSBzY2hlZHVsZXIgaGFzIGJlZW4gc2V0XG4gICAqL1xuICBmbGFnczogUm9vdENvbnRleHRGbGFncztcbn1cblxuLyoqXG4gKiBBcnJheSBvZiBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgYSB2aWV3IGFuZCB0aGVpciBkaXJlY3RpdmUgaW5kaWNlcy5cbiAqXG4gKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IHR5cGUgSG9va0RhdGEgPSAobnVtYmVyIHwgKCgpID0+IHZvaWQpKVtdO1xuXG4vKipcbiAqIFN0YXRpYyBkYXRhIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGluc3RhbmNlLXNwZWNpZmljIGRhdGEgYXJyYXkgb24gYW4gTFZpZXcuXG4gKlxuICogRWFjaCBub2RlJ3Mgc3RhdGljIGRhdGEgaXMgc3RvcmVkIGluIHREYXRhIGF0IHRoZSBzYW1lIGluZGV4IHRoYXQgaXQncyBzdG9yZWRcbiAqIGluIHRoZSBkYXRhIGFycmF5LiAgQW55IG5vZGVzIHRoYXQgZG8gbm90IGhhdmUgc3RhdGljIGRhdGEgc3RvcmUgYSBudWxsIHZhbHVlIGluXG4gKiB0RGF0YSB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqXG4gKiBFYWNoIHBpcGUncyBkZWZpbml0aW9uIGlzIHN0b3JlZCBoZXJlIGF0IHRoZSBzYW1lIGluZGV4IGFzIGl0cyBwaXBlIGluc3RhbmNlIGluXG4gKiB0aGUgZGF0YSBhcnJheS5cbiAqXG4gKiBFYWNoIGhvc3QgcHJvcGVydHkncyBuYW1lIGlzIHN0b3JlZCBoZXJlIGF0IHRoZSBzYW1lIGluZGV4IGFzIGl0cyB2YWx1ZSBpbiB0aGVcbiAqIGRhdGEgYXJyYXkuXG4gKlxuICogRWFjaCBwcm9wZXJ0eSBiaW5kaW5nIG5hbWUgaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHZhbHVlIGluXG4gKiB0aGUgZGF0YSBhcnJheS4gSWYgdGhlIGJpbmRpbmcgaXMgYW4gaW50ZXJwb2xhdGlvbiwgdGhlIHN0YXRpYyBzdHJpbmcgdmFsdWVzXG4gKiBhcmUgc3RvcmVkIHBhcmFsbGVsIHRvIHRoZSBkeW5hbWljIHZhbHVlcy4gRXhhbXBsZTpcbiAqXG4gKiBpZD1cInByZWZpeCB7eyB2MCB9fSBhIHt7IHYxIH19IGIge3sgdjIgfX0gc3VmZml4XCJcbiAqXG4gKiBMVmlldyAgICAgICB8ICAgVFZpZXcuZGF0YVxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICB2MCB2YWx1ZSAgIHwgICAnYSdcbiAqICB2MSB2YWx1ZSAgIHwgICAnYidcbiAqICB2MiB2YWx1ZSAgIHwgICBpZCDvv70gcHJlZml4IO+/vSBzdWZmaXhcbiAqXG4gKiBJbmplY3RvciBibG9vbSBmaWx0ZXJzIGFyZSBhbHNvIHN0b3JlZCBoZXJlLlxuICovXG5leHBvcnQgdHlwZSBURGF0YSA9XG4gICAgKFROb2RlIHwgUGlwZURlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT58IG51bWJlciB8IFR5cGU8YW55PnxcbiAgICAgSW5qZWN0aW9uVG9rZW48YW55PnwgVEkxOG4gfCBJMThuVXBkYXRlT3BDb2RlcyB8IG51bGwgfCBzdHJpbmcpW107XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=