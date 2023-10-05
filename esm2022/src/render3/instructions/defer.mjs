/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, InjectionToken, ɵɵdefineInjectable } from '../../di';
import { findMatchingDehydratedView } from '../../hydration/views';
import { populateDehydratedViewsInLContainer } from '../../linker/view_container_ref';
import { arrayInsert2, arraySplice } from '../../util/array_utils';
import { assertDefined, assertElement, assertEqual, throwError } from '../../util/assert';
import { NgZone } from '../../zone';
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
import { onHover, onInteraction, onViewport } from './defer_events';
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
 * Creates runtime data structures for defer blocks.
 *
 * @param index Index of the `defer` instruction.
 * @param primaryTmplIndex Index of the template with the primary block content.
 * @param dependencyResolverFn Function that contains dependencies for this defer block.
 * @param loadingTmplIndex Index of the template with the loading block content.
 * @param placeholderTmplIndex Index of the template with the placeholder block content.
 * @param errorTmplIndex Index of the template with the error block content.
 * @param loadingConfigIndex Index in the constants array of the configuration of the loading.
 *     block.
 * @param placeholderConfigIndex Index in the constants array of the configuration of the
 *     placeholder block.
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
    const tNode = getCurrentTNode();
    const lContainer = lView[adjustedIndex];
    // If hydration is enabled, looks up dehydrated views in the DOM
    // using hydration annotation info and stores those views on LContainer.
    // In client-only mode, this function is a noop.
    populateDehydratedViewsInLContainer(lContainer, tNode, lView);
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
 * Sets up logic to handle the `on idle` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnIdle() {
    scheduleDelayedTrigger(onIdle);
}
/**
 * Sets up logic to handle the `prefetch on idle` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnIdle() {
    scheduleDelayedPrefetching(onIdle, 0 /* DeferBlockTriggers.OnIdle */);
}
/**
 * Sets up logic to handle the `on immediate` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnImmediate() {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    // Render placeholder block only if loading template is not present
    // to avoid content flickering, since it would be immediately replaced
    // by the loading block.
    if (tDetails.loadingTmplIndex === null) {
        renderPlaceholder(lView, tNode);
    }
    triggerDeferBlock(lView, tNode);
}
/**
 * Sets up logic to handle the `prefetch on immediate` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnImmediate() {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        triggerResourceLoading(tDetails, lView);
    }
}
/**
 * Creates runtime data structures for the `on timer` deferred trigger.
 * @param delay Amount of time to wait before loading the content.
 * @codeGenApi
 */
export function ɵɵdeferOnTimer(delay) {
    scheduleDelayedTrigger(onTimer(delay));
}
/**
 * Creates runtime data structures for the `prefetch on timer` deferred trigger.
 * @param delay Amount of time to wait before prefetching the content.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnTimer(delay) {
    scheduleDelayedPrefetching(onTimer(delay), 1 /* DeferBlockTriggers.OnTimer */);
}
/**
 * Creates runtime data structures for the `on hover` deferred trigger.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to walk up/down the tree hierarchy to find the trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnHover(triggerIndex, walkUpTimes) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    renderPlaceholder(lView, tNode);
    registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onHover, () => triggerDeferBlock(lView, tNode));
}
/**
 * Creates runtime data structures for the `prefetch on hover` deferred trigger.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to walk up/down the tree hierarchy to find the trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnHover(triggerIndex, walkUpTimes) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onHover, () => triggerPrefetching(tDetails, lView));
    }
}
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
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to walk up/down the tree hierarchy to find the trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnViewport(triggerIndex, walkUpTimes) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    renderPlaceholder(lView, tNode);
    registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onViewport, () => triggerDeferBlock(lView, tNode));
}
/**
 * Creates runtime data structures for the `prefetch on viewport` deferred trigger.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to walk up/down the tree hierarchy to find the trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnViewport(triggerIndex, walkUpTimes) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onViewport, () => triggerPrefetching(tDetails, lView));
    }
}
/********** Helper functions **********/
/**
 * Schedules triggering of a defer block for `on idle` and `on timer` conditions.
 */
function scheduleDelayedTrigger(scheduleFn) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    renderPlaceholder(lView, tNode);
    scheduleFn(() => triggerDeferBlock(lView, tNode), lView, true /* withLViewCleanup */);
}
/**
 * Schedules prefetching for `on idle` and `on timer` triggers.
 *
 * @param scheduleFn A function that does the scheduling.
 * @param trigger A trigger that initiated scheduling.
 */
function scheduleDelayedPrefetching(scheduleFn, trigger) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        // Prevent scheduling more than one prefetch init call
        // for each defer block. For this reason we use only a trigger
        // identifier in a key, so all instances would use the same key.
        const key = String(trigger);
        const injector = lView[INJECTOR];
        const manager = injector.get(DeferBlockCleanupManager);
        if (!manager.has(tDetails, key)) {
            // In case of prefetching, we intentionally avoid cancelling resource loading if
            // an underlying LView get destroyed (thus passing `null` as a second argument),
            // because there might be other LViews (that represent embedded views) that
            // depend on resource loading.
            const prefetch = () => triggerPrefetching(tDetails, lView);
            const cleanupFn = scheduleFn(prefetch, lView, false /* withLViewCleanup */);
            registerTDetailsCleanup(injector, tDetails, key, cleanupFn);
        }
    }
}
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
 * @param lView LView that hosts an instance of a defer block.
 * @param withLViewCleanup A flag that indicates whether a scheduled callback
 *           should be cancelled in case an LView is destroyed before a callback
 *           was invoked.
 */
function onIdle(callback, lView, withLViewCleanup) {
    const injector = lView[INJECTOR];
    const scheduler = injector.get(OnIdleScheduler);
    const cleanupFn = () => scheduler.remove(callback);
    const wrappedCallback = withLViewCleanup ? wrapWithLViewCleanup(callback, lView, cleanupFn) : callback;
    scheduler.add(wrappedCallback);
    return cleanupFn;
}
/**
 * Returns a function that captures a provided delay.
 * Invoking the returned function schedules a trigger.
 */
function onTimer(delay) {
    return (callback, lView, withLViewCleanup) => scheduleTimerTrigger(delay, callback, lView, withLViewCleanup);
}
/**
 * Schedules a callback to be invoked after a given timeout.
 *
 * @param delay A number of ms to wait until firing a callback.
 * @param callback A function to be invoked after a timeout.
 * @param lView LView that hosts an instance of a defer block.
 * @param withLViewCleanup A flag that indicates whether a scheduled callback
 *           should be cancelled in case an LView is destroyed before a callback
 *           was invoked.
 */
function scheduleTimerTrigger(delay, callback, lView, withLViewCleanup) {
    const injector = lView[INJECTOR];
    const scheduler = injector.get(TimerScheduler);
    const cleanupFn = () => scheduler.remove(callback);
    const wrappedCallback = withLViewCleanup ? wrapWithLViewCleanup(callback, lView, cleanupFn) : callback;
    scheduler.add(delay, wrappedCallback);
    return cleanupFn;
}
/**
 * Wraps a given callback into a logic that registers a cleanup function
 * in the LView cleanup slot, to be invoked when an LView is destroyed.
 */
function wrapWithLViewCleanup(callback, lView, cleanup) {
    const wrappedCallback = () => {
        callback();
        removeLViewOnDestroy(lView, cleanup);
    };
    storeLViewOnDestroy(lView, cleanup);
    return wrappedCallback;
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
        // represents a defer block, so always refer to the first one.
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
    // a given defer block were eagerly references elsewhere in a file,
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
                primaryBlockTView.directiveRegistry =
                    addDepsToRegistry(primaryBlockTView.directiveRegistry, directiveDefs);
            }
            if (pipeDefs.length > 0) {
                primaryBlockTView.pipeRegistry =
                    addDepsToRegistry(primaryBlockTView.pipeRegistry, pipeDefs);
            }
        }
    });
}
/**
 * Adds downloaded dependencies into a directive or a pipe registry,
 * making sure that a dependency doesn't yet exist in the registry.
 */
function addDepsToRegistry(currentDeps, newDeps) {
    if (!currentDeps || currentDeps.length === 0) {
        return newDeps;
    }
    const currentDepSet = new Set(currentDeps);
    for (const dep of newDeps) {
        currentDepSet.add(dep);
    }
    // If `currentDeps` is the same length, there were no new deps and can
    // return the original array.
    return (currentDeps.length === currentDepSet.size) ? currentDeps : Array.from(currentDepSet);
}
/** Utility function to render placeholder content (if present) */
function renderPlaceholder(lView, tNode) {
    const lContainer = lView[tNode.index];
    ngDevMode && assertLContainer(lContainer);
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
/**
 * Use shims for the `requestIdleCallback` and `cancelIdleCallback` functions for
 * environments where those functions are not available (e.g. Node.js and Safari).
 *
 * Note: we wrap the `requestIdleCallback` call into a function, so that it can be
 * overridden/mocked in test environment and picked up by the runtime code.
 */
const _requestIdleCallback = () => typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout;
const _cancelIdleCallback = () => typeof requestIdleCallback !== 'undefined' ? cancelIdleCallback : clearTimeout;
/**
 * Helper service to schedule `requestIdleCallback`s for batches of defer blocks,
 * to avoid calling `requestIdleCallback` for each defer block (e.g. if
 * defer blocks are defined inside a for loop).
 */
class OnIdleScheduler {
    constructor() {
        // Indicates whether current callbacks are being invoked.
        this.executingCallbacks = false;
        // Currently scheduled idle callback id.
        this.idleId = null;
        // Set of callbacks to be invoked next.
        this.current = new Set();
        // Set of callbacks collected while invoking current set of callbacks.
        // Those callbacks are scheduled for the next idle period.
        this.deferred = new Set();
        this.ngZone = inject(NgZone);
        this.requestIdleCallback = _requestIdleCallback().bind(globalThis);
        this.cancelIdleCallback = _cancelIdleCallback().bind(globalThis);
    }
    add(callback) {
        const target = this.executingCallbacks ? this.deferred : this.current;
        target.add(callback);
        if (this.idleId === null) {
            this.scheduleIdleCallback();
        }
    }
    remove(callback) {
        this.current.delete(callback);
        this.deferred.delete(callback);
    }
    scheduleIdleCallback() {
        const callback = () => {
            this.cancelIdleCallback(this.idleId);
            this.idleId = null;
            this.executingCallbacks = true;
            for (const callback of this.current) {
                callback();
            }
            this.current.clear();
            this.executingCallbacks = false;
            // If there are any callbacks added during an invocation
            // of the current ones - make them "current" and schedule
            // a new idle callback.
            if (this.deferred.size > 0) {
                for (const callback of this.deferred) {
                    this.current.add(callback);
                }
                this.deferred.clear();
                this.scheduleIdleCallback();
            }
        };
        // Ensure that the callback runs in the NgZone since
        // the `requestIdleCallback` is not currently patched by Zone.js.
        this.idleId = this.requestIdleCallback(() => this.ngZone.run(callback));
    }
    ngOnDestroy() {
        if (this.idleId !== null) {
            this.cancelIdleCallback(this.idleId);
            this.idleId = null;
        }
        this.current.clear();
        this.deferred.clear();
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: OnIdleScheduler,
        providedIn: 'root',
        factory: () => new OnIdleScheduler(),
    }); }
}
/**
 * Helper service to schedule `setTimeout`s for batches of defer blocks,
 * to avoid calling `setTimeout` for each defer block (e.g. if defer blocks
 * are created inside a for loop).
 */
