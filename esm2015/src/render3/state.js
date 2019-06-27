/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { executeHooks } from './hooks';
import { BINDING_INDEX, CONTEXT, DECLARATION_VIEW, FLAGS, TVIEW } from './interfaces/view';
import { setCachedStylingContext } from './styling/state';
import { resetPreOrderHookFlags } from './util/view_utils';
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
const MIN_DIRECTIVE_ID = 1;
/** @type {?} */
let activeDirectiveId = MIN_DIRECTIVE_ID;
/**
 * Position depth (with respect from leaf to root) in a directive sub-class inheritance chain.
 * @type {?}
 */
let activeDirectiveSuperClassDepthPosition = 0;
/**
 * Total count of how many directives are a part of an inheritance chain.
 *
 * When directives are sub-classed (extended) from one to another, Angular
 * needs to keep track of exactly how many were encountered so it can accurately
 * generate the next directive id (once the next directive id is visited).
 * Normally the next directive id just a single incremented value from the
 * previous one, however, if the previous directive is a part of an inheritance
 * chain (a series of sub-classed directives) then the incremented value must
 * also take into account the total amount of sub-classed values.
 *
 * Note that this value resets back to zero once the next directive is
 * visited (when `incrementActiveDirectiveId` or `setActiveHostElement`
 * is called).
 * @type {?}
 */
let activeDirectiveSuperClassHeight = 0;
/**
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param {?=} elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 * @return {?}
 */
export function setActiveHostElement(elementIndex = null) {
    if (_selectedIndex !== elementIndex) {
        setSelectedIndex(elementIndex == null ? -1 : elementIndex);
        activeDirectiveId = elementIndex == null ? 0 : MIN_DIRECTIVE_ID;
        activeDirectiveSuperClassDepthPosition = 0;
        activeDirectiveSuperClassHeight = 0;
    }
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
    activeDirectiveId += 1 + activeDirectiveSuperClassHeight;
    // because we are dealing with a new directive this
    // means we have exited out of the inheritance chain
    activeDirectiveSuperClassDepthPosition = 0;
    activeDirectiveSuperClassHeight = 0;
}
/**
 * Set the current super class (reverse inheritance) position depth for a directive.
 *
 * For example we have two directives: Child and Other (but Child is a sub-class of Parent)
 * <div child-dir other-dir></div>
 *
 * // increment
 * parentInstance->hostBindings() (depth = 1)
 * // decrement
 * childInstance->hostBindings() (depth = 0)
 * otherInstance->hostBindings() (depth = 0 b/c it's a different directive)
 *
 * Note that this is only active when `hostBinding` functions are being processed.
 * @param {?} delta
 * @return {?}
 */
export function adjustActiveDirectiveSuperClassDepthPosition(delta) {
    activeDirectiveSuperClassDepthPosition += delta;
    // we keep track of the height value so that when the next directive is visited
    // then Angular knows to generate a new directive id value which has taken into
    // account how many sub-class directives were a part of the previous directive.
    activeDirectiveSuperClassHeight =
        Math.max(activeDirectiveSuperClassHeight, activeDirectiveSuperClassDepthPosition);
}
/**
 * Returns he current depth of the super/sub class inheritance chain.
 *
 * This will return how many inherited directive/component classes
 * exist in the current chain.
 *
 * ```typescript
 * \@Directive({ selector: '[super-dir]' })
 * class SuperDir {}
 *  / selector: '[sub-dir]' })
 * class SubDir extends SuperDir {}
 *
 * // if `<div sub-dir>` is used then the super class height is `1`
 * // if `<div super-dir>` is used then the super class height is `0`
 * ```
 * @return {?}
 */
