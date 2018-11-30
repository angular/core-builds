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
import { attachPatchData } from './context_discovery';
import { callHooks } from './hooks';
import { NATIVE, RENDER_PARENT, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, CONTAINER_INDEX, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { getNativeByTNode, isLContainer, isRootView, readElementValue, stringify } from './util';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Retrieves the parent element of a given node.
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
export function getParentNative(tNode, currentView) {
    if (tNode.parent == null) {
        return getHostNative(currentView);
    }
    else {
        /** @type {?} */
        const parentTNode = getFirstParentNative(tNode);
        return getNativeByTNode(parentTNode, currentView);
    }
}
/**
 * Get the first parent of a node that isn't an IcuContainer TNode
 * @param {?} tNode
 * @return {?}
 */
function getFirstParentNative(tNode) {
    /** @type {?} */
    let parent = tNode.parent;
    while (parent && parent.type === 5 /* IcuContainer */) {
        parent = parent.parent;
    }
    return /** @type {?} */ ((parent));
}
/**
 * Gets the host element given a view. Will return null if the current view is an embedded view,
 * which does not have a host element.
 * @param {?} currentView
 * @return {?}
 */
export function getHostNative(currentView) {
    /** @type {?} */
    const hostTNode = /** @type {?} */ (currentView[HOST_NODE]);
    return hostTNode && hostTNode.type !== 2 /* View */ ?
        (/** @type {?} */ (getNativeByTNode(hostTNode, /** @type {?} */ ((currentView[PARENT]))))) :
        null;
}
/**
 * @param {?} tNode
 * @param {?} embeddedView
 * @return {?}
 */
export function getLContainer(tNode, embeddedView) {
    if (tNode.index === -1) {
        /** @type {?} */
        const containerHostIndex = embeddedView[CONTAINER_INDEX];
        return containerHostIndex > -1 ? /** @type {?} */ ((embeddedView[PARENT]))[containerHostIndex] : null;
    }
    else {
        // This is a inline view node (e.g. embeddedViewStart)
        return /** @type {?} */ (((embeddedView[PARENT]))[/** @type {?} */ ((tNode.parent)).index]);
    }
}
/**
 * Retrieves render parent for a given view.
 * Might be null if a view is not yet attached to any container.
 * @param {?} tViewNode
 * @param {?} view
 * @return {?}
 */
export function getContainerRenderParent(tViewNode, view) {
    /** @type {?} */
    const container = getLContainer(tViewNode, view);
    return container ? container[RENDER_PARENT] : null;
}
/** @enum {number} */
var WalkTNodeTreeAction = {
    /** node insert in the native environment */
    Insert: 0,
    /** node detach from the native environment */
    Detach: 1,
    /** node destruction using the renderer's API */
    Destroy: 2,
};
/** *
 * Stack used to keep track of projection nodes in walkTNodeTree.
 *
 * This is deliberately created outside of walkTNodeTree to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
  @type {?} */
const projectionNodeStack = [];
/**
 * Walks a tree of TNodes, applying a transformation on the element nodes, either only on the first
 * one found, or on all of them.
 *
 * @param {?} viewToWalk the view to walk
 * @param {?} action identifies the action to be performed on the elements
 * @param {?} renderer the current renderer.
 * @param {?} renderParent Optional the render parent node to be set in all LContainers found,
 * required for action modes Insert and Destroy.
 * @param {?=} beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 * @return {?}
 */
function walkTNodeTree(viewToWalk, action, renderer, renderParent, beforeNode) {
    /** @type {?} */
    const rootTNode = /** @type {?} */ (viewToWalk[TVIEW].node);
    /** @type {?} */
    let projectionNodeIndex = -1;
    /** @type {?} */
    let currentView = viewToWalk;
    /** @type {?} */
    let tNode = /** @type {?} */ (rootTNode.child);
    while (tNode) {
        /** @type {?} */
        let nextTNode = null;
        if (tNode.type === 3 /* Element */) {
            executeNodeAction(action, renderer, renderParent, getNativeByTNode(tNode, currentView), beforeNode);
            /** @type {?} */
            const nodeOrContainer = currentView[tNode.index];
            if (isLContainer(nodeOrContainer)) {
                // This element has an LContainer, and its comment needs to be handled
                executeNodeAction(action, renderer, renderParent, nodeOrContainer[NATIVE], beforeNode);
            }
        }
        else if (tNode.type === 0 /* Container */) {
            /** @type {?} */
            const lContainer = /** @type {?} */ (((currentView))[tNode.index]);
            executeNodeAction(action, renderer, renderParent, lContainer[NATIVE], beforeNode);
            if (renderParent)
                lContainer[RENDER_PARENT] = renderParent;
            if (lContainer[VIEWS].length) {
                currentView = lContainer[VIEWS][0];
                nextTNode = currentView[TVIEW].node;
                // When the walker enters a container, then the beforeNode has to become the local native
                // comment node.
                beforeNode = lContainer[NATIVE];
            }
        }
        else if (tNode.type === 1 /* Projection */) {
            /** @type {?} */
            const componentView = findComponentView(/** @type {?} */ ((currentView)));
            /** @type {?} */
            const componentHost = /** @type {?} */ (componentView[HOST_NODE]);
            /** @type {?} */
            const head = (/** @type {?} */ (componentHost.projection))[/** @type {?} */ (tNode.projection)];
            // Must store both the TNode and the view because this projection node could be nested
            // deeply inside embedded views, and we need to get back down to this particular nested view.
            projectionNodeStack[++projectionNodeIndex] = tNode;
            projectionNodeStack[++projectionNodeIndex] = /** @type {?} */ ((currentView));
            if (head) {
                currentView = /** @type {?} */ ((componentView[PARENT]));
                nextTNode = /** @type {?} */ (currentView[TVIEW].data[head.index]);
            }
        }
        else {
            // Otherwise, this is a View or an ElementContainer
            nextTNode = tNode.child;
        }
        if (nextTNode === null) {
            // this last node was projected, we need to get back down to its projection node
            if (tNode.next === null && (tNode.flags & 8192 /* isProjected */)) {
                currentView = /** @type {?} */ (projectionNodeStack[projectionNodeIndex--]);
                tNode = /** @type {?} */ (projectionNodeStack[projectionNodeIndex--]);
            }
            nextTNode = tNode.next;
            /**
                   * Find the next node in the TNode tree, taking into account the place where a node is
                   * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
                   *
                   * If there is no sibling node, then it goes to the next sibling of the parent node...
                   * until it reaches rootNode (at which point null is returned).
                   */
            while (!nextTNode) {
                // If parent is null, we're crossing the view boundary, so we should get the host TNode.
                tNode = tNode.parent || currentView[TVIEW].node;
                if (tNode === null || tNode === rootTNode)
                    return null;
                // When exiting a container, the beforeNode must be restored to the previous value
                if (tNode.type === 0 /* Container */) {
                    currentView = /** @type {?} */ ((currentView[PARENT]));
                    beforeNode = currentView[tNode.index][NATIVE];
                }
                if (tNode.type === 2 /* View */ && currentView[NEXT]) {
                    currentView = /** @type {?} */ (currentView[NEXT]);
                    nextTNode = currentView[TVIEW].node;
                }
                else {
                    nextTNode = tNode.next;
                }
            }
        }
        tNode = nextTNode;
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param {?} lViewData LViewData for which we want a host element node
 * @return {?} The host node
 */
export function findComponentView(lViewData) {
    /** @type {?} */
    let rootTNode = lViewData[HOST_NODE];
    while (rootTNode && rootTNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'viewData.parent');
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
        rootTNode = lViewData[HOST_NODE];
    }
    return lViewData;
}
/**
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 * @param {?} action
 * @param {?} renderer
 * @param {?} parent
 * @param {?} node
 * @param {?=} beforeNode
 * @return {?}
 */
function executeNodeAction(action, renderer, parent, node, beforeNode) {
    if (action === 0 /* Insert */) {
        isProceduralRenderer(/** @type {?} */ ((renderer))) ?
            (/** @type {?} */ (renderer)).insertBefore(/** @type {?} */ ((parent)), node, /** @type {?} */ (beforeNode)) : /** @type {?} */ ((parent)).insertBefore(node, /** @type {?} */ (beforeNode), true);
    }
    else if (action === 1 /* Detach */) {
        isProceduralRenderer(/** @type {?} */ ((renderer))) ?
            (/** @type {?} */ (renderer)).removeChild(/** @type {?} */ ((parent)), node) : /** @type {?} */ ((parent)).removeChild(node);
    }
    else if (action === 2 /* Destroy */) {
        ngDevMode && ngDevMode.rendererDestroyNode++; /** @type {?} */
        (((/** @type {?} */ (renderer)).destroyNode))(node);
    }
}
/**
 * @param {?} value
 * @param {?} renderer
 * @return {?}
 */
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
        renderer.createTextNode(stringify(value));
}
/**
 * @param {?} viewToWalk
 * @param {?} insertMode
 * @param {?=} beforeNode
 * @return {?}
 */
export function addRemoveViewFromContainer(viewToWalk, insertMode, beforeNode) {
    /** @type {?} */
    const renderParent = getContainerRenderParent(/** @type {?} */ (viewToWalk[TVIEW].node), viewToWalk);
    ngDevMode && assertNodeType(/** @type {?} */ (viewToWalk[TVIEW].node), 2 /* View */);
    if (renderParent) {
        /** @type {?} */
        const renderer = viewToWalk[RENDERER];
        walkTNodeTree(viewToWalk, insertMode ? 0 /* Insert */ : 1 /* Detach */, renderer, renderParent, beforeNode);
    }
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
 * @param {?} rootView The view to destroy
 * @return {?}
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    if (rootView[TVIEW].childIndex === -1) {
        return cleanUpView(rootView);
    }
    /** @type {?} */
    let viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        /** @type {?} */
        let next = null;
        if (viewOrContainer.length >= HEADER_OFFSET) {
            /** @type {?} */
            const view = /** @type {?} */ (viewOrContainer);
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        else {
            /** @type {?} */
            const container = /** @type {?} */ (viewOrContainer);
            if (container[VIEWS].length)
                next = container[VIEWS][0];
        }
        if (next == null) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (viewOrContainer && !/** @type {?} */ ((viewOrContainer))[NEXT] && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(viewOrContainer || rootView);
            next = viewOrContainer && /** @type {?} */ ((viewOrContainer))[NEXT];
        }
        viewOrContainer = next;
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
 * @param {?} lView The view to insert
 * @param {?} lContainer The container into which the view should be inserted
 * @param {?} parentView The new parent of the inserted view
 * @param {?} index The index at which to insert the view
 * @param {?} containerIndex The index of the container node, if dynamic
 * @return {?}
 */
export function insertView(lView, lContainer, parentView, index, containerIndex) {
    /** @type {?} */
    const views = lContainer[VIEWS];
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1][NEXT] = lView;
    }
    if (index < views.length) {
        lView[NEXT] = views[index];
        views.splice(index, 0, lView);
    }
    else {
        views.push(lView);
        lView[NEXT] = null;
    }
    // Dynamically inserted views need a reference to their parent container's host so it's
    // possible to jump from a view to its container's next when walking the node tree.
    if (containerIndex > -1) {
        lView[CONTAINER_INDEX] = containerIndex;
        lView[PARENT] = parentView;
    }
    // Notify query that a new view has been added
    if (lView[QUERIES]) {
        /** @type {?} */ ((lView[QUERIES])).insertView(index);
    }
    // Sets the attached flag
    lView[FLAGS] |= 8 /* Attached */;
}
/**
 * Detaches a view from a container.
 *
 * This method splices the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param {?} lContainer The container from which to detach a view
 * @param {?} removeIndex The index of the view to detach
 * @param {?} detached Whether or not this view is already detached.
 * @return {?}
 */
export function detachView(lContainer, removeIndex, detached) {
    /** @type {?} */
    const views = lContainer[VIEWS];
    /** @type {?} */
    const viewToDetach = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1][NEXT] = /** @type {?} */ (viewToDetach[NEXT]);
    }
    views.splice(removeIndex, 1);
    if (!detached) {
        addRemoveViewFromContainer(viewToDetach, false);
    }
    if (viewToDetach[QUERIES]) {
        /** @type {?} */ ((viewToDetach[QUERIES])).removeView();
    }
    viewToDetach[CONTAINER_INDEX] = -1;
    viewToDetach[PARENT] = null;
    // Unsets the attached flag
    viewToDetach[FLAGS] &= ~8 /* Attached */;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param {?} lContainer The container from which to remove a view
 * @param {?} containerHost
 * @param {?} removeIndex The index of the view to remove
 * @return {?}
 */
