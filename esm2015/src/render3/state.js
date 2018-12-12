/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from './assert';
import { executeHooks } from './hooks';
import { BINDING_INDEX, CONTEXT, DECLARATION_VIEW, FLAGS, HOST_NODE, QUERIES, TVIEW } from './interfaces/view';
import { isContentQueryHost } from './util';
/** *
 * Store the element depth count. This is used to identify the root elements of the template
 * so that we can than attach `LView` to only those elements.
  @type {?} */
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
/** *
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
  @type {?} */
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
 *   <!-- disabledBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- enableBindings() -->
 * </div>
 * ```
 * @return {?}
 */
export function enableBindings() {
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
 *   <!-- disabledBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- enableBindings() -->
 * </div>
 * ```
 * @return {?}
 */
export function disableBindings() {
    bindingsEnabled = false;
}
/**
 * @return {?}
 */
export function getLView() {
    return lView;
}
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param {?} viewToRestore The OpaqueViewState instance to restore.
 * @return {?}
 */
export function restoreView(viewToRestore) {
    contextLView = /** @type {?} */ ((viewToRestore));
}
/** *
 * Used to set the parent property when nodes are created and track query results.
  @type {?} */
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
 * @return {?}
 */
export function setPreviousOrParentTNode(tNode) {
    previousOrParentTNode = tNode;
}
/**
 * @param {?} tNode
 * @param {?} view
 * @return {?}
 */
export function setTNodeAndViewData(tNode, view) {
    previousOrParentTNode = tNode;
    lView = view;
}
/** *
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
  @type {?} */
let isParent;
/**
 * @return {?}
 */
export function getIsParent() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return isParent;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setIsParent(value) {
    isParent = value;
}
/**
 * Query instructions can ask for "current queries" in 2 different cases:
 * - when creating view queries (at the root of a component view, before any node is created - in
 * this case currentQueries points to view queries)
 * - when creating content queries (i.e. this previousOrParentTNode points to a node on which we
 * create content queries).
 * @param {?} QueryType
 * @return {?}
 */
export function getOrCreateCurrentQueries(QueryType) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    let currentQueries = lView[QUERIES];
    // if this is the first content query on a node, any existing LQueries needs to be cloned
    // in subsequent template passes, the cloning occurs before directive instantiation.
    if (previousOrParentTNode && previousOrParentTNode !== lView[HOST_NODE] &&
        !isContentQueryHost(previousOrParentTNode)) {
        currentQueries && (currentQueries = lView[QUERIES] = currentQueries.clone());
        previousOrParentTNode.flags |= 4 /* hasContentQuery */;
    }
    return currentQueries || (lView[QUERIES] = new QueryType(null, null, null));
}
/** *
 * This property gets set before entering a template.
  @type {?} */
let creationMode;
/**
 * @return {?}
 */
export function getCreationMode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return creationMode;
}
/** *
 * State of the current view being processed.
 *
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
  @type {?} */
let lView;
/** *
 * The last viewData retrieved by nextContext().
 * Allows building nextContext() and reference() calls.
 *
 * e.g. const inner = x().$implicit; const outer = x().$implicit;
  @type {?} */
let contextLView = /** @type {?} */ ((null));
/**
 * @return {?}
 */
export function getContextLView() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return contextLView;
}
/** *
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
  @type {?} */
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
/** *
 * Whether or not this is the first time the current view has been processed.
  @type {?} */
let firstTemplatePass = true;
/**
 * @return {?}
 */
export function getFirstTemplatePass() {
    return firstTemplatePass;
}
/**
 * @param {?} value
 * @return {?}
 */
export function setFirstTemplatePass(value) {
    firstTemplatePass = value;
}
/** *
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
  @type {?} */
let bindingRootIndex = -1;
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
    /** @type {?} */
    const oldView = lView;
    if (newView) {
        /** @type {?} */
        const tView = newView[TVIEW];
        creationMode = (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
        firstTemplatePass = tView.firstTemplatePass;
        bindingRootIndex = tView.bindingStartIndex;
    }
    previousOrParentTNode = /** @type {?} */ ((hostTNode));
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
    contextLView = walkUpViews(level, /** @type {?} */ ((contextLView)));
    return /** @type {?} */ (contextLView[CONTEXT]);
}
/**
 * @param {?} nestingLevel
 * @param {?} currentView
 * @return {?}
 */
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = /** @type {?} */ ((currentView[DECLARATION_VIEW]));
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
    previousOrParentTNode = /** @type {?} */ ((null));
    elementDepthCount = 0;
    bindingsEnabled = true;
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param {?} newView New state to become active
 * @param {?=} creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 * @return {?}
 */
