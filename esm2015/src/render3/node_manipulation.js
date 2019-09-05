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
        ngDevMode && assertDomNode(rNode);
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
            return getHostNative(currentView);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsdUJBQXVCLEVBQWMsV0FBVyxFQUFFLE1BQU0sRUFBRSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUxSSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQXlFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25KLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQXlELG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQStCLElBQUksRUFBRSxNQUFN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LFdBQVcsQ0FBQyxVQUFVLENBQUM7SUFDdEMsc0ZBQXNGO0lBQ3RGLGtHQUFrRztJQUNsRyxrR0FBa0c7SUFDbEcsNkNBQTZDO0lBQzdDLGtGQUFrRjtJQUNsRiw4Q0FBOEM7SUFDOUMsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO1FBQ3JCLGdHQUFnRztRQUNoRywyREFBMkQ7UUFDM0QsRUFBRTtRQUNGLDREQUE0RDtRQUM1RCx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDL0U7SUFDRCxLQUFLLElBQUksQ0FBQyxHQUFHLHVCQUF1QixFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztjQUMxRCxLQUFLLEdBQUcsbUJBQUEsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFTO1FBQ3BDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDMUQ7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7YWRkVG9BcnJheSwgcmVtb3ZlRnJvbUFycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTLCBOQVRJVkUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRWaWV3Tm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHt1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlldywgaXNSb290Vmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0xFQU5VUCwgREVDTEFSQVRJT05fTENPTlRBSU5FUiwgRkxBR1MsIEhPU1QsIEhvb2tEYXRhLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRfSE9TVCwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3LCBnZXRMVmlld1BhcmVudH0gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCwgdW53cmFwUk5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMiArIHVudXNlZDMgKyB1bnVzZWQ0ICsgdW51c2VkNTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldExDb250YWluZXIodE5vZGU6IFRWaWV3Tm9kZSwgZW1iZWRkZWRWaWV3OiBMVmlldyk6IExDb250YWluZXJ8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhlbWJlZGRlZFZpZXcpO1xuICBjb25zdCBjb250YWluZXIgPSBlbWJlZGRlZFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBpZiAodE5vZGUuaW5kZXggPT09IC0xKSB7XG4gICAgLy8gVGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldyBpbnNpZGUgYSBkeW5hbWljIGNvbnRhaW5lci5cbiAgICAvLyBUaGUgcGFyZW50IGlzbid0IGFuIExDb250YWluZXIgaWYgdGhlIGVtYmVkZGVkIHZpZXcgaGFzbid0IGJlZW4gYXR0YWNoZWQgeWV0LlxuICAgIHJldHVybiBpc0xDb250YWluZXIoY29udGFpbmVyKSA/IGNvbnRhaW5lciA6IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoY29udGFpbmVyKTtcbiAgICAvLyBUaGlzIGlzIGEgaW5saW5lIHZpZXcgbm9kZSAoZS5nLiBlbWJlZGRlZFZpZXdTdGFydClcbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXRyaWV2ZXMgcmVuZGVyIHBhcmVudCBmb3IgYSBnaXZlbiB2aWV3LlxuICogTWlnaHQgYmUgbnVsbCBpZiBhIHZpZXcgaXMgbm90IHlldCBhdHRhY2hlZCB0byBhbnkgY29udGFpbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KHRWaWV3Tm9kZTogVFZpZXdOb2RlLCB2aWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBjb25zdCBjb250YWluZXIgPSBnZXRMQ29udGFpbmVyKHRWaWV3Tm9kZSwgdmlldyk7XG4gIHJldHVybiBjb250YWluZXIgPyBuYXRpdmVQYXJlbnROb2RlKHZpZXdbUkVOREVSRVJdLCBjb250YWluZXJbTkFUSVZFXSkgOiBudWxsO1xufVxuXG5jb25zdCBlbnVtIFdhbGtUTm9kZVRyZWVBY3Rpb24ge1xuICAvKiogbm9kZSBjcmVhdGUgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudC4gUnVuIG9uIGluaXRpYWwgY3JlYXRpb24uICovXG4gIENyZWF0ZSA9IDAsXG5cbiAgLyoqXG4gICAqIG5vZGUgaW5zZXJ0IGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQuXG4gICAqIFJ1biB3aGVuIGV4aXN0aW5nIG5vZGUgaGFzIGJlZW4gZGV0YWNoZWQgYW5kIG5lZWRzIHRvIGJlIHJlLWF0dGFjaGVkLlxuICAgKi9cbiAgSW5zZXJ0ID0gMSxcblxuICAvKiogbm9kZSBkZXRhY2ggZnJvbSB0aGUgbmF0aXZlIGVudmlyb25tZW50ICovXG4gIERldGFjaCA9IDIsXG5cbiAgLyoqIG5vZGUgZGVzdHJ1Y3Rpb24gdXNpbmcgdGhlIHJlbmRlcmVyJ3MgQVBJICovXG4gIERlc3Ryb3kgPSAzLFxufVxuXG5cblxuLyoqXG4gKiBOT1RFOiBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIHBvc3NpYmxlIGFjdGlvbnMgYXJlIGlubGluZWQgd2l0aGluIHRoZSBmdW5jdGlvbiBpbnN0ZWFkIG9mXG4gKiBiZWluZyBwYXNzZWQgYXMgYW4gYXJndW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoXG4gICAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCByZW5kZXJlcjogUmVuZGVyZXIzLCBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBsTm9kZVRvSGFuZGxlOiBSTm9kZSB8IExDb250YWluZXIgfCBMVmlldywgYmVmb3JlTm9kZT86IFJOb2RlIHwgbnVsbCkge1xuICAvLyBJZiB0aGlzIHNsb3Qgd2FzIGFsbG9jYXRlZCBmb3IgYSB0ZXh0IG5vZGUgZHluYW1pY2FsbHkgY3JlYXRlZCBieSBpMThuLCB0aGUgdGV4dCBub2RlIGl0c2VsZlxuICAvLyB3b24ndCBiZSBjcmVhdGVkIHVudGlsIGkxOG5BcHBseSgpIGluIHRoZSB1cGRhdGUgYmxvY2ssIHNvIHRoaXMgbm9kZSBzaG91bGQgYmUgc2tpcHBlZC5cbiAgLy8gRm9yIG1vcmUgaW5mbywgc2VlIFwiSUNVIGV4cHJlc3Npb25zIHNob3VsZCB3b3JrIGluc2lkZSBhbiBuZ1RlbXBsYXRlT3V0bGV0IGluc2lkZSBhbiBuZ0ZvclwiXG4gIC8vIGluIGBpMThuX3NwZWMudHNgLlxuICBpZiAobE5vZGVUb0hhbmRsZSAhPSBudWxsKSB7XG4gICAgbGV0IGxDb250YWluZXI6IExDb250YWluZXJ8dW5kZWZpbmVkO1xuICAgIGxldCBpc0NvbXBvbmVudCA9IGZhbHNlO1xuICAgIC8vIFdlIGFyZSBleHBlY3RpbmcgYW4gUk5vZGUsIGJ1dCBpbiB0aGUgY2FzZSBvZiBhIGNvbXBvbmVudCBvciBMQ29udGFpbmVyIHRoZSBgUk5vZGVgIGlzXG4gICAgLy8gd3JhcHBlZCBpbiBhbiBhcnJheSB3aGljaCBuZWVkcyB0byBiZSB1bndyYXBwZWQuIFdlIG5lZWQgdG8ga25vdyBpZiBpdCBpcyBhIGNvbXBvbmVudCBhbmQgaWZcbiAgICAvLyBpdCBoYXMgTENvbnRhaW5lciBzbyB0aGF0IHdlIGNhbiBwcm9jZXNzIGFsbCBvZiB0aG9zZSBjYXNlcyBhcHByb3ByaWF0ZWx5LlxuICAgIGlmIChpc0xDb250YWluZXIobE5vZGVUb0hhbmRsZSkpIHtcbiAgICAgIGxDb250YWluZXIgPSBsTm9kZVRvSGFuZGxlO1xuICAgIH0gZWxzZSBpZiAoaXNMVmlldyhsTm9kZVRvSGFuZGxlKSkge1xuICAgICAgaXNDb21wb25lbnQgPSB0cnVlO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobE5vZGVUb0hhbmRsZVtIT1NUXSwgJ0hPU1QgbXVzdCBiZSBkZWZpbmVkIGZvciBhIGNvbXBvbmVudCBMVmlldycpO1xuICAgICAgbE5vZGVUb0hhbmRsZSA9IGxOb2RlVG9IYW5kbGVbSE9TVF0gITtcbiAgICB9XG4gICAgY29uc3Qgck5vZGU6IFJOb2RlID0gdW53cmFwUk5vZGUobE5vZGVUb0hhbmRsZSk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUock5vZGUpO1xuXG4gICAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBpZiAoYmVmb3JlTm9kZSA9PSBudWxsKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgck5vZGUsIGJlZm9yZU5vZGUgfHwgbnVsbCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCByTm9kZSwgaXNDb21wb25lbnQpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3lOb2RlICEock5vZGUpO1xuICAgIH1cbiAgICBpZiAobENvbnRhaW5lciAhPSBudWxsKSB7XG4gICAgICBhcHBseUNvbnRhaW5lcihyZW5kZXJlciwgYWN0aW9uLCBsQ29udGFpbmVyLCBwYXJlbnQsIGJlZm9yZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IHN0cmluZywgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHJldHVybiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5jcmVhdGVUZXh0KHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGxWaWV3OiBMVmlldywgaW5zZXJ0TW9kZTogdHJ1ZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihsVmlldzogTFZpZXcsIGluc2VydE1vZGU6IGZhbHNlLCBiZWZvcmVOb2RlOiBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBsVmlldzogTFZpZXcsIGluc2VydE1vZGU6IGJvb2xlYW4sIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRDb250YWluZXJSZW5kZXJQYXJlbnQobFZpZXdbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlLCBsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShsVmlld1tUVklFV10ubm9kZSBhcyBUTm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICBpZiAocmVuZGVyUGFyZW50KSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgYWN0aW9uID0gaW5zZXJ0TW9kZSA/IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0IDogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2g7XG4gICAgYXBwbHlWaWV3KHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogRGV0YWNoIGEgYExWaWV3YCBmcm9tIHRoZSBET00gYnkgZGV0YWNoaW5nIGl0cyBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2AgdG8gYmUgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZXRhY2hWaWV3KGxWaWV3OiBMVmlldykge1xuICBhcHBseVZpZXcobFZpZXdbUkVOREVSRVJdLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbFZpZXcsIG51bGwsIG51bGwpO1xufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBsZXQgbFZpZXdPckxDb250YWluZXIgPSByb290Vmlld1tDSElMRF9IRUFEXTtcbiAgaWYgKCFsVmlld09yTENvbnRhaW5lcikge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlldyk7XG4gIH1cblxuICB3aGlsZSAobFZpZXdPckxDb250YWluZXIpIHtcbiAgICBsZXQgbmV4dDogTFZpZXd8TENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSkge1xuICAgICAgLy8gSWYgTFZpZXcsIHRyYXZlcnNlIGRvd24gdG8gY2hpbGQuXG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXJbQ0hJTERfSEVBRF07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgIC8vIElmIGNvbnRhaW5lciwgdHJhdmVyc2UgZG93biB0byBpdHMgZmlyc3QgTFZpZXcuXG4gICAgICBjb25zdCBmaXJzdFZpZXc6IExWaWV3fHVuZGVmaW5lZCA9IGxWaWV3T3JMQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXTtcbiAgICAgIGlmIChmaXJzdFZpZXcpIG5leHQgPSBmaXJzdFZpZXc7XG4gICAgfVxuXG4gICAgaWYgKCFuZXh0KSB7XG4gICAgICAvLyBPbmx5IGNsZWFuIHVwIHZpZXcgd2hlbiBtb3ZpbmcgdG8gdGhlIHNpZGUgb3IgdXAsIGFzIGRlc3Ryb3kgaG9va3NcbiAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgaW4gb3JkZXIgZnJvbSB0aGUgYm90dG9tIHVwLlxuICAgICAgd2hpbGUgKGxWaWV3T3JMQ29udGFpbmVyICYmICFsVmlld09yTENvbnRhaW5lciAhW05FWFRdICYmIGxWaWV3T3JMQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lcik7XG4gICAgICAgIGxWaWV3T3JMQ29udGFpbmVyID0gZ2V0UGFyZW50U3RhdGUobFZpZXdPckxDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KGxWaWV3T3JMQ29udGFpbmVyIHx8IHJvb3RWaWV3KTtcbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lciAmJiBsVmlld09yTENvbnRhaW5lciAhW05FWFRdO1xuICAgIH1cbiAgICBsVmlld09yTENvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIGluZGV4IFdoaWNoIGluZGV4IGluIHRoZSBjb250YWluZXIgdG8gaW5zZXJ0IHRoZSBjaGlsZCB2aWV3IGludG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcobFZpZXc6IExWaWV3LCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICBjb25zdCBpbmRleEluQ29udGFpbmVyID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyBpbmRleDtcbiAgY29uc3QgY29udGFpbmVyTGVuZ3RoID0gbENvbnRhaW5lci5sZW5ndGg7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lciAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cbiAgaWYgKGluZGV4IDwgY29udGFpbmVyTGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHtcbiAgICBsVmlld1tORVhUXSA9IGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lcl07XG4gICAgYWRkVG9BcnJheShsQ29udGFpbmVyLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIGluZGV4LCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgbENvbnRhaW5lci5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyB0cmFjayB2aWV3cyB3aGVyZSBkZWNsYXJhdGlvbiBhbmQgaW5zZXJ0aW9uIHBvaW50cyBhcmUgZGlmZmVyZW50XG4gIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IGxWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBudWxsICYmIGxDb250YWluZXIgIT09IGRlY2xhcmF0aW9uTENvbnRhaW5lcikge1xuICAgIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uTENvbnRhaW5lciwgbFZpZXcpO1xuICB9XG5cbiAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBjb25zdCBsUXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBsUXVlcmllcy5pbnNlcnRWaWV3KGxWaWV3W1RWSUVXXSk7XG4gIH1cblxuICAvLyBTZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIFRyYWNrIHZpZXdzIGNyZWF0ZWQgZnJvbSB0aGUgZGVjbGFyYXRpb24gY29udGFpbmVyIChUZW1wbGF0ZVJlZikgYW5kIGluc2VydGVkIGludG8gYVxuICogZGlmZmVyZW50IExDb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyOiBMQ29udGFpbmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25Db250YWluZXIpO1xuICBjb25zdCBkZWNsYXJlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdO1xuICBpZiAoZGVjbGFyZWRWaWV3cyA9PT0gbnVsbCkge1xuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSA9IFtsVmlld107XG4gIH0gZWxzZSB7XG4gICAgZGVjbGFyZWRWaWV3cy5wdXNoKGxWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSxcbiAgICAgICAgICAgICAgICAgICAnQSBwcm9qZWN0ZWQgdmlldyBzaG91bGQgYmVsb25nIHRvIGEgbm9uLWVtcHR5IHByb2plY3RlZCB2aWV3cyBjb2xsZWN0aW9uJyk7XG4gIGNvbnN0IHByb2plY3RlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdICE7XG4gIGNvbnN0IGRlY2xhcmVkVmlld0luZGV4ID0gcHJvamVjdGVkVmlld3MuaW5kZXhPZihsVmlldyk7XG4gIHByb2plY3RlZFZpZXdzLnNwbGljZShkZWNsYXJlZFZpZXdJbmRleCwgMSk7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2QgcmVtb3ZlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBEZXRhY2hlZCBMVmlldyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3fHVuZGVmaW5lZCB7XG4gIGlmIChsQ29udGFpbmVyLmxlbmd0aCA8PSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkgcmV0dXJuO1xuXG4gIGNvbnN0IGluZGV4SW5Db250YWluZXIgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHJlbW92ZUluZGV4O1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXJdO1xuXG4gIGlmICh2aWV3VG9EZXRhY2gpIHtcbiAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSB2aWV3VG9EZXRhY2hbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbnVsbCAmJiBkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IGxDb250YWluZXIpIHtcbiAgICAgIGRldGFjaE1vdmVkVmlldyhkZWNsYXJhdGlvbkxDb250YWluZXIsIHZpZXdUb0RldGFjaCk7XG4gICAgfVxuXG5cbiAgICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlldztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlZExWaWV3ID0gcmVtb3ZlRnJvbUFycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXgpO1xuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaCwgZmFsc2UsIG51bGwpO1xuXG4gICAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgICBjb25zdCBsUXVlcmllcyA9IHJlbW92ZWRMVmlld1tRVUVSSUVTXTtcbiAgICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcocmVtb3ZlZExWaWV3W1RWSUVXXSk7XG4gICAgfVxuXG4gICAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICAgIHZpZXdUb0RldGFjaFtORVhUXSA9IG51bGw7XG4gICAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gICAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgfVxuICByZXR1cm4gdmlld1RvRGV0YWNoO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIsIGkuZS4gZGV0YWNoZXMgaXQgYW5kIHRoZW4gZGVzdHJveXMgdGhlIHVuZGVybHlpbmcgTFZpZXcuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgZGV0YWNoZWRWaWV3ID0gZGV0YWNoVmlldyhsQ29udGFpbmVyLCByZW1vdmVJbmRleCk7XG4gIGRldGFjaGVkVmlldyAmJiBkZXN0cm95TFZpZXcoZGV0YWNoZWRWaWV3KTtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFudXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcobFZpZXc6IExWaWV3KSB7XG4gIGlmICghKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgJiYgcmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICAgIGFwcGx5VmlldyhyZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCBsVmlldywgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgZGVzdHJveVZpZXdUcmVlKGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hpY2ggTFZpZXdPckxDb250YWluZXIgdG8ganVtcCB0byB3aGVuIHRyYXZlcnNpbmcgYmFjayB1cCB0aGVcbiAqIHRyZWUgaW4gZGVzdHJveVZpZXdUcmVlLlxuICpcbiAqIE5vcm1hbGx5LCB0aGUgdmlldydzIHBhcmVudCBMVmlldyBzaG91bGQgYmUgY2hlY2tlZCwgYnV0IGluIHRoZSBjYXNlIG9mXG4gKiBlbWJlZGRlZCB2aWV3cywgdGhlIGNvbnRhaW5lciAod2hpY2ggaXMgdGhlIHZpZXcgbm9kZSdzIHBhcmVudCwgYnV0IG5vdCB0aGVcbiAqIExWaWV3J3MgcGFyZW50KSBuZWVkcyB0byBiZSBjaGVja2VkIGZvciBhIHBvc3NpYmxlIG5leHQgcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlld09yTENvbnRhaW5lciBmb3Igd2hpY2ggd2UgbmVlZCBhIHBhcmVudCBzdGF0ZVxuICogQHBhcmFtIHJvb3RWaWV3IFRoZSByb290Vmlldywgc28gd2UgZG9uJ3QgcHJvcGFnYXRlIHRvbyBmYXIgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIGNvcnJlY3QgcGFyZW50IExWaWV3T3JMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRTdGF0ZShsVmlld09yTENvbnRhaW5lcjogTFZpZXcgfCBMQ29udGFpbmVyLCByb290VmlldzogTFZpZXcpOiBMVmlld3xcbiAgICBMQ29udGFpbmVyfG51bGwge1xuICBsZXQgdE5vZGU7XG4gIGlmIChpc0xWaWV3KGxWaWV3T3JMQ29udGFpbmVyKSAmJiAodE5vZGUgPSBsVmlld09yTENvbnRhaW5lcltUX0hPU1RdKSAmJlxuICAgICAgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBpZiBpdCdzIGFuIGVtYmVkZGVkIHZpZXcsIHRoZSBzdGF0ZSBuZWVkcyB0byBnbyB1cCB0byB0aGUgY29udGFpbmVyLCBpbiBjYXNlIHRoZVxuICAgIC8vIGNvbnRhaW5lciBoYXMgYSBuZXh0XG4gICAgcmV0dXJuIGdldExDb250YWluZXIodE5vZGUgYXMgVFZpZXdOb2RlLCBsVmlld09yTENvbnRhaW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgcGFyZW50IHZpZXcgZm9yIGNvbnRhaW5lcnMgb3IgY29tcG9uZW50IHZpZXdzXG4gICAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyW1BBUkVOVF0gPT09IHJvb3RWaWV3ID8gbnVsbCA6IGxWaWV3T3JMQ29udGFpbmVyW1BBUkVOVF07XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkRlc3Ryb3lzIGhvb2tzIGZvciBhbGwgZGlyZWN0aXZlcyBhbmQgcGlwZXMgaW4gYSBnaXZlbiB2aWV3IGFuZCB0aGVuIHJlbW92ZXMgYWxsXG4gKiBsaXN0ZW5lcnMuIExpc3RlbmVycyBhcmUgcmVtb3ZlZCBhcyB0aGUgbGFzdCBzdGVwIHNvIGV2ZW50cyBkZWxpdmVyZWQgaW4gdGhlIG9uRGVzdHJveXMgaG9va3NcbiAqIGNhbiBiZSBwcm9wYWdhdGVkIHRvIEBPdXRwdXQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3OiBMVmlldyB8IExDb250YWluZXIpOiB2b2lkIHtcbiAgaWYgKGlzTFZpZXcodmlldykgJiYgISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIC8vIFVzdWFsbHkgdGhlIEF0dGFjaGVkIGZsYWcgaXMgcmVtb3ZlZCB3aGVuIHRoZSB2aWV3IGlzIGRldGFjaGVkIGZyb20gaXRzIHBhcmVudCwgaG93ZXZlclxuICAgIC8vIGlmIGl0J3MgYSByb290IHZpZXcsIHRoZSBmbGFnIHdvbid0IGJlIHVuc2V0IGhlbmNlIHdoeSB3ZSdyZSBhbHNvIHJlbW92aW5nIG9uIGRlc3Ryb3kuXG4gICAgdmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgICAvLyBNYXJrIHRoZSBMVmlldyBhcyBkZXN0cm95ZWQgKmJlZm9yZSogZXhlY3V0aW5nIHRoZSBvbkRlc3Ryb3kgaG9va3MuIEFuIG9uRGVzdHJveSBob29rXG4gICAgLy8gcnVucyBhcmJpdHJhcnkgdXNlciBjb2RlLCB3aGljaCBjb3VsZCBpbmNsdWRlIGl0cyBvd24gYHZpZXdSZWYuZGVzdHJveSgpYCAob3Igc2ltaWxhcikuIElmXG4gICAgLy8gV2UgZG9uJ3QgZmxhZyB0aGUgdmlldyBhcyBkZXN0cm95ZWQgYmVmb3JlIHRoZSBob29rcywgdGhpcyBjb3VsZCBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgLy8gVGhpcyBhbHNvIGFsaWducyB3aXRoIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yLiBJdCBhbHNvIG1lYW5zIHRoYXQgdGhlIG9uRGVzdHJveSBob29rIGlzXG4gICAgLy8gcmVhbGx5IG1vcmUgb2YgYW4gXCJhZnRlckRlc3Ryb3lcIiBob29rIGlmIHlvdSB0aGluayBhYm91dCBpdC5cbiAgICB2aWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcblxuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICAgIHJlbW92ZUxpc3RlbmVycyh2aWV3KTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSB2aWV3W1RfSE9TVF07XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGFzIGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIodmlld1tSRU5ERVJFUl0pKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgKHZpZXdbUkVOREVSRVJdIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbkNvbnRhaW5lciA9IHZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCBhbiBlbWJlZGRlZCB2aWV3IHRoYXQgaXMgc3RpbGwgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lclxuICAgIGlmIChkZWNsYXJhdGlvbkNvbnRhaW5lciAhPT0gbnVsbCAmJiBpc0xDb250YWluZXIodmlld1tQQVJFTlRdKSkge1xuICAgICAgLy8gYW5kIHRoaXMgaXMgYSBwcm9qZWN0ZWQgdmlld1xuICAgICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSB2aWV3W1BBUkVOVF0pIHtcbiAgICAgICAgZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyLCB2aWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGVtYmVkZGVkIHZpZXdzIHN0aWxsIGF0dGFjaGVkIHRvIGEgY29udGFpbmVyOiByZW1vdmUgcXVlcnkgcmVzdWx0IGZyb20gdGhpcyB2aWV3LlxuICAgICAgY29uc3QgbFF1ZXJpZXMgPSB2aWV3W1FVRVJJRVNdO1xuICAgICAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcodmlld1tUVklFV10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRDbGVhbnVwID0gbFZpZXdbVFZJRVddLmNsZWFudXA7XG4gIGlmICh0Q2xlYW51cCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiB0Q2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIG5hdGl2ZSBET00gbGlzdGVuZXJcbiAgICAgICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSB0Q2xlYW51cFtpICsgMV07XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHR5cGVvZiBpZHhPclRhcmdldEdldHRlciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICBpZHhPclRhcmdldEdldHRlcihsVmlldykgOlxuICAgICAgICAgICAgdW53cmFwUk5vZGUobFZpZXdbaWR4T3JUYXJnZXRHZXR0ZXJdKTtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMl1dO1xuICAgICAgICBjb25zdCB1c2VDYXB0dXJlT3JTdWJJZHggPSB0Q2xlYW51cFtpICsgM107XG4gICAgICAgIGlmICh0eXBlb2YgdXNlQ2FwdHVyZU9yU3ViSWR4ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAvLyBuYXRpdmUgRE9NIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBSZW5kZXJlcjNcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0Q2xlYW51cFtpXSwgbGlzdGVuZXIsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHVzZUNhcHR1cmVPclN1YklkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyB1bnJlZ2lzdGVyXG4gICAgICAgICAgICBsQ2xlYW51cFt1c2VDYXB0dXJlT3JTdWJJZHhdKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFN1YnNjcmlwdGlvblxuICAgICAgICAgICAgbENsZWFudXBbLXVzZUNhcHR1cmVPclN1YklkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMV1dO1xuICAgICAgICB0Q2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBsVmlld1tDTEVBTlVQXSA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBsZXQgZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsO1xuXG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3Ryb3lIb29rcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgY29udGV4dCA9IHZpZXdbZGVzdHJveUhvb2tzW2ldIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgZGVzdHJveSBob29rIGlmIHRoZSBjb250ZXh0IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3JGYWN0b3J5KSkge1xuICAgICAgICAoZGVzdHJveUhvb2tzW2kgKyAxXSBhcygpID0+IHZvaWQpLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBlbGVtZW50IGlmIGEgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hZGUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJQYXJlbnQodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgLy8gTm9kZXMgb2YgdGhlIHRvcC1tb3N0IHZpZXcgY2FuIGJlIGluc2VydGVkIGVhZ2VybHkuXG4gIGlmIChpc1Jvb3RWaWV3KGN1cnJlbnRWaWV3KSkge1xuICAgIHJldHVybiBuYXRpdmVQYXJlbnROb2RlKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpKTtcbiAgfVxuXG4gIC8vIFNraXAgb3ZlciBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVycyBhcyB0aG9zZSBhcmUgcmVwcmVzZW50ZWQgYnkgYSBjb21tZW50IG5vZGUgYW5kXG4gIC8vIGNhbid0IGJlIHVzZWQgYXMgYSByZW5kZXIgcGFyZW50LlxuICBsZXQgcGFyZW50VE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIHdoaWxlIChwYXJlbnRUTm9kZSAhPSBudWxsICYmIChwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikpIHtcbiAgICB0Tm9kZSA9IHBhcmVudFROb2RlO1xuICAgIHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBhcmVudCB0Tm9kZSBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzOiBlaXRoZXIgaW50byBhbiBlbWJlZGRlZCB2aWV3XG4gIC8vIG9yIGEgY29tcG9uZW50IHZpZXcuXG4gIGlmIChwYXJlbnRUTm9kZSA9PSBudWxsKSB7XG4gICAgY29uc3QgaG9zdFROb2RlID0gY3VycmVudFZpZXdbVF9IT1NUXSAhO1xuICAgIGlmIChob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgYW4gZW1iZWRkZWQgdmlldyBXZSBtaWdodCBkZWxheSBpbnNlcnRpb24gb2YgY2hpbGRyZW5cbiAgICAgIC8vIGZvciBhIGdpdmVuIHZpZXcgaWYgaXQgaXMgZGlzY29ubmVjdGVkLiBUaGlzIG1pZ2h0IGhhcHBlbiBmb3IgMiBtYWluIHJlYXNvbnM6XG4gICAgICAvLyAtIHZpZXcgaXMgbm90IGluc2VydGVkIGludG8gYW55IGNvbnRhaW5lcih2aWV3IHdhcyBjcmVhdGVkIGJ1dCBub3QgaW5zZXJ0ZWQgeWV0KVxuICAgICAgLy8gLSB2aWV3IGlzIGluc2VydGVkIGludG8gYSBjb250YWluZXIgYnV0IHRoZSBjb250YWluZXIgaXRzZWxmIGlzIG5vdCBpbnNlcnRlZCBpbnRvIHRoZSBET01cbiAgICAgIC8vIChjb250YWluZXIgbWlnaHQgYmUgcGFydCBvZiBwcm9qZWN0aW9uIG9yIGNoaWxkIG9mIGEgdmlldyB0aGF0IGlzIG5vdCBpbnNlcnRlZCB5ZXQpLlxuICAgICAgLy8gSW4gb3RoZXIgd29yZHMgd2UgY2FuIGluc2VydCBjaGlsZHJlbiBvZiBhIGdpdmVuIHZpZXcgaWYgdGhpcyB2aWV3IHdhcyBpbnNlcnRlZCBpbnRvIGFcbiAgICAgIC8vIGNvbnRhaW5lciBhbmQgdGhlIGNvbnRhaW5lciBpdHNlbGYgaGFzIGl0cyByZW5kZXIgcGFyZW50IGRldGVybWluZWQuXG4gICAgICByZXR1cm4gZ2V0Q29udGFpbmVyUmVuZGVyUGFyZW50KGhvc3RUTm9kZSBhcyBUVmlld05vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmRcbiAgICAgIC8vIGl0IHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gICAgICByZXR1cm4gZ2V0SG9zdE5hdGl2ZShjdXJyZW50Vmlldyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGlzSWN1Q2FzZSA9IHROb2RlICYmIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5JY3VDb250YWluZXI7XG4gICAgLy8gSWYgdGhlIHBhcmVudCBvZiB0aGlzIG5vZGUgaXMgYW4gSUNVIGNvbnRhaW5lciwgdGhlbiBpdCBpcyByZXByZXNlbnRlZCBieSBjb21tZW50IG5vZGUgYW5kIHdlXG4gICAgLy8gbmVlZCB0byB1c2UgaXQgYXMgYW4gYW5jaG9yLiBJZiBpdCBpcyBwcm9qZWN0ZWQgdGhlbiBpdCdzIGRpcmVjdCBwYXJlbnQgbm9kZSBpcyB0aGUgcmVuZGVyZXIuXG4gICAgaWYgKGlzSWN1Q2FzZSAmJiB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQpIHtcbiAgICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBjdXJyZW50VmlldykucGFyZW50Tm9kZSBhcyBSRWxlbWVudDtcbiAgICB9XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBpZiAocGFyZW50VE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkge1xuICAgICAgY29uc3QgdERhdGEgPSBjdXJyZW50Vmlld1tUVklFV10uZGF0YTtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbcGFyZW50VE5vZGUuaW5kZXhdIGFzIFROb2RlO1xuICAgICAgY29uc3QgZW5jYXBzdWxhdGlvbiA9ICh0RGF0YVt0Tm9kZS5kaXJlY3RpdmVTdGFydF0gYXMgQ29tcG9uZW50RGVmPGFueT4pLmVuY2Fwc3VsYXRpb247XG5cbiAgICAgIC8vIFdlJ3ZlIGdvdCBhIHBhcmVudCB3aGljaCBpcyBhbiBlbGVtZW50IGluIHRoZSBjdXJyZW50IHZpZXcuIFdlIGp1c3QgbmVlZCB0byB2ZXJpZnkgaWYgdGhlXG4gICAgICAvLyBwYXJlbnQgZWxlbWVudCBpcyBub3QgYSBjb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAgICAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gICAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGVuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLiBOb3RlIHRoYXQgd2UgY2FuJ3RcbiAgICAgIC8vIG1ha2UgdGhpcyBhc3N1bXB0aW9uIHdoZW4gdXNpbmcgdGhlIFNoYWRvdyBET00sIGJlY2F1c2UgdGhlIG5hdGl2ZSBwcm9qZWN0aW9uIHBsYWNlaG9sZGVyc1xuICAgICAgLy8gKDxjb250ZW50PiBvciA8c2xvdD4pIGhhdmUgdG8gYmUgaW4gcGxhY2UgYXMgZWxlbWVudHMgYXJlIGJlaW5nIGluc2VydGVkLlxuICAgICAgaWYgKGVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbSAmJlxuICAgICAgICAgIGVuY2Fwc3VsYXRpb24gIT09IFZpZXdFbmNhcHN1bGF0aW9uLk5hdGl2ZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgY3VycmVudFZpZXcpIGFzIFJFbGVtZW50O1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbmF0aXZlIGhvc3QgZWxlbWVudCBmb3IgYSBnaXZlbiB2aWV3LiBXaWxsIHJldHVybiBudWxsIGlmIHRoZSBjdXJyZW50IHZpZXcgZG9lcyBub3QgaGF2ZVxuICogYSBob3N0IGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGdldEhvc3ROYXRpdmUoY3VycmVudFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIGNvbnN0IGhvc3RUTm9kZSA9IGN1cnJlbnRWaWV3W1RfSE9TVF07XG4gIHJldHVybiBob3N0VE5vZGUgJiYgaG9zdFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID9cbiAgICAgIChnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgZ2V0TFZpZXdQYXJlbnQoY3VycmVudFZpZXcpICEpIGFzIFJFbGVtZW50KSA6XG4gICAgICBudWxsO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQgdXNpbmcge0BsaW5rIFJlbmRlcmVyM30uXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZCAtIGl0IGFic3RyYWN0cyBhblxuICogYWN0dWFsIHJlbmRlcmVyIGJlaW5nIHVzZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckluc2VydEJlZm9yZSsrO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGQsIGJlZm9yZU5vZGUsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQXBwZW5kQ2hpbGQrKztcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocGFyZW50LCAncGFyZW50IG5vZGUgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQsIGNoaWxkKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKSB7XG4gIGlmIChiZWZvcmVOb2RlICE9PSBudWxsKSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlciwgcGFyZW50LCBjaGlsZCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgYSBub2RlIGZyb20gdGhlIERPTSBnaXZlbiBpdHMgbmF0aXZlIHBhcmVudC4gKi9cbmZ1bmN0aW9uIG5hdGl2ZVJlbW92ZUNoaWxkKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCwgY2hpbGQsIGlzSG9zdEVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHBhcmVudCBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCBub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGwge1xuICByZXR1cm4gKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnBhcmVudE5vZGUobm9kZSkgOiBub2RlLnBhcmVudE5vZGUpIGFzIFJFbGVtZW50O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgc2libGluZyBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbm9kZTogUk5vZGUpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLm5leHRTaWJsaW5nKG5vZGUpIDogbm9kZS5uZXh0U2libGluZztcbn1cblxuLyoqXG4gKiBGaW5kcyBhIG5hdGl2ZSBcImFuY2hvclwiIG5vZGUgZm9yIGNhc2VzIHdoZXJlIHdlIGNhbid0IGFwcGVuZCBhIG5hdGl2ZSBjaGlsZCBkaXJlY3RseVxuICogKGBhcHBlbmRDaGlsZGApIGFuZCBuZWVkIHRvIHVzZSBhIHJlZmVyZW5jZSAoYW5jaG9yKSBub2RlIGZvciB0aGUgYGluc2VydEJlZm9yZWAgb3BlcmF0aW9uLlxuICogQHBhcmFtIHBhcmVudFROb2RlXG4gKiBAcGFyYW0gbFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlQW5jaG9yTm9kZShwYXJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfG51bGwge1xuICBpZiAocGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TENvbnRhaW5lcihwYXJlbnRUTm9kZSBhcyBUVmlld05vZGUsIGxWaWV3KTtcbiAgICBpZiAobENvbnRhaW5lciA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgaW5kZXggPSBsQ29udGFpbmVyLmluZGV4T2YobFZpZXcsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKSAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUO1xuICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldyhpbmRleCwgbENvbnRhaW5lcik7XG4gIH0gZWxzZSBpZiAoXG4gICAgICBwYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgcGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBsVmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBuYXRpdmUgbm9kZSAob3IgYSBjb2xsZWN0aW9uIG9mIG5vZGVzKSB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogVGhlIGVsZW1lbnQgaW5zZXJ0aW9uIG1pZ2h0IGJlIGRlbGF5ZWQge0BsaW5rIGNhbkluc2VydE5hdGl2ZU5vZGV9LlxuICpcbiAqIEBwYXJhbSBjaGlsZEVsIFRoZSBuYXRpdmUgY2hpbGQgKG9yIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEByZXR1cm5zIFdoZXRoZXIgb3Igbm90IHRoZSBjaGlsZCB3YXMgYXBwZW5kZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKGNoaWxkRWw6IFJOb2RlIHwgUk5vZGVbXSwgY2hpbGRUTm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCByZW5kZXJQYXJlbnQgPSBnZXRSZW5kZXJQYXJlbnQoY2hpbGRUTm9kZSwgY3VycmVudFZpZXcpO1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGN1cnJlbnRWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBwYXJlbnRUTm9kZTogVE5vZGUgPSBjaGlsZFROb2RlLnBhcmVudCB8fCBjdXJyZW50Vmlld1tUX0hPU1RdICE7XG4gICAgY29uc3QgYW5jaG9yTm9kZSA9IGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGUsIGN1cnJlbnRWaWV3KTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZEVsKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZEVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGNoaWxkRWxbaV0sIGFuY2hvck5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcmVuZGVyUGFyZW50LCBjaGlsZEVsLCBhbmNob3JOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KHZpZXdJbmRleEluQ29udGFpbmVyOiBudW1iZXIsIGxDb250YWluZXI6IExDb250YWluZXIpOiBSTm9kZXxcbiAgICBudWxsIHtcbiAgY29uc3QgbmV4dFZpZXdJbmRleCA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgdmlld0luZGV4SW5Db250YWluZXIgKyAxO1xuICBpZiAobmV4dFZpZXdJbmRleCA8IGxDb250YWluZXIubGVuZ3RoKSB7XG4gICAgY29uc3QgbFZpZXcgPSBsQ29udGFpbmVyW25leHRWaWV3SW5kZXhdIGFzIExWaWV3O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1RfSE9TVF0sICdNaXNzaW5nIEhvc3QgVE5vZGUnKTtcbiAgICBsZXQgdFZpZXdOb2RlQ2hpbGQgPSAobFZpZXdbVF9IT1NUXSBhcyBUVmlld05vZGUpLmNoaWxkO1xuICAgIGlmICh0Vmlld05vZGVDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgaWYgKHRWaWV3Tm9kZUNoaWxkLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8XG4gICAgICAgICAgdFZpZXdOb2RlQ2hpbGQudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgICAgICBsZXQgY3VycmVudENoaWxkID0gdFZpZXdOb2RlQ2hpbGQuY2hpbGQ7XG4gICAgICAgIHdoaWxlIChjdXJyZW50Q2hpbGQgJiYgKGN1cnJlbnRDaGlsZC50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2hpbGQudHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikpIHtcbiAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBjdXJyZW50Q2hpbGQuY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgdFZpZXdOb2RlQ2hpbGQgPSBjdXJyZW50Q2hpbGQgfHwgdFZpZXdOb2RlQ2hpbGQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Vmlld05vZGVDaGlsZCwgbFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsQ29udGFpbmVyW05BVElWRV07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIG5hdGl2ZSBub2RlIGl0c2VsZiB1c2luZyBhIGdpdmVuIHJlbmRlcmVyLiBUbyByZW1vdmUgdGhlIG5vZGUgd2UgYXJlIGxvb2tpbmcgdXAgaXRzXG4gKiBwYXJlbnQgZnJvbSB0aGUgbmF0aXZlIHRyZWUgYXMgbm90IGFsbCBwbGF0Zm9ybXMgLyBicm93c2VycyBzdXBwb3J0IHRoZSBlcXVpdmFsZW50IG9mXG4gKiBub2RlLnJlbW92ZSgpLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIGJlIHVzZWRcbiAqIEBwYXJhbSByTm9kZSBUaGUgbmF0aXZlIG5vZGUgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGlzSG9zdEVsZW1lbnQgQSBmbGFnIGluZGljYXRpbmcgaWYgYSBub2RlIHRvIGJlIHJlbW92ZWQgaXMgYSBob3N0IG9mIGEgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlcjogUmVuZGVyZXIzLCByTm9kZTogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZVBhcmVudCA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIHJOb2RlKTtcbiAgaWYgKG5hdGl2ZVBhcmVudCkge1xuICAgIG5hdGl2ZVJlbW92ZUNoaWxkKHJlbmRlcmVyLCBuYXRpdmVQYXJlbnQsIHJOb2RlLCBpc0hvc3RFbGVtZW50KTtcbiAgfVxufVxuXG5cbi8qKlxuICogUGVyZm9ybXMgdGhlIG9wZXJhdGlvbiBvZiBgYWN0aW9uYCBvbiB0aGUgbm9kZS4gVHlwaWNhbGx5IHRoaXMgaW52b2x2ZXMgaW5zZXJ0aW5nIG9yIHJlbW92aW5nXG4gKiBub2RlcyBvbiB0aGUgTFZpZXcgb3IgcHJvamVjdGlvbiBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlOb2RlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldyxcbiAgICByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsLCBpc1Byb2plY3Rpb246IGJvb2xlYW4pIHtcbiAgd2hpbGUgKHROb2RlICE9IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcixcbiAgICAgICAgICAgICAgICAgICAgIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBUTm9kZVR5cGUuUHJvamVjdGlvbiwgVE5vZGVUeXBlLkljdUNvbnRhaW5lcik7XG4gICAgY29uc3QgcmF3U2xvdFZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGNvbnN0IHROb2RlVHlwZSA9IHROb2RlLnR5cGU7XG4gICAgaWYgKGlzUHJvamVjdGlvbikge1xuICAgICAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUpIHtcbiAgICAgICAgcmF3U2xvdFZhbHVlICYmIGF0dGFjaFBhdGNoRGF0YSh1bndyYXBSTm9kZShyYXdTbG90VmFsdWUpLCBsVmlldyk7XG4gICAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpICE9PSBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpIHtcbiAgICAgIGlmICh0Tm9kZVR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHx8IHROb2RlVHlwZSA9PT0gVE5vZGVUeXBlLkljdUNvbnRhaW5lcikge1xuICAgICAgICBhcHBseU5vZGVzKHJlbmRlcmVyLCBhY3Rpb24sIHROb2RlLmNoaWxkLCBsVmlldywgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlLCBmYWxzZSk7XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcmVuZGVyUGFyZW50LCByYXdTbG90VmFsdWUsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICAgICAgICAgIHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGUsIHJlbmRlclBhcmVudCwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHJlbmRlclBhcmVudCwgcmF3U2xvdFZhbHVlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSBpc1Byb2plY3Rpb24gPyB0Tm9kZS5wcm9qZWN0aW9uTmV4dCA6IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuXG4vKipcbiAqIGBhcHBseVZpZXdgIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgdmlldyBhcyBzcGVjaWZpZWQgaW4gYGFjdGlvbmAgKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIHZpZXcgd2l0aG91dCBwcm9qZWN0aW9uIG9yIGNvbnRhaW5lcnMgYXQgdG9wIGxldmVsIGlzIHNpbXBsZS4gSnVzdCBpdGVyYXRlIG92ZXIgdGhlXG4gKiByb290IG5vZGVzIG9mIHRoZSBWaWV3LCBhbmQgZm9yIGVhY2ggbm9kZSBwZXJmb3JtIHRoZSBgYWN0aW9uYC5cbiAqXG4gKiBUaGluZ3MgZ2V0IG1vcmUgY29tcGxpY2F0ZWQgd2l0aCBjb250YWluZXJzIGFuZCBwcm9qZWN0aW9ucy4gVGhhdCBpcyBiZWNhdXNlIGNvbWluZyBhY3Jvc3M6XG4gKiAtIENvbnRhaW5lcjogaW1wbGllcyB0aGF0IHdlIGhhdmUgdG8gaW5zZXJ0L3JlbW92ZS9kZXN0cm95IHRoZSB2aWV3cyBvZiB0aGF0IGNvbnRhaW5lciBhcyB3ZWxsXG4gKiAgICAgICAgICAgICAgd2hpY2ggaW4gdHVybiBjYW4gaGF2ZSB0aGVpciBvd24gQ29udGFpbmVycyBhdCB0aGUgVmlldyByb290cy5cbiAqIC0gUHJvamVjdGlvbjogaW1wbGllcyB0aGF0IHdlIGhhdmUgdG8gaW5zZXJ0L3JlbW92ZS9kZXN0cm95IHRoZSBub2RlcyBvZiB0aGUgcHJvamVjdGlvbi4gVGhlXG4gKiAgICAgICAgICAgICAgIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRoZSBub2RlcyB3ZSBhcmUgcHJvamVjdGluZyBjYW4gdGhlbXNlbHZlcyBoYXZlIENvbnRhaW5lcnNcbiAqICAgICAgICAgICAgICAgb3Igb3RoZXIgUHJvamVjdGlvbnMuXG4gKlxuICogQXMgeW91IGNhbiBzZWUgdGhpcyBpcyBhIHZlcnkgcmVjdXJzaXZlIHByb2JsZW0uIFllcyByZWN1cnNpb24gaXMgbm90IG1vc3QgZWZmaWNpZW50IGJ1dCB0aGVcbiAqIGNvZGUgaXMgY29tcGxpY2F0ZWQgZW5vdWdoIHRoYXQgdHJ5aW5nIHRvIGltcGxlbWVudGVkIHdpdGggcmVjdXJzaW9uIGJlY29tZXMgdW5tYWludGFpbmFibGUuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbFZpZXc6IExWaWV3LCByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh0Vmlldy5ub2RlICEsIFROb2RlVHlwZS5WaWV3KTtcbiAgY29uc3Qgdmlld1Jvb3RUTm9kZTogVE5vZGV8bnVsbCA9IHRWaWV3Lm5vZGUgIS5jaGlsZDtcbiAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB2aWV3Um9vdFROb2RlLCBsVmlldywgcmVuZGVyUGFyZW50LCBiZWZvcmVOb2RlLCBmYWxzZSk7XG59XG5cbi8qKlxuICogYGFwcGx5UHJvamVjdGlvbmAgcGVyZm9ybXMgb3BlcmF0aW9uIG9uIHRoZSBwcm9qZWN0aW9uLlxuICpcbiAqIEluc2VydGluZyBhIHByb2plY3Rpb24gcmVxdWlyZXMgdXMgdG8gbG9jYXRlIHRoZSBwcm9qZWN0ZWQgbm9kZXMgZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudC4gVGhlXG4gKiBjb21wbGljYXRpb24gaXMgdGhhdCB0aG9zZSBub2RlcyB0aGVtc2VsdmVzIGNvdWxkIGJlIHJlLXByb2plY3RlZCBmcm9tIHRoZWlyIHBhcmVudCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgbm9kZSB0byBwcm9qZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVByb2plY3Rpb24obFZpZXc6IExWaWV3LCB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgcmVuZGVyUGFyZW50ID0gZ2V0UmVuZGVyUGFyZW50KHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICBjb25zdCBwYXJlbnRUTm9kZSA9IHRQcm9qZWN0aW9uTm9kZS5wYXJlbnQgfHwgbFZpZXdbVF9IT1NUXSAhO1xuICBsZXQgYmVmb3JlTm9kZSA9IGdldE5hdGl2ZUFuY2hvck5vZGUocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICAgICAgcmVuZGVyZXIsIFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlLCBsVmlldywgdFByb2plY3Rpb25Ob2RlLCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUpO1xufVxuXG4vKipcbiAqIGBhcHBseVByb2plY3Rpb25SZWN1cnNpdmVgIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgcHJvamVjdGlvbiBzcGVjaWZpZWQgYnkgYGFjdGlvbmAgKGluc2VydCxcbiAqIGRldGFjaCwgZGVzdHJveSlcbiAqXG4gKiBJbnNlcnRpbmcgYSBwcm9qZWN0aW9uIHJlcXVpcmVzIHVzIHRvIGxvY2F0ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuIFRoZVxuICogY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhvc2Ugbm9kZXMgdGhlbXNlbHZlcyBjb3VsZCBiZSByZS1wcm9qZWN0ZWQgZnJvbSB0aGVpciBwYXJlbnQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIG5vZGUgdG8gcHJvamVjdFxuICogQHBhcmFtIHJlbmRlclBhcmVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbFZpZXc6IExWaWV3LFxuICAgIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlLCByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gZmluZENvbXBvbmVudFZpZXcobFZpZXcpO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50TFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodHlwZW9mIHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uLCAnbnVtYmVyJywgJ2V4cGVjdGluZyBwcm9qZWN0aW9uIGluZGV4Jyk7XG4gIGNvbnN0IG5vZGVUb1Byb2plY3RPclJOb2RlcyA9IGNvbXBvbmVudE5vZGUucHJvamVjdGlvbiAhW3RQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uXSAhO1xuICBpZiAoQXJyYXkuaXNBcnJheShub2RlVG9Qcm9qZWN0T3JSTm9kZXMpKSB7XG4gICAgLy8gVGhpcyBzaG91bGQgbm90IGV4aXN0LCBpdCBpcyBhIGJpdCBvZiBhIGhhY2suIFdoZW4gd2UgYm9vdHN0cmFwIGEgdG9wIGxldmVsIG5vZGUgYW5kIHdlXG4gICAgLy8gbmVlZCB0byBzdXBwb3J0IHBhc3NpbmcgcHJvamVjdGFibGUgbm9kZXMsIHNvIHdlIGNoZWF0IGFuZCBwdXQgdGhlbSBpbiB0aGUgVE5vZGVcbiAgICAvLyBvZiB0aGUgSG9zdCBUVmlldy4gKFllcyB3ZSBwdXQgaW5zdGFuY2UgaW5mbyBhdCB0aGUgVCBMZXZlbCkuIFdlIGNhbiBnZXQgYXdheSB3aXRoIGl0XG4gICAgLy8gYmVjYXVzZSB3ZSBrbm93IHRoYXQgdGhhdCBUVmlldyBpcyBub3Qgc2hhcmVkIGFuZCB0aGVyZWZvcmUgaXQgd2lsbCBub3QgYmUgYSBwcm9ibGVtLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIHJlZmFjdG9yZWQgYW5kIGNsZWFuZWQgdXAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJOb2RlID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzW2ldO1xuICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIHJOb2RlLCBiZWZvcmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IG5vZGVUb1Byb2plY3Q6IFROb2RlfG51bGwgPSBub2RlVG9Qcm9qZWN0T3JSTm9kZXM7XG4gICAgY29uc3QgcHJvamVjdGVkQ29tcG9uZW50TFZpZXcgPSBjb21wb25lbnRMVmlld1tQQVJFTlRdIGFzIExWaWV3O1xuICAgIGFwcGx5Tm9kZXMoXG4gICAgICAgIHJlbmRlcmVyLCBhY3Rpb24sIG5vZGVUb1Byb2plY3QsIHByb2plY3RlZENvbXBvbmVudExWaWV3LCByZW5kZXJQYXJlbnQsIGJlZm9yZU5vZGUsIHRydWUpO1xuICB9XG59XG5cblxuLyoqXG4gKiBgYXBwbHlDb250YWluZXJgIHBlcmZvcm1zIGFuIG9wZXJhdGlvbiBvbiB0aGUgY29udGFpbmVyIGFuZCBpdHMgdmlld3MgYXMgc3BlY2lmaWVkIGJ5XG4gKiBgYWN0aW9uYCAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgQ29udGFpbmVyIGlzIGNvbXBsaWNhdGVkIGJ5IHRoZSBmYWN0IHRoYXQgdGhlIGNvbnRhaW5lciBtYXkgaGF2ZSBWaWV3cyB3aGljaFxuICogdGhlbXNlbHZlcyBoYXZlIGNvbnRhaW5lcnMgb3IgcHJvamVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgTENvbnRhaW5lciB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Q29udGFpbmVyKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICByZW5kZXJQYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCwgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICBjb25zdCBhbmNob3IgPSBsQ29udGFpbmVyW05BVElWRV07ICAvLyBMQ29udGFpbmVyIGhhcyBpdHMgb3duIGJlZm9yZSBub2RlLlxuICBjb25zdCBuYXRpdmUgPSB1bndyYXBSTm9kZShsQ29udGFpbmVyKTtcbiAgLy8gQW4gTENvbnRhaW5lciBjYW4gYmUgY3JlYXRlZCBkeW5hbWljYWxseSBvbiBhbnkgbm9kZSBieSBpbmplY3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAgLy8gQXNraW5nIGZvciBhIFZpZXdDb250YWluZXJSZWYgb24gYW4gZWxlbWVudCB3aWxsIHJlc3VsdCBpbiBhIGNyZWF0aW9uIG9mIGEgc2VwYXJhdGUgYW5jaG9yIG5vZGVcbiAgLy8gKGNvbW1lbnQgaW4gdGhlIERPTSkgdGhhdCB3aWxsIGJlIGRpZmZlcmVudCBmcm9tIHRoZSBMQ29udGFpbmVyJ3MgaG9zdCBub2RlLiBJbiB0aGlzIHBhcnRpY3VsYXJcbiAgLy8gY2FzZSB3ZSBuZWVkIHRvIGV4ZWN1dGUgYWN0aW9uIG9uIDIgbm9kZXM6XG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaW4gdGhlIGV4ZWN1dGVBY3Rpb25PbkVsZW1lbnRPckNvbnRhaW5lcilcbiAgLy8gLSBjb250YWluZXIncyBob3N0IG5vZGUgKHRoaXMgaXMgZG9uZSBoZXJlKVxuICBpZiAoYW5jaG9yICE9PSBuYXRpdmUpIHtcbiAgICAvLyBUaGlzIGlzIHZlcnkgc3RyYW5nZSB0byBtZSAoTWlza28pLiBJIHdvdWxkIGV4cGVjdCB0aGF0IHRoZSBuYXRpdmUgaXMgc2FtZSBhcyBhbmNob3IuIEkgZG9uJ3RcbiAgICAvLyBzZWUgYSByZWFzb24gd2h5IHRoZXkgc2hvdWxkIGJlIGRpZmZlcmVudCwgYnV0IHRoZXkgYXJlLlxuICAgIC8vXG4gICAgLy8gSWYgdGhleSBhcmUgd2UgbmVlZCB0byBwcm9jZXNzIHRoZSBzZWNvbmQgYW5jaG9yIGFzIHdlbGwuXG4gICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCByZW5kZXJQYXJlbnQsIGFuY2hvciwgYmVmb3JlTm9kZSk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICBhcHBseVZpZXcocmVuZGVyZXIsIGFjdGlvbiwgbFZpZXcsIHJlbmRlclBhcmVudCwgYW5jaG9yKTtcbiAgfVxufVxuIl19