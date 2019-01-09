/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { attachPatchData } from './context_discovery';
import { callHooks } from './hooks';
import { NATIVE, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, CONTAINER_INDEX, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { findComponentView, getNativeByTNode, isLContainer, isRootView, readElementValue, stringify } from './util';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * @param {?} tNode
 * @param {?} embeddedView
 * @return {?}
 */
export function getLContainer(tNode, embeddedView) {
    if (tNode.index === -1) {
        // This is a dynamically created view inside a dynamic container.
        // If the host index is -1, the view has not yet been inserted, so it has no parent.
        /** @type {?} */
        const containerHostIndex = embeddedView[CONTAINER_INDEX];
        return containerHostIndex > -1 ? (/** @type {?} */ (embeddedView[PARENT]))[containerHostIndex] : null;
    }
    else {
        // This is a inline view node (e.g. embeddedViewStart)
        return (/** @type {?} */ ((/** @type {?} */ (embeddedView[PARENT]))[(/** @type {?} */ (tNode.parent)).index]));
    }
}
/**
 * Retrieves render parent for a given view.
 * Might be null if a view is not yet attached to any container.
 * @param {?} tViewNode
 * @param {?} view
 * @return {?}
 */
function getContainerRenderParent(tViewNode, view) {
    /** @type {?} */
    const container = getLContainer(tViewNode, view);
    return container ? nativeParentNode(view[RENDERER], container[NATIVE]) : null;
}
/** @enum {number} */
const WalkTNodeTreeAction = {
    /** node insert in the native environment */
    Insert: 0,
    /** node detach from the native environment */
    Detach: 1,
    /** node destruction using the renderer's API */
    Destroy: 2,
};
/**
 * Stack used to keep track of projection nodes in walkTNodeTree.
 *
 * This is deliberately created outside of walkTNodeTree to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
 * @type {?}
 */
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
    const rootTNode = (/** @type {?} */ (viewToWalk[TVIEW].node));
    /** @type {?} */
    let projectionNodeIndex = -1;
    /** @type {?} */
    let currentView = viewToWalk;
    /** @type {?} */
    let tNode = (/** @type {?} */ (rootTNode.child));
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
            const lContainer = (/** @type {?} */ ((/** @type {?} */ (currentView))[tNode.index]));
            executeNodeAction(action, renderer, renderParent, lContainer[NATIVE], beforeNode);
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
            const componentView = findComponentView((/** @type {?} */ (currentView)));
            /** @type {?} */
            const componentHost = (/** @type {?} */ (componentView[HOST_NODE]));
            /** @type {?} */
            const head = ((/** @type {?} */ (componentHost.projection)))[(/** @type {?} */ (tNode.projection))];
            // Must store both the TNode and the view because this projection node could be nested
            // deeply inside embedded views, and we need to get back down to this particular nested view.
            projectionNodeStack[++projectionNodeIndex] = tNode;
            projectionNodeStack[++projectionNodeIndex] = (/** @type {?} */ (currentView));
            if (head) {
                currentView = (/** @type {?} */ (componentView[PARENT]));
                nextTNode = (/** @type {?} */ (currentView[TVIEW].data[head.index]));
            }
        }
        else {
            // Otherwise, this is a View or an ElementContainer
            nextTNode = tNode.child;
        }
        if (nextTNode === null) {
            // this last node was projected, we need to get back down to its projection node
            if (tNode.next === null && (tNode.flags & 2 /* isProjected */)) {
                currentView = (/** @type {?} */ (projectionNodeStack[projectionNodeIndex--]));
                tNode = (/** @type {?} */ (projectionNodeStack[projectionNodeIndex--]));
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
                    currentView = (/** @type {?} */ (currentView[PARENT]));
                    beforeNode = currentView[tNode.index][NATIVE];
                }
                if (tNode.type === 2 /* View */ && currentView[NEXT]) {
                    currentView = (/** @type {?} */ (currentView[NEXT]));
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
        nativeInsertBefore(renderer, (/** @type {?} */ (parent)), node, beforeNode || null);
    }
    else if (action === 1 /* Detach */) {
        nativeRemoveChild(renderer, (/** @type {?} */ (parent)), node);
    }
    else if (action === 2 /* Destroy */) {
        ngDevMode && ngDevMode.rendererDestroyNode++;
        (/** @type {?} */ (((/** @type {?} */ (renderer))).destroyNode))(node);
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
    const renderParent = getContainerRenderParent((/** @type {?} */ (viewToWalk[TVIEW].node)), viewToWalk);
    ngDevMode && assertNodeType((/** @type {?} */ (viewToWalk[TVIEW].node)), 2 /* View */);
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
            // If LView, traverse down to child.
            /** @type {?} */
            const view = (/** @type {?} */ (viewOrContainer));
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        else {
            // If container, traverse down to its first LView.
            /** @type {?} */
            const container = (/** @type {?} */ (viewOrContainer));
            if (container[VIEWS].length)
                next = container[VIEWS][0];
        }
        if (next == null) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (viewOrContainer && !(/** @type {?} */ (viewOrContainer))[NEXT] && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(viewOrContainer || rootView);
            next = viewOrContainer && (/** @type {?} */ (viewOrContainer))[NEXT];
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
        (/** @type {?} */ (lView[QUERIES])).insertView(index);
    }
    // Sets the attached flag
    lView[FLAGS] |= 16 /* Attached */;
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
 * @return {?} Detached LView instance.
 */
export function detachView(lContainer, removeIndex, detached) {
    /** @type {?} */
    const views = lContainer[VIEWS];
    /** @type {?} */
    const viewToDetach = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1][NEXT] = (/** @type {?} */ (viewToDetach[NEXT]));
    }
    views.splice(removeIndex, 1);
    if (!detached) {
        addRemoveViewFromContainer(viewToDetach, false);
    }
    if (viewToDetach[QUERIES]) {
        (/** @type {?} */ (viewToDetach[QUERIES])).removeView();
    }
    viewToDetach[CONTAINER_INDEX] = -1;
    viewToDetach[PARENT] = null;
    // Unsets the attached flag
    viewToDetach[FLAGS] &= ~16 /* Attached */;
    return viewToDetach;
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
 * Gets the child of the given LView
 * @param {?} lView
 * @return {?}
 */
export function getLViewChild(lView) {
    /** @type {?} */
    const childIndex = lView[TVIEW].childIndex;
    return childIndex === -1 ? null : lView[childIndex];
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
    view[FLAGS] |= 64 /* Destroyed */;
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
    if (state.length >= HEADER_OFFSET && (tNode = (/** @type {?} */ (((/** @type {?} */ (state)))))[HOST_NODE]) &&
        tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return (/** @type {?} */ (getLContainer((/** @type {?} */ (tNode)), (/** @type {?} */ (state)))));
    }
    else {
        // otherwise, use parent view for containers or component views
        return state[PARENT] === rootView ? null : state[PARENT];
    }
}
/**
 * Calls onDestroys hooks for all directives and pipes in a given view and then removes all
 * listeners. Listeners are removed as the last step so events delivered in the onDestroys hooks
 * can be propagated to \@Output listeners.
 *
 * @param {?} viewOrContainer
 * @return {?}
 */
function cleanUpView(viewOrContainer) {
    if (((/** @type {?} */ (viewOrContainer))).length >= HEADER_OFFSET) {
        /** @type {?} */
        const view = (/** @type {?} */ (viewOrContainer));
        executeOnDestroys(view);
        removeListeners(view);
        /** @type {?} */
        const hostTNode = view[HOST_NODE];
        // For component views only, the local renderer is destroyed as clean up time.
        if (hostTNode && hostTNode.type === 3 /* Element */ && isProceduralRenderer(view[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            ((/** @type {?} */ (view[RENDERER]))).destroy();
        }
    }
}
/**
 * Removes listeners and unsubscribes from output subscriptions
 * @param {?} lView
 * @return {?}
 */
function removeListeners(lView) {
    /** @type {?} */
    const tCleanup = (/** @type {?} */ (lView[TVIEW].cleanup));
    if (tCleanup != null) {
        /** @type {?} */
        const lCleanup = (/** @type {?} */ (lView[CLEANUP]));
        for (let i = 0; i < tCleanup.length - 1; i += 2) {
            if (typeof tCleanup[i] === 'string') {
                // This is a listener with the native renderer
                /** @type {?} */
                const idxOrTargetGetter = tCleanup[i + 1];
                /** @type {?} */
                const target = typeof idxOrTargetGetter === 'function' ?
                    idxOrTargetGetter(lView) :
                    readElementValue(lView[idxOrTargetGetter]);
                /** @type {?} */
                const listener = lCleanup[tCleanup[i + 2]];
                /** @type {?} */
                const useCaptureOrSubIdx = tCleanup[i + 3];
                if (typeof useCaptureOrSubIdx === 'boolean') {
                    // DOM listener
                    target.removeEventListener(tCleanup[i], listener, useCaptureOrSubIdx);
                }
                else {
                    if (useCaptureOrSubIdx >= 0) {
                        // unregister
                        lCleanup[useCaptureOrSubIdx]();
                    }
                    else {
                        // Subscription
                        lCleanup[-useCaptureOrSubIdx].unsubscribe();
                    }
                }
                i += 2;
            }
            else if (typeof tCleanup[i] === 'number') {
                // This is a listener with renderer2 (cleanup fn can be found by index)
                /** @type {?} */
                const cleanupFn = lCleanup[tCleanup[i]];
                cleanupFn();
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                /** @type {?} */
                const context = lCleanup[tCleanup[i + 1]];
                tCleanup[i].call(context);
            }
        }
        lView[CLEANUP] = null;
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
 * Returns a native element if a node can be inserted into the given parent.
 *
 * There are two reasons why we may not be able to insert a element immediately.
 * - Projection: When creating a child content element of a component, we have to skip the
 *   insertion because the content of a component will be projected.
 *   `<component><content>delayed due to projection</content></component>`
 * - Parent container is disconnected: This can happen when we are inserting a view into
 *   parent container, which itself is disconnected. For example the parent container is part
 *   of a View which has not be inserted or is mare for projection but has not been inserted
 *   into destination.
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function getRenderParent(tNode, currentView) {
    // Nodes of the top-most view can be inserted eagerly.
    if (isRootView(currentView)) {
        return nativeParentNode(currentView[RENDERER], getNativeByTNode(tNode, currentView));
    }
    // Skip over element and ICU containers as those are represented by a comment node and
    // can't be used as a render parent.
    /** @type {?} */
    const parent = getHighestElementOrICUContainer(tNode).parent;
    // If the parent is null, then we are inserting across views: either into an embedded view or a
    // component view.
    if (parent == null) {
        /** @type {?} */
        const hostTNode = (/** @type {?} */ (currentView[HOST_NODE]));
        if (hostTNode.type === 2 /* View */) {
            // We are inserting a root element of an embedded view We might delay insertion of children
            // for a given view if it is disconnected. This might happen for 2 main reasons:
            // - view is not inserted into any container(view was created but not inserted yet)
            // - view is inserted into a container but the container itself is not inserted into the DOM
            // (container might be part of projection or child of a view that is not inserted yet).
            // In other words we can insert children of a given view if this view was inserted into a
            // container and the container itself has its render parent determined.
            return getContainerRenderParent((/** @type {?} */ (hostTNode)), currentView);
        }
        else {
            // We are inserting a root element of the component view into the component host element and
            // it should always be eager.
            return getHostNative(currentView);
        }
    }
    else {
        ngDevMode && assertNodeType(parent, 3 /* Element */);
        // We've got a parent which is an element in the current view. We just need to verify if the
        // parent element is not a component. Component's content nodes are not inserted immediately
        // because they will be projected, and so doing insert at this point would be wasteful.
        // Since the projection would than move it to its final destination.
        if (!(parent.flags & 1 /* isComponent */)) {
            return (/** @type {?} */ (getNativeByTNode(parent, currentView)));
        }
        else {
            return null;
        }
    }
}
/**
 * Gets the native host element for a given view. Will return null if the current view does not have
 * a host element.
 * @param {?} currentView
 * @return {?}
 */
function getHostNative(currentView) {
    /** @type {?} */
    const hostTNode = currentView[HOST_NODE];
    return hostTNode && hostTNode.type === 3 /* Element */ ?
        ((/** @type {?} */ (getNativeByTNode(hostTNode, (/** @type {?} */ (currentView[PARENT])))))) :
        null;
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
 * Removes a native child node from a given native parent node.
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @return {?}
 */
export function nativeRemoveChild(renderer, parent, child) {
    isProceduralRenderer(renderer) ? renderer.removeChild((/** @type {?} */ (parent)), child) :
        parent.removeChild(child);
}
/**
 * Returns a native parent of a given native node.
 * @param {?} renderer
 * @param {?} node
 * @return {?}
 */
export function nativeParentNode(renderer, node) {
    return (/** @type {?} */ ((isProceduralRenderer(renderer) ? renderer.parentNode(node) : node.parentNode)));
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
 * @param {?} childEl The child that should be appended
 * @param {?} childTNode The TNode of the child element
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(childEl, childTNode, currentView) {
    /** @type {?} */
    const renderParent = getRenderParent(childTNode, currentView);
    if (renderParent != null) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        /** @type {?} */
        const parentTNode = childTNode.parent || (/** @type {?} */ (currentView[HOST_NODE]));
        if (parentTNode.type === 2 /* View */) {
            /** @type {?} */
            const lContainer = (/** @type {?} */ (getLContainer((/** @type {?} */ (parentTNode)), currentView)));
            /** @type {?} */
            const views = lContainer[VIEWS];
            /** @type {?} */
            const index = views.indexOf(currentView);
            nativeInsertBefore(renderer, renderParent, childEl, getBeforeNodeForView(index, views, lContainer[NATIVE]));
        }
        else if (parentTNode.type === 4 /* ElementContainer */ ||
            parentTNode.type === 5 /* IcuContainer */) {
            /** @type {?} */
            const anchorNode = getNativeByTNode(parentTNode, currentView);
            nativeInsertBefore(renderer, renderParent, childEl, anchorNode);
        }
        else {
            isProceduralRenderer(renderer) ? renderer.appendChild(renderParent, childEl) :
                renderParent.appendChild(childEl);
        }
    }
}
/**
 * Gets the top-level element or an ICU container if those containers are nested.
 *
 * @param {?} tNode The starting TNode for which we should skip element and ICU containers
 * @return {?} The TNode of the highest level ICU container or element container
 */
function getHighestElementOrICUContainer(tNode) {
    while (tNode.parent != null && (tNode.parent.type === 4 /* ElementContainer */ ||
        tNode.parent.type === 5 /* IcuContainer */)) {
        tNode = tNode.parent;
    }
    return tNode;
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
        const view = (/** @type {?} */ (views[index + 1]));
        /** @type {?} */
        const viewTNode = (/** @type {?} */ (view[HOST_NODE]));
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
    /** @type {?} */
    const parentNative = getRenderParent(childTNode, currentView);
    // We only remove the element if it already has a render parent.
    if (parentNative) {
        nativeRemoveChild(currentView[RENDERER], parentNative, childEl);
    }
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
    const nodeOrContainer = projectionView[projectedTNode.index];
    if (projectedTNode.type === 0 /* Container */) {
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        /** @type {?} */
        const views = nodeOrContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(views[i], true, nodeOrContainer[NATIVE]);
        }
    }
    else {
        if (projectedTNode.type === 4 /* ElementContainer */) {
            /** @type {?} */
            let ngContainerChildTNode = (/** @type {?} */ (projectedTNode.child));
            while (ngContainerChildTNode) {
                appendProjectedNode(ngContainerChildTNode, tProjectionNode, currentView, projectionView);
                ngContainerChildTNode = ngContainerChildTNode.next;
            }
        }
        if (isLContainer(nodeOrContainer)) {
            appendChild(nodeOrContainer[NATIVE], tProjectionNode, currentView);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFhLE1BQU0sRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDM0csT0FBTyxFQUErRiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6SyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBK0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7TUFFNUcsdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU87Ozs7OztBQUUvRSxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQWdCLEVBQUUsWUFB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QyxFQUFFO1lBQ2pDLFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3BFO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIE5BVElWRSwgVklFV1MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50VmlldywgZ2V0TmF0aXZlQnlUTm9kZSwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3LCByZWFkRWxlbWVudFZhbHVlLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMQ29udGFpbmVyKHROb2RlOiBUVmlld05vZGUsIGVtYmVkZGVkVmlldzogTFZpZXcpOiBMQ29udGFpbmVyfG51bGwge1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBJZiB0aGUgaG9zdCBpbmRleCBpcyAtMSwgdGhlIHZpZXcgaGFzIG5vdCB5ZXQgYmVlbiBpbnNlcnRlZCwgc28gaXQgaGFzIG5vIHBhcmVudC5cbiAgICBjb25zdCBjb250YWluZXJIb3N0SW5kZXggPSBlbWJlZGRlZFZpZXdbQ09OVEFJTkVSX0lOREVYXTtcbiAgICByZXR1cm4gY29udGFpbmVySG9zdEluZGV4ID4gLTEgPyBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW2NvbnRhaW5lckhvc3RJbmRleF0gOiBudWxsO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYSBpbmxpbmUgdmlldyBub2RlIChlLmcuIGVtYmVkZGVkVmlld1N0YXJ0KVxuICAgIHJldHVybiBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW3ROb2RlLnBhcmVudCAhLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBmb3IgYSBnaXZlbiB2aWV3LlxuICogTWlnaHQgYmUgbnVsbCBpZiBhIHZpZXcgaXMgbm90IHlldCBhdHRhY2hlZCB0byBhbnkgY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQodFZpZXdOb2RlOiBUVmlld05vZGUsIHZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGdldExDb250YWluZXIodFZpZXdOb2RlLCB2aWV3KTtcbiAgcmV0dXJuIGNvbnRhaW5lciA/IG5hdGl2ZVBhcmVudE5vZGUodmlld1tSRU5ERVJFUl0sIGNvbnRhaW5lcltOQVRJVkVdKSA6IG51bGw7XG59XG5cbmNvbnN0IGVudW0gV2Fsa1ROb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDAsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAxLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMixcbn1cblxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHdhbGtUTm9kZVRyZWUuXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHdhbGtUTm9kZVRyZWUgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlldyB8IFROb2RlKVtdID0gW107XG5cbi8qKlxuICogV2Fsa3MgYSB0cmVlIG9mIFROb2RlcywgYXBwbHlpbmcgYSB0cmFuc2Zvcm1hdGlvbiBvbiB0aGUgZWxlbWVudCBub2RlcywgZWl0aGVyIG9ubHkgb24gdGhlIGZpcnN0XG4gKiBvbmUgZm91bmQsIG9yIG9uIGFsbCBvZiB0aGVtLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIHRoZSB2aWV3IHRvIHdhbGtcbiAqIEBwYXJhbSBhY3Rpb24gaWRlbnRpZmllcyB0aGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgZWxlbWVudHNcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgT3B0aW9uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJzIGZvdW5kLFxuICogcmVxdWlyZWQgZm9yIGFjdGlvbiBtb2RlcyBJbnNlcnQgYW5kIERlc3Ryb3kuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBPcHRpb25hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBJbnNlcnQuXG4gKi9cbmZ1bmN0aW9uIHdhbGtUTm9kZVRyZWUoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBjb25zdCByb290VE5vZGUgPSB2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZTtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgbGV0IGN1cnJlbnRWaWV3ID0gdmlld1RvV2FsaztcbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gcm9vdFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBsZXQgbmV4dFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgIGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XTtcbiAgICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgICAvLyBUaGlzIGVsZW1lbnQgaGFzIGFuIExDb250YWluZXIsIGFuZCBpdHMgY29tbWVudCBuZWVkcyB0byBiZSBoYW5kbGVkXG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbm9kZU9yQ29udGFpbmVyW05BVElWRV0sIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lciA9IGN1cnJlbnRWaWV3ICFbdE5vZGUuaW5kZXhdIGFzIExDb250YWluZXI7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGxDb250YWluZXJbTkFUSVZFXSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgIGlmIChsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBsQ29udGFpbmVyW1ZJRVdTXVswXTtcbiAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgd2Fsa2VyIGVudGVycyBhIGNvbnRhaW5lciwgdGhlbiB0aGUgYmVmb3JlTm9kZSBoYXMgdG8gYmVjb21lIHRoZSBsb2NhbCBuYXRpdmVcbiAgICAgICAgLy8gY29tbWVudCBub2RlLlxuICAgICAgICBiZWZvcmVOb2RlID0gbENvbnRhaW5lcltOQVRJVkVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhjdXJyZW50VmlldyAhKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgLy8gTXVzdCBzdG9yZSBib3RoIHRoZSBUTm9kZSBhbmQgdGhlIHZpZXcgYmVjYXVzZSB0aGlzIHByb2plY3Rpb24gbm9kZSBjb3VsZCBiZSBuZXN0ZWRcbiAgICAgIC8vIGRlZXBseSBpbnNpZGUgZW1iZWRkZWQgdmlld3MsIGFuZCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gdGhpcyBwYXJ0aWN1bGFyIG5lc3RlZCB2aWV3LlxuICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gdE5vZGU7XG4gICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBjdXJyZW50VmlldyAhO1xuICAgICAgaWYgKGhlYWQpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBhIFZpZXcgb3IgYW4gRWxlbWVudENvbnRhaW5lclxuICAgICAgbmV4dFROb2RlID0gdE5vZGUuY2hpbGQ7XG4gICAgfVxuXG4gICAgaWYgKG5leHRUTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gdGhpcyBsYXN0IG5vZGUgd2FzIHByb2plY3RlZCwgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIGl0cyBwcm9qZWN0aW9uIG5vZGVcbiAgICAgIGlmICh0Tm9kZS5uZXh0ID09PSBudWxsICYmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIExWaWV3O1xuICAgICAgICB0Tm9kZSA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG5cbiAgICAgIC8qKlxuICAgICAgICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBUTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAgICAgICAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICAgICAgICpcbiAgICAgICAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhlbiBpdCBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gICAgICAgKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAgICAgICAqL1xuICAgICAgd2hpbGUgKCFuZXh0VE5vZGUpIHtcbiAgICAgICAgLy8gSWYgcGFyZW50IGlzIG51bGwsIHdlJ3JlIGNyb3NzaW5nIHRoZSB2aWV3IGJvdW5kYXJ5LCBzbyB3ZSBzaG91bGQgZ2V0IHRoZSBob3N0IFROb2RlLlxuICAgICAgICB0Tm9kZSA9IHROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICBpZiAodE5vZGUgPT09IG51bGwgfHwgdE5vZGUgPT09IHJvb3RUTm9kZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gV2hlbiBleGl0aW5nIGEgY29udGFpbmVyLCB0aGUgYmVmb3JlTm9kZSBtdXN0IGJlIHJlc3RvcmVkIHRvIHRoZSBwcmV2aW91cyB2YWx1ZVxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF1bTkFUSVZFXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyAmJiBjdXJyZW50Vmlld1tORVhUXSkge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbTkVYVF0gYXMgTFZpZXc7XG4gICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IG5leHRUTm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBub2RlOiBSQ29tbWVudCB8IFJFbGVtZW50IHwgUlRleHQsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCAhLCBub2RlLCBiZWZvcmVOb2RlIHx8IG51bGwpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChyZW5kZXJlciwgcGFyZW50ICEsIG5vZGUpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3fExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmICh2aWV3T3JDb250YWluZXIubGVuZ3RoID49IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIElmIExWaWV3LCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlldztcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3LlxuICAgICAgY29uc3QgY29udGFpbmVyID0gdmlld09yQ29udGFpbmVyIGFzIExDb250YWluZXI7XG4gICAgICBpZiAoY29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIG5leHQgPSBjb250YWluZXJbVklFV1NdWzBdO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIHBhcmVudFZpZXcgVGhlIG5ldyBwYXJlbnQgb2YgdGhlIGluc2VydGVkIHZpZXdcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3XG4gKiBAcGFyYW0gY29udGFpbmVySW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgbm9kZSwgaWYgZHluYW1pY1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhcbiAgICBsVmlldzogTFZpZXcsIGxDb250YWluZXI6IExDb250YWluZXIsIHBhcmVudFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLFxuICAgIGNvbnRhaW5lckluZGV4OiBudW1iZXIpIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXVtORVhUXSA9IGxWaWV3O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgbFZpZXdbTkVYVF0gPSB2aWV3c1tpbmRleF07XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaChsVmlldyk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgLy8gRHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGVpciBwYXJlbnQgY29udGFpbmVyJ3MgaG9zdCBzbyBpdCdzXG4gIC8vIHBvc3NpYmxlIHRvIGp1bXAgZnJvbSBhIHZpZXcgdG8gaXRzIGNvbnRhaW5lcidzIG5leHQgd2hlbiB3YWxraW5nIHRoZSBub2RlIHRyZWUuXG4gIGlmIChjb250YWluZXJJbmRleCA+IC0xKSB7XG4gICAgbFZpZXdbQ09OVEFJTkVSX0lOREVYXSA9IGNvbnRhaW5lckluZGV4O1xuICAgIGxWaWV3W1BBUkVOVF0gPSBwYXJlbnRWaWV3O1xuICB9XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEBwYXJhbSBkZXRhY2hlZCBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgYWxyZWFkeSBkZXRhY2hlZC5cbiAqIEByZXR1cm5zIERldGFjaGVkIExWaWV3IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCByZW1vdmVJbmRleDogbnVtYmVyLCBkZXRhY2hlZDogYm9vbGVhbik6IExWaWV3IHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgY29uc3Qgdmlld1RvRGV0YWNoID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlldztcbiAgfVxuICB2aWV3cy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICBpZiAoIWRldGFjaGVkKSB7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld1RvRGV0YWNoLCBmYWxzZSk7XG4gIH1cblxuICBpZiAodmlld1RvRGV0YWNoW1FVRVJJRVNdKSB7XG4gICAgdmlld1RvRGV0YWNoW1FVRVJJRVNdICEucmVtb3ZlVmlldygpO1xuICB9XG4gIHZpZXdUb0RldGFjaFtDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gIHZpZXdUb0RldGFjaFtQQVJFTlRdID0gbnVsbDtcbiAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIHZpZXdUb0RldGFjaFtGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG4gIHJldHVybiB2aWV3VG9EZXRhY2g7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lciwgaS5lLiBkZXRhY2hlcyBpdCBhbmQgdGhlbiBkZXN0cm95cyB0aGUgdW5kZXJseWluZyBMVmlldy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHRDb250YWluZXIgVGhlIFRDb250YWluZXIgbm9kZSBhc3NvY2lhdGVkIHdpdGggdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGNvbnRhaW5lckhvc3Q6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmlldyA9IGxDb250YWluZXJbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCwgISFjb250YWluZXJIb3N0LmRldGFjaGVkKTtcbiAgZGVzdHJveUxWaWV3KHZpZXcpO1xufVxuXG4vKiogR2V0cyB0aGUgY2hpbGQgb2YgdGhlIGdpdmVuIExWaWV3ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZChsVmlldzogTFZpZXcpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICBjb25zdCBjaGlsZEluZGV4ID0gbFZpZXdbVFZJRVddLmNoaWxkSW5kZXg7XG4gIHJldHVybiBjaGlsZEluZGV4ID09PSAtMSA/IG51bGwgOiBsVmlld1tjaGlsZEluZGV4XTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlldykge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgd2Fsa1ROb2RlVHJlZSh2aWV3LCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyLCBudWxsKTtcbiAgfVxuICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIC8vIFNldHMgdGhlIGRlc3Ryb3llZCBmbGFnXG4gIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXcgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICBsZXQgdE5vZGU7XG4gIGlmIChzdGF0ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCAmJiAodE5vZGUgPSAoc3RhdGUgYXMgTFZpZXcpICFbSE9TVF9OT0RFXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRMQ29udGFpbmVyKHROb2RlIGFzIFRWaWV3Tm9kZSwgc3RhdGUgYXMgTFZpZXcpIGFzIExDb250YWluZXI7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkRlc3Ryb3lzIGhvb2tzIGZvciBhbGwgZGlyZWN0aXZlcyBhbmQgcGlwZXMgaW4gYSBnaXZlbiB2aWV3IGFuZCB0aGVuIHJlbW92ZXMgYWxsXG4gKiBsaXN0ZW5lcnMuIExpc3RlbmVycyBhcmUgcmVtb3ZlZCBhcyB0aGUgbGFzdCBzdGVwIHNvIGV2ZW50cyBkZWxpdmVyZWQgaW4gdGhlIG9uRGVzdHJveXMgaG9va3NcbiAqIGNhbiBiZSBwcm9wYWdhdGVkIHRvIEBPdXRwdXQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXI6IExWaWV3IHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlldykubGVuZ3RoID49IEhFQURFUl9PRkZTRVQpIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3O1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSB2aWV3W0hPU1RfTk9ERV07XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0Q2xlYW51cCA9IGxWaWV3W1RWSUVXXS5jbGVhbnVwICE7XG4gIGlmICh0Q2xlYW51cCAhPSBudWxsKSB7XG4gICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IGlkeE9yVGFyZ2V0R2V0dGVyID0gdENsZWFudXBbaSArIDFdO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgaWR4T3JUYXJnZXRHZXR0ZXIobFZpZXcpIDpcbiAgICAgICAgICAgIHJlYWRFbGVtZW50VmFsdWUobFZpZXdbaWR4T3JUYXJnZXRHZXR0ZXJdKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMl1dO1xuICAgICAgICBjb25zdCB1c2VDYXB0dXJlT3JTdWJJZHggPSB0Q2xlYW51cFtpICsgM107XG4gICAgICAgIGlmICh0eXBlb2YgdXNlQ2FwdHVyZU9yU3ViSWR4ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAvLyBET00gbGlzdGVuZXJcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0Q2xlYW51cFtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHVzZUNhcHR1cmVPclN1YklkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyB1bnJlZ2lzdGVyXG4gICAgICAgICAgICBsQ2xlYW51cFt1c2VDYXB0dXJlT3JTdWJJZHhdKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvblxuICAgICAgICAgICAgbENsZWFudXBbLXVzZUNhcHR1cmVPclN1YklkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdENsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IGxDbGVhbnVwW3RDbGVhbnVwW2ldXTtcbiAgICAgICAgY2xlYW51cEZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIHRDbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxWaWV3W0NMRUFOVVBdID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3ModmlldywgZGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgZWxlbWVudCBpZiBhIG5vZGUgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYXJlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVuZGVyUGFyZW50KHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIC8vIE5vZGVzIG9mIHRoZSB0b3AtbW9zdCB2aWV3IGNhbiBiZSBpbnNlcnRlZCBlYWdlcmx5LlxuICBpZiAoaXNSb290VmlldyhjdXJyZW50VmlldykpIHtcbiAgICByZXR1cm4gbmF0aXZlUGFyZW50Tm9kZShjdXJyZW50Vmlld1tSRU5ERVJFUl0sIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSk7XG4gIH1cblxuICAvLyBTa2lwIG92ZXIgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnMgYXMgdGhvc2UgYXJlIHJlcHJlc2VudGVkIGJ5IGEgY29tbWVudCBub2RlIGFuZFxuICAvLyBjYW4ndCBiZSB1c2VkIGFzIGEgcmVuZGVyIHBhcmVudC5cbiAgY29uc3QgcGFyZW50ID0gZ2V0SGlnaGVzdEVsZW1lbnRPcklDVUNvbnRhaW5lcih0Tm9kZSkucGFyZW50O1xuXG4gIC8vIElmIHRoZSBwYXJlbnQgaXMgbnVsbCwgdGhlbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zcyB2aWV3czogZWl0aGVyIGludG8gYW4gZW1iZWRkZWQgdmlldyBvciBhXG4gIC8vIGNvbXBvbmVudCB2aWV3LlxuICBpZiAocGFyZW50ID09IG51bGwpIHtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tIT1NUX05PREVdICE7XG4gICAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiBhbiBlbWJlZGRlZCB2aWV3IFdlIG1pZ2h0IGRlbGF5IGluc2VydGlvbiBvZiBjaGlsZHJlblxuICAgICAgLy8gZm9yIGEgZ2l2ZW4gdmlldyBpZiBpdCBpcyBkaXNjb25uZWN0ZWQuIFRoaXMgbWlnaHQgaGFwcGVuIGZvciAyIG1haW4gcmVhc29uczpcbiAgICAgIC8vIC0gdmlldyBpcyBub3QgaW5zZXJ0ZWQgaW50byBhbnkgY29udGFpbmVyKHZpZXcgd2FzIGNyZWF0ZWQgYnV0IG5vdCBpbnNlcnRlZCB5ZXQpXG4gICAgICAvLyAtIHZpZXcgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBidXQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaXMgbm90IGluc2VydGVkIGludG8gdGhlIERPTVxuICAgICAgLy8gKGNvbnRhaW5lciBtaWdodCBiZSBwYXJ0IG9mIHByb2plY3Rpb24gb3IgY2hpbGQgb2YgYSB2aWV3IHRoYXQgaXMgbm90IGluc2VydGVkIHlldCkuXG4gICAgICAvLyBJbiBvdGhlciB3b3JkcyB3ZSBjYW4gaW5zZXJ0IGNoaWxkcmVuIG9mIGEgZ2l2ZW4gdmlldyBpZiB0aGlzIHZpZXcgd2FzIGluc2VydGVkIGludG8gYVxuICAgICAgLy8gY29udGFpbmVyIGFuZCB0aGUgY29udGFpbmVyIGl0c2VsZiBoYXMgaXRzIHJlbmRlciBwYXJlbnQgZGV0ZXJtaW5lZC5cbiAgICAgIHJldHVybiBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQoaG9zdFROb2RlIGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZFxuICAgICAgLy8gaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICAgIHJldHVybiBnZXRIb3N0TmF0aXZlKGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIC8vIFdlJ3ZlIGdvdCBhIHBhcmVudCB3aGljaCBpcyBhbiBlbGVtZW50IGluIHRoZSBjdXJyZW50IHZpZXcuIFdlIGp1c3QgbmVlZCB0byB2ZXJpZnkgaWYgdGhlXG4gICAgLy8gcGFyZW50IGVsZW1lbnQgaXMgbm90IGEgY29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGFuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLlxuICAgIGlmICghKHBhcmVudC5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpKSB7XG4gICAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSBhcyBSRWxlbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBmb3IgYSBnaXZlbiB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBjdXJyZW50IHZpZXcgZG9lcyBub3QgaGF2ZVxuICogYSBob3N0IGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGdldEhvc3ROYXRpdmUoY3VycmVudFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG4gIHJldHVybiBob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID9cbiAgICAgIChnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgY3VycmVudFZpZXdbUEFSRU5UXSAhKSBhcyBSRWxlbWVudCkgOlxuICAgICAgbnVsbDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgbmF0aXZlIGNoaWxkIG5vZGUgZnJvbSBhIGdpdmVuIG5hdGl2ZSBwYXJlbnQgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVJlbW92ZUNoaWxkKHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSk6IHZvaWQge1xuICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBwYXJlbnQgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSRWxlbWVudHxudWxsIHtcbiAgcmV0dXJuIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5wYXJlbnROb2RlKG5vZGUpIDogbm9kZS5wYXJlbnROb2RlKSBhcyBSRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHNpYmxpbmcgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5uZXh0U2libGluZyhub2RlKSA6IG5vZGUubmV4dFNpYmxpbmc7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX0uXG4gKlxuICogQHBhcmFtIGNoaWxkRWwgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIGVsZW1lbnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQoY2hpbGRFbDogUk5vZGUsIGNoaWxkVE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCAhPSBudWxsKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbSE9TVF9OT0RFXSAhO1xuXG4gICAgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihwYXJlbnRUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KSAhO1xuICAgICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgICAgIGNvbnN0IGluZGV4ID0gdmlld3MuaW5kZXhPZihjdXJyZW50Vmlldyk7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICAgICAgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgY2hpbGRFbCwgZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXgsIHZpZXdzLCBsQ29udGFpbmVyW05BVElWRV0pKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKSB7XG4gICAgICBjb25zdCBhbmNob3JOb2RlID0gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgY3VycmVudFZpZXcpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGNoaWxkRWwsIGFuY2hvck5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChyZW5kZXJQYXJlbnQsIGNoaWxkRWwpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlclBhcmVudC5hcHBlbmRDaGlsZChjaGlsZEVsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSB0b3AtbGV2ZWwgZWxlbWVudCBvciBhbiBJQ1UgY29udGFpbmVyIGlmIHRob3NlIGNvbnRhaW5lcnMgYXJlIG5lc3RlZC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXJ0aW5nIFROb2RlIGZvciB3aGljaCB3ZSBzaG91bGQgc2tpcCBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVyc1xuICogQHJldHVybnMgVGhlIFROb2RlIG9mIHRoZSBoaWdoZXN0IGxldmVsIElDVSBjb250YWluZXIgb3IgZWxlbWVudCBjb250YWluZXJcbiAqL1xuZnVuY3Rpb24gZ2V0SGlnaGVzdEVsZW1lbnRPcklDVUNvbnRhaW5lcih0Tm9kZTogVE5vZGUpOiBUTm9kZSB7XG4gIHdoaWxlICh0Tm9kZS5wYXJlbnQgIT0gbnVsbCAmJiAodE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpKSB7XG4gICAgdE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXg6IG51bWJlciwgdmlld3M6IExWaWV3W10sIGNvbnRhaW5lck5hdGl2ZTogUkNvbW1lbnQpIHtcbiAgaWYgKGluZGV4ICsgMSA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3c1tpbmRleCArIDFdIGFzIExWaWV3O1xuICAgIGNvbnN0IHZpZXdUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSBhcyBUVmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdUTm9kZS5jaGlsZCA/IGdldE5hdGl2ZUJ5VE5vZGUodmlld1ROb2RlLmNoaWxkLCB2aWV3KSA6IGNvbnRhaW5lck5hdGl2ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29udGFpbmVyTmF0aXZlO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgYGNoaWxkYCBlbGVtZW50IGZyb20gdGhlIERPTSBpZiBub3QgaW4gdmlldyBhbmQgbm90IHByb2plY3RlZC5cbiAqXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIHRvIHJlbW92ZVxuICogQHBhcmFtIGNoaWxkRWwgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDaGlsZChjaGlsZFROb2RlOiBUTm9kZSwgY2hpbGRFbDogUk5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBwYXJlbnROYXRpdmUgPSBnZXRSZW5kZXJQYXJlbnQoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpO1xuICAvLyBXZSBvbmx5IHJlbW92ZSB0aGUgZWxlbWVudCBpZiBpdCBhbHJlYWR5IGhhcyBhIHJlbmRlciBwYXJlbnQuXG4gIGlmIChwYXJlbnROYXRpdmUpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChjdXJyZW50Vmlld1tSRU5ERVJFUl0sIHBhcmVudE5hdGl2ZSwgY2hpbGRFbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0ZWRUTm9kZSBUaGUgVE5vZGUgdG8gYmUgcHJvamVjdGVkXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIFRoZSBwcm9qZWN0aW9uIChuZy1jb250ZW50KSBUTm9kZVxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBwcm9qZWN0aW9uVmlldyBQcm9qZWN0aW9uIHZpZXcgKHZpZXcgYWJvdmUgY3VycmVudClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgcHJvamVjdGVkVE5vZGU6IFROb2RlLCB0UHJvamVjdGlvbk5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcsXG4gICAgcHJvamVjdGlvblZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJvamVjdGVkVE5vZGUsIHByb2plY3Rpb25WaWV3KTtcbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICAvLyB0aGUgcHJvamVjdGVkIGNvbnRlbnRzIGFyZSBwcm9jZXNzZWQgd2hpbGUgaW4gdGhlIHNoYWRvdyB2aWV3ICh3aGljaCBpcyB0aGUgY3VycmVudFZpZXcpXG4gIC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIGV4dHJhY3QgdGhlIHZpZXcgd2hlcmUgdGhlIGhvc3QgZWxlbWVudCBsaXZlcyBzaW5jZSBpdCdzIHRoZVxuICAvLyBsb2dpY2FsIGNvbnRhaW5lciBvZiB0aGUgY29udGVudCBwcm9qZWN0ZWQgdmlld3NcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgcHJvamVjdGlvblZpZXcpO1xuXG4gIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IHByb2plY3Rpb25WaWV3W3Byb2plY3RlZFROb2RlLmluZGV4XTtcbiAgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgY29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIGFuIGVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbiB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCB2aWV3cyA9IG5vZGVPckNvbnRhaW5lcltWSUVXU107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld3NbaV0sIHRydWUsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBsZXQgbmdDb250YWluZXJDaGlsZFROb2RlOiBUTm9kZXxudWxsID0gcHJvamVjdGVkVE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gICAgICB3aGlsZSAobmdDb250YWluZXJDaGlsZFROb2RlKSB7XG4gICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobmdDb250YWluZXJDaGlsZFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3LCBwcm9qZWN0aW9uVmlldyk7XG4gICAgICAgIG5nQ29udGFpbmVyQ2hpbGRUTm9kZSA9IG5nQ29udGFpbmVyQ2hpbGRUTm9kZS5uZXh0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgYXBwZW5kQ2hpbGQobm9kZU9yQ29udGFpbmVyW05BVElWRV0sIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH1cbiAgfVxufVxuIl19