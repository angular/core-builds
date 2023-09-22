/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken, ɵɵdefineInjectable } from '../../di';
import { findMatchingDehydratedView } from '../../hydration/views';
import { populateDehydratedViewsInContainer } from '../../linker/view_container_ref';
import { assertDefined, assertElement, assertEqual, throwError } from '../../util/assert';
import { afterRender } from '../after_render_hooks';
import { assertIndexInDeclRange, assertLContainer, assertLView, assertTNodeForLView } from '../assert';
import { bindingUpdated } from '../bindings';
import { getComponentDef, getDirectiveDef, getPipeDef } from '../definition';
import { CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { DEFER_BLOCK_STATE, DeferBlockBehavior, DeferBlockInternalState, DeferBlockState, DeferDependenciesLoadingState } from '../interfaces/defer';
import { isDestroyed, isLContainer, isLView } from '../interfaces/type_checks';
import { FLAGS, HEADER_OFFSET, INJECTOR, PARENT, TVIEW } from '../interfaces/view';
import { getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex } from '../state';
import { isPlatformBrowser } from '../util/misc_utils';
import { getConstant, getNativeByIndex, getTNode, removeLViewOnDestroy, storeLViewOnDestroy, walkUpViews } from '../util/view_utils';
import { addLViewToLContainer, createAndRenderEmbeddedLView, removeLViewFromLContainer, shouldAddViewToDom } from '../view_manipulation';
import { onInteraction } from './defer_events';
import { ɵɵtemplate } from './template';
/**
 * Returns whether defer blocks should be triggered.
 *
 * Currently, defer blocks are not triggered on the server,
 * only placeholder content is rendered (if provided).
 */
function shouldTriggerDeferBlock(injector) {
    const config = injector.get(DEFER_BLOCK_CONFIG, null, { optional: true });
    if (config?.behavior === DeferBlockBehavior.Manual) {
        return false;
    }
    return isPlatformBrowser(injector);
}
/**
 * Shims for the `requestIdleCallback` and `cancelIdleCallback` functions for environments
 * where those functions are not available (e.g. Node.js).
 */
const _requestIdleCallback = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout;
const _cancelIdleCallback = typeof requestIdleCallback !== 'undefined' ? cancelIdleCallback : clearTimeout;
/**
 * Creates runtime data structures for `{#defer}` blocks.
 *
 * @param index Index of the `defer` instruction.
 * @param primaryTmplIndex Index of the template with the primary block content.
 * @param dependencyResolverFn Function that contains dependencies for this defer block.
 * @param loadingTmplIndex Index of the template with the `{:loading}` block content.
 * @param placeholderTmplIndex Index of the template with the `{:placeholder}` block content.
 * @param errorTmplIndex Index of the template with the `{:error}` block content.
 * @param loadingConfigIndex Index in the constants array of the configuration of the `{:loading}`.
 *     block.
 * @param placeholderConfigIndexIndex in the constants array of the configuration of the
 *     `{:placeholder}` block.
 *
 * @codeGenApi
 */
export function ɵɵdefer(index, primaryTmplIndex, dependencyResolverFn, loadingTmplIndex, placeholderTmplIndex, errorTmplIndex, loadingConfigIndex, placeholderConfigIndex) {
    const lView = getLView();
    const tView = getTView();
    const tViewConsts = tView.consts;
    const adjustedIndex = index + HEADER_OFFSET;
    ɵɵtemplate(index, null, 0, 0);
    if (tView.firstCreatePass) {
        const deferBlockConfig = {
            primaryTmplIndex,
            loadingTmplIndex: loadingTmplIndex ?? null,
            placeholderTmplIndex: placeholderTmplIndex ?? null,
            errorTmplIndex: errorTmplIndex ?? null,
            placeholderBlockConfig: placeholderConfigIndex != null ?
                getConstant(tViewConsts, placeholderConfigIndex) :
                null,
            loadingBlockConfig: loadingConfigIndex != null ?
                getConstant(tViewConsts, loadingConfigIndex) :
                null,
            dependencyResolverFn: dependencyResolverFn ?? null,
            loadingState: DeferDependenciesLoadingState.NOT_STARTED,
            loadingPromise: null,
        };
        setTDeferBlockDetails(tView, adjustedIndex, deferBlockConfig);
    }
    // Lookup dehydrated views that belong to this LContainer.
    // In client-only mode, this operation is noop.
    const lContainer = lView[adjustedIndex];
    populateDehydratedViewsInContainer(lContainer);
    // Init instance-specific defer details and store it.
    const lDetails = [];
    lDetails[DEFER_BLOCK_STATE] = DeferBlockInternalState.Initial;
    setLDeferBlockDetails(lView, adjustedIndex, lDetails);
}
/**
 * Loads defer block dependencies when a trigger value becomes truthy.
 * @codeGenApi
 */
export function ɵɵdeferWhen(rawValue) {
    const lView = getLView();
    const bindingIndex = nextBindingIndex();
    if (bindingUpdated(lView, bindingIndex, rawValue)) {
        const value = Boolean(rawValue); // handle truthy or falsy values
        const tNode = getSelectedTNode();
        const lDetails = getLDeferBlockDetails(lView, tNode);
        const renderedState = lDetails[DEFER_BLOCK_STATE];
        if (value === false && renderedState === DeferBlockInternalState.Initial) {
            // If nothing is rendered yet, render a placeholder (if defined).
            renderPlaceholder(lView, tNode);
        }
        else if (value === true &&
            (renderedState === DeferBlockInternalState.Initial ||
                renderedState === DeferBlockState.Placeholder)) {
            // The `when` condition has changed to `true`, trigger defer block loading
            // if the block is either in initial (nothing is rendered) or a placeholder
            // state.
            triggerDeferBlock(lView, tNode);
        }
    }
}
/**
 * Prefetches the deferred content when a value becomes truthy.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchWhen(rawValue) {
    const lView = getLView();
    const bindingIndex = nextBindingIndex();
    if (bindingUpdated(lView, bindingIndex, rawValue)) {
        const value = Boolean(rawValue); // handle truthy or falsy values
        const tView = lView[TVIEW];
        const tNode = getSelectedTNode();
        const tDetails = getTDeferBlockDetails(tView, tNode);
        if (value === true && tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
            // If loading has not been started yet, trigger it now.
            triggerPrefetching(tDetails, lView);
        }
    }
}
/**
 * Sets up handlers that represent `on idle` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnIdle() {
    const lView = getLView();
    const tNode = getCurrentTNode();
    renderPlaceholder(lView, tNode);
    // Note: we pass an `lView` as a second argument to cancel an `idle`
    // callback in case an LView got destroyed before an `idle` callback
    // is invoked.
    onIdle(() => triggerDeferBlock(lView, tNode), lView);
}
/**
 * Creates runtime data structures for the `prefetch on idle` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnIdle() {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        // Prevent scheduling more than one `requestIdleCallback` call
        // for each defer block. For this reason we use only a trigger
        // identifier in a key, so all instances would use the same key.
        const key = String(0 /* DeferBlockTriggers.OnIdle */);
        const injector = lView[INJECTOR];
        const manager = injector.get(DeferBlockCleanupManager);
        if (!manager.has(tDetails, key)) {
            // In case of prefetching, we intentionally avoid cancelling resource loading if
            // an underlying LView get destroyed (thus passing `null` as a second argument),
            // because there might be other LViews (that represent embedded views) that
            // depend on resource loading.
            const cleanupFn = onIdle(() => triggerPrefetching(tDetails, lView), null /* LView */);
            registerTDetailsCleanup(injector, tDetails, key, cleanupFn);
        }
    }
}
/**
 * Creates runtime data structures for the `on immediate` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnImmediate() { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on immediate` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnImmediate() { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `on timer` deferred trigger.
 * @param delay Amount of time to wait before loading the content.
 * @codeGenApi
 */
export function ɵɵdeferOnTimer(delay) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on timer` deferred trigger.
 * @param delay Amount of time to wait before prefetching the content.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnTimer(delay) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `on hover` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnHover() { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on hover` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnHover() { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `on interaction` deferred trigger.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to walk up/down the tree hierarchy to find the trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnInteraction(triggerIndex, walkUpTimes) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    renderPlaceholder(lView, tNode);
    registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onInteraction, () => triggerDeferBlock(lView, tNode));
}
/**
 * Creates runtime data structures for the `prefetch on interaction` deferred trigger.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to walk up/down the tree hierarchy to find the trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnInteraction(triggerIndex, walkUpTimes) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onInteraction, () => triggerPrefetching(tDetails, lView));
    }
}
/**
 * Creates runtime data structures for the `on viewport` deferred trigger.
 * @param target Optional element on which to listen for hover events.
 * @codeGenApi
 */
export function ɵɵdeferOnViewport(target) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on viewport` deferred trigger.
 * @param target Optional element on which to listen for hover events.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnViewport(target) { } // TODO: implement runtime logic.
/********** Helper functions **********/
/**
 * Helper function to get the LView in which a deferred block's trigger is rendered.
 * @param deferredHostLView LView in which the deferred block is defined.
 * @param deferredTNode TNode defining the deferred block.
 * @param walkUpTimes Number of times to go up in the view hierarchy to find the trigger's view.
 *   A negative value means that the trigger is inside the block's placeholder, while an undefined
 *   value means that the trigger is in the same LView as the deferred block.
 */
function getTriggerLView(deferredHostLView, deferredTNode, walkUpTimes) {
    // The trigger is in the same view, we don't need to traverse.
    if (walkUpTimes == null) {
        return deferredHostLView;
    }
    // A positive value or zero means that the trigger is in a parent view.
    if (walkUpTimes >= 0) {
        return walkUpViews(walkUpTimes, deferredHostLView);
    }
    // If the value is negative, it means that the trigger is inside the placeholder.
    const deferredContainer = deferredHostLView[deferredTNode.index];
    ngDevMode && assertLContainer(deferredContainer);
    const triggerLView = deferredContainer[CONTAINER_HEADER_OFFSET] ?? null;
    // We need to null check, because the placeholder might not have been rendered yet.
    if (ngDevMode && triggerLView !== null) {
        const lDetails = getLDeferBlockDetails(deferredHostLView, deferredTNode);
        const renderedState = lDetails[DEFER_BLOCK_STATE];
        assertEqual(renderedState, DeferBlockState.Placeholder, 'Expected a placeholder to be rendered in this defer block.');
        assertLView(triggerLView);
    }
    return triggerLView;
}
/**
 * Gets the element that a deferred block's trigger is pointing to.
 * @param triggerLView LView in which the trigger is defined.
 * @param triggerIndex Index at which the trigger element should've been rendered.
 */
function getTriggerElement(triggerLView, triggerIndex) {
    const element = getNativeByIndex(HEADER_OFFSET + triggerIndex, triggerLView);
    ngDevMode && assertElement(element);
    return element;
}
/**
 * Registers a DOM-node based trigger.
 * @param initialLView LView in which the defer block is rendered.
 * @param tNode TNode representing the defer block.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to go up/down in the view hierarchy to find the trigger.
 * @param registerFn Function that will register the DOM events.
 * @param callback Callback to be invoked when the trigger receives the event that should render
 *     the deferred block.
 */
function registerDomTrigger(initialLView, tNode, triggerIndex, walkUpTimes, registerFn, callback) {
    const injector = initialLView[INJECTOR];
    // Assumption: the `afterRender` reference should be destroyed
    // automatically so we don't need to keep track of it.
    const afterRenderRef = afterRender(() => {
        const lDetails = getLDeferBlockDetails(initialLView, tNode);
        const renderedState = lDetails[DEFER_BLOCK_STATE];
        // If the block was loaded before the trigger was resolved, we don't need to do anything.
        if (renderedState !== DeferBlockInternalState.Initial &&
            renderedState !== DeferBlockState.Placeholder) {
            afterRenderRef.destroy();
            return;
        }
        const triggerLView = getTriggerLView(initialLView, tNode, walkUpTimes);
        // Keep polling until we resolve the trigger's LView.
        // `afterRender` should stop automatically if the view is destroyed.
        if (!triggerLView) {
            return;
        }
        // It's possible that the trigger's view was destroyed before we resolved the trigger element.
        if (triggerLView[FLAGS] & 256 /* LViewFlags.Destroyed */) {
            afterRenderRef.destroy();
            return;
        }
        // TODO: add integration with `DeferBlockCleanupManager`.
        const element = getTriggerElement(triggerLView, triggerIndex);
        const cleanup = registerFn(element, () => {
            callback();
            removeLViewOnDestroy(triggerLView, cleanup);
            if (initialLView !== triggerLView) {
                removeLViewOnDestroy(initialLView, cleanup);
            }
            cleanup();
        }, injector);
        afterRenderRef.destroy();
        storeLViewOnDestroy(triggerLView, cleanup);
        // Since the trigger and deferred block might be in different
        // views, we have to register the callback in both locations.
        if (initialLView !== triggerLView) {
            storeLViewOnDestroy(initialLView, cleanup);
        }
    }, { injector });
}
/**
 * Helper function to schedule a callback to be invoked when a browser becomes idle.
 *
 * @param callback A function to be invoked when a browser becomes idle.
 * @param lView An optional LView that hosts an instance of a defer block. LView is
 *    used to register a cleanup callback in case that LView got destroyed before
 *    callback was invoked. In this case, an `idle` callback is never invoked. This is
 *    helpful for cases when a defer block has scheduled rendering, but an underlying
 *    LView got destroyed prior to th block rendering.
 */
function onIdle(callback, lView) {
    let id;
    const removeIdleCallback = () => _cancelIdleCallback(id);
    id = _requestIdleCallback(() => {
        removeIdleCallback();
        if (lView !== null) {
            // The idle callback is invoked, we no longer need
            // to retain a cleanup callback in an LView.
            removeLViewOnDestroy(lView, removeIdleCallback);
        }
        callback();
    });
    if (lView !== null) {
        // Store a cleanup function on LView, so that we cancel idle
        // callback in case this LView is destroyed before a callback
        // is invoked.
        storeLViewOnDestroy(lView, removeIdleCallback);
    }
    return removeIdleCallback;
}
/**
 * Calculates a data slot index for defer block info (either static or
 * instance-specific), given an index of a defer instruction.
 */
function getDeferBlockDataIndex(deferBlockIndex) {
    // Instance state is located at the *next* position
    // after the defer block slot in an LView or TView.data.
    return deferBlockIndex + 1;
}
/** Retrieves a defer block state from an LView, given a TNode that represents a block. */
function getLDeferBlockDetails(lView, tNode) {
    const tView = lView[TVIEW];
    const slotIndex = getDeferBlockDataIndex(tNode.index);
    ngDevMode && assertIndexInDeclRange(tView, slotIndex);
    return lView[slotIndex];
}
/** Stores a defer block instance state in LView. */
function setLDeferBlockDetails(lView, deferBlockIndex, lDetails) {
    const tView = lView[TVIEW];
    const slotIndex = getDeferBlockDataIndex(deferBlockIndex);
    ngDevMode && assertIndexInDeclRange(tView, slotIndex);
    lView[slotIndex] = lDetails;
}
/** Retrieves static info about a defer block, given a TView and a TNode that represents a block. */
function getTDeferBlockDetails(tView, tNode) {
    const slotIndex = getDeferBlockDataIndex(tNode.index);
    ngDevMode && assertIndexInDeclRange(tView, slotIndex);
    return tView.data[slotIndex];
}
/** Stores a defer block static info in `TView.data`. */
function setTDeferBlockDetails(tView, deferBlockIndex, deferBlockConfig) {
    const slotIndex = getDeferBlockDataIndex(deferBlockIndex);
    ngDevMode && assertIndexInDeclRange(tView, slotIndex);
    tView.data[slotIndex] = deferBlockConfig;
}
function getTemplateIndexForState(newState, hostLView, tNode) {
    const tView = hostLView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    switch (newState) {
        case DeferBlockState.Complete:
            return tDetails.primaryTmplIndex;
        case DeferBlockState.Loading:
            return tDetails.loadingTmplIndex;
        case DeferBlockState.Error:
            return tDetails.errorTmplIndex;
        case DeferBlockState.Placeholder:
            return tDetails.placeholderTmplIndex;
        default:
            ngDevMode && throwError(`Unexpected defer block state: ${newState}`);
            return null;
    }
}
/**
 * Transitions a defer block to the new state. Updates the  necessary
 * data structures and renders corresponding block.
 *
 * @param newState New state that should be applied to the defer block.
 * @param tNode TNode that represents a defer block.
 * @param lContainer Represents an instance of a defer block.
 */
export function renderDeferBlockState(newState, tNode, lContainer) {
    const hostLView = lContainer[PARENT];
    // Check if this view is not destroyed. Since the loading process was async,
    // the view might end up being destroyed by the time rendering happens.
    if (isDestroyed(hostLView))
        return;
    // Make sure this TNode belongs to TView that represents host LView.
    ngDevMode && assertTNodeForLView(tNode, hostLView);
    const lDetails = getLDeferBlockDetails(hostLView, tNode);
    ngDevMode && assertDefined(lDetails, 'Expected a defer block state defined');
    const stateTmplIndex = getTemplateIndexForState(newState, hostLView, tNode);
    // Note: we transition to the next state if the previous state was represented
    // with a number that is less than the next state. For example, if the current
    // state is "loading" (represented as `2`), we should not show a placeholder
    // (represented as `1`).
    if (lDetails[DEFER_BLOCK_STATE] < newState && stateTmplIndex !== null) {
        lDetails[DEFER_BLOCK_STATE] = newState;
        const hostTView = hostLView[TVIEW];
        const adjustedIndex = stateTmplIndex + HEADER_OFFSET;
        const tNode = getTNode(hostTView, adjustedIndex);
        // There is only 1 view that can be present in an LContainer that
        // represents a `{#defer}` block, so always refer to the first one.
        const viewIndex = 0;
        removeLViewFromLContainer(lContainer, viewIndex);
        const dehydratedView = findMatchingDehydratedView(lContainer, tNode.tView.ssrId);
        const embeddedLView = createAndRenderEmbeddedLView(hostLView, tNode, null, { dehydratedView });
        addLViewToLContainer(lContainer, embeddedLView, viewIndex, shouldAddViewToDom(tNode, dehydratedView));
    }
}
/**
 * Trigger prefetching of dependencies for a defer block.
 *
 * @param tDetails Static information about this defer block.
 * @param lView LView of a host view.
 */
export function triggerPrefetching(tDetails, lView) {
    if (lView[INJECTOR] && shouldTriggerDeferBlock(lView[INJECTOR])) {
        triggerResourceLoading(tDetails, lView);
    }
}
/**
 * Trigger loading of defer block dependencies if the process hasn't started yet.
 *
 * @param tDetails Static information about this defer block.
 * @param lView LView of a host view.
 */
