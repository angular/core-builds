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
import { ViewEncapsulation } from '../metadata/view';
import { attachPatchData } from './context_discovery';
import { callHooks } from './hooks';
import { NATIVE, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, CONTAINER_INDEX, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { findComponentView, getNativeByTNode, isComponent, isLContainer, isRootView, readElementValue, renderStringify } from './util';
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
            executeNodeAction(action, renderer, renderParent, getNativeByTNode(tNode, currentView), tNode, beforeNode);
            /** @type {?} */
            const nodeOrContainer = currentView[tNode.index];
            if (isLContainer(nodeOrContainer)) {
                // This element has an LContainer, and its comment needs to be handled
                executeNodeAction(action, renderer, renderParent, nodeOrContainer[NATIVE], tNode, beforeNode);
            }
        }
        else if (tNode.type === 0 /* Container */) {
            /** @type {?} */
            const lContainer = (/** @type {?} */ ((/** @type {?} */ (currentView))[tNode.index]));
            executeNodeAction(action, renderer, renderParent, lContainer[NATIVE], tNode, beforeNode);
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
            if (Array.isArray(head)) {
                for (let nativeNode of head) {
                    executeNodeAction(action, renderer, renderParent, nativeNode, tNode, beforeNode);
                }
            }
            else {
                // Must store both the TNode and the view because this projection node could be nested
                // deeply inside embedded views, and we need to get back down to this particular nested
                // view.
                projectionNodeStack[++projectionNodeIndex] = tNode;
                projectionNodeStack[++projectionNodeIndex] = (/** @type {?} */ (currentView));
                if (head) {
                    currentView = (/** @type {?} */ (componentView[PARENT]));
                    nextTNode = (/** @type {?} */ (currentView[TVIEW].data[head.index]));
                }
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
 * @param {?} tNode
 * @param {?=} beforeNode
 * @return {?}
 */
function executeNodeAction(action, renderer, parent, node, tNode, beforeNode) {
    if (action === 0 /* Insert */) {
        nativeInsertBefore(renderer, (/** @type {?} */ (parent)), node, beforeNode || null);
    }
    else if (action === 1 /* Detach */) {
        nativeRemoveChild(renderer, (/** @type {?} */ (parent)), node, isComponent(tNode));
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
    return isProceduralRenderer(renderer) ? renderer.createText(renderStringify(value)) :
        renderer.createTextNode(renderStringify(value));
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
        if (isLContainer(viewOrContainer)) {
            // If container, traverse down to its first LView.
            /** @type {?} */
            const container = (/** @type {?} */ (viewOrContainer));
            /** @type {?} */
            const viewsInContainer = container[VIEWS];
            if (viewsInContainer.length) {
                next = viewsInContainer[0];
            }
        }
        else {
            // If LView, traverse down to child.
            /** @type {?} */
            const view = (/** @type {?} */ (viewOrContainer));
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        if (next == null) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (viewOrContainer && !(/** @type {?} */ (viewOrContainer))[NEXT] && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
                if (isLContainer(viewOrContainer)) {
                    // this view will be destroyed so we need to notify queries that a view is detached
                    /** @type {?} */
                    const viewsInContainer = ((/** @type {?} */ (viewOrContainer)))[VIEWS];
                    for (let viewToDetach of viewsInContainer) {
                        if (viewToDetach[QUERIES]) {
                            (/** @type {?} */ (viewToDetach[QUERIES])).removeView();
                        }
                    }
                }
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
    lView[FLAGS] |= 128 /* Attached */;
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
    viewToDetach[FLAGS] &= ~128 /* Attached */;
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
    if (!(view[FLAGS] & 256 /* Destroyed */)) {
        /** @type {?} */
        const renderer = view[RENDERER];
        if (isProceduralRenderer(renderer) && renderer.destroyNode) {
            walkTNodeTree(view, 2 /* Destroy */, renderer, null);
        }
        destroyViewTree(view);
    }
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
        // Mark the LView as destroyed *before* executing the onDestroy hooks. An onDestroy hook
        // runs arbitrary user code, which could include its own `viewRef.destroy()` (or similar). If
        // We don't flag the view as destroyed before the hooks, this could lead to an infinite loop.
        // This also aligns with the ViewEngine behavior. It also means that the onDestroy hook is
        // really more of an "afterDestroy" hook if you think about it.
        view[FLAGS] |= 256 /* Destroyed */;
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
 *   of a View which has not be inserted or is made for projection but has not been inserted
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
        if (parent.flags & 1 /* isComponent */) {
            /** @type {?} */
            const tData = currentView[TVIEW].data;
            /** @type {?} */
            const tNode = (/** @type {?} */ (tData[parent.index]));
            /** @type {?} */
            const encapsulation = ((/** @type {?} */ (tData[tNode.directiveStart]))).encapsulation;
            // We've got a parent which is an element in the current view. We just need to verify if the
            // parent element is not a component. Component's content nodes are not inserted immediately
            // because they will be projected, and so doing insert at this point would be wasteful.
            // Since the projection would then move it to its final destination. Note that we can't
            // make this assumption when using the Shadow DOM, because the native projection placeholders
            // (<content> or <slot>) have to be in place as elements are being inserted.
            if (encapsulation !== ViewEncapsulation.ShadowDom &&
                encapsulation !== ViewEncapsulation.Native) {
                return null;
            }
        }
        return (/** @type {?} */ (getNativeByTNode(parent, currentView)));
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
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @return {?}
 */
function nativeAppendChild(renderer, parent, child) {
    if (isProceduralRenderer(renderer)) {
        renderer.appendChild(parent, child);
    }
    else {
        parent.appendChild(child);
    }
}
/**
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?} beforeNode
 * @return {?}
 */
function nativeAppendOrInsertBefore(renderer, parent, child, beforeNode) {
    if (beforeNode) {
        nativeInsertBefore(renderer, parent, child, beforeNode);
    }
    else {
        nativeAppendChild(renderer, parent, child);
    }
}
/**
 * Removes a native child node from a given native parent node.
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?=} isHostElement
 * @return {?}
 */
export function nativeRemoveChild(renderer, parent, child, isHostElement) {
    isProceduralRenderer(renderer) ? renderer.removeChild((/** @type {?} */ (parent)), child, isHostElement) :
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
 * Finds a native "anchor" node for cases where we can't append a native child directly
 * (`appendChild`) and need to use a reference (anchor) node for the `insertBefore` operation.
 * @param {?} parentTNode
 * @param {?} lView
 * @return {?}
 */
function getNativeAnchorNode(parentTNode, lView) {
    if (parentTNode.type === 2 /* View */) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (getLContainer((/** @type {?} */ (parentTNode)), lView)));
        /** @type {?} */
        const views = lContainer[VIEWS];
        /** @type {?} */
        const index = views.indexOf(lView);
        return getBeforeNodeForView(index, views, lContainer[NATIVE]);
    }
    else if (parentTNode.type === 4 /* ElementContainer */ ||
        parentTNode.type === 5 /* IcuContainer */) {
        return getNativeByTNode(parentTNode, lView);
    }
    return null;
}
/**
 * Appends the `child` native node (or a collection of nodes) to the `parent`.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}.
 *
 * @param {?} childEl The native child (or children) that should be appended
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
        /** @type {?} */
        const anchorNode = getNativeAnchorNode(parentTNode, currentView);
        if (Array.isArray(childEl)) {
            for (let nativeNode of childEl) {
                nativeAppendOrInsertBefore(renderer, renderParent, nativeNode, anchorNode);
            }
        }
        else {
            nativeAppendOrInsertBefore(renderer, renderParent, childEl, anchorNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFhLE1BQU0sRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0csT0FBTyxFQUErRiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6SyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBK0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxRQUFRLENBQUM7O01BRS9ILHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcs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QUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFbEQsMkZBQTJGO0lBQzNGLG9GQUFvRjtJQUNwRixtREFBbUQ7SUFDbkQsZUFBZSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQzs7VUFFbEMsZUFBZSxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO0lBQzVELElBQUksY0FBYyxDQUFDLElBQUksc0JBQXdCLEVBQUU7Ozs7Ozs7Y0FNekMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUNyRTtLQUNGO1NBQU07UUFDTCxJQUFJLGNBQWMsQ0FBQyxJQUFJLDZCQUErQixFQUFFOztnQkFDbEQscUJBQXFCLEdBQWUsbUJBQUEsY0FBYyxDQUFDLEtBQUssRUFBUztZQUNyRSxPQUFPLHFCQUFxQixFQUFFO2dCQUM1QixtQkFBbUIsQ0FBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN6RixxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7YUFDcEQ7U0FDRjtRQUVELElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ2pDLFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3BFO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFLCBWSUVXUywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50VmlldywgZ2V0TmF0aXZlQnlUTm9kZSwgaXNDb21wb25lbnQsIGlzTENvbnRhaW5lciwgaXNSb290VmlldywgcmVhZEVsZW1lbnRWYWx1ZSwgcmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TENvbnRhaW5lcih0Tm9kZTogVFZpZXdOb2RlLCBlbWJlZGRlZFZpZXc6IExWaWV3KTogTENvbnRhaW5lcnxudWxsIHtcbiAgaWYgKHROb2RlLmluZGV4ID09PSAtMSkge1xuICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgaW5zaWRlIGEgZHluYW1pYyBjb250YWluZXIuXG4gICAgLy8gSWYgdGhlIGhvc3QgaW5kZXggaXMgLTEsIHRoZSB2aWV3IGhhcyBub3QgeWV0IGJlZW4gaW5zZXJ0ZWQsIHNvIGl0IGhhcyBubyBwYXJlbnQuXG4gICAgY29uc3QgY29udGFpbmVySG9zdEluZGV4ID0gZW1iZWRkZWRWaWV3W0NPTlRBSU5FUl9JTkRFWF07XG4gICAgcmV0dXJuIGNvbnRhaW5lckhvc3RJbmRleCA+IC0xID8gZW1iZWRkZWRWaWV3W1BBUkVOVF0gIVtjb250YWluZXJIb3N0SW5kZXhdIDogbnVsbDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGEgaW5saW5lIHZpZXcgbm9kZSAoZS5nLiBlbWJlZGRlZFZpZXdTdGFydClcbiAgICByZXR1cm4gZW1iZWRkZWRWaWV3W1BBUkVOVF0gIVt0Tm9kZS5wYXJlbnQgIS5pbmRleF0gYXMgTENvbnRhaW5lcjtcbiAgfVxufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHRWaWV3Tm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBuYXRpdmVQYXJlbnROb2RlKHZpZXdbUkVOREVSRVJdLCBjb250YWluZXJbTkFUSVZFXSkgOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiB3YWxrVE5vZGVUcmVlLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiB3YWxrVE5vZGVUcmVlIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXcgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIFdhbGtzIGEgdHJlZSBvZiBUTm9kZXMsIGFwcGx5aW5nIGEgdHJhbnNmb3JtYXRpb24gb24gdGhlIGVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqXG4gKiBAcGFyYW0gdmlld1RvV2FsayB0aGUgdmlldyB0byB3YWxrXG4gKiBAcGFyYW0gYWN0aW9uIGlkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIGVsZW1lbnRzXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIGN1cnJlbnQgcmVuZGVyZXIuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50IE9wdGlvbmFsIHRoZSByZW5kZXIgcGFyZW50IG5vZGUgdG8gYmUgc2V0IGluIGFsbCBMQ29udGFpbmVycyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgSW5zZXJ0IGFuZCBEZXN0cm95LlxuICogQHBhcmFtIGJlZm9yZU5vZGUgT3B0aW9uYWwgdGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgcmVxdWlyZWQgZm9yIGFjdGlvblxuICogSW5zZXJ0LlxuICovXG5mdW5jdGlvbiB3YWxrVE5vZGVUcmVlKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gdmlld1RvV2Fsa1tUVklFV10ubm9kZSBhcyBUVmlld05vZGU7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG4gIGxldCBjdXJyZW50VmlldyA9IHZpZXdUb1dhbGs7XG4gIGxldCB0Tm9kZTogVE5vZGV8bnVsbCA9IHJvb3RUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgbGV0IG5leHRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihcbiAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gY3VycmVudFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICAgIC8vIFRoaXMgZWxlbWVudCBoYXMgYW4gTENvbnRhaW5lciwgYW5kIGl0cyBjb21tZW50IG5lZWRzIHRvIGJlIGhhbmRsZWRcbiAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gY3VycmVudFZpZXcgIVt0Tm9kZS5pbmRleF0gYXMgTENvbnRhaW5lcjtcbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbENvbnRhaW5lcltOQVRJVkVdLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgIGlmIChsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBsQ29udGFpbmVyW1ZJRVdTXVswXTtcbiAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgd2Fsa2VyIGVudGVycyBhIGNvbnRhaW5lciwgdGhlbiB0aGUgYmVmb3JlTm9kZSBoYXMgdG8gYmVjb21lIHRoZSBsb2NhbCBuYXRpdmVcbiAgICAgICAgLy8gY29tbWVudCBub2RlLlxuICAgICAgICBiZWZvcmVOb2RlID0gbENvbnRhaW5lcltOQVRJVkVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhjdXJyZW50VmlldyAhKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZCkpIHtcbiAgICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBoZWFkKSB7XG4gICAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBuYXRpdmVOb2RlLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE11c3Qgc3RvcmUgYm90aCB0aGUgVE5vZGUgYW5kIHRoZSB2aWV3IGJlY2F1c2UgdGhpcyBwcm9qZWN0aW9uIG5vZGUgY291bGQgYmUgbmVzdGVkXG4gICAgICAgIC8vIGRlZXBseSBpbnNpZGUgZW1iZWRkZWQgdmlld3MsIGFuZCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gdGhpcyBwYXJ0aWN1bGFyIG5lc3RlZFxuICAgICAgICAvLyB2aWV3LlxuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSB0Tm9kZTtcbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gY3VycmVudFZpZXcgITtcbiAgICAgICAgaWYgKGhlYWQpIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGEgVmlldyBvciBhbiBFbGVtZW50Q29udGFpbmVyXG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5jaGlsZDtcbiAgICB9XG5cbiAgICBpZiAobmV4dFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKHROb2RlLm5leHQgPT09IG51bGwgJiYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXc7XG4gICAgICAgIHROb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIFROb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICAgICAgICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gICAgICAgKlxuICAgICAgICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGVuIGl0IGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAgICAgICAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICAgICAgICovXG4gICAgICB3aGlsZSAoIW5leHRUTm9kZSkge1xuICAgICAgICAvLyBJZiBwYXJlbnQgaXMgbnVsbCwgd2UncmUgY3Jvc3NpbmcgdGhlIHZpZXcgYm91bmRhcnksIHNvIHdlIHNob3VsZCBnZXQgdGhlIGhvc3QgVE5vZGUuXG4gICAgICAgIHROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIGlmICh0Tm9kZSA9PT0gbnVsbCB8fCB0Tm9kZSA9PT0gcm9vdFROb2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyBXaGVuIGV4aXRpbmcgYSBjb250YWluZXIsIHRoZSBiZWZvcmVOb2RlIG11c3QgYmUgcmVzdG9yZWQgdG8gdGhlIHByZXZpb3VzIHZhbHVlXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgICAgYmVmb3JlTm9kZSA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XVtOQVRJVkVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ICYmIGN1cnJlbnRWaWV3W05FWFRdKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tORVhUXSBhcyBMVmlldztcbiAgICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gbmV4dFROb2RlO1xuICB9XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIG5vZGU6IFJDb21tZW50IHwgUkVsZW1lbnQgfCBSVGV4dCwgdE5vZGU6IFROb2RlLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0KSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgbmF0aXZlUmVtb3ZlQ2hpbGQocmVuZGVyZXIsIHBhcmVudCAhLCBub2RlLCBpc0NvbXBvbmVudCh0Tm9kZSkpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3fExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmIChpc0xDb250YWluZXIodmlld09yQ29udGFpbmVyKSkge1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgY29uc3Qgdmlld3NJbkNvbnRhaW5lciA9IGNvbnRhaW5lcltWSUVXU107XG4gICAgICBpZiAodmlld3NJbkNvbnRhaW5lci5sZW5ndGgpIHtcbiAgICAgICAgbmV4dCA9IHZpZXdzSW5Db250YWluZXJbMF07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIExWaWV3LCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlldztcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgICBpZiAoaXNMQ29udGFpbmVyKHZpZXdPckNvbnRhaW5lcikpIHtcbiAgICAgICAgICAvLyB0aGlzIHZpZXcgd2lsbCBiZSBkZXN0cm95ZWQgc28gd2UgbmVlZCB0byBub3RpZnkgcXVlcmllcyB0aGF0IGEgdmlldyBpcyBkZXRhY2hlZFxuICAgICAgICAgIGNvbnN0IHZpZXdzSW5Db250YWluZXIgPSAodmlld09yQ29udGFpbmVyIGFzIExDb250YWluZXIpW1ZJRVdTXTtcbiAgICAgICAgICBmb3IgKGxldCB2aWV3VG9EZXRhY2ggb2Ygdmlld3NJbkNvbnRhaW5lcikge1xuICAgICAgICAgICAgaWYgKHZpZXdUb0RldGFjaFtRVUVSSUVTXSkge1xuICAgICAgICAgICAgICB2aWV3VG9EZXRhY2hbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgfHwgcm9vdFZpZXcpO1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lciAmJiB2aWV3T3JDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gcGFyZW50VmlldyBUaGUgbmV3IHBhcmVudCBvZiB0aGUgaW5zZXJ0ZWQgdmlld1xuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEBwYXJhbSBjb250YWluZXJJbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBub2RlLCBpZiBkeW5hbWljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGxWaWV3OiBMVmlldywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgcGFyZW50VmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsXG4gICAgY29udGFpbmVySW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICAvLyBEeW5hbWljYWxseSBpbnNlcnRlZCB2aWV3cyBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIHBhcmVudCBjb250YWluZXIncyBob3N0IHNvIGl0J3NcbiAgLy8gcG9zc2libGUgdG8ganVtcCBmcm9tIGEgdmlldyB0byBpdHMgY29udGFpbmVyJ3MgbmV4dCB3aGVuIHdhbGtpbmcgdGhlIG5vZGUgdHJlZS5cbiAgaWYgKGNvbnRhaW5lckluZGV4ID4gLTEpIHtcbiAgICBsVmlld1tDT05UQUlORVJfSU5ERVhdID0gY29udGFpbmVySW5kZXg7XG4gICAgbFZpZXdbUEFSRU5UXSA9IHBhcmVudFZpZXc7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHBhcmFtIGRldGFjaGVkIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBhbHJlYWR5IGRldGFjaGVkLlxuICogQHJldHVybnMgRGV0YWNoZWQgTFZpZXcgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIsIGRldGFjaGVkOiBib29sZWFuKTogTFZpZXcge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICB2aWV3c1tyZW1vdmVJbmRleCAtIDFdW05FWFRdID0gdmlld1RvRGV0YWNoW05FWFRdIGFzIExWaWV3O1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGlmICghZGV0YWNoZWQpIHtcbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9EZXRhY2gsIGZhbHNlKTtcbiAgfVxuXG4gIGlmICh2aWV3VG9EZXRhY2hbUVVFUklFU10pIHtcbiAgICB2aWV3VG9EZXRhY2hbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gIH1cbiAgdmlld1RvRGV0YWNoW0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgcmV0dXJuIHZpZXdUb0RldGFjaDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gdENvbnRhaW5lciBUaGUgVENvbnRhaW5lciBub2RlIGFzc29jaWF0ZWQgd2l0aCB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgY29udGFpbmVySG9zdDogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgcmVtb3ZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2aWV3ID0gbENvbnRhaW5lcltWSUVXU11bcmVtb3ZlSW5kZXhdO1xuICBkZXRhY2hWaWV3KGxDb250YWluZXIsIHJlbW92ZUluZGV4LCAhIWNvbnRhaW5lckhvc3QuZGV0YWNoZWQpO1xuICBkZXN0cm95TFZpZXcodmlldyk7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXcgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld0NoaWxkKGxWaWV3OiBMVmlldyk6IExWaWV3fExDb250YWluZXJ8bnVsbCB7XG4gIGNvbnN0IGNoaWxkSW5kZXggPSBsVmlld1tUVklFV10uY2hpbGRJbmRleDtcbiAgcmV0dXJuIGNoaWxkSW5kZXggPT09IC0xID8gbnVsbCA6IGxWaWV3W2NoaWxkSW5kZXhdO1xufVxuXG4vKipcbiAqIEEgc3RhbmRhbG9uZSBmdW5jdGlvbiB3aGljaCBkZXN0cm95cyBhbiBMVmlldyxcbiAqIGNvbmR1Y3RpbmcgY2xlYW51cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gYmUgZGVzdHJveWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUxWaWV3KHZpZXc6IExWaWV3KSB7XG4gIGlmICghKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgICB3YWxrVE5vZGVUcmVlKHZpZXcsIFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIsIG51bGwpO1xuICAgIH1cblxuICAgIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXcgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICBsZXQgdE5vZGU7XG4gIGlmIChzdGF0ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCAmJiAodE5vZGUgPSAoc3RhdGUgYXMgTFZpZXcpICFbSE9TVF9OT0RFXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRMQ29udGFpbmVyKHROb2RlIGFzIFRWaWV3Tm9kZSwgc3RhdGUgYXMgTFZpZXcpIGFzIExDb250YWluZXI7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkRlc3Ryb3lzIGhvb2tzIGZvciBhbGwgZGlyZWN0aXZlcyBhbmQgcGlwZXMgaW4gYSBnaXZlbiB2aWV3IGFuZCB0aGVuIHJlbW92ZXMgYWxsXG4gKiBsaXN0ZW5lcnMuIExpc3RlbmVycyBhcmUgcmVtb3ZlZCBhcyB0aGUgbGFzdCBzdGVwIHNvIGV2ZW50cyBkZWxpdmVyZWQgaW4gdGhlIG9uRGVzdHJveXMgaG9va3NcbiAqIGNhbiBiZSBwcm9wYWdhdGVkIHRvIEBPdXRwdXQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXI6IExWaWV3IHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlldykubGVuZ3RoID49IEhFQURFUl9PRkZTRVQpIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3O1xuXG4gICAgLy8gTWFyayB0aGUgTFZpZXcgYXMgZGVzdHJveWVkICpiZWZvcmUqIGV4ZWN1dGluZyB0aGUgb25EZXN0cm95IGhvb2tzLiBBbiBvbkRlc3Ryb3kgaG9va1xuICAgIC8vIHJ1bnMgYXJiaXRyYXJ5IHVzZXIgY29kZSwgd2hpY2ggY291bGQgaW5jbHVkZSBpdHMgb3duIGB2aWV3UmVmLmRlc3Ryb3koKWAgKG9yIHNpbWlsYXIpLiBJZlxuICAgIC8vIFdlIGRvbid0IGZsYWcgdGhlIHZpZXcgYXMgZGVzdHJveWVkIGJlZm9yZSB0aGUgaG9va3MsIHRoaXMgY291bGQgbGVhZCB0byBhbiBpbmZpbml0ZSBsb29wLlxuICAgIC8vIFRoaXMgYWxzbyBhbGlnbnMgd2l0aCB0aGUgVmlld0VuZ2luZSBiZWhhdmlvci4gSXQgYWxzbyBtZWFucyB0aGF0IHRoZSBvbkRlc3Ryb3kgaG9vayBpc1xuICAgIC8vIHJlYWxseSBtb3JlIG9mIGFuIFwiYWZ0ZXJEZXN0cm95XCIgaG9vayBpZiB5b3UgdGhpbmsgYWJvdXQgaXQuXG4gICAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG5cbiAgICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gICAgY29uc3QgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdO1xuICAgIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhcyBjbGVhbiB1cCB0aW1lLlxuICAgIGlmIChob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdENsZWFudXAgPSBsVmlld1tUVklFV10uY2xlYW51cCAhO1xuICBpZiAodENsZWFudXAgIT0gbnVsbCkge1xuICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiB0Q2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggdGhlIG5hdGl2ZSByZW5kZXJlclxuICAgICAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IHRDbGVhbnVwW2kgKyAxXTtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdHlwZW9mIGlkeE9yVGFyZ2V0R2V0dGVyID09PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICAgIGlkeE9yVGFyZ2V0R2V0dGVyKGxWaWV3KSA6XG4gICAgICAgICAgICByZWFkRWxlbWVudFZhbHVlKGxWaWV3W2lkeE9yVGFyZ2V0R2V0dGVyXSk7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gbENsZWFudXBbdENsZWFudXBbaSArIDJdXTtcbiAgICAgICAgY29uc3QgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gdENsZWFudXBbaSArIDNdO1xuICAgICAgICBpZiAodHlwZW9mIHVzZUNhcHR1cmVPclN1YklkeCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgLy8gRE9NIGxpc3RlbmVyXG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodENsZWFudXBbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlT3JTdWJJZHgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh1c2VDYXB0dXJlT3JTdWJJZHggPj0gMCkge1xuICAgICAgICAgICAgLy8gdW5yZWdpc3RlclxuICAgICAgICAgICAgbENsZWFudXBbdXNlQ2FwdHVyZU9yU3ViSWR4XSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdWJzY3JpcHRpb25cbiAgICAgICAgICAgIGxDbGVhbnVwWy11c2VDYXB0dXJlT3JTdWJJZHhdLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSBsQ2xlYW51cFt0Q2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMV1dO1xuICAgICAgICB0Q2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgY2FsbEhvb2tzKHZpZXcsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIGVsZW1lbnQgaWYgYSBub2RlIGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFkZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlclBhcmVudCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICAvLyBOb2RlcyBvZiB0aGUgdG9wLW1vc3QgdmlldyBjYW4gYmUgaW5zZXJ0ZWQgZWFnZXJseS5cbiAgaWYgKGlzUm9vdFZpZXcoY3VycmVudFZpZXcpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZVBhcmVudE5vZGUoY3VycmVudFZpZXdbUkVOREVSRVJdLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBjdXJyZW50VmlldykpO1xuICB9XG5cbiAgLy8gU2tpcCBvdmVyIGVsZW1lbnQgYW5kIElDVSBjb250YWluZXJzIGFzIHRob3NlIGFyZSByZXByZXNlbnRlZCBieSBhIGNvbW1lbnQgbm9kZSBhbmRcbiAgLy8gY2FuJ3QgYmUgdXNlZCBhcyBhIHJlbmRlciBwYXJlbnQuXG4gIGNvbnN0IHBhcmVudCA9IGdldEhpZ2hlc3RFbGVtZW50T3JJQ1VDb250YWluZXIodE5vZGUpLnBhcmVudDtcblxuICAvLyBJZiB0aGUgcGFyZW50IGlzIG51bGwsIHRoZW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3Mgdmlld3M6IGVpdGhlciBpbnRvIGFuIGVtYmVkZGVkIHZpZXcgb3IgYVxuICAvLyBjb21wb25lbnQgdmlldy5cbiAgaWYgKHBhcmVudCA9PSBudWxsKSB7XG4gICAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXSAhO1xuICAgIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgYW4gZW1iZWRkZWQgdmlldyBXZSBtaWdodCBkZWxheSBpbnNlcnRpb24gb2YgY2hpbGRyZW5cbiAgICAgIC8vIGZvciBhIGdpdmVuIHZpZXcgaWYgaXQgaXMgZGlzY29ubmVjdGVkLiBUaGlzIG1pZ2h0IGhhcHBlbiBmb3IgMiBtYWluIHJlYXNvbnM6XG4gICAgICAvLyAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lcih2aWV3IHdhcyBjcmVhdGVkIGJ1dCBub3QgaW5zZXJ0ZWQgeWV0KVxuICAgICAgLy8gLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAgICAgIC8vIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICAgICAgLy8gSW4gb3RoZXIgd29yZHMgd2UgY2FuIGluc2VydCBjaGlsZHJlbiBvZiBhIGdpdmVuIHZpZXcgaWYgdGhpcyB2aWV3IHdhcyBpbnNlcnRlZCBpbnRvIGFcbiAgICAgIC8vIGNvbnRhaW5lciBhbmQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaGFzIGl0cyByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gICAgICByZXR1cm4gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KGhvc3RUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmRcbiAgICAgIC8vIGl0IHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gICAgICByZXR1cm4gZ2V0SG9zdE5hdGl2ZShjdXJyZW50Vmlldyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwYXJlbnQsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBpZiAocGFyZW50LmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkge1xuICAgICAgY29uc3QgdERhdGEgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YTtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbcGFyZW50LmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIGNvbnN0IGVuY2Fwc3VsYXRpb24gPSAodERhdGFbdE5vZGUuZGlyZWN0aXZlU3RhcnRdIGFzIENvbXBvbmVudERlZjxhbnk+KS5lbmNhcHN1bGF0aW9uO1xuXG4gICAgICAvLyBXZSd2ZSBnb3QgYSBwYXJlbnQgd2hpY2ggaXMgYW4gZWxlbWVudCBpbiB0aGUgY3VycmVudCB2aWV3LiBXZSBqdXN0IG5lZWQgdG8gdmVyaWZ5IGlmIHRoZVxuICAgICAgLy8gcGFyZW50IGVsZW1lbnQgaXMgbm90IGEgY29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAgICAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhlbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi4gTm90ZSB0aGF0IHdlIGNhbid0XG4gICAgICAvLyBtYWtlIHRoaXMgYXNzdW1wdGlvbiB3aGVuIHVzaW5nIHRoZSBTaGFkb3cgRE9NLCBiZWNhdXNlIHRoZSBuYXRpdmUgcHJvamVjdGlvbiBwbGFjZWhvbGRlcnNcbiAgICAgIC8vICg8Y29udGVudD4gb3IgPHNsb3Q+KSBoYXZlIHRvIGJlIGluIHBsYWNlIGFzIGVsZW1lbnRzIGFyZSBiZWluZyBpbnNlcnRlZC5cbiAgICAgIGlmIChlbmNhcHN1bGF0aW9uICE9PSBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb20gJiZcbiAgICAgICAgICBlbmNhcHN1bGF0aW9uICE9PSBWaWV3RW5jYXBzdWxhdGlvbi5OYXRpdmUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50LCBjdXJyZW50VmlldykgYXMgUkVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgaG9zdCBlbGVtZW50IGZvciBhIGdpdmVuIHZpZXcuIFdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIGN1cnJlbnQgdmlldyBkb2VzIG5vdCBoYXZlXG4gKiBhIGhvc3QgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9zdE5hdGl2ZShjdXJyZW50VmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXTtcbiAgcmV0dXJuIGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgP1xuICAgICAgKGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBjdXJyZW50Vmlld1tQQVJFTlRdICEpIGFzIFJFbGVtZW50KSA6XG4gICAgICBudWxsO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQgdXNpbmcge0BsaW5rIFJlbmRlcmVyM30uXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZCAtIGl0IGFic3RyYWN0cyBhblxuICogYWN0dWFsIHJlbmRlcmVyIGJlaW5nIHVzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudCwgY2hpbGQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGJlZm9yZU5vZGUpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICB9IGVsc2Uge1xuICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBuYXRpdmUgY2hpbGQgbm9kZSBmcm9tIGEgZ2l2ZW4gbmF0aXZlIHBhcmVudCBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUmVtb3ZlQ2hpbGQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIGNoaWxkLCBpc0hvc3RFbGVtZW50KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBwYXJlbnQgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSRWxlbWVudHxudWxsIHtcbiAgcmV0dXJuIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5wYXJlbnROb2RlKG5vZGUpIDogbm9kZS5wYXJlbnROb2RlKSBhcyBSRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHNpYmxpbmcgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5uZXh0U2libGluZyhub2RlKSA6IG5vZGUubmV4dFNpYmxpbmc7XG59XG5cbi8qKlxuICogRmluZHMgYSBuYXRpdmUgXCJhbmNob3JcIiBub2RlIGZvciBjYXNlcyB3aGVyZSB3ZSBjYW4ndCBhcHBlbmQgYSBuYXRpdmUgY2hpbGQgZGlyZWN0bHlcbiAqIChgYXBwZW5kQ2hpbGRgKSBhbmQgbmVlZCB0byB1c2UgYSByZWZlcmVuY2UgKGFuY2hvcikgbm9kZSBmb3IgdGhlIGBpbnNlcnRCZWZvcmVgIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSBwYXJlbnRUTm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZXxudWxsIHtcbiAgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGdldExDb250YWluZXIocGFyZW50VE5vZGUgYXMgVFZpZXdOb2RlLCBsVmlldykgITtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGNvbnN0IGluZGV4ID0gdmlld3MuaW5kZXhPZihsVmlldyk7XG4gICAgcmV0dXJuIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4LCB2aWV3cywgbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgfSBlbHNlIGlmIChcbiAgICAgIHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8XG4gICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIG5hdGl2ZSBub2RlIChvciBhIGNvbGxlY3Rpb24gb2Ygbm9kZXMpIHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX0uXG4gKlxuICogQHBhcmFtIGNoaWxkRWwgVGhlIG5hdGl2ZSBjaGlsZCAob3IgY2hpbGRyZW4pIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIGVsZW1lbnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQoY2hpbGRFbDogUk5vZGUgfCBSTm9kZVtdLCBjaGlsZFROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudChjaGlsZFROb2RlLCBjdXJyZW50Vmlldyk7XG4gIGlmIChyZW5kZXJQYXJlbnQgIT0gbnVsbCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IHBhcmVudFROb2RlOiBUTm9kZSA9IGNoaWxkVE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV0gITtcbiAgICBjb25zdCBhbmNob3JOb2RlID0gZ2V0TmF0aXZlQW5jaG9yTm9kZShwYXJlbnRUTm9kZSwgY3VycmVudFZpZXcpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkRWwpKSB7XG4gICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGNoaWxkRWwpIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbmF0aXZlTm9kZSwgYW5jaG9yTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGNoaWxkRWwsIGFuY2hvck5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIHRvcC1sZXZlbCBlbGVtZW50IG9yIGFuIElDVSBjb250YWluZXIgaWYgdGhvc2UgY29udGFpbmVycyBhcmUgbmVzdGVkLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhcnRpbmcgVE5vZGUgZm9yIHdoaWNoIHdlIHNob3VsZCBza2lwIGVsZW1lbnQgYW5kIElDVSBjb250YWluZXJzXG4gKiBAcmV0dXJucyBUaGUgVE5vZGUgb2YgdGhlIGhpZ2hlc3QgbGV2ZWwgSUNVIGNvbnRhaW5lciBvciBlbGVtZW50IGNvbnRhaW5lclxuICovXG5mdW5jdGlvbiBnZXRIaWdoZXN0RWxlbWVudE9ySUNVQ29udGFpbmVyKHROb2RlOiBUTm9kZSk6IFROb2RlIHtcbiAgd2hpbGUgKHROb2RlLnBhcmVudCAhPSBudWxsICYmICh0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikpIHtcbiAgICB0Tm9kZSA9IHROb2RlLnBhcmVudDtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleDogbnVtYmVyLCB2aWV3czogTFZpZXdbXSwgY29udGFpbmVyTmF0aXZlOiBSQ29tbWVudCkge1xuICBpZiAoaW5kZXggKyAxIDwgdmlld3MubGVuZ3RoKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdzW2luZGV4ICsgMV0gYXMgTFZpZXc7XG4gICAgY29uc3Qgdmlld1ROb2RlID0gdmlld1tIT1NUX05PREVdIGFzIFRWaWV3Tm9kZTtcbiAgICByZXR1cm4gdmlld1ROb2RlLmNoaWxkID8gZ2V0TmF0aXZlQnlUTm9kZSh2aWV3VE5vZGUuY2hpbGQsIHZpZXcpIDogY29udGFpbmVyTmF0aXZlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjb250YWluZXJOYXRpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBgY2hpbGRgIGVsZW1lbnQgZnJvbSB0aGUgRE9NIGlmIG5vdCBpbiB2aWV3IGFuZCBub3QgcHJvamVjdGVkLlxuICpcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgdG8gcmVtb3ZlXG4gKiBAcGFyYW0gY2hpbGRFbCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIHJlbW92ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNoaWxkKGNoaWxkVE5vZGU6IFROb2RlLCBjaGlsZEVsOiBSTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHBhcmVudE5hdGl2ZSA9IGdldFJlbmRlclBhcmVudChjaGlsZFROb2RlLCBjdXJyZW50Vmlldyk7XG4gIC8vIFdlIG9ubHkgcmVtb3ZlIHRoZSBlbGVtZW50IGlmIGl0IGFscmVhZHkgaGFzIGEgcmVuZGVyIHBhcmVudC5cbiAgaWYgKHBhcmVudE5hdGl2ZSkge1xuICAgIG5hdGl2ZVJlbW92ZUNoaWxkKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSwgcGFyZW50TmF0aXZlLCBjaGlsZEVsKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHByb2plY3RlZFROb2RlIFRoZSBUTm9kZSB0byBiZSBwcm9qZWN0ZWRcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgVGhlIHByb2plY3Rpb24gKG5nLWNvbnRlbnQpIFROb2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlldyAodmlldyBhYm92ZSBjdXJyZW50KVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBwcm9qZWN0ZWRUTm9kZTogVE5vZGUsIHRQcm9qZWN0aW9uTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyxcbiAgICBwcm9qZWN0aW9uVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcm9qZWN0ZWRUTm9kZSwgcHJvamVjdGlvblZpZXcpO1xuICBhcHBlbmRDaGlsZChuYXRpdmUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuXG4gIC8vIHRoZSBwcm9qZWN0ZWQgY29udGVudHMgYXJlIHByb2Nlc3NlZCB3aGlsZSBpbiB0aGUgc2hhZG93IHZpZXcgKHdoaWNoIGlzIHRoZSBjdXJyZW50VmlldylcbiAgLy8gdGhlcmVmb3JlIHdlIG5lZWQgdG8gZXh0cmFjdCB0aGUgdmlldyB3aGVyZSB0aGUgaG9zdCBlbGVtZW50IGxpdmVzIHNpbmNlIGl0J3MgdGhlXG4gIC8vIGxvZ2ljYWwgY29udGFpbmVyIG9mIHRoZSBjb250ZW50IHByb2plY3RlZCB2aWV3c1xuICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBwcm9qZWN0aW9uVmlldyk7XG5cbiAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gcHJvamVjdGlvblZpZXdbcHJvamVjdGVkVE5vZGUuaW5kZXhdO1xuICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBjb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gYW4gZWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGNvbnN0IHZpZXdzID0gbm9kZU9yQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3c1tpXSwgdHJ1ZSwgbm9kZU9yQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGxldCBuZ0NvbnRhaW5lckNoaWxkVE5vZGU6IFROb2RlfG51bGwgPSBwcm9qZWN0ZWRUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgICAgIHdoaWxlIChuZ0NvbnRhaW5lckNoaWxkVE5vZGUpIHtcbiAgICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShuZ0NvbnRhaW5lckNoaWxkVE5vZGUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcsIHByb2plY3Rpb25WaWV3KTtcbiAgICAgICAgbmdDb250YWluZXJDaGlsZFROb2RlID0gbmdDb250YWluZXJDaGlsZFROb2RlLm5leHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICBhcHBlbmRDaGlsZChub2RlT3JDb250YWluZXJbTkFUSVZFXSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG4gICAgfVxuICB9XG59XG4iXX0=