export function leaveView(newView, creationOnly) {
    /** @type {?} */
    const tView = lView[TVIEW];
    if (!creationOnly) {
        if (!checkNoChangesMode) {
            executeHooks(lView, tView.viewHooks, tView.viewCheckHooks, creationMode);
        }
        // Views are clean and in update mode after being checked, so these bits are cleared
        lView[FLAGS] &= ~(1 /* CreationMode */ | 4 /* Dirty */);
    }
    lView[FLAGS] |= 16 /* RunInit */;
    lView[BINDING_INDEX] = tView.bindingStartIndex;
    enterView(newView, null);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBSXJDLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxTQUFTLEVBQXNDLE9BQU8sRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqSixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7O0FBUTFDLElBQUksaUJBQWlCLENBQVc7Ozs7QUFFaEMsTUFBTSxVQUFVLG9CQUFvQjs7SUFFbEMsT0FBTyxpQkFBaUIsQ0FBQztDQUMxQjs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztDQUNyQjs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUI7SUFDdkMsaUJBQWlCLEVBQUUsQ0FBQztDQUNyQjs7QUFFRCxJQUFJLG1CQUFtQixHQUE2QyxJQUFJLENBQUM7Ozs7QUFFekUsTUFBTSxVQUFVLHNCQUFzQjs7SUFFcEMsT0FBTyxtQkFBbUIsQ0FBQztDQUM1Qjs7Ozs7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsR0FBK0M7SUFDcEYsbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0NBQzNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JELElBQUksZUFBZSxDQUFZOzs7O0FBRS9CLE1BQU0sVUFBVSxrQkFBa0I7O0lBRWhDLE9BQU8sZUFBZSxDQUFDO0NBQ3hCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JELE1BQU0sVUFBVSxjQUFjO0lBQzVCLGVBQWUsR0FBRyxJQUFJLENBQUM7Q0FDeEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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QVMsQ0FBQyxPQUFjLEVBQUUsWUFBc0I7O0lBQzlELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUN2QixZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUMxRTs7UUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLG9DQUEwQyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLG9CQUFzQixDQUFDO0lBQ25DLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7SUFDL0MsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztDQUMxQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhPU1RfTk9ERSwgTFZpZXcsIExWaWV3RmxhZ3MsIE9wYXF1ZVZpZXdTdGF0ZSwgUVVFUklFUywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7aXNDb250ZW50UXVlcnlIb3N0fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3YCB0byBvbmx5IHRob3NlIGVsZW1lbnRzLlxuICovXG5sZXQgZWxlbWVudERlcHRoQ291bnQgITogbnVtYmVyO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWxlbWVudERlcHRoQ291bnQoKSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGVsZW1lbnREZXB0aENvdW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpIHtcbiAgZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKSB7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbmxldCBjdXJyZW50RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PnxudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnREaXJlY3RpdmVEZWYoKTogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT58bnVsbCB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVEZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+fCBudWxsKTogdm9pZCB7XG4gIGN1cnJlbnREaXJlY3RpdmVEZWYgPSBkZWY7XG59XG5cbi8qKlxuICogU3RvcmVzIHdoZXRoZXIgZGlyZWN0aXZlcyBzaG91bGQgYmUgbWF0Y2hlZCB0byBlbGVtZW50cy5cbiAqXG4gKiBXaGVuIHRlbXBsYXRlIGNvbnRhaW5zIGBuZ05vbkJpbmRhYmxlYCB0aGFuIHdlIG5lZWQgdG8gcHJldmVudCB0aGUgcnVudGltZSBmb3JtIG1hdGNoaW5nXG4gKiBkaXJlY3RpdmVzIG9uIGNoaWxkcmVuIG9mIHRoYXQgZWxlbWVudC5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICovXG5sZXQgYmluZGluZ3NFbmFibGVkICE6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nc0VuYWJsZWQoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGJpbmRpbmdzRW5hYmxlZDtcbn1cblxuXG4vKipcbiAqIEVuYWJsZXMgZGlyZWN0aXZlIG1hdGNoaW5nIG9uIGVsZW1lbnRzLlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSBkaXNhYmxlZEJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVCaW5kaW5ncygpOiB2b2lkIHtcbiAgYmluZGluZ3NFbmFibGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBEaXNhYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudC5cbiAqXG4gKiAgKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgIFNob3VsZCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUuXG4gKiA8L215LWNvbXA+XG4gKiA8ZGl2IG5nTm9uQmluZGFibGU+XG4gKiAgIDwhLS0gZGlzYWJsZWRCaW5kaW5ncygpIC0tPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogICA8IS0tIGVuYWJsZUJpbmRpbmdzKCkgLS0+XG4gKiA8L2Rpdj5cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3KCk6IExWaWV3IHtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRMVmlldyA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3O1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkIGFuZCB0cmFjayBxdWVyeSByZXN1bHRzLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGU6IFROb2RlKSB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3KSB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHROb2RlO1xuICBsVmlldyA9IHZpZXc7XG59XG5cbi8qKlxuICogSWYgYGlzUGFyZW50YCBpczpcbiAqICAtIGB0cnVlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICovXG5sZXQgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJc1BhcmVudCgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gaXNQYXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc1BhcmVudCh2YWx1ZTogYm9vbGVhbik6IHZvaWQge1xuICBpc1BhcmVudCA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFF1ZXJ5IGluc3RydWN0aW9ucyBjYW4gYXNrIGZvciBcImN1cnJlbnQgcXVlcmllc1wiIGluIDIgZGlmZmVyZW50IGNhc2VzOlxuICogLSB3aGVuIGNyZWF0aW5nIHZpZXcgcXVlcmllcyAoYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQgdmlldywgYmVmb3JlIGFueSBub2RlIGlzIGNyZWF0ZWQgLSBpblxuICogdGhpcyBjYXNlIGN1cnJlbnRRdWVyaWVzIHBvaW50cyB0byB2aWV3IHF1ZXJpZXMpXG4gKiAtIHdoZW4gY3JlYXRpbmcgY29udGVudCBxdWVyaWVzIChpLmUuIHRoaXMgcHJldmlvdXNPclBhcmVudFROb2RlIHBvaW50cyB0byBhIG5vZGUgb24gd2hpY2ggd2VcbiAqIGNyZWF0ZSBjb250ZW50IHF1ZXJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhcbiAgICBRdWVyeVR5cGU6IHtuZXcgKHBhcmVudDogbnVsbCwgc2hhbGxvdzogbnVsbCwgZGVlcDogbnVsbCk6IExRdWVyaWVzfSk6IExRdWVyaWVzIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBsZXQgY3VycmVudFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgLy8gaWYgdGhpcyBpcyB0aGUgZmlyc3QgY29udGVudCBxdWVyeSBvbiBhIG5vZGUsIGFueSBleGlzdGluZyBMUXVlcmllcyBuZWVkcyB0byBiZSBjbG9uZWRcbiAgLy8gaW4gc3Vic2VxdWVudCB0ZW1wbGF0ZSBwYXNzZXMsIHRoZSBjbG9uaW5nIG9jY3VycyBiZWZvcmUgZGlyZWN0aXZlIGluc3RhbnRpYXRpb24uXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSBsVmlld1tIT1NUX05PREVdICYmXG4gICAgICAhaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmNsb25lKCkpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW50UXVlcmllcyB8fCAobFZpZXdbUVVFUklFU10gPSBuZXcgUXVlcnlUeXBlKG51bGwsIG51bGwsIG51bGwpKTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICovXG5sZXQgY3JlYXRpb25Nb2RlOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3JlYXRpb25Nb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjcmVhdGlvbk1vZGU7XG59XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICovXG5sZXQgbFZpZXc6IExWaWV3O1xuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0TFZpZXc6IExWaWV3ID0gbnVsbCAhO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGV4dExWaWV3KCk6IExWaWV3IHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY29udGV4dExWaWV3O1xufVxuXG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNoZWNrTm9DaGFuZ2VzTW9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENoZWNrTm9DaGFuZ2VzTW9kZShtb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IG1vZGU7XG59XG5cbi8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBjdXJyZW50IHZpZXcgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xubGV0IGZpcnN0VGVtcGxhdGVQYXNzID0gdHJ1ZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZpcnN0VGVtcGxhdGVQYXNzKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZmlyc3RUZW1wbGF0ZVBhc3M7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRGaXJzdFRlbXBsYXRlUGFzcyh2YWx1ZTogYm9vbGVhbik6IHZvaWQge1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5leHBhbmRvU3RhcnRJbmRleCArIGFueSBkaXJzL2hvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICovXG5sZXQgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyID0gLTE7XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgcmV0dXJuIGJpbmRpbmdSb290SW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCaW5kaW5nUm9vdCh2YWx1ZTogbnVtYmVyKSB7XG4gIGJpbmRpbmdSb290SW5kZXggPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRWaWV3Tm9kZSB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IG9sZFZpZXcgPSBsVmlldztcbiAgaWYgKG5ld1ZpZXcpIHtcbiAgICBjb25zdCB0VmlldyA9IG5ld1ZpZXdbVFZJRVddO1xuXG4gICAgY3JlYXRpb25Nb2RlID0gKG5ld1ZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICBmaXJzdFRlbXBsYXRlUGFzcyA9IHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuICAgIGJpbmRpbmdSb290SW5kZXggPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgbFZpZXcgPSBjb250ZXh0TFZpZXcgPSBuZXdWaWV3O1xuICByZXR1cm4gb2xkVmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0SW1wbDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0TFZpZXcgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dExWaWV3ICEpO1xuICByZXR1cm4gY29udGV4dExWaWV3W0NPTlRFWFRdIGFzIFQ7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gY3JlYXRpb25Pbmx5IEFuIG9wdGlvbmFsIGJvb2xlYW4gdG8gaW5kaWNhdGUgdGhhdCB0aGUgdmlldyB3YXMgcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGVcbiAqIG9ubHksIGkuZS4gdGhlIGZpcnN0IHVwZGF0ZSB3aWxsIGJlIGRvbmUgbGF0ZXIuIE9ubHkgcG9zc2libGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmICghY3JlYXRpb25Pbmx5KSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVIb29rcyhsVmlldywgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkRpcnR5KTtcbiAgfVxuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG4iXX0=