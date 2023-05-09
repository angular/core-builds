/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { hasInSkipHydrationBlockFlag } from '../hydration/skip_hydration';
import { ViewEncapsulation } from '../metadata/view';
import { RendererStyleFlags2 } from '../render/api_flags';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertFunction, assertNumber, assertString } from '../util/assert';
import { escapeCommentText } from '../util/dom';
import { assertLContainer, assertLView, assertParentView, assertProjectionSlots, assertTNodeForLView } from './assert';
import { attachPatchData } from './context_discovery';
import { icuContainerIterate } from './i18n/i18n_tree_shaking';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS, NATIVE } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unregisterLView } from './interfaces/lview_tracking';
import { isLContainer, isLView } from './interfaces/type_checks';
import { CHILD_HEAD, CLEANUP, DECLARATION_COMPONENT_VIEW, DECLARATION_LCONTAINER, FLAGS, HOST, NEXT, ON_DESTROY_HOOKS, PARENT, QUERIES, REACTIVE_HOST_BINDING_CONSUMER, REACTIVE_TEMPLATE_CONSUMER, RENDERER, T_HOST, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { profiler } from './profiler';
import { setUpAttributes } from './util/attrs_utils';
import { getLViewParent } from './util/view_traversal_utils';
import { clearViewRefreshFlag, getNativeByTNode, unwrapRNode } from './util/view_utils';
/**
 * NOTE: for performance reasons, the possible actions are inlined within the function instead of
 * being passed as an argument.
 */
function applyToElementOrContainer(action, renderer, parent, lNodeToHandle, beforeNode) {
    // If this slot was allocated for a text node dynamically created by i18n, the text node itself
    // won't be created until i18nApply() in the update block, so this node should be skipped.
    // For more info, see "ICU expressions should work inside an ngTemplateOutlet inside an ngFor"
    // in `i18n_spec.ts`.
    if (lNodeToHandle != null) {
        let lContainer;
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
            lNodeToHandle = lNodeToHandle[HOST];
        }
        const rNode = unwrapRNode(lNodeToHandle);
        if (action === 0 /* WalkTNodeTreeAction.Create */ && parent !== null) {
            if (beforeNode == null) {
                nativeAppendChild(renderer, parent, rNode);
            }
            else {
                nativeInsertBefore(renderer, parent, rNode, beforeNode || null, true);
            }
        }
        else if (action === 1 /* WalkTNodeTreeAction.Insert */ && parent !== null) {
            nativeInsertBefore(renderer, parent, rNode, beforeNode || null, true);
        }
        else if (action === 2 /* WalkTNodeTreeAction.Detach */) {
            nativeRemoveNode(renderer, rNode, isComponent);
        }
        else if (action === 3 /* WalkTNodeTreeAction.Destroy */) {
            ngDevMode && ngDevMode.rendererDestroyNode++;
            renderer.destroyNode(rNode);
        }
        if (lContainer != null) {
            applyContainer(renderer, action, lContainer, parent, beforeNode);
        }
    }
}
export function createTextNode(renderer, value) {
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    ngDevMode && ngDevMode.rendererSetText++;
    return renderer.createText(value);
}
export function updateTextNode(renderer, rNode, value) {
    ngDevMode && ngDevMode.rendererSetText++;
    renderer.setValue(rNode, value);
}
export function createCommentNode(renderer, value) {
    ngDevMode && ngDevMode.rendererCreateComment++;
    return renderer.createComment(escapeCommentText(value));
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param renderer A renderer to use
 * @param name the tag name
 * @param namespace Optional namespace for element.
 * @returns the element created
 */
export function createElementNode(renderer, name, namespace) {
    ngDevMode && ngDevMode.rendererCreateElement++;
    return renderer.createElement(name, namespace);
}
/**
 * Removes all DOM elements associated with a view.
 *
 * Because some root nodes of the view may be containers, we sometimes need
 * to propagate deeply into the nested containers to remove all elements in the
 * views beneath it.
 *
 * @param tView The `TView' of the `LView` from which elements should be added or removed
 * @param lView The view from which elements should be added or removed
 */
export function removeViewFromContainer(tView, lView) {
    const renderer = lView[RENDERER];
    applyView(tView, lView, renderer, 2 /* WalkTNodeTreeAction.Detach */, null, null);
    lView[HOST] = null;
    lView[T_HOST] = null;
}
/**
 * Adds all DOM elements associated with a view.
 *
 * Because some root nodes of the view may be containers, we sometimes need
 * to propagate deeply into the nested containers to add all elements in the
 * views beneath it.
 *
 * @param tView The `TView' of the `LView` from which elements should be added or removed
 * @param parentTNode The `TNode` where the `LView` should be attached to.
 * @param renderer Current renderer to use for DOM manipulations.
 * @param lView The view from which elements should be added or removed
 * @param parentNativeNode The parent `RElement` where it should be inserted into.
 * @param beforeNode The node before which elements should be added, if insert mode
 */
export function addViewToContainer(tView, parentTNode, renderer, lView, parentNativeNode, beforeNode) {
    lView[HOST] = parentNativeNode;
    lView[T_HOST] = parentTNode;
    applyView(tView, lView, renderer, 1 /* WalkTNodeTreeAction.Insert */, parentNativeNode, beforeNode);
}
/**
 * Detach a `LView` from the DOM by detaching its nodes.
 *
 * @param tView The `TView' of the `LView` to be detached
 * @param lView the `LView` to be detached.
 */
export function renderDetachView(tView, lView) {
    applyView(tView, lView, lView[RENDERER], 2 /* WalkTNodeTreeAction.Detach */, null, null);
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
 *  @param rootView The view to destroy
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    let lViewOrLContainer = rootView[CHILD_HEAD];
    if (!lViewOrLContainer) {
        return cleanUpView(rootView[TVIEW], rootView);
    }
    while (lViewOrLContainer) {
        let next = null;
        if (isLView(lViewOrLContainer)) {
            // If LView, traverse down to child.
            next = lViewOrLContainer[CHILD_HEAD];
        }
        else {
            ngDevMode && assertLContainer(lViewOrLContainer);
            // If container, traverse down to its first LView.
            const firstView = lViewOrLContainer[CONTAINER_HEADER_OFFSET];
            if (firstView)
                next = firstView;
        }
        if (!next) {
            // Only clean up view when moving to the side or up, as destroy hooks
            // should be called in order from the bottom up.
            while (lViewOrLContainer && !lViewOrLContainer[NEXT] && lViewOrLContainer !== rootView) {
                if (isLView(lViewOrLContainer)) {
                    cleanUpView(lViewOrLContainer[TVIEW], lViewOrLContainer);
                }
                lViewOrLContainer = lViewOrLContainer[PARENT];
            }
            if (lViewOrLContainer === null)
                lViewOrLContainer = rootView;
            if (isLView(lViewOrLContainer)) {
                cleanUpView(lViewOrLContainer[TVIEW], lViewOrLContainer);
            }
            next = lViewOrLContainer && lViewOrLContainer[NEXT];
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
 * @param tView The `TView' of the `LView` to insert
 * @param lView The view to insert
 * @param lContainer The container into which the view should be inserted
 * @param index Which index in the container to insert the child view into
 */
export function insertView(tView, lView, lContainer, index) {
    ngDevMode && assertLView(lView);
    ngDevMode && assertLContainer(lContainer);
    const indexInContainer = CONTAINER_HEADER_OFFSET + index;
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
    const declarationLContainer = lView[DECLARATION_LCONTAINER];
    if (declarationLContainer !== null && lContainer !== declarationLContainer) {
        trackMovedView(declarationLContainer, lView);
    }
    // notify query that a new view has been added
    const lQueries = lView[QUERIES];
    if (lQueries !== null) {
        lQueries.insertView(tView);
    }
    // Sets the attached flag
    lView[FLAGS] |= 128 /* LViewFlags.Attached */;
}
/**
 * Track views created from the declaration container (TemplateRef) and inserted into a
 * different LContainer.
 */
function trackMovedView(declarationContainer, lView) {
    ngDevMode && assertDefined(lView, 'LView required');
    ngDevMode && assertLContainer(declarationContainer);
    const movedViews = declarationContainer[MOVED_VIEWS];
    const insertedLContainer = lView[PARENT];
    ngDevMode && assertLContainer(insertedLContainer);
    const insertedComponentLView = insertedLContainer[PARENT][DECLARATION_COMPONENT_VIEW];
    ngDevMode && assertDefined(insertedComponentLView, 'Missing insertedComponentLView');
    const declaredComponentLView = lView[DECLARATION_COMPONENT_VIEW];
    ngDevMode && assertDefined(declaredComponentLView, 'Missing declaredComponentLView');
    if (declaredComponentLView !== insertedComponentLView) {
        // At this point the declaration-component is not same as insertion-component; this means that
        // this is a transplanted view. Mark the declared lView as having transplanted views so that
        // those views can participate in CD.
        declarationContainer[HAS_TRANSPLANTED_VIEWS] = true;
    }
    if (movedViews === null) {
        declarationContainer[MOVED_VIEWS] = [lView];
    }
    else {
        movedViews.push(lView);
    }
}
function detachMovedView(declarationContainer, lView) {
    ngDevMode && assertLContainer(declarationContainer);
    ngDevMode &&
        assertDefined(declarationContainer[MOVED_VIEWS], 'A projected view should belong to a non-empty projected views collection');
    const movedViews = declarationContainer[MOVED_VIEWS];
    const declarationViewIndex = movedViews.indexOf(lView);
    const insertionLContainer = lView[PARENT];
    ngDevMode && assertLContainer(insertionLContainer);
    // If the view was marked for refresh but then detached before it was checked (where the flag
    // would be cleared and the counter decremented), we need to update the status here.
    clearViewRefreshFlag(lView);
    movedViews.splice(declarationViewIndex, 1);
}
/**
 * Detaches a view from a container.
 *
 * This method removes the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param lContainer The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @returns Detached LView instance.
 */
export function detachView(lContainer, removeIndex) {
    if (lContainer.length <= CONTAINER_HEADER_OFFSET)
        return;
    const indexInContainer = CONTAINER_HEADER_OFFSET + removeIndex;
    const viewToDetach = lContainer[indexInContainer];
    if (viewToDetach) {
        const declarationLContainer = viewToDetach[DECLARATION_LCONTAINER];
        if (declarationLContainer !== null && declarationLContainer !== lContainer) {
            detachMovedView(declarationLContainer, viewToDetach);
        }
        if (removeIndex > 0) {
            lContainer[indexInContainer - 1][NEXT] = viewToDetach[NEXT];
        }
        const removedLView = removeFromArray(lContainer, CONTAINER_HEADER_OFFSET + removeIndex);
        removeViewFromContainer(viewToDetach[TVIEW], viewToDetach);
        // notify query that a view has been removed
        const lQueries = removedLView[QUERIES];
        if (lQueries !== null) {
            lQueries.detachView(removedLView[TVIEW]);
        }
        viewToDetach[PARENT] = null;
        viewToDetach[NEXT] = null;
        // Unsets the attached flag
        viewToDetach[FLAGS] &= ~128 /* LViewFlags.Attached */;
    }
    return viewToDetach;
}
/**
 * A standalone function which destroys an LView,
 * conducting clean up (e.g. removing listeners, calling onDestroys).
 *
 * @param tView The `TView' of the `LView` to be destroyed
 * @param lView The view to be destroyed.
 */
export function destroyLView(tView, lView) {
    if (!(lView[FLAGS] & 256 /* LViewFlags.Destroyed */)) {
        const renderer = lView[RENDERER];
        lView[REACTIVE_TEMPLATE_CONSUMER]?.destroy();
        lView[REACTIVE_HOST_BINDING_CONSUMER]?.destroy();
        if (renderer.destroyNode) {
            applyView(tView, lView, renderer, 3 /* WalkTNodeTreeAction.Destroy */, null, null);
        }
        destroyViewTree(lView);
    }
}
/**
 * Calls onDestroys hooks for all directives and pipes in a given view and then removes all
 * listeners. Listeners are removed as the last step so events delivered in the onDestroys hooks
 * can be propagated to @Output listeners.
 *
 * @param tView `TView` for the `LView` to clean up.
 * @param lView The LView to clean up
 */
function cleanUpView(tView, lView) {
    if (!(lView[FLAGS] & 256 /* LViewFlags.Destroyed */)) {
        // Usually the Attached flag is removed when the view is detached from its parent, however
        // if it's a root view, the flag won't be unset hence why we're also removing on destroy.
        lView[FLAGS] &= ~128 /* LViewFlags.Attached */;
        // Mark the LView as destroyed *before* executing the onDestroy hooks. An onDestroy hook
        // runs arbitrary user code, which could include its own `viewRef.destroy()` (or similar). If
        // We don't flag the view as destroyed before the hooks, this could lead to an infinite loop.
        // This also aligns with the ViewEngine behavior. It also means that the onDestroy hook is
        // really more of an "afterDestroy" hook if you think about it.
        lView[FLAGS] |= 256 /* LViewFlags.Destroyed */;
        executeOnDestroys(tView, lView);
        processCleanups(tView, lView);
        // For component views only, the local renderer is destroyed at clean up time.
        if (lView[TVIEW].type === 1 /* TViewType.Component */) {
            ngDevMode && ngDevMode.rendererDestroy++;
            lView[RENDERER].destroy();
        }
        const declarationContainer = lView[DECLARATION_LCONTAINER];
        // we are dealing with an embedded view that is still inserted into a container
        if (declarationContainer !== null && isLContainer(lView[PARENT])) {
            // and this is a projected view
            if (declarationContainer !== lView[PARENT]) {
                detachMovedView(declarationContainer, lView);
            }
            // For embedded views still attached to a container: remove query result from this view.
            const lQueries = lView[QUERIES];
            if (lQueries !== null) {
                lQueries.detachView(tView);
            }
        }
        // Unregister the view once everything else has been cleaned up.
        unregisterLView(lView);
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function processCleanups(tView, lView) {
    const tCleanup = tView.cleanup;
    const lCleanup = lView[CLEANUP];
    if (tCleanup !== null) {
        for (let i = 0; i < tCleanup.length - 1; i += 2) {
            if (typeof tCleanup[i] === 'string') {
                // This is a native DOM listener. It will occupy 4 entries in the TCleanup array (hence i +=
                // 2 at the end of this block).
                const targetIdx = tCleanup[i + 3];
                ngDevMode && assertNumber(targetIdx, 'cleanup target must be a number');
                if (targetIdx >= 0) {
                    // unregister
                    lCleanup[targetIdx]();
                }
                else {
                    // Subscription
                    lCleanup[-targetIdx].unsubscribe();
                }
                i += 2;
            }
            else {
                // This is a cleanup function that is grouped with the index of its context
                const context = lCleanup[tCleanup[i + 1]];
                tCleanup[i].call(context);
            }
        }
    }
    if (lCleanup !== null) {
        lView[CLEANUP] = null;
    }
    const destroyHooks = lView[ON_DESTROY_HOOKS];
    if (destroyHooks !== null) {
        for (let i = 0; i < destroyHooks.length; i++) {
            const destroyHooksFn = destroyHooks[i];
            ngDevMode && assertFunction(destroyHooksFn, 'Expecting destroy hook to be a function.');
            destroyHooksFn();
        }
        lView[ON_DESTROY_HOOKS] = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(tView, lView) {
    let destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        for (let i = 0; i < destroyHooks.length; i += 2) {
            const context = lView[destroyHooks[i]];
            // Only call the destroy hook if the context has been requested.
            if (!(context instanceof NodeInjectorFactory)) {
                const toCall = destroyHooks[i + 1];
                if (Array.isArray(toCall)) {
                    for (let j = 0; j < toCall.length; j += 2) {
                        const callContext = context[toCall[j]];
                        const hook = toCall[j + 1];
                        profiler(4 /* ProfilerEvent.LifecycleHookStart */, callContext, hook);
                        try {
                            hook.call(callContext);
                        }
                        finally {
                            profiler(5 /* ProfilerEvent.LifecycleHookEnd */, callContext, hook);
                        }
                    }
                }
                else {
                    profiler(4 /* ProfilerEvent.LifecycleHookStart */, context, toCall);
                    try {
                        toCall.call(context);
                    }
                    finally {
                        profiler(5 /* ProfilerEvent.LifecycleHookEnd */, context, toCall);
                    }
                }
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
 *
 * @param tView: Current `TView`.
 * @param tNode: `TNode` for which we wish to retrieve render parent.
 * @param lView: Current `LView`.
 */
export function getParentRElement(tView, tNode, lView) {
    return getClosestRElement(tView, tNode.parent, lView);
}
/**
 * Get closest `RElement` or `null` if it can't be found.
 *
 * If `TNode` is `TNodeType.Element` => return `RElement` at `LView[tNode.index]` location.
 * If `TNode` is `TNodeType.ElementContainer|IcuContain` => return the parent (recursively).
 * If `TNode` is `null` then return host `RElement`:
 *   - return `null` if projection
 *   - return `null` if parent container is disconnected (we have no parent.)
 *
 * @param tView: Current `TView`.
 * @param tNode: `TNode` for which we wish to retrieve `RElement` (or `null` if host element is
 *     needed).
 * @param lView: Current `LView`.
 * @returns `null` if the `RElement` can't be determined at this time (no parent / projection)
 */
export function getClosestRElement(tView, tNode, lView) {
    let parentTNode = tNode;
    // Skip over element and ICU containers as those are represented by a comment node and
    // can't be used as a render parent.
    while (parentTNode !== null &&
        (parentTNode.type & (8 /* TNodeType.ElementContainer */ | 32 /* TNodeType.Icu */))) {
        tNode = parentTNode;
        parentTNode = tNode.parent;
    }
    // If the parent tNode is null, then we are inserting across views: either into an embedded view
    // or a component view.
    if (parentTNode === null) {
        // We are inserting a root element of the component view into the component host element and
        // it should always be eager.
        return lView[HOST];
    }
    else {
        ngDevMode && assertTNodeType(parentTNode, 3 /* TNodeType.AnyRNode */ | 4 /* TNodeType.Container */);
        const { componentOffset } = parentTNode;
        if (componentOffset > -1) {
            ngDevMode && assertTNodeForLView(parentTNode, lView);
            const { encapsulation } = tView.data[parentTNode.directiveStart + componentOffset];
            // We've got a parent which is an element in the current view. We just need to verify if the
            // parent element is not a component. Component's content nodes are not inserted immediately
            // because they will be projected, and so doing insert at this point would be wasteful.
            // Since the projection would then move it to its final destination. Note that we can't
            // make this assumption when using the Shadow DOM, because the native projection placeholders
            // (<content> or <slot>) have to be in place as elements are being inserted.
            if (encapsulation === ViewEncapsulation.None ||
                encapsulation === ViewEncapsulation.Emulated) {
                return null;
            }
        }
        return getNativeByTNode(parentTNode, lView);
    }
}
/**
 * Inserts a native node before another native node for a given parent.
 * This is a utility function that can be used when native nodes were determined.
 */
export function nativeInsertBefore(renderer, parent, child, beforeNode, isMove) {
    ngDevMode && ngDevMode.rendererInsertBefore++;
    renderer.insertBefore(parent, child, beforeNode, isMove);
}
function nativeAppendChild(renderer, parent, child) {
    ngDevMode && ngDevMode.rendererAppendChild++;
    ngDevMode && assertDefined(parent, 'parent node must be defined');
    renderer.appendChild(parent, child);
}
function nativeAppendOrInsertBefore(renderer, parent, child, beforeNode, isMove) {
    if (beforeNode !== null) {
        nativeInsertBefore(renderer, parent, child, beforeNode, isMove);
    }
    else {
        nativeAppendChild(renderer, parent, child);
    }
}
/** Removes a node from the DOM given its native parent. */
function nativeRemoveChild(renderer, parent, child, isHostElement) {
    renderer.removeChild(parent, child, isHostElement);
}
/** Checks if an element is a `<template>` node. */
function isTemplateNode(node) {
    return node.tagName === 'TEMPLATE' && node.content !== undefined;
}
/**
 * Returns a native parent of a given native node.
 */
export function nativeParentNode(renderer, node) {
    return renderer.parentNode(node);
}
/**
 * Returns a native sibling of a given native node.
 */
export function nativeNextSibling(renderer, node) {
    return renderer.nextSibling(node);
}
/**
 * Find a node in front of which `currentTNode` should be inserted.
 *
 * This method determines the `RNode` in front of which we should insert the `currentRNode`. This
 * takes `TNode.insertBeforeIndex` into account if i18n code has been invoked.
 *
 * @param parentTNode parent `TNode`
 * @param currentTNode current `TNode` (The node which we would like to insert into the DOM)
 * @param lView current `LView`
 */
function getInsertInFrontOfRNode(parentTNode, currentTNode, lView) {
    return _getInsertInFrontOfRNodeWithI18n(parentTNode, currentTNode, lView);
}
/**
 * Find a node in front of which `currentTNode` should be inserted. (Does not take i18n into
 * account)
 *
 * This method determines the `RNode` in front of which we should insert the `currentRNode`. This
 * does not take `TNode.insertBeforeIndex` into account.
 *
 * @param parentTNode parent `TNode`
 * @param currentTNode current `TNode` (The node which we would like to insert into the DOM)
 * @param lView current `LView`
 */
export function getInsertInFrontOfRNodeWithNoI18n(parentTNode, currentTNode, lView) {
    if (parentTNode.type & (8 /* TNodeType.ElementContainer */ | 32 /* TNodeType.Icu */)) {
        return getNativeByTNode(parentTNode, lView);
    }
    return null;
}
/**
 * Tree shakable boundary for `getInsertInFrontOfRNodeWithI18n` function.
 *
 * This function will only be set if i18n code runs.
 */
let _getInsertInFrontOfRNodeWithI18n = getInsertInFrontOfRNodeWithNoI18n;
/**
 * Tree shakable boundary for `processI18nInsertBefore` function.
 *
 * This function will only be set if i18n code runs.
 */
let _processI18nInsertBefore;
export function setI18nHandling(getInsertInFrontOfRNodeWithI18n, processI18nInsertBefore) {
    _getInsertInFrontOfRNodeWithI18n = getInsertInFrontOfRNodeWithI18n;
    _processI18nInsertBefore = processI18nInsertBefore;
}
/**
 * Appends the `child` native node (or a collection of nodes) to the `parent`.
 *
 * @param tView The `TView' to be appended
 * @param lView The current LView
 * @param childRNode The native child (or children) that should be appended
 * @param childTNode The TNode of the child element
 */
export function appendChild(tView, lView, childRNode, childTNode) {
    const parentRNode = getParentRElement(tView, childTNode, lView);
    const renderer = lView[RENDERER];
    const parentTNode = childTNode.parent || lView[T_HOST];
    const anchorNode = getInsertInFrontOfRNode(parentTNode, childTNode, lView);
    if (parentRNode != null) {
        if (Array.isArray(childRNode)) {
            for (let i = 0; i < childRNode.length; i++) {
                nativeAppendOrInsertBefore(renderer, parentRNode, childRNode[i], anchorNode, false);
            }
        }
        else {
            nativeAppendOrInsertBefore(renderer, parentRNode, childRNode, anchorNode, false);
        }
    }
    _processI18nInsertBefore !== undefined &&
        _processI18nInsertBefore(renderer, childTNode, lView, childRNode, parentRNode);
}
/**
 * Returns the first native node for a given LView, starting from the provided TNode.
 *
 * Native nodes are returned in the order in which those appear in the native tree (DOM).
 */
export function getFirstNativeNode(lView, tNode) {
    if (tNode !== null) {
        ngDevMode &&
            assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */ | 32 /* TNodeType.Icu */ | 16 /* TNodeType.Projection */);
        const tNodeType = tNode.type;
        if (tNodeType & 3 /* TNodeType.AnyRNode */) {
            return getNativeByTNode(tNode, lView);
        }
        else if (tNodeType & 4 /* TNodeType.Container */) {
            return getBeforeNodeForView(-1, lView[tNode.index]);
        }
        else if (tNodeType & 8 /* TNodeType.ElementContainer */) {
            const elIcuContainerChild = tNode.child;
            if (elIcuContainerChild !== null) {
                return getFirstNativeNode(lView, elIcuContainerChild);
            }
            else {
                const rNodeOrLContainer = lView[tNode.index];
                if (isLContainer(rNodeOrLContainer)) {
                    return getBeforeNodeForView(-1, rNodeOrLContainer);
                }
                else {
                    return unwrapRNode(rNodeOrLContainer);
                }
            }
        }
        else if (tNodeType & 32 /* TNodeType.Icu */) {
            let nextRNode = icuContainerIterate(tNode, lView);
            let rNode = nextRNode();
            // If the ICU container has no nodes, than we use the ICU anchor as the node.
            return rNode || unwrapRNode(lView[tNode.index]);
        }
        else {
            const projectionNodes = getProjectionNodes(lView, tNode);
            if (projectionNodes !== null) {
                if (Array.isArray(projectionNodes)) {
                    return projectionNodes[0];
                }
                const parentView = getLViewParent(lView[DECLARATION_COMPONENT_VIEW]);
                ngDevMode && assertParentView(parentView);
                return getFirstNativeNode(parentView, projectionNodes);
            }
            else {
                return getFirstNativeNode(lView, tNode.next);
            }
        }
    }
    return null;
}
export function getProjectionNodes(lView, tNode) {
    if (tNode !== null) {
        const componentView = lView[DECLARATION_COMPONENT_VIEW];
        const componentHost = componentView[T_HOST];
        const slotIdx = tNode.projection;
        ngDevMode && assertProjectionSlots(lView);
        return componentHost.projection[slotIdx];
    }
    return null;
}
export function getBeforeNodeForView(viewIndexInContainer, lContainer) {
    const nextViewIndex = CONTAINER_HEADER_OFFSET + viewIndexInContainer + 1;
    if (nextViewIndex < lContainer.length) {
        const lView = lContainer[nextViewIndex];
        const firstTNodeOfView = lView[TVIEW].firstChild;
        if (firstTNodeOfView !== null) {
            return getFirstNativeNode(lView, firstTNodeOfView);
        }
    }
    return lContainer[NATIVE];
}
/**
 * Removes a native node itself using a given renderer. To remove the node we are looking up its
 * parent from the native tree as not all platforms / browsers support the equivalent of
 * node.remove().
 *
 * @param renderer A renderer to be used
 * @param rNode The native node that should be removed
 * @param isHostElement A flag indicating if a node to be removed is a host of a component.
 */
export function nativeRemoveNode(renderer, rNode, isHostElement) {
    ngDevMode && ngDevMode.rendererRemoveNode++;
    const nativeParent = nativeParentNode(renderer, rNode);
    if (nativeParent) {
        nativeRemoveChild(renderer, nativeParent, rNode, isHostElement);
    }
}
/**
 * Clears the contents of a given RElement.
 *
 * @param rElement the native RElement to be cleared
 */
export function clearElementContents(rElement) {
    rElement.textContent = '';
}
/**
 * Performs the operation of `action` on the node. Typically this involves inserting or removing
 * nodes on the LView or projection boundary.
 */
function applyNodes(renderer, action, tNode, lView, parentRElement, beforeNode, isProjection) {
    while (tNode != null) {
        ngDevMode && assertTNodeForLView(tNode, lView);
        ngDevMode &&
            assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */ | 16 /* TNodeType.Projection */ | 32 /* TNodeType.Icu */);
        const rawSlotValue = lView[tNode.index];
        const tNodeType = tNode.type;
        if (isProjection) {
            if (action === 0 /* WalkTNodeTreeAction.Create */) {
                rawSlotValue && attachPatchData(unwrapRNode(rawSlotValue), lView);
                tNode.flags |= 2 /* TNodeFlags.isProjected */;
            }
        }
        if ((tNode.flags & 32 /* TNodeFlags.isDetached */) !== 32 /* TNodeFlags.isDetached */) {
            if (tNodeType & 8 /* TNodeType.ElementContainer */) {
                applyNodes(renderer, action, tNode.child, lView, parentRElement, beforeNode, false);
                applyToElementOrContainer(action, renderer, parentRElement, rawSlotValue, beforeNode);
            }
            else if (tNodeType & 32 /* TNodeType.Icu */) {
                const nextRNode = icuContainerIterate(tNode, lView);
                let rNode;
                while (rNode = nextRNode()) {
                    applyToElementOrContainer(action, renderer, parentRElement, rNode, beforeNode);
                }
                applyToElementOrContainer(action, renderer, parentRElement, rawSlotValue, beforeNode);
            }
            else if (tNodeType & 16 /* TNodeType.Projection */) {
                applyProjectionRecursive(renderer, action, lView, tNode, parentRElement, beforeNode);
            }
            else {
                ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 4 /* TNodeType.Container */);
                applyToElementOrContainer(action, renderer, parentRElement, rawSlotValue, beforeNode);
            }
        }
        tNode = isProjection ? tNode.projectionNext : tNode.next;
    }
}
function applyView(tView, lView, renderer, action, parentRElement, beforeNode) {
    applyNodes(renderer, action, tView.firstChild, lView, parentRElement, beforeNode, false);
}
/**
 * `applyProjection` performs operation on the projection.
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param tView The `TView` of `LView` which needs to be inserted, detached, destroyed
 * @param lView The `LView` which needs to be inserted, detached, destroyed.
 * @param tProjectionNode node to project
 */
export function applyProjection(tView, lView, tProjectionNode) {
    const renderer = lView[RENDERER];
    const parentRNode = getParentRElement(tView, tProjectionNode, lView);
    const parentTNode = tProjectionNode.parent || lView[T_HOST];
    let beforeNode = getInsertInFrontOfRNode(parentTNode, tProjectionNode, lView);
    applyProjectionRecursive(renderer, 0 /* WalkTNodeTreeAction.Create */, lView, tProjectionNode, parentRNode, beforeNode);
}
/**
 * `applyProjectionRecursive` performs operation on the projection specified by `action` (insert,
 * detach, destroy)
 *
 * Inserting a projection requires us to locate the projected nodes from the parent component. The
 * complication is that those nodes themselves could be re-projected from their parent component.
 *
 * @param renderer Render to use
 * @param action action to perform (insert, detach, destroy)
 * @param lView The LView which needs to be inserted, detached, destroyed.
 * @param tProjectionNode node to project
 * @param parentRElement parent DOM element for insertion/removal.
 * @param beforeNode Before which node the insertions should happen.
 */
function applyProjectionRecursive(renderer, action, lView, tProjectionNode, parentRElement, beforeNode) {
    const componentLView = lView[DECLARATION_COMPONENT_VIEW];
    const componentNode = componentLView[T_HOST];
    ngDevMode &&
        assertEqual(typeof tProjectionNode.projection, 'number', 'expecting projection index');
    const nodeToProjectOrRNodes = componentNode.projection[tProjectionNode.projection];
    if (Array.isArray(nodeToProjectOrRNodes)) {
        // This should not exist, it is a bit of a hack. When we bootstrap a top level node and we
        // need to support passing projectable nodes, so we cheat and put them in the TNode
        // of the Host TView. (Yes we put instance info at the T Level). We can get away with it
        // because we know that that TView is not shared and therefore it will not be a problem.
        // This should be refactored and cleaned up.
        for (let i = 0; i < nodeToProjectOrRNodes.length; i++) {
            const rNode = nodeToProjectOrRNodes[i];
            applyToElementOrContainer(action, renderer, parentRElement, rNode, beforeNode);
        }
    }
    else {
        let nodeToProject = nodeToProjectOrRNodes;
        const projectedComponentLView = componentLView[PARENT];
        // If a parent <ng-content> is located within a skip hydration block,
        // annotate an actual node that is being projected with the same flag too.
        if (hasInSkipHydrationBlockFlag(tProjectionNode)) {
            nodeToProject.flags |= 128 /* TNodeFlags.inSkipHydrationBlock */;
        }
        applyNodes(renderer, action, nodeToProject, projectedComponentLView, parentRElement, beforeNode, true);
    }
}
/**
 * `applyContainer` performs an operation on the container and its views as specified by
 * `action` (insert, detach, destroy)
 *
 * Inserting a Container is complicated by the fact that the container may have Views which
 * themselves have containers or projections.
 *
 * @param renderer Renderer to use
 * @param action action to perform (insert, detach, destroy)
 * @param lContainer The LContainer which needs to be inserted, detached, destroyed.
 * @param parentRElement parent DOM element for insertion/removal.
 * @param beforeNode Before which node the insertions should happen.
 */
function applyContainer(renderer, action, lContainer, parentRElement, beforeNode) {
    ngDevMode && assertLContainer(lContainer);
    const anchor = lContainer[NATIVE]; // LContainer has its own before node.
    const native = unwrapRNode(lContainer);
    // An LContainer can be created dynamically on any node by injecting ViewContainerRef.
    // Asking for a ViewContainerRef on an element will result in a creation of a separate anchor
    // node (comment in the DOM) that will be different from the LContainer's host node. In this
    // particular case we need to execute action on 2 nodes:
    // - container's host node (this is done in the executeActionOnElementOrContainer)
    // - container's host node (this is done here)
    if (anchor !== native) {
        // This is very strange to me (Misko). I would expect that the native is same as anchor. I
        // don't see a reason why they should be different, but they are.
        //
        // If they are we need to process the second anchor as well.
        applyToElementOrContainer(action, renderer, parentRElement, anchor, beforeNode);
    }
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        const lView = lContainer[i];
        applyView(lView[TVIEW], lView, renderer, action, parentRElement, anchor);
    }
}
/**
 * Writes class/style to element.
 *
 * @param renderer Renderer to use.
 * @param isClassBased `true` if it should be written to `class` (`false` to write to `style`)
 * @param rNode The Node to write to.
 * @param prop Property to write to. This would be the class/style name.
 * @param value Value to write. If `null`/`undefined`/`false` this is considered a remove (set/add
 *        otherwise).
 */
export function applyStyling(renderer, isClassBased, rNode, prop, value) {
    if (isClassBased) {
        // We actually want JS true/false here because any truthy value should add the class
        if (!value) {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            renderer.removeClass(rNode, prop);
        }
        else {
            ngDevMode && ngDevMode.rendererAddClass++;
            renderer.addClass(rNode, prop);
        }
    }
    else {
        let flags = prop.indexOf('-') === -1 ? undefined : RendererStyleFlags2.DashCase;
        if (value == null /** || value === undefined */) {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            renderer.removeStyle(rNode, prop, flags);
        }
        else {
            // A value is important if it ends with `!important`. The style
            // parser strips any semicolons at the end of the value.
            const isImportant = typeof value === 'string' ? value.endsWith('!important') : false;
            if (isImportant) {
                // !important has to be stripped from the value for it to be valid.
                value = value.slice(0, -10);
                flags |= RendererStyleFlags2.Important;
            }
            ngDevMode && ngDevMode.rendererSetStyle++;
            renderer.setStyle(rNode, prop, value, flags);
        }
    }
}
/**
 * Write `cssText` to `RElement`.
 *
 * This function does direct write without any reconciliation. Used for writing initial values, so
 * that static styling values do not pull in the style parser.
 *
 * @param renderer Renderer to use
 * @param element The element which needs to be updated.
 * @param newValue The new class list to write.
 */
export function writeDirectStyle(renderer, element, newValue) {
    ngDevMode && assertString(newValue, '\'newValue\' should be a string');
    renderer.setAttribute(element, 'style', newValue);
    ngDevMode && ngDevMode.rendererSetStyle++;
}
/**
 * Write `className` to `RElement`.
 *
 * This function does direct write without any reconciliation. Used for writing initial values, so
 * that static styling values do not pull in the style parser.
 *
 * @param renderer Renderer to use
 * @param element The element which needs to be updated.
 * @param newValue The new class list to write.
 */
export function writeDirectClass(renderer, element, newValue) {
    ngDevMode && assertString(newValue, '\'newValue\' should be a string');
    if (newValue === '') {
        // There are tests in `google3` which expect `element.getAttribute('class')` to be `null`.
        renderer.removeAttribute(element, 'class');
    }
    else {
        renderer.setAttribute(element, 'class', newValue);
    }
    ngDevMode && ngDevMode.rendererSetClassName++;
}
/** Sets up the static DOM attributes on an `RNode`. */
export function setupStaticAttributes(renderer, element, tNode) {
    const { mergedAttrs, classes, styles } = tNode;
    if (mergedAttrs !== null) {
        setUpAttributes(renderer, element, mergedAttrs);
    }
    if (classes !== null) {
        writeDirectClass(renderer, element, classes);
    }
    if (styles !== null) {
        writeDirectStyle(renderer, element, styles);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxVQUFVLEVBQUUsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0RyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNySCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDN0QsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUV4SCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFJNUQsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUMvRCxPQUFPLEVB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QUFFLENBQUM7QUFDaEQsQ0FBQztBQUVELHVEQUF1RDtBQUN2RCxNQUFNLFVBQVUscUJBQXFCLENBQUMsUUFBa0IsRUFBRSxPQUFpQixFQUFFLEtBQVk7SUFDdkYsTUFBTSxFQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFDLEdBQUcsS0FBSyxDQUFDO0lBRTdDLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtRQUN4QixlQUFlLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNqRDtJQUVELElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtRQUNwQixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQzlDO0lBRUQsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1FBQ25CLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aGFzSW5Ta2lwSHlkcmF0aW9uQmxvY2tGbGFnfSBmcm9tICcuLi9oeWRyYXRpb24vc2tpcF9oeWRyYXRpb24nO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge1JlbmRlcmVyU3R5bGVGbGFnczJ9IGZyb20gJy4uL3JlbmRlci9hcGlfZmxhZ3MnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0RnVuY3Rpb24sIGFzc2VydE51bWJlciwgYXNzZXJ0U3RyaW5nfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2VzY2FwZUNvbW1lbnRUZXh0fSBmcm9tICcuLi91dGlsL2RvbSc7XG5cbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFBhcmVudFZpZXcsIGFzc2VydFByb2plY3Rpb25TbG90cywgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtpY3VDb250YWluZXJJdGVyYXRlfSBmcm9tICcuL2kxOG4vaTE4bl90cmVlX3NoYWtpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgSEFTX1RSQU5TUExBTlRFRF9WSUVXUywgTENvbnRhaW5lciwgTU9WRURfVklFV1MsIE5BVElWRX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHt1bnJlZ2lzdGVyTFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy9sdmlld190cmFja2luZyc7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRlbXBsYXRlLCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0xFQU5VUCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX0xDT05UQUlORVIsIERlc3Ryb3lIb29rRGF0YSwgRkxBR1MsIEhvb2tEYXRhLCBIb29rRm4sIEhPU1QsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBPTl9ERVNUUk9ZX0hPT0tTLCBQQVJFTlQsIFFVRVJJRVMsIFJFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUiwgUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVIsIFJFTkRFUkVSLCBUX0hPU1QsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge3Byb2ZpbGVyLCBQcm9maWxlckV2ZW50fSBmcm9tICcuL3Byb2ZpbGVyJztcbmltcG9ydCB7c2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Y2xlYXJWaWV3UmVmcmVzaEZsYWcsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IGVudW0gV2Fsa1ROb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGNyZWF0ZSBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50LiBSdW4gb24gaW5pdGlhbCBjcmVhdGlvbi4gKi9cbiAgQ3JlYXRlID0gMCxcblxuICAvKipcbiAgICogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudC5cbiAgICogUnVuIHdoZW4gZXhpc3Rpbmcgbm9kZSBoYXMgYmVlbiBkZXRhY2hlZCBhbmQgbmVlZHMgdG8gYmUgcmUtYXR0YWNoZWQuXG4gICAqL1xuICBJbnNlcnQgPSAxLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMixcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDMsXG59XG5cblxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlciwgcGFyZW50OiBSRWxlbWVudHxudWxsLFxuICAgIGxOb2RlVG9IYW5kbGU6IFJOb2RlfExDb250YWluZXJ8TFZpZXcsIGJlZm9yZU5vZGU/OiBSTm9kZXxudWxsKSB7XG4gIC8vIElmIHRoaXMgc2xvdCB3YXMgYWxsb2NhdGVkIGZvciBhIHRleHQgbm9kZSBkeW5hbWljYWxseSBjcmVhdGVkIGJ5IGkxOG4sIHRoZSB0ZXh0IG5vZGUgaXRzZWxmXG4gIC8vIHdvbid0IGJlIGNyZWF0ZWQgdW50aWwgaTE4bkFwcGx5KCkgaW4gdGhlIHVwZGF0ZSBibG9jaywgc28gdGhpcyBub2RlIHNob3VsZCBiZSBza2lwcGVkLlxuICAvLyBGb3IgbW9yZSBpbmZvLCBzZWUgXCJJQ1UgZXhwcmVzc2lvbnMgc2hvdWxkIHdvcmsgaW5zaWRlIGFuIG5nVGVtcGxhdGVPdXRsZXQgaW5zaWRlIGFuIG5nRm9yXCJcbiAgLy8gaW4gYGkxOG5fc3BlYy50c2AuXG4gIGlmIChsTm9kZVRvSGFuZGxlICE9IG51bGwpIHtcbiAgICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcnx1bmRlZmluZWQ7XG4gICAgbGV0IGlzQ29tcG9uZW50ID0gZmFsc2U7XG4gICAgLy8gV2UgYXJlIGV4cGVjdGluZyBhbiBSTm9kZSwgYnV0IGluIHRoZSBjYXNlIG9mIGEgY29tcG9uZW50IG9yIExDb250YWluZXIgdGhlIGBSTm9kZWAgaXNcbiAgICAvLyB3cmFwcGVkIGluIGFuIGFycmF5IHdoaWNoIG5lZWRzIHRvIGJlIHVud3JhcHBlZC4gV2UgbmVlZCB0byBrbm93IGlmIGl0IGlzIGEgY29tcG9uZW50IGFuZCBpZlxuICAgIC8vIGl0IGhhcyBMQ29udGFpbmVyIHNvIHRoYXQgd2UgY2FuIHByb2Nlc3MgYWxsIG9mIHRob3NlIGNhc2VzIGFwcHJvcHJpYXRlbHkuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZVRvSGFuZGxlKSkge1xuICAgICAgbENvbnRhaW5lciA9IGxOb2RlVG9IYW5kbGU7XG4gICAgfSBlbHNlIGlmIChpc0xWaWV3KGxOb2RlVG9IYW5kbGUpKSB7XG4gICAgICBpc0NvbXBvbmVudCA9IHRydWU7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsTm9kZVRvSGFuZGxlW0hPU1RdLCAnSE9TVCBtdXN0IGJlIGRlZmluZWQgZm9yIGEgY29tcG9uZW50IExWaWV3Jyk7XG4gICAgICBsTm9kZVRvSGFuZGxlID0gbE5vZGVUb0hhbmRsZVtIT1NUXSE7XG4gICAgfVxuICAgIGNvbnN0IHJOb2RlOiBSTm9kZSA9IHVud3JhcFJOb2RlKGxOb2RlVG9IYW5kbGUpO1xuXG4gICAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBpZiAoYmVmb3JlTm9kZSA9PSBudWxsKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgck5vZGUsIGJlZm9yZU5vZGUgfHwgbnVsbCwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCByTm9kZSwgaXNDb21wb25lbnQpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgcmVuZGVyZXIuZGVzdHJveU5vZGUhKHJOb2RlKTtcbiAgICB9XG4gICAgaWYgKGxDb250YWluZXIgIT0gbnVsbCkge1xuICAgICAgYXBwbHlDb250YWluZXIocmVuZGVyZXIsIGFjdGlvbiwgbENvbnRhaW5lciwgcGFyZW50LCBiZWZvcmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgdmFsdWU6IHN0cmluZyk6IFJUZXh0IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHJldHVybiByZW5kZXJlci5jcmVhdGVUZXh0KHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRleHROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgck5vZGU6IFJUZXh0LCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHJlbmRlcmVyLnNldFZhbHVlKHJOb2RlLCB2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21tZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIsIHZhbHVlOiBzdHJpbmcpOiBSQ29tbWVudCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIHJldHVybiByZW5kZXJlci5jcmVhdGVDb21tZW50KGVzY2FwZUNvbW1lbnRUZXh0KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gbmFtZXNwYWNlIE9wdGlvbmFsIG5hbWVzcGFjZSBmb3IgZWxlbWVudC5cbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROb2RlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U6IHN0cmluZ3xudWxsKTogUkVsZW1lbnQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICByZXR1cm4gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xufVxuXG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlld0Zyb21Db250YWluZXIodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbnVsbCwgbnVsbCk7XG4gIGxWaWV3W0hPU1RdID0gbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IG51bGw7XG59XG5cbi8qKlxuICogQWRkcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIGFkZCBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gcGFyZW50VE5vZGUgVGhlIGBUTm9kZWAgd2hlcmUgdGhlIGBMVmlld2Agc2hvdWxkIGJlIGF0dGFjaGVkIHRvLlxuICogQHBhcmFtIHJlbmRlcmVyIEN1cnJlbnQgcmVuZGVyZXIgdG8gdXNlIGZvciBET00gbWFuaXB1bGF0aW9ucy5cbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gcGFyZW50TmF0aXZlTm9kZSBUaGUgcGFyZW50IGBSRWxlbWVudGAgd2hlcmUgaXQgc2hvdWxkIGJlIGluc2VydGVkIGludG8uXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVmlld1RvQ29udGFpbmVyKFxuICAgIHRWaWV3OiBUVmlldywgcGFyZW50VE5vZGU6IFROb2RlLCByZW5kZXJlcjogUmVuZGVyZXIsIGxWaWV3OiBMVmlldywgcGFyZW50TmF0aXZlTm9kZTogUkVsZW1lbnQsXG4gICAgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCk6IHZvaWQge1xuICBsVmlld1tIT1NUXSA9IHBhcmVudE5hdGl2ZU5vZGU7XG4gIGxWaWV3W1RfSE9TVF0gPSBwYXJlbnRUTm9kZTtcbiAgYXBwbHlWaWV3KHRWaWV3LCBsVmlldywgcmVuZGVyZXIsIFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0LCBwYXJlbnROYXRpdmVOb2RlLCBiZWZvcmVOb2RlKTtcbn1cblxuXG4vKipcbiAqIERldGFjaCBhIGBMVmlld2AgZnJvbSB0aGUgRE9NIGJ5IGRldGFjaGluZyBpdHMgbm9kZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGJlIGRldGFjaGVkXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2AgdG8gYmUgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZXRhY2hWaWV3KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIG51bGwsIG51bGwpO1xufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBsZXQgbFZpZXdPckxDb250YWluZXIgPSByb290Vmlld1tDSElMRF9IRUFEXTtcbiAgaWYgKCFsVmlld09yTENvbnRhaW5lcikge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlld1tUVklFV10sIHJvb3RWaWV3KTtcbiAgfVxuXG4gIHdoaWxlIChsVmlld09yTENvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAvLyBJZiBMVmlldywgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lcltDSElMRF9IRUFEXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IGZpcnN0VmlldzogTFZpZXd8dW5kZWZpbmVkID0gbFZpZXdPckxDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdO1xuICAgICAgaWYgKGZpcnN0VmlldykgbmV4dCA9IGZpcnN0VmlldztcbiAgICB9XG5cbiAgICBpZiAoIW5leHQpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAobFZpZXdPckxDb250YWluZXIgJiYgIWxWaWV3T3JMQ29udGFpbmVyIVtORVhUXSAmJiBsVmlld09yTENvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXJbVFZJRVddLCBsVmlld09yTENvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgbFZpZXdPckxDb250YWluZXIgPSBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdO1xuICAgICAgfVxuICAgICAgaWYgKGxWaWV3T3JMQ29udGFpbmVyID09PSBudWxsKSBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3O1xuICAgICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KGxWaWV3T3JMQ29udGFpbmVyW1RWSUVXXSwgbFZpZXdPckxDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgbmV4dCA9IGxWaWV3T3JMQ29udGFpbmVyICYmIGxWaWV3T3JMQ29udGFpbmVyIVtORVhUXTtcbiAgICB9XG4gICAgbFZpZXdPckxDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCB0byBpbnNlcnRcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBpbmRleCBXaGljaCBpbmRleCBpbiB0aGUgY29udGFpbmVyIHRvIGluc2VydCB0aGUgY2hpbGQgdmlldyBpbnRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICBjb25zdCBpbmRleEluQ29udGFpbmVyID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyBpbmRleDtcbiAgY29uc3QgY29udGFpbmVyTGVuZ3RoID0gbENvbnRhaW5lci5sZW5ndGg7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lciAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cbiAgaWYgKGluZGV4IDwgY29udGFpbmVyTGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHtcbiAgICBsVmlld1tORVhUXSA9IGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lcl07XG4gICAgYWRkVG9BcnJheShsQ29udGFpbmVyLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIGluZGV4LCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgbENvbnRhaW5lci5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyB0cmFjayB2aWV3cyB3aGVyZSBkZWNsYXJhdGlvbiBhbmQgaW5zZXJ0aW9uIHBvaW50cyBhcmUgZGlmZmVyZW50XG4gIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IGxWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBudWxsICYmIGxDb250YWluZXIgIT09IGRlY2xhcmF0aW9uTENvbnRhaW5lcikge1xuICAgIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uTENvbnRhaW5lciwgbFZpZXcpO1xuICB9XG5cbiAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBjb25zdCBsUXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBsUXVlcmllcy5pbnNlcnRWaWV3KHRWaWV3KTtcbiAgfVxuXG4gIC8vIFNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogVHJhY2sgdmlld3MgY3JlYXRlZCBmcm9tIHRoZSBkZWNsYXJhdGlvbiBjb250YWluZXIgKFRlbXBsYXRlUmVmKSBhbmQgaW5zZXJ0ZWQgaW50byBhXG4gKiBkaWZmZXJlbnQgTENvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gdHJhY2tNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlldywgJ0xWaWV3IHJlcXVpcmVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uQ29udGFpbmVyKTtcbiAgY29uc3QgbW92ZWRWaWV3cyA9IGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXTtcbiAgY29uc3QgaW5zZXJ0ZWRMQ29udGFpbmVyID0gbFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRlZExDb250YWluZXIpO1xuICBjb25zdCBpbnNlcnRlZENvbXBvbmVudExWaWV3ID0gaW5zZXJ0ZWRMQ29udGFpbmVyW1BBUkVOVF0hW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaW5zZXJ0ZWRDb21wb25lbnRMVmlldywgJ01pc3NpbmcgaW5zZXJ0ZWRDb21wb25lbnRMVmlldycpO1xuICBjb25zdCBkZWNsYXJlZENvbXBvbmVudExWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkZWNsYXJlZENvbXBvbmVudExWaWV3LCAnTWlzc2luZyBkZWNsYXJlZENvbXBvbmVudExWaWV3Jyk7XG4gIGlmIChkZWNsYXJlZENvbXBvbmVudExWaWV3ICE9PSBpbnNlcnRlZENvbXBvbmVudExWaWV3KSB7XG4gICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgZGVjbGFyYXRpb24tY29tcG9uZW50IGlzIG5vdCBzYW1lIGFzIGluc2VydGlvbi1jb21wb25lbnQ7IHRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHRoaXMgaXMgYSB0cmFuc3BsYW50ZWQgdmlldy4gTWFyayB0aGUgZGVjbGFyZWQgbFZpZXcgYXMgaGF2aW5nIHRyYW5zcGxhbnRlZCB2aWV3cyBzbyB0aGF0XG4gICAgLy8gdGhvc2Ugdmlld3MgY2FuIHBhcnRpY2lwYXRlIGluIENELlxuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW0hBU19UUkFOU1BMQU5URURfVklFV1NdID0gdHJ1ZTtcbiAgfVxuICBpZiAobW92ZWRWaWV3cyA9PT0gbnVsbCkge1xuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSA9IFtsVmlld107XG4gIH0gZWxzZSB7XG4gICAgbW92ZWRWaWV3cy5wdXNoKGxWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10sXG4gICAgICAgICAgJ0EgcHJvamVjdGVkIHZpZXcgc2hvdWxkIGJlbG9uZyB0byBhIG5vbi1lbXB0eSBwcm9qZWN0ZWQgdmlld3MgY29sbGVjdGlvbicpO1xuICBjb25zdCBtb3ZlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdITtcbiAgY29uc3QgZGVjbGFyYXRpb25WaWV3SW5kZXggPSBtb3ZlZFZpZXdzLmluZGV4T2YobFZpZXcpO1xuICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcblxuICAvLyBJZiB0aGUgdmlldyB3YXMgbWFya2VkIGZvciByZWZyZXNoIGJ1dCB0aGVuIGRldGFjaGVkIGJlZm9yZSBpdCB3YXMgY2hlY2tlZCAod2hlcmUgdGhlIGZsYWdcbiAgLy8gd291bGQgYmUgY2xlYXJlZCBhbmQgdGhlIGNvdW50ZXIgZGVjcmVtZW50ZWQpLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgc3RhdHVzIGhlcmUuXG4gIGNsZWFyVmlld1JlZnJlc2hGbGFnKGxWaWV3KTtcblxuICBtb3ZlZFZpZXdzLnNwbGljZShkZWNsYXJhdGlvblZpZXdJbmRleCwgMSk7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2QgcmVtb3ZlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBEZXRhY2hlZCBMVmlldyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3fHVuZGVmaW5lZCB7XG4gIGlmIChsQ29udGFpbmVyLmxlbmd0aCA8PSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkgcmV0dXJuO1xuXG4gIGNvbnN0IGluZGV4SW5Db250YWluZXIgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHJlbW92ZUluZGV4O1xuICBjb25zdCB2aWV3VG9EZXRhY2ggPSBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXJdO1xuXG4gIGlmICh2aWV3VG9EZXRhY2gpIHtcbiAgICBjb25zdCBkZWNsYXJhdGlvbkxDb250YWluZXIgPSB2aWV3VG9EZXRhY2hbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgaWYgKGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbnVsbCAmJiBkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IGxDb250YWluZXIpIHtcbiAgICAgIGRldGFjaE1vdmVkVmlldyhkZWNsYXJhdGlvbkxDb250YWluZXIsIHZpZXdUb0RldGFjaCk7XG4gICAgfVxuXG5cbiAgICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlldztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlZExWaWV3ID0gcmVtb3ZlRnJvbUFycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXgpO1xuICAgIHJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHZpZXdUb0RldGFjaFtUVklFV10sIHZpZXdUb0RldGFjaCk7XG5cbiAgICAvLyBub3RpZnkgcXVlcnkgdGhhdCBhIHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICAgIGNvbnN0IGxRdWVyaWVzID0gcmVtb3ZlZExWaWV3W1FVRVJJRVNdO1xuICAgIGlmIChsUXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgbFF1ZXJpZXMuZGV0YWNoVmlldyhyZW1vdmVkTFZpZXdbVFZJRVddKTtcbiAgICB9XG5cbiAgICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gICAgdmlld1RvRGV0YWNoW05FWFRdID0gbnVsbDtcbiAgICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICB9XG4gIHJldHVybiB2aWV3VG9EZXRhY2g7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbiB1cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGJlIGRlc3Ryb3llZFxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBpZiAoIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcblxuICAgIGxWaWV3W1JFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSXT8uZGVzdHJveSgpO1xuICAgIGxWaWV3W1JFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUl0/LmRlc3Ryb3koKTtcblxuICAgIGlmIChyZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgYXBwbHlWaWV3KHRWaWV3LCBsVmlldywgcmVuZGVyZXIsIFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgZGVzdHJveVZpZXdUcmVlKGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIG9uRGVzdHJveXMgaG9va3MgZm9yIGFsbCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBpbiBhIGdpdmVuIHZpZXcgYW5kIHRoZW4gcmVtb3ZlcyBhbGxcbiAqIGxpc3RlbmVycy4gTGlzdGVuZXJzIGFyZSByZW1vdmVkIGFzIHRoZSBsYXN0IHN0ZXAgc28gZXZlbnRzIGRlbGl2ZXJlZCBpbiB0aGUgb25EZXN0cm95cyBob29rc1xuICogY2FuIGJlIHByb3BhZ2F0ZWQgdG8gQE91dHB1dCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgZm9yIHRoZSBgTFZpZXdgIHRvIGNsZWFuIHVwLlxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAoIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkpIHtcbiAgICAvLyBVc3VhbGx5IHRoZSBBdHRhY2hlZCBmbGFnIGlzIHJlbW92ZWQgd2hlbiB0aGUgdmlldyBpcyBkZXRhY2hlZCBmcm9tIGl0cyBwYXJlbnQsIGhvd2V2ZXJcbiAgICAvLyBpZiBpdCdzIGEgcm9vdCB2aWV3LCB0aGUgZmxhZyB3b24ndCBiZSB1bnNldCBoZW5jZSB3aHkgd2UncmUgYWxzbyByZW1vdmluZyBvbiBkZXN0cm95LlxuICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcblxuICAgIC8vIE1hcmsgdGhlIExWaWV3IGFzIGRlc3Ryb3llZCAqYmVmb3JlKiBleGVjdXRpbmcgdGhlIG9uRGVzdHJveSBob29rcy4gQW4gb25EZXN0cm95IGhvb2tcbiAgICAvLyBydW5zIGFyYml0cmFyeSB1c2VyIGNvZGUsIHdoaWNoIGNvdWxkIGluY2x1ZGUgaXRzIG93biBgdmlld1JlZi5kZXN0cm95KClgIChvciBzaW1pbGFyKS4gSWZcbiAgICAvLyBXZSBkb24ndCBmbGFnIHRoZSB2aWV3IGFzIGRlc3Ryb3llZCBiZWZvcmUgdGhlIGhvb2tzLCB0aGlzIGNvdWxkIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAvLyBUaGlzIGFsc28gYWxpZ25zIHdpdGggdGhlIFZpZXdFbmdpbmUgYmVoYXZpb3IuIEl0IGFsc28gbWVhbnMgdGhhdCB0aGUgb25EZXN0cm95IGhvb2sgaXNcbiAgICAvLyByZWFsbHkgbW9yZSBvZiBhbiBcImFmdGVyRGVzdHJveVwiIGhvb2sgaWYgeW91IHRoaW5rIGFib3V0IGl0LlxuICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcblxuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHRWaWV3LCBsVmlldyk7XG4gICAgcHJvY2Vzc0NsZWFudXBzKHRWaWV3LCBsVmlldyk7XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGF0IGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGxWaWV3W1RWSUVXXS50eXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgbFZpZXdbUkVOREVSRVJdLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbkNvbnRhaW5lciA9IGxWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICAgIC8vIHdlIGFyZSBkZWFsaW5nIHdpdGggYW4gZW1iZWRkZWQgdmlldyB0aGF0IGlzIHN0aWxsIGluc2VydGVkIGludG8gYSBjb250YWluZXJcbiAgICBpZiAoZGVjbGFyYXRpb25Db250YWluZXIgIT09IG51bGwgJiYgaXNMQ29udGFpbmVyKGxWaWV3W1BBUkVOVF0pKSB7XG4gICAgICAvLyBhbmQgdGhpcyBpcyBhIHByb2plY3RlZCB2aWV3XG4gICAgICBpZiAoZGVjbGFyYXRpb25Db250YWluZXIgIT09IGxWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyLCBsVmlldyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBlbWJlZGRlZCB2aWV3cyBzdGlsbCBhdHRhY2hlZCB0byBhIGNvbnRhaW5lcjogcmVtb3ZlIHF1ZXJ5IHJlc3VsdCBmcm9tIHRoaXMgdmlldy5cbiAgICAgIGNvbnN0IGxRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gICAgICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgICAgbFF1ZXJpZXMuZGV0YWNoVmlldyh0Vmlldyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVW5yZWdpc3RlciB0aGUgdmlldyBvbmNlIGV2ZXJ5dGhpbmcgZWxzZSBoYXMgYmVlbiBjbGVhbmVkIHVwLlxuICAgIHVucmVnaXN0ZXJMVmlldyhsVmlldyk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcHJvY2Vzc0NsZWFudXBzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSE7XG4gIGlmICh0Q2xlYW51cCAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBpZiAodHlwZW9mIHRDbGVhbnVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbmF0aXZlIERPTSBsaXN0ZW5lci4gSXQgd2lsbCBvY2N1cHkgNCBlbnRyaWVzIGluIHRoZSBUQ2xlYW51cCBhcnJheSAoaGVuY2UgaSArPVxuICAgICAgICAvLyAyIGF0IHRoZSBlbmQgb2YgdGhpcyBibG9jaykuXG4gICAgICAgIGNvbnN0IHRhcmdldElkeCA9IHRDbGVhbnVwW2kgKyAzXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE51bWJlcih0YXJnZXRJZHgsICdjbGVhbnVwIHRhcmdldCBtdXN0IGJlIGEgbnVtYmVyJyk7XG4gICAgICAgIGlmICh0YXJnZXRJZHggPj0gMCkge1xuICAgICAgICAgIC8vIHVucmVnaXN0ZXJcbiAgICAgICAgICBsQ2xlYW51cFt0YXJnZXRJZHhdKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU3Vic2NyaXB0aW9uXG4gICAgICAgICAgbENsZWFudXBbLXRhcmdldElkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIHRDbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChsQ2xlYW51cCAhPT0gbnVsbCkge1xuICAgIGxWaWV3W0NMRUFOVVBdID0gbnVsbDtcbiAgfVxuICBjb25zdCBkZXN0cm95SG9va3MgPSBsVmlld1tPTl9ERVNUUk9ZX0hPT0tTXTtcbiAgaWYgKGRlc3Ryb3lIb29rcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzdHJveUhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZXN0cm95SG9va3NGbiA9IGRlc3Ryb3lIb29rc1tpXTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGdW5jdGlvbihkZXN0cm95SG9va3NGbiwgJ0V4cGVjdGluZyBkZXN0cm95IGhvb2sgdG8gYmUgYSBmdW5jdGlvbi4nKTtcbiAgICAgIGRlc3Ryb3lIb29rc0ZuKCk7XG4gICAgfVxuICAgIGxWaWV3W09OX0RFU1RST1lfSE9PS1NdID0gbnVsbDtcbiAgfVxufVxuXG4vKiogQ2FsbHMgb25EZXN0cm95IGhvb2tzIGZvciB0aGlzIHZpZXcgKi9cbmZ1bmN0aW9uIGV4ZWN1dGVPbkRlc3Ryb3lzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGxldCBkZXN0cm95SG9va3M6IERlc3Ryb3lIb29rRGF0YXxudWxsO1xuXG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3Ryb3lIb29rcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgY29udGV4dCA9IGxWaWV3W2Rlc3Ryb3lIb29rc1tpXSBhcyBudW1iZXJdO1xuXG4gICAgICAvLyBPbmx5IGNhbGwgdGhlIGRlc3Ryb3kgaG9vayBpZiB0aGUgY29udGV4dCBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gICAgICBpZiAoIShjb250ZXh0IGluc3RhbmNlb2YgTm9kZUluamVjdG9yRmFjdG9yeSkpIHtcbiAgICAgICAgY29uc3QgdG9DYWxsID0gZGVzdHJveUhvb2tzW2kgKyAxXSBhcyBIb29rRm4gfCBIb29rRGF0YTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b0NhbGwpKSB7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b0NhbGwubGVuZ3RoOyBqICs9IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxDb250ZXh0ID0gY29udGV4dFt0b0NhbGxbal0gYXMgbnVtYmVyXTtcbiAgICAgICAgICAgIGNvbnN0IGhvb2sgPSB0b0NhbGxbaiArIDFdIGFzIEhvb2tGbjtcbiAgICAgICAgICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuTGlmZWN5Y2xlSG9va1N0YXJ0LCBjYWxsQ29udGV4dCwgaG9vayk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBob29rLmNhbGwoY2FsbENvbnRleHQpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5MaWZlY3ljbGVIb29rRW5kLCBjYWxsQ29udGV4dCwgaG9vayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuTGlmZWN5Y2xlSG9va1N0YXJ0LCBjb250ZXh0LCB0b0NhbGwpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0b0NhbGwuY2FsbChjb250ZXh0KTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5MaWZlY3ljbGVIb29rRW5kLCBjb250ZXh0LCB0b0NhbGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgZWxlbWVudCBpZiBhIG5vZGUgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYWRlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG4gKiBAcGFyYW0gdFZpZXc6IEN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0Tm9kZTogYFROb2RlYCBmb3Igd2hpY2ggd2Ugd2lzaCB0byByZXRyaWV2ZSByZW5kZXIgcGFyZW50LlxuICogQHBhcmFtIGxWaWV3OiBDdXJyZW50IGBMVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRSRWxlbWVudCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIHJldHVybiBnZXRDbG9zZXN0UkVsZW1lbnQodFZpZXcsIHROb2RlLnBhcmVudCwgbFZpZXcpO1xufVxuXG4vKipcbiAqIEdldCBjbG9zZXN0IGBSRWxlbWVudGAgb3IgYG51bGxgIGlmIGl0IGNhbid0IGJlIGZvdW5kLlxuICpcbiAqIElmIGBUTm9kZWAgaXMgYFROb2RlVHlwZS5FbGVtZW50YCA9PiByZXR1cm4gYFJFbGVtZW50YCBhdCBgTFZpZXdbdE5vZGUuaW5kZXhdYCBsb2NhdGlvbi5cbiAqIElmIGBUTm9kZWAgaXMgYFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyfEljdUNvbnRhaW5gID0+IHJldHVybiB0aGUgcGFyZW50IChyZWN1cnNpdmVseSkuXG4gKiBJZiBgVE5vZGVgIGlzIGBudWxsYCB0aGVuIHJldHVybiBob3N0IGBSRWxlbWVudGA6XG4gKiAgIC0gcmV0dXJuIGBudWxsYCBpZiBwcm9qZWN0aW9uXG4gKiAgIC0gcmV0dXJuIGBudWxsYCBpZiBwYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZCAod2UgaGF2ZSBubyBwYXJlbnQuKVxuICpcbiAqIEBwYXJhbSB0VmlldzogQ3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIHROb2RlOiBgVE5vZGVgIGZvciB3aGljaCB3ZSB3aXNoIHRvIHJldHJpZXZlIGBSRWxlbWVudGAgKG9yIGBudWxsYCBpZiBob3N0IGVsZW1lbnQgaXNcbiAqICAgICBuZWVkZWQpLlxuICogQHBhcmFtIGxWaWV3OiBDdXJyZW50IGBMVmlld2AuXG4gKiBAcmV0dXJucyBgbnVsbGAgaWYgdGhlIGBSRWxlbWVudGAgY2FuJ3QgYmUgZGV0ZXJtaW5lZCBhdCB0aGlzIHRpbWUgKG5vIHBhcmVudCAvIHByb2plY3Rpb24pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDbG9zZXN0UkVsZW1lbnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3KTogUkVsZW1lbnR8bnVsbCB7XG4gIGxldCBwYXJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IHROb2RlO1xuICAvLyBTa2lwIG92ZXIgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnMgYXMgdGhvc2UgYXJlIHJlcHJlc2VudGVkIGJ5IGEgY29tbWVudCBub2RlIGFuZFxuICAvLyBjYW4ndCBiZSB1c2VkIGFzIGEgcmVuZGVyIHBhcmVudC5cbiAgd2hpbGUgKHBhcmVudFROb2RlICE9PSBudWxsICYmXG4gICAgICAgICAocGFyZW50VE5vZGUudHlwZSAmIChUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8IFROb2RlVHlwZS5JY3UpKSkge1xuICAgIHROb2RlID0gcGFyZW50VE5vZGU7XG4gICAgcGFyZW50VE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIH1cblxuICAvLyBJZiB0aGUgcGFyZW50IHROb2RlIGlzIG51bGwsIHRoZW4gd2UgYXJlIGluc2VydGluZyBhY3Jvc3Mgdmlld3M6IGVpdGhlciBpbnRvIGFuIGVtYmVkZGVkIHZpZXdcbiAgLy8gb3IgYSBjb21wb25lbnQgdmlldy5cbiAgaWYgKHBhcmVudFROb2RlID09PSBudWxsKSB7XG4gICAgLy8gV2UgYXJlIGluc2VydGluZyBhIHJvb3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IHZpZXcgaW50byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhbmRcbiAgICAvLyBpdCBzaG91bGQgYWx3YXlzIGJlIGVhZ2VyLlxuICAgIHJldHVybiBsVmlld1tIT1NUXTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHBhcmVudFROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCB7Y29tcG9uZW50T2Zmc2V0fSA9IHBhcmVudFROb2RlO1xuICAgIGlmIChjb21wb25lbnRPZmZzZXQgPiAtMSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgICAgIGNvbnN0IHtlbmNhcHN1bGF0aW9ufSA9XG4gICAgICAgICAgKHRWaWV3LmRhdGFbcGFyZW50VE5vZGUuZGlyZWN0aXZlU3RhcnQgKyBjb21wb25lbnRPZmZzZXRdIGFzIENvbXBvbmVudERlZjx1bmtub3duPik7XG4gICAgICAvLyBXZSd2ZSBnb3QgYSBwYXJlbnQgd2hpY2ggaXMgYW4gZWxlbWVudCBpbiB0aGUgY3VycmVudCB2aWV3LiBXZSBqdXN0IG5lZWQgdG8gdmVyaWZ5IGlmIHRoZVxuICAgICAgLy8gcGFyZW50IGVsZW1lbnQgaXMgbm90IGEgY29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAgICAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhlbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi4gTm90ZSB0aGF0IHdlIGNhbid0XG4gICAgICAvLyBtYWtlIHRoaXMgYXNzdW1wdGlvbiB3aGVuIHVzaW5nIHRoZSBTaGFkb3cgRE9NLCBiZWNhdXNlIHRoZSBuYXRpdmUgcHJvamVjdGlvbiBwbGFjZWhvbGRlcnNcbiAgICAgIC8vICg8Y29udGVudD4gb3IgPHNsb3Q+KSBoYXZlIHRvIGJlIGluIHBsYWNlIGFzIGVsZW1lbnRzIGFyZSBiZWluZyBpbnNlcnRlZC5cbiAgICAgIGlmIChlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lIHx8XG4gICAgICAgICAgZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSBuYXRpdmUgbm9kZSBiZWZvcmUgYW5vdGhlciBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBwYXJlbnQuXG4gKiBUaGlzIGlzIGEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHdoZW4gbmF0aXZlIG5vZGVzIHdlcmUgZGV0ZXJtaW5lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZUluc2VydEJlZm9yZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCxcbiAgICBpc01vdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckluc2VydEJlZm9yZSsrO1xuICByZW5kZXJlci5pbnNlcnRCZWZvcmUocGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSwgaXNNb3ZlKTtcbn1cblxuZnVuY3Rpb24gbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXI6IFJlbmRlcmVyLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFwcGVuZENoaWxkKys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudCwgJ3BhcmVudCBub2RlIG11c3QgYmUgZGVmaW5lZCcpO1xuICByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQsIGNoaWxkKTtcbn1cblxuZnVuY3Rpb24gbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwsIGlzTW92ZTogYm9vbGVhbikge1xuICBpZiAoYmVmb3JlTm9kZSAhPT0gbnVsbCkge1xuICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCBjaGlsZCwgYmVmb3JlTm9kZSwgaXNNb3ZlKTtcbiAgfSBlbHNlIHtcbiAgICBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlciwgcGFyZW50LCBjaGlsZCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgYSBub2RlIGZyb20gdGhlIERPTSBnaXZlbiBpdHMgbmF0aXZlIHBhcmVudC4gKi9cbmZ1bmN0aW9uIG5hdGl2ZVJlbW92ZUNoaWxkKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICByZW5kZXJlci5yZW1vdmVDaGlsZChwYXJlbnQsIGNoaWxkLCBpc0hvc3RFbGVtZW50KTtcbn1cblxuLyoqIENoZWNrcyBpZiBhbiBlbGVtZW50IGlzIGEgYDx0ZW1wbGF0ZT5gIG5vZGUuICovXG5mdW5jdGlvbiBpc1RlbXBsYXRlTm9kZShub2RlOiBSRWxlbWVudCk6IG5vZGUgaXMgUlRlbXBsYXRlIHtcbiAgcmV0dXJuIG5vZGUudGFnTmFtZSA9PT0gJ1RFTVBMQVRFJyAmJiAobm9kZSBhcyBSVGVtcGxhdGUpLmNvbnRlbnQgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHBhcmVudCBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIsIG5vZGU6IFJOb2RlKTogUkVsZW1lbnR8bnVsbCB7XG4gIHJldHVybiByZW5kZXJlci5wYXJlbnROb2RlKG5vZGUpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgc2libGluZyBvZiBhIGdpdmVuIG5hdGl2ZSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlTmV4dFNpYmxpbmcocmVuZGVyZXI6IFJlbmRlcmVyLCBub2RlOiBSTm9kZSk6IFJOb2RlfG51bGwge1xuICByZXR1cm4gcmVuZGVyZXIubmV4dFNpYmxpbmcobm9kZSk7XG59XG5cbi8qKlxuICogRmluZCBhIG5vZGUgaW4gZnJvbnQgb2Ygd2hpY2ggYGN1cnJlbnRUTm9kZWAgc2hvdWxkIGJlIGluc2VydGVkLlxuICpcbiAqIFRoaXMgbWV0aG9kIGRldGVybWluZXMgdGhlIGBSTm9kZWAgaW4gZnJvbnQgb2Ygd2hpY2ggd2Ugc2hvdWxkIGluc2VydCB0aGUgYGN1cnJlbnRSTm9kZWAuIFRoaXNcbiAqIHRha2VzIGBUTm9kZS5pbnNlcnRCZWZvcmVJbmRleGAgaW50byBhY2NvdW50IGlmIGkxOG4gY29kZSBoYXMgYmVlbiBpbnZva2VkLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRUTm9kZSBwYXJlbnQgYFROb2RlYFxuICogQHBhcmFtIGN1cnJlbnRUTm9kZSBjdXJyZW50IGBUTm9kZWAgKFRoZSBub2RlIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gaW5zZXJ0IGludG8gdGhlIERPTSlcbiAqIEBwYXJhbSBsVmlldyBjdXJyZW50IGBMVmlld2BcbiAqL1xuZnVuY3Rpb24gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGUocGFyZW50VE5vZGU6IFROb2RlLCBjdXJyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZXxcbiAgICBudWxsIHtcbiAgcmV0dXJuIF9nZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuKHBhcmVudFROb2RlLCBjdXJyZW50VE5vZGUsIGxWaWV3KTtcbn1cblxuXG4vKipcbiAqIEZpbmQgYSBub2RlIGluIGZyb250IG9mIHdoaWNoIGBjdXJyZW50VE5vZGVgIHNob3VsZCBiZSBpbnNlcnRlZC4gKERvZXMgbm90IHRha2UgaTE4biBpbnRvXG4gKiBhY2NvdW50KVxuICpcbiAqIFRoaXMgbWV0aG9kIGRldGVybWluZXMgdGhlIGBSTm9kZWAgaW4gZnJvbnQgb2Ygd2hpY2ggd2Ugc2hvdWxkIGluc2VydCB0aGUgYGN1cnJlbnRSTm9kZWAuIFRoaXNcbiAqIGRvZXMgbm90IHRha2UgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YCBpbnRvIGFjY291bnQuXG4gKlxuICogQHBhcmFtIHBhcmVudFROb2RlIHBhcmVudCBgVE5vZGVgXG4gKiBAcGFyYW0gY3VycmVudFROb2RlIGN1cnJlbnQgYFROb2RlYCAoVGhlIG5vZGUgd2hpY2ggd2Ugd291bGQgbGlrZSB0byBpbnNlcnQgaW50byB0aGUgRE9NKVxuICogQHBhcmFtIGxWaWV3IGN1cnJlbnQgYExWaWV3YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoTm9JMThuKFxuICAgIHBhcmVudFROb2RlOiBUTm9kZSwgY3VycmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGV8bnVsbCB7XG4gIGlmIChwYXJlbnRUTm9kZS50eXBlICYgKFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHwgVE5vZGVUeXBlLkljdSkpIHtcbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFRyZWUgc2hha2FibGUgYm91bmRhcnkgZm9yIGBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuYCBmdW5jdGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgb25seSBiZSBzZXQgaWYgaTE4biBjb2RlIHJ1bnMuXG4gKi9cbmxldCBfZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bjogKHBhcmVudFROb2RlOiBUTm9kZSwgY3VycmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PlxuICAgIFJOb2RlIHwgbnVsbCA9IGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aE5vSTE4bjtcblxuLyoqXG4gKiBUcmVlIHNoYWthYmxlIGJvdW5kYXJ5IGZvciBgcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmVgIGZ1bmN0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBvbmx5IGJlIHNldCBpZiBpMThuIGNvZGUgcnVucy5cbiAqL1xubGV0IF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZTogKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgY2hpbGRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgY2hpbGRSTm9kZTogUk5vZGV8Uk5vZGVbXSxcbiAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCkgPT4gdm9pZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldEkxOG5IYW5kbGluZyhcbiAgICBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuOiAocGFyZW50VE5vZGU6IFROb2RlLCBjdXJyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+XG4gICAgICAgIFJOb2RlIHwgbnVsbCxcbiAgICBwcm9jZXNzSTE4bkluc2VydEJlZm9yZTogKFxuICAgICAgICByZW5kZXJlcjogUmVuZGVyZXIsIGNoaWxkVE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGNoaWxkUk5vZGU6IFJOb2RlfFJOb2RlW10sXG4gICAgICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsKSA9PiB2b2lkKSB7XG4gIF9nZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bjtcbiAgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlID0gcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmU7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBuYXRpdmUgbm9kZSAob3IgYSBjb2xsZWN0aW9uIG9mIG5vZGVzKSB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIHRvIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBjaGlsZFJOb2RlIFRoZSBuYXRpdmUgY2hpbGQgKG9yIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY2hpbGRSTm9kZTogUk5vZGV8Uk5vZGVbXSwgY2hpbGRUTm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50Uk5vZGUgPSBnZXRQYXJlbnRSRWxlbWVudCh0VmlldywgY2hpbGRUTm9kZSwgbFZpZXcpO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgbFZpZXdbVF9IT1NUXSE7XG4gIGNvbnN0IGFuY2hvck5vZGUgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZShwYXJlbnRUTm9kZSwgY2hpbGRUTm9kZSwgbFZpZXcpO1xuICBpZiAocGFyZW50Uk5vZGUgIT0gbnVsbCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkUk5vZGUpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkUk5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCBjaGlsZFJOb2RlW2ldLCBhbmNob3JOb2RlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnRSTm9kZSwgY2hpbGRSTm9kZSwgYW5jaG9yTm9kZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBfcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmUocmVuZGVyZXIsIGNoaWxkVE5vZGUsIGxWaWV3LCBjaGlsZFJOb2RlLCBwYXJlbnRSTm9kZSk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gTFZpZXcsIHN0YXJ0aW5nIGZyb20gdGhlIHByb3ZpZGVkIFROb2RlLlxuICpcbiAqIE5hdGl2ZSBub2RlcyBhcmUgcmV0dXJuZWQgaW4gdGhlIG9yZGVyIGluIHdoaWNoIHRob3NlIGFwcGVhciBpbiB0aGUgbmF0aXZlIHRyZWUgKERPTSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCk6IFJOb2RlfG51bGwge1xuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0VE5vZGVUeXBlKFxuICAgICAgICAgICAgdE5vZGUsXG4gICAgICAgICAgICBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHwgVE5vZGVUeXBlLkljdSB8IFROb2RlVHlwZS5Qcm9qZWN0aW9uKTtcblxuICAgIGNvbnN0IHROb2RlVHlwZSA9IHROb2RlLnR5cGU7XG4gICAgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KTtcbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldygtMSwgbFZpZXdbdE5vZGUuaW5kZXhdKTtcbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbEljdUNvbnRhaW5lckNoaWxkID0gdE5vZGUuY2hpbGQ7XG4gICAgICBpZiAoZWxJY3VDb250YWluZXJDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3LCBlbEljdUNvbnRhaW5lckNoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJOb2RlT3JMQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgICBpZiAoaXNMQ29udGFpbmVyKHJOb2RlT3JMQ29udGFpbmVyKSkge1xuICAgICAgICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldygtMSwgck5vZGVPckxDb250YWluZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB1bndyYXBSTm9kZShyTm9kZU9yTENvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5JY3UpIHtcbiAgICAgIGxldCBuZXh0Uk5vZGUgPSBpY3VDb250YWluZXJJdGVyYXRlKHROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlLCBsVmlldyk7XG4gICAgICBsZXQgck5vZGU6IFJOb2RlfG51bGwgPSBuZXh0Uk5vZGUoKTtcbiAgICAgIC8vIElmIHRoZSBJQ1UgY29udGFpbmVyIGhhcyBubyBub2RlcywgdGhhbiB3ZSB1c2UgdGhlIElDVSBhbmNob3IgYXMgdGhlIG5vZGUuXG4gICAgICByZXR1cm4gck5vZGUgfHwgdW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJvamVjdGlvbk5vZGVzID0gZ2V0UHJvamVjdGlvbk5vZGVzKGxWaWV3LCB0Tm9kZSk7XG4gICAgICBpZiAocHJvamVjdGlvbk5vZGVzICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb2plY3Rpb25Ob2RlcykpIHtcbiAgICAgICAgICByZXR1cm4gcHJvamVjdGlvbk5vZGVzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRMVmlld1BhcmVudChsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10pO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UGFyZW50VmlldyhwYXJlbnRWaWV3KTtcbiAgICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShwYXJlbnRWaWV3ISwgcHJvamVjdGlvbk5vZGVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIHROb2RlLm5leHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdGlvbk5vZGVzKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlfG51bGwpOiBUTm9kZXxSTm9kZVtdfG51bGwge1xuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IHNsb3RJZHggPSB0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJvamVjdGlvblNsb3RzKGxWaWV3KTtcbiAgICByZXR1cm4gY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIVtzbG90SWR4XTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KHZpZXdJbmRleEluQ29udGFpbmVyOiBudW1iZXIsIGxDb250YWluZXI6IExDb250YWluZXIpOiBSTm9kZXxcbiAgICBudWxsIHtcbiAgY29uc3QgbmV4dFZpZXdJbmRleCA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgdmlld0luZGV4SW5Db250YWluZXIgKyAxO1xuICBpZiAobmV4dFZpZXdJbmRleCA8IGxDb250YWluZXIubGVuZ3RoKSB7XG4gICAgY29uc3QgbFZpZXcgPSBsQ29udGFpbmVyW25leHRWaWV3SW5kZXhdIGFzIExWaWV3O1xuICAgIGNvbnN0IGZpcnN0VE5vZGVPZlZpZXcgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICBpZiAoZmlyc3RUTm9kZU9mVmlldyAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgZmlyc3RUTm9kZU9mVmlldyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxDb250YWluZXJbTkFUSVZFXTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgbmF0aXZlIG5vZGUgaXRzZWxmIHVzaW5nIGEgZ2l2ZW4gcmVuZGVyZXIuIFRvIHJlbW92ZSB0aGUgbm9kZSB3ZSBhcmUgbG9va2luZyB1cCBpdHNcbiAqIHBhcmVudCBmcm9tIHRoZSBuYXRpdmUgdHJlZSBhcyBub3QgYWxsIHBsYXRmb3JtcyAvIGJyb3dzZXJzIHN1cHBvcnQgdGhlIGVxdWl2YWxlbnQgb2ZcbiAqIG5vZGUucmVtb3ZlKCkuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gYmUgdXNlZFxuICogQHBhcmFtIHJOb2RlIFRoZSBuYXRpdmUgbm9kZSB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG4gKiBAcGFyYW0gaXNIb3N0RWxlbWVudCBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIG5vZGUgdG8gYmUgcmVtb3ZlZCBpcyBhIGhvc3Qgb2YgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgck5vZGU6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xuICBjb25zdCBuYXRpdmVQYXJlbnQgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCByTm9kZSk7XG4gIGlmIChuYXRpdmVQYXJlbnQpIHtcbiAgICBuYXRpdmVSZW1vdmVDaGlsZChyZW5kZXJlciwgbmF0aXZlUGFyZW50LCByTm9kZSwgaXNIb3N0RWxlbWVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDbGVhcnMgdGhlIGNvbnRlbnRzIG9mIGEgZ2l2ZW4gUkVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHJFbGVtZW50IHRoZSBuYXRpdmUgUkVsZW1lbnQgdG8gYmUgY2xlYXJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJFbGVtZW50Q29udGVudHMockVsZW1lbnQ6IFJFbGVtZW50KTogdm9pZCB7XG4gIHJFbGVtZW50LnRleHRDb250ZW50ID0gJyc7XG59XG5cblxuLyoqXG4gKiBQZXJmb3JtcyB0aGUgb3BlcmF0aW9uIG9mIGBhY3Rpb25gIG9uIHRoZSBub2RlLiBUeXBpY2FsbHkgdGhpcyBpbnZvbHZlcyBpbnNlcnRpbmcgb3IgcmVtb3ZpbmdcbiAqIG5vZGVzIG9uIHRoZSBMVmlldyBvciBwcm9qZWN0aW9uIGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBhcHBseU5vZGVzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCB0Tm9kZTogVE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3LFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsLCBpc1Byb2plY3Rpb246IGJvb2xlYW4pIHtcbiAgd2hpbGUgKHROb2RlICE9IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgbFZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICB0Tm9kZSxcbiAgICAgICAgICAgIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuUHJvamVjdGlvbiB8IFROb2RlVHlwZS5JY3UpO1xuICAgIGNvbnN0IHJhd1Nsb3RWYWx1ZSA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmIChpc1Byb2plY3Rpb24pIHtcbiAgICAgIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlKSB7XG4gICAgICAgIHJhd1Nsb3RWYWx1ZSAmJiBhdHRhY2hQYXRjaERhdGEodW53cmFwUk5vZGUocmF3U2xvdFZhbHVlKSwgbFZpZXcpO1xuICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSAhPT0gVE5vZGVGbGFncy5pc0RldGFjaGVkKSB7XG4gICAgICBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB0Tm9kZS5jaGlsZCwgbFZpZXcsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlLCBmYWxzZSk7XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5JY3UpIHtcbiAgICAgICAgY29uc3QgbmV4dFJOb2RlID0gaWN1Q29udGFpbmVySXRlcmF0ZSh0Tm9kZSBhcyBUSWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgICAgICBsZXQgck5vZGU6IFJOb2RlfG51bGw7XG4gICAgICAgIHdoaWxlIChyTm9kZSA9IG5leHRSTm9kZSgpKSB7XG4gICAgICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgck5vZGUsIGJlZm9yZU5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICAgICAgICAgIHJlbmRlcmVyLCBhY3Rpb24sIGxWaWV3LCB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGUsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUodE5vZGUsIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByYXdTbG90VmFsdWUsIGJlZm9yZU5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICB0Tm9kZSA9IGlzUHJvamVjdGlvbiA/IHROb2RlLnByb2plY3Rpb25OZXh0IDogdE5vZGUubmV4dDtcbiAgfVxufVxuXG5cbi8qKlxuICogYGFwcGx5Vmlld2AgcGVyZm9ybXMgb3BlcmF0aW9uIG9uIHRoZSB2aWV3IGFzIHNwZWNpZmllZCBpbiBgYWN0aW9uYCAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgdmlldyB3aXRob3V0IHByb2plY3Rpb24gb3IgY29udGFpbmVycyBhdCB0b3AgbGV2ZWwgaXMgc2ltcGxlLiBKdXN0IGl0ZXJhdGUgb3ZlciB0aGVcbiAqIHJvb3Qgbm9kZXMgb2YgdGhlIFZpZXcsIGFuZCBmb3IgZWFjaCBub2RlIHBlcmZvcm0gdGhlIGBhY3Rpb25gLlxuICpcbiAqIFRoaW5ncyBnZXQgbW9yZSBjb21wbGljYXRlZCB3aXRoIGNvbnRhaW5lcnMgYW5kIHByb2plY3Rpb25zLiBUaGF0IGlzIGJlY2F1c2UgY29taW5nIGFjcm9zczpcbiAqIC0gQ29udGFpbmVyOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIHZpZXdzIG9mIHRoYXQgY29udGFpbmVyIGFzIHdlbGxcbiAqICAgICAgICAgICAgICB3aGljaCBpbiB0dXJuIGNhbiBoYXZlIHRoZWlyIG93biBDb250YWluZXJzIGF0IHRoZSBWaWV3IHJvb3RzLlxuICogLSBQcm9qZWN0aW9uOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIG5vZGVzIG9mIHRoZSBwcm9qZWN0aW9uLiBUaGVcbiAqICAgICAgICAgICAgICAgY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhlIG5vZGVzIHdlIGFyZSBwcm9qZWN0aW5nIGNhbiB0aGVtc2VsdmVzIGhhdmUgQ29udGFpbmVyc1xuICogICAgICAgICAgICAgICBvciBvdGhlciBQcm9qZWN0aW9ucy5cbiAqXG4gKiBBcyB5b3UgY2FuIHNlZSB0aGlzIGlzIGEgdmVyeSByZWN1cnNpdmUgcHJvYmxlbS4gWWVzIHJlY3Vyc2lvbiBpcyBub3QgbW9zdCBlZmZpY2llbnQgYnV0IHRoZVxuICogY29kZSBpcyBjb21wbGljYXRlZCBlbm91Z2ggdGhhdCB0cnlpbmcgdG8gaW1wbGVtZW50ZWQgd2l0aCByZWN1cnNpb24gYmVjb21lcyB1bm1haW50YWluYWJsZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbiAoUmVtb3ZhbCBkb2VzIG5vdCBuZWVkIGl0KS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSxcbiAgICBwYXJlbnRSRWxlbWVudDogbnVsbCwgYmVmb3JlTm9kZTogbnVsbCk6IHZvaWQ7XG5mdW5jdGlvbiBhcHBseVZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsKTogdm9pZDtcbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB0Vmlldy5maXJzdENoaWxkLCBsVmlldywgcGFyZW50UkVsZW1lbnQsIGJlZm9yZU5vZGUsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBgYXBwbHlQcm9qZWN0aW9uYCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHByb2plY3Rpb24uXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlld2Agb2YgYExWaWV3YCB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBub2RlIHRvIHByb2plY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UHJvamVjdGlvbih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdFByb2plY3Rpb25Ob2RlOiBUUHJvamVjdGlvbk5vZGUpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHBhcmVudFJOb2RlID0gZ2V0UGFyZW50UkVsZW1lbnQodFZpZXcsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICBjb25zdCBwYXJlbnRUTm9kZSA9IHRQcm9qZWN0aW9uTm9kZS5wYXJlbnQgfHwgbFZpZXdbVF9IT1NUXSE7XG4gIGxldCBiZWZvcmVOb2RlID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGUocGFyZW50VE5vZGUsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICBhcHBseVByb2plY3Rpb25SZWN1cnNpdmUoXG4gICAgICByZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUsIGxWaWV3LCB0UHJvamVjdGlvbk5vZGUsIHBhcmVudFJOb2RlLCBiZWZvcmVOb2RlKTtcbn1cblxuLyoqXG4gKiBgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlYCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHByb2plY3Rpb24gc3BlY2lmaWVkIGJ5IGBhY3Rpb25gIChpbnNlcnQsXG4gKiBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBub2RlIHRvIHByb2plY3RcbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCBsVmlldzogTFZpZXcsIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsKSB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50TFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodHlwZW9mIHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uLCAnbnVtYmVyJywgJ2V4cGVjdGluZyBwcm9qZWN0aW9uIGluZGV4Jyk7XG4gIGNvbnN0IG5vZGVUb1Byb2plY3RPclJOb2RlcyA9IGNvbXBvbmVudE5vZGUucHJvamVjdGlvbiFbdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb25dITtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZVRvUHJvamVjdE9yUk5vZGVzKSkge1xuICAgIC8vIFRoaXMgc2hvdWxkIG5vdCBleGlzdCwgaXQgaXMgYSBiaXQgb2YgYSBoYWNrLiBXaGVuIHdlIGJvb3RzdHJhcCBhIHRvcCBsZXZlbCBub2RlIGFuZCB3ZVxuICAgIC8vIG5lZWQgdG8gc3VwcG9ydCBwYXNzaW5nIHByb2plY3RhYmxlIG5vZGVzLCBzbyB3ZSBjaGVhdCBhbmQgcHV0IHRoZW0gaW4gdGhlIFROb2RlXG4gICAgLy8gb2YgdGhlIEhvc3QgVFZpZXcuIChZZXMgd2UgcHV0IGluc3RhbmNlIGluZm8gYXQgdGhlIFQgTGV2ZWwpLiBXZSBjYW4gZ2V0IGF3YXkgd2l0aCBpdFxuICAgIC8vIGJlY2F1c2Ugd2Uga25vdyB0aGF0IHRoYXQgVFZpZXcgaXMgbm90IHNoYXJlZCBhbmQgdGhlcmVmb3JlIGl0IHdpbGwgbm90IGJlIGEgcHJvYmxlbS5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSByZWZhY3RvcmVkIGFuZCBjbGVhbmVkIHVwLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZVRvUHJvamVjdE9yUk5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCByTm9kZSA9IG5vZGVUb1Byb2plY3RPclJOb2Rlc1tpXTtcbiAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJOb2RlLCBiZWZvcmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IG5vZGVUb1Byb2plY3Q6IFROb2RlfG51bGwgPSBub2RlVG9Qcm9qZWN0T3JSTm9kZXM7XG4gICAgY29uc3QgcHJvamVjdGVkQ29tcG9uZW50TFZpZXcgPSBjb21wb25lbnRMVmlld1tQQVJFTlRdIGFzIExWaWV3O1xuICAgIC8vIElmIGEgcGFyZW50IDxuZy1jb250ZW50PiBpcyBsb2NhdGVkIHdpdGhpbiBhIHNraXAgaHlkcmF0aW9uIGJsb2NrLFxuICAgIC8vIGFubm90YXRlIGFuIGFjdHVhbCBub2RlIHRoYXQgaXMgYmVpbmcgcHJvamVjdGVkIHdpdGggdGhlIHNhbWUgZmxhZyB0b28uXG4gICAgaWYgKGhhc0luU2tpcEh5ZHJhdGlvbkJsb2NrRmxhZyh0UHJvamVjdGlvbk5vZGUpKSB7XG4gICAgICBub2RlVG9Qcm9qZWN0LmZsYWdzIHw9IFROb2RlRmxhZ3MuaW5Ta2lwSHlkcmF0aW9uQmxvY2s7XG4gICAgfVxuICAgIGFwcGx5Tm9kZXMoXG4gICAgICAgIHJlbmRlcmVyLCBhY3Rpb24sIG5vZGVUb1Byb2plY3QsIHByb2plY3RlZENvbXBvbmVudExWaWV3LCBwYXJlbnRSRWxlbWVudCwgYmVmb3JlTm9kZSwgdHJ1ZSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIGBhcHBseUNvbnRhaW5lcmAgcGVyZm9ybXMgYW4gb3BlcmF0aW9uIG9uIHRoZSBjb250YWluZXIgYW5kIGl0cyB2aWV3cyBhcyBzcGVjaWZpZWQgYnlcbiAqIGBhY3Rpb25gIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqXG4gKiBJbnNlcnRpbmcgYSBDb250YWluZXIgaXMgY29tcGxpY2F0ZWQgYnkgdGhlIGZhY3QgdGhhdCB0aGUgY29udGFpbmVyIG1heSBoYXZlIFZpZXdzIHdoaWNoXG4gKiB0aGVtc2VsdmVzIGhhdmUgY29udGFpbmVycyBvciBwcm9qZWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBMQ29udGFpbmVyIHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHBhcmVudFJFbGVtZW50IHBhcmVudCBET00gZWxlbWVudCBmb3IgaW5zZXJ0aW9uL3JlbW92YWwuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBCZWZvcmUgd2hpY2ggbm9kZSB0aGUgaW5zZXJ0aW9ucyBzaG91bGQgaGFwcGVuLlxuICovXG5mdW5jdGlvbiBhcHBseUNvbnRhaW5lcihcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbHx1bmRlZmluZWQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG4gIGNvbnN0IGFuY2hvciA9IGxDb250YWluZXJbTkFUSVZFXTsgIC8vIExDb250YWluZXIgaGFzIGl0cyBvd24gYmVmb3JlIG5vZGUuXG4gIGNvbnN0IG5hdGl2ZSA9IHVud3JhcFJOb2RlKGxDb250YWluZXIpO1xuICAvLyBBbiBMQ29udGFpbmVyIGNhbiBiZSBjcmVhdGVkIGR5bmFtaWNhbGx5IG9uIGFueSBub2RlIGJ5IGluamVjdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICAvLyBBc2tpbmcgZm9yIGEgVmlld0NvbnRhaW5lclJlZiBvbiBhbiBlbGVtZW50IHdpbGwgcmVzdWx0IGluIGEgY3JlYXRpb24gb2YgYSBzZXBhcmF0ZSBhbmNob3JcbiAgLy8gbm9kZSAoY29tbWVudCBpbiB0aGUgRE9NKSB0aGF0IHdpbGwgYmUgZGlmZmVyZW50IGZyb20gdGhlIExDb250YWluZXIncyBob3N0IG5vZGUuIEluIHRoaXNcbiAgLy8gcGFydGljdWxhciBjYXNlIHdlIG5lZWQgdG8gZXhlY3V0ZSBhY3Rpb24gb24gMiBub2RlczpcbiAgLy8gLSBjb250YWluZXIncyBob3N0IG5vZGUgKHRoaXMgaXMgZG9uZSBpbiB0aGUgZXhlY3V0ZUFjdGlvbk9uRWxlbWVudE9yQ29udGFpbmVyKVxuICAvLyAtIGNvbnRhaW5lcidzIGhvc3Qgbm9kZSAodGhpcyBpcyBkb25lIGhlcmUpXG4gIGlmIChhbmNob3IgIT09IG5hdGl2ZSkge1xuICAgIC8vIFRoaXMgaXMgdmVyeSBzdHJhbmdlIHRvIG1lIChNaXNrbykuIEkgd291bGQgZXhwZWN0IHRoYXQgdGhlIG5hdGl2ZSBpcyBzYW1lIGFzIGFuY2hvci4gSVxuICAgIC8vIGRvbid0IHNlZSBhIHJlYXNvbiB3aHkgdGhleSBzaG91bGQgYmUgZGlmZmVyZW50LCBidXQgdGhleSBhcmUuXG4gICAgLy9cbiAgICAvLyBJZiB0aGV5IGFyZSB3ZSBuZWVkIHRvIHByb2Nlc3MgdGhlIHNlY29uZCBhbmNob3IgYXMgd2VsbC5cbiAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCBhbmNob3IsIGJlZm9yZU5vZGUpO1xuICB9XG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBsVmlldyA9IGxDb250YWluZXJbaV0gYXMgTFZpZXc7XG4gICAgYXBwbHlWaWV3KGxWaWV3W1RWSUVXXSwgbFZpZXcsIHJlbmRlcmVyLCBhY3Rpb24sIHBhcmVudFJFbGVtZW50LCBhbmNob3IpO1xuICB9XG59XG5cbi8qKlxuICogV3JpdGVzIGNsYXNzL3N0eWxlIHRvIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZS5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGl0IHNob3VsZCBiZSB3cml0dGVuIHRvIGBjbGFzc2AgKGBmYWxzZWAgdG8gd3JpdGUgdG8gYHN0eWxlYClcbiAqIEBwYXJhbSByTm9kZSBUaGUgTm9kZSB0byB3cml0ZSB0by5cbiAqIEBwYXJhbSBwcm9wIFByb3BlcnR5IHRvIHdyaXRlIHRvLiBUaGlzIHdvdWxkIGJlIHRoZSBjbGFzcy9zdHlsZSBuYW1lLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBJZiBgbnVsbGAvYHVuZGVmaW5lZGAvYGZhbHNlYCB0aGlzIGlzIGNvbnNpZGVyZWQgYSByZW1vdmUgKHNldC9hZGRcbiAqICAgICAgICBvdGhlcndpc2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCByTm9kZTogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgLy8gV2UgYWN0dWFsbHkgd2FudCBKUyB0cnVlL2ZhbHNlIGhlcmUgYmVjYXVzZSBhbnkgdHJ1dGh5IHZhbHVlIHNob3VsZCBhZGQgdGhlIGNsYXNzXG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICByZW5kZXJlci5yZW1vdmVDbGFzcyhyTm9kZSwgcHJvcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgcmVuZGVyZXIuYWRkQ2xhc3Mock5vZGUsIHByb3ApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgZmxhZ3MgPSBwcm9wLmluZGV4T2YoJy0nKSA9PT0gLTEgPyB1bmRlZmluZWQgOiBSZW5kZXJlclN0eWxlRmxhZ3MyLkRhc2hDYXNlIGFzIG51bWJlcjtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCAvKiogfHwgdmFsdWUgPT09IHVuZGVmaW5lZCAqLykge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShyTm9kZSwgcHJvcCwgZmxhZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBIHZhbHVlIGlzIGltcG9ydGFudCBpZiBpdCBlbmRzIHdpdGggYCFpbXBvcnRhbnRgLiBUaGUgc3R5bGVcbiAgICAgIC8vIHBhcnNlciBzdHJpcHMgYW55IHNlbWljb2xvbnMgYXQgdGhlIGVuZCBvZiB0aGUgdmFsdWUuXG4gICAgICBjb25zdCBpc0ltcG9ydGFudCA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZS5lbmRzV2l0aCgnIWltcG9ydGFudCcpIDogZmFsc2U7XG5cbiAgICAgIGlmIChpc0ltcG9ydGFudCkge1xuICAgICAgICAvLyAhaW1wb3J0YW50IGhhcyB0byBiZSBzdHJpcHBlZCBmcm9tIHRoZSB2YWx1ZSBmb3IgaXQgdG8gYmUgdmFsaWQuXG4gICAgICAgIHZhbHVlID0gdmFsdWUuc2xpY2UoMCwgLTEwKTtcbiAgICAgICAgZmxhZ3MhIHw9IFJlbmRlcmVyU3R5bGVGbGFnczIuSW1wb3J0YW50O1xuICAgICAgfVxuXG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgIHJlbmRlcmVyLnNldFN0eWxlKHJOb2RlLCBwcm9wLCB2YWx1ZSwgZmxhZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogV3JpdGUgYGNzc1RleHRgIHRvIGBSRWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBkb2VzIGRpcmVjdCB3cml0ZSB3aXRob3V0IGFueSByZWNvbmNpbGlhdGlvbi4gVXNlZCBmb3Igd3JpdGluZyBpbml0aWFsIHZhbHVlcywgc29cbiAqIHRoYXQgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGRvIG5vdCBwdWxsIGluIHRoZSBzdHlsZSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IGNsYXNzIGxpc3QgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURpcmVjdFN0eWxlKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIG5ld1ZhbHVlOiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyhuZXdWYWx1ZSwgJ1xcJ25ld1ZhbHVlXFwnIHNob3VsZCBiZSBhIHN0cmluZycpO1xuICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgJ3N0eWxlJywgbmV3VmFsdWUpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbn1cblxuLyoqXG4gKiBXcml0ZSBgY2xhc3NOYW1lYCB0byBgUkVsZW1lbnRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gZG9lcyBkaXJlY3Qgd3JpdGUgd2l0aG91dCBhbnkgcmVjb25jaWxpYXRpb24uIFVzZWQgZm9yIHdyaXRpbmcgaW5pdGlhbCB2YWx1ZXMsIHNvXG4gKiB0aGF0IHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBkbyBub3QgcHVsbCBpbiB0aGUgc3R5bGUgcGFyc2VyLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHdoaWNoIG5lZWRzIHRvIGJlIHVwZGF0ZWQuXG4gKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ldyBjbGFzcyBsaXN0IHRvIHdyaXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVEaXJlY3RDbGFzcyhyZW5kZXJlcjogUmVuZGVyZXIsIGVsZW1lbnQ6IFJFbGVtZW50LCBuZXdWYWx1ZTogc3RyaW5nKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRTdHJpbmcobmV3VmFsdWUsICdcXCduZXdWYWx1ZVxcJyBzaG91bGQgYmUgYSBzdHJpbmcnKTtcbiAgaWYgKG5ld1ZhbHVlID09PSAnJykge1xuICAgIC8vIFRoZXJlIGFyZSB0ZXN0cyBpbiBgZ29vZ2xlM2Agd2hpY2ggZXhwZWN0IGBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKWAgdG8gYmUgYG51bGxgLlxuICAgIHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50LCAnY2xhc3MnKTtcbiAgfSBlbHNlIHtcbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgJ2NsYXNzJywgbmV3VmFsdWUpO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRDbGFzc05hbWUrKztcbn1cblxuLyoqIFNldHMgdXAgdGhlIHN0YXRpYyBET00gYXR0cmlidXRlcyBvbiBhbiBgUk5vZGVgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHVwU3RhdGljQXR0cmlidXRlcyhyZW5kZXJlcjogUmVuZGVyZXIsIGVsZW1lbnQ6IFJFbGVtZW50LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qge21lcmdlZEF0dHJzLCBjbGFzc2VzLCBzdHlsZXN9ID0gdE5vZGU7XG5cbiAgaWYgKG1lcmdlZEF0dHJzICE9PSBudWxsKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKHJlbmRlcmVyLCBlbGVtZW50LCBtZXJnZWRBdHRycyk7XG4gIH1cblxuICBpZiAoY2xhc3NlcyAhPT0gbnVsbCkge1xuICAgIHdyaXRlRGlyZWN0Q2xhc3MocmVuZGVyZXIsIGVsZW1lbnQsIGNsYXNzZXMpO1xuICB9XG5cbiAgaWYgKHN0eWxlcyAhPT0gbnVsbCkge1xuICAgIHdyaXRlRGlyZWN0U3R5bGUocmVuZGVyZXIsIGVsZW1lbnQsIHN0eWxlcyk7XG4gIH1cbn1cbiJdfQ==