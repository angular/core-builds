/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di';
import { RuntimeError } from '../errors';
import { findMatchingDehydratedView } from '../hydration/views';
import { populateDehydratedViewsInLContainer } from '../linker/view_container_ref';
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
import { invokeAllTriggerCleanupFns, invokeTriggerCleanupFns, storeTriggerCleanupFn } from './cleanup';
import { onHover, onInteraction, onViewport, registerDomTrigger } from './dom_triggers';
import { onIdle } from './idle_scheduler';
import { DEFER_BLOCK_STATE, DeferBlockBehavior, DeferBlockInternalState, DeferBlockState, DeferDependenciesLoadingState, LOADING_AFTER_CLEANUP_FN, NEXT_DEFER_BLOCK_STATE, STATE_IS_FROZEN_UNTIL } from './interfaces';
import { onTimer, scheduleTimerTrigger } from './timer_scheduler';
import { addDepsToRegistry, assertDeferredDependenciesLoaded, getLDeferBlockDetails, getLoadingBlockAfter, getMinimumDurationForState, getPrimaryBlockTNode, getTDeferBlockDetails, getTemplateIndexForState, setLDeferBlockDetails, setTDeferBlockDetails } from './utils';
/**
 * **INTERNAL**, avoid referencing it in application code.
 *
 * Injector token that allows to provide `DeferBlockDependencyInterceptor` class
 * implementation.
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
        performance.mark('mark_use_counter', { detail: { feature: 'NgDefer' } });
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
        null,
        DeferBlockInternalState.Initial,
        null,
        null,
        null,
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
            triggerPrefetching(tDetails, lView, tNode);
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
    // The `dependenciesFn` might be `null` when all dependencies within
    // a given defer block were eagerly references elsewhere in a file,
    // thus no dynamic `import()`s were produced.
    if (!dependenciesFn) {
        tDetails.loadingPromise = Promise.resolve().then(() => {
            tDetails.loadingState = DeferDependenciesLoadingState.COMPLETE;
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
        // Loading is completed, we no longer need this Promise.
        tDetails.loadingPromise = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQVcsTUFBTSxPQUFPLENBQUM7QUFDL0MsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDOUQsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDakYsT0FBTyxFQUFDLGdCQUFnQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDeEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ25GLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLDRDQUE0QyxDQUFDO0FBQ3RGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx5Q0FBeUMsQ0FBQztBQUN0RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDM0QsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBSTVELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM5RCxPQUFPLEVBQUMsYUFBYSxFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQUUsS0FBSyxFQUFRLE1BQU0sNEJBQTRCLENBQUM7QUFDaEcsT0FBTyxFQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDekcsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM1RyxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsNEJBQTRCLEVBQUUseUJBQXlCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUMvSSxPQUFPLEVBQUMsYUFBYSxFQUFFLFVBQVUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXpELE9BQU8sRUFBQywwQkFBMEIsRUFBRSx1QkFBdUIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRyxPQUFPLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixFQUFxRCx1QkFBdUIsRUFBRSxlQUFlLEVBQUUsNkJBQTZCLEVBQXdHLHdCQUF3QixFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFrQyxNQUFNLGNBQWMsQ0FBQztBQUMvWSxPQUFPLEVBQUMsT0FBTyxFQUFFLG9CQUFvQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGdDQUFnQyxFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLDBCQUEwQixFQUFFLG9CQUFvQixFQUFFLHFCQUFxQixFQUFFLHdCQUF3QixFQUFFLHFCQUFxQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTFROzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sa0NBQWtDLEdBQzNDLElBQUksY0FBYyxDQUFrQyxvQ0FBb0MsQ0FBQyxDQUFDO0FBRTlGOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQzNCLElBQUksY0FBYyxDQUFtQixTQUFTLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUVoRjs7Ozs7R0FLRztBQUNILFNBQVMsdUJBQXVCLENBQUMsUUFBa0I7SUFDakQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUN4RSxJQUFJLE1BQU0sRUFBRSxRQUFRLEtBQUssa0JBQWtCLENBQUMsTUFBTSxFQUFFO1FBQ2xELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxJQUFJLHNDQUFzQyxHQUF1QyxJQUFJLENBQUM7QUFFdEY7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUN4QyxLQUFZLEVBQUUsUUFBNEIsRUFBRSxzQkFBb0MsRUFDaEYsa0JBQWdDO0lBQ2xDLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsSUFBSSxzQkFBc0IsSUFBSSxJQUFJLEVBQUU7UUFDbEMsUUFBUSxDQUFDLHNCQUFzQjtZQUMzQixXQUFXLENBQWlDLFdBQVcsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0tBQ3RGO0lBQ0QsSUFBSSxrQkFBa0IsSUFBSSxJQUFJLEVBQUU7UUFDOUIsUUFBUSxDQUFDLGtCQUFrQjtZQUN2QixXQUFXLENBQTZCLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0tBQzlFO0lBRUQsOERBQThEO0lBQzlELElBQUksc0NBQXNDLEtBQUssSUFBSSxFQUFFO1FBQ25ELHNDQUFzQyxHQUFHLGtDQUFrQyxDQUFDO0tBQzdFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUNILE1BQU0sVUFBVSxPQUFPLENBQ25CLEtBQWEsRUFBRSxnQkFBd0IsRUFBRSxvQkFBZ0QsRUFDekYsZ0JBQThCLEVBQUUsb0JBQWtDLEVBQ2xFLGNBQTRCLEVBQUUsa0JBQWdDLEVBQzlELHNCQUFvQyxFQUNwQyxxQkFBMkQ7SUFDN0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxhQUFhLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBQztJQUU1QyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFOUIsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1FBQ3pCLFdBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBQyxNQUFNLEVBQUUsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFDLEVBQUMsQ0FBQyxDQUFDO1FBRXJFLE1BQU0sUUFBUSxHQUF1QjtZQUNuQyxnQkFBZ0I7WUFDaEIsZ0JBQWdCLEVBQUUsZ0JBQWdCLElBQUksSUFBSTtZQUMxQyxvQkFBb0IsRUFBRSxvQkFBb0IsSUFBSSxJQUFJO1lBQ2xELGNBQWMsRUFBRSxjQUFjLElBQUksSUFBSTtZQUN0QyxzQkFBc0IsRUFBRSxJQUFJO1lBQzVCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsb0JBQW9CLEVBQUUsb0JBQW9CLElBQUksSUFBSTtZQUNsRCxZQUFZLEVBQUUsNkJBQTZCLENBQUMsV0FBVztZQUN2RCxjQUFjLEVBQUUsSUFBSTtTQUNyQixDQUFDO1FBQ0YscUJBQXFCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDckYscUJBQXFCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN2RDtJQUVELE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUV4QyxnRUFBZ0U7SUFDaEUsd0VBQXdFO0lBQ3hFLGdEQUFnRDtJQUNoRCxtQ0FBbUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTlELHFEQUFxRDtJQUNyRCxNQUFNLFFBQVEsR0FBdUI7UUFDbkMsSUFBSTtRQUNKLHVCQUF1QixDQUFDLE9BQU87UUFDL0IsSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSSxDQUE4QiwrQkFBK0I7S0FDbEUsQ0FBQztJQUNGLHFCQUFxQixDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFdEQsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUVyRSwwRUFBMEU7SUFDMUUscUJBQXFCLDhCQUNJLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQ3pGLG1CQUFtQixDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLFFBQWlCO0lBQzNDLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDeEMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsRUFBRTtRQUNqRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBRSxnQ0FBZ0M7UUFDbEUsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztRQUNqQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDbEQsSUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJLGFBQWEsS0FBSyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUU7WUFDeEUsaUVBQWlFO1lBQ2pFLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNqQzthQUFNLElBQ0gsS0FBSyxLQUFLLElBQUk7WUFDZCxDQUFDLGFBQWEsS0FBSyx1QkFBdUIsQ0FBQyxPQUFPO2dCQUNqRCxhQUFhLEtBQUssZUFBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ25ELDBFQUEwRTtZQUMxRSwyRUFBMkU7WUFDM0UsU0FBUztZQUNULGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNqQztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxRQUFpQjtJQUNuRCxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLFlBQVksR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBRXhDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDakQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsZ0NBQWdDO1FBQ2xFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQixNQUFNLEtBQUssR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ2pDLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7WUFDekYsdURBQXVEO1lBQ3ZELGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDNUM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsYUFBYTtJQUMzQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELG1FQUFtRTtJQUNuRSxzRUFBc0U7SUFDdEUsd0JBQXdCO0lBQ3hCLElBQUksUUFBUSxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtRQUN0QyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDakM7SUFDRCxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbEMsQ0FBQztBQUdEOzs7R0FHRztBQUNILE1BQU0sVUFBVSwwQkFBMEI7SUFDeEMsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1FBQ3ZFLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDaEQ7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBYTtJQUMxQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxLQUFhO0lBQ2xELDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsWUFBb0IsRUFBRSxXQUFvQjtJQUN2RSxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUVqQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEMsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLDhCQUNuRSxDQUFDO0FBQzNCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxZQUFvQixFQUFFLFdBQW9CO0lBQy9FLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckQsSUFBSSxRQUFRLENBQUMsWUFBWSxLQUFLLDZCQUE2QixDQUFDLFdBQVcsRUFBRTtRQUN2RSxrQkFBa0IsQ0FDZCxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUNoRCxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQywrQkFBdUIsQ0FBQztLQUM3RTtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxZQUFvQixFQUFFLFdBQW9CO0lBQzdFLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLE1BQU0sS0FBSyxHQUFHLGVBQWUsRUFBRyxDQUFDO0lBRWpDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoQyxrQkFBa0IsQ0FDZCxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsOEJBQ3pFLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDckYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1FBQ3ZFLGtCQUFrQixDQUNkLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQ3RELEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLCtCQUF1QixDQUFDO0tBQzdFO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFlBQW9CLEVBQUUsV0FBb0I7SUFDMUUsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFFakMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLGtCQUFrQixDQUNkLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyw4QkFDdEUsQ0FBQztBQUMzQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsWUFBb0IsRUFBRSxXQUFvQjtJQUNsRixNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDdkUsa0JBQWtCLENBQ2QsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFDbkQsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsK0JBQXVCLENBQUM7S0FDN0U7QUFDSCxDQUFDO0FBRUQsd0NBQXdDO0FBRXhDOztHQUVHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FDM0IsVUFBa0U7SUFDcEUsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFFakMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0UsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JELHFCQUFxQiw4QkFBc0IsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUywwQkFBMEIsQ0FDL0IsVUFBa0U7SUFDcEUsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFHLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1FBQ3ZFLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRCxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUMscUJBQXFCLCtCQUF1QixRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDbEU7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLFFBQXlCLEVBQUUsS0FBWSxFQUFFLFVBQXNCLEVBQy9ELG1CQUFtQixHQUFHLEtBQUs7SUFDN0IsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVuQyw0RUFBNEU7SUFDNUUsdUVBQXVFO0lBQ3ZFLElBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQztRQUFFLE9BQU87SUFFbkMsb0VBQW9FO0lBQ3BFLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFbkQsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXpELFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLHNDQUFzQyxDQUFDLENBQUM7SUFFN0UsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFakQsSUFBSSxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDO1FBQzFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1FBQ3hFLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxNQUFNLGVBQWUsR0FBRyxDQUFDLG1CQUFtQjtZQUN4QyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUk7Z0JBQ3ZDLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSTtnQkFDdEUsMEJBQTBCLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXhFLElBQUksU0FBUyxJQUFJLGVBQWUsRUFBRTtZQUNoQyxhQUFhLENBQ1Qsc0NBQXNDLEVBQUUsNENBQTRDLENBQUMsQ0FBQztTQUMzRjtRQUVELE1BQU0sWUFBWSxHQUNkLGVBQWUsQ0FBQyxDQUFDLENBQUMsc0NBQXVDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDO1FBQ3JGLElBQUk7WUFDRixZQUFZLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ2hFO1FBQUMsT0FBTyxLQUFjLEVBQUU7WUFDdkIsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMvQjtLQUNGO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsUUFBeUIsRUFBRSxRQUE0QixFQUFFLFVBQXNCLEVBQUUsS0FBWSxFQUM3RixTQUF5QjtJQUMzQixNQUFNLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTVFLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtRQUMzQixRQUFRLENBQUMsaUJBQWlCLENBQUMsR0FBRyxRQUFRLENBQUM7UUFDdkMsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLE1BQU0sYUFBYSxHQUFHLGNBQWMsR0FBRyxhQUFhLENBQUM7UUFDckQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQW1CLENBQUM7UUFFbkUsaUVBQWlFO1FBQ2pFLDhEQUE4RDtRQUM5RCxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFcEIseUJBQXlCLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sY0FBYyxHQUFHLDBCQUEwQixDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsS0FBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xGLE1BQU0sYUFBYSxHQUFHLDRCQUE0QixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQztRQUM3RixvQkFBb0IsQ0FDaEIsVUFBVSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDckYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQzlCO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyxrQ0FBa0MsQ0FDdkMsUUFBeUIsRUFBRSxRQUE0QixFQUFFLFVBQXNCLEVBQUUsS0FBWSxFQUM3RixTQUF5QjtJQUMzQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDdkIsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV6RCxJQUFJLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLElBQUksSUFBSSxRQUFRLENBQUMscUJBQXFCLENBQUMsSUFBSSxHQUFHLEVBQUU7UUFDdEYsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxDQUFDO1FBRXZDLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLHdCQUF3QixDQUFDLEtBQUssSUFBSSxDQUFDO1FBQ3hFLElBQUksUUFBUSxLQUFLLGVBQWUsQ0FBQyxPQUFPLElBQUksWUFBWSxLQUFLLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO1lBQ3pGLDBEQUEwRDtZQUMxRCxnREFBZ0Q7WUFDaEQsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsUUFBUSxDQUFDO1lBQzVDLE1BQU0sU0FBUyxHQUNYLHdCQUF3QixDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNuRixRQUFRLENBQUMsd0JBQXdCLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDaEQ7YUFBTTtZQUNMLDBFQUEwRTtZQUMxRSw0RUFBNEU7WUFDNUUseUJBQXlCO1lBQ3pCLElBQUksUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLElBQUksbUJBQW1CLEVBQUU7Z0JBQzdELFFBQVEsQ0FBQyx3QkFBd0IsQ0FBRSxFQUFFLENBQUM7Z0JBQ3RDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDMUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsSUFBSSxDQUFDO2FBQ3pDO1lBRUQsb0JBQW9CLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sUUFBUSxHQUFHLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNoRSxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7Z0JBQ3JCLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUM7Z0JBQ2pELHdCQUF3QixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQzthQUM1RTtTQUNGO0tBQ0Y7U0FBTTtRQUNMLDZDQUE2QztRQUM3QyxzREFBc0Q7UUFDdEQsNERBQTREO1FBQzVELFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLFFBQVEsQ0FBQztLQUM3QztBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsd0JBQXdCLENBQzdCLE9BQWUsRUFBRSxRQUE0QixFQUFFLEtBQVksRUFBRSxVQUFzQixFQUNuRixTQUF5QjtJQUMzQixNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7UUFDcEIsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDbkQsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3ZDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUN4QyxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIscUJBQXFCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUMsQ0FBQztJQUNGLE9BQU8sb0JBQW9CLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLGtCQUFrQixDQUN2QixZQUFxRCxFQUFFLFFBQXlCO0lBQ2xGLE9BQU8sWUFBWSxHQUFHLFFBQVEsQ0FBQztBQUNqQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsUUFBNEIsRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUN6RixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRTtRQUNoRSxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLFFBQTRCLEVBQUUsS0FBWSxFQUFFLEtBQVk7SUFDN0YsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUUzQixJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1FBQ3ZFLHFFQUFxRTtRQUNyRSx3RUFBd0U7UUFDeEUsNEVBQTRFO1FBQzVFLE9BQU87S0FDUjtJQUVELE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRCxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVoRSxnREFBZ0Q7SUFDaEQsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxXQUFXLENBQUM7SUFFbEUsc0VBQXNFO0lBQ3RFLHVCQUF1QiwrQkFBdUIsUUFBUSxDQUFDLENBQUM7SUFFeEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDO0lBRW5ELElBQUksU0FBUyxFQUFFO1FBQ2IsMERBQTBEO1FBQzFELE1BQU0sMEJBQTBCLEdBQzVCLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFFN0UsSUFBSSwwQkFBMEIsRUFBRTtZQUM5QixjQUFjLEdBQUcsMEJBQTBCLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3ZFO0tBQ0Y7SUFFRCxvRUFBb0U7SUFDcEUsbUVBQW1FO0lBQ25FLDZDQUE2QztJQUM3QyxJQUFJLENBQUMsY0FBYyxFQUFFO1FBQ25CLFFBQVEsQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDcEQsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxRQUFRLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPO0tBQ1I7SUFFRCxpREFBaUQ7SUFDakQsUUFBUSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzVFLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNuQixNQUFNLGFBQWEsR0FBcUIsRUFBRSxDQUFDO1FBQzNDLE1BQU0sUUFBUSxHQUFnQixFQUFFLENBQUM7UUFFakMsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUU7WUFDNUIsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFdBQVcsRUFBRTtnQkFDakMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDaEMsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7aUJBQ2xDO3FCQUFNO29CQUNMLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxPQUFPLEVBQUU7d0JBQ1gsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztxQkFDeEI7aUJBQ0Y7YUFDRjtpQkFBTTtnQkFDTCxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNkLE1BQU07YUFDUDtTQUNGO1FBRUQsd0RBQXdEO1FBQ3hELFFBQVEsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBRS9CLElBQUksTUFBTSxFQUFFO1lBQ1YsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxNQUFNLENBQUM7WUFFN0QsSUFBSSxRQUFRLENBQUMsY0FBYyxLQUFLLElBQUksRUFBRTtnQkFDcEMsTUFBTSxnQkFBZ0IsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFZLGtEQUUxQixTQUFTO29CQUNMLGtEQUFrRDt3QkFDOUMseUNBQXlDLGdCQUFnQixJQUFJO3dCQUM3RCw2REFBNkQsQ0FBQyxDQUFDO2dCQUMzRSxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzNCO1NBQ0Y7YUFBTTtZQUNMLFFBQVEsQ0FBQyxZQUFZLEdBQUcsNkJBQTZCLENBQUMsUUFBUSxDQUFDO1lBRS9ELDZFQUE2RTtZQUM3RSxNQUFNLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLEtBQU0sQ0FBQztZQUNuRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUM1QixpQkFBaUIsQ0FBQyxpQkFBaUI7b0JBQy9CLGlCQUFpQixDQUFtQixpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQzthQUM3RjtZQUNELElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3ZCLGlCQUFpQixDQUFDLFlBQVk7b0JBQzFCLGlCQUFpQixDQUFjLGlCQUFpQixDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzthQUM5RTtTQUNGO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0VBQWtFO0FBQ2xFLFNBQVMsaUJBQWlCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDbkQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxTQUFTLElBQUksZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFMUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsb0NBQW9DLENBQ3pDLFFBQTRCLEVBQUUsS0FBWSxFQUFFLFVBQXNCO0lBQ3BFLFNBQVM7UUFDTCxhQUFhLENBQ1QsUUFBUSxDQUFDLGNBQWMsRUFBRSx1REFBdUQsQ0FBQyxDQUFDO0lBRTFGLFFBQVEsQ0FBQyxjQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNqQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsUUFBUSxFQUFFO1lBQ3BFLFNBQVMsSUFBSSxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4RCx1REFBdUQ7WUFDdkQscUJBQXFCLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FFcEU7YUFBTSxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsTUFBTSxFQUFFO1lBQ3pFLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2pFO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsaUJBQWlCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDbkQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUUxQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDO1FBQUUsT0FBTztJQUUvQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckQsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELHNFQUFzRTtJQUN0RSwwQkFBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUVyQyxRQUFRLFFBQVEsQ0FBQyxZQUFZLEVBQUU7UUFDN0IsS0FBSyw2QkFBNkIsQ0FBQyxXQUFXO1lBQzVDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xFLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFL0Msc0RBQXNEO1lBQ3RELElBQUssUUFBUSxDQUFDLFlBQThDO2dCQUN4RCw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7Z0JBQzdDLG9DQUFvQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7YUFDbkU7WUFDRCxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxXQUFXO1lBQzVDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xFLG9DQUFvQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEUsTUFBTTtRQUNSLEtBQUssNkJBQTZCLENBQUMsUUFBUTtZQUN6QyxTQUFTLElBQUksZ0NBQWdDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEQscUJBQXFCLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbkUsTUFBTTtRQUNSLEtBQUssNkJBQTZCLENBQUMsTUFBTTtZQUN2QyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNoRSxNQUFNO1FBQ1I7WUFDRSxJQUFJLFNBQVMsRUFBRTtnQkFDYixVQUFVLENBQUMsMkJBQTJCLENBQUMsQ0FBQzthQUN6QztLQUNKO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VuLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL3JlbmRlcjMvYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0VGVtcGxhdGVMb2NhdGlvbkRldGFpbHN9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5pbXBvcnQge21hcmtWaWV3RGlydHl9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL21hcmtfdmlld19kaXJ0eSc7XG5pbXBvcnQge2hhbmRsZUVycm9yfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHvJtcm1dGVtcGxhdGV9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3RlbXBsYXRlJztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0Rlc3Ryb3llZH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3LCBQQVJFTlQsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRTZWxlY3RlZFROb2RlLCBnZXRUVmlldywgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vcmVuZGVyMy9zdGF0ZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldENvbnN0YW50LCBnZXRUTm9kZSwgcmVtb3ZlTFZpZXdPbkRlc3Ryb3ksIHN0b3JlTFZpZXdPbkRlc3Ryb3l9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vcmVuZGVyMy92aWV3X21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIHRocm93RXJyb3J9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtpbnZva2VBbGxUcmlnZ2VyQ2xlYW51cEZucywgaW52b2tlVHJpZ2dlckNsZWFudXBGbnMsIHN0b3JlVHJpZ2dlckNsZWFudXBGbn0gZnJvbSAnLi9jbGVhbnVwJztcbmltcG9ydCB7b25Ib3Zlciwgb25JbnRlcmFjdGlvbiwgb25WaWV3cG9ydCwgcmVnaXN0ZXJEb21UcmlnZ2VyfSBmcm9tICcuL2RvbV90cmlnZ2Vycyc7XG5pbXBvcnQge29uSWRsZX0gZnJvbSAnLi9pZGxlX3NjaGVkdWxlcic7XG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrQmVoYXZpb3IsIERlZmVyQmxvY2tDb25maWcsIERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3IsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGUsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLCBEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZywgRGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnLCBEZXBlbmRlbmN5UmVzb2x2ZXJGbiwgTERlZmVyQmxvY2tEZXRhaWxzLCBMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk4sIE5FWFRfREVGRVJfQkxPQ0tfU1RBVEUsIFNUQVRFX0lTX0ZST1pFTl9VTlRJTCwgVERlZmVyQmxvY2tEZXRhaWxzLCBUcmlnZ2VyVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7b25UaW1lciwgc2NoZWR1bGVUaW1lclRyaWdnZXJ9IGZyb20gJy4vdGltZXJfc2NoZWR1bGVyJztcbmltcG9ydCB7YWRkRGVwc1RvUmVnaXN0cnksIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkLCBnZXRMRGVmZXJCbG9ja0RldGFpbHMsIGdldExvYWRpbmdCbG9ja0FmdGVyLCBnZXRNaW5pbXVtRHVyYXRpb25Gb3JTdGF0ZSwgZ2V0UHJpbWFyeUJsb2NrVE5vZGUsIGdldFREZWZlckJsb2NrRGV0YWlscywgZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlLCBzZXRMRGVmZXJCbG9ja0RldGFpbHMsIHNldFREZWZlckJsb2NrRGV0YWlsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIEluamVjdG9yIHRva2VuIHRoYXQgYWxsb3dzIHRvIHByb3ZpZGUgYERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3JgIGNsYXNzXG4gKiBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yPignREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUicpO1xuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgdG9rZW4gdXNlZCBmb3IgY29uZmlndXJpbmcgZGVmZXIgYmxvY2sgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19DT05GSUcgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrQ29uZmlnPihuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfQ09ORklHJyA6ICcnKTtcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgZGVmZXIgYmxvY2tzIHNob3VsZCBiZSB0cmlnZ2VyZWQuXG4gKlxuICogQ3VycmVudGx5LCBkZWZlciBibG9ja3MgYXJlIG5vdCB0cmlnZ2VyZWQgb24gdGhlIHNlcnZlcixcbiAqIG9ubHkgcGxhY2Vob2xkZXIgY29udGVudCBpcyByZW5kZXJlZCAoaWYgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcjogSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgY29uc3QgY29uZmlnID0gaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0NPTkZJRywgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gIGlmIChjb25maWc/LmJlaGF2aW9yID09PSBEZWZlckJsb2NrQmVoYXZpb3IuTWFudWFsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBpc1BsYXRmb3JtQnJvd3NlcihpbmplY3Rvcik7XG59XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIHRoZSB0aW1lci1iYXNlZCBzY2hlZHVsZXIgaW1wbGVtZW50YXRpb24gb2YgZGVmZXIgYmxvY2sgc3RhdGVcbiAqIHJlbmRlcmluZyBtZXRob2QuIEl0J3MgdXNlZCB0byBtYWtlIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcgdHJlZS1zaGFrYWJsZS5cbiAqIElmIGBtaW5pbXVtYCBvciBgYWZ0ZXJgIHBhcmFtZXRlcnMgYXJlIHVzZWQsIGNvbXBpbGVyIGdlbmVyYXRlcyBhbiBleHRyYVxuICogYXJndW1lbnQgZm9yIHRoZSBgybXJtWRlZmVyYCBpbnN0cnVjdGlvbiwgd2hpY2ggcmVmZXJlbmNlcyBhIHRpbWVyLWJhc2VkXG4gKiBpbXBsZW1lbnRhdGlvbi5cbiAqL1xubGV0IGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsOiAodHlwZW9mIGFwcGx5RGVmZXJCbG9ja1N0YXRlKXxudWxsID0gbnVsbDtcblxuLyoqXG4gKiBFbmFibGVzIHRpbWVyLXJlbGF0ZWQgc2NoZWR1bGluZyBpZiBgYWZ0ZXJgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGFyZSBzZXR1cFxuICogb24gdGhlIGBAbG9hZGluZ2Agb3IgYEBwbGFjZWhvbGRlcmAgYmxvY2tzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyRW5hYmxlVGltZXJTY2hlZHVsaW5nKFxuICAgIHRWaWV3OiBUVmlldywgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgcGxhY2Vob2xkZXJDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsKSB7XG4gIGNvbnN0IHRWaWV3Q29uc3RzID0gdFZpZXcuY29uc3RzO1xuICBpZiAocGxhY2Vob2xkZXJDb25maWdJbmRleCAhPSBudWxsKSB7XG4gICAgdERldGFpbHMucGxhY2Vob2xkZXJCbG9ja0NvbmZpZyA9XG4gICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpO1xuICB9XG4gIGlmIChsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCkge1xuICAgIHREZXRhaWxzLmxvYWRpbmdCbG9ja0NvbmZpZyA9XG4gICAgICAgIGdldENvbnN0YW50PERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnPih0Vmlld0NvbnN0cywgbG9hZGluZ0NvbmZpZ0luZGV4KTtcbiAgfVxuXG4gIC8vIEVuYWJsZSBpbXBsZW1lbnRhdGlvbiB0aGF0IHN1cHBvcnRzIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcuXG4gIGlmIChhcHBseURlZmVyQmxvY2tTdGF0ZVdpdGhTY2hlZHVsaW5nSW1wbCA9PT0gbnVsbCkge1xuICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsID0gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZztcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIGRlZmVyIGJsb2Nrcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGBkZWZlcmAgaW5zdHJ1Y3Rpb24uXG4gKiBAcGFyYW0gcHJpbWFyeVRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcHJpbWFyeSBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGRlcGVuZGVuY3lSZXNvbHZlckZuIEZ1bmN0aW9uIHRoYXQgY29udGFpbnMgZGVwZW5kZW5jaWVzIGZvciB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxvYWRpbmdUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGxvYWRpbmcgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgcGxhY2Vob2xkZXIgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBlcnJvclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgZXJyb3IgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBsb2FkaW5nQ29uZmlnSW5kZXggSW5kZXggaW4gdGhlIGNvbnN0YW50cyBhcnJheSBvZiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGUgbG9hZGluZy5cbiAqICAgICBibG9jay5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlckNvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgcGxhY2Vob2xkZXIgYmxvY2suXG4gKiBAcGFyYW0gZW5hYmxlVGltZXJTY2hlZHVsaW5nIEZ1bmN0aW9uIHRoYXQgZW5hYmxlcyB0aW1lci1yZWxhdGVkIHNjaGVkdWxpbmcgaWYgYGFmdGVyYFxuICogICAgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGFyZSBzZXR1cCBvbiB0aGUgYEBsb2FkaW5nYCBvciBgQHBsYWNlaG9sZGVyYCBibG9ja3MuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcihcbiAgICBpbmRleDogbnVtYmVyLCBwcmltYXJ5VG1wbEluZGV4OiBudW1iZXIsIGRlcGVuZGVuY3lSZXNvbHZlckZuPzogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCxcbiAgICBsb2FkaW5nVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIHBsYWNlaG9sZGVyVG1wbEluZGV4PzogbnVtYmVyfG51bGwsXG4gICAgZXJyb3JUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCwgbG9hZGluZ0NvbmZpZ0luZGV4PzogbnVtYmVyfG51bGwsXG4gICAgcGxhY2Vob2xkZXJDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVuYWJsZVRpbWVyU2NoZWR1bGluZz86IHR5cGVvZiDJtcm1ZGVmZXJFbmFibGVUaW1lclNjaGVkdWxpbmcpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgcGVyZm9ybWFuY2UubWFyaygnbWFya191c2VfY291bnRlcicsIHtkZXRhaWw6IHtmZWF0dXJlOiAnTmdEZWZlcid9fSk7XG5cbiAgICBjb25zdCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzID0ge1xuICAgICAgcHJpbWFyeVRtcGxJbmRleCxcbiAgICAgIGxvYWRpbmdUbXBsSW5kZXg6IGxvYWRpbmdUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyVG1wbEluZGV4OiBwbGFjZWhvbGRlclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgZXJyb3JUbXBsSW5kZXg6IGVycm9yVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlckJsb2NrQ29uZmlnOiBudWxsLFxuICAgICAgbG9hZGluZ0Jsb2NrQ29uZmlnOiBudWxsLFxuICAgICAgZGVwZW5kZW5jeVJlc29sdmVyRm46IGRlcGVuZGVuY3lSZXNvbHZlckZuID8/IG51bGwsXG4gICAgICBsb2FkaW5nU3RhdGU6IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVELFxuICAgICAgbG9hZGluZ1Byb21pc2U6IG51bGwsXG4gICAgfTtcbiAgICBlbmFibGVUaW1lclNjaGVkdWxpbmc/Lih0VmlldywgdERldGFpbHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgsIGxvYWRpbmdDb25maWdJbmRleCk7XG4gICAgc2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCBhZGp1c3RlZEluZGV4LCB0RGV0YWlscyk7XG4gIH1cblxuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdO1xuXG4gIC8vIElmIGh5ZHJhdGlvbiBpcyBlbmFibGVkLCBsb29rcyB1cCBkZWh5ZHJhdGVkIHZpZXdzIGluIHRoZSBET01cbiAgLy8gdXNpbmcgaHlkcmF0aW9uIGFubm90YXRpb24gaW5mbyBhbmQgc3RvcmVzIHRob3NlIHZpZXdzIG9uIExDb250YWluZXIuXG4gIC8vIEluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgZnVuY3Rpb24gaXMgYSBub29wLlxuICBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcihsQ29udGFpbmVyLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIEluaXQgaW5zdGFuY2Utc3BlY2lmaWMgZGVmZXIgZGV0YWlscyBhbmQgc3RvcmUgaXQuXG4gIGNvbnN0IGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMgPSBbXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5FWFRfREVGRVJfQkxPQ0tfU1RBVEVcbiAgICBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsLCAgLy8gREVGRVJfQkxPQ0tfU1RBVEVcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU1RBVEVfSVNfRlJPWkVOX1VOVElMXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExPQURJTkdfQUZURVJfQ0xFQU5VUF9GTlxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUUklHR0VSX0NMRUFOVVBfRk5TXG4gICAgbnVsbCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBSRUZFVENIX1RSSUdHRVJfQ0xFQU5VUF9GTlNcbiAgXTtcbiAgc2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCBhZGp1c3RlZEluZGV4LCBsRGV0YWlscyk7XG5cbiAgY29uc3QgY2xlYW51cFRyaWdnZXJzRm4gPSAoKSA9PiBpbnZva2VBbGxUcmlnZ2VyQ2xlYW51cEZucyhsRGV0YWlscyk7XG5cbiAgLy8gV2hlbiBkZWZlciBibG9jayBpcyB0cmlnZ2VyZWQgLSB1bnN1YnNjcmliZSBmcm9tIExWaWV3IGRlc3Ryb3kgY2xlYW51cC5cbiAgc3RvcmVUcmlnZ2VyQ2xlYW51cEZuKFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhciwgbERldGFpbHMsICgpID0+IHJlbW92ZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwVHJpZ2dlcnNGbikpO1xuICBzdG9yZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwVHJpZ2dlcnNGbik7XG59XG5cbi8qKlxuICogTG9hZHMgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIHdoZW4gYSB0cmlnZ2VyIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcldoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSAmJiByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsKSB7XG4gICAgICAvLyBJZiBub3RoaW5nIGlzIHJlbmRlcmVkIHlldCwgcmVuZGVyIGEgcGxhY2Vob2xkZXIgKGlmIGRlZmluZWQpLlxuICAgICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICB2YWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAocmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCB8fFxuICAgICAgICAgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKSkge1xuICAgICAgLy8gVGhlIGB3aGVuYCBjb25kaXRpb24gaGFzIGNoYW5nZWQgdG8gYHRydWVgLCB0cmlnZ2VyIGRlZmVyIGJsb2NrIGxvYWRpbmdcbiAgICAgIC8vIGlmIHRoZSBibG9jayBpcyBlaXRoZXIgaW4gaW5pdGlhbCAobm90aGluZyBpcyByZW5kZXJlZCkgb3IgYSBwbGFjZWhvbGRlclxuICAgICAgLy8gc3RhdGUuXG4gICAgICB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByZWZldGNoZXMgdGhlIGRlZmVycmVkIGNvbnRlbnQgd2hlbiBhIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcblxuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgdmFsdWUgPSBCb29sZWFuKHJhd1ZhbHVlKTsgIC8vIGhhbmRsZSB0cnV0aHkgb3IgZmFsc3kgdmFsdWVzXG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcbiAgICBpZiAodmFsdWUgPT09IHRydWUgJiYgdERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgICAgLy8gSWYgbG9hZGluZyBoYXMgbm90IGJlZW4gc3RhcnRlZCB5ZXQsIHRyaWdnZXIgaXQgbm93LlxuICAgICAgdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbklkbGUoKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25JZGxlKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbklkbGUoKSB7XG4gIHNjaGVkdWxlRGVsYXllZFByZWZldGNoaW5nKG9uSWRsZSk7XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JbW1lZGlhdGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIFJlbmRlciBwbGFjZWhvbGRlciBibG9jayBvbmx5IGlmIGxvYWRpbmcgdGVtcGxhdGUgaXMgbm90IHByZXNlbnRcbiAgLy8gdG8gYXZvaWQgY29udGVudCBmbGlja2VyaW5nLCBzaW5jZSBpdCB3b3VsZCBiZSBpbW1lZGlhdGVseSByZXBsYWNlZFxuICAvLyBieSB0aGUgbG9hZGluZyBibG9jay5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXggPT09IG51bGwpIHtcbiAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICB9XG4gIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG59XG5cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIGxvYWRpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25UaW1lcihkZWxheTogbnVtYmVyKSB7XG4gIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcob25UaW1lcihkZWxheSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSG92ZXIodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksIFRyaWdnZXJUeXBlLlByZWZldGNoKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW50ZXJhY3Rpb24odHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkludGVyYWN0aW9uLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksIFRyaWdnZXJUeXBlLlByZWZldGNoKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVmlld3BvcnQodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvblZpZXdwb3J0LCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLFxuICAgICAgVHJpZ2dlclR5cGUuUmVndWxhcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblZpZXdwb3J0KHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvblZpZXdwb3J0LFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSksIFRyaWdnZXJUeXBlLlByZWZldGNoKTtcbiAgfVxufVxuXG4vKioqKioqKioqKiBIZWxwZXIgZnVuY3Rpb25zICoqKioqKioqKiovXG5cbi8qKlxuICogU2NoZWR1bGVzIHRyaWdnZXJpbmcgb2YgYSBkZWZlciBibG9jayBmb3IgYG9uIGlkbGVgIGFuZCBgb24gdGltZXJgIGNvbmRpdGlvbnMuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVsYXllZFRyaWdnZXIoXG4gICAgc2NoZWR1bGVGbjogKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldykgPT4gVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgY29uc3QgY2xlYW51cEZuID0gc2NoZWR1bGVGbigoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLCBsVmlldyk7XG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gIHN0b3JlVHJpZ2dlckNsZWFudXBGbihUcmlnZ2VyVHlwZS5SZWd1bGFyLCBsRGV0YWlscywgY2xlYW51cEZuKTtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgcHJlZmV0Y2hpbmcgZm9yIGBvbiBpZGxlYCBhbmQgYG9uIHRpbWVyYCB0cmlnZ2Vycy5cbiAqXG4gKiBAcGFyYW0gc2NoZWR1bGVGbiBBIGZ1bmN0aW9uIHRoYXQgZG9lcyB0aGUgc2NoZWR1bGluZy5cbiAqL1xuZnVuY3Rpb24gc2NoZWR1bGVEZWxheWVkUHJlZmV0Y2hpbmcoXG4gICAgc2NoZWR1bGVGbjogKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldykgPT4gVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCBwcmVmZXRjaCA9ICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCBjbGVhbnVwRm4gPSBzY2hlZHVsZUZuKHByZWZldGNoLCBsVmlldyk7XG4gICAgc3RvcmVUcmlnZ2VyQ2xlYW51cEZuKFRyaWdnZXJUeXBlLlByZWZldGNoLCBsRGV0YWlscywgY2xlYW51cEZuKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyYW5zaXRpb25zIGEgZGVmZXIgYmxvY2sgdG8gdGhlIG5ldyBzdGF0ZS4gVXBkYXRlcyB0aGUgIG5lY2Vzc2FyeVxuICogZGF0YSBzdHJ1Y3R1cmVzIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgYmxvY2suXG4gKlxuICogQHBhcmFtIG5ld1N0YXRlIE5ldyBzdGF0ZSB0aGF0IHNob3VsZCBiZSBhcHBsaWVkIHRvIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsQ29udGFpbmVyIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBza2lwVGltZXJTY2hlZHVsaW5nIEluZGljYXRlcyB0aGF0IGBAbG9hZGluZ2AgYW5kIGBAcGxhY2Vob2xkZXJgIGJsb2NrXG4gKiAgIHNob3VsZCBiZSByZW5kZXJlZCBpbW1lZGlhdGVseSwgZXZlbiBpZiB0aGV5IGhhdmUgYGFmdGVyYCBvciBgbWluaW11bWAgY29uZmlnXG4gKiAgIG9wdGlvbnMgc2V0dXAuIFRoaXMgZmxhZyB0byBuZWVkZWQgZm9yIHRlc3RpbmcgQVBJcyB0byB0cmFuc2l0aW9uIGRlZmVyIGJsb2NrXG4gKiAgIGJldHdlZW4gc3RhdGVzIHZpYSBgRGVmZXJGaXh0dXJlLnJlbmRlcmAgbWV0aG9kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBza2lwVGltZXJTY2hlZHVsaW5nID0gZmFsc2UpOiB2b2lkIHtcbiAgY29uc3QgaG9zdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuXG4gIC8vIENoZWNrIGlmIHRoaXMgdmlldyBpcyBub3QgZGVzdHJveWVkLiBTaW5jZSB0aGUgbG9hZGluZyBwcm9jZXNzIHdhcyBhc3luYyxcbiAgLy8gdGhlIHZpZXcgbWlnaHQgZW5kIHVwIGJlaW5nIGRlc3Ryb3llZCBieSB0aGUgdGltZSByZW5kZXJpbmcgaGFwcGVucy5cbiAgaWYgKGlzRGVzdHJveWVkKGhvc3RMVmlldykpIHJldHVybjtcblxuICAvLyBNYWtlIHN1cmUgdGhpcyBUTm9kZSBiZWxvbmdzIHRvIFRWaWV3IHRoYXQgcmVwcmVzZW50cyBob3N0IExWaWV3LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgaG9zdExWaWV3KTtcblxuICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhob3N0TFZpZXcsIHROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsRGV0YWlscywgJ0V4cGVjdGVkIGEgZGVmZXIgYmxvY2sgc3RhdGUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcblxuICBpZiAoaXNWYWxpZFN0YXRlQ2hhbmdlKGN1cnJlbnRTdGF0ZSwgbmV3U3RhdGUpICYmXG4gICAgICBpc1ZhbGlkU3RhdGVDaGFuZ2UobERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPz8gLTEsIG5ld1N0YXRlKSkge1xuICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKGhvc3RUVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IG5lZWRzU2NoZWR1bGluZyA9ICFza2lwVGltZXJTY2hlZHVsaW5nICYmXG4gICAgICAgIChnZXRMb2FkaW5nQmxvY2tBZnRlcih0RGV0YWlscykgIT09IG51bGwgfHxcbiAgICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuTG9hZGluZykgIT09IG51bGwgfHxcbiAgICAgICAgIGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKTtcblxuICAgIGlmIChuZ0Rldk1vZGUgJiYgbmVlZHNTY2hlZHVsaW5nKSB7XG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmdJbXBsLCAnRXhwZWN0ZWQgc2NoZWR1bGluZyBmdW5jdGlvbiB0byBiZSBkZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYXBwbHlTdGF0ZUZuID1cbiAgICAgICAgbmVlZHNTY2hlZHVsaW5nID8gYXBwbHlEZWZlckJsb2NrU3RhdGVXaXRoU2NoZWR1bGluZ0ltcGwhIDogYXBwbHlEZWZlckJsb2NrU3RhdGU7XG4gICAgdHJ5IHtcbiAgICAgIGFwcGx5U3RhdGVGbihuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICBoYW5kbGVFcnJvcihob3N0TFZpZXcsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGNoYW5nZXMgdG8gdGhlIERPTSB0byByZWZsZWN0IGEgZ2l2ZW4gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5RGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMsIGxDb250YWluZXI6IExDb250YWluZXIsIHROb2RlOiBUTm9kZSxcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+KSB7XG4gIGNvbnN0IHN0YXRlVG1wbEluZGV4ID0gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKG5ld1N0YXRlLCBob3N0TFZpZXcsIHROb2RlKTtcblxuICBpZiAoc3RhdGVUbXBsSW5kZXggIT09IG51bGwpIHtcbiAgICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBzdGF0ZVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0VFZpZXcsIGFkanVzdGVkSW5kZXgpIGFzIFRDb250YWluZXJOb2RlO1xuXG4gICAgLy8gVGhlcmUgaXMgb25seSAxIHZpZXcgdGhhdCBjYW4gYmUgcHJlc2VudCBpbiBhbiBMQ29udGFpbmVyIHRoYXRcbiAgICAvLyByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2ssIHNvIGFsd2F5cyByZWZlciB0byB0aGUgZmlyc3Qgb25lLlxuICAgIGNvbnN0IHZpZXdJbmRleCA9IDA7XG5cbiAgICByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyKGxDb250YWluZXIsIHZpZXdJbmRleCk7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyhsQ29udGFpbmVyLCB0Tm9kZS50VmlldyEuc3NySWQpO1xuICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KGhvc3RMVmlldywgdE5vZGUsIG51bGwsIHtkZWh5ZHJhdGVkVmlld30pO1xuICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICBsQ29udGFpbmVyLCBlbWJlZGRlZExWaWV3LCB2aWV3SW5kZXgsIHNob3VsZEFkZFZpZXdUb0RvbSh0Tm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgICBtYXJrVmlld0RpcnR5KGVtYmVkZGVkTFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogRXh0ZW5kcyB0aGUgYGFwcGx5RGVmZXJCbG9ja1N0YXRlYCB3aXRoIHRpbWVyLWJhc2VkIHNjaGVkdWxpbmcuXG4gKiBUaGlzIGZ1bmN0aW9uIGJlY29tZXMgYXZhaWxhYmxlIG9uIGEgcGFnZSBpZiB0aGVyZSBhcmUgZGVmZXIgYmxvY2tzXG4gKiB0aGF0IHVzZSBgYWZ0ZXJgIG9yIGBtaW5pbXVtYCBwYXJhbWV0ZXJzIGluIHRoZSBgQGxvYWRpbmdgIG9yXG4gKiBgQHBsYWNlaG9sZGVyYCBibG9ja3MuXG4gKi9cbmZ1bmN0aW9uIGFwcGx5RGVmZXJCbG9ja1N0YXRlV2l0aFNjaGVkdWxpbmcoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscywgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdE5vZGU6IFROb2RlLFxuICAgIGhvc3RMVmlldzogTFZpZXc8dW5rbm93bj4pIHtcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHMoaG9zdFRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKGxEZXRhaWxzW1NUQVRFX0lTX0ZST1pFTl9VTlRJTF0gPT09IG51bGwgfHwgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA8PSBub3cpIHtcbiAgICBsRGV0YWlsc1tTVEFURV9JU19GUk9aRU5fVU5USUxdID0gbnVsbDtcblxuICAgIGNvbnN0IGxvYWRpbmdBZnRlciA9IGdldExvYWRpbmdCbG9ja0FmdGVyKHREZXRhaWxzKTtcbiAgICBjb25zdCBpbkxvYWRpbmdBZnRlclBoYXNlID0gbERldGFpbHNbTE9BRElOR19BRlRFUl9DTEVBTlVQX0ZOXSAhPT0gbnVsbDtcbiAgICBpZiAobmV3U3RhdGUgPT09IERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nICYmIGxvYWRpbmdBZnRlciAhPT0gbnVsbCAmJiAhaW5Mb2FkaW5nQWZ0ZXJQaGFzZSkge1xuICAgICAgLy8gVHJ5aW5nIHRvIHJlbmRlciBsb2FkaW5nLCBidXQgaXQgaGFzIGFuIGBhZnRlcmAgY29uZmlnLFxuICAgICAgLy8gc28gc2NoZWR1bGUgYW4gdXBkYXRlIGFjdGlvbiBhZnRlciBhIHRpbWVvdXQuXG4gICAgICBsRGV0YWlsc1tORVhUX0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgICAgY29uc3QgY2xlYW51cEZuID1cbiAgICAgICAgICBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUobG9hZGluZ0FmdGVyLCBsRGV0YWlscywgdE5vZGUsIGxDb250YWluZXIsIGhvc3RMVmlldyk7XG4gICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dID0gY2xlYW51cEZuO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSB0cmFuc2l0aW9uIHRvIGEgY29tcGxldGUgb3IgYW4gZXJyb3Igc3RhdGUgYW5kIHRoZXJlIGlzIGEgcGVuZGluZ1xuICAgICAgLy8gb3BlcmF0aW9uIHRvIHJlbmRlciBsb2FkaW5nIGFmdGVyIGEgdGltZW91dCAtIGludm9rZSBhIGNsZWFudXAgb3BlcmF0aW9uLFxuICAgICAgLy8gd2hpY2ggc3RvcHMgdGhlIHRpbWVyLlxuICAgICAgaWYgKG5ld1N0YXRlID4gRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcgJiYgaW5Mb2FkaW5nQWZ0ZXJQaGFzZSkge1xuICAgICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dISgpO1xuICAgICAgICBsRGV0YWlsc1tMT0FESU5HX0FGVEVSX0NMRUFOVVBfRk5dID0gbnVsbDtcbiAgICAgICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBhcHBseURlZmVyQmxvY2tTdGF0ZShuZXdTdGF0ZSwgbERldGFpbHMsIGxDb250YWluZXIsIHROb2RlLCBob3N0TFZpZXcpO1xuXG4gICAgICBjb25zdCBkdXJhdGlvbiA9IGdldE1pbmltdW1EdXJhdGlvbkZvclN0YXRlKHREZXRhaWxzLCBuZXdTdGF0ZSk7XG4gICAgICBpZiAoZHVyYXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG5vdyArIGR1cmF0aW9uO1xuICAgICAgICBzY2hlZHVsZURlZmVyQmxvY2tVcGRhdGUoZHVyYXRpb24sIGxEZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lciwgaG9zdExWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIHN0aWxsIHJlbmRlcmluZyB0aGUgcHJldmlvdXMgc3RhdGUuXG4gICAgLy8gVXBkYXRlIHRoZSBgTkVYVF9ERUZFUl9CTE9DS19TVEFURWAsIHdoaWNoIHdvdWxkIGJlXG4gICAgLy8gcGlja2VkIHVwIG9uY2UgaXQncyB0aW1lIHRvIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUuXG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhbiB1cGRhdGUgb3BlcmF0aW9uIGFmdGVyIGEgc3BlY2lmaWVkIHRpbWVvdXQuXG4gKi9cbmZ1bmN0aW9uIHNjaGVkdWxlRGVmZXJCbG9ja1VwZGF0ZShcbiAgICB0aW1lb3V0OiBudW1iZXIsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBob3N0TFZpZXc6IExWaWV3PHVua25vd24+KTogVm9pZEZ1bmN0aW9uIHtcbiAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV4dFN0YXRlID0gbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV07XG4gICAgbERldGFpbHNbU1RBVEVfSVNfRlJPWkVOX1VOVElMXSA9IG51bGw7XG4gICAgbERldGFpbHNbTkVYVF9ERUZFUl9CTE9DS19TVEFURV0gPSBudWxsO1xuICAgIGlmIChuZXh0U3RhdGUgIT09IG51bGwpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShuZXh0U3RhdGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH07XG4gIHJldHVybiBzY2hlZHVsZVRpbWVyVHJpZ2dlcih0aW1lb3V0LCBjYWxsYmFjaywgaG9zdExWaWV3KTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB3ZSBjYW4gdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZS5cbiAqXG4gKiBXZSB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlIGlmIHRoZSBwcmV2aW91cyBzdGF0ZSB3YXMgcmVwcmVzZW50ZWRcbiAqIHdpdGggYSBudW1iZXIgdGhhdCBpcyBsZXNzIHRoYW4gdGhlIG5leHQgc3RhdGUuIEZvciBleGFtcGxlLCBpZiB0aGUgY3VycmVudFxuICogc3RhdGUgaXMgXCJsb2FkaW5nXCIgKHJlcHJlc2VudGVkIGFzIGAxYCksIHdlIHNob3VsZCBub3Qgc2hvdyBhIHBsYWNlaG9sZGVyXG4gKiAocmVwcmVzZW50ZWQgYXMgYDBgKSwgYnV0IHdlIGNhbiBzaG93IGEgY29tcGxldGVkIHN0YXRlIChyZXByZXNlbnRlZCBhcyBgMmApXG4gKiBvciBhbiBlcnJvciBzdGF0ZSAocmVwcmVzZW50ZWQgYXMgYDNgKS5cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZFN0YXRlQ2hhbmdlKFxuICAgIGN1cnJlbnRTdGF0ZTogRGVmZXJCbG9ja1N0YXRlfERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlKTogYm9vbGVhbiB7XG4gIHJldHVybiBjdXJyZW50U3RhdGUgPCBuZXdTdGF0ZTtcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIHByZWZldGNoaW5nIG9mIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jay5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgaWYgKGxWaWV3W0lOSkVDVE9SXSAmJiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhsVmlld1tJTkpFQ1RPUl0hKSkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIGlmIHRoZSBwcm9jZXNzIGhhc24ndCBzdGFydGVkIHlldC5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSAhPT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBJZiB0aGUgbG9hZGluZyBzdGF0dXMgaXMgZGlmZmVyZW50IGZyb20gaW5pdGlhbCBvbmUsIGl0IG1lYW5zIHRoYXRcbiAgICAvLyB0aGUgbG9hZGluZyBvZiBkZXBlbmRlbmNpZXMgaXMgaW4gcHJvZ3Jlc3MgYW5kIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG9cbiAgICAvLyBpbiB0aGlzIGZ1bmN0aW9uLiBBbGwgZGV0YWlscyBjYW4gYmUgb2J0YWluZWQgZnJvbSB0aGUgYHREZXRhaWxzYCBvYmplY3QuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgY29uc3QgcHJpbWFyeUJsb2NrVE5vZGUgPSBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldywgdERldGFpbHMpO1xuXG4gIC8vIFN3aXRjaCBmcm9tIE5PVF9TVEFSVEVEIC0+IElOX1BST0dSRVNTIHN0YXRlLlxuICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUztcblxuICAvLyBQcmVmZXRjaGluZyBpcyB0cmlnZ2VyZWQsIGNsZWFudXAgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggdHJpZ2dlcnMuXG4gIGludm9rZVRyaWdnZXJDbGVhbnVwRm5zKFRyaWdnZXJUeXBlLlByZWZldGNoLCBsRGV0YWlscyk7XG5cbiAgbGV0IGRlcGVuZGVuY2llc0ZuID0gdERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm47XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgICBjb25zdCBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA9XG4gICAgICAgIGluamVjdG9yLmdldChERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAgIGlmIChkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvcikge1xuICAgICAgZGVwZW5kZW5jaWVzRm4gPSBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvci5pbnRlcmNlcHQoZGVwZW5kZW5jaWVzRm4pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBgZGVwZW5kZW5jaWVzRm5gIG1pZ2h0IGJlIGBudWxsYCB3aGVuIGFsbCBkZXBlbmRlbmNpZXMgd2l0aGluXG4gIC8vIGEgZ2l2ZW4gZGVmZXIgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG5cbiAgICAgIGlmICh0RGV0YWlscy5lcnJvclRtcGxJbmRleCA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZUxvY2F0aW9uID0gZ2V0VGVtcGxhdGVMb2NhdGlvbkRldGFpbHMobFZpZXcpO1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkRFRkVSX0xPQURJTkdfRkFJTEVELFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgJ0xvYWRpbmcgZGVwZW5kZW5jaWVzIGZvciBgQGRlZmVyYCBibG9jayBmYWlsZWQsICcgK1xuICAgICAgICAgICAgICAgICAgICBgYnV0IG5vIFxcYEBlcnJvclxcYCBibG9jayB3YXMgY29uZmlndXJlZCR7dGVtcGxhdGVMb2NhdGlvbn0uIGAgK1xuICAgICAgICAgICAgICAgICAgICAnQ29uc2lkZXIgdXNpbmcgdGhlIGBAZXJyb3JgIGJsb2NrIHRvIHJlbmRlciBhbiBlcnJvciBzdGF0ZS4nKTtcbiAgICAgICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG5cbiAgICAgIC8vIFVwZGF0ZSBkaXJlY3RpdmUgYW5kIHBpcGUgcmVnaXN0cmllcyB0byBhZGQgbmV3bHkgZG93bmxvYWRlZCBkZXBlbmRlbmNpZXMuXG4gICAgICBjb25zdCBwcmltYXJ5QmxvY2tUVmlldyA9IHByaW1hcnlCbG9ja1ROb2RlLnRWaWV3ITtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnkgPVxuICAgICAgICAgICAgYWRkRGVwc1RvUmVnaXN0cnk8RGlyZWN0aXZlRGVmTGlzdD4ocHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIGRpcmVjdGl2ZURlZnMpO1xuICAgICAgfVxuICAgICAgaWYgKHBpcGVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID1cbiAgICAgICAgICAgIGFkZERlcHNUb1JlZ2lzdHJ5PFBpcGVEZWZMaXN0PihwcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnksIHBpcGVEZWZzKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgcGxhY2Vob2xkZXIgY29udGVudCAoaWYgcHJlc2VudCkgKi9cbmZ1bmN0aW9uIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsIHROb2RlLCBsQ29udGFpbmVyKTtcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIHRoZSBcImxvYWRpbmdcIiBQcm9taXNlIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgZGVmZXIgc3ViLWJsb2NrLFxuICogYmFzZWQgb24gdGhlIGxvYWRpbmcgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgUmVwcmVzZW50cyBkZWZlciBibG9jayBpbmZvIHNoYXJlZCBhY3Jvc3MgYWxsIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKFxuICAgIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UsICdFeHBlY3RlZCBsb2FkaW5nIFByb21pc2UgdG8gZXhpc3Qgb24gdGhpcyBkZWZlciBibG9jaycpO1xuXG4gIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlIS50aGVuKCgpID0+IHtcbiAgICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcblxuICAgICAgLy8gRXZlcnl0aGluZyBpcyBsb2FkZWQsIHNob3cgdGhlIHByaW1hcnkgYmxvY2sgY29udGVudFxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gICAgfSBlbHNlIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRCkge1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gdHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAqIElmIHRoZSBibG9jayBpcyBhbHJlYWR5IGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlIC1cbiAqIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgdGFrZW4uXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIHROb2RlKTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBEZWZlciBibG9jayBpcyB0cmlnZ2VyZWQsIGNsZWFudXAgYWxsIHJlZ2lzdGVyZWQgdHJpZ2dlciBmdW5jdGlvbnMuXG4gIGludm9rZUFsbFRyaWdnZXJDbGVhbnVwRm5zKGxEZXRhaWxzKTtcblxuICBzd2l0Y2ggKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3LCB0Tm9kZSk7XG5cbiAgICAgIC8vIFRoZSBgbG9hZGluZ1N0YXRlYCBtaWdodCBoYXZlIGNoYW5nZWQgdG8gXCJsb2FkaW5nXCIuXG4gICAgICBpZiAoKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSBhcyBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSkgPT09XG4gICAgICAgICAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1MpIHtcbiAgICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU6XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHMpO1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkVycm9yLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICB0aHJvd0Vycm9yKCdVbmtub3duIGRlZmVyIGJsb2NrIHN0YXRlJyk7XG4gICAgICB9XG4gIH1cbn1cbiJdfQ==