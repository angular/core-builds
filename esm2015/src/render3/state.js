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
import { executeHooks } from './hooks';
import { BINDING_INDEX, CONTEXT, DECLARATION_VIEW, FLAGS, TVIEW } from './interfaces/view';
import { resetAllStylingState, resetStylingState } from './styling_next/state';
import { isCreationMode, resetPreOrderHookFlags } from './util/view_utils';
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
        setSelectedIndex(elementIndex === null ? -1 : elementIndex);
        activeDirectiveId = elementIndex === null ? 0 : MIN_DIRECTIVE_ID;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBR3JDLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBc0QsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0ksT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDN0UsT0FBTyxFQUFDLGNBQWMsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7SUFRckUsaUJBQTJCOzs7O0FBRS9CLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMscUZBQXFGO0lBQ3JGLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QixDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7O0lBRUcsbUJBQW1CLEdBQTZDLElBQUk7Ozs7QUFFeEUsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxxRkFBcUY7SUFDckYsT0FBTyxtQkFBbUIsQ0FBQztBQUM3QixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxHQUErQztJQUNwRixtQkFBbUIsR0FBRyxHQUFHLENBQUM7QUFDNUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFvQkcsZUFBMEI7Ozs7QUFFOUIsTUFB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VUFBVSxlQUFlO0lBQzdCLHFCQUFxQixFQUFFLENBQUM7QUFDMUIsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7QUFDM0IsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSxZQUFZO0lBQzFCLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQzs7SUFFRyxpQkFBdUM7Ozs7O0FBQzNDLE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxTQUFpQztJQUN4RSxpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDaEMsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0I7SUFDdEMsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Jlc2V0QWxsU3R5bGluZ1N0YXRlLCByZXNldFN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdHlsaW5nX25leHQvc3RhdGUnO1xuaW1wb3J0IHtpc0NyZWF0aW9uTW9kZSwgcmVzZXRQcmVPcmRlckhvb2tGbGFnc30gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3YCB0byBvbmx5IHRob3NlIGVsZW1lbnRzLlxuICovXG5sZXQgZWxlbWVudERlcHRoQ291bnQgITogbnVtYmVyO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudERlcHRoQ291bnQoKSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGVsZW1lbnREZXB0aENvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbmxldCBjdXJyZW50RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREaXJlY3RpdmVEZWYoKTogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbCB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVEZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+fCBudWxsKTogdm9pZCB7XG4gIGN1cnJlbnREaXJlY3RpdmVEZWYgPSBkZWY7XG59XG5cbi8qKlxuICogU3RvcmVzIHdoZXRoZXIgZGlyZWN0aXZlcyBzaG91bGQgYmUgbWF0Y2hlZCB0byBlbGVtZW50cy5cbiAqXG4gKiBXaGVuIHRlbXBsYXRlIGNvbnRhaW5zIGBuZ05vbkJpbmRhYmxlYCB0aGFuIHdlIG5lZWQgdG8gcHJldmVudCB0aGUgcnVudGltZSBmb3JtIG1hdGNoaW5nXG4gKiBkaXJlY3RpdmVzIG9uIGNoaWxkcmVuIG9mIHRoYXQgZWxlbWVudC5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICovXG5sZXQgYmluZGluZ3NFbmFibGVkICE6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGJpbmRpbmdzRW5hYmxlZDtcbn1cblxuXG4vKipcbiAqIEVuYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnRzLlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZW5hYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogRGlzYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnQuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBhcyB0aGUgc3RhcnRpbmcgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICpcbiAqIEFsbCBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGluY3JlbWVudGVkIGZyb20gdGhpcyB2YWx1ZSBvbndhcmRzLlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyB2YWx1ZSBpcyBgMWAgaW5zdGVhZCBvZiBgMGAgaXMgYmVjYXVzZSB0aGUgYDBgXG4gKiB2YWx1ZSBpcyByZXNlcnZlZCBmb3IgdGhlIHRlbXBsYXRlLlxuICovXG5jb25zdCBNSU5fRElSRUNUSVZFX0lEID0gMTtcblxubGV0IGFjdGl2ZURpcmVjdGl2ZUlkID0gTUlOX0RJUkVDVElWRV9JRDtcblxuLyoqXG4gKiBQb3NpdGlvbiBkZXB0aCAod2l0aCByZXNwZWN0IGZyb20gbGVhZiB0byByb290KSBpbiBhIGRpcmVjdGl2ZSBzdWItY2xhc3MgaW5oZXJpdGFuY2UgY2hhaW4uXG4gKi9cbmxldCBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiA9IDA7XG5cbi8qKlxuICogVG90YWwgY291bnQgb2YgaG93IG1hbnkgZGlyZWN0aXZlcyBhcmUgYSBwYXJ0IG9mIGFuIGluaGVyaXRhbmNlIGNoYWluLlxuICpcbiAqIFdoZW4gZGlyZWN0aXZlcyBhcmUgc3ViLWNsYXNzZWQgKGV4dGVuZGVkKSBmcm9tIG9uZSB0byBhbm90aGVyLCBBbmd1bGFyXG4gKiBuZWVkcyB0byBrZWVwIHRyYWNrIG9mIGV4YWN0bHkgaG93IG1hbnkgd2VyZSBlbmNvdW50ZXJlZCBzbyBpdCBjYW4gYWNjdXJhdGVseVxuICogZ2VuZXJhdGUgdGhlIG5leHQgZGlyZWN0aXZlIGlkIChvbmNlIHRoZSBuZXh0IGRpcmVjdGl2ZSBpZCBpcyB2aXNpdGVkKS5cbiAqIE5vcm1hbGx5IHRoZSBuZXh0IGRpcmVjdGl2ZSBpZCBqdXN0IGEgc2luZ2xlIGluY3JlbWVudGVkIHZhbHVlIGZyb20gdGhlXG4gKiBwcmV2aW91cyBvbmUsIGhvd2V2ZXIsIGlmIHRoZSBwcmV2aW91cyBkaXJlY3RpdmUgaXMgYSBwYXJ0IG9mIGFuIGluaGVyaXRhbmNlXG4gKiBjaGFpbiAoYSBzZXJpZXMgb2Ygc3ViLWNsYXNzZWQgZGlyZWN0aXZlcykgdGhlbiB0aGUgaW5jcmVtZW50ZWQgdmFsdWUgbXVzdFxuICogYWxzbyB0YWtlIGludG8gYWNjb3VudCB0aGUgdG90YWwgYW1vdW50IG9mIHN1Yi1jbGFzc2VkIHZhbHVlcy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB2YWx1ZSByZXNldHMgYmFjayB0byB6ZXJvIG9uY2UgdGhlIG5leHQgZGlyZWN0aXZlIGlzXG4gKiB2aXNpdGVkICh3aGVuIGBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZGAgb3IgYHNldEFjdGl2ZUhvc3RFbGVtZW50YFxuICogaXMgY2FsbGVkKS5cbiAqL1xubGV0IGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPSAwO1xuXG4vKipcbiAqIFNldHMgdGhlIGFjdGl2ZSBkaXJlY3RpdmUgaG9zdCBlbGVtZW50IGFuZCByZXNldHMgdGhlIGRpcmVjdGl2ZSBpZCB2YWx1ZVxuICogKHdoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRJbmRleCB2YWx1ZSBoYXMgY2hhbmdlZCkuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRJbmRleCB0aGUgZWxlbWVudCBpbmRleCB2YWx1ZSBmb3IgdGhlIGhvc3QgZWxlbWVudCB3aGVyZVxuICogICAgICAgICAgICAgICAgICAgICB0aGUgZGlyZWN0aXZlL2NvbXBvbmVudCBpbnN0YW5jZSBsaXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbCkge1xuICBpZiAoX3NlbGVjdGVkSW5kZXggIT09IGVsZW1lbnRJbmRleCkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoZWxlbWVudEluZGV4ID09PSBudWxsID8gLTEgOiBlbGVtZW50SW5kZXgpO1xuICAgIGFjdGl2ZURpcmVjdGl2ZUlkID0gZWxlbWVudEluZGV4ID09PSBudWxsID8gMCA6IE1JTl9ESVJFQ1RJVkVfSUQ7XG4gICAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gPSAwO1xuICAgIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPSAwO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBpZCB2YWx1ZSBvZiB0aGUgY3VycmVudCBkaXJlY3RpdmUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSBhbiBlbGVtZW50IHRoYXQgaGFzIHR3byBkaXJlY3RpdmVzIG9uIGl0OlxuICogPGRpdiBkaXItb25lIGRpci10d28+PC9kaXY+XG4gKlxuICogZGlyT25lLT5ob3N0QmluZGluZ3MoKSAoaWQgPT0gMSlcbiAqIGRpclR3by0+aG9zdEJpbmRpbmdzKCkgKGlkID09IDIpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIE5vdGUgdGhhdCBkaXJlY3RpdmUgaWQgdmFsdWVzIGFyZSBzcGVjaWZpYyB0byBhbiBlbGVtZW50ICh0aGlzIG1lYW5zIHRoYXRcbiAqIHRoZSBzYW1lIGlkIHZhbHVlIGNvdWxkIGJlIHByZXNlbnQgb24gYW5vdGhlciBlbGVtZW50IHdpdGggYSBjb21wbGV0ZWx5XG4gKiBkaWZmZXJlbnQgc2V0IG9mIGRpcmVjdGl2ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSB7XG4gIHJldHVybiBhY3RpdmVEaXJlY3RpdmVJZDtcbn1cblxuLyoqXG4gKiBJbmNyZW1lbnRzIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSBpZCB2YWx1ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIGFuIGVsZW1lbnQgdGhhdCBoYXMgdHdvIGRpcmVjdGl2ZXMgb24gaXQ6XG4gKiA8ZGl2IGRpci1vbmUgZGlyLXR3bz48L2Rpdj5cbiAqXG4gKiBkaXJPbmUtPmhvc3RCaW5kaW5ncygpIChpbmRleCA9IDEpXG4gKiAvLyBpbmNyZW1lbnRcbiAqIGRpclR3by0+aG9zdEJpbmRpbmdzKCkgKGluZGV4ID0gMilcbiAqXG4gKiBEZXBlbmRpbmcgb24gd2hldGhlciBvciBub3QgYSBwcmV2aW91cyBkaXJlY3RpdmUgaGFkIGFueSBpbmhlcml0ZWRcbiAqIGRpcmVjdGl2ZXMgcHJlc2VudCwgdGhhdCB2YWx1ZSB3aWxsIGJlIGluY3JlbWVudGVkIGluIGFkZGl0aW9uXG4gKiB0byB0aGUgaWQganVtcGluZyB1cCBieSBvbmUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIE5vdGUgdGhhdCBkaXJlY3RpdmUgaWQgdmFsdWVzIGFyZSBzcGVjaWZpYyB0byBhbiBlbGVtZW50ICh0aGlzIG1lYW5zIHRoYXRcbiAqIHRoZSBzYW1lIGlkIHZhbHVlIGNvdWxkIGJlIHByZXNlbnQgb24gYW5vdGhlciBlbGVtZW50IHdpdGggYSBjb21wbGV0ZWx5XG4gKiBkaWZmZXJlbnQgc2V0IG9mIGRpcmVjdGl2ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKSB7XG4gIGFjdGl2ZURpcmVjdGl2ZUlkICs9IDEgKyBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0O1xuXG4gIC8vIGJlY2F1c2Ugd2UgYXJlIGRlYWxpbmcgd2l0aCBhIG5ldyBkaXJlY3RpdmUgdGhpc1xuICAvLyBtZWFucyB3ZSBoYXZlIGV4aXRlZCBvdXQgb2YgdGhlIGluaGVyaXRhbmNlIGNoYWluXG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uID0gMDtcbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9IDA7XG59XG5cbi8qKlxuICogU2V0IHRoZSBjdXJyZW50IHN1cGVyIGNsYXNzIChyZXZlcnNlIGluaGVyaXRhbmNlKSBwb3NpdGlvbiBkZXB0aCBmb3IgYSBkaXJlY3RpdmUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSB0d28gZGlyZWN0aXZlczogQ2hpbGQgYW5kIE90aGVyIChidXQgQ2hpbGQgaXMgYSBzdWItY2xhc3Mgb2YgUGFyZW50KVxuICogPGRpdiBjaGlsZC1kaXIgb3RoZXItZGlyPjwvZGl2PlxuICpcbiAqIC8vIGluY3JlbWVudFxuICogcGFyZW50SW5zdGFuY2UtPmhvc3RCaW5kaW5ncygpIChkZXB0aCA9IDEpXG4gKiAvLyBkZWNyZW1lbnRcbiAqIGNoaWxkSW5zdGFuY2UtPmhvc3RCaW5kaW5ncygpIChkZXB0aCA9IDApXG4gKiBvdGhlckluc3RhbmNlLT5ob3N0QmluZGluZ3MoKSAoZGVwdGggPSAwIGIvYyBpdCdzIGEgZGlmZmVyZW50IGRpcmVjdGl2ZSlcbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGp1c3RBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbihkZWx0YTogbnVtYmVyKSB7XG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uICs9IGRlbHRhO1xuXG4gIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGhlaWdodCB2YWx1ZSBzbyB0aGF0IHdoZW4gdGhlIG5leHQgZGlyZWN0aXZlIGlzIHZpc2l0ZWRcbiAgLy8gdGhlbiBBbmd1bGFyIGtub3dzIHRvIGdlbmVyYXRlIGEgbmV3IGRpcmVjdGl2ZSBpZCB2YWx1ZSB3aGljaCBoYXMgdGFrZW4gaW50b1xuICAvLyBhY2NvdW50IGhvdyBtYW55IHN1Yi1jbGFzcyBkaXJlY3RpdmVzIHdlcmUgYSBwYXJ0IG9mIHRoZSBwcmV2aW91cyBkaXJlY3RpdmUuXG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPVxuICAgICAgTWF0aC5tYXgoYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCwgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24pO1xufVxuXG4vKipcbiAqIFJldHVybnMgaGUgY3VycmVudCBkZXB0aCBvZiB0aGUgc3VwZXIvc3ViIGNsYXNzIGluaGVyaXRhbmNlIGNoYWluLlxuICpcbiAqIFRoaXMgd2lsbCByZXR1cm4gaG93IG1hbnkgaW5oZXJpdGVkIGRpcmVjdGl2ZS9jb21wb25lbnQgY2xhc3Nlc1xuICogZXhpc3QgaW4gdGhlIGN1cnJlbnQgY2hhaW4uXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW3N1cGVyLWRpcl0nIH0pXG4gKiBjbGFzcyBTdXBlckRpciB7fVxuICpcbiAqIEBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tzdWItZGlyXScgfSlcbiAqIGNsYXNzIFN1YkRpciBleHRlbmRzIFN1cGVyRGlyIHt9XG4gKlxuICogLy8gaWYgYDxkaXYgc3ViLWRpcj5gIGlzIHVzZWQgdGhlbiB0aGUgc3VwZXIgY2xhc3MgaGVpZ2h0IGlzIGAxYFxuICogLy8gaWYgYDxkaXYgc3VwZXItZGlyPmAgaXMgdXNlZCB0aGVuIHRoZSBzdXBlciBjbGFzcyBoZWlnaHQgaXMgYDBgXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQoKSB7XG4gIHJldHVybiBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgc3VwZXIgY2xhc3MgKHJldmVyc2UgaW5oZXJpdGFuY2UpIGRlcHRoIGZvciBhIGRpcmVjdGl2ZS5cbiAqXG4gKiBUaGlzIGlzIGRlc2lnbmVkIHRvIGhlbHAgaW5zdHJ1Y3Rpb24gY29kZSBkaXN0aW5ndWlzaCBkaWZmZXJlbnQgaG9zdEJpbmRpbmdzXG4gKiBjYWxscyBmcm9tIGVhY2ggb3RoZXIgd2hlbiBhIGRpcmVjdGl2ZSBoYXMgZXh0ZW5kZWQgZnJvbSBhbm90aGVyIGRpcmVjdGl2ZS5cbiAqIE5vcm1hbGx5IHVzaW5nIHRoZSBkaXJlY3RpdmUgaWQgdmFsdWUgaXMgZW5vdWdoLCBidXQgd2l0aCB0aGUgY2FzZVxuICogb2YgcGFyZW50L3N1Yi1jbGFzcyBkaXJlY3RpdmUgaW5oZXJpdGFuY2UgbW9yZSBpbmZvcm1hdGlvbiBpcyByZXF1aXJlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgoKSB7XG4gIHJldHVybiBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbjtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBjb250ZXh0TFZpZXcgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlldztcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlOiBUTm9kZSwgX2lzUGFyZW50OiBib29sZWFuKSB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGU6IFROb2RlLCB2aWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZCh2aWV3KTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGxWaWV3ID0gdmlldztcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldElzUGFyZW50KCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBpc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldElzTm90UGFyZW50KCk6IHZvaWQge1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldElzUGFyZW50KCk6IHZvaWQge1xuICBpc1BhcmVudCA9IHRydWU7XG59XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICovXG5sZXQgbFZpZXc6IExWaWV3O1xuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0TFZpZXc6IExWaWV3ID0gbnVsbCAhO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dExWaWV3KCk6IExWaWV3IHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY29udGV4dExWaWV3O1xufVxuXG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNoZWNrTm9DaGFuZ2VzTW9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENoZWNrTm9DaGFuZ2VzTW9kZShtb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IG1vZGU7XG59XG5cbi8qKlxuICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICsgYW55IGRpcnMvaG9zdFZhcnMgYmVmb3JlIHRoZSBnaXZlbiBkaXIuXG4gKi9cbmxldCBiaW5kaW5nUm9vdEluZGV4OiBudW1iZXIgPSAtMTtcblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICByZXR1cm4gYmluZGluZ1Jvb3RJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdSb290KHZhbHVlOiBudW1iZXIpIHtcbiAgYmluZGluZ1Jvb3RJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIEN1cnJlbnQgaW5kZXggb2YgYSBWaWV3IG9yIENvbnRlbnQgUXVlcnkgd2hpY2ggbmVlZHMgdG8gYmUgcHJvY2Vzc2VkIG5leHQuXG4gKiBXZSBpdGVyYXRlIG92ZXIgdGhlIGxpc3Qgb2YgUXVlcmllcyBhbmQgaW5jcmVtZW50IGN1cnJlbnQgcXVlcnkgaW5kZXggYXQgZXZlcnkgc3RlcC5cbiAqL1xubGV0IGN1cnJlbnRRdWVyeUluZGV4OiBudW1iZXIgPSAwO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTogbnVtYmVyIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3VycmVudFF1ZXJ5SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50UXVlcnlJbmRleCh2YWx1ZTogbnVtYmVyKTogdm9pZCB7XG4gIGN1cnJlbnRRdWVyeUluZGV4ID0gdmFsdWU7XG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBzdGF0ZSB3aXRoIGEgbmV3IHN0YXRlLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBzdGF0ZSBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBzdGF0ZSBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91cyBzdGF0ZTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUVmlld05vZGUgfCBudWxsKTogTFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXdPclVuZGVmaW5lZChuZXdWaWV3KTtcbiAgY29uc3Qgb2xkVmlldyA9IGxWaWV3O1xuICBpZiAobmV3Vmlldykge1xuICAgIGNvbnN0IHRWaWV3ID0gbmV3Vmlld1tUVklFV107XG4gICAgYmluZGluZ1Jvb3RJbmRleCA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICB9XG5cbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gaG9zdFROb2RlICE7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcblxuICBsVmlldyA9IGNvbnRleHRMVmlldyA9IG5ld1ZpZXc7XG4gIHJldHVybiBvbGRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV4dENvbnRleHRJbXBsPFQgPSBhbnk+KGxldmVsOiBudW1iZXIgPSAxKTogVCB7XG4gIGNvbnRleHRMVmlldyA9IHdhbGtVcFZpZXdzKGxldmVsLCBjb250ZXh0TFZpZXcgISk7XG4gIHJldHVybiBjb250ZXh0TFZpZXdbQ09OVEVYVF0gYXMgVDtcbn1cblxuZnVuY3Rpb24gd2Fsa1VwVmlld3MobmVzdGluZ0xldmVsOiBudW1iZXIsIGN1cnJlbnRWaWV3OiBMVmlldyk6IExWaWV3IHtcbiAgd2hpbGUgKG5lc3RpbmdMZXZlbCA+IDApIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddLFxuICAgICAgICAgICAgICAgICAgICAgJ0RlY2xhcmF0aW9uIHZpZXcgc2hvdWxkIGJlIGRlZmluZWQgaWYgbmVzdGluZyBsZXZlbCBpcyBncmVhdGVyIHRoYW4gMC4nKTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgbmVzdGluZ0xldmVsLS07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRWaWV3O1xufVxuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldENvbXBvbmVudFN0YXRlKCkge1xuICBpc1BhcmVudCA9IGZhbHNlO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBudWxsICE7XG4gIGVsZW1lbnREZXB0aENvdW50ID0gMDtcbiAgYmluZGluZ3NFbmFibGVkID0gdHJ1ZTtcbiAgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKG51bGwpO1xuICByZXNldEFsbFN0eWxpbmdTdGF0ZSgpO1xufVxuXG4vKipcbiAqIFVzZWQgaW4gbGlldSBvZiBlbnRlclZpZXcgdG8gbWFrZSBpdCBjbGVhciB3aGVuIHdlIGFyZSBleGl0aW5nIGEgY2hpbGQgdmlldy4gVGhpcyBtYWtlc1xuICogdGhlIGRpcmVjdGlvbiBvZiB0cmF2ZXJzYWwgKHVwIG9yIGRvd24gdGhlIHZpZXcgdHJlZSkgYSBiaXQgY2xlYXJlci5cbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIHNhZmVUb1J1bkhvb2tzIFdoZXRoZXIgdGhlIHJ1bnRpbWUgaXMgaW4gYSBzdGF0ZSB3aGVyZSBydW5uaW5nIGxpZmVjeWNsZSBob29rcyBpcyB2YWxpZC5cbiAqIFRoaXMgaXMgbm90IGFsd2F5cyB0aGUgY2FzZSAoZm9yIGV4YW1wbGUsIHRoZSBhcHBsaWNhdGlvbiBtYXkgaGF2ZSBjcmFzaGVkIGFuZCBgbGVhdmVWaWV3YCBpc1xuICogYmVpbmcgZXhlY3V0ZWQgd2hpbGUgdW53aW5kaW5nIHRoZSBjYWxsIHN0YWNrKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldyhuZXdWaWV3OiBMVmlldywgc2FmZVRvUnVuSG9va3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmIChpc0NyZWF0aW9uTW9kZShsVmlldykpIHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgICAgIHNhZmVUb1J1bkhvb2tzICYmIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlldywgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY2hlY2tOb0NoYW5nZXNNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4sIHVuZGVmaW5lZCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFZpZXdzIGFyZSBjbGVhbiBhbmQgaW4gdXBkYXRlIG1vZGUgYWZ0ZXIgYmVpbmcgY2hlY2tlZCwgc28gdGhlc2UgYml0cyBhcmUgY2xlYXJlZFxuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgICAgbFZpZXdbQklORElOR19JTkRFWF0gPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgICB9XG4gIH1cbiAgZW50ZXJWaWV3KG5ld1ZpZXcsIG51bGwpO1xufVxuXG5sZXQgX3NlbGVjdGVkSW5kZXggPSAtMTtcblxuLyoqXG4gKiBHZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkSW5kZXgoKSB7XG4gIHJldHVybiBfc2VsZWN0ZWRJbmRleDtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICBfc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuXG4gIC8vIHdlIGhhdmUgbm93IGp1bXBlZCB0byBhbm90aGVyIGVsZW1lbnRcbiAgLy8gdGhlcmVmb3JlIHRoZSBzdGF0ZSBpcyBzdGFsZVxuICByZXNldFN0eWxpbmdTdGF0ZSgpO1xufVxuXG5cbmxldCBfY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlU1ZHKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlTWF0aE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlSFRNTCgpIHtcbiAgbmFtZXNwYWNlSFRNTEludGVybmFsKCk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudE5hbWVzcGFjZTtcbn1cblxubGV0IF9jdXJyZW50U2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIF9jdXJyZW50U2FuaXRpemVyID0gc2FuaXRpemVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkge1xuICByZXR1cm4gX2N1cnJlbnRTYW5pdGl6ZXI7XG59XG4iXX0=