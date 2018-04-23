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
            while (pNextOrParent.type !== 1 /* Projection */) {
                const /** @type {?} */ nativeNode = findFirstRNode(pNextOrParent);
                if (nativeNode) {
                    return nativeNode;
                }
                pNextOrParent = /** @type {?} */ ((pNextOrParent.pNextOrParent));
            }
            currentNode = pNextOrParent;
        }
        else {
            let /** @type {?} */ currentSibling = currentNode.next;
            while (currentSibling) {
                const /** @type {?} */ nativeNode = findFirstRNode(currentSibling);
                if (nativeNode) {
                    return nativeNode;
                }
                currentSibling = currentSibling.next;
            }
            const /** @type {?} */ parentNode = currentNode.parent;
            currentNode = null;
            if (parentNode) {
                const /** @type {?} */ parentType = parentNode.type;
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
 * @param {?} node The node whose next node in the LNode tree must be found.
 * @return {?} LNode|null The next sibling in the LNode tree.
 */
function getNextLNodeWithProjection(node) {
    const /** @type {?} */ pNextOrParent = node.pNextOrParent;
    if (pNextOrParent) {
        // The node is projected
        const /** @type {?} */ isLastProjectedNode = pNextOrParent.type === 1 /* Projection */;
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
 * @param {?} rootNode
 * @return {?} RNode The first RNode of the given LNode or null if there is none.
 */
function findFirstRNode(rootNode) {
    let /** @type {?} */ node = rootNode;
    while (node) {
        let /** @type {?} */ nextNode = null;
        if (node.type === 3 /* Element */) {
            // A LElementNode has a matching RNode in LElementNode.native
            return (/** @type {?} */ (node)).native;
        }
        else if (node.type === 0 /* Container */) {
            const /** @type {?} */ lContainerNode = (/** @type {?} */ (node));
            const /** @type {?} */ childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            nextNode = childContainerData.views.length ? childContainerData.views[0].child : null;
        }
        else if (node.type === 1 /* Projection */) {
            // For Projection look at the first projected node
            nextNode = (/** @type {?} */ (node)).data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = (/** @type {?} */ (node)).child;
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
    let /** @type {?} */ node = rootNode.child;
    if (parent) {
        while (node) {
            let /** @type {?} */ nextNode = null;
            const /** @type {?} */ renderer = container.view.renderer;
            if (node.type === 3 /* Element */) {
                if (insertMode) {
                    isProceduralRenderer(renderer) ?
                        renderer.insertBefore(parent, /** @type {?} */ ((node.native)), /** @type {?} */ (beforeNode)) :
                        parent.insertBefore(/** @type {?} */ ((node.native)), /** @type {?} */ (beforeNode), true);
                }
                else {
                    isProceduralRenderer(renderer) ? renderer.removeChild(/** @type {?} */ (parent), /** @type {?} */ ((node.native))) :
                        parent.removeChild(/** @type {?} */ ((node.native)));
                }
                nextNode = node.next;
            }
            else if (node.type === 0 /* Container */) {
                // if we get to a container, it must be a root node of a view because we are only
                // propagating down into child views / containers and not child elements
                const /** @type {?} */ childContainerData = (/** @type {?} */ (node)).data;
                childContainerData.renderParent = parentNode;
                nextNode = childContainerData.views.length ? childContainerData.views[0].child : null;
            }
            else if (node.type === 1 /* Projection */) {
                nextNode = (/** @type {?} */ (node)).data.head;
            }
            else {
                nextNode = (/** @type {?} */ (node)).child;
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
 * Traverses the tree of component views and containers to remove listeners and
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
    let /** @type {?} */ viewOrContainer = rootView;
    while (viewOrContainer) {
        let /** @type {?} */ next = null;
        if (viewOrContainer.views && viewOrContainer.views.length) {
            next = viewOrContainer.views[0].data;
        }
        else if (viewOrContainer.child) {
            next = viewOrContainer.child;
        }
        else if (viewOrContainer.next) {
            cleanUpView(/** @type {?} */ (viewOrContainer));
            next = viewOrContainer.next;
        }
        if (next == null) {
            // If the viewOrContainer is the rootView, then the cleanup is done twice.
            // Without this check, ngOnDestroy would be called twice for a directive on an element.
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
 * @param {?} newView The view to insert
 * @param {?} index The index at which to insert the view
 * @return {?} The inserted view
 */
export function insertView(container, newView, index) {
    const /** @type {?} */ state = container.data;
    const /** @type {?} */ views = state.views;
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
        let /** @type {?} */ beforeNode = findNextRNodeSibling(newView, container);
        if (!beforeNode) {
            let /** @type {?} */ containerNextNativeNode = container.native;
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
 * @param {?} container The container from which to remove a view
 * @param {?} removeIndex The index of the view to remove
 * @return {?} The removed view
 */
export function removeView(container, removeIndex) {
    const /** @type {?} */ views = container.data.views;
    const /** @type {?} */ viewNode = views[removeIndex];
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
 * @param {?} view The view to set up
 * @param {?} next The view's new next
 * @return {?}
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
 * @param {?} state The LViewOrLContainer for which we need a parent state
 * @param {?} rootView The rootView, so we don't propagate too far up the view tree
 * @return {?} The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    let /** @type {?} */ node;
    if ((node = /** @type {?} */ (((/** @type {?} */ (state)))).node) && node.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return /** @type {?} */ (((node.parent)).data);
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
    const /** @type {?} */ parentIsElement = parent.type === 3 /* Element */;
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
    const /** @type {?} */ parent = /** @type {?} */ ((node.parent));
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
    if (node.type !== 0 /* Container */) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDNUYsT0FBTyxFQUF3Riw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUF5RCxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3SixPQUFPLEVBQTRDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3RILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVqQyx1QkFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBY2hGLDhCQUE4QixJQUFrQixFQUFFLFFBQXNCO0lBQ3RFLHFCQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQy9DLHFCQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDbEIsT0FBTyxhQUFhLENBQUMsSUFBSSx1QkFBeUIsRUFB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QUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLDBCQUEwQixtQkFBQyxJQUFzQixHQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUU7S0FDRjtJQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO0tBQzlEO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtjYWxsSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExOb2RlVHlwZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0hvb2tEYXRhLCBMVmlldywgTFZpZXdPckxDb250YWluZXIsIFRWaWV3LCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGZvbGxvd2luZyB0aGUgZ2l2ZW4gTE5vZGUgaW4gdGhlIHNhbWUgcGFyZW50IERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGluc2VydCB0aGUgZ2l2ZW4gbm9kZSB3aXRoIGluc2VydEJlZm9yZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSBzdG9wTm9kZSBBIHBhcmVudCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgaW4gdGhlIHRyZWUgc2hvdWxkIGJlIHN0b3BwZWQsIG9yIG51bGwgaWYgdGhlXG4gKiBsb29rdXAgc2hvdWxkIG5vdCBiZSBzdG9wcGVkIHVudGlsIHRoZSByZXN1bHQgaXMgZm91bmQuXG4gKiBAcmV0dXJucyBSTm9kZSBiZWZvcmUgd2hpY2ggdGhlIHByb3ZpZGVkIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkIG9yIG51bGwgaWYgdGhlIGxvb2t1cCB3YXNcbiAqIHN0b3BwZWRcbiAqIG9yIGlmIHRoZXJlIGlzIG5vIG5hdGl2ZSBub2RlIGFmdGVyIHRoZSBnaXZlbiBsb2dpY2FsIG5vZGUgaW4gdGhlIHNhbWUgbmF0aXZlIHBhcmVudC5cbiAqL1xuZnVuY3Rpb24gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZTogTE5vZGUgfCBudWxsLCBzdG9wTm9kZTogTE5vZGUgfCBudWxsKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZSAhPT0gc3RvcE5vZGUpIHtcbiAgICBsZXQgcE5leHRPclBhcmVudCA9IGN1cnJlbnROb2RlLnBOZXh0T3JQYXJlbnQ7XG4gICAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAgIHdoaWxlIChwTmV4dE9yUGFyZW50LnR5cGUgIT09IExOb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZU5vZGUgPSBmaW5kRmlyc3RSTm9kZShwTmV4dE9yUGFyZW50KTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBwTmV4dE9yUGFyZW50ID0gcE5leHRPclBhcmVudC5wTmV4dE9yUGFyZW50ICE7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IHBOZXh0T3JQYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjdXJyZW50U2libGluZyA9IGN1cnJlbnROb2RlLm5leHQ7XG4gICAgICB3aGlsZSAoY3VycmVudFNpYmxpbmcpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2libGluZyA9IGN1cnJlbnRTaWJsaW5nLm5leHQ7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gY3VycmVudE5vZGUucGFyZW50O1xuICAgICAgY3VycmVudE5vZGUgPSBudWxsO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHBhcmVudE5vZGUudHlwZTtcbiAgICAgICAgaWYgKHBhcmVudFR5cGUgPT09IExOb2RlVHlwZS5Db250YWluZXIgfHwgcGFyZW50VHlwZSA9PT0gTE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgICBjdXJyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIG5leHQgc2libGluZyBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgY29uc3QgcE5leHRPclBhcmVudCA9IG5vZGUucE5leHRPclBhcmVudDtcblxuICBpZiAocE5leHRPclBhcmVudCkge1xuICAgIC8vIFRoZSBub2RlIGlzIHByb2plY3RlZFxuICAgIGNvbnN0IGlzTGFzdFByb2plY3RlZE5vZGUgPSBwTmV4dE9yUGFyZW50LnR5cGUgPT09IExOb2RlVHlwZS5Qcm9qZWN0aW9uO1xuICAgIC8vIHJldHVybnMgcE5leHRPclBhcmVudCBpZiB3ZSBhcmUgbm90IGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QsIG51bGwgb3RoZXJ3aXNlXG4gICAgcmV0dXJuIGlzTGFzdFByb2plY3RlZE5vZGUgPyBudWxsIDogcE5leHRPclBhcmVudDtcbiAgfVxuXG4gIC8vIHJldHVybnMgbm9kZS5uZXh0IGJlY2F1c2UgdGhlIHRoZSBub2RlIGlzIG5vdCBwcm9qZWN0ZWRcbiAgcmV0dXJuIG5vZGUubmV4dDtcbn1cblxuLyoqXG4gKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGlzIGZ1bmN0aW9uIGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICpcbiAqIEBwYXJhbSBpbml0aWFsTm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHJvb3ROb2RlIFRoZSByb290IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBzaG91bGQgc3RvcC5cbiAqIEByZXR1cm4gTE5vZGV8bnVsbCBUaGUgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKGluaXRpYWxOb2RlOiBMTm9kZSwgcm9vdE5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gaW5pdGlhbE5vZGU7XG4gIGxldCBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGUpO1xuICB3aGlsZSAobm9kZSAmJiAhbmV4dE5vZGUpIHtcbiAgICAvLyBpZiBub2RlLnBOZXh0T3JQYXJlbnQgaXMgbm90IG51bGwgaGVyZSwgaXQgaXMgbm90IHRoZSBuZXh0IG5vZGVcbiAgICAvLyAoYmVjYXVzZSwgYXQgdGhpcyBwb2ludCwgbmV4dE5vZGUgaXMgbnVsbCwgc28gaXQgaXMgdGhlIHBhcmVudClcbiAgICBub2RlID0gbm9kZS5wTmV4dE9yUGFyZW50IHx8IG5vZGUucGFyZW50O1xuICAgIGlmIChub2RlID09PSByb290Tm9kZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG5leHROb2RlID0gbm9kZSAmJiBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgfVxuICByZXR1cm4gbmV4dE5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgaW5zaWRlIHRoZSBnaXZlbiBMTm9kZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmaXJzdCBET00gbm9kZSBtdXN0IGJlIGZvdW5kXG4gKiBAcmV0dXJucyBSTm9kZSBUaGUgZmlyc3QgUk5vZGUgb2YgdGhlIGdpdmVuIExOb2RlIG9yIG51bGwgaWYgdGhlcmUgaXMgbm9uZS5cbiAqL1xuZnVuY3Rpb24gZmluZEZpcnN0Uk5vZGUocm9vdE5vZGU6IExOb2RlKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gcm9vdE5vZGU7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgLy8gQSBMRWxlbWVudE5vZGUgaGFzIGEgbWF0Y2hpbmcgUk5vZGUgaW4gTEVsZW1lbnROb2RlLm5hdGl2ZVxuICAgICAgcmV0dXJuIChub2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlO1xuICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSk7XG4gICAgICBjb25zdCBjaGlsZENvbnRhaW5lckRhdGE6IExDb250YWluZXIgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhIDpcbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgICAgbmV4dE5vZGUgPSBjaGlsZENvbnRhaW5lckRhdGEudmlld3MubGVuZ3RoID8gY2hpbGRDb250YWluZXJEYXRhLnZpZXdzWzBdLmNoaWxkIDogbnVsbDtcbiAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIEZvciBQcm9qZWN0aW9uIGxvb2sgYXQgdGhlIGZpcnN0IHByb2plY3RlZCBub2RlXG4gICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbG9vayBhdCB0aGUgZmlyc3QgY2hpbGRcbiAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFZpZXdOb2RlKS5jaGlsZDtcbiAgICB9XG5cbiAgICBub2RlID0gbmV4dE5vZGUgPT09IG51bGwgPyBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShub2RlLCByb290Tm9kZSkgOiBuZXh0Tm9kZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0aGUgcm9vdCB2aWV3IGJlbG9uZ3NcbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiB0cnVlLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGJvb2xlYW4sXG4gICAgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBMTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHJvb3ROb2RlLCBMTm9kZVR5cGUuVmlldyk7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBjb250YWluZXIuZGF0YS5yZW5kZXJQYXJlbnQ7XG4gIGNvbnN0IHBhcmVudCA9IHBhcmVudE5vZGUgPyBwYXJlbnROb2RlLm5hdGl2ZSA6IG51bGw7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gcm9vdE5vZGUuY2hpbGQ7XG4gIGlmIChwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gY29udGFpbmVyLnZpZXcucmVuZGVyZXI7XG4gICAgICBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgICBpZiAoaW5zZXJ0TW9kZSkge1xuICAgICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCBhcyBSRWxlbWVudCwgbm9kZS5uYXRpdmUgISkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0Tm9kZSA9IG5vZGUubmV4dDtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIC8vIGlmIHdlIGdldCB0byBhIGNvbnRhaW5lciwgaXQgbXVzdCBiZSBhIHJvb3Qgbm9kZSBvZiBhIHZpZXcgYmVjYXVzZSB3ZSBhcmUgb25seVxuICAgICAgICAvLyBwcm9wYWdhdGluZyBkb3duIGludG8gY2hpbGQgdmlld3MgLyBjb250YWluZXJzIGFuZCBub3QgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YS5yZW5kZXJQYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBuZXh0Tm9kZSA9IGNoaWxkQ29udGFpbmVyRGF0YS52aWV3cy5sZW5ndGggPyBjaGlsZENvbnRhaW5lckRhdGEudmlld3NbMF0uY2hpbGQgOiBudWxsO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhLmhlYWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExWaWV3Tm9kZSkuY2hpbGQ7XG4gICAgICB9XG4gICAgICBpZiAobmV4dE5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgbm9kZSA9IGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKG5vZGUsIHJvb3ROb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUgPSBuZXh0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgdGhlIHRyZWUgb2YgY29tcG9uZW50IHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSByb290VmlldztcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci52aWV3cyAmJiB2aWV3T3JDb250YWluZXIudmlld3MubGVuZ3RoKSB7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyLnZpZXdzWzBdLmRhdGE7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIuY2hpbGQpIHtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIuY2hpbGQ7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIubmV4dCkge1xuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBJZiB0aGUgdmlld09yQ29udGFpbmVyIGlzIHRoZSByb290VmlldywgdGhlbiB0aGUgY2xlYW51cCBpcyBkb25lIHR3aWNlLlxuICAgICAgLy8gV2l0aG91dCB0aGlzIGNoZWNrLCBuZ09uRGVzdHJveSB3b3VsZCBiZSBjYWxsZWQgdHdpY2UgZm9yIGEgZGlyZWN0aXZlIG9uIGFuIGVsZW1lbnQuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIS5uZXh0ICYmIHZpZXdPckNvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgICAgdmlld09yQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUodmlld09yQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcgfHwgcm9vdFZpZXcpO1xuXG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lci5uZXh0O1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIG5ld1ZpZXcgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgbmV3VmlldzogTFZpZXdOb2RlLCBpbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgc3RhdGUgPSBjb250YWluZXIuZGF0YTtcbiAgY29uc3Qgdmlld3MgPSBzdGF0ZS52aWV3cztcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgc2V0Vmlld05leHQodmlld3NbaW5kZXggLSAxXSwgbmV3Vmlldyk7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBzZXRWaWV3TmV4dChuZXdWaWV3LCB2aWV3c1tpbmRleF0pO1xuICAgIHZpZXdzLnNwbGljZShpbmRleCwgMCwgbmV3Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaChuZXdWaWV3KTtcbiAgfVxuXG4gIC8vIElmIHRoZSBjb250YWluZXIncyByZW5kZXJQYXJlbnQgaXMgbnVsbCwgd2Uga25vdyB0aGF0IGl0IGlzIGEgcm9vdCBub2RlIG9mIGl0cyBvd24gcGFyZW50IHZpZXdcbiAgLy8gYW5kIHdlIHNob3VsZCB3YWl0IHVudGlsIHRoYXQgcGFyZW50IHByb2Nlc3NlcyBpdHMgbm9kZXMgKG90aGVyd2lzZSwgd2Ugd2lsbCBpbnNlcnQgdGhpcyB2aWV3J3NcbiAgLy8gbm9kZXMgdHdpY2UgLSBvbmNlIG5vdyBhbmQgb25jZSB3aGVuIGl0cyBwYXJlbnQgaW5zZXJ0cyBpdHMgdmlld3MpLlxuICBpZiAoY29udGFpbmVyLmRhdGEucmVuZGVyUGFyZW50ICE9PSBudWxsKSB7XG4gICAgbGV0IGJlZm9yZU5vZGUgPSBmaW5kTmV4dFJOb2RlU2libGluZyhuZXdWaWV3LCBjb250YWluZXIpO1xuICAgIGlmICghYmVmb3JlTm9kZSkge1xuICAgICAgbGV0IGNvbnRhaW5lck5leHROYXRpdmVOb2RlID0gY29udGFpbmVyLm5hdGl2ZTtcbiAgICAgIGlmIChjb250YWluZXJOZXh0TmF0aXZlTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRhaW5lck5leHROYXRpdmVOb2RlID0gY29udGFpbmVyLm5hdGl2ZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKGNvbnRhaW5lciwgbnVsbCk7XG4gICAgICB9XG4gICAgICBiZWZvcmVOb2RlID0gY29udGFpbmVyTmV4dE5hdGl2ZU5vZGU7XG4gICAgfVxuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGNvbnRhaW5lciwgbmV3VmlldywgdHJ1ZSwgYmVmb3JlTm9kZSk7XG4gIH1cblxuICByZXR1cm4gbmV3Vmlldztcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGFuZCBjb25kdWN0cyBjbGVhbnVwIChlLmcuIHJlbW92aW5nXG4gKiBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqIEByZXR1cm5zIFRoZSByZW1vdmVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGEudmlld3M7XG4gIGNvbnN0IHZpZXdOb2RlID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgc2V0Vmlld05leHQodmlld3NbcmVtb3ZlSW5kZXggLSAxXSwgdmlld05vZGUubmV4dCk7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgdmlld05vZGUubmV4dCA9IG51bGw7XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3Tm9kZS5kYXRhKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgY29udGFpbmVyLmRhdGEucXVlcmllcyAmJiBjb250YWluZXIuZGF0YS5xdWVyaWVzLnJlbW92ZVZpZXcocmVtb3ZlSW5kZXgpO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogU2V0cyBhIG5leHQgb24gdGhlIHZpZXcgbm9kZSwgc28gdmlld3MgaW4gZm9yIGxvb3BzIGNhbiBlYXNpbHkganVtcCBmcm9tXG4gKiBvbmUgdmlldyB0byB0aGUgbmV4dCB0byBhZGQvcmVtb3ZlIGVsZW1lbnRzLiBBbHNvIGFkZHMgdGhlIExWaWV3ICh2aWV3LmRhdGEpXG4gKiB0byB0aGUgdmlldyB0cmVlIGZvciBlYXN5IHRyYXZlcnNhbCB3aGVuIGNsZWFuaW5nIHVwIHRoZSB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIHNldCB1cFxuICogQHBhcmFtIG5leHQgVGhlIHZpZXcncyBuZXcgbmV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Vmlld05leHQodmlldzogTFZpZXdOb2RlLCBuZXh0OiBMVmlld05vZGUgfCBudWxsKTogdm9pZCB7XG4gIHZpZXcubmV4dCA9IG5leHQ7XG4gIHZpZXcuZGF0YS5uZXh0ID0gbmV4dCA/IG5leHQuZGF0YSA6IG51bGw7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld09yTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3KTogTFZpZXdPckxDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXcpICEubm9kZSkgJiYgbm9kZS50eXBlID09PSBMTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gbm9kZS5wYXJlbnQgIS5kYXRhIGFzIGFueTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gc3RhdGUucGFyZW50ID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZS5wYXJlbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBjbGVhbnVwID0gdmlldy5jbGVhbnVwICE7XG4gIGlmIChjbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNsZWFudXAgIVtpICsgMV0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBjbGVhbnVwW2kgKyAyXSwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbGVhbnVwW2ldLmNhbGwoY2xlYW51cFtpICsgMV0pO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3LmNsZWFudXAgPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3LnRWaWV3O1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgY2FsbEhvb2tzKHZpZXcuZGlyZWN0aXZlcyAhLCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHBpcGVEZXN0cm95SG9va3MgPSB2aWV3LnRWaWV3ICYmIHZpZXcudFZpZXcucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlldy5kYXRhICEsIHBpcGVEZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGEgbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkIGluIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlIG5hdGl2ZSBub2RlIGNhbiBiZSBpbnNlcnRlZCB3aGVuIGl0cyBwYXJlbnQgaXM6XG4gKiAtIEEgcmVndWxhciBlbGVtZW50ID0+IFllc1xuICogLSBBIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgPT5cbiAqICAgIC0gaWYgdGhlIGBjdXJyZW50Vmlld2AgPT09IHRoZSBwYXJlbnQgYHZpZXdgOiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgY29udGVudCAodnMgdGhlXG4gKiAgICAgIHRlbXBsYXRlKVxuICogICAgICA9PiBkb24ndCBhZGQgYXMgdGhlIHBhcmVudCBjb21wb25lbnQgd2lsbCBwcm9qZWN0IGlmIG5lZWRlZC5cbiAqICAgIC0gYGN1cnJlbnRWaWV3YCAhPT0gdGhlIHBhcmVudCBgdmlld2AgPT4gVGhlIGVsZW1lbnQgaXMgaW4gdGhlIHRlbXBsYXRlICh2cyB0aGUgY29udGVudCksXG4gKiAgICAgIGFkZCBpdFxuICogLSBWaWV3IGVsZW1lbnQgPT4gZGVsYXkgaW5zZXJ0aW9uLCB3aWxsIGJlIGRvbmUgb24gYHZpZXdFbmQoKWBcbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgaW4gd2hpY2ggdG8gaW5zZXJ0IHRoZSBjaGlsZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBMVmlldyBiZWluZyBwcm9jZXNzZWRcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIHRoZSBjaGlsZCBlbGVtZW50IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50OiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGNvbnN0IHBhcmVudElzRWxlbWVudCA9IHBhcmVudC50eXBlID09PSBMTm9kZVR5cGUuRWxlbWVudDtcblxuICByZXR1cm4gcGFyZW50SXNFbGVtZW50ICYmXG4gICAgICAocGFyZW50LnZpZXcgIT09IGN1cnJlbnRWaWV3IHx8IHBhcmVudC5kYXRhID09PSBudWxsIC8qIFJlZ3VsYXIgRWxlbWVudC4gKi8pO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgZWxlbWVudCB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9XG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHRvIHdoaWNoIHRvIGFwcGVuZCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjaGlsZCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQocGFyZW50OiBMTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSBhZGQgZWxlbWVudCBpZiBub3QgaW4gVmlldyBvciBub3QgcHJvamVjdGVkLlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXcucmVuZGVyZXI7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50Lm5hdGl2ZSAhYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogSW5zZXJ0cyB0aGUgcHJvdmlkZWQgbm9kZSBiZWZvcmUgdGhlIGNvcnJlY3QgZWxlbWVudCBpbiB0aGUgRE9NLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfVxuICpcbiAqIEBwYXJhbSBub2RlIE5vZGUgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0Q2hpbGQobm9kZTogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBwYXJlbnQgPSBub2RlLnBhcmVudCAhO1xuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIGxldCBuYXRpdmVTaWJsaW5nOiBSTm9kZXxudWxsID0gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZSwgbnVsbCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlldy5yZW5kZXJlcjtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50Lm5hdGl2ZSAhLCBub2RlLm5hdGl2ZSAhLCBuYXRpdmVTaWJsaW5nKSA6XG4gICAgICAgIHBhcmVudC5uYXRpdmUgIS5pbnNlcnRCZWZvcmUobm9kZS5uYXRpdmUgISwgbmF0aXZlU2libGluZywgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyBhIHByb2plY3RlZCBub2RlIHRvIHRoZSBET00sIG9yIGluIHRoZSBjYXNlIG9mIGEgcHJvamVjdGVkIGNvbnRhaW5lcixcbiAqIGFwcGVuZHMgdGhlIG5vZGVzIGZyb20gYWxsIG9mIHRoZSBjb250YWluZXIncyBhY3RpdmUgdmlld3MgdG8gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB0byBwcm9jZXNzXG4gKiBAcGFyYW0gY3VycmVudFBhcmVudCBUaGUgbGFzdCBwYXJlbnQgZWxlbWVudCB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlLCBjdXJyZW50UGFyZW50OiBMRWxlbWVudE5vZGUsXG4gICAgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGlmIChub2RlLnR5cGUgIT09IExOb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCAobm9kZSBhcyBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUpLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBDb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gRWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduZWUgdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgIGxDb250YWluZXIucmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXIudmlld3M7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobm9kZSBhcyBMQ29udGFpbmVyTm9kZSwgdmlld3NbaV0sIHRydWUsIG51bGwpO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhLnJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQ7XG4gIH1cbn1cbiJdfQ==