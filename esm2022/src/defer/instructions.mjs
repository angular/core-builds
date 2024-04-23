/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { setActiveConsumer } from '@angular/core/primitives/signals';
import { CachedInjectorService } from '../cached_injector_service';
import { EnvironmentInjector, InjectionToken } from '../di';
import { internalImportProvidersFrom } from '../di/provider_collection';
import { RuntimeError } from '../errors';
import { findMatchingDehydratedView } from '../hydration/views';
import { populateDehydratedViewsInLContainer } from '../linker/view_container_ref';
import { PendingTasks } from '../pending_tasks';
import { assertLContainer, assertTNodeForLView } from '../render3/assert';
import { bindingUpdated } from '../render3/bindings';
import { ChainedInjector } from '../render3/component_ref';
import { getComponentDef, getDirectiveDef, getPipeDef } from '../render3/definition';
import { getTemplateLocationDetails } from '../render3/instructions/element_validation';
import { markViewDirty } from '../render3/instructions/mark_view_dirty';
import { handleError } from '../render3/instructions/shared';
import { ɵɵtemplate } from '../render3/instructions/template';
import { isDestroyed } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, INJECTOR, PARENT, TVIEW } from '../render3/interfaces/view';
import { getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex } from '../render3/state';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { getConstant, getTNode, removeLViewOnDestroy, storeLViewOnDestroy } from '../render3/util/view_utils';
import { addLViewToLContainer, createAndRenderEmbeddedLView, removeLViewFromLContainer, shouldAddViewToDom } from '../render3/view_manipulation';
import { assertDefined, throwError } from '../util/assert';
import { performanceMarkFeature } from '../util/performance';
import { invokeAllTriggerCleanupFns, invokeTriggerCleanupFns, storeTriggerCleanupFn } from './cleanup';
import { onHover, onInteraction, onViewport, registerDomTrigger } from './dom_triggers';
import { onIdle } from './idle_scheduler';
import { DEFER_BLOCK_STATE, DeferBlockBehavior, DeferBlockInternalState, DeferBlockState, DeferDependenciesLoadingState, LOADING_AFTER_CLEANUP_FN, NEXT_DEFER_BLOCK_STATE, STATE_IS_FROZEN_UNTIL } from './interfaces';
import { onTimer, scheduleTimerTrigger } from './timer_scheduler';
import { addDepsToRegistry, assertDeferredDependenciesLoaded, getLDeferBlockDetails, getLoadingBlockAfter, getMinimumDurationForState, getPrimaryBlockTNode, getTDeferBlockDetails, getTemplateIndexForState, setLDeferBlockDetails, setTDeferBlockDetails } from './utils';
/**
 * **INTERNAL**, avoid referencing it in application code.
 * *
 * Injector token that allows to provide `DeferBlockDependencyInterceptor` class
 * implementation.
 *
 * This token is only injected in devMode
 */
export const DEFER_BLOCK_DEPENDENCY_INTERCEPTOR = new InjectionToken('DEFER_BLOCK_DEPENDENCY_INTERCEPTOR');
/**
 * **INTERNAL**, token used for configuring defer block behavior.
 */
export const DEFER_BLOCK_CONFIG = new InjectionToken(ngDevMode ? 'DEFER_BLOCK_CONFIG' : '');
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
 * Reference to the timer-based scheduler implementation of defer block state
 * rendering method. It's used to make timer-based scheduling tree-shakable.
 * If `minimum` or `after` parameters are used, compiler generates an extra
 * argument for the `ɵɵdefer` instruction, which references a timer-based
 * implementation.
 */
let applyDeferBlockStateWithSchedulingImpl = null;
/**
 * Enables timer-related scheduling if `after` or `minimum` parameters are setup
 * on the `@loading` or `@placeholder` blocks.
 */
export function ɵɵdeferEnableTimerScheduling(tView, tDetails, placeholderConfigIndex, loadingConfigIndex) {
    const tViewConsts = tView.consts;
    if (placeholderConfigIndex != null) {
        tDetails.placeholderBlockConfig =
            getConstant(tViewConsts, placeholderConfigIndex);
    }
    if (loadingConfigIndex != null) {
        tDetails.loadingBlockConfig =
            getConstant(tViewConsts, loadingConfigIndex);
    }
    // Enable implementation that supports timer-based scheduling.
    if (applyDeferBlockStateWithSchedulingImpl === null) {
        applyDeferBlockStateWithSchedulingImpl = applyDeferBlockStateWithScheduling;
    }
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
 * @param enableTimerScheduling Function that enables timer-related scheduling if `after`
 *     or `minimum` parameters are setup on the `@loading` or `@placeholder` blocks.
 *
 * @codeGenApi
 */
export function ɵɵdefer(index, primaryTmplIndex, dependencyResolverFn, loadingTmplIndex, placeholderTmplIndex, errorTmplIndex, loadingConfigIndex, placeholderConfigIndex, enableTimerScheduling) {
    const lView = getLView();
    const tView = getTView();
    const adjustedIndex = index + HEADER_OFFSET;
    ɵɵtemplate(index, null, 0, 0);
    if (tView.firstCreatePass) {
        performanceMarkFeature('NgDefer');
        const tDetails = {
            primaryTmplIndex,
            loadingTmplIndex: loadingTmplIndex ?? null,
            placeholderTmplIndex: placeholderTmplIndex ?? null,
            errorTmplIndex: errorTmplIndex ?? null,
            placeholderBlockConfig: null,
            loadingBlockConfig: null,
            dependencyResolverFn: dependencyResolverFn ?? null,
            loadingState: DeferDependenciesLoadingState.NOT_STARTED,
            loadingPromise: null,
            providers: null,
        };
        enableTimerScheduling?.(tView, tDetails, placeholderConfigIndex, loadingConfigIndex);
        setTDeferBlockDetails(tView, adjustedIndex, tDetails);
    }
    const tNode = getCurrentTNode();
    const lContainer = lView[adjustedIndex];
    // If hydration is enabled, looks up dehydrated views in the DOM
    // using hydration annotation info and stores those views on LContainer.
    // In client-only mode, this function is a noop.
    populateDehydratedViewsInLContainer(lContainer, tNode, lView);
    // Init instance-specific defer details and store it.
    const lDetails = [
        null, // NEXT_DEFER_BLOCK_STATE
        DeferBlockInternalState.Initial, // DEFER_BLOCK_STATE
        null, // STATE_IS_FROZEN_UNTIL
        null, // LOADING_AFTER_CLEANUP_FN
        null, // TRIGGER_CLEANUP_FNS
        null // PREFETCH_TRIGGER_CLEANUP_FNS
    ];
    setLDeferBlockDetails(lView, adjustedIndex, lDetails);
    const cleanupTriggersFn = () => invokeAllTriggerCleanupFns(lDetails);
    // When defer block is triggered - unsubscribe from LView destroy cleanup.
    storeTriggerCleanupFn(0 /* TriggerType.Regular */, lDetails, () => removeLViewOnDestroy(lView, cleanupTriggersFn));
    storeLViewOnDestroy(lView, cleanupTriggersFn);
}
/**
 * Loads defer block dependencies when a trigger value becomes truthy.
 * @codeGenApi
 */
export function ɵɵdeferWhen(rawValue) {
    const lView = getLView();
    const bindingIndex = nextBindingIndex();
    if (bindingUpdated(lView, bindingIndex, rawValue)) {
        const prevConsumer = setActiveConsumer(null);
        try {
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
        finally {
            setActiveConsumer(prevConsumer);
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
        const prevConsumer = setActiveConsumer(null);
        try {
            const value = Boolean(rawValue); // handle truthy or falsy values
            const tView = lView[TVIEW];
            const tNode = getSelectedTNode();
            const tDetails = getTDeferBlockDetails(tView, tNode);
            if (value === true && tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
                // If loading has not been started yet, trigger it now.
                triggerPrefetching(tDetails, lView, tNode);
            }
        }
        finally {
            setActiveConsumer(prevConsumer);
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
    scheduleDelayedPrefetching(onIdle);
}
/**
 * Sets up logic to handle the `on immediate` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferOnImmediate() {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const injector = lView[INJECTOR];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    // Render placeholder block only if loading template is not present and we're on
    // the client to avoid content flickering, since it would be immediately replaced
    // by the loading block.
    if (!shouldTriggerDeferBlock(injector) || tDetails.loadingTmplIndex === null) {
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
        triggerResourceLoading(tDetails, lView, tNode);
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
    scheduleDelayedPrefetching(onTimer(delay));
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
    registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onHover, () => triggerDeferBlock(lView, tNode), 0 /* TriggerType.Regular */);
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
        registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onHover, () => triggerPrefetching(tDetails, lView, tNode), 1 /* TriggerType.Prefetch */);
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
    registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onInteraction, () => triggerDeferBlock(lView, tNode), 0 /* TriggerType.Regular */);
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
        registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onInteraction, () => triggerPrefetching(tDetails, lView, tNode), 1 /* TriggerType.Prefetch */);
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
    registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onViewport, () => triggerDeferBlock(lView, tNode), 0 /* TriggerType.Regular */);
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
        registerDomTrigger(lView, tNode, triggerIndex, walkUpTimes, onViewport, () => triggerPrefetching(tDetails, lView, tNode), 1 /* TriggerType.Prefetch */);
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
    const cleanupFn = scheduleFn(() => triggerDeferBlock(lView, tNode), lView);
    const lDetails = getLDeferBlockDetails(lView, tNode);
    storeTriggerCleanupFn(0 /* TriggerType.Regular */, lDetails, cleanupFn);
}
/**
 * Schedules prefetching for `on idle` and `on timer` triggers.
 *
 * @param scheduleFn A function that does the scheduling.
 */
