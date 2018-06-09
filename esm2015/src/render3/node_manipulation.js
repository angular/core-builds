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
import { RENDER_PARENT, VIEWS, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { CLEANUP, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
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
        const /** @type {?} */ viewData = /** @type {?} */ (node.data);
        return viewData[NEXT] ? (/** @type {?} */ (viewData[NEXT]))[HOST_NODE] : null;
    }
    return node.tNode.next ? node.view[/** @type {?} */ ((node.tNode.next)).index] : null;
}
/**
 * Retrieves the first child of a given node
 * @param {?} node
 * @return {?}
 */
export function getChildLNode(node) {
    if (node.tNode.child) {
        const /** @type {?} */ viewData = node.tNode.type === 2 /* View */ ? /** @type {?} */ (node.data) : node.view;
        return viewData[node.tNode.child.index];
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
    return parent ? node.view[parent.index] : node.view[HOST_NODE];
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
    return walkLNodeTree(rootNode, rootNode, 0 /* Find */) || null;
}
/** @enum {number} */
const WalkLNodeTreeAction = {
    /** returns the first available native node */
    Find: 0,
    /** node insert in the native environment */
    Insert: 1,
    /** node detach from the native environment */
    Detach: 2,
    /** node destruction using the renderer's API */
    Destroy: 3,
};
/**
 * Walks a tree of LNodes, applying a transformation on the LElement nodes, either only on the first
 * one found, or on all of them.
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 *
 * @param {?} startingNode the node from which the walk is started.
 * @param {?} rootNode the root node considered.
 * @param {?} action Identifies the action to be performed on the LElement nodes.
 * @param {?=} renderer Optional the current renderer, required for action modes 1, 2 and 3.
 * @param {?=} renderParentNode Optionnal the render parent node to be set in all LContainerNodes found,
 * required for action modes 1 and 2.
 * @param {?=} beforeNode Optionnal the node before which elements should be added, required for action
 * modes 1.
 * @return {?}
 */
function walkLNodeTree(startingNode, rootNode, action, renderer, renderParentNode, beforeNode) {
    let /** @type {?} */ node = startingNode;
    while (node) {
        let /** @type {?} */ nextNode = null;
        if (node.tNode.type === 3 /* Element */) {
            // Execute the action
            if (action === 0 /* Find */) {
                return node.native;
            }
            else if (action === 1 /* Insert */) {
                const /** @type {?} */ parent = /** @type {?} */ ((renderParentNode)).native;
                isProceduralRenderer(/** @type {?} */ ((renderer))) ?
                    (/** @type {?} */ (renderer))
                        .insertBefore(/** @type {?} */ ((parent)), /** @type {?} */ ((node.native)), /** @type {?} */ (beforeNode)) : /** @type {?} */ ((parent)).insertBefore(/** @type {?} */ ((node.native)), /** @type {?} */ (beforeNode), true);
            }
            else if (action === 2 /* Detach */) {
                const /** @type {?} */ parent = /** @type {?} */ ((renderParentNode)).native;
                isProceduralRenderer(/** @type {?} */ ((renderer))) ?
                    (/** @type {?} */ (renderer)).removeChild(/** @type {?} */ (parent), /** @type {?} */ ((node.native))) : /** @type {?} */ ((parent)).removeChild(/** @type {?} */ ((node.native)));
            }
            else if (action === 3 /* Destroy */) {
                ngDevMode && ngDevMode.rendererDestroyNode++; /** @type {?} */
                (((/** @type {?} */ (renderer)).destroyNode))(/** @type {?} */ ((node.native)));
            }
            nextNode = getNextLNode(node);
        }
        else if (node.tNode.type === 0 /* Container */) {
            const /** @type {?} */ lContainerNode = (/** @type {?} */ (node));
            const /** @type {?} */ childContainerData = lContainerNode.dynamicLContainerNode ?
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
            nextNode = (/** @type {?} */ (node)).data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(/** @type {?} */ (node));
        }
        node = nextNode === null ? getNextOrParentSiblingNode(node, rootNode) : nextNode;
    }
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
    const /** @type {?} */ parentNode = container.data[RENDER_PARENT];
    const /** @type {?} */ parent = parentNode ? parentNode.native : null;
    if (parent) {
        let /** @type {?} */ node = getChildLNode(rootNode);
        const /** @type {?} */ renderer = container.view[RENDERER];
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
 * @param {?} rootView The view to destroy
 * @return {?}
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    if (rootView[TVIEW].childIndex === -1) {
        return cleanUpView(rootView);
    }
    let /** @type {?} */ viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        let /** @type {?} */ next = null;
        if (viewOrContainer.length >= HEADER_OFFSET) {
            // If LViewData, traverse down to child.
            const /** @type {?} */ view = /** @type {?} */ (viewOrContainer);
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        else {
            // If container, traverse down to its first LViewData.
            const /** @type {?} */ container = /** @type {?} */ (viewOrContainer);
            if (container[VIEWS].length)
                next = container[VIEWS][0].data;
        }
        if (next == null) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (viewOrContainer && !/** @type {?} */ ((viewOrContainer))[NEXT] && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(viewOrContainer || rootView);
            next = viewOrContainer && /** @type {?} */ ((viewOrContainer))[NEXT];
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
    const /** @type {?} */ views = state[VIEWS];
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data[NEXT] = /** @type {?} */ (viewNode.data);
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
    const /** @type {?} */ lView = viewNode.data;
    if (lView[QUERIES]) {
        /** @type {?} */ ((lView[QUERIES])).insertView(index);
    }
    // If the container's renderParent is null, we know that it is a root node of its own parent view
    // and we should wait until that parent processes its nodes (otherwise, we will insert this view's
    // nodes twice - once now and once when its parent inserts its views).
    if (container.data[RENDER_PARENT] !== null) {
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
 * @param {?} container The container from which to detach a view
 * @param {?} removeIndex The index of the view to detach
 * @return {?} The detached view
 */
export function detachView(container, removeIndex) {
    const /** @type {?} */ views = container.data[VIEWS];
    const /** @type {?} */ viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data[NEXT] = /** @type {?} */ (viewNode.data[NEXT]);
    }
    views.splice(removeIndex, 1);
    addRemoveViewFromContainer(container, viewNode, false);
    // Notify query that view has been removed
    const /** @type {?} */ removedLview = viewNode.data;
    if (removedLview[QUERIES]) {
        /** @type {?} */ ((removedLview[QUERIES])).removeView(removeIndex);
    }
    // Unsets the attached flag
    viewNode.data[FLAGS] &= ~8 /* Attached */;
    return viewNode;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param {?} container The container from which to remove a view
 * @param {?} removeIndex The index of the view to remove
 * @return {?} The removed view
 */
export function removeView(container, removeIndex) {
    const /** @type {?} */ viewNode = container.data[VIEWS][removeIndex];
    detachView(container, removeIndex);
    destroyLView(viewNode.data);
    return viewNode;
}
/**
 * Gets the child of the given LViewData
 * @param {?} viewData
 * @return {?}
 */
export function getLViewChild(viewData) {
    if (viewData[TVIEW].childIndex === -1)
        return null;
    const /** @type {?} */ hostNode = viewData[viewData[TVIEW].childIndex];
    return hostNode.data ? hostNode.data : (/** @type {?} */ (hostNode.dynamicLContainerNode)).data;
}
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param {?} view The view to be destroyed.
 * @return {?}
 */
export function destroyLView(view) {
    const /** @type {?} */ renderer = view[RENDERER];
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
 * @param {?} state The LViewOrLContainer for which we need a parent state
 * @param {?} rootView The rootView, so we don't propagate too far up the view tree
 * @return {?} The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    let /** @type {?} */ node;
    if ((node = /** @type {?} */ (((/** @type {?} */ (state))))[HOST_NODE]) && node.tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return /** @type {?} */ (((getParentLNode(node))).data);
    }
    else {
        // otherwise, use parent view for containers or component views
        return state[PARENT] === rootView ? null : state[PARENT];
    }
}
/**
 * Removes all listeners and call all onDestroys in a given view.
 *
 * @param {?} viewOrContainer
 * @return {?}
 */
function cleanUpView(viewOrContainer) {
    if ((/** @type {?} */ (viewOrContainer))[TVIEW]) {
        const /** @type {?} */ view = /** @type {?} */ (viewOrContainer);
        removeListeners(view);
        executeOnDestroys(view);
        executePipeOnDestroys(view);
        // For component views only, the local renderer is destroyed as clean up time.
        if (view[TVIEW].id === -1 && isProceduralRenderer(view[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            (/** @type {?} */ (view[RENDERER])).destroy();
        }
    }
}
/**
 * Removes listeners and unsubscribes from output subscriptions
 * @param {?} viewData
 * @return {?}
 */
function removeListeners(viewData) {
    const /** @type {?} */ cleanup = /** @type {?} */ ((viewData[TVIEW].cleanup));
    if (cleanup != null) {
        for (let /** @type {?} */ i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                // This is a listener with the native renderer
                const /** @type {?} */ native = viewData[cleanup[i + 1]].native;
                const /** @type {?} */ listener = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i + 2]];
                native.removeEventListener(cleanup[i], listener, cleanup[i + 3]);
                i += 2;
            }
            else if (typeof cleanup[i] === 'number') {
                // This is a listener with renderer2 (cleanup fn can be found by index)
                const /** @type {?} */ cleanupFn = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i]];
                cleanupFn();
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                const /** @type {?} */ context = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i + 1]];
                cleanup[i].call(context);
            }
        }
        viewData[CLEANUP] = null;
    }
}
/**
 * Calls onDestroy hooks for this view
 * @param {?} view
 * @return {?}
 */
function executeOnDestroys(view) {
    const /** @type {?} */ tView = view[TVIEW];
    let /** @type {?} */ destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks(/** @type {?} */ ((view[DIRECTIVES])), destroyHooks);
    }
}
/**
 * Calls pipe destroy hooks for this view
 * @param {?} viewData
 * @return {?}
 */
