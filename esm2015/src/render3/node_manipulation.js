/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
import { RendererStyleFlags2 } from '../render/api_flags';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertDomNode, assertEqual, assertFunction, assertString } from '../util/assert';
import { escapeCommentText } from '../util/dom';
import { assertLContainer, assertLView, assertParentView, assertProjectionSlots, assertTNodeForLView } from './assert';
import { attachPatchData } from './context_discovery';
import { icuContainerIterate } from './i18n/i18n_tree_shaking';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS, NATIVE, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unregisterLView } from './interfaces/lview_tracking';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { isLContainer, isLView } from './interfaces/type_checks';
import { CHILD_HEAD, CLEANUP, DECLARATION_COMPONENT_VIEW, DECLARATION_LCONTAINER, FLAGS, HOST, NEXT, PARENT, QUERIES, RENDERER, T_HOST, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { getLViewParent } from './util/view_traversal_utils';
import { getNativeByTNode, unwrapRNode, updateTransplantedViewCount } from './util/view_utils';
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 */
function applyToElementOrContainer(action, renderer, parent, lNodeToHandle, beforeNode) {
    // If this slot was allocated for a text node dynamically created by i18n, the text node itself
    // won't be created until i18nApply() in the update block, so this node should be skipped.
    // For more info, see "ICU expressions should work inside an ngTemplateOutlet inside an ngFor"
    // in `i18n_spec.ts`.
    if (lNodeToHandle != null) {
        let lContainer;
        let isComponent = false;
        // We are expecting an RNode, but in the case of a component or LContainer the `RNode` is
        // wrapped in an array which needs to be unwrapped. We need to know if it is a component and if
        // it has LContainer so that we can process all of those cases appropriately.
        if (isLContainer(lNodeToHandle)) {
            lContainer = lNodeToHandle;
        }
        else if (isLView(lNodeToHandle)) {
            isComponent = true;
            ngDevMode && assertDefined(lNodeToHandle[HOST], 'HOST must be defined for a component LView');
            lNodeToHandle = lNodeToHandle[HOST];
        }
        const rNode = unwrapRNode(lNodeToHandle);
        ngDevMode && !isProceduralRenderer(renderer) && assertDomNode(rNode);
        if (action === 0 /* Create */ && parent !== null) {
            if (beforeNode == null) {
                nativeAppendChild(renderer, parent, rNode);
            }
            else {
                nativeInsertBefore(renderer, parent, rNode, beforeNode || null, true);
            }
        }
        else if (action === 1 /* Insert */ && parent !== null) {
            nativeInsertBefore(renderer, parent, rNode, beforeNode || null, true);
        }
        else if (action === 2 /* Detach */) {
            nativeRemoveNode(renderer, rNode, isComponent);
        }
        else if (action === 3 /* Destroy */) {
            ngDevMode && ngDevMode.rendererDestroyNode++;
            renderer.destroyNode(rNode);
        }
        if (lContainer != null) {
            applyContainer(renderer, action, lContainer, parent, beforeNode);
        }
    }
}
export function createTextNode(renderer, value) {
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    ngDevMode && ngDevMode.rendererSetText++;
    return isProceduralRenderer(renderer) ? renderer.createText(value) :
        renderer.createTextNode(value);
}
export function updateTextNode(renderer, rNode, value) {
    ngDevMode && ngDevMode.rendererSetText++;
    isProceduralRenderer(renderer) ? renderer.setValue(rNode, value) : rNode.textContent = value;
}
export function createCommentNode(renderer, value) {
    ngDevMode && ngDevMode.rendererCreateComment++;
    // isProceduralRenderer check is not needed because both `Renderer2` and `Renderer3` have the same
    // method name.
    return renderer.createComment(escapeCommentText(value));
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param renderer A renderer to use
 * @param name the tag name
 * @param namespace Optional namespace for element.
 * @returns the element created
 */
export function createElementNode(renderer, name, namespace) {
    ngDevMode && ngDevMode.rendererCreateElement++;
    if (isProceduralRenderer(renderer)) {
        return renderer.createElement(name, namespace);
    }
    else {
        return namespace === null ? renderer.createElement(name) :
            renderer.createElementNS(namespace, name);
    }
}
/**
 * Removes all DOM elements associated with a view.
 *
 * Because some root nodes of the view may be containers, we sometimes need
 * to propagate deeply into the nested containers to remove all elements in the
 * views beneath it.
 *
 * @param tView The `TView' of the `LView` from which elements should be added or removed
 * @param lView The view from which elements should be added or removed
 */
export function removeViewFromContainer(tView, lView) {
    const renderer = lView[RENDERER];
    applyView(tView, lView, renderer, 2 /* Detach */, null, null);
    lView[HOST] = null;
    lView[T_HOST] = null;
}
/**
 * Adds all DOM elements associated with a view.
 *
 * Because some root nodes of the view may be containers, we sometimes need
 * to propagate deeply into the nested containers to add all elements in the
 * views beneath it.
 *
 * @param tView The `TView' of the `LView` from which elements should be added or removed
 * @param parentTNode The `TNode` where the `LView` should be attached to.
 * @param renderer Current renderer to use for DOM manipulations.
 * @param lView The view from which elements should be added or removed
 * @param parentNativeNode The parent `RElement` where it should be inserted into.
 * @param beforeNode The node before which elements should be added, if insert mode
 */
export function addViewToContainer(tView, parentTNode, renderer, lView, parentNativeNode, beforeNode) {
    lView[HOST] = parentNativeNode;
    lView[T_HOST] = parentTNode;
    applyView(tView, lView, renderer, 1 /* Insert */, parentNativeNode, beforeNode);
}
/**
 * Detach a `LView` from the DOM by detaching its nodes.
 *
 * @param tView The `TView' of the `LView` to be detached
 * @param lView the `LView` to be detached.
 */
export function renderDetachView(tView, lView) {
    applyView(tView, lView, lView[RENDERER], 2 /* Detach */, null, null);
}
/**
 * Traverses down and up the tree of views and containers to remove listeners and
 * call onDestroy callbacks.
 *
 * Notes:
 *  - Because it's used for onDestroy calls, it needs to be bottom-up.
 *  - Must process containers instead of their views to avoid splicing
 *  when views are destroyed and re-added.
 *  - Using a while loop because it's faster than recursion
 *  - Destroy only called on movement to sibling or movement to parent (laterally or up)
 *
 *  @param rootView The view to destroy
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    let lViewOrLContainer = rootView[CHILD_HEAD];
    if (!lViewOrLContainer) {
        return cleanUpView(rootView[TVIEW], rootView);
    }
    while (lViewOrLContainer) {
        let next = null;
        if (isLView(lViewOrLContainer)) {
            // If LView, traverse down to child.
            next = lViewOrLContainer[CHILD_HEAD];
        }
        else {
            ngDevMode && assertLContainer(lViewOrLContainer);
            // If container, traverse down to its first LView.
            const firstView = lViewOrLContainer[CONTAINER_HEADER_OFFSET];
            if (firstView)
                next = firstView;
        }
        if (!next) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (lViewOrLContainer && !lViewOrLContainer[NEXT] && lViewOrLContainer !== rootView) {
                if (isLView(lViewOrLContainer)) {
                    cleanUpView(lViewOrLContainer[TVIEW], lViewOrLContainer);
                }
                lViewOrLContainer = lViewOrLContainer[PARENT];
            }
            if (lViewOrLContainer === null)
                lViewOrLContainer = rootView;
            if (isLView(lViewOrLContainer)) {
                cleanUpView(lViewOrLContainer[TVIEW], lViewOrLContainer);
            }
            next = lViewOrLContainer && lViewOrLContainer[NEXT];
        }
        lViewOrLContainer = next;
    }
}
/**
 * Inserts a view into a container.
 *
 * This adds the view to the container's array of active views in the correct
 * position. It also adds the view's elements to the DOM if the container isn't a
 * root node of another view (in that case, the view's elements will be added when
 * the container's parent view is added later).
 *
 * @param tView The `TView' of the `LView` to insert
 * @param lView The view to insert
 * @param lContainer The container into which the view should be inserted
 * @param index Which index in the container to insert the child view into
 */
export function insertView(tView, lView, lContainer, index) {
    ngDevMode && assertLView(lView);
    ngDevMode && assertLContainer(lContainer);
    const indexInContainer = CONTAINER_HEADER_OFFSET + index;
    const containerLength = lContainer.length;
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        lContainer[indexInContainer - 1][NEXT] = lView;
    }
    if (index < containerLength - CONTAINER_HEADER_OFFSET) {
        lView[NEXT] = lContainer[indexInContainer];
        addToArray(lContainer, CONTAINER_HEADER_OFFSET + index, lView);
    }
    else {
        lContainer.push(lView);
        lView[NEXT] = null;
    }
    lView[PARENT] = lContainer;
    // track views where declaration and insertion points are different
    const declarationLContainer = lView[DECLARATION_LCONTAINER];
    if (declarationLContainer !== null && lContainer !== declarationLContainer) {
        trackMovedView(declarationLContainer, lView);
    }
    // notify query that a new view has been added
    const lQueries = lView[QUERIES];
    if (lQueries !== null) {
        lQueries.insertView(tView);
    }
    // Sets the attached flag
    lView[FLAGS] |= 128 /* Attached */;
}
/**
 * Track views created from the declaration container (TemplateRef) and inserted into a
 * different LContainer.
 */
function trackMovedView(declarationContainer, lView) {
    ngDevMode && assertDefined(lView, 'LView required');
    ngDevMode && assertLContainer(declarationContainer);
    const movedViews = declarationContainer[MOVED_VIEWS];
    const insertedLContainer = lView[PARENT];
    ngDevMode && assertLContainer(insertedLContainer);
    const insertedComponentLView = insertedLContainer[PARENT][DECLARATION_COMPONENT_VIEW];
    ngDevMode && assertDefined(insertedComponentLView, 'Missing insertedComponentLView');
    const declaredComponentLView = lView[DECLARATION_COMPONENT_VIEW];
    ngDevMode && assertDefined(declaredComponentLView, 'Missing declaredComponentLView');
    if (declaredComponentLView !== insertedComponentLView) {
        // At this point the declaration-component is not same as insertion-component; this means that
        // this is a transplanted view. Mark the declared lView as having transplanted views so that
        // those views can participate in CD.
        declarationContainer[HAS_TRANSPLANTED_VIEWS] = true;
    }
    if (movedViews === null) {
        declarationContainer[MOVED_VIEWS] = [lView];
    }
    else {
        movedViews.push(lView);
    }
}
function detachMovedView(declarationContainer, lView) {
    ngDevMode && assertLContainer(declarationContainer);
    ngDevMode &&
        assertDefined(declarationContainer[MOVED_VIEWS], 'A projected view should belong to a non-empty projected views collection');
    const movedViews = declarationContainer[MOVED_VIEWS];
    const declarationViewIndex = movedViews.indexOf(lView);
    const insertionLContainer = lView[PARENT];
    ngDevMode && assertLContainer(insertionLContainer);
    // If the view was marked for refresh but then detached before it was checked (where the flag
    // would be cleared and the counter decremented), we need to decrement the view counter here
    // instead.
    if (lView[FLAGS] & 1024 /* RefreshTransplantedView */) {
        lView[FLAGS] &= ~1024 /* RefreshTransplantedView */;
        updateTransplantedViewCount(insertionLContainer, -1);
    }
    movedViews.splice(declarationViewIndex, 1);
}
/**
 * Detaches a view from a container.
 *
 * This method removes the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param lContainer The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @returns Detached LView instance.
 */
export function detachView(lContainer, removeIndex) {
    if (lContainer.length <= CONTAINER_HEADER_OFFSET)
        return;
    const indexInContainer = CONTAINER_HEADER_OFFSET + removeIndex;
    const viewToDetach = lContainer[indexInContainer];
    if (viewToDetach) {
        const declarationLContainer = viewToDetach[DECLARATION_LCONTAINER];
        if (declarationLContainer !== null && declarationLContainer !== lContainer) {
            detachMovedView(declarationLContainer, viewToDetach);
        }
        if (removeIndex > 0) {
            lContainer[indexInContainer - 1][NEXT] = viewToDetach[NEXT];
        }
        const removedLView = removeFromArray(lContainer, CONTAINER_HEADER_OFFSET + removeIndex);
        removeViewFromContainer(viewToDetach[TVIEW], viewToDetach);
        // notify query that a view has been removed
        const lQueries = removedLView[QUERIES];
        if (lQueries !== null) {
            lQueries.detachView(removedLView[TVIEW]);
        }
        viewToDetach[PARENT] = null;
        viewToDetach[NEXT] = null;
        // Unsets the attached flag
        viewToDetach[FLAGS] &= ~128 /* Attached */;
    }
    return viewToDetach;
}
/**
 * A standalone function which destroys an LView,
 * conducting clean up (e.g. removing listeners, calling onDestroys).
 *
 * @param tView The `TView' of the `LView` to be destroyed
 * @param lView The view to be destroyed.
 */
export function destroyLView(tView, lView) {
    if (!(lView[FLAGS] & 256 /* Destroyed */)) {
        const renderer = lView[RENDERER];
        if (isProceduralRenderer(renderer) && renderer.destroyNode) {
            applyView(tView, lView, renderer, 3 /* Destroy */, null, null);
        }
        destroyViewTree(lView);
        unregisterLView(lView);
    }
}
/**
 * Calls onDestroys hooks for all directives and pipes in a given view and then removes all
 * listeners. Listeners are removed as the last step so events delivered in the onDestroys hooks
 * can be propagated to @Output listeners.
 *
 * @param tView `TView` for the `LView` to clean up.
 * @param lView The LView to clean up
 */
function cleanUpView(tView, lView) {
    if (!(lView[FLAGS] & 256 /* Destroyed */)) {
        // Usually the Attached flag is removed when the view is detached from its parent, however
        // if it's a root view, the flag won't be unset hence why we're also removing on destroy.
        lView[FLAGS] &= ~128 /* Attached */;
        // Mark the LView as destroyed *before* executing the onDestroy hooks. An onDestroy hook
        // runs arbitrary user code, which could include its own `viewRef.destroy()` (or similar). If
        // We don't flag the view as destroyed before the hooks, this could lead to an infinite loop.
        // This also aligns with the ViewEngine behavior. It also means that the onDestroy hook is
        // really more of an "afterDestroy" hook if you think about it.
        lView[FLAGS] |= 256 /* Destroyed */;
        executeOnDestroys(tView, lView);
        processCleanups(tView, lView);
        // For component views only, the local renderer is destroyed at clean up time.
        if (lView[TVIEW].type === 1 /* Component */ && isProceduralRenderer(lView[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            lView[RENDERER].destroy();
        }
        const declarationContainer = lView[DECLARATION_LCONTAINER];
        // we are dealing with an embedded view that is still inserted into a container
        if (declarationContainer !== null && isLContainer(lView[PARENT])) {
            // and this is a projected view
            if (declarationContainer !== lView[PARENT]) {
                detachMovedView(declarationContainer, lView);
            }
            // For embedded views still attached to a container: remove query result from this view.
            const lQueries = lView[QUERIES];
            if (lQueries !== null) {
                lQueries.detachView(tView);
            }
        }
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function processCleanups(tView, lView) {
    const tCleanup = tView.cleanup;
    const lCleanup = lView[CLEANUP];
    // `LCleanup` contains both share information with `TCleanup` as well as instance specific
    // information appended at the end. We need to know where the end of the `TCleanup` information
    // is, and we track this with `lastLCleanupIndex`.
    let lastLCleanupIndex = -1;
    if (tCleanup !== null) {
        for (let i = 0; i < tCleanup.length - 1; i += 2) {
            if (typeof tCleanup[i] === 'string') {
                // This is a native DOM listener
                const idxOrTargetGetter = tCleanup[i + 1];
                const target = typeof idxOrTargetGetter === 'function' ?
                    idxOrTargetGetter(lView) :
                    unwrapRNode(lView[idxOrTargetGetter]);
                const listener = lCleanup[lastLCleanupIndex = tCleanup[i + 2]];
                const useCaptureOrSubIdx = tCleanup[i + 3];
                if (typeof useCaptureOrSubIdx === 'boolean') {
                    // native DOM listener registered with Renderer3
                    target.removeEventListener(tCleanup[i], listener, useCaptureOrSubIdx);
                }
                else {
                    if (useCaptureOrSubIdx >= 0) {
                        // unregister
                        lCleanup[lastLCleanupIndex = useCaptureOrSubIdx]();
                    }
                    else {
                        // Subscription
                        lCleanup[lastLCleanupIndex = -useCaptureOrSubIdx].unsubscribe();
                    }
                }
                i += 2;
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                const context = lCleanup[lastLCleanupIndex = tCleanup[i + 1]];
                tCleanup[i].call(context);
            }
        }
    }
    if (lCleanup !== null) {
        for (let i = lastLCleanupIndex + 1; i < lCleanup.length; i++) {
            const instanceCleanupFn = lCleanup[i];
            ngDevMode && assertFunction(instanceCleanupFn, 'Expecting instance cleanup function.');
            instanceCleanupFn();
        }
        lView[CLEANUP] = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(tView, lView) {
    let destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        for (let i = 0; i < destroyHooks.length; i += 2) {
            const context = lView[destroyHooks[i]];
            // Only call the destroy hook if the context has been requested.
            if (!(context instanceof NodeInjectorFactory)) {
                const toCall = destroyHooks[i + 1];
                if (Array.isArray(toCall)) {
                    for (let j = 0; j < toCall.length; j += 2) {
                        toCall[j + 1].call(context[toCall[j]]);
                    }
                }
                else {
                    toCall.call(context);
                }
            }
        }
    }
}
/**
 * Returns a native element if a node can be inserted into the given parent.
 *
 * There are two reasons why we may not be able to insert a element immediately.
 * - Projection: When creating a child content element of a component, we have to skip the
 *   insertion because the content of a component will be projected.
 *   `<component><content>delayed due to projection</content></component>`
 * - Parent container is disconnected: This can happen when we are inserting a view into
 *   parent container, which itself is disconnected. For example the parent container is part
 *   of a View which has not be inserted or is made for projection but has not been inserted
 *   into destination.
 *
 * @param tView: Current `TView`.
 * @param tNode: `TNode` for which we wish to retrieve render parent.
 * @param lView: Current `LView`.
 */
export function getParentRElement(tView, tNode, lView) {
    return getClosestRElement(tView, tNode.parent, lView);
}
/**
 * Get closest `RElement` or `null` if it can't be found.
 *
 * If `TNode` is `TNodeType.Element` => return `RElement` at `LView[tNode.index]` location.
 * If `TNode` is `TNodeType.ElementContainer|IcuContain` => return the parent (recursively).
 * If `TNode` is `null` then return host `RElement`:
 *   - return `null` if projection
 *   - return `null` if parent container is disconnected (we have no parent.)
 *
 * @param tView: Current `TView`.
 * @param tNode: `TNode` for which we wish to retrieve `RElement` (or `null` if host element is
 *     needed).
 * @param lView: Current `LView`.
 * @returns `null` if the `RElement` can't be determined at this time (no parent / projection)
 */
export function getClosestRElement(tView, tNode, lView) {
    let parentTNode = tNode;
    // Skip over element and ICU containers as those are represented by a comment node and
    // can't be used as a render parent.
    while (parentTNode !== null &&
        (parentTNode.type & (8 /* ElementContainer */ | 32 /* Icu */))) {
        tNode = parentTNode;
        parentTNode = tNode.parent;
    }
    // If the parent tNode is null, then we are inserting across views: either into an embedded view
    // or a component view.
    if (parentTNode === null) {
        // We are inserting a root element of the component view into the component host element and
        // it should always be eager.
        return lView[HOST];
    }
    else {
        ngDevMode && assertTNodeType(parentTNode, 3 /* AnyRNode */ | 4 /* Container */);
        if (parentTNode.flags & 2 /* isComponentHost */) {
            ngDevMode && assertTNodeForLView(parentTNode, lView);
            const encapsulation = tView.data[parentTNode.directiveStart].encapsulation;
            // We've got a parent which is an element in the current view. We just need to verify if the
            // parent element is not a component. Component's content nodes are not inserted immediately
            // because they will be projected, and so doing insert at this point would be wasteful.
            // Since the projection would then move it to its final destination. Note that we can't
            // make this assumption when using the Shadow DOM, because the native projection placeholders
            // (<content> or <slot>) have to be in place as elements are being inserted.
            if (encapsulation === ViewEncapsulation.None ||
                encapsulation === ViewEncapsulation.Emulated) {
                return null;
            }
        }
        return getNativeByTNode(parentTNode, lView);
    }
}
/**
 * Inserts a native node before another native node for a given parent using {@link Renderer3}.
 * This is a utility function that can be used when native nodes were determined - it abstracts an
 * actual renderer being used.
 */
export function nativeInsertBefore(renderer, parent, child, beforeNode, isMove) {
    ngDevMode && ngDevMode.rendererInsertBefore++;
    if (isProceduralRenderer(renderer)) {
        renderer.insertBefore(parent, child, beforeNode, isMove);
    }
    else {
        parent.insertBefore(child, beforeNode, isMove);
    }
}
function nativeAppendChild(renderer, parent, child) {
    ngDevMode && ngDevMode.rendererAppendChild++;
    ngDevMode && assertDefined(parent, 'parent node must be defined');
    if (isProceduralRenderer(renderer)) {
        renderer.appendChild(parent, child);
    }
    else {
        parent.appendChild(child);
    }
}
function nativeAppendOrInsertBefore(renderer, parent, child, beforeNode, isMove) {
    if (beforeNode !== null) {
        nativeInsertBefore(renderer, parent, child, beforeNode, isMove);
    }
    else {
        nativeAppendChild(renderer, parent, child);
    }
}
/** Removes a node from the DOM given its native parent. */
function nativeRemoveChild(renderer, parent, child, isHostElement) {
    if (isProceduralRenderer(renderer)) {
        renderer.removeChild(parent, child, isHostElement);
    }
    else {
        parent.removeChild(child);
    }
}
/**
 * Returns a native parent of a given native node.
 */
export function nativeParentNode(renderer, node) {
    return (isProceduralRenderer(renderer) ? renderer.parentNode(node) : node.parentNode);
}
/**
 * Returns a native sibling of a given native node.
 */
export function nativeNextSibling(renderer, node) {
    return isProceduralRenderer(renderer) ? renderer.nextSibling(node) : node.nextSibling;
}
/**
 * Find a node in front of which `currentTNode` should be inserted.
 *
 * This method determines the `RNode` in front of which we should insert the `currentRNode`. This
 * takes `TNode.insertBeforeIndex` into account if i18n code has been invoked.
 *
 * @param parentTNode parent `TNode`
 * @param currentTNode current `TNode` (The node which we would like to insert into the DOM)
 * @param lView current `LView`
 */
function getInsertInFrontOfRNode(parentTNode, currentTNode, lView) {
    return _getInsertInFrontOfRNodeWithI18n(parentTNode, currentTNode, lView);
}
/**
 * Find a node in front of which `currentTNode` should be inserted. (Does not take i18n into
 * account)
 *
 * This method determines the `RNode` in front of which we should insert the `currentRNode`. This
 * does not take `TNode.insertBeforeIndex` into account.
 *
 * @param parentTNode parent `TNode`
 * @param currentTNode current `TNode` (The node which we would like to insert into the DOM)
 * @param lView current `LView`
 */
export function getInsertInFrontOfRNodeWithNoI18n(parentTNode, currentTNode, lView) {
    if (parentTNode.type & (8 /* ElementContainer */ | 32 /* Icu */)) {
        return getNativeByTNode(parentTNode, lView);
    }
    return null;
}
/**
 * Tree shakable boundary for `getInsertInFrontOfRNodeWithI18n` function.
 *
 * This function will only be set if i18n code runs.
 */
let _getInsertInFrontOfRNodeWithI18n = getInsertInFrontOfRNodeWithNoI18n;
/**
 * Tree shakable boundary for `processI18nInsertBefore` function.
 *
 * This function will only be set if i18n code runs.
 */
let _processI18nInsertBefore;
export function setI18nHandling(getInsertInFrontOfRNodeWithI18n, processI18nInsertBefore) {
    _getInsertInFrontOfRNodeWithI18n = getInsertInFrontOfRNodeWithI18n;
    _processI18nInsertBefore = processI18nInsertBefore;
}
/**
 * Appends the `child` native node (or a collection of nodes) to the `parent`.
 *
 * @param tView The `TView' to be appended
 * @param lView The current LView
 * @param childRNode The native child (or children) that should be appended
 * @param childTNode The TNode of the child element
 */
export function appendChild(tView, lView, childRNode, childTNode) {
    const parentRNode = getParentRElement(tView, childTNode, lView);
    const renderer = lView[RENDERER];
    const parentTNode = childTNode.parent || lView[T_HOST];
    const anchorNode = getInsertInFrontOfRNode(parentTNode, childTNode, lView);
    if (parentRNode != null) {
        if (Array.isArray(childRNode)) {
            for (let i = 0; i < childRNode.length; i++) {
                nativeAppendOrInsertBefore(renderer, parentRNode, childRNode[i], anchorNode, false);
            }
        }
        else {
            nativeAppendOrInsertBefore(renderer, parentRNode, childRNode, anchorNode, false);
        }
    }
    _processI18nInsertBefore !== undefined &&
        _processI18nInsertBefore(renderer, childTNode, lView, childRNode, parentRNode);
}
/**
 * Returns the first native node for a given LView, starting from the provided TNode.
 *
 * Native nodes are returned in the order in which those appear in the native tree (DOM).
 */
function getFirstNativeNode(lView, tNode) {
    if (tNode !== null) {
        ngDevMode &&
            assertTNodeType(tNode, 3 /* AnyRNode */ | 12 /* AnyContainer */ | 32 /* Icu */ | 16 /* Projection */);
        const tNodeType = tNode.type;
        if (tNodeType & 3 /* AnyRNode */) {
            return getNativeByTNode(tNode, lView);
        }
        else if (tNodeType & 4 /* Container */) {
            return getBeforeNodeForView(-1, lView[tNode.index]);
        }
        else if (tNodeType & 8 /* ElementContainer */) {
            const elIcuContainerChild = tNode.child;
            if (elIcuContainerChild !== null) {
                return getFirstNativeNode(lView, elIcuContainerChild);
            }
            else {
                const rNodeOrLContainer = lView[tNode.index];
                if (isLContainer(rNodeOrLContainer)) {
                    return getBeforeNodeForView(-1, rNodeOrLContainer);
                }
                else {
                    return unwrapRNode(rNodeOrLContainer);
                }
            }
        }
        else if (tNodeType & 32 /* Icu */) {
            let nextRNode = icuContainerIterate(tNode, lView);
            let rNode = nextRNode();
            // If the ICU container has no nodes, than we use the ICU anchor as the node.
            return rNode || unwrapRNode(lView[tNode.index]);
        }
        else {
            const projectionNodes = getProjectionNodes(lView, tNode);
            if (projectionNodes !== null) {
                if (Array.isArray(projectionNodes)) {
                    return projectionNodes[0];
                }
                const parentView = getLViewParent(lView[DECLARATION_COMPONENT_VIEW]);
                ngDevMode && assertParentView(parentView);
                return getFirstNativeNode(parentView, projectionNodes);
            }
            else {
                return getFirstNativeNode(lView, tNode.next);
            }
        }
    }
    return null;
}
export function getProjectionNodes(lView, tNode) {
    if (tNode !== null) {
        const componentView = lView[DECLARATION_COMPONENT_VIEW];
        const componentHost = componentView[T_HOST];
        const slotIdx = tNode.projection;
        ngDevMode && assertProjectionSlots(lView);
        return componentHost.projection[slotIdx];
    }
    return null;
}
export function getBeforeNodeForView(viewIndexInContainer, lContainer) {
    const nextViewIndex = CONTAINER_HEADER_OFFSET + viewIndexInContainer + 1;
    if (nextViewIndex < lContainer.length) {
        const lView = lContainer[nextViewIndex];
        const firstTNodeOfView = lView[TVIEW].firstChild;
        if (firstTNodeOfView !== null) {
            return getFirstNativeNode(lView, firstTNodeOfView);
        }
    }
    return lContainer[NATIVE];
}
/**
 * Removes a native node itself using a given renderer. To remove the node we are looking up its
 * parent from the native tree as not all platforms / browsers support the equivalent of
 * node.remove().
 *
 * @param renderer A renderer to be used
 * @param rNode The native node that should be removed
 * @param isHostElement A flag indicating if a node to be removed is a host of a component.
 */
export function nativeRemoveNode(renderer, rNode, isHostElement) {
    ngDevMode && ngDevMode.rendererRemoveNode++;
    const nativeParent = nativeParentNode(renderer, rNode);
    if (nativeParent) {
        nativeRemoveChild(renderer, nativeParent, rNode, isHostElement);
    }
}
/**
 * Performs the operation of `action` on the node. Typically this involves inserting or removing
 * nodes on the LView or projection boundary.
 */
function applyNodes(renderer, action, tNode, lView, parentRElement, beforeNode, isProjection) {
    while (tNode != null) {
        ngDevMode && assertTNodeForLView(tNode, lView);
        ngDevMode &&
            assertTNodeType(tNode, 3 /* AnyRNode */ | 12 /* AnyContainer */ | 16 /* Projection */ | 32 /* Icu */);
        const rawSlotValue = lView[tNode.index];
        const tNodeType = tNode.type;
        if (isProjection) {
            if (action === 0 /* Create */) {
                rawSlotValue && attachPatchData(unwrapRNode(rawSlotValue), lView);
                tNode.flags |= 4 /* isProjected */;
            }
        }
        if ((tNode.flags & 64 /* isDetached */) !== 64 /* isDetached */) {
            if (tNodeType & 8 /* ElementContainer */) {
                applyNodes(renderer, action, tNode.child, lView, parentRElement, beforeNode, false);
                applyToElementOrContainer(action, renderer, parentRElement, rawSlotValue, beforeNode);
            }
            else if (tNodeType & 32 /* Icu */) {
                const nextRNode = icuContainerIterate(tNode, lView);
                let rNode;
                while (rNode = nextRNode()) {
                    applyToElementOrContainer(action, renderer, parentRElement, rNode, beforeNode);
                }
                applyToElementOrContainer(action, renderer, parentRElement, rawSlotValue, beforeNode);
            }
            else if (tNodeType & 16 /* Projection */) {
                applyProjectionRecursive(renderer, action, lView, tNode, parentRElement, beforeNode);
            }
            else {
                ngDevMode && assertTNodeType(tNode, 3 /* AnyRNode */ | 4 /* Container */);
                applyToElementOrContainer(action, renderer, parentRElement, rawSlotValue, beforeNode);
            }
        }
        tNode = isProjection ? tNode.projectionNext : tNode.next;
    }
}
function applyView(tView, lView, renderer, action, parentRElement, beforeNode) {
    applyNodes(renderer, action, tView.firstChild, lView, parentRElement, beforeNode, false);
}
/**
 * `applyProjection` performs operation on the projection.
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param tView The `TView` of `LView` which needs to be inserted, detached, destroyed
 * @param lView The `LView` which needs to be inserted, detached, destroyed.
 * @param tProjectionNode node to project
 */
export function applyProjection(tView, lView, tProjectionNode) {
    const renderer = lView[RENDERER];
    const parentRNode = getParentRElement(tView, tProjectionNode, lView);
    const parentTNode = tProjectionNode.parent || lView[T_HOST];
    let beforeNode = getInsertInFrontOfRNode(parentTNode, tProjectionNode, lView);
    applyProjectionRecursive(renderer, 0 /* Create */, lView, tProjectionNode, parentRNode, beforeNode);
}
/**
 * `applyProjectionRecursive` performs operation on the projection specified by `action` (insert,
 * detach, destroy)
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param renderer Render to use
 * @param action action to perform (insert, detach, destroy)
 * @param lView The LView which needs to be inserted, detached, destroyed.
 * @param tProjectionNode node to project
 * @param parentRElement parent DOM element for insertion/removal.
 * @param beforeNode Before which node the insertions should happen.
 */
function applyProjectionRecursive(renderer, action, lView, tProjectionNode, parentRElement, beforeNode) {
    const componentLView = lView[DECLARATION_COMPONENT_VIEW];
    const componentNode = componentLView[T_HOST];
    ngDevMode &&
        assertEqual(typeof tProjectionNode.projection, 'number', 'expecting projection index');
    const nodeToProjectOrRNodes = componentNode.projection[tProjectionNode.projection];
    if (Array.isArray(nodeToProjectOrRNodes)) {
        // This should not exist, it is a bit of a hack. When we bootstrap a top level node and we
        // need to support passing projectable nodes, so we cheat and put them in the TNode
        // of the Host TView. (Yes we put instance info at the T Level). We can get away with it
        // because we know that that TView is not shared and therefore it will not be a problem.
        // This should be refactored and cleaned up.
        for (let i = 0; i < nodeToProjectOrRNodes.length; i++) {
            const rNode = nodeToProjectOrRNodes[i];
            applyToElementOrContainer(action, renderer, parentRElement, rNode, beforeNode);
        }
    }
    else {
        let nodeToProject = nodeToProjectOrRNodes;
        const projectedComponentLView = componentLView[PARENT];
        applyNodes(renderer, action, nodeToProject, projectedComponentLView, parentRElement, beforeNode, true);
    }
}
/**
 * `applyContainer` performs an operation on the container and its views as specified by
 * `action` (insert, detach, destroy)
 *
 * Inserting a Container is complicated by the fact that the container may have Views which
 * themselves have containers or projections.
 *
 * @param renderer Renderer to use
 * @param action action to perform (insert, detach, destroy)
 * @param lContainer The LContainer which needs to be inserted, detached, destroyed.
 * @param parentRElement parent DOM element for insertion/removal.
 * @param beforeNode Before which node the insertions should happen.
 */
function applyContainer(renderer, action, lContainer, parentRElement, beforeNode) {
    ngDevMode && assertLContainer(lContainer);
    const anchor = lContainer[NATIVE]; // LContainer has its own before node.
    const native = unwrapRNode(lContainer);
    // An LContainer can be created dynamically on any node by injecting ViewContainerRef.
    // Asking for a ViewContainerRef on an element will result in a creation of a separate anchor
    // node (comment in the DOM) that will be different from the LContainer's host node. In this
    // particular case we need to execute action on 2 nodes:
    // - container's host node (this is done in the executeActionOnElementOrContainer)
    // - container's host node (this is done here)
    if (anchor !== native) {
        // This is very strange to me (Misko). I would expect that the native is same as anchor. I
        // don't see a reason why they should be different, but they are.
        //
        // If they are we need to process the second anchor as well.
        applyToElementOrContainer(action, renderer, parentRElement, anchor, beforeNode);
    }
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        const lView = lContainer[i];
        applyView(lView[TVIEW], lView, renderer, action, parentRElement, anchor);
    }
}
/**
 * Writes class/style to element.
 *
 * @param renderer Renderer to use.
 * @param isClassBased `true` if it should be written to `class` (`false` to write to `style`)
 * @param rNode The Node to write to.
 * @param prop Property to write to. This would be the class/style name.
 * @param value Value to write. If `null`/`undefined`/`false` this is considered a remove (set/add
 *        otherwise).
 */
export function applyStyling(renderer, isClassBased, rNode, prop, value) {
    const isProcedural = isProceduralRenderer(renderer);
    if (isClassBased) {
        // We actually want JS true/false here because any truthy value should add the class
        if (!value) {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            if (isProcedural) {
                renderer.removeClass(rNode, prop);
            }
            else {
                rNode.classList.remove(prop);
            }
        }
        else {
            ngDevMode && ngDevMode.rendererAddClass++;
            if (isProcedural) {
                renderer.addClass(rNode, prop);
            }
            else {
                ngDevMode && assertDefined(rNode.classList, 'HTMLElement expected');
                rNode.classList.add(prop);
            }
        }
    }
    else {
        let flags = prop.indexOf('-') === -1 ? undefined : RendererStyleFlags2.DashCase;
        if (value == null /** || value === undefined */) {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            if (isProcedural) {
                renderer.removeStyle(rNode, prop, flags);
            }
            else {
                rNode.style.removeProperty(prop);
            }
        }
        else {
            // A value is important if it ends with `!important`. The style
            // parser strips any semicolons at the end of the value.
            const isImportant = typeof value === 'string' ? value.endsWith('!important') : false;
            if (isImportant) {
                // !important has to be stripped from the value for it to be valid.
                value = value.slice(0, -10);
                flags |= RendererStyleFlags2.Important;
            }
            ngDevMode && ngDevMode.rendererSetStyle++;
            if (isProcedural) {
                renderer.setStyle(rNode, prop, value, flags);
            }
            else {
                ngDevMode && assertDefined(rNode.style, 'HTMLElement expected');
                rNode.style.setProperty(prop, value, isImportant ? 'important' : '');
            }
        }
    }
}
/**
 * Write `cssText` to `RElement`.
 *
 * This function does direct write without any reconciliation. Used for writing initial values, so
 * that static styling values do not pull in the style parser.
 *
 * @param renderer Renderer to use
 * @param element The element which needs to be updated.
 * @param newValue The new class list to write.
 */
export function writeDirectStyle(renderer, element, newValue) {
    ngDevMode && assertString(newValue, '\'newValue\' should be a string');
    if (isProceduralRenderer(renderer)) {
        renderer.setAttribute(element, 'style', newValue);
    }
    else {
        element.style.cssText = newValue;
    }
    ngDevMode && ngDevMode.rendererSetStyle++;
}
/**
 * Write `className` to `RElement`.
 *
 * This function does direct write without any reconciliation. Used for writing initial values, so
 * that static styling values do not pull in the style parser.
 *
 * @param renderer Renderer to use
 * @param element The element which needs to be updated.
 * @param newValue The new class list to write.
 */
export function writeDirectClass(renderer, element, newValue) {
    ngDevMode && assertString(newValue, '\'newValue\' should be a string');
    if (isProceduralRenderer(renderer)) {
        if (newValue === '') {
            // There are tests in `google3` which expect `element.getAttribute('class')` to be `null`.
            renderer.removeAttribute(element, 'class');
        }
        else {
            renderer.setAttribute(element, 'class', newValue);
        }
    }
    else {
        element.className = newValue;
    }
    ngDevMode && ngDevMode.rendererSetClassName++;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRW5ELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxVQUFVLEVBQUUsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNySCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDN0QsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFbEssT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzVELE9BQU8sRUFBaUYsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0osT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8s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QUUsUUFBZ0I7SUFDdkYsU0FBUyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztJQUN2RSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNuRDtTQUFNO1FBQ0osT0FBdUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztLQUNuRDtJQUNELFNBQVMsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUM1QyxDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFFBQW1CLEVBQUUsT0FBaUIsRUFBRSxRQUFnQjtJQUN2RixTQUFTLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO0lBQ3ZFLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsSUFBSSxRQUFRLEtBQUssRUFBRSxFQUFFO1lBQ25CLDBGQUEwRjtZQUMxRixRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1QzthQUFNO1lBQ0wsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ25EO0tBQ0Y7U0FBTTtRQUNMLE9BQU8sQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0tBQzlCO0lBQ0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ2hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1JlbmRlcmVyU3R5bGVGbGFnczJ9IGZyb20gJy4uL3JlbmRlci9hcGlfZmxhZ3MnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRFcXVhbCwgYXNzZXJ0RnVuY3Rpb24sIGFzc2VydFN0cmluZ30gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtlc2NhcGVDb21tZW50VGV4dH0gZnJvbSAnLi4vdXRpbC9kb20nO1xuXG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRQYXJlbnRWaWV3LCBhc3NlcnRQcm9qZWN0aW9uU2xvdHMsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7aWN1Q29udGFpbmVySXRlcmF0ZX0gZnJvbSAnLi9pMThuL2kxOG5fdHJlZV9zaGFraW5nJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIEhBU19UUkFOU1BMQU5URURfVklFV1MsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7dW5yZWdpc3RlckxWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvbHZpZXdfdHJhY2tpbmcnO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtpc1Byb2NlZHVyYWxSZW5kZXJlciwgUHJvY2VkdXJhbFJlbmRlcmVyMywgUmVuZGVyZXIzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0xFQU5VUCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX0xDT05UQUlORVIsIERlc3Ryb3lIb29rRGF0YSwgRkxBR1MsIEhvb2tEYXRhLCBIb29rRm4sIEhPU1QsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBUX0hPU1QsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldExWaWV3UGFyZW50fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZSwgdXBkYXRlVHJhbnNwbGFudGVkVmlld0NvdW50fSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBjcmVhdGUgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudC4gUnVuIG9uIGluaXRpYWwgY3JlYXRpb24uICovXG4gIENyZWF0ZSA9IDAsXG5cbiAgLyoqXG4gICAqIG5vZGUgaW5zZXJ0IGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQuXG4gICAqIFJ1biB3aGVuIGV4aXN0aW5nIG5vZGUgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5lZWRzIHRvIGJlIHJlLWF0dGFjaGVkLlxuICAgKi9cbiAgSW5zZXJ0ID0gMSxcblxuICAvKiogbm9kZSBkZXRhY2ggZnJvbSB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIERldGFjaCA9IDIsXG5cbiAgLyoqIG5vZGUgZGVzdHJ1Y3Rpb24gdXNpbmcgdGhlIHJlbmRlcmVyJ3MgQVBJICovXG4gIERlc3Ryb3kgPSAzLFxufVxuXG5cblxuLyoqXG4gKiBOT1RFOiBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIHBvc3NpYmxlIGFjdGlvbnMgYXJlIGlubGluZWQgd2l0aGluIHRoZSBmdW5jdGlvbiBpbnN0ZWFkIG9mXG4gKiBiZWluZyBwYXNzZWQgYXMgYW4gYXJndW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50fG51bGwsXG4gICAgbE5vZGVUb0hhbmRsZTogUk5vZGV8TENvbnRhaW5lcnxMVmlldywgYmVmb3JlTm9kZT86IFJOb2RlfG51bGwpIHtcbiAgLy8gSWYgdGhpcyBzbG90IHdhcyBhbGxvY2F0ZWQgZm9yIGEgdGV4dCBub2RlIGR5bmFtaWNhbGx5IGNyZWF0ZWQgYnkgaTE4biwgdGhlIHRleHQgbm9kZSBpdHNlbGZcbiAgLy8gd29uJ3QgYmUgY3JlYXRlZCB1bnRpbCBpMThuQXBwbHkoKSBpbiB0aGUgdXBkYXRlIGJsb2NrLCBzbyB0aGlzIG5vZGUgc2hvdWxkIGJlIHNraXBwZWQuXG4gIC8vIEZvciBtb3JlIGluZm8sIHNlZSBcIklDVSBleHByZXNzaW9ucyBzaG91bGQgd29yayBpbnNpZGUgYW4gbmdUZW1wbGF0ZU91dGxldCBpbnNpZGUgYW4gbmdGb3JcIlxuICAvLyBpbiBgaTE4bl9zcGVjLnRzYC5cbiAgaWYgKGxOb2RlVG9IYW5kbGUgIT0gbnVsbCkge1xuICAgIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyfHVuZGVmaW5lZDtcbiAgICBsZXQgaXNDb21wb25lbnQgPSBmYWxzZTtcbiAgICAvLyBXZSBhcmUgZXhwZWN0aW5nIGFuIFJOb2RlLCBidXQgaW4gdGhlIGNhc2Ugb2YgYSBjb21wb25lbnQgb3IgTENvbnRhaW5lciB0aGUgYFJOb2RlYCBpc1xuICAgIC8vIHdyYXBwZWQgaW4gYW4gYXJyYXkgd2hpY2ggbmVlZHMgdG8gYmUgdW53cmFwcGVkLiBXZSBuZWVkIHRvIGtub3cgaWYgaXQgaXMgYSBjb21wb25lbnQgYW5kIGlmXG4gICAgLy8gaXQgaGFzIExDb250YWluZXIgc28gdGhhdCB3ZSBjYW4gcHJvY2VzcyBhbGwgb2YgdGhvc2UgY2FzZXMgYXBwcm9wcmlhdGVseS5cbiAgICBpZiAoaXNMQ29udGFpbmVyKGxOb2RlVG9IYW5kbGUpKSB7XG4gICAgICBsQ29udGFpbmVyID0gbE5vZGVUb0hhbmRsZTtcbiAgICB9IGVsc2UgaWYgKGlzTFZpZXcobE5vZGVUb0hhbmRsZSkpIHtcbiAgICAgIGlzQ29tcG9uZW50ID0gdHJ1ZTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxOb2RlVG9IYW5kbGVbSE9TVF0sICdIT1NUIG11c3QgYmUgZGVmaW5lZCBmb3IgYSBjb21wb25lbnQgTFZpZXcnKTtcbiAgICAgIGxOb2RlVG9IYW5kbGUgPSBsTm9kZVRvSGFuZGxlW0hPU1RdITtcbiAgICB9XG4gICAgY29uc3Qgck5vZGU6IFJOb2RlID0gdW53cmFwUk5vZGUobE5vZGVUb0hhbmRsZSk7XG4gICAgbmdEZXZNb2RlICYmICFpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgYXNzZXJ0RG9tTm9kZShyTm9kZSk7XG5cbiAgICBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkNyZWF0ZSAmJiBwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgIGlmIChiZWZvcmVOb2RlID09IG51bGwpIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXIsIHBhcmVudCwgck5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlLCBiZWZvcmVOb2RlIHx8IG51bGwsIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCAmJiBwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXIsIHJOb2RlLCBpc0NvbXBvbmVudCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUhKHJOb2RlKTtcbiAgICB9XG4gICAgaWYgKGxDb250YWluZXIgIT0gbnVsbCkge1xuICAgICAgYXBwbHlDb250YWluZXIocmVuZGVyZXIsIGFjdGlvbiwgbENvbnRhaW5lciwgcGFyZW50LCBiZWZvcmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHJlbmRlcmVyOiBSZW5kZXJlcjMsIHZhbHVlOiBzdHJpbmcpOiBSVGV4dCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuY3JlYXRlVGV4dCh2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVGV4dE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgck5vZGU6IFJUZXh0LCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKHJOb2RlLCB2YWx1ZSkgOiByTm9kZS50ZXh0Q29udGVudCA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tbWVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgdmFsdWU6IHN0cmluZyk6IFJDb21tZW50IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgLy8gaXNQcm9jZWR1cmFsUmVuZGVyZXIgY2hlY2sgaXMgbm90IG5lZWRlZCBiZWNhdXNlIGJvdGggYFJlbmRlcmVyMmAgYW5kIGBSZW5kZXJlcjNgIGhhdmUgdGhlIHNhbWVcbiAgLy8gbWV0aG9kIG5hbWUuXG4gIHJldHVybiByZW5kZXJlci5jcmVhdGVDb21tZW50KGVzY2FwZUNvbW1lbnRUZXh0KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gbmFtZXNwYWNlIE9wdGlvbmFsIG5hbWVzcGFjZSBmb3IgZWxlbWVudC5cbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROb2RlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5hbWU6IHN0cmluZywgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbCk6IFJFbGVtZW50IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZSA9PT0gbnVsbCA/IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgfVxufVxuXG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlld0Zyb21Db250YWluZXIodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbnVsbCwgbnVsbCk7XG4gIGxWaWV3W0hPU1RdID0gbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IG51bGw7XG59XG5cbi8qKlxuICogQWRkcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIGFkZCBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gcGFyZW50VE5vZGUgVGhlIGBUTm9kZWAgd2hlcmUgdGhlIGBMVmlld2Agc2hvdWxkIGJlIGF0dGFjaGVkIHRvLlxuICogQHBhcmFtIHJlbmRlcmVyIEN1cnJlbnQgcmVuZGVyZXIgdG8gdXNlIGZvciBET00gbWFuaXB1bGF0aW9ucy5cbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gcGFyZW50TmF0aXZlTm9kZSBUaGUgcGFyZW50IGBSRWxlbWVudGAgd2hlcmUgaXQgc2hvdWxkIGJlIGluc2VydGVkIGludG8uXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVmlld1RvQ29udGFpbmVyKFxuICAgIHRWaWV3OiBUVmlldywgcGFyZW50VE5vZGU6IFROb2RlLCByZW5kZXJlcjogUmVuZGVyZXIzLCBsVmlldzogTFZpZXcsIHBhcmVudE5hdGl2ZU5vZGU6IFJFbGVtZW50LFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgbFZpZXdbSE9TVF0gPSBwYXJlbnROYXRpdmVOb2RlO1xuICBsVmlld1tUX0hPU1RdID0gcGFyZW50VE5vZGU7XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCwgcGFyZW50TmF0aXZlTm9kZSwgYmVmb3JlTm9kZSk7XG59XG5cblxuLyoqXG4gKiBEZXRhY2ggYSBgTFZpZXdgIGZyb20gdGhlIERPTSBieSBkZXRhY2hpbmcgaXRzIG5vZGVzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCB0byBiZSBkZXRhY2hlZFxuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHRvIGJlIGRldGFjaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGV0YWNoVmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBhcHBseVZpZXcodFZpZXcsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoLCBudWxsLCBudWxsKTtcbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgbGV0IGxWaWV3T3JMQ29udGFpbmVyID0gcm9vdFZpZXdbQ0hJTERfSEVBRF07XG4gIGlmICghbFZpZXdPckxDb250YWluZXIpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXdbVFZJRVddLCByb290Vmlldyk7XG4gIH1cblxuICB3aGlsZSAobFZpZXdPckxDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSkge1xuICAgICAgLy8gSWYgTFZpZXcsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXJbQ0hJTERfSEVBRF07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgIC8vIElmIGNvbnRhaW5lciwgdHJhdmVyc2UgZG93biB0byBpdHMgZmlyc3QgTFZpZXcuXG4gICAgICBjb25zdCBmaXJzdFZpZXc6IExWaWV3fHVuZGVmaW5lZCA9IGxWaWV3T3JMQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXTtcbiAgICAgIGlmIChmaXJzdFZpZXcpIG5leHQgPSBmaXJzdFZpZXc7XG4gICAgfVxuXG4gICAgaWYgKCFuZXh0KSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKGxWaWV3T3JMQ29udGFpbmVyICYmICFsVmlld09yTENvbnRhaW5lciFbTkVYVF0gJiYgbFZpZXdPckxDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSkge1xuICAgICAgICAgIGNsZWFuVXBWaWV3KGxWaWV3T3JMQ29udGFpbmVyW1RWSUVXXSwgbFZpZXdPckxDb250YWluZXIpO1xuICAgICAgICB9XG4gICAgICAgIGxWaWV3T3JMQ29udGFpbmVyID0gbFZpZXdPckxDb250YWluZXJbUEFSRU5UXTtcbiAgICAgIH1cbiAgICAgIGlmIChsVmlld09yTENvbnRhaW5lciA9PT0gbnVsbCkgbFZpZXdPckxDb250YWluZXIgPSByb290VmlldztcbiAgICAgIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSkge1xuICAgICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lcltUVklFV10sIGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgIH1cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lciAmJiBsVmlld09yTENvbnRhaW5lciFbTkVYVF07XG4gICAgfVxuICAgIGxWaWV3T3JMQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgb2YgdGhlIGBMVmlld2AgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gaW5kZXggV2hpY2ggaW5kZXggaW4gdGhlIGNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGNoaWxkIHZpZXcgaW50b1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0Vmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3QgaW5kZXhJbkNvbnRhaW5lciA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgaW5kZXg7XG4gIGNvbnN0IGNvbnRhaW5lckxlbmd0aCA9IGxDb250YWluZXIubGVuZ3RoO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IGxWaWV3O1xuICB9XG4gIGlmIChpbmRleCA8IGNvbnRhaW5lckxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKSB7XG4gICAgbFZpZXdbTkVYVF0gPSBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXJdO1xuICAgIGFkZFRvQXJyYXkobENvbnRhaW5lciwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyBpbmRleCwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIGxDb250YWluZXIucHVzaChsVmlldyk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgbFZpZXdbUEFSRU5UXSA9IGxDb250YWluZXI7XG5cbiAgLy8gdHJhY2sgdmlld3Mgd2hlcmUgZGVjbGFyYXRpb24gYW5kIGluc2VydGlvbiBwb2ludHMgYXJlIGRpZmZlcmVudFxuICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbnVsbCAmJiBsQ29udGFpbmVyICE9PSBkZWNsYXJhdGlvbkxDb250YWluZXIpIHtcbiAgICB0cmFja01vdmVkVmlldyhkZWNsYXJhdGlvbkxDb250YWluZXIsIGxWaWV3KTtcbiAgfVxuXG4gIC8vIG5vdGlmeSBxdWVyeSB0aGF0IGEgbmV3IHZpZXcgaGFzIGJlZW4gYWRkZWRcbiAgY29uc3QgbFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgbFF1ZXJpZXMuaW5zZXJ0Vmlldyh0Vmlldyk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIFRyYWNrIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGUgZGVjbGFyYXRpb24gY29udGFpbmVyIChUZW1wbGF0ZVJlZikgYW5kIGluc2VydGVkIGludG8gYVxuICogZGlmZmVyZW50IExDb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyOiBMQ29udGFpbmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXcsICdMVmlldyByZXF1aXJlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIGNvbnN0IG1vdmVkVmlld3MgPSBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU107XG4gIGNvbnN0IGluc2VydGVkTENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0ZWRMQ29udGFpbmVyKTtcbiAgY29uc3QgaW5zZXJ0ZWRDb21wb25lbnRMVmlldyA9IGluc2VydGVkTENvbnRhaW5lcltQQVJFTlRdIVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGluc2VydGVkQ29tcG9uZW50TFZpZXcsICdNaXNzaW5nIGluc2VydGVkQ29tcG9uZW50TFZpZXcnKTtcbiAgY29uc3QgZGVjbGFyZWRDb21wb25lbnRMVmlldyA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGVjbGFyZWRDb21wb25lbnRMVmlldywgJ01pc3NpbmcgZGVjbGFyZWRDb21wb25lbnRMVmlldycpO1xuICBpZiAoZGVjbGFyZWRDb21wb25lbnRMVmlldyAhPT0gaW5zZXJ0ZWRDb21wb25lbnRMVmlldykge1xuICAgIC8vIEF0IHRoaXMgcG9pbnQgdGhlIGRlY2xhcmF0aW9uLWNvbXBvbmVudCBpcyBub3Qgc2FtZSBhcyBpbnNlcnRpb24tY29tcG9uZW50OyB0aGlzIG1lYW5zIHRoYXRcbiAgICAvLyB0aGlzIGlzIGEgdHJhbnNwbGFudGVkIHZpZXcuIE1hcmsgdGhlIGRlY2xhcmVkIGxWaWV3IGFzIGhhdmluZyB0cmFuc3BsYW50ZWQgdmlld3Mgc28gdGhhdFxuICAgIC8vIHRob3NlIHZpZXdzIGNhbiBwYXJ0aWNpcGF0ZSBpbiBDRC5cbiAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTXSA9IHRydWU7XG4gIH1cbiAgaWYgKG1vdmVkVmlld3MgPT09IG51bGwpIHtcbiAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10gPSBbbFZpZXddO1xuICB9IGVsc2Uge1xuICAgIG1vdmVkVmlld3MucHVzaChsVmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyOiBMQ29udGFpbmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdLFxuICAgICAgICAgICdBIHByb2plY3RlZCB2aWV3IHNob3VsZCBiZWxvbmcgdG8gYSBub24tZW1wdHkgcHJvamVjdGVkIHZpZXdzIGNvbGxlY3Rpb24nKTtcbiAgY29uc3QgbW92ZWRWaWV3cyA9IGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gIGNvbnN0IGRlY2xhcmF0aW9uVmlld0luZGV4ID0gbW92ZWRWaWV3cy5pbmRleE9mKGxWaWV3KTtcbiAgY29uc3QgaW5zZXJ0aW9uTENvbnRhaW5lciA9IGxWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG5cbiAgLy8gSWYgdGhlIHZpZXcgd2FzIG1hcmtlZCBmb3IgcmVmcmVzaCBidXQgdGhlbiBkZXRhY2hlZCBiZWZvcmUgaXQgd2FzIGNoZWNrZWQgKHdoZXJlIHRoZSBmbGFnXG4gIC8vIHdvdWxkIGJlIGNsZWFyZWQgYW5kIHRoZSBjb3VudGVyIGRlY3JlbWVudGVkKSwgd2UgbmVlZCB0byBkZWNyZW1lbnQgdGhlIHZpZXcgY291bnRlciBoZXJlXG4gIC8vIGluc3RlYWQuXG4gIGlmIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3O1xuICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChpbnNlcnRpb25MQ29udGFpbmVyLCAtMSk7XG4gIH1cblxuICBtb3ZlZFZpZXdzLnNwbGljZShkZWNsYXJhdGlvblZpZXdJbmRleCwgMSk7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2QgcmVtb3ZlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBEZXRhY2hlZCBMVmlldyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3fHVuZGVmaW5lZCB7XG4gIGlmIChsQ29udGFpbmVyLmxlbmd0aCA8PSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkgcmV0dXJuO1xuXG4gIGNvbnN0IGluZGV4SW5Db250YWluZXIgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHJlbW92ZUluZGV4O1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXJdO1xuXG4gIGlmICh2aWV3VG9EZXRhY2gpIHtcbiAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSB2aWV3VG9EZXRhY2hbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbnVsbCAmJiBkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IGxDb250YWluZXIpIHtcbiAgICAgIGRldGFjaE1vdmVkVmlldyhkZWNsYXJhdGlvbkxDb250YWluZXIsIHZpZXdUb0RldGFjaCk7XG4gICAgfVxuXG5cbiAgICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlldztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlZExWaWV3ID0gcmVtb3ZlRnJvbUFycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXgpO1xuICAgIHJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaFtUVklFV10sIHZpZXdUb0RldGFjaCk7XG5cbiAgICAvLyBub3RpZnkgcXVlcnkgdGhhdCBhIHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICAgIGNvbnN0IGxRdWVyaWVzID0gcmVtb3ZlZExWaWV3W1FVRVJJRVNdO1xuICAgIGlmIChsUXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgbFF1ZXJpZXMuZGV0YWNoVmlldyhyZW1vdmVkTFZpZXdbVFZJRVddKTtcbiAgICB9XG5cbiAgICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gICAgdmlld1RvRGV0YWNoW05FWFRdID0gbnVsbDtcbiAgICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICB9XG4gIHJldHVybiB2aWV3VG9EZXRhY2g7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbiB1cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGJlIGRlc3Ryb3llZFxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBpZiAoIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgICBhcHBseVZpZXcodFZpZXcsIGxWaWV3LCByZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICBkZXN0cm95Vmlld1RyZWUobFZpZXcpO1xuICAgIHVucmVnaXN0ZXJMVmlldyhsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkRlc3Ryb3lzIGhvb2tzIGZvciBhbGwgZGlyZWN0aXZlcyBhbmQgcGlwZXMgaW4gYSBnaXZlbiB2aWV3IGFuZCB0aGVuIHJlbW92ZXMgYWxsXG4gKiBsaXN0ZW5lcnMuIExpc3RlbmVycyBhcmUgcmVtb3ZlZCBhcyB0aGUgbGFzdCBzdGVwIHNvIGV2ZW50cyBkZWxpdmVyZWQgaW4gdGhlIG9uRGVzdHJveXMgaG9va3NcbiAqIGNhbiBiZSBwcm9wYWdhdGVkIHRvIEBPdXRwdXQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIGZvciB0aGUgYExWaWV3YCB0byBjbGVhbiB1cC5cbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKCEobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpKSB7XG4gICAgLy8gVXN1YWxseSB0aGUgQXR0YWNoZWQgZmxhZyBpcyByZW1vdmVkIHdoZW4gdGhlIHZpZXcgaXMgZGV0YWNoZWQgZnJvbSBpdHMgcGFyZW50LCBob3dldmVyXG4gICAgLy8gaWYgaXQncyBhIHJvb3QgdmlldywgdGhlIGZsYWcgd29uJ3QgYmUgdW5zZXQgaGVuY2Ugd2h5IHdlJ3JlIGFsc28gcmVtb3Zpbmcgb24gZGVzdHJveS5cbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgICAvLyBNYXJrIHRoZSBMVmlldyBhcyBkZXN0cm95ZWQgKmJlZm9yZSogZXhlY3V0aW5nIHRoZSBvbkRlc3Ryb3kgaG9va3MuIEFuIG9uRGVzdHJveSBob29rXG4gICAgLy8gcnVucyBhcmJpdHJhcnkgdXNlciBjb2RlLCB3aGljaCBjb3VsZCBpbmNsdWRlIGl0cyBvd24gYHZpZXdSZWYuZGVzdHJveSgpYCAob3Igc2ltaWxhcikuIElmXG4gICAgLy8gV2UgZG9uJ3QgZmxhZyB0aGUgdmlldyBhcyBkZXN0cm95ZWQgYmVmb3JlIHRoZSBob29rcywgdGhpcyBjb3VsZCBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgLy8gVGhpcyBhbHNvIGFsaWducyB3aXRoIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yLiBJdCBhbHNvIG1lYW5zIHRoYXQgdGhlIG9uRGVzdHJveSBob29rIGlzXG4gICAgLy8gcmVhbGx5IG1vcmUgb2YgYW4gXCJhZnRlckRlc3Ryb3lcIiBob29rIGlmIHlvdSB0aGluayBhYm91dCBpdC5cbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG5cbiAgICBleGVjdXRlT25EZXN0cm95cyh0VmlldywgbFZpZXcpO1xuICAgIHByb2Nlc3NDbGVhbnVwcyh0VmlldywgbFZpZXcpO1xuICAgIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhdCBjbGVhbiB1cCB0aW1lLlxuICAgIGlmIChsVmlld1tUVklFV10udHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihsVmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKGxWaWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGVjbGFyYXRpb25Db250YWluZXIgPSBsVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIGFuIGVtYmVkZGVkIHZpZXcgdGhhdCBpcyBzdGlsbCBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyXG4gICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSBudWxsICYmIGlzTENvbnRhaW5lcihsVmlld1tQQVJFTlRdKSkge1xuICAgICAgLy8gYW5kIHRoaXMgaXMgYSBwcm9qZWN0ZWQgdmlld1xuICAgICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSBsVmlld1tQQVJFTlRdKSB7XG4gICAgICAgIGRldGFjaE1vdmVkVmlldyhkZWNsYXJhdGlvbkNvbnRhaW5lciwgbFZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZW1iZWRkZWQgdmlld3Mgc3RpbGwgYXR0YWNoZWQgdG8gYSBjb250YWluZXI6IHJlbW92ZSBxdWVyeSByZXN1bHQgZnJvbSB0aGlzIHZpZXcuXG4gICAgICBjb25zdCBsUXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICAgICAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcodFZpZXcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiBwcm9jZXNzQ2xlYW51cHModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdITtcbiAgLy8gYExDbGVhbnVwYCBjb250YWlucyBib3RoIHNoYXJlIGluZm9ybWF0aW9uIHdpdGggYFRDbGVhbnVwYCBhcyB3ZWxsIGFzIGluc3RhbmNlIHNwZWNpZmljXG4gIC8vIGluZm9ybWF0aW9uIGFwcGVuZGVkIGF0IHRoZSBlbmQuIFdlIG5lZWQgdG8ga25vdyB3aGVyZSB0aGUgZW5kIG9mIHRoZSBgVENsZWFudXBgIGluZm9ybWF0aW9uXG4gIC8vIGlzLCBhbmQgd2UgdHJhY2sgdGhpcyB3aXRoIGBsYXN0TENsZWFudXBJbmRleGAuXG4gIGxldCBsYXN0TENsZWFudXBJbmRleCA9IC0xO1xuICBpZiAodENsZWFudXAgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiB0Q2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIG5hdGl2ZSBET00gbGlzdGVuZXJcbiAgICAgICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSB0Q2xlYW51cFtpICsgMV07XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICBpZHhPclRhcmdldEdldHRlcihsVmlldykgOlxuICAgICAgICAgICAgdW53cmFwUk5vZGUobFZpZXdbaWR4T3JUYXJnZXRHZXR0ZXJdKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBsQ2xlYW51cFtsYXN0TENsZWFudXBJbmRleCA9IHRDbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIGNvbnN0IHVzZUNhcHR1cmVPclN1YklkeCA9IHRDbGVhbnVwW2kgKyAzXTtcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VDYXB0dXJlT3JTdWJJZHggPT09ICdib29sZWFuJykge1xuICAgICAgICAgIC8vIG5hdGl2ZSBET00gbGlzdGVuZXIgcmVnaXN0ZXJlZCB3aXRoIFJlbmRlcmVyM1xuICAgICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHRDbGVhbnVwW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZU9yU3ViSWR4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodXNlQ2FwdHVyZU9yU3ViSWR4ID49IDApIHtcbiAgICAgICAgICAgIC8vIHVucmVnaXN0ZXJcbiAgICAgICAgICAgIGxDbGVhbnVwW2xhc3RMQ2xlYW51cEluZGV4ID0gdXNlQ2FwdHVyZU9yU3ViSWR4XSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdWJzY3JpcHRpb25cbiAgICAgICAgICAgIGxDbGVhbnVwW2xhc3RMQ2xlYW51cEluZGV4ID0gLXVzZUNhcHR1cmVPclN1YklkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFtsYXN0TENsZWFudXBJbmRleCA9IHRDbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIHRDbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChsQ2xlYW51cCAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSBsYXN0TENsZWFudXBJbmRleCArIDE7IGkgPCBsQ2xlYW51cC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5zdGFuY2VDbGVhbnVwRm4gPSBsQ2xlYW51cFtpXTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGdW5jdGlvbihpbnN0YW5jZUNsZWFudXBGbiwgJ0V4cGVjdGluZyBpbnN0YW5jZSBjbGVhbnVwIGZ1bmN0aW9uLicpO1xuICAgICAgaW5zdGFuY2VDbGVhbnVwRm4oKTtcbiAgICB9XG4gICAgbFZpZXdbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgbGV0IGRlc3Ryb3lIb29rczogRGVzdHJveUhvb2tEYXRhfG51bGw7XG5cbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzdHJveUhvb2tzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdbZGVzdHJveUhvb2tzW2ldIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgZGVzdHJveSBob29rIGlmIHRoZSBjb250ZXh0IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3JGYWN0b3J5KSkge1xuICAgICAgICBjb25zdCB0b0NhbGwgPSBkZXN0cm95SG9va3NbaSArIDFdIGFzIEhvb2tGbiB8IEhvb2tEYXRhO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRvQ2FsbCkpIHtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvQ2FsbC5sZW5ndGg7IGogKz0gMikge1xuICAgICAgICAgICAgKHRvQ2FsbFtqICsgMV0gYXMgSG9va0ZuKS5jYWxsKGNvbnRleHRbdG9DYWxsW2pdIGFzIG51bWJlcl0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0b0NhbGwuY2FsbChjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgZWxlbWVudCBpZiBhIG5vZGUgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYWRlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG4gKiBAcGFyYW0gdFZpZXc6IEN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0Tm9kZTogYFROb2RlYCBmb3Igd2hpY2ggd2Ugd2lzaCB0byByZXRyaWV2ZSByZW5kZXIgcGFyZW50LlxuICogQHBhcmFtIGxWaWV3OiBDdXJyZW50IGBMVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRSRWxlbWVudCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIHJldHVybiBnZXRDbG9zZXN0UkVsZW1lbnQodFZpZXcsIHROb2RlLnBhcmVudCwgbFZpZXcpO1xufVxuXG4vKipcbiAqIEdldCBjbG9zZXN0IGBSRWxlbWVudGAgb3IgYG51bGxgIGlmIGl0IGNhbid0IGJlIGZvdW5kLlxuICpcbiAqIElmIGBUTm9kZWAgaXMgYFROb2RlVHlwZS5FbGVtZW50YCA9PiByZXR1cm4gYFJFbGVtZW50YCBhdCBgTFZpZXdbdE5vZGUuaW5kZXhdYCBsb2NhdGlvbi5cbiAqIElmIGBUTm9kZWAgaXMgYFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyfEljdUNvbnRhaW5gID0+IHJldHVybiB0aGUgcGFyZW50IChyZWN1cnNpdmVseSkuXG4gKiBJZiBgVE5vZGVgIGlzIGBudWxsYCB0aGVuIHJldHVybiBob3N0IGBSRWxlbWVudGA6XG4gKiAgIC0gcmV0dXJuIGBudWxsYCBpZiBwcm9qZWN0aW9uXG4gKiAgIC0gcmV0dXJuIGBudWxsYCBpZiBwYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZCAod2UgaGF2ZSBubyBwYXJlbnQuKVxuICpcbiAqIEBwYXJhbSB0VmlldzogQ3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIHROb2RlOiBgVE5vZGVgIGZvciB3aGljaCB3ZSB3aXNoIHRvIHJldHJpZXZlIGBSRWxlbWVudGAgKG9yIGBudWxsYCBpZiBob3N0IGVsZW1lbnQgaXNcbiAqICAgICBuZWVkZWQpLlxuICogQHBhcmFtIGxWaWV3OiBDdXJyZW50IGBMVmlld2AuXG4gKiBAcmV0dXJucyBgbnVsbGAgaWYgdGhlIGBSRWxlbWVudGAgY2FuJ3QgYmUgZGV0ZXJtaW5lZCBhdCB0aGlzIHRpbWUgKG5vIHBhcmVudCAvIHByb2plY3Rpb24pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDbG9zZXN0UkVsZW1lbnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIGxldCBwYXJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IHROb2RlO1xuICAvLyBTa2lwIG92ZXIgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnMgYXMgdGhvc2UgYXJlIHJlcHJlc2VudGVkIGJ5IGEgY29tbWVudCBub2RlIGFuZFxuICAvLyBjYW4ndCBiZSB1c2VkIGFzIGEgcmVuZGVyIHBhcmVudC5cbiAgd2hpbGUgKHBhcmVudFROb2RlICE9PSBudWxsICYmXG4gICAgICAgICAocGFyZW50VE5vZGUudHlwZSAmIChUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8IFROb2RlVHlwZS5JY3UpKSkge1xuICAgIHROb2RlID0gcGFyZW50VE5vZGU7XG4gICAgcGFyZW50VE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIH1cblxuICAvLyBJZiB0aGUgcGFyZW50IHROb2RlIGlzIG51bGwsIHRoZW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3Mgdmlld3M6IGVpdGhlciBpbnRvIGFuIGVtYmVkZGVkIHZpZXdcbiAgLy8gb3IgYSBjb21wb25lbnQgdmlldy5cbiAgaWYgKHBhcmVudFROb2RlID09PSBudWxsKSB7XG4gICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmRcbiAgICAvLyBpdCBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICAgIHJldHVybiBsVmlld1tIT1NUXTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHBhcmVudFROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBpZiAocGFyZW50VE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgICAgIGNvbnN0IGVuY2Fwc3VsYXRpb24gPVxuICAgICAgICAgICh0Vmlldy5kYXRhW3BhcmVudFROb2RlLmRpcmVjdGl2ZVN0YXJ0XSBhcyBDb21wb25lbnREZWY8dW5rbm93bj4pLmVuY2Fwc3VsYXRpb247XG4gICAgICAvLyBXZSd2ZSBnb3QgYSBwYXJlbnQgd2hpY2ggaXMgYW4gZWxlbWVudCBpbiB0aGUgY3VycmVudCB2aWV3LiBXZSBqdXN0IG5lZWQgdG8gdmVyaWZ5IGlmIHRoZVxuICAgICAgLy8gcGFyZW50IGVsZW1lbnQgaXMgbm90IGEgY29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAgICAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhlbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi4gTm90ZSB0aGF0IHdlIGNhbid0XG4gICAgICAvLyBtYWtlIHRoaXMgYXNzdW1wdGlvbiB3aGVuIHVzaW5nIHRoZSBTaGFkb3cgRE9NLCBiZWNhdXNlIHRoZSBuYXRpdmUgcHJvamVjdGlvbiBwbGFjZWhvbGRlcnNcbiAgICAgIC8vICg8Y29udGVudD4gb3IgPHNsb3Q+KSBoYXZlIHRvIGJlIGluIHBsYWNlIGFzIGVsZW1lbnRzIGFyZSBiZWluZyBpbnNlcnRlZC5cbiAgICAgIGlmIChlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lIHx8XG4gICAgICAgICAgZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQgdXNpbmcge0BsaW5rIFJlbmRlcmVyM30uXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZCAtIGl0IGFic3RyYWN0cyBhblxuICogYWN0dWFsIHJlbmRlcmVyIGJlaW5nIHVzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsLFxuICAgIGlzTW92ZTogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVySW5zZXJ0QmVmb3JlKys7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSwgaXNNb3ZlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCBpc01vdmUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQXBwZW5kQ2hpbGQrKztcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocGFyZW50LCAncGFyZW50IG5vZGUgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQsIGNoaWxkKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCwgaXNNb3ZlOiBib29sZWFuKSB7XG4gIGlmIChiZWZvcmVOb2RlICE9PSBudWxsKSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlLCBpc01vdmUpO1xuICB9IGVsc2Uge1xuICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkKTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBhIG5vZGUgZnJvbSB0aGUgRE9NIGdpdmVuIGl0cyBuYXRpdmUgcGFyZW50LiAqL1xuZnVuY3Rpb24gbmF0aXZlUmVtb3ZlQ2hpbGQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50LCBjaGlsZCwgaXNIb3N0RWxlbWVudCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgcGFyZW50IG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUkVsZW1lbnR8bnVsbCB7XG4gIHJldHVybiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucGFyZW50Tm9kZShub2RlKSA6IG5vZGUucGFyZW50Tm9kZSkgYXMgUkVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBzaWJsaW5nIG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJOb2RlfG51bGwge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIubmV4dFNpYmxpbmcobm9kZSkgOiBub2RlLm5leHRTaWJsaW5nO1xufVxuXG4vKipcbiAqIEZpbmQgYSBub2RlIGluIGZyb250IG9mIHdoaWNoIGBjdXJyZW50VE5vZGVgIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBkZXRlcm1pbmVzIHRoZSBgUk5vZGVgIGluIGZyb250IG9mIHdoaWNoIHdlIHNob3VsZCBpbnNlcnQgdGhlIGBjdXJyZW50Uk5vZGVgLiBUaGlzXG4gKiB0YWtlcyBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgIGludG8gYWNjb3VudCBpZiBpMThuIGNvZGUgaGFzIGJlZW4gaW52b2tlZC5cbiAqXG4gKiBAcGFyYW0gcGFyZW50VE5vZGUgcGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSBjdXJyZW50VE5vZGUgY3VycmVudCBgVE5vZGVgIChUaGUgbm9kZSB3aGljaCB3ZSB3b3VsZCBsaWtlIHRvIGluc2VydCBpbnRvIHRoZSBET00pXG4gKiBAcGFyYW0gbFZpZXcgY3VycmVudCBgTFZpZXdgXG4gKi9cbmZ1bmN0aW9uIGdldEluc2VydEluRnJvbnRPZlJOb2RlKHBhcmVudFROb2RlOiBUTm9kZSwgY3VycmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGV8XG4gICAgbnVsbCB7XG4gIHJldHVybiBfZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bihwYXJlbnRUTm9kZSwgY3VycmVudFROb2RlLCBsVmlldyk7XG59XG5cblxuLyoqXG4gKiBGaW5kIGEgbm9kZSBpbiBmcm9udCBvZiB3aGljaCBgY3VycmVudFROb2RlYCBzaG91bGQgYmUgaW5zZXJ0ZWQuIChEb2VzIG5vdCB0YWtlIGkxOG4gaW50b1xuICogYWNjb3VudClcbiAqXG4gKiBUaGlzIG1ldGhvZCBkZXRlcm1pbmVzIHRoZSBgUk5vZGVgIGluIGZyb250IG9mIHdoaWNoIHdlIHNob3VsZCBpbnNlcnQgdGhlIGBjdXJyZW50Uk5vZGVgLiBUaGlzXG4gKiBkb2VzIG5vdCB0YWtlIGBUTm9kZS5pbnNlcnRCZWZvcmVJbmRleGAgaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBwYXJlbnRUTm9kZSBwYXJlbnQgYFROb2RlYFxuICogQHBhcmFtIGN1cnJlbnRUTm9kZSBjdXJyZW50IGBUTm9kZWAgKFRoZSBub2RlIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gaW5zZXJ0IGludG8gdGhlIERPTSlcbiAqIEBwYXJhbSBsVmlldyBjdXJyZW50IGBMVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aE5vSTE4bihcbiAgICBwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfG51bGwge1xuICBpZiAocGFyZW50VE5vZGUudHlwZSAmIChUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8IFROb2RlVHlwZS5JY3UpKSB7XG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBUcmVlIHNoYWthYmxlIGJvdW5kYXJ5IGZvciBgZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bmAgZnVuY3Rpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG9ubHkgYmUgc2V0IGlmIGkxOG4gY29kZSBydW5zLlxuICovXG5sZXQgX2dldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG46IChwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT5cbiAgICBSTm9kZSB8IG51bGwgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhOb0kxOG47XG5cbi8qKlxuICogVHJlZSBzaGFrYWJsZSBib3VuZGFyeSBmb3IgYHByb2Nlc3NJMThuSW5zZXJ0QmVmb3JlYCBmdW5jdGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgb25seSBiZSBzZXQgaWYgaTE4biBjb2RlIHJ1bnMuXG4gKi9cbmxldCBfcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmU6IChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBjaGlsZFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBjaGlsZFJOb2RlOiBSTm9kZXxSTm9kZVtdLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsKSA9PiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0STE4bkhhbmRsaW5nKFxuICAgIGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG46IChwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT5cbiAgICAgICAgUk5vZGUgfCBudWxsLFxuICAgIHByb2Nlc3NJMThuSW5zZXJ0QmVmb3JlOiAoXG4gICAgICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGNoaWxkVE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGNoaWxkUk5vZGU6IFJOb2RlfFJOb2RlW10sXG4gICAgICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsKSA9PiB2b2lkKSB7XG4gIF9nZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bjtcbiAgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlID0gcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmU7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBuYXRpdmUgbm9kZSAob3IgYSBjb2xsZWN0aW9uIG9mIG5vZGVzKSB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIHRvIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBjaGlsZFJOb2RlIFRoZSBuYXRpdmUgY2hpbGQgKG9yIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY2hpbGRSTm9kZTogUk5vZGV8Uk5vZGVbXSwgY2hpbGRUTm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50Uk5vZGUgPSBnZXRQYXJlbnRSRWxlbWVudCh0VmlldywgY2hpbGRUTm9kZSwgbFZpZXcpO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgbFZpZXdbVF9IT1NUXSE7XG4gIGNvbnN0IGFuY2hvck5vZGUgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZShwYXJlbnRUTm9kZSwgY2hpbGRUTm9kZSwgbFZpZXcpO1xuICBpZiAocGFyZW50Uk5vZGUgIT0gbnVsbCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkUk5vZGUpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkUk5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCBjaGlsZFJOb2RlW2ldLCBhbmNob3JOb2RlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnRSTm9kZSwgY2hpbGRSTm9kZSwgYW5jaG9yTm9kZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBfcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmUocmVuZGVyZXIsIGNoaWxkVE5vZGUsIGxWaWV3LCBjaGlsZFJOb2RlLCBwYXJlbnRSTm9kZSk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gTFZpZXcsIHN0YXJ0aW5nIGZyb20gdGhlIHByb3ZpZGVkIFROb2RlLlxuICpcbiAqIE5hdGl2ZSBub2RlcyBhcmUgcmV0dXJuZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHRob3NlIGFwcGVhciBpbiB0aGUgbmF0aXZlIHRyZWUgKERPTSkuXG4gKi9cbmZ1bmN0aW9uIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZXxudWxsKTogUk5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICB0Tm9kZSxcbiAgICAgICAgICAgIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuSWN1IHwgVE5vZGVUeXBlLlByb2plY3Rpb24pO1xuXG4gICAgY29uc3QgdE5vZGVUeXBlID0gdE5vZGUudHlwZTtcbiAgICBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB7XG4gICAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpO1xuICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgcmV0dXJuIGdldEJlZm9yZU5vZGVGb3JWaWV3KC0xLCBsVmlld1t0Tm9kZS5pbmRleF0pO1xuICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGVsSWN1Q29udGFpbmVyQ2hpbGQgPSB0Tm9kZS5jaGlsZDtcbiAgICAgIGlmIChlbEljdUNvbnRhaW5lckNoaWxkICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIGVsSWN1Q29udGFpbmVyQ2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgck5vZGVPckxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgICAgIGlmIChpc0xDb250YWluZXIock5vZGVPckxDb250YWluZXIpKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEJlZm9yZU5vZGVGb3JWaWV3KC0xLCByTm9kZU9yTENvbnRhaW5lcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHVud3JhcFJOb2RlKHJOb2RlT3JMQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkljdSkge1xuICAgICAgbGV0IG5leHRSTm9kZSA9IGljdUNvbnRhaW5lckl0ZXJhdGUodE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgICAgIGxldCByTm9kZTogUk5vZGV8bnVsbCA9IG5leHRSTm9kZSgpO1xuICAgICAgLy8gSWYgdGhlIElDVSBjb250YWluZXIgaGFzIG5vIG5vZGVzLCB0aGFuIHdlIHVzZSB0aGUgSUNVIGFuY2hvciBhcyB0aGUgbm9kZS5cbiAgICAgIHJldHVybiByTm9kZSB8fCB1bndyYXBSTm9kZShsVmlld1t0Tm9kZS5pbmRleF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcm9qZWN0aW9uTm9kZXMgPSBnZXRQcm9qZWN0aW9uTm9kZXMobFZpZXcsIHROb2RlKTtcbiAgICAgIGlmIChwcm9qZWN0aW9uTm9kZXMgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvamVjdGlvbk5vZGVzKSkge1xuICAgICAgICAgIHJldHVybiBwcm9qZWN0aW9uTm9kZXNbMF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldExWaWV3UGFyZW50KGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSk7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRQYXJlbnRWaWV3KHBhcmVudFZpZXcpO1xuICAgICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKHBhcmVudFZpZXchLCBwcm9qZWN0aW9uTm9kZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgdE5vZGUubmV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0aW9uTm9kZXMobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCk6IFROb2RlfFJOb2RlW118bnVsbCB7XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgY29uc3Qgc2xvdElkeCA9IHROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRQcm9qZWN0aW9uU2xvdHMobFZpZXcpO1xuICAgIHJldHVybiBjb21wb25lbnRIb3N0LnByb2plY3Rpb24hW3Nsb3RJZHhdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVmb3JlTm9kZUZvclZpZXcodmlld0luZGV4SW5Db250YWluZXI6IG51bWJlciwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IFJOb2RlfFxuICAgIG51bGwge1xuICBjb25zdCBuZXh0Vmlld0luZGV4ID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyB2aWV3SW5kZXhJbkNvbnRhaW5lciArIDE7XG4gIGlmIChuZXh0Vmlld0luZGV4IDwgbENvbnRhaW5lci5sZW5ndGgpIHtcbiAgICBjb25zdCBsVmlldyA9IGxDb250YWluZXJbbmV4dFZpZXdJbmRleF0gYXMgTFZpZXc7XG4gICAgY29uc3QgZmlyc3RUTm9kZU9mVmlldyA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICAgIGlmIChmaXJzdFROb2RlT2ZWaWV3ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3LCBmaXJzdFROb2RlT2ZWaWV3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbENvbnRhaW5lcltOQVRJVkVdO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBuYXRpdmUgbm9kZSBpdHNlbGYgdXNpbmcgYSBnaXZlbiByZW5kZXJlci4gVG8gcmVtb3ZlIHRoZSBub2RlIHdlIGFyZSBsb29raW5nIHVwIGl0c1xuICogcGFyZW50IGZyb20gdGhlIG5hdGl2ZSB0cmVlIGFzIG5vdCBhbGwgcGxhdGZvcm1zIC8gYnJvd3NlcnMgc3VwcG9ydCB0aGUgZXF1aXZhbGVudCBvZlxuICogbm9kZS5yZW1vdmUoKS5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byBiZSB1c2VkXG4gKiBAcGFyYW0gck5vZGUgVGhlIG5hdGl2ZSBub2RlIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBpc0hvc3RFbGVtZW50IEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgbm9kZSB0byBiZSByZW1vdmVkIGlzIGEgaG9zdCBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgck5vZGU6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xuICBjb25zdCBuYXRpdmVQYXJlbnQgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCByTm9kZSk7XG4gIGlmIChuYXRpdmVQYXJlbnQpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChyZW5kZXJlciwgbmF0aXZlUGFyZW50LCByTm9kZSwgaXNIb3N0RWxlbWVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFBlcmZvcm1zIHRoZSBvcGVyYXRpb24gb2YgYGFjdGlvbmAgb24gdGhlIG5vZGUuIFR5cGljYWxseSB0aGlzIGludm9sdmVzIGluc2VydGluZyBvciByZW1vdmluZ1xuICogbm9kZXMgb24gdGhlIExWaWV3IG9yIHByb2plY3Rpb24gYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Tm9kZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCB0Tm9kZTogVE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3LFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsLCBpc1Byb2plY3Rpb246IGJvb2xlYW4pIHtcbiAgd2hpbGUgKHROb2RlICE9IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICB0Tm9kZSxcbiAgICAgICAgICAgIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuUHJvamVjdGlvbiB8IFROb2RlVHlwZS5JY3UpO1xuICAgIGNvbnN0IHJhd1Nsb3RWYWx1ZSA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmIChpc1Byb2plY3Rpb24pIHtcbiAgICAgIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlKSB7XG4gICAgICAgIHJhd1Nsb3RWYWx1ZSAmJiBhdHRhY2hQYXRjaERhdGEodW53cmFwUk5vZGUocmF3U2xvdFZhbHVlKSwgbFZpZXcpO1xuICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSAhPT0gVE5vZGVGbGFncy5pc0RldGFjaGVkKSB7XG4gICAgICBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB0Tm9kZS5jaGlsZCwgbFZpZXcsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlLCBmYWxzZSk7XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5JY3UpIHtcbiAgICAgICAgY29uc3QgbmV4dFJOb2RlID0gaWN1Q29udGFpbmVySXRlcmF0ZSh0Tm9kZSBhcyBUSWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgICAgICBsZXQgck5vZGU6IFJOb2RlfG51bGw7XG4gICAgICAgIHdoaWxlIChyTm9kZSA9IG5leHRSTm9kZSgpKSB7XG4gICAgICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgck5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICAgICAgICAgIHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGUsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUodE5vZGUsIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByYXdTbG90VmFsdWUsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IGlzUHJvamVjdGlvbiA/IHROb2RlLnByb2plY3Rpb25OZXh0IDogdE5vZGUubmV4dDtcbiAgfVxufVxuXG5cbi8qKlxuICogYGFwcGx5Vmlld2AgcGVyZm9ybXMgb3BlcmF0aW9uIG9uIHRoZSB2aWV3IGFzIHNwZWNpZmllZCBpbiBgYWN0aW9uYCAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgdmlldyB3aXRob3V0IHByb2plY3Rpb24gb3IgY29udGFpbmVycyBhdCB0b3AgbGV2ZWwgaXMgc2ltcGxlLiBKdXN0IGl0ZXJhdGUgb3ZlciB0aGVcbiAqIHJvb3Qgbm9kZXMgb2YgdGhlIFZpZXcsIGFuZCBmb3IgZWFjaCBub2RlIHBlcmZvcm0gdGhlIGBhY3Rpb25gLlxuICpcbiAqIFRoaW5ncyBnZXQgbW9yZSBjb21wbGljYXRlZCB3aXRoIGNvbnRhaW5lcnMgYW5kIHByb2plY3Rpb25zLiBUaGF0IGlzIGJlY2F1c2UgY29taW5nIGFjcm9zczpcbiAqIC0gQ29udGFpbmVyOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIHZpZXdzIG9mIHRoYXQgY29udGFpbmVyIGFzIHdlbGxcbiAqICAgICAgICAgICAgICB3aGljaCBpbiB0dXJuIGNhbiBoYXZlIHRoZWlyIG93biBDb250YWluZXJzIGF0IHRoZSBWaWV3IHJvb3RzLlxuICogLSBQcm9qZWN0aW9uOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIG5vZGVzIG9mIHRoZSBwcm9qZWN0aW9uLiBUaGVcbiAqICAgICAgICAgICAgICAgY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhlIG5vZGVzIHdlIGFyZSBwcm9qZWN0aW5nIGNhbiB0aGVtc2VsdmVzIGhhdmUgQ29udGFpbmVyc1xuICogICAgICAgICAgICAgICBvciBvdGhlciBQcm9qZWN0aW9ucy5cbiAqXG4gKiBBcyB5b3UgY2FuIHNlZSB0aGlzIGlzIGEgdmVyeSByZWN1cnNpdmUgcHJvYmxlbS4gWWVzIHJlY3Vyc2lvbiBpcyBub3QgbW9zdCBlZmZpY2llbnQgYnV0IHRoZVxuICogY29kZSBpcyBjb21wbGljYXRlZCBlbm91Z2ggdGhhdCB0cnlpbmcgdG8gaW1wbGVtZW50ZWQgd2l0aCByZWN1cnNpb24gYmVjb21lcyB1bm1haW50YWluYWJsZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbiAoUmVtb3ZhbCBkb2VzIG5vdCBuZWVkIGl0KS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksXG4gICAgcGFyZW50UkVsZW1lbnQ6IG51bGwsIGJlZm9yZU5vZGU6IG51bGwpOiB2b2lkO1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpOiB2b2lkO1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB0Vmlldy5maXJzdENoaWxkLCBsVmlldywgcGFyZW50UkVsZW1lbnQsIGJlZm9yZU5vZGUsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBgYXBwbHlQcm9qZWN0aW9uYCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHByb2plY3Rpb24uXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlld2Agb2YgYExWaWV3YCB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBub2RlIHRvIHByb2plY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdGlvbih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdFByb2plY3Rpb25Ob2RlOiBUUHJvamVjdGlvbk5vZGUpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHBhcmVudFJOb2RlID0gZ2V0UGFyZW50UkVsZW1lbnQodFZpZXcsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICBjb25zdCBwYXJlbnRUTm9kZSA9IHRQcm9qZWN0aW9uTm9kZS5wYXJlbnQgfHwgbFZpZXdbVF9IT1NUXSE7XG4gIGxldCBiZWZvcmVOb2RlID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGUocGFyZW50VE5vZGUsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICBhcHBseVByb2plY3Rpb25SZWN1cnNpdmUoXG4gICAgICByZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUsIGxWaWV3LCB0UHJvamVjdGlvbk5vZGUsIHBhcmVudFJOb2RlLCBiZWZvcmVOb2RlKTtcbn1cblxuLyoqXG4gKiBgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlYCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHByb2plY3Rpb24gc3BlY2lmaWVkIGJ5IGBhY3Rpb25gIChpbnNlcnQsXG4gKiBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBub2RlIHRvIHByb2plY3RcbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbFZpZXc6IExWaWV3LFxuICAgIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlLCBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCkge1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudExWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHR5cGVvZiB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiwgJ251bWJlcicsICdleHBlY3RpbmcgcHJvamVjdGlvbiBpbmRleCcpO1xuICBjb25zdCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMgPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24hW3RQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uXSE7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVUb1Byb2plY3RPclJOb2RlcykpIHtcbiAgICAvLyBUaGlzIHNob3VsZCBub3QgZXhpc3QsIGl0IGlzIGEgYml0IG9mIGEgaGFjay4gV2hlbiB3ZSBib290c3RyYXAgYSB0b3AgbGV2ZWwgbm9kZSBhbmQgd2VcbiAgICAvLyBuZWVkIHRvIHN1cHBvcnQgcGFzc2luZyBwcm9qZWN0YWJsZSBub2Rlcywgc28gd2UgY2hlYXQgYW5kIHB1dCB0aGVtIGluIHRoZSBUTm9kZVxuICAgIC8vIG9mIHRoZSBIb3N0IFRWaWV3LiAoWWVzIHdlIHB1dCBpbnN0YW5jZSBpbmZvIGF0IHRoZSBUIExldmVsKS4gV2UgY2FuIGdldCBhd2F5IHdpdGggaXRcbiAgICAvLyBiZWNhdXNlIHdlIGtub3cgdGhhdCB0aGF0IFRWaWV3IGlzIG5vdCBzaGFyZWQgYW5kIHRoZXJlZm9yZSBpdCB3aWxsIG5vdCBiZSBhIHByb2JsZW0uXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgcmVmYWN0b3JlZCBhbmQgY2xlYW5lZCB1cC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVUb1Byb2plY3RPclJOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgck5vZGUgPSBub2RlVG9Qcm9qZWN0T3JSTm9kZXNbaV07XG4gICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByTm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBub2RlVG9Qcm9qZWN0OiBUTm9kZXxudWxsID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzO1xuICAgIGNvbnN0IHByb2plY3RlZENvbXBvbmVudExWaWV3ID0gY29tcG9uZW50TFZpZXdbUEFSRU5UXSBhcyBMVmlldztcbiAgICBhcHBseU5vZGVzKFxuICAgICAgICByZW5kZXJlciwgYWN0aW9uLCBub2RlVG9Qcm9qZWN0LCBwcm9qZWN0ZWRDb21wb25lbnRMVmlldywgcGFyZW50UkVsZW1lbnQsIGJlZm9yZU5vZGUsIHRydWUpO1xuICB9XG59XG5cblxuLyoqXG4gKiBgYXBwbHlDb250YWluZXJgIHBlcmZvcm1zIGFuIG9wZXJhdGlvbiBvbiB0aGUgY29udGFpbmVyIGFuZCBpdHMgdmlld3MgYXMgc3BlY2lmaWVkIGJ5XG4gKiBgYWN0aW9uYCAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgQ29udGFpbmVyIGlzIGNvbXBsaWNhdGVkIGJ5IHRoZSBmYWN0IHRoYXQgdGhlIGNvbnRhaW5lciBtYXkgaGF2ZSBWaWV3cyB3aGljaFxuICogdGhlbXNlbHZlcyBoYXZlIGNvbnRhaW5lcnMgb3IgcHJvamVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgTENvbnRhaW5lciB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlDb250YWluZXIoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsfHVuZGVmaW5lZCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3QgYW5jaG9yID0gbENvbnRhaW5lcltOQVRJVkVdOyAgLy8gTENvbnRhaW5lciBoYXMgaXRzIG93biBiZWZvcmUgbm9kZS5cbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUobENvbnRhaW5lcik7XG4gIC8vIEFuIExDb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgb24gYW55IG5vZGUgYnkgaW5qZWN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gIC8vIEFza2luZyBmb3IgYSBWaWV3Q29udGFpbmVyUmVmIG9uIGFuIGVsZW1lbnQgd2lsbCByZXN1bHQgaW4gYSBjcmVhdGlvbiBvZiBhIHNlcGFyYXRlIGFuY2hvclxuICAvLyBub2RlIChjb21tZW50IGluIHRoZSBET00pIHRoYXQgd2lsbCBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgTENvbnRhaW5lcidzIGhvc3Qgbm9kZS4gSW4gdGhpc1xuICAvLyBwYXJ0aWN1bGFyIGNhc2Ugd2UgbmVlZCB0byBleGVjdXRlIGFjdGlvbiBvbiAyIG5vZGVzOlxuICAvLyAtIGNvbnRhaW5lcidzIGhvc3Qgbm9kZSAodGhpcyBpcyBkb25lIGluIHRoZSBleGVjdXRlQWN0aW9uT25FbGVtZW50T3JDb250YWluZXIpXG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaGVyZSlcbiAgaWYgKGFuY2hvciAhPT0gbmF0aXZlKSB7XG4gICAgLy8gVGhpcyBpcyB2ZXJ5IHN0cmFuZ2UgdG8gbWUgKE1pc2tvKS4gSSB3b3VsZCBleHBlY3QgdGhhdCB0aGUgbmF0aXZlIGlzIHNhbWUgYXMgYW5jaG9yLiBJXG4gICAgLy8gZG9uJ3Qgc2VlIGEgcmVhc29uIHdoeSB0aGV5IHNob3VsZCBiZSBkaWZmZXJlbnQsIGJ1dCB0aGV5IGFyZS5cbiAgICAvL1xuICAgIC8vIElmIHRoZXkgYXJlIHdlIG5lZWQgdG8gcHJvY2VzcyB0aGUgc2Vjb25kIGFuY2hvciBhcyB3ZWxsLlxuICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIGFuY2hvciwgYmVmb3JlTm9kZSk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICBhcHBseVZpZXcobFZpZXdbVFZJRVddLCBsVmlldywgcmVuZGVyZXIsIGFjdGlvbiwgcGFyZW50UkVsZW1lbnQsIGFuY2hvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZXMgY2xhc3Mvc3R5bGUgdG8gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgaXQgc2hvdWxkIGJlIHdyaXR0ZW4gdG8gYGNsYXNzYCAoYGZhbHNlYCB0byB3cml0ZSB0byBgc3R5bGVgKVxuICogQHBhcmFtIHJOb2RlIFRoZSBOb2RlIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgdG8gd3JpdGUgdG8uIFRoaXMgd291bGQgYmUgdGhlIGNsYXNzL3N0eWxlIG5hbWUuXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIElmIGBudWxsYC9gdW5kZWZpbmVkYC9gZmFsc2VgIHRoaXMgaXMgY29uc2lkZXJlZCBhIHJlbW92ZSAoc2V0L2FkZFxuICogICAgICAgIG90aGVyd2lzZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCByTm9kZTogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCBpc1Byb2NlZHVyYWwgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAvLyBXZSBhY3R1YWxseSB3YW50IEpTIHRydWUvZmFsc2UgaGVyZSBiZWNhdXNlIGFueSB0cnV0aHkgdmFsdWUgc2hvdWxkIGFkZCB0aGUgY2xhc3NcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIGlmIChpc1Byb2NlZHVyYWwpIHtcbiAgICAgICAgKHJlbmRlcmVyIGFzIFJlbmRlcmVyMikucmVtb3ZlQ2xhc3Mock5vZGUsIHByb3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKHJOb2RlIGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QucmVtb3ZlKHByb3ApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgIGlmIChpc1Byb2NlZHVyYWwpIHtcbiAgICAgICAgKHJlbmRlcmVyIGFzIFJlbmRlcmVyMikuYWRkQ2xhc3Mock5vZGUsIHByb3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoKHJOb2RlIGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QsICdIVE1MRWxlbWVudCBleHBlY3RlZCcpO1xuICAgICAgICAock5vZGUgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTGlzdC5hZGQocHJvcCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBmbGFncyA9IHByb3AuaW5kZXhPZignLScpID09PSAtMSA/IHVuZGVmaW5lZCA6IFJlbmRlcmVyU3R5bGVGbGFnczIuRGFzaENhc2UgYXMgbnVtYmVyO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIC8qKiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIGlmIChpc1Byb2NlZHVyYWwpIHtcbiAgICAgICAgKHJlbmRlcmVyIGFzIFJlbmRlcmVyMikucmVtb3ZlU3R5bGUock5vZGUsIHByb3AsIGZsYWdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChyTm9kZSBhcyBIVE1MRWxlbWVudCkuc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgdmFsdWUgaXMgaW1wb3J0YW50IGlmIGl0IGVuZHMgd2l0aCBgIWltcG9ydGFudGAuIFRoZSBzdHlsZVxuICAgICAgLy8gcGFyc2VyIHN0cmlwcyBhbnkgc2VtaWNvbG9ucyBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS5cbiAgICAgIGNvbnN0IGlzSW1wb3J0YW50ID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlLmVuZHNXaXRoKCchaW1wb3J0YW50JykgOiBmYWxzZTtcblxuICAgICAgaWYgKGlzSW1wb3J0YW50KSB7XG4gICAgICAgIC8vICFpbXBvcnRhbnQgaGFzIHRvIGJlIHN0cmlwcGVkIGZyb20gdGhlIHZhbHVlIGZvciBpdCB0byBiZSB2YWxpZC5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgwLCAtMTApO1xuICAgICAgICBmbGFncyEgfD0gUmVuZGVyZXJTdHlsZUZsYWdzMi5JbXBvcnRhbnQ7XG4gICAgICB9XG5cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgaWYgKGlzUHJvY2VkdXJhbCkge1xuICAgICAgICAocmVuZGVyZXIgYXMgUmVuZGVyZXIyKS5zZXRTdHlsZShyTm9kZSwgcHJvcCwgdmFsdWUsIGZsYWdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKChyTm9kZSBhcyBIVE1MRWxlbWVudCkuc3R5bGUsICdIVE1MRWxlbWVudCBleHBlY3RlZCcpO1xuICAgICAgICAock5vZGUgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlLCBpc0ltcG9ydGFudCA/ICdpbXBvcnRhbnQnIDogJycpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogV3JpdGUgYGNzc1RleHRgIHRvIGBSRWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBkb2VzIGRpcmVjdCB3cml0ZSB3aXRob3V0IGFueSByZWNvbmNpbGlhdGlvbi4gVXNlZCBmb3Igd3JpdGluZyBpbml0aWFsIHZhbHVlcywgc29cbiAqIHRoYXQgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGRvIG5vdCBwdWxsIGluIHRoZSBzdHlsZSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IGNsYXNzIGxpc3QgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURpcmVjdFN0eWxlKHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBuZXdWYWx1ZTogc3RyaW5nKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRTdHJpbmcobmV3VmFsdWUsICdcXCduZXdWYWx1ZVxcJyBzaG91bGQgYmUgYSBzdHJpbmcnKTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnc3R5bGUnLCBuZXdWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmNzc1RleHQgPSBuZXdWYWx1ZTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbn1cblxuLyoqXG4gKiBXcml0ZSBgY2xhc3NOYW1lYCB0byBgUkVsZW1lbnRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZG9lcyBkaXJlY3Qgd3JpdGUgd2l0aG91dCBhbnkgcmVjb25jaWxpYXRpb24uIFVzZWQgZm9yIHdyaXRpbmcgaW5pdGlhbCB2YWx1ZXMsIHNvXG4gKiB0aGF0IHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBkbyBub3QgcHVsbCBpbiB0aGUgc3R5bGUgcGFyc2VyLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHdoaWNoIG5lZWRzIHRvIGJlIHVwZGF0ZWQuXG4gKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyBjbGFzcyBsaXN0IHRvIHdyaXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVEaXJlY3RDbGFzcyhyZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgbmV3VmFsdWU6IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKG5ld1ZhbHVlLCAnXFwnbmV3VmFsdWVcXCcgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICBpZiAobmV3VmFsdWUgPT09ICcnKSB7XG4gICAgICAvLyBUaGVyZSBhcmUgdGVzdHMgaW4gYGdvb2dsZTNgIHdoaWNoIGV4cGVjdCBgZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJylgIHRvIGJlIGBudWxsYC5cbiAgICAgIHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50LCAnY2xhc3MnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsICdjbGFzcycsIG5ld1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSBuZXdWYWx1ZTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0Q2xhc3NOYW1lKys7XG59XG4iXX0=