export function getActiveDirectiveSuperClassHeight() {
    return activeDirectiveSuperClassHeight;
}
/**
 * Returns the current super class (reverse inheritance) depth for a directive.
 *
 * This is designed to help instruction code distinguish different hostBindings
 * calls from each other when a directive has extended from another directive.
 * Normally using the directive id value is enough, but with the case
 * of parent/sub-class directive inheritance more information is required.
 *
 * Note that this is only active when `hostBinding` functions are being processed.
 * @return {?}
 */
export function getActiveDirectiveSuperClassDepth() {
    return activeDirectiveSuperClassDepthPosition;
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
 * Checks whether a given view is in creation mode
 * @param {?=} view
 * @return {?}
 */
export function isCreationMode(view = lView) {
    return (view[FLAGS] & 4 /* CreationMode */) === 4 /* CreationMode */;
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
 * Swap the current state with a new state.
 *
 * For performance reasons we store the state in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the state for later, and when the view is
 * exited the state has to be restored
 *
 * @param {?} newView New state to become active
 * @param {?} hostTNode
 * @return {?} the previous state;
 */
export function enterView(newView, hostTNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    /** @type {?} */
    const oldView = lView;
    if (newView) {
        /** @type {?} */
        const tView = newView[TVIEW];
        bindingRootIndex = tView.bindingStartIndex;
    }
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
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param {?} newView New state to become active
 * @param {?} safeToRunHooks Whether the runtime is in a state where running lifecycle hooks is valid.
 * This is not always the case (for example, the application may have crashed and `leaveView` is
 * being executed while unwinding the call stack).
 * @return {?}
 */
export function leaveView(newView, safeToRunHooks) {
    /** @type {?} */
    const tView = lView[TVIEW];
    if (isCreationMode(lView)) {
        lView[FLAGS] &= ~4 /* CreationMode */;
    }
    else {
        try {
            resetPreOrderHookFlags(lView);
            safeToRunHooks && executeHooks(lView, tView.viewHooks, tView.viewCheckHooks, checkNoChangesMode, 2 /* AfterViewInitHooksToBeRun */, undefined);
        }
        finally {
            // Views are clean and in update mode after being checked, so these bits are cleared
            lView[FLAGS] &= ~(64 /* Dirty */ | 8 /* FirstLViewPass */);
            lView[BINDING_INDEX] = tView.bindingStartIndex;
        }
    }
    setCachedStylingContext(null);
    enterView(newView, null);
}
/** @type {?} */
let _selectedIndex = -1;
/**
 * Gets the most recent index passed to {\@link select}
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 * @return {?}
 */
export function getSelectedIndex() {
    return _selectedIndex;
}
/**
 * Sets the most recent index passed to {\@link select}
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 * @param {?} index
 * @return {?}
 */
export function setSelectedIndex(index) {
    _selectedIndex = index;
    // remove the styling context from the cache
    // because we are now on a different element
    setCachedStylingContext(null);
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
 * Sets the namespace used to create elements no `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceHTML() {
    _currentNamespace = null;
}
/**
 * @return {?}
 */
export function getNamespace() {
    return _currentNamespace;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBb0IsTUFBTSxnQkFBZ0IsQ0FBQztBQUVoRSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUdyQyxPQUFPLEVBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQXNELEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdJLE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7SUFRckQsaUJBQTJCOzs7O0FBRS9CLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMscUZBQXFGO0lBQ3JGLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QixDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7O0lBRUcsbUJBQW1CLEdBQTZDLElBQUk7Ozs7QUFFeEUsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxxRkFBcUY7SUFDckYsT0FBTyxtQkFBbUIsQ0FBQztBQUM3QixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxHQUErQztJQUNwRixtQkFBbUIsR0FBRyxHQUFHLENBQUM7QUFDNUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFvQkcsZUFBMEI7Ozs7QUFFOUIsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxx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RCxNQUFNLFVBQVUsaUJBQWlCO0lBQy9CLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFDO0FBQ3ZELENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGVBQWU7SUFDN0IsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0FBQzNCLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsWUFBWTtJQUMxQixPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3NldENhY2hlZFN0eWxpbmdDb250ZXh0fSBmcm9tICcuL3N0eWxpbmcvc3RhdGUnO1xuaW1wb3J0IHtyZXNldFByZU9yZGVySG9va0ZsYWdzfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIFN0b3JlIHRoZSBlbGVtZW50IGRlcHRoIGNvdW50LiBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIHJvb3QgZWxlbWVudHMgb2YgdGhlIHRlbXBsYXRlXG4gKiBzbyB0aGF0IHdlIGNhbiB0aGFuIGF0dGFjaCBgTFZpZXdgIHRvIG9ubHkgdGhvc2UgZWxlbWVudHMuXG4gKi9cbmxldCBlbGVtZW50RGVwdGhDb3VudCAhOiBudW1iZXI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gZWxlbWVudERlcHRoQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBlbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxubGV0IGN1cnJlbnREaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERpcmVjdGl2ZURlZigpOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3VycmVudERpcmVjdGl2ZURlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnREaXJlY3RpdmVEZWYoZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT58IG51bGwpOiB2b2lkIHtcbiAgY3VycmVudERpcmVjdGl2ZURlZiA9IGRlZjtcbn1cblxuLyoqXG4gKiBTdG9yZXMgd2hldGhlciBkaXJlY3RpdmVzIHNob3VsZCBiZSBtYXRjaGVkIHRvIGVsZW1lbnRzLlxuICpcbiAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoYW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZvcm0gbWF0Y2hpbmdcbiAqIGRpcmVjdGl2ZXMgb24gY2hpbGRyZW4gb2YgdGhhdCBlbGVtZW50LlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmxldCBiaW5kaW5nc0VuYWJsZWQgITogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgYmluZGluZ3NFbmFibGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBEaXNhYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudC5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gybXJtWRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIMm1ybVlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRpc2FibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgYmluZGluZ3NFbmFibGVkID0gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlldygpOiBMVmlldyB7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBzdGFydGluZyBkaXJlY3RpdmUgaWQgdmFsdWUuXG4gKlxuICogQWxsIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgaW5jcmVtZW50ZWQgZnJvbSB0aGlzIHZhbHVlIG9ud2FyZHMuXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIHZhbHVlIGlzIGAxYCBpbnN0ZWFkIG9mIGAwYCBpcyBiZWNhdXNlIHRoZSBgMGBcbiAqIHZhbHVlIGlzIHJlc2VydmVkIGZvciB0aGUgdGVtcGxhdGUuXG4gKi9cbmNvbnN0IE1JTl9ESVJFQ1RJVkVfSUQgPSAxO1xuXG5sZXQgYWN0aXZlRGlyZWN0aXZlSWQgPSBNSU5fRElSRUNUSVZFX0lEO1xuXG4vKipcbiAqIFBvc2l0aW9uIGRlcHRoICh3aXRoIHJlc3BlY3QgZnJvbSBsZWFmIHRvIHJvb3QpIGluIGEgZGlyZWN0aXZlIHN1Yi1jbGFzcyBpbmhlcml0YW5jZSBjaGFpbi5cbiAqL1xubGV0IGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uID0gMDtcblxuLyoqXG4gKiBUb3RhbCBjb3VudCBvZiBob3cgbWFueSBkaXJlY3RpdmVzIGFyZSBhIHBhcnQgb2YgYW4gaW5oZXJpdGFuY2UgY2hhaW4uXG4gKlxuICogV2hlbiBkaXJlY3RpdmVzIGFyZSBzdWItY2xhc3NlZCAoZXh0ZW5kZWQpIGZyb20gb25lIHRvIGFub3RoZXIsIEFuZ3VsYXJcbiAqIG5lZWRzIHRvIGtlZXAgdHJhY2sgb2YgZXhhY3RseSBob3cgbWFueSB3ZXJlIGVuY291bnRlcmVkIHNvIGl0IGNhbiBhY2N1cmF0ZWx5XG4gKiBnZW5lcmF0ZSB0aGUgbmV4dCBkaXJlY3RpdmUgaWQgKG9uY2UgdGhlIG5leHQgZGlyZWN0aXZlIGlkIGlzIHZpc2l0ZWQpLlxuICogTm9ybWFsbHkgdGhlIG5leHQgZGlyZWN0aXZlIGlkIGp1c3QgYSBzaW5nbGUgaW5jcmVtZW50ZWQgdmFsdWUgZnJvbSB0aGVcbiAqIHByZXZpb3VzIG9uZSwgaG93ZXZlciwgaWYgdGhlIHByZXZpb3VzIGRpcmVjdGl2ZSBpcyBhIHBhcnQgb2YgYW4gaW5oZXJpdGFuY2VcbiAqIGNoYWluIChhIHNlcmllcyBvZiBzdWItY2xhc3NlZCBkaXJlY3RpdmVzKSB0aGVuIHRoZSBpbmNyZW1lbnRlZCB2YWx1ZSBtdXN0XG4gKiBhbHNvIHRha2UgaW50byBhY2NvdW50IHRoZSB0b3RhbCBhbW91bnQgb2Ygc3ViLWNsYXNzZWQgdmFsdWVzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHZhbHVlIHJlc2V0cyBiYWNrIHRvIHplcm8gb25jZSB0aGUgbmV4dCBkaXJlY3RpdmUgaXNcbiAqIHZpc2l0ZWQgKHdoZW4gYGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkYCBvciBgc2V0QWN0aXZlSG9zdEVsZW1lbnRgXG4gKiBpcyBjYWxsZWQpLlxuICovXG5sZXQgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9IDA7XG5cbi8qKlxuICogU2V0cyB0aGUgYWN0aXZlIGRpcmVjdGl2ZSBob3N0IGVsZW1lbnQgYW5kIHJlc2V0cyB0aGUgZGlyZWN0aXZlIGlkIHZhbHVlXG4gKiAod2hlbiB0aGUgcHJvdmlkZWQgZWxlbWVudEluZGV4IHZhbHVlIGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudEluZGV4IHRoZSBlbGVtZW50IGluZGV4IHZhbHVlIGZvciB0aGUgaG9zdCBlbGVtZW50IHdoZXJlXG4gKiAgICAgICAgICAgICAgICAgICAgIHRoZSBkaXJlY3RpdmUvY29tcG9uZW50IGluc3RhbmNlIGxpdmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRBY3RpdmVIb3N0RWxlbWVudChlbGVtZW50SW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsKSB7XG4gIGlmIChfc2VsZWN0ZWRJbmRleCAhPT0gZWxlbWVudEluZGV4KSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXggPT0gbnVsbCA/IC0xIDogZWxlbWVudEluZGV4KTtcbiAgICBhY3RpdmVEaXJlY3RpdmVJZCA9IGVsZW1lbnRJbmRleCA9PSBudWxsID8gMCA6IE1JTl9ESVJFQ1RJVkVfSUQ7XG4gICAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gPSAwO1xuICAgIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPSAwO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBpZCB2YWx1ZSBvZiB0aGUgY3VycmVudCBkaXJlY3RpdmUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSBhbiBlbGVtZW50IHRoYXQgaGFzIHR3byBkaXJlY3RpdmVzIG9uIGl0OlxuICogPGRpdiBkaXItb25lIGRpci10d28+PC9kaXY+XG4gKlxuICogZGlyT25lLT5ob3N0QmluZGluZ3MoKSAoaWQgPT0gMSlcbiAqIGRpclR3by0+aG9zdEJpbmRpbmdzKCkgKGlkID09IDIpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIE5vdGUgdGhhdCBkaXJlY3RpdmUgaWQgdmFsdWVzIGFyZSBzcGVjaWZpYyB0byBhbiBlbGVtZW50ICh0aGlzIG1lYW5zIHRoYXRcbiAqIHRoZSBzYW1lIGlkIHZhbHVlIGNvdWxkIGJlIHByZXNlbnQgb24gYW5vdGhlciBlbGVtZW50IHdpdGggYSBjb21wbGV0ZWx5XG4gKiBkaWZmZXJlbnQgc2V0IG9mIGRpcmVjdGl2ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSB7XG4gIHJldHVybiBhY3RpdmVEaXJlY3RpdmVJZDtcbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSBpZCB2YWx1ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIGFuIGVsZW1lbnQgdGhhdCBoYXMgdHdvIGRpcmVjdGl2ZXMgb24gaXQ6XG4gKiA8ZGl2IGRpci1vbmUgZGlyLXR3bz48L2Rpdj5cbiAqXG4gKiBkaXJPbmUtPmhvc3RCaW5kaW5ncygpIChpbmRleCA9IDEpXG4gKiAvLyBpbmNyZW1lbnRcbiAqIGRpclR3by0+aG9zdEJpbmRpbmdzKCkgKGluZGV4ID0gMilcbiAqXG4gKiBEZXBlbmRpbmcgb24gd2hldGhlciBvciBub3QgYSBwcmV2aW91cyBkaXJlY3RpdmUgaGFkIGFueSBpbmhlcml0ZWRcbiAqIGRpcmVjdGl2ZXMgcHJlc2VudCwgdGhhdCB2YWx1ZSB3aWxsIGJlIGluY3JlbWVudGVkIGluIGFkZGl0aW9uXG4gKiB0byB0aGUgaWQganVtcGluZyB1cCBieSBvbmUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIE5vdGUgdGhhdCBkaXJlY3RpdmUgaWQgdmFsdWVzIGFyZSBzcGVjaWZpYyB0byBhbiBlbGVtZW50ICh0aGlzIG1lYW5zIHRoYXRcbiAqIHRoZSBzYW1lIGlkIHZhbHVlIGNvdWxkIGJlIHByZXNlbnQgb24gYW5vdGhlciBlbGVtZW50IHdpdGggYSBjb21wbGV0ZWx5XG4gKiBkaWZmZXJlbnQgc2V0IG9mIGRpcmVjdGl2ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKSB7XG4gIGFjdGl2ZURpcmVjdGl2ZUlkICs9IDEgKyBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0O1xuXG4gIC8vIGJlY2F1c2Ugd2UgYXJlIGRlYWxpbmcgd2l0aCBhIG5ldyBkaXJlY3RpdmUgdGhpc1xuICAvLyBtZWFucyB3ZSBoYXZlIGV4aXRlZCBvdXQgb2YgdGhlIGluaGVyaXRhbmNlIGNoYWluXG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uID0gMDtcbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9IDA7XG59XG5cbi8qKlxuICogU2V0IHRoZSBjdXJyZW50IHN1cGVyIGNsYXNzIChyZXZlcnNlIGluaGVyaXRhbmNlKSBwb3NpdGlvbiBkZXB0aCBmb3IgYSBkaXJlY3RpdmUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSB0d28gZGlyZWN0aXZlczogQ2hpbGQgYW5kIE90aGVyIChidXQgQ2hpbGQgaXMgYSBzdWItY2xhc3Mgb2YgUGFyZW50KVxuICogPGRpdiBjaGlsZC1kaXIgb3RoZXItZGlyPjwvZGl2PlxuICpcbiAqIC8vIGluY3JlbWVudFxuICogcGFyZW50SW5zdGFuY2UtPmhvc3RCaW5kaW5ncygpIChkZXB0aCA9IDEpXG4gKiAvLyBkZWNyZW1lbnRcbiAqIGNoaWxkSW5zdGFuY2UtPmhvc3RCaW5kaW5ncygpIChkZXB0aCA9IDApXG4gKiBvdGhlckluc3RhbmNlLT5ob3N0QmluZGluZ3MoKSAoZGVwdGggPSAwIGIvYyBpdCdzIGEgZGlmZmVyZW50IGRpcmVjdGl2ZSlcbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbihkZWx0YTogbnVtYmVyKSB7XG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uICs9IGRlbHRhO1xuXG4gIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGhlaWdodCB2YWx1ZSBzbyB0aGF0IHdoZW4gdGhlIG5leHQgZGlyZWN0aXZlIGlzIHZpc2l0ZWRcbiAgLy8gdGhlbiBBbmd1bGFyIGtub3dzIHRvIGdlbmVyYXRlIGEgbmV3IGRpcmVjdGl2ZSBpZCB2YWx1ZSB3aGljaCBoYXMgdGFrZW4gaW50b1xuICAvLyBhY2NvdW50IGhvdyBtYW55IHN1Yi1jbGFzcyBkaXJlY3RpdmVzIHdlcmUgYSBwYXJ0IG9mIHRoZSBwcmV2aW91cyBkaXJlY3RpdmUuXG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPVxuICAgICAgTWF0aC5tYXgoYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCwgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24pO1xufVxuXG4vKipcbiAqIFJldHVybnMgaGUgY3VycmVudCBkZXB0aCBvZiB0aGUgc3VwZXIvc3ViIGNsYXNzIGluaGVyaXRhbmNlIGNoYWluLlxuICpcbiAqIFRoaXMgd2lsbCByZXR1cm4gaG93IG1hbnkgaW5oZXJpdGVkIGRpcmVjdGl2ZS9jb21wb25lbnQgY2xhc3Nlc1xuICogZXhpc3QgaW4gdGhlIGN1cnJlbnQgY2hhaW4uXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW3N1cGVyLWRpcl0nIH0pXG4gKiBjbGFzcyBTdXBlckRpciB7fVxuICpcbiAqIEBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tzdWItZGlyXScgfSlcbiAqIGNsYXNzIFN1YkRpciBleHRlbmRzIFN1cGVyRGlyIHt9XG4gKlxuICogLy8gaWYgYDxkaXYgc3ViLWRpcj5gIGlzIHVzZWQgdGhlbiB0aGUgc3VwZXIgY2xhc3MgaGVpZ2h0IGlzIGAxYFxuICogLy8gaWYgYDxkaXYgc3VwZXItZGlyPmAgaXMgdXNlZCB0aGVuIHRoZSBzdXBlciBjbGFzcyBoZWlnaHQgaXMgYDBgXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQoKSB7XG4gIHJldHVybiBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgc3VwZXIgY2xhc3MgKHJldmVyc2UgaW5oZXJpdGFuY2UpIGRlcHRoIGZvciBhIGRpcmVjdGl2ZS5cbiAqXG4gKiBUaGlzIGlzIGRlc2lnbmVkIHRvIGhlbHAgaW5zdHJ1Y3Rpb24gY29kZSBkaXN0aW5ndWlzaCBkaWZmZXJlbnQgaG9zdEJpbmRpbmdzXG4gKiBjYWxscyBmcm9tIGVhY2ggb3RoZXIgd2hlbiBhIGRpcmVjdGl2ZSBoYXMgZXh0ZW5kZWQgZnJvbSBhbm90aGVyIGRpcmVjdGl2ZS5cbiAqIE5vcm1hbGx5IHVzaW5nIHRoZSBkaXJlY3RpdmUgaWQgdmFsdWUgaXMgZW5vdWdoLCBidXQgd2l0aCB0aGUgY2FzZVxuICogb2YgcGFyZW50L3N1Yi1jbGFzcyBkaXJlY3RpdmUgaW5oZXJpdGFuY2UgbW9yZSBpbmZvcm1hdGlvbiBpcyByZXF1aXJlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgoKSB7XG4gIHJldHVybiBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbjtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBjb250ZXh0TFZpZXcgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlldztcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlOiBUTm9kZSwgX2lzUGFyZW50OiBib29sZWFuKSB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGU6IFROb2RlLCB2aWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZCh2aWV3KTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGxWaWV3ID0gdmlldztcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldElzUGFyZW50KCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBpc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldElzTm90UGFyZW50KCk6IHZvaWQge1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldElzUGFyZW50KCk6IHZvaWQge1xuICBpc1BhcmVudCA9IHRydWU7XG59XG5cblxuLyoqIENoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlICovXG5leHBvcnQgZnVuY3Rpb24gaXNDcmVhdGlvbk1vZGUodmlldzogTFZpZXcgPSBsVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gKi9cbmxldCBsVmlldzogTFZpZXc7XG5cbi8qKlxuICogVGhlIGxhc3Qgdmlld0RhdGEgcmV0cmlldmVkIGJ5IG5leHRDb250ZXh0KCkuXG4gKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gKlxuICogZS5nLiBjb25zdCBpbm5lciA9IHgoKS4kaW1wbGljaXQ7IGNvbnN0IG91dGVyID0geCgpLiRpbXBsaWNpdDtcbiAqL1xubGV0IGNvbnRleHRMVmlldzogTFZpZXcgPSBudWxsICE7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0TFZpZXcoKTogTFZpZXcge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjb250ZXh0TFZpZXc7XG59XG5cbi8qKlxuICogSW4gdGhpcyBtb2RlLCBhbnkgY2hhbmdlcyBpbiBiaW5kaW5ncyB3aWxsIHRocm93IGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yLlxuICpcbiAqIE5lY2Vzc2FyeSB0byBzdXBwb3J0IENoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCkuXG4gKi9cbmxldCBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY2hlY2tOb0NoYW5nZXNNb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKG1vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gbW9kZTtcbn1cblxuLyoqXG4gKiBUaGUgcm9vdCBpbmRleCBmcm9tIHdoaWNoIHB1cmUgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zIHNob3VsZCBjYWxjdWxhdGUgdGhlaXIgYmluZGluZ1xuICogaW5kaWNlcy4gSW4gY29tcG9uZW50IHZpZXdzLCB0aGlzIGlzIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LiBJbiBhIGhvc3QgYmluZGluZ1xuICogY29udGV4dCwgdGhpcyBpcyB0aGUgVFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKyBhbnkgZGlycy9ob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAqL1xubGV0IGJpbmRpbmdSb290SW5kZXg6IG51bWJlciA9IC0xO1xuXG4vLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1Jvb3QoKSB7XG4gIHJldHVybiBiaW5kaW5nUm9vdEluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QmluZGluZ1Jvb3QodmFsdWU6IG51bWJlcikge1xuICBiaW5kaW5nUm9vdEluZGV4ID0gdmFsdWU7XG59XG5cbi8qKlxuICogQ3VycmVudCBpbmRleCBvZiBhIFZpZXcgb3IgQ29udGVudCBRdWVyeSB3aGljaCBuZWVkcyB0byBiZSBwcm9jZXNzZWQgbmV4dC5cbiAqIFdlIGl0ZXJhdGUgb3ZlciB0aGUgbGlzdCBvZiBRdWVyaWVzIGFuZCBpbmNyZW1lbnQgY3VycmVudCBxdWVyeSBpbmRleCBhdCBldmVyeSBzdGVwLlxuICovXG5sZXQgY3VycmVudFF1ZXJ5SW5kZXg6IG51bWJlciA9IDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50UXVlcnlJbmRleCgpOiBudW1iZXIge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRWaWV3Tm9kZSB8IG51bGwpOiBMVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBvbGRWaWV3ID0gbFZpZXc7XG4gIGlmIChuZXdWaWV3KSB7XG4gICAgY29uc3QgdFZpZXcgPSBuZXdWaWV3W1RWSUVXXTtcbiAgICBiaW5kaW5nUm9vdEluZGV4ID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBob3N0VE5vZGUgITtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuXG4gIGxWaWV3ID0gY29udGV4dExWaWV3ID0gbmV3VmlldztcbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dEltcGw8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgY29udGV4dExWaWV3ID0gd2Fsa1VwVmlld3MobGV2ZWwsIGNvbnRleHRMVmlldyAhKTtcbiAgcmV0dXJuIGNvbnRleHRMVmlld1tDT05URVhUXSBhcyBUO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3KTogTFZpZXcge1xuICB3aGlsZSAobmVzdGluZ0xldmVsID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAnRGVjbGFyYXRpb24gdmlldyBzaG91bGQgYmUgZGVmaW5lZCBpZiBuZXN0aW5nIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBuZXN0aW5nTGV2ZWwtLTtcbiAgfVxuICByZXR1cm4gY3VycmVudFZpZXc7XG59XG5cbi8qKlxuICogUmVzZXRzIHRoZSBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29tcG9uZW50U3RhdGUoKSB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IG51bGwgITtcbiAgZWxlbWVudERlcHRoQ291bnQgPSAwO1xuICBiaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgaW4gbGlldSBvZiBlbnRlclZpZXcgdG8gbWFrZSBpdCBjbGVhciB3aGVuIHdlIGFyZSBleGl0aW5nIGEgY2hpbGQgdmlldy4gVGhpcyBtYWtlc1xuICogdGhlIGRpcmVjdGlvbiBvZiB0cmF2ZXJzYWwgKHVwIG9yIGRvd24gdGhlIHZpZXcgdHJlZSkgYSBiaXQgY2xlYXJlci5cbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIHNhZmVUb1J1bkhvb2tzIFdoZXRoZXIgdGhlIHJ1bnRpbWUgaXMgaW4gYSBzdGF0ZSB3aGVyZSBydW5uaW5nIGxpZmVjeWNsZSBob29rcyBpcyB2YWxpZC5cbiAqIFRoaXMgaXMgbm90IGFsd2F5cyB0aGUgY2FzZSAoZm9yIGV4YW1wbGUsIHRoZSBhcHBsaWNhdGlvbiBtYXkgaGF2ZSBjcmFzaGVkIGFuZCBgbGVhdmVWaWV3YCBpc1xuICogYmVpbmcgZXhlY3V0ZWQgd2hpbGUgdW53aW5kaW5nIHRoZSBjYWxsIHN0YWNrKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldyhuZXdWaWV3OiBMVmlldywgc2FmZVRvUnVuSG9va3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmIChpc0NyZWF0aW9uTW9kZShsVmlldykpIHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgICAgIHNhZmVUb1J1bkhvb2tzICYmIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlldywgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY2hlY2tOb0NoYW5nZXNNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4sIHVuZGVmaW5lZCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFZpZXdzIGFyZSBjbGVhbiBhbmQgaW4gdXBkYXRlIG1vZGUgYWZ0ZXIgYmVpbmcgY2hlY2tlZCwgc28gdGhlc2UgYml0cyBhcmUgY2xlYXJlZFxuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgICAgbFZpZXdbQklORElOR19JTkRFWF0gPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgICB9XG4gIH1cbiAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQobnVsbCk7XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxubGV0IF9zZWxlY3RlZEluZGV4ID0gLTE7XG5cbi8qKlxuICogR2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gX3NlbGVjdGVkSW5kZXg7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcblxuICAvLyByZW1vdmUgdGhlIHN0eWxpbmcgY29udGV4dCBmcm9tIHRoZSBjYWNoZVxuICAvLyBiZWNhdXNlIHdlIGFyZSBub3cgb24gYSBkaWZmZXJlbnQgZWxlbWVudFxuICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChudWxsKTtcbn1cblxuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgbm8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudE5hbWVzcGFjZTtcbn1cbiJdfQ==