function scheduleDelayedPrefetching(scheduleFn) {
    const lView = getLView();
    const tNode = getCurrentTNode();
    const tView = lView[TVIEW];
    const tDetails = getTDeferBlockDetails(tView, tNode);
    if (tDetails.loadingState === DeferDependenciesLoadingState.NOT_STARTED) {
        const lDetails = getLDeferBlockDetails(lView, tNode);
        const prefetch = () => triggerPrefetching(tDetails, lView, tNode);
        const cleanupFn = scheduleFn(prefetch, lView);
        storeTriggerCleanupFn(1 /* TriggerType.Prefetch */, lDetails, cleanupFn);
    }
}
/**
 * Transitions a defer block to the new state. Updates the  necessary
 * data structures and renders corresponding block.
 *
 * @param newState New state that should be applied to the defer block.
 * @param tNode TNode that represents a defer block.
 * @param lContainer Represents an instance of a defer block.
 * @param skipTimerScheduling Indicates that `@loading` and `@placeholder` block
 *   should be rendered immediately, even if they have `after` or `minimum` config
 *   options setup. This flag to needed for testing APIs to transition defer block
 *   between states via `DeferFixture.render` method.
 */
export function renderDeferBlockState(newState, tNode, lContainer, skipTimerScheduling = false) {
    const hostLView = lContainer[PARENT];
    const hostTView = hostLView[TVIEW];
    // Check if this view is not destroyed. Since the loading process was async,
    // the view might end up being destroyed by the time rendering happens.
    if (isDestroyed(hostLView))
        return;
    // Make sure this TNode belongs to TView that represents host LView.
    ngDevMode && assertTNodeForLView(tNode, hostLView);
    const lDetails = getLDeferBlockDetails(hostLView, tNode);
    ngDevMode && assertDefined(lDetails, 'Expected a defer block state defined');
    const currentState = lDetails[DEFER_BLOCK_STATE];
    if (isValidStateChange(currentState, newState) &&
        isValidStateChange(lDetails[NEXT_DEFER_BLOCK_STATE] ?? -1, newState)) {
        const injector = hostLView[INJECTOR];
        const tDetails = getTDeferBlockDetails(hostTView, tNode);
        // Skips scheduling on the server since it can delay the server response.
        const needsScheduling = !skipTimerScheduling && isPlatformBrowser(injector) &&
            (getLoadingBlockAfter(tDetails) !== null ||
                getMinimumDurationForState(tDetails, DeferBlockState.Loading) !== null ||
                getMinimumDurationForState(tDetails, DeferBlockState.Placeholder));
        if (ngDevMode && needsScheduling) {
            assertDefined(applyDeferBlockStateWithSchedulingImpl, 'Expected scheduling function to be defined');
        }
        const applyStateFn = needsScheduling ? applyDeferBlockStateWithSchedulingImpl : applyDeferBlockState;
        try {
            applyStateFn(newState, lDetails, lContainer, tNode, hostLView);
        }
        catch (error) {
            handleError(hostLView, error);
        }
    }
}
/**
 * Detects whether an injector is an instance of a `ChainedInjector`,
 * created based on the `OutletInjector`.
 */
export function isRouterOutletInjector(currentInjector) {
    return (currentInjector instanceof ChainedInjector) &&
        (typeof currentInjector.injector.__ngOutletInjector === 'function');
}
/**
 * Creates an instance of the `OutletInjector` using a private factory
 * function available on the `OutletInjector` class.
 *
 * @param parentOutletInjector Parent OutletInjector, which should be used
 *                             to produce a new instance.
 * @param parentInjector An Injector, which should be used as a parent one
 *                       for a newly created `OutletInjector` instance.
 */
function createRouterOutletInjector(parentOutletInjector, parentInjector) {
    const outletInjector = parentOutletInjector.injector;
    return outletInjector.__ngOutletInjector(parentInjector);
}
/**
 * Applies changes to the DOM to reflect a given state.
 */
function applyDeferBlockState(newState, lDetails, lContainer, tNode, hostLView) {
    const stateTmplIndex = getTemplateIndexForState(newState, hostLView, tNode);
    if (stateTmplIndex !== null) {
        lDetails[DEFER_BLOCK_STATE] = newState;
        const hostTView = hostLView[TVIEW];
        const adjustedIndex = stateTmplIndex + HEADER_OFFSET;
        const activeBlockTNode = getTNode(hostTView, adjustedIndex);
        // There is only 1 view that can be present in an LContainer that
        // represents a defer block, so always refer to the first one.
        const viewIndex = 0;
        removeLViewFromLContainer(lContainer, viewIndex);
        let injector;
        if (newState === DeferBlockState.Complete) {
            // When we render a defer block in completed state, there might be
            // newly loaded standalone components used within the block, which may
            // import NgModules with providers. In order to make those providers
            // available for components declared in that NgModule, we create an instance
            // of environment injector to host those providers and pass this injector
            // to the logic that creates a view.
            const tDetails = getTDeferBlockDetails(hostTView, tNode);
            const providers = tDetails.providers;
            if (providers && providers.length > 0) {
                const parentInjector = hostLView[INJECTOR];
                // Note: we have a special case for Router's `OutletInjector`,
                // since it's not an instance of the `EnvironmentInjector`, so
                // we can't inject it. Once the `OutletInjector` is replaced
                // with the `EnvironmentInjector` in Router's code, this special
                // handling can be removed.
                const isParentOutletInjector = isRouterOutletInjector(parentInjector);
                const parentEnvInjector = isParentOutletInjector ? parentInjector : parentInjector.get(EnvironmentInjector);
                injector = parentEnvInjector.get(CachedInjectorService)
                    .getOrCreateInjector(tDetails, parentEnvInjector, providers, ngDevMode ? 'DeferBlock Injector' : '');
                // Note: this is a continuation of the special case for Router's `OutletInjector`.
                // Since the `OutletInjector` handles `ActivatedRoute` and `ChildrenOutletContexts`
                // dynamically (i.e. their values are not really stored statically in an injector),
                // we need to "wrap" a defer injector into another `OutletInjector`, so we retain
                // the dynamic resolution of the mentioned tokens.
                if (isParentOutletInjector) {
                    injector = createRouterOutletInjector(parentInjector, injector);
                }
            }
        }
        const dehydratedView = findMatchingDehydratedView(lContainer, activeBlockTNode.tView.ssrId);
        const embeddedLView = createAndRenderEmbeddedLView(hostLView, activeBlockTNode, null, { dehydratedView, injector });
        addLViewToLContainer(lContainer, embeddedLView, viewIndex, shouldAddViewToDom(activeBlockTNode, dehydratedView));
        markViewDirty(embeddedLView);
    }
}
/**
 * Extends the `applyDeferBlockState` with timer-based scheduling.
 * This function becomes available on a page if there are defer blocks
 * that use `after` or `minimum` parameters in the `@loading` or
 * `@placeholder` blocks.
 */
