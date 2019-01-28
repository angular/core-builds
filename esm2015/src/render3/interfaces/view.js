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
    /** Whether or not this view is currently dirty (needing check) */
    Dirty: 32,
    /** Whether or not this view is currently attached to change detection tree. */
    Attached: 64,
    /** Whether or not this view is destroyed. */
    Destroyed: 128,
    /** Whether or not this view is the root view */
    IsRoot: 256,
    /**
     * Index of the current init phase on last 23 bits
     */
    IndexWithinInitPhaseIncrementer: 512,
    IndexWithinInitPhaseShift: 9,
    IndexWithinInitPhaseReset: 511,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUM7O0FBQ3RCLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sSUFBSSxHQUFHLENBQUM7O0FBQ3JCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDOztBQUNyQixNQUFNLE9BQU8sU0FBUyxHQUFHLENBQUM7OztBQUMxQixNQUFNLE9BQU8sYUFBYSxHQUFHLENBQUM7O0FBQzlCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLE9BQU8sR0FBRyxDQUFDOztBQUN4QixNQUFNLE9BQU8sUUFBUSxHQUFHLEVBQUU7O0FBQzFCLE1BQU0sT0FBTyxnQkFBZ0IsR0FBRyxFQUFFOztBQUNsQyxNQUFNLE9BQU8sUUFBUSxHQUFHLEVBQUU7O0FBQzFCLE1BQU0sT0FBTyxTQUFTLEdBQUcsRUFBRTs7QUFDM0IsTUFBTSxPQUFPLElBQUksR0FBRyxFQUFFOztBQUN0QixNQUFNLE9BQU8sZUFBZSxHQUFHLEVBQUU7O0FBQ2pDLE1BQU0sT0FBTyxlQUFlLEdBQUcsRUFBRTs7QUFDakMsTUFBTSxPQUFPLGdCQUFnQixHQUFHLEVBQUU7Ozs7O0FBRWxDLE1BQU0sT0FBTyxhQUFhLEdBQUcsRUFBRTs7OztBQU0vQixxQ0FFQzs7O0lBREMsb0NBQWlFOzs7Ozs7Ozs7Ozs7O0FBY25FLDJCQWlKQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJQyxzREFBc0Q7SUFDdEQsNEJBQXlDO0lBQ3pDLHFCQUFrQztJQUVsQzs7Ozs7OztPQU9HO0lBQ0gsZUFBNEI7SUFFNUI7Ozs7OztPQU1HO0lBQ0gsaUJBQThCO0lBRTlCLHdGQUF3RjtJQUN4RixlQUEyQjtJQUUzQixrRUFBa0U7SUFDbEUsU0FBcUI7SUFFckIsK0VBQStFO0lBQy9FLFlBQXdCO0lBRXhCLDZDQUE2QztJQUM3QyxjQUF5QjtJQUV6QixnREFBZ0Q7SUFDaEQsV0FBc0I7SUFFdEI7O09BRUc7SUFDSCxvQ0FBK0M7SUFDL0MsNEJBQTZCO0lBQzdCLDhCQUF5Qzs7Ozs7SUFXekMscUJBQXlCO0lBQ3pCLCtCQUFtQztJQUNuQyw0QkFBZ0M7SUFDaEMscUJBQXlCOzs7Ozs7Ozs7O0FBUzNCLDJCQXlPQzs7Ozs7Ozs7OztJQWpPQyxtQkFBb0I7Ozs7OztJQU1wQiwwQkFBaUI7Ozs7OztJQU1qQix5QkFBcUM7Ozs7O0lBS3JDLDBCQUFtQzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFpQm5DLHFCQUFrQzs7Ozs7SUFHbEMsa0NBQTJCOzs7OztJQUczQixxQkFBWTs7Ozs7Ozs7SUFRWixrQ0FBMEI7Ozs7Ozs7Ozs7OztJQVkxQixrQ0FBMEI7Ozs7Ozs7Ozs7O0lBVzFCLG9DQUE0Qjs7Ozs7Ozs7Ozs7O0lBWTVCLDJCQUFtQjs7Ozs7SUFLbkIsMkJBQXVCOzs7Ozs7O0lBT3ZCLG9DQUFvRTs7Ozs7Ozs7SUFRcEUsa0NBQXlDOzs7Ozs7Ozs7OztJQVd6Qyw2QkFBK0I7Ozs7Ozs7OztJQVMvQiwwQkFBeUI7Ozs7Ozs7O0lBUXpCLDJCQUEwQjs7Ozs7Ozs7O0lBUzFCLDZCQUE0Qjs7Ozs7Ozs7O0lBUzVCLGtDQUFpQzs7Ozs7Ozs7O0lBU2pDLDBCQUF5Qjs7Ozs7Ozs7O0lBU3pCLCtCQUE4Qjs7Ozs7Ozs7SUFROUIsNkJBQTRCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFpQzVCLHdCQUFvQjs7Ozs7Ozs7SUFRcEIsMkJBQTBCOzs7Ozs7OztJQVExQiwrQkFBOEI7Ozs7SUFHSSxRQUFZLEVBQUUsZ0JBQW9CLEVBQUUsZUFBbUI7Ozs7Ozs7O0FBTzNGLGlDQTZCQzs7Ozs7OztJQXhCQyxnQ0FBd0M7Ozs7Ozs7SUFPeEMsNEJBQXFCOzs7Ozs7SUFNckIsaUNBQWlCOzs7OztJQUtqQixvQ0FBa0M7Ozs7O0lBS2xDLDRCQUF3Qjs7Ozs7QUE0QzFCLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vLi4vbGlua2VyJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRRdWVyeSwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdCwgSG9zdEJpbmRpbmdzRnVuY3Rpb24sIFBpcGVEZWYsIFBpcGVEZWZMaXN0fSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJMThuVXBkYXRlT3BDb2RlcywgVEkxOG59IGZyb20gJy4vaTE4bic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7UGxheWVySGFuZGxlcn0gZnJvbSAnLi9wbGF5ZXInO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9zdHlsaW5nJztcblxuXG5cbi8vIEJlbG93IGFyZSBjb25zdGFudHMgZm9yIExWaWV3IGluZGljZXMgdG8gaGVscCB1cyBsb29rIHVwIExWaWV3IG1lbWJlcnNcbi8vIHdpdGhvdXQgaGF2aW5nIHRvIHJlbWVtYmVyIHRoZSBzcGVjaWZpYyBpbmRpY2VzLlxuLy8gVWdsaWZ5IHdpbGwgaW5saW5lIHRoZXNlIHdoZW4gbWluaWZ5aW5nIHNvIHRoZXJlIHNob3VsZG4ndCBiZSBhIGNvc3QuXG5leHBvcnQgY29uc3QgVFZJRVcgPSAwO1xuZXhwb3J0IGNvbnN0IEZMQUdTID0gMTtcbmV4cG9ydCBjb25zdCBQQVJFTlQgPSAyO1xuZXhwb3J0IGNvbnN0IE5FWFQgPSAzO1xuZXhwb3J0IGNvbnN0IFFVRVJJRVMgPSA0O1xuZXhwb3J0IGNvbnN0IEhPU1QgPSA1O1xuZXhwb3J0IGNvbnN0IEhPU1RfTk9ERSA9IDY7ICAvLyBSZW5hbWUgdG8gYFRfSE9TVGA/XG5leHBvcnQgY29uc3QgQklORElOR19JTkRFWCA9IDc7XG5leHBvcnQgY29uc3QgQ0xFQU5VUCA9IDg7XG5leHBvcnQgY29uc3QgQ09OVEVYVCA9IDk7XG5leHBvcnQgY29uc3QgSU5KRUNUT1IgPSAxMDtcbmV4cG9ydCBjb25zdCBSRU5ERVJFUl9GQUNUT1JZID0gMTE7XG5leHBvcnQgY29uc3QgUkVOREVSRVIgPSAxMjtcbmV4cG9ydCBjb25zdCBTQU5JVElaRVIgPSAxMztcbmV4cG9ydCBjb25zdCBUQUlMID0gMTQ7XG5leHBvcnQgY29uc3QgQ09OVEFJTkVSX0lOREVYID0gMTU7XG5leHBvcnQgY29uc3QgQ09OVEVOVF9RVUVSSUVTID0gMTY7XG5leHBvcnQgY29uc3QgREVDTEFSQVRJT05fVklFVyA9IDE3O1xuLyoqIFNpemUgb2YgTFZpZXcncyBoZWFkZXIuIE5lY2Vzc2FyeSB0byBhZGp1c3QgZm9yIGl0IHdoZW4gc2V0dGluZyBzbG90cy4gICovXG5leHBvcnQgY29uc3QgSEVBREVSX09GRlNFVCA9IDE4O1xuXG5cbi8vIFRoaXMgaW50ZXJmYWNlIHJlcGxhY2VzIHRoZSByZWFsIExWaWV3IGludGVyZmFjZSBpZiBpdCBpcyBhbiBhcmcgb3IgYVxuLy8gcmV0dXJuIHZhbHVlIG9mIGEgcHVibGljIGluc3RydWN0aW9uLiBUaGlzIGVuc3VyZXMgd2UgZG9uJ3QgbmVlZCB0byBleHBvc2Vcbi8vIHRoZSBhY3R1YWwgaW50ZXJmYWNlLCB3aGljaCBzaG91bGQgYmUga2VwdCBwcml2YXRlLlxuZXhwb3J0IGludGVyZmFjZSBPcGFxdWVWaWV3U3RhdGUge1xuICAnX19icmFuZF9fJzogJ0JyYW5kIGZvciBPcGFxdWVWaWV3U3RhdGUgdGhhdCBub3RoaW5nIHdpbGwgbWF0Y2gnO1xufVxuXG5cbi8qKlxuICogYExWaWV3YCBzdG9yZXMgYWxsIG9mIHRoZSBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcHJvY2VzcyB0aGUgaW5zdHJ1Y3Rpb25zIGFzXG4gKiB0aGV5IGFyZSBpbnZva2VkIGZyb20gdGhlIHRlbXBsYXRlLiBFYWNoIGVtYmVkZGVkIHZpZXcgYW5kIGNvbXBvbmVudCB2aWV3IGhhcyBpdHNcbiAqIG93biBgTFZpZXdgLiBXaGVuIHByb2Nlc3NpbmcgYSBwYXJ0aWN1bGFyIHZpZXcsIHdlIHNldCB0aGUgYHZpZXdEYXRhYCB0byB0aGF0XG4gKiBgTFZpZXdgLiBXaGVuIHRoYXQgdmlldyBpcyBkb25lIHByb2Nlc3NpbmcsIHRoZSBgdmlld0RhdGFgIGlzIHNldCBiYWNrIHRvXG4gKiB3aGF0ZXZlciB0aGUgb3JpZ2luYWwgYHZpZXdEYXRhYCB3YXMgYmVmb3JlICh0aGUgcGFyZW50IGBMVmlld2ApLlxuICpcbiAqIEtlZXBpbmcgc2VwYXJhdGUgc3RhdGUgZm9yIGVhY2ggdmlldyBmYWNpbGl0aWVzIHZpZXcgaW5zZXJ0aW9uIC8gZGVsZXRpb24sIHNvIHdlXG4gKiBkb24ndCBoYXZlIHRvIGVkaXQgdGhlIGRhdGEgYXJyYXkgYmFzZWQgb24gd2hpY2ggdmlld3MgYXJlIHByZXNlbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFZpZXcgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAgLyoqXG4gICAqIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyB2aWV3LiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoaXMgc28gd2UgY2FuIGVhc2lseSB3YWxrIHVwIHRoZVxuICAgKiBub2RlIHRyZWUgaW4gREkgYW5kIGdldCB0aGUgVFZpZXcuZGF0YSBhcnJheSBhc3NvY2lhdGVkIHdpdGggYSBub2RlICh3aGVyZSB0aGVcbiAgICogZGlyZWN0aXZlIGRlZnMgYXJlIHN0b3JlZCkuXG4gICAqL1xuICByZWFkb25seVtUVklFV106IFRWaWV3O1xuXG4gIC8qKiBGbGFncyBmb3IgdGhpcyB2aWV3LiBTZWUgTFZpZXdGbGFncyBmb3IgbW9yZSBpbmZvLiAqL1xuICBbRkxBR1NdOiBMVmlld0ZsYWdzO1xuXG4gIC8qKlxuICAgKiBUaGUgcGFyZW50IHZpZXcgaXMgbmVlZGVkIHdoZW4gd2UgZXhpdCB0aGUgdmlldyBhbmQgbXVzdCByZXN0b3JlIHRoZSBwcmV2aW91c1xuICAgKiBgTFZpZXdgLiBXaXRob3V0IHRoaXMsIHRoZSByZW5kZXIgbWV0aG9kIHdvdWxkIGhhdmUgdG8ga2VlcCBhIHN0YWNrIG9mXG4gICAqIHZpZXdzIGFzIGl0IGlzIHJlY3Vyc2l2ZWx5IHJlbmRlcmluZyB0ZW1wbGF0ZXMuXG4gICAqXG4gICAqIFRoaXMgaXMgdGhlIFwiaW5zZXJ0aW9uXCIgdmlldyBmb3IgZW1iZWRkZWQgdmlld3MuIFRoaXMgYWxsb3dzIHVzIHRvIHByb3Blcmx5XG4gICAqIGRlc3Ryb3kgZW1iZWRkZWQgdmlld3MuXG4gICAqL1xuICBbUEFSRU5UXTogTFZpZXd8bnVsbDtcblxuICAvKipcbiAgICpcbiAgICogVGhlIG5leHQgc2libGluZyBMVmlldyBvciBMQ29udGFpbmVyLlxuICAgKlxuICAgKiBBbGxvd3MgdXMgdG8gcHJvcGFnYXRlIGJldHdlZW4gc2libGluZyB2aWV3IHN0YXRlcyB0aGF0IGFyZW4ndCBpbiB0aGUgc2FtZVxuICAgKiBjb250YWluZXIuIEVtYmVkZGVkIHZpZXdzIGFscmVhZHkgaGF2ZSBhIG5vZGUubmV4dCwgYnV0IGl0IGlzIG9ubHkgc2V0IGZvclxuICAgKiB2aWV3cyBpbiB0aGUgc2FtZSBjb250YWluZXIuIFdlIG5lZWQgYSB3YXkgdG8gbGluayBjb21wb25lbnQgdmlld3MgYW5kIHZpZXdzXG4gICAqIGFjcm9zcyBjb250YWluZXJzIGFzIHdlbGwuXG4gICAqL1xuICBbTkVYVF06IExWaWV3fExDb250YWluZXJ8bnVsbDtcblxuICAvKiogUXVlcmllcyBhY3RpdmUgZm9yIHRoaXMgdmlldyAtIG5vZGVzIGZyb20gYSB2aWV3IGFyZSByZXBvcnRlZCB0byB0aG9zZSBxdWVyaWVzLiAqL1xuICBbUVVFUklFU106IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBob3N0IG5vZGUgZm9yIHRoaXMgTFZpZXcgaW5zdGFuY2UsIGlmIHRoaXMgaXMgYSBjb21wb25lbnQgdmlldy5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3LCBIT1NUIHdpbGwgYmUgbnVsbC5cbiAgICovXG4gIFtIT1NUXTogUkVsZW1lbnR8U3R5bGluZ0NvbnRleHR8bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgYFRWaWV3Tm9kZWAgb3IgYFRFbGVtZW50Tm9kZWAgd2hpY2ggcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdmlldy5cbiAgICpcbiAgICogSWYgYFRWaWV3Tm9kZWAsIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiBhIGNvbnRhaW5lci4gV2UgbmVlZCB0aGlzIHRvIGJlIGFibGUgdG9cbiAgICogZWZmaWNpZW50bHkgZmluZCB0aGUgYExWaWV3Tm9kZWAgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXcgaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIGBURWxlbWVudE5vZGVgLCB0aGlzIGlzIHRoZSBMVmlldyBvZiBhIGNvbXBvbmVudC5cbiAgICpcbiAgICogSWYgbnVsbCwgdGhpcyBpcyB0aGUgcm9vdCB2aWV3IG9mIGFuIGFwcGxpY2F0aW9uIChyb290IGNvbXBvbmVudCBpcyBpbiB0aGlzIHZpZXcpLlxuICAgKi9cbiAgW0hPU1RfTk9ERV06IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGJpbmRpbmcgaW5kZXggd2Ugc2hvdWxkIGFjY2VzcyBuZXh0LlxuICAgKlxuICAgKiBUaGlzIGlzIHN0b3JlZCBzbyB0aGF0IGJpbmRpbmdzIGNhbiBjb250aW51ZSB3aGVyZSB0aGV5IGxlZnQgb2ZmXG4gICAqIGlmIGEgdmlldyBpcyBsZWZ0IG1pZHdheSB0aHJvdWdoIHByb2Nlc3NpbmcgYmluZGluZ3MgKGUuZy4gaWYgdGhlcmUgaXNcbiAgICogYSBzZXR0ZXIgdGhhdCBjcmVhdGVzIGFuIGVtYmVkZGVkIHZpZXcsIGxpa2UgaW4gbmdJZikuXG4gICAqL1xuICBbQklORElOR19JTkRFWF06IG51bWJlcjtcblxuICAvKipcbiAgICogV2hlbiBhIHZpZXcgaXMgZGVzdHJveWVkLCBsaXN0ZW5lcnMgbmVlZCB0byBiZSByZWxlYXNlZCBhbmQgb3V0cHV0cyBuZWVkIHRvIGJlXG4gICAqIHVuc3Vic2NyaWJlZC4gVGhpcyBjb250ZXh0IGFycmF5IHN0b3JlcyBib3RoIGxpc3RlbmVyIGZ1bmN0aW9ucyB3cmFwcGVkIHdpdGhcbiAgICogdGhlaXIgY29udGV4dCBhbmQgb3V0cHV0IHN1YnNjcmlwdGlvbiBpbnN0YW5jZXMgZm9yIGEgcGFydGljdWxhciB2aWV3LlxuICAgKlxuICAgKiBUaGVzZSBjaGFuZ2UgcGVyIExWaWV3IGluc3RhbmNlLCBzbyB0aGV5IGNhbm5vdCBiZSBzdG9yZWQgb24gVFZpZXcuIEluc3RlYWQsXG4gICAqIFRWaWV3LmNsZWFudXAgc2F2ZXMgYW4gaW5kZXggdG8gdGhlIG5lY2Vzc2FyeSBjb250ZXh0IGluIHRoaXMgYXJyYXkuXG4gICAqL1xuICAvLyBUT0RPOiBmbGF0dGVuIGludG8gTFZpZXdbXVxuICBbQ0xFQU5VUF06IGFueVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIC0gRm9yIGR5bmFtaWMgdmlld3MsIHRoaXMgaXMgdGhlIGNvbnRleHQgd2l0aCB3aGljaCB0byByZW5kZXIgdGhlIHRlbXBsYXRlIChlLmcuXG4gICAqICAgYE5nRm9yQ29udGV4dGApLCBvciBge31gIGlmIG5vdCBkZWZpbmVkIGV4cGxpY2l0bHkuXG4gICAqIC0gRm9yIHJvb3QgdmlldyBvZiB0aGUgcm9vdCBjb21wb25lbnQgdGhlIGNvbnRleHQgY29udGFpbnMgY2hhbmdlIGRldGVjdGlvbiBkYXRhLlxuICAgKiAtIEZvciBub24tcm9vdCBjb21wb25lbnRzLCB0aGUgY29udGV4dCBpcyB0aGUgY29tcG9uZW50IGluc3RhbmNlLFxuICAgKiAtIEZvciBpbmxpbmUgdmlld3MsIHRoZSBjb250ZXh0IGlzIG51bGwuXG4gICAqL1xuICBbQ09OVEVYVF06IHt9fFJvb3RDb250ZXh0fG51bGw7XG5cbiAgLyoqIEFuIG9wdGlvbmFsIE1vZHVsZSBJbmplY3RvciB0byBiZSB1c2VkIGFzIGZhbGwgYmFjayBhZnRlciBFbGVtZW50IEluamVjdG9ycyBhcmUgY29uc3VsdGVkLiAqL1xuICByZWFkb25seVtJTkpFQ1RPUl06IEluamVjdG9yfG51bGw7XG5cbiAgLyoqIFJlbmRlcmVyIHRvIGJlIHVzZWQgZm9yIHRoaXMgdmlldy4gKi9cbiAgW1JFTkRFUkVSX0ZBQ1RPUlldOiBSZW5kZXJlckZhY3RvcnkzO1xuXG4gIC8qKiBSZW5kZXJlciB0byBiZSB1c2VkIGZvciB0aGlzIHZpZXcuICovXG4gIFtSRU5ERVJFUl06IFJlbmRlcmVyMztcblxuICAvKiogQW4gb3B0aW9uYWwgY3VzdG9tIHNhbml0aXplci4gKi9cbiAgW1NBTklUSVpFUl06IFNhbml0aXplcnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBMVmlldyBvciBMQ29udGFpbmVyIGJlbmVhdGggdGhpcyBMVmlldyBpbiB0aGUgaGllcmFyY2h5LlxuICAgKlxuICAgKiBUaGUgdGFpbCBhbGxvd3MgdXMgdG8gcXVpY2tseSBhZGQgYSBuZXcgc3RhdGUgdG8gdGhlIGVuZCBvZiB0aGUgdmlldyBsaXN0XG4gICAqIHdpdGhvdXQgaGF2aW5nIHRvIHByb3BhZ2F0ZSBzdGFydGluZyBmcm9tIHRoZSBmaXJzdCBjaGlsZC5cbiAgICovXG4gIFtUQUlMXTogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIHBhcmVudCBjb250YWluZXIncyBob3N0IG5vZGUuIEFwcGxpY2FibGUgb25seSB0byBlbWJlZGRlZCB2aWV3cyB0aGF0XG4gICAqIGhhdmUgYmVlbiBpbnNlcnRlZCBkeW5hbWljYWxseS4gV2lsbCBiZSAtMSBmb3IgY29tcG9uZW50IHZpZXdzIGFuZCBpbmxpbmUgdmlld3MuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIGp1bXAgZnJvbSBkeW5hbWljYWxseSBjcmVhdGVkIGVtYmVkZGVkIHZpZXdzIHRvIHRoZWlyIHBhcmVudFxuICAgKiBjb250YWluZXJzIGJlY2F1c2UgdGhlaXIgcGFyZW50IGNhbm5vdCBiZSBzdG9yZWQgb24gdGhlIFRWaWV3Tm9kZSAodmlld3MgbWF5IGJlIGluc2VydGVkXG4gICAqIGluIG11bHRpcGxlIGNvbnRhaW5lcnMsIHNvIHRoZSBwYXJlbnQgY2Fubm90IGJlIHNoYXJlZCBiZXR3ZWVuIHZpZXcgaW5zdGFuY2VzKS5cbiAgICovXG4gIFtDT05UQUlORVJfSU5ERVhdOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBRdWVyeUxpc3RzIGFzc29jaWF0ZWQgd2l0aCBjb250ZW50IHF1ZXJpZXMgb2YgYSBkaXJlY3RpdmUuIFRoaXMgZGF0YSBzdHJ1Y3R1cmUgaXNcbiAgICogZmlsbGVkLWluIGFzIHBhcnQgb2YgYSBkaXJlY3RpdmUgY3JlYXRpb24gcHJvY2VzcyBhbmQgaXMgbGF0ZXIgdXNlZCB0byByZXRyaWV2ZSBhIFF1ZXJ5TGlzdCB0b1xuICAgKiBiZSByZWZyZXNoZWQuXG4gICAqL1xuICBbQ09OVEVOVF9RVUVSSUVTXTogUXVlcnlMaXN0PGFueT5bXXxudWxsO1xuXG4gIC8qKlxuICAgKiBWaWV3IHdoZXJlIHRoaXMgdmlldydzIHRlbXBsYXRlIHdhcyBkZWNsYXJlZC5cbiAgICpcbiAgICogT25seSBhcHBsaWNhYmxlIGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzLiBXaWxsIGJlIG51bGwgZm9yIGlubGluZS9jb21wb25lbnQgdmlld3MuXG4gICAqXG4gICAqIFRoZSB0ZW1wbGF0ZSBmb3IgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgbWF5IGJlIGRlY2xhcmVkIGluIGEgZGlmZmVyZW50IHZpZXcgdGhhblxuICAgKiBpdCBpcyBpbnNlcnRlZC4gV2UgYWxyZWFkeSB0cmFjayB0aGUgXCJpbnNlcnRpb24gdmlld1wiICh2aWV3IHdoZXJlIHRoZSB0ZW1wbGF0ZSB3YXNcbiAgICogaW5zZXJ0ZWQpIGluIExWaWV3W1BBUkVOVF0sIGJ1dCB3ZSBhbHNvIG5lZWQgYWNjZXNzIHRvIHRoZSBcImRlY2xhcmF0aW9uIHZpZXdcIlxuICAgKiAodmlldyB3aGVyZSB0aGUgdGVtcGxhdGUgd2FzIGRlY2xhcmVkKS4gT3RoZXJ3aXNlLCB3ZSB3b3VsZG4ndCBiZSBhYmxlIHRvIGNhbGwgdGhlXG4gICAqIHZpZXcncyB0ZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBwcm9wZXIgY29udGV4dHMuIENvbnRleHQgc2hvdWxkIGJlIGluaGVyaXRlZCBmcm9tXG4gICAqIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUsIG5vdCB0aGUgaW5zZXJ0aW9uIHZpZXcgdHJlZS5cbiAgICpcbiAgICogRXhhbXBsZSAoQXBwQ29tcG9uZW50IHRlbXBsYXRlKTpcbiAgICpcbiAgICogPG5nLXRlbXBsYXRlICNmb28+PC9uZy10ZW1wbGF0ZT4gICAgICAgPC0tIGRlY2xhcmVkIGhlcmUgLS0+XG4gICAqIDxzb21lLWNvbXAgW3RwbF09XCJmb29cIj48L3NvbWUtY29tcD4gICAgPC0tIGluc2VydGVkIGluc2lkZSB0aGlzIGNvbXBvbmVudCAtLT5cbiAgICpcbiAgICogVGhlIDxuZy10ZW1wbGF0ZT4gYWJvdmUgaXMgZGVjbGFyZWQgaW4gdGhlIEFwcENvbXBvbmVudCB0ZW1wbGF0ZSwgYnV0IGl0IHdpbGwgYmUgcGFzc2VkIGludG9cbiAgICogU29tZUNvbXAgYW5kIGluc2VydGVkIHRoZXJlLiBJbiB0aGlzIGNhc2UsIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHdvdWxkIGJlIHRoZSBBcHBDb21wb25lbnQsXG4gICAqIGJ1dCB0aGUgaW5zZXJ0aW9uIHZpZXcgd291bGQgYmUgU29tZUNvbXAuIFdoZW4gd2UgYXJlIHJlbW92aW5nIHZpZXdzLCB3ZSB3b3VsZCB3YW50IHRvXG4gICAqIHRyYXZlcnNlIHRocm91Z2ggdGhlIGluc2VydGlvbiB2aWV3IHRvIGNsZWFuIHVwIGxpc3RlbmVycy4gV2hlbiB3ZSBhcmUgY2FsbGluZyB0aGVcbiAgICogdGVtcGxhdGUgZnVuY3Rpb24gZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHdlIG5lZWQgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdG8gZ2V0IGluaGVyaXRlZFxuICAgKiBjb250ZXh0LlxuICAgKi9cbiAgW0RFQ0xBUkFUSU9OX1ZJRVddOiBMVmlld3xudWxsO1xufVxuXG4vKiogRmxhZ3MgYXNzb2NpYXRlZCB3aXRoIGFuIExWaWV3IChzYXZlZCBpbiBMVmlld1tGTEFHU10pICovXG5leHBvcnQgY29uc3QgZW51bSBMVmlld0ZsYWdzIHtcbiAgLyoqIFRoZSBzdGF0ZSBvZiB0aGUgaW5pdCBwaGFzZSBvbiB0aGUgZmlyc3QgMiBiaXRzICovXG4gIEluaXRQaGFzZVN0YXRlSW5jcmVtZW50ZXIgPSAwYjAwMDAwMDAwMDAxLFxuICBJbml0UGhhc2VTdGF0ZU1hc2sgPSAwYjAwMDAwMDAwMDExLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgdmlldyBpcyBpbiBjcmVhdGlvbk1vZGUuXG4gICAqXG4gICAqIFRoaXMgbXVzdCBiZSBzdG9yZWQgaW4gdGhlIHZpZXcgcmF0aGVyIHRoYW4gdXNpbmcgYGRhdGFgIGFzIGEgbWFya2VyIHNvIHRoYXRcbiAgICogd2UgY2FuIHByb3Blcmx5IHN1cHBvcnQgZW1iZWRkZWQgdmlld3MuIE90aGVyd2lzZSwgd2hlbiBleGl0aW5nIGEgY2hpbGQgdmlld1xuICAgKiBiYWNrIGludG8gdGhlIHBhcmVudCB2aWV3LCBgZGF0YWAgd2lsbCBiZSBkZWZpbmVkIGFuZCBgY3JlYXRpb25Nb2RlYCB3aWxsIGJlXG4gICAqIGltcHJvcGVybHkgcmVwb3J0ZWQgYXMgZmFsc2UuXG4gICAqL1xuICBDcmVhdGlvbk1vZGUgPSAwYjAwMDAwMDAwMTAwLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGlzIExWaWV3IGluc3RhbmNlIGlzIG9uIGl0cyBmaXJzdCBwcm9jZXNzaW5nIHBhc3MuXG4gICAqXG4gICAqIEFuIExWaWV3IGluc3RhbmNlIGlzIGNvbnNpZGVyZWQgdG8gYmUgb24gaXRzIFwiZmlyc3QgcGFzc1wiIHVudGlsIGl0XG4gICAqIGhhcyBjb21wbGV0ZWQgb25lIGNyZWF0aW9uIG1vZGUgcnVuIGFuZCBvbmUgdXBkYXRlIG1vZGUgcnVuLiBBdCB0aGlzXG4gICAqIHRpbWUsIHRoZSBmbGFnIGlzIHR1cm5lZCBvZmYuXG4gICAqL1xuICBGaXJzdExWaWV3UGFzcyA9IDBiMDAwMDAwMDEwMDAsXG5cbiAgLyoqIFdoZXRoZXIgdGhpcyB2aWV3IGhhcyBkZWZhdWx0IGNoYW5nZSBkZXRlY3Rpb24gc3RyYXRlZ3kgKGNoZWNrcyBhbHdheXMpIG9yIG9uUHVzaCAqL1xuICBDaGVja0Fsd2F5cyA9IDBiMDAwMDAwMTAwMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBjdXJyZW50bHkgZGlydHkgKG5lZWRpbmcgY2hlY2spICovXG4gIERpcnR5ID0gMGIwMDAwMDEwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBhdHRhY2hlZCB0byBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuICovXG4gIEF0dGFjaGVkID0gMGIwMDAwMTAwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC4gKi9cbiAgRGVzdHJveWVkID0gMGIwMDAxMDAwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIHRoZSByb290IHZpZXcgKi9cbiAgSXNSb290ID0gMGIwMDEwMDAwMDAwMCxcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIGN1cnJlbnQgaW5pdCBwaGFzZSBvbiBsYXN0IDIzIGJpdHNcbiAgICovXG4gIEluZGV4V2l0aGluSW5pdFBoYXNlSW5jcmVtZW50ZXIgPSAwYjAxMDAwMDAwMDAwLFxuICBJbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0ID0gOSxcbiAgSW5kZXhXaXRoaW5Jbml0UGhhc2VSZXNldCA9IDBiMDAxMTExMTExMTEsXG59XG5cbi8qKlxuICogUG9zc2libGUgc3RhdGVzIG9mIHRoZSBpbml0IHBoYXNlOlxuICogLSAwMDogT25Jbml0IGhvb2tzIHRvIGJlIHJ1bi5cbiAqIC0gMDE6IEFmdGVyQ29udGVudEluaXQgaG9va3MgdG8gYmUgcnVuXG4gKiAtIDEwOiBBZnRlclZpZXdJbml0IGhvb2tzIHRvIGJlIHJ1blxuICogLSAxMTogQWxsIGluaXQgaG9va3MgaGF2ZSBiZWVuIHJ1blxuICovXG5leHBvcnQgY29uc3QgZW51bSBJbml0UGhhc2VTdGF0ZSB7XG4gIE9uSW5pdEhvb2tzVG9CZVJ1biA9IDBiMDAsXG4gIEFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4gPSAwYjAxLFxuICBBZnRlclZpZXdJbml0SG9va3NUb0JlUnVuID0gMGIxMCxcbiAgSW5pdFBoYXNlQ29tcGxldGVkID0gMGIxMSxcbn1cblxuLyoqXG4gKiBUaGUgc3RhdGljIGRhdGEgZm9yIGFuIExWaWV3IChzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIG9mIGFcbiAqIGdpdmVuIHR5cGUpLlxuICpcbiAqIFN0b3JlZCBvbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gYXMgbmdQcml2YXRlRGF0YS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlldyB7XG4gIC8qKlxuICAgKiBJRCBmb3IgaW5saW5lIHZpZXdzIHRvIGRldGVybWluZSB3aGV0aGVyIGEgdmlldyBpcyB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgdmlld1xuICAgKiBpbiBhIGNlcnRhaW4gcG9zaXRpb24uIElmIGl0J3Mgbm90LCB3ZSBrbm93IHRoZSBuZXcgdmlldyBuZWVkcyB0byBiZSBpbnNlcnRlZFxuICAgKiBhbmQgdGhlIG9uZSB0aGF0IGV4aXN0cyBuZWVkcyB0byBiZSByZW1vdmVkIChlLmcuIGlmL2Vsc2Ugc3RhdGVtZW50cylcbiAgICpcbiAgICogSWYgdGhpcyBpcyAtMSwgdGhlbiB0aGlzIGlzIGEgY29tcG9uZW50IHZpZXcgb3IgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcuXG4gICAqL1xuICByZWFkb25seSBpZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGEgYmx1ZXByaW50IHVzZWQgdG8gZ2VuZXJhdGUgTFZpZXcgaW5zdGFuY2VzIGZvciB0aGlzIFRWaWV3LiBDb3B5aW5nIHRoaXNcbiAgICogYmx1ZXByaW50IGlzIGZhc3RlciB0aGFuIGNyZWF0aW5nIGEgbmV3IExWaWV3IGZyb20gc2NyYXRjaC5cbiAgICovXG4gIGJsdWVwcmludDogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiB1c2VkIHRvIHJlZnJlc2ggdGhlIHZpZXcgb2YgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3c1xuICAgKiBhbmQgY29tcG9uZW50cy4gV2lsbCBiZSBudWxsIGZvciBpbmxpbmUgdmlld3MuXG4gICAqL1xuICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gY29udGFpbmluZyBxdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucy5cbiAgICovXG4gIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIFBvaW50ZXIgdG8gdGhlIGBUTm9kZWAgdGhhdCByZXByZXNlbnRzIHRoZSByb290IG9mIHRoZSB2aWV3LlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGEgYFRWaWV3Tm9kZWAgZm9yIGFuIGBMVmlld05vZGVgLCB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgYSBjb250YWluZXIuXG4gICAqIFdlIG5lZWQgdGhpcyBwb2ludGVyIHRvIGJlIGFibGUgdG8gZWZmaWNpZW50bHkgZmluZCB0aGlzIG5vZGUgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXdcbiAgICogaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVEVsZW1lbnROb2RlYCwgdGhpcyBpcyB0aGUgdmlldyBvZiBhIHJvb3QgY29tcG9uZW50LiBJdCBoYXMgZXhhY3RseSBvbmVcbiAgICogcm9vdCBUTm9kZS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBudWxsLCB0aGlzIGlzIHRoZSB2aWV3IG9mIGEgY29tcG9uZW50IHRoYXQgaXMgbm90IGF0IHJvb3QuIFdlIGRvIG5vdCBzdG9yZVxuICAgKiB0aGUgaG9zdCBUTm9kZXMgZm9yIGNoaWxkIGNvbXBvbmVudCB2aWV3cyBiZWNhdXNlIHRoZXkgY2FuIHBvdGVudGlhbGx5IGhhdmUgc2V2ZXJhbFxuICAgKiBkaWZmZXJlbnQgaG9zdCBUTm9kZXMsIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IGlzIGJlaW5nIHVzZWQuIFRoZXNlIGhvc3RcbiAgICogVE5vZGVzIGNhbm5vdCBiZSBzaGFyZWQgKGR1ZSB0byBkaWZmZXJlbnQgaW5kaWNlcywgZXRjKS5cbiAgICovXG4gIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbDtcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB0ZW1wbGF0ZSBoYXMgYmVlbiBwcm9jZXNzZWQuICovXG4gIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuO1xuXG4gIC8qKiBTdGF0aWMgZGF0YSBlcXVpdmFsZW50IG9mIExWaWV3LmRhdGFbXS4gQ29udGFpbnMgVE5vZGVzLCBQaXBlRGVmSW50ZXJuYWwgb3IgVEkxOG4uICovXG4gIGRhdGE6IFREYXRhO1xuXG4gIC8qKlxuICAgKiBUaGUgYmluZGluZyBzdGFydCBpbmRleCBpcyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGRhdGEgYXJyYXlcbiAgICogc3RhcnRzIHRvIHN0b3JlIGJpbmRpbmdzIG9ubHkuIFNhdmluZyB0aGlzIHZhbHVlIGVuc3VyZXMgdGhhdCB3ZVxuICAgKiB3aWxsIGJlZ2luIHJlYWRpbmcgYmluZGluZ3MgYXQgdGhlIGNvcnJlY3QgcG9pbnQgaW4gdGhlIGFycmF5IHdoZW5cbiAgICogd2UgYXJlIGluIHVwZGF0ZSBtb2RlLlxuICAgKi9cbiAgYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGV4IHdoZXJlIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uIG9mIGBMVmlld2AgYmVnaW5zLiBUaGUgZXhwYW5kb1xuICAgKiBzZWN0aW9uIGNvbnRhaW5zIGluamVjdG9ycywgZGlyZWN0aXZlIGluc3RhbmNlcywgYW5kIGhvc3QgYmluZGluZyB2YWx1ZXMuXG4gICAqIFVubGlrZSB0aGUgXCJjb25zdHNcIiBhbmQgXCJ2YXJzXCIgc2VjdGlvbnMgb2YgYExWaWV3YCwgdGhlIGxlbmd0aCBvZiB0aGlzXG4gICAqIHNlY3Rpb24gY2Fubm90IGJlIGNhbGN1bGF0ZWQgYXQgY29tcGlsZS10aW1lIGJlY2F1c2UgZGlyZWN0aXZlcyBhcmUgbWF0Y2hlZFxuICAgKiBhdCBydW50aW1lIHRvIHByZXNlcnZlIGxvY2FsaXR5LlxuICAgKlxuICAgKiBXZSBzdG9yZSB0aGlzIHN0YXJ0IGluZGV4IHNvIHdlIGtub3cgd2hlcmUgdG8gc3RhcnQgY2hlY2tpbmcgaG9zdCBiaW5kaW5nc1xuICAgKiBpbiBgc2V0SG9zdEJpbmRpbmdzYC5cbiAgICovXG4gIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCB3aGVyZSB0aGUgdmlld1F1ZXJpZXMgc2VjdGlvbiBvZiBgTFZpZXdgIGJlZ2lucy4gVGhpcyBzZWN0aW9uIGNvbnRhaW5zXG4gICAqIHZpZXcgcXVlcmllcyBkZWZpbmVkIGZvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUuXG4gICAqXG4gICAqIFdlIHN0b3JlIHRoaXMgc3RhcnQgaW5kZXggc28gd2Uga25vdyB3aGVyZSB0aGUgbGlzdCBvZiB2aWV3IHF1ZXJpZXMgc3RhcnRzLlxuICAgKiBUaGlzIGlzIHJlcXVpcmVkIHdoZW4gd2UgaW52b2tlIHZpZXcgcXVlcmllcyBhdCBydW50aW1lLiBXZSBpbnZva2UgcXVlcmllcyBvbmUgYnkgb25lIGFuZFxuICAgKiBpbmNyZW1lbnQgcXVlcnkgaW5kZXggYWZ0ZXIgZWFjaCBpdGVyYXRpb24uIFRoaXMgaW5mb3JtYXRpb24gaGVscHMgdXMgdG8gcmVzZXQgaW5kZXggYmFjayB0b1xuICAgKiB0aGUgYmVnaW5uaW5nIG9mIHZpZXcgcXVlcnkgbGlzdCBiZWZvcmUgd2UgaW52b2tlIHZpZXcgcXVlcmllcyBhZ2Fpbi5cbiAgICovXG4gIHZpZXdRdWVyeVN0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIGhvc3Qgbm9kZSBvZiB0aGUgZmlyc3QgTFZpZXcgb3IgTENvbnRhaW5lciBiZW5lYXRoIHRoaXMgTFZpZXcgaW5cbiAgICogdGhlIGhpZXJhcmNoeS5cbiAgICpcbiAgICogTmVjZXNzYXJ5IHRvIHN0b3JlIHRoaXMgc28gdmlld3MgY2FuIHRyYXZlcnNlIHRocm91Z2ggdGhlaXIgbmVzdGVkIHZpZXdzXG4gICAqIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAgICpcbiAgICogRm9yIGVtYmVkZGVkIHZpZXdzLCB3ZSBzdG9yZSB0aGUgaW5kZXggb2YgYW4gTENvbnRhaW5lcidzIGhvc3QgcmF0aGVyIHRoYW4gdGhlIGZpcnN0XG4gICAqIExWaWV3IHRvIGF2b2lkIG1hbmFnaW5nIHNwbGljaW5nIHdoZW4gdmlld3MgYXJlIGFkZGVkL3JlbW92ZWQuXG4gICAqL1xuICBjaGlsZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIGxvY2F0ZWQgaW4gdGhlIHZpZXcuXG4gICAqL1xuICBmaXJzdENoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gcHJvY2VzcyBob3N0IGJpbmRpbmdzIGVmZmljaWVudGx5LlxuICAgKlxuICAgKiBTZWUgVklFV19EQVRBLm1kIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgZXhwYW5kb0luc3RydWN0aW9uczogKG51bWJlcnxIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+fG51bGwpW118bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSXQncyBuZWNlc3NhcnkgdG8ga2VlcCBhIGNvcHkgb2YgdGhlIGZ1bGwgZGVmIGxpc3Qgb24gdGhlIFRWaWV3IHNvIGl0J3MgcG9zc2libGVcbiAgICogdG8gcmVuZGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB3aXRob3V0IGEgaG9zdCBjb21wb25lbnQuXG4gICAqL1xuICBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBGdWxsIHJlZ2lzdHJ5IG9mIHBpcGVzIHRoYXQgbWF5IGJlIGZvdW5kIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogVGhlIHByb3BlcnR5IGlzIGVpdGhlciBhbiBhcnJheSBvZiBgUGlwZURlZnNgcyBvciBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIGFycmF5IG9mXG4gICAqIGBQaXBlRGVmc2BzLiBUaGUgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IHRvIGJlIGFibGUgdG8gc3VwcG9ydCBmb3J3YXJkIGRlY2xhcmF0aW9ucy5cbiAgICpcbiAgICogSXQncyBuZWNlc3NhcnkgdG8ga2VlcCBhIGNvcHkgb2YgdGhlIGZ1bGwgZGVmIGxpc3Qgb24gdGhlIFRWaWV3IHNvIGl0J3MgcG9zc2libGVcbiAgICogdG8gcmVuZGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB3aXRob3V0IGEgaG9zdCBjb21wb25lbnQuXG4gICAqL1xuICBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nT25Jbml0IGFuZCBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgaW5pdEhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpbiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkXG4gICAqIGZvciB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlXG4gICAqIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdJbml0IGFuZCBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yXG4gICAqIHRoaXMgdmlldyBpbiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uRGVzdHJveSBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCB3aGVuIHRoaXMgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICAgKiB1bnN1YnNjcmliZWQuIFRoaXMgY2xlYW51cCBhcnJheSBzdG9yZXMgYm90aCBsaXN0ZW5lciBkYXRhIChpbiBjaHVua3Mgb2YgNClcbiAgICogYW5kIG91dHB1dCBkYXRhIChpbiBjaHVua3Mgb2YgMikgZm9yIGEgcGFydGljdWxhciB2aWV3LiBDb21iaW5pbmcgdGhlIGFycmF5c1xuICAgKiBzYXZlcyBvbiBtZW1vcnkgKDcwIGJ5dGVzIHBlciBhcnJheSkgYW5kIG9uIGEgZmV3IGJ5dGVzIG9mIGNvZGUgc2l6ZSAoZm9yIHR3b1xuICAgKiBzZXBhcmF0ZSBmb3IgbG9vcHMpLlxuICAgKlxuICAgKiBJZiBpdCdzIGEgbmF0aXZlIERPTSBsaXN0ZW5lciBvciBvdXRwdXQgc3Vic2NyaXB0aW9uIGJlaW5nIHN0b3JlZDpcbiAgICogMXN0IGluZGV4IGlzOiBldmVudCBuYW1lICBgbmFtZSA9IHRWaWV3LmNsZWFudXBbaSswXWBcbiAgICogMm5kIGluZGV4IGlzOiBpbmRleCBvZiBuYXRpdmUgZWxlbWVudCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0cmlldmVzIGdsb2JhbCB0YXJnZXQgKHdpbmRvdyxcbiAgICogICAgICAgICAgICAgICBkb2N1bWVudCBvciBib2R5KSByZWZlcmVuY2UgYmFzZWQgb24gdGhlIG5hdGl2ZSBlbGVtZW50OlxuICAgKiAgICBgdHlwZW9mIGlkeE9yVGFyZ2V0R2V0dGVyID09PSAnZnVuY3Rpb24nYDogZ2xvYmFsIHRhcmdldCBnZXR0ZXIgZnVuY3Rpb25cbiAgICogICAgYHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ251bWJlcidgOiBpbmRleCBvZiBuYXRpdmUgZWxlbWVudFxuICAgKlxuICAgKiAzcmQgaW5kZXggaXM6IGluZGV4IG9mIGxpc3RlbmVyIGZ1bmN0aW9uIGBsaXN0ZW5lciA9IGxWaWV3W0NMRUFOVVBdW3RWaWV3LmNsZWFudXBbaSsyXV1gXG4gICAqIDR0aCBpbmRleCBpczogYHVzZUNhcHR1cmVPckluZHggPSB0Vmlldy5jbGVhbnVwW2krM11gXG4gICAqICAgIGB0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PSAnYm9vbGVhbicgOiB1c2VDYXB0dXJlIGJvb2xlYW5cbiAgICogICAgYHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09ICdudW1iZXInOlxuICAgKiAgICAgICAgIGB1c2VDYXB0dXJlT3JJbmR4ID49IDBgIGByZW1vdmVMaXN0ZW5lciA9IExWaWV3W0NMRUFOVVBdW3VzZUNhcHR1cmVPckluZHhdYFxuICAgKiAgICAgICAgIGB1c2VDYXB0dXJlT3JJbmR4IDwgIDBgIGBzdWJzY3JpcHRpb24gPSBMVmlld1tDTEVBTlVQXVstdXNlQ2FwdHVyZU9ySW5keF1gXG4gICAqXG4gICAqIElmIGl0J3MgYSByZW5kZXJlcjIgc3R5bGUgbGlzdGVuZXIgb3IgVmlld1JlZiBkZXN0cm95IGhvb2sgYmVpbmcgc3RvcmVkOlxuICAgKiAxc3QgaW5kZXggaXM6IGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNbXVxuICAgKiAybmQgaW5kZXggaXM6IGBudWxsYFxuICAgKiAgICAgICAgICAgICAgIGBsVmlld1tDTEVBTlVQXVt0Vmlldy5jbGVhbnVwW2krMF1dKClgXG4gICAqXG4gICAqIElmIGl0J3MgYW4gb3V0cHV0IHN1YnNjcmlwdGlvbiBvciBxdWVyeSBsaXN0IGRlc3Ryb3kgaG9vazpcbiAgICogMXN0IGluZGV4IGlzOiBvdXRwdXQgdW5zdWJzY3JpYmUgZnVuY3Rpb24gLyBxdWVyeSBsaXN0IGRlc3Ryb3kgZnVuY3Rpb25cbiAgICogMm5kIGluZGV4IGlzOiBpbmRleCBvZiBmdW5jdGlvbiBjb250ZXh0IGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNbXVxuICAgKiAgICAgICAgICAgICAgIGB0Vmlldy5jbGVhbnVwW2krMF0uY2FsbChsVmlld1tDTEVBTlVQXVt0Vmlldy5jbGVhbnVwW2krMV1dKWBcbiAgICovXG4gIGNsZWFudXA6IGFueVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBlbGVtZW50IGluZGljZXMgZm9yIGNoaWxkIGNvbXBvbmVudHMgdGhhdCB3aWxsIG5lZWQgdG8gYmVcbiAgICogcmVmcmVzaGVkIHdoZW4gdGhlIGN1cnJlbnQgdmlldyBoYXMgZmluaXNoZWQgaXRzIGNoZWNrLiBUaGVzZSBpbmRpY2VzIGhhdmVcbiAgICogYWxyZWFkeSBiZWVuIGFkanVzdGVkIGZvciB0aGUgSEVBREVSX09GRlNFVC5cbiAgICpcbiAgICovXG4gIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBpbmRpY2VzIGZvciBjaGlsZCBkaXJlY3RpdmVzIHRoYXQgaGF2ZSBjb250ZW50IHF1ZXJpZXMuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGljZXNcbiAgICogT2RkIGluZGljZXM6IFN0YXJ0aW5nIGluZGV4IG9mIGNvbnRlbnQgcXVlcmllcyAoc3RvcmVkIGluIENPTlRFTlRfUVVFUklFUykgZm9yIHRoaXMgZGlyZWN0aXZlXG4gICAqL1xuICBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUm9vdENvbnRleHRGbGFncyB7RW1wdHkgPSAwYjAwLCBEZXRlY3RDaGFuZ2VzID0gMGIwMSwgRmx1c2hQbGF5ZXJzID0gMGIxMH1cblxuXG4vKipcbiAqIFJvb3RDb250ZXh0IGNvbnRhaW5zIGluZm9ybWF0aW9uIHdoaWNoIGlzIHNoYXJlZCBmb3IgYWxsIGNvbXBvbmVudHMgd2hpY2hcbiAqIHdlcmUgYm9vdHN0cmFwcGVkIHdpdGgge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm9vdENvbnRleHQge1xuICAvKipcbiAgICogQSBmdW5jdGlvbiB1c2VkIGZvciBzY2hlZHVsaW5nIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGZ1dHVyZS4gVXN1YWxseVxuICAgKiB0aGlzIGlzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICAgKi9cbiAgc2NoZWR1bGVyOiAod29ya0ZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkO1xuXG4gIC8qKlxuICAgKiBBIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiBhbGwgY29tcG9uZW50cyBhcmUgY29uc2lkZXJlZCBjbGVhbiAobm90IGRpcnR5KS5cbiAgICpcbiAgICogVGhpcyBwcm9taXNlIGlzIG92ZXJ3cml0dGVuIGV2ZXJ5IHRpbWUgYSBmaXJzdCBjYWxsIHRvIHtAbGluayBtYXJrRGlydHl9IGlzIGludm9rZWQuXG4gICAqL1xuICBjbGVhbjogUHJvbWlzZTxudWxsPjtcblxuICAvKipcbiAgICogUm9vdENvbXBvbmVudHMgLSBUaGUgY29tcG9uZW50cyB0aGF0IHdlcmUgaW5zdGFudGlhdGVkIGJ5IHRoZSBjYWxsIHRvXG4gICAqIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICAgKi9cbiAgY29tcG9uZW50czoge31bXTtcblxuICAvKipcbiAgICogVGhlIHBsYXllciBmbHVzaGluZyBoYW5kbGVyIHRvIGtpY2sgb2ZmIGFsbCBhbmltYXRpb25zXG4gICAqL1xuICBwbGF5ZXJIYW5kbGVyOiBQbGF5ZXJIYW5kbGVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFdoYXQgcmVuZGVyLXJlbGF0ZWQgb3BlcmF0aW9ucyB0byBydW4gb25jZSBhIHNjaGVkdWxlciBoYXMgYmVlbiBzZXRcbiAgICovXG4gIGZsYWdzOiBSb290Q29udGV4dEZsYWdzO1xufVxuXG4vKipcbiAqIEFycmF5IG9mIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICovXG5leHBvcnQgdHlwZSBIb29rRGF0YSA9IChudW1iZXIgfCAoKCkgPT4gdm9pZCkpW107XG5cbi8qKlxuICogU3RhdGljIGRhdGEgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdGFuY2Utc3BlY2lmaWMgZGF0YSBhcnJheSBvbiBhbiBMVmlldy5cbiAqXG4gKiBFYWNoIG5vZGUncyBzdGF0aWMgZGF0YSBpcyBzdG9yZWQgaW4gdERhdGEgYXQgdGhlIHNhbWUgaW5kZXggdGhhdCBpdCdzIHN0b3JlZFxuICogaW4gdGhlIGRhdGEgYXJyYXkuICBBbnkgbm9kZXMgdGhhdCBkbyBub3QgaGF2ZSBzdGF0aWMgZGF0YSBzdG9yZSBhIG51bGwgdmFsdWUgaW5cbiAqIHREYXRhIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5LlxuICpcbiAqIEVhY2ggcGlwZSdzIGRlZmluaXRpb24gaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHBpcGUgaW5zdGFuY2UgaW5cbiAqIHRoZSBkYXRhIGFycmF5LlxuICpcbiAqIEVhY2ggaG9zdCBwcm9wZXJ0eSdzIG5hbWUgaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHZhbHVlIGluIHRoZVxuICogZGF0YSBhcnJheS5cbiAqXG4gKiBFYWNoIHByb3BlcnR5IGJpbmRpbmcgbmFtZSBpcyBzdG9yZWQgaGVyZSBhdCB0aGUgc2FtZSBpbmRleCBhcyBpdHMgdmFsdWUgaW5cbiAqIHRoZSBkYXRhIGFycmF5LiBJZiB0aGUgYmluZGluZyBpcyBhbiBpbnRlcnBvbGF0aW9uLCB0aGUgc3RhdGljIHN0cmluZyB2YWx1ZXNcbiAqIGFyZSBzdG9yZWQgcGFyYWxsZWwgdG8gdGhlIGR5bmFtaWMgdmFsdWVzLiBFeGFtcGxlOlxuICpcbiAqIGlkPVwicHJlZml4IHt7IHYwIH19IGEge3sgdjEgfX0gYiB7eyB2MiB9fSBzdWZmaXhcIlxuICpcbiAqIExWaWV3ICAgICAgIHwgICBUVmlldy5kYXRhXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHYwIHZhbHVlICAgfCAgICdhJ1xuICogIHYxIHZhbHVlICAgfCAgICdiJ1xuICogIHYyIHZhbHVlICAgfCAgIGlkIO+/vSBwcmVmaXgg77+9IHN1ZmZpeFxuICpcbiAqIEluamVjdG9yIGJsb29tIGZpbHRlcnMgYXJlIGFsc28gc3RvcmVkIGhlcmUuXG4gKi9cbmV4cG9ydCB0eXBlIFREYXRhID1cbiAgICAoVE5vZGUgfCBQaXBlRGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnwgbnVtYmVyIHwgVHlwZTxhbnk+fFxuICAgICBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUSTE4biB8IEkxOG5VcGRhdGVPcENvZGVzIHwgbnVsbCB8IHN0cmluZylbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==