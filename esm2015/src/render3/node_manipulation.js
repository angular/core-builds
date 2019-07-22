/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertDomNode } from '../util/assert';
import { assertLContainer, assertLView } from './assert';
import { attachPatchData } from './context_discovery';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS, NATIVE, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { isLContainer, isLView, isRootView } from './interfaces/type_checks';
import { CHILD_HEAD, CLEANUP, DECLARATION_LCONTAINER, FLAGS, HOST, NEXT, PARENT, QUERIES, RENDERER, TVIEW, T_HOST, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { renderStringify } from './util/misc_utils';
import { findComponentView, getLViewParent } from './util/view_traversal_utils';
import { getNativeByTNode, getNativeByTNodeOrNull, unwrapRNode } from './util/view_utils';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * @param {?} tNode
 * @param {?} embeddedView
 * @return {?}
 */
export function getLContainer(tNode, embeddedView) {
    ngDevMode && assertLView(embeddedView);
    /** @type {?} */
    const container = (/** @type {?} */ (embeddedView[PARENT]));
    if (tNode.index === -1) {
        // This is a dynamically created view inside a dynamic container.
        // The parent isn't an LContainer if the embedded view hasn't been attached yet.
        return isLContainer(container) ? container : null;
    }
    else {
        ngDevMode && assertLContainer(container);
        // This is a inline view node (e.g. embeddedViewStart)
        return container;
    }
}
/**
 * Retrieves render parent for a given view.
 * Might be null if a view is not yet attached to any container.
 * @param {?} tViewNode
 * @param {?} view
 * @return {?}
 */
function getContainerRenderParent(tViewNode, view) {
    /** @type {?} */
    const container = getLContainer(tViewNode, view);
    return container ? nativeParentNode(view[RENDERER], container[NATIVE]) : null;
}
/** @enum {number} */
const WalkTNodeTreeAction = {
    /** node insert in the native environment */
    Insert: 0,
    /** node detach from the native environment */
    Detach: 1,
    /** node destruction using the renderer's API */
    Destroy: 2,
};
/**
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 * @param {?} action
 * @param {?} renderer
 * @param {?} parent
 * @param {?} lNodeToHandle
 * @param {?=} beforeNode
 * @return {?}
 */
function executeActionOnElementOrContainer(action, renderer, parent, lNodeToHandle, beforeNode) {
    ngDevMode && assertDefined(lNodeToHandle, '\'lNodeToHandle\' is undefined');
    /** @type {?} */
    let lContainer;
    /** @type {?} */
    let isComponent = false;
    // We are expecting an RNode, but in the case of a component or LContainer the `RNode` is wrapped
    // in an array which needs to be unwrapped. We need to know if it is a component and if
    // it has LContainer so that we can process all of those cases appropriately.
    if (isLContainer(lNodeToHandle)) {
        lContainer = lNodeToHandle;
    }
    else if (isLView(lNodeToHandle)) {
        isComponent = true;
        ngDevMode && assertDefined(lNodeToHandle[HOST], 'HOST must be defined for a component LView');
        lNodeToHandle = (/** @type {?} */ (lNodeToHandle[HOST]));
    }
    /** @type {?} */
    const rNode = unwrapRNode(lNodeToHandle);
    ngDevMode && assertDomNode(rNode);
    if (action === 0 /* Insert */) {
        nativeInsertBefore(renderer, (/** @type {?} */ (parent)), rNode, beforeNode || null);
    }
    else if (action === 1 /* Detach */) {
        nativeRemoveNode(renderer, rNode, isComponent);
    }
    else if (action === 2 /* Destroy */) {
        ngDevMode && ngDevMode.rendererDestroyNode++;
        (/** @type {?} */ (((/** @type {?} */ (renderer))).destroyNode))(rNode);
    }
    if (lContainer != null) {
        executeActionOnContainer(renderer, action, lContainer, parent, beforeNode);
    }
}
/**
 * @param {?} value
 * @param {?} renderer
 * @return {?}
 */
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(renderStringify(value)) :
        renderer.createTextNode(renderStringify(value));
}
/**
 * @param {?} lView
 * @param {?} insertMode
 * @param {?=} beforeNode
 * @return {?}
 */
export function addRemoveViewFromContainer(lView, insertMode, beforeNode) {
    /** @type {?} */
    const renderParent = getContainerRenderParent((/** @type {?} */ (lView[TVIEW].node)), lView);
    ngDevMode && assertNodeType((/** @type {?} */ (lView[TVIEW].node)), 2 /* View */);
    if (renderParent) {
        /** @type {?} */
        const renderer = lView[RENDERER];
        /** @type {?} */
        const action = insertMode ? 0 /* Insert */ : 1 /* Detach */;
        executeActionOnView(renderer, action, lView, renderParent, beforeNode);
    }
}
/**
 * Detach a `LView` from the DOM by detaching its nodes.
 *
 * @param {?} lView the `LView` to be detached.
 * @return {?}
 */
export function renderDetachView(lView) {
    executeActionOnView(lView[RENDERER], 1 /* Detach */, lView, null, null);
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
    /** @type {?} */
    let lViewOrLContainer = rootView[CHILD_HEAD];
    if (!lViewOrLContainer) {
        return cleanUpView(rootView);
    }
    while (lViewOrLContainer) {
        /** @type {?} */
        let next = null;
        if (isLView(lViewOrLContainer)) {
            // If LView, traverse down to child.
            next = lViewOrLContainer[CHILD_HEAD];
        }
        else {
            ngDevMode && assertLContainer(lViewOrLContainer);
            // If container, traverse down to its first LView.
            /** @type {?} */
            const firstView = lViewOrLContainer[CONTAINER_HEADER_OFFSET];
            if (firstView)
                next = firstView;
        }
        if (!next) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (lViewOrLContainer && !(/** @type {?} */ (lViewOrLContainer))[NEXT] && lViewOrLContainer !== rootView) {
                cleanUpView(lViewOrLContainer);
                lViewOrLContainer = getParentState(lViewOrLContainer, rootView);
            }
            cleanUpView(lViewOrLContainer || rootView);
            next = lViewOrLContainer && (/** @type {?} */ (lViewOrLContainer))[NEXT];
        }
        lViewOrLContainer = next;
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
 * @param {?} lView The view to insert
 * @param {?} lContainer The container into which the view should be inserted
 * @param {?} index Which index in the container to insert the child view into
 * @return {?}
 */
export function insertView(lView, lContainer, index) {
    ngDevMode && assertLView(lView);
    ngDevMode && assertLContainer(lContainer);
    /** @type {?} */
    const indexInContainer = CONTAINER_HEADER_OFFSET + index;
    /** @type {?} */
    const containerLength = lContainer.length;
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        lContainer[indexInContainer - 1][NEXT] = lView;
    }
    if (index < containerLength - CONTAINER_HEADER_OFFSET) {
        lView[NEXT] = lContainer[indexInContainer];
        addToArray(lContainer, CONTAINER_HEADER_OFFSET + index, lView);
    }
    else {
        lContainer.push(lView);
        lView[NEXT] = null;
    }
    lView[PARENT] = lContainer;
    // track views where declaration and insertion points are different
    /** @type {?} */
    const declarationLContainer = lView[DECLARATION_LCONTAINER];
    if (declarationLContainer !== null && lContainer !== declarationLContainer) {
        trackMovedView(declarationLContainer, lView);
    }
    // notify query that a new view has been added
    /** @type {?} */
    const lQueries = lView[QUERIES];
    if (lQueries !== null) {
        lQueries.insertView(lView[TVIEW]);
    }
    // Sets the attached flag
    lView[FLAGS] |= 128 /* Attached */;
}
/**
 * Track views created from the declaration container (TemplateRef) and inserted into a
 * different LContainer.
 * @param {?} declarationContainer
 * @param {?} lView
 * @return {?}
 */
function trackMovedView(declarationContainer, lView) {
    ngDevMode && assertLContainer(declarationContainer);
    /** @type {?} */
    const declaredViews = declarationContainer[MOVED_VIEWS];
    if (declaredViews === null) {
        declarationContainer[MOVED_VIEWS] = [lView];
    }
    else {
        declaredViews.push(lView);
    }
}
/**
 * @param {?} declarationContainer
 * @param {?} lView
 * @return {?}
 */
function detachMovedView(declarationContainer, lView) {
    ngDevMode && assertLContainer(declarationContainer);
    ngDevMode && assertDefined(declarationContainer[MOVED_VIEWS], 'A projected view should belong to a non-empty projected views collection');
    /** @type {?} */
    const projectedViews = (/** @type {?} */ (declarationContainer[MOVED_VIEWS]));
    /** @type {?} */
    const declaredViewIndex = projectedViews.indexOf(lView);
    projectedViews.splice(declaredViewIndex, 1);
}
/**
 * Detaches a view from a container.
 *
 * This method removes the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param {?} lContainer The container from which to detach a view
 * @param {?} removeIndex The index of the view to detach
 * @return {?} Detached LView instance.
 */
export function detachView(lContainer, removeIndex) {
    if (lContainer.length <= CONTAINER_HEADER_OFFSET)
        return;
    /** @type {?} */
    const indexInContainer = CONTAINER_HEADER_OFFSET + removeIndex;
    /** @type {?} */
    const viewToDetach = lContainer[indexInContainer];
    if (viewToDetach) {
        /** @type {?} */
        const declarationLContainer = viewToDetach[DECLARATION_LCONTAINER];
        if (declarationLContainer !== null && declarationLContainer !== lContainer) {
            detachMovedView(declarationLContainer, viewToDetach);
        }
        if (removeIndex > 0) {
            lContainer[indexInContainer - 1][NEXT] = (/** @type {?} */ (viewToDetach[NEXT]));
        }
        /** @type {?} */
        const removedLView = removeFromArray(lContainer, CONTAINER_HEADER_OFFSET + removeIndex);
        addRemoveViewFromContainer(viewToDetach, false);
        // notify query that a view has been removed
        /** @type {?} */
        const lQueries = removedLView[QUERIES];
        if (lQueries !== null) {
            lQueries.detachView(removedLView[TVIEW]);
        }
        viewToDetach[PARENT] = null;
        viewToDetach[NEXT] = null;
        // Unsets the attached flag
        viewToDetach[FLAGS] &= ~128 /* Attached */;
    }
    return viewToDetach;
}
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param {?} lContainer The container from which to remove a view
 * @param {?} removeIndex The index of the view to remove
 * @return {?}
 */
export function removeView(lContainer, removeIndex) {
    /** @type {?} */
    const detachedView = detachView(lContainer, removeIndex);
    detachedView && destroyLView(detachedView);
}
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param {?} lView The view to be destroyed.
 * @return {?}
 */
export function destroyLView(lView) {
    if (!(lView[FLAGS] & 256 /* Destroyed */)) {
        /** @type {?} */
        const renderer = lView[RENDERER];
        if (isProceduralRenderer(renderer) && renderer.destroyNode) {
            executeActionOnView(renderer, 2 /* Destroy */, lView, null, null);
        }
        destroyViewTree(lView);
    }
}
/**
 * Determines which LViewOrLContainer to jump to when traversing back up the
 * tree in destroyViewTree.
 *
 * Normally, the view's parent LView should be checked, but in the case of
 * embedded views, the container (which is the view node's parent, but not the
 * LView's parent) needs to be checked for a possible next property.
 *
 * @param {?} lViewOrLContainer The LViewOrLContainer for which we need a parent state
 * @param {?} rootView The rootView, so we don't propagate too far up the view tree
 * @return {?} The correct parent LViewOrLContainer
 */
export function getParentState(lViewOrLContainer, rootView) {
    /** @type {?} */
    let tNode;
    if (isLView(lViewOrLContainer) && (tNode = lViewOrLContainer[T_HOST]) &&
        tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getLContainer((/** @type {?} */ (tNode)), lViewOrLContainer);
    }
    else {
        // otherwise, use parent view for containers or component views
        return lViewOrLContainer[PARENT] === rootView ? null : lViewOrLContainer[PARENT];
    }
}
/**
 * Calls onDestroys hooks for all directives and pipes in a given view and then removes all
 * listeners. Listeners are removed as the last step so events delivered in the onDestroys hooks
 * can be propagated to \@Output listeners.
 *
 * @param {?} view The LView to clean up
 * @return {?}
 */
