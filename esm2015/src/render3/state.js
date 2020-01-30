/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/state.ts
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
import { CONTEXT, DECLARATION_VIEW, TVIEW } from './interfaces/view';
/**
 *
 * @record
 */
function LFrame() { }
if (false) {
    /**
     * Parent LFrame.
     *
     * This is needed when `leaveView` is called to restore the previous state.
     * @type {?}
     */
    LFrame.prototype.parent;
    /**
     * Child LFrame.
     *
     * This is used to cache existing LFrames to relieve the memory pressure.
     * @type {?}
     */
    LFrame.prototype.child;
    /**
     * State of the current view being processed.
     *
     * An array of nodes (text, element, container, etc), pipes, their bindings, and
     * any local variables that need to be stored between invocations.
     * @type {?}
     */
    LFrame.prototype.lView;
    /**
     * Used to set the parent property when nodes are created and track query results.
     *
     * This is used in conjunction with `isParent`.
     * @type {?}
     */
    LFrame.prototype.previousOrParentTNode;
    /**
     * If `isParent` is:
     *  - `true`: then `previousOrParentTNode` points to a parent node.
     *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
     * @type {?}
     */
    LFrame.prototype.isParent;
    /**
     * Index of currently selected element in LView.
     *
     * Used by binding instructions. Updated as part of advance instruction.
     * @type {?}
     */
    LFrame.prototype.selectedIndex;
    /**
     * Current pointer to the binding index.
     * @type {?}
     */
    LFrame.prototype.bindingIndex;
    /**
     * The last viewData retrieved by nextContext().
     * Allows building nextContext() and reference() calls.
     *
     * e.g. const inner = x().$implicit; const outer = x().$implicit;
     * @type {?}
     */
    LFrame.prototype.contextLView;
    /**
     * Store the element depth count. This is used to identify the root elements of the template
     * so that we can then attach patch data `LView` to only those elements. We know that those
     * are the only places where the patch data could change, this way we will save on number
     * of places where tha patching occurs.
     * @type {?}
     */
    LFrame.prototype.elementDepthCount;
    /**
     * Current namespace to be used when creating elements
     * @type {?}
     */
    LFrame.prototype.currentNamespace;
    /**
     * Current sanitizer
     * @type {?}
     */
    LFrame.prototype.currentSanitizer;
    /**
     * The root index from which pure function instructions should calculate their binding
     * indices. In component views, this is TView.bindingStartIndex. In a host binding
     * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
     * @type {?}
     */
    LFrame.prototype.bindingRootIndex;
    /**
     * Current index of a View or Content Query which needs to be processed next.
     * We iterate over the list of Queries and increment current query index at every step.
     * @type {?}
     */
    LFrame.prototype.currentQueryIndex;
    /**
     * When host binding is executing this points to the directive index.
     * `TView.data[currentDirectiveIndex]` is `DirectiveDef`
     * `LView[currentDirectiveIndex]` is directive instance.
     * @type {?}
     */
    LFrame.prototype.currentDirectiveIndex;
}
/**
 * All implicit instruction state is stored here.
 *
 * It is useful to have a single object where all of the state is stored as a mental model
 * (rather it being spread across many different variables.)
 *
 * PERF NOTE: Turns out that writing to a true global variable is slower than
 * having an intermediate object with properties.
 * @record
 */
function InstructionState() { }
if (false) {
    /**
     * Current `LFrame`
     *
     * `null` if we have not called `enterView`
     * @type {?}
     */
    InstructionState.prototype.lFrame;
    /**
     * Stores whether directives should be matched to elements.
     *
     * When template contains `ngNonBindable` then we need to prevent the runtime from matching
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
    InstructionState.prototype.bindingsEnabled;
    /**
     * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
     *
     * Necessary to support ChangeDetectorRef.checkNoChanges().
     * @type {?}
     */
    InstructionState.prototype.checkNoChangesMode;
}
/** @type {?} */
export const instructionState = {
    lFrame: createLFrame(null),
    bindingsEnabled: true,
    checkNoChangesMode: false,
};
/**
 * @return {?}
 */
export function getElementDepthCount() {
    return instructionState.lFrame.elementDepthCount;
}
/**
 * @return {?}
 */
export function increaseElementDepthCount() {
    instructionState.lFrame.elementDepthCount++;
}
/**
 * @return {?}
 */
export function decreaseElementDepthCount() {
    instructionState.lFrame.elementDepthCount--;
}
/**
 * @return {?}
 */
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
 * \@codeGenApi
 * @return {?}
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
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵdisableBindings() {
    instructionState.bindingsEnabled = false;
}
/**
 * Return the current LView.
 *
 * The return value can be `null` if the method is called outside of template. This can happen if
 * directive is instantiated by module injector (rather than by node injector.)
 * @return {?}
 */
export function getLView() {
    // TODO(misko): the return value should be `LView|null` but doing so breaks a lot of code.
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    return lFrame === null ? (/** @type {?} */ (null)) : lFrame.lView;
}
/**
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param {?} elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 * @return {?}
 */
export function setActiveHostElement(elementIndex) {
    setSelectedIndex(elementIndex);
}
/**
 * @return {?}
 */
export function clearActiveHostElement() {
    setSelectedIndex(-1);
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
    instructionState.lFrame.contextLView = (/** @type {?} */ ((/** @type {?} */ (viewToRestore))));
}
/**
 * @return {?}
 */
export function getPreviousOrParentTNode() {
    return instructionState.lFrame.previousOrParentTNode;
}
/**
 * @param {?} tNode
 * @param {?} _isParent
 * @return {?}
 */
export function setPreviousOrParentTNode(tNode, _isParent) {
    instructionState.lFrame.previousOrParentTNode = tNode;
    instructionState.lFrame.isParent = _isParent;
}
/**
 * @return {?}
 */
export function getIsParent() {
    return instructionState.lFrame.isParent;
}
/**
 * @return {?}
 */
export function setIsNotParent() {
    instructionState.lFrame.isParent = false;
}
/**
 * @return {?}
 */
export function setIsParent() {
    instructionState.lFrame.isParent = true;
}
/**
 * @return {?}
 */
export function getContextLView() {
    return instructionState.lFrame.contextLView;
}
/**
 * @return {?}
 */
export function getCheckNoChangesMode() {
    // TODO(misko): remove this from the LView since it is ngDevMode=true mode only.
    return instructionState.checkNoChangesMode;
}
/**
 * @param {?} mode
 * @return {?}
 */
export function setCheckNoChangesMode(mode) {
    instructionState.checkNoChangesMode = mode;
}
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
/**
 * @return {?}
 */
export function getBindingRoot() {
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    /** @type {?} */
    let index = lFrame.bindingRootIndex;
    if (index === -1) {
        /** @type {?} */
        const lView = lFrame.lView;
        index = lFrame.bindingRootIndex = lView[TVIEW].bindingStartIndex;
    }
    return index;
}
/**
 * @return {?}
 */
