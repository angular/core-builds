/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { assertDefined, assertDomNode, assertEqual } from '../util/assert';
import { assertLContainer, assertLView, assertTNodeForLView } from './assert';
import { attachPatchData } from './context_discovery';
import { CONTAINER_HEADER_OFFSET, MOVED_VIEWS, NATIVE, unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { isLContainer, isLView, isRootView } from './interfaces/type_checks';
import { CHILD_HEAD, CLEANUP, DECLARATION_LCONTAINER, FLAGS, HOST, NEXT, PARENT, QUERIES, RENDERER, TVIEW, T_HOST, unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { findComponentView } from './util/view_traversal_utils';
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
export function getContainerRenderParent(tViewNode, view) {
    /** @type {?} */
    const container = getLContainer(tViewNode, view);
    return container ? nativeParentNode(view[RENDERER], container[NATIVE]) : null;
}
/** @enum {number} */
const WalkTNodeTreeAction = {
    /** node create in the native environment. Run on initial creation. */
    Create: 0,
    /**
     * node insert in the native environment.
     * Run when existing node has been detached and needs to be re-attached.
     */
    Insert: 1,
    /** node detach from the native environment */
    Detach: 2,
    /** node destruction using the renderer's API */
    Destroy: 3,
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
function applyToElementOrContainer(action, renderer, parent, lNodeToHandle, beforeNode) {
    // If this slot was allocated for a text node dynamically created by i18n, the text node itself
    // won't be created until i18nApply() in the update block, so this node should be skipped.
    // For more info, see "ICU expressions should work inside an ngTemplateOutlet inside an ngFor"
    // in `i18n_spec.ts`.
    if (lNodeToHandle != null) {
        /** @type {?} */
        let lContainer;
        /** @type {?} */
        let isComponent = false;
        // We are expecting an RNode, but in the case of a component or LContainer the `RNode` is
        // wrapped in an array which needs to be unwrapped. We need to know if it is a component and if
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
        ngDevMode && !isProceduralRenderer(renderer) && assertDomNode(rNode);
        if (action === 0 /* Create */ && parent !== null) {
            if (beforeNode == null) {
                nativeAppendChild(renderer, parent, rNode);
            }
            else {
                nativeInsertBefore(renderer, parent, rNode, beforeNode || null);
            }
        }
        else if (action === 1 /* Insert */ && parent !== null) {
            nativeInsertBefore(renderer, parent, rNode, beforeNode || null);
        }
        else if (action === 2 /* Detach */) {
            nativeRemoveNode(renderer, rNode, isComponent);
        }
        else if (action === 3 /* Destroy */) {
            ngDevMode && ngDevMode.rendererDestroyNode++;
            (/** @type {?} */ (((/** @type {?} */ (renderer))).destroyNode))(rNode);
        }
        if (lContainer != null) {
            applyContainer(renderer, action, lContainer, parent, beforeNode);
        }
    }
}
/**
 * @param {?} value
 * @param {?} renderer
 * @return {?}
 */
export function createTextNode(value, renderer) {
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    ngDevMode && ngDevMode.rendererSetText++;
    return isProceduralRenderer(renderer) ? renderer.createText(value) :
        renderer.createTextNode(value);
}
/**
 * @param {?} lView
 * @param {?} insertMode
 * @param {?} beforeNode
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
        const action = insertMode ? 1 /* Insert */ : 2 /* Detach */;
        applyView(renderer, action, lView, renderParent, beforeNode);
    }
}
/**
 * Detach a `LView` from the DOM by detaching its nodes.
 *
 * @param {?} lView the `LView` to be detached.
 * @return {?}
 */
export function renderDetachView(lView) {
    applyView(lView[RENDERER], 2 /* Detach */, lView, null, null);
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
        addRemoveViewFromContainer(viewToDetach, false, null);
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
            applyView(renderer, 3 /* Destroy */, lView, null, null);
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
    let parentTNode = tNode.parent;
    while (parentTNode != null && (parentTNode.type === 4 /* ElementContainer */ ||
        parentTNode.type === 5 /* IcuContainer */)) {
        tNode = parentTNode;
        parentTNode = tNode.parent;
    }
    // If the parent tNode is null, then we are inserting across views: either into an embedded view
    // or a component view.
    if (parentTNode == null) {
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
            ngDevMode && assertNodeOfPossibleTypes(hostTNode, 3 /* Element */);
            return currentView[HOST];
        }
    }
    else {
        /** @type {?} */
        const isIcuCase = tNode && tNode.type === 5 /* IcuContainer */;
        // If the parent of this node is an ICU container, then it is represented by comment node and we
        // need to use it as an anchor. If it is projected then it's direct parent node is the renderer.
        if (isIcuCase && tNode.flags & 4 /* isProjected */) {
            return (/** @type {?} */ (getNativeByTNode(tNode, currentView).parentNode));
        }
        ngDevMode && assertNodeType(parentTNode, 3 /* Element */);
        if (parentTNode.flags & 2 /* isComponentHost */) {
            /** @type {?} */
            const tData = currentView[TVIEW].data;
            /** @type {?} */
            const tNode = (/** @type {?} */ (tData[parentTNode.index]));
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
        return (/** @type {?} */ (getNativeByTNode(parentTNode, currentView)));
    }
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
    ngDevMode && assertDefined(parent, 'parent node must be defined');
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
        const lContainer = getLContainer((/** @type {?} */ (parentTNode)), lView);
        if (lContainer === null)
            return null;
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
            for (let i = 0; i < childEl.length; i++) {
                nativeAppendOrInsertBefore(renderer, renderParent, childEl[i], anchorNode);
            }
        }
        else {
            nativeAppendOrInsertBefore(renderer, renderParent, childEl, anchorNode);
        }
    }
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
        let tViewNodeChild = ((/** @type {?} */ (lView[T_HOST]))).child;
        if (tViewNodeChild !== null) {
            if (tViewNodeChild.type === 4 /* ElementContainer */ ||
                tViewNodeChild.type === 5 /* IcuContainer */) {
                /** @type {?} */
                let currentChild = tViewNodeChild.child;
                while (currentChild && (currentChild.type === 4 /* ElementContainer */ ||
                    currentChild.type === 5 /* IcuContainer */)) {
                    currentChild = currentChild.child;
                }
                tViewNodeChild = currentChild || tViewNodeChild;
            }
            return getNativeByTNodeOrNull(tViewNodeChild, lView);
        }
    }
    return lContainer[NATIVE];
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
 * Performs the operation of `action` on the node. Typically this involves inserting or removing
 * nodes on the LView or projection boundary.
 * @param {?} renderer
 * @param {?} action
 * @param {?} tNode
 * @param {?} lView
 * @param {?} renderParent
 * @param {?} beforeNode
 * @param {?} isProjection
 * @return {?}
 */
function applyNodes(renderer, action, tNode, lView, renderParent, beforeNode, isProjection) {
    while (tNode != null) {
        ngDevMode && assertTNodeForLView(tNode, lView);
        ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */, 1 /* Projection */, 1 /* Projection */, 5 /* IcuContainer */);
        /** @type {?} */
        const rawSlotValue = lView[tNode.index];
        /** @type {?} */
        const tNodeType = tNode.type;
        if (isProjection) {
            if (action === 0 /* Create */) {
                rawSlotValue && attachPatchData(unwrapRNode(rawSlotValue), lView);
                tNode.flags |= 4 /* isProjected */;
            }
        }
        if ((tNode.flags & 64 /* isDetached */) !== 64 /* isDetached */) {
            if (tNodeType === 4 /* ElementContainer */ || tNodeType === 5 /* IcuContainer */) {
                applyNodes(renderer, action, tNode.child, lView, renderParent, beforeNode, false);
                applyToElementOrContainer(action, renderer, renderParent, rawSlotValue, beforeNode);
            }
            else if (tNodeType === 1 /* Projection */) {
                applyProjectionRecursive(renderer, action, lView, (/** @type {?} */ (tNode)), renderParent, beforeNode);
            }
            else {
                ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */);
                applyToElementOrContainer(action, renderer, renderParent, rawSlotValue, beforeNode);
            }
        }
        tNode = isProjection ? tNode.projectionNext : tNode.next;
    }
}
/**
 * `applyView` performs operation on the view as specified in `action` (insert, detach, destroy)
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
 * As you can see this is a very recursive problem. Yes recursion is not most efficient but the
 * code is complicated enough that trying to implemented with recursion becomes unmaintainable.
 *
 * @param {?} renderer Renderer to use
 * @param {?} action action to perform (insert, detach, destroy)
 * @param {?} lView The LView which needs to be inserted, detached, destroyed.
 * @param {?} renderParent parent DOM element for insertion/removal.
 * @param {?} beforeNode Before which node the insertions should happen.
 * @return {?}
 */
function applyView(renderer, action, lView, renderParent, beforeNode) {
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertNodeType((/** @type {?} */ (tView.node)), 2 /* View */);
    /** @type {?} */
    const viewRootTNode = (/** @type {?} */ (tView.node)).child;
    applyNodes(renderer, action, viewRootTNode, lView, renderParent, beforeNode, false);
}
/**
 * `applyProjection` performs operation on the projection.
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param {?} lView The LView which needs to be inserted, detached, destroyed.
 * @param {?} tProjectionNode node to project
 * @return {?}
 */
export function applyProjection(lView, tProjectionNode) {
    /** @type {?} */
    const renderer = lView[RENDERER];
    /** @type {?} */
    const renderParent = getRenderParent(tProjectionNode, lView);
    /** @type {?} */
    const parentTNode = tProjectionNode.parent || (/** @type {?} */ (lView[T_HOST]));
    /** @type {?} */
    let beforeNode = getNativeAnchorNode(parentTNode, lView);
    applyProjectionRecursive(renderer, 0 /* Create */, lView, tProjectionNode, renderParent, beforeNode);
}
/**
 * `applyProjectionRecursive` performs operation on the projection specified by `action` (insert,
 * detach, destroy)
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param {?} renderer Render to use
 * @param {?} action action to perform (insert, detach, destroy)
 * @param {?} lView The LView which needs to be inserted, detached, destroyed.
 * @param {?} tProjectionNode node to project
 * @param {?} renderParent parent DOM element for insertion/removal.
 * @param {?} beforeNode Before which node the insertions should happen.
 * @return {?}
 */
