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
import { getLNode, getNative, isLContainer, readElementValue, stringify } from './util';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Retrieves the parent LNode of a given node.
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
export function getParentLNode(tNode, currentView) {
    return tNode.parent == null ? getHostElementNode(currentView) :
        getLNode(tNode.parent, currentView);
}
/**
 * Gets the host LElementNode given a view. Will return null if the host element is an
 * LViewNode, since they are being phased out.
 * @param {?} currentView
 * @return {?}
 */
export function getHostElementNode(currentView) {
    /** @type {?} */
    const hostTNode = /** @type {?} */ (currentView[HOST_NODE]);
    return hostTNode && hostTNode.type !== 2 /* View */ ?
        (/** @type {?} */ (getLNode(hostTNode, /** @type {?} */ ((currentView[PARENT]))))) :
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
 * Retrieves render parent LElementNode for a given view.
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
 * @param {?} action identifies the action to be performed on the LElement nodes.
 * @param {?} renderer the current renderer.
 * @param {?=} renderParentNode Optional the render parent node to be set in all LContainerNodes found,
 * required for action modes Insert and Destroy.
 * @param {?=} beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 * @return {?}
 */
function walkTNodeTree(viewToWalk, action, renderer, renderParentNode, beforeNode) {
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
        /** @type {?} */
        const parent = renderParentNode ? renderParentNode.native : null;
        if (tNode.type === 3 /* Element */) {
            executeNodeAction(action, renderer, parent, getNative(tNode, currentView), beforeNode);
            /** @type {?} */
            const nodeOrContainer = currentView[tNode.index];
            if (isLContainer(nodeOrContainer)) {
                // This element has an LContainer, and its comment needs to be handled
                executeNodeAction(action, renderer, parent, nodeOrContainer[NATIVE], beforeNode);
            }
        }
        else if (tNode.type === 0 /* Container */) {
            /** @type {?} */
            const lContainer = /** @type {?} */ (((currentView))[tNode.index]);
            executeNodeAction(action, renderer, parent, lContainer[NATIVE], beforeNode);
            if (renderParentNode)
                lContainer[RENDER_PARENT] = renderParentNode;
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
                   * Find the next node in the LNode tree, taking into account the place where a node is
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
    const parentNode = getContainerRenderParent(/** @type {?} */ (viewToWalk[TVIEW].node), viewToWalk);
    /** @type {?} */
    const parent = parentNode ? parentNode.native : null;
    ngDevMode && assertNodeType(/** @type {?} */ (viewToWalk[TVIEW].node), 2 /* View */);
    if (parent) {
        /** @type {?} */
        const renderer = viewToWalk[RENDERER];
        walkTNodeTree(viewToWalk, insertMode ? 0 /* Insert */ : 1 /* Detach */, renderer, parentNode, beforeNode);
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
        walkTNodeTree(view, 2 /* Destroy */, renderer);
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
                const native = readElementValue(viewData[cleanup[i + 1]]).native;
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
        /** @type {?} */
        const hostTNode = currentView[HOST_NODE];
        return tNode.parent == null && /** @type {?} */ ((hostTNode)).type === 2 /* View */ ?
            getContainerRenderParent(/** @type {?} */ (hostTNode), currentView) : /** @type {?} */ (getParentLNode(tNode, currentView));
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
 * @param {?} tNode
 * @param {?} currentView Current LView being processed.
 * @return {?} boolean Whether the child should be inserted now (or delayed until later).
 */
export function canInsertNativeNode(tNode, currentView) {
    /** @type {?} */
    let currentNode = tNode;
    /** @type {?} */
    let parent = tNode.parent;
    if (tNode.parent && tNode.parent.type === 4 /* ElementContainer */) {
        currentNode = getHighestElementContainer(tNode);
        parent = currentNode.parent;
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
function nativeInsertBefore(renderer, parent, child, beforeNode) {
    if (isProceduralRenderer(renderer)) {
        renderer.insertBefore(parent, child, beforeNode);
    }
    else {
        parent.insertBefore(child, beforeNode, true);
    }
}
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}.
 *
 * @param {?} childEl The child that should be appended
 * @param {?} childTNode The TNode of the child element
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(childEl, childTNode, currentView) {
    /** @type {?} */
    const parentLNode = getParentLNode(childTNode, currentView);
    /** @type {?} */
    const parentEl = parentLNode ? parentLNode.native : null;
    if (childEl !== null && canInsertNativeNode(childTNode, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        /** @type {?} */
        const parentTNode = childTNode.parent || /** @type {?} */ ((currentView[HOST_NODE]));
        if (parentTNode.type === 2 /* View */) {
            /** @type {?} */
            const lContainer = /** @type {?} */ (getLContainer(/** @type {?} */ (parentTNode), currentView));
            /** @type {?} */
            const renderParent = lContainer[RENDER_PARENT];
            /** @type {?} */
            const views = lContainer[VIEWS];
            /** @type {?} */
            const index = views.indexOf(currentView);
            nativeInsertBefore(renderer, /** @type {?} */ ((renderParent)).native, childEl, getBeforeNodeForView(index, views, lContainer[NATIVE]));
        }
        else if (parentTNode.type === 4 /* ElementContainer */) {
            /** @type {?} */
            let elementContainer = getHighestElementContainer(childTNode);
            /** @type {?} */
            let node = /** @type {?} */ ((getRenderParent(elementContainer, currentView)));
            nativeInsertBefore(renderer, node.native, childEl, parentEl);
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
        return viewTNode.child ? getNative(viewTNode.child, view) : containerNative;
    }
    else {
        return containerNative;
    }
}
/**
 * Removes the `child` element of the `parent` from the DOM.
 *
 * @param {?} tNode
 * @param {?} child The child that should be removed
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was removed
 */
export function removeChild(tNode, child, currentView) {
    /** @type {?} */
    const parentNative = /** @type {?} */ (((getParentLNode(tNode, currentView))).native);
    if (child !== null && canInsertNativeNode(tNode, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.removeChild(/** @type {?} */ (parentNative), child) : /** @type {?} */ ((parentNative)).removeChild(child);
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
    const native = getNative(projectedTNode, projectionView);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsTUFBTSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUgsT0FBTyxFQUFvSiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5TixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMvTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRXRGLE1BQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7OztBQUdoRixNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVksRUFBRSxXQUFzQjtJQUVqRSxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0NBQ25FOzs7Ozs7O0FBTUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLFdBQXNCOztJQUN2RCxNQUFNLFNBQVMscUJBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBaUIsRUFBQztJQUN6RCxPQUFPLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxpQkFBbUIsQ0FBQyxDQUFDO1FBQ25ELG1CQUFDLFFBQVEsQ0FBQyxTQUFTLHFCQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBbUIsRUFBQyxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDO0NBQ1Y7Ozs7OztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBZ0IsRUFBRSxZQUF1QjtJQUNyRSxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7O1FBR3RCLE1BQU0sa0JBQWtCLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3pELE9BQU8sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUNwRjtTQUFNOztRQUVMLDJCQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsc0JBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLEdBQWdCO0tBQ25FO0NBQ0Y7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLHdCQUF3QixDQUFDLFNBQW9CLEVBQUUsSUFBZTs7SUFDNUUsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNqRCxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Q0FDcEQ7Ozs7SUFJQyxTQUFVOztJQUdWLFNBQVU7O0lBR1YsVUFBVzs7Ozs7Ozs7O0FBV2IsTUFBTSxtQkFBbUIsR0FBMEIsRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7OztBQWN0RCxTQUFTLGFBQWEsQ0FDbEIsVUFBcUIsRUFBRSxNQUEyQixFQUFFLFFBQW1CLEVBQ3ZFLGdCQUFzQyxFQUFFLFVBQXlCOztJQUNuRSxNQUFNLFNBQVMscUJBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQWlCLEVBQUM7O0lBQ3RELElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0lBQzdCLElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQzs7SUFDN0IsSUFBSSxLQUFLLHFCQUFlLFNBQVMsQ0FBQyxLQUFjLEVBQUM7SUFDakQsT0FBTyxLQUFLLEVBQUU7O1FBQ1osSUFBSSxTQUFTLEdBQWUsSUFBSSxDQUFDOztRQUNqQyxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDakUsSUFBSSxLQUFLLENBQUMsSUFBSSxvQkFBc0IsRUFBRTtZQUNwQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDOztZQUN2RixNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pELElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFOztnQkFFakMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ2xGO1NBQ0Y7YUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixFQUFFOztZQUM3QyxNQUFNLFVBQVUsdUJBQUcsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQWdCO1lBQzVELGlCQUFpQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU1RSxJQUFJLGdCQUFnQjtnQkFBRSxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsZ0JBQWdCLENBQUM7WUFFbkUsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFO2dCQUM1QixXQUFXLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxTQUFTLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQzs7O2dCQUlwQyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2pDO1NBQ0Y7YUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixFQUFFOztZQUM5QyxNQUFNLGFBQWEsR0FBRyxpQkFBaUIsb0JBQUMsV0FBVyxHQUFHLENBQUM7O1lBQ3ZELE1BQU0sYUFBYSxxQkFBRyxhQUFhLENBQUMsU0FBUyxDQUFpQixFQUFDOztZQUMvRCxNQUFNLElBQUksR0FDTixtQkFBQyxhQUFhLENBQUMsVUFBNkIsRUFBQyxtQkFBQyxLQUFLLENBQUMsVUFBb0IsRUFBQyxDQUFDOzs7WUFJOUUsbUJBQW1CLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUNuRCxtQkFBbUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLHNCQUFHLFdBQVcsRUFBRSxDQUFDO1lBQzNELElBQUksSUFBSSxFQUFFO2dCQUNSLFdBQVcsc0JBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLFNBQVMscUJBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFVLENBQUEsQ0FBQzthQUMxRDtTQUNGO2FBQU07O1lBRUwsU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7U0FDekI7UUFFRCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7O1lBRXRCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyx5QkFBeUIsQ0FBQyxFQUFFO2dCQUNqRSxXQUFXLHFCQUFHLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLENBQWMsQ0FBQSxDQUFDO2dCQUN0RSxLQUFLLHFCQUFHLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLENBQVUsQ0FBQSxDQUFDO2FBQzdEO1lBQ0QsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7Ozs7Ozs7O1lBU3ZCLE9BQU8sQ0FBQyxTQUFTLEVBQUU7O2dCQUVqQixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUVoRCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVM7b0JBQUUsT0FBTyxJQUFJLENBQUM7O2dCQUd2RCxJQUFJLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixFQUFFO29CQUN0QyxXQUFXLHNCQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNwQyxVQUFVLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDL0M7Z0JBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxpQkFBbUIsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3RELFdBQVcscUJBQUcsV0FBVyxDQUFDLElBQUksQ0FBYyxDQUFBLENBQUM7b0JBQzdDLFNBQVMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNyQztxQkFBTTtvQkFDTCxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztpQkFDeEI7YUFDRjtTQUNGO1FBQ0QsS0FBSyxHQUFHLFNBQVMsQ0FBQztLQUNuQjtDQUNGOzs7Ozs7O0FBUUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFNBQW9COztJQUNwRCxJQUFJLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFckMsT0FBTyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksaUJBQW1CLEVBQUU7UUFDckQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNqRSxTQUFTLHNCQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2hDLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDbEM7SUFFRCxPQUFPLFNBQVMsQ0FBQztDQUNsQjs7Ozs7Ozs7Ozs7QUFNRCxTQUFTLGlCQUFpQixDQUN0QixNQUEyQixFQUFFLFFBQW1CLEVBQUUsTUFBdUIsRUFDekUsSUFBaUMsRUFBRSxVQUF5QjtJQUM5RCxJQUFJLE1BQU0sbUJBQStCLEVBQUU7UUFDekMsb0JBQW9CLG9CQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDOUIsbUJBQUMsUUFBK0IsRUFBQyxDQUFDLFlBQVksb0JBQUMsTUFBTSxJQUFJLElBQUksb0JBQUUsVUFBMEIsRUFBQyxDQUFDLENBQUMsb0JBQzVGLE1BQU0sR0FBRyxZQUFZLENBQUMsSUFBSSxvQkFBRSxVQUEwQixHQUFFLElBQUksQ0FBQyxDQUFDO0tBQ25FO1NBQU0sSUFBSSxNQUFNLG1CQUErQixFQUFFO1FBQ2hELG9CQUFvQixvQkFBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLG1CQUFDLFFBQStCLEVBQUMsQ0FBQyxXQUFXLG9CQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUMvRCxNQUFNLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2hDO1NBQU0sSUFBSSxNQUFNLG9CQUFnQyxFQUFFO1FBQ2pELFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztVQUM3QyxtQkFBQyxRQUErQixFQUFDLENBQUMsV0FBVyxHQUFHLElBQUk7S0FDckQ7Q0FDRjs7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFVLEVBQUUsUUFBbUI7SUFDNUQsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Q0FDbkY7Ozs7Ozs7QUFnQkQsTUFBTSxVQUFVLDBCQUEwQixDQUN0QyxVQUFxQixFQUFFLFVBQW1CLEVBQUUsVUFBeUI7O0lBQ3ZFLE1BQU0sVUFBVSxHQUFHLHdCQUF3QixtQkFBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBaUIsR0FBRSxVQUFVLENBQUMsQ0FBQzs7SUFDN0YsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDckQsU0FBUyxJQUFJLGNBQWMsbUJBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQWEsZ0JBQWlCLENBQUM7SUFDN0UsSUFBSSxNQUFNLEVBQUU7O1FBQ1YsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLGFBQWEsQ0FDVCxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUMsZ0JBQTRCLENBQUMsZUFBMkIsRUFBRSxRQUFRLEVBQzFGLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUM3QjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxNQUFNLFVBQVUsZUFBZSxDQUFDLFFBQW1COztJQUVqRCxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDckMsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDOUI7O0lBQ0QsSUFBSSxlQUFlLEdBQThCLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV6RSxPQUFPLGVBQWUsRUFBRTs7UUFDdEIsSUFBSSxJQUFJLEdBQThCLElBQUksQ0FBQztRQUUzQyxJQUFJLGVBQWUsQ0FBQyxNQUFNLElBQUksYUFBYSxFQUFFOztZQUUzQyxNQUFNLElBQUkscUJBQUcsZUFBNEIsRUFBQztZQUMxQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUFFLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0Q7YUFBTTs7WUFFTCxNQUFNLFNBQVMscUJBQUcsZUFBNkIsRUFBQztZQUNoRCxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNO2dCQUFFLElBQUksR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDekQ7UUFFRCxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7OztZQUdoQixPQUFPLGVBQWUsSUFBSSxvQkFBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksZUFBZSxLQUFLLFFBQVEsRUFBRTtnQkFDbEYsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUM3QixlQUFlLEdBQUcsY0FBYyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUM3RDtZQUNELFdBQVcsQ0FBQyxlQUFlLElBQUksUUFBUSxDQUFDLENBQUM7WUFDekMsSUFBSSxHQUFHLGVBQWUsdUJBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsZUFBZSxHQUFHLElBQUksQ0FBQztLQUN4QjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELE1BQU0sVUFBVSxVQUFVLENBQ3RCLEtBQWdCLEVBQUUsVUFBc0IsRUFBRSxVQUFxQixFQUFFLEtBQWEsRUFDOUUsY0FBc0I7O0lBQ3hCLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVoQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7O1FBRWIsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7S0FDaEM7SUFFRCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQy9CO1NBQU07UUFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDcEI7OztJQUlELElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQyxFQUFFO1FBQ3ZCLEtBQUssQ0FBQyxlQUFlLENBQUMsR0FBRyxjQUFjLENBQUM7UUFDeEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQztLQUM1Qjs7SUFHRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTsyQkFDbEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLO0tBQ2xDOztJQUdELEtBQUssQ0FBQyxLQUFLLENBQUMsb0JBQXVCLENBQUM7Q0FDckM7Ozs7Ozs7Ozs7OztBQVlELE1BQU0sVUFBVSxVQUFVLENBQUMsVUFBc0IsRUFBRSxXQUFtQixFQUFFLFFBQWlCOztJQUN2RixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7O0lBQ2hDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN4QyxJQUFJLFdBQVcsR0FBRyxDQUFDLEVBQUU7UUFDbkIsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQUcsWUFBWSxDQUFDLElBQUksQ0FBYyxDQUFBLENBQUM7S0FDaEU7SUFDRCxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3QixJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsMEJBQTBCLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7MkJBQ3pCLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxVQUFVO0tBQ25DO0lBQ0QsWUFBWSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7O0lBRTVCLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxpQkFBb0IsQ0FBQztDQUM3Qzs7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsVUFBc0IsRUFBRSxhQUFvRSxFQUM1RixXQUFtQjs7SUFDckIsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzVDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUQsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3BCOzs7Ozs7QUFHRCxNQUFNLFVBQVUsYUFBYSxDQUFDLFFBQW1COztJQUMvQyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDO0lBQzlDLE9BQU8sVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztDQUN4RDs7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQWU7O0lBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoQyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUU7UUFDMUQsYUFBYSxDQUFDLElBQUksbUJBQStCLFFBQVEsQ0FBQyxDQUFDO0tBQzVEO0lBQ0QsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDOztJQUV0QixJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUF3QixDQUFDO0NBQ3JDOzs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUE2QixFQUFFLFFBQW1COztJQUUvRSxJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxhQUFhLElBQUksQ0FBQyxLQUFLLHNCQUFHLG1CQUFDLEtBQWtCLEVBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUM1RSxLQUFLLENBQUMsSUFBSSxpQkFBbUIsRUFBRTs7O1FBR2pDLHlCQUFPLGFBQWEsbUJBQUMsS0FBa0IscUJBQUUsS0FBa0IsRUFBZSxFQUFDO0tBQzVFO1NBQU07O1FBRUwsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMxRDtDQUNGOzs7Ozs7O0FBT0QsU0FBUyxXQUFXLENBQUMsZUFBdUM7SUFDMUQsSUFBSSxtQkFBQyxlQUE0QixFQUFDLENBQUMsTUFBTSxJQUFJLGFBQWEsRUFBRTs7UUFDMUQsTUFBTSxJQUFJLHFCQUFHLGVBQTRCLEVBQUM7UUFDMUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDOztRQUU1QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDakUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QyxtQkFBQyxJQUFJLENBQUMsUUFBUSxDQUF3QixFQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbkQ7S0FDRjtDQUNGOzs7Ozs7QUFHRCxTQUFTLGVBQWUsQ0FBQyxRQUFtQjs7SUFDMUMsTUFBTSxPQUFPLHNCQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEdBQUc7SUFDMUMsSUFBSSxPQUFPLElBQUksSUFBSSxFQUFFO1FBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzlDLElBQUksT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFOztnQkFFbEMsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQzs7Z0JBQ2pFLE1BQU0sUUFBUSxzQkFBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDckQsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ1I7aUJBQU0sSUFBSSxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7O2dCQUV6QyxNQUFNLFNBQVMsc0JBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbEQsU0FBUyxFQUFFLENBQUM7YUFDYjtpQkFBTTs7Z0JBRUwsTUFBTSxPQUFPLHNCQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUNwRCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzFCO1NBQ0Y7UUFDRCxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzFCO0NBQ0Y7Ozs7OztBQUdELFNBQVMsaUJBQWlCLENBQUMsSUFBZTs7SUFDeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztJQUMxQixJQUFJLFlBQVksQ0FBZ0I7SUFDaEMsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDaEUsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztLQUMvQjtDQUNGOzs7Ozs7QUFHRCxTQUFTLHFCQUFxQixDQUFDLFFBQW1COztJQUNoRCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7SUFDN0UsSUFBSSxnQkFBZ0IsRUFBRTtRQUNwQixTQUFTLG9CQUFDLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3pDO0NBQ0Y7Ozs7OztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBWSxFQUFFLFdBQXNCO0lBQ2xFLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUFFOztRQUMzQyxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekMsT0FBTyxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksdUJBQUksU0FBUyxHQUFHLElBQUksaUJBQW1CLENBQUMsQ0FBQztZQUNoRSx3QkFBd0IsbUJBQUMsU0FBc0IsR0FBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLG1CQUMvRCxjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBaUIsQ0FBQSxDQUFDO0tBQ3hEO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7QUFFRCxTQUFTLDZCQUE2QixDQUFDLEtBQVk7Ozs7SUFJakQsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUk7OztRQUdwQixLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksb0JBQXNCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyx5QkFBeUIsQ0FBQyxFQUFFO1FBQzdGLE9BQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7SUFLRCxPQUFPLEtBQUssQ0FBQztDQUNkOzs7Ozs7Ozs7Ozs7Ozs7QUFhRCxTQUFTLDBCQUEwQixDQUFDLFNBQW9CLEVBQUUsSUFBZTs7SUFFdkUsTUFBTSxTQUFTLHNCQUFHLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUc7SUFDbkQsSUFBSSxTQUFTLElBQUksSUFBSSxJQUFJLFNBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLEVBQUU7OztRQUd6RCxPQUFPLEtBQUssQ0FBQztLQUNkOzs7SUFJRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQkQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQVksRUFBRSxXQUFzQjs7SUFDdEUsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDOztJQUN4QixJQUFJLE1BQU0sR0FBZSxLQUFLLENBQUMsTUFBTSxDQUFDO0lBRXRDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksNkJBQStCLEVBQUU7UUFDcEUsV0FBVyxHQUFHLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO0tBQzdCO0lBQ0QsSUFBSSxNQUFNLEtBQUssSUFBSTtRQUFFLE1BQU0sR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFckQsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksaUJBQW1CLEVBQUU7UUFDNUMsT0FBTywwQkFBMEIsbUJBQUMsTUFBbUIsR0FBRSxXQUFXLENBQUMsQ0FBQztLQUNyRTtTQUFNOztRQUVMLE9BQU8sNkJBQTZCLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDbkQ7Q0FDRjs7Ozs7Ozs7Ozs7QUFPRCxTQUFTLGtCQUFrQixDQUN2QixRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBWSxFQUFFLFVBQXdCO0lBQy9FLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ2xEO1NBQU07UUFDTCxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDOUM7Q0FDRjs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixPQUFxQixFQUFFLFVBQWlCLEVBQUUsV0FBc0I7O0lBQ2xFLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7O0lBQzVELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRXpELElBQUksT0FBTyxLQUFLLElBQUksSUFBSSxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEVBQUU7O1FBQ3BFLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7UUFDdkMsTUFBTSxXQUFXLEdBQVUsVUFBVSxDQUFDLE1BQU0sdUJBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFFekUsSUFBSSxXQUFXLENBQUMsSUFBSSxpQkFBbUIsRUFBRTs7WUFDdkMsTUFBTSxVQUFVLHFCQUFHLGFBQWEsbUJBQUMsV0FBd0IsR0FBRSxXQUFXLENBQWUsRUFBQzs7WUFDdEYsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDOztZQUMvQyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7O1lBQ2hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekMsa0JBQWtCLENBQ2QsUUFBUSxxQkFBRSxZQUFZLEdBQUcsTUFBTSxFQUFFLE9BQU8sRUFDeEMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdEO2FBQU0sSUFBSSxXQUFXLENBQUMsSUFBSSw2QkFBK0IsRUFBRTs7WUFDMUQsSUFBSSxnQkFBZ0IsR0FBRywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7WUFDOUQsSUFBSSxJQUFJLHNCQUFpQixlQUFlLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLEdBQUc7WUFDMUUsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzlEO2FBQU07WUFDTCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcscUJBQUMsUUFBUSxLQUFlLE9BQU8sQ0FBQyxDQUFDLENBQUMsb0JBQ3RELFFBQVEsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDbEU7UUFDRCxPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7OztBQVFELFNBQVMsMEJBQTBCLENBQUMsV0FBa0I7SUFDcEQsT0FBTyxXQUFXLENBQUMsTUFBTSxJQUFJLElBQUksSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksNkJBQStCLEVBQUU7UUFDM0YsV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7S0FDbEM7SUFDRCxPQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFhLEVBQUUsS0FBa0IsRUFBRSxlQUF5QjtJQUMvRixJQUFJLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTs7UUFDNUIsTUFBTSxJQUFJLHFCQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFjLEVBQUM7O1FBQzNDLE1BQU0sU0FBUyxxQkFBRyxJQUFJLENBQUMsU0FBUyxDQUFjLEVBQUM7UUFDL0MsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0tBQzdFO1NBQU07UUFDTCxPQUFPLGVBQWUsQ0FBQztLQUN4QjtDQUNGOzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQVksRUFBRSxLQUFtQixFQUFFLFdBQXNCOztJQUNuRixNQUFNLFlBQVksdUJBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsR0FBRyxNQUFNLEVBQWE7SUFDN0UsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsRUFBRTs7UUFFN0QsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxtQkFBQyxZQUF3QixHQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsb0JBQ3ZELFlBQVksR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkUsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixjQUFxQixFQUFFLGVBQXNCLEVBQUUsV0FBc0IsRUFDckUsY0FBeUI7O0lBQzNCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDekQsV0FBVyxDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7Ozs7SUFLbEQsZUFBZSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQzs7SUFFeEMsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQzs7SUFFbkUsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3RCxJQUFJLGNBQWMsQ0FBQyxJQUFJLHNCQUF3QixFQUFFOzs7Ozs7UUFNL0MsZUFBZSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQzs7UUFDOUMsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7U0FDckU7S0FDRjtTQUFNO1FBQ0wsSUFBSSxjQUFjLENBQUMsSUFBSSw2QkFBK0IsRUFBRTs7WUFDdEQsSUFBSSxxQkFBcUIscUJBQWUsY0FBYyxDQUFDLEtBQWMsRUFBQztZQUN0RSxPQUFPLHFCQUFxQixFQUFFO2dCQUM1QixtQkFBbUIsQ0FBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN6RixxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7YUFDcEQ7U0FDRjtRQUVELElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ2pDLGVBQWUsQ0FBQyxhQUFhLENBQUMsR0FBRyxZQUFZLENBQUM7WUFDOUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDcEU7S0FDRjtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFLCBSRU5ERVJfUEFSRU5ULCBWSUVXUywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250YWluZXJOb2RlLCBMRWxlbWVudENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUVmlld05vZGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q0xFQU5VUCwgQ09OVEFJTkVSX0lOREVYLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBIb29rRGF0YSwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldExOb2RlLCBnZXROYXRpdmUsIGlzTENvbnRhaW5lciwgcmVhZEVsZW1lbnRWYWx1ZSwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKiogUmV0cmlldmVzIHRoZSBwYXJlbnQgTE5vZGUgb2YgYSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxcbiAgICBMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8bnVsbCB7XG4gIHJldHVybiB0Tm9kZS5wYXJlbnQgPT0gbnVsbCA/IGdldEhvc3RFbGVtZW50Tm9kZShjdXJyZW50VmlldykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRMTm9kZSh0Tm9kZS5wYXJlbnQsIGN1cnJlbnRWaWV3KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBob3N0IExFbGVtZW50Tm9kZSBnaXZlbiBhIHZpZXcuIFdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIGhvc3QgZWxlbWVudCBpcyBhblxuICogTFZpZXdOb2RlLCBzaW5jZSB0aGV5IGFyZSBiZWluZyBwaGFzZWQgb3V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdEVsZW1lbnROb2RlKGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICByZXR1cm4gaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlICE9PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICAoZ2V0TE5vZGUoaG9zdFROb2RlLCBjdXJyZW50Vmlld1tQQVJFTlRdICEpIGFzIExFbGVtZW50Tm9kZSkgOlxuICAgICAgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExDb250YWluZXIodE5vZGU6IFRWaWV3Tm9kZSwgZW1iZWRkZWRWaWV3OiBMVmlld0RhdGEpOiBMQ29udGFpbmVyfG51bGwge1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBJZiB0aGUgaG9zdCBpbmRleCBpcyAtMSwgdGhlIHZpZXcgaGFzIG5vdCB5ZXQgYmVlbiBpbnNlcnRlZCwgc28gaXQgaGFzIG5vIHBhcmVudC5cbiAgICBjb25zdCBjb250YWluZXJIb3N0SW5kZXggPSBlbWJlZGRlZFZpZXdbQ09OVEFJTkVSX0lOREVYXTtcbiAgICByZXR1cm4gY29udGFpbmVySG9zdEluZGV4ID4gLTEgPyBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW2NvbnRhaW5lckhvc3RJbmRleF0gOiBudWxsO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYSBpbmxpbmUgdmlldyBub2RlIChlLmcuIGVtYmVkZGVkVmlld1N0YXJ0KVxuICAgIHJldHVybiBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW3ROb2RlLnBhcmVudCAhLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBMRWxlbWVudE5vZGUgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lclJlbmRlclBhcmVudCh0Vmlld05vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBjb250YWluZXJbUkVOREVSX1BBUkVOVF0gOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiB3YWxrVE5vZGVUcmVlLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiB3YWxrVE5vZGVUcmVlIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXdEYXRhIHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgVE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBlbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgdGhlIHZpZXcgdG8gd2Fsa1xuICogQHBhcmFtIGFjdGlvbiBpZGVudGlmaWVzIHRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBMRWxlbWVudCBub2Rlcy5cbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnROb2RlIE9wdGlvbmFsIHRoZSByZW5kZXIgcGFyZW50IG5vZGUgdG8gYmUgc2V0IGluIGFsbCBMQ29udGFpbmVyTm9kZXMgZm91bmQsXG4gKiByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIEluc2VydCBhbmQgRGVzdHJveS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIEluc2VydC5cbiAqL1xuZnVuY3Rpb24gd2Fsa1ROb2RlVHJlZShcbiAgICB2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnROb2RlPzogTEVsZW1lbnROb2RlIHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBjb25zdCByb290VE5vZGUgPSB2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZTtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgbGV0IGN1cnJlbnRWaWV3ID0gdmlld1RvV2FsaztcbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gcm9vdFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBsZXQgbmV4dFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICBjb25zdCBwYXJlbnQgPSByZW5kZXJQYXJlbnROb2RlID8gcmVuZGVyUGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBnZXROYXRpdmUodE5vZGUsIGN1cnJlbnRWaWV3KSwgYmVmb3JlTm9kZSk7XG4gICAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF07XG4gICAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgICAgLy8gVGhpcyBlbGVtZW50IGhhcyBhbiBMQ29udGFpbmVyLCBhbmQgaXRzIGNvbW1lbnQgbmVlZHMgdG8gYmUgaGFuZGxlZFxuICAgICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBjdXJyZW50VmlldyAhW3ROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBsQ29udGFpbmVyW05BVElWRV0sIGJlZm9yZU5vZGUpO1xuXG4gICAgICBpZiAocmVuZGVyUGFyZW50Tm9kZSkgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudE5vZGU7XG5cbiAgICAgIGlmIChsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBsQ29udGFpbmVyW1ZJRVdTXVswXTtcbiAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgd2Fsa2VyIGVudGVycyBhIGNvbnRhaW5lciwgdGhlbiB0aGUgYmVmb3JlTm9kZSBoYXMgdG8gYmVjb21lIHRoZSBsb2NhbCBuYXRpdmVcbiAgICAgICAgLy8gY29tbWVudCBub2RlLlxuICAgICAgICBiZWZvcmVOb2RlID0gbENvbnRhaW5lcltOQVRJVkVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhjdXJyZW50VmlldyAhKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgLy8gTXVzdCBzdG9yZSBib3RoIHRoZSBUTm9kZSBhbmQgdGhlIHZpZXcgYmVjYXVzZSB0aGlzIHByb2plY3Rpb24gbm9kZSBjb3VsZCBiZSBuZXN0ZWRcbiAgICAgIC8vIGRlZXBseSBpbnNpZGUgZW1iZWRkZWQgdmlld3MsIGFuZCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gdGhpcyBwYXJ0aWN1bGFyIG5lc3RlZCB2aWV3LlxuICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gdE5vZGU7XG4gICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBjdXJyZW50VmlldyAhO1xuICAgICAgaWYgKGhlYWQpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBhIFZpZXcgb3IgYW4gRWxlbWVudENvbnRhaW5lclxuICAgICAgbmV4dFROb2RlID0gdE5vZGUuY2hpbGQ7XG4gICAgfVxuXG4gICAgaWYgKG5leHRUTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gdGhpcyBsYXN0IG5vZGUgd2FzIHByb2plY3RlZCwgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIGl0cyBwcm9qZWN0aW9uIG5vZGVcbiAgICAgIGlmICh0Tm9kZS5uZXh0ID09PSBudWxsICYmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIExWaWV3RGF0YTtcbiAgICAgICAgdE5vZGUgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgVE5vZGU7XG4gICAgICB9XG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuXG4gICAgICAvKipcbiAgICAgICAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gICAgICAgKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAgICAgICAqXG4gICAgICAgKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoZW4gaXQgZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICAgICAgICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gICAgICAgKi9cbiAgICAgIHdoaWxlICghbmV4dFROb2RlKSB7XG4gICAgICAgIC8vIElmIHBhcmVudCBpcyBudWxsLCB3ZSdyZSBjcm9zc2luZyB0aGUgdmlldyBib3VuZGFyeSwgc28gd2Ugc2hvdWxkIGdldCB0aGUgaG9zdCBUTm9kZS5cbiAgICAgICAgdE5vZGUgPSB0Tm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG5cbiAgICAgICAgaWYgKHROb2RlID09PSBudWxsIHx8IHROb2RlID09PSByb290VE5vZGUpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIFdoZW4gZXhpdGluZyBhIGNvbnRhaW5lciwgdGhlIGJlZm9yZU5vZGUgbXVzdCBiZSByZXN0b3JlZCB0byB0aGUgcHJldmlvdXMgdmFsdWVcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgICBiZWZvcmVOb2RlID0gY3VycmVudFZpZXdbdE5vZGUuaW5kZXhdW05BVElWRV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgJiYgY3VycmVudFZpZXdbTkVYVF0pIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W05FWFRdIGFzIExWaWV3RGF0YTtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gbmV4dFROb2RlO1xuICB9XG59XG5cbi8qKlxuICogR2l2ZW4gYSBjdXJyZW50IHZpZXcsIGZpbmRzIHRoZSBuZWFyZXN0IGNvbXBvbmVudCdzIGhvc3QgKExFbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIExWaWV3RGF0YSBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIGxldCByb290VE5vZGUgPSBsVmlld0RhdGFbSE9TVF9OT0RFXTtcblxuICB3aGlsZSAocm9vdFROb2RlICYmIHJvb3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3RGF0YVtQQVJFTlRdLCAndmlld0RhdGEucGFyZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgICByb290VE5vZGUgPSBsVmlld0RhdGFbSE9TVF9OT0RFXTtcbiAgfVxuXG4gIHJldHVybiBsVmlld0RhdGE7XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIG5vZGU6IFJDb21tZW50IHwgUkVsZW1lbnQgfCBSVGV4dCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmluc2VydEJlZm9yZShwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgcGFyZW50ICEuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykucmVtb3ZlQ2hpbGQocGFyZW50ICEsIG5vZGUpIDpcbiAgICAgICAgcGFyZW50ICEucmVtb3ZlQ2hpbGQobm9kZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUgIShub2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXdEYXRhLCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogYm9vbGVhbiwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBwYXJlbnROb2RlID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICBwYXJlbnROb2RlLCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3W1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBJZiBMVmlld0RhdGEsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3RGF0YS5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgaWYgKGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSBuZXh0ID0gY29udGFpbmVyW1ZJRVdTXVswXTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICFbTkVYVF0gJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBwYXJlbnRWaWV3IFRoZSBuZXcgcGFyZW50IG9mIHRoZSBpbnNlcnRlZCB2aWV3XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHBhcmFtIGNvbnRhaW5lckluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIG5vZGUsIGlmIGR5bmFtaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgbFZpZXc6IExWaWV3RGF0YSwgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcGFyZW50VmlldzogTFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lckluZGV4OiBudW1iZXIpIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXVtORVhUXSA9IGxWaWV3O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgbFZpZXdbTkVYVF0gPSB2aWV3c1tpbmRleF07XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaChsVmlldyk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgLy8gRHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGVpciBwYXJlbnQgY29udGFpbmVyJ3MgaG9zdCBzbyBpdCdzXG4gIC8vIHBvc3NpYmxlIHRvIGp1bXAgZnJvbSBhIHZpZXcgdG8gaXRzIGNvbnRhaW5lcidzIG5leHQgd2hlbiB3YWxraW5nIHRoZSBub2RlIHRyZWUuXG4gIGlmIChjb250YWluZXJJbmRleCA+IC0xKSB7XG4gICAgbFZpZXdbQ09OVEFJTkVSX0lOREVYXSA9IGNvbnRhaW5lckluZGV4O1xuICAgIGxWaWV3W1BBUkVOVF0gPSBwYXJlbnRWaWV3O1xuICB9XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEBwYXJhbSBkZXRhY2hlZCBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgYWxyZWFkeSBkZXRhY2hlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlciwgZGV0YWNoZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgY29uc3Qgdmlld1RvRGV0YWNoID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlld0RhdGE7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgaWYgKCFkZXRhY2hlZCkge1xuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaCwgZmFsc2UpO1xuICB9XG5cbiAgaWYgKHZpZXdUb0RldGFjaFtRVUVSSUVTXSkge1xuICAgIHZpZXdUb0RldGFjaFtRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICB2aWV3VG9EZXRhY2hbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSB0Q29udGFpbmVyIFRoZSBUQ29udGFpbmVyIG5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250YWluZXJIb3N0OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICByZW1vdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZpZXcgPSBsQ29udGFpbmVyW1ZJRVdTXVtyZW1vdmVJbmRleF07XG4gIGRldGFjaFZpZXcobENvbnRhaW5lciwgcmVtb3ZlSW5kZXgsICEhY29udGFpbmVySG9zdC5kZXRhY2hlZCk7XG4gIGRlc3Ryb3lMVmlldyh2aWV3KTtcbn1cblxuLyoqIEdldHMgdGhlIGNoaWxkIG9mIHRoZSBnaXZlbiBMVmlld0RhdGEgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld0NoaWxkKHZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsIHtcbiAgY29uc3QgY2hpbGRJbmRleCA9IHZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4O1xuICByZXR1cm4gY2hpbGRJbmRleCA9PT0gLTEgPyBudWxsIDogdmlld0RhdGFbY2hpbGRJbmRleF07XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbnVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICB3YWxrVE5vZGVUcmVlKHZpZXcsIFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIpO1xuICB9XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgLy8gU2V0cyB0aGUgZGVzdHJveWVkIGZsYWdcbiAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhfFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCB0Tm9kZTtcbiAgaWYgKHN0YXRlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUICYmICh0Tm9kZSA9IChzdGF0ZSBhcyBMVmlld0RhdGEpICFbSE9TVF9OT0RFXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRMQ29udGFpbmVyKHROb2RlIGFzIFRWaWV3Tm9kZSwgc3RhdGUgYXMgTFZpZXdEYXRhKSBhcyBMQ29udGFpbmVyO1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZVtQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZVtQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXdEYXRhIHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGEpLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAodmlld1tUVklFV10uaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3RGF0YVtUVklFV10uY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHJlYWRFbGVtZW50VmFsdWUodmlld0RhdGFbY2xlYW51cFtpICsgMV1dKS5uYXRpdmU7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIG5hdGl2ZS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGxpc3RlbmVyLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDFdXTtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3RGF0YVtDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3LCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXdEYXRhW1RWSUVXXSAmJiB2aWV3RGF0YVtUVklFV10ucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlld0RhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlclBhcmVudCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGlmIChjYW5JbnNlcnROYXRpdmVOb2RlKHROb2RlLCBjdXJyZW50VmlldykpIHtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tIT1NUX05PREVdO1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQgPT0gbnVsbCAmJiBob3N0VE5vZGUgIS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICAgIGdldENvbnRhaW5lclJlbmRlclBhcmVudChob3N0VE5vZGUgYXMgVFZpZXdOb2RlLCBjdXJyZW50VmlldykgOlxuICAgICAgICBnZXRQYXJlbnRMTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpIGFzIExFbGVtZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZkVsZW1lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIElmIHRoZSBwYXJlbnQgaXMgbnVsbCwgdGhlbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zcyB2aWV3cy4gVGhpcyBoYXBwZW5zIHdoZW4gd2VcbiAgLy8gaW5zZXJ0IGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZCBpdFxuICAvLyBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICBpZiAodE5vZGUucGFyZW50ID09IG51bGwgfHxcbiAgICAgIC8vIFdlIHNob3VsZCBhbHNvIGVhZ2VybHkgaW5zZXJ0IGlmIHRoZSBwYXJlbnQgaXMgYSByZWd1bGFyLCBub24tY29tcG9uZW50IGVsZW1lbnRcbiAgICAgIC8vIHNpbmNlIHdlIGtub3cgdGhhdCB0aGlzIHJlbGF0aW9uc2hpcCB3aWxsIG5ldmVyIGJlIGJyb2tlbi5cbiAgICAgIHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCAmJiAhKHROb2RlLnBhcmVudC5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBQYXJlbnQgaXMgYSBDb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhhbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFdlIG1pZ2h0IGRlbGF5IGluc2VydGlvbiBvZiBjaGlsZHJlbiBmb3IgYSBnaXZlbiB2aWV3IGlmIGl0IGlzIGRpc2Nvbm5lY3RlZC5cbiAqIFRoaXMgbWlnaHQgaGFwcGVuIGZvciAyIG1haW4gcmVhc29uczpcbiAqIC0gdmlldyBpcyBub3QgaW5zZXJ0ZWQgaW50byBhbnkgY29udGFpbmVyICh2aWV3IHdhcyBjcmVhdGVkIGJ1dCBub3QgaW5zZXJ0ZWQgeWV0KVxuICogLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAqIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICpcbiAqIEluIG90aGVyIHdvcmRzIHdlIGNhbiBpbnNlcnQgY2hpbGRyZW4gb2YgYSBnaXZlbiB2aWV3IGlmIHRoaXMgdmlldyB3YXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lclxuICogYW5kXG4gKiB0aGUgY29udGFpbmVyIGl0c2VsZiBoYXMgaXRzIHJlbmRlciBwYXJlbnQgZGV0ZXJtaW5lZC5cbiAqL1xuZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcodmlld1ROb2RlOiBUVmlld05vZGUsIHZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICAvLyBCZWNhdXNlIHdlIGFyZSBpbnNlcnRpbmcgaW50byBhIGBWaWV3YCB0aGUgYFZpZXdgIG1heSBiZSBkaXNjb25uZWN0ZWQuXG4gIGNvbnN0IGNvbnRhaW5lciA9IGdldExDb250YWluZXIodmlld1ROb2RlLCB2aWV3KSAhO1xuICBpZiAoY29udGFpbmVyID09IG51bGwgfHwgY29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID09IG51bGwpIHtcbiAgICAvLyBUaGUgYFZpZXdgIGlzIG5vdCBpbnNlcnRlZCBpbnRvIGEgYENvbnRhaW5lcmAgb3IgdGhlIHBhcmVudCBgQ29udGFpbmVyYFxuICAgIC8vIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIFNvIHdlIGhhdmUgdG8gZGVsYXkuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gVGhlIHBhcmVudCBgQ29udGFpbmVyYCBpcyBpbiBpbnNlcnRlZCBzdGF0ZSwgc28gd2UgY2FuIGVhZ2VybHkgaW5zZXJ0IGludG9cbiAgLy8gdGhpcyBsb2NhdGlvbi5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgbmF0aXZlIGVsZW1lbnQgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYXJlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgd2hlcmUgdGhlIGNoaWxkIHdpbGwgYmUgaW5zZXJ0ZWQgaW50by5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIHRoZSBjaGlsZCBzaG91bGQgYmUgaW5zZXJ0ZWQgbm93IChvciBkZWxheWVkIHVudGlsIGxhdGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZU5vZGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IHROb2RlO1xuICBsZXQgcGFyZW50OiBUTm9kZXxudWxsID0gdE5vZGUucGFyZW50O1xuXG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgY3VycmVudE5vZGUgPSBnZXRIaWdoZXN0RWxlbWVudENvbnRhaW5lcih0Tm9kZSk7XG4gICAgcGFyZW50ID0gY3VycmVudE5vZGUucGFyZW50O1xuICB9XG4gIGlmIChwYXJlbnQgPT09IG51bGwpIHBhcmVudCA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG5cbiAgaWYgKHBhcmVudCAmJiBwYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcocGFyZW50IGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIC8vIFBhcmVudCBpcyBhIHJlZ3VsYXIgZWxlbWVudCBvciBhIGNvbXBvbmVudFxuICAgIHJldHVybiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudChjdXJyZW50Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5mdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgZWxlbWVudCB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9LlxuICpcbiAqIEBwYXJhbSBjaGlsZEVsIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKFxuICAgIGNoaWxkRWw6IFJOb2RlIHwgbnVsbCwgY2hpbGRUTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50TE5vZGUgPSBnZXRQYXJlbnRMTm9kZShjaGlsZFROb2RlLCBjdXJyZW50Vmlldyk7XG4gIGNvbnN0IHBhcmVudEVsID0gcGFyZW50TE5vZGUgPyBwYXJlbnRMTm9kZS5uYXRpdmUgOiBudWxsO1xuXG4gIGlmIChjaGlsZEVsICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbSE9TVF9OT0RFXSAhO1xuXG4gICAgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihwYXJlbnRUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KSBhcyBMQ29udGFpbmVyO1xuICAgICAgY29uc3QgcmVuZGVyUGFyZW50ID0gbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXTtcbiAgICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gICAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YoY3VycmVudFZpZXcpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQgIS5uYXRpdmUsIGNoaWxkRWwsXG4gICAgICAgICAgZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXgsIHZpZXdzLCBsQ29udGFpbmVyW05BVElWRV0pKTtcbiAgICB9IGVsc2UgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBsZXQgZWxlbWVudENvbnRhaW5lciA9IGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKGNoaWxkVE5vZGUpO1xuICAgICAgbGV0IG5vZGU6IExFbGVtZW50Tm9kZSA9IGdldFJlbmRlclBhcmVudChlbGVtZW50Q29udGFpbmVyLCBjdXJyZW50VmlldykgITtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgbm9kZS5uYXRpdmUsIGNoaWxkRWwsIHBhcmVudEVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50RWwgIWFzIFJFbGVtZW50LCBjaGlsZEVsKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbCAhLmFwcGVuZENoaWxkKGNoaWxkRWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdG9wLWxldmVsIG5nLWNvbnRhaW5lciBpZiBuZy1jb250YWluZXJzIGFyZSBuZXN0ZWQuXG4gKlxuICogQHBhcmFtIG5nQ29udGFpbmVyIFRoZSBUTm9kZSBvZiB0aGUgc3RhcnRpbmcgbmctY29udGFpbmVyXG4gKiBAcmV0dXJucyB0Tm9kZSBUaGUgVE5vZGUgb2YgdGhlIGhpZ2hlc3QgbGV2ZWwgbmctY29udGFpbmVyXG4gKi9cbmZ1bmN0aW9uIGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKG5nQ29udGFpbmVyOiBUTm9kZSk6IFROb2RlIHtcbiAgd2hpbGUgKG5nQ29udGFpbmVyLnBhcmVudCAhPSBudWxsICYmIG5nQ29udGFpbmVyLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIG5nQ29udGFpbmVyID0gbmdDb250YWluZXIucGFyZW50O1xuICB9XG4gIHJldHVybiBuZ0NvbnRhaW5lcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4OiBudW1iZXIsIHZpZXdzOiBMVmlld0RhdGFbXSwgY29udGFpbmVyTmF0aXZlOiBSQ29tbWVudCkge1xuICBpZiAoaW5kZXggKyAxIDwgdmlld3MubGVuZ3RoKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdzW2luZGV4ICsgMV0gYXMgTFZpZXdEYXRhO1xuICAgIGNvbnN0IHZpZXdUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSBhcyBUVmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdUTm9kZS5jaGlsZCA/IGdldE5hdGl2ZSh2aWV3VE5vZGUuY2hpbGQsIHZpZXcpIDogY29udGFpbmVyTmF0aXZlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjb250YWluZXJOYXRpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBgY2hpbGRgIGVsZW1lbnQgb2YgdGhlIGBwYXJlbnRgIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50RWwgVGhlIHBhcmVudCBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmVtb3ZlIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2hpbGQodE5vZGU6IFROb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGNvbnN0IHBhcmVudE5hdGl2ZSA9IGdldFBhcmVudExOb2RlKHROb2RlLCBjdXJyZW50VmlldykgIS5uYXRpdmUgYXMgUkVsZW1lbnQ7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHROb2RlLCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBXZSBvbmx5IHJlbW92ZSB0aGUgZWxlbWVudCBpZiBub3QgaW4gVmlldyBvciBub3QgcHJvamVjdGVkLlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudE5hdGl2ZSBhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnROYXRpdmUgIS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHByb2plY3RlZFROb2RlIFRoZSBUTm9kZSB0byBiZSBwcm9qZWN0ZWRcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgVGhlIHByb2plY3Rpb24gKG5nLWNvbnRlbnQpIFROb2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlldyAodmlldyBhYm92ZSBjdXJyZW50KVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBwcm9qZWN0ZWRUTm9kZTogVE5vZGUsIHRQcm9qZWN0aW9uTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsXG4gICAgcHJvamVjdGlvblZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmUocHJvamVjdGVkVE5vZGUsIHByb2plY3Rpb25WaWV3KTtcbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICAvLyB0aGUgcHJvamVjdGVkIGNvbnRlbnRzIGFyZSBwcm9jZXNzZWQgd2hpbGUgaW4gdGhlIHNoYWRvdyB2aWV3ICh3aGljaCBpcyB0aGUgY3VycmVudFZpZXcpXG4gIC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIGV4dHJhY3QgdGhlIHZpZXcgd2hlcmUgdGhlIGhvc3QgZWxlbWVudCBsaXZlcyBzaW5jZSBpdCdzIHRoZVxuICAvLyBsb2dpY2FsIGNvbnRhaW5lciBvZiB0aGUgY29udGVudCBwcm9qZWN0ZWQgdmlld3NcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgcHJvamVjdGlvblZpZXcpO1xuXG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudCh0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICBjb25zdCBub2RlT3JDb250YWluZXIgPSBwcm9qZWN0aW9uVmlld1twcm9qZWN0ZWRUTm9kZS5pbmRleF07XG4gIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIGNvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBhbiBlbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ24gdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgbm9kZU9yQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbm9kZU9yQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3c1tpXSwgdHJ1ZSwgbm9kZU9yQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGxldCBuZ0NvbnRhaW5lckNoaWxkVE5vZGU6IFROb2RlfG51bGwgPSBwcm9qZWN0ZWRUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgICAgIHdoaWxlIChuZ0NvbnRhaW5lckNoaWxkVE5vZGUpIHtcbiAgICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShuZ0NvbnRhaW5lckNoaWxkVE5vZGUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcsIHByb2plY3Rpb25WaWV3KTtcbiAgICAgICAgbmdDb250YWluZXJDaGlsZFROb2RlID0gbmdDb250YWluZXJDaGlsZFROb2RlLm5leHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICBub2RlT3JDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnQ7XG4gICAgICBhcHBlbmRDaGlsZChub2RlT3JDb250YWluZXJbTkFUSVZFXSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG4gICAgfVxuICB9XG59XG4iXX0=