export function removeView(lContainer, containerHost, removeIndex) {
    /** @type {?} */
    const view = lContainer[VIEWS][removeIndex];
    detachView(lContainer, removeIndex, !!containerHost.detached);
    destroyLView(view);
}
/**
 * Gets the child of the given LViewData
 * @param {?} viewData
 * @return {?}
 */
export function getLViewChild(viewData) {
    /** @type {?} */
    const childIndex = viewData[TVIEW].childIndex;
    return childIndex === -1 ? null : viewData[childIndex];
}
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param {?} view The view to be destroyed.
 * @return {?}
 */
export function destroyLView(view) {
    /** @type {?} */
    const renderer = view[RENDERER];
    if (isProceduralRenderer(renderer) && renderer.destroyNode) {
        walkTNodeTree(view, 2 /* Destroy */, renderer, null);
    }
    destroyViewTree(view);
    // Sets the destroyed flag
    view[FLAGS] |= 32 /* Destroyed */;
}
/**
 * Determines which LViewOrLContainer to jump to when traversing back up the
 * tree in destroyViewTree.
 *
 * Normally, the view's parent LView should be checked, but in the case of
 * embedded views, the container (which is the view node's parent, but not the
 * LView's parent) needs to be checked for a possible next property.
 *
 * @param {?} state The LViewOrLContainer for which we need a parent state
 * @param {?} rootView The rootView, so we don't propagate too far up the view tree
 * @return {?} The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    /** @type {?} */
    let tNode;
    if (state.length >= HEADER_OFFSET && (tNode = /** @type {?} */ (((/** @type {?} */ (state))))[HOST_NODE]) &&
        tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return /** @type {?} */ (getLContainer(/** @type {?} */ (tNode), /** @type {?} */ (state)));
    }
    else {
        // otherwise, use parent view for containers or component views
        return state[PARENT] === rootView ? null : state[PARENT];
    }
}
/**
 * Removes all listeners and call all onDestroys in a given view.
 *
 * @param {?} viewOrContainer
 * @return {?}
 */
function cleanUpView(viewOrContainer) {
    if ((/** @type {?} */ (viewOrContainer)).length >= HEADER_OFFSET) {
        /** @type {?} */
        const view = /** @type {?} */ (viewOrContainer);
        removeListeners(view);
        executeOnDestroys(view);
        executePipeOnDestroys(view);
        // For component views only, the local renderer is destroyed as clean up time.
        if (view[TVIEW].id === -1 && isProceduralRenderer(view[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            (/** @type {?} */ (view[RENDERER])).destroy();
        }
    }
}
/**
 * Removes listeners and unsubscribes from output subscriptions
 * @param {?} viewData
 * @return {?}
 */
function removeListeners(viewData) {
    /** @type {?} */
    const cleanup = /** @type {?} */ ((viewData[TVIEW].cleanup));
    if (cleanup != null) {
        for (let i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                /** @type {?} */
                const native = readElementValue(viewData[cleanup[i + 1]]);
                /** @type {?} */
                const listener = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i + 2]];
                native.removeEventListener(cleanup[i], listener, cleanup[i + 3]);
                i += 2;
            }
            else if (typeof cleanup[i] === 'number') {
                /** @type {?} */
                const cleanupFn = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i]];
                cleanupFn();
            }
            else {
                /** @type {?} */
                const context = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i + 1]];
                cleanup[i].call(context);
            }
        }
        viewData[CLEANUP] = null;
    }
}
/**
 * Calls onDestroy hooks for this view
 * @param {?} view
 * @return {?}
 */
function executeOnDestroys(view) {
    /** @type {?} */
    const tView = view[TVIEW];
    /** @type {?} */
    let destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks(view, destroyHooks);
    }
}
/**
 * Calls pipe destroy hooks for this view
 * @param {?} viewData
 * @return {?}
 */
function executePipeOnDestroys(viewData) {
    /** @type {?} */
    const pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(/** @type {?} */ ((viewData)), pipeDestroyHooks);
    }
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
export function getRenderParent(tNode, currentView) {
    if (canInsertNativeNode(tNode, currentView)) {
        // If we are asked for a render parent of the root component we need to do low-level DOM
        // operation as LTree doesn't exist above the topmost host node. We might need to find a render
        // parent of the topmost host node if the root component injects ViewContainerRef.
        if (isRootView(currentView)) {
            return nativeParentNode(currentView[RENDERER], getNativeByTNode(tNode, currentView));
        }
        /** @type {?} */
        const hostTNode = currentView[HOST_NODE];
        /** @type {?} */
        const tNodeParent = tNode.parent;
        if (tNodeParent != null && tNodeParent.type === 4 /* ElementContainer */) {
            tNode = getHighestElementContainer(tNodeParent);
        }
        return tNode.parent == null && /** @type {?} */ ((hostTNode)).type === 2 /* View */ ?
            getContainerRenderParent(/** @type {?} */ (hostTNode), currentView) : /** @type {?} */ (getParentNative(tNode, currentView));
    }
    return null;
}
/**
 * @param {?} tNode
 * @return {?}
 */
function canInsertNativeChildOfElement(tNode) {
    // If the parent is null, then we are inserting across views. This happens when we
    // insert a root element of the component view into the component host element and it
    // should always be eager.
    if (tNode.parent == null ||
        // We should also eagerly insert if the parent is a regular, non-component element
        // since we know that this relationship will never be broken.
        tNode.parent.type === 3 /* Element */ && !(tNode.parent.flags & 4096 /* isComponent */)) {
        return true;
    }
    // Parent is a Component. Component's content nodes are not inserted immediately
    // because they will be projected, and so doing insert at this point would be wasteful.
    // Since the projection would than move it to its final destination.
    return false;
}
/**
 * We might delay insertion of children for a given view if it is disconnected.
 * This might happen for 2 main reasons:
 * - view is not inserted into any container (view was created but not inserted yet)
 * - view is inserted into a container but the container itself is not inserted into the DOM
 * (container might be part of projection or child of a view that is not inserted yet).
 *
 * In other words we can insert children of a given view if this view was inserted into a container
 * and
 * the container itself has its render parent determined.
 * @param {?} viewTNode
 * @param {?} view
 * @return {?}
 */
function canInsertNativeChildOfView(viewTNode, view) {
    /** @type {?} */
    const container = /** @type {?} */ ((getLContainer(viewTNode, view)));
    if (container == null || container[RENDER_PARENT] == null) {
        // The `View` is not inserted into a `Container` or the parent `Container`
        // itself is disconnected. So we have to delay.
        return false;
    }
    // The parent `Container` is in inserted state, so we can eagerly insert into
    // this location.
    return true;
}
/**
 * Returns whether a native element can be inserted into the given parent.
 *
 * There are two reasons why we may not be able to insert a element immediately.
 * - Projection: When creating a child content element of a component, we have to skip the
 *   insertion because the content of a component will be projected.
 *   `<component><content>delayed due to projection</content></component>`
 * - Parent container is disconnected: This can happen when we are inserting a view into
 *   parent container, which itself is disconnected. For example the parent container is part
 *   of a View which has not be inserted or is mare for projection but has not been inserted
 *   into destination.
 *
 *
 * @param {?} tNode The tNode of the node that we want to insert.
 * @param {?} currentView Current LView being processed.
 * @return {?} boolean Whether the node should be inserted now (or delayed until later).
 */
