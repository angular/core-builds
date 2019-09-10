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
import { assertDefined } from '../util/assert';
import { assertLViewOrUndefined } from './assert';
import { CONTEXT, DECLARATION_VIEW } from './interfaces/view';
import { resetStylingState } from './styling_next/state';
/**
 * Store the element depth count. This is used to identify the root elements of the template
 * so that we can than attach `LView` to only those elements.
 * @type {?}
 */
let elementDepthCount;
/**
 * @return {?}
 */
export function getElementDepthCount() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return elementDepthCount;
}
/**
 * @return {?}
 */
export function increaseElementDepthCount() {
    elementDepthCount++;
}
/**
 * @return {?}
 */
export function decreaseElementDepthCount() {
    elementDepthCount--;
}
/** @type {?} */
let currentDirectiveDef = null;
/**
 * @return {?}
 */
export function getCurrentDirectiveDef() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return currentDirectiveDef;
}
/**
 * @param {?} def
 * @return {?}
 */
export function setCurrentDirectiveDef(def) {
    currentDirectiveDef = def;
}
/**
 * Stores whether directives should be matched to elements.
 *
 * When template contains `ngNonBindable` than we need to prevent the runtime form matching
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
let bindingsEnabled;
/**
 * @return {?}
 */
export function getBindingsEnabled() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return bindingsEnabled;
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
    bindingsEnabled = true;
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
    bindingsEnabled = false;
}
/**
 * @return {?}
 */
export function getLView() {
    return lView;
}
/**
 * Used as the starting directive id value.
 *
 * All subsequent directives are incremented from this value onwards.
 * The reason why this value is `1` instead of `0` is because the `0`
 * value is reserved for the template.
 * @type {?}
 */
let activeDirectiveId = 0;
/** @enum {number} */
const ActiveElementFlags = {
    Initial: 0,
    RunExitFn: 1,
    ResetStylesOnExit: 2,
    Size: 2,
};
export { ActiveElementFlags };
/**
 * Determines whether or not a flag is currently set for the active element.
 * @param {?} flag
 * @return {?}
 */
export function hasActiveElementFlag(flag) {
    return (_selectedIndex & flag) === flag;
}
/**
 * Sets a flag is for the active element.
 * @param {?} flag
 * @return {?}
 */
export function setActiveElementFlag(flag) {
    _selectedIndex |= flag;
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
    if (getSelectedIndex() !== elementIndex) {
        if (hasActiveElementFlag(1 /* RunExitFn */)) {
            executeElementExitFn();
        }
        if (hasActiveElementFlag(2 /* ResetStylesOnExit */)) {
            resetStylingState();
        }
        setSelectedIndex(elementIndex === null ? -1 : elementIndex);
        activeDirectiveId = 0;
    }
}
/** @type {?} */
let _elementExitFn = null;
/**
 * @return {?}
 */
export function executeElementExitFn() {
    (/** @type {?} */ (_elementExitFn))();
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
    _elementExitFn = fn;
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
    return activeDirectiveId;
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
    activeDirectiveId += 1;
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
    contextLView = (/** @type {?} */ ((/** @type {?} */ (viewToRestore))));
}
/**
 * Used to set the parent property when nodes are created and track query results.
 * @type {?}
 */
let previousOrParentTNode;
/**
 * @return {?}
 */
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
/**
 * @param {?} tNode
 * @param {?} _isParent
 * @return {?}
 */
export function setPreviousOrParentTNode(tNode, _isParent) {
    previousOrParentTNode = tNode;
    isParent = _isParent;
}
/**
 * @param {?} tNode
 * @param {?} view
 * @return {?}
 */
export function setTNodeAndViewData(tNode, view) {
    ngDevMode && assertLViewOrUndefined(view);
    previousOrParentTNode = tNode;
    lView = view;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
 * @type {?}
 */
let isParent;
/**
 * @return {?}
 */
export function getIsParent() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return isParent;
}
/**
 * @return {?}
 */
export function setIsNotParent() {
    isParent = false;
}
/**
 * @return {?}
 */
export function setIsParent() {
    isParent = true;
}
/**
 * State of the current view being processed.
 *
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 * @type {?}
 */
let lView;
/**
 * The last viewData retrieved by nextContext().
 * Allows building nextContext() and reference() calls.
 *
 * e.g. const inner = x().$implicit; const outer = x().$implicit;
 * @type {?}
 */
let contextLView = (/** @type {?} */ (null));
/**
 * @return {?}
 */
export function getContextLView() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return contextLView;
}
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 * @type {?}
 */
let checkNoChangesMode = false;
/**
 * @return {?}
 */
export function getCheckNoChangesMode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return checkNoChangesMode;
}
/**
 * @param {?} mode
 * @return {?}
 */
export function setCheckNoChangesMode(mode) {
    checkNoChangesMode = mode;
}
/**
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
 * @type {?}
 */
let bindingRootIndex = -1;
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
/**
 * @return {?}
 */
export function getBindingRoot() {
    return bindingRootIndex;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setBindingRoot(value) {
    bindingRootIndex = value;
}
/**
 * Current index of a View or Content Query which needs to be processed next.
 * We iterate over the list of Queries and increment current query index at every step.
 * @type {?}
 */
let currentQueryIndex = 0;
/**
 * @return {?}
 */
export function getCurrentQueryIndex() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return currentQueryIndex;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setCurrentQueryIndex(value) {
    currentQueryIndex = value;
}
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param {?} newView New lView to become active
 * @param {?} hostTNode
 * @return {?} the previously active lView;
 */
export function selectView(newView, hostTNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    /** @type {?} */
    const oldView = lView;
    previousOrParentTNode = (/** @type {?} */ (hostTNode));
    isParent = true;
    lView = contextLView = newView;
    return oldView;
}
/**
 * @template T
 * @param {?=} level
 * @return {?}
 */
export function nextContextImpl(level = 1) {
    contextLView = walkUpViews(level, (/** @type {?} */ (contextLView)));
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
 * Resets the application state.
 * @return {?}
 */
export function resetComponentState() {
    isParent = false;
    previousOrParentTNode = (/** @type {?} */ (null));
    elementDepthCount = 0;
    bindingsEnabled = true;
    setCurrentStyleSanitizer(null);
}
/* tslint:disable */
/** @type {?} */
let _selectedIndex = -1 << 2 /* Size */;
/**
 * Gets the most recent index passed to {\@link select}
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 * @return {?}
 */
export function getSelectedIndex() {
    return _selectedIndex >> 2 /* Size */;
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
    _selectedIndex = index << 2 /* Size */;
}
/** @type {?} */
let _currentNamespace = null;
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg';
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceMathML() {
    _currentNamespace = 'http://www.w3.org/1998/MathML/';
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
    _currentNamespace = null;
}
/**
 * @return {?}
 */
export function getNamespace() {
    return _currentNamespace;
}
/** @type {?} */
let _currentSanitizer;
/**
 * @param {?} sanitizer
 * @return {?}
 */
export function setCurrentStyleSanitizer(sanitizer) {
    _currentSanitizer = sanitizer;
}
/**
 * @return {?}
 */
export function getCurrentStyleSanitizer() {
    return _currentSanitizer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUdoRCxPQUFPLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFnQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDOzs7Ozs7SUFPbkQsaUJBQTJCOzs7O0FBRS9CLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMscUZBQXFGO0lBQ3JGLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QixDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7O0lBRUcsbUJBQW1CLEdBQTZDLElBQUk7Ozs7QUFFeEUsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxxRkFBcUY7SUFDckYsT0FBTyxtQkFBbUIsQ0FBQztBQUM3QixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxHQUErQztJQUNwRixtQkFBbUIsR0FBRyxHQUFHLENBQUM7QUFDNUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFvQkcsZUFBMEI7Ozs7QUFFOUIsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxxRkFBcUY7SUFDckYsT0FBTyxlQUFlLENBQUM7QUFDekIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JELE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsZUFBZSxHQUFHLElBQUksQ0FBQztBQUN6QixDQUFD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LFVBQVUsaUJBQWlCO0lBQy9CLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFDO0FBQ3ZELENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGVBQWU7SUFDN0IscUJBQXFCLEVBQUUsQ0FBQztBQUMxQixDQUFDOzs7Ozs7QUFNRCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUMzQixDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLFlBQVk7SUFDMUIsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDOztJQUVHLGlCQUF1Qzs7Ozs7QUFDM0MsTUFBTSxVQUFVLHdCQUF3QixDQUFDLFNBQWlDO0lBQ3hFLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztBQUNoQyxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHdCQUF3QjtJQUN0QyxPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2Fzc2VydExWaWV3T3JVbmRlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIExWaWV3LCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Jlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuL3N0eWxpbmdfbmV4dC9zdGF0ZSc7XG5cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3YCB0byBvbmx5IHRob3NlIGVsZW1lbnRzLlxuICovXG5sZXQgZWxlbWVudERlcHRoQ291bnQgITogbnVtYmVyO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudERlcHRoQ291bnQoKSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGVsZW1lbnREZXB0aENvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbmxldCBjdXJyZW50RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREaXJlY3RpdmVEZWYoKTogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbCB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVEZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+fCBudWxsKTogdm9pZCB7XG4gIGN1cnJlbnREaXJlY3RpdmVEZWYgPSBkZWY7XG59XG5cbi8qKlxuICogU3RvcmVzIHdoZXRoZXIgZGlyZWN0aXZlcyBzaG91bGQgYmUgbWF0Y2hlZCB0byBlbGVtZW50cy5cbiAqXG4gKiBXaGVuIHRlbXBsYXRlIGNvbnRhaW5zIGBuZ05vbkJpbmRhYmxlYCB0aGFuIHdlIG5lZWQgdG8gcHJldmVudCB0aGUgcnVudGltZSBmb3JtIG1hdGNoaW5nXG4gKiBkaXJlY3RpdmVzIG9uIGNoaWxkcmVuIG9mIHRoYXQgZWxlbWVudC5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICovXG5sZXQgYmluZGluZ3NFbmFibGVkICE6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGJpbmRpbmdzRW5hYmxlZDtcbn1cblxuXG4vKipcbiAqIEVuYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnRzLlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZW5hYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogRGlzYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnQuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBhcyB0aGUgc3RhcnRpbmcgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICpcbiAqIEFsbCBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGluY3JlbWVudGVkIGZyb20gdGhpcyB2YWx1ZSBvbndhcmRzLlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyB2YWx1ZSBpcyBgMWAgaW5zdGVhZCBvZiBgMGAgaXMgYmVjYXVzZSB0aGUgYDBgXG4gKiB2YWx1ZSBpcyByZXNlcnZlZCBmb3IgdGhlIHRlbXBsYXRlLlxuICovXG5sZXQgYWN0aXZlRGlyZWN0aXZlSWQgPSAwO1xuXG4vKipcbiAqIEZsYWdzIHVzZWQgZm9yIGFuIGFjdGl2ZSBlbGVtZW50IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFRoZXNlIGZsYWdzIGFyZSB1c2VkIHdpdGhpbiBvdGhlciBpbnN0cnVjdGlvbnMgdG8gaW5mb3JtIGNsZWFudXAgb3JcbiAqIGV4aXQgb3BlcmF0aW9ucyB0byBydW4gd2hlbiBhbiBlbGVtZW50IGlzIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlc2UgZmxhZ3MgYXJlIHJlc2V0IGVhY2ggdGltZSBhbiBlbGVtZW50IGNoYW5nZXMgKHdoZXRoZXIgaXRcbiAqIGhhcHBlbnMgd2hlbiBgYWR2YW5jZSgpYCBpcyBydW4gb3Igd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGV4aXRzIG91dCBvZiBhIHRlbXBsYXRlXG4gKiBmdW5jdGlvbiBvciB3aGVuIGFsbCBob3N0IGJpbmRpbmdzIGFyZSBwcm9jZXNzZWQgZm9yIGFuIGVsZW1lbnQpLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBBY3RpdmVFbGVtZW50RmxhZ3Mge1xuICBJbml0aWFsID0gMGIwMCxcbiAgUnVuRXhpdEZuID0gMGIwMSxcbiAgUmVzZXRTdHlsZXNPbkV4aXQgPSAwYjEwLFxuICBTaXplID0gMixcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IGEgZmxhZyBpcyBjdXJyZW50bHkgc2V0IGZvciB0aGUgYWN0aXZlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNBY3RpdmVFbGVtZW50RmxhZyhmbGFnOiBBY3RpdmVFbGVtZW50RmxhZ3MpIHtcbiAgcmV0dXJuIChfc2VsZWN0ZWRJbmRleCAmIGZsYWcpID09PSBmbGFnO1xufVxuXG4vKipcbiAqIFNldHMgYSBmbGFnIGlzIGZvciB0aGUgYWN0aXZlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRBY3RpdmVFbGVtZW50RmxhZyhmbGFnOiBBY3RpdmVFbGVtZW50RmxhZ3MpIHtcbiAgX3NlbGVjdGVkSW5kZXggfD0gZmxhZztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBhY3RpdmUgZGlyZWN0aXZlIGhvc3QgZWxlbWVudCBhbmQgcmVzZXRzIHRoZSBkaXJlY3RpdmUgaWQgdmFsdWVcbiAqICh3aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50SW5kZXggdmFsdWUgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50SW5kZXggdGhlIGVsZW1lbnQgaW5kZXggdmFsdWUgZm9yIHRoZSBob3N0IGVsZW1lbnQgd2hlcmVcbiAqICAgICAgICAgICAgICAgICAgICAgdGhlIGRpcmVjdGl2ZS9jb21wb25lbnQgaW5zdGFuY2UgbGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEFjdGl2ZUhvc3RFbGVtZW50KGVsZW1lbnRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGwpIHtcbiAgaWYgKGdldFNlbGVjdGVkSW5kZXgoKSAhPT0gZWxlbWVudEluZGV4KSB7XG4gICAgaWYgKGhhc0FjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pKSB7XG4gICAgICBleGVjdXRlRWxlbWVudEV4aXRGbigpO1xuICAgIH1cbiAgICBpZiAoaGFzQWN0aXZlRWxlbWVudEZsYWcoQWN0aXZlRWxlbWVudEZsYWdzLlJlc2V0U3R5bGVzT25FeGl0KSkge1xuICAgICAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbiAgICB9XG4gICAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXggPT09IG51bGwgPyAtMSA6IGVsZW1lbnRJbmRleCk7XG4gICAgYWN0aXZlRGlyZWN0aXZlSWQgPSAwO1xuICB9XG59XG5cbmxldCBfZWxlbWVudEV4aXRGbjogRnVuY3Rpb258bnVsbCA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUVsZW1lbnRFeGl0Rm4oKSB7XG4gIF9lbGVtZW50RXhpdEZuICEoKTtcbn1cblxuLyoqXG4gKiBRdWV1ZXMgYSBmdW5jdGlvbiB0byBiZSBydW4gb25jZSB0aGUgZWxlbWVudCBpcyBcImV4aXRlZFwiIGluIENELlxuICpcbiAqIENoYW5nZSBkZXRlY3Rpb24gd2lsbCBmb2N1cyBvbiBhbiBlbGVtZW50IGVpdGhlciB3aGVuIHRoZSBgYWR2YW5jZSgpYFxuICogaW5zdHJ1Y3Rpb24gaXMgY2FsbGVkIG9yIHdoZW4gdGhlIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgaW5zdHJ1Y3Rpb25cbiAqIGNvZGUgaXMgaW52b2tlZC4gVGhlIGVsZW1lbnQgaXMgdGhlbiBcImV4aXRlZFwiIHdoZW4gdGhlIG5leHQgZWxlbWVudCBpc1xuICogc2VsZWN0ZWQgb3Igd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBpc1xuICogY29tcGxldGUuIFdoZW4gdGhpcyBvY2N1cnMgKHRoZSBlbGVtZW50IGNoYW5nZSBvcGVyYXRpb24pIHRoZW4gYW4gZXhpdFxuICogZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIGlmIGl0IGhhcyBiZWVuIHNldC4gVGhpcyBmdW5jdGlvbiBjYW4gYmUgdXNlZFxuICogdG8gYXNzaWduIHRoYXQgZXhpdCBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gZm5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEVsZW1lbnRFeGl0Rm4oZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIHNldEFjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pO1xuICBfZWxlbWVudEV4aXRGbiA9IGZuO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgaWQgdmFsdWUgb2YgdGhlIGN1cnJlbnQgZGlyZWN0aXZlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgYW4gZWxlbWVudCB0aGF0IGhhcyB0d28gZGlyZWN0aXZlcyBvbiBpdDpcbiAqIDxkaXYgZGlyLW9uZSBkaXItdHdvPjwvZGl2PlxuICpcbiAqIGRpck9uZS0+aG9zdEJpbmRpbmdzKCkgKGlkID09IDEpXG4gKiBkaXJUd28tPmhvc3RCaW5kaW5ncygpIChpZCA9PSAyKVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgZGlyZWN0aXZlIGlkIHZhbHVlcyBhcmUgc3BlY2lmaWMgdG8gYW4gZWxlbWVudCAodGhpcyBtZWFucyB0aGF0XG4gKiB0aGUgc2FtZSBpZCB2YWx1ZSBjb3VsZCBiZSBwcmVzZW50IG9uIGFub3RoZXIgZWxlbWVudCB3aXRoIGEgY29tcGxldGVseVxuICogZGlmZmVyZW50IHNldCBvZiBkaXJlY3RpdmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkge1xuICByZXR1cm4gYWN0aXZlRGlyZWN0aXZlSWQ7XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgY3VycmVudCBkaXJlY3RpdmUgaWQgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSBhbiBlbGVtZW50IHRoYXQgaGFzIHR3byBkaXJlY3RpdmVzIG9uIGl0OlxuICogPGRpdiBkaXItb25lIGRpci10d28+PC9kaXY+XG4gKlxuICogZGlyT25lLT5ob3N0QmluZGluZ3MoKSAoaW5kZXggPSAxKVxuICogLy8gaW5jcmVtZW50XG4gKiBkaXJUd28tPmhvc3RCaW5kaW5ncygpIChpbmRleCA9IDIpXG4gKlxuICogRGVwZW5kaW5nIG9uIHdoZXRoZXIgb3Igbm90IGEgcHJldmlvdXMgZGlyZWN0aXZlIGhhZCBhbnkgaW5oZXJpdGVkXG4gKiBkaXJlY3RpdmVzIHByZXNlbnQsIHRoYXQgdmFsdWUgd2lsbCBiZSBpbmNyZW1lbnRlZCBpbiBhZGRpdGlvblxuICogdG8gdGhlIGlkIGp1bXBpbmcgdXAgYnkgb25lLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgZGlyZWN0aXZlIGlkIHZhbHVlcyBhcmUgc3BlY2lmaWMgdG8gYW4gZWxlbWVudCAodGhpcyBtZWFucyB0aGF0XG4gKiB0aGUgc2FtZSBpZCB2YWx1ZSBjb3VsZCBiZSBwcmVzZW50IG9uIGFub3RoZXIgZWxlbWVudCB3aXRoIGEgY29tcGxldGVseVxuICogZGlmZmVyZW50IHNldCBvZiBkaXJlY3RpdmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCkge1xuICAvLyBFYWNoIGRpcmVjdGl2ZSBnZXRzIGEgdW5pcXVlSWQgdmFsdWUgdGhhdCBpcyB0aGUgc2FtZSBmb3IgYm90aFxuICAvLyBjcmVhdGUgYW5kIHVwZGF0ZSBjYWxscyB3aGVuIHRoZSBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkLiBUaGVcbiAgLy8gZGlyZWN0aXZlIHVuaXF1ZUlkIGlzIG5vdCBzZXQgYW55d2hlcmUtLWl0IGlzIGp1c3QgaW5jcmVtZW50ZWQgYmV0d2VlblxuICAvLyBlYWNoIGhvc3RCaW5kaW5ncyBjYWxsIGFuZCBpcyB1c2VmdWwgZm9yIGhlbHBpbmcgaW5zdHJ1Y3Rpb24gY29kZVxuICAvLyB1bmlxdWVseSBkZXRlcm1pbmUgd2hpY2ggZGlyZWN0aXZlIGlzIGN1cnJlbnRseSBhY3RpdmUgd2hlbiBleGVjdXRlZC5cbiAgYWN0aXZlRGlyZWN0aXZlSWQgKz0gMTtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBjb250ZXh0TFZpZXcgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlldztcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlOiBUTm9kZSwgX2lzUGFyZW50OiBib29sZWFuKSB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGU6IFROb2RlLCB2aWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZCh2aWV3KTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGxWaWV3ID0gdmlldztcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldElzUGFyZW50KCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBpc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldElzTm90UGFyZW50KCk6IHZvaWQge1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldElzUGFyZW50KCk6IHZvaWQge1xuICBpc1BhcmVudCA9IHRydWU7XG59XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICovXG5sZXQgbFZpZXc6IExWaWV3O1xuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0TFZpZXc6IExWaWV3ID0gbnVsbCAhO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dExWaWV3KCk6IExWaWV3IHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY29udGV4dExWaWV3O1xufVxuXG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNoZWNrTm9DaGFuZ2VzTW9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENoZWNrTm9DaGFuZ2VzTW9kZShtb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IG1vZGU7XG59XG5cbi8qKlxuICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICsgYW55IGRpcnMvaG9zdFZhcnMgYmVmb3JlIHRoZSBnaXZlbiBkaXIuXG4gKi9cbmxldCBiaW5kaW5nUm9vdEluZGV4OiBudW1iZXIgPSAtMTtcblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICByZXR1cm4gYmluZGluZ1Jvb3RJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdSb290KHZhbHVlOiBudW1iZXIpIHtcbiAgYmluZGluZ1Jvb3RJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIEN1cnJlbnQgaW5kZXggb2YgYSBWaWV3IG9yIENvbnRlbnQgUXVlcnkgd2hpY2ggbmVlZHMgdG8gYmUgcHJvY2Vzc2VkIG5leHQuXG4gKiBXZSBpdGVyYXRlIG92ZXIgdGhlIGxpc3Qgb2YgUXVlcmllcyBhbmQgaW5jcmVtZW50IGN1cnJlbnQgcXVlcnkgaW5kZXggYXQgZXZlcnkgc3RlcC5cbiAqL1xubGV0IGN1cnJlbnRRdWVyeUluZGV4OiBudW1iZXIgPSAwO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTogbnVtYmVyIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3VycmVudFF1ZXJ5SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50UXVlcnlJbmRleCh2YWx1ZTogbnVtYmVyKTogdm9pZCB7XG4gIGN1cnJlbnRRdWVyeUluZGV4ID0gdmFsdWU7XG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBsVmlldyB3aXRoIGEgbmV3IGxWaWV3LlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBsVmlldyBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBsVmlldyBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBsVmlldyB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdFZpZXcobmV3VmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQobmV3Vmlldyk7XG4gIGNvbnN0IG9sZFZpZXcgPSBsVmlldztcblxuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBob3N0VE5vZGUgITtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuXG4gIGxWaWV3ID0gY29udGV4dExWaWV3ID0gbmV3VmlldztcbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dEltcGw8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgY29udGV4dExWaWV3ID0gd2Fsa1VwVmlld3MobGV2ZWwsIGNvbnRleHRMVmlldyAhKTtcbiAgcmV0dXJuIGNvbnRleHRMVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3KTogTFZpZXcge1xuICB3aGlsZSAobmVzdGluZ0xldmVsID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAnRGVjbGFyYXRpb24gdmlldyBzaG91bGQgYmUgZGVmaW5lZCBpZiBuZXN0aW5nIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBuZXN0aW5nTGV2ZWwtLTtcbiAgfVxuICByZXR1cm4gY3VycmVudFZpZXc7XG59XG5cbi8qKlxuICogUmVzZXRzIHRoZSBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29tcG9uZW50U3RhdGUoKSB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IG51bGwgITtcbiAgZWxlbWVudERlcHRoQ291bnQgPSAwO1xuICBiaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIobnVsbCk7XG59XG5cbi8qIHRzbGludDpkaXNhYmxlICovXG5sZXQgX3NlbGVjdGVkSW5kZXggPSAtMSA8PCBBY3RpdmVFbGVtZW50RmxhZ3MuU2l6ZTtcblxuLyoqXG4gKiBHZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkSW5kZXgoKSB7XG4gIHJldHVybiBfc2VsZWN0ZWRJbmRleCA+PiBBY3RpdmVFbGVtZW50RmxhZ3MuU2l6ZTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqXG4gKiAoTm90ZSB0aGF0IGlmIGFuIFwiZXhpdCBmdW5jdGlvblwiIHdhcyBzZXQgZWFybGllciAodmlhIGBzZXRFbGVtZW50RXhpdEZuKClgKSB0aGVuIHRoYXQgd2lsbCBiZVxuICogcnVuIGlmIGFuZCB3aGVuIHRoZSBwcm92aWRlZCBgaW5kZXhgIHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGVkIGluZGV4IHZhbHVlLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICBfc2VsZWN0ZWRJbmRleCA9IGluZGV4IDw8IEFjdGl2ZUVsZW1lbnRGbGFncy5TaXplO1xufVxuXG5cbmxldCBfY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlU1ZHKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlTWF0aE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlSFRNTCgpIHtcbiAgbmFtZXNwYWNlSFRNTEludGVybmFsKCk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudE5hbWVzcGFjZTtcbn1cblxubGV0IF9jdXJyZW50U2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIF9jdXJyZW50U2FuaXRpemVyID0gc2FuaXRpemVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkge1xuICByZXR1cm4gX2N1cnJlbnRTYW5pdGl6ZXI7XG59XG4iXX0=