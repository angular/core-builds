/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerDestroy, setActiveConsumer, } from '@angular/core/primitives/signals';
import { hasInSkipHydrationBlockFlag } from '../hydration/skip_hydration';
import { ViewEncapsulation } from '../metadata/view';
import { RendererStyleFlags2 } from '../render/api_flags';
import { addToArray, removeFromArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertFunction, assertNotReactive, assertNumber, assertString, } from '../util/assert';
import { escapeCommentText } from '../util/dom';
import { assertLContainer, assertLView, assertParentView, assertProjectionSlots, assertTNodeForLView, } from './assert';
import { attachPatchData } from './context_discovery';
import { icuContainerIterate } from './i18n/i18n_tree_shaking';
import { CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS, NATIVE, } from './interfaces/container';
import { NodeInjectorFactory } from './interfaces/injector';
import { unregisterLView } from './interfaces/lview_tracking';
import { isLContainer, isLView } from './interfaces/type_checks';
import { CHILD_HEAD, CLEANUP, DECLARATION_COMPONENT_VIEW, DECLARATION_LCONTAINER, ENVIRONMENT, FLAGS, HOST, NEXT, ON_DESTROY_HOOKS, PARENT, QUERIES, REACTIVE_TEMPLATE_CONSUMER, RENDERER, T_HOST, TVIEW, } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { profiler } from './profiler';
import { setUpAttributes } from './util/attrs_utils';
import { getLViewParent, getNativeByTNode, unwrapRNode, updateAncestorTraversalFlagsOnAttach, } from './util/view_utils';
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
    // When we remove a view from the DOM, we need to rerun afterRender hooks
    // We don't necessarily needs to run change detection. DOM removal only requires
    // change detection if animations are enabled (this notification is handled by animations).
    lView[ENVIRONMENT].changeDetectionScheduler?.notify(9 /* NotificationSource.ViewDetachedFromDOM */);
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
 * different LContainer or attached directly to ApplicationRef.
 */
