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
import { DEFER_BLOCK_STATE, DeferBlockBehavior, DeferBlockInternalState, DeferBlockState, DeferDependenciesLoadingState, LOADING_AFTER_CLEANUP_FN, LOADING_AFTER_SLOT, MINIMUM_SLOT, NEXT_DEFER_BLOCK_STATE, STATE_IS_FROZEN_UNTIL } from '../interfaces/defer';
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
    const lDetails = [
        null,
        DeferBlockInternalState.Initial,
        null,
        null // LOADING_AFTER_CLEANUP_FN
    ];
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
 * Returns a minimum amount of time that a given state should be rendered for,
 * taking into account `minimum` parameter value. If the `minimum` value is
 * not specified - returns `null`.
 */
function getMinimumDurationForState(tDetails, currentState) {
    if (currentState === DeferBlockState.Placeholder) {
        return tDetails.placeholderBlockConfig?.[MINIMUM_SLOT] ?? null;
    }
    else if (currentState === DeferBlockState.Loading) {
        return tDetails.loadingBlockConfig?.[MINIMUM_SLOT] ?? null;
    }
    return null;
}
/** Retrieves the value of the `after` parameter on the @loading block. */
function getLoadingBlockAfter(tDetails) {
    return tDetails.loadingBlockConfig?.[LOADING_AFTER_SLOT] ?? null;
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
    const hostTView = hostLView[TVIEW];
    // Check if this view is not destroyed. Since the loading process was async,
    // the view might end up being destroyed by the time rendering happens.
    if (isDestroyed(hostLView))
        return;
    // Make sure this TNode belongs to TView that represents host LView.
    ngDevMode && assertTNodeForLView(tNode, hostLView);
    const lDetails = getLDeferBlockDetails(hostLView, tNode);
    const tDetails = getTDeferBlockDetails(hostTView, tNode);
    ngDevMode && assertDefined(lDetails, 'Expected a defer block state defined');
    const now = Date.now();
    const currentState = lDetails[DEFER_BLOCK_STATE];
    if (!isValidStateChange(currentState, newState) ||
        !isValidStateChange(lDetails[NEXT_DEFER_BLOCK_STATE] ?? -1, newState))
        return;
    if (lDetails[STATE_IS_FROZEN_UNTIL] === null || lDetails[STATE_IS_FROZEN_UNTIL] <= now) {
        lDetails[STATE_IS_FROZEN_UNTIL] = null;
        const loadingAfter = getLoadingBlockAfter(tDetails);
        const inLoadingAfterPhase = lDetails[LOADING_AFTER_CLEANUP_FN] !== null;
        if (newState === DeferBlockState.Loading && loadingAfter !== null && !inLoadingAfterPhase) {
            // Trying to render loading, but it has an `after` config,
            // so schedule an update action after a timeout.
            lDetails[NEXT_DEFER_BLOCK_STATE] = newState;
            const cleanupFn = scheduleDeferBlockUpdate(loadingAfter, lDetails, tNode, lContainer, hostLView);
            lDetails[LOADING_AFTER_CLEANUP_FN] = cleanupFn;
        }
        else {
            // If we transition to a complete or an error state and there is a pending
            // operation to render loading after a timeout - invoke a cleanup operation,
            // which stops the timer.
            if (newState > DeferBlockState.Loading && inLoadingAfterPhase) {
                lDetails[LOADING_AFTER_CLEANUP_FN]();
                lDetails[LOADING_AFTER_CLEANUP_FN] = null;
                lDetails[NEXT_DEFER_BLOCK_STATE] = null;
            }
            applyDeferBlockStateToDom(newState, lDetails, lContainer, hostLView, tNode);
            const duration = getMinimumDurationForState(tDetails, newState);
            if (duration !== null) {
                lDetails[STATE_IS_FROZEN_UNTIL] = now + duration;
                scheduleDeferBlockUpdate(duration, lDetails, tNode, lContainer, hostLView);
            }
        }
    }
    else {
        // We are still rendering the previous state.
        // Update the `NEXT_DEFER_BLOCK_STATE`, which would be
        // picked up once it's time to transition to the next state.
        lDetails[NEXT_DEFER_BLOCK_STATE] = newState;
    }
}
/**
 * Schedules an update operation after a specified timeout.
 */
function scheduleDeferBlockUpdate(timeout, lDetails, tNode, lContainer, hostLView) {
    const callback = () => {
        const nextState = lDetails[NEXT_DEFER_BLOCK_STATE];
        lDetails[STATE_IS_FROZEN_UNTIL] = null;
        lDetails[NEXT_DEFER_BLOCK_STATE] = null;
        if (nextState !== null) {
            renderDeferBlockState(nextState, tNode, lContainer);
        }
    };
    // TODO: this needs refactoring to make `TimerScheduler` that is used inside
    // of the `scheduleTimerTrigger` function tree-shakable.
    return scheduleTimerTrigger(timeout, callback, hostLView, true);
}
/**
 * Checks whether we can transition to the next state.
 *
 * We transition to the next state if the previous state was represented
 * with a number that is less than the next state. For example, if the current
 * state is "loading" (represented as `1`), we should not show a placeholder
 * (represented as `0`), but we can show a completed state (represented as `2`)
 * or an error state (represented as `3`).
 */
function isValidStateChange(currentState, newState) {
    return currentState < newState;
}
/**
 * Applies changes to the DOM to reflect a given state.
 */
