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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBYSxNQUFNLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTNHLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBd0QsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEksT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBbUUsb0JBQW9CLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkssT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBK0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbk0sT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFD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QGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NISUxEX0hFQUQsIENMRUFOVVAsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1QsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXcsIGdldExWaWV3UGFyZW50fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3LCB1bndyYXBSTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TENvbnRhaW5lcih0Tm9kZTogVFZpZXdOb2RlLCBlbWJlZGRlZFZpZXc6IExWaWV3KTogTENvbnRhaW5lcnxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGVtYmVkZGVkVmlldyk7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGVtYmVkZGVkVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gIGlmICh0Tm9kZS5pbmRleCA9PT0gLTEpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IGluc2lkZSBhIGR5bmFtaWMgY29udGFpbmVyLlxuICAgIC8vIFRoZSBwYXJlbnQgaXNuJ3QgYW4gTENvbnRhaW5lciBpZiB0aGUgZW1iZWRkZWQgdmlldyBoYXNuJ3QgYmVlbiBhdHRhY2hlZCB5ZXQuXG4gICAgcmV0dXJuIGlzTENvbnRhaW5lcihjb250YWluZXIpID8gY29udGFpbmVyIDogbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihjb250YWluZXIpO1xuICAgIC8vIFRoaXMgaXMgYSBpbmxpbmUgdmlldyBub2RlIChlLmcuIGVtYmVkZGVkVmlld1N0YXJ0KVxuICAgIHJldHVybiBjb250YWluZXI7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJldHJpZXZlcyByZW5kZXIgcGFyZW50IGZvciBhIGdpdmVuIHZpZXcuXG4gKiBNaWdodCBiZSBudWxsIGlmIGEgdmlldyBpcyBub3QgeWV0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRhaW5lclJlbmRlclBhcmVudCh0Vmlld05vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0TENvbnRhaW5lcih0Vmlld05vZGUsIHZpZXcpO1xuICByZXR1cm4gY29udGFpbmVyID8gbmF0aXZlUGFyZW50Tm9kZSh2aWV3W1JFTkRFUkVSXSwgY29udGFpbmVyW05BVElWRV0pIDogbnVsbDtcbn1cblxuY29uc3QgZW51bSBXYWxrVE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgaW5zZXJ0IGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgSW5zZXJ0ID0gMCxcblxuICAvKiogbm9kZSBkZXRhY2ggZnJvbSB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIERldGFjaCA9IDEsXG5cbiAgLyoqIG5vZGUgZGVzdHJ1Y3Rpb24gdXNpbmcgdGhlIHJlbmRlcmVyJ3MgQVBJICovXG4gIERlc3Ryb3kgPSAyLFxufVxuXG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gd2Fsa1ROb2RlVHJlZS5cbiAqXG4gKiBUaGlzIGlzIGRlbGliZXJhdGVseSBjcmVhdGVkIG91dHNpZGUgb2Ygd2Fsa1ROb2RlVHJlZSB0byBhdm9pZCBhbGxvY2F0aW5nXG4gKiBhIG5ldyBhcnJheSBlYWNoIHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gSW5zdGVhZCB0aGUgYXJyYXkgd2lsbCBiZVxuICogcmUtdXNlZCBieSBlYWNoIGludm9jYXRpb24uIFRoaXMgd29ya3MgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgbm90IHJlZW50cmFudC5cbiAqL1xuY29uc3QgcHJvamVjdGlvbk5vZGVTdGFjazogKExWaWV3IHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgVE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBlbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgdGhlIHZpZXcgdG8gd2Fsa1xuICogQHBhcmFtIGFjdGlvbiBpZGVudGlmaWVzIHRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBlbGVtZW50c1xuICogQHBhcmFtIHJlbmRlcmVyIHRoZSBjdXJyZW50IHJlbmRlcmVyLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCBPcHRpb25hbCB0aGUgcmVuZGVyIHBhcmVudCBub2RlIHRvIGJlIHNldCBpbiBhbGwgTENvbnRhaW5lcnMgZm91bmQsXG4gKiByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIEluc2VydCBhbmQgRGVzdHJveS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIEluc2VydC5cbiAqL1xuZnVuY3Rpb24gd2Fsa1ROb2RlVHJlZShcbiAgICB2aWV3VG9XYWxrOiBMVmlldywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHJlbmRlclBhcmVudDogUkVsZW1lbnQgfCBudWxsLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuICBsZXQgY3VycmVudFZpZXcgPSB2aWV3VG9XYWxrO1xuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSByb290VE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGxldCBuZXh0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBjdXJyZW50VmlldyksIHROb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XTtcbiAgICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgICAvLyBUaGlzIGVsZW1lbnQgaGFzIGFuIExDb250YWluZXIsIGFuZCBpdHMgY29tbWVudCBuZWVkcyB0byBiZSBoYW5kbGVkXG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBub2RlT3JDb250YWluZXJbTkFUSVZFXSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lciA9IGN1cnJlbnRWaWV3ICFbdE5vZGUuaW5kZXhdIGFzIExDb250YWluZXI7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGxDb250YWluZXJbTkFUSVZFXSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICBpZiAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gbENvbnRhaW5lcltWSUVXU11bMF07XG4gICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHdhbGtlciBlbnRlcnMgYSBjb250YWluZXIsIHRoZW4gdGhlIGJlZm9yZU5vZGUgaGFzIHRvIGJlY29tZSB0aGUgbG9jYWwgbmF0aXZlXG4gICAgICAgIC8vIGNvbW1lbnQgbm9kZS5cbiAgICAgICAgYmVmb3JlTm9kZSA9IGxDb250YWluZXJbTkFUSVZFXTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoY3VycmVudFZpZXcgISk7XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGhlYWQpKSB7XG4gICAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgaGVhZCkge1xuICAgICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbmF0aXZlTm9kZSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBNdXN0IHN0b3JlIGJvdGggdGhlIFROb2RlIGFuZCB0aGUgdmlldyBiZWNhdXNlIHRoaXMgcHJvamVjdGlvbiBub2RlIGNvdWxkIGJlIG5lc3RlZFxuICAgICAgICAvLyBkZWVwbHkgaW5zaWRlIGVtYmVkZGVkIHZpZXdzLCBhbmQgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIHRoaXMgcGFydGljdWxhciBuZXN0ZWRcbiAgICAgICAgLy8gdmlldy5cbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gdE5vZGU7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IGN1cnJlbnRWaWV3ICE7XG4gICAgICAgIGlmIChoZWFkKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gIWFzIExWaWV3O1xuICAgICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGEgVmlldyBvciBhbiBFbGVtZW50Q29udGFpbmVyXG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5jaGlsZDtcbiAgICB9XG5cbiAgICBpZiAobmV4dFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKHROb2RlLm5leHQgPT09IG51bGwgJiYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXc7XG4gICAgICAgIHROb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIFROb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICAgICAgICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gICAgICAgKlxuICAgICAgICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGVuIGl0IGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAgICAgICAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICAgICAgICovXG4gICAgICB3aGlsZSAoIW5leHRUTm9kZSkge1xuICAgICAgICAvLyBJZiBwYXJlbnQgaXMgbnVsbCwgd2UncmUgY3Jvc3NpbmcgdGhlIHZpZXcgYm91bmRhcnksIHNvIHdlIHNob3VsZCBnZXQgdGhlIGhvc3QgVE5vZGUuXG4gICAgICAgIHROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W1RfSE9TVF07XG5cbiAgICAgICAgaWYgKHROb2RlID09PSBudWxsIHx8IHROb2RlID09PSByb290VE5vZGUpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIFdoZW4gZXhpdGluZyBhIGNvbnRhaW5lciwgdGhlIGJlZm9yZU5vZGUgbXVzdCBiZSByZXN0b3JlZCB0byB0aGUgcHJldmlvdXMgdmFsdWVcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGdldExWaWV3UGFyZW50KGN1cnJlbnRWaWV3KSAhO1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF1bTkFUSVZFXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIElmIGN1cnJlbnQgbFZpZXcgZG9lc24ndCBoYXZlIG5leHQgcG9pbnRlciwgd2UgdHJ5IHRvIGZpbmQgaXQgYnkgZ29pbmcgdXAgcGFyZW50c1xuICAgICAgICAgICAqIGNoYWluIHVudGlsOlxuICAgICAgICAgICAqIC0gd2UgZmluZCBhbiBsVmlldyB3aXRoIGEgbmV4dCBwb2ludGVyXG4gICAgICAgICAgICogLSBvciBmaW5kIGEgdE5vZGUgd2l0aCBhIHBhcmVudCB0aGF0IGhhcyBhIG5leHQgcG9pbnRlclxuICAgICAgICAgICAqIC0gb3IgcmVhY2ggcm9vdCBUTm9kZSAoaW4gd2hpY2ggY2FzZSB3ZSBleGl0LCBzaW5jZSB3ZSB0cmF2ZXJzZWQgYWxsIG5vZGVzKVxuICAgICAgICAgICAqL1xuICAgICAgICAgIHdoaWxlICghY3VycmVudFZpZXdbTkVYVF0gJiYgY3VycmVudFZpZXdbUEFSRU5UXSAmJlxuICAgICAgICAgICAgICAgICAhKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQubmV4dCkpIHtcbiAgICAgICAgICAgIGlmICh0Tm9kZSA9PT0gcm9vdFROb2RlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSBhcyBMVmlldztcbiAgICAgICAgICAgIHROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY3VycmVudFZpZXdbTkVYVF0pIHtcbiAgICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbTkVYVF0gYXMgTFZpZXc7XG4gICAgICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gbmV4dFROb2RlO1xuICB9XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLCBub2RlOiBSTm9kZSxcbiAgICB0Tm9kZTogVE5vZGUsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCAhLCBub2RlLCBiZWZvcmVOb2RlIHx8IG51bGwpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCBub2RlLCBpc0NvbXBvbmVudCh0Tm9kZSkpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGxldCBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3W0NISUxEX0hFQURdO1xuICBpZiAoIWxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuXG4gIHdoaWxlIChsVmlld09yTENvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAvLyBJZiBMVmlldywgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lcltDSElMRF9IRUFEXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IHZpZXdzID0gbFZpZXdPckxDb250YWluZXJbVklFV1NdIGFzIExWaWV3W107XG4gICAgICBpZiAodmlld3MubGVuZ3RoID4gMCkgbmV4dCA9IHZpZXdzWzBdO1xuICAgIH1cblxuICAgIGlmICghbmV4dCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlIChsVmlld09yTENvbnRhaW5lciAmJiAhbFZpZXdPckxDb250YWluZXIgIVtORVhUXSAmJiBsVmlld09yTENvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgICBsVmlld09yTENvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKGxWaWV3T3JMQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXIgJiYgbFZpZXdPckxDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgbFZpZXdPckxDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBpbmRleCBXaGljaCBpbmRleCBpbiB0aGUgY29udGFpbmVyIHRvIGluc2VydCB0aGUgY2hpbGQgdmlldyBpbnRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KGxWaWV3OiBMVmlldywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld3MsICdDb250YWluZXIgbXVzdCBoYXZlIHZpZXdzJyk7XG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgRGV0YWNoZWQgTFZpZXcgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXc7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld1RvRGV0YWNoLCBmYWxzZSk7XG5cbiAgaWYgKHZpZXdUb0RldGFjaFtRVUVSSUVTXSkge1xuICAgIHZpZXdUb0RldGFjaFtRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICByZXR1cm4gdmlld1RvRGV0YWNoO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmlldyA9IGxDb250YWluZXJbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRlc3Ryb3lMVmlldyh2aWV3KTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlldykge1xuICBpZiAoISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgd2Fsa1ROb2RlVHJlZSh2aWV3LCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG5cbiAgICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUobFZpZXdPckxDb250YWluZXI6IExWaWV3IHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3KTogTFZpZXd8XG4gICAgTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IHROb2RlO1xuICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikgJiYgKHROb2RlID0gbFZpZXdPckxDb250YWluZXJbVF9IT1NUXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRMQ29udGFpbmVyKHROb2RlIGFzIFRWaWV3Tm9kZSwgbFZpZXdPckxDb250YWluZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgb25EZXN0cm95cyBob29rcyBmb3IgYWxsIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGluIGEgZ2l2ZW4gdmlldyBhbmQgdGhlbiByZW1vdmVzIGFsbFxuICogbGlzdGVuZXJzLiBMaXN0ZW5lcnMgYXJlIHJlbW92ZWQgYXMgdGhlIGxhc3Qgc3RlcCBzbyBldmVudHMgZGVsaXZlcmVkIGluIHRoZSBvbkRlc3Ryb3lzIGhvb2tzXG4gKiBjYW4gYmUgcHJvcGFnYXRlZCB0byBAT3V0cHV0IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlldyB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKCh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlldztcblxuICAgIC8vIE1hcmsgdGhlIExWaWV3IGFzIGRlc3Ryb3llZCAqYmVmb3JlKiBleGVjdXRpbmcgdGhlIG9uRGVzdHJveSBob29rcy4gQW4gb25EZXN0cm95IGhvb2tcbiAgICAvLyBydW5zIGFyYml0cmFyeSB1c2VyIGNvZGUsIHdoaWNoIGNvdWxkIGluY2x1ZGUgaXRzIG93biBgdmlld1JlZi5kZXN0cm95KClgIChvciBzaW1pbGFyKS4gSWZcbiAgICAvLyBXZSBkb24ndCBmbGFnIHRoZSB2aWV3IGFzIGRlc3Ryb3llZCBiZWZvcmUgdGhlIGhvb2tzLCB0aGlzIGNvdWxkIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAvLyBUaGlzIGFsc28gYWxpZ25zIHdpdGggdGhlIFZpZXdFbmdpbmUgYmVoYXZpb3IuIEl0IGFsc28gbWVhbnMgdGhhdCB0aGUgb25EZXN0cm95IGhvb2sgaXNcbiAgICAvLyByZWFsbHkgbW9yZSBvZiBhbiBcImFmdGVyRGVzdHJveVwiIGhvb2sgaWYgeW91IHRoaW5rIGFib3V0IGl0LlxuICAgIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xuXG4gICAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZpZXdbVF9IT1NUXTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRDbGVhbnVwID0gbFZpZXdbVFZJRVddLmNsZWFudXAgITtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdICE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgdENsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHRoZSBuYXRpdmUgcmVuZGVyZXJcbiAgICAgICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSB0Q2xlYW51cFtpICsgMV07XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICBpZHhPclRhcmdldEdldHRlcihsVmlldykgOlxuICAgICAgICAgICAgdW53cmFwUk5vZGUobFZpZXdbaWR4T3JUYXJnZXRHZXR0ZXJdKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMl1dO1xuICAgICAgICBjb25zdCB1c2VDYXB0dXJlT3JTdWJJZHggPSB0Q2xlYW51cFtpICsgM107XG4gICAgICAgIGlmICh0eXBlb2YgdXNlQ2FwdHVyZU9yU3ViSWR4ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAvLyBET00gbGlzdGVuZXJcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0Q2xlYW51cFtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHVzZUNhcHR1cmVPclN1YklkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyB1bnJlZ2lzdGVyXG4gICAgICAgICAgICBsQ2xlYW51cFt1c2VDYXB0dXJlT3JTdWJJZHhdKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvblxuICAgICAgICAgICAgbENsZWFudXBbLXVzZUNhcHR1cmVPclN1YklkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdENsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IGxDbGVhbnVwW3RDbGVhbnVwW2ldXTtcbiAgICAgICAgY2xlYW51cEZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIHRDbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxWaWV3W0NMRUFOVVBdID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzdHJveUhvb2tzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gdmlld1tkZXN0cm95SG9va3NbaV0gYXMgbnVtYmVyXTtcblxuICAgICAgLy8gT25seSBjYWxsIHRoZSBkZXN0cm95IGhvb2sgaWYgdGhlIGNvbnRleHQgaGFzIGJlZW4gcmVxdWVzdGVkLlxuICAgICAgaWYgKCEoY29udGV4dCBpbnN0YW5jZW9mIE5vZGVJbmplY3RvckZhY3RvcnkpKSB7XG4gICAgICAgIChkZXN0cm95SG9va3NbaSArIDFdIGFzKCkgPT4gdm9pZCkuY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIGVsZW1lbnQgaWYgYSBub2RlIGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFkZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlclBhcmVudCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICAvLyBOb2RlcyBvZiB0aGUgdG9wLW1vc3QgdmlldyBjYW4gYmUgaW5zZXJ0ZWQgZWFnZXJseS5cbiAgaWYgKGlzUm9vdFZpZXcoY3VycmVudFZpZXcpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZVBhcmVudE5vZGUoY3VycmVudFZpZXdbUkVOREVSRVJdLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBjdXJyZW50VmlldykpO1xuICB9XG5cbiAgLy8gU2tpcCBvdmVyIGVsZW1lbnQgYW5kIElDVSBjb250YWluZXJzIGFzIHRob3NlIGFyZSByZXByZXNlbnRlZCBieSBhIGNvbW1lbnQgbm9kZSBhbmRcbiAgLy8gY2FuJ3QgYmUgdXNlZCBhcyBhIHJlbmRlciBwYXJlbnQuXG4gIGNvbnN0IHBhcmVudCA9IGdldEhpZ2hlc3RFbGVtZW50T3JJQ1VDb250YWluZXIodE5vZGUpLnBhcmVudDtcblxuICAvLyBJZiB0aGUgcGFyZW50IGlzIG51bGwsIHRoZW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3Mgdmlld3M6IGVpdGhlciBpbnRvIGFuIGVtYmVkZGVkIHZpZXcgb3IgYVxuICAvLyBjb21wb25lbnQgdmlldy5cbiAgaWYgKHBhcmVudCA9PSBudWxsKSB7XG4gICAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgYW4gZW1iZWRkZWQgdmlldyBXZSBtaWdodCBkZWxheSBpbnNlcnRpb24gb2YgY2hpbGRyZW5cbiAgICAgIC8vIGZvciBhIGdpdmVuIHZpZXcgaWYgaXQgaXMgZGlzY29ubmVjdGVkLiBUaGlzIG1pZ2h0IGhhcHBlbiBmb3IgMiBtYWluIHJlYXNvbnM6XG4gICAgICAvLyAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lcih2aWV3IHdhcyBjcmVhdGVkIGJ1dCBub3QgaW5zZXJ0ZWQgeWV0KVxuICAgICAgLy8gLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAgICAgIC8vIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICAgICAgLy8gSW4gb3RoZXIgd29yZHMgd2UgY2FuIGluc2VydCBjaGlsZHJlbiBvZiBhIGdpdmVuIHZpZXcgaWYgdGhpcyB2aWV3IHdhcyBpbnNlcnRlZCBpbnRvIGFcbiAgICAgIC8vIGNvbnRhaW5lciBhbmQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaGFzIGl0cyByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gICAgICByZXR1cm4gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KGhvc3RUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmRcbiAgICAgIC8vIGl0IHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gICAgICByZXR1cm4gZ2V0SG9zdE5hdGl2ZShjdXJyZW50Vmlldyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwYXJlbnQsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBpZiAocGFyZW50LmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkge1xuICAgICAgY29uc3QgdERhdGEgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YTtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbcGFyZW50LmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIGNvbnN0IGVuY2Fwc3VsYXRpb24gPSAodERhdGFbdE5vZGUuZGlyZWN0aXZlU3RhcnRdIGFzIENvbXBvbmVudERlZjxhbnk+KS5lbmNhcHN1bGF0aW9uO1xuXG4gICAgICAvLyBXZSd2ZSBnb3QgYSBwYXJlbnQgd2hpY2ggaXMgYW4gZWxlbWVudCBpbiB0aGUgY3VycmVudCB2aWV3LiBXZSBqdXN0IG5lZWQgdG8gdmVyaWZ5IGlmIHRoZVxuICAgICAgLy8gcGFyZW50IGVsZW1lbnQgaXMgbm90IGEgY29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAgICAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhlbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi4gTm90ZSB0aGF0IHdlIGNhbid0XG4gICAgICAvLyBtYWtlIHRoaXMgYXNzdW1wdGlvbiB3aGVuIHVzaW5nIHRoZSBTaGFkb3cgRE9NLCBiZWNhdXNlIHRoZSBuYXRpdmUgcHJvamVjdGlvbiBwbGFjZWhvbGRlcnNcbiAgICAgIC8vICg8Y29udGVudD4gb3IgPHNsb3Q+KSBoYXZlIHRvIGJlIGluIHBsYWNlIGFzIGVsZW1lbnRzIGFyZSBiZWluZyBpbnNlcnRlZC5cbiAgICAgIGlmIChlbmNhcHN1bGF0aW9uICE9PSBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb20gJiZcbiAgICAgICAgICBlbmNhcHN1bGF0aW9uICE9PSBWaWV3RW5jYXBzdWxhdGlvbi5OYXRpdmUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50LCBjdXJyZW50VmlldykgYXMgUkVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgaG9zdCBlbGVtZW50IGZvciBhIGdpdmVuIHZpZXcuIFdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIGN1cnJlbnQgdmlldyBkb2VzIG5vdCBoYXZlXG4gKiBhIGhvc3QgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZ2V0SG9zdE5hdGl2ZShjdXJyZW50VmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXTtcbiAgcmV0dXJuIGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgP1xuICAgICAgKGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBnZXRMVmlld1BhcmVudChjdXJyZW50VmlldykgISkgYXMgUkVsZW1lbnQpIDpcbiAgICAgIG51bGw7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5hdGl2ZSBub2RlIGJlZm9yZSBhbm90aGVyIG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIHBhcmVudCB1c2luZyB7QGxpbmsgUmVuZGVyZXIzfS5cbiAqIFRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBuYXRpdmUgbm9kZXMgd2VyZSBkZXRlcm1pbmVkIC0gaXQgYWJzdHJhY3RzIGFuXG4gKiBhY3R1YWwgcmVuZGVyZXIgYmVpbmcgdXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGQsIGJlZm9yZU5vZGUsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSk6IHZvaWQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50LCBjaGlsZCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYmVmb3JlTm9kZSkge1xuICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQpO1xuICB9XG59XG5cbi8qKiBSZW1vdmVzIGEgbm9kZSBmcm9tIHRoZSBET00gZ2l2ZW4gaXRzIG5hdGl2ZSBwYXJlbnQuICovXG5mdW5jdGlvbiBuYXRpdmVSZW1vdmVDaGlsZChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQsIGNoaWxkLCBpc0hvc3RFbGVtZW50KTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBwYXJlbnQgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSRWxlbWVudHxudWxsIHtcbiAgcmV0dXJuIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5wYXJlbnROb2RlKG5vZGUpIDogbm9kZS5wYXJlbnROb2RlKSBhcyBSRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHNpYmxpbmcgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5uZXh0U2libGluZyhub2RlKSA6IG5vZGUubmV4dFNpYmxpbmc7XG59XG5cbi8qKlxuICogRmluZHMgYSBuYXRpdmUgXCJhbmNob3JcIiBub2RlIGZvciBjYXNlcyB3aGVyZSB3ZSBjYW4ndCBhcHBlbmQgYSBuYXRpdmUgY2hpbGQgZGlyZWN0bHlcbiAqIChgYXBwZW5kQ2hpbGRgKSBhbmQgbmVlZCB0byB1c2UgYSByZWZlcmVuY2UgKGFuY2hvcikgbm9kZSBmb3IgdGhlIGBpbnNlcnRCZWZvcmVgIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSBwYXJlbnRUTm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZXxudWxsIHtcbiAgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGdldExDb250YWluZXIocGFyZW50VE5vZGUgYXMgVFZpZXdOb2RlLCBsVmlldykgITtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGNvbnN0IGluZGV4ID0gdmlld3MuaW5kZXhPZihsVmlldyk7XG4gICAgcmV0dXJuIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4LCB2aWV3cywgbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgfSBlbHNlIGlmIChcbiAgICAgIHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8XG4gICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIG5hdGl2ZSBub2RlIChvciBhIGNvbGxlY3Rpb24gb2Ygbm9kZXMpIHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX0uXG4gKlxuICogQHBhcmFtIGNoaWxkRWwgVGhlIG5hdGl2ZSBjaGlsZCAob3IgY2hpbGRyZW4pIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIGVsZW1lbnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQoY2hpbGRFbDogUk5vZGUgfCBSTm9kZVtdLCBjaGlsZFROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudChjaGlsZFROb2RlLCBjdXJyZW50Vmlldyk7XG4gIGlmIChyZW5kZXJQYXJlbnQgIT0gbnVsbCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IHBhcmVudFROb2RlOiBUTm9kZSA9IGNoaWxkVE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W1RfSE9TVF0gITtcbiAgICBjb25zdCBhbmNob3JOb2RlID0gZ2V0TmF0aXZlQW5jaG9yTm9kZShwYXJlbnRUTm9kZSwgY3VycmVudFZpZXcpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkRWwpKSB7XG4gICAgICBmb3IgKGxldCBuYXRpdmVOb2RlIG9mIGNoaWxkRWwpIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbmF0aXZlTm9kZSwgYW5jaG9yTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGNoaWxkRWwsIGFuY2hvck5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIHRvcC1sZXZlbCBlbGVtZW50IG9yIGFuIElDVSBjb250YWluZXIgaWYgdGhvc2UgY29udGFpbmVycyBhcmUgbmVzdGVkLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhcnRpbmcgVE5vZGUgZm9yIHdoaWNoIHdlIHNob3VsZCBza2lwIGVsZW1lbnQgYW5kIElDVSBjb250YWluZXJzXG4gKiBAcmV0dXJucyBUaGUgVE5vZGUgb2YgdGhlIGhpZ2hlc3QgbGV2ZWwgSUNVIGNvbnRhaW5lciBvciBlbGVtZW50IGNvbnRhaW5lclxuICovXG5mdW5jdGlvbiBnZXRIaWdoZXN0RWxlbWVudE9ySUNVQ29udGFpbmVyKHROb2RlOiBUTm9kZSk6IFROb2RlIHtcbiAgd2hpbGUgKHROb2RlLnBhcmVudCAhPSBudWxsICYmICh0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikpIHtcbiAgICB0Tm9kZSA9IHROb2RlLnBhcmVudDtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleDogbnVtYmVyLCB2aWV3czogTFZpZXdbXSwgY29udGFpbmVyTmF0aXZlOiBSQ29tbWVudCkge1xuICBpZiAoaW5kZXggKyAxIDwgdmlld3MubGVuZ3RoKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdzW2luZGV4ICsgMV0gYXMgTFZpZXc7XG4gICAgY29uc3Qgdmlld1ROb2RlID0gdmlld1tUX0hPU1RdIGFzIFRWaWV3Tm9kZTtcbiAgICByZXR1cm4gdmlld1ROb2RlLmNoaWxkID8gZ2V0TmF0aXZlQnlUTm9kZSh2aWV3VE5vZGUuY2hpbGQsIHZpZXcpIDogY29udGFpbmVyTmF0aXZlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjb250YWluZXJOYXRpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgbmF0aXZlIG5vZGUgaXRzZWxmIHVzaW5nIGEgZ2l2ZW4gcmVuZGVyZXIuIFRvIHJlbW92ZSB0aGUgbm9kZSB3ZSBhcmUgbG9va2luZyB1cCBpdHNcbiAqIHBhcmVudCBmcm9tIHRoZSBuYXRpdmUgdHJlZSBhcyBub3QgYWxsIHBsYXRmb3JtcyAvIGJyb3dzZXJzIHN1cHBvcnQgdGhlIGVxdWl2YWxlbnQgb2ZcbiAqIG5vZGUucmVtb3ZlKCkuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gYmUgdXNlZFxuICogQHBhcmFtIHJOb2RlIFRoZSBuYXRpdmUgbm9kZSB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG4gKiBAcGFyYW0gaXNIb3N0RWxlbWVudCBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIG5vZGUgdG8gYmUgcmVtb3ZlZCBpcyBhIGhvc3Qgb2YgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyOiBSZW5kZXJlcjMsIHJOb2RlOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlUGFyZW50ID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgck5vZGUpO1xuICBpZiAobmF0aXZlUGFyZW50KSB7XG4gICAgbmF0aXZlUmVtb3ZlQ2hpbGQocmVuZGVyZXIsIG5hdGl2ZVBhcmVudCwgck5vZGUsIGlzSG9zdEVsZW1lbnQpO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHByb2plY3RlZCBub2RlIHRvIHRoZSBET00sIG9yIGluIHRoZSBjYXNlIG9mIGEgcHJvamVjdGVkIGNvbnRhaW5lcixcbiAqIGFwcGVuZHMgdGhlIG5vZGVzIGZyb20gYWxsIG9mIHRoZSBjb250YWluZXIncyBhY3RpdmUgdmlld3MgdG8gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gcHJvamVjdGVkVE5vZGUgVGhlIFROb2RlIHRvIGJlIHByb2plY3RlZFxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBUaGUgcHJvamVjdGlvbiAobmctY29udGVudCkgVE5vZGVcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKiBAcGFyYW0gcHJvamVjdGlvblZpZXcgUHJvamVjdGlvbiB2aWV3ICh2aWV3IGFib3ZlIGN1cnJlbnQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIHByb2plY3RlZFROb2RlOiBUTm9kZSwgdFByb2plY3Rpb25Ob2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LFxuICAgIHByb2plY3Rpb25WaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByb2plY3RlZFROb2RlLCBwcm9qZWN0aW9uVmlldyk7XG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG5cbiAgLy8gdGhlIHByb2plY3RlZCBjb250ZW50cyBhcmUgcHJvY2Vzc2VkIHdoaWxlIGluIHRoZSBzaGFkb3cgdmlldyAod2hpY2ggaXMgdGhlIGN1cnJlbnRWaWV3KVxuICAvLyB0aGVyZWZvcmUgd2UgbmVlZCB0byBleHRyYWN0IHRoZSB2aWV3IHdoZXJlIHRoZSBob3N0IGVsZW1lbnQgbGl2ZXMgc2luY2UgaXQncyB0aGVcbiAgLy8gbG9naWNhbCBjb250YWluZXIgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGVkIHZpZXdzXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHByb2plY3Rpb25WaWV3KTtcblxuICBjb25zdCBub2RlT3JDb250YWluZXIgPSBwcm9qZWN0aW9uVmlld1twcm9qZWN0ZWRUTm9kZS5pbmRleF07XG4gIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIGNvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBhbiBlbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ24gdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3Qgdmlld3MgPSBub2RlT3JDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdzW2ldLCB0cnVlLCBub2RlT3JDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgbGV0IG5nQ29udGFpbmVyQ2hpbGRUTm9kZTogVE5vZGV8bnVsbCA9IHByb2plY3RlZFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICAgICAgd2hpbGUgKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSkge1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50VmlldywgcHJvamVjdGlvblZpZXcpO1xuICAgICAgICBuZ0NvbnRhaW5lckNoaWxkVE5vZGUgPSBuZ0NvbnRhaW5lckNoaWxkVE5vZGUubmV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIGFwcGVuZENoaWxkKG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==