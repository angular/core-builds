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
    // A view to cleanup doesn't have children so we should not try to descend down the view tree.
    if (!rootView.child) {
        return cleanUpView(rootView);
    }
    let /** @type {?} */ viewOrContainer = rootView.child;
    while (viewOrContainer) {
        let /** @type {?} */ next = null;
        if (viewOrContainer.views && viewOrContainer.views.length) {
            next = viewOrContainer.views[0].data;
        }
        else if (viewOrContainer.child) {
            next = viewOrContainer.child;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDNUYsT0FBTyxFQUF3Riw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsSyxPQUFPLEVBQUMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDakYsT0FBTyxFQUF5RCxvQkFBb0IsRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM3SixPQUFPLEVBQTRDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3RILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVqQyx1QkFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBY2hGLDhCQUE4QixJQUFrQixFQUFFLFFBQXNCO0lBQ3RFLHFCQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQy9DLHFCQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDbEIsT0FBTyxhQUFhLENBQUMsSUFBSSx1QkFBeUIsRUFB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QUFDLElBQUksQ0FBQztRQUNqRCxVQUFVLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztRQUN4Qyx1QkFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztRQUMvQixHQUFHLENBQUMsQ0FBQyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdEMsMEJBQTBCLG1CQUFDLElBQXNCLEdBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxRTtLQUNGO0lBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMvQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxhQUFhLENBQUM7S0FDOUQ7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTE5vZGVUeXBlLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7SG9va0RhdGEsIExWaWV3LCBMVmlld09yTENvbnRhaW5lciwgVFZpZXcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgZm9sbG93aW5nIHRoZSBnaXZlbiBMTm9kZSBpbiB0aGUgc2FtZSBwYXJlbnQgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gaW5zZXJ0IHRoZSBnaXZlbiBub2RlIHdpdGggaW5zZXJ0QmVmb3JlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBET00gbm9kZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHN0b3BOb2RlIEEgcGFyZW50IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBpbiB0aGUgdHJlZSBzaG91bGQgYmUgc3RvcHBlZCwgb3IgbnVsbCBpZiB0aGVcbiAqIGxvb2t1cCBzaG91bGQgbm90IGJlIHN0b3BwZWQgdW50aWwgdGhlIHJlc3VsdCBpcyBmb3VuZC5cbiAqIEByZXR1cm5zIFJOb2RlIGJlZm9yZSB3aGljaCB0aGUgcHJvdmlkZWQgbm9kZSBzaG91bGQgYmUgaW5zZXJ0ZWQgb3IgbnVsbCBpZiB0aGUgbG9va3VwIHdhc1xuICogc3RvcHBlZFxuICogb3IgaWYgdGhlcmUgaXMgbm8gbmF0aXZlIG5vZGUgYWZ0ZXIgdGhlIGdpdmVuIGxvZ2ljYWwgbm9kZSBpbiB0aGUgc2FtZSBuYXRpdmUgcGFyZW50LlxuICovXG5mdW5jdGlvbiBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlOiBMTm9kZSB8IG51bGwsIHN0b3BOb2RlOiBMTm9kZSB8IG51bGwpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gbm9kZTtcbiAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlICE9PSBzdG9wTm9kZSkge1xuICAgIGxldCBwTmV4dE9yUGFyZW50ID0gY3VycmVudE5vZGUucE5leHRPclBhcmVudDtcbiAgICBpZiAocE5leHRPclBhcmVudCkge1xuICAgICAgd2hpbGUgKHBOZXh0T3JQYXJlbnQudHlwZSAhPT0gTE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKHBOZXh0T3JQYXJlbnQpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIHBOZXh0T3JQYXJlbnQgPSBwTmV4dE9yUGFyZW50LnBOZXh0T3JQYXJlbnQgITtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gcE5leHRPclBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGN1cnJlbnRTaWJsaW5nID0gY3VycmVudE5vZGUubmV4dDtcbiAgICAgIHdoaWxlIChjdXJyZW50U2libGluZykge1xuICAgICAgICBjb25zdCBuYXRpdmVOb2RlID0gZmluZEZpcnN0Uk5vZGUoY3VycmVudFNpYmxpbmcpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTaWJsaW5nID0gY3VycmVudFNpYmxpbmcubmV4dDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnQ7XG4gICAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRUeXBlID0gcGFyZW50Tm9kZS50eXBlO1xuICAgICAgICBpZiAocGFyZW50VHlwZSA9PT0gTE5vZGVUeXBlLkNvbnRhaW5lciB8fCBwYXJlbnRUeXBlID09PSBMTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEByZXR1cm4gTE5vZGV8bnVsbCBUaGUgbmV4dCBzaWJsaW5nIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBjb25zdCBwTmV4dE9yUGFyZW50ID0gbm9kZS5wTmV4dE9yUGFyZW50O1xuXG4gIGlmIChwTmV4dE9yUGFyZW50KSB7XG4gICAgLy8gVGhlIG5vZGUgaXMgcHJvamVjdGVkXG4gICAgY29uc3QgaXNMYXN0UHJvamVjdGVkTm9kZSA9IHBOZXh0T3JQYXJlbnQudHlwZSA9PT0gTE5vZGVUeXBlLlByb2plY3Rpb247XG4gICAgLy8gcmV0dXJucyBwTmV4dE9yUGFyZW50IGlmIHdlIGFyZSBub3QgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCwgbnVsbCBvdGhlcndpc2VcbiAgICByZXR1cm4gaXNMYXN0UHJvamVjdGVkTm9kZSA/IG51bGwgOiBwTmV4dE9yUGFyZW50O1xuICB9XG5cbiAgLy8gcmV0dXJucyBub2RlLm5leHQgYmVjYXVzZSB0aGUgdGhlIG5vZGUgaXMgbm90IHByb2plY3RlZFxuICByZXR1cm4gbm9kZS5uZXh0O1xufVxuXG4vKipcbiAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAqXG4gKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoaXMgZnVuY3Rpb24gZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gKlxuICogQHBhcmFtIGluaXRpYWxOb2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHJvb3Qgbm9kZSBhdCB3aGljaCB0aGUgbG9va3VwIHNob3VsZCBzdG9wLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBmb2xsb3dpbmcgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUoaW5pdGlhbE5vZGU6IExOb2RlLCByb290Tm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBpbml0aWFsTm9kZTtcbiAgbGV0IG5leHROb2RlID0gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIHdoaWxlIChub2RlICYmICFuZXh0Tm9kZSkge1xuICAgIC8vIGlmIG5vZGUucE5leHRPclBhcmVudCBpcyBub3QgbnVsbCBoZXJlLCBpdCBpcyBub3QgdGhlIG5leHQgbm9kZVxuICAgIC8vIChiZWNhdXNlLCBhdCB0aGlzIHBvaW50LCBuZXh0Tm9kZSBpcyBudWxsLCBzbyBpdCBpcyB0aGUgcGFyZW50KVxuICAgIG5vZGUgPSBub2RlLnBOZXh0T3JQYXJlbnQgfHwgbm9kZS5wYXJlbnQ7XG4gICAgaWYgKG5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbmV4dE5vZGUgPSBub2RlICYmIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGUpO1xuICB9XG4gIHJldHVybiBuZXh0Tm9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBSTm9kZSBpbnNpZGUgdGhlIGdpdmVuIExOb2RlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZpcnN0IERPTSBub2RlIG11c3QgYmUgZm91bmRcbiAqIEByZXR1cm5zIFJOb2RlIFRoZSBmaXJzdCBSTm9kZSBvZiB0aGUgZ2l2ZW4gTE5vZGUgb3IgbnVsbCBpZiB0aGVyZSBpcyBub25lLlxuICovXG5mdW5jdGlvbiBmaW5kRmlyc3RSTm9kZShyb290Tm9kZTogTE5vZGUpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSByb290Tm9kZTtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAvLyBBIExFbGVtZW50Tm9kZSBoYXMgYSBtYXRjaGluZyBSTm9kZSBpbiBMRWxlbWVudE5vZGUubmF0aXZlXG4gICAgICByZXR1cm4gKG5vZGUgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmU7XG4gICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IChub2RlIGFzIExDb250YWluZXJOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBuZXh0Tm9kZSA9IGNoaWxkQ29udGFpbmVyRGF0YS52aWV3cy5sZW5ndGggPyBjaGlsZENvbnRhaW5lckRhdGEudmlld3NbMF0uY2hpbGQgOiBudWxsO1xuICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gRm9yIFByb2plY3Rpb24gbG9vayBhdCB0aGUgZmlyc3QgcHJvamVjdGVkIG5vZGVcbiAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhLmhlYWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBsb29rIGF0IHRoZSBmaXJzdCBjaGlsZFxuICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMVmlld05vZGUpLmNoaWxkO1xuICAgIH1cblxuICAgIG5vZGUgPSBuZXh0Tm9kZSA9PT0gbnVsbCA/IGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKG5vZGUsIHJvb3ROb2RlKSA6IG5leHROb2RlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHJvb3ROb2RlIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IHRydWUsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogYm9vbGVhbixcbiAgICBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIExOb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocm9vdE5vZGUsIExOb2RlVHlwZS5WaWV3KTtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhLnJlbmRlclBhcmVudDtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSByb290Tm9kZS5jaGlsZDtcbiAgaWYgKHBhcmVudCkge1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlldy5yZW5kZXJlcjtcbiAgICAgIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgIGlmIChpbnNlcnRNb2RlKSB7XG4gICAgICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgbm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50IGFzIFJFbGVtZW50LCBub2RlLm5hdGl2ZSAhKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG5vZGUubmF0aXZlICEpO1xuICAgICAgICB9XG4gICAgICAgIG5leHROb2RlID0gbm9kZS5uZXh0O1xuICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgLy8gaWYgd2UgZ2V0IHRvIGEgY29udGFpbmVyLCBpdCBtdXN0IGJlIGEgcm9vdCBub2RlIG9mIGEgdmlldyBiZWNhdXNlIHdlIGFyZSBvbmx5XG4gICAgICAgIC8vIHByb3BhZ2F0aW5nIGRvd24gaW50byBjaGlsZCB2aWV3cyAvIGNvbnRhaW5lcnMgYW5kIG5vdCBjaGlsZCBlbGVtZW50c1xuICAgICAgICBjb25zdCBjaGlsZENvbnRhaW5lckRhdGE6IExDb250YWluZXIgPSAobm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbiAgICAgICAgY2hpbGRDb250YWluZXJEYXRhLnJlbmRlclBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIG5leHROb2RlID0gY2hpbGRDb250YWluZXJEYXRhLnZpZXdzLmxlbmd0aCA/IGNoaWxkQ29udGFpbmVyRGF0YS52aWV3c1swXS5jaGlsZCA6IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFZpZXdOb2RlKS5jaGlsZDtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbnVsbCkge1xuICAgICAgICBub2RlID0gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZSA9IG5leHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBBIHZpZXcgdG8gY2xlYW51cCBkb2Vzbid0IGhhdmUgY2hpbGRyZW4gc28gd2Ugc2hvdWxkIG5vdCB0cnkgdG8gZGVzY2VuZCBkb3duIHRoZSB2aWV3IHRyZWUuXG4gIGlmICghcm9vdFZpZXcuY2hpbGQpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSByb290Vmlldy5jaGlsZDtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3T3JMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci52aWV3cyAmJiB2aWV3T3JDb250YWluZXIudmlld3MubGVuZ3RoKSB7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyLnZpZXdzWzBdLmRhdGE7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIuY2hpbGQpIHtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIuY2hpbGQ7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIubmV4dCkge1xuICAgICAgLy8gT25seSBtb3ZlIHRvIHRoZSBzaWRlIGFuZCBjbGVhbiBpZiBvcGVyYXRpbmcgYmVsb3cgcm9vdFZpZXcgLVxuICAgICAgLy8gb3RoZXJ3aXNlIHdlIHdvdWxkIHN0YXJ0IGNsZWFuaW5nIHVwIHNpYmxpbmcgdmlld3Mgb2YgdGhlIHJvb3RWaWV3LlxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBJZiB0aGUgdmlld09yQ29udGFpbmVyIGlzIHRoZSByb290VmlldyBhbmQgbmV4dCBpcyBudWxsIGl0IG1lYW5zIHRoYXQgd2UgYXJlIGRlYWxpbmdcbiAgICAgIC8vIHdpdGggYSByb290IHZpZXcgdGhhdCBkb2Vzbid0IGhhdmUgY2hpbGRyZW4uIFdlIGRpZG4ndCBkZXNjZW5kIGludG8gY2hpbGQgdmlld3NcbiAgICAgIC8vIHNvIG5vIG5lZWQgdG8gZ28gYmFjayB1cCB0aGUgdmlld3MgdHJlZS5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhLm5leHQgJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyB8fCByb290Vmlldyk7XG5cbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyLm5leHQ7XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gbmV3VmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdG8gaW5zZXJ0IHRoZSB2aWV3XG4gKiBAcmV0dXJucyBUaGUgaW5zZXJ0ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VmlldyhcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCBuZXdWaWV3OiBMVmlld05vZGUsIGluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRhaW5lci5kYXRhO1xuICBjb25zdCB2aWV3cyA9IHN0YXRlLnZpZXdzO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICBzZXRWaWV3TmV4dCh2aWV3c1tpbmRleCAtIDFdLCBuZXdWaWV3KTtcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIHNldFZpZXdOZXh0KG5ld1ZpZXcsIHZpZXdzW2luZGV4XSk7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCBuZXdWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB2aWV3cy5wdXNoKG5ld1ZpZXcpO1xuICB9XG5cbiAgLy8gSWYgdGhlIGNvbnRhaW5lcidzIHJlbmRlclBhcmVudCBpcyBudWxsLCB3ZSBrbm93IHRoYXQgaXQgaXMgYSByb290IG5vZGUgb2YgaXRzIG93biBwYXJlbnQgdmlld1xuICAvLyBhbmQgd2Ugc2hvdWxkIHdhaXQgdW50aWwgdGhhdCBwYXJlbnQgcHJvY2Vzc2VzIGl0cyBub2RlcyAob3RoZXJ3aXNlLCB3ZSB3aWxsIGluc2VydCB0aGlzIHZpZXcnc1xuICAvLyBub2RlcyB0d2ljZSAtIG9uY2Ugbm93IGFuZCBvbmNlIHdoZW4gaXRzIHBhcmVudCBpbnNlcnRzIGl0cyB2aWV3cykuXG4gIGlmIChjb250YWluZXIuZGF0YS5yZW5kZXJQYXJlbnQgIT09IG51bGwpIHtcbiAgICBsZXQgYmVmb3JlTm9kZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKG5ld1ZpZXcsIGNvbnRhaW5lcik7XG4gICAgaWYgKCFiZWZvcmVOb2RlKSB7XG4gICAgICBsZXQgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlO1xuICAgICAgaWYgKGNvbnRhaW5lck5leHROYXRpdmVOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlID0gZmluZE5leHRSTm9kZVNpYmxpbmcoY29udGFpbmVyLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGJlZm9yZU5vZGUgPSBjb250YWluZXJOZXh0TmF0aXZlTm9kZTtcbiAgICB9XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCBuZXdWaWV3LCB0cnVlLCBiZWZvcmVOb2RlKTtcbiAgfVxuXG4gIHJldHVybiBuZXdWaWV3O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2Qgc3BsaWNlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00gYW5kIGNvbmR1Y3RzIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmdcbiAqIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICogQHJldHVybnMgVGhlIHJlbW92ZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YS52aWV3cztcbiAgY29uc3Qgdmlld05vZGUgPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICBzZXRWaWV3TmV4dCh2aWV3c1tyZW1vdmVJbmRleCAtIDFdLCB2aWV3Tm9kZS5uZXh0KTtcbiAgfVxuICB2aWV3cy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICB2aWV3Tm9kZS5uZXh0ID0gbnVsbDtcbiAgZGVzdHJveVZpZXdUcmVlKHZpZXdOb2RlLmRhdGEpO1xuICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihjb250YWluZXIsIHZpZXdOb2RlLCBmYWxzZSk7XG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb250YWluZXIuZGF0YS5xdWVyaWVzICYmIGNvbnRhaW5lci5kYXRhLnF1ZXJpZXMucmVtb3ZlVmlldyhyZW1vdmVJbmRleCk7XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgbmV4dCBvbiB0aGUgdmlldyBub2RlLCBzbyB2aWV3cyBpbiBmb3IgbG9vcHMgY2FuIGVhc2lseSBqdW1wIGZyb21cbiAqIG9uZSB2aWV3IHRvIHRoZSBuZXh0IHRvIGFkZC9yZW1vdmUgZWxlbWVudHMuIEFsc28gYWRkcyB0aGUgTFZpZXcgKHZpZXcuZGF0YSlcbiAqIHRvIHRoZSB2aWV3IHRyZWUgZm9yIGVhc3kgdHJhdmVyc2FsIHdoZW4gY2xlYW5pbmcgdXAgdGhlIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIHZpZXcgdG8gc2V0IHVwXG4gKiBAcGFyYW0gbmV4dCBUaGUgdmlldydzIG5ldyBuZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRWaWV3TmV4dCh2aWV3OiBMVmlld05vZGUsIG5leHQ6IExWaWV3Tm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgdmlldy5uZXh0ID0gbmV4dDtcbiAgdmlldy5kYXRhLm5leHQgPSBuZXh0ID8gbmV4dC5kYXRhIDogbnVsbDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoaWNoIExWaWV3T3JMQ29udGFpbmVyIHRvIGp1bXAgdG8gd2hlbiB0cmF2ZXJzaW5nIGJhY2sgdXAgdGhlXG4gKiB0cmVlIGluIGRlc3Ryb3lWaWV3VHJlZS5cbiAqXG4gKiBOb3JtYWxseSwgdGhlIHZpZXcncyBwYXJlbnQgTFZpZXcgc2hvdWxkIGJlIGNoZWNrZWQsIGJ1dCBpbiB0aGUgY2FzZSBvZlxuICogZW1iZWRkZWQgdmlld3MsIHRoZSBjb250YWluZXIgKHdoaWNoIGlzIHRoZSB2aWV3IG5vZGUncyBwYXJlbnQsIGJ1dCBub3QgdGhlXG4gKiBMVmlldydzIHBhcmVudCkgbmVlZHMgdG8gYmUgY2hlY2tlZCBmb3IgYSBwb3NzaWJsZSBuZXh0IHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdPckxDb250YWluZXIgZm9yIHdoaWNoIHdlIG5lZWQgYSBwYXJlbnQgc3RhdGVcbiAqIEBwYXJhbSByb290VmlldyBUaGUgcm9vdFZpZXcsIHNvIHdlIGRvbid0IHByb3BhZ2F0ZSB0b28gZmFyIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBjb3JyZWN0IHBhcmVudCBMVmlld09yTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50U3RhdGUoc3RhdGU6IExWaWV3T3JMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld09yTENvbnRhaW5lcnxudWxsIHtcbiAgbGV0IG5vZGU7XG4gIGlmICgobm9kZSA9IChzdGF0ZSBhcyBMVmlldykgIS5ub2RlKSAmJiBub2RlLnR5cGUgPT09IExOb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBub2RlLnBhcmVudCAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZS5wYXJlbnQgPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlLnBhcmVudDtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBhbmQgY2FsbCBhbGwgb25EZXN0cm95cyBpbiBhIGdpdmVuIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3LmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2xlYW51cCAhW2kgKyAxXS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGNsZWFudXBbaSArIDJdLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjbGVhbnVwW2kgKyAxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXcuY2xlYW51cCA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXcudFZpZXc7XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlldy5kaXJlY3RpdmVzICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXcudFZpZXcgJiYgdmlldy50Vmlldy5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3LmRhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQgaW4gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGUgbmF0aXZlIG5vZGUgY2FuIGJlIGluc2VydGVkIHdoZW4gaXRzIHBhcmVudCBpczpcbiAqIC0gQSByZWd1bGFyIGVsZW1lbnQgPT4gWWVzXG4gKiAtIEEgY29tcG9uZW50IGhvc3QgZWxlbWVudCA9PlxuICogICAgLSBpZiB0aGUgYGN1cnJlbnRWaWV3YCA9PT0gdGhlIHBhcmVudCBgdmlld2A6IFRoZSBlbGVtZW50IGlzIGluIHRoZSBjb250ZW50ICh2cyB0aGVcbiAqICAgICAgdGVtcGxhdGUpXG4gKiAgICAgID0+IGRvbid0IGFkZCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCB3aWxsIHByb2plY3QgaWYgbmVlZGVkLlxuICogICAgLSBgY3VycmVudFZpZXdgICE9PSB0aGUgcGFyZW50IGB2aWV3YCA9PiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdGVtcGxhdGUgKHZzIHRoZSBjb250ZW50KSxcbiAqICAgICAgYWRkIGl0XG4gKiAtIFZpZXcgZWxlbWVudCA9PiBkZWxheSBpbnNlcnRpb24sIHdpbGwgYmUgZG9uZSBvbiBgdmlld0VuZCgpYFxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBpbiB3aGljaCB0byBpbnNlcnQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIExWaWV3IGJlaW5nIHByb2Nlc3NlZFxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQ6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50SXNFbGVtZW50ID0gcGFyZW50LnR5cGUgPT09IExOb2RlVHlwZS5FbGVtZW50O1xuXG4gIHJldHVybiBwYXJlbnRJc0VsZW1lbnQgJiZcbiAgICAgIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcgfHwgcGFyZW50LmRhdGEgPT09IG51bGwgLyogUmVndWxhciBFbGVtZW50LiAqLyk7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBXZSBvbmx5IGFkZCBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlldy5yZW5kZXJlcjtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBub2RlIGJlZm9yZSB0aGUgY29ycmVjdCBlbGVtZW50IGluIHRoZSBET00uXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9XG4gKlxuICogQHBhcmFtIG5vZGUgTm9kZSB0byBpbnNlcnRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBDdXJyZW50IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRDaGlsZChub2RlOiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50ICE7XG4gIGlmIChjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgbGV0IG5hdGl2ZVNpYmxpbmc6IFJOb2RlfG51bGwgPSBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlLCBudWxsKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3LnJlbmRlcmVyO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQubmF0aXZlICEsIG5vZGUubmF0aXZlICEsIG5hdGl2ZVNpYmxpbmcpIDpcbiAgICAgICAgcGFyZW50Lm5hdGl2ZSAhLmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBuYXRpdmVTaWJsaW5nLCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSxcbiAgICBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKG5vZGUudHlwZSAhPT0gTE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIChub2RlIGFzIExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSkubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIENvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBFbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ25lZSB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lci5yZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lci52aWV3cztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbnVsbCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEucmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgfVxufVxuIl19