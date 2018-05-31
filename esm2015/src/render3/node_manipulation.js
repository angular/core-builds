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
    return node.tNode.next ? node.view.data[/** @type {?} */ (((node.tNode.next)).index)] : null;
}
/**
 * Retrieves the first child of a given node
 * @param {?} node
 * @return {?}
 */
export function getChildLNode(node) {
    if (node.tNode.child) {
        const /** @type {?} */ view = node.tNode.type === 2 /* View */ ? /** @type {?} */ (node.data) : node.view;
        return view.data[/** @type {?} */ (node.tNode.child.index)];
    }
    return null;
}
/**
 * @param {?} node
 * @return {?}
 */
export function getParentLNode(node) {
    if (node.tNode.index === null)
        return null;
    const /** @type {?} */ parent = node.tNode.parent;
    return parent ? node.view.data[/** @type {?} */ (parent.index)] : node.view.node;
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
 *  \@param rootView The view to destroy
 * @param {?} rootView
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
 * Inserts the provided node before the correct element in the DOM.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}
 *
 * @param {?} node Node to insert
 * @param {?} currentView Current LView
 * @return {?}
 */
export function insertChild(node, currentView) {
    const /** @type {?} */ parent = /** @type {?} */ ((getParentLNode(node)));
    if (canInsertNativeNode(parent, currentView)) {
        let /** @type {?} */ nativeSibling = findNextRNodeSibling(node, null);
        const /** @type {?} */ renderer = currentView.renderer;
        isProceduralRenderer(renderer) ?
            renderer.insertBefore(/** @type {?} */ ((parent.native)), /** @type {?} */ ((node.native)), nativeSibling) : /** @type {?} */ ((parent.native)).insertBefore(/** @type {?} */ ((node.native)), nativeSibling, false);
    }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDNUYsT0FBTyxFQUFvRyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM5SyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUF5RCxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3SixPQUFPLEVBQTRDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3RILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVqQyx1QkFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBY2hGLDhCQUE4QixJQUFrQixFQUFFLFFBQXNCO0lBQ3RFLHFCQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRTtRQUM5QyxxQkFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUM5QyxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIsRUFBRTtnQkFDeEQsdUJBQU0s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QUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUMvQixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLG1CQUFDLElBQXNCLEdBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxRTtLQUNGO0lBQ0QsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDOUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO0tBQzlEO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtjYWxsSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0hvb2tEYXRhLCBMVmlldywgTFZpZXdPckxDb250YWluZXIsIFRWaWV3LCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGZvbGxvd2luZyB0aGUgZ2l2ZW4gTE5vZGUgaW4gdGhlIHNhbWUgcGFyZW50IERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGluc2VydCB0aGUgZ2l2ZW4gbm9kZSB3aXRoIGluc2VydEJlZm9yZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSBzdG9wTm9kZSBBIHBhcmVudCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgaW4gdGhlIHRyZWUgc2hvdWxkIGJlIHN0b3BwZWQsIG9yIG51bGwgaWYgdGhlXG4gKiBsb29rdXAgc2hvdWxkIG5vdCBiZSBzdG9wcGVkIHVudGlsIHRoZSByZXN1bHQgaXMgZm91bmQuXG4gKiBAcmV0dXJucyBSTm9kZSBiZWZvcmUgd2hpY2ggdGhlIHByb3ZpZGVkIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkIG9yIG51bGwgaWYgdGhlIGxvb2t1cCB3YXNcbiAqIHN0b3BwZWRcbiAqIG9yIGlmIHRoZXJlIGlzIG5vIG5hdGl2ZSBub2RlIGFmdGVyIHRoZSBnaXZlbiBsb2dpY2FsIG5vZGUgaW4gdGhlIHNhbWUgbmF0aXZlIHBhcmVudC5cbiAqL1xuZnVuY3Rpb24gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZTogTE5vZGUgfCBudWxsLCBzdG9wTm9kZTogTE5vZGUgfCBudWxsKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZSAhPT0gc3RvcE5vZGUpIHtcbiAgICBsZXQgcE5leHRPclBhcmVudCA9IGN1cnJlbnROb2RlLnBOZXh0T3JQYXJlbnQ7XG4gICAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAgIHdoaWxlIChwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZU5vZGUgPSBmaW5kRmlyc3RSTm9kZShwTmV4dE9yUGFyZW50KTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBwTmV4dE9yUGFyZW50ID0gcE5leHRPclBhcmVudC5wTmV4dE9yUGFyZW50ICE7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IHBOZXh0T3JQYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICB3aGlsZSAoY3VycmVudFNpYmxpbmcpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50U2libGluZyk7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUoY3VycmVudE5vZGUpO1xuICAgICAgY3VycmVudE5vZGUgPSBudWxsO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHBhcmVudE5vZGUudE5vZGUudHlwZTtcbiAgICAgICAgaWYgKHBhcmVudFR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHwgcGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgICBjdXJyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHNpYmxpbmcgbm9kZSBmb3IgdGhlIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIC8vIFZpZXcgbm9kZXMgZG9uJ3QgaGF2ZSBUTm9kZXMsIHNvIHRoZWlyIG5leHQgbXVzdCBiZSByZXRyaWV2ZWQgdGhyb3VnaCB0aGVpciBMVmlldy5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCBsVmlldyA9IG5vZGUuZGF0YSBhcyBMVmlldztcbiAgICByZXR1cm4gbFZpZXcubmV4dCA/IChsVmlldy5uZXh0IGFzIExWaWV3KS5ub2RlIDogbnVsbDtcbiAgfVxuICByZXR1cm4gbm9kZS50Tm9kZS5uZXh0ID8gbm9kZS52aWV3LmRhdGFbbm9kZS50Tm9kZS5uZXh0ICEuaW5kZXggYXMgbnVtYmVyXSA6IG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIGZpcnN0IGNoaWxkIG9mIGEgZ2l2ZW4gbm9kZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkTE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuY2hpbGQpIHtcbiAgICBjb25zdCB2aWV3ID0gbm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/IG5vZGUuZGF0YSBhcyBMVmlldyA6IG5vZGUudmlldztcbiAgICByZXR1cm4gdmlldy5kYXRhW25vZGUudE5vZGUuY2hpbGQuaW5kZXggYXMgbnVtYmVyXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMUHJvamVjdGlvbk5vZGUpOiBMRWxlbWVudE5vZGV8XG4gICAgTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExWaWV3Tm9kZSk6IExDb250YWluZXJOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGV8TFZpZXdOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGV8TFZpZXdOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5pbmRleCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHBhcmVudCA9IG5vZGUudE5vZGUucGFyZW50O1xuICByZXR1cm4gcGFyZW50ID8gbm9kZS52aWV3LmRhdGFbcGFyZW50LmluZGV4IGFzIG51bWJlcl0gOiBub2RlLnZpZXcubm9kZTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEByZXR1cm4gTE5vZGV8bnVsbCBUaGUgbmV4dCBzaWJsaW5nIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBjb25zdCBwTmV4dE9yUGFyZW50ID0gbm9kZS5wTmV4dE9yUGFyZW50O1xuXG4gIGlmIChwTmV4dE9yUGFyZW50KSB7XG4gICAgLy8gVGhlIG5vZGUgaXMgcHJvamVjdGVkXG4gICAgY29uc3QgaXNMYXN0UHJvamVjdGVkTm9kZSA9IHBOZXh0T3JQYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb247XG4gICAgLy8gcmV0dXJucyBwTmV4dE9yUGFyZW50IGlmIHdlIGFyZSBub3QgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCwgbnVsbCBvdGhlcndpc2VcbiAgICByZXR1cm4gaXNMYXN0UHJvamVjdGVkTm9kZSA/IG51bGwgOiBwTmV4dE9yUGFyZW50O1xuICB9XG5cbiAgLy8gcmV0dXJucyBub2RlLm5leHQgYmVjYXVzZSB0aGUgdGhlIG5vZGUgaXMgbm90IHByb2plY3RlZFxuICByZXR1cm4gZ2V0TmV4dExOb2RlKG5vZGUpO1xufVxuXG4vKipcbiAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAqXG4gKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoaXMgZnVuY3Rpb24gZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gKlxuICogQHBhcmFtIGluaXRpYWxOb2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHJvb3Qgbm9kZSBhdCB3aGljaCB0aGUgbG9va3VwIHNob3VsZCBzdG9wLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBmb2xsb3dpbmcgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUoaW5pdGlhbE5vZGU6IExOb2RlLCByb290Tm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBpbml0aWFsTm9kZTtcbiAgbGV0IG5leHROb2RlID0gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIHdoaWxlIChub2RlICYmICFuZXh0Tm9kZSkge1xuICAgIC8vIGlmIG5vZGUucE5leHRPclBhcmVudCBpcyBub3QgbnVsbCBoZXJlLCBpdCBpcyBub3QgdGhlIG5leHQgbm9kZVxuICAgIC8vIChiZWNhdXNlLCBhdCB0aGlzIHBvaW50LCBuZXh0Tm9kZSBpcyBudWxsLCBzbyBpdCBpcyB0aGUgcGFyZW50KVxuICAgIG5vZGUgPSBub2RlLnBOZXh0T3JQYXJlbnQgfHwgZ2V0UGFyZW50TE5vZGUobm9kZSk7XG4gICAgaWYgKG5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbmV4dE5vZGUgPSBub2RlICYmIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGUpO1xuICB9XG4gIHJldHVybiBuZXh0Tm9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBSTm9kZSBpbnNpZGUgdGhlIGdpdmVuIExOb2RlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZpcnN0IERPTSBub2RlIG11c3QgYmUgZm91bmRcbiAqIEByZXR1cm5zIFJOb2RlIFRoZSBmaXJzdCBSTm9kZSBvZiB0aGUgZ2l2ZW4gTE5vZGUgb3IgbnVsbCBpZiB0aGVyZSBpcyBub25lLlxuICovXG5mdW5jdGlvbiBmaW5kRmlyc3RSTm9kZShyb290Tm9kZTogTE5vZGUpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSByb290Tm9kZTtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAvLyBBIExFbGVtZW50Tm9kZSBoYXMgYSBtYXRjaGluZyBSTm9kZSBpbiBMRWxlbWVudE5vZGUubmF0aXZlXG4gICAgICByZXR1cm4gKG5vZGUgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmU7XG4gICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IChub2RlIGFzIExDb250YWluZXJOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhLnZpZXdzLmxlbmd0aCA/IGdldENoaWxkTE5vZGUoY2hpbGRDb250YWluZXJEYXRhLnZpZXdzWzBdKSA6IG51bGw7XG4gICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBGb3IgUHJvamVjdGlvbiBsb29rIGF0IHRoZSBmaXJzdCBwcm9qZWN0ZWQgbm9kZVxuICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgYXQgdGhlIGZpcnN0IGNoaWxkXG4gICAgICBuZXh0Tm9kZSA9IGdldENoaWxkTE5vZGUobm9kZSBhcyBMVmlld05vZGUpO1xuICAgIH1cblxuICAgIG5vZGUgPSBuZXh0Tm9kZSA9PT0gbnVsbCA/IGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKG5vZGUsIHJvb3ROb2RlKSA6IG5leHROb2RlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHJvb3ROb2RlIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IHRydWUsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogYm9vbGVhbixcbiAgICBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocm9vdE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhLnJlbmRlclBhcmVudDtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBnZXRDaGlsZExOb2RlKHJvb3ROb2RlKTtcbiAgaWYgKHBhcmVudCkge1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlldy5yZW5kZXJlcjtcbiAgICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgIGlmIChpbnNlcnRNb2RlKSB7XG4gICAgICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgbm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50IGFzIFJFbGVtZW50LCBub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAgICAgICAgICAgcmVuZGVyZXIuZGVzdHJveU5vZGUobm9kZS5uYXRpdmUgISk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAvLyBpZiB3ZSBnZXQgdG8gYSBjb250YWluZXIsIGl0IG11c3QgYmUgYSByb290IG5vZGUgb2YgYSB2aWV3IGJlY2F1c2Ugd2UgYXJlIG9ubHlcbiAgICAgICAgLy8gcHJvcGFnYXRpbmcgZG93biBpbnRvIGNoaWxkIHZpZXdzIC8gY29udGFpbmVycyBhbmQgbm90IGNoaWxkIGVsZW1lbnRzXG4gICAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEucmVuZGVyUGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgbmV4dE5vZGUgPVxuICAgICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhLnZpZXdzLmxlbmd0aCA/IGdldENoaWxkTE5vZGUoY2hpbGRDb250YWluZXJEYXRhLnZpZXdzWzBdKSA6IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobmV4dE5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgbm9kZSA9IGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKG5vZGUsIHJvb3ROb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUgPSBuZXh0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3LnRWaWV3LmNoaWxkSW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuICBsZXQgdmlld09yQ29udGFpbmVyOiBMVmlld09yTENvbnRhaW5lcnxudWxsID0gZ2V0TFZpZXdDaGlsZChyb290Vmlldyk7XG5cbiAgd2hpbGUgKHZpZXdPckNvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld09yTENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmICh2aWV3T3JDb250YWluZXIudmlld3MgJiYgdmlld09yQ29udGFpbmVyLnZpZXdzLmxlbmd0aCkge1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lci52aWV3c1swXS5kYXRhO1xuICAgIH0gZWxzZSBpZiAodmlld09yQ29udGFpbmVyLnRWaWV3ICYmIHZpZXdPckNvbnRhaW5lci50Vmlldy5jaGlsZEluZGV4ID4gLTEpIHtcbiAgICAgIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyk7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIubmV4dCkge1xuICAgICAgLy8gT25seSBtb3ZlIHRvIHRoZSBzaWRlIGFuZCBjbGVhbiBpZiBvcGVyYXRpbmcgYmVsb3cgcm9vdFZpZXcgLVxuICAgICAgLy8gb3RoZXJ3aXNlIHdlIHdvdWxkIHN0YXJ0IGNsZWFuaW5nIHVwIHNpYmxpbmcgdmlld3Mgb2YgdGhlIHJvb3RWaWV3LlxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBJZiB0aGUgdmlld09yQ29udGFpbmVyIGlzIHRoZSByb290VmlldyBhbmQgbmV4dCBpcyBudWxsIGl0IG1lYW5zIHRoYXQgd2UgYXJlIGRlYWxpbmdcbiAgICAgIC8vIHdpdGggYSByb290IHZpZXcgdGhhdCBkb2Vzbid0IGhhdmUgY2hpbGRyZW4uIFdlIGRpZG4ndCBkZXNjZW5kIGludG8gY2hpbGQgdmlld3NcbiAgICAgIC8vIHNvIG5vIG5lZWQgdG8gZ28gYmFjayB1cCB0aGUgdmlld3MgdHJlZS5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhLm5leHQgJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyB8fCByb290Vmlldyk7XG5cbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyLm5leHQ7XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGUudmlld3M7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIHZpZXdzW2luZGV4IC0gMV0uZGF0YS5uZXh0ID0gdmlld05vZGUuZGF0YSBhcyBMVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIHZpZXdOb2RlLmRhdGEubmV4dCA9IHZpZXdzW2luZGV4XS5kYXRhO1xuICAgIHZpZXdzLnNwbGljZShpbmRleCwgMCwgdmlld05vZGUpO1xuICB9IGVsc2Uge1xuICAgIHZpZXdzLnB1c2godmlld05vZGUpO1xuICAgIHZpZXdOb2RlLmRhdGEubmV4dCA9IG51bGw7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxWaWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKGxWaWV3LnF1ZXJpZXMpIHtcbiAgICBsVmlldy5xdWVyaWVzLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gSWYgdGhlIGNvbnRhaW5lcidzIHJlbmRlclBhcmVudCBpcyBudWxsLCB3ZSBrbm93IHRoYXQgaXQgaXMgYSByb290IG5vZGUgb2YgaXRzIG93biBwYXJlbnQgdmlld1xuICAvLyBhbmQgd2Ugc2hvdWxkIHdhaXQgdW50aWwgdGhhdCBwYXJlbnQgcHJvY2Vzc2VzIGl0cyBub2RlcyAob3RoZXJ3aXNlLCB3ZSB3aWxsIGluc2VydCB0aGlzIHZpZXcnc1xuICAvLyBub2RlcyB0d2ljZSAtIG9uY2Ugbm93IGFuZCBvbmNlIHdoZW4gaXRzIHBhcmVudCBpbnNlcnRzIGl0cyB2aWV3cykuXG4gIGlmIChjb250YWluZXIuZGF0YS5yZW5kZXJQYXJlbnQgIT09IG51bGwpIHtcbiAgICBsZXQgYmVmb3JlTm9kZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKHZpZXdOb2RlLCBjb250YWluZXIpO1xuXG4gICAgaWYgKCFiZWZvcmVOb2RlKSB7XG4gICAgICBsZXQgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlO1xuICAgICAgaWYgKGNvbnRhaW5lck5leHROYXRpdmVOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlID0gZmluZE5leHRSTm9kZVNpYmxpbmcoY29udGFpbmVyLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGJlZm9yZU5vZGUgPSBjb250YWluZXJOZXh0TmF0aXZlTm9kZTtcbiAgICB9XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG4gIH1cblxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTSBhbmQgY29uZHVjdHMgY2xlYW51cCAoZS5nLiByZW1vdmluZ1xuICogbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhLnZpZXdzO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV0uZGF0YS5uZXh0ID0gdmlld05vZGUuZGF0YS5uZXh0IGFzIExWaWV3O1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3Tm9kZS5kYXRhKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb25zdCByZW1vdmVkTHZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAocmVtb3ZlZEx2aWV3LnF1ZXJpZXMpIHtcbiAgICByZW1vdmVkTHZpZXcucXVlcmllcy5yZW1vdmVWaWV3KHJlbW92ZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIGNoaWxkIG9mIHRoZSBnaXZlbiBMVmlldyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3Q2hpbGQodmlldzogTFZpZXcpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICBpZiAodmlldy50Vmlldy5jaGlsZEluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaG9zdE5vZGU6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZSA9IHZpZXcuZGF0YVt2aWV3LnRWaWV3LmNoaWxkSW5kZXhdO1xuXG4gIHJldHVybiBob3N0Tm9kZS5kYXRhID8gaG9zdE5vZGUuZGF0YSA6IChob3N0Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld09yTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3KTogTFZpZXdPckxDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXcpICEubm9kZSkgJiYgbm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gZ2V0UGFyZW50TE5vZGUobm9kZSkgIS5kYXRhIGFzIGFueTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gc3RhdGUucGFyZW50ID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZS5wYXJlbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG4gIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhcyBjbGVhbiB1cCB0aW1lLlxuICBpZiAodmlldy5pZCA9PT0gLTEgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlldy5yZW5kZXJlcikpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgIHZpZXcucmVuZGVyZXIuZGVzdHJveSgpO1xuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBjbGVhbnVwID0gdmlldy5jbGVhbnVwICE7XG4gIGlmIChjbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNsZWFudXAgIVtpICsgMV0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBjbGVhbnVwW2kgKyAyXSwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbGVhbnVwW2ldLmNhbGwoY2xlYW51cFtpICsgMV0pO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3LmNsZWFudXAgPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3LnRWaWV3O1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgY2FsbEhvb2tzKHZpZXcuZGlyZWN0aXZlcyAhLCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHBpcGVEZXN0cm95SG9va3MgPSB2aWV3LnRWaWV3ICYmIHZpZXcudFZpZXcucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlldy5kYXRhICEsIHBpcGVEZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkIGluIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlIG5hdGl2ZSBub2RlIGNhbiBiZSBpbnNlcnRlZCB3aGVuIGl0cyBwYXJlbnQgaXM6XG4gKiAtIEEgcmVndWxhciBlbGVtZW50ID0+IFllc1xuICogLSBBIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgPT5cbiAqICAgIC0gaWYgdGhlIGBjdXJyZW50Vmlld2AgPT09IHRoZSBwYXJlbnQgYHZpZXdgOiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgY29udGVudCAodnMgdGhlXG4gKiAgICAgIHRlbXBsYXRlKVxuICogICAgICA9PiBkb24ndCBhZGQgYXMgdGhlIHBhcmVudCBjb21wb25lbnQgd2lsbCBwcm9qZWN0IGlmIG5lZWRlZC5cbiAqICAgIC0gYGN1cnJlbnRWaWV3YCAhPT0gdGhlIHBhcmVudCBgdmlld2AgPT4gVGhlIGVsZW1lbnQgaXMgaW4gdGhlIHRlbXBsYXRlICh2cyB0aGUgY29udGVudCksXG4gKiAgICAgIGFkZCBpdFxuICogLSBWaWV3IGVsZW1lbnQgPT4gZGVsYXkgaW5zZXJ0aW9uLCB3aWxsIGJlIGRvbmUgb24gYHZpZXdFbmQoKWBcbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgaW4gd2hpY2ggdG8gaW5zZXJ0IHRoZSBjaGlsZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBMVmlldyBiZWluZyBwcm9jZXNzZWRcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIHRoZSBjaGlsZCBlbGVtZW50IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50OiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBhcmVudElzRWxlbWVudCA9IHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudDtcblxuICByZXR1cm4gcGFyZW50SXNFbGVtZW50ICYmXG4gICAgICAocGFyZW50LnZpZXcgIT09IGN1cnJlbnRWaWV3IHx8IHBhcmVudC5kYXRhID09PSBudWxsIC8qIFJlZ3VsYXIgRWxlbWVudC4gKi8pO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgZWxlbWVudCB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9XG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHRvIHdoaWNoIHRvIGFwcGVuZCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjaGlsZCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQocGFyZW50OiBMTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSBhZGQgZWxlbWVudCBpZiBub3QgaW4gVmlldyBvciBub3QgcHJvamVjdGVkLlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXcucmVuZGVyZXI7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50Lm5hdGl2ZSAhYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogSW5zZXJ0cyB0aGUgcHJvdmlkZWQgbm9kZSBiZWZvcmUgdGhlIGNvcnJlY3QgZWxlbWVudCBpbiB0aGUgRE9NLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfVxuICpcbiAqIEBwYXJhbSBub2RlIE5vZGUgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0Q2hpbGQobm9kZTogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKSAhO1xuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIGxldCBuYXRpdmVTaWJsaW5nOiBSTm9kZXxudWxsID0gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZSwgbnVsbCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlldy5yZW5kZXJlcjtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50Lm5hdGl2ZSAhLCBub2RlLm5hdGl2ZSAhLCBuYXRpdmVTaWJsaW5nKSA6XG4gICAgICAgIHBhcmVudC5uYXRpdmUgIS5pbnNlcnRCZWZvcmUobm9kZS5uYXRpdmUgISwgbmF0aXZlU2libGluZywgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHByb2plY3RlZCBub2RlIHRvIHRoZSBET00sIG9yIGluIHRoZSBjYXNlIG9mIGEgcHJvamVjdGVkIGNvbnRhaW5lcixcbiAqIGFwcGVuZHMgdGhlIG5vZGVzIGZyb20gYWxsIG9mIHRoZSBjb250YWluZXIncyBhY3RpdmUgdmlld3MgdG8gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB0byBwcm9jZXNzXG4gKiBAcGFyYW0gY3VycmVudFBhcmVudCBUaGUgbGFzdCBwYXJlbnQgZWxlbWVudCB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlLCBjdXJyZW50UGFyZW50OiBMRWxlbWVudE5vZGUsXG4gICAgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGlmIChub2RlLnROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCAobm9kZSBhcyBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUpLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBDb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gRWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduZWUgdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgIGxDb250YWluZXIucmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXIudmlld3M7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobm9kZSBhcyBMQ29udGFpbmVyTm9kZSwgdmlld3NbaV0sIHRydWUsIG51bGwpO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhLnJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gIH1cbn1cbiJdfQ==