/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/interfaces/view.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
export const HOST = 0;
/** @type {?} */
export const TVIEW = 1;
/** @type {?} */
export const FLAGS = 2;
/** @type {?} */
export const PARENT = 3;
/** @type {?} */
export const NEXT = 4;
/** @type {?} */
export const QUERIES = 5;
/** @type {?} */
export const T_HOST = 6;
/** @type {?} */
export const CLEANUP = 7;
/** @type {?} */
export const CONTEXT = 8;
/** @type {?} */
export const INJECTOR = 9;
/** @type {?} */
export const RENDERER_FACTORY = 10;
/** @type {?} */
export const RENDERER = 11;
/** @type {?} */
export const SANITIZER = 12;
/** @type {?} */
export const CHILD_HEAD = 13;
/** @type {?} */
export const CHILD_TAIL = 14;
/** @type {?} */
export const DECLARATION_VIEW = 15;
/** @type {?} */
export const DECLARATION_COMPONENT_VIEW = 16;
/** @type {?} */
export const DECLARATION_LCONTAINER = 17;
/** @type {?} */
export const PREORDER_HOOK_FLAGS = 18;
/**
 * Size of LView's header. Necessary to adjust for it when setting slots.
 * @type {?}
 */
export const HEADER_OFFSET = 19;
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
    [HOST]: RElement|null;*/
    /* Skipping unnamed member:
    readonly[TVIEW]: TView;*/
    /* Skipping unnamed member:
    [FLAGS]: LViewFlags;*/
    /* Skipping unnamed member:
    [PARENT]: LView|LContainer|null;*/
    /* Skipping unnamed member:
    [NEXT]: LView|LContainer|null;*/
    /* Skipping unnamed member:
    [QUERIES]: LQueries|null;*/
    /* Skipping unnamed member:
    [T_HOST]: TViewNode|TElementNode|null;*/
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
    [CHILD_HEAD]: LView|LContainer|null;*/
    /* Skipping unnamed member:
    [CHILD_TAIL]: LView|LContainer|null;*/
    /* Skipping unnamed member:
    [DECLARATION_VIEW]: LView|null;*/
    /* Skipping unnamed member:
    [DECLARATION_COMPONENT_VIEW]: LView;*/
    /* Skipping unnamed member:
    [DECLARATION_LCONTAINER]: LContainer|null;*/
    /* Skipping unnamed member:
    [PREORDER_HOOK_FLAGS]: PreOrderHookFlags;*/
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
/** @enum {number} */
const PreOrderHookFlags = {
    /**
       The index of the next pre-order hook to be called in the hooks array, on the first 16
       bits
     */
    IndexOfTheNextPreOrderHookMaskMask: 65535,
    /**
     * The number of init hooks that have already been called, on the last 16 bits
     */
    NumberOfInitHooksCalledIncrementer: 65536,
    NumberOfInitHooksCalledShift: 16,
    NumberOfInitHooksCalledMask: 4294901760,
};
export { PreOrderHookFlags };
/**
 * Set of instructions used to process host bindings efficiently.
 *
 * See VIEW_DATA.md for more information.
 * @record
 */
export function ExpandoInstructions() { }
/** @enum {number} */
const TViewType = {
    /**
     * Root `TView` is the used to bootstrap components into. It is used in conjunction with
     * `LView` which takes an existing DOM node not owned by Angular and wraps it in `TView`/`LView`
     * so that other components can be loaded into it.
     */
    Root: 0,
    /**
     * `TView` associated with a Component. This would be the `TView` directly associated with the
     * component view (as opposed an `Embedded` `TView` which would be a child of `Component` `TView`)
     */
    Component: 1,
    /**
     * `TView` associated with a template. Such as `*ngIf`, `<ng-template>` etc... A `Component`
     * can have zero or more `Embedede` `TView`s.
     */
    Embedded: 2,
};
export { TViewType };
/**
 * The static data for an LView (shared between all templates of a
 * given type).
 *
 * Stored on the `ComponentDef.tView`.
 * @record
 */
