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
import { declareTemplate } from '../render3/instructions/template';
import { isDestroyed } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, INJECTOR, PARENT, TVIEW } from '../render3/interfaces/view';
import { getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex, } from '../render3/state';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { getConstant, getTNode, removeLViewOnDestroy, storeLViewOnDestroy, } from '../render3/util/view_utils';
import { addLViewToLContainer, createAndRenderEmbeddedLView, removeLViewFromLContainer, shouldAddViewToDom, } from '../render3/view_manipulation';
import { assertDefined, throwError } from '../util/assert';
import { performanceMarkFeature } from '../util/performance';
import { invokeAllTriggerCleanupFns, invokeTriggerCleanupFns, storeTriggerCleanupFn, } from './cleanup';
import { onHover, onInteraction, onViewport, registerDomTrigger } from './dom_triggers';
import { onIdle } from './idle_scheduler';
import { DEFER_BLOCK_STATE, DeferBlockBehavior, DeferBlockInternalState, DeferBlockState, DeferDependenciesLoadingState, LOADING_AFTER_CLEANUP_FN, NEXT_DEFER_BLOCK_STATE, STATE_IS_FROZEN_UNTIL, } from './interfaces';
import { onTimer, scheduleTimerTrigger } from './timer_scheduler';
import { addDepsToRegistry, assertDeferredDependenciesLoaded, getLDeferBlockDetails, getLoadingBlockAfter, getMinimumDurationForState, getPrimaryBlockTNode, getTDeferBlockDetails, getTemplateIndexForState, setLDeferBlockDetails, setTDeferBlockDetails, } from './utils';
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
        tDetails.placeholderBlockConfig = getConstant(tViewConsts, placeholderConfigIndex);
    }
    if (loadingConfigIndex != null) {
        tDetails.loadingBlockConfig = getConstant(tViewConsts, loadingConfigIndex);
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
    const tNode = declareTemplate(lView, tView, index, null, 0, 0);
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
        null, // PREFETCH_TRIGGER_CLEANUP_FNS
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
        const needsScheduling = !skipTimerScheduling &&
            isPlatformBrowser(injector) &&
            (getLoadingBlockAfter(tDetails) !== null ||
                getMinimumDurationForState(tDetails, DeferBlockState.Loading) !== null ||
                getMinimumDurationForState(tDetails, DeferBlockState.Placeholder));
        if (ngDevMode && needsScheduling) {
            assertDefined(applyDeferBlockStateWithSchedulingImpl, 'Expected scheduling function to be defined');
        }
        const applyStateFn = needsScheduling
            ? applyDeferBlockStateWithSchedulingImpl
            : applyDeferBlockState;
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
    return (currentInjector instanceof ChainedInjector &&
        typeof currentInjector.injector.__ngOutletInjector === 'function');
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
                const parentEnvInjector = isParentOutletInjector
                    ? parentInjector
                    : parentInjector.get(EnvironmentInjector);
                injector = parentEnvInjector
                    .get(CachedInjectorService)
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
        const embeddedLView = createAndRenderEmbeddedLView(hostLView, activeBlockTNode, null, {
            dehydratedView,
            injector,
        });
        addLViewToLContainer(lContainer, embeddedLView, viewIndex, shouldAddViewToDom(activeBlockTNode, dehydratedView));
        markViewDirty(embeddedLView, 2 /* NotificationSource.DeferBlockStateUpdate */);
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
        const deferDependencyInterceptor = injector.get(DEFER_BLOCK_DEPENDENCY_INTERCEPTOR, null, {
            optional: true,
        });
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
    tDetails.loadingPromise = Promise.allSettled(dependenciesFn()).then((results) => {
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
                primaryBlockTView.directiveRegistry = addDepsToRegistry(primaryBlockTView.directiveRegistry, directiveDefs);
                // Extract providers from all NgModules imported by standalone components
                // used within this defer block.
                const directiveTypes = directiveDefs.map((def) => def.type);
                const providers = internalImportProvidersFrom(false, ...directiveTypes);
                tDetails.providers = providers;
            }
            if (pipeDefs.length > 0) {
                primaryBlockTView.pipeRegistry = addDepsToRegistry(primaryBlockTView.pipeRegistry, pipeDefs);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRW5FLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRWpFLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxjQUFjLEVBQVcsTUFBTSxPQUFPLENBQUM7QUFDcEUsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDOUQsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDakYsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDekQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbkYsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFDdEYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHlDQUF5QyxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sa0NB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RSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxRQUFRO1lBQ3pDLFNBQVMsSUFBSSxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNuRSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxNQUFNO1lBQ3ZDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU07UUFDUjtZQUNFLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2QsVUFBVSxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDMUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtDYWNoZWRJbmplY3RvclNlcnZpY2V9IGZyb20gJy4uL2NhY2hlZF9pbmplY3Rvcl9zZXJ2aWNlJztcbmltcG9ydCB7Tm90aWZpY2F0aW9uU291cmNlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3IsIEluamVjdGlvblRva2VuLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbnRlcm5hbEltcG9ydFByb3ZpZGVyc0Zyb219IGZyb20gJy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL3JlbmRlcjMvYmluZGluZ3MnO1xuaW1wb3J0IHtDaGFpbmVkSW5qZWN0b3J9IGZyb20gJy4uL3JlbmRlcjMvY29tcG9uZW50X3JlZic7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXRUZW1wbGF0ZUxvY2F0aW9uRGV0YWlsc30gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7bWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7aGFuZGxlRXJyb3J9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge2RlY2xhcmVUZW1wbGF0ZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGVtcGxhdGUnO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3R9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGVzdHJveWVkfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXcsIFBBUkVOVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1xuICBnZXRDdXJyZW50VE5vZGUsXG4gIGdldExWaWV3LFxuICBnZXRTZWxlY3RlZFROb2RlLFxuICBnZXRUVmlldyxcbiAgbmV4dEJpbmRpbmdJbmRleCxcbn0gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge1xuICBnZXRDb25zdGFudCxcbiAgZ2V0VE5vZGUsXG4gIHJlbW92ZUxWaWV3T25EZXN0cm95LFxuICBzdG9yZUxWaWV3T25EZXN0cm95LFxufSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1xuICBhZGRMVmlld1RvTENvbnRhaW5lcixcbiAgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyxcbiAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcixcbiAgc2hvdWxkQWRkVmlld1RvRG9tLFxufSBmcm9tICcuLi9yZW5kZXIzL3ZpZXdfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi91dGlsL3BlcmZvcm1hbmNlJztcblxuaW1wb3J0IHtcbiAgaW52b2tlQWxsVHJpZ2dlckNsZWFudXBGbnMsXG4gIGludm9rZVRyaWdnZXJDbGVhbnVwRm5zLFxuICBzdG9yZVRyaWdnZXJDbGVhbnVwRm4sXG59IGZyb20gJy4vY2xlYW51cCc7XG5pbXBvcnQge29uSG92ZXIsIG9uSW50ZXJhY3Rpb24sIG9uVmlld3BvcnQsIHJlZ2lzdGVyRG9tVHJpZ2dlcn0gZnJvbSAnLi9kb21fdHJpZ2dlcnMnO1xuaW1wb3J0IHtvbklkbGV9IGZyb20gJy4vaWRsZV9zY2hlZHVsZXInO1xuaW1wb3J0IHtcbiAgREVGRVJfQkxPQ0tfU1RBVEUsXG4gIERlZmVyQmxvY2tCZWhhdmlvcixcbiAgRGVmZXJCbG9ja0NvbmZpZyxcbiAgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcixcbiAgRGVmZXJCbG9ja0ludGVybmFsU3RhdGUsXG4gIERlZmVyQmxvY2tTdGF0ZSxcbiAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUsXG4gIERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnLFxuICBEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWcsXG4gIERlcGVuZGVuY3lSZXNvbHZlckZuLFxuICBMRGVmZXJCbG9ja0RldGFpbHMsXG4gIExPQURJTkdfQUZURVJfQ0xFQU5VUF9GTixcbiAgTkVYVF9ERUZFUl9CTE9DS19TVEFURSxcbiAgU1RBVEVfSVNfRlJPWkVOX1VOVElMLFxuICBURGVmZXJCbG9ja0RldGFpbHMsXG4gIFRyaWdnZXJUeXBlLFxufSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtvblRpbWVyLCBzY2hlZHVsZVRpbWVyVHJpZ2dlcn0gZnJvbSAnLi90aW1lcl9zY2hlZHVsZXInO1xuaW1wb3J0IHtcbiAgYWRkRGVwc1RvUmVnaXN0cnksXG4gIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkLFxuICBnZXRMRGVmZXJCbG9ja0RldGFpbHMsXG4gIGdldExvYWRpbmdCbG9ja0FmdGVyLFxuICBnZXRNaW5pbXVtRHVyYXRpb25Gb3JTdGF0ZSxcbiAgZ2V0UHJpbWFyeUJsb2NrVE5vZGUsXG4gIGdldFREZWZlckJsb2NrRGV0YWlscyxcbiAgZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlLFxuICBzZXRMRGVmZXJCbG9ja0RldGFpbHMsXG4gIHNldFREZWZlckJsb2NrRGV0YWlscyxcbn0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICogKlxuICogSW5qZWN0b3IgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcHJvdmlkZSBgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcmAgY2xhc3NcbiAqIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIFRoaXMgdG9rZW4gaXMgb25seSBpbmplY3RlZCBpbiBkZXZNb2RlXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SID1cbiAgbmV3IEluamVjdGlvblRva2VuPERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3I+KCdERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SJyk7XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCB0b2tlbiB1c2VkIGZvciBjb25maWd1cmluZyBkZWZlciBibG9jayBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0NPTkZJRyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrQ29uZmlnPihcbiAgbmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0NPTkZJRycgOiAnJyxcbik7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGRlZmVyIGJsb2NrcyBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuICpcbiAqIEN1cnJlbnRseSwgZGVmZXIgYmxvY2tzIGFyZSBub3QgdHJpZ2dlcmVkIG9uIHRoZSBzZXJ2ZXIsXG4gKiBvbmx5IHBsYWNlaG9sZGVyIGNvbnRlbnQgaXMgcmVuZGVyZWQgKGlmIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3I6IEluamVjdG9yKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGluamVjdG9yLmdldChERUZFUl9CTE9DS19DT05GSUcsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoY29uZmlnPy5iZWhhdmlvciA9PT0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpO1xufVxuXG4vKipcbiAqIFJlZmVyZW5jZSB0byB0aGUgdGltZXItYmFzZWQgc2NoZWR1bGVyIGltcGxlbWVudGF0aW9uIG9mIGRlZmVyIGJsb2NrIHN0YXRlXG4gKiByZW5kZXJpbmcgbWV0aG9kLiBJdCdzIHVzZWQgdG8gbWFrZSB0aW1lci1iYXNlZCBzY2hlZHVsaW5nIHRyZWUtc2hha2FibGUuXG4gKiBJZiBgbWluaW11bWAgb3IgYGFmdGVyYCBwYXJhbWV0ZXJzIGFyZSB1c2VkLCBjb21waWxlciBnZW5lcmF0ZXMgYW4gZXh0cmFcbiAqIGFyZ3VtZW50IGZvciB0aGUgYMm1ybVkZWZlcmAgaW5zdHJ1Y3Rpb24sIHdoaWNoIHJlZmVyZW5jZXMgYSB0aW1lci1iYXNlZFxuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmxldCBhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nSW1wbDogdHlwZW9mIGFwcGx5RGVmZXJCbG9ja1N0YXRlIHwgbnVsbCA9IG51bGw7XG5cbi8qKlxuICogRW5hYmxlcyB0aW1lci1yZWxhdGVkIHNjaGVkdWxpbmcgaWYgYGFmdGVyYCBvciBgbWluaW11bWAgcGFyYW1ldGVycyBhcmUgc2V0dXBcbiAqIG9uIHRoZSBgQGxvYWRpbmdgIG9yIGBAcGxhY2Vob2xkZXJgIGJsb2Nrcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlckVuYWJsZVRpbWVyU2NoZWR1bGluZyhcbiAgdFZpZXc6IFRWaWV3LFxuICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLFxuICBwbGFjZWhvbGRlckNvbmZpZ0luZGV4PzogbnVtYmVyIHwgbnVsbCxcbiAgbG9hZGluZ0NvbmZpZ0luZGV4PzogbnVtYmVyIHwgbnVsbCxcbikge1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgaWYgKHBsYWNlaG9sZGVyQ29uZmlnSW5kZXggIT0gbnVsbCkge1xuICAgIHREZXRhaWxzLnBsYWNlaG9sZGVyQmxvY2tDb25maWcgPSBnZXRDb25zdGFudDxEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWc+KFxuICAgICAgdFZpZXdDb25zdHMsXG4gICAgICBwbGFjZWhvbGRlckNvbmZpZ0luZGV4LFxuICAgICk7XG4gIH1cbiAgaWYgKGxvYWRpbmdDb25maWdJbmRleCAhPSBudWxsKSB7XG4gICAgdERldGFpbHMubG9hZGluZ0Jsb2NrQ29uZmlnID0gZ2V0Q29uc3RhbnQ8RGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWc+KFxuICAgICAgdFZpZXdDb25zdHMsXG4gICAgICBsb2FkaW5nQ29uZmlnSW5kZXgsXG4gICAgKTtcbiAgfVxuXG4gIC8vIEVuYWJsZSBpbXBsZW1lbnRhdGlvbiB0aGF0IHN1cHBvcnRzIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcuXG4gIGlmIChhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nSW1wbCA9PT0gbnVsbCkge1xuICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsID0gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZztcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIGRlZmVyIGJsb2Nrcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGBkZWZlcmAgaW5zdHJ1Y3Rpb24uXG4gKiBAcGFyYW0gcHJpbWFyeVRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcHJpbWFyeSBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGRlcGVuZGVuY3lSZXNvbHZlckZuIEZ1bmN0aW9uIHRoYXQgY29udGFpbnMgZGVwZW5kZW5jaWVzIGZvciB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxvYWRpbmdUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGxvYWRpbmcgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcGxhY2Vob2xkZXIgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBlcnJvclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgZXJyb3IgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBsb2FkaW5nQ29uZmlnSW5kZXggSW5kZXggaW4gdGhlIGNvbnN0YW50cyBhcnJheSBvZiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgbG9hZGluZy5cbiAqICAgICBibG9jay5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlckNvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgcGxhY2Vob2xkZXIgYmxvY2suXG4gKiBAcGFyYW0gZW5hYmxlVGltZXJTY2hlZHVsaW5nIEZ1bmN0aW9uIHRoYXQgZW5hYmxlcyB0aW1lci1yZWxhdGVkIHNjaGVkdWxpbmcgaWYgYGFmdGVyYFxuICogICAgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGFyZSBzZXR1cCBvbiB0aGUgYEBsb2FkaW5nYCBvciBgQHBsYWNlaG9sZGVyYCBibG9ja3MuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcihcbiAgaW5kZXg6IG51bWJlcixcbiAgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLFxuICBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZuIHwgbnVsbCxcbiAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlciB8IG51bGwsXG4gIHBsYWNlaG9sZGVyVG1wbEluZGV4PzogbnVtYmVyIHwgbnVsbCxcbiAgZXJyb3JUbXBsSW5kZXg/OiBudW1iZXIgfCBudWxsLFxuICBsb2FkaW5nQ29uZmlnSW5kZXg/OiBudW1iZXIgfCBudWxsLFxuICBwbGFjZWhvbGRlckNvbmZpZ0luZGV4PzogbnVtYmVyIHwgbnVsbCxcbiAgZW5hYmxlVGltZXJTY2hlZHVsaW5nPzogdHlwZW9mIMm1ybVkZWZlckVuYWJsZVRpbWVyU2NoZWR1bGluZyxcbikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdE5vZGUgPSBkZWNsYXJlVGVtcGxhdGUobFZpZXcsIHRWaWV3LCBpbmRleCwgbnVsbCwgMCwgMCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nRGVmZXInKTtcblxuICAgIGNvbnN0IHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMgPSB7XG4gICAgICBwcmltYXJ5VG1wbEluZGV4LFxuICAgICAgbG9hZGluZ1RtcGxJbmRleDogbG9hZGluZ1RtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJUbXBsSW5kZXg6IHBsYWNlaG9sZGVyVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBlcnJvclRtcGxJbmRleDogZXJyb3JUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyQmxvY2tDb25maWc6IG51bGwsXG4gICAgICBsb2FkaW5nQmxvY2tDb25maWc6IG51bGwsXG4gICAgICBkZXBlbmRlbmN5UmVzb2x2ZXJGbjogZGVwZW5kZW5jeVJlc29sdmVyRm4gPz8gbnVsbCxcbiAgICAgIGxvYWRpbmdTdGF0ZTogRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQsXG4gICAgICBsb2FkaW5nUHJvbWlzZTogbnVsbCxcbiAgICAgIHByb3ZpZGVyczogbnVsbCxcbiAgICB9O1xuICAgIGVuYWJsZVRpbWVyU2NoZWR1bGluZz8uKHRWaWV3LCB0RGV0YWlscywgcGxhY2Vob2xkZXJDb25maWdJbmRleCwgbG9hZGluZ0NvbmZpZ0luZGV4KTtcbiAgICBzZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIGFkanVzdGVkSW5kZXgsIHREZXRhaWxzKTtcbiAgfVxuXG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1thZGp1c3RlZEluZGV4XTtcblxuICAvLyBJZiBoeWRyYXRpb24gaXMgZW5hYmxlZCwgbG9va3MgdXAgZGVoeWRyYXRlZCB2aWV3cyBpbiB0aGUgRE9NXG4gIC8vIHVzaW5nIGh5ZHJhdGlvbiBhbm5vdGF0aW9uIGluZm8gYW5kIHN0b3JlcyB0aG9zZSB2aWV3cyBvbiBMQ29udGFpbmVyLlxuICAvLyBJbiBjbGllbnQtb25seSBtb2RlLCB0aGlzIGZ1bmN0aW9uIGlzIGEgbm9vcC5cbiAgcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkxDb250YWluZXIobENvbnRhaW5lciwgdE5vZGUsIGxWaWV3KTtcblxuICAvLyBJbml0IGluc3RhbmNlLXNwZWNpZmljIGRlZmVyIGRldGFpbHMgYW5kIHN0b3JlIGl0LlxuICBjb25zdCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzID0gW1xuICAgIG51bGwsIC8vIE5FWFRfREVGRVJfQkxPQ0tfU1RBVEVcbiAgICBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsLCAvLyBERUZFUl9CTE9DS19TVEFURVxuICAgIG51bGwsIC8vIFNUQVRFX0lTX0ZST1pFTl9VTlRJTFxuICAgIG51bGwsIC8vIExPQURJTkdfQUZURVJfQ0xFQU5VUF9GTlxuICAgIG51bGwsIC8vIFRSSUdHRVJfQ0xFQU5VUF9GTlNcbiAgICBudWxsLCAvLyBQUkVGRVRDSF9UUklHR0VSX0NMRUFOVVBfRk5TXG4gIF07XG4gIHNldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgYWRqdXN0ZWRJbmRleCwgbERldGFpbHMpO1xuXG4gIGNvbnN0IGNsZWFudXBUcmlnZ2Vyc0ZuID0gKCkgPT4gaW52b2tlQWxsVHJpZ2dlckNsZWFudXBGbnMobERldGFpbHMpO1xuXG4gIC8vIFdoZW4gZGVmZXIgYmxvY2sgaXMgdHJpZ2dlcmVkIC0gdW5zdWJzY3JpYmUgZnJvbSBMVmlldyBkZXN0cm95IGNsZWFudXAuXG4gIHN0b3JlVHJpZ2dlckNsZWFudXBGbihUcmlnZ2VyVHlwZS5SZWd1bGFyLCBsRGV0YWlscywgKCkgPT5cbiAgICByZW1vdmVMVmlld09uRGVzdHJveShsVmlldywgY2xlYW51cFRyaWdnZXJzRm4pLFxuICApO1xuICBzdG9yZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwVHJpZ2dlcnNGbik7XG59XG5cbi8qKlxuICogTG9hZHMgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIHdoZW4gYSB0cmlnZ2VyIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcldoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdmFsdWUgPSBCb29sZWFuKHJhd1ZhbHVlKTsgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgICBpZiAodmFsdWUgPT09IGZhbHNlICYmIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwpIHtcbiAgICAgICAgLy8gSWYgbm90aGluZyBpcyByZW5kZXJlZCB5ZXQsIHJlbmRlciBhIHBsYWNlaG9sZGVyIChpZiBkZWZpbmVkKS5cbiAgICAgICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHZhbHVlID09PSB0cnVlICYmXG4gICAgICAgIChyZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsIHx8XG4gICAgICAgICAgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKVxuICAgICAgKSB7XG4gICAgICAgIC8vIFRoZSBgd2hlbmAgY29uZGl0aW9uIGhhcyBjaGFuZ2VkIHRvIGB0cnVlYCwgdHJpZ2dlciBkZWZlciBibG9jayBsb2FkaW5nXG4gICAgICAgIC8vIGlmIHRoZSBibG9jayBpcyBlaXRoZXIgaW4gaW5pdGlhbCAobm90aGluZyBpcyByZW5kZXJlZCkgb3IgYSBwbGFjZWhvbGRlclxuICAgICAgICAvLyBzdGF0ZS5cbiAgICAgICAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVmZXRjaGVzIHRoZSBkZWZlcnJlZCBjb250ZW50IHdoZW4gYSB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaFdoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG5cbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICBpZiAodmFsdWUgPT09IHRydWUgJiYgdERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICAgIHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRUcmlnZ2VyKG9uSWRsZSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBwcmVmZXRjaCBvbiBpZGxlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JZGxlKCkge1xuICBzY2hlZHVsZURlbGF5ZWRQcmVmZXRjaGluZyhvbklkbGUpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIFJlbmRlciBwbGFjZWhvbGRlciBibG9jayBvbmx5IGlmIGxvYWRpbmcgdGVtcGxhdGUgaXMgbm90IHByZXNlbnQgYW5kIHdlJ3JlIG9uXG4gIC8vIHRoZSBjbGllbnQgdG8gYXZvaWQgY29udGVudCBmbGlja2VyaW5nLCBzaW5jZSBpdCB3b3VsZCBiZSBpbW1lZGlhdGVseSByZXBsYWNlZFxuICAvLyBieSB0aGUgbG9hZGluZyBibG9jay5cbiAgaWYgKCFzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcikgfHwgdERldGFpbHMubG9hZGluZ1RtcGxJbmRleCA9PT0gbnVsbCkge1xuICAgIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIH1cbiAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIGxvYWRpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25UaW1lcihkZWxheTogbnVtYmVyKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgIGxWaWV3LFxuICAgIHROb2RlLFxuICAgIHRyaWdnZXJJbmRleCxcbiAgICB3YWxrVXBUaW1lcyxcbiAgICBvbkhvdmVyLFxuICAgICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksXG4gICAgVHJpZ2dlclR5cGUuUmVndWxhcixcbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsXG4gICAgICB0Tm9kZSxcbiAgICAgIHRyaWdnZXJJbmRleCxcbiAgICAgIHdhbGtVcFRpbWVzLFxuICAgICAgb25Ib3ZlcixcbiAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKSxcbiAgICAgIFRyaWdnZXJUeXBlLlByZWZldGNoLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICBsVmlldyxcbiAgICB0Tm9kZSxcbiAgICB0cmlnZ2VySW5kZXgsXG4gICAgd2Fsa1VwVGltZXMsXG4gICAgb25JbnRlcmFjdGlvbixcbiAgICAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgIFRyaWdnZXJUeXBlLlJlZ3VsYXIsXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LFxuICAgICAgdE5vZGUsXG4gICAgICB0cmlnZ2VySW5kZXgsXG4gICAgICB3YWxrVXBUaW1lcyxcbiAgICAgIG9uSW50ZXJhY3Rpb24sXG4gICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksXG4gICAgICBUcmlnZ2VyVHlwZS5QcmVmZXRjaCxcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgbFZpZXcsXG4gICAgdE5vZGUsXG4gICAgdHJpZ2dlckluZGV4LFxuICAgIHdhbGtVcFRpbWVzLFxuICAgIG9uVmlld3BvcnQsXG4gICAgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSxcbiAgICBUcmlnZ2VyVHlwZS5SZWd1bGFyLFxuICApO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldyxcbiAgICAgIHROb2RlLFxuICAgICAgdHJpZ2dlckluZGV4LFxuICAgICAgd2Fsa1VwVGltZXMsXG4gICAgICBvblZpZXdwb3J0LFxuICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUHJlZmV0Y2gsXG4gICAgKTtcbiAgfVxufVxuXG4vKioqKioqKioqKiBIZWxwZXIgZnVuY3Rpb25zICoqKioqKioqKiovXG5cbi8qKlxuICogU2NoZWR1bGVzIHRyaWdnZXJpbmcgb2YgYSBkZWZlciBibG9jayBmb3IgYG9uIGlkbGVgIGFuZCBgb24gdGltZXJgIGNvbmRpdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIoXG4gIHNjaGVkdWxlRm46IChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcpID0+IFZvaWRGdW5jdGlvbixcbikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IGNsZWFudXBGbiA9IHNjaGVkdWxlRm4oKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSwgbFZpZXcpO1xuICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICBzdG9yZVRyaWdnZXJDbGVhbnVwRm4oVHJpZ2dlclR5cGUuUmVndWxhciwgbERldGFpbHMsIGNsZWFudXBGbik7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIHByZWZldGNoaW5nIGZvciBgb24gaWRsZWAgYW5kIGBvbiB0aW1lcmAgdHJpZ2dlcnMuXG4gKlxuICogQHBhcmFtIHNjaGVkdWxlRm4gQSBmdW5jdGlvbiB0aGF0IGRvZXMgdGhlIHNjaGVkdWxpbmcuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVsYXllZFByZWZldGNoaW5nKFxuICBzY2hlZHVsZUZuOiAoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3KSA9PiBWb2lkRnVuY3Rpb24sXG4pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHByZWZldGNoID0gKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IGNsZWFudXBGbiA9IHNjaGVkdWxlRm4ocHJlZmV0Y2gsIGxWaWV3KTtcbiAgICBzdG9yZVRyaWdnZXJDbGVhbnVwRm4oVHJpZ2dlclR5cGUuUHJlZmV0Y2gsIGxEZXRhaWxzLCBjbGVhbnVwRm4pO1xuICB9XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbnMgYSBkZWZlciBibG9jayB0byB0aGUgbmV3IHN0YXRlLiBVcGRhdGVzIHRoZSAgbmVjZXNzYXJ5XG4gKiBkYXRhIHN0cnVjdHVyZXMgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBibG9jay5cbiAqXG4gKiBAcGFyYW0gbmV3U3RhdGUgTmV3IHN0YXRlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHNraXBUaW1lclNjaGVkdWxpbmcgSW5kaWNhdGVzIHRoYXQgYEBsb2FkaW5nYCBhbmQgYEBwbGFjZWhvbGRlcmAgYmxvY2tcbiAqICAgc2hvdWxkIGJlIHJlbmRlcmVkIGltbWVkaWF0ZWx5LCBldmVuIGlmIHRoZXkgaGF2ZSBgYWZ0ZXJgIG9yIGBtaW5pbXVtYCBjb25maWdcbiAqICAgb3B0aW9ucyBzZXR1cC4gVGhpcyBmbGFnIHRvIG5lZWRlZCBmb3IgdGVzdGluZyBBUElzIHRvIHRyYW5zaXRpb24gZGVmZXIgYmxvY2tcbiAqICAgYmV0d2VlbiBzdGF0ZXMgdmlhIGBEZWZlckZpeHR1cmUucmVuZGVyYCBtZXRob2QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsXG4gIHROb2RlOiBUTm9kZSxcbiAgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgc2tpcFRpbWVyU2NoZWR1bGluZyA9IGZhbHNlLFxuKTogdm9pZCB7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGxDb250YWluZXJbUEFSRU5UXTtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcblxuICAvLyBDaGVjayBpZiB0aGlzIHZpZXcgaXMgbm90IGRlc3Ryb3llZC4gU2luY2UgdGhlIGxvYWRpbmcgcHJvY2VzcyB3YXMgYXN5bmMsXG4gIC8vIHRoZSB2aWV3IG1pZ2h0IGVuZCB1cCBiZWluZyBkZXN0cm95ZWQgYnkgdGhlIHRpbWUgcmVuZGVyaW5nIGhhcHBlbnMuXG4gIGlmIChpc0Rlc3Ryb3llZChob3N0TFZpZXcpKSByZXR1cm47XG5cbiAgLy8gTWFrZSBzdXJlIHRoaXMgVE5vZGUgYmVsb25ncyB0byBUVmlldyB0aGF0IHJlcHJlc2VudHMgaG9zdCBMVmlldy5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGhvc3RMVmlldyk7XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaG9zdExWaWV3LCB0Tm9kZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobERldGFpbHMsICdFeHBlY3RlZCBhIGRlZmVyIGJsb2NrIHN0YXRlIGRlZmluZWQnKTtcblxuICBjb25zdCBjdXJyZW50U3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG5cbiAgaWYgKFxuICAgIGlzVmFsaWRTdGF0ZUNoYW5nZShjdXJyZW50U3RhdGUsIG5ld1N0YXRlKSAmJlxuICAgIGlzVmFsaWRTdGF0ZUNoYW5nZShsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA/PyAtMSwgbmV3U3RhdGUpXG4gICkge1xuICAgIGNvbnN0IGluamVjdG9yID0gaG9zdExWaWV3W0lOSkVDVE9SXSE7XG4gICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHMoaG9zdFRWaWV3LCB0Tm9kZSk7XG4gICAgLy8gU2tpcHMgc2NoZWR1bGluZyBvbiB0aGUgc2VydmVyIHNpbmNlIGl0IGNhbiBkZWxheSB0aGUgc2VydmVyIHJlc3BvbnNlLlxuICAgIGNvbnN0IG5lZWRzU2NoZWR1bGluZyA9XG4gICAgICAhc2tpcFRpbWVyU2NoZWR1bGluZyAmJlxuICAgICAgaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpICYmXG4gICAgICAoZ2V0TG9hZGluZ0Jsb2NrQWZ0ZXIodERldGFpbHMpICE9PSBudWxsIHx8XG4gICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuTG9hZGluZykgIT09IG51bGwgfHxcbiAgICAgICAgZ2V0TWluaW11bUR1cmF0aW9uRm9yU3RhdGUodERldGFpbHMsIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikpO1xuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiBuZWVkc1NjaGVkdWxpbmcpIHtcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsLFxuICAgICAgICAnRXhwZWN0ZWQgc2NoZWR1bGluZyBmdW5jdGlvbiB0byBiZSBkZWZpbmVkJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgYXBwbHlTdGF0ZUZuID0gbmVlZHNTY2hlZHVsaW5nXG4gICAgICA/IGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsIVxuICAgICAgOiBhcHBseURlZmVyQmxvY2tTdGF0ZTtcbiAgICB0cnkge1xuICAgICAgYXBwbHlTdGF0ZUZuKG5ld1N0YXRlLCBsRGV0YWlscywgbENvbnRhaW5lciwgdE5vZGUsIGhvc3RMVmlldyk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgIGhhbmRsZUVycm9yKGhvc3RMVmlldywgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgd2hldGhlciBhbiBpbmplY3RvciBpcyBhbiBpbnN0YW5jZSBvZiBhIGBDaGFpbmVkSW5qZWN0b3JgLFxuICogY3JlYXRlZCBiYXNlZCBvbiB0aGUgYE91dGxldEluamVjdG9yYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUm91dGVyT3V0bGV0SW5qZWN0b3IoY3VycmVudEluamVjdG9yOiBJbmplY3Rvcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGN1cnJlbnRJbmplY3RvciBpbnN0YW5jZW9mIENoYWluZWRJbmplY3RvciAmJlxuICAgIHR5cGVvZiAoY3VycmVudEluamVjdG9yLmluamVjdG9yIGFzIGFueSkuX19uZ091dGxldEluamVjdG9yID09PSAnZnVuY3Rpb24nXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiB0aGUgYE91dGxldEluamVjdG9yYCB1c2luZyBhIHByaXZhdGUgZmFjdG9yeVxuICogZnVuY3Rpb24gYXZhaWxhYmxlIG9uIHRoZSBgT3V0bGV0SW5qZWN0b3JgIGNsYXNzLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRPdXRsZXRJbmplY3RvciBQYXJlbnQgT3V0bGV0SW5qZWN0b3IsIHdoaWNoIHNob3VsZCBiZSB1c2VkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gcHJvZHVjZSBhIG5ldyBpbnN0YW5jZS5cbiAqIEBwYXJhbSBwYXJlbnRJbmplY3RvciBBbiBJbmplY3Rvciwgd2hpY2ggc2hvdWxkIGJlIHVzZWQgYXMgYSBwYXJlbnQgb25lXG4gKiAgICAgICAgICAgICAgICAgICAgICAgZm9yIGEgbmV3bHkgY3JlYXRlZCBgT3V0bGV0SW5qZWN0b3JgIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBjcmVhdGVSb3V0ZXJPdXRsZXRJbmplY3RvcihcbiAgcGFyZW50T3V0bGV0SW5qZWN0b3I6IENoYWluZWRJbmplY3RvcixcbiAgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yLFxuKSB7XG4gIGNvbnN0IG91dGxldEluamVjdG9yID0gcGFyZW50T3V0bGV0SW5qZWN0b3IuaW5qZWN0b3IgYXMgYW55O1xuICByZXR1cm4gb3V0bGV0SW5qZWN0b3IuX19uZ091dGxldEluamVjdG9yKHBhcmVudEluamVjdG9yKTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGNoYW5nZXMgdG8gdGhlIERPTSB0byByZWZsZWN0IGEgZ2l2ZW4gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5RGVmZXJCbG9ja1N0YXRlKFxuICBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlLFxuICBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzLFxuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICB0Tm9kZTogVE5vZGUsXG4gIGhvc3RMVmlldzogTFZpZXc8dW5rbm93bj4sXG4pIHtcbiAgY29uc3Qgc3RhdGVUbXBsSW5kZXggPSBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUobmV3U3RhdGUsIGhvc3RMVmlldywgdE5vZGUpO1xuXG4gIGlmIChzdGF0ZVRtcGxJbmRleCAhPT0gbnVsbCkge1xuICAgIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IHN0YXRlVG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgICBjb25zdCBhY3RpdmVCbG9ja1ROb2RlID0gZ2V0VE5vZGUoaG9zdFRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcblxuICAgIC8vIFRoZXJlIGlzIG9ubHkgMSB2aWV3IHRoYXQgY2FuIGJlIHByZXNlbnQgaW4gYW4gTENvbnRhaW5lciB0aGF0XG4gICAgLy8gcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLCBzbyBhbHdheXMgcmVmZXIgdG8gdGhlIGZpcnN0IG9uZS5cbiAgICBjb25zdCB2aWV3SW5kZXggPSAwO1xuXG4gICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyLCB2aWV3SW5kZXgpO1xuXG4gICAgbGV0IGluamVjdG9yOiBJbmplY3RvciB8IHVuZGVmaW5lZDtcbiAgICBpZiAobmV3U3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSkge1xuICAgICAgLy8gV2hlbiB3ZSByZW5kZXIgYSBkZWZlciBibG9jayBpbiBjb21wbGV0ZWQgc3RhdGUsIHRoZXJlIG1pZ2h0IGJlXG4gICAgICAvLyBuZXdseSBsb2FkZWQgc3RhbmRhbG9uZSBjb21wb25lbnRzIHVzZWQgd2l0aGluIHRoZSBibG9jaywgd2hpY2ggbWF5XG4gICAgICAvLyBpbXBvcnQgTmdNb2R1bGVzIHdpdGggcHJvdmlkZXJzLiBJbiBvcmRlciB0byBtYWtlIHRob3NlIHByb3ZpZGVyc1xuICAgICAgLy8gYXZhaWxhYmxlIGZvciBjb21wb25lbnRzIGRlY2xhcmVkIGluIHRoYXQgTmdNb2R1bGUsIHdlIGNyZWF0ZSBhbiBpbnN0YW5jZVxuICAgICAgLy8gb2YgZW52aXJvbm1lbnQgaW5qZWN0b3IgdG8gaG9zdCB0aG9zZSBwcm92aWRlcnMgYW5kIHBhc3MgdGhpcyBpbmplY3RvclxuICAgICAgLy8gdG8gdGhlIGxvZ2ljIHRoYXQgY3JlYXRlcyBhIHZpZXcuXG4gICAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyhob3N0VFZpZXcsIHROb2RlKTtcbiAgICAgIGNvbnN0IHByb3ZpZGVycyA9IHREZXRhaWxzLnByb3ZpZGVycztcbiAgICAgIGlmIChwcm92aWRlcnMgJiYgcHJvdmlkZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBob3N0TFZpZXdbSU5KRUNUT1JdIGFzIEluamVjdG9yO1xuXG4gICAgICAgIC8vIE5vdGU6IHdlIGhhdmUgYSBzcGVjaWFsIGNhc2UgZm9yIFJvdXRlcidzIGBPdXRsZXRJbmplY3RvcmAsXG4gICAgICAgIC8vIHNpbmNlIGl0J3Mgbm90IGFuIGluc3RhbmNlIG9mIHRoZSBgRW52aXJvbm1lbnRJbmplY3RvcmAsIHNvXG4gICAgICAgIC8vIHdlIGNhbid0IGluamVjdCBpdC4gT25jZSB0aGUgYE91dGxldEluamVjdG9yYCBpcyByZXBsYWNlZFxuICAgICAgICAvLyB3aXRoIHRoZSBgRW52aXJvbm1lbnRJbmplY3RvcmAgaW4gUm91dGVyJ3MgY29kZSwgdGhpcyBzcGVjaWFsXG4gICAgICAgIC8vIGhhbmRsaW5nIGNhbiBiZSByZW1vdmVkLlxuICAgICAgICBjb25zdCBpc1BhcmVudE91dGxldEluamVjdG9yID0gaXNSb3V0ZXJPdXRsZXRJbmplY3RvcihwYXJlbnRJbmplY3Rvcik7XG4gICAgICAgIGNvbnN0IHBhcmVudEVudkluamVjdG9yID0gaXNQYXJlbnRPdXRsZXRJbmplY3RvclxuICAgICAgICAgID8gcGFyZW50SW5qZWN0b3JcbiAgICAgICAgICA6IHBhcmVudEluamVjdG9yLmdldChFbnZpcm9ubWVudEluamVjdG9yKTtcblxuICAgICAgICBpbmplY3RvciA9IHBhcmVudEVudkluamVjdG9yXG4gICAgICAgICAgLmdldChDYWNoZWRJbmplY3RvclNlcnZpY2UpXG4gICAgICAgICAgLmdldE9yQ3JlYXRlSW5qZWN0b3IoXG4gICAgICAgICAgICB0RGV0YWlscyxcbiAgICAgICAgICAgIHBhcmVudEVudkluamVjdG9yIGFzIEVudmlyb25tZW50SW5qZWN0b3IsXG4gICAgICAgICAgICBwcm92aWRlcnMsXG4gICAgICAgICAgICBuZ0Rldk1vZGUgPyAnRGVmZXJCbG9jayBJbmplY3RvcicgOiAnJyxcbiAgICAgICAgICApO1xuXG4gICAgICAgIC8vIE5vdGU6IHRoaXMgaXMgYSBjb250aW51YXRpb24gb2YgdGhlIHNwZWNpYWwgY2FzZSBmb3IgUm91dGVyJ3MgYE91dGxldEluamVjdG9yYC5cbiAgICAgICAgLy8gU2luY2UgdGhlIGBPdXRsZXRJbmplY3RvcmAgaGFuZGxlcyBgQWN0aXZhdGVkUm91dGVgIGFuZCBgQ2hpbGRyZW5PdXRsZXRDb250ZXh0c2BcbiAgICAgICAgLy8gZHluYW1pY2FsbHkgKGkuZS4gdGhlaXIgdmFsdWVzIGFyZSBub3QgcmVhbGx5IHN0b3JlZCBzdGF0aWNhbGx5IGluIGFuIGluamVjdG9yKSxcbiAgICAgICAgLy8gd2UgbmVlZCB0byBcIndyYXBcIiBhIGRlZmVyIGluamVjdG9yIGludG8gYW5vdGhlciBgT3V0bGV0SW5qZWN0b3JgLCBzbyB3ZSByZXRhaW5cbiAgICAgICAgLy8gdGhlIGR5bmFtaWMgcmVzb2x1dGlvbiBvZiB0aGUgbWVudGlvbmVkIHRva2Vucy5cbiAgICAgICAgaWYgKGlzUGFyZW50T3V0bGV0SW5qZWN0b3IpIHtcbiAgICAgICAgICBpbmplY3RvciA9IGNyZWF0ZVJvdXRlck91dGxldEluamVjdG9yKHBhcmVudEluamVjdG9yIGFzIENoYWluZWRJbmplY3RvciwgaW5qZWN0b3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcobENvbnRhaW5lciwgYWN0aXZlQmxvY2tUTm9kZS50VmlldyEuc3NySWQpO1xuICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KGhvc3RMVmlldywgYWN0aXZlQmxvY2tUTm9kZSwgbnVsbCwge1xuICAgICAgZGVoeWRyYXRlZFZpZXcsXG4gICAgICBpbmplY3RvcixcbiAgICB9KTtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgIGxDb250YWluZXIsXG4gICAgICBlbWJlZGRlZExWaWV3LFxuICAgICAgdmlld0luZGV4LFxuICAgICAgc2hvdWxkQWRkVmlld1RvRG9tKGFjdGl2ZUJsb2NrVE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSxcbiAgICApO1xuICAgIG1hcmtWaWV3RGlydHkoZW1iZWRkZWRMVmlldywgTm90aWZpY2F0aW9uU291cmNlLkRlZmVyQmxvY2tTdGF0ZVVwZGF0ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRlbmRzIHRoZSBgYXBwbHlEZWZlckJsb2NrU3RhdGVgIHdpdGggdGltZXItYmFzZWQgc2NoZWR1bGluZy5cbiAqIFRoaXMgZnVuY3Rpb24gYmVjb21lcyBhdmFpbGFibGUgb24gYSBwYWdlIGlmIHRoZXJlIGFyZSBkZWZlciBibG9ja3NcbiAqIHRoYXQgdXNlIGBhZnRlcmAgb3IgYG1pbmltdW1gIHBhcmFtZXRlcnMgaW4gdGhlIGBAbG9hZGluZ2Agb3JcbiAqIGBAcGxhY2Vob2xkZXJgIGJsb2Nrcy5cbiAqL1xuZnVuY3Rpb24gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZyhcbiAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSxcbiAgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscyxcbiAgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgdE5vZGU6IFROb2RlLFxuICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+LFxuKSB7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKGhvc3RUVmlldywgdE5vZGUpO1xuXG4gIGlmIChsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdID09PSBudWxsIHx8IGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPD0gbm93KSB7XG4gICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG51bGw7XG5cbiAgICBjb25zdCBsb2FkaW5nQWZ0ZXIgPSBnZXRMb2FkaW5nQmxvY2tBZnRlcih0RGV0YWlscyk7XG4gICAgY29uc3QgaW5Mb2FkaW5nQWZ0ZXJQaGFzZSA9IGxEZXRhaWxzW0xPQURJTkdfQUZURVJfQ0xFQU5VUF9GTl0gIT09IG51bGw7XG4gICAgaWYgKG5ld1N0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZyAmJiBsb2FkaW5nQWZ0ZXIgIT09IG51bGwgJiYgIWluTG9hZGluZ0FmdGVyUGhhc2UpIHtcbiAgICAgIC8vIFRyeWluZyB0byByZW5kZXIgbG9hZGluZywgYnV0IGl0IGhhcyBhbiBgYWZ0ZXJgIGNvbmZpZyxcbiAgICAgIC8vIHNvIHNjaGVkdWxlIGFuIHVwZGF0ZSBhY3Rpb24gYWZ0ZXIgYSB0aW1lb3V0LlxuICAgICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHNjaGVkdWxlRGVmZXJCbG9ja1VwZGF0ZShcbiAgICAgICAgbG9hZGluZ0FmdGVyLFxuICAgICAgICBsRGV0YWlscyxcbiAgICAgICAgdE5vZGUsXG4gICAgICAgIGxDb250YWluZXIsXG4gICAgICAgIGhvc3RMVmlldyxcbiAgICAgICk7XG4gICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dID0gY2xlYW51cEZuO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSB0cmFuc2l0aW9uIHRvIGEgY29tcGxldGUgb3IgYW4gZXJyb3Igc3RhdGUgYW5kIHRoZXJlIGlzIGEgcGVuZGluZ1xuICAgICAgLy8gb3BlcmF0aW9uIHRvIHJlbmRlciBsb2FkaW5nIGFmdGVyIGEgdGltZW91dCAtIGludm9rZSBhIGNsZWFudXAgb3BlcmF0aW9uLFxuICAgICAgLy8gd2hpY2ggc3RvcHMgdGhlIHRpbWVyLlxuICAgICAgaWYgKG5ld1N0YXRlID4gRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcgJiYgaW5Mb2FkaW5nQWZ0ZXJQaGFzZSkge1xuICAgICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dISgpO1xuICAgICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dID0gbnVsbDtcbiAgICAgICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBhcHBseURlZmVyQmxvY2tTdGF0ZShuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xuXG4gICAgICBjb25zdCBkdXJhdGlvbiA9IGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBuZXdTdGF0ZSk7XG4gICAgICBpZiAoZHVyYXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG5vdyArIGR1cmF0aW9uO1xuICAgICAgICBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUoZHVyYXRpb24sIGxEZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lciwgaG9zdExWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIHN0aWxsIHJlbmRlcmluZyB0aGUgcHJldmlvdXMgc3RhdGUuXG4gICAgLy8gVXBkYXRlIHRoZSBgTkVYVF9ERUZFUl9CTE9DS19TVEFURWAsIHdoaWNoIHdvdWxkIGJlXG4gICAgLy8gcGlja2VkIHVwIG9uY2UgaXQncyB0aW1lIHRvIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUuXG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhbiB1cGRhdGUgb3BlcmF0aW9uIGFmdGVyIGEgc3BlY2lmaWVkIHRpbWVvdXQuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVmZXJCbG9ja1VwZGF0ZShcbiAgdGltZW91dDogbnVtYmVyLFxuICBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzLFxuICB0Tm9kZTogVE5vZGUsXG4gIGxDb250YWluZXI6IExDb250YWluZXIsXG4gIGhvc3RMVmlldzogTFZpZXc8dW5rbm93bj4sXG4pOiBWb2lkRnVuY3Rpb24ge1xuICBjb25zdCBjYWxsYmFjayA9ICgpID0+IHtcbiAgICBjb25zdCBuZXh0U3RhdGUgPSBsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdID0gbnVsbDtcbiAgICBsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA9IG51bGw7XG4gICAgaWYgKG5leHRTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKG5leHRTdGF0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHNjaGVkdWxlVGltZXJUcmlnZ2VyKHRpbWVvdXQsIGNhbGxiYWNrLCBob3N0TFZpZXcpO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHdlIGNhbiB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlLlxuICpcbiAqIFdlIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUgaWYgdGhlIHByZXZpb3VzIHN0YXRlIHdhcyByZXByZXNlbnRlZFxuICogd2l0aCBhIG51bWJlciB0aGF0IGlzIGxlc3MgdGhhbiB0aGUgbmV4dCBzdGF0ZS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjdXJyZW50XG4gKiBzdGF0ZSBpcyBcImxvYWRpbmdcIiAocmVwcmVzZW50ZWQgYXMgYDFgKSwgd2Ugc2hvdWxkIG5vdCBzaG93IGEgcGxhY2Vob2xkZXJcbiAqIChyZXByZXNlbnRlZCBhcyBgMGApLCBidXQgd2UgY2FuIHNob3cgYSBjb21wbGV0ZWQgc3RhdGUgKHJlcHJlc2VudGVkIGFzIGAyYClcbiAqIG9yIGFuIGVycm9yIHN0YXRlIChyZXByZXNlbnRlZCBhcyBgM2ApLlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkU3RhdGVDaGFuZ2UoXG4gIGN1cnJlbnRTdGF0ZTogRGVmZXJCbG9ja1N0YXRlIHwgRGVmZXJCbG9ja0ludGVybmFsU3RhdGUsXG4gIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGN1cnJlbnRTdGF0ZSA8IG5ld1N0YXRlO1xufVxuXG4vKipcbiAqIFRyaWdnZXIgcHJlZmV0Y2hpbmcgb2YgZGVwZW5kZW5jaWVzIGZvciBhIGRlZmVyIGJsb2NrLlxuICpcbiAqIEBwYXJhbSB0RGV0YWlscyBTdGF0aWMgaW5mb3JtYXRpb24gYWJvdXQgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyBvZiBhIGhvc3Qgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBpZiAobFZpZXdbSU5KRUNUT1JdICYmIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGxWaWV3W0lOSkVDVE9SXSEpKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyaWdnZXIgbG9hZGluZyBvZiBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgaWYgdGhlIHByb2Nlc3MgaGFzbid0IHN0YXJ0ZWQgeWV0LlxuICpcbiAqIEBwYXJhbSB0RGV0YWlscyBTdGF0aWMgaW5mb3JtYXRpb24gYWJvdXQgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyBvZiBhIGhvc3Qgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcoXG4gIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsXG4gIGxWaWV3OiBMVmlldyxcbiAgdE5vZGU6IFROb2RlLFxuKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSAhPT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBJZiB0aGUgbG9hZGluZyBzdGF0dXMgaXMgZGlmZmVyZW50IGZyb20gaW5pdGlhbCBvbmUsIGl0IG1lYW5zIHRoYXRcbiAgICAvLyB0aGUgbG9hZGluZyBvZiBkZXBlbmRlbmNpZXMgaXMgaW4gcHJvZ3Jlc3MgYW5kIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG9cbiAgICAvLyBpbiB0aGlzIGZ1bmN0aW9uLiBBbGwgZGV0YWlscyBjYW4gYmUgb2J0YWluZWQgZnJvbSB0aGUgYHREZXRhaWxzYCBvYmplY3QuXG4gICAgcmV0dXJuIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlID8/IFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgY29uc3QgcHJpbWFyeUJsb2NrVE5vZGUgPSBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldywgdERldGFpbHMpO1xuXG4gIC8vIFN3aXRjaCBmcm9tIE5PVF9TVEFSVEVEIC0+IElOX1BST0dSRVNTIHN0YXRlLlxuICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUztcblxuICAvLyBQcmVmZXRjaGluZyBpcyB0cmlnZ2VyZWQsIGNsZWFudXAgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggdHJpZ2dlcnMuXG4gIGludm9rZVRyaWdnZXJDbGVhbnVwRm5zKFRyaWdnZXJUeXBlLlByZWZldGNoLCBsRGV0YWlscyk7XG5cbiAgbGV0IGRlcGVuZGVuY2llc0ZuID0gdERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm47XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgICBjb25zdCBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA9IGluamVjdG9yLmdldChERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SLCBudWxsLCB7XG4gICAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGlmIChkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvcikge1xuICAgICAgZGVwZW5kZW5jaWVzRm4gPSBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvci5pbnRlcmNlcHQoZGVwZW5kZW5jaWVzRm4pO1xuICAgIH1cbiAgfVxuXG4gIC8vIEluZGljYXRlIHRoYXQgYW4gYXBwbGljYXRpb24gaXMgbm90IHN0YWJsZSBhbmQgaGFzIGEgcGVuZGluZyB0YXNrLlxuICBjb25zdCBwZW5kaW5nVGFza3MgPSBpbmplY3Rvci5nZXQoUGVuZGluZ1Rhc2tzKTtcbiAgY29uc3QgdGFza0lkID0gcGVuZGluZ1Rhc2tzLmFkZCgpO1xuXG4gIC8vIFRoZSBgZGVwZW5kZW5jaWVzRm5gIG1pZ2h0IGJlIGBudWxsYCB3aGVuIGFsbCBkZXBlbmRlbmNpZXMgd2l0aGluXG4gIC8vIGEgZ2l2ZW4gZGVmZXIgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZWQgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgICBwZW5kaW5nVGFza3MucmVtb3ZlKHRhc2tJZCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlO1xuICB9XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgbGV0IGZhaWxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZnM6IERpcmVjdGl2ZURlZkxpc3QgPSBbXTtcbiAgICBjb25zdCBwaXBlRGVmczogUGlwZURlZkxpc3QgPSBbXTtcblxuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuICAgICAgICBjb25zdCBkZXBlbmRlbmN5ID0gcmVzdWx0LnZhbHVlO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBnZXRDb21wb25lbnREZWYoZGVwZW5kZW5jeSkgfHwgZ2V0RGlyZWN0aXZlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICBpZiAoZGlyZWN0aXZlRGVmKSB7XG4gICAgICAgICAgZGlyZWN0aXZlRGVmcy5wdXNoKGRpcmVjdGl2ZURlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcGlwZURlZiA9IGdldFBpcGVEZWYoZGVwZW5kZW5jeSk7XG4gICAgICAgICAgaWYgKHBpcGVEZWYpIHtcbiAgICAgICAgICAgIHBpcGVEZWZzLnB1c2gocGlwZURlZik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMb2FkaW5nIGlzIGNvbXBsZXRlZCwgd2Ugbm8gbG9uZ2VyIG5lZWQgdGhlIGxvYWRpbmcgUHJvbWlzZVxuICAgIC8vIGFuZCBhIHBlbmRpbmcgdGFzayBzaG91bGQgYWxzbyBiZSByZW1vdmVkLlxuICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlID0gbnVsbDtcbiAgICBwZW5kaW5nVGFza3MucmVtb3ZlKHRhc2tJZCk7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG5cbiAgICAgIGlmICh0RGV0YWlscy5lcnJvclRtcGxJbmRleCA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZUxvY2F0aW9uID0gZ2V0VGVtcGxhdGVMb2NhdGlvbkRldGFpbHMobFZpZXcpO1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5ERUZFUl9MT0FESU5HX0ZBSUxFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICdMb2FkaW5nIGRlcGVuZGVuY2llcyBmb3IgYEBkZWZlcmAgYmxvY2sgZmFpbGVkLCAnICtcbiAgICAgICAgICAgICAgYGJ1dCBubyBcXGBAZXJyb3JcXGAgYmxvY2sgd2FzIGNvbmZpZ3VyZWQke3RlbXBsYXRlTG9jYXRpb259LiBgICtcbiAgICAgICAgICAgICAgJ0NvbnNpZGVyIHVzaW5nIHRoZSBgQGVycm9yYCBibG9jayB0byByZW5kZXIgYW4gZXJyb3Igc3RhdGUuJyxcbiAgICAgICAgKTtcbiAgICAgICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG5cbiAgICAgIC8vIFVwZGF0ZSBkaXJlY3RpdmUgYW5kIHBpcGUgcmVnaXN0cmllcyB0byBhZGQgbmV3bHkgZG93bmxvYWRlZCBkZXBlbmRlbmNpZXMuXG4gICAgICBjb25zdCBwcmltYXJ5QmxvY2tUVmlldyA9IHByaW1hcnlCbG9ja1ROb2RlLnRWaWV3ITtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnkgPSBhZGREZXBzVG9SZWdpc3RyeTxEaXJlY3RpdmVEZWZMaXN0PihcbiAgICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSxcbiAgICAgICAgICBkaXJlY3RpdmVEZWZzLFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEV4dHJhY3QgcHJvdmlkZXJzIGZyb20gYWxsIE5nTW9kdWxlcyBpbXBvcnRlZCBieSBzdGFuZGFsb25lIGNvbXBvbmVudHNcbiAgICAgICAgLy8gdXNlZCB3aXRoaW4gdGhpcyBkZWZlciBibG9jay5cbiAgICAgICAgY29uc3QgZGlyZWN0aXZlVHlwZXMgPSBkaXJlY3RpdmVEZWZzLm1hcCgoZGVmKSA9PiBkZWYudHlwZSk7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVycyA9IGludGVybmFsSW1wb3J0UHJvdmlkZXJzRnJvbShmYWxzZSwgLi4uZGlyZWN0aXZlVHlwZXMpO1xuICAgICAgICB0RGV0YWlscy5wcm92aWRlcnMgPSBwcm92aWRlcnM7XG4gICAgICB9XG4gICAgICBpZiAocGlwZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnkgPSBhZGREZXBzVG9SZWdpc3RyeTxQaXBlRGVmTGlzdD4oXG4gICAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5LFxuICAgICAgICAgIHBpcGVEZWZzLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZTtcbn1cblxuLyoqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVuZGVyIHBsYWNlaG9sZGVyIGNvbnRlbnQgKGlmIHByZXNlbnQpICovXG5mdW5jdGlvbiByZW5kZXJQbGFjZWhvbGRlcihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLCB0Tm9kZSwgbENvbnRhaW5lcik7XG59XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgXCJsb2FkaW5nXCIgUHJvbWlzZSBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGRlZmVyIHN1Yi1ibG9jayxcbiAqIGJhc2VkIG9uIHRoZSBsb2FkaW5nIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFJlcHJlc2VudHMgZGVmZXIgYmxvY2sgaW5mbyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyhcbiAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscyxcbiAgdE5vZGU6IFROb2RlLFxuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydERlZmluZWQodERldGFpbHMubG9hZGluZ1Byb21pc2UsICdFeHBlY3RlZCBsb2FkaW5nIFByb21pc2UgdG8gZXhpc3Qgb24gdGhpcyBkZWZlciBibG9jaycpO1xuXG4gIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlIS50aGVuKCgpID0+IHtcbiAgICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcblxuICAgICAgLy8gRXZlcnl0aGluZyBpcyBsb2FkZWQsIHNob3cgdGhlIHByaW1hcnkgYmxvY2sgY29udGVudFxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHRyaWdnZXIgbG9hZGluZyBvZiBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMuXG4gKiBJZiB0aGUgYmxvY2sgaXMgYWxyZWFkeSBpbiBhIGxvYWRpbmcsIGNvbXBsZXRlZCBvciBhbiBlcnJvciBzdGF0ZSAtXG4gKiBubyBhZGRpdGlvbmFsIGFjdGlvbnMgYXJlIHRha2VuLlxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICBpZiAoIXNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gRGVmZXIgYmxvY2sgaXMgdHJpZ2dlcmVkLCBjbGVhbnVwIGFsbCByZWdpc3RlcmVkIHRyaWdnZXIgZnVuY3Rpb25zLlxuICBpbnZva2VBbGxUcmlnZ2VyQ2xlYW51cEZucyhsRGV0YWlscyk7XG5cbiAgc3dpdGNoICh0RGV0YWlscy5sb2FkaW5nU3RhdGUpIHtcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuXG4gICAgICAvLyBUaGUgYGxvYWRpbmdTdGF0ZWAgbWlnaHQgaGF2ZSBjaGFuZ2VkIHRvIFwibG9hZGluZ1wiLlxuICAgICAgaWYgKFxuICAgICAgICAodERldGFpbHMubG9hZGluZ1N0YXRlIGFzIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlKSA9PT1cbiAgICAgICAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1NcbiAgICAgICkge1xuICAgICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTpcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRDpcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIHRocm93RXJyb3IoJ1Vua25vd24gZGVmZXIgYmxvY2sgc3RhdGUnKTtcbiAgICAgIH1cbiAgfVxufVxuIl19