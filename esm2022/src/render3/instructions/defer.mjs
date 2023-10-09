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
import { markViewDirty } from './mark_view_dirty';
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
        markViewDirty(embeddedLView);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBWSxrQkFBa0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsbUNBQW1DLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNwRixPQUFPLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN4RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3JHLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDM0MsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBb0IsdUJBQXVCLEVBQUUsZUFBZSxFQUFzQiw2QkFBNkIsRUFBd0csd0JBQXdCLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFxQixNQUFNLHFC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IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi8uLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcn0gZnJvbSAnLi4vLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2FycmF5SW5zZXJ0MiwgYXJyYXlTcGxpY2V9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFbGVtZW50LCBhc3NlcnRFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUnO1xuaW1wb3J0IHthZnRlclJlbmRlcn0gZnJvbSAnLi4vYWZ0ZXJfcmVuZGVyX2hvb2tzJztcbmltcG9ydCB7YXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSwgYXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7REVGRVJfQkxPQ0tfU1RBVEUsIERlZmVyQmxvY2tCZWhhdmlvciwgRGVmZXJCbG9ja0NvbmZpZywgRGVmZXJCbG9ja0ludGVybmFsU3RhdGUsIERlZmVyQmxvY2tTdGF0ZSwgRGVmZXJCbG9ja1RyaWdnZXJzLCBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSwgRGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWcsIERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZywgRGVwZW5kZW5jeVJlc29sdmVyRm4sIExEZWZlckJsb2NrRGV0YWlscywgTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOLCBMT0FESU5HX0FGVEVSX1NMT1QsIE1JTklNVU1fU0xPVCwgTkVYVF9ERUZFUl9CTE9DS19TVEFURSwgU1RBVEVfSVNfRlJPWkVOX1VOVElMLCBURGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmZXInO1xuaW1wb3J0IHtEZXBlbmRlbmN5RGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0Rlc3Ryb3llZCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBUVklFVywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkVE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0VE5vZGUsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95LCB3YWxrVXBWaWV3c30gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vdmlld19tYW5pcHVsYXRpb24nO1xuXG5pbXBvcnQge29uSG92ZXIsIG9uSW50ZXJhY3Rpb24sIG9uVmlld3BvcnR9IGZyb20gJy4vZGVmZXJfZXZlbnRzJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9tYXJrX3ZpZXdfZGlydHknO1xuaW1wb3J0IHvJtcm1dGVtcGxhdGV9IGZyb20gJy4vdGVtcGxhdGUnO1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBkZWZlciBibG9ja3Mgc2hvdWxkIGJlIHRyaWdnZXJlZC5cbiAqXG4gKiBDdXJyZW50bHksIGRlZmVyIGJsb2NrcyBhcmUgbm90IHRyaWdnZXJlZCBvbiB0aGUgc2VydmVyLFxuICogb25seSBwbGFjZWhvbGRlciBjb250ZW50IGlzIHJlbmRlcmVkIChpZiBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yOiBJbmplY3Rvcik6IGJvb2xlYW4ge1xuICBjb25zdCBjb25maWcgPSBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfQ09ORklHLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgaWYgKGNvbmZpZz8uYmVoYXZpb3IgPT09IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciBkZWZlciBibG9ja3MuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBgZGVmZXJgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIHByaW1hcnlUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHByaW1hcnkgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmN5UmVzb2x2ZXJGbiBGdW5jdGlvbiB0aGF0IGNvbnRhaW5zIGRlcGVuZGVuY2llcyBmb3IgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsb2FkaW5nVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBsb2FkaW5nIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHBsYWNlaG9sZGVyIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZXJyb3JUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGVycm9yIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gbG9hZGluZ0NvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGxvYWRpbmcuXG4gKiAgICAgYmxvY2suXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJDb25maWdJbmRleCBJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZVxuICogICAgIHBsYWNlaG9sZGVyIGJsb2NrLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXIoXG4gICAgaW5kZXg6IG51bWJlciwgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLCBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwsXG4gICAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlcnxudWxsLCBwbGFjZWhvbGRlclRtcGxJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVycm9yVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY29uc3QgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzID0ge1xuICAgICAgcHJpbWFyeVRtcGxJbmRleCxcbiAgICAgIGxvYWRpbmdUbXBsSW5kZXg6IGxvYWRpbmdUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyVG1wbEluZGV4OiBwbGFjZWhvbGRlclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgZXJyb3JUbXBsSW5kZXg6IGVycm9yVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlckJsb2NrQ29uZmlnOiBwbGFjZWhvbGRlckNvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgbG9hZGluZ0Jsb2NrQ29uZmlnOiBsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBsb2FkaW5nQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgZGVwZW5kZW5jeVJlc29sdmVyRm46IGRlcGVuZGVuY3lSZXNvbHZlckZuID8/IG51bGwsXG4gICAgICBsb2FkaW5nU3RhdGU6IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVELFxuICAgICAgbG9hZGluZ1Byb21pc2U6IG51bGwsXG4gICAgfTtcblxuICAgIHNldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgYWRqdXN0ZWRJbmRleCwgZGVmZXJCbG9ja0NvbmZpZyk7XG4gIH1cblxuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdO1xuXG4gIC8vIElmIGh5ZHJhdGlvbiBpcyBlbmFibGVkLCBsb29rcyB1cCBkZWh5ZHJhdGVkIHZpZXdzIGluIHRoZSBET01cbiAgLy8gdXNpbmcgaHlkcmF0aW9uIGFubm90YXRpb24gaW5mbyBhbmQgc3RvcmVzIHRob3NlIHZpZXdzIG9uIExDb250YWluZXIuXG4gIC8vIEluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgZnVuY3Rpb24gaXMgYSBub29wLlxuICBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcihsQ29udGFpbmVyLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIEluaXQgaW5zdGFuY2Utc3BlY2lmaWMgZGVmZXIgZGV0YWlscyBhbmQgc3RvcmUgaXQuXG4gIGNvbnN0IGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMgPSBbXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5FWFRfREVGRVJfQkxPQ0tfU1RBVEVcbiAgICBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsLCAgLy8gREVGRVJfQkxPQ0tfU1RBVEVcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU1RBVEVfSVNfRlJPWkVOX1VOVElMXG4gICAgbnVsbCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExPQURJTkdfQUZURVJfQ0xFQU5VUF9GTlxuICBdO1xuICBzZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIGFkanVzdGVkSW5kZXgsIGxEZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgd2hlbiBhIHRyaWdnZXIgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlICYmIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwpIHtcbiAgICAgIC8vIElmIG5vdGhpbmcgaXMgcmVuZGVyZWQgeWV0LCByZW5kZXIgYSBwbGFjZWhvbGRlciAoaWYgZGVmaW5lZCkuXG4gICAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHZhbHVlID09PSB0cnVlICYmXG4gICAgICAgIChyZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsIHx8XG4gICAgICAgICByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKSB7XG4gICAgICAvLyBUaGUgYHdoZW5gIGNvbmRpdGlvbiBoYXMgY2hhbmdlZCB0byBgdHJ1ZWAsIHRyaWdnZXIgZGVmZXIgYmxvY2sgbG9hZGluZ1xuICAgICAgLy8gaWYgdGhlIGJsb2NrIGlzIGVpdGhlciBpbiBpbml0aWFsIChub3RoaW5nIGlzIHJlbmRlcmVkKSBvciBhIHBsYWNlaG9sZGVyXG4gICAgICAvLyBzdGF0ZS5cbiAgICAgIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJlZmV0Y2hlcyB0aGUgZGVmZXJyZWQgY29udGVudCB3aGVuIGEgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSAmJiB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRUcmlnZ2VyKG9uSWRsZSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBwcmVmZXRjaCBvbiBpZGxlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhvbklkbGUsIERlZmVyQmxvY2tUcmlnZ2Vycy5PbklkbGUpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBSZW5kZXIgcGxhY2Vob2xkZXIgYmxvY2sgb25seSBpZiBsb2FkaW5nIHRlbXBsYXRlIGlzIG5vdCBwcmVzZW50XG4gIC8vIHRvIGF2b2lkIGNvbnRlbnQgZmxpY2tlcmluZywgc2luY2UgaXQgd291bGQgYmUgaW1tZWRpYXRlbHkgcmVwbGFjZWRcbiAgLy8gYnkgdGhlIGxvYWRpbmcgYmxvY2suXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nVG1wbEluZGV4ID09PSBudWxsKSB7XG4gICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgfVxuICB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpO1xufVxuXG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBwcmVmZXRjaCBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkltbWVkaWF0ZSgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIGxvYWRpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25UaW1lcihkZWxheTogbnVtYmVyKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcob25UaW1lcihkZWxheSksIERlZmVyQmxvY2tUcmlnZ2Vycy5PblRpbWVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25Ib3ZlciwgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbnRlcmFjdGlvbih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25WaWV3cG9ydCxcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKioqKioqKioqIEhlbHBlciBmdW5jdGlvbnMgKioqKioqKioqKi9cblxuLyoqXG4gKiBTY2hlZHVsZXMgdHJpZ2dlcmluZyBvZiBhIGRlZmVyIGJsb2NrIGZvciBgb24gaWRsZWAgYW5kIGBvbiB0aW1lcmAgY29uZGl0aW9ucy5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVEZWxheWVkVHJpZ2dlcihcbiAgICBzY2hlZHVsZUZuOiAoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3LCB3aXRoTFZpZXdDbGVhbnVwOiBib29sZWFuKSA9PiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICBzY2hlZHVsZUZuKCgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksIGxWaWV3LCB0cnVlIC8qIHdpdGhMVmlld0NsZWFudXAgKi8pO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBwcmVmZXRjaGluZyBmb3IgYG9uIGlkbGVgIGFuZCBgb24gdGltZXJgIHRyaWdnZXJzLlxuICpcbiAqIEBwYXJhbSBzY2hlZHVsZUZuIEEgZnVuY3Rpb24gdGhhdCBkb2VzIHRoZSBzY2hlZHVsaW5nLlxuICogQHBhcmFtIHRyaWdnZXIgQSB0cmlnZ2VyIHRoYXQgaW5pdGlhdGVkIHNjaGVkdWxpbmcuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVsYXllZFByZWZldGNoaW5nKFxuICAgIHNjaGVkdWxlRm46IChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pID0+IFZvaWRGdW5jdGlvbixcbiAgICB0cmlnZ2VyOiBEZWZlckJsb2NrVHJpZ2dlcnMpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBQcmV2ZW50IHNjaGVkdWxpbmcgbW9yZSB0aGFuIG9uZSBwcmVmZXRjaCBpbml0IGNhbGxcbiAgICAvLyBmb3IgZWFjaCBkZWZlciBibG9jay4gRm9yIHRoaXMgcmVhc29uIHdlIHVzZSBvbmx5IGEgdHJpZ2dlclxuICAgIC8vIGlkZW50aWZpZXIgaW4gYSBrZXksIHNvIGFsbCBpbnN0YW5jZXMgd291bGQgdXNlIHRoZSBzYW1lIGtleS5cbiAgICBjb25zdCBrZXkgPSBTdHJpbmcodHJpZ2dlcik7XG4gICAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICAgIGNvbnN0IG1hbmFnZXIgPSBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKTtcbiAgICBpZiAoIW1hbmFnZXIuaGFzKHREZXRhaWxzLCBrZXkpKSB7XG4gICAgICAvLyBJbiBjYXNlIG9mIHByZWZldGNoaW5nLCB3ZSBpbnRlbnRpb25hbGx5IGF2b2lkIGNhbmNlbGxpbmcgcmVzb3VyY2UgbG9hZGluZyBpZlxuICAgICAgLy8gYW4gdW5kZXJseWluZyBMVmlldyBnZXQgZGVzdHJveWVkICh0aHVzIHBhc3NpbmcgYG51bGxgIGFzIGEgc2Vjb25kIGFyZ3VtZW50KSxcbiAgICAgIC8vIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgTFZpZXdzICh0aGF0IHJlcHJlc2VudCBlbWJlZGRlZCB2aWV3cykgdGhhdFxuICAgICAgLy8gZGVwZW5kIG9uIHJlc291cmNlIGxvYWRpbmcuXG4gICAgICBjb25zdCBwcmVmZXRjaCA9ICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpO1xuICAgICAgY29uc3QgY2xlYW51cEZuID0gc2NoZWR1bGVGbihwcmVmZXRjaCwgbFZpZXcsIGZhbHNlIC8qIHdpdGhMVmlld0NsZWFudXAgKi8pO1xuICAgICAgcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoaW5qZWN0b3IsIHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgTFZpZXcgaW4gd2hpY2ggYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRIb3N0TFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVycmVkIGJsb2NrIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRUTm9kZSBUTm9kZSBkZWZpbmluZyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyJ3Mgdmlldy5cbiAqICAgQSBuZWdhdGl2ZSB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgYmxvY2sncyBwbGFjZWhvbGRlciwgd2hpbGUgYW4gdW5kZWZpbmVkXG4gKiAgIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgTFZpZXcgYXMgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5mdW5jdGlvbiBnZXRUcmlnZ2VyTFZpZXcoXG4gICAgZGVmZXJyZWRIb3N0TFZpZXc6IExWaWV3LCBkZWZlcnJlZFROb2RlOiBUTm9kZSwgd2Fsa1VwVGltZXM6IG51bWJlcnx1bmRlZmluZWQpOiBMVmlld3xudWxsIHtcbiAgLy8gVGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgdmlldywgd2UgZG9uJ3QgbmVlZCB0byB0cmF2ZXJzZS5cbiAgaWYgKHdhbGtVcFRpbWVzID09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmZXJyZWRIb3N0TFZpZXc7XG4gIH1cblxuICAvLyBBIHBvc2l0aXZlIHZhbHVlIG9yIHplcm8gbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiBhIHBhcmVudCB2aWV3LlxuICBpZiAod2Fsa1VwVGltZXMgPj0gMCkge1xuICAgIHJldHVybiB3YWxrVXBWaWV3cyh3YWxrVXBUaW1lcywgZGVmZXJyZWRIb3N0TFZpZXcpO1xuICB9XG5cbiAgLy8gSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlLCBpdCBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgcGxhY2Vob2xkZXIuXG4gIGNvbnN0IGRlZmVycmVkQ29udGFpbmVyID0gZGVmZXJyZWRIb3N0TFZpZXdbZGVmZXJyZWRUTm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlZmVycmVkQ29udGFpbmVyKTtcbiAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZGVmZXJyZWRDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdID8/IG51bGw7XG5cbiAgLy8gV2UgbmVlZCB0byBudWxsIGNoZWNrLCBiZWNhdXNlIHRoZSBwbGFjZWhvbGRlciBtaWdodCBub3QgaGF2ZSBiZWVuIHJlbmRlcmVkIHlldC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB0cmlnZ2VyTFZpZXcgIT09IG51bGwpIHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhkZWZlcnJlZEhvc3RMVmlldywgZGVmZXJyZWRUTm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgcmVuZGVyZWRTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLFxuICAgICAgICAnRXhwZWN0ZWQgYSBwbGFjZWhvbGRlciB0byBiZSByZW5kZXJlZCBpbiB0aGlzIGRlZmVyIGJsb2NrLicpO1xuICAgIGFzc2VydExWaWV3KHRyaWdnZXJMVmlldyk7XG4gIH1cblxuICByZXR1cm4gdHJpZ2dlckxWaWV3O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGVsZW1lbnQgdGhhdCBhIGRlZmVycmVkIGJsb2NrJ3MgdHJpZ2dlciBpcyBwb2ludGluZyB0by5cbiAqIEBwYXJhbSB0cmlnZ2VyTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIHRyaWdnZXIgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIHRyaWdnZXIgZWxlbWVudCBzaG91bGQndmUgYmVlbiByZW5kZXJlZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VHJpZ2dlckVsZW1lbnQodHJpZ2dlckxWaWV3OiBMVmlldywgdHJpZ2dlckluZGV4OiBudW1iZXIpOiBFbGVtZW50IHtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoSEVBREVSX09GRlNFVCArIHRyaWdnZXJJbmRleCwgdHJpZ2dlckxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVsZW1lbnQoZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50IGFzIEVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgRE9NLW5vZGUgYmFzZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBpbml0aWFsTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVyIGJsb2NrIGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHJlcHJlc2VudGluZyB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAvZG93biBpbiB0aGUgdmlldyBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSByZWdpc3RlckZuIEZ1bmN0aW9uIHRoYXQgd2lsbCByZWdpc3RlciB0aGUgRE9NIGV2ZW50cy5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgcmVjZWl2ZXMgdGhlIGV2ZW50IHRoYXQgc2hvdWxkIHJlbmRlclxuICogICAgIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgIGluaXRpYWxMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgdHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgIHJlZ2lzdGVyRm46IChlbGVtZW50OiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IFZvaWRGdW5jdGlvbixcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGluamVjdG9yID0gaW5pdGlhbExWaWV3W0lOSkVDVE9SXSE7XG5cbiAgLy8gQXNzdW1wdGlvbjogdGhlIGBhZnRlclJlbmRlcmAgcmVmZXJlbmNlIHNob3VsZCBiZSBkZXN0cm95ZWRcbiAgLy8gYXV0b21hdGljYWxseSBzbyB3ZSBkb24ndCBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgaXQuXG4gIGNvbnN0IGFmdGVyUmVuZGVyUmVmID0gYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGluaXRpYWxMVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG5cbiAgICAvLyBJZiB0aGUgYmxvY2sgd2FzIGxvYWRlZCBiZWZvcmUgdGhlIHRyaWdnZXIgd2FzIHJlc29sdmVkLCB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nLlxuICAgIGlmIChyZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsICYmXG4gICAgICAgIHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaWdnZXJMVmlldyA9IGdldFRyaWdnZXJMVmlldyhpbml0aWFsTFZpZXcsIHROb2RlLCB3YWxrVXBUaW1lcyk7XG5cbiAgICAvLyBLZWVwIHBvbGxpbmcgdW50aWwgd2UgcmVzb2x2ZSB0aGUgdHJpZ2dlcidzIExWaWV3LlxuICAgIC8vIGBhZnRlclJlbmRlcmAgc2hvdWxkIHN0b3AgYXV0b21hdGljYWxseSBpZiB0aGUgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAgaWYgKCF0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHRyaWdnZXIncyB2aWV3IHdhcyBkZXN0cm95ZWQgYmVmb3JlIHdlIHJlc29sdmVkIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gICAgaWYgKHRyaWdnZXJMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGFkZCBpbnRlZ3JhdGlvbiB3aXRoIGBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXJgLlxuICAgIGNvbnN0IGVsZW1lbnQgPSBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXcsIHRyaWdnZXJJbmRleCk7XG4gICAgY29uc3QgY2xlYW51cCA9IHJlZ2lzdGVyRm4oZWxlbWVudCwgKCkgPT4ge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG4gICAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICAgIH1cbiAgICAgIGNsZWFudXAoKTtcbiAgICB9LCBpbmplY3Rvcik7XG5cbiAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgc3RvcmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuXG4gICAgLy8gU2luY2UgdGhlIHRyaWdnZXIgYW5kIGRlZmVycmVkIGJsb2NrIG1pZ2h0IGJlIGluIGRpZmZlcmVudFxuICAgIC8vIHZpZXdzLCB3ZSBoYXZlIHRvIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayBpbiBib3RoIGxvY2F0aW9ucy5cbiAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICB9XG4gIH0sIHtpbmplY3Rvcn0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBzY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IHRoYXQgaG9zdHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB3aXRoTFZpZXdDbGVhbnVwIEEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGEgc2NoZWR1bGVkIGNhbGxiYWNrXG4gKiAgICAgICAgICAgc2hvdWxkIGJlIGNhbmNlbGxlZCBpbiBjYXNlIGFuIExWaWV3IGlzIGRlc3Ryb3llZCBiZWZvcmUgYSBjYWxsYmFja1xuICogICAgICAgICAgIHdhcyBpbnZva2VkLlxuICovXG5mdW5jdGlvbiBvbklkbGUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3LCB3aXRoTFZpZXdDbGVhbnVwOiBib29sZWFuKSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3Qgc2NoZWR1bGVyID0gaW5qZWN0b3IuZ2V0KE9uSWRsZVNjaGVkdWxlcik7XG4gIGNvbnN0IGNsZWFudXBGbiA9ICgpID0+IHNjaGVkdWxlci5yZW1vdmUoY2FsbGJhY2spO1xuICBjb25zdCB3cmFwcGVkQ2FsbGJhY2sgPVxuICAgICAgd2l0aExWaWV3Q2xlYW51cCA/IHdyYXBXaXRoTFZpZXdDbGVhbnVwKGNhbGxiYWNrLCBsVmlldywgY2xlYW51cEZuKSA6IGNhbGxiYWNrO1xuICBzY2hlZHVsZXIuYWRkKHdyYXBwZWRDYWxsYmFjayk7XG4gIHJldHVybiBjbGVhbnVwRm47XG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgY2FwdHVyZXMgYSBwcm92aWRlZCBkZWxheS5cbiAqIEludm9raW5nIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBzY2hlZHVsZXMgYSB0cmlnZ2VyLlxuICovXG5mdW5jdGlvbiBvblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgcmV0dXJuIChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pID0+XG4gICAgICAgICAgICAgc2NoZWR1bGVUaW1lclRyaWdnZXIoZGVsYXksIGNhbGxiYWNrLCBsVmlldywgd2l0aExWaWV3Q2xlYW51cCk7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBhZnRlciBhIGdpdmVuIHRpbWVvdXQuXG4gKlxuICogQHBhcmFtIGRlbGF5IEEgbnVtYmVyIG9mIG1zIHRvIHdhaXQgdW50aWwgZmlyaW5nIGEgY2FsbGJhY2suXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIGEgdGltZW91dC5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyB0aGF0IGhvc3RzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gd2l0aExWaWV3Q2xlYW51cCBBIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHNjaGVkdWxlZCBjYWxsYmFja1xuICogICAgICAgICAgIHNob3VsZCBiZSBjYW5jZWxsZWQgaW4gY2FzZSBhbiBMVmlldyBpcyBkZXN0cm95ZWQgYmVmb3JlIGEgY2FsbGJhY2tcbiAqICAgICAgICAgICB3YXMgaW52b2tlZC5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVUaW1lclRyaWdnZXIoXG4gICAgZGVsYXk6IG51bWJlciwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3LCB3aXRoTFZpZXdDbGVhbnVwOiBib29sZWFuKSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3Qgc2NoZWR1bGVyID0gaW5qZWN0b3IuZ2V0KFRpbWVyU2NoZWR1bGVyKTtcbiAgY29uc3QgY2xlYW51cEZuID0gKCkgPT4gc2NoZWR1bGVyLnJlbW92ZShjYWxsYmFjayk7XG4gIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9XG4gICAgICB3aXRoTFZpZXdDbGVhbnVwID8gd3JhcFdpdGhMVmlld0NsZWFudXAoY2FsbGJhY2ssIGxWaWV3LCBjbGVhbnVwRm4pIDogY2FsbGJhY2s7XG4gIHNjaGVkdWxlci5hZGQoZGVsYXksIHdyYXBwZWRDYWxsYmFjayk7XG4gIHJldHVybiBjbGVhbnVwRm47XG59XG5cbi8qKlxuICogV3JhcHMgYSBnaXZlbiBjYWxsYmFjayBpbnRvIGEgbG9naWMgdGhhdCByZWdpc3RlcnMgYSBjbGVhbnVwIGZ1bmN0aW9uXG4gKiBpbiB0aGUgTFZpZXcgY2xlYW51cCBzbG90LCB0byBiZSBpbnZva2VkIHdoZW4gYW4gTFZpZXcgaXMgZGVzdHJveWVkLlxuICovXG5mdW5jdGlvbiB3cmFwV2l0aExWaWV3Q2xlYW51cChcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIGNsZWFudXA6IFZvaWRGdW5jdGlvbik6IFZvaWRGdW5jdGlvbiB7XG4gIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9ICgpID0+IHtcbiAgICBjYWxsYmFjaygpO1xuICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwKTtcbiAgfTtcbiAgc3RvcmVMVmlld09uRGVzdHJveShsVmlldywgY2xlYW51cCk7XG4gIHJldHVybiB3cmFwcGVkQ2FsbGJhY2s7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBhIGRhdGEgc2xvdCBpbmRleCBmb3IgZGVmZXIgYmxvY2sgaW5mbyAoZWl0aGVyIHN0YXRpYyBvclxuICogaW5zdGFuY2Utc3BlY2lmaWMpLCBnaXZlbiBhbiBpbmRleCBvZiBhIGRlZmVyIGluc3RydWN0aW9uLlxuICovXG5mdW5jdGlvbiBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleDogbnVtYmVyKSB7XG4gIC8vIEluc3RhbmNlIHN0YXRlIGlzIGxvY2F0ZWQgYXQgdGhlICpuZXh0KiBwb3NpdGlvblxuICAvLyBhZnRlciB0aGUgZGVmZXIgYmxvY2sgc2xvdCBpbiBhbiBMVmlldyBvciBUVmlldy5kYXRhLlxuICByZXR1cm4gZGVmZXJCbG9ja0luZGV4ICsgMTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIGRlZmVyIGJsb2NrIHN0YXRlIGZyb20gYW4gTFZpZXcsIGdpdmVuIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmxvY2suICovXG5mdW5jdGlvbiBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBMRGVmZXJCbG9ja0RldGFpbHMge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleCh0Tm9kZS5pbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbc2xvdEluZGV4XTtcbn1cblxuLyoqIFN0b3JlcyBhIGRlZmVyIGJsb2NrIGluc3RhbmNlIHN0YXRlIGluIExWaWV3LiAqL1xuZnVuY3Rpb24gc2V0TERlZmVyQmxvY2tEZXRhaWxzKFxuICAgIGxWaWV3OiBMVmlldywgZGVmZXJCbG9ja0luZGV4OiBudW1iZXIsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIGxWaWV3W3Nsb3RJbmRleF0gPSBsRGV0YWlscztcbn1cblxuLyoqIFJldHJpZXZlcyBzdGF0aWMgaW5mbyBhYm91dCBhIGRlZmVyIGJsb2NrLCBnaXZlbiBhIFRWaWV3IGFuZCBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogVERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleCh0Tm9kZS5pbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICByZXR1cm4gdFZpZXcuZGF0YVtzbG90SW5kZXhdIGFzIFREZWZlckJsb2NrRGV0YWlscztcbn1cblxuLyoqIFN0b3JlcyBhIGRlZmVyIGJsb2NrIHN0YXRpYyBpbmZvIGluIGBUVmlldy5kYXRhYC4gKi9cbmZ1bmN0aW9uIHNldFREZWZlckJsb2NrRGV0YWlscyhcbiAgICB0VmlldzogVFZpZXcsIGRlZmVyQmxvY2tJbmRleDogbnVtYmVyLCBkZWZlckJsb2NrQ29uZmlnOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgdFZpZXcuZGF0YVtzbG90SW5kZXhdID0gZGVmZXJCbG9ja0NvbmZpZztcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGhvc3RMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIHN3aXRjaCAobmV3U3RhdGUpIHtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZTpcbiAgICAgIHJldHVybiB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmc6XG4gICAgICByZXR1cm4gdERldGFpbHMubG9hZGluZ1RtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5FcnJvcjpcbiAgICAgIHJldHVybiB0RGV0YWlscy5lcnJvclRtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcjpcbiAgICAgIHJldHVybiB0RGV0YWlscy5wbGFjZWhvbGRlclRtcGxJbmRleDtcbiAgICBkZWZhdWx0OlxuICAgICAgbmdEZXZNb2RlICYmIHRocm93RXJyb3IoYFVuZXhwZWN0ZWQgZGVmZXIgYmxvY2sgc3RhdGU6ICR7bmV3U3RhdGV9YCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBtaW5pbXVtIGFtb3VudCBvZiB0aW1lIHRoYXQgYSBnaXZlbiBzdGF0ZSBzaG91bGQgYmUgcmVuZGVyZWQgZm9yLFxuICogdGFraW5nIGludG8gYWNjb3VudCBgbWluaW11bWAgcGFyYW1ldGVyIHZhbHVlLiBJZiB0aGUgYG1pbmltdW1gIHZhbHVlIGlzXG4gKiBub3Qgc3BlY2lmaWVkIC0gcmV0dXJucyBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKFxuICAgIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGN1cnJlbnRTdGF0ZTogRGVmZXJCbG9ja1N0YXRlKTogbnVtYmVyfG51bGwge1xuICBpZiAoY3VycmVudFN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpIHtcbiAgICByZXR1cm4gdERldGFpbHMucGxhY2Vob2xkZXJCbG9ja0NvbmZpZz8uW01JTklNVU1fU0xPVF0gPz8gbnVsbDtcbiAgfSBlbHNlIGlmIChjdXJyZW50U3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nKSB7XG4gICAgcmV0dXJuIHREZXRhaWxzLmxvYWRpbmdCbG9ja0NvbmZpZz8uW01JTklNVU1fU0xPVF0gPz8gbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgdmFsdWUgb2YgdGhlIGBhZnRlcmAgcGFyYW1ldGVyIG9uIHRoZSBAbG9hZGluZyBibG9jay4gKi9cbmZ1bmN0aW9uIGdldExvYWRpbmdCbG9ja0FmdGVyKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpOiBudW1iZXJ8bnVsbCB7XG4gIHJldHVybiB0RGV0YWlscy5sb2FkaW5nQmxvY2tDb25maWc/LltMT0FESU5HX0FGVEVSX1NMT1RdID8/IG51bGw7XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbnMgYSBkZWZlciBibG9jayB0byB0aGUgbmV3IHN0YXRlLiBVcGRhdGVzIHRoZSAgbmVjZXNzYXJ5XG4gKiBkYXRhIHN0cnVjdHVyZXMgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBibG9jay5cbiAqXG4gKiBAcGFyYW0gbmV3U3RhdGUgTmV3IHN0YXRlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IHZvaWQge1xuICBjb25zdCBob3N0TFZpZXcgPSBsQ29udGFpbmVyW1BBUkVOVF07XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG5cbiAgLy8gQ2hlY2sgaWYgdGhpcyB2aWV3IGlzIG5vdCBkZXN0cm95ZWQuIFNpbmNlIHRoZSBsb2FkaW5nIHByb2Nlc3Mgd2FzIGFzeW5jLFxuICAvLyB0aGUgdmlldyBtaWdodCBlbmQgdXAgYmVpbmcgZGVzdHJveWVkIGJ5IHRoZSB0aW1lIHJlbmRlcmluZyBoYXBwZW5zLlxuICBpZiAoaXNEZXN0cm95ZWQoaG9zdExWaWV3KSkgcmV0dXJuO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGlzIFROb2RlIGJlbG9uZ3MgdG8gVFZpZXcgdGhhdCByZXByZXNlbnRzIGhvc3QgTFZpZXcuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBob3N0TFZpZXcpO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGhvc3RMVmlldywgdE5vZGUpO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyhob3N0VFZpZXcsIHROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsRGV0YWlscywgJ0V4cGVjdGVkIGEgZGVmZXIgYmxvY2sgc3RhdGUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcblxuICBpZiAoIWlzVmFsaWRTdGF0ZUNoYW5nZShjdXJyZW50U3RhdGUsIG5ld1N0YXRlKSB8fFxuICAgICAgIWlzVmFsaWRTdGF0ZUNoYW5nZShsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA/PyAtMSwgbmV3U3RhdGUpKVxuICAgIHJldHVybjtcblxuICBpZiAobERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9PT0gbnVsbCB8fCBsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdIDw9IG5vdykge1xuICAgIGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPSBudWxsO1xuXG4gICAgY29uc3QgbG9hZGluZ0FmdGVyID0gZ2V0TG9hZGluZ0Jsb2NrQWZ0ZXIodERldGFpbHMpO1xuICAgIGNvbnN0IGluTG9hZGluZ0FmdGVyUGhhc2UgPSBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dICE9PSBudWxsO1xuICAgIGlmIChuZXdTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcgJiYgbG9hZGluZ0FmdGVyICE9PSBudWxsICYmICFpbkxvYWRpbmdBZnRlclBoYXNlKSB7XG4gICAgICAvLyBUcnlpbmcgdG8gcmVuZGVyIGxvYWRpbmcsIGJ1dCBpdCBoYXMgYW4gYGFmdGVyYCBjb25maWcsXG4gICAgICAvLyBzbyBzY2hlZHVsZSBhbiB1cGRhdGUgYWN0aW9uIGFmdGVyIGEgdGltZW91dC5cbiAgICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbmV3U3RhdGU7XG4gICAgICBjb25zdCBjbGVhbnVwRm4gPVxuICAgICAgICAgIHNjaGVkdWxlRGVmZXJCbG9ja1VwZGF0ZShsb2FkaW5nQWZ0ZXIsIGxEZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lciwgaG9zdExWaWV3KTtcbiAgICAgIGxEZXRhaWxzW0xPQURJTkdfQUZURVJfQ0xFQU5VUF9GTl0gPSBjbGVhbnVwRm47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHdlIHRyYW5zaXRpb24gdG8gYSBjb21wbGV0ZSBvciBhbiBlcnJvciBzdGF0ZSBhbmQgdGhlcmUgaXMgYSBwZW5kaW5nXG4gICAgICAvLyBvcGVyYXRpb24gdG8gcmVuZGVyIGxvYWRpbmcgYWZ0ZXIgYSB0aW1lb3V0IC0gaW52b2tlIGEgY2xlYW51cCBvcGVyYXRpb24sXG4gICAgICAvLyB3aGljaCBzdG9wcyB0aGUgdGltZXIuXG4gICAgICBpZiAobmV3U3RhdGUgPiBEZWZlckJsb2NrU3RhdGUuTG9hZGluZyAmJiBpbkxvYWRpbmdBZnRlclBoYXNlKSB7XG4gICAgICAgIGxEZXRhaWxzW0xPQURJTkdfQUZURVJfQ0xFQU5VUF9GTl0hKCk7XG4gICAgICAgIGxEZXRhaWxzW0xPQURJTkdfQUZURVJfQ0xFQU5VUF9GTl0gPSBudWxsO1xuICAgICAgICBsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlVG9Eb20obmV3U3RhdGUsIGxEZXRhaWxzLCBsQ29udGFpbmVyLCBob3N0TFZpZXcsIHROb2RlKTtcblxuICAgICAgY29uc3QgZHVyYXRpb24gPSBnZXRNaW5pbXVtRHVyYXRpb25Gb3JTdGF0ZSh0RGV0YWlscywgbmV3U3RhdGUpO1xuICAgICAgaWYgKGR1cmF0aW9uICE9PSBudWxsKSB7XG4gICAgICAgIGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPSBub3cgKyBkdXJhdGlvbjtcbiAgICAgICAgc2NoZWR1bGVEZWZlckJsb2NrVXBkYXRlKGR1cmF0aW9uLCBsRGV0YWlscywgdE5vZGUsIGxDb250YWluZXIsIGhvc3RMVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlIGFyZSBzdGlsbCByZW5kZXJpbmcgdGhlIHByZXZpb3VzIHN0YXRlLlxuICAgIC8vIFVwZGF0ZSB0aGUgYE5FWFRfREVGRVJfQkxPQ0tfU1RBVEVgLCB3aGljaCB3b3VsZCBiZVxuICAgIC8vIHBpY2tlZCB1cCBvbmNlIGl0J3MgdGltZSB0byB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlLlxuICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbmV3U3RhdGU7XG4gIH1cbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYW4gdXBkYXRlIG9wZXJhdGlvbiBhZnRlciBhIHNwZWNpZmllZCB0aW1lb3V0LlxuICovXG5mdW5jdGlvbiBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUoXG4gICAgdGltZW91dDogbnVtYmVyLCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIsXG4gICAgaG9zdExWaWV3OiBMVmlldzx1bmtub3duPik6IFZvaWRGdW5jdGlvbiB7XG4gIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IG5leHRTdGF0ZSA9IGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPSBudWxsO1xuICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbnVsbDtcbiAgICBpZiAobmV4dFN0YXRlICE9PSBudWxsKSB7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUobmV4dFN0YXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgfVxuICB9O1xuICAvLyBUT0RPOiB0aGlzIG5lZWRzIHJlZmFjdG9yaW5nIHRvIG1ha2UgYFRpbWVyU2NoZWR1bGVyYCB0aGF0IGlzIHVzZWQgaW5zaWRlXG4gIC8vIG9mIHRoZSBgc2NoZWR1bGVUaW1lclRyaWdnZXJgIGZ1bmN0aW9uIHRyZWUtc2hha2FibGUuXG4gIHJldHVybiBzY2hlZHVsZVRpbWVyVHJpZ2dlcih0aW1lb3V0LCBjYWxsYmFjaywgaG9zdExWaWV3LCB0cnVlKTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB3ZSBjYW4gdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZS5cbiAqXG4gKiBXZSB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlIGlmIHRoZSBwcmV2aW91cyBzdGF0ZSB3YXMgcmVwcmVzZW50ZWRcbiAqIHdpdGggYSBudW1iZXIgdGhhdCBpcyBsZXNzIHRoYW4gdGhlIG5leHQgc3RhdGUuIEZvciBleGFtcGxlLCBpZiB0aGUgY3VycmVudFxuICogc3RhdGUgaXMgXCJsb2FkaW5nXCIgKHJlcHJlc2VudGVkIGFzIGAxYCksIHdlIHNob3VsZCBub3Qgc2hvdyBhIHBsYWNlaG9sZGVyXG4gKiAocmVwcmVzZW50ZWQgYXMgYDBgKSwgYnV0IHdlIGNhbiBzaG93IGEgY29tcGxldGVkIHN0YXRlIChyZXByZXNlbnRlZCBhcyBgMmApXG4gKiBvciBhbiBlcnJvciBzdGF0ZSAocmVwcmVzZW50ZWQgYXMgYDNgKS5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFN0YXRlQ2hhbmdlKFxuICAgIGN1cnJlbnRTdGF0ZTogRGVmZXJCbG9ja1N0YXRlfERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlKTogYm9vbGVhbiB7XG4gIHJldHVybiBjdXJyZW50U3RhdGUgPCBuZXdTdGF0ZTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGNoYW5nZXMgdG8gdGhlIERPTSB0byByZWZsZWN0IGEgZ2l2ZW4gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5RGVmZXJCbG9ja1N0YXRlVG9Eb20oXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscywgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhdGVUbXBsSW5kZXggPSBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUobmV3U3RhdGUsIGhvc3RMVmlldywgdE5vZGUpO1xuXG4gIGlmIChzdGF0ZVRtcGxJbmRleCAhPT0gbnVsbCkge1xuICAgIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IHN0YXRlVG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGhvc3RUVmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG5cbiAgICAvLyBUaGVyZSBpcyBvbmx5IDEgdmlldyB0aGF0IGNhbiBiZSBwcmVzZW50IGluIGFuIExDb250YWluZXIgdGhhdFxuICAgIC8vIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXIsIHROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0Tm9kZSwgbnVsbCwge2RlaHlkcmF0ZWRWaWV3fSk7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIGxDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICAgIG1hcmtWaWV3RGlydHkoZW1iZWRkZWRMVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIHByZWZldGNoaW5nIG9mIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jay5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgbFZpZXc6IExWaWV3KSB7XG4gIGlmIChsVmlld1tJTkpFQ1RPUl0gJiYgc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2sobFZpZXdbSU5KRUNUT1JdISkpIHtcbiAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIGlmIHRoZSBwcm9jZXNzIGhhc24ndCBzdGFydGVkIHlldC5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgIT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gSWYgdGhlIGxvYWRpbmcgc3RhdHVzIGlzIGRpZmZlcmVudCBmcm9tIGluaXRpYWwgb25lLCBpdCBtZWFucyB0aGF0XG4gICAgLy8gdGhlIGxvYWRpbmcgb2YgZGVwZW5kZW5jaWVzIGlzIGluIHByb2dyZXNzIGFuZCB0aGVyZSBpcyBub3RoaW5nIHRvIGRvXG4gICAgLy8gaW4gdGhpcyBmdW5jdGlvbi4gQWxsIGRldGFpbHMgY2FuIGJlIG9idGFpbmVkIGZyb20gdGhlIGB0RGV0YWlsc2Agb2JqZWN0LlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHByaW1hcnlCbG9ja1ROb2RlID0gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXcsIHREZXRhaWxzKTtcblxuICAvLyBTd2l0Y2ggZnJvbSBOT1RfU1RBUlRFRCAtPiBJTl9QUk9HUkVTUyBzdGF0ZS5cbiAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M7XG5cbiAgLy8gQ2hlY2sgaWYgZGVwZW5kZW5jeSBmdW5jdGlvbiBpbnRlcmNlcHRvciBpcyBjb25maWd1cmVkLlxuICBjb25zdCBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA9XG4gICAgICBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3QgZGVwZW5kZW5jaWVzRm4gPSBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA/XG4gICAgICBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvci5pbnRlcmNlcHQodERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm4pIDpcbiAgICAgIHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuO1xuXG4gIC8vIFRoZSBgZGVwZW5kZW5jaWVzRm5gIG1pZ2h0IGJlIGBudWxsYCB3aGVuIGFsbCBkZXBlbmRlbmNpZXMgd2l0aGluXG4gIC8vIGEgZ2l2ZW4gZGVmZXIgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVmZXIgYmxvY2sgbWF5IGhhdmUgbXVsdGlwbGUgcHJlZmV0Y2ggdHJpZ2dlcnMuIE9uY2UgdGhlIGxvYWRpbmdcbiAgLy8gc3RhcnRzLCBpbnZva2UgYWxsIGNsZWFuIGZ1bmN0aW9ucywgc2luY2UgdGhleSBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbiAgaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yLCB0RGV0YWlscyk7XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID1cbiAgICAgICAgICAgIGFkZERlcHNUb1JlZ2lzdHJ5PERpcmVjdGl2ZURlZkxpc3Q+KHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCBkaXJlY3RpdmVEZWZzKTtcbiAgICAgIH1cbiAgICAgIGlmIChwaXBlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA9XG4gICAgICAgICAgICBhZGREZXBzVG9SZWdpc3RyeTxQaXBlRGVmTGlzdD4ocHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5LCBwaXBlRGVmcyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBBZGRzIGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzIGludG8gYSBkaXJlY3RpdmUgb3IgYSBwaXBlIHJlZ2lzdHJ5LFxuICogbWFraW5nIHN1cmUgdGhhdCBhIGRlcGVuZGVuY3kgZG9lc24ndCB5ZXQgZXhpc3QgaW4gdGhlIHJlZ2lzdHJ5LlxuICovXG5mdW5jdGlvbiBhZGREZXBzVG9SZWdpc3RyeTxUIGV4dGVuZHMgRGVwZW5kZW5jeURlZltdPihjdXJyZW50RGVwczogVHxudWxsLCBuZXdEZXBzOiBUKTogVCB7XG4gIGlmICghY3VycmVudERlcHMgfHwgY3VycmVudERlcHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ld0RlcHM7XG4gIH1cblxuICBjb25zdCBjdXJyZW50RGVwU2V0ID0gbmV3IFNldChjdXJyZW50RGVwcyk7XG4gIGZvciAoY29uc3QgZGVwIG9mIG5ld0RlcHMpIHtcbiAgICBjdXJyZW50RGVwU2V0LmFkZChkZXApO1xuICB9XG5cbiAgLy8gSWYgYGN1cnJlbnREZXBzYCBpcyB0aGUgc2FtZSBsZW5ndGgsIHRoZXJlIHdlcmUgbm8gbmV3IGRlcHMgYW5kIGNhblxuICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIGFycmF5LlxuICByZXR1cm4gKGN1cnJlbnREZXBzLmxlbmd0aCA9PT0gY3VycmVudERlcFNldC5zaXplKSA/IGN1cnJlbnREZXBzIDogQXJyYXkuZnJvbShjdXJyZW50RGVwU2V0KSBhcyBUO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgcGxhY2Vob2xkZXIgY29udGVudCAoaWYgcHJlc2VudCkgKi9cbmZ1bmN0aW9uIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsIHROb2RlLCBsQ29udGFpbmVyKTtcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIHRoZSBcImxvYWRpbmdcIiBQcm9taXNlIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgZGVmZXIgc3ViLWJsb2NrLFxuICogYmFzZWQgb24gdGhlIGxvYWRpbmcgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgUmVwcmVzZW50cyBkZWZlciBibG9jayBpbmZvIHNoYXJlZCBhY3Jvc3MgYWxsIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKFxuICAgIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UsICdFeHBlY3RlZCBsb2FkaW5nIFByb21pc2UgdG8gZXhpc3Qgb24gdGhpcyBkZWZlciBibG9jaycpO1xuXG4gIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlIS50aGVuKCgpID0+IHtcbiAgICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcblxuICAgICAgLy8gRXZlcnl0aGluZyBpcyBsb2FkZWQsIHNob3cgdGhlIHByaW1hcnkgYmxvY2sgY29udGVudFxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gICAgfSBlbHNlIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRCkge1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgbWFpbiBjb250ZW50IG9mIGEgZGVmZXIgYmxvY2suICovXG5mdW5jdGlvbiBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldzogVFZpZXcsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpOiBUQ29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgcmV0dXJuIGdldFROb2RlKHRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byB0cmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICogSWYgdGhlIGJsb2NrIGlzIGFscmVhZHkgaW4gYSBsb2FkaW5nLCBjb21wbGV0ZWQgb3IgYW4gZXJyb3Igc3RhdGUgLVxuICogbm8gYWRkaXRpb25hbCBhY3Rpb25zIGFyZSB0YWtlbi5cbiAqL1xuZnVuY3Rpb24gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgaWYgKCFzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICBzd2l0Y2ggKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcblxuICAgICAgLy8gVGhlIGBsb2FkaW5nU3RhdGVgIG1pZ2h0IGhhdmUgY2hhbmdlZCB0byBcImxvYWRpbmdcIi5cbiAgICAgIGlmICgodERldGFpbHMubG9hZGluZ1N0YXRlIGFzIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlKSA9PT1cbiAgICAgICAgICBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUykge1xuICAgICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTpcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRDpcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIHRocm93RXJyb3IoJ1Vua25vd24gZGVmZXIgYmxvY2sgc3RhdGUnKTtcbiAgICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFzc2VydHMgd2hldGhlciBhbGwgZGVwZW5kZW5jaWVzIGZvciBhIGRlZmVyIGJsb2NrIGFyZSBsb2FkZWQuXG4gKiBBbHdheXMgcnVuIHRoaXMgZnVuY3Rpb24gKGluIGRldiBtb2RlKSBiZWZvcmUgcmVuZGVyaW5nIGEgZGVmZXJcbiAqIGJsb2NrIGluIGNvbXBsZXRlZCBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBhc3NlcnRFcXVhbChcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSwgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUsXG4gICAgICAnRXhwZWN0aW5nIGFsbCBkZWZlcnJlZCBkZXBlbmRlbmNpZXMgdG8gYmUgbG9hZGVkLicpO1xufVxuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgYXZvaWQgcmVmZXJlbmNpbmcgaXQgaW4gYXBwbGljYXRpb24gY29kZS5cbiAqXG4gKiBEZXNjcmliZXMgYSBoZWxwZXIgY2xhc3MgdGhhdCBhbGxvd3MgdG8gaW50ZXJjZXB0IGEgY2FsbCB0byByZXRyaWV2ZSBjdXJyZW50XG4gKiBkZXBlbmRlbmN5IGxvYWRpbmcgZnVuY3Rpb24gYW5kIHJlcGxhY2UgaXQgd2l0aCBhIGRpZmZlcmVudCBpbXBsZW1lbnRhdGlvbi5cbiAqIFRoaXMgaW50ZXJjZXB0b3IgY2xhc3MgaXMgbmVlZGVkIHRvIGFsbG93IHRlc3RpbmcgYmxvY2tzIGluIGRpZmZlcmVudCBzdGF0ZXNcbiAqIGJ5IHNpbXVsYXRpbmcgbG9hZGluZyByZXNwb25zZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yIHtcbiAgLyoqXG4gICAqIEludm9rZWQgZm9yIGVhY2ggZGVmZXIgYmxvY2sgd2hlbiBkZXBlbmRlbmN5IGxvYWRpbmcgZnVuY3Rpb24gaXMgYWNjZXNzZWQuXG4gICAqL1xuICBpbnRlcmNlcHQoZGVwZW5kZW5jeUZuOiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsKTogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbDtcblxuICAvKipcbiAgICogQWxsb3dzIHRvIGNvbmZpZ3VyZSBhbiBpbnRlcmNlcHRvciBmdW5jdGlvbi5cbiAgICovXG4gIHNldEludGVyY2VwdG9yKGludGVyY2VwdG9yRm46IChjdXJyZW50OiBEZXBlbmRlbmN5UmVzb2x2ZXJGbikgPT4gRGVwZW5kZW5jeVJlc29sdmVyRm4pOiB2b2lkO1xufVxuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgYXZvaWQgcmVmZXJlbmNpbmcgaXQgaW4gYXBwbGljYXRpb24gY29kZS5cbiAqXG4gKiBJbmplY3RvciB0b2tlbiB0aGF0IGFsbG93cyB0byBwcm92aWRlIGBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yYCBjbGFzc1xuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcj4oXG4gICAgICAgIG5nRGV2TW9kZSA/ICdERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SJyA6ICcnKTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gdmFsdWUgbWF0Y2hlcyB0aGUgZXhwZWN0ZWQgc3RydWN0dXJlIG9mIGEgZGVmZXIgYmxvY2tcbiAqXG4gKiBXZSBjYW4gc2FmZWx5IHJlbHkgb24gdGhlIHByaW1hcnlUbXBsSW5kZXggYmVjYXVzZSBldmVyeSBkZWZlciBibG9jayByZXF1aXJlc1xuICogdGhhdCBhIHByaW1hcnkgdGVtcGxhdGUgZXhpc3RzLiBBbGwgdGhlIG90aGVyIHRlbXBsYXRlIG9wdGlvbnMgYXJlIG9wdGlvbmFsLlxuICovXG5mdW5jdGlvbiBpc1REZWZlckJsb2NrRGV0YWlscyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFREZWZlckJsb2NrRGV0YWlscyB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgJiZcbiAgICAgICh0eXBlb2YgKHZhbHVlIGFzIFREZWZlckJsb2NrRGV0YWlscykucHJpbWFyeVRtcGxJbmRleCA9PT0gJ251bWJlcicpO1xufVxuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHVzZWQgZm9yIGNvbmZpZ3VyaW5nIGRlZmVyIGJsb2NrIGJlaGF2aW9yLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfQ09ORklHID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0NvbmZpZz4obmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0NPTkZJRycgOiAnJyk7XG5cbi8qKlxuICogRGVmZXIgYmxvY2sgaW5zdGFuY2UgZm9yIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmZXJCbG9ja0RldGFpbHMge1xuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBsVmlldzogTFZpZXc7XG4gIHROb2RlOiBUTm9kZTtcbiAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscztcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrcyBpbiBhIGdpdmVuIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsVmlldyBsVmlldyB3aXRoIGRlZmVyIGJsb2Nrc1xuICogQHBhcmFtIGRlZmVyQmxvY2tzIGRlZmVyIGJsb2NrIGFnZ3JlZ2F0b3IgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmVyQmxvY2tzKGxWaWV3OiBMVmlldywgZGVmZXJCbG9ja3M6IERlZmVyQmxvY2tEZXRhaWxzW10pIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbaV07XG4gICAgICAvLyBBbiBMQ29udGFpbmVyIG1heSByZXByZXNlbnQgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jaywgaW4gd2hpY2ggY2FzZVxuICAgICAgLy8gd2Ugc3RvcmUgaXQgYXMgYSByZXN1bHQuIE90aGVyd2lzZSwga2VlcCBpdGVyYXRpbmcgb3ZlciBMQ29udGFpbmVyIHZpZXdzIGFuZFxuICAgICAgLy8gbG9vayBmb3IgZGVmZXIgYmxvY2tzLlxuICAgICAgY29uc3QgaXNMYXN0ID0gaSA9PT0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggLSAxO1xuICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgICAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgICAgICBpZiAoaXNURGVmZXJCbG9ja0RldGFpbHModERldGFpbHMpKSB7XG4gICAgICAgICAgZGVmZXJCbG9ja3MucHVzaCh7bENvbnRhaW5lciwgbFZpZXcsIHROb2RlLCB0RGV0YWlsc30pO1xuICAgICAgICAgIC8vIFRoaXMgTENvbnRhaW5lciByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2ssIHNvIHdlIGV4aXRcbiAgICAgICAgICAvLyB0aGlzIGl0ZXJhdGlvbiBhbmQgZG9uJ3QgaW5zcGVjdCB2aWV3cyBpbiB0aGlzIExDb250YWluZXIuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZ2V0RGVmZXJCbG9ja3MobENvbnRhaW5lcltpXSBhcyBMVmlldywgZGVmZXJCbG9ja3MpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNMVmlldyhsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGVudGVyIHRoZSBgZ2V0RGVmZXJCbG9ja3NgIHJlY3Vyc2l2ZWx5LlxuICAgICAgZ2V0RGVmZXJCbG9ja3MobFZpZXdbaV0sIGRlZmVyQmxvY2tzKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBjbGVhbnVwIGZ1bmN0aW9uIGFzc29jaWF0ZWQgd2l0aCBhIHByZWZldGNoaW5nIHRyaWdnZXJcbiAqIG9mIGEgZ2l2ZW4gZGVmZXIgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIHJlZ2lzdGVyVERldGFpbHNDbGVhbnVwKFxuICAgIGluamVjdG9yOiBJbmplY3RvciwgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcsIGNsZWFudXBGbjogVm9pZEZ1bmN0aW9uKSB7XG4gIGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpLmFkZCh0RGV0YWlscywga2V5LCBjbGVhbnVwRm4pO1xufVxuXG4vKipcbiAqIEludm9rZXMgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggY2xlYW51cCB0cmlnZ2Vyc1xuICogYW5kIHJlbW92ZXMgYWxsIGNsZWFudXAgZnVuY3Rpb25zIGFmdGVyd2FyZHMuXG4gKi9cbmZ1bmN0aW9uIGludm9rZVREZXRhaWxzQ2xlYW51cChpbmplY3RvcjogSW5qZWN0b3IsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuY2xlYW51cCh0RGV0YWlscyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgc2VydmljZSB0byBrZWVwIHRyYWNrIG9mIGNsZWFudXAgZnVuY3Rpb25zIGFzc29jaWF0ZWRcbiAqIHdpdGggZGVmZXIgYmxvY2tzLiBUaGlzIGNsYXNzIGlzIHVzZWQgdG8gbWFuYWdlIGNsZWFudXAgZnVuY3Rpb25zXG4gKiBjcmVhdGVkIGZvciBwcmVmZXRjaGluZyB0cmlnZ2Vycy5cbiAqL1xuY2xhc3MgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBibG9ja3MgPSBuZXcgTWFwPFREZWZlckJsb2NrRGV0YWlscywgTWFwPHN0cmluZywgVm9pZEZ1bmN0aW9uW10+PigpO1xuXG4gIGFkZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGlmICghdGhpcy5ibG9ja3MuaGFzKHREZXRhaWxzKSkge1xuICAgICAgdGhpcy5ibG9ja3Muc2V0KHREZXRhaWxzLCBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscykhO1xuICAgIGlmICghYmxvY2suaGFzKGtleSkpIHtcbiAgICAgIGJsb2NrLnNldChrZXksIFtdKTtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2tzID0gYmxvY2suZ2V0KGtleSkhO1xuICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGhhcyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk/LmhhcyhrZXkpO1xuICB9XG5cbiAgY2xlYW51cCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpO1xuICAgIGlmIChibG9jaykge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFja3Mgb2YgT2JqZWN0LnZhbHVlcyhibG9jaykpIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBjYWxsYmFja3MpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmJsb2Nrcy5kZWxldGUodERldGFpbHMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGZvciAoY29uc3QgW2Jsb2NrXSBvZiB0aGlzLmJsb2Nrcykge1xuICAgICAgdGhpcy5jbGVhbnVwKGJsb2NrKTtcbiAgICB9XG4gICAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcigpLFxuICB9KTtcbn1cblxuLyoqXG4gKiBVc2Ugc2hpbXMgZm9yIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgYW5kIGBjYW5jZWxJZGxlQ2FsbGJhY2tgIGZ1bmN0aW9ucyBmb3JcbiAqIGVudmlyb25tZW50cyB3aGVyZSB0aG9zZSBmdW5jdGlvbnMgYXJlIG5vdCBhdmFpbGFibGUgKGUuZy4gTm9kZS5qcyBhbmQgU2FmYXJpKS5cbiAqXG4gKiBOb3RlOiB3ZSB3cmFwIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgY2FsbCBpbnRvIGEgZnVuY3Rpb24sIHNvIHRoYXQgaXQgY2FuIGJlXG4gKiBvdmVycmlkZGVuL21vY2tlZCBpbiB0ZXN0IGVudmlyb25tZW50IGFuZCBwaWNrZWQgdXAgYnkgdGhlIHJ1bnRpbWUgY29kZS5cbiAqL1xuY29uc3QgX3JlcXVlc3RJZGxlQ2FsbGJhY2sgPSAoKSA9PlxuICAgIHR5cGVvZiByZXF1ZXN0SWRsZUNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyA/IHJlcXVlc3RJZGxlQ2FsbGJhY2sgOiBzZXRUaW1lb3V0O1xuY29uc3QgX2NhbmNlbElkbGVDYWxsYmFjayA9ICgpID0+XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gY2FuY2VsSWRsZUNhbGxiYWNrIDogY2xlYXJUaW1lb3V0O1xuXG4vKipcbiAqIEhlbHBlciBzZXJ2aWNlIHRvIHNjaGVkdWxlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYHMgZm9yIGJhdGNoZXMgb2YgZGVmZXIgYmxvY2tzLFxuICogdG8gYXZvaWQgY2FsbGluZyBgcmVxdWVzdElkbGVDYWxsYmFja2AgZm9yIGVhY2ggZGVmZXIgYmxvY2sgKGUuZy4gaWZcbiAqIGRlZmVyIGJsb2NrcyBhcmUgZGVmaW5lZCBpbnNpZGUgYSBmb3IgbG9vcCkuXG4gKi9cbmNsYXNzIE9uSWRsZVNjaGVkdWxlciB7XG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIGN1cnJlbnQgY2FsbGJhY2tzIGFyZSBiZWluZyBpbnZva2VkLlxuICBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvLyBDdXJyZW50bHkgc2NoZWR1bGVkIGlkbGUgY2FsbGJhY2sgaWQuXG4gIGlkbGVJZDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIC8vIFNldCBvZiBjYWxsYmFja3MgdG8gYmUgaW52b2tlZCBuZXh0LlxuICBjdXJyZW50ID0gbmV3IFNldDxWb2lkRnVuY3Rpb24+KCk7XG5cbiAgLy8gU2V0IG9mIGNhbGxiYWNrcyBjb2xsZWN0ZWQgd2hpbGUgaW52b2tpbmcgY3VycmVudCBzZXQgb2YgY2FsbGJhY2tzLlxuICAvLyBUaG9zZSBjYWxsYmFja3MgYXJlIHNjaGVkdWxlZCBmb3IgdGhlIG5leHQgaWRsZSBwZXJpb2QuXG4gIGRlZmVycmVkID0gbmV3IFNldDxWb2lkRnVuY3Rpb24+KCk7XG5cbiAgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG5cbiAgcmVxdWVzdElkbGVDYWxsYmFjayA9IF9yZXF1ZXN0SWRsZUNhbGxiYWNrKCkuYmluZChnbG9iYWxUaGlzKTtcbiAgY2FuY2VsSWRsZUNhbGxiYWNrID0gX2NhbmNlbElkbGVDYWxsYmFjaygpLmJpbmQoZ2xvYmFsVGhpcyk7XG5cbiAgYWRkKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWQgOiB0aGlzLmN1cnJlbnQ7XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gICAgaWYgKHRoaXMuaWRsZUlkID09PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlSWRsZUNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICB0aGlzLmN1cnJlbnQuZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlSWRsZUNhbGxiYWNrKCkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgdGhpcy5jYW5jZWxJZGxlQ2FsbGJhY2sodGhpcy5pZGxlSWQhKTtcbiAgICAgIHRoaXMuaWRsZUlkID0gbnVsbDtcblxuICAgICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuXG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY3VycmVudCkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5jdXJyZW50LmNsZWFyKCk7XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgY2FsbGJhY2tzIGFkZGVkIGR1cmluZyBhbiBpbnZvY2F0aW9uXG4gICAgICAvLyBvZiB0aGUgY3VycmVudCBvbmVzIC0gbWFrZSB0aGVtIFwiY3VycmVudFwiIGFuZCBzY2hlZHVsZVxuICAgICAgLy8gYSBuZXcgaWRsZSBjYWxsYmFjay5cbiAgICAgIGlmICh0aGlzLmRlZmVycmVkLnNpemUgPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZCkge1xuICAgICAgICAgIHRoaXMuY3VycmVudC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZUlkbGVDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGNhbGxiYWNrIHJ1bnMgaW4gdGhlIE5nWm9uZSBzaW5jZVxuICAgIC8vIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgaXMgbm90IGN1cnJlbnRseSBwYXRjaGVkIGJ5IFpvbmUuanMuXG4gICAgdGhpcy5pZGxlSWQgPSB0aGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4gdGhpcy5uZ1pvbmUucnVuKGNhbGxiYWNrKSkgYXMgbnVtYmVyO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuaWRsZUlkICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNhbmNlbElkbGVDYWxsYmFjayh0aGlzLmlkbGVJZCk7XG4gICAgICB0aGlzLmlkbGVJZCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudC5jbGVhcigpO1xuICAgIHRoaXMuZGVmZXJyZWQuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IE9uSWRsZVNjaGVkdWxlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IE9uSWRsZVNjaGVkdWxlcigpLFxuICB9KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgc2VydmljZSB0byBzY2hlZHVsZSBgc2V0VGltZW91dGBzIGZvciBiYXRjaGVzIG9mIGRlZmVyIGJsb2NrcyxcbiAqIHRvIGF2b2lkIGNhbGxpbmcgYHNldFRpbWVvdXRgIGZvciBlYWNoIGRlZmVyIGJsb2NrIChlLmcuIGlmIGRlZmVyIGJsb2Nrc1xuICogYXJlIGNyZWF0ZWQgaW5zaWRlIGEgZm9yIGxvb3ApLlxuICovXG5jbGFzcyBUaW1lclNjaGVkdWxlciB7XG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIGN1cnJlbnQgY2FsbGJhY2tzIGFyZSBiZWluZyBpbnZva2VkLlxuICBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvLyBDdXJyZW50bHkgc2NoZWR1bGVkIGBzZXRUaW1lb3V0YCBpZC5cbiAgdGltZW91dElkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgLy8gV2hlbiBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVyIHdvdWxkIGZpcmUuXG4gIGludm9rZVRpbWVyQXQ6IG51bWJlcnxudWxsID0gbnVsbDtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyB0byBiZSBpbnZva2VkLlxuICAvLyBGb3IgZWFjaCBjYWxsYmFjayB3ZSBhbHNvIHN0b3JlIGEgdGltZXN0YW1wIG9uIHdoZW4gdGhlIGNhbGxiYWNrXG4gIC8vIHNob3VsZCBiZSBpbnZva2VkLiBXZSBzdG9yZSB0aW1lc3RhbXBzIGFuZCBjYWxsYmFjayBmdW5jdGlvbnNcbiAgLy8gaW4gYSBmbGF0IGFycmF5IHRvIGF2b2lkIGNyZWF0aW5nIG5ldyBvYmplY3RzIGZvciBlYWNoIGVudHJ5LlxuICAvLyBbdGltZXN0YW1wMSwgY2FsbGJhY2sxLCB0aW1lc3RhbXAyLCBjYWxsYmFjazIsIC4uLl1cbiAgY3VycmVudDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4gPSBbXTtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyBjb2xsZWN0ZWQgd2hpbGUgaW52b2tpbmcgY3VycmVudCBzZXQgb2YgY2FsbGJhY2tzLlxuICAvLyBUaG9zZSBjYWxsYmFja3MgYXJlIGFkZGVkIHRvIHRoZSBcImN1cnJlbnRcIiBxdWV1ZSBhdCB0aGUgZW5kIG9mXG4gIC8vIHRoZSBjdXJyZW50IGNhbGxiYWNrIGludm9jYXRpb24uIFRoZSBzaGFwZSBvZiB0aGlzIGxpc3QgaXMgdGhlIHNhbWVcbiAgLy8gYXMgdGhlIHNoYXBlIG9mIHRoZSBgY3VycmVudGAgbGlzdC5cbiAgZGVmZXJyZWQ6IEFycmF5PG51bWJlcnxWb2lkRnVuY3Rpb24+ID0gW107XG5cbiAgYWRkKGRlbGF5OiBudW1iZXIsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWQgOiB0aGlzLmN1cnJlbnQ7XG4gICAgdGhpcy5hZGRUb1F1ZXVlKHRhcmdldCwgRGF0ZS5ub3coKSArIGRlbGF5LCBjYWxsYmFjayk7XG4gICAgdGhpcy5zY2hlZHVsZVRpbWVyKCk7XG4gIH1cblxuICByZW1vdmUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGNvbnN0IGNhbGxiYWNrSW5kZXggPSB0aGlzLnJlbW92ZUZyb21RdWV1ZSh0aGlzLmN1cnJlbnQsIGNhbGxiYWNrKTtcbiAgICBpZiAoY2FsbGJhY2tJbmRleCA9PT0gLTEpIHtcbiAgICAgIC8vIFRyeSBjbGVhbmluZyB1cCBkZWZlcnJlZCBxdWV1ZSBvbmx5IGluIGNhc2VcbiAgICAgIC8vIHdlIGRpZG4ndCBmaW5kIGEgY2FsbGJhY2sgaW4gdGhlIFwiY3VycmVudFwiIHF1ZXVlLlxuICAgICAgdGhpcy5yZW1vdmVGcm9tUXVldWUodGhpcy5kZWZlcnJlZCwgY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkVG9RdWV1ZSh0YXJnZXQ6IEFycmF5PG51bWJlcnxWb2lkRnVuY3Rpb24+LCBpbnZva2VBdDogbnVtYmVyLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgbGV0IGluc2VydEF0SW5kZXggPSB0YXJnZXQubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbnZva2VRdWV1ZWRDYWxsYmFja0F0ID0gdGFyZ2V0W2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChpbnZva2VRdWV1ZWRDYWxsYmFja0F0ID4gaW52b2tlQXQpIHtcbiAgICAgICAgLy8gV2UndmUgcmVhY2hlZCBhIGZpcnN0IHRpbWVyIHRoYXQgaXMgc2NoZWR1bGVkXG4gICAgICAgIC8vIGZvciBhIGxhdGVyIHRpbWUgdGhhbiB3aGF0IHdlIGFyZSB0cnlpbmcgdG8gaW5zZXJ0LlxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb2NhdGlvbiBhdCB3aGljaCB3ZSBuZWVkIHRvIGluc2VydCxcbiAgICAgICAgLy8gbm8gbmVlZCB0byBpdGVyYXRlIGZ1cnRoZXIuXG4gICAgICAgIGluc2VydEF0SW5kZXggPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgYXJyYXlJbnNlcnQyKHRhcmdldCwgaW5zZXJ0QXRJbmRleCwgaW52b2tlQXQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlRnJvbVF1ZXVlKHRhcmdldDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4sIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBsZXQgaW5kZXggPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVldWVkQ2FsbGJhY2sgPSB0YXJnZXRbaSArIDFdO1xuICAgICAgaWYgKHF1ZXVlZENhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgLy8gUmVtb3ZlIDIgZWxlbWVudHM6IGEgdGltZXN0YW1wIHNsb3QgYW5kXG4gICAgICAvLyB0aGUgZm9sbG93aW5nIHNsb3Qgd2l0aCBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgYXJyYXlTcGxpY2UodGFyZ2V0LCBpbmRleCwgMik7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVUaW1lcigpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9ICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCEpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuXG4gICAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG5cbiAgICAgIC8vIEludm9rZSBjYWxsYmFja3MgdGhhdCB3ZXJlIHNjaGVkdWxlZCB0byBydW5cbiAgICAgIC8vIGJlZm9yZSB0aGUgY3VycmVudCB0aW1lLlxuICAgICAgbGV0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICBsZXQgbGFzdENhbGxiYWNrSW5kZXg6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGNvbnN0IGludm9rZUF0ID0gdGhpcy5jdXJyZW50W2ldIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLmN1cnJlbnRbaSArIDFdIGFzIFZvaWRGdW5jdGlvbjtcbiAgICAgICAgaWYgKGludm9rZUF0IDw9IG5vdykge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgLy8gUG9pbnQgYXQgdGhlIGludm9rZWQgY2FsbGJhY2sgZnVuY3Rpb24sIHdoaWNoIGlzIGxvY2F0ZWRcbiAgICAgICAgICAvLyBhZnRlciB0aGUgdGltZXN0YW1wLlxuICAgICAgICAgIGxhc3RDYWxsYmFja0luZGV4ID0gaSArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV2UndmUgcmVhY2hlZCBhIHRpbWVyIHRoYXQgc2hvdWxkIG5vdCBiZSBpbnZva2VkIHlldC5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxhc3RDYWxsYmFja0luZGV4ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIElmIGxhc3QgY2FsbGJhY2sgaW5kZXggaXMgYG51bGxgIC0gbm8gY2FsbGJhY2tzIHdlcmUgaW52b2tlZCxcbiAgICAgICAgLy8gc28gbm8gY2xlYW51cCBpcyBuZWVkZWQuIE90aGVyd2lzZSwgcmVtb3ZlIGludm9rZWQgY2FsbGJhY2tzXG4gICAgICAgIC8vIGZyb20gdGhlIHF1ZXVlLlxuICAgICAgICBhcnJheVNwbGljZSh0aGlzLmN1cnJlbnQsIDAsIGxhc3RDYWxsYmFja0luZGV4ICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgY2FsbGJhY2tzIGFkZGVkIGR1cmluZyBhbiBpbnZvY2F0aW9uXG4gICAgICAvLyBvZiB0aGUgY3VycmVudCBvbmVzIC0gbW92ZSB0aGVtIG92ZXIgdG8gdGhlIFwiY3VycmVudFwiXG4gICAgICAvLyBxdWV1ZS5cbiAgICAgIGlmICh0aGlzLmRlZmVycmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRlZmVycmVkLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmRlZmVycmVkW2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuZGVmZXJyZWRbaSArIDFdIGFzIFZvaWRGdW5jdGlvbjtcbiAgICAgICAgICB0aGlzLmFkZFRvUXVldWUodGhpcy5jdXJyZW50LCBpbnZva2VBdCwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWQubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2NoZWR1bGVUaW1lcigpO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCBydW5uaW5nIHRpbWVyIGNhbGxiYWNrcyBtb3JlIHRoYW4gb25jZSBwZXJcbiAgICAvLyBhdmVyYWdlIGZyYW1lIGR1cmF0aW9uLiBUaGlzIGlzIG5lZWRlZCBmb3IgYmV0dGVyXG4gICAgLy8gYmF0Y2hpbmcgYW5kIHRvIGF2b2lkIGtpY2tpbmcgb2ZmIGV4Y2Vzc2l2ZSBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24gY3ljbGVzLlxuICAgIGNvbnN0IEZSQU1FX0RVUkFUSU9OX01TID0gMTY7ICAvLyAxMDAwbXMgLyA2MGZwc1xuXG4gICAgaWYgKHRoaXMuY3VycmVudC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgcXVldWUgcG9pbnRzIGF0IHRoZSB0aW1lc3RhbXBcbiAgICAgIC8vIG9mIHRoZSBmaXJzdCAoZWFybGllc3QpIGV2ZW50LlxuICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmN1cnJlbnRbMF0gYXMgbnVtYmVyO1xuICAgICAgaWYgKCF0aGlzLnRpbWVvdXRJZCB8fFxuICAgICAgICAgIC8vIFJlc2NoZWR1bGUgYSB0aW1lciBpbiBjYXNlIGEgcXVldWUgY29udGFpbnMgYW4gaXRlbSB3aXRoXG4gICAgICAgICAgLy8gYW4gZWFybGllciB0aW1lc3RhbXAgYW5kIHRoZSBkZWx0YSBpcyBtb3JlIHRoYW4gYW4gYXZlcmFnZVxuICAgICAgICAgIC8vIGZyYW1lIGR1cmF0aW9uLlxuICAgICAgICAgICh0aGlzLmludm9rZVRpbWVyQXQgJiYgKHRoaXMuaW52b2tlVGltZXJBdCAtIGludm9rZUF0ID4gRlJBTUVfRFVSQVRJT05fTVMpKSkge1xuICAgICAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBUaGVyZSB3YXMgYSB0aW1lb3V0IGFscmVhZHksIGJ1dCBhbiBlYXJsaWVyIGV2ZW50IHdhcyBhZGRlZFxuICAgICAgICAgIC8vIGludG8gdGhlIHF1ZXVlLiBJbiB0aGlzIGNhc2Ugd2UgZHJvcCBhbiBvbGQgdGltZXIgYW5kIHNldHVwXG4gICAgICAgICAgLy8gYSBuZXcgb25lIHdpdGggYW4gdXBkYXRlZCAoc21hbGxlcikgdGltZW91dC5cbiAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTWF0aC5tYXgoaW52b2tlQXQgLSBub3csIEZSQU1FX0RVUkFUSU9OX01TKTtcbiAgICAgICAgdGhpcy5pbnZva2VUaW1lckF0ID0gaW52b2tlQXQ7XG4gICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dChjYWxsYmFjaywgdGltZW91dCkgYXMgdW5rbm93biBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMudGltZW91dElkICE9PSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnQubGVuZ3RoID0gMDtcbiAgICB0aGlzLmRlZmVycmVkLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBUaW1lclNjaGVkdWxlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IFRpbWVyU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuIl19