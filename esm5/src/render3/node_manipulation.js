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
            while (pNextOrParent.type !== 1 /* Projection */) {
                var nativeNode = findFirstRNode(pNextOrParent);
                if (nativeNode) {
                    return nativeNode;
                }
                pNextOrParent = (pNextOrParent.pNextOrParent);
            }
            currentNode = pNextOrParent;
        }
        else {
            var currentSibling = currentNode.next;
            while (currentSibling) {
                var nativeNode = findFirstRNode(currentSibling);
                if (nativeNode) {
                    return nativeNode;
                }
                currentSibling = currentSibling.next;
            }
            var parentNode = currentNode.parent;
            currentNode = null;
            if (parentNode) {
                var parentType = parentNode.type;
                if (parentType === 0 /* Container */ || parentType === 2 /* View */) {
                    currentNode = parentNode;
                }
            }
        }
    }
    return null;
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
        var isLastProjectedNode = pNextOrParent.type === 1 /* Projection */;
        // returns pNextOrParent if we are not at the end of the list, null otherwise
        return isLastProjectedNode ? null : pNextOrParent;
    }
    // returns node.next because the the node is not projected
    return node.next;
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
        node = node.pNextOrParent || node.parent;
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
        if (node.type === 3 /* Element */) {
            // A LElementNode has a matching RNode in LElementNode.native
            return node.native;
        }
        else if (node.type === 0 /* Container */) {
            var lContainerNode = node;
            var childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            nextNode = childContainerData.views.length ? childContainerData.views[0].child : null;
        }
        else if (node.type === 1 /* Projection */) {
            // For Projection look at the first projected node
            nextNode = node.data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = node.child;
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
    var node = rootNode.child;
    if (parent) {
        while (node) {
            var nextNode = null;
            var renderer = container.view.renderer;
            if (node.type === 3 /* Element */) {
                if (insertMode) {
                    isProceduralRenderer(renderer) ?
                        renderer.insertBefore(parent, (node.native), beforeNode) :
                        parent.insertBefore((node.native), beforeNode, true);
                }
                else {
                    isProceduralRenderer(renderer) ? renderer.removeChild(parent, (node.native)) :
                        parent.removeChild((node.native));
                }
                nextNode = node.next;
            }
            else if (node.type === 0 /* Container */) {
                // if we get to a container, it must be a root node of a view because we are only
                // propagating down into child views / containers and not child elements
                var childContainerData = node.data;
                childContainerData.renderParent = parentNode;
                nextNode = childContainerData.views.length ? childContainerData.views[0].child : null;
            }
            else if (node.type === 1 /* Projection */) {
                nextNode = node.data.head;
            }
            else {
                nextNode = node.child;
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
 * @param newView The view to insert
 * @param index The index at which to insert the view
 * @returns The inserted view
 */
export function insertView(container, newView, index) {
    var state = container.data;
    var views = state.views;
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        setViewNext(views[index - 1], newView);
    }
    if (index < views.length) {
        setViewNext(newView, views[index]);
        views.splice(index, 0, newView);
    }
    else {
        views.push(newView);
    }
    // If the container's renderParent is null, we know that it is a root node of its own parent view
    // and we should wait until that parent processes its nodes (otherwise, we will insert this view's
    // nodes twice - once now and once when its parent inserts its views).
    if (container.data.renderParent !== null) {
        var beforeNode = findNextRNodeSibling(newView, container);
        if (!beforeNode) {
            var containerNextNativeNode = container.native;
            if (containerNextNativeNode === undefined) {
                containerNextNativeNode = container.native = findNextRNodeSibling(container, null);
            }
            beforeNode = containerNextNativeNode;
        }
        addRemoveViewFromContainer(container, newView, true, beforeNode);
    }
    return newView;
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
        setViewNext(views[removeIndex - 1], viewNode.next);
    }
    views.splice(removeIndex, 1);
    viewNode.next = null;
    destroyViewTree(viewNode.data);
    addRemoveViewFromContainer(container, viewNode, false);
    // Notify query that view has been removed
    container.data.queries && container.data.queries.removeView(removeIndex);
    return viewNode;
}
/**
 * Sets a next on the view node, so views in for loops can easily jump from
 * one view to the next to add/remove elements. Also adds the LView (view.data)
 * to the view tree for easy traversal when cleaning up the view.
 *
 * @param view The view to set up
 * @param next The view's new next
 */
export function setViewNext(view, next) {
    view.next = next;
    view.data.next = next ? next.data : null;
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
    if ((node = state.node) && node.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return node.parent.data;
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
    var parentIsElement = parent.type === 3 /* Element */;
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
    var parent = (node.parent);
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
    if (node.type !== 0 /* Container */) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBYSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RixPQUFPLEVBQXdGLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xLLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQXlELG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBNEMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRWpDLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNoRiw4QkFBOEIsSUFBa0IsRUFBRSxRQUFzQjtJQUN0RSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQy9DLElBQUksYUFBYSxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDOUMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNsQixPQUFPLGFBQWEsQ0FBQyxJQUFJLHVCQUF5QixF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QUFLLENBQUM7UUFDL0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsMEJBQTBCLENBQUMsSUFBc0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFFO0tBQ0Y7SUFDRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztLQUM5RDtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydE5vdE51bGx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMTm9kZVR5cGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7dW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkM30gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtIb29rRGF0YSwgTFZpZXcsIExWaWV3T3JMQ29udGFpbmVyLCBUVmlldywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0ICsgdW51c2VkNTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBSTm9kZSBmb2xsb3dpbmcgdGhlIGdpdmVuIExOb2RlIGluIHRoZSBzYW1lIHBhcmVudCBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCBpbiBvcmRlciB0byBpbnNlcnQgdGhlIGdpdmVuIG5vZGUgd2l0aCBpbnNlcnRCZWZvcmUuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgZm9sbG93aW5nIERPTSBub2RlIG11c3QgYmUgZm91bmQuXG4gKiBAcGFyYW0gc3RvcE5vZGUgQSBwYXJlbnQgbm9kZSBhdCB3aGljaCB0aGUgbG9va3VwIGluIHRoZSB0cmVlIHNob3VsZCBiZSBzdG9wcGVkLCBvciBudWxsIGlmIHRoZVxuICogbG9va3VwIHNob3VsZCBub3QgYmUgc3RvcHBlZCB1bnRpbCB0aGUgcmVzdWx0IGlzIGZvdW5kLlxuICogQHJldHVybnMgUk5vZGUgYmVmb3JlIHdoaWNoIHRoZSBwcm92aWRlZCBub2RlIHNob3VsZCBiZSBpbnNlcnRlZCBvciBudWxsIGlmIHRoZSBsb29rdXAgd2FzXG4gKiBzdG9wcGVkXG4gKiBvciBpZiB0aGVyZSBpcyBubyBuYXRpdmUgbm9kZSBhZnRlciB0aGUgZ2l2ZW4gbG9naWNhbCBub2RlIGluIHRoZSBzYW1lIG5hdGl2ZSBwYXJlbnQuXG4gKi9cbmZ1bmN0aW9uIGZpbmROZXh0Uk5vZGVTaWJsaW5nKG5vZGU6IExOb2RlIHwgbnVsbCwgc3RvcE5vZGU6IExOb2RlIHwgbnVsbCk6IFJFbGVtZW50fFJUZXh0fG51bGwge1xuICBsZXQgY3VycmVudE5vZGUgPSBub2RlO1xuICB3aGlsZSAoY3VycmVudE5vZGUgJiYgY3VycmVudE5vZGUgIT09IHN0b3BOb2RlKSB7XG4gICAgbGV0IHBOZXh0T3JQYXJlbnQgPSBjdXJyZW50Tm9kZS5wTmV4dE9yUGFyZW50O1xuICAgIGlmIChwTmV4dE9yUGFyZW50KSB7XG4gICAgICB3aGlsZSAocE5leHRPclBhcmVudC50eXBlICE9PSBMTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBjb25zdCBuYXRpdmVOb2RlID0gZmluZEZpcnN0Uk5vZGUocE5leHRPclBhcmVudCk7XG4gICAgICAgIGlmIChuYXRpdmVOb2RlKSB7XG4gICAgICAgICAgcmV0dXJuIG5hdGl2ZU5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcE5leHRPclBhcmVudCA9IHBOZXh0T3JQYXJlbnQucE5leHRPclBhcmVudCAhO1xuICAgICAgfVxuICAgICAgY3VycmVudE5vZGUgPSBwTmV4dE9yUGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgY3VycmVudFNpYmxpbmcgPSBjdXJyZW50Tm9kZS5uZXh0O1xuICAgICAgd2hpbGUgKGN1cnJlbnRTaWJsaW5nKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZU5vZGUgPSBmaW5kRmlyc3RSTm9kZShjdXJyZW50U2libGluZyk7XG4gICAgICAgIGlmIChuYXRpdmVOb2RlKSB7XG4gICAgICAgICAgcmV0dXJuIG5hdGl2ZU5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudFNpYmxpbmcgPSBjdXJyZW50U2libGluZy5uZXh0O1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudDtcbiAgICAgIGN1cnJlbnROb2RlID0gbnVsbDtcbiAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudFR5cGUgPSBwYXJlbnROb2RlLnR5cGU7XG4gICAgICAgIGlmIChwYXJlbnRUeXBlID09PSBMTm9kZVR5cGUuQ29udGFpbmVyIHx8IHBhcmVudFR5cGUgPT09IExOb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgICAgY3VycmVudE5vZGUgPSBwYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBuZXh0IHNpYmxpbmcgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGNvbnN0IHBOZXh0T3JQYXJlbnQgPSBub2RlLnBOZXh0T3JQYXJlbnQ7XG5cbiAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAvLyBUaGUgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICBjb25zdCBpc0xhc3RQcm9qZWN0ZWROb2RlID0gcE5leHRPclBhcmVudC50eXBlID09PSBMTm9kZVR5cGUuUHJvamVjdGlvbjtcbiAgICAvLyByZXR1cm5zIHBOZXh0T3JQYXJlbnQgaWYgd2UgYXJlIG5vdCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0LCBudWxsIG90aGVyd2lzZVxuICAgIHJldHVybiBpc0xhc3RQcm9qZWN0ZWROb2RlID8gbnVsbCA6IHBOZXh0T3JQYXJlbnQ7XG4gIH1cblxuICAvLyByZXR1cm5zIG5vZGUubmV4dCBiZWNhdXNlIHRoZSB0aGUgbm9kZSBpcyBub3QgcHJvamVjdGVkXG4gIHJldHVybiBub2RlLm5leHQ7XG59XG5cbi8qKlxuICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAqXG4gKiBAcGFyYW0gaW5pdGlhbE5vZGUgVGhlIG5vZGUgd2hvc2UgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgcm9vdCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgc2hvdWxkIHN0b3AuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShpbml0aWFsTm9kZTogTE5vZGUsIHJvb3ROb2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGluaXRpYWxOb2RlO1xuICBsZXQgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgd2hpbGUgKG5vZGUgJiYgIW5leHROb2RlKSB7XG4gICAgLy8gaWYgbm9kZS5wTmV4dE9yUGFyZW50IGlzIG5vdCBudWxsIGhlcmUsIGl0IGlzIG5vdCB0aGUgbmV4dCBub2RlXG4gICAgLy8gKGJlY2F1c2UsIGF0IHRoaXMgcG9pbnQsIG5leHROb2RlIGlzIG51bGwsIHNvIGl0IGlzIHRoZSBwYXJlbnQpXG4gICAgbm9kZSA9IG5vZGUucE5leHRPclBhcmVudCB8fCBub2RlLnBhcmVudDtcbiAgICBpZiAobm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBuZXh0Tm9kZSA9IG5vZGUgJiYgZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIH1cbiAgcmV0dXJuIG5leHROb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGluc2lkZSB0aGUgZ2l2ZW4gTE5vZGUuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgZmlyc3QgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZFxuICogQHJldHVybnMgUk5vZGUgVGhlIGZpcnN0IFJOb2RlIG9mIHRoZSBnaXZlbiBMTm9kZSBvciBudWxsIGlmIHRoZXJlIGlzIG5vbmUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFJOb2RlKHJvb3ROb2RlOiBMTm9kZSk6IFJFbGVtZW50fFJUZXh0fG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IHJvb3ROb2RlO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIC8vIEEgTEVsZW1lbnROb2RlIGhhcyBhIG1hdGNoaW5nIFJOb2RlIGluIExFbGVtZW50Tm9kZS5uYXRpdmVcbiAgICAgIHJldHVybiAobm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZTtcbiAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIG5leHROb2RlID0gY2hpbGRDb250YWluZXJEYXRhLnZpZXdzLmxlbmd0aCA/IGNoaWxkQ29udGFpbmVyRGF0YS52aWV3c1swXS5jaGlsZCA6IG51bGw7XG4gICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBGb3IgUHJvamVjdGlvbiBsb29rIGF0IHRoZSBmaXJzdCBwcm9qZWN0ZWQgbm9kZVxuICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgYXQgdGhlIGZpcnN0IGNoaWxkXG4gICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExWaWV3Tm9kZSkuY2hpbGQ7XG4gICAgfVxuXG4gICAgbm9kZSA9IG5leHROb2RlID09PSBudWxsID8gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpIDogbmV4dE5vZGU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh2YWx1ZTogYW55LCByZW5kZXJlcjogUmVuZGVyZXIzKTogUlRleHQge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuY3JlYXRlVGV4dChzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZShzdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBBZGRzIG9yIHJlbW92ZXMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byByZW1vdmUgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgdG8gd2hpY2ggdGhlIHJvb3QgdmlldyBiZWxvbmdzXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogdHJ1ZSxcbiAgICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBib29sZWFuLFxuICAgIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgTE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShyb290Tm9kZSwgTE5vZGVUeXBlLlZpZXcpO1xuICBjb25zdCBwYXJlbnROb2RlID0gY29udGFpbmVyLmRhdGEucmVuZGVyUGFyZW50O1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IHJvb3ROb2RlLmNoaWxkO1xuICBpZiAocGFyZW50KSB7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICBjb25zdCByZW5kZXJlciA9IGNvbnRhaW5lci52aWV3LnJlbmRlcmVyO1xuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgaWYgKGluc2VydE1vZGUpIHtcbiAgICAgICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCkgOlxuICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIG5vZGUubmF0aXZlICEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZS5uYXRpdmUgISk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dE5vZGUgPSBub2RlLm5leHQ7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAvLyBpZiB3ZSBnZXQgdG8gYSBjb250YWluZXIsIGl0IG11c3QgYmUgYSByb290IG5vZGUgb2YgYSB2aWV3IGJlY2F1c2Ugd2UgYXJlIG9ubHlcbiAgICAgICAgLy8gcHJvcGFnYXRpbmcgZG93biBpbnRvIGNoaWxkIHZpZXdzIC8gY29udGFpbmVycyBhbmQgbm90IGNoaWxkIGVsZW1lbnRzXG4gICAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEucmVuZGVyUGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgbmV4dE5vZGUgPSBjaGlsZENvbnRhaW5lckRhdGEudmlld3MubGVuZ3RoID8gY2hpbGRDb250YWluZXJEYXRhLnZpZXdzWzBdLmNoaWxkIDogbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMVmlld05vZGUpLmNoaWxkO1xuICAgICAgfVxuICAgICAgaWYgKG5leHROb2RlID09PSBudWxsKSB7XG4gICAgICAgIG5vZGUgPSBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShub2RlLCByb290Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gbmV4dE5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIEEgdmlldyB0byBjbGVhbnVwIGRvZXNuJ3QgaGF2ZSBjaGlsZHJlbiBzbyB3ZSBzaG91bGQgbm90IHRyeSB0byBkZXNjZW5kIGRvd24gdGhlIHZpZXcgdHJlZS5cbiAgaWYgKCFyb290Vmlldy5jaGlsZCkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdPckxDb250YWluZXJ8bnVsbCA9IHJvb3RWaWV3LmNoaWxkO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdPckxDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLnZpZXdzICYmIHZpZXdPckNvbnRhaW5lci52aWV3cy5sZW5ndGgpIHtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIudmlld3NbMF0uZGF0YTtcbiAgICB9IGVsc2UgaWYgKHZpZXdPckNvbnRhaW5lci5jaGlsZCkge1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lci5jaGlsZDtcbiAgICB9IGVsc2UgaWYgKHZpZXdPckNvbnRhaW5lci5uZXh0KSB7XG4gICAgICAvLyBPbmx5IG1vdmUgdG8gdGhlIHNpZGUgYW5kIGNsZWFuIGlmIG9wZXJhdGluZyBiZWxvdyByb290VmlldyAtXG4gICAgICAvLyBvdGhlcndpc2Ugd2Ugd291bGQgc3RhcnQgY2xlYW5pbmcgdXAgc2libGluZyB2aWV3cyBvZiB0aGUgcm9vdFZpZXcuXG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lci5uZXh0O1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIElmIHRoZSB2aWV3T3JDb250YWluZXIgaXMgdGhlIHJvb3RWaWV3IGFuZCBuZXh0IGlzIG51bGwgaXQgbWVhbnMgdGhhdCB3ZSBhcmUgZGVhbGluZ1xuICAgICAgLy8gd2l0aCBhIHJvb3QgdmlldyB0aGF0IGRvZXNuJ3QgaGF2ZSBjaGlsZHJlbi4gV2UgZGlkbid0IGRlc2NlbmQgaW50byBjaGlsZCB2aWV3c1xuICAgICAgLy8gc28gbm8gbmVlZCB0byBnbyBiYWNrIHVwIHRoZSB2aWV3cyB0cmVlLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICEubmV4dCAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyk7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3IHx8IHJvb3RWaWV3KTtcblxuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lciAmJiB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBuZXdWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEByZXR1cm5zIFRoZSBpbnNlcnRlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIG5ld1ZpZXc6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGUudmlld3M7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIHNldFZpZXdOZXh0KHZpZXdzW2luZGV4IC0gMV0sIG5ld1ZpZXcpO1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgc2V0Vmlld05leHQobmV3Vmlldywgdmlld3NbaW5kZXhdKTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIG5ld1ZpZXcpO1xuICB9IGVsc2Uge1xuICAgIHZpZXdzLnB1c2gobmV3Vmlldyk7XG4gIH1cblxuICAvLyBJZiB0aGUgY29udGFpbmVyJ3MgcmVuZGVyUGFyZW50IGlzIG51bGwsIHdlIGtub3cgdGhhdCBpdCBpcyBhIHJvb3Qgbm9kZSBvZiBpdHMgb3duIHBhcmVudCB2aWV3XG4gIC8vIGFuZCB3ZSBzaG91bGQgd2FpdCB1bnRpbCB0aGF0IHBhcmVudCBwcm9jZXNzZXMgaXRzIG5vZGVzIChvdGhlcndpc2UsIHdlIHdpbGwgaW5zZXJ0IHRoaXMgdmlldydzXG4gIC8vIG5vZGVzIHR3aWNlIC0gb25jZSBub3cgYW5kIG9uY2Ugd2hlbiBpdHMgcGFyZW50IGluc2VydHMgaXRzIHZpZXdzKS5cbiAgaWYgKGNvbnRhaW5lci5kYXRhLnJlbmRlclBhcmVudCAhPT0gbnVsbCkge1xuICAgIGxldCBiZWZvcmVOb2RlID0gZmluZE5leHRSTm9kZVNpYmxpbmcobmV3VmlldywgY29udGFpbmVyKTtcbiAgICBpZiAoIWJlZm9yZU5vZGUpIHtcbiAgICAgIGxldCBjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9IGNvbnRhaW5lci5uYXRpdmU7XG4gICAgICBpZiAoY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9IGNvbnRhaW5lci5uYXRpdmUgPSBmaW5kTmV4dFJOb2RlU2libGluZyhjb250YWluZXIsIG51bGwpO1xuICAgICAgfVxuICAgICAgYmVmb3JlTm9kZSA9IGNvbnRhaW5lck5leHROYXRpdmVOb2RlO1xuICAgIH1cbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIG5ld1ZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIG5ld1ZpZXc7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTSBhbmQgY29uZHVjdHMgY2xlYW51cCAoZS5nLiByZW1vdmluZ1xuICogbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhLnZpZXdzO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHNldFZpZXdOZXh0KHZpZXdzW3JlbW92ZUluZGV4IC0gMV0sIHZpZXdOb2RlLm5leHQpO1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIHZpZXdOb2RlLm5leHQgPSBudWxsO1xuICBkZXN0cm95Vmlld1RyZWUodmlld05vZGUuZGF0YSk7XG4gIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGNvbnRhaW5lciwgdmlld05vZGUsIGZhbHNlKTtcbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgdmlldyBoYXMgYmVlbiByZW1vdmVkXG4gIGNvbnRhaW5lci5kYXRhLnF1ZXJpZXMgJiYgY29udGFpbmVyLmRhdGEucXVlcmllcy5yZW1vdmVWaWV3KHJlbW92ZUluZGV4KTtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFNldHMgYSBuZXh0IG9uIHRoZSB2aWV3IG5vZGUsIHNvIHZpZXdzIGluIGZvciBsb29wcyBjYW4gZWFzaWx5IGp1bXAgZnJvbVxuICogb25lIHZpZXcgdG8gdGhlIG5leHQgdG8gYWRkL3JlbW92ZSBlbGVtZW50cy4gQWxzbyBhZGRzIHRoZSBMVmlldyAodmlldy5kYXRhKVxuICogdG8gdGhlIHZpZXcgdHJlZSBmb3IgZWFzeSB0cmF2ZXJzYWwgd2hlbiBjbGVhbmluZyB1cCB0aGUgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byBzZXQgdXBcbiAqIEBwYXJhbSBuZXh0IFRoZSB2aWV3J3MgbmV3IG5leHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFZpZXdOZXh0KHZpZXc6IExWaWV3Tm9kZSwgbmV4dDogTFZpZXdOb2RlIHwgbnVsbCk6IHZvaWQge1xuICB2aWV3Lm5leHQgPSBuZXh0O1xuICB2aWV3LmRhdGEubmV4dCA9IG5leHQgPyBuZXh0LmRhdGEgOiBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXdPckxDb250YWluZXIsIHJvb3RWaWV3OiBMVmlldyk6IExWaWV3T3JMQ29udGFpbmVyfG51bGwge1xuICBsZXQgbm9kZTtcbiAgaWYgKChub2RlID0gKHN0YXRlIGFzIExWaWV3KSAhLm5vZGUpICYmIG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIG5vZGUucGFyZW50ICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlLnBhcmVudCA9PT0gcm9vdFZpZXcgPyBudWxsIDogc3RhdGUucGFyZW50O1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlldzogTFZpZXcpOiB2b2lkIHtcbiAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXcpO1xufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY2xlYW51cCA9IHZpZXcuY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICBjbGVhbnVwICFbaSArIDFdLnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xlYW51cFtpXSwgY2xlYW51cFtpICsgMl0sIGNsZWFudXBbaSArIDNdKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNsZWFudXBbaSArIDFdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlldy5jbGVhbnVwID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlldy50VmlldztcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3LmRpcmVjdGl2ZXMgISwgZGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKiogQ2FsbHMgcGlwZSBkZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlldy50VmlldyAmJiB2aWV3LnRWaWV3LnBpcGVEZXN0cm95SG9va3M7XG4gIGlmIChwaXBlRGVzdHJveUhvb2tzKSB7XG4gICAgY2FsbEhvb2tzKHZpZXcuZGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IHNob3VsZCBiZSBpbnNlcnRlZCBpbiB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZSBuYXRpdmUgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgd2hlbiBpdHMgcGFyZW50IGlzOlxuICogLSBBIHJlZ3VsYXIgZWxlbWVudCA9PiBZZXNcbiAqIC0gQSBjb21wb25lbnQgaG9zdCBlbGVtZW50ID0+XG4gKiAgICAtIGlmIHRoZSBgY3VycmVudFZpZXdgID09PSB0aGUgcGFyZW50IGB2aWV3YDogVGhlIGVsZW1lbnQgaXMgaW4gdGhlIGNvbnRlbnQgKHZzIHRoZVxuICogICAgICB0ZW1wbGF0ZSlcbiAqICAgICAgPT4gZG9uJ3QgYWRkIGFzIHRoZSBwYXJlbnQgY29tcG9uZW50IHdpbGwgcHJvamVjdCBpZiBuZWVkZWQuXG4gKiAgICAtIGBjdXJyZW50Vmlld2AgIT09IHRoZSBwYXJlbnQgYHZpZXdgID0+IFRoZSBlbGVtZW50IGlzIGluIHRoZSB0ZW1wbGF0ZSAodnMgdGhlIGNvbnRlbnQpLFxuICogICAgICBhZGQgaXRcbiAqIC0gVmlldyBlbGVtZW50ID0+IGRlbGF5IGluc2VydGlvbiwgd2lsbCBiZSBkb25lIG9uIGB2aWV3RW5kKClgXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IGluIHdoaWNoIHRvIGluc2VydCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudDogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICBjb25zdCBwYXJlbnRJc0VsZW1lbnQgPSBwYXJlbnQudHlwZSA9PT0gTE5vZGVUeXBlLkVsZW1lbnQ7XG5cbiAgcmV0dXJuIHBhcmVudElzRWxlbWVudCAmJlxuICAgICAgKHBhcmVudC52aWV3ICE9PSBjdXJyZW50VmlldyB8fCBwYXJlbnQuZGF0YSA9PT0gbnVsbCAvKiBSZWd1bGFyIEVsZW1lbnQuICovKTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfVxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCB0byB3aGljaCB0byBhcHBlbmQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKHBhcmVudDogTE5vZGUsIGNoaWxkOiBSTm9kZSB8IG51bGwsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgYWRkIGVsZW1lbnQgaWYgbm90IGluIFZpZXcgb3Igbm90IHByb2plY3RlZC5cbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3LnJlbmRlcmVyO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudC5uYXRpdmUgIWFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEluc2VydHMgdGhlIHByb3ZpZGVkIG5vZGUgYmVmb3JlIHRoZSBjb3JyZWN0IGVsZW1lbnQgaW4gdGhlIERPTS5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gbm9kZSBOb2RlIHRvIGluc2VydFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydENoaWxkKG5vZGU6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnQgITtcbiAgaWYgKGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICBsZXQgbmF0aXZlU2libGluZzogUk5vZGV8bnVsbCA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKG5vZGUsIG51bGwpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXcucmVuZGVyZXI7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudC5uYXRpdmUgISwgbm9kZS5uYXRpdmUgISwgbmF0aXZlU2libGluZykgOlxuICAgICAgICBwYXJlbnQubmF0aXZlICEuaW5zZXJ0QmVmb3JlKG5vZGUubmF0aXZlICEsIG5hdGl2ZVNpYmxpbmcsIGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGN1cnJlbnRQYXJlbnQgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudDogTEVsZW1lbnROb2RlLFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAobm9kZS50eXBlICE9PSBMTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgYXBwZW5kQ2hpbGQoY3VycmVudFBhcmVudCwgKG5vZGUgYXMgTEVsZW1lbnROb2RlIHwgTFRleHROb2RlKS5uYXRpdmUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgQ29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIEVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbmVlIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbiAgICBsQ29udGFpbmVyLnJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyLnZpZXdzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKG5vZGUgYXMgTENvbnRhaW5lck5vZGUsIHZpZXdzW2ldLCB0cnVlLCBudWxsKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YS5yZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICB9XG59XG4iXX0=