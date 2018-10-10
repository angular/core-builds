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
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/** Retrieves the parent LNode of a given node. */
export function getParentLNode(tNode, currentView) {
    return tNode.parent == null ? getHostElementNode(currentView) :
        getLNode(tNode.parent, currentView);
}
/**
 * Gets the host LElementNode given a view. Will return null if the host element is an
 * LViewNode, since they are being phased out.
 */
export function getHostElementNode(currentView) {
    const hostTNode = currentView[HOST_NODE];
    return hostTNode && hostTNode.type !== 2 /* View */ ?
        getLNode(hostTNode, currentView[PARENT]) :
        null;
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
            const elementNode = getLNode(tNode, currentView);
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
 * @param lView The view to insert
 * @param lContainer The container into which the view should be inserted
 * @param parentView The new parent of the inserted view
 * @param index The index at which to insert the view
 * @param containerIndex The index of the container node, if dynamic
 */
export function insertView(lView, lContainer, parentView, index, containerIndex) {
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
 * @param lContainer The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @param detached Whether or not this view is already detached.
 */
export function detachView(lContainer, removeIndex, detached) {
    const views = lContainer[VIEWS];
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
 * @param lContainer The container from which to remove a view
 * @param tContainer The TContainer node associated with the LContainer
 * @param removeIndex The index of the view to remove
 */
export function removeView(lContainer, tContainer, removeIndex) {
    const view = lContainer[VIEWS][removeIndex];
    destroyLView(view);
    detachView(lContainer, removeIndex, !!tContainer.detached);
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
        return viewTNode.child ? getLNode(viewTNode.child, view).native : container.native;
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
            let ngContainerChild = getLNode(ngContainerChildTNode, projectionView);
            appendProjectedNode(ngContainerChild, ngContainerChildTNode, tProjectionNode, currentView, projectionView);
            ngContainerChildTNode = ngContainerChildTNode.next;
        }
    }
    if (projectedLNode.dynamicLContainerNode) {
        projectedLNode.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(projectedLNode.dynamicLContainerNode.native, tProjectionNode, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLGVBQWUsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFhLGFBQWEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbEgsT0FBTyxFQUF3SSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsTixPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUFtRSxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQW1DLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM04sT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUUzQyxNQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7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VyxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3hGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YSwgcmVhZEVsZW1lbnRWYWx1ZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMVGV4dE5vZGUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TE5vZGUsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0ICsgdW51c2VkNTtcblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZSh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGV8XG4gICAgTEVsZW1lbnRDb250YWluZXJOb2RlfExDb250YWluZXJOb2RlfG51bGwge1xuICByZXR1cm4gdE5vZGUucGFyZW50ID09IG51bGwgPyBnZXRIb3N0RWxlbWVudE5vZGUoY3VycmVudFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0TE5vZGUodE5vZGUucGFyZW50LCBjdXJyZW50Vmlldyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgaG9zdCBMRWxlbWVudE5vZGUgZ2l2ZW4gYSB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBob3N0IGVsZW1lbnQgaXMgYW5cbiAqIExWaWV3Tm9kZSwgc2luY2UgdGhleSBhcmUgYmVpbmcgcGhhc2VkIG91dC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEhvc3RFbGVtZW50Tm9kZShjdXJyZW50VmlldzogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgcmV0dXJuIGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgKGdldExOb2RlKGhvc3RUTm9kZSwgY3VycmVudFZpZXdbUEFSRU5UXSAhKSBhcyBMRWxlbWVudE5vZGUpIDpcbiAgICAgIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250YWluZXJOb2RlKHROb2RlOiBUTm9kZSwgZW1iZWRkZWRWaWV3OiBMVmlld0RhdGEpOiBMQ29udGFpbmVyTm9kZXxudWxsIHtcbiAgaWYgKHROb2RlLmluZGV4ID09PSAtMSkge1xuICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgaW5zaWRlIGEgZHluYW1pYyBjb250YWluZXIuXG4gICAgLy8gSWYgdGhlIGhvc3QgaW5kZXggaXMgLTEsIHRoZSB2aWV3IGhhcyBub3QgeWV0IGJlZW4gaW5zZXJ0ZWQsIHNvIGl0IGhhcyBubyBwYXJlbnQuXG4gICAgY29uc3QgY29udGFpbmVySG9zdEluZGV4ID0gZW1iZWRkZWRWaWV3W0NPTlRBSU5FUl9JTkRFWF07XG4gICAgcmV0dXJuIGNvbnRhaW5lckhvc3RJbmRleCA+IC0xID9cbiAgICAgICAgZW1iZWRkZWRWaWV3W1BBUkVOVF0gIVtjb250YWluZXJIb3N0SW5kZXhdLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA6XG4gICAgICAgIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBpcyBhIGlubGluZSB2aWV3IG5vZGUgKGUuZy4gZW1iZWRkZWRWaWV3U3RhcnQpXG4gICAgcmV0dXJuIGdldFBhcmVudExOb2RlKHROb2RlLCBlbWJlZGRlZFZpZXdbUEFSRU5UXSAhKSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgfVxufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgTEVsZW1lbnROb2RlIGZvciBhIGdpdmVuIHZpZXcuXG4gKiBNaWdodCBiZSBudWxsIGlmIGEgdmlldyBpcyBub3QgeWV0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQodFZpZXdOb2RlOiBUVmlld05vZGUsIHZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0Q29udGFpbmVyTm9kZSh0Vmlld05vZGUsIHZpZXcpO1xuICByZXR1cm4gY29udGFpbmVyID8gY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF0gOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiB3YWxrVE5vZGVUcmVlLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiB3YWxrVE5vZGVUcmVlIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXdEYXRhIHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgVE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBlbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHZpZXdUb1dhbGsgdGhlIHZpZXcgdG8gd2Fsa1xuICogQHBhcmFtIGFjdGlvbiBpZGVudGlmaWVzIHRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBMRWxlbWVudCBub2Rlcy5cbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnROb2RlIE9wdGlvbmFsIHRoZSByZW5kZXIgcGFyZW50IG5vZGUgdG8gYmUgc2V0IGluIGFsbCBMQ29udGFpbmVyTm9kZXMgZm91bmQsXG4gKiByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIEluc2VydCBhbmQgRGVzdHJveS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIEluc2VydC5cbiAqL1xuZnVuY3Rpb24gd2Fsa1ROb2RlVHJlZShcbiAgICB2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnROb2RlPzogTEVsZW1lbnROb2RlIHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBjb25zdCByb290VE5vZGUgPSB2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZTtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgbGV0IGN1cnJlbnRWaWV3ID0gdmlld1RvV2FsaztcbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gcm9vdFROb2RlLmNoaWxkIGFzIFROb2RlO1xuICB3aGlsZSAodE5vZGUpIHtcbiAgICBsZXQgbmV4dFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgICBjb25zdCBwYXJlbnQgPSByZW5kZXJQYXJlbnROb2RlID8gcmVuZGVyUGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudE5vZGUgPSBnZXRMTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpO1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBlbGVtZW50Tm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICBpZiAoZWxlbWVudE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBlbGVtZW50Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gY3VycmVudFZpZXcgIVt0Tm9kZS5pbmRleF0gYXMgTENvbnRhaW5lck5vZGU7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIGxDb250YWluZXJOb2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBpZiAocmVuZGVyUGFyZW50Tm9kZSkge1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGFbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBjaGlsZENvbnRhaW5lckRhdGFbVklFV1NdWzBdO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZW50ZXJzIGEgY29udGFpbmVyLCB0aGVuIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZWNvbWUgdGhlIGxvY2FsIG5hdGl2ZVxuICAgICAgICAvLyBjb21tZW50IG5vZGUuXG4gICAgICAgIGJlZm9yZU5vZGUgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSA6XG4gICAgICAgICAgICBsQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGN1cnJlbnRWaWV3ICEpO1xuICAgICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gICAgICBjb25zdCBoZWFkOiBUTm9kZXxudWxsID1cbiAgICAgICAgICAoY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICAvLyBNdXN0IHN0b3JlIGJvdGggdGhlIFROb2RlIGFuZCB0aGUgdmlldyBiZWNhdXNlIHRoaXMgcHJvamVjdGlvbiBub2RlIGNvdWxkIGJlIG5lc3RlZFxuICAgICAgLy8gZGVlcGx5IGluc2lkZSBlbWJlZGRlZCB2aWV3cywgYW5kIHdlIG5lZWQgdG8gZ2V0IGJhY2sgZG93biB0byB0aGlzIHBhcnRpY3VsYXIgbmVzdGVkIHZpZXcuXG4gICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSB0Tm9kZTtcbiAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IGN1cnJlbnRWaWV3ICE7XG4gICAgICBpZiAoaGVhZCkge1xuICAgICAgICBjdXJyZW50VmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICBuZXh0VE5vZGUgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YVtoZWFkLmluZGV4XSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGEgVmlldyBvciBhbiBFbGVtZW50Q29udGFpbmVyXG4gICAgICBuZXh0VE5vZGUgPSB0Tm9kZS5jaGlsZDtcbiAgICB9XG5cbiAgICBpZiAobmV4dFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKHROb2RlLm5leHQgPT09IG51bGwgJiYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgY3VycmVudFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXdEYXRhO1xuICAgICAgICB0Tm9kZSA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICAgIG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG5cbiAgICAgIC8qKlxuICAgICAgICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAgICAgICAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICAgICAgICpcbiAgICAgICAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhlbiBpdCBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gICAgICAgKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAgICAgICAqL1xuICAgICAgd2hpbGUgKCFuZXh0VE5vZGUpIHtcbiAgICAgICAgLy8gSWYgcGFyZW50IGlzIG51bGwsIHdlJ3JlIGNyb3NzaW5nIHRoZSB2aWV3IGJvdW5kYXJ5LCBzbyB3ZSBzaG91bGQgZ2V0IHRoZSBob3N0IFROb2RlLlxuICAgICAgICB0Tm9kZSA9IHROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUVklFV10ubm9kZTtcblxuICAgICAgICBpZiAodE5vZGUgPT09IG51bGwgfHwgdE5vZGUgPT09IHJvb3RUTm9kZSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8gV2hlbiBleGl0aW5nIGEgY29udGFpbmVyLCB0aGUgYmVmb3JlTm9kZSBtdXN0IGJlIHJlc3RvcmVkIHRvIHRoZSBwcmV2aW91cyB2YWx1ZVxuICAgICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Vmlld1t0Tm9kZS5pbmRleF0ubmF0aXZlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ICYmIGN1cnJlbnRWaWV3W05FWFRdKSB7XG4gICAgICAgICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tORVhUXSBhcyBMVmlld0RhdGE7XG4gICAgICAgICAgbmV4dFROb2RlID0gY3VycmVudFZpZXdbVFZJRVddLm5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IG5leHRUTm9kZTtcbiAgfVxufVxuXG4vKipcbiAqIEdpdmVuIGEgY3VycmVudCB2aWV3LCBmaW5kcyB0aGUgbmVhcmVzdCBjb21wb25lbnQncyBob3N0IChMRWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBMVmlld0RhdGEgZm9yIHdoaWNoIHdlIHdhbnQgYSBob3N0IGVsZW1lbnQgbm9kZVxuICogQHJldHVybnMgVGhlIGhvc3Qgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICBsZXQgcm9vdFROb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG5cbiAgd2hpbGUgKHJvb3RUTm9kZSAmJiByb290VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld0RhdGFbUEFSRU5UXSwgJ3ZpZXdEYXRhLnBhcmVudCcpO1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gICAgcm9vdFROb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIH1cblxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBub2RlOiBSQ29tbWVudCB8IFJFbGVtZW50IHwgUlRleHQsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlciAhKSA/XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5pbnNlcnRCZWZvcmUocGFyZW50ICEsIG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgIHBhcmVudCAhLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZUNoaWxkKHBhcmVudCAhLCBub2RlKSA6XG4gICAgICAgIHBhcmVudCAhLnJlbW92ZUNoaWxkKG5vZGUpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB2aWV3VG9XYWxrIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIHZpZXdUb1dhbGs6IExWaWV3RGF0YSwgaW5zZXJ0TW9kZTogdHJ1ZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICB2aWV3VG9XYWxrOiBMVmlld0RhdGEsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGdldENvbnRhaW5lclJlbmRlclBhcmVudCh2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFRWaWV3Tm9kZSwgdmlld1RvV2Fsayk7XG4gIGNvbnN0IHBhcmVudCA9IHBhcmVudE5vZGUgPyBwYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh2aWV3VG9XYWxrW1RWSUVXXS5ub2RlIGFzIFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGlmIChwYXJlbnQpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHZpZXdUb1dhbGtbUkVOREVSRVJdO1xuICAgIHdhbGtUTm9kZVRyZWUoXG4gICAgICAgIHZpZXdUb1dhbGssIGluc2VydE1vZGUgPyBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCA6IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoLCByZW5kZXJlcixcbiAgICAgICAgcGFyZW50Tm9kZSwgYmVmb3JlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBnZXRMVmlld0NoaWxkKHJvb3RWaWV3KTtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci5sZW5ndGggPj0gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gSWYgTFZpZXdEYXRhLCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgICBpZiAodmlld1tUVklFV10uY2hpbGRJbmRleCA+IC0xKSBuZXh0ID0gZ2V0TFZpZXdDaGlsZCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlld0RhdGEuXG4gICAgICBjb25zdCBjb250YWluZXIgPSB2aWV3T3JDb250YWluZXIgYXMgTENvbnRhaW5lcjtcbiAgICAgIGlmIChjb250YWluZXJbVklFV1NdLmxlbmd0aCkgbmV4dCA9IGNvbnRhaW5lcltWSUVXU11bMF07XG4gICAgfVxuXG4gICAgaWYgKG5leHQgPT0gbnVsbCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhW05FWFRdICYmIHZpZXdPckNvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyKTtcbiAgICAgICAgdmlld09yQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUodmlld09yQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgfHwgcm9vdFZpZXcpO1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lciAmJiB2aWV3T3JDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gcGFyZW50VmlldyBUaGUgbmV3IHBhcmVudCBvZiB0aGUgaW5zZXJ0ZWQgdmlld1xuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEBwYXJhbSBjb250YWluZXJJbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBub2RlLCBpZiBkeW5hbWljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGxWaWV3OiBMVmlld0RhdGEsIGxDb250YWluZXI6IExDb250YWluZXIsIHBhcmVudFZpZXc6IExWaWV3RGF0YSwgaW5kZXg6IG51bWJlcixcbiAgICBjb250YWluZXJJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIHZpZXdzW2luZGV4IC0gMV1bTkVYVF0gPSBsVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGxWaWV3W05FWFRdID0gdmlld3NbaW5kZXhdO1xuICAgIHZpZXdzLnNwbGljZShpbmRleCwgMCwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIHZpZXdzLnB1c2gobFZpZXcpO1xuICAgIGxWaWV3W05FWFRdID0gbnVsbDtcbiAgfVxuXG4gIC8vIER5bmFtaWNhbGx5IGluc2VydGVkIHZpZXdzIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlaXIgcGFyZW50IGNvbnRhaW5lcidzIGhvc3Qgc28gaXQnc1xuICAvLyBwb3NzaWJsZSB0byBqdW1wIGZyb20gYSB2aWV3IHRvIGl0cyBjb250YWluZXIncyBuZXh0IHdoZW4gd2Fsa2luZyB0aGUgbm9kZSB0cmVlLlxuICBpZiAoY29udGFpbmVySW5kZXggPiAtMSkge1xuICAgIGxWaWV3W0NPTlRBSU5FUl9JTkRFWF0gPSBjb250YWluZXJJbmRleDtcbiAgICBsVmlld1tQQVJFTlRdID0gcGFyZW50VmlldztcbiAgfVxuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IGEgbmV3IHZpZXcgaGFzIGJlZW4gYWRkZWRcbiAgaWYgKGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgbFZpZXdbUVVFUklFU10gIS5pbnNlcnRWaWV3KGluZGV4KTtcbiAgfVxuXG4gIC8vIFNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2Qgc3BsaWNlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcGFyYW0gZGV0YWNoZWQgV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGFscmVhZHkgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIsIGRldGFjaGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXdEYXRhO1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGlmICghZGV0YWNoZWQpIHtcbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9EZXRhY2gsIGZhbHNlKTtcbiAgfVxuXG4gIGlmICh2aWV3VG9EZXRhY2hbUVVFUklFU10pIHtcbiAgICB2aWV3VG9EZXRhY2hbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gIH1cbiAgdmlld1RvRGV0YWNoW0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gdENvbnRhaW5lciBUaGUgVENvbnRhaW5lciBub2RlIGFzc29jaWF0ZWQgd2l0aCB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdENvbnRhaW5lcjogVENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmlldyA9IGxDb250YWluZXJbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGVzdHJveUxWaWV3KHZpZXcpO1xuICBkZXRhY2hWaWV3KGxDb250YWluZXIsIHJlbW92ZUluZGV4LCAhIXRDb250YWluZXIuZGV0YWNoZWQpO1xufVxuXG4vKiogR2V0cyB0aGUgY2hpbGQgb2YgdGhlIGdpdmVuIExWaWV3RGF0YSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3Q2hpbGQodmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwge1xuICBpZiAodmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBob3N0Tm9kZTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlID0gdmlld0RhdGFbdmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXhdO1xuXG4gIHJldHVybiBob3N0Tm9kZS5kYXRhID8gaG9zdE5vZGUuZGF0YSA6IChob3N0Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbnVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICB3YWxrVE5vZGVUcmVlKHZpZXcsIFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIpO1xuICB9XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgLy8gU2V0cyB0aGUgZGVzdHJveWVkIGZsYWdcbiAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhfFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCB0Tm9kZTtcbiAgaWYgKHN0YXRlLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUICYmICh0Tm9kZSA9IChzdGF0ZSBhcyBMVmlld0RhdGEpICFbSE9TVF9OT0RFXSkgJiZcbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRDb250YWluZXJOb2RlKHROb2RlLCBzdGF0ZSBhcyBMVmlld0RhdGEpICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlld0RhdGEgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YSlbVFZJRVddKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAodmlld1tUVklFV10uaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3RGF0YVtUVklFV10uY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHJlYWRFbGVtZW50VmFsdWUodmlld0RhdGFbY2xlYW51cFtpICsgMV1dKS5uYXRpdmU7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIG5hdGl2ZS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGxpc3RlbmVyLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDFdXTtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3RGF0YVtDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3W0RJUkVDVElWRVNdICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlld0RhdGFbVFZJRVddICYmIHZpZXdEYXRhW1RWSUVXXS5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3RGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyUGFyZW50KHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZXxudWxsIHtcbiAgaWYgKGNhbkluc2VydE5hdGl2ZU5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSkge1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV07XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudCA9PSBudWxsICYmIGhvc3RUTm9kZSAhLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID9cbiAgICAgICAgZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KGhvc3RUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KSA6XG4gICAgICAgIGdldFBhcmVudExOb2RlKHROb2RlLCBjdXJyZW50VmlldykgYXMgTEVsZW1lbnROb2RlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mRWxlbWVudCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgLy8gSWYgdGhlIHBhcmVudCBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzLiBUaGlzIGhhcHBlbnMgd2hlbiB3ZVxuICAvLyBpbnNlcnQgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYW5kIGl0XG4gIC8vIHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gIGlmICh0Tm9kZS5wYXJlbnQgPT0gbnVsbCB8fFxuICAgICAgLy8gV2Ugc2hvdWxkIGFsc28gZWFnZXJseSBpbnNlcnQgaWYgdGhlIHBhcmVudCBpcyBhIHJlZ3VsYXIsIG5vbi1jb21wb25lbnQgZWxlbWVudFxuICAgICAgLy8gc2luY2Ugd2Uga25vdyB0aGF0IHRoaXMgcmVsYXRpb25zaGlwIHdpbGwgbmV2ZXIgYmUgYnJva2VuLlxuICAgICAgdE5vZGUucGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ICYmICEodE5vZGUucGFyZW50LmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIFBhcmVudCBpcyBhIENvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGFuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLlxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogV2UgbWlnaHQgZGVsYXkgaW5zZXJ0aW9uIG9mIGNoaWxkcmVuIGZvciBhIGdpdmVuIHZpZXcgaWYgaXQgaXMgZGlzY29ubmVjdGVkLlxuICogVGhpcyBtaWdodCBoYXBwZW4gZm9yIDIgbWFpbiByZWFzb25zOlxuICogLSB2aWV3IGlzIG5vdCBpbnNlcnRlZCBpbnRvIGFueSBjb250YWluZXIgKHZpZXcgd2FzIGNyZWF0ZWQgYnV0IG5vdCBpbnNlcnRlZCB5ZXQpXG4gKiAtIHZpZXcgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBidXQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaXMgbm90IGluc2VydGVkIGludG8gdGhlIERPTVxuICogKGNvbnRhaW5lciBtaWdodCBiZSBwYXJ0IG9mIHByb2plY3Rpb24gb3IgY2hpbGQgb2YgYSB2aWV3IHRoYXQgaXMgbm90IGluc2VydGVkIHlldCkuXG4gKlxuICogSW4gb3RoZXIgd29yZHMgd2UgY2FuIGluc2VydCBjaGlsZHJlbiBvZiBhIGdpdmVuIHZpZXcgaWYgdGhpcyB2aWV3IHdhcyBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyXG4gKiBhbmRcbiAqIHRoZSBjb250YWluZXIgaXRzZWxmIGhhcyBpdHMgcmVuZGVyIHBhcmVudCBkZXRlcm1pbmVkLlxuICovXG5mdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVDaGlsZE9mVmlldyh2aWV3VE5vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIC8vIEJlY2F1c2Ugd2UgYXJlIGluc2VydGluZyBpbnRvIGEgYFZpZXdgIHRoZSBgVmlld2AgbWF5IGJlIGRpc2Nvbm5lY3RlZC5cbiAgY29uc3QgY29udGFpbmVyID0gZ2V0Q29udGFpbmVyTm9kZSh2aWV3VE5vZGUsIHZpZXcpICE7XG4gIGlmIChjb250YWluZXIgPT0gbnVsbCB8fCBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA9PSBudWxsKSB7XG4gICAgLy8gVGhlIGBWaWV3YCBpcyBub3QgaW5zZXJ0ZWQgaW50byBhIGBDb250YWluZXJgIG9yIHRoZSBwYXJlbnQgYENvbnRhaW5lcmBcbiAgICAvLyBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBTbyB3ZSBoYXZlIHRvIGRlbGF5LlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRoZSBwYXJlbnQgYENvbnRhaW5lcmAgaXMgaW4gaW5zZXJ0ZWQgc3RhdGUsIHNvIHdlIGNhbiBlYWdlcmx5IGluc2VydCBpbnRvXG4gIC8vIHRoaXMgbG9jYXRpb24uXG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFyZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKlxuXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHdoZXJlIHRoZSBjaGlsZCB3aWxsIGJlIGluc2VydGVkIGludG8uXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgc2hvdWxkIGJlIGluc2VydGVkIG5vdyAob3IgZGVsYXllZCB1bnRpbCBsYXRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudE5vZGUgPSB0Tm9kZTtcbiAgbGV0IHBhcmVudDogVE5vZGV8bnVsbCA9IHROb2RlLnBhcmVudDtcblxuICBpZiAodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIGN1cnJlbnROb2RlID0gZ2V0SGlnaGVzdEVsZW1lbnRDb250YWluZXIodE5vZGUpO1xuICAgIHBhcmVudCA9IGN1cnJlbnROb2RlLnBhcmVudDtcbiAgfVxuICBpZiAocGFyZW50ID09PSBudWxsKSBwYXJlbnQgPSBjdXJyZW50Vmlld1tIT1NUX05PREVdO1xuXG4gIGlmIChwYXJlbnQgJiYgcGFyZW50LnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgcmV0dXJuIGNhbkluc2VydE5hdGl2ZUNoaWxkT2ZWaWV3KHBhcmVudCBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBQYXJlbnQgaXMgYSByZWd1bGFyIGVsZW1lbnQgb3IgYSBjb21wb25lbnRcbiAgICByZXR1cm4gY2FuSW5zZXJ0TmF0aXZlQ2hpbGRPZkVsZW1lbnQoY3VycmVudE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5hdGl2ZSBub2RlIGJlZm9yZSBhbm90aGVyIG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIHBhcmVudCB1c2luZyB7QGxpbmsgUmVuZGVyZXIzfS5cbiAqIFRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBuYXRpdmUgbm9kZXMgd2VyZSBkZXRlcm1pbmVkIC0gaXQgYWJzdHJhY3RzIGFuXG4gKiBhY3R1YWwgcmVuZGVyZXIgYmVpbmcgdXNlZC5cbiAqL1xuZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gY2hpbGRFbCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgZWxlbWVudFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChcbiAgICBjaGlsZEVsOiBSTm9kZSB8IG51bGwsIGNoaWxkVE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGNvbnN0IHBhcmVudExOb2RlID0gZ2V0UGFyZW50TE5vZGUoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpO1xuICBjb25zdCBwYXJlbnRFbCA9IHBhcmVudExOb2RlID8gcGFyZW50TE5vZGUubmF0aXZlIDogbnVsbDtcblxuICBpZiAoY2hpbGRFbCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IHBhcmVudFROb2RlOiBUTm9kZSA9IGNoaWxkVE5vZGUucGFyZW50IHx8IGN1cnJlbnRWaWV3W0hPU1RfTk9ERV0gITtcblxuICAgIGlmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZ2V0Q29udGFpbmVyTm9kZShwYXJlbnRUTm9kZSwgY3VycmVudFZpZXcpIGFzIExDb250YWluZXJOb2RlO1xuICAgICAgY29uc3QgcmVuZGVyUGFyZW50ID0gY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF07XG4gICAgICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhW1ZJRVdTXTtcbiAgICAgIGNvbnN0IGluZGV4ID0gdmlld3MuaW5kZXhPZihjdXJyZW50Vmlldyk7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgICAgICAgcmVuZGVyZXIsIHJlbmRlclBhcmVudCAhLm5hdGl2ZSwgY2hpbGRFbCwgZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXgsIHZpZXdzLCBjb250YWluZXIpKTtcbiAgICB9IGVsc2UgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBsZXQgZWxlbWVudENvbnRhaW5lciA9IGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKGNoaWxkVE5vZGUpO1xuICAgICAgbGV0IG5vZGU6IExFbGVtZW50Tm9kZSA9IGdldFJlbmRlclBhcmVudChlbGVtZW50Q29udGFpbmVyLCBjdXJyZW50VmlldykgITtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgbm9kZS5uYXRpdmUsIGNoaWxkRWwsIHBhcmVudEVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50RWwgIWFzIFJFbGVtZW50LCBjaGlsZEVsKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbCAhLmFwcGVuZENoaWxkKGNoaWxkRWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdG9wLWxldmVsIG5nLWNvbnRhaW5lciBpZiBuZy1jb250YWluZXJzIGFyZSBuZXN0ZWQuXG4gKlxuICogQHBhcmFtIG5nQ29udGFpbmVyIFRoZSBUTm9kZSBvZiB0aGUgc3RhcnRpbmcgbmctY29udGFpbmVyXG4gKiBAcmV0dXJucyB0Tm9kZSBUaGUgVE5vZGUgb2YgdGhlIGhpZ2hlc3QgbGV2ZWwgbmctY29udGFpbmVyXG4gKi9cbmZ1bmN0aW9uIGdldEhpZ2hlc3RFbGVtZW50Q29udGFpbmVyKG5nQ29udGFpbmVyOiBUTm9kZSk6IFROb2RlIHtcbiAgd2hpbGUgKG5nQ29udGFpbmVyLnBhcmVudCAhPSBudWxsICYmIG5nQ29udGFpbmVyLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIG5nQ29udGFpbmVyID0gbmdDb250YWluZXIucGFyZW50O1xuICB9XG4gIHJldHVybiBuZ0NvbnRhaW5lcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KGluZGV4OiBudW1iZXIsIHZpZXdzOiBMVmlld0RhdGFbXSwgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSkge1xuICBpZiAoaW5kZXggKyAxIDwgdmlld3MubGVuZ3RoKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdzW2luZGV4ICsgMV0gYXMgTFZpZXdEYXRhO1xuICAgIGNvbnN0IHZpZXdUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSBhcyBUVmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdUTm9kZS5jaGlsZCA/IGdldExOb2RlKHZpZXdUTm9kZS5jaGlsZCwgdmlldykubmF0aXZlIDogY29udGFpbmVyLm5hdGl2ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY29udGFpbmVyLm5hdGl2ZTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGBjaGlsZGAgZWxlbWVudCBvZiB0aGUgYHBhcmVudGAgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRFbCBUaGUgcGFyZW50IGVsZW1lbnQgZnJvbSB3aGljaCB0byByZW1vdmUgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDaGlsZCh0Tm9kZTogVE5vZGUsIGNoaWxkOiBSTm9kZSB8IG51bGwsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50TmF0aXZlID0gZ2V0UGFyZW50TE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSAhLm5hdGl2ZSBhcyBSRWxlbWVudDtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgcmVtb3ZlIHRoZSBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50TmF0aXZlIGFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE5hdGl2ZSAhLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHByb2plY3RlZCBub2RlIHRvIHRoZSBET00sIG9yIGluIHRoZSBjYXNlIG9mIGEgcHJvamVjdGVkIGNvbnRhaW5lcixcbiAqIGFwcGVuZHMgdGhlIG5vZGVzIGZyb20gYWxsIG9mIHRoZSBjb250YWluZXIncyBhY3RpdmUgdmlld3MgdG8gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gcHJvamVjdGVkTE5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIHBhcmVudE5vZGUgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICogQHBhcmFtIHByb2plY3Rpb25WaWV3IFByb2plY3Rpb24gdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBwcm9qZWN0ZWRMTm9kZTogTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgcHJvamVjdGVkVE5vZGU6IFROb2RlLCB0UHJvamVjdGlvbk5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLFxuICAgIHByb2plY3Rpb25WaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgYXBwZW5kQ2hpbGQocHJvamVjdGVkTE5vZGUubmF0aXZlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICAvLyB0aGUgcHJvamVjdGVkIGNvbnRlbnRzIGFyZSBwcm9jZXNzZWQgd2hpbGUgaW4gdGhlIHNoYWRvdyB2aWV3ICh3aGljaCBpcyB0aGUgY3VycmVudFZpZXcpXG4gIC8vIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIGV4dHJhY3QgdGhlIHZpZXcgd2hlcmUgdGhlIGhvc3QgZWxlbWVudCBsaXZlcyBzaW5jZSBpdCdzIHRoZVxuICAvLyBsb2dpY2FsIGNvbnRhaW5lciBvZiB0aGUgY29udGVudCBwcm9qZWN0ZWQgdmlld3NcbiAgYXR0YWNoUGF0Y2hEYXRhKHByb2plY3RlZExOb2RlLm5hdGl2ZSwgcHJvamVjdGlvblZpZXcpO1xuXG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudCh0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcblxuICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBjb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gYW4gZWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSAocHJvamVjdGVkTE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdzW2ldLCB0cnVlLCBwcm9qZWN0ZWRMTm9kZS5uYXRpdmUpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgIGxldCBuZ0NvbnRhaW5lckNoaWxkVE5vZGU6IFROb2RlfG51bGwgPSBwcm9qZWN0ZWRUTm9kZS5jaGlsZCBhcyBUTm9kZTtcbiAgICB3aGlsZSAobmdDb250YWluZXJDaGlsZFROb2RlKSB7XG4gICAgICBsZXQgbmdDb250YWluZXJDaGlsZCA9IGdldExOb2RlKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSwgcHJvamVjdGlvblZpZXcpO1xuICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICAgICAgICBuZ0NvbnRhaW5lckNoaWxkIGFzIExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlLFxuICAgICAgICAgIG5nQ29udGFpbmVyQ2hpbGRUTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBjdXJyZW50VmlldywgcHJvamVjdGlvblZpZXcpO1xuICAgICAgbmdDb250YWluZXJDaGlsZFROb2RlID0gbmdDb250YWluZXJDaGlsZFROb2RlLm5leHQ7XG4gICAgfVxuICB9XG4gIGlmIChwcm9qZWN0ZWRMTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBwcm9qZWN0ZWRMTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBhcHBlbmRDaGlsZChwcm9qZWN0ZWRMTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgfVxufVxuIl19