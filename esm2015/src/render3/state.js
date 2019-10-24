/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual } from '../util/assert';
import { assertLViewOrUndefined } from './assert';
import { BINDING_INDEX, CONTEXT, DECLARATION_VIEW, TVIEW } from './interfaces/view';
/**
 *
 * @record
 */
function LFrame() { }
if (false) {
    /**
     * Parent LFrame.
     *
     * This is needed when `leaveView` is called to restore the previous state.
     * @type {?}
     */
    LFrame.prototype.parent;
    /**
     * Child LFrame.
     *
     * This is used to cache existing LFrames to relieve the memory pressure.
     * @type {?}
     */
    LFrame.prototype.child;
    /**
     * State of the current view being processed.
     *
     * An array of nodes (text, element, container, etc), pipes, their bindings, and
     * any local variables that need to be stored between invocations.
     * @type {?}
     */
    LFrame.prototype.lView;
    /**
     * Used to set the parent property when nodes are created and track query results.
     *
     * This is used in conjection with `isParent`.
     * @type {?}
     */
    LFrame.prototype.previousOrParentTNode;
    /**
     * If `isParent` is:
     *  - `true`: then `previousOrParentTNode` points to a parent node.
     *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
     * @type {?}
     */
    LFrame.prototype.isParent;
    /**
     * Index of currently selected element in LView.
     *
     * Used by binding instructions. Updated as part of advance instruction.
     * @type {?}
     */
    LFrame.prototype.selectedIndex;
    /**
     * The last viewData retrieved by nextContext().
     * Allows building nextContext() and reference() calls.
     *
     * e.g. const inner = x().$implicit; const outer = x().$implicit;
     * @type {?}
     */
    LFrame.prototype.contextLView;
    /**
     * Store the element depth count. This is used to identify the root elements of the template
     * so that we can then attach patch data `LView` to only those elements. We know that those
     * are the only places where the patch data could change, this way we will save on number
     * of places where tha patching occurs.
     * @type {?}
     */
    LFrame.prototype.elementDepthCount;
    /**
     * Current namespace to be used when creating elements
     * @type {?}
     */
    LFrame.prototype.currentNamespace;
    /**
     * Current sanitizer
     * @type {?}
     */
    LFrame.prototype.currentSanitizer;
    /**
     * Used when processing host bindings.
     * @type {?}
     */
    LFrame.prototype.currentDirectiveDef;
    /**
     * Used as the starting directive id value.
     *
     * All subsequent directives are incremented from this value onwards.
     * The reason why this value is `1` instead of `0` is because the `0`
     * value is reserved for the template.
     * @type {?}
     */
    LFrame.prototype.activeDirectiveId;
    /**
     * The root index from which pure function instructions should calculate their binding
     * indices. In component views, this is TView.bindingStartIndex. In a host binding
     * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
     * @type {?}
     */
    LFrame.prototype.bindingRootIndex;
    /**
     * Current index of a View or Content Query which needs to be processed next.
     * We iterate over the list of Queries and increment current query index at every step.
     * @type {?}
     */
    LFrame.prototype.currentQueryIndex;
}
/**
 * All implicit instruction state is stored here.
 *
 * It is useful to have a single object where all of the state is stored as a mental model
 * (rather it being spread across many different variables.)
 *
 * PERF NOTE: Turns out that writing to a true global variable is slower than
 * having an intermediate object with properties.
 * @record
 */
function InstructionState() { }
if (false) {
    /**
     * Current `LFrame`
     *
     * `null` if we have not called `enterView`
     * @type {?}
     */
    InstructionState.prototype.lFrame;
    /**
     * Stores whether directives should be matched to elements.
     *
     * When template contains `ngNonBindable` then we need to prevent the runtime from matching
     * directives on children of that element.
     *
     * Example:
     * ```
     * <my-comp my-directive>
     *   Should match component / directive.
     * </my-comp>
     * <div ngNonBindable>
     *   <my-comp my-directive>
     *     Should not match component / directive because we are in ngNonBindable.
     *   </my-comp>
     * </div>
     * ```
     * @type {?}
     */
    InstructionState.prototype.bindingsEnabled;
    /**
     * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
     *
     * Necessary to support ChangeDetectorRef.checkNoChanges().
     * @type {?}
     */
    InstructionState.prototype.checkNoChangesMode;
    /**
     * Function to be called when the element is exited.
     *
     * NOTE: The function is here for tree shakable purposes since it is only needed by styling.
     * @type {?}
     */
    InstructionState.prototype.elementExitFn;
}
/** @type {?} */
export const instructionState = {
    lFrame: createLFrame(null),
    bindingsEnabled: true,
    elementExitFn: null,
    checkNoChangesMode: false,
};
/**
 * @return {?}
 */
export function getElementDepthCount() {
    return instructionState.lFrame.elementDepthCount;
}
/**
 * @return {?}
 */
export function increaseElementDepthCount() {
    instructionState.lFrame.elementDepthCount++;
}
/**
 * @return {?}
 */
export function decreaseElementDepthCount() {
    instructionState.lFrame.elementDepthCount--;
}
/**
 * @return {?}
 */
export function getCurrentDirectiveDef() {
    return instructionState.lFrame.currentDirectiveDef;
}
/**
 * @param {?} def
 * @return {?}
 */
export function setCurrentDirectiveDef(def) {
    instructionState.lFrame.currentDirectiveDef = def;
}
/**
 * @return {?}
 */
export function getBindingsEnabled() {
    return instructionState.bindingsEnabled;
}
/**
 * Enables directive matching on elements.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵenableBindings() {
    instructionState.bindingsEnabled = true;
}
/**
 * Disables directive matching on element.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵdisableBindings() {
    instructionState.bindingsEnabled = false;
}
/**
 * Return the current LView.
 *
 * The return value can be `null` if the method is called outside of template. This can happen if
 * directive is instantiated by module injector (rather than by node injector.)
 * @return {?}
 */
