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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUdyQyxPQUFPLEVBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQXNELEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdJLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzdFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSXpEOzs7R0FHRztBQUNILElBQUksaUJBQTJCLENBQUM7QUFFaEMsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxxRkFBcUY7SUFDckYsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLGlCQUFpQixFQUFFLENBQUM7QUFDdEIsQ0FBQztBQUVELElBQUksbUJBQW1CLEdBQTZDLElBQUksQ0FBQztBQUV6RSxNQUFNLFVBQVUsc0JBQXNCO0lBQ3BDLHFGQUFxRjtJQUNyRixPQUFPLG1CQUFtQixDQUFDO0FBQzdCLENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsR0FBK0M7SUFDcEYsbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0FBQzVCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFD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QztBQUV4Qjs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUV2Qix3Q0FBd0M7SUFDeEMsK0JBQStCO0lBQy9CLGlCQUFpQixFQUFFLENBQUM7QUFDdEIsQ0FBQztBQUdELElBQUksaUJBQWlCLEdBQWdCLElBQUksQ0FBQztBQUUxQzs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGNBQWM7SUFDNUIsaUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7QUFDbkQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCO0lBQy9CLGlCQUFpQixHQUFHLGdDQUFnQyxDQUFDO0FBQ3ZELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxlQUFlO0lBQzdCLHFCQUFxQixFQUFFLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0FBQzNCLENBQUM7QUFFRCxNQUFNLFVBQVUsWUFBWTtJQUMxQixPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUM7QUFFRCxJQUFJLGlCQUF1QyxDQUFDO0FBQzVDLE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxTQUFpQztJQUN4RSxpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDaEMsQ0FBQztBQUVELE1BQU0sVUFBVSx3QkFBd0I7SUFDdEMsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Jlc2V0QWxsU3R5bGluZ1N0YXRlLCByZXNldFN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdHlsaW5nX25leHQvc3RhdGUnO1xuaW1wb3J0IHtyZXNldFByZU9yZGVySG9va0ZsYWdzfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIFN0b3JlIHRoZSBlbGVtZW50IGRlcHRoIGNvdW50LiBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIHJvb3QgZWxlbWVudHMgb2YgdGhlIHRlbXBsYXRlXG4gKiBzbyB0aGF0IHdlIGNhbiB0aGFuIGF0dGFjaCBgTFZpZXdgIHRvIG9ubHkgdGhvc2UgZWxlbWVudHMuXG4gKi9cbmxldCBlbGVtZW50RGVwdGhDb3VudCAhOiBudW1iZXI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gZWxlbWVudERlcHRoQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBlbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxubGV0IGN1cnJlbnREaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+fG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERpcmVjdGl2ZURlZigpOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3VycmVudERpcmVjdGl2ZURlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnREaXJlY3RpdmVEZWYoZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT58IG51bGwpOiB2b2lkIHtcbiAgY3VycmVudERpcmVjdGl2ZURlZiA9IGRlZjtcbn1cblxuLyoqXG4gKiBTdG9yZXMgd2hldGhlciBkaXJlY3RpdmVzIHNob3VsZCBiZSBtYXRjaGVkIHRvIGVsZW1lbnRzLlxuICpcbiAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoYW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZvcm0gbWF0Y2hpbmdcbiAqIGRpcmVjdGl2ZXMgb24gY2hpbGRyZW4gb2YgdGhhdCBlbGVtZW50LlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmxldCBiaW5kaW5nc0VuYWJsZWQgITogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgYmluZGluZ3NFbmFibGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBEaXNhYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudC5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gybXJtWRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIMm1ybVlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRpc2FibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgYmluZGluZ3NFbmFibGVkID0gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlldygpOiBMVmlldyB7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGFzIHRoZSBzdGFydGluZyBkaXJlY3RpdmUgaWQgdmFsdWUuXG4gKlxuICogQWxsIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgaW5jcmVtZW50ZWQgZnJvbSB0aGlzIHZhbHVlIG9ud2FyZHMuXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIHZhbHVlIGlzIGAxYCBpbnN0ZWFkIG9mIGAwYCBpcyBiZWNhdXNlIHRoZSBgMGBcbiAqIHZhbHVlIGlzIHJlc2VydmVkIGZvciB0aGUgdGVtcGxhdGUuXG4gKi9cbmNvbnN0IE1JTl9ESVJFQ1RJVkVfSUQgPSAxO1xuXG5sZXQgYWN0aXZlRGlyZWN0aXZlSWQgPSBNSU5fRElSRUNUSVZFX0lEO1xuXG4vKipcbiAqIFBvc2l0aW9uIGRlcHRoICh3aXRoIHJlc3BlY3QgZnJvbSBsZWFmIHRvIHJvb3QpIGluIGEgZGlyZWN0aXZlIHN1Yi1jbGFzcyBpbmhlcml0YW5jZSBjaGFpbi5cbiAqL1xubGV0IGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uID0gMDtcblxuLyoqXG4gKiBUb3RhbCBjb3VudCBvZiBob3cgbWFueSBkaXJlY3RpdmVzIGFyZSBhIHBhcnQgb2YgYW4gaW5oZXJpdGFuY2UgY2hhaW4uXG4gKlxuICogV2hlbiBkaXJlY3RpdmVzIGFyZSBzdWItY2xhc3NlZCAoZXh0ZW5kZWQpIGZyb20gb25lIHRvIGFub3RoZXIsIEFuZ3VsYXJcbiAqIG5lZWRzIHRvIGtlZXAgdHJhY2sgb2YgZXhhY3RseSBob3cgbWFueSB3ZXJlIGVuY291bnRlcmVkIHNvIGl0IGNhbiBhY2N1cmF0ZWx5XG4gKiBnZW5lcmF0ZSB0aGUgbmV4dCBkaXJlY3RpdmUgaWQgKG9uY2UgdGhlIG5leHQgZGlyZWN0aXZlIGlkIGlzIHZpc2l0ZWQpLlxuICogTm9ybWFsbHkgdGhlIG5leHQgZGlyZWN0aXZlIGlkIGp1c3QgYSBzaW5nbGUgaW5jcmVtZW50ZWQgdmFsdWUgZnJvbSB0aGVcbiAqIHByZXZpb3VzIG9uZSwgaG93ZXZlciwgaWYgdGhlIHByZXZpb3VzIGRpcmVjdGl2ZSBpcyBhIHBhcnQgb2YgYW4gaW5oZXJpdGFuY2VcbiAqIGNoYWluIChhIHNlcmllcyBvZiBzdWItY2xhc3NlZCBkaXJlY3RpdmVzKSB0aGVuIHRoZSBpbmNyZW1lbnRlZCB2YWx1ZSBtdXN0XG4gKiBhbHNvIHRha2UgaW50byBhY2NvdW50IHRoZSB0b3RhbCBhbW91bnQgb2Ygc3ViLWNsYXNzZWQgdmFsdWVzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHZhbHVlIHJlc2V0cyBiYWNrIHRvIHplcm8gb25jZSB0aGUgbmV4dCBkaXJlY3RpdmUgaXNcbiAqIHZpc2l0ZWQgKHdoZW4gYGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkYCBvciBgc2V0QWN0aXZlSG9zdEVsZW1lbnRgXG4gKiBpcyBjYWxsZWQpLlxuICovXG5sZXQgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9IDA7XG5cbi8qKlxuICogU2V0cyB0aGUgYWN0aXZlIGRpcmVjdGl2ZSBob3N0IGVsZW1lbnQgYW5kIHJlc2V0cyB0aGUgZGlyZWN0aXZlIGlkIHZhbHVlXG4gKiAod2hlbiB0aGUgcHJvdmlkZWQgZWxlbWVudEluZGV4IHZhbHVlIGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudEluZGV4IHRoZSBlbGVtZW50IGluZGV4IHZhbHVlIGZvciB0aGUgaG9zdCBlbGVtZW50IHdoZXJlXG4gKiAgICAgICAgICAgICAgICAgICAgIHRoZSBkaXJlY3RpdmUvY29tcG9uZW50IGluc3RhbmNlIGxpdmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRBY3RpdmVIb3N0RWxlbWVudChlbGVtZW50SW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsKSB7XG4gIGlmIChfc2VsZWN0ZWRJbmRleCAhPT0gZWxlbWVudEluZGV4KSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXggPT09IG51bGwgPyAtMSA6IGVsZW1lbnRJbmRleCk7XG4gICAgYWN0aXZlRGlyZWN0aXZlSWQgPSBlbGVtZW50SW5kZXggPT09IG51bGwgPyAwIDogTUlOX0RJUkVDVElWRV9JRDtcbiAgICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbiA9IDA7XG4gICAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9IDA7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IGlkIHZhbHVlIG9mIHRoZSBjdXJyZW50IGRpcmVjdGl2ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIGFuIGVsZW1lbnQgdGhhdCBoYXMgdHdvIGRpcmVjdGl2ZXMgb24gaXQ6XG4gKiA8ZGl2IGRpci1vbmUgZGlyLXR3bz48L2Rpdj5cbiAqXG4gKiBkaXJPbmUtPmhvc3RCaW5kaW5ncygpIChpZCA9PSAxKVxuICogZGlyVHdvLT5ob3N0QmluZGluZ3MoKSAoaWQgPT0gMilcbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IGRpcmVjdGl2ZSBpZCB2YWx1ZXMgYXJlIHNwZWNpZmljIHRvIGFuIGVsZW1lbnQgKHRoaXMgbWVhbnMgdGhhdFxuICogdGhlIHNhbWUgaWQgdmFsdWUgY291bGQgYmUgcHJlc2VudCBvbiBhbm90aGVyIGVsZW1lbnQgd2l0aCBhIGNvbXBsZXRlbHlcbiAqIGRpZmZlcmVudCBzZXQgb2YgZGlyZWN0aXZlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpIHtcbiAgcmV0dXJuIGFjdGl2ZURpcmVjdGl2ZUlkO1xufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIGN1cnJlbnQgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgYW4gZWxlbWVudCB0aGF0IGhhcyB0d28gZGlyZWN0aXZlcyBvbiBpdDpcbiAqIDxkaXYgZGlyLW9uZSBkaXItdHdvPjwvZGl2PlxuICpcbiAqIGRpck9uZS0+aG9zdEJpbmRpbmdzKCkgKGluZGV4ID0gMSlcbiAqIC8vIGluY3JlbWVudFxuICogZGlyVHdvLT5ob3N0QmluZGluZ3MoKSAoaW5kZXggPSAyKVxuICpcbiAqIERlcGVuZGluZyBvbiB3aGV0aGVyIG9yIG5vdCBhIHByZXZpb3VzIGRpcmVjdGl2ZSBoYWQgYW55IGluaGVyaXRlZFxuICogZGlyZWN0aXZlcyBwcmVzZW50LCB0aGF0IHZhbHVlIHdpbGwgYmUgaW5jcmVtZW50ZWQgaW4gYWRkaXRpb25cbiAqIHRvIHRoZSBpZCBqdW1waW5nIHVwIGJ5IG9uZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IGRpcmVjdGl2ZSBpZCB2YWx1ZXMgYXJlIHNwZWNpZmljIHRvIGFuIGVsZW1lbnQgKHRoaXMgbWVhbnMgdGhhdFxuICogdGhlIHNhbWUgaWQgdmFsdWUgY291bGQgYmUgcHJlc2VudCBvbiBhbm90aGVyIGVsZW1lbnQgd2l0aCBhIGNvbXBsZXRlbHlcbiAqIGRpZmZlcmVudCBzZXQgb2YgZGlyZWN0aXZlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpIHtcbiAgYWN0aXZlRGlyZWN0aXZlSWQgKz0gMSArIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQ7XG5cbiAgLy8gYmVjYXVzZSB3ZSBhcmUgZGVhbGluZyB3aXRoIGEgbmV3IGRpcmVjdGl2ZSB0aGlzXG4gIC8vIG1lYW5zIHdlIGhhdmUgZXhpdGVkIG91dCBvZiB0aGUgaW5oZXJpdGFuY2UgY2hhaW5cbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gPSAwO1xuICBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0ID0gMDtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGN1cnJlbnQgc3VwZXIgY2xhc3MgKHJldmVyc2UgaW5oZXJpdGFuY2UpIHBvc2l0aW9uIGRlcHRoIGZvciBhIGRpcmVjdGl2ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIHR3byBkaXJlY3RpdmVzOiBDaGlsZCBhbmQgT3RoZXIgKGJ1dCBDaGlsZCBpcyBhIHN1Yi1jbGFzcyBvZiBQYXJlbnQpXG4gKiA8ZGl2IGNoaWxkLWRpciBvdGhlci1kaXI+PC9kaXY+XG4gKlxuICogLy8gaW5jcmVtZW50XG4gKiBwYXJlbnRJbnN0YW5jZS0+aG9zdEJpbmRpbmdzKCkgKGRlcHRoID0gMSlcbiAqIC8vIGRlY3JlbWVudFxuICogY2hpbGRJbnN0YW5jZS0+aG9zdEJpbmRpbmdzKCkgKGRlcHRoID0gMClcbiAqIG90aGVySW5zdGFuY2UtPmhvc3RCaW5kaW5ncygpIChkZXB0aCA9IDAgYi9jIGl0J3MgYSBkaWZmZXJlbnQgZGlyZWN0aXZlKVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uKGRlbHRhOiBudW1iZXIpIHtcbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoUG9zaXRpb24gKz0gZGVsdGE7XG5cbiAgLy8gd2Uga2VlcCB0cmFjayBvZiB0aGUgaGVpZ2h0IHZhbHVlIHNvIHRoYXQgd2hlbiB0aGUgbmV4dCBkaXJlY3RpdmUgaXMgdmlzaXRlZFxuICAvLyB0aGVuIEFuZ3VsYXIga25vd3MgdG8gZ2VuZXJhdGUgYSBuZXcgZGlyZWN0aXZlIGlkIHZhbHVlIHdoaWNoIGhhcyB0YWtlbiBpbnRvXG4gIC8vIGFjY291bnQgaG93IG1hbnkgc3ViLWNsYXNzIGRpcmVjdGl2ZXMgd2VyZSBhIHBhcnQgb2YgdGhlIHByZXZpb3VzIGRpcmVjdGl2ZS5cbiAgYWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCA9XG4gICAgICBNYXRoLm1heChhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0LCBhY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGhQb3NpdGlvbik7XG59XG5cbi8qKlxuICogUmV0dXJucyBoZSBjdXJyZW50IGRlcHRoIG9mIHRoZSBzdXBlci9zdWIgY2xhc3MgaW5oZXJpdGFuY2UgY2hhaW4uXG4gKlxuICogVGhpcyB3aWxsIHJldHVybiBob3cgbWFueSBpbmhlcml0ZWQgZGlyZWN0aXZlL2NvbXBvbmVudCBjbGFzc2VzXG4gKiBleGlzdCBpbiB0aGUgY3VycmVudCBjaGFpbi5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBARGlyZWN0aXZlKHsgc2VsZWN0b3I6ICdbc3VwZXItZGlyXScgfSlcbiAqIGNsYXNzIFN1cGVyRGlyIHt9XG4gKlxuICogQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW3N1Yi1kaXJdJyB9KVxuICogY2xhc3MgU3ViRGlyIGV4dGVuZHMgU3VwZXJEaXIge31cbiAqXG4gKiAvLyBpZiBgPGRpdiBzdWItZGlyPmAgaXMgdXNlZCB0aGVuIHRoZSBzdXBlciBjbGFzcyBoZWlnaHQgaXMgYDFgXG4gKiAvLyBpZiBgPGRpdiBzdXBlci1kaXI+YCBpcyB1c2VkIHRoZW4gdGhlIHN1cGVyIGNsYXNzIGhlaWdodCBpcyBgMGBcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCgpIHtcbiAgcmV0dXJuIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBzdXBlciBjbGFzcyAocmV2ZXJzZSBpbmhlcml0YW5jZSkgZGVwdGggZm9yIGEgZGlyZWN0aXZlLlxuICpcbiAqIFRoaXMgaXMgZGVzaWduZWQgdG8gaGVscCBpbnN0cnVjdGlvbiBjb2RlIGRpc3Rpbmd1aXNoIGRpZmZlcmVudCBob3N0QmluZGluZ3NcbiAqIGNhbGxzIGZyb20gZWFjaCBvdGhlciB3aGVuIGEgZGlyZWN0aXZlIGhhcyBleHRlbmRlZCBmcm9tIGFub3RoZXIgZGlyZWN0aXZlLlxuICogTm9ybWFsbHkgdXNpbmcgdGhlIGRpcmVjdGl2ZSBpZCB2YWx1ZSBpcyBlbm91Z2gsIGJ1dCB3aXRoIHRoZSBjYXNlXG4gKiBvZiBwYXJlbnQvc3ViLWNsYXNzIGRpcmVjdGl2ZSBpbmhlcml0YW5jZSBtb3JlIGluZm9ybWF0aW9uIGlzIHJlcXVpcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nYCBmdW5jdGlvbnMgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCgpIHtcbiAgcmV0dXJuIGFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aFBvc2l0aW9uO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkIGFuZCB0cmFjayBxdWVyeSByZXN1bHRzLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGU6IFROb2RlLCBfaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGlzUGFyZW50ID0gX2lzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKHZpZXcpO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgbFZpZXcgPSB2aWV3O1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAqL1xubGV0IGlzUGFyZW50OiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXNQYXJlbnQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGlzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNOb3RQYXJlbnQoKTogdm9pZCB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0SXNQYXJlbnQoKTogdm9pZCB7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbn1cblxuXG4vKiogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NyZWF0aW9uTW9kZSh2aWV3OiBMVmlldyA9IGxWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IGxWaWV3OiBMVmlldztcblxuLyoqXG4gKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAqXG4gKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICovXG5sZXQgY29udGV4dExWaWV3OiBMVmlldyA9IG51bGwgITtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHRMVmlldygpOiBMVmlldyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNvbnRleHRMVmlldztcbn1cblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDaGVja05vQ2hhbmdlc01vZGUobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSBtb2RlO1xufVxuXG4vKipcbiAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICovXG5sZXQgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyID0gLTE7XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgcmV0dXJuIGJpbmRpbmdSb290SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdCh2YWx1ZTogbnVtYmVyKSB7XG4gIGJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDdXJyZW50IGluZGV4IG9mIGEgVmlldyBvciBDb250ZW50IFF1ZXJ5IHdoaWNoIG5lZWRzIHRvIGJlIHByb2Nlc3NlZCBuZXh0LlxuICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gKi9cbmxldCBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnRRdWVyeUluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFF1ZXJ5SW5kZXgodmFsdWU6IG51bWJlcik6IHZvaWQge1xuICBjdXJyZW50UXVlcnlJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgc3RhdGUgd2l0aCBhIG5ldyBzdGF0ZS5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgc3RhdGUgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgc3RhdGUgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGhvc3QgRWxlbWVudCB0byB3aGljaCB0aGUgVmlldyBpcyBhIGNoaWxkIG9mXG4gKiBAcmV0dXJucyB0aGUgcHJldmlvdXMgc3RhdGU7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlclZpZXcobmV3VmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQobmV3Vmlldyk7XG4gIGNvbnN0IG9sZFZpZXcgPSBsVmlldztcbiAgaWYgKG5ld1ZpZXcpIHtcbiAgICBjb25zdCB0VmlldyA9IG5ld1ZpZXdbVFZJRVddO1xuICAgIGJpbmRpbmdSb290SW5kZXggPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgbFZpZXcgPSBjb250ZXh0TFZpZXcgPSBuZXdWaWV3O1xuICByZXR1cm4gb2xkVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0TFZpZXcgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbiAgcmVzZXRBbGxTdHlsaW5nU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBzYWZlVG9SdW5Ib29rcyBXaGV0aGVyIHRoZSBydW50aW1lIGlzIGluIGEgc3RhdGUgd2hlcmUgcnVubmluZyBsaWZlY3ljbGUgaG9va3MgaXMgdmFsaWQuXG4gKiBUaGlzIGlzIG5vdCBhbHdheXMgdGhlIGNhc2UgKGZvciBleGFtcGxlLCB0aGUgYXBwbGljYXRpb24gbWF5IGhhdmUgY3Jhc2hlZCBhbmQgYGxlYXZlVmlld2AgaXNcbiAqIGJlaW5nIGV4ZWN1dGVkIHdoaWxlIHVud2luZGluZyB0aGUgY2FsbCBzdGFjaykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcsIHNhZmVUb1J1bkhvb2tzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gICAgICBzYWZlVG9SdW5Ib29rcyAmJiBleGVjdXRlSG9va3MoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbFZpZXcsIHRWaWV3LnZpZXdIb29rcywgdFZpZXcudmlld0NoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuLCB1bmRlZmluZWQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gICAgfVxuICB9XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxubGV0IF9zZWxlY3RlZEluZGV4ID0gLTE7XG5cbi8qKlxuICogR2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZEluZGV4KCkge1xuICByZXR1cm4gX3NlbGVjdGVkSW5kZXg7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgX3NlbGVjdGVkSW5kZXggPSBpbmRleDtcblxuICAvLyB3ZSBoYXZlIG5vdyBqdW1wZWQgdG8gYW5vdGhlciBlbGVtZW50XG4gIC8vIHRoZXJlZm9yZSB0aGUgc3RhdGUgaXMgc3RhbGVcbiAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbn1cblxuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTEludGVybmFsKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gX2N1cnJlbnROYW1lc3BhY2U7XG59XG5cbmxldCBfY3VycmVudFNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBfY3VycmVudFNhbml0aXplciA9IHNhbml0aXplcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpIHtcbiAgcmV0dXJuIF9jdXJyZW50U2FuaXRpemVyO1xufVxuIl19