class TimerScheduler {
    constructor() {
        // Indicates whether current callbacks are being invoked.
        this.executingCallbacks = false;
        // Currently scheduled `setTimeout` id.
        this.timeoutId = null;
        // When currently scheduled timer would fire.
        this.invokeTimerAt = null;
        // List of callbacks to be invoked.
        // For each callback we also store a timestamp on when the callback
        // should be invoked. We store timestamps and callback functions
        // in a flat array to avoid creating new objects for each entry.
        // [timestamp1, callback1, timestamp2, callback2, ...]
        this.current = [];
        // List of callbacks collected while invoking current set of callbacks.
        // Those callbacks are added to the "current" queue at the end of
        // the current callback invocation. The shape of this list is the same
        // as the shape of the `current` list.
        this.deferred = [];
    }
    add(delay, callback) {
        const target = this.executingCallbacks ? this.deferred : this.current;
        this.addToQueue(target, Date.now() + delay, callback);
        this.scheduleTimer();
    }
    remove(callback) {
        const callbackIndex = this.removeFromQueue(this.current, callback);
        if (callbackIndex === -1) {
            // Try cleaning up deferred queue only in case
            // we didn't find a callback in the "current" queue.
            this.removeFromQueue(this.deferred, callback);
        }
    }
    addToQueue(target, invokeAt, callback) {
        let insertAtIndex = target.length;
        for (let i = 0; i < target.length; i += 2) {
            const invokeQueuedCallbackAt = target[i];
            if (invokeQueuedCallbackAt > invokeAt) {
                // We've reached a first timer that is scheduled
                // for a later time than what we are trying to insert.
                // This is the location at which we need to insert,
                // no need to iterate further.
                insertAtIndex = i;
                break;
            }
        }
        arrayInsert2(target, insertAtIndex, invokeAt, callback);
    }
    removeFromQueue(target, callback) {
        let index = -1;
        for (let i = 0; i < target.length; i += 2) {
            const queuedCallback = target[i + 1];
            if (queuedCallback === callback) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            // Remove 2 elements: a timestamp slot and
            // the following slot with a callback function.
            arraySplice(target, index, 2);
        }
        return index;
    }
    scheduleTimer() {
        const callback = () => {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            this.executingCallbacks = true;
            // Invoke callbacks that were scheduled to run
            // before the current time.
            let now = Date.now();
            let lastCallbackIndex = null;
            for (let i = 0; i < this.current.length; i += 2) {
                const invokeAt = this.current[i];
                const callback = this.current[i + 1];
                if (invokeAt <= now) {
                    callback();
                    // Point at the invoked callback function, which is located
                    // after the timestamp.
                    lastCallbackIndex = i + 1;
                }
                else {
                    // We've reached a timer that should not be invoked yet.
                    break;
                }
            }
            if (lastCallbackIndex !== null) {
                // If last callback index is `null` - no callbacks were invoked,
                // so no cleanup is needed. Otherwise, remove invoked callbacks
                // from the queue.
                arraySplice(this.current, 0, lastCallbackIndex + 1);
            }
            this.executingCallbacks = false;
            // If there are any callbacks added during an invocation
            // of the current ones - move them over to the "current"
            // queue.
            if (this.deferred.length > 0) {
                for (let i = 0; i < this.deferred.length; i += 2) {
                    const invokeAt = this.deferred[i];
                    const callback = this.deferred[i + 1];
                    this.addToQueue(this.current, invokeAt, callback);
                }
                this.deferred.length = 0;
            }
            this.scheduleTimer();
        };
        // Avoid running timer callbacks more than once per
        // average frame duration. This is needed for better
        // batching and to avoid kicking off excessive change
        // detection cycles.
        const FRAME_DURATION_MS = 16; // 1000ms / 60fps
        if (this.current.length > 0) {
            const now = Date.now();
            // First element in the queue points at the timestamp
            // of the first (earliest) event.
            const invokeAt = this.current[0];
            if (!this.timeoutId ||
                // Reschedule a timer in case a queue contains an item with
                // an earlier timestamp and the delta is more than an average
                // frame duration.
                (this.invokeTimerAt && (this.invokeTimerAt - invokeAt > FRAME_DURATION_MS))) {
                if (this.timeoutId !== null) {
                    // There was a timeout already, but an earlier event was added
                    // into the queue. In this case we drop an old timer and setup
                    // a new one with an updated (smaller) timeout.
                    clearTimeout(this.timeoutId);
                    this.timeoutId = null;
                }
                const timeout = Math.max(invokeAt - now, FRAME_DURATION_MS);
                this.invokeTimerAt = invokeAt;
                this.timeoutId = setTimeout(callback, timeout);
            }
        }
    }
    ngOnDestroy() {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.current.length = 0;
        this.deferred.length = 0;
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: TimerScheduler,
        providedIn: 'root',
        factory: () => new TimerScheduler(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBWSxrQkFBa0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsbUNBQW1DLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN4RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3JHLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBb0IsdUJBQXVCLEVBQUUsZUFBZSxFQUFzQiw2QkFBNkIsRUFBMkgsTUFBTSxxQkFBcUIsQ0FBQztBQUduVCxPQUFPLEVBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQXFCLE1BQU0sRUFBRSxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUMzRyxPQUFPLEVBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDakcsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDckQsT0FBTyxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkksT0FBTyxFQUFDLG9CQUFvQixFQUFFLDRCQUE0QixFQUFFLHlCQUF5QixFQUFFLGtCQUFrQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFdkksT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUV0Qzs7Ozs7R0FLRztBQUNILFNBQVMsdUJBQXVCLENBQUMsUUFBa0I7SUFDakQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUN4RSxJQUFJLE1BQU0sRUFBRSxRQUFRLEtBQUssa0JBQWtCLENBQUMsTUFBTSxFQUFFO1FBQ2xELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLFVBQVUsT0FBTyxDQUNuQixLQUFhLEVBQUUsZ0JBQXdCLEVBQUUsb0JBQWdELEVBQ3pGLGdCQUE4QixFQUFFLG9CQUFrQyxFQUNsRSxjQUE0QixFQUFFLGtCQUFnQyxFQUM5RCxzQkFBb0M7SUFDdEMsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxNQUFNLGFBQWEsR0FBRyxLQUFLLEdBQUcsYUFBYSxDQUFDO0lBRTVDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU5QixJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsTUFBTSxnQkFBZ0IsR0FBdUI7WUFDM0MsZ0JBQWdCO1lBQ2hCLGdCQUFnQixFQUFFLGdCQUFnQixJQUFJLElBQUk7WUFDMUMsb0JBQW9CLEVBQUUsb0JBQW9CLElBQUksSUFBSTtZQUNsRCxjQUFjLEVBQUUsY0FBYyxJQUFJLElBQUk7WUFDdEMsc0JBQXNCLEVBQUUsc0JBQXNCLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQ3BELFdBQVcsQ0FBaUMsV0FBVyxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQztnQkFDbEYsSUFBSTtZQUNSLGtCQUFrQixFQUFFLGtCQUFrQixJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxXQUFXLENBQTZCLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLElBQUk7WUFDUixvQkFBb0IsRUFBRSxvQkFBb0IsSUFBSSxJQUFJO1lBQ2xELFlBQVksRUFBRSw2QkFBNkIsQ0FBQyxXQUFXO1lBQ3ZELGNBQWMsRUFBRSxJQUFJO1NBQ3JCLENBQUM7UUFFRixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7S0FDL0Q7SUFFRCxNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFeEMsZ0VBQWdFO0lBQ2hFLHdFQUF3RTtJQUN4RSxnREFBZ0Q7SUFDaEQsbUNBQW1DLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU5RCxxREFBcUQ7SUFDckQsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQztJQUM5RCxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFFBQThCLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxRQUFpQjtJQUMzQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLFlBQVksR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3hDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDakQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsZ0NBQWdDO1FBQ2xFLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDakMsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2xELElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxhQUFhLEtBQUssdUJBQXVCLENBQUMsT0FBTyxFQUFFO1lBQ3hFLGlFQUFpRTtZQUNqRSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDakM7YUFBTSxJQUNILEtBQUssS0FBSyxJQUFJO1lBQ2QsQ0FBQyxhQUFhLEtBQUssdUJBQXVCLENBQUMsT0FBTztnQkFDakQsYUFBYSxLQUFLLGVBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNuRCwwRUFBMEU7WUFDMUUsMkVBQTJFO1lBQzNFLFNBQVM7WUFDVCxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDakM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsUUFBaUI7SUFDbkQsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUV4QyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1FBQ2pELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFFLGdDQUFnQztRQUNsRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztRQUNqQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1lBQ3pGLHVEQUF1RDtZQUN2RCxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsYUFBYTtJQUMzQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQywwQkFBMEIsQ0FBQyxNQUFNLG9DQUE0QixDQUFDO0FBQ2hFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCO0lBQ2hDLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckQsbUVBQW1FO0lBQ25FLHNFQUFzRTtJQUN0RSx3QkFBd0I7SUFDeEIsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxFQUFFO1FBQ3RDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNqQztJQUNELGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBR0Q7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQjtJQUN4QyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDdkUsc0JBQXNCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3pDO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQWE7SUFDMUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsS0FBYTtJQUNsRCwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLHFDQUE2QixDQUFDO0FBQ3pFLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsWUFBb0IsRUFBRSxXQUFvQjtJQUN2RSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUVqQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEMsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMvRixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsWUFBb0IsRUFBRSxXQUFvQjtJQUMvRSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDdkUsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFDaEQsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDaEQ7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsWUFBb0IsRUFBRSxXQUFvQjtJQUM3RSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUVqQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEMsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFDdEQsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDckYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1FBQ3ZFLGtCQUFrQixDQUNkLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQ3RELEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDMUUsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFFakMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLGtCQUFrQixDQUNkLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbEcsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDbEYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1FBQ3ZFLGtCQUFrQixDQUNkLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQ25ELEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQUVELHdDQUF3QztBQUV4Qzs7R0FFRztBQUNILFNBQVMsc0JBQXNCLENBQzNCLFVBQTZGO0lBQy9GLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBRWpDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN4RixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLDBCQUEwQixDQUMvQixVQUE2RixFQUM3RixPQUEyQjtJQUM3QixNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDdkUsc0RBQXNEO1FBQ3RELDhEQUE4RDtRQUM5RCxnRUFBZ0U7UUFDaEUsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQztRQUNsQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQy9CLGdGQUFnRjtZQUNoRixnRkFBZ0Y7WUFDaEYsMkVBQTJFO1lBQzNFLDhCQUE4QjtZQUM5QixNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDNUUsdUJBQXVCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDN0Q7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxlQUFlLENBQ3BCLGlCQUF3QixFQUFFLGFBQW9CLEVBQUUsV0FBNkI7SUFDL0UsOERBQThEO0lBQzlELElBQUksV0FBVyxJQUFJLElBQUksRUFBRTtRQUN2QixPQUFPLGlCQUFpQixDQUFDO0tBQzFCO0lBRUQsdUVBQXVFO0lBQ3ZFLElBQUksV0FBVyxJQUFJLENBQUMsRUFBRTtRQUNwQixPQUFPLFdBQVcsQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztLQUNwRDtJQUVELGlGQUFpRjtJQUNqRixNQUFNLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqRSxTQUFTLElBQUksZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNqRCxNQUFNLFlBQVksR0FBRyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUV4RSxtRkFBbUY7SUFDbkYsSUFBSSxTQUFTLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtRQUN0QyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN6RSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNsRCxXQUFXLENBQ1AsYUFBYSxFQUFFLGVBQWUsQ0FBQyxXQUFXLEVBQzFDLDREQUE0RCxDQUFDLENBQUM7UUFDbEUsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQzNCO0lBRUQsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLGlCQUFpQixDQUFDLFlBQW1CLEVBQUUsWUFBb0I7SUFDbEUsTUFBTSxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxHQUFHLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztJQUM3RSxTQUFTLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sT0FBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBUyxrQkFBa0IsQ0FDdkIsWUFBbUIsRUFBRSxLQUFZLEVBQUUsWUFBb0IsRUFBRSxXQUE2QixFQUN0RixVQUEwRixFQUMxRixRQUFzQjtJQUN4QixNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFFLENBQUM7SUFFekMsOERBQThEO0lBQzlELHNEQUFzRDtJQUN0RCxNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUVsRCx5RkFBeUY7UUFDekYsSUFBSSxhQUFhLEtBQUssdUJBQXVCLENBQUMsT0FBTztZQUNqRCxhQUFhLEtBQUssZUFBZSxDQUFDLFdBQVcsRUFBRTtZQUNqRCxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDekIsT0FBTztTQUNSO1FBRUQsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFdkUscURBQXFEO1FBQ3JELG9FQUFvRTtRQUNwRSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ2pCLE9BQU87U0FDUjtRQUVELDhGQUE4RjtRQUM5RixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsaUNBQXVCLEVBQUU7WUFDOUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLE9BQU87U0FDUjtRQUVELHlEQUF5RDtRQUN6RCxNQUFNLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDOUQsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDdkMsUUFBUSxFQUFFLENBQUM7WUFDWCxvQkFBb0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUMsSUFBSSxZQUFZLEtBQUssWUFBWSxFQUFFO2dCQUNqQyxvQkFBb0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDN0M7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUViLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN6QixtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFM0MsNkRBQTZEO1FBQzdELDZEQUE2RDtRQUM3RCxJQUFJLFlBQVksS0FBSyxZQUFZLEVBQUU7WUFDakMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVDO0lBQ0gsQ0FBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLE1BQU0sQ0FBQyxRQUFzQixFQUFFLEtBQVksRUFBRSxnQkFBeUI7SUFDN0UsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDaEQsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxNQUFNLGVBQWUsR0FDakIsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUNuRixTQUFTLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQy9CLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLE9BQU8sQ0FBQyxLQUFhO0lBQzVCLE9BQU8sQ0FBQyxRQUFzQixFQUFFLEtBQVksRUFBRSxnQkFBeUIsRUFBRSxFQUFFLENBQ2hFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDNUUsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILFNBQVMsb0JBQW9CLENBQ3pCLEtBQWEsRUFBRSxRQUFzQixFQUFFLEtBQVksRUFBRSxnQkFBeUI7SUFDaEYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDL0MsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRCxNQUFNLGVBQWUsR0FDakIsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUNuRixTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztJQUN0QyxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsUUFBc0IsRUFBRSxLQUFZLEVBQUUsT0FBcUI7SUFDN0QsTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFO1FBQzNCLFFBQVEsRUFBRSxDQUFDO1FBQ1gsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQztJQUNGLG1CQUFtQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNwQyxPQUFPLGVBQWUsQ0FBQztBQUN6QixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxlQUF1QjtJQUNyRCxtREFBbUQ7SUFDbkQsd0RBQXdEO0lBQ3hELE9BQU8sZUFBZSxHQUFHLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBRUQsMEZBQTBGO0FBQzFGLFNBQVMscUJBQXFCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDdkQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sU0FBUyxHQUFHLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0RCxTQUFTLElBQUksc0JBQXNCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRCxvREFBb0Q7QUFDcEQsU0FBUyxxQkFBcUIsQ0FDMUIsS0FBWSxFQUFFLGVBQXVCLEVBQUUsUUFBNEI7SUFDckUsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sU0FBUyxHQUFHLHNCQUFzQixDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzFELFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztBQUM5QixDQUFDO0FBRUQsb0dBQW9HO0FBQ3BHLFNBQVMscUJBQXFCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDdkQsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RELFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEQsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBdUIsQ0FBQztBQUNyRCxDQUFDO0FBRUQsd0RBQXdEO0FBQ3hELFNBQVMscUJBQXFCLENBQzFCLEtBQVksRUFBRSxlQUF1QixFQUFFLGdCQUFvQztJQUM3RSxNQUFNLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMxRCxTQUFTLElBQUksc0JBQXNCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3RELEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsZ0JBQWdCLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQzdCLFFBQXlCLEVBQUUsU0FBZ0IsRUFBRSxLQUFZO0lBQzNELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQixNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckQsUUFBUSxRQUFRLEVBQUU7UUFDaEIsS0FBSyxlQUFlLENBQUMsUUFBUTtZQUMzQixPQUFPLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNuQyxLQUFLLGVBQWUsQ0FBQyxPQUFPO1lBQzFCLE9BQU8sUUFBUSxDQUFDLGdCQUFnQixDQUFDO1FBQ25DLEtBQUssZUFBZSxDQUFDLEtBQUs7WUFDeEIsT0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDO1FBQ2pDLEtBQUssZUFBZSxDQUFDLFdBQVc7WUFDOUIsT0FBTyxRQUFRLENBQUMsb0JBQW9CLENBQUM7UUFDdkM7WUFDRSxTQUFTLElBQUksVUFBVSxDQUFDLGlDQUFpQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE9BQU8sSUFBSSxDQUFDO0tBQ2Y7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsUUFBeUIsRUFBRSxLQUFZLEVBQUUsVUFBc0I7SUFDakUsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXJDLDRFQUE0RTtJQUM1RSx1RUFBdUU7SUFDdkUsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDO1FBQUUsT0FBTztJQUVuQyxvRUFBb0U7SUFDcEUsU0FBUyxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUVuRCxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFekQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxRQUFRLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztJQUU3RSxNQUFNLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVFLDhFQUE4RTtJQUM5RSw4RUFBOEU7SUFDOUUsNEVBQTRFO0lBQzVFLHdCQUF3QjtJQUN4QixJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFFBQVEsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1FBQ3JFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUN2QyxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsTUFBTSxhQUFhLEdBQUcsY0FBYyxHQUFHLGFBQWEsQ0FBQztRQUNyRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBbUIsQ0FBQztRQUVuRSxpRUFBaUU7UUFDakUsOERBQThEO1FBQzlELE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztRQUVwQix5QkFBeUIsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakQsTUFBTSxjQUFjLEdBQUcsMEJBQTBCLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxLQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEYsTUFBTSxhQUFhLEdBQUcsNEJBQTRCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBQyxjQUFjLEVBQUMsQ0FBQyxDQUFDO1FBQzdGLG9CQUFvQixDQUNoQixVQUFVLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztLQUN0RjtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxRQUE0QixFQUFFLEtBQVk7SUFDM0UsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksdUJBQXVCLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEVBQUU7UUFDaEUsc0JBQXNCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3pDO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFFBQTRCLEVBQUUsS0FBWTtJQUMvRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7SUFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTNCLElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDdkUscUVBQXFFO1FBQ3JFLHdFQUF3RTtRQUN4RSw0RUFBNEU7UUFDNUUsT0FBTztLQUNSO0lBRUQsTUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFaEUsZ0RBQWdEO0lBQ2hELFFBQVEsQ0FBQyxZQUFZLEdBQUcsNkJBQTZCLENBQUMsV0FBVyxDQUFDO0lBRWxFLDBEQUEwRDtJQUMxRCxNQUFNLDBCQUEwQixHQUM1QixRQUFRLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxFQUFFLElBQUksRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBRTdFLE1BQU0sY0FBYyxHQUFHLDBCQUEwQixDQUFDLENBQUM7UUFDL0MsMEJBQTBCLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDckUsUUFBUSxDQUFDLG9CQUFvQixDQUFDO0lBRWxDLG9FQUFvRTtJQUNwRSxtRUFBbUU7SUFDbkUsNkNBQTZDO0lBQzdDLElBQUksQ0FBQyxjQUFjLEVBQUU7UUFDbkIsUUFBUSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNwRCxRQUFRLENBQUMsWUFBWSxHQUFHLDZCQUE2QixDQUFDLFFBQVEsQ0FBQztRQUNqRSxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU87S0FDUjtJQUVELG9FQUFvRTtJQUNwRSx1RUFBdUU7SUFDdkUscUJBQXFCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRTFDLGlEQUFpRDtJQUNqRCxRQUFRLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDNUUsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ25CLE1BQU0sYUFBYSxHQUFxQixFQUFFLENBQUM7UUFDM0MsTUFBTSxRQUFRLEdBQWdCLEVBQUUsQ0FBQztRQUVqQyxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtZQUM1QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssV0FBVyxFQUFFO2dCQUNqQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNoQyxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRixJQUFJLFlBQVksRUFBRTtvQkFDaEIsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDbEM7cUJBQU07b0JBQ0wsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN2QyxJQUFJLE9BQU8sRUFBRTt3QkFDWCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3FCQUN4QjtpQkFDRjthQUNGO2lCQUFNO2dCQUNMLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ2QsTUFBTTthQUNQO1NBQ0Y7UUFFRCx3REFBd0Q7UUFDeEQsUUFBUSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFFL0IsSUFBSSxNQUFNLEVBQUU7WUFDVixRQUFRLENBQUMsWUFBWSxHQUFHLDZCQUE2QixDQUFDLE1BQU0sQ0FBQztTQUM5RDthQUFNO1lBQ0wsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxRQUFRLENBQUM7WUFFL0QsNkVBQTZFO1lBQzdFLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsS0FBTSxDQUFDO1lBQ25ELElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzVCLGlCQUFpQixDQUFDLGlCQUFpQjtvQkFDL0IsaUJBQWlCLENBQW1CLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQzdGO1lBQ0QsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsaUJBQWlCLENBQUMsWUFBWTtvQkFDMUIsaUJBQWlCLENBQWMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzlFO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGlCQUFpQixDQUE0QixXQUFtQixFQUFFLE9BQVU7SUFDbkYsSUFBSSxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUM1QyxPQUFPLE9BQU8sQ0FBQztLQUNoQjtJQUVELE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNDLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFO1FBQ3pCLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDeEI7SUFFRCxzRUFBc0U7SUFDdEUsNkJBQTZCO0lBQzdCLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxLQUFLLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBTSxDQUFDO0FBQ3BHLENBQUM7QUFFRCxrRUFBa0U7QUFDbEUsU0FBUyxpQkFBaUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUNuRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUUxQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN4RSxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxvQ0FBb0MsQ0FDekMsUUFBNEIsRUFBRSxLQUFZLEVBQUUsVUFBc0I7SUFDcEUsU0FBUztRQUNMLGFBQWEsQ0FDVCxRQUFRLENBQUMsY0FBYyxFQUFFLHVEQUF1RCxDQUFDLENBQUM7SUFFMUYsUUFBUSxDQUFDLGNBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2pDLElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxRQUFRLEVBQUU7WUFDcEUsU0FBUyxJQUFJLGdDQUFnQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXhELHVEQUF1RDtZQUN2RCxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztTQUVwRTthQUFNLElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxNQUFNLEVBQUU7WUFDekUscUJBQXFCLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDakU7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCx1RUFBdUU7QUFDdkUsU0FBUyxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsUUFBNEI7SUFDdEUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixHQUFHLGFBQWEsQ0FBQztJQUNoRSxPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFtQixDQUFDO0FBQzFELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxpQkFBaUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUNuRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7SUFDbEMsU0FBUyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRTFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUM7UUFBRSxPQUFPO0lBRS9DLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCw2RUFBNkU7SUFDN0UsNEZBQTRGO0lBQzVGLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRWxFLFFBQVEsUUFBUSxDQUFDLFlBQVksRUFBRTtRQUM3QixLQUFLLDZCQUE2QixDQUFDLFdBQVc7WUFDNUMsc0JBQXNCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXhDLHNEQUFzRDtZQUN0RCxJQUFLLFFBQVEsQ0FBQyxZQUE4QztnQkFDeEQsNkJBQTZCLENBQUMsV0FBVyxFQUFFO2dCQUM3QyxvQ0FBb0MsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQ25FO1lBQ0QsTUFBTTtRQUNSLEtBQUssNkJBQTZCLENBQUMsV0FBVztZQUM1QyxvQ0FBb0MsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xFLE1BQU07UUFDUixLQUFLLDZCQUE2QixDQUFDLFFBQVE7WUFDekMsU0FBUyxJQUFJLGdDQUFnQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ25FLE1BQU07UUFDUixLQUFLLDZCQUE2QixDQUFDLE1BQU07WUFDdkMscUJBQXFCLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDaEUsTUFBTTtRQUNSO1lBQ0UsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsVUFBVSxDQUFDLDJCQUEyQixDQUFDLENBQUM7YUFDekM7S0FDSjtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxnQ0FBZ0MsQ0FBQyxRQUE0QjtJQUNwRSxXQUFXLENBQ1AsUUFBUSxDQUFDLFlBQVksRUFBRSw2QkFBNkIsQ0FBQyxRQUFRLEVBQzdELG1EQUFtRCxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQXNCRDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxNQUFNLGtDQUFrQyxHQUMzQyxJQUFJLGNBQWMsQ0FDZCxTQUFTLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUUvRDs7Ozs7R0FLRztBQUNILFNBQVMsb0JBQW9CLENBQUMsS0FBYztJQUMxQyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDO1FBQzlCLENBQUMsT0FBUSxLQUE0QixDQUFDLGdCQUFnQixLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQzNFLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUMzQixJQUFJLGNBQWMsQ0FBbUIsU0FBUyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFZaEY7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVksRUFBRSxXQUFnQztJQUMzRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM1RCxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUMxQixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsMEVBQTBFO1lBQzFFLCtFQUErRTtZQUMvRSx5QkFBeUI7WUFDekIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxLQUFLLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDWCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBVSxDQUFDO2dCQUNyQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JELElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ2xDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDO29CQUN2RCx1REFBdUQ7b0JBQ3ZELDZEQUE2RDtvQkFDN0QsU0FBUztpQkFDVjthQUNGO1lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDaEUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQzthQUNyRDtTQUNGO2FBQU0sSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDNUIsK0RBQStEO1lBQy9ELGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDdkM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUM1QixRQUFrQixFQUFFLFFBQTRCLEVBQUUsR0FBVyxFQUFFLFNBQXVCO0lBQ3hGLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2RSxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxRQUFrQixFQUFFLFFBQTRCO0lBQzdFLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBbUQsQ0FBQztJQTJDOUUsQ0FBQztJQXpDQyxHQUFHLENBQUMsUUFBNEIsRUFBRSxHQUFXLEVBQUUsUUFBc0I7UUFDbkUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDdEM7UUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNuQixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwQjtRQUNELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUM7UUFDbEMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsR0FBRyxDQUFDLFFBQTRCLEVBQUUsR0FBVztRQUMzQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELE9BQU8sQ0FBQyxRQUE0QjtRQUNsQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxJQUFJLEtBQUssRUFBRTtZQUNULEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDNUMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7b0JBQ2hDLFFBQVEsRUFBRSxDQUFDO2lCQUNaO2FBQ0Y7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5QjtJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsS0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3JCO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsd0JBQXdCO1FBQy9CLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLHdCQUF3QixFQUFFO0tBQzlDLENBQUMsQUFKVSxDQUlUOztBQUdMOzs7Ozs7R0FNRztBQUNILE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxFQUFFLENBQzlCLE9BQU8sbUJBQW1CLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQ2xGLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxFQUFFLENBQzdCLE9BQU8sbUJBQW1CLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBRW5GOzs7O0dBSUc7QUFDSCxNQUFNLGVBQWU7SUFBckI7UUFDRSx5REFBeUQ7UUFDekQsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBRTNCLHdDQUF3QztRQUN4QyxXQUFNLEdBQWdCLElBQUksQ0FBQztRQUUzQix1Q0FBdUM7UUFDdkMsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFnQixDQUFDO1FBRWxDLHNFQUFzRTtRQUN0RSwwREFBMEQ7UUFDMUQsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFnQixDQUFDO1FBRW5DLFdBQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFeEIsd0JBQW1CLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUQsdUJBQWtCLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUE0RDlELENBQUM7SUExREMsR0FBRyxDQUFDLFFBQXNCO1FBQ3hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN0RSxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLEVBQUU7WUFDeEIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLFFBQXNCO1FBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFTyxvQkFBb0I7UUFDMUIsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFFbkIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztZQUUvQixLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ25DLFFBQVEsRUFBRSxDQUFDO2FBQ1o7WUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRXJCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFFaEMsd0RBQXdEO1lBQ3hELHlEQUF5RDtZQUN6RCx1QkFBdUI7WUFDdkIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUU7Z0JBQzFCLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQzVCO2dCQUNELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2FBQzdCO1FBQ0gsQ0FBQyxDQUFDO1FBQ0Ysb0RBQW9EO1FBQ3BELGlFQUFpRTtRQUNqRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBVyxDQUFDO0lBQ3BGLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtZQUN4QixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3BCO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSxlQUFlO1FBQ3RCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLGVBQWUsRUFBRTtLQUNyQyxDQUFDLEFBSlUsQ0FJVDs7QUFHTDs7OztHQUlHO0FBQ0gsTUFBTSxjQUFjO0lBQXBCO1FBQ0UseURBQXlEO1FBQ3pELHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUUzQix1Q0FBdUM7UUFDdkMsY0FBUyxHQUFnQixJQUFJLENBQUM7UUFFOUIsNkNBQTZDO1FBQzdDLGtCQUFhLEdBQWdCLElBQUksQ0FBQztRQUVsQyxtQ0FBbUM7UUFDbkMsbUVBQW1FO1FBQ25FLGdFQUFnRTtRQUNoRSxnRUFBZ0U7UUFDaEUsc0RBQXNEO1FBQ3RELFlBQU8sR0FBK0IsRUFBRSxDQUFDO1FBRXpDLHVFQUF1RTtRQUN2RSxpRUFBaUU7UUFDakUsc0VBQXNFO1FBQ3RFLHNDQUFzQztRQUN0QyxhQUFRLEdBQStCLEVBQUUsQ0FBQztJQThJNUMsQ0FBQztJQTVJQyxHQUFHLENBQUMsS0FBYSxFQUFFLFFBQXNCO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN0RSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQsTUFBTSxDQUFDLFFBQXNCO1FBQzNCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRSxJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUN4Qiw4Q0FBOEM7WUFDOUMsb0RBQW9EO1lBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMvQztJQUNILENBQUM7SUFFTyxVQUFVLENBQUMsTUFBa0MsRUFBRSxRQUFnQixFQUFFLFFBQXNCO1FBQzdGLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN6QyxNQUFNLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQVcsQ0FBQztZQUNuRCxJQUFJLHNCQUFzQixHQUFHLFFBQVEsRUFBRTtnQkFDckMsZ0RBQWdEO2dCQUNoRCxzREFBc0Q7Z0JBQ3RELG1EQUFtRDtnQkFDbkQsOEJBQThCO2dCQUM5QixhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixNQUFNO2FBQ1A7U0FDRjtRQUNELFlBQVksQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRU8sZUFBZSxDQUFDLE1BQWtDLEVBQUUsUUFBc0I7UUFDaEYsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3pDLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxjQUFjLEtBQUssUUFBUSxFQUFFO2dCQUMvQixLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNWLE1BQU07YUFDUDtTQUNGO1FBQ0QsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDZCwwQ0FBMEM7WUFDMUMsK0NBQStDO1lBQy9DLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU8sYUFBYTtRQUNuQixNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDcEIsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFVLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUV0QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBRS9CLDhDQUE4QztZQUM5QywyQkFBMkI7WUFDM0IsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLElBQUksaUJBQWlCLEdBQWdCLElBQUksQ0FBQztZQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVcsQ0FBQztnQkFDM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFpQixDQUFDO2dCQUNyRCxJQUFJLFFBQVEsSUFBSSxHQUFHLEVBQUU7b0JBQ25CLFFBQVEsRUFBRSxDQUFDO29CQUNYLDJEQUEyRDtvQkFDM0QsdUJBQXVCO29CQUN2QixpQkFBaUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUMzQjtxQkFBTTtvQkFDTCx3REFBd0Q7b0JBQ3hELE1BQU07aUJBQ1A7YUFDRjtZQUNELElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO2dCQUM5QixnRUFBZ0U7Z0JBQ2hFLCtEQUErRDtnQkFDL0Qsa0JBQWtCO2dCQUNsQixXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDckQ7WUFFRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1lBRWhDLHdEQUF3RDtZQUN4RCx3REFBd0Q7WUFDeEQsU0FBUztZQUNULElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDaEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQVcsQ0FBQztvQkFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFpQixDQUFDO29CQUN0RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUNuRDtnQkFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7YUFDMUI7WUFDRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDO1FBRUYsbURBQW1EO1FBQ25ELG9EQUFvRDtRQUNwRCxxREFBcUQ7UUFDckQsb0JBQW9CO1FBQ3BCLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDLENBQUUsaUJBQWlCO1FBRWhELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN2QixxREFBcUQ7WUFDckQsaUNBQWlDO1lBQ2pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFXLENBQUM7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTO2dCQUNmLDJEQUEyRDtnQkFDM0QsNkRBQTZEO2dCQUM3RCxrQkFBa0I7Z0JBQ2xCLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxHQUFHLGlCQUFpQixDQUFDLENBQUMsRUFBRTtnQkFDL0UsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtvQkFDM0IsOERBQThEO29CQUM5RCw4REFBOEQ7b0JBQzlELCtDQUErQztvQkFDL0MsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7aUJBQ3ZCO2dCQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBc0IsQ0FBQzthQUNyRTtTQUNGO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQzNCLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDdkI7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSxjQUFjO1FBQ3JCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLGNBQWMsRUFBRTtLQUNwQyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7cG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXJ9IGZyb20gJy4uLy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHthcnJheUluc2VydDIsIGFycmF5U3BsaWNlfSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RWxlbWVudCwgYXNzZXJ0RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi8uLi96b25lJztcbmltcG9ydCB7YWZ0ZXJSZW5kZXJ9IGZyb20gJy4uL2FmdGVyX3JlbmRlcl9ob29rcyc7XG5pbXBvcnQge2Fzc2VydEluZGV4SW5EZWNsUmFuZ2UsIGFzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRUTm9kZUZvckxWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrQmVoYXZpb3IsIERlZmVyQmxvY2tDb25maWcsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGUsIERlZmVyQmxvY2tUcmlnZ2VycywgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUsIERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnLCBEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWcsIERlcGVuZGVuY3lSZXNvbHZlckZuLCBMRGVmZXJCbG9ja0RldGFpbHMsIFREZWZlckJsb2NrRGV0YWlsc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZlcic7XG5pbXBvcnQge0RlcGVuZGVuY3lEZWYsIERpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGVzdHJveWVkLCBpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRUTm9kZSwgZ2V0VFZpZXcsIG5leHRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldENvbnN0YW50LCBnZXROYXRpdmVCeUluZGV4LCBnZXRUTm9kZSwgcmVtb3ZlTFZpZXdPbkRlc3Ryb3ksIHN0b3JlTFZpZXdPbkRlc3Ryb3ksIHdhbGtVcFZpZXdzfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldywgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi92aWV3X21hbmlwdWxhdGlvbic7XG5cbmltcG9ydCB7b25Ib3Zlciwgb25JbnRlcmFjdGlvbiwgb25WaWV3cG9ydH0gZnJvbSAnLi9kZWZlcl9ldmVudHMnO1xuaW1wb3J0IHvJtcm1dGVtcGxhdGV9IGZyb20gJy4vdGVtcGxhdGUnO1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBkZWZlciBibG9ja3Mgc2hvdWxkIGJlIHRyaWdnZXJlZC5cbiAqXG4gKiBDdXJyZW50bHksIGRlZmVyIGJsb2NrcyBhcmUgbm90IHRyaWdnZXJlZCBvbiB0aGUgc2VydmVyLFxuICogb25seSBwbGFjZWhvbGRlciBjb250ZW50IGlzIHJlbmRlcmVkIChpZiBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yOiBJbmplY3Rvcik6IGJvb2xlYW4ge1xuICBjb25zdCBjb25maWcgPSBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfQ09ORklHLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgaWYgKGNvbmZpZz8uYmVoYXZpb3IgPT09IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciBkZWZlciBibG9ja3MuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBgZGVmZXJgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIHByaW1hcnlUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHByaW1hcnkgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmN5UmVzb2x2ZXJGbiBGdW5jdGlvbiB0aGF0IGNvbnRhaW5zIGRlcGVuZGVuY2llcyBmb3IgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsb2FkaW5nVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBsb2FkaW5nIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHBsYWNlaG9sZGVyIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZXJyb3JUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGVycm9yIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gbG9hZGluZ0NvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGxvYWRpbmcuXG4gKiAgICAgYmxvY2suXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJDb25maWdJbmRleCBJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZVxuICogICAgIHBsYWNlaG9sZGVyIGJsb2NrLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXIoXG4gICAgaW5kZXg6IG51bWJlciwgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLCBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwsXG4gICAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlcnxudWxsLCBwbGFjZWhvbGRlclRtcGxJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVycm9yVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY29uc3QgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzID0ge1xuICAgICAgcHJpbWFyeVRtcGxJbmRleCxcbiAgICAgIGxvYWRpbmdUbXBsSW5kZXg6IGxvYWRpbmdUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyVG1wbEluZGV4OiBwbGFjZWhvbGRlclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgZXJyb3JUbXBsSW5kZXg6IGVycm9yVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlckJsb2NrQ29uZmlnOiBwbGFjZWhvbGRlckNvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgbG9hZGluZ0Jsb2NrQ29uZmlnOiBsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBsb2FkaW5nQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgZGVwZW5kZW5jeVJlc29sdmVyRm46IGRlcGVuZGVuY3lSZXNvbHZlckZuID8/IG51bGwsXG4gICAgICBsb2FkaW5nU3RhdGU6IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVELFxuICAgICAgbG9hZGluZ1Byb21pc2U6IG51bGwsXG4gICAgfTtcblxuICAgIHNldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgYWRqdXN0ZWRJbmRleCwgZGVmZXJCbG9ja0NvbmZpZyk7XG4gIH1cblxuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdO1xuXG4gIC8vIElmIGh5ZHJhdGlvbiBpcyBlbmFibGVkLCBsb29rcyB1cCBkZWh5ZHJhdGVkIHZpZXdzIGluIHRoZSBET01cbiAgLy8gdXNpbmcgaHlkcmF0aW9uIGFubm90YXRpb24gaW5mbyBhbmQgc3RvcmVzIHRob3NlIHZpZXdzIG9uIExDb250YWluZXIuXG4gIC8vIEluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgZnVuY3Rpb24gaXMgYSBub29wLlxuICBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcihsQ29udGFpbmVyLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIEluaXQgaW5zdGFuY2Utc3BlY2lmaWMgZGVmZXIgZGV0YWlscyBhbmQgc3RvcmUgaXQuXG4gIGNvbnN0IGxEZXRhaWxzID0gW107XG4gIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWw7XG4gIHNldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgYWRqdXN0ZWRJbmRleCwgbERldGFpbHMgYXMgTERlZmVyQmxvY2tEZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgd2hlbiBhIHRyaWdnZXIgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlICYmIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwpIHtcbiAgICAgIC8vIElmIG5vdGhpbmcgaXMgcmVuZGVyZWQgeWV0LCByZW5kZXIgYSBwbGFjZWhvbGRlciAoaWYgZGVmaW5lZCkuXG4gICAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHZhbHVlID09PSB0cnVlICYmXG4gICAgICAgIChyZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsIHx8XG4gICAgICAgICByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKSB7XG4gICAgICAvLyBUaGUgYHdoZW5gIGNvbmRpdGlvbiBoYXMgY2hhbmdlZCB0byBgdHJ1ZWAsIHRyaWdnZXIgZGVmZXIgYmxvY2sgbG9hZGluZ1xuICAgICAgLy8gaWYgdGhlIGJsb2NrIGlzIGVpdGhlciBpbiBpbml0aWFsIChub3RoaW5nIGlzIHJlbmRlcmVkKSBvciBhIHBsYWNlaG9sZGVyXG4gICAgICAvLyBzdGF0ZS5cbiAgICAgIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJlZmV0Y2hlcyB0aGUgZGVmZXJyZWQgY29udGVudCB3aGVuIGEgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSAmJiB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRUcmlnZ2VyKG9uSWRsZSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBwcmVmZXRjaCBvbiBpZGxlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhvbklkbGUsIERlZmVyQmxvY2tUcmlnZ2Vycy5PbklkbGUpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBSZW5kZXIgcGxhY2Vob2xkZXIgYmxvY2sgb25seSBpZiBsb2FkaW5nIHRlbXBsYXRlIGlzIG5vdCBwcmVzZW50XG4gIC8vIHRvIGF2b2lkIGNvbnRlbnQgZmxpY2tlcmluZywgc2luY2UgaXQgd291bGQgYmUgaW1tZWRpYXRlbHkgcmVwbGFjZWRcbiAgLy8gYnkgdGhlIGxvYWRpbmcgYmxvY2suXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nVG1wbEluZGV4ID09PSBudWxsKSB7XG4gICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgfVxuICB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpO1xufVxuXG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBwcmVmZXRjaCBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkltbWVkaWF0ZSgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIGxvYWRpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25UaW1lcihkZWxheTogbnVtYmVyKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcob25UaW1lcihkZWxheSksIERlZmVyQmxvY2tUcmlnZ2Vycy5PblRpbWVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25Ib3ZlciwgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbnRlcmFjdGlvbih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25WaWV3cG9ydCxcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKioqKioqKioqIEhlbHBlciBmdW5jdGlvbnMgKioqKioqKioqKi9cblxuLyoqXG4gKiBTY2hlZHVsZXMgdHJpZ2dlcmluZyBvZiBhIGRlZmVyIGJsb2NrIGZvciBgb24gaWRsZWAgYW5kIGBvbiB0aW1lcmAgY29uZGl0aW9ucy5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVEZWxheWVkVHJpZ2dlcihcbiAgICBzY2hlZHVsZUZuOiAoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3LCB3aXRoTFZpZXdDbGVhbnVwOiBib29sZWFuKSA9PiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICBzY2hlZHVsZUZuKCgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksIGxWaWV3LCB0cnVlIC8qIHdpdGhMVmlld0NsZWFudXAgKi8pO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBwcmVmZXRjaGluZyBmb3IgYG9uIGlkbGVgIGFuZCBgb24gdGltZXJgIHRyaWdnZXJzLlxuICpcbiAqIEBwYXJhbSBzY2hlZHVsZUZuIEEgZnVuY3Rpb24gdGhhdCBkb2VzIHRoZSBzY2hlZHVsaW5nLlxuICogQHBhcmFtIHRyaWdnZXIgQSB0cmlnZ2VyIHRoYXQgaW5pdGlhdGVkIHNjaGVkdWxpbmcuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVsYXllZFByZWZldGNoaW5nKFxuICAgIHNjaGVkdWxlRm46IChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pID0+IFZvaWRGdW5jdGlvbixcbiAgICB0cmlnZ2VyOiBEZWZlckJsb2NrVHJpZ2dlcnMpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBQcmV2ZW50IHNjaGVkdWxpbmcgbW9yZSB0aGFuIG9uZSBwcmVmZXRjaCBpbml0IGNhbGxcbiAgICAvLyBmb3IgZWFjaCBkZWZlciBibG9jay4gRm9yIHRoaXMgcmVhc29uIHdlIHVzZSBvbmx5IGEgdHJpZ2dlclxuICAgIC8vIGlkZW50aWZpZXIgaW4gYSBrZXksIHNvIGFsbCBpbnN0YW5jZXMgd291bGQgdXNlIHRoZSBzYW1lIGtleS5cbiAgICBjb25zdCBrZXkgPSBTdHJpbmcodHJpZ2dlcik7XG4gICAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICAgIGNvbnN0IG1hbmFnZXIgPSBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKTtcbiAgICBpZiAoIW1hbmFnZXIuaGFzKHREZXRhaWxzLCBrZXkpKSB7XG4gICAgICAvLyBJbiBjYXNlIG9mIHByZWZldGNoaW5nLCB3ZSBpbnRlbnRpb25hbGx5IGF2b2lkIGNhbmNlbGxpbmcgcmVzb3VyY2UgbG9hZGluZyBpZlxuICAgICAgLy8gYW4gdW5kZXJseWluZyBMVmlldyBnZXQgZGVzdHJveWVkICh0aHVzIHBhc3NpbmcgYG51bGxgIGFzIGEgc2Vjb25kIGFyZ3VtZW50KSxcbiAgICAgIC8vIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgTFZpZXdzICh0aGF0IHJlcHJlc2VudCBlbWJlZGRlZCB2aWV3cykgdGhhdFxuICAgICAgLy8gZGVwZW5kIG9uIHJlc291cmNlIGxvYWRpbmcuXG4gICAgICBjb25zdCBwcmVmZXRjaCA9ICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpO1xuICAgICAgY29uc3QgY2xlYW51cEZuID0gc2NoZWR1bGVGbihwcmVmZXRjaCwgbFZpZXcsIGZhbHNlIC8qIHdpdGhMVmlld0NsZWFudXAgKi8pO1xuICAgICAgcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoaW5qZWN0b3IsIHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgTFZpZXcgaW4gd2hpY2ggYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRIb3N0TFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVycmVkIGJsb2NrIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRUTm9kZSBUTm9kZSBkZWZpbmluZyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyJ3Mgdmlldy5cbiAqICAgQSBuZWdhdGl2ZSB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgYmxvY2sncyBwbGFjZWhvbGRlciwgd2hpbGUgYW4gdW5kZWZpbmVkXG4gKiAgIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgTFZpZXcgYXMgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5mdW5jdGlvbiBnZXRUcmlnZ2VyTFZpZXcoXG4gICAgZGVmZXJyZWRIb3N0TFZpZXc6IExWaWV3LCBkZWZlcnJlZFROb2RlOiBUTm9kZSwgd2Fsa1VwVGltZXM6IG51bWJlcnx1bmRlZmluZWQpOiBMVmlld3xudWxsIHtcbiAgLy8gVGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgdmlldywgd2UgZG9uJ3QgbmVlZCB0byB0cmF2ZXJzZS5cbiAgaWYgKHdhbGtVcFRpbWVzID09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmZXJyZWRIb3N0TFZpZXc7XG4gIH1cblxuICAvLyBBIHBvc2l0aXZlIHZhbHVlIG9yIHplcm8gbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiBhIHBhcmVudCB2aWV3LlxuICBpZiAod2Fsa1VwVGltZXMgPj0gMCkge1xuICAgIHJldHVybiB3YWxrVXBWaWV3cyh3YWxrVXBUaW1lcywgZGVmZXJyZWRIb3N0TFZpZXcpO1xuICB9XG5cbiAgLy8gSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlLCBpdCBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgcGxhY2Vob2xkZXIuXG4gIGNvbnN0IGRlZmVycmVkQ29udGFpbmVyID0gZGVmZXJyZWRIb3N0TFZpZXdbZGVmZXJyZWRUTm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlZmVycmVkQ29udGFpbmVyKTtcbiAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZGVmZXJyZWRDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdID8/IG51bGw7XG5cbiAgLy8gV2UgbmVlZCB0byBudWxsIGNoZWNrLCBiZWNhdXNlIHRoZSBwbGFjZWhvbGRlciBtaWdodCBub3QgaGF2ZSBiZWVuIHJlbmRlcmVkIHlldC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB0cmlnZ2VyTFZpZXcgIT09IG51bGwpIHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhkZWZlcnJlZEhvc3RMVmlldywgZGVmZXJyZWRUTm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgcmVuZGVyZWRTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLFxuICAgICAgICAnRXhwZWN0ZWQgYSBwbGFjZWhvbGRlciB0byBiZSByZW5kZXJlZCBpbiB0aGlzIGRlZmVyIGJsb2NrLicpO1xuICAgIGFzc2VydExWaWV3KHRyaWdnZXJMVmlldyk7XG4gIH1cblxuICByZXR1cm4gdHJpZ2dlckxWaWV3O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGVsZW1lbnQgdGhhdCBhIGRlZmVycmVkIGJsb2NrJ3MgdHJpZ2dlciBpcyBwb2ludGluZyB0by5cbiAqIEBwYXJhbSB0cmlnZ2VyTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIHRyaWdnZXIgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIHRyaWdnZXIgZWxlbWVudCBzaG91bGQndmUgYmVlbiByZW5kZXJlZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VHJpZ2dlckVsZW1lbnQodHJpZ2dlckxWaWV3OiBMVmlldywgdHJpZ2dlckluZGV4OiBudW1iZXIpOiBFbGVtZW50IHtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoSEVBREVSX09GRlNFVCArIHRyaWdnZXJJbmRleCwgdHJpZ2dlckxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVsZW1lbnQoZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50IGFzIEVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgRE9NLW5vZGUgYmFzZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBpbml0aWFsTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVyIGJsb2NrIGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHJlcHJlc2VudGluZyB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAvZG93biBpbiB0aGUgdmlldyBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSByZWdpc3RlckZuIEZ1bmN0aW9uIHRoYXQgd2lsbCByZWdpc3RlciB0aGUgRE9NIGV2ZW50cy5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgcmVjZWl2ZXMgdGhlIGV2ZW50IHRoYXQgc2hvdWxkIHJlbmRlclxuICogICAgIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgIGluaXRpYWxMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgdHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgIHJlZ2lzdGVyRm46IChlbGVtZW50OiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IFZvaWRGdW5jdGlvbixcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGluamVjdG9yID0gaW5pdGlhbExWaWV3W0lOSkVDVE9SXSE7XG5cbiAgLy8gQXNzdW1wdGlvbjogdGhlIGBhZnRlclJlbmRlcmAgcmVmZXJlbmNlIHNob3VsZCBiZSBkZXN0cm95ZWRcbiAgLy8gYXV0b21hdGljYWxseSBzbyB3ZSBkb24ndCBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgaXQuXG4gIGNvbnN0IGFmdGVyUmVuZGVyUmVmID0gYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGluaXRpYWxMVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG5cbiAgICAvLyBJZiB0aGUgYmxvY2sgd2FzIGxvYWRlZCBiZWZvcmUgdGhlIHRyaWdnZXIgd2FzIHJlc29sdmVkLCB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nLlxuICAgIGlmIChyZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsICYmXG4gICAgICAgIHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaWdnZXJMVmlldyA9IGdldFRyaWdnZXJMVmlldyhpbml0aWFsTFZpZXcsIHROb2RlLCB3YWxrVXBUaW1lcyk7XG5cbiAgICAvLyBLZWVwIHBvbGxpbmcgdW50aWwgd2UgcmVzb2x2ZSB0aGUgdHJpZ2dlcidzIExWaWV3LlxuICAgIC8vIGBhZnRlclJlbmRlcmAgc2hvdWxkIHN0b3AgYXV0b21hdGljYWxseSBpZiB0aGUgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAgaWYgKCF0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHRyaWdnZXIncyB2aWV3IHdhcyBkZXN0cm95ZWQgYmVmb3JlIHdlIHJlc29sdmVkIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gICAgaWYgKHRyaWdnZXJMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGFkZCBpbnRlZ3JhdGlvbiB3aXRoIGBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXJgLlxuICAgIGNvbnN0IGVsZW1lbnQgPSBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXcsIHRyaWdnZXJJbmRleCk7XG4gICAgY29uc3QgY2xlYW51cCA9IHJlZ2lzdGVyRm4oZWxlbWVudCwgKCkgPT4ge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG4gICAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICAgIH1cbiAgICAgIGNsZWFudXAoKTtcbiAgICB9LCBpbmplY3Rvcik7XG5cbiAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgc3RvcmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuXG4gICAgLy8gU2luY2UgdGhlIHRyaWdnZXIgYW5kIGRlZmVycmVkIGJsb2NrIG1pZ2h0IGJlIGluIGRpZmZlcmVudFxuICAgIC8vIHZpZXdzLCB3ZSBoYXZlIHRvIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayBpbiBib3RoIGxvY2F0aW9ucy5cbiAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICB9XG4gIH0sIHtpbmplY3Rvcn0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBzY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IHRoYXQgaG9zdHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB3aXRoTFZpZXdDbGVhbnVwIEEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGEgc2NoZWR1bGVkIGNhbGxiYWNrXG4gKiAgICAgICAgICAgc2hvdWxkIGJlIGNhbmNlbGxlZCBpbiBjYXNlIGFuIExWaWV3IGlzIGRlc3Ryb3llZCBiZWZvcmUgYSBjYWxsYmFja1xuICogICAgICAgICAgIHdhcyBpbnZva2VkLlxuICovXG5mdW5jdGlvbiBvbklkbGUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3LCB3aXRoTFZpZXdDbGVhbnVwOiBib29sZWFuKSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3Qgc2NoZWR1bGVyID0gaW5qZWN0b3IuZ2V0KE9uSWRsZVNjaGVkdWxlcik7XG4gIGNvbnN0IGNsZWFudXBGbiA9ICgpID0+IHNjaGVkdWxlci5yZW1vdmUoY2FsbGJhY2spO1xuICBjb25zdCB3cmFwcGVkQ2FsbGJhY2sgPVxuICAgICAgd2l0aExWaWV3Q2xlYW51cCA/IHdyYXBXaXRoTFZpZXdDbGVhbnVwKGNhbGxiYWNrLCBsVmlldywgY2xlYW51cEZuKSA6IGNhbGxiYWNrO1xuICBzY2hlZHVsZXIuYWRkKHdyYXBwZWRDYWxsYmFjayk7XG4gIHJldHVybiBjbGVhbnVwRm47XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgY2FwdHVyZXMgYSBwcm92aWRlZCBkZWxheS5cbiAqIEludm9raW5nIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBzY2hlZHVsZXMgYSB0cmlnZ2VyLlxuICovXG5mdW5jdGlvbiBvblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgcmV0dXJuIChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pID0+XG4gICAgICAgICAgICAgc2NoZWR1bGVUaW1lclRyaWdnZXIoZGVsYXksIGNhbGxiYWNrLCBsVmlldywgd2l0aExWaWV3Q2xlYW51cCk7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBhZnRlciBhIGdpdmVuIHRpbWVvdXQuXG4gKlxuICogQHBhcmFtIGRlbGF5IEEgbnVtYmVyIG9mIG1zIHRvIHdhaXQgdW50aWwgZmlyaW5nIGEgY2FsbGJhY2suXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIGEgdGltZW91dC5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyB0aGF0IGhvc3RzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gd2l0aExWaWV3Q2xlYW51cCBBIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHNjaGVkdWxlZCBjYWxsYmFja1xuICogICAgICAgICAgIHNob3VsZCBiZSBjYW5jZWxsZWQgaW4gY2FzZSBhbiBMVmlldyBpcyBkZXN0cm95ZWQgYmVmb3JlIGEgY2FsbGJhY2tcbiAqICAgICAgICAgICB3YXMgaW52b2tlZC5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVUaW1lclRyaWdnZXIoXG4gICAgZGVsYXk6IG51bWJlciwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3LCB3aXRoTFZpZXdDbGVhbnVwOiBib29sZWFuKSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3Qgc2NoZWR1bGVyID0gaW5qZWN0b3IuZ2V0KFRpbWVyU2NoZWR1bGVyKTtcbiAgY29uc3QgY2xlYW51cEZuID0gKCkgPT4gc2NoZWR1bGVyLnJlbW92ZShjYWxsYmFjayk7XG4gIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9XG4gICAgICB3aXRoTFZpZXdDbGVhbnVwID8gd3JhcFdpdGhMVmlld0NsZWFudXAoY2FsbGJhY2ssIGxWaWV3LCBjbGVhbnVwRm4pIDogY2FsbGJhY2s7XG4gIHNjaGVkdWxlci5hZGQoZGVsYXksIHdyYXBwZWRDYWxsYmFjayk7XG4gIHJldHVybiBjbGVhbnVwRm47XG59XG5cbi8qKlxuICogV3JhcHMgYSBnaXZlbiBjYWxsYmFjayBpbnRvIGEgbG9naWMgdGhhdCByZWdpc3RlcnMgYSBjbGVhbnVwIGZ1bmN0aW9uXG4gKiBpbiB0aGUgTFZpZXcgY2xlYW51cCBzbG90LCB0byBiZSBpbnZva2VkIHdoZW4gYW4gTFZpZXcgaXMgZGVzdHJveWVkLlxuICovXG5mdW5jdGlvbiB3cmFwV2l0aExWaWV3Q2xlYW51cChcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIGNsZWFudXA6IFZvaWRGdW5jdGlvbik6IFZvaWRGdW5jdGlvbiB7XG4gIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9ICgpID0+IHtcbiAgICBjYWxsYmFjaygpO1xuICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwKTtcbiAgfTtcbiAgc3RvcmVMVmlld09uRGVzdHJveShsVmlldywgY2xlYW51cCk7XG4gIHJldHVybiB3cmFwcGVkQ2FsbGJhY2s7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBhIGRhdGEgc2xvdCBpbmRleCBmb3IgZGVmZXIgYmxvY2sgaW5mbyAoZWl0aGVyIHN0YXRpYyBvclxuICogaW5zdGFuY2Utc3BlY2lmaWMpLCBnaXZlbiBhbiBpbmRleCBvZiBhIGRlZmVyIGluc3RydWN0aW9uLlxuICovXG5mdW5jdGlvbiBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleDogbnVtYmVyKSB7XG4gIC8vIEluc3RhbmNlIHN0YXRlIGlzIGxvY2F0ZWQgYXQgdGhlICpuZXh0KiBwb3NpdGlvblxuICAvLyBhZnRlciB0aGUgZGVmZXIgYmxvY2sgc2xvdCBpbiBhbiBMVmlldyBvciBUVmlldy5kYXRhLlxuICByZXR1cm4gZGVmZXJCbG9ja0luZGV4ICsgMTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIGRlZmVyIGJsb2NrIHN0YXRlIGZyb20gYW4gTFZpZXcsIGdpdmVuIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmxvY2suICovXG5mdW5jdGlvbiBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBMRGVmZXJCbG9ja0RldGFpbHMge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleCh0Tm9kZS5pbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbc2xvdEluZGV4XTtcbn1cblxuLyoqIFN0b3JlcyBhIGRlZmVyIGJsb2NrIGluc3RhbmNlIHN0YXRlIGluIExWaWV3LiAqL1xuZnVuY3Rpb24gc2V0TERlZmVyQmxvY2tEZXRhaWxzKFxuICAgIGxWaWV3OiBMVmlldywgZGVmZXJCbG9ja0luZGV4OiBudW1iZXIsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIGxWaWV3W3Nsb3RJbmRleF0gPSBsRGV0YWlscztcbn1cblxuLyoqIFJldHJpZXZlcyBzdGF0aWMgaW5mbyBhYm91dCBhIGRlZmVyIGJsb2NrLCBnaXZlbiBhIFRWaWV3IGFuZCBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogVERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleCh0Tm9kZS5pbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICByZXR1cm4gdFZpZXcuZGF0YVtzbG90SW5kZXhdIGFzIFREZWZlckJsb2NrRGV0YWlscztcbn1cblxuLyoqIFN0b3JlcyBhIGRlZmVyIGJsb2NrIHN0YXRpYyBpbmZvIGluIGBUVmlldy5kYXRhYC4gKi9cbmZ1bmN0aW9uIHNldFREZWZlckJsb2NrRGV0YWlscyhcbiAgICB0VmlldzogVFZpZXcsIGRlZmVyQmxvY2tJbmRleDogbnVtYmVyLCBkZWZlckJsb2NrQ29uZmlnOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgdFZpZXcuZGF0YVtzbG90SW5kZXhdID0gZGVmZXJCbG9ja0NvbmZpZztcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGhvc3RMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIHN3aXRjaCAobmV3U3RhdGUpIHtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZTpcbiAgICAgIHJldHVybiB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmc6XG4gICAgICByZXR1cm4gdERldGFpbHMubG9hZGluZ1RtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5FcnJvcjpcbiAgICAgIHJldHVybiB0RGV0YWlscy5lcnJvclRtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcjpcbiAgICAgIHJldHVybiB0RGV0YWlscy5wbGFjZWhvbGRlclRtcGxJbmRleDtcbiAgICBkZWZhdWx0OlxuICAgICAgbmdEZXZNb2RlICYmIHRocm93RXJyb3IoYFVuZXhwZWN0ZWQgZGVmZXIgYmxvY2sgc3RhdGU6ICR7bmV3U3RhdGV9YCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFRyYW5zaXRpb25zIGEgZGVmZXIgYmxvY2sgdG8gdGhlIG5ldyBzdGF0ZS4gVXBkYXRlcyB0aGUgIG5lY2Vzc2FyeVxuICogZGF0YSBzdHJ1Y3R1cmVzIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgYmxvY2suXG4gKlxuICogQHBhcmFtIG5ld1N0YXRlIE5ldyBzdGF0ZSB0aGF0IHNob3VsZCBiZSBhcHBsaWVkIHRvIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsQ29udGFpbmVyIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShcbiAgICBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpOiB2b2lkIHtcbiAgY29uc3QgaG9zdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuXG4gIC8vIENoZWNrIGlmIHRoaXMgdmlldyBpcyBub3QgZGVzdHJveWVkLiBTaW5jZSB0aGUgbG9hZGluZyBwcm9jZXNzIHdhcyBhc3luYyxcbiAgLy8gdGhlIHZpZXcgbWlnaHQgZW5kIHVwIGJlaW5nIGRlc3Ryb3llZCBieSB0aGUgdGltZSByZW5kZXJpbmcgaGFwcGVucy5cbiAgaWYgKGlzRGVzdHJveWVkKGhvc3RMVmlldykpIHJldHVybjtcblxuICAvLyBNYWtlIHN1cmUgdGhpcyBUTm9kZSBiZWxvbmdzIHRvIFRWaWV3IHRoYXQgcmVwcmVzZW50cyBob3N0IExWaWV3LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgaG9zdExWaWV3KTtcblxuICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhob3N0TFZpZXcsIHROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsRGV0YWlscywgJ0V4cGVjdGVkIGEgZGVmZXIgYmxvY2sgc3RhdGUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IHN0YXRlVG1wbEluZGV4ID0gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKG5ld1N0YXRlLCBob3N0TFZpZXcsIHROb2RlKTtcbiAgLy8gTm90ZTogd2UgdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZSBpZiB0aGUgcHJldmlvdXMgc3RhdGUgd2FzIHJlcHJlc2VudGVkXG4gIC8vIHdpdGggYSBudW1iZXIgdGhhdCBpcyBsZXNzIHRoYW4gdGhlIG5leHQgc3RhdGUuIEZvciBleGFtcGxlLCBpZiB0aGUgY3VycmVudFxuICAvLyBzdGF0ZSBpcyBcImxvYWRpbmdcIiAocmVwcmVzZW50ZWQgYXMgYDJgKSwgd2Ugc2hvdWxkIG5vdCBzaG93IGEgcGxhY2Vob2xkZXJcbiAgLy8gKHJlcHJlc2VudGVkIGFzIGAxYCkuXG4gIGlmIChsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPCBuZXdTdGF0ZSAmJiBzdGF0ZVRtcGxJbmRleCAhPT0gbnVsbCkge1xuICAgIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IHN0YXRlVG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGhvc3RUVmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG5cbiAgICAvLyBUaGVyZSBpcyBvbmx5IDEgdmlldyB0aGF0IGNhbiBiZSBwcmVzZW50IGluIGFuIExDb250YWluZXIgdGhhdFxuICAgIC8vIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXIsIHROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0Tm9kZSwgbnVsbCwge2RlaHlkcmF0ZWRWaWV3fSk7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIGxDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBwcmVmZXRjaGluZyBvZiBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2suXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBpZiAobFZpZXdbSU5KRUNUT1JdICYmIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGxWaWV3W0lOSkVDVE9SXSEpKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyBpZiB0aGUgcHJvY2VzcyBoYXNuJ3Qgc3RhcnRlZCB5ZXQuXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlICE9PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIC8vIElmIHRoZSBsb2FkaW5nIHN0YXR1cyBpcyBkaWZmZXJlbnQgZnJvbSBpbml0aWFsIG9uZSwgaXQgbWVhbnMgdGhhdFxuICAgIC8vIHRoZSBsb2FkaW5nIG9mIGRlcGVuZGVuY2llcyBpcyBpbiBwcm9ncmVzcyBhbmQgdGhlcmUgaXMgbm90aGluZyB0byBkb1xuICAgIC8vIGluIHRoaXMgZnVuY3Rpb24uIEFsbCBkZXRhaWxzIGNhbiBiZSBvYnRhaW5lZCBmcm9tIHRoZSBgdERldGFpbHNgIG9iamVjdC5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmltYXJ5QmxvY2tUTm9kZSA9IGdldFByaW1hcnlCbG9ja1ROb2RlKHRWaWV3LCB0RGV0YWlscyk7XG5cbiAgLy8gU3dpdGNoIGZyb20gTk9UX1NUQVJURUQgLT4gSU5fUFJPR1JFU1Mgc3RhdGUuXG4gIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTO1xuXG4gIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgY29uc3QgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgPVxuICAgICAgaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgP1xuICAgICAgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IuaW50ZXJjZXB0KHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuKSA6XG4gICAgICB0RGV0YWlscy5kZXBlbmRlbmN5UmVzb2x2ZXJGbjtcblxuICAvLyBUaGUgYGRlcGVuZGVuY2llc0ZuYCBtaWdodCBiZSBgbnVsbGAgd2hlbiBhbGwgZGVwZW5kZW5jaWVzIHdpdGhpblxuICAvLyBhIGdpdmVuIGRlZmVyIGJsb2NrIHdlcmUgZWFnZXJseSByZWZlcmVuY2VzIGVsc2V3aGVyZSBpbiBhIGZpbGUsXG4gIC8vIHRodXMgbm8gZHluYW1pYyBgaW1wb3J0KClgcyB3ZXJlIHByb2R1Y2VkLlxuICBpZiAoIWRlcGVuZGVuY2llc0ZuKSB7XG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIERlZmVyIGJsb2NrIG1heSBoYXZlIG11bHRpcGxlIHByZWZldGNoIHRyaWdnZXJzLiBPbmNlIHRoZSBsb2FkaW5nXG4gIC8vIHN0YXJ0cywgaW52b2tlIGFsbCBjbGVhbiBmdW5jdGlvbnMsIHNpbmNlIHRoZXkgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG4gIGludm9rZVREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMpO1xuXG4gIC8vIFN0YXJ0IGRvd25sb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLmFsbFNldHRsZWQoZGVwZW5kZW5jaWVzRm4oKSkudGhlbihyZXN1bHRzID0+IHtcbiAgICBsZXQgZmFpbGVkID0gZmFsc2U7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdCA9IFtdO1xuICAgIGNvbnN0IHBpcGVEZWZzOiBQaXBlRGVmTGlzdCA9IFtdO1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSByZXN1bHQudmFsdWU7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGdldENvbXBvbmVudERlZihkZXBlbmRlbmN5KSB8fCBnZXREaXJlY3RpdmVEZWYoZGVwZW5kZW5jeSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVEZWYpIHtcbiAgICAgICAgICBkaXJlY3RpdmVEZWZzLnB1c2goZGlyZWN0aXZlRGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwaXBlRGVmID0gZ2V0UGlwZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgICBpZiAocGlwZURlZikge1xuICAgICAgICAgICAgcGlwZURlZnMucHVzaChwaXBlRGVmKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvYWRpbmcgaXMgY29tcGxldGVkLCB3ZSBubyBsb25nZXIgbmVlZCB0aGlzIFByb21pc2UuXG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuXG4gICAgaWYgKGZhaWxlZCkge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEO1xuICAgIH0gZWxzZSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTtcblxuICAgICAgLy8gVXBkYXRlIGRpcmVjdGl2ZSBhbmQgcGlwZSByZWdpc3RyaWVzIHRvIGFkZCBuZXdseSBkb3dubG9hZGVkIGRlcGVuZGVuY2llcy5cbiAgICAgIGNvbnN0IHByaW1hcnlCbG9ja1RWaWV3ID0gcHJpbWFyeUJsb2NrVE5vZGUudFZpZXchO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSA9XG4gICAgICAgICAgICBhZGREZXBzVG9SZWdpc3RyeTxEaXJlY3RpdmVEZWZMaXN0PihwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgZGlyZWN0aXZlRGVmcyk7XG4gICAgICB9XG4gICAgICBpZiAocGlwZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnkgPVxuICAgICAgICAgICAgYWRkRGVwc1RvUmVnaXN0cnk8UGlwZURlZkxpc3Q+KHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSwgcGlwZURlZnMpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogQWRkcyBkb3dubG9hZGVkIGRlcGVuZGVuY2llcyBpbnRvIGEgZGlyZWN0aXZlIG9yIGEgcGlwZSByZWdpc3RyeSxcbiAqIG1ha2luZyBzdXJlIHRoYXQgYSBkZXBlbmRlbmN5IGRvZXNuJ3QgeWV0IGV4aXN0IGluIHRoZSByZWdpc3RyeS5cbiAqL1xuZnVuY3Rpb24gYWRkRGVwc1RvUmVnaXN0cnk8VCBleHRlbmRzIERlcGVuZGVuY3lEZWZbXT4oY3VycmVudERlcHM6IFR8bnVsbCwgbmV3RGVwczogVCk6IFQge1xuICBpZiAoIWN1cnJlbnREZXBzIHx8IGN1cnJlbnREZXBzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXdEZXBzO1xuICB9XG5cbiAgY29uc3QgY3VycmVudERlcFNldCA9IG5ldyBTZXQoY3VycmVudERlcHMpO1xuICBmb3IgKGNvbnN0IGRlcCBvZiBuZXdEZXBzKSB7XG4gICAgY3VycmVudERlcFNldC5hZGQoZGVwKTtcbiAgfVxuXG4gIC8vIElmIGBjdXJyZW50RGVwc2AgaXMgdGhlIHNhbWUgbGVuZ3RoLCB0aGVyZSB3ZXJlIG5vIG5ldyBkZXBzIGFuZCBjYW5cbiAgLy8gcmV0dXJuIHRoZSBvcmlnaW5hbCBhcnJheS5cbiAgcmV0dXJuIChjdXJyZW50RGVwcy5sZW5ndGggPT09IGN1cnJlbnREZXBTZXQuc2l6ZSkgPyBjdXJyZW50RGVwcyA6IEFycmF5LmZyb20oY3VycmVudERlcFNldCkgYXMgVDtcbn1cblxuLyoqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVuZGVyIHBsYWNlaG9sZGVyIGNvbnRlbnQgKGlmIHByZXNlbnQpICovXG5mdW5jdGlvbiByZW5kZXJQbGFjZWhvbGRlcihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLCB0Tm9kZSwgbENvbnRhaW5lcik7XG59XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgXCJsb2FkaW5nXCIgUHJvbWlzZSBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGRlZmVyIHN1Yi1ibG9jayxcbiAqIGJhc2VkIG9uIHRoZSBsb2FkaW5nIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFJlcHJlc2VudHMgZGVmZXIgYmxvY2sgaW5mbyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyhcbiAgICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlLCAnRXhwZWN0ZWQgbG9hZGluZyBQcm9taXNlIHRvIGV4aXN0IG9uIHRoaXMgZGVmZXIgYmxvY2snKTtcblxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSEudGhlbigoKSA9PiB7XG4gICAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG5cbiAgICAgIC8vIEV2ZXJ5dGhpbmcgaXMgbG9hZGVkLCBzaG93IHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnRcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiogUmV0cmlldmVzIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIG1haW4gY29udGVudCBvZiBhIGRlZmVyIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXc6IFRWaWV3LCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKTogVENvbnRhaW5lck5vZGUge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gdERldGFpbHMucHJpbWFyeVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIHJldHVybiBnZXRUTm9kZSh0VmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gdHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAqIElmIHRoZSBibG9jayBpcyBhbHJlYWR5IGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlIC1cbiAqIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgdGFrZW4uXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBDb25kaXRpb24gaXMgdHJpZ2dlcmVkLCB0cnkgdG8gcmVuZGVyIGxvYWRpbmcgc3RhdGUgYW5kIHN0YXJ0IGRvd25sb2FkaW5nLlxuICAvLyBOb3RlOiBpZiBhIGJsb2NrIGlzIGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlLCB0aGlzIGNhbGwgd291bGQgYmUgYSBub29wLlxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICBzd2l0Y2ggKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQ6XG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG5cbiAgICAgIC8vIFRoZSBgbG9hZGluZ1N0YXRlYCBtaWdodCBoYXZlIGNoYW5nZWQgdG8gXCJsb2FkaW5nXCIuXG4gICAgICBpZiAoKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSBhcyBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSkgPT09XG4gICAgICAgICAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1MpIHtcbiAgICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTOlxuICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFOlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3dFcnJvcignVW5rbm93biBkZWZlciBibG9jayBzdGF0ZScpO1xuICAgICAgfVxuICB9XG59XG5cbi8qKlxuICogQXNzZXJ0cyB3aGV0aGVyIGFsbCBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2sgYXJlIGxvYWRlZC5cbiAqIEFsd2F5cyBydW4gdGhpcyBmdW5jdGlvbiAoaW4gZGV2IG1vZGUpIGJlZm9yZSByZW5kZXJpbmcgYSBkZWZlclxuICogYmxvY2sgaW4gY29tcGxldGVkIHN0YXRlLlxuICovXG5mdW5jdGlvbiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlLCBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSxcbiAgICAgICdFeHBlY3RpbmcgYWxsIGRlZmVycmVkIGRlcGVuZGVuY2llcyB0byBiZSBsb2FkZWQuJyk7XG59XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIERlc2NyaWJlcyBhIGhlbHBlciBjbGFzcyB0aGF0IGFsbG93cyB0byBpbnRlcmNlcHQgYSBjYWxsIHRvIHJldHJpZXZlIGN1cnJlbnRcbiAqIGRlcGVuZGVuY3kgbG9hZGluZyBmdW5jdGlvbiBhbmQgcmVwbGFjZSBpdCB3aXRoIGEgZGlmZmVyZW50IGltcGxlbWVudGF0aW9uLlxuICogVGhpcyBpbnRlcmNlcHRvciBjbGFzcyBpcyBuZWVkZWQgdG8gYWxsb3cgdGVzdGluZyBibG9ja3MgaW4gZGlmZmVyZW50IHN0YXRlc1xuICogYnkgc2ltdWxhdGluZyBsb2FkaW5nIHJlc3BvbnNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3Ige1xuICAvKipcbiAgICogSW52b2tlZCBmb3IgZWFjaCBkZWZlciBibG9jayB3aGVuIGRlcGVuZGVuY3kgbG9hZGluZyBmdW5jdGlvbiBpcyBhY2Nlc3NlZC5cbiAgICovXG4gIGludGVyY2VwdChkZXBlbmRlbmN5Rm46IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwpOiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGxvd3MgdG8gY29uZmlndXJlIGFuIGludGVyY2VwdG9yIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2V0SW50ZXJjZXB0b3IoaW50ZXJjZXB0b3JGbjogKGN1cnJlbnQ6IERlcGVuZGVuY3lSZXNvbHZlckZuKSA9PiBEZXBlbmRlbmN5UmVzb2x2ZXJGbik6IHZvaWQ7XG59XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIEluamVjdG9yIHRva2VuIHRoYXQgYWxsb3dzIHRvIHByb3ZpZGUgYERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3JgIGNsYXNzXG4gKiBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yPihcbiAgICAgICAgbmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1InIDogJycpO1xuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiB2YWx1ZSBtYXRjaGVzIHRoZSBleHBlY3RlZCBzdHJ1Y3R1cmUgb2YgYSBkZWZlciBibG9ja1xuICpcbiAqIFdlIGNhbiBzYWZlbHkgcmVseSBvbiB0aGUgcHJpbWFyeVRtcGxJbmRleCBiZWNhdXNlIGV2ZXJ5IGRlZmVyIGJsb2NrIHJlcXVpcmVzXG4gKiB0aGF0IGEgcHJpbWFyeSB0ZW1wbGF0ZSBleGlzdHMuIEFsbCB0aGUgb3RoZXIgdGVtcGxhdGUgb3B0aW9ucyBhcmUgb3B0aW9uYWwuXG4gKi9cbmZ1bmN0aW9uIGlzVERlZmVyQmxvY2tEZXRhaWxzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSAmJlxuICAgICAgKHR5cGVvZiAodmFsdWUgYXMgVERlZmVyQmxvY2tEZXRhaWxzKS5wcmltYXJ5VG1wbEluZGV4ID09PSAnbnVtYmVyJyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdXNlZCBmb3IgY29uZmlndXJpbmcgZGVmZXIgYmxvY2sgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19DT05GSUcgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrQ29uZmlnPihuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfQ09ORklHJyA6ICcnKTtcblxuLyoqXG4gKiBEZWZlciBibG9jayBpbnN0YW5jZSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZlckJsb2NrRGV0YWlscyB7XG4gIGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGxWaWV3OiBMVmlldztcbiAgdE5vZGU6IFROb2RlO1xuICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbGwgZGVmZXIgYmxvY2tzIGluIGEgZ2l2ZW4gTFZpZXcuXG4gKlxuICogQHBhcmFtIGxWaWV3IGxWaWV3IHdpdGggZGVmZXIgYmxvY2tzXG4gKiBAcGFyYW0gZGVmZXJCbG9ja3MgZGVmZXIgYmxvY2sgYWdncmVnYXRvciBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmZXJCbG9ja3MobFZpZXc6IExWaWV3LCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpXTtcbiAgICAgIC8vIEFuIExDb250YWluZXIgbWF5IHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLCBpbiB3aGljaCBjYXNlXG4gICAgICAvLyB3ZSBzdG9yZSBpdCBhcyBhIHJlc3VsdC4gT3RoZXJ3aXNlLCBrZWVwIGl0ZXJhdGluZyBvdmVyIExDb250YWluZXIgdmlld3MgYW5kXG4gICAgICAvLyBsb29rIGZvciBkZWZlciBibG9ja3MuXG4gICAgICBjb25zdCBpc0xhc3QgPSBpID09PSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCAtIDE7XG4gICAgICBpZiAoIWlzTGFzdCkge1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaV0gYXMgVE5vZGU7XG4gICAgICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICAgIGlmIChpc1REZWZlckJsb2NrRGV0YWlscyh0RGV0YWlscykpIHtcbiAgICAgICAgICBkZWZlckJsb2Nrcy5wdXNoKHtsQ29udGFpbmVyLCBsVmlldywgdE5vZGUsIHREZXRhaWxzfSk7XG4gICAgICAgICAgLy8gVGhpcyBMQ29udGFpbmVyIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gd2UgZXhpdFxuICAgICAgICAgIC8vIHRoaXMgaXRlcmF0aW9uIGFuZCBkb24ndCBpbnNwZWN0IHZpZXdzIGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICBnZXREZWZlckJsb2NrcyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBkZWZlckJsb2Nrcyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0xWaWV3KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgZW50ZXIgdGhlIGBnZXREZWZlckJsb2Nrc2AgcmVjdXJzaXZlbHkuXG4gICAgICBnZXREZWZlckJsb2NrcyhsVmlld1tpXSwgZGVmZXJCbG9ja3MpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIGNsZWFudXAgZnVuY3Rpb24gYXNzb2NpYXRlZCB3aXRoIGEgcHJlZmV0Y2hpbmcgdHJpZ2dlclxuICogb2YgYSBnaXZlbiBkZWZlciBibG9jay5cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2xlYW51cEZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuYWRkKHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG59XG5cbi8qKlxuICogSW52b2tlcyBhbGwgcmVnaXN0ZXJlZCBwcmVmZXRjaCBjbGVhbnVwIHRyaWdnZXJzXG4gKiBhbmQgcmVtb3ZlcyBhbGwgY2xlYW51cCBmdW5jdGlvbnMgYWZ0ZXJ3YXJkcy5cbiAqL1xuZnVuY3Rpb24gaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yOiBJbmplY3RvciwgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKS5jbGVhbnVwKHREZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBzZXJ2aWNlIHRvIGtlZXAgdHJhY2sgb2YgY2xlYW51cCBmdW5jdGlvbnMgYXNzb2NpYXRlZFxuICogd2l0aCBkZWZlciBibG9ja3MuIFRoaXMgY2xhc3MgaXMgdXNlZCB0byBtYW5hZ2UgY2xlYW51cCBmdW5jdGlvbnNcbiAqIGNyZWF0ZWQgZm9yIHByZWZldGNoaW5nIHRyaWdnZXJzLlxuICovXG5jbGFzcyBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIge1xuICBwcml2YXRlIGJsb2NrcyA9IG5ldyBNYXA8VERlZmVyQmxvY2tEZXRhaWxzLCBNYXA8c3RyaW5nLCBWb2lkRnVuY3Rpb25bXT4+KCk7XG5cbiAgYWRkKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgaWYgKCF0aGlzLmJsb2Nrcy5oYXModERldGFpbHMpKSB7XG4gICAgICB0aGlzLmJsb2Nrcy5zZXQodERldGFpbHMsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKSE7XG4gICAgaWYgKCFibG9jay5oYXMoa2V5KSkge1xuICAgICAgYmxvY2suc2V0KGtleSwgW10pO1xuICAgIH1cbiAgICBjb25zdCBjYWxsYmFja3MgPSBibG9jay5nZXQoa2V5KSE7XG4gICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgaGFzKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKT8uaGFzKGtleSk7XG4gIH1cblxuICBjbGVhbnVwKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk7XG4gICAgaWYgKGJsb2NrKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrcyBvZiBPYmplY3QudmFsdWVzKGJsb2NrKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGNhbGxiYWNrcykge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuYmxvY2tzLmRlbGV0ZSh0RGV0YWlscyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgZm9yIChjb25zdCBbYmxvY2tdIG9mIHRoaXMuYmxvY2tzKSB7XG4gICAgICB0aGlzLmNsZWFudXAoYmxvY2spO1xuICAgIH1cbiAgICB0aGlzLmJsb2Nrcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKCksXG4gIH0pO1xufVxuXG4vKipcbiAqIFVzZSBzaGltcyBmb3IgdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBhbmQgYGNhbmNlbElkbGVDYWxsYmFja2AgZnVuY3Rpb25zIGZvclxuICogZW52aXJvbm1lbnRzIHdoZXJlIHRob3NlIGZ1bmN0aW9ucyBhcmUgbm90IGF2YWlsYWJsZSAoZS5nLiBOb2RlLmpzIGFuZCBTYWZhcmkpLlxuICpcbiAqIE5vdGU6IHdlIHdyYXAgdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBjYWxsIGludG8gYSBmdW5jdGlvbiwgc28gdGhhdCBpdCBjYW4gYmVcbiAqIG92ZXJyaWRkZW4vbW9ja2VkIGluIHRlc3QgZW52aXJvbm1lbnQgYW5kIHBpY2tlZCB1cCBieSB0aGUgcnVudGltZSBjb2RlLlxuICovXG5jb25zdCBfcmVxdWVzdElkbGVDYWxsYmFjayA9ICgpID0+XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gcmVxdWVzdElkbGVDYWxsYmFjayA6IHNldFRpbWVvdXQ7XG5jb25zdCBfY2FuY2VsSWRsZUNhbGxiYWNrID0gKCkgPT5cbiAgICB0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgPyBjYW5jZWxJZGxlQ2FsbGJhY2sgOiBjbGVhclRpbWVvdXQ7XG5cbi8qKlxuICogSGVscGVyIHNlcnZpY2UgdG8gc2NoZWR1bGUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgcyBmb3IgYmF0Y2hlcyBvZiBkZWZlciBibG9ja3MsXG4gKiB0byBhdm9pZCBjYWxsaW5nIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBmb3IgZWFjaCBkZWZlciBibG9jayAoZS5nLiBpZlxuICogZGVmZXIgYmxvY2tzIGFyZSBkZWZpbmVkIGluc2lkZSBhIGZvciBsb29wKS5cbiAqL1xuY2xhc3MgT25JZGxlU2NoZWR1bGVyIHtcbiAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgY3VycmVudCBjYWxsYmFja3MgYXJlIGJlaW5nIGludm9rZWQuXG4gIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuXG4gIC8vIEN1cnJlbnRseSBzY2hlZHVsZWQgaWRsZSBjYWxsYmFjayBpZC5cbiAgaWRsZUlkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgLy8gU2V0IG9mIGNhbGxiYWNrcyB0byBiZSBpbnZva2VkIG5leHQuXG4gIGN1cnJlbnQgPSBuZXcgU2V0PFZvaWRGdW5jdGlvbj4oKTtcblxuICAvLyBTZXQgb2YgY2FsbGJhY2tzIGNvbGxlY3RlZCB3aGlsZSBpbnZva2luZyBjdXJyZW50IHNldCBvZiBjYWxsYmFja3MuXG4gIC8vIFRob3NlIGNhbGxiYWNrcyBhcmUgc2NoZWR1bGVkIGZvciB0aGUgbmV4dCBpZGxlIHBlcmlvZC5cbiAgZGVmZXJyZWQgPSBuZXcgU2V0PFZvaWRGdW5jdGlvbj4oKTtcblxuICBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICByZXF1ZXN0SWRsZUNhbGxiYWNrID0gX3JlcXVlc3RJZGxlQ2FsbGJhY2soKS5iaW5kKGdsb2JhbFRoaXMpO1xuICBjYW5jZWxJZGxlQ2FsbGJhY2sgPSBfY2FuY2VsSWRsZUNhbGxiYWNrKCkuYmluZChnbG9iYWxUaGlzKTtcblxuICBhZGQoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZCA6IHRoaXMuY3VycmVudDtcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgICBpZiAodGhpcy5pZGxlSWQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVJZGxlQ2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIHRoaXMuY3VycmVudC5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWQuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVJZGxlQ2FsbGJhY2soKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICB0aGlzLmNhbmNlbElkbGVDYWxsYmFjayh0aGlzLmlkbGVJZCEpO1xuICAgICAgdGhpcy5pZGxlSWQgPSBudWxsO1xuXG4gICAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jdXJyZW50KSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmN1cnJlbnQuY2xlYXIoKTtcblxuICAgICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIGFueSBjYWxsYmFja3MgYWRkZWQgZHVyaW5nIGFuIGludm9jYXRpb25cbiAgICAgIC8vIG9mIHRoZSBjdXJyZW50IG9uZXMgLSBtYWtlIHRoZW0gXCJjdXJyZW50XCIgYW5kIHNjaGVkdWxlXG4gICAgICAvLyBhIG5ldyBpZGxlIGNhbGxiYWNrLlxuICAgICAgaWYgKHRoaXMuZGVmZXJyZWQuc2l6ZSA+IDApIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmRlZmVycmVkKSB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZWZlcnJlZC5jbGVhcigpO1xuICAgICAgICB0aGlzLnNjaGVkdWxlSWRsZUNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgY2FsbGJhY2sgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlXG4gICAgLy8gdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBpcyBub3QgY3VycmVudGx5IHBhdGNoZWQgYnkgWm9uZS5qcy5cbiAgICB0aGlzLmlkbGVJZCA9IHRoaXMucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB0aGlzLm5nWm9uZS5ydW4oY2FsbGJhY2spKSBhcyBudW1iZXI7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5pZGxlSWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY2FuY2VsSWRsZUNhbGxiYWNrKHRoaXMuaWRsZUlkKTtcbiAgICAgIHRoaXMuaWRsZUlkID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50LmNsZWFyKCk7XG4gICAgdGhpcy5kZWZlcnJlZC5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogT25JZGxlU2NoZWR1bGVyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgT25JZGxlU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBzZXJ2aWNlIHRvIHNjaGVkdWxlIGBzZXRUaW1lb3V0YHMgZm9yIGJhdGNoZXMgb2YgZGVmZXIgYmxvY2tzLFxuICogdG8gYXZvaWQgY2FsbGluZyBgc2V0VGltZW91dGAgZm9yIGVhY2ggZGVmZXIgYmxvY2sgKGUuZy4gaWYgZGVmZXIgYmxvY2tzXG4gKiBhcmUgY3JlYXRlZCBpbnNpZGUgYSBmb3IgbG9vcCkuXG4gKi9cbmNsYXNzIFRpbWVyU2NoZWR1bGVyIHtcbiAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgY3VycmVudCBjYWxsYmFja3MgYXJlIGJlaW5nIGludm9rZWQuXG4gIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuXG4gIC8vIEN1cnJlbnRseSBzY2hlZHVsZWQgYHNldFRpbWVvdXRgIGlkLlxuICB0aW1lb3V0SWQ6IG51bWJlcnxudWxsID0gbnVsbDtcblxuICAvLyBXaGVuIGN1cnJlbnRseSBzY2hlZHVsZWQgdGltZXIgd291bGQgZmlyZS5cbiAgaW52b2tlVGltZXJBdDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIC8vIExpc3Qgb2YgY2FsbGJhY2tzIHRvIGJlIGludm9rZWQuXG4gIC8vIEZvciBlYWNoIGNhbGxiYWNrIHdlIGFsc28gc3RvcmUgYSB0aW1lc3RhbXAgb24gd2hlbiB0aGUgY2FsbGJhY2tcbiAgLy8gc2hvdWxkIGJlIGludm9rZWQuIFdlIHN0b3JlIHRpbWVzdGFtcHMgYW5kIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAvLyBpbiBhIGZsYXQgYXJyYXkgdG8gYXZvaWQgY3JlYXRpbmcgbmV3IG9iamVjdHMgZm9yIGVhY2ggZW50cnkuXG4gIC8vIFt0aW1lc3RhbXAxLCBjYWxsYmFjazEsIHRpbWVzdGFtcDIsIGNhbGxiYWNrMiwgLi4uXVxuICBjdXJyZW50OiBBcnJheTxudW1iZXJ8Vm9pZEZ1bmN0aW9uPiA9IFtdO1xuXG4gIC8vIExpc3Qgb2YgY2FsbGJhY2tzIGNvbGxlY3RlZCB3aGlsZSBpbnZva2luZyBjdXJyZW50IHNldCBvZiBjYWxsYmFja3MuXG4gIC8vIFRob3NlIGNhbGxiYWNrcyBhcmUgYWRkZWQgdG8gdGhlIFwiY3VycmVudFwiIHF1ZXVlIGF0IHRoZSBlbmQgb2ZcbiAgLy8gdGhlIGN1cnJlbnQgY2FsbGJhY2sgaW52b2NhdGlvbi4gVGhlIHNoYXBlIG9mIHRoaXMgbGlzdCBpcyB0aGUgc2FtZVxuICAvLyBhcyB0aGUgc2hhcGUgb2YgdGhlIGBjdXJyZW50YCBsaXN0LlxuICBkZWZlcnJlZDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4gPSBbXTtcblxuICBhZGQoZGVsYXk6IG51bWJlciwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZCA6IHRoaXMuY3VycmVudDtcbiAgICB0aGlzLmFkZFRvUXVldWUodGFyZ2V0LCBEYXRlLm5vdygpICsgZGVsYXksIGNhbGxiYWNrKTtcbiAgICB0aGlzLnNjaGVkdWxlVGltZXIoKTtcbiAgfVxuXG4gIHJlbW92ZShjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgY29uc3QgY2FsbGJhY2tJbmRleCA9IHRoaXMucmVtb3ZlRnJvbVF1ZXVlKHRoaXMuY3VycmVudCwgY2FsbGJhY2spO1xuICAgIGlmIChjYWxsYmFja0luZGV4ID09PSAtMSkge1xuICAgICAgLy8gVHJ5IGNsZWFuaW5nIHVwIGRlZmVycmVkIHF1ZXVlIG9ubHkgaW4gY2FzZVxuICAgICAgLy8gd2UgZGlkbid0IGZpbmQgYSBjYWxsYmFjayBpbiB0aGUgXCJjdXJyZW50XCIgcXVldWUuXG4gICAgICB0aGlzLnJlbW92ZUZyb21RdWV1ZSh0aGlzLmRlZmVycmVkLCBjYWxsYmFjayk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRUb1F1ZXVlKHRhcmdldDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4sIGludm9rZUF0OiBudW1iZXIsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBsZXQgaW5zZXJ0QXRJbmRleCA9IHRhcmdldC5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGludm9rZVF1ZXVlZENhbGxiYWNrQXQgPSB0YXJnZXRbaV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKGludm9rZVF1ZXVlZENhbGxiYWNrQXQgPiBpbnZva2VBdCkge1xuICAgICAgICAvLyBXZSd2ZSByZWFjaGVkIGEgZmlyc3QgdGltZXIgdGhhdCBpcyBzY2hlZHVsZWRcbiAgICAgICAgLy8gZm9yIGEgbGF0ZXIgdGltZSB0aGFuIHdoYXQgd2UgYXJlIHRyeWluZyB0byBpbnNlcnQuXG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIGxvY2F0aW9uIGF0IHdoaWNoIHdlIG5lZWQgdG8gaW5zZXJ0LFxuICAgICAgICAvLyBubyBuZWVkIHRvIGl0ZXJhdGUgZnVydGhlci5cbiAgICAgICAgaW5zZXJ0QXRJbmRleCA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBhcnJheUluc2VydDIodGFyZ2V0LCBpbnNlcnRBdEluZGV4LCBpbnZva2VBdCwgY2FsbGJhY2spO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVGcm9tUXVldWUodGFyZ2V0OiBBcnJheTxudW1iZXJ8Vm9pZEZ1bmN0aW9uPiwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGxldCBpbmRleCA9IC0xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBxdWV1ZWRDYWxsYmFjayA9IHRhcmdldFtpICsgMV07XG4gICAgICBpZiAocXVldWVkQ2FsbGJhY2sgPT09IGNhbGxiYWNrKSB7XG4gICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAvLyBSZW1vdmUgMiBlbGVtZW50czogYSB0aW1lc3RhbXAgc2xvdCBhbmRcbiAgICAgIC8vIHRoZSBmb2xsb3dpbmcgc2xvdCB3aXRoIGEgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICBhcnJheVNwbGljZSh0YXJnZXQsIGluZGV4LCAyKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgcHJpdmF0ZSBzY2hlZHVsZVRpbWVyKCkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dElkISk7XG4gICAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGw7XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gdHJ1ZTtcblxuICAgICAgLy8gSW52b2tlIGNhbGxiYWNrcyB0aGF0IHdlcmUgc2NoZWR1bGVkIHRvIHJ1blxuICAgICAgLy8gYmVmb3JlIHRoZSBjdXJyZW50IHRpbWUuXG4gICAgICBsZXQgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGxldCBsYXN0Q2FsbGJhY2tJbmRleDogbnVtYmVyfG51bGwgPSBudWxsO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmN1cnJlbnQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmN1cnJlbnRbaV0gYXMgbnVtYmVyO1xuICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuY3VycmVudFtpICsgMV0gYXMgVm9pZEZ1bmN0aW9uO1xuICAgICAgICBpZiAoaW52b2tlQXQgPD0gbm93KSB7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAvLyBQb2ludCBhdCB0aGUgaW52b2tlZCBjYWxsYmFjayBmdW5jdGlvbiwgd2hpY2ggaXMgbG9jYXRlZFxuICAgICAgICAgIC8vIGFmdGVyIHRoZSB0aW1lc3RhbXAuXG4gICAgICAgICAgbGFzdENhbGxiYWNrSW5kZXggPSBpICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBXZSd2ZSByZWFjaGVkIGEgdGltZXIgdGhhdCBzaG91bGQgbm90IGJlIGludm9rZWQgeWV0LlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobGFzdENhbGxiYWNrSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgLy8gSWYgbGFzdCBjYWxsYmFjayBpbmRleCBpcyBgbnVsbGAgLSBubyBjYWxsYmFja3Mgd2VyZSBpbnZva2VkLFxuICAgICAgICAvLyBzbyBubyBjbGVhbnVwIGlzIG5lZWRlZC4gT3RoZXJ3aXNlLCByZW1vdmUgaW52b2tlZCBjYWxsYmFja3NcbiAgICAgICAgLy8gZnJvbSB0aGUgcXVldWUuXG4gICAgICAgIGFycmF5U3BsaWNlKHRoaXMuY3VycmVudCwgMCwgbGFzdENhbGxiYWNrSW5kZXggKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIGFueSBjYWxsYmFja3MgYWRkZWQgZHVyaW5nIGFuIGludm9jYXRpb25cbiAgICAgIC8vIG9mIHRoZSBjdXJyZW50IG9uZXMgLSBtb3ZlIHRoZW0gb3ZlciB0byB0aGUgXCJjdXJyZW50XCJcbiAgICAgIC8vIHF1ZXVlLlxuICAgICAgaWYgKHRoaXMuZGVmZXJyZWQubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZGVmZXJyZWQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICBjb25zdCBpbnZva2VBdCA9IHRoaXMuZGVmZXJyZWRbaV0gYXMgbnVtYmVyO1xuICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5kZWZlcnJlZFtpICsgMV0gYXMgVm9pZEZ1bmN0aW9uO1xuICAgICAgICAgIHRoaXMuYWRkVG9RdWV1ZSh0aGlzLmN1cnJlbnQsIGludm9rZUF0LCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZWZlcnJlZC5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgICAgdGhpcy5zY2hlZHVsZVRpbWVyKCk7XG4gICAgfTtcblxuICAgIC8vIEF2b2lkIHJ1bm5pbmcgdGltZXIgY2FsbGJhY2tzIG1vcmUgdGhhbiBvbmNlIHBlclxuICAgIC8vIGF2ZXJhZ2UgZnJhbWUgZHVyYXRpb24uIFRoaXMgaXMgbmVlZGVkIGZvciBiZXR0ZXJcbiAgICAvLyBiYXRjaGluZyBhbmQgdG8gYXZvaWQga2lja2luZyBvZmYgZXhjZXNzaXZlIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiBjeWNsZXMuXG4gICAgY29uc3QgRlJBTUVfRFVSQVRJT05fTVMgPSAxNjsgIC8vIDEwMDBtcyAvIDYwZnBzXG5cbiAgICBpZiAodGhpcy5jdXJyZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBxdWV1ZSBwb2ludHMgYXQgdGhlIHRpbWVzdGFtcFxuICAgICAgLy8gb2YgdGhlIGZpcnN0IChlYXJsaWVzdCkgZXZlbnQuXG4gICAgICBjb25zdCBpbnZva2VBdCA9IHRoaXMuY3VycmVudFswXSBhcyBudW1iZXI7XG4gICAgICBpZiAoIXRoaXMudGltZW91dElkIHx8XG4gICAgICAgICAgLy8gUmVzY2hlZHVsZSBhIHRpbWVyIGluIGNhc2UgYSBxdWV1ZSBjb250YWlucyBhbiBpdGVtIHdpdGhcbiAgICAgICAgICAvLyBhbiBlYXJsaWVyIHRpbWVzdGFtcCBhbmQgdGhlIGRlbHRhIGlzIG1vcmUgdGhhbiBhbiBhdmVyYWdlXG4gICAgICAgICAgLy8gZnJhbWUgZHVyYXRpb24uXG4gICAgICAgICAgKHRoaXMuaW52b2tlVGltZXJBdCAmJiAodGhpcy5pbnZva2VUaW1lckF0IC0gaW52b2tlQXQgPiBGUkFNRV9EVVJBVElPTl9NUykpKSB7XG4gICAgICAgIGlmICh0aGlzLnRpbWVvdXRJZCAhPT0gbnVsbCkge1xuICAgICAgICAgIC8vIFRoZXJlIHdhcyBhIHRpbWVvdXQgYWxyZWFkeSwgYnV0IGFuIGVhcmxpZXIgZXZlbnQgd2FzIGFkZGVkXG4gICAgICAgICAgLy8gaW50byB0aGUgcXVldWUuIEluIHRoaXMgY2FzZSB3ZSBkcm9wIGFuIG9sZCB0aW1lciBhbmQgc2V0dXBcbiAgICAgICAgICAvLyBhIG5ldyBvbmUgd2l0aCBhbiB1cGRhdGVkIChzbWFsbGVyKSB0aW1lb3V0LlxuICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XG4gICAgICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBNYXRoLm1heChpbnZva2VBdCAtIG5vdywgRlJBTUVfRFVSQVRJT05fTVMpO1xuICAgICAgICB0aGlzLmludm9rZVRpbWVyQXQgPSBpbnZva2VBdDtcbiAgICAgICAgdGhpcy50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGNhbGxiYWNrLCB0aW1lb3V0KSBhcyB1bmtub3duIGFzIG51bWJlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCk7XG4gICAgICB0aGlzLnRpbWVvdXRJZCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudC5sZW5ndGggPSAwO1xuICAgIHRoaXMuZGVmZXJyZWQubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IFRpbWVyU2NoZWR1bGVyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgVGltZXJTY2hlZHVsZXIoKSxcbiAgfSk7XG59XG4iXX0=