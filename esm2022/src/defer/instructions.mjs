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
        const tDetails = getTDeferBlockDetails(hostTView, tNode);
        const needsScheduling = !skipTimerScheduling &&
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
                const parentEnvInjector = parentInjector.get(EnvironmentInjector);
                injector =
                    parentEnvInjector.get(CachedInjectorService)
                        .getOrCreateInjector(tDetails, parentEnvInjector, providers, ngDevMode ? 'DeferBlock Injector' : '');
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
        return;
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
        return;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRW5FLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQVcsTUFBTSxPQUFPLENBQUM7QUFDcEUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDOUQsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDakYsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNuRixPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSw0Q0FBNEMsQ0FBQztBQUN0RixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0seUNBQXlDLENBQUM7QUFDdEUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUk1RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxRQUFRLEVBQVMsTUFBTSxFQUFFLEtBQUssRUFBUSxNQUFNLDRCQUE0QixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3pHLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzdELE9BQU8sRUFBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDNUcsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDRCQUE0QixFQUFFLHlCQUF5QixFQUFFLGtCQUFrQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDL0ksT0FBTyxFQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUUzRCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsdUJBQXVCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDckcsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdEYsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3hDLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBcUQsdUJBQXVCLEVBQUUsZUFBZSxFQUFFLDZCQUE2QixFQUF3Ryx3QkFBd0IsRUFBRSxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBa0MsTUFBTSxjQUFjLENBQUM7QUFDL1ksT0FBTyxFQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxnQ0FBZ0MsRUFBRSxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSwwQkFBMEIsRUFBRSxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUxUTs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sa0NBQWtDLEdBQzNDLElBQUksY0FBYyxDQUFrQyxvQ0FBb0MsQ0FBQyxDQUFDO0FBRTlGOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQzNCLElBQUksY0FBYyxDQUFtQixTQUFTLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUVoRjs7Ozs7R0FLRztBQUNILFNBQVMsdUJBQXVCLENBQUMsUUFBa0I7SUFDakQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUN4RSxJQUFJLE1BQU0sRUFBRSxRQUFRLEtBQUssa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbkQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsSUFBSSxzQ0FBc0MsR0FBdUMsSUFBSSxDQUFDO0FBRXRGOzs7R0FHRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FDeEMsS0FBWSxFQUFFLFFBQTRCLEVBQUUsc0JBQW9DLEVBQ2hGLGtCQUFnQztJQUNsQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLElBQUksc0JBQXNCLElBQUksSUFBSSxFQUFFLENBQUM7UUFDbkMsUUFBUSxDQUFDLHNCQUFzQjtZQUMzQixXQUFXLENBQWlDLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFDRCxJQUFJLGtCQUFrQixJQUFJLElBQUksRUFBRSxDQUFDO1FBQy9CLFFBQVEsQ0FBQyxrQkFBa0I7WUFDdkIsV0FBVyxDQUE2QixXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsOERBQThEO0lBQzlELElBQUksc0NBQXNDLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDcEQsc0NBQXNDLEdBQUcsa0NBQWtDLENBQUM7SUFDOUUsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsT0FBTyxDQUNuQixLQUFhLEVBQUUsZ0JBQXdCLEVBQUUsb0JBQWdELEVBQ3pGLGdCQUE4QixFQUFFLG9CQUFrQyxFQUNsRSxjQUE0QixFQUFFLGtCQUFnQyxFQUM5RCxzQkFBb0MsRUFDcEMscUJBQTJEO0lBQzdELE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sYUFBYSxHQUFHLEtBQUssR0FBRyxhQUFhLENBQUM7SUFFNUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTlCLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzFCLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWxDLE1BQU0sUUFBUSxHQUF1QjtZQUNuQyxnQkFBZ0I7WUFDaEIsZ0JBQWdCLEVBQUUsZ0JBQWdCLElBQUksSUFBSTtZQUMxQyxvQkFBb0IsRUFBRSxvQkFBb0IsSUFBSSxJQUFJO1lBQ2xELGNBQWMsRUFBRSxjQUFjLElBQUksSUFBSTtZQUN0QyxzQkFBc0IsRUFBRSxJQUFJO1lBQzVCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsb0JBQW9CLEVBQUUsb0JBQW9CLElBQUksSUFBSTtZQUNsRCxZQUFZLEVBQUUsNkJBQTZCLENBQUMsV0FBVztZQUN2RCxjQUFjLEVBQUUsSUFBSTtZQUNwQixTQUFTLEVBQUUsSUFBSTtTQUNoQixDQUFDO1FBQ0YscUJBQXFCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDckYscUJBQXFCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXhDLGdFQUFnRTtJQUNoRSx3RUFBd0U7SUFDeEUsZ0RBQWdEO0lBQ2hELG1DQUFtQyxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFOUQscURBQXFEO0lBQ3JELE1BQU0sUUFBUSxHQUF1QjtRQUNuQyxJQUFJLEVBQThCLHlCQUF5QjtRQUMzRCx1QkFBdUIsQ0FBQyxPQUFPLEVBQUcsb0JBQW9CO1FBQ3RELElBQUksRUFBOEIsd0JBQXdCO1FBQzFELElBQUksRUFBOEIsMkJBQTJCO1FBQzdELElBQUksRUFBOEIsc0JBQXNCO1FBQ3hELElBQUksQ0FBOEIsK0JBQStCO0tBQ2xFLENBQUM7SUFDRixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRXRELE1BQU0saUJBQWlCLEdBQUcsR0FBRyxFQUFFLENBQUMsMEJBQTBCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFckUsMEVBQTBFO0lBQzFFLHFCQUFxQiw4QkFDSSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztJQUN6RixtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNoRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxRQUFpQjtJQUMzQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLFlBQVksR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3hDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUNsRCxNQUFNLFlBQVksR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUM7WUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBRSxnQ0FBZ0M7WUFDbEUsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztZQUNqQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDbEQsSUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJLGFBQWEsS0FBSyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDekUsaUVBQWlFO2dCQUNqRSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQztpQkFBTSxJQUNILEtBQUssS0FBSyxJQUFJO2dCQUNkLENBQUMsYUFBYSxLQUFLLHVCQUF1QixDQUFDLE9BQU87b0JBQ2pELGFBQWEsS0FBSyxlQUFlLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsMEVBQTBFO2dCQUMxRSwyRUFBMkU7Z0JBQzNFLFNBQVM7Z0JBQ1QsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDSCxDQUFDO2dCQUFTLENBQUM7WUFDVCxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsUUFBaUI7SUFDbkQsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUV4QyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDbEQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDO1lBQ0gsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsZ0NBQWdDO1lBQ2xFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLEtBQUssR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDMUYsdURBQXVEO2dCQUN2RCxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLENBQUM7UUFDSCxDQUFDO2dCQUFTLENBQUM7WUFDVCxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsYUFBYTtJQUMzQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxnRkFBZ0Y7SUFDaEYsaUZBQWlGO0lBQ2pGLHdCQUF3QjtJQUN4QixJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRSxDQUFDO1FBQzdFLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBQ0QsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2xDLENBQUM7QUFHRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsMEJBQTBCO0lBQ3hDLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckQsSUFBSSxRQUFRLENBQUMsWUFBWSxLQUFLLDZCQUE2QixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3hFLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFhO0lBQzFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEtBQWE7SUFDbEQsMEJBQTBCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxZQUFvQixFQUFFLFdBQW9CO0lBQ3ZFLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBRWpDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoQyxrQkFBa0IsQ0FDZCxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsOEJBQ25FLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDL0UsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDeEUsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFDaEQsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsK0JBQXVCLENBQUM7SUFDOUUsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxZQUFvQixFQUFFLFdBQW9CO0lBQzdFLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBRWpDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoQyxrQkFBa0IsQ0FDZCxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsOEJBQ3pFLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDckYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDeEUsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFDdEQsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsK0JBQXVCLENBQUM7SUFDOUUsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxZQUFvQixFQUFFLFdBQW9CO0lBQzFFLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBRWpDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoQyxrQkFBa0IsQ0FDZCxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsOEJBQ3RFLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDbEYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDeEUsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFDbkQsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsK0JBQXVCLENBQUM7SUFDOUUsQ0FBQztBQUNILENBQUM7QUFFRCx3Q0FBd0M7QUFFeEM7O0dBRUc7QUFDSCxTQUFTLHNCQUFzQixDQUMzQixVQUFrRTtJQUNwRSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUVqQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzRSxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckQscUJBQXFCLDhCQUFzQixRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLDBCQUEwQixDQUMvQixVQUFrRTtJQUNwRSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN4RSxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRSxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLHFCQUFxQiwrQkFBdUIsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLFFBQXlCLEVBQUUsS0FBWSxFQUFFLFVBQXNCLEVBQy9ELG1CQUFtQixHQUFHLEtBQUs7SUFDN0IsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyw0RUFBNEU7SUFDNUUsdUVBQXVFO0lBQ3ZFLElBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQztRQUFFLE9BQU87SUFFbkMsb0VBQW9FO0lBQ3BFLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFbkQsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXpELFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLHNDQUFzQyxDQUFDLENBQUM7SUFFN0UsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFakQsSUFBSSxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDO1FBQzFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDekUsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pELE1BQU0sZUFBZSxHQUFHLENBQUMsbUJBQW1CO1lBQ3hDLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSTtnQkFDdkMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJO2dCQUN0RSwwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFeEUsSUFBSSxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7WUFDakMsYUFBYSxDQUNULHNDQUFzQyxFQUFFLDRDQUE0QyxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUNkLGVBQWUsQ0FBQyxDQUFDLENBQUMsc0NBQXVDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDO1FBQ3JGLElBQUksQ0FBQztZQUNILFlBQVksQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUFDLE9BQU8sS0FBYyxFQUFFLENBQUM7WUFDeEIsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsb0JBQW9CLENBQ3pCLFFBQXlCLEVBQUUsUUFBNEIsRUFBRSxVQUFzQixFQUFFLEtBQVksRUFDN0YsU0FBeUI7SUFDM0IsTUFBTSxjQUFjLEdBQUcsd0JBQXdCLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUU1RSxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUM1QixRQUFRLENBQUMsaUJBQWlCLENBQUMsR0FBRyxRQUFRLENBQUM7UUFDdkMsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLE1BQU0sYUFBYSxHQUFHLGNBQWMsR0FBRyxhQUFhLENBQUM7UUFDckQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBbUIsQ0FBQztRQUU5RSxpRUFBaUU7UUFDakUsOERBQThEO1FBQzlELE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztRQUVwQix5QkFBeUIsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFakQsSUFBSSxRQUE0QixDQUFDO1FBQ2pDLElBQUksUUFBUSxLQUFLLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxQyxrRUFBa0U7WUFDbEUsc0VBQXNFO1lBQ3RFLG9FQUFvRTtZQUNwRSw0RUFBNEU7WUFDNUUseUVBQXlFO1lBQ3pFLG9DQUFvQztZQUNwQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUNyQyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFhLENBQUM7Z0JBQ3ZELE1BQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUNsRSxRQUFRO29CQUNKLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQzt5QkFDdkMsbUJBQW1CLENBQ2hCLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUYsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLGNBQWMsR0FBRywwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsS0FBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdGLE1BQU0sYUFBYSxHQUNmLDRCQUE0QixDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxjQUFjLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQztRQUNoRyxvQkFBb0IsQ0FDaEIsVUFBVSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNoRyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDL0IsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsa0NBQWtDLENBQ3ZDLFFBQXlCLEVBQUUsUUFBNEIsRUFBRSxVQUFzQixFQUFFLEtBQVksRUFDN0YsU0FBeUI7SUFDM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFekQsSUFBSSxRQUFRLENBQUMscUJBQXFCLENBQUMsS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLHFCQUFxQixDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDdkYsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxDQUFDO1FBRXZDLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLHdCQUF3QixDQUFDLEtBQUssSUFBSSxDQUFDO1FBQ3hFLElBQUksUUFBUSxLQUFLLGVBQWUsQ0FBQyxPQUFPLElBQUksWUFBWSxLQUFLLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDMUYsMERBQTBEO1lBQzFELGdEQUFnRDtZQUNoRCxRQUFRLENBQUMsc0JBQXNCLENBQUMsR0FBRyxRQUFRLENBQUM7WUFDNUMsTUFBTSxTQUFTLEdBQ1gsd0JBQXdCLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ25GLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNqRCxDQUFDO2FBQU0sQ0FBQztZQUNOLDBFQUEwRTtZQUMxRSw0RUFBNEU7WUFDNUUseUJBQXlCO1lBQ3pCLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDOUQsUUFBUSxDQUFDLHdCQUF3QixDQUFFLEVBQUUsQ0FBQztnQkFDdEMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDMUMsQ0FBQztZQUVELG9CQUFvQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV2RSxNQUFNLFFBQVEsR0FBRywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEUsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3RCLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7Z0JBQ2pELHdCQUF3QixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUM3RSxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7U0FBTSxDQUFDO1FBQ04sNkNBQTZDO1FBQzdDLHNEQUFzRDtRQUN0RCw0REFBNEQ7UUFDNUQsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsUUFBUSxDQUFDO0lBQzlDLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLHdCQUF3QixDQUM3QixPQUFlLEVBQUUsUUFBNEIsRUFBRSxLQUFZLEVBQUUsVUFBc0IsRUFDbkYsU0FBeUI7SUFDM0IsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFO1FBQ3BCLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ25ELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUN2QyxRQUFRLENBQUMsc0JBQXNCLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDeEMsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDdkIscUJBQXFCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsa0JBQWtCLENBQ3ZCLFlBQXFELEVBQUUsUUFBeUI7SUFDbEYsT0FBTyxZQUFZLEdBQUcsUUFBUSxDQUFDO0FBQ2pDLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxRQUE0QixFQUFFLEtBQVksRUFBRSxLQUFZO0lBQ3pGLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQyxFQUFFLENBQUM7UUFDakUsc0JBQXNCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNqRCxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFFBQTRCLEVBQUUsS0FBWSxFQUFFLEtBQVk7SUFDN0YsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUUzQixJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDeEUscUVBQXFFO1FBQ3JFLHdFQUF3RTtRQUN4RSw0RUFBNEU7UUFDNUUsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckQsTUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFaEUsZ0RBQWdEO0lBQ2hELFFBQVEsQ0FBQyxZQUFZLEdBQUcsNkJBQTZCLENBQUMsV0FBVyxDQUFDO0lBRWxFLHNFQUFzRTtJQUN0RSx1QkFBdUIsK0JBQXVCLFFBQVEsQ0FBQyxDQUFDO0lBRXhELElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQztJQUVuRCxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ2QsMERBQTBEO1FBQzFELE1BQU0sMEJBQTBCLEdBQzVCLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFFN0UsSUFBSSwwQkFBMEIsRUFBRSxDQUFDO1lBQy9CLGNBQWMsR0FBRywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDeEUsQ0FBQztJQUNILENBQUM7SUFFRCxxRUFBcUU7SUFDckUsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNoRCxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFbEMsb0VBQW9FO0lBQ3BFLG1FQUFtRTtJQUNuRSw2Q0FBNkM7SUFDN0MsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BCLFFBQVEsQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDcEQsUUFBUSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDL0IsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxRQUFRLENBQUM7WUFDL0QsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU87SUFDVCxDQUFDO0lBRUQsaURBQWlEO0lBQ2pELFFBQVEsQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM1RSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDbkIsTUFBTSxhQUFhLEdBQXFCLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBZ0IsRUFBRSxDQUFDO1FBRWpDLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7WUFDN0IsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNoQyxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRixJQUFJLFlBQVksRUFBRSxDQUFDO29CQUNqQixhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLENBQUM7b0JBQ04sTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN2QyxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUNaLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNkLE1BQU07WUFDUixDQUFDO1FBQ0gsQ0FBQztRQUVELDhEQUE4RDtRQUM5RCw2Q0FBNkM7UUFDN0MsUUFBUSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDL0IsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU1QixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1gsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxNQUFNLENBQUM7WUFFN0QsSUFBSSxRQUFRLENBQUMsY0FBYyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNyQyxNQUFNLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLEtBQUssR0FBRyxJQUFJLFlBQVksa0RBRTFCLFNBQVM7b0JBQ0wsa0RBQWtEO3dCQUM5Qyx5Q0FBeUMsZ0JBQWdCLElBQUk7d0JBQzdELDZEQUE2RCxDQUFDLENBQUM7Z0JBQzNFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxRQUFRLENBQUM7WUFFL0QsNkVBQTZFO1lBQzdFLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsS0FBTSxDQUFDO1lBQ25ELElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsaUJBQWlCLENBQUMsaUJBQWlCO29CQUMvQixpQkFBaUIsQ0FBbUIsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBRTVGLHlFQUF5RTtnQkFDekUsZ0NBQWdDO2dCQUNoQyxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLFNBQVMsR0FBRywyQkFBMkIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxjQUFjLENBQUMsQ0FBQztnQkFDeEUsUUFBUSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDakMsQ0FBQztZQUNELElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsaUJBQWlCLENBQUMsWUFBWTtvQkFDMUIsaUJBQWlCLENBQWMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9FLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0VBQWtFO0FBQ2xFLFNBQVMsaUJBQWlCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDbkQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxTQUFTLElBQUksZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFMUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsb0NBQW9DLENBQ3pDLFFBQTRCLEVBQUUsS0FBWSxFQUFFLFVBQXNCO0lBQ3BFLFNBQVM7UUFDTCxhQUFhLENBQ1QsUUFBUSxDQUFDLGNBQWMsRUFBRSx1REFBdUQsQ0FBQyxDQUFDO0lBRTFGLFFBQVEsQ0FBQyxjQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNqQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckUsU0FBUyxJQUFJLGdDQUFnQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXhELHVEQUF1RDtZQUN2RCxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUVyRSxDQUFDO2FBQU0sSUFBSSxRQUFRLENBQUMsWUFBWSxLQUFLLDZCQUE2QixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzFFLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxpQkFBaUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUNuRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7SUFDbEMsU0FBUyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRTFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUM7UUFBRSxPQUFPO0lBRS9DLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRCxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckQsc0VBQXNFO0lBQ3RFLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXJDLFFBQVEsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzlCLEtBQUssNkJBQTZCLENBQUMsV0FBVztZQUM1QyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsRSxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRS9DLHNEQUFzRDtZQUN0RCxJQUFLLFFBQVEsQ0FBQyxZQUE4QztnQkFDeEQsNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzlDLG9DQUFvQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDcEUsQ0FBQztZQUNELE1BQU07UUFDUixLQUFLLDZCQUE2QixDQUFDLFdBQVc7WUFDNUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEUsb0NBQW9DLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsRSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxRQUFRO1lBQ3pDLFNBQVMsSUFBSSxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNuRSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxNQUFNO1lBQ3ZDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU07UUFDUjtZQUNFLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2QsVUFBVSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDMUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtDYWNoZWRJbmplY3RvclNlcnZpY2V9IGZyb20gJy4uL2NhY2hlZF9pbmplY3Rvcl9zZXJ2aWNlJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3RvciwgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2ludGVybmFsSW1wb3J0UHJvdmlkZXJzRnJvbX0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vcmVuZGVyMy9iaW5kaW5ncyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlsc30gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7aGFuZGxlRXJyb3J9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge8m1ybV0ZW1wbGF0ZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGVtcGxhdGUnO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3R9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGVzdHJveWVkfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXcsIFBBUkVOVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkVE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9yZW5kZXIzL3N0YXRlJztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGdldFROb2RlLCByZW1vdmVMVmlld09uRGVzdHJveSwgc3RvcmVMVmlld09uRGVzdHJveX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldywgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi91dGlsL3BlcmZvcm1hbmNlJztcblxuaW1wb3J0IHtpbnZva2VBbGxUcmlnZ2VyQ2xlYW51cEZucywgaW52b2tlVHJpZ2dlckNsZWFudXBGbnMsIHN0b3JlVHJpZ2dlckNsZWFudXBGbn0gZnJvbSAnLi9jbGVhbnVwJztcbmltcG9ydCB7b25Ib3Zlciwgb25JbnRlcmFjdGlvbiwgb25WaWV3cG9ydCwgcmVnaXN0ZXJEb21UcmlnZ2VyfSBmcm9tICcuL2RvbV90cmlnZ2Vycyc7XG5pbXBvcnQge29uSWRsZX0gZnJvbSAnLi9pZGxlX3NjaGVkdWxlcic7XG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrQmVoYXZpb3IsIERlZmVyQmxvY2tDb25maWcsIERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3IsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGUsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLCBEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZywgRGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnLCBEZXBlbmRlbmN5UmVzb2x2ZXJGbiwgTERlZmVyQmxvY2tEZXRhaWxzLCBMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk4sIE5FWFRfREVGRVJfQkxPQ0tfU1RBVEUsIFNUQVRFX0lTX0ZST1pFTl9VTlRJTCwgVERlZmVyQmxvY2tEZXRhaWxzLCBUcmlnZ2VyVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7b25UaW1lciwgc2NoZWR1bGVUaW1lclRyaWdnZXJ9IGZyb20gJy4vdGltZXJfc2NoZWR1bGVyJztcbmltcG9ydCB7YWRkRGVwc1RvUmVnaXN0cnksIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkLCBnZXRMRGVmZXJCbG9ja0RldGFpbHMsIGdldExvYWRpbmdCbG9ja0FmdGVyLCBnZXRNaW5pbXVtRHVyYXRpb25Gb3JTdGF0ZSwgZ2V0UHJpbWFyeUJsb2NrVE5vZGUsIGdldFREZWZlckJsb2NrRGV0YWlscywgZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlLCBzZXRMRGVmZXJCbG9ja0RldGFpbHMsIHNldFREZWZlckJsb2NrRGV0YWlsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICogKlxuICogSW5qZWN0b3IgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcHJvdmlkZSBgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcmAgY2xhc3NcbiAqIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIFRoaXMgdG9rZW4gaXMgb25seSBpbmplY3RlZCBpbiBkZXZNb2RlXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcj4oJ0RFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1InKTtcblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIHRva2VuIHVzZWQgZm9yIGNvbmZpZ3VyaW5nIGRlZmVyIGJsb2NrIGJlaGF2aW9yLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfQ09ORklHID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0NvbmZpZz4obmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0NPTkZJRycgOiAnJyk7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGRlZmVyIGJsb2NrcyBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuICpcbiAqIEN1cnJlbnRseSwgZGVmZXIgYmxvY2tzIGFyZSBub3QgdHJpZ2dlcmVkIG9uIHRoZSBzZXJ2ZXIsXG4gKiBvbmx5IHBsYWNlaG9sZGVyIGNvbnRlbnQgaXMgcmVuZGVyZWQgKGlmIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3I6IEluamVjdG9yKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGluamVjdG9yLmdldChERUZFUl9CTE9DS19DT05GSUcsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoY29uZmlnPy5iZWhhdmlvciA9PT0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpO1xufVxuXG4vKipcbiAqIFJlZmVyZW5jZSB0byB0aGUgdGltZXItYmFzZWQgc2NoZWR1bGVyIGltcGxlbWVudGF0aW9uIG9mIGRlZmVyIGJsb2NrIHN0YXRlXG4gKiByZW5kZXJpbmcgbWV0aG9kLiBJdCdzIHVzZWQgdG8gbWFrZSB0aW1lci1iYXNlZCBzY2hlZHVsaW5nIHRyZWUtc2hha2FibGUuXG4gKiBJZiBgbWluaW11bWAgb3IgYGFmdGVyYCBwYXJhbWV0ZXJzIGFyZSB1c2VkLCBjb21waWxlciBnZW5lcmF0ZXMgYW4gZXh0cmFcbiAqIGFyZ3VtZW50IGZvciB0aGUgYMm1ybVkZWZlcmAgaW5zdHJ1Y3Rpb24sIHdoaWNoIHJlZmVyZW5jZXMgYSB0aW1lci1iYXNlZFxuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmxldCBhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nSW1wbDogKHR5cGVvZiBhcHBseURlZmVyQmxvY2tTdGF0ZSl8bnVsbCA9IG51bGw7XG5cbi8qKlxuICogRW5hYmxlcyB0aW1lci1yZWxhdGVkIHNjaGVkdWxpbmcgaWYgYGFmdGVyYCBvciBgbWluaW11bWAgcGFyYW1ldGVycyBhcmUgc2V0dXBcbiAqIG9uIHRoZSBgQGxvYWRpbmdgIG9yIGBAcGxhY2Vob2xkZXJgIGJsb2Nrcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlckVuYWJsZVRpbWVyU2NoZWR1bGluZyhcbiAgICB0VmlldzogVFZpZXcsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCxcbiAgICBsb2FkaW5nQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCkge1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgaWYgKHBsYWNlaG9sZGVyQ29uZmlnSW5kZXggIT0gbnVsbCkge1xuICAgIHREZXRhaWxzLnBsYWNlaG9sZGVyQmxvY2tDb25maWcgPVxuICAgICAgICBnZXRDb25zdGFudDxEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBwbGFjZWhvbGRlckNvbmZpZ0luZGV4KTtcbiAgfVxuICBpZiAobG9hZGluZ0NvbmZpZ0luZGV4ICE9IG51bGwpIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nQmxvY2tDb25maWcgPVxuICAgICAgICBnZXRDb25zdGFudDxEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIGxvYWRpbmdDb25maWdJbmRleCk7XG4gIH1cblxuICAvLyBFbmFibGUgaW1wbGVtZW50YXRpb24gdGhhdCBzdXBwb3J0cyB0aW1lci1iYXNlZCBzY2hlZHVsaW5nLlxuICBpZiAoYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZ0ltcGwgPT09IG51bGwpIHtcbiAgICBhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nSW1wbCA9IGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmc7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciBkZWZlciBibG9ja3MuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBgZGVmZXJgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIHByaW1hcnlUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHByaW1hcnkgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmN5UmVzb2x2ZXJGbiBGdW5jdGlvbiB0aGF0IGNvbnRhaW5zIGRlcGVuZGVuY2llcyBmb3IgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsb2FkaW5nVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBsb2FkaW5nIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHBsYWNlaG9sZGVyIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZXJyb3JUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGVycm9yIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gbG9hZGluZ0NvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGxvYWRpbmcuXG4gKiAgICAgYmxvY2suXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJDb25maWdJbmRleCBJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZVxuICogICAgIHBsYWNlaG9sZGVyIGJsb2NrLlxuICogQHBhcmFtIGVuYWJsZVRpbWVyU2NoZWR1bGluZyBGdW5jdGlvbiB0aGF0IGVuYWJsZXMgdGltZXItcmVsYXRlZCBzY2hlZHVsaW5nIGlmIGBhZnRlcmBcbiAqICAgICBvciBgbWluaW11bWAgcGFyYW1ldGVycyBhcmUgc2V0dXAgb24gdGhlIGBAbG9hZGluZ2Agb3IgYEBwbGFjZWhvbGRlcmAgYmxvY2tzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXIoXG4gICAgaW5kZXg6IG51bWJlciwgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLCBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwsXG4gICAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlcnxudWxsLCBwbGFjZWhvbGRlclRtcGxJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVycm9yVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCxcbiAgICBlbmFibGVUaW1lclNjaGVkdWxpbmc/OiB0eXBlb2YgybXJtWRlZmVyRW5hYmxlVGltZXJTY2hlZHVsaW5nKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gIMm1ybV0ZW1wbGF0ZShpbmRleCwgbnVsbCwgMCwgMCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nRGVmZXInKTtcblxuICAgIGNvbnN0IHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMgPSB7XG4gICAgICBwcmltYXJ5VG1wbEluZGV4LFxuICAgICAgbG9hZGluZ1RtcGxJbmRleDogbG9hZGluZ1RtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJUbXBsSW5kZXg6IHBsYWNlaG9sZGVyVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBlcnJvclRtcGxJbmRleDogZXJyb3JUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyQmxvY2tDb25maWc6IG51bGwsXG4gICAgICBsb2FkaW5nQmxvY2tDb25maWc6IG51bGwsXG4gICAgICBkZXBlbmRlbmN5UmVzb2x2ZXJGbjogZGVwZW5kZW5jeVJlc29sdmVyRm4gPz8gbnVsbCxcbiAgICAgIGxvYWRpbmdTdGF0ZTogRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQsXG4gICAgICBsb2FkaW5nUHJvbWlzZTogbnVsbCxcbiAgICAgIHByb3ZpZGVyczogbnVsbCxcbiAgICB9O1xuICAgIGVuYWJsZVRpbWVyU2NoZWR1bGluZz8uKHRWaWV3LCB0RGV0YWlscywgcGxhY2Vob2xkZXJDb25maWdJbmRleCwgbG9hZGluZ0NvbmZpZ0luZGV4KTtcbiAgICBzZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIGFkanVzdGVkSW5kZXgsIHREZXRhaWxzKTtcbiAgfVxuXG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF07XG5cbiAgLy8gSWYgaHlkcmF0aW9uIGlzIGVuYWJsZWQsIGxvb2tzIHVwIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhlIERPTVxuICAvLyB1c2luZyBoeWRyYXRpb24gYW5ub3RhdGlvbiBpbmZvIGFuZCBzdG9yZXMgdGhvc2Ugdmlld3Mgb24gTENvbnRhaW5lci5cbiAgLy8gSW4gY2xpZW50LW9ubHkgbW9kZSwgdGhpcyBmdW5jdGlvbiBpcyBhIG5vb3AuXG4gIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5MQ29udGFpbmVyKGxDb250YWluZXIsIHROb2RlLCBsVmlldyk7XG5cbiAgLy8gSW5pdCBpbnN0YW5jZS1zcGVjaWZpYyBkZWZlciBkZXRhaWxzIGFuZCBzdG9yZSBpdC5cbiAgY29uc3QgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscyA9IFtcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkVYVF9ERUZFUl9CTE9DS19TVEFURVxuICAgIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwsICAvLyBERUZFUl9CTE9DS19TVEFURVxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTVEFURV9JU19GUk9aRU5fVU5USUxcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRSSUdHRVJfQ0xFQU5VUF9GTlNcbiAgICBudWxsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUFJFRkVUQ0hfVFJJR0dFUl9DTEVBTlVQX0ZOU1xuICBdO1xuICBzZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIGFkanVzdGVkSW5kZXgsIGxEZXRhaWxzKTtcblxuICBjb25zdCBjbGVhbnVwVHJpZ2dlcnNGbiA9ICgpID0+IGludm9rZUFsbFRyaWdnZXJDbGVhbnVwRm5zKGxEZXRhaWxzKTtcblxuICAvLyBXaGVuIGRlZmVyIGJsb2NrIGlzIHRyaWdnZXJlZCAtIHVuc3Vic2NyaWJlIGZyb20gTFZpZXcgZGVzdHJveSBjbGVhbnVwLlxuICBzdG9yZVRyaWdnZXJDbGVhbnVwRm4oXG4gICAgICBUcmlnZ2VyVHlwZS5SZWd1bGFyLCBsRGV0YWlscywgKCkgPT4gcmVtb3ZlTFZpZXdPbkRlc3Ryb3kobFZpZXcsIGNsZWFudXBUcmlnZ2Vyc0ZuKSk7XG4gIHN0b3JlTFZpZXdPbkRlc3Ryb3kobFZpZXcsIGNsZWFudXBUcmlnZ2Vyc0ZuKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgd2hlbiBhIHRyaWdnZXIgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgICBpZiAodmFsdWUgPT09IGZhbHNlICYmIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwpIHtcbiAgICAgICAgLy8gSWYgbm90aGluZyBpcyByZW5kZXJlZCB5ZXQsIHJlbmRlciBhIHBsYWNlaG9sZGVyIChpZiBkZWZpbmVkKS5cbiAgICAgICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgdmFsdWUgPT09IHRydWUgJiZcbiAgICAgICAgICAocmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCB8fFxuICAgICAgICAgICByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKSB7XG4gICAgICAgIC8vIFRoZSBgd2hlbmAgY29uZGl0aW9uIGhhcyBjaGFuZ2VkIHRvIGB0cnVlYCwgdHJpZ2dlciBkZWZlciBibG9jayBsb2FkaW5nXG4gICAgICAgIC8vIGlmIHRoZSBibG9jayBpcyBlaXRoZXIgaW4gaW5pdGlhbCAobm90aGluZyBpcyByZW5kZXJlZCkgb3IgYSBwbGFjZWhvbGRlclxuICAgICAgICAvLyBzdGF0ZS5cbiAgICAgICAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVmZXRjaGVzIHRoZSBkZWZlcnJlZCBjb250ZW50IHdoZW4gYSB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaFdoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG5cbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgICAgaWYgKHZhbHVlID09PSB0cnVlICYmIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAgICAgLy8gSWYgbG9hZGluZyBoYXMgbm90IGJlZW4gc3RhcnRlZCB5ZXQsIHRyaWdnZXIgaXQgbm93LlxuICAgICAgICB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBvbiBpZGxlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSWRsZSgpIHtcbiAgc2NoZWR1bGVEZWxheWVkVHJpZ2dlcihvbklkbGUpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgcHJlZmV0Y2ggb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSWRsZSgpIHtcbiAgc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcob25JZGxlKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkltbWVkaWF0ZSgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBSZW5kZXIgcGxhY2Vob2xkZXIgYmxvY2sgb25seSBpZiBsb2FkaW5nIHRlbXBsYXRlIGlzIG5vdCBwcmVzZW50IGFuZCB3ZSdyZSBvblxuICAvLyB0aGUgY2xpZW50IHRvIGF2b2lkIGNvbnRlbnQgZmxpY2tlcmluZywgc2luY2UgaXQgd291bGQgYmUgaW1tZWRpYXRlbHkgcmVwbGFjZWRcbiAgLy8gYnkgdGhlIGxvYWRpbmcgYmxvY2suXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpIHx8IHREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXggPT09IG51bGwpIHtcbiAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICB9XG4gIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG59XG5cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIGxvYWRpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25UaW1lcihkZWxheTogbnVtYmVyKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksIFRyaWdnZXJUeXBlLlByZWZldGNoKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW50ZXJhY3Rpb24odHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksIFRyaWdnZXJUeXBlLlByZWZldGNoKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVmlld3BvcnQodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvblZpZXdwb3J0LCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblZpZXdwb3J0KHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvblZpZXdwb3J0LFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksIFRyaWdnZXJUeXBlLlByZWZldGNoKTtcbiAgfVxufVxuXG4vKioqKioqKioqKiBIZWxwZXIgZnVuY3Rpb25zICoqKioqKioqKiovXG5cbi8qKlxuICogU2NoZWR1bGVzIHRyaWdnZXJpbmcgb2YgYSBkZWZlciBibG9jayBmb3IgYG9uIGlkbGVgIGFuZCBgb24gdGltZXJgIGNvbmRpdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIoXG4gICAgc2NoZWR1bGVGbjogKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldykgPT4gVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgY29uc3QgY2xlYW51cEZuID0gc2NoZWR1bGVGbigoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLCBsVmlldyk7XG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gIHN0b3JlVHJpZ2dlckNsZWFudXBGbihUcmlnZ2VyVHlwZS5SZWd1bGFyLCBsRGV0YWlscywgY2xlYW51cEZuKTtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgcHJlZmV0Y2hpbmcgZm9yIGBvbiBpZGxlYCBhbmQgYG9uIHRpbWVyYCB0cmlnZ2Vycy5cbiAqXG4gKiBAcGFyYW0gc2NoZWR1bGVGbiBBIGZ1bmN0aW9uIHRoYXQgZG9lcyB0aGUgc2NoZWR1bGluZy5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcoXG4gICAgc2NoZWR1bGVGbjogKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldykgPT4gVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCBwcmVmZXRjaCA9ICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCBjbGVhbnVwRm4gPSBzY2hlZHVsZUZuKHByZWZldGNoLCBsVmlldyk7XG4gICAgc3RvcmVUcmlnZ2VyQ2xlYW51cEZuKFRyaWdnZXJUeXBlLlByZWZldGNoLCBsRGV0YWlscywgY2xlYW51cEZuKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYW5zaXRpb25zIGEgZGVmZXIgYmxvY2sgdG8gdGhlIG5ldyBzdGF0ZS4gVXBkYXRlcyB0aGUgIG5lY2Vzc2FyeVxuICogZGF0YSBzdHJ1Y3R1cmVzIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgYmxvY2suXG4gKlxuICogQHBhcmFtIG5ld1N0YXRlIE5ldyBzdGF0ZSB0aGF0IHNob3VsZCBiZSBhcHBsaWVkIHRvIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsQ29udGFpbmVyIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBza2lwVGltZXJTY2hlZHVsaW5nIEluZGljYXRlcyB0aGF0IGBAbG9hZGluZ2AgYW5kIGBAcGxhY2Vob2xkZXJgIGJsb2NrXG4gKiAgIHNob3VsZCBiZSByZW5kZXJlZCBpbW1lZGlhdGVseSwgZXZlbiBpZiB0aGV5IGhhdmUgYGFmdGVyYCBvciBgbWluaW11bWAgY29uZmlnXG4gKiAgIG9wdGlvbnMgc2V0dXAuIFRoaXMgZmxhZyB0byBuZWVkZWQgZm9yIHRlc3RpbmcgQVBJcyB0byB0cmFuc2l0aW9uIGRlZmVyIGJsb2NrXG4gKiAgIGJldHdlZW4gc3RhdGVzIHZpYSBgRGVmZXJGaXh0dXJlLnJlbmRlcmAgbWV0aG9kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBza2lwVGltZXJTY2hlZHVsaW5nID0gZmFsc2UpOiB2b2lkIHtcbiAgY29uc3QgaG9zdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuXG4gIC8vIENoZWNrIGlmIHRoaXMgdmlldyBpcyBub3QgZGVzdHJveWVkLiBTaW5jZSB0aGUgbG9hZGluZyBwcm9jZXNzIHdhcyBhc3luYyxcbiAgLy8gdGhlIHZpZXcgbWlnaHQgZW5kIHVwIGJlaW5nIGRlc3Ryb3llZCBieSB0aGUgdGltZSByZW5kZXJpbmcgaGFwcGVucy5cbiAgaWYgKGlzRGVzdHJveWVkKGhvc3RMVmlldykpIHJldHVybjtcblxuICAvLyBNYWtlIHN1cmUgdGhpcyBUTm9kZSBiZWxvbmdzIHRvIFRWaWV3IHRoYXQgcmVwcmVzZW50cyBob3N0IExWaWV3LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgaG9zdExWaWV3KTtcblxuICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhob3N0TFZpZXcsIHROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsRGV0YWlscywgJ0V4cGVjdGVkIGEgZGVmZXIgYmxvY2sgc3RhdGUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcblxuICBpZiAoaXNWYWxpZFN0YXRlQ2hhbmdlKGN1cnJlbnRTdGF0ZSwgbmV3U3RhdGUpICYmXG4gICAgICBpc1ZhbGlkU3RhdGVDaGFuZ2UobERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPz8gLTEsIG5ld1N0YXRlKSkge1xuICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKGhvc3RUVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IG5lZWRzU2NoZWR1bGluZyA9ICFza2lwVGltZXJTY2hlZHVsaW5nICYmXG4gICAgICAgIChnZXRMb2FkaW5nQmxvY2tBZnRlcih0RGV0YWlscykgIT09IG51bGwgfHxcbiAgICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuTG9hZGluZykgIT09IG51bGwgfHxcbiAgICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKTtcblxuICAgIGlmIChuZ0Rldk1vZGUgJiYgbmVlZHNTY2hlZHVsaW5nKSB7XG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsLCAnRXhwZWN0ZWQgc2NoZWR1bGluZyBmdW5jdGlvbiB0byBiZSBkZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYXBwbHlTdGF0ZUZuID1cbiAgICAgICAgbmVlZHNTY2hlZHVsaW5nID8gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZ0ltcGwhIDogYXBwbHlEZWZlckJsb2NrU3RhdGU7XG4gICAgdHJ5IHtcbiAgICAgIGFwcGx5U3RhdGVGbihuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICBoYW5kbGVFcnJvcihob3N0TFZpZXcsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGNoYW5nZXMgdG8gdGhlIERPTSB0byByZWZsZWN0IGEgZ2l2ZW4gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5RGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMsIGxDb250YWluZXI6IExDb250YWluZXIsIHROb2RlOiBUTm9kZSxcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+KSB7XG4gIGNvbnN0IHN0YXRlVG1wbEluZGV4ID0gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKG5ld1N0YXRlLCBob3N0TFZpZXcsIHROb2RlKTtcblxuICBpZiAoc3RhdGVUbXBsSW5kZXggIT09IG51bGwpIHtcbiAgICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBzdGF0ZVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gICAgY29uc3QgYWN0aXZlQmxvY2tUTm9kZSA9IGdldFROb2RlKGhvc3RUVmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG5cbiAgICAvLyBUaGVyZSBpcyBvbmx5IDEgdmlldyB0aGF0IGNhbiBiZSBwcmVzZW50IGluIGFuIExDb250YWluZXIgdGhhdFxuICAgIC8vIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcblxuICAgIGxldCBpbmplY3RvcjogSW5qZWN0b3J8dW5kZWZpbmVkO1xuICAgIGlmIChuZXdTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlKSB7XG4gICAgICAvLyBXaGVuIHdlIHJlbmRlciBhIGRlZmVyIGJsb2NrIGluIGNvbXBsZXRlZCBzdGF0ZSwgdGhlcmUgbWlnaHQgYmVcbiAgICAgIC8vIG5ld2x5IGxvYWRlZCBzdGFuZGFsb25lIGNvbXBvbmVudHMgdXNlZCB3aXRoaW4gdGhlIGJsb2NrLCB3aGljaCBtYXlcbiAgICAgIC8vIGltcG9ydCBOZ01vZHVsZXMgd2l0aCBwcm92aWRlcnMuIEluIG9yZGVyIHRvIG1ha2UgdGhvc2UgcHJvdmlkZXJzXG4gICAgICAvLyBhdmFpbGFibGUgZm9yIGNvbXBvbmVudHMgZGVjbGFyZWQgaW4gdGhhdCBOZ01vZHVsZSwgd2UgY3JlYXRlIGFuIGluc3RhbmNlXG4gICAgICAvLyBvZiBlbnZpcm9ubWVudCBpbmplY3RvciB0byBob3N0IHRob3NlIHByb3ZpZGVycyBhbmQgcGFzcyB0aGlzIGluamVjdG9yXG4gICAgICAvLyB0byB0aGUgbG9naWMgdGhhdCBjcmVhdGVzIGEgdmlldy5cbiAgICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKGhvc3RUVmlldywgdE5vZGUpO1xuICAgICAgY29uc3QgcHJvdmlkZXJzID0gdERldGFpbHMucHJvdmlkZXJzO1xuICAgICAgaWYgKHByb3ZpZGVycyAmJiBwcm92aWRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IGhvc3RMVmlld1tJTkpFQ1RPUl0gYXMgSW5qZWN0b3I7XG4gICAgICAgIGNvbnN0IHBhcmVudEVudkluamVjdG9yID0gcGFyZW50SW5qZWN0b3IuZ2V0KEVudmlyb25tZW50SW5qZWN0b3IpO1xuICAgICAgICBpbmplY3RvciA9XG4gICAgICAgICAgICBwYXJlbnRFbnZJbmplY3Rvci5nZXQoQ2FjaGVkSW5qZWN0b3JTZXJ2aWNlKVxuICAgICAgICAgICAgICAgIC5nZXRPckNyZWF0ZUluamVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0RGV0YWlscywgcGFyZW50RW52SW5qZWN0b3IsIHByb3ZpZGVycywgbmdEZXZNb2RlID8gJ0RlZmVyQmxvY2sgSW5qZWN0b3InIDogJycpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXIsIGFjdGl2ZUJsb2NrVE5vZGUudFZpZXchLnNzcklkKTtcbiAgICBjb25zdCBlbWJlZGRlZExWaWV3ID1cbiAgICAgICAgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhob3N0TFZpZXcsIGFjdGl2ZUJsb2NrVE5vZGUsIG51bGwsIHtkZWh5ZHJhdGVkVmlldywgaW5qZWN0b3J9KTtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgbENvbnRhaW5lciwgZW1iZWRkZWRMVmlldywgdmlld0luZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20oYWN0aXZlQmxvY2tUTm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgICBtYXJrVmlld0RpcnR5KGVtYmVkZGVkTFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogRXh0ZW5kcyB0aGUgYGFwcGx5RGVmZXJCbG9ja1N0YXRlYCB3aXRoIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcuXG4gKiBUaGlzIGZ1bmN0aW9uIGJlY29tZXMgYXZhaWxhYmxlIG9uIGEgcGFnZSBpZiB0aGVyZSBhcmUgZGVmZXIgYmxvY2tzXG4gKiB0aGF0IHVzZSBgYWZ0ZXJgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGluIHRoZSBgQGxvYWRpbmdgIG9yXG4gKiBgQHBsYWNlaG9sZGVyYCBibG9ja3MuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmcoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdE5vZGU6IFROb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXc8dW5rbm93bj4pIHtcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHMoaG9zdFRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPT09IG51bGwgfHwgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA8PSBub3cpIHtcbiAgICBsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdID0gbnVsbDtcblxuICAgIGNvbnN0IGxvYWRpbmdBZnRlciA9IGdldExvYWRpbmdCbG9ja0FmdGVyKHREZXRhaWxzKTtcbiAgICBjb25zdCBpbkxvYWRpbmdBZnRlclBoYXNlID0gbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSAhPT0gbnVsbDtcbiAgICBpZiAobmV3U3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nICYmIGxvYWRpbmdBZnRlciAhPT0gbnVsbCAmJiAhaW5Mb2FkaW5nQWZ0ZXJQaGFzZSkge1xuICAgICAgLy8gVHJ5aW5nIHRvIHJlbmRlciBsb2FkaW5nLCBidXQgaXQgaGFzIGFuIGBhZnRlcmAgY29uZmlnLFxuICAgICAgLy8gc28gc2NoZWR1bGUgYW4gdXBkYXRlIGFjdGlvbiBhZnRlciBhIHRpbWVvdXQuXG4gICAgICBsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgICAgY29uc3QgY2xlYW51cEZuID1cbiAgICAgICAgICBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUobG9hZGluZ0FmdGVyLCBsRGV0YWlscywgdE5vZGUsIGxDb250YWluZXIsIGhvc3RMVmlldyk7XG4gICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dID0gY2xlYW51cEZuO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSB0cmFuc2l0aW9uIHRvIGEgY29tcGxldGUgb3IgYW4gZXJyb3Igc3RhdGUgYW5kIHRoZXJlIGlzIGEgcGVuZGluZ1xuICAgICAgLy8gb3BlcmF0aW9uIHRvIHJlbmRlciBsb2FkaW5nIGFmdGVyIGEgdGltZW91dCAtIGludm9rZSBhIGNsZWFudXAgb3BlcmF0aW9uLFxuICAgICAgLy8gd2hpY2ggc3RvcHMgdGhlIHRpbWVyLlxuICAgICAgaWYgKG5ld1N0YXRlID4gRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcgJiYgaW5Mb2FkaW5nQWZ0ZXJQaGFzZSkge1xuICAgICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dISgpO1xuICAgICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dID0gbnVsbDtcbiAgICAgICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBhcHBseURlZmVyQmxvY2tTdGF0ZShuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xuXG4gICAgICBjb25zdCBkdXJhdGlvbiA9IGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBuZXdTdGF0ZSk7XG4gICAgICBpZiAoZHVyYXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG5vdyArIGR1cmF0aW9uO1xuICAgICAgICBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUoZHVyYXRpb24sIGxEZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lciwgaG9zdExWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIHN0aWxsIHJlbmRlcmluZyB0aGUgcHJldmlvdXMgc3RhdGUuXG4gICAgLy8gVXBkYXRlIHRoZSBgTkVYVF9ERUZFUl9CTE9DS19TVEFURWAsIHdoaWNoIHdvdWxkIGJlXG4gICAgLy8gcGlja2VkIHVwIG9uY2UgaXQncyB0aW1lIHRvIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUuXG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhbiB1cGRhdGUgb3BlcmF0aW9uIGFmdGVyIGEgc3BlY2lmaWVkIHRpbWVvdXQuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVmZXJCbG9ja1VwZGF0ZShcbiAgICB0aW1lb3V0OiBudW1iZXIsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+KTogVm9pZEZ1bmN0aW9uIHtcbiAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV4dFN0YXRlID0gbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV07XG4gICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG51bGw7XG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBudWxsO1xuICAgIGlmIChuZXh0U3RhdGUgIT09IG51bGwpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShuZXh0U3RhdGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH07XG4gIHJldHVybiBzY2hlZHVsZVRpbWVyVHJpZ2dlcih0aW1lb3V0LCBjYWxsYmFjaywgaG9zdExWaWV3KTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB3ZSBjYW4gdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZS5cbiAqXG4gKiBXZSB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlIGlmIHRoZSBwcmV2aW91cyBzdGF0ZSB3YXMgcmVwcmVzZW50ZWRcbiAqIHdpdGggYSBudW1iZXIgdGhhdCBpcyBsZXNzIHRoYW4gdGhlIG5leHQgc3RhdGUuIEZvciBleGFtcGxlLCBpZiB0aGUgY3VycmVudFxuICogc3RhdGUgaXMgXCJsb2FkaW5nXCIgKHJlcHJlc2VudGVkIGFzIGAxYCksIHdlIHNob3VsZCBub3Qgc2hvdyBhIHBsYWNlaG9sZGVyXG4gKiAocmVwcmVzZW50ZWQgYXMgYDBgKSwgYnV0IHdlIGNhbiBzaG93IGEgY29tcGxldGVkIHN0YXRlIChyZXByZXNlbnRlZCBhcyBgMmApXG4gKiBvciBhbiBlcnJvciBzdGF0ZSAocmVwcmVzZW50ZWQgYXMgYDNgKS5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFN0YXRlQ2hhbmdlKFxuICAgIGN1cnJlbnRTdGF0ZTogRGVmZXJCbG9ja1N0YXRlfERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlKTogYm9vbGVhbiB7XG4gIHJldHVybiBjdXJyZW50U3RhdGUgPCBuZXdTdGF0ZTtcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIHByZWZldGNoaW5nIG9mIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jay5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgaWYgKGxWaWV3W0lOSkVDVE9SXSAmJiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhsVmlld1tJTkpFQ1RPUl0hKSkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIGlmIHRoZSBwcm9jZXNzIGhhc24ndCBzdGFydGVkIHlldC5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSAhPT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBJZiB0aGUgbG9hZGluZyBzdGF0dXMgaXMgZGlmZmVyZW50IGZyb20gaW5pdGlhbCBvbmUsIGl0IG1lYW5zIHRoYXRcbiAgICAvLyB0aGUgbG9hZGluZyBvZiBkZXBlbmRlbmNpZXMgaXMgaW4gcHJvZ3Jlc3MgYW5kIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG9cbiAgICAvLyBpbiB0aGlzIGZ1bmN0aW9uLiBBbGwgZGV0YWlscyBjYW4gYmUgb2J0YWluZWQgZnJvbSB0aGUgYHREZXRhaWxzYCBvYmplY3QuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgY29uc3QgcHJpbWFyeUJsb2NrVE5vZGUgPSBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldywgdERldGFpbHMpO1xuXG4gIC8vIFN3aXRjaCBmcm9tIE5PVF9TVEFSVEVEIC0+IElOX1BST0dSRVNTIHN0YXRlLlxuICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUztcblxuICAvLyBQcmVmZXRjaGluZyBpcyB0cmlnZ2VyZWQsIGNsZWFudXAgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggdHJpZ2dlcnMuXG4gIGludm9rZVRyaWdnZXJDbGVhbnVwRm5zKFRyaWdnZXJUeXBlLlByZWZldGNoLCBsRGV0YWlscyk7XG5cbiAgbGV0IGRlcGVuZGVuY2llc0ZuID0gdERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm47XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgICBjb25zdCBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA9XG4gICAgICAgIGluamVjdG9yLmdldChERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAgIGlmIChkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvcikge1xuICAgICAgZGVwZW5kZW5jaWVzRm4gPSBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvci5pbnRlcmNlcHQoZGVwZW5kZW5jaWVzRm4pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEluZGljYXRlIHRoYXQgYW4gYXBwbGljYXRpb24gaXMgbm90IHN0YWJsZSBhbmQgaGFzIGEgcGVuZGluZyB0YXNrLlxuICBjb25zdCBwZW5kaW5nVGFza3MgPSBpbmplY3Rvci5nZXQoUGVuZGluZ1Rhc2tzKTtcbiAgY29uc3QgdGFza0lkID0gcGVuZGluZ1Rhc2tzLmFkZCgpO1xuXG4gIC8vIFRoZSBgZGVwZW5kZW5jaWVzRm5gIG1pZ2h0IGJlIGBudWxsYCB3aGVuIGFsbCBkZXBlbmRlbmNpZXMgd2l0aGluXG4gIC8vIGEgZ2l2ZW4gZGVmZXIgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZWQgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgICBwZW5kaW5nVGFza3MucmVtb3ZlKHRhc2tJZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoZSBsb2FkaW5nIFByb21pc2VcbiAgICAvLyBhbmQgYSBwZW5kaW5nIHRhc2sgc2hvdWxkIGFsc28gYmUgcmVtb3ZlZC5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG4gICAgcGVuZGluZ1Rhc2tzLnJlbW92ZSh0YXNrSWQpO1xuXG4gICAgaWYgKGZhaWxlZCkge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEO1xuXG4gICAgICBpZiAodERldGFpbHMuZXJyb3JUbXBsSW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVMb2NhdGlvbiA9IGdldFRlbXBsYXRlTG9jYXRpb25EZXRhaWxzKGxWaWV3KTtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5ERUZFUl9MT0FESU5HX0ZBSUxFRCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgICdMb2FkaW5nIGRlcGVuZGVuY2llcyBmb3IgYEBkZWZlcmAgYmxvY2sgZmFpbGVkLCAnICtcbiAgICAgICAgICAgICAgICAgICAgYGJ1dCBubyBcXGBAZXJyb3JcXGAgYmxvY2sgd2FzIGNvbmZpZ3VyZWQke3RlbXBsYXRlTG9jYXRpb259LiBgICtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnNpZGVyIHVzaW5nIHRoZSBgQGVycm9yYCBibG9jayB0byByZW5kZXIgYW4gZXJyb3Igc3RhdGUuJyk7XG4gICAgICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID1cbiAgICAgICAgICAgIGFkZERlcHNUb1JlZ2lzdHJ5PERpcmVjdGl2ZURlZkxpc3Q+KHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCBkaXJlY3RpdmVEZWZzKTtcblxuICAgICAgICAvLyBFeHRyYWN0IHByb3ZpZGVycyBmcm9tIGFsbCBOZ01vZHVsZXMgaW1wb3J0ZWQgYnkgc3RhbmRhbG9uZSBjb21wb25lbnRzXG4gICAgICAgIC8vIHVzZWQgd2l0aGluIHRoaXMgZGVmZXIgYmxvY2suXG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZVR5cGVzID0gZGlyZWN0aXZlRGVmcy5tYXAoZGVmID0+IGRlZi50eXBlKTtcbiAgICAgICAgY29uc3QgcHJvdmlkZXJzID0gaW50ZXJuYWxJbXBvcnRQcm92aWRlcnNGcm9tKGZhbHNlLCAuLi5kaXJlY3RpdmVUeXBlcyk7XG4gICAgICAgIHREZXRhaWxzLnByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICAgIH1cbiAgICAgIGlmIChwaXBlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA9XG4gICAgICAgICAgICBhZGREZXBzVG9SZWdpc3RyeTxQaXBlRGVmTGlzdD4ocHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5LCBwaXBlRGVmcyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVuZGVyIHBsYWNlaG9sZGVyIGNvbnRlbnQgKGlmIHByZXNlbnQpICovXG5mdW5jdGlvbiByZW5kZXJQbGFjZWhvbGRlcihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLCB0Tm9kZSwgbENvbnRhaW5lcik7XG59XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgXCJsb2FkaW5nXCIgUHJvbWlzZSBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGRlZmVyIHN1Yi1ibG9jayxcbiAqIGJhc2VkIG9uIHRoZSBsb2FkaW5nIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFJlcHJlc2VudHMgZGVmZXIgYmxvY2sgaW5mbyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyhcbiAgICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlLCAnRXhwZWN0ZWQgbG9hZGluZyBQcm9taXNlIHRvIGV4aXN0IG9uIHRoaXMgZGVmZXIgYmxvY2snKTtcblxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSEudGhlbigoKSA9PiB7XG4gICAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG5cbiAgICAgIC8vIEV2ZXJ5dGhpbmcgaXMgbG9hZGVkLCBzaG93IHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnRcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHRyaWdnZXIgbG9hZGluZyBvZiBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMuXG4gKiBJZiB0aGUgYmxvY2sgaXMgYWxyZWFkeSBpbiBhIGxvYWRpbmcsIGNvbXBsZXRlZCBvciBhbiBlcnJvciBzdGF0ZSAtXG4gKiBubyBhZGRpdGlvbmFsIGFjdGlvbnMgYXJlIHRha2VuLlxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICBpZiAoIXNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gRGVmZXIgYmxvY2sgaXMgdHJpZ2dlcmVkLCBjbGVhbnVwIGFsbCByZWdpc3RlcmVkIHRyaWdnZXIgZnVuY3Rpb25zLlxuICBpbnZva2VBbGxUcmlnZ2VyQ2xlYW51cEZucyhsRGV0YWlscyk7XG5cbiAgc3dpdGNoICh0RGV0YWlscy5sb2FkaW5nU3RhdGUpIHtcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuXG4gICAgICAvLyBUaGUgYGxvYWRpbmdTdGF0ZWAgbWlnaHQgaGF2ZSBjaGFuZ2VkIHRvIFwibG9hZGluZ1wiLlxuICAgICAgaWYgKCh0RGV0YWlscy5sb2FkaW5nU3RhdGUgYXMgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUpID09PVxuICAgICAgICAgIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTKSB7XG4gICAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUzpcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuTG9hZGluZywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFOlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3dFcnJvcignVW5rbm93biBkZWZlciBibG9jayBzdGF0ZScpO1xuICAgICAgfVxuICB9XG59XG4iXX0=