export function trackMovedView(declarationContainer, lView) {
    ngDevMode && assertDefined(lView, 'LView required');
    ngDevMode && assertLContainer(declarationContainer);
    const movedViews = declarationContainer[MOVED_VIEWS];
    const parent = lView[PARENT];
    ngDevMode && assertDefined(parent, 'missing parent');
    if (isLView(parent)) {
        declarationContainer[FLAGS] |= LContainerFlags.HasTransplantedViews;
    }
    else {
        const insertedComponentLView = parent[PARENT][DECLARATION_COMPONENT_VIEW];
        ngDevMode && assertDefined(insertedComponentLView, 'Missing insertedComponentLView');
        const declaredComponentLView = lView[DECLARATION_COMPONENT_VIEW];
        ngDevMode && assertDefined(declaredComponentLView, 'Missing declaredComponentLView');
        if (declaredComponentLView !== insertedComponentLView) {
            // At this point the declaration-component is not same as insertion-component; this means that
            // this is a transplanted view. Mark the declared lView as having transplanted views so that
            // those views can participate in CD.
            declarationContainer[FLAGS] |= LContainerFlags.HasTransplantedViews;
        }
    }
    if (movedViews === null) {
        declarationContainer[MOVED_VIEWS] = [lView];
    }
    else {
        movedViews.push(lView);
    }
}
export function detachMovedView(declarationContainer, lView) {
    ngDevMode && assertLContainer(declarationContainer);
    ngDevMode &&
        assertDefined(declarationContainer[MOVED_VIEWS], 'A projected view should belong to a non-empty projected views collection');
    const movedViews = declarationContainer[MOVED_VIEWS];
    const declarationViewIndex = movedViews.indexOf(lView);
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
    if (lView[FLAGS] & 256 /* LViewFlags.Destroyed */) {
        return;
    }
    const prevConsumer = setActiveConsumer(null);
    try {
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
    finally {
        setActiveConsumer(prevConsumer);
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function processCleanups(tView, lView) {
    ngDevMode && assertNotReactive(processCleanups.name);
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
    ngDevMode && assertNotReactive(executeOnDestroys.name);
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
    // can't be used as a render parent. Also skip let declarations since they don't have a
    // corresponding DOM node at all.
    while (parentTNode !== null &&
        parentTNode.type & (8 /* TNodeType.ElementContainer */ | 32 /* TNodeType.Icu */ | 128 /* TNodeType.LetDeclaration */)) {
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
            assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ |
                12 /* TNodeType.AnyContainer */ |
                32 /* TNodeType.Icu */ |
                16 /* TNodeType.Projection */ |
                128 /* TNodeType.LetDeclaration */);
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
        else if (tNodeType & 128 /* TNodeType.LetDeclaration */) {
            return getFirstNativeNode(lView, tNode.next);
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
    renderer.removeChild(null, rNode, isHostElement);
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
        // Let declarations don't have corresponding DOM nodes so we skip over them.
        if (tNode.type === 128 /* TNodeType.LetDeclaration */) {
            tNode = tNode.next;
            continue;
        }
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
                while ((rNode = nextRNode())) {
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
    ngDevMode && assertString(newValue, "'newValue' should be a string");
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
    ngDevMode && assertString(newValue, "'newValue' should be a string");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxlQUFlLEVBRWYsaUJBQWlCLEdBQ2xCLE1BQU0sa0NBQWtDLENBQUM7QUFHMUMsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDeEUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQ0wsYUFBYSxFQUNiLFdBQVcsRUFDWCxjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLFlBQVksRUFDWixZQUFZLEdBQ2IsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFOUMsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixXQUFXLEVBQ1gsZ0JBQWdCLEVBQ2hCLHFCQUFxQixFQUNyQixtQkFBbUIsR0FDcEIsTUFBTSxVQUFVLENBQUM7QUFDbEIsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzdELE9BQU8sRUFDTCx1QkFBdUIsRUFFdkIsZUFBZSxFQUNmLFdBQVcsRUFDWCxNQUFNLEdBQ1AsTUFBTSx3QkFBd0IsQ0FBQztBQUVoQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNkJBQTZC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KiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIGNvbnN1bWVyRGVzdHJveSxcbiAgZ2V0QWN0aXZlQ29uc3VtZXIsXG4gIHNldEFjdGl2ZUNvbnN1bWVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7Tm90aWZpY2F0aW9uU291cmNlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge2hhc0luU2tpcEh5ZHJhdGlvbkJsb2NrRmxhZ30gZnJvbSAnLi4vaHlkcmF0aW9uL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHtSZW5kZXJlclN0eWxlRmxhZ3MyfSBmcm9tICcuLi9yZW5kZXIvYXBpX2ZsYWdzJztcbmltcG9ydCB7YWRkVG9BcnJheSwgcmVtb3ZlRnJvbUFycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7XG4gIGFzc2VydERlZmluZWQsXG4gIGFzc2VydEVxdWFsLFxuICBhc3NlcnRGdW5jdGlvbixcbiAgYXNzZXJ0Tm90UmVhY3RpdmUsXG4gIGFzc2VydE51bWJlcixcbiAgYXNzZXJ0U3RyaW5nLFxufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2VzY2FwZUNvbW1lbnRUZXh0fSBmcm9tICcuLi91dGlsL2RvbSc7XG5cbmltcG9ydCB7XG4gIGFzc2VydExDb250YWluZXIsXG4gIGFzc2VydExWaWV3LFxuICBhc3NlcnRQYXJlbnRWaWV3LFxuICBhc3NlcnRQcm9qZWN0aW9uU2xvdHMsXG4gIGFzc2VydFROb2RlRm9yTFZpZXcsXG59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7aWN1Q29udGFpbmVySXRlcmF0ZX0gZnJvbSAnLi9pMThuL2kxOG5fdHJlZV9zaGFraW5nJztcbmltcG9ydCB7XG4gIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULFxuICBMQ29udGFpbmVyLFxuICBMQ29udGFpbmVyRmxhZ3MsXG4gIE1PVkVEX1ZJRVdTLFxuICBOQVRJVkUsXG59IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7dW5yZWdpc3RlckxWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvbHZpZXdfdHJhY2tpbmcnO1xuaW1wb3J0IHtcbiAgVEVsZW1lbnROb2RlLFxuICBUSWN1Q29udGFpbmVyTm9kZSxcbiAgVE5vZGUsXG4gIFROb2RlRmxhZ3MsXG4gIFROb2RlVHlwZSxcbiAgVFByb2plY3Rpb25Ob2RlLFxufSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGVtcGxhdGUsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtcbiAgQ0hJTERfSEVBRCxcbiAgQ0xFQU5VUCxcbiAgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsXG4gIERFQ0xBUkFUSU9OX0xDT05UQUlORVIsXG4gIERlc3Ryb3lIb29rRGF0YSxcbiAgRU5WSVJPTk1FTlQsXG4gIEZMQUdTLFxuICBIb29rRGF0YSxcbiAgSG9va0ZuLFxuICBIT1NULFxuICBMVmlldyxcbiAgTFZpZXdGbGFncyxcbiAgTkVYVCxcbiAgT05fREVTVFJPWV9IT09LUyxcbiAgUEFSRU5ULFxuICBRVUVSSUVTLFxuICBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUixcbiAgUkVOREVSRVIsXG4gIFRfSE9TVCxcbiAgVFZJRVcsXG4gIFRWaWV3LFxuICBUVmlld1R5cGUsXG59IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7cHJvZmlsZXJ9IGZyb20gJy4vcHJvZmlsZXInO1xuaW1wb3J0IHtQcm9maWxlckV2ZW50fSBmcm9tICcuL3Byb2ZpbGVyX3R5cGVzJztcbmltcG9ydCB7c2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtcbiAgZ2V0TFZpZXdQYXJlbnQsXG4gIGdldE5hdGl2ZUJ5VE5vZGUsXG4gIHVud3JhcFJOb2RlLFxuICB1cGRhdGVBbmNlc3RvclRyYXZlcnNhbEZsYWdzT25BdHRhY2gsXG59IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgZW51bSBXYWxrVE5vZGVUcmVlQWN0aW9uIHtcbiAgLyoqIG5vZGUgY3JlYXRlIGluIHRoZSBuYXRpdmUgZW52aXJvbm1lbnQuIFJ1biBvbiBpbml0aWFsIGNyZWF0aW9uLiAqL1xuICBDcmVhdGUgPSAwLFxuXG4gIC8qKlxuICAgKiBub2RlIGluc2VydCBpbiB0aGUgbmF0aXZlIGVudmlyb25tZW50LlxuICAgKiBSdW4gd2hlbiBleGlzdGluZyBub2RlIGhhcyBiZWVuIGRldGFjaGVkIGFuZCBuZWVkcyB0byBiZSByZS1hdHRhY2hlZC5cbiAgICovXG4gIEluc2VydCA9IDEsXG5cbiAgLyoqIG5vZGUgZGV0YWNoIGZyb20gdGhlIG5hdGl2ZSBlbnZpcm9ubWVudCAqL1xuICBEZXRhY2ggPSAyLFxuXG4gIC8qKiBub2RlIGRlc3RydWN0aW9uIHVzaW5nIHRoZSByZW5kZXJlcidzIEFQSSAqL1xuICBEZXN0cm95ID0gMyxcbn1cblxuLyoqXG4gKiBOT1RFOiBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIHBvc3NpYmxlIGFjdGlvbnMgYXJlIGlubGluZWQgd2l0aGluIHRoZSBmdW5jdGlvbiBpbnN0ZWFkIG9mXG4gKiBiZWluZyBwYXNzZWQgYXMgYW4gYXJndW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoXG4gIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbixcbiAgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICBwYXJlbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgbE5vZGVUb0hhbmRsZTogUk5vZGUgfCBMQ29udGFpbmVyIHwgTFZpZXcsXG4gIGJlZm9yZU5vZGU/OiBSTm9kZSB8IG51bGwsXG4pIHtcbiAgLy8gSWYgdGhpcyBzbG90IHdhcyBhbGxvY2F0ZWQgZm9yIGEgdGV4dCBub2RlIGR5bmFtaWNhbGx5IGNyZWF0ZWQgYnkgaTE4biwgdGhlIHRleHQgbm9kZSBpdHNlbGZcbiAgLy8gd29uJ3QgYmUgY3JlYXRlZCB1bnRpbCBpMThuQXBwbHkoKSBpbiB0aGUgdXBkYXRlIGJsb2NrLCBzbyB0aGlzIG5vZGUgc2hvdWxkIGJlIHNraXBwZWQuXG4gIC8vIEZvciBtb3JlIGluZm8sIHNlZSBcIklDVSBleHByZXNzaW9ucyBzaG91bGQgd29yayBpbnNpZGUgYW4gbmdUZW1wbGF0ZU91dGxldCBpbnNpZGUgYW4gbmdGb3JcIlxuICAvLyBpbiBgaTE4bl9zcGVjLnRzYC5cbiAgaWYgKGxOb2RlVG9IYW5kbGUgIT0gbnVsbCkge1xuICAgIGxldCBsQ29udGFpbmVyOiBMQ29udGFpbmVyIHwgdW5kZWZpbmVkO1xuICAgIGxldCBpc0NvbXBvbmVudCA9IGZhbHNlO1xuICAgIC8vIFdlIGFyZSBleHBlY3RpbmcgYW4gUk5vZGUsIGJ1dCBpbiB0aGUgY2FzZSBvZiBhIGNvbXBvbmVudCBvciBMQ29udGFpbmVyIHRoZSBgUk5vZGVgIGlzXG4gICAgLy8gd3JhcHBlZCBpbiBhbiBhcnJheSB3aGljaCBuZWVkcyB0byBiZSB1bndyYXBwZWQuIFdlIG5lZWQgdG8ga25vdyBpZiBpdCBpcyBhIGNvbXBvbmVudCBhbmQgaWZcbiAgICAvLyBpdCBoYXMgTENvbnRhaW5lciBzbyB0aGF0IHdlIGNhbiBwcm9jZXNzIGFsbCBvZiB0aG9zZSBjYXNlcyBhcHByb3ByaWF0ZWx5LlxuICAgIGlmIChpc0xDb250YWluZXIobE5vZGVUb0hhbmRsZSkpIHtcbiAgICAgIGxDb250YWluZXIgPSBsTm9kZVRvSGFuZGxlO1xuICAgIH0gZWxzZSBpZiAoaXNMVmlldyhsTm9kZVRvSGFuZGxlKSkge1xuICAgICAgaXNDb21wb25lbnQgPSB0cnVlO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobE5vZGVUb0hhbmRsZVtIT1NUXSwgJ0hPU1QgbXVzdCBiZSBkZWZpbmVkIGZvciBhIGNvbXBvbmVudCBMVmlldycpO1xuICAgICAgbE5vZGVUb0hhbmRsZSA9IGxOb2RlVG9IYW5kbGVbSE9TVF0hO1xuICAgIH1cbiAgICBjb25zdCByTm9kZTogUk5vZGUgPSB1bndyYXBSTm9kZShsTm9kZVRvSGFuZGxlKTtcblxuICAgIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlICYmIHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgaWYgKGJlZm9yZU5vZGUgPT0gbnVsbCkge1xuICAgICAgICBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlciwgcGFyZW50LCByTm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudCwgck5vZGUsIGJlZm9yZU5vZGUgfHwgbnVsbCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uSW5zZXJ0ICYmIHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIHJOb2RlLCBiZWZvcmVOb2RlIHx8IG51bGwsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCkge1xuICAgICAgbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlciwgck5vZGUsIGlzQ29tcG9uZW50KTtcbiAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gV2Fsa1ROb2RlVHJlZUFjdGlvbi5EZXN0cm95KSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAgIHJlbmRlcmVyLmRlc3Ryb3lOb2RlIShyTm9kZSk7XG4gICAgfVxuICAgIGlmIChsQ29udGFpbmVyICE9IG51bGwpIHtcbiAgICAgIGFwcGx5Q29udGFpbmVyKHJlbmRlcmVyLCBhY3Rpb24sIGxDb250YWluZXIsIHBhcmVudCwgYmVmb3JlTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIsIHZhbHVlOiBzdHJpbmcpOiBSVGV4dCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICByZXR1cm4gcmVuZGVyZXIuY3JlYXRlVGV4dCh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVUZXh0Tm9kZShyZW5kZXJlcjogUmVuZGVyZXIsIHJOb2RlOiBSVGV4dCwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICByZW5kZXJlci5zZXRWYWx1ZShyTm9kZSwgdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tbWVudE5vZGUocmVuZGVyZXI6IFJlbmRlcmVyLCB2YWx1ZTogc3RyaW5nKTogUkNvbW1lbnQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICByZXR1cm4gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChlc2NhcGVDb21tZW50VGV4dCh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byB1c2VcbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIG5hbWVzcGFjZSBPcHRpb25hbCBuYW1lc3BhY2UgZm9yIGVsZW1lbnQuXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50Tm9kZShcbiAgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICBuYW1lOiBzdHJpbmcsXG4gIG5hbWVzcGFjZTogc3RyaW5nIHwgbnVsbCxcbik6IFJFbGVtZW50IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgcmV0dXJuIHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSwgbmFtZXNwYWNlKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBmcm9tIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3RnJvbURPTSh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBkZXRhY2hWaWV3RnJvbURPTSh0VmlldywgbFZpZXcpO1xuICBsVmlld1tIT1NUXSA9IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSBudWxsO1xufVxuXG4vKipcbiAqIEFkZHMgYWxsIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LlxuICpcbiAqIEJlY2F1c2Ugc29tZSByb290IG5vZGVzIG9mIHRoZSB2aWV3IG1heSBiZSBjb250YWluZXJzLCB3ZSBzb21ldGltZXMgbmVlZFxuICogdG8gcHJvcGFnYXRlIGRlZXBseSBpbnRvIHRoZSBuZXN0ZWQgY29udGFpbmVycyB0byBhZGQgYWxsIGVsZW1lbnRzIGluIHRoZVxuICogdmlld3MgYmVuZWF0aCBpdC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgb2YgdGhlIGBMVmlld2AgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIHBhcmVudFROb2RlIFRoZSBgVE5vZGVgIHdoZXJlIHRoZSBgTFZpZXdgIHNob3VsZCBiZSBhdHRhY2hlZCB0by5cbiAqIEBwYXJhbSByZW5kZXJlciBDdXJyZW50IHJlbmRlcmVyIHRvIHVzZSBmb3IgRE9NIG1hbmlwdWxhdGlvbnMuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgZnJvbSB3aGljaCBlbGVtZW50cyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICogQHBhcmFtIHBhcmVudE5hdGl2ZU5vZGUgVGhlIHBhcmVudCBgUkVsZW1lbnRgIHdoZXJlIGl0IHNob3VsZCBiZSBpbnNlcnRlZCBpbnRvLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFZpZXdUb0RPTShcbiAgdFZpZXc6IFRWaWV3LFxuICBwYXJlbnRUTm9kZTogVE5vZGUsXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgbFZpZXc6IExWaWV3LFxuICBwYXJlbnROYXRpdmVOb2RlOiBSRWxlbWVudCxcbiAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsLFxuKTogdm9pZCB7XG4gIGxWaWV3W0hPU1RdID0gcGFyZW50TmF0aXZlTm9kZTtcbiAgbFZpZXdbVF9IT1NUXSA9IHBhcmVudFROb2RlO1xuICBhcHBseVZpZXcodFZpZXcsIGxWaWV3LCByZW5kZXJlciwgV2Fsa1ROb2RlVHJlZUFjdGlvbi5JbnNlcnQsIHBhcmVudE5hdGl2ZU5vZGUsIGJlZm9yZU5vZGUpO1xufVxuXG4vKipcbiAqIERldGFjaCBhIGBMVmlld2AgZnJvbSB0aGUgRE9NIGJ5IGRldGFjaGluZyBpdHMgbm9kZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGJlIGRldGFjaGVkXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2AgdG8gYmUgZGV0YWNoZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hWaWV3RnJvbURPTSh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICAvLyBXaGVuIHdlIHJlbW92ZSBhIHZpZXcgZnJvbSB0aGUgRE9NLCB3ZSBuZWVkIHRvIHJlcnVuIGFmdGVyUmVuZGVyIGhvb2tzXG4gIC8vIFdlIGRvbid0IG5lY2Vzc2FyaWx5IG5lZWRzIHRvIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uLiBET00gcmVtb3ZhbCBvbmx5IHJlcXVpcmVzXG4gIC8vIGNoYW5nZSBkZXRlY3Rpb24gaWYgYW5pbWF0aW9ucyBhcmUgZW5hYmxlZCAodGhpcyBub3RpZmljYXRpb24gaXMgaGFuZGxlZCBieSBhbmltYXRpb25zKS5cbiAgbFZpZXdbRU5WSVJPTk1FTlRdLmNoYW5nZURldGVjdGlvblNjaGVkdWxlcj8ubm90aWZ5KE5vdGlmaWNhdGlvblNvdXJjZS5WaWV3RGV0YWNoZWRGcm9tRE9NKTtcbiAgYXBwbHlWaWV3KHRWaWV3LCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCBXYWxrVE5vZGVUcmVlQWN0aW9uLkRldGFjaCwgbnVsbCwgbnVsbCk7XG59XG5cbi8qKlxuICogVHJhdmVyc2VzIGRvd24gYW5kIHVwIHRoZSB0cmVlIG9mIHZpZXdzIGFuZCBjb250YWluZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgYW5kXG4gKiBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogTm90ZXM6XG4gKiAgLSBCZWNhdXNlIGl0J3MgdXNlZCBmb3Igb25EZXN0cm95IGNhbGxzLCBpdCBuZWVkcyB0byBiZSBib3R0b20tdXAuXG4gKiAgLSBNdXN0IHByb2Nlc3MgY29udGFpbmVycyBpbnN0ZWFkIG9mIHRoZWlyIHZpZXdzIHRvIGF2b2lkIHNwbGljaW5nXG4gKiAgd2hlbiB2aWV3cyBhcmUgZGVzdHJveWVkIGFuZCByZS1hZGRlZC5cbiAqICAtIFVzaW5nIGEgd2hpbGUgbG9vcCBiZWNhdXNlIGl0J3MgZmFzdGVyIHRoYW4gcmVjdXJzaW9uXG4gKiAgLSBEZXN0cm95IG9ubHkgY2FsbGVkIG9uIG1vdmVtZW50IHRvIHNpYmxpbmcgb3IgbW92ZW1lbnQgdG8gcGFyZW50IChsYXRlcmFsbHkgb3IgdXApXG4gKlxuICogIEBwYXJhbSByb290VmlldyBUaGUgdmlldyB0byBkZXN0cm95XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Vmlld1RyZWUocm9vdFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIC8vIElmIHRoZSB2aWV3IGhhcyBubyBjaGlsZHJlbiwgd2UgY2FuIGNsZWFuIGl0IHVwIGFuZCByZXR1cm4gZWFybHkuXG4gIGxldCBsVmlld09yTENvbnRhaW5lciA9IHJvb3RWaWV3W0NISUxEX0hFQURdO1xuICBpZiAoIWxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3W1RWSUVXXSwgcm9vdFZpZXcpO1xuICB9XG5cbiAgd2hpbGUgKGxWaWV3T3JMQ29udGFpbmVyKSB7XG4gICAgbGV0IG5leHQ6IExWaWV3IHwgTENvbnRhaW5lciB8IG51bGwgPSBudWxsO1xuXG4gICAgaWYgKGlzTFZpZXcobFZpZXdPckxDb250YWluZXIpKSB7XG4gICAgICAvLyBJZiBMVmlldywgdHJhdmVyc2UgZG93biB0byBjaGlsZC5cbiAgICAgIG5leHQgPSBsVmlld09yTENvbnRhaW5lcltDSElMRF9IRUFEXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobFZpZXdPckxDb250YWluZXIpO1xuICAgICAgLy8gSWYgY29udGFpbmVyLCB0cmF2ZXJzZSBkb3duIHRvIGl0cyBmaXJzdCBMVmlldy5cbiAgICAgIGNvbnN0IGZpcnN0VmlldzogTFZpZXcgfCB1bmRlZmluZWQgPSBsVmlld09yTENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF07XG4gICAgICBpZiAoZmlyc3RWaWV3KSBuZXh0ID0gZmlyc3RWaWV3O1xuICAgIH1cblxuICAgIGlmICghbmV4dCkge1xuICAgICAgLy8gT25seSBjbGVhbiB1cCB2aWV3IHdoZW4gbW92aW5nIHRvIHRoZSBzaWRlIG9yIHVwLCBhcyBkZXN0cm95IGhvb2tzXG4gICAgICAvLyBzaG91bGQgYmUgY2FsbGVkIGluIG9yZGVyIGZyb20gdGhlIGJvdHRvbSB1cC5cbiAgICAgIHdoaWxlIChsVmlld09yTENvbnRhaW5lciAmJiAhbFZpZXdPckxDb250YWluZXIhW05FWFRdICYmIGxWaWV3T3JMQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikpIHtcbiAgICAgICAgICBjbGVhblVwVmlldyhsVmlld09yTENvbnRhaW5lcltUVklFV10sIGxWaWV3T3JMQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBsVmlld09yTENvbnRhaW5lciA9IGxWaWV3T3JMQ29udGFpbmVyW1BBUkVOVF07XG4gICAgICB9XG4gICAgICBpZiAobFZpZXdPckxDb250YWluZXIgPT09IG51bGwpIGxWaWV3T3JMQ29udGFpbmVyID0gcm9vdFZpZXc7XG4gICAgICBpZiAoaXNMVmlldyhsVmlld09yTENvbnRhaW5lcikpIHtcbiAgICAgICAgY2xlYW5VcFZpZXcobFZpZXdPckxDb250YWluZXJbVFZJRVddLCBsVmlld09yTENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBuZXh0ID0gbFZpZXdPckxDb250YWluZXIgJiYgbFZpZXdPckxDb250YWluZXIhW05FWFRdO1xuICAgIH1cbiAgICBsVmlld09yTENvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGluc2VydFxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGluc2VydFxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBpbnRvIHdoaWNoIHRoZSB2aWV3IHNob3VsZCBiZSBpbnNlcnRlZFxuICogQHBhcmFtIGluZGV4IFdoaWNoIGluZGV4IGluIHRoZSBjb250YWluZXIgdG8gaW5zZXJ0IHRoZSBjaGlsZCB2aWV3IGludG9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGxDb250YWluZXI6IExDb250YWluZXIsIGluZGV4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG4gIGNvbnN0IGluZGV4SW5Db250YWluZXIgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVCArIGluZGV4O1xuICBjb25zdCBjb250YWluZXJMZW5ndGggPSBsQ29udGFpbmVyLmxlbmd0aDtcblxuICBpZiAoaW5kZXggPiAwKSB7XG4gICAgLy8gVGhpcyBpcyBhIG5ldyB2aWV3LCB3ZSBuZWVkIHRvIGFkZCBpdCB0byB0aGUgY2hpbGRyZW4uXG4gICAgbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyIC0gMV1bTkVYVF0gPSBsVmlldztcbiAgfVxuICBpZiAoaW5kZXggPCBjb250YWluZXJMZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkge1xuICAgIGxWaWV3W05FWFRdID0gbENvbnRhaW5lcltpbmRleEluQ29udGFpbmVyXTtcbiAgICBhZGRUb0FycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgaW5kZXgsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICBsQ29udGFpbmVyLnB1c2gobFZpZXcpO1xuICAgIGxWaWV3W05FWFRdID0gbnVsbDtcbiAgfVxuXG4gIGxWaWV3W1BBUkVOVF0gPSBsQ29udGFpbmVyO1xuXG4gIC8vIHRyYWNrIHZpZXdzIHdoZXJlIGRlY2xhcmF0aW9uIGFuZCBpbnNlcnRpb24gcG9pbnRzIGFyZSBkaWZmZXJlbnRcbiAgY29uc3QgZGVjbGFyYXRpb25MQ29udGFpbmVyID0gbFZpZXdbREVDTEFSQVRJT05fTENPTlRBSU5FUl07XG4gIGlmIChkZWNsYXJhdGlvbkxDb250YWluZXIgIT09IG51bGwgJiYgbENvbnRhaW5lciAhPT0gZGVjbGFyYXRpb25MQ29udGFpbmVyKSB7XG4gICAgdHJhY2tNb3ZlZFZpZXcoZGVjbGFyYXRpb25MQ29udGFpbmVyLCBsVmlldyk7XG4gIH1cblxuICAvLyBub3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChsUXVlcmllcyAhPT0gbnVsbCkge1xuICAgIGxRdWVyaWVzLmluc2VydFZpZXcodFZpZXcpO1xuICB9XG5cbiAgdXBkYXRlQW5jZXN0b3JUcmF2ZXJzYWxGbGFnc09uQXR0YWNoKGxWaWV3KTtcbiAgLy8gU2V0cyB0aGUgYXR0YWNoZWQgZmxhZ1xuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBUcmFjayB2aWV3cyBjcmVhdGVkIGZyb20gdGhlIGRlY2xhcmF0aW9uIGNvbnRhaW5lciAoVGVtcGxhdGVSZWYpIGFuZCBpbnNlcnRlZCBpbnRvIGFcbiAqIGRpZmZlcmVudCBMQ29udGFpbmVyIG9yIGF0dGFjaGVkIGRpcmVjdGx5IHRvIEFwcGxpY2F0aW9uUmVmLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhY2tNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlldywgJ0xWaWV3IHJlcXVpcmVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlY2xhcmF0aW9uQ29udGFpbmVyKTtcbiAgY29uc3QgbW92ZWRWaWV3cyA9IGRlY2xhcmF0aW9uQ29udGFpbmVyW01PVkVEX1ZJRVdTXTtcbiAgY29uc3QgcGFyZW50ID0gbFZpZXdbUEFSRU5UXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudCwgJ21pc3NpbmcgcGFyZW50Jyk7XG4gIGlmIChpc0xWaWV3KHBhcmVudCkpIHtcbiAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltGTEFHU10gfD0gTENvbnRhaW5lckZsYWdzLkhhc1RyYW5zcGxhbnRlZFZpZXdzO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluc2VydGVkQ29tcG9uZW50TFZpZXcgPSBwYXJlbnRbUEFSRU5UXSFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGluc2VydGVkQ29tcG9uZW50TFZpZXcsICdNaXNzaW5nIGluc2VydGVkQ29tcG9uZW50TFZpZXcnKTtcbiAgICBjb25zdCBkZWNsYXJlZENvbXBvbmVudExWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGRlY2xhcmVkQ29tcG9uZW50TFZpZXcsICdNaXNzaW5nIGRlY2xhcmVkQ29tcG9uZW50TFZpZXcnKTtcbiAgICBpZiAoZGVjbGFyZWRDb21wb25lbnRMVmlldyAhPT0gaW5zZXJ0ZWRDb21wb25lbnRMVmlldykge1xuICAgICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgZGVjbGFyYXRpb24tY29tcG9uZW50IGlzIG5vdCBzYW1lIGFzIGluc2VydGlvbi1jb21wb25lbnQ7IHRoaXMgbWVhbnMgdGhhdFxuICAgICAgLy8gdGhpcyBpcyBhIHRyYW5zcGxhbnRlZCB2aWV3LiBNYXJrIHRoZSBkZWNsYXJlZCBsVmlldyBhcyBoYXZpbmcgdHJhbnNwbGFudGVkIHZpZXdzIHNvIHRoYXRcbiAgICAgIC8vIHRob3NlIHZpZXdzIGNhbiBwYXJ0aWNpcGF0ZSBpbiBDRC5cbiAgICAgIGRlY2xhcmF0aW9uQ29udGFpbmVyW0ZMQUdTXSB8PSBMQ29udGFpbmVyRmxhZ3MuSGFzVHJhbnNwbGFudGVkVmlld3M7XG4gICAgfVxuICB9XG4gIGlmIChtb3ZlZFZpZXdzID09PSBudWxsKSB7XG4gICAgZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdID0gW2xWaWV3XTtcbiAgfSBlbHNlIHtcbiAgICBtb3ZlZFZpZXdzLnB1c2gobFZpZXcpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRhY2hNb3ZlZFZpZXcoZGVjbGFyYXRpb25Db250YWluZXI6IExDb250YWluZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWNsYXJhdGlvbkNvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydERlZmluZWQoXG4gICAgICBkZWNsYXJhdGlvbkNvbnRhaW5lcltNT1ZFRF9WSUVXU10sXG4gICAgICAnQSBwcm9qZWN0ZWQgdmlldyBzaG91bGQgYmVsb25nIHRvIGEgbm9uLWVtcHR5IHByb2plY3RlZCB2aWV3cyBjb2xsZWN0aW9uJyxcbiAgICApO1xuICBjb25zdCBtb3ZlZFZpZXdzID0gZGVjbGFyYXRpb25Db250YWluZXJbTU9WRURfVklFV1NdITtcbiAgY29uc3QgZGVjbGFyYXRpb25WaWV3SW5kZXggPSBtb3ZlZFZpZXdzLmluZGV4T2YobFZpZXcpO1xuICBtb3ZlZFZpZXdzLnNwbGljZShkZWNsYXJhdGlvblZpZXdJbmRleCwgMSk7XG59XG5cbi8qKlxuICogRGV0YWNoZXMgYSB2aWV3IGZyb20gYSBjb250YWluZXIuXG4gKlxuICogVGhpcyBtZXRob2QgcmVtb3ZlcyB0aGUgdmlldyBmcm9tIHRoZSBjb250YWluZXIncyBhcnJheSBvZiBhY3RpdmUgdmlld3MuIEl0IGFsc29cbiAqIHJlbW92ZXMgdGhlIHZpZXcncyBlbGVtZW50cyBmcm9tIHRoZSBET00uXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIGRldGFjaCBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gZGV0YWNoXG4gKiBAcmV0dXJucyBEZXRhY2hlZCBMVmlldyBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaFZpZXcobENvbnRhaW5lcjogTENvbnRhaW5lciwgcmVtb3ZlSW5kZXg6IG51bWJlcik6IExWaWV3IHwgdW5kZWZpbmVkIHtcbiAgaWYgKGxDb250YWluZXIubGVuZ3RoIDw9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKSByZXR1cm47XG5cbiAgY29uc3QgaW5kZXhJbkNvbnRhaW5lciA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXg7XG4gIGNvbnN0IHZpZXdUb0RldGFjaCA9IGxDb250YWluZXJbaW5kZXhJbkNvbnRhaW5lcl07XG5cbiAgaWYgKHZpZXdUb0RldGFjaCkge1xuICAgIGNvbnN0IGRlY2xhcmF0aW9uTENvbnRhaW5lciA9IHZpZXdUb0RldGFjaFtERUNMQVJBVElPTl9MQ09OVEFJTkVSXTtcbiAgICBpZiAoZGVjbGFyYXRpb25MQ29udGFpbmVyICE9PSBudWxsICYmIGRlY2xhcmF0aW9uTENvbnRhaW5lciAhPT0gbENvbnRhaW5lcikge1xuICAgICAgZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uTENvbnRhaW5lciwgdmlld1RvRGV0YWNoKTtcbiAgICB9XG5cbiAgICBpZiAocmVtb3ZlSW5kZXggPiAwKSB7XG4gICAgICBsQ29udGFpbmVyW2luZGV4SW5Db250YWluZXIgLSAxXVtORVhUXSA9IHZpZXdUb0RldGFjaFtORVhUXSBhcyBMVmlldztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlZExWaWV3ID0gcmVtb3ZlRnJvbUFycmF5KGxDb250YWluZXIsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgcmVtb3ZlSW5kZXgpO1xuICAgIHJlbW92ZVZpZXdGcm9tRE9NKHZpZXdUb0RldGFjaFtUVklFV10sIHZpZXdUb0RldGFjaCk7XG5cbiAgICAvLyBub3RpZnkgcXVlcnkgdGhhdCBhIHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICAgIGNvbnN0IGxRdWVyaWVzID0gcmVtb3ZlZExWaWV3W1FVRVJJRVNdO1xuICAgIGlmIChsUXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgbFF1ZXJpZXMuZGV0YWNoVmlldyhyZW1vdmVkTFZpZXdbVFZJRVddKTtcbiAgICB9XG5cbiAgICB2aWV3VG9EZXRhY2hbUEFSRU5UXSA9IG51bGw7XG4gICAgdmlld1RvRGV0YWNoW05FWFRdID0gbnVsbDtcbiAgICAvLyBVbnNldHMgdGhlIGF0dGFjaGVkIGZsYWdcbiAgICB2aWV3VG9EZXRhY2hbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkF0dGFjaGVkO1xuICB9XG4gIHJldHVybiB2aWV3VG9EZXRhY2g7XG59XG5cbi8qKlxuICogQSBzdGFuZGFsb25lIGZ1bmN0aW9uIHdoaWNoIGRlc3Ryb3lzIGFuIExWaWV3LFxuICogY29uZHVjdGluZyBjbGVhbiB1cCAoZS5nLiByZW1vdmluZyBsaXN0ZW5lcnMsIGNhbGxpbmcgb25EZXN0cm95cykuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIG9mIHRoZSBgTFZpZXdgIHRvIGJlIGRlc3Ryb3llZFxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIGJlIGRlc3Ryb3llZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lMVmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBpZiAoIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcblxuICAgIGlmIChyZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgYXBwbHlWaWV3KHRWaWV3LCBsVmlldywgcmVuZGVyZXIsIFdhbGtUTm9kZVRyZWVBY3Rpb24uRGVzdHJveSwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgZGVzdHJveVZpZXdUcmVlKGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIG9uRGVzdHJveXMgaG9va3MgZm9yIGFsbCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBpbiBhIGdpdmVuIHZpZXcgYW5kIHRoZW4gcmVtb3ZlcyBhbGxcbiAqIGxpc3RlbmVycy4gTGlzdGVuZXJzIGFyZSByZW1vdmVkIGFzIHRoZSBsYXN0IHN0ZXAgc28gZXZlbnRzIGRlbGl2ZXJlZCBpbiB0aGUgb25EZXN0cm95cyBob29rc1xuICogY2FuIGJlIHByb3BhZ2F0ZWQgdG8gQE91dHB1dCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgZm9yIHRoZSBgTFZpZXdgIHRvIGNsZWFuIHVwLlxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgdHJ5IHtcbiAgICAvLyBVc3VhbGx5IHRoZSBBdHRhY2hlZCBmbGFnIGlzIHJlbW92ZWQgd2hlbiB0aGUgdmlldyBpcyBkZXRhY2hlZCBmcm9tIGl0cyBwYXJlbnQsIGhvd2V2ZXJcbiAgICAvLyBpZiBpdCdzIGEgcm9vdCB2aWV3LCB0aGUgZmxhZyB3b24ndCBiZSB1bnNldCBoZW5jZSB3aHkgd2UncmUgYWxzbyByZW1vdmluZyBvbiBkZXN0cm95LlxuICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5BdHRhY2hlZDtcblxuICAgIC8vIE1hcmsgdGhlIExWaWV3IGFzIGRlc3Ryb3llZCAqYmVmb3JlKiBleGVjdXRpbmcgdGhlIG9uRGVzdHJveSBob29rcy4gQW4gb25EZXN0cm95IGhvb2tcbiAgICAvLyBydW5zIGFyYml0cmFyeSB1c2VyIGNvZGUsIHdoaWNoIGNvdWxkIGluY2x1ZGUgaXRzIG93biBgdmlld1JlZi5kZXN0cm95KClgIChvciBzaW1pbGFyKS4gSWZcbiAgICAvLyBXZSBkb24ndCBmbGFnIHRoZSB2aWV3IGFzIGRlc3Ryb3llZCBiZWZvcmUgdGhlIGhvb2tzLCB0aGlzIGNvdWxkIGxlYWQgdG8gYW4gaW5maW5pdGUgbG9vcC5cbiAgICAvLyBUaGlzIGFsc28gYWxpZ25zIHdpdGggdGhlIFZpZXdFbmdpbmUgYmVoYXZpb3IuIEl0IGFsc28gbWVhbnMgdGhhdCB0aGUgb25EZXN0cm95IGhvb2sgaXNcbiAgICAvLyByZWFsbHkgbW9yZSBvZiBhbiBcImFmdGVyRGVzdHJveVwiIGhvb2sgaWYgeW91IHRoaW5rIGFib3V0IGl0LlxuICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRlc3Ryb3llZDtcblxuICAgIGxWaWV3W1JFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSXSAmJiBjb25zdW1lckRlc3Ryb3kobFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdKTtcblxuICAgIGV4ZWN1dGVPbkRlc3Ryb3lzKHRWaWV3LCBsVmlldyk7XG4gICAgcHJvY2Vzc0NsZWFudXBzKHRWaWV3LCBsVmlldyk7XG4gICAgLy8gRm9yIGNvbXBvbmVudCB2aWV3cyBvbmx5LCB0aGUgbG9jYWwgcmVuZGVyZXIgaXMgZGVzdHJveWVkIGF0IGNsZWFuIHVwIHRpbWUuXG4gICAgaWYgKGxWaWV3W1RWSUVXXS50eXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveSsrO1xuICAgICAgbFZpZXdbUkVOREVSRVJdLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbkNvbnRhaW5lciA9IGxWaWV3W0RFQ0xBUkFUSU9OX0xDT05UQUlORVJdO1xuICAgIC8vIHdlIGFyZSBkZWFsaW5nIHdpdGggYW4gZW1iZWRkZWQgdmlldyB0aGF0IGlzIHN0aWxsIGluc2VydGVkIGludG8gYSBjb250YWluZXJcbiAgICBpZiAoZGVjbGFyYXRpb25Db250YWluZXIgIT09IG51bGwgJiYgaXNMQ29udGFpbmVyKGxWaWV3W1BBUkVOVF0pKSB7XG4gICAgICAvLyBhbmQgdGhpcyBpcyBhIHByb2plY3RlZCB2aWV3XG4gICAgICBpZiAoZGVjbGFyYXRpb25Db250YWluZXIgIT09IGxWaWV3W1BBUkVOVF0pIHtcbiAgICAgICAgZGV0YWNoTW92ZWRWaWV3KGRlY2xhcmF0aW9uQ29udGFpbmVyLCBsVmlldyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBlbWJlZGRlZCB2aWV3cyBzdGlsbCBhdHRhY2hlZCB0byBhIGNvbnRhaW5lcjogcmVtb3ZlIHF1ZXJ5IHJlc3VsdCBmcm9tIHRoaXMgdmlldy5cbiAgICAgIGNvbnN0IGxRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gICAgICBpZiAobFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgICAgbFF1ZXJpZXMuZGV0YWNoVmlldyh0Vmlldyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVW5yZWdpc3RlciB0aGUgdmlldyBvbmNlIGV2ZXJ5dGhpbmcgZWxzZSBoYXMgYmVlbiBjbGVhbmVkIHVwLlxuICAgIHVucmVnaXN0ZXJMVmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgfVxufVxuXG4vKiogUmVtb3ZlcyBsaXN0ZW5lcnMgYW5kIHVuc3Vic2NyaWJlcyBmcm9tIG91dHB1dCBzdWJzY3JpcHRpb25zICovXG5mdW5jdGlvbiBwcm9jZXNzQ2xlYW51cHModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFJlYWN0aXZlKHByb2Nlc3NDbGVhbnVwcy5uYW1lKTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdITtcbiAgaWYgKHRDbGVhbnVwICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgdENsZWFudXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBuYXRpdmUgRE9NIGxpc3RlbmVyLiBJdCB3aWxsIG9jY3VweSA0IGVudHJpZXMgaW4gdGhlIFRDbGVhbnVwIGFycmF5IChoZW5jZSBpICs9XG4gICAgICAgIC8vIDIgYXQgdGhlIGVuZCBvZiB0aGlzIGJsb2NrKS5cbiAgICAgICAgY29uc3QgdGFyZ2V0SWR4ID0gdENsZWFudXBbaSArIDNdO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TnVtYmVyKHRhcmdldElkeCwgJ2NsZWFudXAgdGFyZ2V0IG11c3QgYmUgYSBudW1iZXInKTtcbiAgICAgICAgaWYgKHRhcmdldElkeCA+PSAwKSB7XG4gICAgICAgICAgLy8gRGVzdHJveSBhbnl0aGluZyB3aG9zZSB0ZWFyZG93biBpcyBhIGZ1bmN0aW9uIGNhbGwgKGUuZy4gUXVlcnlMaXN0LCBNb2RlbFNpZ25hbCkuXG4gICAgICAgICAgbENsZWFudXBbdGFyZ2V0SWR4XSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFN1YnNjcmlwdGlvblxuICAgICAgICAgIGxDbGVhbnVwWy10YXJnZXRJZHhdLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaSArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNsZWFudXAgZnVuY3Rpb24gdGhhdCBpcyBncm91cGVkIHdpdGggdGhlIGluZGV4IG9mIGl0cyBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsQ2xlYW51cFt0Q2xlYW51cFtpICsgMV1dO1xuICAgICAgICB0Q2xlYW51cFtpXS5jYWxsKGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAobENsZWFudXAgIT09IG51bGwpIHtcbiAgICBsVmlld1tDTEVBTlVQXSA9IG51bGw7XG4gIH1cbiAgY29uc3QgZGVzdHJveUhvb2tzID0gbFZpZXdbT05fREVTVFJPWV9IT09LU107XG4gIGlmIChkZXN0cm95SG9va3MgIT09IG51bGwpIHtcbiAgICAvLyBSZXNldCB0aGUgT05fREVTVFJPWV9IT09LUyBhcnJheSBiZWZvcmUgaXRlcmF0aW5nIG92ZXIgaXQgdG8gcHJldmVudCBob29rcyB0aGF0IHVucmVnaXN0ZXJcbiAgICAvLyB0aGVtc2VsdmVzIGZyb20gbXV0YXRpbmcgdGhlIGFycmF5IGR1cmluZyBpdGVyYXRpb24uXG4gICAgbFZpZXdbT05fREVTVFJPWV9IT09LU10gPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzdHJveUhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZXN0cm95SG9va3NGbiA9IGRlc3Ryb3lIb29rc1tpXTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRGdW5jdGlvbihkZXN0cm95SG9va3NGbiwgJ0V4cGVjdGluZyBkZXN0cm95IGhvb2sgdG8gYmUgYSBmdW5jdGlvbi4nKTtcbiAgICAgIGRlc3Ryb3lIb29rc0ZuKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBDYWxscyBvbkRlc3Ryb3kgaG9va3MgZm9yIHRoaXMgdmlldyAqL1xuZnVuY3Rpb24gZXhlY3V0ZU9uRGVzdHJveXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFJlYWN0aXZlKGV4ZWN1dGVPbkRlc3Ryb3lzLm5hbWUpO1xuICBsZXQgZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGEgfCBudWxsO1xuXG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc3Ryb3lIb29rcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgY29udGV4dCA9IGxWaWV3W2Rlc3Ryb3lIb29rc1tpXSBhcyBudW1iZXJdO1xuXG4gICAgICAvLyBPbmx5IGNhbGwgdGhlIGRlc3Ryb3kgaG9vayBpZiB0aGUgY29udGV4dCBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gICAgICBpZiAoIShjb250ZXh0IGluc3RhbmNlb2YgTm9kZUluamVjdG9yRmFjdG9yeSkpIHtcbiAgICAgICAgY29uc3QgdG9DYWxsID0gZGVzdHJveUhvb2tzW2kgKyAxXSBhcyBIb29rRm4gfCBIb29rRGF0YTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b0NhbGwpKSB7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b0NhbGwubGVuZ3RoOyBqICs9IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxDb250ZXh0ID0gY29udGV4dFt0b0NhbGxbal0gYXMgbnVtYmVyXTtcbiAgICAgICAgICAgIGNvbnN0IGhvb2sgPSB0b0NhbGxbaiArIDFdIGFzIEhvb2tGbjtcbiAgICAgICAgICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuTGlmZWN5Y2xlSG9va1N0YXJ0LCBjYWxsQ29udGV4dCwgaG9vayk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBob29rLmNhbGwoY2FsbENvbnRleHQpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5MaWZlY3ljbGVIb29rRW5kLCBjYWxsQ29udGV4dCwgaG9vayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuTGlmZWN5Y2xlSG9va1N0YXJ0LCBjb250ZXh0LCB0b0NhbGwpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0b0NhbGwuY2FsbChjb250ZXh0KTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5MaWZlY3ljbGVIb29rRW5kLCBjb250ZXh0LCB0b0NhbGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgZWxlbWVudCBpZiBhIG5vZGUgY2FuIGJlIGluc2VydGVkIGludG8gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHJlYXNvbnMgd2h5IHdlIG1heSBub3QgYmUgYWJsZSB0byBpbnNlcnQgYSBlbGVtZW50IGltbWVkaWF0ZWx5LlxuICogLSBQcm9qZWN0aW9uOiBXaGVuIGNyZWF0aW5nIGEgY2hpbGQgY29udGVudCBlbGVtZW50IG9mIGEgY29tcG9uZW50LCB3ZSBoYXZlIHRvIHNraXAgdGhlXG4gKiAgIGluc2VydGlvbiBiZWNhdXNlIHRoZSBjb250ZW50IG9mIGEgY29tcG9uZW50IHdpbGwgYmUgcHJvamVjdGVkLlxuICogICBgPGNvbXBvbmVudD48Y29udGVudD5kZWxheWVkIGR1ZSB0byBwcm9qZWN0aW9uPC9jb250ZW50PjwvY29tcG9uZW50PmBcbiAqIC0gUGFyZW50IGNvbnRhaW5lciBpcyBkaXNjb25uZWN0ZWQ6IFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgYSB2aWV3IGludG9cbiAqICAgcGFyZW50IGNvbnRhaW5lciwgd2hpY2ggaXRzZWxmIGlzIGRpc2Nvbm5lY3RlZC4gRm9yIGV4YW1wbGUgdGhlIHBhcmVudCBjb250YWluZXIgaXMgcGFydFxuICogICBvZiBhIFZpZXcgd2hpY2ggaGFzIG5vdCBiZSBpbnNlcnRlZCBvciBpcyBtYWRlIGZvciBwcm9qZWN0aW9uIGJ1dCBoYXMgbm90IGJlZW4gaW5zZXJ0ZWRcbiAqICAgaW50byBkZXN0aW5hdGlvbi5cbiAqXG4gKiBAcGFyYW0gdFZpZXc6IEN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0Tm9kZTogYFROb2RlYCBmb3Igd2hpY2ggd2Ugd2lzaCB0byByZXRyaWV2ZSByZW5kZXIgcGFyZW50LlxuICogQHBhcmFtIGxWaWV3OiBDdXJyZW50IGBMVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRSRWxlbWVudCh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUkVsZW1lbnQgfCBudWxsIHtcbiAgcmV0dXJuIGdldENsb3Nlc3RSRWxlbWVudCh0VmlldywgdE5vZGUucGFyZW50LCBsVmlldyk7XG59XG5cbi8qKlxuICogR2V0IGNsb3Nlc3QgYFJFbGVtZW50YCBvciBgbnVsbGAgaWYgaXQgY2FuJ3QgYmUgZm91bmQuXG4gKlxuICogSWYgYFROb2RlYCBpcyBgVE5vZGVUeXBlLkVsZW1lbnRgID0+IHJldHVybiBgUkVsZW1lbnRgIGF0IGBMVmlld1t0Tm9kZS5pbmRleF1gIGxvY2F0aW9uLlxuICogSWYgYFROb2RlYCBpcyBgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXJ8SWN1Q29udGFpbmAgPT4gcmV0dXJuIHRoZSBwYXJlbnQgKHJlY3Vyc2l2ZWx5KS5cbiAqIElmIGBUTm9kZWAgaXMgYG51bGxgIHRoZW4gcmV0dXJuIGhvc3QgYFJFbGVtZW50YDpcbiAqICAgLSByZXR1cm4gYG51bGxgIGlmIHByb2plY3Rpb25cbiAqICAgLSByZXR1cm4gYG51bGxgIGlmIHBhcmVudCBjb250YWluZXIgaXMgZGlzY29ubmVjdGVkICh3ZSBoYXZlIG5vIHBhcmVudC4pXG4gKlxuICogQHBhcmFtIHRWaWV3OiBDdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gdE5vZGU6IGBUTm9kZWAgZm9yIHdoaWNoIHdlIHdpc2ggdG8gcmV0cmlldmUgYFJFbGVtZW50YCAob3IgYG51bGxgIGlmIGhvc3QgZWxlbWVudCBpc1xuICogICAgIG5lZWRlZCkuXG4gKiBAcGFyYW0gbFZpZXc6IEN1cnJlbnQgYExWaWV3YC5cbiAqIEByZXR1cm5zIGBudWxsYCBpZiB0aGUgYFJFbGVtZW50YCBjYW4ndCBiZSBkZXRlcm1pbmVkIGF0IHRoaXMgdGltZSAobm8gcGFyZW50IC8gcHJvamVjdGlvbilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENsb3Nlc3RSRWxlbWVudChcbiAgdFZpZXc6IFRWaWV3LFxuICB0Tm9kZTogVE5vZGUgfCBudWxsLFxuICBsVmlldzogTFZpZXcsXG4pOiBSRWxlbWVudCB8IG51bGwge1xuICBsZXQgcGFyZW50VE5vZGU6IFROb2RlIHwgbnVsbCA9IHROb2RlO1xuICAvLyBTa2lwIG92ZXIgZWxlbWVudCBhbmQgSUNVIGNvbnRhaW5lcnMgYXMgdGhvc2UgYXJlIHJlcHJlc2VudGVkIGJ5IGEgY29tbWVudCBub2RlIGFuZFxuICAvLyBjYW4ndCBiZSB1c2VkIGFzIGEgcmVuZGVyIHBhcmVudC4gQWxzbyBza2lwIGxldCBkZWNsYXJhdGlvbnMgc2luY2UgdGhleSBkb24ndCBoYXZlIGFcbiAgLy8gY29ycmVzcG9uZGluZyBET00gbm9kZSBhdCBhbGwuXG4gIHdoaWxlIChcbiAgICBwYXJlbnRUTm9kZSAhPT0gbnVsbCAmJlxuICAgIHBhcmVudFROb2RlLnR5cGUgJiAoVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIgfCBUTm9kZVR5cGUuSWN1IHwgVE5vZGVUeXBlLkxldERlY2xhcmF0aW9uKVxuICApIHtcbiAgICB0Tm9kZSA9IHBhcmVudFROb2RlO1xuICAgIHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBhcmVudCB0Tm9kZSBpcyBudWxsLCB0aGVuIHdlIGFyZSBpbnNlcnRpbmcgYWNyb3NzIHZpZXdzOiBlaXRoZXIgaW50byBhbiBlbWJlZGRlZCB2aWV3XG4gIC8vIG9yIGEgY29tcG9uZW50IHZpZXcuXG4gIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgYSByb290IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudCB2aWV3IGludG8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYW5kXG4gICAgLy8gaXQgc2hvdWxkIGFsd2F5cyBiZSBlYWdlci5cbiAgICByZXR1cm4gbFZpZXdbSE9TVF07XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZShwYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3Qge2NvbXBvbmVudE9mZnNldH0gPSBwYXJlbnRUTm9kZTtcbiAgICBpZiAoY29tcG9uZW50T2Zmc2V0ID4gLTEpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHBhcmVudFROb2RlLCBsVmlldyk7XG4gICAgICBjb25zdCB7ZW5jYXBzdWxhdGlvbn0gPSB0Vmlldy5kYXRhW1xuICAgICAgICBwYXJlbnRUTm9kZS5kaXJlY3RpdmVTdGFydCArIGNvbXBvbmVudE9mZnNldFxuICAgICAgXSBhcyBDb21wb25lbnREZWY8dW5rbm93bj47XG4gICAgICAvLyBXZSd2ZSBnb3QgYSBwYXJlbnQgd2hpY2ggaXMgYW4gZWxlbWVudCBpbiB0aGUgY3VycmVudCB2aWV3LiBXZSBqdXN0IG5lZWQgdG8gdmVyaWZ5IGlmIHRoZVxuICAgICAgLy8gcGFyZW50IGVsZW1lbnQgaXMgbm90IGEgY29tcG9uZW50LiBDb21wb25lbnQncyBjb250ZW50IG5vZGVzIGFyZSBub3QgaW5zZXJ0ZWQgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGJlY2F1c2UgdGhleSB3aWxsIGJlIHByb2plY3RlZCwgYW5kIHNvIGRvaW5nIGluc2VydCBhdCB0aGlzIHBvaW50IHdvdWxkIGJlIHdhc3RlZnVsLlxuICAgICAgLy8gU2luY2UgdGhlIHByb2plY3Rpb24gd291bGQgdGhlbiBtb3ZlIGl0IHRvIGl0cyBmaW5hbCBkZXN0aW5hdGlvbi4gTm90ZSB0aGF0IHdlIGNhbid0XG4gICAgICAvLyBtYWtlIHRoaXMgYXNzdW1wdGlvbiB3aGVuIHVzaW5nIHRoZSBTaGFkb3cgRE9NLCBiZWNhdXNlIHRoZSBuYXRpdmUgcHJvamVjdGlvbiBwbGFjZWhvbGRlcnNcbiAgICAgIC8vICg8Y29udGVudD4gb3IgPHNsb3Q+KSBoYXZlIHRvIGJlIGluIHBsYWNlIGFzIGVsZW1lbnRzIGFyZSBiZWluZyBpbnNlcnRlZC5cbiAgICAgIGlmIChcbiAgICAgICAgZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uTm9uZSB8fFxuICAgICAgICBlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5FbXVsYXRlZFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnZXROYXRpdmVCeVROb2RlKHBhcmVudFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmF0aXZlIG5vZGUgYmVmb3JlIGFub3RoZXIgbmF0aXZlIG5vZGUgZm9yIGEgZ2l2ZW4gcGFyZW50LlxuICogVGhpcyBpcyBhIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjYW4gYmUgdXNlZCB3aGVuIG5hdGl2ZSBub2RlcyB3ZXJlIGRldGVybWluZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVJbnNlcnRCZWZvcmUoXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgcGFyZW50OiBSRWxlbWVudCxcbiAgY2hpbGQ6IFJOb2RlLFxuICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwsXG4gIGlzTW92ZTogYm9vbGVhbixcbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVySW5zZXJ0QmVmb3JlKys7XG4gIHJlbmRlcmVyLmluc2VydEJlZm9yZShwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlLCBpc01vdmUpO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRDaGlsZChyZW5kZXJlcjogUmVuZGVyZXIsIHBhcmVudDogUkVsZW1lbnQsIGNoaWxkOiBSTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQXBwZW5kQ2hpbGQrKztcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocGFyZW50LCAncGFyZW50IG5vZGUgbXVzdCBiZSBkZWZpbmVkJyk7XG4gIHJlbmRlcmVyLmFwcGVuZENoaWxkKHBhcmVudCwgY2hpbGQpO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVBcHBlbmRPckluc2VydEJlZm9yZShcbiAgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICBwYXJlbnQ6IFJFbGVtZW50LFxuICBjaGlsZDogUk5vZGUsXG4gIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCxcbiAgaXNNb3ZlOiBib29sZWFuLFxuKSB7XG4gIGlmIChiZWZvcmVOb2RlICE9PSBudWxsKSB7XG4gICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkLCBiZWZvcmVOb2RlLCBpc01vdmUpO1xuICB9IGVsc2Uge1xuICAgIG5hdGl2ZUFwcGVuZENoaWxkKHJlbmRlcmVyLCBwYXJlbnQsIGNoaWxkKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBuYXRpdmUgcGFyZW50IG9mIGEgZ2l2ZW4gbmF0aXZlIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgbm9kZTogUk5vZGUpOiBSRWxlbWVudCB8IG51bGwge1xuICByZXR1cm4gcmVuZGVyZXIucGFyZW50Tm9kZShub2RlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmF0aXZlIHNpYmxpbmcgb2YgYSBnaXZlbiBuYXRpdmUgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdGl2ZU5leHRTaWJsaW5nKHJlbmRlcmVyOiBSZW5kZXJlciwgbm9kZTogUk5vZGUpOiBSTm9kZSB8IG51bGwge1xuICByZXR1cm4gcmVuZGVyZXIubmV4dFNpYmxpbmcobm9kZSk7XG59XG5cbi8qKlxuICogRmluZCBhIG5vZGUgaW4gZnJvbnQgb2Ygd2hpY2ggYGN1cnJlbnRUTm9kZWAgc2hvdWxkIGJlIGluc2VydGVkLlxuICpcbiAqIFRoaXMgbWV0aG9kIGRldGVybWluZXMgdGhlIGBSTm9kZWAgaW4gZnJvbnQgb2Ygd2hpY2ggd2Ugc2hvdWxkIGluc2VydCB0aGUgYGN1cnJlbnRSTm9kZWAuIFRoaXNcbiAqIHRha2VzIGBUTm9kZS5pbnNlcnRCZWZvcmVJbmRleGAgaW50byBhY2NvdW50IGlmIGkxOG4gY29kZSBoYXMgYmVlbiBpbnZva2VkLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRUTm9kZSBwYXJlbnQgYFROb2RlYFxuICogQHBhcmFtIGN1cnJlbnRUTm9kZSBjdXJyZW50IGBUTm9kZWAgKFRoZSBub2RlIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gaW5zZXJ0IGludG8gdGhlIERPTSlcbiAqIEBwYXJhbSBsVmlldyBjdXJyZW50IGBMVmlld2BcbiAqL1xuZnVuY3Rpb24gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGUoXG4gIHBhcmVudFROb2RlOiBUTm9kZSxcbiAgY3VycmVudFROb2RlOiBUTm9kZSxcbiAgbFZpZXc6IExWaWV3LFxuKTogUk5vZGUgfCBudWxsIHtcbiAgcmV0dXJuIF9nZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuKHBhcmVudFROb2RlLCBjdXJyZW50VE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBGaW5kIGEgbm9kZSBpbiBmcm9udCBvZiB3aGljaCBgY3VycmVudFROb2RlYCBzaG91bGQgYmUgaW5zZXJ0ZWQuIChEb2VzIG5vdCB0YWtlIGkxOG4gaW50b1xuICogYWNjb3VudClcbiAqXG4gKiBUaGlzIG1ldGhvZCBkZXRlcm1pbmVzIHRoZSBgUk5vZGVgIGluIGZyb250IG9mIHdoaWNoIHdlIHNob3VsZCBpbnNlcnQgdGhlIGBjdXJyZW50Uk5vZGVgLiBUaGlzXG4gKiBkb2VzIG5vdCB0YWtlIGBUTm9kZS5pbnNlcnRCZWZvcmVJbmRleGAgaW50byBhY2NvdW50LlxuICpcbiAqIEBwYXJhbSBwYXJlbnRUTm9kZSBwYXJlbnQgYFROb2RlYFxuICogQHBhcmFtIGN1cnJlbnRUTm9kZSBjdXJyZW50IGBUTm9kZWAgKFRoZSBub2RlIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gaW5zZXJ0IGludG8gdGhlIERPTSlcbiAqIEBwYXJhbSBsVmlldyBjdXJyZW50IGBMVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aE5vSTE4bihcbiAgcGFyZW50VE5vZGU6IFROb2RlLFxuICBjdXJyZW50VE5vZGU6IFROb2RlLFxuICBsVmlldzogTFZpZXcsXG4pOiBSTm9kZSB8IG51bGwge1xuICBpZiAocGFyZW50VE5vZGUudHlwZSAmIChUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciB8IFROb2RlVHlwZS5JY3UpKSB7XG4gICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUocGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBUcmVlIHNoYWthYmxlIGJvdW5kYXJ5IGZvciBgZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bmAgZnVuY3Rpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG9ubHkgYmUgc2V0IGlmIGkxOG4gY29kZSBydW5zLlxuICovXG5sZXQgX2dldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aEkxOG46IChcbiAgcGFyZW50VE5vZGU6IFROb2RlLFxuICBjdXJyZW50VE5vZGU6IFROb2RlLFxuICBsVmlldzogTFZpZXcsXG4pID0+IFJOb2RlIHwgbnVsbCA9IGdldEluc2VydEluRnJvbnRPZlJOb2RlV2l0aE5vSTE4bjtcblxuLyoqXG4gKiBUcmVlIHNoYWthYmxlIGJvdW5kYXJ5IGZvciBgcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmVgIGZ1bmN0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBvbmx5IGJlIHNldCBpZiBpMThuIGNvZGUgcnVucy5cbiAqL1xubGV0IF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZTogKFxuICByZW5kZXJlcjogUmVuZGVyZXIsXG4gIGNoaWxkVE5vZGU6IFROb2RlLFxuICBsVmlldzogTFZpZXcsXG4gIGNoaWxkUk5vZGU6IFJOb2RlIHwgUk5vZGVbXSxcbiAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCxcbikgPT4gdm9pZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldEkxOG5IYW5kbGluZyhcbiAgZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bjogKFxuICAgIHBhcmVudFROb2RlOiBUTm9kZSxcbiAgICBjdXJyZW50VE5vZGU6IFROb2RlLFxuICAgIGxWaWV3OiBMVmlldyxcbiAgKSA9PiBSTm9kZSB8IG51bGwsXG4gIHByb2Nlc3NJMThuSW5zZXJ0QmVmb3JlOiAoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICAgIGNoaWxkVE5vZGU6IFROb2RlLFxuICAgIGxWaWV3OiBMVmlldyxcbiAgICBjaGlsZFJOb2RlOiBSTm9kZSB8IFJOb2RlW10sXG4gICAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgKSA9PiB2b2lkLFxuKSB7XG4gIF9nZXRJbnNlcnRJbkZyb250T2ZSTm9kZVdpdGhJMThuID0gZ2V0SW5zZXJ0SW5Gcm9udE9mUk5vZGVXaXRoSTE4bjtcbiAgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlID0gcHJvY2Vzc0kxOG5JbnNlcnRCZWZvcmU7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBuYXRpdmUgbm9kZSAob3IgYSBjb2xsZWN0aW9uIG9mIG5vZGVzKSB0byB0aGUgYHBhcmVudGAuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXcnIHRvIGJlIGFwcGVuZGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGN1cnJlbnQgTFZpZXdcbiAqIEBwYXJhbSBjaGlsZFJOb2RlIFRoZSBuYXRpdmUgY2hpbGQgKG9yIGNoaWxkcmVuKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGNoaWxkVE5vZGUgVGhlIFROb2RlIG9mIHRoZSBjaGlsZCBlbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIGNoaWxkUk5vZGU6IFJOb2RlIHwgUk5vZGVbXSxcbiAgY2hpbGRUTm9kZTogVE5vZGUsXG4pOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50Uk5vZGUgPSBnZXRQYXJlbnRSRWxlbWVudCh0VmlldywgY2hpbGRUTm9kZSwgbFZpZXcpO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgcGFyZW50VE5vZGU6IFROb2RlID0gY2hpbGRUTm9kZS5wYXJlbnQgfHwgbFZpZXdbVF9IT1NUXSE7XG4gIGNvbnN0IGFuY2hvck5vZGUgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZShwYXJlbnRUTm9kZSwgY2hpbGRUTm9kZSwgbFZpZXcpO1xuICBpZiAocGFyZW50Uk5vZGUgIT0gbnVsbCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkUk5vZGUpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkUk5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbmF0aXZlQXBwZW5kT3JJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCBjaGlsZFJOb2RlW2ldLCBhbmNob3JOb2RlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZUFwcGVuZE9ySW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnRSTm9kZSwgY2hpbGRSTm9kZSwgYW5jaG9yTm9kZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIF9wcm9jZXNzSTE4bkluc2VydEJlZm9yZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgX3Byb2Nlc3NJMThuSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBjaGlsZFROb2RlLCBsVmlldywgY2hpbGRSTm9kZSwgcGFyZW50Uk5vZGUpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IG5hdGl2ZSBub2RlIGZvciBhIGdpdmVuIExWaWV3LCBzdGFydGluZyBmcm9tIHRoZSBwcm92aWRlZCBUTm9kZS5cbiAqXG4gKiBOYXRpdmUgbm9kZXMgYXJlIHJldHVybmVkIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aG9zZSBhcHBlYXIgaW4gdGhlIG5hdGl2ZSB0cmVlIChET00pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCk6IFJOb2RlIHwgbnVsbCB7XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0VE5vZGVUeXBlKFxuICAgICAgICB0Tm9kZSxcbiAgICAgICAgVE5vZGVUeXBlLkFueVJOb2RlIHxcbiAgICAgICAgICBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHxcbiAgICAgICAgICBUTm9kZVR5cGUuSWN1IHxcbiAgICAgICAgICBUTm9kZVR5cGUuUHJvamVjdGlvbiB8XG4gICAgICAgICAgVE5vZGVUeXBlLkxldERlY2xhcmF0aW9uLFxuICAgICAgKTtcblxuICAgIGNvbnN0IHROb2RlVHlwZSA9IHROb2RlLnR5cGU7XG4gICAgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgICAgcmV0dXJuIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KTtcbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldygtMSwgbFZpZXdbdE5vZGUuaW5kZXhdKTtcbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICBjb25zdCBlbEljdUNvbnRhaW5lckNoaWxkID0gdE5vZGUuY2hpbGQ7XG4gICAgICBpZiAoZWxJY3VDb250YWluZXJDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3LCBlbEljdUNvbnRhaW5lckNoaWxkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJOb2RlT3JMQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICAgICAgICBpZiAoaXNMQ29udGFpbmVyKHJOb2RlT3JMQ29udGFpbmVyKSkge1xuICAgICAgICAgIHJldHVybiBnZXRCZWZvcmVOb2RlRm9yVmlldygtMSwgck5vZGVPckxDb250YWluZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB1bndyYXBSTm9kZShyTm9kZU9yTENvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5MZXREZWNsYXJhdGlvbikge1xuICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgdE5vZGUubmV4dCk7XG4gICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuSWN1KSB7XG4gICAgICBsZXQgbmV4dFJOb2RlID0gaWN1Q29udGFpbmVySXRlcmF0ZSh0Tm9kZSBhcyBUSWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgICAgbGV0IHJOb2RlOiBSTm9kZSB8IG51bGwgPSBuZXh0Uk5vZGUoKTtcbiAgICAgIC8vIElmIHRoZSBJQ1UgY29udGFpbmVyIGhhcyBubyBub2RlcywgdGhhbiB3ZSB1c2UgdGhlIElDVSBhbmNob3IgYXMgdGhlIG5vZGUuXG4gICAgICByZXR1cm4gck5vZGUgfHwgdW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJvamVjdGlvbk5vZGVzID0gZ2V0UHJvamVjdGlvbk5vZGVzKGxWaWV3LCB0Tm9kZSk7XG4gICAgICBpZiAocHJvamVjdGlvbk5vZGVzICE9PSBudWxsKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByb2plY3Rpb25Ob2RlcykpIHtcbiAgICAgICAgICByZXR1cm4gcHJvamVjdGlvbk5vZGVzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcmVudFZpZXcgPSBnZXRMVmlld1BhcmVudChsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10pO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UGFyZW50VmlldyhwYXJlbnRWaWV3KTtcbiAgICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShwYXJlbnRWaWV3ISwgcHJvamVjdGlvbk5vZGVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIHROb2RlLm5leHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdGlvbk5vZGVzKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlIHwgbnVsbCk6IFROb2RlIHwgUk5vZGVbXSB8IG51bGwge1xuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudEhvc3QgPSBjb21wb25lbnRWaWV3W1RfSE9TVF0gYXMgVEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IHNsb3RJZHggPSB0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJvamVjdGlvblNsb3RzKGxWaWV3KTtcbiAgICByZXR1cm4gY29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIVtzbG90SWR4XTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJlZm9yZU5vZGVGb3JWaWV3KFxuICB2aWV3SW5kZXhJbkNvbnRhaW5lcjogbnVtYmVyLFxuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuKTogUk5vZGUgfCBudWxsIHtcbiAgY29uc3QgbmV4dFZpZXdJbmRleCA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUICsgdmlld0luZGV4SW5Db250YWluZXIgKyAxO1xuICBpZiAobmV4dFZpZXdJbmRleCA8IGxDb250YWluZXIubGVuZ3RoKSB7XG4gICAgY29uc3QgbFZpZXcgPSBsQ29udGFpbmVyW25leHRWaWV3SW5kZXhdIGFzIExWaWV3O1xuICAgIGNvbnN0IGZpcnN0VE5vZGVPZlZpZXcgPSBsVmlld1tUVklFV10uZmlyc3RDaGlsZDtcbiAgICBpZiAoZmlyc3RUTm9kZU9mVmlldyAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgZmlyc3RUTm9kZU9mVmlldyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxDb250YWluZXJbTkFUSVZFXTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgbmF0aXZlIG5vZGUgaXRzZWxmIHVzaW5nIGEgZ2l2ZW4gcmVuZGVyZXIuIFRvIHJlbW92ZSB0aGUgbm9kZSB3ZSBhcmUgbG9va2luZyB1cCBpdHNcbiAqIHBhcmVudCBmcm9tIHRoZSBuYXRpdmUgdHJlZSBhcyBub3QgYWxsIHBsYXRmb3JtcyAvIGJyb3dzZXJzIHN1cHBvcnQgdGhlIGVxdWl2YWxlbnQgb2ZcbiAqIG5vZGUucmVtb3ZlKCkuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gYmUgdXNlZFxuICogQHBhcmFtIHJOb2RlIFRoZSBuYXRpdmUgbm9kZSB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG4gKiBAcGFyYW0gaXNIb3N0RWxlbWVudCBBIGZsYWcgaW5kaWNhdGluZyBpZiBhIG5vZGUgdG8gYmUgcmVtb3ZlZCBpcyBhIGhvc3Qgb2YgYSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXRpdmVSZW1vdmVOb2RlKHJlbmRlcmVyOiBSZW5kZXJlciwgck5vZGU6IFJOb2RlLCBpc0hvc3RFbGVtZW50PzogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xuICByZW5kZXJlci5yZW1vdmVDaGlsZChudWxsLCByTm9kZSwgaXNIb3N0RWxlbWVudCk7XG59XG5cbi8qKlxuICogQ2xlYXJzIHRoZSBjb250ZW50cyBvZiBhIGdpdmVuIFJFbGVtZW50LlxuICpcbiAqIEBwYXJhbSByRWxlbWVudCB0aGUgbmF0aXZlIFJFbGVtZW50IHRvIGJlIGNsZWFyZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyRWxlbWVudENvbnRlbnRzKHJFbGVtZW50OiBSRWxlbWVudCk6IHZvaWQge1xuICByRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIHRoZSBvcGVyYXRpb24gb2YgYGFjdGlvbmAgb24gdGhlIG5vZGUuIFR5cGljYWxseSB0aGlzIGludm9sdmVzIGluc2VydGluZyBvciByZW1vdmluZ1xuICogbm9kZXMgb24gdGhlIExWaWV3IG9yIHByb2plY3Rpb24gYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5Tm9kZXMoXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLFxuICB0Tm9kZTogVE5vZGUgfCBudWxsLFxuICBsVmlldzogTFZpZXcsXG4gIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudCB8IG51bGwsXG4gIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCxcbiAgaXNQcm9qZWN0aW9uOiBib29sZWFuLFxuKSB7XG4gIHdoaWxlICh0Tm9kZSAhPSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGxWaWV3KTtcblxuICAgIC8vIExldCBkZWNsYXJhdGlvbnMgZG9uJ3QgaGF2ZSBjb3JyZXNwb25kaW5nIERPTSBub2RlcyBzbyB3ZSBza2lwIG92ZXIgdGhlbS5cbiAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkxldERlY2xhcmF0aW9uKSB7XG4gICAgICB0Tm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgdE5vZGUsXG4gICAgICAgIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuUHJvamVjdGlvbiB8IFROb2RlVHlwZS5JY3UsXG4gICAgICApO1xuICAgIGNvbnN0IHJhd1Nsb3RWYWx1ZSA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgICBjb25zdCB0Tm9kZVR5cGUgPSB0Tm9kZS50eXBlO1xuICAgIGlmIChpc1Byb2plY3Rpb24pIHtcbiAgICAgIGlmIChhY3Rpb24gPT09IFdhbGtUTm9kZVRyZWVBY3Rpb24uQ3JlYXRlKSB7XG4gICAgICAgIHJhd1Nsb3RWYWx1ZSAmJiBhdHRhY2hQYXRjaERhdGEodW53cmFwUk5vZGUocmF3U2xvdFZhbHVlKSwgbFZpZXcpO1xuICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0RldGFjaGVkKSAhPT0gVE5vZGVGbGFncy5pc0RldGFjaGVkKSB7XG4gICAgICBpZiAodE5vZGVUeXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgYXBwbHlOb2RlcyhyZW5kZXJlciwgYWN0aW9uLCB0Tm9kZS5jaGlsZCwgbFZpZXcsIHBhcmVudFJFbGVtZW50LCBiZWZvcmVOb2RlLCBmYWxzZSk7XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlVHlwZSAmIFROb2RlVHlwZS5JY3UpIHtcbiAgICAgICAgY29uc3QgbmV4dFJOb2RlID0gaWN1Q29udGFpbmVySXRlcmF0ZSh0Tm9kZSBhcyBUSWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgICAgICBsZXQgck5vZGU6IFJOb2RlIHwgbnVsbDtcbiAgICAgICAgd2hpbGUgKChyTm9kZSA9IG5leHRSTm9kZSgpKSkge1xuICAgICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJOb2RlLCBiZWZvcmVOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBhcHBseVRvRWxlbWVudE9yQ29udGFpbmVyKGFjdGlvbiwgcmVuZGVyZXIsIHBhcmVudFJFbGVtZW50LCByYXdTbG90VmFsdWUsIGJlZm9yZU5vZGUpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZVR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBhcHBseVByb2plY3Rpb25SZWN1cnNpdmUoXG4gICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgIGxWaWV3LFxuICAgICAgICAgIHROb2RlIGFzIFRQcm9qZWN0aW9uTm9kZSxcbiAgICAgICAgICBwYXJlbnRSRWxlbWVudCxcbiAgICAgICAgICBiZWZvcmVOb2RlLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIHJhd1Nsb3RWYWx1ZSwgYmVmb3JlTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHROb2RlID0gaXNQcm9qZWN0aW9uID8gdE5vZGUucHJvamVjdGlvbk5leHQgOiB0Tm9kZS5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogYGFwcGx5Vmlld2AgcGVyZm9ybXMgb3BlcmF0aW9uIG9uIHRoZSB2aWV3IGFzIHNwZWNpZmllZCBpbiBgYWN0aW9uYCAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgdmlldyB3aXRob3V0IHByb2plY3Rpb24gb3IgY29udGFpbmVycyBhdCB0b3AgbGV2ZWwgaXMgc2ltcGxlLiBKdXN0IGl0ZXJhdGUgb3ZlciB0aGVcbiAqIHJvb3Qgbm9kZXMgb2YgdGhlIFZpZXcsIGFuZCBmb3IgZWFjaCBub2RlIHBlcmZvcm0gdGhlIGBhY3Rpb25gLlxuICpcbiAqIFRoaW5ncyBnZXQgbW9yZSBjb21wbGljYXRlZCB3aXRoIGNvbnRhaW5lcnMgYW5kIHByb2plY3Rpb25zLiBUaGF0IGlzIGJlY2F1c2UgY29taW5nIGFjcm9zczpcbiAqIC0gQ29udGFpbmVyOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIHZpZXdzIG9mIHRoYXQgY29udGFpbmVyIGFzIHdlbGxcbiAqICAgICAgICAgICAgICB3aGljaCBpbiB0dXJuIGNhbiBoYXZlIHRoZWlyIG93biBDb250YWluZXJzIGF0IHRoZSBWaWV3IHJvb3RzLlxuICogLSBQcm9qZWN0aW9uOiBpbXBsaWVzIHRoYXQgd2UgaGF2ZSB0byBpbnNlcnQvcmVtb3ZlL2Rlc3Ryb3kgdGhlIG5vZGVzIG9mIHRoZSBwcm9qZWN0aW9uLiBUaGVcbiAqICAgICAgICAgICAgICAgY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhlIG5vZGVzIHdlIGFyZSBwcm9qZWN0aW5nIGNhbiB0aGVtc2VsdmVzIGhhdmUgQ29udGFpbmVyc1xuICogICAgICAgICAgICAgICBvciBvdGhlciBQcm9qZWN0aW9ucy5cbiAqXG4gKiBBcyB5b3UgY2FuIHNlZSB0aGlzIGlzIGEgdmVyeSByZWN1cnNpdmUgcHJvYmxlbS4gWWVzIHJlY3Vyc2lvbiBpcyBub3QgbW9zdCBlZmZpY2llbnQgYnV0IHRoZVxuICogY29kZSBpcyBjb21wbGljYXRlZCBlbm91Z2ggdGhhdCB0cnlpbmcgdG8gaW1wbGVtZW50ZWQgd2l0aCByZWN1cnNpb24gYmVjb21lcyB1bm1haW50YWluYWJsZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlldycgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gYWN0aW9uIGFjdGlvbiB0byBwZXJmb3JtIChpbnNlcnQsIGRldGFjaCwgZGVzdHJveSlcbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbiAoUmVtb3ZhbCBkb2VzIG5vdCBuZWVkIGl0KS5cbiAqIEBwYXJhbSBiZWZvcmVOb2RlIEJlZm9yZSB3aGljaCBub2RlIHRoZSBpbnNlcnRpb25zIHNob3VsZCBoYXBwZW4uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLkRlc3Ryb3ksXG4gIHBhcmVudFJFbGVtZW50OiBudWxsLFxuICBiZWZvcmVOb2RlOiBudWxsLFxuKTogdm9pZDtcbmZ1bmN0aW9uIGFwcGx5VmlldyhcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLFxuICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnQgfCBudWxsLFxuICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwsXG4pOiB2b2lkO1xuZnVuY3Rpb24gYXBwbHlWaWV3KFxuICB0VmlldzogVFZpZXcsXG4gIGxWaWV3OiBMVmlldyxcbiAgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICBhY3Rpb246IFdhbGtUTm9kZVRyZWVBY3Rpb24sXG4gIHBhcmVudFJFbGVtZW50OiBSRWxlbWVudCB8IG51bGwsXG4gIGJlZm9yZU5vZGU6IFJOb2RlIHwgbnVsbCxcbik6IHZvaWQge1xuICBhcHBseU5vZGVzKHJlbmRlcmVyLCBhY3Rpb24sIHRWaWV3LmZpcnN0Q2hpbGQsIGxWaWV3LCBwYXJlbnRSRWxlbWVudCwgYmVmb3JlTm9kZSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIGBhcHBseVByb2plY3Rpb25gIHBlcmZvcm1zIG9wZXJhdGlvbiBvbiB0aGUgcHJvamVjdGlvbi5cbiAqXG4gKiBJbnNlcnRpbmcgYSBwcm9qZWN0aW9uIHJlcXVpcmVzIHVzIHRvIGxvY2F0ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGZyb20gdGhlIHBhcmVudCBjb21wb25lbnQuIFRoZVxuICogY29tcGxpY2F0aW9uIGlzIHRoYXQgdGhvc2Ugbm9kZXMgdGhlbXNlbHZlcyBjb3VsZCBiZSByZS1wcm9qZWN0ZWQgZnJvbSB0aGVpciBwYXJlbnQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3YCBvZiBgTFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2Agd2hpY2ggbmVlZHMgdG8gYmUgaW5zZXJ0ZWQsIGRldGFjaGVkLCBkZXN0cm95ZWQuXG4gKiBAcGFyYW0gdFByb2plY3Rpb25Ob2RlIG5vZGUgdG8gcHJvamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgcGFyZW50Uk5vZGUgPSBnZXRQYXJlbnRSRWxlbWVudCh0VmlldywgdFByb2plY3Rpb25Ob2RlLCBsVmlldyk7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gdFByb2plY3Rpb25Ob2RlLnBhcmVudCB8fCBsVmlld1tUX0hPU1RdITtcbiAgbGV0IGJlZm9yZU5vZGUgPSBnZXRJbnNlcnRJbkZyb250T2ZSTm9kZShwYXJlbnRUTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBsVmlldyk7XG4gIGFwcGx5UHJvamVjdGlvblJlY3Vyc2l2ZShcbiAgICByZW5kZXJlcixcbiAgICBXYWxrVE5vZGVUcmVlQWN0aW9uLkNyZWF0ZSxcbiAgICBsVmlldyxcbiAgICB0UHJvamVjdGlvbk5vZGUsXG4gICAgcGFyZW50Uk5vZGUsXG4gICAgYmVmb3JlTm9kZSxcbiAgKTtcbn1cblxuLyoqXG4gKiBgYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlYCBwZXJmb3JtcyBvcGVyYXRpb24gb24gdGhlIHByb2plY3Rpb24gc3BlY2lmaWVkIGJ5IGBhY3Rpb25gIChpbnNlcnQsXG4gKiBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgcHJvamVjdGlvbiByZXF1aXJlcyB1cyB0byBsb2NhdGUgdGhlIHByb2plY3RlZCBub2RlcyBmcm9tIHRoZSBwYXJlbnQgY29tcG9uZW50LiBUaGVcbiAqIGNvbXBsaWNhdGlvbiBpcyB0aGF0IHRob3NlIG5vZGVzIHRoZW1zZWx2ZXMgY291bGQgYmUgcmUtcHJvamVjdGVkIGZyb20gdGhlaXIgcGFyZW50IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkLCBkZXRhY2hlZCwgZGVzdHJveWVkLlxuICogQHBhcmFtIHRQcm9qZWN0aW9uTm9kZSBub2RlIHRvIHByb2plY3RcbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlQcm9qZWN0aW9uUmVjdXJzaXZlKFxuICByZW5kZXJlcjogUmVuZGVyZXIsXG4gIGFjdGlvbjogV2Fsa1ROb2RlVHJlZUFjdGlvbixcbiAgbFZpZXc6IExWaWV3LFxuICB0UHJvamVjdGlvbk5vZGU6IFRQcm9qZWN0aW9uTm9kZSxcbiAgcGFyZW50UkVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCxcbiAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsLFxuKSB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50TFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydEVxdWFsKHR5cGVvZiB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiwgJ251bWJlcicsICdleHBlY3RpbmcgcHJvamVjdGlvbiBpbmRleCcpO1xuICBjb25zdCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMgPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24hW3RQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uXSE7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVUb1Byb2plY3RPclJOb2RlcykpIHtcbiAgICAvLyBUaGlzIHNob3VsZCBub3QgZXhpc3QsIGl0IGlzIGEgYml0IG9mIGEgaGFjay4gV2hlbiB3ZSBib290c3RyYXAgYSB0b3AgbGV2ZWwgbm9kZSBhbmQgd2VcbiAgICAvLyBuZWVkIHRvIHN1cHBvcnQgcGFzc2luZyBwcm9qZWN0YWJsZSBub2Rlcywgc28gd2UgY2hlYXQgYW5kIHB1dCB0aGVtIGluIHRoZSBUTm9kZVxuICAgIC8vIG9mIHRoZSBIb3N0IFRWaWV3LiAoWWVzIHdlIHB1dCBpbnN0YW5jZSBpbmZvIGF0IHRoZSBUIExldmVsKS4gV2UgY2FuIGdldCBhd2F5IHdpdGggaXRcbiAgICAvLyBiZWNhdXNlIHdlIGtub3cgdGhhdCBUVmlldyBpcyBub3Qgc2hhcmVkIGFuZCB0aGVyZWZvcmUgaXQgd2lsbCBub3QgYmUgYSBwcm9ibGVtLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIHJlZmFjdG9yZWQgYW5kIGNsZWFuZWQgdXAuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlVG9Qcm9qZWN0T3JSTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJOb2RlID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzW2ldO1xuICAgICAgYXBwbHlUb0VsZW1lbnRPckNvbnRhaW5lcihhY3Rpb24sIHJlbmRlcmVyLCBwYXJlbnRSRWxlbWVudCwgck5vZGUsIGJlZm9yZU5vZGUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogVE5vZGUgfCBudWxsID0gbm9kZVRvUHJvamVjdE9yUk5vZGVzO1xuICAgIGNvbnN0IHByb2plY3RlZENvbXBvbmVudExWaWV3ID0gY29tcG9uZW50TFZpZXdbUEFSRU5UXSBhcyBMVmlldztcbiAgICAvLyBJZiBhIHBhcmVudCA8bmctY29udGVudD4gaXMgbG9jYXRlZCB3aXRoaW4gYSBza2lwIGh5ZHJhdGlvbiBibG9jayxcbiAgICAvLyBhbm5vdGF0ZSBhbiBhY3R1YWwgbm9kZSB0aGF0IGlzIGJlaW5nIHByb2plY3RlZCB3aXRoIHRoZSBzYW1lIGZsYWcgdG9vLlxuICAgIGlmIChoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcodFByb2plY3Rpb25Ob2RlKSkge1xuICAgICAgbm9kZVRvUHJvamVjdC5mbGFncyB8PSBUTm9kZUZsYWdzLmluU2tpcEh5ZHJhdGlvbkJsb2NrO1xuICAgIH1cbiAgICBhcHBseU5vZGVzKFxuICAgICAgcmVuZGVyZXIsXG4gICAgICBhY3Rpb24sXG4gICAgICBub2RlVG9Qcm9qZWN0LFxuICAgICAgcHJvamVjdGVkQ29tcG9uZW50TFZpZXcsXG4gICAgICBwYXJlbnRSRWxlbWVudCxcbiAgICAgIGJlZm9yZU5vZGUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBgYXBwbHlDb250YWluZXJgIHBlcmZvcm1zIGFuIG9wZXJhdGlvbiBvbiB0aGUgY29udGFpbmVyIGFuZCBpdHMgdmlld3MgYXMgc3BlY2lmaWVkIGJ5XG4gKiBgYWN0aW9uYCAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKlxuICogSW5zZXJ0aW5nIGEgQ29udGFpbmVyIGlzIGNvbXBsaWNhdGVkIGJ5IHRoZSBmYWN0IHRoYXQgdGhlIGNvbnRhaW5lciBtYXkgaGF2ZSBWaWV3cyB3aGljaFxuICogdGhlbXNlbHZlcyBoYXZlIGNvbnRhaW5lcnMgb3IgcHJvamVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGFjdGlvbiBhY3Rpb24gdG8gcGVyZm9ybSAoaW5zZXJ0LCBkZXRhY2gsIGRlc3Ryb3kpXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgTENvbnRhaW5lciB3aGljaCBuZWVkcyB0byBiZSBpbnNlcnRlZCwgZGV0YWNoZWQsIGRlc3Ryb3llZC5cbiAqIEBwYXJhbSBwYXJlbnRSRWxlbWVudCBwYXJlbnQgRE9NIGVsZW1lbnQgZm9yIGluc2VydGlvbi9yZW1vdmFsLlxuICogQHBhcmFtIGJlZm9yZU5vZGUgQmVmb3JlIHdoaWNoIG5vZGUgdGhlIGluc2VydGlvbnMgc2hvdWxkIGhhcHBlbi5cbiAqL1xuZnVuY3Rpb24gYXBwbHlDb250YWluZXIoXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgYWN0aW9uOiBXYWxrVE5vZGVUcmVlQWN0aW9uLFxuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICBwYXJlbnRSRWxlbWVudDogUkVsZW1lbnQgfCBudWxsLFxuICBiZWZvcmVOb2RlOiBSTm9kZSB8IG51bGwgfCB1bmRlZmluZWQsXG4pIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG4gIGNvbnN0IGFuY2hvciA9IGxDb250YWluZXJbTkFUSVZFXTsgLy8gTENvbnRhaW5lciBoYXMgaXRzIG93biBiZWZvcmUgbm9kZS5cbiAgY29uc3QgbmF0aXZlID0gdW53cmFwUk5vZGUobENvbnRhaW5lcik7XG4gIC8vIEFuIExDb250YWluZXIgY2FuIGJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgb24gYW55IG5vZGUgYnkgaW5qZWN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gIC8vIEFza2luZyBmb3IgYSBWaWV3Q29udGFpbmVyUmVmIG9uIGFuIGVsZW1lbnQgd2lsbCByZXN1bHQgaW4gYSBjcmVhdGlvbiBvZiBhIHNlcGFyYXRlIGFuY2hvclxuICAvLyBub2RlIChjb21tZW50IGluIHRoZSBET00pIHRoYXQgd2lsbCBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgTENvbnRhaW5lcidzIGhvc3Qgbm9kZS4gSW4gdGhpc1xuICAvLyBwYXJ0aWN1bGFyIGNhc2Ugd2UgbmVlZCB0byBleGVjdXRlIGFjdGlvbiBvbiAyIG5vZGVzOlxuICAvLyAtIGNvbnRhaW5lcidzIGhvc3Qgbm9kZSAodGhpcyBpcyBkb25lIGluIHRoZSBleGVjdXRlQWN0aW9uT25FbGVtZW50T3JDb250YWluZXIpXG4gIC8vIC0gY29udGFpbmVyJ3MgaG9zdCBub2RlICh0aGlzIGlzIGRvbmUgaGVyZSlcbiAgaWYgKGFuY2hvciAhPT0gbmF0aXZlKSB7XG4gICAgLy8gVGhpcyBpcyB2ZXJ5IHN0cmFuZ2UgdG8gbWUgKE1pc2tvKS4gSSB3b3VsZCBleHBlY3QgdGhhdCB0aGUgbmF0aXZlIGlzIHNhbWUgYXMgYW5jaG9yLiBJXG4gICAgLy8gZG9uJ3Qgc2VlIGEgcmVhc29uIHdoeSB0aGV5IHNob3VsZCBiZSBkaWZmZXJlbnQsIGJ1dCB0aGV5IGFyZS5cbiAgICAvL1xuICAgIC8vIElmIHRoZXkgYXJlIHdlIG5lZWQgdG8gcHJvY2VzcyB0aGUgc2Vjb25kIGFuY2hvciBhcyB3ZWxsLlxuICAgIGFwcGx5VG9FbGVtZW50T3JDb250YWluZXIoYWN0aW9uLCByZW5kZXJlciwgcGFyZW50UkVsZW1lbnQsIGFuY2hvciwgYmVmb3JlTm9kZSk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGxWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICBhcHBseVZpZXcobFZpZXdbVFZJRVddLCBsVmlldywgcmVuZGVyZXIsIGFjdGlvbiwgcGFyZW50UkVsZW1lbnQsIGFuY2hvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZXMgY2xhc3Mvc3R5bGUgdG8gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgaXQgc2hvdWxkIGJlIHdyaXR0ZW4gdG8gYGNsYXNzYCAoYGZhbHNlYCB0byB3cml0ZSB0byBgc3R5bGVgKVxuICogQHBhcmFtIHJOb2RlIFRoZSBOb2RlIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgdG8gd3JpdGUgdG8uIFRoaXMgd291bGQgYmUgdGhlIGNsYXNzL3N0eWxlIG5hbWUuXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIElmIGBudWxsYC9gdW5kZWZpbmVkYC9gZmFsc2VgIHRoaXMgaXMgY29uc2lkZXJlZCBhIHJlbW92ZSAoc2V0L2FkZFxuICogICAgICAgIG90aGVyd2lzZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICByTm9kZTogUkVsZW1lbnQsXG4gIHByb3A6IHN0cmluZyxcbiAgdmFsdWU6IGFueSxcbikge1xuICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgLy8gV2UgYWN0dWFsbHkgd2FudCBKUyB0cnVlL2ZhbHNlIGhlcmUgYmVjYXVzZSBhbnkgdHJ1dGh5IHZhbHVlIHNob3VsZCBhZGQgdGhlIGNsYXNzXG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICByZW5kZXJlci5yZW1vdmVDbGFzcyhyTm9kZSwgcHJvcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgcmVuZGVyZXIuYWRkQ2xhc3Mock5vZGUsIHByb3ApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgZmxhZ3MgPSBwcm9wLmluZGV4T2YoJy0nKSA9PT0gLTEgPyB1bmRlZmluZWQgOiAoUmVuZGVyZXJTdHlsZUZsYWdzMi5EYXNoQ2FzZSBhcyBudW1iZXIpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIC8qKiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKHJOb2RlLCBwcm9wLCBmbGFncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgdmFsdWUgaXMgaW1wb3J0YW50IGlmIGl0IGVuZHMgd2l0aCBgIWltcG9ydGFudGAuIFRoZSBzdHlsZVxuICAgICAgLy8gcGFyc2VyIHN0cmlwcyBhbnkgc2VtaWNvbG9ucyBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS5cbiAgICAgIGNvbnN0IGlzSW1wb3J0YW50ID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlLmVuZHNXaXRoKCchaW1wb3J0YW50JykgOiBmYWxzZTtcblxuICAgICAgaWYgKGlzSW1wb3J0YW50KSB7XG4gICAgICAgIC8vICFpbXBvcnRhbnQgaGFzIHRvIGJlIHN0cmlwcGVkIGZyb20gdGhlIHZhbHVlIGZvciBpdCB0byBiZSB2YWxpZC5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgwLCAtMTApO1xuICAgICAgICBmbGFncyEgfD0gUmVuZGVyZXJTdHlsZUZsYWdzMi5JbXBvcnRhbnQ7XG4gICAgICB9XG5cbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgcmVuZGVyZXIuc2V0U3R5bGUock5vZGUsIHByb3AsIHZhbHVlLCBmbGFncyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV3JpdGUgYGNzc1RleHRgIHRvIGBSRWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBkb2VzIGRpcmVjdCB3cml0ZSB3aXRob3V0IGFueSByZWNvbmNpbGlhdGlvbi4gVXNlZCBmb3Igd3JpdGluZyBpbml0aWFsIHZhbHVlcywgc29cbiAqIHRoYXQgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGRvIG5vdCBwdWxsIGluIHRoZSBzdHlsZSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZVxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgd2hpY2ggbmVlZHMgdG8gYmUgdXBkYXRlZC5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3IGNsYXNzIGxpc3QgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZURpcmVjdFN0eWxlKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIG5ld1ZhbHVlOiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyhuZXdWYWx1ZSwgXCInbmV3VmFsdWUnIHNob3VsZCBiZSBhIHN0cmluZ1wiKTtcbiAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsICdzdHlsZScsIG5ld1ZhbHVlKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG59XG5cbi8qKlxuICogV3JpdGUgYGNsYXNzTmFtZWAgdG8gYFJFbGVtZW50YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGRvZXMgZGlyZWN0IHdyaXRlIHdpdGhvdXQgYW55IHJlY29uY2lsaWF0aW9uLiBVc2VkIGZvciB3cml0aW5nIGluaXRpYWwgdmFsdWVzLCBzb1xuICogdGhhdCBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgZG8gbm90IHB1bGwgaW4gdGhlIHN0eWxlIHBhcnNlci5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB3aGljaCBuZWVkcyB0byBiZSB1cGRhdGVkLlxuICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXcgY2xhc3MgbGlzdCB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRGlyZWN0Q2xhc3MocmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmV3VmFsdWU6IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKG5ld1ZhbHVlLCBcIiduZXdWYWx1ZScgc2hvdWxkIGJlIGEgc3RyaW5nXCIpO1xuICBpZiAobmV3VmFsdWUgPT09ICcnKSB7XG4gICAgLy8gVGhlcmUgYXJlIHRlc3RzIGluIGBnb29nbGUzYCB3aGljaCBleHBlY3QgYGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpYCB0byBiZSBgbnVsbGAuXG4gICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsICdjbGFzcycpO1xuICB9IGVsc2Uge1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCAnY2xhc3MnLCBuZXdWYWx1ZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldENsYXNzTmFtZSsrO1xufVxuXG4vKiogU2V0cyB1cCB0aGUgc3RhdGljIERPTSBhdHRyaWJ1dGVzIG9uIGFuIGBSTm9kZWAuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBTdGF0aWNBdHRyaWJ1dGVzKHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB7bWVyZ2VkQXR0cnMsIGNsYXNzZXMsIHN0eWxlc30gPSB0Tm9kZTtcblxuICBpZiAobWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMocmVuZGVyZXIsIGVsZW1lbnQsIG1lcmdlZEF0dHJzKTtcbiAgfVxuXG4gIGlmIChjbGFzc2VzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RDbGFzcyhyZW5kZXJlciwgZWxlbWVudCwgY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAoc3R5bGVzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RTdHlsZShyZW5kZXJlciwgZWxlbWVudCwgc3R5bGVzKTtcbiAgfVxufVxuIl19