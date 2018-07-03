/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
import { CLEANUP, CONTAINER_INDEX, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { stringify } from './util';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Retrieves the sibling node for the given node.
 * @param {?} node
 * @return {?}
 */
export function getNextLNode(node) {
    // View nodes don't have TNodes, so their next must be retrieved through their LView.
    if (node.tNode.type === 2 /* View */) {
        /** @type {?} */
        const viewData = /** @type {?} */ (node.data);
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
        /** @type {?} */
        const viewData = node.tNode.type === 2 /* View */ ? /** @type {?} */ (node.data) : node.view;
        return viewData[node.tNode.child.index];
    }
    return null;
}
/**
 * @param {?} node
 * @return {?}
 */
export function getParentLNode(node) {
    if (node.tNode.index === -1 && node.tNode.type === 2 /* View */) {
        /** @type {?} */
        const containerHostIndex = (/** @type {?} */ (node.data))[CONTAINER_INDEX];
        return containerHostIndex === -1 ? null : node.view[containerHostIndex].dynamicLContainerNode;
    }
    /** @type {?} */
    const parent = node.tNode.parent;
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
    /** @type {?} */
    const pNextOrParent = node.pNextOrParent;
    if (pNextOrParent) {
        /** @type {?} */
        const isLastProjectedNode = pNextOrParent.tNode.type === 1 /* Projection */;
        // returns pNextOrParent if we are not at the end of the list, null otherwise
        return isLastProjectedNode ? null : pNextOrParent;
    }
    // returns node.next because the the node is not projected
    return getNextLNode(node);
}
/** @enum {number} */
const WalkLNodeTreeAction = {
    /** node insert in the native environment */
    Insert: 0,
    /** node detach from the native environment */
    Detach: 1,
    /** node destruction using the renderer's API */
    Destroy: 2,
};
/**
 * Walks a tree of LNodes, applying a transformation on the LElement nodes, either only on the first
 * one found, or on all of them.
 *
 * @param {?} startingNode the node from which the walk is started.
 * @param {?} rootNode the root node considered.
 * @param {?} action identifies the action to be performed on the LElement nodes.
 * @param {?} renderer the current renderer.
 * @param {?=} renderParentNode Optional the render parent node to be set in all LContainerNodes found,
 * required for action modes Insert and Destroy.
 * @param {?=} beforeNode Optional the node before which elements should be added, required for action
 * Insert.
 * @return {?}
 */
function walkLNodeTree(startingNode, rootNode, action, renderer, renderParentNode, beforeNode) {
    /** @type {?} */
    let node = startingNode;
    while (node) {
        /** @type {?} */
        let nextNode = null;
        /** @type {?} */
        const parent = renderParentNode ? renderParentNode.native : null;
        if (node.tNode.type === 3 /* Element */) {
            // Execute the action
            executeNodeAction(action, renderer, parent, /** @type {?} */ ((node.native)), beforeNode);
            if (node.dynamicLContainerNode) {
                executeNodeAction(action, renderer, parent, /** @type {?} */ ((node.dynamicLContainerNode.native)), beforeNode);
            }
            nextNode = getNextLNode(node);
        }
        else if (node.tNode.type === 0 /* Container */) {
            executeNodeAction(action, renderer, parent, /** @type {?} */ ((node.native)), beforeNode);
            /** @type {?} */
            const lContainerNode = (/** @type {?} */ (node));
            /** @type {?} */
            const childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            if (renderParentNode) {
                childContainerData[RENDER_PARENT] = renderParentNode;
            }
            nextNode =
                childContainerData[VIEWS].length ? getChildLNode(childContainerData[VIEWS][0]) : null;
            if (nextNode) {
                // When the walker enters a container, then the beforeNode has to become the local native
                // comment node.
                beforeNode = lContainerNode.dynamicLContainerNode ?
                    lContainerNode.dynamicLContainerNode.native :
                    lContainerNode.native;
            }
        }
        else if (node.tNode.type === 1 /* Projection */) {
            // For Projection look at the first projected node
            nextNode = (/** @type {?} */ (node)).data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(/** @type {?} */ (node));
        }
        if (nextNode == null) {
            /** *
             * Find the next node in the LNode tree, taking into account the place where a node is
             * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
             *
             * If there is no sibling node, then it goes to the next sibling of the parent node...
             * until it reaches rootNode (at which point null is returned).
              @type {?} */
            let currentNode = node;
            node = getNextLNodeWithProjection(currentNode);
            while (currentNode && !node) {
                // if node.pNextOrParent is not null here, it is not the next node
                // (because, at this point, nextNode is null, so it is the parent)
                currentNode = currentNode.pNextOrParent || getParentLNode(currentNode);
                if (currentNode === rootNode) {
                    return null;
                }
                // When the walker exits a container, the beforeNode has to be restored to the previous
                // value.
                if (currentNode && !currentNode.pNextOrParent &&
                    currentNode.tNode.type === 0 /* Container */) {
                    beforeNode = currentNode.native;
                }
                node = currentNode && getNextLNodeWithProjection(currentNode);
            }
        }
        else {
            node = nextNode;
        }
    }
}
/**
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 * @param {?} action
 * @param {?} renderer
 * @param {?} parent
 * @param {?} node
 * @param {?=} beforeNode
 * @return {?}
 */
function executeNodeAction(action, renderer, parent, node, beforeNode) {
    if (action === 0 /* Insert */) {
        isProceduralRenderer(/** @type {?} */ ((renderer))) ?
            (/** @type {?} */ (renderer)).insertBefore(/** @type {?} */ ((parent)), node, /** @type {?} */ (beforeNode)) : /** @type {?} */ ((parent)).insertBefore(node, /** @type {?} */ (beforeNode), true);
    }
    else if (action === 1 /* Detach */) {
        isProceduralRenderer(/** @type {?} */ ((renderer))) ?
            (/** @type {?} */ (renderer)).removeChild(/** @type {?} */ ((parent)), node) : /** @type {?} */ ((parent)).removeChild(node);
    }
    else if (action === 2 /* Destroy */) {
        ngDevMode && ngDevMode.rendererDestroyNode++; /** @type {?} */
        (((/** @type {?} */ (renderer)).destroyNode))(node);
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
    /** @type {?} */
    const parentNode = container.data[RENDER_PARENT];
    /** @type {?} */
    const parent = parentNode ? parentNode.native : null;
    if (parent) {
        /** @type {?} */
        let node = getChildLNode(rootNode);
        /** @type {?} */
        const renderer = container.view[RENDERER];
        walkLNodeTree(node, rootNode, insertMode ? 0 /* Insert */ : 1 /* Detach */, renderer, parentNode, beforeNode);
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
    /** @type {?} */
    let viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        /** @type {?} */
        let next = null;
        if (viewOrContainer.length >= HEADER_OFFSET) {
            /** @type {?} */
            const view = /** @type {?} */ (viewOrContainer);
            if (view[TVIEW].childIndex > -1)
                next = getLViewChild(view);
        }
        else {
            /** @type {?} */
            const container = /** @type {?} */ (viewOrContainer);
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
    /** @type {?} */
    const state = container.data;
    /** @type {?} */
    const views = state[VIEWS];
    /** @type {?} */
    const lView = /** @type {?} */ (viewNode.data);
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data[NEXT] = lView;
    }
    if (index < views.length) {
        lView[NEXT] = views[index].data;
        views.splice(index, 0, viewNode);
    }
    else {
        views.push(viewNode);
        lView[NEXT] = null;
    }
    // Dynamically inserted views need a reference to their parent container'S host so it's
    // possible to jump from a view to its container's next when walking the node tree.
    if (viewNode.tNode.index === -1) {
        lView[CONTAINER_INDEX] = /** @type {?} */ ((container.tNode.parent)).index;
        (/** @type {?} */ (viewNode)).view = container.view;
    }
    // Notify query that a new view has been added
    if (lView[QUERIES]) {
        /** @type {?} */ ((lView[QUERIES])).insertView(index);
    }
    // Sets the attached flag
    lView[FLAGS] |= 8 /* Attached */;
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
    /** @type {?} */
    const views = container.data[VIEWS];
    /** @type {?} */
    const viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data[NEXT] = /** @type {?} */ (viewNode.data[NEXT]);
    }
    views.splice(removeIndex, 1);
    if (!container.tNode.detached) {
        addRemoveViewFromContainer(container, viewNode, false);
    }
    /** @type {?} */
    const removedLView = viewNode.data;
    if (removedLView[QUERIES]) {
        /** @type {?} */ ((removedLView[QUERIES])).removeView();
    }
    removedLView[CONTAINER_INDEX] = -1;
    (/** @type {?} */ (viewNode)).view = null;
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
    /** @type {?} */
    const viewNode = container.data[VIEWS][removeIndex];
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
    /** @type {?} */
    const hostNode = viewData[viewData[TVIEW].childIndex];
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
    /** @type {?} */
    const renderer = view[RENDERER];
    if (isProceduralRenderer(renderer) && renderer.destroyNode) {
        walkLNodeTree(view[HOST_NODE], view[HOST_NODE], 2 /* Destroy */, renderer);
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
    /** @type {?} */
    let node;
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
        /** @type {?} */
        const view = /** @type {?} */ (viewOrContainer);
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
    /** @type {?} */
    const cleanup = /** @type {?} */ ((viewData[TVIEW].cleanup));
    if (cleanup != null) {
        for (let i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                /** @type {?} */
                const native = viewData[cleanup[i + 1]].native;
                /** @type {?} */
                const listener = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i + 2]];
                native.removeEventListener(cleanup[i], listener, cleanup[i + 3]);
                i += 2;
            }
            else if (typeof cleanup[i] === 'number') {
                /** @type {?} */
                const cleanupFn = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i]];
                cleanupFn();
            }
            else {
                /** @type {?} */
                const context = /** @type {?} */ ((viewData[CLEANUP]))[cleanup[i + 1]];
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
    /** @type {?} */
    const tView = view[TVIEW];
    /** @type {?} */
    let destroyHooks;
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
    /** @type {?} */
    const pipeDestroyHooks = viewData[TVIEW] && viewData[TVIEW].pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks(/** @type {?} */ ((viewData)), pipeDestroyHooks);
    }
}
/**
 * Returns whether a native element can be inserted into the given parent.
 *
 * There are two reasons why we may not be able to insert a element immediately.
 * - Projection: When creating a child content element of a component, we have to skip the
 *   insertion because the content of a component will be projected.
 *   `<component><content>delayed due to projection</content></component>`
 * - Parent container is disconnected: This can happen when we are inserting a view into
 *   parent container, which itself is disconnected. For example the parent container is part
 *   of a View which has not be inserted or is mare for projection but has not been inserted
 *   into destination.
 *
 *
 * @param {?} parent The parent where the child will be inserted into.
 * @param {?} currentView Current LView being processed.
 * @return {?} boolean Whether the child should be inserted now (or delayed until later).
 */