function executePipeOnDestroys(viewData) {
    const /** @type {?} */ pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(/** @type {?} */ ((viewData)), pipeDestroyHooks);
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
        const /** @type {?} */ renderer = currentView[RENDERER];
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
        lContainer[RENDER_PARENT] = currentParent;
        const /** @type {?} */ views = lContainer[VIEWS];
        for (let /** @type {?} */ i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(/** @type {?} */ (node), views[i], true, null);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = currentParent;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsSCxPQUFPLEVBQXdGLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xLLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQXlELG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFtQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzFNLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVqQyx1QkFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBY2hGLDhCQUE4QixJQUFrQixFQUFFLFFBQXNCO0lBQ3RFLHFCQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRTtRQUM5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SUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLGFBQWEsQ0FBQztLQUNoRTtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NMRUFOVVAsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGZvbGxvd2luZyB0aGUgZ2l2ZW4gTE5vZGUgaW4gdGhlIHNhbWUgcGFyZW50IERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIGluc2VydCB0aGUgZ2l2ZW4gbm9kZSB3aXRoIGluc2VydEJlZm9yZS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBmb2xsb3dpbmcgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSBzdG9wTm9kZSBBIHBhcmVudCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgaW4gdGhlIHRyZWUgc2hvdWxkIGJlIHN0b3BwZWQsIG9yIG51bGwgaWYgdGhlXG4gKiBsb29rdXAgc2hvdWxkIG5vdCBiZSBzdG9wcGVkIHVudGlsIHRoZSByZXN1bHQgaXMgZm91bmQuXG4gKiBAcmV0dXJucyBSTm9kZSBiZWZvcmUgd2hpY2ggdGhlIHByb3ZpZGVkIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkIG9yIG51bGwgaWYgdGhlIGxvb2t1cCB3YXNcbiAqIHN0b3BwZWRcbiAqIG9yIGlmIHRoZXJlIGlzIG5vIG5hdGl2ZSBub2RlIGFmdGVyIHRoZSBnaXZlbiBsb2dpY2FsIG5vZGUgaW4gdGhlIHNhbWUgbmF0aXZlIHBhcmVudC5cbiAqL1xuZnVuY3Rpb24gZmluZE5leHRSTm9kZVNpYmxpbmcobm9kZTogTE5vZGUgfCBudWxsLCBzdG9wTm9kZTogTE5vZGUgfCBudWxsKTogUkVsZW1lbnR8UlRleHR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZSAhPT0gc3RvcE5vZGUpIHtcbiAgICBsZXQgcE5leHRPclBhcmVudCA9IGN1cnJlbnROb2RlLnBOZXh0T3JQYXJlbnQ7XG4gICAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAgIHdoaWxlIChwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZU5vZGUgPSBmaW5kRmlyc3RSTm9kZShwTmV4dE9yUGFyZW50KTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBwTmV4dE9yUGFyZW50ID0gcE5leHRPclBhcmVudC5wTmV4dE9yUGFyZW50ICE7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IHBOZXh0T3JQYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICB3aGlsZSAoY3VycmVudFNpYmxpbmcpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgICAgaWYgKG5hdGl2ZU5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF0aXZlTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2libGluZyA9IGdldE5leHRMTm9kZShjdXJyZW50U2libGluZyk7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUoY3VycmVudE5vZGUpO1xuICAgICAgY3VycmVudE5vZGUgPSBudWxsO1xuICAgICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50VHlwZSA9IHBhcmVudE5vZGUudE5vZGUudHlwZTtcbiAgICAgICAgaWYgKHBhcmVudFR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHwgcGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgICBjdXJyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHNpYmxpbmcgbm9kZSBmb3IgdGhlIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIC8vIFZpZXcgbm9kZXMgZG9uJ3QgaGF2ZSBUTm9kZXMsIHNvIHRoZWlyIG5leHQgbXVzdCBiZSByZXRyaWV2ZWQgdGhyb3VnaCB0aGVpciBMVmlldy5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gICAgcmV0dXJuIHZpZXdEYXRhW05FWFRdID8gKHZpZXdEYXRhW05FWFRdIGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG5vZGUudE5vZGUubmV4dCA/IG5vZGUudmlld1tub2RlLnROb2RlLm5leHQgIS5pbmRleF0gOiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBmaXJzdCBjaGlsZCBvZiBhIGdpdmVuIG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGlsZExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmNoaWxkKSB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID8gbm9kZS5kYXRhIGFzIExWaWV3RGF0YSA6IG5vZGUudmlldztcbiAgICByZXR1cm4gdmlld0RhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHBhcmVudCBMTm9kZSBvZiBhIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTFByb2plY3Rpb25Ob2RlKTogTEVsZW1lbnROb2RlfFxuICAgIExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMVmlld05vZGUpOiBMQ29udGFpbmVyTm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuaW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFyZW50ID0gbm9kZS50Tm9kZS5wYXJlbnQ7XG4gIHJldHVybiBwYXJlbnQgPyBub2RlLnZpZXdbcGFyZW50LmluZGV4XSA6IG5vZGUudmlld1tIT1NUX05PREVdO1xufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBuZXh0IHNpYmxpbmcgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGNvbnN0IHBOZXh0T3JQYXJlbnQgPSBub2RlLnBOZXh0T3JQYXJlbnQ7XG5cbiAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAvLyBUaGUgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICBjb25zdCBpc0xhc3RQcm9qZWN0ZWROb2RlID0gcE5leHRPclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbjtcbiAgICAvLyByZXR1cm5zIHBOZXh0T3JQYXJlbnQgaWYgd2UgYXJlIG5vdCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0LCBudWxsIG90aGVyd2lzZVxuICAgIHJldHVybiBpc0xhc3RQcm9qZWN0ZWROb2RlID8gbnVsbCA6IHBOZXh0T3JQYXJlbnQ7XG4gIH1cblxuICAvLyByZXR1cm5zIG5vZGUubmV4dCBiZWNhdXNlIHRoZSB0aGUgbm9kZSBpcyBub3QgcHJvamVjdGVkXG4gIHJldHVybiBnZXROZXh0TE5vZGUobm9kZSk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIElmIHRoZXJlIGlzIG5vIHNpYmxpbmcgbm9kZSwgdGhpcyBmdW5jdGlvbiBnb2VzIHRvIHRoZSBuZXh0IHNpYmxpbmcgb2YgdGhlIHBhcmVudCBub2RlLi4uXG4gKiB1bnRpbCBpdCByZWFjaGVzIHJvb3ROb2RlIChhdCB3aGljaCBwb2ludCBudWxsIGlzIHJldHVybmVkKS5cbiAqXG4gKiBAcGFyYW0gaW5pdGlhbE5vZGUgVGhlIG5vZGUgd2hvc2UgZm9sbG93aW5nIG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgcm9vdCBub2RlIGF0IHdoaWNoIHRoZSBsb29rdXAgc2hvdWxkIHN0b3AuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0T3JQYXJlbnRTaWJsaW5nTm9kZShpbml0aWFsTm9kZTogTE5vZGUsIHJvb3ROb2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGluaXRpYWxOb2RlO1xuICBsZXQgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlKTtcbiAgd2hpbGUgKG5vZGUgJiYgIW5leHROb2RlKSB7XG4gICAgLy8gaWYgbm9kZS5wTmV4dE9yUGFyZW50IGlzIG5vdCBudWxsIGhlcmUsIGl0IGlzIG5vdCB0aGUgbmV4dCBub2RlXG4gICAgLy8gKGJlY2F1c2UsIGF0IHRoaXMgcG9pbnQsIG5leHROb2RlIGlzIG51bGwsIHNvIGl0IGlzIHRoZSBwYXJlbnQpXG4gICAgbm9kZSA9IG5vZGUucE5leHRPclBhcmVudCB8fCBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgICBpZiAobm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBuZXh0Tm9kZSA9IG5vZGUgJiYgZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIH1cbiAgcmV0dXJuIG5leHROb2RlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGluc2lkZSB0aGUgZ2l2ZW4gTE5vZGUuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgZmlyc3QgRE9NIG5vZGUgbXVzdCBiZSBmb3VuZFxuICogQHJldHVybnMgUk5vZGUgVGhlIGZpcnN0IFJOb2RlIG9mIHRoZSBnaXZlbiBMTm9kZSBvciBudWxsIGlmIHRoZXJlIGlzIG5vbmUuXG4gKi9cbmZ1bmN0aW9uIGZpbmRGaXJzdFJOb2RlKHJvb3ROb2RlOiBMTm9kZSk6IFJFbGVtZW50fFJUZXh0fG51bGwge1xuICByZXR1cm4gd2Fsa0xOb2RlVHJlZShyb290Tm9kZSwgcm9vdE5vZGUsIFdhbGtMTm9kZVRyZWVBY3Rpb24uRmluZCkgfHwgbnVsbDtcbn1cblxuY29uc3QgZW51bSBXYWxrTE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIHJldHVybnMgdGhlIGZpcnN0IGF2YWlsYWJsZSBuYXRpdmUgbm9kZSAqL1xuICBGaW5kID0gMCxcblxuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAxLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMixcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDMsXG59XG5cbi8qKlxuICogV2Fsa3MgYSB0cmVlIG9mIExOb2RlcywgYXBwbHlpbmcgYSB0cmFuc2Zvcm1hdGlvbiBvbiB0aGUgTEVsZW1lbnQgbm9kZXMsIGVpdGhlciBvbmx5IG9uIHRoZSBmaXJzdFxuICogb25lIGZvdW5kLCBvciBvbiBhbGwgb2YgdGhlbS5cbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqXG4gKiBAcGFyYW0gc3RhcnRpbmdOb2RlIHRoZSBub2RlIGZyb20gd2hpY2ggdGhlIHdhbGsgaXMgc3RhcnRlZC5cbiAqIEBwYXJhbSByb290Tm9kZSB0aGUgcm9vdCBub2RlIGNvbnNpZGVyZWQuXG4gKiBAcGFyYW0gYWN0aW9uIElkZW50aWZpZXMgdGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb24gdGhlIExFbGVtZW50IG5vZGVzLlxuICogQHBhcmFtIHJlbmRlcmVyIE9wdGlvbmFsIHRoZSBjdXJyZW50IHJlbmRlcmVyLCByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIDEsIDIgYW5kIDMuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50Tm9kZSBPcHRpb25uYWwgdGhlIHJlbmRlciBwYXJlbnQgbm9kZSB0byBiZSBzZXQgaW4gYWxsIExDb250YWluZXJOb2RlcyBmb3VuZCxcbiAqIHJlcXVpcmVkIGZvciBhY3Rpb24gbW9kZXMgMSBhbmQgMi5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbm5hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBtb2RlcyAxLlxuICovXG5mdW5jdGlvbiB3YWxrTE5vZGVUcmVlKFxuICAgIHN0YXJ0aW5nTm9kZTogTE5vZGUgfCBudWxsLCByb290Tm9kZTogTE5vZGUsIGFjdGlvbjogV2Fsa0xOb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI/OiBSZW5kZXJlcjMsXG4gICAgcmVuZGVyUGFyZW50Tm9kZT86IExFbGVtZW50Tm9kZSB8IG51bGwsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBzdGFydGluZ05vZGU7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uXG4gICAgICBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkZpbmQpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUubmF0aXZlO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uSW5zZXJ0KSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgIS5uYXRpdmU7XG4gICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgIC5pbnNlcnRCZWZvcmUocGFyZW50ICEsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgICAgICBwYXJlbnQgIS5pbnNlcnRCZWZvcmUobm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwsIHRydWUpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHJlbmRlclBhcmVudE5vZGUgIS5uYXRpdmU7XG4gICAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5yZW1vdmVDaGlsZChwYXJlbnQgYXMgUkVsZW1lbnQsIG5vZGUubmF0aXZlICEpIDpcbiAgICAgICAgICAgIHBhcmVudCAhLnJlbW92ZUNoaWxkKG5vZGUubmF0aXZlICEpO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZS5uYXRpdmUgISk7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZShub2RlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIGlmIChyZW5kZXJQYXJlbnROb2RlKSB7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudE5vZGU7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXS5sZW5ndGggPyBnZXRDaGlsZExOb2RlKGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU11bMF0pIDogbnVsbDtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIEZvciBQcm9qZWN0aW9uIGxvb2sgYXQgdGhlIGZpcnN0IHByb2plY3RlZCBub2RlXG4gICAgICBuZXh0Tm9kZSA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UgbG9vayBhdCB0aGUgZmlyc3QgY2hpbGRcbiAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSk7XG4gICAgfVxuXG4gICAgbm9kZSA9IG5leHROb2RlID09PSBudWxsID8gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUobm9kZSwgcm9vdE5vZGUpIDogbmV4dE5vZGU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0aGUgcm9vdCB2aWV3IGJlbG9uZ3NcbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiB0cnVlLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGJvb2xlYW4sXG4gICAgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHJvb3ROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgaWYgKHBhcmVudCkge1xuICAgIGxldCBub2RlOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShyb290Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlld1tSRU5ERVJFUl07XG4gICAgd2Fsa0xOb2RlVHJlZShcbiAgICAgICAgbm9kZSwgcm9vdE5vZGUsIGluc2VydE1vZGUgPyBXYWxrTE5vZGVUcmVlQWN0aW9uLkluc2VydCA6IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoLFxuICAgICAgICByZW5kZXJlciwgcGFyZW50Tm9kZSwgYmVmb3JlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBnZXRMVmlld0NoaWxkKHJvb3RWaWV3KTtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci5sZW5ndGggPj0gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gSWYgTFZpZXdEYXRhLCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgICBpZiAodmlld1tUVklFV10uY2hpbGRJbmRleCA+IC0xKSBuZXh0ID0gZ2V0TFZpZXdDaGlsZCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlld0RhdGEuXG4gICAgICBjb25zdCBjb250YWluZXIgPSB2aWV3T3JDb250YWluZXIgYXMgTENvbnRhaW5lcjtcbiAgICAgIGlmIChjb250YWluZXJbVklFV1NdLmxlbmd0aCkgbmV4dCA9IGNvbnRhaW5lcltWSUVXU11bMF0uZGF0YTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICFbTkVYVF0gJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIHZpZXdOb2RlIFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEByZXR1cm5zIFRoZSBpbnNlcnRlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHZpZXdOb2RlOiBMVmlld05vZGUsIGluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRhaW5lci5kYXRhO1xuICBjb25zdCB2aWV3cyA9IHN0YXRlW1ZJRVdTXTtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXS5kYXRhW05FWFRdID0gdmlld05vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICB2aWV3Tm9kZS5kYXRhW05FWFRdID0gdmlld3NbaW5kZXhdLmRhdGE7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaCh2aWV3Tm9kZSk7XG4gICAgdmlld05vZGUuZGF0YVtORVhUXSA9IG51bGw7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxWaWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgbFZpZXdbUVVFUklFU10gIS5pbnNlcnRWaWV3KGluZGV4KTtcbiAgfVxuXG4gIC8vIElmIHRoZSBjb250YWluZXIncyByZW5kZXJQYXJlbnQgaXMgbnVsbCwgd2Uga25vdyB0aGF0IGl0IGlzIGEgcm9vdCBub2RlIG9mIGl0cyBvd24gcGFyZW50IHZpZXdcbiAgLy8gYW5kIHdlIHNob3VsZCB3YWl0IHVudGlsIHRoYXQgcGFyZW50IHByb2Nlc3NlcyBpdHMgbm9kZXMgKG90aGVyd2lzZSwgd2Ugd2lsbCBpbnNlcnQgdGhpcyB2aWV3J3NcbiAgLy8gbm9kZXMgdHdpY2UgLSBvbmNlIG5vdyBhbmQgb25jZSB3aGVuIGl0cyBwYXJlbnQgaW5zZXJ0cyBpdHMgdmlld3MpLlxuICBpZiAoY29udGFpbmVyLmRhdGFbUkVOREVSX1BBUkVOVF0gIT09IG51bGwpIHtcbiAgICBsZXQgYmVmb3JlTm9kZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKHZpZXdOb2RlLCBjb250YWluZXIpO1xuXG4gICAgaWYgKCFiZWZvcmVOb2RlKSB7XG4gICAgICBsZXQgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlO1xuICAgICAgaWYgKGNvbnRhaW5lck5leHROYXRpdmVOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlID0gZmluZE5leHRSTm9kZVNpYmxpbmcoY29udGFpbmVyLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGJlZm9yZU5vZGUgPSBjb250YWluZXJOZXh0TmF0aXZlTm9kZTtcbiAgICB9XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIHZpZXdOb2RlLmRhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHNwbGljZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBUaGUgZGV0YWNoZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhjb250YWluZXI6IExDb250YWluZXJOb2RlLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXdOb2RlIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gIGNvbnN0IHZpZXdOb2RlID0gdmlld3NbcmVtb3ZlSW5kZXhdO1xuICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgdmlld3NbcmVtb3ZlSW5kZXggLSAxXS5kYXRhW05FWFRdID0gdmlld05vZGUuZGF0YVtORVhUXSBhcyBMVmlld0RhdGE7XG4gIH1cbiAgdmlld3Muc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgY29uc3QgcmVtb3ZlZEx2aWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKHJlbW92ZWRMdmlld1tRVUVSSUVTXSkge1xuICAgIHJlbW92ZWRMdmlld1tRVUVSSUVTXSAhLnJlbW92ZVZpZXcocmVtb3ZlSW5kZXgpO1xuICB9XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3Tm9kZS5kYXRhW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqIEByZXR1cm5zIFRoZSByZW1vdmVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdOb2RlID0gY29udGFpbmVyLmRhdGFbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhjb250YWluZXIsIHJlbW92ZUluZGV4KTtcbiAgZGVzdHJveUxWaWV3KHZpZXdOb2RlLmRhdGEpO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXdEYXRhICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZCh2aWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCB7XG4gIGlmICh2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGhvc3ROb2RlOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGUgPSB2aWV3RGF0YVt2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleF07XG5cbiAgcmV0dXJuIGhvc3ROb2RlLmRhdGEgPyBob3N0Tm9kZS5kYXRhIDogKGhvc3ROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIHdhbGtMTm9kZVRyZWUodmlld1tIT1NUX05PREVdLCB2aWV3W0hPU1RfTk9ERV0sIFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIpO1xuICB9XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgLy8gU2V0cyB0aGUgZGVzdHJveWVkIGZsYWdcbiAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhfFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXdEYXRhKSAhW0hPU1RfTk9ERV0pICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldFBhcmVudExOb2RlKG5vZGUpICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlld0RhdGEgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YSlbVFZJRVddKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAodmlld1tUVklFV10uaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3RGF0YVtUVklFV10uY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHZpZXdEYXRhW2NsZWFudXBbaSArIDFdXS5uYXRpdmU7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIG5hdGl2ZS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGxpc3RlbmVyLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDFdXTtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3RGF0YVtDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3W0RJUkVDVElWRVNdICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlld0RhdGFbVFZJRVddICYmIHZpZXdEYXRhW1RWSUVXXS5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3RGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IHNob3VsZCBiZSBpbnNlcnRlZCBpbiB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZSBuYXRpdmUgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgd2hlbiBpdHMgcGFyZW50IGlzOlxuICogLSBBIHJlZ3VsYXIgZWxlbWVudCA9PiBZZXNcbiAqIC0gQSBjb21wb25lbnQgaG9zdCBlbGVtZW50ID0+XG4gKiAgICAtIGlmIHRoZSBgY3VycmVudFZpZXdgID09PSB0aGUgcGFyZW50IGB2aWV3YDogVGhlIGVsZW1lbnQgaXMgaW4gdGhlIGNvbnRlbnQgKHZzIHRoZVxuICogICAgICB0ZW1wbGF0ZSlcbiAqICAgICAgPT4gZG9uJ3QgYWRkIGFzIHRoZSBwYXJlbnQgY29tcG9uZW50IHdpbGwgcHJvamVjdCBpZiBuZWVkZWQuXG4gKiAgICAtIGBjdXJyZW50Vmlld2AgIT09IHRoZSBwYXJlbnQgYHZpZXdgID0+IFRoZSBlbGVtZW50IGlzIGluIHRoZSB0ZW1wbGF0ZSAodnMgdGhlIGNvbnRlbnQpLFxuICogICAgICBhZGQgaXRcbiAqIC0gVmlldyBlbGVtZW50ID0+IGRlbGF5IGluc2VydGlvbiwgd2lsbCBiZSBkb25lIG9uIGB2aWV3RW5kKClgXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IGluIHdoaWNoIHRvIGluc2VydCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudDogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50SXNFbGVtZW50ID0gcGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50O1xuXG4gIHJldHVybiBwYXJlbnRJc0VsZW1lbnQgJiZcbiAgICAgIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcgfHwgcGFyZW50LmRhdGEgPT09IG51bGwgLyogUmVndWxhciBFbGVtZW50LiAqLyk7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSBhZGQgZWxlbWVudCBpZiBub3QgaW4gVmlldyBvciBub3QgcHJvamVjdGVkLlxuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudC5uYXRpdmUgIWFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGN1cnJlbnRQYXJlbnQgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudDogTEVsZW1lbnROb2RlLFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgaWYgKG5vZGUudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIChub2RlIGFzIExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSkubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIENvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBFbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ25lZSB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IGN1cnJlbnRQYXJlbnQ7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbnVsbCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSBjdXJyZW50UGFyZW50O1xuICB9XG59XG4iXX0=