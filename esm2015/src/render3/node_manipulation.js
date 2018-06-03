/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
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
const /** @type {?} */ unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Returns the first RNode following the given LNode in the same parent DOM element.
 *
 * This is needed in order to insert the given node with insertBefore.
 *
 * @param {?} node The node whose following DOM node must be found.
 * @param {?} stopNode A parent node at which the lookup in the tree should be stopped, or null if the
 * lookup should not be stopped until the result is found.
 * @return {?} RNode before which the provided node should be inserted or null if the lookup was
 * stopped
 * or if there is no native node after the given logical node in the same native parent.
 */
function findNextRNodeSibling(node, stopNode) {
    let /** @type {?} */ currentNode = node;
    while (currentNode && currentNode !== stopNode) {
        let /** @type {?} */ pNextOrParent = currentNode.pNextOrParent;
        if (pNextOrParent) {
            while (pNextOrParent.tNode.type !== 1 /* Projection */) {
                const /** @type {?} */ nativeNode = findFirstRNode(pNextOrParent);
                if (nativeNode) {
                    return nativeNode;
                }
                pNextOrParent = /** @type {?} */ ((pNextOrParent.pNextOrParent));
            }
            currentNode = pNextOrParent;
        }
        else {
            let /** @type {?} */ currentSibling = getNextLNode(currentNode);
            while (currentSibling) {
                const /** @type {?} */ nativeNode = findFirstRNode(currentSibling);
                if (nativeNode) {
                    return nativeNode;
                }
                currentSibling = getNextLNode(currentSibling);
            }
            const /** @type {?} */ parentNode = getParentLNode(currentNode);
            currentNode = null;
            if (parentNode) {
                const /** @type {?} */ parentType = parentNode.tNode.type;
                if (parentType === 0 /* Container */ || parentType === 2 /* View */) {
                    currentNode = parentNode;
                }
            }
        }
    }
    return null;
}
/**
 * Retrieves the sibling node for the given node.
 * @param {?} node
 * @return {?}
 */
export function getNextLNode(node) {
    // View nodes don't have TNodes, so their next must be retrieved through their LView.
    if (node.tNode.type === 2 /* View */) {
        const /** @type {?} */ lView = /** @type {?} */ (node.data);
        return lView.next ? (/** @type {?} */ (lView.next)).node : null;
    }
    return node.tNode.next ? node.view.data[/** @type {?} */ ((node.tNode.next)).index] : null;
}
/**
 * Retrieves the first child of a given node
 * @param {?} node
 * @return {?}
 */
export function getChildLNode(node) {
    if (node.tNode.child) {
        const /** @type {?} */ view = node.tNode.type === 2 /* View */ ? /** @type {?} */ (node.data) : node.view;
        return view.data[node.tNode.child.index];
    }
    return null;
}
/**
 * @param {?} node
 * @return {?}
 */
export function getParentLNode(node) {
    if (node.tNode.index === -1)
        return null;
    const /** @type {?} */ parent = node.tNode.parent;
    return parent ? node.view.data[parent.index] : node.view.node;
}
/**
 * Get the next node in the LNode tree, taking into account the place where a node is
 * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
 *
 * @param {?} node The node whose next node in the LNode tree must be found.
 * @return {?} LNode|null The next sibling in the LNode tree.
 */
function getNextLNodeWithProjection(node) {
    const /** @type {?} */ pNextOrParent = node.pNextOrParent;
    if (pNextOrParent) {
        // The node is projected
        const /** @type {?} */ isLastProjectedNode = pNextOrParent.tNode.type === 1 /* Projection */;
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
 * @param {?} initialNode The node whose following node in the LNode tree must be found.
 * @param {?} rootNode The root node at which the lookup should stop.
 * @return {?} LNode|null The following node in the LNode tree.
 */
function getNextOrParentSiblingNode(initialNode, rootNode) {
    let /** @type {?} */ node = initialNode;
    let /** @type {?} */ nextNode = getNextLNodeWithProjection(node);
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
 * @param {?} rootNode
 * @return {?} RNode The first RNode of the given LNode or null if there is none.
 */
function findFirstRNode(rootNode) {
    let /** @type {?} */ node = rootNode;
    while (node) {
        let /** @type {?} */ nextNode = null;
        if (node.tNode.type === 3 /* Element */) {
            // A LElementNode has a matching RNode in LElementNode.native
            return (/** @type {?} */ (node)).native;
        }
        else if (node.tNode.type === 0 /* Container */) {
            const /** @type {?} */ lContainerNode = (/** @type {?} */ (node));
            const /** @type {?} */ childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            nextNode =
                childContainerData.views.length ? getChildLNode(childContainerData.views[0]) : null;
        }
        else if (node.tNode.type === 1 /* Projection */) {
            // For Projection look at the first projected node
            nextNode = (/** @type {?} */ (node)).data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(/** @type {?} */ (node));
        }
        node = nextNode === null ? getNextOrParentSiblingNode(node, rootNode) : nextNode;
    }
    return null;
}
/**
 * @param {?} value
 * @param {?} renderer
 * @return {?}
 */
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
        renderer.createTextNode(stringify(value));
}
/**
 * @param {?} container
 * @param {?} rootNode
 * @param {?} insertMode
 * @param {?=} beforeNode
 * @return {?}
 */
export function addRemoveViewFromContainer(container, rootNode, insertMode, beforeNode) {
    ngDevMode && assertNodeType(container, 0 /* Container */);
    ngDevMode && assertNodeType(rootNode, 2 /* View */);
    const /** @type {?} */ parentNode = container.data.renderParent;
    const /** @type {?} */ parent = parentNode ? parentNode.native : null;
    let /** @type {?} */ node = getChildLNode(rootNode);
    if (parent) {
        while (node) {
            let /** @type {?} */ nextNode = null;
            const /** @type {?} */ renderer = container.view.renderer;
            if (node.tNode.type === 3 /* Element */) {
                if (insertMode) {
                    isProceduralRenderer(renderer) ?
                        renderer.insertBefore(parent, /** @type {?} */ ((node.native)), /** @type {?} */ (beforeNode)) :
                        parent.insertBefore(/** @type {?} */ ((node.native)), /** @type {?} */ (beforeNode), true);
                }
                else {
                    if (isProceduralRenderer(renderer)) {
                        renderer.removeChild(/** @type {?} */ (parent), /** @type {?} */ ((node.native)));
                        if (renderer.destroyNode) {
                            ngDevMode && ngDevMode.rendererDestroyNode++;
                            renderer.destroyNode(/** @type {?} */ ((node.native)));
                        }
                    }
                    else {
                        parent.removeChild(/** @type {?} */ ((node.native)));
                    }
                }
                nextNode = getNextLNode(node);
            }
            else if (node.tNode.type === 0 /* Container */) {
                // if we get to a container, it must be a root node of a view because we are only
                // propagating down into child views / containers and not child elements
                const /** @type {?} */ childContainerData = (/** @type {?} */ (node)).data;
                childContainerData.renderParent = parentNode;
                nextNode =
                    childContainerData.views.length ? getChildLNode(childContainerData.views[0]) : null;
            }
            else if (node.tNode.type === 1 /* Projection */) {
                nextNode = (/** @type {?} */ (node)).data.head;
            }
            else {
                nextNode = getChildLNode(/** @type {?} */ (node));
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
 * @param {?} rootView The view to destroy
 * @return {?}
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    if (rootView.tView.childIndex === -1) {
        return cleanUpView(rootView);
    }
    let /** @type {?} */ viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        let /** @type {?} */ next = null;
        if (viewOrContainer.views && viewOrContainer.views.length) {
            next = viewOrContainer.views[0].data;
        }
        else if (viewOrContainer.tView && viewOrContainer.tView.childIndex > -1) {
            next = getLViewChild(/** @type {?} */ (viewOrContainer));
        }
        else if (viewOrContainer.next) {
            // Only move to the side and clean if operating below rootView -
            // otherwise we would start cleaning up sibling views of the rootView.
            cleanUpView(/** @type {?} */ (viewOrContainer));
            next = viewOrContainer.next;
        }
        if (next == null) {
            // If the viewOrContainer is the rootView and next is null it means that we are dealing
            // with a root view that doesn't have children. We didn't descend into child views
            // so no need to go back up the views tree.
            while (viewOrContainer && !/** @type {?} */ ((viewOrContainer)).next && viewOrContainer !== rootView) {
                cleanUpView(/** @type {?} */ (viewOrContainer));
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(/** @type {?} */ (viewOrContainer) || rootView);
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
 * @param {?} container The container into which the view should be inserted
 * @param {?} viewNode The view to insert
 * @param {?} index The index at which to insert the view
 * @return {?} The inserted view
 */
export function insertView(container, viewNode, index) {
    const /** @type {?} */ state = container.data;
    const /** @type {?} */ views = state.views;
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data.next = /** @type {?} */ (viewNode.data);
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
    const /** @type {?} */ lView = viewNode.data;
    if (lView.queries) {
        lView.queries.insertView(index);
    }
    // If the container's renderParent is null, we know that it is a root node of its own parent view
    // and we should wait until that parent processes its nodes (otherwise, we will insert this view's
    // nodes twice - once now and once when its parent inserts its views).
    if (container.data.renderParent !== null) {
        let /** @type {?} */ beforeNode = findNextRNodeSibling(viewNode, container);
        if (!beforeNode) {
            let /** @type {?} */ containerNextNativeNode = container.native;
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
 * @param {?} container The container from which to remove a view
 * @param {?} removeIndex The index of the view to remove
 * @return {?} The removed view
 */
export function removeView(container, removeIndex) {
    const /** @type {?} */ views = container.data.views;
    const /** @type {?} */ viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data.next = /** @type {?} */ (viewNode.data.next);
    }
    views.splice(removeIndex, 1);
    destroyViewTree(viewNode.data);
    addRemoveViewFromContainer(container, viewNode, false);
    // Notify query that view has been removed
    const /** @type {?} */ removedLview = viewNode.data;
    if (removedLview.queries) {
        removedLview.queries.removeView(removeIndex);
    }
    return viewNode;
}
/**
 * Gets the child of the given LView
 * @param {?} view
 * @return {?}
 */
export function getLViewChild(view) {
    if (view.tView.childIndex === -1)
        return null;
    const /** @type {?} */ hostNode = view.data[view.tView.childIndex];
    return hostNode.data ? hostNode.data : (/** @type {?} */ (hostNode.dynamicLContainerNode)).data;
}
/**
 * Determines which LViewOrLContainer to jump to when traversing back up the
 * tree in destroyViewTree.
 *
 * Normally, the view's parent LView should be checked, but in the case of
 * embedded views, the container (which is the view node's parent, but not the
 * LView's parent) needs to be checked for a possible next property.
 *
 * @param {?} state The LViewOrLContainer for which we need a parent state
 * @param {?} rootView The rootView, so we don't propagate too far up the view tree
 * @return {?} The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    let /** @type {?} */ node;
    if ((node = /** @type {?} */ (((/** @type {?} */ (state)))).node) && node.tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return /** @type {?} */ (((getParentLNode(node))).data);
    }
    else {
        // otherwise, use parent view for containers or component views
        return state.parent === rootView ? null : state.parent;
    }
}
/**
 * Removes all listeners and call all onDestroys in a given view.
 *
 * @param {?} view The LView to clean up
 * @return {?}
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
/**
 * Removes listeners and unsubscribes from output subscriptions
 * @param {?} view
 * @return {?}
 */
function removeListeners(view) {
    const /** @type {?} */ cleanup = /** @type {?} */ ((view.cleanup));
    if (cleanup != null) {
        for (let /** @type {?} */ i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                /** @type {?} */ ((cleanup))[i + 1].removeEventListener(cleanup[i], cleanup[i + 2], cleanup[i + 3]);
                i += 2;
            }
            else {
                cleanup[i].call(cleanup[i + 1]);
            }
        }
        view.cleanup = null;
    }
}
/**
 * Calls onDestroy hooks for this view
 * @param {?} view
 * @return {?}
 */
function executeOnDestroys(view) {
    const /** @type {?} */ tView = view.tView;
    let /** @type {?} */ destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks(/** @type {?} */ ((view.directives)), destroyHooks);
    }
}
/**
 * Calls pipe destroy hooks for this view
 * @param {?} view
 * @return {?}
 */
function executePipeOnDestroys(view) {
    const /** @type {?} */ pipeDestroyHooks = view.tView && view.tView.pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(/** @type {?} */ ((view.data)), pipeDestroyHooks);
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
 * @param {?} parent The parent in which to insert the child
 * @param {?} currentView The LView being processed
 * @return {?} boolean Whether the child element should be inserted.
 */
export function canInsertNativeNode(parent, currentView) {
    const /** @type {?} */ parentIsElement = parent.tNode.type === 3 /* Element */;
    return parentIsElement &&
        (parent.view !== currentView || parent.data === null /* Regular Element. */);
}
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}
 *
 * @param {?} parent The parent to which to append the child
 * @param {?} child The child that should be appended
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        // We only add element if not in View or not projected.
        const /** @type {?} */ renderer = currentView.renderer;
        isProceduralRenderer(renderer) ? renderer.appendChild(/** @type {?} */ (((parent.native))), child) : /** @type {?} */ ((parent.native)).appendChild(child);
        return true;
    }
    return false;
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param {?} node The node to process
 * @param {?} currentParent The last parent element to be processed
 * @param {?} currentView Current LView
 * @return {?}
 */
export function appendProjectedNode(node, currentParent, currentView) {
    if (node.tNode.type !== 0 /* Container */) {
        appendChild(currentParent, (/** @type {?} */ (node)).native, currentView);
    }
    else {
        // The node we are adding is a Container and we are adding it to Element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assignee the final projection location in those cases.
        const /** @type {?} */ lContainer = (/** @type {?} */ (node)).data;
        lContainer.renderParent = currentParent;
        const /** @type {?} */ views = lContainer.views;
        for (let /** @type {?} */ i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(/** @type {?} */ (node), views[i], true, null);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data.renderParent = currentParent;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDNUYsT0FBTyxFQUFvRyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5SyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUF5RCxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3SixPQUFPLEVBQTRDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3RILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVqQyx1QkFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBY2hGLDhCQUE4QixJQUFrQixFQUFFLFFBQXNCO0lBQ3RFLHFCQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRTtRQUM5QyxxQkFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUM5QyxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIsRUFBRTtnQkFDeEQsdUJBQU0s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QyxNQUFNLENBQUMsTUFBTSxLQUFlLEtBQUssQ0FBQyxDQUFDLENBQUMsb0JBQ3pELE1BQU0sQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztDQUNkOzs7Ozs7Ozs7O0FBVUQsTUFBTSw4QkFDRixJQUErQyxFQUFFLGFBQTJCLEVBQzVFLFdBQWtCO0lBQ3BCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixFQUFFO1FBQzNDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsbUJBQUMsSUFBZ0MsRUFBQyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNwRjtTQUFNOzs7Ozs7UUFNTCx1QkFBTSxVQUFVLEdBQUcsbUJBQUMsSUFBc0IsRUFBQyxDQUFDLElBQUksQ0FBQztRQUNqRCxVQUFVLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztRQUN4Qyx1QkFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUMvQixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLG1CQUFDLElBQXNCLEdBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxRTtLQUNGO0lBQ0QsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDOUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO0tBQzlEO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtjYWxsSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0hvb2tEYXRhLCBMVmlldywgTFZpZXdPckxDb250YWluZXIsIFRWaWV3LCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGZvbGxvd2luZyB0aGUgZ2l2ZW4gTE5vZGUgaW4gdGhlIHNhbWUgcGFyZW50IERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGluc2VydCB0aGUgZ2l2ZW4gbm9kZSB3aXRoIGluc2VydEJlZm9yZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSBzdG9wTm9kZSBBIHBhcmVudCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgaW4gdGhlIHRyZWUgc2hvdWxkIGJlIHN0b3BwZWQsIG9yIG51bGwgaWYgdGhlXG4gKiBsb29rdXAgc2hvdWxkIG5vdCBiZSBzdG9wcGVkIHVudGlsIHRoZSByZXN1bHQgaXMgZm91bmQuXG4gKiBAcmV0dXJucyBSTm9kZSBiZWZvcmUgd2hpY2ggdGhlIHByb3ZpZGVkIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkIG9yIG51bGwgaWYgdGhlIGxvb2t1cCB3YXNcbiAqIHN0b3BwZWRcbiAqIG9yIGlmIHRoZXJlIGlzIG5vIG5hdGl2ZSBub2RlIGFmdGVyIHRoZSBnaXZlbiBsb2dpY2FsIG5vZGUgaW4gdGhlIHNhbWUgbmF0aXZlIHBhcmVudC5cbiAqL1xuZnVuY3Rpb24gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZTogTE5vZGUgfCBudWxsLCBzdG9wTm9kZTogTE5vZGUgfCBudWxsKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZSAhPT0gc3RvcE5vZGUpIHtcbiAgICBsZXQgcE5leHRPclBhcmVudCA9IGN1cnJlbnROb2RlLnBOZXh0T3JQYXJlbnQ7XG4gICAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAgIHdoaWxlIChwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZU5vZGUgPSBmaW5kRmlyc3RSTm9kZShwTmV4dE9yUGFyZW50KTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBwTmV4dE9yUGFyZW50ID0gcE5leHRPclBhcmVudC5wTmV4dE9yUGFyZW50ICE7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IHBOZXh0T3JQYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICB3aGlsZSAoY3VycmVudFNpYmxpbmcpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50U2libGluZyk7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUoY3VycmVudE5vZGUpO1xuICAgICAgY3VycmVudE5vZGUgPSBudWxsO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHBhcmVudE5vZGUudE5vZGUudHlwZTtcbiAgICAgICAgaWYgKHBhcmVudFR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHwgcGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgICBjdXJyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHNpYmxpbmcgbm9kZSBmb3IgdGhlIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIC8vIFZpZXcgbm9kZXMgZG9uJ3QgaGF2ZSBUTm9kZXMsIHNvIHRoZWlyIG5leHQgbXVzdCBiZSByZXRyaWV2ZWQgdGhyb3VnaCB0aGVpciBMVmlldy5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCBsVmlldyA9IG5vZGUuZGF0YSBhcyBMVmlldztcbiAgICByZXR1cm4gbFZpZXcubmV4dCA/IChsVmlldy5uZXh0IGFzIExWaWV3KS5ub2RlIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbm9kZS50Tm9kZS5uZXh0ID8gbm9kZS52aWV3LmRhdGFbbm9kZS50Tm9kZS5uZXh0ICEuaW5kZXhdIDogbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgZmlyc3QgY2hpbGQgb2YgYSBnaXZlbiBub2RlICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hpbGRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5jaGlsZCkge1xuICAgIGNvbnN0IHZpZXcgPSBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID8gbm9kZS5kYXRhIGFzIExWaWV3IDogbm9kZS52aWV3O1xuICAgIHJldHVybiB2aWV3LmRhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHBhcmVudCBMTm9kZSBvZiBhIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTFByb2plY3Rpb25Ob2RlKTogTEVsZW1lbnROb2RlfFxuICAgIExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMVmlld05vZGUpOiBMQ29udGFpbmVyTm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuaW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFyZW50ID0gbm9kZS50Tm9kZS5wYXJlbnQ7XG4gIHJldHVybiBwYXJlbnQgPyBub2RlLnZpZXcuZGF0YVtwYXJlbnQuaW5kZXhdIDogbm9kZS52aWV3Lm5vZGU7XG59XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIG5leHQgc2libGluZyBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgY29uc3QgcE5leHRPclBhcmVudCA9IG5vZGUucE5leHRPclBhcmVudDtcblxuICBpZiAocE5leHRPclBhcmVudCkge1xuICAgIC8vIFRoZSBub2RlIGlzIHByb2plY3RlZFxuICAgIGNvbnN0IGlzTGFzdFByb2plY3RlZE5vZGUgPSBwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uO1xuICAgIC8vIHJldHVybnMgcE5leHRPclBhcmVudCBpZiB3ZSBhcmUgbm90IGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QsIG51bGwgb3RoZXJ3aXNlXG4gICAgcmV0dXJuIGlzTGFzdFByb2plY3RlZE5vZGUgPyBudWxsIDogcE5leHRPclBhcmVudDtcbiAgfVxuXG4gIC8vIHJldHVybnMgbm9kZS5uZXh0IGJlY2F1c2UgdGhlIHRoZSBub2RlIGlzIG5vdCBwcm9qZWN0ZWRcbiAgcmV0dXJuIGdldE5leHRMTm9kZShub2RlKTtcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICpcbiAqIEBwYXJhbSBpbml0aWFsTm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHJvb3ROb2RlIFRoZSByb290IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBzaG91bGQgc3RvcC5cbiAqIEByZXR1cm4gTE5vZGV8bnVsbCBUaGUgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKGluaXRpYWxOb2RlOiBMTm9kZSwgcm9vdE5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gaW5pdGlhbE5vZGU7XG4gIGxldCBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGUpO1xuICB3aGlsZSAobm9kZSAmJiAhbmV4dE5vZGUpIHtcbiAgICAvLyBpZiBub2RlLnBOZXh0T3JQYXJlbnQgaXMgbm90IG51bGwgaGVyZSwgaXQgaXMgbm90IHRoZSBuZXh0IG5vZGVcbiAgICAvLyAoYmVjYXVzZSwgYXQgdGhpcyBwb2ludCwgbmV4dE5vZGUgaXMgbnVsbCwgc28gaXQgaXMgdGhlIHBhcmVudClcbiAgICBub2RlID0gbm9kZS5wTmV4dE9yUGFyZW50IHx8IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICAgIGlmIChub2RlID09PSByb290Tm9kZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG5leHROb2RlID0gbm9kZSAmJiBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgfVxuICByZXR1cm4gbmV4dE5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgaW5zaWRlIHRoZSBnaXZlbiBMTm9kZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmaXJzdCBET00gbm9kZSBtdXN0IGJlIGZvdW5kXG4gKiBAcmV0dXJucyBSTm9kZSBUaGUgZmlyc3QgUk5vZGUgb2YgdGhlIGdpdmVuIExOb2RlIG9yIG51bGwgaWYgdGhlcmUgaXMgbm9uZS5cbiAqL1xuZnVuY3Rpb24gZmluZEZpcnN0Uk5vZGUocm9vdE5vZGU6IExOb2RlKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gcm9vdE5vZGU7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgLy8gQSBMRWxlbWVudE5vZGUgaGFzIGEgbWF0Y2hpbmcgUk5vZGUgaW4gTEVsZW1lbnROb2RlLm5hdGl2ZVxuICAgICAgcmV0dXJuIChub2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlO1xuICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSk7XG4gICAgICBjb25zdCBjaGlsZENvbnRhaW5lckRhdGE6IExDb250YWluZXIgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhIDpcbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgICAgbmV4dE5vZGUgPVxuICAgICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YS52aWV3cy5sZW5ndGggPyBnZXRDaGlsZExOb2RlKGNoaWxkQ29udGFpbmVyRGF0YS52aWV3c1swXSkgOiBudWxsO1xuICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gRm9yIFByb2plY3Rpb24gbG9vayBhdCB0aGUgZmlyc3QgcHJvamVjdGVkIG5vZGVcbiAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhLmhlYWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBsb29rIGF0IHRoZSBmaXJzdCBjaGlsZFxuICAgICAgbmV4dE5vZGUgPSBnZXRDaGlsZExOb2RlKG5vZGUgYXMgTFZpZXdOb2RlKTtcbiAgICB9XG5cbiAgICBub2RlID0gbmV4dE5vZGUgPT09IG51bGwgPyBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShub2RlLCByb290Tm9kZSkgOiBuZXh0Tm9kZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0aGUgcm9vdCB2aWV3IGJlbG9uZ3NcbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiB0cnVlLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGJvb2xlYW4sXG4gICAgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHJvb3ROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBjb250YWluZXIuZGF0YS5yZW5kZXJQYXJlbnQ7XG4gIGNvbnN0IHBhcmVudCA9IHBhcmVudE5vZGUgPyBwYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShyb290Tm9kZSk7XG4gIGlmIChwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gY29udGFpbmVyLnZpZXcucmVuZGVyZXI7XG4gICAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgICBpZiAoaW5zZXJ0TW9kZSkge1xuICAgICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCBhcyBSRWxlbWVudCwgbm9kZS5uYXRpdmUgISk7XG4gICAgICAgICAgICBpZiAocmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICAgICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgICAgICAgICAgIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKG5vZGUubmF0aXZlICEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZS5uYXRpdmUgISk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5leHROb2RlID0gZ2V0TmV4dExOb2RlKG5vZGUpO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgLy8gaWYgd2UgZ2V0IHRvIGEgY29udGFpbmVyLCBpdCBtdXN0IGJlIGEgcm9vdCBub2RlIG9mIGEgdmlldyBiZWNhdXNlIHdlIGFyZSBvbmx5XG4gICAgICAgIC8vIHByb3BhZ2F0aW5nIGRvd24gaW50byBjaGlsZCB2aWV3cyAvIGNvbnRhaW5lcnMgYW5kIG5vdCBjaGlsZCBlbGVtZW50c1xuICAgICAgICBjb25zdCBjaGlsZENvbnRhaW5lckRhdGE6IExDb250YWluZXIgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbiAgICAgICAgY2hpbGRDb250YWluZXJEYXRhLnJlbmRlclBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIG5leHROb2RlID1cbiAgICAgICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YS52aWV3cy5sZW5ndGggPyBnZXRDaGlsZExOb2RlKGNoaWxkQ29udGFpbmVyRGF0YS52aWV3c1swXSkgOiBudWxsO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhLmhlYWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0Tm9kZSA9IGdldENoaWxkTE5vZGUobm9kZSBhcyBMVmlld05vZGUpO1xuICAgICAgfVxuICAgICAgaWYgKG5leHROb2RlID09PSBudWxsKSB7XG4gICAgICAgIG5vZGUgPSBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShub2RlLCByb290Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gbmV4dE5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlldy50Vmlldy5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdPckxDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdPckxDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLnZpZXdzICYmIHZpZXdPckNvbnRhaW5lci52aWV3cy5sZW5ndGgpIHtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIudmlld3NbMF0uZGF0YTtcbiAgICB9IGVsc2UgaWYgKHZpZXdPckNvbnRhaW5lci50VmlldyAmJiB2aWV3T3JDb250YWluZXIudFZpZXcuY2hpbGRJbmRleCA+IC0xKSB7XG4gICAgICBuZXh0ID0gZ2V0TFZpZXdDaGlsZCh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgIH0gZWxzZSBpZiAodmlld09yQ29udGFpbmVyLm5leHQpIHtcbiAgICAgIC8vIE9ubHkgbW92ZSB0byB0aGUgc2lkZSBhbmQgY2xlYW4gaWYgb3BlcmF0aW5nIGJlbG93IHJvb3RWaWV3IC1cbiAgICAgIC8vIG90aGVyd2lzZSB3ZSB3b3VsZCBzdGFydCBjbGVhbmluZyB1cCBzaWJsaW5nIHZpZXdzIG9mIHRoZSByb290Vmlldy5cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyk7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyLm5leHQ7XG4gICAgfVxuXG4gICAgaWYgKG5leHQgPT0gbnVsbCkge1xuICAgICAgLy8gSWYgdGhlIHZpZXdPckNvbnRhaW5lciBpcyB0aGUgcm9vdFZpZXcgYW5kIG5leHQgaXMgbnVsbCBpdCBtZWFucyB0aGF0IHdlIGFyZSBkZWFsaW5nXG4gICAgICAvLyB3aXRoIGEgcm9vdCB2aWV3IHRoYXQgZG9lc24ndCBoYXZlIGNoaWxkcmVuLiBXZSBkaWRuJ3QgZGVzY2VuZCBpbnRvIGNoaWxkIHZpZXdzXG4gICAgICAvLyBzbyBubyBuZWVkIHRvIGdvIGJhY2sgdXAgdGhlIHZpZXdzIHRyZWUuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIS5uZXh0ICYmIHZpZXdPckNvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgICAgdmlld09yQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUodmlld09yQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcgfHwgcm9vdFZpZXcpO1xuXG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lci5uZXh0O1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIHZpZXdOb2RlIFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEByZXR1cm5zIFRoZSBpbnNlcnRlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHZpZXdOb2RlOiBMVmlld05vZGUsIGluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRhaW5lci5kYXRhO1xuICBjb25zdCB2aWV3cyA9IHN0YXRlLnZpZXdzO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdLmRhdGEubmV4dCA9IHZpZXdOb2RlLmRhdGEgYXMgTFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICB2aWV3Tm9kZS5kYXRhLm5leHQgPSB2aWV3c1tpbmRleF0uZGF0YTtcbiAgICB2aWV3cy5zcGxpY2UoaW5kZXgsIDAsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKHZpZXdOb2RlKTtcbiAgICB2aWV3Tm9kZS5kYXRhLm5leHQgPSBudWxsO1xuICB9XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBjb25zdCBsVmlldyA9IHZpZXdOb2RlLmRhdGE7XG4gIGlmIChsVmlldy5xdWVyaWVzKSB7XG4gICAgbFZpZXcucXVlcmllcy5pbnNlcnRWaWV3KGluZGV4KTtcbiAgfVxuXG4gIC8vIElmIHRoZSBjb250YWluZXIncyByZW5kZXJQYXJlbnQgaXMgbnVsbCwgd2Uga25vdyB0aGF0IGl0IGlzIGEgcm9vdCBub2RlIG9mIGl0cyBvd24gcGFyZW50IHZpZXdcbiAgLy8gYW5kIHdlIHNob3VsZCB3YWl0IHVudGlsIHRoYXQgcGFyZW50IHByb2Nlc3NlcyBpdHMgbm9kZXMgKG90aGVyd2lzZSwgd2Ugd2lsbCBpbnNlcnQgdGhpcyB2aWV3J3NcbiAgLy8gbm9kZXMgdHdpY2UgLSBvbmNlIG5vdyBhbmQgb25jZSB3aGVuIGl0cyBwYXJlbnQgaW5zZXJ0cyBpdHMgdmlld3MpLlxuICBpZiAoY29udGFpbmVyLmRhdGEucmVuZGVyUGFyZW50ICE9PSBudWxsKSB7XG4gICAgbGV0IGJlZm9yZU5vZGUgPSBmaW5kTmV4dFJOb2RlU2libGluZyh2aWV3Tm9kZSwgY29udGFpbmVyKTtcblxuICAgIGlmICghYmVmb3JlTm9kZSkge1xuICAgICAgbGV0IGNvbnRhaW5lck5leHROYXRpdmVOb2RlID0gY29udGFpbmVyLm5hdGl2ZTtcbiAgICAgIGlmIChjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRhaW5lck5leHROYXRpdmVOb2RlID0gY29udGFpbmVyLm5hdGl2ZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKGNvbnRhaW5lciwgbnVsbCk7XG4gICAgICB9XG4gICAgICBiZWZvcmVOb2RlID0gY29udGFpbmVyTmV4dE5hdGl2ZU5vZGU7XG4gICAgfVxuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGNvbnRhaW5lciwgdmlld05vZGUsIHRydWUsIGJlZm9yZU5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2Qgc3BsaWNlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00gYW5kIGNvbmR1Y3RzIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmdcbiAqIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICogQHJldHVybnMgVGhlIHJlbW92ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YS52aWV3cztcbiAgY29uc3Qgdmlld05vZGUgPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICB2aWV3c1tyZW1vdmVJbmRleCAtIDFdLmRhdGEubmV4dCA9IHZpZXdOb2RlLmRhdGEubmV4dCBhcyBMVmlldztcbiAgfVxuICB2aWV3cy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICBkZXN0cm95Vmlld1RyZWUodmlld05vZGUuZGF0YSk7XG4gIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGNvbnRhaW5lciwgdmlld05vZGUsIGZhbHNlKTtcblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgY29uc3QgcmVtb3ZlZEx2aWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKHJlbW92ZWRMdmlldy5xdWVyaWVzKSB7XG4gICAgcmVtb3ZlZEx2aWV3LnF1ZXJpZXMucmVtb3ZlVmlldyhyZW1vdmVJbmRleCk7XG4gIH1cblxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXcgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld0NoaWxkKHZpZXc6IExWaWV3KTogTFZpZXd8TENvbnRhaW5lcnxudWxsIHtcbiAgaWYgKHZpZXcudFZpZXcuY2hpbGRJbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGhvc3ROb2RlOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGUgPSB2aWV3LmRhdGFbdmlldy50Vmlldy5jaGlsZEluZGV4XTtcblxuICByZXR1cm4gaG9zdE5vZGUuZGF0YSA/IGhvc3ROb2RlLmRhdGEgOiAoaG9zdE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXdPckxDb250YWluZXIsIHJvb3RWaWV3OiBMVmlldyk6IExWaWV3T3JMQ29udGFpbmVyfG51bGwge1xuICBsZXQgbm9kZTtcbiAgaWYgKChub2RlID0gKHN0YXRlIGFzIExWaWV3KSAhLm5vZGUpICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldFBhcmVudExOb2RlKG5vZGUpICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlLnBhcmVudCA9PT0gcm9vdFZpZXcgPyBudWxsIDogc3RhdGUucGFyZW50O1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlldzogTFZpZXcpOiB2b2lkIHtcbiAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgaWYgKHZpZXcuaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXcucmVuZGVyZXIpKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICB2aWV3LnJlbmRlcmVyLmRlc3Ryb3koKTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY2xlYW51cCA9IHZpZXcuY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICBjbGVhbnVwICFbaSArIDFdLnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xlYW51cFtpXSwgY2xlYW51cFtpICsgMl0sIGNsZWFudXBbaSArIDNdKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNsZWFudXBbaSArIDFdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlldy5jbGVhbnVwID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlldy50VmlldztcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3LmRpcmVjdGl2ZXMgISwgZGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKiogQ2FsbHMgcGlwZSBkZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlldy50VmlldyAmJiB2aWV3LnRWaWV3LnBpcGVEZXN0cm95SG9va3M7XG4gIGlmIChwaXBlRGVzdHJveUhvb2tzKSB7XG4gICAgY2FsbEhvb2tzKHZpZXcuZGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IHNob3VsZCBiZSBpbnNlcnRlZCBpbiB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZSBuYXRpdmUgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgd2hlbiBpdHMgcGFyZW50IGlzOlxuICogLSBBIHJlZ3VsYXIgZWxlbWVudCA9PiBZZXNcbiAqIC0gQSBjb21wb25lbnQgaG9zdCBlbGVtZW50ID0+XG4gKiAgICAtIGlmIHRoZSBgY3VycmVudFZpZXdgID09PSB0aGUgcGFyZW50IGB2aWV3YDogVGhlIGVsZW1lbnQgaXMgaW4gdGhlIGNvbnRlbnQgKHZzIHRoZVxuICogICAgICB0ZW1wbGF0ZSlcbiAqICAgICAgPT4gZG9uJ3QgYWRkIGFzIHRoZSBwYXJlbnQgY29tcG9uZW50IHdpbGwgcHJvamVjdCBpZiBuZWVkZWQuXG4gKiAgICAtIGBjdXJyZW50Vmlld2AgIT09IHRoZSBwYXJlbnQgYHZpZXdgID0+IFRoZSBlbGVtZW50IGlzIGluIHRoZSB0ZW1wbGF0ZSAodnMgdGhlIGNvbnRlbnQpLFxuICogICAgICBhZGQgaXRcbiAqIC0gVmlldyBlbGVtZW50ID0+IGRlbGF5IGluc2VydGlvbiwgd2lsbCBiZSBkb25lIG9uIGB2aWV3RW5kKClgXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IGluIHdoaWNoIHRvIGluc2VydCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudDogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICBjb25zdCBwYXJlbnRJc0VsZW1lbnQgPSBwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQ7XG5cbiAgcmV0dXJuIHBhcmVudElzRWxlbWVudCAmJlxuICAgICAgKHBhcmVudC52aWV3ICE9PSBjdXJyZW50VmlldyB8fCBwYXJlbnQuZGF0YSA9PT0gbnVsbCAvKiBSZWd1bGFyIEVsZW1lbnQuICovKTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfVxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCB0byB3aGljaCB0byBhcHBlbmQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKHBhcmVudDogTE5vZGUsIGNoaWxkOiBSTm9kZSB8IG51bGwsIGN1cnJlbnRWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgYWRkIGVsZW1lbnQgaWYgbm90IGluIFZpZXcgb3Igbm90IHByb2plY3RlZC5cbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3LnJlbmRlcmVyO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudC5uYXRpdmUgIWFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGN1cnJlbnRQYXJlbnQgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudDogTEVsZW1lbnROb2RlLFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAobm9kZS50Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgYXBwZW5kQ2hpbGQoY3VycmVudFBhcmVudCwgKG5vZGUgYXMgTEVsZW1lbnROb2RlIHwgTFRleHROb2RlKS5uYXRpdmUsIGN1cnJlbnRWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgQ29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIEVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbmVlIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbiAgICBsQ29udGFpbmVyLnJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyLnZpZXdzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKG5vZGUgYXMgTENvbnRhaW5lck5vZGUsIHZpZXdzW2ldLCB0cnVlLCBudWxsKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YS5yZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICB9XG59XG4iXX0=