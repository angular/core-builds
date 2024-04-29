/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectFlags } from '../di/interface/injector';
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertLessThan, assertNotEqual, throwError, } from '../util/assert';
import { assertLViewOrUndefined, assertTNodeForLView, assertTNodeForTView } from './assert';
import { CONTEXT, DECLARATION_VIEW, HEADER_OFFSET, T_HOST, TVIEW, } from './interfaces/view';
import { MATH_ML_NAMESPACE, SVG_NAMESPACE } from './namespaces';
import { getTNode, walkUpViews } from './util/view_utils';
const instructionState = {
    lFrame: createLFrame(null),
    bindingsEnabled: true,
    skipHydrationRootTNode: null,
};
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 *
 * The `checkNoChanges` function is invoked only in ngDevMode=true and verifies that no unintended
 * changes exist in the change detector or its children.
 */
let _isInCheckNoChangesMode = false;
/**
 * Flag used to indicate that we are in the middle running change detection on a view
 *
 * @see detectChangesInViewWhileDirty
 */
let _isRefreshingViews = false;
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
 * Returns true if currently inside a skip hydration block.
 * @returns boolean
 */
export function isInSkipHydrationBlock() {
    return instructionState.skipHydrationRootTNode !== null;
}
/**
 * Returns true if this is the root TNode of the skip hydration block.
 * @param tNode the current TNode
 * @returns boolean
 */
