/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/state.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../util/assert';
import { assertLViewOrUndefined } from './assert';
import { CONTEXT, DECLARATION_VIEW, TVIEW } from './interfaces/view';
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
     * This is used in conjunction with `isParent`.
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
     * Current pointer to the binding index.
     * @type {?}
     */
    LFrame.prototype.bindingIndex;
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
    /**
     * When host binding is executing this points to the directive index.
     * `TView.data[currentDirectiveIndex]` is `DirectiveDef`
     * `LView[currentDirectiveIndex]` is directive instance.
     * @type {?}
     */
    LFrame.prototype.currentDirectiveIndex;
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
}
/** @type {?} */
export const instructionState = {
    lFrame: createLFrame(null),
    bindingsEnabled: true,
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
    // TODO(misko): remove this from the LView since it is ngDevMode=true mode only.
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
        index = lFrame.bindingRootIndex = lView[TVIEW].bindingStartIndex;
    }
    return index;
}
/**
 * @return {?}
 */
export function getBindingIndex() {
    return instructionState.lFrame.bindingIndex;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setBindingIndex(value) {
    return instructionState.lFrame.bindingIndex = value;
}
/**
 * @return {?}
 */
export function nextBindingIndex() {
    return instructionState.lFrame.bindingIndex++;
}
/**
 * @param {?} count
 * @return {?}
 */
export function incrementBindingIndex(count) {
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    /** @type {?} */
    const index = lFrame.bindingIndex;
    lFrame.bindingIndex = lFrame.bindingIndex + count;
    return index;
}
/**
 * Set a new binding root index so that host template functions can execute.
 *
 * Bindings inside the host template are 0 index. But because we don't know ahead of time
 * how many host bindings we have we can't pre-compute them. For this reason they are all
 * 0 index and we just shift the root so that they match next available location in the LView.
 *
 * @param {?} bindingRootIndex Root index for `hostBindings`
 * @param {?} currentDirectiveIndex `TData[currentDirectiveIndex]` will point to the current directive
 *        whose `hostBindings` are being processed.
 * @return {?}
 */
export function setBindingRootForHostBindings(bindingRootIndex, currentDirectiveIndex) {
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
    lFrame.currentDirectiveIndex = currentDirectiveIndex;
}
/**
 * When host binding is executing this points to the directive index.
 * `TView.data[getCurrentDirectiveIndex()]` is `DirectiveDef`
 * `LView[getCurrentDirectiveIndex()]` is directive instance.
 * @return {?}
 */
export function getCurrentDirectiveIndex() {
    return instructionState.lFrame.currentDirectiveIndex;
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
    newLFrame.currentDirectiveIndex = -1;
    newLFrame.currentNamespace = null;
    newLFrame.currentSanitizer = null;
    newLFrame.bindingRootIndex = -1;
    newLFrame.bindingIndex = newView === null ? -1 : newView[TVIEW].bindingStartIndex;
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
        currentDirectiveIndex: -1,
        //
        bindingRootIndex: -1,
        //
        bindingIndex: -1,
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
export function leaveView() {
    instructionState.lFrame = instructionState.lFrame.parent;
}
/**
 * @template T
 * @param {?} level
 * @return {?}
 */
export function nextContextImpl(level) {
    /** @type {?} */
    const contextLView = instructionState.lFrame.contextLView =
        walkUpViews(level, (/** @type {?} */ (instructionState.lFrame.contextLView)));
    return (/** @type {?} */ (contextLView[CONTEXT]));
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
 * Gets the currently selected element index.
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 * @return {?}
 */
export function getSelectedIndex() {
    return instructionState.lFrame.selectedIndex;
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
    instructionState.lFrame.selectedIndex = index;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBMEIsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7O0FBTTNGLHFCQStGQzs7Ozs7Ozs7SUF6RkMsd0JBQWU7Ozs7Ozs7SUFPZix1QkFBbUI7Ozs7Ozs7O0lBUW5CLHVCQUFhOzs7Ozs7O0lBT2IsdUNBQTZCOzs7Ozs7O0lBTzdCLDBCQUFrQjs7Ozs7OztJQU9sQiwrQkFBc0I7Ozs7O0lBS3RCLDhCQUFxQjs7Ozs7Ozs7SUFRckIsOEJBQW9COzs7Ozs7OztJQVFwQixtQ0FBMEI7Ozs7O0lBSzFCLGtDQUE4Qjs7Ozs7SUFLOUIsa0NBQXVDOzs7Ozs7O0lBUXZDLGtDQUF5Qjs7Ozs7O0lBTXpCLG1DQUEwQjs7Ozs7OztJQU8xQix1Q0FBOEI7Ozs7Ozs7Ozs7OztBQVloQywrQkFrQ0M7Ozs7Ozs7O0lBNUJDLGtDQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CZiwyQ0FBeUI7Ozs7Ozs7SUFPekIsOENBQTRCOzs7QUFHOUIsTUFBTSxPQUFPLGdCQUFnQixHQUFxQjtJQUNoRCxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQztJQUMxQixlQUFlLEVBQUUsSUFBSTtJQUNyQixrQkFBa0IsRUFBRSxLQUFLO0NBQzFCOzs7O0FBR0QsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztBQUNuRCxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2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Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFhO0lBQzVDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQ2hELENBQUM7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsY0FBYztJQUM1QixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsNEJBQTRCLENBQUM7QUFDMUUsQ0FBQzs7Ozs7OztBQU9ELE1BQU0sVUFBVSxpQkFBaUI7SUFDL0IsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLGdDQUFnQyxDQUFDO0FBQzlFLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGVBQWU7SUFDN0IscUJBQXFCLEVBQUUsQ0FBQztBQUMxQixDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDbEQsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSxZQUFZO0lBQzFCLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQ2xELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLFNBQWlDO0lBQ3hFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7QUFDdkQsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSwwQkFBMEI7SUFDeEMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0I7Ozs7VUFHaEMsTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU07SUFDdEMsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TFZpZXdPclVuZGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBMVmlldywgT3BhcXVlVmlld1N0YXRlLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cbi8qKlxuICpcbiAqL1xuaW50ZXJmYWNlIExGcmFtZSB7XG4gIC8qKlxuICAgKiBQYXJlbnQgTEZyYW1lLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCB3aGVuIGBsZWF2ZVZpZXdgIGlzIGNhbGxlZCB0byByZXN0b3JlIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgICovXG4gIHBhcmVudDogTEZyYW1lO1xuXG4gIC8qKlxuICAgKiBDaGlsZCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjYWNoZSBleGlzdGluZyBMRnJhbWVzIHRvIHJlbGlldmUgdGhlIG1lbW9yeSBwcmVzc3VyZS5cbiAgICovXG4gIGNoaWxkOiBMRnJhbWV8bnVsbDtcblxuICAvKipcbiAgICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gICAqXG4gICAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gICAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICAgKi9cbiAgbFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQgYW5kIHRyYWNrIHF1ZXJ5IHJlc3VsdHMuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGBpc1BhcmVudGAuXG4gICAqL1xuICBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG4gIC8qKlxuICAgKiBJZiBgaXNQYXJlbnRgIGlzOlxuICAgKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gICAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICAgKi9cbiAgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50IGluIExWaWV3LlxuICAgKlxuICAgKiBVc2VkIGJ5IGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLiBVcGRhdGVkIGFzIHBhcnQgb2YgYWR2YW5jZSBpbnN0cnVjdGlvbi5cbiAgICovXG4gIHNlbGVjdGVkSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBwb2ludGVyIHRvIHRoZSBiaW5kaW5nIGluZGV4LlxuICAgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICAgKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gICAqXG4gICAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gICAqL1xuICBjb250ZXh0TFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICAgKiBzbyB0aGF0IHdlIGNhbiB0aGVuIGF0dGFjaCBwYXRjaCBkYXRhIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy4gV2Uga25vdyB0aGF0IHRob3NlXG4gICAqIGFyZSB0aGUgb25seSBwbGFjZXMgd2hlcmUgdGhlIHBhdGNoIGRhdGEgY291bGQgY2hhbmdlLCB0aGlzIHdheSB3ZSB3aWxsIHNhdmUgb24gbnVtYmVyXG4gICAqIG9mIHBsYWNlcyB3aGVyZSB0aGEgcGF0Y2hpbmcgb2NjdXJzLlxuICAgKi9cbiAgZWxlbWVudERlcHRoQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBuYW1lc3BhY2UgdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGVsZW1lbnRzXG4gICAqL1xuICBjdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQ3VycmVudCBzYW5pdGl6ZXJcbiAgICovXG4gIGN1cnJlbnRTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsO1xuXG5cbiAgLyoqXG4gICAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gICAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAgICogY29udGV4dCwgdGhpcyBpcyB0aGUgVFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKyBhbnkgZGlycy9ob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAgICovXG4gIGJpbmRpbmdSb290SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBpbmRleCBvZiBhIFZpZXcgb3IgQ29udGVudCBRdWVyeSB3aGljaCBuZWVkcyB0byBiZSBwcm9jZXNzZWQgbmV4dC5cbiAgICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gICAqL1xuICBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGhvc3QgYmluZGluZyBpcyBleGVjdXRpbmcgdGhpcyBwb2ludHMgdG8gdGhlIGRpcmVjdGl2ZSBpbmRleC5cbiAgICogYFRWaWV3LmRhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XWAgaXMgYERpcmVjdGl2ZURlZmBcbiAgICogYExWaWV3W2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIGlzIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICovXG4gIGN1cnJlbnREaXJlY3RpdmVJbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFsbCBpbXBsaWNpdCBpbnN0cnVjdGlvbiBzdGF0ZSBpcyBzdG9yZWQgaGVyZS5cbiAqXG4gKiBJdCBpcyB1c2VmdWwgdG8gaGF2ZSBhIHNpbmdsZSBvYmplY3Qgd2hlcmUgYWxsIG9mIHRoZSBzdGF0ZSBpcyBzdG9yZWQgYXMgYSBtZW50YWwgbW9kZWxcbiAqIChyYXRoZXIgaXQgYmVpbmcgc3ByZWFkIGFjcm9zcyBtYW55IGRpZmZlcmVudCB2YXJpYWJsZXMuKVxuICpcbiAqIFBFUkYgTk9URTogVHVybnMgb3V0IHRoYXQgd3JpdGluZyB0byBhIHRydWUgZ2xvYmFsIHZhcmlhYmxlIGlzIHNsb3dlciB0aGFuXG4gKiBoYXZpbmcgYW4gaW50ZXJtZWRpYXRlIG9iamVjdCB3aXRoIHByb3BlcnRpZXMuXG4gKi9cbmludGVyZmFjZSBJbnN0cnVjdGlvblN0YXRlIHtcbiAgLyoqXG4gICAqIEN1cnJlbnQgYExGcmFtZWBcbiAgICpcbiAgICogYG51bGxgIGlmIHdlIGhhdmUgbm90IGNhbGxlZCBgZW50ZXJWaWV3YFxuICAgKi9cbiAgbEZyYW1lOiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gICAqXG4gICAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoZW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZyb20gbWF0Y2hpbmdcbiAgICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gICAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAgICogPC9teS1jb21wPlxuICAgKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gICAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICAgKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAgICogICA8L215LWNvbXA+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICovXG4gIGJpbmRpbmdzRW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSW4gdGhpcyBtb2RlLCBhbnkgY2hhbmdlcyBpbiBiaW5kaW5ncyB3aWxsIHRocm93IGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yLlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgaW5zdHJ1Y3Rpb25TdGF0ZTogSW5zdHJ1Y3Rpb25TdGF0ZSA9IHtcbiAgbEZyYW1lOiBjcmVhdGVMRnJhbWUobnVsbCksXG4gIGJpbmRpbmdzRW5hYmxlZDogdHJ1ZSxcbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBmYWxzZSxcbn07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnREZXB0aENvdW50KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBMVmlldy5cbiAqXG4gKiBUaGUgcmV0dXJuIHZhbHVlIGNhbiBiZSBgbnVsbGAgaWYgdGhlIG1ldGhvZCBpcyBjYWxsZWQgb3V0c2lkZSBvZiB0ZW1wbGF0ZS4gVGhpcyBjYW4gaGFwcGVuIGlmXG4gKiBkaXJlY3RpdmUgaXMgaW5zdGFudGlhdGVkIGJ5IG1vZHVsZSBpbmplY3RvciAocmF0aGVyIHRoYW4gYnkgbm9kZSBpbmplY3Rvci4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlldygpOiBMVmlldyB7XG4gIC8vIFRPRE8obWlza28pOiB0aGUgcmV0dXJuIHZhbHVlIHNob3VsZCBiZSBgTFZpZXd8bnVsbGAgYnV0IGRvaW5nIHNvIGJyZWFrcyBhIGxvdCBvZiBjb2RlLlxuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGxGcmFtZSA9PT0gbnVsbCA/IG51bGwgISA6IGxGcmFtZS5sVmlldztcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpOiBUTm9kZSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGU6IFROb2RlLCBfaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUucHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gX2lzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXNQYXJlbnQoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldElzTm90UGFyZW50KCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudCA9IGZhbHNlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldElzUGFyZW50KCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudCA9IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk6IGJvb2xlYW4ge1xuICAvLyBUT0RPKG1pc2tvKTogcmVtb3ZlIHRoaXMgZnJvbSB0aGUgTFZpZXcgc2luY2UgaXQgaXMgbmdEZXZNb2RlPXRydWUgbW9kZSBvbmx5LlxuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5jaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVja05vQ2hhbmdlc01vZGUobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmNoZWNrTm9DaGFuZ2VzTW9kZSA9IG1vZGU7XG59XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGxldCBpbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4O1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgY29uc3QgbFZpZXcgPSBsRnJhbWUubFZpZXc7XG4gICAgaW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdJbmRleCh2YWx1ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdJbmRleCA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV4dEJpbmRpbmdJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoY291bnQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBpbmRleCA9IGxGcmFtZS5iaW5kaW5nSW5kZXg7XG4gIGxGcmFtZS5iaW5kaW5nSW5kZXggPSBsRnJhbWUuYmluZGluZ0luZGV4ICsgY291bnQ7XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBTZXQgYSBuZXcgYmluZGluZyByb290IGluZGV4IHNvIHRoYXQgaG9zdCB0ZW1wbGF0ZSBmdW5jdGlvbnMgY2FuIGV4ZWN1dGUuXG4gKlxuICogQmluZGluZ3MgaW5zaWRlIHRoZSBob3N0IHRlbXBsYXRlIGFyZSAwIGluZGV4LiBCdXQgYmVjYXVzZSB3ZSBkb24ndCBrbm93IGFoZWFkIG9mIHRpbWVcbiAqIGhvdyBtYW55IGhvc3QgYmluZGluZ3Mgd2UgaGF2ZSB3ZSBjYW4ndCBwcmUtY29tcHV0ZSB0aGVtLiBGb3IgdGhpcyByZWFzb24gdGhleSBhcmUgYWxsXG4gKiAwIGluZGV4IGFuZCB3ZSBqdXN0IHNoaWZ0IHRoZSByb290IHNvIHRoYXQgdGhleSBtYXRjaCBuZXh0IGF2YWlsYWJsZSBsb2NhdGlvbiBpbiB0aGUgTFZpZXcuXG4gKlxuICogQHBhcmFtIGJpbmRpbmdSb290SW5kZXggUm9vdCBpbmRleCBmb3IgYGhvc3RCaW5kaW5nc2BcbiAqIEBwYXJhbSBjdXJyZW50RGlyZWN0aXZlSW5kZXggYFREYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIHdpbGwgcG9pbnQgdG8gdGhlIGN1cnJlbnQgZGlyZWN0aXZlXG4gKiAgICAgICAgd2hvc2UgYGhvc3RCaW5kaW5nc2AgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKFxuICAgIGJpbmRpbmdSb290SW5kZXg6IG51bWJlciwgY3VycmVudERpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGxGcmFtZS5iaW5kaW5nSW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IGJpbmRpbmdSb290SW5kZXg7XG4gIGxGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXggPSBjdXJyZW50RGlyZWN0aXZlSW5kZXg7XG59XG5cbi8qKlxuICogV2hlbiBob3N0IGJpbmRpbmcgaXMgZXhlY3V0aW5nIHRoaXMgcG9pbnRzIHRvIHRoZSBkaXJlY3RpdmUgaW5kZXguXG4gKiBgVFZpZXcuZGF0YVtnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKV1gIGlzIGBEaXJlY3RpdmVEZWZgXG4gKiBgTFZpZXdbZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCldYCBpcyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBlbnRlclZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICogQHBhcmFtIG5ld1ZpZXdcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJESShuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlICE7XG4gIG5ld0xGcmFtZS5sVmlldyA9IG5ld1ZpZXc7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyByZXNldHRpbmcgZm9yIHNhZmV0eSBpbiBkZXYgbW9kZSBvbmx5LlxuICAgIG5ld0xGcmFtZS5pc1BhcmVudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5zZWxlY3RlZEluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICB9XG59XG5cbmNvbnN0IERFVl9NT0RFX1ZBTFVFOiBhbnkgPVxuICAgICdWYWx1ZSBpbmRpY2F0aW5nIHRoYXQgREkgaXMgdHJ5aW5nIHRvIHJlYWQgdmFsdWUgd2hpY2ggaXQgc2hvdWxkIG5vdCBuZWVkIHRvIGtub3cgYWJvdXQuJztcblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBsZWF2ZVZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICpcbiAqIEJlY2F1c2UgdGhlIGltcGxlbWVudGF0aW9uIGlzIHNhbWUgaXQgaXMgb25seSBhbiBhbGlhc1xuICovXG5leHBvcnQgY29uc3QgbGVhdmVESSA9IGxlYXZlVmlldztcblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IGxWaWV3IHdpdGggYSBuZXcgbFZpZXcuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIGxWaWV3IGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIGxWaWV3IGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IGxWaWV3IHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSB0Tm9kZSBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZChuZXdWaWV3KTtcbiAgY29uc3QgbmV3TEZyYW1lID0gYWxsb2NMRnJhbWUoKTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBuZXdMRnJhbWU7XG4gIG5ld0xGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZSAhO1xuICBuZXdMRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBuZXdMRnJhbWUuc2VsZWN0ZWRJbmRleCA9IDA7XG4gIG5ld0xGcmFtZS5jb250ZXh0TFZpZXcgPSBuZXdWaWV3ICE7XG4gIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIG5ld0xGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgbmV3TEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xuICBuZXdMRnJhbWUuY3VycmVudFNhbml0aXplciA9IG51bGw7XG4gIG5ld0xGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gLTE7XG4gIG5ld0xGcmFtZS5iaW5kaW5nSW5kZXggPSBuZXdWaWV3ID09PSBudWxsID8gLTEgOiBuZXdWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleDtcbiAgbmV3TEZyYW1lLmN1cnJlbnRRdWVyeUluZGV4ID0gMDtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgbmV4dCBmcmVlIExGcmFtZS4gVGhpcyBmdW5jdGlvbiB0cmllcyB0byByZXVzZSB0aGUgYExGcmFtZWBzIHRvIGxvd2VyIG1lbW9yeSBwcmVzc3VyZS5cbiAqL1xuZnVuY3Rpb24gYWxsb2NMRnJhbWUoKSB7XG4gIGNvbnN0IGN1cnJlbnRMRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgY29uc3QgY2hpbGRMRnJhbWUgPSBjdXJyZW50TEZyYW1lID09PSBudWxsID8gbnVsbCA6IGN1cnJlbnRMRnJhbWUuY2hpbGQ7XG4gIGNvbnN0IG5ld0xGcmFtZSA9IGNoaWxkTEZyYW1lID09PSBudWxsID8gY3JlYXRlTEZyYW1lKGN1cnJlbnRMRnJhbWUpIDogY2hpbGRMRnJhbWU7XG4gIHJldHVybiBuZXdMRnJhbWU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxGcmFtZShwYXJlbnQ6IExGcmFtZSB8IG51bGwpOiBMRnJhbWUge1xuICBjb25zdCBsRnJhbWU6IExGcmFtZSA9IHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGU6IG51bGwgISwgIC8vXG4gICAgaXNQYXJlbnQ6IHRydWUsICAgICAgICAgICAgICAgICAvL1xuICAgIGxWaWV3OiBudWxsICEsICAgICAgICAgICAgICAgICAgLy9cbiAgICBzZWxlY3RlZEluZGV4OiAwLCAgICAgICAgICAgICAgIC8vXG4gICAgY29udGV4dExWaWV3OiBudWxsICEsICAgICAgICAgICAvL1xuICAgIGVsZW1lbnREZXB0aENvdW50OiAwLCAgICAgICAgICAgLy9cbiAgICBjdXJyZW50TmFtZXNwYWNlOiBudWxsLCAgICAgICAgIC8vXG4gICAgY3VycmVudFNhbml0aXplcjogbnVsbCwgICAgICAgICAvL1xuICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleDogLTEsICAgICAgLy9cbiAgICBiaW5kaW5nUm9vdEluZGV4OiAtMSwgICAgICAgICAgIC8vXG4gICAgYmluZGluZ0luZGV4OiAtMSwgICAgICAgICAgICAgICAvL1xuICAgIGN1cnJlbnRRdWVyeUluZGV4OiAwLCAgICAgICAgICAgLy9cbiAgICBwYXJlbnQ6IHBhcmVudCAhLCAgICAgICAgICAgICAgIC8vXG4gICAgY2hpbGQ6IG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICB9O1xuICBwYXJlbnQgIT09IG51bGwgJiYgKHBhcmVudC5jaGlsZCA9IGxGcmFtZSk7ICAvLyBsaW5rIHRoZSBuZXcgTEZyYW1lIGZvciByZXVzZS5cbiAgcmV0dXJuIGxGcmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dEltcGw8VCA9IGFueT4obGV2ZWw6IG51bWJlcik6IFQge1xuICBjb25zdCBjb250ZXh0TFZpZXcgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPVxuICAgICAgd2Fsa1VwVmlld3MobGV2ZWwsIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyAhKTtcbiAgcmV0dXJuIGNvbnRleHRMVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3KTogTFZpZXcge1xuICB3aGlsZSAobmVzdGluZ0xldmVsID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAnRGVjbGFyYXRpb24gdmlldyBzaG91bGQgYmUgZGVmaW5lZCBpZiBuZXN0aW5nIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBuZXN0aW5nTGV2ZWwtLTtcbiAgfVxuICByZXR1cm4gY3VycmVudFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGVsZW1lbnQgaW5kZXguXG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleDtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqXG4gKiAoTm90ZSB0aGF0IGlmIGFuIFwiZXhpdCBmdW5jdGlvblwiIHdhcyBzZXQgZWFybGllciAodmlhIGBzZXRFbGVtZW50RXhpdEZuKClgKSB0aGVuIHRoYXQgd2lsbCBiZVxuICogcnVuIGlmIGFuZCB3aGVuIHRoZSBwcm92aWRlZCBgaW5kZXhgIHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGVkIGluZGV4IHZhbHVlLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG59XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlTWF0aE1MKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VIVE1MKCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFNhbml0aXplciA9IHNhbml0aXplcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIobnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIC8vIFRPRE8obWlza28pOiBUaGlzIHNob3VsZCB0aHJvdyB3aGVuIHRoZXJlIGlzIG5vIExWaWV3LCBidXQgaXQgdHVybnMgb3V0IHdlIGNhbiBnZXQgaGVyZSBmcm9tXG4gIC8vIGBOb2RlU3R5bGVEZWJ1Z2AgaGVuY2Ugd2UgcmV0dXJuIGBudWxsYC4gVGhpcyBzaG91bGQgYmUgZml4ZWRcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIHJldHVybiBsRnJhbWUgPT09IG51bGwgPyBudWxsIDogbEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXI7XG59XG4iXX0=