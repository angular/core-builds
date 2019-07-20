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
import { resetAllStylingState, resetStylingState } from './styling_next/state';
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
    setCurrentStyleSanitizer(null);
    resetAllStylingState();
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
    // we have now jumped to another element
    // therefore the state is stale
    resetStylingState();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBR3JDLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBc0QsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0ksT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDeEQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDN0UsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7OztJQVFyRCxpQkFBMkI7Ozs7QUFFL0IsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxxRkFBcUY7SUFDckYsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLGlCQUFpQixFQUFFLENBQUM7QUFDdEIsQ0FBQzs7SUFFRyxtQkFBbUIsR0FBNkMsSUFBSTs7OztBQUV4RSxNQUFNLFVBQVUsc0JBQXNCO0lBQ3BDLHFGQUFxRjtJQUNyRixPQUFPLG1CQUFtQixDQUFDO0FBQzdCLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEdBQStDO0lBQ3BGLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztBQUM1QixDQUFDOzs7Ozs7Ozs7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SUFFOUIsd0NBQXdDO0lBQ3hDLCtCQUErQjtJQUMvQixpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7O0lBR0csaUJBQWlCLEdBQWdCLElBQUk7Ozs7Ozs7QUFPekMsTUFBTSxVQUFVLGNBQWM7SUFDNUIsaUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7QUFDbkQsQ0FBQzs7Ozs7OztBQU9ELE1BQU0sVUFBVSxpQkFBaUI7SUFDL0IsaUJBQWlCLEdBQUcsZ0NBQWdDLENBQUM7QUFDdkQsQ0FBQzs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsZUFBZTtJQUM3QixxQkFBcUIsRUFBRSxDQUFDO0FBQzFCLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0FBQzNCLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsWUFBWTtJQUMxQixPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUM7O0lBRUcsaUJBQXVDOzs7OztBQUMzQyxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBaUM7SUFDeEUsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQ2hDLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0TFZpZXdPclVuZGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtleGVjdXRlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIERpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgT3BhcXVlVmlld1N0YXRlLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtzZXRDYWNoZWRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9zdHlsaW5nL3N0YXRlJztcbmltcG9ydCB7cmVzZXRBbGxTdHlsaW5nU3RhdGUsIHJlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuL3N0eWxpbmdfbmV4dC9zdGF0ZSc7XG5pbXBvcnQge3Jlc2V0UHJlT3JkZXJIb29rRmxhZ3N9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogU3RvcmUgdGhlIGVsZW1lbnQgZGVwdGggY291bnQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgcm9vdCBlbGVtZW50cyBvZiB0aGUgdGVtcGxhdGVcbiAqIHNvIHRoYXQgd2UgY2FuIHRoYW4gYXR0YWNoIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy5cbiAqL1xubGV0IGVsZW1lbnREZXB0aENvdW50ICE6IG51bWJlcjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnREZXB0aENvdW50KCkge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBlbGVtZW50RGVwdGhDb3VudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBlbGVtZW50RGVwdGhDb3VudC0tO1xufVxuXG5sZXQgY3VycmVudERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGlyZWN0aXZlRGVmKCk6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fG51bGwge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjdXJyZW50RGlyZWN0aXZlRGVmO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudERpcmVjdGl2ZURlZihkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnwgbnVsbCk6IHZvaWQge1xuICBjdXJyZW50RGlyZWN0aXZlRGVmID0gZGVmO1xufVxuXG4vKipcbiAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gKlxuICogV2hlbiB0ZW1wbGF0ZSBjb250YWlucyBgbmdOb25CaW5kYWJsZWAgdGhhbiB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHJ1bnRpbWUgZm9ybSBtYXRjaGluZ1xuICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqL1xubGV0IGJpbmRpbmdzRW5hYmxlZCAhOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ3NFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBiaW5kaW5nc0VuYWJsZWQ7XG59XG5cblxuLyoqXG4gKiBFbmFibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50cy5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gybXJtWRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIMm1ybVlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVuYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3KCk6IExWaWV3IHtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgYXMgdGhlIHN0YXJ0aW5nIGRpcmVjdGl2ZSBpZCB2YWx1ZS5cbiAqXG4gKiBBbGwgc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBpbmNyZW1lbnRlZCBmcm9tIHRoaXMgdmFsdWUgb253YXJkcy5cbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgdmFsdWUgaXMgYDFgIGluc3RlYWQgb2YgYDBgIGlzIGJlY2F1c2UgdGhlIGAwYFxuICogdmFsdWUgaXMgcmVzZXJ2ZWQgZm9yIHRoZSB0ZW1wbGF0ZS5cbiAqL1xuY29uc3QgTUlOX0RJUkVDVElWRV9JRCA9IDE7XG5cbmxldCBhY3RpdmVEaXJlY3RpdmVJZCA9IE1JTl9ESVJFQ1RJVkVfSUQ7XG5cbi8qKlxuICogUG9zaXRpb24gZGVwdGggKHdpdGggcmVzcGVjdCBmcm9tIGxlYWYgdG8gcm9vdCkgaW4gYSBkaXJlY3RpdmUgc3ViLWNsYXNzIGluaGVyaXRhbmNlIGNoYWluLlxuICovXG5sZXQgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gPSAwO1xuXG4vKipcbiAqIFRvdGFsIGNvdW50IG9mIGhvdyBtYW55IGRpcmVjdGl2ZXMgYXJlIGEgcGFydCBvZiBhbiBpbmhlcml0YW5jZSBjaGFpbi5cbiAqXG4gKiBXaGVuIGRpcmVjdGl2ZXMgYXJlIHN1Yi1jbGFzc2VkIChleHRlbmRlZCkgZnJvbSBvbmUgdG8gYW5vdGhlciwgQW5ndWxhclxuICogbmVlZHMgdG8ga2VlcCB0cmFjayBvZiBleGFjdGx5IGhvdyBtYW55IHdlcmUgZW5jb3VudGVyZWQgc28gaXQgY2FuIGFjY3VyYXRlbHlcbiAqIGdlbmVyYXRlIHRoZSBuZXh0IGRpcmVjdGl2ZSBpZCAob25jZSB0aGUgbmV4dCBkaXJlY3RpdmUgaWQgaXMgdmlzaXRlZCkuXG4gKiBOb3JtYWxseSB0aGUgbmV4dCBkaXJlY3RpdmUgaWQganVzdCBhIHNpbmdsZSBpbmNyZW1lbnRlZCB2YWx1ZSBmcm9tIHRoZVxuICogcHJldmlvdXMgb25lLCBob3dldmVyLCBpZiB0aGUgcHJldmlvdXMgZGlyZWN0aXZlIGlzIGEgcGFydCBvZiBhbiBpbmhlcml0YW5jZVxuICogY2hhaW4gKGEgc2VyaWVzIG9mIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZXMpIHRoZW4gdGhlIGluY3JlbWVudGVkIHZhbHVlIG11c3RcbiAqIGFsc28gdGFrZSBpbnRvIGFjY291bnQgdGhlIHRvdGFsIGFtb3VudCBvZiBzdWItY2xhc3NlZCB2YWx1ZXMuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgdmFsdWUgcmVzZXRzIGJhY2sgdG8gemVybyBvbmNlIHRoZSBuZXh0IGRpcmVjdGl2ZSBpc1xuICogdmlzaXRlZCAod2hlbiBgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWRgIG9yIGBzZXRBY3RpdmVIb3N0RWxlbWVudGBcbiAqIGlzIGNhbGxlZCkuXG4gKi9cbmxldCBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID0gMDtcblxuLyoqXG4gKiBTZXRzIHRoZSBhY3RpdmUgZGlyZWN0aXZlIGhvc3QgZWxlbWVudCBhbmQgcmVzZXRzIHRoZSBkaXJlY3RpdmUgaWQgdmFsdWVcbiAqICh3aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50SW5kZXggdmFsdWUgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50SW5kZXggdGhlIGVsZW1lbnQgaW5kZXggdmFsdWUgZm9yIHRoZSBob3N0IGVsZW1lbnQgd2hlcmVcbiAqICAgICAgICAgICAgICAgICAgICAgdGhlIGRpcmVjdGl2ZS9jb21wb25lbnQgaW5zdGFuY2UgbGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEFjdGl2ZUhvc3RFbGVtZW50KGVsZW1lbnRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGwpIHtcbiAgaWYgKF9zZWxlY3RlZEluZGV4ICE9PSBlbGVtZW50SW5kZXgpIHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCA9PSBudWxsID8gLTEgOiBlbGVtZW50SW5kZXgpO1xuICAgIGFjdGl2ZURpcmVjdGl2ZUlkID0gZWxlbWVudEluZGV4ID09IG51bGwgPyAwIDogTUlOX0RJUkVDVElWRV9JRDtcbiAgICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiA9IDA7XG4gICAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9IDA7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IGlkIHZhbHVlIG9mIHRoZSBjdXJyZW50IGRpcmVjdGl2ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIGFuIGVsZW1lbnQgdGhhdCBoYXMgdHdvIGRpcmVjdGl2ZXMgb24gaXQ6XG4gKiA8ZGl2IGRpci1vbmUgZGlyLXR3bz48L2Rpdj5cbiAqXG4gKiBkaXJPbmUtPmhvc3RCaW5kaW5ncygpIChpZCA9PSAxKVxuICogZGlyVHdvLT5ob3N0QmluZGluZ3MoKSAoaWQgPT0gMilcbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IGRpcmVjdGl2ZSBpZCB2YWx1ZXMgYXJlIHNwZWNpZmljIHRvIGFuIGVsZW1lbnQgKHRoaXMgbWVhbnMgdGhhdFxuICogdGhlIHNhbWUgaWQgdmFsdWUgY291bGQgYmUgcHJlc2VudCBvbiBhbm90aGVyIGVsZW1lbnQgd2l0aCBhIGNvbXBsZXRlbHlcbiAqIGRpZmZlcmVudCBzZXQgb2YgZGlyZWN0aXZlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpIHtcbiAgcmV0dXJuIGFjdGl2ZURpcmVjdGl2ZUlkO1xufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIGN1cnJlbnQgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgYW4gZWxlbWVudCB0aGF0IGhhcyB0d28gZGlyZWN0aXZlcyBvbiBpdDpcbiAqIDxkaXYgZGlyLW9uZSBkaXItdHdvPjwvZGl2PlxuICpcbiAqIGRpck9uZS0+aG9zdEJpbmRpbmdzKCkgKGluZGV4ID0gMSlcbiAqIC8vIGluY3JlbWVudFxuICogZGlyVHdvLT5ob3N0QmluZGluZ3MoKSAoaW5kZXggPSAyKVxuICpcbiAqIERlcGVuZGluZyBvbiB3aGV0aGVyIG9yIG5vdCBhIHByZXZpb3VzIGRpcmVjdGl2ZSBoYWQgYW55IGluaGVyaXRlZFxuICogZGlyZWN0aXZlcyBwcmVzZW50LCB0aGF0IHZhbHVlIHdpbGwgYmUgaW5jcmVtZW50ZWQgaW4gYWRkaXRpb25cbiAqIHRvIHRoZSBpZCBqdW1waW5nIHVwIGJ5IG9uZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IGRpcmVjdGl2ZSBpZCB2YWx1ZXMgYXJlIHNwZWNpZmljIHRvIGFuIGVsZW1lbnQgKHRoaXMgbWVhbnMgdGhhdFxuICogdGhlIHNhbWUgaWQgdmFsdWUgY291bGQgYmUgcHJlc2VudCBvbiBhbm90aGVyIGVsZW1lbnQgd2l0aCBhIGNvbXBsZXRlbHlcbiAqIGRpZmZlcmVudCBzZXQgb2YgZGlyZWN0aXZlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpIHtcbiAgYWN0aXZlRGlyZWN0aXZlSWQgKz0gMSArIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQ7XG5cbiAgLy8gYmVjYXVzZSB3ZSBhcmUgZGVhbGluZyB3aXRoIGEgbmV3IGRpcmVjdGl2ZSB0aGlzXG4gIC8vIG1lYW5zIHdlIGhhdmUgZXhpdGVkIG91dCBvZiB0aGUgaW5oZXJpdGFuY2UgY2hhaW5cbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gPSAwO1xuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID0gMDtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGN1cnJlbnQgc3VwZXIgY2xhc3MgKHJldmVyc2UgaW5oZXJpdGFuY2UpIHBvc2l0aW9uIGRlcHRoIGZvciBhIGRpcmVjdGl2ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIHR3byBkaXJlY3RpdmVzOiBDaGlsZCBhbmQgT3RoZXIgKGJ1dCBDaGlsZCBpcyBhIHN1Yi1jbGFzcyBvZiBQYXJlbnQpXG4gKiA8ZGl2IGNoaWxkLWRpciBvdGhlci1kaXI+PC9kaXY+XG4gKlxuICogLy8gaW5jcmVtZW50XG4gKiBwYXJlbnRJbnN0YW5jZS0+aG9zdEJpbmRpbmdzKCkgKGRlcHRoID0gMSlcbiAqIC8vIGRlY3JlbWVudFxuICogY2hpbGRJbnN0YW5jZS0+aG9zdEJpbmRpbmdzKCkgKGRlcHRoID0gMClcbiAqIG90aGVySW5zdGFuY2UtPmhvc3RCaW5kaW5ncygpIChkZXB0aCA9IDAgYi9jIGl0J3MgYSBkaWZmZXJlbnQgZGlyZWN0aXZlKVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKGRlbHRhOiBudW1iZXIpIHtcbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gKz0gZGVsdGE7XG5cbiAgLy8gd2Uga2VlcCB0cmFjayBvZiB0aGUgaGVpZ2h0IHZhbHVlIHNvIHRoYXQgd2hlbiB0aGUgbmV4dCBkaXJlY3RpdmUgaXMgdmlzaXRlZFxuICAvLyB0aGVuIEFuZ3VsYXIga25vd3MgdG8gZ2VuZXJhdGUgYSBuZXcgZGlyZWN0aXZlIGlkIHZhbHVlIHdoaWNoIGhhcyB0YWtlbiBpbnRvXG4gIC8vIGFjY291bnQgaG93IG1hbnkgc3ViLWNsYXNzIGRpcmVjdGl2ZXMgd2VyZSBhIHBhcnQgb2YgdGhlIHByZXZpb3VzIGRpcmVjdGl2ZS5cbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9XG4gICAgICBNYXRoLm1heChhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0LCBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbik7XG59XG5cbi8qKlxuICogUmV0dXJucyBoZSBjdXJyZW50IGRlcHRoIG9mIHRoZSBzdXBlci9zdWIgY2xhc3MgaW5oZXJpdGFuY2UgY2hhaW4uXG4gKlxuICogVGhpcyB3aWxsIHJldHVybiBob3cgbWFueSBpbmhlcml0ZWQgZGlyZWN0aXZlL2NvbXBvbmVudCBjbGFzc2VzXG4gKiBleGlzdCBpbiB0aGUgY3VycmVudCBjaGFpbi5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBARGlyZWN0aXZlKHsgc2VsZWN0b3I6ICdbc3VwZXItZGlyXScgfSlcbiAqIGNsYXNzIFN1cGVyRGlyIHt9XG4gKlxuICogQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW3N1Yi1kaXJdJyB9KVxuICogY2xhc3MgU3ViRGlyIGV4dGVuZHMgU3VwZXJEaXIge31cbiAqXG4gKiAvLyBpZiBgPGRpdiBzdWItZGlyPmAgaXMgdXNlZCB0aGVuIHRoZSBzdXBlciBjbGFzcyBoZWlnaHQgaXMgYDFgXG4gKiAvLyBpZiBgPGRpdiBzdXBlci1kaXI+YCBpcyB1c2VkIHRoZW4gdGhlIHN1cGVyIGNsYXNzIGhlaWdodCBpcyBgMGBcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCgpIHtcbiAgcmV0dXJuIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBzdXBlciBjbGFzcyAocmV2ZXJzZSBpbmhlcml0YW5jZSkgZGVwdGggZm9yIGEgZGlyZWN0aXZlLlxuICpcbiAqIFRoaXMgaXMgZGVzaWduZWQgdG8gaGVscCBpbnN0cnVjdGlvbiBjb2RlIGRpc3Rpbmd1aXNoIGRpZmZlcmVudCBob3N0QmluZGluZ3NcbiAqIGNhbGxzIGZyb20gZWFjaCBvdGhlciB3aGVuIGEgZGlyZWN0aXZlIGhhcyBleHRlbmRlZCBmcm9tIGFub3RoZXIgZGlyZWN0aXZlLlxuICogTm9ybWFsbHkgdXNpbmcgdGhlIGRpcmVjdGl2ZSBpZCB2YWx1ZSBpcyBlbm91Z2gsIGJ1dCB3aXRoIHRoZSBjYXNlXG4gKiBvZiBwYXJlbnQvc3ViLWNsYXNzIGRpcmVjdGl2ZSBpbmhlcml0YW5jZSBtb3JlIGluZm9ybWF0aW9uIGlzIHJlcXVpcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCgpIHtcbiAgcmV0dXJuIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkIGFuZCB0cmFjayBxdWVyeSByZXN1bHRzLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGU6IFROb2RlLCBfaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGlzUGFyZW50ID0gX2lzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKHZpZXcpO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgbFZpZXcgPSB2aWV3O1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAqL1xubGV0IGlzUGFyZW50OiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXNQYXJlbnQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGlzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNOb3RQYXJlbnQoKTogdm9pZCB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0SXNQYXJlbnQoKTogdm9pZCB7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbn1cblxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NyZWF0aW9uTW9kZSh2aWV3OiBMVmlldyA9IGxWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IGxWaWV3OiBMVmlldztcblxuLyoqXG4gKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAqXG4gKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICovXG5sZXQgY29udGV4dExWaWV3OiBMVmlldyA9IG51bGwgITtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHRMVmlldygpOiBMVmlldyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNvbnRleHRMVmlldztcbn1cblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVja05vQ2hhbmdlc01vZGUobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSBtb2RlO1xufVxuXG4vKipcbiAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICovXG5sZXQgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyID0gLTE7XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgcmV0dXJuIGJpbmRpbmdSb290SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdCh2YWx1ZTogbnVtYmVyKSB7XG4gIGJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGluZGV4IG9mIGEgVmlldyBvciBDb250ZW50IFF1ZXJ5IHdoaWNoIG5lZWRzIHRvIGJlIHByb2Nlc3NlZCBuZXh0LlxuICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gKi9cbmxldCBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnRRdWVyeUluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFF1ZXJ5SW5kZXgodmFsdWU6IG51bWJlcik6IHZvaWQge1xuICBjdXJyZW50UXVlcnlJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgc3RhdGUgd2l0aCBhIG5ldyBzdGF0ZS5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgc3RhdGUgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgc3RhdGUgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGhvc3QgRWxlbWVudCB0byB3aGljaCB0aGUgVmlldyBpcyBhIGNoaWxkIG9mXG4gKiBAcmV0dXJucyB0aGUgcHJldmlvdXMgc3RhdGU7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlclZpZXcobmV3VmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQobmV3Vmlldyk7XG4gIGNvbnN0IG9sZFZpZXcgPSBsVmlldztcbiAgaWYgKG5ld1ZpZXcpIHtcbiAgICBjb25zdCB0VmlldyA9IG5ld1ZpZXdbVFZJRVddO1xuICAgIGJpbmRpbmdSb290SW5kZXggPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgbFZpZXcgPSBjb250ZXh0TFZpZXcgPSBuZXdWaWV3O1xuICByZXR1cm4gb2xkVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0TFZpZXcgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbiAgcmVzZXRBbGxTdHlsaW5nU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBzYWZlVG9SdW5Ib29rcyBXaGV0aGVyIHRoZSBydW50aW1lIGlzIGluIGEgc3RhdGUgd2hlcmUgcnVubmluZyBsaWZlY3ljbGUgaG9va3MgaXMgdmFsaWQuXG4gKiBUaGlzIGlzIG5vdCBhbHdheXMgdGhlIGNhc2UgKGZvciBleGFtcGxlLCB0aGUgYXBwbGljYXRpb24gbWF5IGhhdmUgY3Jhc2hlZCBhbmQgYGxlYXZlVmlld2AgaXNcbiAqIGJlaW5nIGV4ZWN1dGVkIHdoaWxlIHVud2luZGluZyB0aGUgY2FsbCBzdGFjaykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcsIHNhZmVUb1J1bkhvb2tzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gICAgICBzYWZlVG9SdW5Ib29rcyAmJiBleGVjdXRlSG9va3MoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbFZpZXcsIHRWaWV3LnZpZXdIb29rcywgdFZpZXcudmlld0NoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuLCB1bmRlZmluZWQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gICAgfVxuICB9XG4gIHNldENhY2hlZFN0eWxpbmdDb250ZXh0KG51bGwpO1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG5cbmxldCBfc2VsZWN0ZWRJbmRleCA9IC0xO1xuXG4vKipcbiAqIEdldHMgdGhlIG1vc3QgcmVjZW50IGluZGV4IHBhc3NlZCB0byB7QGxpbmsgc2VsZWN0fVxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRJbmRleCgpIHtcbiAgcmV0dXJuIF9zZWxlY3RlZEluZGV4O1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1vc3QgcmVjZW50IGluZGV4IHBhc3NlZCB0byB7QGxpbmsgc2VsZWN0fVxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIF9zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG5cbiAgLy8gcmVtb3ZlIHRoZSBzdHlsaW5nIGNvbnRleHQgZnJvbSB0aGUgY2FjaGVcbiAgLy8gYmVjYXVzZSB3ZSBhcmUgbm93IG9uIGEgZGlmZmVyZW50IGVsZW1lbnRcbiAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQobnVsbCk7XG5cbiAgLy8gd2UgaGF2ZSBub3cganVtcGVkIHRvIGFub3RoZXIgZWxlbWVudFxuICAvLyB0aGVyZWZvcmUgdGhlIHN0YXRlIGlzIHN0YWxlXG4gIHJlc2V0U3R5bGluZ1N0YXRlKCk7XG59XG5cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VIVE1MKCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKCk6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIF9jdXJyZW50TmFtZXNwYWNlO1xufVxuXG5sZXQgX2N1cnJlbnRTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgX2N1cnJlbnRTYW5pdGl6ZXIgPSBzYW5pdGl6ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIHJldHVybiBfY3VycmVudFNhbml0aXplcjtcbn1cbiJdfQ==