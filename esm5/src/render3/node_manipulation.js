/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { callHooks } from './hooks';
import { RENDER_PARENT, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { stringify } from './util';
var unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Returns the first RNode following the given LNode in the same parent DOM element.
 *
 * This is needed in order to insert the given node with insertBefore.
 *
 * @param node The node whose following DOM node must be found.
 * @param stopNode A parent node at which the lookup in the tree should be stopped, or null if the
 * lookup should not be stopped until the result is found.
 * @returns RNode before which the provided node should be inserted or null if the lookup was
 * stopped
 * or if there is no native node after the given logical node in the same native parent.
 */
function findNextRNodeSibling(node, stopNode) {
    var currentNode = node;
    while (currentNode && currentNode !== stopNode) {
        var pNextOrParent = currentNode.pNextOrParent;
        if (pNextOrParent) {
            while (pNextOrParent.tNode.type !== 1 /* Projection */) {
                var nativeNode = findFirstRNode(pNextOrParent);
                if (nativeNode) {
                    return nativeNode;
                }
                pNextOrParent = pNextOrParent.pNextOrParent;
            }
            currentNode = pNextOrParent;
        }
        else {
            var currentSibling = getNextLNode(currentNode);
            while (currentSibling) {
                var nativeNode = findFirstRNode(currentSibling);
                if (nativeNode) {
                    return nativeNode;
                }
                currentSibling = getNextLNode(currentSibling);
            }
            var parentNode = getParentLNode(currentNode);
            currentNode = null;
            if (parentNode) {
                var parentType = parentNode.tNode.type;
                if (parentType === 0 /* Container */ || parentType === 2 /* View */) {
                    currentNode = parentNode;
                }
            }
        }
    }
    return null;
}
/** Retrieves the sibling node for the given node. */
export function getNextLNode(node) {
    // View nodes don't have TNodes, so their next must be retrieved through their LView.
    if (node.tNode.type === 2 /* View */) {
        var viewData = node.data;
        return viewData[NEXT] ? viewData[NEXT][HOST_NODE] : null;
    }
    return node.tNode.next ? node.view[node.tNode.next.index] : null;
}
/** Retrieves the first child of a given node */
export function getChildLNode(node) {
    if (node.tNode.child) {
        var viewData = node.tNode.type === 2 /* View */ ? node.data : node.view;
        return viewData[node.tNode.child.index];
    }
    return null;
}
export function getParentLNode(node) {
    if (node.tNode.index === -1)
        return null;
    var parent = node.tNode.parent;
    return parent ? node.view[parent.index] : node.view[HOST_NODE];
}
/**
 * Get the next node in the LNode tree, taking into account the place where a node is
 * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
 *
 * @param node The node whose next node in the LNode tree must be found.
 * @return LNode|null The next sibling in the LNode tree.
 */
function getNextLNodeWithProjection(node) {
    var pNextOrParent = node.pNextOrParent;
    if (pNextOrParent) {
        // The node is projected
        var isLastProjectedNode = pNextOrParent.tNode.type === 1 /* Projection */;
        // returns pNextOrParent if we are not at the end of the list, null otherwise
        return isLastProjectedNode ? null : pNextOrParent;
    }
    // returns node.next because the the node is not projected
    return getNextLNode(node);
}
/**
 * Find the next node in the LNode tree, taking into account the place where a node is
 * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
 *
 * If there is no sibling node, this function goes to the next sibling of the parent node...
 * until it reaches rootNode (at which point null is returned).
 *
 * @param initialNode The node whose following node in the LNode tree must be found.
 * @param rootNode The root node at which the lookup should stop.
 * @return LNode|null The following node in the LNode tree.
 */
function getNextOrParentSiblingNode(initialNode, rootNode) {
    var node = initialNode;
    var nextNode = getNextLNodeWithProjection(node);
    while (node && !nextNode) {
        // if node.pNextOrParent is not null here, it is not the next node
        // (because, at this point, nextNode is null, so it is the parent)
        node = node.pNextOrParent || getParentLNode(node);
        if (node === rootNode) {
            return null;
        }
        nextNode = node && getNextLNodeWithProjection(node);
    }
    return nextNode;
}
/**
 * Returns the first RNode inside the given LNode.
 *
 * @param node The node whose first DOM node must be found
 * @returns RNode The first RNode of the given LNode or null if there is none.
 */
function findFirstRNode(rootNode) {
    return walkLNodeTree(rootNode, rootNode, 0 /* Find */) || null;
}
/**
 * Walks a tree of LNodes, applying a transformation on the LElement nodes, either only on the first
 * one found, or on all of them.
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 *
 * @param startingNode the node from which the walk is started.
 * @param rootNode the root node considered.
 * @param action Identifies the action to be performed on the LElement nodes.
 * @param renderer Optional the current renderer, required for action modes 1, 2 and 3.
 * @param renderParentNode Optionnal the render parent node to be set in all LContainerNodes found,
 * required for action modes 1 and 2.
 * @param beforeNode Optionnal the node before which elements should be added, required for action
 * modes 1.
 */
function walkLNodeTree(startingNode, rootNode, action, renderer, renderParentNode, beforeNode) {
    var node = startingNode;
    while (node) {
        var nextNode = null;
        if (node.tNode.type === 3 /* Element */) {
            // Execute the action
            if (action === 0 /* Find */) {
                return node.native;
            }
            else if (action === 1 /* Insert */) {
                var parent_1 = renderParentNode.native;
                isProceduralRenderer(renderer) ?
                    renderer
                        .insertBefore(parent_1, node.native, beforeNode) :
                    parent_1.insertBefore(node.native, beforeNode, true);
            }
            else if (action === 2 /* Detach */) {
                var parent_2 = renderParentNode.native;
                isProceduralRenderer(renderer) ?
                    renderer.removeChild(parent_2, node.native) :
                    parent_2.removeChild(node.native);
            }
            else if (action === 3 /* Destroy */) {
                ngDevMode && ngDevMode.rendererDestroyNode++;
                renderer.destroyNode(node.native);
            }
            nextNode = getNextLNode(node);
        }
        else if (node.tNode.type === 0 /* Container */) {
            var lContainerNode = node;
            var childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            if (renderParentNode) {
                childContainerData[RENDER_PARENT] = renderParentNode;
            }
            nextNode =
                childContainerData[VIEWS].length ? getChildLNode(childContainerData[VIEWS][0]) : null;
        }
        else if (node.tNode.type === 1 /* Projection */) {
            // For Projection look at the first projected node
            nextNode = node.data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(node);
        }
        node = nextNode === null ? getNextOrParentSiblingNode(node, rootNode) : nextNode;
    }
}
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
        renderer.createTextNode(stringify(value));
}
export function addRemoveViewFromContainer(container, rootNode, insertMode, beforeNode) {
    ngDevMode && assertNodeType(container, 0 /* Container */);
    ngDevMode && assertNodeType(rootNode, 2 /* View */);
    var parentNode = container.data[RENDER_PARENT];
    var parent = parentNode ? parentNode.native : null;
    if (parent) {
        var node = getChildLNode(rootNode);
        var renderer = container.view[RENDERER];
        walkLNodeTree(node, rootNode, insertMode ? 1 /* Insert */ : 2 /* Detach */, renderer, parentNode, beforeNode);
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
    var viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        var next = null;
        if (viewOrContainer.length >= HEADER_OFFSET) {
            // If LViewData, traverse down to child.
            var view = viewOrContainer;
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        else {
            // If container, traverse down to its first LViewData.
            var container = viewOrContainer;
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
    var state = container.data;
    var views = state[VIEWS];
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data[NEXT] = viewNode.data;
    }
    if (index < views.length) {
        viewNode.data[NEXT] = views[index].data;
        views.splice(index, 0, viewNode);
    }
    else {
        views.push(viewNode);
        viewNode.data[NEXT] = null;
    }
    // Notify query that a new view has been added
    var lView = viewNode.data;
    if (lView[QUERIES]) {
        lView[QUERIES].insertView(index);
    }
    // If the container's renderParent is null, we know that it is a root node of its own parent view
    // and we should wait until that parent processes its nodes (otherwise, we will insert this view's
    // nodes twice - once now and once when its parent inserts its views).
    if (container.data[RENDER_PARENT] !== null) {
        var beforeNode = findNextRNodeSibling(viewNode, container);
        if (!beforeNode) {
            var containerNextNativeNode = container.native;
            if (containerNextNativeNode === undefined) {
                containerNextNativeNode = container.native = findNextRNodeSibling(container, null);
            }
            beforeNode = containerNextNativeNode;
        }
        addRemoveViewFromContainer(container, viewNode, true, beforeNode);
    }
    // Sets the attached flag
    viewNode.data[FLAGS] |= 8 /* Attached */;
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
    var views = container.data[VIEWS];
    var viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data[NEXT] = viewNode.data[NEXT];
    }
    views.splice(removeIndex, 1);
    addRemoveViewFromContainer(container, viewNode, false);
    // Notify query that view has been removed
    var removedLview = viewNode.data;
    if (removedLview[QUERIES]) {
        removedLview[QUERIES].removeView();
    }
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
    var viewNode = container.data[VIEWS][removeIndex];
    detachView(container, removeIndex);
    destroyLView(viewNode.data);
    return viewNode;
}
/** Gets the child of the given LViewData */
export function getLViewChild(viewData) {
    if (viewData[TVIEW].childIndex === -1)
        return null;
    var hostNode = viewData[viewData[TVIEW].childIndex];
    return hostNode.data ? hostNode.data : hostNode.dynamicLContainerNode.data;
}
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param view The view to be destroyed.
 */
export function destroyLView(view) {
    var renderer = view[RENDERER];
    if (isProceduralRenderer(renderer) && renderer.destroyNode) {
        walkLNodeTree(view[HOST_NODE], view[HOST_NODE], 3 /* Destroy */, renderer);
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
    var node;
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
        var view = viewOrContainer;
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
    var cleanup = viewData[TVIEW].cleanup;
    if (cleanup != null) {
        for (var i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                // This is a listener with the native renderer
                var native = viewData[cleanup[i + 1]].native;
                var listener = viewData[CLEANUP][cleanup[i + 2]];
                native.removeEventListener(cleanup[i], listener, cleanup[i + 3]);
                i += 2;
            }
            else if (typeof cleanup[i] === 'number') {
                // This is a listener with renderer2 (cleanup fn can be found by index)
                var cleanupFn = viewData[CLEANUP][cleanup[i]];
                cleanupFn();
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                var context = viewData[CLEANUP][cleanup[i + 1]];
                cleanup[i].call(context);
            }
        }
        viewData[CLEANUP] = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(view) {
    var tView = view[TVIEW];
    var destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks(view[DIRECTIVES], destroyHooks);
    }
}
/** Calls pipe destroy hooks for this view */
function executePipeOnDestroys(viewData) {
    var pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(viewData, pipeDestroyHooks);
    }
}
/**
 * Returns whether a native element should be inserted in the given parent.
 *
 * The native node can be inserted when its parent is:
 * - A regular element => Yes
 * - A component host element =>
 *    - if the `currentView` === the parent `view`: The element is in the content (vs the
 *      template)
 *      => don't add as the parent component will project if needed.
 *    - `currentView` !== the parent `view` => The element is in the template (vs the content),
 *      add it
 * - View element => delay insertion, will be done on `viewEnd()`
 *
 * @param parent The parent in which to insert the child
 * @param currentView The LView being processed
 * @return boolean Whether the child element should be inserted.
 */
export function canInsertNativeNode(parent, currentView) {
    var parentIsElement = parent.tNode.type === 3 /* Element */;
    return parentIsElement &&
        (parent.view !== currentView || parent.data === null /* Regular Element. */);
}
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {@link canInsertNativeNode}
 *
 * @param parent The parent to which to append the child
 * @param child The child that should be appended
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export function appendChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        // We only add element if not in View or not projected.
        var renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.appendChild(parent.native, child) :
            parent.native.appendChild(child);
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
export function appendProjectedNode(node, currentParent, currentView) {
    if (node.tNode.type !== 0 /* Container */) {
        appendChild(currentParent, node.native, currentView);
    }
    else {
        // The node we are adding is a Container and we are adding it to Element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assignee the final projection location in those cases.
        var lContainer = node.data;
        lContainer[RENDER_PARENT] = currentParent;
        var views = lContainer[VIEWS];
        for (var i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(node, views[i], true, null);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = currentParent;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFhLGFBQWEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbEgsT0FBTyxFQUF3Riw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUF5RCxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3SixPQUFPLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMxTSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFakMsSUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBRWhGOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsOEJBQThCLElBQWtCLEVBQUUsUUFBc0I7SUFDdEUsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQ3ZCLE9BQU8sV0FBVyxJQUFJLFdBQVcs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RSxDQUFDO1lBQ3RDLDBCQUEwQixDQUFDLElBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRSxDQUFDO0lBQ0gsQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxhQUFhLENBQUM7SUFDakUsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q0xFQU5VUCwgRElSRUNUSVZFUywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgSG9va0RhdGEsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgZm9sbG93aW5nIHRoZSBnaXZlbiBMTm9kZSBpbiB0aGUgc2FtZSBwYXJlbnQgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gaW5zZXJ0IHRoZSBnaXZlbiBub2RlIHdpdGggaW5zZXJ0QmVmb3JlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBET00gbm9kZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHN0b3BOb2RlIEEgcGFyZW50IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBpbiB0aGUgdHJlZSBzaG91bGQgYmUgc3RvcHBlZCwgb3IgbnVsbCBpZiB0aGVcbiAqIGxvb2t1cCBzaG91bGQgbm90IGJlIHN0b3BwZWQgdW50aWwgdGhlIHJlc3VsdCBpcyBmb3VuZC5cbiAqIEByZXR1cm5zIFJOb2RlIGJlZm9yZSB3aGljaCB0aGUgcHJvdmlkZWQgbm9kZSBzaG91bGQgYmUgaW5zZXJ0ZWQgb3IgbnVsbCBpZiB0aGUgbG9va3VwIHdhc1xuICogc3RvcHBlZFxuICogb3IgaWYgdGhlcmUgaXMgbm8gbmF0aXZlIG5vZGUgYWZ0ZXIgdGhlIGdpdmVuIGxvZ2ljYWwgbm9kZSBpbiB0aGUgc2FtZSBuYXRpdmUgcGFyZW50LlxuICovXG5mdW5jdGlvbiBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlOiBMTm9kZSB8IG51bGwsIHN0b3BOb2RlOiBMTm9kZSB8IG51bGwpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gbm9kZTtcbiAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlICE9PSBzdG9wTm9kZSkge1xuICAgIGxldCBwTmV4dE9yUGFyZW50ID0gY3VycmVudE5vZGUucE5leHRPclBhcmVudDtcbiAgICBpZiAocE5leHRPclBhcmVudCkge1xuICAgICAgd2hpbGUgKHBOZXh0T3JQYXJlbnQudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKHBOZXh0T3JQYXJlbnQpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIHBOZXh0T3JQYXJlbnQgPSBwTmV4dE9yUGFyZW50LnBOZXh0T3JQYXJlbnQgITtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gcE5leHRPclBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnROb2RlKTtcbiAgICAgIHdoaWxlIChjdXJyZW50U2libGluZykge1xuICAgICAgICBjb25zdCBuYXRpdmVOb2RlID0gZmluZEZpcnN0Uk5vZGUoY3VycmVudFNpYmxpbmcpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRUeXBlID0gcGFyZW50Tm9kZS50Tm9kZS50eXBlO1xuICAgICAgICBpZiAocGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciB8fCBwYXJlbnRUeXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgc2libGluZyBub2RlIGZvciB0aGUgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZXh0TE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgLy8gVmlldyBub2RlcyBkb24ndCBoYXZlIFROb2Rlcywgc28gdGhlaXIgbmV4dCBtdXN0IGJlIHJldHJpZXZlZCB0aHJvdWdoIHRoZWlyIExWaWV3LlxuICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIGNvbnN0IHZpZXdEYXRhID0gbm9kZS5kYXRhIGFzIExWaWV3RGF0YTtcbiAgICByZXR1cm4gdmlld0RhdGFbTkVYVF0gPyAodmlld0RhdGFbTkVYVF0gYXMgTFZpZXdEYXRhKVtIT1NUX05PREVdIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbm9kZS50Tm9kZS5uZXh0ID8gbm9kZS52aWV3W25vZGUudE5vZGUubmV4dCAhLmluZGV4XSA6IG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIGZpcnN0IGNoaWxkIG9mIGEgZ2l2ZW4gbm9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkTE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuY2hpbGQpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgPyBub2RlLmRhdGEgYXMgTFZpZXdEYXRhIDogbm9kZS52aWV3O1xuICAgIHJldHVybiB2aWV3RGF0YVtub2RlLnROb2RlLmNoaWxkLmluZGV4XTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMUHJvamVjdGlvbk5vZGUpOiBMRWxlbWVudE5vZGV8XG4gICAgTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExWaWV3Tm9kZSk6IExDb250YWluZXJOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGV8TFZpZXdOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGV8TFZpZXdOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5pbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuICBjb25zdCBwYXJlbnQgPSBub2RlLnROb2RlLnBhcmVudDtcbiAgcmV0dXJuIHBhcmVudCA/IG5vZGUudmlld1twYXJlbnQuaW5kZXhdIDogbm9kZS52aWV3W0hPU1RfTk9ERV07XG59XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIG5leHQgc2libGluZyBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgY29uc3QgcE5leHRPclBhcmVudCA9IG5vZGUucE5leHRPclBhcmVudDtcblxuICBpZiAocE5leHRPclBhcmVudCkge1xuICAgIC8vIFRoZSBub2RlIGlzIHByb2plY3RlZFxuICAgIGNvbnN0IGlzTGFzdFByb2plY3RlZE5vZGUgPSBwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uO1xuICAgIC8vIHJldHVybnMgcE5leHRPclBhcmVudCBpZiB3ZSBhcmUgbm90IGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QsIG51bGwgb3RoZXJ3aXNlXG4gICAgcmV0dXJuIGlzTGFzdFByb2plY3RlZE5vZGUgPyBudWxsIDogcE5leHRPclBhcmVudDtcbiAgfVxuXG4gIC8vIHJldHVybnMgbm9kZS5uZXh0IGJlY2F1c2UgdGhlIHRoZSBub2RlIGlzIG5vdCBwcm9qZWN0ZWRcbiAgcmV0dXJuIGdldE5leHRMTm9kZShub2RlKTtcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICpcbiAqIEBwYXJhbSBpbml0aWFsTm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHJvb3ROb2RlIFRoZSByb290IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBzaG91bGQgc3RvcC5cbiAqIEByZXR1cm4gTE5vZGV8bnVsbCBUaGUgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKGluaXRpYWxOb2RlOiBMTm9kZSwgcm9vdE5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gaW5pdGlhbE5vZGU7XG4gIGxldCBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGUpO1xuICB3aGlsZSAobm9kZSAmJiAhbmV4dE5vZGUpIHtcbiAgICAvLyBpZiBub2RlLnBOZXh0T3JQYXJlbnQgaXMgbm90IG51bGwgaGVyZSwgaXQgaXMgbm90IHRoZSBuZXh0IG5vZGVcbiAgICAvLyAoYmVjYXVzZSwgYXQgdGhpcyBwb2ludCwgbmV4dE5vZGUgaXMgbnVsbCwgc28gaXQgaXMgdGhlIHBhcmVudClcbiAgICBub2RlID0gbm9kZS5wTmV4dE9yUGFyZW50IHx8IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICAgIGlmIChub2RlID09PSByb290Tm9kZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG5leHROb2RlID0gbm9kZSAmJiBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgfVxuICByZXR1cm4gbmV4dE5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgaW5zaWRlIHRoZSBnaXZlbiBMTm9kZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmaXJzdCBET00gbm9kZSBtdXN0IGJlIGZvdW5kXG4gKiBAcmV0dXJucyBSTm9kZSBUaGUgZmlyc3QgUk5vZGUgb2YgdGhlIGdpdmVuIExOb2RlIG9yIG51bGwgaWYgdGhlcmUgaXMgbm9uZS5cbiAqL1xuZnVuY3Rpb24gZmluZEZpcnN0Uk5vZGUocm9vdE5vZGU6IExOb2RlKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIHJldHVybiB3YWxrTE5vZGVUcmVlKHJvb3ROb2RlLCByb290Tm9kZSwgV2Fsa0xOb2RlVHJlZUFjdGlvbi5GaW5kKSB8fCBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtMTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogcmV0dXJucyB0aGUgZmlyc3QgYXZhaWxhYmxlIG5hdGl2ZSBub2RlICovXG4gIEZpbmQgPSAwLFxuXG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDEsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAyLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMyxcbn1cblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgTE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBMRWxlbWVudCBub2RlcywgZWl0aGVyIG9ubHkgb24gdGhlIGZpcnN0XG4gKiBvbmUgZm91bmQsIG9yIG9uIGFsbCBvZiB0aGVtLlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICpcbiAqIEBwYXJhbSBzdGFydGluZ05vZGUgdGhlIG5vZGUgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkLlxuICogQHBhcmFtIHJvb3ROb2RlIHRoZSByb290IG5vZGUgY29uc2lkZXJlZC5cbiAqIEBwYXJhbSBhY3Rpb24gSWRlbnRpZmllcyB0aGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgTEVsZW1lbnQgbm9kZXMuXG4gKiBAcGFyYW0gcmVuZGVyZXIgT3B0aW9uYWwgdGhlIGN1cnJlbnQgcmVuZGVyZXIsIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgMSwgMiBhbmQgMy5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnROb2RlIE9wdGlvbm5hbCB0aGUgcmVuZGVyIHBhcmVudCBub2RlIHRvIGJlIHNldCBpbiBhbGwgTENvbnRhaW5lck5vZGVzIGZvdW5kLFxuICogcmVxdWlyZWQgZm9yIGFjdGlvbiBtb2RlcyAxIGFuZCAyLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgT3B0aW9ubmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIG1vZGVzIDEuXG4gKi9cbmZ1bmN0aW9uIHdhbGtMTm9kZVRyZWUoXG4gICAgc3RhcnRpbmdOb2RlOiBMTm9kZSB8IG51bGwsIHJvb3ROb2RlOiBMTm9kZSwgYWN0aW9uOiBXYWxrTE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcj86IFJlbmRlcmVyMyxcbiAgICByZW5kZXJQYXJlbnROb2RlPzogTEVsZW1lbnROb2RlIHwgbnVsbCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IHN0YXJ0aW5nTm9kZTtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAvLyBFeGVjdXRlIHRoZSBhY3Rpb25cbiAgICAgIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRmluZCkge1xuICAgICAgICByZXR1cm4gbm9kZS5uYXRpdmU7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa0xOb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gcmVuZGVyUGFyZW50Tm9kZSAhLm5hdGl2ZTtcbiAgICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLmluc2VydEJlZm9yZShwYXJlbnQgISwgbm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgICAgIHBhcmVudCAhLmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gcmVuZGVyUGFyZW50Tm9kZSAhLm5hdGl2ZTtcbiAgICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZUNoaWxkKHBhcmVudCBhcyBSRWxlbWVudCwgbm9kZS5uYXRpdmUgISkgOlxuICAgICAgICAgICAgcGFyZW50ICEucmVtb3ZlQ2hpbGQobm9kZS5uYXRpdmUgISk7XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUgIShub2RlLm5hdGl2ZSAhKTtcbiAgICAgIH1cbiAgICAgIG5leHROb2RlID0gZ2V0TmV4dExOb2RlKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSk7XG4gICAgICBjb25zdCBjaGlsZENvbnRhaW5lckRhdGE6IExDb250YWluZXIgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhIDpcbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgICAgaWYgKHJlbmRlclBhcmVudE5vZGUpIHtcbiAgICAgICAgY2hpbGRDb250YWluZXJEYXRhW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50Tm9kZTtcbiAgICAgIH1cbiAgICAgIG5leHROb2RlID1cbiAgICAgICAgICBjaGlsZENvbnRhaW5lckRhdGFbVklFV1NdLmxlbmd0aCA/IGdldENoaWxkTE5vZGUoY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXVswXSkgOiBudWxsO1xuICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gRm9yIFByb2plY3Rpb24gbG9vayBhdCB0aGUgZmlyc3QgcHJvamVjdGVkIG5vZGVcbiAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhLmhlYWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBsb29rIGF0IHRoZSBmaXJzdCBjaGlsZFxuICAgICAgbmV4dE5vZGUgPSBnZXRDaGlsZExOb2RlKG5vZGUgYXMgTFZpZXdOb2RlKTtcbiAgICB9XG5cbiAgICBub2RlID0gbmV4dE5vZGUgPT09IG51bGwgPyBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShub2RlLCByb290Tm9kZSkgOiBuZXh0Tm9kZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHJvb3ROb2RlIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IHRydWUsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogYm9vbGVhbixcbiAgICBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocm9vdE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBpZiAocGFyZW50KSB7XG4gICAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBnZXRDaGlsZExOb2RlKHJvb3ROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbnRhaW5lci52aWV3W1JFTkRFUkVSXTtcbiAgICB3YWxrTE5vZGVUcmVlKFxuICAgICAgICBub2RlLCByb290Tm9kZSwgaW5zZXJ0TW9kZSA/IFdhbGtMTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXRhY2gsXG4gICAgICAgIHJlbmRlcmVyLCBwYXJlbnROb2RlLCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3W1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBJZiBMVmlld0RhdGEsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3RGF0YS5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgaWYgKGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSBuZXh0ID0gY29udGFpbmVyW1ZJRVdTXVswXS5kYXRhO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGVbVklFV1NdO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdLmRhdGFbTkVYVF0gPSB2aWV3Tm9kZS5kYXRhIGFzIExWaWV3RGF0YTtcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIHZpZXdOb2RlLmRhdGFbTkVYVF0gPSB2aWV3c1tpbmRleF0uZGF0YTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKHZpZXdOb2RlKTtcbiAgICB2aWV3Tm9kZS5kYXRhW05FWFRdID0gbnVsbDtcbiAgfVxuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IGEgbmV3IHZpZXcgaGFzIGJlZW4gYWRkZWRcbiAgY29uc3QgbFZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gSWYgdGhlIGNvbnRhaW5lcidzIHJlbmRlclBhcmVudCBpcyBudWxsLCB3ZSBrbm93IHRoYXQgaXQgaXMgYSByb290IG5vZGUgb2YgaXRzIG93biBwYXJlbnQgdmlld1xuICAvLyBhbmQgd2Ugc2hvdWxkIHdhaXQgdW50aWwgdGhhdCBwYXJlbnQgcHJvY2Vzc2VzIGl0cyBub2RlcyAob3RoZXJ3aXNlLCB3ZSB3aWxsIGluc2VydCB0aGlzIHZpZXcnc1xuICAvLyBub2RlcyB0d2ljZSAtIG9uY2Ugbm93IGFuZCBvbmNlIHdoZW4gaXRzIHBhcmVudCBpbnNlcnRzIGl0cyB2aWV3cykuXG4gIGlmIChjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSAhPT0gbnVsbCkge1xuICAgIGxldCBiZWZvcmVOb2RlID0gZmluZE5leHRSTm9kZVNpYmxpbmcodmlld05vZGUsIGNvbnRhaW5lcik7XG5cbiAgICBpZiAoIWJlZm9yZU5vZGUpIHtcbiAgICAgIGxldCBjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9IGNvbnRhaW5lci5uYXRpdmU7XG4gICAgICBpZiAoY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9IGNvbnRhaW5lci5uYXRpdmUgPSBmaW5kTmV4dFJOb2RlU2libGluZyhjb250YWluZXIsIG51bGwpO1xuICAgICAgfVxuICAgICAgYmVmb3JlTm9kZSA9IGNvbnRhaW5lck5leHROYXRpdmVOb2RlO1xuICAgIH1cbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIHZpZXdOb2RlLCB0cnVlLCBiZWZvcmVOb2RlKTtcbiAgfVxuXG4gIC8vIFNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld05vZGUuZGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcblxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2Qgc3BsaWNlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEByZXR1cm5zIFRoZSBkZXRhY2hlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhW1ZJRVdTXTtcbiAgY29uc3Qgdmlld05vZGUgPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICB2aWV3c1tyZW1vdmVJbmRleCAtIDFdLmRhdGFbTkVYVF0gPSB2aWV3Tm9kZS5kYXRhW05FWFRdIGFzIExWaWV3RGF0YTtcbiAgfVxuICB2aWV3cy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIHZpZXdOb2RlLCBmYWxzZSk7XG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb25zdCByZW1vdmVkTHZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAocmVtb3ZlZEx2aWV3W1FVRVJJRVNdKSB7XG4gICAgcmVtb3ZlZEx2aWV3W1FVRVJJRVNdICEucmVtb3ZlVmlldygpO1xuICB9XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3Tm9kZS5kYXRhW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqIEByZXR1cm5zIFRoZSByZW1vdmVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdOb2RlID0gY29udGFpbmVyLmRhdGFbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhjb250YWluZXIsIHJlbW92ZUluZGV4KTtcbiAgZGVzdHJveUxWaWV3KHZpZXdOb2RlLmRhdGEpO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXdEYXRhICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZCh2aWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCB7XG4gIGlmICh2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGhvc3ROb2RlOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGUgPSB2aWV3RGF0YVt2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleF07XG5cbiAgcmV0dXJuIGhvc3ROb2RlLmRhdGEgPyBob3N0Tm9kZS5kYXRhIDogKGhvc3ROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIHdhbGtMTm9kZVRyZWUodmlld1tIT1NUX05PREVdLCB2aWV3W0hPU1RfTk9ERV0sIFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIpO1xuICB9XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgLy8gU2V0cyB0aGUgZGVzdHJveWVkIGZsYWdcbiAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhfFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXdEYXRhKSAhW0hPU1RfTk9ERV0pICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldFBhcmVudExOb2RlKG5vZGUpICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlld0RhdGEgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YSlbVFZJRVddKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAodmlld1tUVklFV10uaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3RGF0YVtUVklFV10uY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHZpZXdEYXRhW2NsZWFudXBbaSArIDFdXS5uYXRpdmU7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIG5hdGl2ZS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGxpc3RlbmVyLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDFdXTtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3RGF0YVtDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3W0RJUkVDVElWRVNdICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlld0RhdGFbVFZJRVddICYmIHZpZXdEYXRhW1RWSUVXXS5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3RGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IHNob3VsZCBiZSBpbnNlcnRlZCBpbiB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZSBuYXRpdmUgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgd2hlbiBpdHMgcGFyZW50IGlzOlxuICogLSBBIHJlZ3VsYXIgZWxlbWVudCA9PiBZZXNcbiAqIC0gQSBjb21wb25lbnQgaG9zdCBlbGVtZW50ID0+XG4gKiAgICAtIGlmIHRoZSBgY3VycmVudFZpZXdgID09PSB0aGUgcGFyZW50IGB2aWV3YDogVGhlIGVsZW1lbnQgaXMgaW4gdGhlIGNvbnRlbnQgKHZzIHRoZVxuICogICAgICB0ZW1wbGF0ZSlcbiAqICAgICAgPT4gZG9uJ3QgYWRkIGFzIHRoZSBwYXJlbnQgY29tcG9uZW50IHdpbGwgcHJvamVjdCBpZiBuZWVkZWQuXG4gKiAgICAtIGBjdXJyZW50Vmlld2AgIT09IHRoZSBwYXJlbnQgYHZpZXdgID0+IFRoZSBlbGVtZW50IGlzIGluIHRoZSB0ZW1wbGF0ZSAodnMgdGhlIGNvbnRlbnQpLFxuICogICAgICBhZGQgaXRcbiAqIC0gVmlldyBlbGVtZW50ID0+IGRlbGF5IGluc2VydGlvbiwgd2lsbCBiZSBkb25lIG9uIGB2aWV3RW5kKClgXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IGluIHdoaWNoIHRvIGluc2VydCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudDogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50SXNFbGVtZW50ID0gcGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50O1xuXG4gIHJldHVybiBwYXJlbnRJc0VsZW1lbnQgJiZcbiAgICAgIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcgfHwgcGFyZW50LmRhdGEgPT09IG51bGwgLyogUmVndWxhciBFbGVtZW50LiAqLyk7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSBhZGQgZWxlbWVudCBpZiBub3QgaW4gVmlldyBvciBub3QgcHJvamVjdGVkLlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudC5uYXRpdmUgIWFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGN1cnJlbnRQYXJlbnQgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudDogTEVsZW1lbnROb2RlLFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgaWYgKG5vZGUudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIChub2RlIGFzIExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSkubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIENvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBFbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ25lZSB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbnVsbCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSBjdXJyZW50UGFyZW50O1xuICB9XG59XG4iXX0=