export function canInsertNativeNode(tNode, currentView) {
    /** @type {?} */
    let currentNode = tNode;
    /** @type {?} */
    let parent = tNode.parent;
    if (tNode.parent) {
        if (tNode.parent.type === 4 /* ElementContainer */) {
            currentNode = getHighestElementContainer(tNode);
            parent = currentNode.parent;
        }
        else if (tNode.parent.type === 5 /* IcuContainer */) {
            currentNode = getFirstParentNative(currentNode);
            parent = currentNode.parent;
        }
    }
    if (parent === null)
        parent = currentView[HOST_NODE];
    if (parent && parent.type === 2 /* View */) {
        return canInsertNativeChildOfView(/** @type {?} */ (parent), currentView);
    }
    else {
        // Parent is a regular element or a component
        return canInsertNativeChildOfElement(currentNode);
    }
}
/**
 * Inserts a native node before another native node for a given parent using {\@link Renderer3}.
 * This is a utility function that can be used when native nodes were determined - it abstracts an
 * actual renderer being used.
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?} beforeNode
 * @return {?}
 */
export function nativeInsertBefore(renderer, parent, child, beforeNode) {
    if (isProceduralRenderer(renderer)) {
        renderer.insertBefore(parent, child, beforeNode);
    }
    else {
        parent.insertBefore(child, beforeNode, true);
    }
}
/**
 * Returns a native parent of a given native node.
 * @param {?} renderer
 * @param {?} node
 * @return {?}
 */
export function nativeParentNode(renderer, node) {
    return /** @type {?} */ ((isProceduralRenderer(renderer) ? renderer.parentNode(node) : node.parentNode));
}
/**
 * Returns a native sibling of a given native node.
 * @param {?} renderer
 * @param {?} node
 * @return {?}
 */
