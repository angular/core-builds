/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerDestroy } from '@angular/core/primitives/signals';
import { hasInSkipHydrationBlockFlag } from '../hydration/skip_hydration';
import { ViewEncapsulation } from '../metadata/view';
import { RendererStyleFlags2 } from '../render/api_flags';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertFunction, assertNumber, assertString } from '../util/assert';
import { escapeCommentText } from '../util/dom';
import { assertLContainer, assertLView, assertParentView, assertProjectionSlots, assertTNodeForLView } from './assert';
import { attachPatchData } from './context_discovery';
import { icuContainerIterate } from './i18n/i18n_tree_shaking';
import { CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS, NATIVE } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unregisterLView } from './interfaces/lview_tracking';
import { isLContainer, isLView } from './interfaces/type_checks';
import { CHILD_HEAD, CLEANUP, DECLARATION_COMPONENT_VIEW, DECLARATION_LCONTAINER, FLAGS, HOST, NEXT, ON_DESTROY_HOOKS, PARENT, QUERIES, REACTIVE_TEMPLATE_CONSUMER, RENDERER, T_HOST, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { profiler } from './profiler';
import { setUpAttributes } from './util/attrs_utils';
import { getLViewParent, getNativeByTNode, unwrapRNode, updateAncestorTraversalFlagsOnAttach } from './util/view_utils';
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
export function removeViewFromDOM(tView, lView) {
    detachViewFromDOM(tView, lView);
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
export function addViewToDOM(tView, parentTNode, renderer, lView, parentNativeNode, beforeNode) {
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
export function detachViewFromDOM(tView, lView) {
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
    updateAncestorTraversalFlagsOnAttach(lView);
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
        declarationContainer[FLAGS] |= LContainerFlags.HasTransplantedViews;
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
    ngDevMode && assertLContainer(lView[PARENT]);
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
        removeViewFromDOM(viewToDetach[TVIEW], viewToDetach);
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
        lView[REACTIVE_TEMPLATE_CONSUMER] && consumerDestroy(lView[REACTIVE_TEMPLATE_CONSUMER]);
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
                    // Destroy anything whose teardown is a function call (e.g. QueryList, ModelSignal).
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
        // Reset the ON_DESTROY_HOOKS array before iterating over it to prevent hooks that unregister
        // themselves from mutating the array during iteration.
        lView[ON_DESTROY_HOOKS] = null;
        for (let i = 0; i < destroyHooks.length; i++) {
            const destroyHooksFn = destroyHooks[i];
            ngDevMode && assertFunction(destroyHooksFn, 'Expecting destroy hook to be a function.');
            destroyHooksFn();
        }
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
        // because we know that TView is not shared and therefore it will not be a problem.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUVqRSxPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEcsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRTlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckgsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzdELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxlQUFlLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRWpILE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUk1RCxPQUFPLEVBQUMsWUFBWSxFQUFF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TyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFDRCxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDaEQsQ0FBQztBQUVELHVEQUF1RDtBQUN2RCxNQUFNLFVBQVUscUJBQXFCLENBQUMsUUFBa0IsRUFBRSxPQUFpQixFQUFFLEtBQVk7SUFDdkYsTUFBTSxFQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFDLEdBQUcsS0FBSyxDQUFDO0lBRTdDLElBQUksV0FBVyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3pCLGVBQWUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNyQixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29uc3VtZXJEZXN0cm95fSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7aGFzSW5Ta2lwSHlkcmF0aW9uQmxvY2tGbGFnfSBmcm9tICcuLi9oeWRyYXRpb24vc2tpcF9oeWRyYXRpb24nO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge1JlbmRlcmVyU3R5bGVGbGFnczJ9IGZyb20gJy4uL3JlbmRlci9hcGlfZmxhZ3MnO1xuaW1wb3J0IHthZGRUb0FycmF5LCByZW1vdmVGcm9tQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0RnVuY3Rpb24sIGFzc2VydE51bWJlciwgYXNzZXJ0U3RyaW5nfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2VzY2FwZUNvbW1lbnRUZXh0fSBmcm9tICcuLi91dGlsL2RvbSc7XG5cbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFBhcmVudFZpZXcsIGFzc2VydFByb2plY3Rpb25TbG90cywgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtpY3VDb250YWluZXJJdGVyYXRlfSBmcm9tICcuL2kxOG4vaTE4bl90cmVlX3NoYWtpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTENvbnRhaW5lckZsYWdzLCBNT1ZFRF9WSUVXUywgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge3VucmVnaXN0ZXJMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL2x2aWV3X3RyYWNraW5nJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGVtcGxhdGUsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDTEVBTlVQLCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fTENPTlRBSU5FUiwgRGVzdHJveUhvb2tEYXRhLCBFTlZJUk9OTUVOVCwgRkxBR1MsIEhvb2tEYXRhLCBIb29rRm4sIEhPU1QsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBPTl9ERVNUUk9ZX0hPT0tTLCBQQVJFTlQsIFFVRVJJRVMsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSLCBSRU5ERVJFUiwgVF9IT1NULCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtwcm9maWxlciwgUHJvZmlsZXJFdmVudH0gZnJvbSAnLi9wcm9maWxlcic7XG5pbXBvcnQge3NldFVwQXR0cmlidXRlc30gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7Z2V0TFZpZXdQYXJlbnQsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlLCB1cGRhdGVBbmNlc3RvclRyYXZlcnNhbEZsYWdzT25BdHRhY2h9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgZW51bSBXYWxrVE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgY3JlYXRlIGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQuIFJ1biBvbiBpbml0aWFsIGNyZWF0aW9uLiAqL1xuICBDcmVhdGUgPSAwLFxuXG4gIC8qKlxuICAgKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50LlxuICAgKiBSdW4gd2hlbiBleGlzdGluZyBub2RlIGhhcyBiZWVuIGRldGFjaGVkIGFuZCBuZWVkcyB0byBiZSByZS1hdHRhY2hlZC5cbiAgICovXG4gIEluc2VydCA9IDEsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAyLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMyxcbn1cblxuXG5cbi8qKlxuICogTk9URTogZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBwb3NzaWJsZSBhY3Rpb25zIGFyZSBpbmxpbmVkIHdpdGhpbiB0aGUgZnVuY3Rpb24gaW5zdGVhZCBvZlxuICogYmVpbmcgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LlxuICovXG5mdW5jdGlvbiBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKFxuICAgIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgcmVuZGVyZXI6IFJlbmRlcmVyLCBwYXJlbnQ6IFJFbGVtZW50fG51bGwsXG4gICAgbE5vZGVUb0hhbmRsZTogUk5vZGV8TENvbnRhaW5lcnxMVmlldywgYmVmb3JlTm9kZT86IFJOb2RlfG51bGwpIHtcbiAgLy8gSWYgdGhpcyBzbG90IHdhcyBhbGxvY2F0ZWQgZm9yIGEgdGV4dCBub2RlIGR5bmFtaWNhbGx5IGNyZWF0ZWQgYnkgaTE4biwgdGhlIHRleHQgbm9kZSBpdHNlbGZcbiAgLy8gd29uJ3QgYmUgY3JlYXRlZCB1bnRpbCBpMThuQXBwbHkoKSBpbiB0aGUgdXBkYXRlIGJsb2NrLCBzbyB0aGlzIG5vZGUgc2hvdWxkIGJlIHNraXBwZWQuXG4gIC8vIEZvciBtb3JlIGluZm8sIHNlZSBcIklDVSBleHByZXNzaW9ucyBzaG91bGQgd29yayBpbnNpZGUgYW4gbmdUZW1wbGF0ZU91dGxldCBpbnNpZGUgYW4gbmdGb3JcIlxuICAvLyBpbiBgaTE4bl9zcGVjLnRzYC5cbiAgaWYgKGxOb2RlVG9IYW5kbGUgIT0gbnVsbCkge1xuICAgIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyfHVuZGVmaW5lZDtcbiAgICBsZXQgaXNDb21wb25lbnQgPSBmYWxzZTtcbiAgICAvLyBXZSBhcmUgZXhwZWN0aW5nIGFuIFJOb2RlLCBidXQgaW4gdGhlIGNhc2Ugb2YgYSBjb21wb25lbnQgb3IgTENvbnRhaW5lciB0aGUgYFJOb2RlYCBpc1xuICAgIC8vIHdyYXBwZWQgaW4gYW4gYXJyYXkgd2hpY2ggbmVlZHMgdG8gYmUgdW53cmFwcGVkLiBXZSBuZWVkIHRvIGtub3cgaWYgaXQgaXMgYSBjb21wb25lbnQgYW5kIGlmXG4gICAgLy8gaXQgaGFzIExDb250YWluZXIgc28gdGhhdCB3ZSBjYW4gcHJvY2VzcyBhbGwgb2YgdGhvc2UgY2FzZXMgYXBwcm9wcmlhdGVseS5cbiAgICBpZiAoaXNMQ29udGFpbmVyKGxOb2RlVG9IYW5kbGUpKSB7XG4gICAgICBsQ29udGFpbmVyID0gbE5vZGVUb0hhbmRsZTtcbiAgICB9IGVsc2UgaWYgKGlzTFZpZXcobE5vZGVUb0hhbmRsZSkpIHtcbiAgICAgIGlzQ29tcG9uZW50ID0gdHJ1ZTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxOb2RlVG9IYW5kbGVbSE9TVF0sICdIT1NUIG11c3QgYmUgZGVmaW5lZCBmb3IgYSBjb21wb25lbnQgTFZpZXcnKTtcbiAgICAgIGxOb2RlVG9IYW5kbGUgPSBsTm9kZVRvSGFuZGxlW0hPU1RdITtcbiAgICB9XG4gICAgY29uc3Qgck5vZGU6IFJOb2RlID0gdW53cmFwUk5vZGUobE5vZGVUb0hhbmRsZSk7XG5cbiAgICBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkNyZWF0ZSAmJiBwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgIGlmIChiZWZvcmVOb2RlID09IG51bGwpIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXIsIHBhcmVudCwgck5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlLCBiZWZvcmVOb2RlIHx8IG51bGwsIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCAmJiBwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXIsIHJOb2RlLCBpc0NvbXBvbmVudCk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3lOb2RlKys7XG4gICAgICByZW5kZXJlci5kZXN0cm95Tm9kZSEock5vZGUpO1xuICAgIH1cbiAgICBpZiAobENvbnRhaW5lciAhPSBudWxsKSB7XG4gICAgICBhcHBseUNvbnRhaW5lcihyZW5kZXJlciwgYWN0aW9uLCBsQ29udGFpbmVyLCBwYXJlbnQsIGJlZm9yZU5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyLCB2YWx1ZTogc3RyaW5nKTogUlRleHQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgcmV0dXJuIHJlbmRlcmVyLmNyZWF0ZVRleHQodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVGV4dE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyLCByTm9kZTogUlRleHQsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgcmVuZGVyZXIuc2V0VmFsdWUock5vZGUsIHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgdmFsdWU6IHN0cmluZyk6IFJDb21tZW50IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgcmV0dXJuIHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQoZXNjYXBlQ29tbWVudFRleHQodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmF0aXZlIGVsZW1lbnQgZnJvbSBhIHRhZyBuYW1lLCB1c2luZyBhIHJlbmRlcmVyLlxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBuYW1lc3BhY2UgT3B0aW9uYWwgbmFtZXNwYWNlIGZvciBlbGVtZW50LlxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5vZGUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBuYW1lOiBzdHJpbmcsIG5hbWVzcGFjZTogc3RyaW5nfG51bGwpOiBSRWxlbWVudCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gIHJldHVybiByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG59XG5cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3RnJvbURPTSh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBkZXRhY2hWaWV3RnJvbURPTSh0VmlldywgbFZpZXcpO1xuICBsVmlld1tIT1NUXSA9IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSBudWxsO1xufVxuXG4vKipcbiAqIEFkZHMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byBhZGQgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgb2YgdGhlIGBMVmlld2AgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIHBhcmVudFROb2RlIFRoZSBgVE5vZGVgIHdoZXJlIHRoZSBgTFZpZXdgIHNob3VsZCBiZSBhdHRhY2hlZCB0by5cbiAqIEBwYXJhbSByZW5kZXJlciBDdXJyZW50IHJlbmRlcmVyIHRvIHVzZSBmb3IgRE9NIG1hbmlwdWxhdGlvbnMuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIHBhcmVudE5hdGl2ZU5vZGUgVGhlIHBhcmVudCBgUkVsZW1lbnRgIHdoZXJlIGl0IHNob3VsZCBiZSBpbnNlcnRlZCBpbnRvLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFZpZXdUb0RPTShcbiAgICB0VmlldzogVFZpZXcsIHBhcmVudFROb2RlOiBUTm9kZSwgcmVuZGVyZXI6IFJlbmRlcmVyLCBsVmlldzogTFZpZXcsIHBhcmVudE5hdGl2ZU5vZGU6IFJFbGVtZW50LFxuICAgIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgbFZpZXdbSE9TVF0gPSBwYXJlbnROYXRpdmVOb2RlO1xuICBsVmlld1tUX0hPU1RdID0gcGFyZW50VE5vZGU7XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkluc2VydCwgcGFyZW50TmF0aXZlTm9kZSwgYmVmb3JlTm9kZSk7XG59XG5cblxuLyoqXG4gKiBEZXRhY2ggYSBgTFZpZXdgIGZyb20gdGhlIERPTSBieSBkZXRhY2hpbmcgaXRzIG5vZGVzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCB0byBiZSBkZXRhY2hlZFxuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHRvIGJlIGRldGFjaGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlld0Zyb21ET00odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgYXBwbHlWaWV3KHRWaWV3LCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbnVsbCwgbnVsbCk7XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGxldCBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3W0NISUxEX0hFQURdO1xuICBpZiAoIWxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3W1RWSUVXXSwgcm9vdFZpZXcpO1xuICB9XG5cbiAgd2hpbGUgKGxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3fExDb250YWluZXJ8bnVsbCA9IG51bGw7XG5cbiAgICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikpIHtcbiAgICAgIC8vIElmIExWaWV3LCB0cmF2ZXJzZSBkb3duIHRvIGNoaWxkLlxuICAgICAgbmV4dCA9IGxWaWV3T3JMQ29udGFpbmVyW0NISUxEX0hFQURdO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsVmlld09yTENvbnRhaW5lcik7XG4gICAgICAvLyBJZiBjb250YWluZXIsIHRyYXZlcnNlIGRvd24gdG8gaXRzIGZpcnN0IExWaWV3LlxuICAgICAgY29uc3QgZmlyc3RWaWV3OiBMVmlld3x1bmRlZmluZWQgPSBsVmlld09yTENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF07XG4gICAgICBpZiAoZmlyc3RWaWV3KSBuZXh0ID0gZmlyc3RWaWV3O1xuICAgIH1cblxuICAgIGlmICghbmV4dCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlIChsVmlld09yTENvbnRhaW5lciAmJiAhbFZpZXdPckxDb250YWluZXIhW05FWFRdICYmIGxWaWV3T3JMQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikpIHtcbiAgICAgICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lcltUVklFV10sIGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBsVmlld09yTENvbnRhaW5lciA9IGxWaWV3T3JMQ29udGFpbmVyW1BBUkVOVF07XG4gICAgICB9XG4gICAgICBpZiAobFZpZXdPckxDb250YWluZXIgPT09IG51bGwpIGxWaWV3T3JMQ29udGFpbmVyID0gcm9vdFZpZXc7XG4gICAgICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXJbVFZJRVddLCBsVmlld09yTENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXIgJiYgbFZpZXdPckxDb250YWluZXIhW05FWFRdO1xuICAgIH1cbiAgICBsVmlld09yTENvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGluc2VydFxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIGluZGV4IFdoaWNoIGluZGV4IGluIHRoZSBjb250YWluZXIgdG8gaW5zZXJ0IHRoZSBjaGlsZCB2aWV3IGludG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGxDb250YWluZXI6IExDb250YWluZXIsIGluZGV4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG4gIGNvbnN0IGluZGV4SW5Db250YWluZXIgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIGluZGV4O1xuICBjb25zdCBjb250YWluZXJMZW5ndGggPSBsQ29udGFpbmVyLmxlbmd0aDtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyIC0gMV1bTkVYVF0gPSBsVmlldztcbiAgfVxuICBpZiAoaW5kZXggPCBjb250YWluZXJMZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkge1xuICAgIGxWaWV3W05FWFRdID0gbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyXTtcbiAgICBhZGRUb0FycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgaW5kZXgsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICBsQ29udGFpbmVyLnB1c2gobFZpZXcpO1xuICAgIGxWaWV3W05FWFRdID0gbnVsbDtcbiAgfVxuXG4gIGxWaWV3W1BBUkVOVF0gPSBsQ29udGFpbmVyO1xuXG4gIC8vIHRyYWNrIHZpZXdzIHdoZXJlIGRlY2xhcmF0aW9uIGFuZCBpbnNlcnRpb24gcG9pbnRzIGFyZSBkaWZmZXJlbnRcbiAgY29uc3QgZGVjbGFyYXRpb25MQ29udGFpbmVyID0gbFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gIGlmIChkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IG51bGwgJiYgbENvbnRhaW5lciAhPT0gZGVjbGFyYXRpb25MQ29udGFpbmVyKSB7XG4gICAgdHJhY2tNb3ZlZFZpZXcoZGVjbGFyYXRpb25MQ29udGFpbmVyLCBsVmlldyk7XG4gIH1cblxuICAvLyBub3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChsUXVlcmllcyAhPT0gbnVsbCkge1xuICAgIGxRdWVyaWVzLmluc2VydFZpZXcodFZpZXcpO1xuICB9XG5cbiAgdXBkYXRlQW5jZXN0b3JUcmF2ZXJzYWxGbGFnc09uQXR0YWNoKGxWaWV3KTtcbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBUcmFjayB2aWV3cyBjcmVhdGVkIGZyb20gdGhlIGRlY2xhcmF0aW9uIGNvbnRhaW5lciAoVGVtcGxhdGVSZWYpIGFuZCBpbnNlcnRlZCBpbnRvIGFcbiAqIGRpZmZlcmVudCBMQ29udGFpbmVyLlxuICovXG5mdW5jdGlvbiB0cmFja01vdmVkVmlldyhkZWNsYXJhdGlvbkNvbnRhaW5lcjogTENvbnRhaW5lciwgbFZpZXc6IExWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3LCAnTFZpZXcgcmVxdWlyZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVjbGFyYXRpb25Db250YWluZXIpO1xuICBjb25zdCBtb3ZlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdO1xuICBjb25zdCBpbnNlcnRlZExDb250YWluZXIgPSBsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGluc2VydGVkTENvbnRhaW5lcik7XG4gIGNvbnN0IGluc2VydGVkQ29tcG9uZW50TFZpZXcgPSBpbnNlcnRlZExDb250YWluZXJbUEFSRU5UXSFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChpbnNlcnRlZENvbXBvbmVudExWaWV3LCAnTWlzc2luZyBpbnNlcnRlZENvbXBvbmVudExWaWV3Jyk7XG4gIGNvbnN0IGRlY2xhcmVkQ29tcG9uZW50TFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGRlY2xhcmVkQ29tcG9uZW50TFZpZXcsICdNaXNzaW5nIGRlY2xhcmVkQ29tcG9uZW50TFZpZXcnKTtcbiAgaWYgKGRlY2xhcmVkQ29tcG9uZW50TFZpZXcgIT09IGluc2VydGVkQ29tcG9uZW50TFZpZXcpIHtcbiAgICAvLyBBdCB0aGlzIHBvaW50IHRoZSBkZWNsYXJhdGlvbi1jb21wb25lbnQgaXMgbm90IHNhbWUgYXMgaW5zZXJ0aW9uLWNvbXBvbmVudDsgdGhpcyBtZWFucyB0aGF0XG4gICAgLy8gdGhpcyBpcyBhIHRyYW5zcGxhbnRlZCB2aWV3LiBNYXJrIHRoZSBkZWNsYXJlZCBsVmlldyBhcyBoYXZpbmcgdHJhbnNwbGFudGVkIHZpZXdzIHNvIHRoYXRcbiAgICAvLyB0aG9zZSB2aWV3cyBjYW4gcGFydGljaXBhdGUgaW4gQ0QuXG4gICAgZGVjbGFyYXRpb25Db250YWluZXJbRkxBR1NdIHw9IExDb250YWluZXJGbGFncy5IYXNUcmFuc3BsYW50ZWRWaWV3cztcbiAgfVxuICBpZiAobW92ZWRWaWV3cyA9PT0gbnVsbCkge1xuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSA9IFtsVmlld107XG4gIH0gZWxzZSB7XG4gICAgbW92ZWRWaWV3cy5wdXNoKGxWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10sXG4gICAgICAgICAgJ0EgcHJvamVjdGVkIHZpZXcgc2hvdWxkIGJlbG9uZyB0byBhIG5vbi1lbXB0eSBwcm9qZWN0ZWQgdmlld3MgY29sbGVjdGlvbicpO1xuICBjb25zdCBtb3ZlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdITtcbiAgY29uc3QgZGVjbGFyYXRpb25WaWV3SW5kZXggPSBtb3ZlZFZpZXdzLmluZGV4T2YobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsVmlld1tQQVJFTlRdKTtcbiAgbW92ZWRWaWV3cy5zcGxpY2UoZGVjbGFyYXRpb25WaWV3SW5kZXgsIDEpO1xufVxuXG4vKipcbiAqIERldGFjaGVzIGEgdmlldyBmcm9tIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgbWV0aG9kIHJlbW92ZXMgdGhlIHZpZXcgZnJvbSB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzLiBJdCBhbHNvXG4gKiByZW1vdmVzIHRoZSB2aWV3J3MgZWxlbWVudHMgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgZnJvbSB3aGljaCB0byBkZXRhY2ggYSB2aWV3XG4gKiBAcGFyYW0gcmVtb3ZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSB2aWV3IHRvIGRldGFjaFxuICogQHJldHVybnMgRGV0YWNoZWQgTFZpZXcgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld3x1bmRlZmluZWQge1xuICBpZiAobENvbnRhaW5lci5sZW5ndGggPD0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHJldHVybjtcblxuICBjb25zdCBpbmRleEluQ29udGFpbmVyID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyByZW1vdmVJbmRleDtcbiAgY29uc3Qgdmlld1RvRGV0YWNoID0gbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyXTtcblxuICBpZiAodmlld1RvRGV0YWNoKSB7XG4gICAgY29uc3QgZGVjbGFyYXRpb25MQ29udGFpbmVyID0gdmlld1RvRGV0YWNoW0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICAgIGlmIChkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IG51bGwgJiYgZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBsQ29udGFpbmVyKSB7XG4gICAgICBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25MQ29udGFpbmVyLCB2aWV3VG9EZXRhY2gpO1xuICAgIH1cblxuXG4gICAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgICAgbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyIC0gMV1bTkVYVF0gPSB2aWV3VG9EZXRhY2hbTkVYVF0gYXMgTFZpZXc7XG4gICAgfVxuICAgIGNvbnN0IHJlbW92ZWRMVmlldyA9IHJlbW92ZUZyb21BcnJheShsQ29udGFpbmVyLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHJlbW92ZUluZGV4KTtcbiAgICByZW1vdmVWaWV3RnJvbURPTSh2aWV3VG9EZXRhY2hbVFZJRVddLCB2aWV3VG9EZXRhY2gpO1xuXG4gICAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSB2aWV3IGhhcyBiZWVuIHJlbW92ZWRcbiAgICBjb25zdCBsUXVlcmllcyA9IHJlbW92ZWRMVmlld1tRVUVSSUVTXTtcbiAgICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcocmVtb3ZlZExWaWV3W1RWSUVXXSk7XG4gICAgfVxuXG4gICAgdmlld1RvRGV0YWNoW1BBUkVOVF0gPSBudWxsO1xuICAgIHZpZXdUb0RldGFjaFtORVhUXSA9IG51bGw7XG4gICAgLy8gVW5zZXRzIHRoZSBhdHRhY2hlZCBmbGFnXG4gICAgdmlld1RvRGV0YWNoW0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcbiAgfVxuICByZXR1cm4gdmlld1RvRGV0YWNoO1xufVxuXG4vKipcbiAqIEEgc3RhbmRhbG9uZSBmdW5jdGlvbiB3aGljaCBkZXN0cm95cyBhbiBMVmlldyxcbiAqIGNvbmR1Y3RpbmcgY2xlYW4gdXAgKGUuZy4gcmVtb3ZpbmcgbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCB0byBiZSBkZXN0cm95ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBiZSBkZXN0cm95ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95TFZpZXcodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKCEobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG5cbiAgICBpZiAocmVuZGVyZXIuZGVzdHJveU5vZGUpIHtcbiAgICAgIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIGRlc3Ryb3lWaWV3VHJlZShsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkRlc3Ryb3lzIGhvb2tzIGZvciBhbGwgZGlyZWN0aXZlcyBhbmQgcGlwZXMgaW4gYSBnaXZlbiB2aWV3IGFuZCB0aGVuIHJlbW92ZXMgYWxsXG4gKiBsaXN0ZW5lcnMuIExpc3RlbmVycyBhcmUgcmVtb3ZlZCBhcyB0aGUgbGFzdCBzdGVwIHNvIGV2ZW50cyBkZWxpdmVyZWQgaW4gdGhlIG9uRGVzdHJveXMgaG9va3NcbiAqIGNhbiBiZSBwcm9wYWdhdGVkIHRvIEBPdXRwdXQgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIGZvciB0aGUgYExWaWV3YCB0byBjbGVhbiB1cC5cbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgdG8gY2xlYW4gdXBcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcFZpZXcodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKCEobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpKSB7XG4gICAgLy8gVXN1YWxseSB0aGUgQXR0YWNoZWQgZmxhZyBpcyByZW1vdmVkIHdoZW4gdGhlIHZpZXcgaXMgZGV0YWNoZWQgZnJvbSBpdHMgcGFyZW50LCBob3dldmVyXG4gICAgLy8gaWYgaXQncyBhIHJvb3QgdmlldywgdGhlIGZsYWcgd29uJ3QgYmUgdW5zZXQgaGVuY2Ugd2h5IHdlJ3JlIGFsc28gcmVtb3Zpbmcgb24gZGVzdHJveS5cbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG5cbiAgICAvLyBNYXJrIHRoZSBMVmlldyBhcyBkZXN0cm95ZWQgKmJlZm9yZSogZXhlY3V0aW5nIHRoZSBvbkRlc3Ryb3kgaG9va3MuIEFuIG9uRGVzdHJveSBob29rXG4gICAgLy8gcnVucyBhcmJpdHJhcnkgdXNlciBjb2RlLCB3aGljaCBjb3VsZCBpbmNsdWRlIGl0cyBvd24gYHZpZXdSZWYuZGVzdHJveSgpYCAob3Igc2ltaWxhcikuIElmXG4gICAgLy8gV2UgZG9uJ3QgZmxhZyB0aGUgdmlldyBhcyBkZXN0cm95ZWQgYmVmb3JlIHRoZSBob29rcywgdGhpcyBjb3VsZCBsZWFkIHRvIGFuIGluZmluaXRlIGxvb3AuXG4gICAgLy8gVGhpcyBhbHNvIGFsaWducyB3aXRoIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yLiBJdCBhbHNvIG1lYW5zIHRoYXQgdGhlIG9uRGVzdHJveSBob29rIGlzXG4gICAgLy8gcmVhbGx5IG1vcmUgb2YgYW4gXCJhZnRlckRlc3Ryb3lcIiBob29rIGlmIHlvdSB0aGluayBhYm91dCBpdC5cbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EZXN0cm95ZWQ7XG5cbiAgICBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl0gJiYgY29uc3VtZXJEZXN0cm95KGxWaWV3W1JFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSXSk7XG5cbiAgICBleGVjdXRlT25EZXN0cm95cyh0VmlldywgbFZpZXcpO1xuICAgIHByb2Nlc3NDbGVhbnVwcyh0VmlldywgbFZpZXcpO1xuICAgIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhdCBjbGVhbiB1cCB0aW1lLlxuICAgIGlmIChsVmlld1tUVklFV10udHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckRlc3Ryb3krKztcbiAgICAgIGxWaWV3W1JFTkRFUkVSXS5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgY29uc3QgZGVjbGFyYXRpb25Db250YWluZXIgPSBsVmlld1tERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgICAvLyB3ZSBhcmUgZGVhbGluZyB3aXRoIGFuIGVtYmVkZGVkIHZpZXcgdGhhdCBpcyBzdGlsbCBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyXG4gICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSBudWxsICYmIGlzTENvbnRhaW5lcihsVmlld1tQQVJFTlRdKSkge1xuICAgICAgLy8gYW5kIHRoaXMgaXMgYSBwcm9qZWN0ZWQgdmlld1xuICAgICAgaWYgKGRlY2xhcmF0aW9uQ29udGFpbmVyICE9PSBsVmlld1tQQVJFTlRdKSB7XG4gICAgICAgIGRldGFjaE1vdmVkVmlldyhkZWNsYXJhdGlvbkNvbnRhaW5lciwgbFZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZW1iZWRkZWQgdmlld3Mgc3RpbGwgYXR0YWNoZWQgdG8gYSBjb250YWluZXI6IHJlbW92ZSBxdWVyeSByZXN1bHQgZnJvbSB0aGlzIHZpZXcuXG4gICAgICBjb25zdCBsUXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICAgICAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICAgIGxRdWVyaWVzLmRldGFjaFZpZXcodFZpZXcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVucmVnaXN0ZXIgdGhlIHZpZXcgb25jZSBldmVyeXRoaW5nIGVsc2UgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICB1bnJlZ2lzdGVyTFZpZXcobFZpZXcpO1xuICB9XG59XG5cbi8qKiBSZW1vdmVzIGxpc3RlbmVycyBhbmQgdW5zdWJzY3JpYmVzIGZyb20gb3V0cHV0IHN1YnNjcmlwdGlvbnMgKi9cbmZ1bmN0aW9uIHByb2Nlc3NDbGVhbnVwcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0Q2xlYW51cCA9IHRWaWV3LmNsZWFudXA7XG4gIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0hO1xuICBpZiAodENsZWFudXAgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgaWYgKHR5cGVvZiB0Q2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIG5hdGl2ZSBET00gbGlzdGVuZXIuIEl0IHdpbGwgb2NjdXB5IDQgZW50cmllcyBpbiB0aGUgVENsZWFudXAgYXJyYXkgKGhlbmNlIGkgKz1cbiAgICAgICAgLy8gMiBhdCB0aGUgZW5kIG9mIHRoaXMgYmxvY2spLlxuICAgICAgICBjb25zdCB0YXJnZXRJZHggPSB0Q2xlYW51cFtpICsgM107XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdW1iZXIodGFyZ2V0SWR4LCAnY2xlYW51cCB0YXJnZXQgbXVzdCBiZSBhIG51bWJlcicpO1xuICAgICAgICBpZiAodGFyZ2V0SWR4ID49IDApIHtcbiAgICAgICAgICAvLyBEZXN0cm95IGFueXRoaW5nIHdob3NlIHRlYXJkb3duIGlzIGEgZnVuY3Rpb24gY2FsbCAoZS5nLiBRdWVyeUxpc3QsIE1vZGVsU2lnbmFsKS5cbiAgICAgICAgICBsQ2xlYW51cFt0YXJnZXRJZHhdKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU3Vic2NyaXB0aW9uXG4gICAgICAgICAgbENsZWFudXBbLXRhcmdldElkeF0udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY2xlYW51cCBmdW5jdGlvbiB0aGF0IGlzIGdyb3VwZWQgd2l0aCB0aGUgaW5kZXggb2YgaXRzIGNvbnRleHRcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxDbGVhbnVwW3RDbGVhbnVwW2kgKyAxXV07XG4gICAgICAgIHRDbGVhbnVwW2ldLmNhbGwoY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChsQ2xlYW51cCAhPT0gbnVsbCkge1xuICAgIGxWaWV3W0NMRUFOVVBdID0gbnVsbDtcbiAgfVxuICBjb25zdCBkZXN0cm95SG9va3MgPSBsVmlld1tPTl9ERVNUUk9ZX0hPT0tTXTtcbiAgaWYgKGRlc3Ryb3lIb29rcyAhPT0gbnVsbCkge1xuICAgIC8vIFJlc2V0IHRoZSBPTl9ERVNUUk9ZX0hPT0tTIGFycmF5IGJlZm9yZSBpdGVyYXRpbmcgb3ZlciBpdCB0byBwcmV2ZW50IGhvb2tzIHRoYXQgdW5yZWdpc3RlclxuICAgIC8vIHRoZW1zZWx2ZXMgZnJvbSBtdXRhdGluZyB0aGUgYXJyYXkgZHVyaW5nIGl0ZXJhdGlvbi5cbiAgICBsVmlld1tPTl9ERVNUUk9ZX0hPT0tTXSA9IG51bGw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXN0cm95SG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlc3Ryb3lIb29rc0ZuID0gZGVzdHJveUhvb2tzW2ldO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEZ1bmN0aW9uKGRlc3Ryb3lIb29rc0ZuLCAnRXhwZWN0aW5nIGRlc3Ryb3kgaG9vayB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgICAgZGVzdHJveUhvb2tzRm4oKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBsZXQgZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGF8bnVsbDtcblxuICBpZiAodFZpZXcgIT0gbnVsbCAmJiAoZGVzdHJveUhvb2tzID0gdFZpZXcuZGVzdHJveUhvb2tzKSAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXN0cm95SG9va3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld1tkZXN0cm95SG9va3NbaV0gYXMgbnVtYmVyXTtcblxuICAgICAgLy8gT25seSBjYWxsIHRoZSBkZXN0cm95IGhvb2sgaWYgdGhlIGNvbnRleHQgaGFzIGJlZW4gcmVxdWVzdGVkLlxuICAgICAgaWYgKCEoY29udGV4dCBpbnN0YW5jZW9mIE5vZGVJbmplY3RvckZhY3RvcnkpKSB7XG4gICAgICAgIGNvbnN0IHRvQ2FsbCA9IGRlc3Ryb3lIb29rc1tpICsgMV0gYXMgSG9va0ZuIHwgSG9va0RhdGE7XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodG9DYWxsKSkge1xuICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG9DYWxsLmxlbmd0aDsgaiArPSAyKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsQ29udGV4dCA9IGNvbnRleHRbdG9DYWxsW2pdIGFzIG51bWJlcl07XG4gICAgICAgICAgICBjb25zdCBob29rID0gdG9DYWxsW2ogKyAxXSBhcyBIb29rRm47XG4gICAgICAgICAgICBwcm9maWxlcihQcm9maWxlckV2ZW50LkxpZmVjeWNsZUhvb2tTdGFydCwgY2FsbENvbnRleHQsIGhvb2spO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaG9vay5jYWxsKGNhbGxDb250ZXh0KTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuTGlmZWN5Y2xlSG9va0VuZCwgY2FsbENvbnRleHQsIGhvb2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9maWxlcihQcm9maWxlckV2ZW50LkxpZmVjeWNsZUhvb2tTdGFydCwgY29udGV4dCwgdG9DYWxsKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdG9DYWxsLmNhbGwoY29udGV4dCk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuTGlmZWN5Y2xlSG9va0VuZCwgY29udGV4dCwgdG9DYWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIGVsZW1lbnQgaWYgYSBub2RlIGNhbiBiZSBpbnNlcnRlZCBpbnRvIHRoZSBnaXZlbiBwYXJlbnQuXG4gKlxuICogVGhlcmUgYXJlIHR3byByZWFzb25zIHdoeSB3ZSBtYXkgbm90IGJlIGFibGUgdG8gaW5zZXJ0IGEgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAqIC0gUHJvamVjdGlvbjogV2hlbiBjcmVhdGluZyBhIGNoaWxkIGNvbnRlbnQgZWxlbWVudCBvZiBhIGNvbXBvbmVudCwgd2UgaGF2ZSB0byBza2lwIHRoZVxuICogICBpbnNlcnRpb24gYmVjYXVzZSB0aGUgY29udGVudCBvZiBhIGNvbXBvbmVudCB3aWxsIGJlIHByb2plY3RlZC5cbiAqICAgYDxjb21wb25lbnQ+PGNvbnRlbnQ+ZGVsYXllZCBkdWUgdG8gcHJvamVjdGlvbjwvY29udGVudD48L2NvbXBvbmVudD5gXG4gKiAtIFBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkOiBUaGlzIGNhbiBoYXBwZW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGEgdmlldyBpbnRvXG4gKiAgIHBhcmVudCBjb250YWluZXIsIHdoaWNoIGl0c2VsZiBpcyBkaXNjb25uZWN0ZWQuIEZvciBleGFtcGxlIHRoZSBwYXJlbnQgY29udGFpbmVyIGlzIHBhcnRcbiAqICAgb2YgYSBWaWV3IHdoaWNoIGhhcyBub3QgYmUgaW5zZXJ0ZWQgb3IgaXMgbWFkZSBmb3IgcHJvamVjdGlvbiBidXQgaGFzIG5vdCBiZWVuIGluc2VydGVkXG4gKiAgIGludG8gZGVzdGluYXRpb24uXG4gKlxuICogQHBhcmFtIHRWaWV3OiBDdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gdE5vZGU6IGBUTm9kZWAgZm9yIHdoaWNoIHdlIHdpc2ggdG8gcmV0cmlldmUgcmVuZGVyIHBhcmVudC5cbiAqIEBwYXJhbSBsVmlldzogQ3VycmVudCBgTFZpZXdgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50UkVsZW1lbnQodFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICByZXR1cm4gZ2V0Q2xvc2VzdFJFbGVtZW50KHRWaWV3LCB0Tm9kZS5wYXJlbnQsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBHZXQgY2xvc2VzdCBgUkVsZW1lbnRgIG9yIGBudWxsYCBpZiBpdCBjYW4ndCBiZSBmb3VuZC5cbiAqXG4gKiBJZiBgVE5vZGVgIGlzIGBUTm9kZVR5cGUuRWxlbWVudGAgPT4gcmV0dXJuIGBSRWxlbWVudGAgYXQgYExWaWV3W3ROb2RlLmluZGV4XWAgbG9jYXRpb24uXG4gKiBJZiBgVE5vZGVgIGlzIGBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcnxJY3VDb250YWluYCA9PiByZXR1cm4gdGhlIHBhcmVudCAocmVjdXJzaXZlbHkpLlxuICogSWYgYFROb2RlYCBpcyBgbnVsbGAgdGhlbiByZXR1cm4gaG9zdCBgUkVsZW1lbnRgOlxuICogICAtIHJldHVybiBgbnVsbGAgaWYgcHJvamVjdGlvblxuICogICAtIHJldHVybiBgbnVsbGAgaWYgcGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQgKHdlIGhhdmUgbm8gcGFyZW50LilcbiAqXG4gKiBAcGFyYW0gdFZpZXc6IEN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0Tm9kZTogYFROb2RlYCBmb3Igd2hpY2ggd2Ugd2lzaCB0byByZXRyaWV2ZSBgUkVsZW1lbnRgIChvciBgbnVsbGAgaWYgaG9zdCBlbGVtZW50IGlzXG4gKiAgICAgbmVlZGVkKS5cbiAqIEBwYXJhbSBsVmlldzogQ3VycmVudCBgTFZpZXdgLlxuICogQHJldHVybnMgYG51bGxgIGlmIHRoZSBgUkVsZW1lbnRgIGNhbid0IGJlIGRldGVybWluZWQgYXQgdGhpcyB0aW1lIChubyBwYXJlbnQgLyBwcm9qZWN0aW9uKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xvc2VzdFJFbGVtZW50KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlfG51bGwsIGxWaWV3OiBMVmlldyk6IFJFbGVtZW50fG51bGwge1xuICBsZXQgcGFyZW50VE5vZGU6IFROb2RlfG51bGwgPSB0Tm9kZTtcbiAgLy8gU2tpcCBvdmVyIGVsZW1lbnQgYW5kIElDVSBjb250YWluZXJzIGFzIHRob3NlIGFyZSByZXByZXNlbnRlZCBieSBhIGNvbW1lbnQgbm9kZSBhbmRcbiAgLy8gY2FuJ3QgYmUgdXNlZCBhcyBhIHJlbmRlciBwYXJlbnQuXG4gIHdoaWxlIChwYXJlbnRUTm9kZSAhPT0gbnVsbCAmJlxuICAgICAgICAgKHBhcmVudFROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfCBUTm9kZVR5cGUuSWN1KSkpIHtcbiAgICB0Tm9kZSA9IHBhcmVudFROb2RlO1xuICAgIHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBhcmVudCB0Tm9kZSBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzOiBlaXRoZXIgaW50byBhbiBlbWJlZGRlZCB2aWV3XG4gIC8vIG9yIGEgY29tcG9uZW50IHZpZXcuXG4gIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYW5kXG4gICAgLy8gaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICByZXR1cm4gbFZpZXdbSE9TVF07XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShwYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3Qge2NvbXBvbmVudE9mZnNldH0gPSBwYXJlbnRUTm9kZTtcbiAgICBpZiAoY29tcG9uZW50T2Zmc2V0ID4gLTEpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHBhcmVudFROb2RlLCBsVmlldyk7XG4gICAgICBjb25zdCB7ZW5jYXBzdWxhdGlvbn0gPVxuICAgICAgICAgICh0Vmlldy5kYXRhW3BhcmVudFROb2RlLmRpcmVjdGl2ZVN0YXJ0ICsgY29tcG9uZW50T2Zmc2V0XSBhcyBDb21wb25lbnREZWY8dW5rbm93bj4pO1xuICAgICAgLy8gV2UndmUgZ290IGEgcGFyZW50IHdoaWNoIGlzIGFuIGVsZW1lbnQgaW4gdGhlIGN1cnJlbnQgdmlldy4gV2UganVzdCBuZWVkIHRvIHZlcmlmeSBpZiB0aGVcbiAgICAgIC8vIHBhcmVudCBlbGVtZW50IGlzIG5vdCBhIGNvbXBvbmVudC4gQ29tcG9uZW50J3MgY29udGVudCBub2RlcyBhcmUgbm90IGluc2VydGVkIGltbWVkaWF0ZWx5XG4gICAgICAvLyBiZWNhdXNlIHRoZXkgd2lsbCBiZSBwcm9qZWN0ZWQsIGFuZCBzbyBkb2luZyBpbnNlcnQgYXQgdGhpcyBwb2ludCB3b3VsZCBiZSB3YXN0ZWZ1bC5cbiAgICAgIC8vIFNpbmNlIHRoZSBwcm9qZWN0aW9uIHdvdWxkIHRoZW4gbW92ZSBpdCB0byBpdHMgZmluYWwgZGVzdGluYXRpb24uIE5vdGUgdGhhdCB3ZSBjYW4ndFxuICAgICAgLy8gbWFrZSB0aGlzIGFzc3VtcHRpb24gd2hlbiB1c2luZyB0aGUgU2hhZG93IERPTSwgYmVjYXVzZSB0aGUgbmF0aXZlIHByb2plY3Rpb24gcGxhY2Vob2xkZXJzXG4gICAgICAvLyAoPGNvbnRlbnQ+IG9yIDxzbG90PikgaGF2ZSB0byBiZSBpbiBwbGFjZSBhcyBlbGVtZW50cyBhcmUgYmVpbmcgaW5zZXJ0ZWQuXG4gICAgICBpZiAoZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uTm9uZSB8fFxuICAgICAgICAgIGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLkVtdWxhdGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwsXG4gICAgaXNNb3ZlOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJJbnNlcnRCZWZvcmUrKztcbiAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUsIGlzTW92ZSk7XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyOiBSZW5kZXJlciwgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBcHBlbmRDaGlsZCsrO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwYXJlbnQsICdwYXJlbnQgbm9kZSBtdXN0IGJlIGRlZmluZWQnKTtcbiAgcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50LCBjaGlsZCk7XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsLCBpc01vdmU6IGJvb2xlYW4pIHtcbiAgaWYgKGJlZm9yZU5vZGUgIT09IG51bGwpIHtcbiAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQsIGJlZm9yZU5vZGUsIGlzTW92ZSk7XG4gIH0gZWxzZSB7XG4gICAgbmF0aXZlQXBwZW5kQ2hpbGQocmVuZGVyZXIsIHBhcmVudCwgY2hpbGQpO1xuICB9XG59XG5cbi8qKiBSZW1vdmVzIGEgbm9kZSBmcm9tIHRoZSBET00gZ2l2ZW4gaXRzIG5hdGl2ZSBwYXJlbnQuICovXG5mdW5jdGlvbiBuYXRpdmVSZW1vdmVDaGlsZChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50LCBjaGlsZCwgaXNIb3N0RWxlbWVudCk7XG59XG5cbi8qKiBDaGVja3MgaWYgYW4gZWxlbWVudCBpcyBhIGA8dGVtcGxhdGU+YCBub2RlLiAqL1xuZnVuY3Rpb24gaXNUZW1wbGF0ZU5vZGUobm9kZTogUkVsZW1lbnQpOiBub2RlIGlzIFJUZW1wbGF0ZSB7XG4gIHJldHVybiBub2RlLnRhZ05hbWUgPT09ICdURU1QTEFURScgJiYgKG5vZGUgYXMgUlRlbXBsYXRlKS5jb250ZW50ICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBwYXJlbnQgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyLCBub2RlOiBSTm9kZSk6IFJFbGVtZW50fG51bGwge1xuICByZXR1cm4gcmVuZGVyZXIucGFyZW50Tm9kZShub2RlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHNpYmxpbmcgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyOiBSZW5kZXJlciwgbm9kZTogUk5vZGUpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIHJlbmRlcmVyLm5leHRTaWJsaW5nKG5vZGUpO1xufVxuXG4vKipcbiAqIEZpbmQgYSBub2RlIGluIGZyb250IG9mIHdoaWNoIGBjdXJyZW50VE5vZGVgIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBkZXRlcm1pbmVzIHRoZSBgUk5vZGVgIGluIGZyb250IG9mIHdoaWNoIHdlIHNob3VsZCBpbnNlcnQgdGhlIGBjdXJyZW50Uk5vZGVgLiBUaGlzXG4gKiB0YWtlcyBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgIGludG8gYWNjb3VudCBpZiBpMThuIGNvZGUgaGFzIGJlZW4gaW52b2tlZC5cbiAqXG4gKiBAcGFyYW0gcGFyZW50VE5vZGUgcGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSBjdXJyZW50VE5vZGUgY3VycmVudCBgVE5vZGVgIChUaGUgbm9kZSB3aGljaCB3ZSB3b3VsZCBsaWtlIHRvIGluc2VydCBpbnRvIHRoZSBET00pXG4gKiBAcGFyYW0gbFZpZXcgY3VycmVudCBgTFZpZXdgXG4gKi9cbmZ1bmN0aW9uIGdldEluc2VydEluRnJvbnRPZlJOb2RlKHBhcmVudFROb2RlOiBUTm9kZSwgY3VycmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUk5vZGV8XG4gICAgbnVsbCB7XG4gIHJldHVybiBfZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bihwYXJlbnRUTm9kZSwgY3VycmVudFROb2RlLCBsVmlldyk7XG59XG5cblxuLyoqXG4gKiBGaW5kIGEgbm9kZSBpbiBmcm9udCBvZiB3aGljaCBgY3VycmVudFROb2RlYCBzaG91bGQgYmUgaW5zZXJ0ZWQuIChEb2VzIG5vdCB0YWtlIGkxOG4gaW50b1xuICogYWNjb3VudClcbiAqXG4gKiBUaGlzIG1ldGhvZCBkZXRlcm1pbmVzIHRoZSBgUk5vZGVgIGluIGZyb250IG9mIHdoaWNoIHdlIHNob3VsZCBpbnNlcnQgdGhlIGBjdXJyZW50Uk5vZGVgLiBUaGlzXG4gKiBkb2VzIG5vdCB0YWtlIGBUTm9kZS5pbnNlcnRCZWZvcmVJbmRleGAgaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBwYXJlbnRUTm9kZSBwYXJlbnQgYFROb2RlYFxuICogQHBhcmFtIGN1cnJlbnRUTm9kZSBjdXJyZW50IGBUTm9kZWAgKFRoZSBub2RlIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gaW5zZXJ0IGludG8gdGhlIERPTSlcbiAqIEBwYXJhbSBsVmlldyBjdXJyZW50IGBMVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aE5vSTE4bihcbiAgICBwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfG51bGwge1xuICBpZiAocGFyZW50VE5vZGUudHlwZSAmIChUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8IFROb2RlVHlwZS5JY3UpKSB7XG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBUcmVlIHNoYWthYmxlIGJvdW5kYXJ5IGZvciBgZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bmAgZnVuY3Rpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG9ubHkgYmUgc2V0IGlmIGkxOG4gY29kZSBydW5zLlxuICovXG5sZXQgX2dldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG46IChwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT5cbiAgICBSTm9kZSB8IG51bGwgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhOb0kxOG47XG5cbi8qKlxuICogVHJlZSBzaGFrYWJsZSBib3VuZGFyeSBmb3IgYHByb2Nlc3NJMThuSW5zZXJ0QmVmb3JlYCBmdW5jdGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgb25seSBiZSBzZXQgaWYgaTE4biBjb2RlIHJ1bnMuXG4gKi9cbmxldCBfcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmU6IChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGNoaWxkVE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGNoaWxkUk5vZGU6IFJOb2RlfFJOb2RlW10sXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwpID0+IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJMThuSGFuZGxpbmcoXG4gICAgZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bjogKHBhcmVudFROb2RlOiBUTm9kZSwgY3VycmVudFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PlxuICAgICAgICBSTm9kZSB8IG51bGwsXG4gICAgcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmU6IChcbiAgICAgICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBjaGlsZFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBjaGlsZFJOb2RlOiBSTm9kZXxSTm9kZVtdLFxuICAgICAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCkgPT4gdm9pZCkge1xuICBfZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4biA9IGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG47XG4gIF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZSA9IHByb2Nlc3NJMThuSW5zZXJ0QmVmb3JlO1xufVxuXG4vKipcbiAqIEFwcGVuZHMgdGhlIGBjaGlsZGAgbmF0aXZlIG5vZGUgKG9yIGEgY29sbGVjdGlvbiBvZiBub2RlcykgdG8gdGhlIGBwYXJlbnRgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyB0byBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGxWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcGFyYW0gY2hpbGRSTm9kZSBUaGUgbmF0aXZlIGNoaWxkIChvciBjaGlsZHJlbikgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBjaGlsZFROb2RlIFRoZSBUTm9kZSBvZiB0aGUgY2hpbGQgZWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNoaWxkUk5vZGU6IFJOb2RlfFJOb2RlW10sIGNoaWxkVE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGNvbnN0IHBhcmVudFJOb2RlID0gZ2V0UGFyZW50UkVsZW1lbnQodFZpZXcsIGNoaWxkVE5vZGUsIGxWaWV3KTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHBhcmVudFROb2RlOiBUTm9kZSA9IGNoaWxkVE5vZGUucGFyZW50IHx8IGxWaWV3W1RfSE9TVF0hO1xuICBjb25zdCBhbmNob3JOb2RlID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGUocGFyZW50VE5vZGUsIGNoaWxkVE5vZGUsIGxWaWV3KTtcbiAgaWYgKHBhcmVudFJOb2RlICE9IG51bGwpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZFJOb2RlKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZFJOb2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnRSTm9kZSwgY2hpbGRSTm9kZVtpXSwgYW5jaG9yTm9kZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50Uk5vZGUsIGNoaWxkUk5vZGUsIGFuY2hvck5vZGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBfcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBjaGlsZFROb2RlLCBsVmlldywgY2hpbGRSTm9kZSwgcGFyZW50Uk5vZGUpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIExWaWV3LCBzdGFydGluZyBmcm9tIHRoZSBwcm92aWRlZCBUTm9kZS5cbiAqXG4gKiBOYXRpdmUgbm9kZXMgYXJlIHJldHVybmVkIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aG9zZSBhcHBlYXIgaW4gdGhlIG5hdGl2ZSB0cmVlIChET00pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlfG51bGwpOiBSTm9kZXxudWxsIHtcbiAgaWYgKHROb2RlICE9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgICAgIHROb2RlLFxuICAgICAgICAgICAgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lciB8IFROb2RlVHlwZS5JY3UgfCBUTm9kZVR5cGUuUHJvamVjdGlvbik7XG5cbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpIHtcbiAgICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldyk7XG4gICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICByZXR1cm4gZ2V0QmVmb3JlTm9kZUZvclZpZXcoLTEsIGxWaWV3W3ROb2RlLmluZGV4XSk7XG4gICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgY29uc3QgZWxJY3VDb250YWluZXJDaGlsZCA9IHROb2RlLmNoaWxkO1xuICAgICAgaWYgKGVsSWN1Q29udGFpbmVyQ2hpbGQgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgZWxJY3VDb250YWluZXJDaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCByTm9kZU9yTENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICAgICAgaWYgKGlzTENvbnRhaW5lcihyTm9kZU9yTENvbnRhaW5lcikpIHtcbiAgICAgICAgICByZXR1cm4gZ2V0QmVmb3JlTm9kZUZvclZpZXcoLTEsIHJOb2RlT3JMQ29udGFpbmVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdW53cmFwUk5vZGUock5vZGVPckxDb250YWluZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuSWN1KSB7XG4gICAgICBsZXQgbmV4dFJOb2RlID0gaWN1Q29udGFpbmVySXRlcmF0ZSh0Tm9kZSBhcyBUSWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgICAgbGV0IHJOb2RlOiBSTm9kZXxudWxsID0gbmV4dFJOb2RlKCk7XG4gICAgICAvLyBJZiB0aGUgSUNVIGNvbnRhaW5lciBoYXMgbm8gbm9kZXMsIHRoYW4gd2UgdXNlIHRoZSBJQ1UgYW5jaG9yIGFzIHRoZSBub2RlLlxuICAgICAgcmV0dXJuIHJOb2RlIHx8IHVud3JhcFJOb2RlKGxWaWV3W3ROb2RlLmluZGV4XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByb2plY3Rpb25Ob2RlcyA9IGdldFByb2plY3Rpb25Ob2RlcyhsVmlldywgdE5vZGUpO1xuICAgICAgaWYgKHByb2plY3Rpb25Ob2RlcyAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uTm9kZXMpKSB7XG4gICAgICAgICAgcmV0dXJuIHByb2plY3Rpb25Ob2Rlc1swXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJlbnRWaWV3ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFBhcmVudFZpZXcocGFyZW50Vmlldyk7XG4gICAgICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUocGFyZW50VmlldyEsIHByb2plY3Rpb25Ob2Rlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3LCB0Tm9kZS5uZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3Rpb25Ob2RlcyhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZXxudWxsKTogVE5vZGV8Uk5vZGVbXXxudWxsIHtcbiAgaWYgKHROb2RlICE9PSBudWxsKSB7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgICBjb25zdCBjb21wb25lbnRIb3N0ID0gY29tcG9uZW50Vmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICBjb25zdCBzbG90SWR4ID0gdE5vZGUucHJvamVjdGlvbiBhcyBudW1iZXI7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFByb2plY3Rpb25TbG90cyhsVmlldyk7XG4gICAgcmV0dXJuIGNvbXBvbmVudEhvc3QucHJvamVjdGlvbiFbc2xvdElkeF07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCZWZvcmVOb2RlRm9yVmlldyh2aWV3SW5kZXhJbkNvbnRhaW5lcjogbnVtYmVyLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogUk5vZGV8XG4gICAgbnVsbCB7XG4gIGNvbnN0IG5leHRWaWV3SW5kZXggPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIHZpZXdJbmRleEluQ29udGFpbmVyICsgMTtcbiAgaWYgKG5leHRWaWV3SW5kZXggPCBsQ29udGFpbmVyLmxlbmd0aCkge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltuZXh0Vmlld0luZGV4XSBhcyBMVmlldztcbiAgICBjb25zdCBmaXJzdFROb2RlT2ZWaWV3ID0gbFZpZXdbVFZJRVddLmZpcnN0Q2hpbGQ7XG4gICAgaWYgKGZpcnN0VE5vZGVPZlZpZXcgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIGZpcnN0VE5vZGVPZlZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsQ29udGFpbmVyW05BVElWRV07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIG5hdGl2ZSBub2RlIGl0c2VsZiB1c2luZyBhIGdpdmVuIHJlbmRlcmVyLiBUbyByZW1vdmUgdGhlIG5vZGUgd2UgYXJlIGxvb2tpbmcgdXAgaXRzXG4gKiBwYXJlbnQgZnJvbSB0aGUgbmF0aXZlIHRyZWUgYXMgbm90IGFsbCBwbGF0Zm9ybXMgLyBicm93c2VycyBzdXBwb3J0IHRoZSBlcXVpdmFsZW50IG9mXG4gKiBub2RlLnJlbW92ZSgpLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIGJlIHVzZWRcbiAqIEBwYXJhbSByTm9kZSBUaGUgbmF0aXZlIG5vZGUgdGhhdCBzaG91bGQgYmUgcmVtb3ZlZFxuICogQHBhcmFtIGlzSG9zdEVsZW1lbnQgQSBmbGFnIGluZGljYXRpbmcgaWYgYSBub2RlIHRvIGJlIHJlbW92ZWQgaXMgYSBob3N0IG9mIGEgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlcjogUmVuZGVyZXIsIHJOb2RlOiBSTm9kZSwgaXNIb3N0RWxlbWVudD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZU5vZGUrKztcbiAgY29uc3QgbmF0aXZlUGFyZW50ID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgck5vZGUpO1xuICBpZiAobmF0aXZlUGFyZW50KSB7XG4gICAgbmF0aXZlUmVtb3ZlQ2hpbGQocmVuZGVyZXIsIG5hdGl2ZVBhcmVudCwgck5vZGUsIGlzSG9zdEVsZW1lbnQpO1xuICB9XG59XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBjb250ZW50cyBvZiBhIGdpdmVuIFJFbGVtZW50LlxuICpcbiAqIEBwYXJhbSByRWxlbWVudCB0aGUgbmF0aXZlIFJFbGVtZW50IHRvIGJlIGNsZWFyZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyRWxlbWVudENvbnRlbnRzKHJFbGVtZW50OiBSRWxlbWVudCk6IHZvaWQge1xuICByRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xufVxuXG5cbi8qKlxuICogUGVyZm9ybXMgdGhlIG9wZXJhdGlvbiBvZiBgYWN0aW9uYCBvbiB0aGUgbm9kZS4gVHlwaWNhbGx5IHRoaXMgaW52b2x2ZXMgaW5zZXJ0aW5nIG9yIHJlbW92aW5nXG4gKiBub2RlcyBvbiB0aGUgTFZpZXcgb3IgcHJvamVjdGlvbiBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlOb2RlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgdE5vZGU6IFROb2RlfG51bGwsIGxWaWV3OiBMVmlldyxcbiAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCwgaXNQcm9qZWN0aW9uOiBib29sZWFuKSB7XG4gIHdoaWxlICh0Tm9kZSAhPSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGxWaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0VE5vZGVUeXBlKFxuICAgICAgICAgICAgdE5vZGUsXG4gICAgICAgICAgICBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHwgVE5vZGVUeXBlLlByb2plY3Rpb24gfCBUTm9kZVR5cGUuSWN1KTtcbiAgICBjb25zdCByYXdTbG90VmFsdWUgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgY29uc3QgdE5vZGVUeXBlID0gdE5vZGUudHlwZTtcbiAgICBpZiAoaXNQcm9qZWN0aW9uKSB7XG4gICAgICBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkNyZWF0ZSkge1xuICAgICAgICByYXdTbG90VmFsdWUgJiYgYXR0YWNoUGF0Y2hEYXRhKHVud3JhcFJOb2RlKHJhd1Nsb3RWYWx1ZSksIGxWaWV3KTtcbiAgICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkgIT09IFROb2RlRmxhZ3MuaXNEZXRhY2hlZCkge1xuICAgICAgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIGFwcGx5Tm9kZXMocmVuZGVyZXIsIGFjdGlvbiwgdE5vZGUuY2hpbGQsIGxWaWV3LCBwYXJlbnRSRWxlbWVudCwgYmVmb3JlTm9kZSwgZmFsc2UpO1xuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByYXdTbG90VmFsdWUsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuSWN1KSB7XG4gICAgICAgIGNvbnN0IG5leHRSTm9kZSA9IGljdUNvbnRhaW5lckl0ZXJhdGUodE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgICAgICAgbGV0IHJOb2RlOiBSTm9kZXxudWxsO1xuICAgICAgICB3aGlsZSAock5vZGUgPSBuZXh0Uk5vZGUoKSkge1xuICAgICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJOb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByYXdTbG90VmFsdWUsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBhcHBseVByb2plY3Rpb25SZWN1cnNpdmUoXG4gICAgICAgICAgICByZW5kZXJlciwgYWN0aW9uLCBsVmlldywgdE5vZGUgYXMgVFByb2plY3Rpb25Ob2RlLCBwYXJlbnRSRWxlbWVudCwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgcmF3U2xvdFZhbHVlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdE5vZGUgPSBpc1Byb2plY3Rpb24gPyB0Tm9kZS5wcm9qZWN0aW9uTmV4dCA6IHROb2RlLm5leHQ7XG4gIH1cbn1cblxuXG4vKipcbiAqIGBhcHBseVZpZXdgIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgdmlldyBhcyBzcGVjaWZpZWQgaW4gYGFjdGlvbmAgKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIHZpZXcgd2l0aG91dCBwcm9qZWN0aW9uIG9yIGNvbnRhaW5lcnMgYXQgdG9wIGxldmVsIGlzIHNpbXBsZS4gSnVzdCBpdGVyYXRlIG92ZXIgdGhlXG4gKiByb290IG5vZGVzIG9mIHRoZSBWaWV3LCBhbmQgZm9yIGVhY2ggbm9kZSBwZXJmb3JtIHRoZSBgYWN0aW9uYC5cbiAqXG4gKiBUaGluZ3MgZ2V0IG1vcmUgY29tcGxpY2F0ZWQgd2l0aCBjb250YWluZXJzIGFuZCBwcm9qZWN0aW9ucy4gVGhhdCBpcyBiZWNhdXNlIGNvbWluZyBhY3Jvc3M6XG4gKiAtIENvbnRhaW5lcjogaW1wbGllcyB0aGF0IHdlIGhhdmUgdG8gaW5zZXJ0L3JlbW92ZS9kZXN0cm95IHRoZSB2aWV3cyBvZiB0aGF0IGNvbnRhaW5lciBhcyB3ZWxsXG4gKiAgICAgICAgICAgICAgd2hpY2ggaW4gdHVybiBjYW4gaGF2ZSB0aGVpciBvd24gQ29udGFpbmVycyBhdCB0aGUgVmlldyByb290cy5cbiAqIC0gUHJvamVjdGlvbjogaW1wbGllcyB0aGF0IHdlIGhhdmUgdG8gaW5zZXJ0L3JlbW92ZS9kZXN0cm95IHRoZSBub2RlcyBvZiB0aGUgcHJvamVjdGlvbi4gVGhlXG4gKiAgICAgICAgICAgICAgIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRoZSBub2RlcyB3ZSBhcmUgcHJvamVjdGluZyBjYW4gdGhlbXNlbHZlcyBoYXZlIENvbnRhaW5lcnNcbiAqICAgICAgICAgICAgICAgb3Igb3RoZXIgUHJvamVjdGlvbnMuXG4gKlxuICogQXMgeW91IGNhbiBzZWUgdGhpcyBpcyBhIHZlcnkgcmVjdXJzaXZlIHByb2JsZW0uIFllcyByZWN1cnNpb24gaXMgbm90IG1vc3QgZWZmaWNpZW50IGJ1dCB0aGVcbiAqIGNvZGUgaXMgY29tcGxpY2F0ZWQgZW5vdWdoIHRoYXQgdHJ5aW5nIHRvIGltcGxlbWVudGVkIHdpdGggcmVjdXJzaW9uIGJlY29tZXMgdW5tYWludGFpbmFibGUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gcGFyZW50UkVsZW1lbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24gKFJlbW92YWwgZG9lcyBub3QgbmVlZCBpdCkuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBCZWZvcmUgd2hpY2ggbm9kZSB0aGUgaW5zZXJ0aW9ucyBzaG91bGQgaGFwcGVuLlxuICovXG5mdW5jdGlvbiBhcHBseVZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksXG4gICAgcGFyZW50UkVsZW1lbnQ6IG51bGwsIGJlZm9yZU5vZGU6IG51bGwpOiB2b2lkO1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbixcbiAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCk6IHZvaWQ7XG5mdW5jdGlvbiBhcHBseVZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsKTogdm9pZCB7XG4gIGFwcGx5Tm9kZXMocmVuZGVyZXIsIGFjdGlvbiwgdFZpZXcuZmlyc3RDaGlsZCwgbFZpZXcsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlLCBmYWxzZSk7XG59XG5cbi8qKlxuICogYGFwcGx5UHJvamVjdGlvbmAgcGVyZm9ybXMgb3BlcmF0aW9uIG9uIHRoZSBwcm9qZWN0aW9uLlxuICpcbiAqIEluc2VydGluZyBhIHByb2plY3Rpb24gcmVxdWlyZXMgdXMgdG8gbG9jYXRlIHRoZSBwcm9qZWN0ZWQgbm9kZXMgZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudC4gVGhlXG4gKiBjb21wbGljYXRpb24gaXMgdGhhdCB0aG9zZSBub2RlcyB0aGVtc2VsdmVzIGNvdWxkIGJlIHJlLXByb2plY3RlZCBmcm9tIHRoZWlyIHBhcmVudCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXdgIG9mIGBMVmlld2Agd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgbm9kZSB0byBwcm9qZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVByb2plY3Rpb24odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRQcm9qZWN0aW9uTm9kZTogVFByb2plY3Rpb25Ob2RlKSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBjb25zdCBwYXJlbnRSTm9kZSA9IGdldFBhcmVudFJFbGVtZW50KHRWaWV3LCB0UHJvamVjdGlvbk5vZGUsIGxWaWV3KTtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSB0UHJvamVjdGlvbk5vZGUucGFyZW50IHx8IGxWaWV3W1RfSE9TVF0hO1xuICBsZXQgYmVmb3JlTm9kZSA9IGdldEluc2VydEluRnJvbnRPZlJOb2RlKHBhcmVudFROb2RlLCB0UHJvamVjdGlvbk5vZGUsIGxWaWV3KTtcbiAgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICAgICAgcmVuZGVyZXIsIFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlLCBsVmlldywgdFByb2plY3Rpb25Ob2RlLCBwYXJlbnRSTm9kZSwgYmVmb3JlTm9kZSk7XG59XG5cbi8qKlxuICogYGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZWAgcGVyZm9ybXMgb3BlcmF0aW9uIG9uIHRoZSBwcm9qZWN0aW9uIHNwZWNpZmllZCBieSBgYWN0aW9uYCAoaW5zZXJ0LFxuICogZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIHByb2plY3Rpb24gcmVxdWlyZXMgdXMgdG8gbG9jYXRlIHRoZSBwcm9qZWN0ZWQgbm9kZXMgZnJvbSB0aGUgcGFyZW50IGNvbXBvbmVudC4gVGhlXG4gKiBjb21wbGljYXRpb24gaXMgdGhhdCB0aG9zZSBub2RlcyB0aGVtc2VsdmVzIGNvdWxkIGJlIHJlLXByb2plY3RlZCBmcm9tIHRoZWlyIHBhcmVudCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSB0UHJvamVjdGlvbk5vZGUgbm9kZSB0byBwcm9qZWN0XG4gKiBAcGFyYW0gcGFyZW50UkVsZW1lbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbiwgbFZpZXc6IExWaWV3LCB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSxcbiAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCkge1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudExWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHR5cGVvZiB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiwgJ251bWJlcicsICdleHBlY3RpbmcgcHJvamVjdGlvbiBpbmRleCcpO1xuICBjb25zdCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMgPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24hW3RQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uXSE7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVUb1Byb2plY3RPclJOb2RlcykpIHtcbiAgICAvLyBUaGlzIHNob3VsZCBub3QgZXhpc3QsIGl0IGlzIGEgYml0IG9mIGEgaGFjay4gV2hlbiB3ZSBib290c3RyYXAgYSB0b3AgbGV2ZWwgbm9kZSBhbmQgd2VcbiAgICAvLyBuZWVkIHRvIHN1cHBvcnQgcGFzc2luZyBwcm9qZWN0YWJsZSBub2Rlcywgc28gd2UgY2hlYXQgYW5kIHB1dCB0aGVtIGluIHRoZSBUTm9kZVxuICAgIC8vIG9mIHRoZSBIb3N0IFRWaWV3LiAoWWVzIHdlIHB1dCBpbnN0YW5jZSBpbmZvIGF0IHRoZSBUIExldmVsKS4gV2UgY2FuIGdldCBhd2F5IHdpdGggaXRcbiAgICAvLyBiZWNhdXNlIHdlIGtub3cgdGhhdCBUVmlldyBpcyBub3Qgc2hhcmVkIGFuZCB0aGVyZWZvcmUgaXQgd2lsbCBub3QgYmUgYSBwcm9ibGVtLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIHJlZmFjdG9yZWQgYW5kIGNsZWFuZWQgdXAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJOb2RlID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzW2ldO1xuICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgck5vZGUsIGJlZm9yZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogVE5vZGV8bnVsbCA9IG5vZGVUb1Byb2plY3RPclJOb2RlcztcbiAgICBjb25zdCBwcm9qZWN0ZWRDb21wb25lbnRMVmlldyA9IGNvbXBvbmVudExWaWV3W1BBUkVOVF0gYXMgTFZpZXc7XG4gICAgLy8gSWYgYSBwYXJlbnQgPG5nLWNvbnRlbnQ+IGlzIGxvY2F0ZWQgd2l0aGluIGEgc2tpcCBoeWRyYXRpb24gYmxvY2ssXG4gICAgLy8gYW5ub3RhdGUgYW4gYWN0dWFsIG5vZGUgdGhhdCBpcyBiZWluZyBwcm9qZWN0ZWQgd2l0aCB0aGUgc2FtZSBmbGFnIHRvby5cbiAgICBpZiAoaGFzSW5Ta2lwSHlkcmF0aW9uQmxvY2tGbGFnKHRQcm9qZWN0aW9uTm9kZSkpIHtcbiAgICAgIG5vZGVUb1Byb2plY3QuZmxhZ3MgfD0gVE5vZGVGbGFncy5pblNraXBIeWRyYXRpb25CbG9jaztcbiAgICB9XG4gICAgYXBwbHlOb2RlcyhcbiAgICAgICAgcmVuZGVyZXIsIGFjdGlvbiwgbm9kZVRvUHJvamVjdCwgcHJvamVjdGVkQ29tcG9uZW50TFZpZXcsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5cbi8qKlxuICogYGFwcGx5Q29udGFpbmVyYCBwZXJmb3JtcyBhbiBvcGVyYXRpb24gb24gdGhlIGNvbnRhaW5lciBhbmQgaXRzIHZpZXdzIGFzIHNwZWNpZmllZCBieVxuICogYGFjdGlvbmAgKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIENvbnRhaW5lciBpcyBjb21wbGljYXRlZCBieSB0aGUgZmFjdCB0aGF0IHRoZSBjb250YWluZXIgbWF5IGhhdmUgVmlld3Mgd2hpY2hcbiAqIHRoZW1zZWx2ZXMgaGF2ZSBjb250YWluZXJzIG9yIHByb2plY3Rpb25zLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIExDb250YWluZXIgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcGFyZW50UkVsZW1lbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Q29udGFpbmVyKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsfHVuZGVmaW5lZCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3QgYW5jaG9yID0gbENvbnRhaW5lcltOQVRJVkVdOyAgLy8gTENvbnRhaW5lciBoYXMgaXRzIG93biBiZWZvcmUgbm9kZS5cbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUobENvbnRhaW5lcik7XG4gIC8vIEFuIExDb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgb24gYW55IG5vZGUgYnkgaW5qZWN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gIC8vIEFza2luZyBmb3IgYSBWaWV3Q29udGFpbmVyUmVmIG9uIGFuIGVsZW1lbnQgd2lsbCByZXN1bHQgaW4gYSBjcmVhdGlvbiBvZiBhIHNlcGFyYXRlIGFuY2hvclxuICAvLyBub2RlIChjb21tZW50IGluIHRoZSBET00pIHRoYXQgd2lsbCBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgTENvbnRhaW5lcidzIGhvc3Qgbm9kZS4gSW4gdGhpc1xuICAvLyBwYXJ0aWN1bGFyIGNhc2Ugd2UgbmVlZCB0byBleGVjdXRlIGFjdGlvbiBvbiAyIG5vZGVzOlxuICAvLyAtIGNvbnRhaW5lcidzIGhvc3Qgbm9kZSAodGhpcyBpcyBkb25lIGluIHRoZSBleGVjdXRlQWN0aW9uT25FbGVtZW50T3JDb250YWluZXIpXG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaGVyZSlcbiAgaWYgKGFuY2hvciAhPT0gbmF0aXZlKSB7XG4gICAgLy8gVGhpcyBpcyB2ZXJ5IHN0cmFuZ2UgdG8gbWUgKE1pc2tvKS4gSSB3b3VsZCBleHBlY3QgdGhhdCB0aGUgbmF0aXZlIGlzIHNhbWUgYXMgYW5jaG9yLiBJXG4gICAgLy8gZG9uJ3Qgc2VlIGEgcmVhc29uIHdoeSB0aGV5IHNob3VsZCBiZSBkaWZmZXJlbnQsIGJ1dCB0aGV5IGFyZS5cbiAgICAvL1xuICAgIC8vIElmIHRoZXkgYXJlIHdlIG5lZWQgdG8gcHJvY2VzcyB0aGUgc2Vjb25kIGFuY2hvciBhcyB3ZWxsLlxuICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIGFuY2hvciwgYmVmb3JlTm9kZSk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICBhcHBseVZpZXcobFZpZXdbVFZJRVddLCBsVmlldywgcmVuZGVyZXIsIGFjdGlvbiwgcGFyZW50UkVsZW1lbnQsIGFuY2hvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZXMgY2xhc3Mvc3R5bGUgdG8gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgaXQgc2hvdWxkIGJlIHdyaXR0ZW4gdG8gYGNsYXNzYCAoYGZhbHNlYCB0byB3cml0ZSB0byBgc3R5bGVgKVxuICogQHBhcmFtIHJOb2RlIFRoZSBOb2RlIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgdG8gd3JpdGUgdG8uIFRoaXMgd291bGQgYmUgdGhlIGNsYXNzL3N0eWxlIG5hbWUuXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIElmIGBudWxsYC9gdW5kZWZpbmVkYC9gZmFsc2VgIHRoaXMgaXMgY29uc2lkZXJlZCBhIHJlbW92ZSAoc2V0L2FkZFxuICogICAgICAgIG90aGVyd2lzZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIHJOb2RlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAvLyBXZSBhY3R1YWxseSB3YW50IEpTIHRydWUvZmFsc2UgaGVyZSBiZWNhdXNlIGFueSB0cnV0aHkgdmFsdWUgc2hvdWxkIGFkZCB0aGUgY2xhc3NcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIHJlbmRlcmVyLnJlbW92ZUNsYXNzKHJOb2RlLCBwcm9wKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICByZW5kZXJlci5hZGRDbGFzcyhyTm9kZSwgcHJvcCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBmbGFncyA9IHByb3AuaW5kZXhPZignLScpID09PSAtMSA/IHVuZGVmaW5lZCA6IFJlbmRlcmVyU3R5bGVGbGFnczIuRGFzaENhc2UgYXMgbnVtYmVyO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIC8qKiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKHJOb2RlLCBwcm9wLCBmbGFncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgdmFsdWUgaXMgaW1wb3J0YW50IGlmIGl0IGVuZHMgd2l0aCBgIWltcG9ydGFudGAuIFRoZSBzdHlsZVxuICAgICAgLy8gcGFyc2VyIHN0cmlwcyBhbnkgc2VtaWNvbG9ucyBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS5cbiAgICAgIGNvbnN0IGlzSW1wb3J0YW50ID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlLmVuZHNXaXRoKCchaW1wb3J0YW50JykgOiBmYWxzZTtcblxuICAgICAgaWYgKGlzSW1wb3J0YW50KSB7XG4gICAgICAgIC8vICFpbXBvcnRhbnQgaGFzIHRvIGJlIHN0cmlwcGVkIGZyb20gdGhlIHZhbHVlIGZvciBpdCB0byBiZSB2YWxpZC5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgwLCAtMTApO1xuICAgICAgICBmbGFncyEgfD0gUmVuZGVyZXJTdHlsZUZsYWdzMi5JbXBvcnRhbnQ7XG4gICAgICB9XG5cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgcmVuZGVyZXIuc2V0U3R5bGUock5vZGUsIHByb3AsIHZhbHVlLCBmbGFncyk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBXcml0ZSBgY3NzVGV4dGAgdG8gYFJFbGVtZW50YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgZGlyZWN0IHdyaXRlIHdpdGhvdXQgYW55IHJlY29uY2lsaWF0aW9uLiBVc2VkIGZvciB3cml0aW5nIGluaXRpYWwgdmFsdWVzLCBzb1xuICogdGhhdCBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgZG8gbm90IHB1bGwgaW4gdGhlIHN0eWxlIHBhcnNlci5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB3aGljaCBuZWVkcyB0byBiZSB1cGRhdGVkLlxuICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgY2xhc3MgbGlzdCB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRGlyZWN0U3R5bGUocmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmV3VmFsdWU6IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKG5ld1ZhbHVlLCAnXFwnbmV3VmFsdWVcXCcgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnc3R5bGUnLCBuZXdWYWx1ZSk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xufVxuXG4vKipcbiAqIFdyaXRlIGBjbGFzc05hbWVgIHRvIGBSRWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBkb2VzIGRpcmVjdCB3cml0ZSB3aXRob3V0IGFueSByZWNvbmNpbGlhdGlvbi4gVXNlZCBmb3Igd3JpdGluZyBpbml0aWFsIHZhbHVlcywgc29cbiAqIHRoYXQgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGRvIG5vdCBwdWxsIGluIHRoZSBzdHlsZSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IGNsYXNzIGxpc3QgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURpcmVjdENsYXNzKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIG5ld1ZhbHVlOiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyhuZXdWYWx1ZSwgJ1xcJ25ld1ZhbHVlXFwnIHNob3VsZCBiZSBhIHN0cmluZycpO1xuICBpZiAobmV3VmFsdWUgPT09ICcnKSB7XG4gICAgLy8gVGhlcmUgYXJlIHRlc3RzIGluIGBnb29nbGUzYCB3aGljaCBleHBlY3QgYGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpYCB0byBiZSBgbnVsbGAuXG4gICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsICdjbGFzcycpO1xuICB9IGVsc2Uge1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnY2xhc3MnLCBuZXdWYWx1ZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldENsYXNzTmFtZSsrO1xufVxuXG4vKiogU2V0cyB1cCB0aGUgc3RhdGljIERPTSBhdHRyaWJ1dGVzIG9uIGFuIGBSTm9kZWAuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBTdGF0aWNBdHRyaWJ1dGVzKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB7bWVyZ2VkQXR0cnMsIGNsYXNzZXMsIHN0eWxlc30gPSB0Tm9kZTtcblxuICBpZiAobWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMocmVuZGVyZXIsIGVsZW1lbnQsIG1lcmdlZEF0dHJzKTtcbiAgfVxuXG4gIGlmIChjbGFzc2VzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RDbGFzcyhyZW5kZXJlciwgZWxlbWVudCwgY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAoc3R5bGVzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RTdHlsZShyZW5kZXJlciwgZWxlbWVudCwgc3R5bGVzKTtcbiAgfVxufVxuIl19