function cleanUpView(view) {
    if (isLView(view) && !(view[FLAGS] & 256 /* Destroyed */)) {
        // Usually the Attached flag is removed when the view is detached from its parent, however
        // if it's a root view, the flag won't be unset hence why we're also removing on destroy.
        view[FLAGS] &= ~128 /* Attached */;
        // Mark the LView as destroyed *before* executing the onDestroy hooks. An onDestroy hook
        // runs arbitrary user code, which could include its own `viewRef.destroy()` (or similar). If
        // We don't flag the view as destroyed before the hooks, this could lead to an infinite loop.
        // This also aligns with the ViewEngine behavior. It also means that the onDestroy hook is
        // really more of an "afterDestroy" hook if you think about it.
        view[FLAGS] |= 256 /* Destroyed */;
        executeOnDestroys(view);
        removeListeners(view);
        /** @type {?} */
        const hostTNode = view[T_HOST];
        // For component views only, the local renderer is destroyed as clean up time.
        if (hostTNode && hostTNode.type === 3 /* Element */ && isProceduralRenderer(view[RENDERER])) {
            ngDevMode && ngDevMode.rendererDestroy++;
            ((/** @type {?} */ (view[RENDERER]))).destroy();
        }
        /** @type {?} */
        const declarationContainer = view[DECLARATION_LCONTAINER];
        // we are dealing with an embedded view that is still inserted into a container
        if (declarationContainer !== null && isLContainer(view[PARENT])) {
            // and this is a projected view
            if (declarationContainer !== view[PARENT]) {
                detachMovedView(declarationContainer, view);
            }
            // For embedded views still attached to a container: remove query result from this view.
            /** @type {?} */
            const lQueries = view[QUERIES];
            if (lQueries !== null) {
                lQueries.detachView(view[TVIEW]);
            }
        }
    }
}
/**
 * Removes listeners and unsubscribes from output subscriptions
 * @param {?} lView
 * @return {?}
 */
function removeListeners(lView) {
    /** @type {?} */
    const tCleanup = lView[TVIEW].cleanup;
    if (tCleanup !== null) {
        /** @type {?} */
        const lCleanup = (/** @type {?} */ (lView[CLEANUP]));
        for (let i = 0; i < tCleanup.length - 1; i += 2) {
            if (typeof tCleanup[i] === 'string') {
                // This is a native DOM listener
                /** @type {?} */
                const idxOrTargetGetter = tCleanup[i + 1];
                /** @type {?} */
                const target = typeof idxOrTargetGetter === 'function' ?
                    idxOrTargetGetter(lView) :
                    unwrapRNode(lView[idxOrTargetGetter]);
                /** @type {?} */
                const listener = lCleanup[tCleanup[i + 2]];
                /** @type {?} */
                const useCaptureOrSubIdx = tCleanup[i + 3];
                if (typeof useCaptureOrSubIdx === 'boolean') {
                    // native DOM listener registered with Renderer3
                    target.removeEventListener(tCleanup[i], listener, useCaptureOrSubIdx);
                }
                else {
                    if (useCaptureOrSubIdx >= 0) {
                        // unregister
                        lCleanup[useCaptureOrSubIdx]();
                    }
                    else {
                        // Subscription
                        lCleanup[-useCaptureOrSubIdx].unsubscribe();
                    }
                }
                i += 2;
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                /** @type {?} */
                const context = lCleanup[tCleanup[i + 1]];
                tCleanup[i].call(context);
            }
        }
        lView[CLEANUP] = null;
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
        for (let i = 0; i < destroyHooks.length; i += 2) {
            /** @type {?} */
            const context = view[(/** @type {?} */ (destroyHooks[i]))];
            // Only call the destroy hook if the context has been requested.
            if (!(context instanceof NodeInjectorFactory)) {
                ((/** @type {?} */ (destroyHooks[i + 1]))).call(context);
            }
        }
    }
}
/**
 * Returns a native element if a node can be inserted into the given parent.
 *
 * There are two reasons why we may not be able to insert a element immediately.
 * - Projection: When creating a child content element of a component, we have to skip the
 *   insertion because the content of a component will be projected.
 *   `<component><content>delayed due to projection</content></component>`
 * - Parent container is disconnected: This can happen when we are inserting a view into
 *   parent container, which itself is disconnected. For example the parent container is part
 *   of a View which has not be inserted or is made for projection but has not been inserted
 *   into destination.
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function getRenderParent(tNode, currentView) {
    // Nodes of the top-most view can be inserted eagerly.
    if (isRootView(currentView)) {
        return nativeParentNode(currentView[RENDERER], getNativeByTNode(tNode, currentView));
    }
    // Skip over element and ICU containers as those are represented by a comment node and
    // can't be used as a render parent.
    /** @type {?} */
    const parent = getHighestElementOrICUContainer(tNode);
    /** @type {?} */
    const renderParent = parent.parent;
    // If the parent is null, then we are inserting across views: either into an embedded view or a
    // component view.
    if (renderParent == null) {
        /** @type {?} */
        const hostTNode = (/** @type {?} */ (currentView[T_HOST]));
        if (hostTNode.type === 2 /* View */) {
            // We are inserting a root element of an embedded view We might delay insertion of children
            // for a given view if it is disconnected. This might happen for 2 main reasons:
            // - view is not inserted into any container(view was created but not inserted yet)
            // - view is inserted into a container but the container itself is not inserted into the DOM
            // (container might be part of projection or child of a view that is not inserted yet).
            // In other words we can insert children of a given view if this view was inserted into a
            // container and the container itself has its render parent determined.
            return getContainerRenderParent((/** @type {?} */ (hostTNode)), currentView);
        }
        else {
            // We are inserting a root element of the component view into the component host element and
            // it should always be eager.
            return getHostNative(currentView);
        }
    }
    else {
        /** @type {?} */
        const isIcuCase = parent && parent.type === 5 /* IcuContainer */;
        // If the parent of this node is an ICU container, then it is represented by comment node and we
        // need to use it as an anchor. If it is projected then its direct parent node is the renderer.
        if (isIcuCase && parent.flags & 2 /* isProjected */) {
            return (/** @type {?} */ (getNativeByTNode(parent, currentView).parentNode));
        }
        ngDevMode && assertNodeType(renderParent, 3 /* Element */);
        if (renderParent.flags & 1 /* isComponent */ && !isIcuCase) {
            /** @type {?} */
            const tData = currentView[TVIEW].data;
            /** @type {?} */
            const tNode = (/** @type {?} */ (tData[renderParent.index]));
            /** @type {?} */
            const encapsulation = ((/** @type {?} */ (tData[tNode.directiveStart]))).encapsulation;
            // We've got a parent which is an element in the current view. We just need to verify if the
            // parent element is not a component. Component's content nodes are not inserted immediately
            // because they will be projected, and so doing insert at this point would be wasteful.
            // Since the projection would then move it to its final destination. Note that we can't
            // make this assumption when using the Shadow DOM, because the native projection placeholders
            // (<content> or <slot>) have to be in place as elements are being inserted.
            if (encapsulation !== ViewEncapsulation.ShadowDom &&
                encapsulation !== ViewEncapsulation.Native) {
                return null;
            }
        }
        return (/** @type {?} */ (getNativeByTNode(renderParent, currentView)));
    }
}
/**
 * Gets the native host element for a given view. Will return null if the current view does not have
 * a host element.
 * @param {?} currentView
 * @return {?}
 */
function getHostNative(currentView) {
    ngDevMode && assertLView(currentView);
    /** @type {?} */
    const hostTNode = currentView[T_HOST];
    return hostTNode && hostTNode.type === 3 /* Element */ ?
        ((/** @type {?} */ (getNativeByTNode(hostTNode, (/** @type {?} */ (getLViewParent(currentView))))))) :
        null;
}
/**
 * Inserts a native node before another native node for a given parent using {\@link Renderer3}.
 * This is a utility function that can be used when native nodes were determined - it abstracts an
 * actual renderer being used.
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?} beforeNode
 * @return {?}
 */
export function nativeInsertBefore(renderer, parent, child, beforeNode) {
    ngDevMode && ngDevMode.rendererInsertBefore++;
    if (isProceduralRenderer(renderer)) {
        renderer.insertBefore(parent, child, beforeNode);
    }
    else {
        parent.insertBefore(child, beforeNode, true);
    }
}
/**
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @return {?}
 */
function nativeAppendChild(renderer, parent, child) {
    ngDevMode && ngDevMode.rendererAppendChild++;
    if (isProceduralRenderer(renderer)) {
        renderer.appendChild(parent, child);
    }
    else {
        parent.appendChild(child);
    }
}
/**
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?} beforeNode
 * @return {?}
 */
function nativeAppendOrInsertBefore(renderer, parent, child, beforeNode) {
    if (beforeNode !== null) {
        nativeInsertBefore(renderer, parent, child, beforeNode);
    }
    else {
        nativeAppendChild(renderer, parent, child);
    }
}
/**
 * Removes a node from the DOM given its native parent.
 * @param {?} renderer
 * @param {?} parent
 * @param {?} child
 * @param {?=} isHostElement
 * @return {?}
 */
function nativeRemoveChild(renderer, parent, child, isHostElement) {
    if (isProceduralRenderer(renderer)) {
        renderer.removeChild(parent, child, isHostElement);
    }
    else {
        parent.removeChild(child);
    }
}
/**
 * Returns a native parent of a given native node.
 * @param {?} renderer
 * @param {?} node
 * @return {?}
 */
export function nativeParentNode(renderer, node) {
    return (/** @type {?} */ ((isProceduralRenderer(renderer) ? renderer.parentNode(node) : node.parentNode)));
}
/**
 * Returns a native sibling of a given native node.
 * @param {?} renderer
 * @param {?} node
 * @return {?}
 */
export function nativeNextSibling(renderer, node) {
    return isProceduralRenderer(renderer) ? renderer.nextSibling(node) : node.nextSibling;
}
/**
 * Finds a native "anchor" node for cases where we can't append a native child directly
 * (`appendChild`) and need to use a reference (anchor) node for the `insertBefore` operation.
 * @param {?} parentTNode
 * @param {?} lView
 * @return {?}
 */
function getNativeAnchorNode(parentTNode, lView) {
    if (parentTNode.type === 2 /* View */) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (getLContainer((/** @type {?} */ (parentTNode)), lView)));
        /** @type {?} */
        const index = lContainer.indexOf(lView, CONTAINER_HEADER_OFFSET) - CONTAINER_HEADER_OFFSET;
        return getBeforeNodeForView(index, lContainer);
    }
    else if (parentTNode.type === 4 /* ElementContainer */ ||
        parentTNode.type === 5 /* IcuContainer */) {
        return getNativeByTNode(parentTNode, lView);
    }
    return null;
}
/**
 * Appends the `child` native node (or a collection of nodes) to the `parent`.
 *
 * The element insertion might be delayed {\@link canInsertNativeNode}.
 *
 * @param {?} childEl The native child (or children) that should be appended
 * @param {?} childTNode The TNode of the child element
 * @param {?} currentView The current LView
 * @return {?} Whether or not the child was appended
 */
export function appendChild(childEl, childTNode, currentView) {
    /** @type {?} */
    const renderParent = getRenderParent(childTNode, currentView);
    if (renderParent != null) {
        /** @type {?} */
        const renderer = currentView[RENDERER];
        /** @type {?} */
        const parentTNode = childTNode.parent || (/** @type {?} */ (currentView[T_HOST]));
        /** @type {?} */
        const anchorNode = getNativeAnchorNode(parentTNode, currentView);
        if (Array.isArray(childEl)) {
            for (let nativeNode of childEl) {
                nativeAppendOrInsertBefore(renderer, renderParent, nativeNode, anchorNode);
            }
        }
        else {
            nativeAppendOrInsertBefore(renderer, renderParent, childEl, anchorNode);
        }
    }
}
/**
 * Gets the top-level element or an ICU container if those containers are nested.
 *
 * @param {?} tNode The starting TNode for which we should skip element and ICU containers
 * @return {?} The TNode of the highest level ICU container or element container
 */
function getHighestElementOrICUContainer(tNode) {
    while (tNode.parent != null && (tNode.parent.type === 4 /* ElementContainer */ ||
        tNode.parent.type === 5 /* IcuContainer */)) {
        tNode = tNode.parent;
    }
    return tNode;
}
/**
 * @param {?} viewIndexInContainer
 * @param {?} lContainer
 * @return {?}
 */
export function getBeforeNodeForView(viewIndexInContainer, lContainer) {
    /** @type {?} */
    const nextViewIndex = CONTAINER_HEADER_OFFSET + viewIndexInContainer + 1;
    if (nextViewIndex < lContainer.length) {
        /** @type {?} */
        const lView = (/** @type {?} */ (lContainer[nextViewIndex]));
        ngDevMode && assertDefined(lView[T_HOST], 'Missing Host TNode');
        /** @type {?} */
        const tViewNodeChild = ((/** @type {?} */ (lView[T_HOST]))).child;
        return tViewNodeChild !== null ? getNativeByTNodeOrNull(tViewNodeChild, lView) :
            lContainer[NATIVE];
    }
    else {
        return lContainer[NATIVE];
    }
}
/**
 * Removes a native node itself using a given renderer. To remove the node we are looking up its
 * parent from the native tree as not all platforms / browsers support the equivalent of
 * node.remove().
 *
 * @param {?} renderer A renderer to be used
 * @param {?} rNode The native node that should be removed
 * @param {?=} isHostElement A flag indicating if a node to be removed is a host of a component.
 * @return {?}
 */
export function nativeRemoveNode(renderer, rNode, isHostElement) {
    /** @type {?} */
    const nativeParent = nativeParentNode(renderer, rNode);
    if (nativeParent) {
        nativeRemoveChild(renderer, nativeParent, rNode, isHostElement);
    }
}
/**
 * Appends nodes to a target projection place. Nodes to insert were previously re-distribution and
 * stored on a component host level.
 * @param {?} lView A LView where nodes are inserted (target LView)
 * @param {?} tProjectionNode A projection node where previously re-distribution should be appended
 * (target insertion place)
 * @param {?} selectorIndex A bucket from where nodes to project should be taken
 * @param {?} componentView A where projectable nodes were initially created (source view)
 * @return {?}
 */
export function appendProjectedNodes(lView, tProjectionNode, selectorIndex, componentView) {
    /** @type {?} */
    const projectedView = (/** @type {?} */ ((/** @type {?} */ (componentView[PARENT]))));
    /** @type {?} */
    const componentNode = (/** @type {?} */ (componentView[T_HOST]));
    /** @type {?} */
    let nodeToProject = ((/** @type {?} */ (componentNode.projection)))[selectorIndex];
    if (Array.isArray(nodeToProject)) {
        appendChild(nodeToProject, tProjectionNode, lView);
    }
    else {
        while (nodeToProject) {
            if (!(nodeToProject.flags & 32 /* isDetached */)) {
                if (nodeToProject.type === 1 /* Projection */) {
                    appendProjectedNodes(lView, tProjectionNode, ((/** @type {?} */ (nodeToProject))).projection, findComponentView(projectedView));
                }
                else {
                    // This flag must be set now or we won't know that this node is projected
                    // if the nodes are inserted into a container later.
                    nodeToProject.flags |= 2 /* isProjected */;
                    appendProjectedNode(nodeToProject, tProjectionNode, lView, projectedView);
                }
            }
            nodeToProject = nodeToProject.projectionNext;
        }
    }
}
/**
 * Loops over all children of a TNode container and appends them to the DOM
 *
 * @param {?} ngContainerChildTNode The first child of the TNode container
 * @param {?} tProjectionNode The projection (ng-content) TNode
 * @param {?} currentView Current LView
 * @param {?} projectionView Projection view (view above current)
 * @return {?}
 */
function appendProjectedChildren(ngContainerChildTNode, tProjectionNode, currentView, projectionView) {
    while (ngContainerChildTNode) {
        appendProjectedNode(ngContainerChildTNode, tProjectionNode, currentView, projectionView);
        ngContainerChildTNode = ngContainerChildTNode.next;
    }
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param {?} projectedTNode The TNode to be projected
 * @param {?} tProjectionNode The projection (ng-content) TNode
 * @param {?} currentView Current LView
 * @param {?} projectionView Projection view (view above current)
 * @return {?}
 */
function appendProjectedNode(projectedTNode, tProjectionNode, currentView, projectionView) {
    /** @type {?} */
    const native = getNativeByTNode(projectedTNode, projectionView);
    appendChild(native, tProjectionNode, currentView);
    // the projected contents are processed while in the shadow view (which is the currentView)
    // therefore we need to extract the view where the host element lives since it's the
    // logical container of the content projected views
    attachPatchData(native, projectionView);
    /** @type {?} */
    const nodeOrContainer = projectionView[projectedTNode.index];
    if (projectedTNode.type === 0 /* Container */) {
        // The node we are adding is a container and we are adding it to an element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assign the final projection location in those cases.
        for (let i = CONTAINER_HEADER_OFFSET; i < nodeOrContainer.length; i++) {
            addRemoveViewFromContainer(nodeOrContainer[i], true, nodeOrContainer[NATIVE]);
        }
    }
    else if (projectedTNode.type === 5 /* IcuContainer */) {
        // The node we are adding is an ICU container which is why we also need to project all the
        // children nodes that might have been created previously and are linked to this anchor
        /** @type {?} */
        let ngContainerChildTNode = (/** @type {?} */ (projectedTNode.child));
        appendProjectedChildren(ngContainerChildTNode, ngContainerChildTNode, projectionView, projectionView);
    }
    else {
        if (projectedTNode.type === 4 /* ElementContainer */) {
            appendProjectedChildren(projectedTNode.child, tProjectionNode, currentView, projectionView);
        }
        if (isLContainer(nodeOrContainer)) {
            appendChild(nodeOrContainer[NATIVE], tProjectionNode, currentView);
        }
    }
}
/**
 * `executeActionOnView` performs an operation on the view as specified in `action` (insert, detach,
 * destroy)
 *
 * Inserting a view without projection or containers at top level is simple. Just iterate over the
 * root nodes of the View, and for each node perform the `action`.
 *
 * Things get more complicated with containers and projections. That is because coming across:
 * - Container: implies that we have to insert/remove/destroy the views of that container as well
 *              which in turn can have their own Containers at the View roots.
 * - Projection: implies that we have to insert/remove/destroy the nodes of the projection. The
 *               complication is that the nodes we are projecting can themselves have Containers
 *               or other Projections.
 *
 * As you can see this is a very recursive problem. While the recursive implementation is not the
 * most efficient one, trying to unroll the nodes non-recursively results in very complex code that
 * is very hard (to maintain). We are sacrificing a bit of performance for readability using a
 * recursive implementation.
 *
 * @param {?} renderer Renderer to use
 * @param {?} action action to perform (insert, detach, destroy)
 * @param {?} lView The LView which needs to be inserted, detached, destroyed.
 * @param {?} renderParent parent DOM element for insertion/removal.
 * @param {?} beforeNode Before which node the insertions should happen.
 * @return {?}
 */
function executeActionOnView(renderer, action, lView, renderParent, beforeNode) {
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertNodeType((/** @type {?} */ (tView.node)), 2 /* View */);
    /** @type {?} */
    let viewRootTNode = (/** @type {?} */ (tView.node)).child;
    while (viewRootTNode !== null) {
        executeActionOnNode(renderer, action, lView, viewRootTNode, renderParent, beforeNode);
        viewRootTNode = viewRootTNode.next;
    }
}
/**
 * `executeActionOnProjection` performs an operation on the projection specified by `action`
 * (insert, detach, destroy).
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param {?} renderer Renderer to use
 * @param {?} action action to perform (insert, detach, destroy)
 * @param {?} lView The LView which needs to be inserted, detached, destroyed.
 * @param {?} tProjectionNode projection TNode to process
 * @param {?} renderParent parent DOM element for insertion/removal.
 * @param {?} beforeNode Before which node the insertions should happen.
 * @return {?}
 */
function executeActionOnProjection(renderer, action, lView, tProjectionNode, renderParent, beforeNode) {
    /** @type {?} */
    const componentLView = findComponentView(lView);
    /** @type {?} */
    const componentNode = (/** @type {?} */ (componentLView[T_HOST]));
    ngDevMode && assertDefined(componentNode.projection, 'Element nodes for which projection is processed must have projection defined.');
    /** @type {?} */
    const nodeToProject = (/** @type {?} */ (componentNode.projection))[tProjectionNode.projection];
    if (nodeToProject !== undefined) {
        if (Array.isArray(nodeToProject)) {
            for (let i = 0; i < nodeToProject.length; i++) {
                /** @type {?} */
                const rNode = nodeToProject[i];
                ngDevMode && assertDomNode(rNode);
                executeActionOnElementOrContainer(action, renderer, renderParent, rNode, beforeNode);
            }
        }
        else {
            /** @type {?} */
            let projectionTNode = nodeToProject;
            /** @type {?} */
            const projectedComponentLView = (/** @type {?} */ (componentLView[PARENT]));
            while (projectionTNode !== null) {
                executeActionOnNode(renderer, action, projectedComponentLView, projectionTNode, renderParent, beforeNode);
                projectionTNode = projectionTNode.projectionNext;
            }
        }
    }
}
/**
 * `executeActionOnContainer` performs an operation on the container and its views as specified by
 * `action` (insert, detach, destroy)
 *
 * Inserting a Container is complicated by the fact that the container may have Views which
 * themselves have containers or projections.
 *
 * @param {?} renderer Renderer to use
 * @param {?} action action to perform (insert, detach, destroy)
 * @param {?} lContainer The LContainer which needs to be inserted, detached, destroyed.
 * @param {?} renderParent parent DOM element for insertion/removal.
 * @param {?} beforeNode Before which node the insertions should happen.
 * @return {?}
 */
function executeActionOnContainer(renderer, action, lContainer, renderParent, beforeNode) {
    ngDevMode && assertLContainer(lContainer);
    /** @type {?} */
    const anchor = lContainer[NATIVE];
    // LContainer has its own before node.
    /** @type {?} */
    const native = unwrapRNode(lContainer);
    // An LContainer can be created dynamically on any node by injecting ViewContainerRef.
    // Asking for a ViewContainerRef on an element will result in a creation of a separate anchor node
    // (comment in the DOM) that will be different from the LContainer's host node. In this particular
    // case we need to execute action on 2 nodes:
    // - container's host node (this is done in the executeNodeAction)
    // - container's host node (this is done here)
    if (anchor !== native) {
        executeActionOnElementOrContainer(action, renderer, renderParent, anchor, beforeNode);
    }
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        /** @type {?} */
        const lView = (/** @type {?} */ (lContainer[i]));
        executeActionOnView(renderer, action, lView, renderParent, anchor);
    }
}
/**
 * `executeActionOnElementContainerOrIcuContainer` performs an operation on the ng-container node
 * and its child nodes as specified by the `action` (insert, detach, destroy).
 *
 * @param {?} renderer Renderer to use
 * @param {?} action action to perform (insert, detach, destroy)
 * @param {?} lView The LView which needs to be inserted, detached, destroyed.
 * @param {?} tNode The TNode associated with the `ElementContainer` or `IcuContainer`.
 * @param {?} renderParent parent DOM element for insertion/removal.
 * @param {?} beforeNode Before which node the insertions should happen.
 * @return {?}
 */
function executeActionOnElementContainerOrIcuContainer(renderer, action, lView, tNode, renderParent, beforeNode) {
    /** @type {?} */
    const node = lView[tNode.index];
    executeActionOnElementOrContainer(action, renderer, renderParent, node, beforeNode);
    /** @type {?} */
    let childTNode = tNode.child;
    while (childTNode) {
        executeActionOnNode(renderer, action, lView, childTNode, renderParent, beforeNode);
        childTNode = childTNode.next;
    }
}
/**
 * @param {?} renderer
 * @param {?} action
 * @param {?} lView
 * @param {?} tNode
 * @param {?} renderParent
 * @param {?} beforeNode
 * @return {?}
 */
