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
import { attachLViewDataToNode } from './element_discovery';
import { callHooks } from './hooks';
import { RENDER_PARENT, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, CONTAINER_INDEX, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { readElementValue, stringify } from './util';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Retrieves the sibling node for the given node.
 * @param {?} node
 * @return {?}
 */
export function getNextLNode(node) {
    // View nodes don't have TNodes, so their next must be retrieved through their LView.
    if (node.tNode.type === 2 /* View */) {
        /** @type {?} */
        const viewData = /** @type {?} */ (node.data);
        return viewData[NEXT] ? (/** @type {?} */ (viewData[NEXT]))[HOST_NODE] : null;
    }
    return node.tNode.next ? node.view[node.tNode.next.index] : null;
}
/**
 * Retrieves the first child of a given node
 * @param {?} node
 * @return {?}
 */
export function getChildLNode(node) {
    if (node.tNode.child) {
        /** @type {?} */
        const viewData = node.tNode.type === 2 /* View */ ? /** @type {?} */ (node.data) : node.view;
        return readElementValue(viewData[node.tNode.child.index]);
    }
    return null;
}
/**
 * @param {?} node
 * @return {?}
 */
export function getParentLNode(node) {
    if (node.tNode.index === -1 && node.tNode.type === 2 /* View */) {
        /** @type {?} */
        const containerHostIndex = (/** @type {?} */ (node.data))[CONTAINER_INDEX];
        return containerHostIndex === -1 ? null : node.view[containerHostIndex].dynamicLContainerNode;
    }
    /** @type {?} */
    const parent = node.tNode.parent;
    return readElementValue(parent ? node.view[parent.index] : node.view[HOST_NODE]);
}
/**
 * Retrieves render parent LElementNode for a given view.
 * Might be null if a view is not yet attatched to any container.
 * @param {?} viewNode
 * @return {?}
 */
function getRenderParent(viewNode) {
    /** @type {?} */
    const container = getParentLNode(viewNode);
    return container ? container.data[RENDER_PARENT] : null;
}
/** @enum {number} */
var WalkLNodeTreeAction = {
    /** node insert in the native environment */
    Insert: 0,
    /** node detach from the native environment */
    Detach: 1,
    /** node destruction using the renderer's API */
    Destroy: 2,
};
/** *
 * Stack used to keep track of projection nodes in walkLNodeTree.
 *
 * This is deliberately created outside of walkLNodeTree to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
  @type {?} */
const projectionNodeStack = [];
/**
 * Walks a tree of LNodes, applying a transformation on the LElement nodes, either only on the first
 * one found, or on all of them.
 *
 * @param {?} startingNode the node from which the walk is started.
 * @param {?} rootNode the root node considered. This prevents walking past that node.
 * @param {?} action identifies the action to be performed on the LElement nodes.
 * @param {?} renderer the current renderer.
 * @param {?=} renderParentNode Optional the render parent node to be set in all LContainerNodes found,
 * required for action modes Insert and Destroy.
 * @param {?=} beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 * @return {?}
 */
function walkLNodeTree(startingNode, rootNode, action, renderer, renderParentNode, beforeNode) {
    /** @type {?} */
    let node = startingNode;
    /** @type {?} */
    let projectionNodeIndex = -1;
    while (node) {
        /** @type {?} */
        let nextNode = null;
        /** @type {?} */
        const parent = renderParentNode ? renderParentNode.native : null;
        /** @type {?} */
        const nodeType = node.tNode.type;
        if (nodeType === 3 /* Element */) {
            // Execute the action
            executeNodeAction(action, renderer, parent, /** @type {?} */ ((node.native)), beforeNode);
            if (node.dynamicLContainerNode) {
                executeNodeAction(action, renderer, parent, /** @type {?} */ ((node.dynamicLContainerNode.native)), beforeNode);
            }
        }
        else if (nodeType === 0 /* Container */) {
            executeNodeAction(action, renderer, parent, /** @type {?} */ ((node.native)), beforeNode);
            /** @type {?} */
            const lContainerNode = (/** @type {?} */ (node));
            /** @type {?} */
            const childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            if (renderParentNode) {
                childContainerData[RENDER_PARENT] = renderParentNode;
            }
            nextNode =
                childContainerData[VIEWS].length ? getChildLNode(childContainerData[VIEWS][0]) : null;
            if (nextNode) {
                // When the walker enters a container, then the beforeNode has to become the local native
                // comment node.
                beforeNode = lContainerNode.dynamicLContainerNode ?
                    lContainerNode.dynamicLContainerNode.native :
                    lContainerNode.native;
            }
        }
        else if (nodeType === 1 /* Projection */) {
            /** @type {?} */
            const componentHost = findComponentHost(node.view);
            /** @type {?} */
            const head = (/** @type {?} */ (componentHost.tNode.projection))[/** @type {?} */ (node.tNode.projection)];
            projectionNodeStack[++projectionNodeIndex] = /** @type {?} */ (node);
            nextNode = head ? /** @type {?} */ (((/** @type {?} */ (componentHost.data))[PARENT]))[head.index] : null;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(/** @type {?} */ (node));
        }
        if (nextNode === null) {
            nextNode = getNextLNode(node);
            // this last node was projected, we need to get back down to its projection node
            if (nextNode === null && (node.tNode.flags & 8192 /* isProjected */)) {
                nextNode = getNextLNode(/** @type {?} */ (projectionNodeStack[projectionNodeIndex--]));
            }
            /**
                   * Find the next node in the LNode tree, taking into account the place where a node is
                   * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
                   *
                   * If there is no sibling node, then it goes to the next sibling of the parent node...
                   * until it reaches rootNode (at which point null is returned).
                   */
            while (node && !nextNode) {
                node = getParentLNode(node);
                if (node === null || node === rootNode)
                    return null;
                // When exiting a container, the beforeNode must be restored to the previous value
                if (!node.tNode.next && nodeType === 0 /* Container */) {
                    beforeNode = node.native;
                }
                nextNode = getNextLNode(node);
            }
        }
        node = nextNode;
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param {?} lViewData LViewData for which we want a host element node
 * @return {?} The host node
 */
export function findComponentHost(lViewData) {
    /** @type {?} */
    let viewRootLNode = lViewData[HOST_NODE];
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'lViewData.parent');
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
        viewRootLNode = lViewData[HOST_NODE];
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertDefined(viewRootLNode.data, 'node.data');
    return /** @type {?} */ (viewRootLNode);
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
 * @param {?} container
 * @param {?} rootNode
 * @param {?} insertMode
 * @param {?=} beforeNode
 * @return {?}
 */
export function addRemoveViewFromContainer(container, rootNode, insertMode, beforeNode) {
    ngDevMode && assertNodeType(container, 0 /* Container */);
    ngDevMode && assertNodeType(rootNode, 2 /* View */);
    /** @type {?} */
    const parentNode = container.data[RENDER_PARENT];
    /** @type {?} */
    const parent = parentNode ? parentNode.native : null;
    if (parent) {
        /** @type {?} */
        let node = getChildLNode(rootNode);
        /** @type {?} */
        const renderer = container.view[RENDERER];
        walkLNodeTree(node, rootNode, insertMode ? 0 /* Insert */ : 1 /* Detach */, renderer, parentNode, beforeNode);
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
                next = container[VIEWS][0].data;
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
 * @param {?} container The container into which the view should be inserted
 * @param {?} viewNode The view to insert
 * @param {?} index The index at which to insert the view
 * @return {?} The inserted view
 */
export function insertView(container, viewNode, index) {
    /** @type {?} */
    const state = container.data;
    /** @type {?} */
    const views = state[VIEWS];
    /** @type {?} */
    const lView = /** @type {?} */ (viewNode.data);
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data[NEXT] = lView;
    }
    if (index < views.length) {
        lView[NEXT] = views[index].data;
        views.splice(index, 0, viewNode);
    }
    else {
        views.push(viewNode);
        lView[NEXT] = null;
    }
    // Dynamically inserted views need a reference to their parent container'S host so it's
    // possible to jump from a view to its container's next when walking the node tree.
    if (viewNode.tNode.index === -1) {
        lView[CONTAINER_INDEX] = /** @type {?} */ ((container.tNode.parent)).index;
        (/** @type {?} */ (viewNode)).view = container.view;
    }
    // Notify query that a new view has been added
    if (lView[QUERIES]) {
        /** @type {?} */ ((lView[QUERIES])).insertView(index);
    }
    // Sets the attached flag
    lView[FLAGS] |= 8 /* Attached */;
    return viewNode;
}
/**
 * Detaches a view from a container.
 *
 * This method splices the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param {?} container The container from which to detach a view
 * @param {?} removeIndex The index of the view to detach
 * @return {?} The detached view
 */
export function detachView(container, removeIndex) {
    /** @type {?} */
    const views = container.data[VIEWS];
    /** @type {?} */
    const viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data[NEXT] = /** @type {?} */ (viewNode.data[NEXT]);
    }
    views.splice(removeIndex, 1);
    if (!container.tNode.detached) {
        addRemoveViewFromContainer(container, viewNode, false);
    }
    /** @type {?} */
    const removedLView = viewNode.data;
    if (removedLView[QUERIES]) {
        /** @type {?} */ ((removedLView[QUERIES])).removeView();
    }
    removedLView[CONTAINER_INDEX] = -1;
    (/** @type {?} */ (viewNode)).view = null;
    // Unsets the attached flag
    viewNode.data[FLAGS] &= ~8 /* Attached */;
    return viewNode;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param {?} container The container from which to remove a view
 * @param {?} removeIndex The index of the view to remove
 * @return {?} The removed view
 */
export function removeView(container, removeIndex) {
    /** @type {?} */
    const viewNode = container.data[VIEWS][removeIndex];
    detachView(container, removeIndex);
    destroyLView(viewNode.data);
    return viewNode;
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
        walkLNodeTree(view[HOST_NODE], view[HOST_NODE], 2 /* Destroy */, renderer);
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
    let node;
    if ((node = /** @type {?} */ (((/** @type {?} */ (state))))[HOST_NODE]) && node.tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return /** @type {?} */ (((getParentLNode(node))).data);
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
 * @param {?} parent
 * @param {?} currentView
 * @return {?}
 */
function canInsertNativeChildOfElement(parent, currentView) {
    if (parent.view !== currentView) {
        // If the Parent view is not the same as current view than we are inserting across
        // Views. This happens when we insert a root element of the component view into
        // the component host element and it should always be eager.
        return true;
    }
    // Parent elements can be a component which may have projection.
    if (parent.data === null) {
        // Parent is a regular non-component element. We should eagerly insert into it
        // since we know that this relationship will never be broken.
        return true;
    }
    // Parent is a Component. Component's content nodes are not inserted immediately
    // because they will be projected, and so doing insert at this point would be wasteful.
    // Since the projection would than move it to its final destination.
    return false;
}
/**
 * We might delay insertion of children for a given view if it is disconnected.
 * This might happen for 2 main reason:
 * - view is not inserted into any container (view was created but not iserted yet)
 * - view is inserted into a container but the container itself is not inserted into the DOM
 * (container might be part of projection or child of a view that is not inserted yet).
 *
 * In other words we can insert children of a given view this view was inserted into a container and
 * the container itself has it render parent determined.
 * @param {?} parent
 * @return {?}
 */
function canInsertNativeChildOfView(parent) {
    ngDevMode && assertNodeType(parent, 2 /* View */);
    /** @type {?} */
    const grandParentContainer = /** @type {?} */ (getParentLNode(parent));
    if (grandParentContainer == null) {
        // The `View` is not inserted into a `Container` we have to delay insertion.
        return false;
    }
    ngDevMode && assertNodeType(grandParentContainer, 0 /* Container */);
    if (grandParentContainer.data[RENDER_PARENT] == null) {
        // The parent `Container` itself is disconnected. So we have to delay.
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
 * @param {?} parent The parent where the child will be inserted into.
 * @param {?} currentView Current LView being processed.
 * @return {?} boolean Whether the child should be inserted now (or delayed until later).
 */
export function canInsertNativeNode(parent, currentView) {
    // We can only insert into a Component or View. Any other type should be an Error.
    ngDevMode && assertNodeOfPossibleTypes(parent, 3 /* Element */, 4 /* ElementContainer */, 2 /* View */);
    if (parent.tNode.type === 3 /* Element */) {
        // Parent is a regular element or a component
        return canInsertNativeChildOfElement(/** @type {?} */ (parent), currentView);
    }
    else if (parent.tNode.type === 4 /* ElementContainer */) {
        /** @type {?} */
        let grandParent = getParentLNode(parent);
        while (grandParent !== null && grandParent.tNode.type === 4 /* ElementContainer */) {
            grandParent = getParentLNode(grandParent);
        }
        if (grandParent === null) {
            return false;
        }
        else if (grandParent.tNode.type === 3 /* Element */) {
            return canInsertNativeChildOfElement(/** @type {?} */ (grandParent), currentView);
        }
        else {
            return canInsertNativeChildOfView(/** @type {?} */ (grandParent));
        }
    }
    else {
        // Parent is a View.
        return canInsertNativeChildOfView(/** @type {?} */ (parent));
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
 * @param {?} parent The parent to which to append the child
 * @param {?} child The child that should be appended
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        if (parent.tNode.type === 2 /* View */) {
            /** @type {?} */
            const container = /** @type {?} */ (getParentLNode(parent));
            /** @type {?} */
            const renderParent = container.data[RENDER_PARENT];
            /** @type {?} */
            const views = container.data[VIEWS];
            /** @type {?} */
            const index = views.indexOf(/** @type {?} */ (parent));
            /** @type {?} */
            const beforeNode = index + 1 < views.length ? (/** @type {?} */ ((getChildLNode(views[index + 1])))).native : container.native;
            nativeInsertBefore(renderer, /** @type {?} */ ((renderParent)).native, child, beforeNode);
        }
        else if (parent.tNode.type === 4 /* ElementContainer */) {
            /** @type {?} */
            const beforeNode = parent.native;
            /** @type {?} */
            let grandParent = getParentLNode(/** @type {?} */ (parent));
            while (grandParent.tNode.type === 4 /* ElementContainer */) {
                grandParent = getParentLNode(/** @type {?} */ (grandParent));
            }
            if (grandParent.tNode.type === 2 /* View */) {
                /** @type {?} */
                const renderParent = getRenderParent(/** @type {?} */ (grandParent));
                nativeInsertBefore(renderer, /** @type {?} */ ((renderParent)).native, child, beforeNode);
            }
            else {
                nativeInsertBefore(renderer, (/** @type {?} */ (grandParent)).native, child, beforeNode);
            }
        }
        else {
            isProceduralRenderer(renderer) ? renderer.appendChild(/** @type {?} */ (((parent.native))), child) : /** @type {?} */ ((parent.native)).appendChild(child);
        }
        return true;
    }
    return false;
}
/**
 * Removes the `child` element of the `parent` from the DOM.
 *
 * @param {?} parent The parent from which to remove the child
 * @param {?} child The child that should be removed
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was removed
 */
export function removeChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.removeChild(/** @type {?} */ (parent.native), child) : /** @type {?} */ ((parent.native)).removeChild(child);
        return true;
    }
    return false;
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param {?} node The node to process
 * @param {?} currentParent The last parent element to be processed
 * @param {?} currentView Current LView
 * @param {?} renderParent
 * @param {?} parentView
 * @return {?}
 */
export function appendProjectedNode(node, currentParent, currentView, renderParent, parentView) {
    appendChild(currentParent, node.native, currentView);
    // the projected contents are processed while in the shadow view (which is the currentView)
    // therefore we need to extract the view where the host element lives since it's the
    // logical container of the content projected views
    attachLViewDataToNode(node.native, parentView);
    if (node.tNode.type === 0 /* Container */) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (node)).data;
        lContainer[RENDER_PARENT] = renderParent;
        /** @type {?} */
        const views = lContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(/** @type {?} */ (node), views[i], true, node.native);
        }
    }
    else if (node.tNode.type === 4 /* ElementContainer */) {
        /** @type {?} */
        let ngContainerChild = getChildLNode(/** @type {?} */ (node));
        /** @type {?} */
        const parentView = currentView[HOST_NODE].view;
        while (ngContainerChild) {
            appendProjectedNode(/** @type {?} */ (ngContainerChild), currentParent, currentView, renderParent, parentView);
            ngContainerChild = getNextLNode(ngContainerChild);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(currentParent, node.dynamicLContainerNode.native, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBYSxhQUFhLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2xILE9BQU8sRUFBa0ksNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNU0sT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBbUUsb0JBQW9CLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkssT0FBTyxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFtQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNOLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7QUFFbkQsTUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFD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Z0IsQ0FBQyxDQUFDO1NBQ25EO0tBQ0Y7SUFDRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUM5QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztRQUM5RCxXQUFXLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDNUU7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaExWaWV3RGF0YVRvTm9kZX0gZnJvbSAnLi9lbGVtZW50X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7cmVhZEVsZW1lbnRWYWx1ZSwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKiogUmV0cmlldmVzIHRoZSBzaWJsaW5nIG5vZGUgZm9yIHRoZSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5leHRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICAvLyBWaWV3IG5vZGVzIGRvbid0IGhhdmUgVE5vZGVzLCBzbyB0aGVpciBuZXh0IG11c3QgYmUgcmV0cmlldmVkIHRocm91Z2ggdGhlaXIgTFZpZXcuXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBub2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuICAgIHJldHVybiB2aWV3RGF0YVtORVhUXSA/ICh2aWV3RGF0YVtORVhUXSBhcyBMVmlld0RhdGEpW0hPU1RfTk9ERV0gOiBudWxsO1xuICB9XG4gIHJldHVybiBub2RlLnROb2RlLm5leHQgPyBub2RlLnZpZXdbbm9kZS50Tm9kZS5uZXh0LmluZGV4XSA6IG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIGZpcnN0IGNoaWxkIG9mIGEgZ2l2ZW4gbm9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkTE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuY2hpbGQpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgPyBub2RlLmRhdGEgYXMgTFZpZXdEYXRhIDogbm9kZS52aWV3O1xuICAgIHJldHVybiByZWFkRWxlbWVudFZhbHVlKHZpZXdEYXRhW25vZGUudE5vZGUuY2hpbGQuaW5kZXhdKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShcbiAgICBub2RlOiBMQ29udGFpbmVyTm9kZSB8IExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExUZXh0Tm9kZSB8XG4gICAgTFByb2plY3Rpb25Ob2RlKTogTEVsZW1lbnROb2RlfExFbGVtZW50Q29udGFpbmVyTm9kZXxMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTFZpZXdOb2RlKTogTENvbnRhaW5lck5vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMRWxlbWVudENvbnRhaW5lck5vZGUpOiBMRWxlbWVudE5vZGV8TEVsZW1lbnRDb250YWluZXJOb2RlfFxuICAgIExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8XG4gICAgTFZpZXdOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TEVsZW1lbnRDb250YWluZXJOb2RlfExDb250YWluZXJOb2RlfFxuICAgIExWaWV3Tm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuaW5kZXggPT09IC0xICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IGluc2lkZSBhIGR5bmFtaWMgY29udGFpbmVyLlxuICAgIC8vIElmIHRoZSBob3N0IGluZGV4IGlzIC0xLCB0aGUgdmlldyBoYXMgbm90IHlldCBiZWVuIGluc2VydGVkLCBzbyBpdCBoYXMgbm8gcGFyZW50LlxuICAgIGNvbnN0IGNvbnRhaW5lckhvc3RJbmRleCA9IChub2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05UQUlORVJfSU5ERVhdO1xuICAgIHJldHVybiBjb250YWluZXJIb3N0SW5kZXggPT09IC0xID8gbnVsbCA6IG5vZGUudmlld1tjb250YWluZXJIb3N0SW5kZXhdLmR5bmFtaWNMQ29udGFpbmVyTm9kZTtcbiAgfVxuICBjb25zdCBwYXJlbnQgPSBub2RlLnROb2RlLnBhcmVudDtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUocGFyZW50ID8gbm9kZS52aWV3W3BhcmVudC5pbmRleF0gOiBub2RlLnZpZXdbSE9TVF9OT0RFXSk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgTEVsZW1lbnROb2RlIGZvciBhIGdpdmVuIHZpZXcuXG4gKiBNaWdodCBiZSBudWxsIGlmIGEgdmlldyBpcyBub3QgeWV0IGF0dGF0Y2hlZCB0byBhbnkgY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodmlld05vZGU6IExWaWV3Tm9kZSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUodmlld05vZGUpO1xuICByZXR1cm4gY29udGFpbmVyID8gY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF0gOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtMTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiB3YWxrTE5vZGVUcmVlLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiB3YWxrTE5vZGVUcmVlIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiBMUHJvamVjdGlvbk5vZGVbXSA9IFtdO1xuXG4vKipcbiAqIFdhbGtzIGEgdHJlZSBvZiBMTm9kZXMsIGFwcGx5aW5nIGEgdHJhbnNmb3JtYXRpb24gb24gdGhlIExFbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHN0YXJ0aW5nTm9kZSB0aGUgbm9kZSBmcm9tIHdoaWNoIHRoZSB3YWxrIGlzIHN0YXJ0ZWQuXG4gKiBAcGFyYW0gcm9vdE5vZGUgdGhlIHJvb3Qgbm9kZSBjb25zaWRlcmVkLiBUaGlzIHByZXZlbnRzIHdhbGtpbmcgcGFzdCB0aGF0IG5vZGUuXG4gKiBAcGFyYW0gYWN0aW9uIGlkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIExFbGVtZW50IG5vZGVzLlxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSBjdXJyZW50IHJlbmRlcmVyLlxuICogQHBhcmFtIHJlbmRlclBhcmVudE5vZGUgT3B0aW9uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJOb2RlcyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgSW5zZXJ0IGFuZCBEZXN0cm95LlxuICogQHBhcmFtIGJlZm9yZU5vZGUgT3B0aW9uYWwgdGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgcmVxdWlyZWQgZm9yIGFjdGlvblxuICogSW5zZXJ0LlxuICovXG5mdW5jdGlvbiB3YWxrTE5vZGVUcmVlKFxuICAgIHN0YXJ0aW5nTm9kZTogTE5vZGUgfCBudWxsLCByb290Tm9kZTogTE5vZGUsIGFjdGlvbjogV2Fsa0xOb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnROb2RlPzogTEVsZW1lbnROb2RlIHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IHN0YXJ0aW5nTm9kZTtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgPyByZW5kZXJQYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gICAgY29uc3Qgbm9kZVR5cGUgPSBub2RlLnROb2RlLnR5cGU7XG4gICAgaWYgKG5vZGVUeXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uXG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgaWYgKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IChub2RlIGFzIExDb250YWluZXJOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBpZiAocmVuZGVyUGFyZW50Tm9kZSkge1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGFbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dE5vZGUgPVxuICAgICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU10ubGVuZ3RoID8gZ2V0Q2hpbGRMTm9kZShjaGlsZENvbnRhaW5lckRhdGFbVklFV1NdWzBdKSA6IG51bGw7XG4gICAgICBpZiAobmV4dE5vZGUpIHtcbiAgICAgICAgLy8gV2hlbiB0aGUgd2Fsa2VyIGVudGVycyBhIGNvbnRhaW5lciwgdGhlbiB0aGUgYmVmb3JlTm9kZSBoYXMgdG8gYmVjb21lIHRoZSBsb2NhbCBuYXRpdmVcbiAgICAgICAgLy8gY29tbWVudCBub2RlLlxuICAgICAgICBiZWZvcmVOb2RlID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgOlxuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUubmF0aXZlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobm9kZVR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gZmluZENvbXBvbmVudEhvc3Qobm9kZS52aWV3KTtcbiAgICAgIGNvbnN0IGhlYWQgPVxuICAgICAgICAgIChjb21wb25lbnRIb3N0LnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtub2RlLnROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gbm9kZSBhcyBMUHJvamVjdGlvbk5vZGU7XG5cbiAgICAgIG5leHROb2RlID0gaGVhZCA/IChjb21wb25lbnRIb3N0LmRhdGEgYXMgTFZpZXdEYXRhKVtQQVJFTlRdICFbaGVhZC5pbmRleF0gOiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbG9vayBhdCB0aGUgZmlyc3QgY2hpbGRcbiAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSk7XG4gICAgfVxuXG4gICAgaWYgKG5leHROb2RlID09PSBudWxsKSB7XG4gICAgICBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZShub2RlKTtcblxuICAgICAgLy8gdGhpcyBsYXN0IG5vZGUgd2FzIHByb2plY3RlZCwgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIGl0cyBwcm9qZWN0aW9uIG5vZGVcbiAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbnVsbCAmJiAobm9kZS50Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpKSB7XG4gICAgICAgIG5leHROb2RlID0gZ2V0TmV4dExOb2RlKHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMTm9kZSk7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gICAgICAgKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAgICAgICAqXG4gICAgICAgKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoZW4gaXQgZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICAgICAgICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gICAgICAgKi9cbiAgICAgIHdoaWxlIChub2RlICYmICFuZXh0Tm9kZSkge1xuICAgICAgICBub2RlID0gZ2V0UGFyZW50TE5vZGUobm9kZSk7XG4gICAgICAgIGlmIChub2RlID09PSBudWxsIHx8IG5vZGUgPT09IHJvb3ROb2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyBXaGVuIGV4aXRpbmcgYSBjb250YWluZXIsIHRoZSBiZWZvcmVOb2RlIG11c3QgYmUgcmVzdG9yZWQgdG8gdGhlIHByZXZpb3VzIHZhbHVlXG4gICAgICAgIGlmICghbm9kZS50Tm9kZS5uZXh0ICYmIG5vZGVUeXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgYmVmb3JlTm9kZSA9IG5vZGUubmF0aXZlO1xuICAgICAgICB9XG4gICAgICAgIG5leHROb2RlID0gZ2V0TmV4dExOb2RlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBub2RlID0gbmV4dE5vZGU7XG4gIH1cbn1cblxuXG4vKipcbiAqIEdpdmVuIGEgY3VycmVudCB2aWV3LCBmaW5kcyB0aGUgbmVhcmVzdCBjb21wb25lbnQncyBob3N0IChMRWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBMVmlld0RhdGEgZm9yIHdoaWNoIHdlIHdhbnQgYSBob3N0IGVsZW1lbnQgbm9kZVxuICogQHJldHVybnMgVGhlIGhvc3Qgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudEhvc3QobFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGUge1xuICBsZXQgdmlld1Jvb3RMTm9kZSA9IGxWaWV3RGF0YVtIT1NUX05PREVdO1xuXG4gIHdoaWxlICh2aWV3Um9vdExOb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdEYXRhW1BBUkVOVF0sICdsVmlld0RhdGEucGFyZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgICB2aWV3Um9vdExOb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld1Jvb3RMTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3Um9vdExOb2RlLmRhdGEsICdub2RlLmRhdGEnKTtcblxuICByZXR1cm4gdmlld1Jvb3RMTm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtMTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIG5vZGU6IFJDb21tZW50IHwgUkVsZW1lbnQgfCBSVGV4dCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkluc2VydCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmluc2VydEJlZm9yZShwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgcGFyZW50ICEuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykucmVtb3ZlQ2hpbGQocGFyZW50ICEsIG5vZGUpIDpcbiAgICAgICAgcGFyZW50ICEucmVtb3ZlQ2hpbGQobm9kZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUgIShub2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHJvb3ROb2RlIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IHRydWUsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogYm9vbGVhbixcbiAgICBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocm9vdE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBpZiAocGFyZW50KSB7XG4gICAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBnZXRDaGlsZExOb2RlKHJvb3ROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbnRhaW5lci52aWV3W1JFTkRFUkVSXTtcbiAgICB3YWxrTE5vZGVUcmVlKFxuICAgICAgICBub2RlLCByb290Tm9kZSwgaW5zZXJ0TW9kZSA/IFdhbGtMTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXRhY2gsXG4gICAgICAgIHJlbmRlcmVyLCBwYXJlbnROb2RlLCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3W1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBJZiBMVmlld0RhdGEsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3RGF0YS5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgaWYgKGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSBuZXh0ID0gY29udGFpbmVyW1ZJRVdTXVswXS5kYXRhO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGVbVklFV1NdO1xuICBjb25zdCBsVmlldyA9IHZpZXdOb2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdLmRhdGFbTkVYVF0gPSBsVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGxWaWV3W05FWFRdID0gdmlld3NbaW5kZXhdLmRhdGE7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaCh2aWV3Tm9kZSk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgLy8gRHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGVpciBwYXJlbnQgY29udGFpbmVyJ1MgaG9zdCBzbyBpdCdzXG4gIC8vIHBvc3NpYmxlIHRvIGp1bXAgZnJvbSBhIHZpZXcgdG8gaXRzIGNvbnRhaW5lcidzIG5leHQgd2hlbiB3YWxraW5nIHRoZSBub2RlIHRyZWUuXG4gIGlmICh2aWV3Tm9kZS50Tm9kZS5pbmRleCA9PT0gLTEpIHtcbiAgICBsVmlld1tDT05UQUlORVJfSU5ERVhdID0gY29udGFpbmVyLnROb2RlLnBhcmVudCAhLmluZGV4O1xuICAgICh2aWV3Tm9kZSBhc3t2aWV3OiBMVmlld0RhdGF9KS52aWV3ID0gY29udGFpbmVyLnZpZXc7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgVGhlIGRldGFjaGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGFbVklFV1NdO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV0uZGF0YVtORVhUXSA9IHZpZXdOb2RlLmRhdGFbTkVYVF0gYXMgTFZpZXdEYXRhO1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGlmICghY29udGFpbmVyLnROb2RlLmRldGFjaGVkKSB7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuICB9XG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb25zdCByZW1vdmVkTFZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAocmVtb3ZlZExWaWV3W1FVRVJJRVNdKSB7XG4gICAgcmVtb3ZlZExWaWV3W1FVRVJJRVNdICEucmVtb3ZlVmlldygpO1xuICB9XG4gIHJlbW92ZWRMVmlld1tDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gICh2aWV3Tm9kZSBhc3t2aWV3OiBMVmlld0RhdGEgfCBudWxsfSkudmlldyA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3Tm9kZS5kYXRhW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqIEByZXR1cm5zIFRoZSByZW1vdmVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdOb2RlID0gY29udGFpbmVyLmRhdGFbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhjb250YWluZXIsIHJlbW92ZUluZGV4KTtcbiAgZGVzdHJveUxWaWV3KHZpZXdOb2RlLmRhdGEpO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXdEYXRhICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZCh2aWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCB7XG4gIGlmICh2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGhvc3ROb2RlOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGUgPSB2aWV3RGF0YVt2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleF07XG5cbiAgcmV0dXJuIGhvc3ROb2RlLmRhdGEgPyBob3N0Tm9kZS5kYXRhIDogKGhvc3ROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIHdhbGtMTm9kZVRyZWUodmlld1tIT1NUX05PREVdLCB2aWV3W0hPU1RfTk9ERV0sIFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIpO1xuICB9XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgLy8gU2V0cyB0aGUgZGVzdHJveWVkIGZsYWdcbiAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhfFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXdEYXRhKSAhW0hPU1RfTk9ERV0pICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldFBhcmVudExOb2RlKG5vZGUpICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlld0RhdGEgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YSlbVFZJRVddKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAodmlld1tUVklFV10uaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3RGF0YVtUVklFV10uY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHJlYWRFbGVtZW50VmFsdWUodmlld0RhdGFbY2xlYW51cFtpICsgMV1dKS5uYXRpdmU7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIG5hdGl2ZS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGxpc3RlbmVyLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDFdXTtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3RGF0YVtDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3W0RJUkVDVElWRVNdICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlld0RhdGFbVFZJRVddICYmIHZpZXdEYXRhW1RWSUVXXS5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3RGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudChwYXJlbnQ6IExFbGVtZW50Tm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBpZiAocGFyZW50LnZpZXcgIT09IGN1cnJlbnRWaWV3KSB7XG4gICAgLy8gSWYgdGhlIFBhcmVudCB2aWV3IGlzIG5vdCB0aGUgc2FtZSBhcyBjdXJyZW50IHZpZXcgdGhhbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zc1xuICAgIC8vIFZpZXdzLiBUaGlzIGhhcHBlbnMgd2hlbiB3ZSBpbnNlcnQgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG9cbiAgICAvLyB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmQgaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBQYXJlbnQgZWxlbWVudHMgY2FuIGJlIGEgY29tcG9uZW50IHdoaWNoIG1heSBoYXZlIHByb2plY3Rpb24uXG4gIGlmIChwYXJlbnQuZGF0YSA9PT0gbnVsbCkge1xuICAgIC8vIFBhcmVudCBpcyBhIHJlZ3VsYXIgbm9uLWNvbXBvbmVudCBlbGVtZW50LiBXZSBzaG91bGQgZWFnZXJseSBpbnNlcnQgaW50byBpdFxuICAgIC8vIHNpbmNlIHdlIGtub3cgdGhhdCB0aGlzIHJlbGF0aW9uc2hpcCB3aWxsIG5ldmVyIGJlIGJyb2tlbi5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIFBhcmVudCBpcyBhIENvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGFuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLlxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogV2UgbWlnaHQgZGVsYXkgaW5zZXJ0aW9uIG9mIGNoaWxkcmVuIGZvciBhIGdpdmVuIHZpZXcgaWYgaXQgaXMgZGlzY29ubmVjdGVkLlxuICogVGhpcyBtaWdodCBoYXBwZW4gZm9yIDIgbWFpbiByZWFzb246XG4gKiAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lciAodmlldyB3YXMgY3JlYXRlZCBidXQgbm90IGlzZXJ0ZWQgeWV0KVxuICogLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAqIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICpcbiAqIEluIG90aGVyIHdvcmRzIHdlIGNhbiBpbnNlcnQgY2hpbGRyZW4gb2YgYSBnaXZlbiB2aWV3IHRoaXMgdmlldyB3YXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBhbmRcbiAqIHRoZSBjb250YWluZXIgaXRzZWxmIGhhcyBpdCByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gKi9cbmZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZWaWV3KHBhcmVudDogTFZpZXdOb2RlKTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwYXJlbnQsIFROb2RlVHlwZS5WaWV3KTtcblxuICAvLyBCZWNhdXNlIHdlIGFyZSBpbnNlcnRpbmcgaW50byBhIGBWaWV3YCB0aGUgYFZpZXdgIG1heSBiZSBkaXNjb25uZWN0ZWQuXG4gIGNvbnN0IGdyYW5kUGFyZW50Q29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUocGFyZW50KSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgaWYgKGdyYW5kUGFyZW50Q29udGFpbmVyID09IG51bGwpIHtcbiAgICAvLyBUaGUgYFZpZXdgIGlzIG5vdCBpbnNlcnRlZCBpbnRvIGEgYENvbnRhaW5lcmAgd2UgaGF2ZSB0byBkZWxheSBpbnNlcnRpb24uXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShncmFuZFBhcmVudENvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlmIChncmFuZFBhcmVudENvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdID09IG51bGwpIHtcbiAgICAvLyBUaGUgcGFyZW50IGBDb250YWluZXJgIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIFNvIHdlIGhhdmUgdG8gZGVsYXkuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gVGhlIHBhcmVudCBgQ29udGFpbmVyYCBpcyBpbiBpbnNlcnRlZCBzdGF0ZSwgc28gd2UgY2FuIGVhZ2VybHkgaW5zZXJ0IGludG9cbiAgLy8gdGhpcyBsb2NhdGlvbi5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgbmF0aXZlIGVsZW1lbnQgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYXJlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgd2hlcmUgdGhlIGNoaWxkIHdpbGwgYmUgaW5zZXJ0ZWQgaW50by5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIHRoZSBjaGlsZCBzaG91bGQgYmUgaW5zZXJ0ZWQgbm93IChvciBkZWxheWVkIHVudGlsIGxhdGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50OiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICAvLyBXZSBjYW4gb25seSBpbnNlcnQgaW50byBhIENvbXBvbmVudCBvciBWaWV3LiBBbnkgb3RoZXIgdHlwZSBzaG91bGQgYmUgYW4gRXJyb3IuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuVmlldyk7XG5cbiAgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIC8vIFBhcmVudCBpcyBhIHJlZ3VsYXIgZWxlbWVudCBvciBhIGNvbXBvbmVudFxuICAgIHJldHVybiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudChwYXJlbnQgYXMgTEVsZW1lbnROb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSBpZiAocGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgLy8gUGFyZW50IGlzIGFuIGVsZW1lbnQgY29udGFpbmVyIChuZy1jb250YWluZXIpLlxuICAgIC8vIEl0cyBncmFuZC1wYXJlbnQgbWlnaHQgYmUgYW4gZWxlbWVudCwgdmlldyBvciBhIHNlcXVlbmNlIG9mIG5nLWNvbnRhaW5lciBwYXJlbnRzLlxuICAgIGxldCBncmFuZFBhcmVudCA9IGdldFBhcmVudExOb2RlKHBhcmVudCk7XG4gICAgd2hpbGUgKGdyYW5kUGFyZW50ICE9PSBudWxsICYmIGdyYW5kUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBncmFuZFBhcmVudCA9IGdldFBhcmVudExOb2RlKGdyYW5kUGFyZW50KTtcbiAgICB9XG4gICAgaWYgKGdyYW5kUGFyZW50ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChncmFuZFBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgcmV0dXJuIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZFbGVtZW50KGdyYW5kUGFyZW50IGFzIExFbGVtZW50Tm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcoZ3JhbmRQYXJlbnQgYXMgTFZpZXdOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gUGFyZW50IGlzIGEgVmlldy5cbiAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcocGFyZW50IGFzIExWaWV3Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5mdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgZWxlbWVudCB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9LlxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCB0byB3aGljaCB0byBhcHBlbmQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKHBhcmVudDogTE5vZGUsIGNoaWxkOiBSTm9kZSB8IG51bGwsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBpZiAocGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSBnZXRQYXJlbnRMTm9kZShwYXJlbnQpIGFzIExDb250YWluZXJOb2RlO1xuICAgICAgY29uc3QgcmVuZGVyUGFyZW50ID0gY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF07XG4gICAgICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhW1ZJRVdTXTtcbiAgICAgIGNvbnN0IGluZGV4ID0gdmlld3MuaW5kZXhPZihwYXJlbnQgYXMgTFZpZXdOb2RlKTtcbiAgICAgIGNvbnN0IGJlZm9yZU5vZGUgPVxuICAgICAgICAgIGluZGV4ICsgMSA8IHZpZXdzLmxlbmd0aCA/IChnZXRDaGlsZExOb2RlKHZpZXdzW2luZGV4ICsgMV0pICEpLm5hdGl2ZSA6IGNvbnRhaW5lci5uYXRpdmU7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCAhLm5hdGl2ZSwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICAgIH0gZWxzZSBpZiAocGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBjb25zdCBiZWZvcmVOb2RlID0gcGFyZW50Lm5hdGl2ZTtcbiAgICAgIGxldCBncmFuZFBhcmVudCA9IGdldFBhcmVudExOb2RlKHBhcmVudCBhcyBMRWxlbWVudENvbnRhaW5lck5vZGUpO1xuICAgICAgd2hpbGUgKGdyYW5kUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIGdyYW5kUGFyZW50ID0gZ2V0UGFyZW50TE5vZGUoZ3JhbmRQYXJlbnQgYXMgTEVsZW1lbnRDb250YWluZXJOb2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChncmFuZFBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRSZW5kZXJQYXJlbnQoZ3JhbmRQYXJlbnQgYXMgTFZpZXdOb2RlKTtcbiAgICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQgIS5uYXRpdmUsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgKGdyYW5kUGFyZW50IGFzIExFbGVtZW50Tm9kZSkubmF0aXZlLCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudC5uYXRpdmUgIWFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGBjaGlsZGAgZWxlbWVudCBvZiB0aGUgYHBhcmVudGAgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBmcm9tIHdoaWNoIHRvIHJlbW92ZSB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjaGlsZCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIHJlbW92ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKHBhcmVudDogTE5vZGUsIGNoaWxkOiBSTm9kZSB8IG51bGwsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBXZSBvbmx5IHJlbW92ZSB0aGUgZWxlbWVudCBpZiBub3QgaW4gVmlldyBvciBub3QgcHJvamVjdGVkLlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudC5uYXRpdmUgYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHByb2plY3RlZCBub2RlIHRvIHRoZSBET00sIG9yIGluIHRoZSBjYXNlIG9mIGEgcHJvamVjdGVkIGNvbnRhaW5lcixcbiAqIGFwcGVuZHMgdGhlIG5vZGVzIGZyb20gYWxsIG9mIHRoZSBjb250YWluZXIncyBhY3RpdmUgdmlld3MgdG8gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB0byBwcm9jZXNzXG4gKiBAcGFyYW0gY3VycmVudFBhcmVudCBUaGUgbGFzdCBwYXJlbnQgZWxlbWVudCB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlLFxuICAgIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExWaWV3Tm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSxcbiAgICByZW5kZXJQYXJlbnQ6IExFbGVtZW50Tm9kZSwgcGFyZW50VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUubmF0aXZlLCBjdXJyZW50Vmlldyk7XG5cbiAgLy8gdGhlIHByb2plY3RlZCBjb250ZW50cyBhcmUgcHJvY2Vzc2VkIHdoaWxlIGluIHRoZSBzaGFkb3cgdmlldyAod2hpY2ggaXMgdGhlIGN1cnJlbnRWaWV3KVxuICAvLyB0aGVyZWZvcmUgd2UgbmVlZCB0byBleHRyYWN0IHRoZSB2aWV3IHdoZXJlIHRoZSBob3N0IGVsZW1lbnQgbGl2ZXMgc2luY2UgaXQncyB0aGVcbiAgLy8gbG9naWNhbCBjb250YWluZXIgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGVkIHZpZXdzXG4gIGF0dGFjaExWaWV3RGF0YVRvTm9kZShub2RlLm5hdGl2ZSwgcGFyZW50Vmlldyk7XG5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBjb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gYW4gZWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbiAgICBsQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobm9kZSBhcyBMQ29udGFpbmVyTm9kZSwgdmlld3NbaV0sIHRydWUsIG5vZGUubmF0aXZlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIGxldCBuZ0NvbnRhaW5lckNoaWxkID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExFbGVtZW50Q29udGFpbmVyTm9kZSk7XG4gICAgY29uc3QgcGFyZW50VmlldyA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV0udmlldztcbiAgICB3aGlsZSAobmdDb250YWluZXJDaGlsZCkge1xuICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICAgICAgICBuZ0NvbnRhaW5lckNoaWxkIGFzIExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlLFxuICAgICAgICAgIGN1cnJlbnRQYXJlbnQsIGN1cnJlbnRWaWV3LCByZW5kZXJQYXJlbnQsIHBhcmVudFZpZXcpO1xuICAgICAgbmdDb250YWluZXJDaGlsZCA9IGdldE5leHRMTm9kZShuZ0NvbnRhaW5lckNoaWxkKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUsIGN1cnJlbnRWaWV3KTtcbiAgfVxufVxuIl19