export function triggerResourceLoading(tDetails, lView) {
    const injector = lView[INJECTOR];
    const tView = lView[TVIEW];
    if (tDetails.loadingState !== DeferDependenciesLoadingState.NOT_STARTED) {
        // If the loading status is different from initial one, it means that
        // the loading of dependencies is in progress and there is nothing to do
        // in this function. All details can be obtained from the `tDetails` object.
        return;
    }
    const primaryBlockTNode = getPrimaryBlockTNode(tView, tDetails);
    // Switch from NOT_STARTED -> IN_PROGRESS state.
    tDetails.loadingState = DeferDependenciesLoadingState.IN_PROGRESS;
    // Check if dependency function interceptor is configured.
    const deferDependencyInterceptor = injector.get(DEFER_BLOCK_DEPENDENCY_INTERCEPTOR, null, { optional: true });
    const dependenciesFn = deferDependencyInterceptor ?
        deferDependencyInterceptor.intercept(tDetails.dependencyResolverFn) :
        tDetails.dependencyResolverFn;
    // The `dependenciesFn` might be `null` when all dependencies within
    // a given `{#defer}` block were eagerly references elsewhere in a file,
    // thus no dynamic `import()`s were produced.
    if (!dependenciesFn) {
        tDetails.loadingPromise = Promise.resolve().then(() => {
            tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;
        });
        return;
    }
    // Defer block may have multiple prefetch triggers. Once the loading
    // starts, invoke all clean functions, since they are no longer needed.
    invokeTDetailsCleanup(injector, tDetails);
    // Start downloading of defer block dependencies.
    tDetails.loadingPromise = Promise.allSettled(dependenciesFn()).then(results => {
        let failed = false;
        const directiveDefs = [];
        const pipeDefs = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const dependency = result.value;
                const directiveDef = getComponentDef(dependency) || getDirectiveDef(dependency);
                if (directiveDef) {
                    directiveDefs.push(directiveDef);
                }
                else {
                    const pipeDef = getPipeDef(dependency);
                    if (pipeDef) {
                        pipeDefs.push(pipeDef);
                    }
                }
            }
            else {
                failed = true;
                break;
            }
        }
        // Loading is completed, we no longer need this Promise.
        tDetails.loadingPromise = null;
        if (failed) {
            tDetails.loadingState = DeferDependenciesLoadingState.FAILED;
        }
        else {
            tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;
            // Update directive and pipe registries to add newly downloaded dependencies.
            const primaryBlockTView = primaryBlockTNode.tView;
            if (directiveDefs.length > 0) {
                primaryBlockTView.directiveRegistry = primaryBlockTView.directiveRegistry ?
                    [...primaryBlockTView.directiveRegistry, ...directiveDefs] :
                    directiveDefs;
            }
            if (pipeDefs.length > 0) {
                primaryBlockTView.pipeRegistry = primaryBlockTView.pipeRegistry ?
                    [...primaryBlockTView.pipeRegistry, ...pipeDefs] :
                    pipeDefs;
            }
        }
    });
}
/** Utility function to render `{:placeholder}` content (if present) */
function renderPlaceholder(lView, tNode) {
    const tView = lView[TVIEW];
    const lContainer = lView[tNode.index];
    ngDevMode && assertLContainer(lContainer);
    const tDetails = getTDeferBlockDetails(tView, tNode);
    renderDeferBlockState(DeferBlockState.Placeholder, tNode, lContainer);
}
/**
 * Subscribes to the "loading" Promise and renders corresponding defer sub-block,
 * based on the loading results.
 *
 * @param lContainer Represents an instance of a defer block.
 * @param tNode Represents defer block info shared across all instances.
 */
function renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer) {
    ngDevMode &&
        assertDefined(tDetails.loadingPromise, 'Expected loading Promise to exist on this defer block');
    tDetails.loadingPromise.then(() => {
        if (tDetails.loadingState === DeferDependenciesLoadingState.COMPLETE) {
            ngDevMode && assertDeferredDependenciesLoaded(tDetails);
            // Everything is loaded, show the primary block content
            renderDeferBlockState(DeferBlockState.Complete, tNode, lContainer);
        }
        else if (tDetails.loadingState === DeferDependenciesLoadingState.FAILED) {
            renderDeferBlockState(DeferBlockState.Error, tNode, lContainer);
        }
    });
}
/** Retrieves a TNode that represents main content of a defer block. */
function getPrimaryBlockTNode(tView, tDetails) {
    const adjustedIndex = tDetails.primaryTmplIndex + HEADER_OFFSET;
    return getTNode(tView, adjustedIndex);
}
/**
 * Attempts to trigger loading of defer block dependencies.
 * If the block is already in a loading, completed or an error state -
 * no additional actions are taken.
 */
function triggerDeferBlock(lView, tNode) {
    const tView = lView[TVIEW];
    const lContainer = lView[tNode.index];
    const injector = lView[INJECTOR];
    ngDevMode && assertLContainer(lContainer);
    if (!shouldTriggerDeferBlock(injector))
        return;
    const tDetails = getTDeferBlockDetails(tView, tNode);
    // Condition is triggered, try to render loading state and start downloading.
    // Note: if a block is in a loading, completed or an error state, this call would be a noop.
    renderDeferBlockState(DeferBlockState.Loading, tNode, lContainer);
    switch (tDetails.loadingState) {
        case DeferDependenciesLoadingState.NOT_STARTED:
            triggerResourceLoading(tDetails, lView);
            // The `loadingState` might have changed to "loading".
            if (tDetails.loadingState ===
                DeferDependenciesLoadingState.IN_PROGRESS) {
                renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
            }
            break;
        case DeferDependenciesLoadingState.IN_PROGRESS:
            renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
            break;
        case DeferDependenciesLoadingState.COMPLETE:
            ngDevMode && assertDeferredDependenciesLoaded(tDetails);
            renderDeferBlockState(DeferBlockState.Complete, tNode, lContainer);
            break;
        case DeferDependenciesLoadingState.FAILED:
            renderDeferBlockState(DeferBlockState.Error, tNode, lContainer);
            break;
        default:
            if (ngDevMode) {
                throwError('Unknown defer block state');
            }
    }
}
/**
 * Asserts whether all dependencies for a defer block are loaded.
 * Always run this function (in dev mode) before rendering a defer
 * block in completed state.
 */
function assertDeferredDependenciesLoaded(tDetails) {
    assertEqual(tDetails.loadingState, DeferDependenciesLoadingState.COMPLETE, 'Expecting all deferred dependencies to be loaded.');
}
/**
 * **INTERNAL**, avoid referencing it in application code.
 *
 * Injector token that allows to provide `DeferBlockDependencyInterceptor` class
 * implementation.
 */
export const DEFER_BLOCK_DEPENDENCY_INTERCEPTOR = new InjectionToken(ngDevMode ? 'DEFER_BLOCK_DEPENDENCY_INTERCEPTOR' : '');
/**
 * Determines if a given value matches the expected structure of a defer block
 *
 * We can safely rely on the primaryTmplIndex because every defer block requires
 * that a primary template exists. All the other template options are optional.
 */
function isTDeferBlockDetails(value) {
    return (typeof value === 'object') &&
        (typeof value.primaryTmplIndex === 'number');
}
/**
 * Internal token used for configuring defer block behavior.
 */
export const DEFER_BLOCK_CONFIG = new InjectionToken(ngDevMode ? 'DEFER_BLOCK_CONFIG' : '');
/**
 * Retrieves all defer blocks in a given LView.
 *
 * @param lView lView with defer blocks
 * @param deferBlocks defer block aggregator array
 */
export function getDeferBlocks(lView, deferBlocks) {
    const tView = lView[TVIEW];
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        if (isLContainer(lView[i])) {
            const lContainer = lView[i];
            // An LContainer may represent an instance of a defer block, in which case
            // we store it as a result. Otherwise, keep iterating over LContainer views and
            // look for defer blocks.
            const isLast = i === tView.bindingStartIndex - 1;
            if (!isLast) {
                const tNode = tView.data[i];
                const tDetails = getTDeferBlockDetails(tView, tNode);
                if (isTDeferBlockDetails(tDetails)) {
                    deferBlocks.push({ lContainer, lView, tNode, tDetails });
                    // This LContainer represents a defer block, so we exit
                    // this iteration and don't inspect views in this LContainer.
                    continue;
                }
            }
            for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
                getDeferBlocks(lContainer[i], deferBlocks);
            }
        }
        else if (isLView(lView[i])) {
            // This is a component, enter the `getDeferBlocks` recursively.
            getDeferBlocks(lView[i], deferBlocks);
        }
    }
}
/**
 * Registers a cleanup function associated with a prefetching trigger
 * of a given defer block.
 */
function registerTDetailsCleanup(injector, tDetails, key, cleanupFn) {
    injector.get(DeferBlockCleanupManager).add(tDetails, key, cleanupFn);
}
/**
 * Invokes all registered prefetch cleanup triggers
 * and removes all cleanup functions afterwards.
 */
function invokeTDetailsCleanup(injector, tDetails) {
    injector.get(DeferBlockCleanupManager).cleanup(tDetails);
}
/**
 * Internal service to keep track of cleanup functions associated
 * with defer blocks. This class is used to manage cleanup functions
 * created for prefetching triggers.
 */
class DeferBlockCleanupManager {
    constructor() {
        this.blocks = new Map();
    }
    add(tDetails, key, callback) {
        if (!this.blocks.has(tDetails)) {
            this.blocks.set(tDetails, new Map());
        }
        const block = this.blocks.get(tDetails);
        if (!block.has(key)) {
            block.set(key, []);
        }
        const callbacks = block.get(key);
        callbacks.push(callback);
    }
    has(tDetails, key) {
        return !!this.blocks.get(tDetails)?.has(key);
    }
    cleanup(tDetails) {
        const block = this.blocks.get(tDetails);
        if (block) {
            for (const callbacks of Object.values(block)) {
                for (const callback of callbacks) {
                    callback();
                }
            }
            this.blocks.delete(tDetails);
        }
    }
    ngOnDestroy() {
        for (const [block] of this.blocks) {
            this.cleanup(block);
        }
        this.blocks.clear();
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: DeferBlockCleanupManager,
        providedIn: 'root',
        factory: () => new DeferBlockCleanupManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFZLGtCQUFrQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN4RixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQW9CLHVCQUF1QixFQUFFLGVBQWUsRUFBc0IsNkJBQTZCLEVBQTJILE1BQU0scUJBQXFCLENBQUM7QUFHblQsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0UsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFxQixNQUFNLEVBQUUsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDM0cs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QkFDaEMsUUFBUSxFQUFFLENBQUM7aUJBQ1o7YUFDRjtZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzlCO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxLQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckI7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSx3QkFBd0I7UUFDL0IsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksd0JBQXdCLEVBQUU7S0FDOUMsQ0FBQyxBQUpVLENBSVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi8uLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyfSBmcm9tICcuLi8uLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RWxlbWVudCwgYXNzZXJ0RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YWZ0ZXJSZW5kZXJ9IGZyb20gJy4uL2FmdGVyX3JlbmRlcl9ob29rcyc7XG5pbXBvcnQge2Fzc2VydEluZGV4SW5EZWNsUmFuZ2UsIGFzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRUTm9kZUZvckxWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrQmVoYXZpb3IsIERlZmVyQmxvY2tDb25maWcsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGUsIERlZmVyQmxvY2tUcmlnZ2VycywgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUsIERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnLCBEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWcsIERlcGVuZGVuY3lSZXNvbHZlckZuLCBMRGVmZXJCbG9ja0RldGFpbHMsIFREZWZlckJsb2NrRGV0YWlsc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZlcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGVzdHJveWVkLCBpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRUTm9kZSwgZ2V0VFZpZXcsIG5leHRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldENvbnN0YW50LCBnZXROYXRpdmVCeUluZGV4LCBnZXRUTm9kZSwgcmVtb3ZlTFZpZXdPbkRlc3Ryb3ksIHN0b3JlTFZpZXdPbkRlc3Ryb3ksIHdhbGtVcFZpZXdzfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldywgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi92aWV3X21hbmlwdWxhdGlvbic7XG5cbmltcG9ydCB7b25JbnRlcmFjdGlvbn0gZnJvbSAnLi9kZWZlcl9ldmVudHMnO1xuaW1wb3J0IHvJtcm1dGVtcGxhdGV9IGZyb20gJy4vdGVtcGxhdGUnO1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBkZWZlciBibG9ja3Mgc2hvdWxkIGJlIHRyaWdnZXJlZC5cbiAqXG4gKiBDdXJyZW50bHksIGRlZmVyIGJsb2NrcyBhcmUgbm90IHRyaWdnZXJlZCBvbiB0aGUgc2VydmVyLFxuICogb25seSBwbGFjZWhvbGRlciBjb250ZW50IGlzIHJlbmRlcmVkIChpZiBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yOiBJbmplY3Rvcik6IGJvb2xlYW4ge1xuICBjb25zdCBjb25maWcgPSBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfQ09ORklHLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgaWYgKGNvbmZpZz8uYmVoYXZpb3IgPT09IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKTtcbn1cblxuLyoqXG4gKiBTaGltcyBmb3IgdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBhbmQgYGNhbmNlbElkbGVDYWxsYmFja2AgZnVuY3Rpb25zIGZvciBlbnZpcm9ubWVudHNcbiAqIHdoZXJlIHRob3NlIGZ1bmN0aW9ucyBhcmUgbm90IGF2YWlsYWJsZSAoZS5nLiBOb2RlLmpzKS5cbiAqL1xuY29uc3QgX3JlcXVlc3RJZGxlQ2FsbGJhY2sgPVxuICAgIHR5cGVvZiByZXF1ZXN0SWRsZUNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyA/IHJlcXVlc3RJZGxlQ2FsbGJhY2sgOiBzZXRUaW1lb3V0O1xuY29uc3QgX2NhbmNlbElkbGVDYWxsYmFjayA9XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gY2FuY2VsSWRsZUNhbGxiYWNrIDogY2xlYXJUaW1lb3V0O1xuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIGB7I2RlZmVyfWAgYmxvY2tzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgYGRlZmVyYCBpbnN0cnVjdGlvbi5cbiAqIEBwYXJhbSBwcmltYXJ5VG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZGVwZW5kZW5jeVJlc29sdmVyRm4gRnVuY3Rpb24gdGhhdCBjb250YWlucyBkZXBlbmRlbmNpZXMgZm9yIHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbG9hZGluZ1RtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgYHs6bG9hZGluZ31gIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGB7OnBsYWNlaG9sZGVyfWAgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBlcnJvclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgYHs6ZXJyb3J9YCBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGxvYWRpbmdDb25maWdJbmRleCBJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZSBgezpsb2FkaW5nfWAuXG4gKiAgICAgYmxvY2suXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJDb25maWdJbmRleEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgYHs6cGxhY2Vob2xkZXJ9YCBibG9jay5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyKFxuICAgIGluZGV4OiBudW1iZXIsIHByaW1hcnlUbXBsSW5kZXg6IG51bWJlciwgZGVwZW5kZW5jeVJlc29sdmVyRm4/OiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsLFxuICAgIGxvYWRpbmdUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCwgcGxhY2Vob2xkZXJUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCxcbiAgICBlcnJvclRtcGxJbmRleD86IG51bWJlcnxudWxsLCBsb2FkaW5nQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCxcbiAgICBwbGFjZWhvbGRlckNvbmZpZ0luZGV4PzogbnVtYmVyfG51bGwpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHRWaWV3Q29uc3RzID0gdFZpZXcuY29uc3RzO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gIMm1ybV0ZW1wbGF0ZShpbmRleCwgbnVsbCwgMCwgMCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tDb25maWc6IFREZWZlckJsb2NrRGV0YWlscyA9IHtcbiAgICAgIHByaW1hcnlUbXBsSW5kZXgsXG4gICAgICBsb2FkaW5nVG1wbEluZGV4OiBsb2FkaW5nVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlclRtcGxJbmRleDogcGxhY2Vob2xkZXJUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIGVycm9yVG1wbEluZGV4OiBlcnJvclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJCbG9ja0NvbmZpZzogcGxhY2Vob2xkZXJDb25maWdJbmRleCAhPSBudWxsID9cbiAgICAgICAgICBnZXRDb25zdGFudDxEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBwbGFjZWhvbGRlckNvbmZpZ0luZGV4KSA6XG4gICAgICAgICAgbnVsbCxcbiAgICAgIGxvYWRpbmdCbG9ja0NvbmZpZzogbG9hZGluZ0NvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnPih0Vmlld0NvbnN0cywgbG9hZGluZ0NvbmZpZ0luZGV4KSA6XG4gICAgICAgICAgbnVsbCxcbiAgICAgIGRlcGVuZGVuY3lSZXNvbHZlckZuOiBkZXBlbmRlbmN5UmVzb2x2ZXJGbiA/PyBudWxsLFxuICAgICAgbG9hZGluZ1N0YXRlOiBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCxcbiAgICAgIGxvYWRpbmdQcm9taXNlOiBudWxsLFxuICAgIH07XG5cbiAgICBzZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIGFkanVzdGVkSW5kZXgsIGRlZmVyQmxvY2tDb25maWcpO1xuICB9XG5cbiAgLy8gTG9va3VwIGRlaHlkcmF0ZWQgdmlld3MgdGhhdCBiZWxvbmcgdG8gdGhpcyBMQ29udGFpbmVyLlxuICAvLyBJbiBjbGllbnQtb25seSBtb2RlLCB0aGlzIG9wZXJhdGlvbiBpcyBub29wLlxuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF07XG4gIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXIobENvbnRhaW5lcik7XG5cbiAgLy8gSW5pdCBpbnN0YW5jZS1zcGVjaWZpYyBkZWZlciBkZXRhaWxzIGFuZCBzdG9yZSBpdC5cbiAgY29uc3QgbERldGFpbHMgPSBbXTtcbiAgbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdID0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbDtcbiAgc2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCBhZGp1c3RlZEluZGV4LCBsRGV0YWlscyBhcyBMRGVmZXJCbG9ja0RldGFpbHMpO1xufVxuXG4vKipcbiAqIExvYWRzIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyB3aGVuIGEgdHJpZ2dlciB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgdmFsdWUgPSBCb29sZWFuKHJhd1ZhbHVlKTsgIC8vIGhhbmRsZSB0cnV0aHkgb3IgZmFsc3kgdmFsdWVzXG4gICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UgJiYgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCkge1xuICAgICAgLy8gSWYgbm90aGluZyBpcyByZW5kZXJlZCB5ZXQsIHJlbmRlciBhIHBsYWNlaG9sZGVyIChpZiBkZWZpbmVkKS5cbiAgICAgIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgdmFsdWUgPT09IHRydWUgJiZcbiAgICAgICAgKHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwgfHxcbiAgICAgICAgIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikpIHtcbiAgICAgIC8vIFRoZSBgd2hlbmAgY29uZGl0aW9uIGhhcyBjaGFuZ2VkIHRvIGB0cnVlYCwgdHJpZ2dlciBkZWZlciBibG9jayBsb2FkaW5nXG4gICAgICAvLyBpZiB0aGUgYmxvY2sgaXMgZWl0aGVyIGluIGluaXRpYWwgKG5vdGhpbmcgaXMgcmVuZGVyZWQpIG9yIGEgcGxhY2Vob2xkZXJcbiAgICAgIC8vIHN0YXRlLlxuICAgICAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVmZXRjaGVzIHRoZSBkZWZlcnJlZCBjb250ZW50IHdoZW4gYSB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaFdoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG5cbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgaWYgKHZhbHVlID09PSB0cnVlICYmIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAgIC8vIElmIGxvYWRpbmcgaGFzIG5vdCBiZWVuIHN0YXJ0ZWQgeWV0LCB0cmlnZ2VyIGl0IG5vdy5cbiAgICAgIHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgaGFuZGxlcnMgdGhhdCByZXByZXNlbnQgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gTm90ZTogd2UgcGFzcyBhbiBgbFZpZXdgIGFzIGEgc2Vjb25kIGFyZ3VtZW50IHRvIGNhbmNlbCBhbiBgaWRsZWBcbiAgLy8gY2FsbGJhY2sgaW4gY2FzZSBhbiBMVmlldyBnb3QgZGVzdHJveWVkIGJlZm9yZSBhbiBgaWRsZWAgY2FsbGJhY2tcbiAgLy8gaXMgaW52b2tlZC5cbiAgb25JZGxlKCgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbklkbGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gUHJldmVudCBzY2hlZHVsaW5nIG1vcmUgdGhhbiBvbmUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGNhbGxcbiAgICAvLyBmb3IgZWFjaCBkZWZlciBibG9jay4gRm9yIHRoaXMgcmVhc29uIHdlIHVzZSBvbmx5IGEgdHJpZ2dlclxuICAgIC8vIGlkZW50aWZpZXIgaW4gYSBrZXksIHNvIGFsbCBpbnN0YW5jZXMgd291bGQgdXNlIHRoZSBzYW1lIGtleS5cbiAgICBjb25zdCBrZXkgPSBTdHJpbmcoRGVmZXJCbG9ja1RyaWdnZXJzLk9uSWRsZSk7XG4gICAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICAgIGNvbnN0IG1hbmFnZXIgPSBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKTtcbiAgICBpZiAoIW1hbmFnZXIuaGFzKHREZXRhaWxzLCBrZXkpKSB7XG4gICAgICAvLyBJbiBjYXNlIG9mIHByZWZldGNoaW5nLCB3ZSBpbnRlbnRpb25hbGx5IGF2b2lkIGNhbmNlbGxpbmcgcmVzb3VyY2UgbG9hZGluZyBpZlxuICAgICAgLy8gYW4gdW5kZXJseWluZyBMVmlldyBnZXQgZGVzdHJveWVkICh0aHVzIHBhc3NpbmcgYG51bGxgIGFzIGEgc2Vjb25kIGFyZ3VtZW50KSxcbiAgICAgIC8vIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgTFZpZXdzICh0aGF0IHJlcHJlc2VudCBlbWJlZGRlZCB2aWV3cykgdGhhdFxuICAgICAgLy8gZGVwZW5kIG9uIHJlc291cmNlIGxvYWRpbmcuXG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSBvbklkbGUoKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldyksIG51bGwgLyogTFZpZXcgKi8pO1xuICAgICAgcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoaW5qZWN0b3IsIHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JbW1lZGlhdGUoKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW1tZWRpYXRlKCkge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgbG9hZGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPblRpbWVyKGRlbGF5OiBudW1iZXIpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIHByZWZldGNoaW5nIHRoZSBjb250ZW50LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25UaW1lcihkZWxheTogbnVtYmVyKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkhvdmVyKCkge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKCkge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW50ZXJhY3Rpb24odHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLFxuICAgICAgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHZpZXdwb3J0YCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRhcmdldCBPcHRpb25hbCBlbGVtZW50IG9uIHdoaWNoIHRvIGxpc3RlbiBmb3IgaG92ZXIgZXZlbnRzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVmlld3BvcnQodGFyZ2V0PzogdW5rbm93bikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdGFyZ2V0IE9wdGlvbmFsIGVsZW1lbnQgb24gd2hpY2ggdG8gbGlzdGVuIGZvciBob3ZlciBldmVudHMuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblZpZXdwb3J0KHRhcmdldD86IHVua25vd24pIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqKioqKioqKiogSGVscGVyIGZ1bmN0aW9ucyAqKioqKioqKioqL1xuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgdGhlIExWaWV3IGluIHdoaWNoIGEgZGVmZXJyZWQgYmxvY2sncyB0cmlnZ2VyIGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIGRlZmVycmVkSG9zdExWaWV3IExWaWV3IGluIHdoaWNoIHRoZSBkZWZlcnJlZCBibG9jayBpcyBkZWZpbmVkLlxuICogQHBhcmFtIGRlZmVycmVkVE5vZGUgVE5vZGUgZGVmaW5pbmcgdGhlIGRlZmVycmVkIGJsb2NrLlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cCBpbiB0aGUgdmlldyBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlcidzIHZpZXcuXG4gKiAgIEEgbmVnYXRpdmUgdmFsdWUgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbnNpZGUgdGhlIGJsb2NrJ3MgcGxhY2Vob2xkZXIsIHdoaWxlIGFuIHVuZGVmaW5lZFxuICogICB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluIHRoZSBzYW1lIExWaWV3IGFzIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqL1xuZnVuY3Rpb24gZ2V0VHJpZ2dlckxWaWV3KFxuICAgIGRlZmVycmVkSG9zdExWaWV3OiBMVmlldywgZGVmZXJyZWRUTm9kZTogVE5vZGUsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkKTogTFZpZXd8bnVsbCB7XG4gIC8vIFRoZSB0cmlnZ2VyIGlzIGluIHRoZSBzYW1lIHZpZXcsIHdlIGRvbid0IG5lZWQgdG8gdHJhdmVyc2UuXG4gIGlmICh3YWxrVXBUaW1lcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZmVycmVkSG9zdExWaWV3O1xuICB9XG5cbiAgLy8gQSBwb3NpdGl2ZSB2YWx1ZSBvciB6ZXJvIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gYSBwYXJlbnQgdmlldy5cbiAgaWYgKHdhbGtVcFRpbWVzID49IDApIHtcbiAgICByZXR1cm4gd2Fsa1VwVmlld3Mod2Fsa1VwVGltZXMsIGRlZmVycmVkSG9zdExWaWV3KTtcbiAgfVxuXG4gIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWdhdGl2ZSwgaXQgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbnNpZGUgdGhlIHBsYWNlaG9sZGVyLlxuICBjb25zdCBkZWZlcnJlZENvbnRhaW5lciA9IGRlZmVycmVkSG9zdExWaWV3W2RlZmVycmVkVE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWZlcnJlZENvbnRhaW5lcik7XG4gIGNvbnN0IHRyaWdnZXJMVmlldyA9IGRlZmVycmVkQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXSA/PyBudWxsO1xuXG4gIC8vIFdlIG5lZWQgdG8gbnVsbCBjaGVjaywgYmVjYXVzZSB0aGUgcGxhY2Vob2xkZXIgbWlnaHQgbm90IGhhdmUgYmVlbiByZW5kZXJlZCB5ZXQuXG4gIGlmIChuZ0Rldk1vZGUgJiYgdHJpZ2dlckxWaWV3ICE9PSBudWxsKSB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoZGVmZXJyZWRIb3N0TFZpZXcsIGRlZmVycmVkVE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgIHJlbmRlcmVkU3RhdGUsIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcixcbiAgICAgICAgJ0V4cGVjdGVkIGEgcGxhY2Vob2xkZXIgdG8gYmUgcmVuZGVyZWQgaW4gdGhpcyBkZWZlciBibG9jay4nKTtcbiAgICBhc3NlcnRMVmlldyh0cmlnZ2VyTFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHRyaWdnZXJMVmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBlbGVtZW50IHRoYXQgYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcG9pbnRpbmcgdG8uXG4gKiBAcGFyYW0gdHJpZ2dlckxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSB0cmlnZ2VyIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSB0cmlnZ2VyIGVsZW1lbnQgc2hvdWxkJ3ZlIGJlZW4gcmVuZGVyZWQuXG4gKi9cbmZ1bmN0aW9uIGdldFRyaWdnZXJFbGVtZW50KHRyaWdnZXJMVmlldzogTFZpZXcsIHRyaWdnZXJJbmRleDogbnVtYmVyKTogRWxlbWVudCB7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KEhFQURFUl9PRkZTRVQgKyB0cmlnZ2VySW5kZXgsIHRyaWdnZXJMVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFbGVtZW50KGVsZW1lbnQpO1xuICByZXR1cm4gZWxlbWVudCBhcyBFbGVtZW50O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIERPTS1ub2RlIGJhc2VkIHRyaWdnZXIuXG4gKiBAcGFyYW0gaW5pdGlhbExWaWV3IExWaWV3IGluIHdoaWNoIHRoZSBkZWZlciBibG9jayBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSByZXByZXNlbnRpbmcgdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwL2Rvd24gaW4gdGhlIHZpZXcgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gcmVnaXN0ZXJGbiBGdW5jdGlvbiB0aGF0IHdpbGwgcmVnaXN0ZXIgdGhlIERPTSBldmVudHMuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIHJlY2VpdmVzIHRoZSBldmVudCB0aGF0IHNob3VsZCByZW5kZXJcbiAqICAgICB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICBpbml0aWFsTFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lczogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICByZWdpc3RlckZuOiAoZWxlbWVudDogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKSA9PiBWb2lkRnVuY3Rpb24sXG4gICAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICBjb25zdCBpbmplY3RvciA9IGluaXRpYWxMVmlld1tJTkpFQ1RPUl0hO1xuXG4gIC8vIEFzc3VtcHRpb246IHRoZSBgYWZ0ZXJSZW5kZXJgIHJlZmVyZW5jZSBzaG91bGQgYmUgZGVzdHJveWVkXG4gIC8vIGF1dG9tYXRpY2FsbHkgc28gd2UgZG9uJ3QgbmVlZCB0byBrZWVwIHRyYWNrIG9mIGl0LlxuICBjb25zdCBhZnRlclJlbmRlclJlZiA9IGFmdGVyUmVuZGVyKCgpID0+IHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhpbml0aWFsTFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuXG4gICAgLy8gSWYgdGhlIGJsb2NrIHdhcyBsb2FkZWQgYmVmb3JlIHRoZSB0cmlnZ2VyIHdhcyByZXNvbHZlZCwgd2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZy5cbiAgICBpZiAocmVuZGVyZWRTdGF0ZSAhPT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCAmJlxuICAgICAgICByZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpIHtcbiAgICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBnZXRUcmlnZ2VyTFZpZXcoaW5pdGlhbExWaWV3LCB0Tm9kZSwgd2Fsa1VwVGltZXMpO1xuXG4gICAgLy8gS2VlcCBwb2xsaW5nIHVudGlsIHdlIHJlc29sdmUgdGhlIHRyaWdnZXIncyBMVmlldy5cbiAgICAvLyBgYWZ0ZXJSZW5kZXJgIHNob3VsZCBzdG9wIGF1dG9tYXRpY2FsbHkgaWYgdGhlIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgIGlmICghdHJpZ2dlckxWaWV3KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSB0cmlnZ2VyJ3MgdmlldyB3YXMgZGVzdHJveWVkIGJlZm9yZSB3ZSByZXNvbHZlZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICAgIGlmICh0cmlnZ2VyTFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpIHtcbiAgICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBhZGQgaW50ZWdyYXRpb24gd2l0aCBgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyYC5cbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0VHJpZ2dlckVsZW1lbnQodHJpZ2dlckxWaWV3LCB0cmlnZ2VySW5kZXgpO1xuICAgIGNvbnN0IGNsZWFudXAgPSByZWdpc3RlckZuKGVsZW1lbnQsICgpID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgICByZW1vdmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuICAgICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGluaXRpYWxMVmlldywgY2xlYW51cCk7XG4gICAgICB9XG4gICAgICBjbGVhbnVwKCk7XG4gICAgfSwgaW5qZWN0b3IpO1xuXG4gICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcblxuICAgIC8vIFNpbmNlIHRoZSB0cmlnZ2VyIGFuZCBkZWZlcnJlZCBibG9jayBtaWdodCBiZSBpbiBkaWZmZXJlbnRcbiAgICAvLyB2aWV3cywgd2UgaGF2ZSB0byByZWdpc3RlciB0aGUgY2FsbGJhY2sgaW4gYm90aCBsb2NhdGlvbnMuXG4gICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICBzdG9yZUxWaWV3T25EZXN0cm95KGluaXRpYWxMVmlldywgY2xlYW51cCk7XG4gICAgfVxuICB9LCB7aW5qZWN0b3J9KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gc2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gYSBicm93c2VyIGJlY29tZXMgaWRsZS5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHdoZW4gYSBicm93c2VyIGJlY29tZXMgaWRsZS5cbiAqIEBwYXJhbSBsVmlldyBBbiBvcHRpb25hbCBMVmlldyB0aGF0IGhvc3RzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suIExWaWV3IGlzXG4gKiAgICB1c2VkIHRvIHJlZ2lzdGVyIGEgY2xlYW51cCBjYWxsYmFjayBpbiBjYXNlIHRoYXQgTFZpZXcgZ290IGRlc3Ryb3llZCBiZWZvcmVcbiAqICAgIGNhbGxiYWNrIHdhcyBpbnZva2VkLiBJbiB0aGlzIGNhc2UsIGFuIGBpZGxlYCBjYWxsYmFjayBpcyBuZXZlciBpbnZva2VkLiBUaGlzIGlzXG4gKiAgICBoZWxwZnVsIGZvciBjYXNlcyB3aGVuIGEgZGVmZXIgYmxvY2sgaGFzIHNjaGVkdWxlZCByZW5kZXJpbmcsIGJ1dCBhbiB1bmRlcmx5aW5nXG4gKiAgICBMVmlldyBnb3QgZGVzdHJveWVkIHByaW9yIHRvIHRoIGJsb2NrIHJlbmRlcmluZy5cbiAqL1xuZnVuY3Rpb24gb25JZGxlKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlld3xudWxsKTogVm9pZEZ1bmN0aW9uIHtcbiAgbGV0IGlkOiBudW1iZXI7XG4gIGNvbnN0IHJlbW92ZUlkbGVDYWxsYmFjayA9ICgpID0+IF9jYW5jZWxJZGxlQ2FsbGJhY2soaWQpO1xuICBpZCA9IF9yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgIHJlbW92ZUlkbGVDYWxsYmFjaygpO1xuICAgICAgICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgICAgIC8vIFRoZSBpZGxlIGNhbGxiYWNrIGlzIGludm9rZWQsIHdlIG5vIGxvbmdlciBuZWVkXG4gICAgICAgICAgIC8vIHRvIHJldGFpbiBhIGNsZWFudXAgY2FsbGJhY2sgaW4gYW4gTFZpZXcuXG4gICAgICAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGxWaWV3LCByZW1vdmVJZGxlQ2FsbGJhY2spO1xuICAgICAgICAgfVxuICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICB9KSBhcyBudW1iZXI7XG5cbiAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgLy8gU3RvcmUgYSBjbGVhbnVwIGZ1bmN0aW9uIG9uIExWaWV3LCBzbyB0aGF0IHdlIGNhbmNlbCBpZGxlXG4gICAgLy8gY2FsbGJhY2sgaW4gY2FzZSB0aGlzIExWaWV3IGlzIGRlc3Ryb3llZCBiZWZvcmUgYSBjYWxsYmFja1xuICAgIC8vIGlzIGludm9rZWQuXG4gICAgc3RvcmVMVmlld09uRGVzdHJveShsVmlldywgcmVtb3ZlSWRsZUNhbGxiYWNrKTtcbiAgfVxuICByZXR1cm4gcmVtb3ZlSWRsZUNhbGxiYWNrO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgYSBkYXRhIHNsb3QgaW5kZXggZm9yIGRlZmVyIGJsb2NrIGluZm8gKGVpdGhlciBzdGF0aWMgb3JcbiAqIGluc3RhbmNlLXNwZWNpZmljKSwgZ2l2ZW4gYW4gaW5kZXggb2YgYSBkZWZlciBpbnN0cnVjdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXg6IG51bWJlcikge1xuICAvLyBJbnN0YW5jZSBzdGF0ZSBpcyBsb2NhdGVkIGF0IHRoZSAqbmV4dCogcG9zaXRpb25cbiAgLy8gYWZ0ZXIgdGhlIGRlZmVyIGJsb2NrIHNsb3QgaW4gYW4gTFZpZXcgb3IgVFZpZXcuZGF0YS5cbiAgcmV0dXJuIGRlZmVyQmxvY2tJbmRleCArIDE7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBkZWZlciBibG9jayBzdGF0ZSBmcm9tIGFuIExWaWV3LCBnaXZlbiBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogTERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgodE5vZGUuaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W3Nsb3RJbmRleF07XG59XG5cbi8qKiBTdG9yZXMgYSBkZWZlciBibG9jayBpbnN0YW5jZSBzdGF0ZSBpbiBMVmlldy4gKi9cbmZ1bmN0aW9uIHNldExEZWZlckJsb2NrRGV0YWlscyhcbiAgICBsVmlldzogTFZpZXcsIGRlZmVyQmxvY2tJbmRleDogbnVtYmVyLCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICBsVmlld1tzbG90SW5kZXhdID0gbERldGFpbHM7XG59XG5cbi8qKiBSZXRyaWV2ZXMgc3RhdGljIGluZm8gYWJvdXQgYSBkZWZlciBibG9jaywgZ2l2ZW4gYSBUVmlldyBhbmQgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBibG9jay4gKi9cbmZ1bmN0aW9uIGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IFREZWZlckJsb2NrRGV0YWlscyB7XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgodE5vZGUuaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgcmV0dXJuIHRWaWV3LmRhdGFbc2xvdEluZGV4XSBhcyBURGVmZXJCbG9ja0RldGFpbHM7XG59XG5cbi8qKiBTdG9yZXMgYSBkZWZlciBibG9jayBzdGF0aWMgaW5mbyBpbiBgVFZpZXcuZGF0YWAuICovXG5mdW5jdGlvbiBzZXRURGVmZXJCbG9ja0RldGFpbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBkZWZlckJsb2NrSW5kZXg6IG51bWJlciwgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHRWaWV3LmRhdGFbc2xvdEluZGV4XSA9IGRlZmVyQmxvY2tDb25maWc7XG59XG5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlSW5kZXhGb3JTdGF0ZShcbiAgICBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlLCBob3N0TFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IHRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBzd2l0Y2ggKG5ld1N0YXRlKSB7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuQ29tcGxldGU6XG4gICAgICByZXR1cm4gdERldGFpbHMucHJpbWFyeVRtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuRXJyb3I6XG4gICAgICByZXR1cm4gdERldGFpbHMuZXJyb3JUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXI6XG4gICAgICByZXR1cm4gdERldGFpbHMucGxhY2Vob2xkZXJUbXBsSW5kZXg7XG4gICAgZGVmYXVsdDpcbiAgICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKGBVbmV4cGVjdGVkIGRlZmVyIGJsb2NrIHN0YXRlOiAke25ld1N0YXRlfWApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmFuc2l0aW9ucyBhIGRlZmVyIGJsb2NrIHRvIHRoZSBuZXcgc3RhdGUuIFVwZGF0ZXMgdGhlICBuZWNlc3NhcnlcbiAqIGRhdGEgc3RydWN0dXJlcyBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBuZXdTdGF0ZSBOZXcgc3RhdGUgdGhhdCBzaG91bGQgYmUgYXBwbGllZCB0byB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgdE5vZGU6IFROb2RlLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGxDb250YWluZXJbUEFSRU5UXTtcblxuICAvLyBDaGVjayBpZiB0aGlzIHZpZXcgaXMgbm90IGRlc3Ryb3llZC4gU2luY2UgdGhlIGxvYWRpbmcgcHJvY2VzcyB3YXMgYXN5bmMsXG4gIC8vIHRoZSB2aWV3IG1pZ2h0IGVuZCB1cCBiZWluZyBkZXN0cm95ZWQgYnkgdGhlIHRpbWUgcmVuZGVyaW5nIGhhcHBlbnMuXG4gIGlmIChpc0Rlc3Ryb3llZChob3N0TFZpZXcpKSByZXR1cm47XG5cbiAgLy8gTWFrZSBzdXJlIHRoaXMgVE5vZGUgYmVsb25ncyB0byBUVmlldyB0aGF0IHJlcHJlc2VudHMgaG9zdCBMVmlldy5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGhvc3RMVmlldyk7XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaG9zdExWaWV3LCB0Tm9kZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobERldGFpbHMsICdFeHBlY3RlZCBhIGRlZmVyIGJsb2NrIHN0YXRlIGRlZmluZWQnKTtcblxuICBjb25zdCBzdGF0ZVRtcGxJbmRleCA9IGdldFRlbXBsYXRlSW5kZXhGb3JTdGF0ZShuZXdTdGF0ZSwgaG9zdExWaWV3LCB0Tm9kZSk7XG4gIC8vIE5vdGU6IHdlIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUgaWYgdGhlIHByZXZpb3VzIHN0YXRlIHdhcyByZXByZXNlbnRlZFxuICAvLyB3aXRoIGEgbnVtYmVyIHRoYXQgaXMgbGVzcyB0aGFuIHRoZSBuZXh0IHN0YXRlLiBGb3IgZXhhbXBsZSwgaWYgdGhlIGN1cnJlbnRcbiAgLy8gc3RhdGUgaXMgXCJsb2FkaW5nXCIgKHJlcHJlc2VudGVkIGFzIGAyYCksIHdlIHNob3VsZCBub3Qgc2hvdyBhIHBsYWNlaG9sZGVyXG4gIC8vIChyZXByZXNlbnRlZCBhcyBgMWApLlxuICBpZiAobERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdIDwgbmV3U3RhdGUgJiYgc3RhdGVUbXBsSW5kZXggIT09IG51bGwpIHtcbiAgICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBzdGF0ZVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0VFZpZXcsIGFkanVzdGVkSW5kZXgpIGFzIFRDb250YWluZXJOb2RlO1xuXG4gICAgLy8gVGhlcmUgaXMgb25seSAxIHZpZXcgdGhhdCBjYW4gYmUgcHJlc2VudCBpbiBhbiBMQ29udGFpbmVyIHRoYXRcbiAgICAvLyByZXByZXNlbnRzIGEgYHsjZGVmZXJ9YCBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXIsIHROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0Tm9kZSwgbnVsbCwge2RlaHlkcmF0ZWRWaWV3fSk7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIGxDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBwcmVmZXRjaGluZyBvZiBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2suXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBpZiAobFZpZXdbSU5KRUNUT1JdICYmIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGxWaWV3W0lOSkVDVE9SXSEpKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyBpZiB0aGUgcHJvY2VzcyBoYXNuJ3Qgc3RhcnRlZCB5ZXQuXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlICE9PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIC8vIElmIHRoZSBsb2FkaW5nIHN0YXR1cyBpcyBkaWZmZXJlbnQgZnJvbSBpbml0aWFsIG9uZSwgaXQgbWVhbnMgdGhhdFxuICAgIC8vIHRoZSBsb2FkaW5nIG9mIGRlcGVuZGVuY2llcyBpcyBpbiBwcm9ncmVzcyBhbmQgdGhlcmUgaXMgbm90aGluZyB0byBkb1xuICAgIC8vIGluIHRoaXMgZnVuY3Rpb24uIEFsbCBkZXRhaWxzIGNhbiBiZSBvYnRhaW5lZCBmcm9tIHRoZSBgdERldGFpbHNgIG9iamVjdC5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmltYXJ5QmxvY2tUTm9kZSA9IGdldFByaW1hcnlCbG9ja1ROb2RlKHRWaWV3LCB0RGV0YWlscyk7XG5cbiAgLy8gU3dpdGNoIGZyb20gTk9UX1NUQVJURUQgLT4gSU5fUFJPR1JFU1Mgc3RhdGUuXG4gIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTO1xuXG4gIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgY29uc3QgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgPVxuICAgICAgaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgP1xuICAgICAgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IuaW50ZXJjZXB0KHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuKSA6XG4gICAgICB0RGV0YWlscy5kZXBlbmRlbmN5UmVzb2x2ZXJGbjtcblxuICAvLyBUaGUgYGRlcGVuZGVuY2llc0ZuYCBtaWdodCBiZSBgbnVsbGAgd2hlbiBhbGwgZGVwZW5kZW5jaWVzIHdpdGhpblxuICAvLyBhIGdpdmVuIGB7I2RlZmVyfWAgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVmZXIgYmxvY2sgbWF5IGhhdmUgbXVsdGlwbGUgcHJlZmV0Y2ggdHJpZ2dlcnMuIE9uY2UgdGhlIGxvYWRpbmdcbiAgLy8gc3RhcnRzLCBpbnZva2UgYWxsIGNsZWFuIGZ1bmN0aW9ucywgc2luY2UgdGhleSBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbiAgaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yLCB0RGV0YWlscyk7XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnkgP1xuICAgICAgICAgICAgWy4uLnByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCAuLi5kaXJlY3RpdmVEZWZzXSA6XG4gICAgICAgICAgICBkaXJlY3RpdmVEZWZzO1xuICAgICAgfVxuICAgICAgaWYgKHBpcGVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID9cbiAgICAgICAgICAgIFsuLi5wcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnksIC4uLnBpcGVEZWZzXSA6XG4gICAgICAgICAgICBwaXBlRGVmcztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgYHs6cGxhY2Vob2xkZXJ9YCBjb250ZW50IChpZiBwcmVzZW50KSAqL1xuZnVuY3Rpb24gcmVuZGVyUGxhY2Vob2xkZXIobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsIHROb2RlLCBsQ29udGFpbmVyKTtcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIHRoZSBcImxvYWRpbmdcIiBQcm9taXNlIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgZGVmZXIgc3ViLWJsb2NrLFxuICogYmFzZWQgb24gdGhlIGxvYWRpbmcgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgUmVwcmVzZW50cyBkZWZlciBibG9jayBpbmZvIHNoYXJlZCBhY3Jvc3MgYWxsIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKFxuICAgIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UsICdFeHBlY3RlZCBsb2FkaW5nIFByb21pc2UgdG8gZXhpc3Qgb24gdGhpcyBkZWZlciBibG9jaycpO1xuXG4gIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlIS50aGVuKCgpID0+IHtcbiAgICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcblxuICAgICAgLy8gRXZlcnl0aGluZyBpcyBsb2FkZWQsIHNob3cgdGhlIHByaW1hcnkgYmxvY2sgY29udGVudFxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gICAgfSBlbHNlIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRCkge1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgbWFpbiBjb250ZW50IG9mIGEgZGVmZXIgYmxvY2suICovXG5mdW5jdGlvbiBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldzogVFZpZXcsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpOiBUQ29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgcmV0dXJuIGdldFROb2RlKHRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byB0cmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICogSWYgdGhlIGJsb2NrIGlzIGFscmVhZHkgaW4gYSBsb2FkaW5nLCBjb21wbGV0ZWQgb3IgYW4gZXJyb3Igc3RhdGUgLVxuICogbm8gYWRkaXRpb25hbCBhY3Rpb25zIGFyZSB0YWtlbi5cbiAqL1xuZnVuY3Rpb24gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgaWYgKCFzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIENvbmRpdGlvbiBpcyB0cmlnZ2VyZWQsIHRyeSB0byByZW5kZXIgbG9hZGluZyBzdGF0ZSBhbmQgc3RhcnQgZG93bmxvYWRpbmcuXG4gIC8vIE5vdGU6IGlmIGEgYmxvY2sgaXMgaW4gYSBsb2FkaW5nLCBjb21wbGV0ZWQgb3IgYW4gZXJyb3Igc3RhdGUsIHRoaXMgY2FsbCB3b3VsZCBiZSBhIG5vb3AuXG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuTG9hZGluZywgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gIHN3aXRjaCAodERldGFpbHMubG9hZGluZ1N0YXRlKSB7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRDpcbiAgICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcblxuICAgICAgLy8gVGhlIGBsb2FkaW5nU3RhdGVgIG1pZ2h0IGhhdmUgY2hhbmdlZCB0byBcImxvYWRpbmdcIi5cbiAgICAgIGlmICgodERldGFpbHMubG9hZGluZ1N0YXRlIGFzIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlKSA9PT1cbiAgICAgICAgICBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUykge1xuICAgICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M6XG4gICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU6XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHMpO1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkVycm9yLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICB0aHJvd0Vycm9yKCdVbmtub3duIGRlZmVyIGJsb2NrIHN0YXRlJyk7XG4gICAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBc3NlcnRzIHdoZXRoZXIgYWxsIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jayBhcmUgbG9hZGVkLlxuICogQWx3YXlzIHJ1biB0aGlzIGZ1bmN0aW9uIChpbiBkZXYgbW9kZSkgYmVmb3JlIHJlbmRlcmluZyBhIGRlZmVyXG4gKiBibG9jayBpbiBjb21wbGV0ZWQgc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFLFxuICAgICAgJ0V4cGVjdGluZyBhbGwgZGVmZXJyZWQgZGVwZW5kZW5jaWVzIHRvIGJlIGxvYWRlZC4nKTtcbn1cblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKlxuICogRGVzY3JpYmVzIGEgaGVscGVyIGNsYXNzIHRoYXQgYWxsb3dzIHRvIGludGVyY2VwdCBhIGNhbGwgdG8gcmV0cmlldmUgY3VycmVudFxuICogZGVwZW5kZW5jeSBsb2FkaW5nIGZ1bmN0aW9uIGFuZCByZXBsYWNlIGl0IHdpdGggYSBkaWZmZXJlbnQgaW1wbGVtZW50YXRpb24uXG4gKiBUaGlzIGludGVyY2VwdG9yIGNsYXNzIGlzIG5lZWRlZCB0byBhbGxvdyB0ZXN0aW5nIGJsb2NrcyBpbiBkaWZmZXJlbnQgc3RhdGVzXG4gKiBieSBzaW11bGF0aW5nIGxvYWRpbmcgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvciB7XG4gIC8qKlxuICAgKiBJbnZva2VkIGZvciBlYWNoIGRlZmVyIGJsb2NrIHdoZW4gZGVwZW5kZW5jeSBsb2FkaW5nIGZ1bmN0aW9uIGlzIGFjY2Vzc2VkLlxuICAgKi9cbiAgaW50ZXJjZXB0KGRlcGVuZGVuY3lGbjogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCk6IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbG93cyB0byBjb25maWd1cmUgYW4gaW50ZXJjZXB0b3IgZnVuY3Rpb24uXG4gICAqL1xuICBzZXRJbnRlcmNlcHRvcihpbnRlcmNlcHRvckZuOiAoY3VycmVudDogRGVwZW5kZW5jeVJlc29sdmVyRm4pID0+IERlcGVuZGVuY3lSZXNvbHZlckZuKTogdm9pZDtcbn1cblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKlxuICogSW5qZWN0b3IgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcHJvdmlkZSBgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcmAgY2xhc3NcbiAqIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3I+KFxuICAgICAgICBuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUicgOiAnJyk7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGdpdmVuIHZhbHVlIG1hdGNoZXMgdGhlIGV4cGVjdGVkIHN0cnVjdHVyZSBvZiBhIGRlZmVyIGJsb2NrXG4gKlxuICogV2UgY2FuIHNhZmVseSByZWx5IG9uIHRoZSBwcmltYXJ5VG1wbEluZGV4IGJlY2F1c2UgZXZlcnkgZGVmZXIgYmxvY2sgcmVxdWlyZXNcbiAqIHRoYXQgYSBwcmltYXJ5IHRlbXBsYXRlIGV4aXN0cy4gQWxsIHRoZSBvdGhlciB0ZW1wbGF0ZSBvcHRpb25zIGFyZSBvcHRpb25hbC5cbiAqL1xuZnVuY3Rpb24gaXNURGVmZXJCbG9ja0RldGFpbHModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBURGVmZXJCbG9ja0RldGFpbHMge1xuICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpICYmXG4gICAgICAodHlwZW9mICh2YWx1ZSBhcyBURGVmZXJCbG9ja0RldGFpbHMpLnByaW1hcnlUbXBsSW5kZXggPT09ICdudW1iZXInKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB1c2VkIGZvciBjb25maWd1cmluZyBkZWZlciBibG9jayBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0NPTkZJRyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPERlZmVyQmxvY2tDb25maWc+KG5nRGV2TW9kZSA/ICdERUZFUl9CTE9DS19DT05GSUcnIDogJycpO1xuXG4vKipcbiAqIERlZmVyIGJsb2NrIGluc3RhbmNlIGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgbFZpZXc6IExWaWV3O1xuICB0Tm9kZTogVE5vZGU7XG4gIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9ja3MgaW4gYSBnaXZlbiBMVmlldy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgbFZpZXcgd2l0aCBkZWZlciBibG9ja3NcbiAqIEBwYXJhbSBkZWZlckJsb2NrcyBkZWZlciBibG9jayBhZ2dyZWdhdG9yIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZlckJsb2NrcyhsVmlldzogTFZpZXcsIGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gSEVBREVSX09GRlNFVDsgaSA8IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4OyBpKyspIHtcbiAgICBpZiAoaXNMQ29udGFpbmVyKGxWaWV3W2ldKSkge1xuICAgICAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2ldO1xuICAgICAgLy8gQW4gTENvbnRhaW5lciBtYXkgcmVwcmVzZW50IGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2ssIGluIHdoaWNoIGNhc2VcbiAgICAgIC8vIHdlIHN0b3JlIGl0IGFzIGEgcmVzdWx0LiBPdGhlcndpc2UsIGtlZXAgaXRlcmF0aW5nIG92ZXIgTENvbnRhaW5lciB2aWV3cyBhbmRcbiAgICAgIC8vIGxvb2sgZm9yIGRlZmVyIGJsb2Nrcy5cbiAgICAgIGNvbnN0IGlzTGFzdCA9IGkgPT09IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gMTtcbiAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICAgICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcbiAgICAgICAgaWYgKGlzVERlZmVyQmxvY2tEZXRhaWxzKHREZXRhaWxzKSkge1xuICAgICAgICAgIGRlZmVyQmxvY2tzLnB1c2goe2xDb250YWluZXIsIGxWaWV3LCB0Tm9kZSwgdERldGFpbHN9KTtcbiAgICAgICAgICAvLyBUaGlzIExDb250YWluZXIgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLCBzbyB3ZSBleGl0XG4gICAgICAgICAgLy8gdGhpcyBpdGVyYXRpb24gYW5kIGRvbid0IGluc3BlY3Qgdmlld3MgaW4gdGhpcyBMQ29udGFpbmVyLlxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGdldERlZmVyQmxvY2tzKGxDb250YWluZXJbaV0gYXMgTFZpZXcsIGRlZmVyQmxvY2tzKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzTFZpZXcobFZpZXdbaV0pKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBlbnRlciB0aGUgYGdldERlZmVyQmxvY2tzYCByZWN1cnNpdmVseS5cbiAgICAgIGdldERlZmVyQmxvY2tzKGxWaWV3W2ldLCBkZWZlckJsb2Nrcyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgY2xlYW51cCBmdW5jdGlvbiBhc3NvY2lhdGVkIHdpdGggYSBwcmVmZXRjaGluZyB0cmlnZ2VyXG4gKiBvZiBhIGdpdmVuIGRlZmVyIGJsb2NrLlxuICovXG5mdW5jdGlvbiByZWdpc3RlclREZXRhaWxzQ2xlYW51cChcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nLCBjbGVhbnVwRm46IFZvaWRGdW5jdGlvbikge1xuICBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKS5hZGQodERldGFpbHMsIGtleSwgY2xlYW51cEZuKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGFsbCByZWdpc3RlcmVkIHByZWZldGNoIGNsZWFudXAgdHJpZ2dlcnNcbiAqIGFuZCByZW1vdmVzIGFsbCBjbGVhbnVwIGZ1bmN0aW9ucyBhZnRlcndhcmRzLlxuICovXG5mdW5jdGlvbiBpbnZva2VURGV0YWlsc0NsZWFudXAoaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpLmNsZWFudXAodERldGFpbHMpO1xufVxuXG4vKipcbiAqIEludGVybmFsIHNlcnZpY2UgdG8ga2VlcCB0cmFjayBvZiBjbGVhbnVwIGZ1bmN0aW9ucyBhc3NvY2lhdGVkXG4gKiB3aXRoIGRlZmVyIGJsb2Nrcy4gVGhpcyBjbGFzcyBpcyB1c2VkIHRvIG1hbmFnZSBjbGVhbnVwIGZ1bmN0aW9uc1xuICogY3JlYXRlZCBmb3IgcHJlZmV0Y2hpbmcgdHJpZ2dlcnMuXG4gKi9cbmNsYXNzIERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlciB7XG4gIHByaXZhdGUgYmxvY2tzID0gbmV3IE1hcDxURGVmZXJCbG9ja0RldGFpbHMsIE1hcDxzdHJpbmcsIFZvaWRGdW5jdGlvbltdPj4oKTtcblxuICBhZGQodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBpZiAoIXRoaXMuYmxvY2tzLmhhcyh0RGV0YWlscykpIHtcbiAgICAgIHRoaXMuYmxvY2tzLnNldCh0RGV0YWlscywgbmV3IE1hcCgpKTtcbiAgICB9XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpITtcbiAgICBpZiAoIWJsb2NrLmhhcyhrZXkpKSB7XG4gICAgICBibG9jay5zZXQoa2V5LCBbXSk7XG4gICAgfVxuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGJsb2NrLmdldChrZXkpITtcbiAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBoYXModERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpPy5oYXMoa2V5KTtcbiAgfVxuXG4gIGNsZWFudXAodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKTtcbiAgICBpZiAoYmxvY2spIHtcbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2tzIG9mIE9iamVjdC52YWx1ZXMoYmxvY2spKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgY2FsbGJhY2tzKSB7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5ibG9ja3MuZGVsZXRlKHREZXRhaWxzKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBmb3IgKGNvbnN0IFtibG9ja10gb2YgdGhpcy5ibG9ja3MpIHtcbiAgICAgIHRoaXMuY2xlYW51cChibG9jayk7XG4gICAgfVxuICAgIHRoaXMuYmxvY2tzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIoKSxcbiAgfSk7XG59XG4iXX0=