function applyDeferBlockStateWithScheduling(newState, lDetails, lContainer, tNode, hostLView) {
    const now = Date.now();
    const hostTView = hostLView[TVIEW];
    const tDetails = getTDeferBlockDetails(hostTView, tNode);
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
            applyDeferBlockState(newState, lDetails, lContainer, tNode, hostLView);
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
    return scheduleTimerTrigger(timeout, callback, hostLView);
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
 * Trigger prefetching of dependencies for a defer block.
 *
 * @param tDetails Static information about this defer block.
 * @param lView LView of a host view.
 */
export function triggerPrefetching(tDetails, lView, tNode) {
    if (lView[INJECTOR] && shouldTriggerDeferBlock(lView[INJECTOR])) {
        triggerResourceLoading(tDetails, lView, tNode);
    }
}
/**
 * Trigger loading of defer block dependencies if the process hasn't started yet.
 *
 * @param tDetails Static information about this defer block.
 * @param lView LView of a host view.
 */
export function triggerResourceLoading(tDetails, lView, tNode) {
    const injector = lView[INJECTOR];
    const tView = lView[TVIEW];
    if (tDetails.loadingState !== DeferDependenciesLoadingState.NOT_STARTED) {
        // If the loading status is different from initial one, it means that
        // the loading of dependencies is in progress and there is nothing to do
        // in this function. All details can be obtained from the `tDetails` object.
        return tDetails.loadingPromise ?? Promise.resolve();
    }
    const lDetails = getLDeferBlockDetails(lView, tNode);
    const primaryBlockTNode = getPrimaryBlockTNode(tView, tDetails);
    // Switch from NOT_STARTED -> IN_PROGRESS state.
    tDetails.loadingState = DeferDependenciesLoadingState.IN_PROGRESS;
    // Prefetching is triggered, cleanup all registered prefetch triggers.
    invokeTriggerCleanupFns(1 /* TriggerType.Prefetch */, lDetails);
    let dependenciesFn = tDetails.dependencyResolverFn;
    if (ngDevMode) {
        // Check if dependency function interceptor is configured.
        const deferDependencyInterceptor = injector.get(DEFER_BLOCK_DEPENDENCY_INTERCEPTOR, null, { optional: true });
        if (deferDependencyInterceptor) {
            dependenciesFn = deferDependencyInterceptor.intercept(dependenciesFn);
        }
    }
    // Indicate that an application is not stable and has a pending task.
    const pendingTasks = injector.get(PendingTasks);
    const taskId = pendingTasks.add();
    // The `dependenciesFn` might be `null` when all dependencies within
    // a given defer block were eagerly referenced elsewhere in a file,
    // thus no dynamic `import()`s were produced.
    if (!dependenciesFn) {
        tDetails.loadingPromise = Promise.resolve().then(() => {
            tDetails.loadingPromise = null;
            tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;
            pendingTasks.remove(taskId);
        });
        return tDetails.loadingPromise;
    }
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
        // Loading is completed, we no longer need the loading Promise
        // and a pending task should also be removed.
        tDetails.loadingPromise = null;
        pendingTasks.remove(taskId);
        if (failed) {
            tDetails.loadingState = DeferDependenciesLoadingState.FAILED;
            if (tDetails.errorTmplIndex === null) {
                const templateLocation = getTemplateLocationDetails(lView);
                const error = new RuntimeError(750 /* RuntimeErrorCode.DEFER_LOADING_FAILED */, ngDevMode &&
                    'Loading dependencies for `@defer` block failed, ' +
                        `but no \`@error\` block was configured${templateLocation}. ` +
                        'Consider using the `@error` block to render an error state.');
                handleError(lView, error);
            }
        }
        else {
            tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;
            // Update directive and pipe registries to add newly downloaded dependencies.
            const primaryBlockTView = primaryBlockTNode.tView;
            if (directiveDefs.length > 0) {
                primaryBlockTView.directiveRegistry =
                    addDepsToRegistry(primaryBlockTView.directiveRegistry, directiveDefs);
                // Extract providers from all NgModules imported by standalone components
                // used within this defer block.
                const directiveTypes = directiveDefs.map(def => def.type);
                const providers = internalImportProvidersFrom(false, ...directiveTypes);
                tDetails.providers = providers;
            }
            if (pipeDefs.length > 0) {
                primaryBlockTView.pipeRegistry =
                    addDepsToRegistry(primaryBlockTView.pipeRegistry, pipeDefs);
            }
        }
    });
    return tDetails.loadingPromise;
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
    const lDetails = getLDeferBlockDetails(lView, tNode);
    const tDetails = getTDeferBlockDetails(tView, tNode);
    // Defer block is triggered, cleanup all registered trigger functions.
    invokeAllTriggerCleanupFns(lDetails);
    switch (tDetails.loadingState) {
        case DeferDependenciesLoadingState.NOT_STARTED:
            renderDeferBlockState(DeferBlockState.Loading, tNode, lContainer);
            triggerResourceLoading(tDetails, lView, tNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRW5FLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQVcsTUFBTSxPQUFPLENBQUM7QUFDcEUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDOUQsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDakYsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDekQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbkYsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFDdEYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHlDQUF5QyxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sa0NB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Q3pDLFNBQVMsSUFBSSxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNuRSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxNQUFNO1lBQ3ZDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU07UUFDUjtZQUNFLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2QsVUFBVSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDMUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtDYWNoZWRJbmplY3RvclNlcnZpY2V9IGZyb20gJy4uL2NhY2hlZF9pbmplY3Rvcl9zZXJ2aWNlJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3RvciwgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2ludGVybmFsSW1wb3J0UHJvdmlkZXJzRnJvbX0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vcmVuZGVyMy9iaW5kaW5ncyc7XG5pbXBvcnQge0NoYWluZWRJbmplY3Rvcn0gZnJvbSAnLi4vcmVuZGVyMy9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2dldFRlbXBsYXRlTG9jYXRpb25EZXRhaWxzfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50X3ZhbGlkYXRpb24nO1xuaW1wb3J0IHttYXJrVmlld0RpcnR5fSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9tYXJrX3ZpZXdfZGlydHknO1xuaW1wb3J0IHtoYW5kbGVFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ybXJtXRlbXBsYXRlfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNEZXN0cm95ZWR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIElOSkVDVE9SLCBMVmlldywgUEFSRU5ULCBUVklFVywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRUTm9kZSwgZ2V0VFZpZXcsIG5leHRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3JlbmRlcjMvc3RhdGUnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0VE5vZGUsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2FkZExWaWV3VG9MQ29udGFpbmVyLCBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3LCByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyLCBzaG91bGRBZGRWaWV3VG9Eb219IGZyb20gJy4uL3JlbmRlcjMvdmlld19tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCB0aHJvd0Vycm9yfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuXG5pbXBvcnQge2ludm9rZUFsbFRyaWdnZXJDbGVhbnVwRm5zLCBpbnZva2VUcmlnZ2VyQ2xlYW51cEZucywgc3RvcmVUcmlnZ2VyQ2xlYW51cEZufSBmcm9tICcuL2NsZWFudXAnO1xuaW1wb3J0IHtvbkhvdmVyLCBvbkludGVyYWN0aW9uLCBvblZpZXdwb3J0LCByZWdpc3RlckRvbVRyaWdnZXJ9IGZyb20gJy4vZG9tX3RyaWdnZXJzJztcbmltcG9ydCB7b25JZGxlfSBmcm9tICcuL2lkbGVfc2NoZWR1bGVyJztcbmltcG9ydCB7REVGRVJfQkxPQ0tfU1RBVEUsIERlZmVyQmxvY2tCZWhhdmlvciwgRGVmZXJCbG9ja0NvbmZpZywgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvciwgRGVmZXJCbG9ja0ludGVybmFsU3RhdGUsIERlZmVyQmxvY2tTdGF0ZSwgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUsIERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnLCBEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWcsIERlcGVuZGVuY3lSZXNvbHZlckZuLCBMRGVmZXJCbG9ja0RldGFpbHMsIExPQURJTkdfQUZURVJfQ0xFQU5VUF9GTiwgTkVYVF9ERUZFUl9CTE9DS19TVEFURSwgU1RBVEVfSVNfRlJPWkVOX1VOVElMLCBURGVmZXJCbG9ja0RldGFpbHMsIFRyaWdnZXJUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtvblRpbWVyLCBzY2hlZHVsZVRpbWVyVHJpZ2dlcn0gZnJvbSAnLi90aW1lcl9zY2hlZHVsZXInO1xuaW1wb3J0IHthZGREZXBzVG9SZWdpc3RyeSwgYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQsIGdldExEZWZlckJsb2NrRGV0YWlscywgZ2V0TG9hZGluZ0Jsb2NrQWZ0ZXIsIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlLCBnZXRQcmltYXJ5QmxvY2tUTm9kZSwgZ2V0VERlZmVyQmxvY2tEZXRhaWxzLCBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUsIHNldExEZWZlckJsb2NrRGV0YWlscywgc2V0VERlZmVyQmxvY2tEZXRhaWxzfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKiAqXG4gKiBJbmplY3RvciB0b2tlbiB0aGF0IGFsbG93cyB0byBwcm92aWRlIGBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yYCBjbGFzc1xuICogaW1wbGVtZW50YXRpb24uXG4gKlxuICogVGhpcyB0b2tlbiBpcyBvbmx5IGluamVjdGVkIGluIGRldk1vZGVcbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yPignREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUicpO1xuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgdG9rZW4gdXNlZCBmb3IgY29uZmlndXJpbmcgZGVmZXIgYmxvY2sgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19DT05GSUcgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrQ29uZmlnPihuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfQ09ORklHJyA6ICcnKTtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgZGVmZXIgYmxvY2tzIHNob3VsZCBiZSB0cmlnZ2VyZWQuXG4gKlxuICogQ3VycmVudGx5LCBkZWZlciBibG9ja3MgYXJlIG5vdCB0cmlnZ2VyZWQgb24gdGhlIHNlcnZlcixcbiAqIG9ubHkgcGxhY2Vob2xkZXIgY29udGVudCBpcyByZW5kZXJlZCAoaWYgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcjogSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgY29uc3QgY29uZmlnID0gaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0NPTkZJRywgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gIGlmIChjb25maWc/LmJlaGF2aW9yID09PSBEZWZlckJsb2NrQmVoYXZpb3IuTWFudWFsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBpc1BsYXRmb3JtQnJvd3NlcihpbmplY3Rvcik7XG59XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIHRoZSB0aW1lci1iYXNlZCBzY2hlZHVsZXIgaW1wbGVtZW50YXRpb24gb2YgZGVmZXIgYmxvY2sgc3RhdGVcbiAqIHJlbmRlcmluZyBtZXRob2QuIEl0J3MgdXNlZCB0byBtYWtlIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcgdHJlZS1zaGFrYWJsZS5cbiAqIElmIGBtaW5pbXVtYCBvciBgYWZ0ZXJgIHBhcmFtZXRlcnMgYXJlIHVzZWQsIGNvbXBpbGVyIGdlbmVyYXRlcyBhbiBleHRyYVxuICogYXJndW1lbnQgZm9yIHRoZSBgybXJtWRlZmVyYCBpbnN0cnVjdGlvbiwgd2hpY2ggcmVmZXJlbmNlcyBhIHRpbWVyLWJhc2VkXG4gKiBpbXBsZW1lbnRhdGlvbi5cbiAqL1xubGV0IGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsOiAodHlwZW9mIGFwcGx5RGVmZXJCbG9ja1N0YXRlKXxudWxsID0gbnVsbDtcblxuLyoqXG4gKiBFbmFibGVzIHRpbWVyLXJlbGF0ZWQgc2NoZWR1bGluZyBpZiBgYWZ0ZXJgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGFyZSBzZXR1cFxuICogb24gdGhlIGBAbG9hZGluZ2Agb3IgYEBwbGFjZWhvbGRlcmAgYmxvY2tzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyRW5hYmxlVGltZXJTY2hlZHVsaW5nKFxuICAgIHRWaWV3OiBUVmlldywgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgcGxhY2Vob2xkZXJDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsKSB7XG4gIGNvbnN0IHRWaWV3Q29uc3RzID0gdFZpZXcuY29uc3RzO1xuICBpZiAocGxhY2Vob2xkZXJDb25maWdJbmRleCAhPSBudWxsKSB7XG4gICAgdERldGFpbHMucGxhY2Vob2xkZXJCbG9ja0NvbmZpZyA9XG4gICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpO1xuICB9XG4gIGlmIChsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCkge1xuICAgIHREZXRhaWxzLmxvYWRpbmdCbG9ja0NvbmZpZyA9XG4gICAgICAgIGdldENvbnN0YW50PERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnPih0Vmlld0NvbnN0cywgbG9hZGluZ0NvbmZpZ0luZGV4KTtcbiAgfVxuXG4gIC8vIEVuYWJsZSBpbXBsZW1lbnRhdGlvbiB0aGF0IHN1cHBvcnRzIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcuXG4gIGlmIChhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nSW1wbCA9PT0gbnVsbCkge1xuICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsID0gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZztcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIGRlZmVyIGJsb2Nrcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGBkZWZlcmAgaW5zdHJ1Y3Rpb24uXG4gKiBAcGFyYW0gcHJpbWFyeVRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcHJpbWFyeSBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGRlcGVuZGVuY3lSZXNvbHZlckZuIEZ1bmN0aW9uIHRoYXQgY29udGFpbnMgZGVwZW5kZW5jaWVzIGZvciB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxvYWRpbmdUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGxvYWRpbmcgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcGxhY2Vob2xkZXIgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBlcnJvclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgZXJyb3IgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBsb2FkaW5nQ29uZmlnSW5kZXggSW5kZXggaW4gdGhlIGNvbnN0YW50cyBhcnJheSBvZiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgbG9hZGluZy5cbiAqICAgICBibG9jay5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlckNvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgcGxhY2Vob2xkZXIgYmxvY2suXG4gKiBAcGFyYW0gZW5hYmxlVGltZXJTY2hlZHVsaW5nIEZ1bmN0aW9uIHRoYXQgZW5hYmxlcyB0aW1lci1yZWxhdGVkIHNjaGVkdWxpbmcgaWYgYGFmdGVyYFxuICogICAgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGFyZSBzZXR1cCBvbiB0aGUgYEBsb2FkaW5nYCBvciBgQHBsYWNlaG9sZGVyYCBibG9ja3MuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcihcbiAgICBpbmRleDogbnVtYmVyLCBwcmltYXJ5VG1wbEluZGV4OiBudW1iZXIsIGRlcGVuZGVuY3lSZXNvbHZlckZuPzogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCxcbiAgICBsb2FkaW5nVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIHBsYWNlaG9sZGVyVG1wbEluZGV4PzogbnVtYmVyfG51bGwsXG4gICAgZXJyb3JUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCwgbG9hZGluZ0NvbmZpZ0luZGV4PzogbnVtYmVyfG51bGwsXG4gICAgcGxhY2Vob2xkZXJDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVuYWJsZVRpbWVyU2NoZWR1bGluZz86IHR5cGVvZiDJtcm1ZGVmZXJFbmFibGVUaW1lclNjaGVkdWxpbmcpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdEZWZlcicpO1xuXG4gICAgY29uc3QgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscyA9IHtcbiAgICAgIHByaW1hcnlUbXBsSW5kZXgsXG4gICAgICBsb2FkaW5nVG1wbEluZGV4OiBsb2FkaW5nVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlclRtcGxJbmRleDogcGxhY2Vob2xkZXJUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIGVycm9yVG1wbEluZGV4OiBlcnJvclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJCbG9ja0NvbmZpZzogbnVsbCxcbiAgICAgIGxvYWRpbmdCbG9ja0NvbmZpZzogbnVsbCxcbiAgICAgIGRlcGVuZGVuY3lSZXNvbHZlckZuOiBkZXBlbmRlbmN5UmVzb2x2ZXJGbiA/PyBudWxsLFxuICAgICAgbG9hZGluZ1N0YXRlOiBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCxcbiAgICAgIGxvYWRpbmdQcm9taXNlOiBudWxsLFxuICAgICAgcHJvdmlkZXJzOiBudWxsLFxuICAgIH07XG4gICAgZW5hYmxlVGltZXJTY2hlZHVsaW5nPy4odFZpZXcsIHREZXRhaWxzLCBwbGFjZWhvbGRlckNvbmZpZ0luZGV4LCBsb2FkaW5nQ29uZmlnSW5kZXgpO1xuICAgIHNldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgYWRqdXN0ZWRJbmRleCwgdERldGFpbHMpO1xuICB9XG5cbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1thZGp1c3RlZEluZGV4XTtcblxuICAvLyBJZiBoeWRyYXRpb24gaXMgZW5hYmxlZCwgbG9va3MgdXAgZGVoeWRyYXRlZCB2aWV3cyBpbiB0aGUgRE9NXG4gIC8vIHVzaW5nIGh5ZHJhdGlvbiBhbm5vdGF0aW9uIGluZm8gYW5kIHN0b3JlcyB0aG9zZSB2aWV3cyBvbiBMQ29udGFpbmVyLlxuICAvLyBJbiBjbGllbnQtb25seSBtb2RlLCB0aGlzIGZ1bmN0aW9uIGlzIGEgbm9vcC5cbiAgcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXIobENvbnRhaW5lciwgdE5vZGUsIGxWaWV3KTtcblxuICAvLyBJbml0IGluc3RhbmNlLXNwZWNpZmljIGRlZmVyIGRldGFpbHMgYW5kIHN0b3JlIGl0LlxuICBjb25zdCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzID0gW1xuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBORVhUX0RFRkVSX0JMT0NLX1NUQVRFXG4gICAgRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCwgIC8vIERFRkVSX0JMT0NLX1NUQVRFXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNUQVRFX0lTX0ZST1pFTl9VTlRJTFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5cbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVFJJR0dFUl9DTEVBTlVQX0ZOU1xuICAgIG51bGwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQUkVGRVRDSF9UUklHR0VSX0NMRUFOVVBfRk5TXG4gIF07XG4gIHNldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgYWRqdXN0ZWRJbmRleCwgbERldGFpbHMpO1xuXG4gIGNvbnN0IGNsZWFudXBUcmlnZ2Vyc0ZuID0gKCkgPT4gaW52b2tlQWxsVHJpZ2dlckNsZWFudXBGbnMobERldGFpbHMpO1xuXG4gIC8vIFdoZW4gZGVmZXIgYmxvY2sgaXMgdHJpZ2dlcmVkIC0gdW5zdWJzY3JpYmUgZnJvbSBMVmlldyBkZXN0cm95IGNsZWFudXAuXG4gIHN0b3JlVHJpZ2dlckNsZWFudXBGbihcbiAgICAgIFRyaWdnZXJUeXBlLlJlZ3VsYXIsIGxEZXRhaWxzLCAoKSA9PiByZW1vdmVMVmlld09uRGVzdHJveShsVmlldywgY2xlYW51cFRyaWdnZXJzRm4pKTtcbiAgc3RvcmVMVmlld09uRGVzdHJveShsVmlldywgY2xlYW51cFRyaWdnZXJzRm4pO1xufVxuXG4vKipcbiAqIExvYWRzIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyB3aGVuIGEgdHJpZ2dlciB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UgJiYgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCkge1xuICAgICAgICAvLyBJZiBub3RoaW5nIGlzIHJlbmRlcmVkIHlldCwgcmVuZGVyIGEgcGxhY2Vob2xkZXIgKGlmIGRlZmluZWQpLlxuICAgICAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICB2YWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgIChyZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsIHx8XG4gICAgICAgICAgIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikpIHtcbiAgICAgICAgLy8gVGhlIGB3aGVuYCBjb25kaXRpb24gaGFzIGNoYW5nZWQgdG8gYHRydWVgLCB0cmlnZ2VyIGRlZmVyIGJsb2NrIGxvYWRpbmdcbiAgICAgICAgLy8gaWYgdGhlIGJsb2NrIGlzIGVpdGhlciBpbiBpbml0aWFsIChub3RoaW5nIGlzIHJlbmRlcmVkKSBvciBhIHBsYWNlaG9sZGVyXG4gICAgICAgIC8vIHN0YXRlLlxuICAgICAgICB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByZWZldGNoZXMgdGhlIGRlZmVycmVkIGNvbnRlbnQgd2hlbiBhIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcblxuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICBpZiAodmFsdWUgPT09IHRydWUgJiYgdERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICAgIHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRUcmlnZ2VyKG9uSWRsZSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBwcmVmZXRjaCBvbiBpZGxlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhvbklkbGUpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIFJlbmRlciBwbGFjZWhvbGRlciBibG9jayBvbmx5IGlmIGxvYWRpbmcgdGVtcGxhdGUgaXMgbm90IHByZXNlbnQgYW5kIHdlJ3JlIG9uXG4gIC8vIHRoZSBjbGllbnQgdG8gYXZvaWQgY29udGVudCBmbGlja2VyaW5nLCBzaW5jZSBpdCB3b3VsZCBiZSBpbW1lZGlhdGVseSByZXBsYWNlZFxuICAvLyBieSB0aGUgbG9hZGluZyBibG9jay5cbiAgaWYgKCFzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcikgfHwgdERldGFpbHMubG9hZGluZ1RtcGxJbmRleCA9PT0gbnVsbCkge1xuICAgIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIH1cbiAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbn1cblxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgcHJlZmV0Y2ggb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbW1lZGlhdGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgbG9hZGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkVHJpZ2dlcihvblRpbWVyKGRlbGF5KSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiB0aW1lcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgdGltZSB0byB3YWl0IGJlZm9yZSBwcmVmZXRjaGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uVGltZXIoZGVsYXk6IG51bWJlcikge1xuICBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhvblRpbWVyKGRlbGF5KSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25Ib3Zlcih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSG92ZXIsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksXG4gICAgICBUcmlnZ2VyVHlwZS5SZWd1bGFyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSG92ZXIsXG4gICAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKSwgVHJpZ2dlclR5cGUuUHJlZmV0Y2gpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JbnRlcmFjdGlvbih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSW50ZXJhY3Rpb24sICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksXG4gICAgICBUcmlnZ2VyVHlwZS5SZWd1bGFyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW50ZXJhY3Rpb24odHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSW50ZXJhY3Rpb24sXG4gICAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKSwgVHJpZ2dlclR5cGUuUHJlZmV0Y2gpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksXG4gICAgICBUcmlnZ2VyVHlwZS5SZWd1bGFyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIHZpZXdwb3J0YCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uVmlld3BvcnQodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsXG4gICAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKSwgVHJpZ2dlclR5cGUuUHJlZmV0Y2gpO1xuICB9XG59XG5cbi8qKioqKioqKioqIEhlbHBlciBmdW5jdGlvbnMgKioqKioqKioqKi9cblxuLyoqXG4gKiBTY2hlZHVsZXMgdHJpZ2dlcmluZyBvZiBhIGRlZmVyIGJsb2NrIGZvciBgb24gaWRsZWAgYW5kIGBvbiB0aW1lcmAgY29uZGl0aW9ucy5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVEZWxheWVkVHJpZ2dlcihcbiAgICBzY2hlZHVsZUZuOiAoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3KSA9PiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICBjb25zdCBjbGVhbnVwRm4gPSBzY2hlZHVsZUZuKCgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksIGxWaWV3KTtcbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgc3RvcmVUcmlnZ2VyQ2xlYW51cEZuKFRyaWdnZXJUeXBlLlJlZ3VsYXIsIGxEZXRhaWxzLCBjbGVhbnVwRm4pO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBwcmVmZXRjaGluZyBmb3IgYG9uIGlkbGVgIGFuZCBgb24gdGltZXJgIHRyaWdnZXJzLlxuICpcbiAqIEBwYXJhbSBzY2hlZHVsZUZuIEEgZnVuY3Rpb24gdGhhdCBkb2VzIHRoZSBzY2hlZHVsaW5nLlxuICovXG5mdW5jdGlvbiBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhcbiAgICBzY2hlZHVsZUZuOiAoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3KSA9PiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHByZWZldGNoID0gKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IGNsZWFudXBGbiA9IHNjaGVkdWxlRm4ocHJlZmV0Y2gsIGxWaWV3KTtcbiAgICBzdG9yZVRyaWdnZXJDbGVhbnVwRm4oVHJpZ2dlclR5cGUuUHJlZmV0Y2gsIGxEZXRhaWxzLCBjbGVhbnVwRm4pO1xuICB9XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbnMgYSBkZWZlciBibG9jayB0byB0aGUgbmV3IHN0YXRlLiBVcGRhdGVzIHRoZSAgbmVjZXNzYXJ5XG4gKiBkYXRhIHN0cnVjdHVyZXMgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBibG9jay5cbiAqXG4gKiBAcGFyYW0gbmV3U3RhdGUgTmV3IHN0YXRlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHNraXBUaW1lclNjaGVkdWxpbmcgSW5kaWNhdGVzIHRoYXQgYEBsb2FkaW5nYCBhbmQgYEBwbGFjZWhvbGRlcmAgYmxvY2tcbiAqICAgc2hvdWxkIGJlIHJlbmRlcmVkIGltbWVkaWF0ZWx5LCBldmVuIGlmIHRoZXkgaGF2ZSBgYWZ0ZXJgIG9yIGBtaW5pbXVtYCBjb25maWdcbiAqICAgb3B0aW9ucyBzZXR1cC4gVGhpcyBmbGFnIHRvIG5lZWRlZCBmb3IgdGVzdGluZyBBUElzIHRvIHRyYW5zaXRpb24gZGVmZXIgYmxvY2tcbiAqICAgYmV0d2VlbiBzdGF0ZXMgdmlhIGBEZWZlckZpeHR1cmUucmVuZGVyYCBtZXRob2QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgdE5vZGU6IFROb2RlLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICAgIHNraXBUaW1lclNjaGVkdWxpbmcgPSBmYWxzZSk6IHZvaWQge1xuICBjb25zdCBob3N0TFZpZXcgPSBsQ29udGFpbmVyW1BBUkVOVF07XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG5cbiAgLy8gQ2hlY2sgaWYgdGhpcyB2aWV3IGlzIG5vdCBkZXN0cm95ZWQuIFNpbmNlIHRoZSBsb2FkaW5nIHByb2Nlc3Mgd2FzIGFzeW5jLFxuICAvLyB0aGUgdmlldyBtaWdodCBlbmQgdXAgYmVpbmcgZGVzdHJveWVkIGJ5IHRoZSB0aW1lIHJlbmRlcmluZyBoYXBwZW5zLlxuICBpZiAoaXNEZXN0cm95ZWQoaG9zdExWaWV3KSkgcmV0dXJuO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGlzIFROb2RlIGJlbG9uZ3MgdG8gVFZpZXcgdGhhdCByZXByZXNlbnRzIGhvc3QgTFZpZXcuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBob3N0TFZpZXcpO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGhvc3RMVmlldywgdE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxEZXRhaWxzLCAnRXhwZWN0ZWQgYSBkZWZlciBibG9jayBzdGF0ZSBkZWZpbmVkJyk7XG5cbiAgY29uc3QgY3VycmVudFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuXG4gIGlmIChpc1ZhbGlkU3RhdGVDaGFuZ2UoY3VycmVudFN0YXRlLCBuZXdTdGF0ZSkgJiZcbiAgICAgIGlzVmFsaWRTdGF0ZUNoYW5nZShsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA/PyAtMSwgbmV3U3RhdGUpKSB7XG4gICAgY29uc3QgaW5qZWN0b3IgPSBob3N0TFZpZXdbSU5KRUNUT1JdITtcbiAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyhob3N0VFZpZXcsIHROb2RlKTtcbiAgICAvLyBTa2lwcyBzY2hlZHVsaW5nIG9uIHRoZSBzZXJ2ZXIgc2luY2UgaXQgY2FuIGRlbGF5IHRoZSBzZXJ2ZXIgcmVzcG9uc2UuXG4gICAgY29uc3QgbmVlZHNTY2hlZHVsaW5nID0gIXNraXBUaW1lclNjaGVkdWxpbmcgJiYgaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpICYmXG4gICAgICAgIChnZXRMb2FkaW5nQmxvY2tBZnRlcih0RGV0YWlscykgIT09IG51bGwgfHxcbiAgICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuTG9hZGluZykgIT09IG51bGwgfHxcbiAgICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKTtcblxuICAgIGlmIChuZ0Rldk1vZGUgJiYgbmVlZHNTY2hlZHVsaW5nKSB7XG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsLCAnRXhwZWN0ZWQgc2NoZWR1bGluZyBmdW5jdGlvbiB0byBiZSBkZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYXBwbHlTdGF0ZUZuID1cbiAgICAgICAgbmVlZHNTY2hlZHVsaW5nID8gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZ0ltcGwhIDogYXBwbHlEZWZlckJsb2NrU3RhdGU7XG4gICAgdHJ5IHtcbiAgICAgIGFwcGx5U3RhdGVGbihuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICBoYW5kbGVFcnJvcihob3N0TFZpZXcsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgYW4gaW5qZWN0b3IgaXMgYW4gaW5zdGFuY2Ugb2YgYSBgQ2hhaW5lZEluamVjdG9yYCxcbiAqIGNyZWF0ZWQgYmFzZWQgb24gdGhlIGBPdXRsZXRJbmplY3RvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JvdXRlck91dGxldEluamVjdG9yKGN1cnJlbnRJbmplY3RvcjogSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuIChjdXJyZW50SW5qZWN0b3IgaW5zdGFuY2VvZiBDaGFpbmVkSW5qZWN0b3IpICYmXG4gICAgICAodHlwZW9mIChjdXJyZW50SW5qZWN0b3IuaW5qZWN0b3IgYXMgYW55KS5fX25nT3V0bGV0SW5qZWN0b3IgPT09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIGBPdXRsZXRJbmplY3RvcmAgdXNpbmcgYSBwcml2YXRlIGZhY3RvcnlcbiAqIGZ1bmN0aW9uIGF2YWlsYWJsZSBvbiB0aGUgYE91dGxldEluamVjdG9yYCBjbGFzcy5cbiAqXG4gKiBAcGFyYW0gcGFyZW50T3V0bGV0SW5qZWN0b3IgUGFyZW50IE91dGxldEluamVjdG9yLCB3aGljaCBzaG91bGQgYmUgdXNlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIHByb2R1Y2UgYSBuZXcgaW5zdGFuY2UuXG4gKiBAcGFyYW0gcGFyZW50SW5qZWN0b3IgQW4gSW5qZWN0b3IsIHdoaWNoIHNob3VsZCBiZSB1c2VkIGFzIGEgcGFyZW50IG9uZVxuICogICAgICAgICAgICAgICAgICAgICAgIGZvciBhIG5ld2x5IGNyZWF0ZWQgYE91dGxldEluamVjdG9yYCBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlUm91dGVyT3V0bGV0SW5qZWN0b3IoXG4gICAgcGFyZW50T3V0bGV0SW5qZWN0b3I6IENoYWluZWRJbmplY3RvciwgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIGNvbnN0IG91dGxldEluamVjdG9yID0gcGFyZW50T3V0bGV0SW5qZWN0b3IuaW5qZWN0b3IgYXMgYW55O1xuICByZXR1cm4gb3V0bGV0SW5qZWN0b3IuX19uZ091dGxldEluamVjdG9yKHBhcmVudEluamVjdG9yKTtcbn1cblxuXG4vKipcbiAqIEFwcGxpZXMgY2hhbmdlcyB0byB0aGUgRE9NIHRvIHJlZmxlY3QgYSBnaXZlbiBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gYXBwbHlEZWZlckJsb2NrU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdE5vZGU6IFROb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXc8dW5rbm93bj4pIHtcbiAgY29uc3Qgc3RhdGVUbXBsSW5kZXggPSBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUobmV3U3RhdGUsIGhvc3RMVmlldywgdE5vZGUpO1xuXG4gIGlmIChzdGF0ZVRtcGxJbmRleCAhPT0gbnVsbCkge1xuICAgIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IHN0YXRlVG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgICBjb25zdCBhY3RpdmVCbG9ja1ROb2RlID0gZ2V0VE5vZGUoaG9zdFRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcblxuICAgIC8vIFRoZXJlIGlzIG9ubHkgMSB2aWV3IHRoYXQgY2FuIGJlIHByZXNlbnQgaW4gYW4gTENvbnRhaW5lciB0aGF0XG4gICAgLy8gcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLCBzbyBhbHdheXMgcmVmZXIgdG8gdGhlIGZpcnN0IG9uZS5cbiAgICBjb25zdCB2aWV3SW5kZXggPSAwO1xuXG4gICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyLCB2aWV3SW5kZXgpO1xuXG4gICAgbGV0IGluamVjdG9yOiBJbmplY3Rvcnx1bmRlZmluZWQ7XG4gICAgaWYgKG5ld1N0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUpIHtcbiAgICAgIC8vIFdoZW4gd2UgcmVuZGVyIGEgZGVmZXIgYmxvY2sgaW4gY29tcGxldGVkIHN0YXRlLCB0aGVyZSBtaWdodCBiZVxuICAgICAgLy8gbmV3bHkgbG9hZGVkIHN0YW5kYWxvbmUgY29tcG9uZW50cyB1c2VkIHdpdGhpbiB0aGUgYmxvY2ssIHdoaWNoIG1heVxuICAgICAgLy8gaW1wb3J0IE5nTW9kdWxlcyB3aXRoIHByb3ZpZGVycy4gSW4gb3JkZXIgdG8gbWFrZSB0aG9zZSBwcm92aWRlcnNcbiAgICAgIC8vIGF2YWlsYWJsZSBmb3IgY29tcG9uZW50cyBkZWNsYXJlZCBpbiB0aGF0IE5nTW9kdWxlLCB3ZSBjcmVhdGUgYW4gaW5zdGFuY2VcbiAgICAgIC8vIG9mIGVudmlyb25tZW50IGluamVjdG9yIHRvIGhvc3QgdGhvc2UgcHJvdmlkZXJzIGFuZCBwYXNzIHRoaXMgaW5qZWN0b3JcbiAgICAgIC8vIHRvIHRoZSBsb2dpYyB0aGF0IGNyZWF0ZXMgYSB2aWV3LlxuICAgICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHMoaG9zdFRWaWV3LCB0Tm9kZSk7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSB0RGV0YWlscy5wcm92aWRlcnM7XG4gICAgICBpZiAocHJvdmlkZXJzICYmIHByb3ZpZGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gaG9zdExWaWV3W0lOSkVDVE9SXSBhcyBJbmplY3RvcjtcblxuICAgICAgICAvLyBOb3RlOiB3ZSBoYXZlIGEgc3BlY2lhbCBjYXNlIGZvciBSb3V0ZXIncyBgT3V0bGV0SW5qZWN0b3JgLFxuICAgICAgICAvLyBzaW5jZSBpdCdzIG5vdCBhbiBpbnN0YW5jZSBvZiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgLCBzb1xuICAgICAgICAvLyB3ZSBjYW4ndCBpbmplY3QgaXQuIE9uY2UgdGhlIGBPdXRsZXRJbmplY3RvcmAgaXMgcmVwbGFjZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGluIFJvdXRlcidzIGNvZGUsIHRoaXMgc3BlY2lhbFxuICAgICAgICAvLyBoYW5kbGluZyBjYW4gYmUgcmVtb3ZlZC5cbiAgICAgICAgY29uc3QgaXNQYXJlbnRPdXRsZXRJbmplY3RvciA9IGlzUm91dGVyT3V0bGV0SW5qZWN0b3IocGFyZW50SW5qZWN0b3IpO1xuICAgICAgICBjb25zdCBwYXJlbnRFbnZJbmplY3RvciA9XG4gICAgICAgICAgICBpc1BhcmVudE91dGxldEluamVjdG9yID8gcGFyZW50SW5qZWN0b3IgOiBwYXJlbnRJbmplY3Rvci5nZXQoRW52aXJvbm1lbnRJbmplY3Rvcik7XG5cbiAgICAgICAgaW5qZWN0b3IgPSBwYXJlbnRFbnZJbmplY3Rvci5nZXQoQ2FjaGVkSW5qZWN0b3JTZXJ2aWNlKVxuICAgICAgICAgICAgICAgICAgICAgICAuZ2V0T3JDcmVhdGVJbmplY3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHREZXRhaWxzLCBwYXJlbnRFbnZJbmplY3RvciBhcyBFbnZpcm9ubWVudEluamVjdG9yLCBwcm92aWRlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgPyAnRGVmZXJCbG9jayBJbmplY3RvcicgOiAnJyk7XG5cbiAgICAgICAgLy8gTm90ZTogdGhpcyBpcyBhIGNvbnRpbnVhdGlvbiBvZiB0aGUgc3BlY2lhbCBjYXNlIGZvciBSb3V0ZXIncyBgT3V0bGV0SW5qZWN0b3JgLlxuICAgICAgICAvLyBTaW5jZSB0aGUgYE91dGxldEluamVjdG9yYCBoYW5kbGVzIGBBY3RpdmF0ZWRSb3V0ZWAgYW5kIGBDaGlsZHJlbk91dGxldENvbnRleHRzYFxuICAgICAgICAvLyBkeW5hbWljYWxseSAoaS5lLiB0aGVpciB2YWx1ZXMgYXJlIG5vdCByZWFsbHkgc3RvcmVkIHN0YXRpY2FsbHkgaW4gYW4gaW5qZWN0b3IpLFxuICAgICAgICAvLyB3ZSBuZWVkIHRvIFwid3JhcFwiIGEgZGVmZXIgaW5qZWN0b3IgaW50byBhbm90aGVyIGBPdXRsZXRJbmplY3RvcmAsIHNvIHdlIHJldGFpblxuICAgICAgICAvLyB0aGUgZHluYW1pYyByZXNvbHV0aW9uIG9mIHRoZSBtZW50aW9uZWQgdG9rZW5zLlxuICAgICAgICBpZiAoaXNQYXJlbnRPdXRsZXRJbmplY3Rvcikge1xuICAgICAgICAgIGluamVjdG9yID0gY3JlYXRlUm91dGVyT3V0bGV0SW5qZWN0b3IocGFyZW50SW5qZWN0b3IgYXMgQ2hhaW5lZEluamVjdG9yLCBpbmplY3Rvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyhsQ29udGFpbmVyLCBhY3RpdmVCbG9ja1ROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9XG4gICAgICAgIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCBhY3RpdmVCbG9ja1ROb2RlLCBudWxsLCB7ZGVoeWRyYXRlZFZpZXcsIGluamVjdG9yfSk7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIGxDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKGFjdGl2ZUJsb2NrVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gICAgbWFya1ZpZXdEaXJ0eShlbWJlZGRlZExWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIEV4dGVuZHMgdGhlIGBhcHBseURlZmVyQmxvY2tTdGF0ZWAgd2l0aCB0aW1lci1iYXNlZCBzY2hlZHVsaW5nLlxuICogVGhpcyBmdW5jdGlvbiBiZWNvbWVzIGF2YWlsYWJsZSBvbiBhIHBhZ2UgaWYgdGhlcmUgYXJlIGRlZmVyIGJsb2Nrc1xuICogdGhhdCB1c2UgYGFmdGVyYCBvciBgbWluaW11bWAgcGFyYW1ldGVycyBpbiB0aGUgYEBsb2FkaW5nYCBvclxuICogYEBwbGFjZWhvbGRlcmAgYmxvY2tzLlxuICovXG5mdW5jdGlvbiBhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMsIGxDb250YWluZXI6IExDb250YWluZXIsIHROb2RlOiBUTm9kZSxcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+KSB7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKGhvc3RUVmlldywgdE5vZGUpO1xuXG4gIGlmIChsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdID09PSBudWxsIHx8IGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPD0gbm93KSB7XG4gICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG51bGw7XG5cbiAgICBjb25zdCBsb2FkaW5nQWZ0ZXIgPSBnZXRMb2FkaW5nQmxvY2tBZnRlcih0RGV0YWlscyk7XG4gICAgY29uc3QgaW5Mb2FkaW5nQWZ0ZXJQaGFzZSA9IGxEZXRhaWxzW0xPQURJTkdfQUZURVJfQ0xFQU5VUF9GTl0gIT09IG51bGw7XG4gICAgaWYgKG5ld1N0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZyAmJiBsb2FkaW5nQWZ0ZXIgIT09IG51bGwgJiYgIWluTG9hZGluZ0FmdGVyUGhhc2UpIHtcbiAgICAgIC8vIFRyeWluZyB0byByZW5kZXIgbG9hZGluZywgYnV0IGl0IGhhcyBhbiBgYWZ0ZXJgIGNvbmZpZyxcbiAgICAgIC8vIHNvIHNjaGVkdWxlIGFuIHVwZGF0ZSBhY3Rpb24gYWZ0ZXIgYSB0aW1lb3V0LlxuICAgICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICAgIGNvbnN0IGNsZWFudXBGbiA9XG4gICAgICAgICAgc2NoZWR1bGVEZWZlckJsb2NrVXBkYXRlKGxvYWRpbmdBZnRlciwgbERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyLCBob3N0TFZpZXcpO1xuICAgICAgbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSA9IGNsZWFudXBGbjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgd2UgdHJhbnNpdGlvbiB0byBhIGNvbXBsZXRlIG9yIGFuIGVycm9yIHN0YXRlIGFuZCB0aGVyZSBpcyBhIHBlbmRpbmdcbiAgICAgIC8vIG9wZXJhdGlvbiB0byByZW5kZXIgbG9hZGluZyBhZnRlciBhIHRpbWVvdXQgLSBpbnZva2UgYSBjbGVhbnVwIG9wZXJhdGlvbixcbiAgICAgIC8vIHdoaWNoIHN0b3BzIHRoZSB0aW1lci5cbiAgICAgIGlmIChuZXdTdGF0ZSA+IERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nICYmIGluTG9hZGluZ0FmdGVyUGhhc2UpIHtcbiAgICAgICAgbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSEoKTtcbiAgICAgICAgbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSA9IG51bGw7XG4gICAgICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgYXBwbHlEZWZlckJsb2NrU3RhdGUobmV3U3RhdGUsIGxEZXRhaWxzLCBsQ29udGFpbmVyLCB0Tm9kZSwgaG9zdExWaWV3KTtcblxuICAgICAgY29uc3QgZHVyYXRpb24gPSBnZXRNaW5pbXVtRHVyYXRpb25Gb3JTdGF0ZSh0RGV0YWlscywgbmV3U3RhdGUpO1xuICAgICAgaWYgKGR1cmF0aW9uICE9PSBudWxsKSB7XG4gICAgICAgIGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPSBub3cgKyBkdXJhdGlvbjtcbiAgICAgICAgc2NoZWR1bGVEZWZlckJsb2NrVXBkYXRlKGR1cmF0aW9uLCBsRGV0YWlscywgdE5vZGUsIGxDb250YWluZXIsIGhvc3RMVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlIGFyZSBzdGlsbCByZW5kZXJpbmcgdGhlIHByZXZpb3VzIHN0YXRlLlxuICAgIC8vIFVwZGF0ZSB0aGUgYE5FWFRfREVGRVJfQkxPQ0tfU1RBVEVgLCB3aGljaCB3b3VsZCBiZVxuICAgIC8vIHBpY2tlZCB1cCBvbmNlIGl0J3MgdGltZSB0byB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlLlxuICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbmV3U3RhdGU7XG4gIH1cbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYW4gdXBkYXRlIG9wZXJhdGlvbiBhZnRlciBhIHNwZWNpZmllZCB0aW1lb3V0LlxuICovXG5mdW5jdGlvbiBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUoXG4gICAgdGltZW91dDogbnVtYmVyLCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIsXG4gICAgaG9zdExWaWV3OiBMVmlldzx1bmtub3duPik6IFZvaWRGdW5jdGlvbiB7XG4gIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IG5leHRTdGF0ZSA9IGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPSBudWxsO1xuICAgIGxEZXRhaWxzW05FWFRfREVGRVJfQkxPQ0tfU1RBVEVdID0gbnVsbDtcbiAgICBpZiAobmV4dFN0YXRlICE9PSBudWxsKSB7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUobmV4dFN0YXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgfVxuICB9O1xuICByZXR1cm4gc2NoZWR1bGVUaW1lclRyaWdnZXIodGltZW91dCwgY2FsbGJhY2ssIGhvc3RMVmlldyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgd2UgY2FuIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUuXG4gKlxuICogV2UgdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZSBpZiB0aGUgcHJldmlvdXMgc3RhdGUgd2FzIHJlcHJlc2VudGVkXG4gKiB3aXRoIGEgbnVtYmVyIHRoYXQgaXMgbGVzcyB0aGFuIHRoZSBuZXh0IHN0YXRlLiBGb3IgZXhhbXBsZSwgaWYgdGhlIGN1cnJlbnRcbiAqIHN0YXRlIGlzIFwibG9hZGluZ1wiIChyZXByZXNlbnRlZCBhcyBgMWApLCB3ZSBzaG91bGQgbm90IHNob3cgYSBwbGFjZWhvbGRlclxuICogKHJlcHJlc2VudGVkIGFzIGAwYCksIGJ1dCB3ZSBjYW4gc2hvdyBhIGNvbXBsZXRlZCBzdGF0ZSAocmVwcmVzZW50ZWQgYXMgYDJgKVxuICogb3IgYW4gZXJyb3Igc3RhdGUgKHJlcHJlc2VudGVkIGFzIGAzYCkuXG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRTdGF0ZUNoYW5nZShcbiAgICBjdXJyZW50U3RhdGU6IERlZmVyQmxvY2tTdGF0ZXxEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZSwgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gY3VycmVudFN0YXRlIDwgbmV3U3RhdGU7XG59XG5cbi8qKlxuICogVHJpZ2dlciBwcmVmZXRjaGluZyBvZiBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2suXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGlmIChsVmlld1tJTkpFQ1RPUl0gJiYgc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2sobFZpZXdbSU5KRUNUT1JdISkpIHtcbiAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyBpZiB0aGUgcHJvY2VzcyBoYXNuJ3Qgc3RhcnRlZCB5ZXQuXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclJlc291cmNlTG9hZGluZyhcbiAgICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IFByb21pc2U8dW5rbm93bj4ge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgIT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gSWYgdGhlIGxvYWRpbmcgc3RhdHVzIGlzIGRpZmZlcmVudCBmcm9tIGluaXRpYWwgb25lLCBpdCBtZWFucyB0aGF0XG4gICAgLy8gdGhlIGxvYWRpbmcgb2YgZGVwZW5kZW5jaWVzIGlzIGluIHByb2dyZXNzIGFuZCB0aGVyZSBpcyBub3RoaW5nIHRvIGRvXG4gICAgLy8gaW4gdGhpcyBmdW5jdGlvbi4gQWxsIGRldGFpbHMgY2FuIGJlIG9idGFpbmVkIGZyb20gdGhlIGB0RGV0YWlsc2Agb2JqZWN0LlxuICAgIHJldHVybiB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA/PyBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IHByaW1hcnlCbG9ja1ROb2RlID0gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXcsIHREZXRhaWxzKTtcblxuICAvLyBTd2l0Y2ggZnJvbSBOT1RfU1RBUlRFRCAtPiBJTl9QUk9HUkVTUyBzdGF0ZS5cbiAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M7XG5cbiAgLy8gUHJlZmV0Y2hpbmcgaXMgdHJpZ2dlcmVkLCBjbGVhbnVwIGFsbCByZWdpc3RlcmVkIHByZWZldGNoIHRyaWdnZXJzLlxuICBpbnZva2VUcmlnZ2VyQ2xlYW51cEZucyhUcmlnZ2VyVHlwZS5QcmVmZXRjaCwgbERldGFpbHMpO1xuXG4gIGxldCBkZXBlbmRlbmNpZXNGbiA9IHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuO1xuXG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyBDaGVjayBpZiBkZXBlbmRlbmN5IGZ1bmN0aW9uIGludGVyY2VwdG9yIGlzIGNvbmZpZ3VyZWQuXG4gICAgY29uc3QgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgPVxuICAgICAgICBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgICBpZiAoZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IpIHtcbiAgICAgIGRlcGVuZGVuY2llc0ZuID0gZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IuaW50ZXJjZXB0KGRlcGVuZGVuY2llc0ZuKTtcbiAgICB9XG4gIH1cblxuICAvLyBJbmRpY2F0ZSB0aGF0IGFuIGFwcGxpY2F0aW9uIGlzIG5vdCBzdGFibGUgYW5kIGhhcyBhIHBlbmRpbmcgdGFzay5cbiAgY29uc3QgcGVuZGluZ1Rhc2tzID0gaW5qZWN0b3IuZ2V0KFBlbmRpbmdUYXNrcyk7XG4gIGNvbnN0IHRhc2tJZCA9IHBlbmRpbmdUYXNrcy5hZGQoKTtcblxuICAvLyBUaGUgYGRlcGVuZGVuY2llc0ZuYCBtaWdodCBiZSBgbnVsbGAgd2hlbiBhbGwgZGVwZW5kZW5jaWVzIHdpdGhpblxuICAvLyBhIGdpdmVuIGRlZmVyIGJsb2NrIHdlcmUgZWFnZXJseSByZWZlcmVuY2VkIGVsc2V3aGVyZSBpbiBhIGZpbGUsXG4gIC8vIHRodXMgbm8gZHluYW1pYyBgaW1wb3J0KClgcyB3ZXJlIHByb2R1Y2VkLlxuICBpZiAoIWRlcGVuZGVuY2llc0ZuKSB7XG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlID0gbnVsbDtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuICAgICAgcGVuZGluZ1Rhc2tzLnJlbW92ZSh0YXNrSWQpO1xuICAgIH0pO1xuICAgIHJldHVybiB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZTtcbiAgfVxuXG4gIC8vIFN0YXJ0IGRvd25sb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLmFsbFNldHRsZWQoZGVwZW5kZW5jaWVzRm4oKSkudGhlbihyZXN1bHRzID0+IHtcbiAgICBsZXQgZmFpbGVkID0gZmFsc2U7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdCA9IFtdO1xuICAgIGNvbnN0IHBpcGVEZWZzOiBQaXBlRGVmTGlzdCA9IFtdO1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSByZXN1bHQudmFsdWU7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGdldENvbXBvbmVudERlZihkZXBlbmRlbmN5KSB8fCBnZXREaXJlY3RpdmVEZWYoZGVwZW5kZW5jeSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVEZWYpIHtcbiAgICAgICAgICBkaXJlY3RpdmVEZWZzLnB1c2goZGlyZWN0aXZlRGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwaXBlRGVmID0gZ2V0UGlwZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgICBpZiAocGlwZURlZikge1xuICAgICAgICAgICAgcGlwZURlZnMucHVzaChwaXBlRGVmKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvYWRpbmcgaXMgY29tcGxldGVkLCB3ZSBubyBsb25nZXIgbmVlZCB0aGUgbG9hZGluZyBQcm9taXNlXG4gICAgLy8gYW5kIGEgcGVuZGluZyB0YXNrIHNob3VsZCBhbHNvIGJlIHJlbW92ZWQuXG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuICAgIHBlbmRpbmdUYXNrcy5yZW1vdmUodGFza0lkKTtcblxuICAgIGlmIChmYWlsZWQpIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRDtcblxuICAgICAgaWYgKHREZXRhaWxzLmVycm9yVG1wbEluZGV4ID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlTG9jYXRpb24gPSBnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlscyhsVmlldyk7XG4gICAgICAgIGNvbnN0IGVycm9yID0gbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuREVGRVJfTE9BRElOR19GQUlMRUQsXG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAnTG9hZGluZyBkZXBlbmRlbmNpZXMgZm9yIGBAZGVmZXJgIGJsb2NrIGZhaWxlZCwgJyArXG4gICAgICAgICAgICAgICAgICAgIGBidXQgbm8gXFxgQGVycm9yXFxgIGJsb2NrIHdhcyBjb25maWd1cmVkJHt0ZW1wbGF0ZUxvY2F0aW9ufS4gYCArXG4gICAgICAgICAgICAgICAgICAgICdDb25zaWRlciB1c2luZyB0aGUgYEBlcnJvcmAgYmxvY2sgdG8gcmVuZGVyIGFuIGVycm9yIHN0YXRlLicpO1xuICAgICAgICBoYW5kbGVFcnJvcihsVmlldywgZXJyb3IpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTtcblxuICAgICAgLy8gVXBkYXRlIGRpcmVjdGl2ZSBhbmQgcGlwZSByZWdpc3RyaWVzIHRvIGFkZCBuZXdseSBkb3dubG9hZGVkIGRlcGVuZGVuY2llcy5cbiAgICAgIGNvbnN0IHByaW1hcnlCbG9ja1RWaWV3ID0gcHJpbWFyeUJsb2NrVE5vZGUudFZpZXchO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSA9XG4gICAgICAgICAgICBhZGREZXBzVG9SZWdpc3RyeTxEaXJlY3RpdmVEZWZMaXN0PihwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgZGlyZWN0aXZlRGVmcyk7XG5cbiAgICAgICAgLy8gRXh0cmFjdCBwcm92aWRlcnMgZnJvbSBhbGwgTmdNb2R1bGVzIGltcG9ydGVkIGJ5IHN0YW5kYWxvbmUgY29tcG9uZW50c1xuICAgICAgICAvLyB1c2VkIHdpdGhpbiB0aGlzIGRlZmVyIGJsb2NrLlxuICAgICAgICBjb25zdCBkaXJlY3RpdmVUeXBlcyA9IGRpcmVjdGl2ZURlZnMubWFwKGRlZiA9PiBkZWYudHlwZSk7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVycyA9IGludGVybmFsSW1wb3J0UHJvdmlkZXJzRnJvbShmYWxzZSwgLi4uZGlyZWN0aXZlVHlwZXMpO1xuICAgICAgICB0RGV0YWlscy5wcm92aWRlcnMgPSBwcm92aWRlcnM7XG4gICAgICB9XG4gICAgICBpZiAocGlwZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnkgPVxuICAgICAgICAgICAgYWRkRGVwc1RvUmVnaXN0cnk8UGlwZURlZkxpc3Q+KHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSwgcGlwZURlZnMpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZTtcbn1cblxuLyoqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVuZGVyIHBsYWNlaG9sZGVyIGNvbnRlbnQgKGlmIHByZXNlbnQpICovXG5mdW5jdGlvbiByZW5kZXJQbGFjZWhvbGRlcihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLCB0Tm9kZSwgbENvbnRhaW5lcik7XG59XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgXCJsb2FkaW5nXCIgUHJvbWlzZSBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGRlZmVyIHN1Yi1ibG9jayxcbiAqIGJhc2VkIG9uIHRoZSBsb2FkaW5nIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFJlcHJlc2VudHMgZGVmZXIgYmxvY2sgaW5mbyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyhcbiAgICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlLCAnRXhwZWN0ZWQgbG9hZGluZyBQcm9taXNlIHRvIGV4aXN0IG9uIHRoaXMgZGVmZXIgYmxvY2snKTtcblxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSEudGhlbigoKSA9PiB7XG4gICAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG5cbiAgICAgIC8vIEV2ZXJ5dGhpbmcgaXMgbG9hZGVkLCBzaG93IHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnRcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHRyaWdnZXIgbG9hZGluZyBvZiBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMuXG4gKiBJZiB0aGUgYmxvY2sgaXMgYWxyZWFkeSBpbiBhIGxvYWRpbmcsIGNvbXBsZXRlZCBvciBhbiBlcnJvciBzdGF0ZSAtXG4gKiBubyBhZGRpdGlvbmFsIGFjdGlvbnMgYXJlIHRha2VuLlxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICBpZiAoIXNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gRGVmZXIgYmxvY2sgaXMgdHJpZ2dlcmVkLCBjbGVhbnVwIGFsbCByZWdpc3RlcmVkIHRyaWdnZXIgZnVuY3Rpb25zLlxuICBpbnZva2VBbGxUcmlnZ2VyQ2xlYW51cEZucyhsRGV0YWlscyk7XG5cbiAgc3dpdGNoICh0RGV0YWlscy5sb2FkaW5nU3RhdGUpIHtcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuXG4gICAgICAvLyBUaGUgYGxvYWRpbmdTdGF0ZWAgbWlnaHQgaGF2ZSBjaGFuZ2VkIHRvIFwibG9hZGluZ1wiLlxuICAgICAgaWYgKCh0RGV0YWlscy5sb2FkaW5nU3RhdGUgYXMgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUpID09PVxuICAgICAgICAgIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTKSB7XG4gICAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUzpcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuTG9hZGluZywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFOlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3dFcnJvcignVW5rbm93biBkZWZlciBibG9jayBzdGF0ZScpO1xuICAgICAgfVxuICB9XG59XG4iXX0=