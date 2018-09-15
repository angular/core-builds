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
import { assertNodeType } from './node_assert';
import { readElementValue, stringify } from './util';
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/** Retrieves the parent LNode of a given node. */
export function getParentLNode(tNode, currentView) {
    return tNode.parent == null ? getHostElementNode(currentView) :
        readElementValue(currentView[tNode.parent.index]);
}
/**
 * Gets the host LElementNode given a view. Will return null if the host element is an
 * LViewNode, since they are being phased out.
 */
export function getHostElementNode(currentView) {
    const hostTNode = currentView[HOST_NODE];
    return hostTNode && hostTNode.type !== 2 /* View */ ?
        readElementValue(currentView[PARENT][hostTNode.index]) :
        null;
}
/**
 * Gets the parent LNode if it's not a view. If it's a view, it will instead return the view's
 * parent container node.
 */
export function getParentOrContainerNode(tNode, currentView) {
    const parentTNode = tNode.parent || currentView[HOST_NODE];
    return parentTNode && parentTNode.type === 2 /* View */ ?
        getContainerNode(parentTNode, currentView) :
        getParentLNode(tNode, currentView);
}
export function getContainerNode(tNode, embeddedView) {
    if (tNode.index === -1) {
        // This is a dynamically created view inside a dynamic container.
        // If the host index is -1, the view has not yet been inserted, so it has no parent.
        const containerHostIndex = embeddedView[CONTAINER_INDEX];
        return containerHostIndex > -1 ?
            embeddedView[PARENT][containerHostIndex].dynamicLContainerNode :
            null;
    }
    else {
        // This is a inline view node (e.g. embeddedViewStart)
        return getParentLNode(tNode, embeddedView[PARENT]);
    }
}
/**
 * Retrieves render parent LElementNode for a given view.
 * Might be null if a view is not yet attached to any container.
 */
export function getContainerRenderParent(tViewNode, view) {
    const container = getContainerNode(tViewNode, view);
    return container ? container.data[RENDER_PARENT] : null;
}
/**
 * Stack used to keep track of projection nodes in walkTNodeTree.
 *
 * This is deliberately created outside of walkTNodeTree to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
 */
const projectionNodeStack = [];
/**
 * Walks a tree of TNodes, applying a transformation on the element nodes, either only on the first
 * one found, or on all of them.
 *
 * @param viewToWalk the view to walk
 * @param action identifies the action to be performed on the LElement nodes.
 * @param renderer the current renderer.
 * @param renderParentNode Optional the render parent node to be set in all LContainerNodes found,
 * required for action modes Insert and Destroy.
 * @param beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 */
function walkTNodeTree(viewToWalk, action, renderer, renderParentNode, beforeNode) {
    const rootTNode = viewToWalk[TVIEW].node;
    let projectionNodeIndex = -1;
    let currentView = viewToWalk;
    let tNode = rootTNode.child;
    while (tNode) {
        let nextTNode = null;
        const parent = renderParentNode ? renderParentNode.native : null;
        if (tNode.type === 3 /* Element */) {
            const elementNode = readElementValue(currentView[tNode.index]);
            executeNodeAction(action, renderer, parent, elementNode.native, beforeNode);
            if (elementNode.dynamicLContainerNode) {
                executeNodeAction(action, renderer, parent, elementNode.dynamicLContainerNode.native, beforeNode);
            }
        }
        else if (tNode.type === 0 /* Container */) {
            const lContainerNode = currentView[tNode.index];
            executeNodeAction(action, renderer, parent, lContainerNode.native, beforeNode);
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
            const componentView = findComponentView(currentView);
            const componentHost = componentView[HOST_NODE];
            const head = componentHost.projection[tNode.projection];
            // Must store both the TNode and the view because this projection node could be nested
            // deeply inside embedded views, and we need to get back down to this particular nested view.
            projectionNodeStack[++projectionNodeIndex] = tNode;
            projectionNodeStack[++projectionNodeIndex] = currentView;
            if (head) {
                currentView = componentView[PARENT];
                nextTNode = currentView[TVIEW].data[head.index];
            }
        }
        else {
            // Otherwise, this is a View or an ElementContainer
            nextTNode = tNode.child;
        }
        if (nextTNode === null) {
            // this last node was projected, we need to get back down to its projection node
            if (tNode.next === null && (tNode.flags & 8192 /* isProjected */)) {
                currentView = projectionNodeStack[projectionNodeIndex--];
                tNode = projectionNodeStack[projectionNodeIndex--];
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
                    currentView = currentView[PARENT];
                    beforeNode = currentView[tNode.index].native;
                }
                if (tNode.type === 2 /* View */ && currentView[NEXT]) {
                    currentView = currentView[NEXT];
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
 * @param lViewData LViewData for which we want a host element node
 * @returns The host node
 */
export function findComponentView(lViewData) {
    let rootTNode = lViewData[HOST_NODE];
    while (rootTNode && rootTNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'viewData.parent');
        lViewData = lViewData[PARENT];
        rootTNode = lViewData[HOST_NODE];
    }
    return lViewData;
}
/**
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 */
function executeNodeAction(action, renderer, parent, node, beforeNode) {
    if (action === 0 /* Insert */) {
        isProceduralRenderer(renderer) ?
            renderer.insertBefore(parent, node, beforeNode) :
            parent.insertBefore(node, beforeNode, true);
    }
    else if (action === 1 /* Detach */) {
        isProceduralRenderer(renderer) ?
            renderer.removeChild(parent, node) :
            parent.removeChild(node);
    }
    else if (action === 2 /* Destroy */) {
        ngDevMode && ngDevMode.rendererDestroyNode++;
        renderer.destroyNode(node);
    }
}
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
        renderer.createTextNode(stringify(value));
}
export function addRemoveViewFromContainer(viewToWalk, insertMode, beforeNode) {
    const parentNode = getContainerRenderParent(viewToWalk[TVIEW].node, viewToWalk);
    const parent = parentNode ? parentNode.native : null;
    ngDevMode && assertNodeType(viewToWalk[TVIEW].node, 2 /* View */);
    if (parent) {
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
 *  @param rootView The view to destroy
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    if (rootView[TVIEW].childIndex === -1) {
        return cleanUpView(rootView);
    }
    let viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        let next = null;
        if (viewOrContainer.length >= HEADER_OFFSET) {
            // If LViewData, traverse down to child.
            const view = viewOrContainer;
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        else {
            // If container, traverse down to its first LViewData.
            const container = viewOrContainer;
            if (container[VIEWS].length)
                next = container[VIEWS][0];
        }
        if (next == null) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (viewOrContainer && !viewOrContainer[NEXT] && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(viewOrContainer || rootView);
            next = viewOrContainer && viewOrContainer[NEXT];
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
 * @param container The container into which the view should be inserted
 * @param viewNode The view to insert
 * @param index The index at which to insert the view
 * @returns The inserted view
 */
export function insertView(container, lView, index, containerIndex) {
    const state = container.data;
    const views = state[VIEWS];
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
        lView[PARENT] = container.view;
    }
    // Notify query that a new view has been added
    if (lView[QUERIES]) {
        lView[QUERIES].insertView(index);
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
 * @param container The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @returns The detached view
 */
export function detachView(container, removeIndex, detached) {
    const views = container.data[VIEWS];
    const viewToDetach = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1][NEXT] = viewToDetach[NEXT];
    }
    views.splice(removeIndex, 1);
    if (!detached) {
        addRemoveViewFromContainer(viewToDetach, false);
    }
    if (viewToDetach[QUERIES]) {
        viewToDetach[QUERIES].removeView();
    }
    viewToDetach[CONTAINER_INDEX] = -1;
    viewToDetach[PARENT] = null;
    // Unsets the attached flag
    viewToDetach[FLAGS] &= ~8 /* Attached */;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param container The container from which to remove a view
 * @param removeIndex The index of the view to remove
 * @returns The removed view
 */
export function removeView(container, tContainer, removeIndex) {
    const view = container.data[VIEWS][removeIndex];
    destroyLView(view);
    detachView(container, removeIndex, !!tContainer.detached);
}
/** Gets the child of the given LViewData */
export function getLViewChild(viewData) {
    if (viewData[TVIEW].childIndex === -1)
        return null;
    const hostNode = viewData[viewData[TVIEW].childIndex];
    return hostNode.data ? hostNode.data : hostNode.dynamicLContainerNode.data;
}
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param view The view to be destroyed.
 */
export function destroyLView(view) {
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
 * @param state The LViewOrLContainer for which we need a parent state
 * @param rootView The rootView, so we don't propagate too far up the view tree
 * @returns The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    let tNode;
    if (state.length >= HEADER_OFFSET && (tNode = state[HOST_NODE]) &&
        tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getContainerNode(tNode, state).data;
    }
    else {
        // otherwise, use parent view for containers or component views
        return state[PARENT] === rootView ? null : state[PARENT];
    }
}
/**
 * Removes all listeners and call all onDestroys in a given view.
 *
 * @param view The LViewData to clean up
 */
function cleanUpView(viewOrContainer) {
    if (viewOrContainer[TVIEW]) {
        const view = viewOrContainer;
        removeListeners(view);
        executeOnDestroys(view);
        executePipeOnDestroys(view);
        // For component views only, the local renderer is destroyed as clean up time.
        if (view[TVIEW].id === -1 && isProceduralRenderer(view[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            view[RENDERER].destroy();
        }
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function removeListeners(viewData) {
    const cleanup = viewData[TVIEW].cleanup;
    if (cleanup != null) {
        for (let i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                // This is a listener with the native renderer
                const native = readElementValue(viewData[cleanup[i + 1]]).native;
                const listener = viewData[CLEANUP][cleanup[i + 2]];
                native.removeEventListener(cleanup[i], listener, cleanup[i + 3]);
                i += 2;
            }
            else if (typeof cleanup[i] === 'number') {
                // This is a listener with renderer2 (cleanup fn can be found by index)
                const cleanupFn = viewData[CLEANUP][cleanup[i]];
                cleanupFn();
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                const context = viewData[CLEANUP][cleanup[i + 1]];
                cleanup[i].call(context);
            }
        }
        viewData[CLEANUP] = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(view) {
    const tView = view[TVIEW];
    let destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks(view[DIRECTIVES], destroyHooks);
    }
}
/** Calls pipe destroy hooks for this view */
function executePipeOnDestroys(viewData) {
    const pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(viewData, pipeDestroyHooks);
    }
}
export function getRenderParent(tNode, currentView) {
    if (canInsertNativeNode(tNode, currentView)) {
        const hostTNode = currentView[HOST_NODE];
        return tNode.parent == null && hostTNode.type === 2 /* View */ ?
            getContainerRenderParent(hostTNode, currentView) :
            getParentLNode(tNode, currentView);
    }
    return null;
}
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
 */
function canInsertNativeChildOfView(viewTNode, view) {
    // Because we are inserting into a `View` the `View` may be disconnected.
    const container = getContainerNode(viewTNode, view);
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
 * @param parent The parent where the child will be inserted into.
 * @param currentView Current LView being processed.
 * @return boolean Whether the child should be inserted now (or delayed until later).
 */
export function canInsertNativeNode(tNode, currentView) {
    let currentNode = tNode;
    let parent = tNode.parent;
    if (tNode.parent && tNode.parent.type === 4 /* ElementContainer */) {
        currentNode = getHighestElementContainer(tNode);
        parent = currentNode.parent;
    }
    if (parent === null)
        parent = currentView[HOST_NODE];
    if (parent && parent.type === 2 /* View */) {
        return canInsertNativeChildOfView(parent, currentView);
    }
    else {
        // Parent is a regular element or a component
        return canInsertNativeChildOfElement(currentNode);
    }
}
/**
 * Inserts a native node before another native node for a given parent using {@link Renderer3}.
 * This is a utility function that can be used when native nodes were determined - it abstracts an
 * actual renderer being used.
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
 * The element insertion might be delayed {@link canInsertNativeNode}.
 *
 * @param childEl The child that should be appended
 * @param childTNode The TNode of the child element
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export function appendChild(childEl, childTNode, currentView) {
    const parentLNode = getParentLNode(childTNode, currentView);
    const parentEl = parentLNode ? parentLNode.native : null;
    if (childEl !== null && canInsertNativeNode(childTNode, currentView)) {
        const renderer = currentView[RENDERER];
        const parentTNode = childTNode.parent || currentView[HOST_NODE];
        if (parentTNode.type === 2 /* View */) {
            const container = getContainerNode(parentTNode, currentView);
            const renderParent = container.data[RENDER_PARENT];
            const views = container.data[VIEWS];
            const index = views.indexOf(currentView);
            nativeInsertBefore(renderer, renderParent.native, childEl, getBeforeNodeForView(index, views, container));
        }
        else if (parentTNode.type === 4 /* ElementContainer */) {
            let elementContainer = getHighestElementContainer(childTNode);
            let node = getRenderParent(elementContainer, currentView);
            nativeInsertBefore(renderer, node.native, childEl, parentEl);
        }
        else {
            isProceduralRenderer(renderer) ? renderer.appendChild(parentEl, childEl) :
                parentEl.appendChild(childEl);
        }
        return true;
    }
    return false;
}
/**
 * Gets the top-level ng-container if ng-containers are nested.
 *
 * @param ngContainer The TNode of the starting ng-container
 * @returns tNode The TNode of the highest level ng-container
 */
function getHighestElementContainer(ngContainer) {
    while (ngContainer.parent != null && ngContainer.parent.type === 4 /* ElementContainer */) {
        ngContainer = ngContainer.parent;
    }
    return ngContainer;
}
export function getBeforeNodeForView(index, views, container) {
    if (index + 1 < views.length) {
        const view = views[index + 1];
        const viewTNode = view[HOST_NODE];
        return viewTNode.child ? readElementValue(view[viewTNode.child.index]).native :
            container.native;
    }
    else {
        return container.native;
    }
}
/**
 * Removes the `child` element of the `parent` from the DOM.
 *
 * @param parentEl The parent element from which to remove the child
 * @param child The child that should be removed
 * @param currentView The current LView
 * @returns Whether or not the child was removed
 */
export function removeChild(tNode, child, currentView) {
    const parentNative = getParentLNode(tNode, currentView).native;
    if (child !== null && canInsertNativeNode(tNode, currentView)) {
        // We only remove the element if not in View or not projected.
        const renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.removeChild(parentNative, child) :
            parentNative.removeChild(child);
        return true;
    }
    return false;
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param projectedLNode The node to process
 * @param parentNode The last parent element to be processed
 * @param tProjectionNode
 * @param currentView Current LView
 * @param projectionView Projection view
 */
export function appendProjectedNode(projectedLNode, projectedTNode, tProjectionNode, currentView, projectionView) {
    appendChild(projectedLNode.native, tProjectionNode, currentView);
    // the projected contents are processed while in the shadow view (which is the currentView)
    // therefore we need to extract the view where the host element lives since it's the
    // logical container of the content projected views
    attachPatchData(projectedLNode.native, projectionView);
    const renderParent = getRenderParent(tProjectionNode, currentView);
    if (projectedTNode.type === 0 /* Container */) {
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        const lContainer = projectedLNode.data;
        lContainer[RENDER_PARENT] = renderParent;
        const views = lContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(views[i], true, projectedLNode.native);
        }
    }
    else if (projectedTNode.type === 4 /* ElementContainer */) {
        let ngContainerChildTNode = projectedTNode.child;
        while (ngContainerChildTNode) {
            let ngContainerChild = readElementValue(projectionView[ngContainerChildTNode.index]);
            appendProjectedNode(ngContainerChild, ngContainerChildTNode, tProjectionNode, currentView, projectionView);
            ngContainerChildTNode = ngContainerChildTNode.next;
        }
    }
    if (projectedLNode.dynamicLContainerNode) {
        projectedLNode.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(projectedLNode.dynamicLContainerNode.native, tProjectionNode, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFhLGFBQWEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbEgsT0FBTyxFQUEyTCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyUSxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQW1DLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM04sT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQWMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRWhFLE1BQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUVoRixrREFB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QUFJLGNBQWMsQ0FBQyxJQUFJLDZCQUErQixFQUFFO1FBQzdELElBQUkscUJBQXFCLEdBQWUsY0FBYyxDQUFDLEtBQWMsQ0FBQztRQUN0RSxPQUFPLHFCQUFxQixFQUFFO1lBQzVCLElBQUksZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDckYsbUJBQW1CLENBQ2YsZ0JBQXFGLEVBQ3JGLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDekUscUJBQXFCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDO1NBQ3BEO0tBQ0Y7SUFDRCxJQUFJLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRTtRQUN4QyxjQUFjLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztRQUN4RSxXQUFXLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDeEY7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnRDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExUZXh0Tm9kZSwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRUZXh0Tm9kZSwgVFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgRElSRUNUSVZFUywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgSG9va0RhdGEsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpc0NvbXBvbmVudCwgcmVhZEVsZW1lbnRWYWx1ZSwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKiogUmV0cmlldmVzIHRoZSBwYXJlbnQgTE5vZGUgb2YgYSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxcbiAgICBMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8bnVsbCB7XG4gIHJldHVybiB0Tm9kZS5wYXJlbnQgPT0gbnVsbCA/IGdldEhvc3RFbGVtZW50Tm9kZShjdXJyZW50VmlldykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkRWxlbWVudFZhbHVlKGN1cnJlbnRWaWV3W3ROb2RlLnBhcmVudC5pbmRleF0pO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGhvc3QgTEVsZW1lbnROb2RlIGdpdmVuIGEgdmlldy4gV2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgaG9zdCBlbGVtZW50IGlzIGFuXG4gKiBMVmlld05vZGUsIHNpbmNlIHRoZXkgYXJlIGJlaW5nIHBoYXNlZCBvdXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0RWxlbWVudE5vZGUoY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gIHJldHVybiBob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5WaWV3ID9cbiAgICAgIHJlYWRFbGVtZW50VmFsdWUoY3VycmVudFZpZXdbUEFSRU5UXSAhW2hvc3RUTm9kZS5pbmRleF0pIDpcbiAgICAgIG51bGw7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IExOb2RlIGlmIGl0J3Mgbm90IGEgdmlldy4gSWYgaXQncyBhIHZpZXcsIGl0IHdpbGwgaW5zdGVhZCByZXR1cm4gdGhlIHZpZXcnc1xuICogcGFyZW50IGNvbnRhaW5lciBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50T3JDb250YWluZXJOb2RlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxcbiAgICBMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8bnVsbCB7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG4gIHJldHVybiBwYXJlbnRUTm9kZSAmJiBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICBnZXRDb250YWluZXJOb2RlKHBhcmVudFROb2RlLCBjdXJyZW50VmlldykgOlxuICAgICAgZ2V0UGFyZW50TE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lck5vZGUodE5vZGU6IFROb2RlLCBlbWJlZGRlZFZpZXc6IExWaWV3RGF0YSk6IExDb250YWluZXJOb2RlfG51bGwge1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBJZiB0aGUgaG9zdCBpbmRleCBpcyAtMSwgdGhlIHZpZXcgaGFzIG5vdCB5ZXQgYmVlbiBpbnNlcnRlZCwgc28gaXQgaGFzIG5vIHBhcmVudC5cbiAgICBjb25zdCBjb250YWluZXJIb3N0SW5kZXggPSBlbWJlZGRlZFZpZXdbQ09OVEFJTkVSX0lOREVYXTtcbiAgICByZXR1cm4gY29udGFpbmVySG9zdEluZGV4ID4gLTEgP1xuICAgICAgICBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhW2NvbnRhaW5lckhvc3RJbmRleF0uZHluYW1pY0xDb250YWluZXJOb2RlIDpcbiAgICAgICAgbnVsbDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGEgaW5saW5lIHZpZXcgbm9kZSAoZS5nLiBlbWJlZGRlZFZpZXdTdGFydClcbiAgICByZXR1cm4gZ2V0UGFyZW50TE5vZGUodE5vZGUsIGVtYmVkZGVkVmlld1tQQVJFTlRdICEpIGFzIExDb250YWluZXJOb2RlO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBMRWxlbWVudE5vZGUgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lclJlbmRlclBhcmVudCh0Vmlld05vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRDb250YWluZXJOb2RlKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA6IG51bGw7XG59XG5cbmNvbnN0IGVudW0gV2Fsa1ROb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDAsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAxLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMixcbn1cblxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHdhbGtUTm9kZVRyZWUuXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHdhbGtUTm9kZVRyZWUgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlld0RhdGEgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIFdhbGtzIGEgdHJlZSBvZiBUTm9kZXMsIGFwcGx5aW5nIGEgdHJhbnNmb3JtYXRpb24gb24gdGhlIGVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqXG4gKiBAcGFyYW0gdmlld1RvV2FsayB0aGUgdmlldyB0byB3YWxrXG4gKiBAcGFyYW0gYWN0aW9uIGlkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIExFbGVtZW50IG5vZGVzLlxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSBjdXJyZW50IHJlbmRlcmVyLlxuICogQHBhcmFtIHJlbmRlclBhcmVudE5vZGUgT3B0aW9uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJOb2RlcyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgSW5zZXJ0IGFuZCBEZXN0cm95LlxuICogQHBhcmFtIGJlZm9yZU5vZGUgT3B0aW9uYWwgdGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgcmVxdWlyZWQgZm9yIGFjdGlvblxuICogSW5zZXJ0LlxuICovXG5mdW5jdGlvbiB3YWxrVE5vZGVUcmVlKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHJlbmRlclBhcmVudE5vZGU/OiBMRWxlbWVudE5vZGUgfCBudWxsLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IHZpZXdUb1dhbGtbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuICBsZXQgY3VycmVudFZpZXcgPSB2aWV3VG9XYWxrO1xuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSByb290VE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gIHdoaWxlICh0Tm9kZSkge1xuICAgIGxldCBuZXh0VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgPyByZW5kZXJQYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50Tm9kZSA9IHJlYWRFbGVtZW50VmFsdWUoY3VycmVudFZpZXcgIVt0Tm9kZS5pbmRleF0pO1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBlbGVtZW50Tm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICBpZiAoZWxlbWVudE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBlbGVtZW50Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gY3VycmVudFZpZXcgIVt0Tm9kZS5pbmRleF0gYXMgTENvbnRhaW5lck5vZGU7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIGxDb250YWluZXJOb2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBpZiAocmVuZGVyUGFyZW50Tm9kZSkge1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGFbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBjaGlsZENvbnRhaW5lckRhdGFbVklFV1NdWzBdO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZW50ZXJzIGEgY29udGFpbmVyLCB0aGVuIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZWNvbWUgdGhlIGxvY2FsIG5hdGl2ZVxuICAgICAgICAvLyBjb21tZW50IG5vZGUuXG4gICAgICAgIGJlZm9yZU5vZGUgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSA6XG4gICAgICAgICAgICBsQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGN1cnJlbnRWaWV3ICEpO1xuICAgICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gICAgICBjb25zdCBoZWFkOiBUTm9kZXxudWxsID1cbiAgICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICAvLyBNdXN0IHN0b3JlIGJvdGggdGhlIFROb2RlIGFuZCB0aGUgdmlldyBiZWNhdXNlIHRoaXMgcHJvamVjdGlvbiBub2RlIGNvdWxkIGJlIG5lc3RlZFxuICAgICAgLy8gZGVlcGx5IGluc2lkZSBlbWJlZGRlZCB2aWV3cywgYW5kIHdlIG5lZWQgdG8gZ2V0IGJhY2sgZG93biB0byB0aGlzIHBhcnRpY3VsYXIgbmVzdGVkIHZpZXcuXG4gICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSB0Tm9kZTtcbiAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IGN1cnJlbnRWaWV3ICE7XG4gICAgICBpZiAoaGVhZCkge1xuICAgICAgICBjdXJyZW50VmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGEgVmlldyBvciBhbiBFbGVtZW50Q29udGFpbmVyXG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5jaGlsZDtcbiAgICB9XG5cbiAgICBpZiAobmV4dFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKHROb2RlLm5leHQgPT09IG51bGwgJiYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXdEYXRhO1xuICAgICAgICB0Tm9kZSA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG5cbiAgICAgIC8qKlxuICAgICAgICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAgICAgICAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICAgICAgICpcbiAgICAgICAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhlbiBpdCBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gICAgICAgKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAgICAgICAqL1xuICAgICAgd2hpbGUgKCFuZXh0VE5vZGUpIHtcbiAgICAgICAgLy8gSWYgcGFyZW50IGlzIG51bGwsIHdlJ3JlIGNyb3NzaW5nIHRoZSB2aWV3IGJvdW5kYXJ5LCBzbyB3ZSBzaG91bGQgZ2V0IHRoZSBob3N0IFROb2RlLlxuICAgICAgICB0Tm9kZSA9IHROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICBpZiAodE5vZGUgPT09IG51bGwgfHwgdE5vZGUgPT09IHJvb3RUTm9kZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gV2hlbiBleGl0aW5nIGEgY29udGFpbmVyLCB0aGUgYmVmb3JlTm9kZSBtdXN0IGJlIHJlc3RvcmVkIHRvIHRoZSBwcmV2aW91cyB2YWx1ZVxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF0ubmF0aXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ICYmIGN1cnJlbnRWaWV3W05FWFRdKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tORVhUXSBhcyBMVmlld0RhdGE7XG4gICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IG5leHRUTm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIEdpdmVuIGEgY3VycmVudCB2aWV3LCBmaW5kcyB0aGUgbmVhcmVzdCBjb21wb25lbnQncyBob3N0IChMRWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBMVmlld0RhdGEgZm9yIHdoaWNoIHdlIHdhbnQgYSBob3N0IGVsZW1lbnQgbm9kZVxuICogQHJldHVybnMgVGhlIGhvc3Qgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICBsZXQgcm9vdFROb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG5cbiAgd2hpbGUgKHJvb3RUTm9kZSAmJiByb290VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld0RhdGFbUEFSRU5UXSwgJ3ZpZXdEYXRhLnBhcmVudCcpO1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gICAgcm9vdFROb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIH1cblxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBub2RlOiBSQ29tbWVudCB8IFJFbGVtZW50IHwgUlRleHQsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlciAhKSA/XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5pbnNlcnRCZWZvcmUocGFyZW50ICEsIG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgIHBhcmVudCAhLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZUNoaWxkKHBhcmVudCAhLCBub2RlKSA6XG4gICAgICAgIHBhcmVudCAhLnJlbW92ZUNoaWxkKG5vZGUpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogdHJ1ZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICB2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGdldENvbnRhaW5lclJlbmRlclBhcmVudCh2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZSwgdmlld1RvV2Fsayk7XG4gIGNvbnN0IHBhcmVudCA9IHBhcmVudE5vZGUgPyBwYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGlmIChwYXJlbnQpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHZpZXdUb1dhbGtbUkVOREVSRVJdO1xuICAgIHdhbGtUTm9kZVRyZWUoXG4gICAgICAgIHZpZXdUb1dhbGssIGluc2VydE1vZGUgPyBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCA6IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoLCByZW5kZXJlcixcbiAgICAgICAgcGFyZW50Tm9kZSwgYmVmb3JlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBnZXRMVmlld0NoaWxkKHJvb3RWaWV3KTtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci5sZW5ndGggPj0gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gSWYgTFZpZXdEYXRhLCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgICBpZiAodmlld1tUVklFV10uY2hpbGRJbmRleCA+IC0xKSBuZXh0ID0gZ2V0TFZpZXdDaGlsZCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlld0RhdGEuXG4gICAgICBjb25zdCBjb250YWluZXIgPSB2aWV3T3JDb250YWluZXIgYXMgTENvbnRhaW5lcjtcbiAgICAgIGlmIChjb250YWluZXJbVklFV1NdLmxlbmd0aCkgbmV4dCA9IGNvbnRhaW5lcltWSUVXU11bMF07XG4gICAgfVxuXG4gICAgaWYgKG5leHQgPT0gbnVsbCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhW05FWFRdICYmIHZpZXdPckNvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyKTtcbiAgICAgICAgdmlld09yQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUodmlld09yQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgfHwgcm9vdFZpZXcpO1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lciAmJiB2aWV3T3JDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSB2aWV3Tm9kZSBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3XG4gKiBAcmV0dXJucyBUaGUgaW5zZXJ0ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCBsVmlldzogTFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLCBjb250YWluZXJJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGVbVklFV1NdO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICAvLyBEeW5hbWljYWxseSBpbnNlcnRlZCB2aWV3cyBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIHBhcmVudCBjb250YWluZXIncyBob3N0IHNvIGl0J3NcbiAgLy8gcG9zc2libGUgdG8ganVtcCBmcm9tIGEgdmlldyB0byBpdHMgY29udGFpbmVyJ3MgbmV4dCB3aGVuIHdhbGtpbmcgdGhlIG5vZGUgdHJlZS5cbiAgaWYgKGNvbnRhaW5lckluZGV4ID4gLTEpIHtcbiAgICBsVmlld1tDT05UQUlORVJfSU5ERVhdID0gY29udGFpbmVySW5kZXg7XG4gICAgbFZpZXdbUEFSRU5UXSA9IGNvbnRhaW5lci52aWV3O1xuICB9XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgVGhlIGRldGFjaGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlciwgZGV0YWNoZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXdEYXRhO1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGlmICghZGV0YWNoZWQpIHtcbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9EZXRhY2gsIGZhbHNlKTtcbiAgfVxuXG4gIGlmICh2aWV3VG9EZXRhY2hbUVVFUklFU10pIHtcbiAgICB2aWV3VG9EZXRhY2hbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gIH1cbiAgdmlld1RvRGV0YWNoW0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHRDb250YWluZXI6IFRDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZpZXcgPSBjb250YWluZXIuZGF0YVtWSUVXU11bcmVtb3ZlSW5kZXhdO1xuICBkZXN0cm95TFZpZXcodmlldyk7XG4gIGRldGFjaFZpZXcoY29udGFpbmVyLCByZW1vdmVJbmRleCwgISF0Q29udGFpbmVyLmRldGFjaGVkKTtcbn1cblxuLyoqIEdldHMgdGhlIGNoaWxkIG9mIHRoZSBnaXZlbiBMVmlld0RhdGEgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld0NoaWxkKHZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsIHtcbiAgaWYgKHZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaG9zdE5vZGU6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZSA9IHZpZXdEYXRhW3ZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4XTtcblxuICByZXR1cm4gaG9zdE5vZGUuZGF0YSA/IGhvc3ROb2RlLmRhdGEgOiAoaG9zdE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xufVxuXG4vKipcbiAqIEEgc3RhbmRhbG9uZSBmdW5jdGlvbiB3aGljaCBkZXN0cm95cyBhbiBMVmlldyxcbiAqIGNvbmR1Y3RpbmcgY2xlYW51cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gYmUgZGVzdHJveWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUxWaWV3KHZpZXc6IExWaWV3RGF0YSkge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgd2Fsa1ROb2RlVHJlZSh2aWV3LCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyKTtcbiAgfVxuICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIC8vIFNldHMgdGhlIGRlc3Ryb3llZCBmbGFnXG4gIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXdEYXRhIHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxcbiAgICBMQ29udGFpbmVyfG51bGwge1xuICBsZXQgdE5vZGU7XG4gIGlmIChzdGF0ZS5sZW5ndGggPj0gSEVBREVSX09GRlNFVCAmJiAodE5vZGUgPSAoc3RhdGUgYXMgTFZpZXdEYXRhKSAhW0hPU1RfTk9ERV0pICYmXG4gICAgICB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gZ2V0Q29udGFpbmVyTm9kZSh0Tm9kZSwgc3RhdGUgYXMgTFZpZXdEYXRhKSAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZVtQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZVtQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXdEYXRhIHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGEpW1RWSUVXXSkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKHZpZXdbVFZJRVddLmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBjbGVhbnVwID0gdmlld0RhdGFbVFZJRVddLmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggdGhlIG5hdGl2ZSByZW5kZXJlclxuICAgICAgICBjb25zdCBuYXRpdmUgPSByZWFkRWxlbWVudFZhbHVlKHZpZXdEYXRhW2NsZWFudXBbaSArIDFdXSkubmF0aXZlO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMl1dO1xuICAgICAgICBuYXRpdmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBsaXN0ZW5lciwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaV1dO1xuICAgICAgICBjbGVhbnVwRm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlld0RhdGFbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlld1tESVJFQ1RJVkVTXSAhLCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXdEYXRhW1RWSUVXXSAmJiB2aWV3RGF0YVtUVklFV10ucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlld0RhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlclBhcmVudCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGV8bnVsbCB7XG4gIGlmIChjYW5JbnNlcnROYXRpdmVOb2RlKHROb2RlLCBjdXJyZW50VmlldykpIHtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tIT1NUX05PREVdO1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQgPT0gbnVsbCAmJiBob3N0VE5vZGUgIS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICAgIGdldENvbnRhaW5lclJlbmRlclBhcmVudChob3N0VE5vZGUgYXMgVFZpZXdOb2RlLCBjdXJyZW50VmlldykgOlxuICAgICAgICBnZXRQYXJlbnRMTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpIGFzIExFbGVtZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZkVsZW1lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIElmIHRoZSBwYXJlbnQgaXMgbnVsbCwgdGhlbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zcyB2aWV3cy4gVGhpcyBoYXBwZW5zIHdoZW4gd2VcbiAgLy8gaW5zZXJ0IGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZCBpdFxuICAvLyBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICBpZiAodE5vZGUucGFyZW50ID09IG51bGwgfHxcbiAgICAgIC8vIFdlIHNob3VsZCBhbHNvIGVhZ2VybHkgaW5zZXJ0IGlmIHRoZSBwYXJlbnQgaXMgYSByZWd1bGFyLCBub24tY29tcG9uZW50IGVsZW1lbnRcbiAgICAgIC8vIHNpbmNlIHdlIGtub3cgdGhhdCB0aGlzIHJlbGF0aW9uc2hpcCB3aWxsIG5ldmVyIGJlIGJyb2tlbi5cbiAgICAgIHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCAmJiAhKHROb2RlLnBhcmVudC5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBQYXJlbnQgaXMgYSBDb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhhbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFdlIG1pZ2h0IGRlbGF5IGluc2VydGlvbiBvZiBjaGlsZHJlbiBmb3IgYSBnaXZlbiB2aWV3IGlmIGl0IGlzIGRpc2Nvbm5lY3RlZC5cbiAqIFRoaXMgbWlnaHQgaGFwcGVuIGZvciAyIG1haW4gcmVhc29uczpcbiAqIC0gdmlldyBpcyBub3QgaW5zZXJ0ZWQgaW50byBhbnkgY29udGFpbmVyICh2aWV3IHdhcyBjcmVhdGVkIGJ1dCBub3QgaW5zZXJ0ZWQgeWV0KVxuICogLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAqIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICpcbiAqIEluIG90aGVyIHdvcmRzIHdlIGNhbiBpbnNlcnQgY2hpbGRyZW4gb2YgYSBnaXZlbiB2aWV3IGlmIHRoaXMgdmlldyB3YXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lclxuICogYW5kXG4gKiB0aGUgY29udGFpbmVyIGl0c2VsZiBoYXMgaXRzIHJlbmRlciBwYXJlbnQgZGV0ZXJtaW5lZC5cbiAqL1xuZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZlZpZXcodmlld1ROb2RlOiBUVmlld05vZGUsIHZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICAvLyBCZWNhdXNlIHdlIGFyZSBpbnNlcnRpbmcgaW50byBhIGBWaWV3YCB0aGUgYFZpZXdgIG1heSBiZSBkaXNjb25uZWN0ZWQuXG4gIGNvbnN0IGNvbnRhaW5lciA9IGdldENvbnRhaW5lck5vZGUodmlld1ROb2RlLCB2aWV3KSAhO1xuICBpZiAoY29udGFpbmVyID09IG51bGwgfHwgY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF0gPT0gbnVsbCkge1xuICAgIC8vIFRoZSBgVmlld2AgaXMgbm90IGluc2VydGVkIGludG8gYSBgQ29udGFpbmVyYCBvciB0aGUgcGFyZW50IGBDb250YWluZXJgXG4gICAgLy8gaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gU28gd2UgaGF2ZSB0byBkZWxheS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUaGUgcGFyZW50IGBDb250YWluZXJgIGlzIGluIGluc2VydGVkIHN0YXRlLCBzbyB3ZSBjYW4gZWFnZXJseSBpbnNlcnQgaW50b1xuICAvLyB0aGlzIGxvY2F0aW9uLlxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hcmUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICpcblxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCB3aGVyZSB0aGUgY2hpbGQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvLlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIHNob3VsZCBiZSBpbnNlcnRlZCBub3cgKG9yIGRlbGF5ZWQgdW50aWwgbGF0ZXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gdE5vZGU7XG4gIGxldCBwYXJlbnQ6IFROb2RlfG51bGwgPSB0Tm9kZS5wYXJlbnQ7XG5cbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBjdXJyZW50Tm9kZSA9IGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKHROb2RlKTtcbiAgICBwYXJlbnQgPSBjdXJyZW50Tm9kZS5wYXJlbnQ7XG4gIH1cbiAgaWYgKHBhcmVudCA9PT0gbnVsbCkgcGFyZW50ID0gY3VycmVudFZpZXdbSE9TVF9OT0RFXTtcblxuICBpZiAocGFyZW50ICYmIHBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIHJldHVybiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mVmlldyhwYXJlbnQgYXMgVFZpZXdOb2RlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gUGFyZW50IGlzIGEgcmVndWxhciBlbGVtZW50IG9yIGEgY29tcG9uZW50XG4gICAgcmV0dXJuIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZFbGVtZW50KGN1cnJlbnROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQgdXNpbmcge0BsaW5rIFJlbmRlcmVyM30uXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZCAtIGl0IGFic3RyYWN0cyBhblxuICogYWN0dWFsIHJlbmRlcmVyIGJlaW5nIHVzZWQuXG4gKi9cbmZ1bmN0aW9uIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGQsIGJlZm9yZU5vZGUsIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX0uXG4gKlxuICogQHBhcmFtIGNoaWxkRWwgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIGVsZW1lbnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQoXG4gICAgY2hpbGRFbDogUk5vZGUgfCBudWxsLCBjaGlsZFROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBjb25zdCBwYXJlbnRMTm9kZSA9IGdldFBhcmVudExOb2RlKGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgY29uc3QgcGFyZW50RWwgPSBwYXJlbnRMTm9kZSA/IHBhcmVudExOb2RlLm5hdGl2ZSA6IG51bGw7XG5cbiAgaWYgKGNoaWxkRWwgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShjaGlsZFROb2RlLCBjdXJyZW50VmlldykpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBwYXJlbnRUTm9kZTogVE5vZGUgPSBjaGlsZFROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tIT1NUX05PREVdICE7XG5cbiAgICBpZiAocGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGdldENvbnRhaW5lck5vZGUocGFyZW50VE5vZGUsIGN1cnJlbnRWaWV3KSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICAgICAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gICAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YoY3VycmVudFZpZXcpO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQgIS5uYXRpdmUsIGNoaWxkRWwsIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4LCB2aWV3cywgY29udGFpbmVyKSk7XG4gICAgfSBlbHNlIGlmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgbGV0IGVsZW1lbnRDb250YWluZXIgPSBnZXRIaWdoZXN0RWxlbWVudENvbnRhaW5lcihjaGlsZFROb2RlKTtcbiAgICAgIGxldCBub2RlOiBMRWxlbWVudE5vZGUgPSBnZXRSZW5kZXJQYXJlbnQoZWxlbWVudENvbnRhaW5lciwgY3VycmVudFZpZXcpICE7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIG5vZGUubmF0aXZlLCBjaGlsZEVsLCBwYXJlbnRFbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudEVsICFhcyBSRWxlbWVudCwgY2hpbGRFbCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50RWwgIS5hcHBlbmRDaGlsZChjaGlsZEVsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHRvcC1sZXZlbCBuZy1jb250YWluZXIgaWYgbmctY29udGFpbmVycyBhcmUgbmVzdGVkLlxuICpcbiAqIEBwYXJhbSBuZ0NvbnRhaW5lciBUaGUgVE5vZGUgb2YgdGhlIHN0YXJ0aW5nIG5nLWNvbnRhaW5lclxuICogQHJldHVybnMgdE5vZGUgVGhlIFROb2RlIG9mIHRoZSBoaWdoZXN0IGxldmVsIG5nLWNvbnRhaW5lclxuICovXG5mdW5jdGlvbiBnZXRIaWdoZXN0RWxlbWVudENvbnRhaW5lcihuZ0NvbnRhaW5lcjogVE5vZGUpOiBUTm9kZSB7XG4gIHdoaWxlIChuZ0NvbnRhaW5lci5wYXJlbnQgIT0gbnVsbCAmJiBuZ0NvbnRhaW5lci5wYXJlbnQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICBuZ0NvbnRhaW5lciA9IG5nQ29udGFpbmVyLnBhcmVudDtcbiAgfVxuICByZXR1cm4gbmdDb250YWluZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleDogbnVtYmVyLCB2aWV3czogTFZpZXdEYXRhW10sIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUpIHtcbiAgaWYgKGluZGV4ICsgMSA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3c1tpbmRleCArIDFdIGFzIExWaWV3RGF0YTtcbiAgICBjb25zdCB2aWV3VE5vZGUgPSB2aWV3W0hPU1RfTk9ERV0gYXMgVFZpZXdOb2RlO1xuICAgIHJldHVybiB2aWV3VE5vZGUuY2hpbGQgPyByZWFkRWxlbWVudFZhbHVlKHZpZXdbdmlld1ROb2RlLmNoaWxkLmluZGV4XSkubmF0aXZlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLm5hdGl2ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29udGFpbmVyLm5hdGl2ZTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGBjaGlsZGAgZWxlbWVudCBvZiB0aGUgYHBhcmVudGAgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRFbCBUaGUgcGFyZW50IGVsZW1lbnQgZnJvbSB3aGljaCB0byByZW1vdmUgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDaGlsZCh0Tm9kZTogVE5vZGUsIGNoaWxkOiBSTm9kZSB8IG51bGwsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50TmF0aXZlID0gZ2V0UGFyZW50TE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSAhLm5hdGl2ZSBhcyBSRWxlbWVudDtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgcmVtb3ZlIHRoZSBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50TmF0aXZlIGFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE5hdGl2ZSAhLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHByb2plY3RlZCBub2RlIHRvIHRoZSBET00sIG9yIGluIHRoZSBjYXNlIG9mIGEgcHJvamVjdGVkIGNvbnRhaW5lcixcbiAqIGFwcGVuZHMgdGhlIG5vZGVzIGZyb20gYWxsIG9mIHRoZSBjb250YWluZXIncyBhY3RpdmUgdmlld3MgdG8gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gcHJvamVjdGVkTE5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIHBhcmVudE5vZGUgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBwcm9qZWN0ZWRMTm9kZTogTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgcHJvamVjdGVkVE5vZGU6IFROb2RlLCB0UHJvamVjdGlvbk5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLFxuICAgIHByb2plY3Rpb25WaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgYXBwZW5kQ2hpbGQocHJvamVjdGVkTE5vZGUubmF0aXZlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICAvLyB0aGUgcHJvamVjdGVkIGNvbnRlbnRzIGFyZSBwcm9jZXNzZWQgd2hpbGUgaW4gdGhlIHNoYWRvdyB2aWV3ICh3aGljaCBpcyB0aGUgY3VycmVudFZpZXcpXG4gIC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIGV4dHJhY3QgdGhlIHZpZXcgd2hlcmUgdGhlIGhvc3QgZWxlbWVudCBsaXZlcyBzaW5jZSBpdCdzIHRoZVxuICAvLyBsb2dpY2FsIGNvbnRhaW5lciBvZiB0aGUgY29udGVudCBwcm9qZWN0ZWQgdmlld3NcbiAgYXR0YWNoUGF0Y2hEYXRhKHByb2plY3RlZExOb2RlLm5hdGl2ZSwgcHJvamVjdGlvblZpZXcpO1xuXG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudCh0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBjb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gYW4gZWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSAocHJvamVjdGVkTE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdzW2ldLCB0cnVlLCBwcm9qZWN0ZWRMTm9kZS5uYXRpdmUpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIGxldCBuZ0NvbnRhaW5lckNoaWxkVE5vZGU6IFROb2RlfG51bGwgPSBwcm9qZWN0ZWRUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgICB3aGlsZSAobmdDb250YWluZXJDaGlsZFROb2RlKSB7XG4gICAgICBsZXQgbmdDb250YWluZXJDaGlsZCA9IHJlYWRFbGVtZW50VmFsdWUocHJvamVjdGlvblZpZXdbbmdDb250YWluZXJDaGlsZFROb2RlLmluZGV4XSk7XG4gICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgICAgICAgIG5nQ29udGFpbmVyQ2hpbGQgYXMgTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgbmdDb250YWluZXJDaGlsZFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3LCBwcm9qZWN0aW9uVmlldyk7XG4gICAgICBuZ0NvbnRhaW5lckNoaWxkVE5vZGUgPSBuZ0NvbnRhaW5lckNoaWxkVE5vZGUubmV4dDtcbiAgICB9XG4gIH1cbiAgaWYgKHByb2plY3RlZExOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIHByb2plY3RlZExOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGFwcGVuZENoaWxkKHByb2plY3RlZExOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuICB9XG59XG4iXX0=