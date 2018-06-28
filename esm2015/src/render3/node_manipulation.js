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
import { CLEANUP, CONTAINER_INDEX, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, NEXT, PARENT, QUERIES, RENDERER, TVIEW, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { stringify } from './util';
const /** @type {?} */ unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
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
    if (node.pChild) {
        return node.pChild;
    }
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
    if (node.tNode.index === -1 && node.tNode.type === 2 /* View */) {
        // This is a dynamically created view inside a dynamic container.
        // If the host index is -1, the view has not yet been inserted, so it has no parent.
        const /** @type {?} */ containerHostIndex = (/** @type {?} */ (node.data))[CONTAINER_INDEX];
        return containerHostIndex === -1 ? null : node.view[containerHostIndex].dynamicLContainerNode;
    }
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
    let /** @type {?} */ node = startingNode;
    while (node) {
        let /** @type {?} */ nextNode = null;
        const /** @type {?} */ parent = renderParentNode ? renderParentNode.native : null;
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
            const /** @type {?} */ lContainerNode = (/** @type {?} */ (node));
            const /** @type {?} */ childContainerData = lContainerNode.dynamicLContainerNode ?
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
            /**
             * Find the next node in the LNode tree, taking into account the place where a node is
             * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
             *
             * If there is no sibling node, then it goes to the next sibling of the parent node...
             * until it reaches rootNode (at which point null is returned).
             */
            let /** @type {?} */ currentNode = node;
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
    const /** @type {?} */ parentNode = container.data[RENDER_PARENT];
    const /** @type {?} */ parent = parentNode ? parentNode.native : null;
    if (parent) {
        let /** @type {?} */ node = getChildLNode(rootNode);
        const /** @type {?} */ renderer = container.view[RENDERER];
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
    const /** @type {?} */ lView = /** @type {?} */ (viewNode.data);
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
    const /** @type {?} */ views = container.data[VIEWS];
    const /** @type {?} */ viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data[NEXT] = /** @type {?} */ (viewNode.data[NEXT]);
    }
    views.splice(removeIndex, 1);
    if (!container.tNode.detached) {
        addRemoveViewFromContainer(container, viewNode, false);
    }
    // Notify query that view has been removed
    const /** @type {?} */ removedLView = viewNode.data;
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
        // Because we are inserting into a `View` the `View` may be disconnected.
        const /** @type {?} */ grandParentContainer = /** @type {?} */ (getParentLNode(parent));
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
        const /** @type {?} */ renderer = currentView[RENDERER];
        if (parent.tNode.type === 2 /* View */) {
            const /** @type {?} */ container = /** @type {?} */ (getParentLNode(parent));
            const /** @type {?} */ renderParent = container.data[RENDER_PARENT];
            const /** @type {?} */ views = container.data[VIEWS];
            const /** @type {?} */ index = views.indexOf(/** @type {?} */ (parent));
            const /** @type {?} */ beforeNode = index + 1 < views.length ? (/** @type {?} */ ((getChildLNode(views[index + 1])))).native : container.native;
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
        // We only remove the element if not in View or not projected.
        const /** @type {?} */ renderer = currentView[RENDERER];
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
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        const /** @type {?} */ lContainer = (/** @type {?} */ (node)).data;
        lContainer[RENDER_PARENT] = renderParent;
        const /** @type {?} */ views = lContainer[VIEWS];
        for (let /** @type {?} */ i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(/** @type {?} */ (node), views[i], true, null);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
        appendChild(currentParent, node.dynamicLContainerNode.native, currentView);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQWEsYUFBYSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNsSCxPQUFPLEVBQXdGLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xLLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQW1FLG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBbUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzTixPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFakMsdUJBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7O0FBR2hGLE1BQU0sdUJBQXVCLElBQVc7O0lBRXRDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixFQUFFO1FBQ3RDLHVCQUFNLFFBQVEscUJB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Q0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLDBCQUEwQixtQkFBQyxJQUFzQixHQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUU7S0FDRjtJQUNELElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFO1FBQzlCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsWUFBWSxDQUFDO1FBQzlELFdBQVcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztLQUM1RTtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIEhvb2tEYXRhLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyICsgdW51c2VkMyArIHVudXNlZDQgKyB1bnVzZWQ1O1xuXG4vKiogUmV0cmlldmVzIHRoZSBzaWJsaW5nIG5vZGUgZm9yIHRoZSBnaXZlbiBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5leHRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICAvLyBWaWV3IG5vZGVzIGRvbid0IGhhdmUgVE5vZGVzLCBzbyB0aGVpciBuZXh0IG11c3QgYmUgcmV0cmlldmVkIHRocm91Z2ggdGhlaXIgTFZpZXcuXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgY29uc3Qgdmlld0RhdGEgPSBub2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuICAgIHJldHVybiB2aWV3RGF0YVtORVhUXSA/ICh2aWV3RGF0YVtORVhUXSBhcyBMVmlld0RhdGEpW0hPU1RfTk9ERV0gOiBudWxsO1xuICB9XG4gIHJldHVybiBub2RlLnROb2RlLm5leHQgPyBub2RlLnZpZXdbbm9kZS50Tm9kZS5uZXh0ICEuaW5kZXhdIDogbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgZmlyc3QgY2hpbGQgb2YgYSBnaXZlbiBub2RlICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hpbGRMTm9kZShub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBpZiAobm9kZS5wQ2hpbGQpIHtcbiAgICByZXR1cm4gbm9kZS5wQ2hpbGQ7XG4gIH1cbiAgaWYgKG5vZGUudE5vZGUuY2hpbGQpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgPyBub2RlLmRhdGEgYXMgTFZpZXdEYXRhIDogbm9kZS52aWV3O1xuICAgIHJldHVybiB2aWV3RGF0YVtub2RlLnROb2RlLmNoaWxkLmluZGV4XTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMQ29udGFpbmVyTm9kZSB8IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExQcm9qZWN0aW9uTm9kZSk6XG4gICAgTEVsZW1lbnROb2RlfExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMVmlld05vZGUpOiBMQ29udGFpbmVyTm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExOb2RlKTogTEVsZW1lbnROb2RlfExDb250YWluZXJOb2RlfExWaWV3Tm9kZXxudWxsIHtcbiAgaWYgKG5vZGUudE5vZGUuaW5kZXggPT09IC0xICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBUaGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3IGluc2lkZSBhIGR5bmFtaWMgY29udGFpbmVyLlxuICAgIC8vIElmIHRoZSBob3N0IGluZGV4IGlzIC0xLCB0aGUgdmlldyBoYXMgbm90IHlldCBiZWVuIGluc2VydGVkLCBzbyBpdCBoYXMgbm8gcGFyZW50LlxuICAgIGNvbnN0IGNvbnRhaW5lckhvc3RJbmRleCA9IChub2RlLmRhdGEgYXMgTFZpZXdEYXRhKVtDT05UQUlORVJfSU5ERVhdO1xuICAgIHJldHVybiBjb250YWluZXJIb3N0SW5kZXggPT09IC0xID8gbnVsbCA6IG5vZGUudmlld1tjb250YWluZXJIb3N0SW5kZXhdLmR5bmFtaWNMQ29udGFpbmVyTm9kZTtcbiAgfVxuICBjb25zdCBwYXJlbnQgPSBub2RlLnROb2RlLnBhcmVudDtcbiAgcmV0dXJuIHBhcmVudCA/IG5vZGUudmlld1twYXJlbnQuaW5kZXhdIDogbm9kZS52aWV3W0hPU1RfTk9ERV07XG59XG5cbi8qKlxuICogR2V0IHRoZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUsIHRha2luZyBpbnRvIGFjY291bnQgdGhlIHBsYWNlIHdoZXJlIGEgbm9kZSBpc1xuICogcHJvamVjdGVkIChpbiB0aGUgc2hhZG93IERPTSkgcmF0aGVyIHRoYW4gd2hlcmUgaXQgY29tZXMgZnJvbSAoaW4gdGhlIGxpZ2h0IERPTSkuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgd2hvc2UgbmV4dCBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcmV0dXJuIExOb2RlfG51bGwgVGhlIG5leHQgc2libGluZyBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgY29uc3QgcE5leHRPclBhcmVudCA9IG5vZGUucE5leHRPclBhcmVudDtcblxuICBpZiAocE5leHRPclBhcmVudCkge1xuICAgIC8vIFRoZSBub2RlIGlzIHByb2plY3RlZFxuICAgIGNvbnN0IGlzTGFzdFByb2plY3RlZE5vZGUgPSBwTmV4dE9yUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uO1xuICAgIC8vIHJldHVybnMgcE5leHRPclBhcmVudCBpZiB3ZSBhcmUgbm90IGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QsIG51bGwgb3RoZXJ3aXNlXG4gICAgcmV0dXJuIGlzTGFzdFByb2plY3RlZE5vZGUgPyBudWxsIDogcE5leHRPclBhcmVudDtcbiAgfVxuXG4gIC8vIHJldHVybnMgbm9kZS5uZXh0IGJlY2F1c2UgdGhlIHRoZSBub2RlIGlzIG5vdCBwcm9qZWN0ZWRcbiAgcmV0dXJuIGdldE5leHRMTm9kZShub2RlKTtcbn1cblxuY29uc3QgZW51bSBXYWxrTE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgaW5zZXJ0IGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgSW5zZXJ0ID0gMCxcblxuICAvKiogbm9kZSBkZXRhY2ggZnJvbSB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIERldGFjaCA9IDEsXG5cbiAgLyoqIG5vZGUgZGVzdHJ1Y3Rpb24gdXNpbmcgdGhlIHJlbmRlcmVyJ3MgQVBJICovXG4gIERlc3Ryb3kgPSAyLFxufVxuXG4vKipcbiAqIFdhbGtzIGEgdHJlZSBvZiBMTm9kZXMsIGFwcGx5aW5nIGEgdHJhbnNmb3JtYXRpb24gb24gdGhlIExFbGVtZW50IG5vZGVzLCBlaXRoZXIgb25seSBvbiB0aGUgZmlyc3RcbiAqIG9uZSBmb3VuZCwgb3Igb24gYWxsIG9mIHRoZW0uXG4gKlxuICogQHBhcmFtIHN0YXJ0aW5nTm9kZSB0aGUgbm9kZSBmcm9tIHdoaWNoIHRoZSB3YWxrIGlzIHN0YXJ0ZWQuXG4gKiBAcGFyYW0gcm9vdE5vZGUgdGhlIHJvb3Qgbm9kZSBjb25zaWRlcmVkLlxuICogQHBhcmFtIGFjdGlvbiBpZGVudGlmaWVzIHRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBMRWxlbWVudCBub2Rlcy5cbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgY3VycmVudCByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnROb2RlIE9wdGlvbmFsIHRoZSByZW5kZXIgcGFyZW50IG5vZGUgdG8gYmUgc2V0IGluIGFsbCBMQ29udGFpbmVyTm9kZXMgZm91bmQsXG4gKiByZXF1aXJlZCBmb3IgYWN0aW9uIG1vZGVzIEluc2VydCBhbmQgRGVzdHJveS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIE9wdGlvbmFsIHRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIHJlcXVpcmVkIGZvciBhY3Rpb25cbiAqIEluc2VydC5cbiAqL1xuZnVuY3Rpb24gd2Fsa0xOb2RlVHJlZShcbiAgICBzdGFydGluZ05vZGU6IExOb2RlIHwgbnVsbCwgcm9vdE5vZGU6IExOb2RlLCBhY3Rpb246IFdhbGtMTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgcmVuZGVyUGFyZW50Tm9kZT86IExFbGVtZW50Tm9kZSB8IG51bGwsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBzdGFydGluZ05vZGU7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgbGV0IG5leHROb2RlOiBMTm9kZXxudWxsID0gbnVsbDtcbiAgICBjb25zdCBwYXJlbnQgPSByZW5kZXJQYXJlbnROb2RlID8gcmVuZGVyUGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAvLyBFeGVjdXRlIHRoZSBhY3Rpb25cbiAgICAgIGV4ZWN1dGVOb2RlQWN0aW9uKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudCwgbm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSk7XG4gICAgICBpZiAobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgZXhlY3V0ZU5vZGVBY3Rpb24oXG4gICAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICAgIG5leHROb2RlID0gZ2V0TmV4dExOb2RlKG5vZGUpO1xuICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBleGVjdXRlTm9kZUFjdGlvbihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnQsIG5vZGUubmF0aXZlICEsIGJlZm9yZU5vZGUpO1xuICAgICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpO1xuICAgICAgY29uc3QgY2hpbGRDb250YWluZXJEYXRhOiBMQ29udGFpbmVyID0gbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlID9cbiAgICAgICAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YSA6XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICAgIGlmIChyZW5kZXJQYXJlbnROb2RlKSB7XG4gICAgICAgIGNoaWxkQ29udGFpbmVyRGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudE5vZGU7XG4gICAgICB9XG4gICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhW1ZJRVdTXS5sZW5ndGggPyBnZXRDaGlsZExOb2RlKGNoaWxkQ29udGFpbmVyRGF0YVtWSUVXU11bMF0pIDogbnVsbDtcbiAgICAgIGlmIChuZXh0Tm9kZSkge1xuICAgICAgICAvLyBXaGVuIHRoZSB3YWxrZXIgZW50ZXJzIGEgY29udGFpbmVyLCB0aGVuIHRoZSBiZWZvcmVOb2RlIGhhcyB0byBiZWNvbWUgdGhlIGxvY2FsIG5hdGl2ZVxuICAgICAgICAvLyBjb21tZW50IG5vZGUuXG4gICAgICAgIGJlZm9yZU5vZGUgPSBsQ29udGFpbmVyTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgP1xuICAgICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSA6XG4gICAgICAgICAgICBsQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBGb3IgUHJvamVjdGlvbiBsb29rIGF0IHRoZSBmaXJzdCBwcm9qZWN0ZWQgbm9kZVxuICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgYXQgdGhlIGZpcnN0IGNoaWxkXG4gICAgICBuZXh0Tm9kZSA9IGdldENoaWxkTE5vZGUobm9kZSBhcyBMVmlld05vZGUpO1xuICAgIH1cblxuICAgIGlmIChuZXh0Tm9kZSA9PSBudWxsKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gICAgICAgKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAgICAgICAqXG4gICAgICAgKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoZW4gaXQgZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICAgICAgICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gICAgICAgKi9cbiAgICAgIGxldCBjdXJyZW50Tm9kZTogTE5vZGV8bnVsbCA9IG5vZGU7XG4gICAgICBub2RlID0gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24oY3VycmVudE5vZGUpO1xuICAgICAgd2hpbGUgKGN1cnJlbnROb2RlICYmICFub2RlKSB7XG4gICAgICAgIC8vIGlmIG5vZGUucE5leHRPclBhcmVudCBpcyBub3QgbnVsbCBoZXJlLCBpdCBpcyBub3QgdGhlIG5leHQgbm9kZVxuICAgICAgICAvLyAoYmVjYXVzZSwgYXQgdGhpcyBwb2ludCwgbmV4dE5vZGUgaXMgbnVsbCwgc28gaXQgaXMgdGhlIHBhcmVudClcbiAgICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wTmV4dE9yUGFyZW50IHx8IGdldFBhcmVudExOb2RlKGN1cnJlbnROb2RlKTtcbiAgICAgICAgaWYgKGN1cnJlbnROb2RlID09PSByb290Tm9kZSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdoZW4gdGhlIHdhbGtlciBleGl0cyBhIGNvbnRhaW5lciwgdGhlIGJlZm9yZU5vZGUgaGFzIHRvIGJlIHJlc3RvcmVkIHRvIHRoZSBwcmV2aW91c1xuICAgICAgICAvLyB2YWx1ZS5cbiAgICAgICAgaWYgKGN1cnJlbnROb2RlICYmICFjdXJyZW50Tm9kZS5wTmV4dE9yUGFyZW50ICYmXG4gICAgICAgICAgICBjdXJyZW50Tm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgICAgYmVmb3JlTm9kZSA9IGN1cnJlbnROb2RlLm5hdGl2ZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gY3VycmVudE5vZGUgJiYgZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24oY3VycmVudE5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBub2RlID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBleGVjdXRlTm9kZUFjdGlvbihcbiAgICBhY3Rpb246IFdhbGtMTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIG5vZGU6IFJDb21tZW50IHwgUkVsZW1lbnQgfCBSVGV4dCwgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkluc2VydCkge1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyICEpID9cbiAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmluc2VydEJlZm9yZShwYXJlbnQgISwgbm9kZSwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgcGFyZW50ICEuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZU5vZGUgYXMgUk5vZGUgfCBudWxsLCB0cnVlKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtMTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIgISkgP1xuICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykucmVtb3ZlQ2hpbGQocGFyZW50ICEsIG5vZGUpIDpcbiAgICAgICAgcGFyZW50ICEucmVtb3ZlQ2hpbGQobm9kZSk7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrTE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveU5vZGUgIShub2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHJvb3ROb2RlIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IHRydWUsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogYm9vbGVhbixcbiAgICBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocm9vdE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICBjb25zdCBwYXJlbnQgPSBwYXJlbnROb2RlID8gcGFyZW50Tm9kZS5uYXRpdmUgOiBudWxsO1xuICBpZiAocGFyZW50KSB7XG4gICAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBnZXRDaGlsZExOb2RlKHJvb3ROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGNvbnRhaW5lci52aWV3W1JFTkRFUkVSXTtcbiAgICB3YWxrTE5vZGVUcmVlKFxuICAgICAgICBub2RlLCByb290Tm9kZSwgaW5zZXJ0TW9kZSA/IFdhbGtMTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa0xOb2RlVHJlZUFjdGlvbi5EZXRhY2gsXG4gICAgICAgIHJlbmRlcmVyLCBwYXJlbnROb2RlLCBiZWZvcmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3W1RWSUVXXS5jaGlsZEluZGV4ID09PSAtMSkge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cbiAgbGV0IHZpZXdPckNvbnRhaW5lcjogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IGdldExWaWV3Q2hpbGQocm9vdFZpZXcpO1xuXG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAodmlld09yQ29udGFpbmVyLmxlbmd0aCA+PSBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBJZiBMVmlld0RhdGEsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBjb25zdCB2aWV3ID0gdmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YTtcbiAgICAgIGlmICh2aWV3W1RWSUVXXS5jaGlsZEluZGV4ID4gLTEpIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3RGF0YS5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lciBhcyBMQ29udGFpbmVyO1xuICAgICAgaWYgKGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSBuZXh0ID0gY29udGFpbmVyW1ZJRVdTXVswXS5kYXRhO1xuICAgIH1cblxuICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAodmlld09yQ29udGFpbmVyICYmICF2aWV3T3JDb250YWluZXIgIVtORVhUXSAmJiB2aWV3T3JDb250YWluZXIgIT09IHJvb3RWaWV3KSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lcik7XG4gICAgICAgIHZpZXdPckNvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKHZpZXdPckNvbnRhaW5lciwgcm9vdFZpZXcpO1xuICAgICAgfVxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyICFbTkVYVF07XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGVbVklFV1NdO1xuICBjb25zdCBsVmlldyA9IHZpZXdOb2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICB2aWV3c1tpbmRleCAtIDFdLmRhdGFbTkVYVF0gPSBsVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIGxWaWV3W05FWFRdID0gdmlld3NbaW5kZXhdLmRhdGE7XG4gICAgdmlld3Muc3BsaWNlKGluZGV4LCAwLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgdmlld3MucHVzaCh2aWV3Tm9kZSk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgLy8gRHluYW1pY2FsbHkgaW5zZXJ0ZWQgdmlld3MgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGVpciBwYXJlbnQgY29udGFpbmVyJ1MgaG9zdCBzbyBpdCdzXG4gIC8vIHBvc3NpYmxlIHRvIGp1bXAgZnJvbSBhIHZpZXcgdG8gaXRzIGNvbnRhaW5lcidzIG5leHQgd2hlbiB3YWxraW5nIHRoZSBub2RlIHRyZWUuXG4gIGlmICh2aWV3Tm9kZS50Tm9kZS5pbmRleCA9PT0gLTEpIHtcbiAgICBsVmlld1tDT05UQUlORVJfSU5ERVhdID0gY29udGFpbmVyLnROb2RlLnBhcmVudCAhLmluZGV4O1xuICAgICh2aWV3Tm9kZSBhc3t2aWV3OiBMVmlld0RhdGF9KS52aWV3ID0gY29udGFpbmVyLnZpZXc7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGlmIChsVmlld1tRVUVSSUVTXSkge1xuICAgIGxWaWV3W1FVRVJJRVNdICEuaW5zZXJ0VmlldyhpbmRleCk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgVGhlIGRldGFjaGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdzID0gY29udGFpbmVyLmRhdGFbVklFV1NdO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV0uZGF0YVtORVhUXSA9IHZpZXdOb2RlLmRhdGFbTkVYVF0gYXMgTFZpZXdEYXRhO1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGlmICghY29udGFpbmVyLnROb2RlLmRldGFjaGVkKSB7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuICB9XG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb25zdCByZW1vdmVkTFZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAocmVtb3ZlZExWaWV3W1FVRVJJRVNdKSB7XG4gICAgcmVtb3ZlZExWaWV3W1FVRVJJRVNdICEucmVtb3ZlVmlldygpO1xuICB9XG4gIHJlbW92ZWRMVmlld1tDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gICh2aWV3Tm9kZSBhc3t2aWV3OiBMVmlld0RhdGEgfCBudWxsfSkudmlldyA9IG51bGw7XG4gIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICB2aWV3Tm9kZS5kYXRhW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gcmVtb3ZlIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byByZW1vdmVcbiAqIEByZXR1cm5zIFRoZSByZW1vdmVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVZpZXcoY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHZpZXdOb2RlID0gY29udGFpbmVyLmRhdGFbVklFV1NdW3JlbW92ZUluZGV4XTtcbiAgZGV0YWNoVmlldyhjb250YWluZXIsIHJlbW92ZUluZGV4KTtcbiAgZGVzdHJveUxWaWV3KHZpZXdOb2RlLmRhdGEpO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKiBHZXRzIHRoZSBjaGlsZCBvZiB0aGUgZ2l2ZW4gTFZpZXdEYXRhICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdDaGlsZCh2aWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdEYXRhfExDb250YWluZXJ8bnVsbCB7XG4gIGlmICh2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGhvc3ROb2RlOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGUgPSB2aWV3RGF0YVt2aWV3RGF0YVtUVklFV10uY2hpbGRJbmRleF07XG5cbiAgcmV0dXJuIGhvc3ROb2RlLmRhdGEgPyBob3N0Tm9kZS5kYXRhIDogKGhvc3ROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSAmJiByZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIHdhbGtMTm9kZVRyZWUodmlld1tIT1NUX05PREVdLCB2aWV3W0hPU1RfTk9ERV0sIFdhbGtMTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgcmVuZGVyZXIpO1xuICB9XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3KTtcbiAgLy8gU2V0cyB0aGUgZGVzdHJveWVkIGZsYWdcbiAgdmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhfFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXdEYXRhKSAhW0hPU1RfTk9ERV0pICYmIG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldFBhcmVudExOb2RlKG5vZGUpICEuZGF0YSBhcyBhbnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIHN0YXRlW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IHN0YXRlW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlld0RhdGEgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGlmICgodmlld09yQ29udGFpbmVyIGFzIExWaWV3RGF0YSlbVFZJRVddKSB7XG4gICAgY29uc3QgdmlldyA9IHZpZXdPckNvbnRhaW5lciBhcyBMVmlld0RhdGE7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIGV4ZWN1dGVQaXBlT25EZXN0cm95cyh2aWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAodmlld1tUVklFV10uaWQgPT09IC0xICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHZpZXdbUkVOREVSRVJdKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgICh2aWV3W1JFTkRFUkVSXSBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyh2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3RGF0YVtUVklFV10uY2xlYW51cCAhO1xuICBpZiAoY2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbGlzdGVuZXIgd2l0aCB0aGUgbmF0aXZlIHJlbmRlcmVyXG4gICAgICAgIGNvbnN0IG5hdGl2ZSA9IHZpZXdEYXRhW2NsZWFudXBbaSArIDFdXS5uYXRpdmU7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gdmlld0RhdGFbQ0xFQU5VUF0gIVtjbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIG5hdGl2ZS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGxpc3RlbmVyLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNsZWFudXBbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBsaXN0ZW5lciB3aXRoIHJlbmRlcmVyMiAoY2xlYW51cCBmbiBjYW4gYmUgZm91bmQgYnkgaW5kZXgpXG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHZpZXdEYXRhW0NMRUFOVVBdICFbY2xlYW51cFtpXV07XG4gICAgICAgIGNsZWFudXBGbigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB2aWV3RGF0YVtDTEVBTlVQXSAhW2NsZWFudXBbaSArIDFdXTtcbiAgICAgICAgY2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3RGF0YVtDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgbGV0IGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbDtcbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGNhbGxIb29rcyh2aWV3W0RJUkVDVElWRVNdICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjb25zdCBwaXBlRGVzdHJveUhvb2tzID0gdmlld0RhdGFbVFZJRVddICYmIHZpZXdEYXRhW1RWSUVXXS5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3RGF0YSAhLCBwaXBlRGVzdHJveUhvb2tzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBhIG5hdGl2ZSBlbGVtZW50IGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFyZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKlxuXG4gKlxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IHdoZXJlIHRoZSBjaGlsZCB3aWxsIGJlIGluc2VydGVkIGludG8uXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciB0aGUgY2hpbGQgc2hvdWxkIGJlIGluc2VydGVkIG5vdyAob3IgZGVsYXllZCB1bnRpbCBsYXRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudDogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgLy8gV2UgY2FuIG9ubHkgaW5zZXJ0IGludG8gYSBDb21wb25lbnQgb3IgVmlldy4gQW55IG90aGVyIHR5cGUgc2hvdWxkIGJlIGFuIEVycm9yLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhwYXJlbnQsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuVmlldyk7XG5cbiAgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIC8vIFBhcmVudCBpcyBhbiBlbGVtZW50LlxuICAgIGlmIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcpIHtcbiAgICAgIC8vIElmIHRoZSBQYXJlbnQgdmlldyBpcyBub3QgdGhlIHNhbWUgYXMgY3VycmVudCB2aWV3IHRoYW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3NcbiAgICAgIC8vIFZpZXdzLiBUaGlzIGhhcHBlbnMgd2hlbiB3ZSBpbnNlcnQgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG9cbiAgICAgIC8vIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZCBpdCBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIFBhcmVudCBlbGVtZW50cyBjYW4gYmUgYSBjb21wb25lbnQgd2hpY2ggbWF5IGhhdmUgcHJvamVjdGlvbi5cbiAgICBpZiAocGFyZW50LmRhdGEgPT09IG51bGwpIHtcbiAgICAgIC8vIFBhcmVudCBpcyBhIHJlZ3VsYXIgbm9uLWNvbXBvbmVudCBlbGVtZW50LiBXZSBzaG91bGQgZWFnZXJseSBpbnNlcnQgaW50byBpdFxuICAgICAgLy8gc2luY2Ugd2Uga25vdyB0aGF0IHRoaXMgcmVsYXRpb25zaGlwIHdpbGwgbmV2ZXIgYmUgYnJva2VuLlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFBhcmVudCBpcyBhIENvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gICAgICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgICAgIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoYW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFBhcmVudCBpcyBhIFZpZXcuXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLlZpZXcpO1xuXG4gICAgLy8gQmVjYXVzZSB3ZSBhcmUgaW5zZXJ0aW5nIGludG8gYSBgVmlld2AgdGhlIGBWaWV3YCBtYXkgYmUgZGlzY29ubmVjdGVkLlxuICAgIGNvbnN0IGdyYW5kUGFyZW50Q29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUocGFyZW50KSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICBpZiAoZ3JhbmRQYXJlbnRDb250YWluZXIgPT0gbnVsbCkge1xuICAgICAgLy8gVGhlIGBWaWV3YCBpcyBub3QgaW5zZXJ0ZWQgaW50byBhIGBDb250YWluZXJgIHdlIGhhdmUgdG8gZGVsYXkgaW5zZXJ0aW9uLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ3JhbmRQYXJlbnRDb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIGlmIChncmFuZFBhcmVudENvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdID09IG51bGwpIHtcbiAgICAgIC8vIFRoZSBwYXJlbnQgYENvbnRhaW5lcmAgaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gU28gd2UgaGF2ZSB0byBkZWxheS5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhlIHBhcmVudCBgQ29udGFpbmVyYCBpcyBpbiBpbnNlcnRlZCBzdGF0ZSwgc28gd2UgY2FuIGVhZ2VybHkgaW5zZXJ0IGludG9cbiAgICAgIC8vIHRoaXMgbG9jYXRpb24uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIGVsZW1lbnQgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgaWYgKHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZ2V0UGFyZW50TE5vZGUocGFyZW50KSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IGNvbnRhaW5lci5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICAgICAgY29uc3Qgdmlld3MgPSBjb250YWluZXIuZGF0YVtWSUVXU107XG4gICAgICBjb25zdCBpbmRleCA9IHZpZXdzLmluZGV4T2YocGFyZW50IGFzIExWaWV3Tm9kZSk7XG4gICAgICBjb25zdCBiZWZvcmVOb2RlID1cbiAgICAgICAgICBpbmRleCArIDEgPCB2aWV3cy5sZW5ndGggPyAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1tpbmRleCArIDFdKSAhKS5uYXRpdmUgOiBjb250YWluZXIubmF0aXZlO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5pbnNlcnRCZWZvcmUocmVuZGVyUGFyZW50ICEubmF0aXZlLCBjaGlsZCwgYmVmb3JlTm9kZSkgOlxuICAgICAgICAgIHJlbmRlclBhcmVudCAhLm5hdGl2ZS5pbnNlcnRCZWZvcmUoY2hpbGQsIGJlZm9yZU5vZGUsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBgY2hpbGRgIGVsZW1lbnQgb2YgdGhlIGBwYXJlbnRgIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgZnJvbSB3aGljaCB0byByZW1vdmUgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY2hpbGQgVGhlIGNoaWxkIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHJldHVybnMgV2hldGhlciBvciBub3QgdGhlIGNoaWxkIHdhcyByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIGlmIChjaGlsZCAhPT0gbnVsbCAmJiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudCwgY3VycmVudFZpZXcpKSB7XG4gICAgLy8gV2Ugb25seSByZW1vdmUgdGhlIGVsZW1lbnQgaWYgbm90IGluIFZpZXcgb3Igbm90IHByb2plY3RlZC5cbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQubmF0aXZlIGFzIFJFbGVtZW50LCBjaGlsZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5uYXRpdmUgIS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgYSBwcm9qZWN0ZWQgbm9kZSB0byB0aGUgRE9NLCBvciBpbiB0aGUgY2FzZSBvZiBhIHByb2plY3RlZCBjb250YWluZXIsXG4gKiBhcHBlbmRzIHRoZSBub2RlcyBmcm9tIGFsbCBvZiB0aGUgY29udGFpbmVyJ3MgYWN0aXZlIHZpZXdzIHRvIHRoZSBET00uXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIG5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGN1cnJlbnRQYXJlbnQgVGhlIGxhc3QgcGFyZW50IGVsZW1lbnQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgQ3VycmVudCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudDogTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlLFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHJlbmRlclBhcmVudDogTEVsZW1lbnROb2RlKTogdm9pZCB7XG4gIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIG5vZGUubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGEgY29udGFpbmVyIGFuZCB3ZSBhcmUgYWRkaW5nIGl0IHRvIGFuIGVsZW1lbnQgd2hpY2hcbiAgICAvLyBpcyBub3QgYSBjb21wb25lbnQgKG5vIG1vcmUgcmUtcHJvamVjdGlvbikuXG4gICAgLy8gQWx0ZXJuYXRpdmVseSBhIGNvbnRhaW5lciBpcyBwcm9qZWN0ZWQgYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQncyB0ZW1wbGF0ZVxuICAgIC8vIGFuZCBjYW4ndCBiZSByZS1wcm9qZWN0ZWQgKGFzIG5vdCBjb250ZW50IG9mIGFueSBjb21wb25lbnQpLlxuICAgIC8vIEFzc2lnbiB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lcltSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKG5vZGUgYXMgTENvbnRhaW5lck5vZGUsIHZpZXdzW2ldLCB0cnVlLCBudWxsKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YVtSRU5ERVJfUEFSRU5UXSA9IHJlbmRlclBhcmVudDtcbiAgICBhcHBlbmRDaGlsZChjdXJyZW50UGFyZW50LCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUsIGN1cnJlbnRWaWV3KTtcbiAgfVxufVxuIl19