function applyProjectionRecursive(renderer, action, lView, tProjectionNode, renderParent, beforeNode) {
    /** @type {?} */
    const componentLView = findComponentView(lView);
    /** @type {?} */
    const componentNode = (/** @type {?} */ (componentLView[T_HOST]));
    ngDevMode &&
        assertEqual(typeof tProjectionNode.projection, 'number', 'expecting projection index');
    /** @type {?} */
    const nodeToProjectOrRNodes = (/** @type {?} */ ((/** @type {?} */ (componentNode.projection))[tProjectionNode.projection]));
    if (Array.isArray(nodeToProjectOrRNodes)) {
        // This should not exist, it is a bit of a hack. When we bootstrap a top level node and we
        // need to support passing projectable nodes, so we cheat and put them in the TNode
        // of the Host TView. (Yes we put instance info at the T Level). We can get away with it
        // because we know that that TView is not shared and therefore it will not be a problem.
        // This should be refactored and cleaned up.
        for (let i = 0; i < nodeToProjectOrRNodes.length; i++) {
            /** @type {?} */
            const rNode = nodeToProjectOrRNodes[i];
            applyToElementOrContainer(action, renderer, renderParent, rNode, beforeNode);
        }
    }
    else {
        /** @type {?} */
        let nodeToProject = nodeToProjectOrRNodes;
        /** @type {?} */
        const projectedComponentLView = (/** @type {?} */ (componentLView[PARENT]));
        applyNodes(renderer, action, nodeToProject, projectedComponentLView, renderParent, beforeNode, true);
    }
}
/**
 * `applyContainer` performs an operation on the container and its views as specified by
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
function applyContainer(renderer, action, lContainer, renderParent, beforeNode) {
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
    // - container's host node (this is done in the executeActionOnElementOrContainer)
    // - container's host node (this is done here)
    if (anchor !== native) {
        // This is very strange to me (Misko). I would expect that the native is same as anchor. I don't
        // see a reason why they should be different, but they are.
        //
        // If they are we need to process the second anchor as well.
        applyToElementOrContainer(action, renderer, renderParent, anchor, beforeNode);
    }
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        /** @type {?} */
        const lView = (/** @type {?} */ (lContainer[i]));
        applyView(renderer, action, lView, renderParent, anchor);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsdUJBQXVCLEVBQWMsV0FBVyxFQUFFLE1BQU0sRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUxSSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQXlFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25KLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQXlELG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQStCLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xOLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDOUQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLHNCQUFzQixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDOztNQUVsRix1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTzs7Ozs7O0FBRS9FLE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBZ0IsRUFBRSxZQUFtQjtJQUNqRSxTQUFTLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDOztVQUNqQyxTQUFTLEdBQUcsbUJBQUEsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFjO0lBQ3BELElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtRQUN0QixpRUFBaUU7UUFDakUsZ0ZBQWdGO1FBQ2hGLE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUNuRDtTQUFNO1FBQ0wsU0FBUyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLHNEQUFzRDtRQUN0RCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtBQUNILENBQUM7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLHdCQUF3QixDQUFDLFNBQW9CLEVBQUUsSUFBVzs7VUFDbEUsU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO0lBQ2hELE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNoRixDQUFDOzs7SUFHQyxzRUFBc0U7SUFDdEUsU0FBVTtJQUVWOzs7T0FHRztJQUNILFNBQVU7SUFFViw4Q0FBOEM7SUFDOUMsU0FBVTtJQUVWLGdEQUFnRDtJQUNoRCxVQUFXOzs7Ozs7Ozs7Ozs7QUFTYixTQUFTLHlCQUF5QixDQUM5QixNQUEyQixFQUFFLFFBQW1CLEVBQUUsTUFBdUIsRUFDekUsYUFBeUMsRUFBRSxVQUF5QjtJQUN0RSwrRkFBK0Y7SUFDL0YsMEZBQTBGO0lBQzFGLDhGQUE4RjtJQUM5RixxQkFBcUI7SUFDckIsSUFBSSxhQUFhLElBQUksSUFBSSxFQUFFOztZQUNyQixVQUFnQzs7WUFDaEMsV0FBVyxHQUFHLEtBQUs7UUFDdkIseUZBQXlGO1FBQ3pGLCtGQUErRjtRQUMvRiw2RUFBNkU7UUFDN0UsSUFBSSxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDL0IsVUFBVSxHQUFHLGFBQWEsQ0FBQztTQUM1QjthQUFNLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ2pDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDbkIsU0FBUyxJQUFJLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsNENBQTRDLENBQUMsQ0FBQztZQUM5RixhQUFhLEdBQUcsbUJBQUEsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7U0FDdkM7O2NBQ0ssS0FBSyxHQUFVLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDL0MsU0FBUyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXJFLElBQUksTUFBTSxtQkFBK0IsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQzVELElBQUksVUFBVSxJQUFJLElBQUksRUFBRTtnQkFDdEIsaUJBQWlCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQzthQUM1QztpQkFBTTtnQkFDTCxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLElBQUksSUFBSSxDQUFDLENBQUM7YUFDakU7U0FDRjthQUFNLElBQUksTUFBTSxtQkFBK0IsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQ25FLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQztTQUNqRTthQUFNLElBQUksTUFBTSxtQkFBK0IsRUFBRTtZQUNoRCxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ2hEO2FBQU0sSUFBSSxNQUFNLG9CQUFnQyxFQUFFO1lBQ2pELFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QyxtQkFBQSxDQUFDLG1CQUFBLFFBQVEsRUFBdUIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hEO1FBQ0QsSUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO1lBQ3RCLGNBQWMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDbEU7S0FDRjtBQUNILENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBYSxFQUFFLFFBQW1CO0lBQy9ELFNBQVMsSUFBSSxTQUFTLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUNoRCxTQUFTLElBQUksU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3pDLE9BQU8sb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM1QixRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pFLENBQUM7Ozs7Ozs7QUFnQkQsTUFBTSxVQUFVLDBCQUEwQixDQUN0QyxLQUFZLEVBQUUsVUFBbUIsRUFBRSxVQUF3Qjs7VUFDdkQsWUFBWSxHQUFHLHdCQUF3QixDQUFDLG1CQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQWEsRUFBRSxLQUFLLENBQUM7SUFDcEYsU0FBUyxJQUFJLGNBQWMsQ0FBQyxtQkFBQSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFTLGVBQWlCLENBQUM7SUFDeEUsSUFBSSxZQUFZLEVBQUU7O2NBQ1YsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7O2NBQzFCLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxnQkFBNEIsQ0FBQyxlQUEyQjtRQUNuRixTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQzlEO0FBQ0gsQ0FBQzs7Ozs7OztBQU9ELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFZO0lBQzNDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUE4QixLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzVFLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sVUFBVSxlQUFlLENBQUMsUUFBZTs7O1FBRXpDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7SUFDNUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1FBQ3RCLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzlCO0lBRUQsT0FBTyxpQkFBaUIsRUFBRTs7WUFDcEIsSUFBSSxHQUEwQixJQUFJO1FBRXRDLElBQUksT0FBTyxDQUFDLGlCQUFpQixDQUFDLEVBQUU7WUFDOUIsb0NBQW9DO1lBQ3BDLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN0QzthQUFNO1lBQ0wsU0FBUyxJQUFJLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLENBQUM7OztrQkFFM0MsU0FBUyxHQUFvQixpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQztZQUM3RSxJQUFJLFNBQVM7Z0JBQUUsSUFBSSxHQUFHLFNBQVMsQ0FBQztTQUNqQztRQUVELElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDVCxxRUFBcUU7WUFDckUsZ0RBQWdEO1lBQ2hELE9BQU8saUJBQWlCLElBQUksQ0FBQyxtQkFBQSxpQkFBaUIsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixLQUFLLFFBQVEsRUFBRTtnQkFDeEYsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQy9CLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNqRTtZQUNELFdBQVcsQ0FBQyxpQkFBaUIsSUFBSSxRQUFRLENBQUMsQ0FBQztZQUMzQyxJQUFJLEdBQUcsaUJBQWlCLElBQUksbUJBQUEsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2RDtRQUNELGlCQUFpQixHQUFHLElBQUksQ0FBQztLQUMxQjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxVQUFVLFVBQVUsQ0FBQyxLQUFZLEVBQUUsVUFBc0IsRUFBRSxLQUFhO0lBQzVFLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsU0FBUyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDOztVQUNwQyxnQkFBZ0IsR0FBRyx1QkFBdUIsR0FBRyxLQUFLOztVQUNsRCxlQUFlLEdBQUcsVUFBVSxDQUFDLE1BQU07SUFFekMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQ2IseURBQXlEO1FBQ3pELFVBQVUsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7S0FDaEQ7SUFDRCxJQUFJLEtBQUssR0FBRyxlQUFlLEdBQUcsdUJBQXVCLEVBQUU7UUFDckQsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzNDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsdUJBQXVCLEdBQUcsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2hFO1NBQU07UUFDTCxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDcEI7SUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDOzs7VUFHckIscUJBQXFCLEdBQUcsS0FBSyxDQUFDLHNCQUFzQixDQUFDO0lBQzNELElBQUkscUJBQXFCLEtBQUssSUFBSSxJQUFJLFVBQVUsS0FBSyxxQkFBcUIsRUFBRTtRQUMxRSxjQUFjLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUM7OztVQUdLLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0lBQy9CLElBQUksUUFBUSxLQUFLLElBQUksRUFBRTtRQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ25DO0lBRUQseUJBQXlCO0lBQ3pCLEtBQUssQ0FBQyxLQUFLLENBQUMsc0JBQXVCLENBQUM7QUFDdEMsQ0FBQzs7Ozs7Ozs7QUFNRCxTQUFTLGNBQWMsQ0FBQyxvQkFBZ0MsRUFBRSxLQUFZO0lBQ3BFLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztVQUM5QyxhQUFhLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxDQUFDO0lBQ3ZELElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtRQUMxQixvQkFBb0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzdDO1NBQU07UUFDTCxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzNCO0FBQ0gsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxlQUFlLENBQUMsb0JBQWdDLEVBQUUsS0FBWTtJQUNyRSxTQUFTLElBQUksZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUNwRCxTQUFTLElBQUksYUFBYSxDQUNULG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxFQUNqQywwRUFBMEUsQ0FBQyxDQUFDOztVQUN2RixjQUFjLEdBQUcsbUJBQUEsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEVBQUU7O1VBQ3BELGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ3ZELGNBQWMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUMsQ0FBQzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsVUFBVSxDQUFDLFVBQXNCLEVBQUUsV0FBbUI7SUFDcEUsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLHVCQUF1QjtRQUFFLE9BQU87O1VBRW5ELGdCQUFnQixHQUFHLHVCQUF1QixHQUFHLFdBQVc7O1VBQ3hELFlBQVksR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUM7SUFFakQsSUFBSSxZQUFZLEVBQUU7O2NBQ1YscUJBQXFCLEdBQUcsWUFBWSxDQUFDLHNCQUFzQixDQUFDO1FBQ2xFLElBQUkscUJBQXFCLEtBQUssSUFBSSxJQUFJLHFCQUFxQixLQUFLLFVBQVUsRUFBRTtZQUMxRSxlQUFlLENBQUMscUJBQXFCLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDdEQ7UUFHRCxJQUFJLFdBQVcsR0FBRyxDQUFDLEVBQUU7WUFDbkIsVUFBVSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLG1CQUFBLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBUyxDQUFDO1NBQ3RFOztjQUNLLFlBQVksR0FBRyxlQUFlLENBQUMsVUFBVSxFQUFFLHVCQUF1QixHQUFHLFdBQVcsQ0FBQztRQUN2RiwwQkFBMEIsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDOzs7Y0FHaEQsUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUM7UUFDdEMsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO1lBQ3JCLFFBQVEsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDMUM7UUFFRCxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzVCLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDMUIsMkJBQTJCO1FBQzNCLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxtQkFBb0IsQ0FBQztLQUM3QztJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxVQUFzQixFQUFFLFdBQW1COztVQUM5RCxZQUFZLEdBQUcsVUFBVSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUM7SUFDeEQsWUFBWSxJQUFJLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUM3QyxDQUFDOzs7Ozs7OztBQVFELE1BQU0sVUFBVSxZQUFZLENBQUMsS0FBWTtJQUN2QyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLHNCQUF1QixDQUFDLEVBQUU7O2NBQ3BDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ2hDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRTtZQUMxRCxTQUFTLENBQUMsUUFBUSxtQkFBK0IsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNyRTtRQUVELGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4QjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLFVBQVUsY0FBYyxDQUFDLGlCQUFxQyxFQUFFLFFBQWU7O1FBRS9FLEtBQUs7SUFDVCxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pFLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixFQUFFO1FBQ2pDLG1GQUFtRjtRQUNuRix1QkFBdUI7UUFDdkIsT0FBTyxhQUFhLENBQUMsbUJBQUEsS0FBSyxFQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztLQUM3RDtTQUFNO1FBQ0wsK0RBQStEO1FBQy9ELE9BQU8saUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ2xGO0FBQ0gsQ0FBQzs7Ozs7Ozs7O0FBU0QsU0FBUyxXQUFXLENBQUMsSUFBd0I7SUFDM0MsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQXVCLENBQUMsRUFBRTtRQUMxRCwwRkFBMEY7UUFDMUYseUZBQXlGO1FBQ3pGLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxtQkFBb0IsQ0FBQztRQUVwQyx3RkFBd0Y7UUFDeEYsNkZBQTZGO1FBQzdGLDZGQUE2RjtRQUM3RiwwRkFBMEY7UUFDMUYsK0RBQStEO1FBQy9ELElBQUksQ0FBQyxLQUFLLENBQUMsdUJBQXdCLENBQUM7UUFFcEMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDOztjQUNoQixTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUM5Qiw4RUFBOEU7UUFDOUUsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksb0JBQXNCLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7WUFDN0YsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN6QyxDQUFDLG1CQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBdUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ25EOztjQUVLLG9CQUFvQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztRQUN6RCwrRUFBK0U7UUFDL0UsSUFBSSxvQkFBb0IsS0FBSyxJQUFJLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO1lBQy9ELCtCQUErQjtZQUMvQixJQUFJLG9CQUFvQixLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDekMsZUFBZSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO2FBQzdDOzs7a0JBR0ssUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDOUIsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO2dCQUNyQixRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ2xDO1NBQ0Y7S0FDRjtBQUNILENBQUM7Ozs7OztBQUdELFNBQVMsZUFBZSxDQUFDLEtBQVk7O1VBQzdCLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTztJQUNyQyxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7O2NBQ2YsUUFBUSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvQyxJQUFJLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTs7O3NCQUU3QixpQkFBaUIsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7c0JBQ25DLE1BQU0sR0FBRyxPQUFPLGlCQUFpQixLQUFLLFVBQVUsQ0FBQyxDQUFDO29CQUNwRCxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMxQixXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7O3NCQUNuQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7O3NCQUNwQyxrQkFBa0IsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxPQUFPLGtCQUFrQixLQUFLLFNBQVMsRUFBRTtvQkFDM0MsZ0RBQWdEO29CQUNoRCxNQUFNLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2lCQUN2RTtxQkFBTTtvQkFDTCxJQUFJLGtCQUFrQixJQUFJLENBQUMsRUFBRTt3QkFDM0IsYUFBYTt3QkFDYixRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO3FCQUNoQzt5QkFBTTt3QkFDTCxlQUFlO3dCQUNmLFFBQVEsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7cUJBQzdDO2lCQUNGO2dCQUNELENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUjtpQkFBTTs7O3NCQUVDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDekMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUMzQjtTQUNGO1FBQ0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN2QjtBQUNILENBQUM7Ozs7OztBQUdELFNBQVMsaUJBQWlCLENBQUMsSUFBVzs7VUFDOUIsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7O1FBQ3JCLFlBQTJCO0lBRS9CLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxFQUFFO1FBQ2hFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7O2tCQUN6QyxPQUFPLEdBQUcsSUFBSSxDQUFDLG1CQUFBLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBVSxDQUFDO1lBRS9DLGdFQUFnRTtZQUNoRSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksbUJBQW1CLENBQUMsRUFBRTtnQkFDN0MsQ0FBQyxtQkFBQSxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDbEQ7U0FDRjtLQUNGO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWNELFNBQVMsZUFBZSxDQUFDLEtBQVksRUFBRSxXQUFrQjtJQUN2RCxzREFBc0Q7SUFDdEQsSUFBSSxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDM0IsT0FBTyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7S0FDdEY7Ozs7UUFJRyxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU07SUFDOUIsT0FBTyxXQUFXLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksNkJBQStCO1FBQy9DLFdBQVcsQ0FBQyxJQUFJLHlCQUEyQixDQUFDLEVBQUU7UUFDM0UsS0FBSyxHQUFHLFdBQVcsQ0FBQztRQUNwQixXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztLQUM1QjtJQUVELGdHQUFnRztJQUNoRyx1QkFBdUI7SUFDdkIsSUFBSSxXQUFXLElBQUksSUFBSSxFQUFFOztjQUNqQixTQUFTLEdBQUcsbUJBQUEsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3ZDLElBQUksU0FBUyxDQUFDLElBQUksaUJBQW1CLEVBQUU7WUFDckMsMkZBQTJGO1lBQzNGLGdGQUFnRjtZQUNoRixtRkFBbUY7WUFDbkYsNEZBQTRGO1lBQzVGLHVGQUF1RjtZQUN2Rix5RkFBeUY7WUFDekYsdUVBQXVFO1lBQ3ZFLE9BQU8sd0JBQXdCLENBQUMsbUJBQUEsU0FBUyxFQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDdEU7YUFBTTtZQUNMLDRGQUE0RjtZQUM1Riw2QkFBNkI7WUFDN0IsU0FBUyxJQUFJLHlCQUF5QixDQUFDLFNBQVMsa0JBQW9CLENBQUM7WUFDckUsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUI7S0FDRjtTQUFNOztjQUNDLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLElBQUkseUJBQTJCO1FBQ2hFLGdHQUFnRztRQUNoRyxnR0FBZ0c7UUFDaEcsSUFBSSxTQUFTLElBQUksS0FBSyxDQUFDLEtBQUssc0JBQXlCLEVBQUU7WUFDckQsT0FBTyxtQkFBQSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUMsVUFBVSxFQUFZLENBQUM7U0FDcEU7UUFFRCxTQUFTLElBQUksY0FBYyxDQUFDLFdBQVcsa0JBQW9CLENBQUM7UUFDNUQsSUFBSSxXQUFXLENBQUMsS0FBSywwQkFBNkIsRUFBRTs7a0JBQzVDLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSTs7a0JBQy9CLEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFTOztrQkFDekMsYUFBYSxHQUFHLENBQUMsbUJBQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBcUIsQ0FBQyxDQUFDLGFBQWE7WUFFdEYsNEZBQTRGO1lBQzVGLDRGQUE0RjtZQUM1Rix1RkFBdUY7WUFDdkYsdUZBQXVGO1lBQ3ZGLDZGQUE2RjtZQUM3Riw0RUFBNEU7WUFDNUUsSUFBSSxhQUFhLEtBQUssaUJBQWlCLENBQUMsU0FBUztnQkFDN0MsYUFBYSxLQUFLLGlCQUFpQixDQUFDLE1BQU0sRUFBRTtnQkFDOUMsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsT0FBTyxtQkFBQSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLEVBQVksQ0FBQztLQUMvRDtBQUNILENBQUM7Ozs7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBWSxFQUFFLFVBQXdCO0lBQy9FLFNBQVMsSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUM5QyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztLQUNsRDtTQUFNO1FBQ0wsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzlDO0FBQ0gsQ0FBQzs7Ozs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsUUFBbUIsRUFBRSxNQUFnQixFQUFFLEtBQVk7SUFDNUUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQzdDLFNBQVMsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbEUsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNsQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNyQztTQUFNO1FBQ0wsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMzQjtBQUNILENBQUM7Ozs7Ozs7O0FBRUQsU0FBUywwQkFBMEIsQ0FDL0IsUUFBbUIsRUFBRSxNQUFnQixFQUFFLEtBQVksRUFBRSxVQUF3QjtJQUMvRSxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7UUFDdkIsa0JBQWtCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDekQ7U0FBTTtRQUNMLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDOzs7Ozs7Ozs7QUFHRCxTQUFTLGlCQUFpQixDQUN0QixRQUFtQixFQUFFLE1BQWdCLEVBQUUsS0FBWSxFQUFFLGFBQXVCO0lBQzlFLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQ3BEO1NBQU07UUFDTCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzNCO0FBQ0gsQ0FBQzs7Ozs7OztBQUtELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxRQUFtQixFQUFFLElBQVc7SUFDL0QsT0FBTyxtQkFBQSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQVksQ0FBQztBQUNwRyxDQUFDOzs7Ozs7O0FBS0QsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFFBQW1CLEVBQUUsSUFBVztJQUNoRSxPQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3hGLENBQUM7Ozs7Ozs7O0FBUUQsU0FBUyxtQkFBbUIsQ0FBQyxXQUFrQixFQUFFLEtBQVk7SUFDM0QsSUFBSSxXQUFXLENBQUMsSUFBSSxpQkFBbUIsRUFBRTs7Y0FDakMsVUFBVSxHQUFHLGFBQWEsQ0FBQyxtQkFBQSxXQUFXLEVBQWEsRUFBRSxLQUFLLENBQUM7UUFDakUsSUFBSSxVQUFVLEtBQUssSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFDOztjQUMvQixLQUFLLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsR0FBRyx1QkFBdUI7UUFDMUYsT0FBTyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDaEQ7U0FBTSxJQUNILFdBQVcsQ0FBQyxJQUFJLDZCQUErQjtRQUMvQyxXQUFXLENBQUMsSUFBSSx5QkFBMkIsRUFBRTtRQUMvQyxPQUFPLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM3QztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQXdCLEVBQUUsVUFBaUIsRUFBRSxXQUFrQjs7VUFDbkYsWUFBWSxHQUFHLGVBQWUsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO0lBQzdELElBQUksWUFBWSxJQUFJLElBQUksRUFBRTs7Y0FDbEIsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUM7O2NBQ2hDLFdBQVcsR0FBVSxVQUFVLENBQUMsTUFBTSxJQUFJLG1CQUFBLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRTs7Y0FDL0QsVUFBVSxHQUFHLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUM7UUFDaEUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN2QywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQzthQUM1RTtTQUNGO2FBQU07WUFDTCwwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN6RTtLQUNGO0FBQ0gsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLG9CQUE0QixFQUFFLFVBQXNCOztVQUVqRixhQUFhLEdBQUcsdUJBQXVCLEdBQUcsb0JBQW9CLEdBQUcsQ0FBQztJQUN4RSxJQUFJLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFOztjQUMvQixLQUFLLEdBQUcsbUJBQUEsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFTO1FBQ2hELFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUM7O1lBQzVELGNBQWMsR0FBRyxDQUFDLG1CQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBYSxDQUFDLENBQUMsS0FBSztRQUN2RCxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsSUFBSSxjQUFjLENBQUMsSUFBSSw2QkFBK0I7Z0JBQ2xELGNBQWMsQ0FBQyxJQUFJLHlCQUEyQixFQUFFOztvQkFDOUMsWUFBWSxHQUFHLGNBQWMsQ0FBQyxLQUFLO2dCQUN2QyxPQUFPLFlBQVksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLDZCQUErQjtvQkFDaEQsWUFBWSxDQUFDLElBQUkseUJBQTJCLENBQUMsRUFBRTtvQkFDckUsWUFBWSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7aUJBQ25DO2dCQUNELGNBQWMsR0FBRyxZQUFZLElBQUksY0FBYyxDQUFDO2FBQ2pEO1lBQ0QsT0FBTyxzQkFBc0IsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDdEQ7S0FDRjtJQUVELE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVCLENBQUM7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFFBQW1CLEVBQUUsS0FBWSxFQUFFLGFBQXVCOztVQUNuRixZQUFZLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQztJQUN0RCxJQUFJLFlBQVksRUFBRTtRQUNoQixpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNqRTtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7QUFPRCxTQUFTLFVBQVUsQ0FDZixRQUFtQixFQUFFLE1BQTJCLEVBQUUsS0FBbUIsRUFBRSxLQUFZLEVBQ25GLFlBQTZCLEVBQUUsVUFBd0IsRUFBRSxZQUFxQjtJQUNoRixPQUFPLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDcEIsU0FBUyxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxTQUFTLElBQUkseUJBQXlCLENBQ3JCLEtBQUssNkhBQzhELENBQUM7O2NBQy9FLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQzs7Y0FDakMsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJO1FBQzVCLElBQUksWUFBWSxFQUFFO1lBQ2hCLElBQUksTUFBTSxtQkFBK0IsRUFBRTtnQkFDekMsWUFBWSxJQUFJLGVBQWUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xFLEtBQUssQ0FBQyxLQUFLLHVCQUEwQixDQUFDO2FBQ3ZDO1NBQ0Y7UUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssc0JBQXdCLENBQUMsd0JBQTBCLEVBQUU7WUFDbkUsSUFBSSxTQUFTLDZCQUErQixJQUFJLFNBQVMseUJBQTJCLEVBQUU7Z0JBQ3BGLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xGLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQzthQUNyRjtpQkFBTSxJQUFJLFNBQVMsdUJBQXlCLEVBQUU7Z0JBQzdDLHdCQUF3QixDQUNwQixRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxtQkFBQSxLQUFLLEVBQW1CLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ2xGO2lCQUFNO2dCQUNMLFNBQVMsSUFBSSx5QkFBeUIsQ0FBQyxLQUFLLHFDQUF5QyxDQUFDO2dCQUN0Rix5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7YUFDckY7U0FDRjtRQUNELEtBQUssR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7S0FDMUQ7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QkQsU0FBUyxTQUFTLENBQ2QsUUFBbUIsRUFBRSxNQUEyQixFQUFFLEtBQVksRUFBRSxZQUE2QixFQUM3RixVQUF3Qjs7VUFDcEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDMUIsU0FBUyxJQUFJLGNBQWMsQ0FBQyxtQkFBQSxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWlCLENBQUM7O1VBQ3BELGFBQWEsR0FBZSxtQkFBQSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSztJQUNwRCxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdEYsQ0FBQzs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQVksRUFBRSxlQUFnQzs7VUFDdEUsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7O1VBQzFCLFlBQVksR0FBRyxlQUFlLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQzs7VUFDdEQsV0FBVyxHQUFHLGVBQWUsQ0FBQyxNQUFNLElBQUksbUJBQUEsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFOztRQUN6RCxVQUFVLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQztJQUN4RCx3QkFBd0IsQ0FDcEIsUUFBUSxrQkFBOEIsS0FBSyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDOUYsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWdCRCxTQUFTLHdCQUF3QixDQUM3QixRQUFtQixFQUFFLE1BQTJCLEVBQUUsS0FBWSxFQUM5RCxlQUFnQyxFQUFFLFlBQTZCLEVBQUUsVUFBd0I7O1VBQ3JGLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7O1VBQ3pDLGFBQWEsR0FBRyxtQkFBQSxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQWdCO0lBQzVELFNBQVM7UUFDTCxXQUFXLENBQUMsT0FBTyxlQUFlLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDOztVQUNyRixxQkFBcUIsR0FBRyxtQkFBQSxtQkFBQSxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxFQUFFO0lBQ3RGLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFO1FBQ3hDLDBGQUEwRjtRQUMxRixtRkFBbUY7UUFDbkYsd0ZBQXdGO1FBQ3hGLHdGQUF3RjtRQUN4Riw0Q0FBNEM7UUFDNUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQy9DLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFDdEMseUJBQXlCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzlFO0tBQ0Y7U0FBTTs7WUFDRCxhQUFhLEdBQWUscUJBQXFCOztjQUMvQyx1QkFBdUIsR0FBRyxtQkFBQSxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQVM7UUFDL0QsVUFBVSxDQUNOLFFBQVEsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLHVCQUF1QixFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDL0Y7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsU0FBUyxjQUFjLENBQ25CLFFBQW1CLEVBQUUsTUFBMkIsRUFBRSxVQUFzQixFQUN4RSxZQUE2QixFQUFFLFVBQW9DO0lBQ3JFLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7VUFDcEMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7OztVQUMzQixNQUFNLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQztJQUN0QyxzRkFBc0Y7SUFDdEYsa0dBQWtHO0lBQ2xHLGtHQUFrRztJQUNsRyw2Q0FBNkM7SUFDN0Msa0ZBQWtGO0lBQ2xGLDhDQUE4QztJQUM5QyxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7UUFDckIsZ0dBQWdHO1FBQ2hHLDJEQUEyRDtRQUMzRCxFQUFFO1FBQ0YsNERBQTREO1FBQzVELHlCQUF5QixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztLQUMvRTtJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQzFELEtBQUssR0FBRyxtQkFBQSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQVM7UUFDcEMsU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztLQUMxRDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTU9WRURfVklFV1MsIE5BVElWRSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3LCBpc1Jvb3RWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDTEVBTlVQLCBERUNMQVJBVElPTl9MQ09OVEFJTkVSLCBGTEFHUywgSE9TVCwgSG9va0RhdGEsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgVF9IT1NULCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQ1fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGVPck51bGwsIHVud3JhcFJOb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMQ29udGFpbmVyKHROb2RlOiBUVmlld05vZGUsIGVtYmVkZGVkVmlldzogTFZpZXcpOiBMQ29udGFpbmVyfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoZW1iZWRkZWRWaWV3KTtcbiAgY29uc3QgY29udGFpbmVyID0gZW1iZWRkZWRWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgaWYgKHROb2RlLmluZGV4ID09PSAtMSkge1xuICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcgaW5zaWRlIGEgZHluYW1pYyBjb250YWluZXIuXG4gICAgLy8gVGhlIHBhcmVudCBpc24ndCBhbiBMQ29udGFpbmVyIGlmIHRoZSBlbWJlZGRlZCB2aWV3IGhhc24ndCBiZWVuIGF0dGFjaGVkIHlldC5cbiAgICByZXR1cm4gaXNMQ29udGFpbmVyKGNvbnRhaW5lcikgPyBjb250YWluZXIgOiBudWxsO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgLy8gVGhpcyBpcyBhIGlubGluZSB2aWV3IG5vZGUgKGUuZy4gZW1iZWRkZWRWaWV3U3RhcnQpXG4gICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgfVxufVxuXG5cbi8qKlxuICogUmV0cmlldmVzIHJlbmRlciBwYXJlbnQgZm9yIGEgZ2l2ZW4gdmlldy5cbiAqIE1pZ2h0IGJlIG51bGwgaWYgYSB2aWV3IGlzIG5vdCB5ZXQgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnRhaW5lclJlbmRlclBhcmVudCh0Vmlld05vZGU6IFRWaWV3Tm9kZSwgdmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgY29udGFpbmVyID0gZ2V0TENvbnRhaW5lcih0Vmlld05vZGUsIHZpZXcpO1xuICByZXR1cm4gY29udGFpbmVyID8gbmF0aXZlUGFyZW50Tm9kZSh2aWV3W1JFTkRFUkVSXSwgY29udGFpbmVyW05BVElWRV0pIDogbnVsbDtcbn1cblxuY29uc3QgZW51bSBXYWxrVE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgY3JlYXRlIGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQuIFJ1biBvbiBpbml0aWFsIGNyZWF0aW9uLiAqL1xuICBDcmVhdGUgPSAwLFxuXG4gIC8qKlxuICAgKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50LlxuICAgKiBSdW4gd2hlbiBleGlzdGluZyBub2RlIGhhcyBiZWVuIGRldGFjaGVkIGFuZCBuZWVkcyB0byBiZSByZS1hdHRhY2hlZC5cbiAgICovXG4gIEluc2VydCA9IDEsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAyLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMyxcbn1cblxuXG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKFxuICAgIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCB8IG51bGwsXG4gICAgbE5vZGVUb0hhbmRsZTogUk5vZGUgfCBMQ29udGFpbmVyIHwgTFZpZXcsIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwpIHtcbiAgLy8gSWYgdGhpcyBzbG90IHdhcyBhbGxvY2F0ZWQgZm9yIGEgdGV4dCBub2RlIGR5bmFtaWNhbGx5IGNyZWF0ZWQgYnkgaTE4biwgdGhlIHRleHQgbm9kZSBpdHNlbGZcbiAgLy8gd29uJ3QgYmUgY3JlYXRlZCB1bnRpbCBpMThuQXBwbHkoKSBpbiB0aGUgdXBkYXRlIGJsb2NrLCBzbyB0aGlzIG5vZGUgc2hvdWxkIGJlIHNraXBwZWQuXG4gIC8vIEZvciBtb3JlIGluZm8sIHNlZSBcIklDVSBleHByZXNzaW9ucyBzaG91bGQgd29yayBpbnNpZGUgYW4gbmdUZW1wbGF0ZU91dGxldCBpbnNpZGUgYW4gbmdGb3JcIlxuICAvLyBpbiBgaTE4bl9zcGVjLnRzYC5cbiAgaWYgKGxOb2RlVG9IYW5kbGUgIT0gbnVsbCkge1xuICAgIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyfHVuZGVmaW5lZDtcbiAgICBsZXQgaXNDb21wb25lbnQgPSBmYWxzZTtcbiAgICAvLyBXZSBhcmUgZXhwZWN0aW5nIGFuIFJOb2RlLCBidXQgaW4gdGhlIGNhc2Ugb2YgYSBjb21wb25lbnQgb3IgTENvbnRhaW5lciB0aGUgYFJOb2RlYCBpc1xuICAgIC8vIHdyYXBwZWQgaW4gYW4gYXJyYXkgd2hpY2ggbmVlZHMgdG8gYmUgdW53cmFwcGVkLiBXZSBuZWVkIHRvIGtub3cgaWYgaXQgaXMgYSBjb21wb25lbnQgYW5kIGlmXG4gICAgLy8gaXQgaGFzIExDb250YWluZXIgc28gdGhhdCB3ZSBjYW4gcHJvY2VzcyBhbGwgb2YgdGhvc2UgY2FzZXMgYXBwcm9wcmlhdGVseS5cbiAgICBpZiAoaXNMQ29udGFpbmVyKGxOb2RlVG9IYW5kbGUpKSB7XG4gICAgICBsQ29udGFpbmVyID0gbE5vZGVUb0hhbmRsZTtcbiAgICB9IGVsc2UgaWYgKGlzTFZpZXcobE5vZGVUb0hhbmRsZSkpIHtcbiAgICAgIGlzQ29tcG9uZW50ID0gdHJ1ZTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxOb2RlVG9IYW5kbGVbSE9TVF0sICdIT1NUIG11c3QgYmUgZGVmaW5lZCBmb3IgYSBjb21wb25lbnQgTFZpZXcnKTtcbiAgICAgIGxOb2RlVG9IYW5kbGUgPSBsTm9kZVRvSGFuZGxlW0hPU1RdICE7XG4gICAgfVxuICAgIGNvbnN0IHJOb2RlOiBSTm9kZSA9IHVud3JhcFJOb2RlKGxOb2RlVG9IYW5kbGUpO1xuICAgIG5nRGV2TW9kZSAmJiAhaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpICYmIGFzc2VydERvbU5vZGUock5vZGUpO1xuXG4gICAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBpZiAoYmVmb3JlTm9kZSA9PSBudWxsKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgck5vZGUsIGJlZm9yZU5vZGUgfHwgbnVsbCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCByTm9kZSwgaXNDb21wb25lbnQpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEock5vZGUpO1xuICAgIH1cbiAgICBpZiAobENvbnRhaW5lciAhPSBudWxsKSB7XG4gICAgICBhcHBseUNvbnRhaW5lcihyZW5kZXJlciwgYWN0aW9uLCBsQ29udGFpbmVyLCBwYXJlbnQsIGJlZm9yZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IHN0cmluZywgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGxWaWV3OiBMVmlldywgaW5zZXJ0TW9kZTogdHJ1ZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihsVmlldzogTFZpZXcsIGluc2VydE1vZGU6IGZhbHNlLCBiZWZvcmVOb2RlOiBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBsVmlldzogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQobFZpZXdbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCBsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShsVmlld1tUVklFV10ubm9kZSBhcyBUTm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICBpZiAocmVuZGVyUGFyZW50KSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgYWN0aW9uID0gaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2g7XG4gICAgYXBwbHlWaWV3KHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogRGV0YWNoIGEgYExWaWV3YCBmcm9tIHRoZSBET00gYnkgZGV0YWNoaW5nIGl0cyBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2AgdG8gYmUgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZXRhY2hWaWV3KGxWaWV3OiBMVmlldykge1xuICBhcHBseVZpZXcobFZpZXdbUkVOREVSRVJdLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbFZpZXcsIG51bGwsIG51bGwpO1xufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBsZXQgbFZpZXdPckxDb250YWluZXIgPSByb290Vmlld1tDSElMRF9IRUFEXTtcbiAgaWYgKCFsVmlld09yTENvbnRhaW5lcikge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cblxuICB3aGlsZSAobFZpZXdPckxDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSkge1xuICAgICAgLy8gSWYgTFZpZXcsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXJbQ0hJTERfSEVBRF07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgIC8vIElmIGNvbnRhaW5lciwgdHJhdmVyc2UgZG93biB0byBpdHMgZmlyc3QgTFZpZXcuXG4gICAgICBjb25zdCBmaXJzdFZpZXc6IExWaWV3fHVuZGVmaW5lZCA9IGxWaWV3T3JMQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXTtcbiAgICAgIGlmIChmaXJzdFZpZXcpIG5leHQgPSBmaXJzdFZpZXc7XG4gICAgfVxuXG4gICAgaWYgKCFuZXh0KSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKGxWaWV3T3JMQ29udGFpbmVyICYmICFsVmlld09yTENvbnRhaW5lciAhW05FWFRdICYmIGxWaWV3T3JMQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lcik7XG4gICAgICAgIGxWaWV3T3JMQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUobFZpZXdPckxDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KGxWaWV3T3JMQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lciAmJiBsVmlld09yTENvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICBsVmlld09yTENvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIGluZGV4IFdoaWNoIGluZGV4IGluIHRoZSBjb250YWluZXIgdG8gaW5zZXJ0IHRoZSBjaGlsZCB2aWV3IGludG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcobFZpZXc6IExWaWV3LCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICBjb25zdCBpbmRleEluQ29udGFpbmVyID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyBpbmRleDtcbiAgY29uc3QgY29udGFpbmVyTGVuZ3RoID0gbENvbnRhaW5lci5sZW5ndGg7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lciAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cbiAgaWYgKGluZGV4IDwgY29udGFpbmVyTGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHtcbiAgICBsVmlld1tORVhUXSA9IGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lcl07XG4gICAgYWRkVG9BcnJheShsQ29udGFpbmVyLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIGluZGV4LCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgbENvbnRhaW5lci5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyB0cmFjayB2aWV3cyB3aGVyZSBkZWNsYXJhdGlvbiBhbmQgaW5zZXJ0aW9uIHBvaW50cyBhcmUgZGlmZmVyZW50XG4gIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IGxWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBudWxsICYmIGxDb250YWluZXIgIT09IGRlY2xhcmF0aW9uTENvbnRhaW5lcikge1xuICAgIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uTENvbnRhaW5lciwgbFZpZXcpO1xuICB9XG5cbiAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBjb25zdCBsUXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBsUXVlcmllcy5pbnNlcnRWaWV3KGxWaWV3W1RWSUVXXSk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIFRyYWNrIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGUgZGVjbGFyYXRpb24gY29udGFpbmVyIChUZW1wbGF0ZVJlZikgYW5kIGluc2VydGVkIGludG8gYVxuICogZGlmZmVyZW50IExDb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyOiBMQ29udGFpbmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25Db250YWluZXIpO1xuICBjb25zdCBkZWNsYXJlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdO1xuICBpZiAoZGVjbGFyZWRWaWV3cyA9PT0gbnVsbCkge1xuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSA9IFtsVmlld107XG4gIH0gZWxzZSB7XG4gICAgZGVjbGFyZWRWaWV3cy5wdXNoKGxWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSxcbiAgICAgICAgICAgICAgICAgICAnQSBwcm9qZWN0ZWQgdmlldyBzaG91bGQgYmVsb25nIHRvIGEgbm9uLWVtcHR5IHByb2plY3RlZCB2aWV3cyBjb2xsZWN0aW9uJyk7XG4gIGNvbnN0IHByb2plY3RlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdICE7XG4gIGNvbnN0IGRlY2xhcmVkVmlld0luZGV4ID0gcHJvamVjdGVkVmlld3MuaW5kZXhPZihsVmlldyk7XG4gIHByb2plY3RlZFZpZXdzLnNwbGljZShkZWNsYXJlZFZpZXdJbmRleCwgMSk7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2QgcmVtb3ZlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBEZXRhY2hlZCBMVmlldyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3fHVuZGVmaW5lZCB7XG4gIGlmIChsQ29udGFpbmVyLmxlbmd0aCA8PSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkgcmV0dXJuO1xuXG4gIGNvbnN0IGluZGV4SW5Db250YWluZXIgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHJlbW92ZUluZGV4O1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXJdO1xuXG4gIGlmICh2aWV3VG9EZXRhY2gpIHtcbiAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSB2aWV3VG9EZXRhY2hbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbnVsbCAmJiBkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IGxDb250YWluZXIpIHtcbiAgICAgIGRldGFjaE1vdmVkVmlldyhkZWNsYXJhdGlvbkxDb250YWluZXIsIHZpZXdUb0RldGFjaCk7XG4gICAgfVxuXG5cbiAgICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlldztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlZExWaWV3ID0gcmVtb3ZlRnJvbUFycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXgpO1xuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaCwgZmFsc2UsIG51bGwpO1xuXG4gICAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgICBjb25zdCBsUXVlcmllcyA9IHJlbW92ZWRMVmlld1tRVUVSSUVTXTtcbiAgICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcocmVtb3ZlZExWaWV3W1RWSUVXXSk7XG4gICAgfVxuXG4gICAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICAgIHZpZXdUb0RldGFjaFtORVhUXSA9IG51bGw7XG4gICAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gICAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgfVxuICByZXR1cm4gdmlld1RvRGV0YWNoO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgZGV0YWNoZWRWaWV3ID0gZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRldGFjaGVkVmlldyAmJiBkZXN0cm95TFZpZXcoZGV0YWNoZWRWaWV3KTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcobFZpZXc6IExWaWV3KSB7XG4gIGlmICghKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICAgIGFwcGx5VmlldyhyZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCBsVmlldywgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgZGVzdHJveVZpZXdUcmVlKGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShsVmlld09yTENvbnRhaW5lcjogTFZpZXcgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld3xcbiAgICBMQ29udGFpbmVyfG51bGwge1xuICBsZXQgdE5vZGU7XG4gIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSAmJiAodE5vZGUgPSBsVmlld09yTENvbnRhaW5lcltUX0hPU1RdKSAmJlxuICAgICAgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldExDb250YWluZXIodE5vZGUgYXMgVFZpZXdOb2RlLCBsVmlld09yTENvbnRhaW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IGxWaWV3T3JMQ29udGFpbmVyW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkRlc3Ryb3lzIGhvb2tzIGZvciBhbGwgZGlyZWN0aXZlcyBhbmQgcGlwZXMgaW4gYSBnaXZlbiB2aWV3IGFuZCB0aGVuIHJlbW92ZXMgYWxsXG4gKiBsaXN0ZW5lcnMuIExpc3RlbmVycyBhcmUgcmVtb3ZlZCBhcyB0aGUgbGFzdCBzdGVwIHNvIGV2ZW50cyBkZWxpdmVyZWQgaW4gdGhlIG9uRGVzdHJveXMgaG9va3NcbiAqIGNhbiBiZSBwcm9wYWdhdGVkIHRvIEBPdXRwdXQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3OiBMVmlldyB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKGlzTFZpZXcodmlldykgJiYgISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIC8vIFVzdWFsbHkgdGhlIEF0dGFjaGVkIGZsYWcgaXMgcmVtb3ZlZCB3aGVuIHRoZSB2aWV3IGlzIGRldGFjaGVkIGZyb20gaXRzIHBhcmVudCwgaG93ZXZlclxuICAgIC8vIGlmIGl0J3MgYSByb290IHZpZXcsIHRoZSBmbGFnIHdvbid0IGJlIHVuc2V0IGhlbmNlIHdoeSB3ZSdyZSBhbHNvIHJlbW92aW5nIG9uIGRlc3Ryb3kuXG4gICAgdmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgICAvLyBNYXJrIHRoZSBMVmlldyBhcyBkZXN0cm95ZWQgKmJlZm9yZSogZXhlY3V0aW5nIHRoZSBvbkRlc3Ryb3kgaG9va3MuIEFuIG9uRGVzdHJveSBob29rXG4gICAgLy8gcnVucyBhcmJpdHJhcnkgdXNlciBjb2RlLCB3aGljaCBjb3VsZCBpbmNsdWRlIGl0cyBvd24gYHZpZXdSZWYuZGVzdHJveSgpYCAob3Igc2ltaWxhcikuIElmXG4gICAgLy8gV2UgZG9uJ3QgZmxhZyB0aGUgdmlldyBhcyBkZXN0cm95ZWQgYmVmb3JlIHRoZSBob29rcywgdGhpcyBjb3VsZCBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgLy8gVGhpcyBhbHNvIGFsaWducyB3aXRoIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yLiBJdCBhbHNvIG1lYW5zIHRoYXQgdGhlIG9uRGVzdHJveSBob29rIGlzXG4gICAgLy8gcmVhbGx5IG1vcmUgb2YgYW4gXCJhZnRlckRlc3Ryb3lcIiBob29rIGlmIHlvdSB0aGluayBhYm91dCBpdC5cbiAgICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcblxuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSB2aWV3W1RfSE9TVF07XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbkNvbnRhaW5lciA9IHZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCBhbiBlbWJlZGRlZCB2aWV3IHRoYXQgaXMgc3RpbGwgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lclxuICAgIGlmIChkZWNsYXJhdGlvbkNvbnRhaW5lciAhPT0gbnVsbCAmJiBpc0xDb250YWluZXIodmlld1tQQVJFTlRdKSkge1xuICAgICAgLy8gYW5kIHRoaXMgaXMgYSBwcm9qZWN0ZWQgdmlld1xuICAgICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSB2aWV3W1BBUkVOVF0pIHtcbiAgICAgICAgZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyLCB2aWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGVtYmVkZGVkIHZpZXdzIHN0aWxsIGF0dGFjaGVkIHRvIGEgY29udGFpbmVyOiByZW1vdmUgcXVlcnkgcmVzdWx0IGZyb20gdGhpcyB2aWV3LlxuICAgICAgY29uc3QgbFF1ZXJpZXMgPSB2aWV3W1FVRVJJRVNdO1xuICAgICAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcodmlld1tUVklFV10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRDbGVhbnVwID0gbFZpZXdbVFZJRVddLmNsZWFudXA7XG4gIGlmICh0Q2xlYW51cCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiB0Q2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIG5hdGl2ZSBET00gbGlzdGVuZXJcbiAgICAgICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSB0Q2xlYW51cFtpICsgMV07XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICBpZHhPclRhcmdldEdldHRlcihsVmlldykgOlxuICAgICAgICAgICAgdW53cmFwUk5vZGUobFZpZXdbaWR4T3JUYXJnZXRHZXR0ZXJdKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMl1dO1xuICAgICAgICBjb25zdCB1c2VDYXB0dXJlT3JTdWJJZHggPSB0Q2xlYW51cFtpICsgM107XG4gICAgICAgIGlmICh0eXBlb2YgdXNlQ2FwdHVyZU9yU3ViSWR4ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAvLyBuYXRpdmUgRE9NIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBSZW5kZXJlcjNcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0Q2xlYW51cFtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHVzZUNhcHR1cmVPclN1YklkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyB1bnJlZ2lzdGVyXG4gICAgICAgICAgICBsQ2xlYW51cFt1c2VDYXB0dXJlT3JTdWJJZHhdKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvblxuICAgICAgICAgICAgbENsZWFudXBbLXVzZUNhcHR1cmVPclN1YklkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMV1dO1xuICAgICAgICB0Q2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3Ryb3lIb29rcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdbZGVzdHJveUhvb2tzW2ldIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgZGVzdHJveSBob29rIGlmIHRoZSBjb250ZXh0IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3JGYWN0b3J5KSkge1xuICAgICAgICAoZGVzdHJveUhvb2tzW2kgKyAxXSBhcygpID0+IHZvaWQpLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBlbGVtZW50IGlmIGEgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hZGUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgLy8gTm9kZXMgb2YgdGhlIHRvcC1tb3N0IHZpZXcgY2FuIGJlIGluc2VydGVkIGVhZ2VybHkuXG4gIGlmIChpc1Jvb3RWaWV3KGN1cnJlbnRWaWV3KSkge1xuICAgIHJldHVybiBuYXRpdmVQYXJlbnROb2RlKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpKTtcbiAgfVxuXG4gIC8vIFNraXAgb3ZlciBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVycyBhcyB0aG9zZSBhcmUgcmVwcmVzZW50ZWQgYnkgYSBjb21tZW50IG5vZGUgYW5kXG4gIC8vIGNhbid0IGJlIHVzZWQgYXMgYSByZW5kZXIgcGFyZW50LlxuICBsZXQgcGFyZW50VE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIHdoaWxlIChwYXJlbnRUTm9kZSAhPSBudWxsICYmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikpIHtcbiAgICB0Tm9kZSA9IHBhcmVudFROb2RlO1xuICAgIHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBhcmVudCB0Tm9kZSBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzOiBlaXRoZXIgaW50byBhbiBlbWJlZGRlZCB2aWV3XG4gIC8vIG9yIGEgY29tcG9uZW50IHZpZXcuXG4gIGlmIChwYXJlbnRUTm9kZSA9PSBudWxsKSB7XG4gICAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgYW4gZW1iZWRkZWQgdmlldyBXZSBtaWdodCBkZWxheSBpbnNlcnRpb24gb2YgY2hpbGRyZW5cbiAgICAgIC8vIGZvciBhIGdpdmVuIHZpZXcgaWYgaXQgaXMgZGlzY29ubmVjdGVkLiBUaGlzIG1pZ2h0IGhhcHBlbiBmb3IgMiBtYWluIHJlYXNvbnM6XG4gICAgICAvLyAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lcih2aWV3IHdhcyBjcmVhdGVkIGJ1dCBub3QgaW5zZXJ0ZWQgeWV0KVxuICAgICAgLy8gLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAgICAgIC8vIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICAgICAgLy8gSW4gb3RoZXIgd29yZHMgd2UgY2FuIGluc2VydCBjaGlsZHJlbiBvZiBhIGdpdmVuIHZpZXcgaWYgdGhpcyB2aWV3IHdhcyBpbnNlcnRlZCBpbnRvIGFcbiAgICAgIC8vIGNvbnRhaW5lciBhbmQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaGFzIGl0cyByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gICAgICByZXR1cm4gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KGhvc3RUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmRcbiAgICAgIC8vIGl0IHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhob3N0VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIHJldHVybiBjdXJyZW50Vmlld1tIT1NUXTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaXNJY3VDYXNlID0gdE5vZGUgJiYgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcjtcbiAgICAvLyBJZiB0aGUgcGFyZW50IG9mIHRoaXMgbm9kZSBpcyBhbiBJQ1UgY29udGFpbmVyLCB0aGVuIGl0IGlzIHJlcHJlc2VudGVkIGJ5IGNvbW1lbnQgbm9kZSBhbmQgd2VcbiAgICAvLyBuZWVkIHRvIHVzZSBpdCBhcyBhbiBhbmNob3IuIElmIGl0IGlzIHByb2plY3RlZCB0aGVuIGl0J3MgZGlyZWN0IHBhcmVudCBub2RlIGlzIHRoZSByZW5kZXJlci5cbiAgICBpZiAoaXNJY3VDYXNlICYmIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkge1xuICAgICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KS5wYXJlbnROb2RlIGFzIFJFbGVtZW50O1xuICAgIH1cblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIGlmIChwYXJlbnRUTm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSB7XG4gICAgICBjb25zdCB0RGF0YSA9IGN1cnJlbnRWaWV3W1RWSUVXXS5kYXRhO1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtwYXJlbnRUTm9kZS5pbmRleF0gYXMgVE5vZGU7XG4gICAgICBjb25zdCBlbmNhcHN1bGF0aW9uID0gKHREYXRhW3ROb2RlLmRpcmVjdGl2ZVN0YXJ0XSBhcyBDb21wb25lbnREZWY8YW55PikuZW5jYXBzdWxhdGlvbjtcblxuICAgICAgLy8gV2UndmUgZ290IGEgcGFyZW50IHdoaWNoIGlzIGFuIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgdmlldy4gV2UganVzdCBuZWVkIHRvIHZlcmlmeSBpZiB0aGVcbiAgICAgIC8vIHBhcmVudCBlbGVtZW50IGlzIG5vdCBhIGNvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gICAgICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgICAgIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoZW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uIE5vdGUgdGhhdCB3ZSBjYW4ndFxuICAgICAgLy8gbWFrZSB0aGlzIGFzc3VtcHRpb24gd2hlbiB1c2luZyB0aGUgU2hhZG93IERPTSwgYmVjYXVzZSB0aGUgbmF0aXZlIHByb2plY3Rpb24gcGxhY2Vob2xkZXJzXG4gICAgICAvLyAoPGNvbnRlbnQ+IG9yIDxzbG90PikgaGF2ZSB0byBiZSBpbiBwbGFjZSBhcyBlbGVtZW50cyBhcmUgYmVpbmcgaW5zZXJ0ZWQuXG4gICAgICBpZiAoZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tICYmXG4gICAgICAgICAgZW5jYXBzdWxhdGlvbiAhPT0gVmlld0VuY2Fwc3VsYXRpb24uTmF0aXZlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBjdXJyZW50VmlldykgYXMgUkVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50IHVzaW5nIHtAbGluayBSZW5kZXJlcjN9LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQgLSBpdCBhYnN0cmFjdHMgYW5cbiAqIGFjdHVhbCByZW5kZXJlciBiZWluZyB1c2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJJbnNlcnRCZWZvcmUrKztcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkLCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFwcGVuZENoaWxkKys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudCwgJ3BhcmVudCBub2RlIG11c3QgYmUgZGVmaW5lZCcpO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50LCBjaGlsZCk7XG4gIH0gZWxzZSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCkge1xuICBpZiAoYmVmb3JlTm9kZSAhPT0gbnVsbCkge1xuICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQpO1xuICB9XG59XG5cbi8qKiBSZW1vdmVzIGEgbm9kZSBmcm9tIHRoZSBET00gZ2l2ZW4gaXRzIG5hdGl2ZSBwYXJlbnQuICovXG5mdW5jdGlvbiBuYXRpdmVSZW1vdmVDaGlsZChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQsIGNoaWxkLCBpc0hvc3RFbGVtZW50KTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBwYXJlbnQgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSRWxlbWVudHxudWxsIHtcbiAgcmV0dXJuIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5wYXJlbnROb2RlKG5vZGUpIDogbm9kZS5wYXJlbnROb2RlKSBhcyBSRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHNpYmxpbmcgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5uZXh0U2libGluZyhub2RlKSA6IG5vZGUubmV4dFNpYmxpbmc7XG59XG5cbi8qKlxuICogRmluZHMgYSBuYXRpdmUgXCJhbmNob3JcIiBub2RlIGZvciBjYXNlcyB3aGVyZSB3ZSBjYW4ndCBhcHBlbmQgYSBuYXRpdmUgY2hpbGQgZGlyZWN0bHlcbiAqIChgYXBwZW5kQ2hpbGRgKSBhbmQgbmVlZCB0byB1c2UgYSByZWZlcmVuY2UgKGFuY2hvcikgbm9kZSBmb3IgdGhlIGBpbnNlcnRCZWZvcmVgIG9wZXJhdGlvbi5cbiAqIEBwYXJhbSBwYXJlbnRUTm9kZVxuICogQHBhcmFtIGxWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZXxudWxsIHtcbiAgaWYgKHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGdldExDb250YWluZXIocGFyZW50VE5vZGUgYXMgVFZpZXdOb2RlLCBsVmlldyk7XG4gICAgaWYgKGxDb250YWluZXIgPT09IG51bGwpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IGluZGV4ID0gbENvbnRhaW5lci5pbmRleE9mKGxWaWV3LCBDT05UQUlORVJfSEVBREVSX09GRlNFVCkgLSBDT05UQUlORVJfSEVBREVSX09GRlNFVDtcbiAgICByZXR1cm4gZ2V0QmVmb3JlTm9kZUZvclZpZXcoaW5kZXgsIGxDb250YWluZXIpO1xuICB9IGVsc2UgaWYgKFxuICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfHxcbiAgICAgIHBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgbmF0aXZlIG5vZGUgKG9yIGEgY29sbGVjdGlvbiBvZiBub2RlcykgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIFRoZSBlbGVtZW50IGluc2VydGlvbiBtaWdodCBiZSBkZWxheWVkIHtAbGluayBjYW5JbnNlcnROYXRpdmVOb2RlfS5cbiAqXG4gKiBAcGFyYW0gY2hpbGRFbCBUaGUgbmF0aXZlIGNoaWxkIChvciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgZWxlbWVudFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChjaGlsZEVsOiBSTm9kZSB8IFJOb2RlW10sIGNoaWxkVE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KGNoaWxkVE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgaWYgKHJlbmRlclBhcmVudCAhPSBudWxsKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgIGNvbnN0IGFuY2hvck5vZGUgPSBnZXROYXRpdmVBbmNob3JOb2RlKHBhcmVudFROb2RlLCBjdXJyZW50Vmlldyk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRFbCkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRFbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50LCBjaGlsZEVsW2ldLCBhbmNob3JOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHJlbmRlclBhcmVudCwgY2hpbGRFbCwgYW5jaG9yTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCZWZvcmVOb2RlRm9yVmlldyh2aWV3SW5kZXhJbkNvbnRhaW5lcjogbnVtYmVyLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogUk5vZGV8XG4gICAgbnVsbCB7XG4gIGNvbnN0IG5leHRWaWV3SW5kZXggPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHZpZXdJbmRleEluQ29udGFpbmVyICsgMTtcbiAgaWYgKG5leHRWaWV3SW5kZXggPCBsQ29udGFpbmVyLmxlbmd0aCkge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltuZXh0Vmlld0luZGV4XSBhcyBMVmlldztcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tUX0hPU1RdLCAnTWlzc2luZyBIb3N0IFROb2RlJyk7XG4gICAgbGV0IHRWaWV3Tm9kZUNoaWxkID0gKGxWaWV3W1RfSE9TVF0gYXMgVFZpZXdOb2RlKS5jaGlsZDtcbiAgICBpZiAodFZpZXdOb2RlQ2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGlmICh0Vmlld05vZGVDaGlsZC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICAgIHRWaWV3Tm9kZUNoaWxkLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICAgICAgbGV0IGN1cnJlbnRDaGlsZCA9IHRWaWV3Tm9kZUNoaWxkLmNoaWxkO1xuICAgICAgICB3aGlsZSAoY3VycmVudENoaWxkICYmIChjdXJyZW50Q2hpbGQudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENoaWxkLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpKSB7XG4gICAgICAgICAgY3VycmVudENoaWxkID0gY3VycmVudENoaWxkLmNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIHRWaWV3Tm9kZUNoaWxkID0gY3VycmVudENoaWxkIHx8IHRWaWV3Tm9kZUNoaWxkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGVPck51bGwodFZpZXdOb2RlQ2hpbGQsIGxWaWV3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbENvbnRhaW5lcltOQVRJVkVdO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBuYXRpdmUgbm9kZSBpdHNlbGYgdXNpbmcgYSBnaXZlbiByZW5kZXJlci4gVG8gcmVtb3ZlIHRoZSBub2RlIHdlIGFyZSBsb29raW5nIHVwIGl0c1xuICogcGFyZW50IGZyb20gdGhlIG5hdGl2ZSB0cmVlIGFzIG5vdCBhbGwgcGxhdGZvcm1zIC8gYnJvd3NlcnMgc3VwcG9ydCB0aGUgZXF1aXZhbGVudCBvZlxuICogbm9kZS5yZW1vdmUoKS5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byBiZSB1c2VkXG4gKiBAcGFyYW0gck5vZGUgVGhlIG5hdGl2ZSBub2RlIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBpc0hvc3RFbGVtZW50IEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgbm9kZSB0byBiZSByZW1vdmVkIGlzIGEgaG9zdCBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXI6IFJlbmRlcmVyMywgck5vZGU6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBuYXRpdmVQYXJlbnQgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCByTm9kZSk7XG4gIGlmIChuYXRpdmVQYXJlbnQpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChyZW5kZXJlciwgbmF0aXZlUGFyZW50LCByTm9kZSwgaXNIb3N0RWxlbWVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFBlcmZvcm1zIHRoZSBvcGVyYXRpb24gb2YgYGFjdGlvbmAgb24gdGhlIG5vZGUuIFR5cGljYWxseSB0aGlzIGludm9sdmVzIGluc2VydGluZyBvciByZW1vdmluZ1xuICogbm9kZXMgb24gdGhlIExWaWV3IG9yIHByb2plY3Rpb24gYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Tm9kZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCB0Tm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcsXG4gICAgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCwgaXNQcm9qZWN0aW9uOiBib29sZWFuKSB7XG4gIHdoaWxlICh0Tm9kZSAhPSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGxWaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsXG4gICAgICAgICAgICAgICAgICAgICBUTm9kZVR5cGUuUHJvamVjdGlvbiwgVE5vZGVUeXBlLlByb2plY3Rpb24sIFROb2RlVHlwZS5JY3VDb250YWluZXIpO1xuICAgIGNvbnN0IHJhd1Nsb3RWYWx1ZSA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmIChpc1Byb2plY3Rpb24pIHtcbiAgICAgIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlKSB7XG4gICAgICAgIHJhd1Nsb3RWYWx1ZSAmJiBhdHRhY2hQYXRjaERhdGEodW53cmFwUk5vZGUocmF3U2xvdFZhbHVlKSwgbFZpZXcpO1xuICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSAhPT0gVE5vZGVGbGFncy5pc0RldGFjaGVkKSB7XG4gICAgICBpZiAodE5vZGVUeXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fCB0Tm9kZVR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXIpIHtcbiAgICAgICAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB0Tm9kZS5jaGlsZCwgbFZpZXcsIHJlbmRlclBhcmVudCwgYmVmb3JlTm9kZSwgZmFsc2UpO1xuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgcmF3U2xvdFZhbHVlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBhcHBseVByb2plY3Rpb25SZWN1cnNpdmUoXG4gICAgICAgICAgICByZW5kZXJlciwgYWN0aW9uLCBsVmlldywgdE5vZGUgYXMgVFByb2plY3Rpb25Ob2RlLCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gaXNQcm9qZWN0aW9uID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICB9XG59XG5cblxuLyoqXG4gKiBgYXBwbHlWaWV3YCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHZpZXcgYXMgc3BlY2lmaWVkIGluIGBhY3Rpb25gIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqXG4gKiBJbnNlcnRpbmcgYSB2aWV3IHdpdGhvdXQgcHJvamVjdGlvbiBvciBjb250YWluZXJzIGF0IHRvcCBsZXZlbCBpcyBzaW1wbGUuIEp1c3QgaXRlcmF0ZSBvdmVyIHRoZVxuICogcm9vdCBub2RlcyBvZiB0aGUgVmlldywgYW5kIGZvciBlYWNoIG5vZGUgcGVyZm9ybSB0aGUgYGFjdGlvbmAuXG4gKlxuICogVGhpbmdzIGdldCBtb3JlIGNvbXBsaWNhdGVkIHdpdGggY29udGFpbmVycyBhbmQgcHJvamVjdGlvbnMuIFRoYXQgaXMgYmVjYXVzZSBjb21pbmcgYWNyb3NzOlxuICogLSBDb250YWluZXI6IGltcGxpZXMgdGhhdCB3ZSBoYXZlIHRvIGluc2VydC9yZW1vdmUvZGVzdHJveSB0aGUgdmlld3Mgb2YgdGhhdCBjb250YWluZXIgYXMgd2VsbFxuICogICAgICAgICAgICAgIHdoaWNoIGluIHR1cm4gY2FuIGhhdmUgdGhlaXIgb3duIENvbnRhaW5lcnMgYXQgdGhlIFZpZXcgcm9vdHMuXG4gKiAtIFByb2plY3Rpb246IGltcGxpZXMgdGhhdCB3ZSBoYXZlIHRvIGluc2VydC9yZW1vdmUvZGVzdHJveSB0aGUgbm9kZXMgb2YgdGhlIHByb2plY3Rpb24uIFRoZVxuICogICAgICAgICAgICAgICBjb21wbGljYXRpb24gaXMgdGhhdCB0aGUgbm9kZXMgd2UgYXJlIHByb2plY3RpbmcgY2FuIHRoZW1zZWx2ZXMgaGF2ZSBDb250YWluZXJzXG4gKiAgICAgICAgICAgICAgIG9yIG90aGVyIFByb2plY3Rpb25zLlxuICpcbiAqIEFzIHlvdSBjYW4gc2VlIHRoaXMgaXMgYSB2ZXJ5IHJlY3Vyc2l2ZSBwcm9ibGVtLiBZZXMgcmVjdXJzaW9uIGlzIG5vdCBtb3N0IGVmZmljaWVudCBidXQgdGhlXG4gKiBjb2RlIGlzIGNvbXBsaWNhdGVkIGVub3VnaCB0aGF0IHRyeWluZyB0byBpbXBsZW1lbnRlZCB3aXRoIHJlY3Vyc2lvbiBiZWNvbWVzIHVubWFpbnRhaW5hYmxlLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxWaWV3OiBMVmlldywgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodFZpZXcubm9kZSAhLCBUTm9kZVR5cGUuVmlldyk7XG4gIGNvbnN0IHZpZXdSb290VE5vZGU6IFROb2RlfG51bGwgPSB0Vmlldy5ub2RlICEuY2hpbGQ7XG4gIGFwcGx5Tm9kZXMocmVuZGVyZXIsIGFjdGlvbiwgdmlld1Jvb3RUTm9kZSwgbFZpZXcsIHJlbmRlclBhcmVudCwgYmVmb3JlTm9kZSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIGBhcHBseVByb2plY3Rpb25gIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgcHJvamVjdGlvbi5cbiAqXG4gKiBJbnNlcnRpbmcgYSBwcm9qZWN0aW9uIHJlcXVpcmVzIHVzIHRvIGxvY2F0ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuIFRoZVxuICogY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhvc2Ugbm9kZXMgdGhlbXNlbHZlcyBjb3VsZCBiZSByZS1wcm9qZWN0ZWQgZnJvbSB0aGVpciBwYXJlbnQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIG5vZGUgdG8gcHJvamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uKGxWaWV3OiBMVmlldywgdFByb2plY3Rpb25Ob2RlOiBUUHJvamVjdGlvbk5vZGUpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHJlbmRlclBhcmVudCA9IGdldFJlbmRlclBhcmVudCh0UHJvamVjdGlvbk5vZGUsIGxWaWV3KTtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSB0UHJvamVjdGlvbk5vZGUucGFyZW50IHx8IGxWaWV3W1RfSE9TVF0gITtcbiAgbGV0IGJlZm9yZU5vZGUgPSBnZXROYXRpdmVBbmNob3JOb2RlKHBhcmVudFROb2RlLCBsVmlldyk7XG4gIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICAgIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkNyZWF0ZSwgbFZpZXcsIHRQcm9qZWN0aW9uTm9kZSwgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlKTtcbn1cblxuLyoqXG4gKiBgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlYCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHByb2plY3Rpb24gc3BlY2lmaWVkIGJ5IGBhY3Rpb25gIChpbnNlcnQsXG4gKiBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBub2RlIHRvIHByb2plY3RcbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxWaWV3OiBMVmlldyxcbiAgICB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSwgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCkge1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGxWaWV3KTtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudExWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHR5cGVvZiB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiwgJ251bWJlcicsICdleHBlY3RpbmcgcHJvamVjdGlvbiBpbmRleCcpO1xuICBjb25zdCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMgPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24gIVt0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbl0gITtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZVRvUHJvamVjdE9yUk5vZGVzKSkge1xuICAgIC8vIFRoaXMgc2hvdWxkIG5vdCBleGlzdCwgaXQgaXMgYSBiaXQgb2YgYSBoYWNrLiBXaGVuIHdlIGJvb3RzdHJhcCBhIHRvcCBsZXZlbCBub2RlIGFuZCB3ZVxuICAgIC8vIG5lZWQgdG8gc3VwcG9ydCBwYXNzaW5nIHByb2plY3RhYmxlIG5vZGVzLCBzbyB3ZSBjaGVhdCBhbmQgcHV0IHRoZW0gaW4gdGhlIFROb2RlXG4gICAgLy8gb2YgdGhlIEhvc3QgVFZpZXcuIChZZXMgd2UgcHV0IGluc3RhbmNlIGluZm8gYXQgdGhlIFQgTGV2ZWwpLiBXZSBjYW4gZ2V0IGF3YXkgd2l0aCBpdFxuICAgIC8vIGJlY2F1c2Ugd2Uga25vdyB0aGF0IHRoYXQgVFZpZXcgaXMgbm90IHNoYXJlZCBhbmQgdGhlcmVmb3JlIGl0IHdpbGwgbm90IGJlIGEgcHJvYmxlbS5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSByZWZhY3RvcmVkIGFuZCBjbGVhbmVkIHVwLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZVRvUHJvamVjdE9yUk5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByTm9kZSA9IG5vZGVUb1Byb2plY3RPclJOb2Rlc1tpXTtcbiAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBub2RlVG9Qcm9qZWN0OiBUTm9kZXxudWxsID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzO1xuICAgIGNvbnN0IHByb2plY3RlZENvbXBvbmVudExWaWV3ID0gY29tcG9uZW50TFZpZXdbUEFSRU5UXSBhcyBMVmlldztcbiAgICBhcHBseU5vZGVzKFxuICAgICAgICByZW5kZXJlciwgYWN0aW9uLCBub2RlVG9Qcm9qZWN0LCBwcm9qZWN0ZWRDb21wb25lbnRMVmlldywgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5cbi8qKlxuICogYGFwcGx5Q29udGFpbmVyYCBwZXJmb3JtcyBhbiBvcGVyYXRpb24gb24gdGhlIGNvbnRhaW5lciBhbmQgaXRzIHZpZXdzIGFzIHNwZWNpZmllZCBieVxuICogYGFjdGlvbmAgKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIENvbnRhaW5lciBpcyBjb21wbGljYXRlZCBieSB0aGUgZmFjdCB0aGF0IHRoZSBjb250YWluZXIgbWF5IGhhdmUgVmlld3Mgd2hpY2hcbiAqIHRoZW1zZWx2ZXMgaGF2ZSBjb250YWluZXJzIG9yIHByb2plY3Rpb25zLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIExDb250YWluZXIgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcmVuZGVyUGFyZW50IHBhcmVudCBET00gZWxlbWVudCBmb3IgaW5zZXJ0aW9uL3JlbW92YWwuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBCZWZvcmUgd2hpY2ggbm9kZSB0aGUgaW5zZXJ0aW9ucyBzaG91bGQgaGFwcGVuLlxuICovXG5mdW5jdGlvbiBhcHBseUNvbnRhaW5lcihcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxDb250YWluZXI6IExDb250YWluZXIsXG4gICAgcmVuZGVyUGFyZW50OiBSRWxlbWVudCB8IG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3QgYW5jaG9yID0gbENvbnRhaW5lcltOQVRJVkVdOyAgLy8gTENvbnRhaW5lciBoYXMgaXRzIG93biBiZWZvcmUgbm9kZS5cbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUobENvbnRhaW5lcik7XG4gIC8vIEFuIExDb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgb24gYW55IG5vZGUgYnkgaW5qZWN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gIC8vIEFza2luZyBmb3IgYSBWaWV3Q29udGFpbmVyUmVmIG9uIGFuIGVsZW1lbnQgd2lsbCByZXN1bHQgaW4gYSBjcmVhdGlvbiBvZiBhIHNlcGFyYXRlIGFuY2hvciBub2RlXG4gIC8vIChjb21tZW50IGluIHRoZSBET00pIHRoYXQgd2lsbCBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgTENvbnRhaW5lcidzIGhvc3Qgbm9kZS4gSW4gdGhpcyBwYXJ0aWN1bGFyXG4gIC8vIGNhc2Ugd2UgbmVlZCB0byBleGVjdXRlIGFjdGlvbiBvbiAyIG5vZGVzOlxuICAvLyAtIGNvbnRhaW5lcidzIGhvc3Qgbm9kZSAodGhpcyBpcyBkb25lIGluIHRoZSBleGVjdXRlQWN0aW9uT25FbGVtZW50T3JDb250YWluZXIpXG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaGVyZSlcbiAgaWYgKGFuY2hvciAhPT0gbmF0aXZlKSB7XG4gICAgLy8gVGhpcyBpcyB2ZXJ5IHN0cmFuZ2UgdG8gbWUgKE1pc2tvKS4gSSB3b3VsZCBleHBlY3QgdGhhdCB0aGUgbmF0aXZlIGlzIHNhbWUgYXMgYW5jaG9yLiBJIGRvbid0XG4gICAgLy8gc2VlIGEgcmVhc29uIHdoeSB0aGV5IHNob3VsZCBiZSBkaWZmZXJlbnQsIGJ1dCB0aGV5IGFyZS5cbiAgICAvL1xuICAgIC8vIElmIHRoZXkgYXJlIHdlIG5lZWQgdG8gcHJvY2VzcyB0aGUgc2Vjb25kIGFuY2hvciBhcyB3ZWxsLlxuICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCBhbmNob3IsIGJlZm9yZU5vZGUpO1xuICB9XG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBsVmlldyA9IGxDb250YWluZXJbaV0gYXMgTFZpZXc7XG4gICAgYXBwbHlWaWV3KHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCByZW5kZXJQYXJlbnQsIGFuY2hvcik7XG4gIH1cbn1cbiJdfQ==