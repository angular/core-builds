/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
import { getNativeByTNode, unwrapRNode, updateTransplantedViewCount } from './util/view_utils';
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
    // would be cleared and the counter decremented), we need to decrement the view counter here
    // instead.
    if (lView[FLAGS] & 1024 /* LViewFlags.RefreshTransplantedView */) {
        lView[FLAGS] &= ~1024 /* LViewFlags.RefreshTransplantedView */;
        updateTransplantedViewCount(insertionLContainer, -1);
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxVQUFVLEVBQUUsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0RyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxxQkFBcUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNySCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDN0QsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBRSxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUV4SCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFJNUQsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUMvRCxPQUFPLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxzQkFBc0IsRUFB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dUQ7QUFDdkQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLFFBQWtCLEVBQUUsT0FBaUIsRUFBRSxLQUFZO0lBQ3ZGLE1BQU0sRUFBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBQyxHQUFHLEtBQUssQ0FBQztJQUU3QyxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7UUFDeEIsZUFBZSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDakQ7SUFFRCxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUM5QztJQUVELElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUNuQixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzdDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7UmVuZGVyZXJTdHlsZUZsYWdzMn0gZnJvbSAnLi4vcmVuZGVyL2FwaV9mbGFncyc7XG5pbXBvcnQge2FkZFRvQXJyYXksIHJlbW92ZUZyb21BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRGdW5jdGlvbiwgYXNzZXJ0TnVtYmVyLCBhc3NlcnRTdHJpbmd9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZXNjYXBlQ29tbWVudFRleHR9IGZyb20gJy4uL3V0aWwvZG9tJztcblxuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0UGFyZW50VmlldywgYXNzZXJ0UHJvamVjdGlvblNsb3RzLCBhc3NlcnRUTm9kZUZvckxWaWV3fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2ljdUNvbnRhaW5lckl0ZXJhdGV9IGZyb20gJy4vaTE4bi9pMThuX3RyZWVfc2hha2luZyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXUywgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge3VucmVnaXN0ZXJMVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL2x2aWV3X3RyYWNraW5nJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGVtcGxhdGUsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDTEVBTlVQLCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fTENPTlRBSU5FUiwgRGVzdHJveUhvb2tEYXRhLCBGTEFHUywgSG9va0RhdGEsIEhvb2tGbiwgSE9TVCwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIE9OX0RFU1RST1lfSE9PS1MsIFBBUkVOVCwgUVVFUklFUywgUkVBQ1RJVkVfSE9TVF9CSU5ESU5HX0NPTlNVTUVSLCBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUiwgUkVOREVSRVIsIFRfSE9TVCwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7cHJvZmlsZXIsIFByb2ZpbGVyRXZlbnR9IGZyb20gJy4vcHJvZmlsZXInO1xuaW1wb3J0IHtzZXRVcEF0dHJpYnV0ZXN9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge2dldExWaWV3UGFyZW50fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZSwgdXBkYXRlVHJhbnNwbGFudGVkVmlld0NvdW50fSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IGVudW0gV2Fsa1ROb2RlVHJlZUFjdGlvbiB7XG4gIC8qKiBub2RlIGNyZWF0ZSBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50LiBSdW4gb24gaW5pdGlhbCBjcmVhdGlvbi4gKi9cbiAgQ3JlYXRlID0gMCxcblxuICAvKipcbiAgICogbm9kZSBpbnNlcnQgaW4gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudC5cbiAgICogUnVuIHdoZW4gZXhpc3Rpbmcgbm9kZSBoYXMgYmVlbiBkZXRhY2hlZCBhbmQgbmVlZHMgdG8gYmUgcmUtYXR0YWNoZWQuXG4gICAqL1xuICBJbnNlcnQgPSAxLFxuXG4gIC8qKiBub2RlIGRldGFjaCBmcm9tIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQgKi9cbiAgRGV0YWNoID0gMixcblxuICAvKiogbm9kZSBkZXN0cnVjdGlvbiB1c2luZyB0aGUgcmVuZGVyZXIncyBBUEkgKi9cbiAgRGVzdHJveSA9IDMsXG59XG5cblxuXG4vKipcbiAqIE5PVEU6IGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgcG9zc2libGUgYWN0aW9ucyBhcmUgaW5saW5lZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIGluc3RlYWQgb2ZcbiAqIGJlaW5nIHBhc3NlZCBhcyBhbiBhcmd1bWVudC5cbiAqL1xuZnVuY3Rpb24gYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihcbiAgICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHJlbmRlcmVyOiBSZW5kZXJlciwgcGFyZW50OiBSRWxlbWVudHxudWxsLFxuICAgIGxOb2RlVG9IYW5kbGU6IFJOb2RlfExDb250YWluZXJ8TFZpZXcsIGJlZm9yZU5vZGU/OiBSTm9kZXxudWxsKSB7XG4gIC8vIElmIHRoaXMgc2xvdCB3YXMgYWxsb2NhdGVkIGZvciBhIHRleHQgbm9kZSBkeW5hbWljYWxseSBjcmVhdGVkIGJ5IGkxOG4sIHRoZSB0ZXh0IG5vZGUgaXRzZWxmXG4gIC8vIHdvbid0IGJlIGNyZWF0ZWQgdW50aWwgaTE4bkFwcGx5KCkgaW4gdGhlIHVwZGF0ZSBibG9jaywgc28gdGhpcyBub2RlIHNob3VsZCBiZSBza2lwcGVkLlxuICAvLyBGb3IgbW9yZSBpbmZvLCBzZWUgXCJJQ1UgZXhwcmVzc2lvbnMgc2hvdWxkIHdvcmsgaW5zaWRlIGFuIG5nVGVtcGxhdGVPdXRsZXQgaW5zaWRlIGFuIG5nRm9yXCJcbiAgLy8gaW4gYGkxOG5fc3BlYy50c2AuXG4gIGlmIChsTm9kZVRvSGFuZGxlICE9IG51bGwpIHtcbiAgICBsZXQgbENvbnRhaW5lcjogTENvbnRhaW5lcnx1bmRlZmluZWQ7XG4gICAgbGV0IGlzQ29tcG9uZW50ID0gZmFsc2U7XG4gICAgLy8gV2UgYXJlIGV4cGVjdGluZyBhbiBSTm9kZSwgYnV0IGluIHRoZSBjYXNlIG9mIGEgY29tcG9uZW50IG9yIExDb250YWluZXIgdGhlIGBSTm9kZWAgaXNcbiAgICAvLyB3cmFwcGVkIGluIGFuIGFycmF5IHdoaWNoIG5lZWRzIHRvIGJlIHVud3JhcHBlZC4gV2UgbmVlZCB0byBrbm93IGlmIGl0IGlzIGEgY29tcG9uZW50IGFuZCBpZlxuICAgIC8vIGl0IGhhcyBMQ29udGFpbmVyIHNvIHRoYXQgd2UgY2FuIHByb2Nlc3MgYWxsIG9mIHRob3NlIGNhc2VzIGFwcHJvcHJpYXRlbHkuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZVRvSGFuZGxlKSkge1xuICAgICAgbENvbnRhaW5lciA9IGxOb2RlVG9IYW5kbGU7XG4gICAgfSBlbHNlIGlmIChpc0xWaWV3KGxOb2RlVG9IYW5kbGUpKSB7XG4gICAgICBpc0NvbXBvbmVudCA9IHRydWU7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsTm9kZVRvSGFuZGxlW0hPU1RdLCAnSE9TVCBtdXN0IGJlIGRlZmluZWQgZm9yIGEgY29tcG9uZW50IExWaWV3Jyk7XG4gICAgICBsTm9kZVRvSGFuZGxlID0gbE5vZGVUb0hhbmRsZVtIT1NUXSE7XG4gICAgfVxuICAgIGNvbnN0IHJOb2RlOiBSTm9kZSA9IHVud3JhcFJOb2RlKGxOb2RlVG9IYW5kbGUpO1xuXG4gICAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBpZiAoYmVmb3JlTm9kZSA9PSBudWxsKSB7XG4gICAgICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50LCByTm9kZSwgYmVmb3JlTm9kZSB8fCBudWxsLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgck5vZGUsIGJlZm9yZU5vZGUgfHwgbnVsbCwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uRGV0YWNoKSB7XG4gICAgICBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyLCByTm9kZSwgaXNDb21wb25lbnQpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3kpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Tm9kZSsrO1xuICAgICAgcmVuZGVyZXIuZGVzdHJveU5vZGUhKHJOb2RlKTtcbiAgICB9XG4gICAgaWYgKGxDb250YWluZXIgIT0gbnVsbCkge1xuICAgICAgYXBwbHlDb250YWluZXIocmVuZGVyZXIsIGFjdGlvbiwgbENvbnRhaW5lciwgcGFyZW50LCBiZWZvcmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgdmFsdWU6IHN0cmluZyk6IFJUZXh0IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHJldHVybiByZW5kZXJlci5jcmVhdGVUZXh0KHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVRleHROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgck5vZGU6IFJUZXh0LCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHJlbmRlcmVyLnNldFZhbHVlKHJOb2RlLCB2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21tZW50Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIsIHZhbHVlOiBzdHJpbmcpOiBSQ29tbWVudCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIHJldHVybiByZW5kZXJlci5jcmVhdGVDb21tZW50KGVzY2FwZUNvbW1lbnRUZXh0KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gbmFtZXNwYWNlIE9wdGlvbmFsIG5hbWVzcGFjZSBmb3IgZWxlbWVudC5cbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROb2RlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgbmFtZTogc3RyaW5nLCBuYW1lc3BhY2U6IHN0cmluZ3xudWxsKTogUkVsZW1lbnQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICByZXR1cm4gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xufVxuXG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIHJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVmlld0Zyb21Db250YWluZXIodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbnVsbCwgbnVsbCk7XG4gIGxWaWV3W0hPU1RdID0gbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IG51bGw7XG59XG5cbi8qKlxuICogQWRkcyBhbGwgRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuXG4gKlxuICogQmVjYXVzZSBzb21lIHJvb3Qgbm9kZXMgb2YgdGhlIHZpZXcgbWF5IGJlIGNvbnRhaW5lcnMsIHdlIHNvbWV0aW1lcyBuZWVkXG4gKiB0byBwcm9wYWdhdGUgZGVlcGx5IGludG8gdGhlIG5lc3RlZCBjb250YWluZXJzIHRvIGFkZCBhbGwgZWxlbWVudHMgaW4gdGhlXG4gKiB2aWV3cyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gcGFyZW50VE5vZGUgVGhlIGBUTm9kZWAgd2hlcmUgdGhlIGBMVmlld2Agc2hvdWxkIGJlIGF0dGFjaGVkIHRvLlxuICogQHBhcmFtIHJlbmRlcmVyIEN1cnJlbnQgcmVuZGVyZXIgdG8gdXNlIGZvciBET00gbWFuaXB1bGF0aW9ucy5cbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKiBAcGFyYW0gcGFyZW50TmF0aXZlTm9kZSBUaGUgcGFyZW50IGBSRWxlbWVudGAgd2hlcmUgaXQgc2hvdWxkIGJlIGluc2VydGVkIGludG8uXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkLCBpZiBpbnNlcnQgbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVmlld1RvQ29udGFpbmVyKFxuICAgIHRWaWV3OiBUVmlldywgcGFyZW50VE5vZGU6IFROb2RlLCByZW5kZXJlcjogUmVuZGVyZXIsIGxWaWV3OiBMVmlldywgcGFyZW50TmF0aXZlTm9kZTogUkVsZW1lbnQsXG4gICAgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCk6IHZvaWQge1xuICBsVmlld1tIT1NUXSA9IHBhcmVudE5hdGl2ZU5vZGU7XG4gIGxWaWV3W1RfSE9TVF0gPSBwYXJlbnRUTm9kZTtcbiAgYXBwbHlWaWV3KHRWaWV3LCBsVmlldywgcmVuZGVyZXIsIFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0LCBwYXJlbnROYXRpdmVOb2RlLCBiZWZvcmVOb2RlKTtcbn1cblxuXG4vKipcbiAqIERldGFjaCBhIGBMVmlld2AgZnJvbSB0aGUgRE9NIGJ5IGRldGFjaGluZyBpdHMgbm9kZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGJlIGRldGFjaGVkXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2AgdG8gYmUgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZXRhY2hWaWV3KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGFwcGx5Vmlldyh0VmlldywgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXRhY2gsIG51bGwsIG51bGwpO1xufVxuXG4vKipcbiAqIFRyYXZlcnNlcyBkb3duIGFuZCB1cCB0aGUgdHJlZSBvZiB2aWV3cyBhbmQgY29udGFpbmVycyB0byByZW1vdmUgbGlzdGVuZXJzIGFuZFxuICogY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIE5vdGVzOlxuICogIC0gQmVjYXVzZSBpdCdzIHVzZWQgZm9yIG9uRGVzdHJveSBjYWxscywgaXQgbmVlZHMgdG8gYmUgYm90dG9tLXVwLlxuICogIC0gTXVzdCBwcm9jZXNzIGNvbnRhaW5lcnMgaW5zdGVhZCBvZiB0aGVpciB2aWV3cyB0byBhdm9pZCBzcGxpY2luZ1xuICogIHdoZW4gdmlld3MgYXJlIGRlc3Ryb3llZCBhbmQgcmUtYWRkZWQuXG4gKiAgLSBVc2luZyBhIHdoaWxlIGxvb3AgYmVjYXVzZSBpdCdzIGZhc3RlciB0aGFuIHJlY3Vyc2lvblxuICogIC0gRGVzdHJveSBvbmx5IGNhbGxlZCBvbiBtb3ZlbWVudCB0byBzaWJsaW5nIG9yIG1vdmVtZW50IHRvIHBhcmVudCAobGF0ZXJhbGx5IG9yIHVwKVxuICpcbiAqICBAcGFyYW0gcm9vdFZpZXcgVGhlIHZpZXcgdG8gZGVzdHJveVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXdUcmVlKHJvb3RWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBJZiB0aGUgdmlldyBoYXMgbm8gY2hpbGRyZW4sIHdlIGNhbiBjbGVhbiBpdCB1cCBhbmQgcmV0dXJuIGVhcmx5LlxuICBsZXQgbFZpZXdPckxDb250YWluZXIgPSByb290Vmlld1tDSElMRF9IRUFEXTtcbiAgaWYgKCFsVmlld09yTENvbnRhaW5lcikge1xuICAgIHJldHVybiBjbGVhblVwVmlldyhyb290Vmlld1tUVklFV10sIHJvb3RWaWV3KTtcbiAgfVxuXG4gIHdoaWxlIChsVmlld09yTENvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld3xMQ29udGFpbmVyfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAvLyBJZiBMVmlldywgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lcltDSElMRF9IRUFEXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IGZpcnN0VmlldzogTFZpZXd8dW5kZWZpbmVkID0gbFZpZXdPckxDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdO1xuICAgICAgaWYgKGZpcnN0VmlldykgbmV4dCA9IGZpcnN0VmlldztcbiAgICB9XG5cbiAgICBpZiAoIW5leHQpIHtcbiAgICAgIC8vIE9ubHkgY2xlYW4gdXAgdmlldyB3aGVuIG1vdmluZyB0byB0aGUgc2lkZSBvciB1cCwgYXMgZGVzdHJveSBob29rc1xuICAgICAgLy8gc2hvdWxkIGJlIGNhbGxlZCBpbiBvcmRlciBmcm9tIHRoZSBib3R0b20gdXAuXG4gICAgICB3aGlsZSAobFZpZXdPckxDb250YWluZXIgJiYgIWxWaWV3T3JMQ29udGFpbmVyIVtORVhUXSAmJiBsVmlld09yTENvbnRhaW5lciAhPT0gcm9vdFZpZXcpIHtcbiAgICAgICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXJbVFZJRVddLCBsVmlld09yTENvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgbFZpZXdPckxDb250YWluZXIgPSBsVmlld09yTENvbnRhaW5lcltQQVJFTlRdO1xuICAgICAgfVxuICAgICAgaWYgKGxWaWV3T3JMQ29udGFpbmVyID09PSBudWxsKSBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3O1xuICAgICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAgIGNsZWFuVXBWaWV3KGxWaWV3T3JMQ29udGFpbmVyW1RWSUVXXSwgbFZpZXdPckxDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgbmV4dCA9IGxWaWV3T3JMQ29udGFpbmVyICYmIGxWaWV3T3JMQ29udGFpbmVyIVtORVhUXTtcbiAgICB9XG4gICAgbFZpZXdPckxDb250YWluZXIgPSBuZXh0O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIHZpZXcgaW50byBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIGFkZHMgdGhlIHZpZXcgdG8gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cyBpbiB0aGUgY29ycmVjdFxuICogcG9zaXRpb24uIEl0IGFsc28gYWRkcyB0aGUgdmlldydzIGVsZW1lbnRzIHRvIHRoZSBET00gaWYgdGhlIGNvbnRhaW5lciBpc24ndCBhXG4gKiByb290IG5vZGUgb2YgYW5vdGhlciB2aWV3IChpbiB0aGF0IGNhc2UsIHRoZSB2aWV3J3MgZWxlbWVudHMgd2lsbCBiZSBhZGRlZCB3aGVuXG4gKiB0aGUgY29udGFpbmVyJ3MgcGFyZW50IHZpZXcgaXMgYWRkZWQgbGF0ZXIpLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyBvZiB0aGUgYExWaWV3YCB0byBpbnNlcnRcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBpbnNlcnRcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBjb250YWluZXIgaW50byB3aGljaCB0aGUgdmlldyBzaG91bGQgYmUgaW5zZXJ0ZWRcbiAqIEBwYXJhbSBpbmRleCBXaGljaCBpbmRleCBpbiB0aGUgY29udGFpbmVyIHRvIGluc2VydCB0aGUgY2hpbGQgdmlldyBpbnRvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRWaWV3KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBpbmRleDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICBjb25zdCBpbmRleEluQ29udGFpbmVyID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyBpbmRleDtcbiAgY29uc3QgY29udGFpbmVyTGVuZ3RoID0gbENvbnRhaW5lci5sZW5ndGg7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lciAtIDFdW05FWFRdID0gbFZpZXc7XG4gIH1cbiAgaWYgKGluZGV4IDwgY29udGFpbmVyTGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHtcbiAgICBsVmlld1tORVhUXSA9IGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lcl07XG4gICAgYWRkVG9BcnJheShsQ29udGFpbmVyLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIGluZGV4LCBsVmlldyk7XG4gIH0gZWxzZSB7XG4gICAgbENvbnRhaW5lci5wdXNoKGxWaWV3KTtcbiAgICBsVmlld1tORVhUXSA9IG51bGw7XG4gIH1cblxuICBsVmlld1tQQVJFTlRdID0gbENvbnRhaW5lcjtcblxuICAvLyB0cmFjayB2aWV3cyB3aGVyZSBkZWNsYXJhdGlvbiBhbmQgaW5zZXJ0aW9uIHBvaW50cyBhcmUgZGlmZmVyZW50XG4gIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IGxWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBudWxsICYmIGxDb250YWluZXIgIT09IGRlY2xhcmF0aW9uTENvbnRhaW5lcikge1xuICAgIHRyYWNrTW92ZWRWaWV3KGRlY2xhcmF0aW9uTENvbnRhaW5lciwgbFZpZXcpO1xuICB9XG5cbiAgLy8gbm90aWZ5IHF1ZXJ5IHRoYXQgYSBuZXcgdmlldyBoYXMgYmVlbiBhZGRlZFxuICBjb25zdCBsUXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBsUXVlcmllcy5pbnNlcnRWaWV3KHRWaWV3KTtcbiAgfVxuXG4gIC8vIFNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogVHJhY2sgdmlld3MgY3JlYXRlZCBmcm9tIHRoZSBkZWNsYXJhdGlvbiBjb250YWluZXIgKFRlbXBsYXRlUmVmKSBhbmQgaW5zZXJ0ZWQgaW50byBhXG4gKiBkaWZmZXJlbnQgTENvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gdHJhY2tNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlldywgJ0xWaWV3IHJlcXVpcmVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uQ29udGFpbmVyKTtcbiAgY29uc3QgbW92ZWRWaWV3cyA9IGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXTtcbiAgY29uc3QgaW5zZXJ0ZWRMQ29udGFpbmVyID0gbFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRlZExDb250YWluZXIpO1xuICBjb25zdCBpbnNlcnRlZENvbXBvbmVudExWaWV3ID0gaW5zZXJ0ZWRMQ29udGFpbmVyW1BBUkVOVF0hW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaW5zZXJ0ZWRDb21wb25lbnRMVmlldywgJ01pc3NpbmcgaW5zZXJ0ZWRDb21wb25lbnRMVmlldycpO1xuICBjb25zdCBkZWNsYXJlZENvbXBvbmVudExWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkZWNsYXJlZENvbXBvbmVudExWaWV3LCAnTWlzc2luZyBkZWNsYXJlZENvbXBvbmVudExWaWV3Jyk7XG4gIGlmIChkZWNsYXJlZENvbXBvbmVudExWaWV3ICE9PSBpbnNlcnRlZENvbXBvbmVudExWaWV3KSB7XG4gICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgZGVjbGFyYXRpb24tY29tcG9uZW50IGlzIG5vdCBzYW1lIGFzIGluc2VydGlvbi1jb21wb25lbnQ7IHRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHRoaXMgaXMgYSB0cmFuc3BsYW50ZWQgdmlldy4gTWFyayB0aGUgZGVjbGFyZWQgbFZpZXcgYXMgaGF2aW5nIHRyYW5zcGxhbnRlZCB2aWV3cyBzbyB0aGF0XG4gICAgLy8gdGhvc2Ugdmlld3MgY2FuIHBhcnRpY2lwYXRlIGluIENELlxuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW0hBU19UUkFOU1BMQU5URURfVklFV1NdID0gdHJ1ZTtcbiAgfVxuICBpZiAobW92ZWRWaWV3cyA9PT0gbnVsbCkge1xuICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXSA9IFtsVmlld107XG4gIH0gZWxzZSB7XG4gICAgbW92ZWRWaWV3cy5wdXNoKGxWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10sXG4gICAgICAgICAgJ0EgcHJvamVjdGVkIHZpZXcgc2hvdWxkIGJlbG9uZyB0byBhIG5vbi1lbXB0eSBwcm9qZWN0ZWQgdmlld3MgY29sbGVjdGlvbicpO1xuICBjb25zdCBtb3ZlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdITtcbiAgY29uc3QgZGVjbGFyYXRpb25WaWV3SW5kZXggPSBtb3ZlZFZpZXdzLmluZGV4T2YobFZpZXcpO1xuICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcblxuICAvLyBJZiB0aGUgdmlldyB3YXMgbWFya2VkIGZvciByZWZyZXNoIGJ1dCB0aGVuIGRldGFjaGVkIGJlZm9yZSBpdCB3YXMgY2hlY2tlZCAod2hlcmUgdGhlIGZsYWdcbiAgLy8gd291bGQgYmUgY2xlYXJlZCBhbmQgdGhlIGNvdW50ZXIgZGVjcmVtZW50ZWQpLCB3ZSBuZWVkIHRvIGRlY3JlbWVudCB0aGUgdmlldyBjb3VudGVyIGhlcmVcbiAgLy8gaW5zdGVhZC5cbiAgaWYgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXc7XG4gICAgdXBkYXRlVHJhbnNwbGFudGVkVmlld0NvdW50KGluc2VydGlvbkxDb250YWluZXIsIC0xKTtcbiAgfVxuXG4gIG1vdmVkVmlld3Muc3BsaWNlKGRlY2xhcmF0aW9uVmlld0luZGV4LCAxKTtcbn1cblxuLyoqXG4gKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCByZW1vdmVzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgY29udGFpbmVyIGZyb20gd2hpY2ggdG8gZGV0YWNoIGEgdmlld1xuICogQHBhcmFtIHJlbW92ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgdmlldyB0byBkZXRhY2hcbiAqIEByZXR1cm5zIERldGFjaGVkIExWaWV3IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0YWNoVmlldyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCByZW1vdmVJbmRleDogbnVtYmVyKTogTFZpZXd8dW5kZWZpbmVkIHtcbiAgaWYgKGxDb250YWluZXIubGVuZ3RoIDw9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKSByZXR1cm47XG5cbiAgY29uc3QgaW5kZXhJbkNvbnRhaW5lciA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXg7XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lcl07XG5cbiAgaWYgKHZpZXdUb0RldGFjaCkge1xuICAgIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IHZpZXdUb0RldGFjaFtERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBudWxsICYmIGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbENvbnRhaW5lcikge1xuICAgICAgZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uTENvbnRhaW5lciwgdmlld1RvRGV0YWNoKTtcbiAgICB9XG5cblxuICAgIGlmIChyZW1vdmVJbmRleCA+IDApIHtcbiAgICAgIGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lciAtIDFdW05FWFRdID0gdmlld1RvRGV0YWNoW05FWFRdIGFzIExWaWV3O1xuICAgIH1cbiAgICBjb25zdCByZW1vdmVkTFZpZXcgPSByZW1vdmVGcm9tQXJyYXkobENvbnRhaW5lciwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyByZW1vdmVJbmRleCk7XG4gICAgcmVtb3ZlVmlld0Zyb21Db250YWluZXIodmlld1RvRGV0YWNoW1RWSUVXXSwgdmlld1RvRGV0YWNoKTtcblxuICAgIC8vIG5vdGlmeSBxdWVyeSB0aGF0IGEgdmlldyBoYXMgYmVlbiByZW1vdmVkXG4gICAgY29uc3QgbFF1ZXJpZXMgPSByZW1vdmVkTFZpZXdbUVVFUklFU107XG4gICAgaWYgKGxRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICBsUXVlcmllcy5kZXRhY2hWaWV3KHJlbW92ZWRMVmlld1tUVklFV10pO1xuICAgIH1cblxuICAgIHZpZXdUb0RldGFjaFtQQVJFTlRdID0gbnVsbDtcbiAgICB2aWV3VG9EZXRhY2hbTkVYVF0gPSBudWxsO1xuICAgIC8vIFVuc2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICAgIHZpZXdUb0RldGFjaFtGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQXR0YWNoZWQ7XG4gIH1cbiAgcmV0dXJuIHZpZXdUb0RldGFjaDtcbn1cblxuLyoqXG4gKiBBIHN0YW5kYWxvbmUgZnVuY3Rpb24gd2hpY2ggZGVzdHJveXMgYW4gTFZpZXcsXG4gKiBjb25kdWN0aW5nIGNsZWFuIHVwIChlLmcuIHJlbW92aW5nIGxpc3RlbmVycywgY2FsbGluZyBvbkRlc3Ryb3lzKS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgb2YgdGhlIGBMVmlld2AgdG8gYmUgZGVzdHJveWVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gYmUgZGVzdHJveWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveUxWaWV3KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGlmICghKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuXG4gICAgbFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdPy5kZXN0cm95KCk7XG4gICAgbFZpZXdbUkVBQ1RJVkVfSE9TVF9CSU5ESU5HX0NPTlNVTUVSXT8uZGVzdHJveSgpO1xuXG4gICAgaWYgKHJlbmRlcmVyLmRlc3Ryb3lOb2RlKSB7XG4gICAgICBhcHBseVZpZXcodFZpZXcsIGxWaWV3LCByZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICBkZXN0cm95Vmlld1RyZWUobFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgb25EZXN0cm95cyBob29rcyBmb3IgYWxsIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGluIGEgZ2l2ZW4gdmlldyBhbmQgdGhlbiByZW1vdmVzIGFsbFxuICogbGlzdGVuZXJzLiBMaXN0ZW5lcnMgYXJlIHJlbW92ZWQgYXMgdGhlIGxhc3Qgc3RlcCBzbyBldmVudHMgZGVsaXZlcmVkIGluIHRoZSBvbkRlc3Ryb3lzIGhvb2tzXG4gKiBjYW4gYmUgcHJvcGFnYXRlZCB0byBAT3V0cHV0IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCBmb3IgdGhlIGBMVmlld2AgdG8gY2xlYW4gdXAuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRvIGNsZWFuIHVwXG4gKi9cbmZ1bmN0aW9uIGNsZWFuVXBWaWV3KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGlmICghKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSkge1xuICAgIC8vIFVzdWFsbHkgdGhlIEF0dGFjaGVkIGZsYWcgaXMgcmVtb3ZlZCB3aGVuIHRoZSB2aWV3IGlzIGRldGFjaGVkIGZyb20gaXRzIHBhcmVudCwgaG93ZXZlclxuICAgIC8vIGlmIGl0J3MgYSByb290IHZpZXcsIHRoZSBmbGFnIHdvbid0IGJlIHVuc2V0IGhlbmNlIHdoeSB3ZSdyZSBhbHNvIHJlbW92aW5nIG9uIGRlc3Ryb3kuXG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuXG4gICAgLy8gTWFyayB0aGUgTFZpZXcgYXMgZGVzdHJveWVkICpiZWZvcmUqIGV4ZWN1dGluZyB0aGUgb25EZXN0cm95IGhvb2tzLiBBbiBvbkRlc3Ryb3kgaG9va1xuICAgIC8vIHJ1bnMgYXJiaXRyYXJ5IHVzZXIgY29kZSwgd2hpY2ggY291bGQgaW5jbHVkZSBpdHMgb3duIGB2aWV3UmVmLmRlc3Ryb3koKWAgKG9yIHNpbWlsYXIpLiBJZlxuICAgIC8vIFdlIGRvbid0IGZsYWcgdGhlIHZpZXcgYXMgZGVzdHJveWVkIGJlZm9yZSB0aGUgaG9va3MsIHRoaXMgY291bGQgbGVhZCB0byBhbiBpbmZpbml0ZSBsb29wLlxuICAgIC8vIFRoaXMgYWxzbyBhbGlnbnMgd2l0aCB0aGUgVmlld0VuZ2luZSBiZWhhdmlvci4gSXQgYWxzbyBtZWFucyB0aGF0IHRoZSBvbkRlc3Ryb3kgaG9vayBpc1xuICAgIC8vIHJlYWxseSBtb3JlIG9mIGFuIFwiYWZ0ZXJEZXN0cm95XCIgaG9vayBpZiB5b3UgdGhpbmsgYWJvdXQgaXQuXG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGVzdHJveWVkO1xuXG4gICAgZXhlY3V0ZU9uRGVzdHJveXModFZpZXcsIGxWaWV3KTtcbiAgICBwcm9jZXNzQ2xlYW51cHModFZpZXcsIGxWaWV3KTtcbiAgICAvLyBGb3IgY29tcG9uZW50IHZpZXdzIG9ubHksIHRoZSBsb2NhbCByZW5kZXJlciBpcyBkZXN0cm95ZWQgYXQgY2xlYW4gdXAgdGltZS5cbiAgICBpZiAobFZpZXdbVFZJRVddLnR5cGUgPT09IFRWaWV3VHlwZS5Db21wb25lbnQpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgICBsVmlld1tSRU5ERVJFUl0uZGVzdHJveSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uQ29udGFpbmVyID0gbFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gICAgLy8gd2UgYXJlIGRlYWxpbmcgd2l0aCBhbiBlbWJlZGRlZCB2aWV3IHRoYXQgaXMgc3RpbGwgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lclxuICAgIGlmIChkZWNsYXJhdGlvbkNvbnRhaW5lciAhPT0gbnVsbCAmJiBpc0xDb250YWluZXIobFZpZXdbUEFSRU5UXSkpIHtcbiAgICAgIC8vIGFuZCB0aGlzIGlzIGEgcHJvamVjdGVkIHZpZXdcbiAgICAgIGlmIChkZWNsYXJhdGlvbkNvbnRhaW5lciAhPT0gbFZpZXdbUEFSRU5UXSkge1xuICAgICAgICBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXIsIGxWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGVtYmVkZGVkIHZpZXdzIHN0aWxsIGF0dGFjaGVkIHRvIGEgY29udGFpbmVyOiByZW1vdmUgcXVlcnkgcmVzdWx0IGZyb20gdGhpcyB2aWV3LlxuICAgICAgY29uc3QgbFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgICAgIGlmIChsUXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgICBsUXVlcmllcy5kZXRhY2hWaWV3KHRWaWV3KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVbnJlZ2lzdGVyIHRoZSB2aWV3IG9uY2UgZXZlcnl0aGluZyBlbHNlIGhhcyBiZWVuIGNsZWFuZWQgdXAuXG4gICAgdW5yZWdpc3RlckxWaWV3KGxWaWV3KTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiBwcm9jZXNzQ2xlYW51cHModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdITtcbiAgaWYgKHRDbGVhbnVwICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgdENsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBuYXRpdmUgRE9NIGxpc3RlbmVyLiBJdCB3aWxsIG9jY3VweSA0IGVudHJpZXMgaW4gdGhlIFRDbGVhbnVwIGFycmF5IChoZW5jZSBpICs9XG4gICAgICAgIC8vIDIgYXQgdGhlIGVuZCBvZiB0aGlzIGJsb2NrKS5cbiAgICAgICAgY29uc3QgdGFyZ2V0SWR4ID0gdENsZWFudXBbaSArIDNdO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TnVtYmVyKHRhcmdldElkeCwgJ2NsZWFudXAgdGFyZ2V0IG11c3QgYmUgYSBudW1iZXInKTtcbiAgICAgICAgaWYgKHRhcmdldElkeCA+PSAwKSB7XG4gICAgICAgICAgLy8gdW5yZWdpc3RlclxuICAgICAgICAgIGxDbGVhbnVwW3RhcmdldElkeF0oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTdWJzY3JpcHRpb25cbiAgICAgICAgICBsQ2xlYW51cFstdGFyZ2V0SWR4XS51bnN1YnNjcmliZSgpO1xuICAgICAgICB9XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgaXMgZ3JvdXBlZCB3aXRoIHRoZSBpbmRleCBvZiBpdHMgY29udGV4dFxuICAgICAgICBjb25zdCBjb250ZXh0ID0gbENsZWFudXBbdENsZWFudXBbaSArIDFdXTtcbiAgICAgICAgdENsZWFudXBbaV0uY2FsbChjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGxDbGVhbnVwICE9PSBudWxsKSB7XG4gICAgbFZpZXdbQ0xFQU5VUF0gPSBudWxsO1xuICB9XG4gIGNvbnN0IGRlc3Ryb3lIb29rcyA9IGxWaWV3W09OX0RFU1RST1lfSE9PS1NdO1xuICBpZiAoZGVzdHJveUhvb2tzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXN0cm95SG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlc3Ryb3lIb29rc0ZuID0gZGVzdHJveUhvb2tzW2ldO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEZ1bmN0aW9uKGRlc3Ryb3lIb29rc0ZuLCAnRXhwZWN0aW5nIGRlc3Ryb3kgaG9vayB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgICAgZGVzdHJveUhvb2tzRm4oKTtcbiAgICB9XG4gICAgbFZpZXdbT05fREVTVFJPWV9IT09LU10gPSBudWxsO1xuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgbGV0IGRlc3Ryb3lIb29rczogRGVzdHJveUhvb2tEYXRhfG51bGw7XG5cbiAgaWYgKHRWaWV3ICE9IG51bGwgJiYgKGRlc3Ryb3lIb29rcyA9IHRWaWV3LmRlc3Ryb3lIb29rcykgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzdHJveUhvb2tzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdbZGVzdHJveUhvb2tzW2ldIGFzIG51bWJlcl07XG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgZGVzdHJveSBob29rIGlmIHRoZSBjb250ZXh0IGhhcyBiZWVuIHJlcXVlc3RlZC5cbiAgICAgIGlmICghKGNvbnRleHQgaW5zdGFuY2VvZiBOb2RlSW5qZWN0b3JGYWN0b3J5KSkge1xuICAgICAgICBjb25zdCB0b0NhbGwgPSBkZXN0cm95SG9va3NbaSArIDFdIGFzIEhvb2tGbiB8IEhvb2tEYXRhO1xuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRvQ2FsbCkpIHtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvQ2FsbC5sZW5ndGg7IGogKz0gMikge1xuICAgICAgICAgICAgY29uc3QgY2FsbENvbnRleHQgPSBjb250ZXh0W3RvQ2FsbFtqXSBhcyBudW1iZXJdO1xuICAgICAgICAgICAgY29uc3QgaG9vayA9IHRvQ2FsbFtqICsgMV0gYXMgSG9va0ZuO1xuICAgICAgICAgICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5MaWZlY3ljbGVIb29rU3RhcnQsIGNhbGxDb250ZXh0LCBob29rKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGhvb2suY2FsbChjYWxsQ29udGV4dCk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICBwcm9maWxlcihQcm9maWxlckV2ZW50LkxpZmVjeWNsZUhvb2tFbmQsIGNhbGxDb250ZXh0LCBob29rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5MaWZlY3ljbGVIb29rU3RhcnQsIGNvbnRleHQsIHRvQ2FsbCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRvQ2FsbC5jYWxsKGNvbnRleHQpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBwcm9maWxlcihQcm9maWxlckV2ZW50LkxpZmVjeWNsZUhvb2tFbmQsIGNvbnRleHQsIHRvQ2FsbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBlbGVtZW50IGlmIGEgbm9kZSBjYW4gYmUgaW5zZXJ0ZWQgaW50byB0aGUgZ2l2ZW4gcGFyZW50LlxuICpcbiAqIFRoZXJlIGFyZSB0d28gcmVhc29ucyB3aHkgd2UgbWF5IG5vdCBiZSBhYmxlIHRvIGluc2VydCBhIGVsZW1lbnQgaW1tZWRpYXRlbHkuXG4gKiAtIFByb2plY3Rpb246IFdoZW4gY3JlYXRpbmcgYSBjaGlsZCBjb250ZW50IGVsZW1lbnQgb2YgYSBjb21wb25lbnQsIHdlIGhhdmUgdG8gc2tpcCB0aGVcbiAqICAgaW5zZXJ0aW9uIGJlY2F1c2UgdGhlIGNvbnRlbnQgb2YgYSBjb21wb25lbnQgd2lsbCBiZSBwcm9qZWN0ZWQuXG4gKiAgIGA8Y29tcG9uZW50Pjxjb250ZW50PmRlbGF5ZWQgZHVlIHRvIHByb2plY3Rpb248L2NvbnRlbnQ+PC9jb21wb25lbnQ+YFxuICogLSBQYXJlbnQgY29udGFpbmVyIGlzIGRpc2Nvbm5lY3RlZDogVGhpcyBjYW4gaGFwcGVuIHdoZW4gd2UgYXJlIGluc2VydGluZyBhIHZpZXcgaW50b1xuICogICBwYXJlbnQgY29udGFpbmVyLCB3aGljaCBpdHNlbGYgaXMgZGlzY29ubmVjdGVkLiBGb3IgZXhhbXBsZSB0aGUgcGFyZW50IGNvbnRhaW5lciBpcyBwYXJ0XG4gKiAgIG9mIGEgVmlldyB3aGljaCBoYXMgbm90IGJlIGluc2VydGVkIG9yIGlzIG1hZGUgZm9yIHByb2plY3Rpb24gYnV0IGhhcyBub3QgYmVlbiBpbnNlcnRlZFxuICogICBpbnRvIGRlc3RpbmF0aW9uLlxuICpcbiAqIEBwYXJhbSB0VmlldzogQ3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIHROb2RlOiBgVE5vZGVgIGZvciB3aGljaCB3ZSB3aXNoIHRvIHJldHJpZXZlIHJlbmRlciBwYXJlbnQuXG4gKiBAcGFyYW0gbFZpZXc6IEN1cnJlbnQgYExWaWV3YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFJFbGVtZW50KHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgcmV0dXJuIGdldENsb3Nlc3RSRWxlbWVudCh0VmlldywgdE5vZGUucGFyZW50LCBsVmlldyk7XG59XG5cbi8qKlxuICogR2V0IGNsb3Nlc3QgYFJFbGVtZW50YCBvciBgbnVsbGAgaWYgaXQgY2FuJ3QgYmUgZm91bmQuXG4gKlxuICogSWYgYFROb2RlYCBpcyBgVE5vZGVUeXBlLkVsZW1lbnRgID0+IHJldHVybiBgUkVsZW1lbnRgIGF0IGBMVmlld1t0Tm9kZS5pbmRleF1gIGxvY2F0aW9uLlxuICogSWYgYFROb2RlYCBpcyBgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXJ8SWN1Q29udGFpbmAgPT4gcmV0dXJuIHRoZSBwYXJlbnQgKHJlY3Vyc2l2ZWx5KS5cbiAqIElmIGBUTm9kZWAgaXMgYG51bGxgIHRoZW4gcmV0dXJuIGhvc3QgYFJFbGVtZW50YDpcbiAqICAgLSByZXR1cm4gYG51bGxgIGlmIHByb2plY3Rpb25cbiAqICAgLSByZXR1cm4gYG51bGxgIGlmIHBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkICh3ZSBoYXZlIG5vIHBhcmVudC4pXG4gKlxuICogQHBhcmFtIHRWaWV3OiBDdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gdE5vZGU6IGBUTm9kZWAgZm9yIHdoaWNoIHdlIHdpc2ggdG8gcmV0cmlldmUgYFJFbGVtZW50YCAob3IgYG51bGxgIGlmIGhvc3QgZWxlbWVudCBpc1xuICogICAgIG5lZWRlZCkuXG4gKiBAcGFyYW0gbFZpZXc6IEN1cnJlbnQgYExWaWV3YC5cbiAqIEByZXR1cm5zIGBudWxsYCBpZiB0aGUgYFJFbGVtZW50YCBjYW4ndCBiZSBkZXRlcm1pbmVkIGF0IHRoaXMgdGltZSAobm8gcGFyZW50IC8gcHJvamVjdGlvbilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENsb3Nlc3RSRWxlbWVudCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZXxudWxsLCBsVmlldzogTFZpZXcpOiBSRWxlbWVudHxudWxsIHtcbiAgbGV0IHBhcmVudFROb2RlOiBUTm9kZXxudWxsID0gdE5vZGU7XG4gIC8vIFNraXAgb3ZlciBlbGVtZW50IGFuZCBJQ1UgY29udGFpbmVycyBhcyB0aG9zZSBhcmUgcmVwcmVzZW50ZWQgYnkgYSBjb21tZW50IG5vZGUgYW5kXG4gIC8vIGNhbid0IGJlIHVzZWQgYXMgYSByZW5kZXIgcGFyZW50LlxuICB3aGlsZSAocGFyZW50VE5vZGUgIT09IG51bGwgJiZcbiAgICAgICAgIChwYXJlbnRUTm9kZS50eXBlICYgKFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyIHwgVE5vZGVUeXBlLkljdSkpKSB7XG4gICAgdE5vZGUgPSBwYXJlbnRUTm9kZTtcbiAgICBwYXJlbnRUTm9kZSA9IHROb2RlLnBhcmVudDtcbiAgfVxuXG4gIC8vIElmIHRoZSBwYXJlbnQgdE5vZGUgaXMgbnVsbCwgdGhlbiB3ZSBhcmUgaW5zZXJ0aW5nIGFjcm9zcyB2aWV3czogZWl0aGVyIGludG8gYW4gZW1iZWRkZWQgdmlld1xuICAvLyBvciBhIGNvbXBvbmVudCB2aWV3LlxuICBpZiAocGFyZW50VE5vZGUgPT09IG51bGwpIHtcbiAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGEgcm9vdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgdmlldyBpbnRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFuZFxuICAgIC8vIGl0IHNob3VsZCBhbHdheXMgYmUgZWFnZXIuXG4gICAgcmV0dXJuIGxWaWV3W0hPU1RdO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUocGFyZW50VE5vZGUsIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIGNvbnN0IHtjb21wb25lbnRPZmZzZXR9ID0gcGFyZW50VE5vZGU7XG4gICAgaWYgKGNvbXBvbmVudE9mZnNldCA+IC0xKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyhwYXJlbnRUTm9kZSwgbFZpZXcpO1xuICAgICAgY29uc3Qge2VuY2Fwc3VsYXRpb259ID1cbiAgICAgICAgICAodFZpZXcuZGF0YVtwYXJlbnRUTm9kZS5kaXJlY3RpdmVTdGFydCArIGNvbXBvbmVudE9mZnNldF0gYXMgQ29tcG9uZW50RGVmPHVua25vd24+KTtcbiAgICAgIC8vIFdlJ3ZlIGdvdCBhIHBhcmVudCB3aGljaCBpcyBhbiBlbGVtZW50IGluIHRoZSBjdXJyZW50IHZpZXcuIFdlIGp1c3QgbmVlZCB0byB2ZXJpZnkgaWYgdGhlXG4gICAgICAvLyBwYXJlbnQgZWxlbWVudCBpcyBub3QgYSBjb21wb25lbnQuIENvbXBvbmVudCdzIGNvbnRlbnQgbm9kZXMgYXJlIG5vdCBpbnNlcnRlZCBpbW1lZGlhdGVseVxuICAgICAgLy8gYmVjYXVzZSB0aGV5IHdpbGwgYmUgcHJvamVjdGVkLCBhbmQgc28gZG9pbmcgaW5zZXJ0IGF0IHRoaXMgcG9pbnQgd291bGQgYmUgd2FzdGVmdWwuXG4gICAgICAvLyBTaW5jZSB0aGUgcHJvamVjdGlvbiB3b3VsZCB0aGVuIG1vdmUgaXQgdG8gaXRzIGZpbmFsIGRlc3RpbmF0aW9uLiBOb3RlIHRoYXQgd2UgY2FuJ3RcbiAgICAgIC8vIG1ha2UgdGhpcyBhc3N1bXB0aW9uIHdoZW4gdXNpbmcgdGhlIFNoYWRvdyBET00sIGJlY2F1c2UgdGhlIG5hdGl2ZSBwcm9qZWN0aW9uIHBsYWNlaG9sZGVyc1xuICAgICAgLy8gKDxjb250ZW50PiBvciA8c2xvdD4pIGhhdmUgdG8gYmUgaW4gcGxhY2UgYXMgZWxlbWVudHMgYXJlIGJlaW5nIGluc2VydGVkLlxuICAgICAgaWYgKGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUgfHxcbiAgICAgICAgICBlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZShwYXJlbnRUTm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5hdGl2ZSBub2RlIGJlZm9yZSBhbm90aGVyIG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIHBhcmVudC5cbiAqIFRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgd2hlbiBuYXRpdmUgbm9kZXMgd2VyZSBkZXRlcm1pbmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbmF0aXZlSW5zZXJ0QmVmb3JlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgcGFyZW50OiBSRWxlbWVudCwgY2hpbGQ6IFJOb2RlLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsLFxuICAgIGlzTW92ZTogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVySW5zZXJ0QmVmb3JlKys7XG4gIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlLCBpc01vdmUpO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQXBwZW5kQ2hpbGQrKztcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocGFyZW50LCAncGFyZW50IG5vZGUgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudCwgY2hpbGQpO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCwgaXNNb3ZlOiBib29sZWFuKSB7XG4gIGlmIChiZWZvcmVOb2RlICE9PSBudWxsKSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlLCBpc01vdmUpO1xuICB9IGVsc2Uge1xuICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkKTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBhIG5vZGUgZnJvbSB0aGUgRE9NIGdpdmVuIGl0cyBuYXRpdmUgcGFyZW50LiAqL1xuZnVuY3Rpb24gbmF0aXZlUmVtb3ZlQ2hpbGQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBwYXJlbnQ6IFJFbGVtZW50LCBjaGlsZDogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIHJlbmRlcmVyLnJlbW92ZUNoaWxkKHBhcmVudCwgY2hpbGQsIGlzSG9zdEVsZW1lbnQpO1xufVxuXG4vKiogQ2hlY2tzIGlmIGFuIGVsZW1lbnQgaXMgYSBgPHRlbXBsYXRlPmAgbm9kZS4gKi9cbmZ1bmN0aW9uIGlzVGVtcGxhdGVOb2RlKG5vZGU6IFJFbGVtZW50KTogbm9kZSBpcyBSVGVtcGxhdGUge1xuICByZXR1cm4gbm9kZS50YWdOYW1lID09PSAnVEVNUExBVEUnICYmIChub2RlIGFzIFJUZW1wbGF0ZSkuY29udGVudCAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgcGFyZW50IG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgbm9kZTogUk5vZGUpOiBSRWxlbWVudHxudWxsIHtcbiAgcmV0dXJuIHJlbmRlcmVyLnBhcmVudE5vZGUobm9kZSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG5hdGl2ZSBzaWJsaW5nIG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVOZXh0U2libGluZyhyZW5kZXJlcjogUmVuZGVyZXIsIG5vZGU6IFJOb2RlKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiByZW5kZXJlci5uZXh0U2libGluZyhub2RlKTtcbn1cblxuLyoqXG4gKiBGaW5kIGEgbm9kZSBpbiBmcm9udCBvZiB3aGljaCBgY3VycmVudFROb2RlYCBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKlxuICogVGhpcyBtZXRob2QgZGV0ZXJtaW5lcyB0aGUgYFJOb2RlYCBpbiBmcm9udCBvZiB3aGljaCB3ZSBzaG91bGQgaW5zZXJ0IHRoZSBgY3VycmVudFJOb2RlYC4gVGhpc1xuICogdGFrZXMgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YCBpbnRvIGFjY291bnQgaWYgaTE4biBjb2RlIGhhcyBiZWVuIGludm9rZWQuXG4gKlxuICogQHBhcmFtIHBhcmVudFROb2RlIHBhcmVudCBgVE5vZGVgXG4gKiBAcGFyYW0gY3VycmVudFROb2RlIGN1cnJlbnQgYFROb2RlYCAoVGhlIG5vZGUgd2hpY2ggd2Ugd291bGQgbGlrZSB0byBpbnNlcnQgaW50byB0aGUgRE9NKVxuICogQHBhcmFtIGxWaWV3IGN1cnJlbnQgYExWaWV3YFxuICovXG5mdW5jdGlvbiBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZShwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJOb2RlfFxuICAgIG51bGwge1xuICByZXR1cm4gX2dldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG4ocGFyZW50VE5vZGUsIGN1cnJlbnRUTm9kZSwgbFZpZXcpO1xufVxuXG5cbi8qKlxuICogRmluZCBhIG5vZGUgaW4gZnJvbnQgb2Ygd2hpY2ggYGN1cnJlbnRUTm9kZWAgc2hvdWxkIGJlIGluc2VydGVkLiAoRG9lcyBub3QgdGFrZSBpMThuIGludG9cbiAqIGFjY291bnQpXG4gKlxuICogVGhpcyBtZXRob2QgZGV0ZXJtaW5lcyB0aGUgYFJOb2RlYCBpbiBmcm9udCBvZiB3aGljaCB3ZSBzaG91bGQgaW5zZXJ0IHRoZSBgY3VycmVudFJOb2RlYC4gVGhpc1xuICogZG9lcyBub3QgdGFrZSBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgIGludG8gYWNjb3VudC5cbiAqXG4gKiBAcGFyYW0gcGFyZW50VE5vZGUgcGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSBjdXJyZW50VE5vZGUgY3VycmVudCBgVE5vZGVgIChUaGUgbm9kZSB3aGljaCB3ZSB3b3VsZCBsaWtlIHRvIGluc2VydCBpbnRvIHRoZSBET00pXG4gKiBAcGFyYW0gbFZpZXcgY3VycmVudCBgTFZpZXdgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhOb0kxOG4oXG4gICAgcGFyZW50VE5vZGU6IFROb2RlLCBjdXJyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSTm9kZXxudWxsIHtcbiAgaWYgKHBhcmVudFROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfCBUTm9kZVR5cGUuSWN1KSkge1xuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBsVmlldyk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogVHJlZSBzaGFrYWJsZSBib3VuZGFyeSBmb3IgYGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG5gIGZ1bmN0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBvbmx5IGJlIHNldCBpZiBpMThuIGNvZGUgcnVucy5cbiAqL1xubGV0IF9nZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuOiAocGFyZW50VE5vZGU6IFROb2RlLCBjdXJyZW50VE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+XG4gICAgUk5vZGUgfCBudWxsID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoTm9JMThuO1xuXG4vKipcbiAqIFRyZWUgc2hha2FibGUgYm91bmRhcnkgZm9yIGBwcm9jZXNzSTE4bkluc2VydEJlZm9yZWAgZnVuY3Rpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG9ubHkgYmUgc2V0IGlmIGkxOG4gY29kZSBydW5zLlxuICovXG5sZXQgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlOiAoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBjaGlsZFROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBjaGlsZFJOb2RlOiBSTm9kZXxSTm9kZVtdLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsKSA9PiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0STE4bkhhbmRsaW5nKFxuICAgIGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG46IChwYXJlbnRUTm9kZTogVE5vZGUsIGN1cnJlbnRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT5cbiAgICAgICAgUk5vZGUgfCBudWxsLFxuICAgIHByb2Nlc3NJMThuSW5zZXJ0QmVmb3JlOiAoXG4gICAgICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgY2hpbGRUTm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgY2hpbGRSTm9kZTogUk5vZGV8Uk5vZGVbXSxcbiAgICAgICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwpID0+IHZvaWQpIHtcbiAgX2dldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG4gPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuO1xuICBfcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmUgPSBwcm9jZXNzSTE4bkluc2VydEJlZm9yZTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIHRoZSBgY2hpbGRgIG5hdGl2ZSBub2RlIChvciBhIGNvbGxlY3Rpb24gb2Ygbm9kZXMpIHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgdG8gYmUgYXBwZW5kZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgY3VycmVudCBMVmlld1xuICogQHBhcmFtIGNoaWxkUk5vZGUgVGhlIG5hdGl2ZSBjaGlsZCAob3IgY2hpbGRyZW4pIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gY2hpbGRUTm9kZSBUaGUgVE5vZGUgb2YgdGhlIGNoaWxkIGVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENoaWxkKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjaGlsZFJOb2RlOiBSTm9kZXxSTm9kZVtdLCBjaGlsZFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBjb25zdCBwYXJlbnRSTm9kZSA9IGdldFBhcmVudFJFbGVtZW50KHRWaWV3LCBjaGlsZFROb2RlLCBsVmlldyk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBjb25zdCBwYXJlbnRUTm9kZTogVE5vZGUgPSBjaGlsZFROb2RlLnBhcmVudCB8fCBsVmlld1tUX0hPU1RdITtcbiAgY29uc3QgYW5jaG9yTm9kZSA9IGdldEluc2VydEluRnJvbnRPZlJOb2RlKHBhcmVudFROb2RlLCBjaGlsZFROb2RlLCBsVmlldyk7XG4gIGlmIChwYXJlbnRSTm9kZSAhPSBudWxsKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRSTm9kZSkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRSTm9kZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50Uk5vZGUsIGNoaWxkUk5vZGVbaV0sIGFuY2hvck5vZGUsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCBjaGlsZFJOb2RlLCBhbmNob3JOb2RlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgIF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZShyZW5kZXJlciwgY2hpbGRUTm9kZSwgbFZpZXcsIGNoaWxkUk5vZGUsIHBhcmVudFJOb2RlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBuYXRpdmUgbm9kZSBmb3IgYSBnaXZlbiBMVmlldywgc3RhcnRpbmcgZnJvbSB0aGUgcHJvdmlkZWQgVE5vZGUuXG4gKlxuICogTmF0aXZlIG5vZGVzIGFyZSByZXR1cm5lZCBpbiB0aGUgb3JkZXIgaW4gd2hpY2ggdGhvc2UgYXBwZWFyIGluIHRoZSBuYXRpdmUgdHJlZSAoRE9NKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZXxudWxsKTogUk5vZGV8bnVsbCB7XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICB0Tm9kZSxcbiAgICAgICAgICAgIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuSWN1IHwgVE5vZGVUeXBlLlByb2plY3Rpb24pO1xuXG4gICAgY29uc3QgdE5vZGVUeXBlID0gdE5vZGUudHlwZTtcbiAgICBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB7XG4gICAgICByZXR1cm4gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpO1xuICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgcmV0dXJuIGdldEJlZm9yZU5vZGVGb3JWaWV3KC0xLCBsVmlld1t0Tm9kZS5pbmRleF0pO1xuICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgIGNvbnN0IGVsSWN1Q29udGFpbmVyQ2hpbGQgPSB0Tm9kZS5jaGlsZDtcbiAgICAgIGlmIChlbEljdUNvbnRhaW5lckNoaWxkICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIGVsSWN1Q29udGFpbmVyQ2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgck5vZGVPckxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgICAgIGlmIChpc0xDb250YWluZXIock5vZGVPckxDb250YWluZXIpKSB7XG4gICAgICAgICAgcmV0dXJuIGdldEJlZm9yZU5vZGVGb3JWaWV3KC0xLCByTm9kZU9yTENvbnRhaW5lcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHVud3JhcFJOb2RlKHJOb2RlT3JMQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkljdSkge1xuICAgICAgbGV0IG5leHRSTm9kZSA9IGljdUNvbnRhaW5lckl0ZXJhdGUodE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgICAgIGxldCByTm9kZTogUk5vZGV8bnVsbCA9IG5leHRSTm9kZSgpO1xuICAgICAgLy8gSWYgdGhlIElDVSBjb250YWluZXIgaGFzIG5vIG5vZGVzLCB0aGFuIHdlIHVzZSB0aGUgSUNVIGFuY2hvciBhcyB0aGUgbm9kZS5cbiAgICAgIHJldHVybiByTm9kZSB8fCB1bndyYXBSTm9kZShsVmlld1t0Tm9kZS5pbmRleF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcm9qZWN0aW9uTm9kZXMgPSBnZXRQcm9qZWN0aW9uTm9kZXMobFZpZXcsIHROb2RlKTtcbiAgICAgIGlmIChwcm9qZWN0aW9uTm9kZXMgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvamVjdGlvbk5vZGVzKSkge1xuICAgICAgICAgIHJldHVybiBwcm9qZWN0aW9uTm9kZXNbMF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyZW50VmlldyA9IGdldExWaWV3UGFyZW50KGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSk7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRQYXJlbnRWaWV3KHBhcmVudFZpZXcpO1xuICAgICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKHBhcmVudFZpZXchLCBwcm9qZWN0aW9uTm9kZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgdE5vZGUubmV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0aW9uTm9kZXMobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCk6IFROb2RlfFJOb2RlW118bnVsbCB7XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgY29uc3Qgc2xvdElkeCA9IHROb2RlLnByb2plY3Rpb24gYXMgbnVtYmVyO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRQcm9qZWN0aW9uU2xvdHMobFZpZXcpO1xuICAgIHJldHVybiBjb21wb25lbnRIb3N0LnByb2plY3Rpb24hW3Nsb3RJZHhdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmVmb3JlTm9kZUZvclZpZXcodmlld0luZGV4SW5Db250YWluZXI6IG51bWJlciwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IFJOb2RlfFxuICAgIG51bGwge1xuICBjb25zdCBuZXh0Vmlld0luZGV4ID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQgKyB2aWV3SW5kZXhJbkNvbnRhaW5lciArIDE7XG4gIGlmIChuZXh0Vmlld0luZGV4IDwgbENvbnRhaW5lci5sZW5ndGgpIHtcbiAgICBjb25zdCBsVmlldyA9IGxDb250YWluZXJbbmV4dFZpZXdJbmRleF0gYXMgTFZpZXc7XG4gICAgY29uc3QgZmlyc3RUTm9kZU9mVmlldyA9IGxWaWV3W1RWSUVXXS5maXJzdENoaWxkO1xuICAgIGlmIChmaXJzdFROb2RlT2ZWaWV3ICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3LCBmaXJzdFROb2RlT2ZWaWV3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbENvbnRhaW5lcltOQVRJVkVdO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBuYXRpdmUgbm9kZSBpdHNlbGYgdXNpbmcgYSBnaXZlbiByZW5kZXJlci4gVG8gcmVtb3ZlIHRoZSBub2RlIHdlIGFyZSBsb29raW5nIHVwIGl0c1xuICogcGFyZW50IGZyb20gdGhlIG5hdGl2ZSB0cmVlIGFzIG5vdCBhbGwgcGxhdGZvcm1zIC8gYnJvd3NlcnMgc3VwcG9ydCB0aGUgZXF1aXZhbGVudCBvZlxuICogbm9kZS5yZW1vdmUoKS5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byBiZSB1c2VkXG4gKiBAcGFyYW0gck5vZGUgVGhlIG5hdGl2ZSBub2RlIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSBpc0hvc3RFbGVtZW50IEEgZmxhZyBpbmRpY2F0aW5nIGlmIGEgbm9kZSB0byBiZSByZW1vdmVkIGlzIGEgaG9zdCBvZiBhIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXI6IFJlbmRlcmVyLCByTm9kZTogUk5vZGUsIGlzSG9zdEVsZW1lbnQ/OiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG4gIGNvbnN0IG5hdGl2ZVBhcmVudCA9IG5hdGl2ZVBhcmVudE5vZGUocmVuZGVyZXIsIHJOb2RlKTtcbiAgaWYgKG5hdGl2ZVBhcmVudCkge1xuICAgIG5hdGl2ZVJlbW92ZUNoaWxkKHJlbmRlcmVyLCBuYXRpdmVQYXJlbnQsIHJOb2RlLCBpc0hvc3RFbGVtZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIENsZWFycyB0aGUgY29udGVudHMgb2YgYSBnaXZlbiBSRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gckVsZW1lbnQgdGhlIG5hdGl2ZSBSRWxlbWVudCB0byBiZSBjbGVhcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckVsZW1lbnRDb250ZW50cyhyRWxlbWVudDogUkVsZW1lbnQpOiB2b2lkIHtcbiAgckVsZW1lbnQudGV4dENvbnRlbnQgPSAnJztcbn1cblxuXG4vKipcbiAqIFBlcmZvcm1zIHRoZSBvcGVyYXRpb24gb2YgYGFjdGlvbmAgb24gdGhlIG5vZGUuIFR5cGljYWxseSB0aGlzIGludm9sdmVzIGluc2VydGluZyBvciByZW1vdmluZ1xuICogbm9kZXMgb24gdGhlIExWaWV3IG9yIHByb2plY3Rpb24gYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Tm9kZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIHROb2RlOiBUTm9kZXxudWxsLCBsVmlldzogTFZpZXcsXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwsIGlzUHJvamVjdGlvbjogYm9vbGVhbikge1xuICB3aGlsZSAodE5vZGUgIT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBsVmlldyk7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgICAgIHROb2RlLFxuICAgICAgICAgICAgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lciB8IFROb2RlVHlwZS5Qcm9qZWN0aW9uIHwgVE5vZGVUeXBlLkljdSk7XG4gICAgY29uc3QgcmF3U2xvdFZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgIGNvbnN0IHROb2RlVHlwZSA9IHROb2RlLnR5cGU7XG4gICAgaWYgKGlzUHJvamVjdGlvbikge1xuICAgICAgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5DcmVhdGUpIHtcbiAgICAgICAgcmF3U2xvdFZhbHVlICYmIGF0dGFjaFBhdGNoRGF0YSh1bndyYXBSTm9kZShyYXdTbG90VmFsdWUpLCBsVmlldyk7XG4gICAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpICE9PSBUTm9kZUZsYWdzLmlzRGV0YWNoZWQpIHtcbiAgICAgIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgICBhcHBseU5vZGVzKHJlbmRlcmVyLCBhY3Rpb24sIHROb2RlLmNoaWxkLCBsVmlldywgcGFyZW50UkVsZW1lbnQsIGJlZm9yZU5vZGUsIGZhbHNlKTtcbiAgICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgcmF3U2xvdFZhbHVlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkljdSkge1xuICAgICAgICBjb25zdCBuZXh0Uk5vZGUgPSBpY3VDb250YWluZXJJdGVyYXRlKHROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlLCBsVmlldyk7XG4gICAgICAgIGxldCByTm9kZTogUk5vZGV8bnVsbDtcbiAgICAgICAgd2hpbGUgKHJOb2RlID0gbmV4dFJOb2RlKCkpIHtcbiAgICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByTm9kZSwgYmVmb3JlTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgcmF3U2xvdFZhbHVlLCBiZWZvcmVOb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICAgICAgICAgICAgcmVuZGVyZXIsIGFjdGlvbiwgbFZpZXcsIHROb2RlIGFzIFRQcm9qZWN0aW9uTm9kZSwgcGFyZW50UkVsZW1lbnQsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gaXNQcm9qZWN0aW9uID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICB9XG59XG5cblxuLyoqXG4gKiBgYXBwbHlWaWV3YCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHZpZXcgYXMgc3BlY2lmaWVkIGluIGBhY3Rpb25gIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqXG4gKiBJbnNlcnRpbmcgYSB2aWV3IHdpdGhvdXQgcHJvamVjdGlvbiBvciBjb250YWluZXJzIGF0IHRvcCBsZXZlbCBpcyBzaW1wbGUuIEp1c3QgaXRlcmF0ZSBvdmVyIHRoZVxuICogcm9vdCBub2RlcyBvZiB0aGUgVmlldywgYW5kIGZvciBlYWNoIG5vZGUgcGVyZm9ybSB0aGUgYGFjdGlvbmAuXG4gKlxuICogVGhpbmdzIGdldCBtb3JlIGNvbXBsaWNhdGVkIHdpdGggY29udGFpbmVycyBhbmQgcHJvamVjdGlvbnMuIFRoYXQgaXMgYmVjYXVzZSBjb21pbmcgYWNyb3NzOlxuICogLSBDb250YWluZXI6IGltcGxpZXMgdGhhdCB3ZSBoYXZlIHRvIGluc2VydC9yZW1vdmUvZGVzdHJveSB0aGUgdmlld3Mgb2YgdGhhdCBjb250YWluZXIgYXMgd2VsbFxuICogICAgICAgICAgICAgIHdoaWNoIGluIHR1cm4gY2FuIGhhdmUgdGhlaXIgb3duIENvbnRhaW5lcnMgYXQgdGhlIFZpZXcgcm9vdHMuXG4gKiAtIFByb2plY3Rpb246IGltcGxpZXMgdGhhdCB3ZSBoYXZlIHRvIGluc2VydC9yZW1vdmUvZGVzdHJveSB0aGUgbm9kZXMgb2YgdGhlIHByb2plY3Rpb24uIFRoZVxuICogICAgICAgICAgICAgICBjb21wbGljYXRpb24gaXMgdGhhdCB0aGUgbm9kZXMgd2UgYXJlIHByb2plY3RpbmcgY2FuIHRoZW1zZWx2ZXMgaGF2ZSBDb250YWluZXJzXG4gKiAgICAgICAgICAgICAgIG9yIG90aGVyIFByb2plY3Rpb25zLlxuICpcbiAqIEFzIHlvdSBjYW4gc2VlIHRoaXMgaXMgYSB2ZXJ5IHJlY3Vyc2l2ZSBwcm9ibGVtLiBZZXMgcmVjdXJzaW9uIGlzIG5vdCBtb3N0IGVmZmljaWVudCBidXQgdGhlXG4gKiBjb2RlIGlzIGNvbXBsaWNhdGVkIGVub3VnaCB0aGF0IHRyeWluZyB0byBpbXBsZW1lbnRlZCB3aXRoIHJlY3Vyc2lvbiBiZWNvbWVzIHVubWFpbnRhaW5hYmxlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3JyB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZFxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIHBhcmVudFJFbGVtZW50IHBhcmVudCBET00gZWxlbWVudCBmb3IgaW5zZXJ0aW9uIChSZW1vdmFsIGRvZXMgbm90IG5lZWQgaXQpLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95LFxuICAgIHBhcmVudFJFbGVtZW50OiBudWxsLCBiZWZvcmVOb2RlOiBudWxsKTogdm9pZDtcbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpOiB2b2lkO1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIsIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbixcbiAgICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnR8bnVsbCwgYmVmb3JlTm9kZTogUk5vZGV8bnVsbCk6IHZvaWQge1xuICBhcHBseU5vZGVzKHJlbmRlcmVyLCBhY3Rpb24sIHRWaWV3LmZpcnN0Q2hpbGQsIGxWaWV3LCBwYXJlbnRSRWxlbWVudCwgYmVmb3JlTm9kZSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIGBhcHBseVByb2plY3Rpb25gIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgcHJvamVjdGlvbi5cbiAqXG4gKiBJbnNlcnRpbmcgYSBwcm9qZWN0aW9uIHJlcXVpcmVzIHVzIHRvIGxvY2F0ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuIFRoZVxuICogY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhvc2Ugbm9kZXMgdGhlbXNlbHZlcyBjb3VsZCBiZSByZS1wcm9qZWN0ZWQgZnJvbSB0aGVpciBwYXJlbnQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3YCBvZiBgTFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2Agd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIG5vZGUgdG8gcHJvamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgcGFyZW50Uk5vZGUgPSBnZXRQYXJlbnRSRWxlbWVudCh0VmlldywgdFByb2plY3Rpb25Ob2RlLCBsVmlldyk7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gdFByb2plY3Rpb25Ob2RlLnBhcmVudCB8fCBsVmlld1tUX0hPU1RdITtcbiAgbGV0IGJlZm9yZU5vZGUgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZShwYXJlbnRUTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBsVmlldyk7XG4gIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICAgIHJlbmRlcmVyLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkNyZWF0ZSwgbFZpZXcsIHRQcm9qZWN0aW9uTm9kZSwgcGFyZW50Uk5vZGUsIGJlZm9yZU5vZGUpO1xufVxuXG4vKipcbiAqIGBhcHBseVByb2plY3Rpb25SZWN1cnNpdmVgIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgcHJvamVjdGlvbiBzcGVjaWZpZWQgYnkgYGFjdGlvbmAgKGluc2VydCxcbiAqIGRldGFjaCwgZGVzdHJveSlcbiAqXG4gKiBJbnNlcnRpbmcgYSBwcm9qZWN0aW9uIHJlcXVpcmVzIHVzIHRvIGxvY2F0ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuIFRoZVxuICogY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhvc2Ugbm9kZXMgdGhlbXNlbHZlcyBjb3VsZCBiZSByZS1wcm9qZWN0ZWQgZnJvbSB0aGVpciBwYXJlbnQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIG5vZGUgdG8gcHJvamVjdFxuICogQHBhcmFtIHBhcmVudFJFbGVtZW50IHBhcmVudCBET00gZWxlbWVudCBmb3IgaW5zZXJ0aW9uL3JlbW92YWwuXG4gKiBAcGFyYW0gYmVmb3JlTm9kZSBCZWZvcmUgd2hpY2ggbm9kZSB0aGUgaW5zZXJ0aW9ucyBzaG91bGQgaGFwcGVuLlxuICovXG5mdW5jdGlvbiBhcHBseVByb2plY3Rpb25SZWN1cnNpdmUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sIGxWaWV3OiBMVmlldywgdFByb2plY3Rpb25Ob2RlOiBUUHJvamVjdGlvbk5vZGUsXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50fG51bGwsIGJlZm9yZU5vZGU6IFJOb2RlfG51bGwpIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV107XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRMVmlld1tUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh0eXBlb2YgdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24sICdudW1iZXInLCAnZXhwZWN0aW5nIHByb2plY3Rpb24gaW5kZXgnKTtcbiAgY29uc3Qgbm9kZVRvUHJvamVjdE9yUk5vZGVzID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uIVt0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbl0hO1xuICBpZiAoQXJyYXkuaXNBcnJheShub2RlVG9Qcm9qZWN0T3JSTm9kZXMpKSB7XG4gICAgLy8gVGhpcyBzaG91bGQgbm90IGV4aXN0LCBpdCBpcyBhIGJpdCBvZiBhIGhhY2suIFdoZW4gd2UgYm9vdHN0cmFwIGEgdG9wIGxldmVsIG5vZGUgYW5kIHdlXG4gICAgLy8gbmVlZCB0byBzdXBwb3J0IHBhc3NpbmcgcHJvamVjdGFibGUgbm9kZXMsIHNvIHdlIGNoZWF0IGFuZCBwdXQgdGhlbSBpbiB0aGUgVE5vZGVcbiAgICAvLyBvZiB0aGUgSG9zdCBUVmlldy4gKFllcyB3ZSBwdXQgaW5zdGFuY2UgaW5mbyBhdCB0aGUgVCBMZXZlbCkuIFdlIGNhbiBnZXQgYXdheSB3aXRoIGl0XG4gICAgLy8gYmVjYXVzZSB3ZSBrbm93IHRoYXQgdGhhdCBUVmlldyBpcyBub3Qgc2hhcmVkIGFuZCB0aGVyZWZvcmUgaXQgd2lsbCBub3QgYmUgYSBwcm9ibGVtLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIHJlZmFjdG9yZWQgYW5kIGNsZWFuZWQgdXAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJOb2RlID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzW2ldO1xuICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgck5vZGUsIGJlZm9yZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogVE5vZGV8bnVsbCA9IG5vZGVUb1Byb2plY3RPclJOb2RlcztcbiAgICBjb25zdCBwcm9qZWN0ZWRDb21wb25lbnRMVmlldyA9IGNvbXBvbmVudExWaWV3W1BBUkVOVF0gYXMgTFZpZXc7XG4gICAgYXBwbHlOb2RlcyhcbiAgICAgICAgcmVuZGVyZXIsIGFjdGlvbiwgbm9kZVRvUHJvamVjdCwgcHJvamVjdGVkQ29tcG9uZW50TFZpZXcsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlLCB0cnVlKTtcbiAgfVxufVxuXG5cbi8qKlxuICogYGFwcGx5Q29udGFpbmVyYCBwZXJmb3JtcyBhbiBvcGVyYXRpb24gb24gdGhlIGNvbnRhaW5lciBhbmQgaXRzIHZpZXdzIGFzIHNwZWNpZmllZCBieVxuICogYGFjdGlvbmAgKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICpcbiAqIEluc2VydGluZyBhIENvbnRhaW5lciBpcyBjb21wbGljYXRlZCBieSB0aGUgZmFjdCB0aGF0IHRoZSBjb250YWluZXIgbWF5IGhhdmUgVmlld3Mgd2hpY2hcbiAqIHRoZW1zZWx2ZXMgaGF2ZSBjb250YWluZXJzIG9yIHByb2plY3Rpb25zLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBhY3Rpb24gYWN0aW9uIHRvIHBlcmZvcm0gKGluc2VydCwgZGV0YWNoLCBkZXN0cm95KVxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIExDb250YWluZXIgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcGFyZW50UkVsZW1lbnQgcGFyZW50IERPTSBlbGVtZW50IGZvciBpbnNlcnRpb24vcmVtb3ZhbC5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Q29udGFpbmVyKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudHxudWxsLCBiZWZvcmVOb2RlOiBSTm9kZXxudWxsfHVuZGVmaW5lZCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcbiAgY29uc3QgYW5jaG9yID0gbENvbnRhaW5lcltOQVRJVkVdOyAgLy8gTENvbnRhaW5lciBoYXMgaXRzIG93biBiZWZvcmUgbm9kZS5cbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUobENvbnRhaW5lcik7XG4gIC8vIEFuIExDb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgb24gYW55IG5vZGUgYnkgaW5qZWN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gIC8vIEFza2luZyBmb3IgYSBWaWV3Q29udGFpbmVyUmVmIG9uIGFuIGVsZW1lbnQgd2lsbCByZXN1bHQgaW4gYSBjcmVhdGlvbiBvZiBhIHNlcGFyYXRlIGFuY2hvclxuICAvLyBub2RlIChjb21tZW50IGluIHRoZSBET00pIHRoYXQgd2lsbCBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgTENvbnRhaW5lcidzIGhvc3Qgbm9kZS4gSW4gdGhpc1xuICAvLyBwYXJ0aWN1bGFyIGNhc2Ugd2UgbmVlZCB0byBleGVjdXRlIGFjdGlvbiBvbiAyIG5vZGVzOlxuICAvLyAtIGNvbnRhaW5lcidzIGhvc3Qgbm9kZSAodGhpcyBpcyBkb25lIGluIHRoZSBleGVjdXRlQWN0aW9uT25FbGVtZW50T3JDb250YWluZXIpXG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaGVyZSlcbiAgaWYgKGFuY2hvciAhPT0gbmF0aXZlKSB7XG4gICAgLy8gVGhpcyBpcyB2ZXJ5IHN0cmFuZ2UgdG8gbWUgKE1pc2tvKS4gSSB3b3VsZCBleHBlY3QgdGhhdCB0aGUgbmF0aXZlIGlzIHNhbWUgYXMgYW5jaG9yLiBJXG4gICAgLy8gZG9uJ3Qgc2VlIGEgcmVhc29uIHdoeSB0aGV5IHNob3VsZCBiZSBkaWZmZXJlbnQsIGJ1dCB0aGV5IGFyZS5cbiAgICAvL1xuICAgIC8vIElmIHRoZXkgYXJlIHdlIG5lZWQgdG8gcHJvY2VzcyB0aGUgc2Vjb25kIGFuY2hvciBhcyB3ZWxsLlxuICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIGFuY2hvciwgYmVmb3JlTm9kZSk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICBhcHBseVZpZXcobFZpZXdbVFZJRVddLCBsVmlldywgcmVuZGVyZXIsIGFjdGlvbiwgcGFyZW50UkVsZW1lbnQsIGFuY2hvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZXMgY2xhc3Mvc3R5bGUgdG8gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgaXQgc2hvdWxkIGJlIHdyaXR0ZW4gdG8gYGNsYXNzYCAoYGZhbHNlYCB0byB3cml0ZSB0byBgc3R5bGVgKVxuICogQHBhcmFtIHJOb2RlIFRoZSBOb2RlIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgdG8gd3JpdGUgdG8uIFRoaXMgd291bGQgYmUgdGhlIGNsYXNzL3N0eWxlIG5hbWUuXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIElmIGBudWxsYC9gdW5kZWZpbmVkYC9gZmFsc2VgIHRoaXMgaXMgY29uc2lkZXJlZCBhIHJlbW92ZSAoc2V0L2FkZFxuICogICAgICAgIG90aGVyd2lzZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIHJOb2RlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAvLyBXZSBhY3R1YWxseSB3YW50IEpTIHRydWUvZmFsc2UgaGVyZSBiZWNhdXNlIGFueSB0cnV0aHkgdmFsdWUgc2hvdWxkIGFkZCB0aGUgY2xhc3NcbiAgICBpZiAoIXZhbHVlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIHJlbmRlcmVyLnJlbW92ZUNsYXNzKHJOb2RlLCBwcm9wKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICByZW5kZXJlci5hZGRDbGFzcyhyTm9kZSwgcHJvcCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBmbGFncyA9IHByb3AuaW5kZXhPZignLScpID09PSAtMSA/IHVuZGVmaW5lZCA6IFJlbmRlcmVyU3R5bGVGbGFnczIuRGFzaENhc2UgYXMgbnVtYmVyO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIC8qKiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKHJOb2RlLCBwcm9wLCBmbGFncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgdmFsdWUgaXMgaW1wb3J0YW50IGlmIGl0IGVuZHMgd2l0aCBgIWltcG9ydGFudGAuIFRoZSBzdHlsZVxuICAgICAgLy8gcGFyc2VyIHN0cmlwcyBhbnkgc2VtaWNvbG9ucyBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS5cbiAgICAgIGNvbnN0IGlzSW1wb3J0YW50ID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlLmVuZHNXaXRoKCchaW1wb3J0YW50JykgOiBmYWxzZTtcblxuICAgICAgaWYgKGlzSW1wb3J0YW50KSB7XG4gICAgICAgIC8vICFpbXBvcnRhbnQgaGFzIHRvIGJlIHN0cmlwcGVkIGZyb20gdGhlIHZhbHVlIGZvciBpdCB0byBiZSB2YWxpZC5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgwLCAtMTApO1xuICAgICAgICBmbGFncyEgfD0gUmVuZGVyZXJTdHlsZUZsYWdzMi5JbXBvcnRhbnQ7XG4gICAgICB9XG5cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgcmVuZGVyZXIuc2V0U3R5bGUock5vZGUsIHByb3AsIHZhbHVlLCBmbGFncyk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBXcml0ZSBgY3NzVGV4dGAgdG8gYFJFbGVtZW50YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgZGlyZWN0IHdyaXRlIHdpdGhvdXQgYW55IHJlY29uY2lsaWF0aW9uLiBVc2VkIGZvciB3cml0aW5nIGluaXRpYWwgdmFsdWVzLCBzb1xuICogdGhhdCBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgZG8gbm90IHB1bGwgaW4gdGhlIHN0eWxlIHBhcnNlci5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB3aGljaCBuZWVkcyB0byBiZSB1cGRhdGVkLlxuICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgY2xhc3MgbGlzdCB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRGlyZWN0U3R5bGUocmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmV3VmFsdWU6IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKG5ld1ZhbHVlLCAnXFwnbmV3VmFsdWVcXCcgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnc3R5bGUnLCBuZXdWYWx1ZSk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xufVxuXG4vKipcbiAqIFdyaXRlIGBjbGFzc05hbWVgIHRvIGBSRWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBkb2VzIGRpcmVjdCB3cml0ZSB3aXRob3V0IGFueSByZWNvbmNpbGlhdGlvbi4gVXNlZCBmb3Igd3JpdGluZyBpbml0aWFsIHZhbHVlcywgc29cbiAqIHRoYXQgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGRvIG5vdCBwdWxsIGluIHRoZSBzdHlsZSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IGNsYXNzIGxpc3QgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURpcmVjdENsYXNzKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIG5ld1ZhbHVlOiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyhuZXdWYWx1ZSwgJ1xcJ25ld1ZhbHVlXFwnIHNob3VsZCBiZSBhIHN0cmluZycpO1xuICBpZiAobmV3VmFsdWUgPT09ICcnKSB7XG4gICAgLy8gVGhlcmUgYXJlIHRlc3RzIGluIGBnb29nbGUzYCB3aGljaCBleHBlY3QgYGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpYCB0byBiZSBgbnVsbGAuXG4gICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsICdjbGFzcycpO1xuICB9IGVsc2Uge1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnY2xhc3MnLCBuZXdWYWx1ZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldENsYXNzTmFtZSsrO1xufVxuXG4vKiogU2V0cyB1cCB0aGUgc3RhdGljIERPTSBhdHRyaWJ1dGVzIG9uIGFuIGBSTm9kZWAuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBTdGF0aWNBdHRyaWJ1dGVzKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB7bWVyZ2VkQXR0cnMsIGNsYXNzZXMsIHN0eWxlc30gPSB0Tm9kZTtcblxuICBpZiAobWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMocmVuZGVyZXIsIGVsZW1lbnQsIG1lcmdlZEF0dHJzKTtcbiAgfVxuXG4gIGlmIChjbGFzc2VzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RDbGFzcyhyZW5kZXJlciwgZWxlbWVudCwgY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAoc3R5bGVzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RTdHlsZShyZW5kZXJlciwgZWxlbWVudCwgc3R5bGVzKTtcbiAgfVxufVxuIl19