export function nativeNextSibling(renderer, node) {
    return isProceduralRenderer(renderer) ? renderer.nextSibling(node) : node.nextSibling;
}
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}.
 *
 * @param {?=} childEl The child that should be appended
 * @param {?=} childTNode The TNode of the child element
 * @param {?=} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(childEl = null, childTNode, currentView) {
    if (childEl !== null && canInsertNativeNode(childTNode, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        /** @type {?} */
        const parentEl = getParentNative(childTNode, currentView);
        /** @type {?} */
        const parentTNode = childTNode.parent || /** @type {?} */ ((currentView[HOST_NODE]));
        if (parentTNode.type === 2 /* View */) {
            /** @type {?} */
            const lContainer = /** @type {?} */ (getLContainer(/** @type {?} */ (parentTNode), currentView));
            /** @type {?} */
            const views = lContainer[VIEWS];
            /** @type {?} */
            const index = views.indexOf(currentView);
            nativeInsertBefore(renderer, /** @type {?} */ ((lContainer[RENDER_PARENT])), childEl, getBeforeNodeForView(index, views, lContainer[NATIVE]));
        }
        else if (parentTNode.type === 4 /* ElementContainer */) {
            /** @type {?} */
            const renderParent = /** @type {?} */ ((getRenderParent(childTNode, currentView)));
            nativeInsertBefore(renderer, renderParent, childEl, parentEl);
        }
        else if (parentTNode.type === 5 /* IcuContainer */) {
            /** @type {?} */
            const icuAnchorNode = /** @type {?} */ (((getNativeByTNode(/** @type {?} */ ((childTNode.parent)), currentView))));
            nativeInsertBefore(renderer, /** @type {?} */ (parentEl), childEl, icuAnchorNode);
        }
        else {
            isProceduralRenderer(renderer) ? renderer.appendChild(/** @type {?} */ (((parentEl))), childEl) : /** @type {?} */ ((parentEl)).appendChild(childEl);
        }
        return true;
    }
    return false;
}
/**
 * Gets the top-level ng-container if ng-containers are nested.
 *
 * @param {?} ngContainer The TNode of the starting ng-container
 * @return {?} tNode The TNode of the highest level ng-container
 */
function getHighestElementContainer(ngContainer) {
    while (ngContainer.parent != null && ngContainer.parent.type === 4 /* ElementContainer */) {
        ngContainer = ngContainer.parent;
    }
    return ngContainer;
}
/**
 * @param {?} index
 * @param {?} views
 * @param {?} containerNative
 * @return {?}
 */
export function getBeforeNodeForView(index, views, containerNative) {
    if (index + 1 < views.length) {
        /** @type {?} */
        const view = /** @type {?} */ (views[index + 1]);
        /** @type {?} */
        const viewTNode = /** @type {?} */ (view[HOST_NODE]);
        return viewTNode.child ? getNativeByTNode(viewTNode.child, view) : containerNative;
    }
    else {
        return containerNative;
    }
}
/**
 * Removes the `child` element from the DOM if not in view and not projected.
 *
 * @param {?} childTNode The TNode of the child to remove
 * @param {?} childEl The child that should be removed
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was removed
 */
export function removeChild(childTNode, childEl, currentView) {
    // We only remove the element if not in View or not projected.
    if (childEl !== null && canInsertNativeNode(childTNode, currentView)) {
        /** @type {?} */
        const parentNative = /** @type {?} */ (((getParentNative(childTNode, currentView))));
        /** @type {?} */
        const renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.removeChild(/** @type {?} */ (parentNative), childEl) : /** @type {?} */ ((parentNative)).removeChild(childEl);
        return true;
    }
    return false;
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param {?} projectedTNode The TNode to be projected
 * @param {?} tProjectionNode The projection (ng-content) TNode
 * @param {?} currentView Current LView
 * @param {?} projectionView Projection view (view above current)
 * @return {?}
 */
export function appendProjectedNode(projectedTNode, tProjectionNode, currentView, projectionView) {
    /** @type {?} */
    const native = getNativeByTNode(projectedTNode, projectionView);
    appendChild(native, tProjectionNode, currentView);
    // the projected contents are processed while in the shadow view (which is the currentView)
    // therefore we need to extract the view where the host element lives since it's the
    // logical container of the content projected views
    attachPatchData(native, projectionView);
    /** @type {?} */
    const renderParent = getRenderParent(tProjectionNode, currentView);
    /** @type {?} */
    const nodeOrContainer = projectionView[projectedTNode.index];
    if (projectedTNode.type === 0 /* Container */) {
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        nodeOrContainer[RENDER_PARENT] = renderParent;
        /** @type {?} */
        const views = nodeOrContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(views[i], true, nodeOrContainer[NATIVE]);
        }
    }
    else {
        if (projectedTNode.type === 4 /* ElementContainer */) {
            /** @type {?} */
            let ngContainerChildTNode = /** @type {?} */ (projectedTNode.child);
            while (ngContainerChildTNode) {
                appendProjectedNode(ngContainerChildTNode, tProjectionNode, currentView, projectionView);
                ngContainerChildTNode = ngContainerChildTNode.next;
            }
        }
        if (isLContainer(nodeOrContainer)) {
            nodeOrContainer[RENDER_PARENT] = renderParent;
            appendChild(nodeOrContainer[NATIVE], tProjectionNode, currentView);
        }
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsTUFBTSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUgsT0FBTyxFQUErRiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6SyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMvTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7QUFFL0YsTUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7O0FBR2hGLE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBWSxFQUFFLFdBQXNCO0lBQ2xFLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7UUFDeEIsT0FBTyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDbkM7U0FBTTs7UUFDTCxNQUFNLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxPQUFPLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNuRDtDQUNGOzs7Ozs7QUFLRCxTQUFTLG9CQUFvQixDQUFDLEtBQVk7O0lBQ3hDLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDMUIsT0FBTyxNQUFNLElBQUksTUFBTSxDQUFDLElBQUkseUJBQTJCLEVBQUU7UUFDdkQsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7S0FDeEI7SUFDRCwwQkFBTyxNQUFNLEdBQUc7Q0FDakI7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsYUFBYSxDQUFDLFdBQXNCOztJQUNsRCxNQUFNLFNBQVMscUJBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBaUIsRUFBQztJQUN6RCxPQUFPLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxpQkFBbUIsQ0FBQyxDQUFDO1FBQ25ELG1CQUFDLGdCQUFnQixDQUFDLFNBQVMscUJBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFlLEVBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQztDQUNWOzs7Ozs7QUFFRCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQWdCLEVBQUUsWUFBdUI7SUFDckUsSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFOztRQUd0QixNQUFNLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6RCxPQUFPLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDcEY7U0FBTTs7UUFFTCwyQkFBTyxZQUFZLENBQUMsTUFBTSxDQUFDLHNCQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxHQUFnQjtLQUNuRTtDQUNGOzs7Ozs7OztBQU9ELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxTQUFvQixFQUFFLElBQWU7O0lBQzVFLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakQsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0NBQ3BEOzs7O0lBSUMsU0FBVTs7SUFHVixTQUFVOztJQUdWLFVBQVc7Ozs7Ozs7OztBQVdiLE1BQU0sbUJBQW1CLEdBQTBCLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFjdEQsU0FBUyxhQUFhLENBQ2xCLFVBQXFCLEVBQUUsTUFBMkIsRUFBRSxRQUFtQixFQUN2RSxZQUE2QixFQUFFLFVBQXlCOztJQUMxRCxNQUFNLFNBQVMscUJBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQWlCLEVBQUM7O0lBQ3RELElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0lBQzdCLElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQzs7SUFDN0IsSUFBSSxLQUFLLHFCQUFlLFNBQVMsQ0FBQyxLQUFjLEVBQUM7SUFDakQsT0FBTyxLQUFLLEVBQUU7O1FBQ1osSUFBSSxTQUFTLEdBQWUsSUFBSSxDQUFDO1FBQ2pDLElBQUksS0FBSyxDQUFDLElBQUksb0JBQXNCLEVBQUU7WUFDcEMsaUJBQWlCLENBQ2IsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDOztZQUN0RixNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pELElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFOztnQkFFakMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ3hGO1NBQ0Y7YUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixFQUFFOztZQUM3QyxNQUFNLFVBQVUsdUJBQUcsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQWdCO1lBQzVELGlCQUFpQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVsRixJQUFJLFlBQVk7Z0JBQUUsVUFBVSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztZQUUzRCxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUU7Z0JBQzVCLFdBQVcsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLFNBQVMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDOzs7Z0JBSXBDLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakM7U0FDRjthQUFNLElBQUksS0FBSyxDQUFDLElBQUksdUJBQXlCLEVBQUU7O1lBQzlDLE1BQU0sYUFBYSxHQUFHLGlCQUFpQixvQkFBQyxXQUFXLEdBQUcsQ0FBQzs7WUFDdkQsTUFBTSxhQUFhLHFCQUFHLGFBQWEsQ0FBQyxTQUFTLENBQWlCLEVBQUM7O1lBQy9ELE1BQU0sSUFBSSxHQUNOLG1CQUFDLGFBQWEsQ0FBQyxVQUE2QixFQUFDLG1CQUFDLEtBQUssQ0FBQyxVQUFvQixFQUFDLENBQUM7OztZQUk5RSxtQkFBbUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ25ELG1CQUFtQixDQUFDLEVBQUUsbUJBQW1CLENBQUMsc0JBQUcsV0FBVyxFQUFFLENBQUM7WUFDM0QsSUFBSSxJQUFJLEVBQUU7Z0JBQ1IsV0FBVyxzQkFBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsU0FBUyxxQkFBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQVUsQ0FBQSxDQUFDO2FBQzFEO1NBQ0Y7YUFBTTs7WUFFTCxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUN6QjtRQUVELElBQUksU0FBUyxLQUFLLElBQUksRUFBRTs7WUFFdEIsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLHlCQUF5QixDQUFDLEVBQUU7Z0JBQ2pFLFdBQVcscUJBQUcsbUJBQW1CLENBQUMsbUJBQW1CLEVBQUUsQ0FBYyxDQUFBLENBQUM7Z0JBQ3RFLEtBQUsscUJBQUcsbUJBQW1CLENBQUMsbUJBQW1CLEVBQUUsQ0FBVSxDQUFBLENBQUM7YUFDN0Q7WUFDRCxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQzs7Ozs7Ozs7WUFTdkIsT0FBTyxDQUFDLFNBQVMsRUFBRTs7Z0JBRWpCLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBRWhELElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUztvQkFBRSxPQUFPLElBQUksQ0FBQzs7Z0JBR3ZELElBQUksS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7b0JBQ3RDLFdBQVcsc0JBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3BDLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUMvQztnQkFFRCxJQUFJLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdEQsV0FBVyxxQkFBRyxXQUFXLENBQUMsSUFBSSxDQUFjLENBQUEsQ0FBQztvQkFDN0MsU0FBUyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7aUJBQ3JDO3FCQUFNO29CQUNMLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2lCQUN4QjthQUNGO1NBQ0Y7UUFDRCxLQUFLLEdBQUcsU0FBUyxDQUFDO0tBQ25CO0NBQ0Y7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsU0FBb0I7O0lBQ3BELElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVyQyxPQUFPLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxpQkFBbUIsRUFBRTtRQUNyRCxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2pFLFNBQVMsc0JBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDaEMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNsQztJQUVELE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7OztBQU1ELFNBQVMsaUJBQWlCLENBQ3RCLE1BQTJCLEVBQUUsUUFBbUIsRUFBRSxNQUF1QixFQUN6RSxJQUFpQyxFQUFFLFVBQXlCO0lBQzlELElBQUksTUFBTSxtQkFBK0IsRUFBRTtRQUN6QyxvQkFBb0Isb0JBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUM5QixtQkFBQyxRQUErQixFQUFDLENBQUMsWUFBWSxvQkFBQyxNQUFNLElBQUksSUFBSSxvQkFBRSxVQUEwQixFQUFDLENBQUMsQ0FBQyxvQkFDNUYsTUFBTSxHQUFHLFlBQVksQ0FBQyxJQUFJLG9CQUFFLFVBQTBCLEdBQUUsSUFBSSxDQUFDLENBQUM7S0FDbkU7U0FBTSxJQUFJLE1BQU0sbUJBQStCLEVBQUU7UUFDaEQsb0JBQW9CLG9CQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDOUIsbUJBQUMsUUFBK0IsRUFBQyxDQUFDLFdBQVcsb0JBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQy9ELE1BQU0sR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDaEM7U0FBTSxJQUFJLE1BQU0sb0JBQWdDLEVBQUU7UUFDakQsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1VBQzdDLG1CQUFDLFFBQStCLEVBQUMsQ0FBQyxXQUFXLEdBQUcsSUFBSTtLQUNyRDtDQUNGOzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVUsRUFBRSxRQUFtQjtJQUM1RCxPQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUNuRjs7Ozs7OztBQWdCRCxNQUFNLFVBQVUsMEJBQTBCLENBQ3RDLFVBQXFCLEVBQUUsVUFBbUIsRUFBRSxVQUF5Qjs7SUFDdkUsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLG1CQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFpQixHQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQy9GLFNBQVMsSUFBSSxjQUFjLG1CQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFhLGdCQUFpQixDQUFDO0lBQzdFLElBQUksWUFBWSxFQUFFOztRQUNoQixNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsYUFBYSxDQUNULFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxnQkFBNEIsQ0FBQyxlQUEyQixFQUFFLFFBQVEsRUFDMUYsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQy9CO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sVUFBVSxlQUFlLENBQUMsUUFBbUI7O0lBRWpELElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNyQyxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM5Qjs7SUFDRCxJQUFJLGVBQWUsR0FBOEIsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXpFLE9BQU8sZUFBZSxFQUFFOztRQUN0QixJQUFJLElBQUksR0FBOEIsSUFBSSxDQUFDO1FBRTNDLElBQUksZUFBZSxDQUFDLE1BQU0sSUFBSSxhQUFhLEVBQUU7O1lBRTNDLE1BQU0sSUFBSSxxQkFBRyxlQUE0QixFQUFDO1lBQzFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQUUsSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3RDthQUFNOztZQUVMLE1BQU0sU0FBUyxxQkFBRyxlQUE2QixFQUFDO1lBQ2hELElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU07Z0JBQUUsSUFBSSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6RDtRQUVELElBQUksSUFBSSxJQUFJLElBQUksRUFBRTs7O1lBR2hCLE9BQU8sZUFBZSxJQUFJLG9CQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsSUFBSSxlQUFlLEtBQUssUUFBUSxFQUFFO2dCQUNsRixXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzdCLGVBQWUsR0FBRyxjQUFjLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzdEO1lBQ0QsV0FBVyxDQUFDLGVBQWUsSUFBSSxRQUFRLENBQUMsQ0FBQztZQUN6QyxJQUFJLEdBQUcsZUFBZSx1QkFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDbkQ7UUFDRCxlQUFlLEdBQUcsSUFBSSxDQUFDO0tBQ3hCO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsS0FBZ0IsRUFBRSxVQUFzQixFQUFFLFVBQXFCLEVBQUUsS0FBYSxFQUM5RSxjQUFzQjs7SUFDeEIsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWhDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTs7UUFFYixLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUNoQztJQUVELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7UUFDeEIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDL0I7U0FBTTtRQUNMLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNwQjs7O0lBSUQsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLEVBQUU7UUFDdkIsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLGNBQWMsQ0FBQztRQUN4QyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDO0tBQzVCOztJQUdELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFOzJCQUNsQixLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsVUFBVSxDQUFDLEtBQUs7S0FDbEM7O0lBR0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxvQkFBdUIsQ0FBQztDQUNyQzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxVQUFzQixFQUFFLFdBQW1CLEVBQUUsUUFBaUI7O0lBQ3ZGLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7SUFDaEMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3hDLElBQUksV0FBVyxHQUFHLENBQUMsRUFBRTtRQUNuQixLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBRyxZQUFZLENBQUMsSUFBSSxDQUFjLENBQUEsQ0FBQztLQUNoRTtJQUNELEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdCLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYiwwQkFBMEIsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDakQ7SUFFRCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRTsyQkFDekIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFVBQVU7S0FDbkM7SUFDRCxZQUFZLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbkMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQzs7SUFFNUIsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFvQixDQUFDO0NBQzdDOzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsVUFBVSxDQUN0QixVQUFzQixFQUFFLGFBQW9FLEVBQzVGLFdBQW1COztJQUNyQixNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDNUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5RCxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDcEI7Ozs7OztBQUdELE1BQU0sVUFBVSxhQUFhLENBQUMsUUFBbUI7O0lBQy9DLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUM7SUFDOUMsT0FBTyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0NBQ3hEOzs7Ozs7OztBQVFELE1BQU0sVUFBVSxZQUFZLENBQUMsSUFBZTs7SUFDMUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRTtRQUMxRCxhQUFhLENBQUMsSUFBSSxtQkFBK0IsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ2xFO0lBQ0QsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDOztJQUV0QixJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUF3QixDQUFDO0NBQ3JDOzs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUE2QixFQUFFLFFBQW1COztJQUUvRSxJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxhQUFhLElBQUksQ0FBQyxLQUFLLHNCQUFHLG1CQUFDLEtBQWtCLEVBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUM1RSxLQUFLLENBQUMsSUFBSSxpQkFBbUIsRUFBRTs7O1FBR2pDLHlCQUFPLGFBQWEsbUJBQUMsS0FBa0IscUJBQUUsS0FBa0IsRUFBZSxFQUFDO0tBQzVFO1NBQU07O1FBRUwsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMxRDtDQUNGOzs7Ozs7O0FBT0QsU0FBUyxXQUFXLENBQUMsZUFBdUM7SUFDMUQsSUFBSSxtQkFBQyxlQUE0QixFQUFDLENBQUMsTUFBTSxJQUFJLGFBQWEsRUFBRTs7UUFDMUQsTUFBTSxJQUFJLHFCQUFHLGVBQTRCLEVBQUM7UUFDMUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDOztRQUU1QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDakUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QyxtQkFBQyxJQUFJLENBQUMsUUFBUSxDQUF3QixFQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbkQ7S0FDRjtDQUNGOzs7Ozs7QUFHRCxTQUFTLGVBQWUsQ0FBQyxRQUFtQjs7SUFDMUMsTUFBTSxPQUFPLHNCQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEdBQUc7SUFDMUMsSUFBSSxPQUFPLElBQUksSUFBSSxFQUFFO1FBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzlDLElBQUksT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFOztnQkFFbEMsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztnQkFDMUQsTUFBTSxRQUFRLHNCQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUNyRCxNQUFNLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUjtpQkFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTs7Z0JBRXpDLE1BQU0sU0FBUyxzQkFBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNsRCxTQUFTLEVBQUUsQ0FBQzthQUNiO2lCQUFNOztnQkFFTCxNQUFNLE9BQU8sc0JBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDMUI7U0FDRjtRQUNELFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDMUI7Q0FDRjs7Ozs7O0FBR0QsU0FBUyxpQkFBaUIsQ0FBQyxJQUFlOztJQUN4QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O0lBQzFCLElBQUksWUFBWSxDQUFnQjtJQUNoQyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksRUFBRTtRQUNoRSxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQy9CO0NBQ0Y7Ozs7OztBQUdELFNBQVMscUJBQXFCLENBQUMsUUFBbUI7O0lBQ2hELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztJQUM3RSxJQUFJLGdCQUFnQixFQUFFO1FBQ3BCLFNBQVMsb0JBQUMsUUFBUSxJQUFJLGdCQUFnQixDQUFDLENBQUM7S0FDekM7Q0FDRjs7Ozs7O0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFZLEVBQUUsV0FBc0I7SUFDbEUsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEVBQUU7Ozs7UUFJM0MsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7U0FDdEY7O1FBRUQsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztRQUV6QyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ2pDLElBQUksV0FBVyxJQUFJLElBQUksSUFBSSxXQUFXLENBQUMsSUFBSSw2QkFBK0IsRUFBRTtZQUMxRSxLQUFLLEdBQUcsMEJBQTBCLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDakQ7UUFFRCxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSx1QkFBSSxTQUFTLEdBQUcsSUFBSSxpQkFBbUIsQ0FBQyxDQUFDO1lBQ2hFLHdCQUF3QixtQkFBQyxTQUFzQixHQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsbUJBQy9ELGVBQWUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFhLENBQUEsQ0FBQztLQUNyRDtJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7O0FBRUQsU0FBUyw2QkFBNkIsQ0FBQyxLQUFZOzs7O0lBSWpELElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJOzs7UUFHcEIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLG9CQUFzQixJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUsseUJBQXlCLENBQUMsRUFBRTtRQUM3RixPQUFPLElBQUksQ0FBQztLQUNiOzs7O0lBS0QsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7Ozs7Ozs7Ozs7O0FBYUQsU0FBUywwQkFBMEIsQ0FBQyxTQUFvQixFQUFFLElBQWU7O0lBRXZFLE1BQU0sU0FBUyxzQkFBRyxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHO0lBQ25ELElBQUksU0FBUyxJQUFJLElBQUksSUFBSSxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxFQUFFOzs7UUFHekQsT0FBTyxLQUFLLENBQUM7S0FDZDs7O0lBSUQsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsV0FBc0I7O0lBQ3RFLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQzs7SUFDeEIsSUFBSSxNQUFNLEdBQWUsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUV0QyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7UUFDaEIsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksNkJBQStCLEVBQUU7WUFDcEQsV0FBVyxHQUFHLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1NBQzdCO2FBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUkseUJBQTJCLEVBQUU7WUFDdkQsV0FBVyxHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1NBQzdCO0tBQ0Y7SUFDRCxJQUFJLE1BQU0sS0FBSyxJQUFJO1FBQUUsTUFBTSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVyRCxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxpQkFBbUIsRUFBRTtRQUM1QyxPQUFPLDBCQUEwQixtQkFBQyxNQUFtQixHQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3JFO1NBQU07O1FBRUwsT0FBTyw2QkFBNkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNuRDtDQUNGOzs7Ozs7Ozs7OztBQU9ELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsUUFBbUIsRUFBRSxNQUFnQixFQUFFLEtBQVksRUFBRSxVQUF3QjtJQUMvRSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztLQUNsRDtTQUFNO1FBQ0wsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzlDO0NBQ0Y7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsUUFBbUIsRUFBRSxJQUFXO0lBQy9ELHlCQUFPLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQWEsRUFBQztDQUNuRzs7Ozs7OztBQUtELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxRQUFtQixFQUFFLElBQVc7SUFDaEUsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztDQUN2Rjs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixVQUF3QixJQUFJLEVBQUUsVUFBaUIsRUFBRSxXQUFzQjtJQUN6RSxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksbUJBQW1CLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxFQUFFOztRQUNwRSxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7O1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7O1FBQzFELE1BQU0sV0FBVyxHQUFVLFVBQVUsQ0FBQyxNQUFNLHVCQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBRXpFLElBQUksV0FBVyxDQUFDLElBQUksaUJBQW1CLEVBQUU7O1lBQ3ZDLE1BQU0sVUFBVSxxQkFBRyxhQUFhLG1CQUFDLFdBQXdCLEdBQUUsV0FBVyxDQUFlLEVBQUM7O1lBQ3RGLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7WUFDaEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6QyxrQkFBa0IsQ0FDZCxRQUFRLHFCQUFFLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxPQUFPLEVBQzlDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM3RDthQUFNLElBQUksV0FBVyxDQUFDLElBQUksNkJBQStCLEVBQUU7O1lBQzFELE1BQU0sWUFBWSxzQkFBRyxlQUFlLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxHQUFHO1lBQ2hFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQy9EO2FBQU0sSUFBSSxXQUFXLENBQUMsSUFBSSx5QkFBMkIsRUFBRTs7WUFDdEQsTUFBTSxhQUFhLHVCQUFHLGdCQUFnQixvQkFBQyxVQUFVLENBQUMsTUFBTSxJQUFJLFdBQVcsQ0FBQyxJQUFjO1lBQ3RGLGtCQUFrQixDQUFDLFFBQVEsb0JBQUUsUUFBb0IsR0FBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDNUU7YUFBTTtZQUNMLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxxQkFBQyxRQUFRLEtBQWUsT0FBTyxDQUFDLENBQUMsQ0FBQyxvQkFDdEQsUUFBUSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNsRTtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztDQUNkOzs7Ozs7O0FBUUQsU0FBUywwQkFBMEIsQ0FBQyxXQUFrQjtJQUNwRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLElBQUksSUFBSSxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSw2QkFBK0IsRUFBRTtRQUMzRixXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztLQUNsQztJQUNELE9BQU8sV0FBVyxDQUFDO0NBQ3BCOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEtBQWEsRUFBRSxLQUFrQixFQUFFLGVBQXlCO0lBQy9GLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFOztRQUM1QixNQUFNLElBQUkscUJBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQWMsRUFBQzs7UUFDM0MsTUFBTSxTQUFTLHFCQUFHLElBQUksQ0FBQyxTQUFTLENBQWMsRUFBQztRQUMvQyxPQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztLQUNwRjtTQUFNO1FBQ0wsT0FBTyxlQUFlLENBQUM7S0FDeEI7Q0FDRjs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsVUFBaUIsRUFBRSxPQUFxQixFQUFFLFdBQXNCOztJQUVsRSxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksbUJBQW1CLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxFQUFFOztRQUNwRSxNQUFNLFlBQVksdUJBQUcsZUFBZSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsSUFBYzs7UUFDM0UsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxtQkFBQyxZQUF3QixHQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsb0JBQ3pELFlBQVksR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckUsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixjQUFxQixFQUFFLGVBQXNCLEVBQUUsV0FBc0IsRUFDckUsY0FBeUI7O0lBQzNCLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNoRSxXQUFXLENBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQzs7OztJQUtsRCxlQUFlLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDOztJQUV4QyxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDOztJQUVuRSxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdELElBQUksY0FBYyxDQUFDLElBQUksc0JBQXdCLEVBQUU7Ozs7OztRQU0vQyxlQUFlLENBQUMsYUFBYSxDQUFDLEdBQUcsWUFBWSxDQUFDOztRQUM5QyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUNyRTtLQUNGO1NBQU07UUFDTCxJQUFJLGNBQWMsQ0FBQyxJQUFJLDZCQUErQixFQUFFOztZQUN0RCxJQUFJLHFCQUFxQixxQkFBZSxjQUFjLENBQUMsS0FBYyxFQUFDO1lBQ3RFLE9BQU8scUJBQXFCLEVBQUU7Z0JBQzVCLG1CQUFtQixDQUFDLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBQ3pGLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQzthQUNwRDtTQUNGO1FBRUQsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDakMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztZQUM5QyxXQUFXLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUNwRTtLQUNGO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtjYWxsSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkUsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUVmlld05vZGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q0xFQU5VUCwgQ09OVEFJTkVSX0lOREVYLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBIb29rRGF0YSwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGlzTENvbnRhaW5lciwgaXNSb290VmlldywgcmVhZEVsZW1lbnRWYWx1ZSwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKiogUmV0cmlldmVzIHRoZSBwYXJlbnQgZWxlbWVudCBvZiBhIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TmF0aXZlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IFJFbGVtZW50fFJDb21tZW50fG51bGwge1xuICBpZiAodE5vZGUucGFyZW50ID09IG51bGwpIHtcbiAgICByZXR1cm4gZ2V0SG9zdE5hdGl2ZShjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGFyZW50VE5vZGUgPSBnZXRGaXJzdFBhcmVudE5hdGl2ZSh0Tm9kZSk7XG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmlyc3QgcGFyZW50IG9mIGEgbm9kZSB0aGF0IGlzbid0IGFuIEljdUNvbnRhaW5lciBUTm9kZVxuICovXG5mdW5jdGlvbiBnZXRGaXJzdFBhcmVudE5hdGl2ZSh0Tm9kZTogVE5vZGUpOiBUTm9kZSB7XG4gIGxldCBwYXJlbnQgPSB0Tm9kZS5wYXJlbnQ7XG4gIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICB9XG4gIHJldHVybiBwYXJlbnQgITtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBob3N0IGVsZW1lbnQgZ2l2ZW4gYSB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBjdXJyZW50IHZpZXcgaXMgYW4gZW1iZWRkZWQgdmlldyxcbiAqIHdoaWNoIGRvZXMgbm90IGhhdmUgYSBob3N0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0TmF0aXZlKGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gIHJldHVybiBob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5WaWV3ID9cbiAgICAgIChnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgY3VycmVudFZpZXdbUEFSRU5UXSAhKSBhcyBSRWxlbWVudCkgOlxuICAgICAgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExDb250YWluZXIodE5vZGU6IFRWaWV3Tm9kZSwgZW1iZWRkZWRWaWV3OiBMVmlld0RhdGEpOiBMQ29udGFpbmVyfG51bGwge1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBJZiB0aGUgaG9zdCBpbmRleCBpcyAtMSwgdGhlIHZpZXcgaGFzIG5vdCB5ZXQgYmVlbiBpbnNlcnRlZCwgc28gaXQgaGFzIG5vIHBhcmVudC5cbiAgICBjb25zdCBjb250YWluZXJIb3N0SW5kZXggPSBlbWJlZGRlZFZpZXdbQ09OVEFJTkVSX0lOREVYXTtcbiAgICByZXR1cm4gY29udGFpbmVySG9zdEluZGV4ID4gLTEgPyBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW2NvbnRhaW5lckhvc3RJbmRleF0gOiBudWxsO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYSBpbmxpbmUgdmlldyBub2RlIChlLmcuIGVtYmVkZGVkVmlld1N0YXJ0KVxuICAgIHJldHVybiBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW3ROb2RlLnBhcmVudCAhLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBmb3IgYSBnaXZlbiB2aWV3LlxuICogTWlnaHQgYmUgbnVsbCBpZiBhIHZpZXcgaXMgbm90IHlldCBhdHRhY2hlZCB0byBhbnkgY29udGFpbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHRWaWV3Tm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlld0RhdGEpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0TENvbnRhaW5lcih0Vmlld05vZGUsIHZpZXcpO1xuICByZXR1cm4gY29udGFpbmVyID8gY29udGFpbmVyW1JFTkRFUl9QQVJFTlRdIDogbnVsbDtcbn1cblxuY29uc3QgZW51bSBXYWxrVE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgaW5zZXJ0IGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgSW5zZXJ0ID0gMCxcblxuICAvKiogbm9kZSBkZXRhY2ggZnJvbSB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIERldGFjaCA9IDEsXG5cbiAgLyoqIG5vZGUgZGVzdHJ1Y3Rpb24gdXNpbmcgdGhlIHJlbmRlcmVyJ3MgQVBJICovXG4gIERlc3Ryb3kgPSAyLFxufVxuXG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gd2Fsa1ROb2RlVHJlZS5cbiAqXG4gKiBUaGlzIGlzIGRlbGliZXJhdGVseSBjcmVhdGVkIG91dHNpZGUgb2Ygd2Fsa1ROb2RlVHJlZSB0byBhdm9pZCBhbGxvY2F0aW5nXG4gKiBhIG5ldyBhcnJheSBlYWNoIHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gSW5zdGVhZCB0aGUgYXJyYXkgd2lsbCBiZVxuICogcmUtdXNlZCBieSBlYWNoIGludm9jYXRpb24uIFRoaXMgd29ya3MgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgbm90IHJlZW50cmFudC5cbiAqL1xuY29uc3QgcHJvamVjdGlvbk5vZGVTdGFjazogKExWaWV3RGF0YSB8IFROb2RlKVtdID0gW107XG5cbi8qKlxuICogV2Fsa3MgYSB0cmVlIG9mIFROb2RlcywgYXBwbHlpbmcgYSB0cmFuc2Zvcm1hdGlvbiBvbiB0aGUgZWxlbWVudCBub2RlcywgZWl0aGVyIG9ubHkgb24gdGhlIGZpcnN0XG4gKiBvbmUgZm91bmQsIG9yIG9uIGFsbCBvZiB0aGVtLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIHRoZSB2aWV3IHRvIHdhbGtcbiAqIEBwYXJhbSBhY3Rpb24gaWRlbnRpZmllcyB0aGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgZWxlbWVudHNcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgT3B0aW9uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJzIGZvdW5kLFxuICogcmVxdWlyZWQgZm9yIGFjdGlvbiBtb2RlcyBJbnNlcnQgYW5kIERlc3Ryb3kuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBPcHRpb25hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBJbnNlcnQuXG4gKi9cbmZ1bmN0aW9uIHdhbGtUTm9kZVRyZWUoXG4gICAgdmlld1RvV2FsazogTFZpZXdEYXRhLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gdmlld1RvV2Fsa1tUVklFV10ubm9kZSBhcyBUVmlld05vZGU7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG4gIGxldCBjdXJyZW50VmlldyA9IHZpZXdUb1dhbGs7XG4gIGxldCB0Tm9kZTogVE5vZGV8bnVsbCA9IHJvb3RUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgbGV0IG5leHRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihcbiAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSwgYmVmb3JlTm9kZSk7XG4gICAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF07XG4gICAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgICAgLy8gVGhpcyBlbGVtZW50IGhhcyBhbiBMQ29udGFpbmVyLCBhbmQgaXRzIGNvbW1lbnQgbmVlZHMgdG8gYmUgaGFuZGxlZFxuICAgICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBjdXJyZW50VmlldyAhW3ROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBsQ29udGFpbmVyW05BVElWRV0sIGJlZm9yZU5vZGUpO1xuXG4gICAgICBpZiAocmVuZGVyUGFyZW50KSBsQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuXG4gICAgICBpZiAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gbENvbnRhaW5lcltWSUVXU11bMF07XG4gICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHdhbGtlciBlbnRlcnMgYSBjb250YWluZXIsIHRoZW4gdGhlIGJlZm9yZU5vZGUgaGFzIHRvIGJlY29tZSB0aGUgbG9jYWwgbmF0aXZlXG4gICAgICAgIC8vIGNvbW1lbnQgbm9kZS5cbiAgICAgICAgYmVmb3JlTm9kZSA9IGxDb250YWluZXJbTkFUSVZFXTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoY3VycmVudFZpZXcgISk7XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE11c3Qgc3RvcmUgYm90aCB0aGUgVE5vZGUgYW5kIHRoZSB2aWV3IGJlY2F1c2UgdGhpcyBwcm9qZWN0aW9uIG5vZGUgY291bGQgYmUgbmVzdGVkXG4gICAgICAvLyBkZWVwbHkgaW5zaWRlIGVtYmVkZGVkIHZpZXdzLCBhbmQgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIHRoaXMgcGFydGljdWxhciBuZXN0ZWQgdmlldy5cbiAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHROb2RlO1xuICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gY3VycmVudFZpZXcgITtcbiAgICAgIGlmIChoZWFkKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgYSBWaWV3IG9yIGFuIEVsZW1lbnRDb250YWluZXJcbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLmNoaWxkO1xuICAgIH1cblxuICAgIGlmIChuZXh0VE5vZGUgPT09IG51bGwpIHtcbiAgICAgIC8vIHRoaXMgbGFzdCBub2RlIHdhcyBwcm9qZWN0ZWQsIHdlIG5lZWQgdG8gZ2V0IGJhY2sgZG93biB0byBpdHMgcHJvamVjdGlvbiBub2RlXG4gICAgICBpZiAodE5vZGUubmV4dCA9PT0gbnVsbCAmJiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSkge1xuICAgICAgICBjdXJyZW50VmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlld0RhdGE7XG4gICAgICAgIHROb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIFROb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICAgICAgICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gICAgICAgKlxuICAgICAgICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGVuIGl0IGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAgICAgICAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICAgICAgICovXG4gICAgICB3aGlsZSAoIW5leHRUTm9kZSkge1xuICAgICAgICAvLyBJZiBwYXJlbnQgaXMgbnVsbCwgd2UncmUgY3Jvc3NpbmcgdGhlIHZpZXcgYm91bmRhcnksIHNvIHdlIHNob3VsZCBnZXQgdGhlIGhvc3QgVE5vZGUuXG4gICAgICAgIHROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIGlmICh0Tm9kZSA9PT0gbnVsbCB8fCB0Tm9kZSA9PT0gcm9vdFROb2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyBXaGVuIGV4aXRpbmcgYSBjb250YWluZXIsIHRoZSBiZWZvcmVOb2RlIG11c3QgYmUgcmVzdG9yZWQgdG8gdGhlIHByZXZpb3VzIHZhbHVlXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgICAgYmVmb3JlTm9kZSA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XVtOQVRJVkVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ICYmIGN1cnJlbnRWaWV3W05FWFRdKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tORVhUXSBhcyBMVmlld0RhdGE7XG4gICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IG5leHRUTm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIEdpdmVuIGEgY3VycmVudCB2aWV3LCBmaW5kcyB0aGUgbmVhcmVzdCBjb21wb25lbnQncyBob3N0IChMRWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBMVmlld0RhdGEgZm9yIHdoaWNoIHdlIHdhbnQgYSBob3N0IGVsZW1lbnQgbm9kZVxuICogQHJldHVybnMgVGhlIGhvc3Qgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICBsZXQgcm9vdFROb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG5cbiAgd2hpbGUgKHJvb3RUTm9kZSAmJiByb290VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld0RhdGFbUEFSRU5UXSwgJ3ZpZXdEYXRhLnBhcmVudCcpO1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gICAgcm9vdFROb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIH1cblxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBub2RlOiBSQ29tbWVudCB8IFJFbGVtZW50IHwgUlRleHQsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlciAhKSA/XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5pbnNlcnRCZWZvcmUocGFyZW50ICEsIG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgIHBhcmVudCAhLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZUNoaWxkKHBhcmVudCAhLCBub2RlKSA6XG4gICAgICAgIHBhcmVudCAhLnJlbW92ZUNoaWxkKG5vZGUpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogdHJ1ZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICB2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBpZiAocm9vdFZpZXdbVFZJRVddLmNoaWxkSW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuICBsZXQgdmlld09yQ29udGFpbmVyOiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsID0gZ2V0TFZpZXdDaGlsZChyb290Vmlldyk7XG5cbiAgd2hpbGUgKHZpZXdPckNvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmICh2aWV3T3JDb250YWluZXIubGVuZ3RoID49IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIElmIExWaWV3RGF0YSwgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhO1xuICAgICAgaWYgKHZpZXdbVFZJRVddLmNoaWxkSW5kZXggPiAtMSkgbmV4dCA9IGdldExWaWV3Q2hpbGQodmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIGNvbnRhaW5lciwgdHJhdmVyc2UgZG93biB0byBpdHMgZmlyc3QgTFZpZXdEYXRhLlxuICAgICAgY29uc3QgY29udGFpbmVyID0gdmlld09yQ29udGFpbmVyIGFzIExDb250YWluZXI7XG4gICAgICBpZiAoY29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIG5leHQgPSBjb250YWluZXJbVklFV1NdWzBdO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIHBhcmVudFZpZXcgVGhlIG5ldyBwYXJlbnQgb2YgdGhlIGluc2VydGVkIHZpZXdcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3XG4gKiBAcGFyYW0gY29udGFpbmVySW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgbm9kZSwgaWYgZHluYW1pY1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhcbiAgICBsVmlldzogTFZpZXdEYXRhLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBwYXJlbnRWaWV3OiBMVmlld0RhdGEsIGluZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVySW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICAvLyBEeW5hbWljYWxseSBpbnNlcnRlZCB2aWV3cyBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIHBhcmVudCBjb250YWluZXIncyBob3N0IHNvIGl0J3NcbiAgLy8gcG9zc2libGUgdG8ganVtcCBmcm9tIGEgdmlldyB0byBpdHMgY29udGFpbmVyJ3MgbmV4dCB3aGVuIHdhbGtpbmcgdGhlIG5vZGUgdHJlZS5cbiAgaWYgKGNvbnRhaW5lckluZGV4ID4gLTEpIHtcbiAgICBsVmlld1tDT05UQUlORVJfSU5ERVhdID0gY29udGFpbmVySW5kZXg7XG4gICAgbFZpZXdbUEFSRU5UXSA9IHBhcmVudFZpZXc7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHBhcmFtIGRldGFjaGVkIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBhbHJlYWR5IGRldGFjaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCByZW1vdmVJbmRleDogbnVtYmVyLCBkZXRhY2hlZDogYm9vbGVhbikge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICB2aWV3c1tyZW1vdmVJbmRleCAtIDFdW05FWFRdID0gdmlld1RvRGV0YWNoW05FWFRdIGFzIExWaWV3RGF0YTtcbiAgfVxuICB2aWV3cy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICBpZiAoIWRldGFjaGVkKSB7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld1RvRGV0YWNoLCBmYWxzZSk7XG4gIH1cblxuICBpZiAodmlld1RvRGV0YWNoW1FVRVJJRVNdKSB7XG4gICAgdmlld1RvRGV0YWNoW1FVRVJJRVNdICEucmVtb3ZlVmlldygpO1xuICB9XG4gIHZpZXdUb0RldGFjaFtDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gIHZpZXdUb0RldGFjaFtQQVJFTlRdID0gbnVsbDtcbiAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIHZpZXdUb0RldGFjaFtGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lciwgaS5lLiBkZXRhY2hlcyBpdCBhbmQgdGhlbiBkZXN0cm95cyB0aGUgdW5kZXJseWluZyBMVmlldy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHRDb250YWluZXIgVGhlIFRDb250YWluZXIgbm9kZSBhc3NvY2lhdGVkIHdpdGggdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGNvbnRhaW5lckhvc3Q6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmlldyA9IGxDb250YWluZXJbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCwgISFjb250YWluZXJIb3N0LmRldGFjaGVkKTtcbiAgZGVzdHJveUxWaWV3KHZpZXcpO1xufVxuXG4vKiogR2V0cyB0aGUgY2hpbGQgb2YgdGhlIGdpdmVuIExWaWV3RGF0YSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3Q2hpbGQodmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwge1xuICBjb25zdCBjaGlsZEluZGV4ID0gdmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXg7XG4gIHJldHVybiBjaGlsZEluZGV4ID09PSAtMSA/IG51bGwgOiB2aWV3RGF0YVtjaGlsZEluZGV4XTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIHdhbGtUTm9kZVRyZWUodmlldywgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCByZW5kZXJlciwgbnVsbCk7XG4gIH1cbiAgZGVzdHJveVZpZXdUcmVlKHZpZXcpO1xuICAvLyBTZXRzIHRoZSBkZXN0cm95ZWQgZmxhZ1xuICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUoc3RhdGU6IExWaWV3RGF0YSB8IExDb250YWluZXIsIHJvb3RWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGF8XG4gICAgTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IHROb2RlO1xuICBpZiAoc3RhdGUubGVuZ3RoID49IEhFQURFUl9PRkZTRVQgJiYgKHROb2RlID0gKHN0YXRlIGFzIExWaWV3RGF0YSkgIVtIT1NUX05PREVdKSAmJlxuICAgICAgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldExDb250YWluZXIodE5vZGUgYXMgVFZpZXdOb2RlLCBzdGF0ZSBhcyBMVmlld0RhdGEpIGFzIExDb250YWluZXI7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlld0RhdGEgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YSkubGVuZ3RoID49IEhFQURFUl9PRkZTRVQpIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gICAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gICAgZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhcyBjbGVhbiB1cCB0aW1lLlxuICAgIGlmICh2aWV3W1RWSUVXXS5pZCA9PT0gLTEgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgY2xlYW51cCA9IHZpZXdEYXRhW1RWSUVXXS5jbGVhbnVwICE7XG4gIGlmIChjbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHRoZSBuYXRpdmUgcmVuZGVyZXJcbiAgICAgICAgY29uc3QgbmF0aXZlID0gcmVhZEVsZW1lbnRWYWx1ZSh2aWV3RGF0YVtjbGVhbnVwW2kgKyAxXV0pO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMl1dO1xuICAgICAgICBuYXRpdmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBsaXN0ZW5lciwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaV1dO1xuICAgICAgICBjbGVhbnVwRm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlld0RhdGFbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3ModmlldywgZGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKiogQ2FsbHMgcGlwZSBkZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHBpcGVEZXN0cm95SG9va3MgPSB2aWV3RGF0YVtUVklFV10gJiYgdmlld0RhdGFbVFZJRVddLnBpcGVEZXN0cm95SG9va3M7XG4gIGlmIChwaXBlRGVzdHJveUhvb2tzKSB7XG4gICAgY2FsbEhvb2tzKHZpZXdEYXRhICEsIHBpcGVEZXN0cm95SG9va3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogUkVsZW1lbnR8bnVsbCB7XG4gIGlmIChjYW5JbnNlcnROYXRpdmVOb2RlKHROb2RlLCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBJZiB3ZSBhcmUgYXNrZWQgZm9yIGEgcmVuZGVyIHBhcmVudCBvZiB0aGUgcm9vdCBjb21wb25lbnQgd2UgbmVlZCB0byBkbyBsb3ctbGV2ZWwgRE9NXG4gICAgLy8gb3BlcmF0aW9uIGFzIExUcmVlIGRvZXNuJ3QgZXhpc3QgYWJvdmUgdGhlIHRvcG1vc3QgaG9zdCBub2RlLiBXZSBtaWdodCBuZWVkIHRvIGZpbmQgYSByZW5kZXJcbiAgICAvLyBwYXJlbnQgb2YgdGhlIHRvcG1vc3QgaG9zdCBub2RlIGlmIHRoZSByb290IGNvbXBvbmVudCBpbmplY3RzIFZpZXdDb250YWluZXJSZWYuXG4gICAgaWYgKGlzUm9vdFZpZXcoY3VycmVudFZpZXcpKSB7XG4gICAgICByZXR1cm4gbmF0aXZlUGFyZW50Tm9kZShjdXJyZW50Vmlld1tSRU5ERVJFUl0sIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXTtcblxuICAgIGNvbnN0IHROb2RlUGFyZW50ID0gdE5vZGUucGFyZW50O1xuICAgIGlmICh0Tm9kZVBhcmVudCAhPSBudWxsICYmIHROb2RlUGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICB0Tm9kZSA9IGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKHROb2RlUGFyZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdE5vZGUucGFyZW50ID09IG51bGwgJiYgaG9zdFROb2RlICEudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgICBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQoaG9zdFROb2RlIGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpIDpcbiAgICAgICAgZ2V0UGFyZW50TmF0aXZlKHROb2RlLCBjdXJyZW50VmlldykgYXMgUkVsZW1lbnQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZFbGVtZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAvLyBJZiB0aGUgcGFyZW50IGlzIG51bGwsIHRoZW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3Mgdmlld3MuIFRoaXMgaGFwcGVucyB3aGVuIHdlXG4gIC8vIGluc2VydCBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmQgaXRcbiAgLy8gc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgaWYgKHROb2RlLnBhcmVudCA9PSBudWxsIHx8XG4gICAgICAvLyBXZSBzaG91bGQgYWxzbyBlYWdlcmx5IGluc2VydCBpZiB0aGUgcGFyZW50IGlzIGEgcmVndWxhciwgbm9uLWNvbXBvbmVudCBlbGVtZW50XG4gICAgICAvLyBzaW5jZSB3ZSBrbm93IHRoYXQgdGhpcyByZWxhdGlvbnNoaXAgd2lsbCBuZXZlciBiZSBicm9rZW4uXG4gICAgICB0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgISh0Tm9kZS5wYXJlbnQuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gUGFyZW50IGlzIGEgQ29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoYW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBXZSBtaWdodCBkZWxheSBpbnNlcnRpb24gb2YgY2hpbGRyZW4gZm9yIGEgZ2l2ZW4gdmlldyBpZiBpdCBpcyBkaXNjb25uZWN0ZWQuXG4gKiBUaGlzIG1pZ2h0IGhhcHBlbiBmb3IgMiBtYWluIHJlYXNvbnM6XG4gKiAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lciAodmlldyB3YXMgY3JlYXRlZCBidXQgbm90IGluc2VydGVkIHlldClcbiAqIC0gdmlldyBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGJ1dCB0aGUgY29udGFpbmVyIGl0c2VsZiBpcyBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NXG4gKiAoY29udGFpbmVyIG1pZ2h0IGJlIHBhcnQgb2YgcHJvamVjdGlvbiBvciBjaGlsZCBvZiBhIHZpZXcgdGhhdCBpcyBub3QgaW5zZXJ0ZWQgeWV0KS5cbiAqXG4gKiBJbiBvdGhlciB3b3JkcyB3ZSBjYW4gaW5zZXJ0IGNoaWxkcmVuIG9mIGEgZ2l2ZW4gdmlldyBpZiB0aGlzIHZpZXcgd2FzIGluc2VydGVkIGludG8gYSBjb250YWluZXJcbiAqIGFuZFxuICogdGhlIGNvbnRhaW5lciBpdHNlbGYgaGFzIGl0cyByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gKi9cbmZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZWaWV3KHZpZXdUTm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgLy8gQmVjYXVzZSB3ZSBhcmUgaW5zZXJ0aW5nIGludG8gYSBgVmlld2AgdGhlIGBWaWV3YCBtYXkgYmUgZGlzY29ubmVjdGVkLlxuICBjb25zdCBjb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHZpZXdUTm9kZSwgdmlldykgITtcbiAgaWYgKGNvbnRhaW5lciA9PSBudWxsIHx8IGNvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9PSBudWxsKSB7XG4gICAgLy8gVGhlIGBWaWV3YCBpcyBub3QgaW5zZXJ0ZWQgaW50byBhIGBDb250YWluZXJgIG9yIHRoZSBwYXJlbnQgYENvbnRhaW5lcmBcbiAgICAvLyBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBTbyB3ZSBoYXZlIHRvIGRlbGF5LlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRoZSBwYXJlbnQgYENvbnRhaW5lcmAgaXMgaW4gaW5zZXJ0ZWQgc3RhdGUsIHNvIHdlIGNhbiBlYWdlcmx5IGluc2VydCBpbnRvXG4gIC8vIHRoaXMgbG9jYXRpb24uXG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFyZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKlxuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSB0Tm9kZSBvZiB0aGUgbm9kZSB0aGF0IHdlIHdhbnQgdG8gaW5zZXJ0LlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkIG5vdyAob3IgZGVsYXllZCB1bnRpbCBsYXRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudE5vZGUgPSB0Tm9kZTtcbiAgbGV0IHBhcmVudDogVE5vZGV8bnVsbCA9IHROb2RlLnBhcmVudDtcblxuICBpZiAodE5vZGUucGFyZW50KSB7XG4gICAgaWYgKHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgY3VycmVudE5vZGUgPSBnZXRIaWdoZXN0RWxlbWVudENvbnRhaW5lcih0Tm9kZSk7XG4gICAgICBwYXJlbnQgPSBjdXJyZW50Tm9kZS5wYXJlbnQ7XG4gICAgfSBlbHNlIGlmICh0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgICAgY3VycmVudE5vZGUgPSBnZXRGaXJzdFBhcmVudE5hdGl2ZShjdXJyZW50Tm9kZSk7XG4gICAgICBwYXJlbnQgPSBjdXJyZW50Tm9kZS5wYXJlbnQ7XG4gICAgfVxuICB9XG4gIGlmIChwYXJlbnQgPT09IG51bGwpIHBhcmVudCA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG5cbiAgaWYgKHBhcmVudCAmJiBwYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcocGFyZW50IGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIC8vIFBhcmVudCBpcyBhIHJlZ3VsYXIgZWxlbWVudCBvciBhIGNvbXBvbmVudFxuICAgIHJldHVybiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudChjdXJyZW50Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHBhcmVudCBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGwge1xuICByZXR1cm4gKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnBhcmVudE5vZGUobm9kZSkgOiBub2RlLnBhcmVudE5vZGUpIGFzIFJFbGVtZW50O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgc2libGluZyBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLm5leHRTaWJsaW5nKG5vZGUpIDogbm9kZS5uZXh0U2libGluZztcbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gY2hpbGRFbCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgZWxlbWVudFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChcbiAgICBjaGlsZEVsOiBSTm9kZSB8IG51bGwgPSBudWxsLCBjaGlsZFROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGRFbCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IHBhcmVudEVsID0gZ2V0UGFyZW50TmF0aXZlKGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICBjb25zdCBwYXJlbnRUTm9kZTogVE5vZGUgPSBjaGlsZFROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tIT1NUX05PREVdICE7XG5cbiAgICBpZiAocGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHBhcmVudFROb2RlIGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpIGFzIExDb250YWluZXI7XG4gICAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgICAgY29uc3QgaW5kZXggPSB2aWV3cy5pbmRleE9mKGN1cnJlbnRWaWV3KTtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgICAgICByZW5kZXJlciwgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSAhLCBjaGlsZEVsLFxuICAgICAgICAgIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4LCB2aWV3cywgbENvbnRhaW5lcltOQVRJVkVdKSk7XG4gICAgfSBlbHNlIGlmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KSAhO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGNoaWxkRWwsIHBhcmVudEVsKTtcbiAgICB9IGVsc2UgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGljdUFuY2hvck5vZGUgPSBnZXROYXRpdmVCeVROb2RlKGNoaWxkVE5vZGUucGFyZW50ICEsIGN1cnJlbnRWaWV3KSAhYXMgUkVsZW1lbnQ7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudEVsIGFzIFJFbGVtZW50LCBjaGlsZEVsLCBpY3VBbmNob3JOb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50RWwgIWFzIFJFbGVtZW50LCBjaGlsZEVsKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbCAhLmFwcGVuZENoaWxkKGNoaWxkRWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdG9wLWxldmVsIG5nLWNvbnRhaW5lciBpZiBuZy1jb250YWluZXJzIGFyZSBuZXN0ZWQuXG4gKlxuICogQHBhcmFtIG5nQ29udGFpbmVyIFRoZSBUTm9kZSBvZiB0aGUgc3RhcnRpbmcgbmctY29udGFpbmVyXG4gKiBAcmV0dXJucyB0Tm9kZSBUaGUgVE5vZGUgb2YgdGhlIGhpZ2hlc3QgbGV2ZWwgbmctY29udGFpbmVyXG4gKi9cbmZ1bmN0aW9uIGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKG5nQ29udGFpbmVyOiBUTm9kZSk6IFROb2RlIHtcbiAgd2hpbGUgKG5nQ29udGFpbmVyLnBhcmVudCAhPSBudWxsICYmIG5nQ29udGFpbmVyLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIG5nQ29udGFpbmVyID0gbmdDb250YWluZXIucGFyZW50O1xuICB9XG4gIHJldHVybiBuZ0NvbnRhaW5lcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4OiBudW1iZXIsIHZpZXdzOiBMVmlld0RhdGFbXSwgY29udGFpbmVyTmF0aXZlOiBSQ29tbWVudCkge1xuICBpZiAoaW5kZXggKyAxIDwgdmlld3MubGVuZ3RoKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdzW2luZGV4ICsgMV0gYXMgTFZpZXdEYXRhO1xuICAgIGNvbnN0IHZpZXdUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSBhcyBUVmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdUTm9kZS5jaGlsZCA/IGdldE5hdGl2ZUJ5VE5vZGUodmlld1ROb2RlLmNoaWxkLCB2aWV3KSA6IGNvbnRhaW5lck5hdGl2ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29udGFpbmVyTmF0aXZlO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgYGNoaWxkYCBlbGVtZW50IGZyb20gdGhlIERPTSBpZiBub3QgaW4gdmlldyBhbmQgbm90IHByb2plY3RlZC5cbiAqXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIHRvIHJlbW92ZVxuICogQHBhcmFtIGNoaWxkRWwgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDaGlsZChcbiAgICBjaGlsZFROb2RlOiBUTm9kZSwgY2hpbGRFbDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIC8vIFdlIG9ubHkgcmVtb3ZlIHRoZSBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gIGlmIChjaGlsZEVsICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgcGFyZW50TmF0aXZlID0gZ2V0UGFyZW50TmF0aXZlKGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KSAhYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50TmF0aXZlIGFzIFJFbGVtZW50LCBjaGlsZEVsKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50TmF0aXZlICEucmVtb3ZlQ2hpbGQoY2hpbGRFbCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHByb2plY3RlZFROb2RlIFRoZSBUTm9kZSB0byBiZSBwcm9qZWN0ZWRcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgVGhlIHByb2plY3Rpb24gKG5nLWNvbnRlbnQpIFROb2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlldyAodmlldyBhYm92ZSBjdXJyZW50KVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBwcm9qZWN0ZWRUTm9kZTogVE5vZGUsIHRQcm9qZWN0aW9uTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsXG4gICAgcHJvamVjdGlvblZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByb2plY3RlZFROb2RlLCBwcm9qZWN0aW9uVmlldyk7XG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG5cbiAgLy8gdGhlIHByb2plY3RlZCBjb250ZW50cyBhcmUgcHJvY2Vzc2VkIHdoaWxlIGluIHRoZSBzaGFkb3cgdmlldyAod2hpY2ggaXMgdGhlIGN1cnJlbnRWaWV3KVxuICAvLyB0aGVyZWZvcmUgd2UgbmVlZCB0byBleHRyYWN0IHRoZSB2aWV3IHdoZXJlIHRoZSBob3N0IGVsZW1lbnQgbGl2ZXMgc2luY2UgaXQncyB0aGVcbiAgLy8gbG9naWNhbCBjb250YWluZXIgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGVkIHZpZXdzXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHByb2plY3Rpb25WaWV3KTtcblxuICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRSZW5kZXJQYXJlbnQodFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG5cbiAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gcHJvamVjdGlvblZpZXdbcHJvamVjdGVkVE5vZGUuaW5kZXhdO1xuICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBjb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gYW4gZWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIG5vZGVPckNvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IG5vZGVPckNvbnRhaW5lcltWSUVXU107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld3NbaV0sIHRydWUsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBsZXQgbmdDb250YWluZXJDaGlsZFROb2RlOiBUTm9kZXxudWxsID0gcHJvamVjdGVkVE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gICAgICB3aGlsZSAobmdDb250YWluZXJDaGlsZFROb2RlKSB7XG4gICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobmdDb250YWluZXJDaGlsZFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3LCBwcm9qZWN0aW9uVmlldyk7XG4gICAgICAgIG5nQ29udGFpbmVyQ2hpbGRUTm9kZSA9IG5nQ29udGFpbmVyQ2hpbGRUTm9kZS5uZXh0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgbm9kZU9yQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgICAgYXBwZW5kQ2hpbGQobm9kZU9yQ29udGFpbmVyW05BVElWRV0sIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH1cbiAgfVxufVxuIl19