function executeActionOnNode(renderer, action, lView, tNode, renderParent, beforeNode) {
    /** @type {?} */
    const nodeType = tNode.type;
    if (!(tNode.flags & 32 /* isDetached */)) {
        if (nodeType === 4 /* ElementContainer */ || nodeType === 5 /* IcuContainer */) {
            executeActionOnElementContainerOrIcuContainer(renderer, action, lView, (/** @type {?} */ (tNode)), renderParent, beforeNode);
        }
        else if (nodeType === 1 /* Projection */) {
            executeActionOnProjection(renderer, action, lView, (/** @type {?} */ (tNode)), renderParent, beforeNode);
        }
        else {
            ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */);
            executeActionOnElementOrContainer(action, renderer, renderParent, lView[tNode.index], beforeNode);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxXQUFXLEVBQUUsTUFBTSxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTFJLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBbUgsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0wsT0FBTyxFQUFDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2pGLE9BQU8sRUFBeUQsb0JBQW9CLEVBQUUsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDN0osT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDM0UsT0FBTyxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBK0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxF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QUFFRCxTQUFTLG1CQUFtQixDQUN4QixRQUFtQixFQUFFLE1BQTJCLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFDNUUsWUFBNkIsRUFBRSxVQUFvQzs7VUFDL0QsUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJO0lBQzNCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLHNCQUF3QixDQUFDLEVBQUU7UUFDMUMsSUFBSSxRQUFRLDZCQUErQixJQUFJLFFBQVEseUJBQTJCLEVBQUU7WUFDbEYsNkNBQTZDLENBQ3pDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLG1CQUFBLEtBQUssRUFBNkMsRUFBRSxZQUFZLEVBQ3pGLFVBQVUsQ0FBQyxDQUFDO1NBQ2pCO2FBQU0sSUFBSSxRQUFRLHVCQUF5QixFQUFFO1lBQzVDLHlCQUF5QixDQUNyQixRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxtQkFBQSxLQUFLLEVBQW1CLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2xGO2FBQU07WUFDTCxTQUFTLElBQUkseUJBQXlCLENBQUMsS0FBSyxxQ0FBeUMsQ0FBQztZQUN0RixpQ0FBaUMsQ0FDN0IsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNyRTtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge2FkZFRvQXJyYXksIHJlbW92ZUZyb21BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlldywgaXNSb290Vmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0xFQU5VUCwgREVDTEFSQVRJT05fTENPTlRBSU5FUiwgRkxBR1MsIEhPU1QsIEhvb2tEYXRhLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRfSE9TVCwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50VmlldywgZ2V0TFZpZXdQYXJlbnR9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGVPck51bGwsIHVud3JhcFJOb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMQ29udGFpbmVyKHROb2RlOiBUVmlld05vZGUsIGVtYmVkZGVkVmlldzogTFZpZXcpOiBMQ29udGFpbmVyfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoZW1iZWRkZWRWaWV3KTtcbiAgY29uc3QgY29udGFpbmVyID0gZW1iZWRkZWRWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgaWYgKHROb2RlLmluZGV4ID09PSAtMSkge1xuICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgaW5zaWRlIGEgZHluYW1pYyBjb250YWluZXIuXG4gICAgLy8gVGhlIHBhcmVudCBpc24ndCBhbiBMQ29udGFpbmVyIGlmIHRoZSBlbWJlZGRlZCB2aWV3IGhhc24ndCBiZWVuIGF0dGFjaGVkIHlldC5cbiAgICByZXR1cm4gaXNMQ29udGFpbmVyKGNvbnRhaW5lcikgPyBjb250YWluZXIgOiBudWxsO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgLy8gVGhpcyBpcyBhIGlubGluZSB2aWV3IG5vZGUgKGUuZy4gZW1iZWRkZWRWaWV3U3RhcnQpXG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgfVxufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHRWaWV3Tm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBuYXRpdmVQYXJlbnROb2RlKHZpZXdbUkVOREVSRVJdLCBjb250YWluZXJbTkFUSVZFXSkgOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBJbnNlcnQgPSAwLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMSxcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDIsXG59XG5cblxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbk9uRWxlbWVudE9yQ29udGFpbmVyKFxuICAgIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCB8IG51bGwsXG4gICAgbE5vZGVUb0hhbmRsZTogUk5vZGUgfCBMQ29udGFpbmVyIHwgTFZpZXcsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobE5vZGVUb0hhbmRsZSwgJ1xcJ2xOb2RlVG9IYW5kbGVcXCcgaXMgdW5kZWZpbmVkJyk7XG4gIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyfHVuZGVmaW5lZDtcbiAgbGV0IGlzQ29tcG9uZW50ID0gZmFsc2U7XG4gIC8vIFdlIGFyZSBleHBlY3RpbmcgYW4gUk5vZGUsIGJ1dCBpbiB0aGUgY2FzZSBvZiBhIGNvbXBvbmVudCBvciBMQ29udGFpbmVyIHRoZSBgUk5vZGVgIGlzIHdyYXBwZWRcbiAgLy8gaW4gYW4gYXJyYXkgd2hpY2ggbmVlZHMgdG8gYmUgdW53cmFwcGVkLiBXZSBuZWVkIHRvIGtub3cgaWYgaXQgaXMgYSBjb21wb25lbnQgYW5kIGlmXG4gIC8vIGl0IGhhcyBMQ29udGFpbmVyIHNvIHRoYXQgd2UgY2FuIHByb2Nlc3MgYWxsIG9mIHRob3NlIGNhc2VzIGFwcHJvcHJpYXRlbHkuXG4gIGlmIChpc0xDb250YWluZXIobE5vZGVUb0hhbmRsZSkpIHtcbiAgICBsQ29udGFpbmVyID0gbE5vZGVUb0hhbmRsZTtcbiAgfSBlbHNlIGlmIChpc0xWaWV3KGxOb2RlVG9IYW5kbGUpKSB7XG4gICAgaXNDb21wb25lbnQgPSB0cnVlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxOb2RlVG9IYW5kbGVbSE9TVF0sICdIT1NUIG11c3QgYmUgZGVmaW5lZCBmb3IgYSBjb21wb25lbnQgTFZpZXcnKTtcbiAgICBsTm9kZVRvSGFuZGxlID0gbE5vZGVUb0hhbmRsZVtIT1NUXSAhO1xuICB9XG4gIGNvbnN0IHJOb2RlOiBSTm9kZSA9IHVud3JhcFJOb2RlKGxOb2RlVG9IYW5kbGUpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShyTm9kZSk7XG5cbiAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCAhLCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlciwgck5vZGUsIGlzQ29tcG9uZW50KTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5kZXN0cm95Tm9kZSAhKHJOb2RlKTtcbiAgfVxuICBpZiAobENvbnRhaW5lciAhPSBudWxsKSB7XG4gICAgZXhlY3V0ZUFjdGlvbk9uQ29udGFpbmVyKHJlbmRlcmVyLCBhY3Rpb24sIGxDb250YWluZXIsIHBhcmVudCwgYmVmb3JlTm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHZhbHVlOiBhbnksIHJlbmRlcmVyOiBSZW5kZXJlcjMpOiBSVGV4dCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZVRleHROb2RlKHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIEFkZHMgb3IgcmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gaW5zZXJ0TW9kZSBXaGV0aGVyIG9yIG5vdCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgKGlmIGZhbHNlLCByZW1vdmluZylcbiAqIEBwYXJhbSBiZWZvcmVOb2RlIFRoZSBub2RlIGJlZm9yZSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQsIGlmIGluc2VydCBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBsVmlldzogTFZpZXcsIGluc2VydE1vZGU6IHRydWUsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXc6IExWaWV3LCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgbFZpZXc6IExWaWV3LCBpbnNlcnRNb2RlOiBib29sZWFuLCBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldENvbnRhaW5lclJlbmRlclBhcmVudChsVmlld1tUVklFV10ubm9kZSBhcyBUVmlld05vZGUsIGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxWaWV3W1RWSUVXXS5ub2RlIGFzIFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gIGlmIChyZW5kZXJQYXJlbnQpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBhY3Rpb24gPSBpbnNlcnRNb2RlID8gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQgOiBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaDtcbiAgICBleGVjdXRlQWN0aW9uT25WaWV3KHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogRGV0YWNoIGEgYExWaWV3YCBmcm9tIHRoZSBET00gYnkgZGV0YWNoaW5nIGl0cyBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2AgdG8gYmUgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZXRhY2hWaWV3KGxWaWV3OiBMVmlldykge1xuICBleGVjdXRlQWN0aW9uT25WaWV3KGxWaWV3W1JFTkRFUkVSXSwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIGxWaWV3LCBudWxsLCBudWxsKTtcbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgbGV0IGxWaWV3T3JMQ29udGFpbmVyID0gcm9vdFZpZXdbQ0hJTERfSEVBRF07XG4gIGlmICghbFZpZXdPckxDb250YWluZXIpIHtcbiAgICByZXR1cm4gY2xlYW5VcFZpZXcocm9vdFZpZXcpO1xuICB9XG5cbiAgd2hpbGUgKGxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3fExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikpIHtcbiAgICAgIC8vIElmIExWaWV3LCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgbmV4dCA9IGxWaWV3T3JMQ29udGFpbmVyW0NISUxEX0hFQURdO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsVmlld09yTENvbnRhaW5lcik7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3LlxuICAgICAgY29uc3QgZmlyc3RWaWV3OiBMVmlld3x1bmRlZmluZWQgPSBsVmlld09yTENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF07XG4gICAgICBpZiAoZmlyc3RWaWV3KSBuZXh0ID0gZmlyc3RWaWV3O1xuICAgIH1cblxuICAgIGlmICghbmV4dCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlIChsVmlld09yTENvbnRhaW5lciAmJiAhbFZpZXdPckxDb250YWluZXIgIVtORVhUXSAmJiBsVmlld09yTENvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgICBsVmlld09yTENvbnRhaW5lciA9IGdldFBhcmVudFN0YXRlKGxWaWV3T3JMQ29udGFpbmVyLCByb290Vmlldyk7XG4gICAgICB9XG4gICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lciB8fCByb290Vmlldyk7XG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXIgJiYgbFZpZXdPckxDb250YWluZXIgIVtORVhUXTtcbiAgICB9XG4gICAgbFZpZXdPckxDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBpbmRleCBXaGljaCBpbmRleCBpbiB0aGUgY29udGFpbmVyIHRvIGluc2VydCB0aGUgY2hpbGQgdmlldyBpbnRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KGxWaWV3OiBMVmlldywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgaW5kZXg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3QgaW5kZXhJbkNvbnRhaW5lciA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgaW5kZXg7XG4gIGNvbnN0IGNvbnRhaW5lckxlbmd0aCA9IGxDb250YWluZXIubGVuZ3RoO1xuXG4gIGlmIChpbmRleCA+IDApIHtcbiAgICAvLyBUaGlzIGlzIGEgbmV3IHZpZXcsIHdlIG5lZWQgdG8gYWRkIGl0IHRvIHRoZSBjaGlsZHJlbi5cbiAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IGxWaWV3O1xuICB9XG4gIGlmIChpbmRleCA8IGNvbnRhaW5lckxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKSB7XG4gICAgbFZpZXdbTkVYVF0gPSBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXJdO1xuICAgIGFkZFRvQXJyYXkobENvbnRhaW5lciwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyBpbmRleCwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIGxDb250YWluZXIucHVzaChsVmlldyk7XG4gICAgbFZpZXdbTkVYVF0gPSBudWxsO1xuICB9XG5cbiAgbFZpZXdbUEFSRU5UXSA9IGxDb250YWluZXI7XG5cbiAgLy8gdHJhY2sgdmlld3Mgd2hlcmUgZGVjbGFyYXRpb24gYW5kIGluc2VydGlvbiBwb2ludHMgYXJlIGRpZmZlcmVudFxuICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSBsVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbnVsbCAmJiBsQ29udGFpbmVyICE9PSBkZWNsYXJhdGlvbkxDb250YWluZXIpIHtcbiAgICB0cmFja01vdmVkVmlldyhkZWNsYXJhdGlvbkxDb250YWluZXIsIGxWaWV3KTtcbiAgfVxuXG4gIC8vIG5vdGlmeSBxdWVyeSB0aGF0IGEgbmV3IHZpZXcgaGFzIGJlZW4gYWRkZWRcbiAgY29uc3QgbFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgbFF1ZXJpZXMuaW5zZXJ0VmlldyhsVmlld1tUVklFV10pO1xuICB9XG5cbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBUcmFjayB2aWV3cyBjcmVhdGVkIGZyb20gdGhlIGRlY2xhcmF0aW9uIGNvbnRhaW5lciAoVGVtcGxhdGVSZWYpIGFuZCBpbnNlcnRlZCBpbnRvIGFcbiAqIGRpZmZlcmVudCBMQ29udGFpbmVyLlxuICovXG5mdW5jdGlvbiB0cmFja01vdmVkVmlldyhkZWNsYXJhdGlvbkNvbnRhaW5lcjogTENvbnRhaW5lciwgbFZpZXc6IExWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uQ29udGFpbmVyKTtcbiAgY29uc3QgZGVjbGFyZWRWaWV3cyA9IGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXTtcbiAgaWYgKGRlY2xhcmVkVmlld3MgPT09IG51bGwpIHtcbiAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10gPSBbbFZpZXddO1xuICB9IGVsc2Uge1xuICAgIGRlY2xhcmVkVmlld3MucHVzaChsVmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyOiBMQ29udGFpbmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10sXG4gICAgICAgICAgICAgICAgICAgJ0EgcHJvamVjdGVkIHZpZXcgc2hvdWxkIGJlbG9uZyB0byBhIG5vbi1lbXB0eSBwcm9qZWN0ZWQgdmlld3MgY29sbGVjdGlvbicpO1xuICBjb25zdCBwcm9qZWN0ZWRWaWV3cyA9IGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSAhO1xuICBjb25zdCBkZWNsYXJlZFZpZXdJbmRleCA9IHByb2plY3RlZFZpZXdzLmluZGV4T2YobFZpZXcpO1xuICBwcm9qZWN0ZWRWaWV3cy5zcGxpY2UoZGVjbGFyZWRWaWV3SW5kZXgsIDEpO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHJlbW92ZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgRGV0YWNoZWQgTFZpZXcgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld3x1bmRlZmluZWQge1xuICBpZiAobENvbnRhaW5lci5sZW5ndGggPD0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHJldHVybjtcblxuICBjb25zdCBpbmRleEluQ29udGFpbmVyID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyByZW1vdmVJbmRleDtcbiAgY29uc3Qgdmlld1RvRGV0YWNoID0gbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyXTtcblxuICBpZiAodmlld1RvRGV0YWNoKSB7XG4gICAgY29uc3QgZGVjbGFyYXRpb25MQ29udGFpbmVyID0gdmlld1RvRGV0YWNoW0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICAgIGlmIChkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IG51bGwgJiYgZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBsQ29udGFpbmVyKSB7XG4gICAgICBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25MQ29udGFpbmVyLCB2aWV3VG9EZXRhY2gpO1xuICAgIH1cblxuXG4gICAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgICAgbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyIC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXc7XG4gICAgfVxuICAgIGNvbnN0IHJlbW92ZWRMVmlldyA9IHJlbW92ZUZyb21BcnJheShsQ29udGFpbmVyLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHJlbW92ZUluZGV4KTtcbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih2aWV3VG9EZXRhY2gsIGZhbHNlKTtcblxuICAgIC8vIG5vdGlmeSBxdWVyeSB0aGF0IGEgdmlldyBoYXMgYmVlbiByZW1vdmVkXG4gICAgY29uc3QgbFF1ZXJpZXMgPSByZW1vdmVkTFZpZXdbUVVFUklFU107XG4gICAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICBsUXVlcmllcy5kZXRhY2hWaWV3KHJlbW92ZWRMVmlld1tUVklFV10pO1xuICAgIH1cblxuICAgIHZpZXdUb0RldGFjaFtQQVJFTlRdID0gbnVsbDtcbiAgICB2aWV3VG9EZXRhY2hbTkVYVF0gPSBudWxsO1xuICAgIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICAgIHZpZXdUb0RldGFjaFtGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG4gIH1cbiAgcmV0dXJuIHZpZXdUb0RldGFjaDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLCBpLmUuIGRldGFjaGVzIGl0IGFuZCB0aGVuIGRlc3Ryb3lzIHRoZSB1bmRlcmx5aW5nIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byByZW1vdmUgYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIHJlbW92ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlldyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCByZW1vdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IGRldGFjaGVkVmlldyA9IGRldGFjaFZpZXcobENvbnRhaW5lciwgcmVtb3ZlSW5kZXgpO1xuICBkZXRhY2hlZFZpZXcgJiYgZGVzdHJveUxWaWV3KGRldGFjaGVkVmlldyk7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbnVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gYmUgZGVzdHJveWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUxWaWV3KGxWaWV3OiBMVmlldykge1xuICBpZiAoIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgICBleGVjdXRlQWN0aW9uT25WaWV3KHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIGxWaWV3LCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICBkZXN0cm95Vmlld1RyZWUobFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKGxWaWV3T3JMQ29udGFpbmVyOiBMVmlldyB8IExDb250YWluZXIsIHJvb3RWaWV3OiBMVmlldyk6IExWaWV3fFxuICAgIExDb250YWluZXJ8bnVsbCB7XG4gIGxldCB0Tm9kZTtcbiAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpICYmICh0Tm9kZSA9IGxWaWV3T3JMQ29udGFpbmVyW1RfSE9TVF0pICYmXG4gICAgICB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gZ2V0TENvbnRhaW5lcih0Tm9kZSBhcyBUVmlld05vZGUsIGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gbFZpZXdPckxDb250YWluZXJbUEFSRU5UXSA9PT0gcm9vdFZpZXcgPyBudWxsIDogbFZpZXdPckxDb250YWluZXJbUEFSRU5UXTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIG9uRGVzdHJveXMgaG9va3MgZm9yIGFsbCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBpbiBhIGdpdmVuIHZpZXcgYW5kIHRoZW4gcmVtb3ZlcyBhbGxcbiAqIGxpc3RlbmVycy4gTGlzdGVuZXJzIGFyZSByZW1vdmVkIGFzIHRoZSBsYXN0IHN0ZXAgc28gZXZlbnRzIGRlbGl2ZXJlZCBpbiB0aGUgb25EZXN0cm95cyBob29rc1xuICogY2FuIGJlIHByb3BhZ2F0ZWQgdG8gQE91dHB1dCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHZpZXc6IExWaWV3IHwgTENvbnRhaW5lcik6IHZvaWQge1xuICBpZiAoaXNMVmlldyh2aWV3KSAmJiAhKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpKSB7XG4gICAgLy8gVXN1YWxseSB0aGUgQXR0YWNoZWQgZmxhZyBpcyByZW1vdmVkIHdoZW4gdGhlIHZpZXcgaXMgZGV0YWNoZWQgZnJvbSBpdHMgcGFyZW50LCBob3dldmVyXG4gICAgLy8gaWYgaXQncyBhIHJvb3QgdmlldywgdGhlIGZsYWcgd29uJ3QgYmUgdW5zZXQgaGVuY2Ugd2h5IHdlJ3JlIGFsc28gcmVtb3Zpbmcgb24gZGVzdHJveS5cbiAgICB2aWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcblxuICAgIC8vIE1hcmsgdGhlIExWaWV3IGFzIGRlc3Ryb3llZCAqYmVmb3JlKiBleGVjdXRpbmcgdGhlIG9uRGVzdHJveSBob29rcy4gQW4gb25EZXN0cm95IGhvb2tcbiAgICAvLyBydW5zIGFyYml0cmFyeSB1c2VyIGNvZGUsIHdoaWNoIGNvdWxkIGluY2x1ZGUgaXRzIG93biBgdmlld1JlZi5kZXN0cm95KClgIChvciBzaW1pbGFyKS4gSWZcbiAgICAvLyBXZSBkb24ndCBmbGFnIHRoZSB2aWV3IGFzIGRlc3Ryb3llZCBiZWZvcmUgdGhlIGhvb2tzLCB0aGlzIGNvdWxkIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAvLyBUaGlzIGFsc28gYWxpZ25zIHdpdGggdGhlIFZpZXdFbmdpbmUgYmVoYXZpb3IuIEl0IGFsc28gbWVhbnMgdGhhdCB0aGUgb25EZXN0cm95IGhvb2sgaXNcbiAgICAvLyByZWFsbHkgbW9yZSBvZiBhbiBcImFmdGVyRGVzdHJveVwiIGhvb2sgaWYgeW91IHRoaW5rIGFib3V0IGl0LlxuICAgIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xuXG4gICAgZXhlY3V0ZU9uRGVzdHJveXModmlldyk7XG4gICAgcmVtb3ZlTGlzdGVuZXJzKHZpZXcpO1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZpZXdbVF9IT1NUXTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXMgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3W1JFTkRFUkVSXSkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICAodmlld1tSRU5ERVJFUl0gYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uQ29udGFpbmVyID0gdmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIGFuIGVtYmVkZGVkIHZpZXcgdGhhdCBpcyBzdGlsbCBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyXG4gICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSBudWxsICYmIGlzTENvbnRhaW5lcih2aWV3W1BBUkVOVF0pKSB7XG4gICAgICAvLyBhbmQgdGhpcyBpcyBhIHByb2plY3RlZCB2aWV3XG4gICAgICBpZiAoZGVjbGFyYXRpb25Db250YWluZXIgIT09IHZpZXdbUEFSRU5UXSkge1xuICAgICAgICBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXIsIHZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZW1iZWRkZWQgdmlld3Mgc3RpbGwgYXR0YWNoZWQgdG8gYSBjb250YWluZXI6IHJlbW92ZSBxdWVyeSByZXN1bHQgZnJvbSB0aGlzIHZpZXcuXG4gICAgICBjb25zdCBsUXVlcmllcyA9IHZpZXdbUVVFUklFU107XG4gICAgICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgICAgbFF1ZXJpZXMuZGV0YWNoVmlldyh2aWV3W1RWSUVXXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdENsZWFudXAgPSBsVmlld1tUVklFV10uY2xlYW51cDtcbiAgaWYgKHRDbGVhbnVwICE9PSBudWxsKSB7XG4gICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbmF0aXZlIERPTSBsaXN0ZW5lclxuICAgICAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IHRDbGVhbnVwW2kgKyAxXTtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdHlwZW9mIGlkeE9yVGFyZ2V0R2V0dGVyID09PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICAgIGlkeE9yVGFyZ2V0R2V0dGVyKGxWaWV3KSA6XG4gICAgICAgICAgICB1bndyYXBSTm9kZShsVmlld1tpZHhPclRhcmdldEdldHRlcl0pO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAyXV07XG4gICAgICAgIGNvbnN0IHVzZUNhcHR1cmVPclN1YklkeCA9IHRDbGVhbnVwW2kgKyAzXTtcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VDYXB0dXJlT3JTdWJJZHggPT09ICdib29sZWFuJykge1xuICAgICAgICAgIC8vIG5hdGl2ZSBET00gbGlzdGVuZXIgcmVnaXN0ZXJlZCB3aXRoIFJlbmRlcmVyM1xuICAgICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHRDbGVhbnVwW2ldLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZU9yU3ViSWR4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodXNlQ2FwdHVyZU9yU3ViSWR4ID49IDApIHtcbiAgICAgICAgICAgIC8vIHVucmVnaXN0ZXJcbiAgICAgICAgICAgIGxDbGVhbnVwW3VzZUNhcHR1cmVPclN1YklkeF0oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gU3Vic2NyaXB0aW9uXG4gICAgICAgICAgICBsQ2xlYW51cFstdXNlQ2FwdHVyZU9yU3ViSWR4XS51bnN1YnNjcmliZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIHRDbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxWaWV3W0NMRUFOVVBdID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG5cbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzdHJveUhvb2tzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gdmlld1tkZXN0cm95SG9va3NbaV0gYXMgbnVtYmVyXTtcblxuICAgICAgLy8gT25seSBjYWxsIHRoZSBkZXN0cm95IGhvb2sgaWYgdGhlIGNvbnRleHQgaGFzIGJlZW4gcmVxdWVzdGVkLlxuICAgICAgaWYgKCEoY29udGV4dCBpbnN0YW5jZW9mIE5vZGVJbmplY3RvckZhY3RvcnkpKSB7XG4gICAgICAgIChkZXN0cm95SG9va3NbaSArIDFdIGFzKCkgPT4gdm9pZCkuY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIGVsZW1lbnQgaWYgYSBub2RlIGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFkZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlclBhcmVudCh0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICAvLyBOb2RlcyBvZiB0aGUgdG9wLW1vc3QgdmlldyBjYW4gYmUgaW5zZXJ0ZWQgZWFnZXJseS5cbiAgaWYgKGlzUm9vdFZpZXcoY3VycmVudFZpZXcpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZVBhcmVudE5vZGUoY3VycmVudFZpZXdbUkVOREVSRVJdLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBjdXJyZW50VmlldykpO1xuICB9XG5cbiAgLy8gU2tpcCBvdmVyIGVsZW1lbnQgYW5kIElDVSBjb250YWluZXJzIGFzIHRob3NlIGFyZSByZXByZXNlbnRlZCBieSBhIGNvbW1lbnQgbm9kZSBhbmRcbiAgLy8gY2FuJ3QgYmUgdXNlZCBhcyBhIHJlbmRlciBwYXJlbnQuXG4gIGNvbnN0IHBhcmVudCA9IGdldEhpZ2hlc3RFbGVtZW50T3JJQ1VDb250YWluZXIodE5vZGUpO1xuICBjb25zdCByZW5kZXJQYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuXG4gIC8vIElmIHRoZSBwYXJlbnQgaXMgbnVsbCwgdGhlbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zcyB2aWV3czogZWl0aGVyIGludG8gYW4gZW1iZWRkZWQgdmlldyBvciBhXG4gIC8vIGNvbXBvbmVudCB2aWV3LlxuICBpZiAocmVuZGVyUGFyZW50ID09IG51bGwpIHtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdICE7XG4gICAgaWYgKGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiBhbiBlbWJlZGRlZCB2aWV3IFdlIG1pZ2h0IGRlbGF5IGluc2VydGlvbiBvZiBjaGlsZHJlblxuICAgICAgLy8gZm9yIGEgZ2l2ZW4gdmlldyBpZiBpdCBpcyBkaXNjb25uZWN0ZWQuIFRoaXMgbWlnaHQgaGFwcGVuIGZvciAyIG1haW4gcmVhc29uczpcbiAgICAgIC8vIC0gdmlldyBpcyBub3QgaW5zZXJ0ZWQgaW50byBhbnkgY29udGFpbmVyKHZpZXcgd2FzIGNyZWF0ZWQgYnV0IG5vdCBpbnNlcnRlZCB5ZXQpXG4gICAgICAvLyAtIHZpZXcgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBidXQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaXMgbm90IGluc2VydGVkIGludG8gdGhlIERPTVxuICAgICAgLy8gKGNvbnRhaW5lciBtaWdodCBiZSBwYXJ0IG9mIHByb2plY3Rpb24gb3IgY2hpbGQgb2YgYSB2aWV3IHRoYXQgaXMgbm90IGluc2VydGVkIHlldCkuXG4gICAgICAvLyBJbiBvdGhlciB3b3JkcyB3ZSBjYW4gaW5zZXJ0IGNoaWxkcmVuIG9mIGEgZ2l2ZW4gdmlldyBpZiB0aGlzIHZpZXcgd2FzIGluc2VydGVkIGludG8gYVxuICAgICAgLy8gY29udGFpbmVyIGFuZCB0aGUgY29udGFpbmVyIGl0c2VsZiBoYXMgaXRzIHJlbmRlciBwYXJlbnQgZGV0ZXJtaW5lZC5cbiAgICAgIHJldHVybiBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQoaG9zdFROb2RlIGFzIFRWaWV3Tm9kZSwgY3VycmVudFZpZXcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZFxuICAgICAgLy8gaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICAgIHJldHVybiBnZXRIb3N0TmF0aXZlKGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaXNJY3VDYXNlID0gcGFyZW50ICYmIHBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyO1xuICAgIC8vIElmIHRoZSBwYXJlbnQgb2YgdGhpcyBub2RlIGlzIGFuIElDVSBjb250YWluZXIsIHRoZW4gaXQgaXMgcmVwcmVzZW50ZWQgYnkgY29tbWVudCBub2RlIGFuZCB3ZVxuICAgIC8vIG5lZWQgdG8gdXNlIGl0IGFzIGFuIGFuY2hvci4gSWYgaXQgaXMgcHJvamVjdGVkIHRoZW4gaXRzIGRpcmVjdCBwYXJlbnQgbm9kZSBpcyB0aGUgcmVuZGVyZXIuXG4gICAgaWYgKGlzSWN1Q2FzZSAmJiBwYXJlbnQuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzUHJvamVjdGVkKSB7XG4gICAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnQsIGN1cnJlbnRWaWV3KS5wYXJlbnROb2RlIGFzIFJFbGVtZW50O1xuICAgIH1cblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShyZW5kZXJQYXJlbnQsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBpZiAocmVuZGVyUGFyZW50LmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCAmJiAhaXNJY3VDYXNlKSB7XG4gICAgICBjb25zdCB0RGF0YSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtyZW5kZXJQYXJlbnQuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgY29uc3QgZW5jYXBzdWxhdGlvbiA9ICh0RGF0YVt0Tm9kZS5kaXJlY3RpdmVTdGFydF0gYXMgQ29tcG9uZW50RGVmPGFueT4pLmVuY2Fwc3VsYXRpb247XG5cbiAgICAgIC8vIFdlJ3ZlIGdvdCBhIHBhcmVudCB3aGljaCBpcyBhbiBlbGVtZW50IGluIHRoZSBjdXJyZW50IHZpZXcuIFdlIGp1c3QgbmVlZCB0byB2ZXJpZnkgaWYgdGhlXG4gICAgICAvLyBwYXJlbnQgZWxlbWVudCBpcyBub3QgYSBjb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAgICAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gICAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGVuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLiBOb3RlIHRoYXQgd2UgY2FuJ3RcbiAgICAgIC8vIG1ha2UgdGhpcyBhc3N1bXB0aW9uIHdoZW4gdXNpbmcgdGhlIFNoYWRvdyBET00sIGJlY2F1c2UgdGhlIG5hdGl2ZSBwcm9qZWN0aW9uIHBsYWNlaG9sZGVyc1xuICAgICAgLy8gKDxjb250ZW50PiBvciA8c2xvdD4pIGhhdmUgdG8gYmUgaW4gcGxhY2UgYXMgZWxlbWVudHMgYXJlIGJlaW5nIGluc2VydGVkLlxuICAgICAgaWYgKGVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbSAmJlxuICAgICAgICAgIGVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLk5hdGl2ZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShyZW5kZXJQYXJlbnQsIGN1cnJlbnRWaWV3KSBhcyBSRWxlbWVudDtcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgdGhlIG5hdGl2ZSBob3N0IGVsZW1lbnQgZm9yIGEgZ2l2ZW4gdmlldy4gV2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgY3VycmVudCB2aWV3IGRvZXMgbm90IGhhdmVcbiAqIGEgaG9zdCBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBnZXRIb3N0TmF0aXZlKGN1cnJlbnRWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY3VycmVudFZpZXcpO1xuICBjb25zdCBob3N0VE5vZGUgPSBjdXJyZW50Vmlld1tUX0hPU1RdO1xuICByZXR1cm4gaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/XG4gICAgICAoZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGdldExWaWV3UGFyZW50KGN1cnJlbnRWaWV3KSAhKSBhcyBSRWxlbWVudCkgOlxuICAgICAgbnVsbDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJJbnNlcnRCZWZvcmUrKztcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFwcGVuZENoaWxkKys7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQsIGNoaWxkKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKSB7XG4gIGlmIChiZWZvcmVOb2RlICE9PSBudWxsKSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlciwgcGFyZW50LCBjaGlsZCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgYSBub2RlIGZyb20gdGhlIERPTSBnaXZlbiBpdHMgbmF0aXZlIHBhcmVudC4gKi9cbmZ1bmN0aW9uIG5hdGl2ZVJlbW92ZUNoaWxkKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCwgY2hpbGQsIGlzSG9zdEVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHBhcmVudCBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGwge1xuICByZXR1cm4gKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnBhcmVudE5vZGUobm9kZSkgOiBub2RlLnBhcmVudE5vZGUpIGFzIFJFbGVtZW50O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgc2libGluZyBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLm5leHRTaWJsaW5nKG5vZGUpIDogbm9kZS5uZXh0U2libGluZztcbn1cblxuLyoqXG4gKiBGaW5kcyBhIG5hdGl2ZSBcImFuY2hvclwiIG5vZGUgZm9yIGNhc2VzIHdoZXJlIHdlIGNhbid0IGFwcGVuZCBhIG5hdGl2ZSBjaGlsZCBkaXJlY3RseVxuICogKGBhcHBlbmRDaGlsZGApIGFuZCBuZWVkIHRvIHVzZSBhIHJlZmVyZW5jZSAoYW5jaG9yKSBub2RlIGZvciB0aGUgYGluc2VydEJlZm9yZWAgb3BlcmF0aW9uLlxuICogQHBhcmFtIHBhcmVudFROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlQW5jaG9yTm9kZShwYXJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfG51bGwge1xuICBpZiAocGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihwYXJlbnRUTm9kZSBhcyBUVmlld05vZGUsIGxWaWV3KSAhO1xuICAgIGNvbnN0IGluZGV4ID0gbENvbnRhaW5lci5pbmRleE9mKGxWaWV3LCBDT05UQUlORVJfSEVBREVSX09GRlNFVCkgLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgICByZXR1cm4gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXgsIGxDb250YWluZXIpO1xuICB9IGVsc2UgaWYgKFxuICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfHxcbiAgICAgIHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgbmF0aXZlIG5vZGUgKG9yIGEgY29sbGVjdGlvbiBvZiBub2RlcykgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gY2hpbGRFbCBUaGUgbmF0aXZlIGNoaWxkIChvciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgZWxlbWVudFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChjaGlsZEVsOiBSTm9kZSB8IFJOb2RlW10sIGNoaWxkVE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCAhPSBudWxsKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgIGNvbnN0IGFuY2hvck5vZGUgPSBnZXROYXRpdmVBbmNob3JOb2RlKHBhcmVudFROb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRFbCkpIHtcbiAgICAgIGZvciAobGV0IG5hdGl2ZU5vZGUgb2YgY2hpbGRFbCkge1xuICAgICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50LCBuYXRpdmVOb2RlLCBhbmNob3JOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCwgY2hpbGRFbCwgYW5jaG9yTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdG9wLWxldmVsIGVsZW1lbnQgb3IgYW4gSUNVIGNvbnRhaW5lciBpZiB0aG9zZSBjb250YWluZXJzIGFyZSBuZXN0ZWQuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGFydGluZyBUTm9kZSBmb3Igd2hpY2ggd2Ugc2hvdWxkIHNraXAgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnNcbiAqIEByZXR1cm5zIFRoZSBUTm9kZSBvZiB0aGUgaGlnaGVzdCBsZXZlbCBJQ1UgY29udGFpbmVyIG9yIGVsZW1lbnQgY29udGFpbmVyXG4gKi9cbmZ1bmN0aW9uIGdldEhpZ2hlc3RFbGVtZW50T3JJQ1VDb250YWluZXIodE5vZGU6IFROb2RlKTogVE5vZGUge1xuICB3aGlsZSAodE5vZGUucGFyZW50ICE9IG51bGwgJiYgKHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHROb2RlLnBhcmVudC50eXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKSkge1xuICAgIHROb2RlID0gdE5vZGUucGFyZW50O1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KHZpZXdJbmRleEluQ29udGFpbmVyOiBudW1iZXIsIGxDb250YWluZXI6IExDb250YWluZXIpOiBSTm9kZXxcbiAgICBudWxsIHtcbiAgY29uc3QgbmV4dFZpZXdJbmRleCA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgdmlld0luZGV4SW5Db250YWluZXIgKyAxO1xuICBpZiAobmV4dFZpZXdJbmRleCA8IGxDb250YWluZXIubGVuZ3RoKSB7XG4gICAgY29uc3QgbFZpZXcgPSBsQ29udGFpbmVyW25leHRWaWV3SW5kZXhdIGFzIExWaWV3O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1RfSE9TVF0sICdNaXNzaW5nIEhvc3QgVE5vZGUnKTtcbiAgICBjb25zdCB0Vmlld05vZGVDaGlsZCA9IChsVmlld1tUX0hPU1RdIGFzIFRWaWV3Tm9kZSkuY2hpbGQ7XG4gICAgcmV0dXJuIHRWaWV3Tm9kZUNoaWxkICE9PSBudWxsID8gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Vmlld05vZGVDaGlsZCwgbFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsQ29udGFpbmVyW05BVElWRV07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGxDb250YWluZXJbTkFUSVZFXTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBuYXRpdmUgbm9kZSBpdHNlbGYgdXNpbmcgYSBnaXZlbiByZW5kZXJlci4gVG8gcmVtb3ZlIHRoZSBub2RlIHdlIGFyZSBsb29raW5nIHVwIGl0c1xuICogcGFyZW50IGZyb20gdGhlIG5hdGl2ZSB0cmVlIGFzIG5vdCBhbGwgcGxhdGZvcm1zIC8gYnJvd3NlcnMgc3VwcG9ydCB0aGUgZXF1aXZhbGVudCBvZlxuICogbm9kZS5yZW1vdmUoKS5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byBiZSB1c2VkXG4gKiBAcGFyYW0gck5vZGUgVGhlIG5hdGl2ZSBub2RlIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBpc0hvc3RFbGVtZW50IEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgbm9kZSB0byBiZSByZW1vdmVkIGlzIGEgaG9zdCBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgck5vZGU6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBuYXRpdmVQYXJlbnQgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCByTm9kZSk7XG4gIGlmIChuYXRpdmVQYXJlbnQpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChyZW5kZXJlciwgbmF0aXZlUGFyZW50LCByTm9kZSwgaXNIb3N0RWxlbWVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIG5vZGVzIHRvIGEgdGFyZ2V0IHByb2plY3Rpb24gcGxhY2UuIE5vZGVzIHRvIGluc2VydCB3ZXJlIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0aW9uIGFuZFxuICogc3RvcmVkIG9uIGEgY29tcG9uZW50IGhvc3QgbGV2ZWwuXG4gKiBAcGFyYW0gbFZpZXcgQSBMVmlldyB3aGVyZSBub2RlcyBhcmUgaW5zZXJ0ZWQgKHRhcmdldCBMVmlldylcbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgQSBwcm9qZWN0aW9uIG5vZGUgd2hlcmUgcHJldmlvdXNseSByZS1kaXN0cmlidXRpb24gc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiAodGFyZ2V0IGluc2VydGlvbiBwbGFjZSlcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4IEEgYnVja2V0IGZyb20gd2hlcmUgbm9kZXMgdG8gcHJvamVjdCBzaG91bGQgYmUgdGFrZW5cbiAqIEBwYXJhbSBjb21wb25lbnRWaWV3IEEgd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBpbml0aWFsbHkgY3JlYXRlZCAoc291cmNlIHZpZXcpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRQcm9qZWN0ZWROb2RlcyhcbiAgICBsVmlldzogTFZpZXcsIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlLCBzZWxlY3RvckluZGV4OiBudW1iZXIsXG4gICAgY29tcG9uZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcHJvamVjdGVkVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICBsZXQgbm9kZVRvUHJvamVjdCA9IChjb21wb25lbnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtzZWxlY3RvckluZGV4XTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlVG9Qcm9qZWN0KSkge1xuICAgIGFwcGVuZENoaWxkKG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgICBpZiAoIShub2RlVG9Qcm9qZWN0LmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSkge1xuICAgICAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGVzKFxuICAgICAgICAgICAgICBsVmlldywgdFByb2plY3Rpb25Ob2RlLCAobm9kZVRvUHJvamVjdCBhcyBUUHJvamVjdGlvbk5vZGUpLnByb2plY3Rpb24sXG4gICAgICAgICAgICAgIGZpbmRDb21wb25lbnRWaWV3KHByb2plY3RlZFZpZXcpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUaGlzIGZsYWcgbXVzdCBiZSBzZXQgbm93IG9yIHdlIHdvbid0IGtub3cgdGhhdCB0aGlzIG5vZGUgaXMgcHJvamVjdGVkXG4gICAgICAgICAgLy8gaWYgdGhlIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGxhdGVyLlxuICAgICAgICAgIG5vZGVUb1Byb2plY3QuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcbiAgICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcsIHByb2plY3RlZFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5wcm9qZWN0aW9uTmV4dDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBMb29wcyBvdmVyIGFsbCBjaGlsZHJlbiBvZiBhIFROb2RlIGNvbnRhaW5lciBhbmQgYXBwZW5kcyB0aGVtIHRvIHRoZSBET01cbiAqXG4gKiBAcGFyYW0gbmdDb250YWluZXJDaGlsZFROb2RlIFRoZSBmaXJzdCBjaGlsZCBvZiB0aGUgVE5vZGUgY29udGFpbmVyXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIFRoZSBwcm9qZWN0aW9uIChuZy1jb250ZW50KSBUTm9kZVxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBwcm9qZWN0aW9uVmlldyBQcm9qZWN0aW9uIHZpZXcgKHZpZXcgYWJvdmUgY3VycmVudClcbiAqL1xuZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkQ2hpbGRyZW4oXG4gICAgbmdDb250YWluZXJDaGlsZFROb2RlOiBUTm9kZSB8IG51bGwsIHRQcm9qZWN0aW9uTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyxcbiAgICBwcm9qZWN0aW9uVmlldzogTFZpZXcpIHtcbiAgd2hpbGUgKG5nQ29udGFpbmVyQ2hpbGRUTm9kZSkge1xuICAgIGFwcGVuZFByb2plY3RlZE5vZGUobmdDb250YWluZXJDaGlsZFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3LCBwcm9qZWN0aW9uVmlldyk7XG4gICAgbmdDb250YWluZXJDaGlsZFROb2RlID0gbmdDb250YWluZXJDaGlsZFROb2RlLm5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0ZWRUTm9kZSBUaGUgVE5vZGUgdG8gYmUgcHJvamVjdGVkXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIFRoZSBwcm9qZWN0aW9uIChuZy1jb250ZW50KSBUTm9kZVxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBwcm9qZWN0aW9uVmlldyBQcm9qZWN0aW9uIHZpZXcgKHZpZXcgYWJvdmUgY3VycmVudClcbiAqL1xuZnVuY3Rpb24gYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICBwcm9qZWN0ZWRUTm9kZTogVE5vZGUsIHRQcm9qZWN0aW9uTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyxcbiAgICBwcm9qZWN0aW9uVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcm9qZWN0ZWRUTm9kZSwgcHJvamVjdGlvblZpZXcpO1xuICBhcHBlbmRDaGlsZChuYXRpdmUsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcpO1xuXG4gIC8vIHRoZSBwcm9qZWN0ZWQgY29udGVudHMgYXJlIHByb2Nlc3NlZCB3aGlsZSBpbiB0aGUgc2hhZG93IHZpZXcgKHdoaWNoIGlzIHRoZSBjdXJyZW50VmlldylcbiAgLy8gdGhlcmVmb3JlIHdlIG5lZWQgdG8gZXh0cmFjdCB0aGUgdmlldyB3aGVyZSB0aGUgaG9zdCBlbGVtZW50IGxpdmVzIHNpbmNlIGl0J3MgdGhlXG4gIC8vIGxvZ2ljYWwgY29udGFpbmVyIG9mIHRoZSBjb250ZW50IHByb2plY3RlZCB2aWV3c1xuICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBwcm9qZWN0aW9uVmlldyk7XG5cbiAgY29uc3Qgbm9kZU9yQ29udGFpbmVyID0gcHJvamVjdGlvblZpZXdbcHJvamVjdGVkVE5vZGUuaW5kZXhdO1xuICBpZiAocHJvamVjdGVkVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIFRoZSBub2RlIHdlIGFyZSBhZGRpbmcgaXMgYSBjb250YWluZXIgYW5kIHdlIGFyZSBhZGRpbmcgaXQgdG8gYW4gZWxlbWVudCB3aGljaFxuICAgIC8vIGlzIG5vdCBhIGNvbXBvbmVudCAobm8gbW9yZSByZS1wcm9qZWN0aW9uKS5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5IGEgY29udGFpbmVyIGlzIHByb2plY3RlZCBhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCdzIHRlbXBsYXRlXG4gICAgLy8gYW5kIGNhbid0IGJlIHJlLXByb2plY3RlZCAoYXMgbm90IGNvbnRlbnQgb2YgYW55IGNvbXBvbmVudCkuXG4gICAgLy8gQXNzaWduIHRoZSBmaW5hbCBwcm9qZWN0aW9uIGxvY2F0aW9uIGluIHRob3NlIGNhc2VzLlxuICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IG5vZGVPckNvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobm9kZU9yQ29udGFpbmVyW2ldLCB0cnVlLCBub2RlT3JDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHByb2plY3RlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICAvLyBUaGUgbm9kZSB3ZSBhcmUgYWRkaW5nIGlzIGFuIElDVSBjb250YWluZXIgd2hpY2ggaXMgd2h5IHdlIGFsc28gbmVlZCB0byBwcm9qZWN0IGFsbCB0aGVcbiAgICAvLyBjaGlsZHJlbiBub2RlcyB0aGF0IG1pZ2h0IGhhdmUgYmVlbiBjcmVhdGVkIHByZXZpb3VzbHkgYW5kIGFyZSBsaW5rZWQgdG8gdGhpcyBhbmNob3JcbiAgICBsZXQgbmdDb250YWluZXJDaGlsZFROb2RlOiBUTm9kZXxudWxsID0gcHJvamVjdGVkVE5vZGUuY2hpbGQgYXMgVE5vZGU7XG4gICAgYXBwZW5kUHJvamVjdGVkQ2hpbGRyZW4oXG4gICAgICAgIG5nQ29udGFpbmVyQ2hpbGRUTm9kZSwgbmdDb250YWluZXJDaGlsZFROb2RlLCBwcm9qZWN0aW9uVmlldywgcHJvamVjdGlvblZpZXcpO1xuICB9IGVsc2Uge1xuICAgIGlmIChwcm9qZWN0ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgYXBwZW5kUHJvamVjdGVkQ2hpbGRyZW4ocHJvamVjdGVkVE5vZGUuY2hpbGQsIHRQcm9qZWN0aW9uTm9kZSwgY3VycmVudFZpZXcsIHByb2plY3Rpb25WaWV3KTtcbiAgICB9XG5cbiAgICBpZiAoaXNMQ29udGFpbmVyKG5vZGVPckNvbnRhaW5lcikpIHtcbiAgICAgIGFwcGVuZENoaWxkKG5vZGVPckNvbnRhaW5lcltOQVRJVkVdLCB0UHJvamVjdGlvbk5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIGBleGVjdXRlQWN0aW9uT25WaWV3YCBwZXJmb3JtcyBhbiBvcGVyYXRpb24gb24gdGhlIHZpZXcgYXMgc3BlY2lmaWVkIGluIGBhY3Rpb25gIChpbnNlcnQsIGRldGFjaCxcbiAqIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgdmlldyB3aXRob3V0IHByb2plY3Rpb24gb3IgY29udGFpbmVycyBhdCB0b3AgbGV2ZWwgaXMgc2ltcGxlLiBKdXN0IGl0ZXJhdGUgb3ZlciB0aGVcbiAqIHJvb3Qgbm9kZXMgb2YgdGhlIFZpZXcsIGFuZCBmb3IgZWFjaCBub2RlIHBlcmZvcm0gdGhlIGBhY3Rpb25gLlxuICpcbiAqIFRoaW5ncyBnZXQgbW9yZSBjb21wbGljYXRlZCB3aXRoIGNvbnRhaW5lcnMgYW5kIHByb2plY3Rpb25zLiBUaGF0IGlzIGJlY2F1c2UgY29taW5nIGFjcm9zczpcbiAqIC0gQ29udGFpbmVyOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIHZpZXdzIG9mIHRoYXQgY29udGFpbmVyIGFzIHdlbGxcbiAqICAgICAgICAgICAgICB3aGljaCBpbiB0dXJuIGNhbiBoYXZlIHRoZWlyIG93biBDb250YWluZXJzIGF0IHRoZSBWaWV3IHJvb3RzLlxuICogLSBQcm9qZWN0aW9uOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIG5vZGVzIG9mIHRoZSBwcm9qZWN0aW9uLiBUaGVcbiAqICAgICAgICAgICAgICAgY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhlIG5vZGVzIHdlIGFyZSBwcm9qZWN0aW5nIGNhbiB0aGVtc2VsdmVzIGhhdmUgQ29udGFpbmVyc1xuICogICAgICAgICAgICAgICBvciBvdGhlciBQcm9qZWN0aW9ucy5cbiAqXG4gKiBBcyB5b3UgY2FuIHNlZSB0aGlzIGlzIGEgdmVyeSByZWN1cnNpdmUgcHJvYmxlbS4gV2hpbGUgdGhlIHJlY3Vyc2l2ZSBpbXBsZW1lbnRhdGlvbiBpcyBub3QgdGhlXG4gKiBtb3N0IGVmZmljaWVudCBvbmUsIHRyeWluZyB0byB1bnJvbGwgdGhlIG5vZGVzIG5vbi1yZWN1cnNpdmVseSByZXN1bHRzIGluIHZlcnkgY29tcGxleCBjb2RlIHRoYXRcbiAqIGlzIHZlcnkgaGFyZCAodG8gbWFpbnRhaW4pLiBXZSBhcmUgc2FjcmlmaWNpbmcgYSBiaXQgb2YgcGVyZm9ybWFuY2UgZm9yIHJlYWRhYmlsaXR5IHVzaW5nIGFcbiAqIHJlY3Vyc2l2ZSBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50IHBhcmVudCBET00gZWxlbWVudCBmb3IgaW5zZXJ0aW9uL3JlbW92YWwuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBCZWZvcmUgd2hpY2ggbm9kZSB0aGUgaW5zZXJ0aW9ucyBzaG91bGQgaGFwcGVuLlxuICovXG5mdW5jdGlvbiBleGVjdXRlQWN0aW9uT25WaWV3KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbFZpZXc6IExWaWV3LCByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh0Vmlldy5ub2RlICEsIFROb2RlVHlwZS5WaWV3KTtcbiAgbGV0IHZpZXdSb290VE5vZGU6IFROb2RlfG51bGwgPSB0Vmlldy5ub2RlICEuY2hpbGQ7XG4gIHdoaWxlICh2aWV3Um9vdFROb2RlICE9PSBudWxsKSB7XG4gICAgZXhlY3V0ZUFjdGlvbk9uTm9kZShyZW5kZXJlciwgYWN0aW9uLCBsVmlldywgdmlld1Jvb3RUTm9kZSwgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlKTtcbiAgICB2aWV3Um9vdFROb2RlID0gdmlld1Jvb3RUTm9kZS5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogYGV4ZWN1dGVBY3Rpb25PblByb2plY3Rpb25gIHBlcmZvcm1zIGFuIG9wZXJhdGlvbiBvbiB0aGUgcHJvamVjdGlvbiBzcGVjaWZpZWQgYnkgYGFjdGlvbmBcbiAqIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSkuXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIHByb2plY3Rpb24gVE5vZGUgdG8gcHJvY2Vzc1xuICogQHBhcmFtIHJlbmRlclBhcmVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbk9uUHJvamVjdGlvbihcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxWaWV3OiBMVmlldyxcbiAgICB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSwgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gZmluZENvbXBvbmVudFZpZXcobFZpZXcpO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50TFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5vZGUucHJvamVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAnRWxlbWVudCBub2RlcyBmb3Igd2hpY2ggcHJvamVjdGlvbiBpcyBwcm9jZXNzZWQgbXVzdCBoYXZlIHByb2plY3Rpb24gZGVmaW5lZC4nKTtcbiAgY29uc3Qgbm9kZVRvUHJvamVjdCA9IGNvbXBvbmVudE5vZGUucHJvamVjdGlvbiAhW3RQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uXTtcbiAgaWYgKG5vZGVUb1Byb2plY3QgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG5vZGVUb1Byb2plY3QpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVUb1Byb2plY3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgck5vZGUgPSBub2RlVG9Qcm9qZWN0W2ldO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShyTm9kZSk7XG4gICAgICAgIGV4ZWN1dGVBY3Rpb25PbkVsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIHJOb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHByb2plY3Rpb25UTm9kZTogVE5vZGV8bnVsbCA9IG5vZGVUb1Byb2plY3Q7XG4gICAgICBjb25zdCBwcm9qZWN0ZWRDb21wb25lbnRMVmlldyA9IGNvbXBvbmVudExWaWV3W1BBUkVOVF0gYXMgTFZpZXc7XG4gICAgICB3aGlsZSAocHJvamVjdGlvblROb2RlICE9PSBudWxsKSB7XG4gICAgICAgIGV4ZWN1dGVBY3Rpb25Pbk5vZGUoXG4gICAgICAgICAgICByZW5kZXJlciwgYWN0aW9uLCBwcm9qZWN0ZWRDb21wb25lbnRMVmlldywgcHJvamVjdGlvblROb2RlLCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICAgICAgICBwcm9qZWN0aW9uVE5vZGUgPSBwcm9qZWN0aW9uVE5vZGUucHJvamVjdGlvbk5leHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBgZXhlY3V0ZUFjdGlvbk9uQ29udGFpbmVyYCBwZXJmb3JtcyBhbiBvcGVyYXRpb24gb24gdGhlIGNvbnRhaW5lciBhbmQgaXRzIHZpZXdzIGFzIHNwZWNpZmllZCBieVxuICogYGFjdGlvbmAgKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIENvbnRhaW5lciBpcyBjb21wbGljYXRlZCBieSB0aGUgZmFjdCB0aGF0IHRoZSBjb250YWluZXIgbWF5IGhhdmUgVmlld3Mgd2hpY2hcbiAqIHRoZW1zZWx2ZXMgaGF2ZSBjb250YWluZXJzIG9yIHByb2plY3Rpb25zLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIExDb250YWluZXIgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50IHBhcmVudCBET00gZWxlbWVudCBmb3IgaW5zZXJ0aW9uL3JlbW92YWwuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBCZWZvcmUgd2hpY2ggbm9kZSB0aGUgaW5zZXJ0aW9ucyBzaG91bGQgaGFwcGVuLlxuICovXG5mdW5jdGlvbiBleGVjdXRlQWN0aW9uT25Db250YWluZXIoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgIHJlbmRlclBhcmVudDogUkVsZW1lbnQgfCBudWxsLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG4gIGNvbnN0IGFuY2hvciA9IGxDb250YWluZXJbTkFUSVZFXTsgIC8vIExDb250YWluZXIgaGFzIGl0cyBvd24gYmVmb3JlIG5vZGUuXG4gIGNvbnN0IG5hdGl2ZSA9IHVud3JhcFJOb2RlKGxDb250YWluZXIpO1xuICAvLyBBbiBMQ29udGFpbmVyIGNhbiBiZSBjcmVhdGVkIGR5bmFtaWNhbGx5IG9uIGFueSBub2RlIGJ5IGluamVjdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICAvLyBBc2tpbmcgZm9yIGEgVmlld0NvbnRhaW5lclJlZiBvbiBhbiBlbGVtZW50IHdpbGwgcmVzdWx0IGluIGEgY3JlYXRpb24gb2YgYSBzZXBhcmF0ZSBhbmNob3Igbm9kZVxuICAvLyAoY29tbWVudCBpbiB0aGUgRE9NKSB0aGF0IHdpbGwgYmUgZGlmZmVyZW50IGZyb20gdGhlIExDb250YWluZXIncyBob3N0IG5vZGUuIEluIHRoaXMgcGFydGljdWxhclxuICAvLyBjYXNlIHdlIG5lZWQgdG8gZXhlY3V0ZSBhY3Rpb24gb24gMiBub2RlczpcbiAgLy8gLSBjb250YWluZXIncyBob3N0IG5vZGUgKHRoaXMgaXMgZG9uZSBpbiB0aGUgZXhlY3V0ZU5vZGVBY3Rpb24pXG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaGVyZSlcbiAgaWYgKGFuY2hvciAhPT0gbmF0aXZlKSB7XG4gICAgZXhlY3V0ZUFjdGlvbk9uRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgYW5jaG9yLCBiZWZvcmVOb2RlKTtcbiAgfVxuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuICAgIGV4ZWN1dGVBY3Rpb25PblZpZXcocmVuZGVyZXIsIGFjdGlvbiwgbFZpZXcsIHJlbmRlclBhcmVudCwgYW5jaG9yKTtcbiAgfVxufVxuXG5cbi8qKlxuICogYGV4ZWN1dGVBY3Rpb25PbkVsZW1lbnRDb250YWluZXJPckljdUNvbnRhaW5lcmAgcGVyZm9ybXMgYW4gb3BlcmF0aW9uIG9uIHRoZSBuZy1jb250YWluZXIgbm9kZVxuICogYW5kIGl0cyBjaGlsZCBub2RlcyBhcyBzcGVjaWZpZWQgYnkgdGhlIGBhY3Rpb25gIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSkuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSBhc3NvY2lhdGVkIHdpdGggdGhlIGBFbGVtZW50Q29udGFpbmVyYCBvciBgSWN1Q29udGFpbmVyYC5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGV4ZWN1dGVBY3Rpb25PbkVsZW1lbnRDb250YWluZXJPckljdUNvbnRhaW5lcihcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxWaWV3OiBMVmlldyxcbiAgICB0Tm9kZTogVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVEljdUNvbnRhaW5lck5vZGUsIHJlbmRlclBhcmVudDogUkVsZW1lbnQgfCBudWxsLFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBjb25zdCBub2RlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBleGVjdXRlQWN0aW9uT25FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBub2RlLCBiZWZvcmVOb2RlKTtcbiAgbGV0IGNoaWxkVE5vZGU6IFROb2RlfG51bGwgPSB0Tm9kZS5jaGlsZDtcbiAgd2hpbGUgKGNoaWxkVE5vZGUpIHtcbiAgICBleGVjdXRlQWN0aW9uT25Ob2RlKHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCBjaGlsZFROb2RlLCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICAgIGNoaWxkVE5vZGUgPSBjaGlsZFROb2RlLm5leHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbk9uTm9kZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLFxuICAgIHJlbmRlclBhcmVudDogUkVsZW1lbnQgfCBudWxsLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3Qgbm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICBpZiAoISh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkpIHtcbiAgICBpZiAobm9kZVR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8IG5vZGVUeXBlID09PSBUTm9kZVR5cGUuSWN1Q29udGFpbmVyKSB7XG4gICAgICBleGVjdXRlQWN0aW9uT25FbGVtZW50Q29udGFpbmVyT3JJY3VDb250YWluZXIoXG4gICAgICAgICAgcmVuZGVyZXIsIGFjdGlvbiwgbFZpZXcsIHROb2RlIGFzIFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRJY3VDb250YWluZXJOb2RlLCByZW5kZXJQYXJlbnQsXG4gICAgICAgICAgYmVmb3JlTm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlVHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIGV4ZWN1dGVBY3Rpb25PblByb2plY3Rpb24oXG4gICAgICAgICAgcmVuZGVyZXIsIGFjdGlvbiwgbFZpZXcsIHROb2RlIGFzIFRQcm9qZWN0aW9uTm9kZSwgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICAgIGV4ZWN1dGVBY3Rpb25PbkVsZW1lbnRPckNvbnRhaW5lcihcbiAgICAgICAgICBhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGxWaWV3W3ROb2RlLmluZGV4XSwgYmVmb3JlTm9kZSk7XG4gICAgfVxuICB9XG59XG4iXX0=