export function getBindingIndex() {
    return instructionState.lFrame.bindingIndex;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setBindingIndex(value) {
    return instructionState.lFrame.bindingIndex = value;
}
/**
 * @return {?}
 */
export function nextBindingIndex() {
    return instructionState.lFrame.bindingIndex++;
}
/**
 * @param {?} count
 * @return {?}
 */
export function incrementBindingIndex(count) {
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    /** @type {?} */
    const index = lFrame.bindingIndex;
    lFrame.bindingIndex = lFrame.bindingIndex + count;
    return index;
}
/**
 * Set a new binding root index so that host template functions can execute.
 *
 * Bindings inside the host template are 0 index. But because we don't know ahead of time
 * how many host bindings we have we can't pre-compute them. For this reason they are all
 * 0 index and we just shift the root so that they match next available location in the LView.
 *
 * @param {?} bindingRootIndex Root index for `hostBindings`
 * @param {?} currentDirectiveIndex `TData[currentDirectiveIndex]` will point to the current directive
 *        whose `hostBindings` are being processed.
 * @return {?}
 */
export function setBindingRootForHostBindings(bindingRootIndex, currentDirectiveIndex) {
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
    lFrame.currentDirectiveIndex = currentDirectiveIndex;
}
/**
 * When host binding is executing this points to the directive index.
 * `TView.data[getCurrentDirectiveIndex()]` is `DirectiveDef`
 * `LView[getCurrentDirectiveIndex()]` is directive instance.
 * @return {?}
 */
export function getCurrentDirectiveIndex() {
    return instructionState.lFrame.currentDirectiveIndex;
}
/**
 * @return {?}
 */
export function getCurrentQueryIndex() {
    return instructionState.lFrame.currentQueryIndex;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setCurrentQueryIndex(value) {
    instructionState.lFrame.currentQueryIndex = value;
}
/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 * @param {?} newView
 * @param {?} tNode
 * @return {?}
 */
export function enterDI(newView, tNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    /** @type {?} */
    const newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = (/** @type {?} */ (tNode));
    newLFrame.lView = newView;
    if (ngDevMode) {
        // resetting for safety in dev mode only.
        newLFrame.isParent = DEV_MODE_VALUE;
        newLFrame.selectedIndex = DEV_MODE_VALUE;
        newLFrame.contextLView = DEV_MODE_VALUE;
        newLFrame.elementDepthCount = DEV_MODE_VALUE;
        newLFrame.currentNamespace = DEV_MODE_VALUE;
        newLFrame.currentSanitizer = DEV_MODE_VALUE;
        newLFrame.bindingRootIndex = DEV_MODE_VALUE;
        newLFrame.currentQueryIndex = DEV_MODE_VALUE;
    }
}
/** @type {?} */
const DEV_MODE_VALUE = 'Value indicating that DI is trying to read value which it should not need to know about.';
/**
 * This is a light weight version of the `leaveView` which is needed by the DI system.
 *
 * Because the implementation is same it is only an alias
 * @type {?}
 */
export const leaveDI = leaveView;
/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param {?} newView New lView to become active
 * @param {?} tNode Element to which the View is a child of
 * @return {?} the previously active lView;
 */
export function enterView(newView, tNode) {
    ngDevMode && assertLViewOrUndefined(newView);
    /** @type {?} */
    const newLFrame = allocLFrame();
    instructionState.lFrame = newLFrame;
    newLFrame.previousOrParentTNode = (/** @type {?} */ (tNode));
    newLFrame.isParent = true;
    newLFrame.lView = newView;
    newLFrame.selectedIndex = 0;
    newLFrame.contextLView = (/** @type {?} */ (newView));
    newLFrame.elementDepthCount = 0;
    newLFrame.currentDirectiveIndex = -1;
    newLFrame.currentNamespace = null;
    newLFrame.currentSanitizer = null;
    newLFrame.bindingRootIndex = -1;
    newLFrame.bindingIndex = newView === null ? -1 : newView[TVIEW].bindingStartIndex;
    newLFrame.currentQueryIndex = 0;
}
/**
 * Allocates next free LFrame. This function tries to reuse the `LFrame`s to lower memory pressure.
 * @return {?}
 */
function allocLFrame() {
    /** @type {?} */
    const currentLFrame = instructionState.lFrame;
    /** @type {?} */
    const childLFrame = currentLFrame === null ? null : currentLFrame.child;
    /** @type {?} */
    const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
    return newLFrame;
}
/**
 * @param {?} parent
 * @return {?}
 */
function createLFrame(parent) {
    /** @type {?} */
    const lFrame = {
        previousOrParentTNode: (/** @type {?} */ (null)),
        //
        isParent: true,
        //
        lView: (/** @type {?} */ (null)),
        //
        selectedIndex: 0,
        //
        contextLView: (/** @type {?} */ (null)),
        //
        elementDepthCount: 0,
        //
        currentNamespace: null,
        //
        currentSanitizer: null,
        //
        currentDirectiveIndex: -1,
        //
        bindingRootIndex: -1,
        //
        bindingIndex: -1,
        //
        currentQueryIndex: 0,
        //
        parent: (/** @type {?} */ (parent)),
        //
        child: null,
    };
    parent !== null && (parent.child = lFrame); // link the new LFrame for reuse.
    return lFrame;
}
/**
 * @return {?}
 */
export function leaveView() {
    instructionState.lFrame = instructionState.lFrame.parent;
}
/**
 * @template T
 * @param {?} level
 * @return {?}
 */
export function nextContextImpl(level) {
    /** @type {?} */
    const contextLView = instructionState.lFrame.contextLView =
        walkUpViews(level, (/** @type {?} */ (instructionState.lFrame.contextLView)));
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
 * Gets the currently selected element index.
 *
 * Used with {\@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 * @return {?}
 */
export function getSelectedIndex() {
    return instructionState.lFrame.selectedIndex;
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
    instructionState.lFrame.selectedIndex = index;
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceSVG() {
    instructionState.lFrame.currentNamespace = 'http://www.w3.org/2000/svg';
}
/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵnamespaceMathML() {
    instructionState.lFrame.currentNamespace = 'http://www.w3.org/1998/MathML/';
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
    instructionState.lFrame.currentNamespace = null;
}
/**
 * @return {?}
 */
export function getNamespace() {
    return instructionState.lFrame.currentNamespace;
}
/**
 * @param {?} sanitizer
 * @return {?}
 */
export function setCurrentStyleSanitizer(sanitizer) {
    instructionState.lFrame.currentSanitizer = sanitizer;
}
/**
 * @return {?}
 */
export function resetCurrentStyleSanitizer() {
    setCurrentStyleSanitizer(null);
}
/**
 * @return {?}
 */
export function getCurrentStyleSanitizer() {
    // TODO(misko): This should throw when there is no LView, but it turns out we can get here from
    // `NodeStyleDebug` hence we return `null`. This should be fixed
    /** @type {?} */
    const lFrame = instructionState.lFrame;
    return lFrame === null ? null : lFrame.currentSanitizer;
}
/** @enum {number} */
const BindingChanged = {
    CLASS_SHIFT: 16,
    STYLE_MASK: 65535,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBMEIsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7O0FBTTNGLHFCQStGQzs7Ozs7Ozs7SUF6RkMsd0JBQWU7Ozs7Ozs7SUFPZix1QkFBbUI7Ozs7Ozs7O0lBUW5CLHVCQUFhOzs7Ozs7O0lBT2IsdUNBQTZCOzs7Ozs7O0lBTzdCLDBCQUFrQjs7Ozs7OztJQU9sQiwrQkFBc0I7Ozs7O0lBS3RCLDhCQUFxQjs7Ozs7Ozs7SUFRckIsOEJBQW9COzs7Ozs7OztJQVFwQixtQ0FBMEI7Ozs7O0lBSzFCLGtDQUE4Qjs7Ozs7SUFLOUIsa0NBQXVDOzs7Ozs7O0lBUXZDLGtDQUF5Qjs7Ozs7O0lBTXpCLG1DQUEwQjs7Ozs7OztJQU8xQix1Q0FBOEI7Ozs7Ozs7Ozs7OztBQVloQywrQkFrQ0M7Ozs7Ozs7O0lBNUJDLGtDQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CZiwyQ0FBeUI7Ozs7Ozs7SUFPekIsOENBQTRCOzs7QUFHOUIsTUFBTSxPQUFPLGdCQUFnQixHQUFxQjtJQUNoRCxNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQztJQUMxQixlQUFlLEVBQUUsSUFBSTtJQUNyQixrQkFBa0IsRUFBRSxLQUFLO0NBQzFCOzs7O0FBR0QsTUFBTSxVQUFVLG9CQUFvQjtJQUNsQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQztBQUNuRCxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2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T0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxRCxDQUFDOztBQUtELE1BQVcsY0FBYztJQUN2QixXQUFXLElBQUs7SUFDaEIsVUFBVSxPQUFTO0VBQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TFZpZXdPclVuZGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBMVmlldywgT3BhcXVlVmlld1N0YXRlLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cbi8qKlxuICpcbiAqL1xuaW50ZXJmYWNlIExGcmFtZSB7XG4gIC8qKlxuICAgKiBQYXJlbnQgTEZyYW1lLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lZWRlZCB3aGVuIGBsZWF2ZVZpZXdgIGlzIGNhbGxlZCB0byByZXN0b3JlIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgICovXG4gIHBhcmVudDogTEZyYW1lO1xuXG4gIC8qKlxuICAgKiBDaGlsZCBMRnJhbWUuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCB0byBjYWNoZSBleGlzdGluZyBMRnJhbWVzIHRvIHJlbGlldmUgdGhlIG1lbW9yeSBwcmVzc3VyZS5cbiAgICovXG4gIGNoaWxkOiBMRnJhbWV8bnVsbDtcblxuICAvKipcbiAgICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gICAqXG4gICAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gICAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICAgKi9cbiAgbFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQgYW5kIHRyYWNrIHF1ZXJ5IHJlc3VsdHMuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGBpc1BhcmVudGAuXG4gICAqL1xuICBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG4gIC8qKlxuICAgKiBJZiBgaXNQYXJlbnRgIGlzOlxuICAgKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gICAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICAgKi9cbiAgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50IGluIExWaWV3LlxuICAgKlxuICAgKiBVc2VkIGJ5IGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLiBVcGRhdGVkIGFzIHBhcnQgb2YgYWR2YW5jZSBpbnN0cnVjdGlvbi5cbiAgICovXG4gIHNlbGVjdGVkSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBwb2ludGVyIHRvIHRoZSBiaW5kaW5nIGluZGV4LlxuICAgKi9cbiAgYmluZGluZ0luZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICAgKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gICAqXG4gICAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gICAqL1xuICBjb250ZXh0TFZpZXc6IExWaWV3O1xuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICAgKiBzbyB0aGF0IHdlIGNhbiB0aGVuIGF0dGFjaCBwYXRjaCBkYXRhIGBMVmlld2AgdG8gb25seSB0aG9zZSBlbGVtZW50cy4gV2Uga25vdyB0aGF0IHRob3NlXG4gICAqIGFyZSB0aGUgb25seSBwbGFjZXMgd2hlcmUgdGhlIHBhdGNoIGRhdGEgY291bGQgY2hhbmdlLCB0aGlzIHdheSB3ZSB3aWxsIHNhdmUgb24gbnVtYmVyXG4gICAqIG9mIHBsYWNlcyB3aGVyZSB0aGEgcGF0Y2hpbmcgb2NjdXJzLlxuICAgKi9cbiAgZWxlbWVudERlcHRoQ291bnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBuYW1lc3BhY2UgdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIGVsZW1lbnRzXG4gICAqL1xuICBjdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQ3VycmVudCBzYW5pdGl6ZXJcbiAgICovXG4gIGN1cnJlbnRTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsO1xuXG5cbiAgLyoqXG4gICAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gICAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAgICogY29udGV4dCwgdGhpcyBpcyB0aGUgVFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKyBhbnkgZGlycy9ob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAgICovXG4gIGJpbmRpbmdSb290SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3VycmVudCBpbmRleCBvZiBhIFZpZXcgb3IgQ29udGVudCBRdWVyeSB3aGljaCBuZWVkcyB0byBiZSBwcm9jZXNzZWQgbmV4dC5cbiAgICogV2UgaXRlcmF0ZSBvdmVyIHRoZSBsaXN0IG9mIFF1ZXJpZXMgYW5kIGluY3JlbWVudCBjdXJyZW50IHF1ZXJ5IGluZGV4IGF0IGV2ZXJ5IHN0ZXAuXG4gICAqL1xuICBjdXJyZW50UXVlcnlJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBXaGVuIGhvc3QgYmluZGluZyBpcyBleGVjdXRpbmcgdGhpcyBwb2ludHMgdG8gdGhlIGRpcmVjdGl2ZSBpbmRleC5cbiAgICogYFRWaWV3LmRhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XWAgaXMgYERpcmVjdGl2ZURlZmBcbiAgICogYExWaWV3W2N1cnJlbnREaXJlY3RpdmVJbmRleF1gIGlzIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICovXG4gIGN1cnJlbnREaXJlY3RpdmVJbmRleDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFsbCBpbXBsaWNpdCBpbnN0cnVjdGlvbiBzdGF0ZSBpcyBzdG9yZWQgaGVyZS5cbiAqXG4gKiBJdCBpcyB1c2VmdWwgdG8gaGF2ZSBhIHNpbmdsZSBvYmplY3Qgd2hlcmUgYWxsIG9mIHRoZSBzdGF0ZSBpcyBzdG9yZWQgYXMgYSBtZW50YWwgbW9kZWxcbiAqIChyYXRoZXIgaXQgYmVpbmcgc3ByZWFkIGFjcm9zcyBtYW55IGRpZmZlcmVudCB2YXJpYWJsZXMuKVxuICpcbiAqIFBFUkYgTk9URTogVHVybnMgb3V0IHRoYXQgd3JpdGluZyB0byBhIHRydWUgZ2xvYmFsIHZhcmlhYmxlIGlzIHNsb3dlciB0aGFuXG4gKiBoYXZpbmcgYW4gaW50ZXJtZWRpYXRlIG9iamVjdCB3aXRoIHByb3BlcnRpZXMuXG4gKi9cbmludGVyZmFjZSBJbnN0cnVjdGlvblN0YXRlIHtcbiAgLyoqXG4gICAqIEN1cnJlbnQgYExGcmFtZWBcbiAgICpcbiAgICogYG51bGxgIGlmIHdlIGhhdmUgbm90IGNhbGxlZCBgZW50ZXJWaWV3YFxuICAgKi9cbiAgbEZyYW1lOiBMRnJhbWU7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gICAqXG4gICAqIFdoZW4gdGVtcGxhdGUgY29udGFpbnMgYG5nTm9uQmluZGFibGVgIHRoZW4gd2UgbmVlZCB0byBwcmV2ZW50IHRoZSBydW50aW1lIGZyb20gbWF0Y2hpbmdcbiAgICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gICAqXG4gICAqIEV4YW1wbGU6XG4gICAqIGBgYFxuICAgKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gICAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAgICogPC9teS1jb21wPlxuICAgKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gICAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICAgKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAgICogICA8L215LWNvbXA+XG4gICAqIDwvZGl2PlxuICAgKiBgYGBcbiAgICovXG4gIGJpbmRpbmdzRW5hYmxlZDogYm9vbGVhbjtcblxuICAvKipcbiAgICogSW4gdGhpcyBtb2RlLCBhbnkgY2hhbmdlcyBpbiBiaW5kaW5ncyB3aWxsIHRocm93IGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yLlxuICAgKlxuICAgKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICAgKi9cbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgaW5zdHJ1Y3Rpb25TdGF0ZTogSW5zdHJ1Y3Rpb25TdGF0ZSA9IHtcbiAgbEZyYW1lOiBjcmVhdGVMRnJhbWUobnVsbCksXG4gIGJpbmRpbmdzRW5hYmxlZDogdHJ1ZSxcbiAgY2hlY2tOb0NoYW5nZXNNb2RlOiBmYWxzZSxcbn07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnREZXB0aENvdW50KCkge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5lbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdzRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUuYmluZGluZ3NFbmFibGVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIMm1ybVkaXNhYmxlQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSDJtcm1ZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5iaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSDJtcm1ZGlzYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gybXJtWVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBMVmlldy5cbiAqXG4gKiBUaGUgcmV0dXJuIHZhbHVlIGNhbiBiZSBgbnVsbGAgaWYgdGhlIG1ldGhvZCBpcyBjYWxsZWQgb3V0c2lkZSBvZiB0ZW1wbGF0ZS4gVGhpcyBjYW4gaGFwcGVuIGlmXG4gKiBkaXJlY3RpdmUgaXMgaW5zdGFudGlhdGVkIGJ5IG1vZHVsZSBpbmplY3RvciAocmF0aGVyIHRoYW4gYnkgbm9kZSBpbmplY3Rvci4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlldygpOiBMVmlldyB7XG4gIC8vIFRPRE8obWlza28pOiB0aGUgcmV0dXJuIHZhbHVlIHNob3VsZCBiZSBgTFZpZXd8bnVsbGAgYnV0IGRvaW5nIHNvIGJyZWFrcyBhIGxvdCBvZiBjb2RlLlxuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGxGcmFtZSA9PT0gbnVsbCA/IG51bGwgISA6IGxGcmFtZS5sVmlldztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBhY3RpdmUgZGlyZWN0aXZlIGhvc3QgZWxlbWVudCBhbmQgcmVzZXRzIHRoZSBkaXJlY3RpdmUgaWQgdmFsdWVcbiAqICh3aGVuIHRoZSBwcm92aWRlZCBlbGVtZW50SW5kZXggdmFsdWUgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50SW5kZXggdGhlIGVsZW1lbnQgaW5kZXggdmFsdWUgZm9yIHRoZSBob3N0IGVsZW1lbnQgd2hlcmVcbiAqICAgICAgICAgICAgICAgICAgICAgdGhlIGRpcmVjdGl2ZS9jb21wb25lbnQgaW5zdGFuY2UgbGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEFjdGl2ZUhvc3RFbGVtZW50KGVsZW1lbnRJbmRleDogbnVtYmVyKSB7XG4gIHNldFNlbGVjdGVkSW5kZXgoZWxlbWVudEluZGV4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQWN0aXZlSG9zdEVsZW1lbnQoKSB7XG4gIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZTogVE5vZGUsIF9pc1BhcmVudDogYm9vbGVhbikge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5wcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJc1BhcmVudCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SXNOb3RQYXJlbnQoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gZmFsc2U7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0SXNQYXJlbnQoKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmlzUGFyZW50ID0gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRleHRMVmlldygpOiBMVmlldyB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jb250ZXh0TFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTogYm9vbGVhbiB7XG4gIC8vIFRPRE8obWlza28pOiByZW1vdmUgdGhpcyBmcm9tIHRoZSBMVmlldyBzaW5jZSBpdCBpcyBuZ0Rldk1vZGU9dHJ1ZSBtb2RlIG9ubHkuXG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmNoZWNrTm9DaGFuZ2VzTW9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENoZWNrTm9DaGFuZ2VzTW9kZShtb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGluc3RydWN0aW9uU3RhdGUuY2hlY2tOb0NoYW5nZXNNb2RlID0gbW9kZTtcbn1cblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgbGV0IGluZGV4ID0gbEZyYW1lLmJpbmRpbmdSb290SW5kZXg7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBjb25zdCBsVmlldyA9IGxGcmFtZS5sVmlldztcbiAgICBpbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4O1xuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0QmluZGluZ0luZGV4KHZhbHVlOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuYmluZGluZ0luZGV4ID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0QmluZGluZ0luZGV4KCk6IG51bWJlciB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5iaW5kaW5nSW5kZXgrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEJpbmRpbmdJbmRleChjb3VudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgbEZyYW1lID0gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWU7XG4gIGNvbnN0IGluZGV4ID0gbEZyYW1lLmJpbmRpbmdJbmRleDtcbiAgbEZyYW1lLmJpbmRpbmdJbmRleCA9IGxGcmFtZS5iaW5kaW5nSW5kZXggKyBjb3VudDtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIFNldCBhIG5ldyBiaW5kaW5nIHJvb3QgaW5kZXggc28gdGhhdCBob3N0IHRlbXBsYXRlIGZ1bmN0aW9ucyBjYW4gZXhlY3V0ZS5cbiAqXG4gKiBCaW5kaW5ncyBpbnNpZGUgdGhlIGhvc3QgdGVtcGxhdGUgYXJlIDAgaW5kZXguIEJ1dCBiZWNhdXNlIHdlIGRvbid0IGtub3cgYWhlYWQgb2YgdGltZVxuICogaG93IG1hbnkgaG9zdCBiaW5kaW5ncyB3ZSBoYXZlIHdlIGNhbid0IHByZS1jb21wdXRlIHRoZW0uIEZvciB0aGlzIHJlYXNvbiB0aGV5IGFyZSBhbGxcbiAqIDAgaW5kZXggYW5kIHdlIGp1c3Qgc2hpZnQgdGhlIHJvb3Qgc28gdGhhdCB0aGV5IG1hdGNoIG5leHQgYXZhaWxhYmxlIGxvY2F0aW9uIGluIHRoZSBMVmlldy5cbiAqXG4gKiBAcGFyYW0gYmluZGluZ1Jvb3RJbmRleCBSb290IGluZGV4IGZvciBgaG9zdEJpbmRpbmdzYFxuICogQHBhcmFtIGN1cnJlbnREaXJlY3RpdmVJbmRleCBgVERhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XWAgd2lsbCBwb2ludCB0byB0aGUgY3VycmVudCBkaXJlY3RpdmVcbiAqICAgICAgICB3aG9zZSBgaG9zdEJpbmRpbmdzYCBhcmUgYmVpbmcgcHJvY2Vzc2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0QmluZGluZ1Jvb3RGb3JIb3N0QmluZGluZ3MoXG4gICAgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyLCBjdXJyZW50RGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgbEZyYW1lLmJpbmRpbmdJbmRleCA9IGxGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgbEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGN1cnJlbnREaXJlY3RpdmVJbmRleDtcbn1cblxuLyoqXG4gKiBXaGVuIGhvc3QgYmluZGluZyBpcyBleGVjdXRpbmcgdGhpcyBwb2ludHMgdG8gdGhlIGRpcmVjdGl2ZSBpbmRleC5cbiAqIGBUVmlldy5kYXRhW2dldEN1cnJlbnREaXJlY3RpdmVJbmRleCgpXWAgaXMgYERpcmVjdGl2ZURlZmBcbiAqIGBMVmlld1tnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKV1gIGlzIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREaXJlY3RpdmVJbmRleCgpOiBudW1iZXIge1xuICByZXR1cm4gaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY3VycmVudERpcmVjdGl2ZUluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJ5SW5kZXgoKTogbnVtYmVyIHtcbiAgcmV0dXJuIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnRRdWVyeUluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFF1ZXJ5SW5kZXgodmFsdWU6IG51bWJlcik6IHZvaWQge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50UXVlcnlJbmRleCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFRoaXMgaXMgYSBsaWdodCB3ZWlnaHQgdmVyc2lvbiBvZiB0aGUgYGVudGVyVmlld2Agd2hpY2ggaXMgbmVlZGVkIGJ5IHRoZSBESSBzeXN0ZW0uXG4gKiBAcGFyYW0gbmV3Vmlld1xuICogQHBhcmFtIHROb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlckRJKG5ld1ZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3T3JVbmRlZmluZWQobmV3Vmlldyk7XG4gIGNvbnN0IG5ld0xGcmFtZSA9IGFsbG9jTEZyYW1lKCk7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lID0gbmV3TEZyYW1lO1xuICBuZXdMRnJhbWUucHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGUgITtcbiAgbmV3TEZyYW1lLmxWaWV3ID0gbmV3VmlldztcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIHJlc2V0dGluZyBmb3Igc2FmZXR5IGluIGRldiBtb2RlIG9ubHkuXG4gICAgbmV3TEZyYW1lLmlzUGFyZW50ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLnNlbGVjdGVkSW5kZXggPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuY29udGV4dExWaWV3ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmVsZW1lbnREZXB0aENvdW50ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSBERVZfTU9ERV9WQUxVRTtcbiAgICBuZXdMRnJhbWUuY3VycmVudFNhbml0aXplciA9IERFVl9NT0RFX1ZBTFVFO1xuICAgIG5ld0xGcmFtZS5iaW5kaW5nUm9vdEluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gICAgbmV3TEZyYW1lLmN1cnJlbnRRdWVyeUluZGV4ID0gREVWX01PREVfVkFMVUU7XG4gIH1cbn1cblxuY29uc3QgREVWX01PREVfVkFMVUU6IGFueSA9XG4gICAgJ1ZhbHVlIGluZGljYXRpbmcgdGhhdCBESSBpcyB0cnlpbmcgdG8gcmVhZCB2YWx1ZSB3aGljaCBpdCBzaG91bGQgbm90IG5lZWQgdG8ga25vdyBhYm91dC4nO1xuXG4vKipcbiAqIFRoaXMgaXMgYSBsaWdodCB3ZWlnaHQgdmVyc2lvbiBvZiB0aGUgYGxlYXZlVmlld2Agd2hpY2ggaXMgbmVlZGVkIGJ5IHRoZSBESSBzeXN0ZW0uXG4gKlxuICogQmVjYXVzZSB0aGUgaW1wbGVtZW50YXRpb24gaXMgc2FtZSBpdCBpcyBvbmx5IGFuIGFsaWFzXG4gKi9cbmV4cG9ydCBjb25zdCBsZWF2ZURJID0gbGVhdmVWaWV3O1xuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgbFZpZXcgd2l0aCBhIG5ldyBsVmlldy5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgbFZpZXcgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgbFZpZXcgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgbFZpZXcgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIHROb2RlIEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzbHkgYWN0aXZlIGxWaWV3O1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlld09yVW5kZWZpbmVkKG5ld1ZpZXcpO1xuICBjb25zdCBuZXdMRnJhbWUgPSBhbGxvY0xGcmFtZSgpO1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IG5ld0xGcmFtZTtcbiAgbmV3TEZyYW1lLnByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlICE7XG4gIG5ld0xGcmFtZS5pc1BhcmVudCA9IHRydWU7XG4gIG5ld0xGcmFtZS5sVmlldyA9IG5ld1ZpZXc7XG4gIG5ld0xGcmFtZS5zZWxlY3RlZEluZGV4ID0gMDtcbiAgbmV3TEZyYW1lLmNvbnRleHRMVmlldyA9IG5ld1ZpZXcgITtcbiAgbmV3TEZyYW1lLmVsZW1lbnREZXB0aENvdW50ID0gMDtcbiAgbmV3TEZyYW1lLmN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICBuZXdMRnJhbWUuY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG4gIG5ld0xGcmFtZS5jdXJyZW50U2FuaXRpemVyID0gbnVsbDtcbiAgbmV3TEZyYW1lLmJpbmRpbmdSb290SW5kZXggPSAtMTtcbiAgbmV3TEZyYW1lLmJpbmRpbmdJbmRleCA9IG5ld1ZpZXcgPT09IG51bGwgPyAtMSA6IG5ld1ZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4O1xuICBuZXdMRnJhbWUuY3VycmVudFF1ZXJ5SW5kZXggPSAwO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyBuZXh0IGZyZWUgTEZyYW1lLiBUaGlzIGZ1bmN0aW9uIHRyaWVzIHRvIHJldXNlIHRoZSBgTEZyYW1lYHMgdG8gbG93ZXIgbWVtb3J5IHByZXNzdXJlLlxuICovXG5mdW5jdGlvbiBhbGxvY0xGcmFtZSgpIHtcbiAgY29uc3QgY3VycmVudExGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lO1xuICBjb25zdCBjaGlsZExGcmFtZSA9IGN1cnJlbnRMRnJhbWUgPT09IG51bGwgPyBudWxsIDogY3VycmVudExGcmFtZS5jaGlsZDtcbiAgY29uc3QgbmV3TEZyYW1lID0gY2hpbGRMRnJhbWUgPT09IG51bGwgPyBjcmVhdGVMRnJhbWUoY3VycmVudExGcmFtZSkgOiBjaGlsZExGcmFtZTtcbiAgcmV0dXJuIG5ld0xGcmFtZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTEZyYW1lKHBhcmVudDogTEZyYW1lIHwgbnVsbCk6IExGcmFtZSB7XG4gIGNvbnN0IGxGcmFtZTogTEZyYW1lID0ge1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogbnVsbCAhLCAgLy9cbiAgICBpc1BhcmVudDogdHJ1ZSwgICAgICAgICAgICAgICAgIC8vXG4gICAgbFZpZXc6IG51bGwgISwgICAgICAgICAgICAgICAgICAvL1xuICAgIHNlbGVjdGVkSW5kZXg6IDAsICAgICAgICAgICAgICAgLy9cbiAgICBjb250ZXh0TFZpZXc6IG51bGwgISwgICAgICAgICAgIC8vXG4gICAgZWxlbWVudERlcHRoQ291bnQ6IDAsICAgICAgICAgICAvL1xuICAgIGN1cnJlbnROYW1lc3BhY2U6IG51bGwsICAgICAgICAgLy9cbiAgICBjdXJyZW50U2FuaXRpemVyOiBudWxsLCAgICAgICAgIC8vXG4gICAgY3VycmVudERpcmVjdGl2ZUluZGV4OiAtMSwgICAgICAvL1xuICAgIGJpbmRpbmdSb290SW5kZXg6IC0xLCAgICAgICAgICAgLy9cbiAgICBiaW5kaW5nSW5kZXg6IC0xLCAgICAgICAgICAgICAgIC8vXG4gICAgY3VycmVudFF1ZXJ5SW5kZXg6IDAsICAgICAgICAgICAvL1xuICAgIHBhcmVudDogcGFyZW50ICEsICAgICAgICAgICAgICAgLy9cbiAgICBjaGlsZDogbnVsbCwgICAgICAgICAgICAgICAgICAgIC8vXG4gIH07XG4gIHBhcmVudCAhPT0gbnVsbCAmJiAocGFyZW50LmNoaWxkID0gbEZyYW1lKTsgIC8vIGxpbmsgdGhlIG5ldyBMRnJhbWUgZm9yIHJldXNlLlxuICByZXR1cm4gbEZyYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZSA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnBhcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyKTogVCB7XG4gIGNvbnN0IGNvbnRleHRMVmlldyA9IGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmNvbnRleHRMVmlldyA9XG4gICAgICB3YWxrVXBWaWV3cyhsZXZlbCwgaW5zdHJ1Y3Rpb25TdGF0ZS5sRnJhbWUuY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgZWxlbWVudCBpbmRleC5cbiAqXG4gKiBVc2VkIHdpdGgge0BsaW5rIHByb3BlcnR5fSBpbnN0cnVjdGlvbiAoYW5kIG1vcmUgaW4gdGhlIGZ1dHVyZSkgdG8gaWRlbnRpZnkgdGhlIGluZGV4IGluIHRoZVxuICogY3VycmVudCBgTFZpZXdgIHRvIGFjdCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkSW5kZXgoKSB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5zZWxlY3RlZEluZGV4O1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1vc3QgcmVjZW50IGluZGV4IHBhc3NlZCB0byB7QGxpbmsgc2VsZWN0fVxuICpcbiAqIFVzZWQgd2l0aCB7QGxpbmsgcHJvcGVydHl9IGluc3RydWN0aW9uIChhbmQgbW9yZSBpbiB0aGUgZnV0dXJlKSB0byBpZGVudGlmeSB0aGUgaW5kZXggaW4gdGhlXG4gKiBjdXJyZW50IGBMVmlld2AgdG8gYWN0IG9uLlxuICpcbiAqIChOb3RlIHRoYXQgaWYgYW4gXCJleGl0IGZ1bmN0aW9uXCIgd2FzIHNldCBlYXJsaWVyICh2aWEgYHNldEVsZW1lbnRFeGl0Rm4oKWApIHRoZW4gdGhhdCB3aWxsIGJlXG4gKiBydW4gaWYgYW5kIHdoZW4gdGhlIHByb3ZpZGVkIGBpbmRleGAgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0ZWQgaW5kZXggdmFsdWUuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U2VsZWN0ZWRJbmRleChpbmRleDogbnVtYmVyKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbn1cblxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ2AgaW4gZ2xvYmFsIHN0YXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bmFtZXNwYWNlU1ZHKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYCdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nYCBpbiBnbG9iYWwgc3RhdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIGluc3RydWN0aW9uU3RhdGUubEZyYW1lLmN1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBuYW1lc3BhY2UgdXNlZCB0byBjcmVhdGUgZWxlbWVudHMgdG8gYG51bGxgLCB3aGljaCBmb3JjZXMgZWxlbWVudCBjcmVhdGlvbiB0byB1c2VcbiAqIGBjcmVhdGVFbGVtZW50YCByYXRoZXIgdGhhbiBgY3JlYXRlRWxlbWVudE5TYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtW5hbWVzcGFjZUhUTUwoKSB7XG4gIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCgpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG5hbWVzcGFjZSB1c2VkIHRvIGNyZWF0ZSBlbGVtZW50cyB0byBgbnVsbGAsIHdoaWNoIGZvcmNlcyBlbGVtZW50IGNyZWF0aW9uIHRvIHVzZVxuICogYGNyZWF0ZUVsZW1lbnRgIHJhdGhlciB0aGFuIGBjcmVhdGVFbGVtZW50TlNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTEludGVybmFsKCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50TmFtZXNwYWNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZS5jdXJyZW50U2FuaXRpemVyID0gc2FuaXRpemVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKSB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpIHtcbiAgLy8gVE9ETyhtaXNrbyk6IFRoaXMgc2hvdWxkIHRocm93IHdoZW4gdGhlcmUgaXMgbm8gTFZpZXcsIGJ1dCBpdCB0dXJucyBvdXQgd2UgY2FuIGdldCBoZXJlIGZyb21cbiAgLy8gYE5vZGVTdHlsZURlYnVnYCBoZW5jZSB3ZSByZXR1cm4gYG51bGxgLiBUaGlzIHNob3VsZCBiZSBmaXhlZFxuICBjb25zdCBsRnJhbWUgPSBpbnN0cnVjdGlvblN0YXRlLmxGcmFtZTtcbiAgcmV0dXJuIGxGcmFtZSA9PT0gbnVsbCA/IG51bGwgOiBsRnJhbWUuY3VycmVudFNhbml0aXplcjtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBlbmNvZGluZyBib3RoIENsYXNzIGFuZCBTdHlsZSBpbmRleCBpbnRvIGBMRnJhbWUuc3R5bGluZ0JpbmRpbmdDaGFuZ2VkYC5cbiAqL1xuY29uc3QgZW51bSBCaW5kaW5nQ2hhbmdlZCB7XG4gIENMQVNTX1NISUZUID0gMTYsXG4gIFNUWUxFX01BU0sgPSAweEZGRkYsXG59XG4iXX0=