function applyDeferBlockStateToDom(newState, lDetails, lContainer, hostLView, tNode) {
    const stateTmplIndex = getTemplateIndexForState(newState, hostLView, tNode);
    if (stateTmplIndex !== null) {
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
    switch (tDetails.loadingState) {
        case DeferDependenciesLoadingState.NOT_STARTED:
            renderDeferBlockState(DeferBlockState.Loading, tNode, lContainer);
            triggerResourceLoading(tDetails, lView);
            // The `loadingState` might have changed to "loading".
            if (tDetails.loadingState ===
                DeferDependenciesLoadingState.IN_PROGRESS) {
                renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
            }
            break;
        case DeferDependenciesLoadingState.IN_PROGRESS:
            renderDeferBlockState(DeferBlockState.Loading, tNode, lContainer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBWSxrQkFBa0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsbUNBQW1DLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN4RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3JHLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBb0IsdUJBQXVCLEVBQUUsZUFBZSxFQUFzQiw2QkFBNkIsRUFBd0csd0JBQXdCLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFxQixNQUFNLHFC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LGlCQUFpQixDQUFDLENBQUMsRUFBRTtnQkFDL0UsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtvQkFDM0IsOERBQThEO29CQUM5RCw4REFBOEQ7b0JBQzlELCtDQUErQztvQkFDL0MsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7aUJBQ3ZCO2dCQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBc0IsQ0FBQzthQUNyRTtTQUNGO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQzNCLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDdkI7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSxjQUFjO1FBQ3JCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLGNBQWMsRUFBRTtLQUNwQyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7cG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXJ9IGZyb20gJy4uLy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHthcnJheUluc2VydDIsIGFycmF5U3BsaWNlfSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RWxlbWVudCwgYXNzZXJ0RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi8uLi96b25lJztcbmltcG9ydCB7YWZ0ZXJSZW5kZXJ9IGZyb20gJy4uL2FmdGVyX3JlbmRlcl9ob29rcyc7XG5pbXBvcnQge2Fzc2VydEluZGV4SW5EZWNsUmFuZ2UsIGFzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRUTm9kZUZvckxWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrQmVoYXZpb3IsIERlZmVyQmxvY2tDb25maWcsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGUsIERlZmVyQmxvY2tUcmlnZ2VycywgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUsIERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnLCBEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWcsIERlcGVuZGVuY3lSZXNvbHZlckZuLCBMRGVmZXJCbG9ja0RldGFpbHMsIExPQURJTkdfQUZURVJfQ0xFQU5VUF9GTiwgTE9BRElOR19BRlRFUl9TTE9ULCBNSU5JTVVNX1NMT1QsIE5FWFRfREVGRVJfQkxPQ0tfU1RBVEUsIFNUQVRFX0lTX0ZST1pFTl9VTlRJTCwgVERlZmVyQmxvY2tEZXRhaWxzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmVyJztcbmltcG9ydCB7RGVwZW5kZW5jeURlZiwgRGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNEZXN0cm95ZWQsIGlzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRTZWxlY3RlZFROb2RlLCBnZXRUVmlldywgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldFROb2RlLCByZW1vdmVMVmlld09uRGVzdHJveSwgc3RvcmVMVmlld09uRGVzdHJveSwgd2Fsa1VwVmlld3N9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2FkZExWaWV3VG9MQ29udGFpbmVyLCBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3LCByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyLCBzaG91bGRBZGRWaWV3VG9Eb219IGZyb20gJy4uL3ZpZXdfbWFuaXB1bGF0aW9uJztcblxuaW1wb3J0IHtvbkhvdmVyLCBvbkludGVyYWN0aW9uLCBvblZpZXdwb3J0fSBmcm9tICcuL2RlZmVyX2V2ZW50cyc7XG5pbXBvcnQge8m1ybV0ZW1wbGF0ZX0gZnJvbSAnLi90ZW1wbGF0ZSc7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGRlZmVyIGJsb2NrcyBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuICpcbiAqIEN1cnJlbnRseSwgZGVmZXIgYmxvY2tzIGFyZSBub3QgdHJpZ2dlcmVkIG9uIHRoZSBzZXJ2ZXIsXG4gKiBvbmx5IHBsYWNlaG9sZGVyIGNvbnRlbnQgaXMgcmVuZGVyZWQgKGlmIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3I6IEluamVjdG9yKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGluamVjdG9yLmdldChERUZFUl9CTE9DS19DT05GSUcsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoY29uZmlnPy5iZWhhdmlvciA9PT0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIGRlZmVyIGJsb2Nrcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGBkZWZlcmAgaW5zdHJ1Y3Rpb24uXG4gKiBAcGFyYW0gcHJpbWFyeVRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcHJpbWFyeSBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGRlcGVuZGVuY3lSZXNvbHZlckZuIEZ1bmN0aW9uIHRoYXQgY29udGFpbnMgZGVwZW5kZW5jaWVzIGZvciB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxvYWRpbmdUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGxvYWRpbmcgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcGxhY2Vob2xkZXIgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBlcnJvclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgZXJyb3IgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBsb2FkaW5nQ29uZmlnSW5kZXggSW5kZXggaW4gdGhlIGNvbnN0YW50cyBhcnJheSBvZiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgbG9hZGluZy5cbiAqICAgICBibG9jay5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlckNvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgcGxhY2Vob2xkZXIgYmxvY2suXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcihcbiAgICBpbmRleDogbnVtYmVyLCBwcmltYXJ5VG1wbEluZGV4OiBudW1iZXIsIGRlcGVuZGVuY3lSZXNvbHZlckZuPzogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCxcbiAgICBsb2FkaW5nVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIHBsYWNlaG9sZGVyVG1wbEluZGV4PzogbnVtYmVyfG51bGwsXG4gICAgZXJyb3JUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCwgbG9hZGluZ0NvbmZpZ0luZGV4PzogbnVtYmVyfG51bGwsXG4gICAgcGxhY2Vob2xkZXJDb25maWdJbmRleD86IG51bWJlcnxudWxsKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcblxuICDJtcm1dGVtcGxhdGUoaW5kZXgsIG51bGwsIDAsIDApO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjb25zdCBkZWZlckJsb2NrQ29uZmlnOiBURGVmZXJCbG9ja0RldGFpbHMgPSB7XG4gICAgICBwcmltYXJ5VG1wbEluZGV4LFxuICAgICAgbG9hZGluZ1RtcGxJbmRleDogbG9hZGluZ1RtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJUbXBsSW5kZXg6IHBsYWNlaG9sZGVyVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBlcnJvclRtcGxJbmRleDogZXJyb3JUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyQmxvY2tDb25maWc6IHBsYWNlaG9sZGVyQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnPih0Vmlld0NvbnN0cywgcGxhY2Vob2xkZXJDb25maWdJbmRleCkgOlxuICAgICAgICAgIG51bGwsXG4gICAgICBsb2FkaW5nQmxvY2tDb25maWc6IGxvYWRpbmdDb25maWdJbmRleCAhPSBudWxsID9cbiAgICAgICAgICBnZXRDb25zdGFudDxEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIGxvYWRpbmdDb25maWdJbmRleCkgOlxuICAgICAgICAgIG51bGwsXG4gICAgICBkZXBlbmRlbmN5UmVzb2x2ZXJGbjogZGVwZW5kZW5jeVJlc29sdmVyRm4gPz8gbnVsbCxcbiAgICAgIGxvYWRpbmdTdGF0ZTogRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQsXG4gICAgICBsb2FkaW5nUHJvbWlzZTogbnVsbCxcbiAgICB9O1xuXG4gICAgc2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCBhZGp1c3RlZEluZGV4LCBkZWZlckJsb2NrQ29uZmlnKTtcbiAgfVxuXG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF07XG5cbiAgLy8gSWYgaHlkcmF0aW9uIGlzIGVuYWJsZWQsIGxvb2tzIHVwIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhlIERPTVxuICAvLyB1c2luZyBoeWRyYXRpb24gYW5ub3RhdGlvbiBpbmZvIGFuZCBzdG9yZXMgdGhvc2Ugdmlld3Mgb24gTENvbnRhaW5lci5cbiAgLy8gSW4gY2xpZW50LW9ubHkgbW9kZSwgdGhpcyBmdW5jdGlvbiBpcyBhIG5vb3AuXG4gIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyKGxDb250YWluZXIsIHROb2RlLCBsVmlldyk7XG5cbiAgLy8gSW5pdCBpbnN0YW5jZS1zcGVjaWZpYyBkZWZlciBkZXRhaWxzIGFuZCBzdG9yZSBpdC5cbiAgY29uc3QgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscyA9IFtcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkVYVF9ERUZFUl9CTE9DS19TVEFURVxuICAgIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwsICAvLyBERUZFUl9CTE9DS19TVEFURVxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTVEFURV9JU19GUk9aRU5fVU5USUxcbiAgICBudWxsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXG4gIF07XG4gIHNldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgYWRqdXN0ZWRJbmRleCwgbERldGFpbHMpO1xufVxuXG4vKipcbiAqIExvYWRzIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyB3aGVuIGEgdHJpZ2dlciB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgdmFsdWUgPSBCb29sZWFuKHJhd1ZhbHVlKTsgIC8vIGhhbmRsZSB0cnV0aHkgb3IgZmFsc3kgdmFsdWVzXG4gICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UgJiYgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCkge1xuICAgICAgLy8gSWYgbm90aGluZyBpcyByZW5kZXJlZCB5ZXQsIHJlbmRlciBhIHBsYWNlaG9sZGVyIChpZiBkZWZpbmVkKS5cbiAgICAgIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgdmFsdWUgPT09IHRydWUgJiZcbiAgICAgICAgKHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwgfHxcbiAgICAgICAgIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikpIHtcbiAgICAgIC8vIFRoZSBgd2hlbmAgY29uZGl0aW9uIGhhcyBjaGFuZ2VkIHRvIGB0cnVlYCwgdHJpZ2dlciBkZWZlciBibG9jayBsb2FkaW5nXG4gICAgICAvLyBpZiB0aGUgYmxvY2sgaXMgZWl0aGVyIGluIGluaXRpYWwgKG5vdGhpbmcgaXMgcmVuZGVyZWQpIG9yIGEgcGxhY2Vob2xkZXJcbiAgICAgIC8vIHN0YXRlLlxuICAgICAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVmZXRjaGVzIHRoZSBkZWZlcnJlZCBjb250ZW50IHdoZW4gYSB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaFdoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG5cbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgaWYgKHZhbHVlID09PSB0cnVlICYmIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAgIC8vIElmIGxvYWRpbmcgaGFzIG5vdCBiZWVuIHN0YXJ0ZWQgeWV0LCB0cmlnZ2VyIGl0IG5vdy5cbiAgICAgIHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbklkbGUoKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25JZGxlKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbklkbGUoKSB7XG4gIHNjaGVkdWxlRGVsYXllZFByZWZldGNoaW5nKG9uSWRsZSwgRGVmZXJCbG9ja1RyaWdnZXJzLk9uSWRsZSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JbW1lZGlhdGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIFJlbmRlciBwbGFjZWhvbGRlciBibG9jayBvbmx5IGlmIGxvYWRpbmcgdGVtcGxhdGUgaXMgbm90IHByZXNlbnRcbiAgLy8gdG8gYXZvaWQgY29udGVudCBmbGlja2VyaW5nLCBzaW5jZSBpdCB3b3VsZCBiZSBpbW1lZGlhdGVseSByZXBsYWNlZFxuICAvLyBieSB0aGUgbG9hZGluZyBibG9jay5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXggPT09IG51bGwpIHtcbiAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICB9XG4gIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG59XG5cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgbG9hZGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkVHJpZ2dlcihvblRpbWVyKGRlbGF5KSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiB0aW1lcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgdGltZSB0byB3YWl0IGJlZm9yZSBwcmVmZXRjaGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uVGltZXIoZGVsYXk6IG51bWJlcikge1xuICBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhvblRpbWVyKGRlbGF5KSwgRGVmZXJCbG9ja1RyaWdnZXJzLk9uVGltZXIpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSG92ZXIsXG4gICAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW50ZXJhY3Rpb24odHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLFxuICAgICAgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHZpZXdwb3J0YCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPblZpZXdwb3J0KHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25WaWV3cG9ydCwgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblZpZXdwb3J0KHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvblZpZXdwb3J0LFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqKioqKioqKiogSGVscGVyIGZ1bmN0aW9ucyAqKioqKioqKioqL1xuXG4vKipcbiAqIFNjaGVkdWxlcyB0cmlnZ2VyaW5nIG9mIGEgZGVmZXIgYmxvY2sgZm9yIGBvbiBpZGxlYCBhbmQgYG9uIHRpbWVyYCBjb25kaXRpb25zLlxuICovXG5mdW5jdGlvbiBzY2hlZHVsZURlbGF5ZWRUcmlnZ2VyKFxuICAgIHNjaGVkdWxlRm46IChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pID0+IFZvaWRGdW5jdGlvbikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHNjaGVkdWxlRm4oKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSwgbFZpZXcsIHRydWUgLyogd2l0aExWaWV3Q2xlYW51cCAqLyk7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIHByZWZldGNoaW5nIGZvciBgb24gaWRsZWAgYW5kIGBvbiB0aW1lcmAgdHJpZ2dlcnMuXG4gKlxuICogQHBhcmFtIHNjaGVkdWxlRm4gQSBmdW5jdGlvbiB0aGF0IGRvZXMgdGhlIHNjaGVkdWxpbmcuXG4gKiBAcGFyYW0gdHJpZ2dlciBBIHRyaWdnZXIgdGhhdCBpbml0aWF0ZWQgc2NoZWR1bGluZy5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcoXG4gICAgc2NoZWR1bGVGbjogKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldywgd2l0aExWaWV3Q2xlYW51cDogYm9vbGVhbikgPT4gVm9pZEZ1bmN0aW9uLFxuICAgIHRyaWdnZXI6IERlZmVyQmxvY2tUcmlnZ2Vycykge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIC8vIFByZXZlbnQgc2NoZWR1bGluZyBtb3JlIHRoYW4gb25lIHByZWZldGNoIGluaXQgY2FsbFxuICAgIC8vIGZvciBlYWNoIGRlZmVyIGJsb2NrLiBGb3IgdGhpcyByZWFzb24gd2UgdXNlIG9ubHkgYSB0cmlnZ2VyXG4gICAgLy8gaWRlbnRpZmllciBpbiBhIGtleSwgc28gYWxsIGluc3RhbmNlcyB3b3VsZCB1c2UgdGhlIHNhbWUga2V5LlxuICAgIGNvbnN0IGtleSA9IFN0cmluZyh0cmlnZ2VyKTtcbiAgICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gICAgY29uc3QgbWFuYWdlciA9IGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpO1xuICAgIGlmICghbWFuYWdlci5oYXModERldGFpbHMsIGtleSkpIHtcbiAgICAgIC8vIEluIGNhc2Ugb2YgcHJlZmV0Y2hpbmcsIHdlIGludGVudGlvbmFsbHkgYXZvaWQgY2FuY2VsbGluZyByZXNvdXJjZSBsb2FkaW5nIGlmXG4gICAgICAvLyBhbiB1bmRlcmx5aW5nIExWaWV3IGdldCBkZXN0cm95ZWQgKHRodXMgcGFzc2luZyBgbnVsbGAgYXMgYSBzZWNvbmQgYXJndW1lbnQpLFxuICAgICAgLy8gYmVjYXVzZSB0aGVyZSBtaWdodCBiZSBvdGhlciBMVmlld3MgKHRoYXQgcmVwcmVzZW50IGVtYmVkZGVkIHZpZXdzKSB0aGF0XG4gICAgICAvLyBkZXBlbmQgb24gcmVzb3VyY2UgbG9hZGluZy5cbiAgICAgIGNvbnN0IHByZWZldGNoID0gKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSBzY2hlZHVsZUZuKHByZWZldGNoLCBsVmlldywgZmFsc2UgLyogd2l0aExWaWV3Q2xlYW51cCAqLyk7XG4gICAgICByZWdpc3RlclREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMsIGtleSwgY2xlYW51cEZuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IHRoZSBMVmlldyBpbiB3aGljaCBhIGRlZmVycmVkIGJsb2NrJ3MgdHJpZ2dlciBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSBkZWZlcnJlZEhvc3RMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXJyZWQgYmxvY2sgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSBkZWZlcnJlZFROb2RlIFROb2RlIGRlZmluaW5nIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAgaW4gdGhlIHZpZXcgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIncyB2aWV3LlxuICogICBBIG5lZ2F0aXZlIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBibG9jaydzIHBsYWNlaG9sZGVyLCB3aGlsZSBhbiB1bmRlZmluZWRcbiAqICAgdmFsdWUgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSBMVmlldyBhcyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIGdldFRyaWdnZXJMVmlldyhcbiAgICBkZWZlcnJlZEhvc3RMVmlldzogTFZpZXcsIGRlZmVycmVkVE5vZGU6IFROb2RlLCB3YWxrVXBUaW1lczogbnVtYmVyfHVuZGVmaW5lZCk6IExWaWV3fG51bGwge1xuICAvLyBUaGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSB2aWV3LCB3ZSBkb24ndCBuZWVkIHRvIHRyYXZlcnNlLlxuICBpZiAod2Fsa1VwVGltZXMgPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWZlcnJlZEhvc3RMVmlldztcbiAgfVxuXG4gIC8vIEEgcG9zaXRpdmUgdmFsdWUgb3IgemVybyBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluIGEgcGFyZW50IHZpZXcuXG4gIGlmICh3YWxrVXBUaW1lcyA+PSAwKSB7XG4gICAgcmV0dXJuIHdhbGtVcFZpZXdzKHdhbGtVcFRpbWVzLCBkZWZlcnJlZEhvc3RMVmlldyk7XG4gIH1cblxuICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVnYXRpdmUsIGl0IG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBwbGFjZWhvbGRlci5cbiAgY29uc3QgZGVmZXJyZWRDb250YWluZXIgPSBkZWZlcnJlZEhvc3RMVmlld1tkZWZlcnJlZFROb2RlLmluZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVmZXJyZWRDb250YWluZXIpO1xuICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBkZWZlcnJlZENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF0gPz8gbnVsbDtcblxuICAvLyBXZSBuZWVkIHRvIG51bGwgY2hlY2ssIGJlY2F1c2UgdGhlIHBsYWNlaG9sZGVyIG1pZ2h0IG5vdCBoYXZlIGJlZW4gcmVuZGVyZWQgeWV0LlxuICBpZiAobmdEZXZNb2RlICYmIHRyaWdnZXJMVmlldyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGRlZmVycmVkSG9zdExWaWV3LCBkZWZlcnJlZFROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICByZW5kZXJlZFN0YXRlLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsXG4gICAgICAgICdFeHBlY3RlZCBhIHBsYWNlaG9sZGVyIHRvIGJlIHJlbmRlcmVkIGluIHRoaXMgZGVmZXIgYmxvY2suJyk7XG4gICAgYXNzZXJ0TFZpZXcodHJpZ2dlckxWaWV3KTtcbiAgfVxuXG4gIHJldHVybiB0cmlnZ2VyTFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZWxlbWVudCB0aGF0IGEgZGVmZXJyZWQgYmxvY2sncyB0cmlnZ2VyIGlzIHBvaW50aW5nIHRvLlxuICogQHBhcmFtIHRyaWdnZXJMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgdHJpZ2dlciBpcyBkZWZpbmVkLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgdHJpZ2dlciBlbGVtZW50IHNob3VsZCd2ZSBiZWVuIHJlbmRlcmVkLlxuICovXG5mdW5jdGlvbiBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXc6IExWaWV3LCB0cmlnZ2VySW5kZXg6IG51bWJlcik6IEVsZW1lbnQge1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChIRUFERVJfT0ZGU0VUICsgdHJpZ2dlckluZGV4LCB0cmlnZ2VyTFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RWxlbWVudChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBET00tbm9kZSBiYXNlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGluaXRpYWxMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXIgYmxvY2sgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgcmVwcmVzZW50aW5nIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cC9kb3duIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIHJlZ2lzdGVyRm4gRnVuY3Rpb24gdGhhdCB3aWxsIHJlZ2lzdGVyIHRoZSBET00gZXZlbnRzLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciByZWNlaXZlcyB0aGUgZXZlbnQgdGhhdCBzaG91bGQgcmVuZGVyXG4gKiAgICAgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5mdW5jdGlvbiByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgaW5pdGlhbExWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCB0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM6IG51bWJlcnx1bmRlZmluZWQsXG4gICAgcmVnaXN0ZXJGbjogKGVsZW1lbnQ6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3RvcikgPT4gVm9pZEZ1bmN0aW9uLFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBpbml0aWFsTFZpZXdbSU5KRUNUT1JdITtcblxuICAvLyBBc3N1bXB0aW9uOiB0aGUgYGFmdGVyUmVuZGVyYCByZWZlcmVuY2Ugc2hvdWxkIGJlIGRlc3Ryb3llZFxuICAvLyBhdXRvbWF0aWNhbGx5IHNvIHdlIGRvbid0IG5lZWQgdG8ga2VlcCB0cmFjayBvZiBpdC5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJSZWYgPSBhZnRlclJlbmRlcigoKSA9PiB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaW5pdGlhbExWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcblxuICAgIC8vIElmIHRoZSBibG9jayB3YXMgbG9hZGVkIGJlZm9yZSB0aGUgdHJpZ2dlciB3YXMgcmVzb2x2ZWQsIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmcuXG4gICAgaWYgKHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwgJiZcbiAgICAgICAgcmVuZGVyZWRTdGF0ZSAhPT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKSB7XG4gICAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZ2V0VHJpZ2dlckxWaWV3KGluaXRpYWxMVmlldywgdE5vZGUsIHdhbGtVcFRpbWVzKTtcblxuICAgIC8vIEtlZXAgcG9sbGluZyB1bnRpbCB3ZSByZXNvbHZlIHRoZSB0cmlnZ2VyJ3MgTFZpZXcuXG4gICAgLy8gYGFmdGVyUmVuZGVyYCBzaG91bGQgc3RvcCBhdXRvbWF0aWNhbGx5IGlmIHRoZSB2aWV3IGlzIGRlc3Ryb3llZC5cbiAgICBpZiAoIXRyaWdnZXJMVmlldykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgdHJpZ2dlcidzIHZpZXcgd2FzIGRlc3Ryb3llZCBiZWZvcmUgd2UgcmVzb2x2ZWQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAgICBpZiAodHJpZ2dlckxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSB7XG4gICAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYWRkIGludGVncmF0aW9uIHdpdGggYERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcmAuXG4gICAgY29uc3QgZWxlbWVudCA9IGdldFRyaWdnZXJFbGVtZW50KHRyaWdnZXJMVmlldywgdHJpZ2dlckluZGV4KTtcbiAgICBjb25zdCBjbGVhbnVwID0gcmVnaXN0ZXJGbihlbGVtZW50LCAoKSA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcbiAgICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgICByZW1vdmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgICAgfVxuICAgICAgY2xlYW51cCgpO1xuICAgIH0sIGluamVjdG9yKTtcblxuICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICBzdG9yZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG5cbiAgICAvLyBTaW5jZSB0aGUgdHJpZ2dlciBhbmQgZGVmZXJyZWQgYmxvY2sgbWlnaHQgYmUgaW4gZGlmZmVyZW50XG4gICAgLy8gdmlld3MsIHdlIGhhdmUgdG8gcmVnaXN0ZXIgdGhlIGNhbGxiYWNrIGluIGJvdGggbG9jYXRpb25zLlxuICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgc3RvcmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgIH1cbiAgfSwge2luamVjdG9yfSk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIGEgYnJvd3NlciBiZWNvbWVzIGlkbGUuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCB3aGVuIGEgYnJvd3NlciBiZWNvbWVzIGlkbGUuXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgdGhhdCBob3N0cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHdpdGhMVmlld0NsZWFudXAgQSBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYSBzY2hlZHVsZWQgY2FsbGJhY2tcbiAqICAgICAgICAgICBzaG91bGQgYmUgY2FuY2VsbGVkIGluIGNhc2UgYW4gTFZpZXcgaXMgZGVzdHJveWVkIGJlZm9yZSBhIGNhbGxiYWNrXG4gKiAgICAgICAgICAgd2FzIGludm9rZWQuXG4gKi9cbmZ1bmN0aW9uIG9uSWRsZShjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCBzY2hlZHVsZXIgPSBpbmplY3Rvci5nZXQoT25JZGxlU2NoZWR1bGVyKTtcbiAgY29uc3QgY2xlYW51cEZuID0gKCkgPT4gc2NoZWR1bGVyLnJlbW92ZShjYWxsYmFjayk7XG4gIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9XG4gICAgICB3aXRoTFZpZXdDbGVhbnVwID8gd3JhcFdpdGhMVmlld0NsZWFudXAoY2FsbGJhY2ssIGxWaWV3LCBjbGVhbnVwRm4pIDogY2FsbGJhY2s7XG4gIHNjaGVkdWxlci5hZGQod3JhcHBlZENhbGxiYWNrKTtcbiAgcmV0dXJuIGNsZWFudXBGbjtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBjYXB0dXJlcyBhIHByb3ZpZGVkIGRlbGF5LlxuICogSW52b2tpbmcgdGhlIHJldHVybmVkIGZ1bmN0aW9uIHNjaGVkdWxlcyBhIHRyaWdnZXIuXG4gKi9cbmZ1bmN0aW9uIG9uVGltZXIoZGVsYXk6IG51bWJlcikge1xuICByZXR1cm4gKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldywgd2l0aExWaWV3Q2xlYW51cDogYm9vbGVhbikgPT5cbiAgICAgICAgICAgICBzY2hlZHVsZVRpbWVyVHJpZ2dlcihkZWxheSwgY2FsbGJhY2ssIGxWaWV3LCB3aXRoTFZpZXdDbGVhbnVwKTtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGFmdGVyIGEgZ2l2ZW4gdGltZW91dC5cbiAqXG4gKiBAcGFyYW0gZGVsYXkgQSBudW1iZXIgb2YgbXMgdG8gd2FpdCB1bnRpbCBmaXJpbmcgYSBjYWxsYmFjay5cbiAqIEBwYXJhbSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSB0aW1lb3V0LlxuICogQHBhcmFtIGxWaWV3IExWaWV3IHRoYXQgaG9zdHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB3aXRoTFZpZXdDbGVhbnVwIEEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGEgc2NoZWR1bGVkIGNhbGxiYWNrXG4gKiAgICAgICAgICAgc2hvdWxkIGJlIGNhbmNlbGxlZCBpbiBjYXNlIGFuIExWaWV3IGlzIGRlc3Ryb3llZCBiZWZvcmUgYSBjYWxsYmFja1xuICogICAgICAgICAgIHdhcyBpbnZva2VkLlxuICovXG5mdW5jdGlvbiBzY2hlZHVsZVRpbWVyVHJpZ2dlcihcbiAgICBkZWxheTogbnVtYmVyLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCBzY2hlZHVsZXIgPSBpbmplY3Rvci5nZXQoVGltZXJTY2hlZHVsZXIpO1xuICBjb25zdCBjbGVhbnVwRm4gPSAoKSA9PiBzY2hlZHVsZXIucmVtb3ZlKGNhbGxiYWNrKTtcbiAgY29uc3Qgd3JhcHBlZENhbGxiYWNrID1cbiAgICAgIHdpdGhMVmlld0NsZWFudXAgPyB3cmFwV2l0aExWaWV3Q2xlYW51cChjYWxsYmFjaywgbFZpZXcsIGNsZWFudXBGbikgOiBjYWxsYmFjaztcbiAgc2NoZWR1bGVyLmFkZChkZWxheSwgd3JhcHBlZENhbGxiYWNrKTtcbiAgcmV0dXJuIGNsZWFudXBGbjtcbn1cblxuLyoqXG4gKiBXcmFwcyBhIGdpdmVuIGNhbGxiYWNrIGludG8gYSBsb2dpYyB0aGF0IHJlZ2lzdGVycyBhIGNsZWFudXAgZnVuY3Rpb25cbiAqIGluIHRoZSBMVmlldyBjbGVhbnVwIHNsb3QsIHRvIGJlIGludm9rZWQgd2hlbiBhbiBMVmlldyBpcyBkZXN0cm95ZWQuXG4gKi9cbmZ1bmN0aW9uIHdyYXBXaXRoTFZpZXdDbGVhbnVwKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldywgY2xlYW51cDogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgY29uc3Qgd3JhcHBlZENhbGxiYWNrID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrKCk7XG4gICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kobFZpZXcsIGNsZWFudXApO1xuICB9O1xuICBzdG9yZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwKTtcbiAgcmV0dXJuIHdyYXBwZWRDYWxsYmFjaztcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgZGF0YSBzbG90IGluZGV4IGZvciBkZWZlciBibG9jayBpbmZvIChlaXRoZXIgc3RhdGljIG9yXG4gKiBpbnN0YW5jZS1zcGVjaWZpYyksIGdpdmVuIGFuIGluZGV4IG9mIGEgZGVmZXIgaW5zdHJ1Y3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4OiBudW1iZXIpIHtcbiAgLy8gSW5zdGFuY2Ugc3RhdGUgaXMgbG9jYXRlZCBhdCB0aGUgKm5leHQqIHBvc2l0aW9uXG4gIC8vIGFmdGVyIHRoZSBkZWZlciBibG9jayBzbG90IGluIGFuIExWaWV3IG9yIFRWaWV3LmRhdGEuXG4gIHJldHVybiBkZWZlckJsb2NrSW5kZXggKyAxO1xufVxuXG4vKiogUmV0cmlldmVzIGEgZGVmZXIgYmxvY2sgc3RhdGUgZnJvbSBhbiBMVmlldywgZ2l2ZW4gYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBibG9jay4gKi9cbmZ1bmN0aW9uIGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IExEZWZlckJsb2NrRGV0YWlscyB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KHROb2RlLmluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHJldHVybiBsVmlld1tzbG90SW5kZXhdO1xufVxuXG4vKiogU3RvcmVzIGEgZGVmZXIgYmxvY2sgaW5zdGFuY2Ugc3RhdGUgaW4gTFZpZXcuICovXG5mdW5jdGlvbiBzZXRMRGVmZXJCbG9ja0RldGFpbHMoXG4gICAgbFZpZXc6IExWaWV3LCBkZWZlckJsb2NrSW5kZXg6IG51bWJlciwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgbFZpZXdbc2xvdEluZGV4XSA9IGxEZXRhaWxzO1xufVxuXG4vKiogUmV0cmlldmVzIHN0YXRpYyBpbmZvIGFib3V0IGEgZGVmZXIgYmxvY2ssIGdpdmVuIGEgVFZpZXcgYW5kIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmxvY2suICovXG5mdW5jdGlvbiBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiBURGVmZXJCbG9ja0RldGFpbHMge1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KHROb2RlLmluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHJldHVybiB0Vmlldy5kYXRhW3Nsb3RJbmRleF0gYXMgVERlZmVyQmxvY2tEZXRhaWxzO1xufVxuXG4vKiogU3RvcmVzIGEgZGVmZXIgYmxvY2sgc3RhdGljIGluZm8gaW4gYFRWaWV3LmRhdGFgLiAqL1xuZnVuY3Rpb24gc2V0VERlZmVyQmxvY2tEZXRhaWxzKFxuICAgIHRWaWV3OiBUVmlldywgZGVmZXJCbG9ja0luZGV4OiBudW1iZXIsIGRlZmVyQmxvY2tDb25maWc6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICB0Vmlldy5kYXRhW3Nsb3RJbmRleF0gPSBkZWZlckJsb2NrQ29uZmlnO1xufVxuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgaG9zdExWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogbnVtYmVyfG51bGwge1xuICBjb25zdCB0VmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgc3dpdGNoIChuZXdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLnByaW1hcnlUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZzpcbiAgICAgIHJldHVybiB0RGV0YWlscy5sb2FkaW5nVG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkVycm9yOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLmVycm9yVG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLnBsYWNlaG9sZGVyVG1wbEluZGV4O1xuICAgIGRlZmF1bHQ6XG4gICAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcihgVW5leHBlY3RlZCBkZWZlciBibG9jayBzdGF0ZTogJHtuZXdTdGF0ZX1gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhIG1pbmltdW0gYW1vdW50IG9mIHRpbWUgdGhhdCBhIGdpdmVuIHN0YXRlIHNob3VsZCBiZSByZW5kZXJlZCBmb3IsXG4gKiB0YWtpbmcgaW50byBhY2NvdW50IGBtaW5pbXVtYCBwYXJhbWV0ZXIgdmFsdWUuIElmIHRoZSBgbWluaW11bWAgdmFsdWUgaXNcbiAqIG5vdCBzcGVjaWZpZWQgLSByZXR1cm5zIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TWluaW11bUR1cmF0aW9uRm9yU3RhdGUoXG4gICAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgY3VycmVudFN0YXRlOiBEZWZlckJsb2NrU3RhdGUpOiBudW1iZXJ8bnVsbCB7XG4gIGlmIChjdXJyZW50U3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikge1xuICAgIHJldHVybiB0RGV0YWlscy5wbGFjZWhvbGRlckJsb2NrQ29uZmlnPy5bTUlOSU1VTV9TTE9UXSA/PyBudWxsO1xuICB9IGVsc2UgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcpIHtcbiAgICByZXR1cm4gdERldGFpbHMubG9hZGluZ0Jsb2NrQ29uZmlnPy5bTUlOSU1VTV9TTE9UXSA/PyBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSB2YWx1ZSBvZiB0aGUgYGFmdGVyYCBwYXJhbWV0ZXIgb24gdGhlIEBsb2FkaW5nIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0TG9hZGluZ0Jsb2NrQWZ0ZXIodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscyk6IG51bWJlcnxudWxsIHtcbiAgcmV0dXJuIHREZXRhaWxzLmxvYWRpbmdCbG9ja0NvbmZpZz8uW0xPQURJTkdfQUZURVJfU0xPVF0gPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBUcmFuc2l0aW9ucyBhIGRlZmVyIGJsb2NrIHRvIHRoZSBuZXcgc3RhdGUuIFVwZGF0ZXMgdGhlICBuZWNlc3NhcnlcbiAqIGRhdGEgc3RydWN0dXJlcyBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBuZXdTdGF0ZSBOZXcgc3RhdGUgdGhhdCBzaG91bGQgYmUgYXBwbGllZCB0byB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgdE5vZGU6IFROb2RlLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGxDb250YWluZXJbUEFSRU5UXTtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcblxuICAvLyBDaGVjayBpZiB0aGlzIHZpZXcgaXMgbm90IGRlc3Ryb3llZC4gU2luY2UgdGhlIGxvYWRpbmcgcHJvY2VzcyB3YXMgYXN5bmMsXG4gIC8vIHRoZSB2aWV3IG1pZ2h0IGVuZCB1cCBiZWluZyBkZXN0cm95ZWQgYnkgdGhlIHRpbWUgcmVuZGVyaW5nIGhhcHBlbnMuXG4gIGlmIChpc0Rlc3Ryb3llZChob3N0TFZpZXcpKSByZXR1cm47XG5cbiAgLy8gTWFrZSBzdXJlIHRoaXMgVE5vZGUgYmVsb25ncyB0byBUVmlldyB0aGF0IHJlcHJlc2VudHMgaG9zdCBMVmlldy5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGhvc3RMVmlldyk7XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaG9zdExWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKGhvc3RUVmlldywgdE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxEZXRhaWxzLCAnRXhwZWN0ZWQgYSBkZWZlciBibG9jayBzdGF0ZSBkZWZpbmVkJyk7XG5cbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgY3VycmVudFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuXG4gIGlmICghaXNWYWxpZFN0YXRlQ2hhbmdlKGN1cnJlbnRTdGF0ZSwgbmV3U3RhdGUpIHx8XG4gICAgICAhaXNWYWxpZFN0YXRlQ2hhbmdlKGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID8/IC0xLCBuZXdTdGF0ZSkpXG4gICAgcmV0dXJuO1xuXG4gIGlmIChsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdID09PSBudWxsIHx8IGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPD0gbm93KSB7XG4gICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG51bGw7XG5cbiAgICBjb25zdCBsb2FkaW5nQWZ0ZXIgPSBnZXRMb2FkaW5nQmxvY2tBZnRlcih0RGV0YWlscyk7XG4gICAgY29uc3QgaW5Mb2FkaW5nQWZ0ZXJQaGFzZSA9IGxEZXRhaWxzW0xPQURJTkdfQUZURVJfQ0xFQU5VUF9GTl0gIT09IG51bGw7XG4gICAgaWYgKG5ld1N0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZyAmJiBsb2FkaW5nQWZ0ZXIgIT09IG51bGwgJiYgIWluTG9hZGluZ0FmdGVyUGhhc2UpIHtcbiAgICAgIC8vIFRyeWluZyB0byByZW5kZXIgbG9hZGluZywgYnV0IGl0IGhhcyBhbiBgYWZ0ZXJgIGNvbmZpZyxcbiAgICAgIC8vIHNvIHNjaGVkdWxlIGFuIHVwZGF0ZSBhY3Rpb24gYWZ0ZXIgYSB0aW1lb3V0LlxuICAgICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICAgIGNvbnN0IGNsZWFudXBGbiA9XG4gICAgICAgICAgc2NoZWR1bGVEZWZlckJsb2NrVXBkYXRlKGxvYWRpbmdBZnRlciwgbERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyLCBob3N0TFZpZXcpO1xuICAgICAgbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSA9IGNsZWFudXBGbjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgd2UgdHJhbnNpdGlvbiB0byBhIGNvbXBsZXRlIG9yIGFuIGVycm9yIHN0YXRlIGFuZCB0aGVyZSBpcyBhIHBlbmRpbmdcbiAgICAgIC8vIG9wZXJhdGlvbiB0byByZW5kZXIgbG9hZGluZyBhZnRlciBhIHRpbWVvdXQgLSBpbnZva2UgYSBjbGVhbnVwIG9wZXJhdGlvbixcbiAgICAgIC8vIHdoaWNoIHN0b3BzIHRoZSB0aW1lci5cbiAgICAgIGlmIChuZXdTdGF0ZSA+IERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nICYmIGluTG9hZGluZ0FmdGVyUGhhc2UpIHtcbiAgICAgICAgbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSEoKTtcbiAgICAgICAgbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSA9IG51bGw7XG4gICAgICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgYXBwbHlEZWZlckJsb2NrU3RhdGVUb0RvbShuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIGhvc3RMVmlldywgdE5vZGUpO1xuXG4gICAgICBjb25zdCBkdXJhdGlvbiA9IGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBuZXdTdGF0ZSk7XG4gICAgICBpZiAoZHVyYXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG5vdyArIGR1cmF0aW9uO1xuICAgICAgICBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUoZHVyYXRpb24sIGxEZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lciwgaG9zdExWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIHN0aWxsIHJlbmRlcmluZyB0aGUgcHJldmlvdXMgc3RhdGUuXG4gICAgLy8gVXBkYXRlIHRoZSBgTkVYVF9ERUZFUl9CTE9DS19TVEFURWAsIHdoaWNoIHdvdWxkIGJlXG4gICAgLy8gcGlja2VkIHVwIG9uY2UgaXQncyB0aW1lIHRvIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUuXG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhbiB1cGRhdGUgb3BlcmF0aW9uIGFmdGVyIGEgc3BlY2lmaWVkIHRpbWVvdXQuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVmZXJCbG9ja1VwZGF0ZShcbiAgICB0aW1lb3V0OiBudW1iZXIsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+KTogVm9pZEZ1bmN0aW9uIHtcbiAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV4dFN0YXRlID0gbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV07XG4gICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG51bGw7XG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBudWxsO1xuICAgIGlmIChuZXh0U3RhdGUgIT09IG51bGwpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShuZXh0U3RhdGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH07XG4gIC8vIFRPRE86IHRoaXMgbmVlZHMgcmVmYWN0b3JpbmcgdG8gbWFrZSBgVGltZXJTY2hlZHVsZXJgIHRoYXQgaXMgdXNlZCBpbnNpZGVcbiAgLy8gb2YgdGhlIGBzY2hlZHVsZVRpbWVyVHJpZ2dlcmAgZnVuY3Rpb24gdHJlZS1zaGFrYWJsZS5cbiAgcmV0dXJuIHNjaGVkdWxlVGltZXJUcmlnZ2VyKHRpbWVvdXQsIGNhbGxiYWNrLCBob3N0TFZpZXcsIHRydWUpO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHdlIGNhbiB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlLlxuICpcbiAqIFdlIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUgaWYgdGhlIHByZXZpb3VzIHN0YXRlIHdhcyByZXByZXNlbnRlZFxuICogd2l0aCBhIG51bWJlciB0aGF0IGlzIGxlc3MgdGhhbiB0aGUgbmV4dCBzdGF0ZS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjdXJyZW50XG4gKiBzdGF0ZSBpcyBcImxvYWRpbmdcIiAocmVwcmVzZW50ZWQgYXMgYDFgKSwgd2Ugc2hvdWxkIG5vdCBzaG93IGEgcGxhY2Vob2xkZXJcbiAqIChyZXByZXNlbnRlZCBhcyBgMGApLCBidXQgd2UgY2FuIHNob3cgYSBjb21wbGV0ZWQgc3RhdGUgKHJlcHJlc2VudGVkIGFzIGAyYClcbiAqIG9yIGFuIGVycm9yIHN0YXRlIChyZXByZXNlbnRlZCBhcyBgM2ApLlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkU3RhdGVDaGFuZ2UoXG4gICAgY3VycmVudFN0YXRlOiBEZWZlckJsb2NrU3RhdGV8RGVmZXJCbG9ja0ludGVybmFsU3RhdGUsIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIGN1cnJlbnRTdGF0ZSA8IG5ld1N0YXRlO1xufVxuXG4vKipcbiAqIEFwcGxpZXMgY2hhbmdlcyB0byB0aGUgRE9NIHRvIHJlZmxlY3QgYSBnaXZlbiBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlEZWZlckJsb2NrU3RhdGVUb0RvbShcbiAgICBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlLCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgIGhvc3RMVmlldzogTFZpZXc8dW5rbm93bj4sIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGF0ZVRtcGxJbmRleCA9IGdldFRlbXBsYXRlSW5kZXhGb3JTdGF0ZShuZXdTdGF0ZSwgaG9zdExWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHN0YXRlVG1wbEluZGV4ICE9PSBudWxsKSB7XG4gICAgbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdID0gbmV3U3RhdGU7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gc3RhdGVUbXBsSW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaG9zdFRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcblxuICAgIC8vIFRoZXJlIGlzIG9ubHkgMSB2aWV3IHRoYXQgY2FuIGJlIHByZXNlbnQgaW4gYW4gTENvbnRhaW5lciB0aGF0XG4gICAgLy8gcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLCBzbyBhbHdheXMgcmVmZXIgdG8gdGhlIGZpcnN0IG9uZS5cbiAgICBjb25zdCB2aWV3SW5kZXggPSAwO1xuXG4gICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyLCB2aWV3SW5kZXgpO1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcobENvbnRhaW5lciwgdE5vZGUudFZpZXchLnNzcklkKTtcbiAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhob3N0TFZpZXcsIHROb2RlLCBudWxsLCB7ZGVoeWRyYXRlZFZpZXd9KTtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgbENvbnRhaW5lciwgZW1iZWRkZWRMVmlldywgdmlld0luZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20odE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIHByZWZldGNoaW5nIG9mIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jay5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgbFZpZXc6IExWaWV3KSB7XG4gIGlmIChsVmlld1tJTkpFQ1RPUl0gJiYgc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2sobFZpZXdbSU5KRUNUT1JdISkpIHtcbiAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIGlmIHRoZSBwcm9jZXNzIGhhc24ndCBzdGFydGVkIHlldC5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgIT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gSWYgdGhlIGxvYWRpbmcgc3RhdHVzIGlzIGRpZmZlcmVudCBmcm9tIGluaXRpYWwgb25lLCBpdCBtZWFucyB0aGF0XG4gICAgLy8gdGhlIGxvYWRpbmcgb2YgZGVwZW5kZW5jaWVzIGlzIGluIHByb2dyZXNzIGFuZCB0aGVyZSBpcyBub3RoaW5nIHRvIGRvXG4gICAgLy8gaW4gdGhpcyBmdW5jdGlvbi4gQWxsIGRldGFpbHMgY2FuIGJlIG9idGFpbmVkIGZyb20gdGhlIGB0RGV0YWlsc2Agb2JqZWN0LlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHByaW1hcnlCbG9ja1ROb2RlID0gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXcsIHREZXRhaWxzKTtcblxuICAvLyBTd2l0Y2ggZnJvbSBOT1RfU1RBUlRFRCAtPiBJTl9QUk9HUkVTUyBzdGF0ZS5cbiAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M7XG5cbiAgLy8gQ2hlY2sgaWYgZGVwZW5kZW5jeSBmdW5jdGlvbiBpbnRlcmNlcHRvciBpcyBjb25maWd1cmVkLlxuICBjb25zdCBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA9XG4gICAgICBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3QgZGVwZW5kZW5jaWVzRm4gPSBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA/XG4gICAgICBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvci5pbnRlcmNlcHQodERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm4pIDpcbiAgICAgIHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuO1xuXG4gIC8vIFRoZSBgZGVwZW5kZW5jaWVzRm5gIG1pZ2h0IGJlIGBudWxsYCB3aGVuIGFsbCBkZXBlbmRlbmNpZXMgd2l0aGluXG4gIC8vIGEgZ2l2ZW4gZGVmZXIgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVmZXIgYmxvY2sgbWF5IGhhdmUgbXVsdGlwbGUgcHJlZmV0Y2ggdHJpZ2dlcnMuIE9uY2UgdGhlIGxvYWRpbmdcbiAgLy8gc3RhcnRzLCBpbnZva2UgYWxsIGNsZWFuIGZ1bmN0aW9ucywgc2luY2UgdGhleSBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbiAgaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yLCB0RGV0YWlscyk7XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID1cbiAgICAgICAgICAgIGFkZERlcHNUb1JlZ2lzdHJ5PERpcmVjdGl2ZURlZkxpc3Q+KHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCBkaXJlY3RpdmVEZWZzKTtcbiAgICAgIH1cbiAgICAgIGlmIChwaXBlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA9XG4gICAgICAgICAgICBhZGREZXBzVG9SZWdpc3RyeTxQaXBlRGVmTGlzdD4ocHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5LCBwaXBlRGVmcyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBBZGRzIGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzIGludG8gYSBkaXJlY3RpdmUgb3IgYSBwaXBlIHJlZ2lzdHJ5LFxuICogbWFraW5nIHN1cmUgdGhhdCBhIGRlcGVuZGVuY3kgZG9lc24ndCB5ZXQgZXhpc3QgaW4gdGhlIHJlZ2lzdHJ5LlxuICovXG5mdW5jdGlvbiBhZGREZXBzVG9SZWdpc3RyeTxUIGV4dGVuZHMgRGVwZW5kZW5jeURlZltdPihjdXJyZW50RGVwczogVHxudWxsLCBuZXdEZXBzOiBUKTogVCB7XG4gIGlmICghY3VycmVudERlcHMgfHwgY3VycmVudERlcHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ld0RlcHM7XG4gIH1cblxuICBjb25zdCBjdXJyZW50RGVwU2V0ID0gbmV3IFNldChjdXJyZW50RGVwcyk7XG4gIGZvciAoY29uc3QgZGVwIG9mIG5ld0RlcHMpIHtcbiAgICBjdXJyZW50RGVwU2V0LmFkZChkZXApO1xuICB9XG5cbiAgLy8gSWYgYGN1cnJlbnREZXBzYCBpcyB0aGUgc2FtZSBsZW5ndGgsIHRoZXJlIHdlcmUgbm8gbmV3IGRlcHMgYW5kIGNhblxuICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIGFycmF5LlxuICByZXR1cm4gKGN1cnJlbnREZXBzLmxlbmd0aCA9PT0gY3VycmVudERlcFNldC5zaXplKSA/IGN1cnJlbnREZXBzIDogQXJyYXkuZnJvbShjdXJyZW50RGVwU2V0KSBhcyBUO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgcGxhY2Vob2xkZXIgY29udGVudCAoaWYgcHJlc2VudCkgKi9cbmZ1bmN0aW9uIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsIHROb2RlLCBsQ29udGFpbmVyKTtcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIHRoZSBcImxvYWRpbmdcIiBQcm9taXNlIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgZGVmZXIgc3ViLWJsb2NrLFxuICogYmFzZWQgb24gdGhlIGxvYWRpbmcgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgUmVwcmVzZW50cyBkZWZlciBibG9jayBpbmZvIHNoYXJlZCBhY3Jvc3MgYWxsIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKFxuICAgIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UsICdFeHBlY3RlZCBsb2FkaW5nIFByb21pc2UgdG8gZXhpc3Qgb24gdGhpcyBkZWZlciBibG9jaycpO1xuXG4gIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlIS50aGVuKCgpID0+IHtcbiAgICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcblxuICAgICAgLy8gRXZlcnl0aGluZyBpcyBsb2FkZWQsIHNob3cgdGhlIHByaW1hcnkgYmxvY2sgY29udGVudFxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gICAgfSBlbHNlIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRCkge1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgbWFpbiBjb250ZW50IG9mIGEgZGVmZXIgYmxvY2suICovXG5mdW5jdGlvbiBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldzogVFZpZXcsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpOiBUQ29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgcmV0dXJuIGdldFROb2RlKHRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byB0cmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICogSWYgdGhlIGJsb2NrIGlzIGFscmVhZHkgaW4gYSBsb2FkaW5nLCBjb21wbGV0ZWQgb3IgYW4gZXJyb3Igc3RhdGUgLVxuICogbm8gYWRkaXRpb25hbCBhY3Rpb25zIGFyZSB0YWtlbi5cbiAqL1xuZnVuY3Rpb24gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgaWYgKCFzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICBzd2l0Y2ggKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcblxuICAgICAgLy8gVGhlIGBsb2FkaW5nU3RhdGVgIG1pZ2h0IGhhdmUgY2hhbmdlZCB0byBcImxvYWRpbmdcIi5cbiAgICAgIGlmICgodERldGFpbHMubG9hZGluZ1N0YXRlIGFzIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlKSA9PT1cbiAgICAgICAgICBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUykge1xuICAgICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTpcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRDpcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIHRocm93RXJyb3IoJ1Vua25vd24gZGVmZXIgYmxvY2sgc3RhdGUnKTtcbiAgICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFzc2VydHMgd2hldGhlciBhbGwgZGVwZW5kZW5jaWVzIGZvciBhIGRlZmVyIGJsb2NrIGFyZSBsb2FkZWQuXG4gKiBBbHdheXMgcnVuIHRoaXMgZnVuY3Rpb24gKGluIGRldiBtb2RlKSBiZWZvcmUgcmVuZGVyaW5nIGEgZGVmZXJcbiAqIGJsb2NrIGluIGNvbXBsZXRlZCBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBhc3NlcnRFcXVhbChcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSwgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUsXG4gICAgICAnRXhwZWN0aW5nIGFsbCBkZWZlcnJlZCBkZXBlbmRlbmNpZXMgdG8gYmUgbG9hZGVkLicpO1xufVxuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgYXZvaWQgcmVmZXJlbmNpbmcgaXQgaW4gYXBwbGljYXRpb24gY29kZS5cbiAqXG4gKiBEZXNjcmliZXMgYSBoZWxwZXIgY2xhc3MgdGhhdCBhbGxvd3MgdG8gaW50ZXJjZXB0IGEgY2FsbCB0byByZXRyaWV2ZSBjdXJyZW50XG4gKiBkZXBlbmRlbmN5IGxvYWRpbmcgZnVuY3Rpb24gYW5kIHJlcGxhY2UgaXQgd2l0aCBhIGRpZmZlcmVudCBpbXBsZW1lbnRhdGlvbi5cbiAqIFRoaXMgaW50ZXJjZXB0b3IgY2xhc3MgaXMgbmVlZGVkIHRvIGFsbG93IHRlc3RpbmcgYmxvY2tzIGluIGRpZmZlcmVudCBzdGF0ZXNcbiAqIGJ5IHNpbXVsYXRpbmcgbG9hZGluZyByZXNwb25zZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yIHtcbiAgLyoqXG4gICAqIEludm9rZWQgZm9yIGVhY2ggZGVmZXIgYmxvY2sgd2hlbiBkZXBlbmRlbmN5IGxvYWRpbmcgZnVuY3Rpb24gaXMgYWNjZXNzZWQuXG4gICAqL1xuICBpbnRlcmNlcHQoZGVwZW5kZW5jeUZuOiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsKTogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbDtcblxuICAvKipcbiAgICogQWxsb3dzIHRvIGNvbmZpZ3VyZSBhbiBpbnRlcmNlcHRvciBmdW5jdGlvbi5cbiAgICovXG4gIHNldEludGVyY2VwdG9yKGludGVyY2VwdG9yRm46IChjdXJyZW50OiBEZXBlbmRlbmN5UmVzb2x2ZXJGbikgPT4gRGVwZW5kZW5jeVJlc29sdmVyRm4pOiB2b2lkO1xufVxuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgYXZvaWQgcmVmZXJlbmNpbmcgaXQgaW4gYXBwbGljYXRpb24gY29kZS5cbiAqXG4gKiBJbmplY3RvciB0b2tlbiB0aGF0IGFsbG93cyB0byBwcm92aWRlIGBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yYCBjbGFzc1xuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcj4oXG4gICAgICAgIG5nRGV2TW9kZSA/ICdERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SJyA6ICcnKTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gdmFsdWUgbWF0Y2hlcyB0aGUgZXhwZWN0ZWQgc3RydWN0dXJlIG9mIGEgZGVmZXIgYmxvY2tcbiAqXG4gKiBXZSBjYW4gc2FmZWx5IHJlbHkgb24gdGhlIHByaW1hcnlUbXBsSW5kZXggYmVjYXVzZSBldmVyeSBkZWZlciBibG9jayByZXF1aXJlc1xuICogdGhhdCBhIHByaW1hcnkgdGVtcGxhdGUgZXhpc3RzLiBBbGwgdGhlIG90aGVyIHRlbXBsYXRlIG9wdGlvbnMgYXJlIG9wdGlvbmFsLlxuICovXG5mdW5jdGlvbiBpc1REZWZlckJsb2NrRGV0YWlscyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFREZWZlckJsb2NrRGV0YWlscyB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgJiZcbiAgICAgICh0eXBlb2YgKHZhbHVlIGFzIFREZWZlckJsb2NrRGV0YWlscykucHJpbWFyeVRtcGxJbmRleCA9PT0gJ251bWJlcicpO1xufVxuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHVzZWQgZm9yIGNvbmZpZ3VyaW5nIGRlZmVyIGJsb2NrIGJlaGF2aW9yLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfQ09ORklHID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0NvbmZpZz4obmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0NPTkZJRycgOiAnJyk7XG5cbi8qKlxuICogRGVmZXIgYmxvY2sgaW5zdGFuY2UgZm9yIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmZXJCbG9ja0RldGFpbHMge1xuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBsVmlldzogTFZpZXc7XG4gIHROb2RlOiBUTm9kZTtcbiAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscztcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrcyBpbiBhIGdpdmVuIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsVmlldyBsVmlldyB3aXRoIGRlZmVyIGJsb2Nrc1xuICogQHBhcmFtIGRlZmVyQmxvY2tzIGRlZmVyIGJsb2NrIGFnZ3JlZ2F0b3IgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmVyQmxvY2tzKGxWaWV3OiBMVmlldywgZGVmZXJCbG9ja3M6IERlZmVyQmxvY2tEZXRhaWxzW10pIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbaV07XG4gICAgICAvLyBBbiBMQ29udGFpbmVyIG1heSByZXByZXNlbnQgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jaywgaW4gd2hpY2ggY2FzZVxuICAgICAgLy8gd2Ugc3RvcmUgaXQgYXMgYSByZXN1bHQuIE90aGVyd2lzZSwga2VlcCBpdGVyYXRpbmcgb3ZlciBMQ29udGFpbmVyIHZpZXdzIGFuZFxuICAgICAgLy8gbG9vayBmb3IgZGVmZXIgYmxvY2tzLlxuICAgICAgY29uc3QgaXNMYXN0ID0gaSA9PT0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggLSAxO1xuICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgICAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgICAgICBpZiAoaXNURGVmZXJCbG9ja0RldGFpbHModERldGFpbHMpKSB7XG4gICAgICAgICAgZGVmZXJCbG9ja3MucHVzaCh7bENvbnRhaW5lciwgbFZpZXcsIHROb2RlLCB0RGV0YWlsc30pO1xuICAgICAgICAgIC8vIFRoaXMgTENvbnRhaW5lciByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2ssIHNvIHdlIGV4aXRcbiAgICAgICAgICAvLyB0aGlzIGl0ZXJhdGlvbiBhbmQgZG9uJ3QgaW5zcGVjdCB2aWV3cyBpbiB0aGlzIExDb250YWluZXIuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZ2V0RGVmZXJCbG9ja3MobENvbnRhaW5lcltpXSBhcyBMVmlldywgZGVmZXJCbG9ja3MpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNMVmlldyhsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGVudGVyIHRoZSBgZ2V0RGVmZXJCbG9ja3NgIHJlY3Vyc2l2ZWx5LlxuICAgICAgZ2V0RGVmZXJCbG9ja3MobFZpZXdbaV0sIGRlZmVyQmxvY2tzKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBjbGVhbnVwIGZ1bmN0aW9uIGFzc29jaWF0ZWQgd2l0aCBhIHByZWZldGNoaW5nIHRyaWdnZXJcbiAqIG9mIGEgZ2l2ZW4gZGVmZXIgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIHJlZ2lzdGVyVERldGFpbHNDbGVhbnVwKFxuICAgIGluamVjdG9yOiBJbmplY3RvciwgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcsIGNsZWFudXBGbjogVm9pZEZ1bmN0aW9uKSB7XG4gIGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpLmFkZCh0RGV0YWlscywga2V5LCBjbGVhbnVwRm4pO1xufVxuXG4vKipcbiAqIEludm9rZXMgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggY2xlYW51cCB0cmlnZ2Vyc1xuICogYW5kIHJlbW92ZXMgYWxsIGNsZWFudXAgZnVuY3Rpb25zIGFmdGVyd2FyZHMuXG4gKi9cbmZ1bmN0aW9uIGludm9rZVREZXRhaWxzQ2xlYW51cChpbmplY3RvcjogSW5qZWN0b3IsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuY2xlYW51cCh0RGV0YWlscyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgc2VydmljZSB0byBrZWVwIHRyYWNrIG9mIGNsZWFudXAgZnVuY3Rpb25zIGFzc29jaWF0ZWRcbiAqIHdpdGggZGVmZXIgYmxvY2tzLiBUaGlzIGNsYXNzIGlzIHVzZWQgdG8gbWFuYWdlIGNsZWFudXAgZnVuY3Rpb25zXG4gKiBjcmVhdGVkIGZvciBwcmVmZXRjaGluZyB0cmlnZ2Vycy5cbiAqL1xuY2xhc3MgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBibG9ja3MgPSBuZXcgTWFwPFREZWZlckJsb2NrRGV0YWlscywgTWFwPHN0cmluZywgVm9pZEZ1bmN0aW9uW10+PigpO1xuXG4gIGFkZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGlmICghdGhpcy5ibG9ja3MuaGFzKHREZXRhaWxzKSkge1xuICAgICAgdGhpcy5ibG9ja3Muc2V0KHREZXRhaWxzLCBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscykhO1xuICAgIGlmICghYmxvY2suaGFzKGtleSkpIHtcbiAgICAgIGJsb2NrLnNldChrZXksIFtdKTtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2tzID0gYmxvY2suZ2V0KGtleSkhO1xuICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGhhcyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk/LmhhcyhrZXkpO1xuICB9XG5cbiAgY2xlYW51cCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpO1xuICAgIGlmIChibG9jaykge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFja3Mgb2YgT2JqZWN0LnZhbHVlcyhibG9jaykpIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBjYWxsYmFja3MpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmJsb2Nrcy5kZWxldGUodERldGFpbHMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGZvciAoY29uc3QgW2Jsb2NrXSBvZiB0aGlzLmJsb2Nrcykge1xuICAgICAgdGhpcy5jbGVhbnVwKGJsb2NrKTtcbiAgICB9XG4gICAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcigpLFxuICB9KTtcbn1cblxuLyoqXG4gKiBVc2Ugc2hpbXMgZm9yIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgYW5kIGBjYW5jZWxJZGxlQ2FsbGJhY2tgIGZ1bmN0aW9ucyBmb3JcbiAqIGVudmlyb25tZW50cyB3aGVyZSB0aG9zZSBmdW5jdGlvbnMgYXJlIG5vdCBhdmFpbGFibGUgKGUuZy4gTm9kZS5qcyBhbmQgU2FmYXJpKS5cbiAqXG4gKiBOb3RlOiB3ZSB3cmFwIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgY2FsbCBpbnRvIGEgZnVuY3Rpb24sIHNvIHRoYXQgaXQgY2FuIGJlXG4gKiBvdmVycmlkZGVuL21vY2tlZCBpbiB0ZXN0IGVudmlyb25tZW50IGFuZCBwaWNrZWQgdXAgYnkgdGhlIHJ1bnRpbWUgY29kZS5cbiAqL1xuY29uc3QgX3JlcXVlc3RJZGxlQ2FsbGJhY2sgPSAoKSA9PlxuICAgIHR5cGVvZiByZXF1ZXN0SWRsZUNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyA/IHJlcXVlc3RJZGxlQ2FsbGJhY2sgOiBzZXRUaW1lb3V0O1xuY29uc3QgX2NhbmNlbElkbGVDYWxsYmFjayA9ICgpID0+XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gY2FuY2VsSWRsZUNhbGxiYWNrIDogY2xlYXJUaW1lb3V0O1xuXG4vKipcbiAqIEhlbHBlciBzZXJ2aWNlIHRvIHNjaGVkdWxlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYHMgZm9yIGJhdGNoZXMgb2YgZGVmZXIgYmxvY2tzLFxuICogdG8gYXZvaWQgY2FsbGluZyBgcmVxdWVzdElkbGVDYWxsYmFja2AgZm9yIGVhY2ggZGVmZXIgYmxvY2sgKGUuZy4gaWZcbiAqIGRlZmVyIGJsb2NrcyBhcmUgZGVmaW5lZCBpbnNpZGUgYSBmb3IgbG9vcCkuXG4gKi9cbmNsYXNzIE9uSWRsZVNjaGVkdWxlciB7XG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIGN1cnJlbnQgY2FsbGJhY2tzIGFyZSBiZWluZyBpbnZva2VkLlxuICBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvLyBDdXJyZW50bHkgc2NoZWR1bGVkIGlkbGUgY2FsbGJhY2sgaWQuXG4gIGlkbGVJZDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIC8vIFNldCBvZiBjYWxsYmFja3MgdG8gYmUgaW52b2tlZCBuZXh0LlxuICBjdXJyZW50ID0gbmV3IFNldDxWb2lkRnVuY3Rpb24+KCk7XG5cbiAgLy8gU2V0IG9mIGNhbGxiYWNrcyBjb2xsZWN0ZWQgd2hpbGUgaW52b2tpbmcgY3VycmVudCBzZXQgb2YgY2FsbGJhY2tzLlxuICAvLyBUaG9zZSBjYWxsYmFja3MgYXJlIHNjaGVkdWxlZCBmb3IgdGhlIG5leHQgaWRsZSBwZXJpb2QuXG4gIGRlZmVycmVkID0gbmV3IFNldDxWb2lkRnVuY3Rpb24+KCk7XG5cbiAgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG5cbiAgcmVxdWVzdElkbGVDYWxsYmFjayA9IF9yZXF1ZXN0SWRsZUNhbGxiYWNrKCkuYmluZChnbG9iYWxUaGlzKTtcbiAgY2FuY2VsSWRsZUNhbGxiYWNrID0gX2NhbmNlbElkbGVDYWxsYmFjaygpLmJpbmQoZ2xvYmFsVGhpcyk7XG5cbiAgYWRkKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWQgOiB0aGlzLmN1cnJlbnQ7XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gICAgaWYgKHRoaXMuaWRsZUlkID09PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlSWRsZUNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICB0aGlzLmN1cnJlbnQuZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlSWRsZUNhbGxiYWNrKCkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgdGhpcy5jYW5jZWxJZGxlQ2FsbGJhY2sodGhpcy5pZGxlSWQhKTtcbiAgICAgIHRoaXMuaWRsZUlkID0gbnVsbDtcblxuICAgICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuXG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY3VycmVudCkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5jdXJyZW50LmNsZWFyKCk7XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgY2FsbGJhY2tzIGFkZGVkIGR1cmluZyBhbiBpbnZvY2F0aW9uXG4gICAgICAvLyBvZiB0aGUgY3VycmVudCBvbmVzIC0gbWFrZSB0aGVtIFwiY3VycmVudFwiIGFuZCBzY2hlZHVsZVxuICAgICAgLy8gYSBuZXcgaWRsZSBjYWxsYmFjay5cbiAgICAgIGlmICh0aGlzLmRlZmVycmVkLnNpemUgPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZCkge1xuICAgICAgICAgIHRoaXMuY3VycmVudC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZUlkbGVDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGNhbGxiYWNrIHJ1bnMgaW4gdGhlIE5nWm9uZSBzaW5jZVxuICAgIC8vIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgaXMgbm90IGN1cnJlbnRseSBwYXRjaGVkIGJ5IFpvbmUuanMuXG4gICAgdGhpcy5pZGxlSWQgPSB0aGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4gdGhpcy5uZ1pvbmUucnVuKGNhbGxiYWNrKSkgYXMgbnVtYmVyO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuaWRsZUlkICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNhbmNlbElkbGVDYWxsYmFjayh0aGlzLmlkbGVJZCk7XG4gICAgICB0aGlzLmlkbGVJZCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudC5jbGVhcigpO1xuICAgIHRoaXMuZGVmZXJyZWQuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IE9uSWRsZVNjaGVkdWxlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IE9uSWRsZVNjaGVkdWxlcigpLFxuICB9KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgc2VydmljZSB0byBzY2hlZHVsZSBgc2V0VGltZW91dGBzIGZvciBiYXRjaGVzIG9mIGRlZmVyIGJsb2NrcyxcbiAqIHRvIGF2b2lkIGNhbGxpbmcgYHNldFRpbWVvdXRgIGZvciBlYWNoIGRlZmVyIGJsb2NrIChlLmcuIGlmIGRlZmVyIGJsb2Nrc1xuICogYXJlIGNyZWF0ZWQgaW5zaWRlIGEgZm9yIGxvb3ApLlxuICovXG5jbGFzcyBUaW1lclNjaGVkdWxlciB7XG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIGN1cnJlbnQgY2FsbGJhY2tzIGFyZSBiZWluZyBpbnZva2VkLlxuICBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvLyBDdXJyZW50bHkgc2NoZWR1bGVkIGBzZXRUaW1lb3V0YCBpZC5cbiAgdGltZW91dElkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgLy8gV2hlbiBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVyIHdvdWxkIGZpcmUuXG4gIGludm9rZVRpbWVyQXQ6IG51bWJlcnxudWxsID0gbnVsbDtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyB0byBiZSBpbnZva2VkLlxuICAvLyBGb3IgZWFjaCBjYWxsYmFjayB3ZSBhbHNvIHN0b3JlIGEgdGltZXN0YW1wIG9uIHdoZW4gdGhlIGNhbGxiYWNrXG4gIC8vIHNob3VsZCBiZSBpbnZva2VkLiBXZSBzdG9yZSB0aW1lc3RhbXBzIGFuZCBjYWxsYmFjayBmdW5jdGlvbnNcbiAgLy8gaW4gYSBmbGF0IGFycmF5IHRvIGF2b2lkIGNyZWF0aW5nIG5ldyBvYmplY3RzIGZvciBlYWNoIGVudHJ5LlxuICAvLyBbdGltZXN0YW1wMSwgY2FsbGJhY2sxLCB0aW1lc3RhbXAyLCBjYWxsYmFjazIsIC4uLl1cbiAgY3VycmVudDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4gPSBbXTtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyBjb2xsZWN0ZWQgd2hpbGUgaW52b2tpbmcgY3VycmVudCBzZXQgb2YgY2FsbGJhY2tzLlxuICAvLyBUaG9zZSBjYWxsYmFja3MgYXJlIGFkZGVkIHRvIHRoZSBcImN1cnJlbnRcIiBxdWV1ZSBhdCB0aGUgZW5kIG9mXG4gIC8vIHRoZSBjdXJyZW50IGNhbGxiYWNrIGludm9jYXRpb24uIFRoZSBzaGFwZSBvZiB0aGlzIGxpc3QgaXMgdGhlIHNhbWVcbiAgLy8gYXMgdGhlIHNoYXBlIG9mIHRoZSBgY3VycmVudGAgbGlzdC5cbiAgZGVmZXJyZWQ6IEFycmF5PG51bWJlcnxWb2lkRnVuY3Rpb24+ID0gW107XG5cbiAgYWRkKGRlbGF5OiBudW1iZXIsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWQgOiB0aGlzLmN1cnJlbnQ7XG4gICAgdGhpcy5hZGRUb1F1ZXVlKHRhcmdldCwgRGF0ZS5ub3coKSArIGRlbGF5LCBjYWxsYmFjayk7XG4gICAgdGhpcy5zY2hlZHVsZVRpbWVyKCk7XG4gIH1cblxuICByZW1vdmUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGNvbnN0IGNhbGxiYWNrSW5kZXggPSB0aGlzLnJlbW92ZUZyb21RdWV1ZSh0aGlzLmN1cnJlbnQsIGNhbGxiYWNrKTtcbiAgICBpZiAoY2FsbGJhY2tJbmRleCA9PT0gLTEpIHtcbiAgICAgIC8vIFRyeSBjbGVhbmluZyB1cCBkZWZlcnJlZCBxdWV1ZSBvbmx5IGluIGNhc2VcbiAgICAgIC8vIHdlIGRpZG4ndCBmaW5kIGEgY2FsbGJhY2sgaW4gdGhlIFwiY3VycmVudFwiIHF1ZXVlLlxuICAgICAgdGhpcy5yZW1vdmVGcm9tUXVldWUodGhpcy5kZWZlcnJlZCwgY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkVG9RdWV1ZSh0YXJnZXQ6IEFycmF5PG51bWJlcnxWb2lkRnVuY3Rpb24+LCBpbnZva2VBdDogbnVtYmVyLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgbGV0IGluc2VydEF0SW5kZXggPSB0YXJnZXQubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbnZva2VRdWV1ZWRDYWxsYmFja0F0ID0gdGFyZ2V0W2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChpbnZva2VRdWV1ZWRDYWxsYmFja0F0ID4gaW52b2tlQXQpIHtcbiAgICAgICAgLy8gV2UndmUgcmVhY2hlZCBhIGZpcnN0IHRpbWVyIHRoYXQgaXMgc2NoZWR1bGVkXG4gICAgICAgIC8vIGZvciBhIGxhdGVyIHRpbWUgdGhhbiB3aGF0IHdlIGFyZSB0cnlpbmcgdG8gaW5zZXJ0LlxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb2NhdGlvbiBhdCB3aGljaCB3ZSBuZWVkIHRvIGluc2VydCxcbiAgICAgICAgLy8gbm8gbmVlZCB0byBpdGVyYXRlIGZ1cnRoZXIuXG4gICAgICAgIGluc2VydEF0SW5kZXggPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgYXJyYXlJbnNlcnQyKHRhcmdldCwgaW5zZXJ0QXRJbmRleCwgaW52b2tlQXQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlRnJvbVF1ZXVlKHRhcmdldDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4sIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBsZXQgaW5kZXggPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVldWVkQ2FsbGJhY2sgPSB0YXJnZXRbaSArIDFdO1xuICAgICAgaWYgKHF1ZXVlZENhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgLy8gUmVtb3ZlIDIgZWxlbWVudHM6IGEgdGltZXN0YW1wIHNsb3QgYW5kXG4gICAgICAvLyB0aGUgZm9sbG93aW5nIHNsb3Qgd2l0aCBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgYXJyYXlTcGxpY2UodGFyZ2V0LCBpbmRleCwgMik7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVUaW1lcigpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9ICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCEpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuXG4gICAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG5cbiAgICAgIC8vIEludm9rZSBjYWxsYmFja3MgdGhhdCB3ZXJlIHNjaGVkdWxlZCB0byBydW5cbiAgICAgIC8vIGJlZm9yZSB0aGUgY3VycmVudCB0aW1lLlxuICAgICAgbGV0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICBsZXQgbGFzdENhbGxiYWNrSW5kZXg6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGNvbnN0IGludm9rZUF0ID0gdGhpcy5jdXJyZW50W2ldIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLmN1cnJlbnRbaSArIDFdIGFzIFZvaWRGdW5jdGlvbjtcbiAgICAgICAgaWYgKGludm9rZUF0IDw9IG5vdykge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgLy8gUG9pbnQgYXQgdGhlIGludm9rZWQgY2FsbGJhY2sgZnVuY3Rpb24sIHdoaWNoIGlzIGxvY2F0ZWRcbiAgICAgICAgICAvLyBhZnRlciB0aGUgdGltZXN0YW1wLlxuICAgICAgICAgIGxhc3RDYWxsYmFja0luZGV4ID0gaSArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV2UndmUgcmVhY2hlZCBhIHRpbWVyIHRoYXQgc2hvdWxkIG5vdCBiZSBpbnZva2VkIHlldC5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxhc3RDYWxsYmFja0luZGV4ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIElmIGxhc3QgY2FsbGJhY2sgaW5kZXggaXMgYG51bGxgIC0gbm8gY2FsbGJhY2tzIHdlcmUgaW52b2tlZCxcbiAgICAgICAgLy8gc28gbm8gY2xlYW51cCBpcyBuZWVkZWQuIE90aGVyd2lzZSwgcmVtb3ZlIGludm9rZWQgY2FsbGJhY2tzXG4gICAgICAgIC8vIGZyb20gdGhlIHF1ZXVlLlxuICAgICAgICBhcnJheVNwbGljZSh0aGlzLmN1cnJlbnQsIDAsIGxhc3RDYWxsYmFja0luZGV4ICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgY2FsbGJhY2tzIGFkZGVkIGR1cmluZyBhbiBpbnZvY2F0aW9uXG4gICAgICAvLyBvZiB0aGUgY3VycmVudCBvbmVzIC0gbW92ZSB0aGVtIG92ZXIgdG8gdGhlIFwiY3VycmVudFwiXG4gICAgICAvLyBxdWV1ZS5cbiAgICAgIGlmICh0aGlzLmRlZmVycmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRlZmVycmVkLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmRlZmVycmVkW2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuZGVmZXJyZWRbaSArIDFdIGFzIFZvaWRGdW5jdGlvbjtcbiAgICAgICAgICB0aGlzLmFkZFRvUXVldWUodGhpcy5jdXJyZW50LCBpbnZva2VBdCwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWQubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2NoZWR1bGVUaW1lcigpO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCBydW5uaW5nIHRpbWVyIGNhbGxiYWNrcyBtb3JlIHRoYW4gb25jZSBwZXJcbiAgICAvLyBhdmVyYWdlIGZyYW1lIGR1cmF0aW9uLiBUaGlzIGlzIG5lZWRlZCBmb3IgYmV0dGVyXG4gICAgLy8gYmF0Y2hpbmcgYW5kIHRvIGF2b2lkIGtpY2tpbmcgb2ZmIGV4Y2Vzc2l2ZSBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24gY3ljbGVzLlxuICAgIGNvbnN0IEZSQU1FX0RVUkFUSU9OX01TID0gMTY7ICAvLyAxMDAwbXMgLyA2MGZwc1xuXG4gICAgaWYgKHRoaXMuY3VycmVudC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgcXVldWUgcG9pbnRzIGF0IHRoZSB0aW1lc3RhbXBcbiAgICAgIC8vIG9mIHRoZSBmaXJzdCAoZWFybGllc3QpIGV2ZW50LlxuICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmN1cnJlbnRbMF0gYXMgbnVtYmVyO1xuICAgICAgaWYgKCF0aGlzLnRpbWVvdXRJZCB8fFxuICAgICAgICAgIC8vIFJlc2NoZWR1bGUgYSB0aW1lciBpbiBjYXNlIGEgcXVldWUgY29udGFpbnMgYW4gaXRlbSB3aXRoXG4gICAgICAgICAgLy8gYW4gZWFybGllciB0aW1lc3RhbXAgYW5kIHRoZSBkZWx0YSBpcyBtb3JlIHRoYW4gYW4gYXZlcmFnZVxuICAgICAgICAgIC8vIGZyYW1lIGR1cmF0aW9uLlxuICAgICAgICAgICh0aGlzLmludm9rZVRpbWVyQXQgJiYgKHRoaXMuaW52b2tlVGltZXJBdCAtIGludm9rZUF0ID4gRlJBTUVfRFVSQVRJT05fTVMpKSkge1xuICAgICAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBUaGVyZSB3YXMgYSB0aW1lb3V0IGFscmVhZHksIGJ1dCBhbiBlYXJsaWVyIGV2ZW50IHdhcyBhZGRlZFxuICAgICAgICAgIC8vIGludG8gdGhlIHF1ZXVlLiBJbiB0aGlzIGNhc2Ugd2UgZHJvcCBhbiBvbGQgdGltZXIgYW5kIHNldHVwXG4gICAgICAgICAgLy8gYSBuZXcgb25lIHdpdGggYW4gdXBkYXRlZCAoc21hbGxlcikgdGltZW91dC5cbiAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTWF0aC5tYXgoaW52b2tlQXQgLSBub3csIEZSQU1FX0RVUkFUSU9OX01TKTtcbiAgICAgICAgdGhpcy5pbnZva2VUaW1lckF0ID0gaW52b2tlQXQ7XG4gICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dChjYWxsYmFjaywgdGltZW91dCkgYXMgdW5rbm93biBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMudGltZW91dElkICE9PSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnQubGVuZ3RoID0gMDtcbiAgICB0aGlzLmRlZmVycmVkLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBUaW1lclNjaGVkdWxlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IFRpbWVyU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuIl19