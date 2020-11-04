/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertLessThan, assertNotEqual } from '../util/assert';
import { assertLViewOrUndefined, assertTNodeForTView } from './assert';
import { CONTEXT, DECLARATION_VIEW, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { getTNode } from './util/view_utils';
const instructionState = {
    lFrame: createLFrame(null),
    bindingsEnabled: true,
    isInCheckNoChangesMode: false,
};
/**
 * Returns true if the instruction state stack is empty.
 *
 * Intended to be called from tests only (tree shaken otherwise).
 */
export function specOnlyIsInstructionStateEmpty() {
    return instructionState.lFrame.parent === null;
}
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
 * Return the current `LView`.
 */
export function getLView() {
    return instructionState.lFrame.lView;
}
/**
 * Return the current `TView`.
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
 * @param viewToRestore The OpaqueViewState instance to restore.
 *
 * @codeGenApi
 */
export function ɵɵrestoreView(viewToRestore) {
    instructionState.lFrame.contextLView = viewToRestore;
}
export function getCurrentTNode() {
    let currentTNode = getCurrentTNodePlaceholderOk();
    while (currentTNode !== null && currentTNode.type === 64 /* Placeholder */) {
        currentTNode = currentTNode.parent;
    }
    return currentTNode;
}
export function getCurrentTNodePlaceholderOk() {
    return instructionState.lFrame.currentTNode;
}
export function getCurrentParentTNode() {
    const lFrame = instructionState.lFrame;
    const currentTNode = lFrame.currentTNode;
    return lFrame.isParent ? currentTNode : currentTNode.parent;
}
export function setCurrentTNode(tNode, isParent) {
    ngDevMode && tNode && assertTNodeForTView(tNode, instructionState.lFrame.tView);
    const lFrame = instructionState.lFrame;
    lFrame.currentTNode = tNode;
    lFrame.isParent = isParent;
}
export function isCurrentTNodeParent() {
    return instructionState.lFrame.isParent;
}
export function setCurrentTNodeAsNotParent() {
    instructionState.lFrame.isParent = false;
}
export function setCurrentTNodeAsParent() {
    instructionState.lFrame.isParent = true;
}
export function getContextLView() {
    return instructionState.lFrame.contextLView;
}
export function isInCheckNoChangesMode() {
    // TODO(misko): remove this from the LView since it is ngDevMode=true mode only.
    return instructionState.isInCheckNoChangesMode;
}
export function setIsInCheckNoChangesMode(mode) {
    instructionState.isInCheckNoChangesMode = mode;
}
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
export function getBindingRoot() {
    const lFrame = instructionState.lFrame;
    let index = lFrame.bindingRootIndex;
    if (index === -1) {
        index = lFrame.bindingRootIndex = lFrame.tView.bindingStartIndex;
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
    const lFrame = instructionState.lFrame;
    const index = lFrame.bindingIndex;
    lFrame.bindingIndex = lFrame.bindingIndex + count;
    return index;
}
export function isInI18nBlock() {
    return instructionState.lFrame.inI18n;
}
export function setInI18nBlock(isInI18nBlock) {
    instructionState.lFrame.inI18n = isInI18nBlock;
}
/**
 * Set a new binding root index so that host template functions can execute.
 *
 * Bindings inside the host template are 0 index. But because we don't know ahead of time
 * how many host bindings we have we can't pre-compute them. For this reason they are all
 * 0 index and we just shift the root so that they match next available location in the LView.
 *
 * @param bindingRootIndex Root index for `hostBindings`
 * @param currentDirectiveIndex `TData[currentDirectiveIndex]` will point to the current directive
 *        whose `hostBindings` are being processed.
 */
export function setBindingRootForHostBindings(bindingRootIndex, currentDirectiveIndex) {
    const lFrame = instructionState.lFrame;
    lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
    setCurrentDirectiveIndex(currentDirectiveIndex);
}
/**
 * When host binding is executing this points to the directive index.
 * `TView.data[getCurrentDirectiveIndex()]` is `DirectiveDef`
 * `LView[getCurrentDirectiveIndex()]` is directive instance.
 */
export function getCurrentDirectiveIndex() {
    return instructionState.lFrame.currentDirectiveIndex;
}
/**
 * Sets an index of a directive whose `hostBindings` are being processed.
 *
 * @param currentDirectiveIndex `TData` index where current directive instance can be found.
 */
export function setCurrentDirectiveIndex(currentDirectiveIndex) {
    instructionState.lFrame.currentDirectiveIndex = currentDirectiveIndex;
}
/**
 * Retrieve the current `DirectiveDef` which is active when `hostBindings` instruction is being
 * executed.
 *
 * @param tData Current `TData` where the `DirectiveDef` will be looked up at.
 */
export function getCurrentDirectiveDef(tData) {
    const currentDirectiveIndex = instructionState.lFrame.currentDirectiveIndex;
    return currentDirectiveIndex === -1 ? null : tData[currentDirectiveIndex];
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
    const newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.currentTNode = tNode;
    newLFrame.lView = newView;
}
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New lView to become active
 * @returns the previously active lView;
 */
export function enterView(newView) {
    ngDevMode && assertNotEqual(newView[0], newView[1], '????');
    ngDevMode && assertLViewOrUndefined(newView);
    const newLFrame = allocLFrame();
    if (ngDevMode) {
        assertEqual(newLFrame.isParent, true, 'Expected clean LFrame');
        assertEqual(newLFrame.lView, null, 'Expected clean LFrame');
        assertEqual(newLFrame.tView, null, 'Expected clean LFrame');
        assertEqual(newLFrame.selectedIndex, -1, 'Expected clean LFrame');
        assertEqual(newLFrame.elementDepthCount, 0, 'Expected clean LFrame');
        assertEqual(newLFrame.currentDirectiveIndex, -1, 'Expected clean LFrame');
        assertEqual(newLFrame.currentNamespace, null, 'Expected clean LFrame');
        assertEqual(newLFrame.bindingRootIndex, -1, 'Expected clean LFrame');
        assertEqual(newLFrame.currentQueryIndex, 0, 'Expected clean LFrame');
    }
    const tView = newView[TVIEW];
    instructionState.lFrame = newLFrame;
    ngDevMode && tView.firstChild && assertTNodeForTView(tView.firstChild, tView);
    newLFrame.currentTNode = tView.firstChild;
    newLFrame.lView = newView;
    newLFrame.tView = tView;
    newLFrame.contextLView = newView;
    newLFrame.bindingIndex = tView.bindingStartIndex;
    newLFrame.inI18n = false;
}
/**
 * Allocates next free LFrame. This function tries to reuse the `LFrame`s to lower memory pressure.
 */
function allocLFrame() {
    const currentLFrame = instructionState.lFrame;
    const childLFrame = currentLFrame === null ? null : currentLFrame.child;
    const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
    return newLFrame;
}
function createLFrame(parent) {
    const lFrame = {
        currentTNode: null,
        isParent: true,
        lView: null,
        tView: null,
        selectedIndex: -1,
        contextLView: null,
        elementDepthCount: 0,
        currentNamespace: null,
        currentDirectiveIndex: -1,
        bindingRootIndex: -1,
        bindingIndex: -1,
        currentQueryIndex: 0,
        parent: parent,
        child: null,
        inI18n: false,
    };
    parent !== null && (parent.child = lFrame); // link the new LFrame for reuse.
    return lFrame;
}
/**
 * A lightweight version of leave which is used with DI.
 *
 * This function only resets `currentTNode` and `LView` as those are the only properties
 * used with DI (`enterDI()`).
 *
 * NOTE: This function is reexported as `leaveDI`. However `leaveDI` has return type of `void` where
 * as `leaveViewLight` has `LFrame`. This is so that `leaveViewLight` can be used in `leaveView`.
 */
function leaveViewLight() {
    const oldLFrame = instructionState.lFrame;
    instructionState.lFrame = oldLFrame.parent;
    oldLFrame.currentTNode = null;
    oldLFrame.lView = null;
    return oldLFrame;
}
/**
 * This is a lightweight version of the `leaveView` which is needed by the DI system.
 *
 * NOTE: this function is an alias so that we can change the type of the function to have `void`
 * return type.
 */
export const leaveDI = leaveViewLight;
/**
 * Leave the current `LView`
 *
 * This pops the `LFrame` with the associated `LView` from the stack.
 *
 * IMPORTANT: We must zero out the `LFrame` values here otherwise they will be retained. This is
 * because for performance reasons we don't release `LFrame` but rather keep it for next use.
 */
export function leaveView() {
    const oldLFrame = leaveViewLight();
    oldLFrame.isParent = true;
    oldLFrame.tView = null;
    oldLFrame.selectedIndex = -1;
    oldLFrame.contextLView = null;
    oldLFrame.elementDepthCount = 0;
    oldLFrame.currentDirectiveIndex = -1;
    oldLFrame.currentNamespace = null;
    oldLFrame.bindingRootIndex = -1;
    oldLFrame.bindingIndex = -1;
    oldLFrame.currentQueryIndex = 0;
}
export function nextContextImpl(level) {
    const contextLView = instructionState.lFrame.contextLView =
        walkUpViews(level, instructionState.lFrame.contextLView);
    return contextLView[CONTEXT];
}
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode &&
            assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = currentView[DECLARATION_VIEW];
        nestingLevel--;
    }
    return currentView;
}
/**
 * Gets the currently selected element index.
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 */
export function getSelectedIndex() {
    return instructionState.lFrame.selectedIndex;
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
    ngDevMode && index !== -1 &&
        assertGreaterThanOrEqual(index, HEADER_OFFSET, 'Index must be past HEADER_OFFSET (or -1).');
    ngDevMode &&
        assertLessThan(index, instructionState.lFrame.lView.length, 'Can\'t set index passed end of LView');
    instructionState.lFrame.selectedIndex = index;
}
/**
 * Gets the `tNode` that represents currently selected element.
 */
export function getSelectedTNode() {
    const lFrame = instructionState.lFrame;
    return getTNode(lFrame.tView, lFrame.selectedIndex);
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceSVG() {
    instructionState.lFrame.currentNamespace = SVG_NAMESPACE;
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceMathML() {
    instructionState.lFrame.currentNamespace = MATH_ML_NAMESPACE;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLHdCQUF3QixFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHckUsT0FBTyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQWlDLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQ3hILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFOUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBMEszQyxNQUFNLGdCQUFnQixHQUFxQjtJQUN6QyxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQztJQUMxQixlQUFlLEVBQUUsSUFBSTtJQUNyQixzQkFBc0IsRUFBRSxLQUFLO0NBQzlCLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLCtCQUErQjtJQUM3QyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQ2pELENBQUM7QUFHRCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDO0FBQ25ELENBQUM7QUFFRCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQzlDLENBQUM7QUFFRCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxD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Q0FBQyxNQUFNLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztJQUM3RixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUNoRCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCO0lBQzlCLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztJQUN2QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxjQUFjO0lBQzVCLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCO0lBQy9CLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQztBQUMvRCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZUFBZTtJQUM3QixxQkFBcUIsRUFBRSxDQUFDO0FBQzFCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDbEQsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZO0lBQzFCLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQ2xELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TFZpZXdPclVuZGVmaW5lZCwgYXNzZXJ0VE5vZGVGb3JUVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBIRUFERVJfT0ZGU0VULCBMVmlldywgT3BhcXVlVmlld1N0YXRlLCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge01BVEhfTUxfTkFNRVNQQUNFLCBTVkdfTkFNRVNQQUNFfSBmcm9tICcuL25hbWVzcGFjZXMnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRUTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cbi8qKlxuICpcbiAqL1xuaW50ZXJmYWNlIExGcmFtZSB7XG4gIC8qKlxuICAgKiBQYXJlbnQgTEZyYW1lLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCB3aGVuIGBsZWF2ZVZpZXdgIGlzIGNhbGxlZCB0byByZXN0b3JlIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgICovXG4gIHBhcmVudDogTEZyYW1lO1xuXG4gIC8qKlxuICAgKiBDaGlsZCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjYWNoZSBleGlzdGluZyBMRnJhbWVzIHRvIHJlbGlldmUgdGhlIG1lbW9yeSBwcmVzc3VyZS5cbiAgICovXG4gIGNoaWxkOiBMRnJhbWV8bnVsbDtcblxuICAvKipcbiAgICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gICAqXG4gICAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gICAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICAgKi9cbiAgbFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IGBUVmlld2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBgTEZyYW1lLmxWaWV3YC5cbiAgICpcbiAgICogT25lIGNhbiBnZXQgYFRWaWV3YCBmcm9tIGBsRnJhbWVbVFZJRVddYCBob3dldmVyIGJlY2F1c2UgaXQgaXMgc28gY29tbW9uIGl0IG1ha2VzIHNlbnNlIHRvXG4gICAqIHN0b3JlIGl0IGluIGBMRnJhbWVgIGZvciBwZXJmIHJlYXNvbnMuXG4gICAqL1xuICB0VmlldzogVFZpZXc7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggYGlzUGFyZW50YC5cbiAgICovXG4gIGN1cnJlbnRUTm9kZTogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogSWYgYGlzUGFyZW50YCBpczpcbiAgICogIC0gYHRydWVgOiB0aGVuIGBjdXJyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICAgKiAgLSBgZmFsc2VgOiB0aGVuIGBjdXJyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAgICovXG4gIGlzUGFyZW50OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiBjdXJyZW50bHkgc2VsZWN0ZWQgZWxlbWVudCBpbiBMVmlldy5cbiAgICpcbiAgICogVXNlZCBieSBiaW5kaW5nIGluc3RydWN0aW9ucy4gVXBkYXRlZCBhcyBwYXJ0IG9mIGFkdmFuY2UgaW5zdHJ1Y3Rpb24uXG4gICAqL1xuICBzZWxlY3RlZEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgcG9pbnRlciB0byB0aGUgYmluZGluZyBpbmRleC5cbiAgICovXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAgICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICAgKlxuICAgKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICAgKi9cbiAgY29udGV4dExWaWV3OiBMVmlldztcblxuICAvKipcbiAgICogU3RvcmUgdGhlIGVsZW1lbnQgZGVwdGggY291bnQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgcm9vdCBlbGVtZW50cyBvZiB0aGUgdGVtcGxhdGVcbiAgICogc28gdGhhdCB3ZSBjYW4gdGhlbiBhdHRhY2ggcGF0Y2ggZGF0YSBgTFZpZXdgIHRvIG9ubHkgdGhvc2UgZWxlbWVudHMuIFdlIGtub3cgdGhhdCB0aG9zZVxuICAgKiBhcmUgdGhlIG9ubHkgcGxhY2VzIHdoZXJlIHRoZSBwYXRjaCBkYXRhIGNvdWxkIGNoYW5nZSwgdGhpcyB3YXkgd2Ugd2lsbCBzYXZlIG9uIG51bWJlclxuICAgKiBvZiBwbGFjZXMgd2hlcmUgdGhhIHBhdGNoaW5nIG9jY3Vycy5cbiAgICovXG4gIGVsZW1lbnREZXB0aENvdW50OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgbmFtZXNwYWNlIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyBlbGVtZW50c1xuICAgKi9cbiAgY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGw7XG5cblxuICAvKipcbiAgICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAgICogaW5kaWNlcy4gSW4gY29tcG9uZW50IHZpZXdzLCB0aGlzIGlzIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LiBJbiBhIGhvc3QgYmluZGluZ1xuICAgKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICAgKi9cbiAgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IGluZGV4IG9mIGEgVmlldyBvciBDb250ZW50IFF1ZXJ5IHdoaWNoIG5lZWRzIHRvIGJlIHByb2Nlc3NlZCBuZXh0LlxuICAgKiBXZSBpdGVyYXRlIG92ZXIgdGhlIGxpc3Qgb2YgUXVlcmllcyBhbmQgaW5jcmVtZW50IGN1cnJlbnQgcXVlcnkgaW5kZXggYXQgZXZlcnkgc3RlcC5cbiAgICovXG4gIGN1cnJlbnRRdWVyeUluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFdoZW4gaG9zdCBiaW5kaW5nIGlzIGV4ZWN1dGluZyB0aGlzIHBvaW50cyB0byB0aGUgZGlyZWN0aXZlIGluZGV4LlxuICAgKiBgVFZpZXcuZGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdYCBpcyBgRGlyZWN0aXZlRGVmYFxuICAgKiBgTFZpZXdbY3VycmVudERpcmVjdGl2ZUluZGV4XWAgaXMgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgKi9cbiAgY3VycmVudERpcmVjdGl2ZUluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFyZSB3ZSBjdXJyZW50bHkgaW4gaTE4biBibG9jayBhcyBkZW5vdGVkIGJ5IGDJtcm1ZWxlbWVudFN0YXJ0YCBhbmQgYMm1ybVlbGVtZW50RW5kYC5cbiAgICpcbiAgICogVGhpcyBpbmZvcm1hdGlvbiBpcyBuZWVkZWQgYmVjYXVzZSB3aGlsZSB3ZSBhcmUgaW4gaTE4biBibG9jayBhbGwgZWxlbWVudHMgbXVzdCBiZSBwcmUtZGVjbGFyZWRcbiAgICogaW4gdGhlIHRyYW5zbGF0aW9uLiAoaS5lLiBgSGVsbG8g77+9IzLvv71Xb3JsZO+/vS8jMu+/vSFgIHByZS1kZWNsYXJlcyBlbGVtZW50IGF0IGDvv70jMu+/vWAgbG9jYXRpb24uKVxuICAgKiBUaGlzIGFsbG9jYXRlcyBgVE5vZGVUeXBlLlBsYWNlaG9sZGVyYCBlbGVtZW50IGF0IGxvY2F0aW9uIGAyYC4gSWYgdHJhbnNsYXRvciByZW1vdmVzIGDvv70jMu+/vWBcbiAgICogZnJvbSB0cmFuc2xhdGlvbiB0aGFuIHRoZSBydW50aW1lIG11c3QgYWxzbyBlbnN1cmUgdGhhIGVsZW1lbnQgYXQgYDJgIGRvZXMgbm90IGdldCBpbnNlcnRlZFxuICAgKiBpbnRvIHRoZSBET00uIFRoZSB0cmFuc2xhdGlvbiBkb2VzIG5vdCBjYXJyeSBpbmZvcm1hdGlvbiBhYm91dCBkZWxldGVkIGVsZW1lbnRzLiBUaGVyZWZvciB0aGVcbiAgICogb25seSB3YXkgdG8ga25vdyB0aGF0IGFuIGVsZW1lbnQgaXMgZGVsZXRlZCBpcyB0aGF0IGl0IHdhcyBub3QgcHJlLWRlY2xhcmVkIGluIHRoZSB0cmFuc2xhdGlvbi5cbiAgICpcbiAgICogVGhpcyBmbGFnIHdvcmtzIGJ5IGVuc3VyaW5nIHRoYXQgZWxlbWVudHMgd2hpY2ggYXJlIGNyZWF0ZWQgd2l0aG91dCBwcmUtZGVjbGFyYXRpb25cbiAgICogKGBUTm9kZVR5cGUuUGxhY2Vob2xkZXJgKSBhcmUgbm90IGluc2VydGVkIGludG8gdGhlIERPTSByZW5kZXIgdHJlZS4gKEl0IGRvZXMgbWVhbiB0aGF0IHRoZVxuICAgKiBlbGVtZW50IHN0aWxsIGdldHMgaW5zdGFudGlhdGVkIGFsb25nIHdpdGggYWxsIG9mIGl0cyBiZWhhdmlvciBbZGlyZWN0aXZlc10pXG4gICAqL1xuICBpbkkxOG46IGJvb2xlYW47XG59XG5cbi8qKlxuICogQWxsIGltcGxpY2l0IGluc3RydWN0aW9uIHN0YXRlIGlzIHN0b3JlZCBoZXJlLlxuICpcbiAqIEl0IGlzIHVzZWZ1bCB0byBoYXZlIGEgc2luZ2xlIG9iamVjdCB3aGVyZSBhbGwgb2YgdGhlIHN0YXRlIGlzIHN0b3JlZCBhcyBhIG1lbnRhbCBtb2RlbFxuICogKHJhdGhlciBpdCBiZWluZyBzcHJlYWQgYWNyb3NzIG1hbnkgZGlmZmVyZW50IHZhcmlhYmxlcy4pXG4gKlxuICogUEVSRiBOT1RFOiBUdXJucyBvdXQgdGhhdCB3cml0aW5nIHRvIGEgdHJ1ZSBnbG9iYWwgdmFyaWFibGUgaXMgc2xvd2VyIHRoYW5cbiAqIGhhdmluZyBhbiBpbnRlcm1lZGlhdGUgb2JqZWN0IHdpdGggcHJvcGVydGllcy5cbiAqL1xuaW50ZXJmYWNlIEluc3RydWN0aW9uU3RhdGUge1xuICAvKipcbiAgICogQ3VycmVudCBgTEZyYW1lYFxuICAgKlxuICAgKiBgbnVsbGAgaWYgd2UgaGF2ZSBub3QgY2FsbGVkIGBlbnRlclZpZXdgXG4gICAqL1xuICBsRnJhbWU6IExGcmFtZTtcblxuICAvKipcbiAgICogU3RvcmVzIHdoZXRoZXIgZGlyZWN0aXZlcyBzaG91bGQgYmUgbWF0Y2hlZCB0byBlbGVtZW50cy5cbiAgICpcbiAgICogV2hlbiB0ZW1wbGF0ZSBjb250YWlucyBgbmdOb25CaW5kYWJsZWAgdGhlbiB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHJ1bnRpbWUgZnJvbSBtYXRjaGluZ1xuICAgKiBkaXJlY3RpdmVzIG9uIGNoaWxkcmVuIG9mIHRoYXQgZWxlbWVudC5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICogYGBgXG4gICAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAgICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICAgKiA8L215LWNvbXA+XG4gICAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAgICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gICAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICAgKiAgIDwvbXktY29tcD5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKi9cbiAgYmluZGluZ3NFbmFibGVkOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gICAqXG4gICAqIE5lY2Vzc2FyeSB0byBzdXBwb3J0IENoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCkuXG4gICAqXG4gICAqIGNoZWNrTm9DaGFuZ2VzIFJ1bnMgb25seSBpbiBkZXZtb2RlPXRydWUgYW5kIHZlcmlmaWVzIHRoYXQgbm8gdW5pbnRlbmRlZCBjaGFuZ2VzIGV4aXN0IGluXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb3IgaXRzIGNoaWxkcmVuLlxuICAgKi9cbiAgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbjtcbn1cblxuY29uc3QgaW5zdHJ1Y3Rpb25TdGF0ZTogSW5zdHJ1Y3Rpb25TdGF0ZSA9IHtcbiAgbEZyYW1lOiBjcmVhdGVMRnJhbWUobnVsbCksXG4gIGJpbmRpbmdzRW5hYmxlZDogdHJ1ZSxcbiAgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZTogZmFsc2UsXG59O1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgaW5zdHJ1Y3Rpb24gc3RhdGUgc3RhY2sgaXMgZW1wdHkuXG4gKlxuICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIGZyb20gdGVzdHMgb25seSAodHJlZSBzaGFrZW4gb3RoZXJ3aXNlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwZWNPbmx5SXNJbnN0cnVjdGlvblN0YXRlRW1wdHkoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wYXJlbnQgPT09IG51bGw7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnREZXB0aENvdW50KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBgTFZpZXdgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXcoKTogTFZpZXcge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUubFZpZXc7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGBUVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS50Vmlldztcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlldztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFROb2RlKCk6IFROb2RlfG51bGwge1xuICBsZXQgY3VycmVudFROb2RlID0gZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaygpO1xuICB3aGlsZSAoY3VycmVudFROb2RlICE9PSBudWxsICYmIGN1cnJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuUGxhY2Vob2xkZXIpIHtcbiAgICBjdXJyZW50VE5vZGUgPSBjdXJyZW50VE5vZGUucGFyZW50O1xuICB9XG4gIHJldHVybiBjdXJyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VE5vZGVQbGFjZWhvbGRlck9rKCk6IFROb2RlfG51bGwge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFBhcmVudFROb2RlKCk6IFROb2RlfG51bGwge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgY29uc3QgY3VycmVudFROb2RlID0gbEZyYW1lLmN1cnJlbnRUTm9kZTtcbiAgcmV0dXJuIGxGcmFtZS5pc1BhcmVudCA/IGN1cnJlbnRUTm9kZSA6IGN1cnJlbnRUTm9kZSEucGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFROb2RlKHROb2RlOiBUTm9kZXxudWxsLCBpc1BhcmVudDogYm9vbGVhbikge1xuICBuZ0Rldk1vZGUgJiYgdE5vZGUgJiYgYXNzZXJ0VE5vZGVGb3JUVmlldyh0Tm9kZSwgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUudFZpZXcpO1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgbEZyYW1lLmN1cnJlbnRUTm9kZSA9IHROb2RlO1xuICBsRnJhbWUuaXNQYXJlbnQgPSBpc1BhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ3VycmVudFROb2RlUGFyZW50KCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50VE5vZGVBc05vdFBhcmVudCgpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSBmYWxzZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50VE5vZGVBc1BhcmVudCgpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dExWaWV3KCk6IExWaWV3IHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTogYm9vbGVhbiB7XG4gIC8vIFRPRE8obWlza28pOiByZW1vdmUgdGhpcyBmcm9tIHRoZSBMVmlldyBzaW5jZSBpdCBpcyBuZ0Rldk1vZGU9dHJ1ZSBtb2RlIG9ubHkuXG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmlzSW5DaGVja05vQ2hhbmdlc01vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKG1vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5pc0luQ2hlY2tOb0NoYW5nZXNNb2RlID0gbW9kZTtcbn1cblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgbGV0IGluZGV4ID0gbEZyYW1lLmJpbmRpbmdSb290SW5kZXg7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBpbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gbEZyYW1lLnRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QmluZGluZ0luZGV4KHZhbHVlOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4ID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0QmluZGluZ0luZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXgrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEJpbmRpbmdJbmRleChjb3VudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGNvbnN0IGluZGV4ID0gbEZyYW1lLmJpbmRpbmdJbmRleDtcbiAgbEZyYW1lLmJpbmRpbmdJbmRleCA9IGxGcmFtZS5iaW5kaW5nSW5kZXggKyBjb3VudDtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNJbkkxOG5CbG9jaygpIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmluSTE4bjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEluSTE4bkJsb2NrKGlzSW5JMThuQmxvY2s6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaW5JMThuID0gaXNJbkkxOG5CbG9jaztcbn1cblxuLyoqXG4gKiBTZXQgYSBuZXcgYmluZGluZyByb290IGluZGV4IHNvIHRoYXQgaG9zdCB0ZW1wbGF0ZSBmdW5jdGlvbnMgY2FuIGV4ZWN1dGUuXG4gKlxuICogQmluZGluZ3MgaW5zaWRlIHRoZSBob3N0IHRlbXBsYXRlIGFyZSAwIGluZGV4LiBCdXQgYmVjYXVzZSB3ZSBkb24ndCBrbm93IGFoZWFkIG9mIHRpbWVcbiAqIGhvdyBtYW55IGhvc3QgYmluZGluZ3Mgd2UgaGF2ZSB3ZSBjYW4ndCBwcmUtY29tcHV0ZSB0aGVtLiBGb3IgdGhpcyByZWFzb24gdGhleSBhcmUgYWxsXG4gKiAwIGluZGV4IGFuZCB3ZSBqdXN0IHNoaWZ0IHRoZSByb290IHNvIHRoYXQgdGhleSBtYXRjaCBuZXh0IGF2YWlsYWJsZSBsb2NhdGlvbiBpbiB0aGUgTFZpZXcuXG4gKlxuICogQHBhcmFtIGJpbmRpbmdSb290SW5kZXggUm9vdCBpbmRleCBmb3IgYGhvc3RCaW5kaW5nc2BcbiAqIEBwYXJhbSBjdXJyZW50RGlyZWN0aXZlSW5kZXggYFREYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIHdpbGwgcG9pbnQgdG8gdGhlIGN1cnJlbnQgZGlyZWN0aXZlXG4gKiAgICAgICAgd2hvc2UgYGhvc3RCaW5kaW5nc2AgYXJlIGJlaW5nIHByb2Nlc3NlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKFxuICAgIGJpbmRpbmdSb290SW5kZXg6IG51bWJlciwgY3VycmVudERpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGxGcmFtZS5iaW5kaW5nSW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IGJpbmRpbmdSb290SW5kZXg7XG4gIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xufVxuXG4vKipcbiAqIFdoZW4gaG9zdCBiaW5kaW5nIGlzIGV4ZWN1dGluZyB0aGlzIHBvaW50cyB0byB0aGUgZGlyZWN0aXZlIGluZGV4LlxuICogYFRWaWV3LmRhdGFbZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCldYCBpcyBgRGlyZWN0aXZlRGVmYFxuICogYExWaWV3W2dldEN1cnJlbnREaXJlY3RpdmVJbmRleCgpXWAgaXMgZGlyZWN0aXZlIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXg7XG59XG5cbi8qKlxuICogU2V0cyBhbiBpbmRleCBvZiBhIGRpcmVjdGl2ZSB3aG9zZSBgaG9zdEJpbmRpbmdzYCBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50RGlyZWN0aXZlSW5kZXggYFREYXRhYCBpbmRleCB3aGVyZSBjdXJyZW50IGRpcmVjdGl2ZSBpbnN0YW5jZSBjYW4gYmUgZm91bmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoY3VycmVudERpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudERpcmVjdGl2ZUluZGV4ID0gY3VycmVudERpcmVjdGl2ZUluZGV4O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBjdXJyZW50IGBEaXJlY3RpdmVEZWZgIHdoaWNoIGlzIGFjdGl2ZSB3aGVuIGBob3N0QmluZGluZ3NgIGluc3RydWN0aW9uIGlzIGJlaW5nXG4gKiBleGVjdXRlZC5cbiAqXG4gKiBAcGFyYW0gdERhdGEgQ3VycmVudCBgVERhdGFgIHdoZXJlIHRoZSBgRGlyZWN0aXZlRGVmYCB3aWxsIGJlIGxvb2tlZCB1cCBhdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREaXJlY3RpdmVEZWYodERhdGE6IFREYXRhKTogRGlyZWN0aXZlRGVmPGFueT58bnVsbCB7XG4gIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleDtcbiAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVJbmRleCA9PT0gLTEgPyBudWxsIDogdERhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55Pjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHQgd2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBlbnRlclZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICogQHBhcmFtIG5ld1ZpZXdcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJESShuZXdWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLmN1cnJlbnRUTm9kZSA9IHROb2RlITtcbiAgbmV3TEZyYW1lLmxWaWV3ID0gbmV3Vmlldztcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IGxWaWV3IHdpdGggYSBuZXcgbFZpZXcuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIGxWaWV3IGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIGxWaWV3IGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IGxWaWV3IHRvIGJlY29tZSBhY3RpdmVcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwobmV3Vmlld1swXSwgbmV3Vmlld1sxXSBhcyBhbnksICc/Pz8/Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmlzUGFyZW50LCB0cnVlLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmxWaWV3LCBudWxsLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLnRWaWV3LCBudWxsLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLnNlbGVjdGVkSW5kZXgsIC0xLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmVsZW1lbnREZXB0aENvdW50LCAwLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleCwgLTEsICdFeHBlY3RlZCBjbGVhbiBMRnJhbWUnKTtcbiAgICBhc3NlcnRFcXVhbChuZXdMRnJhbWUuY3VycmVudE5hbWVzcGFjZSwgbnVsbCwgJ0V4cGVjdGVkIGNsZWFuIExGcmFtZScpO1xuICAgIGFzc2VydEVxdWFsKG5ld0xGcmFtZS5iaW5kaW5nUm9vdEluZGV4LCAtMSwgJ0V4cGVjdGVkIGNsZWFuIExGcmFtZScpO1xuICAgIGFzc2VydEVxdWFsKG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCwgMCwgJ0V4cGVjdGVkIGNsZWFuIExGcmFtZScpO1xuICB9XG4gIGNvbnN0IHRWaWV3ID0gbmV3Vmlld1tUVklFV107XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lID0gbmV3TEZyYW1lO1xuICBuZ0Rldk1vZGUgJiYgdFZpZXcuZmlyc3RDaGlsZCAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHRWaWV3LmZpcnN0Q2hpbGQsIHRWaWV3KTtcbiAgbmV3TEZyYW1lLmN1cnJlbnRUTm9kZSA9IHRWaWV3LmZpcnN0Q2hpbGQhO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBuZXdMRnJhbWUudFZpZXcgPSB0VmlldztcbiAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IG5ld1ZpZXchO1xuICBuZXdMRnJhbWUuYmluZGluZ0luZGV4ID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIG5ld0xGcmFtZS5pbkkxOG4gPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgbmV4dCBmcmVlIExGcmFtZS4gVGhpcyBmdW5jdGlvbiB0cmllcyB0byByZXVzZSB0aGUgYExGcmFtZWBzIHRvIGxvd2VyIG1lbW9yeSBwcmVzc3VyZS5cbiAqL1xuZnVuY3Rpb24gYWxsb2NMRnJhbWUoKSB7XG4gIGNvbnN0IGN1cnJlbnRMRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgY29uc3QgY2hpbGRMRnJhbWUgPSBjdXJyZW50TEZyYW1lID09PSBudWxsID8gbnVsbCA6IGN1cnJlbnRMRnJhbWUuY2hpbGQ7XG4gIGNvbnN0IG5ld0xGcmFtZSA9IGNoaWxkTEZyYW1lID09PSBudWxsID8gY3JlYXRlTEZyYW1lKGN1cnJlbnRMRnJhbWUpIDogY2hpbGRMRnJhbWU7XG4gIHJldHVybiBuZXdMRnJhbWU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxGcmFtZShwYXJlbnQ6IExGcmFtZXxudWxsKTogTEZyYW1lIHtcbiAgY29uc3QgbEZyYW1lOiBMRnJhbWUgPSB7XG4gICAgY3VycmVudFROb2RlOiBudWxsLFxuICAgIGlzUGFyZW50OiB0cnVlLFxuICAgIGxWaWV3OiBudWxsISxcbiAgICB0VmlldzogbnVsbCEsXG4gICAgc2VsZWN0ZWRJbmRleDogLTEsXG4gICAgY29udGV4dExWaWV3OiBudWxsISxcbiAgICBlbGVtZW50RGVwdGhDb3VudDogMCxcbiAgICBjdXJyZW50TmFtZXNwYWNlOiBudWxsLFxuICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleDogLTEsXG4gICAgYmluZGluZ1Jvb3RJbmRleDogLTEsXG4gICAgYmluZGluZ0luZGV4OiAtMSxcbiAgICBjdXJyZW50UXVlcnlJbmRleDogMCxcbiAgICBwYXJlbnQ6IHBhcmVudCEsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgaW5JMThuOiBmYWxzZSxcbiAgfTtcbiAgcGFyZW50ICE9PSBudWxsICYmIChwYXJlbnQuY2hpbGQgPSBsRnJhbWUpOyAgLy8gbGluayB0aGUgbmV3IExGcmFtZSBmb3IgcmV1c2UuXG4gIHJldHVybiBsRnJhbWU7XG59XG5cbi8qKlxuICogQSBsaWdodHdlaWdodCB2ZXJzaW9uIG9mIGxlYXZlIHdoaWNoIGlzIHVzZWQgd2l0aCBESS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIG9ubHkgcmVzZXRzIGBjdXJyZW50VE5vZGVgIGFuZCBgTFZpZXdgIGFzIHRob3NlIGFyZSB0aGUgb25seSBwcm9wZXJ0aWVzXG4gKiB1c2VkIHdpdGggREkgKGBlbnRlckRJKClgKS5cbiAqXG4gKiBOT1RFOiBUaGlzIGZ1bmN0aW9uIGlzIHJlZXhwb3J0ZWQgYXMgYGxlYXZlRElgLiBIb3dldmVyIGBsZWF2ZURJYCBoYXMgcmV0dXJuIHR5cGUgb2YgYHZvaWRgIHdoZXJlXG4gKiBhcyBgbGVhdmVWaWV3TGlnaHRgIGhhcyBgTEZyYW1lYC4gVGhpcyBpcyBzbyB0aGF0IGBsZWF2ZVZpZXdMaWdodGAgY2FuIGJlIHVzZWQgaW4gYGxlYXZlVmlld2AuXG4gKi9cbmZ1bmN0aW9uIGxlYXZlVmlld0xpZ2h0KCk6IExGcmFtZSB7XG4gIGNvbnN0IG9sZExGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG9sZExGcmFtZS5wYXJlbnQ7XG4gIG9sZExGcmFtZS5jdXJyZW50VE5vZGUgPSBudWxsITtcbiAgb2xkTEZyYW1lLmxWaWV3ID0gbnVsbCE7XG4gIHJldHVybiBvbGRMRnJhbWU7XG59XG5cbi8qKlxuICogVGhpcyBpcyBhIGxpZ2h0d2VpZ2h0IHZlcnNpb24gb2YgdGhlIGBsZWF2ZVZpZXdgIHdoaWNoIGlzIG5lZWRlZCBieSB0aGUgREkgc3lzdGVtLlxuICpcbiAqIE5PVEU6IHRoaXMgZnVuY3Rpb24gaXMgYW4gYWxpYXMgc28gdGhhdCB3ZSBjYW4gY2hhbmdlIHRoZSB0eXBlIG9mIHRoZSBmdW5jdGlvbiB0byBoYXZlIGB2b2lkYFxuICogcmV0dXJuIHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBsZWF2ZURJOiAoKSA9PiB2b2lkID0gbGVhdmVWaWV3TGlnaHQ7XG5cbi8qKlxuICogTGVhdmUgdGhlIGN1cnJlbnQgYExWaWV3YFxuICpcbiAqIFRoaXMgcG9wcyB0aGUgYExGcmFtZWAgd2l0aCB0aGUgYXNzb2NpYXRlZCBgTFZpZXdgIGZyb20gdGhlIHN0YWNrLlxuICpcbiAqIElNUE9SVEFOVDogV2UgbXVzdCB6ZXJvIG91dCB0aGUgYExGcmFtZWAgdmFsdWVzIGhlcmUgb3RoZXJ3aXNlIHRoZXkgd2lsbCBiZSByZXRhaW5lZC4gVGhpcyBpc1xuICogYmVjYXVzZSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBkb24ndCByZWxlYXNlIGBMRnJhbWVgIGJ1dCByYXRoZXIga2VlcCBpdCBmb3IgbmV4dCB1c2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcoKSB7XG4gIGNvbnN0IG9sZExGcmFtZSA9IGxlYXZlVmlld0xpZ2h0KCk7XG4gIG9sZExGcmFtZS5pc1BhcmVudCA9IHRydWU7XG4gIG9sZExGcmFtZS50VmlldyA9IG51bGwhO1xuICBvbGRMRnJhbWUuc2VsZWN0ZWRJbmRleCA9IC0xO1xuICBvbGRMRnJhbWUuY29udGV4dExWaWV3ID0gbnVsbCE7XG4gIG9sZExGcmFtZS5lbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIG9sZExGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgb2xkTEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xuICBvbGRMRnJhbWUuYmluZGluZ1Jvb3RJbmRleCA9IC0xO1xuICBvbGRMRnJhbWUuYmluZGluZ0luZGV4ID0gLTE7XG4gIG9sZExGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dEltcGw8VCA9IGFueT4obGV2ZWw6IG51bWJlcik6IFQge1xuICBjb25zdCBjb250ZXh0TFZpZXcgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPVxuICAgICAgd2Fsa1VwVmlld3MobGV2ZWwsIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSE7XG4gICAgbmVzdGluZ0xldmVsLS07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRWaWV3O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50IGluZGV4LlxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRJbmRleCgpIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnNlbGVjdGVkSW5kZXg7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbW9zdCByZWNlbnQgaW5kZXggcGFzc2VkIHRvIHtAbGluayBzZWxlY3R9XG4gKlxuICogVXNlZCB3aXRoIHtAbGluayBwcm9wZXJ0eX0gaW5zdHJ1Y3Rpb24gKGFuZCBtb3JlIGluIHRoZSBmdXR1cmUpIHRvIGlkZW50aWZ5IHRoZSBpbmRleCBpbiB0aGVcbiAqIGN1cnJlbnQgYExWaWV3YCB0byBhY3Qgb24uXG4gKlxuICogKE5vdGUgdGhhdCBpZiBhbiBcImV4aXQgZnVuY3Rpb25cIiB3YXMgc2V0IGVhcmxpZXIgKHZpYSBgc2V0RWxlbWVudEV4aXRGbigpYCkgdGhlbiB0aGF0IHdpbGwgYmVcbiAqIHJ1biBpZiBhbmQgd2hlbiB0aGUgcHJvdmlkZWQgYGluZGV4YCB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgY3VycmVudCBzZWxlY3RlZCBpbmRleCB2YWx1ZS4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGluZGV4ICE9PSAtMSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGluZGV4LCBIRUFERVJfT0ZGU0VULCAnSW5kZXggbXVzdCBiZSBwYXN0IEhFQURFUl9PRkZTRVQgKG9yIC0xKS4nKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRMZXNzVGhhbihcbiAgICAgICAgICBpbmRleCwgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUubFZpZXcubGVuZ3RoLCAnQ2FuXFwndCBzZXQgaW5kZXggcGFzc2VkIGVuZCBvZiBMVmlldycpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgYHROb2RlYCB0aGF0IHJlcHJlc2VudHMgY3VycmVudGx5IHNlbGVjdGVkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RlZFROb2RlKCkge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGdldFROb2RlKGxGcmFtZS50VmlldywgbEZyYW1lLnNlbGVjdGVkSW5kZXgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlU1ZHKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gU1ZHX05BTUVTUEFDRTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSBNQVRIX01MX05BTUVTUEFDRTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTEludGVybmFsKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlO1xufVxuIl19