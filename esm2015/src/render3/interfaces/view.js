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
    Empty: 0,
    DetectChanges: 1,
    FlushPlayers: 2,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkEsTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDOztBQUNyQixNQUFNLE9BQU8sS0FBSyxHQUFHLENBQUM7O0FBQ3RCLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQzs7QUFDdEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sSUFBSSxHQUFHLENBQUM7O0FBQ3JCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLE1BQU0sR0FBRyxDQUFDOztBQUN2QixNQUFNLE9BQU8sT0FBTyxHQUFHLENBQUM7O0FBQ3hCLE1BQU0sT0FBTyxPQUFPLEdBQUcsQ0FBQzs7QUFDeEIsTUFBTSxPQUFPLFFBQVEsR0FBRyxDQUFDOztBQUN6QixNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsRUFBRTs7QUFDbEMsTUFBTSxPQUFPLFFBQVEsR0FBRyxFQUFFOztBQUMxQixNQUFNLE9BQU8sU0FBUyxHQUFHLEVBQUU7O0FBQzNCLE1BQU0sT0FBTyxVQUFVLEdBQUcsRUFBRTs7QUFDNUIsTUFBTSxPQUFPLFVBQVUsR0FBRyxFQUFFOztBQUM1QixNQUFNLE9BQU8sZ0JBQWdCLEdBQUcsRUFBRTs7QUFDbEMsTUFBTSxPQUFPLDBCQUEwQixHQUFHLEVBQUU7O0FBQzVDLE1BQU0sT0FBTyxzQkFBc0IsR0FBRyxFQUFFOztBQUN4QyxNQUFNLE9BQU8sbUJBQW1CLEdBQUcsRUFBRTs7Ozs7QUFFckMsTUFBTSxPQUFPLGFBQWEsR0FBRyxFQUFFOzs7O0FBTS9CLHFDQUVDOzs7SUFEQyxvQ0FBaUU7Ozs7Ozs7Ozs7Ozs7QUFjbkUsMkJBdU5DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHRCxNQUFrQixVQUFVO0lBQzFCLHNEQUFzRDtJQUN0RCx5QkFBeUIsR0FBZ0I7SUFDekMsa0JBQWtCLEdBQWdCO0lBRWxDOzs7Ozs7O09BT0c7SUFDSCxZQUFZLEdBQWdCO0lBRTVCOzs7Ozs7T0FNRztJQUNILGNBQWMsR0FBZ0I7SUFFOUIsd0ZBQXdGO0lBQ3hGLFdBQVcsSUFBZ0I7SUFFM0I7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxZQUFZLElBQWdCO0lBRTVCLGtFQUFrRTtJQUNsRSxLQUFLLElBQWlCO0lBRXRCLCtFQUErRTtJQUMvRSxRQUFRLEtBQWlCO0lBRXpCLDZDQUE2QztJQUM3QyxTQUFTLEtBQWlCO0lBRTFCLGdEQUFnRDtJQUNoRCxNQUFNLEtBQWlCO0lBRXZCOztPQUVHO0lBQ0gsK0JBQStCLE1BQWlCO0lBQ2hELHlCQUF5QixJQUFLO0lBQzlCLHlCQUF5QixNQUFpQjtFQUMzQzs7O0FBU0QsTUFBa0IsY0FBYztJQUM5QixrQkFBa0IsR0FBTztJQUN6Qiw0QkFBNEIsR0FBTztJQUNuQyx5QkFBeUIsR0FBTztJQUNoQyxrQkFBa0IsR0FBTztFQUMxQjs7O0FBR0QsTUFBa0IsaUJBQWlCO0lBQ2pDOzs7T0FHRztJQUNILGtDQUFrQyxPQUFzQjtJQUV4RDs7T0FFRztJQUNILGtDQUFrQyxPQUF1QjtJQUN6RCw0QkFBNEIsSUFBSztJQUNqQywyQkFBMkIsWUFBcUM7RUFDakU7Ozs7Ozs7O0FBT0QseUNBQTRGOztBQVU1RixNQUFrQixTQUFTO0lBQ3pCOzs7O09BSUc7SUFDSCxJQUFJLEdBQUk7SUFFUjs7O09BR0c7SUFDSCxTQUFTLEdBQUk7SUFFYjs7O09BR0c7SUFDSCxRQUFRLEdBQUk7RUFDYjs7Ozs7Ozs7O0FBUUQsMkJBdVFDOzs7Ozs7SUFuUUMscUJBQWdCOzs7Ozs7Ozs7SUFTaEIsbUJBQW9COzs7Ozs7SUFNcEIsMEJBQWlCOzs7Ozs7SUFNakIseUJBQXFDOzs7OztJQUtyQywwQkFBd0M7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJ4QyxxQkFBa0M7Ozs7O0lBR2xDLGdDQUF5Qjs7Ozs7Ozs7Ozs7OztJQWF6QixnQ0FBeUI7Ozs7O0lBR3pCLHFCQUFZOzs7Ozs7Ozs7O0lBVVosa0NBQTBCOzs7Ozs7Ozs7Ozs7SUFZMUIsa0NBQTBCOzs7Ozs7OztJQVExQixrQ0FBMkI7Ozs7Ozs7O0lBUTNCLHFDQUE4Qjs7Ozs7SUFLOUIsMkJBQXVCOzs7Ozs7O0lBU3ZCLG9DQUE4Qzs7Ozs7Ozs7SUFROUMsa0NBQXlDOzs7Ozs7Ozs7OztJQVd6Qyw2QkFBK0I7Ozs7Ozs7OztJQVMvQiw4QkFBNkI7Ozs7Ozs7O0lBUTdCLG1DQUFrQzs7Ozs7Ozs7O0lBU2xDLDZCQUE0Qjs7Ozs7Ozs7O0lBUzVCLGtDQUFpQzs7Ozs7Ozs7O0lBU2pDLDBCQUF5Qjs7Ozs7Ozs7O0lBU3pCLCtCQUE4Qjs7Ozs7Ozs7SUFROUIsNkJBQW1DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBNEJuQyx3QkFBb0I7Ozs7Ozs7O0lBUXBCLDJCQUEwQjs7Ozs7SUFLMUIsd0JBQXVCOzs7Ozs7Ozs7Ozs7SUFZdkIsK0JBQThCOzs7OztJQUs5Qix3QkFBK0I7Ozs7OztJQU0vQix1QkFBd0I7OztBQUcxQixNQUFrQixnQkFBZ0I7SUFDaEMsS0FBSyxHQUFPO0lBQ1osYUFBYSxHQUFPO0lBQ3BCLFlBQVksR0FBTztFQUNwQjs7Ozs7OztBQU9ELGlDQTZCQzs7Ozs7OztJQXhCQyxnQ0FBd0M7Ozs7Ozs7SUFPeEMsNEJBQXFCOzs7Ozs7SUFNckIsaUNBQWlCOzs7OztJQUtqQixvQ0FBa0M7Ozs7O0lBS2xDLDRCQUF3Qjs7Ozs7QUErRTFCLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi8uLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1NjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9tZXRhZGF0YSc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5cbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBQaXBlRGVmLCBQaXBlRGVmTGlzdCwgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7STE4blVwZGF0ZU9wQ29kZXMsIFRJMThufSBmcm9tICcuL2kxOG4nO1xuaW1wb3J0IHtUQ29uc3RhbnRzLCBURWxlbWVudE5vZGUsIFROb2RlLCBUVmlld05vZGV9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge1BsYXllckhhbmRsZXJ9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7TFF1ZXJpZXMsIFRRdWVyaWVzfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5M30gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge1RTdHlsaW5nS2V5LCBUU3R5bGluZ1JhbmdlfSBmcm9tICcuL3N0eWxpbmcnO1xuXG5cblxuLy8gQmVsb3cgYXJlIGNvbnN0YW50cyBmb3IgTFZpZXcgaW5kaWNlcyB0byBoZWxwIHVzIGxvb2sgdXAgTFZpZXcgbWVtYmVyc1xuLy8gd2l0aG91dCBoYXZpbmcgdG8gcmVtZW1iZXIgdGhlIHNwZWNpZmljIGluZGljZXMuXG4vLyBVZ2xpZnkgd2lsbCBpbmxpbmUgdGhlc2Ugd2hlbiBtaW5pZnlpbmcgc28gdGhlcmUgc2hvdWxkbid0IGJlIGEgY29zdC5cbmV4cG9ydCBjb25zdCBIT1NUID0gMDtcbmV4cG9ydCBjb25zdCBUVklFVyA9IDE7XG5leHBvcnQgY29uc3QgRkxBR1MgPSAyO1xuZXhwb3J0IGNvbnN0IFBBUkVOVCA9IDM7XG5leHBvcnQgY29uc3QgTkVYVCA9IDQ7XG5leHBvcnQgY29uc3QgUVVFUklFUyA9IDU7XG5leHBvcnQgY29uc3QgVF9IT1NUID0gNjtcbmV4cG9ydCBjb25zdCBDTEVBTlVQID0gNztcbmV4cG9ydCBjb25zdCBDT05URVhUID0gODtcbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IDk7XG5leHBvcnQgY29uc3QgUkVOREVSRVJfRkFDVE9SWSA9IDEwO1xuZXhwb3J0IGNvbnN0IFJFTkRFUkVSID0gMTE7XG5leHBvcnQgY29uc3QgU0FOSVRJWkVSID0gMTI7XG5leHBvcnQgY29uc3QgQ0hJTERfSEVBRCA9IDEzO1xuZXhwb3J0IGNvbnN0IENISUxEX1RBSUwgPSAxNDtcbmV4cG9ydCBjb25zdCBERUNMQVJBVElPTl9WSUVXID0gMTU7XG5leHBvcnQgY29uc3QgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcgPSAxNjtcbmV4cG9ydCBjb25zdCBERUNMQVJBVElPTl9MQ09OVEFJTkVSID0gMTc7XG5leHBvcnQgY29uc3QgUFJFT1JERVJfSE9PS19GTEFHUyA9IDE4O1xuLyoqIFNpemUgb2YgTFZpZXcncyBoZWFkZXIuIE5lY2Vzc2FyeSB0byBhZGp1c3QgZm9yIGl0IHdoZW4gc2V0dGluZyBzbG90cy4gICovXG5leHBvcnQgY29uc3QgSEVBREVSX09GRlNFVCA9IDE5O1xuXG5cbi8vIFRoaXMgaW50ZXJmYWNlIHJlcGxhY2VzIHRoZSByZWFsIExWaWV3IGludGVyZmFjZSBpZiBpdCBpcyBhbiBhcmcgb3IgYVxuLy8gcmV0dXJuIHZhbHVlIG9mIGEgcHVibGljIGluc3RydWN0aW9uLiBUaGlzIGVuc3VyZXMgd2UgZG9uJ3QgbmVlZCB0byBleHBvc2Vcbi8vIHRoZSBhY3R1YWwgaW50ZXJmYWNlLCB3aGljaCBzaG91bGQgYmUga2VwdCBwcml2YXRlLlxuZXhwb3J0IGludGVyZmFjZSBPcGFxdWVWaWV3U3RhdGUge1xuICAnX19icmFuZF9fJzogJ0JyYW5kIGZvciBPcGFxdWVWaWV3U3RhdGUgdGhhdCBub3RoaW5nIHdpbGwgbWF0Y2gnO1xufVxuXG5cbi8qKlxuICogYExWaWV3YCBzdG9yZXMgYWxsIG9mIHRoZSBpbmZvcm1hdGlvbiBuZWVkZWQgdG8gcHJvY2VzcyB0aGUgaW5zdHJ1Y3Rpb25zIGFzXG4gKiB0aGV5IGFyZSBpbnZva2VkIGZyb20gdGhlIHRlbXBsYXRlLiBFYWNoIGVtYmVkZGVkIHZpZXcgYW5kIGNvbXBvbmVudCB2aWV3IGhhcyBpdHNcbiAqIG93biBgTFZpZXdgLiBXaGVuIHByb2Nlc3NpbmcgYSBwYXJ0aWN1bGFyIHZpZXcsIHdlIHNldCB0aGUgYHZpZXdEYXRhYCB0byB0aGF0XG4gKiBgTFZpZXdgLiBXaGVuIHRoYXQgdmlldyBpcyBkb25lIHByb2Nlc3NpbmcsIHRoZSBgdmlld0RhdGFgIGlzIHNldCBiYWNrIHRvXG4gKiB3aGF0ZXZlciB0aGUgb3JpZ2luYWwgYHZpZXdEYXRhYCB3YXMgYmVmb3JlICh0aGUgcGFyZW50IGBMVmlld2ApLlxuICpcbiAqIEtlZXBpbmcgc2VwYXJhdGUgc3RhdGUgZm9yIGVhY2ggdmlldyBmYWNpbGl0aWVzIHZpZXcgaW5zZXJ0aW9uIC8gZGVsZXRpb24sIHNvIHdlXG4gKiBkb24ndCBoYXZlIHRvIGVkaXQgdGhlIGRhdGEgYXJyYXkgYmFzZWQgb24gd2hpY2ggdmlld3MgYXJlIHByZXNlbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTFZpZXcgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAgLyoqXG4gICAqIFRoZSBob3N0IG5vZGUgZm9yIHRoaXMgTFZpZXcgaW5zdGFuY2UsIGlmIHRoaXMgaXMgYSBjb21wb25lbnQgdmlldy5cbiAgICogSWYgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3LCBIT1NUIHdpbGwgYmUgbnVsbC5cbiAgICovXG4gIFtIT1NUXTogUkVsZW1lbnR8bnVsbDtcblxuICAvKipcbiAgICogVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIHZpZXcuIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhpcyBzbyB3ZSBjYW4gZWFzaWx5IHdhbGsgdXAgdGhlXG4gICAqIG5vZGUgdHJlZSBpbiBESSBhbmQgZ2V0IHRoZSBUVmlldy5kYXRhIGFycmF5IGFzc29jaWF0ZWQgd2l0aCBhIG5vZGUgKHdoZXJlIHRoZVxuICAgKiBkaXJlY3RpdmUgZGVmcyBhcmUgc3RvcmVkKS5cbiAgICovXG4gIHJlYWRvbmx5W1RWSUVXXTogVFZpZXc7XG5cbiAgLyoqIEZsYWdzIGZvciB0aGlzIHZpZXcuIFNlZSBMVmlld0ZsYWdzIGZvciBtb3JlIGluZm8uICovXG4gIFtGTEFHU106IExWaWV3RmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoaXMgbWF5IHN0b3JlIGFuIHtAbGluayBMVmlld30gb3Ige0BsaW5rIExDb250YWluZXJ9LlxuICAgKlxuICAgKiBgTFZpZXdgIC0gVGhlIHBhcmVudCB2aWV3LiBUaGlzIGlzIG5lZWRlZCB3aGVuIHdlIGV4aXQgdGhlIHZpZXcgYW5kIG11c3QgcmVzdG9yZSB0aGUgcHJldmlvdXNcbiAgICogTFZpZXcuIFdpdGhvdXQgdGhpcywgdGhlIHJlbmRlciBtZXRob2Qgd291bGQgaGF2ZSB0byBrZWVwIGEgc3RhY2sgb2ZcbiAgICogdmlld3MgYXMgaXQgaXMgcmVjdXJzaXZlbHkgcmVuZGVyaW5nIHRlbXBsYXRlcy5cbiAgICpcbiAgICogYExDb250YWluZXJgIC0gVGhlIGN1cnJlbnQgdmlldyBpcyBwYXJ0IG9mIGEgY29udGFpbmVyLCBhbmQgaXMgYW4gZW1iZWRkZWQgdmlldy5cbiAgICovXG4gIFtQQVJFTlRdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqXG4gICAqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgTFZpZXcgb3IgTENvbnRhaW5lci5cbiAgICpcbiAgICogQWxsb3dzIHVzIHRvIHByb3BhZ2F0ZSBiZXR3ZWVuIHNpYmxpbmcgdmlldyBzdGF0ZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIHNhbWVcbiAgICogY29udGFpbmVyLiBFbWJlZGRlZCB2aWV3cyBhbHJlYWR5IGhhdmUgYSBub2RlLm5leHQsIGJ1dCBpdCBpcyBvbmx5IHNldCBmb3JcbiAgICogdmlld3MgaW4gdGhlIHNhbWUgY29udGFpbmVyLiBXZSBuZWVkIGEgd2F5IHRvIGxpbmsgY29tcG9uZW50IHZpZXdzIGFuZCB2aWV3c1xuICAgKiBhY3Jvc3MgY29udGFpbmVycyBhcyB3ZWxsLlxuICAgKi9cbiAgW05FWFRdOiBMVmlld3xMQ29udGFpbmVyfG51bGw7XG5cbiAgLyoqIFF1ZXJpZXMgYWN0aXZlIGZvciB0aGlzIHZpZXcgLSBub2RlcyBmcm9tIGEgdmlldyBhcmUgcmVwb3J0ZWQgdG8gdGhvc2UgcXVlcmllcy4gKi9cbiAgW1FVRVJJRVNdOiBMUXVlcmllc3xudWxsO1xuXG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBgVFZpZXdOb2RlYCBvciBgVEVsZW1lbnROb2RlYCB3aGljaCByZXByZXNlbnRzIHRoZSByb290IG9mIHRoZSB2aWV3LlxuICAgKlxuICAgKiBJZiBgVFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLiBXZSBuZWVkIHRoaXMgdG8gYmUgYWJsZSB0b1xuICAgKiBlZmZpY2llbnRseSBmaW5kIHRoZSBgTFZpZXdOb2RlYCB3aGVuIGluc2VydGluZyB0aGUgdmlldyBpbnRvIGFuIGFuY2hvci5cbiAgICpcbiAgICogSWYgYFRFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIExWaWV3IG9mIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiBJZiBudWxsLCB0aGlzIGlzIHRoZSByb290IHZpZXcgb2YgYW4gYXBwbGljYXRpb24gKHJvb3QgY29tcG9uZW50IGlzIGluIHRoaXMgdmlldykuXG4gICAqL1xuICBbVF9IT1NUXTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAgICogdW5zdWJzY3JpYmVkLiBUaGlzIGNvbnRleHQgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZnVuY3Rpb25zIHdyYXBwZWQgd2l0aFxuICAgKiB0aGVpciBjb250ZXh0IGFuZCBvdXRwdXQgc3Vic2NyaXB0aW9uIGluc3RhbmNlcyBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuXG4gICAqXG4gICAqIFRoZXNlIGNoYW5nZSBwZXIgTFZpZXcgaW5zdGFuY2UsIHNvIHRoZXkgY2Fubm90IGJlIHN0b3JlZCBvbiBUVmlldy4gSW5zdGVhZCxcbiAgICogVFZpZXcuY2xlYW51cCBzYXZlcyBhbiBpbmRleCB0byB0aGUgbmVjZXNzYXJ5IGNvbnRleHQgaW4gdGhpcyBhcnJheS5cbiAgICovXG4gIC8vIFRPRE86IGZsYXR0ZW4gaW50byBMVmlld1tdXG4gIFtDTEVBTlVQXTogYW55W118bnVsbDtcblxuICAvKipcbiAgICogLSBGb3IgZHluYW1pYyB2aWV3cywgdGhpcyBpcyB0aGUgY29udGV4dCB3aXRoIHdoaWNoIHRvIHJlbmRlciB0aGUgdGVtcGxhdGUgKGUuZy5cbiAgICogICBgTmdGb3JDb250ZXh0YCksIG9yIGB7fWAgaWYgbm90IGRlZmluZWQgZXhwbGljaXRseS5cbiAgICogLSBGb3Igcm9vdCB2aWV3IG9mIHRoZSByb290IGNvbXBvbmVudCB0aGUgY29udGV4dCBjb250YWlucyBjaGFuZ2UgZGV0ZWN0aW9uIGRhdGEuXG4gICAqIC0gRm9yIG5vbi1yb290IGNvbXBvbmVudHMsIHRoZSBjb250ZXh0IGlzIHRoZSBjb21wb25lbnQgaW5zdGFuY2UsXG4gICAqIC0gRm9yIGlubGluZSB2aWV3cywgdGhlIGNvbnRleHQgaXMgbnVsbC5cbiAgICovXG4gIFtDT05URVhUXToge318Um9vdENvbnRleHR8bnVsbDtcblxuICAvKiogQW4gb3B0aW9uYWwgTW9kdWxlIEluamVjdG9yIHRvIGJlIHVzZWQgYXMgZmFsbCBiYWNrIGFmdGVyIEVsZW1lbnQgSW5qZWN0b3JzIGFyZSBjb25zdWx0ZWQuICovXG4gIHJlYWRvbmx5W0lOSkVDVE9SXTogSW5qZWN0b3J8bnVsbDtcblxuICAvKiogRmFjdG9yeSB0byBiZSB1c2VkIGZvciBjcmVhdGluZyBSZW5kZXJlci4gKi9cbiAgW1JFTkRFUkVSX0ZBQ1RPUlldOiBSZW5kZXJlckZhY3RvcnkzO1xuXG4gIC8qKiBSZW5kZXJlciB0byBiZSB1c2VkIGZvciB0aGlzIHZpZXcuICovXG4gIFtSRU5ERVJFUl06IFJlbmRlcmVyMztcblxuICAvKiogQW4gb3B0aW9uYWwgY3VzdG9tIHNhbml0aXplci4gKi9cbiAgW1NBTklUSVpFUl06IFNhbml0aXplcnxudWxsO1xuXG4gIC8qKlxuICAgKiBSZWZlcmVuY2UgdG8gdGhlIGZpcnN0IExWaWV3IG9yIExDb250YWluZXIgYmVuZWF0aCB0aGlzIExWaWV3IGluXG4gICAqIHRoZSBoaWVyYXJjaHkuXG4gICAqXG4gICAqIE5lY2Vzc2FyeSB0byBzdG9yZSB0aGlzIHNvIHZpZXdzIGNhbiB0cmF2ZXJzZSB0aHJvdWdoIHRoZWlyIG5lc3RlZCB2aWV3c1xuICAgKiB0byByZW1vdmUgbGlzdGVuZXJzIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gICAqL1xuICBbQ0hJTERfSEVBRF06IExWaWV3fExDb250YWluZXJ8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGxhc3QgTFZpZXcgb3IgTENvbnRhaW5lciBiZW5lYXRoIHRoaXMgTFZpZXcgaW4gdGhlIGhpZXJhcmNoeS5cbiAgICpcbiAgICogVGhlIHRhaWwgYWxsb3dzIHVzIHRvIHF1aWNrbHkgYWRkIGEgbmV3IHN0YXRlIHRvIHRoZSBlbmQgb2YgdGhlIHZpZXcgbGlzdFxuICAgKiB3aXRob3V0IGhhdmluZyB0byBwcm9wYWdhdGUgc3RhcnRpbmcgZnJvbSB0aGUgZmlyc3QgY2hpbGQuXG4gICAqL1xuICBbQ0hJTERfVEFJTF06IExWaWV3fExDb250YWluZXJ8bnVsbDtcblxuICAvKipcbiAgICogVmlldyB3aGVyZSB0aGlzIHZpZXcncyB0ZW1wbGF0ZSB3YXMgZGVjbGFyZWQuXG4gICAqXG4gICAqIE9ubHkgYXBwbGljYWJsZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cy4gV2lsbCBiZSBudWxsIGZvciBpbmxpbmUvY29tcG9uZW50IHZpZXdzLlxuICAgKlxuICAgKiBUaGUgdGVtcGxhdGUgZm9yIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IG1heSBiZSBkZWNsYXJlZCBpbiBhIGRpZmZlcmVudCB2aWV3IHRoYW5cbiAgICogaXQgaXMgaW5zZXJ0ZWQuIFdlIGFscmVhZHkgdHJhY2sgdGhlIFwiaW5zZXJ0aW9uIHZpZXdcIiAodmlldyB3aGVyZSB0aGUgdGVtcGxhdGUgd2FzXG4gICAqIGluc2VydGVkKSBpbiBMVmlld1tQQVJFTlRdLCBidXQgd2UgYWxzbyBuZWVkIGFjY2VzcyB0byB0aGUgXCJkZWNsYXJhdGlvbiB2aWV3XCJcbiAgICogKHZpZXcgd2hlcmUgdGhlIHRlbXBsYXRlIHdhcyBkZWNsYXJlZCkuIE90aGVyd2lzZSwgd2Ugd291bGRuJ3QgYmUgYWJsZSB0byBjYWxsIHRoZVxuICAgKiB2aWV3J3MgdGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgcHJvcGVyIGNvbnRleHRzLiBDb250ZXh0IHNob3VsZCBiZSBpbmhlcml0ZWQgZnJvbVxuICAgKiB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlLCBub3QgdGhlIGluc2VydGlvbiB2aWV3IHRyZWUuXG4gICAqXG4gICAqIEV4YW1wbGUgKEFwcENvbXBvbmVudCB0ZW1wbGF0ZSk6XG4gICAqXG4gICAqIDxuZy10ZW1wbGF0ZSAjZm9vPjwvbmctdGVtcGxhdGU+ICAgICAgIDwtLSBkZWNsYXJlZCBoZXJlIC0tPlxuICAgKiA8c29tZS1jb21wIFt0cGxdPVwiZm9vXCI+PC9zb21lLWNvbXA+ICAgIDwtLSBpbnNlcnRlZCBpbnNpZGUgdGhpcyBjb21wb25lbnQgLS0+XG4gICAqXG4gICAqIFRoZSA8bmctdGVtcGxhdGU+IGFib3ZlIGlzIGRlY2xhcmVkIGluIHRoZSBBcHBDb21wb25lbnQgdGVtcGxhdGUsIGJ1dCBpdCB3aWxsIGJlIHBhc3NlZCBpbnRvXG4gICAqIFNvbWVDb21wIGFuZCBpbnNlcnRlZCB0aGVyZS4gSW4gdGhpcyBjYXNlLCB0aGUgZGVjbGFyYXRpb24gdmlldyB3b3VsZCBiZSB0aGUgQXBwQ29tcG9uZW50LFxuICAgKiBidXQgdGhlIGluc2VydGlvbiB2aWV3IHdvdWxkIGJlIFNvbWVDb21wLiBXaGVuIHdlIGFyZSByZW1vdmluZyB2aWV3cywgd2Ugd291bGQgd2FudCB0b1xuICAgKiB0cmF2ZXJzZSB0aHJvdWdoIHRoZSBpbnNlcnRpb24gdmlldyB0byBjbGVhbiB1cCBsaXN0ZW5lcnMuIFdoZW4gd2UgYXJlIGNhbGxpbmcgdGhlXG4gICAqIHRlbXBsYXRlIGZ1bmN0aW9uIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCB3ZSBuZWVkIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRvIGdldCBpbmhlcml0ZWRcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtERUNMQVJBVElPTl9WSUVXXTogTFZpZXd8bnVsbDtcblxuXG4gIC8qKlxuICAgKiBQb2ludHMgdG8gdGhlIGRlY2xhcmF0aW9uIGNvbXBvbmVudCB2aWV3LCB1c2VkIHRvIHRyYWNrIHRyYW5zcGxhbnRlZCBgTFZpZXdgcy5cbiAgICpcbiAgICogU2VlOiBgREVDTEFSQVRJT05fVklFV2Agd2hpY2ggcG9pbnRzIHRvIHRoZSBhY3R1YWwgYExWaWV3YCB3aGVyZSBpdCB3YXMgZGVjbGFyZWQsIHdoZXJlYXNcbiAgICogYERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXYCBwb2ludHMgdG8gdGhlIGNvbXBvbmVudCB3aGljaCBtYXkgbm90IGJlIHNhbWUgYXNcbiAgICogYERFQ0xBUkFUSU9OX1ZJRVdgLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBgYGBcbiAgICogPCNWSUVXICNteUNvbXA+XG4gICAqICA8ZGl2ICpuZ0lmPVwidHJ1ZVwiPlxuICAgKiAgIDxuZy10ZW1wbGF0ZSAjbXlUbXBsPi4uLjwvbmctdGVtcGxhdGU+XG4gICAqICA8L2Rpdj5cbiAgICogPC8jVklFVz5cbiAgICogYGBgXG4gICAqIEluIHRoZSBhYm92ZSBjYXNlIGBERUNMQVJBVElPTl9WSUVXYCBmb3IgYG15VG1wbGAgcG9pbnRzIHRvIHRoZSBgTFZpZXdgIG9mIGBuZ0lmYCB3aGVyZWFzXG4gICAqIGBERUNMQVJBVElPTl9DT01QT05FTlRfVklFV2AgcG9pbnRzIHRvIGBMVmlld2Agb2YgdGhlIGBteUNvbXBgIHdoaWNoIG93bnMgdGhlIHRlbXBsYXRlLlxuICAgKlxuICAgKiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgYWxsIGVtYmVkZGVkIHZpZXdzIGFyZSBhbHdheXMgY2hlY2stYWx3YXlzIHdoZXJlYXMgdGhlIGNvbXBvbmVudFxuICAgKiB2aWV3IGNhbiBiZSBjaGVjay1hbHdheXMgb3Igb24tcHVzaC4gV2hlbiB3ZSBoYXZlIGEgdHJhbnNwbGFudGVkIHZpZXcgaXQgaXMgaW1wb3J0YW50IHRvXG4gICAqIGRldGVybWluZSBpZiB3ZSBoYXZlIHRyYW5zcGxhbnRlZCBhIHZpZXcgZnJvbSBjaGVjay1hbHdheXMgZGVjbGFyYXRpb24gdG8gb24tcHVzaCBpbnNlcnRpb25cbiAgICogcG9pbnQuIEluIHN1Y2ggYSBjYXNlIHRoZSB0cmFuc3BsYW50ZWQgdmlldyBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgYExDb250YWluZXJgIGluIHRoZVxuICAgKiBkZWNsYXJlZCBgTFZpZXdgIGFuZCBDRCBkdXJpbmcgdGhlIGRlY2xhcmVkIHZpZXcgQ0QgKGluIGFkZGl0aW9uIHRvIHRoZSBDRCBhdCB0aGUgaW5zZXJ0aW9uXG4gICAqIHBvaW50LikgKEFueSB0cmFuc3BsYW50ZWQgdmlld3Mgd2hpY2ggYXJlIGludHJhIENvbXBvbmVudCBhcmUgb2Ygbm8gaW50ZXJlc3QgYmVjYXVzZSB0aGUgQ0RcbiAgICogc3RyYXRlZ3kgb2YgZGVjbGFyYXRpb24gYW5kIGluc2VydGlvbiB3aWxsIGFsd2F5cyBiZSB0aGUgc2FtZSwgYmVjYXVzZSBpdCBpcyB0aGUgc2FtZVxuICAgKiBjb21wb25lbnQuKVxuICAgKlxuICAgKiBRdWVyaWVzIGFscmVhZHkgdHJhY2sgbW92ZWQgdmlld3MgaW4gYExWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdYCBhbmRcbiAgICogYExDb250YWluZXJbTU9WRURfVklFV1NdYC4gSG93ZXZlciB0aGUgcXVlcmllcyBhbHNvIHRyYWNrIGBMVmlld2BzIHdoaWNoIG1vdmVkIHdpdGhpbiB0aGUgc2FtZVxuICAgKiBjb21wb25lbnQgYExWaWV3YC4gVHJhbnNwbGFudGVkIHZpZXdzIGFyZSBhIHN1YnNldCBvZiBtb3ZlZCB2aWV3cywgYW5kIHdlIHVzZVxuICAgKiBgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVdgIHRvIGRpZmZlcmVudGlhdGUgdGhlbS4gQXMgaW4gdGhpcyBleGFtcGxlLlxuICAgKlxuICAgKiBFeGFtcGxlIHNob3dpbmcgaW50cmEgY29tcG9uZW50IGBMVmlld2AgbW92ZW1lbnQuXG4gICAqIGBgYFxuICAgKiA8I1ZJRVcgI215Q29tcD5cbiAgICogICA8ZGl2ICpuZ0lmPVwiY29uZGl0aW9uOyB0aGVuIHRoZW5CbG9jayBlbHNlIGVsc2VCbG9ja1wiPjwvZGl2PlxuICAgKiAgIDxuZy10ZW1wbGF0ZSAjdGhlbkJsb2NrPkNvbnRlbnQgdG8gcmVuZGVyIHdoZW4gY29uZGl0aW9uIGlzIHRydWUuPC9uZy10ZW1wbGF0ZT5cbiAgICogICA8bmctdGVtcGxhdGUgI2Vsc2VCbG9jaz5Db250ZW50IHRvIHJlbmRlciB3aGVuIGNvbmRpdGlvbiBpcyBmYWxzZS48L25nLXRlbXBsYXRlPlxuICAgKiA8LyNWSUVXPlxuICAgKiBgYGBcbiAgICogVGhlIGB0aGVuQmxvY2tgIGFuZCBgZWxzZUJsb2NrYCBpcyBtb3ZlZCBidXQgbm90IHRyYW5zcGxhbnRlZC5cbiAgICpcbiAgICogRXhhbXBsZSBzaG93aW5nIGludGVyIGNvbXBvbmVudCBgTFZpZXdgIG1vdmVtZW50ICh0cmFuc3BsYW50ZWQgdmlldykuXG4gICAqIGBgYFxuICAgKiA8I1ZJRVcgI215Q29tcD5cbiAgICogICA8bmctdGVtcGxhdGUgI215VG1wbD4uLi48L25nLXRlbXBsYXRlPlxuICAgKiAgIDxpbnNlcnRpb24tY29tcG9uZW50IFt0ZW1wbGF0ZV09XCJteVRtcGxcIj48L2luc2VydGlvbi1jb21wb25lbnQ+XG4gICAqIDwvI1ZJRVc+XG4gICAqIGBgYFxuICAgKiBJbiB0aGUgYWJvdmUgZXhhbXBsZSBgbXlUbXBsYCBpcyBwYXNzZWQgaW50byBhIGRpZmZlcmVudCBjb21wb25lbnQuIElmIGBpbnNlcnRpb24tY29tcG9uZW50YFxuICAgKiBpbnN0YW50aWF0ZXMgYG15VG1wbGAgYW5kIGBpbnNlcnRpb24tY29tcG9uZW50YCBpcyBvbi1wdXNoIHRoZW4gdGhlIGBMQ29udGFpbmVyYCBuZWVkcyB0byBiZVxuICAgKiBtYXJrZWQgYXMgY29udGFpbmluZyB0cmFuc3BsYW50ZWQgdmlld3MgYW5kIHRob3NlIHZpZXdzIG5lZWQgdG8gYmUgQ0QgYXMgcGFydCBvZiB0aGVcbiAgICogZGVjbGFyYXRpb24gQ0QuXG4gICAqXG4gICAqXG4gICAqIFdoZW4gY2hhbmdlIGRldGVjdGlvbiBydW5zLCBpdCBpdGVyYXRlcyBvdmVyIGBbTU9WRURfVklFV1NdYCBhbmQgQ0RzIGFueSBjaGlsZCBgTFZpZXdgcyB3aGVyZVxuICAgKiB0aGUgYERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXYCBvZiB0aGUgY3VycmVudCBjb21wb25lbnQgYW5kIHRoZSBjaGlsZCBgTFZpZXdgIGRvZXMgbm90IG1hdGNoXG4gICAqIChpdCBoYXMgYmVlbiB0cmFuc3BsYW50ZWQgYWNyb3NzIGNvbXBvbmVudHMuKVxuICAgKlxuICAgKiBOb3RlOiBgW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXWAgcG9pbnRzIHRvIGl0c2VsZiBpZiB0aGUgTFZpZXcgaXMgYSBjb21wb25lbnQgdmlldyAodGhlXG4gICAqICAgICAgIHNpbXBsZXN0IC8gbW9zdCBjb21tb24gY2FzZSkuXG4gICAqXG4gICAqIHNlZSBhbHNvOlxuICAgKiAgIC0gaHR0cHM6Ly9oYWNrbWQuaW8vQG1oZXZlcnkvckpVSnN2djlIIHdyaXRlIHVwIG9mIHRoZSBwcm9ibGVtXG4gICAqICAgLSBgTENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdYCBmb3IgZmxhZyB3aGljaCBtYXJrcyB3aGljaCBgTENvbnRhaW5lcmAgaGFzIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAgICogICAtIGBMQ29udGFpbmVyW1RSQU5TUExBTlRfSEVBRF1gIGFuZCBgTENvbnRhaW5lcltUUkFOU1BMQU5UX1RBSUxdYCBzdG9yYWdlIGZvciB0cmFuc3BsYW50ZWRcbiAgICogICAtIGBMVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXWAgc2ltaWxhciBwcm9ibGVtIGZvciBxdWVyaWVzXG4gICAqICAgLSBgTENvbnRhaW5lcltNT1ZFRF9WSUVXU11gIHNpbWlsYXIgcHJvYmxlbSBmb3IgcXVlcmllc1xuICAgKi9cbiAgW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTogTFZpZXc7XG5cbiAgLyoqXG4gICAqIEEgZGVjbGFyYXRpb24gcG9pbnQgb2YgZW1iZWRkZWQgdmlld3MgKG9uZXMgaW5zdGFudGlhdGVkIGJhc2VkIG9uIHRoZSBjb250ZW50IG9mIGFcbiAgICogPG5nLXRlbXBsYXRlPiksIG51bGwgZm9yIG90aGVyIHR5cGVzIG9mIHZpZXdzLlxuICAgKlxuICAgKiBXZSBuZWVkIHRvIHRyYWNrIGFsbCBlbWJlZGRlZCB2aWV3cyBjcmVhdGVkIGZyb20gYSBnaXZlbiBkZWNsYXJhdGlvbiBwb2ludCBzbyB3ZSBjYW4gcHJlcGFyZVxuICAgKiBxdWVyeSBtYXRjaGVzIGluIGEgcHJvcGVyIG9yZGVyIChxdWVyeSBtYXRjaGVzIGFyZSBvcmRlcmVkIGJhc2VkIG9uIHRoZWlyIGRlY2xhcmF0aW9uIHBvaW50IGFuZFxuICAgKiBfbm90XyB0aGUgaW5zZXJ0aW9uIHBvaW50KS5cbiAgICovXG4gIFtERUNMQVJBVElPTl9MQ09OVEFJTkVSXTogTENvbnRhaW5lcnxudWxsO1xuXG4gIC8qKlxuICAgKiBNb3JlIGZsYWdzIGZvciB0aGlzIHZpZXcuIFNlZSBQcmVPcmRlckhvb2tGbGFncyBmb3IgbW9yZSBpbmZvLlxuICAgKi9cbiAgW1BSRU9SREVSX0hPT0tfRkxBR1NdOiBQcmVPcmRlckhvb2tGbGFncztcbn1cblxuLyoqIEZsYWdzIGFzc29jaWF0ZWQgd2l0aCBhbiBMVmlldyAoc2F2ZWQgaW4gTFZpZXdbRkxBR1NdKSAqL1xuZXhwb3J0IGNvbnN0IGVudW0gTFZpZXdGbGFncyB7XG4gIC8qKiBUaGUgc3RhdGUgb2YgdGhlIGluaXQgcGhhc2Ugb24gdGhlIGZpcnN0IDIgYml0cyAqL1xuICBJbml0UGhhc2VTdGF0ZUluY3JlbWVudGVyID0gMGIwMDAwMDAwMDAwMSxcbiAgSW5pdFBoYXNlU3RhdGVNYXNrID0gMGIwMDAwMDAwMDAxMSxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHZpZXcgaXMgaW4gY3JlYXRpb25Nb2RlLlxuICAgKlxuICAgKiBUaGlzIG11c3QgYmUgc3RvcmVkIGluIHRoZSB2aWV3IHJhdGhlciB0aGFuIHVzaW5nIGBkYXRhYCBhcyBhIG1hcmtlciBzbyB0aGF0XG4gICAqIHdlIGNhbiBwcm9wZXJseSBzdXBwb3J0IGVtYmVkZGVkIHZpZXdzLiBPdGhlcndpc2UsIHdoZW4gZXhpdGluZyBhIGNoaWxkIHZpZXdcbiAgICogYmFjayBpbnRvIHRoZSBwYXJlbnQgdmlldywgYGRhdGFgIHdpbGwgYmUgZGVmaW5lZCBhbmQgYGNyZWF0aW9uTW9kZWAgd2lsbCBiZVxuICAgKiBpbXByb3Blcmx5IHJlcG9ydGVkIGFzIGZhbHNlLlxuICAgKi9cbiAgQ3JlYXRpb25Nb2RlID0gMGIwMDAwMDAwMDEwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhpcyBMVmlldyBpbnN0YW5jZSBpcyBvbiBpdHMgZmlyc3QgcHJvY2Vzc2luZyBwYXNzLlxuICAgKlxuICAgKiBBbiBMVmlldyBpbnN0YW5jZSBpcyBjb25zaWRlcmVkIHRvIGJlIG9uIGl0cyBcImZpcnN0IHBhc3NcIiB1bnRpbCBpdFxuICAgKiBoYXMgY29tcGxldGVkIG9uZSBjcmVhdGlvbiBtb2RlIHJ1biBhbmQgb25lIHVwZGF0ZSBtb2RlIHJ1bi4gQXQgdGhpc1xuICAgKiB0aW1lLCB0aGUgZmxhZyBpcyB0dXJuZWQgb2ZmLlxuICAgKi9cbiAgRmlyc3RMVmlld1Bhc3MgPSAwYjAwMDAwMDAxMDAwLFxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgdmlldyBoYXMgZGVmYXVsdCBjaGFuZ2UgZGV0ZWN0aW9uIHN0cmF0ZWd5IChjaGVja3MgYWx3YXlzKSBvciBvblB1c2ggKi9cbiAgQ2hlY2tBbHdheXMgPSAwYjAwMDAwMDEwMDAwLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCBtYW51YWwgY2hhbmdlIGRldGVjdGlvbiBpcyB0dXJuZWQgb24gZm9yIG9uUHVzaCBjb21wb25lbnRzLlxuICAgKlxuICAgKiBUaGlzIGlzIGEgc3BlY2lhbCBtb2RlIHRoYXQgb25seSBtYXJrcyBjb21wb25lbnRzIGRpcnR5IGluIHR3byBjYXNlczpcbiAgICogMSkgVGhlcmUgaGFzIGJlZW4gYSBjaGFuZ2UgdG8gYW4gQElucHV0IHByb3BlcnR5XG4gICAqIDIpIGBtYXJrRGlydHkoKWAgaGFzIGJlZW4gY2FsbGVkIG1hbnVhbGx5IGJ5IHRoZSB1c2VyXG4gICAqXG4gICAqIE5vdGUgdGhhdCBpbiB0aGlzIG1vZGUsIHRoZSBmaXJpbmcgb2YgZXZlbnRzIGRvZXMgTk9UIG1hcmsgY29tcG9uZW50c1xuICAgKiBkaXJ0eSBhdXRvbWF0aWNhbGx5LlxuICAgKlxuICAgKiBNYW51YWwgbW9kZSBpcyB0dXJuZWQgb2ZmIGJ5IGRlZmF1bHQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCBhcyBldmVudHNcbiAgICogYXV0b21hdGljYWxseSBtYXJrIE9uUHVzaCBjb21wb25lbnRzIGRpcnR5IGluIFZpZXcgRW5naW5lLlxuICAgKlxuICAgKiBUT0RPOiBBZGQgYSBwdWJsaWMgQVBJIHRvIENoYW5nZURldGVjdGlvblN0cmF0ZWd5IHRvIHR1cm4gdGhpcyBtb2RlIG9uXG4gICAqL1xuICBNYW51YWxPblB1c2ggPSAwYjAwMDAwMTAwMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGRpcnR5IChuZWVkaW5nIGNoZWNrKSAqL1xuICBEaXJ0eSA9IDBiMDAwMDAxMDAwMDAwLFxuXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgY3VycmVudGx5IGF0dGFjaGVkIHRvIGNoYW5nZSBkZXRlY3Rpb24gdHJlZS4gKi9cbiAgQXR0YWNoZWQgPSAwYjAwMDAxMDAwMDAwMCxcblxuICAvKiogV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGRlc3Ryb3llZC4gKi9cbiAgRGVzdHJveWVkID0gMGIwMDAxMDAwMDAwMDAsXG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyB0aGUgcm9vdCB2aWV3ICovXG4gIElzUm9vdCA9IDBiMDAxMDAwMDAwMDAwLFxuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgY3VycmVudCBpbml0IHBoYXNlIG9uIGxhc3QgMjIgYml0c1xuICAgKi9cbiAgSW5kZXhXaXRoaW5Jbml0UGhhc2VJbmNyZW1lbnRlciA9IDBiMDEwMDAwMDAwMDAwLFxuICBJbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0ID0gMTAsXG4gIEluZGV4V2l0aGluSW5pdFBoYXNlUmVzZXQgPSAwYjAwMTExMTExMTExMSxcbn1cblxuLyoqXG4gKiBQb3NzaWJsZSBzdGF0ZXMgb2YgdGhlIGluaXQgcGhhc2U6XG4gKiAtIDAwOiBPbkluaXQgaG9va3MgdG8gYmUgcnVuLlxuICogLSAwMTogQWZ0ZXJDb250ZW50SW5pdCBob29rcyB0byBiZSBydW5cbiAqIC0gMTA6IEFmdGVyVmlld0luaXQgaG9va3MgdG8gYmUgcnVuXG4gKiAtIDExOiBBbGwgaW5pdCBob29rcyBoYXZlIGJlZW4gcnVuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEluaXRQaGFzZVN0YXRlIHtcbiAgT25Jbml0SG9va3NUb0JlUnVuID0gMGIwMCxcbiAgQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1biA9IDBiMDEsXG4gIEFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4gPSAwYjEwLFxuICBJbml0UGhhc2VDb21wbGV0ZWQgPSAwYjExLFxufVxuXG4vKiogTW9yZSBmbGFncyBhc3NvY2lhdGVkIHdpdGggYW4gTFZpZXcgKHNhdmVkIGluIExWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdKSAqL1xuZXhwb3J0IGNvbnN0IGVudW0gUHJlT3JkZXJIb29rRmxhZ3Mge1xuICAvKipcbiAgICAgVGhlIGluZGV4IG9mIHRoZSBuZXh0IHByZS1vcmRlciBob29rIHRvIGJlIGNhbGxlZCBpbiB0aGUgaG9va3MgYXJyYXksIG9uIHRoZSBmaXJzdCAxNlxuICAgICBiaXRzXG4gICAqL1xuICBJbmRleE9mVGhlTmV4dFByZU9yZGVySG9va01hc2tNYXNrID0gMGIwMTExMTExMTExMTExMTExMSxcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBpbml0IGhvb2tzIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gY2FsbGVkLCBvbiB0aGUgbGFzdCAxNiBiaXRzXG4gICAqL1xuICBOdW1iZXJPZkluaXRIb29rc0NhbGxlZEluY3JlbWVudGVyID0gMGIwMTAwMDAwMDAwMDAwMDAwMDAsXG4gIE51bWJlck9mSW5pdEhvb2tzQ2FsbGVkU2hpZnQgPSAxNixcbiAgTnVtYmVyT2ZJbml0SG9va3NDYWxsZWRNYXNrID0gMGIxMTExMTExMTExMTExMTExMDAwMDAwMDAwMDAwMDAwMCxcbn1cblxuLyoqXG4gKiBTZXQgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gcHJvY2VzcyBob3N0IGJpbmRpbmdzIGVmZmljaWVudGx5LlxuICpcbiAqIFNlZSBWSUVXX0RBVEEubWQgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXhwYW5kb0luc3RydWN0aW9ucyBleHRlbmRzIEFycmF5PG51bWJlcnxIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+fG51bGw+IHt9XG5cbi8qKlxuICogRXhwbGljaXRseSBtYXJrcyBgVFZpZXdgIGFzIGEgc3BlY2lmaWMgdHlwZSBpbiBgbmdEZXZNb2RlYFxuICpcbiAqIEl0IGlzIHVzZWZ1bCB0byBrbm93IGNvbmNlcHR1YWxseSB3aGF0IHRpbWUgb2YgYFRWaWV3YCB3ZSBhcmUgZGVhbGluZyB3aXRoIHdoZW5cbiAqIGRlYnVnZ2luZyBhbiBhcHBsaWNhdGlvbiAoZXZlbiBpZiB0aGUgcnVudGltZSBkb2VzIG5vdCBuZWVkIGl0LikgRm9yIHRoaXMgcmVhc29uXG4gKiB3ZSBzdG9yZSB0aGlzIGluZm9ybWF0aW9uIGluIHRoZSBgbmdEZXZNb2RlYCBgVFZpZXdgIGFuZCB0aGFuIHVzZSBpdCBmb3JcbiAqIGJldHRlciBkZWJ1Z2dpbmcgZXhwZXJpZW5jZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVFZpZXdUeXBlIHtcbiAgLyoqXG4gICAqIFJvb3QgYFRWaWV3YCBpcyB0aGUgdXNlZCB0byBib290c3RyYXAgY29tcG9uZW50cyBpbnRvLiBJdCBpcyB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGhcbiAgICogYExWaWV3YCB3aGljaCB0YWtlcyBhbiBleGlzdGluZyBET00gbm9kZSBub3Qgb3duZWQgYnkgQW5ndWxhciBhbmQgd3JhcHMgaXQgaW4gYFRWaWV3YC9gTFZpZXdgXG4gICAqIHNvIHRoYXQgb3RoZXIgY29tcG9uZW50cyBjYW4gYmUgbG9hZGVkIGludG8gaXQuXG4gICAqL1xuICBSb290ID0gMCxcblxuICAvKipcbiAgICogYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYSBDb21wb25lbnQuIFRoaXMgd291bGQgYmUgdGhlIGBUVmlld2AgZGlyZWN0bHkgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBjb21wb25lbnQgdmlldyAoYXMgb3Bwb3NlZCBhbiBgRW1iZWRkZWRgIGBUVmlld2Agd2hpY2ggd291bGQgYmUgYSBjaGlsZCBvZiBgQ29tcG9uZW50YCBgVFZpZXdgKVxuICAgKi9cbiAgQ29tcG9uZW50ID0gMSxcblxuICAvKipcbiAgICogYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gU3VjaCBhcyBgKm5nSWZgLCBgPG5nLXRlbXBsYXRlPmAgZXRjLi4uIEEgYENvbXBvbmVudGBcbiAgICogY2FuIGhhdmUgemVybyBvciBtb3JlIGBFbWJlZGVkZWAgYFRWaWV3YHMuXG4gICAqL1xuICBFbWJlZGRlZCA9IDIsXG59XG5cbi8qKlxuICogVGhlIHN0YXRpYyBkYXRhIGZvciBhbiBMVmlldyAoc2hhcmVkIGJldHdlZW4gYWxsIHRlbXBsYXRlcyBvZiBhXG4gKiBnaXZlbiB0eXBlKS5cbiAqXG4gKiBTdG9yZWQgb24gdGhlIGBDb21wb25lbnREZWYudFZpZXdgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRWaWV3IHtcbiAgLyoqXG4gICAqIFR5cGUgb2YgYFRWaWV3YCAoYFJvb3RgfGBDb21wb25lbnRgfGBFbWJlZGRlZGApLlxuICAgKi9cbiAgdHlwZTogVFZpZXdUeXBlO1xuXG4gIC8qKlxuICAgKiBJRCBmb3IgaW5saW5lIHZpZXdzIHRvIGRldGVybWluZSB3aGV0aGVyIGEgdmlldyBpcyB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgdmlld1xuICAgKiBpbiBhIGNlcnRhaW4gcG9zaXRpb24uIElmIGl0J3Mgbm90LCB3ZSBrbm93IHRoZSBuZXcgdmlldyBuZWVkcyB0byBiZSBpbnNlcnRlZFxuICAgKiBhbmQgdGhlIG9uZSB0aGF0IGV4aXN0cyBuZWVkcyB0byBiZSByZW1vdmVkIChlLmcuIGlmL2Vsc2Ugc3RhdGVtZW50cylcbiAgICpcbiAgICogSWYgdGhpcyBpcyAtMSwgdGhlbiB0aGlzIGlzIGEgY29tcG9uZW50IHZpZXcgb3IgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcuXG4gICAqL1xuICByZWFkb25seSBpZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGlzIGlzIGEgYmx1ZXByaW50IHVzZWQgdG8gZ2VuZXJhdGUgTFZpZXcgaW5zdGFuY2VzIGZvciB0aGlzIFRWaWV3LiBDb3B5aW5nIHRoaXNcbiAgICogYmx1ZXByaW50IGlzIGZhc3RlciB0aGFuIGNyZWF0aW5nIGEgbmV3IExWaWV3IGZyb20gc2NyYXRjaC5cbiAgICovXG4gIGJsdWVwcmludDogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiB1c2VkIHRvIHJlZnJlc2ggdGhlIHZpZXcgb2YgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3c1xuICAgKiBhbmQgY29tcG9uZW50cy4gV2lsbCBiZSBudWxsIGZvciBpbmxpbmUgdmlld3MuXG4gICAqL1xuICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gY29udGFpbmluZyBxdWVyeS1yZWxhdGVkIGluc3RydWN0aW9ucy5cbiAgICovXG4gIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgaG9zdCBgVE5vZGVgIChub3QgcGFydCBvZiB0aGlzIFRWaWV3KS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhIGBUVmlld05vZGVgIGZvciBhbiBgTFZpZXdOb2RlYCwgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIGEgY29udGFpbmVyLlxuICAgKiBXZSBuZWVkIHRoaXMgcG9pbnRlciB0byBiZSBhYmxlIHRvIGVmZmljaWVudGx5IGZpbmQgdGhpcyBub2RlIHdoZW4gaW5zZXJ0aW5nIHRoZSB2aWV3XG4gICAqIGludG8gYW4gYW5jaG9yLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGEgYFRFbGVtZW50Tm9kZWAsIHRoaXMgaXMgdGhlIHZpZXcgb2YgYSByb290IGNvbXBvbmVudC4gSXQgaGFzIGV4YWN0bHkgb25lXG4gICAqIHJvb3QgVE5vZGUuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbnVsbCwgdGhpcyBpcyB0aGUgdmlldyBvZiBhIGNvbXBvbmVudCB0aGF0IGlzIG5vdCBhdCByb290LiBXZSBkbyBub3Qgc3RvcmVcbiAgICogdGhlIGhvc3QgVE5vZGVzIGZvciBjaGlsZCBjb21wb25lbnQgdmlld3MgYmVjYXVzZSB0aGV5IGNhbiBwb3RlbnRpYWxseSBoYXZlIHNldmVyYWxcbiAgICogZGlmZmVyZW50IGhvc3QgVE5vZGVzLCBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIGNvbXBvbmVudCBpcyBiZWluZyB1c2VkLiBUaGVzZSBob3N0XG4gICAqIFROb2RlcyBjYW5ub3QgYmUgc2hhcmVkIChkdWUgdG8gZGlmZmVyZW50IGluZGljZXMsIGV0YykuXG4gICAqL1xuICBub2RlOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgdGVtcGxhdGUgaGFzIGJlZW4gcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGUuICovXG4gIGZpcnN0Q3JlYXRlUGFzczogYm9vbGVhbjtcblxuICAvKipcbiAgICogIFdoZXRoZXIgb3Igbm90IHRoaXMgdGVtcGxhdGUgaGFzIGJlZW4gcHJvY2Vzc2VkIGluIHVwZGF0ZSBtb2RlIChlLmcuIGNoYW5nZSBkZXRlY3RlZClcbiAgICpcbiAgICogYGZpcnN0VXBkYXRlUGFzc2AgaXMgdXNlZCBieSBzdHlsaW5nIHRvIHNldCB1cCBgVERhdGFgIHRvIGNvbnRhaW4gbWV0YWRhdGEgYWJvdXQgdGhlIHN0eWxpbmdcbiAgICogaW5zdHJ1Y3Rpb25zLiAoTWFpbmx5IHRvIGJ1aWxkIHVwIGEgbGlua2VkIGxpc3Qgb2Ygc3R5bGluZyBwcmlvcml0eSBvcmRlci4pXG4gICAqXG4gICAqIFR5cGljYWxseSB0aGlzIGZ1bmN0aW9uIGdldHMgY2xlYXJlZCBhZnRlciBmaXJzdCBleGVjdXRpb24uIElmIGV4Y2VwdGlvbiBpcyB0aHJvd24gdGhlbiB0aGlzXG4gICAqIGZsYWcgY2FuIHJlbWFpbiB0dXJuZWQgdW4gdW50aWwgdGhlcmUgaXMgZmlyc3Qgc3VjY2Vzc2Z1bCAobm8gZXhjZXB0aW9uKSBwYXNzLiBUaGlzIG1lYW5zIHRoYXRcbiAgICogaW5kaXZpZHVhbCBzdHlsaW5nIGluc3RydWN0aW9ucyBrZWVwIHRyYWNrIG9mIGlmIHRoZXkgaGF2ZSBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIGxpbmtlZFxuICAgKiBsaXN0IHRvIHByZXZlbnQgZG91YmxlIGFkZGluZy5cbiAgICovXG4gIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbjtcblxuICAvKiogU3RhdGljIGRhdGEgZXF1aXZhbGVudCBvZiBMVmlldy5kYXRhW10uIENvbnRhaW5zIFROb2RlcywgUGlwZURlZkludGVybmFsIG9yIFRJMThuLiAqL1xuICBkYXRhOiBURGF0YTtcblxuICAvKipcbiAgICogVGhlIGJpbmRpbmcgc3RhcnQgaW5kZXggaXMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBkYXRhIGFycmF5XG4gICAqIHN0YXJ0cyB0byBzdG9yZSBiaW5kaW5ncyBvbmx5LiBTYXZpbmcgdGhpcyB2YWx1ZSBlbnN1cmVzIHRoYXQgd2VcbiAgICogd2lsbCBiZWdpbiByZWFkaW5nIGJpbmRpbmdzIGF0IHRoZSBjb3JyZWN0IHBvaW50IGluIHRoZSBhcnJheSB3aGVuXG4gICAqIHdlIGFyZSBpbiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogLTEgbWVhbnMgdGhhdCBpdCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQuXG4gICAqL1xuICBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggd2hlcmUgdGhlIFwiZXhwYW5kb1wiIHNlY3Rpb24gb2YgYExWaWV3YCBiZWdpbnMuIFRoZSBleHBhbmRvXG4gICAqIHNlY3Rpb24gY29udGFpbnMgaW5qZWN0b3JzLCBkaXJlY3RpdmUgaW5zdGFuY2VzLCBhbmQgaG9zdCBiaW5kaW5nIHZhbHVlcy5cbiAgICogVW5saWtlIHRoZSBcImRlY2xzXCIgYW5kIFwidmFyc1wiIHNlY3Rpb25zIG9mIGBMVmlld2AsIHRoZSBsZW5ndGggb2YgdGhpc1xuICAgKiBzZWN0aW9uIGNhbm5vdCBiZSBjYWxjdWxhdGVkIGF0IGNvbXBpbGUtdGltZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYXJlIG1hdGNoZWRcbiAgICogYXQgcnVudGltZSB0byBwcmVzZXJ2ZSBsb2NhbGl0eS5cbiAgICpcbiAgICogV2Ugc3RvcmUgdGhpcyBzdGFydCBpbmRleCBzbyB3ZSBrbm93IHdoZXJlIHRvIHN0YXJ0IGNoZWNraW5nIGhvc3QgYmluZGluZ3NcbiAgICogaW4gYHNldEhvc3RCaW5kaW5nc2AuXG4gICAqL1xuICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgYW55IHN0YXRpYyB2aWV3IHF1ZXJpZXMgdHJhY2tlZCBvbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFdlIHN0b3JlIHRoaXMgc28gd2Uga25vdyB3aGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgZG8gYSB2aWV3IHF1ZXJ5XG4gICAqIHJlZnJlc2ggYWZ0ZXIgY3JlYXRpb24gbW9kZSB0byBjb2xsZWN0IHN0YXRpYyBxdWVyeSByZXN1bHRzLlxuICAgKi9cbiAgc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBhbnkgc3RhdGljIGNvbnRlbnQgcXVlcmllcyB0cmFja2VkIG9uIHRoaXMgdmlldy5cbiAgICpcbiAgICogV2Ugc3RvcmUgdGhpcyBzbyB3ZSBrbm93IHdoZXRoZXIgb3Igbm90IHdlIHNob3VsZCBkbyBhIGNvbnRlbnQgcXVlcnlcbiAgICogcmVmcmVzaCBhZnRlciBjcmVhdGlvbiBtb2RlIHRvIGNvbGxlY3Qgc3RhdGljIHF1ZXJ5IHJlc3VsdHMuXG4gICAqL1xuICBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbjtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgbG9jYXRlZCBpbiB0aGUgdmlldy5cbiAgICovXG4gIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFNldCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byBwcm9jZXNzIGhvc3QgYmluZGluZ3MgZWZmaWNpZW50bHkuXG4gICAqXG4gICAqIFNlZSBWSUVXX0RBVEEubWQgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqL1xuICAvLyBUT0RPKG1pc2tvKTogYGV4cGFuZG9JbnN0cnVjdGlvbnNgIHNob3VsZCBiZSByZW5hbWVkIHRvIGBob3N0QmluZGluZ3NJbnN0cnVjdGlvbnNgIHNpbmNlIHRoZXlcbiAgLy8ga2VlcCB0cmFjayBvZiBgaG9zdEJpbmRpbmdzYCB3aGljaCBuZWVkIHRvIGJlIGV4ZWN1dGVkLlxuICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bGwgcmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbDtcblxuICAvKipcbiAgICogRnVsbCByZWdpc3RyeSBvZiBwaXBlcyB0aGF0IG1heSBiZSBmb3VuZCBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIFRoZSBwcm9wZXJ0eSBpcyBlaXRoZXIgYW4gYXJyYXkgb2YgYFBpcGVEZWZzYHMgb3IgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBhcnJheSBvZlxuICAgKiBgUGlwZURlZnNgcy4gVGhlIGZ1bmN0aW9uIGlzIG5lY2Vzc2FyeSB0byBiZSBhYmxlIHRvIHN1cHBvcnQgZm9yd2FyZCBkZWNsYXJhdGlvbnMuXG4gICAqXG4gICAqIEl0J3MgbmVjZXNzYXJ5IHRvIGtlZXAgYSBjb3B5IG9mIHRoZSBmdWxsIGRlZiBsaXN0IG9uIHRoZSBUVmlldyBzbyBpdCdzIHBvc3NpYmxlXG4gICAqIHRvIHJlbmRlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgd2l0aG91dCBhIGhvc3QgY29tcG9uZW50LlxuICAgKi9cbiAgcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uSW5pdCwgbmdPbkNoYW5nZXMgYW5kIG5nRG9DaGVjayBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCBmb3IgdGhpcyB2aWV3IGluXG4gICAqIGNyZWF0aW9uIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uQ2hhbmdlcyBhbmQgbmdEb0NoZWNrIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkXG4gICAqIGZvciB0aGlzIHZpZXcgaW4gY3JlYXRpb24gbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlckNvbnRlbnRDaGVja2VkIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciB0aGlzIHZpZXcgaW4gdXBkYXRlXG4gICAqIG1vZGUuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbDtcblxuICAvKipcbiAgICogQXJyYXkgb2YgbmdBZnRlclZpZXdJbml0IGFuZCBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yXG4gICAqIHRoaXMgdmlldyBpbiBjcmVhdGlvbiBtb2RlLlxuICAgKlxuICAgKiBFdmVuIGluZGljZXM6IERpcmVjdGl2ZSBpbmRleFxuICAgKiBPZGQgaW5kaWNlczogSG9vayBmdW5jdGlvblxuICAgKi9cbiAgdmlld0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ0FmdGVyVmlld0NoZWNrZWQgaG9va3MgdGhhdCBzaG91bGQgYmUgZXhlY3V0ZWQgZm9yIHRoaXMgdmlldyBpblxuICAgKiB1cGRhdGUgbW9kZS5cbiAgICpcbiAgICogRXZlbiBpbmRpY2VzOiBEaXJlY3RpdmUgaW5kZXhcbiAgICogT2RkIGluZGljZXM6IEhvb2sgZnVuY3Rpb25cbiAgICovXG4gIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBuZ09uRGVzdHJveSBob29rcyB0aGF0IHNob3VsZCBiZSBleGVjdXRlZCB3aGVuIHRoaXMgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEV2ZW4gaW5kaWNlczogRGlyZWN0aXZlIGluZGV4XG4gICAqIE9kZCBpbmRpY2VzOiBIb29rIGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95SG9va3M6IERlc3Ryb3lIb29rRGF0YXxudWxsO1xuXG4gIC8qKlxuICAgKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAgICogdW5zdWJzY3JpYmVkLiBUaGlzIGNsZWFudXAgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZGF0YSAoaW4gY2h1bmtzIG9mIDQpXG4gICAqIGFuZCBvdXRwdXQgZGF0YSAoaW4gY2h1bmtzIG9mIDIpIGZvciBhIHBhcnRpY3VsYXIgdmlldy4gQ29tYmluaW5nIHRoZSBhcnJheXNcbiAgICogc2F2ZXMgb24gbWVtb3J5ICg3MCBieXRlcyBwZXIgYXJyYXkpIGFuZCBvbiBhIGZldyBieXRlcyBvZiBjb2RlIHNpemUgKGZvciB0d29cbiAgICogc2VwYXJhdGUgZm9yIGxvb3BzKS5cbiAgICpcbiAgICogSWYgaXQncyBhIG5hdGl2ZSBET00gbGlzdGVuZXIgb3Igb3V0cHV0IHN1YnNjcmlwdGlvbiBiZWluZyBzdG9yZWQ6XG4gICAqIDFzdCBpbmRleCBpczogZXZlbnQgbmFtZSAgYG5hbWUgPSB0Vmlldy5jbGVhbnVwW2krMF1gXG4gICAqIDJuZCBpbmRleCBpczogaW5kZXggb2YgbmF0aXZlIGVsZW1lbnQgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHJpZXZlcyBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csXG4gICAqICAgICAgICAgICAgICAgZG9jdW1lbnQgb3IgYm9keSkgcmVmZXJlbmNlIGJhc2VkIG9uIHRoZSBuYXRpdmUgZWxlbWVudDpcbiAgICogICAgYHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJ2A6IGdsb2JhbCB0YXJnZXQgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqICAgIGB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdudW1iZXInYDogaW5kZXggb2YgbmF0aXZlIGVsZW1lbnRcbiAgICpcbiAgICogM3JkIGluZGV4IGlzOiBpbmRleCBvZiBsaXN0ZW5lciBmdW5jdGlvbiBgbGlzdGVuZXIgPSBsVmlld1tDTEVBTlVQXVt0Vmlldy5jbGVhbnVwW2krMl1dYFxuICAgKiA0dGggaW5kZXggaXM6IGB1c2VDYXB0dXJlT3JJbmR4ID0gdFZpZXcuY2xlYW51cFtpKzNdYFxuICAgKiAgICBgdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT0gJ2Jvb2xlYW4nIDogdXNlQ2FwdHVyZSBib29sZWFuXG4gICAqICAgIGB0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PSAnbnVtYmVyJzpcbiAgICogICAgICAgICBgdXNlQ2FwdHVyZU9ySW5keCA+PSAwYCBgcmVtb3ZlTGlzdGVuZXIgPSBMVmlld1tDTEVBTlVQXVt1c2VDYXB0dXJlT3JJbmR4XWBcbiAgICogICAgICAgICBgdXNlQ2FwdHVyZU9ySW5keCA8ICAwYCBgc3Vic2NyaXB0aW9uID0gTFZpZXdbQ0xFQU5VUF1bLXVzZUNhcHR1cmVPckluZHhdYFxuICAgKlxuICAgKiBJZiBpdCdzIGFuIG91dHB1dCBzdWJzY3JpcHRpb24gb3IgcXVlcnkgbGlzdCBkZXN0cm95IGhvb2s6XG4gICAqIDFzdCBpbmRleCBpczogb3V0cHV0IHVuc3Vic2NyaWJlIGZ1bmN0aW9uIC8gcXVlcnkgbGlzdCBkZXN0cm95IGZ1bmN0aW9uXG4gICAqIDJuZCBpbmRleCBpczogaW5kZXggb2YgZnVuY3Rpb24gY29udGV4dCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzW11cbiAgICogICAgICAgICAgICAgICBgdFZpZXcuY2xlYW51cFtpKzBdLmNhbGwobFZpZXdbQ0xFQU5VUF1bdFZpZXcuY2xlYW51cFtpKzFdXSlgXG4gICAqL1xuICBjbGVhbnVwOiBhbnlbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgZWxlbWVudCBpbmRpY2VzIGZvciBjaGlsZCBjb21wb25lbnRzIHRoYXQgd2lsbCBuZWVkIHRvIGJlXG4gICAqIHJlZnJlc2hlZCB3aGVuIHRoZSBjdXJyZW50IHZpZXcgaGFzIGZpbmlzaGVkIGl0cyBjaGVjay4gVGhlc2UgaW5kaWNlcyBoYXZlXG4gICAqIGFscmVhZHkgYmVlbiBhZGp1c3RlZCBmb3IgdGhlIEhFQURFUl9PRkZTRVQuXG4gICAqXG4gICAqL1xuICBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGNvbGxlY3Rpb24gb2YgcXVlcmllcyB0cmFja2VkIGluIGEgZ2l2ZW4gdmlldy5cbiAgICovXG4gIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGluZGljZXMgcG9pbnRpbmcgdG8gZGlyZWN0aXZlcyB3aXRoIGNvbnRlbnQgcXVlcmllcyBhbG9uZ3NpZGUgd2l0aCB0aGVcbiAgICogY29ycmVzcG9uZGluZ1xuICAgKiBxdWVyeSBpbmRleC4gRWFjaCBlbnRyeSBpbiB0aGlzIGFycmF5IGlzIGEgdHVwbGUgb2Y6XG4gICAqIC0gaW5kZXggb2YgdGhlIGZpcnN0IGNvbnRlbnQgcXVlcnkgaW5kZXggZGVjbGFyZWQgYnkgYSBnaXZlbiBkaXJlY3RpdmU7XG4gICAqIC0gaW5kZXggb2YgYSBkaXJlY3RpdmUuXG4gICAqXG4gICAqIFdlIGFyZSBzdG9yaW5nIHRob3NlIGluZGV4ZXMgc28gd2UgY2FuIHJlZnJlc2ggY29udGVudCBxdWVyaWVzIGFzIHBhcnQgb2YgYSB2aWV3IHJlZnJlc2hcbiAgICogcHJvY2Vzcy5cbiAgICovXG4gIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBTZXQgb2Ygc2NoZW1hcyB0aGF0IGRlY2xhcmUgZWxlbWVudHMgdG8gYmUgYWxsb3dlZCBpbnNpZGUgdGhlIHZpZXcuXG4gICAqL1xuICBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGw7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIGNvbnN0YW50cyBmb3IgdGhlIHZpZXcuIEluY2x1ZGVzIGF0dHJpYnV0ZSBhcnJheXMsIGxvY2FsIGRlZmluaXRpb24gYXJyYXlzIGV0Yy5cbiAgICogVXNlZCBmb3IgZGlyZWN0aXZlIG1hdGNoaW5nLCBhdHRyaWJ1dGUgYmluZGluZ3MsIGxvY2FsIGRlZmluaXRpb25zIGFuZCBtb3JlLlxuICAgKi9cbiAgY29uc3RzOiBUQ29uc3RhbnRzfG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFJvb3RDb250ZXh0RmxhZ3Mge1xuICBFbXB0eSA9IDBiMDAsXG4gIERldGVjdENoYW5nZXMgPSAwYjAxLFxuICBGbHVzaFBsYXllcnMgPSAwYjEwXG59XG5cblxuLyoqXG4gKiBSb290Q29udGV4dCBjb250YWlucyBpbmZvcm1hdGlvbiB3aGljaCBpcyBzaGFyZWQgZm9yIGFsbCBjb21wb25lbnRzIHdoaWNoXG4gKiB3ZXJlIGJvb3RzdHJhcHBlZCB3aXRoIHtAbGluayByZW5kZXJDb21wb25lbnR9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJvb3RDb250ZXh0IHtcbiAgLyoqXG4gICAqIEEgZnVuY3Rpb24gdXNlZCBmb3Igc2NoZWR1bGluZyBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBmdXR1cmUuIFVzdWFsbHlcbiAgICogdGhpcyBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYC5cbiAgICovXG4gIHNjaGVkdWxlcjogKHdvcmtGbjogKCkgPT4gdm9pZCkgPT4gdm9pZDtcblxuICAvKipcbiAgICogQSBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gYWxsIGNvbXBvbmVudHMgYXJlIGNvbnNpZGVyZWQgY2xlYW4gKG5vdCBkaXJ0eSkuXG4gICAqXG4gICAqIFRoaXMgcHJvbWlzZSBpcyBvdmVyd3JpdHRlbiBldmVyeSB0aW1lIGEgZmlyc3QgY2FsbCB0byB7QGxpbmsgbWFya0RpcnR5fSBpcyBpbnZva2VkLlxuICAgKi9cbiAgY2xlYW46IFByb21pc2U8bnVsbD47XG5cbiAgLyoqXG4gICAqIFJvb3RDb21wb25lbnRzIC0gVGhlIGNvbXBvbmVudHMgdGhhdCB3ZXJlIGluc3RhbnRpYXRlZCBieSB0aGUgY2FsbCB0b1xuICAgKiB7QGxpbmsgcmVuZGVyQ29tcG9uZW50fS5cbiAgICovXG4gIGNvbXBvbmVudHM6IHt9W107XG5cbiAgLyoqXG4gICAqIFRoZSBwbGF5ZXIgZmx1c2hpbmcgaGFuZGxlciB0byBraWNrIG9mZiBhbGwgYW5pbWF0aW9uc1xuICAgKi9cbiAgcGxheWVySGFuZGxlcjogUGxheWVySGFuZGxlcnxudWxsO1xuXG4gIC8qKlxuICAgKiBXaGF0IHJlbmRlci1yZWxhdGVkIG9wZXJhdGlvbnMgdG8gcnVuIG9uY2UgYSBzY2hlZHVsZXIgaGFzIGJlZW4gc2V0XG4gICAqL1xuICBmbGFnczogUm9vdENvbnRleHRGbGFncztcbn1cblxuLyoqIFNpbmdsZSBob29rIGNhbGxiYWNrIGZ1bmN0aW9uLiAqL1xuZXhwb3J0IHR5cGUgSG9va0ZuID0gKCkgPT4gdm9pZDtcblxuLyoqXG4gKiBJbmZvcm1hdGlvbiBuZWNlc3NhcnkgdG8gY2FsbCBhIGhvb2suIEUuZy4gdGhlIGNhbGxiYWNrIHRoYXRcbiAqIG5lZWRzIHRvIGludm9rZWQgYW5kIHRoZSBpbmRleCBhdCB3aGljaCB0byBmaW5kIGl0cyBjb250ZXh0LlxuICovXG5leHBvcnQgdHlwZSBIb29rRW50cnkgPSBudW1iZXJ8SG9va0ZuO1xuXG4vKipcbiAqIEFycmF5IG9mIGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIEZvciBlYWNoIG5vZGUgb2YgdGhlIHZpZXcsIHRoZSBmb2xsb3dpbmcgZGF0YSBpcyBzdG9yZWQ6XG4gKiAxKSBOb2RlIGluZGV4IChvcHRpb25hbClcbiAqIDIpIEEgc2VyaWVzIG9mIG51bWJlci9mdW5jdGlvbiBwYWlycyB3aGVyZTpcbiAqICAtIGV2ZW4gaW5kaWNlcyBhcmUgZGlyZWN0aXZlIGluZGljZXNcbiAqICAtIG9kZCBpbmRpY2VzIGFyZSBob29rIGZ1bmN0aW9uc1xuICpcbiAqIFNwZWNpYWwgY2FzZXM6XG4gKiAgLSBhIG5lZ2F0aXZlIGRpcmVjdGl2ZSBpbmRleCBmbGFncyBhbiBpbml0IGhvb2sgKG5nT25Jbml0LCBuZ0FmdGVyQ29udGVudEluaXQsIG5nQWZ0ZXJWaWV3SW5pdClcbiAqL1xuZXhwb3J0IHR5cGUgSG9va0RhdGEgPSBIb29rRW50cnlbXTtcblxuLyoqXG4gKiBBcnJheSBvZiBkZXN0cm95IGhvb2tzIHRoYXQgc2hvdWxkIGJlIGV4ZWN1dGVkIGZvciBhIHZpZXcgYW5kIHRoZWlyIGRpcmVjdGl2ZSBpbmRpY2VzLlxuICpcbiAqIFRoZSBhcnJheSBpcyBzZXQgdXAgYXMgYSBzZXJpZXMgb2YgbnVtYmVyL2Z1bmN0aW9uIG9yIG51bWJlci8obnVtYmVyfGZ1bmN0aW9uKVtdOlxuICogLSBFdmVuIGluZGljZXMgcmVwcmVzZW50IHRoZSBjb250ZXh0IHdpdGggd2hpY2ggaG9va3Mgc2hvdWxkIGJlIGNhbGxlZC5cbiAqIC0gT2RkIGluZGljZXMgYXJlIHRoZSBob29rIGZ1bmN0aW9ucyB0aGVtc2VsdmVzLiBJZiBhIHZhbHVlIGF0IGFuIG9kZCBpbmRleCBpcyBhbiBhcnJheSxcbiAqICAgaXQgcmVwcmVzZW50cyB0aGUgZGVzdHJveSBob29rcyBvZiBhIGBtdWx0aWAgcHJvdmlkZXIgd2hlcmU6XG4gKiAgICAgLSBFdmVuIGluZGljZXMgcmVwcmVzZW50IHRoZSBpbmRleCBvZiB0aGUgcHJvdmlkZXIgZm9yIHdoaWNoIHdlJ3ZlIHJlZ2lzdGVyZWQgYSBkZXN0cm95IGhvb2ssXG4gKiAgICAgICBpbnNpZGUgb2YgdGhlIGBtdWx0aWAgcHJvdmlkZXIgYXJyYXkuXG4gKiAgICAgLSBPZGQgaW5kaWNlcyBhcmUgdGhlIGRlc3Ryb3kgaG9vayBmdW5jdGlvbnMuXG4gKiBGb3IgZXhhbXBsZTpcbiAqIExWaWV3OiBgWzAsIDEsIDIsIEFTZXJ2aWNlLCA0LCBbQlNlcnZpY2UsIENTZXJ2aWNlLCBEU2VydmljZV1dYFxuICogZGVzdHJveUhvb2tzOiBgWzMsIEFTZXJ2aWNlLm5nT25EZXN0cm95LCA1LCBbMCwgQlNlcnZpY2UubmdPbkRlc3Ryb3ksIDIsIERTZXJ2aWNlLm5nT25EZXN0cm95XV1gXG4gKlxuICogSW4gdGhlIGV4YW1wbGUgYWJvdmUgYEFTZXJ2aWNlYCBpcyBhIHR5cGUgcHJvdmlkZXIgd2l0aCBhbiBgbmdPbkRlc3Ryb3lgLCB3aGVyZWFzIGBCU2VydmljZWAsXG4gKiBgQ1NlcnZpY2VgIGFuZCBgRFNlcnZpY2VgIGFyZSBwYXJ0IG9mIGEgYG11bHRpYCBwcm92aWRlciB3aGVyZSBvbmx5IGBCU2VydmljZWAgYW5kIGBEU2VydmljZWBcbiAqIGhhdmUgYW4gYG5nT25EZXN0cm95YCBob29rLlxuICovXG5leHBvcnQgdHlwZSBEZXN0cm95SG9va0RhdGEgPSAoSG9va0VudHJ5fEhvb2tEYXRhKVtdO1xuXG4vKipcbiAqIFN0YXRpYyBkYXRhIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGluc3RhbmNlLXNwZWNpZmljIGRhdGEgYXJyYXkgb24gYW4gTFZpZXcuXG4gKlxuICogRWFjaCBub2RlJ3Mgc3RhdGljIGRhdGEgaXMgc3RvcmVkIGluIHREYXRhIGF0IHRoZSBzYW1lIGluZGV4IHRoYXQgaXQncyBzdG9yZWRcbiAqIGluIHRoZSBkYXRhIGFycmF5LiAgQW55IG5vZGVzIHRoYXQgZG8gbm90IGhhdmUgc3RhdGljIGRhdGEgc3RvcmUgYSBudWxsIHZhbHVlIGluXG4gKiB0RGF0YSB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqXG4gKiBFYWNoIHBpcGUncyBkZWZpbml0aW9uIGlzIHN0b3JlZCBoZXJlIGF0IHRoZSBzYW1lIGluZGV4IGFzIGl0cyBwaXBlIGluc3RhbmNlIGluXG4gKiB0aGUgZGF0YSBhcnJheS5cbiAqXG4gKiBFYWNoIGhvc3QgcHJvcGVydHkncyBuYW1lIGlzIHN0b3JlZCBoZXJlIGF0IHRoZSBzYW1lIGluZGV4IGFzIGl0cyB2YWx1ZSBpbiB0aGVcbiAqIGRhdGEgYXJyYXkuXG4gKlxuICogRWFjaCBwcm9wZXJ0eSBiaW5kaW5nIG5hbWUgaXMgc3RvcmVkIGhlcmUgYXQgdGhlIHNhbWUgaW5kZXggYXMgaXRzIHZhbHVlIGluXG4gKiB0aGUgZGF0YSBhcnJheS4gSWYgdGhlIGJpbmRpbmcgaXMgYW4gaW50ZXJwb2xhdGlvbiwgdGhlIHN0YXRpYyBzdHJpbmcgdmFsdWVzXG4gKiBhcmUgc3RvcmVkIHBhcmFsbGVsIHRvIHRoZSBkeW5hbWljIHZhbHVlcy4gRXhhbXBsZTpcbiAqXG4gKiBpZD1cInByZWZpeCB7eyB2MCB9fSBhIHt7IHYxIH19IGIge3sgdjIgfX0gc3VmZml4XCJcbiAqXG4gKiBMVmlldyAgICAgICB8ICAgVFZpZXcuZGF0YVxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICB2MCB2YWx1ZSAgIHwgICAnYSdcbiAqICB2MSB2YWx1ZSAgIHwgICAnYidcbiAqICB2MiB2YWx1ZSAgIHwgICBpZCDvv70gcHJlZml4IO+/vSBzdWZmaXhcbiAqXG4gKiBJbmplY3RvciBibG9vbSBmaWx0ZXJzIGFyZSBhbHNvIHN0b3JlZCBoZXJlLlxuICovXG5leHBvcnQgdHlwZSBURGF0YSA9XG4gICAgKFROb2RlfFBpcGVEZWY8YW55PnxEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudW1iZXJ8VFN0eWxpbmdSYW5nZXxUU3R5bGluZ0tleXxcbiAgICAgVHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT58VEkxOG58STE4blVwZGF0ZU9wQ29kZXN8bnVsbHxzdHJpbmcpW107XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG4iXX0=