export function getLView() {
    // TODO(misko): the return value should be `LView|null` but doing so breaks a lot of code.
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    return lFrame === null ? (/** @type {?} */ (null)) : lFrame.lView;
}
/** @enum {number} */
const ActiveElementFlags = {
    Initial: 0,
    RunExitFn: 1,
    Size: 1,
};
export { ActiveElementFlags };
/**
 * Determines whether or not a flag is currently set for the active element.
 * @param {?} flag
 * @return {?}
 */
export function hasActiveElementFlag(flag) {
    return (instructionState.lFrame.selectedIndex & flag) === flag;
}
/**
 * Sets a flag is for the active element.
 * @param {?} flag
 * @return {?}
 */
function setActiveElementFlag(flag) {
    instructionState.lFrame.selectedIndex |= flag;
}
/**
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param {?=} elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 * @return {?}
 */
export function setActiveHostElement(elementIndex = null) {
    if (hasActiveElementFlag(1 /* RunExitFn */)) {
        executeElementExitFn();
    }
    setSelectedIndex(elementIndex === null ? -1 : elementIndex);
    instructionState.lFrame.activeDirectiveId = 0;
}
/**
 * @return {?}
 */
export function executeElementExitFn() {
    (/** @type {?} */ (instructionState.elementExitFn))();
    instructionState.lFrame.selectedIndex &= ~1 /* RunExitFn */;
}
/**
 * Queues a function to be run once the element is "exited" in CD.
 *
 * Change detection will focus on an element either when the `advance()`
 * instruction is called or when the template or host bindings instruction
 * code is invoked. The element is then "exited" when the next element is
 * selected or when change detection for the template or host bindings is
 * complete. When this occurs (the element change operation) then an exit
 * function will be invoked if it has been set. This function can be used
 * to assign that exit function.
 *
 * @param {?} fn
 * @return {?}
 */
export function setElementExitFn(fn) {
    setActiveElementFlag(1 /* RunExitFn */);
    if (instructionState.elementExitFn == null) {
        instructionState.elementExitFn = fn;
    }
    ngDevMode &&
        assertEqual(instructionState.elementExitFn, fn, 'Expecting to always get the same function');
}
/**
 * Returns the current id value of the current directive.
 *
 * For example we have an element that has two directives on it:
 * <div dir-one dir-two></div>
 *
 * dirOne->hostBindings() (id == 1)
 * dirTwo->hostBindings() (id == 2)
 *
 * Note that this is only active when `hostBinding` functions are being processed.
 *
 * Note that directive id values are specific to an element (this means that
 * the same id value could be present on another element with a completely
 * different set of directives).
 * @return {?}
 */
export function getActiveDirectiveId() {
    return instructionState.lFrame.activeDirectiveId;
}
/**
 * Increments the current directive id value.
 *
 * For example we have an element that has two directives on it:
 * <div dir-one dir-two></div>
 *
 * dirOne->hostBindings() (index = 1)
 * // increment
 * dirTwo->hostBindings() (index = 2)
 *
 * Depending on whether or not a previous directive had any inherited
 * directives present, that value will be incremented in addition
 * to the id jumping up by one.
 *
 * Note that this is only active when `hostBinding` functions are being processed.
 *
 * Note that directive id values are specific to an element (this means that
 * the same id value could be present on another element with a completely
 * different set of directives).
 * @return {?}
 */
export function incrementActiveDirectiveId() {
    // Each directive gets a uniqueId value that is the same for both
    // create and update calls when the hostBindings function is called. The
    // directive uniqueId is not set anywhere--it is just incremented between
    // each hostBindings call and is useful for helping instruction code
    // uniquely determine which directive is currently active when executed.
    instructionState.lFrame.activeDirectiveId += 1;
}
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * \@codeGenApi
 * @param {?} viewToRestore The OpaqueViewState instance to restore.
 *
 * @return {?}
 */
export function ɵɵrestoreView(viewToRestore) {
    instructionState.lFrame.contextLView = (/** @type {?} */ ((/** @type {?} */ (viewToRestore))));
}
/**
 * @return {?}
 */
export function getPreviousOrParentTNode() {
    return instructionState.lFrame.previousOrParentTNode;
}
/**
 * @param {?} tNode
 * @param {?} _isParent
 * @return {?}
 */
export function setPreviousOrParentTNode(tNode, _isParent) {
    instructionState.lFrame.previousOrParentTNode = tNode;
    instructionState.lFrame.isParent = _isParent;
}
/**
 * @return {?}
 */
export function getIsParent() {
    return instructionState.lFrame.isParent;
}
/**
 * @return {?}
 */
export function setIsNotParent() {
    instructionState.lFrame.isParent = false;
}
/**
 * @return {?}
 */
export function setIsParent() {
    instructionState.lFrame.isParent = true;
}
/**
 * @return {?}
 */
export function getContextLView() {
    return instructionState.lFrame.contextLView;
}
/**
 * @return {?}
 */
export function getCheckNoChangesMode() {
    return instructionState.checkNoChangesMode;
}
/**
 * @param {?} mode
 * @return {?}
 */
export function setCheckNoChangesMode(mode) {
    instructionState.checkNoChangesMode = mode;
}
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
/**
 * @return {?}
 */
export function getBindingRoot() {
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    /** @type {?} */
    let index = lFrame.bindingRootIndex;
    if (index === -1) {
        /** @type {?} */
        const lView = lFrame.lView;
        index = lFrame.bindingRootIndex = lView[BINDING_INDEX] = lView[TVIEW].bindingStartIndex;
    }
    return index;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setBindingRoot(value) {
    instructionState.lFrame.bindingRootIndex = value;
}
/**
 * @return {?}
 */
export function getCurrentQueryIndex() {
    return instructionState.lFrame.currentQueryIndex;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setCurrentQueryIndex(value) {
    instructionState.lFrame.currentQueryIndex = value;
}
/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 * @param {?} newView
 * @param {?} tNode
 * @return {?}
 */
export function enterDI(newView, tNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    /** @type {?} */
    const newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = (/** @type {?} */ (tNode));
    newLFrame.lView = newView;
    if (ngDevMode) {
        // resetting for safety in dev mode only.
        newLFrame.isParent = DEV_MODE_VALUE;
        newLFrame.selectedIndex = DEV_MODE_VALUE;
        newLFrame.contextLView = DEV_MODE_VALUE;
        newLFrame.elementDepthCount = DEV_MODE_VALUE;
        newLFrame.currentNamespace = DEV_MODE_VALUE;
        newLFrame.currentSanitizer = DEV_MODE_VALUE;
        newLFrame.currentDirectiveDef = DEV_MODE_VALUE;
        newLFrame.activeDirectiveId = DEV_MODE_VALUE;
        newLFrame.bindingRootIndex = DEV_MODE_VALUE;
        newLFrame.currentQueryIndex = DEV_MODE_VALUE;
    }
}
/** @type {?} */
const DEV_MODE_VALUE = 'Value indicating that DI is trying to read value which it should not need to know about.';
/**
 * This is a light weight version of the `leaveView` which is needed by the DI system.
 *
 * Because the implementation is same it is only an alias
 * @type {?}
 */
export const leaveDI = leaveView;
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param {?} newView New lView to become active
 * @param {?} tNode Element to which the View is a child of
 * @return {?} the previously active lView;
 */
export function enterView(newView, tNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    /** @type {?} */
    const newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = (/** @type {?} */ (tNode));
    newLFrame.isParent = true;
    newLFrame.lView = newView;
    newLFrame.selectedIndex = 0;
    newLFrame.contextLView = (/** @type {?} */ (newView));
    newLFrame.elementDepthCount = 0;
    newLFrame.currentNamespace = null;
    newLFrame.currentSanitizer = null;
    newLFrame.currentDirectiveDef = null;
    newLFrame.activeDirectiveId = 0;
    newLFrame.bindingRootIndex = -1;
    newLFrame.currentQueryIndex = 0;
}
/**
 * Allocates next free LFrame. This function tries to reuse the `LFrame`s to lower memory pressure.
 * @return {?}
 */
function allocLFrame() {
    /** @type {?} */
    const currentLFrame = instructionState.lFrame;
    /** @type {?} */
    const childLFrame = currentLFrame === null ? null : currentLFrame.child;
    /** @type {?} */
    const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
    return newLFrame;
}
/**
 * @param {?} parent
 * @return {?}
 */
function createLFrame(parent) {
    /** @type {?} */
    const lFrame = {
        previousOrParentTNode: (/** @type {?} */ (null)),
        //
        isParent: true,
        //
        lView: (/** @type {?} */ (null)),
        //
        selectedIndex: 0,
        //
        contextLView: (/** @type {?} */ (null)),
        //
        elementDepthCount: 0,
        //
        currentNamespace: null,
        //
        currentSanitizer: null,
        //
        currentDirectiveDef: null,
        //
        activeDirectiveId: 0,
        //
        bindingRootIndex: -1,
        //
        currentQueryIndex: 0,
        //
        parent: (/** @type {?} */ (parent)),
        //
        child: null,
    };
    parent !== null && (parent.child = lFrame); // link the new LFrame for reuse.
    return lFrame;
}
/**
 * @return {?}
 */
export function leaveViewProcessExit() {
    if (hasActiveElementFlag(1 /* RunExitFn */)) {
        executeElementExitFn();
    }
    leaveView();
}
/**
 * @return {?}
 */
export function leaveView() {
    instructionState.lFrame = instructionState.lFrame.parent;
}
/**
 * @template T
 * @param {?=} level
 * @return {?}
 */
export function nextContextImpl(level = 1) {
    instructionState.lFrame.contextLView = walkUpViews(level, (/** @type {?} */ (instructionState.lFrame.contextLView)));
    return (/** @type {?} */ (instructionState.lFrame.contextLView[CONTEXT]));
}
/**
 * @param {?} nestingLevel
 * @param {?} currentView
 * @return {?}
 */
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = (/** @type {?} */ (currentView[DECLARATION_VIEW]));
        nestingLevel--;
    }
    return currentView;
}
/**
 * Gets the most recent index passed to {\@link select}
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 * @return {?}
 */
export function getSelectedIndex() {
    return instructionState.lFrame.selectedIndex >> 1 /* Size */;
}
/**
 * Sets the most recent index passed to {\@link select}
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 *
 * (Note that if an "exit function" was set earlier (via `setElementExitFn()`) then that will be
 * run if and when the provided `index` value is different from the current selected index value.)
 * @param {?} index
 * @return {?}
 */
export function setSelectedIndex(index) {
    instructionState.lFrame.selectedIndex = index << 1 /* Size */;
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceSVG() {
    instructionState.lFrame.currentNamespace = 'http://www.w3.org/2000/svg';
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceMathML() {
    instructionState.lFrame.currentNamespace = 'http://www.w3.org/1998/MathML/';
}
/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceHTML() {
    namespaceHTMLInternal();
}
/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 * @return {?}
 */
export function namespaceHTMLInternal() {
    instructionState.lFrame.currentNamespace = null;
}
/**
 * @return {?}
 */
export function getNamespace() {
    return instructionState.lFrame.currentNamespace;
}
/**
 * @param {?} sanitizer
 * @return {?}
 */
export function setCurrentStyleSanitizer(sanitizer) {
    instructionState.lFrame.currentSanitizer = sanitizer;
}
/**
 * @return {?}
 */
export function resetCurrentStyleSanitizer() {
    setCurrentStyleSanitizer(null);
}
/**
 * @return {?}
 */
export function getCurrentStyleSanitizer() {
    // TODO(misko): This should throw when there is no LView, but it turns out we can get here from
    // `NodeStyleDebug` hence we return `null`. This should be fixed
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    return lFrame === null ? null : lFrame.currentSanitizer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUxRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQTBCLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7OztBQU0xRyxxQkFpR0M7Ozs7Ozs7O0lBM0ZDLHdCQUFlOzs7Ozs7O0lBT2YsdUJBQW1COzs7Ozs7OztJQVFuQix1QkFBYTs7Ozs7OztJQU9iLHVDQUE2Qjs7Ozs7OztJQU83QiwwQkFBa0I7Ozs7Ozs7SUFPbEIsK0JBQXNCOzs7Ozs7OztJQVF0Qiw4QkFBb0I7Ozs7Ozs7O0lBUXBCLG1DQUEwQjs7Ozs7SUFLMUIsa0NBQThCOzs7OztJQUs5QixrQ0FBdUM7Ozs7O0lBTXZDLHFDQUE4RDs7Ozs7Ozs7O0lBUzlELG1DQUEwQjs7Ozs7OztJQU8xQixrQ0FBeUI7Ozs7OztJQU16QixtQ0FBMEI7Ozs7Ozs7Ozs7OztBQVk1QiwrQkF5Q0M7Ozs7Ozs7O0lBbkNDLGtDQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CZiwyQ0FBeUI7Ozs7Ozs7SUFPekIsOENBQTRCOzs7Ozs7O0lBTzVCLHlDQUFpQzs7O0FBR25DLE1BQU0sT0FBTyxnQkFBZ0IsR0FBcUI7SUFDaEQsTUFBTSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDMUIsZUFBZSxFQUFFLElBQUk7SUFDckIsYUFBYSxFQUFFLElBQUk7SUFDbkIsa0JBQWtCLEVBQUUsS0FBSztDQUMxQjs7OztBQUdELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyxnQkFBZ0IsQ0FBQyxN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Z0JBQWdCLENBQUMsS0FBYTtJQUM1QyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssZ0JBQTJCLENBQUM7QUFDM0UsQ0FBQzs7Ozs7OztBQVFELE1BQU0sVUFBVSxjQUFjO0lBQzVCLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyw0QkFBNEIsQ0FBQztBQUMxRSxDQUFDOzs7Ozs7O0FBT0QsTUFBTSxVQUFVLGlCQUFpQjtJQUMvQixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsZ0NBQWdDLENBQUM7QUFDOUUsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsZUFBZTtJQUM3QixxQkFBcUIsRUFBRSxDQUFDO0FBQzFCLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUNsRCxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLFlBQVk7SUFDMUIsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7QUFDbEQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBaUM7SUFDeEUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUN2RCxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLDBCQUEwQjtJQUN4Qyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3Qjs7OztVQUdoQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTTtJQUN0QyxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIExWaWV3LCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKlxuICovXG5pbnRlcmZhY2UgTEZyYW1lIHtcbiAgLyoqXG4gICAqIFBhcmVudCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVlZGVkIHdoZW4gYGxlYXZlVmlld2AgaXMgY2FsbGVkIHRvIHJlc3RvcmUgdGhlIHByZXZpb3VzIHN0YXRlLlxuICAgKi9cbiAgcGFyZW50OiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIENoaWxkIExGcmFtZS5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIHRvIGNhY2hlIGV4aXN0aW5nIExGcmFtZXMgdG8gcmVsaWV2ZSB0aGUgbWVtb3J5IHByZXNzdXJlLlxuICAgKi9cbiAgY2hpbGQ6IExGcmFtZXxudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAgICpcbiAgICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAgICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gICAqL1xuICBsVmlldzogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGluIGNvbmplY3Rpb24gd2l0aCBgaXNQYXJlbnRgLlxuICAgKi9cbiAgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZTtcblxuICAvKipcbiAgICogSWYgYGlzUGFyZW50YCBpczpcbiAgICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICAgKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAgICovXG4gIGlzUGFyZW50OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiBjdXJyZW50bHkgc2VsZWN0ZWQgZWxlbWVudCBpbiBMVmlldy5cbiAgICpcbiAgICogVXNlZCBieSBiaW5kaW5nIGluc3RydWN0aW9ucy4gVXBkYXRlZCBhcyBwYXJ0IG9mIGFkdmFuY2UgaW5zdHJ1Y3Rpb24uXG4gICAqL1xuICBzZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICAgKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gICAqXG4gICAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gICAqL1xuICBjb250ZXh0TFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICAgKiBzbyB0aGF0IHdlIGNhbiB0aGVuIGF0dGFjaCBwYXRjaCBkYXRhIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy4gV2Uga25vdyB0aGF0IHRob3NlXG4gICAqIGFyZSB0aGUgb25seSBwbGFjZXMgd2hlcmUgdGhlIHBhdGNoIGRhdGEgY291bGQgY2hhbmdlLCB0aGlzIHdheSB3ZSB3aWxsIHNhdmUgb24gbnVtYmVyXG4gICAqIG9mIHBsYWNlcyB3aGVyZSB0aGEgcGF0Y2hpbmcgb2NjdXJzLlxuICAgKi9cbiAgZWxlbWVudERlcHRoQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBuYW1lc3BhY2UgdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGVsZW1lbnRzXG4gICAqL1xuICBjdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQ3VycmVudCBzYW5pdGl6ZXJcbiAgICovXG4gIGN1cnJlbnRTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsO1xuXG5cbiAgLyoqXG4gICAqIFVzZWQgd2hlbiBwcm9jZXNzaW5nIGhvc3QgYmluZGluZ3MuXG4gICAqL1xuICBjdXJyZW50RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsO1xuXG4gIC8qKlxuICAgKiBVc2VkIGFzIHRoZSBzdGFydGluZyBkaXJlY3RpdmUgaWQgdmFsdWUuXG4gICAqXG4gICAqIEFsbCBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGluY3JlbWVudGVkIGZyb20gdGhpcyB2YWx1ZSBvbndhcmRzLlxuICAgKiBUaGUgcmVhc29uIHdoeSB0aGlzIHZhbHVlIGlzIGAxYCBpbnN0ZWFkIG9mIGAwYCBpcyBiZWNhdXNlIHRoZSBgMGBcbiAgICogdmFsdWUgaXMgcmVzZXJ2ZWQgZm9yIHRoZSB0ZW1wbGF0ZS5cbiAgICovXG4gIGFjdGl2ZURpcmVjdGl2ZUlkOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gICAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAgICogY29udGV4dCwgdGhpcyBpcyB0aGUgVFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKyBhbnkgZGlycy9ob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAgICovXG4gIGJpbmRpbmdSb290SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBpbmRleCBvZiBhIFZpZXcgb3IgQ29udGVudCBRdWVyeSB3aGljaCBuZWVkcyB0byBiZSBwcm9jZXNzZWQgbmV4dC5cbiAgICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gICAqL1xuICBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFsbCBpbXBsaWNpdCBpbnN0cnVjdGlvbiBzdGF0ZSBpcyBzdG9yZWQgaGVyZS5cbiAqXG4gKiBJdCBpcyB1c2VmdWwgdG8gaGF2ZSBhIHNpbmdsZSBvYmplY3Qgd2hlcmUgYWxsIG9mIHRoZSBzdGF0ZSBpcyBzdG9yZWQgYXMgYSBtZW50YWwgbW9kZWxcbiAqIChyYXRoZXIgaXQgYmVpbmcgc3ByZWFkIGFjcm9zcyBtYW55IGRpZmZlcmVudCB2YXJpYWJsZXMuKVxuICpcbiAqIFBFUkYgTk9URTogVHVybnMgb3V0IHRoYXQgd3JpdGluZyB0byBhIHRydWUgZ2xvYmFsIHZhcmlhYmxlIGlzIHNsb3dlciB0aGFuXG4gKiBoYXZpbmcgYW4gaW50ZXJtZWRpYXRlIG9iamVjdCB3aXRoIHByb3BlcnRpZXMuXG4gKi9cbmludGVyZmFjZSBJbnN0cnVjdGlvblN0YXRlIHtcbiAgLyoqXG4gICAqIEN1cnJlbnQgYExGcmFtZWBcbiAgICpcbiAgICogYG51bGxgIGlmIHdlIGhhdmUgbm90IGNhbGxlZCBgZW50ZXJWaWV3YFxuICAgKi9cbiAgbEZyYW1lOiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gICAqXG4gICAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoZW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZyb20gbWF0Y2hpbmdcbiAgICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gICAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAgICogPC9teS1jb21wPlxuICAgKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gICAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICAgKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAgICogICA8L215LWNvbXA+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICovXG4gIGJpbmRpbmdzRW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSW4gdGhpcyBtb2RlLCBhbnkgY2hhbmdlcyBpbiBiaW5kaW5ncyB3aWxsIHRocm93IGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yLlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBGdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZWxlbWVudCBpcyBleGl0ZWQuXG4gICAqXG4gICAqIE5PVEU6IFRoZSBmdW5jdGlvbiBpcyBoZXJlIGZvciB0cmVlIHNoYWthYmxlIHB1cnBvc2VzIHNpbmNlIGl0IGlzIG9ubHkgbmVlZGVkIGJ5IHN0eWxpbmcuXG4gICAqL1xuICBlbGVtZW50RXhpdEZuOiAoKCkgPT4gdm9pZCl8bnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IGluc3RydWN0aW9uU3RhdGU6IEluc3RydWN0aW9uU3RhdGUgPSB7XG4gIGxGcmFtZTogY3JlYXRlTEZyYW1lKG51bGwpLFxuICBiaW5kaW5nc0VuYWJsZWQ6IHRydWUsXG4gIGVsZW1lbnRFeGl0Rm46IG51bGwsXG4gIGNoZWNrTm9DaGFuZ2VzTW9kZTogZmFsc2UsXG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmVsZW1lbnREZXB0aENvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGlyZWN0aXZlRGVmKCk6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fG51bGwge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudERpcmVjdGl2ZURlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnREaXJlY3RpdmVEZWYoZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT58IG51bGwpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudERpcmVjdGl2ZURlZiA9IGRlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBMVmlldy5cbiAqXG4gKiBUaGUgcmV0dXJuIHZhbHVlIGNhbiBiZSBgbnVsbGAgaWYgdGhlIG1ldGhvZCBpcyBjYWxsZWQgb3V0c2lkZSBvZiB0ZW1wbGF0ZS4gVGhpcyBjYW4gaGFwcGVuIGlmXG4gKiBkaXJlY3RpdmUgaXMgaW5zdGFudGlhdGVkIGJ5IG1vZHVsZSBpbmplY3RvciAocmF0aGVyIHRoYW4gYnkgbm9kZSBpbmplY3Rvci4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlldygpOiBMVmlldyB7XG4gIC8vIFRPRE8obWlza28pOiB0aGUgcmV0dXJuIHZhbHVlIHNob3VsZCBiZSBgTFZpZXd8bnVsbGAgYnV0IGRvaW5nIHNvIGJyZWFrcyBhIGxvdCBvZiBjb2RlLlxuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGxGcmFtZSA9PT0gbnVsbCA/IG51bGwgISA6IGxGcmFtZS5sVmlldztcbn1cblxuLyoqXG4gKiBGbGFncyB1c2VkIGZvciBhbiBhY3RpdmUgZWxlbWVudCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBUaGVzZSBmbGFncyBhcmUgdXNlZCB3aXRoaW4gb3RoZXIgaW5zdHJ1Y3Rpb25zIHRvIGluZm9ybSBjbGVhbnVwIG9yXG4gKiBleGl0IG9wZXJhdGlvbnMgdG8gcnVuIHdoZW4gYW4gZWxlbWVudCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoZXNlIGZsYWdzIGFyZSByZXNldCBlYWNoIHRpbWUgYW4gZWxlbWVudCBjaGFuZ2VzICh3aGV0aGVyIGl0XG4gKiBoYXBwZW5zIHdoZW4gYGFkdmFuY2UoKWAgaXMgcnVuIG9yIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBleGl0cyBvdXQgb2YgYSB0ZW1wbGF0ZVxuICogZnVuY3Rpb24gb3Igd2hlbiBhbGwgaG9zdCBiaW5kaW5ncyBhcmUgcHJvY2Vzc2VkIGZvciBhbiBlbGVtZW50KS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQWN0aXZlRWxlbWVudEZsYWdzIHtcbiAgSW5pdGlhbCA9IDBiMDAsXG4gIFJ1bkV4aXRGbiA9IDBiMDEsXG4gIFNpemUgPSAxLFxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgYSBmbGFnIGlzIGN1cnJlbnRseSBzZXQgZm9yIHRoZSBhY3RpdmUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc0FjdGl2ZUVsZW1lbnRGbGFnKGZsYWc6IEFjdGl2ZUVsZW1lbnRGbGFncykge1xuICByZXR1cm4gKGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnNlbGVjdGVkSW5kZXggJiBmbGFnKSA9PT0gZmxhZztcbn1cblxuLyoqXG4gKiBTZXRzIGEgZmxhZyBpcyBmb3IgdGhlIGFjdGl2ZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBzZXRBY3RpdmVFbGVtZW50RmxhZyhmbGFnOiBBY3RpdmVFbGVtZW50RmxhZ3MpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleCB8PSBmbGFnO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGFjdGl2ZSBkaXJlY3RpdmUgaG9zdCBlbGVtZW50IGFuZCByZXNldHMgdGhlIGRpcmVjdGl2ZSBpZCB2YWx1ZVxuICogKHdoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRJbmRleCB2YWx1ZSBoYXMgY2hhbmdlZCkuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRJbmRleCB0aGUgZWxlbWVudCBpbmRleCB2YWx1ZSBmb3IgdGhlIGhvc3QgZWxlbWVudCB3aGVyZVxuICogICAgICAgICAgICAgICAgICAgICB0aGUgZGlyZWN0aXZlL2NvbXBvbmVudCBpbnN0YW5jZSBsaXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbCkge1xuICBpZiAoaGFzQWN0aXZlRWxlbWVudEZsYWcoQWN0aXZlRWxlbWVudEZsYWdzLlJ1bkV4aXRGbikpIHtcbiAgICBleGVjdXRlRWxlbWVudEV4aXRGbigpO1xuICB9XG4gIHNldFNlbGVjdGVkSW5kZXgoZWxlbWVudEluZGV4ID09PSBudWxsID8gLTEgOiBlbGVtZW50SW5kZXgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5hY3RpdmVEaXJlY3RpdmVJZCA9IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlRWxlbWVudEV4aXRGbigpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5lbGVtZW50RXhpdEZuICEoKTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleCAmPSB+QWN0aXZlRWxlbWVudEZsYWdzLlJ1bkV4aXRGbjtcbn1cblxuLyoqXG4gKiBRdWV1ZXMgYSBmdW5jdGlvbiB0byBiZSBydW4gb25jZSB0aGUgZWxlbWVudCBpcyBcImV4aXRlZFwiIGluIENELlxuICpcbiAqIENoYW5nZSBkZXRlY3Rpb24gd2lsbCBmb2N1cyBvbiBhbiBlbGVtZW50IGVpdGhlciB3aGVuIHRoZSBgYWR2YW5jZSgpYFxuICogaW5zdHJ1Y3Rpb24gaXMgY2FsbGVkIG9yIHdoZW4gdGhlIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgaW5zdHJ1Y3Rpb25cbiAqIGNvZGUgaXMgaW52b2tlZC4gVGhlIGVsZW1lbnQgaXMgdGhlbiBcImV4aXRlZFwiIHdoZW4gdGhlIG5leHQgZWxlbWVudCBpc1xuICogc2VsZWN0ZWQgb3Igd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBpc1xuICogY29tcGxldGUuIFdoZW4gdGhpcyBvY2N1cnMgKHRoZSBlbGVtZW50IGNoYW5nZSBvcGVyYXRpb24pIHRoZW4gYW4gZXhpdFxuICogZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIGlmIGl0IGhhcyBiZWVuIHNldC4gVGhpcyBmdW5jdGlvbiBjYW4gYmUgdXNlZFxuICogdG8gYXNzaWduIHRoYXQgZXhpdCBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEVsZW1lbnRFeGl0Rm4oZm46ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgc2V0QWN0aXZlRWxlbWVudEZsYWcoQWN0aXZlRWxlbWVudEZsYWdzLlJ1bkV4aXRGbik7XG4gIGlmIChpbnN0cnVjdGlvblN0YXRlLmVsZW1lbnRFeGl0Rm4gPT0gbnVsbCkge1xuICAgIGluc3RydWN0aW9uU3RhdGUuZWxlbWVudEV4aXRGbiA9IGZuO1xuICB9XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoaW5zdHJ1Y3Rpb25TdGF0ZS5lbGVtZW50RXhpdEZuLCBmbiwgJ0V4cGVjdGluZyB0byBhbHdheXMgZ2V0IHRoZSBzYW1lIGZ1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBpZCB2YWx1ZSBvZiB0aGUgY3VycmVudCBkaXJlY3RpdmUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSBhbiBlbGVtZW50IHRoYXQgaGFzIHR3byBkaXJlY3RpdmVzIG9uIGl0OlxuICogPGRpdiBkaXItb25lIGRpci10d28+PC9kaXY+XG4gKlxuICogZGlyT25lLT5ob3N0QmluZGluZ3MoKSAoaWQgPT0gMSlcbiAqIGRpclR3by0+aG9zdEJpbmRpbmdzKCkgKGlkID09IDIpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIE5vdGUgdGhhdCBkaXJlY3RpdmUgaWQgdmFsdWVzIGFyZSBzcGVjaWZpYyB0byBhbiBlbGVtZW50ICh0aGlzIG1lYW5zIHRoYXRcbiAqIHRoZSBzYW1lIGlkIHZhbHVlIGNvdWxkIGJlIHByZXNlbnQgb24gYW5vdGhlciBlbGVtZW50IHdpdGggYSBjb21wbGV0ZWx5XG4gKiBkaWZmZXJlbnQgc2V0IG9mIGRpcmVjdGl2ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5hY3RpdmVEaXJlY3RpdmVJZDtcbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSBpZCB2YWx1ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIGFuIGVsZW1lbnQgdGhhdCBoYXMgdHdvIGRpcmVjdGl2ZXMgb24gaXQ6XG4gKiA8ZGl2IGRpci1vbmUgZGlyLXR3bz48L2Rpdj5cbiAqXG4gKiBkaXJPbmUtPmhvc3RCaW5kaW5ncygpIChpbmRleCA9IDEpXG4gKiAvLyBpbmNyZW1lbnRcbiAqIGRpclR3by0+aG9zdEJpbmRpbmdzKCkgKGluZGV4ID0gMilcbiAqXG4gKiBEZXBlbmRpbmcgb24gd2hldGhlciBvciBub3QgYSBwcmV2aW91cyBkaXJlY3RpdmUgaGFkIGFueSBpbmhlcml0ZWRcbiAqIGRpcmVjdGl2ZXMgcHJlc2VudCwgdGhhdCB2YWx1ZSB3aWxsIGJlIGluY3JlbWVudGVkIGluIGFkZGl0aW9uXG4gKiB0byB0aGUgaWQganVtcGluZyB1cCBieSBvbmUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIE5vdGUgdGhhdCBkaXJlY3RpdmUgaWQgdmFsdWVzIGFyZSBzcGVjaWZpYyB0byBhbiBlbGVtZW50ICh0aGlzIG1lYW5zIHRoYXRcbiAqIHRoZSBzYW1lIGlkIHZhbHVlIGNvdWxkIGJlIHByZXNlbnQgb24gYW5vdGhlciBlbGVtZW50IHdpdGggYSBjb21wbGV0ZWx5XG4gKiBkaWZmZXJlbnQgc2V0IG9mIGRpcmVjdGl2ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKSB7XG4gIC8vIEVhY2ggZGlyZWN0aXZlIGdldHMgYSB1bmlxdWVJZCB2YWx1ZSB0aGF0IGlzIHRoZSBzYW1lIGZvciBib3RoXG4gIC8vIGNyZWF0ZSBhbmQgdXBkYXRlIGNhbGxzIHdoZW4gdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQuIFRoZVxuICAvLyBkaXJlY3RpdmUgdW5pcXVlSWQgaXMgbm90IHNldCBhbnl3aGVyZS0taXQgaXMganVzdCBpbmNyZW1lbnRlZCBiZXR3ZWVuXG4gIC8vIGVhY2ggaG9zdEJpbmRpbmdzIGNhbGwgYW5kIGlzIHVzZWZ1bCBmb3IgaGVscGluZyBpbnN0cnVjdGlvbiBjb2RlXG4gIC8vIHVuaXF1ZWx5IGRldGVybWluZSB3aGljaCBkaXJlY3RpdmUgaXMgY3VycmVudGx5IGFjdGl2ZSB3aGVuIGV4ZWN1dGVkLlxuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5hY3RpdmVEaXJlY3RpdmVJZCArPSAxO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZTogVE5vZGUsIF9pc1BhcmVudDogYm9vbGVhbikge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJc1BhcmVudCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNOb3RQYXJlbnQoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0SXNQYXJlbnQoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHRMVmlldygpOiBMVmlldyB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmNoZWNrTm9DaGFuZ2VzTW9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENoZWNrTm9DaGFuZ2VzTW9kZShtb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUuY2hlY2tOb0NoYW5nZXNNb2RlID0gbW9kZTtcbn1cblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgbGV0IGluZGV4ID0gbEZyYW1lLmJpbmRpbmdSb290SW5kZXg7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBjb25zdCBsVmlldyA9IGxGcmFtZS5sVmlldztcbiAgICBpbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gPSBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXg7XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QmluZGluZ1Jvb3QodmFsdWU6IG51bWJlcikge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50UXVlcnlJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50UXVlcnlJbmRleCh2YWx1ZTogbnVtYmVyKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnRRdWVyeUluZGV4ID0gdmFsdWU7XG59XG5cbi8qKlxuICogVGhpcyBpcyBhIGxpZ2h0IHdlaWdodCB2ZXJzaW9uIG9mIHRoZSBgZW50ZXJWaWV3YCB3aGljaCBpcyBuZWVkZWQgYnkgdGhlIERJIHN5c3RlbS5cbiAqIEBwYXJhbSBuZXdWaWV3XG4gKiBAcGFyYW0gdE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyREkobmV3VmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZChuZXdWaWV3KTtcbiAgY29uc3QgbmV3TEZyYW1lID0gYWxsb2NMRnJhbWUoKTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBuZXdMRnJhbWU7XG4gIG5ld0xGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZSAhO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gcmVzZXR0aW5nIGZvciBzYWZldHkgaW4gZGV2IG1vZGUgb25seS5cbiAgICBuZXdMRnJhbWUuaXNQYXJlbnQgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuc2VsZWN0ZWRJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jb250ZXh0TFZpZXcgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuZWxlbWVudERlcHRoQ291bnQgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50U2FuaXRpemVyID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnREaXJlY3RpdmVEZWYgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuYWN0aXZlRGlyZWN0aXZlSWQgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICB9XG59XG5cbmNvbnN0IERFVl9NT0RFX1ZBTFVFOiBhbnkgPVxuICAgICdWYWx1ZSBpbmRpY2F0aW5nIHRoYXQgREkgaXMgdHJ5aW5nIHRvIHJlYWQgdmFsdWUgd2hpY2ggaXQgc2hvdWxkIG5vdCBuZWVkIHRvIGtub3cgYWJvdXQuJztcblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBsZWF2ZVZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICpcbiAqIEJlY2F1c2UgdGhlIGltcGxlbWVudGF0aW9uIGlzIHNhbWUgaXQgaXMgb25seSBhbiBhbGlhc1xuICovXG5leHBvcnQgY29uc3QgbGVhdmVESSA9IGxlYXZlVmlldztcblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IGxWaWV3IHdpdGggYSBuZXcgbFZpZXcuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIGxWaWV3IGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIGxWaWV3IGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IGxWaWV3IHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSB0Tm9kZSBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZChuZXdWaWV3KTtcbiAgY29uc3QgbmV3TEZyYW1lID0gYWxsb2NMRnJhbWUoKTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBuZXdMRnJhbWU7XG4gIG5ld0xGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZSAhO1xuICBuZXdMRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBuZXdMRnJhbWUuc2VsZWN0ZWRJbmRleCA9IDA7XG4gIG5ld0xGcmFtZS5jb250ZXh0TFZpZXcgPSBuZXdWaWV3ICE7XG4gIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbiAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBudWxsO1xuICBuZXdMRnJhbWUuY3VycmVudERpcmVjdGl2ZURlZiA9IG51bGw7XG4gIG5ld0xGcmFtZS5hY3RpdmVEaXJlY3RpdmVJZCA9IDA7XG4gIG5ld0xGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gLTE7XG4gIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IDA7XG59XG5cbi8qKlxuICogQWxsb2NhdGVzIG5leHQgZnJlZSBMRnJhbWUuIFRoaXMgZnVuY3Rpb24gdHJpZXMgdG8gcmV1c2UgdGhlIGBMRnJhbWVgcyB0byBsb3dlciBtZW1vcnkgcHJlc3N1cmUuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jTEZyYW1lKCkge1xuICBjb25zdCBjdXJyZW50TEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGNvbnN0IGNoaWxkTEZyYW1lID0gY3VycmVudExGcmFtZSA9PT0gbnVsbCA/IG51bGwgOiBjdXJyZW50TEZyYW1lLmNoaWxkO1xuICBjb25zdCBuZXdMRnJhbWUgPSBjaGlsZExGcmFtZSA9PT0gbnVsbCA/IGNyZWF0ZUxGcmFtZShjdXJyZW50TEZyYW1lKSA6IGNoaWxkTEZyYW1lO1xuICByZXR1cm4gbmV3TEZyYW1lO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMRnJhbWUocGFyZW50OiBMRnJhbWUgfCBudWxsKTogTEZyYW1lIHtcbiAgY29uc3QgbEZyYW1lOiBMRnJhbWUgPSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlOiBudWxsICEsICAvL1xuICAgIGlzUGFyZW50OiB0cnVlLCAgICAgICAgICAgICAgICAgLy9cbiAgICBsVmlldzogbnVsbCAhLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgc2VsZWN0ZWRJbmRleDogMCwgICAgICAgICAgICAgICAvL1xuICAgIGNvbnRleHRMVmlldzogbnVsbCAhLCAgICAgICAgICAgLy9cbiAgICBlbGVtZW50RGVwdGhDb3VudDogMCwgICAgICAgICAgIC8vXG4gICAgY3VycmVudE5hbWVzcGFjZTogbnVsbCwgICAgICAgICAvL1xuICAgIGN1cnJlbnRTYW5pdGl6ZXI6IG51bGwsICAgICAgICAgLy9cbiAgICBjdXJyZW50RGlyZWN0aXZlRGVmOiBudWxsLCAgICAgIC8vXG4gICAgYWN0aXZlRGlyZWN0aXZlSWQ6IDAsICAgICAgICAgICAvL1xuICAgIGJpbmRpbmdSb290SW5kZXg6IC0xLCAgICAgICAgICAgLy9cbiAgICBjdXJyZW50UXVlcnlJbmRleDogMCwgICAgICAgICAgIC8vXG4gICAgcGFyZW50OiBwYXJlbnQgISwgICAgICAgICAgICAgICAvL1xuICAgIGNoaWxkOiBudWxsLCAgICAgICAgICAgICAgICAgICAgLy9cbiAgfTtcbiAgcGFyZW50ICE9PSBudWxsICYmIChwYXJlbnQuY2hpbGQgPSBsRnJhbWUpOyAgLy8gbGluayB0aGUgbmV3IExGcmFtZSBmb3IgcmV1c2UuXG4gIHJldHVybiBsRnJhbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXdQcm9jZXNzRXhpdCgpIHtcbiAgaWYgKGhhc0FjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pKSB7XG4gICAgZXhlY3V0ZUVsZW1lbnRFeGl0Rm4oKTtcbiAgfVxuICBsZWF2ZVZpZXcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dEltcGw8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3ID0gd2Fsa1VwVmlld3MobGV2ZWwsIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyAhKTtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3KTogTFZpZXcge1xuICB3aGlsZSAobmVzdGluZ0xldmVsID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAnRGVjbGFyYXRpb24gdmlldyBzaG91bGQgYmUgZGVmaW5lZCBpZiBuZXN0aW5nIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBuZXN0aW5nTGV2ZWwtLTtcbiAgfVxuICByZXR1cm4gY3VycmVudFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleCA+PiBBY3RpdmVFbGVtZW50RmxhZ3MuU2l6ZTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqXG4gKiAoTm90ZSB0aGF0IGlmIGFuIFwiZXhpdCBmdW5jdGlvblwiIHdhcyBzZXQgZWFybGllciAodmlhIGBzZXRFbGVtZW50RXhpdEZuKClgKSB0aGVuIHRoYXQgd2lsbCBiZVxuICogcnVuIGlmIGFuZCB3aGVuIHRoZSBwcm92aWRlZCBgaW5kZXhgIHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGVkIGluZGV4IHZhbHVlLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4ID0gaW5kZXggPDwgQWN0aXZlRWxlbWVudEZsYWdzLlNpemU7XG59XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlTWF0aE1MKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VIVE1MKCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFNhbml0aXplciA9IHNhbml0aXplcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIobnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIC8vIFRPRE8obWlza28pOiBUaGlzIHNob3VsZCB0aHJvdyB3aGVuIHRoZXJlIGlzIG5vIExWaWV3LCBidXQgaXQgdHVybnMgb3V0IHdlIGNhbiBnZXQgaGVyZSBmcm9tXG4gIC8vIGBOb2RlU3R5bGVEZWJ1Z2AgaGVuY2Ugd2UgcmV0dXJuIGBudWxsYC4gVGhpcyBzaG91bGQgYmUgZml4ZWRcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIHJldHVybiBsRnJhbWUgPT09IG51bGwgPyBudWxsIDogbEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXI7XG59XG4iXX0=