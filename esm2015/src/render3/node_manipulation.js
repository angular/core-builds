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
            const elementNode = readElementValue(/** @type {?} */ ((currentView))[tNode.index]);
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
                currentView = childContainerData[VIEWS][0].data;
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
            const componentHost = findComponentHost(/** @type {?} */ ((currentView)));
            /** @type {?} */
            const head = (/** @type {?} */ (componentHost.tNode.projection))[/** @type {?} */ (tNode.projection)];
            // Must store both the TNode and the view because this projection node could be nested
            // deeply inside embedded views, and we need to get back down to this particular nested view.
            projectionNodeStack[++projectionNodeIndex] = tNode;
            projectionNodeStack[++projectionNodeIndex] = /** @type {?} */ ((currentView));
            if (head) {
                currentView = /** @type {?} */ (((/** @type {?} */ (componentHost.data))[PARENT]));
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
export function findComponentHost(lViewData) {
    /** @type {?} */
    let viewRootLNode = lViewData[HOST_NODE];
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'lViewData.parent');
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
        viewRootLNode = lViewData[HOST_NODE];
    }
    ngDevMode && assertNodeType(viewRootLNode.tNode, 3 /* Element */);
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
 * @param {?} viewToWalk
 * @param {?} insertMode
 * @param {?=} beforeNode
 * @return {?}
 */
export function addRemoveViewFromContainer(container, viewToWalk, insertMode, beforeNode) {
    /** @type {?} */
    const parentNode = container.data[RENDER_PARENT];
    /** @type {?} */
    const parent = parentNode ? parentNode.native : null;
    ngDevMode && assertNodeType(/** @type {?} */ (viewToWalk[TVIEW].node), 2 /* View */);
    if (parent) {
        /** @type {?} */
        const renderer = container.view[RENDERER];
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
        addRemoveViewFromContainer(container, viewNode.data, false);
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
    destroyLView(viewNode.data);
    detachView(container, removeIndex);
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
    ngDevMode && assertNodeType(parent.tNode, 2 /* View */);
    /** @type {?} */
    const grandParentContainer = /** @type {?} */ (getParentLNode(parent));
    if (grandParentContainer == null) {
        // The `View` is not inserted into a `Container` we have to delay insertion.
        return false;
    }
    ngDevMode && assertNodeType(grandParentContainer.tNode, 0 /* Container */);
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
    ngDevMode && assertNodeOfPossibleTypes(parent.tNode, 3 /* Element */, 4 /* ElementContainer */, 2 /* View */);
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
    attachPatchData(node.native, parentView);
    if (node.tNode.type === 0 /* Container */) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (node)).data;
        lContainer[RENDER_PARENT] = renderParent;
        /** @type {?} */
        const views = lContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            /** @type {?} */
            const viewNode = views[i];
            addRemoveViewFromContainer(/** @type {?} */ (node), viewNode.data, true, node.native);
        }
    }
    else if (node.tNode.type === 4 /* ElementContainer */) {
        /** @type {?} */
        let ngContainerChild = getChildLNode(/** @type {?} */ (node));
        /** @type {?} */
        const parentView = /** @type {?} */ ((currentView[PARENT]));
        while (ngContainerChild) {
            appendProjectedNode(/** @type {?} */ (ngContainerChild), currentParent, currentView, renderParent, parentView);
            ngContainerChild = ngContainerChild.tNode.next ?
                readElementValue(ngContainerChild.view[ngContainerChild.tNode.next.index]) :
                null;
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(currentParent, node.dynamicLContainerNode.native, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsSCxPQUFPLEVBQTZJLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZOLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQW1FLG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFvQixVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQW1DLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN08sT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDOztBQUVuRCxNQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7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QixtQkFDZixnQkFBcUYsR0FDckYsYUFBYSxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUQsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVFLElBQUksQ0FBQztTQUNWO0tBQ0Y7SUFDRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUM5QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztRQUM5RCxXQUFXLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDNUU7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgREVDTEFSQVRJT05fVklFVywgRElSRUNUSVZFUywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgSG9va0RhdGEsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtyZWFkRWxlbWVudFZhbHVlLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIGZpcnN0IGNoaWxkIG9mIGEgZ2l2ZW4gbm9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkTE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuY2hpbGQpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgPyBub2RlLmRhdGEgYXMgTFZpZXdEYXRhIDogbm9kZS52aWV3O1xuICAgIHJldHVybiByZWFkRWxlbWVudFZhbHVlKHZpZXdEYXRhW25vZGUudE5vZGUuY2hpbGQuaW5kZXhdKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShcbiAgICBub2RlOiBMQ29udGFpbmVyTm9kZSB8IExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExUZXh0Tm9kZSB8XG4gICAgTFByb2plY3Rpb25Ob2RlKTogTEVsZW1lbnROb2RlfExFbGVtZW50Q29udGFpbmVyTm9kZXxMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTFZpZXdOb2RlKTogTENvbnRhaW5lck5vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMRWxlbWVudENvbnRhaW5lck5vZGUpOiBMRWxlbWVudE5vZGV8TEVsZW1lbnRDb250YWluZXJOb2RlfFxuICAgIExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8XG4gICAgTFZpZXdOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TEVsZW1lbnRDb250YWluZXJOb2RlfExDb250YWluZXJOb2RlfFxuICAgIExWaWV3Tm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuaW5kZXggPT09IC0xICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IGluc2lkZSBhIGR5bmFtaWMgY29udGFpbmVyLlxuICAgIC8vIElmIHRoZSBob3N0IGluZGV4IGlzIC0xLCB0aGUgdmlldyBoYXMgbm90IHlldCBiZWVuIGluc2VydGVkLCBzbyBpdCBoYXMgbm8gcGFyZW50LlxuICAgIGNvbnN0IGNvbnRhaW5lckhvc3RJbmRleCA9IChub2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05UQUlORVJfSU5ERVhdO1xuICAgIHJldHVybiBjb250YWluZXJIb3N0SW5kZXggPT09IC0xID8gbnVsbCA6IG5vZGUudmlld1tjb250YWluZXJIb3N0SW5kZXhdLmR5bmFtaWNMQ29udGFpbmVyTm9kZTtcbiAgfVxuICBjb25zdCBwYXJlbnQgPSBub2RlLnROb2RlLnBhcmVudDtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUocGFyZW50ID8gbm9kZS52aWV3W3BhcmVudC5pbmRleF0gOiBub2RlLnZpZXdbSE9TVF9OT0RFXSk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgTEVsZW1lbnROb2RlIGZvciBhIGdpdmVuIHZpZXcuXG4gKiBNaWdodCBiZSBudWxsIGlmIGEgdmlldyBpcyBub3QgeWV0IGF0dGF0Y2hlZCB0byBhbnkgY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodmlld05vZGU6IExWaWV3Tm9kZSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUodmlld05vZGUpO1xuICByZXR1cm4gY29udGFpbmVyID8gY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF0gOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiB3YWxrVE5vZGVUcmVlLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiB3YWxrVE5vZGVUcmVlIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXdEYXRhIHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgVE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBlbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgdGhlIHZpZXcgdG8gd2Fsa1xuICogQHBhcmFtIGFjdGlvbiBpZGVudGlmaWVzIHRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBMRWxlbWVudCBub2Rlcy5cbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnROb2RlIE9wdGlvbmFsIHRoZSByZW5kZXIgcGFyZW50IG5vZGUgdG8gYmUgc2V0IGluIGFsbCBMQ29udGFpbmVyTm9kZXMgZm91bmQsXG4gKiByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIEluc2VydCBhbmQgRGVzdHJveS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIEluc2VydC5cbiAqL1xuZnVuY3Rpb24gd2Fsa1ROb2RlVHJlZShcbiAgICB2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnROb2RlPzogTEVsZW1lbnROb2RlIHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBjb25zdCByb290VE5vZGUgPSB2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZTtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgbGV0IGN1cnJlbnRWaWV3ID0gdmlld1RvV2FsaztcbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gcm9vdFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBsZXQgbmV4dFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICBjb25zdCBwYXJlbnQgPSByZW5kZXJQYXJlbnROb2RlID8gcmVuZGVyUGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudE5vZGUgPSByZWFkRWxlbWVudFZhbHVlKGN1cnJlbnRWaWV3ICFbdE5vZGUuaW5kZXhdKTtcbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudCwgZWxlbWVudE5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgaWYgKGVsZW1lbnROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICBleGVjdXRlTm9kZUFjdGlvbihcbiAgICAgICAgICAgIGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudCwgZWxlbWVudE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IGN1cnJlbnRWaWV3ICFbdE5vZGUuaW5kZXhdIGFzIExDb250YWluZXJOb2RlO1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBsQ29udGFpbmVyTm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICBjb25zdCBjaGlsZENvbnRhaW5lckRhdGE6IExDb250YWluZXIgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhIDpcbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgICAgaWYgKHJlbmRlclBhcmVudE5vZGUpIHtcbiAgICAgICAgY2hpbGRDb250YWluZXJEYXRhW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50Tm9kZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU10ubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXVswXS5kYXRhO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZW50ZXJzIGEgY29udGFpbmVyLCB0aGVuIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZWNvbWUgdGhlIGxvY2FsIG5hdGl2ZVxuICAgICAgICAvLyBjb21tZW50IG5vZGUuXG4gICAgICAgIGJlZm9yZU5vZGUgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSA6XG4gICAgICAgICAgICBsQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGZpbmRDb21wb25lbnRIb3N0KGN1cnJlbnRWaWV3ICEpO1xuICAgICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QudE5vZGUucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgLy8gTXVzdCBzdG9yZSBib3RoIHRoZSBUTm9kZSBhbmQgdGhlIHZpZXcgYmVjYXVzZSB0aGlzIHByb2plY3Rpb24gbm9kZSBjb3VsZCBiZSBuZXN0ZWRcbiAgICAgIC8vIGRlZXBseSBpbnNpZGUgZW1iZWRkZWQgdmlld3MsIGFuZCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gdGhpcyBwYXJ0aWN1bGFyIG5lc3RlZCB2aWV3LlxuICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gdE5vZGU7XG4gICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBjdXJyZW50VmlldyAhO1xuICAgICAgaWYgKGhlYWQpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSAoY29tcG9uZW50SG9zdC5kYXRhIGFzIExWaWV3RGF0YSlbUEFSRU5UXSAhO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGEgVmlldyBvciBhbiBFbGVtZW50Q29udGFpbmVyXG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5jaGlsZDtcbiAgICB9XG5cbiAgICBpZiAobmV4dFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKHROb2RlLm5leHQgPT09IG51bGwgJiYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXdEYXRhO1xuICAgICAgICB0Tm9kZSA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG5cbiAgICAgIC8qKlxuICAgICAgICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAgICAgICAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICAgICAgICpcbiAgICAgICAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhlbiBpdCBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gICAgICAgKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAgICAgICAqL1xuICAgICAgd2hpbGUgKCFuZXh0VE5vZGUpIHtcbiAgICAgICAgLy8gSWYgcGFyZW50IGlzIG51bGwsIHdlJ3JlIGNyb3NzaW5nIHRoZSB2aWV3IGJvdW5kYXJ5LCBzbyB3ZSBzaG91bGQgZ2V0IHRoZSBob3N0IFROb2RlLlxuICAgICAgICB0Tm9kZSA9IHROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICBpZiAodE5vZGUgPT09IG51bGwgfHwgdE5vZGUgPT09IHJvb3RUTm9kZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gV2hlbiBleGl0aW5nIGEgY29udGFpbmVyLCB0aGUgYmVmb3JlTm9kZSBtdXN0IGJlIHJlc3RvcmVkIHRvIHRoZSBwcmV2aW91cyB2YWx1ZVxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF0ubmF0aXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ICYmIGN1cnJlbnRWaWV3W05FWFRdKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tORVhUXSBhcyBMVmlld0RhdGE7XG4gICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IG5leHRUTm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIEdpdmVuIGEgY3VycmVudCB2aWV3LCBmaW5kcyB0aGUgbmVhcmVzdCBjb21wb25lbnQncyBob3N0IChMRWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBMVmlld0RhdGEgZm9yIHdoaWNoIHdlIHdhbnQgYSBob3N0IGVsZW1lbnQgbm9kZVxuICogQHJldHVybnMgVGhlIGhvc3Qgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudEhvc3QobFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGUge1xuICBsZXQgdmlld1Jvb3RMTm9kZSA9IGxWaWV3RGF0YVtIT1NUX05PREVdO1xuXG4gIHdoaWxlICh2aWV3Um9vdExOb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdEYXRhW1BBUkVOVF0sICdsVmlld0RhdGEucGFyZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgICB2aWV3Um9vdExOb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld1Jvb3RMTm9kZS50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3Um9vdExOb2RlLmRhdGEsICdub2RlLmRhdGEnKTtcblxuICByZXR1cm4gdmlld1Jvb3RMTm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIG5vZGU6IFJDb21tZW50IHwgUkVsZW1lbnQgfCBSVGV4dCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmluc2VydEJlZm9yZShwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgcGFyZW50ICEuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykucmVtb3ZlQ2hpbGQocGFyZW50ICEsIG5vZGUpIDpcbiAgICAgICAgcGFyZW50ICEucmVtb3ZlQ2hpbGQobm9kZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUgIShub2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHZpZXdUb1dhbGsgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld1RvV2FsazogTFZpZXdEYXRhLCBpbnNlcnRNb2RlOiB0cnVlLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld1RvV2FsazogTFZpZXdEYXRhLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld1RvV2FsazogTFZpZXdEYXRhLCBpbnNlcnRNb2RlOiBib29sZWFuLFxuICAgIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld1RvV2Fsa1tUVklFV10ubm9kZSBhcyBUTm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICBpZiAocGFyZW50KSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlld1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICBwYXJlbnROb2RlLCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3W1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBJZiBMVmlld0RhdGEsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3RGF0YS5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgaWYgKGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSBuZXh0ID0gY29udGFpbmVyW1ZJRVdTXVswXS5kYXRhO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGVbVklFV1NdO1xuICBjb25zdCBsVmlldyA9IHZpZXdOb2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdLmRhdGFbTkVYVF0gPSBsVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGxWaWV3W05FWFRdID0gdmlld3NbaW5kZXhdLmRhdGE7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaCh2aWV3Tm9kZSk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgLy8gRHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGVpciBwYXJlbnQgY29udGFpbmVyJ1MgaG9zdCBzbyBpdCdzXG4gIC8vIHBvc3NpYmxlIHRvIGp1bXAgZnJvbSBhIHZpZXcgdG8gaXRzIGNvbnRhaW5lcidzIG5leHQgd2hlbiB3YWxraW5nIHRoZSBub2RlIHRyZWUuXG4gIGlmICh2aWV3Tm9kZS50Tm9kZS5pbmRleCA9PT0gLTEpIHtcbiAgICBsVmlld1tDT05UQUlORVJfSU5ERVhdID0gY29udGFpbmVyLnROb2RlLnBhcmVudCAhLmluZGV4O1xuICAgICh2aWV3Tm9kZSBhc3t2aWV3OiBMVmlld0RhdGF9KS52aWV3ID0gY29udGFpbmVyLnZpZXc7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgVGhlIGRldGFjaGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGFbVklFV1NdO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV0uZGF0YVtORVhUXSA9IHZpZXdOb2RlLmRhdGFbTkVYVF0gYXMgTFZpZXdEYXRhO1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGlmICghY29udGFpbmVyLnROb2RlLmRldGFjaGVkKSB7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZS5kYXRhLCBmYWxzZSk7XG4gIH1cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgdmlldyBoYXMgYmVlbiByZW1vdmVkXG4gIGNvbnN0IHJlbW92ZWRMVmlldyA9IHZpZXdOb2RlLmRhdGE7XG4gIGlmIChyZW1vdmVkTFZpZXdbUVVFUklFU10pIHtcbiAgICByZW1vdmVkTFZpZXdbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gIH1cbiAgcmVtb3ZlZExWaWV3W0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgKHZpZXdOb2RlIGFze3ZpZXc6IExWaWV3RGF0YSB8IG51bGx9KS52aWV3ID0gbnVsbDtcbiAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIHZpZXdOb2RlLmRhdGFbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lciwgaS5lLiBkZXRhY2hlcyBpdCBhbmQgdGhlbiBkZXN0cm95cyB0aGUgdW5kZXJseWluZyBMVmlldy5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICogQHJldHVybnMgVGhlIHJlbW92ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld05vZGUgPSBjb250YWluZXIuZGF0YVtWSUVXU11bcmVtb3ZlSW5kZXhdO1xuICBkZXN0cm95TFZpZXcodmlld05vZGUuZGF0YSk7XG4gIGRldGFjaFZpZXcoY29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIGNoaWxkIG9mIHRoZSBnaXZlbiBMVmlld0RhdGEgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld0NoaWxkKHZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsIHtcbiAgaWYgKHZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaG9zdE5vZGU6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZSA9IHZpZXdEYXRhW3ZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4XTtcblxuICByZXR1cm4gaG9zdE5vZGUuZGF0YSA/IGhvc3ROb2RlLmRhdGEgOiAoaG9zdE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xufVxuXG4vKipcbiAqIEEgc3RhbmRhbG9uZSBmdW5jdGlvbiB3aGljaCBkZXN0cm95cyBhbiBMVmlldyxcbiAqIGNvbmR1Y3RpbmcgY2xlYW51cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gYmUgZGVzdHJveWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUxWaWV3KHZpZXc6IExWaWV3RGF0YSkge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgd2Fsa1ROb2RlVHJlZSh2aWV3LCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyKTtcbiAgfVxuICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIC8vIFNldHMgdGhlIGRlc3Ryb3llZCBmbGFnXG4gIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXdEYXRhIHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxcbiAgICBMQ29udGFpbmVyfG51bGwge1xuICBsZXQgbm9kZTtcbiAgaWYgKChub2RlID0gKHN0YXRlIGFzIExWaWV3RGF0YSkgIVtIT1NUX05PREVdKSAmJiBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRQYXJlbnRMTm9kZShub2RlKSAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZVtQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZVtQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXdEYXRhIHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGEpW1RWSUVXXSkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKHZpZXdbVFZJRVddLmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBjbGVhbnVwID0gdmlld0RhdGFbVFZJRVddLmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggdGhlIG5hdGl2ZSByZW5kZXJlclxuICAgICAgICBjb25zdCBuYXRpdmUgPSByZWFkRWxlbWVudFZhbHVlKHZpZXdEYXRhW2NsZWFudXBbaSArIDFdXSkubmF0aXZlO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMl1dO1xuICAgICAgICBuYXRpdmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBsaXN0ZW5lciwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaV1dO1xuICAgICAgICBjbGVhbnVwRm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlld0RhdGFbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlld1tESVJFQ1RJVkVTXSAhLCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXdEYXRhW1RWSUVXXSAmJiB2aWV3RGF0YVtUVklFV10ucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlld0RhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZkVsZW1lbnQocGFyZW50OiBMRWxlbWVudE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgaWYgKHBhcmVudC52aWV3ICE9PSBjdXJyZW50Vmlldykge1xuICAgIC8vIElmIHRoZSBQYXJlbnQgdmlldyBpcyBub3QgdGhlIHNhbWUgYXMgY3VycmVudCB2aWV3IHRoYW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3NcbiAgICAvLyBWaWV3cy4gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaW5zZXJ0IGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvXG4gICAgLy8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYW5kIGl0IHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gUGFyZW50IGVsZW1lbnRzIGNhbiBiZSBhIGNvbXBvbmVudCB3aGljaCBtYXkgaGF2ZSBwcm9qZWN0aW9uLlxuICBpZiAocGFyZW50LmRhdGEgPT09IG51bGwpIHtcbiAgICAvLyBQYXJlbnQgaXMgYSByZWd1bGFyIG5vbi1jb21wb25lbnQgZWxlbWVudC4gV2Ugc2hvdWxkIGVhZ2VybHkgaW5zZXJ0IGludG8gaXRcbiAgICAvLyBzaW5jZSB3ZSBrbm93IHRoYXQgdGhpcyByZWxhdGlvbnNoaXAgd2lsbCBuZXZlciBiZSBicm9rZW4uXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBQYXJlbnQgaXMgYSBDb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhhbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFdlIG1pZ2h0IGRlbGF5IGluc2VydGlvbiBvZiBjaGlsZHJlbiBmb3IgYSBnaXZlbiB2aWV3IGlmIGl0IGlzIGRpc2Nvbm5lY3RlZC5cbiAqIFRoaXMgbWlnaHQgaGFwcGVuIGZvciAyIG1haW4gcmVhc29uOlxuICogLSB2aWV3IGlzIG5vdCBpbnNlcnRlZCBpbnRvIGFueSBjb250YWluZXIgKHZpZXcgd2FzIGNyZWF0ZWQgYnV0IG5vdCBpc2VydGVkIHlldClcbiAqIC0gdmlldyBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGJ1dCB0aGUgY29udGFpbmVyIGl0c2VsZiBpcyBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NXG4gKiAoY29udGFpbmVyIG1pZ2h0IGJlIHBhcnQgb2YgcHJvamVjdGlvbiBvciBjaGlsZCBvZiBhIHZpZXcgdGhhdCBpcyBub3QgaW5zZXJ0ZWQgeWV0KS5cbiAqXG4gKiBJbiBvdGhlciB3b3JkcyB3ZSBjYW4gaW5zZXJ0IGNoaWxkcmVuIG9mIGEgZ2l2ZW4gdmlldyB0aGlzIHZpZXcgd2FzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYW5kXG4gKiB0aGUgY29udGFpbmVyIGl0c2VsZiBoYXMgaXQgcmVuZGVyIHBhcmVudCBkZXRlcm1pbmVkLlxuICovXG5mdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mVmlldyhwYXJlbnQ6IExWaWV3Tm9kZSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG5cbiAgLy8gQmVjYXVzZSB3ZSBhcmUgaW5zZXJ0aW5nIGludG8gYSBgVmlld2AgdGhlIGBWaWV3YCBtYXkgYmUgZGlzY29ubmVjdGVkLlxuICBjb25zdCBncmFuZFBhcmVudENvbnRhaW5lciA9IGdldFBhcmVudExOb2RlKHBhcmVudCkgYXMgTENvbnRhaW5lck5vZGU7XG4gIGlmIChncmFuZFBhcmVudENvbnRhaW5lciA9PSBudWxsKSB7XG4gICAgLy8gVGhlIGBWaWV3YCBpcyBub3QgaW5zZXJ0ZWQgaW50byBhIGBDb250YWluZXJgIHdlIGhhdmUgdG8gZGVsYXkgaW5zZXJ0aW9uLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ3JhbmRQYXJlbnRDb250YWluZXIudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBpZiAoZ3JhbmRQYXJlbnRDb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA9PSBudWxsKSB7XG4gICAgLy8gVGhlIHBhcmVudCBgQ29udGFpbmVyYCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBTbyB3ZSBoYXZlIHRvIGRlbGF5LlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRoZSBwYXJlbnQgYENvbnRhaW5lcmAgaXMgaW4gaW5zZXJ0ZWQgc3RhdGUsIHNvIHdlIGNhbiBlYWdlcmx5IGluc2VydCBpbnRvXG4gIC8vIHRoaXMgbG9jYXRpb24uXG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFyZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKlxuXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHdoZXJlIHRoZSBjaGlsZCB3aWxsIGJlIGluc2VydGVkIGludG8uXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgc2hvdWxkIGJlIGluc2VydGVkIG5vdyAob3IgZGVsYXllZCB1bnRpbCBsYXRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudDogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgLy8gV2UgY2FuIG9ubHkgaW5zZXJ0IGludG8gYSBDb21wb25lbnQgb3IgVmlldy4gQW55IG90aGVyIHR5cGUgc2hvdWxkIGJlIGFuIEVycm9yLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICBwYXJlbnQudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgVE5vZGVUeXBlLlZpZXcpO1xuXG4gIGlmIChwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAvLyBQYXJlbnQgaXMgYSByZWd1bGFyIGVsZW1lbnQgb3IgYSBjb21wb25lbnRcbiAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZkVsZW1lbnQocGFyZW50IGFzIExFbGVtZW50Tm9kZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2UgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIC8vIFBhcmVudCBpcyBhbiBlbGVtZW50IGNvbnRhaW5lciAobmctY29udGFpbmVyKS5cbiAgICAvLyBJdHMgZ3JhbmQtcGFyZW50IG1pZ2h0IGJlIGFuIGVsZW1lbnQsIHZpZXcgb3IgYSBzZXF1ZW5jZSBvZiBuZy1jb250YWluZXIgcGFyZW50cy5cbiAgICBsZXQgZ3JhbmRQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShwYXJlbnQpO1xuICAgIHdoaWxlIChncmFuZFBhcmVudCAhPT0gbnVsbCAmJiBncmFuZFBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgZ3JhbmRQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShncmFuZFBhcmVudCk7XG4gICAgfVxuICAgIGlmIChncmFuZFBhcmVudCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZ3JhbmRQYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIHJldHVybiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudChncmFuZFBhcmVudCBhcyBMRWxlbWVudE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZWaWV3KGdyYW5kUGFyZW50IGFzIExWaWV3Tm9kZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFBhcmVudCBpcyBhIFZpZXcuXG4gICAgcmV0dXJuIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZWaWV3KHBhcmVudCBhcyBMVmlld05vZGUpO1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5hdGl2ZSBub2RlIGJlZm9yZSBhbm90aGVyIG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIHBhcmVudCB1c2luZyB7QGxpbmsgUmVuZGVyZXIzfS5cbiAqIFRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBuYXRpdmUgbm9kZXMgd2VyZSBkZXRlcm1pbmVkIC0gaXQgYWJzdHJhY3RzIGFuXG4gKiBhY3R1YWwgcmVuZGVyZXIgYmVpbmcgdXNlZC5cbiAqL1xuZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUocGFyZW50KSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICAgICAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gICAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YocGFyZW50IGFzIExWaWV3Tm9kZSk7XG4gICAgICBjb25zdCBiZWZvcmVOb2RlID1cbiAgICAgICAgICBpbmRleCArIDEgPCB2aWV3cy5sZW5ndGggPyAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1tpbmRleCArIDFdKSAhKS5uYXRpdmUgOiBjb250YWluZXIubmF0aXZlO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQgIS5uYXRpdmUsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IHBhcmVudC5uYXRpdmU7XG4gICAgICBsZXQgZ3JhbmRQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShwYXJlbnQgYXMgTEVsZW1lbnRDb250YWluZXJOb2RlKTtcbiAgICAgIHdoaWxlIChncmFuZFBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgICBncmFuZFBhcmVudCA9IGdldFBhcmVudExOb2RlKGdyYW5kUGFyZW50IGFzIExFbGVtZW50Q29udGFpbmVyTm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAoZ3JhbmRQYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KGdyYW5kUGFyZW50IGFzIExWaWV3Tm9kZSk7XG4gICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50ICEubmF0aXZlLCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIChncmFuZFBhcmVudCBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZSwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBgY2hpbGRgIGVsZW1lbnQgb2YgdGhlIGBwYXJlbnRgIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgZnJvbSB3aGljaCB0byByZW1vdmUgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSByZW1vdmUgdGhlIGVsZW1lbnQgaWYgbm90IGluIFZpZXcgb3Igbm90IHByb2plY3RlZC5cbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQubmF0aXZlIGFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGN1cnJlbnRQYXJlbnQgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSxcbiAgICBjdXJyZW50UGFyZW50OiBMRWxlbWVudE5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGUgfCBMVmlld05vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsXG4gICAgcmVuZGVyUGFyZW50OiBMRWxlbWVudE5vZGUsIHBhcmVudFZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCBub2RlLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuXG4gIC8vIHRoZSBwcm9qZWN0ZWQgY29udGVudHMgYXJlIHByb2Nlc3NlZCB3aGlsZSBpbiB0aGUgc2hhZG93IHZpZXcgKHdoaWNoIGlzIHRoZSBjdXJyZW50VmlldylcbiAgLy8gdGhlcmVmb3JlIHdlIG5lZWQgdG8gZXh0cmFjdCB0aGUgdmlldyB3aGVyZSB0aGUgaG9zdCBlbGVtZW50IGxpdmVzIHNpbmNlIGl0J3MgdGhlXG4gIC8vIGxvZ2ljYWwgY29udGFpbmVyIG9mIHRoZSBjb250ZW50IHByb2plY3RlZCB2aWV3c1xuICBhdHRhY2hQYXRjaERhdGEobm9kZS5uYXRpdmUsIHBhcmVudFZpZXcpO1xuXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgY29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIGFuIGVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbiB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHZpZXdOb2RlID0gdmlld3NbaV07XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3Tm9kZS5kYXRhLCB0cnVlLCBub2RlLm5hdGl2ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBsZXQgbmdDb250YWluZXJDaGlsZCA9IGdldENoaWxkTE5vZGUobm9kZSBhcyBMRWxlbWVudENvbnRhaW5lck5vZGUpO1xuICAgIGNvbnN0IHBhcmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gICAgd2hpbGUgKG5nQ29udGFpbmVyQ2hpbGQpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbmdDb250YWluZXJDaGlsZCBhcyBMRWxlbWVudE5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSxcbiAgICAgICAgICBjdXJyZW50UGFyZW50LCBjdXJyZW50VmlldywgcmVuZGVyUGFyZW50LCBwYXJlbnRWaWV3KTtcbiAgICAgIG5nQ29udGFpbmVyQ2hpbGQgPSBuZ0NvbnRhaW5lckNoaWxkLnROb2RlLm5leHQgP1xuICAgICAgICAgIHJlYWRFbGVtZW50VmFsdWUobmdDb250YWluZXJDaGlsZC52aWV3W25nQ29udGFpbmVyQ2hpbGQudE5vZGUubmV4dC5pbmRleF0pIDpcbiAgICAgICAgICBudWxsO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICB9XG59XG4iXX0=