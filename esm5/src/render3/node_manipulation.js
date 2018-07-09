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
                pNextOrParent = (pNextOrParent.pNextOrParent);
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
                isProceduralRenderer((renderer)) ?
                    renderer
                        .insertBefore((parent_1), (node.native), beforeNode) :
                    parent_1.insertBefore((node.native), beforeNode, true);
            }
            else if (action === 2 /* Detach */) {
                var parent_2 = renderParentNode.native;
                isProceduralRenderer((renderer)) ?
                    renderer.removeChild(parent_2, (node.native)) :
                    parent_2.removeChild((node.native));
            }
            else if (action === 3 /* Destroy */) {
                ngDevMode && ngDevMode.rendererDestroyNode++;
                renderer.destroyNode((node.native));
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
    var cleanup = (viewData[TVIEW].cleanup);
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
        callHooks((view[DIRECTIVES]), destroyHooks);
    }
}
/** Calls pipe destroy hooks for this view */
function executePipeOnDestroys(viewData) {
    var pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks((viewData), pipeDestroyHooks);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBYSxhQUFhLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2xILE9BQU8sRUFBd0YsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEssT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBeUQsb0JBQW9CLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDN0osT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQW1DLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDMU0sT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRWpDLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNoRiw4QkFBOEIsSUFBa0IsRUFBRSxRQUFzQjtJQUN0RSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQy9DLElBQUksYUFBYSxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDOUMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNsQixPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIsRUFBRSxDQUFDO2dCQUN6RCxJQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2pELEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFVBQVUsQ0FBQztpQkFDbkI7Z0JBQ0QsYUFBYSxJQUFHLGFBQWEsQ0FBQyxhQUFlLENBQUEsQ0FBQzthQUMvQztZQUNELFdBQVcsR0FBRyxhQUFhLENBQUM7U0FDN0I7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksY0FBYyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQyxPQUFPLGNBQWMsRUFBRSxDQUFDO2dCQUN0QixJQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xELEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ2YsTUFBTSxDQUFDLFVBQVUsQ0FBQztpQkFDbkI7Z0JBQ0QsY0FBYyxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUMvQztZQUNELElBQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ25CLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsSUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsc0JBQXdCLElBQUksVUFBVSxpQkFBbUIsQ0FBQyxDQUFDLENBQUM7b0JBQ3hFLFdBQVcsR0FBRyxVQUFVLENBQUM7aUJBQzFCO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztDQUNiOztBQUdELE1BQU0sdUJBQXVCLElBQVc7O0lBRXRDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxpQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFDdkMsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQWlCLENBQUM7UUFDeEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUUsUUFBUSxDQUFDLElBQUksQ0FBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDekU7SUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztDQUNwRTs7QUFHRCxNQUFNLHdCQUF3QixJQUFXO0lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNyQixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksaUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3pGLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDekM7SUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO0NBQ2I7QUFPRCxNQUFNLHlCQUF5QixJQUFXO0lBQ3hDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUN6QyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUNoRTs7Ozs7Ozs7QUFTRCxvQ0FBb0MsSUFBVztJQUM3QyxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBRXpDLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7O1FBRWxCLElBQU0sbUJBQW1CLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixDQUFDOztRQUU5RSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0tBQ25EOztJQUdELE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDM0I7Ozs7Ozs7Ozs7OztBQWFELG9DQUFvQyxXQUFrQixFQUFFLFFBQWU7SUFDckUsSUFBSSxJQUFJLEdBQWUsV0FBVyxDQUFDO0lBQ25DLElBQUksUUFBUSxHQUFHLDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7OztRQUd6QixJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQztTQUNiO1FBQ0QsUUFBUSxHQUFHLElBQUksSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyRDtJQUNELE1BQU0sQ0FBQyxRQUFRLENBQUM7Q0FDakI7Ozs7Ozs7QUFRRCx3QkFBd0IsUUFBZTtJQUNyQyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxRQUFRLGVBQTJCLElBQUksSUFBSSxDQUFDO0NBQzVFOzs7Ozs7Ozs7Ozs7Ozs7O0FBK0JELHVCQUNJLFlBQTBCLEVBQUUsUUFBZSxFQUFFLE1BQTJCLEVBQUUsUUFBb0IsRUFDOUYsZ0JBQXNDLEVBQUUsVUFBeUI7SUFDbkUsSUFBSSxJQUFJLEdBQWUsWUFBWSxDQUFDO0lBQ3BDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDWixJQUFJLFFBQVEsR0FBZSxJQUFJLENBQUM7UUFDaEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDLENBQUMsQ0FBQzs7WUFFMUMsRUFBRSxDQUFDLENBQUMsTUFBTSxpQkFBNkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2FBQ3BCO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sbUJBQStCLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxJQUFNLFFBQU0sR0FBRyxnQkFBa0IsQ0FBQyxNQUFNLENBQUM7Z0JBQ3pDLG9CQUFvQixDQUFDLENBQUEsUUFBVSxDQUFBLENBQUMsQ0FBQyxDQUFDO29CQUM3QixRQUFnQzt5QkFDNUIsWUFBWSxDQUFDLENBQUEsUUFBUSxDQUFBLEVBQUUsQ0FBQSxJQUFJLENBQUMsTUFBUSxDQUFBLEVBQUUsVUFBMEIsQ0FBQyxDQUFDLENBQUM7b0JBQ3hFLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQSxJQUFJLENBQUMsTUFBUSxDQUFBLEVBQUUsVUFBMEIsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM1RTtZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLG1CQUErQixDQUFDLENBQUMsQ0FBQztnQkFDakQsSUFBTSxRQUFNLEdBQUcsZ0JBQWtCLENBQUMsTUFBTSxDQUFDO2dCQUN6QyxvQkFBb0IsQ0FBQyxDQUFBLFFBQVUsQ0FBQSxDQUFDLENBQUMsQ0FBQztvQkFDN0IsUUFBZ0MsQ0FBQyxXQUFXLENBQUMsUUFBa0IsRUFBRSxDQUFBLElBQUksQ0FBQyxNQUFRLENBQUEsQ0FBQyxDQUFDLENBQUM7b0JBQ2xGLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQSxJQUFJLENBQUMsTUFBUSxDQUFBLENBQUMsQ0FBQzthQUN6QztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLG9CQUFnQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUM1QyxRQUFnQyxDQUFDLFdBQWEsQ0FBQyxDQUFBLElBQUksQ0FBQyxNQUFRLENBQUEsQ0FBQyxDQUFDO2FBQ2hFO1lBQ0QsUUFBUSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMvQjtRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQXdCLENBQUMsQ0FBQyxDQUFDO1lBQ25ELElBQU0sY0FBYyxHQUFvQixJQUF1QixDQUFDO1lBQ2hFLElBQU0sa0JBQWtCLEdBQWUsY0FBYyxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ3pFLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0MsY0FBYyxDQUFDLElBQUksQ0FBQztZQUN4QixFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxHQUFHLGdCQUFnQixDQUFDO2FBQ3REO1lBQ0QsUUFBUTtnQkFDSixrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDM0Y7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixDQUFDLENBQUMsQ0FBQzs7WUFFcEQsUUFBUSxHQUFJLElBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNoRDtRQUFDLElBQUksQ0FBQyxDQUFDOztZQUVOLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBaUIsQ0FBQyxDQUFDO1NBQzdDO1FBRUQsSUFBSSxHQUFHLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0tBQ2xGO0NBQ0Y7QUFFRCxNQUFNLHlCQUF5QixLQUFVLEVBQUUsUUFBbUI7SUFDNUQsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUNuRjtBQW1CRCxNQUFNLHFDQUNGLFNBQXlCLEVBQUUsUUFBbUIsRUFBRSxVQUFtQixFQUNuRSxVQUF5QjtJQUMzQixTQUFTLElBQUksY0FBYyxDQUFDLFNBQVMsb0JBQXNCLENBQUM7SUFDNUQsU0FBUyxJQUFJLGNBQWMsQ0FBQyxRQUFRLGVBQWlCLENBQUM7SUFDdEQsSUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNqRCxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNyRCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxJQUFJLEdBQWUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUMsYUFBYSxDQUNULElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUMsZ0JBQTRCLENBQUMsZUFBMkIsRUFDcEYsUUFBUSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN2QztDQUNGOzs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sMEJBQTBCLFFBQW1COztJQUVqRCxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzlCO0lBQ0QsSUFBSSxlQUFlLEdBQThCLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV6RSxPQUFPLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLElBQUksSUFBSSxHQUE4QixJQUFJLENBQUM7UUFFM0MsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLE1BQU0sSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDOztZQUU1QyxJQUFNLElBQUksR0FBRyxlQUE0QixDQUFDO1lBQzFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3RDtRQUFDLElBQUksQ0FBQyxDQUFDOztZQUVOLElBQU0sU0FBUyxHQUFHLGVBQTZCLENBQUM7WUFDaEQsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUM5RDtRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7WUFHakIsT0FBTyxlQUFlLElBQUksQ0FBQyxlQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbkYsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUM3QixlQUFlLEdBQUcsY0FBYyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUM3RDtZQUNELFdBQVcsQ0FBQyxlQUFlLElBQUksUUFBUSxDQUFDLENBQUM7WUFDekMsSUFBSSxHQUFHLGVBQWUsSUFBSSxlQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsZUFBZSxHQUFHLElBQUksQ0FBQztLQUN4QjtDQUNGOzs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0scUJBQ0YsU0FBeUIsRUFBRSxRQUFtQixFQUFFLEtBQWE7SUFDL0QsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztJQUM3QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0IsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBRWQsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQWlCLENBQUM7S0FDMUQ7SUFFRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDekIsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3hDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNsQztJQUFDLElBQUksQ0FBQyxDQUFDO1FBQ04sS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUM1Qjs7SUFHRCxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQzVCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkIsS0FBSyxDQUFDLE9BQU8sQ0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNwQzs7OztJQUtELEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMzQyxJQUFJLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFM0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2hCLElBQUksdUJBQXVCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUMvQyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyx1QkFBdUIsR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNwRjtZQUNELFVBQVUsR0FBRyx1QkFBdUIsQ0FBQztTQUN0QztRQUNELDBCQUEwQixDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ25FOztJQUdELFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUF1QixDQUFDO0lBRTVDLE1BQU0sQ0FBQyxRQUFRLENBQUM7Q0FDakI7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxxQkFBcUIsU0FBeUIsRUFBRSxXQUFtQjtJQUN2RSxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNwQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixLQUFLLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBYyxDQUFDO0tBQ3RFO0lBQ0QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0IsMEJBQTBCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQzs7SUFFdkQsSUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztJQUNuQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLFlBQVksQ0FBQyxPQUFPLENBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztLQUN0Qzs7SUFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFvQixDQUFDO0lBQzdDLE1BQU0sQ0FBQyxRQUFRLENBQUM7Q0FDakI7Ozs7Ozs7O0FBU0QsTUFBTSxxQkFBcUIsU0FBeUIsRUFBRSxXQUFtQjtJQUN2RSxJQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3BELFVBQVUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDbkMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixNQUFNLENBQUMsUUFBUSxDQUFDO0NBQ2pCOztBQUdELE1BQU0sd0JBQXdCLFFBQW1CO0lBQy9DLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBRW5ELElBQU0sUUFBUSxHQUFnQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRW5GLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBRSxRQUFRLENBQUMscUJBQXdDLENBQUMsSUFBSSxDQUFDO0NBQ2hHOzs7Ozs7O0FBUUQsTUFBTSx1QkFBdUIsSUFBZTtJQUMxQyxJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsRUFBRSxDQUFDLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDM0QsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUErQixRQUFRLENBQUMsQ0FBQztLQUN4RjtJQUNELGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFFdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBd0IsQ0FBQztDQUNyQzs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0seUJBQXlCLEtBQTZCLEVBQUUsUUFBbUI7SUFFL0UsSUFBSSxJQUFJLENBQUM7SUFDVCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBSSxLQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixDQUFDLENBQUMsQ0FBQzs7O1FBR3JGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFHLENBQUMsSUFBVyxDQUFDO0tBQzNDO0lBQUMsSUFBSSxDQUFDLENBQUM7O1FBRU4sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzFEO0NBQ0Y7Ozs7OztBQU9ELHFCQUFxQixlQUF1QztJQUMxRCxFQUFFLENBQUMsQ0FBRSxlQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxJQUFNLElBQUksR0FBRyxlQUE0QixDQUFDO1FBQzFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7UUFFNUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsUUFBUSxDQUF5QixDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ25EO0tBQ0Y7Q0FDRjs7QUFHRCx5QkFBeUIsUUFBbUI7SUFDMUMsSUFBTSxPQUFPLEdBQUcsQ0FBQSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBUyxDQUFBLENBQUM7SUFDMUMsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDL0MsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQzs7Z0JBRW5DLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUMvQyxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyRCxNQUFNLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUjtZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDOztnQkFFMUMsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxTQUFTLEVBQUUsQ0FBQzthQUNiO1lBQUMsSUFBSSxDQUFDLENBQUM7O2dCQUVOLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDMUI7U0FDRjtRQUNELFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDMUI7Q0FDRjs7QUFHRCwyQkFBMkIsSUFBZTtJQUN4QyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsSUFBSSxZQUEyQixDQUFDO0lBQ2hDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakUsU0FBUyxDQUFDLENBQUEsSUFBSSxDQUFDLFVBQVUsQ0FBRyxDQUFBLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDN0M7Q0FDRjs7QUFHRCwrQkFBK0IsUUFBbUI7SUFDaEQsSUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDO0lBQzdFLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNyQixTQUFTLENBQUMsQ0FBQSxRQUFVLENBQUEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ3pDO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CRCxNQUFNLDhCQUE4QixNQUFhLEVBQUUsV0FBc0I7SUFDdkUsSUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDO0lBRWhFLE1BQU0sQ0FBQyxlQUFlO1FBQ2xCLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLHdCQUF3QixDQUFDO0NBQ2xGOzs7Ozs7Ozs7OztBQVlELE1BQU0sc0JBQXNCLE1BQWEsRUFBRSxLQUFtQixFQUFFLFdBQXNCO0lBQ3BGLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLElBQUksbUJBQW1CLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7UUFFL0QsSUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLE1BQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEUsTUFBTSxDQUFDLElBQUksQ0FBQztLQUNiO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztDQUNkOzs7Ozs7Ozs7QUFVRCxNQUFNLDhCQUNGLElBQStDLEVBQUUsYUFBMkIsRUFDNUUsV0FBc0I7SUFDeEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixDQUFDLENBQUMsQ0FBQztRQUM1QyxXQUFXLENBQUMsYUFBYSxFQUFHLElBQWlDLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3BGO0lBQUMsSUFBSSxDQUFDLENBQUM7Ozs7OztRQU1OLElBQU0sVUFBVSxHQUFJLElBQXVCLENBQUMsSUFBSSxDQUFDO1FBQ2pELFVBQVUsQ0FBQyxhQUFhLENBQUMsR0FBRyxhQUFhLENBQUM7UUFDMUMsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLDBCQUEwQixDQUFDLElBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxRTtLQUNGO0lBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLGFBQWEsQ0FBQztLQUNoRTtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NMRUFOVVAsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGZvbGxvd2luZyB0aGUgZ2l2ZW4gTE5vZGUgaW4gdGhlIHNhbWUgcGFyZW50IERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGluc2VydCB0aGUgZ2l2ZW4gbm9kZSB3aXRoIGluc2VydEJlZm9yZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSBzdG9wTm9kZSBBIHBhcmVudCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgaW4gdGhlIHRyZWUgc2hvdWxkIGJlIHN0b3BwZWQsIG9yIG51bGwgaWYgdGhlXG4gKiBsb29rdXAgc2hvdWxkIG5vdCBiZSBzdG9wcGVkIHVudGlsIHRoZSByZXN1bHQgaXMgZm91bmQuXG4gKiBAcmV0dXJucyBSTm9kZSBiZWZvcmUgd2hpY2ggdGhlIHByb3ZpZGVkIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkIG9yIG51bGwgaWYgdGhlIGxvb2t1cCB3YXNcbiAqIHN0b3BwZWRcbiAqIG9yIGlmIHRoZXJlIGlzIG5vIG5hdGl2ZSBub2RlIGFmdGVyIHRoZSBnaXZlbiBsb2dpY2FsIG5vZGUgaW4gdGhlIHNhbWUgbmF0aXZlIHBhcmVudC5cbiAqL1xuZnVuY3Rpb24gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZTogTE5vZGUgfCBudWxsLCBzdG9wTm9kZTogTE5vZGUgfCBudWxsKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZSAhPT0gc3RvcE5vZGUpIHtcbiAgICBsZXQgcE5leHRPclBhcmVudCA9IGN1cnJlbnROb2RlLnBOZXh0T3JQYXJlbnQ7XG4gICAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAgIHdoaWxlIChwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZU5vZGUgPSBmaW5kRmlyc3RSTm9kZShwTmV4dE9yUGFyZW50KTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBwTmV4dE9yUGFyZW50ID0gcE5leHRPclBhcmVudC5wTmV4dE9yUGFyZW50ICE7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IHBOZXh0T3JQYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICB3aGlsZSAoY3VycmVudFNpYmxpbmcpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50U2libGluZyk7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUoY3VycmVudE5vZGUpO1xuICAgICAgY3VycmVudE5vZGUgPSBudWxsO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHBhcmVudE5vZGUudE5vZGUudHlwZTtcbiAgICAgICAgaWYgKHBhcmVudFR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHwgcGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgICBjdXJyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHNpYmxpbmcgbm9kZSBmb3IgdGhlIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIC8vIFZpZXcgbm9kZXMgZG9uJ3QgaGF2ZSBUTm9kZXMsIHNvIHRoZWlyIG5leHQgbXVzdCBiZSByZXRyaWV2ZWQgdGhyb3VnaCB0aGVpciBMVmlldy5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gICAgcmV0dXJuIHZpZXdEYXRhW05FWFRdID8gKHZpZXdEYXRhW05FWFRdIGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG5vZGUudE5vZGUubmV4dCA/IG5vZGUudmlld1tub2RlLnROb2RlLm5leHQgIS5pbmRleF0gOiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBmaXJzdCBjaGlsZCBvZiBhIGdpdmVuIG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGlsZExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmNoaWxkKSB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID8gbm9kZS5kYXRhIGFzIExWaWV3RGF0YSA6IG5vZGUudmlldztcbiAgICByZXR1cm4gdmlld0RhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHBhcmVudCBMTm9kZSBvZiBhIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTFByb2plY3Rpb25Ob2RlKTogTEVsZW1lbnROb2RlfFxuICAgIExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMVmlld05vZGUpOiBMQ29udGFpbmVyTm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuaW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFyZW50ID0gbm9kZS50Tm9kZS5wYXJlbnQ7XG4gIHJldHVybiBwYXJlbnQgPyBub2RlLnZpZXdbcGFyZW50LmluZGV4XSA6IG5vZGUudmlld1tIT1NUX05PREVdO1xufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBuZXh0IHNpYmxpbmcgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGNvbnN0IHBOZXh0T3JQYXJlbnQgPSBub2RlLnBOZXh0T3JQYXJlbnQ7XG5cbiAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAvLyBUaGUgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICBjb25zdCBpc0xhc3RQcm9qZWN0ZWROb2RlID0gcE5leHRPclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbjtcbiAgICAvLyByZXR1cm5zIHBOZXh0T3JQYXJlbnQgaWYgd2UgYXJlIG5vdCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0LCBudWxsIG90aGVyd2lzZVxuICAgIHJldHVybiBpc0xhc3RQcm9qZWN0ZWROb2RlID8gbnVsbCA6IHBOZXh0T3JQYXJlbnQ7XG4gIH1cblxuICAvLyByZXR1cm5zIG5vZGUubmV4dCBiZWNhdXNlIHRoZSB0aGUgbm9kZSBpcyBub3QgcHJvamVjdGVkXG4gIHJldHVybiBnZXROZXh0TE5vZGUobm9kZSk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAqXG4gKiBAcGFyYW0gaW5pdGlhbE5vZGUgVGhlIG5vZGUgd2hvc2UgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgcm9vdCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgc2hvdWxkIHN0b3AuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShpbml0aWFsTm9kZTogTE5vZGUsIHJvb3ROb2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGluaXRpYWxOb2RlO1xuICBsZXQgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgd2hpbGUgKG5vZGUgJiYgIW5leHROb2RlKSB7XG4gICAgLy8gaWYgbm9kZS5wTmV4dE9yUGFyZW50IGlzIG5vdCBudWxsIGhlcmUsIGl0IGlzIG5vdCB0aGUgbmV4dCBub2RlXG4gICAgLy8gKGJlY2F1c2UsIGF0IHRoaXMgcG9pbnQsIG5leHROb2RlIGlzIG51bGwsIHNvIGl0IGlzIHRoZSBwYXJlbnQpXG4gICAgbm9kZSA9IG5vZGUucE5leHRPclBhcmVudCB8fCBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgICBpZiAobm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBuZXh0Tm9kZSA9IG5vZGUgJiYgZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIH1cbiAgcmV0dXJuIG5leHROb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGluc2lkZSB0aGUgZ2l2ZW4gTE5vZGUuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgZmlyc3QgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZFxuICogQHJldHVybnMgUk5vZGUgVGhlIGZpcnN0IFJOb2RlIG9mIHRoZSBnaXZlbiBMTm9kZSBvciBudWxsIGlmIHRoZXJlIGlzIG5vbmUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFJOb2RlKHJvb3ROb2RlOiBMTm9kZSk6IFJFbGVtZW50fFJUZXh0fG51bGwge1xuICByZXR1cm4gd2Fsa0xOb2RlVHJlZShyb290Tm9kZSwgcm9vdE5vZGUsIFdhbGtMTm9kZVRyZWVBY3Rpb24uRmluZCkgfHwgbnVsbDtcbn1cblxuY29uc3QgZW51bSBXYWxrTE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIHJldHVybnMgdGhlIGZpcnN0IGF2YWlsYWJsZSBuYXRpdmUgbm9kZSAqL1xuICBGaW5kID0gMCxcblxuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAxLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMixcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDMsXG59XG5cbi8qKlxuICogV2Fsa3MgYSB0cmVlIG9mIExOb2RlcywgYXBwbHlpbmcgYSB0cmFuc2Zvcm1hdGlvbiBvbiB0aGUgTEVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqXG4gKiBAcGFyYW0gc3RhcnRpbmdOb2RlIHRoZSBub2RlIGZyb20gd2hpY2ggdGhlIHdhbGsgaXMgc3RhcnRlZC5cbiAqIEBwYXJhbSByb290Tm9kZSB0aGUgcm9vdCBub2RlIGNvbnNpZGVyZWQuXG4gKiBAcGFyYW0gYWN0aW9uIElkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIExFbGVtZW50IG5vZGVzLlxuICogQHBhcmFtIHJlbmRlcmVyIE9wdGlvbmFsIHRoZSBjdXJyZW50IHJlbmRlcmVyLCByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIDEsIDIgYW5kIDMuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50Tm9kZSBPcHRpb25uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJOb2RlcyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgMSBhbmQgMi5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbm5hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBtb2RlcyAxLlxuICovXG5mdW5jdGlvbiB3YWxrTE5vZGVUcmVlKFxuICAgIHN0YXJ0aW5nTm9kZTogTE5vZGUgfCBudWxsLCByb290Tm9kZTogTE5vZGUsIGFjdGlvbjogV2Fsa0xOb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI/OiBSZW5kZXJlcjMsXG4gICAgcmVuZGVyUGFyZW50Tm9kZT86IExFbGVtZW50Tm9kZSB8IG51bGwsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBzdGFydGluZ05vZGU7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uXG4gICAgICBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkZpbmQpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUubmF0aXZlO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uSW5zZXJ0KSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgIS5uYXRpdmU7XG4gICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgIC5pbnNlcnRCZWZvcmUocGFyZW50ICEsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgICAgICBwYXJlbnQgIS5pbnNlcnRCZWZvcmUobm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwsIHRydWUpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgIS5uYXRpdmU7XG4gICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIG5vZGUubmF0aXZlICEpIDpcbiAgICAgICAgICAgIHBhcmVudCAhLnJlbW92ZUNoaWxkKG5vZGUubmF0aXZlICEpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZS5uYXRpdmUgISk7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZShub2RlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIGlmIChyZW5kZXJQYXJlbnROb2RlKSB7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudE5vZGU7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXS5sZW5ndGggPyBnZXRDaGlsZExOb2RlKGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU11bMF0pIDogbnVsbDtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIEZvciBQcm9qZWN0aW9uIGxvb2sgYXQgdGhlIGZpcnN0IHByb2plY3RlZCBub2RlXG4gICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbG9vayBhdCB0aGUgZmlyc3QgY2hpbGRcbiAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSk7XG4gICAgfVxuXG4gICAgbm9kZSA9IG5leHROb2RlID09PSBudWxsID8gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpIDogbmV4dE5vZGU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0aGUgcm9vdCB2aWV3IGJlbG9uZ3NcbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiB0cnVlLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGJvb2xlYW4sXG4gICAgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHJvb3ROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgaWYgKHBhcmVudCkge1xuICAgIGxldCBub2RlOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShyb290Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlld1tSRU5ERVJFUl07XG4gICAgd2Fsa0xOb2RlVHJlZShcbiAgICAgICAgbm9kZSwgcm9vdE5vZGUsIGluc2VydE1vZGUgPyBXYWxrTE5vZGVUcmVlQWN0aW9uLkluc2VydCA6IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoLFxuICAgICAgICByZW5kZXJlciwgcGFyZW50Tm9kZSwgYmVmb3JlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBnZXRMVmlld0NoaWxkKHJvb3RWaWV3KTtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci5sZW5ndGggPj0gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gSWYgTFZpZXdEYXRhLCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgICBpZiAodmlld1tUVklFV10uY2hpbGRJbmRleCA+IC0xKSBuZXh0ID0gZ2V0TFZpZXdDaGlsZCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlld0RhdGEuXG4gICAgICBjb25zdCBjb250YWluZXIgPSB2aWV3T3JDb250YWluZXIgYXMgTENvbnRhaW5lcjtcbiAgICAgIGlmIChjb250YWluZXJbVklFV1NdLmxlbmd0aCkgbmV4dCA9IGNvbnRhaW5lcltWSUVXU11bMF0uZGF0YTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICFbTkVYVF0gJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIHZpZXdOb2RlIFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEByZXR1cm5zIFRoZSBpbnNlcnRlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHZpZXdOb2RlOiBMVmlld05vZGUsIGluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRhaW5lci5kYXRhO1xuICBjb25zdCB2aWV3cyA9IHN0YXRlW1ZJRVdTXTtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXS5kYXRhW05FWFRdID0gdmlld05vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICB2aWV3Tm9kZS5kYXRhW05FWFRdID0gdmlld3NbaW5kZXhdLmRhdGE7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaCh2aWV3Tm9kZSk7XG4gICAgdmlld05vZGUuZGF0YVtORVhUXSA9IG51bGw7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxWaWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgbFZpZXdbUVVFUklFU10gIS5pbnNlcnRWaWV3KGluZGV4KTtcbiAgfVxuXG4gIC8vIElmIHRoZSBjb250YWluZXIncyByZW5kZXJQYXJlbnQgaXMgbnVsbCwgd2Uga25vdyB0aGF0IGl0IGlzIGEgcm9vdCBub2RlIG9mIGl0cyBvd24gcGFyZW50IHZpZXdcbiAgLy8gYW5kIHdlIHNob3VsZCB3YWl0IHVudGlsIHRoYXQgcGFyZW50IHByb2Nlc3NlcyBpdHMgbm9kZXMgKG90aGVyd2lzZSwgd2Ugd2lsbCBpbnNlcnQgdGhpcyB2aWV3J3NcbiAgLy8gbm9kZXMgdHdpY2UgLSBvbmNlIG5vdyBhbmQgb25jZSB3aGVuIGl0cyBwYXJlbnQgaW5zZXJ0cyBpdHMgdmlld3MpLlxuICBpZiAoY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF0gIT09IG51bGwpIHtcbiAgICBsZXQgYmVmb3JlTm9kZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKHZpZXdOb2RlLCBjb250YWluZXIpO1xuXG4gICAgaWYgKCFiZWZvcmVOb2RlKSB7XG4gICAgICBsZXQgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlO1xuICAgICAgaWYgKGNvbnRhaW5lck5leHROYXRpdmVOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlID0gZmluZE5leHRSTm9kZVNpYmxpbmcoY29udGFpbmVyLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGJlZm9yZU5vZGUgPSBjb250YWluZXJOZXh0TmF0aXZlTm9kZTtcbiAgICB9XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIHZpZXdOb2RlLmRhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBUaGUgZGV0YWNoZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gIGNvbnN0IHZpZXdOb2RlID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXS5kYXRhW05FWFRdID0gdmlld05vZGUuZGF0YVtORVhUXSBhcyBMVmlld0RhdGE7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgY29uc3QgcmVtb3ZlZEx2aWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKHJlbW92ZWRMdmlld1tRVUVSSUVTXSkge1xuICAgIHJlbW92ZWRMdmlld1tRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld05vZGUuZGF0YVtGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3Tm9kZSA9IGNvbnRhaW5lci5kYXRhW1ZJRVdTXVtyZW1vdmVJbmRleF07XG4gIGRldGFjaFZpZXcoY29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRlc3Ryb3lMVmlldyh2aWV3Tm9kZS5kYXRhKTtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKiogR2V0cyB0aGUgY2hpbGQgb2YgdGhlIGdpdmVuIExWaWV3RGF0YSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3Q2hpbGQodmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwge1xuICBpZiAodmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBob3N0Tm9kZTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlID0gdmlld0RhdGFbdmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXhdO1xuXG4gIHJldHVybiBob3N0Tm9kZS5kYXRhID8gaG9zdE5vZGUuZGF0YSA6IChob3N0Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbnVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICB3YWxrTE5vZGVUcmVlKHZpZXdbSE9TVF9OT0RFXSwgdmlld1tIT1NUX05PREVdLCBXYWxrTE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyKTtcbiAgfVxuICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIC8vIFNldHMgdGhlIGRlc3Ryb3llZCBmbGFnXG4gIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXdEYXRhIHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxcbiAgICBMQ29udGFpbmVyfG51bGwge1xuICBsZXQgbm9kZTtcbiAgaWYgKChub2RlID0gKHN0YXRlIGFzIExWaWV3RGF0YSkgIVtIT1NUX05PREVdKSAmJiBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRQYXJlbnRMTm9kZShub2RlKSAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZVtQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZVtQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXdEYXRhIHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGEpW1RWSUVXXSkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKHZpZXdbVFZJRVddLmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBjbGVhbnVwID0gdmlld0RhdGFbVFZJRVddLmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggdGhlIG5hdGl2ZSByZW5kZXJlclxuICAgICAgICBjb25zdCBuYXRpdmUgPSB2aWV3RGF0YVtjbGVhbnVwW2kgKyAxXV0ubmF0aXZlO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMl1dO1xuICAgICAgICBuYXRpdmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBsaXN0ZW5lciwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaV1dO1xuICAgICAgICBjbGVhbnVwRm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlld0RhdGFbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlld1tESVJFQ1RJVkVTXSAhLCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXdEYXRhW1RWSUVXXSAmJiB2aWV3RGF0YVtUVklFV10ucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlld0RhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQgaW4gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGUgbmF0aXZlIG5vZGUgY2FuIGJlIGluc2VydGVkIHdoZW4gaXRzIHBhcmVudCBpczpcbiAqIC0gQSByZWd1bGFyIGVsZW1lbnQgPT4gWWVzXG4gKiAtIEEgY29tcG9uZW50IGhvc3QgZWxlbWVudCA9PlxuICogICAgLSBpZiB0aGUgYGN1cnJlbnRWaWV3YCA9PT0gdGhlIHBhcmVudCBgdmlld2A6IFRoZSBlbGVtZW50IGlzIGluIHRoZSBjb250ZW50ICh2cyB0aGVcbiAqICAgICAgdGVtcGxhdGUpXG4gKiAgICAgID0+IGRvbid0IGFkZCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCB3aWxsIHByb2plY3QgaWYgbmVlZGVkLlxuICogICAgLSBgY3VycmVudFZpZXdgICE9PSB0aGUgcGFyZW50IGB2aWV3YCA9PiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdGVtcGxhdGUgKHZzIHRoZSBjb250ZW50KSxcbiAqICAgICAgYWRkIGl0XG4gKiAtIFZpZXcgZWxlbWVudCA9PiBkZWxheSBpbnNlcnRpb24sIHdpbGwgYmUgZG9uZSBvbiBgdmlld0VuZCgpYFxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBpbiB3aGljaCB0byBpbnNlcnQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIExWaWV3IGJlaW5nIHByb2Nlc3NlZFxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQ6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGNvbnN0IHBhcmVudElzRWxlbWVudCA9IHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudDtcblxuICByZXR1cm4gcGFyZW50SXNFbGVtZW50ICYmXG4gICAgICAocGFyZW50LnZpZXcgIT09IGN1cnJlbnRWaWV3IHx8IHBhcmVudC5kYXRhID09PSBudWxsIC8qIFJlZ3VsYXIgRWxlbWVudC4gKi8pO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgZWxlbWVudCB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9XG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHRvIHdoaWNoIHRvIGFwcGVuZCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjaGlsZCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQocGFyZW50OiBMTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgYWRkIGVsZW1lbnQgaWYgbm90IGluIFZpZXcgb3Igbm90IHByb2plY3RlZC5cbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSxcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGlmIChub2RlLnROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCAobm9kZSBhcyBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUpLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBDb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gRWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduZWUgdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgIGxDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSBjdXJyZW50UGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobm9kZSBhcyBMQ29udGFpbmVyTm9kZSwgdmlld3NbaV0sIHRydWUsIG51bGwpO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gY3VycmVudFBhcmVudDtcbiAgfVxufVxuIl19