export function TView() { }
if (false) {
    /**
     * Type of `TView` (`Root`|`Component`|`Embedded`).
     * @type {?}
     */
    TView.prototype.type;
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
     * Pointer to the host `TNode` (not part of this TView).
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
     * Whether or not this template has been processed in creation mode.
     * @type {?}
     */
    TView.prototype.firstCreatePass;
    /**
     *  Whether or not this template has been processed in update mode (e.g. change detected)
     *
     * `firstUpdatePass` is used by styling to set up `TData` to contain metadata about the styling
     * instructions. (Mainly to build up a linked list of styling priority order.)
     *
     * Typically this function gets cleared after first execution. If exception is thrown then this
     * flag can remain turned un until there is first successful (no exception) pass. This means that
     * individual styling instructions keep track of if they have already been added to the linked
     * list to prevent double adding.
     * @type {?}
     */
    TView.prototype.firstUpdatePass;
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
     *
     * -1 means that it has not been initialized.
     * @type {?}
     */
    TView.prototype.bindingStartIndex;
    /**
     * The index where the "expando" section of `LView` begins. The expando
     * section contains injectors, directive instances, and host binding values.
     * Unlike the "decls" and "vars" sections of `LView`, the length of this
     * section cannot be calculated at compile-time because directives are matched
     * at runtime to preserve locality.
     *
     * We store this start index so we know where to start checking host bindings
     * in `setHostBindings`.
     * @type {?}
     */
    TView.prototype.expandoStartIndex;
    /**
     * Whether or not there are any static view queries tracked on this view.
     *
     * We store this so we know whether or not we should do a view query
     * refresh after creation mode to collect static query results.
     * @type {?}
     */
    TView.prototype.staticViewQueries;
    /**
     * Whether or not there are any static content queries tracked on this view.
     *
     * We store this so we know whether or not we should do a content query
     * refresh after creation mode to collect static query results.
     * @type {?}
     */
    TView.prototype.staticContentQueries;
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
     * Array of ngOnInit, ngOnChanges and ngDoCheck hooks that should be executed for this view in
     * creation mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.preOrderHooks;
    /**
     * Array of ngOnChanges and ngDoCheck hooks that should be executed for this view in update mode.
     *
     * Even indices: Directive index
     * Odd indices: Hook function
     * @type {?}
     */
    TView.prototype.preOrderCheckHooks;
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
     * A collection of queries tracked in a given view.
     * @type {?}
     */
    TView.prototype.queries;
    /**
     * An array of indices pointing to directives with content queries alongside with the
     * corresponding
     * query index. Each entry in this array is a tuple of:
     * - index of the first content query index declared by a given directive;
     * - index of a directive.
     *
     * We are storing those indexes so we can refresh content queries as part of a view refresh
     * process.
     * @type {?}
     */
    TView.prototype.contentQueries;
    /**
     * Set of schemas that declare elements to be allowed inside the view.
     * @type {?}
     */
    TView.prototype.schemas;
    /**
     * Array of constants for the view. Includes attribute arrays, local definition arrays etc.
     * Used for directive matching, attribute bindings, local definitions and more.
     * @type {?}
     */
    TView.prototype.consts;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkEsTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDOztBQUNyQixNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUM7O0FBQ3RCLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sSUFBSSxHQUFHLENBQUM7O0FBQ3JCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sT0FBTyxHQUFHLENBQUM7O0FBQ3hCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLFFBQVEsR0FBRyxDQUFDOztBQUN6QixNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsRUFBRTs7QUFDbEMsTUFBTSxPQUFPLFFBQVEsR0FBRyxFQUFFOztBQUMxQixNQUFNLE9BQU8sU0FBUyxHQUFHLEVBQUU7O0FBQzNCLE1BQU0sT0FBTyxVQUFVLEdBQUcsRUFBRTs7QUFDNUIsTUFBTSxPQUFPLFVBQVUsR0FBRyxFQUFFOztBQUM1QixNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsRUFBRTs7QUFDbEMsTUFBTSxPQUFPLDBCQUEwQixHQUFHLEVBQUU7O0FBQzVDLE1BQU0sT0FBTyxzQkFBc0IsR0FBRyxFQUFFOztBQUN4QyxNQUFNLE9BQU8sbUJBQW1CLEdBQUcsRUFBRTs7Ozs7QUFFckMsTUFBTSxPQUFPLGFBQWEsR0FBRyxFQUFFOzs7O0FBTS9CLHFDQUVDOzs7SUFEQyxvQ0FBaUU7Ozs7Ozs7Ozs7Ozs7QUFjbkUsMkJBdU5DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHRCxNQUFrQixVQUFVO0lBQzFCLHNEQUFzRDtJQUN0RCx5QkFBeUIsR0FBZ0I7SUFDekMsa0JBQWtCLEdBQWdCO0lBRWxDOzs7Ozs7O09BT0c7SUFDSCxZQUFZLEdBQWdCO0lBRTVCOzs7Ozs7T0FNRztJQUNILGNBQWMsR0FBZ0I7SUFFOUIsd0ZBQXdGO0lBQ3hGLFdBQVcsSUFBZ0I7SUFFM0I7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxZQUFZLElBQWdCO0lBRTVCLGtFQUFrRTtJQUNsRSxLQUFLLElBQWlCO0lBRXRCLCtFQUErRTtJQUMvRSxRQUFRLEtBQWlCO0lBRXpCLDZDQUE2QztJQUM3QyxTQUFTLEtBQWlCO0lBRTFCLGdEQUFnRDtJQUNoRCxNQUFNLEtBQWlCO0lBRXZCOztPQUVHO0lBQ0gsK0JBQStCLE1BQWlCO0lBQ2hELHlCQUF5QixJQUFLO0lBQzlCLHlCQUF5QixNQUFpQjtFQUMzQzs7O0FBU0QsTUFBa0IsY0FBYztJQUM5QixrQkFBa0IsR0FBTztJQUN6Qiw0QkFBNEIsR0FBTztJQUNuQyx5QkFBeUIsR0FBTztJQUNoQyxrQkFBa0IsR0FBTztFQUMxQjs7O0FBR0QsTUFBa0IsaUJBQWlCO0lBQ2pDOzs7T0FHRztJQUNILGtDQUFrQyxPQUFzQjtJQUV4RDs7T0FFRztJQUNILGtDQUFrQyxPQUF1QjtJQUN6RCw0QkFBNEIsSUFBSztJQUNqQywyQkFBMkIsWUFBcUM7RUFDakU7Ozs7Ozs7O0FBT0QseUNBQTRGOztBQVU1RixNQUFrQixTQUFTO0lBQ3pCOzs7O09BSUc7SUFDSCxJQUFJLEdBQUk7SUFFUjs7O09BR0c7SUFDSCxTQUFTLEdBQUk7SUFFYjs7O09BR0c7SUFDSCxRQUFRLEdBQUk7RUFDYjs7Ozs7Ozs7O0FBUUQsMkJBdVFDOzs7Ozs7SUFuUUMscUJBQWdCOzs7Ozs7Ozs7SUFTaEIsbUJBQW9COzs7Ozs7SUFNcEIsMEJBQWlCOzs7Ozs7SUFNakIseUJBQXFDOzs7OztJQUtyQywwQkFBd0M7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJ4QyxxQkFBa0M7Ozs7O0lBR2xDLGdDQUF5Qjs7Ozs7Ozs7Ozs7OztJQWF6QixnQ0FBeUI7Ozs7O0lBR3pCLHFCQUFZOzs7Ozs7Ozs7O0lBVVosa0NBQTBCOzs7Ozs7Ozs7Ozs7SUFZMUIsa0NBQTBCOzs7Ozs7OztJQVExQixrQ0FBMkI7Ozs7Ozs7O0lBUTNCLHFDQUE4Qjs7Ozs7SUFLOUIsMkJBQXVCOzs7Ozs7O0lBU3ZCLG9DQUE4Qzs7Ozs7Ozs7SUFROUMsa0NBQXlDOzs7Ozs7Ozs7OztJQVd6Qyw2QkFBK0I7Ozs7Ozs7OztJQVMvQiw4QkFBNkI7Ozs7Ozs7O0lBUTdCLG1DQUFrQzs7Ozs7Ozs7O0lBU2xDLDZCQUE0Qjs7Ozs7Ozs7O0lBUzVCLGtDQUFpQzs7Ozs7Ozs7O0lBU2pDLDBCQUF5Qjs7Ozs7Ozs7O0lBU3pCLCtCQUE4Qjs7Ozs7Ozs7SUFROUIsNkJBQW1DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBNEJuQyx3QkFBb0I7Ozs7Ozs7O0lBUXBCLDJCQUEwQjs7Ozs7SUFLMUIsd0JBQXVCOzs7Ozs7Ozs7Ozs7SUFZdkIsK0JBQThCOzs7OztJQUs5Qix3QkFBK0I7Ozs7OztJQU0vQix1QkFBd0I7OztBQUcxQixNQUFrQixnQkFBZ0I7SUFBRSxLQUFLLEdBQU8sRUFBRSxhQUFhLEdBQU8sRUFBRSxZQUFZLEdBQU87RUFBQzs7Ozs7OztBQU81RixpQ0E2QkM7Ozs7Ozs7SUF4QkMsZ0NBQXdDOzs7Ozs7O0lBT3hDLDRCQUFxQjs7Ozs7O0lBTXJCLGlDQUFpQjs7Ozs7SUFLakIsb0NBQWtDOzs7OztJQUtsQyw0QkFBd0I7Ozs7O0FBK0UxQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuXG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgUGlwZURlZiwgUGlwZURlZkxpc3QsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0kxOG5VcGRhdGVPcENvZGVzLCBUSTE4bn0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7VENvbnN0YW50cywgVEVsZW1lbnROb2RlLCBUTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge0xRdWVyaWVzLCBUUXVlcmllc30gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTN9IGZyb20gJy4vcmVuZGVyZXInO1xuaW1wb3J0IHtUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi9zdHlsaW5nJztcblxuXG5cbi8vIEJlbG93IGFyZSBjb25zdGFudHMgZm9yIExWaWV3IGluZGljZXMgdG8gaGVscCB1cyBsb29rIHVwIExWaWV3IG1lbWJlcnNcbi8vIHdpdGhvdXQgaGF2aW5nIHRvIHJlbWVtYmVyIHRoZSBzcGVjaWZpYyBpbmRpY2VzLlxuLy8gVWdsaWZ5IHdpbGwgaW5saW5lIHRoZXNlIHdoZW4gbWluaWZ5aW5nIHNvIHRoZXJlIHNob3VsZG4ndCBiZSBhIGNvc3QuXG5leHBvcnQgY29uc3QgSE9TVCA9IDA7XG5leHBvcnQgY29uc3QgVFZJRVcgPSAxO1xuZXhwb3J0IGNvbnN0IEZMQUdTID0gMjtcbmV4cG9ydCBjb25zdCBQQVJFTlQgPSAzO1xuZXhwb3J0IGNvbnN0IE5FWFQgPSA0O1xuZXhwb3J0IGNvbnN0IFFVRVJJRVMgPSA1O1xuZXhwb3J0IGNvbnN0IFRfSE9TVCA9IDY7XG5leHBvcnQgY29uc3QgQ0xFQU5VUCA9IDc7XG5leHBvcnQgY29uc3QgQ09OVEVYVCA9IDg7XG5leHBvcnQgY29uc3QgSU5KRUNUT1IgPSA5O1xuZXhwb3J0IGNvbnN0IFJFTkRFUkVSX0ZBQ1RPUlkgPSAxMDtcbmV4cG9ydCBjb25zdCBSRU5ERVJFUiA9IDExO1xuZXhwb3J0IGNvbnN0IFNBTklUSVpFUiA9IDEyO1xuZXhwb3J0IGNvbnN0IENISUxEX0hFQUQgPSAxMztcbmV4cG9ydCBjb25zdCBDSElMRF9UQUlMID0gMTQ7XG5leHBvcnQgY29uc3QgREVDTEFSQVRJT05fVklFVyA9IDE1O1xuZXhwb3J0IGNvbnN0IERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXID0gMTY7XG5leHBvcnQgY29uc3QgREVDTEFSQVRJT05fTENPTlRBSU5FUiA9IDE3O1xuZXhwb3J0IGNvbnN0IFBSRU9SREVSX0hPT0tfRkxBR1MgPSAxODtcbi8qKiBTaXplIG9mIExWaWV3J3MgaGVhZGVyLiBOZWNlc3NhcnkgdG8gYWRqdXN0IGZvciBpdCB3aGVuIHNldHRpbmcgc2xvdHMuICAqL1xuZXhwb3J0IGNvbnN0IEhFQURFUl9PRkZTRVQgPSAxOTtcblxuXG4vLyBUaGlzIGludGVyZmFjZSByZXBsYWNlcyB0aGUgcmVhbCBMVmlldyBpbnRlcmZhY2UgaWYgaXQgaXMgYW4gYXJnIG9yIGFcbi8vIHJldHVybiB2YWx1ZSBvZiBhIHB1YmxpYyBpbnN0cnVjdGlvbi4gVGhpcyBlbnN1cmVzIHdlIGRvbid0IG5lZWQgdG8gZXhwb3NlXG4vLyB0aGUgYWN0dWFsIGludGVyZmFjZSwgd2hpY2ggc2hvdWxkIGJlIGtlcHQgcHJpdmF0ZS5cbmV4cG9ydCBpbnRlcmZhY2UgT3BhcXVlVmlld1N0YXRlIHtcbiAgJ19fYnJhbmRfXyc6ICdCcmFuZCBmb3IgT3BhcXVlVmlld1N0YXRlIHRoYXQgbm90aGluZyB3aWxsIG1hdGNoJztcbn1cblxuXG4vKipcbiAqIGBMVmlld2Agc3RvcmVzIGFsbCBvZiB0aGUgaW5mb3JtYXRpb24gbmVlZGVkIHRvIHByb2Nlc3MgdGhlIGluc3RydWN0aW9ucyBhc1xuICogdGhleSBhcmUgaW52b2tlZCBmcm9tIHRoZSB0ZW1wbGF0ZS4gRWFjaCBlbWJlZGRlZCB2aWV3IGFuZCBjb21wb25lbnQgdmlldyBoYXMgaXRzXG4gKiBvd24gYExWaWV3YC4gV2hlbiBwcm9jZXNzaW5nIGEgcGFydGljdWxhciB2aWV3LCB3ZSBzZXQgdGhlIGB2aWV3RGF0YWAgdG8gdGhhdFxuICogYExWaWV3YC4gV2hlbiB0aGF0IHZpZXcgaXMgZG9uZSBwcm9jZXNzaW5nLCB0aGUgYHZpZXdEYXRhYCBpcyBzZXQgYmFjayB0b1xuICogd2hhdGV2ZXIgdGhlIG9yaWdpbmFsIGB2aWV3RGF0YWAgd2FzIGJlZm9yZSAodGhlIHBhcmVudCBgTFZpZXdgKS5cbiAqXG4gKiBLZWVwaW5nIHNlcGFyYXRlIHN0YXRlIGZvciBlYWNoIHZpZXcgZmFjaWxpdGllcyB2aWV3IGluc2VydGlvbiAvIGRlbGV0aW9uLCBzbyB3ZVxuICogZG9uJ3QgaGF2ZSB0byBlZGl0IHRoZSBkYXRhIGFycmF5IGJhc2VkIG9uIHdoaWNoIHZpZXdzIGFyZSBwcmVzZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExWaWV3IGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gIC8qKlxuICAgKiBUaGUgaG9zdCBub2RlIGZvciB0aGlzIExWaWV3IGluc3RhbmNlLCBpZiB0aGlzIGlzIGEgY29tcG9uZW50IHZpZXcuXG4gICAqIElmIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldywgSE9TVCB3aWxsIGJlIG51bGwuXG4gICAqL1xuICBbSE9TVF06IFJFbGVtZW50fG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyB2aWV3LiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoaXMgc28gd2UgY2FuIGVhc2lseSB3YWxrIHVwIHRoZVxuICAgKiBub2RlIHRyZWUgaW4gREkgYW5kIGdldCB0aGUgVFZpZXcuZGF0YSBhcnJheSBhc3NvY2lhdGVkIHdpdGggYSBub2RlICh3aGVyZSB0aGVcbiAgICogZGlyZWN0aXZlIGRlZnMgYXJlIHN0b3JlZCkuXG4gICAqL1xuICByZWFkb25seVtUVklFV106IFRWaWV3O1xuXG4gIC8qKiBGbGFncyBmb3IgdGhpcyB2aWV3LiBTZWUgTFZpZXdGbGFncyBmb3IgbW9yZSBpbmZvLiAqL1xuICBbRkxBR1NdOiBMVmlld0ZsYWdzO1xuXG4gIC8qKlxuICAgKiBUaGlzIG1heSBzdG9yZSBhbiB7QGxpbmsgTFZpZXd9IG9yIHtAbGluayBMQ29udGFpbmVyfS5cbiAgICpcbiAgICogYExWaWV3YCAtIFRoZSBwYXJlbnQgdmlldy4gVGhpcyBpcyBuZWVkZWQgd2hlbiB3ZSBleGl0IHRoZSB2aWV3IGFuZCBtdXN0IHJlc3RvcmUgdGhlIHByZXZpb3VzXG4gICAqIExWaWV3LiBXaXRob3V0IHRoaXMsIHRoZSByZW5kZXIgbWV0aG9kIHdvdWxkIGhhdmUgdG8ga2VlcCBhIHN0YWNrIG9mXG4gICAqIHZpZXdzIGFzIGl0IGlzIHJlY3Vyc2l2ZWx5IHJlbmRlcmluZyB0ZW1wbGF0ZXMuXG4gICAqXG4gICAqIGBMQ29udGFpbmVyYCAtIFRoZSBjdXJyZW50IHZpZXcgaXMgcGFydCBvZiBhIGNvbnRhaW5lciwgYW5kIGlzIGFuIGVtYmVkZGVkIHZpZXcuXG4gICAqL1xuICBbUEFSRU5UXTogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKlxuICAgKiBUaGUgbmV4dCBzaWJsaW5nIExWaWV3IG9yIExDb250YWluZXIuXG4gICAqXG4gICAqIEFsbG93cyB1cyB0byBwcm9wYWdhdGUgYmV0d2VlbiBzaWJsaW5nIHZpZXcgc3RhdGVzIHRoYXQgYXJlbid0IGluIHRoZSBzYW1lXG4gICAqIGNvbnRhaW5lci4gRW1iZWRkZWQgdmlld3MgYWxyZWFkeSBoYXZlIGEgbm9kZS5uZXh0LCBidXQgaXQgaXMgb25seSBzZXQgZm9yXG4gICAqIHZpZXdzIGluIHRoZSBzYW1lIGNvbnRhaW5lci4gV2UgbmVlZCBhIHdheSB0byBsaW5rIGNvbXBvbmVudCB2aWV3cyBhbmQgdmlld3NcbiAgICogYWNyb3NzIGNvbnRhaW5lcnMgYXMgd2VsbC5cbiAgICovXG4gIFtORVhUXTogTFZpZXd8TENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKiBRdWVyaWVzIGFjdGl2ZSBmb3IgdGhpcyB2aWV3IC0gbm9kZXMgZnJvbSBhIHZpZXcgYXJlIHJlcG9ydGVkIHRvIHRob3NlIHF1ZXJpZXMuICovXG4gIFtRVUVSSUVTXTogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgYFRWaWV3Tm9kZWAgb3IgYFRFbGVtZW50Tm9kZWAgd2hpY2ggcmVwcmVzZW50cyB0aGUgcm9vdCBvZiB0aGUgdmlldy5cbiAgICpcbiAgICogSWYgYFRWaWV3Tm9kZWAsIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiBhIGNvbnRhaW5lci4gV2UgbmVlZCB0aGlzIHRvIGJlIGFibGUgdG9cbiAgICogZWZmaWNpZW50bHkgZmluZCB0aGUgYExWaWV3Tm9kZWAgd2hlbiBpbnNlcnRpbmcgdGhlIHZpZXcgaW50byBhbiBhbmNob3IuXG4gICAqXG4gICAqIElmIGBURWxlbWVudE5vZGVgLCB0aGlzIGlzIHRoZSBMVmlldyBvZiBhIGNvbXBvbmVudC5cbiAgICpcbiAgICogSWYgbnVsbCwgdGhpcyBpcyB0aGUgcm9vdCB2aWV3IG9mIGFuIGFwcGxpY2F0aW9uIChyb290IGNvbXBvbmVudCBpcyBpbiB0aGlzIHZpZXcpLlxuICAgKi9cbiAgW1RfSE9TVF06IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogV2hlbiBhIHZpZXcgaXMgZGVzdHJveWVkLCBsaXN0ZW5lcnMgbmVlZCB0byBiZSByZWxlYXNlZCBhbmQgb3V0cHV0cyBuZWVkIHRvIGJlXG4gICAqIHVuc3Vic2NyaWJlZC4gVGhpcyBjb250ZXh0IGFycmF5IHN0b3JlcyBib3RoIGxpc3RlbmVyIGZ1bmN0aW9ucyB3cmFwcGVkIHdpdGhcbiAgICogdGhlaXIgY29udGV4dCBhbmQgb3V0cHV0IHN1YnNjcmlwdGlvbiBpbnN0YW5jZXMgZm9yIGEgcGFydGljdWxhciB2aWV3LlxuICAgKlxuICAgKiBUaGVzZSBjaGFuZ2UgcGVyIExWaWV3IGluc3RhbmNlLCBzbyB0aGV5IGNhbm5vdCBiZSBzdG9yZWQgb24gVFZpZXcuIEluc3RlYWQsXG4gICAqIFRWaWV3LmNsZWFudXAgc2F2ZXMgYW4gaW5kZXggdG8gdGhlIG5lY2Vzc2FyeSBjb250ZXh0IGluIHRoaXMgYXJyYXkuXG4gICAqL1xuICAvLyBUT0RPOiBmbGF0dGVuIGludG8gTFZpZXdbXVxuICBbQ0xFQU5VUF06IGFueVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIC0gRm9yIGR5bmFtaWMgdmlld3MsIHRoaXMgaXMgdGhlIGNvbnRleHQgd2l0aCB3aGljaCB0byByZW5kZXIgdGhlIHRlbXBsYXRlIChlLmcuXG4gICAqICAgYE5nRm9yQ29udGV4dGApLCBvciBge31gIGlmIG5vdCBkZWZpbmVkIGV4cGxpY2l0bHkuXG4gICAqIC0gRm9yIHJvb3QgdmlldyBvZiB0aGUgcm9vdCBjb21wb25lbnQgdGhlIGNvbnRleHQgY29udGFpbnMgY2hhbmdlIGRldGVjdGlvbiBkYXRhLlxuICAgKiAtIEZvciBub24tcm9vdCBjb21wb25lbnRzLCB0aGUgY29udGV4dCBpcyB0aGUgY29tcG9uZW50IGluc3RhbmNlLFxuICAgKiAtIEZvciBpbmxpbmUgdmlld3MsIHRoZSBjb250ZXh0IGlzIG51bGwuXG4gICAqL1xuICBbQ09OVEVYVF06IHt9fFJvb3RDb250ZXh0fG51bGw7XG5cbiAgLyoqIEFuIG9wdGlvbmFsIE1vZHVsZSBJbmplY3RvciB0byBiZSB1c2VkIGFzIGZhbGwgYmFjayBhZnRlciBFbGVtZW50IEluamVjdG9ycyBhcmUgY29uc3VsdGVkLiAqL1xuICByZWFkb25seVtJTkpFQ1RPUl06IEluamVjdG9yfG51bGw7XG5cbiAgLyoqIEZhY3RvcnkgdG8gYmUgdXNlZCBmb3IgY3JlYXRpbmcgUmVuZGVyZXIuICovXG4gIFtSRU5ERVJFUl9GQUNUT1JZXTogUmVuZGVyZXJGYWN0b3J5MztcblxuICAvKiogUmVuZGVyZXIgdG8gYmUgdXNlZCBmb3IgdGhpcyB2aWV3LiAqL1xuICBbUkVOREVSRVJdOiBSZW5kZXJlcjM7XG5cbiAgLyoqIEFuIG9wdGlvbmFsIGN1c3RvbSBzYW5pdGl6ZXIuICovXG4gIFtTQU5JVElaRVJdOiBTYW5pdGl6ZXJ8bnVsbDtcblxuICAvKipcbiAgICogUmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBMVmlldyBvciBMQ29udGFpbmVyIGJlbmVhdGggdGhpcyBMVmlldyBpblxuICAgKiB0aGUgaGllcmFyY2h5LlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3RvcmUgdGhpcyBzbyB2aWV3cyBjYW4gdHJhdmVyc2UgdGhyb3VnaCB0aGVpciBuZXN0ZWQgdmlld3NcbiAgICogdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICAgKi9cbiAgW0NISUxEX0hFQURdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIFRoZSB0YWlsIGFsbG93cyB1cyB0byBxdWlja2x5IGFkZCBhIG5ldyBzdGF0ZSB0byB0aGUgZW5kIG9mIHRoZSB2aWV3IGxpc3RcbiAgICogd2l0aG91dCBoYXZpbmcgdG8gcHJvcGFnYXRlIHN0YXJ0aW5nIGZyb20gdGhlIGZpcnN0IGNoaWxkLlxuICAgKi9cbiAgW0NISUxEX1RBSUxdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIFZpZXcgd2hlcmUgdGhpcyB2aWV3J3MgdGVtcGxhdGUgd2FzIGRlY2xhcmVkLlxuICAgKlxuICAgKiBPbmx5IGFwcGxpY2FibGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuIFdpbGwgYmUgbnVsbCBmb3IgaW5saW5lL2NvbXBvbmVudCB2aWV3cy5cbiAgICpcbiAgICogVGhlIHRlbXBsYXRlIGZvciBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBtYXkgYmUgZGVjbGFyZWQgaW4gYSBkaWZmZXJlbnQgdmlldyB0aGFuXG4gICAqIGl0IGlzIGluc2VydGVkLiBXZSBhbHJlYWR5IHRyYWNrIHRoZSBcImluc2VydGlvbiB2aWV3XCIgKHZpZXcgd2hlcmUgdGhlIHRlbXBsYXRlIHdhc1xuICAgKiBpbnNlcnRlZCkgaW4gTFZpZXdbUEFSRU5UXSwgYnV0IHdlIGFsc28gbmVlZCBhY2Nlc3MgdG8gdGhlIFwiZGVjbGFyYXRpb24gdmlld1wiXG4gICAqICh2aWV3IHdoZXJlIHRoZSB0ZW1wbGF0ZSB3YXMgZGVjbGFyZWQpLiBPdGhlcndpc2UsIHdlIHdvdWxkbid0IGJlIGFibGUgdG8gY2FsbCB0aGVcbiAgICogdmlldydzIHRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIHByb3BlciBjb250ZXh0cy4gQ29udGV4dCBzaG91bGQgYmUgaW5oZXJpdGVkIGZyb21cbiAgICogdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSwgbm90IHRoZSBpbnNlcnRpb24gdmlldyB0cmVlLlxuICAgKlxuICAgKiBFeGFtcGxlIChBcHBDb21wb25lbnQgdGVtcGxhdGUpOlxuICAgKlxuICAgKiA8bmctdGVtcGxhdGUgI2Zvbz48L25nLXRlbXBsYXRlPiAgICAgICA8LS0gZGVjbGFyZWQgaGVyZSAtLT5cbiAgICogPHNvbWUtY29tcCBbdHBsXT1cImZvb1wiPjwvc29tZS1jb21wPiAgICA8LS0gaW5zZXJ0ZWQgaW5zaWRlIHRoaXMgY29tcG9uZW50IC0tPlxuICAgKlxuICAgKiBUaGUgPG5nLXRlbXBsYXRlPiBhYm92ZSBpcyBkZWNsYXJlZCBpbiB0aGUgQXBwQ29tcG9uZW50IHRlbXBsYXRlLCBidXQgaXQgd2lsbCBiZSBwYXNzZWQgaW50b1xuICAgKiBTb21lQ29tcCBhbmQgaW5zZXJ0ZWQgdGhlcmUuIEluIHRoaXMgY2FzZSwgdGhlIGRlY2xhcmF0aW9uIHZpZXcgd291bGQgYmUgdGhlIEFwcENvbXBvbmVudCxcbiAgICogYnV0IHRoZSBpbnNlcnRpb24gdmlldyB3b3VsZCBiZSBTb21lQ29tcC4gV2hlbiB3ZSBhcmUgcmVtb3Zpbmcgdmlld3MsIHdlIHdvdWxkIHdhbnQgdG9cbiAgICogdHJhdmVyc2UgdGhyb3VnaCB0aGUgaW5zZXJ0aW9uIHZpZXcgdG8gY2xlYW4gdXAgbGlzdGVuZXJzLiBXaGVuIHdlIGFyZSBjYWxsaW5nIHRoZVxuICAgKiB0ZW1wbGF0ZSBmdW5jdGlvbiBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgd2UgbmVlZCB0aGUgZGVjbGFyYXRpb24gdmlldyB0byBnZXQgaW5oZXJpdGVkXG4gICAqIGNvbnRleHQuXG4gICAqL1xuICBbREVDTEFSQVRJT05fVklFV106IExWaWV3fG51bGw7XG5cblxuICAvKipcbiAgICogUG9pbnRzIHRvIHRoZSBkZWNsYXJhdGlvbiBjb21wb25lbnQgdmlldywgdXNlZCB0byB0cmFjayB0cmFuc3BsYW50ZWQgYExWaWV3YHMuXG4gICAqXG4gICAqIFNlZTogYERFQ0xBUkFUSU9OX1ZJRVdgIHdoaWNoIHBvaW50cyB0byB0aGUgYWN0dWFsIGBMVmlld2Agd2hlcmUgaXQgd2FzIGRlY2xhcmVkLCB3aGVyZWFzXG4gICAqIGBERUNMQVJBVElPTl9DT01QT05FTlRfVklFV2AgcG9pbnRzIHRvIHRoZSBjb21wb25lbnQgd2hpY2ggbWF5IG5vdCBiZSBzYW1lIGFzXG4gICAqIGBERUNMQVJBVElPTl9WSUVXYC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIDwjVklFVyAjbXlDb21wPlxuICAgKiAgPGRpdiAqbmdJZj1cInRydWVcIj5cbiAgICogICA8bmctdGVtcGxhdGUgI215VG1wbD4uLi48L25nLXRlbXBsYXRlPlxuICAgKiAgPC9kaXY+XG4gICAqIDwvI1ZJRVc+XG4gICAqIGBgYFxuICAgKiBJbiB0aGUgYWJvdmUgY2FzZSBgREVDTEFSQVRJT05fVklFV2AgZm9yIGBteVRtcGxgIHBvaW50cyB0byB0aGUgYExWaWV3YCBvZiBgbmdJZmAgd2hlcmVhc1xuICAgKiBgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVdgIHBvaW50cyB0byBgTFZpZXdgIG9mIHRoZSBgbXlDb21wYCB3aGljaCBvd25zIHRoZSB0ZW1wbGF0ZS5cbiAgICpcbiAgICogVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IGFsbCBlbWJlZGRlZCB2aWV3cyBhcmUgYWx3YXlzIGNoZWNrLWFsd2F5cyB3aGVyZWFzIHRoZSBjb21wb25lbnRcbiAgICogdmlldyBjYW4gYmUgY2hlY2stYWx3YXlzIG9yIG9uLXB1c2guIFdoZW4gd2UgaGF2ZSBhIHRyYW5zcGxhbnRlZCB2aWV3IGl0IGlzIGltcG9ydGFudCB0b1xuICAgKiBkZXRlcm1pbmUgaWYgd2UgaGF2ZSB0cmFuc3BsYW50ZWQgYSB2aWV3IGZyb20gY2hlY2stYWx3YXlzIGRlY2xhcmF0aW9uIHRvIG9uLXB1c2ggaW5zZXJ0aW9uXG4gICAqIHBvaW50LiBJbiBzdWNoIGEgY2FzZSB0aGUgdHJhbnNwbGFudGVkIHZpZXcgbmVlZHMgdG8gYmUgYWRkZWQgdG8gdGhlIGBMQ29udGFpbmVyYCBpbiB0aGVcbiAgICogZGVjbGFyZWQgYExWaWV3YCBhbmQgQ0QgZHVyaW5nIHRoZSBkZWNsYXJlZCB2aWV3IENEIChpbiBhZGRpdGlvbiB0byB0aGUgQ0QgYXQgdGhlIGluc2VydGlvblxuICAgKiBwb2ludC4pIChBbnkgdHJhbnNwbGFudGVkIHZpZXdzIHdoaWNoIGFyZSBpbnRyYSBDb21wb25lbnQgYXJlIG9mIG5vIGludGVyZXN0IGJlY2F1c2UgdGhlIENEXG4gICAqIHN0cmF0ZWd5IG9mIGRlY2xhcmF0aW9uIGFuZCBpbnNlcnRpb24gd2lsbCBhbHdheXMgYmUgdGhlIHNhbWUsIGJlY2F1c2UgaXQgaXMgdGhlIHNhbWVcbiAgICogY29tcG9uZW50LilcbiAgICpcbiAgICogUXVlcmllcyBhbHJlYWR5IHRyYWNrIG1vdmVkIHZpZXdzIGluIGBMVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXWAgYW5kXG4gICAqIGBMQ29udGFpbmVyW01PVkVEX1ZJRVdTXWAuIEhvd2V2ZXIgdGhlIHF1ZXJpZXMgYWxzbyB0cmFjayBgTFZpZXdgcyB3aGljaCBtb3ZlZCB3aXRoaW4gdGhlIHNhbWVcbiAgICogY29tcG9uZW50IGBMVmlld2AuIFRyYW5zcGxhbnRlZCB2aWV3cyBhcmUgYSBzdWJzZXQgb2YgbW92ZWQgdmlld3MsIGFuZCB3ZSB1c2VcbiAgICogYERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXYCB0byBkaWZmZXJlbnRpYXRlIHRoZW0uIEFzIGluIHRoaXMgZXhhbXBsZS5cbiAgICpcbiAgICogRXhhbXBsZSBzaG93aW5nIGludHJhIGNvbXBvbmVudCBgTFZpZXdgIG1vdmVtZW50LlxuICAgKiBgYGBcbiAgICogPCNWSUVXICNteUNvbXA+XG4gICAqICAgPGRpdiAqbmdJZj1cImNvbmRpdGlvbjsgdGhlbiB0aGVuQmxvY2sgZWxzZSBlbHNlQmxvY2tcIj48L2Rpdj5cbiAgICogICA8bmctdGVtcGxhdGUgI3RoZW5CbG9jaz5Db250ZW50IHRvIHJlbmRlciB3aGVuIGNvbmRpdGlvbiBpcyB0cnVlLjwvbmctdGVtcGxhdGU+XG4gICAqICAgPG5nLXRlbXBsYXRlICNlbHNlQmxvY2s+Q29udGVudCB0byByZW5kZXIgd2hlbiBjb25kaXRpb24gaXMgZmFsc2UuPC9uZy10ZW1wbGF0ZT5cbiAgICogPC8jVklFVz5cbiAgICogYGBgXG4gICAqIFRoZSBgdGhlbkJsb2NrYCBhbmQgYGVsc2VCbG9ja2AgaXMgbW92ZWQgYnV0IG5vdCB0cmFuc3BsYW50ZWQuXG4gICAqXG4gICAqIEV4YW1wbGUgc2hvd2luZyBpbnRlciBjb21wb25lbnQgYExWaWV3YCBtb3ZlbWVudCAodHJhbnNwbGFudGVkIHZpZXcpLlxuICAgKiBgYGBcbiAgICogPCNWSUVXICNteUNvbXA+XG4gICAqICAgPG5nLXRlbXBsYXRlICNteVRtcGw+Li4uPC9uZy10ZW1wbGF0ZT5cbiAgICogICA8aW5zZXJ0aW9uLWNvbXBvbmVudCBbdGVtcGxhdGVdPVwibXlUbXBsXCI+PC9pbnNlcnRpb24tY29tcG9uZW50PlxuICAgKiA8LyNWSUVXPlxuICAgKiBgYGBcbiAgICogSW4gdGhlIGFib3ZlIGV4YW1wbGUgYG15VG1wbGAgaXMgcGFzc2VkIGludG8gYSBkaWZmZXJlbnQgY29tcG9uZW50LiBJZiBgaW5zZXJ0aW9uLWNvbXBvbmVudGBcbiAgICogaW5zdGFudGlhdGVzIGBteVRtcGxgIGFuZCBgaW5zZXJ0aW9uLWNvbXBvbmVudGAgaXMgb24tcHVzaCB0aGVuIHRoZSBgTENvbnRhaW5lcmAgbmVlZHMgdG8gYmVcbiAgICogbWFya2VkIGFzIGNvbnRhaW5pbmcgdHJhbnNwbGFudGVkIHZpZXdzIGFuZCB0aG9zZSB2aWV3cyBuZWVkIHRvIGJlIENEIGFzIHBhcnQgb2YgdGhlXG4gICAqIGRlY2xhcmF0aW9uIENELlxuICAgKlxuICAgKlxuICAgKiBXaGVuIGNoYW5nZSBkZXRlY3Rpb24gcnVucywgaXQgaXRlcmF0ZXMgb3ZlciBgW01PVkVEX1ZJRVdTXWAgYW5kIENEcyBhbnkgY2hpbGQgYExWaWV3YHMgd2hlcmVcbiAgICogdGhlIGBERUNMQVJBVElPTl9DT01QT05FTlRfVklFV2Agb2YgdGhlIGN1cnJlbnQgY29tcG9uZW50IGFuZCB0aGUgY2hpbGQgYExWaWV3YCBkb2VzIG5vdCBtYXRjaFxuICAgKiAoaXQgaGFzIGJlZW4gdHJhbnNwbGFudGVkIGFjcm9zcyBjb21wb25lbnRzLilcbiAgICpcbiAgICogTm90ZTogYFtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11gIHBvaW50cyB0byBpdHNlbGYgaWYgdGhlIExWaWV3IGlzIGEgY29tcG9uZW50IHZpZXcgKHRoZVxuICAgKiAgICAgICBzaW1wbGVzdCAvIG1vc3QgY29tbW9uIGNhc2UpLlxuICAgKlxuICAgKiBzZWUgYWxzbzpcbiAgICogICAtIGh0dHBzOi8vaGFja21kLmlvL0BtaGV2ZXJ5L3JKVUpzdnY5SCB3cml0ZSB1cCBvZiB0aGUgcHJvYmxlbVxuICAgKiAgIC0gYExDb250YWluZXJbQUNUSVZFX0lOREVYXWAgZm9yIGZsYWcgd2hpY2ggbWFya3Mgd2hpY2ggYExDb250YWluZXJgIGhhcyB0cmFuc3BsYW50ZWQgdmlld3MuXG4gICAqICAgLSBgTENvbnRhaW5lcltUUkFOU1BMQU5UX0hFQURdYCBhbmQgYExDb250YWluZXJbVFJBTlNQTEFOVF9UQUlMXWAgc3RvcmFnZSBmb3IgdHJhbnNwbGFudGVkXG4gICAqICAgLSBgTFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl1gIHNpbWlsYXIgcHJvYmxlbSBmb3IgcXVlcmllc1xuICAgKiAgIC0gYExDb250YWluZXJbTU9WRURfVklFV1NdYCBzaW1pbGFyIHByb2JsZW0gZm9yIHF1ZXJpZXNcbiAgICovXG4gIFtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV106IExWaWV3O1xuXG4gIC8qKlxuICAgKiBBIGRlY2xhcmF0aW9uIHBvaW50IG9mIGVtYmVkZGVkIHZpZXdzIChvbmVzIGluc3RhbnRpYXRlZCBiYXNlZCBvbiB0aGUgY29udGVudCBvZiBhXG4gICAqIDxuZy10ZW1wbGF0ZT4pLCBudWxsIGZvciBvdGhlciB0eXBlcyBvZiB2aWV3cy5cbiAgICpcbiAgICogV2UgbmVlZCB0byB0cmFjayBhbGwgZW1iZWRkZWQgdmlld3MgY3JlYXRlZCBmcm9tIGEgZ2l2ZW4gZGVjbGFyYXRpb24gcG9pbnQgc28gd2UgY2FuIHByZXBhcmVcbiAgICogcXVlcnkgbWF0Y2hlcyBpbiBhIHByb3BlciBvcmRlciAocXVlcnkgbWF0Y2hlcyBhcmUgb3JkZXJlZCBiYXNlZCBvbiB0aGVpciBkZWNsYXJhdGlvbiBwb2ludCBhbmRcbiAgICogX25vdF8gdGhlIGluc2VydGlvbiBwb2ludCkuXG4gICAqL1xuICBbREVDTEFSQVRJT05fTENPTlRBSU5FUl06IExDb250YWluZXJ8bnVsbDtcblxuICAvKipcbiAgICogTW9yZSBmbGFncyBmb3IgdGhpcyB2aWV3LiBTZWUgUHJlT3JkZXJIb29rRmxhZ3MgZm9yIG1vcmUgaW5mby5cbiAgICovXG4gIFtQUkVPUkRFUl9IT09LX0ZMQUdTXTogUHJlT3JkZXJIb29rRmxhZ3M7XG59XG5cbi8qKiBGbGFncyBhc3NvY2lhdGVkIHdpdGggYW4gTFZpZXcgKHNhdmVkIGluIExWaWV3W0ZMQUdTXSkgKi9cbmV4cG9ydCBjb25zdCBlbnVtIExWaWV3RmxhZ3Mge1xuICAvKiogVGhlIHN0YXRlIG9mIHRoZSBpbml0IHBoYXNlIG9uIHRoZSBmaXJzdCAyIGJpdHMgKi9cbiAgSW5pdFBoYXNlU3RhdGVJbmNyZW1lbnRlciA9IDBiMDAwMDAwMDAwMDEsXG4gIEluaXRQaGFzZVN0YXRlTWFzayA9IDBiMDAwMDAwMDAwMTEsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSB2aWV3IGlzIGluIGNyZWF0aW9uTW9kZS5cbiAgICpcbiAgICogVGhpcyBtdXN0IGJlIHN0b3JlZCBpbiB0aGUgdmlldyByYXRoZXIgdGhhbiB1c2luZyBgZGF0YWAgYXMgYSBtYXJrZXIgc28gdGhhdFxuICAgKiB3ZSBjYW4gcHJvcGVybHkgc3VwcG9ydCBlbWJlZGRlZCB2aWV3cy4gT3RoZXJ3aXNlLCB3aGVuIGV4aXRpbmcgYSBjaGlsZCB2aWV3XG4gICAqIGJhY2sgaW50byB0aGUgcGFyZW50IHZpZXcsIGBkYXRhYCB3aWxsIGJlIGRlZmluZWQgYW5kIGBjcmVhdGlvbk1vZGVgIHdpbGwgYmVcbiAgICogaW1wcm9wZXJseSByZXBvcnRlZCBhcyBmYWxzZS5cbiAgICovXG4gIENyZWF0aW9uTW9kZSA9IDBiMDAwMDAwMDAxMDAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoaXMgTFZpZXcgaW5zdGFuY2UgaXMgb24gaXRzIGZpcnN0IHByb2Nlc3NpbmcgcGFzcy5cbiAgICpcbiAgICogQW4gTFZpZXcgaW5zdGFuY2UgaXMgY29uc2lkZXJlZCB0byBiZSBvbiBpdHMgXCJmaXJzdCBwYXNzXCIgdW50aWwgaXRcbiAgICogaGFzIGNvbXBsZXRlZCBvbmUgY3JlYXRpb24gbW9kZSBydW4gYW5kIG9uZSB1cGRhdGUgbW9kZSBydW4uIEF0IHRoaXNcbiAgICogdGltZSwgdGhlIGZsYWcgaXMgdHVybmVkIG9mZi5cbiAgICovXG4gIEZpcnN0TFZpZXdQYXNzID0gMGIwMDAwMDAwMTAwMCxcblxuICAvKiogV2hldGhlciB0aGlzIHZpZXcgaGFzIGRlZmF1bHQgY2hhbmdlIGRldGVjdGlvbiBzdHJhdGVneSAoY2hlY2tzIGFsd2F5cykgb3Igb25QdXNoICovXG4gIENoZWNrQWx3YXlzID0gMGIwMDAwMDAxMDAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgbWFudWFsIGNoYW5nZSBkZXRlY3Rpb24gaXMgdHVybmVkIG9uIGZvciBvblB1c2ggY29tcG9uZW50cy5cbiAgICpcbiAgICogVGhpcyBpcyBhIHNwZWNpYWwgbW9kZSB0aGF0IG9ubHkgbWFya3MgY29tcG9uZW50cyBkaXJ0eSBpbiB0d28gY2FzZXM6XG4gICAqIDEpIFRoZXJlIGhhcyBiZWVuIGEgY2hhbmdlIHRvIGFuIEBJbnB1dCBwcm9wZXJ0eVxuICAgKiAyKSBgbWFya0RpcnR5KClgIGhhcyBiZWVuIGNhbGxlZCBtYW51YWxseSBieSB0aGUgdXNlclxuICAgKlxuICAgKiBOb3RlIHRoYXQgaW4gdGhpcyBtb2RlLCB0aGUgZmlyaW5nIG9mIGV2ZW50cyBkb2VzIE5PVCBtYXJrIGNvbXBvbmVudHNcbiAgICogZGlydHkgYXV0b21hdGljYWxseS5cbiAgICpcbiAgICogTWFudWFsIG1vZGUgaXMgdHVybmVkIG9mZiBieSBkZWZhdWx0IGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgYXMgZXZlbnRzXG4gICAqIGF1dG9tYXRpY2FsbHkgbWFyayBPblB1c2ggY29tcG9uZW50cyBkaXJ0eSBpbiBWaWV3IEVuZ2luZS5cbiAgICpcbiAgICogVE9ETzogQWRkIGEgcHVibGljIEFQSSB0byBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSB0byB0dXJuIHRoaXMgbW9kZSBvblxuICAgKi9cbiAgTWFudWFsT25QdXNoID0gMGIwMDAwMDEwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBkaXJ0eSAobmVlZGluZyBjaGVjaykgKi9cbiAgRGlydHkgPSAwYjAwMDAwMTAwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGN1cnJlbnRseSBhdHRhY2hlZCB0byBjaGFuZ2UgZGV0ZWN0aW9uIHRyZWUuICovXG4gIEF0dGFjaGVkID0gMGIwMDAwMTAwMDAwMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBkZXN0cm95ZWQuICovXG4gIERlc3Ryb3llZCA9IDBiMDAwMTAwMDAwMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgdGhlIHJvb3QgdmlldyAqL1xuICBJc1Jvb3QgPSAwYjAwMTAwMDAwMDAwMCxcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIGN1cnJlbnQgaW5pdCBwaGFzZSBvbiBsYXN0IDIyIGJpdHNcbiAgICovXG4gIEluZGV4V2l0aGluSW5pdFBoYXNlSW5jcmVtZW50ZXIgPSAwYjAxMDAwMDAwMDAwMCxcbiAgSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdCA9IDEwLFxuICBJbmRleFdpdGhpbkluaXRQaGFzZVJlc2V0ID0gMGIwMDExMTExMTExMTEsXG59XG5cbi8qKlxuICogUG9zc2libGUgc3RhdGVzIG9mIHRoZSBpbml0IHBoYXNlOlxuICogLSAwMDogT25Jbml0IGhvb2tzIHRvIGJlIHJ1bi5cbiAqIC0gMDE6IEFmdGVyQ29udGVudEluaXQgaG9va3MgdG8gYmUgcnVuXG4gKiAtIDEwOiBBZnRlclZpZXdJbml0IGhvb2tzIHRvIGJlIHJ1blxuICogLSAxMTogQWxsIGluaXQgaG9va3MgaGF2ZSBiZWVuIHJ1blxuICovXG5leHBvcnQgY29uc3QgZW51bSBJbml0UGhhc2VTdGF0ZSB7XG4gIE9uSW5pdEhvb2tzVG9CZVJ1biA9IDBiMDAsXG4gIEFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4gPSAwYjAxLFxuICBBZnRlclZpZXdJbml0SG9va3NUb0JlUnVuID0gMGIxMCxcbiAgSW5pdFBoYXNlQ29tcGxldGVkID0gMGIxMSxcbn1cblxuLyoqIE1vcmUgZmxhZ3MgYXNzb2NpYXRlZCB3aXRoIGFuIExWaWV3IChzYXZlZCBpbiBMVmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSkgKi9cbmV4cG9ydCBjb25zdCBlbnVtIFByZU9yZGVySG9va0ZsYWdzIHtcbiAgLyoqXG4gICAgIFRoZSBpbmRleCBvZiB0aGUgbmV4dCBwcmUtb3JkZXIgaG9vayB0byBiZSBjYWxsZWQgaW4gdGhlIGhvb2tzIGFycmF5LCBvbiB0aGUgZmlyc3QgMTZcbiAgICAgYml0c1xuICAgKi9cbiAgSW5kZXhPZlRoZU5leHRQcmVPcmRlckhvb2tNYXNrTWFzayA9IDBiMDExMTExMTExMTExMTExMTEsXG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2YgaW5pdCBob29rcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGNhbGxlZCwgb24gdGhlIGxhc3QgMTYgYml0c1xuICAgKi9cbiAgTnVtYmVyT2ZJbml0SG9va3NDYWxsZWRJbmNyZW1lbnRlciA9IDBiMDEwMDAwMDAwMDAwMDAwMDAwLFxuICBOdW1iZXJPZkluaXRIb29rc0NhbGxlZFNoaWZ0ID0gMTYsXG4gIE51bWJlck9mSW5pdEhvb2tzQ2FsbGVkTWFzayA9IDBiMTExMTExMTExMTExMTExMTAwMDAwMDAwMDAwMDAwMDAsXG59XG5cbi8qKlxuICogU2V0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHByb2Nlc3MgaG9zdCBiaW5kaW5ncyBlZmZpY2llbnRseS5cbiAqXG4gKiBTZWUgVklFV19EQVRBLm1kIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4cGFuZG9JbnN0cnVjdGlvbnMgZXh0ZW5kcyBBcnJheTxudW1iZXJ8SG9zdEJpbmRpbmdzRnVuY3Rpb248YW55PnxudWxsPiB7fVxuXG4vKipcbiAqIEV4cGxpY2l0bHkgbWFya3MgYFRWaWV3YCBhcyBhIHNwZWNpZmljIHR5cGUgaW4gYG5nRGV2TW9kZWBcbiAqXG4gKiBJdCBpcyB1c2VmdWwgdG8ga25vdyBjb25jZXB0dWFsbHkgd2hhdCB0aW1lIG9mIGBUVmlld2Agd2UgYXJlIGRlYWxpbmcgd2l0aCB3aGVuXG4gKiBkZWJ1Z2dpbmcgYW4gYXBwbGljYXRpb24gKGV2ZW4gaWYgdGhlIHJ1bnRpbWUgZG9lcyBub3QgbmVlZCBpdC4pIEZvciB0aGlzIHJlYXNvblxuICogd2Ugc3RvcmUgdGhpcyBpbmZvcm1hdGlvbiBpbiB0aGUgYG5nRGV2TW9kZWAgYFRWaWV3YCBhbmQgdGhhbiB1c2UgaXQgZm9yXG4gKiBiZXR0ZXIgZGVidWdnaW5nIGV4cGVyaWVuY2UuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRWaWV3VHlwZSB7XG4gIC8qKlxuICAgKiBSb290IGBUVmlld2AgaXMgdGhlIHVzZWQgdG8gYm9vdHN0cmFwIGNvbXBvbmVudHMgaW50by4gSXQgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoXG4gICAqIGBMVmlld2Agd2hpY2ggdGFrZXMgYW4gZXhpc3RpbmcgRE9NIG5vZGUgbm90IG93bmVkIGJ5IEFuZ3VsYXIgYW5kIHdyYXBzIGl0IGluIGBUVmlld2AvYExWaWV3YFxuICAgKiBzbyB0aGF0IG90aGVyIGNvbXBvbmVudHMgY2FuIGJlIGxvYWRlZCBpbnRvIGl0LlxuICAgKi9cbiAgUm9vdCA9IDAsXG5cbiAgLyoqXG4gICAqIGBUVmlld2AgYXNzb2NpYXRlZCB3aXRoIGEgQ29tcG9uZW50LiBUaGlzIHdvdWxkIGJlIHRoZSBgVFZpZXdgIGRpcmVjdGx5IGFzc29jaWF0ZWQgd2l0aCB0aGVcbiAgICogY29tcG9uZW50IHZpZXcgKGFzIG9wcG9zZWQgYW4gYEVtYmVkZGVkYCBgVFZpZXdgIHdoaWNoIHdvdWxkIGJlIGEgY2hpbGQgb2YgYENvbXBvbmVudGAgYFRWaWV3YClcbiAgICovXG4gIENvbXBvbmVudCA9IDEsXG5cbiAgLyoqXG4gICAqIGBUVmlld2AgYXNzb2NpYXRlZCB3aXRoIGEgdGVtcGxhdGUuIFN1Y2ggYXMgYCpuZ0lmYCwgYDxuZy10ZW1wbGF0ZT5gIGV0Yy4uLiBBIGBDb21wb25lbnRgXG4gICAqIGNhbiBoYXZlIHplcm8gb3IgbW9yZSBgRW1iZWRlZGVgIGBUVmlld2BzLlxuICAgKi9cbiAgRW1iZWRkZWQgPSAyLFxufVxuXG4vKipcbiAqIFRoZSBzdGF0aWMgZGF0YSBmb3IgYW4gTFZpZXcgKHNoYXJlZCBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXMgb2YgYVxuICogZ2l2ZW4gdHlwZSkuXG4gKlxuICogU3RvcmVkIG9uIHRoZSBgQ29tcG9uZW50RGVmLnRWaWV3YC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlldyB7XG4gIC8qKlxuICAgKiBUeXBlIG9mIGBUVmlld2AgKGBSb290YHxgQ29tcG9uZW50YHxgRW1iZWRkZWRgKS5cbiAgICovXG4gIHR5cGU6IFRWaWV3VHlwZTtcblxuICAvKipcbiAgICogSUQgZm9yIGlubGluZSB2aWV3cyB0byBkZXRlcm1pbmUgd2hldGhlciBhIHZpZXcgaXMgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHZpZXdcbiAgICogaW4gYSBjZXJ0YWluIHBvc2l0aW9uLiBJZiBpdCdzIG5vdCwgd2Uga25vdyB0aGUgbmV3IHZpZXcgbmVlZHMgdG8gYmUgaW5zZXJ0ZWRcbiAgICogYW5kIHRoZSBvbmUgdGhhdCBleGlzdHMgbmVlZHMgdG8gYmUgcmVtb3ZlZCAoZS5nLiBpZi9lbHNlIHN0YXRlbWVudHMpXG4gICAqXG4gICAqIElmIHRoaXMgaXMgLTEsIHRoZW4gdGhpcyBpcyBhIGNvbXBvbmVudCB2aWV3IG9yIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3LlxuICAgKi9cbiAgcmVhZG9ubHkgaWQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhpcyBpcyBhIGJsdWVwcmludCB1c2VkIHRvIGdlbmVyYXRlIExWaWV3IGluc3RhbmNlcyBmb3IgdGhpcyBUVmlldy4gQ29weWluZyB0aGlzXG4gICAqIGJsdWVwcmludCBpcyBmYXN0ZXIgdGhhbiBjcmVhdGluZyBhIG5ldyBMVmlldyBmcm9tIHNjcmF0Y2guXG4gICAqL1xuICBibHVlcHJpbnQ6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBUaGUgdGVtcGxhdGUgZnVuY3Rpb24gdXNlZCB0byByZWZyZXNoIHRoZSB2aWV3IG9mIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3NcbiAgICogYW5kIGNvbXBvbmVudHMuIFdpbGwgYmUgbnVsbCBmb3IgaW5saW5lIHZpZXdzLlxuICAgKi9cbiAgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIGNvbnRhaW5pbmcgcXVlcnktcmVsYXRlZCBpbnN0cnVjdGlvbnMuXG4gICAqL1xuICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIFBvaW50ZXIgdG8gdGhlIGhvc3QgYFROb2RlYCAobm90IHBhcnQgb2YgdGhpcyBUVmlldykuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgVFZpZXdOb2RlYCBmb3IgYW4gYExWaWV3Tm9kZWAsIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiBhIGNvbnRhaW5lci5cbiAgICogV2UgbmVlZCB0aGlzIHBvaW50ZXIgdG8gYmUgYWJsZSB0byBlZmZpY2llbnRseSBmaW5kIHRoaXMgbm9kZSB3aGVuIGluc2VydGluZyB0aGUgdmlld1xuICAgKiBpbnRvIGFuIGFuY2hvci5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhIGBURWxlbWVudE5vZGVgLCB0aGlzIGlzIHRoZSB2aWV3IG9mIGEgcm9vdCBjb21wb25lbnQuIEl0IGhhcyBleGFjdGx5IG9uZVxuICAgKiByb290IFROb2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIG51bGwsIHRoaXMgaXMgdGhlIHZpZXcgb2YgYSBjb21wb25lbnQgdGhhdCBpcyBub3QgYXQgcm9vdC4gV2UgZG8gbm90IHN0b3JlXG4gICAqIHRoZSBob3N0IFROb2RlcyBmb3IgY2hpbGQgY29tcG9uZW50IHZpZXdzIGJlY2F1c2UgdGhleSBjYW4gcG90ZW50aWFsbHkgaGF2ZSBzZXZlcmFsXG4gICAqIGRpZmZlcmVudCBob3N0IFROb2RlcywgZGVwZW5kaW5nIG9uIHdoZXJlIHRoZSBjb21wb25lbnQgaXMgYmVpbmcgdXNlZC4gVGhlc2UgaG9zdFxuICAgKiBUTm9kZXMgY2Fubm90IGJlIHNoYXJlZCAoZHVlIHRvIGRpZmZlcmVudCBpbmRpY2VzLCBldGMpLlxuICAgKi9cbiAgbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsO1xuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHRlbXBsYXRlIGhhcyBiZWVuIHByb2Nlc3NlZCBpbiBjcmVhdGlvbiBtb2RlLiAqL1xuICBmaXJzdENyZWF0ZVBhc3M6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqICBXaGV0aGVyIG9yIG5vdCB0aGlzIHRlbXBsYXRlIGhhcyBiZWVuIHByb2Nlc3NlZCBpbiB1cGRhdGUgbW9kZSAoZS5nLiBjaGFuZ2UgZGV0ZWN0ZWQpXG4gICAqXG4gICAqIGBmaXJzdFVwZGF0ZVBhc3NgIGlzIHVzZWQgYnkgc3R5bGluZyB0byBzZXQgdXAgYFREYXRhYCB0byBjb250YWluIG1ldGFkYXRhIGFib3V0IHRoZSBzdHlsaW5nXG4gICAqIGluc3RydWN0aW9ucy4gKE1haW5seSB0byBidWlsZCB1cCBhIGxpbmtlZCBsaXN0IG9mIHN0eWxpbmcgcHJpb3JpdHkgb3JkZXIuKVxuICAgKlxuICAgKiBUeXBpY2FsbHkgdGhpcyBmdW5jdGlvbiBnZXRzIGNsZWFyZWQgYWZ0ZXIgZmlyc3QgZXhlY3V0aW9uLiBJZiBleGNlcHRpb24gaXMgdGhyb3duIHRoZW4gdGhpc1xuICAgKiBmbGFnIGNhbiByZW1haW4gdHVybmVkIHVuIHVudGlsIHRoZXJlIGlzIGZpcnN0IHN1Y2Nlc3NmdWwgKG5vIGV4Y2VwdGlvbikgcGFzcy4gVGhpcyBtZWFucyB0aGF0XG4gICAqIGluZGl2aWR1YWwgc3R5bGluZyBpbnN0cnVjdGlvbnMga2VlcCB0cmFjayBvZiBpZiB0aGV5IGhhdmUgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoZSBsaW5rZWRcbiAgICogbGlzdCB0byBwcmV2ZW50IGRvdWJsZSBhZGRpbmcuXG4gICAqL1xuICBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW47XG5cbiAgLyoqIFN0YXRpYyBkYXRhIGVxdWl2YWxlbnQgb2YgTFZpZXcuZGF0YVtdLiBDb250YWlucyBUTm9kZXMsIFBpcGVEZWZJbnRlcm5hbCBvciBUSTE4bi4gKi9cbiAgZGF0YTogVERhdGE7XG5cbiAgLyoqXG4gICAqIFRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4IGlzIHRoZSBpbmRleCBhdCB3aGljaCB0aGUgZGF0YSBhcnJheVxuICAgKiBzdGFydHMgdG8gc3RvcmUgYmluZGluZ3Mgb25seS4gU2F2aW5nIHRoaXMgdmFsdWUgZW5zdXJlcyB0aGF0IHdlXG4gICAqIHdpbGwgYmVnaW4gcmVhZGluZyBiaW5kaW5ncyBhdCB0aGUgY29ycmVjdCBwb2ludCBpbiB0aGUgYXJyYXkgd2hlblxuICAgKiB3ZSBhcmUgaW4gdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIC0xIG1lYW5zIHRoYXQgaXQgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkLlxuICAgKi9cbiAgYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGV4IHdoZXJlIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uIG9mIGBMVmlld2AgYmVnaW5zLiBUaGUgZXhwYW5kb1xuICAgKiBzZWN0aW9uIGNvbnRhaW5zIGluamVjdG9ycywgZGlyZWN0aXZlIGluc3RhbmNlcywgYW5kIGhvc3QgYmluZGluZyB2YWx1ZXMuXG4gICAqIFVubGlrZSB0aGUgXCJkZWNsc1wiIGFuZCBcInZhcnNcIiBzZWN0aW9ucyBvZiBgTFZpZXdgLCB0aGUgbGVuZ3RoIG9mIHRoaXNcbiAgICogc2VjdGlvbiBjYW5ub3QgYmUgY2FsY3VsYXRlZCBhdCBjb21waWxlLXRpbWUgYmVjYXVzZSBkaXJlY3RpdmVzIGFyZSBtYXRjaGVkXG4gICAqIGF0IHJ1bnRpbWUgdG8gcHJlc2VydmUgbG9jYWxpdHkuXG4gICAqXG4gICAqIFdlIHN0b3JlIHRoaXMgc3RhcnQgaW5kZXggc28gd2Uga25vdyB3aGVyZSB0byBzdGFydCBjaGVja2luZyBob3N0IGJpbmRpbmdzXG4gICAqIGluIGBzZXRIb3N0QmluZGluZ3NgLlxuICAgKi9cbiAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBzdGF0aWMgdmlldyBxdWVyaWVzIHRyYWNrZWQgb24gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBXZSBzdG9yZSB0aGlzIHNvIHdlIGtub3cgd2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIGRvIGEgdmlldyBxdWVyeVxuICAgKiByZWZyZXNoIGFmdGVyIGNyZWF0aW9uIG1vZGUgdG8gY29sbGVjdCBzdGF0aWMgcXVlcnkgcmVzdWx0cy5cbiAgICovXG4gIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgYW55IHN0YXRpYyBjb250ZW50IHF1ZXJpZXMgdHJhY2tlZCBvbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFdlIHN0b3JlIHRoaXMgc28gd2Uga25vdyB3aGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgZG8gYSBjb250ZW50IHF1ZXJ5XG4gICAqIHJlZnJlc2ggYWZ0ZXIgY3JlYXRpb24gbW9kZSB0byBjb2xsZWN0IHN0YXRpYyBxdWVyeSByZXN1bHRzLlxuICAgKi9cbiAgc3RhdGljQ29udGVudFF1ZXJpZXM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIGxvY2F0ZWQgaW4gdGhlIHZpZXcuXG4gICAqL1xuICBmaXJzdENoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gcHJvY2VzcyBob3N0IGJpbmRpbmdzIGVmZmljaWVudGx5LlxuICAgKlxuICAgKiBTZWUgVklFV19EQVRBLm1kIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgLy8gVE9ETyhtaXNrbyk6IGBleHBhbmRvSW5zdHJ1Y3Rpb25zYCBzaG91bGQgYmUgcmVuYW1lZCB0byBgaG9zdEJpbmRpbmdzSW5zdHJ1Y3Rpb25zYCBzaW5jZSB0aGV5XG4gIC8vIGtlZXAgdHJhY2sgb2YgYGhvc3RCaW5kaW5nc2Agd2hpY2ggbmVlZCB0byBiZSBleGVjdXRlZC5cbiAgZXhwYW5kb0luc3RydWN0aW9uczogRXhwYW5kb0luc3RydWN0aW9uc3xudWxsO1xuXG4gIC8qKlxuICAgKiBGdWxsIHJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBJdCdzIG5lY2Vzc2FyeSB0byBrZWVwIGEgY29weSBvZiB0aGUgZnVsbCBkZWYgbGlzdCBvbiB0aGUgVFZpZXcgc28gaXQncyBwb3NzaWJsZVxuICAgKiB0byByZW5kZXIgdGVtcGxhdGUgZnVuY3Rpb25zIHdpdGhvdXQgYSBob3N0IGNvbXBvbmVudC5cbiAgICovXG4gIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bGwgcmVnaXN0cnkgb2YgcGlwZXMgdGhhdCBtYXkgYmUgZm91bmQgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBUaGUgcHJvcGVydHkgaXMgZWl0aGVyIGFuIGFycmF5IG9mIGBQaXBlRGVmc2BzIG9yIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgYXJyYXkgb2ZcbiAgICogYFBpcGVEZWZzYHMuIFRoZSBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgdG8gYmUgYWJsZSB0byBzdXBwb3J0IGZvcndhcmQgZGVjbGFyYXRpb25zLlxuICAgKlxuICAgKiBJdCdzIG5lY2Vzc2FyeSB0byBrZWVwIGEgY29weSBvZiB0aGUgZnVsbCBkZWYgbGlzdCBvbiB0aGUgVFZpZXcgc28gaXQncyBwb3NzaWJsZVxuICAgKiB0byByZW5kZXIgdGVtcGxhdGUgZnVuY3Rpb25zIHdpdGhvdXQgYSBob3N0IGNvbXBvbmVudC5cbiAgICovXG4gIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkluaXQsIG5nT25DaGFuZ2VzIGFuZCBuZ0RvQ2hlY2sgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkNoYW5nZXMgYW5kIG5nRG9DaGVjayBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluIHVwZGF0ZSBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZFxuICAgKiBmb3IgdGhpcyB2aWV3IGluIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluIHVwZGF0ZVxuICAgKiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJWaWV3SW5pdCBhbmQgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvclxuICAgKiB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW5cbiAgICogdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdPbkRlc3Ryb3kgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgd2hlbiB0aGlzIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogV2hlbiBhIHZpZXcgaXMgZGVzdHJveWVkLCBsaXN0ZW5lcnMgbmVlZCB0byBiZSByZWxlYXNlZCBhbmQgb3V0cHV0cyBuZWVkIHRvIGJlXG4gICAqIHVuc3Vic2NyaWJlZC4gVGhpcyBjbGVhbnVwIGFycmF5IHN0b3JlcyBib3RoIGxpc3RlbmVyIGRhdGEgKGluIGNodW5rcyBvZiA0KVxuICAgKiBhbmQgb3V0cHV0IGRhdGEgKGluIGNodW5rcyBvZiAyKSBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuIENvbWJpbmluZyB0aGUgYXJyYXlzXG4gICAqIHNhdmVzIG9uIG1lbW9yeSAoNzAgYnl0ZXMgcGVyIGFycmF5KSBhbmQgb24gYSBmZXcgYnl0ZXMgb2YgY29kZSBzaXplIChmb3IgdHdvXG4gICAqIHNlcGFyYXRlIGZvciBsb29wcykuXG4gICAqXG4gICAqIElmIGl0J3MgYSBuYXRpdmUgRE9NIGxpc3RlbmVyIG9yIG91dHB1dCBzdWJzY3JpcHRpb24gYmVpbmcgc3RvcmVkOlxuICAgKiAxc3QgaW5kZXggaXM6IGV2ZW50IG5hbWUgIGBuYW1lID0gdFZpZXcuY2xlYW51cFtpKzBdYFxuICAgKiAybmQgaW5kZXggaXM6IGluZGV4IG9mIG5hdGl2ZSBlbGVtZW50IG9yIGEgZnVuY3Rpb24gdGhhdCByZXRyaWV2ZXMgZ2xvYmFsIHRhcmdldCAod2luZG93LFxuICAgKiAgICAgICAgICAgICAgIGRvY3VtZW50IG9yIGJvZHkpIHJlZmVyZW5jZSBiYXNlZCBvbiB0aGUgbmF0aXZlIGVsZW1lbnQ6XG4gICAqICAgIGB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdmdW5jdGlvbidgOiBnbG9iYWwgdGFyZ2V0IGdldHRlciBmdW5jdGlvblxuICAgKiAgICBgdHlwZW9mIGlkeE9yVGFyZ2V0R2V0dGVyID09PSAnbnVtYmVyJ2A6IGluZGV4IG9mIG5hdGl2ZSBlbGVtZW50XG4gICAqXG4gICAqIDNyZCBpbmRleCBpczogaW5kZXggb2YgbGlzdGVuZXIgZnVuY3Rpb24gYGxpc3RlbmVyID0gbFZpZXdbQ0xFQU5VUF1bdFZpZXcuY2xlYW51cFtpKzJdXWBcbiAgICogNHRoIGluZGV4IGlzOiBgdXNlQ2FwdHVyZU9ySW5keCA9IHRWaWV3LmNsZWFudXBbaSszXWBcbiAgICogICAgYHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09ICdib29sZWFuJyA6IHVzZUNhcHR1cmUgYm9vbGVhblxuICAgKiAgICBgdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT0gJ251bWJlcic6XG4gICAqICAgICAgICAgYHVzZUNhcHR1cmVPckluZHggPj0gMGAgYHJlbW92ZUxpc3RlbmVyID0gTFZpZXdbQ0xFQU5VUF1bdXNlQ2FwdHVyZU9ySW5keF1gXG4gICAqICAgICAgICAgYHVzZUNhcHR1cmVPckluZHggPCAgMGAgYHN1YnNjcmlwdGlvbiA9IExWaWV3W0NMRUFOVVBdWy11c2VDYXB0dXJlT3JJbmR4XWBcbiAgICpcbiAgICogSWYgaXQncyBhbiBvdXRwdXQgc3Vic2NyaXB0aW9uIG9yIHF1ZXJ5IGxpc3QgZGVzdHJveSBob29rOlxuICAgKiAxc3QgaW5kZXggaXM6IG91dHB1dCB1bnN1YnNjcmliZSBmdW5jdGlvbiAvIHF1ZXJ5IGxpc3QgZGVzdHJveSBmdW5jdGlvblxuICAgKiAybmQgaW5kZXggaXM6IGluZGV4IG9mIGZ1bmN0aW9uIGNvbnRleHQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1tdXG4gICAqICAgICAgICAgICAgICAgYHRWaWV3LmNsZWFudXBbaSswXS5jYWxsKGxWaWV3W0NMRUFOVVBdW3RWaWV3LmNsZWFudXBbaSsxXV0pYFxuICAgKi9cbiAgY2xlYW51cDogYW55W118bnVsbDtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGVsZW1lbnQgaW5kaWNlcyBmb3IgY2hpbGQgY29tcG9uZW50cyB0aGF0IHdpbGwgbmVlZCB0byBiZVxuICAgKiByZWZyZXNoZWQgd2hlbiB0aGUgY3VycmVudCB2aWV3IGhhcyBmaW5pc2hlZCBpdHMgY2hlY2suIFRoZXNlIGluZGljZXMgaGF2ZVxuICAgKiBhbHJlYWR5IGJlZW4gYWRqdXN0ZWQgZm9yIHRoZSBIRUFERVJfT0ZGU0VULlxuICAgKlxuICAgKi9cbiAgY29tcG9uZW50czogbnVtYmVyW118bnVsbDtcblxuICAvKipcbiAgICogQSBjb2xsZWN0aW9uIG9mIHF1ZXJpZXMgdHJhY2tlZCBpbiBhIGdpdmVuIHZpZXcuXG4gICAqL1xuICBxdWVyaWVzOiBUUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBpbmRpY2VzIHBvaW50aW5nIHRvIGRpcmVjdGl2ZXMgd2l0aCBjb250ZW50IHF1ZXJpZXMgYWxvbmdzaWRlIHdpdGggdGhlXG4gICAqIGNvcnJlc3BvbmRpbmdcbiAgICogcXVlcnkgaW5kZXguIEVhY2ggZW50cnkgaW4gdGhpcyBhcnJheSBpcyBhIHR1cGxlIG9mOlxuICAgKiAtIGluZGV4IG9mIHRoZSBmaXJzdCBjb250ZW50IHF1ZXJ5IGluZGV4IGRlY2xhcmVkIGJ5IGEgZ2l2ZW4gZGlyZWN0aXZlO1xuICAgKiAtIGluZGV4IG9mIGEgZGlyZWN0aXZlLlxuICAgKlxuICAgKiBXZSBhcmUgc3RvcmluZyB0aG9zZSBpbmRleGVzIHNvIHdlIGNhbiByZWZyZXNoIGNvbnRlbnQgcXVlcmllcyBhcyBwYXJ0IG9mIGEgdmlldyByZWZyZXNoXG4gICAqIHByb2Nlc3MuXG4gICAqL1xuICBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbDtcblxuICAvKipcbiAgICogU2V0IG9mIHNjaGVtYXMgdGhhdCBkZWNsYXJlIGVsZW1lbnRzIHRvIGJlIGFsbG93ZWQgaW5zaWRlIHRoZSB2aWV3LlxuICAgKi9cbiAgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBjb25zdGFudHMgZm9yIHRoZSB2aWV3LiBJbmNsdWRlcyBhdHRyaWJ1dGUgYXJyYXlzLCBsb2NhbCBkZWZpbml0aW9uIGFycmF5cyBldGMuXG4gICAqIFVzZWQgZm9yIGRpcmVjdGl2ZSBtYXRjaGluZywgYXR0cmlidXRlIGJpbmRpbmdzLCBsb2NhbCBkZWZpbml0aW9ucyBhbmQgbW9yZS5cbiAgICovXG4gIGNvbnN0czogVENvbnN0YW50c3xudWxsO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBSb290Q29udGV4dEZsYWdzIHtFbXB0eSA9IDBiMDAsIERldGVjdENoYW5nZXMgPSAwYjAxLCBGbHVzaFBsYXllcnMgPSAwYjEwfVxuXG5cbi8qKlxuICogUm9vdENvbnRleHQgY29udGFpbnMgaW5mb3JtYXRpb24gd2hpY2ggaXMgc2hhcmVkIGZvciBhbGwgY29tcG9uZW50cyB3aGljaFxuICogd2VyZSBib290c3RyYXBwZWQgd2l0aCB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb290Q29udGV4dCB7XG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHVzZWQgZm9yIHNjaGVkdWxpbmcgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgZnV0dXJlLiBVc3VhbGx5XG4gICAqIHRoaXMgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuXG4gICAqL1xuICBzY2hlZHVsZXI6ICh3b3JrRm46ICgpID0+IHZvaWQpID0+IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCB3aGVuIGFsbCBjb21wb25lbnRzIGFyZSBjb25zaWRlcmVkIGNsZWFuIChub3QgZGlydHkpLlxuICAgKlxuICAgKiBUaGlzIHByb21pc2UgaXMgb3ZlcndyaXR0ZW4gZXZlcnkgdGltZSBhIGZpcnN0IGNhbGwgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gaXMgaW52b2tlZC5cbiAgICovXG4gIGNsZWFuOiBQcm9taXNlPG51bGw+O1xuXG4gIC8qKlxuICAgKiBSb290Q29tcG9uZW50cyAtIFRoZSBjb21wb25lbnRzIHRoYXQgd2VyZSBpbnN0YW50aWF0ZWQgYnkgdGhlIGNhbGwgdG9cbiAgICoge0BsaW5rIHJlbmRlckNvbXBvbmVudH0uXG4gICAqL1xuICBjb21wb25lbnRzOiB7fVtdO1xuXG4gIC8qKlxuICAgKiBUaGUgcGxheWVyIGZsdXNoaW5nIGhhbmRsZXIgdG8ga2ljayBvZmYgYWxsIGFuaW1hdGlvbnNcbiAgICovXG4gIHBsYXllckhhbmRsZXI6IFBsYXllckhhbmRsZXJ8bnVsbDtcblxuICAvKipcbiAgICogV2hhdCByZW5kZXItcmVsYXRlZCBvcGVyYXRpb25zIHRvIHJ1biBvbmNlIGEgc2NoZWR1bGVyIGhhcyBiZWVuIHNldFxuICAgKi9cbiAgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3M7XG59XG5cbi8qKiBTaW5nbGUgaG9vayBjYWxsYmFjayBmdW5jdGlvbi4gKi9cbmV4cG9ydCB0eXBlIEhvb2tGbiA9ICgpID0+IHZvaWQ7XG5cbi8qKlxuICogSW5mb3JtYXRpb24gbmVjZXNzYXJ5IHRvIGNhbGwgYSBob29rLiBFLmcuIHRoZSBjYWxsYmFjayB0aGF0XG4gKiBuZWVkcyB0byBpbnZva2VkIGFuZCB0aGUgaW5kZXggYXQgd2hpY2ggdG8gZmluZCBpdHMgY29udGV4dC5cbiAqL1xuZXhwb3J0IHR5cGUgSG9va0VudHJ5ID0gbnVtYmVyIHwgSG9va0ZuO1xuXG4vKipcbiAqIEFycmF5IG9mIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIEZvciBlYWNoIG5vZGUgb2YgdGhlIHZpZXcsIHRoZSBmb2xsb3dpbmcgZGF0YSBpcyBzdG9yZWQ6XG4gKiAxKSBOb2RlIGluZGV4IChvcHRpb25hbClcbiAqIDIpIEEgc2VyaWVzIG9mIG51bWJlci9mdW5jdGlvbiBwYWlycyB3aGVyZTpcbiAqICAtIGV2ZW4gaW5kaWNlcyBhcmUgZGlyZWN0aXZlIGluZGljZXNcbiAqICAtIG9kZCBpbmRpY2VzIGFyZSBob29rIGZ1bmN0aW9uc1xuICpcbiAqIFNwZWNpYWwgY2FzZXM6XG4gKiAgLSBhIG5lZ2F0aXZlIGRpcmVjdGl2ZSBpbmRleCBmbGFncyBhbiBpbml0IGhvb2sgKG5nT25Jbml0LCBuZ0FmdGVyQ29udGVudEluaXQsIG5nQWZ0ZXJWaWV3SW5pdClcbiAqL1xuZXhwb3J0IHR5cGUgSG9va0RhdGEgPSBIb29rRW50cnlbXTtcblxuLyoqXG4gKiBBcnJheSBvZiBkZXN0cm95IGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIFRoZSBhcnJheSBpcyBzZXQgdXAgYXMgYSBzZXJpZXMgb2YgbnVtYmVyL2Z1bmN0aW9uIG9yIG51bWJlci8obnVtYmVyfGZ1bmN0aW9uKVtdOlxuICogLSBFdmVuIGluZGljZXMgcmVwcmVzZW50IHRoZSBjb250ZXh0IHdpdGggd2hpY2ggaG9va3Mgc2hvdWxkIGJlIGNhbGxlZC5cbiAqIC0gT2RkIGluZGljZXMgYXJlIHRoZSBob29rIGZ1bmN0aW9ucyB0aGVtc2VsdmVzLiBJZiBhIHZhbHVlIGF0IGFuIG9kZCBpbmRleCBpcyBhbiBhcnJheSxcbiAqICAgaXQgcmVwcmVzZW50cyB0aGUgZGVzdHJveSBob29rcyBvZiBhIGBtdWx0aWAgcHJvdmlkZXIgd2hlcmU6XG4gKiAgICAgLSBFdmVuIGluZGljZXMgcmVwcmVzZW50IHRoZSBpbmRleCBvZiB0aGUgcHJvdmlkZXIgZm9yIHdoaWNoIHdlJ3ZlIHJlZ2lzdGVyZWQgYSBkZXN0cm95IGhvb2ssXG4gKiAgICAgICBpbnNpZGUgb2YgdGhlIGBtdWx0aWAgcHJvdmlkZXIgYXJyYXkuXG4gKiAgICAgLSBPZGQgaW5kaWNlcyBhcmUgdGhlIGRlc3Ryb3kgaG9vayBmdW5jdGlvbnMuXG4gKiBGb3IgZXhhbXBsZTpcbiAqIExWaWV3OiBgWzAsIDEsIDIsIEFTZXJ2aWNlLCA0LCBbQlNlcnZpY2UsIENTZXJ2aWNlLCBEU2VydmljZV1dYFxuICogZGVzdHJveUhvb2tzOiBgWzMsIEFTZXJ2aWNlLm5nT25EZXN0cm95LCA1LCBbMCwgQlNlcnZpY2UubmdPbkRlc3Ryb3ksIDIsIERTZXJ2aWNlLm5nT25EZXN0cm95XV1gXG4gKlxuICogSW4gdGhlIGV4YW1wbGUgYWJvdmUgYEFTZXJ2aWNlYCBpcyBhIHR5cGUgcHJvdmlkZXIgd2l0aCBhbiBgbmdPbkRlc3Ryb3lgLCB3aGVyZWFzIGBCU2VydmljZWAsXG4gKiBgQ1NlcnZpY2VgIGFuZCBgRFNlcnZpY2VgIGFyZSBwYXJ0IG9mIGEgYG11bHRpYCBwcm92aWRlciB3aGVyZSBvbmx5IGBCU2VydmljZWAgYW5kIGBEU2VydmljZWBcbiAqIGhhdmUgYW4gYG5nT25EZXN0cm95YCBob29rLlxuICovXG5leHBvcnQgdHlwZSBEZXN0cm95SG9va0RhdGEgPSAoSG9va0VudHJ5IHwgSG9va0RhdGEpW107XG5cbi8qKlxuICogU3RhdGljIGRhdGEgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdGFuY2Utc3BlY2lmaWMgZGF0YSBhcnJheSBvbiBhbiBMVmlldy5cbiAqXG4gKiBFYWNoIG5vZGUncyBzdGF0aWMgZGF0YSBpcyBzdG9yZWQgaW4gdERhdGEgYXQgdGhlIHNhbWUgaW5kZXggdGhhdCBpdCdzIHN0b3JlZFxuICogaW4gdGhlIGRhdGEgYXJyYXkuICBBbnkgbm9kZXMgdGhhdCBkbyBub3QgaGF2ZSBzdGF0aWMgZGF0YSBzdG9yZSBhIG51bGwgdmFsdWUgaW5cbiAqIHREYXRhIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5LlxuICpcbiAqIEVhY2ggcGlwZSdzIGRlZmluaXRpb24gaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHBpcGUgaW5zdGFuY2UgaW5cbiAqIHRoZSBkYXRhIGFycmF5LlxuICpcbiAqIEVhY2ggaG9zdCBwcm9wZXJ0eSdzIG5hbWUgaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHZhbHVlIGluIHRoZVxuICogZGF0YSBhcnJheS5cbiAqXG4gKiBFYWNoIHByb3BlcnR5IGJpbmRpbmcgbmFtZSBpcyBzdG9yZWQgaGVyZSBhdCB0aGUgc2FtZSBpbmRleCBhcyBpdHMgdmFsdWUgaW5cbiAqIHRoZSBkYXRhIGFycmF5LiBJZiB0aGUgYmluZGluZyBpcyBhbiBpbnRlcnBvbGF0aW9uLCB0aGUgc3RhdGljIHN0cmluZyB2YWx1ZXNcbiAqIGFyZSBzdG9yZWQgcGFyYWxsZWwgdG8gdGhlIGR5bmFtaWMgdmFsdWVzLiBFeGFtcGxlOlxuICpcbiAqIGlkPVwicHJlZml4IHt7IHYwIH19IGEge3sgdjEgfX0gYiB7eyB2MiB9fSBzdWZmaXhcIlxuICpcbiAqIExWaWV3ICAgICAgIHwgICBUVmlldy5kYXRhXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHYwIHZhbHVlICAgfCAgICdhJ1xuICogIHYxIHZhbHVlICAgfCAgICdiJ1xuICogIHYyIHZhbHVlICAgfCAgIGlkIO+/vSBwcmVmaXgg77+9IHN1ZmZpeFxuICpcbiAqIEluamVjdG9yIGJsb29tIGZpbHRlcnMgYXJlIGFsc28gc3RvcmVkIGhlcmUuXG4gKi9cbmV4cG9ydCB0eXBlIFREYXRhID1cbiAgICAoVE5vZGUgfCBQaXBlRGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnwgbnVtYmVyIHwgVFN0eWxpbmdSYW5nZSB8XG4gICAgIFRTdHlsaW5nS2V5IHwgVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUSTE4biB8IEkxOG5VcGRhdGVPcENvZGVzIHwgbnVsbCB8IHN0cmluZylbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==