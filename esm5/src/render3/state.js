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
 */
var elementDepthCount;
export function getElementDepthCount() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return elementDepthCount;
}
export function increaseElementDepthCount() {
    elementDepthCount++;
}
export function decreaseElementDepthCount() {
    elementDepthCount--;
}
var currentDirectiveDef = null;
export function getCurrentDirectiveDef() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return currentDirectiveDef;
}
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
 */
var bindingsEnabled;
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
 * @codeGenApi
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
 * @codeGenApi
 */
export function ɵɵdisableBindings() {
    bindingsEnabled = false;
}
export function getLView() {
    return lView;
}
/**
 * Used as the starting directive id value.
 *
 * All subsequent directives are incremented from this value onwards.
 * The reason why this value is `1` instead of `0` is because the `0`
 * value is reserved for the template.
 */
var MIN_DIRECTIVE_ID = 1;
var activeDirectiveId = MIN_DIRECTIVE_ID;
/**
 * Position depth (with respect from leaf to root) in a directive sub-class inheritance chain.
 */
var activeDirectiveSuperClassDepthPosition = 0;
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
 */
var activeDirectiveSuperClassHeight = 0;
/**
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 */
export function setActiveHostElement(elementIndex) {
    if (elementIndex === void 0) { elementIndex = null; }
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
 * @Directive({ selector: '[super-dir]' })
 * class SuperDir {}
 *
 * @Directive({ selector: '[sub-dir]' })
 * class SubDir extends SuperDir {}
 *
 * // if `<div sub-dir>` is used then the super class height is `1`
 * // if `<div super-dir>` is used then the super class height is `0`
 * ```
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
 * @param viewToRestore The OpaqueViewState instance to restore.
 *
 * @codeGenApi
 */
export function ɵɵrestoreView(viewToRestore) {
    contextLView = viewToRestore;
}
/** Used to set the parent property when nodes are created and track query results. */
var previousOrParentTNode;
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
export function setPreviousOrParentTNode(tNode, _isParent) {
    previousOrParentTNode = tNode;
    isParent = _isParent;
}
export function setTNodeAndViewData(tNode, view) {
    ngDevMode && assertLViewOrUndefined(view);
    previousOrParentTNode = tNode;
    lView = view;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
 */
var isParent;
export function getIsParent() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return isParent;
}
export function setIsNotParent() {
    isParent = false;
}
export function setIsParent() {
    isParent = true;
}
/**
 * State of the current view being processed.
 *
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 */
var lView;
/**
 * The last viewData retrieved by nextContext().
 * Allows building nextContext() and reference() calls.
 *
 * e.g. const inner = x().$implicit; const outer = x().$implicit;
 */
var contextLView = null;
export function getContextLView() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return contextLView;
}
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 */
var checkNoChangesMode = false;
export function getCheckNoChangesMode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return checkNoChangesMode;
}
export function setCheckNoChangesMode(mode) {
    checkNoChangesMode = mode;
}
/**
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
 */
var bindingRootIndex = -1;
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
export function getBindingRoot() {
    return bindingRootIndex;
}
export function setBindingRoot(value) {
    bindingRootIndex = value;
}
/**
 * Current index of a View or Content Query which needs to be processed next.
 * We iterate over the list of Queries and increment current query index at every step.
 */
var currentQueryIndex = 0;
export function getCurrentQueryIndex() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return currentQueryIndex;
}
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
 * @param newView New state to become active
 * @param host Element to which the View is a child of
 * @returns the previous state;
 */
export function enterView(newView, hostTNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    var oldView = lView;
    if (newView) {
        var tView = newView[TVIEW];
        bindingRootIndex = tView.bindingStartIndex;
    }
    previousOrParentTNode = hostTNode;
    isParent = true;
    lView = contextLView = newView;
    return oldView;
}
export function nextContextImpl(level) {
    if (level === void 0) { level = 1; }
    contextLView = walkUpViews(level, contextLView);
    return contextLView[CONTEXT];
}
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = currentView[DECLARATION_VIEW];
        nestingLevel--;
    }
    return currentView;
}
/**
 * Resets the application state.
 */
export function resetComponentState() {
    isParent = false;
    previousOrParentTNode = null;
    elementDepthCount = 0;
    bindingsEnabled = true;
    setCurrentStyleSanitizer(null);
    resetAllStylingState();
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param newView New state to become active
 * @param safeToRunHooks Whether the runtime is in a state where running lifecycle hooks is valid.
 * This is not always the case (for example, the application may have crashed and `leaveView` is
 * being executed while unwinding the call stack).
 */
export function leaveView(newView, safeToRunHooks) {
    var tView = lView[TVIEW];
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
var _selectedIndex = -1;
/**
 * Gets the most recent index passed to {@link select}
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 */
export function getSelectedIndex() {
    return _selectedIndex;
}
/**
 * Sets the most recent index passed to {@link select}
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 */
export function setSelectedIndex(index) {
    _selectedIndex = index;
    // we have now jumped to another element
    // therefore the state is stale
    resetStylingState();
}
var _currentNamespace = null;
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg';
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceMathML() {
    _currentNamespace = 'http://www.w3.org/1998/MathML/';
}
/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceHTML() {
    namespaceHTMLInternal();
}
/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 */
export function namespaceHTMLInternal() {
    _currentNamespace = null;
}
export function getNamespace() {
    return _currentNamespace;
}
var _currentSanitizer;
export function setCurrentStyleSanitizer(sanitizer) {
    _currentSanitizer = sanitizer;
}
export function getCurrentStyleSanitizer() {
    return _currentSanitizer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUdyQyxPQUFPLEVBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQXNELEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdJLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzdFLE9BQU8sRUFBQyxjQUFjLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl6RTs7O0dBR0c7QUFDSCxJQUFJLGlCQUEyQixDQUFDO0FBRWhDLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMscUZBQXFGO0lBQ3JGLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QixDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxJQUFJLG1CQUFtQixHQUE2QyxJQUFJLENBQUM7QUFFekUsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxxRkFBcUY7SUFDckYsT0FBTyxtQkFBbUIsQ0FBQztBQUM3QixDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEdBQStDO0lBQ3BGLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsSUFBSSxlQUEwQixDQUFDO0FBRS9CLE1BQU0sVUFBVSxrQkFBa0I7SUFDaEMscUZBQXFGO0lBQ3JGLE9BQU8sZUFBZSxDQUFDO0FBQ3pCLENBQUM7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQjtJQUM5QixlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQjtJQUMvQixlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzFCLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUTtJQUN0QixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxJQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQztBQUUzQixJQUFJLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDO0FBRXpDOztHQUVHO0FBQ0gsSUFBSSxzQ0FBc0MsR0FBRyxDQUFDLENBQUM7QUFFL0M7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxJQUFJLCtCQUErQixHQUFHLENBQUMsQ0FBQztBQUV4Qzs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsWUFBa0M7SUFBbEMsNkJBQUEsRUFBQSxtQkFBa0M7SUFDckUsSUFBSSxjQUFjLEtBQUssWUFBWSxFQUFFO1FBQ25DLGdCQUFnQixDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1RCxpQkFBaUIsR0FBRyxZQUFZLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBQ2pFLHNDQUFzQyxHQUFHLENBQUMsQ0FBQztRQUMzQywrQkFBK0IsR0FBRyxDQUFDLENBQUM7S0FDckM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQjtJQUN4QyxpQkFBaUIsSUFBSSxDQUFDLEdBQUcsK0JBQStCLENBQUM7SUFFekQsbURBQW1EO0lBQ25ELG9EQUFvRDtJQUNwRCxzQ0FBc0MsR0FBRyxDQUFDLENBQUM7SUFDM0MsK0JBQStCLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxVQUFVLDRDQUE0QyxDQUFDLEtBQWE7SUFDeEUsc0NBQXNDLElBQUksS0FBSyxDQUFDO0lBRWhELCtFQUErRTtJQUMvRSwrRUFBK0U7SUFDL0UsK0VBQStFO0lBQy9FLCtCQUErQjtRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLCtCQUErQixFQUFFLHNDQUFzQyxDQUFDLENBQUM7QUFDeEYsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxVQUFVLGtDQUFrQztJQUNoRCxPQUFPLCtCQUErQixDQUFDO0FBQ3pDLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsaUNBQWlDO0lBQy9DLE9BQU8sc0NBQXNDLENBQUM7QUFDaEQsQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLGFBQThCO0lBQzFELFlBQVksR0FBRyxhQUE2QixDQUFDO0FBQy9DLENBQUM7QUFFRCxzRkFBc0Y7QUFDdEYsSUFBSSxxQkFBNEIsQ0FBQztBQUVqQyxNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLHFGQUFxRjtJQUNyRixPQUFPLHFCQUFxQixDQUFDO0FBQy9CLENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsS0FBWSxFQUFFLFNBQWtCO0lBQ3ZFLHFCQUFxQixHQUFHLEtBQUssQ0FBQztJQUM5QixRQUFRLEdBQUcsU0FBUyxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLElBQVc7SUFDM0QsU0FBUyxJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztJQUM5QixLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxJQUFJLFFBQWlCLENBQUM7QUFFdEIsTUFBTSxVQUFVLFdBQVc7SUFDekIscUZBQXFGO0lBQ3JGLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYztJQUM1QixRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ25CLENBQUM7QUFDRCxNQUFNLFVBQVUsV0FBVztJQUN6QixRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILElBQUksS0FBWSxDQUFDO0FBRWpCOzs7OztHQUtHO0FBQ0gsSUFBSSxZQUFZLEdBQVUsSUFBTSxDQUFDO0FBRWpDLE1BQU0sVUFBVSxlQUFlO0lBQzdCLHFGQUFxRjtJQUNyRixPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0FBRS9CLE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMscUZBQXFGO0lBQ3JGLE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxJQUFhO0lBQ2pELGtCQUFrQixHQUFHLElBQUksQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILElBQUksZ0JBQWdCLEdBQVcsQ0FBQyxDQUFDLENBQUM7QUFFbEMscUZBQXFGO0FBQ3JGLE1BQU0sVUFBVSxjQUFjO0lBQzVCLE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBYTtJQUMxQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7R0FHRztBQUNILElBQUksaUJBQWlCLEdBQVcsQ0FBQyxDQUFDO0FBRWxDLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMscUZBQXFGO0lBQ3JGLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFhO0lBQ2hELGlCQUFpQixHQUFHLEtBQUssQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQWMsRUFBRSxTQUEwQztJQUNsRixTQUFTLElBQUksc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksT0FBTyxFQUFFO1FBQ1gsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdCLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztLQUM1QztJQUVELHFCQUFxQixHQUFHLFNBQVcsQ0FBQztJQUNwQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBRWhCLEtBQUssR0FBRyxZQUFZLEdBQUcsT0FBTyxDQUFDO0lBQy9CLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFVLEtBQWlCO0lBQWpCLHNCQUFBLEVBQUEsU0FBaUI7SUFDeEQsWUFBWSxHQUFHLFdBQVcsQ0FBQyxLQUFLLEVBQUUsWUFBYyxDQUFDLENBQUM7SUFDbEQsT0FBTyxZQUFZLENBQUMsT0FBTyxDQUFNLENBQUM7QUFDcEMsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLFlBQW9CLEVBQUUsV0FBa0I7SUFDM0QsT0FBTyxZQUFZLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLFNBQVMsSUFBSSxhQUFhLENBQ1QsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEVBQzdCLHdFQUF3RSxDQUFDLENBQUM7UUFDM0YsV0FBVyxHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBRyxDQUFDO1FBQzlDLFlBQVksRUFBRSxDQUFDO0tBQ2hCO0lBQ0QsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQjtJQUNqQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ2pCLHFCQUFxQixHQUFHLElBQU0sQ0FBQztJQUMvQixpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDdEIsZUFBZSxHQUFHLElBQUksQ0FBQztJQUN2Qix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixvQkFBb0IsRUFBRSxDQUFDO0FBQ3pCLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsT0FBYyxFQUFFLGNBQXVCO0lBQy9ELElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN6QixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUkscUJBQXdCLENBQUM7S0FDMUM7U0FBTTtRQUNMLElBQUk7WUFDRixzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixjQUFjLElBQUksWUFBWSxDQUNSLEtBQUssRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLHFDQUN0QixTQUFTLENBQUMsQ0FBQztTQUM1RTtnQkFBUztZQUNSLG9GQUFvRjtZQUNwRixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLHVDQUE0QyxDQUFDLENBQUM7WUFDaEUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztTQUNoRDtLQUNGO0lBQ0QsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBRUQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFFeEI7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFhO0lBQzVDLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFFdkIsd0NBQXdDO0lBQ3hDLCtCQUErQjtJQUMvQixpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7QUFHRCxJQUFJLGlCQUFpQixHQUFnQixJQUFJLENBQUM7QUFFMUM7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxjQUFjO0lBQzVCLGlCQUFpQixHQUFHLDRCQUE0QixDQUFDO0FBQ25ELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQjtJQUMvQixpQkFBaUIsR0FBRyxnQ0FBZ0MsQ0FBQztBQUN2RCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZUFBZTtJQUM3QixxQkFBcUIsRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUMzQixDQUFDO0FBRUQsTUFBTSxVQUFVLFlBQVk7SUFDMUIsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDO0FBRUQsSUFBSSxpQkFBdUMsQ0FBQztBQUM1QyxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBaUM7SUFDeEUsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQ2hDLENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0TFZpZXdPclVuZGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtleGVjdXRlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIERpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgT3BhcXVlVmlld1N0YXRlLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtyZXNldEFsbFN0eWxpbmdTdGF0ZSwgcmVzZXRTdHlsaW5nU3RhdGV9IGZyb20gJy4vc3R5bGluZ19uZXh0L3N0YXRlJztcbmltcG9ydCB7aXNDcmVhdGlvbk1vZGUsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3N9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogU3RvcmUgdGhlIGVsZW1lbnQgZGVwdGggY291bnQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgcm9vdCBlbGVtZW50cyBvZiB0aGUgdGVtcGxhdGVcbiAqIHNvIHRoYXQgd2UgY2FuIHRoYW4gYXR0YWNoIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy5cbiAqL1xubGV0IGVsZW1lbnREZXB0aENvdW50ICE6IG51bWJlcjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnREZXB0aENvdW50KCkge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBlbGVtZW50RGVwdGhDb3VudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBlbGVtZW50RGVwdGhDb3VudC0tO1xufVxuXG5sZXQgY3VycmVudERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGlyZWN0aXZlRGVmKCk6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fG51bGwge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjdXJyZW50RGlyZWN0aXZlRGVmO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudERpcmVjdGl2ZURlZihkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PnwgbnVsbCk6IHZvaWQge1xuICBjdXJyZW50RGlyZWN0aXZlRGVmID0gZGVmO1xufVxuXG4vKipcbiAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gKlxuICogV2hlbiB0ZW1wbGF0ZSBjb250YWlucyBgbmdOb25CaW5kYWJsZWAgdGhhbiB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHJ1bnRpbWUgZm9ybSBtYXRjaGluZ1xuICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqL1xubGV0IGJpbmRpbmdzRW5hYmxlZCAhOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ3NFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBiaW5kaW5nc0VuYWJsZWQ7XG59XG5cblxuLyoqXG4gKiBFbmFibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50cy5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gybXJtWRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIMm1ybVlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVuYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3KCk6IExWaWV3IHtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgYXMgdGhlIHN0YXJ0aW5nIGRpcmVjdGl2ZSBpZCB2YWx1ZS5cbiAqXG4gKiBBbGwgc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBpbmNyZW1lbnRlZCBmcm9tIHRoaXMgdmFsdWUgb253YXJkcy5cbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgdmFsdWUgaXMgYDFgIGluc3RlYWQgb2YgYDBgIGlzIGJlY2F1c2UgdGhlIGAwYFxuICogdmFsdWUgaXMgcmVzZXJ2ZWQgZm9yIHRoZSB0ZW1wbGF0ZS5cbiAqL1xuY29uc3QgTUlOX0RJUkVDVElWRV9JRCA9IDE7XG5cbmxldCBhY3RpdmVEaXJlY3RpdmVJZCA9IE1JTl9ESVJFQ1RJVkVfSUQ7XG5cbi8qKlxuICogUG9zaXRpb24gZGVwdGggKHdpdGggcmVzcGVjdCBmcm9tIGxlYWYgdG8gcm9vdCkgaW4gYSBkaXJlY3RpdmUgc3ViLWNsYXNzIGluaGVyaXRhbmNlIGNoYWluLlxuICovXG5sZXQgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gPSAwO1xuXG4vKipcbiAqIFRvdGFsIGNvdW50IG9mIGhvdyBtYW55IGRpcmVjdGl2ZXMgYXJlIGEgcGFydCBvZiBhbiBpbmhlcml0YW5jZSBjaGFpbi5cbiAqXG4gKiBXaGVuIGRpcmVjdGl2ZXMgYXJlIHN1Yi1jbGFzc2VkIChleHRlbmRlZCkgZnJvbSBvbmUgdG8gYW5vdGhlciwgQW5ndWxhclxuICogbmVlZHMgdG8ga2VlcCB0cmFjayBvZiBleGFjdGx5IGhvdyBtYW55IHdlcmUgZW5jb3VudGVyZWQgc28gaXQgY2FuIGFjY3VyYXRlbHlcbiAqIGdlbmVyYXRlIHRoZSBuZXh0IGRpcmVjdGl2ZSBpZCAob25jZSB0aGUgbmV4dCBkaXJlY3RpdmUgaWQgaXMgdmlzaXRlZCkuXG4gKiBOb3JtYWxseSB0aGUgbmV4dCBkaXJlY3RpdmUgaWQganVzdCBhIHNpbmdsZSBpbmNyZW1lbnRlZCB2YWx1ZSBmcm9tIHRoZVxuICogcHJldmlvdXMgb25lLCBob3dldmVyLCBpZiB0aGUgcHJldmlvdXMgZGlyZWN0aXZlIGlzIGEgcGFydCBvZiBhbiBpbmhlcml0YW5jZVxuICogY2hhaW4gKGEgc2VyaWVzIG9mIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZXMpIHRoZW4gdGhlIGluY3JlbWVudGVkIHZhbHVlIG11c3RcbiAqIGFsc28gdGFrZSBpbnRvIGFjY291bnQgdGhlIHRvdGFsIGFtb3VudCBvZiBzdWItY2xhc3NlZCB2YWx1ZXMuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgdmFsdWUgcmVzZXRzIGJhY2sgdG8gemVybyBvbmNlIHRoZSBuZXh0IGRpcmVjdGl2ZSBpc1xuICogdmlzaXRlZCAod2hlbiBgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWRgIG9yIGBzZXRBY3RpdmVIb3N0RWxlbWVudGBcbiAqIGlzIGNhbGxlZCkuXG4gKi9cbmxldCBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID0gMDtcblxuLyoqXG4gKiBTZXRzIHRoZSBhY3RpdmUgZGlyZWN0aXZlIGhvc3QgZWxlbWVudCBhbmQgcmVzZXRzIHRoZSBkaXJlY3RpdmUgaWQgdmFsdWVcbiAqICh3aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50SW5kZXggdmFsdWUgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50SW5kZXggdGhlIGVsZW1lbnQgaW5kZXggdmFsdWUgZm9yIHRoZSBob3N0IGVsZW1lbnQgd2hlcmVcbiAqICAgICAgICAgICAgICAgICAgICAgdGhlIGRpcmVjdGl2ZS9jb21wb25lbnQgaW5zdGFuY2UgbGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEFjdGl2ZUhvc3RFbGVtZW50KGVsZW1lbnRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGwpIHtcbiAgaWYgKF9zZWxlY3RlZEluZGV4ICE9PSBlbGVtZW50SW5kZXgpIHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCA9PT0gbnVsbCA/IC0xIDogZWxlbWVudEluZGV4KTtcbiAgICBhY3RpdmVEaXJlY3RpdmVJZCA9IGVsZW1lbnRJbmRleCA9PT0gbnVsbCA/IDAgOiBNSU5fRElSRUNUSVZFX0lEO1xuICAgIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uID0gMDtcbiAgICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgaWQgdmFsdWUgb2YgdGhlIGN1cnJlbnQgZGlyZWN0aXZlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgYW4gZWxlbWVudCB0aGF0IGhhcyB0d28gZGlyZWN0aXZlcyBvbiBpdDpcbiAqIDxkaXYgZGlyLW9uZSBkaXItdHdvPjwvZGl2PlxuICpcbiAqIGRpck9uZS0+aG9zdEJpbmRpbmdzKCkgKGlkID09IDEpXG4gKiBkaXJUd28tPmhvc3RCaW5kaW5ncygpIChpZCA9PSAyKVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgZGlyZWN0aXZlIGlkIHZhbHVlcyBhcmUgc3BlY2lmaWMgdG8gYW4gZWxlbWVudCAodGhpcyBtZWFucyB0aGF0XG4gKiB0aGUgc2FtZSBpZCB2YWx1ZSBjb3VsZCBiZSBwcmVzZW50IG9uIGFub3RoZXIgZWxlbWVudCB3aXRoIGEgY29tcGxldGVseVxuICogZGlmZmVyZW50IHNldCBvZiBkaXJlY3RpdmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkge1xuICByZXR1cm4gYWN0aXZlRGlyZWN0aXZlSWQ7XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgY3VycmVudCBkaXJlY3RpdmUgaWQgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSBhbiBlbGVtZW50IHRoYXQgaGFzIHR3byBkaXJlY3RpdmVzIG9uIGl0OlxuICogPGRpdiBkaXItb25lIGRpci10d28+PC9kaXY+XG4gKlxuICogZGlyT25lLT5ob3N0QmluZGluZ3MoKSAoaW5kZXggPSAxKVxuICogLy8gaW5jcmVtZW50XG4gKiBkaXJUd28tPmhvc3RCaW5kaW5ncygpIChpbmRleCA9IDIpXG4gKlxuICogRGVwZW5kaW5nIG9uIHdoZXRoZXIgb3Igbm90IGEgcHJldmlvdXMgZGlyZWN0aXZlIGhhZCBhbnkgaW5oZXJpdGVkXG4gKiBkaXJlY3RpdmVzIHByZXNlbnQsIHRoYXQgdmFsdWUgd2lsbCBiZSBpbmNyZW1lbnRlZCBpbiBhZGRpdGlvblxuICogdG8gdGhlIGlkIGp1bXBpbmcgdXAgYnkgb25lLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgZGlyZWN0aXZlIGlkIHZhbHVlcyBhcmUgc3BlY2lmaWMgdG8gYW4gZWxlbWVudCAodGhpcyBtZWFucyB0aGF0XG4gKiB0aGUgc2FtZSBpZCB2YWx1ZSBjb3VsZCBiZSBwcmVzZW50IG9uIGFub3RoZXIgZWxlbWVudCB3aXRoIGEgY29tcGxldGVseVxuICogZGlmZmVyZW50IHNldCBvZiBkaXJlY3RpdmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCkge1xuICBhY3RpdmVEaXJlY3RpdmVJZCArPSAxICsgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodDtcblxuICAvLyBiZWNhdXNlIHdlIGFyZSBkZWFsaW5nIHdpdGggYSBuZXcgZGlyZWN0aXZlIHRoaXNcbiAgLy8gbWVhbnMgd2UgaGF2ZSBleGl0ZWQgb3V0IG9mIHRoZSBpbmhlcml0YW5jZSBjaGFpblxuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiA9IDA7XG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPSAwO1xufVxuXG4vKipcbiAqIFNldCB0aGUgY3VycmVudCBzdXBlciBjbGFzcyAocmV2ZXJzZSBpbmhlcml0YW5jZSkgcG9zaXRpb24gZGVwdGggZm9yIGEgZGlyZWN0aXZlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgdHdvIGRpcmVjdGl2ZXM6IENoaWxkIGFuZCBPdGhlciAoYnV0IENoaWxkIGlzIGEgc3ViLWNsYXNzIG9mIFBhcmVudClcbiAqIDxkaXYgY2hpbGQtZGlyIG90aGVyLWRpcj48L2Rpdj5cbiAqXG4gKiAvLyBpbmNyZW1lbnRcbiAqIHBhcmVudEluc3RhbmNlLT5ob3N0QmluZGluZ3MoKSAoZGVwdGggPSAxKVxuICogLy8gZGVjcmVtZW50XG4gKiBjaGlsZEluc3RhbmNlLT5ob3N0QmluZGluZ3MoKSAoZGVwdGggPSAwKVxuICogb3RoZXJJbnN0YW5jZS0+aG9zdEJpbmRpbmdzKCkgKGRlcHRoID0gMCBiL2MgaXQncyBhIGRpZmZlcmVudCBkaXJlY3RpdmUpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24oZGVsdGE6IG51bWJlcikge1xuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiArPSBkZWx0YTtcblxuICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBoZWlnaHQgdmFsdWUgc28gdGhhdCB3aGVuIHRoZSBuZXh0IGRpcmVjdGl2ZSBpcyB2aXNpdGVkXG4gIC8vIHRoZW4gQW5ndWxhciBrbm93cyB0byBnZW5lcmF0ZSBhIG5ldyBkaXJlY3RpdmUgaWQgdmFsdWUgd2hpY2ggaGFzIHRha2VuIGludG9cbiAgLy8gYWNjb3VudCBob3cgbWFueSBzdWItY2xhc3MgZGlyZWN0aXZlcyB3ZXJlIGEgcGFydCBvZiB0aGUgcHJldmlvdXMgZGlyZWN0aXZlLlxuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID1cbiAgICAgIE1hdGgubWF4KGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQsIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGhlIGN1cnJlbnQgZGVwdGggb2YgdGhlIHN1cGVyL3N1YiBjbGFzcyBpbmhlcml0YW5jZSBjaGFpbi5cbiAqXG4gKiBUaGlzIHdpbGwgcmV0dXJuIGhvdyBtYW55IGluaGVyaXRlZCBkaXJlY3RpdmUvY29tcG9uZW50IGNsYXNzZXNcbiAqIGV4aXN0IGluIHRoZSBjdXJyZW50IGNoYWluLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIEBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tzdXBlci1kaXJdJyB9KVxuICogY2xhc3MgU3VwZXJEaXIge31cbiAqXG4gKiBARGlyZWN0aXZlKHsgc2VsZWN0b3I6ICdbc3ViLWRpcl0nIH0pXG4gKiBjbGFzcyBTdWJEaXIgZXh0ZW5kcyBTdXBlckRpciB7fVxuICpcbiAqIC8vIGlmIGA8ZGl2IHN1Yi1kaXI+YCBpcyB1c2VkIHRoZW4gdGhlIHN1cGVyIGNsYXNzIGhlaWdodCBpcyBgMWBcbiAqIC8vIGlmIGA8ZGl2IHN1cGVyLWRpcj5gIGlzIHVzZWQgdGhlbiB0aGUgc3VwZXIgY2xhc3MgaGVpZ2h0IGlzIGAwYFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0KCkge1xuICByZXR1cm4gYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IHN1cGVyIGNsYXNzIChyZXZlcnNlIGluaGVyaXRhbmNlKSBkZXB0aCBmb3IgYSBkaXJlY3RpdmUuXG4gKlxuICogVGhpcyBpcyBkZXNpZ25lZCB0byBoZWxwIGluc3RydWN0aW9uIGNvZGUgZGlzdGluZ3Vpc2ggZGlmZmVyZW50IGhvc3RCaW5kaW5nc1xuICogY2FsbHMgZnJvbSBlYWNoIG90aGVyIHdoZW4gYSBkaXJlY3RpdmUgaGFzIGV4dGVuZGVkIGZyb20gYW5vdGhlciBkaXJlY3RpdmUuXG4gKiBOb3JtYWxseSB1c2luZyB0aGUgZGlyZWN0aXZlIGlkIHZhbHVlIGlzIGVub3VnaCwgYnV0IHdpdGggdGhlIGNhc2VcbiAqIG9mIHBhcmVudC9zdWItY2xhc3MgZGlyZWN0aXZlIGluaGVyaXRhbmNlIG1vcmUgaW5mb3JtYXRpb24gaXMgcmVxdWlyZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCkge1xuICByZXR1cm4gYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb247XG59XG5cbi8qKlxuICogUmVzdG9yZXMgYGNvbnRleHRWaWV3RGF0YWAgdG8gdGhlIGdpdmVuIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIGdldEN1cnJlbnRWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gdmlld1RvUmVzdG9yZSBUaGUgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlIHRvIHJlc3RvcmUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXN0b3JlVmlldyh2aWV3VG9SZXN0b3JlOiBPcGFxdWVWaWV3U3RhdGUpIHtcbiAgY29udGV4dExWaWV3ID0gdmlld1RvUmVzdG9yZSBhcyBhbnkgYXMgTFZpZXc7XG59XG5cbi8qKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQgYW5kIHRyYWNrIHF1ZXJ5IHJlc3VsdHMuICovXG5sZXQgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpOiBUTm9kZSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZTogVE5vZGUsIF9pc1BhcmVudDogYm9vbGVhbikge1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRUTm9kZUFuZFZpZXdEYXRhKHROb2RlOiBUTm9kZSwgdmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQodmlldyk7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBsVmlldyA9IHZpZXc7XG59XG5cbi8qKlxuICogSWYgYGlzUGFyZW50YCBpczpcbiAqICAtIGB0cnVlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICovXG5sZXQgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJc1BhcmVudCgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc05vdFBhcmVudCgpOiB2b2lkIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc1BhcmVudCgpOiB2b2lkIHtcbiAgaXNQYXJlbnQgPSB0cnVlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IGxWaWV3OiBMVmlldztcblxuLyoqXG4gKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAqXG4gKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICovXG5sZXQgY29udGV4dExWaWV3OiBMVmlldyA9IG51bGwgITtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHRMVmlldygpOiBMVmlldyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNvbnRleHRMVmlldztcbn1cblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVja05vQ2hhbmdlc01vZGUobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSBtb2RlO1xufVxuXG4vKipcbiAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICovXG5sZXQgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyID0gLTE7XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgcmV0dXJuIGJpbmRpbmdSb290SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdCh2YWx1ZTogbnVtYmVyKSB7XG4gIGJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGluZGV4IG9mIGEgVmlldyBvciBDb250ZW50IFF1ZXJ5IHdoaWNoIG5lZWRzIHRvIGJlIHByb2Nlc3NlZCBuZXh0LlxuICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gKi9cbmxldCBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnRRdWVyeUluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFF1ZXJ5SW5kZXgodmFsdWU6IG51bWJlcik6IHZvaWQge1xuICBjdXJyZW50UXVlcnlJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgc3RhdGUgd2l0aCBhIG5ldyBzdGF0ZS5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgc3RhdGUgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgc3RhdGUgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGhvc3QgRWxlbWVudCB0byB3aGljaCB0aGUgVmlldyBpcyBhIGNoaWxkIG9mXG4gKiBAcmV0dXJucyB0aGUgcHJldmlvdXMgc3RhdGU7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlclZpZXcobmV3VmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQobmV3Vmlldyk7XG4gIGNvbnN0IG9sZFZpZXcgPSBsVmlldztcbiAgaWYgKG5ld1ZpZXcpIHtcbiAgICBjb25zdCB0VmlldyA9IG5ld1ZpZXdbVFZJRVddO1xuICAgIGJpbmRpbmdSb290SW5kZXggPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgbFZpZXcgPSBjb250ZXh0TFZpZXcgPSBuZXdWaWV3O1xuICByZXR1cm4gb2xkVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0TFZpZXcgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbiAgcmVzZXRBbGxTdHlsaW5nU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBzYWZlVG9SdW5Ib29rcyBXaGV0aGVyIHRoZSBydW50aW1lIGlzIGluIGEgc3RhdGUgd2hlcmUgcnVubmluZyBsaWZlY3ljbGUgaG9va3MgaXMgdmFsaWQuXG4gKiBUaGlzIGlzIG5vdCBhbHdheXMgdGhlIGNhc2UgKGZvciBleGFtcGxlLCB0aGUgYXBwbGljYXRpb24gbWF5IGhhdmUgY3Jhc2hlZCBhbmQgYGxlYXZlVmlld2AgaXNcbiAqIGJlaW5nIGV4ZWN1dGVkIHdoaWxlIHVud2luZGluZyB0aGUgY2FsbCBzdGFjaykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcsIHNhZmVUb1J1bkhvb2tzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gICAgICBzYWZlVG9SdW5Ib29rcyAmJiBleGVjdXRlSG9va3MoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbFZpZXcsIHRWaWV3LnZpZXdIb29rcywgdFZpZXcudmlld0NoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuLCB1bmRlZmluZWQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gICAgfVxuICB9XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxubGV0IF9zZWxlY3RlZEluZGV4ID0gLTE7XG5cbi8qKlxuICogR2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gX3NlbGVjdGVkSW5kZXg7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcblxuICAvLyB3ZSBoYXZlIG5vdyBqdW1wZWQgdG8gYW5vdGhlciBlbGVtZW50XG4gIC8vIHRoZXJlZm9yZSB0aGUgc3RhdGUgaXMgc3RhbGVcbiAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbn1cblxuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTEludGVybmFsKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gX2N1cnJlbnROYW1lc3BhY2U7XG59XG5cbmxldCBfY3VycmVudFNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBfY3VycmVudFNhbml0aXplciA9IHNhbml0aXplcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpIHtcbiAgcmV0dXJuIF9jdXJyZW50U2FuaXRpemVyO1xufVxuIl19