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
 *   <!-- ΔdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ΔenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export function ΔenableBindings() {
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
 *   <!-- ΔdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ΔenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export function ΔdisableBindings() {
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
export function ΔrestoreView(viewToRestore) {
    contextLView = viewToRestore;
}
/** Used to set the parent property when nodes are created and track query results. */
var previousOrParentTNode;
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
export function setPreviousOrParentTNode(tNode) {
    previousOrParentTNode = tNode;
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
export function setIsParent(value) {
    isParent = value;
}
/** Checks whether a given view is in creation mode */
export function isCreationMode(view) {
    if (view === void 0) { view = lView; }
    return (view[FLAGS] & 4 /* CreationMode */) === 4 /* CreationMode */;
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
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param newView New state to become active
 */
export function leaveView(newView) {
    var tView = lView[TVIEW];
    if (isCreationMode(lView)) {
        lView[FLAGS] &= ~4 /* CreationMode */;
    }
    else {
        try {
            resetPreOrderHookFlags(lView);
            executeHooks(lView, tView.viewHooks, tView.viewCheckHooks, checkNoChangesMode, 2 /* AfterViewInitHooksToBeRun */, undefined);
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
    // remove the styling context from the cache
    // because we are now on a different element
    setCachedStylingContext(null);
}
var _currentNamespace = null;
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * @codeGenApi
 */
export function ΔnamespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg';
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * @codeGenApi
 */
export function ΔnamespaceMathML() {
    _currentNamespace = 'http://www.w3.org/1998/MathML/';
}
/**
 * Sets the namespace used to create elements no `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 *
 * @codeGenApi
 */
export function ΔnamespaceHTML() {
    _currentNamespace = null;
}
export function getNamespace() {
    return _currentNamespace;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxhQUFhLEVBQW9CLE1BQU0sZ0JBQWdCLENBQUM7QUFFaEUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHckMsT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFzRCxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3SSxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl6RDs7O0dBR0c7QUFDSCxJQUFJLGlCQUEyQixDQUFDO0FBRWhDLE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMscUZBQXFGO0lBQ3JGLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QixDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxJQUFJLG1CQUFtQixHQUE2QyxJQUFJLENBQUM7QUFFekUsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxxRkFBcUY7SUFDckYsT0FBTyxtQkFBbUIsQ0FBQztBQUM3QixDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEdBQStDO0lBQ3BGLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBQ0gsSUFBSSxlQUEw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QWlCLEdBQWdCLElBQUksQ0FBQztBQUUxQzs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGFBQWE7SUFDM0IsaUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7QUFDbkQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFDO0FBQ3ZELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxjQUFjO0lBQzVCLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUMzQixDQUFDO0FBRUQsTUFBTSxVQUFVLFlBQVk7SUFDMUIsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEdyZWF0ZXJUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0TFZpZXdPclVuZGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtleGVjdXRlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIERpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgT3BhcXVlVmlld1N0YXRlLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtzZXRDYWNoZWRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9zdHlsaW5nL3N0YXRlJztcbmltcG9ydCB7cmVzZXRQcmVPcmRlckhvb2tGbGFnc30gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3YCB0byBvbmx5IHRob3NlIGVsZW1lbnRzLlxuICovXG5sZXQgZWxlbWVudERlcHRoQ291bnQgITogbnVtYmVyO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudERlcHRoQ291bnQoKSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGVsZW1lbnREZXB0aENvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbmxldCBjdXJyZW50RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREaXJlY3RpdmVEZWYoKTogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbCB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVEZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+fCBudWxsKTogdm9pZCB7XG4gIGN1cnJlbnREaXJlY3RpdmVEZWYgPSBkZWY7XG59XG5cbi8qKlxuICogU3RvcmVzIHdoZXRoZXIgZGlyZWN0aXZlcyBzaG91bGQgYmUgbWF0Y2hlZCB0byBlbGVtZW50cy5cbiAqXG4gKiBXaGVuIHRlbXBsYXRlIGNvbnRhaW5zIGBuZ05vbkJpbmRhYmxlYCB0aGFuIHdlIG5lZWQgdG8gcHJldmVudCB0aGUgcnVudGltZSBmb3JtIG1hdGNoaW5nXG4gKiBkaXJlY3RpdmVzIG9uIGNoaWxkcmVuIG9mIHRoYXQgZWxlbWVudC5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICovXG5sZXQgYmluZGluZ3NFbmFibGVkICE6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGJpbmRpbmdzRW5hYmxlZDtcbn1cblxuXG4vKipcbiAqIEVuYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnRzLlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDOlGRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIM6UZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZW5hYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogRGlzYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnQuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIM6UZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gzpRlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBhcyB0aGUgc3RhcnRpbmcgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICpcbiAqIEFsbCBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGluY3JlbWVudGVkIGZyb20gdGhpcyB2YWx1ZSBvbndhcmRzLlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyB2YWx1ZSBpcyBgMWAgaW5zdGVhZCBvZiBgMGAgaXMgYmVjYXVzZSB0aGUgYDBgXG4gKiB2YWx1ZSBpcyByZXNlcnZlZCBmb3IgdGhlIHRlbXBsYXRlLlxuICovXG5jb25zdCBNSU5fRElSRUNUSVZFX0lEID0gMTtcblxubGV0IGFjdGl2ZURpcmVjdGl2ZUlkID0gTUlOX0RJUkVDVElWRV9JRDtcblxuLyoqXG4gKiBQb3NpdGlvbiBkZXB0aCAod2l0aCByZXNwZWN0IGZyb20gbGVhZiB0byByb290KSBpbiBhIGRpcmVjdGl2ZSBzdWItY2xhc3MgaW5oZXJpdGFuY2UgY2hhaW4uXG4gKi9cbmxldCBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiA9IDA7XG5cbi8qKlxuICogVG90YWwgY291bnQgb2YgaG93IG1hbnkgZGlyZWN0aXZlcyBhcmUgYSBwYXJ0IG9mIGFuIGluaGVyaXRhbmNlIGNoYWluLlxuICpcbiAqIFdoZW4gZGlyZWN0aXZlcyBhcmUgc3ViLWNsYXNzZWQgKGV4dGVuZGVkKSBmcm9tIG9uZSB0byBhbm90aGVyLCBBbmd1bGFyXG4gKiBuZWVkcyB0byBrZWVwIHRyYWNrIG9mIGV4YWN0bHkgaG93IG1hbnkgd2VyZSBlbmNvdW50ZXJlZCBzbyBpdCBjYW4gYWNjdXJhdGVseVxuICogZ2VuZXJhdGUgdGhlIG5leHQgZGlyZWN0aXZlIGlkIChvbmNlIHRoZSBuZXh0IGRpcmVjdGl2ZSBpZCBpcyB2aXNpdGVkKS5cbiAqIE5vcm1hbGx5IHRoZSBuZXh0IGRpcmVjdGl2ZSBpZCBqdXN0IGEgc2luZ2xlIGluY3JlbWVudGVkIHZhbHVlIGZyb20gdGhlXG4gKiBwcmV2aW91cyBvbmUsIGhvd2V2ZXIsIGlmIHRoZSBwcmV2aW91cyBkaXJlY3RpdmUgaXMgYSBwYXJ0IG9mIGFuIGluaGVyaXRhbmNlXG4gKiBjaGFpbiAoYSBzZXJpZXMgb2Ygc3ViLWNsYXNzZWQgZGlyZWN0aXZlcykgdGhlbiB0aGUgaW5jcmVtZW50ZWQgdmFsdWUgbXVzdFxuICogYWxzbyB0YWtlIGludG8gYWNjb3VudCB0aGUgdG90YWwgYW1vdW50IG9mIHN1Yi1jbGFzc2VkIHZhbHVlcy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB2YWx1ZSByZXNldHMgYmFjayB0byB6ZXJvIG9uY2UgdGhlIG5leHQgZGlyZWN0aXZlIGlzXG4gKiB2aXNpdGVkICh3aGVuIGBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZGAgb3IgYHNldEFjdGl2ZUhvc3RFbGVtZW50YFxuICogaXMgY2FsbGVkKS5cbiAqL1xubGV0IGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPSAwO1xuXG4vKipcbiAqIFNldHMgdGhlIGFjdGl2ZSBkaXJlY3RpdmUgaG9zdCBlbGVtZW50IGFuZCByZXNldHMgdGhlIGRpcmVjdGl2ZSBpZCB2YWx1ZVxuICogKHdoZW4gdGhlIHByb3ZpZGVkIGVsZW1lbnRJbmRleCB2YWx1ZSBoYXMgY2hhbmdlZCkuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRJbmRleCB0aGUgZWxlbWVudCBpbmRleCB2YWx1ZSBmb3IgdGhlIGhvc3QgZWxlbWVudCB3aGVyZVxuICogICAgICAgICAgICAgICAgICAgICB0aGUgZGlyZWN0aXZlL2NvbXBvbmVudCBpbnN0YW5jZSBsaXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbCkge1xuICBpZiAoX3NlbGVjdGVkSW5kZXggIT09IGVsZW1lbnRJbmRleCkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoZWxlbWVudEluZGV4ID09IG51bGwgPyAtMSA6IGVsZW1lbnRJbmRleCk7XG4gICAgYWN0aXZlRGlyZWN0aXZlSWQgPSBlbGVtZW50SW5kZXggPT0gbnVsbCA/IDAgOiBNSU5fRElSRUNUSVZFX0lEO1xuICAgIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uID0gMDtcbiAgICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgaWQgdmFsdWUgb2YgdGhlIGN1cnJlbnQgZGlyZWN0aXZlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgYW4gZWxlbWVudCB0aGF0IGhhcyB0d28gZGlyZWN0aXZlcyBvbiBpdDpcbiAqIDxkaXYgZGlyLW9uZSBkaXItdHdvPjwvZGl2PlxuICpcbiAqIGRpck9uZS0+aG9zdEJpbmRpbmdzKCkgKGlkID09IDEpXG4gKiBkaXJUd28tPmhvc3RCaW5kaW5ncygpIChpZCA9PSAyKVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgZGlyZWN0aXZlIGlkIHZhbHVlcyBhcmUgc3BlY2lmaWMgdG8gYW4gZWxlbWVudCAodGhpcyBtZWFucyB0aGF0XG4gKiB0aGUgc2FtZSBpZCB2YWx1ZSBjb3VsZCBiZSBwcmVzZW50IG9uIGFub3RoZXIgZWxlbWVudCB3aXRoIGEgY29tcGxldGVseVxuICogZGlmZmVyZW50IHNldCBvZiBkaXJlY3RpdmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkge1xuICByZXR1cm4gYWN0aXZlRGlyZWN0aXZlSWQ7XG59XG5cbi8qKlxuICogSW5jcmVtZW50cyB0aGUgY3VycmVudCBkaXJlY3RpdmUgaWQgdmFsdWUuXG4gKlxuICogRm9yIGV4YW1wbGUgd2UgaGF2ZSBhbiBlbGVtZW50IHRoYXQgaGFzIHR3byBkaXJlY3RpdmVzIG9uIGl0OlxuICogPGRpdiBkaXItb25lIGRpci10d28+PC9kaXY+XG4gKlxuICogZGlyT25lLT5ob3N0QmluZGluZ3MoKSAoaW5kZXggPSAxKVxuICogLy8gaW5jcmVtZW50XG4gKiBkaXJUd28tPmhvc3RCaW5kaW5ncygpIChpbmRleCA9IDIpXG4gKlxuICogRGVwZW5kaW5nIG9uIHdoZXRoZXIgb3Igbm90IGEgcHJldmlvdXMgZGlyZWN0aXZlIGhhZCBhbnkgaW5oZXJpdGVkXG4gKiBkaXJlY3RpdmVzIHByZXNlbnQsIHRoYXQgdmFsdWUgd2lsbCBiZSBpbmNyZW1lbnRlZCBpbiBhZGRpdGlvblxuICogdG8gdGhlIGlkIGp1bXBpbmcgdXAgYnkgb25lLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgZGlyZWN0aXZlIGlkIHZhbHVlcyBhcmUgc3BlY2lmaWMgdG8gYW4gZWxlbWVudCAodGhpcyBtZWFucyB0aGF0XG4gKiB0aGUgc2FtZSBpZCB2YWx1ZSBjb3VsZCBiZSBwcmVzZW50IG9uIGFub3RoZXIgZWxlbWVudCB3aXRoIGEgY29tcGxldGVseVxuICogZGlmZmVyZW50IHNldCBvZiBkaXJlY3RpdmVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCkge1xuICBhY3RpdmVEaXJlY3RpdmVJZCArPSAxICsgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodDtcblxuICAvLyBiZWNhdXNlIHdlIGFyZSBkZWFsaW5nIHdpdGggYSBuZXcgZGlyZWN0aXZlIHRoaXNcbiAgLy8gbWVhbnMgd2UgaGF2ZSBleGl0ZWQgb3V0IG9mIHRoZSBpbmhlcml0YW5jZSBjaGFpblxuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiA9IDA7XG4gIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQgPSAwO1xufVxuXG4vKipcbiAqIFNldCB0aGUgY3VycmVudCBzdXBlciBjbGFzcyAocmV2ZXJzZSBpbmhlcml0YW5jZSkgcG9zaXRpb24gZGVwdGggZm9yIGEgZGlyZWN0aXZlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgdHdvIGRpcmVjdGl2ZXM6IENoaWxkIGFuZCBPdGhlciAoYnV0IENoaWxkIGlzIGEgc3ViLWNsYXNzIG9mIFBhcmVudClcbiAqIDxkaXYgY2hpbGQtZGlyIG90aGVyLWRpcj48L2Rpdj5cbiAqXG4gKiAvLyBpbmNyZW1lbnRcbiAqIHBhcmVudEluc3RhbmNlLT5ob3N0QmluZGluZ3MoKSAoZGVwdGggPSAxKVxuICogLy8gZGVjcmVtZW50XG4gKiBjaGlsZEluc3RhbmNlLT5ob3N0QmluZGluZ3MoKSAoZGVwdGggPSAwKVxuICogb3RoZXJJbnN0YW5jZS0+aG9zdEJpbmRpbmdzKCkgKGRlcHRoID0gMCBiL2MgaXQncyBhIGRpZmZlcmVudCBkaXJlY3RpdmUpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24oZGVsdGE6IG51bWJlcikge1xuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiArPSBkZWx0YTtcblxuICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBoZWlnaHQgdmFsdWUgc28gdGhhdCB3aGVuIHRoZSBuZXh0IGRpcmVjdGl2ZSBpcyB2aXNpdGVkXG4gIC8vIHRoZW4gQW5ndWxhciBrbm93cyB0byBnZW5lcmF0ZSBhIG5ldyBkaXJlY3RpdmUgaWQgdmFsdWUgd2hpY2ggaGFzIHRha2VuIGludG9cbiAgLy8gYWNjb3VudCBob3cgbWFueSBzdWItY2xhc3MgZGlyZWN0aXZlcyB3ZXJlIGEgcGFydCBvZiB0aGUgcHJldmlvdXMgZGlyZWN0aXZlLlxuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID1cbiAgICAgIE1hdGgubWF4KGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQsIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IHN1cGVyIGNsYXNzIChyZXZlcnNlIGluaGVyaXRhbmNlKSBkZXB0aCBmb3IgYSBkaXJlY3RpdmUuXG4gKlxuICogVGhpcyBpcyBkZXNpZ25lZCB0byBoZWxwIGluc3RydWN0aW9uIGNvZGUgZGlzdGluZ3Vpc2ggZGlmZmVyZW50IGhvc3RCaW5kaW5nc1xuICogY2FsbHMgZnJvbSBlYWNoIG90aGVyIHdoZW4gYSBkaXJlY3RpdmUgaGFzIGV4dGVuZGVkIGZyb20gYW5vdGhlciBkaXJlY3RpdmUuXG4gKiBOb3JtYWxseSB1c2luZyB0aGUgZGlyZWN0aXZlIGlkIHZhbHVlIGlzIGVub3VnaCwgYnV0IHdpdGggdGhlIGNhc2VcbiAqIG9mIHBhcmVudC9zdWItY2xhc3MgZGlyZWN0aXZlIGluaGVyaXRhbmNlIG1vcmUgaW5mb3JtYXRpb24gaXMgcmVxdWlyZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdgIGZ1bmN0aW9ucyBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCkge1xuICByZXR1cm4gYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb247XG59XG5cbi8qKlxuICogUmVzdG9yZXMgYGNvbnRleHRWaWV3RGF0YWAgdG8gdGhlIGdpdmVuIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIGdldEN1cnJlbnRWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gdmlld1RvUmVzdG9yZSBUaGUgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlIHRvIHJlc3RvcmUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UcmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkIGFuZCB0cmFjayBxdWVyeSByZXN1bHRzLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGU6IFROb2RlKSB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKHZpZXcpO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgbFZpZXcgPSB2aWV3O1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAqL1xubGV0IGlzUGFyZW50OiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXNQYXJlbnQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGlzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNQYXJlbnQodmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaXNQYXJlbnQgPSB2YWx1ZTtcbn1cblxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NyZWF0aW9uTW9kZSh2aWV3OiBMVmlldyA9IGxWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IGxWaWV3OiBMVmlldztcblxuLyoqXG4gKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAqXG4gKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICovXG5sZXQgY29udGV4dExWaWV3OiBMVmlldyA9IG51bGwgITtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHRMVmlldygpOiBMVmlldyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNvbnRleHRMVmlldztcbn1cblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVja05vQ2hhbmdlc01vZGUobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSBtb2RlO1xufVxuXG4vKipcbiAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICovXG5sZXQgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyID0gLTE7XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgcmV0dXJuIGJpbmRpbmdSb290SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdCh2YWx1ZTogbnVtYmVyKSB7XG4gIGJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGluZGV4IG9mIGEgVmlldyBvciBDb250ZW50IFF1ZXJ5IHdoaWNoIG5lZWRzIHRvIGJlIHByb2Nlc3NlZCBuZXh0LlxuICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gKi9cbmxldCBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnRRdWVyeUluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFF1ZXJ5SW5kZXgodmFsdWU6IG51bWJlcik6IHZvaWQge1xuICBjdXJyZW50UXVlcnlJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgc3RhdGUgd2l0aCBhIG5ldyBzdGF0ZS5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgc3RhdGUgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgc3RhdGUgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGhvc3QgRWxlbWVudCB0byB3aGljaCB0aGUgVmlldyBpcyBhIGNoaWxkIG9mXG4gKiBAcmV0dXJucyB0aGUgcHJldmlvdXMgc3RhdGU7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlclZpZXcobmV3VmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQobmV3Vmlldyk7XG4gIGNvbnN0IG9sZFZpZXcgPSBsVmlldztcbiAgaWYgKG5ld1ZpZXcpIHtcbiAgICBjb25zdCB0VmlldyA9IG5ld1ZpZXdbVFZJRVddO1xuICAgIGJpbmRpbmdSb290SW5kZXggPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgbFZpZXcgPSBjb250ZXh0TFZpZXcgPSBuZXdWaWV3O1xuICByZXR1cm4gb2xkVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0TFZpZXcgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmIChpc0NyZWF0aW9uTW9kZShsVmlldykpIHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgICBsVmlldywgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY2hlY2tOb0NoYW5nZXNNb2RlLFxuICAgICAgICAgIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4sIHVuZGVmaW5lZCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFZpZXdzIGFyZSBjbGVhbiBhbmQgaW4gdXBkYXRlIG1vZGUgYWZ0ZXIgYmVpbmcgY2hlY2tlZCwgc28gdGhlc2UgYml0cyBhcmUgY2xlYXJlZFxuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgICAgbFZpZXdbQklORElOR19JTkRFWF0gPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgICB9XG4gIH1cbiAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQobnVsbCk7XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxubGV0IF9zZWxlY3RlZEluZGV4ID0gLTE7XG5cbi8qKlxuICogR2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gX3NlbGVjdGVkSW5kZXg7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcblxuICAvLyByZW1vdmUgdGhlIHN0eWxpbmcgY29udGV4dCBmcm9tIHRoZSBjYWNoZVxuICAvLyBiZWNhdXNlIHdlIGFyZSBub3cgb24gYSBkaWZmZXJlbnQgZWxlbWVudFxuICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChudWxsKTtcbn1cblxuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UbmFtZXNwYWNlTWF0aE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyBubyBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlG5hbWVzcGFjZUhUTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBfY3VycmVudE5hbWVzcGFjZTtcbn1cbiJdfQ==