export function canInsertNativeNode(parent, currentView) {
    // We can only insert into a Component or View. Any other type should be an Error.
    ngDevMode && assertNodeOfPossibleTypes(parent, 3 /* Element */, 2 /* View */);
    if (parent.tNode.type === 3 /* Element */) {
        // Parent is an element.
        if (parent.view !== currentView) {
            // If the Parent view is not the same as current view than we are inserting across
            // Views. This happens when we insert a root element of the component view into
            // the component host element and it should always be eager.
            return true;
        }
        // Parent elements can be a component which may have projection.
        if (parent.data === null) {
            // Parent is a regular non-component element. We should eagerly insert into it
            // since we know that this relationship will never be broken.
            return true;
        }
        else {
            // Parent is a Component. Component's content nodes are not inserted immediately
            // because they will be projected, and so doing insert at this point would be wasteful.
            // Since the projection would than move it to its final destination.
            return false;
        }
    }
    else {
        // Parent is a View.
        ngDevMode && assertNodeType(parent, 2 /* View */);
        /** @type {?} */
        const grandParentContainer = /** @type {?} */ (getParentLNode(parent));
        if (grandParentContainer == null) {
            // The `View` is not inserted into a `Container` we have to delay insertion.
            return false;
        }
        ngDevMode && assertNodeType(grandParentContainer, 0 /* Container */);
        if (grandParentContainer.data[RENDER_PARENT] == null) {
            // The parent `Container` itself is disconnected. So we have to delay.
            return false;
        }
        else {
            // The parent `Container` is in inserted state, so we can eagerly insert into
            // this location.
            return true;
        }
    }
}
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}.
 *
 * @param {?} parent The parent to which to append the child
 * @param {?} child The child that should be appended
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        if (parent.tNode.type === 2 /* View */) {
            /** @type {?} */
            const container = /** @type {?} */ (getParentLNode(parent));
            /** @type {?} */
            const renderParent = container.data[RENDER_PARENT];
            /** @type {?} */
            const views = container.data[VIEWS];
            /** @type {?} */
            const index = views.indexOf(/** @type {?} */ (parent));
            /** @type {?} */
            const beforeNode = index + 1 < views.length ? (/** @type {?} */ ((getChildLNode(views[index + 1])))).native : container.native;
            isProceduralRenderer(renderer) ?
                renderer.insertBefore(/** @type {?} */ ((renderParent)).native, child, beforeNode) : /** @type {?} */ ((renderParent)).native.insertBefore(child, beforeNode, true);
        }
        else {
            isProceduralRenderer(renderer) ? renderer.appendChild(/** @type {?} */ (((parent.native))), child) : /** @type {?} */ ((parent.native)).appendChild(child);
        }
        return true;
    }
    return false;
}
/**
 * Removes the `child` element of the `parent` from the DOM.
 *
 * @param {?} parent The parent from which to remove the child
 * @param {?} child The child that should be removed
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was removed
 */
export function removeChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.removeChild(/** @type {?} */ (parent.native), child) : /** @type {?} */ ((parent.native)).removeChild(child);
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
 * @param {?} renderParent
 * @return {?}
 */
export function appendProjectedNode(node, currentParent, currentView, renderParent) {
    appendChild(currentParent, node.native, currentView);
    if (node.tNode.type === 0 /* Container */) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (node)).data;
        lContainer[RENDER_PARENT] = renderParent;
        /** @type {?} */
        const views = lContainer[VIEWS];
        for (let i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(/** @type {?} */ (node), views[i], true, node.native);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(currentParent, node.dynamicLContainerNode.native, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsSCxPQUFPLEVBQXdGLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xLLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQW1FLG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzTixPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRWpDLE1BQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7O0FBR2hGLE1BQU0sdUJBQXVCLElBQVc7O0lBRXRDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixFQUFFOztRQUN0QyxNQUFNLFFBQVEscUJB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SSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNqRjtLQUNGO0lBQ0QsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDOUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxZQUFZLENBQUM7UUFDOUQsV0FBVyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQzVFO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y2FsbEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7TENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgRElSRUNUSVZFUywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgSG9va0RhdGEsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHNpYmxpbmcgbm9kZSBmb3IgdGhlIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmV4dExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIC8vIFZpZXcgbm9kZXMgZG9uJ3QgaGF2ZSBUTm9kZXMsIHNvIHRoZWlyIG5leHQgbXVzdCBiZSByZXRyaWV2ZWQgdGhyb3VnaCB0aGVpciBMVmlldy5cbiAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gICAgcmV0dXJuIHZpZXdEYXRhW05FWFRdID8gKHZpZXdEYXRhW05FWFRdIGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG5vZGUudE5vZGUubmV4dCA/IG5vZGUudmlld1tub2RlLnROb2RlLm5leHQgIS5pbmRleF0gOiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBmaXJzdCBjaGlsZCBvZiBhIGdpdmVuIG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGlsZExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmNoaWxkKSB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID8gbm9kZS5kYXRhIGFzIExWaWV3RGF0YSA6IG5vZGUudmlldztcbiAgICByZXR1cm4gdmlld0RhdGFbbm9kZS50Tm9kZS5jaGlsZC5pbmRleF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBSZXRyaWV2ZXMgdGhlIHBhcmVudCBMTm9kZSBvZiBhIGdpdmVuIG5vZGUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTENvbnRhaW5lck5vZGUgfCBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMUHJvamVjdGlvbk5vZGUpOlxuICAgIExFbGVtZW50Tm9kZXxMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTFZpZXdOb2RlKTogTENvbnRhaW5lck5vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZXxMVmlld05vZGV8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMTm9kZSk6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZXxMVmlld05vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmluZGV4ID09PSAtMSAmJiBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBJZiB0aGUgaG9zdCBpbmRleCBpcyAtMSwgdGhlIHZpZXcgaGFzIG5vdCB5ZXQgYmVlbiBpbnNlcnRlZCwgc28gaXQgaGFzIG5vIHBhcmVudC5cbiAgICBjb25zdCBjb250YWluZXJIb3N0SW5kZXggPSAobm9kZS5kYXRhIGFzIExWaWV3RGF0YSlbQ09OVEFJTkVSX0lOREVYXTtcbiAgICByZXR1cm4gY29udGFpbmVySG9zdEluZGV4ID09PSAtMSA/IG51bGwgOiBub2RlLnZpZXdbY29udGFpbmVySG9zdEluZGV4XS5keW5hbWljTENvbnRhaW5lck5vZGU7XG4gIH1cbiAgY29uc3QgcGFyZW50ID0gbm9kZS50Tm9kZS5wYXJlbnQ7XG4gIHJldHVybiBwYXJlbnQgPyBub2RlLnZpZXdbcGFyZW50LmluZGV4XSA6IG5vZGUudmlld1tIT1NUX05PREVdO1xufVxuXG4vKipcbiAqIEdldCB0aGUgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlLCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBwbGFjZSB3aGVyZSBhIG5vZGUgaXNcbiAqIHByb2plY3RlZCAoaW4gdGhlIHNoYWRvdyBET00pIHJhdGhlciB0aGFuIHdoZXJlIGl0IGNvbWVzIGZyb20gKGluIHRoZSBsaWdodCBET00pLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSBtdXN0IGJlIGZvdW5kLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBuZXh0IHNpYmxpbmcgaW4gdGhlIExOb2RlIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGNvbnN0IHBOZXh0T3JQYXJlbnQgPSBub2RlLnBOZXh0T3JQYXJlbnQ7XG5cbiAgaWYgKHBOZXh0T3JQYXJlbnQpIHtcbiAgICAvLyBUaGUgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICBjb25zdCBpc0xhc3RQcm9qZWN0ZWROb2RlID0gcE5leHRPclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbjtcbiAgICAvLyByZXR1cm5zIHBOZXh0T3JQYXJlbnQgaWYgd2UgYXJlIG5vdCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0LCBudWxsIG90aGVyd2lzZVxuICAgIHJldHVybiBpc0xhc3RQcm9qZWN0ZWROb2RlID8gbnVsbCA6IHBOZXh0T3JQYXJlbnQ7XG4gIH1cblxuICAvLyByZXR1cm5zIG5vZGUubmV4dCBiZWNhdXNlIHRoZSB0aGUgbm9kZSBpcyBub3QgcHJvamVjdGVkXG4gIHJldHVybiBnZXROZXh0TE5vZGUobm9kZSk7XG59XG5cbmNvbnN0IGVudW0gV2Fsa0xOb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIEluc2VydCA9IDAsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAxLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMixcbn1cblxuLyoqXG4gKiBXYWxrcyBhIHRyZWUgb2YgTE5vZGVzLCBhcHBseWluZyBhIHRyYW5zZm9ybWF0aW9uIG9uIHRoZSBMRWxlbWVudCBub2RlcywgZWl0aGVyIG9ubHkgb24gdGhlIGZpcnN0XG4gKiBvbmUgZm91bmQsIG9yIG9uIGFsbCBvZiB0aGVtLlxuICpcbiAqIEBwYXJhbSBzdGFydGluZ05vZGUgdGhlIG5vZGUgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkLlxuICogQHBhcmFtIHJvb3ROb2RlIHRoZSByb290IG5vZGUgY29uc2lkZXJlZC5cbiAqIEBwYXJhbSBhY3Rpb24gaWRlbnRpZmllcyB0aGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgTEVsZW1lbnQgbm9kZXMuXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIGN1cnJlbnQgcmVuZGVyZXIuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50Tm9kZSBPcHRpb25hbCB0aGUgcmVuZGVyIHBhcmVudCBub2RlIHRvIGJlIHNldCBpbiBhbGwgTENvbnRhaW5lck5vZGVzIGZvdW5kLFxuICogcmVxdWlyZWQgZm9yIGFjdGlvbiBtb2RlcyBJbnNlcnQgYW5kIERlc3Ryb3kuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBPcHRpb25hbCB0aGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCByZXF1aXJlZCBmb3IgYWN0aW9uXG4gKiBJbnNlcnQuXG4gKi9cbmZ1bmN0aW9uIHdhbGtMTm9kZVRyZWUoXG4gICAgc3RhcnRpbmdOb2RlOiBMTm9kZSB8IG51bGwsIHJvb3ROb2RlOiBMTm9kZSwgYWN0aW9uOiBXYWxrTE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHJlbmRlclBhcmVudE5vZGU/OiBMRWxlbWVudE5vZGUgfCBudWxsLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKSB7XG4gIGxldCBub2RlOiBMTm9kZXxudWxsID0gc3RhcnRpbmdOb2RlO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGxldCBuZXh0Tm9kZTogTE5vZGV8bnVsbCA9IG51bGw7XG4gICAgY29uc3QgcGFyZW50ID0gcmVuZGVyUGFyZW50Tm9kZSA/IHJlbmRlclBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uXG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgaWYgKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKFxuICAgICAgICAgICAgYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9IGdldE5leHRMTm9kZShub2RlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oYWN0aW9uLCByZW5kZXJlciwgcGFyZW50LCBub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IChub2RlIGFzIExDb250YWluZXJOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBpZiAocmVuZGVyUGFyZW50Tm9kZSkge1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGFbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnROb2RlO1xuICAgICAgfVxuICAgICAgbmV4dE5vZGUgPVxuICAgICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU10ubGVuZ3RoID8gZ2V0Q2hpbGRMTm9kZShjaGlsZENvbnRhaW5lckRhdGFbVklFV1NdWzBdKSA6IG51bGw7XG4gICAgICBpZiAobmV4dE5vZGUpIHtcbiAgICAgICAgLy8gV2hlbiB0aGUgd2Fsa2VyIGVudGVycyBhIGNvbnRhaW5lciwgdGhlbiB0aGUgYmVmb3JlTm9kZSBoYXMgdG8gYmVjb21lIHRoZSBsb2NhbCBuYXRpdmVcbiAgICAgICAgLy8gY29tbWVudCBub2RlLlxuICAgICAgICBiZWZvcmVOb2RlID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgOlxuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUubmF0aXZlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gRm9yIFByb2plY3Rpb24gbG9vayBhdCB0aGUgZmlyc3QgcHJvamVjdGVkIG5vZGVcbiAgICAgIG5leHROb2RlID0gKG5vZGUgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhLmhlYWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBsb29rIGF0IHRoZSBmaXJzdCBjaGlsZFxuICAgICAgbmV4dE5vZGUgPSBnZXRDaGlsZExOb2RlKG5vZGUgYXMgTFZpZXdOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAobmV4dE5vZGUgPT0gbnVsbCkge1xuICAgICAgLyoqXG4gICAgICAgKiBGaW5kIHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICAgICAgICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gICAgICAgKlxuICAgICAgICogSWYgdGhlcmUgaXMgbm8gc2libGluZyBub2RlLCB0aGVuIGl0IGdvZXMgdG8gdGhlIG5leHQgc2libGluZyBvZiB0aGUgcGFyZW50IG5vZGUuLi5cbiAgICAgICAqIHVudGlsIGl0IHJlYWNoZXMgcm9vdE5vZGUgKGF0IHdoaWNoIHBvaW50IG51bGwgaXMgcmV0dXJuZWQpLlxuICAgICAgICovXG4gICAgICBsZXQgY3VycmVudE5vZGU6IExOb2RlfG51bGwgPSBub2RlO1xuICAgICAgbm9kZSA9IGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKGN1cnJlbnROb2RlKTtcbiAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiAhbm9kZSkge1xuICAgICAgICAvLyBpZiBub2RlLnBOZXh0T3JQYXJlbnQgaXMgbm90IG51bGwgaGVyZSwgaXQgaXMgbm90IHRoZSBuZXh0IG5vZGVcbiAgICAgICAgLy8gKGJlY2F1c2UsIGF0IHRoaXMgcG9pbnQsIG5leHROb2RlIGlzIG51bGwsIHNvIGl0IGlzIHRoZSBwYXJlbnQpXG4gICAgICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUucE5leHRPclBhcmVudCB8fCBnZXRQYXJlbnRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSA9PT0gcm9vdE5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZXhpdHMgYSBjb250YWluZXIsIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZSByZXN0b3JlZCB0byB0aGUgcHJldmlvdXNcbiAgICAgICAgLy8gdmFsdWUuXG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSAmJiAhY3VycmVudE5vZGUucE5leHRPclBhcmVudCAmJlxuICAgICAgICAgICAgY3VycmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAgIGJlZm9yZU5vZGUgPSBjdXJyZW50Tm9kZS5uYXRpdmU7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IGN1cnJlbnROb2RlICYmIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKGN1cnJlbnROb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IG5leHROb2RlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgYWN0aW9uOiBXYWxrTE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBub2RlOiBSQ29tbWVudCB8IFJFbGVtZW50IHwgUlRleHQsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa0xOb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlciAhKSA/XG4gICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5pbnNlcnRCZWZvcmUocGFyZW50ICEsIG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsKSA6XG4gICAgICAgIHBhcmVudCAhLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkRldGFjaCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnJlbW92ZUNoaWxkKHBhcmVudCAhLCBub2RlKSA6XG4gICAgICAgIHBhcmVudCAhLnJlbW92ZUNoaWxkKG5vZGUpO1xuICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEobm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0aGUgcm9vdCB2aWV3IGJlbG9uZ3NcbiAqIEBwYXJhbSByb290Tm9kZSBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiB0cnVlLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogZmFsc2UpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IGJvb2xlYW4sXG4gICAgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHJvb3ROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgaWYgKHBhcmVudCkge1xuICAgIGxldCBub2RlOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShyb290Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlld1tSRU5ERVJFUl07XG4gICAgd2Fsa0xOb2RlVHJlZShcbiAgICAgICAgbm9kZSwgcm9vdE5vZGUsIGluc2VydE1vZGUgPyBXYWxrTE5vZGVUcmVlQWN0aW9uLkluc2VydCA6IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoLFxuICAgICAgICByZW5kZXJlciwgcGFyZW50Tm9kZSwgYmVmb3JlTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGlmIChyb290Vmlld1tUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG4gIGxldCB2aWV3T3JDb250YWluZXI6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBnZXRMVmlld0NoaWxkKHJvb3RWaWV3KTtcblxuICB3aGlsZSAodmlld09yQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHZpZXdPckNvbnRhaW5lci5sZW5ndGggPj0gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gSWYgTFZpZXdEYXRhLCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgICBpZiAodmlld1tUVklFV10uY2hpbGRJbmRleCA+IC0xKSBuZXh0ID0gZ2V0TFZpZXdDaGlsZCh2aWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlld0RhdGEuXG4gICAgICBjb25zdCBjb250YWluZXIgPSB2aWV3T3JDb250YWluZXIgYXMgTENvbnRhaW5lcjtcbiAgICAgIGlmIChjb250YWluZXJbVklFV1NdLmxlbmd0aCkgbmV4dCA9IGNvbnRhaW5lcltWSUVXU11bMF0uZGF0YTtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAmJiAhdmlld09yQ29udGFpbmVyICFbTkVYVF0gJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gdmlld09yQ29udGFpbmVyICYmIHZpZXdPckNvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIHZpZXdOb2RlIFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0byBpbnNlcnQgdGhlIHZpZXdcbiAqIEByZXR1cm5zIFRoZSBpbnNlcnRlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHZpZXdOb2RlOiBMVmlld05vZGUsIGluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRhaW5lci5kYXRhO1xuICBjb25zdCB2aWV3cyA9IHN0YXRlW1ZJRVdTXTtcbiAgY29uc3QgbFZpZXcgPSB2aWV3Tm9kZS5kYXRhIGFzIExWaWV3RGF0YTtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgdmlld3NbaW5kZXggLSAxXS5kYXRhW05FWFRdID0gbFZpZXc7XG4gIH1cblxuICBpZiAoaW5kZXggPCB2aWV3cy5sZW5ndGgpIHtcbiAgICBsVmlld1tORVhUXSA9IHZpZXdzW2luZGV4XS5kYXRhO1xuICAgIHZpZXdzLnNwbGljZShpbmRleCwgMCwgdmlld05vZGUpO1xuICB9IGVsc2Uge1xuICAgIHZpZXdzLnB1c2godmlld05vZGUpO1xuICAgIGxWaWV3W05FWFRdID0gbnVsbDtcbiAgfVxuXG4gIC8vIER5bmFtaWNhbGx5IGluc2VydGVkIHZpZXdzIG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlaXIgcGFyZW50IGNvbnRhaW5lcidTIGhvc3Qgc28gaXQnc1xuICAvLyBwb3NzaWJsZSB0byBqdW1wIGZyb20gYSB2aWV3IHRvIGl0cyBjb250YWluZXIncyBuZXh0IHdoZW4gd2Fsa2luZyB0aGUgbm9kZSB0cmVlLlxuICBpZiAodmlld05vZGUudE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgbFZpZXdbQ09OVEFJTkVSX0lOREVYXSA9IGNvbnRhaW5lci50Tm9kZS5wYXJlbnQgIS5pbmRleDtcbiAgICAodmlld05vZGUgYXN7dmlldzogTFZpZXdEYXRhfSkudmlldyA9IGNvbnRhaW5lci52aWV3O1xuICB9XG5cbiAgLy8gTm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBpZiAobFZpZXdbUVVFUklFU10pIHtcbiAgICBsVmlld1tRVUVSSUVTXSAhLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcblxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2Qgc3BsaWNlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEByZXR1cm5zIFRoZSBkZXRhY2hlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhW1ZJRVdTXTtcbiAgY29uc3Qgdmlld05vZGUgPSB2aWV3c1tyZW1vdmVJbmRleF07XG4gIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICB2aWV3c1tyZW1vdmVJbmRleCAtIDFdLmRhdGFbTkVYVF0gPSB2aWV3Tm9kZS5kYXRhW05FWFRdIGFzIExWaWV3RGF0YTtcbiAgfVxuICB2aWV3cy5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICBpZiAoIWNvbnRhaW5lci50Tm9kZS5kZXRhY2hlZCkge1xuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKGNvbnRhaW5lciwgdmlld05vZGUsIGZhbHNlKTtcbiAgfVxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgY29uc3QgcmVtb3ZlZExWaWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKHJlbW92ZWRMVmlld1tRVUVSSUVTXSkge1xuICAgIHJlbW92ZWRMVmlld1tRVUVSSUVTXSAhLnJlbW92ZVZpZXcoKTtcbiAgfVxuICByZW1vdmVkTFZpZXdbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICAodmlld05vZGUgYXN7dmlldzogTFZpZXdEYXRhIHwgbnVsbH0pLnZpZXcgPSBudWxsO1xuICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgdmlld05vZGUuZGF0YVtGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3Tm9kZSA9IGNvbnRhaW5lci5kYXRhW1ZJRVdTXVtyZW1vdmVJbmRleF07XG4gIGRldGFjaFZpZXcoY29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRlc3Ryb3lMVmlldyh2aWV3Tm9kZS5kYXRhKTtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKiogR2V0cyB0aGUgY2hpbGQgb2YgdGhlIGdpdmVuIExWaWV3RGF0YSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3Q2hpbGQodmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxMQ29udGFpbmVyfG51bGwge1xuICBpZiAodmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBob3N0Tm9kZTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlID0gdmlld0RhdGFbdmlld0RhdGFbVFZJRVddLmNoaWxkSW5kZXhdO1xuXG4gIHJldHVybiBob3N0Tm9kZS5kYXRhID8gaG9zdE5vZGUuZGF0YSA6IChob3N0Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbnVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICB3YWxrTE5vZGVUcmVlKHZpZXdbSE9TVF9OT0RFXSwgdmlld1tIT1NUX05PREVdLCBXYWxrTE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIHJlbmRlcmVyKTtcbiAgfVxuICBkZXN0cm95Vmlld1RyZWUodmlldyk7XG4gIC8vIFNldHMgdGhlIGRlc3Ryb3llZCBmbGFnXG4gIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShzdGF0ZTogTFZpZXdEYXRhIHwgTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YXxcbiAgICBMQ29udGFpbmVyfG51bGwge1xuICBsZXQgbm9kZTtcbiAgaWYgKChub2RlID0gKHN0YXRlIGFzIExWaWV3RGF0YSkgIVtIT1NUX05PREVdKSAmJiBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gaWYgaXQncyBhbiBlbWJlZGRlZCB2aWV3LCB0aGUgc3RhdGUgbmVlZHMgdG8gZ28gdXAgdG8gdGhlIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVcbiAgICAvLyBjb250YWluZXIgaGFzIGEgbmV4dFxuICAgIHJldHVybiBnZXRQYXJlbnRMTm9kZShub2RlKSAhLmRhdGEgYXMgYW55O1xuICB9IGVsc2Uge1xuICAgIC8vIG90aGVyd2lzZSwgdXNlIHBhcmVudCB2aWV3IGZvciBjb250YWluZXJzIG9yIGNvbXBvbmVudCB2aWV3c1xuICAgIHJldHVybiBzdGF0ZVtQQVJFTlRdID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZVtQQVJFTlRdO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGFuZCBjYWxsIGFsbCBvbkRlc3Ryb3lzIGluIGEgZ2l2ZW4gdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlldyBUaGUgTFZpZXdEYXRhIHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoKHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGEpW1RWSUVXXSkge1xuICAgIGNvbnN0IHZpZXcgPSB2aWV3T3JDb250YWluZXIgYXMgTFZpZXdEYXRhO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBleGVjdXRlT25EZXN0cm95cyh2aWV3KTtcbiAgICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKHZpZXdbVFZJRVddLmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBjbGVhbnVwID0gdmlld0RhdGFbVFZJRVddLmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGxpc3RlbmVyIHdpdGggdGhlIG5hdGl2ZSByZW5kZXJlclxuICAgICAgICBjb25zdCBuYXRpdmUgPSB2aWV3RGF0YVtjbGVhbnVwW2kgKyAxXV0ubmF0aXZlO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpICsgMl1dO1xuICAgICAgICBuYXRpdmUucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGVhbnVwW2ldLCBsaXN0ZW5lciwgY2xlYW51cFtpICsgM10pO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCByZW5kZXJlcjIgKGNsZWFudXAgZm4gY2FuIGJlIGZvdW5kIGJ5IGluZGV4KVxuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaV1dO1xuICAgICAgICBjbGVhbnVwRm4oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlld0RhdGFbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlld1tESVJFQ1RJVkVTXSAhLCBkZXN0cm95SG9va3MpO1xuICB9XG59XG5cbi8qKiBDYWxscyBwaXBlIGRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZVBpcGVPbkRlc3Ryb3lzKHZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXdEYXRhW1RWSUVXXSAmJiB2aWV3RGF0YVtUVklFV10ucGlwZURlc3Ryb3lIb29rcztcbiAgaWYgKHBpcGVEZXN0cm95SG9va3MpIHtcbiAgICBjYWxsSG9va3Modmlld0RhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hcmUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICpcblxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCB3aGVyZSB0aGUgY2hpbGQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvLlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIHNob3VsZCBiZSBpbnNlcnRlZCBub3cgKG9yIGRlbGF5ZWQgdW50aWwgbGF0ZXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQ6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIC8vIFdlIGNhbiBvbmx5IGluc2VydCBpbnRvIGEgQ29tcG9uZW50IG9yIFZpZXcuIEFueSBvdGhlciB0eXBlIHNob3VsZCBiZSBhbiBFcnJvci5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMocGFyZW50LCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLlZpZXcpO1xuXG4gIGlmIChwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAvLyBQYXJlbnQgaXMgYW4gZWxlbWVudC5cbiAgICBpZiAocGFyZW50LnZpZXcgIT09IGN1cnJlbnRWaWV3KSB7XG4gICAgICAvLyBJZiB0aGUgUGFyZW50IHZpZXcgaXMgbm90IHRoZSBzYW1lIGFzIGN1cnJlbnQgdmlldyB0aGFuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzXG4gICAgICAvLyBWaWV3cy4gVGhpcyBoYXBwZW5zIHdoZW4gd2UgaW5zZXJ0IGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvXG4gICAgICAvLyB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmQgaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBQYXJlbnQgZWxlbWVudHMgY2FuIGJlIGEgY29tcG9uZW50IHdoaWNoIG1heSBoYXZlIHByb2plY3Rpb24uXG4gICAgaWYgKHBhcmVudC5kYXRhID09PSBudWxsKSB7XG4gICAgICAvLyBQYXJlbnQgaXMgYSByZWd1bGFyIG5vbi1jb21wb25lbnQgZWxlbWVudC4gV2Ugc2hvdWxkIGVhZ2VybHkgaW5zZXJ0IGludG8gaXRcbiAgICAgIC8vIHNpbmNlIHdlIGtub3cgdGhhdCB0aGlzIHJlbGF0aW9uc2hpcCB3aWxsIG5ldmVyIGJlIGJyb2tlbi5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQYXJlbnQgaXMgYSBDb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAgICAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gICAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGFuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBQYXJlbnQgaXMgYSBWaWV3LlxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwYXJlbnQsIFROb2RlVHlwZS5WaWV3KTtcblxuICAgIC8vIEJlY2F1c2Ugd2UgYXJlIGluc2VydGluZyBpbnRvIGEgYFZpZXdgIHRoZSBgVmlld2AgbWF5IGJlIGRpc2Nvbm5lY3RlZC5cbiAgICBjb25zdCBncmFuZFBhcmVudENvbnRhaW5lciA9IGdldFBhcmVudExOb2RlKHBhcmVudCkgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgaWYgKGdyYW5kUGFyZW50Q29udGFpbmVyID09IG51bGwpIHtcbiAgICAgIC8vIFRoZSBgVmlld2AgaXMgbm90IGluc2VydGVkIGludG8gYSBgQ29udGFpbmVyYCB3ZSBoYXZlIHRvIGRlbGF5IGluc2VydGlvbi5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGdyYW5kUGFyZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBpZiAoZ3JhbmRQYXJlbnRDb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXSA9PSBudWxsKSB7XG4gICAgICAvLyBUaGUgcGFyZW50IGBDb250YWluZXJgIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIFNvIHdlIGhhdmUgdG8gZGVsYXkuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBwYXJlbnQgYENvbnRhaW5lcmAgaXMgaW4gaW5zZXJ0ZWQgc3RhdGUsIHNvIHdlIGNhbiBlYWdlcmx5IGluc2VydCBpbnRvXG4gICAgICAvLyB0aGlzIGxvY2F0aW9uLlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX0uXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHRvIHdoaWNoIHRvIGFwcGVuZCB0aGUgY2hpbGRcbiAqIEBwYXJhbSBjaGlsZCBUaGUgY2hpbGQgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyBhcHBlbmRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQocGFyZW50OiBMTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gY3VycmVudFZpZXdbUkVOREVSRVJdO1xuICAgIGlmIChwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGdldFBhcmVudExOb2RlKHBhcmVudCkgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgICBjb25zdCByZW5kZXJQYXJlbnQgPSBjb250YWluZXIuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgICAgIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGFbVklFV1NdO1xuICAgICAgY29uc3QgaW5kZXggPSB2aWV3cy5pbmRleE9mKHBhcmVudCBhcyBMVmlld05vZGUpO1xuICAgICAgY29uc3QgYmVmb3JlTm9kZSA9XG4gICAgICAgICAgaW5kZXggKyAxIDwgdmlld3MubGVuZ3RoID8gKGdldENoaWxkTE5vZGUodmlld3NbaW5kZXggKyAxXSkgISkubmF0aXZlIDogY29udGFpbmVyLm5hdGl2ZTtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHJlbmRlclBhcmVudCAhLm5hdGl2ZSwgY2hpbGQsIGJlZm9yZU5vZGUpIDpcbiAgICAgICAgICByZW5kZXJQYXJlbnQgIS5uYXRpdmUuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50Lm5hdGl2ZSAhYXMgUkVsZW1lbnQsIGNoaWxkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgYGNoaWxkYCBlbGVtZW50IG9mIHRoZSBgcGFyZW50YCBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IGZyb20gd2hpY2ggdG8gcmVtb3ZlIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2hpbGQocGFyZW50OiBMTm9kZSwgY2hpbGQ6IFJOb2RlIHwgbnVsbCwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICBpZiAoY2hpbGQgIT09IG51bGwgJiYgY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KSkge1xuICAgIC8vIFdlIG9ubHkgcmVtb3ZlIHRoZSBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50Lm5hdGl2ZSBhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSB8IExWaWV3Tm9kZSxcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhLCByZW5kZXJQYXJlbnQ6IExFbGVtZW50Tm9kZSk6IHZvaWQge1xuICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCBub2RlLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIGNvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBhbiBlbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ24gdGhlIGZpbmFsIHByb2plY3Rpb24gbG9jYXRpb24gaW4gdGhvc2UgY2FzZXMuXG4gICAgY29uc3QgbENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgIGxDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnQ7XG4gICAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbm9kZS5uYXRpdmUpO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gcmVuZGVyUGFyZW50O1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICB9XG59XG4iXX0=