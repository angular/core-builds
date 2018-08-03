/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from './assert';
import { callHooks } from './hooks';
import { RENDER_PARENT, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, CONTAINER_INDEX, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { readElementValue, stringify } from './util';
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/** Retrieves the sibling node for the given node. */
export function getNextLNode(node) {
    // View nodes don't have TNodes, so their next must be retrieved through their LView.
    if (node.tNode.type === 2 /* View */) {
        const viewData = node.data;
        return viewData[NEXT] ? viewData[NEXT][HOST_NODE] : null;
    }
    return node.tNode.next ? node.view[node.tNode.next.index] : null;
}
/** Retrieves the first child of a given node */
export function getChildLNode(node) {
    if (node.tNode.child) {
        const viewData = node.tNode.type === 2 /* View */ ? node.data : node.view;
        return readElementValue(viewData[node.tNode.child.index]);
    }
    return null;
}
export function getParentLNode(node) {
    if (node.tNode.index === -1 && node.tNode.type === 2 /* View */) {
        // This is a dynamically created view inside a dynamic container.
        // If the host index is -1, the view has not yet been inserted, so it has no parent.
        const containerHostIndex = node.data[CONTAINER_INDEX];
        return containerHostIndex === -1 ? null : node.view[containerHostIndex].dynamicLContainerNode;
    }
    const parent = node.tNode.parent;
    return readElementValue(parent ? node.view[parent.index] : node.view[HOST_NODE]);
}
/**
 * Retrieves render parent LElementNode for a given view.
 * Might be null if a view is not yet attatched to any container.
 */
function getRenderParent(viewNode) {
    const container = getParentLNode(viewNode);
    return container ? container.data[RENDER_PARENT] : null;
}
/**
 * Stack used to keep track of projection nodes in walkLNodeTree.
 *
 * This is deliberately created outside of walkLNodeTree to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
 */
const projectionNodeStack = [];
/**
 * Walks a tree of LNodes, applying a transformation on the LElement nodes, either only on the first
 * one found, or on all of them.
 *
 * @param startingNode the node from which the walk is started.
 * @param rootNode the root node considered. This prevents walking past that node.
 * @param action identifies the action to be performed on the LElement nodes.
 * @param renderer the current renderer.
 * @param renderParentNode Optional the render parent node to be set in all LContainerNodes found,
 * required for action modes Insert and Destroy.
 * @param beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 */
function walkLNodeTree(startingNode, rootNode, action, renderer, renderParentNode, beforeNode) {
    let node = startingNode;
    let projectionNodeIndex = -1;
    while (node) {
        let nextNode = null;
        const parent = renderParentNode ? renderParentNode.native : null;
        const nodeType = node.tNode.type;
        if (nodeType === 3 /* Element */) {
            // Execute the action
            executeNodeAction(action, renderer, parent, node.native, beforeNode);
            if (node.dynamicLContainerNode) {
                executeNodeAction(action, renderer, parent, node.dynamicLContainerNode.native, beforeNode);
            }
        }
        else if (nodeType === 0 /* Container */) {
            executeNodeAction(action, renderer, parent, node.native, beforeNode);
            const lContainerNode = node;
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
            const componentHost = findComponentHost(node.view);
            const head = componentHost.tNode.projection[node.tNode.projection];
            projectionNodeStack[++projectionNodeIndex] = node;
            nextNode = head ? componentHost.data[PARENT][head.index] : null;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(node);
        }
        if (nextNode === null) {
            nextNode = getNextLNode(node);
            // this last node was projected, we need to get back down to its projection node
            if (nextNode === null && (node.tNode.flags & 8192 /* isProjected */)) {
                nextNode = getNextLNode(projectionNodeStack[projectionNodeIndex--]);
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
 * @param lViewData LViewData for which we want a host element node
 * @returns The host node
 */
export function findComponentHost(lViewData) {
    let viewRootLNode = lViewData[HOST_NODE];
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'lViewData.parent');
        lViewData = lViewData[PARENT];
        viewRootLNode = lViewData[HOST_NODE];
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertDefined(viewRootLNode.data, 'node.data');
    return viewRootLNode;
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
export function addRemoveViewFromContainer(container, rootNode, insertMode, beforeNode) {
    ngDevMode && assertNodeType(container, 0 /* Container */);
    ngDevMode && assertNodeType(rootNode, 2 /* View */);
    const parentNode = container.data[RENDER_PARENT];
    const parent = parentNode ? parentNode.native : null;
    if (parent) {
        let node = getChildLNode(rootNode);
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
                next = container[VIEWS][0].data;
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
export function insertView(container, viewNode, index) {
    const state = container.data;
    const views = state[VIEWS];
    const lView = viewNode.data;
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
        lView[CONTAINER_INDEX] = container.tNode.parent.index;
        viewNode.view = container.view;
    }
    // Notify query that a new view has been added
    if (lView[QUERIES]) {
        lView[QUERIES].insertView(index);
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
 * @param container The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @returns The detached view
 */
export function detachView(container, removeIndex) {
    const views = container.data[VIEWS];
    const viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data[NEXT] = viewNode.data[NEXT];
    }
    views.splice(removeIndex, 1);
    if (!container.tNode.detached) {
        addRemoveViewFromContainer(container, viewNode, false);
    }
    // Notify query that view has been removed
    const removedLView = viewNode.data;
    if (removedLView[QUERIES]) {
        removedLView[QUERIES].removeView();
    }
    removedLView[CONTAINER_INDEX] = -1;
    viewNode.view = null;
    // Unsets the attached flag
    viewNode.data[FLAGS] &= ~8 /* Attached */;
    return viewNode;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param container The container from which to remove a view
 * @param removeIndex The index of the view to remove
 * @returns The removed view
 */
export function removeView(container, removeIndex) {
    const viewNode = container.data[VIEWS][removeIndex];
    detachView(container, removeIndex);
    destroyLView(viewNode.data);
    return viewNode;
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
 * @param state The LViewOrLContainer for which we need a parent state
 * @param rootView The rootView, so we don't propagate too far up the view tree
 * @returns The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    let node;
    if ((node = state[HOST_NODE]) && node.tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getParentLNode(node).data;
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
export function canInsertNativeNode(parent, currentView) {
    // We can only insert into a Component or View. Any other type should be an Error.
    ngDevMode && assertNodeOfPossibleTypes(parent, 3 /* Element */, 4 /* ElementContainer */, 2 /* View */);
    if (parent.tNode.type === 3 /* Element */ || parent.tNode.type === 4 /* ElementContainer */) {
        // Parent is an element.
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
        else {
            // Parent is a Component. Component's content nodes are not inserted immediately
            // because they will be projected, and so doing insert at this point would be wasteful.
            // Since the projection would than move it to its final destination.
            return false;
        }
    }
    else {
        // Parent is a View.
        ngDevMode && assertNodeType(parent, 2 /* View */);
        // Because we are inserting into a `View` the `View` may be disconnected.
        const grandParentContainer = getParentLNode(parent);
        if (grandParentContainer == null) {
            // The `View` is not inserted into a `Container` we have to delay insertion.
            return false;
        }
        ngDevMode && assertNodeType(grandParentContainer, 0 /* Container */);
        if (grandParentContainer.data[RENDER_PARENT] == null) {
            // The parent `Container` itself is disconnected. So we have to delay.
            return false;
        }
        else {
            // The parent `Container` is in inserted state, so we can eagerly insert into
            // this location.
            return true;
        }
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
 * @param parent The parent to which to append the child
 * @param child The child that should be appended
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export function appendChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        const renderer = currentView[RENDERER];
        if (parent.tNode.type === 2 /* View */) {
            const container = getParentLNode(parent);
            const renderParent = container.data[RENDER_PARENT];
            const views = container.data[VIEWS];
            const index = views.indexOf(parent);
            const beforeNode = index + 1 < views.length ? (getChildLNode(views[index + 1])).native : container.native;
            nativeInsertBefore(renderer, renderParent.native, child, beforeNode);
        }
        else if (parent.tNode.type === 4 /* ElementContainer */) {
            const beforeNode = parent.native;
            const grandParent = getParentLNode(parent);
            if (grandParent.tNode.type === 2 /* View */) {
                const renderParent = getRenderParent(grandParent);
                nativeInsertBefore(renderer, renderParent.native, child, beforeNode);
            }
            else {
                nativeInsertBefore(renderer, grandParent.native, child, beforeNode);
            }
        }
        else {
            isProceduralRenderer(renderer) ? renderer.appendChild(parent.native, child) :
                parent.native.appendChild(child);
        }
        return true;
    }
    return false;
}
/**
 * Removes the `child` element of the `parent` from the DOM.
 *
 * @param parent The parent from which to remove the child
 * @param child The child that should be removed
 * @param currentView The current LView
 * @returns Whether or not the child was removed
 */
export function removeChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        // We only remove the element if not in View or not projected.
        const renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.removeChild(parent.native, child) :
            parent.native.removeChild(child);
        return true;
    }
    return false;
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param node The node to process
 * @param currentParent The last parent element to be processed
 * @param currentView Current LView
 */
export function appendProjectedNode(node, currentParent, currentView, renderParent) {
    appendChild(currentParent, node.native, currentView);
    if (node.tNode.type === 0 /* Container */) {
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        const lContainer = node.data;
        lContainer[RENDER_PARENT] = renderParent;
        const views = lContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(node, views[i], true, node.native);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(currentParent, node.dynamicLContainerNode.native, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsSCxPQUFPLEVBQWtJLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVNLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQW1FLG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzTixPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFbkQsTUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBRWhGLHFEQUFxRDtBQUNyRCxNQUFNLHVCQUF1QixJQUFXO0lBQ3RD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QztRQUNqRCxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsWUFBWSxDQUFDO1FBQ3pDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQywwQkFBMEIsQ0FBQyxJQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2pGO0tBQ0Y7SUFDRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUM5QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLFlBQVksQ0FBQztRQUM5RCxXQUFXLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDNUU7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnRDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgRElSRUNUSVZFUywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgSG9va0RhdGEsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtyZWFkRWxlbWVudFZhbHVlLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHNpYmxpbmcgbm9kZSBmb3IgdGhlIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIC8vIFZpZXcgbm9kZXMgZG9uJ3QgaGF2ZSBUTm9kZXMsIHNvIHRoZWlyIG5leHQgbXVzdCBiZSByZXRyaWV2ZWQgdGhyb3VnaCB0aGVpciBMVmlldy5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gICAgcmV0dXJuIHZpZXdEYXRhW05FWFRdID8gKHZpZXdEYXRhW05FWFRdIGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG5vZGUudE5vZGUubmV4dCA/IG5vZGUudmlld1tub2RlLnROb2RlLm5leHQuaW5kZXhdIDogbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgZmlyc3QgY2hpbGQgb2YgYSBnaXZlbiBub2RlICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hpbGRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5jaGlsZCkge1xuICAgIGNvbnN0IHZpZXdEYXRhID0gbm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/IG5vZGUuZGF0YSBhcyBMVmlld0RhdGEgOiBub2RlLnZpZXc7XG4gICAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUodmlld0RhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleF0pO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBwYXJlbnQgTE5vZGUgb2YgYSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKFxuICAgIG5vZGU6IExDb250YWluZXJOb2RlIHwgTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFRleHROb2RlIHxcbiAgICBMUHJvamVjdGlvbk5vZGUpOiBMRWxlbWVudE5vZGV8TEVsZW1lbnRDb250YWluZXJOb2RlfExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMVmlld05vZGUpOiBMQ29udGFpbmVyTm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExFbGVtZW50Q29udGFpbmVyTm9kZXxMQ29udGFpbmVyTm9kZXxcbiAgICBMVmlld05vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMRWxlbWVudENvbnRhaW5lck5vZGV8TENvbnRhaW5lck5vZGV8XG4gICAgTFZpZXdOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5pbmRleCA9PT0gLTEgJiYgbm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgaW5zaWRlIGEgZHluYW1pYyBjb250YWluZXIuXG4gICAgLy8gSWYgdGhlIGhvc3QgaW5kZXggaXMgLTEsIHRoZSB2aWV3IGhhcyBub3QgeWV0IGJlZW4gaW5zZXJ0ZWQsIHNvIGl0IGhhcyBubyBwYXJlbnQuXG4gICAgY29uc3QgY29udGFpbmVySG9zdEluZGV4ID0gKG5vZGUuZGF0YSBhcyBMVmlld0RhdGEpW0NPTlRBSU5FUl9JTkRFWF07XG4gICAgcmV0dXJuIGNvbnRhaW5lckhvc3RJbmRleCA9PT0gLTEgPyBudWxsIDogbm9kZS52aWV3W2NvbnRhaW5lckhvc3RJbmRleF0uZHluYW1pY0xDb250YWluZXJOb2RlO1xuICB9XG4gIGNvbnN0IHBhcmVudCA9IG5vZGUudE5vZGUucGFyZW50O1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZShwYXJlbnQgPyBub2RlLnZpZXdbcGFyZW50LmluZGV4XSA6IG5vZGUudmlld1tIT1NUX05PREVdKTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBMRWxlbWVudE5vZGUgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YXRjaGVkIHRvIGFueSBjb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlclBhcmVudCh2aWV3Tm9kZTogTFZpZXdOb2RlKTogTEVsZW1lbnROb2RlfG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRQYXJlbnRMTm9kZSh2aWV3Tm9kZSk7XG4gIHJldHVybiBjb250YWluZXIgPyBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA6IG51bGw7XG59XG5cbmNvbnN0IGVudW0gV2Fsa0xOb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDAsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAxLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMixcbn1cblxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHdhbGtMTm9kZVRyZWUuXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHdhbGtMTm9kZVRyZWUgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IExQcm9qZWN0aW9uTm9kZVtdID0gW107XG5cbi8qKlxuICogV2Fsa3MgYSB0cmVlIG9mIExOb2RlcywgYXBwbHlpbmcgYSB0cmFuc2Zvcm1hdGlvbiBvbiB0aGUgTEVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqXG4gKiBAcGFyYW0gc3RhcnRpbmdOb2RlIHRoZSBub2RlIGZyb20gd2hpY2ggdGhlIHdhbGsgaXMgc3RhcnRlZC5cbiAqIEBwYXJhbSByb290Tm9kZSB0aGUgcm9vdCBub2RlIGNvbnNpZGVyZWQuIFRoaXMgcHJldmVudHMgd2Fsa2luZyBwYXN0IHRoYXQgbm9kZS5cbiAqIEBwYXJhbSBhY3Rpb24gaWRlbnRpZmllcyB0aGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgTEVsZW1lbnQgbm9kZXMuXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIGN1cnJlbnQgcmVuZGVyZXIuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50Tm9kZSBPcHRpb25hbCB0aGUgcmVuZGVyIHBhcmVudCBub2RlIHRvIGJlIHNldCBpbiBhbGwgTENvbnRhaW5lck5vZGVzIGZvdW5kLFxuICogcmVxdWlyZWQgZm9yIGFjdGlvbiBtb2RlcyBJbnNlcnQgYW5kIERlc3Ryb3kuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBPcHRpb25hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBJbnNlcnQuXG4gKi9cbmZ1bmN0aW9uIHdhbGtMTm9kZVRyZWUoXG4gICAgc3RhcnRpbmdOb2RlOiBMTm9kZSB8IG51bGwsIHJvb3ROb2RlOiBMTm9kZSwgYWN0aW9uOiBXYWxrTE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHJlbmRlclBhcmVudE5vZGU/OiBMRWxlbWVudE5vZGUgfCBudWxsLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gc3RhcnRpbmdOb2RlO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgY29uc3QgcGFyZW50ID0gcmVuZGVyUGFyZW50Tm9kZSA/IHJlbmRlclBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgICBjb25zdCBub2RlVHlwZSA9IG5vZGUudE5vZGUudHlwZTtcbiAgICBpZiAobm9kZVR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAvLyBFeGVjdXRlIHRoZSBhY3Rpb25cbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudCwgbm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5vZGVUeXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIGlmIChyZW5kZXJQYXJlbnROb2RlKSB7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudE5vZGU7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXS5sZW5ndGggPyBnZXRDaGlsZExOb2RlKGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU11bMF0pIDogbnVsbDtcbiAgICAgIGlmIChuZXh0Tm9kZSkge1xuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZW50ZXJzIGEgY29udGFpbmVyLCB0aGVuIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZWNvbWUgdGhlIGxvY2FsIG5hdGl2ZVxuICAgICAgICAvLyBjb21tZW50IG5vZGUuXG4gICAgICAgIGJlZm9yZU5vZGUgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSA6XG4gICAgICAgICAgICBsQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBmaW5kQ29tcG9uZW50SG9zdChub2RlLnZpZXcpO1xuICAgICAgY29uc3QgaGVhZCA9XG4gICAgICAgICAgKGNvbXBvbmVudEhvc3QudE5vZGUucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW25vZGUudE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBub2RlIGFzIExQcm9qZWN0aW9uTm9kZTtcblxuICAgICAgbmV4dE5vZGUgPSBoZWFkID8gKGNvbXBvbmVudEhvc3QuZGF0YSBhcyBMVmlld0RhdGEpW1BBUkVOVF0gIVtoZWFkLmluZGV4XSA6IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBsb29rIGF0IHRoZSBmaXJzdCBjaGlsZFxuICAgICAgbmV4dE5vZGUgPSBnZXRDaGlsZExOb2RlKG5vZGUgYXMgTFZpZXdOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAobmV4dE5vZGUgPT09IG51bGwpIHtcbiAgICAgIG5leHROb2RlID0gZ2V0TmV4dExOb2RlKG5vZGUpO1xuXG4gICAgICAvLyB0aGlzIGxhc3Qgbm9kZSB3YXMgcHJvamVjdGVkLCB3ZSBuZWVkIHRvIGdldCBiYWNrIGRvd24gdG8gaXRzIHByb2plY3Rpb24gbm9kZVxuICAgICAgaWYgKG5leHROb2RlID09PSBudWxsICYmIChub2RlLnROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkpIHtcbiAgICAgICAgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGUocHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIExOb2RlKTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAgICAgICAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICAgICAgICpcbiAgICAgICAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhlbiBpdCBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gICAgICAgKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAgICAgICAqL1xuICAgICAgd2hpbGUgKG5vZGUgJiYgIW5leHROb2RlKSB7XG4gICAgICAgIG5vZGUgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgICAgICAgaWYgKG5vZGUgPT09IG51bGwgfHwgbm9kZSA9PT0gcm9vdE5vZGUpIHJldHVybiBudWxsO1xuXG4gICAgICAgIC8vIFdoZW4gZXhpdGluZyBhIGNvbnRhaW5lciwgdGhlIGJlZm9yZU5vZGUgbXVzdCBiZSByZXN0b3JlZCB0byB0aGUgcHJldmlvdXMgdmFsdWVcbiAgICAgICAgaWYgKCFub2RlLnROb2RlLm5leHQgJiYgbm9kZVR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgICBiZWZvcmVOb2RlID0gbm9kZS5uYXRpdmU7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIG5vZGUgPSBuZXh0Tm9kZTtcbiAgfVxufVxuXG5cbi8qKlxuICogR2l2ZW4gYSBjdXJyZW50IHZpZXcsIGZpbmRzIHRoZSBuZWFyZXN0IGNvbXBvbmVudCdzIGhvc3QgKExFbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIExWaWV3RGF0YSBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50SG9zdChsVmlld0RhdGE6IExWaWV3RGF0YSk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCB2aWV3Um9vdExOb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG5cbiAgd2hpbGUgKHZpZXdSb290TE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld0RhdGFbUEFSRU5UXSwgJ2xWaWV3RGF0YS5wYXJlbnQnKTtcbiAgICBsVmlld0RhdGEgPSBsVmlld0RhdGFbUEFSRU5UXSAhO1xuICAgIHZpZXdSb290TE5vZGUgPSBsVmlld0RhdGFbSE9TVF9OT0RFXTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh2aWV3Um9vdExOb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdSb290TE5vZGUuZGF0YSwgJ25vZGUuZGF0YScpO1xuXG4gIHJldHVybiB2aWV3Um9vdExOb2RlIGFzIExFbGVtZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBOT1RFOiBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIHBvc3NpYmxlIGFjdGlvbnMgYXJlIGlubGluZWQgd2l0aGluIHRoZSBmdW5jdGlvbiBpbnN0ZWFkIG9mXG4gKiBiZWluZyBwYXNzZWQgYXMgYW4gYXJndW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgIGFjdGlvbjogV2Fsa0xOb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCB8IG51bGwsXG4gICAgbm9kZTogUkNvbW1lbnQgfCBSRWxlbWVudCB8IFJUZXh0LCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uSW5zZXJ0KSB7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuaW5zZXJ0QmVmb3JlKHBhcmVudCAhLCBub2RlLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCkgOlxuICAgICAgICBwYXJlbnQgIS5pbnNlcnRCZWZvcmUobm9kZSwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwsIHRydWUpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlciAhKSA/XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5yZW1vdmVDaGlsZChwYXJlbnQgISwgbm9kZSkgOlxuICAgICAgICBwYXJlbnQgIS5yZW1vdmVDaGlsZChub2RlKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95Tm9kZSAhKG5vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh2YWx1ZTogYW55LCByZW5kZXJlcjogUmVuZGVyZXIzKTogUlRleHQge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuY3JlYXRlVGV4dChzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZShzdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBBZGRzIG9yIHJlbW92ZXMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byByZW1vdmUgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgdG8gd2hpY2ggdGhlIHJvb3QgdmlldyBiZWxvbmdzXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogdHJ1ZSxcbiAgICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBib29sZWFuLFxuICAgIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShyb290Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICBjb25zdCBwYXJlbnROb2RlID0gY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF07XG4gIGNvbnN0IHBhcmVudCA9IHBhcmVudE5vZGUgPyBwYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gIGlmIChwYXJlbnQpIHtcbiAgICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGdldENoaWxkTE5vZGUocm9vdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY29udGFpbmVyLnZpZXdbUkVOREVSRVJdO1xuICAgIHdhbGtMTm9kZVRyZWUoXG4gICAgICAgIG5vZGUsIHJvb3ROb2RlLCBpbnNlcnRNb2RlID8gV2Fsa0xOb2RlVHJlZUFjdGlvbi5JbnNlcnQgOiBXYWxrTE5vZGVUcmVlQWN0aW9uLkRldGFjaCxcbiAgICAgICAgcmVuZGVyZXIsIHBhcmVudE5vZGUsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBpZiAocm9vdFZpZXdbVFZJRVddLmNoaWxkSW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuICBsZXQgdmlld09yQ29udGFpbmVyOiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsID0gZ2V0TFZpZXdDaGlsZChyb290Vmlldyk7XG5cbiAgd2hpbGUgKHZpZXdPckNvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmICh2aWV3T3JDb250YWluZXIubGVuZ3RoID49IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIElmIExWaWV3RGF0YSwgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhO1xuICAgICAgaWYgKHZpZXdbVFZJRVddLmNoaWxkSW5kZXggPiAtMSkgbmV4dCA9IGdldExWaWV3Q2hpbGQodmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIGNvbnRhaW5lciwgdHJhdmVyc2UgZG93biB0byBpdHMgZmlyc3QgTFZpZXdEYXRhLlxuICAgICAgY29uc3QgY29udGFpbmVyID0gdmlld09yQ29udGFpbmVyIGFzIExDb250YWluZXI7XG4gICAgICBpZiAoY29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIG5leHQgPSBjb250YWluZXJbVklFV1NdWzBdLmRhdGE7XG4gICAgfVxuXG4gICAgaWYgKG5leHQgPT0gbnVsbCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhW05FWFRdICYmIHZpZXdPckNvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyKTtcbiAgICAgICAgdmlld09yQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUodmlld09yQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgfHwgcm9vdFZpZXcpO1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lciAmJiB2aWV3T3JDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSB2aWV3Tm9kZSBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3XG4gKiBAcmV0dXJucyBUaGUgaW5zZXJ0ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCB2aWV3Tm9kZTogTFZpZXdOb2RlLCBpbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250YWluZXIuZGF0YTtcbiAgY29uc3Qgdmlld3MgPSBzdGF0ZVtWSUVXU107XG4gIGNvbnN0IGxWaWV3ID0gdmlld05vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIHZpZXdzW2luZGV4IC0gMV0uZGF0YVtORVhUXSA9IGxWaWV3O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgbFZpZXdbTkVYVF0gPSB2aWV3c1tpbmRleF0uZGF0YTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKHZpZXdOb2RlKTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICAvLyBEeW5hbWljYWxseSBpbnNlcnRlZCB2aWV3cyBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIHBhcmVudCBjb250YWluZXInUyBob3N0IHNvIGl0J3NcbiAgLy8gcG9zc2libGUgdG8ganVtcCBmcm9tIGEgdmlldyB0byBpdHMgY29udGFpbmVyJ3MgbmV4dCB3aGVuIHdhbGtpbmcgdGhlIG5vZGUgdHJlZS5cbiAgaWYgKHZpZXdOb2RlLnROb2RlLmluZGV4ID09PSAtMSkge1xuICAgIGxWaWV3W0NPTlRBSU5FUl9JTkRFWF0gPSBjb250YWluZXIudE5vZGUucGFyZW50ICEuaW5kZXg7XG4gICAgKHZpZXdOb2RlIGFze3ZpZXc6IExWaWV3RGF0YX0pLnZpZXcgPSBjb250YWluZXIudmlldztcbiAgfVxuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IGEgbmV3IHZpZXcgaGFzIGJlZW4gYWRkZWRcbiAgaWYgKGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgbFZpZXdbUVVFUklFU10gIS5pbnNlcnRWaWV3KGluZGV4KTtcbiAgfVxuXG4gIC8vIFNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBUaGUgZGV0YWNoZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gIGNvbnN0IHZpZXdOb2RlID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXS5kYXRhW05FWFRdID0gdmlld05vZGUuZGF0YVtORVhUXSBhcyBMVmlld0RhdGE7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgaWYgKCFjb250YWluZXIudE5vZGUuZGV0YWNoZWQpIHtcbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIHZpZXdOb2RlLCBmYWxzZSk7XG4gIH1cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgdmlldyBoYXMgYmVlbiByZW1vdmVkXG4gIGNvbnN0IHJlbW92ZWRMVmlldyA9IHZpZXdOb2RlLmRhdGE7XG4gIGlmIChyZW1vdmVkTFZpZXdbUVVFUklFU10pIHtcbiAgICByZW1vdmVkTFZpZXdbUVVFUklFU10gIS5yZW1vdmVWaWV3KCk7XG4gIH1cbiAgcmVtb3ZlZExWaWV3W0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgKHZpZXdOb2RlIGFze3ZpZXc6IExWaWV3RGF0YSB8IG51bGx9KS52aWV3ID0gbnVsbDtcbiAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIHZpZXdOb2RlLmRhdGFbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lciwgaS5lLiBkZXRhY2hlcyBpdCBhbmQgdGhlbiBkZXN0cm95cyB0aGUgdW5kZXJseWluZyBMVmlldy5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICogQHJldHVybnMgVGhlIHJlbW92ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld05vZGUgPSBjb250YWluZXIuZGF0YVtWSUVXU11bcmVtb3ZlSW5kZXhdO1xuICBkZXRhY2hWaWV3KGNvbnRhaW5lciwgcmVtb3ZlSW5kZXgpO1xuICBkZXN0cm95TFZpZXcodmlld05vZGUuZGF0YSk7XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIGNoaWxkIG9mIHRoZSBnaXZlbiBMVmlld0RhdGEgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld0NoaWxkKHZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld0RhdGF8TENvbnRhaW5lcnxudWxsIHtcbiAgaWYgKHZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaG9zdE5vZGU6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZSA9IHZpZXdEYXRhW3ZpZXdEYXRhW1RWSUVXXS5jaGlsZEluZGV4XTtcblxuICByZXR1cm4gaG9zdE5vZGUuZGF0YSA/IGhvc3ROb2RlLmRhdGEgOiAoaG9zdE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xufVxuXG4vKipcbiAqIEEgc3RhbmRhbG9uZSBmdW5jdGlvbiB3aGljaCBkZXN0cm95cyBhbiBMVmlldyxcbiAqIGNvbmR1Y3RpbmcgY2xlYW51cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gYmUgZGVzdHJveWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUxWaWV3KHZpZXc6IExWaWV3RGF0YSkge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgd2Fsa0xOb2RlVHJlZSh2aWV3W0hPU1RfTk9ERV0sIHZpZXdbSE9TVF9OT0RFXSwgV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXN0cm95LCByZW5kZXJlcik7XG4gIH1cbiAgZGVzdHJveVZpZXdUcmVlKHZpZXcpO1xuICAvLyBTZXRzIHRoZSBkZXN0cm95ZWQgZmxhZ1xuICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUoc3RhdGU6IExWaWV3RGF0YSB8IExDb250YWluZXIsIHJvb3RWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGF8XG4gICAgTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IG5vZGU7XG4gIGlmICgobm9kZSA9IChzdGF0ZSBhcyBMVmlld0RhdGEpICFbSE9TVF9OT0RFXSkgJiYgbm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gZ2V0UGFyZW50TE5vZGUobm9kZSkgIS5kYXRhIGFzIGFueTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gc3RhdGVbUEFSRU5UXSA9PT0gcm9vdFZpZXcgPyBudWxsIDogc3RhdGVbUEFSRU5UXTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBhbmQgY2FsbCBhbGwgb25EZXN0cm95cyBpbiBhIGdpdmVuIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3RGF0YSB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YSB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKCh2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhKVtUVklFV10pIHtcbiAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gICAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gICAgZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhcyBjbGVhbiB1cCB0aW1lLlxuICAgIGlmICh2aWV3W1RWSUVXXS5pZCA9PT0gLTEgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgY2xlYW51cCA9IHZpZXdEYXRhW1RWSUVXXS5jbGVhbnVwICE7XG4gIGlmIChjbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHRoZSBuYXRpdmUgcmVuZGVyZXJcbiAgICAgICAgY29uc3QgbmF0aXZlID0gcmVhZEVsZW1lbnRWYWx1ZSh2aWV3RGF0YVtjbGVhbnVwW2kgKyAxXV0pLm5hdGl2ZTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDJdXTtcbiAgICAgICAgbmF0aXZlLnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xlYW51cFtpXSwgbGlzdGVuZXIsIGNsZWFudXBbaSArIDNdKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggcmVuZGVyZXIyIChjbGVhbnVwIGZuIGNhbiBiZSBmb3VuZCBieSBpbmRleClcbiAgICAgICAgY29uc3QgY2xlYW51cEZuID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2ldXTtcbiAgICAgICAgY2xlYW51cEZuKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMV1dO1xuICAgICAgICBjbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXdEYXRhW0NMRUFOVVBdID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgY2FsbEhvb2tzKHZpZXdbRElSRUNUSVZFU10gISwgZGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKiogQ2FsbHMgcGlwZSBkZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHBpcGVEZXN0cm95SG9va3MgPSB2aWV3RGF0YVtUVklFV10gJiYgdmlld0RhdGFbVFZJRVddLnBpcGVEZXN0cm95SG9va3M7XG4gIGlmIChwaXBlRGVzdHJveUhvb2tzKSB7XG4gICAgY2FsbEhvb2tzKHZpZXdEYXRhICEsIHBpcGVEZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgbmF0aXZlIGVsZW1lbnQgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYXJlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgd2hlcmUgdGhlIGNoaWxkIHdpbGwgYmUgaW5zZXJ0ZWQgaW50by5cbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIHRoZSBjaGlsZCBzaG91bGQgYmUgaW5zZXJ0ZWQgbm93IChvciBkZWxheWVkIHVudGlsIGxhdGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50OiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICAvLyBXZSBjYW4gb25seSBpbnNlcnQgaW50byBhIENvbXBvbmVudCBvciBWaWV3LiBBbnkgb3RoZXIgdHlwZSBzaG91bGQgYmUgYW4gRXJyb3IuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuVmlldyk7XG5cbiAgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCBwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAvLyBQYXJlbnQgaXMgYW4gZWxlbWVudC5cbiAgICBpZiAocGFyZW50LnZpZXcgIT09IGN1cnJlbnRWaWV3KSB7XG4gICAgICAvLyBJZiB0aGUgUGFyZW50IHZpZXcgaXMgbm90IHRoZSBzYW1lIGFzIGN1cnJlbnQgdmlldyB0aGFuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzXG4gICAgICAvLyBWaWV3cy4gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaW5zZXJ0IGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvXG4gICAgICAvLyB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmQgaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBQYXJlbnQgZWxlbWVudHMgY2FuIGJlIGEgY29tcG9uZW50IHdoaWNoIG1heSBoYXZlIHByb2plY3Rpb24uXG4gICAgaWYgKHBhcmVudC5kYXRhID09PSBudWxsKSB7XG4gICAgICAvLyBQYXJlbnQgaXMgYSByZWd1bGFyIG5vbi1jb21wb25lbnQgZWxlbWVudC4gV2Ugc2hvdWxkIGVhZ2VybHkgaW5zZXJ0IGludG8gaXRcbiAgICAgIC8vIHNpbmNlIHdlIGtub3cgdGhhdCB0aGlzIHJlbGF0aW9uc2hpcCB3aWxsIG5ldmVyIGJlIGJyb2tlbi5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQYXJlbnQgaXMgYSBDb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAgICAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gICAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGFuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBQYXJlbnQgaXMgYSBWaWV3LlxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwYXJlbnQsIFROb2RlVHlwZS5WaWV3KTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgYXJlIGluc2VydGluZyBpbnRvIGEgYFZpZXdgIHRoZSBgVmlld2AgbWF5IGJlIGRpc2Nvbm5lY3RlZC5cbiAgICBjb25zdCBncmFuZFBhcmVudENvbnRhaW5lciA9IGdldFBhcmVudExOb2RlKHBhcmVudCkgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgaWYgKGdyYW5kUGFyZW50Q29udGFpbmVyID09IG51bGwpIHtcbiAgICAgIC8vIFRoZSBgVmlld2AgaXMgbm90IGluc2VydGVkIGludG8gYSBgQ29udGFpbmVyYCB3ZSBoYXZlIHRvIGRlbGF5IGluc2VydGlvbi5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGdyYW5kUGFyZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBpZiAoZ3JhbmRQYXJlbnRDb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA9PSBudWxsKSB7XG4gICAgICAvLyBUaGUgcGFyZW50IGBDb250YWluZXJgIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIFNvIHdlIGhhdmUgdG8gZGVsYXkuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBwYXJlbnQgYENvbnRhaW5lcmAgaXMgaW4gaW5zZXJ0ZWQgc3RhdGUsIHNvIHdlIGNhbiBlYWdlcmx5IGluc2VydCBpbnRvXG4gICAgICAvLyB0aGlzIGxvY2F0aW9uLlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5hdGl2ZSBub2RlIGJlZm9yZSBhbm90aGVyIG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIHBhcmVudCB1c2luZyB7QGxpbmsgUmVuZGVyZXIzfS5cbiAqIFRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBuYXRpdmUgbm9kZXMgd2VyZSBkZXRlcm1pbmVkIC0gaXQgYWJzdHJhY3RzIGFuXG4gKiBhY3R1YWwgcmVuZGVyZXIgYmVpbmcgdXNlZC5cbiAqL1xuZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50Lmluc2VydEJlZm9yZShjaGlsZCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUocGFyZW50KSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICAgICAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gICAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YocGFyZW50IGFzIExWaWV3Tm9kZSk7XG4gICAgICBjb25zdCBiZWZvcmVOb2RlID1cbiAgICAgICAgICBpbmRleCArIDEgPCB2aWV3cy5sZW5ndGggPyAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1tpbmRleCArIDFdKSAhKS5uYXRpdmUgOiBjb250YWluZXIubmF0aXZlO1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQgIS5uYXRpdmUsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgICB9IGVsc2UgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgY29uc3QgYmVmb3JlTm9kZSA9IHBhcmVudC5uYXRpdmU7XG4gICAgICBjb25zdCBncmFuZFBhcmVudCA9IGdldFBhcmVudExOb2RlKHBhcmVudCkgYXMgTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlO1xuICAgICAgaWYgKGdyYW5kUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudChncmFuZFBhcmVudCBhcyBMVmlld05vZGUpO1xuICAgICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCAhLm5hdGl2ZSwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCAoZ3JhbmRQYXJlbnQgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmUsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50Lm5hdGl2ZSAhYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgYGNoaWxkYCBlbGVtZW50IG9mIHRoZSBgcGFyZW50YCBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IGZyb20gd2hpY2ggdG8gcmVtb3ZlIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2hpbGQocGFyZW50OiBMTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgcmVtb3ZlIHRoZSBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50Lm5hdGl2ZSBhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgY3VycmVudFBhcmVudDogTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTFZpZXdOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLFxuICAgIHJlbmRlclBhcmVudDogTEVsZW1lbnROb2RlKTogdm9pZCB7XG4gIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgY29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIGFuIGVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbiB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKG5vZGUgYXMgTENvbnRhaW5lck5vZGUsIHZpZXdzW2ldLCB0cnVlLCBub2RlLm5hdGl2ZSk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnQ7XG4gICAgYXBwZW5kQ2hpbGQoY3VycmVudFBhcmVudCwgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH1cbn1cbiJdfQ==