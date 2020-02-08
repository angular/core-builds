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
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
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
     * Current `TView` associated with the `LFrame.lView`.
     *
     * One can get `TView` from `lFrame[TVIEW]` however because it is so common it makes sense to
     * store it in `LFrame` for perf reasons.
     * @type {?}
     */
    LFrame.prototype.tView;
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
 * Return the current `LView`.
 * @return {?}
 */
export function getLView() {
    return instructionState.lFrame.lView;
}
/**
 * Return the current `TView`.
 * @return {?}
 */
export function getTView() {
    return instructionState.lFrame.tView;
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
        index = lFrame.bindingRootIndex = lFrame.tView.bindingStartIndex;
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
    /** @type {?} */
    const tView = newView[TVIEW];
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = (/** @type {?} */ (tNode));
    newLFrame.isParent = true;
    newLFrame.lView = newView;
    newLFrame.tView = tView;
    newLFrame.selectedIndex = 0;
    newLFrame.contextLView = (/** @type {?} */ (newView));
    newLFrame.elementDepthCount = 0;
    newLFrame.currentDirectiveIndex = -1;
    newLFrame.currentNamespace = null;
    newLFrame.currentSanitizer = null;
    newLFrame.bindingRootIndex = -1;
    newLFrame.bindingIndex = tView.bindingStartIndex;
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
        tView: (/** @type {?} */ (null)),
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
    instructionState.lFrame.currentNamespace = SVG_NAMESPACE;
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceMathML() {
    instructionState.lFrame.currentNamespace = MATH_ML_NAMESPACE;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBMEIsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDbEcsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLGNBQWMsQ0FBQzs7Ozs7QUFNOUQscUJBdUdDOzs7Ozs7OztJQWpHQyx3QkFBZTs7Ozs7OztJQU9mLHVCQUFtQjs7Ozs7Ozs7SUFRbkIsdUJBQWE7Ozs7Ozs7O0lBUWIsdUJBQWE7Ozs7Ozs7SUFPYix1Q0FBNkI7Ozs7Ozs7SUFPN0IsMEJBQWtCOzs7Ozs7O0lBT2xCLCtCQUFzQjs7Ozs7SUFLdEIsOEJBQXFCOzs7Ozs7OztJQVFyQiw4QkFBb0I7Ozs7Ozs7O0lBUXBCLG1DQUEwQjs7Ozs7SUFLMUIsa0NBQThCOzs7OztJQUs5QixrQ0FBdUM7Ozs7Ozs7SUFRdkMsa0NBQXlCOzs7Ozs7SUFNekIsbUNBQTBCOzs7Ozs7O0lBTzFCLHVDQUE4Qjs7Ozs7Ozs7Ozs7O0FBWWhDLCtCQWtDQzs7Ozs7Ozs7SUE1QkMsa0NBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0JmLDJDQUF5Qjs7Ozs7OztJQU96Qiw4Q0FBNEI7OztBQUc5QixNQUFNLE9BQU8sZ0JBQWdCLEdBQXFCO0lBQ2hELE1BQU0sRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQzFCLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLGtCQUFrQixFQUFFLEtBQUs7Q0FDMUI7Ozs7QUFHRCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8sZ0JB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dGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIExWaWV3LCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtNQVRIX01MX05BTUVTUEFDRSwgU1ZHX05BTUVTUEFDRX0gZnJvbSAnLi9uYW1lc3BhY2VzJztcblxuXG4vKipcbiAqXG4gKi9cbmludGVyZmFjZSBMRnJhbWUge1xuICAvKipcbiAgICogUGFyZW50IExGcmFtZS5cbiAgICpcbiAgICogVGhpcyBpcyBuZWVkZWQgd2hlbiBgbGVhdmVWaWV3YCBpcyBjYWxsZWQgdG8gcmVzdG9yZSB0aGUgcHJldmlvdXMgc3RhdGUuXG4gICAqL1xuICBwYXJlbnQ6IExGcmFtZTtcblxuICAvKipcbiAgICogQ2hpbGQgTEZyYW1lLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gY2FjaGUgZXhpc3RpbmcgTEZyYW1lcyB0byByZWxpZXZlIHRoZSBtZW1vcnkgcHJlc3N1cmUuXG4gICAqL1xuICBjaGlsZDogTEZyYW1lfG51bGw7XG5cbiAgLyoqXG4gICAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICAgKlxuICAgKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICAgKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAgICovXG4gIGxWaWV3OiBMVmlldztcblxuICAvKipcbiAgICogQ3VycmVudCBgVFZpZXdgIGFzc29jaWF0ZWQgd2l0aCB0aGUgYExGcmFtZS5sVmlld2AuXG4gICAqXG4gICAqIE9uZSBjYW4gZ2V0IGBUVmlld2AgZnJvbSBgbEZyYW1lW1RWSUVXXWAgaG93ZXZlciBiZWNhdXNlIGl0IGlzIHNvIGNvbW1vbiBpdCBtYWtlcyBzZW5zZSB0b1xuICAgKiBzdG9yZSBpdCBpbiBgTEZyYW1lYCBmb3IgcGVyZiByZWFzb25zLlxuICAgKi9cbiAgdFZpZXc6IFRWaWV3O1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQgYW5kIHRyYWNrIHF1ZXJ5IHJlc3VsdHMuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGBpc1BhcmVudGAuXG4gICAqL1xuICBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG4gIC8qKlxuICAgKiBJZiBgaXNQYXJlbnRgIGlzOlxuICAgKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gICAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICAgKi9cbiAgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50IGluIExWaWV3LlxuICAgKlxuICAgKiBVc2VkIGJ5IGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLiBVcGRhdGVkIGFzIHBhcnQgb2YgYWR2YW5jZSBpbnN0cnVjdGlvbi5cbiAgICovXG4gIHNlbGVjdGVkSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBwb2ludGVyIHRvIHRoZSBiaW5kaW5nIGluZGV4LlxuICAgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICAgKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gICAqXG4gICAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gICAqL1xuICBjb250ZXh0TFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICAgKiBzbyB0aGF0IHdlIGNhbiB0aGVuIGF0dGFjaCBwYXRjaCBkYXRhIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy4gV2Uga25vdyB0aGF0IHRob3NlXG4gICAqIGFyZSB0aGUgb25seSBwbGFjZXMgd2hlcmUgdGhlIHBhdGNoIGRhdGEgY291bGQgY2hhbmdlLCB0aGlzIHdheSB3ZSB3aWxsIHNhdmUgb24gbnVtYmVyXG4gICAqIG9mIHBsYWNlcyB3aGVyZSB0aGEgcGF0Y2hpbmcgb2NjdXJzLlxuICAgKi9cbiAgZWxlbWVudERlcHRoQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBuYW1lc3BhY2UgdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGVsZW1lbnRzXG4gICAqL1xuICBjdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQ3VycmVudCBzYW5pdGl6ZXJcbiAgICovXG4gIGN1cnJlbnRTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsO1xuXG5cbiAgLyoqXG4gICAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gICAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAgICogY29udGV4dCwgdGhpcyBpcyB0aGUgVFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKyBhbnkgZGlycy9ob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAgICovXG4gIGJpbmRpbmdSb290SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBpbmRleCBvZiBhIFZpZXcgb3IgQ29udGVudCBRdWVyeSB3aGljaCBuZWVkcyB0byBiZSBwcm9jZXNzZWQgbmV4dC5cbiAgICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gICAqL1xuICBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGhvc3QgYmluZGluZyBpcyBleGVjdXRpbmcgdGhpcyBwb2ludHMgdG8gdGhlIGRpcmVjdGl2ZSBpbmRleC5cbiAgICogYFRWaWV3LmRhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XWAgaXMgYERpcmVjdGl2ZURlZmBcbiAgICogYExWaWV3W2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIGlzIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICovXG4gIGN1cnJlbnREaXJlY3RpdmVJbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFsbCBpbXBsaWNpdCBpbnN0cnVjdGlvbiBzdGF0ZSBpcyBzdG9yZWQgaGVyZS5cbiAqXG4gKiBJdCBpcyB1c2VmdWwgdG8gaGF2ZSBhIHNpbmdsZSBvYmplY3Qgd2hlcmUgYWxsIG9mIHRoZSBzdGF0ZSBpcyBzdG9yZWQgYXMgYSBtZW50YWwgbW9kZWxcbiAqIChyYXRoZXIgaXQgYmVpbmcgc3ByZWFkIGFjcm9zcyBtYW55IGRpZmZlcmVudCB2YXJpYWJsZXMuKVxuICpcbiAqIFBFUkYgTk9URTogVHVybnMgb3V0IHRoYXQgd3JpdGluZyB0byBhIHRydWUgZ2xvYmFsIHZhcmlhYmxlIGlzIHNsb3dlciB0aGFuXG4gKiBoYXZpbmcgYW4gaW50ZXJtZWRpYXRlIG9iamVjdCB3aXRoIHByb3BlcnRpZXMuXG4gKi9cbmludGVyZmFjZSBJbnN0cnVjdGlvblN0YXRlIHtcbiAgLyoqXG4gICAqIEN1cnJlbnQgYExGcmFtZWBcbiAgICpcbiAgICogYG51bGxgIGlmIHdlIGhhdmUgbm90IGNhbGxlZCBgZW50ZXJWaWV3YFxuICAgKi9cbiAgbEZyYW1lOiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gICAqXG4gICAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoZW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZyb20gbWF0Y2hpbmdcbiAgICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gICAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAgICogPC9teS1jb21wPlxuICAgKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gICAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICAgKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAgICogICA8L215LWNvbXA+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICovXG4gIGJpbmRpbmdzRW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSW4gdGhpcyBtb2RlLCBhbnkgY2hhbmdlcyBpbiBiaW5kaW5ncyB3aWxsIHRocm93IGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yLlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgaW5zdHJ1Y3Rpb25TdGF0ZTogSW5zdHJ1Y3Rpb25TdGF0ZSA9IHtcbiAgbEZyYW1lOiBjcmVhdGVMRnJhbWUobnVsbCksXG4gIGJpbmRpbmdzRW5hYmxlZDogdHJ1ZSxcbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBmYWxzZSxcbn07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnREZXB0aENvdW50KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBgTFZpZXdgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUubFZpZXc7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGBUVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS50Vmlldztcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpOiBUTm9kZSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGU6IFROb2RlLCBfaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUucHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gX2lzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXNQYXJlbnQoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldElzTm90UGFyZW50KCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudCA9IGZhbHNlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldElzUGFyZW50KCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudCA9IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk6IGJvb2xlYW4ge1xuICAvLyBUT0RPKG1pc2tvKTogcmVtb3ZlIHRoaXMgZnJvbSB0aGUgTFZpZXcgc2luY2UgaXQgaXMgbmdEZXZNb2RlPXRydWUgbW9kZSBvbmx5LlxuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5jaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVja05vQ2hhbmdlc01vZGUobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmNoZWNrTm9DaGFuZ2VzTW9kZSA9IG1vZGU7XG59XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGxldCBpbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4O1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgaW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IGxGcmFtZS50Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdJbmRleCh2YWx1ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdJbmRleCA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV4dEJpbmRpbmdJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoY291bnQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBpbmRleCA9IGxGcmFtZS5iaW5kaW5nSW5kZXg7XG4gIGxGcmFtZS5iaW5kaW5nSW5kZXggPSBsRnJhbWUuYmluZGluZ0luZGV4ICsgY291bnQ7XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBTZXQgYSBuZXcgYmluZGluZyByb290IGluZGV4IHNvIHRoYXQgaG9zdCB0ZW1wbGF0ZSBmdW5jdGlvbnMgY2FuIGV4ZWN1dGUuXG4gKlxuICogQmluZGluZ3MgaW5zaWRlIHRoZSBob3N0IHRlbXBsYXRlIGFyZSAwIGluZGV4LiBCdXQgYmVjYXVzZSB3ZSBkb24ndCBrbm93IGFoZWFkIG9mIHRpbWVcbiAqIGhvdyBtYW55IGhvc3QgYmluZGluZ3Mgd2UgaGF2ZSB3ZSBjYW4ndCBwcmUtY29tcHV0ZSB0aGVtLiBGb3IgdGhpcyByZWFzb24gdGhleSBhcmUgYWxsXG4gKiAwIGluZGV4IGFuZCB3ZSBqdXN0IHNoaWZ0IHRoZSByb290IHNvIHRoYXQgdGhleSBtYXRjaCBuZXh0IGF2YWlsYWJsZSBsb2NhdGlvbiBpbiB0aGUgTFZpZXcuXG4gKlxuICogQHBhcmFtIGJpbmRpbmdSb290SW5kZXggUm9vdCBpbmRleCBmb3IgYGhvc3RCaW5kaW5nc2BcbiAqIEBwYXJhbSBjdXJyZW50RGlyZWN0aXZlSW5kZXggYFREYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIHdpbGwgcG9pbnQgdG8gdGhlIGN1cnJlbnQgZGlyZWN0aXZlXG4gKiAgICAgICAgd2hvc2UgYGhvc3RCaW5kaW5nc2AgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKFxuICAgIGJpbmRpbmdSb290SW5kZXg6IG51bWJlciwgY3VycmVudERpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGxGcmFtZS5iaW5kaW5nSW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IGJpbmRpbmdSb290SW5kZXg7XG4gIGxGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXggPSBjdXJyZW50RGlyZWN0aXZlSW5kZXg7XG59XG5cbi8qKlxuICogV2hlbiBob3N0IGJpbmRpbmcgaXMgZXhlY3V0aW5nIHRoaXMgcG9pbnRzIHRvIHRoZSBkaXJlY3RpdmUgaW5kZXguXG4gKiBgVFZpZXcuZGF0YVtnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKV1gIGlzIGBEaXJlY3RpdmVEZWZgXG4gKiBgTFZpZXdbZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCldYCBpcyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBlbnRlclZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICogQHBhcmFtIG5ld1ZpZXdcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJESShuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlICE7XG4gIG5ld0xGcmFtZS5sVmlldyA9IG5ld1ZpZXc7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyByZXNldHRpbmcgZm9yIHNhZmV0eSBpbiBkZXYgbW9kZSBvbmx5LlxuICAgIG5ld0xGcmFtZS5pc1BhcmVudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5zZWxlY3RlZEluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IERFVl9NT0RFX1ZBTFVFO1xuICB9XG59XG5cbmNvbnN0IERFVl9NT0RFX1ZBTFVFOiBhbnkgPVxuICAgICdWYWx1ZSBpbmRpY2F0aW5nIHRoYXQgREkgaXMgdHJ5aW5nIHRvIHJlYWQgdmFsdWUgd2hpY2ggaXQgc2hvdWxkIG5vdCBuZWVkIHRvIGtub3cgYWJvdXQuJztcblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBsZWF2ZVZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICpcbiAqIEJlY2F1c2UgdGhlIGltcGxlbWVudGF0aW9uIGlzIHNhbWUgaXQgaXMgb25seSBhbiBhbGlhc1xuICovXG5leHBvcnQgY29uc3QgbGVhdmVESSA9IGxlYXZlVmlldztcblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IGxWaWV3IHdpdGggYSBuZXcgbFZpZXcuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIGxWaWV3IGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIGxWaWV3IGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IGxWaWV3IHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSB0Tm9kZSBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZChuZXdWaWV3KTtcbiAgY29uc3QgbmV3TEZyYW1lID0gYWxsb2NMRnJhbWUoKTtcbiAgY29uc3QgdFZpZXcgPSBuZXdWaWV3W1RWSUVXXTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBuZXdMRnJhbWU7XG4gIG5ld0xGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZSAhO1xuICBuZXdMRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBuZXdMRnJhbWUudFZpZXcgPSB0VmlldztcbiAgbmV3TEZyYW1lLnNlbGVjdGVkSW5kZXggPSAwO1xuICBuZXdMRnJhbWUuY29udGV4dExWaWV3ID0gbmV3VmlldyAhO1xuICBuZXdMRnJhbWUuZWxlbWVudERlcHRoQ291bnQgPSAwO1xuICBuZXdMRnJhbWUuY3VycmVudERpcmVjdGl2ZUluZGV4ID0gLTE7XG4gIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbiAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBudWxsO1xuICBuZXdMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IC0xO1xuICBuZXdMRnJhbWUuYmluZGluZ0luZGV4ID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IDA7XG59XG5cbi8qKlxuICogQWxsb2NhdGVzIG5leHQgZnJlZSBMRnJhbWUuIFRoaXMgZnVuY3Rpb24gdHJpZXMgdG8gcmV1c2UgdGhlIGBMRnJhbWVgcyB0byBsb3dlciBtZW1vcnkgcHJlc3N1cmUuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jTEZyYW1lKCkge1xuICBjb25zdCBjdXJyZW50TEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGNvbnN0IGNoaWxkTEZyYW1lID0gY3VycmVudExGcmFtZSA9PT0gbnVsbCA/IG51bGwgOiBjdXJyZW50TEZyYW1lLmNoaWxkO1xuICBjb25zdCBuZXdMRnJhbWUgPSBjaGlsZExGcmFtZSA9PT0gbnVsbCA/IGNyZWF0ZUxGcmFtZShjdXJyZW50TEZyYW1lKSA6IGNoaWxkTEZyYW1lO1xuICByZXR1cm4gbmV3TEZyYW1lO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMRnJhbWUocGFyZW50OiBMRnJhbWUgfCBudWxsKTogTEZyYW1lIHtcbiAgY29uc3QgbEZyYW1lOiBMRnJhbWUgPSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlOiBudWxsICEsICAvL1xuICAgIGlzUGFyZW50OiB0cnVlLCAgICAgICAgICAgICAgICAgLy9cbiAgICBsVmlldzogbnVsbCAhLCAgICAgICAgICAgICAgICAgIC8vXG4gICAgdFZpZXc6IG51bGwgISwgICAgICAgICAgICAgICAgICAvL1xuICAgIHNlbGVjdGVkSW5kZXg6IDAsICAgICAgICAgICAgICAgLy9cbiAgICBjb250ZXh0TFZpZXc6IG51bGwgISwgICAgICAgICAgIC8vXG4gICAgZWxlbWVudERlcHRoQ291bnQ6IDAsICAgICAgICAgICAvL1xuICAgIGN1cnJlbnROYW1lc3BhY2U6IG51bGwsICAgICAgICAgLy9cbiAgICBjdXJyZW50U2FuaXRpemVyOiBudWxsLCAgICAgICAgIC8vXG4gICAgY3VycmVudERpcmVjdGl2ZUluZGV4OiAtMSwgICAgICAvL1xuICAgIGJpbmRpbmdSb290SW5kZXg6IC0xLCAgICAgICAgICAgLy9cbiAgICBiaW5kaW5nSW5kZXg6IC0xLCAgICAgICAgICAgICAgIC8vXG4gICAgY3VycmVudFF1ZXJ5SW5kZXg6IDAsICAgICAgICAgICAvL1xuICAgIHBhcmVudDogcGFyZW50ICEsICAgICAgICAgICAgICAgLy9cbiAgICBjaGlsZDogbnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gIH07XG4gIHBhcmVudCAhPT0gbnVsbCAmJiAocGFyZW50LmNoaWxkID0gbEZyYW1lKTsgIC8vIGxpbmsgdGhlIG5ldyBMRnJhbWUgZm9yIHJldXNlLlxuICByZXR1cm4gbEZyYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnBhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyKTogVCB7XG4gIGNvbnN0IGNvbnRleHRMVmlldyA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9XG4gICAgICB3YWxrVXBWaWV3cyhsZXZlbCwgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZWxlbWVudCBpbmRleC5cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkSW5kZXgoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4O1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1vc3QgcmVjZW50IGluZGV4IHBhc3NlZCB0byB7QGxpbmsgc2VsZWN0fVxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICpcbiAqIChOb3RlIHRoYXQgaWYgYW4gXCJleGl0IGZ1bmN0aW9uXCIgd2FzIHNldCBlYXJsaWVyICh2aWEgYHNldEVsZW1lbnRFeGl0Rm4oKWApIHRoZW4gdGhhdCB3aWxsIGJlXG4gKiBydW4gaWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBpbmRleGAgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0ZWQgaW5kZXggdmFsdWUuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbn1cblxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlU1ZHKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gU1ZHX05BTUVTUEFDRTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSBNQVRIX01MX05BTUVTUEFDRTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTEludGVybmFsKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50U2FuaXRpemVyID0gc2FuaXRpemVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpIHtcbiAgLy8gVE9ETyhtaXNrbyk6IFRoaXMgc2hvdWxkIHRocm93IHdoZW4gdGhlcmUgaXMgbm8gTFZpZXcsIGJ1dCBpdCB0dXJucyBvdXQgd2UgY2FuIGdldCBoZXJlIGZyb21cbiAgLy8gYE5vZGVTdHlsZURlYnVnYCBoZW5jZSB3ZSByZXR1cm4gYG51bGxgLiBUaGlzIHNob3VsZCBiZSBmaXhlZFxuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGxGcmFtZSA9PT0gbnVsbCA/IG51bGwgOiBsRnJhbWUuY3VycmVudFNhbml0aXplcjtcbn1cbiJdfQ==