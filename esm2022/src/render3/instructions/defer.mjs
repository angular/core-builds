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
 * @param placeholderConfigIndexIndex in the constants array of the configuration of the
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
    const lView = getLView();
    const tNode = getCurrentTNode();
    renderPlaceholder(lView, tNode);
    onIdle(() => triggerDeferBlock(lView, tNode), lView, true /* withLViewCleanup */);
}
/**
 * Sets up logic to handle the `prefetch on idle` deferred trigger.
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
            const prefetch = () => triggerPrefetching(tDetails, lView);
            const cleanupFn = onIdle(prefetch, lView, false /* withLViewCleanup */);
            registerTDetailsCleanup(injector, tDetails, key, cleanupFn);
        }
    }
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
export function ɵɵdeferOnTimer(delay) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on timer` deferred trigger.
 * @param delay Amount of time to wait before prefetching the content.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnTimer(delay) { } // TODO: implement runtime logic.
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
/** Utility function to render placeholder content (if present) */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFFLGNBQWMsRUFBWSxrQkFBa0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsbUNBQW1DLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNwRixPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDeEYsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNsQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQW9CLHVCQUF1QixFQUFFLGVBQWUsRUFBc0IsNkJBQTZCLEVBQTJILE1BQU0scUJBQXFCLENBQUM7QUFHblQsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0UsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFB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QUcsRUFBRSxDQUFDLElBQUksZUFBZSxFQUFFO0tBQ3JDLENBQUMsQUFKVSxDQUlUIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge2ZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuLi8uLi9oeWRyYXRpb24vdmlld3MnO1xuaW1wb3J0IHtwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcn0gZnJvbSAnLi4vLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVsZW1lbnQsIGFzc2VydEVxdWFsLCB0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5pbXBvcnQge2FmdGVyUmVuZGVyfSBmcm9tICcuLi9hZnRlcl9yZW5kZXJfaG9va3MnO1xuaW1wb3J0IHthc3NlcnRJbmRleEluRGVjbFJhbmdlLCBhc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtERUZFUl9CTE9DS19TVEFURSwgRGVmZXJCbG9ja0JlaGF2aW9yLCBEZWZlckJsb2NrQ29uZmlnLCBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlLCBEZWZlckJsb2NrVHJpZ2dlcnMsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLCBEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZywgRGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnLCBEZXBlbmRlbmN5UmVzb2x2ZXJGbiwgTERlZmVyQmxvY2tEZXRhaWxzLCBURGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0Rlc3Ryb3llZCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBUVklFVywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkVE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0VE5vZGUsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95LCB3YWxrVXBWaWV3c30gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vdmlld19tYW5pcHVsYXRpb24nO1xuXG5pbXBvcnQge29uSG92ZXIsIG9uSW50ZXJhY3Rpb24sIG9uVmlld3BvcnR9IGZyb20gJy4vZGVmZXJfZXZlbnRzJztcbmltcG9ydCB7ybXJtXRlbXBsYXRlfSBmcm9tICcuL3RlbXBsYXRlJztcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgZGVmZXIgYmxvY2tzIHNob3VsZCBiZSB0cmlnZ2VyZWQuXG4gKlxuICogQ3VycmVudGx5LCBkZWZlciBibG9ja3MgYXJlIG5vdCB0cmlnZ2VyZWQgb24gdGhlIHNlcnZlcixcbiAqIG9ubHkgcGxhY2Vob2xkZXIgY29udGVudCBpcyByZW5kZXJlZCAoaWYgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcjogSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgY29uc3QgY29uZmlnID0gaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0NPTkZJRywgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gIGlmIChjb25maWc/LmJlaGF2aW9yID09PSBEZWZlckJsb2NrQmVoYXZpb3IuTWFudWFsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBpc1BsYXRmb3JtQnJvd3NlcihpbmplY3Rvcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgZGVmZXIgYmxvY2tzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgYGRlZmVyYCBpbnN0cnVjdGlvbi5cbiAqIEBwYXJhbSBwcmltYXJ5VG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZGVwZW5kZW5jeVJlc29sdmVyRm4gRnVuY3Rpb24gdGhhdCBjb250YWlucyBkZXBlbmRlbmNpZXMgZm9yIHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbG9hZGluZ1RtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgbG9hZGluZyBibG9jayBjb250ZW50LlxuICogQHBhcmFtIHBsYWNlaG9sZGVyVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBwbGFjZWhvbGRlciBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGVycm9yVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBlcnJvciBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGxvYWRpbmdDb25maWdJbmRleCBJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZSBsb2FkaW5nLlxuICogICAgIGJsb2NrLlxuICogQHBhcmFtIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXhJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZVxuICogICAgIHBsYWNlaG9sZGVyIGJsb2NrLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXIoXG4gICAgaW5kZXg6IG51bWJlciwgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLCBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwsXG4gICAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlcnxudWxsLCBwbGFjZWhvbGRlclRtcGxJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVycm9yVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY29uc3QgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzID0ge1xuICAgICAgcHJpbWFyeVRtcGxJbmRleCxcbiAgICAgIGxvYWRpbmdUbXBsSW5kZXg6IGxvYWRpbmdUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyVG1wbEluZGV4OiBwbGFjZWhvbGRlclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgZXJyb3JUbXBsSW5kZXg6IGVycm9yVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlckJsb2NrQ29uZmlnOiBwbGFjZWhvbGRlckNvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgbG9hZGluZ0Jsb2NrQ29uZmlnOiBsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBsb2FkaW5nQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgZGVwZW5kZW5jeVJlc29sdmVyRm46IGRlcGVuZGVuY3lSZXNvbHZlckZuID8/IG51bGwsXG4gICAgICBsb2FkaW5nU3RhdGU6IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVELFxuICAgICAgbG9hZGluZ1Byb21pc2U6IG51bGwsXG4gICAgfTtcblxuICAgIHNldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgYWRqdXN0ZWRJbmRleCwgZGVmZXJCbG9ja0NvbmZpZyk7XG4gIH1cblxuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdO1xuXG4gIC8vIElmIGh5ZHJhdGlvbiBpcyBlbmFibGVkLCBsb29rcyB1cCBkZWh5ZHJhdGVkIHZpZXdzIGluIHRoZSBET01cbiAgLy8gdXNpbmcgaHlkcmF0aW9uIGFubm90YXRpb24gaW5mbyBhbmQgc3RvcmVzIHRob3NlIHZpZXdzIG9uIExDb250YWluZXIuXG4gIC8vIEluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgZnVuY3Rpb24gaXMgYSBub29wLlxuICBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luTENvbnRhaW5lcihsQ29udGFpbmVyLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIEluaXQgaW5zdGFuY2Utc3BlY2lmaWMgZGVmZXIgZGV0YWlscyBhbmQgc3RvcmUgaXQuXG4gIGNvbnN0IGxEZXRhaWxzID0gW107XG4gIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWw7XG4gIHNldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgYWRqdXN0ZWRJbmRleCwgbERldGFpbHMgYXMgTERlZmVyQmxvY2tEZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgd2hlbiBhIHRyaWdnZXIgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlICYmIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwpIHtcbiAgICAgIC8vIElmIG5vdGhpbmcgaXMgcmVuZGVyZWQgeWV0LCByZW5kZXIgYSBwbGFjZWhvbGRlciAoaWYgZGVmaW5lZCkuXG4gICAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHZhbHVlID09PSB0cnVlICYmXG4gICAgICAgIChyZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsIHx8XG4gICAgICAgICByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKSB7XG4gICAgICAvLyBUaGUgYHdoZW5gIGNvbmRpdGlvbiBoYXMgY2hhbmdlZCB0byBgdHJ1ZWAsIHRyaWdnZXIgZGVmZXIgYmxvY2sgbG9hZGluZ1xuICAgICAgLy8gaWYgdGhlIGJsb2NrIGlzIGVpdGhlciBpbiBpbml0aWFsIChub3RoaW5nIGlzIHJlbmRlcmVkKSBvciBhIHBsYWNlaG9sZGVyXG4gICAgICAvLyBzdGF0ZS5cbiAgICAgIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJlZmV0Y2hlcyB0aGUgZGVmZXJyZWQgY29udGVudCB3aGVuIGEgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSAmJiB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIG9uSWRsZSgoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpLCBsVmlldywgdHJ1ZSAvKiB3aXRoTFZpZXdDbGVhbnVwICovKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbklkbGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gUHJldmVudCBzY2hlZHVsaW5nIG1vcmUgdGhhbiBvbmUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGNhbGxcbiAgICAvLyBmb3IgZWFjaCBkZWZlciBibG9jay4gRm9yIHRoaXMgcmVhc29uIHdlIHVzZSBvbmx5IGEgdHJpZ2dlclxuICAgIC8vIGlkZW50aWZpZXIgaW4gYSBrZXksIHNvIGFsbCBpbnN0YW5jZXMgd291bGQgdXNlIHRoZSBzYW1lIGtleS5cbiAgICBjb25zdCBrZXkgPSBTdHJpbmcoRGVmZXJCbG9ja1RyaWdnZXJzLk9uSWRsZSk7XG4gICAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICAgIGNvbnN0IG1hbmFnZXIgPSBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKTtcbiAgICBpZiAoIW1hbmFnZXIuaGFzKHREZXRhaWxzLCBrZXkpKSB7XG4gICAgICAvLyBJbiBjYXNlIG9mIHByZWZldGNoaW5nLCB3ZSBpbnRlbnRpb25hbGx5IGF2b2lkIGNhbmNlbGxpbmcgcmVzb3VyY2UgbG9hZGluZyBpZlxuICAgICAgLy8gYW4gdW5kZXJseWluZyBMVmlldyBnZXQgZGVzdHJveWVkICh0aHVzIHBhc3NpbmcgYG51bGxgIGFzIGEgc2Vjb25kIGFyZ3VtZW50KSxcbiAgICAgIC8vIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgTFZpZXdzICh0aGF0IHJlcHJlc2VudCBlbWJlZGRlZCB2aWV3cykgdGhhdFxuICAgICAgLy8gZGVwZW5kIG9uIHJlc291cmNlIGxvYWRpbmcuXG4gICAgICBjb25zdCBwcmVmZXRjaCA9ICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpO1xuICAgICAgY29uc3QgY2xlYW51cEZuID0gb25JZGxlKHByZWZldGNoLCBsVmlldywgZmFsc2UgLyogd2l0aExWaWV3Q2xlYW51cCAqLyk7XG4gICAgICByZWdpc3RlclREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMsIGtleSwgY2xlYW51cEZuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkltbWVkaWF0ZSgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gUmVuZGVyIHBsYWNlaG9sZGVyIGJsb2NrIG9ubHkgaWYgbG9hZGluZyB0ZW1wbGF0ZSBpcyBub3QgcHJlc2VudFxuICAvLyB0byBhdm9pZCBjb250ZW50IGZsaWNrZXJpbmcsIHNpbmNlIGl0IHdvdWxkIGJlIGltbWVkaWF0ZWx5IHJlcGxhY2VkXG4gIC8vIGJ5IHRoZSBsb2FkaW5nIGJsb2NrLlxuICBpZiAodERldGFpbHMubG9hZGluZ1RtcGxJbmRleCA9PT0gbnVsbCkge1xuICAgIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIH1cbiAgdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKTtcbn1cblxuXG4vKipcbiAqIFNldHMgdXAgbG9naWMgdG8gaGFuZGxlIHRoZSBgcHJlZmV0Y2ggb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbW1lZGlhdGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB0aW1lcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgdGltZSB0byB3YWl0IGJlZm9yZSBsb2FkaW5nIHRoZSBjb250ZW50LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVGltZXIoZGVsYXk6IG51bWJlcikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25Ib3ZlciwgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbnRlcmFjdGlvbih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25WaWV3cG9ydCxcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKioqKioqKioqIEhlbHBlciBmdW5jdGlvbnMgKioqKioqKioqKi9cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IHRoZSBMVmlldyBpbiB3aGljaCBhIGRlZmVycmVkIGJsb2NrJ3MgdHJpZ2dlciBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSBkZWZlcnJlZEhvc3RMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXJyZWQgYmxvY2sgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSBkZWZlcnJlZFROb2RlIFROb2RlIGRlZmluaW5nIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAgaW4gdGhlIHZpZXcgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIncyB2aWV3LlxuICogICBBIG5lZ2F0aXZlIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBibG9jaydzIHBsYWNlaG9sZGVyLCB3aGlsZSBhbiB1bmRlZmluZWRcbiAqICAgdmFsdWUgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSBMVmlldyBhcyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIGdldFRyaWdnZXJMVmlldyhcbiAgICBkZWZlcnJlZEhvc3RMVmlldzogTFZpZXcsIGRlZmVycmVkVE5vZGU6IFROb2RlLCB3YWxrVXBUaW1lczogbnVtYmVyfHVuZGVmaW5lZCk6IExWaWV3fG51bGwge1xuICAvLyBUaGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSB2aWV3LCB3ZSBkb24ndCBuZWVkIHRvIHRyYXZlcnNlLlxuICBpZiAod2Fsa1VwVGltZXMgPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWZlcnJlZEhvc3RMVmlldztcbiAgfVxuXG4gIC8vIEEgcG9zaXRpdmUgdmFsdWUgb3IgemVybyBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluIGEgcGFyZW50IHZpZXcuXG4gIGlmICh3YWxrVXBUaW1lcyA+PSAwKSB7XG4gICAgcmV0dXJuIHdhbGtVcFZpZXdzKHdhbGtVcFRpbWVzLCBkZWZlcnJlZEhvc3RMVmlldyk7XG4gIH1cblxuICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVnYXRpdmUsIGl0IG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBwbGFjZWhvbGRlci5cbiAgY29uc3QgZGVmZXJyZWRDb250YWluZXIgPSBkZWZlcnJlZEhvc3RMVmlld1tkZWZlcnJlZFROb2RlLmluZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVmZXJyZWRDb250YWluZXIpO1xuICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBkZWZlcnJlZENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF0gPz8gbnVsbDtcblxuICAvLyBXZSBuZWVkIHRvIG51bGwgY2hlY2ssIGJlY2F1c2UgdGhlIHBsYWNlaG9sZGVyIG1pZ2h0IG5vdCBoYXZlIGJlZW4gcmVuZGVyZWQgeWV0LlxuICBpZiAobmdEZXZNb2RlICYmIHRyaWdnZXJMVmlldyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGRlZmVycmVkSG9zdExWaWV3LCBkZWZlcnJlZFROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICByZW5kZXJlZFN0YXRlLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsXG4gICAgICAgICdFeHBlY3RlZCBhIHBsYWNlaG9sZGVyIHRvIGJlIHJlbmRlcmVkIGluIHRoaXMgZGVmZXIgYmxvY2suJyk7XG4gICAgYXNzZXJ0TFZpZXcodHJpZ2dlckxWaWV3KTtcbiAgfVxuXG4gIHJldHVybiB0cmlnZ2VyTFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZWxlbWVudCB0aGF0IGEgZGVmZXJyZWQgYmxvY2sncyB0cmlnZ2VyIGlzIHBvaW50aW5nIHRvLlxuICogQHBhcmFtIHRyaWdnZXJMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgdHJpZ2dlciBpcyBkZWZpbmVkLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgdHJpZ2dlciBlbGVtZW50IHNob3VsZCd2ZSBiZWVuIHJlbmRlcmVkLlxuICovXG5mdW5jdGlvbiBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXc6IExWaWV3LCB0cmlnZ2VySW5kZXg6IG51bWJlcik6IEVsZW1lbnQge1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChIRUFERVJfT0ZGU0VUICsgdHJpZ2dlckluZGV4LCB0cmlnZ2VyTFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RWxlbWVudChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBET00tbm9kZSBiYXNlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGluaXRpYWxMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXIgYmxvY2sgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgcmVwcmVzZW50aW5nIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cC9kb3duIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIHJlZ2lzdGVyRm4gRnVuY3Rpb24gdGhhdCB3aWxsIHJlZ2lzdGVyIHRoZSBET00gZXZlbnRzLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciByZWNlaXZlcyB0aGUgZXZlbnQgdGhhdCBzaG91bGQgcmVuZGVyXG4gKiAgICAgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5mdW5jdGlvbiByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgaW5pdGlhbExWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCB0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM6IG51bWJlcnx1bmRlZmluZWQsXG4gICAgcmVnaXN0ZXJGbjogKGVsZW1lbnQ6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3RvcikgPT4gVm9pZEZ1bmN0aW9uLFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBpbml0aWFsTFZpZXdbSU5KRUNUT1JdITtcblxuICAvLyBBc3N1bXB0aW9uOiB0aGUgYGFmdGVyUmVuZGVyYCByZWZlcmVuY2Ugc2hvdWxkIGJlIGRlc3Ryb3llZFxuICAvLyBhdXRvbWF0aWNhbGx5IHNvIHdlIGRvbid0IG5lZWQgdG8ga2VlcCB0cmFjayBvZiBpdC5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJSZWYgPSBhZnRlclJlbmRlcigoKSA9PiB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaW5pdGlhbExWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcblxuICAgIC8vIElmIHRoZSBibG9jayB3YXMgbG9hZGVkIGJlZm9yZSB0aGUgdHJpZ2dlciB3YXMgcmVzb2x2ZWQsIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmcuXG4gICAgaWYgKHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwgJiZcbiAgICAgICAgcmVuZGVyZWRTdGF0ZSAhPT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKSB7XG4gICAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZ2V0VHJpZ2dlckxWaWV3KGluaXRpYWxMVmlldywgdE5vZGUsIHdhbGtVcFRpbWVzKTtcblxuICAgIC8vIEtlZXAgcG9sbGluZyB1bnRpbCB3ZSByZXNvbHZlIHRoZSB0cmlnZ2VyJ3MgTFZpZXcuXG4gICAgLy8gYGFmdGVyUmVuZGVyYCBzaG91bGQgc3RvcCBhdXRvbWF0aWNhbGx5IGlmIHRoZSB2aWV3IGlzIGRlc3Ryb3llZC5cbiAgICBpZiAoIXRyaWdnZXJMVmlldykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgdHJpZ2dlcidzIHZpZXcgd2FzIGRlc3Ryb3llZCBiZWZvcmUgd2UgcmVzb2x2ZWQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAgICBpZiAodHJpZ2dlckxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSB7XG4gICAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYWRkIGludGVncmF0aW9uIHdpdGggYERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcmAuXG4gICAgY29uc3QgZWxlbWVudCA9IGdldFRyaWdnZXJFbGVtZW50KHRyaWdnZXJMVmlldywgdHJpZ2dlckluZGV4KTtcbiAgICBjb25zdCBjbGVhbnVwID0gcmVnaXN0ZXJGbihlbGVtZW50LCAoKSA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcbiAgICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgICByZW1vdmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgICAgfVxuICAgICAgY2xlYW51cCgpO1xuICAgIH0sIGluamVjdG9yKTtcblxuICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICBzdG9yZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG5cbiAgICAvLyBTaW5jZSB0aGUgdHJpZ2dlciBhbmQgZGVmZXJyZWQgYmxvY2sgbWlnaHQgYmUgaW4gZGlmZmVyZW50XG4gICAgLy8gdmlld3MsIHdlIGhhdmUgdG8gcmVnaXN0ZXIgdGhlIGNhbGxiYWNrIGluIGJvdGggbG9jYXRpb25zLlxuICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgc3RvcmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgIH1cbiAgfSwge2luamVjdG9yfSk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIGEgYnJvd3NlciBiZWNvbWVzIGlkbGUuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCB3aGVuIGEgYnJvd3NlciBiZWNvbWVzIGlkbGUuXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgdGhhdCBob3N0cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHdpdGhMVmlld0NsZWFudXAgQSBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYSBzY2hlZHVsZWQgY2FsbGJhY2tcbiAqICAgICAgICAgICBzaG91bGQgYmUgY2FuY2VsbGVkIGluIGNhc2UgYW4gTFZpZXcgaXMgZGVzdHJveWVkIGJlZm9yZSBhIGNhbGxiYWNrXG4gKiAgICAgICAgICAgd2FzIGludm9rZWQuXG4gKi9cbmZ1bmN0aW9uIG9uSWRsZShjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCBzY2hlZHVsZXIgPSBpbmplY3Rvci5nZXQoT25JZGxlU2NoZWR1bGVyKTtcbiAgY29uc3QgY2xlYW51cEZuID0gKCkgPT4gc2NoZWR1bGVyLnJlbW92ZShjYWxsYmFjayk7XG4gIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9XG4gICAgICB3aXRoTFZpZXdDbGVhbnVwID8gd3JhcFdpdGhMVmlld0NsZWFudXAoY2FsbGJhY2ssIGxWaWV3LCBjbGVhbnVwRm4pIDogY2FsbGJhY2s7XG4gIHNjaGVkdWxlci5hZGQod3JhcHBlZENhbGxiYWNrKTtcbiAgcmV0dXJuIGNsZWFudXBGbjtcbn1cblxuLyoqXG4gKiBXcmFwcyBhIGdpdmVuIGNhbGxiYWNrIGludG8gYSBsb2dpYyB0aGF0IHJlZ2lzdGVycyBhIGNsZWFudXAgZnVuY3Rpb25cbiAqIGluIHRoZSBMVmlldyBjbGVhbnVwIHNsb3QsIHRvIGJlIGludm9rZWQgd2hlbiBhbiBMVmlldyBpcyBkZXN0cm95ZWQuXG4gKi9cbmZ1bmN0aW9uIHdyYXBXaXRoTFZpZXdDbGVhbnVwKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldywgY2xlYW51cDogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgY29uc3Qgd3JhcHBlZENhbGxiYWNrID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrKCk7XG4gICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kobFZpZXcsIGNsZWFudXApO1xuICB9O1xuICBzdG9yZUxWaWV3T25EZXN0cm95KGxWaWV3LCBjbGVhbnVwKTtcbiAgcmV0dXJuIHdyYXBwZWRDYWxsYmFjaztcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgZGF0YSBzbG90IGluZGV4IGZvciBkZWZlciBibG9jayBpbmZvIChlaXRoZXIgc3RhdGljIG9yXG4gKiBpbnN0YW5jZS1zcGVjaWZpYyksIGdpdmVuIGFuIGluZGV4IG9mIGEgZGVmZXIgaW5zdHJ1Y3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4OiBudW1iZXIpIHtcbiAgLy8gSW5zdGFuY2Ugc3RhdGUgaXMgbG9jYXRlZCBhdCB0aGUgKm5leHQqIHBvc2l0aW9uXG4gIC8vIGFmdGVyIHRoZSBkZWZlciBibG9jayBzbG90IGluIGFuIExWaWV3IG9yIFRWaWV3LmRhdGEuXG4gIHJldHVybiBkZWZlckJsb2NrSW5kZXggKyAxO1xufVxuXG4vKiogUmV0cmlldmVzIGEgZGVmZXIgYmxvY2sgc3RhdGUgZnJvbSBhbiBMVmlldywgZ2l2ZW4gYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBibG9jay4gKi9cbmZ1bmN0aW9uIGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IExEZWZlckJsb2NrRGV0YWlscyB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KHROb2RlLmluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHJldHVybiBsVmlld1tzbG90SW5kZXhdO1xufVxuXG4vKiogU3RvcmVzIGEgZGVmZXIgYmxvY2sgaW5zdGFuY2Ugc3RhdGUgaW4gTFZpZXcuICovXG5mdW5jdGlvbiBzZXRMRGVmZXJCbG9ja0RldGFpbHMoXG4gICAgbFZpZXc6IExWaWV3LCBkZWZlckJsb2NrSW5kZXg6IG51bWJlciwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgbFZpZXdbc2xvdEluZGV4XSA9IGxEZXRhaWxzO1xufVxuXG4vKiogUmV0cmlldmVzIHN0YXRpYyBpbmZvIGFib3V0IGEgZGVmZXIgYmxvY2ssIGdpdmVuIGEgVFZpZXcgYW5kIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmxvY2suICovXG5mdW5jdGlvbiBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiBURGVmZXJCbG9ja0RldGFpbHMge1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KHROb2RlLmluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHJldHVybiB0Vmlldy5kYXRhW3Nsb3RJbmRleF0gYXMgVERlZmVyQmxvY2tEZXRhaWxzO1xufVxuXG4vKiogU3RvcmVzIGEgZGVmZXIgYmxvY2sgc3RhdGljIGluZm8gaW4gYFRWaWV3LmRhdGFgLiAqL1xuZnVuY3Rpb24gc2V0VERlZmVyQmxvY2tEZXRhaWxzKFxuICAgIHRWaWV3OiBUVmlldywgZGVmZXJCbG9ja0luZGV4OiBudW1iZXIsIGRlZmVyQmxvY2tDb25maWc6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICB0Vmlldy5kYXRhW3Nsb3RJbmRleF0gPSBkZWZlckJsb2NrQ29uZmlnO1xufVxuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgaG9zdExWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogbnVtYmVyfG51bGwge1xuICBjb25zdCB0VmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgc3dpdGNoIChuZXdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLnByaW1hcnlUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZzpcbiAgICAgIHJldHVybiB0RGV0YWlscy5sb2FkaW5nVG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkVycm9yOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLmVycm9yVG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLnBsYWNlaG9sZGVyVG1wbEluZGV4O1xuICAgIGRlZmF1bHQ6XG4gICAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcihgVW5leHBlY3RlZCBkZWZlciBibG9jayBzdGF0ZTogJHtuZXdTdGF0ZX1gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbnMgYSBkZWZlciBibG9jayB0byB0aGUgbmV3IHN0YXRlLiBVcGRhdGVzIHRoZSAgbmVjZXNzYXJ5XG4gKiBkYXRhIHN0cnVjdHVyZXMgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBibG9jay5cbiAqXG4gKiBAcGFyYW0gbmV3U3RhdGUgTmV3IHN0YXRlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IHZvaWQge1xuICBjb25zdCBob3N0TFZpZXcgPSBsQ29udGFpbmVyW1BBUkVOVF07XG5cbiAgLy8gQ2hlY2sgaWYgdGhpcyB2aWV3IGlzIG5vdCBkZXN0cm95ZWQuIFNpbmNlIHRoZSBsb2FkaW5nIHByb2Nlc3Mgd2FzIGFzeW5jLFxuICAvLyB0aGUgdmlldyBtaWdodCBlbmQgdXAgYmVpbmcgZGVzdHJveWVkIGJ5IHRoZSB0aW1lIHJlbmRlcmluZyBoYXBwZW5zLlxuICBpZiAoaXNEZXN0cm95ZWQoaG9zdExWaWV3KSkgcmV0dXJuO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGlzIFROb2RlIGJlbG9uZ3MgdG8gVFZpZXcgdGhhdCByZXByZXNlbnRzIGhvc3QgTFZpZXcuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBob3N0TFZpZXcpO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGhvc3RMVmlldywgdE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxEZXRhaWxzLCAnRXhwZWN0ZWQgYSBkZWZlciBibG9jayBzdGF0ZSBkZWZpbmVkJyk7XG5cbiAgY29uc3Qgc3RhdGVUbXBsSW5kZXggPSBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUobmV3U3RhdGUsIGhvc3RMVmlldywgdE5vZGUpO1xuICAvLyBOb3RlOiB3ZSB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlIGlmIHRoZSBwcmV2aW91cyBzdGF0ZSB3YXMgcmVwcmVzZW50ZWRcbiAgLy8gd2l0aCBhIG51bWJlciB0aGF0IGlzIGxlc3MgdGhhbiB0aGUgbmV4dCBzdGF0ZS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjdXJyZW50XG4gIC8vIHN0YXRlIGlzIFwibG9hZGluZ1wiIChyZXByZXNlbnRlZCBhcyBgMmApLCB3ZSBzaG91bGQgbm90IHNob3cgYSBwbGFjZWhvbGRlclxuICAvLyAocmVwcmVzZW50ZWQgYXMgYDFgKS5cbiAgaWYgKGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA8IG5ld1N0YXRlICYmIHN0YXRlVG1wbEluZGV4ICE9PSBudWxsKSB7XG4gICAgbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdID0gbmV3U3RhdGU7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gc3RhdGVUbXBsSW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaG9zdFRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcblxuICAgIC8vIFRoZXJlIGlzIG9ubHkgMSB2aWV3IHRoYXQgY2FuIGJlIHByZXNlbnQgaW4gYW4gTENvbnRhaW5lciB0aGF0XG4gICAgLy8gcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLCBzbyBhbHdheXMgcmVmZXIgdG8gdGhlIGZpcnN0IG9uZS5cbiAgICBjb25zdCB2aWV3SW5kZXggPSAwO1xuXG4gICAgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lcihsQ29udGFpbmVyLCB2aWV3SW5kZXgpO1xuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcobENvbnRhaW5lciwgdE5vZGUudFZpZXchLnNzcklkKTtcbiAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhob3N0TFZpZXcsIHROb2RlLCBudWxsLCB7ZGVoeWRyYXRlZFZpZXd9KTtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgbENvbnRhaW5lciwgZW1iZWRkZWRMVmlldywgdmlld0luZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20odE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIHByZWZldGNoaW5nIG9mIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jay5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgbFZpZXc6IExWaWV3KSB7XG4gIGlmIChsVmlld1tJTkpFQ1RPUl0gJiYgc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2sobFZpZXdbSU5KRUNUT1JdISkpIHtcbiAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIGlmIHRoZSBwcm9jZXNzIGhhc24ndCBzdGFydGVkIHlldC5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgIT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gSWYgdGhlIGxvYWRpbmcgc3RhdHVzIGlzIGRpZmZlcmVudCBmcm9tIGluaXRpYWwgb25lLCBpdCBtZWFucyB0aGF0XG4gICAgLy8gdGhlIGxvYWRpbmcgb2YgZGVwZW5kZW5jaWVzIGlzIGluIHByb2dyZXNzIGFuZCB0aGVyZSBpcyBub3RoaW5nIHRvIGRvXG4gICAgLy8gaW4gdGhpcyBmdW5jdGlvbi4gQWxsIGRldGFpbHMgY2FuIGJlIG9idGFpbmVkIGZyb20gdGhlIGB0RGV0YWlsc2Agb2JqZWN0LlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHByaW1hcnlCbG9ja1ROb2RlID0gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXcsIHREZXRhaWxzKTtcblxuICAvLyBTd2l0Y2ggZnJvbSBOT1RfU1RBUlRFRCAtPiBJTl9QUk9HUkVTUyBzdGF0ZS5cbiAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M7XG5cbiAgLy8gQ2hlY2sgaWYgZGVwZW5kZW5jeSBmdW5jdGlvbiBpbnRlcmNlcHRvciBpcyBjb25maWd1cmVkLlxuICBjb25zdCBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA9XG4gICAgICBpbmplY3Rvci5nZXQoREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3QgZGVwZW5kZW5jaWVzRm4gPSBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvciA/XG4gICAgICBkZWZlckRlcGVuZGVuY3lJbnRlcmNlcHRvci5pbnRlcmNlcHQodERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm4pIDpcbiAgICAgIHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuO1xuXG4gIC8vIFRoZSBgZGVwZW5kZW5jaWVzRm5gIG1pZ2h0IGJlIGBudWxsYCB3aGVuIGFsbCBkZXBlbmRlbmNpZXMgd2l0aGluXG4gIC8vIGEgZ2l2ZW4gZGVmZXIgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVmZXIgYmxvY2sgbWF5IGhhdmUgbXVsdGlwbGUgcHJlZmV0Y2ggdHJpZ2dlcnMuIE9uY2UgdGhlIGxvYWRpbmdcbiAgLy8gc3RhcnRzLCBpbnZva2UgYWxsIGNsZWFuIGZ1bmN0aW9ucywgc2luY2UgdGhleSBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbiAgaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yLCB0RGV0YWlscyk7XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnkgP1xuICAgICAgICAgICAgWy4uLnByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCAuLi5kaXJlY3RpdmVEZWZzXSA6XG4gICAgICAgICAgICBkaXJlY3RpdmVEZWZzO1xuICAgICAgfVxuICAgICAgaWYgKHBpcGVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID9cbiAgICAgICAgICAgIFsuLi5wcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnksIC4uLnBpcGVEZWZzXSA6XG4gICAgICAgICAgICBwaXBlRGVmcztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgcGxhY2Vob2xkZXIgY29udGVudCAoaWYgcHJlc2VudCkgKi9cbmZ1bmN0aW9uIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLCB0Tm9kZSwgbENvbnRhaW5lcik7XG59XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgXCJsb2FkaW5nXCIgUHJvbWlzZSBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGRlZmVyIHN1Yi1ibG9jayxcbiAqIGJhc2VkIG9uIHRoZSBsb2FkaW5nIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFJlcHJlc2VudHMgZGVmZXIgYmxvY2sgaW5mbyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyhcbiAgICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlLCAnRXhwZWN0ZWQgbG9hZGluZyBQcm9taXNlIHRvIGV4aXN0IG9uIHRoaXMgZGVmZXIgYmxvY2snKTtcblxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSEudGhlbigoKSA9PiB7XG4gICAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG5cbiAgICAgIC8vIEV2ZXJ5dGhpbmcgaXMgbG9hZGVkLCBzaG93IHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnRcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiogUmV0cmlldmVzIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIG1haW4gY29udGVudCBvZiBhIGRlZmVyIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXc6IFRWaWV3LCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKTogVENvbnRhaW5lck5vZGUge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gdERldGFpbHMucHJpbWFyeVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIHJldHVybiBnZXRUTm9kZSh0VmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gdHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAqIElmIHRoZSBibG9jayBpcyBhbHJlYWR5IGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlIC1cbiAqIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgdGFrZW4uXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBDb25kaXRpb24gaXMgdHJpZ2dlcmVkLCB0cnkgdG8gcmVuZGVyIGxvYWRpbmcgc3RhdGUgYW5kIHN0YXJ0IGRvd25sb2FkaW5nLlxuICAvLyBOb3RlOiBpZiBhIGJsb2NrIGlzIGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlLCB0aGlzIGNhbGwgd291bGQgYmUgYSBub29wLlxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICBzd2l0Y2ggKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQ6XG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG5cbiAgICAgIC8vIFRoZSBgbG9hZGluZ1N0YXRlYCBtaWdodCBoYXZlIGNoYW5nZWQgdG8gXCJsb2FkaW5nXCIuXG4gICAgICBpZiAoKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSBhcyBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSkgPT09XG4gICAgICAgICAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1MpIHtcbiAgICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTOlxuICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFOlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3dFcnJvcignVW5rbm93biBkZWZlciBibG9jayBzdGF0ZScpO1xuICAgICAgfVxuICB9XG59XG5cbi8qKlxuICogQXNzZXJ0cyB3aGV0aGVyIGFsbCBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2sgYXJlIGxvYWRlZC5cbiAqIEFsd2F5cyBydW4gdGhpcyBmdW5jdGlvbiAoaW4gZGV2IG1vZGUpIGJlZm9yZSByZW5kZXJpbmcgYSBkZWZlclxuICogYmxvY2sgaW4gY29tcGxldGVkIHN0YXRlLlxuICovXG5mdW5jdGlvbiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlLCBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSxcbiAgICAgICdFeHBlY3RpbmcgYWxsIGRlZmVycmVkIGRlcGVuZGVuY2llcyB0byBiZSBsb2FkZWQuJyk7XG59XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIERlc2NyaWJlcyBhIGhlbHBlciBjbGFzcyB0aGF0IGFsbG93cyB0byBpbnRlcmNlcHQgYSBjYWxsIHRvIHJldHJpZXZlIGN1cnJlbnRcbiAqIGRlcGVuZGVuY3kgbG9hZGluZyBmdW5jdGlvbiBhbmQgcmVwbGFjZSBpdCB3aXRoIGEgZGlmZmVyZW50IGltcGxlbWVudGF0aW9uLlxuICogVGhpcyBpbnRlcmNlcHRvciBjbGFzcyBpcyBuZWVkZWQgdG8gYWxsb3cgdGVzdGluZyBibG9ja3MgaW4gZGlmZmVyZW50IHN0YXRlc1xuICogYnkgc2ltdWxhdGluZyBsb2FkaW5nIHJlc3BvbnNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3Ige1xuICAvKipcbiAgICogSW52b2tlZCBmb3IgZWFjaCBkZWZlciBibG9jayB3aGVuIGRlcGVuZGVuY3kgbG9hZGluZyBmdW5jdGlvbiBpcyBhY2Nlc3NlZC5cbiAgICovXG4gIGludGVyY2VwdChkZXBlbmRlbmN5Rm46IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwpOiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGxvd3MgdG8gY29uZmlndXJlIGFuIGludGVyY2VwdG9yIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2V0SW50ZXJjZXB0b3IoaW50ZXJjZXB0b3JGbjogKGN1cnJlbnQ6IERlcGVuZGVuY3lSZXNvbHZlckZuKSA9PiBEZXBlbmRlbmN5UmVzb2x2ZXJGbik6IHZvaWQ7XG59XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIEluamVjdG9yIHRva2VuIHRoYXQgYWxsb3dzIHRvIHByb3ZpZGUgYERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3JgIGNsYXNzXG4gKiBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yPihcbiAgICAgICAgbmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1InIDogJycpO1xuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiB2YWx1ZSBtYXRjaGVzIHRoZSBleHBlY3RlZCBzdHJ1Y3R1cmUgb2YgYSBkZWZlciBibG9ja1xuICpcbiAqIFdlIGNhbiBzYWZlbHkgcmVseSBvbiB0aGUgcHJpbWFyeVRtcGxJbmRleCBiZWNhdXNlIGV2ZXJ5IGRlZmVyIGJsb2NrIHJlcXVpcmVzXG4gKiB0aGF0IGEgcHJpbWFyeSB0ZW1wbGF0ZSBleGlzdHMuIEFsbCB0aGUgb3RoZXIgdGVtcGxhdGUgb3B0aW9ucyBhcmUgb3B0aW9uYWwuXG4gKi9cbmZ1bmN0aW9uIGlzVERlZmVyQmxvY2tEZXRhaWxzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSAmJlxuICAgICAgKHR5cGVvZiAodmFsdWUgYXMgVERlZmVyQmxvY2tEZXRhaWxzKS5wcmltYXJ5VG1wbEluZGV4ID09PSAnbnVtYmVyJyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdXNlZCBmb3IgY29uZmlndXJpbmcgZGVmZXIgYmxvY2sgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19DT05GSUcgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrQ29uZmlnPihuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfQ09ORklHJyA6ICcnKTtcblxuLyoqXG4gKiBEZWZlciBibG9jayBpbnN0YW5jZSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZlckJsb2NrRGV0YWlscyB7XG4gIGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGxWaWV3OiBMVmlldztcbiAgdE5vZGU6IFROb2RlO1xuICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbGwgZGVmZXIgYmxvY2tzIGluIGEgZ2l2ZW4gTFZpZXcuXG4gKlxuICogQHBhcmFtIGxWaWV3IGxWaWV3IHdpdGggZGVmZXIgYmxvY2tzXG4gKiBAcGFyYW0gZGVmZXJCbG9ja3MgZGVmZXIgYmxvY2sgYWdncmVnYXRvciBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmZXJCbG9ja3MobFZpZXc6IExWaWV3LCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpXTtcbiAgICAgIC8vIEFuIExDb250YWluZXIgbWF5IHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLCBpbiB3aGljaCBjYXNlXG4gICAgICAvLyB3ZSBzdG9yZSBpdCBhcyBhIHJlc3VsdC4gT3RoZXJ3aXNlLCBrZWVwIGl0ZXJhdGluZyBvdmVyIExDb250YWluZXIgdmlld3MgYW5kXG4gICAgICAvLyBsb29rIGZvciBkZWZlciBibG9ja3MuXG4gICAgICBjb25zdCBpc0xhc3QgPSBpID09PSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCAtIDE7XG4gICAgICBpZiAoIWlzTGFzdCkge1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaV0gYXMgVE5vZGU7XG4gICAgICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICAgIGlmIChpc1REZWZlckJsb2NrRGV0YWlscyh0RGV0YWlscykpIHtcbiAgICAgICAgICBkZWZlckJsb2Nrcy5wdXNoKHtsQ29udGFpbmVyLCBsVmlldywgdE5vZGUsIHREZXRhaWxzfSk7XG4gICAgICAgICAgLy8gVGhpcyBMQ29udGFpbmVyIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gd2UgZXhpdFxuICAgICAgICAgIC8vIHRoaXMgaXRlcmF0aW9uIGFuZCBkb24ndCBpbnNwZWN0IHZpZXdzIGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICBnZXREZWZlckJsb2NrcyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBkZWZlckJsb2Nrcyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0xWaWV3KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgZW50ZXIgdGhlIGBnZXREZWZlckJsb2Nrc2AgcmVjdXJzaXZlbHkuXG4gICAgICBnZXREZWZlckJsb2NrcyhsVmlld1tpXSwgZGVmZXJCbG9ja3MpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIGNsZWFudXAgZnVuY3Rpb24gYXNzb2NpYXRlZCB3aXRoIGEgcHJlZmV0Y2hpbmcgdHJpZ2dlclxuICogb2YgYSBnaXZlbiBkZWZlciBibG9jay5cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2xlYW51cEZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuYWRkKHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG59XG5cbi8qKlxuICogSW52b2tlcyBhbGwgcmVnaXN0ZXJlZCBwcmVmZXRjaCBjbGVhbnVwIHRyaWdnZXJzXG4gKiBhbmQgcmVtb3ZlcyBhbGwgY2xlYW51cCBmdW5jdGlvbnMgYWZ0ZXJ3YXJkcy5cbiAqL1xuZnVuY3Rpb24gaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yOiBJbmplY3RvciwgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKS5jbGVhbnVwKHREZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBzZXJ2aWNlIHRvIGtlZXAgdHJhY2sgb2YgY2xlYW51cCBmdW5jdGlvbnMgYXNzb2NpYXRlZFxuICogd2l0aCBkZWZlciBibG9ja3MuIFRoaXMgY2xhc3MgaXMgdXNlZCB0byBtYW5hZ2UgY2xlYW51cCBmdW5jdGlvbnNcbiAqIGNyZWF0ZWQgZm9yIHByZWZldGNoaW5nIHRyaWdnZXJzLlxuICovXG5jbGFzcyBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIge1xuICBwcml2YXRlIGJsb2NrcyA9IG5ldyBNYXA8VERlZmVyQmxvY2tEZXRhaWxzLCBNYXA8c3RyaW5nLCBWb2lkRnVuY3Rpb25bXT4+KCk7XG5cbiAgYWRkKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgaWYgKCF0aGlzLmJsb2Nrcy5oYXModERldGFpbHMpKSB7XG4gICAgICB0aGlzLmJsb2Nrcy5zZXQodERldGFpbHMsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKSE7XG4gICAgaWYgKCFibG9jay5oYXMoa2V5KSkge1xuICAgICAgYmxvY2suc2V0KGtleSwgW10pO1xuICAgIH1cbiAgICBjb25zdCBjYWxsYmFja3MgPSBibG9jay5nZXQoa2V5KSE7XG4gICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgaGFzKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKT8uaGFzKGtleSk7XG4gIH1cblxuICBjbGVhbnVwKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk7XG4gICAgaWYgKGJsb2NrKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrcyBvZiBPYmplY3QudmFsdWVzKGJsb2NrKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGNhbGxiYWNrcykge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuYmxvY2tzLmRlbGV0ZSh0RGV0YWlscyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgZm9yIChjb25zdCBbYmxvY2tdIG9mIHRoaXMuYmxvY2tzKSB7XG4gICAgICB0aGlzLmNsZWFudXAoYmxvY2spO1xuICAgIH1cbiAgICB0aGlzLmJsb2Nrcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKCksXG4gIH0pO1xufVxuXG4vKipcbiAqIFVzZSBzaGltcyBmb3IgdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBhbmQgYGNhbmNlbElkbGVDYWxsYmFja2AgZnVuY3Rpb25zIGZvclxuICogZW52aXJvbm1lbnRzIHdoZXJlIHRob3NlIGZ1bmN0aW9ucyBhcmUgbm90IGF2YWlsYWJsZSAoZS5nLiBOb2RlLmpzIGFuZCBTYWZhcmkpLlxuICpcbiAqIE5vdGU6IHdlIHdyYXAgdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBjYWxsIGludG8gYSBmdW5jdGlvbiwgc28gdGhhdCBpdCBjYW4gYmVcbiAqIG92ZXJyaWRkZW4vbW9ja2VkIGluIHRlc3QgZW52aXJvbm1lbnQgYW5kIHBpY2tlZCB1cCBieSB0aGUgcnVudGltZSBjb2RlLlxuICovXG5jb25zdCBfcmVxdWVzdElkbGVDYWxsYmFjayA9ICgpID0+XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gcmVxdWVzdElkbGVDYWxsYmFjayA6IHNldFRpbWVvdXQ7XG5jb25zdCBfY2FuY2VsSWRsZUNhbGxiYWNrID0gKCkgPT5cbiAgICB0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgPyBjYW5jZWxJZGxlQ2FsbGJhY2sgOiBjbGVhclRpbWVvdXQ7XG5cbi8qKlxuICogSGVscGVyIHNlcnZpY2UgdG8gc2NoZWR1bGUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgcyBmb3IgYmF0Y2hlcyBvZiBkZWZlciBibG9ja3MsXG4gKiB0byBhdm9pZCBjYWxsaW5nIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBmb3IgZWFjaCBkZWZlciBibG9jayAoZS5nLiBpZlxuICogZGVmZXIgYmxvY2tzIGFyZSBkZWZpbmVkIGluc2lkZSBhIGZvciBsb29wKS5cbiAqL1xuY2xhc3MgT25JZGxlU2NoZWR1bGVyIHtcbiAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgY3VycmVudCBjYWxsYmFja3MgYXJlIGJlaW5nIGludm9rZWQuXG4gIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuXG4gIC8vIEN1cnJlbnRseSBzY2hlZHVsZWQgaWRsZSBjYWxsYmFjayBpZC5cbiAgaWRsZUlkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgLy8gU2V0IG9mIGNhbGxiYWNrcyB0byBiZSBpbnZva2VkIG5leHQuXG4gIGN1cnJlbnQgPSBuZXcgU2V0PFZvaWRGdW5jdGlvbj4oKTtcblxuICAvLyBTZXQgb2YgY2FsbGJhY2tzIGNvbGxlY3RlZCB3aGlsZSBpbnZva2luZyBjdXJyZW50IHNldCBvZiBjYWxsYmFja3MuXG4gIC8vIFRob3NlIGNhbGxiYWNrcyBhcmUgc2NoZWR1bGVkIGZvciB0aGUgbmV4dCBpZGxlIHBlcmlvZC5cbiAgZGVmZXJyZWQgPSBuZXcgU2V0PFZvaWRGdW5jdGlvbj4oKTtcblxuICBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICByZXF1ZXN0SWRsZUNhbGxiYWNrID0gX3JlcXVlc3RJZGxlQ2FsbGJhY2soKS5iaW5kKGdsb2JhbFRoaXMpO1xuICBjYW5jZWxJZGxlQ2FsbGJhY2sgPSBfY2FuY2VsSWRsZUNhbGxiYWNrKCkuYmluZChnbG9iYWxUaGlzKTtcblxuICBhZGQoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZCA6IHRoaXMuY3VycmVudDtcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgICBpZiAodGhpcy5pZGxlSWQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVJZGxlQ2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIHRoaXMuY3VycmVudC5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWQuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVJZGxlQ2FsbGJhY2soKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiB7XG4gICAgICB0aGlzLmNhbmNlbElkbGVDYWxsYmFjayh0aGlzLmlkbGVJZCEpO1xuICAgICAgdGhpcy5pZGxlSWQgPSBudWxsO1xuXG4gICAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jdXJyZW50KSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmN1cnJlbnQuY2xlYXIoKTtcblxuICAgICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIGFueSBjYWxsYmFja3MgYWRkZWQgZHVyaW5nIGFuIGludm9jYXRpb25cbiAgICAgIC8vIG9mIHRoZSBjdXJyZW50IG9uZXMgLSBtYWtlIHRoZW0gXCJjdXJyZW50XCIgYW5kIHNjaGVkdWxlXG4gICAgICAvLyBhIG5ldyBpZGxlIGNhbGxiYWNrLlxuICAgICAgaWYgKHRoaXMuZGVmZXJyZWQuc2l6ZSA+IDApIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmRlZmVycmVkKSB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZWZlcnJlZC5jbGVhcigpO1xuICAgICAgICB0aGlzLnNjaGVkdWxlSWRsZUNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgY2FsbGJhY2sgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlXG4gICAgLy8gdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBpcyBub3QgY3VycmVudGx5IHBhdGNoZWQgYnkgWm9uZS5qcy5cbiAgICB0aGlzLmlkbGVJZCA9IHRoaXMucmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB0aGlzLm5nWm9uZS5ydW4oY2FsbGJhY2spKSBhcyBudW1iZXI7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5pZGxlSWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY2FuY2VsSWRsZUNhbGxiYWNrKHRoaXMuaWRsZUlkKTtcbiAgICAgIHRoaXMuaWRsZUlkID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50LmNsZWFyKCk7XG4gICAgdGhpcy5kZWZlcnJlZC5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogT25JZGxlU2NoZWR1bGVyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgT25JZGxlU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuIl19