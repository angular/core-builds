/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
var unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
export function getLContainer(tNode, embeddedView) {
    ngDevMode && assertLView(embeddedView);
    var container = embeddedView[PARENT];
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
 */
function getContainerRenderParent(tViewNode, view) {
    var container = getLContainer(tViewNode, view);
    return container ? nativeParentNode(view[RENDERER], container[NATIVE]) : null;
}
/**
 * Stack used to keep track of projection nodes in walkTNodeTree.
 *
 * This is deliberately created outside of walkTNodeTree to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
 */
var projectionNodeStack = [];
/**
 * Walks a tree of TNodes, applying a transformation on the element nodes, either only on the first
 * one found, or on all of them.
 *
 * @param viewToWalk the view to walk
 * @param action identifies the action to be performed on the elements
 * @param renderer the current renderer.
 * @param renderParent Optional the render parent node to be set in all LContainers found,
 * required for action modes Insert and Destroy.
 * @param beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 */
function walkTNodeTree(viewToWalk, action, renderer, renderParent, beforeNode) {
    var e_1, _a;
    var rootTNode = viewToWalk[TVIEW].node;
    var projectionNodeIndex = -1;
    var currentView = viewToWalk;
    var tNode = rootTNode.child;
    while (tNode) {
        var nextTNode = null;
        if (tNode.type === 3 /* Element */) {
            executeNodeAction(action, renderer, renderParent, getNativeByTNode(tNode, currentView), tNode, beforeNode);
            var nodeOrContainer = currentView[tNode.index];
            if (isLContainer(nodeOrContainer)) {
                // This element has an LContainer, and its comment needs to be handled
                executeNodeAction(action, renderer, renderParent, nodeOrContainer[NATIVE], tNode, beforeNode);
            }
        }
        else if (tNode.type === 0 /* Container */) {
            var lContainer = currentView[tNode.index];
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
            var componentView = findComponentView(currentView);
            var componentHost = componentView[T_HOST];
            var head = componentHost.projection[tNode.projection];
            if (Array.isArray(head)) {
                try {
                    for (var head_1 = tslib_1.__values(head), head_1_1 = head_1.next(); !head_1_1.done; head_1_1 = head_1.next()) {
                        var nativeNode = head_1_1.value;
                        executeNodeAction(action, renderer, renderParent, nativeNode, tNode, beforeNode);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (head_1_1 && !head_1_1.done && (_a = head_1.return)) _a.call(head_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                // Must store both the TNode and the view because this projection node could be nested
                // deeply inside embedded views, and we need to get back down to this particular nested
                // view.
                projectionNodeStack[++projectionNodeIndex] = tNode;
                projectionNodeStack[++projectionNodeIndex] = currentView;
                if (head) {
                    currentView = componentView[PARENT];
                    nextTNode = currentView[TVIEW].data[head.index];
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
                currentView = projectionNodeStack[projectionNodeIndex--];
                tNode = projectionNodeStack[projectionNodeIndex--];
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
                    currentView = getLViewParent(currentView);
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
                        currentView = currentView[PARENT];
                        tNode = currentView[T_HOST];
                    }
                    if (currentView[NEXT]) {
                        currentView = currentView[NEXT];
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
 */
function executeNodeAction(action, renderer, parent, node, tNode, beforeNode) {
    if (action === 0 /* Insert */) {
        nativeInsertBefore(renderer, parent, node, beforeNode || null);
    }
    else if (action === 1 /* Detach */) {
        nativeRemoveNode(renderer, node, isComponent(tNode));
    }
    else if (action === 2 /* Destroy */) {
        ngDevMode && ngDevMode.rendererDestroyNode++;
        renderer.destroyNode(node);
    }
}
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(renderStringify(value)) :
        renderer.createTextNode(renderStringify(value));
}
export function addRemoveViewFromContainer(viewToWalk, insertMode, beforeNode) {
    var renderParent = getContainerRenderParent(viewToWalk[TVIEW].node, viewToWalk);
    ngDevMode && assertNodeType(viewToWalk[TVIEW].node, 2 /* View */);
    if (renderParent) {
        var renderer = viewToWalk[RENDERER];
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
 *  @param rootView The view to destroy
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    var lViewOrLContainer = rootView[CHILD_HEAD];
    if (!lViewOrLContainer) {
        return cleanUpView(rootView);
    }
    while (lViewOrLContainer) {
        var next = null;
        if (isLView(lViewOrLContainer)) {
            // If LView, traverse down to child.
            next = lViewOrLContainer[CHILD_HEAD];
        }
        else {
            ngDevMode && assertLContainer(lViewOrLContainer);
            // If container, traverse down to its first LView.
            var views = lViewOrLContainer[VIEWS];
            if (views.length > 0)
                next = views[0];
        }
        if (!next) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (lViewOrLContainer && !lViewOrLContainer[NEXT] && lViewOrLContainer !== rootView) {
                cleanUpView(lViewOrLContainer);
                lViewOrLContainer = getParentState(lViewOrLContainer, rootView);
            }
            cleanUpView(lViewOrLContainer || rootView);
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
 * @param lView The view to insert
 * @param lContainer The container into which the view should be inserted
 * @param index Which index in the container to insert the child view into
 */
export function insertView(lView, lContainer, index) {
    ngDevMode && assertLView(lView);
    ngDevMode && assertLContainer(lContainer);
    var views = lContainer[VIEWS];
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
        lView[QUERIES].insertView(index);
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
 * @param lContainer The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @returns Detached LView instance.
 */
export function detachView(lContainer, removeIndex) {
    var views = lContainer[VIEWS];
    var viewToDetach = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1][NEXT] = viewToDetach[NEXT];
    }
    views.splice(removeIndex, 1);
    addRemoveViewFromContainer(viewToDetach, false);
    if (viewToDetach[QUERIES]) {
        viewToDetach[QUERIES].removeView();
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
 * @param lContainer The container from which to remove a view
 * @param removeIndex The index of the view to remove
 */
export function removeView(lContainer, removeIndex) {
    var view = lContainer[VIEWS][removeIndex];
    detachView(lContainer, removeIndex);
    destroyLView(view);
}
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param view The view to be destroyed.
 */
export function destroyLView(view) {
    if (!(view[FLAGS] & 256 /* Destroyed */)) {
        var renderer = view[RENDERER];
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
 * @param lViewOrLContainer The LViewOrLContainer for which we need a parent state
 * @param rootView The rootView, so we don't propagate too far up the view tree
 * @returns The correct parent LViewOrLContainer
 */
export function getParentState(lViewOrLContainer, rootView) {
    var tNode;
    if (isLView(lViewOrLContainer) && (tNode = lViewOrLContainer[T_HOST]) &&
        tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getLContainer(tNode, lViewOrLContainer);
    }
    else {
        // otherwise, use parent view for containers or component views
        return lViewOrLContainer[PARENT] === rootView ? null : lViewOrLContainer[PARENT];
    }
}
/**
 * Calls onDestroys hooks for all directives and pipes in a given view and then removes all
 * listeners. Listeners are removed as the last step so events delivered in the onDestroys hooks
 * can be propagated to @Output listeners.
 *
 * @param view The LView to clean up
 */
function cleanUpView(viewOrContainer) {
    if (viewOrContainer.length >= HEADER_OFFSET) {
        var view = viewOrContainer;
        // Usually the Attached flag is removed when the view is detached from its parent, however
        // if it's a root view, the flag won't be unset hence why we're also removing on destroy.
        view[FLAGS] &= ~128 /* Attached */;
        // Mark the LView as destroyed *before* executing the onDestroy hooks. An onDestroy hook
        // runs arbitrary user code, which could include its own `viewRef.destroy()` (or similar). If
        // We don't flag the view as destroyed before the hooks, this could lead to an infinite loop.
        // This also aligns with the ViewEngine behavior. It also means that the onDestroy hook is
        // really more of an "afterDestroy" hook if you think about it.
        view[FLAGS] |= 256 /* Destroyed */;
        executeOnDestroys(view);
        removeListeners(view);
        var hostTNode = view[T_HOST];
        // For component views only, the local renderer is destroyed as clean up time.
        if (hostTNode && hostTNode.type === 3 /* Element */ && isProceduralRenderer(view[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            view[RENDERER].destroy();
        }
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function removeListeners(lView) {
    var tCleanup = lView[TVIEW].cleanup;
    if (tCleanup != null) {
        var lCleanup = lView[CLEANUP];
        for (var i = 0; i < tCleanup.length - 1; i += 2) {
            if (typeof tCleanup[i] === 'string') {
                // This is a listener with the native renderer
                var idxOrTargetGetter = tCleanup[i + 1];
                var target = typeof idxOrTargetGetter === 'function' ?
                    idxOrTargetGetter(lView) :
                    unwrapRNode(lView[idxOrTargetGetter]);
                var listener = lCleanup[tCleanup[i + 2]];
                var useCaptureOrSubIdx = tCleanup[i + 3];
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
                var cleanupFn = lCleanup[tCleanup[i]];
                cleanupFn();
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                var context = lCleanup[tCleanup[i + 1]];
                tCleanup[i].call(context);
            }
        }
        lView[CLEANUP] = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(view) {
    var tView = view[TVIEW];
    var destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        for (var i = 0; i < destroyHooks.length; i += 2) {
            var context = view[destroyHooks[i]];
            // Only call the destroy hook if the context has been requested.
            if (!(context instanceof NodeInjectorFactory)) {
                destroyHooks[i + 1].call(context);
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
 */
function getRenderParent(tNode, currentView) {
    // Nodes of the top-most view can be inserted eagerly.
    if (isRootView(currentView)) {
        return nativeParentNode(currentView[RENDERER], getNativeByTNode(tNode, currentView));
    }
    // Skip over element and ICU containers as those are represented by a comment node and
    // can't be used as a render parent.
    var parent = getHighestElementOrICUContainer(tNode).parent;
    // If the parent is null, then we are inserting across views: either into an embedded view or a
    // component view.
    if (parent == null) {
        var hostTNode = currentView[T_HOST];
        if (hostTNode.type === 2 /* View */) {
            // We are inserting a root element of an embedded view We might delay insertion of children
            // for a given view if it is disconnected. This might happen for 2 main reasons:
            // - view is not inserted into any container(view was created but not inserted yet)
            // - view is inserted into a container but the container itself is not inserted into the DOM
            // (container might be part of projection or child of a view that is not inserted yet).
            // In other words we can insert children of a given view if this view was inserted into a
            // container and the container itself has its render parent determined.
            return getContainerRenderParent(hostTNode, currentView);
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
            var tData = currentView[TVIEW].data;
            var tNode_1 = tData[parent.index];
            var encapsulation = tData[tNode_1.directiveStart].encapsulation;
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
        return getNativeByTNode(parent, currentView);
    }
}
/**
 * Gets the native host element for a given view. Will return null if the current view does not have
 * a host element.
 */
function getHostNative(currentView) {
    ngDevMode && assertLView(currentView);
    var hostTNode = currentView[T_HOST];
    return hostTNode && hostTNode.type === 3 /* Element */ ?
        getNativeByTNode(hostTNode, getLViewParent(currentView)) :
        null;
}
/**
 * Inserts a native node before another native node for a given parent using {@link Renderer3}.
 * This is a utility function that can be used when native nodes were determined - it abstracts an
 * actual renderer being used.
 */
export function nativeInsertBefore(renderer, parent, child, beforeNode) {
    if (isProceduralRenderer(renderer)) {
        renderer.insertBefore(parent, child, beforeNode);
    }
    else {
        parent.insertBefore(child, beforeNode, true);
    }
}
function nativeAppendChild(renderer, parent, child) {
    if (isProceduralRenderer(renderer)) {
        renderer.appendChild(parent, child);
    }
    else {
        parent.appendChild(child);
    }
}
function nativeAppendOrInsertBefore(renderer, parent, child, beforeNode) {
    if (beforeNode) {
        nativeInsertBefore(renderer, parent, child, beforeNode);
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
 * Finds a native "anchor" node for cases where we can't append a native child directly
 * (`appendChild`) and need to use a reference (anchor) node for the `insertBefore` operation.
 * @param parentTNode
 * @param lView
 */
function getNativeAnchorNode(parentTNode, lView) {
    if (parentTNode.type === 2 /* View */) {
        var lContainer = getLContainer(parentTNode, lView);
        var views = lContainer[VIEWS];
        var index = views.indexOf(lView);
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
 * The element insertion might be delayed {@link canInsertNativeNode}.
 *
 * @param childEl The native child (or children) that should be appended
 * @param childTNode The TNode of the child element
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export function appendChild(childEl, childTNode, currentView) {
    var e_2, _a;
    var renderParent = getRenderParent(childTNode, currentView);
    if (renderParent != null) {
        var renderer = currentView[RENDERER];
        var parentTNode = childTNode.parent || currentView[T_HOST];
        var anchorNode = getNativeAnchorNode(parentTNode, currentView);
        if (Array.isArray(childEl)) {
            try {
                for (var childEl_1 = tslib_1.__values(childEl), childEl_1_1 = childEl_1.next(); !childEl_1_1.done; childEl_1_1 = childEl_1.next()) {
                    var nativeNode = childEl_1_1.value;
                    nativeAppendOrInsertBefore(renderer, renderParent, nativeNode, anchorNode);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (childEl_1_1 && !childEl_1_1.done && (_a = childEl_1.return)) _a.call(childEl_1);
                }
                finally { if (e_2) throw e_2.error; }
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
 * @param tNode The starting TNode for which we should skip element and ICU containers
 * @returns The TNode of the highest level ICU container or element container
 */
function getHighestElementOrICUContainer(tNode) {
    while (tNode.parent != null && (tNode.parent.type === 4 /* ElementContainer */ ||
        tNode.parent.type === 5 /* IcuContainer */)) {
        tNode = tNode.parent;
    }
    return tNode;
}
export function getBeforeNodeForView(index, views, containerNative) {
    if (index + 1 < views.length) {
        var view = views[index + 1];
        var viewTNode = view[T_HOST];
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
 * @param renderer A renderer to be used
 * @param rNode The native node that should be removed
 * @param isHostElement A flag indicating if a node to be removed is a host of a component.
 */
export function nativeRemoveNode(renderer, rNode, isHostElement) {
    var nativeParent = nativeParentNode(renderer, rNode);
    if (nativeParent) {
        nativeRemoveChild(renderer, nativeParent, rNode, isHostElement);
    }
}
/**
 * Appends nodes to a target projection place. Nodes to insert were previously re-distribution and
 * stored on a component host level.
 * @param lView A LView where nodes are inserted (target VLview)
 * @param tProjectionNode A projection node where previously re-distribution should be appended
 * (target insertion place)
 * @param selectorIndex A bucket from where nodes to project should be taken
 * @param componentView A where projectable nodes were initially created (source view)
 */
export function appendProjectedNodes(lView, tProjectionNode, selectorIndex, componentView) {
    var projectedView = componentView[PARENT];
    var componentNode = componentView[T_HOST];
    var nodeToProject = componentNode.projection[selectorIndex];
    if (Array.isArray(nodeToProject)) {
        appendChild(nodeToProject, tProjectionNode, lView);
    }
    else {
        while (nodeToProject) {
            if (nodeToProject.type === 1 /* Projection */) {
                appendProjectedNodes(lView, tProjectionNode, nodeToProject.projection, findComponentView(projectedView));
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
 * @param projectedTNode The TNode to be projected
 * @param tProjectionNode The projection (ng-content) TNode
 * @param currentView Current LView
 * @param projectionView Projection view (view above current)
 */
function appendProjectedNode(projectedTNode, tProjectionNode, currentView, projectionView) {
    var native = getNativeByTNode(projectedTNode, projectionView);
    appendChild(native, tProjectionNode, currentView);
    // the projected contents are processed while in the shadow view (which is the currentView)
    // therefore we need to extract the view where the host element lives since it's the
    // logical container of the content projected views
    attachPatchData(native, projectionView);
    var nodeOrContainer = projectionView[projectedTNode.index];
    if (projectedTNode.type === 0 /* Container */) {
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        var views = nodeOrContainer[VIEWS];
        for (var i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(views[i], true, nodeOrContainer[NATIVE]);
        }
    }
    else {
        if (projectedTNode.type === 4 /* ElementContainer */) {
            var ngContainerChildTNode = projectedTNode.child;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFhLE1BQU0sRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0csT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUF5RSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuSixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUErQixJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoSCxJQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFFaEYsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFnQixFQUFFLFlBQW1CO0lBQ2pFLFNBQVMsSUFBSSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDdkMsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBZSxDQUFDO0lBQ3JELElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtRQUN0QixpRUFBaUU7UUFDakUsZ0ZBQWdGO1FBQ2hGLE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUNuRDtTQUFNO1FBQ0wsU0FBUyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLHNEQUFzRDtRQUN0RCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtBQUNILENBQUM7QUFHRDs7O0dBR0c7QUFDSCxTQUFTLHdCQUF3QixDQUFDLFNBQW9CLEVBQUUsSUFBVztJQUNqRSxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pELE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNoRixDQUFDO0FBY0Q7Ozs7OztHQU1HO0FBQ0gsSUFBTSxtQkFBbUIsR0FBc0IsRUFBRSxDQUFDO0FBRWxEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsU0FBUyxhQUFhLENBQ2xCLFVBQWlCLEVBQUUsTUFBMkIsRUFBRSxRQUFtQixFQUNuRSxZQUE2QixFQUFFLFVBQXlCOztJQUMxRCxJQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBaUIsQ0FBQztJQUN0RCxJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdCLElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQztJQUM3QixJQUFJLEtBQUssR0FBZSxTQUFTLENBQUMsS0FBYyxDQUFDO0lBQ2pELE9BQU8sS0FBSyxFQUFFO1FBQ1osSUFBSSxTQUFTLEdBQWUsSUFBSSxDQUFDO1FBQ2pDLElBQUksS0FBSyxDQUFDLElBQUksb0JBQXNCLEVBQUU7WUFDcEMsaUJBQWlCLENBQ2IsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM3RixJQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pELElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFO2dCQUNqQyxzRUFBc0U7Z0JBQ3RFLGlCQUFpQixDQUNiLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7YUFDakY7U0FDRjthQUFNLElBQUksS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7WUFDN0MsSUFBTSxVQUFVLEdBQUcsV0FBYSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQWUsQ0FBQztZQUM1RCxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRXpGLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRTtnQkFDNUIsV0FBVyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBRXBDLHlGQUF5RjtnQkFDekYsZ0JBQWdCO2dCQUNoQixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ2pDO1NBQ0Y7YUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixFQUFFO1lBQzlDLElBQU0sYUFBYSxHQUFHLGlCQUFpQixDQUFDLFdBQWEsQ0FBQyxDQUFDO1lBQ3ZELElBQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQWlCLENBQUM7WUFDNUQsSUFBTSxJQUFJLEdBQ0wsYUFBYSxDQUFDLFVBQThCLENBQUMsS0FBSyxDQUFDLFVBQW9CLENBQUMsQ0FBQztZQUU5RSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7O29CQUN2QixLQUF1QixJQUFBLFNBQUEsaUJBQUEsSUFBSSxDQUFBLDBCQUFBLDRDQUFFO3dCQUF4QixJQUFJLFVBQVUsaUJBQUE7d0JBQ2pCLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7cUJBQ2xGOzs7Ozs7Ozs7YUFDRjtpQkFBTTtnQkFDTCxzRkFBc0Y7Z0JBQ3RGLHVGQUF1RjtnQkFDdkYsUUFBUTtnQkFDUixtQkFBbUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsS0FBSyxDQUFDO2dCQUNuRCxtQkFBbUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsV0FBYSxDQUFDO2dCQUMzRCxJQUFJLElBQUksRUFBRTtvQkFDUixXQUFXLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBVyxDQUFDO29CQUM5QyxTQUFTLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFVLENBQUM7aUJBQzFEO2FBQ0Y7U0FFRjthQUFNO1lBQ0wsbURBQW1EO1lBQ25ELFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1NBQ3pCO1FBRUQsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3RCLGdGQUFnRjtZQUNoRixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssc0JBQXlCLENBQUMsRUFBRTtnQkFDakUsV0FBVyxHQUFHLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLENBQVUsQ0FBQztnQkFDbEUsS0FBSyxHQUFHLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLENBQVUsQ0FBQzthQUM3RDtZQUNELFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBRXZCOzs7Ozs7ZUFNRztZQUNILE9BQU8sQ0FBQyxTQUFTLEVBQUU7Z0JBQ2pCLHdGQUF3RjtnQkFDeEYsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUU1QyxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVM7b0JBQUUsT0FBTyxJQUFJLENBQUM7Z0JBRXZELGtGQUFrRjtnQkFDbEYsSUFBSSxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtvQkFDdEMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUcsQ0FBQztvQkFDNUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQy9DO2dCQUVELElBQUksS0FBSyxDQUFDLElBQUksaUJBQW1CLEVBQUU7b0JBQ2pDOzs7Ozs7dUJBTUc7b0JBQ0gsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDO3dCQUN6QyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUMzQyxJQUFJLEtBQUssS0FBSyxTQUFTOzRCQUFFLE9BQU8sSUFBSSxDQUFDO3dCQUNyQyxXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBVSxDQUFDO3dCQUMzQyxLQUFLLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBRyxDQUFDO3FCQUMvQjtvQkFDRCxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDckIsV0FBVyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQVUsQ0FBQzt3QkFDekMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztxQkFDakM7eUJBQU07d0JBQ0wsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7cUJBQ3hCO2lCQUNGO3FCQUFNO29CQUNMLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2lCQUN4QjthQUNGO1NBQ0Y7UUFDRCxLQUFLLEdBQUcsU0FBUyxDQUFDO0tBQ25CO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsaUJBQWlCLENBQ3RCLE1BQTJCLEVBQUUsUUFBbUIsRUFBRSxNQUF1QixFQUFFLElBQVcsRUFDdEYsS0FBWSxFQUFFLFVBQXlCO0lBQ3pDLElBQUksTUFBTSxtQkFBK0IsRUFBRTtRQUN6QyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsTUFBUSxFQUFFLElBQUksRUFBRSxVQUFVLElBQUksSUFBSSxDQUFDLENBQUM7S0FDbEU7U0FBTSxJQUFJLE1BQU0sbUJBQStCLEVBQUU7UUFDaEQsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUN0RDtTQUFNLElBQUksTUFBTSxvQkFBZ0MsRUFBRTtRQUNqRCxTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDNUMsUUFBZ0MsQ0FBQyxXQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkQ7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFVLEVBQUUsUUFBbUI7SUFDNUQsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLFFBQVEsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDMUYsQ0FBQztBQWdCRCxNQUFNLFVBQVUsMEJBQTBCLENBQ3RDLFVBQWlCLEVBQUUsVUFBbUIsRUFBRSxVQUF5QjtJQUNuRSxJQUFNLFlBQVksR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBaUIsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMvRixTQUFTLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFhLGVBQWlCLENBQUM7SUFDN0UsSUFBSSxZQUFZLEVBQUU7UUFDaEIsSUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLGFBQWEsQ0FDVCxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUMsZ0JBQTRCLENBQUMsZUFBMkIsRUFBRSxRQUFRLEVBQzFGLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztLQUMvQjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUFDLFFBQWU7SUFDN0Msb0VBQW9FO0lBQ3BFLElBQUksaUJBQWlCLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzdDLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtRQUN0QixPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM5QjtJQUVELE9BQU8saUJBQWlCLEVBQUU7UUFDeEIsSUFBSSxJQUFJLEdBQTBCLElBQUksQ0FBQztRQUV2QyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO1lBQzlCLG9DQUFvQztZQUNwQyxJQUFJLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDdEM7YUFBTTtZQUNMLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2pELGtEQUFrRDtZQUNsRCxJQUFNLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQVksQ0FBQztZQUNsRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZDO1FBRUQsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULHFFQUFxRTtZQUNyRSxnREFBZ0Q7WUFDaEQsT0FBTyxpQkFBaUIsSUFBSSxDQUFDLGlCQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixLQUFLLFFBQVEsRUFBRTtnQkFDeEYsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQy9CLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNqRTtZQUNELFdBQVcsQ0FBQyxpQkFBaUIsSUFBSSxRQUFRLENBQUMsQ0FBQztZQUMzQyxJQUFJLEdBQUcsaUJBQWlCLElBQUksaUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkQ7UUFDRCxpQkFBaUIsR0FBRyxJQUFJLENBQUM7S0FDMUI7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLEtBQVksRUFBRSxVQUFzQixFQUFFLEtBQWE7SUFDNUUsU0FBUyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyxTQUFTLElBQUksZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUMsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFDL0QsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQ2IseURBQXlEO1FBQ3pELEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQ2hDO0lBRUQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMvQjtTQUFNO1FBQ0wsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQ3BCO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQztJQUUzQiw4Q0FBOEM7SUFDOUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDbEIsS0FBSyxDQUFDLE9BQU8sQ0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNwQztJQUVELHlCQUF5QjtJQUN6QixLQUFLLENBQUMsS0FBSyxDQUFDLHNCQUF1QixDQUFDO0FBQ3RDLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLFVBQXNCLEVBQUUsV0FBbUI7SUFDcEUsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLElBQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN4QyxJQUFJLFdBQVcsR0FBRyxDQUFDLEVBQUU7UUFDbkIsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFVLENBQUM7S0FDNUQ7SUFDRCxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM3QiwwQkFBMEIsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFaEQsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDekIsWUFBWSxDQUFDLE9BQU8sQ0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ3RDO0lBQ0QsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztJQUM1QixZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQzFCLDJCQUEyQjtJQUMzQixZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksbUJBQW9CLENBQUM7SUFDNUMsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FBQyxVQUFzQixFQUFFLFdBQW1CO0lBQ3BFLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM1QyxVQUFVLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3BDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQVc7SUFDdEMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBdUIsQ0FBQyxFQUFFO1FBQ3pDLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUU7WUFDMUQsYUFBYSxDQUFDLElBQUksbUJBQStCLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNsRTtRQUVELGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN2QjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsaUJBQXFDLEVBQUUsUUFBZTtJQUVuRixJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakUsS0FBSyxDQUFDLElBQUksaUJBQW1CLEVBQUU7UUFDakMsbUZBQW1GO1FBQ25GLHVCQUF1QjtRQUN2QixPQUFPLGFBQWEsQ0FBQyxLQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUM7S0FDN0Q7U0FBTTtRQUNMLCtEQUErRDtRQUMvRCxPQUFPLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNsRjtBQUNILENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLFdBQVcsQ0FBQyxlQUFtQztJQUN0RCxJQUFLLGVBQXlCLENBQUMsTUFBTSxJQUFJLGFBQWEsRUFBRTtRQUN0RCxJQUFNLElBQUksR0FBRyxlQUF3QixDQUFDO1FBRXRDLDBGQUEwRjtRQUMxRix5RkFBeUY7UUFDekYsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLG1CQUFvQixDQUFDO1FBRXBDLHdGQUF3RjtRQUN4Riw2RkFBNkY7UUFDN0YsNkZBQTZGO1FBQzdGLDBGQUEwRjtRQUMxRiwrREFBK0Q7UUFDL0QsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBd0IsQ0FBQztRQUVwQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEIsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLDhFQUE4RTtRQUM5RSxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxvQkFBc0IsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtZQUM3RixTQUFTLElBQUksU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLENBQXlCLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbkQ7S0FDRjtBQUNILENBQUM7QUFFRCxtRUFBbUU7QUFDbkUsU0FBUyxlQUFlLENBQUMsS0FBWTtJQUNuQyxJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBUyxDQUFDO0lBQ3hDLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtRQUNwQixJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFHLENBQUM7UUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDL0MsSUFBSSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7Z0JBQ25DLDhDQUE4QztnQkFDOUMsSUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxJQUFNLE1BQU0sR0FBRyxPQUFPLGlCQUFpQixLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUNwRCxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMxQixXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDMUMsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsSUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLE9BQU8sa0JBQWtCLEtBQUssU0FBUyxFQUFFO29CQUMzQyxlQUFlO29CQUNmLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7aUJBQ3ZFO3FCQUFNO29CQUNMLElBQUksa0JBQWtCLElBQUksQ0FBQyxFQUFFO3dCQUMzQixhQUFhO3dCQUNiLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7cUJBQ2hDO3lCQUFNO3dCQUNMLGVBQWU7d0JBQ2YsUUFBUSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztxQkFDN0M7aUJBQ0Y7Z0JBQ0QsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNSO2lCQUFNLElBQUksT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUMxQyx1RUFBdUU7Z0JBQ3ZFLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsU0FBUyxFQUFFLENBQUM7YUFDYjtpQkFBTTtnQkFDTCwyRUFBMkU7Z0JBQzNFLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDM0I7U0FDRjtRQUNELEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDdkI7QUFDSCxDQUFDO0FBRUQsMENBQTBDO0FBQzFDLFNBQVMsaUJBQWlCLENBQUMsSUFBVztJQUNwQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsSUFBSSxZQUEyQixDQUFDO0lBRWhDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxFQUFFO1FBQ2hFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDL0MsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDO1lBRWhELGdFQUFnRTtZQUNoRSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksbUJBQW1CLENBQUMsRUFBRTtnQkFDNUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDbEQ7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsU0FBUyxlQUFlLENBQUMsS0FBWSxFQUFFLFdBQWtCO0lBQ3ZELHNEQUFzRDtJQUN0RCxJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUMzQixPQUFPLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztLQUN0RjtJQUVELHNGQUFzRjtJQUN0RixvQ0FBb0M7SUFDcEMsSUFBTSxNQUFNLEdBQUcsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBRTdELCtGQUErRjtJQUMvRixrQkFBa0I7SUFDbEIsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO1FBQ2xCLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUcsQ0FBQztRQUN4QyxJQUFJLFNBQVMsQ0FBQyxJQUFJLGlCQUFtQixFQUFFO1lBQ3JDLDJGQUEyRjtZQUMzRixnRkFBZ0Y7WUFDaEYsbUZBQW1GO1lBQ25GLDRGQUE0RjtZQUM1Rix1RkFBdUY7WUFDdkYseUZBQXlGO1lBQ3pGLHVFQUF1RTtZQUN2RSxPQUFPLHdCQUF3QixDQUFDLFNBQXNCLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDdEU7YUFBTTtZQUNMLDRGQUE0RjtZQUM1Riw2QkFBNkI7WUFDN0IsT0FBTyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbkM7S0FDRjtTQUFNO1FBQ0wsU0FBUyxJQUFJLGNBQWMsQ0FBQyxNQUFNLGtCQUFvQixDQUFDO1FBQ3ZELElBQUksTUFBTSxDQUFDLEtBQUssc0JBQXlCLEVBQUU7WUFDekMsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztZQUN0QyxJQUFNLE9BQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBVSxDQUFDO1lBQzNDLElBQU0sYUFBYSxHQUFJLEtBQUssQ0FBQyxPQUFLLENBQUMsY0FBYyxDQUF1QixDQUFDLGFBQWEsQ0FBQztZQUV2Riw0RkFBNEY7WUFDNUYsNEZBQTRGO1lBQzVGLHVGQUF1RjtZQUN2Rix1RkFBdUY7WUFDdkYsNkZBQTZGO1lBQzdGLDRFQUE0RTtZQUM1RSxJQUFJLGFBQWEsS0FBSyxpQkFBaUIsQ0FBQyxTQUFTO2dCQUM3QyxhQUFhLEtBQUssaUJBQWlCLENBQUMsTUFBTSxFQUFFO2dCQUM5QyxPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7UUFFRCxPQUFPLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxXQUFXLENBQWEsQ0FBQztLQUMxRDtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGFBQWEsQ0FBQyxXQUFrQjtJQUN2QyxTQUFTLElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxPQUFPLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxvQkFBc0IsQ0FBQyxDQUFDO1FBQ3JELGdCQUFnQixDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsV0FBVyxDQUFHLENBQWMsQ0FBQyxDQUFDO1FBQzFFLElBQUksQ0FBQztBQUNYLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBWSxFQUFFLFVBQXdCO0lBQy9FLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ2xEO1NBQU07UUFDTCxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDOUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBWTtJQUM1RSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3JDO1NBQU07UUFDTCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzNCO0FBQ0gsQ0FBQztBQUVELFNBQVMsMEJBQTBCLENBQy9CLFFBQW1CLEVBQUUsTUFBZ0IsRUFBRSxLQUFZLEVBQUUsVUFBd0I7SUFDL0UsSUFBSSxVQUFVLEVBQUU7UUFDZCxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN6RDtTQUFNO1FBQ0wsaUJBQWlCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUFFRCwyREFBMkQ7QUFDM0QsU0FBUyxpQkFBaUIsQ0FDdEIsUUFBbUIsRUFBRSxNQUFnQixFQUFFLEtBQVksRUFBRSxhQUF1QjtJQUM5RSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNwRDtTQUFNO1FBQ0wsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMzQjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxRQUFtQixFQUFFLElBQVc7SUFDL0QsT0FBTyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFhLENBQUM7QUFDcEcsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFFBQW1CLEVBQUUsSUFBVztJQUNoRSxPQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3hGLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsbUJBQW1CLENBQUMsV0FBa0IsRUFBRSxLQUFZO0lBQzNELElBQUksV0FBVyxDQUFDLElBQUksaUJBQW1CLEVBQUU7UUFDdkMsSUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLFdBQXdCLEVBQUUsS0FBSyxDQUFHLENBQUM7UUFDcEUsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsT0FBTyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQy9EO1NBQU0sSUFDSCxXQUFXLENBQUMsSUFBSSw2QkFBK0I7UUFDL0MsV0FBVyxDQUFDLElBQUkseUJBQTJCLEVBQUU7UUFDL0MsT0FBTyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDN0M7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQXdCLEVBQUUsVUFBaUIsRUFBRSxXQUFrQjs7SUFDekYsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM5RCxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUU7UUFDeEIsSUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLElBQU0sV0FBVyxHQUFVLFVBQVUsQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBRyxDQUFDO1FBQ3RFLElBQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNqRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7O2dCQUMxQixLQUF1QixJQUFBLFlBQUEsaUJBQUEsT0FBTyxDQUFBLGdDQUFBLHFEQUFFO29CQUEzQixJQUFJLFVBQVUsb0JBQUE7b0JBQ2pCLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2lCQUM1RTs7Ozs7Ozs7O1NBQ0Y7YUFBTTtZQUNMLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3pFO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLCtCQUErQixDQUFDLEtBQVk7SUFDbkQsT0FBTyxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSw2QkFBK0I7UUFDaEQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLHlCQUEyQixDQUFDLEVBQUU7UUFDN0UsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7S0FDdEI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsS0FBYSxFQUFFLEtBQWMsRUFBRSxlQUF5QjtJQUMzRixJQUFJLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUM1QixJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBVSxDQUFDO1FBQ3ZDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQWMsQ0FBQztRQUM1QyxPQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztLQUNwRjtTQUFNO1FBQ0wsT0FBTyxlQUFlLENBQUM7S0FDeEI7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsUUFBbUIsRUFBRSxLQUFZLEVBQUUsYUFBdUI7SUFDekYsSUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3ZELElBQUksWUFBWSxFQUFFO1FBQ2hCLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQ2pFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxLQUFZLEVBQUUsZUFBZ0MsRUFBRSxhQUFxQixFQUNyRSxhQUFvQjtJQUN0QixJQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFXLENBQUM7SUFDdEQsSUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBaUIsQ0FBQztJQUM1RCxJQUFJLGFBQWEsR0FBSSxhQUFhLENBQUMsVUFBOEIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUVqRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7UUFDaEMsV0FBVyxDQUFDLGFBQWEsRUFBRSxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDcEQ7U0FBTTtRQUNMLE9BQU8sYUFBYSxFQUFFO1lBQ3BCLElBQUksYUFBYSxDQUFDLElBQUksdUJBQXlCLEVBQUU7Z0JBQy9DLG9CQUFvQixDQUNoQixLQUFLLEVBQUUsZUFBZSxFQUFHLGFBQWlDLENBQUMsVUFBVSxFQUNyRSxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2FBQ3ZDO2lCQUFNO2dCQUNMLHlFQUF5RTtnQkFDekUsb0RBQW9EO2dCQUNwRCxhQUFhLENBQUMsS0FBSyx1QkFBMEIsQ0FBQztnQkFDOUMsbUJBQW1CLENBQUMsYUFBYSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDM0U7WUFDRCxhQUFhLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQztTQUNwQztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxtQkFBbUIsQ0FDeEIsY0FBcUIsRUFBRSxlQUFzQixFQUFFLFdBQWtCLEVBQ2pFLGNBQXFCO0lBQ3ZCLElBQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNoRSxXQUFXLENBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVsRCwyRkFBMkY7SUFDM0Ysb0ZBQW9GO0lBQ3BGLG1EQUFtRDtJQUNuRCxlQUFlLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBRXhDLElBQU0sZUFBZSxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0QsSUFBSSxjQUFjLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUMvQyxpRkFBaUY7UUFDakYsOENBQThDO1FBQzlDLCtFQUErRTtRQUMvRSwrREFBK0Q7UUFDL0QsdURBQXVEO1FBQ3ZELElBQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1NBQ3JFO0tBQ0Y7U0FBTTtRQUNMLElBQUksY0FBYyxDQUFDLElBQUksNkJBQStCLEVBQUU7WUFDdEQsSUFBSSxxQkFBcUIsR0FBZSxjQUFjLENBQUMsS0FBYyxDQUFDO1lBQ3RFLE9BQU8scUJBQXFCLEVBQUU7Z0JBQzVCLG1CQUFtQixDQUFDLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBQ3pGLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQzthQUNwRDtTQUNGO1FBRUQsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDakMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDcEU7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFLCBWSUVXUywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NISUxEX0hFQUQsIENMRUFOVVAsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1QsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXcsIGdldExWaWV3UGFyZW50fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3LCB1bndyYXBSTm9kZX0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TENvbnRhaW5lcih0Tm9kZTogVFZpZXdOb2RlLCBlbWJlZGRlZFZpZXc6IExWaWV3KTogTENvbnRhaW5lcnxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGVtYmVkZGVkVmlldyk7XG4gIGNvbnN0IGNvbnRhaW5lciA9IGVtYmVkZGVkVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gIGlmICh0Tm9kZS5pbmRleCA9PT0gLTEpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IGluc2lkZSBhIGR5bmFtaWMgY29udGFpbmVyLlxuICAgIC8vIFRoZSBwYXJlbnQgaXNuJ3QgYW4gTENvbnRhaW5lciBpZiB0aGUgZW1iZWRkZWQgdmlldyBoYXNuJ3QgYmVlbiBhdHRhY2hlZCB5ZXQuXG4gICAgcmV0dXJuIGlzTENvbnRhaW5lcihjb250YWluZXIpID8gY29udGFpbmVyIDogbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihjb250YWluZXIpO1xuICAgIC8vIFRoaXMgaXMgYSBpbmxpbmUgdmlldyBub2RlIChlLmcuIGVtYmVkZGVkVmlld1N0YXJ0KVxuICAgIHJldHVybiBjb250YWluZXI7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJldHJpZXZlcyByZW5kZXIgcGFyZW50IGZvciBhIGdpdmVuIHZpZXcuXG4gKiBNaWdodCBiZSBudWxsIGlmIGEgdmlldyBpcyBub3QgeWV0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRhaW5lclJlbmRlclBhcmVudCh0Vmlld05vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0TENvbnRhaW5lcih0Vmlld05vZGUsIHZpZXcpO1xuICByZXR1cm4gY29udGFpbmVyID8gbmF0aXZlUGFyZW50Tm9kZSh2aWV3W1JFTkRFUkVSXSwgY29udGFpbmVyW05BVElWRV0pIDogbnVsbDtcbn1cblxuY29uc3QgZW51bSBXYWxrVE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgaW5zZXJ0IGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgSW5zZXJ0ID0gMCxcblxuICAvKiogbm9kZSBkZXRhY2ggZnJvbSB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIERldGFjaCA9IDEsXG5cbiAgLyoqIG5vZGUgZGVzdHJ1Y3Rpb24gdXNpbmcgdGhlIHJlbmRlcmVyJ3MgQVBJICovXG4gIERlc3Ryb3kgPSAyLFxufVxuXG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gd2Fsa1ROb2RlVHJlZS5cbiAqXG4gKiBUaGlzIGlzIGRlbGliZXJhdGVseSBjcmVhdGVkIG91dHNpZGUgb2Ygd2Fsa1ROb2RlVHJlZSB0byBhdm9pZCBhbGxvY2F0aW5nXG4gKiBhIG5ldyBhcnJheSBlYWNoIHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gSW5zdGVhZCB0aGUgYXJyYXkgd2lsbCBiZVxuICogcmUtdXNlZCBieSBlYWNoIGludm9jYXRpb24uIFRoaXMgd29ya3MgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgbm90IHJlZW50cmFudC5cbiAqL1xuY29uc3QgcHJvamVjdGlvbk5vZGVTdGFjazogKExWaWV3IHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgVE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBlbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgdGhlIHZpZXcgdG8gd2Fsa1xuICogQHBhcmFtIGFjdGlvbiBpZGVudGlmaWVzIHRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBlbGVtZW50c1xuICogQHBhcmFtIHJlbmRlcmVyIHRoZSBjdXJyZW50IHJlbmRlcmVyLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCBPcHRpb25hbCB0aGUgcmVuZGVyIHBhcmVudCBub2RlIHRvIGJlIHNldCBpbiBhbGwgTENvbnRhaW5lcnMgZm91bmQsXG4gKiByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIEluc2VydCBhbmQgRGVzdHJveS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIEluc2VydC5cbiAqL1xuZnVuY3Rpb24gd2Fsa1ROb2RlVHJlZShcbiAgICB2aWV3VG9XYWxrOiBMVmlldywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHJlbmRlclBhcmVudDogUkVsZW1lbnQgfCBudWxsLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuICBsZXQgY3VycmVudFZpZXcgPSB2aWV3VG9XYWxrO1xuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSByb290VE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGxldCBuZXh0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBjdXJyZW50VmlldyksIHROb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XTtcbiAgICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgICAvLyBUaGlzIGVsZW1lbnQgaGFzIGFuIExDb250YWluZXIsIGFuZCBpdHMgY29tbWVudCBuZWVkcyB0byBiZSBoYW5kbGVkXG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBub2RlT3JDb250YWluZXJbTkFUSVZFXSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lciA9IGN1cnJlbnRWaWV3ICFbdE5vZGUuaW5kZXhdIGFzIExDb250YWluZXI7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGxDb250YWluZXJbTkFUSVZFXSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuXG4gICAgICBpZiAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICAgIGN1cnJlbnRWaWV3ID0gbENvbnRhaW5lcltWSUVXU11bMF07XG4gICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5ub2RlO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHdhbGtlciBlbnRlcnMgYSBjb250YWluZXIsIHRoZW4gdGhlIGJlZm9yZU5vZGUgaGFzIHRvIGJlY29tZSB0aGUgbG9jYWwgbmF0aXZlXG4gICAgICAgIC8vIGNvbW1lbnQgbm9kZS5cbiAgICAgICAgYmVmb3JlTm9kZSA9IGxDb250YWluZXJbTkFUSVZFXTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoY3VycmVudFZpZXcgISk7XG4gICAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IGhlYWQ6IFROb2RlfG51bGwgPVxuICAgICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGhlYWQpKSB7XG4gICAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgaGVhZCkge1xuICAgICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbmF0aXZlTm9kZSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBNdXN0IHN0b3JlIGJvdGggdGhlIFROb2RlIGFuZCB0aGUgdmlldyBiZWNhdXNlIHRoaXMgcHJvamVjdGlvbiBub2RlIGNvdWxkIGJlIG5lc3RlZFxuICAgICAgICAvLyBkZWVwbHkgaW5zaWRlIGVtYmVkZGVkIHZpZXdzLCBhbmQgd2UgbmVlZCB0byBnZXQgYmFjayBkb3duIHRvIHRoaXMgcGFydGljdWxhciBuZXN0ZWRcbiAgICAgICAgLy8gdmlldy5cbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gdE5vZGU7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IGN1cnJlbnRWaWV3ICE7XG4gICAgICAgIGlmIChoZWFkKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gIWFzIExWaWV3O1xuICAgICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhW2hlYWQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGEgVmlldyBvciBhbiBFbGVtZW50Q29udGFpbmVyXG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5jaGlsZDtcbiAgICB9XG5cbiAgICBpZiAobmV4dFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKHROb2RlLm5leHQgPT09IG51bGwgJiYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXc7XG4gICAgICAgIHROb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIFROb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICAgICAgICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gICAgICAgKlxuICAgICAgICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGVuIGl0IGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAgICAgICAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICAgICAgICovXG4gICAgICB3aGlsZSAoIW5leHRUTm9kZSkge1xuICAgICAgICAvLyBJZiBwYXJlbnQgaXMgbnVsbCwgd2UncmUgY3Jvc3NpbmcgdGhlIHZpZXcgYm91bmRhcnksIHNvIHdlIHNob3VsZCBnZXQgdGhlIGhvc3QgVE5vZGUuXG4gICAgICAgIHROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W1RfSE9TVF07XG5cbiAgICAgICAgaWYgKHROb2RlID09PSBudWxsIHx8IHROb2RlID09PSByb290VE5vZGUpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIFdoZW4gZXhpdGluZyBhIGNvbnRhaW5lciwgdGhlIGJlZm9yZU5vZGUgbXVzdCBiZSByZXN0b3JlZCB0byB0aGUgcHJldmlvdXMgdmFsdWVcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGdldExWaWV3UGFyZW50KGN1cnJlbnRWaWV3KSAhO1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF1bTkFUSVZFXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIElmIGN1cnJlbnQgbFZpZXcgZG9lc24ndCBoYXZlIG5leHQgcG9pbnRlciwgd2UgdHJ5IHRvIGZpbmQgaXQgYnkgZ29pbmcgdXAgcGFyZW50c1xuICAgICAgICAgICAqIGNoYWluIHVudGlsOlxuICAgICAgICAgICAqIC0gd2UgZmluZCBhbiBsVmlldyB3aXRoIGEgbmV4dCBwb2ludGVyXG4gICAgICAgICAgICogLSBvciBmaW5kIGEgdE5vZGUgd2l0aCBhIHBhcmVudCB0aGF0IGhhcyBhIG5leHQgcG9pbnRlclxuICAgICAgICAgICAqIC0gb3IgcmVhY2ggcm9vdCBUTm9kZSAoaW4gd2hpY2ggY2FzZSB3ZSBleGl0LCBzaW5jZSB3ZSB0cmF2ZXJzZWQgYWxsIG5vZGVzKVxuICAgICAgICAgICAqL1xuICAgICAgICAgIHdoaWxlICghY3VycmVudFZpZXdbTkVYVF0gJiYgY3VycmVudFZpZXdbUEFSRU5UXSAmJlxuICAgICAgICAgICAgICAgICAhKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQubmV4dCkpIHtcbiAgICAgICAgICAgIGlmICh0Tm9kZSA9PT0gcm9vdFROb2RlKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSBhcyBMVmlldztcbiAgICAgICAgICAgIHROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY3VycmVudFZpZXdbTkVYVF0pIHtcbiAgICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbTkVYVF0gYXMgTFZpZXc7XG4gICAgICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gbmV4dFROb2RlO1xuICB9XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLCBub2RlOiBSTm9kZSxcbiAgICB0Tm9kZTogVE5vZGUsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCAhLCBub2RlLCBiZWZvcmVOb2RlIHx8IG51bGwpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCBub2RlLCBpc0NvbXBvbmVudCh0Tm9kZSkpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGxldCBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3W0NISUxEX0hFQURdO1xuICBpZiAoIWxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuXG4gIHdoaWxlIChsVmlld09yTENvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAvLyBJZiBMVmlldywgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lcltDSElMRF9IRUFEXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IHZpZXdzID0gbFZpZXdPckxDb250YWluZXJbVklFV1NdIGFzIExWaWV3W107XG4gICAgICBpZiAodmlld3MubGVuZ3RoID4gMCkgbmV4dCA9IHZpZXdzWzBdO1xuICAgIH1cblxuICAgIGlmICghbmV4dCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlIChsVmlld09yTENvbnRhaW5lciAmJiAhbFZpZXdPckxDb250YWluZXIgIVtORVhUXSAmJiBsVmlld09yTENvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgICBsVmlld09yTENvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKGxWaWV3T3JMQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXIgJiYgbFZpZXdPckxDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgbFZpZXdPckxDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBpbmRleCBXaGljaCBpbmRleCBpbiB0aGUgY29udGFpbmVyIHRvIGluc2VydCB0aGUgY2hpbGQgdmlldyBpbnRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KGxWaWV3OiBMVmlldywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld3MsICdDb250YWluZXIgbXVzdCBoYXZlIHZpZXdzJyk7XG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgRGV0YWNoZWQgTFZpZXcgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXc7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld1RvRGV0YWNoLCBmYWxzZSk7XG5cbiAgaWYgKHZpZXdUb0RldGFjaFtRVUVSSUVTXSkge1xuICAgIHZpZXdUb0RldGFjaFtRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gIHZpZXdUb0RldGFjaFtORVhUXSA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICByZXR1cm4gdmlld1RvRGV0YWNoO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmlldyA9IGxDb250YWluZXJbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRlc3Ryb3lMVmlldyh2aWV3KTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlldykge1xuICBpZiAoISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgd2Fsa1ROb2RlVHJlZSh2aWV3LCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG5cbiAgICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUobFZpZXdPckxDb250YWluZXI6IExWaWV3IHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3KTogTFZpZXd8XG4gICAgTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IHROb2RlO1xuICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikgJiYgKHROb2RlID0gbFZpZXdPckxDb250YWluZXJbVF9IT1NUXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRMQ29udGFpbmVyKHROb2RlIGFzIFRWaWV3Tm9kZSwgbFZpZXdPckxDb250YWluZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgb25EZXN0cm95cyBob29rcyBmb3IgYWxsIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGluIGEgZ2l2ZW4gdmlldyBhbmQgdGhlbiByZW1vdmVzIGFsbFxuICogbGlzdGVuZXJzLiBMaXN0ZW5lcnMgYXJlIHJlbW92ZWQgYXMgdGhlIGxhc3Qgc3RlcCBzbyBldmVudHMgZGVsaXZlcmVkIGluIHRoZSBvbkRlc3Ryb3lzIGhvb2tzXG4gKiBjYW4gYmUgcHJvcGFnYXRlZCB0byBAT3V0cHV0IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlldyB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKCh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlldztcblxuICAgIC8vIFVzdWFsbHkgdGhlIEF0dGFjaGVkIGZsYWcgaXMgcmVtb3ZlZCB3aGVuIHRoZSB2aWV3IGlzIGRldGFjaGVkIGZyb20gaXRzIHBhcmVudCwgaG93ZXZlclxuICAgIC8vIGlmIGl0J3MgYSByb290IHZpZXcsIHRoZSBmbGFnIHdvbid0IGJlIHVuc2V0IGhlbmNlIHdoeSB3ZSdyZSBhbHNvIHJlbW92aW5nIG9uIGRlc3Ryb3kuXG4gICAgdmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgICAvLyBNYXJrIHRoZSBMVmlldyBhcyBkZXN0cm95ZWQgKmJlZm9yZSogZXhlY3V0aW5nIHRoZSBvbkRlc3Ryb3kgaG9va3MuIEFuIG9uRGVzdHJveSBob29rXG4gICAgLy8gcnVucyBhcmJpdHJhcnkgdXNlciBjb2RlLCB3aGljaCBjb3VsZCBpbmNsdWRlIGl0cyBvd24gYHZpZXdSZWYuZGVzdHJveSgpYCAob3Igc2ltaWxhcikuIElmXG4gICAgLy8gV2UgZG9uJ3QgZmxhZyB0aGUgdmlldyBhcyBkZXN0cm95ZWQgYmVmb3JlIHRoZSBob29rcywgdGhpcyBjb3VsZCBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgLy8gVGhpcyBhbHNvIGFsaWducyB3aXRoIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yLiBJdCBhbHNvIG1lYW5zIHRoYXQgdGhlIG9uRGVzdHJveSBob29rIGlzXG4gICAgLy8gcmVhbGx5IG1vcmUgb2YgYW4gXCJhZnRlckRlc3Ryb3lcIiBob29rIGlmIHlvdSB0aGluayBhYm91dCBpdC5cbiAgICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcblxuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSB2aWV3W1RfSE9TVF07XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0Q2xlYW51cCA9IGxWaWV3W1RWSUVXXS5jbGVhbnVwICE7XG4gIGlmICh0Q2xlYW51cCAhPSBudWxsKSB7XG4gICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IGlkeE9yVGFyZ2V0R2V0dGVyID0gdENsZWFudXBbaSArIDFdO1xuICAgICAgICBjb25zdCB0YXJnZXQgPSB0eXBlb2YgaWR4T3JUYXJnZXRHZXR0ZXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgaWR4T3JUYXJnZXRHZXR0ZXIobFZpZXcpIDpcbiAgICAgICAgICAgIHVud3JhcFJOb2RlKGxWaWV3W2lkeE9yVGFyZ2V0R2V0dGVyXSk7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gbENsZWFudXBbdENsZWFudXBbaSArIDJdXTtcbiAgICAgICAgY29uc3QgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gdENsZWFudXBbaSArIDNdO1xuICAgICAgICBpZiAodHlwZW9mIHVzZUNhcHR1cmVPclN1YklkeCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgLy8gRE9NIGxpc3RlbmVyXG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodENsZWFudXBbaV0sIGxpc3RlbmVyLCB1c2VDYXB0dXJlT3JTdWJJZHgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh1c2VDYXB0dXJlT3JTdWJJZHggPj0gMCkge1xuICAgICAgICAgICAgLy8gdW5yZWdpc3RlclxuICAgICAgICAgICAgbENsZWFudXBbdXNlQ2FwdHVyZU9yU3ViSWR4XSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTdWJzY3JpcHRpb25cbiAgICAgICAgICAgIGxDbGVhbnVwWy11c2VDYXB0dXJlT3JTdWJJZHhdLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSBsQ2xlYW51cFt0Q2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMV1dO1xuICAgICAgICB0Q2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3Ryb3lIb29rcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdbZGVzdHJveUhvb2tzW2ldIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgZGVzdHJveSBob29rIGlmIHRoZSBjb250ZXh0IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3JGYWN0b3J5KSkge1xuICAgICAgICAoZGVzdHJveUhvb2tzW2kgKyAxXSBhcygpID0+IHZvaWQpLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBlbGVtZW50IGlmIGEgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hZGUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgLy8gTm9kZXMgb2YgdGhlIHRvcC1tb3N0IHZpZXcgY2FuIGJlIGluc2VydGVkIGVhZ2VybHkuXG4gIGlmIChpc1Jvb3RWaWV3KGN1cnJlbnRWaWV3KSkge1xuICAgIHJldHVybiBuYXRpdmVQYXJlbnROb2RlKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpKTtcbiAgfVxuXG4gIC8vIFNraXAgb3ZlciBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVycyBhcyB0aG9zZSBhcmUgcmVwcmVzZW50ZWQgYnkgYSBjb21tZW50IG5vZGUgYW5kXG4gIC8vIGNhbid0IGJlIHVzZWQgYXMgYSByZW5kZXIgcGFyZW50LlxuICBjb25zdCBwYXJlbnQgPSBnZXRIaWdoZXN0RWxlbWVudE9ySUNVQ29udGFpbmVyKHROb2RlKS5wYXJlbnQ7XG5cbiAgLy8gSWYgdGhlIHBhcmVudCBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzOiBlaXRoZXIgaW50byBhbiBlbWJlZGRlZCB2aWV3IG9yIGFcbiAgLy8gY29tcG9uZW50IHZpZXcuXG4gIGlmIChwYXJlbnQgPT0gbnVsbCkge1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF0gITtcbiAgICBpZiAoaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGEgcm9vdCBlbGVtZW50IG9mIGFuIGVtYmVkZGVkIHZpZXcgV2UgbWlnaHQgZGVsYXkgaW5zZXJ0aW9uIG9mIGNoaWxkcmVuXG4gICAgICAvLyBmb3IgYSBnaXZlbiB2aWV3IGlmIGl0IGlzIGRpc2Nvbm5lY3RlZC4gVGhpcyBtaWdodCBoYXBwZW4gZm9yIDIgbWFpbiByZWFzb25zOlxuICAgICAgLy8gLSB2aWV3IGlzIG5vdCBpbnNlcnRlZCBpbnRvIGFueSBjb250YWluZXIodmlldyB3YXMgY3JlYXRlZCBidXQgbm90IGluc2VydGVkIHlldClcbiAgICAgIC8vIC0gdmlldyBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGJ1dCB0aGUgY29udGFpbmVyIGl0c2VsZiBpcyBub3QgaW5zZXJ0ZWQgaW50byB0aGUgRE9NXG4gICAgICAvLyAoY29udGFpbmVyIG1pZ2h0IGJlIHBhcnQgb2YgcHJvamVjdGlvbiBvciBjaGlsZCBvZiBhIHZpZXcgdGhhdCBpcyBub3QgaW5zZXJ0ZWQgeWV0KS5cbiAgICAgIC8vIEluIG90aGVyIHdvcmRzIHdlIGNhbiBpbnNlcnQgY2hpbGRyZW4gb2YgYSBnaXZlbiB2aWV3IGlmIHRoaXMgdmlldyB3YXMgaW5zZXJ0ZWQgaW50byBhXG4gICAgICAvLyBjb250YWluZXIgYW5kIHRoZSBjb250YWluZXIgaXRzZWxmIGhhcyBpdHMgcmVuZGVyIHBhcmVudCBkZXRlcm1pbmVkLlxuICAgICAgcmV0dXJuIGdldENvbnRhaW5lclJlbmRlclBhcmVudChob3N0VE5vZGUgYXMgVFZpZXdOb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYW5kXG4gICAgICAvLyBpdCBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICAgICAgcmV0dXJuIGdldEhvc3ROYXRpdmUoY3VycmVudFZpZXcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgaWYgKHBhcmVudC5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IHREYXRhID0gY3VycmVudFZpZXdbVFZJRVddLmRhdGE7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW3BhcmVudC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICBjb25zdCBlbmNhcHN1bGF0aW9uID0gKHREYXRhW3ROb2RlLmRpcmVjdGl2ZVN0YXJ0XSBhcyBDb21wb25lbnREZWY8YW55PikuZW5jYXBzdWxhdGlvbjtcblxuICAgICAgLy8gV2UndmUgZ290IGEgcGFyZW50IHdoaWNoIGlzIGFuIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgdmlldy4gV2UganVzdCBuZWVkIHRvIHZlcmlmeSBpZiB0aGVcbiAgICAgIC8vIHBhcmVudCBlbGVtZW50IGlzIG5vdCBhIGNvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gICAgICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgICAgIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoZW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uIE5vdGUgdGhhdCB3ZSBjYW4ndFxuICAgICAgLy8gbWFrZSB0aGlzIGFzc3VtcHRpb24gd2hlbiB1c2luZyB0aGUgU2hhZG93IERPTSwgYmVjYXVzZSB0aGUgbmF0aXZlIHByb2plY3Rpb24gcGxhY2Vob2xkZXJzXG4gICAgICAvLyAoPGNvbnRlbnQ+IG9yIDxzbG90PikgaGF2ZSB0byBiZSBpbiBwbGFjZSBhcyBlbGVtZW50cyBhcmUgYmVpbmcgaW5zZXJ0ZWQuXG4gICAgICBpZiAoZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tICYmXG4gICAgICAgICAgZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uTmF0aXZlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudCwgY3VycmVudFZpZXcpIGFzIFJFbGVtZW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBmb3IgYSBnaXZlbiB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBjdXJyZW50IHZpZXcgZG9lcyBub3QgaGF2ZVxuICogYSBob3N0IGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGdldEhvc3ROYXRpdmUoY3VycmVudFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF07XG4gIHJldHVybiBob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID9cbiAgICAgIChnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgZ2V0TFZpZXdQYXJlbnQoY3VycmVudFZpZXcpICEpIGFzIFJFbGVtZW50KSA6XG4gICAgICBudWxsO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQgdXNpbmcge0BsaW5rIFJlbmRlcmVyM30uXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZCAtIGl0IGFic3RyYWN0cyBhblxuICogYWN0dWFsIHJlbmRlcmVyIGJlaW5nIHVzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUpOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudCwgY2hpbGQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGJlZm9yZU5vZGUpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICB9IGVsc2Uge1xuICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkKTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBhIG5vZGUgZnJvbSB0aGUgRE9NIGdpdmVuIGl0cyBuYXRpdmUgcGFyZW50LiAqL1xuZnVuY3Rpb24gbmF0aXZlUmVtb3ZlQ2hpbGQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50LCBjaGlsZCwgaXNIb3N0RWxlbWVudCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgcGFyZW50IG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUkVsZW1lbnR8bnVsbCB7XG4gIHJldHVybiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucGFyZW50Tm9kZShub2RlKSA6IG5vZGUucGFyZW50Tm9kZSkgYXMgUkVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBzaWJsaW5nIG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJOb2RlfG51bGwge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIubmV4dFNpYmxpbmcobm9kZSkgOiBub2RlLm5leHRTaWJsaW5nO1xufVxuXG4vKipcbiAqIEZpbmRzIGEgbmF0aXZlIFwiYW5jaG9yXCIgbm9kZSBmb3IgY2FzZXMgd2hlcmUgd2UgY2FuJ3QgYXBwZW5kIGEgbmF0aXZlIGNoaWxkIGRpcmVjdGx5XG4gKiAoYGFwcGVuZENoaWxkYCkgYW5kIG5lZWQgdG8gdXNlIGEgcmVmZXJlbmNlIChhbmNob3IpIG5vZGUgZm9yIHRoZSBgaW5zZXJ0QmVmb3JlYCBvcGVyYXRpb24uXG4gKiBAcGFyYW0gcGFyZW50VE5vZGVcbiAqIEBwYXJhbSBsVmlld1xuICovXG5mdW5jdGlvbiBnZXROYXRpdmVBbmNob3JOb2RlKHBhcmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGV8bnVsbCB7XG4gIGlmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHBhcmVudFROb2RlIGFzIFRWaWV3Tm9kZSwgbFZpZXcpICE7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YobFZpZXcpO1xuICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleCwgdmlld3MsIGxDb250YWluZXJbTkFUSVZFXSk7XG4gIH0gZWxzZSBpZiAoXG4gICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBsVmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBuYXRpdmUgbm9kZSAob3IgYSBjb2xsZWN0aW9uIG9mIG5vZGVzKSB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9LlxuICpcbiAqIEBwYXJhbSBjaGlsZEVsIFRoZSBuYXRpdmUgY2hpbGQgKG9yIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKGNoaWxkRWw6IFJOb2RlIHwgUk5vZGVbXSwgY2hpbGRUTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRSZW5kZXJQYXJlbnQoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpO1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBwYXJlbnRUTm9kZTogVE5vZGUgPSBjaGlsZFROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUX0hPU1RdICE7XG4gICAgY29uc3QgYW5jaG9yTm9kZSA9IGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZEVsKSkge1xuICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBjaGlsZEVsKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIG5hdGl2ZU5vZGUsIGFuY2hvck5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50LCBjaGlsZEVsLCBhbmNob3JOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSB0b3AtbGV2ZWwgZWxlbWVudCBvciBhbiBJQ1UgY29udGFpbmVyIGlmIHRob3NlIGNvbnRhaW5lcnMgYXJlIG5lc3RlZC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXJ0aW5nIFROb2RlIGZvciB3aGljaCB3ZSBzaG91bGQgc2tpcCBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVyc1xuICogQHJldHVybnMgVGhlIFROb2RlIG9mIHRoZSBoaWdoZXN0IGxldmVsIElDVSBjb250YWluZXIgb3IgZWxlbWVudCBjb250YWluZXJcbiAqL1xuZnVuY3Rpb24gZ2V0SGlnaGVzdEVsZW1lbnRPcklDVUNvbnRhaW5lcih0Tm9kZTogVE5vZGUpOiBUTm9kZSB7XG4gIHdoaWxlICh0Tm9kZS5wYXJlbnQgIT0gbnVsbCAmJiAodE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpKSB7XG4gICAgdE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXg6IG51bWJlciwgdmlld3M6IExWaWV3W10sIGNvbnRhaW5lck5hdGl2ZTogUkNvbW1lbnQpIHtcbiAgaWYgKGluZGV4ICsgMSA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3c1tpbmRleCArIDFdIGFzIExWaWV3O1xuICAgIGNvbnN0IHZpZXdUTm9kZSA9IHZpZXdbVF9IT1NUXSBhcyBUVmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdUTm9kZS5jaGlsZCA/IGdldE5hdGl2ZUJ5VE5vZGUodmlld1ROb2RlLmNoaWxkLCB2aWV3KSA6IGNvbnRhaW5lck5hdGl2ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29udGFpbmVyTmF0aXZlO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIG5hdGl2ZSBub2RlIGl0c2VsZiB1c2luZyBhIGdpdmVuIHJlbmRlcmVyLiBUbyByZW1vdmUgdGhlIG5vZGUgd2UgYXJlIGxvb2tpbmcgdXAgaXRzXG4gKiBwYXJlbnQgZnJvbSB0aGUgbmF0aXZlIHRyZWUgYXMgbm90IGFsbCBwbGF0Zm9ybXMgLyBicm93c2VycyBzdXBwb3J0IHRoZSBlcXVpdmFsZW50IG9mXG4gKiBub2RlLnJlbW92ZSgpLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIGJlIHVzZWRcbiAqIEBwYXJhbSByTm9kZSBUaGUgbmF0aXZlIG5vZGUgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGlzSG9zdEVsZW1lbnQgQSBmbGFnIGluZGljYXRpbmcgaWYgYSBub2RlIHRvIGJlIHJlbW92ZWQgaXMgYSBob3N0IG9mIGEgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCByTm9kZTogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZVBhcmVudCA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIHJOb2RlKTtcbiAgaWYgKG5hdGl2ZVBhcmVudCkge1xuICAgIG5hdGl2ZVJlbW92ZUNoaWxkKHJlbmRlcmVyLCBuYXRpdmVQYXJlbnQsIHJOb2RlLCBpc0hvc3RFbGVtZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgbm9kZXMgdG8gYSB0YXJnZXQgcHJvamVjdGlvbiBwbGFjZS4gTm9kZXMgdG8gaW5zZXJ0IHdlcmUgcHJldmlvdXNseSByZS1kaXN0cmlidXRpb24gYW5kXG4gKiBzdG9yZWQgb24gYSBjb21wb25lbnQgaG9zdCBsZXZlbC5cbiAqIEBwYXJhbSBsVmlldyBBIExWaWV3IHdoZXJlIG5vZGVzIGFyZSBpbnNlcnRlZCAodGFyZ2V0IFZMdmlldylcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgQSBwcm9qZWN0aW9uIG5vZGUgd2hlcmUgcHJldmlvdXNseSByZS1kaXN0cmlidXRpb24gc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiAodGFyZ2V0IGluc2VydGlvbiBwbGFjZSlcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4IEEgYnVja2V0IGZyb20gd2hlcmUgbm9kZXMgdG8gcHJvamVjdCBzaG91bGQgYmUgdGFrZW5cbiAqIEBwYXJhbSBjb21wb25lbnRWaWV3IEEgd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBpbml0aWFsbHkgY3JlYXRlZCAoc291cmNlIHZpZXcpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlcyhcbiAgICBsVmlldzogTFZpZXcsIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlLCBzZWxlY3RvckluZGV4OiBudW1iZXIsXG4gICAgY29tcG9uZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcHJvamVjdGVkVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICBsZXQgbm9kZVRvUHJvamVjdCA9IChjb21wb25lbnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtzZWxlY3RvckluZGV4XTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlVG9Qcm9qZWN0KSkge1xuICAgIGFwcGVuZENoaWxkKG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlcyhcbiAgICAgICAgICAgIGxWaWV3LCB0UHJvamVjdGlvbk5vZGUsIChub2RlVG9Qcm9qZWN0IGFzIFRQcm9qZWN0aW9uTm9kZSkucHJvamVjdGlvbixcbiAgICAgICAgICAgIGZpbmRDb21wb25lbnRWaWV3KHByb2plY3RlZFZpZXcpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgZmxhZyBtdXN0IGJlIHNldCBub3cgb3Igd2Ugd29uJ3Qga25vdyB0aGF0IHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICAgICAgLy8gaWYgdGhlIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGxhdGVyLlxuICAgICAgICBub2RlVG9Qcm9qZWN0LmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG4gICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobm9kZVRvUHJvamVjdCwgdFByb2plY3Rpb25Ob2RlLCBsVmlldywgcHJvamVjdGVkVmlldyk7XG4gICAgICB9XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHByb2plY3RlZFROb2RlIFRoZSBUTm9kZSB0byBiZSBwcm9qZWN0ZWRcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgVGhlIHByb2plY3Rpb24gKG5nLWNvbnRlbnQpIFROb2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlldyAodmlldyBhYm92ZSBjdXJyZW50KVxuICovXG5mdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIHByb2plY3RlZFROb2RlOiBUTm9kZSwgdFByb2plY3Rpb25Ob2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LFxuICAgIHByb2plY3Rpb25WaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByb2plY3RlZFROb2RlLCBwcm9qZWN0aW9uVmlldyk7XG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50Vmlldyk7XG5cbiAgLy8gdGhlIHByb2plY3RlZCBjb250ZW50cyBhcmUgcHJvY2Vzc2VkIHdoaWxlIGluIHRoZSBzaGFkb3cgdmlldyAod2hpY2ggaXMgdGhlIGN1cnJlbnRWaWV3KVxuICAvLyB0aGVyZWZvcmUgd2UgbmVlZCB0byBleHRyYWN0IHRoZSB2aWV3IHdoZXJlIHRoZSBob3N0IGVsZW1lbnQgbGl2ZXMgc2luY2UgaXQncyB0aGVcbiAgLy8gbG9naWNhbCBjb250YWluZXIgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGVkIHZpZXdzXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHByb2plY3Rpb25WaWV3KTtcblxuICBjb25zdCBub2RlT3JDb250YWluZXIgPSBwcm9qZWN0aW9uVmlld1twcm9qZWN0ZWRUTm9kZS5pbmRleF07XG4gIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIGNvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBhbiBlbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ24gdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3Qgdmlld3MgPSBub2RlT3JDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdzW2ldLCB0cnVlLCBub2RlT3JDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgbGV0IG5nQ29udGFpbmVyQ2hpbGRUTm9kZTogVE5vZGV8bnVsbCA9IHByb2plY3RlZFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICAgICAgd2hpbGUgKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSkge1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50VmlldywgcHJvamVjdGlvblZpZXcpO1xuICAgICAgICBuZ0NvbnRhaW5lckNoaWxkVE5vZGUgPSBuZ0NvbnRhaW5lckNoaWxkVE5vZGUubmV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIGFwcGVuZENoaWxkKG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==