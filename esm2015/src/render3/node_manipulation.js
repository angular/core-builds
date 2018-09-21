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
import { attachPatchData, readElementValue } from './context_discovery';
import { callHooks } from './hooks';
import { RENDER_PARENT, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, CONTAINER_INDEX, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { getLNode, stringify } from './util';
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
 * Gets the parent LNode if it's not a view. If it's a view, it will instead return the view's
 * parent container node.
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
export function getParentOrContainerNode(tNode, currentView) {
    /** @type {?} */
    const parentTNode = tNode.parent || currentView[HOST_NODE];
    return parentTNode && parentTNode.type === 2 /* View */ ?
        getContainerNode(parentTNode, currentView) :
        getParentLNode(tNode, currentView);
}
/**
 * @param {?} tNode
 * @param {?} embeddedView
 * @return {?}
 */
export function getContainerNode(tNode, embeddedView) {
    if (tNode.index === -1) {
        /** @type {?} */
        const containerHostIndex = embeddedView[CONTAINER_INDEX];
        return containerHostIndex > -1 ? /** @type {?} */ ((embeddedView[PARENT]))[containerHostIndex].dynamicLContainerNode :
            null;
    }
    else {
        // This is a inline view node (e.g. embeddedViewStart)
        return /** @type {?} */ (getParentLNode(tNode, /** @type {?} */ ((embeddedView[PARENT]))));
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
    const container = getContainerNode(tViewNode, view);
    return container ? container.data[RENDER_PARENT] : null;
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
            /** @type {?} */
            const elementNode = getLNode(tNode, currentView);
            executeNodeAction(action, renderer, parent, /** @type {?} */ ((elementNode.native)), beforeNode);
            if (elementNode.dynamicLContainerNode) {
                executeNodeAction(action, renderer, parent, /** @type {?} */ ((elementNode.dynamicLContainerNode.native)), beforeNode);
            }
        }
        else if (tNode.type === 0 /* Container */) {
            /** @type {?} */
            const lContainerNode = /** @type {?} */ (((currentView))[tNode.index]);
            executeNodeAction(action, renderer, parent, /** @type {?} */ ((lContainerNode.native)), beforeNode);
            /** @type {?} */
            const childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            if (renderParentNode) {
                childContainerData[RENDER_PARENT] = renderParentNode;
            }
            if (childContainerData[VIEWS].length) {
                currentView = childContainerData[VIEWS][0];
                nextTNode = currentView[TVIEW].node;
                // When the walker enters a container, then the beforeNode has to become the local native
                // comment node.
                beforeNode = lContainerNode.dynamicLContainerNode ?
                    lContainerNode.dynamicLContainerNode.native :
                    lContainerNode.native;
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
                    beforeNode = currentView[tNode.index].native;
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
 * @param {?} tContainer The TContainer node associated with the LContainer
 * @param {?} removeIndex The index of the view to remove
 * @return {?}
 */
export function removeView(lContainer, tContainer, removeIndex) {
    /** @type {?} */
    const view = lContainer[VIEWS][removeIndex];
    destroyLView(view);
    detachView(lContainer, removeIndex, !!tContainer.detached);
}
/**
 * Gets the child of the given LViewData
 * @param {?} viewData
 * @return {?}
 */
export function getLViewChild(viewData) {
    if (viewData[TVIEW].childIndex === -1)
        return null;
    /** @type {?} */
    const hostNode = viewData[viewData[TVIEW].childIndex];
    return hostNode.data ? hostNode.data : (/** @type {?} */ (hostNode.dynamicLContainerNode)).data;
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
        return /** @type {?} */ (((getContainerNode(tNode, /** @type {?} */ (state)))).data);
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
    if ((/** @type {?} */ (viewOrContainer))[TVIEW]) {
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
        callHooks(/** @type {?} */ ((view[DIRECTIVES])), destroyHooks);
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
    const container = /** @type {?} */ ((getContainerNode(viewTNode, view)));
    if (container == null || container.data[RENDER_PARENT] == null) {
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
            const container = /** @type {?} */ (getContainerNode(parentTNode, currentView));
            /** @type {?} */
            const renderParent = container.data[RENDER_PARENT];
            /** @type {?} */
            const views = container.data[VIEWS];
            /** @type {?} */
            const index = views.indexOf(currentView);
            nativeInsertBefore(renderer, /** @type {?} */ ((renderParent)).native, childEl, getBeforeNodeForView(index, views, container));
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
 * @param {?} container
 * @return {?}
 */
export function getBeforeNodeForView(index, views, container) {
    if (index + 1 < views.length) {
        /** @type {?} */
        const view = /** @type {?} */ (views[index + 1]);
        /** @type {?} */
        const viewTNode = /** @type {?} */ (view[HOST_NODE]);
        return viewTNode.child ? getLNode(viewTNode.child, view).native : container.native;
    }
    else {
        return container.native;
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
 * @param {?} projectedLNode The node to process
 * @param {?} projectedTNode
 * @param {?} tProjectionNode
 * @param {?} currentView Current LView
 * @param {?} projectionView Projection view
 * @return {?}
 */
export function appendProjectedNode(projectedLNode, projectedTNode, tProjectionNode, currentView, projectionView) {
    appendChild(projectedLNode.native, tProjectionNode, currentView);
    // the projected contents are processed while in the shadow view (which is the currentView)
    // therefore we need to extract the view where the host element lives since it's the
    // logical container of the content projected views
    attachPatchData(projectedLNode.native, projectionView);
    /** @type {?} */
    const renderParent = getRenderParent(tProjectionNode, currentView);
    if (projectedTNode.type === 0 /* Container */) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (projectedLNode)).data;
        lContainer[RENDER_PARENT] = renderParent;
        /** @type {?} */
        const views = lContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(views[i], true, projectedLNode.native);
        }
    }
    else if (projectedTNode.type === 4 /* ElementContainer */) {
        /** @type {?} */
        let ngContainerChildTNode = /** @type {?} */ (projectedTNode.child);
        while (ngContainerChildTNode) {
            /** @type {?} */
            let ngContainerChild = getLNode(ngContainerChildTNode, projectionView);
            appendProjectedNode(/** @type {?} */ (ngContainerChild), ngContainerChildTNode, tProjectionNode, currentView, projectionView);
            ngContainerChildTNode = ngContainerChildTNode.next;
        }
    }
    if (projectedLNode.dynamicLContainerNode) {
        projectedLNode.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(projectedLNode.dynamicLContainerNode.native, tProjectionNode, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsSCxPQUFPLEVBQXdJLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xOLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQW1FLG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzTixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDOztBQUUzQyxNQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7Ozs7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QkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNuRTtLQUNGO1NBQU0sSUFBSSxjQUFjLENBQUMsSUFBSSw2QkFBK0IsRUFBRTs7UUFDN0QsSUFBSSxxQkFBcUIscUJBQWUsY0FBYyxDQUFDLEtBQWMsRUFBQztRQUN0RSxPQUFPLHFCQUFxQixFQUFFOztZQUM1QixJQUFJLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN2RSxtQkFBbUIsbUJBQ2YsZ0JBQXFGLEdBQ3JGLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDekUscUJBQXFCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDO1NBQ3BEO0tBQ0Y7SUFDRCxJQUFJLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRTtRQUN4QyxjQUFjLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztRQUN4RSxXQUFXLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDeEY7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YSwgcmVhZEVsZW1lbnRWYWx1ZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMVGV4dE5vZGUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TE5vZGUsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0ICsgdW51c2VkNTtcblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGV8XG4gICAgTEVsZW1lbnRDb250YWluZXJOb2RlfExDb250YWluZXJOb2RlfG51bGwge1xuICByZXR1cm4gdE5vZGUucGFyZW50ID09IG51bGwgPyBnZXRIb3N0RWxlbWVudE5vZGUoY3VycmVudFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TE5vZGUodE5vZGUucGFyZW50LCBjdXJyZW50Vmlldyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgaG9zdCBMRWxlbWVudE5vZGUgZ2l2ZW4gYSB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBob3N0IGVsZW1lbnQgaXMgYW5cbiAqIExWaWV3Tm9kZSwgc2luY2UgdGhleSBhcmUgYmVpbmcgcGhhc2VkIG91dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhvc3RFbGVtZW50Tm9kZShjdXJyZW50VmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgKGdldExOb2RlKGhvc3RUTm9kZSwgY3VycmVudFZpZXdbUEFSRU5UXSAhKSBhcyBMRWxlbWVudE5vZGUpIDpcbiAgICAgIG51bGw7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IExOb2RlIGlmIGl0J3Mgbm90IGEgdmlldy4gSWYgaXQncyBhIHZpZXcsIGl0IHdpbGwgaW5zdGVhZCByZXR1cm4gdGhlIHZpZXcnc1xuICogcGFyZW50IGNvbnRhaW5lciBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50T3JDb250YWluZXJOb2RlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxcbiAgICBMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8bnVsbCB7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG4gIHJldHVybiBwYXJlbnRUTm9kZSAmJiBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICBnZXRDb250YWluZXJOb2RlKHBhcmVudFROb2RlLCBjdXJyZW50VmlldykgOlxuICAgICAgZ2V0UGFyZW50TE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lck5vZGUodE5vZGU6IFROb2RlLCBlbWJlZGRlZFZpZXc6IExWaWV3RGF0YSk6IExDb250YWluZXJOb2RlfG51bGwge1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBJZiB0aGUgaG9zdCBpbmRleCBpcyAtMSwgdGhlIHZpZXcgaGFzIG5vdCB5ZXQgYmVlbiBpbnNlcnRlZCwgc28gaXQgaGFzIG5vIHBhcmVudC5cbiAgICBjb25zdCBjb250YWluZXJIb3N0SW5kZXggPSBlbWJlZGRlZFZpZXdbQ09OVEFJTkVSX0lOREVYXTtcbiAgICByZXR1cm4gY29udGFpbmVySG9zdEluZGV4ID4gLTEgP1xuICAgICAgICBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW2NvbnRhaW5lckhvc3RJbmRleF0uZHluYW1pY0xDb250YWluZXJOb2RlIDpcbiAgICAgICAgbnVsbDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGEgaW5saW5lIHZpZXcgbm9kZSAoZS5nLiBlbWJlZGRlZFZpZXdTdGFydClcbiAgICByZXR1cm4gZ2V0UGFyZW50TE5vZGUodE5vZGUsIGVtYmVkZGVkVmlld1tQQVJFTlRdICEpIGFzIExDb250YWluZXJOb2RlO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBMRWxlbWVudE5vZGUgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lclJlbmRlclBhcmVudCh0Vmlld05vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRDb250YWluZXJOb2RlKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA6IG51bGw7XG59XG5cbmNvbnN0IGVudW0gV2Fsa1ROb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDAsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAxLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMixcbn1cblxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHdhbGtUTm9kZVRyZWUuXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHdhbGtUTm9kZVRyZWUgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlld0RhdGEgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIFdhbGtzIGEgdHJlZSBvZiBUTm9kZXMsIGFwcGx5aW5nIGEgdHJhbnNmb3JtYXRpb24gb24gdGhlIGVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqXG4gKiBAcGFyYW0gdmlld1RvV2FsayB0aGUgdmlldyB0byB3YWxrXG4gKiBAcGFyYW0gYWN0aW9uIGlkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIExFbGVtZW50IG5vZGVzLlxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSBjdXJyZW50IHJlbmRlcmVyLlxuICogQHBhcmFtIHJlbmRlclBhcmVudE5vZGUgT3B0aW9uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJOb2RlcyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgSW5zZXJ0IGFuZCBEZXN0cm95LlxuICogQHBhcmFtIGJlZm9yZU5vZGUgT3B0aW9uYWwgdGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgcmVxdWlyZWQgZm9yIGFjdGlvblxuICogSW5zZXJ0LlxuICovXG5mdW5jdGlvbiB3YWxrVE5vZGVUcmVlKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHJlbmRlclBhcmVudE5vZGU/OiBMRWxlbWVudE5vZGUgfCBudWxsLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuICBsZXQgY3VycmVudFZpZXcgPSB2aWV3VG9XYWxrO1xuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSByb290VE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGxldCBuZXh0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgPyByZW5kZXJQYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50Tm9kZSA9IGdldExOb2RlKHROb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIGVsZW1lbnROb2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIGlmIChlbGVtZW50Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIGVsZW1lbnROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSBjdXJyZW50VmlldyAhW3ROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudCwgbENvbnRhaW5lck5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIGlmIChyZW5kZXJQYXJlbnROb2RlKSB7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudE5vZGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGlsZENvbnRhaW5lckRhdGFbVklFV1NdLmxlbmd0aCkge1xuICAgICAgICBjdXJyZW50VmlldyA9IGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU11bMF07XG4gICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHdhbGtlciBlbnRlcnMgYSBjb250YWluZXIsIHRoZW4gdGhlIGJlZm9yZU5vZGUgaGFzIHRvIGJlY29tZSB0aGUgbG9jYWwgbmF0aXZlXG4gICAgICAgIC8vIGNvbW1lbnQgbm9kZS5cbiAgICAgICAgYmVmb3JlTm9kZSA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlIDpcbiAgICAgICAgICAgIGxDb250YWluZXJOb2RlLm5hdGl2ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoY3VycmVudFZpZXcgISk7XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE11c3Qgc3RvcmUgYm90aCB0aGUgVE5vZGUgYW5kIHRoZSB2aWV3IGJlY2F1c2UgdGhpcyBwcm9qZWN0aW9uIG5vZGUgY291bGQgYmUgbmVzdGVkXG4gICAgICAvLyBkZWVwbHkgaW5zaWRlIGVtYmVkZGVkIHZpZXdzLCBhbmQgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIHRoaXMgcGFydGljdWxhciBuZXN0ZWQgdmlldy5cbiAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHROb2RlO1xuICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gY3VycmVudFZpZXcgITtcbiAgICAgIGlmIChoZWFkKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgYSBWaWV3IG9yIGFuIEVsZW1lbnRDb250YWluZXJcbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLmNoaWxkO1xuICAgIH1cblxuICAgIGlmIChuZXh0VE5vZGUgPT09IG51bGwpIHtcbiAgICAgIC8vIHRoaXMgbGFzdCBub2RlIHdhcyBwcm9qZWN0ZWQsIHdlIG5lZWQgdG8gZ2V0IGJhY2sgZG93biB0byBpdHMgcHJvamVjdGlvbiBub2RlXG4gICAgICBpZiAodE5vZGUubmV4dCA9PT0gbnVsbCAmJiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSkge1xuICAgICAgICBjdXJyZW50VmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlld0RhdGE7XG4gICAgICAgIHROb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICAgICAgICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gICAgICAgKlxuICAgICAgICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGVuIGl0IGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAgICAgICAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICAgICAgICovXG4gICAgICB3aGlsZSAoIW5leHRUTm9kZSkge1xuICAgICAgICAvLyBJZiBwYXJlbnQgaXMgbnVsbCwgd2UncmUgY3Jvc3NpbmcgdGhlIHZpZXcgYm91bmRhcnksIHNvIHdlIHNob3VsZCBnZXQgdGhlIGhvc3QgVE5vZGUuXG4gICAgICAgIHROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIGlmICh0Tm9kZSA9PT0gbnVsbCB8fCB0Tm9kZSA9PT0gcm9vdFROb2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyBXaGVuIGV4aXRpbmcgYSBjb250YWluZXIsIHRoZSBiZWZvcmVOb2RlIG11c3QgYmUgcmVzdG9yZWQgdG8gdGhlIHByZXZpb3VzIHZhbHVlXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgICAgYmVmb3JlTm9kZSA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XS5uYXRpdmU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgJiYgY3VycmVudFZpZXdbTkVYVF0pIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W05FWFRdIGFzIExWaWV3RGF0YTtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gbmV4dFROb2RlO1xuICB9XG59XG5cbi8qKlxuICogR2l2ZW4gYSBjdXJyZW50IHZpZXcsIGZpbmRzIHRoZSBuZWFyZXN0IGNvbXBvbmVudCdzIGhvc3QgKExFbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIExWaWV3RGF0YSBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIGxldCByb290VE5vZGUgPSBsVmlld0RhdGFbSE9TVF9OT0RFXTtcblxuICB3aGlsZSAocm9vdFROb2RlICYmIHJvb3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3RGF0YVtQQVJFTlRdLCAndmlld0RhdGEucGFyZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgICByb290VE5vZGUgPSBsVmlld0RhdGFbSE9TVF9OT0RFXTtcbiAgfVxuXG4gIHJldHVybiBsVmlld0RhdGE7XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIG5vZGU6IFJDb21tZW50IHwgUkVsZW1lbnQgfCBSVGV4dCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmluc2VydEJlZm9yZShwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgcGFyZW50ICEuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykucmVtb3ZlQ2hpbGQocGFyZW50ICEsIG5vZGUpIDpcbiAgICAgICAgcGFyZW50ICEucmVtb3ZlQ2hpbGQobm9kZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUgIShub2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXdEYXRhLCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogYm9vbGVhbiwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBwYXJlbnROb2RlID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICBwYXJlbnROb2RlLCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3W1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBJZiBMVmlld0RhdGEsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3RGF0YS5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgaWYgKGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSBuZXh0ID0gY29udGFpbmVyW1ZJRVdTXVswXTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICFbTkVYVF0gJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBwYXJlbnRWaWV3IFRoZSBuZXcgcGFyZW50IG9mIHRoZSBpbnNlcnRlZCB2aWV3XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHBhcmFtIGNvbnRhaW5lckluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIG5vZGUsIGlmIGR5bmFtaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgbFZpZXc6IExWaWV3RGF0YSwgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcGFyZW50VmlldzogTFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lckluZGV4OiBudW1iZXIpIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXVtORVhUXSA9IGxWaWV3O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgbFZpZXdbTkVYVF0gPSB2aWV3c1tpbmRleF07XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaChsVmlldyk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgLy8gRHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGVpciBwYXJlbnQgY29udGFpbmVyJ3MgaG9zdCBzbyBpdCdzXG4gIC8vIHBvc3NpYmxlIHRvIGp1bXAgZnJvbSBhIHZpZXcgdG8gaXRzIGNvbnRhaW5lcidzIG5leHQgd2hlbiB3YWxraW5nIHRoZSBub2RlIHRyZWUuXG4gIGlmIChjb250YWluZXJJbmRleCA+IC0xKSB7XG4gICAgbFZpZXdbQ09OVEFJTkVSX0lOREVYXSA9IGNvbnRhaW5lckluZGV4O1xuICAgIGxWaWV3W1BBUkVOVF0gPSBwYXJlbnRWaWV3O1xuICB9XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEBwYXJhbSBkZXRhY2hlZCBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgYWxyZWFkeSBkZXRhY2hlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlciwgZGV0YWNoZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgY29uc3Qgdmlld1RvRGV0YWNoID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlld0RhdGE7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgaWYgKCFkZXRhY2hlZCkge1xuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaCwgZmFsc2UpO1xuICB9XG5cbiAgaWYgKHZpZXdUb0RldGFjaFtRVUVSSUVTXSkge1xuICAgIHZpZXdUb0RldGFjaFtRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICB2aWV3VG9EZXRhY2hbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSB0Q29udGFpbmVyIFRoZSBUQ29udGFpbmVyIG5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCB0Q29udGFpbmVyOiBUQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2aWV3ID0gbENvbnRhaW5lcltWSUVXU11bcmVtb3ZlSW5kZXhdO1xuICBkZXN0cm95TFZpZXcodmlldyk7XG4gIGRldGFjaFZpZXcobENvbnRhaW5lciwgcmVtb3ZlSW5kZXgsICEhdENvbnRhaW5lci5kZXRhY2hlZCk7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXdEYXRhICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZCh2aWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCB7XG4gIGlmICh2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGhvc3ROb2RlOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGUgPSB2aWV3RGF0YVt2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleF07XG5cbiAgcmV0dXJuIGhvc3ROb2RlLmRhdGEgPyBob3N0Tm9kZS5kYXRhIDogKGhvc3ROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIHdhbGtUTm9kZVRyZWUodmlldywgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCByZW5kZXJlcik7XG4gIH1cbiAgZGVzdHJveVZpZXdUcmVlKHZpZXcpO1xuICAvLyBTZXRzIHRoZSBkZXN0cm95ZWQgZmxhZ1xuICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUoc3RhdGU6IExWaWV3RGF0YSB8IExDb250YWluZXIsIHJvb3RWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGF8XG4gICAgTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IHROb2RlO1xuICBpZiAoc3RhdGUubGVuZ3RoID49IEhFQURFUl9PRkZTRVQgJiYgKHROb2RlID0gKHN0YXRlIGFzIExWaWV3RGF0YSkgIVtIT1NUX05PREVdKSAmJlxuICAgICAgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldENvbnRhaW5lck5vZGUodE5vZGUsIHN0YXRlIGFzIExWaWV3RGF0YSkgIS5kYXRhIGFzIGFueTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gc3RhdGVbUEFSRU5UXSA9PT0gcm9vdFZpZXcgPyBudWxsIDogc3RhdGVbUEFSRU5UXTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBhbmQgY2FsbCBhbGwgb25EZXN0cm95cyBpbiBhIGdpdmVuIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3RGF0YSB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YSB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKCh2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhKVtUVklFV10pIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gICAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gICAgZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhcyBjbGVhbiB1cCB0aW1lLlxuICAgIGlmICh2aWV3W1RWSUVXXS5pZCA9PT0gLTEgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgY2xlYW51cCA9IHZpZXdEYXRhW1RWSUVXXS5jbGVhbnVwICE7XG4gIGlmIChjbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHRoZSBuYXRpdmUgcmVuZGVyZXJcbiAgICAgICAgY29uc3QgbmF0aXZlID0gcmVhZEVsZW1lbnRWYWx1ZSh2aWV3RGF0YVtjbGVhbnVwW2kgKyAxXV0pLm5hdGl2ZTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDJdXTtcbiAgICAgICAgbmF0aXZlLnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xlYW51cFtpXSwgbGlzdGVuZXIsIGNsZWFudXBbaSArIDNdKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggcmVuZGVyZXIyIChjbGVhbnVwIGZuIGNhbiBiZSBmb3VuZCBieSBpbmRleClcbiAgICAgICAgY29uc3QgY2xlYW51cEZuID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2ldXTtcbiAgICAgICAgY2xlYW51cEZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMV1dO1xuICAgICAgICBjbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXdEYXRhW0NMRUFOVVBdID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgY2FsbEhvb2tzKHZpZXdbRElSRUNUSVZFU10gISwgZGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKiogQ2FsbHMgcGlwZSBkZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHBpcGVEZXN0cm95SG9va3MgPSB2aWV3RGF0YVtUVklFV10gJiYgdmlld0RhdGFbVFZJRVddLnBpcGVEZXN0cm95SG9va3M7XG4gIGlmIChwaXBlRGVzdHJveUhvb2tzKSB7XG4gICAgY2FsbEhvb2tzKHZpZXdEYXRhICEsIHBpcGVEZXN0cm95SG9va3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXTtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50ID09IG51bGwgJiYgaG9zdFROb2RlICEudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgICBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQoaG9zdFROb2RlIGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpIDpcbiAgICAgICAgZ2V0UGFyZW50TE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSBhcyBMRWxlbWVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZFbGVtZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAvLyBJZiB0aGUgcGFyZW50IGlzIG51bGwsIHRoZW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3Mgdmlld3MuIFRoaXMgaGFwcGVucyB3aGVuIHdlXG4gIC8vIGluc2VydCBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmQgaXRcbiAgLy8gc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgaWYgKHROb2RlLnBhcmVudCA9PSBudWxsIHx8XG4gICAgICAvLyBXZSBzaG91bGQgYWxzbyBlYWdlcmx5IGluc2VydCBpZiB0aGUgcGFyZW50IGlzIGEgcmVndWxhciwgbm9uLWNvbXBvbmVudCBlbGVtZW50XG4gICAgICAvLyBzaW5jZSB3ZSBrbm93IHRoYXQgdGhpcyByZWxhdGlvbnNoaXAgd2lsbCBuZXZlciBiZSBicm9rZW4uXG4gICAgICB0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgISh0Tm9kZS5wYXJlbnQuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gUGFyZW50IGlzIGEgQ29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoYW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBXZSBtaWdodCBkZWxheSBpbnNlcnRpb24gb2YgY2hpbGRyZW4gZm9yIGEgZ2l2ZW4gdmlldyBpZiBpdCBpcyBkaXNjb25uZWN0ZWQuXG4gKiBUaGlzIG1pZ2h0IGhhcHBlbiBmb3IgMiBtYWluIHJlYXNvbnM6XG4gKiAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lciAodmlldyB3YXMgY3JlYXRlZCBidXQgbm90IGluc2VydGVkIHlldClcbiAqIC0gdmlldyBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGJ1dCB0aGUgY29udGFpbmVyIGl0c2VsZiBpcyBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NXG4gKiAoY29udGFpbmVyIG1pZ2h0IGJlIHBhcnQgb2YgcHJvamVjdGlvbiBvciBjaGlsZCBvZiBhIHZpZXcgdGhhdCBpcyBub3QgaW5zZXJ0ZWQgeWV0KS5cbiAqXG4gKiBJbiBvdGhlciB3b3JkcyB3ZSBjYW4gaW5zZXJ0IGNoaWxkcmVuIG9mIGEgZ2l2ZW4gdmlldyBpZiB0aGlzIHZpZXcgd2FzIGluc2VydGVkIGludG8gYSBjb250YWluZXJcbiAqIGFuZFxuICogdGhlIGNvbnRhaW5lciBpdHNlbGYgaGFzIGl0cyByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gKi9cbmZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZWaWV3KHZpZXdUTm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgLy8gQmVjYXVzZSB3ZSBhcmUgaW5zZXJ0aW5nIGludG8gYSBgVmlld2AgdGhlIGBWaWV3YCBtYXkgYmUgZGlzY29ubmVjdGVkLlxuICBjb25zdCBjb250YWluZXIgPSBnZXRDb250YWluZXJOb2RlKHZpZXdUTm9kZSwgdmlldykgITtcbiAgaWYgKGNvbnRhaW5lciA9PSBudWxsIHx8IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdID09IG51bGwpIHtcbiAgICAvLyBUaGUgYFZpZXdgIGlzIG5vdCBpbnNlcnRlZCBpbnRvIGEgYENvbnRhaW5lcmAgb3IgdGhlIHBhcmVudCBgQ29udGFpbmVyYFxuICAgIC8vIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIFNvIHdlIGhhdmUgdG8gZGVsYXkuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gVGhlIHBhcmVudCBgQ29udGFpbmVyYCBpcyBpbiBpbnNlcnRlZCBzdGF0ZSwgc28gd2UgY2FuIGVhZ2VybHkgaW5zZXJ0IGludG9cbiAgLy8gdGhpcyBsb2NhdGlvbi5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgbmF0aXZlIGVsZW1lbnQgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYXJlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgd2hlcmUgdGhlIGNoaWxkIHdpbGwgYmUgaW5zZXJ0ZWQgaW50by5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIHRoZSBjaGlsZCBzaG91bGQgYmUgaW5zZXJ0ZWQgbm93IChvciBkZWxheWVkIHVudGlsIGxhdGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZU5vZGUodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IHROb2RlO1xuICBsZXQgcGFyZW50OiBUTm9kZXxudWxsID0gdE5vZGUucGFyZW50O1xuXG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgY3VycmVudE5vZGUgPSBnZXRIaWdoZXN0RWxlbWVudENvbnRhaW5lcih0Tm9kZSk7XG4gICAgcGFyZW50ID0gY3VycmVudE5vZGUucGFyZW50O1xuICB9XG4gIGlmIChwYXJlbnQgPT09IG51bGwpIHBhcmVudCA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG5cbiAgaWYgKHBhcmVudCAmJiBwYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcocGFyZW50IGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIC8vIFBhcmVudCBpcyBhIHJlZ3VsYXIgZWxlbWVudCBvciBhIGNvbXBvbmVudFxuICAgIHJldHVybiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudChjdXJyZW50Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5mdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgZWxlbWVudCB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9LlxuICpcbiAqIEBwYXJhbSBjaGlsZEVsIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKFxuICAgIGNoaWxkRWw6IFJOb2RlIHwgbnVsbCwgY2hpbGRUTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50TE5vZGUgPSBnZXRQYXJlbnRMTm9kZShjaGlsZFROb2RlLCBjdXJyZW50Vmlldyk7XG4gIGNvbnN0IHBhcmVudEVsID0gcGFyZW50TE5vZGUgPyBwYXJlbnRMTm9kZS5uYXRpdmUgOiBudWxsO1xuXG4gIGlmIChjaGlsZEVsICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbSE9TVF9OT0RFXSAhO1xuXG4gICAgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSBnZXRDb250YWluZXJOb2RlKHBhcmVudFROb2RlLCBjdXJyZW50VmlldykgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgICBjb25zdCByZW5kZXJQYXJlbnQgPSBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgICAgIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGFbVklFV1NdO1xuICAgICAgY29uc3QgaW5kZXggPSB2aWV3cy5pbmRleE9mKGN1cnJlbnRWaWV3KTtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICAgICAgICByZW5kZXJlciwgcmVuZGVyUGFyZW50ICEubmF0aXZlLCBjaGlsZEVsLCBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleCwgdmlld3MsIGNvbnRhaW5lcikpO1xuICAgIH0gZWxzZSBpZiAocGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGxldCBlbGVtZW50Q29udGFpbmVyID0gZ2V0SGlnaGVzdEVsZW1lbnRDb250YWluZXIoY2hpbGRUTm9kZSk7XG4gICAgICBsZXQgbm9kZTogTEVsZW1lbnROb2RlID0gZ2V0UmVuZGVyUGFyZW50KGVsZW1lbnRDb250YWluZXIsIGN1cnJlbnRWaWV3KSAhO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBub2RlLm5hdGl2ZSwgY2hpbGRFbCwgcGFyZW50RWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnRFbCAhYXMgUkVsZW1lbnQsIGNoaWxkRWwpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVsICEuYXBwZW5kQ2hpbGQoY2hpbGRFbCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSB0b3AtbGV2ZWwgbmctY29udGFpbmVyIGlmIG5nLWNvbnRhaW5lcnMgYXJlIG5lc3RlZC5cbiAqXG4gKiBAcGFyYW0gbmdDb250YWluZXIgVGhlIFROb2RlIG9mIHRoZSBzdGFydGluZyBuZy1jb250YWluZXJcbiAqIEByZXR1cm5zIHROb2RlIFRoZSBUTm9kZSBvZiB0aGUgaGlnaGVzdCBsZXZlbCBuZy1jb250YWluZXJcbiAqL1xuZnVuY3Rpb24gZ2V0SGlnaGVzdEVsZW1lbnRDb250YWluZXIobmdDb250YWluZXI6IFROb2RlKTogVE5vZGUge1xuICB3aGlsZSAobmdDb250YWluZXIucGFyZW50ICE9IG51bGwgJiYgbmdDb250YWluZXIucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgbmdDb250YWluZXIgPSBuZ0NvbnRhaW5lci5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIG5nQ29udGFpbmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXg6IG51bWJlciwgdmlld3M6IExWaWV3RGF0YVtdLCBjb250YWluZXI6IExDb250YWluZXJOb2RlKSB7XG4gIGlmIChpbmRleCArIDEgPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld3NbaW5kZXggKyAxXSBhcyBMVmlld0RhdGE7XG4gICAgY29uc3Qgdmlld1ROb2RlID0gdmlld1tIT1NUX05PREVdIGFzIFRWaWV3Tm9kZTtcbiAgICByZXR1cm4gdmlld1ROb2RlLmNoaWxkID8gZ2V0TE5vZGUodmlld1ROb2RlLmNoaWxkLCB2aWV3KS5uYXRpdmUgOiBjb250YWluZXIubmF0aXZlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjb250YWluZXIubmF0aXZlO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgYGNoaWxkYCBlbGVtZW50IG9mIHRoZSBgcGFyZW50YCBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHBhcmVudEVsIFRoZSBwYXJlbnQgZWxlbWVudCBmcm9tIHdoaWNoIHRvIHJlbW92ZSB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjaGlsZCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIHJlbW92ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKHROb2RlOiBUTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBjb25zdCBwYXJlbnROYXRpdmUgPSBnZXRQYXJlbnRMTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpICEubmF0aXZlIGFzIFJFbGVtZW50O1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSByZW1vdmUgdGhlIGVsZW1lbnQgaWYgbm90IGluIFZpZXcgb3Igbm90IHByb2plY3RlZC5cbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnROYXRpdmUgYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50TmF0aXZlICEucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0ZWRMTm9kZSBUaGUgbm9kZSB0byBwcm9jZXNzXG4gKiBAcGFyYW0gcGFyZW50Tm9kZSBUaGUgbGFzdCBwYXJlbnQgZWxlbWVudCB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGVcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKiBAcGFyYW0gcHJvamVjdGlvblZpZXcgUHJvamVjdGlvbiB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIHByb2plY3RlZExOb2RlOiBMRWxlbWVudE5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSxcbiAgICBwcm9qZWN0ZWRUTm9kZTogVE5vZGUsIHRQcm9qZWN0aW9uTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsXG4gICAgcHJvamVjdGlvblZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBhcHBlbmRDaGlsZChwcm9qZWN0ZWRMTm9kZS5uYXRpdmUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuXG4gIC8vIHRoZSBwcm9qZWN0ZWQgY29udGVudHMgYXJlIHByb2Nlc3NlZCB3aGlsZSBpbiB0aGUgc2hhZG93IHZpZXcgKHdoaWNoIGlzIHRoZSBjdXJyZW50VmlldylcbiAgLy8gdGhlcmVmb3JlIHdlIG5lZWQgdG8gZXh0cmFjdCB0aGUgdmlldyB3aGVyZSB0aGUgaG9zdCBlbGVtZW50IGxpdmVzIHNpbmNlIGl0J3MgdGhlXG4gIC8vIGxvZ2ljYWwgY29udGFpbmVyIG9mIHRoZSBjb250ZW50IHByb2plY3RlZCB2aWV3c1xuICBhdHRhY2hQYXRjaERhdGEocHJvamVjdGVkTE5vZGUubmF0aXZlLCBwcm9qZWN0aW9uVmlldyk7XG5cbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuXG4gIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIGNvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBhbiBlbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ24gdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IChwcm9qZWN0ZWRMTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbiAgICBsQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld3NbaV0sIHRydWUsIHByb2plY3RlZExOb2RlLm5hdGl2ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgbGV0IG5nQ29udGFpbmVyQ2hpbGRUTm9kZTogVE5vZGV8bnVsbCA9IHByb2plY3RlZFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICAgIHdoaWxlIChuZ0NvbnRhaW5lckNoaWxkVE5vZGUpIHtcbiAgICAgIGxldCBuZ0NvbnRhaW5lckNoaWxkID0gZ2V0TE5vZGUobmdDb250YWluZXJDaGlsZFROb2RlLCBwcm9qZWN0aW9uVmlldyk7XG4gICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgICAgICAgIG5nQ29udGFpbmVyQ2hpbGQgYXMgTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgbmdDb250YWluZXJDaGlsZFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3LCBwcm9qZWN0aW9uVmlldyk7XG4gICAgICBuZ0NvbnRhaW5lckNoaWxkVE5vZGUgPSBuZ0NvbnRhaW5lckNoaWxkVE5vZGUubmV4dDtcbiAgICB9XG4gIH1cbiAgaWYgKHByb2plY3RlZExOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIHByb2plY3RlZExOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGFwcGVuZENoaWxkKHByb2plY3RlZExOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG59XG4iXX0=