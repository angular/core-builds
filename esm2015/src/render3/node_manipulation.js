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
import { assertDefined } from '../util/assert';
import { assertLContainer, assertLView } from './assert';
import { attachPatchData } from './context_discovery';
import { NATIVE, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CHILD_HEAD, CLEANUP, FLAGS, HEADER_OFFSET, NEXT, PARENT, QUERIES, RENDERER, TVIEW, T_HOST, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { renderStringify } from './util/misc_utils';
import { findComponentView, getLViewParent } from './util/view_traversal_utils';
import { getNativeByTNode, isComponent, isLContainer, isLView, isRootView, unwrapRNode } from './util/view_utils';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * @param {?} tNode
 * @param {?} embeddedView
 * @return {?}
 */
export function getLContainer(tNode, embeddedView) {
    ngDevMode && assertLView(embeddedView);
    /** @type {?} */
    const container = (/** @type {?} */ (embeddedView[PARENT]));
    if (tNode.index === -1) {
        // This is a dynamically created view inside a dynamic container.
        // The parent isn't an LContainer if the embedded view hasn't been attached yet.
        return isLContainer(container) ? container : null;
    }
    else {
        ngDevMode && assertLContainer(container);
        // This is a inline view node (e.g. embeddedViewStart)
        return container;
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
            const componentHost = (/** @type {?} */ (componentView[T_HOST]));
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
                    currentView = (/** @type {?} */ ((/** @type {?} */ (componentView[PARENT]))));
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
                tNode = tNode.parent || currentView[T_HOST];
                if (tNode === null || tNode === rootTNode)
                    return null;
                // When exiting a container, the beforeNode must be restored to the previous value
                if (tNode.type === 0 /* Container */) {
                    currentView = (/** @type {?} */ (getLViewParent(currentView)));
                    beforeNode = currentView[tNode.index][NATIVE];
                }
                if (tNode.type === 2 /* View */) {
                    /**
                     * If current lView doesn't have next pointer, we try to find it by going up parents
                     * chain until:
                     * - we find an lView with a next pointer
                     * - or find a tNode with a parent that has a next pointer
                     * - or reach root TNode (in which case we exit, since we traversed all nodes)
                     */
                    while (!currentView[NEXT] && currentView[PARENT] &&
                        !(tNode.parent && tNode.parent.next)) {
                        if (tNode === rootTNode)
                            return null;
                        currentView = (/** @type {?} */ (currentView[PARENT]));
                        tNode = (/** @type {?} */ (currentView[T_HOST]));
                    }
                    if (currentView[NEXT]) {
                        currentView = (/** @type {?} */ (currentView[NEXT]));
                        nextTNode = currentView[T_HOST];
                    }
                    else {
                        nextTNode = tNode.next;
                    }
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
        nativeRemoveNode(renderer, node, isComponent(tNode));
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
    /** @type {?} */
    let lViewOrLContainer = rootView[CHILD_HEAD];
    if (!lViewOrLContainer) {
        return cleanUpView(rootView);
    }
    while (lViewOrLContainer) {
        /** @type {?} */
        let next = null;
        if (isLView(lViewOrLContainer)) {
            // If LView, traverse down to child.
            next = lViewOrLContainer[CHILD_HEAD];
        }
        else {
            ngDevMode && assertLContainer(lViewOrLContainer);
            // If container, traverse down to its first LView.
            /** @type {?} */
            const views = (/** @type {?} */ (lViewOrLContainer[VIEWS]));
            if (views.length > 0)
                next = views[0];
        }
        if (!next) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (lViewOrLContainer && !(/** @type {?} */ (lViewOrLContainer))[NEXT] && lViewOrLContainer !== rootView) {
                cleanUpView(lViewOrLContainer);
                lViewOrLContainer = getParentState(lViewOrLContainer, rootView);
            }
            cleanUpView(lViewOrLContainer || rootView);
            next = lViewOrLContainer && (/** @type {?} */ (lViewOrLContainer))[NEXT];
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
 * @param {?} lView The view to insert
 * @param {?} lContainer The container into which the view should be inserted
 * @param {?} index Which index in the container to insert the child view into
 * @return {?}
 */
export function insertView(lView, lContainer, index) {
    ngDevMode && assertLView(lView);
    ngDevMode && assertLContainer(lContainer);
    /** @type {?} */
    const views = lContainer[VIEWS];
    ngDevMode && assertDefined(views, 'Container must have views');
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
    lView[PARENT] = lContainer;
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
 * @return {?} Detached LView instance.
 */
export function detachView(lContainer, removeIndex) {
    /** @type {?} */
    const views = lContainer[VIEWS];
    /** @type {?} */
    const viewToDetach = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1][NEXT] = (/** @type {?} */ (viewToDetach[NEXT]));
    }
    views.splice(removeIndex, 1);
    addRemoveViewFromContainer(viewToDetach, false);
    if (viewToDetach[QUERIES]) {
        (/** @type {?} */ (viewToDetach[QUERIES])).removeView();
    }
    viewToDetach[PARENT] = null;
    viewToDetach[NEXT] = null;
    // Unsets the attached flag
    viewToDetach[FLAGS] &= ~128 /* Attached */;
    return viewToDetach;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param {?} lContainer The container from which to remove a view
 * @param {?} removeIndex The index of the view to remove
 * @return {?}
 */
export function removeView(lContainer, removeIndex) {
    /** @type {?} */
    const view = lContainer[VIEWS][removeIndex];
    detachView(lContainer, removeIndex);
    destroyLView(view);
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
 * @param {?} lViewOrLContainer The LViewOrLContainer for which we need a parent state
 * @param {?} rootView The rootView, so we don't propagate too far up the view tree
 * @return {?} The correct parent LViewOrLContainer
 */
export function getParentState(lViewOrLContainer, rootView) {
    /** @type {?} */
    let tNode;
    if (isLView(lViewOrLContainer) && (tNode = lViewOrLContainer[T_HOST]) &&
        tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getLContainer((/** @type {?} */ (tNode)), lViewOrLContainer);
    }
    else {
        // otherwise, use parent view for containers or component views
        return lViewOrLContainer[PARENT] === rootView ? null : lViewOrLContainer[PARENT];
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
        const hostTNode = view[T_HOST];
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
                    unwrapRNode(lView[idxOrTargetGetter]);
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
        for (let i = 0; i < destroyHooks.length; i += 2) {
            /** @type {?} */
            const context = view[(/** @type {?} */ (destroyHooks[i]))];
            // Only call the destroy hook if the context has been requested.
            if (!(context instanceof NodeInjectorFactory)) {
                ((/** @type {?} */ (destroyHooks[i + 1]))).call(context);
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
        const hostTNode = (/** @type {?} */ (currentView[T_HOST]));
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
    ngDevMode && assertLView(currentView);
    /** @type {?} */
    const hostTNode = currentView[T_HOST];
    return hostTNode && hostTNode.type === 3 /* Element */ ?
        ((/** @type {?} */ (getNativeByTNode(hostTNode, (/** @type {?} */ (getLViewParent(currentView))))))) :
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
 * Removes a node from the DOM given its native parent.
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?=} isHostElement
 * @return {?}
 */
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
        const parentTNode = childTNode.parent || (/** @type {?} */ (currentView[T_HOST]));
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
        const viewTNode = (/** @type {?} */ (view[T_HOST]));
        return viewTNode.child ? getNativeByTNode(viewTNode.child, view) : containerNative;
    }
    else {
        return containerNative;
    }
}
/**
 * Removes a native node itself using a given renderer. To remove the node we are looking up its
 * parent from the native tree as not all platforms / browsers support the equivalent of
 * node.remove().
 *
 * @param {?} renderer A renderer to be used
 * @param {?} rNode The native node that should be removed
 * @param {?=} isHostElement A flag indicating if a node to be removed is a host of a component.
 * @return {?}
 */
export function nativeRemoveNode(renderer, rNode, isHostElement) {
    /** @type {?} */
    const nativeParent = nativeParentNode(renderer, rNode);
    if (nativeParent) {
        nativeRemoveChild(renderer, nativeParent, rNode, isHostElement);
    }
}
/**
 * Appends nodes to a target projection place. Nodes to insert were previously re-distribution and
 * stored on a component host level.
 * @param {?} lView A LView where nodes are inserted (target VLview)
 * @param {?} tProjectionNode A projection node where previously re-distribution should be appended
 * (target insertion place)
 * @param {?} selectorIndex A bucket from where nodes to project should be taken
 * @param {?} componentView A where projectable nodes were initially created (source view)
 * @return {?}
 */
export function appendProjectedNodes(lView, tProjectionNode, selectorIndex, componentView) {
    /** @type {?} */
    const projectedView = (/** @type {?} */ ((/** @type {?} */ (componentView[PARENT]))));
    /** @type {?} */
    const componentNode = (/** @type {?} */ (componentView[T_HOST]));
    /** @type {?} */
    let nodeToProject = ((/** @type {?} */ (componentNode.projection)))[selectorIndex];
    if (Array.isArray(nodeToProject)) {
        appendChild(nodeToProject, tProjectionNode, lView);
    }
    else {
        while (nodeToProject) {
            if (nodeToProject.type === 1 /* Projection */) {
                appendProjectedNodes(lView, tProjectionNode, ((/** @type {?} */ (nodeToProject))).projection, findComponentView(projectedView));
            }
            else {
                // This flag must be set now or we won't know that this node is projected
                // if the nodes are inserted into a container later.
                nodeToProject.flags |= 2 /* isProjected */;
                appendProjectedNode(nodeToProject, tProjectionNode, lView, projectedView);
            }
            nodeToProject = nodeToProject.next;
        }
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
function appendProjectedNode(projectedTNode, tProjectionNode, currentView, projectionView) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBYSxNQUFNLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTNHLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBeUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkosT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBbUUsb0JBQW9CLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkssT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBK0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbk0sT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFD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QUFDLENBQUM7SUFFbEQsMkZBQTJGO0lBQzNGLG9GQUFvRjtJQUNwRixtREFBbUQ7SUFDbkQsZUFBZSxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQzs7VUFFbEMsZUFBZSxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO0lBQzVELElBQUksY0FBYyxDQUFDLElBQUksc0JBQXdCLEVBQUU7Ozs7Ozs7Y0FNekMsS0FBSyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztTQUNyRTtLQUNGO1NBQU07UUFDTCxJQUFJLGNBQWMsQ0FBQyxJQUFJLDZCQUErQixFQUFFOztnQkFDbEQscUJBQXFCLEdBQWUsbUJBQUEsY0FBYyxDQUFDLEtBQUssRUFBUztZQUNyRSxPQUFPLHFCQUFxQixFQUFFO2dCQUM1QixtQkFBbUIsQ0FBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUN6RixxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7YUFDcEQ7U0FDRjtRQUVELElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ2pDLFdBQVcsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3BFO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge0xDb250YWluZXIsIE5BVElWRSwgVklFV1MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDTEVBTlVQLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSG9va0RhdGEsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgVF9IT1NULCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3LCBnZXRMVmlld1BhcmVudH0gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgaXNDb21wb25lbnQsIGlzTENvbnRhaW5lciwgaXNMVmlldywgaXNSb290VmlldywgdW53cmFwUk5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0ICsgdW51c2VkNTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldExDb250YWluZXIodE5vZGU6IFRWaWV3Tm9kZSwgZW1iZWRkZWRWaWV3OiBMVmlldyk6IExDb250YWluZXJ8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhlbWJlZGRlZFZpZXcpO1xuICBjb25zdCBjb250YWluZXIgPSBlbWJlZGRlZFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBUaGUgcGFyZW50IGlzbid0IGFuIExDb250YWluZXIgaWYgdGhlIGVtYmVkZGVkIHZpZXcgaGFzbid0IGJlZW4gYXR0YWNoZWQgeWV0LlxuICAgIHJldHVybiBpc0xDb250YWluZXIoY29udGFpbmVyKSA/IGNvbnRhaW5lciA6IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoY29udGFpbmVyKTtcbiAgICAvLyBUaGlzIGlzIGEgaW5saW5lIHZpZXcgbm9kZSAoZS5nLiBlbWJlZGRlZFZpZXdTdGFydClcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBmb3IgYSBnaXZlbiB2aWV3LlxuICogTWlnaHQgYmUgbnVsbCBpZiBhIHZpZXcgaXMgbm90IHlldCBhdHRhY2hlZCB0byBhbnkgY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQodFZpZXdOb2RlOiBUVmlld05vZGUsIHZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGdldExDb250YWluZXIodFZpZXdOb2RlLCB2aWV3KTtcbiAgcmV0dXJuIGNvbnRhaW5lciA/IG5hdGl2ZVBhcmVudE5vZGUodmlld1tSRU5ERVJFUl0sIGNvbnRhaW5lcltOQVRJVkVdKSA6IG51bGw7XG59XG5cbmNvbnN0IGVudW0gV2Fsa1ROb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDAsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAxLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMixcbn1cblxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHdhbGtUTm9kZVRyZWUuXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHdhbGtUTm9kZVRyZWUgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlldyB8IFROb2RlKVtdID0gW107XG5cbi8qKlxuICogV2Fsa3MgYSB0cmVlIG9mIFROb2RlcywgYXBwbHlpbmcgYSB0cmFuc2Zvcm1hdGlvbiBvbiB0aGUgZWxlbWVudCBub2RlcywgZWl0aGVyIG9ubHkgb24gdGhlIGZpcnN0XG4gKiBvbmUgZm91bmQsIG9yIG9uIGFsbCBvZiB0aGVtLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIHRoZSB2aWV3IHRvIHdhbGtcbiAqIEBwYXJhbSBhY3Rpb24gaWRlbnRpZmllcyB0aGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgZWxlbWVudHNcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgT3B0aW9uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJzIGZvdW5kLFxuICogcmVxdWlyZWQgZm9yIGFjdGlvbiBtb2RlcyBJbnNlcnQgYW5kIERlc3Ryb3kuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBPcHRpb25hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBJbnNlcnQuXG4gKi9cbmZ1bmN0aW9uIHdhbGtUTm9kZVRyZWUoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBjb25zdCByb290VE5vZGUgPSB2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZTtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgbGV0IGN1cnJlbnRWaWV3ID0gdmlld1RvV2FsaztcbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gcm9vdFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBsZXQgbmV4dFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgIGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF07XG4gICAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgICAgLy8gVGhpcyBlbGVtZW50IGhhcyBhbiBMQ29udGFpbmVyLCBhbmQgaXRzIGNvbW1lbnQgbmVlZHMgdG8gYmUgaGFuZGxlZFxuICAgICAgICBleGVjdXRlTm9kZUFjdGlvbihcbiAgICAgICAgICAgIGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbm9kZU9yQ29udGFpbmVyW05BVElWRV0sIHROb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBjdXJyZW50VmlldyAhW3ROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBsQ29udGFpbmVyW05BVElWRV0sIHROb2RlLCBiZWZvcmVOb2RlKTtcblxuICAgICAgaWYgKGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgICAgICBjdXJyZW50VmlldyA9IGxDb250YWluZXJbVklFV1NdWzBdO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZW50ZXJzIGEgY29udGFpbmVyLCB0aGVuIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZWNvbWUgdGhlIGxvY2FsIG5hdGl2ZVxuICAgICAgICAvLyBjb21tZW50IG5vZGUuXG4gICAgICAgIGJlZm9yZU5vZGUgPSBsQ29udGFpbmVyW05BVElWRV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGN1cnJlbnRWaWV3ICEpO1xuICAgICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgICBjb25zdCBoZWFkOiBUTm9kZXxudWxsID1cbiAgICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShoZWFkKSkge1xuICAgICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGhlYWQpIHtcbiAgICAgICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIG5hdGl2ZU5vZGUsIHROb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTXVzdCBzdG9yZSBib3RoIHRoZSBUTm9kZSBhbmQgdGhlIHZpZXcgYmVjYXVzZSB0aGlzIHByb2plY3Rpb24gbm9kZSBjb3VsZCBiZSBuZXN0ZWRcbiAgICAgICAgLy8gZGVlcGx5IGluc2lkZSBlbWJlZGRlZCB2aWV3cywgYW5kIHdlIG5lZWQgdG8gZ2V0IGJhY2sgZG93biB0byB0aGlzIHBhcnRpY3VsYXIgbmVzdGVkXG4gICAgICAgIC8vIHZpZXcuXG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHROb2RlO1xuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBjdXJyZW50VmlldyAhO1xuICAgICAgICBpZiAoaGVhZCkge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICFhcyBMVmlldztcbiAgICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBhIFZpZXcgb3IgYW4gRWxlbWVudENvbnRhaW5lclxuICAgICAgbmV4dFROb2RlID0gdE5vZGUuY2hpbGQ7XG4gICAgfVxuXG4gICAgaWYgKG5leHRUTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gdGhpcyBsYXN0IG5vZGUgd2FzIHByb2plY3RlZCwgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIGl0cyBwcm9qZWN0aW9uIG5vZGVcbiAgICAgIGlmICh0Tm9kZS5uZXh0ID09PSBudWxsICYmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIExWaWV3O1xuICAgICAgICB0Tm9kZSA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG5cbiAgICAgIC8qKlxuICAgICAgICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBUTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAgICAgICAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICAgICAgICpcbiAgICAgICAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhlbiBpdCBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gICAgICAgKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAgICAgICAqL1xuICAgICAgd2hpbGUgKCFuZXh0VE5vZGUpIHtcbiAgICAgICAgLy8gSWYgcGFyZW50IGlzIG51bGwsIHdlJ3JlIGNyb3NzaW5nIHRoZSB2aWV3IGJvdW5kYXJ5LCBzbyB3ZSBzaG91bGQgZ2V0IHRoZSBob3N0IFROb2RlLlxuICAgICAgICB0Tm9kZSA9IHROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUX0hPU1RdO1xuXG4gICAgICAgIGlmICh0Tm9kZSA9PT0gbnVsbCB8fCB0Tm9kZSA9PT0gcm9vdFROb2RlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAvLyBXaGVuIGV4aXRpbmcgYSBjb250YWluZXIsIHRoZSBiZWZvcmVOb2RlIG11c3QgYmUgcmVzdG9yZWQgdG8gdGhlIHByZXZpb3VzIHZhbHVlXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBnZXRMVmlld1BhcmVudChjdXJyZW50VmlldykgITtcbiAgICAgICAgICBiZWZvcmVOb2RlID0gY3VycmVudFZpZXdbdE5vZGUuaW5kZXhdW05BVElWRV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBJZiBjdXJyZW50IGxWaWV3IGRvZXNuJ3QgaGF2ZSBuZXh0IHBvaW50ZXIsIHdlIHRyeSB0byBmaW5kIGl0IGJ5IGdvaW5nIHVwIHBhcmVudHNcbiAgICAgICAgICAgKiBjaGFpbiB1bnRpbDpcbiAgICAgICAgICAgKiAtIHdlIGZpbmQgYW4gbFZpZXcgd2l0aCBhIG5leHQgcG9pbnRlclxuICAgICAgICAgICAqIC0gb3IgZmluZCBhIHROb2RlIHdpdGggYSBwYXJlbnQgdGhhdCBoYXMgYSBuZXh0IHBvaW50ZXJcbiAgICAgICAgICAgKiAtIG9yIHJlYWNoIHJvb3QgVE5vZGUgKGluIHdoaWNoIGNhc2Ugd2UgZXhpdCwgc2luY2Ugd2UgdHJhdmVyc2VkIGFsbCBub2RlcylcbiAgICAgICAgICAgKi9cbiAgICAgICAgICB3aGlsZSAoIWN1cnJlbnRWaWV3W05FWFRdICYmIGN1cnJlbnRWaWV3W1BBUkVOVF0gJiZcbiAgICAgICAgICAgICAgICAgISh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50Lm5leHQpKSB7XG4gICAgICAgICAgICBpZiAodE5vZGUgPT09IHJvb3RUTm9kZSkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W1BBUkVOVF0gYXMgTFZpZXc7XG4gICAgICAgICAgICB0Tm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF0gITtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1cnJlbnRWaWV3W05FWFRdKSB7XG4gICAgICAgICAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W05FWFRdIGFzIExWaWV3O1xuICAgICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IG5leHRUTm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCwgbm9kZTogUk5vZGUsXG4gICAgdE5vZGU6IFROb2RlLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0KSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlciwgbm9kZSwgaXNDb21wb25lbnQodE5vZGUpKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95Tm9kZSAhKG5vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh2YWx1ZTogYW55LCByZW5kZXJlcjogUmVuZGVyZXIzKTogUlRleHQge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuY3JlYXRlVGV4dChyZW5kZXJTdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZShyZW5kZXJTdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBBZGRzIG9yIHJlbW92ZXMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byByZW1vdmUgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gdmlld1RvV2FsayBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICB2aWV3VG9XYWxrOiBMVmlldywgaW5zZXJ0TW9kZTogdHJ1ZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9XYWxrOiBMVmlldywgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiBib29sZWFuLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldENvbnRhaW5lclJlbmRlclBhcmVudCh2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZSwgdmlld1RvV2Fsayk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGlmIChyZW5kZXJQYXJlbnQpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHZpZXdUb1dhbGtbUkVOREVSRVJdO1xuICAgIHdhbGtUTm9kZVRyZWUoXG4gICAgICAgIHZpZXdUb1dhbGssIGluc2VydE1vZGUgPyBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCA6IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoLCByZW5kZXJlcixcbiAgICAgICAgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBsZXQgbFZpZXdPckxDb250YWluZXIgPSByb290Vmlld1tDSElMRF9IRUFEXTtcbiAgaWYgKCFsVmlld09yTENvbnRhaW5lcikge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cblxuICB3aGlsZSAobFZpZXdPckxDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSkge1xuICAgICAgLy8gSWYgTFZpZXcsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXJbQ0hJTERfSEVBRF07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgIC8vIElmIGNvbnRhaW5lciwgdHJhdmVyc2UgZG93biB0byBpdHMgZmlyc3QgTFZpZXcuXG4gICAgICBjb25zdCB2aWV3cyA9IGxWaWV3T3JMQ29udGFpbmVyW1ZJRVdTXSBhcyBMVmlld1tdO1xuICAgICAgaWYgKHZpZXdzLmxlbmd0aCA+IDApIG5leHQgPSB2aWV3c1swXTtcbiAgICB9XG5cbiAgICBpZiAoIW5leHQpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAobFZpZXdPckxDb250YWluZXIgJiYgIWxWaWV3T3JMQ29udGFpbmVyICFbTkVYVF0gJiYgbFZpZXdPckxDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgICAgbFZpZXdPckxDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZShsVmlld09yTENvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXIgfHwgcm9vdFZpZXcpO1xuICAgICAgbmV4dCA9IGxWaWV3T3JMQ29udGFpbmVyICYmIGxWaWV3T3JMQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIGxWaWV3T3JMQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gaW5kZXggV2hpY2ggaW5kZXggaW4gdGhlIGNvbnRhaW5lciB0byBpbnNlcnQgdGhlIGNoaWxkIHZpZXcgaW50b1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhsVmlldzogTFZpZXcsIGxDb250YWluZXI6IExDb250YWluZXIsIGluZGV4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdzLCAnQ29udGFpbmVyIG11c3QgaGF2ZSB2aWV3cycpO1xuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXVtORVhUXSA9IGxWaWV3O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgbFZpZXdbTkVYVF0gPSB2aWV3c1tpbmRleF07XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaChsVmlldyk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgbFZpZXdbUEFSRU5UXSA9IGxDb250YWluZXI7XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEByZXR1cm5zIERldGFjaGVkIExWaWV3IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICB2aWV3c1tyZW1vdmVJbmRleCAtIDFdW05FWFRdID0gdmlld1RvRGV0YWNoW05FWFRdIGFzIExWaWV3O1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaCwgZmFsc2UpO1xuXG4gIGlmICh2aWV3VG9EZXRhY2hbUVVFUklFU10pIHtcbiAgICB2aWV3VG9EZXRhY2hbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gIH1cbiAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICB2aWV3VG9EZXRhY2hbTkVYVF0gPSBudWxsO1xuICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgcmV0dXJuIHZpZXdUb0RldGFjaDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCByZW1vdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZpZXcgPSBsQ29udGFpbmVyW1ZJRVdTXVtyZW1vdmVJbmRleF07XG4gIGRldGFjaFZpZXcobENvbnRhaW5lciwgcmVtb3ZlSW5kZXgpO1xuICBkZXN0cm95TFZpZXcodmlldyk7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbnVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcodmlldzogTFZpZXcpIHtcbiAgaWYgKCEodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICAgIHdhbGtUTm9kZVRyZWUodmlldywgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCByZW5kZXJlciwgbnVsbCk7XG4gICAgfVxuXG4gICAgZGVzdHJveVZpZXdUcmVlKHZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKGxWaWV3T3JMQ29udGFpbmVyOiBMVmlldyB8IExDb250YWluZXIsIHJvb3RWaWV3OiBMVmlldyk6IExWaWV3fFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCB0Tm9kZTtcbiAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpICYmICh0Tm9kZSA9IGxWaWV3T3JMQ29udGFpbmVyW1RfSE9TVF0pICYmXG4gICAgICB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gZ2V0TENvbnRhaW5lcih0Tm9kZSBhcyBUVmlld05vZGUsIGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gbFZpZXdPckxDb250YWluZXJbUEFSRU5UXSA9PT0gcm9vdFZpZXcgPyBudWxsIDogbFZpZXdPckxDb250YWluZXJbUEFSRU5UXTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIG9uRGVzdHJveXMgaG9va3MgZm9yIGFsbCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBpbiBhIGdpdmVuIHZpZXcgYW5kIHRoZW4gcmVtb3ZlcyBhbGxcbiAqIGxpc3RlbmVycy4gTGlzdGVuZXJzIGFyZSByZW1vdmVkIGFzIHRoZSBsYXN0IHN0ZXAgc28gZXZlbnRzIGRlbGl2ZXJlZCBpbiB0aGUgb25EZXN0cm95cyBob29rc1xuICogY2FuIGJlIHByb3BhZ2F0ZWQgdG8gQE91dHB1dCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcjogTFZpZXcgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3KS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXc7XG5cbiAgICAvLyBNYXJrIHRoZSBMVmlldyBhcyBkZXN0cm95ZWQgKmJlZm9yZSogZXhlY3V0aW5nIHRoZSBvbkRlc3Ryb3kgaG9va3MuIEFuIG9uRGVzdHJveSBob29rXG4gICAgLy8gcnVucyBhcmJpdHJhcnkgdXNlciBjb2RlLCB3aGljaCBjb3VsZCBpbmNsdWRlIGl0cyBvd24gYHZpZXdSZWYuZGVzdHJveSgpYCAob3Igc2ltaWxhcikuIElmXG4gICAgLy8gV2UgZG9uJ3QgZmxhZyB0aGUgdmlldyBhcyBkZXN0cm95ZWQgYmVmb3JlIHRoZSBob29rcywgdGhpcyBjb3VsZCBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgLy8gVGhpcyBhbHNvIGFsaWducyB3aXRoIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yLiBJdCBhbHNvIG1lYW5zIHRoYXQgdGhlIG9uRGVzdHJveSBob29rIGlzXG4gICAgLy8gcmVhbGx5IG1vcmUgb2YgYW4gXCJhZnRlckRlc3Ryb3lcIiBob29rIGlmIHlvdSB0aGluayBhYm91dCBpdC5cbiAgICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcblxuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSB2aWV3W1RfSE9TVF07XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0Q2xlYW51cCA9IGxWaWV3W1RWSUVXXS5jbGVhbnVwICE7XG4gIGlmICh0Q2xlYW51cCAhPSBudWxsKSB7XG4gICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IGlkeE9yVGFyZ2V0R2V0dGVyID0gdENsZWFudXBbaSArIDFdO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgaWR4T3JUYXJnZXRHZXR0ZXIobFZpZXcpIDpcbiAgICAgICAgICAgIHVud3JhcFJOb2RlKGxWaWV3W2lkeE9yVGFyZ2V0R2V0dGVyXSk7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gbENsZWFudXBbdENsZWFudXBbaSArIDJdXTtcbiAgICAgICAgY29uc3QgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gdENsZWFudXBbaSArIDNdO1xuICAgICAgICBpZiAodHlwZW9mIHVzZUNhcHR1cmVPclN1YklkeCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgLy8gRE9NIGxpc3RlbmVyXG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodENsZWFudXBbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlT3JTdWJJZHgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh1c2VDYXB0dXJlT3JTdWJJZHggPj0gMCkge1xuICAgICAgICAgICAgLy8gdW5yZWdpc3RlclxuICAgICAgICAgICAgbENsZWFudXBbdXNlQ2FwdHVyZU9yU3ViSWR4XSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdWJzY3JpcHRpb25cbiAgICAgICAgICAgIGxDbGVhbnVwWy11c2VDYXB0dXJlT3JTdWJJZHhdLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSBsQ2xlYW51cFt0Q2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMV1dO1xuICAgICAgICB0Q2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3Ryb3lIb29rcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdbZGVzdHJveUhvb2tzW2ldIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgZGVzdHJveSBob29rIGlmIHRoZSBjb250ZXh0IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3JGYWN0b3J5KSkge1xuICAgICAgICAoZGVzdHJveUhvb2tzW2kgKyAxXSBhcygpID0+IHZvaWQpLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBlbGVtZW50IGlmIGEgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hZGUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgLy8gTm9kZXMgb2YgdGhlIHRvcC1tb3N0IHZpZXcgY2FuIGJlIGluc2VydGVkIGVhZ2VybHkuXG4gIGlmIChpc1Jvb3RWaWV3KGN1cnJlbnRWaWV3KSkge1xuICAgIHJldHVybiBuYXRpdmVQYXJlbnROb2RlKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpKTtcbiAgfVxuXG4gIC8vIFNraXAgb3ZlciBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVycyBhcyB0aG9zZSBhcmUgcmVwcmVzZW50ZWQgYnkgYSBjb21tZW50IG5vZGUgYW5kXG4gIC8vIGNhbid0IGJlIHVzZWQgYXMgYSByZW5kZXIgcGFyZW50LlxuICBjb25zdCBwYXJlbnQgPSBnZXRIaWdoZXN0RWxlbWVudE9ySUNVQ29udGFpbmVyKHROb2RlKS5wYXJlbnQ7XG5cbiAgLy8gSWYgdGhlIHBhcmVudCBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzOiBlaXRoZXIgaW50byBhbiBlbWJlZGRlZCB2aWV3IG9yIGFcbiAgLy8gY29tcG9uZW50IHZpZXcuXG4gIGlmIChwYXJlbnQgPT0gbnVsbCkge1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF0gITtcbiAgICBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGEgcm9vdCBlbGVtZW50IG9mIGFuIGVtYmVkZGVkIHZpZXcgV2UgbWlnaHQgZGVsYXkgaW5zZXJ0aW9uIG9mIGNoaWxkcmVuXG4gICAgICAvLyBmb3IgYSBnaXZlbiB2aWV3IGlmIGl0IGlzIGRpc2Nvbm5lY3RlZC4gVGhpcyBtaWdodCBoYXBwZW4gZm9yIDIgbWFpbiByZWFzb25zOlxuICAgICAgLy8gLSB2aWV3IGlzIG5vdCBpbnNlcnRlZCBpbnRvIGFueSBjb250YWluZXIodmlldyB3YXMgY3JlYXRlZCBidXQgbm90IGluc2VydGVkIHlldClcbiAgICAgIC8vIC0gdmlldyBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGJ1dCB0aGUgY29udGFpbmVyIGl0c2VsZiBpcyBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NXG4gICAgICAvLyAoY29udGFpbmVyIG1pZ2h0IGJlIHBhcnQgb2YgcHJvamVjdGlvbiBvciBjaGlsZCBvZiBhIHZpZXcgdGhhdCBpcyBub3QgaW5zZXJ0ZWQgeWV0KS5cbiAgICAgIC8vIEluIG90aGVyIHdvcmRzIHdlIGNhbiBpbnNlcnQgY2hpbGRyZW4gb2YgYSBnaXZlbiB2aWV3IGlmIHRoaXMgdmlldyB3YXMgaW5zZXJ0ZWQgaW50byBhXG4gICAgICAvLyBjb250YWluZXIgYW5kIHRoZSBjb250YWluZXIgaXRzZWxmIGhhcyBpdHMgcmVuZGVyIHBhcmVudCBkZXRlcm1pbmVkLlxuICAgICAgcmV0dXJuIGdldENvbnRhaW5lclJlbmRlclBhcmVudChob3N0VE5vZGUgYXMgVFZpZXdOb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYW5kXG4gICAgICAvLyBpdCBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICAgICAgcmV0dXJuIGdldEhvc3ROYXRpdmUoY3VycmVudFZpZXcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgaWYgKHBhcmVudC5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IHREYXRhID0gY3VycmVudFZpZXdbVFZJRVddLmRhdGE7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW3BhcmVudC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICBjb25zdCBlbmNhcHN1bGF0aW9uID0gKHREYXRhW3ROb2RlLmRpcmVjdGl2ZVN0YXJ0XSBhcyBDb21wb25lbnREZWY8YW55PikuZW5jYXBzdWxhdGlvbjtcblxuICAgICAgLy8gV2UndmUgZ290IGEgcGFyZW50IHdoaWNoIGlzIGFuIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgdmlldy4gV2UganVzdCBuZWVkIHRvIHZlcmlmeSBpZiB0aGVcbiAgICAgIC8vIHBhcmVudCBlbGVtZW50IGlzIG5vdCBhIGNvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gICAgICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgICAgIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoZW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uIE5vdGUgdGhhdCB3ZSBjYW4ndFxuICAgICAgLy8gbWFrZSB0aGlzIGFzc3VtcHRpb24gd2hlbiB1c2luZyB0aGUgU2hhZG93IERPTSwgYmVjYXVzZSB0aGUgbmF0aXZlIHByb2plY3Rpb24gcGxhY2Vob2xkZXJzXG4gICAgICAvLyAoPGNvbnRlbnQ+IG9yIDxzbG90PikgaGF2ZSB0byBiZSBpbiBwbGFjZSBhcyBlbGVtZW50cyBhcmUgYmVpbmcgaW5zZXJ0ZWQuXG4gICAgICBpZiAoZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tICYmXG4gICAgICAgICAgZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uTmF0aXZlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudCwgY3VycmVudFZpZXcpIGFzIFJFbGVtZW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBmb3IgYSBnaXZlbiB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBjdXJyZW50IHZpZXcgZG9lcyBub3QgaGF2ZVxuICogYSBob3N0IGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGdldEhvc3ROYXRpdmUoY3VycmVudFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF07XG4gIHJldHVybiBob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID9cbiAgICAgIChnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgZ2V0TFZpZXdQYXJlbnQoY3VycmVudFZpZXcpICEpIGFzIFJFbGVtZW50KSA6XG4gICAgICBudWxsO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQgdXNpbmcge0BsaW5rIFJlbmRlcmVyM30uXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZCAtIGl0IGFic3RyYWN0cyBhblxuICogYWN0dWFsIHJlbmRlcmVyIGJlaW5nIHVzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudCwgY2hpbGQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGJlZm9yZU5vZGUpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICB9IGVsc2Uge1xuICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkKTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBhIG5vZGUgZnJvbSB0aGUgRE9NIGdpdmVuIGl0cyBuYXRpdmUgcGFyZW50LiAqL1xuZnVuY3Rpb24gbmF0aXZlUmVtb3ZlQ2hpbGQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50LCBjaGlsZCwgaXNIb3N0RWxlbWVudCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgcGFyZW50IG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUkVsZW1lbnR8bnVsbCB7XG4gIHJldHVybiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucGFyZW50Tm9kZShub2RlKSA6IG5vZGUucGFyZW50Tm9kZSkgYXMgUkVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBzaWJsaW5nIG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJOb2RlfG51bGwge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIubmV4dFNpYmxpbmcobm9kZSkgOiBub2RlLm5leHRTaWJsaW5nO1xufVxuXG4vKipcbiAqIEZpbmRzIGEgbmF0aXZlIFwiYW5jaG9yXCIgbm9kZSBmb3IgY2FzZXMgd2hlcmUgd2UgY2FuJ3QgYXBwZW5kIGEgbmF0aXZlIGNoaWxkIGRpcmVjdGx5XG4gKiAoYGFwcGVuZENoaWxkYCkgYW5kIG5lZWQgdG8gdXNlIGEgcmVmZXJlbmNlIChhbmNob3IpIG5vZGUgZm9yIHRoZSBgaW5zZXJ0QmVmb3JlYCBvcGVyYXRpb24uXG4gKiBAcGFyYW0gcGFyZW50VE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5mdW5jdGlvbiBnZXROYXRpdmVBbmNob3JOb2RlKHBhcmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGV8bnVsbCB7XG4gIGlmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHBhcmVudFROb2RlIGFzIFRWaWV3Tm9kZSwgbFZpZXcpICE7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YobFZpZXcpO1xuICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleCwgdmlld3MsIGxDb250YWluZXJbTkFUSVZFXSk7XG4gIH0gZWxzZSBpZiAoXG4gICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBsVmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBuYXRpdmUgbm9kZSAob3IgYSBjb2xsZWN0aW9uIG9mIG5vZGVzKSB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9LlxuICpcbiAqIEBwYXJhbSBjaGlsZEVsIFRoZSBuYXRpdmUgY2hpbGQgKG9yIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKGNoaWxkRWw6IFJOb2RlIHwgUk5vZGVbXSwgY2hpbGRUTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRSZW5kZXJQYXJlbnQoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpO1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBwYXJlbnRUTm9kZTogVE5vZGUgPSBjaGlsZFROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUX0hPU1RdICE7XG4gICAgY29uc3QgYW5jaG9yTm9kZSA9IGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZEVsKSkge1xuICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBjaGlsZEVsKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIG5hdGl2ZU5vZGUsIGFuY2hvck5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50LCBjaGlsZEVsLCBhbmNob3JOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSB0b3AtbGV2ZWwgZWxlbWVudCBvciBhbiBJQ1UgY29udGFpbmVyIGlmIHRob3NlIGNvbnRhaW5lcnMgYXJlIG5lc3RlZC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXJ0aW5nIFROb2RlIGZvciB3aGljaCB3ZSBzaG91bGQgc2tpcCBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVyc1xuICogQHJldHVybnMgVGhlIFROb2RlIG9mIHRoZSBoaWdoZXN0IGxldmVsIElDVSBjb250YWluZXIgb3IgZWxlbWVudCBjb250YWluZXJcbiAqL1xuZnVuY3Rpb24gZ2V0SGlnaGVzdEVsZW1lbnRPcklDVUNvbnRhaW5lcih0Tm9kZTogVE5vZGUpOiBUTm9kZSB7XG4gIHdoaWxlICh0Tm9kZS5wYXJlbnQgIT0gbnVsbCAmJiAodE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpKSB7XG4gICAgdE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXg6IG51bWJlciwgdmlld3M6IExWaWV3W10sIGNvbnRhaW5lck5hdGl2ZTogUkNvbW1lbnQpIHtcbiAgaWYgKGluZGV4ICsgMSA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3c1tpbmRleCArIDFdIGFzIExWaWV3O1xuICAgIGNvbnN0IHZpZXdUTm9kZSA9IHZpZXdbVF9IT1NUXSBhcyBUVmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdUTm9kZS5jaGlsZCA/IGdldE5hdGl2ZUJ5VE5vZGUodmlld1ROb2RlLmNoaWxkLCB2aWV3KSA6IGNvbnRhaW5lck5hdGl2ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29udGFpbmVyTmF0aXZlO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIG5hdGl2ZSBub2RlIGl0c2VsZiB1c2luZyBhIGdpdmVuIHJlbmRlcmVyLiBUbyByZW1vdmUgdGhlIG5vZGUgd2UgYXJlIGxvb2tpbmcgdXAgaXRzXG4gKiBwYXJlbnQgZnJvbSB0aGUgbmF0aXZlIHRyZWUgYXMgbm90IGFsbCBwbGF0Zm9ybXMgLyBicm93c2VycyBzdXBwb3J0IHRoZSBlcXVpdmFsZW50IG9mXG4gKiBub2RlLnJlbW92ZSgpLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIGJlIHVzZWRcbiAqIEBwYXJhbSByTm9kZSBUaGUgbmF0aXZlIG5vZGUgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGlzSG9zdEVsZW1lbnQgQSBmbGFnIGluZGljYXRpbmcgaWYgYSBub2RlIHRvIGJlIHJlbW92ZWQgaXMgYSBob3N0IG9mIGEgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCByTm9kZTogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZVBhcmVudCA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIHJOb2RlKTtcbiAgaWYgKG5hdGl2ZVBhcmVudCkge1xuICAgIG5hdGl2ZVJlbW92ZUNoaWxkKHJlbmRlcmVyLCBuYXRpdmVQYXJlbnQsIHJOb2RlLCBpc0hvc3RFbGVtZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgbm9kZXMgdG8gYSB0YXJnZXQgcHJvamVjdGlvbiBwbGFjZS4gTm9kZXMgdG8gaW5zZXJ0IHdlcmUgcHJldmlvdXNseSByZS1kaXN0cmlidXRpb24gYW5kXG4gKiBzdG9yZWQgb24gYSBjb21wb25lbnQgaG9zdCBsZXZlbC5cbiAqIEBwYXJhbSBsVmlldyBBIExWaWV3IHdoZXJlIG5vZGVzIGFyZSBpbnNlcnRlZCAodGFyZ2V0IFZMdmlldylcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgQSBwcm9qZWN0aW9uIG5vZGUgd2hlcmUgcHJldmlvdXNseSByZS1kaXN0cmlidXRpb24gc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiAodGFyZ2V0IGluc2VydGlvbiBwbGFjZSlcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4IEEgYnVja2V0IGZyb20gd2hlcmUgbm9kZXMgdG8gcHJvamVjdCBzaG91bGQgYmUgdGFrZW5cbiAqIEBwYXJhbSBjb21wb25lbnRWaWV3IEEgd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBpbml0aWFsbHkgY3JlYXRlZCAoc291cmNlIHZpZXcpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlcyhcbiAgICBsVmlldzogTFZpZXcsIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlLCBzZWxlY3RvckluZGV4OiBudW1iZXIsXG4gICAgY29tcG9uZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcHJvamVjdGVkVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICBsZXQgbm9kZVRvUHJvamVjdCA9IChjb21wb25lbnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtzZWxlY3RvckluZGV4XTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlVG9Qcm9qZWN0KSkge1xuICAgIGFwcGVuZENoaWxkKG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlcyhcbiAgICAgICAgICAgIGxWaWV3LCB0UHJvamVjdGlvbk5vZGUsIChub2RlVG9Qcm9qZWN0IGFzIFRQcm9qZWN0aW9uTm9kZSkucHJvamVjdGlvbixcbiAgICAgICAgICAgIGZpbmRDb21wb25lbnRWaWV3KHByb2plY3RlZFZpZXcpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgZmxhZyBtdXN0IGJlIHNldCBub3cgb3Igd2Ugd29uJ3Qga25vdyB0aGF0IHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICAgICAgLy8gaWYgdGhlIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGxhdGVyLlxuICAgICAgICBub2RlVG9Qcm9qZWN0LmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG4gICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobm9kZVRvUHJvamVjdCwgdFByb2plY3Rpb25Ob2RlLCBsVmlldywgcHJvamVjdGVkVmlldyk7XG4gICAgICB9XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHByb2plY3RlZFROb2RlIFRoZSBUTm9kZSB0byBiZSBwcm9qZWN0ZWRcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgVGhlIHByb2plY3Rpb24gKG5nLWNvbnRlbnQpIFROb2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlldyAodmlldyBhYm92ZSBjdXJyZW50KVxuICovXG5mdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIHByb2plY3RlZFROb2RlOiBUTm9kZSwgdFByb2plY3Rpb25Ob2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LFxuICAgIHByb2plY3Rpb25WaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByb2plY3RlZFROb2RlLCBwcm9qZWN0aW9uVmlldyk7XG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG5cbiAgLy8gdGhlIHByb2plY3RlZCBjb250ZW50cyBhcmUgcHJvY2Vzc2VkIHdoaWxlIGluIHRoZSBzaGFkb3cgdmlldyAod2hpY2ggaXMgdGhlIGN1cnJlbnRWaWV3KVxuICAvLyB0aGVyZWZvcmUgd2UgbmVlZCB0byBleHRyYWN0IHRoZSB2aWV3IHdoZXJlIHRoZSBob3N0IGVsZW1lbnQgbGl2ZXMgc2luY2UgaXQncyB0aGVcbiAgLy8gbG9naWNhbCBjb250YWluZXIgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGVkIHZpZXdzXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHByb2plY3Rpb25WaWV3KTtcblxuICBjb25zdCBub2RlT3JDb250YWluZXIgPSBwcm9qZWN0aW9uVmlld1twcm9qZWN0ZWRUTm9kZS5pbmRleF07XG4gIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIGNvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBhbiBlbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ24gdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3Qgdmlld3MgPSBub2RlT3JDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdzW2ldLCB0cnVlLCBub2RlT3JDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgbGV0IG5nQ29udGFpbmVyQ2hpbGRUTm9kZTogVE5vZGV8bnVsbCA9IHByb2plY3RlZFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICAgICAgd2hpbGUgKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSkge1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50VmlldywgcHJvamVjdGlvblZpZXcpO1xuICAgICAgICBuZ0NvbnRhaW5lckNoaWxkVE5vZGUgPSBuZ0NvbnRhaW5lckNoaWxkVE5vZGUubmV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIGFwcGVuZENoaWxkKG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==