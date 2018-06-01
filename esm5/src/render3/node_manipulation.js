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
                        renderer.insertBefore(parent, node.native, beforeNode) :
                        parent.insertBefore(node.native, beforeNode, true);
                }
                else {
                    if (isProceduralRenderer(renderer)) {
                        renderer.removeChild(parent, node.native);
                        if (renderer.destroyNode) {
                            ngDevMode && ngDevMode.rendererDestroyNode++;
                            renderer.destroyNode(node.native);
                        }
                    }
                    else {
                        parent.removeChild(node.native);
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
    // If the view has no children, we can clean it up and return early.
    if (rootView.tView.childIndex === -1) {
        return cleanUpView(rootView);
    }
    var viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        var next = null;
        if (viewOrContainer.views && viewOrContainer.views.length) {
            next = viewOrContainer.views[0].data;
        }
        else if (viewOrContainer.tView && viewOrContainer.tView.childIndex > -1) {
            next = getLViewChild(viewOrContainer);
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
/** Gets the child of the given LView */
export function getLViewChild(view) {
    if (view.tView.childIndex === -1)
        return null;
    var hostNode = view.data[view.tView.childIndex];
    return hostNode.data ? hostNode.data : hostNode.dynamicLContainerNode.data;
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
    var cleanup = view.cleanup;
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
        callHooks(view.directives, destroyHooks);
    }
}
/** Calls pipe destroy hooks for this view */
function executePipeOnDestroys(view) {
    var pipeDestroyHooks = view.tView && view.tView.pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(view.data, pipeDestroyHooks);
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
    var parent = getParentLNode(node);
    if (canInsertNativeNode(parent, currentView)) {
        var nativeSibling = findNextRNodeSibling(node, null);
        var renderer = currentView.renderer;
        isProceduralRenderer(renderer) ?
            renderer.insertBefore(parent.native, node.native, nativeSibling) :
            parent.native.insertBefore(node.native, nativeSibling, false);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFhLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzVGLE9BQU8sRUFBb0csNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUssT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBeUQsb0JBQW9CLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDN0osT0FBTyxFQUE0Qyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0SCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFakMsSUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBRWhGOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsOEJBQThCLElBQWtCLEVBQUUsUUFBc0I7SUFDdEUsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQ3ZCLE9BQU8sV0FBVyxJQUFJLFdBQVcsS0FBSyxRQUFRLEVBQUU7UUFDOUMsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUM5QyxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIs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QUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxNQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFRLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3ZFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLDhCQUNGLElBQStDLEVBQUUsYUFBMkIsRUFDNUUsV0FBa0I7SUFDcEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7UUFDM0MsV0FBVyxDQUFDLGFBQWEsRUFBRyxJQUFpQyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNwRjtTQUFNO1FBQ0wsOEVBQThFO1FBQzlFLDhDQUE4QztRQUM5QywrRUFBK0U7UUFDL0UsK0RBQStEO1FBQy9ELHlEQUF5RDtRQUN6RCxJQUFNLFVBQVUsR0FBSSxJQUF1QixDQUFDLElBQUksQ0FBQztRQUNqRCxVQUFVLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztRQUN4QyxJQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLDBCQUEwQixDQUFDLElBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxRTtLQUNGO0lBQ0QsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDOUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO0tBQzlEO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7SG9va0RhdGEsIExWaWV3LCBMVmlld09yTENvbnRhaW5lciwgVFZpZXcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgZm9sbG93aW5nIHRoZSBnaXZlbiBMTm9kZSBpbiB0aGUgc2FtZSBwYXJlbnQgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gaW5zZXJ0IHRoZSBnaXZlbiBub2RlIHdpdGggaW5zZXJ0QmVmb3JlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBET00gbm9kZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHN0b3BOb2RlIEEgcGFyZW50IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBpbiB0aGUgdHJlZSBzaG91bGQgYmUgc3RvcHBlZCwgb3IgbnVsbCBpZiB0aGVcbiAqIGxvb2t1cCBzaG91bGQgbm90IGJlIHN0b3BwZWQgdW50aWwgdGhlIHJlc3VsdCBpcyBmb3VuZC5cbiAqIEByZXR1cm5zIFJOb2RlIGJlZm9yZSB3aGljaCB0aGUgcHJvdmlkZWQgbm9kZSBzaG91bGQgYmUgaW5zZXJ0ZWQgb3IgbnVsbCBpZiB0aGUgbG9va3VwIHdhc1xuICogc3RvcHBlZFxuICogb3IgaWYgdGhlcmUgaXMgbm8gbmF0aXZlIG5vZGUgYWZ0ZXIgdGhlIGdpdmVuIGxvZ2ljYWwgbm9kZSBpbiB0aGUgc2FtZSBuYXRpdmUgcGFyZW50LlxuICovXG5mdW5jdGlvbiBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlOiBMTm9kZSB8IG51bGwsIHN0b3BOb2RlOiBMTm9kZSB8IG51bGwpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gbm9kZTtcbiAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlICE9PSBzdG9wTm9kZSkge1xuICAgIGxldCBwTmV4dE9yUGFyZW50ID0gY3VycmVudE5vZGUucE5leHRPclBhcmVudDtcbiAgICBpZiAocE5leHRPclBhcmVudCkge1xuICAgICAgd2hpbGUgKHBOZXh0T3JQYXJlbnQudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKHBOZXh0T3JQYXJlbnQpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIHBOZXh0T3JQYXJlbnQgPSBwTmV4dE9yUGFyZW50LnBOZXh0T3JQYXJlbnQgITtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gcE5leHRPclBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnROb2RlKTtcbiAgICAgIHdoaWxlIChjdXJyZW50U2libGluZykge1xuICAgICAgICBjb25zdCBuYXRpdmVOb2RlID0gZmluZEZpcnN0Uk5vZGUoY3VycmVudFNpYmxpbmcpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRUeXBlID0gcGFyZW50Tm9kZS50Tm9kZS50eXBlO1xuICAgICAgICBpZiAocGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciB8fCBwYXJlbnRUeXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgc2libGluZyBub2RlIGZvciB0aGUgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZXh0TE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgLy8gVmlldyBub2RlcyBkb24ndCBoYXZlIFROb2Rlcywgc28gdGhlaXIgbmV4dCBtdXN0IGJlIHJldHJpZXZlZCB0aHJvdWdoIHRoZWlyIExWaWV3LlxuICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIGNvbnN0IGxWaWV3ID0gbm9kZS5kYXRhIGFzIExWaWV3O1xuICAgIHJldHVybiBsVmlldy5uZXh0ID8gKGxWaWV3Lm5leHQgYXMgTFZpZXcpLm5vZGUgOiBudWxsO1xuICB9XG4gIHJldHVybiBub2RlLnROb2RlLm5leHQgPyBub2RlLnZpZXcuZGF0YVtub2RlLnROb2RlLm5leHQgIS5pbmRleCBhcyBudW1iZXJdIDogbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgZmlyc3QgY2hpbGQgb2YgYSBnaXZlbiBub2RlICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hpbGRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5jaGlsZCkge1xuICAgIGNvbnN0IHZpZXcgPSBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID8gbm9kZS5kYXRhIGFzIExWaWV3IDogbm9kZS52aWV3O1xuICAgIHJldHVybiB2aWV3LmRhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleCBhcyBudW1iZXJdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBwYXJlbnQgTE5vZGUgb2YgYSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExQcm9qZWN0aW9uTm9kZSk6IExFbGVtZW50Tm9kZXxcbiAgICBMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTFZpZXdOb2RlKTogTENvbnRhaW5lck5vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZXxMVmlld05vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZXxMVmlld05vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmluZGV4ID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFyZW50ID0gbm9kZS50Tm9kZS5wYXJlbnQ7XG4gIHJldHVybiBwYXJlbnQgPyBub2RlLnZpZXcuZGF0YVtwYXJlbnQuaW5kZXggYXMgbnVtYmVyXSA6IG5vZGUudmlldy5ub2RlO1xufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBuZXh0IHNpYmxpbmcgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGNvbnN0IHBOZXh0T3JQYXJlbnQgPSBub2RlLnBOZXh0T3JQYXJlbnQ7XG5cbiAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAvLyBUaGUgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICBjb25zdCBpc0xhc3RQcm9qZWN0ZWROb2RlID0gcE5leHRPclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbjtcbiAgICAvLyByZXR1cm5zIHBOZXh0T3JQYXJlbnQgaWYgd2UgYXJlIG5vdCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0LCBudWxsIG90aGVyd2lzZVxuICAgIHJldHVybiBpc0xhc3RQcm9qZWN0ZWROb2RlID8gbnVsbCA6IHBOZXh0T3JQYXJlbnQ7XG4gIH1cblxuICAvLyByZXR1cm5zIG5vZGUubmV4dCBiZWNhdXNlIHRoZSB0aGUgbm9kZSBpcyBub3QgcHJvamVjdGVkXG4gIHJldHVybiBnZXROZXh0TE5vZGUobm9kZSk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAqXG4gKiBAcGFyYW0gaW5pdGlhbE5vZGUgVGhlIG5vZGUgd2hvc2UgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgcm9vdCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgc2hvdWxkIHN0b3AuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShpbml0aWFsTm9kZTogTE5vZGUsIHJvb3ROb2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGluaXRpYWxOb2RlO1xuICBsZXQgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgd2hpbGUgKG5vZGUgJiYgIW5leHROb2RlKSB7XG4gICAgLy8gaWYgbm9kZS5wTmV4dE9yUGFyZW50IGlzIG5vdCBudWxsIGhlcmUsIGl0IGlzIG5vdCB0aGUgbmV4dCBub2RlXG4gICAgLy8gKGJlY2F1c2UsIGF0IHRoaXMgcG9pbnQsIG5leHROb2RlIGlzIG51bGwsIHNvIGl0IGlzIHRoZSBwYXJlbnQpXG4gICAgbm9kZSA9IG5vZGUucE5leHRPclBhcmVudCB8fCBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgICBpZiAobm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBuZXh0Tm9kZSA9IG5vZGUgJiYgZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIH1cbiAgcmV0dXJuIG5leHROb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGluc2lkZSB0aGUgZ2l2ZW4gTE5vZGUuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgZmlyc3QgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZFxuICogQHJldHVybnMgUk5vZGUgVGhlIGZpcnN0IFJOb2RlIG9mIHRoZSBnaXZlbiBMTm9kZSBvciBudWxsIGlmIHRoZXJlIGlzIG5vbmUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFJOb2RlKHJvb3ROb2RlOiBMTm9kZSk6IFJFbGVtZW50fFJUZXh0fG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IHJvb3ROb2RlO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIC8vIEEgTEVsZW1lbnROb2RlIGhhcyBhIG1hdGNoaW5nIFJOb2RlIGluIExFbGVtZW50Tm9kZS5uYXRpdmVcbiAgICAgIHJldHVybiAobm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZTtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIG5leHROb2RlID1cbiAgICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEudmlld3MubGVuZ3RoID8gZ2V0Q2hpbGRMTm9kZShjaGlsZENvbnRhaW5lckRhdGEudmlld3NbMF0pIDogbnVsbDtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIEZvciBQcm9qZWN0aW9uIGxvb2sgYXQgdGhlIGZpcnN0IHByb2plY3RlZCBub2RlXG4gICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbG9vayBhdCB0aGUgZmlyc3QgY2hpbGRcbiAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSk7XG4gICAgfVxuXG4gICAgbm9kZSA9IG5leHROb2RlID09PSBudWxsID8gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpIDogbmV4dE5vZGU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh2YWx1ZTogYW55LCByZW5kZXJlcjogUmVuZGVyZXIzKTogUlRleHQge1xuICByZXR1cm4gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuY3JlYXRlVGV4dChzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZShzdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBBZGRzIG9yIHJlbW92ZXMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byByZW1vdmUgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgdG8gd2hpY2ggdGhlIHJvb3QgdmlldyBiZWxvbmdzXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIGluc2VydE1vZGUgV2hldGhlciBvciBub3QgZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIChpZiBmYWxzZSwgcmVtb3ZpbmcpXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogdHJ1ZSxcbiAgICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGZhbHNlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBib29sZWFuLFxuICAgIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShyb290Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICBjb25zdCBwYXJlbnROb2RlID0gY29udGFpbmVyLmRhdGEucmVuZGVyUGFyZW50O1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGdldENoaWxkTE5vZGUocm9vdE5vZGUpO1xuICBpZiAocGFyZW50KSB7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgICBjb25zdCByZW5kZXJlciA9IGNvbnRhaW5lci52aWV3LnJlbmRlcmVyO1xuICAgICAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgaWYgKGluc2VydE1vZGUpIHtcbiAgICAgICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCkgOlxuICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIG5vZGUubmF0aXZlICEpO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgICAgICAgICByZW5kZXJlci5kZXN0cm95Tm9kZShub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG5vZGUubmF0aXZlICEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZShub2RlKTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIC8vIGlmIHdlIGdldCB0byBhIGNvbnRhaW5lciwgaXQgbXVzdCBiZSBhIHJvb3Qgbm9kZSBvZiBhIHZpZXcgYmVjYXVzZSB3ZSBhcmUgb25seVxuICAgICAgICAvLyBwcm9wYWdhdGluZyBkb3duIGludG8gY2hpbGQgdmlld3MgLyBjb250YWluZXJzIGFuZCBub3QgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YS5yZW5kZXJQYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEudmlld3MubGVuZ3RoID8gZ2V0Q2hpbGRMTm9kZShjaGlsZENvbnRhaW5lckRhdGEudmlld3NbMF0pIDogbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dE5vZGUgPSBnZXRDaGlsZExOb2RlKG5vZGUgYXMgTFZpZXdOb2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbnVsbCkge1xuICAgICAgICBub2RlID0gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZSA9IG5leHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBpZiAocm9vdFZpZXcudFZpZXcuY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSBnZXRMVmlld0NoaWxkKHJvb3RWaWV3KTtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci52aWV3cyAmJiB2aWV3T3JDb250YWluZXIudmlld3MubGVuZ3RoKSB7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyLnZpZXdzWzBdLmRhdGE7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIudFZpZXcgJiYgdmlld09yQ29udGFpbmVyLnRWaWV3LmNoaWxkSW5kZXggPiAtMSkge1xuICAgICAgbmV4dCA9IGdldExWaWV3Q2hpbGQodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICB9IGVsc2UgaWYgKHZpZXdPckNvbnRhaW5lci5uZXh0KSB7XG4gICAgICAvLyBPbmx5IG1vdmUgdG8gdGhlIHNpZGUgYW5kIGNsZWFuIGlmIG9wZXJhdGluZyBiZWxvdyByb290VmlldyAtXG4gICAgICAvLyBvdGhlcndpc2Ugd2Ugd291bGQgc3RhcnQgY2xlYW5pbmcgdXAgc2libGluZyB2aWV3cyBvZiB0aGUgcm9vdFZpZXcuXG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lci5uZXh0O1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIElmIHRoZSB2aWV3T3JDb250YWluZXIgaXMgdGhlIHJvb3RWaWV3IGFuZCBuZXh0IGlzIG51bGwgaXQgbWVhbnMgdGhhdCB3ZSBhcmUgZGVhbGluZ1xuICAgICAgLy8gd2l0aCBhIHJvb3QgdmlldyB0aGF0IGRvZXNuJ3QgaGF2ZSBjaGlsZHJlbi4gV2UgZGlkbid0IGRlc2NlbmQgaW50byBjaGlsZCB2aWV3c1xuICAgICAgLy8gc28gbm8gbmVlZCB0byBnbyBiYWNrIHVwIHRoZSB2aWV3cyB0cmVlLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICEubmV4dCAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyk7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3IHx8IHJvb3RWaWV3KTtcblxuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lciAmJiB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gbmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSB2aWV3IGludG8gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBhZGRzIHRoZSB2aWV3IHRvIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MgaW4gdGhlIGNvcnJlY3RcbiAqIHBvc2l0aW9uLiBJdCBhbHNvIGFkZHMgdGhlIHZpZXcncyBlbGVtZW50cyB0byB0aGUgRE9NIGlmIHRoZSBjb250YWluZXIgaXNuJ3QgYVxuICogcm9vdCBub2RlIG9mIGFub3RoZXIgdmlldyAoaW4gdGhhdCBjYXNlLCB0aGUgdmlldydzIGVsZW1lbnRzIHdpbGwgYmUgYWRkZWQgd2hlblxuICogdGhlIGNvbnRhaW5lcidzIHBhcmVudCB2aWV3IGlzIGFkZGVkIGxhdGVyKS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSB2aWV3Tm9kZSBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3XG4gKiBAcmV0dXJucyBUaGUgaW5zZXJ0ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCB2aWV3Tm9kZTogTFZpZXdOb2RlLCBpbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250YWluZXIuZGF0YTtcbiAgY29uc3Qgdmlld3MgPSBzdGF0ZS52aWV3cztcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXS5kYXRhLm5leHQgPSB2aWV3Tm9kZS5kYXRhIGFzIExWaWV3O1xuICB9XG5cbiAgaWYgKGluZGV4IDwgdmlld3MubGVuZ3RoKSB7XG4gICAgdmlld05vZGUuZGF0YS5uZXh0ID0gdmlld3NbaW5kZXhdLmRhdGE7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaCh2aWV3Tm9kZSk7XG4gICAgdmlld05vZGUuZGF0YS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IGEgbmV3IHZpZXcgaGFzIGJlZW4gYWRkZWRcbiAgY29uc3QgbFZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAobFZpZXcucXVlcmllcykge1xuICAgIGxWaWV3LnF1ZXJpZXMuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBJZiB0aGUgY29udGFpbmVyJ3MgcmVuZGVyUGFyZW50IGlzIG51bGwsIHdlIGtub3cgdGhhdCBpdCBpcyBhIHJvb3Qgbm9kZSBvZiBpdHMgb3duIHBhcmVudCB2aWV3XG4gIC8vIGFuZCB3ZSBzaG91bGQgd2FpdCB1bnRpbCB0aGF0IHBhcmVudCBwcm9jZXNzZXMgaXRzIG5vZGVzIChvdGhlcndpc2UsIHdlIHdpbGwgaW5zZXJ0IHRoaXMgdmlldydzXG4gIC8vIG5vZGVzIHR3aWNlIC0gb25jZSBub3cgYW5kIG9uY2Ugd2hlbiBpdHMgcGFyZW50IGluc2VydHMgaXRzIHZpZXdzKS5cbiAgaWYgKGNvbnRhaW5lci5kYXRhLnJlbmRlclBhcmVudCAhPT0gbnVsbCkge1xuICAgIGxldCBiZWZvcmVOb2RlID0gZmluZE5leHRSTm9kZVNpYmxpbmcodmlld05vZGUsIGNvbnRhaW5lcik7XG5cbiAgICBpZiAoIWJlZm9yZU5vZGUpIHtcbiAgICAgIGxldCBjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9IGNvbnRhaW5lci5uYXRpdmU7XG4gICAgICBpZiAoY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9IGNvbnRhaW5lci5uYXRpdmUgPSBmaW5kTmV4dFJOb2RlU2libGluZyhjb250YWluZXIsIG51bGwpO1xuICAgICAgfVxuICAgICAgYmVmb3JlTm9kZSA9IGNvbnRhaW5lck5leHROYXRpdmVOb2RlO1xuICAgIH1cbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIHZpZXdOb2RlLCB0cnVlLCBiZWZvcmVOb2RlKTtcbiAgfVxuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGFuZCBjb25kdWN0cyBjbGVhbnVwIChlLmcuIHJlbW92aW5nXG4gKiBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqIEByZXR1cm5zIFRoZSByZW1vdmVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGEudmlld3M7XG4gIGNvbnN0IHZpZXdOb2RlID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXS5kYXRhLm5leHQgPSB2aWV3Tm9kZS5kYXRhLm5leHQgYXMgTFZpZXc7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgZGVzdHJveVZpZXdUcmVlKHZpZXdOb2RlLmRhdGEpO1xuICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIHZpZXdOb2RlLCBmYWxzZSk7XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgdmlldyBoYXMgYmVlbiByZW1vdmVkXG4gIGNvbnN0IHJlbW92ZWRMdmlldyA9IHZpZXdOb2RlLmRhdGE7XG4gIGlmIChyZW1vdmVkTHZpZXcucXVlcmllcykge1xuICAgIHJlbW92ZWRMdmlldy5xdWVyaWVzLnJlbW92ZVZpZXcocmVtb3ZlSW5kZXgpO1xuICB9XG5cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKiogR2V0cyB0aGUgY2hpbGQgb2YgdGhlIGdpdmVuIExWaWV3ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZCh2aWV3OiBMVmlldyk6IExWaWV3fExDb250YWluZXJ8bnVsbCB7XG4gIGlmICh2aWV3LnRWaWV3LmNoaWxkSW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBob3N0Tm9kZTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlID0gdmlldy5kYXRhW3ZpZXcudFZpZXcuY2hpbGRJbmRleF07XG5cbiAgcmV0dXJuIGhvc3ROb2RlLmRhdGEgPyBob3N0Tm9kZS5kYXRhIDogKGhvc3ROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUoc3RhdGU6IExWaWV3T3JMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld09yTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IG5vZGU7XG4gIGlmICgobm9kZSA9IChzdGF0ZSBhcyBMVmlldykgIS5ub2RlKSAmJiBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRQYXJlbnRMTm9kZShub2RlKSAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZS5wYXJlbnQgPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlLnBhcmVudDtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBhbmQgY2FsbCBhbGwgb25EZXN0cm95cyBpbiBhIGdpdmVuIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gIGlmICh2aWV3LmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3LnJlbmRlcmVyKSkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgdmlldy5yZW5kZXJlci5kZXN0cm95KCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3LmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2xlYW51cCAhW2kgKyAxXS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGNsZWFudXBbaSArIDJdLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjbGVhbnVwW2kgKyAxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXcuY2xlYW51cCA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXcudFZpZXc7XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlldy5kaXJlY3RpdmVzICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXcudFZpZXcgJiYgdmlldy50Vmlldy5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3LmRhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQgaW4gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGUgbmF0aXZlIG5vZGUgY2FuIGJlIGluc2VydGVkIHdoZW4gaXRzIHBhcmVudCBpczpcbiAqIC0gQSByZWd1bGFyIGVsZW1lbnQgPT4gWWVzXG4gKiAtIEEgY29tcG9uZW50IGhvc3QgZWxlbWVudCA9PlxuICogICAgLSBpZiB0aGUgYGN1cnJlbnRWaWV3YCA9PT0gdGhlIHBhcmVudCBgdmlld2A6IFRoZSBlbGVtZW50IGlzIGluIHRoZSBjb250ZW50ICh2cyB0aGVcbiAqICAgICAgdGVtcGxhdGUpXG4gKiAgICAgID0+IGRvbid0IGFkZCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCB3aWxsIHByb2plY3QgaWYgbmVlZGVkLlxuICogICAgLSBgY3VycmVudFZpZXdgICE9PSB0aGUgcGFyZW50IGB2aWV3YCA9PiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdGVtcGxhdGUgKHZzIHRoZSBjb250ZW50KSxcbiAqICAgICAgYWRkIGl0XG4gKiAtIFZpZXcgZWxlbWVudCA9PiBkZWxheSBpbnNlcnRpb24sIHdpbGwgYmUgZG9uZSBvbiBgdmlld0VuZCgpYFxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBpbiB3aGljaCB0byBpbnNlcnQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIExWaWV3IGJlaW5nIHByb2Nlc3NlZFxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQ6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50SXNFbGVtZW50ID0gcGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50O1xuXG4gIHJldHVybiBwYXJlbnRJc0VsZW1lbnQgJiZcbiAgICAgIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcgfHwgcGFyZW50LmRhdGEgPT09IG51bGwgLyogUmVndWxhciBFbGVtZW50LiAqLyk7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBXZSBvbmx5IGFkZCBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlldy5yZW5kZXJlcjtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBub2RlIGJlZm9yZSB0aGUgY29ycmVjdCBlbGVtZW50IGluIHRoZSBET00uXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9XG4gKlxuICogQHBhcmFtIG5vZGUgTm9kZSB0byBpbnNlcnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRDaGlsZChub2RlOiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpICE7XG4gIGlmIChjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgbGV0IG5hdGl2ZVNpYmxpbmc6IFJOb2RlfG51bGwgPSBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlLCBudWxsKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3LnJlbmRlcmVyO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQubmF0aXZlICEsIG5vZGUubmF0aXZlICEsIG5hdGl2ZVNpYmxpbmcpIDpcbiAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBuYXRpdmVTaWJsaW5nLCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSxcbiAgICBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKG5vZGUudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIChub2RlIGFzIExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSkubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIENvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBFbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ25lZSB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lci5yZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lci52aWV3cztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbnVsbCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEucmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgfVxufVxuIl19