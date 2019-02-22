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
import { getNativeByTNode, isComponent, isLContainer, isLView, isRootView, readElementValue } from './util/view_utils';
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
                    readElementValue(lView[idxOrTargetGetter]);
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
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param projectedTNode The TNode to be projected
 * @param tProjectionNode The projection (ng-content) TNode
 * @param currentView Current LView
 * @param projectionView Projection view (view above current)
 */
export function appendProjectedNode(projectedTNode, tProjectionNode, currentView, projectionView) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFhLE1BQU0sRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0csT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUQsT0FBTyxFQUF3RCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSSxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUErQixJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNuTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxt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LEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDO2FBQ3BEO1NBQ0Y7UUFFRCxJQUFJLFlBQVksQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNqQyxXQUFXLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUNwRTtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkUsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NISUxEX0hFQUQsIENMRUFOVVAsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1QsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXcsIGdldExWaWV3UGFyZW50fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCBpc0NvbXBvbmVudCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3LCByZWFkRWxlbWVudFZhbHVlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMQ29udGFpbmVyKHROb2RlOiBUVmlld05vZGUsIGVtYmVkZGVkVmlldzogTFZpZXcpOiBMQ29udGFpbmVyfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoZW1iZWRkZWRWaWV3KTtcbiAgY29uc3QgY29udGFpbmVyID0gZW1iZWRkZWRWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgaWYgKHROb2RlLmluZGV4ID09PSAtMSkge1xuICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgaW5zaWRlIGEgZHluYW1pYyBjb250YWluZXIuXG4gICAgLy8gVGhlIHBhcmVudCBpc24ndCBhbiBMQ29udGFpbmVyIGlmIHRoZSBlbWJlZGRlZCB2aWV3IGhhc24ndCBiZWVuIGF0dGFjaGVkIHlldC5cbiAgICByZXR1cm4gaXNMQ29udGFpbmVyKGNvbnRhaW5lcikgPyBjb250YWluZXIgOiBudWxsO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgLy8gVGhpcyBpcyBhIGlubGluZSB2aWV3IG5vZGUgKGUuZy4gZW1iZWRkZWRWaWV3U3RhcnQpXG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgfVxufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHRWaWV3Tm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBuYXRpdmVQYXJlbnROb2RlKHZpZXdbUkVOREVSRVJdLCBjb250YWluZXJbTkFUSVZFXSkgOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiB3YWxrVE5vZGVUcmVlLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiB3YWxrVE5vZGVUcmVlIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXcgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIFdhbGtzIGEgdHJlZSBvZiBUTm9kZXMsIGFwcGx5aW5nIGEgdHJhbnNmb3JtYXRpb24gb24gdGhlIGVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqXG4gKiBAcGFyYW0gdmlld1RvV2FsayB0aGUgdmlldyB0byB3YWxrXG4gKiBAcGFyYW0gYWN0aW9uIGlkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIGVsZW1lbnRzXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIGN1cnJlbnQgcmVuZGVyZXIuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50IE9wdGlvbmFsIHRoZSByZW5kZXIgcGFyZW50IG5vZGUgdG8gYmUgc2V0IGluIGFsbCBMQ29udGFpbmVycyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgSW5zZXJ0IGFuZCBEZXN0cm95LlxuICogQHBhcmFtIGJlZm9yZU5vZGUgT3B0aW9uYWwgdGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgcmVxdWlyZWQgZm9yIGFjdGlvblxuICogSW5zZXJ0LlxuICovXG5mdW5jdGlvbiB3YWxrVE5vZGVUcmVlKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gdmlld1RvV2Fsa1tUVklFV10ubm9kZSBhcyBUVmlld05vZGU7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG4gIGxldCBjdXJyZW50VmlldyA9IHZpZXdUb1dhbGs7XG4gIGxldCB0Tm9kZTogVE5vZGV8bnVsbCA9IHJvb3RUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgd2hpbGUgKHROb2RlKSB7XG4gICAgbGV0IG5leHRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihcbiAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSwgdE5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gY3VycmVudFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICAgIC8vIFRoaXMgZWxlbWVudCBoYXMgYW4gTENvbnRhaW5lciwgYW5kIGl0cyBjb21tZW50IG5lZWRzIHRvIGJlIGhhbmRsZWRcbiAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gY3VycmVudFZpZXcgIVt0Tm9kZS5pbmRleF0gYXMgTENvbnRhaW5lcjtcbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgbENvbnRhaW5lcltOQVRJVkVdLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAgIGlmIChsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBsQ29udGFpbmVyW1ZJRVdTXVswXTtcbiAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgd2Fsa2VyIGVudGVycyBhIGNvbnRhaW5lciwgdGhlbiB0aGUgYmVmb3JlTm9kZSBoYXMgdG8gYmVjb21lIHRoZSBsb2NhbCBuYXRpdmVcbiAgICAgICAgLy8gY29tbWVudCBub2RlLlxuICAgICAgICBiZWZvcmVOb2RlID0gbENvbnRhaW5lcltOQVRJVkVdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhjdXJyZW50VmlldyAhKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3ROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZCkpIHtcbiAgICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBoZWFkKSB7XG4gICAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBuYXRpdmVOb2RlLCB0Tm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE11c3Qgc3RvcmUgYm90aCB0aGUgVE5vZGUgYW5kIHRoZSB2aWV3IGJlY2F1c2UgdGhpcyBwcm9qZWN0aW9uIG5vZGUgY291bGQgYmUgbmVzdGVkXG4gICAgICAgIC8vIGRlZXBseSBpbnNpZGUgZW1iZWRkZWQgdmlld3MsIGFuZCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gdGhpcyBwYXJ0aWN1bGFyIG5lc3RlZFxuICAgICAgICAvLyB2aWV3LlxuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSB0Tm9kZTtcbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gY3VycmVudFZpZXcgITtcbiAgICAgICAgaWYgKGhlYWQpIHtcbiAgICAgICAgICBjdXJyZW50VmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgYSBWaWV3IG9yIGFuIEVsZW1lbnRDb250YWluZXJcbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLmNoaWxkO1xuICAgIH1cblxuICAgIGlmIChuZXh0VE5vZGUgPT09IG51bGwpIHtcbiAgICAgIC8vIHRoaXMgbGFzdCBub2RlIHdhcyBwcm9qZWN0ZWQsIHdlIG5lZWQgdG8gZ2V0IGJhY2sgZG93biB0byBpdHMgcHJvamVjdGlvbiBub2RlXG4gICAgICBpZiAodE5vZGUubmV4dCA9PT0gbnVsbCAmJiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSkge1xuICAgICAgICBjdXJyZW50VmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlldztcbiAgICAgICAgdE5vZGUgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgVE5vZGU7XG4gICAgICB9XG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuXG4gICAgICAvKipcbiAgICAgICAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgVE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gICAgICAgKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAgICAgICAqXG4gICAgICAgKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoZW4gaXQgZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICAgICAgICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gICAgICAgKi9cbiAgICAgIHdoaWxlICghbmV4dFROb2RlKSB7XG4gICAgICAgIC8vIElmIHBhcmVudCBpcyBudWxsLCB3ZSdyZSBjcm9zc2luZyB0aGUgdmlldyBib3VuZGFyeSwgc28gd2Ugc2hvdWxkIGdldCB0aGUgaG9zdCBUTm9kZS5cbiAgICAgICAgdE5vZGUgPSB0Tm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbVF9IT1NUXTtcblxuICAgICAgICBpZiAodE5vZGUgPT09IG51bGwgfHwgdE5vZGUgPT09IHJvb3RUTm9kZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gV2hlbiBleGl0aW5nIGEgY29udGFpbmVyLCB0aGUgYmVmb3JlTm9kZSBtdXN0IGJlIHJlc3RvcmVkIHRvIHRoZSBwcmV2aW91cyB2YWx1ZVxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gZ2V0TFZpZXdQYXJlbnQoY3VycmVudFZpZXcpICE7XG4gICAgICAgICAgYmVmb3JlTm9kZSA9IGN1cnJlbnRWaWV3W3ROb2RlLmluZGV4XVtOQVRJVkVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogSWYgY3VycmVudCBsVmlldyBkb2Vzbid0IGhhdmUgbmV4dCBwb2ludGVyLCB3ZSB0cnkgdG8gZmluZCBpdCBieSBnb2luZyB1cCBwYXJlbnRzXG4gICAgICAgICAgICogY2hhaW4gdW50aWw6XG4gICAgICAgICAgICogLSB3ZSBmaW5kIGFuIGxWaWV3IHdpdGggYSBuZXh0IHBvaW50ZXJcbiAgICAgICAgICAgKiAtIG9yIGZpbmQgYSB0Tm9kZSB3aXRoIGEgcGFyZW50IHRoYXQgaGFzIGEgbmV4dCBwb2ludGVyXG4gICAgICAgICAgICogLSBvciByZWFjaCByb290IFROb2RlIChpbiB3aGljaCBjYXNlIHdlIGV4aXQsIHNpbmNlIHdlIHRyYXZlcnNlZCBhbGwgbm9kZXMpXG4gICAgICAgICAgICovXG4gICAgICAgICAgd2hpbGUgKCFjdXJyZW50Vmlld1tORVhUXSAmJiBjdXJyZW50Vmlld1tQQVJFTlRdICYmXG4gICAgICAgICAgICAgICAgICEodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5uZXh0KSkge1xuICAgICAgICAgICAgaWYgKHROb2RlID09PSByb290VE5vZGUpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdIGFzIExWaWV3O1xuICAgICAgICAgICAgdE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdICE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjdXJyZW50Vmlld1tORVhUXSkge1xuICAgICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tORVhUXSBhcyBMVmlldztcbiAgICAgICAgICAgIG5leHRUTm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSBuZXh0VE5vZGU7XG4gIH1cbn1cblxuLyoqXG4gKiBOT1RFOiBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIHBvc3NpYmxlIGFjdGlvbnMgYXJlIGlubGluZWQgd2l0aGluIHRoZSBmdW5jdGlvbiBpbnN0ZWFkIG9mXG4gKiBiZWluZyBwYXNzZWQgYXMgYW4gYXJndW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCB8IG51bGwsXG4gICAgbm9kZTogUkNvbW1lbnQgfCBSRWxlbWVudCB8IFJUZXh0LCB0Tm9kZTogVE5vZGUsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCAhLCBub2RlLCBiZWZvcmVOb2RlIHx8IG51bGwpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCBub2RlLCBpc0NvbXBvbmVudCh0Tm9kZSkpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiB0cnVlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb1dhbGs6IExWaWV3LCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgdmlld1RvV2FsazogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCB2aWV3VG9XYWxrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1RvV2Fsa1tSRU5ERVJFUl07XG4gICAgd2Fsa1ROb2RlVHJlZShcbiAgICAgICAgdmlld1RvV2FsaywgaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIHJlbmRlcmVyLFxuICAgICAgICByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGxldCBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3W0NISUxEX0hFQURdO1xuICBpZiAoIWxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuXG4gIHdoaWxlIChsVmlld09yTENvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAvLyBJZiBMVmlldywgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lcltDSElMRF9IRUFEXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IHZpZXdzID0gbFZpZXdPckxDb250YWluZXJbVklFV1NdIGFzIExWaWV3W107XG4gICAgICBpZiAodmlld3MubGVuZ3RoID4gMCkgbmV4dCA9IHZpZXdzWzBdO1xuICAgIH1cblxuICAgIGlmICghbmV4dCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlIChsVmlld09yTENvbnRhaW5lciAmJiAhbFZpZXdPckxDb250YWluZXIgIVtORVhUXSAmJiBsVmlld09yTENvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgICBsVmlld09yTENvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKGxWaWV3T3JMQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXIgJiYgbFZpZXdPckxDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgbFZpZXdPckxDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBpbmRleCBXaGljaCBpbmRleCBpbiB0aGUgY29udGFpbmVyIHRvIGluc2VydCB0aGUgY2hpbGQgdmlldyBpbnRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KGxWaWV3OiBMVmlldywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld3MsICdDb250YWluZXIgbXVzdCBoYXZlIHZpZXdzJyk7XG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgRGV0YWNoZWQgTFZpZXcgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXc7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld1RvRGV0YWNoLCBmYWxzZSk7XG5cbiAgaWYgKHZpZXdUb0RldGFjaFtRVUVSSUVTXSkge1xuICAgIHZpZXdUb0RldGFjaFtRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICByZXR1cm4gdmlld1RvRGV0YWNoO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmlldyA9IGxDb250YWluZXJbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRlc3Ryb3lMVmlldyh2aWV3KTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlldykge1xuICBpZiAoISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgd2Fsa1ROb2RlVHJlZSh2aWV3LCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG5cbiAgICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUobFZpZXdPckxDb250YWluZXI6IExWaWV3IHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3KTogTFZpZXd8XG4gICAgTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IHROb2RlO1xuICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikgJiYgKHROb2RlID0gbFZpZXdPckxDb250YWluZXJbVF9IT1NUXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRMQ29udGFpbmVyKHROb2RlIGFzIFRWaWV3Tm9kZSwgbFZpZXdPckxDb250YWluZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgb25EZXN0cm95cyBob29rcyBmb3IgYWxsIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGluIGEgZ2l2ZW4gdmlldyBhbmQgdGhlbiByZW1vdmVzIGFsbFxuICogbGlzdGVuZXJzLiBMaXN0ZW5lcnMgYXJlIHJlbW92ZWQgYXMgdGhlIGxhc3Qgc3RlcCBzbyBldmVudHMgZGVsaXZlcmVkIGluIHRoZSBvbkRlc3Ryb3lzIGhvb2tzXG4gKiBjYW4gYmUgcHJvcGFnYXRlZCB0byBAT3V0cHV0IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlldyB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKCh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlldztcblxuICAgIC8vIE1hcmsgdGhlIExWaWV3IGFzIGRlc3Ryb3llZCAqYmVmb3JlKiBleGVjdXRpbmcgdGhlIG9uRGVzdHJveSBob29rcy4gQW4gb25EZXN0cm95IGhvb2tcbiAgICAvLyBydW5zIGFyYml0cmFyeSB1c2VyIGNvZGUsIHdoaWNoIGNvdWxkIGluY2x1ZGUgaXRzIG93biBgdmlld1JlZi5kZXN0cm95KClgIChvciBzaW1pbGFyKS4gSWZcbiAgICAvLyBXZSBkb24ndCBmbGFnIHRoZSB2aWV3IGFzIGRlc3Ryb3llZCBiZWZvcmUgdGhlIGhvb2tzLCB0aGlzIGNvdWxkIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAvLyBUaGlzIGFsc28gYWxpZ25zIHdpdGggdGhlIFZpZXdFbmdpbmUgYmVoYXZpb3IuIEl0IGFsc28gbWVhbnMgdGhhdCB0aGUgb25EZXN0cm95IGhvb2sgaXNcbiAgICAvLyByZWFsbHkgbW9yZSBvZiBhbiBcImFmdGVyRGVzdHJveVwiIGhvb2sgaWYgeW91IHRoaW5rIGFib3V0IGl0LlxuICAgIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xuXG4gICAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZpZXdbVF9IT1NUXTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRDbGVhbnVwID0gbFZpZXdbVFZJRVddLmNsZWFudXAgITtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdICE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgdENsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHRoZSBuYXRpdmUgcmVuZGVyZXJcbiAgICAgICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSB0Q2xlYW51cFtpICsgMV07XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICBpZHhPclRhcmdldEdldHRlcihsVmlldykgOlxuICAgICAgICAgICAgcmVhZEVsZW1lbnRWYWx1ZShsVmlld1tpZHhPclRhcmdldEdldHRlcl0pO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIGNvbnN0IHVzZUNhcHR1cmVPclN1YklkeCA9IHRDbGVhbnVwW2kgKyAzXTtcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VDYXB0dXJlT3JTdWJJZHggPT09ICdib29sZWFuJykge1xuICAgICAgICAgIC8vIERPTSBsaXN0ZW5lclxuICAgICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHRDbGVhbnVwW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZU9yU3ViSWR4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodXNlQ2FwdHVyZU9yU3ViSWR4ID49IDApIHtcbiAgICAgICAgICAgIC8vIHVucmVnaXN0ZXJcbiAgICAgICAgICAgIGxDbGVhbnVwW3VzZUNhcHR1cmVPclN1YklkeF0oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gU3Vic2NyaXB0aW9uXG4gICAgICAgICAgICBsQ2xlYW51cFstdXNlQ2FwdHVyZU9yU3ViSWR4XS51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0Q2xlYW51cFtpXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggcmVuZGVyZXIyIChjbGVhbnVwIGZuIGNhbiBiZSBmb3VuZCBieSBpbmRleClcbiAgICAgICAgY29uc3QgY2xlYW51cEZuID0gbENsZWFudXBbdENsZWFudXBbaV1dO1xuICAgICAgICBjbGVhbnVwRm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gbENsZWFudXBbdENsZWFudXBbaSArIDFdXTtcbiAgICAgICAgdENsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgbFZpZXdbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcblxuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXN0cm95SG9va3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3W2Rlc3Ryb3lIb29rc1tpXSBhcyBudW1iZXJdO1xuXG4gICAgICAvLyBPbmx5IGNhbGwgdGhlIGRlc3Ryb3kgaG9vayBpZiB0aGUgY29udGV4dCBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gICAgICBpZiAoIShjb250ZXh0IGluc3RhbmNlb2YgTm9kZUluamVjdG9yRmFjdG9yeSkpIHtcbiAgICAgICAgKGRlc3Ryb3lIb29rc1tpICsgMV0gYXMoKSA9PiB2b2lkKS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgZWxlbWVudCBpZiBhIG5vZGUgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYWRlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVuZGVyUGFyZW50KHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIC8vIE5vZGVzIG9mIHRoZSB0b3AtbW9zdCB2aWV3IGNhbiBiZSBpbnNlcnRlZCBlYWdlcmx5LlxuICBpZiAoaXNSb290VmlldyhjdXJyZW50VmlldykpIHtcbiAgICByZXR1cm4gbmF0aXZlUGFyZW50Tm9kZShjdXJyZW50Vmlld1tSRU5ERVJFUl0sIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSk7XG4gIH1cblxuICAvLyBTa2lwIG92ZXIgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnMgYXMgdGhvc2UgYXJlIHJlcHJlc2VudGVkIGJ5IGEgY29tbWVudCBub2RlIGFuZFxuICAvLyBjYW4ndCBiZSB1c2VkIGFzIGEgcmVuZGVyIHBhcmVudC5cbiAgY29uc3QgcGFyZW50ID0gZ2V0SGlnaGVzdEVsZW1lbnRPcklDVUNvbnRhaW5lcih0Tm9kZSkucGFyZW50O1xuXG4gIC8vIElmIHRoZSBwYXJlbnQgaXMgbnVsbCwgdGhlbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zcyB2aWV3czogZWl0aGVyIGludG8gYW4gZW1iZWRkZWQgdmlldyBvciBhXG4gIC8vIGNvbXBvbmVudCB2aWV3LlxuICBpZiAocGFyZW50ID09IG51bGwpIHtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdICE7XG4gICAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiBhbiBlbWJlZGRlZCB2aWV3IFdlIG1pZ2h0IGRlbGF5IGluc2VydGlvbiBvZiBjaGlsZHJlblxuICAgICAgLy8gZm9yIGEgZ2l2ZW4gdmlldyBpZiBpdCBpcyBkaXNjb25uZWN0ZWQuIFRoaXMgbWlnaHQgaGFwcGVuIGZvciAyIG1haW4gcmVhc29uczpcbiAgICAgIC8vIC0gdmlldyBpcyBub3QgaW5zZXJ0ZWQgaW50byBhbnkgY29udGFpbmVyKHZpZXcgd2FzIGNyZWF0ZWQgYnV0IG5vdCBpbnNlcnRlZCB5ZXQpXG4gICAgICAvLyAtIHZpZXcgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBidXQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaXMgbm90IGluc2VydGVkIGludG8gdGhlIERPTVxuICAgICAgLy8gKGNvbnRhaW5lciBtaWdodCBiZSBwYXJ0IG9mIHByb2plY3Rpb24gb3IgY2hpbGQgb2YgYSB2aWV3IHRoYXQgaXMgbm90IGluc2VydGVkIHlldCkuXG4gICAgICAvLyBJbiBvdGhlciB3b3JkcyB3ZSBjYW4gaW5zZXJ0IGNoaWxkcmVuIG9mIGEgZ2l2ZW4gdmlldyBpZiB0aGlzIHZpZXcgd2FzIGluc2VydGVkIGludG8gYVxuICAgICAgLy8gY29udGFpbmVyIGFuZCB0aGUgY29udGFpbmVyIGl0c2VsZiBoYXMgaXRzIHJlbmRlciBwYXJlbnQgZGV0ZXJtaW5lZC5cbiAgICAgIHJldHVybiBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQoaG9zdFROb2RlIGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZFxuICAgICAgLy8gaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICAgIHJldHVybiBnZXRIb3N0TmF0aXZlKGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIGlmIChwYXJlbnQuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCB0RGF0YSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtwYXJlbnQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgY29uc3QgZW5jYXBzdWxhdGlvbiA9ICh0RGF0YVt0Tm9kZS5kaXJlY3RpdmVTdGFydF0gYXMgQ29tcG9uZW50RGVmPGFueT4pLmVuY2Fwc3VsYXRpb247XG5cbiAgICAgIC8vIFdlJ3ZlIGdvdCBhIHBhcmVudCB3aGljaCBpcyBhbiBlbGVtZW50IGluIHRoZSBjdXJyZW50IHZpZXcuIFdlIGp1c3QgbmVlZCB0byB2ZXJpZnkgaWYgdGhlXG4gICAgICAvLyBwYXJlbnQgZWxlbWVudCBpcyBub3QgYSBjb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAgICAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gICAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGVuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLiBOb3RlIHRoYXQgd2UgY2FuJ3RcbiAgICAgIC8vIG1ha2UgdGhpcyBhc3N1bXB0aW9uIHdoZW4gdXNpbmcgdGhlIFNoYWRvdyBET00sIGJlY2F1c2UgdGhlIG5hdGl2ZSBwcm9qZWN0aW9uIHBsYWNlaG9sZGVyc1xuICAgICAgLy8gKDxjb250ZW50PiBvciA8c2xvdD4pIGhhdmUgdG8gYmUgaW4gcGxhY2UgYXMgZWxlbWVudHMgYXJlIGJlaW5nIGluc2VydGVkLlxuICAgICAgaWYgKGVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbSAmJlxuICAgICAgICAgIGVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLk5hdGl2ZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSBhcyBSRWxlbWVudDtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIG5hdGl2ZSBob3N0IGVsZW1lbnQgZm9yIGEgZ2l2ZW4gdmlldy4gV2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgY3VycmVudCB2aWV3IGRvZXMgbm90IGhhdmVcbiAqIGEgaG9zdCBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBnZXRIb3N0TmF0aXZlKGN1cnJlbnRWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY3VycmVudFZpZXcpO1xuICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdO1xuICByZXR1cm4gaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/XG4gICAgICAoZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGdldExWaWV3UGFyZW50KGN1cnJlbnRWaWV3KSAhKSBhcyBSRWxlbWVudCkgOlxuICAgICAgbnVsbDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQsIGNoaWxkKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKSB7XG4gIGlmIChiZWZvcmVOb2RlKSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlciwgcGFyZW50LCBjaGlsZCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgYSBub2RlIGZyb20gdGhlIERPTSBnaXZlbiBpdHMgbmF0aXZlIHBhcmVudC4gKi9cbmZ1bmN0aW9uIG5hdGl2ZVJlbW92ZUNoaWxkKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCwgY2hpbGQsIGlzSG9zdEVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHBhcmVudCBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGwge1xuICByZXR1cm4gKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnBhcmVudE5vZGUobm9kZSkgOiBub2RlLnBhcmVudE5vZGUpIGFzIFJFbGVtZW50O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgc2libGluZyBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLm5leHRTaWJsaW5nKG5vZGUpIDogbm9kZS5uZXh0U2libGluZztcbn1cblxuLyoqXG4gKiBGaW5kcyBhIG5hdGl2ZSBcImFuY2hvclwiIG5vZGUgZm9yIGNhc2VzIHdoZXJlIHdlIGNhbid0IGFwcGVuZCBhIG5hdGl2ZSBjaGlsZCBkaXJlY3RseVxuICogKGBhcHBlbmRDaGlsZGApIGFuZCBuZWVkIHRvIHVzZSBhIHJlZmVyZW5jZSAoYW5jaG9yKSBub2RlIGZvciB0aGUgYGluc2VydEJlZm9yZWAgb3BlcmF0aW9uLlxuICogQHBhcmFtIHBhcmVudFROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlQW5jaG9yTm9kZShwYXJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfG51bGwge1xuICBpZiAocGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihwYXJlbnRUTm9kZSBhcyBUVmlld05vZGUsIGxWaWV3KSAhO1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gICAgY29uc3QgaW5kZXggPSB2aWV3cy5pbmRleE9mKGxWaWV3KTtcbiAgICByZXR1cm4gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXgsIHZpZXdzLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICB9IGVsc2UgaWYgKFxuICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfHxcbiAgICAgIHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgbmF0aXZlIG5vZGUgKG9yIGEgY29sbGVjdGlvbiBvZiBub2RlcykgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gY2hpbGRFbCBUaGUgbmF0aXZlIGNoaWxkIChvciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgZWxlbWVudFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChjaGlsZEVsOiBSTm9kZSB8IFJOb2RlW10sIGNoaWxkVE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCAhPSBudWxsKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgIGNvbnN0IGFuY2hvck5vZGUgPSBnZXROYXRpdmVBbmNob3JOb2RlKHBhcmVudFROb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRFbCkpIHtcbiAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgY2hpbGRFbCkge1xuICAgICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50LCBuYXRpdmVOb2RlLCBhbmNob3JOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCwgY2hpbGRFbCwgYW5jaG9yTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdG9wLWxldmVsIGVsZW1lbnQgb3IgYW4gSUNVIGNvbnRhaW5lciBpZiB0aG9zZSBjb250YWluZXJzIGFyZSBuZXN0ZWQuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGFydGluZyBUTm9kZSBmb3Igd2hpY2ggd2Ugc2hvdWxkIHNraXAgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnNcbiAqIEByZXR1cm5zIFRoZSBUTm9kZSBvZiB0aGUgaGlnaGVzdCBsZXZlbCBJQ1UgY29udGFpbmVyIG9yIGVsZW1lbnQgY29udGFpbmVyXG4gKi9cbmZ1bmN0aW9uIGdldEhpZ2hlc3RFbGVtZW50T3JJQ1VDb250YWluZXIodE5vZGU6IFROb2RlKTogVE5vZGUge1xuICB3aGlsZSAodE5vZGUucGFyZW50ICE9IG51bGwgJiYgKHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKSkge1xuICAgIHROb2RlID0gdE5vZGUucGFyZW50O1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4OiBudW1iZXIsIHZpZXdzOiBMVmlld1tdLCBjb250YWluZXJOYXRpdmU6IFJDb21tZW50KSB7XG4gIGlmIChpbmRleCArIDEgPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld3NbaW5kZXggKyAxXSBhcyBMVmlldztcbiAgICBjb25zdCB2aWV3VE5vZGUgPSB2aWV3W1RfSE9TVF0gYXMgVFZpZXdOb2RlO1xuICAgIHJldHVybiB2aWV3VE5vZGUuY2hpbGQgPyBnZXROYXRpdmVCeVROb2RlKHZpZXdUTm9kZS5jaGlsZCwgdmlldykgOiBjb250YWluZXJOYXRpdmU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNvbnRhaW5lck5hdGl2ZTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBuYXRpdmUgbm9kZSBpdHNlbGYgdXNpbmcgYSBnaXZlbiByZW5kZXJlci4gVG8gcmVtb3ZlIHRoZSBub2RlIHdlIGFyZSBsb29raW5nIHVwIGl0c1xuICogcGFyZW50IGZyb20gdGhlIG5hdGl2ZSB0cmVlIGFzIG5vdCBhbGwgcGxhdGZvcm1zIC8gYnJvd3NlcnMgc3VwcG9ydCB0aGUgZXF1aXZhbGVudCBvZlxuICogbm9kZS5yZW1vdmUoKS5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byBiZSB1c2VkXG4gKiBAcGFyYW0gck5vZGUgVGhlIG5hdGl2ZSBub2RlIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBpc0hvc3RFbGVtZW50IEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgbm9kZSB0byBiZSByZW1vdmVkIGlzIGEgaG9zdCBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgck5vZGU6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBuYXRpdmVQYXJlbnQgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCByTm9kZSk7XG4gIGlmIChuYXRpdmVQYXJlbnQpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChyZW5kZXJlciwgbmF0aXZlUGFyZW50LCByTm9kZSwgaXNIb3N0RWxlbWVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0ZWRUTm9kZSBUaGUgVE5vZGUgdG8gYmUgcHJvamVjdGVkXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIFRoZSBwcm9qZWN0aW9uIChuZy1jb250ZW50KSBUTm9kZVxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBwcm9qZWN0aW9uVmlldyBQcm9qZWN0aW9uIHZpZXcgKHZpZXcgYWJvdmUgY3VycmVudClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgcHJvamVjdGVkVE5vZGU6IFROb2RlLCB0UHJvamVjdGlvbk5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcsXG4gICAgcHJvamVjdGlvblZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJvamVjdGVkVE5vZGUsIHByb2plY3Rpb25WaWV3KTtcbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICAvLyB0aGUgcHJvamVjdGVkIGNvbnRlbnRzIGFyZSBwcm9jZXNzZWQgd2hpbGUgaW4gdGhlIHNoYWRvdyB2aWV3ICh3aGljaCBpcyB0aGUgY3VycmVudFZpZXcpXG4gIC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIGV4dHJhY3QgdGhlIHZpZXcgd2hlcmUgdGhlIGhvc3QgZWxlbWVudCBsaXZlcyBzaW5jZSBpdCdzIHRoZVxuICAvLyBsb2dpY2FsIGNvbnRhaW5lciBvZiB0aGUgY29udGVudCBwcm9qZWN0ZWQgdmlld3NcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgcHJvamVjdGlvblZpZXcpO1xuXG4gIGNvbnN0IG5vZGVPckNvbnRhaW5lciA9IHByb2plY3Rpb25WaWV3W3Byb2plY3RlZFROb2RlLmluZGV4XTtcbiAgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgY29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIGFuIGVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbiB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCB2aWV3cyA9IG5vZGVPckNvbnRhaW5lcltWSUVXU107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld3NbaV0sIHRydWUsIG5vZGVPckNvbnRhaW5lcltOQVRJVkVdKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBsZXQgbmdDb250YWluZXJDaGlsZFROb2RlOiBUTm9kZXxudWxsID0gcHJvamVjdGVkVE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gICAgICB3aGlsZSAobmdDb250YWluZXJDaGlsZFROb2RlKSB7XG4gICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobmdDb250YWluZXJDaGlsZFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3LCBwcm9qZWN0aW9uVmlldyk7XG4gICAgICAgIG5nQ29udGFpbmVyQ2hpbGRUTm9kZSA9IG5nQ29udGFpbmVyQ2hpbGRUTm9kZS5uZXh0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc0xDb250YWluZXIobm9kZU9yQ29udGFpbmVyKSkge1xuICAgICAgYXBwZW5kQ2hpbGQobm9kZU9yQ29udGFpbmVyW05BVElWRV0sIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH1cbiAgfVxufVxuIl19