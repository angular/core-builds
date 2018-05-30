/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { callHooks } from './hooks';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
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
        var lView = node.data;
        return lView.next ? lView.next.node : null;
    }
    return node.tNode.next ? node.view.data[node.tNode.next.index] : null;
}
/** Retrieves the first child of a given node */
export function getChildLNode(node) {
    if (node.tNode.child) {
        var view = node.tNode.type === 2 /* View */ ? node.data : node.view;
        return view.data[node.tNode.child.index];
    }
    return null;
}
export function getParentLNode(node) {
    if (node.tNode.index === null)
        return null;
    var parent = node.tNode.parent;
    return parent ? node.view.data[parent.index] : node.view.node;
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
    var node = rootNode;
    while (node) {
        var nextNode = null;
        if (node.tNode.type === 3 /* Element */) {
            // A LElementNode has a matching RNode in LElementNode.native
            return node.native;
        }
        else if (node.tNode.type === 0 /* Container */) {
            var lContainerNode = node;
            var childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            nextNode =
                childContainerData.views.length ? getChildLNode(childContainerData.views[0]) : null;
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
    return null;
}
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
        renderer.createTextNode(stringify(value));
}
export function addRemoveViewFromContainer(container, rootNode, insertMode, beforeNode) {
    ngDevMode && assertNodeType(container, 0 /* Container */);
    ngDevMode && assertNodeType(rootNode, 2 /* View */);
    var parentNode = container.data.renderParent;
    var parent = parentNode ? parentNode.native : null;
    var node = getChildLNode(rootNode);
    if (parent) {
        while (node) {
            var nextNode = null;
            var renderer = container.view.renderer;
            if (node.tNode.type === 3 /* Element */) {
                if (insertMode) {
                    isProceduralRenderer(renderer) ?
                        renderer.insertBefore(parent, (node.native), beforeNode) :
                        parent.insertBefore((node.native), beforeNode, true);
                }
                else {
                    if (isProceduralRenderer(renderer)) {
                        renderer.removeChild(parent, (node.native));
                        if (renderer.destroyNode) {
                            ngDevMode && ngDevMode.rendererDestroyNode++;
                            renderer.destroyNode((node.native));
                        }
                    }
                    else {
                        parent.removeChild((node.native));
                    }
                }
                nextNode = getNextLNode(node);
            }
            else if (node.tNode.type === 0 /* Container */) {
                // if we get to a container, it must be a root node of a view because we are only
                // propagating down into child views / containers and not child elements
                var childContainerData = node.data;
                childContainerData.renderParent = parentNode;
                nextNode =
                    childContainerData.views.length ? getChildLNode(childContainerData.views[0]) : null;
            }
            else if (node.tNode.type === 1 /* Projection */) {
                nextNode = node.data.head;
            }
            else {
                nextNode = getChildLNode(node);
            }
            if (nextNode === null) {
                node = getNextOrParentSiblingNode(node, rootNode);
            }
            else {
                node = nextNode;
            }
        }
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
    // A view to cleanup doesn't have children so we should not try to descend down the view tree.
    if (!rootView.child) {
        return cleanUpView(rootView);
    }
    var viewOrContainer = rootView.child;
    while (viewOrContainer) {
        var next = null;
        if (viewOrContainer.views && viewOrContainer.views.length) {
            next = viewOrContainer.views[0].data;
        }
        else if (viewOrContainer.child) {
            next = viewOrContainer.child;
        }
        else if (viewOrContainer.next) {
            // Only move to the side and clean if operating below rootView -
            // otherwise we would start cleaning up sibling views of the rootView.
            cleanUpView(viewOrContainer);
            next = viewOrContainer.next;
        }
        if (next == null) {
            // If the viewOrContainer is the rootView and next is null it means that we are dealing
            // with a root view that doesn't have children. We didn't descend into child views
            // so no need to go back up the views tree.
            while (viewOrContainer && !viewOrContainer.next && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(viewOrContainer || rootView);
            next = viewOrContainer && viewOrContainer.next;
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
    var views = state.views;
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data.next = viewNode.data;
    }
    if (index < views.length) {
        viewNode.data.next = views[index].data;
        views.splice(index, 0, viewNode);
    }
    else {
        views.push(viewNode);
        viewNode.data.next = null;
    }
    // Notify query that a new view has been added
    var lView = viewNode.data;
    if (lView.queries) {
        lView.queries.insertView(index);
    }
    // If the container's renderParent is null, we know that it is a root node of its own parent view
    // and we should wait until that parent processes its nodes (otherwise, we will insert this view's
    // nodes twice - once now and once when its parent inserts its views).
    if (container.data.renderParent !== null) {
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
    return viewNode;
}
/**
 * Removes a view from a container.
 *
 * This method splices the view from the container's array of active views. It also
 * removes the view's elements from the DOM and conducts cleanup (e.g. removing
 * listeners, calling onDestroys).
 *
 * @param container The container from which to remove a view
 * @param removeIndex The index of the view to remove
 * @returns The removed view
 */
export function removeView(container, removeIndex) {
    var views = container.data.views;
    var viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data.next = viewNode.data.next;
    }
    views.splice(removeIndex, 1);
    destroyViewTree(viewNode.data);
    addRemoveViewFromContainer(container, viewNode, false);
    // Notify query that view has been removed
    var removedLview = viewNode.data;
    if (removedLview.queries) {
        removedLview.queries.removeView(removeIndex);
    }
    return viewNode;
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
    if ((node = state.node) && node.tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getParentLNode(node).data;
    }
    else {
        // otherwise, use parent view for containers or component views
        return state.parent === rootView ? null : state.parent;
    }
}
/**
 * Removes all listeners and call all onDestroys in a given view.
 *
 * @param view The LView to clean up
 */
function cleanUpView(view) {
    removeListeners(view);
    executeOnDestroys(view);
    executePipeOnDestroys(view);
    // For component views only, the local renderer is destroyed as clean up time.
    if (view.id === -1 && isProceduralRenderer(view.renderer)) {
        ngDevMode && ngDevMode.rendererDestroy++;
        view.renderer.destroy();
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function removeListeners(view) {
    var cleanup = (view.cleanup);
    if (cleanup != null) {
        for (var i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                cleanup[i + 1].removeEventListener(cleanup[i], cleanup[i + 2], cleanup[i + 3]);
                i += 2;
            }
            else {
                cleanup[i].call(cleanup[i + 1]);
            }
        }
        view.cleanup = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(view) {
    var tView = view.tView;
    var destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks((view.directives), destroyHooks);
    }
}
/** Calls pipe destroy hooks for this view */
function executePipeOnDestroys(view) {
    var pipeDestroyHooks = view.tView && view.tView.pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks((view.data), pipeDestroyHooks);
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
        var renderer = currentView.renderer;
        isProceduralRenderer(renderer) ? renderer.appendChild(parent.native, child) :
            parent.native.appendChild(child);
        return true;
    }
    return false;
}
/**
 * Inserts the provided node before the correct element in the DOM.
 *
 * The element insertion might be delayed {@link canInsertNativeNode}
 *
 * @param node Node to insert
 * @param currentView Current LView
 */
export function insertChild(node, currentView) {
    var parent = (getParentLNode(node));
    if (canInsertNativeNode(parent, currentView)) {
        var nativeSibling = findNextRNodeSibling(node, null);
        var renderer = currentView.renderer;
        isProceduralRenderer(renderer) ?
            renderer.insertBefore((parent.native), (node.native), nativeSibling) :
            parent.native.insertBefore((node.native), nativeSibling, false);
    }
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
        lContainer.renderParent = currentParent;
        var views = lContainer.views;
        for (var i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(node, views[i], true, null);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data.renderParent = currentParent;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBYSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RixPQUFPLEVBQW9HLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlLLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQXlELG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBNEMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRWpDLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNoRiw4QkFBOEIsSUFBa0IsRUFBRSxRQUFzQjtJQUN0RSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRTtRQUM5QyxJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQzlDLElBQUksYUFBYSxFQUFFO1lBQ2pCLE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixFQUFFO2dCQUN4RCxJQUFN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QUFFLENBQUEsSUFBSSxDQUFDLE1BQVEsQ0FBQSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLE1BQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQSxJQUFJLENBQUMsTUFBUSxDQUFBLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3ZFO0NBQ0Y7Ozs7Ozs7OztBQVVELE1BQU0sOEJBQ0YsSUFBK0MsRUFBRSxhQUEyQixFQUM1RSxXQUFrQjtJQUNwQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUMzQyxXQUFXLENBQUMsYUFBYSxFQUFHLElBQWlDLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3BGO1NBQU07Ozs7OztRQU1MLElBQU0sVUFBVSxHQUFJLElBQXVCLENBQUMsSUFBSSxDQUFDO1FBQ2pELFVBQVUsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO1FBQ3hDLElBQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLENBQUMsSUFBc0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFFO0tBQ0Y7SUFDRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUM5QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxhQUFhLENBQUM7S0FDOUQ7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7SG9va0RhdGEsIExWaWV3LCBMVmlld09yTENvbnRhaW5lciwgVFZpZXcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgZm9sbG93aW5nIHRoZSBnaXZlbiBMTm9kZSBpbiB0aGUgc2FtZSBwYXJlbnQgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gaW5zZXJ0IHRoZSBnaXZlbiBub2RlIHdpdGggaW5zZXJ0QmVmb3JlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBET00gbm9kZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHN0b3BOb2RlIEEgcGFyZW50IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBpbiB0aGUgdHJlZSBzaG91bGQgYmUgc3RvcHBlZCwgb3IgbnVsbCBpZiB0aGVcbiAqIGxvb2t1cCBzaG91bGQgbm90IGJlIHN0b3BwZWQgdW50aWwgdGhlIHJlc3VsdCBpcyBmb3VuZC5cbiAqIEByZXR1cm5zIFJOb2RlIGJlZm9yZSB3aGljaCB0aGUgcHJvdmlkZWQgbm9kZSBzaG91bGQgYmUgaW5zZXJ0ZWQgb3IgbnVsbCBpZiB0aGUgbG9va3VwIHdhc1xuICogc3RvcHBlZFxuICogb3IgaWYgdGhlcmUgaXMgbm8gbmF0aXZlIG5vZGUgYWZ0ZXIgdGhlIGdpdmVuIGxvZ2ljYWwgbm9kZSBpbiB0aGUgc2FtZSBuYXRpdmUgcGFyZW50LlxuICovXG5mdW5jdGlvbiBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlOiBMTm9kZSB8IG51bGwsIHN0b3BOb2RlOiBMTm9kZSB8IG51bGwpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gbm9kZTtcbiAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlICE9PSBzdG9wTm9kZSkge1xuICAgIGxldCBwTmV4dE9yUGFyZW50ID0gY3VycmVudE5vZGUucE5leHRPclBhcmVudDtcbiAgICBpZiAocE5leHRPclBhcmVudCkge1xuICAgICAgd2hpbGUgKHBOZXh0T3JQYXJlbnQudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKHBOZXh0T3JQYXJlbnQpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIHBOZXh0T3JQYXJlbnQgPSBwTmV4dE9yUGFyZW50LnBOZXh0T3JQYXJlbnQgITtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gcE5leHRPclBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnROb2RlKTtcbiAgICAgIHdoaWxlIChjdXJyZW50U2libGluZykge1xuICAgICAgICBjb25zdCBuYXRpdmVOb2RlID0gZmluZEZpcnN0Uk5vZGUoY3VycmVudFNpYmxpbmcpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRUeXBlID0gcGFyZW50Tm9kZS50Tm9kZS50eXBlO1xuICAgICAgICBpZiAocGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciB8fCBwYXJlbnRUeXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgc2libGluZyBub2RlIGZvciB0aGUgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZXh0TE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgLy8gVmlldyBub2RlcyBkb24ndCBoYXZlIFROb2Rlcywgc28gdGhlaXIgbmV4dCBtdXN0IGJlIHJldHJpZXZlZCB0aHJvdWdoIHRoZWlyIExWaWV3LlxuICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIGNvbnN0IGxWaWV3ID0gbm9kZS5kYXRhIGFzIExWaWV3O1xuICAgIHJldHVybiBsVmlldy5uZXh0ID8gKGxWaWV3Lm5leHQgYXMgTFZpZXcpLm5vZGUgOiBudWxsO1xuICB9XG4gIHJldHVybiBub2RlLnROb2RlLm5leHQgPyBub2RlLnZpZXcuZGF0YVtub2RlLnROb2RlLm5leHQgIS5pbmRleCBhcyBudW1iZXJdIDogbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgZmlyc3QgY2hpbGQgb2YgYSBnaXZlbiBub2RlICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hpbGRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5jaGlsZCkge1xuICAgIGNvbnN0IHZpZXcgPSBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID8gbm9kZS5kYXRhIGFzIExWaWV3IDogbm9kZS52aWV3O1xuICAgIHJldHVybiB2aWV3LmRhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleCBhcyBudW1iZXJdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBwYXJlbnQgTE5vZGUgb2YgYSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExQcm9qZWN0aW9uTm9kZSk6IExFbGVtZW50Tm9kZXxcbiAgICBMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTFZpZXdOb2RlKTogTENvbnRhaW5lck5vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZXxMVmlld05vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZXxMVmlld05vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmluZGV4ID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFyZW50ID0gbm9kZS50Tm9kZS5wYXJlbnQ7XG4gIHJldHVybiBwYXJlbnQgPyBub2RlLnZpZXcuZGF0YVtwYXJlbnQuaW5kZXggYXMgbnVtYmVyXSA6IG5vZGUudmlldy5ub2RlO1xufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBuZXh0IHNpYmxpbmcgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGNvbnN0IHBOZXh0T3JQYXJlbnQgPSBub2RlLnBOZXh0T3JQYXJlbnQ7XG5cbiAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAvLyBUaGUgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICBjb25zdCBpc0xhc3RQcm9qZWN0ZWROb2RlID0gcE5leHRPclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbjtcbiAgICAvLyByZXR1cm5zIHBOZXh0T3JQYXJlbnQgaWYgd2UgYXJlIG5vdCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0LCBudWxsIG90aGVyd2lzZVxuICAgIHJldHVybiBpc0xhc3RQcm9qZWN0ZWROb2RlID8gbnVsbCA6IHBOZXh0T3JQYXJlbnQ7XG4gIH1cblxuICAvLyByZXR1cm5zIG5vZGUubmV4dCBiZWNhdXNlIHRoZSB0aGUgbm9kZSBpcyBub3QgcHJvamVjdGVkXG4gIHJldHVybiBnZXROZXh0TE5vZGUobm9kZSk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAqXG4gKiBAcGFyYW0gaW5pdGlhbE5vZGUgVGhlIG5vZGUgd2hvc2UgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgcm9vdCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgc2hvdWxkIHN0b3AuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShpbml0aWFsTm9kZTogTE5vZGUsIHJvb3ROb2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGluaXRpYWxOb2RlO1xuICBsZXQgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgd2hpbGUgKG5vZGUgJiYgIW5leHROb2RlKSB7XG4gICAgLy8gaWYgbm9kZS5wTmV4dE9yUGFyZW50IGlzIG5vdCBudWxsIGhlcmUsIGl0IGlzIG5vdCB0aGUgbmV4dCBub2RlXG4gICAgLy8gKGJlY2F1c2UsIGF0IHRoaXMgcG9pbnQsIG5leHROb2RlIGlzIG51bGwsIHNvIGl0IGlzIHRoZSBwYXJlbnQpXG4gICAgbm9kZSA9IG5vZGUucE5leHRPclBhcmVudCB8fCBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgICBpZiAobm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBuZXh0Tm9kZSA9IG5vZGUgJiYgZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIH1cbiAgcmV0dXJuIG5leHROb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGluc2lkZSB0aGUgZ2l2ZW4gTE5vZGUuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgZmlyc3QgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZFxuICogQHJldHVybnMgUk5vZGUgVGhlIGZpcnN0IFJOb2RlIG9mIHRoZSBnaXZlbiBMTm9kZSBvciBudWxsIGlmIHRoZXJlIGlzIG5vbmUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFJOb2RlKHJvb3ROb2RlOiBMTm9kZSk6IFJFbGVtZW50fFJUZXh0fG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IHJvb3ROb2RlO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIC8vIEEgTEVsZW1lbnROb2RlIGhhcyBhIG1hdGNoaW5nIFJOb2RlIGluIExFbGVtZW50Tm9kZS5uYXRpdmVcbiAgICAgIHJldHVybiAobm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZTtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIG5leHROb2RlID1cbiAgICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEudmlld3MubGVuZ3RoID8gZ2V0Q2hpbGRMTm9kZShjaGlsZENvbnRhaW5lckRhdGEudmlld3NbMF0pIDogbnVsbDtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIEZvciBQcm9qZWN0aW9uIGxvb2sgYXQgdGhlIGZpcnN0IHByb2plY3RlZCBub2RlXG4gICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbG9vayBhdCB0aGUgZmlyc3QgY2hpbGRcbiAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSk7XG4gICAgfVxuXG4gICAgbm9kZSA9IG5leHROb2RlID09PSBudWxsID8gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpIDogbmV4dE5vZGU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh2YWx1ZTogYW55LCByZW5kZXJlcjogUmVuZGVyZXIzKTogUlRleHQge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuY3JlYXRlVGV4dChzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZShzdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBBZGRzIG9yIHJlbW92ZXMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byByZW1vdmUgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgdG8gd2hpY2ggdGhlIHJvb3QgdmlldyBiZWxvbmdzXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogdHJ1ZSxcbiAgICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBib29sZWFuLFxuICAgIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShyb290Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICBjb25zdCBwYXJlbnROb2RlID0gY29udGFpbmVyLmRhdGEucmVuZGVyUGFyZW50O1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGdldENoaWxkTE5vZGUocm9vdE5vZGUpO1xuICBpZiAocGFyZW50KSB7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICBjb25zdCByZW5kZXJlciA9IGNvbnRhaW5lci52aWV3LnJlbmRlcmVyO1xuICAgICAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgaWYgKGluc2VydE1vZGUpIHtcbiAgICAgICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCkgOlxuICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIG5vZGUubmF0aXZlICEpO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgICAgICAgICByZW5kZXJlci5kZXN0cm95Tm9kZShub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG5vZGUubmF0aXZlICEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZShub2RlKTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIC8vIGlmIHdlIGdldCB0byBhIGNvbnRhaW5lciwgaXQgbXVzdCBiZSBhIHJvb3Qgbm9kZSBvZiBhIHZpZXcgYmVjYXVzZSB3ZSBhcmUgb25seVxuICAgICAgICAvLyBwcm9wYWdhdGluZyBkb3duIGludG8gY2hpbGQgdmlld3MgLyBjb250YWluZXJzIGFuZCBub3QgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YS5yZW5kZXJQYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEudmlld3MubGVuZ3RoID8gZ2V0Q2hpbGRMTm9kZShjaGlsZENvbnRhaW5lckRhdGEudmlld3NbMF0pIDogbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dE5vZGUgPSBnZXRDaGlsZExOb2RlKG5vZGUgYXMgTFZpZXdOb2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbnVsbCkge1xuICAgICAgICBub2RlID0gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZSA9IG5leHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBBIHZpZXcgdG8gY2xlYW51cCBkb2Vzbid0IGhhdmUgY2hpbGRyZW4gc28gd2Ugc2hvdWxkIG5vdCB0cnkgdG8gZGVzY2VuZCBkb3duIHRoZSB2aWV3IHRyZWUuXG4gIGlmICghcm9vdFZpZXcuY2hpbGQpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSByb290Vmlldy5jaGlsZDtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci52aWV3cyAmJiB2aWV3T3JDb250YWluZXIudmlld3MubGVuZ3RoKSB7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyLnZpZXdzWzBdLmRhdGE7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIuY2hpbGQpIHtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIuY2hpbGQ7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIubmV4dCkge1xuICAgICAgLy8gT25seSBtb3ZlIHRvIHRoZSBzaWRlIGFuZCBjbGVhbiBpZiBvcGVyYXRpbmcgYmVsb3cgcm9vdFZpZXcgLVxuICAgICAgLy8gb3RoZXJ3aXNlIHdlIHdvdWxkIHN0YXJ0IGNsZWFuaW5nIHVwIHNpYmxpbmcgdmlld3Mgb2YgdGhlIHJvb3RWaWV3LlxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBJZiB0aGUgdmlld09yQ29udGFpbmVyIGlzIHRoZSByb290VmlldyBhbmQgbmV4dCBpcyBudWxsIGl0IG1lYW5zIHRoYXQgd2UgYXJlIGRlYWxpbmdcbiAgICAgIC8vIHdpdGggYSByb290IHZpZXcgdGhhdCBkb2Vzbid0IGhhdmUgY2hpbGRyZW4uIFdlIGRpZG4ndCBkZXNjZW5kIGludG8gY2hpbGQgdmlld3NcbiAgICAgIC8vIHNvIG5vIG5lZWQgdG8gZ28gYmFjayB1cCB0aGUgdmlld3MgdHJlZS5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhLm5leHQgJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyB8fCByb290Vmlldyk7XG5cbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyLm5leHQ7XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGUudmlld3M7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIHZpZXdzW2luZGV4IC0gMV0uZGF0YS5uZXh0ID0gdmlld05vZGUuZGF0YSBhcyBMVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIHZpZXdOb2RlLmRhdGEubmV4dCA9IHZpZXdzW2luZGV4XS5kYXRhO1xuICAgIHZpZXdzLnNwbGljZShpbmRleCwgMCwgdmlld05vZGUpO1xuICB9IGVsc2Uge1xuICAgIHZpZXdzLnB1c2godmlld05vZGUpO1xuICAgIHZpZXdOb2RlLmRhdGEubmV4dCA9IG51bGw7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxWaWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKGxWaWV3LnF1ZXJpZXMpIHtcbiAgICBsVmlldy5xdWVyaWVzLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gSWYgdGhlIGNvbnRhaW5lcidzIHJlbmRlclBhcmVudCBpcyBudWxsLCB3ZSBrbm93IHRoYXQgaXQgaXMgYSByb290IG5vZGUgb2YgaXRzIG93biBwYXJlbnQgdmlld1xuICAvLyBhbmQgd2Ugc2hvdWxkIHdhaXQgdW50aWwgdGhhdCBwYXJlbnQgcHJvY2Vzc2VzIGl0cyBub2RlcyAob3RoZXJ3aXNlLCB3ZSB3aWxsIGluc2VydCB0aGlzIHZpZXcnc1xuICAvLyBub2RlcyB0d2ljZSAtIG9uY2Ugbm93IGFuZCBvbmNlIHdoZW4gaXRzIHBhcmVudCBpbnNlcnRzIGl0cyB2aWV3cykuXG4gIGlmIChjb250YWluZXIuZGF0YS5yZW5kZXJQYXJlbnQgIT09IG51bGwpIHtcbiAgICBsZXQgYmVmb3JlTm9kZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKHZpZXdOb2RlLCBjb250YWluZXIpO1xuXG4gICAgaWYgKCFiZWZvcmVOb2RlKSB7XG4gICAgICBsZXQgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlO1xuICAgICAgaWYgKGNvbnRhaW5lck5leHROYXRpdmVOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlID0gZmluZE5leHRSTm9kZVNpYmxpbmcoY29udGFpbmVyLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGJlZm9yZU5vZGUgPSBjb250YWluZXJOZXh0TmF0aXZlTm9kZTtcbiAgICB9XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG4gIH1cblxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTSBhbmQgY29uZHVjdHMgY2xlYW51cCAoZS5nLiByZW1vdmluZ1xuICogbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhLnZpZXdzO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV0uZGF0YS5uZXh0ID0gdmlld05vZGUuZGF0YS5uZXh0IGFzIExWaWV3O1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3Tm9kZS5kYXRhKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb25zdCByZW1vdmVkTHZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAocmVtb3ZlZEx2aWV3LnF1ZXJpZXMpIHtcbiAgICByZW1vdmVkTHZpZXcucXVlcmllcy5yZW1vdmVWaWV3KHJlbW92ZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUoc3RhdGU6IExWaWV3T3JMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld09yTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IG5vZGU7XG4gIGlmICgobm9kZSA9IChzdGF0ZSBhcyBMVmlldykgIS5ub2RlKSAmJiBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRQYXJlbnRMTm9kZShub2RlKSAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZS5wYXJlbnQgPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlLnBhcmVudDtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBhbmQgY2FsbCBhbGwgb25EZXN0cm95cyBpbiBhIGdpdmVuIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gIGlmICh2aWV3LmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3LnJlbmRlcmVyKSkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgdmlldy5yZW5kZXJlci5kZXN0cm95KCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3LmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2xlYW51cCAhW2kgKyAxXS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGNsZWFudXBbaSArIDJdLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjbGVhbnVwW2kgKyAxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXcuY2xlYW51cCA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXcudFZpZXc7XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlldy5kaXJlY3RpdmVzICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXcudFZpZXcgJiYgdmlldy50Vmlldy5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3LmRhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQgaW4gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGUgbmF0aXZlIG5vZGUgY2FuIGJlIGluc2VydGVkIHdoZW4gaXRzIHBhcmVudCBpczpcbiAqIC0gQSByZWd1bGFyIGVsZW1lbnQgPT4gWWVzXG4gKiAtIEEgY29tcG9uZW50IGhvc3QgZWxlbWVudCA9PlxuICogICAgLSBpZiB0aGUgYGN1cnJlbnRWaWV3YCA9PT0gdGhlIHBhcmVudCBgdmlld2A6IFRoZSBlbGVtZW50IGlzIGluIHRoZSBjb250ZW50ICh2cyB0aGVcbiAqICAgICAgdGVtcGxhdGUpXG4gKiAgICAgID0+IGRvbid0IGFkZCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCB3aWxsIHByb2plY3QgaWYgbmVlZGVkLlxuICogICAgLSBgY3VycmVudFZpZXdgICE9PSB0aGUgcGFyZW50IGB2aWV3YCA9PiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdGVtcGxhdGUgKHZzIHRoZSBjb250ZW50KSxcbiAqICAgICAgYWRkIGl0XG4gKiAtIFZpZXcgZWxlbWVudCA9PiBkZWxheSBpbnNlcnRpb24sIHdpbGwgYmUgZG9uZSBvbiBgdmlld0VuZCgpYFxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBpbiB3aGljaCB0byBpbnNlcnQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIExWaWV3IGJlaW5nIHByb2Nlc3NlZFxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQ6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50SXNFbGVtZW50ID0gcGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50O1xuXG4gIHJldHVybiBwYXJlbnRJc0VsZW1lbnQgJiZcbiAgICAgIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcgfHwgcGFyZW50LmRhdGEgPT09IG51bGwgLyogUmVndWxhciBFbGVtZW50LiAqLyk7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBXZSBvbmx5IGFkZCBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlldy5yZW5kZXJlcjtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBub2RlIGJlZm9yZSB0aGUgY29ycmVjdCBlbGVtZW50IGluIHRoZSBET00uXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9XG4gKlxuICogQHBhcmFtIG5vZGUgTm9kZSB0byBpbnNlcnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRDaGlsZChub2RlOiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpICE7XG4gIGlmIChjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgbGV0IG5hdGl2ZVNpYmxpbmc6IFJOb2RlfG51bGwgPSBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlLCBudWxsKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3LnJlbmRlcmVyO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQubmF0aXZlICEsIG5vZGUubmF0aXZlICEsIG5hdGl2ZVNpYmxpbmcpIDpcbiAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBuYXRpdmVTaWJsaW5nLCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSxcbiAgICBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKG5vZGUudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIChub2RlIGFzIExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSkubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIENvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBFbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ25lZSB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lci5yZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lci52aWV3cztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbnVsbCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEucmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgfVxufVxuIl19