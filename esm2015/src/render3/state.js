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
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param {?} elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 * @return {?}
 */
export function setActiveHostElement(elementIndex) {
    setSelectedIndex(elementIndex);
}
/**
 * @return {?}
 */
export function clearActiveHostElement() {
    setSelectedIndex(-1);
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
 * @param {?} value
 * @return {?}
 */
export function setBindingRootForHostBindings(value) {
    /** @type {?} */
    const lframe = instructionState.lFrame;
    lframe.bindingIndex = lframe.bindingRootIndex = value;
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
/** @enum {number} */
const BindingChanged = {
    CLASS_SHIFT: 16,
    STYLE_MASK: 65535,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQWlDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0UsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWhELE9BQU8sRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQTBCLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7OztBQU0zRixxQkF3RkM7Ozs7Ozs7O0lBbEZDLHdCQUFlOzs7Ozs7O0lBT2YsdUJBQW1COzs7Ozs7OztJQVFuQix1QkFBYTs7Ozs7OztJQU9iLHVDQUE2Qjs7Ozs7OztJQU83QiwwQkFBa0I7Ozs7Ozs7SUFPbEIsK0JBQXNCOzs7OztJQUt0Qiw4QkFBcUI7Ozs7Ozs7O0lBUXJCLDhCQUFvQjs7Ozs7Ozs7SUFRcEIsbUNBQTBCOzs7OztJQUsxQixrQ0FBOEI7Ozs7O0lBSzlCLGtDQUF1Qzs7Ozs7OztJQVF2QyxrQ0FBeUI7Ozs7OztJQU16QixtQ0FBMEI7Ozs7Ozs7Ozs7OztBQVk1QiwrQkFrQ0M7Ozs7Ozs7O0lBNUJDLGtDQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CZiwyQ0FBeUI7Ozs7Ozs7SUFPekIsOENBQTRCOzs7QUFHOUIsTUFBTSxPQUFPLGdCQUFnQixHQUFxQjtJQUNoRCxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQztJQUMxQixlQUFlLEVBQUUsSUFBSTtJQUNyQixrQkFBa0IsRUFBRSxLQUFLO0NBQzFCOzs7O0FBR0QsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztBQUNuRCxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxnQkFBZ0IsQ0FBQyxNQUFN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QUcsS0FBSyxDQUFDO0FBQ2hELENBQUM7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsY0FBYztJQUM1QixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsNEJBQTRCLENBQUM7QUFDMUUsQ0FBQzs7Ozs7OztBQU9ELE1BQU0sVUFBVSxpQkFBaUI7SUFDL0IsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLGdDQUFnQyxDQUFDO0FBQzlFLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGVBQWU7SUFDN0IscUJBQXFCLEVBQUUsQ0FBQztBQUMxQixDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDbEQsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSxZQUFZO0lBQzFCLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQ2xELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLFNBQWlDO0lBQ3hFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7QUFDdkQsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSwwQkFBMEI7SUFDeEMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0I7Ozs7VUFHaEMsTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU07SUFDdEMsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxRCxDQUFDOztBQUtELE1BQVcsY0FBYztJQUN2QixXQUFXLElBQUs7SUFDaEIsVUFBVSxPQUFTO0VBQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIExWaWV3LCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKlxuICovXG5pbnRlcmZhY2UgTEZyYW1lIHtcbiAgLyoqXG4gICAqIFBhcmVudCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVlZGVkIHdoZW4gYGxlYXZlVmlld2AgaXMgY2FsbGVkIHRvIHJlc3RvcmUgdGhlIHByZXZpb3VzIHN0YXRlLlxuICAgKi9cbiAgcGFyZW50OiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIENoaWxkIExGcmFtZS5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIHRvIGNhY2hlIGV4aXN0aW5nIExGcmFtZXMgdG8gcmVsaWV2ZSB0aGUgbWVtb3J5IHByZXNzdXJlLlxuICAgKi9cbiAgY2hpbGQ6IExGcmFtZXxudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAgICpcbiAgICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAgICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gICAqL1xuICBsVmlldzogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggYGlzUGFyZW50YC5cbiAgICovXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGU7XG5cbiAgLyoqXG4gICAqIElmIGBpc1BhcmVudGAgaXM6XG4gICAqICAtIGB0cnVlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAgICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gICAqL1xuICBpc1BhcmVudDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSW5kZXggb2YgY3VycmVudGx5IHNlbGVjdGVkIGVsZW1lbnQgaW4gTFZpZXcuXG4gICAqXG4gICAqIFVzZWQgYnkgYmluZGluZyBpbnN0cnVjdGlvbnMuIFVwZGF0ZWQgYXMgcGFydCBvZiBhZHZhbmNlIGluc3RydWN0aW9uLlxuICAgKi9cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHBvaW50ZXIgdG8gdGhlIGJpbmRpbmcgaW5kZXguXG4gICAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGxhc3Qgdmlld0RhdGEgcmV0cmlldmVkIGJ5IG5leHRDb250ZXh0KCkuXG4gICAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAgICpcbiAgICogZS5nLiBjb25zdCBpbm5lciA9IHgoKS4kaW1wbGljaXQ7IGNvbnN0IG91dGVyID0geCgpLiRpbXBsaWNpdDtcbiAgICovXG4gIGNvbnRleHRMVmlldzogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFN0b3JlIHRoZSBlbGVtZW50IGRlcHRoIGNvdW50LiBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIHJvb3QgZWxlbWVudHMgb2YgdGhlIHRlbXBsYXRlXG4gICAqIHNvIHRoYXQgd2UgY2FuIHRoZW4gYXR0YWNoIHBhdGNoIGRhdGEgYExWaWV3YCB0byBvbmx5IHRob3NlIGVsZW1lbnRzLiBXZSBrbm93IHRoYXQgdGhvc2VcbiAgICogYXJlIHRoZSBvbmx5IHBsYWNlcyB3aGVyZSB0aGUgcGF0Y2ggZGF0YSBjb3VsZCBjaGFuZ2UsIHRoaXMgd2F5IHdlIHdpbGwgc2F2ZSBvbiBudW1iZXJcbiAgICogb2YgcGxhY2VzIHdoZXJlIHRoYSBwYXRjaGluZyBvY2N1cnMuXG4gICAqL1xuICBlbGVtZW50RGVwdGhDb3VudDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IG5hbWVzcGFjZSB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgZWxlbWVudHNcbiAgICovXG4gIGN1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHNhbml0aXplclxuICAgKi9cbiAgY3VycmVudFNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG5cblxuICAvKipcbiAgICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAgICogaW5kaWNlcy4gSW4gY29tcG9uZW50IHZpZXdzLCB0aGlzIGlzIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LiBJbiBhIGhvc3QgYmluZGluZ1xuICAgKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICAgKi9cbiAgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IGluZGV4IG9mIGEgVmlldyBvciBDb250ZW50IFF1ZXJ5IHdoaWNoIG5lZWRzIHRvIGJlIHByb2Nlc3NlZCBuZXh0LlxuICAgKiBXZSBpdGVyYXRlIG92ZXIgdGhlIGxpc3Qgb2YgUXVlcmllcyBhbmQgaW5jcmVtZW50IGN1cnJlbnQgcXVlcnkgaW5kZXggYXQgZXZlcnkgc3RlcC5cbiAgICovXG4gIGN1cnJlbnRRdWVyeUluZGV4OiBudW1iZXI7XG59XG5cbi8qKlxuICogQWxsIGltcGxpY2l0IGluc3RydWN0aW9uIHN0YXRlIGlzIHN0b3JlZCBoZXJlLlxuICpcbiAqIEl0IGlzIHVzZWZ1bCB0byBoYXZlIGEgc2luZ2xlIG9iamVjdCB3aGVyZSBhbGwgb2YgdGhlIHN0YXRlIGlzIHN0b3JlZCBhcyBhIG1lbnRhbCBtb2RlbFxuICogKHJhdGhlciBpdCBiZWluZyBzcHJlYWQgYWNyb3NzIG1hbnkgZGlmZmVyZW50IHZhcmlhYmxlcy4pXG4gKlxuICogUEVSRiBOT1RFOiBUdXJucyBvdXQgdGhhdCB3cml0aW5nIHRvIGEgdHJ1ZSBnbG9iYWwgdmFyaWFibGUgaXMgc2xvd2VyIHRoYW5cbiAqIGhhdmluZyBhbiBpbnRlcm1lZGlhdGUgb2JqZWN0IHdpdGggcHJvcGVydGllcy5cbiAqL1xuaW50ZXJmYWNlIEluc3RydWN0aW9uU3RhdGUge1xuICAvKipcbiAgICogQ3VycmVudCBgTEZyYW1lYFxuICAgKlxuICAgKiBgbnVsbGAgaWYgd2UgaGF2ZSBub3QgY2FsbGVkIGBlbnRlclZpZXdgXG4gICAqL1xuICBsRnJhbWU6IExGcmFtZTtcblxuICAvKipcbiAgICogU3RvcmVzIHdoZXRoZXIgZGlyZWN0aXZlcyBzaG91bGQgYmUgbWF0Y2hlZCB0byBlbGVtZW50cy5cbiAgICpcbiAgICogV2hlbiB0ZW1wbGF0ZSBjb250YWlucyBgbmdOb25CaW5kYWJsZWAgdGhlbiB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHJ1bnRpbWUgZnJvbSBtYXRjaGluZ1xuICAgKiBkaXJlY3RpdmVzIG9uIGNoaWxkcmVuIG9mIHRoYXQgZWxlbWVudC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAgICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICAgKiA8L215LWNvbXA+XG4gICAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAgICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gICAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICAgKiAgIDwvbXktY29tcD5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKi9cbiAgYmluZGluZ3NFbmFibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gICAqXG4gICAqIE5lY2Vzc2FyeSB0byBzdXBwb3J0IENoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCkuXG4gICAqL1xuICBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBpbnN0cnVjdGlvblN0YXRlOiBJbnN0cnVjdGlvblN0YXRlID0ge1xuICBsRnJhbWU6IGNyZWF0ZUxGcmFtZShudWxsKSxcbiAgYmluZGluZ3NFbmFibGVkOiB0cnVlLFxuICBjaGVja05vQ2hhbmdlc01vZGU6IGZhbHNlLFxufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudERlcHRoQ291bnQoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudC0tO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ3NFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQ7XG59XG5cblxuLyoqXG4gKiBFbmFibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50cy5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gybXJtWRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIMm1ybVlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVuYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogRGlzYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnQuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IExWaWV3LlxuICpcbiAqIFRoZSByZXR1cm4gdmFsdWUgY2FuIGJlIGBudWxsYCBpZiB0aGUgbWV0aG9kIGlzIGNhbGxlZCBvdXRzaWRlIG9mIHRlbXBsYXRlLiBUaGlzIGNhbiBoYXBwZW4gaWZcbiAqIGRpcmVjdGl2ZSBpcyBpbnN0YW50aWF0ZWQgYnkgbW9kdWxlIGluamVjdG9yIChyYXRoZXIgdGhhbiBieSBub2RlIGluamVjdG9yLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3KCk6IExWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHRoZSByZXR1cm4gdmFsdWUgc2hvdWxkIGJlIGBMVmlld3xudWxsYCBidXQgZG9pbmcgc28gYnJlYWtzIGEgbG90IG9mIGNvZGUuXG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICByZXR1cm4gbEZyYW1lID09PSBudWxsID8gbnVsbCAhIDogbEZyYW1lLmxWaWV3O1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGFjdGl2ZSBkaXJlY3RpdmUgaG9zdCBlbGVtZW50IGFuZCByZXNldHMgdGhlIGRpcmVjdGl2ZSBpZCB2YWx1ZVxuICogKHdoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRJbmRleCB2YWx1ZSBoYXMgY2hhbmdlZCkuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRJbmRleCB0aGUgZWxlbWVudCBpbmRleCB2YWx1ZSBmb3IgdGhlIGhvc3QgZWxlbWVudCB3aGVyZVxuICogICAgICAgICAgICAgICAgICAgICB0aGUgZGlyZWN0aXZlL2NvbXBvbmVudCBpbnN0YW5jZSBsaXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4OiBudW1iZXIpIHtcbiAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJBY3RpdmVIb3N0RWxlbWVudCgpIHtcbiAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgYGNvbnRleHRWaWV3RGF0YWAgdG8gdGhlIGdpdmVuIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIGdldEN1cnJlbnRWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gdmlld1RvUmVzdG9yZSBUaGUgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlIHRvIHJlc3RvcmUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXN0b3JlVmlldyh2aWV3VG9SZXN0b3JlOiBPcGFxdWVWaWV3U3RhdGUpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3ID0gdmlld1RvUmVzdG9yZSBhcyBhbnkgYXMgTFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUucHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlOiBUTm9kZSwgX2lzUGFyZW50OiBib29sZWFuKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudCA9IF9pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldElzUGFyZW50KCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc05vdFBhcmVudCgpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc1BhcmVudCgpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dExWaWV3KCk6IExWaWV3IHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpOiBib29sZWFuIHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlbW92ZSB0aGlzIGZyb20gdGhlIExWaWV3IHNpbmNlIGl0IGlzIG5nRGV2TW9kZT10cnVlIG1vZGUgb25seS5cbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuY2hlY2tOb0NoYW5nZXNNb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKG1vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5jaGVja05vQ2hhbmdlc01vZGUgPSBtb2RlO1xufVxuXG4vLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1Jvb3QoKSB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBsZXQgaW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleDtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIGNvbnN0IGxWaWV3ID0gbEZyYW1lLmxWaWV3O1xuICAgIGluZGV4ID0gbEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXg7XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ0luZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nSW5kZXgodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXggPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRCaW5kaW5nSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdJbmRleCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50QmluZGluZ0luZGV4KGNvdW50OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgY29uc3QgaW5kZXggPSBsRnJhbWUuYmluZGluZ0luZGV4O1xuICBsRnJhbWUuYmluZGluZ0luZGV4ID0gbEZyYW1lLmJpbmRpbmdJbmRleCArIGNvdW50O1xuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogU2V0IGEgbmV3IGJpbmRpbmcgcm9vdCBpbmRleCBzbyB0aGF0IGhvc3QgdGVtcGxhdGUgZnVuY3Rpb25zIGNhbiBleGVjdXRlLlxuICpcbiAqIEJpbmRpbmdzIGluc2lkZSB0aGUgaG9zdCB0ZW1wbGF0ZSBhcmUgMCBpbmRleC4gQnV0IGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBhaGVhZCBvZiB0aW1lXG4gKiBob3cgbWFueSBob3N0IGJpbmRpbmdzIHdlIGhhdmUgd2UgY2FuJ3QgcHJlLWNvbXB1dGUgdGhlbS4gRm9yIHRoaXMgcmVhc29uIHRoZXkgYXJlIGFsbFxuICogMCBpbmRleCBhbmQgd2UganVzdCBzaGlmdCB0aGUgcm9vdCBzbyB0aGF0IHRoZXkgbWF0Y2ggbmV4dCBhdmFpbGFibGUgbG9jYXRpb24gaW4gdGhlIExWaWV3LlxuICogQHBhcmFtIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncyh2YWx1ZTogbnVtYmVyKSB7XG4gIGNvbnN0IGxmcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBsZnJhbWUuYmluZGluZ0luZGV4ID0gbGZyYW1lLmJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBlbnRlclZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICogQHBhcmFtIG5ld1ZpZXdcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJESShuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlICE7XG4gIG5ld0xGcmFtZS5sVmlldyA9IG5ld1ZpZXc7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyByZXNldHRpbmcgZm9yIHNhZmV0eSBpbiBkZXYgbW9kZSBvbmx5LlxuICAgIG5ld0xGcmFtZS5pc1BhcmVudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5zZWxlY3RlZEluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICB9XG59XG5cbmNvbnN0IERFVl9NT0RFX1ZBTFVFOiBhbnkgPVxuICAgICdWYWx1ZSBpbmRpY2F0aW5nIHRoYXQgREkgaXMgdHJ5aW5nIHRvIHJlYWQgdmFsdWUgd2hpY2ggaXQgc2hvdWxkIG5vdCBuZWVkIHRvIGtub3cgYWJvdXQuJztcblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBsZWF2ZVZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICpcbiAqIEJlY2F1c2UgdGhlIGltcGxlbWVudGF0aW9uIGlzIHNhbWUgaXQgaXMgb25seSBhbiBhbGlhc1xuICovXG5leHBvcnQgY29uc3QgbGVhdmVESSA9IGxlYXZlVmlldztcblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IGxWaWV3IHdpdGggYSBuZXcgbFZpZXcuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIGxWaWV3IGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIGxWaWV3IGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IGxWaWV3IHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSB0Tm9kZSBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZChuZXdWaWV3KTtcbiAgY29uc3QgbmV3TEZyYW1lID0gYWxsb2NMRnJhbWUoKTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBuZXdMRnJhbWU7XG4gIG5ld0xGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZSAhO1xuICBuZXdMRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBuZXdMRnJhbWUuc2VsZWN0ZWRJbmRleCA9IDA7XG4gIG5ld0xGcmFtZS5jb250ZXh0TFZpZXcgPSBuZXdWaWV3ICE7XG4gIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbiAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBudWxsO1xuICBuZXdMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IC0xO1xuICBuZXdMRnJhbWUuYmluZGluZ0luZGV4ID0gbmV3VmlldyA9PT0gbnVsbCA/IC0xIDogbmV3Vmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXg7XG4gIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IDA7XG59XG5cbi8qKlxuICogQWxsb2NhdGVzIG5leHQgZnJlZSBMRnJhbWUuIFRoaXMgZnVuY3Rpb24gdHJpZXMgdG8gcmV1c2UgdGhlIGBMRnJhbWVgcyB0byBsb3dlciBtZW1vcnkgcHJlc3N1cmUuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jTEZyYW1lKCkge1xuICBjb25zdCBjdXJyZW50TEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGNvbnN0IGNoaWxkTEZyYW1lID0gY3VycmVudExGcmFtZSA9PT0gbnVsbCA/IG51bGwgOiBjdXJyZW50TEZyYW1lLmNoaWxkO1xuICBjb25zdCBuZXdMRnJhbWUgPSBjaGlsZExGcmFtZSA9PT0gbnVsbCA/IGNyZWF0ZUxGcmFtZShjdXJyZW50TEZyYW1lKSA6IGNoaWxkTEZyYW1lO1xuICByZXR1cm4gbmV3TEZyYW1lO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMRnJhbWUocGFyZW50OiBMRnJhbWUgfCBudWxsKTogTEZyYW1lIHtcbiAgY29uc3QgbEZyYW1lOiBMRnJhbWUgPSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlOiBudWxsICEsICAvL1xuICAgIGlzUGFyZW50OiB0cnVlLCAgICAgICAgICAgICAgICAgLy9cbiAgICBsVmlldzogbnVsbCAhLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgc2VsZWN0ZWRJbmRleDogMCwgICAgICAgICAgICAgICAvL1xuICAgIGNvbnRleHRMVmlldzogbnVsbCAhLCAgICAgICAgICAgLy9cbiAgICBlbGVtZW50RGVwdGhDb3VudDogMCwgICAgICAgICAgIC8vXG4gICAgY3VycmVudE5hbWVzcGFjZTogbnVsbCwgICAgICAgICAvL1xuICAgIGN1cnJlbnRTYW5pdGl6ZXI6IG51bGwsICAgICAgICAgLy9cbiAgICBiaW5kaW5nUm9vdEluZGV4OiAtMSwgICAgICAgICAgIC8vXG4gICAgYmluZGluZ0luZGV4OiAtMSwgICAgICAgICAgICAgICAvL1xuICAgIGN1cnJlbnRRdWVyeUluZGV4OiAwLCAgICAgICAgICAgLy9cbiAgICBwYXJlbnQ6IHBhcmVudCAhLCAgICAgICAgICAgICAgIC8vXG4gICAgY2hpbGQ6IG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICB9O1xuICBwYXJlbnQgIT09IG51bGwgJiYgKHBhcmVudC5jaGlsZCA9IGxGcmFtZSk7ICAvLyBsaW5rIHRoZSBuZXcgTEZyYW1lIGZvciByZXVzZS5cbiAgcmV0dXJuIGxGcmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dEltcGw8VCA9IGFueT4obGV2ZWw6IG51bWJlcik6IFQge1xuICBjb25zdCBjb250ZXh0TFZpZXcgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPVxuICAgICAgd2Fsa1VwVmlld3MobGV2ZWwsIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyAhKTtcbiAgcmV0dXJuIGNvbnRleHRMVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3KTogTFZpZXcge1xuICB3aGlsZSAobmVzdGluZ0xldmVsID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAnRGVjbGFyYXRpb24gdmlldyBzaG91bGQgYmUgZGVmaW5lZCBpZiBuZXN0aW5nIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBuZXN0aW5nTGV2ZWwtLTtcbiAgfVxuICByZXR1cm4gY3VycmVudFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGVsZW1lbnQgaW5kZXguXG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleDtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqXG4gKiAoTm90ZSB0aGF0IGlmIGFuIFwiZXhpdCBmdW5jdGlvblwiIHdhcyBzZXQgZWFybGllciAodmlhIGBzZXRFbGVtZW50RXhpdEZuKClgKSB0aGVuIHRoYXQgd2lsbCBiZVxuICogcnVuIGlmIGFuZCB3aGVuIHRoZSBwcm92aWRlZCBgaW5kZXhgIHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGVkIGluZGV4IHZhbHVlLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG59XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlTWF0aE1MKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VIVE1MKCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFNhbml0aXplciA9IHNhbml0aXplcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIobnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIC8vIFRPRE8obWlza28pOiBUaGlzIHNob3VsZCB0aHJvdyB3aGVuIHRoZXJlIGlzIG5vIExWaWV3LCBidXQgaXQgdHVybnMgb3V0IHdlIGNhbiBnZXQgaGVyZSBmcm9tXG4gIC8vIGBOb2RlU3R5bGVEZWJ1Z2AgaGVuY2Ugd2UgcmV0dXJuIGBudWxsYC4gVGhpcyBzaG91bGQgYmUgZml4ZWRcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIHJldHVybiBsRnJhbWUgPT09IG51bGwgPyBudWxsIDogbEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXI7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgZW5jb2RpbmcgYm90aCBDbGFzcyBhbmQgU3R5bGUgaW5kZXggaW50byBgTEZyYW1lLnN0eWxpbmdCaW5kaW5nQ2hhbmdlZGAuXG4gKi9cbmNvbnN0IGVudW0gQmluZGluZ0NoYW5nZWQge1xuICBDTEFTU19TSElGVCA9IDE2LFxuICBTVFlMRV9NQVNLID0gMHhGRkZGLFxufVxuIl19