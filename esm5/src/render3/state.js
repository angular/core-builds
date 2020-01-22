/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual } from '../util/assert';
import { assertLViewOrUndefined } from './assert';
import { CONTEXT, DECLARATION_VIEW, TVIEW } from './interfaces/view';
export var instructionState = {
    lFrame: createLFrame(null),
    bindingsEnabled: true,
    elementExitFn: null,
    checkNoChangesMode: false,
};
export function getElementDepthCount() {
    return instructionState.lFrame.elementDepthCount;
}
export function increaseElementDepthCount() {
    instructionState.lFrame.elementDepthCount++;
}
export function decreaseElementDepthCount() {
    instructionState.lFrame.elementDepthCount--;
}
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
 * @codeGenApi
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
 * @codeGenApi
 */
export function ɵɵdisableBindings() {
    instructionState.bindingsEnabled = false;
}
/**
 * Return the current LView.
 *
 * The return value can be `null` if the method is called outside of template. This can happen if
 * directive is instantiated by module injector (rather than by node injector.)
 */
export function getLView() {
    // TODO(misko): the return value should be `LView|null` but doing so breaks a lot of code.
    var lFrame = instructionState.lFrame;
    return lFrame === null ? null : lFrame.lView;
}
/**
 * Determines whether or not a flag is currently set for the active element.
 */
export function hasActiveElementFlag(flag) {
    return (instructionState.lFrame.selectedIndex & flag) === flag;
}
/**
 * Sets a flag is for the active element.
 */
function setActiveElementFlag(flag) {
    instructionState.lFrame.selectedIndex |= flag;
}
/**
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 */
export function setActiveHostElement(elementIndex) {
    if (hasActiveElementFlag(1 /* RunExitFn */)) {
        executeElementExitFn();
    }
    setSelectedIndex(elementIndex === null ? -1 : elementIndex);
    instructionState.lFrame.activeDirectiveId = 0;
}
export function executeElementExitFn() {
    instructionState.elementExitFn();
    instructionState.lFrame.selectedIndex &= ~1 /* RunExitFn */;
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
 * @param fn
 */
export function setElementExitFn(fn) {
    setActiveElementFlag(1 /* RunExitFn */);
    if (instructionState.elementExitFn === null) {
        instructionState.elementExitFn = fn;
    }
    ngDevMode &&
        assertEqual(instructionState.elementExitFn, fn, 'Expecting to always get the same function');
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
    return instructionState.lFrame.activeDirectiveId;
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
    // Each directive gets a uniqueId value that is the same for both
    // create and update calls when the hostBindings function is called. The
    // directive uniqueId is not set anywhere--it is just incremented between
    // each hostBindings call and is useful for helping instruction code
    // uniquely determine which directive is currently active when executed.
    instructionState.lFrame.activeDirectiveId += 1;
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
    instructionState.lFrame.contextLView = viewToRestore;
}
export function getPreviousOrParentTNode() {
    return instructionState.lFrame.previousOrParentTNode;
}
export function setPreviousOrParentTNode(tNode, _isParent) {
    instructionState.lFrame.previousOrParentTNode = tNode;
    instructionState.lFrame.isParent = _isParent;
}
export function getIsParent() {
    return instructionState.lFrame.isParent;
}
export function setIsNotParent() {
    instructionState.lFrame.isParent = false;
}
export function setIsParent() {
    instructionState.lFrame.isParent = true;
}
export function getContextLView() {
    return instructionState.lFrame.contextLView;
}
export function getCheckNoChangesMode() {
    return instructionState.checkNoChangesMode;
}
export function setCheckNoChangesMode(mode) {
    instructionState.checkNoChangesMode = mode;
}
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
export function getBindingRoot() {
    var lFrame = instructionState.lFrame;
    var index = lFrame.bindingRootIndex;
    if (index === -1) {
        var lView = lFrame.lView;
        index = lFrame.bindingRootIndex = lView[TVIEW].bindingStartIndex;
    }
    return index;
}
export function getBindingIndex() {
    return instructionState.lFrame.bindingIndex;
}
export function setBindingIndex(value) {
    return instructionState.lFrame.bindingIndex = value;
}
export function nextBindingIndex() {
    return instructionState.lFrame.bindingIndex++;
}
export function incrementBindingIndex(count) {
    var lFrame = instructionState.lFrame;
    var index = lFrame.bindingIndex;
    lFrame.bindingIndex = lFrame.bindingIndex + count;
    return index;
}
/**
 * Set a new binding root index so that host template functions can execute.
 *
 * Bindings inside the host template are 0 index. But because we don't know ahead of time
 * how many host bindings we have we can't pre-compute them. For this reason they are all
 * 0 index and we just shift the root so that they match next available location in the LView.
 * @param value
 */
export function setBindingRoot(value) {
    instructionState.lFrame.bindingRootIndex = value;
}
export function getCurrentQueryIndex() {
    return instructionState.lFrame.currentQueryIndex;
}
export function setCurrentQueryIndex(value) {
    instructionState.lFrame.currentQueryIndex = value;
}
/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 * @param newView
 * @param tNode
 */
export function enterDI(newView, tNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    var newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = tNode;
    newLFrame.lView = newView;
    if (ngDevMode) {
        // resetting for safety in dev mode only.
        newLFrame.isParent = DEV_MODE_VALUE;
        newLFrame.selectedIndex = DEV_MODE_VALUE;
        newLFrame.contextLView = DEV_MODE_VALUE;
        newLFrame.elementDepthCount = DEV_MODE_VALUE;
        newLFrame.currentNamespace = DEV_MODE_VALUE;
        newLFrame.currentSanitizer = DEV_MODE_VALUE;
        newLFrame.currentDirectiveDef = DEV_MODE_VALUE;
        newLFrame.activeDirectiveId = DEV_MODE_VALUE;
        newLFrame.bindingRootIndex = DEV_MODE_VALUE;
        newLFrame.currentQueryIndex = DEV_MODE_VALUE;
    }
}
var DEV_MODE_VALUE = 'Value indicating that DI is trying to read value which it should not need to know about.';
/**
 * This is a light weight version of the `leaveView` which is needed by the DI system.
 *
 * Because the implementation is same it is only an alias
 */
export var leaveDI = leaveView;
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New lView to become active
 * @param tNode Element to which the View is a child of
 * @returns the previously active lView;
 */
export function enterView(newView, tNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    var newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = tNode;
    newLFrame.isParent = true;
    newLFrame.lView = newView;
    newLFrame.selectedIndex = 0;
    newLFrame.contextLView = newView;
    newLFrame.elementDepthCount = 0;
    newLFrame.currentNamespace = null;
    newLFrame.currentSanitizer = null;
    newLFrame.currentDirectiveDef = null;
    newLFrame.activeDirectiveId = 0;
    newLFrame.bindingRootIndex = -1;
    newLFrame.bindingIndex = newView === null ? -1 : newView[TVIEW].bindingStartIndex;
    newLFrame.currentQueryIndex = 0;
}
/**
 * Allocates next free LFrame. This function tries to reuse the `LFrame`s to lower memory pressure.
 */
function allocLFrame() {
    var currentLFrame = instructionState.lFrame;
    var childLFrame = currentLFrame === null ? null : currentLFrame.child;
    var newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
    return newLFrame;
}
function createLFrame(parent) {
    var lFrame = {
        previousOrParentTNode: null,
        isParent: true,
        lView: null,
        selectedIndex: 0,
        contextLView: null,
        elementDepthCount: 0,
        currentNamespace: null,
        currentSanitizer: null,
        currentDirectiveDef: null,
        activeDirectiveId: 0,
        bindingRootIndex: -1,
        bindingIndex: -1,
        currentQueryIndex: 0,
        parent: parent,
        child: null,
    };
    parent !== null && (parent.child = lFrame); // link the new LFrame for reuse.
    return lFrame;
}
export function leaveViewProcessExit() {
    if (hasActiveElementFlag(1 /* RunExitFn */)) {
        executeElementExitFn();
    }
    leaveView();
}
export function leaveView() {
    instructionState.lFrame = instructionState.lFrame.parent;
}
export function nextContextImpl(level) {
    var contextLView = instructionState.lFrame.contextLView =
        walkUpViews(level, instructionState.lFrame.contextLView);
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
 * Gets the most recent index passed to {@link select}
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 */
export function getSelectedIndex() {
    return instructionState.lFrame.selectedIndex >> 1 /* Size */;
}
/**
 * Sets the most recent index passed to {@link select}
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 *
 * (Note that if an "exit function" was set earlier (via `setElementExitFn()`) then that will be
 * run if and when the provided `index` value is different from the current selected index value.)
 */
export function setSelectedIndex(index) {
    instructionState.lFrame.selectedIndex = index << 1 /* Size */;
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceSVG() {
    instructionState.lFrame.currentNamespace = 'http://www.w3.org/2000/svg';
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceMathML() {
    instructionState.lFrame.currentNamespace = 'http://www.w3.org/1998/MathML/';
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
    instructionState.lFrame.currentNamespace = null;
}
export function getNamespace() {
    return instructionState.lFrame.currentNamespace;
}
export function setCurrentStyleSanitizer(sanitizer) {
    instructionState.lFrame.currentSanitizer = sanitizer;
}
export function resetCurrentStyleSanitizer() {
    setCurrentStyleSanitizer(null);
}
export function getCurrentStyleSanitizer() {
    // TODO(misko): This should throw when there is no LView, but it turns out we can get here from
    // `NodeStyleDebug` hence we return `null`. This should be fixed
    var lFrame = instructionState.lFrame;
    return lFrame === null ? null : lFrame.currentSanitizer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR2hELE9BQU8sRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQTBCLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBa0szRixNQUFNLENBQUMsSUFBTSxnQkFBZ0IsR0FBcUI7SUFDaEQsTUFBTSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDMUIsZUFBZSxFQUFFLElBQUk7SUFDckIsYUFBYSxFQUFFLElBQUk7SUFDbkIsa0JBQWtCLEVBQUUsS0FBSztDQUMxQixDQUFDO0FBR0YsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztBQUNuRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUM5QyxDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUM5QyxDQUFDO0FBRUQsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxPQUFPLGdCQUFnQixDQUFDLGVBQWUsQ0FBQztBQUMxQyxDQUFDO0FBR0Q7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtCRztBQUNILE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsZ0JBQWdCLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztBQUMxQyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtCRztBQUNILE1BQU0sVUFBVSxpQkFBaUI7SUFDL0IsZ0JBQWdCLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUMzQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsUUFBUTtJQUN0QiwwRkFBMEY7SUFDMUYsSUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQ3ZDLE9BQU8sTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2pELENBQUM7QUFrQkQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsSUFBd0I7SUFDM0QsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDO0FBQ2pFLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsb0JBQW9CLENBQUMsSUFBd0I7SUFDcEQsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUM7QUFDaEQsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxZQUEyQjtJQUM5RCxJQUFJLG9CQUFvQixtQkFBOEIsRUFBRTtRQUN0RCxvQkFBb0IsRUFBRSxDQUFDO0tBQ3hCO0lBQ0QsZ0JBQWdCLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzVELGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDaEQsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsZ0JBQWdCLENBQUMsYUFBZSxFQUFFLENBQUM7SUFDbkMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGFBQWEsSUFBSSxrQkFBNkIsQ0FBQztBQUN6RSxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEVBQWM7SUFDN0Msb0JBQW9CLG1CQUE4QixDQUFDO0lBQ25ELElBQUksZ0JBQWdCLENBQUMsYUFBYSxLQUFLLElBQUksRUFBRTtRQUMzQyxnQkFBZ0IsQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO0tBQ3JDO0lBQ0QsU0FBUztRQUNMLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsRUFBRSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDbkcsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztBQUNuRCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCO0lBQ3hDLGlFQUFpRTtJQUNqRSx3RUFBd0U7SUFDeEUseUVBQXlFO0lBQ3pFLG9FQUFvRTtJQUNwRSx3RUFBd0U7SUFDeEUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQUMsYUFBOEI7SUFDMUQsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxhQUE2QixDQUFDO0FBQ3ZFLENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDO0FBQ3ZELENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsS0FBWSxFQUFFLFNBQWtCO0lBQ3ZFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7SUFDdEQsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFDL0MsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXO0lBQ3pCLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUMxQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWM7SUFDNUIsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDM0MsQ0FBQztBQUNELE1BQU0sVUFBVSxXQUFXO0lBQ3pCLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzFDLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZTtJQUM3QixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7QUFDOUMsQ0FBQztBQUVELE1BQU0sVUFBVSxxQkFBcUI7SUFDbkMsT0FBTyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQztBQUM3QyxDQUFDO0FBRUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLElBQWE7SUFDakQsZ0JBQWdCLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQzdDLENBQUM7QUFFRCxxRkFBcUY7QUFDckYsTUFBTSxVQUFVLGNBQWM7SUFDNUIsSUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQ3ZDLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztJQUNwQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNoQixJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzNCLEtBQUssR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLGlCQUFpQixDQUFDO0tBQ2xFO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWU7SUFDN0IsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO0FBQzlDLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQWE7SUFDM0MsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztBQUN0RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGdCQUFnQjtJQUM5QixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNoRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQWE7SUFDakQsSUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQ3ZDLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDbEMsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztJQUNsRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFhO0lBQzFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7QUFDbkQsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7QUFDbkQsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFhO0lBQ2hELGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDcEQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsT0FBTyxDQUFDLE9BQWMsRUFBRSxLQUFZO0lBQ2xELFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3QyxJQUFNLFNBQVMsR0FBRyxXQUFXLEVBQUUsQ0FBQztJQUNoQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO0lBQ3BDLFNBQVMsQ0FBQyxxQkFBcUIsR0FBRyxLQUFPLENBQUM7SUFDMUMsU0FBUyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7SUFDMUIsSUFBSSxTQUFTLEVBQUU7UUFDYix5Q0FBeUM7UUFDekMsU0FBUyxDQUFDLFFBQVEsR0FBRyxjQUFjLENBQUM7UUFDcEMsU0FBUyxDQUFDLGFBQWEsR0FBRyxjQUFjLENBQUM7UUFDekMsU0FBUyxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUM7UUFDeEMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztRQUM3QyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsY0FBYyxDQUFDO1FBQzVDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxjQUFjLENBQUM7UUFDNUMsU0FBUyxDQUFDLG1CQUFtQixHQUFHLGNBQWMsQ0FBQztRQUMvQyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsY0FBYyxDQUFDO1FBQzdDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxjQUFjLENBQUM7UUFDNUMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLGNBQWMsQ0FBQztLQUM5QztBQUNILENBQUM7QUFFRCxJQUFNLGNBQWMsR0FDaEIsMEZBQTBGLENBQUM7QUFFL0Y7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxJQUFNLE9BQU8sR0FBRyxTQUFTLENBQUM7QUFFakM7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQWMsRUFBRSxLQUFtQjtJQUMzRCxTQUFTLElBQUksc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsSUFBTSxTQUFTLEdBQUcsV0FBVyxFQUFFLENBQUM7SUFDaEMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztJQUNwQyxTQUFTLENBQUMscUJBQXFCLEdBQUcsS0FBTyxDQUFDO0lBQzFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQzFCLFNBQVMsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO0lBQzFCLFNBQVMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLFNBQVMsQ0FBQyxZQUFZLEdBQUcsT0FBUyxDQUFDO0lBQ25DLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDaEMsU0FBUyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztJQUNsQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLFNBQVMsQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7SUFDckMsU0FBUyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUNoQyxTQUFTLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDaEMsU0FBUyxDQUFDLFlBQVksR0FBRyxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLGlCQUFpQixDQUFDO0lBQ2xGLFNBQVMsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDbEMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxXQUFXO0lBQ2xCLElBQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztJQUM5QyxJQUFNLFdBQVcsR0FBRyxhQUFhLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7SUFDeEUsSUFBTSxTQUFTLEdBQUcsV0FBVyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7SUFDbkYsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLE1BQXFCO0lBQ3pDLElBQU0sTUFBTSxHQUFXO1FBQ3JCLHFCQUFxQixFQUFFLElBQU07UUFDN0IsUUFBUSxFQUFFLElBQUk7UUFDZCxLQUFLLEVBQUUsSUFBTTtRQUNiLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLFlBQVksRUFBRSxJQUFNO1FBQ3BCLGlCQUFpQixFQUFFLENBQUM7UUFDcEIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLG1CQUFtQixFQUFFLElBQUk7UUFDekIsaUJBQWlCLEVBQUUsQ0FBQztRQUNwQixnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFDcEIsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNoQixpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sRUFBRSxNQUFRO1FBQ2hCLEtBQUssRUFBRSxJQUFJO0tBQ1osQ0FBQztJQUNGLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUUsaUNBQWlDO0lBQzlFLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLElBQUksb0JBQW9CLG1CQUE4QixFQUFFO1FBQ3RELG9CQUFvQixFQUFFLENBQUM7S0FDeEI7SUFDRCxTQUFTLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFVBQVUsU0FBUztJQUN2QixnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMzRCxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBVSxLQUFhO0lBQ3BELElBQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxZQUFZO1FBQ3JELFdBQVcsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFlBQWMsQ0FBQyxDQUFDO0lBQy9ELE9BQU8sWUFBWSxDQUFDLE9BQU8sQ0FBTSxDQUFDO0FBQ3BDLENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxZQUFvQixFQUFFLFdBQWtCO0lBQzNELE9BQU8sWUFBWSxHQUFHLENBQUMsRUFBRTtRQUN2QixTQUFTLElBQUksYUFBYSxDQUNULFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUM3Qix3RUFBd0UsQ0FBQyxDQUFDO1FBQzNGLFdBQVcsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUcsQ0FBQztRQUM5QyxZQUFZLEVBQUUsQ0FBQztLQUNoQjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxnQkFBMkIsQ0FBQztBQUMxRSxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBYTtJQUM1QyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssZ0JBQTJCLENBQUM7QUFDM0UsQ0FBQztBQUdEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsY0FBYztJQUM1QixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsNEJBQTRCLENBQUM7QUFDMUUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCO0lBQy9CLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxnQ0FBZ0MsQ0FBQztBQUM5RSxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZUFBZTtJQUM3QixxQkFBcUIsRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDbEQsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZO0lBQzFCLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQ2xELENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsU0FBaUM7SUFDeEUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUN2RCxDQUFDO0FBRUQsTUFBTSxVQUFVLDBCQUEwQjtJQUN4Qyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsTUFBTSxVQUFVLHdCQUF3QjtJQUN0QywrRkFBK0Y7SUFDL0YsZ0VBQWdFO0lBQ2hFLElBQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztJQUN2QyxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIExWaWV3LCBPcGFxdWVWaWV3U3RhdGUsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKlxuICovXG5pbnRlcmZhY2UgTEZyYW1lIHtcbiAgLyoqXG4gICAqIFBhcmVudCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVlZGVkIHdoZW4gYGxlYXZlVmlld2AgaXMgY2FsbGVkIHRvIHJlc3RvcmUgdGhlIHByZXZpb3VzIHN0YXRlLlxuICAgKi9cbiAgcGFyZW50OiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIENoaWxkIExGcmFtZS5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIHRvIGNhY2hlIGV4aXN0aW5nIExGcmFtZXMgdG8gcmVsaWV2ZSB0aGUgbWVtb3J5IHByZXNzdXJlLlxuICAgKi9cbiAgY2hpbGQ6IExGcmFtZXxudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAgICpcbiAgICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAgICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gICAqL1xuICBsVmlldzogTFZpZXc7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGluIGNvbmplY3Rpb24gd2l0aCBgaXNQYXJlbnRgLlxuICAgKi9cbiAgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZTtcblxuICAvKipcbiAgICogSWYgYGlzUGFyZW50YCBpczpcbiAgICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICAgKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAgICovXG4gIGlzUGFyZW50OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiBjdXJyZW50bHkgc2VsZWN0ZWQgZWxlbWVudCBpbiBMVmlldy5cbiAgICpcbiAgICogVXNlZCBieSBiaW5kaW5nIGluc3RydWN0aW9ucy4gVXBkYXRlZCBhcyBwYXJ0IG9mIGFkdmFuY2UgaW5zdHJ1Y3Rpb24uXG4gICAqL1xuICBzZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgcG9pbnRlciB0byB0aGUgYmluZGluZyBpbmRleC5cbiAgICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAgICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICAgKlxuICAgKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICAgKi9cbiAgY29udGV4dExWaWV3OiBMVmlldztcblxuICAvKipcbiAgICogU3RvcmUgdGhlIGVsZW1lbnQgZGVwdGggY291bnQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgcm9vdCBlbGVtZW50cyBvZiB0aGUgdGVtcGxhdGVcbiAgICogc28gdGhhdCB3ZSBjYW4gdGhlbiBhdHRhY2ggcGF0Y2ggZGF0YSBgTFZpZXdgIHRvIG9ubHkgdGhvc2UgZWxlbWVudHMuIFdlIGtub3cgdGhhdCB0aG9zZVxuICAgKiBhcmUgdGhlIG9ubHkgcGxhY2VzIHdoZXJlIHRoZSBwYXRjaCBkYXRhIGNvdWxkIGNoYW5nZSwgdGhpcyB3YXkgd2Ugd2lsbCBzYXZlIG9uIG51bWJlclxuICAgKiBvZiBwbGFjZXMgd2hlcmUgdGhhIHBhdGNoaW5nIG9jY3Vycy5cbiAgICovXG4gIGVsZW1lbnREZXB0aENvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgbmFtZXNwYWNlIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBlbGVtZW50c1xuICAgKi9cbiAgY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgc2FuaXRpemVyXG4gICAqL1xuICBjdXJyZW50U2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbDtcblxuXG4gIC8qKlxuICAgKiBVc2VkIHdoZW4gcHJvY2Vzc2luZyBob3N0IGJpbmRpbmdzLlxuICAgKi9cbiAgY3VycmVudERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbDtcblxuICAvKipcbiAgICogVXNlZCBhcyB0aGUgc3RhcnRpbmcgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICAgKlxuICAgKiBBbGwgc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBpbmNyZW1lbnRlZCBmcm9tIHRoaXMgdmFsdWUgb253YXJkcy5cbiAgICogVGhlIHJlYXNvbiB3aHkgdGhpcyB2YWx1ZSBpcyBgMWAgaW5zdGVhZCBvZiBgMGAgaXMgYmVjYXVzZSB0aGUgYDBgXG4gICAqIHZhbHVlIGlzIHJlc2VydmVkIGZvciB0aGUgdGVtcGxhdGUuXG4gICAqL1xuICBhY3RpdmVEaXJlY3RpdmVJZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBpbmRleCBmcm9tIHdoaWNoIHB1cmUgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zIHNob3VsZCBjYWxjdWxhdGUgdGhlaXIgYmluZGluZ1xuICAgKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gICAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICsgYW55IGRpcnMvaG9zdFZhcnMgYmVmb3JlIHRoZSBnaXZlbiBkaXIuXG4gICAqL1xuICBiaW5kaW5nUm9vdEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgaW5kZXggb2YgYSBWaWV3IG9yIENvbnRlbnQgUXVlcnkgd2hpY2ggbmVlZHMgdG8gYmUgcHJvY2Vzc2VkIG5leHQuXG4gICAqIFdlIGl0ZXJhdGUgb3ZlciB0aGUgbGlzdCBvZiBRdWVyaWVzIGFuZCBpbmNyZW1lbnQgY3VycmVudCBxdWVyeSBpbmRleCBhdCBldmVyeSBzdGVwLlxuICAgKi9cbiAgY3VycmVudFF1ZXJ5SW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBbGwgaW1wbGljaXQgaW5zdHJ1Y3Rpb24gc3RhdGUgaXMgc3RvcmVkIGhlcmUuXG4gKlxuICogSXQgaXMgdXNlZnVsIHRvIGhhdmUgYSBzaW5nbGUgb2JqZWN0IHdoZXJlIGFsbCBvZiB0aGUgc3RhdGUgaXMgc3RvcmVkIGFzIGEgbWVudGFsIG1vZGVsXG4gKiAocmF0aGVyIGl0IGJlaW5nIHNwcmVhZCBhY3Jvc3MgbWFueSBkaWZmZXJlbnQgdmFyaWFibGVzLilcbiAqXG4gKiBQRVJGIE5PVEU6IFR1cm5zIG91dCB0aGF0IHdyaXRpbmcgdG8gYSB0cnVlIGdsb2JhbCB2YXJpYWJsZSBpcyBzbG93ZXIgdGhhblxuICogaGF2aW5nIGFuIGludGVybWVkaWF0ZSBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzLlxuICovXG5pbnRlcmZhY2UgSW5zdHJ1Y3Rpb25TdGF0ZSB7XG4gIC8qKlxuICAgKiBDdXJyZW50IGBMRnJhbWVgXG4gICAqXG4gICAqIGBudWxsYCBpZiB3ZSBoYXZlIG5vdCBjYWxsZWQgYGVudGVyVmlld2BcbiAgICovXG4gIGxGcmFtZTogTEZyYW1lO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgd2hldGhlciBkaXJlY3RpdmVzIHNob3VsZCBiZSBtYXRjaGVkIHRvIGVsZW1lbnRzLlxuICAgKlxuICAgKiBXaGVuIHRlbXBsYXRlIGNvbnRhaW5zIGBuZ05vbkJpbmRhYmxlYCB0aGVuIHdlIG5lZWQgdG8gcHJldmVudCB0aGUgcnVudGltZSBmcm9tIG1hdGNoaW5nXG4gICAqIGRpcmVjdGl2ZXMgb24gY2hpbGRyZW4gb2YgdGhhdCBlbGVtZW50LlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBgYGBcbiAgICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICAgKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gICAqIDwvbXktY29tcD5cbiAgICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICAgKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAgICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gICAqICAgPC9teS1jb21wPlxuICAgKiA8L2Rpdj5cbiAgICogYGBgXG4gICAqL1xuICBiaW5kaW5nc0VuYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAgICpcbiAgICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAgICovXG4gIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogRnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGVsZW1lbnQgaXMgZXhpdGVkLlxuICAgKlxuICAgKiBOT1RFOiBUaGUgZnVuY3Rpb24gaXMgaGVyZSBmb3IgdHJlZSBzaGFrYWJsZSBwdXJwb3NlcyBzaW5jZSBpdCBpcyBvbmx5IG5lZWRlZCBieSBzdHlsaW5nLlxuICAgKi9cbiAgZWxlbWVudEV4aXRGbjogKCgpID0+IHZvaWQpfG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBpbnN0cnVjdGlvblN0YXRlOiBJbnN0cnVjdGlvblN0YXRlID0ge1xuICBsRnJhbWU6IGNyZWF0ZUxGcmFtZShudWxsKSxcbiAgYmluZGluZ3NFbmFibGVkOiB0cnVlLFxuICBlbGVtZW50RXhpdEZuOiBudWxsLFxuICBjaGVja05vQ2hhbmdlc01vZGU6IGZhbHNlLFxufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudERlcHRoQ291bnQoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudC0tO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ3NFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQ7XG59XG5cblxuLyoqXG4gKiBFbmFibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50cy5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gybXJtWRpc2FibGVCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIMm1ybVlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVuYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogRGlzYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnQuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IExWaWV3LlxuICpcbiAqIFRoZSByZXR1cm4gdmFsdWUgY2FuIGJlIGBudWxsYCBpZiB0aGUgbWV0aG9kIGlzIGNhbGxlZCBvdXRzaWRlIG9mIHRlbXBsYXRlLiBUaGlzIGNhbiBoYXBwZW4gaWZcbiAqIGRpcmVjdGl2ZSBpcyBpbnN0YW50aWF0ZWQgYnkgbW9kdWxlIGluamVjdG9yIChyYXRoZXIgdGhhbiBieSBub2RlIGluamVjdG9yLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3KCk6IExWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHRoZSByZXR1cm4gdmFsdWUgc2hvdWxkIGJlIGBMVmlld3xudWxsYCBidXQgZG9pbmcgc28gYnJlYWtzIGEgbG90IG9mIGNvZGUuXG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICByZXR1cm4gbEZyYW1lID09PSBudWxsID8gbnVsbCAhIDogbEZyYW1lLmxWaWV3O1xufVxuXG4vKipcbiAqIEZsYWdzIHVzZWQgZm9yIGFuIGFjdGl2ZSBlbGVtZW50IGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFRoZXNlIGZsYWdzIGFyZSB1c2VkIHdpdGhpbiBvdGhlciBpbnN0cnVjdGlvbnMgdG8gaW5mb3JtIGNsZWFudXAgb3JcbiAqIGV4aXQgb3BlcmF0aW9ucyB0byBydW4gd2hlbiBhbiBlbGVtZW50IGlzIGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlc2UgZmxhZ3MgYXJlIHJlc2V0IGVhY2ggdGltZSBhbiBlbGVtZW50IGNoYW5nZXMgKHdoZXRoZXIgaXRcbiAqIGhhcHBlbnMgd2hlbiBgYWR2YW5jZSgpYCBpcyBydW4gb3Igd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGV4aXRzIG91dCBvZiBhIHRlbXBsYXRlXG4gKiBmdW5jdGlvbiBvciB3aGVuIGFsbCBob3N0IGJpbmRpbmdzIGFyZSBwcm9jZXNzZWQgZm9yIGFuIGVsZW1lbnQpLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBBY3RpdmVFbGVtZW50RmxhZ3Mge1xuICBJbml0aWFsID0gMGIwMCxcbiAgUnVuRXhpdEZuID0gMGIwMSxcbiAgU2l6ZSA9IDEsXG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCBhIGZsYWcgaXMgY3VycmVudGx5IHNldCBmb3IgdGhlIGFjdGl2ZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQWN0aXZlRWxlbWVudEZsYWcoZmxhZzogQWN0aXZlRWxlbWVudEZsYWdzKSB7XG4gIHJldHVybiAoaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleCAmIGZsYWcpID09PSBmbGFnO1xufVxuXG4vKipcbiAqIFNldHMgYSBmbGFnIGlzIGZvciB0aGUgYWN0aXZlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHNldEFjdGl2ZUVsZW1lbnRGbGFnKGZsYWc6IEFjdGl2ZUVsZW1lbnRGbGFncykge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4IHw9IGZsYWc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgYWN0aXZlIGRpcmVjdGl2ZSBob3N0IGVsZW1lbnQgYW5kIHJlc2V0cyB0aGUgZGlyZWN0aXZlIGlkIHZhbHVlXG4gKiAod2hlbiB0aGUgcHJvdmlkZWQgZWxlbWVudEluZGV4IHZhbHVlIGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudEluZGV4IHRoZSBlbGVtZW50IGluZGV4IHZhbHVlIGZvciB0aGUgaG9zdCBlbGVtZW50IHdoZXJlXG4gKiAgICAgICAgICAgICAgICAgICAgIHRoZSBkaXJlY3RpdmUvY29tcG9uZW50IGluc3RhbmNlIGxpdmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRBY3RpdmVIb3N0RWxlbWVudChlbGVtZW50SW5kZXg6IG51bWJlciB8IG51bGwpIHtcbiAgaWYgKGhhc0FjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pKSB7XG4gICAgZXhlY3V0ZUVsZW1lbnRFeGl0Rm4oKTtcbiAgfVxuICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCA9PT0gbnVsbCA/IC0xIDogZWxlbWVudEluZGV4KTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYWN0aXZlRGlyZWN0aXZlSWQgPSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUVsZW1lbnRFeGl0Rm4oKSB7XG4gIGluc3RydWN0aW9uU3RhdGUuZWxlbWVudEV4aXRGbiAhKCk7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnNlbGVjdGVkSW5kZXggJj0gfkFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm47XG59XG5cbi8qKlxuICogUXVldWVzIGEgZnVuY3Rpb24gdG8gYmUgcnVuIG9uY2UgdGhlIGVsZW1lbnQgaXMgXCJleGl0ZWRcIiBpbiBDRC5cbiAqXG4gKiBDaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgZm9jdXMgb24gYW4gZWxlbWVudCBlaXRoZXIgd2hlbiB0aGUgYGFkdmFuY2UoKWBcbiAqIGluc3RydWN0aW9uIGlzIGNhbGxlZCBvciB3aGVuIHRoZSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGluc3RydWN0aW9uXG4gKiBjb2RlIGlzIGludm9rZWQuIFRoZSBlbGVtZW50IGlzIHRoZW4gXCJleGl0ZWRcIiB3aGVuIHRoZSBuZXh0IGVsZW1lbnQgaXNcbiAqIHNlbGVjdGVkIG9yIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBmb3IgdGhlIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgaXNcbiAqIGNvbXBsZXRlLiBXaGVuIHRoaXMgb2NjdXJzICh0aGUgZWxlbWVudCBjaGFuZ2Ugb3BlcmF0aW9uKSB0aGVuIGFuIGV4aXRcbiAqIGZ1bmN0aW9uIHdpbGwgYmUgaW52b2tlZCBpZiBpdCBoYXMgYmVlbiBzZXQuIFRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWRcbiAqIHRvIGFzc2lnbiB0aGF0IGV4aXQgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIGZuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbGVtZW50RXhpdEZuKGZuOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gIHNldEFjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pO1xuICBpZiAoaW5zdHJ1Y3Rpb25TdGF0ZS5lbGVtZW50RXhpdEZuID09PSBudWxsKSB7XG4gICAgaW5zdHJ1Y3Rpb25TdGF0ZS5lbGVtZW50RXhpdEZuID0gZm47XG4gIH1cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChpbnN0cnVjdGlvblN0YXRlLmVsZW1lbnRFeGl0Rm4sIGZuLCAnRXhwZWN0aW5nIHRvIGFsd2F5cyBnZXQgdGhlIHNhbWUgZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IGlkIHZhbHVlIG9mIHRoZSBjdXJyZW50IGRpcmVjdGl2ZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSB3ZSBoYXZlIGFuIGVsZW1lbnQgdGhhdCBoYXMgdHdvIGRpcmVjdGl2ZXMgb24gaXQ6XG4gKiA8ZGl2IGRpci1vbmUgZGlyLXR3bz48L2Rpdj5cbiAqXG4gKiBkaXJPbmUtPmhvc3RCaW5kaW5ncygpIChpZCA9PSAxKVxuICogZGlyVHdvLT5ob3N0QmluZGluZ3MoKSAoaWQgPT0gMilcbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IGRpcmVjdGl2ZSBpZCB2YWx1ZXMgYXJlIHNwZWNpZmljIHRvIGFuIGVsZW1lbnQgKHRoaXMgbWVhbnMgdGhhdFxuICogdGhlIHNhbWUgaWQgdmFsdWUgY291bGQgYmUgcHJlc2VudCBvbiBhbm90aGVyIGVsZW1lbnQgd2l0aCBhIGNvbXBsZXRlbHlcbiAqIGRpZmZlcmVudCBzZXQgb2YgZGlyZWN0aXZlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmFjdGl2ZURpcmVjdGl2ZUlkO1xufVxuXG4vKipcbiAqIEluY3JlbWVudHMgdGhlIGN1cnJlbnQgZGlyZWN0aXZlIGlkIHZhbHVlLlxuICpcbiAqIEZvciBleGFtcGxlIHdlIGhhdmUgYW4gZWxlbWVudCB0aGF0IGhhcyB0d28gZGlyZWN0aXZlcyBvbiBpdDpcbiAqIDxkaXYgZGlyLW9uZSBkaXItdHdvPjwvZGl2PlxuICpcbiAqIGRpck9uZS0+aG9zdEJpbmRpbmdzKCkgKGluZGV4ID0gMSlcbiAqIC8vIGluY3JlbWVudFxuICogZGlyVHdvLT5ob3N0QmluZGluZ3MoKSAoaW5kZXggPSAyKVxuICpcbiAqIERlcGVuZGluZyBvbiB3aGV0aGVyIG9yIG5vdCBhIHByZXZpb3VzIGRpcmVjdGl2ZSBoYWQgYW55IGluaGVyaXRlZFxuICogZGlyZWN0aXZlcyBwcmVzZW50LCB0aGF0IHZhbHVlIHdpbGwgYmUgaW5jcmVtZW50ZWQgaW4gYWRkaXRpb25cbiAqIHRvIHRoZSBpZCBqdW1waW5nIHVwIGJ5IG9uZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ2AgZnVuY3Rpb25zIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTm90ZSB0aGF0IGRpcmVjdGl2ZSBpZCB2YWx1ZXMgYXJlIHNwZWNpZmljIHRvIGFuIGVsZW1lbnQgKHRoaXMgbWVhbnMgdGhhdFxuICogdGhlIHNhbWUgaWQgdmFsdWUgY291bGQgYmUgcHJlc2VudCBvbiBhbm90aGVyIGVsZW1lbnQgd2l0aCBhIGNvbXBsZXRlbHlcbiAqIGRpZmZlcmVudCBzZXQgb2YgZGlyZWN0aXZlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpIHtcbiAgLy8gRWFjaCBkaXJlY3RpdmUgZ2V0cyBhIHVuaXF1ZUlkIHZhbHVlIHRoYXQgaXMgdGhlIHNhbWUgZm9yIGJvdGhcbiAgLy8gY3JlYXRlIGFuZCB1cGRhdGUgY2FsbHMgd2hlbiB0aGUgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZC4gVGhlXG4gIC8vIGRpcmVjdGl2ZSB1bmlxdWVJZCBpcyBub3Qgc2V0IGFueXdoZXJlLS1pdCBpcyBqdXN0IGluY3JlbWVudGVkIGJldHdlZW5cbiAgLy8gZWFjaCBob3N0QmluZGluZ3MgY2FsbCBhbmQgaXMgdXNlZnVsIGZvciBoZWxwaW5nIGluc3RydWN0aW9uIGNvZGVcbiAgLy8gdW5pcXVlbHkgZGV0ZXJtaW5lIHdoaWNoIGRpcmVjdGl2ZSBpcyBjdXJyZW50bHkgYWN0aXZlIHdoZW4gZXhlY3V0ZWQuXG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmFjdGl2ZURpcmVjdGl2ZUlkICs9IDE7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgYGNvbnRleHRWaWV3RGF0YWAgdG8gdGhlIGdpdmVuIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIGdldEN1cnJlbnRWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gdmlld1RvUmVzdG9yZSBUaGUgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlIHRvIHJlc3RvcmUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXN0b3JlVmlldyh2aWV3VG9SZXN0b3JlOiBPcGFxdWVWaWV3U3RhdGUpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3ID0gdmlld1RvUmVzdG9yZSBhcyBhbnkgYXMgTFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUucHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlOiBUTm9kZSwgX2lzUGFyZW50OiBib29sZWFuKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pc1BhcmVudCA9IF9pc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldElzUGFyZW50KCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc05vdFBhcmVudCgpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc1BhcmVudCgpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dExWaWV3KCk6IExWaWV3IHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuY2hlY2tOb0NoYW5nZXNNb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKG1vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5jaGVja05vQ2hhbmdlc01vZGUgPSBtb2RlO1xufVxuXG4vLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1Jvb3QoKSB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBsZXQgaW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleDtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIGNvbnN0IGxWaWV3ID0gbEZyYW1lLmxWaWV3O1xuICAgIGluZGV4ID0gbEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXg7XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ0luZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nSW5kZXgodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXggPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRCaW5kaW5nSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdJbmRleCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50QmluZGluZ0luZGV4KGNvdW50OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgY29uc3QgaW5kZXggPSBsRnJhbWUuYmluZGluZ0luZGV4O1xuICBsRnJhbWUuYmluZGluZ0luZGV4ID0gbEZyYW1lLmJpbmRpbmdJbmRleCArIGNvdW50O1xuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogU2V0IGEgbmV3IGJpbmRpbmcgcm9vdCBpbmRleCBzbyB0aGF0IGhvc3QgdGVtcGxhdGUgZnVuY3Rpb25zIGNhbiBleGVjdXRlLlxuICpcbiAqIEJpbmRpbmdzIGluc2lkZSB0aGUgaG9zdCB0ZW1wbGF0ZSBhcmUgMCBpbmRleC4gQnV0IGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBhaGVhZCBvZiB0aW1lXG4gKiBob3cgbWFueSBob3N0IGJpbmRpbmdzIHdlIGhhdmUgd2UgY2FuJ3QgcHJlLWNvbXB1dGUgdGhlbS4gRm9yIHRoaXMgcmVhc29uIHRoZXkgYXJlIGFsbFxuICogMCBpbmRleCBhbmQgd2UganVzdCBzaGlmdCB0aGUgcm9vdCBzbyB0aGF0IHRoZXkgbWF0Y2ggbmV4dCBhdmFpbGFibGUgbG9jYXRpb24gaW4gdGhlIExWaWV3LlxuICogQHBhcmFtIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdCh2YWx1ZTogbnVtYmVyKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBlbnRlclZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICogQHBhcmFtIG5ld1ZpZXdcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJESShuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlICE7XG4gIG5ld0xGcmFtZS5sVmlldyA9IG5ld1ZpZXc7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyByZXNldHRpbmcgZm9yIHNhZmV0eSBpbiBkZXYgbW9kZSBvbmx5LlxuICAgIG5ld0xGcmFtZS5pc1BhcmVudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5zZWxlY3RlZEluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnRTYW5pdGl6ZXIgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuY3VycmVudERpcmVjdGl2ZURlZiA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5hY3RpdmVEaXJlY3RpdmVJZCA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnRRdWVyeUluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gIH1cbn1cblxuY29uc3QgREVWX01PREVfVkFMVUU6IGFueSA9XG4gICAgJ1ZhbHVlIGluZGljYXRpbmcgdGhhdCBESSBpcyB0cnlpbmcgdG8gcmVhZCB2YWx1ZSB3aGljaCBpdCBzaG91bGQgbm90IG5lZWQgdG8ga25vdyBhYm91dC4nO1xuXG4vKipcbiAqIFRoaXMgaXMgYSBsaWdodCB3ZWlnaHQgdmVyc2lvbiBvZiB0aGUgYGxlYXZlVmlld2Agd2hpY2ggaXMgbmVlZGVkIGJ5IHRoZSBESSBzeXN0ZW0uXG4gKlxuICogQmVjYXVzZSB0aGUgaW1wbGVtZW50YXRpb24gaXMgc2FtZSBpdCBpcyBvbmx5IGFuIGFsaWFzXG4gKi9cbmV4cG9ydCBjb25zdCBsZWF2ZURJID0gbGVhdmVWaWV3O1xuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgbFZpZXcgd2l0aCBhIG5ldyBsVmlldy5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgbFZpZXcgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgbFZpZXcgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgbFZpZXcgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIHROb2RlIEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzbHkgYWN0aXZlIGxWaWV3O1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlICE7XG4gIG5ld0xGcmFtZS5pc1BhcmVudCA9IHRydWU7XG4gIG5ld0xGcmFtZS5sVmlldyA9IG5ld1ZpZXc7XG4gIG5ld0xGcmFtZS5zZWxlY3RlZEluZGV4ID0gMDtcbiAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IG5ld1ZpZXcgITtcbiAgbmV3TEZyYW1lLmVsZW1lbnREZXB0aENvdW50ID0gMDtcbiAgbmV3TEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xuICBuZXdMRnJhbWUuY3VycmVudFNhbml0aXplciA9IG51bGw7XG4gIG5ld0xGcmFtZS5jdXJyZW50RGlyZWN0aXZlRGVmID0gbnVsbDtcbiAgbmV3TEZyYW1lLmFjdGl2ZURpcmVjdGl2ZUlkID0gMDtcbiAgbmV3TEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSAtMTtcbiAgbmV3TEZyYW1lLmJpbmRpbmdJbmRleCA9IG5ld1ZpZXcgPT09IG51bGwgPyAtMSA6IG5ld1ZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4O1xuICBuZXdMRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSAwO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyBuZXh0IGZyZWUgTEZyYW1lLiBUaGlzIGZ1bmN0aW9uIHRyaWVzIHRvIHJldXNlIHRoZSBgTEZyYW1lYHMgdG8gbG93ZXIgbWVtb3J5IHByZXNzdXJlLlxuICovXG5mdW5jdGlvbiBhbGxvY0xGcmFtZSgpIHtcbiAgY29uc3QgY3VycmVudExGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBjaGlsZExGcmFtZSA9IGN1cnJlbnRMRnJhbWUgPT09IG51bGwgPyBudWxsIDogY3VycmVudExGcmFtZS5jaGlsZDtcbiAgY29uc3QgbmV3TEZyYW1lID0gY2hpbGRMRnJhbWUgPT09IG51bGwgPyBjcmVhdGVMRnJhbWUoY3VycmVudExGcmFtZSkgOiBjaGlsZExGcmFtZTtcbiAgcmV0dXJuIG5ld0xGcmFtZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTEZyYW1lKHBhcmVudDogTEZyYW1lIHwgbnVsbCk6IExGcmFtZSB7XG4gIGNvbnN0IGxGcmFtZTogTEZyYW1lID0ge1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogbnVsbCAhLCAgLy9cbiAgICBpc1BhcmVudDogdHJ1ZSwgICAgICAgICAgICAgICAgIC8vXG4gICAgbFZpZXc6IG51bGwgISwgICAgICAgICAgICAgICAgICAvL1xuICAgIHNlbGVjdGVkSW5kZXg6IDAsICAgICAgICAgICAgICAgLy9cbiAgICBjb250ZXh0TFZpZXc6IG51bGwgISwgICAgICAgICAgIC8vXG4gICAgZWxlbWVudERlcHRoQ291bnQ6IDAsICAgICAgICAgICAvL1xuICAgIGN1cnJlbnROYW1lc3BhY2U6IG51bGwsICAgICAgICAgLy9cbiAgICBjdXJyZW50U2FuaXRpemVyOiBudWxsLCAgICAgICAgIC8vXG4gICAgY3VycmVudERpcmVjdGl2ZURlZjogbnVsbCwgICAgICAvL1xuICAgIGFjdGl2ZURpcmVjdGl2ZUlkOiAwLCAgICAgICAgICAgLy9cbiAgICBiaW5kaW5nUm9vdEluZGV4OiAtMSwgICAgICAgICAgIC8vXG4gICAgYmluZGluZ0luZGV4OiAtMSwgICAgICAgICAgICAgICAvL1xuICAgIGN1cnJlbnRRdWVyeUluZGV4OiAwLCAgICAgICAgICAgLy9cbiAgICBwYXJlbnQ6IHBhcmVudCAhLCAgICAgICAgICAgICAgIC8vXG4gICAgY2hpbGQ6IG51bGwsICAgICAgICAgICAgICAgICAgICAvL1xuICB9O1xuICBwYXJlbnQgIT09IG51bGwgJiYgKHBhcmVudC5jaGlsZCA9IGxGcmFtZSk7ICAvLyBsaW5rIHRoZSBuZXcgTEZyYW1lIGZvciByZXVzZS5cbiAgcmV0dXJuIGxGcmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlld1Byb2Nlc3NFeGl0KCkge1xuICBpZiAoaGFzQWN0aXZlRWxlbWVudEZsYWcoQWN0aXZlRWxlbWVudEZsYWdzLlJ1bkV4aXRGbikpIHtcbiAgICBleGVjdXRlRWxlbWVudEV4aXRGbigpO1xuICB9XG4gIGxlYXZlVmlldygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnBhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyKTogVCB7XG4gIGNvbnN0IGNvbnRleHRMVmlldyA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9XG4gICAgICB3YWxrVXBWaWV3cyhsZXZlbCwgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtb3N0IHJlY2VudCBpbmRleCBwYXNzZWQgdG8ge0BsaW5rIHNlbGVjdH1cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkSW5kZXgoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4ID4+IEFjdGl2ZUVsZW1lbnRGbGFncy5TaXplO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1vc3QgcmVjZW50IGluZGV4IHBhc3NlZCB0byB7QGxpbmsgc2VsZWN0fVxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICpcbiAqIChOb3RlIHRoYXQgaWYgYW4gXCJleGl0IGZ1bmN0aW9uXCIgd2FzIHNldCBlYXJsaWVyICh2aWEgYHNldEVsZW1lbnRFeGl0Rm4oKWApIHRoZW4gdGhhdCB3aWxsIGJlXG4gKiBydW4gaWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBpbmRleGAgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0ZWQgaW5kZXggdmFsdWUuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnNlbGVjdGVkSW5kZXggPSBpbmRleCA8PCBBY3RpdmVFbGVtZW50RmxhZ3MuU2l6ZTtcbn1cblxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlU1ZHKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTEludGVybmFsKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50U2FuaXRpemVyID0gc2FuaXRpemVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpIHtcbiAgLy8gVE9ETyhtaXNrbyk6IFRoaXMgc2hvdWxkIHRocm93IHdoZW4gdGhlcmUgaXMgbm8gTFZpZXcsIGJ1dCBpdCB0dXJucyBvdXQgd2UgY2FuIGdldCBoZXJlIGZyb21cbiAgLy8gYE5vZGVTdHlsZURlYnVnYCBoZW5jZSB3ZSByZXR1cm4gYG51bGxgLiBUaGlzIHNob3VsZCBiZSBmaXhlZFxuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGxGcmFtZSA9PT0gbnVsbCA/IG51bGwgOiBsRnJhbWUuY3VycmVudFNhbml0aXplcjtcbn1cbiJdfQ==