export function isSkipHydrationRootTNode(tNode) {
    return instructionState.skipHydrationRootTNode === tNode;
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
 * Sets a flag to specify that the TNode is in a skip hydration block.
 * @param tNode the current TNode
 */
export function enterSkipHydrationBlock(tNode) {
    instructionState.skipHydrationRootTNode = tNode;
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
 * Clears the root skip hydration node when leaving a skip hydration block.
 */
export function leaveSkipHydrationBlock() {
    instructionState.skipHydrationRootTNode = null;
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
 * @returns Context of the restored OpaqueViewState instance.
 *
 * @codeGenApi
 */
export function ɵɵrestoreView(viewToRestore) {
    instructionState.lFrame.contextLView = viewToRestore;
    return viewToRestore[CONTEXT];
}
/**
 * Clears the view set in `ɵɵrestoreView` from memory. Returns the passed in
 * value so that it can be used as a return value of an instruction.
 *
 * @codeGenApi
 */
export function ɵɵresetView(value) {
    instructionState.lFrame.contextLView = null;
    return value;
}
export function getCurrentTNode() {
    let currentTNode = getCurrentTNodePlaceholderOk();
    while (currentTNode !== null && currentTNode.type === 64 /* TNodeType.Placeholder */) {
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
export function getContextLView() {
    const contextLView = instructionState.lFrame.contextLView;
    ngDevMode && assertDefined(contextLView, 'contextLView must be defined.');
    return contextLView;
}
export function isInCheckNoChangesMode() {
    !ngDevMode && throwError('Must never be called in production mode');
    return _isInCheckNoChangesMode;
}
export function setIsInCheckNoChangesMode(mode) {
    !ngDevMode && throwError('Must never be called in production mode');
    _isInCheckNoChangesMode = mode;
}
export function isRefreshingViews() {
    return _isRefreshingViews;
}
export function setIsRefreshingViews(mode) {
    _isRefreshingViews = mode;
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
    return (instructionState.lFrame.bindingIndex = value);
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
 * Returns a `TNode` of the location where the current `LView` is declared at.
 *
 * @param lView an `LView` that we want to find parent `TNode` for.
 */
function getDeclarationTNode(lView) {
    const tView = lView[TVIEW];
    // Return the declaration parent for embedded views
    if (tView.type === 2 /* TViewType.Embedded */) {
        ngDevMode && assertDefined(tView.declTNode, 'Embedded TNodes should have declaration parents.');
        return tView.declTNode;
    }
    // Components don't have `TView.declTNode` because each instance of component could be
    // inserted in different location, hence `TView.declTNode` is meaningless.
    // Falling back to `T_HOST` in case we cross component boundary.
    if (tView.type === 1 /* TViewType.Component */) {
        return lView[T_HOST];
    }
    // Remaining TNode type is `TViewType.Root` which doesn't have a parent TNode.
    return null;
}
/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 *
 * @param lView `LView` location of the DI context.
 * @param tNode `TNode` for DI context
 * @param flags DI context flags. if `SkipSelf` flag is set than we walk up the declaration
 *     tree from `tNode`  until we find parent declared `TElementNode`.
 * @returns `true` if we have successfully entered DI associated with `tNode` (or with declared
 *     `TNode` if `flags` has  `SkipSelf`). Failing to enter DI implies that no associated
 *     `NodeInjector` can be found and we should instead use `ModuleInjector`.
 *     - If `true` than this call must be fallowed by `leaveDI`
 *     - If `false` than this call failed and we should NOT call `leaveDI`
 */
export function enterDI(lView, tNode, flags) {
    ngDevMode && assertLViewOrUndefined(lView);
    if (flags & InjectFlags.SkipSelf) {
        ngDevMode && assertTNodeForTView(tNode, lView[TVIEW]);
        let parentTNode = tNode;
        let parentLView = lView;
        while (true) {
            ngDevMode && assertDefined(parentTNode, 'Parent TNode should be defined');
            parentTNode = parentTNode.parent;
            if (parentTNode === null && !(flags & InjectFlags.Host)) {
                parentTNode = getDeclarationTNode(parentLView);
                if (parentTNode === null)
                    break;
                // In this case, a parent exists and is definitely an element. So it will definitely
                // have an existing lView as the declaration view, which is why we can assume it's defined.
                ngDevMode && assertDefined(parentLView, 'Parent LView should be defined');
                parentLView = parentLView[DECLARATION_VIEW];
                // In Ivy there are Comment nodes that correspond to ngIf and NgFor embedded directives
                // We want to skip those and look only at Elements and ElementContainers to ensure
                // we're looking at true parent nodes, and not content or other types.
                if (parentTNode.type & (2 /* TNodeType.Element */ | 8 /* TNodeType.ElementContainer */)) {
                    break;
                }
            }
            else {
                break;
            }
        }
        if (parentTNode === null) {
            // If we failed to find a parent TNode this means that we should use module injector.
            return false;
        }
        else {
            tNode = parentTNode;
            lView = parentLView;
        }
    }
    ngDevMode && assertTNodeForLView(tNode, lView);
    const lFrame = (instructionState.lFrame = allocLFrame());
    lFrame.currentTNode = tNode;
    lFrame.lView = lView;
    return true;
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
    const contextLView = (instructionState.lFrame.contextLView = walkUpViews(level, instructionState.lFrame.contextLView));
    return contextLView[CONTEXT];
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
    ngDevMode &&
        index !== -1 &&
        assertGreaterThanOrEqual(index, HEADER_OFFSET, 'Index must be past HEADER_OFFSET (or -1).');
    ngDevMode &&
        assertLessThan(index, instructionState.lFrame.lView.length, "Can't set index passed end of LView");
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
let _wasLastNodeCreated = true;
/**
 * Retrieves a global flag that indicates whether the most recent DOM node
 * was created or hydrated.
 */
export function wasLastNodeCreated() {
    return _wasLastNodeCreated;
}
/**
 * Sets a global flag to indicate whether the most recent DOM node
 * was created or hydrated.
 */
export function lastNodeWasCreated(flag) {
    _wasLastNodeCreated = flag;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLEVBQ0wsYUFBYSxFQUNiLFdBQVcsRUFDWCx3QkFBd0IsRUFDeEIsY0FBYyxFQUNkLGNBQWMsRUFDZCxVQUFVLEdBQ1gsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUMsc0JBQXNCLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHMUYsT0FBTyxFQUNMLE9BQU8sRUFDUCxnQkFBZ0IsRUFDaEIsYUFBYSxFQUdiLE1BQU0sRUFFTixLQUFLLEdBR04sTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzlELE9BQU8sRUFBQyxRQUFRLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUEwS3hELE1BQU0sZ0JBQWdCLEdBQXFCO0lBQ3pDLE1BQU0sRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQzFCLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLHNCQUFzQixFQUFFLElBQUk7Q0FDN0IsQ0FBQztBQUVGOzs7Ozs7O0dBT0c7QUFDSCxJQUFJLHVCQUF1QixHQUFHLEtBQUssQ0FBQztBQUVwQzs7OztHQUlHO0FBQ0gsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7QUFFL0I7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSwrQkFBK0I7SUFDN0MsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQztBQUNqRCxDQUFDO0FBRUQsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLGdCQUFn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QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDbEQsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZO0lBQzFCLE9BQU8sZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQ2xELENBQUM7QUFFRCxJQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQztBQUUvQjs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCO0lBQ2hDLE9BQU8sbUJBQW1CLENBQUM7QUFDN0IsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxJQUFhO0lBQzlDLG1CQUFtQixHQUFHLElBQUksQ0FBQztBQUM3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1xuICBhc3NlcnREZWZpbmVkLFxuICBhc3NlcnRFcXVhbCxcbiAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLFxuICBhc3NlcnRMZXNzVGhhbixcbiAgYXNzZXJ0Tm90RXF1YWwsXG4gIHRocm93RXJyb3IsXG59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMVmlld09yVW5kZWZpbmVkLCBhc3NlcnRUTm9kZUZvckxWaWV3LCBhc3NlcnRUTm9kZUZvclRWaWV3fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1xuICBDT05URVhULFxuICBERUNMQVJBVElPTl9WSUVXLFxuICBIRUFERVJfT0ZGU0VULFxuICBMVmlldyxcbiAgT3BhcXVlVmlld1N0YXRlLFxuICBUX0hPU1QsXG4gIFREYXRhLFxuICBUVklFVyxcbiAgVFZpZXcsXG4gIFRWaWV3VHlwZSxcbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtNQVRIX01MX05BTUVTUEFDRSwgU1ZHX05BTUVTUEFDRX0gZnJvbSAnLi9uYW1lc3BhY2VzJztcbmltcG9ydCB7Z2V0VE5vZGUsIHdhbGtVcFZpZXdzfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbi8qKlxuICpcbiAqL1xuaW50ZXJmYWNlIExGcmFtZSB7XG4gIC8qKlxuICAgKiBQYXJlbnQgTEZyYW1lLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCB3aGVuIGBsZWF2ZVZpZXdgIGlzIGNhbGxlZCB0byByZXN0b3JlIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgICovXG4gIHBhcmVudDogTEZyYW1lO1xuXG4gIC8qKlxuICAgKiBDaGlsZCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjYWNoZSBleGlzdGluZyBMRnJhbWVzIHRvIHJlbGlldmUgdGhlIG1lbW9yeSBwcmVzc3VyZS5cbiAgICovXG4gIGNoaWxkOiBMRnJhbWUgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAgICpcbiAgICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAgICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gICAqL1xuICBsVmlldzogTFZpZXc7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIGBMRnJhbWUubFZpZXdgLlxuICAgKlxuICAgKiBPbmUgY2FuIGdldCBgVFZpZXdgIGZyb20gYGxGcmFtZVtUVklFV11gIGhvd2V2ZXIgYmVjYXVzZSBpdCBpcyBzbyBjb21tb24gaXQgbWFrZXMgc2Vuc2UgdG9cbiAgICogc3RvcmUgaXQgaW4gYExGcmFtZWAgZm9yIHBlcmYgcmVhc29ucy5cbiAgICovXG4gIHRWaWV3OiBUVmlldztcblxuICAvKipcbiAgICogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkIGFuZCB0cmFjayBxdWVyeSByZXN1bHRzLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBgaXNQYXJlbnRgLlxuICAgKi9cbiAgY3VycmVudFROb2RlOiBUTm9kZSB8IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIGBpc1BhcmVudGAgaXM6XG4gICAqICAtIGB0cnVlYDogdGhlbiBgY3VycmVudFROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAgICogIC0gYGZhbHNlYDogdGhlbiBgY3VycmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gICAqL1xuICBpc1BhcmVudDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSW5kZXggb2YgY3VycmVudGx5IHNlbGVjdGVkIGVsZW1lbnQgaW4gTFZpZXcuXG4gICAqXG4gICAqIFVzZWQgYnkgYmluZGluZyBpbnN0cnVjdGlvbnMuIFVwZGF0ZWQgYXMgcGFydCBvZiBhZHZhbmNlIGluc3RydWN0aW9uLlxuICAgKi9cbiAgc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHBvaW50ZXIgdG8gdGhlIGJpbmRpbmcgaW5kZXguXG4gICAqL1xuICBiaW5kaW5nSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGxhc3Qgdmlld0RhdGEgcmV0cmlldmVkIGJ5IG5leHRDb250ZXh0KCkuXG4gICAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAgICpcbiAgICogZS5nLiBjb25zdCBpbm5lciA9IHgoKS4kaW1wbGljaXQ7IGNvbnN0IG91dGVyID0geCgpLiRpbXBsaWNpdDtcbiAgICovXG4gIGNvbnRleHRMVmlldzogTFZpZXcgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICAgKiBzbyB0aGF0IHdlIGNhbiB0aGVuIGF0dGFjaCBwYXRjaCBkYXRhIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy4gV2Uga25vdyB0aGF0IHRob3NlXG4gICAqIGFyZSB0aGUgb25seSBwbGFjZXMgd2hlcmUgdGhlIHBhdGNoIGRhdGEgY291bGQgY2hhbmdlLCB0aGlzIHdheSB3ZSB3aWxsIHNhdmUgb24gbnVtYmVyXG4gICAqIG9mIHBsYWNlcyB3aGVyZSB0aGEgcGF0Y2hpbmcgb2NjdXJzLlxuICAgKi9cbiAgZWxlbWVudERlcHRoQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBuYW1lc3BhY2UgdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGVsZW1lbnRzXG4gICAqL1xuICBjdXJyZW50TmFtZXNwYWNlOiBzdHJpbmcgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBpbmRleCBmcm9tIHdoaWNoIHB1cmUgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zIHNob3VsZCBjYWxjdWxhdGUgdGhlaXIgYmluZGluZ1xuICAgKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gICAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICsgYW55IGRpcnMvaG9zdFZhcnMgYmVmb3JlIHRoZSBnaXZlbiBkaXIuXG4gICAqL1xuICBiaW5kaW5nUm9vdEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgaW5kZXggb2YgYSBWaWV3IG9yIENvbnRlbnQgUXVlcnkgd2hpY2ggbmVlZHMgdG8gYmUgcHJvY2Vzc2VkIG5leHQuXG4gICAqIFdlIGl0ZXJhdGUgb3ZlciB0aGUgbGlzdCBvZiBRdWVyaWVzIGFuZCBpbmNyZW1lbnQgY3VycmVudCBxdWVyeSBpbmRleCBhdCBldmVyeSBzdGVwLlxuICAgKi9cbiAgY3VycmVudFF1ZXJ5SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogV2hlbiBob3N0IGJpbmRpbmcgaXMgZXhlY3V0aW5nIHRoaXMgcG9pbnRzIHRvIHRoZSBkaXJlY3RpdmUgaW5kZXguXG4gICAqIGBUVmlldy5kYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIGlzIGBEaXJlY3RpdmVEZWZgXG4gICAqIGBMVmlld1tjdXJyZW50RGlyZWN0aXZlSW5kZXhdYCBpcyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAqL1xuICBjdXJyZW50RGlyZWN0aXZlSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQXJlIHdlIGN1cnJlbnRseSBpbiBpMThuIGJsb2NrIGFzIGRlbm90ZWQgYnkgYMm1ybVlbGVtZW50U3RhcnRgIGFuZCBgybXJtWVsZW1lbnRFbmRgLlxuICAgKlxuICAgKiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCBiZWNhdXNlIHdoaWxlIHdlIGFyZSBpbiBpMThuIGJsb2NrIGFsbCBlbGVtZW50cyBtdXN0IGJlIHByZS1kZWNsYXJlZFxuICAgKiBpbiB0aGUgdHJhbnNsYXRpb24uIChpLmUuIGBIZWxsbyDvv70jMu+/vVdvcmxk77+9LyMy77+9IWAgcHJlLWRlY2xhcmVzIGVsZW1lbnQgYXQgYO+/vSMy77+9YCBsb2NhdGlvbi4pXG4gICAqIFRoaXMgYWxsb2NhdGVzIGBUTm9kZVR5cGUuUGxhY2Vob2xkZXJgIGVsZW1lbnQgYXQgbG9jYXRpb24gYDJgLiBJZiB0cmFuc2xhdG9yIHJlbW92ZXMgYO+/vSMy77+9YFxuICAgKiBmcm9tIHRyYW5zbGF0aW9uIHRoYW4gdGhlIHJ1bnRpbWUgbXVzdCBhbHNvIGVuc3VyZSB0aGEgZWxlbWVudCBhdCBgMmAgZG9lcyBub3QgZ2V0IGluc2VydGVkXG4gICAqIGludG8gdGhlIERPTS4gVGhlIHRyYW5zbGF0aW9uIGRvZXMgbm90IGNhcnJ5IGluZm9ybWF0aW9uIGFib3V0IGRlbGV0ZWQgZWxlbWVudHMuIFRoZXJlZm9yIHRoZVxuICAgKiBvbmx5IHdheSB0byBrbm93IHRoYXQgYW4gZWxlbWVudCBpcyBkZWxldGVkIGlzIHRoYXQgaXQgd2FzIG5vdCBwcmUtZGVjbGFyZWQgaW4gdGhlIHRyYW5zbGF0aW9uLlxuICAgKlxuICAgKiBUaGlzIGZsYWcgd29ya3MgYnkgZW5zdXJpbmcgdGhhdCBlbGVtZW50cyB3aGljaCBhcmUgY3JlYXRlZCB3aXRob3V0IHByZS1kZWNsYXJhdGlvblxuICAgKiAoYFROb2RlVHlwZS5QbGFjZWhvbGRlcmApIGFyZSBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NIHJlbmRlciB0cmVlLiAoSXQgZG9lcyBtZWFuIHRoYXQgdGhlXG4gICAqIGVsZW1lbnQgc3RpbGwgZ2V0cyBpbnN0YW50aWF0ZWQgYWxvbmcgd2l0aCBhbGwgb2YgaXRzIGJlaGF2aW9yIFtkaXJlY3RpdmVzXSlcbiAgICovXG4gIGluSTE4bjogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBbGwgaW1wbGljaXQgaW5zdHJ1Y3Rpb24gc3RhdGUgaXMgc3RvcmVkIGhlcmUuXG4gKlxuICogSXQgaXMgdXNlZnVsIHRvIGhhdmUgYSBzaW5nbGUgb2JqZWN0IHdoZXJlIGFsbCBvZiB0aGUgc3RhdGUgaXMgc3RvcmVkIGFzIGEgbWVudGFsIG1vZGVsXG4gKiAocmF0aGVyIGl0IGJlaW5nIHNwcmVhZCBhY3Jvc3MgbWFueSBkaWZmZXJlbnQgdmFyaWFibGVzLilcbiAqXG4gKiBQRVJGIE5PVEU6IFR1cm5zIG91dCB0aGF0IHdyaXRpbmcgdG8gYSB0cnVlIGdsb2JhbCB2YXJpYWJsZSBpcyBzbG93ZXIgdGhhblxuICogaGF2aW5nIGFuIGludGVybWVkaWF0ZSBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzLlxuICovXG5pbnRlcmZhY2UgSW5zdHJ1Y3Rpb25TdGF0ZSB7XG4gIC8qKlxuICAgKiBDdXJyZW50IGBMRnJhbWVgXG4gICAqXG4gICAqIGBudWxsYCBpZiB3ZSBoYXZlIG5vdCBjYWxsZWQgYGVudGVyVmlld2BcbiAgICovXG4gIGxGcmFtZTogTEZyYW1lO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgd2hldGhlciBkaXJlY3RpdmVzIHNob3VsZCBiZSBtYXRjaGVkIHRvIGVsZW1lbnRzLlxuICAgKlxuICAgKiBXaGVuIHRlbXBsYXRlIGNvbnRhaW5zIGBuZ05vbkJpbmRhYmxlYCB0aGVuIHdlIG5lZWQgdG8gcHJldmVudCB0aGUgcnVudGltZSBmcm9tIG1hdGNoaW5nXG4gICAqIGRpcmVjdGl2ZXMgb24gY2hpbGRyZW4gb2YgdGhhdCBlbGVtZW50LlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBgYGBcbiAgICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICAgKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gICAqIDwvbXktY29tcD5cbiAgICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICAgKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAgICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gICAqICAgPC9teS1jb21wPlxuICAgKiA8L2Rpdj5cbiAgICogYGBgXG4gICAqL1xuICBiaW5kaW5nc0VuYWJsZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgcm9vdCBUTm9kZSB0aGF0IGhhcyB0aGUgJ25nU2tpcEh5ZHJhdGlvbicgYXR0cmlidXRlIG9uIGl0IGZvciBsYXRlciByZWZlcmVuY2UuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiA8bXktY29tcCBuZ1NraXBIeWRyYXRpb24+XG4gICAqICAgU2hvdWxkIHJlZmVyZW5jZSB0aGlzIHJvb3Qgbm9kZVxuICAgKiA8L215LWNvbXA+XG4gICAqIGBgYFxuICAgKi9cbiAgc2tpcEh5ZHJhdGlvblJvb3RUTm9kZTogVE5vZGUgfCBudWxsO1xufVxuXG5jb25zdCBpbnN0cnVjdGlvblN0YXRlOiBJbnN0cnVjdGlvblN0YXRlID0ge1xuICBsRnJhbWU6IGNyZWF0ZUxGcmFtZShudWxsKSxcbiAgYmluZGluZ3NFbmFibGVkOiB0cnVlLFxuICBza2lwSHlkcmF0aW9uUm9vdFROb2RlOiBudWxsLFxufTtcblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqXG4gKiBUaGUgYGNoZWNrTm9DaGFuZ2VzYCBmdW5jdGlvbiBpcyBpbnZva2VkIG9ubHkgaW4gbmdEZXZNb2RlPXRydWUgYW5kIHZlcmlmaWVzIHRoYXQgbm8gdW5pbnRlbmRlZFxuICogY2hhbmdlcyBleGlzdCBpbiB0aGUgY2hhbmdlIGRldGVjdG9yIG9yIGl0cyBjaGlsZHJlbi5cbiAqL1xubGV0IF9pc0luQ2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbi8qKlxuICogRmxhZyB1c2VkIHRvIGluZGljYXRlIHRoYXQgd2UgYXJlIGluIHRoZSBtaWRkbGUgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgdmlld1xuICpcbiAqIEBzZWUgZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHlcbiAqL1xubGV0IF9pc1JlZnJlc2hpbmdWaWV3cyA9IGZhbHNlO1xuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgaW5zdHJ1Y3Rpb24gc3RhdGUgc3RhY2sgaXMgZW1wdHkuXG4gKlxuICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIGZyb20gdGVzdHMgb25seSAodHJlZSBzaGFrZW4gb3RoZXJ3aXNlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwZWNPbmx5SXNJbnN0cnVjdGlvblN0YXRlRW1wdHkoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wYXJlbnQgPT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmVsZW1lbnREZXB0aENvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgY3VycmVudGx5IGluc2lkZSBhIHNraXAgaHlkcmF0aW9uIGJsb2NrLlxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJblNraXBIeWRyYXRpb25CbG9jaygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuc2tpcEh5ZHJhdGlvblJvb3RUTm9kZSAhPT0gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhpcyBpcyB0aGUgcm9vdCBUTm9kZSBvZiB0aGUgc2tpcCBoeWRyYXRpb24gYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgdGhlIGN1cnJlbnQgVE5vZGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2tpcEh5ZHJhdGlvblJvb3RUTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuc2tpcEh5ZHJhdGlvblJvb3RUTm9kZSA9PT0gdE5vZGU7XG59XG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIFNldHMgYSBmbGFnIHRvIHNwZWNpZnkgdGhhdCB0aGUgVE5vZGUgaXMgaW4gYSBza2lwIGh5ZHJhdGlvbiBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCBUTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJTa2lwSHlkcmF0aW9uQmxvY2sodE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUuc2tpcEh5ZHJhdGlvblJvb3RUTm9kZSA9IHROb2RlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIENsZWFycyB0aGUgcm9vdCBza2lwIGh5ZHJhdGlvbiBub2RlIHdoZW4gbGVhdmluZyBhIHNraXAgaHlkcmF0aW9uIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVTa2lwSHlkcmF0aW9uQmxvY2soKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUuc2tpcEh5ZHJhdGlvblJvb3RUTm9kZSA9IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGBMVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlldzxUPigpOiBMVmlldzxUPiB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5sVmlldyBhcyBMVmlldzxUPjtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRWaWV3KCk6IFRWaWV3IHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnRWaWV3O1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICogQHJldHVybnMgQ29udGV4dCBvZiB0aGUgcmVzdG9yZWQgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzdG9yZVZpZXc8VCA9IGFueT4odmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKTogVCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xuICByZXR1cm4gKHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3KVtDT05URVhUXSBhcyB1bmtub3duIGFzIFQ7XG59XG5cbi8qKlxuICogQ2xlYXJzIHRoZSB2aWV3IHNldCBpbiBgybXJtXJlc3RvcmVWaWV3YCBmcm9tIG1lbW9yeS4gUmV0dXJucyB0aGUgcGFzc2VkIGluXG4gKiB2YWx1ZSBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGFzIGEgcmV0dXJuIHZhbHVlIG9mIGFuIGluc3RydWN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzZXRWaWV3PFQ+KHZhbHVlPzogVCk6IFQgfCB1bmRlZmluZWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXcgPSBudWxsO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VE5vZGUoKTogVE5vZGUgfCBudWxsIHtcbiAgbGV0IGN1cnJlbnRUTm9kZSA9IGdldEN1cnJlbnRUTm9kZVBsYWNlaG9sZGVyT2soKTtcbiAgd2hpbGUgKGN1cnJlbnRUTm9kZSAhPT0gbnVsbCAmJiBjdXJyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlBsYWNlaG9sZGVyKSB7XG4gICAgY3VycmVudFROb2RlID0gY3VycmVudFROb2RlLnBhcmVudDtcbiAgfVxuICByZXR1cm4gY3VycmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaygpOiBUTm9kZSB8IG51bGwge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFBhcmVudFROb2RlKCk6IFROb2RlIHwgbnVsbCB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBjdXJyZW50VE5vZGUgPSBsRnJhbWUuY3VycmVudFROb2RlO1xuICByZXR1cm4gbEZyYW1lLmlzUGFyZW50ID8gY3VycmVudFROb2RlIDogY3VycmVudFROb2RlIS5wYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50VE5vZGUodE5vZGU6IFROb2RlIHwgbnVsbCwgaXNQYXJlbnQ6IGJvb2xlYW4pIHtcbiAgbmdEZXZNb2RlICYmIHROb2RlICYmIGFzc2VydFROb2RlRm9yVFZpZXcodE5vZGUsIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnRWaWV3KTtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGxGcmFtZS5jdXJyZW50VE5vZGUgPSB0Tm9kZTtcbiAgbEZyYW1lLmlzUGFyZW50ID0gaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0N1cnJlbnRUTm9kZVBhcmVudCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFROb2RlQXNOb3RQYXJlbnQoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250ZXh0TFZpZXcoKTogTFZpZXcge1xuICBjb25zdCBjb250ZXh0TFZpZXcgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXc7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbnRleHRMVmlldywgJ2NvbnRleHRMVmlldyBtdXN0IGJlIGRlZmluZWQuJyk7XG4gIHJldHVybiBjb250ZXh0TFZpZXchO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpOiBib29sZWFuIHtcbiAgIW5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdNdXN0IG5ldmVyIGJlIGNhbGxlZCBpbiBwcm9kdWN0aW9uIG1vZGUnKTtcbiAgcmV0dXJuIF9pc0luQ2hlY2tOb0NoYW5nZXNNb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShtb2RlOiBib29sZWFuKTogdm9pZCB7XG4gICFuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcignTXVzdCBuZXZlciBiZSBjYWxsZWQgaW4gcHJvZHVjdGlvbiBtb2RlJyk7XG4gIF9pc0luQ2hlY2tOb0NoYW5nZXNNb2RlID0gbW9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVmcmVzaGluZ1ZpZXdzKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gX2lzUmVmcmVzaGluZ1ZpZXdzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNSZWZyZXNoaW5nVmlld3MobW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBfaXNSZWZyZXNoaW5nVmlld3MgPSBtb2RlO1xufVxuXG4vLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1Jvb3QoKSB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBsZXQgaW5kZXggPSBsRnJhbWUuYmluZGluZ1Jvb3RJbmRleDtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIGluZGV4ID0gbEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSBsRnJhbWUudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ0luZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nSW5kZXgodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4ID0gdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV4dEJpbmRpbmdJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4Kys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoY291bnQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBpbmRleCA9IGxGcmFtZS5iaW5kaW5nSW5kZXg7XG4gIGxGcmFtZS5iaW5kaW5nSW5kZXggPSBsRnJhbWUuYmluZGluZ0luZGV4ICsgY291bnQ7XG4gIHJldHVybiBpbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5JMThuQmxvY2soKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5pbkkxOG47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbkkxOG5CbG9jayhpc0luSTE4bkJsb2NrOiBib29sZWFuKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmluSTE4biA9IGlzSW5JMThuQmxvY2s7XG59XG5cbi8qKlxuICogU2V0IGEgbmV3IGJpbmRpbmcgcm9vdCBpbmRleCBzbyB0aGF0IGhvc3QgdGVtcGxhdGUgZnVuY3Rpb25zIGNhbiBleGVjdXRlLlxuICpcbiAqIEJpbmRpbmdzIGluc2lkZSB0aGUgaG9zdCB0ZW1wbGF0ZSBhcmUgMCBpbmRleC4gQnV0IGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBhaGVhZCBvZiB0aW1lXG4gKiBob3cgbWFueSBob3N0IGJpbmRpbmdzIHdlIGhhdmUgd2UgY2FuJ3QgcHJlLWNvbXB1dGUgdGhlbS4gRm9yIHRoaXMgcmVhc29uIHRoZXkgYXJlIGFsbFxuICogMCBpbmRleCBhbmQgd2UganVzdCBzaGlmdCB0aGUgcm9vdCBzbyB0aGF0IHRoZXkgbWF0Y2ggbmV4dCBhdmFpbGFibGUgbG9jYXRpb24gaW4gdGhlIExWaWV3LlxuICpcbiAqIEBwYXJhbSBiaW5kaW5nUm9vdEluZGV4IFJvb3QgaW5kZXggZm9yIGBob3N0QmluZGluZ3NgXG4gKiBAcGFyYW0gY3VycmVudERpcmVjdGl2ZUluZGV4IGBURGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdYCB3aWxsIHBvaW50IHRvIHRoZSBjdXJyZW50IGRpcmVjdGl2ZVxuICogICAgICAgIHdob3NlIGBob3N0QmluZGluZ3NgIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncyhcbiAgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyLFxuICBjdXJyZW50RGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbikge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgbEZyYW1lLmJpbmRpbmdJbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KGN1cnJlbnREaXJlY3RpdmVJbmRleCk7XG59XG5cbi8qKlxuICogV2hlbiBob3N0IGJpbmRpbmcgaXMgZXhlY3V0aW5nIHRoaXMgcG9pbnRzIHRvIHRoZSBkaXJlY3RpdmUgaW5kZXguXG4gKiBgVFZpZXcuZGF0YVtnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKV1gIGlzIGBEaXJlY3RpdmVEZWZgXG4gKiBgTFZpZXdbZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCldYCBpcyBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleDtcbn1cblxuLyoqXG4gKiBTZXRzIGFuIGluZGV4IG9mIGEgZGlyZWN0aXZlIHdob3NlIGBob3N0QmluZGluZ3NgIGFyZSBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQHBhcmFtIGN1cnJlbnREaXJlY3RpdmVJbmRleCBgVERhdGFgIGluZGV4IHdoZXJlIGN1cnJlbnQgZGlyZWN0aXZlIGluc3RhbmNlIGNhbiBiZSBmb3VuZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXggPSBjdXJyZW50RGlyZWN0aXZlSW5kZXg7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGN1cnJlbnQgYERpcmVjdGl2ZURlZmAgd2hpY2ggaXMgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nc2AgaW5zdHJ1Y3Rpb24gaXMgYmVpbmdcbiAqIGV4ZWN1dGVkLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBDdXJyZW50IGBURGF0YWAgd2hlcmUgdGhlIGBEaXJlY3RpdmVEZWZgIHdpbGwgYmUgbG9va2VkIHVwIGF0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudERpcmVjdGl2ZURlZih0RGF0YTogVERhdGEpOiBEaXJlY3RpdmVEZWY8YW55PiB8IG51bGwge1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50RGlyZWN0aXZlSW5kZXg7XG4gIHJldHVybiBjdXJyZW50RGlyZWN0aXZlSW5kZXggPT09IC0xID8gbnVsbCA6ICh0RGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyeUluZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRRdWVyeUluZGV4KHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgYFROb2RlYCBvZiB0aGUgbG9jYXRpb24gd2hlcmUgdGhlIGN1cnJlbnQgYExWaWV3YCBpcyBkZWNsYXJlZCBhdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgYW4gYExWaWV3YCB0aGF0IHdlIHdhbnQgdG8gZmluZCBwYXJlbnQgYFROb2RlYCBmb3IuXG4gKi9cbmZ1bmN0aW9uIGdldERlY2xhcmF0aW9uVE5vZGUobFZpZXc6IExWaWV3KTogVE5vZGUgfCBudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgLy8gUmV0dXJuIHRoZSBkZWNsYXJhdGlvbiBwYXJlbnQgZm9yIGVtYmVkZGVkIHZpZXdzXG4gIGlmICh0Vmlldy50eXBlID09PSBUVmlld1R5cGUuRW1iZWRkZWQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Vmlldy5kZWNsVE5vZGUsICdFbWJlZGRlZCBUTm9kZXMgc2hvdWxkIGhhdmUgZGVjbGFyYXRpb24gcGFyZW50cy4nKTtcbiAgICByZXR1cm4gdFZpZXcuZGVjbFROb2RlO1xuICB9XG5cbiAgLy8gQ29tcG9uZW50cyBkb24ndCBoYXZlIGBUVmlldy5kZWNsVE5vZGVgIGJlY2F1c2UgZWFjaCBpbnN0YW5jZSBvZiBjb21wb25lbnQgY291bGQgYmVcbiAgLy8gaW5zZXJ0ZWQgaW4gZGlmZmVyZW50IGxvY2F0aW9uLCBoZW5jZSBgVFZpZXcuZGVjbFROb2RlYCBpcyBtZWFuaW5nbGVzcy5cbiAgLy8gRmFsbGluZyBiYWNrIHRvIGBUX0hPU1RgIGluIGNhc2Ugd2UgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJ5LlxuICBpZiAodFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgIHJldHVybiBsVmlld1tUX0hPU1RdO1xuICB9XG5cbiAgLy8gUmVtYWluaW5nIFROb2RlIHR5cGUgaXMgYFRWaWV3VHlwZS5Sb290YCB3aGljaCBkb2Vzbid0IGhhdmUgYSBwYXJlbnQgVE5vZGUuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFRoaXMgaXMgYSBsaWdodCB3ZWlnaHQgdmVyc2lvbiBvZiB0aGUgYGVudGVyVmlld2Agd2hpY2ggaXMgbmVlZGVkIGJ5IHRoZSBESSBzeXN0ZW0uXG4gKlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgbG9jYXRpb24gb2YgdGhlIERJIGNvbnRleHQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBmb3IgREkgY29udGV4dFxuICogQHBhcmFtIGZsYWdzIERJIGNvbnRleHQgZmxhZ3MuIGlmIGBTa2lwU2VsZmAgZmxhZyBpcyBzZXQgdGhhbiB3ZSB3YWxrIHVwIHRoZSBkZWNsYXJhdGlvblxuICogICAgIHRyZWUgZnJvbSBgdE5vZGVgICB1bnRpbCB3ZSBmaW5kIHBhcmVudCBkZWNsYXJlZCBgVEVsZW1lbnROb2RlYC5cbiAqIEByZXR1cm5zIGB0cnVlYCBpZiB3ZSBoYXZlIHN1Y2Nlc3NmdWxseSBlbnRlcmVkIERJIGFzc29jaWF0ZWQgd2l0aCBgdE5vZGVgIChvciB3aXRoIGRlY2xhcmVkXG4gKiAgICAgYFROb2RlYCBpZiBgZmxhZ3NgIGhhcyAgYFNraXBTZWxmYCkuIEZhaWxpbmcgdG8gZW50ZXIgREkgaW1wbGllcyB0aGF0IG5vIGFzc29jaWF0ZWRcbiAqICAgICBgTm9kZUluamVjdG9yYCBjYW4gYmUgZm91bmQgYW5kIHdlIHNob3VsZCBpbnN0ZWFkIHVzZSBgTW9kdWxlSW5qZWN0b3JgLlxuICogICAgIC0gSWYgYHRydWVgIHRoYW4gdGhpcyBjYWxsIG11c3QgYmUgZmFsbG93ZWQgYnkgYGxlYXZlRElgXG4gKiAgICAgLSBJZiBgZmFsc2VgIHRoYW4gdGhpcyBjYWxsIGZhaWxlZCBhbmQgd2Ugc2hvdWxkIE5PVCBjYWxsIGBsZWF2ZURJYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJESShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgZmxhZ3M6IEluamVjdEZsYWdzKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKGxWaWV3KTtcblxuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHROb2RlLCBsVmlld1tUVklFV10pO1xuXG4gICAgbGV0IHBhcmVudFROb2RlID0gdE5vZGUgYXMgVE5vZGUgfCBudWxsO1xuICAgIGxldCBwYXJlbnRMVmlldyA9IGxWaWV3O1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudFROb2RlLCAnUGFyZW50IFROb2RlIHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICBwYXJlbnRUTm9kZSA9IHBhcmVudFROb2RlIS5wYXJlbnQgYXMgVE5vZGUgfCBudWxsO1xuICAgICAgaWYgKHBhcmVudFROb2RlID09PSBudWxsICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0KSkge1xuICAgICAgICBwYXJlbnRUTm9kZSA9IGdldERlY2xhcmF0aW9uVE5vZGUocGFyZW50TFZpZXcpO1xuICAgICAgICBpZiAocGFyZW50VE5vZGUgPT09IG51bGwpIGJyZWFrO1xuXG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSwgYSBwYXJlbnQgZXhpc3RzIGFuZCBpcyBkZWZpbml0ZWx5IGFuIGVsZW1lbnQuIFNvIGl0IHdpbGwgZGVmaW5pdGVseVxuICAgICAgICAvLyBoYXZlIGFuIGV4aXN0aW5nIGxWaWV3IGFzIHRoZSBkZWNsYXJhdGlvbiB2aWV3LCB3aGljaCBpcyB3aHkgd2UgY2FuIGFzc3VtZSBpdCdzIGRlZmluZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudExWaWV3LCAnUGFyZW50IExWaWV3IHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHBhcmVudExWaWV3ID0gcGFyZW50TFZpZXdbREVDTEFSQVRJT05fVklFV10hO1xuXG4gICAgICAgIC8vIEluIEl2eSB0aGVyZSBhcmUgQ29tbWVudCBub2RlcyB0aGF0IGNvcnJlc3BvbmQgdG8gbmdJZiBhbmQgTmdGb3IgZW1iZWRkZWQgZGlyZWN0aXZlc1xuICAgICAgICAvLyBXZSB3YW50IHRvIHNraXAgdGhvc2UgYW5kIGxvb2sgb25seSBhdCBFbGVtZW50cyBhbmQgRWxlbWVudENvbnRhaW5lcnMgdG8gZW5zdXJlXG4gICAgICAgIC8vIHdlJ3JlIGxvb2tpbmcgYXQgdHJ1ZSBwYXJlbnQgbm9kZXMsIGFuZCBub3QgY29udGVudCBvciBvdGhlciB0eXBlcy5cbiAgICAgICAgaWYgKHBhcmVudFROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkVsZW1lbnQgfCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gSWYgd2UgZmFpbGVkIHRvIGZpbmQgYSBwYXJlbnQgVE5vZGUgdGhpcyBtZWFucyB0aGF0IHdlIHNob3VsZCB1c2UgbW9kdWxlIGluamVjdG9yLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZSA9IHBhcmVudFROb2RlO1xuICAgICAgbFZpZXcgPSBwYXJlbnRMVmlldztcbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBsRnJhbWUgPSAoaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUgPSBhbGxvY0xGcmFtZSgpKTtcbiAgbEZyYW1lLmN1cnJlbnRUTm9kZSA9IHROb2RlO1xuICBsRnJhbWUubFZpZXcgPSBsVmlldztcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IGxWaWV3IHdpdGggYSBuZXcgbFZpZXcuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIGxWaWV3IGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIGxWaWV3IGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IGxWaWV3IHRvIGJlY29tZSBhY3RpdmVcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsVmlldztcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwobmV3Vmlld1swXSwgbmV3Vmlld1sxXSBhcyBhbnksICc/Pz8/Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmlzUGFyZW50LCB0cnVlLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmxWaWV3LCBudWxsLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLnRWaWV3LCBudWxsLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLnNlbGVjdGVkSW5kZXgsIC0xLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmVsZW1lbnREZXB0aENvdW50LCAwLCAnRXhwZWN0ZWQgY2xlYW4gTEZyYW1lJyk7XG4gICAgYXNzZXJ0RXF1YWwobmV3TEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleCwgLTEsICdFeHBlY3RlZCBjbGVhbiBMRnJhbWUnKTtcbiAgICBhc3NlcnRFcXVhbChuZXdMRnJhbWUuY3VycmVudE5hbWVzcGFjZSwgbnVsbCwgJ0V4cGVjdGVkIGNsZWFuIExGcmFtZScpO1xuICAgIGFzc2VydEVxdWFsKG5ld0xGcmFtZS5iaW5kaW5nUm9vdEluZGV4LCAtMSwgJ0V4cGVjdGVkIGNsZWFuIExGcmFtZScpO1xuICAgIGFzc2VydEVxdWFsKG5ld0xGcmFtZS5jdXJyZW50UXVlcnlJbmRleCwgMCwgJ0V4cGVjdGVkIGNsZWFuIExGcmFtZScpO1xuICB9XG4gIGNvbnN0IHRWaWV3ID0gbmV3Vmlld1tUVklFV107XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lID0gbmV3TEZyYW1lO1xuICBuZ0Rldk1vZGUgJiYgdFZpZXcuZmlyc3RDaGlsZCAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHRWaWV3LmZpcnN0Q2hpbGQsIHRWaWV3KTtcbiAgbmV3TEZyYW1lLmN1cnJlbnRUTm9kZSA9IHRWaWV3LmZpcnN0Q2hpbGQhO1xuICBuZXdMRnJhbWUubFZpZXcgPSBuZXdWaWV3O1xuICBuZXdMRnJhbWUudFZpZXcgPSB0VmlldztcbiAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IG5ld1ZpZXc7XG4gIG5ld0xGcmFtZS5iaW5kaW5nSW5kZXggPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgbmV3TEZyYW1lLmluSTE4biA9IGZhbHNlO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyBuZXh0IGZyZWUgTEZyYW1lLiBUaGlzIGZ1bmN0aW9uIHRyaWVzIHRvIHJldXNlIHRoZSBgTEZyYW1lYHMgdG8gbG93ZXIgbWVtb3J5IHByZXNzdXJlLlxuICovXG5mdW5jdGlvbiBhbGxvY0xGcmFtZSgpIHtcbiAgY29uc3QgY3VycmVudExGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBjaGlsZExGcmFtZSA9IGN1cnJlbnRMRnJhbWUgPT09IG51bGwgPyBudWxsIDogY3VycmVudExGcmFtZS5jaGlsZDtcbiAgY29uc3QgbmV3TEZyYW1lID0gY2hpbGRMRnJhbWUgPT09IG51bGwgPyBjcmVhdGVMRnJhbWUoY3VycmVudExGcmFtZSkgOiBjaGlsZExGcmFtZTtcbiAgcmV0dXJuIG5ld0xGcmFtZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTEZyYW1lKHBhcmVudDogTEZyYW1lIHwgbnVsbCk6IExGcmFtZSB7XG4gIGNvbnN0IGxGcmFtZTogTEZyYW1lID0ge1xuICAgIGN1cnJlbnRUTm9kZTogbnVsbCxcbiAgICBpc1BhcmVudDogdHJ1ZSxcbiAgICBsVmlldzogbnVsbCEsXG4gICAgdFZpZXc6IG51bGwhLFxuICAgIHNlbGVjdGVkSW5kZXg6IC0xLFxuICAgIGNvbnRleHRMVmlldzogbnVsbCxcbiAgICBlbGVtZW50RGVwdGhDb3VudDogMCxcbiAgICBjdXJyZW50TmFtZXNwYWNlOiBudWxsLFxuICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleDogLTEsXG4gICAgYmluZGluZ1Jvb3RJbmRleDogLTEsXG4gICAgYmluZGluZ0luZGV4OiAtMSxcbiAgICBjdXJyZW50UXVlcnlJbmRleDogMCxcbiAgICBwYXJlbnQ6IHBhcmVudCEsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgaW5JMThuOiBmYWxzZSxcbiAgfTtcbiAgcGFyZW50ICE9PSBudWxsICYmIChwYXJlbnQuY2hpbGQgPSBsRnJhbWUpOyAvLyBsaW5rIHRoZSBuZXcgTEZyYW1lIGZvciByZXVzZS5cbiAgcmV0dXJuIGxGcmFtZTtcbn1cblxuLyoqXG4gKiBBIGxpZ2h0d2VpZ2h0IHZlcnNpb24gb2YgbGVhdmUgd2hpY2ggaXMgdXNlZCB3aXRoIERJLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gb25seSByZXNldHMgYGN1cnJlbnRUTm9kZWAgYW5kIGBMVmlld2AgYXMgdGhvc2UgYXJlIHRoZSBvbmx5IHByb3BlcnRpZXNcbiAqIHVzZWQgd2l0aCBESSAoYGVudGVyREkoKWApLlxuICpcbiAqIE5PVEU6IFRoaXMgZnVuY3Rpb24gaXMgcmVleHBvcnRlZCBhcyBgbGVhdmVESWAuIEhvd2V2ZXIgYGxlYXZlRElgIGhhcyByZXR1cm4gdHlwZSBvZiBgdm9pZGAgd2hlcmVcbiAqIGFzIGBsZWF2ZVZpZXdMaWdodGAgaGFzIGBMRnJhbWVgLiBUaGlzIGlzIHNvIHRoYXQgYGxlYXZlVmlld0xpZ2h0YCBjYW4gYmUgdXNlZCBpbiBgbGVhdmVWaWV3YC5cbiAqL1xuZnVuY3Rpb24gbGVhdmVWaWV3TGlnaHQoKTogTEZyYW1lIHtcbiAgY29uc3Qgb2xkTEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lID0gb2xkTEZyYW1lLnBhcmVudDtcbiAgb2xkTEZyYW1lLmN1cnJlbnRUTm9kZSA9IG51bGwhO1xuICBvbGRMRnJhbWUubFZpZXcgPSBudWxsITtcbiAgcmV0dXJuIG9sZExGcmFtZTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgbGlnaHR3ZWlnaHQgdmVyc2lvbiBvZiB0aGUgYGxlYXZlVmlld2Agd2hpY2ggaXMgbmVlZGVkIGJ5IHRoZSBESSBzeXN0ZW0uXG4gKlxuICogTk9URTogdGhpcyBmdW5jdGlvbiBpcyBhbiBhbGlhcyBzbyB0aGF0IHdlIGNhbiBjaGFuZ2UgdGhlIHR5cGUgb2YgdGhlIGZ1bmN0aW9uIHRvIGhhdmUgYHZvaWRgXG4gKiByZXR1cm4gdHlwZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGxlYXZlREk6ICgpID0+IHZvaWQgPSBsZWF2ZVZpZXdMaWdodDtcblxuLyoqXG4gKiBMZWF2ZSB0aGUgY3VycmVudCBgTFZpZXdgXG4gKlxuICogVGhpcyBwb3BzIHRoZSBgTEZyYW1lYCB3aXRoIHRoZSBhc3NvY2lhdGVkIGBMVmlld2AgZnJvbSB0aGUgc3RhY2suXG4gKlxuICogSU1QT1JUQU5UOiBXZSBtdXN0IHplcm8gb3V0IHRoZSBgTEZyYW1lYCB2YWx1ZXMgaGVyZSBvdGhlcndpc2UgdGhleSB3aWxsIGJlIHJldGFpbmVkLiBUaGlzIGlzXG4gKiBiZWNhdXNlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIGRvbid0IHJlbGVhc2UgYExGcmFtZWAgYnV0IHJhdGhlciBrZWVwIGl0IGZvciBuZXh0IHVzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldygpIHtcbiAgY29uc3Qgb2xkTEZyYW1lID0gbGVhdmVWaWV3TGlnaHQoKTtcbiAgb2xkTEZyYW1lLmlzUGFyZW50ID0gdHJ1ZTtcbiAgb2xkTEZyYW1lLnRWaWV3ID0gbnVsbCE7XG4gIG9sZExGcmFtZS5zZWxlY3RlZEluZGV4ID0gLTE7XG4gIG9sZExGcmFtZS5jb250ZXh0TFZpZXcgPSBudWxsO1xuICBvbGRMRnJhbWUuZWxlbWVudERlcHRoQ291bnQgPSAwO1xuICBvbGRMRnJhbWUuY3VycmVudERpcmVjdGl2ZUluZGV4ID0gLTE7XG4gIG9sZExGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbiAgb2xkTEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSAtMTtcbiAgb2xkTEZyYW1lLmJpbmRpbmdJbmRleCA9IC0xO1xuICBvbGRMRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV4dENvbnRleHRJbXBsPFQgPSBhbnk+KGxldmVsOiBudW1iZXIpOiBUIHtcbiAgY29uc3QgY29udGV4dExWaWV3ID0gKGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9IHdhbGtVcFZpZXdzKFxuICAgIGxldmVsLFxuICAgIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyEsXG4gICkpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIHVua25vd24gYXMgVDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZWxlbWVudCBpbmRleC5cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkSW5kZXgoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4O1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1vc3QgcmVjZW50IGluZGV4IHBhc3NlZCB0byB7QGxpbmsgc2VsZWN0fVxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICpcbiAqIChOb3RlIHRoYXQgaWYgYW4gXCJleGl0IGZ1bmN0aW9uXCIgd2FzIHNldCBlYXJsaWVyICh2aWEgYHNldEVsZW1lbnRFeGl0Rm4oKWApIHRoZW4gdGhhdCB3aWxsIGJlXG4gKiBydW4gaWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBpbmRleGAgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0ZWQgaW5kZXggdmFsdWUuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGluZGV4ICE9PSAtMSAmJlxuICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ0luZGV4IG11c3QgYmUgcGFzdCBIRUFERVJfT0ZGU0VUIChvciAtMSkuJyk7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydExlc3NUaGFuKFxuICAgICAgaW5kZXgsXG4gICAgICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5sVmlldy5sZW5ndGgsXG4gICAgICBcIkNhbid0IHNldCBpbmRleCBwYXNzZWQgZW5kIG9mIExWaWV3XCIsXG4gICAgKTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGB0Tm9kZWAgdGhhdCByZXByZXNlbnRzIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VsZWN0ZWRUTm9kZSgpIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIHJldHVybiBnZXRUTm9kZShsRnJhbWUudFZpZXcsIGxGcmFtZS5zZWxlY3RlZEluZGV4KTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydgIGluIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZVNWRygpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IFNWR19OQU1FU1BBQ0U7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlTWF0aE1MKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gTUFUSF9NTF9OQU1FU1BBQ0U7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmFtZXNwYWNlIHVzZWQgdG8gY3JlYXRlIGVsZW1lbnRzIHRvIGBudWxsYCwgd2hpY2ggZm9yY2VzIGVsZW1lbnQgY3JlYXRpb24gdG8gdXNlXG4gKiBgY3JlYXRlRWxlbWVudGAgcmF0aGVyIHRoYW4gYGNyZWF0ZUVsZW1lbnROU2AuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VIVE1MKCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlO1xufVxuXG5sZXQgX3dhc0xhc3ROb2RlQ3JlYXRlZCA9IHRydWU7XG5cbi8qKlxuICogUmV0cmlldmVzIGEgZ2xvYmFsIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciB0aGUgbW9zdCByZWNlbnQgRE9NIG5vZGVcbiAqIHdhcyBjcmVhdGVkIG9yIGh5ZHJhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2FzTGFzdE5vZGVDcmVhdGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gX3dhc0xhc3ROb2RlQ3JlYXRlZDtcbn1cblxuLyoqXG4gKiBTZXRzIGEgZ2xvYmFsIGZsYWcgdG8gaW5kaWNhdGUgd2hldGhlciB0aGUgbW9zdCByZWNlbnQgRE9NIG5vZGVcbiAqIHdhcyBjcmVhdGVkIG9yIGh5ZHJhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFzdE5vZGVXYXNDcmVhdGVkKGZsYWc6IGJvb2xlYW4pOiB2b2lkIHtcbiAgX3dhc0xhc3ROb2RlQ3JlYXRlZCA9IGZsYWc7XG59XG4iXX0=