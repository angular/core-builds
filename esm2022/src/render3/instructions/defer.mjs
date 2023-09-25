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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFZLGtCQUFrQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN4RixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQW9CLHVCQUF1QixFQUFFLGVBQWUsRUFBc0IsNkJBQTZCLEVBQTJILE1BQU0scUJBQXFCLENBQUM7QUFHblQsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0UsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFxQixNQUFNLEVBQUUsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDM0cs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Q0FBQztJQUVELEdBQUcsQ0FBQyxRQUE0QixFQUFFLEdBQVc7UUFDM0MsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxPQUFPLENBQUMsUUFBNEI7UUFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLEVBQUU7WUFDVCxLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO29CQUNoQyxRQUFRLEVBQUUsQ0FBQztpQkFDWjthQUNGO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDOUI7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyQjtRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHdCQUF3QjtRQUMvQixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx3QkFBd0IsRUFBRTtLQUM5QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VuLCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXJ9IGZyb20gJy4uLy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFbGVtZW50LCBhc3NlcnRFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthZnRlclJlbmRlcn0gZnJvbSAnLi4vYWZ0ZXJfcmVuZGVyX2hvb2tzJztcbmltcG9ydCB7YXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSwgYXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7REVGRVJfQkxPQ0tfU1RBVEUsIERlZmVyQmxvY2tCZWhhdmlvciwgRGVmZXJCbG9ja0NvbmZpZywgRGVmZXJCbG9ja0ludGVybmFsU3RhdGUsIERlZmVyQmxvY2tTdGF0ZSwgRGVmZXJCbG9ja1RyaWdnZXJzLCBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSwgRGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWcsIERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZywgRGVwZW5kZW5jeVJlc29sdmVyRm4sIExEZWZlckJsb2NrRGV0YWlscywgVERlZmVyQmxvY2tEZXRhaWxzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmTGlzdCwgUGlwZURlZkxpc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNEZXN0cm95ZWQsIGlzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRTZWxlY3RlZFROb2RlLCBnZXRUVmlldywgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldFROb2RlLCByZW1vdmVMVmlld09uRGVzdHJveSwgc3RvcmVMVmlld09uRGVzdHJveSwgd2Fsa1VwVmlld3N9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2FkZExWaWV3VG9MQ29udGFpbmVyLCBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3LCByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyLCBzaG91bGRBZGRWaWV3VG9Eb219IGZyb20gJy4uL3ZpZXdfbWFuaXB1bGF0aW9uJztcblxuaW1wb3J0IHtvbkhvdmVyLCBvbkludGVyYWN0aW9uLCBvblZpZXdwb3J0fSBmcm9tICcuL2RlZmVyX2V2ZW50cyc7XG5pbXBvcnQge8m1ybV0ZW1wbGF0ZX0gZnJvbSAnLi90ZW1wbGF0ZSc7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGRlZmVyIGJsb2NrcyBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuICpcbiAqIEN1cnJlbnRseSwgZGVmZXIgYmxvY2tzIGFyZSBub3QgdHJpZ2dlcmVkIG9uIHRoZSBzZXJ2ZXIsXG4gKiBvbmx5IHBsYWNlaG9sZGVyIGNvbnRlbnQgaXMgcmVuZGVyZWQgKGlmIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3I6IEluamVjdG9yKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGluamVjdG9yLmdldChERUZFUl9CTE9DS19DT05GSUcsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoY29uZmlnPy5iZWhhdmlvciA9PT0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpO1xufVxuXG4vKipcbiAqIFNoaW1zIGZvciB0aGUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGFuZCBgY2FuY2VsSWRsZUNhbGxiYWNrYCBmdW5jdGlvbnMgZm9yIGVudmlyb25tZW50c1xuICogd2hlcmUgdGhvc2UgZnVuY3Rpb25zIGFyZSBub3QgYXZhaWxhYmxlIChlLmcuIE5vZGUuanMpLlxuICovXG5jb25zdCBfcmVxdWVzdElkbGVDYWxsYmFjayA9XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gcmVxdWVzdElkbGVDYWxsYmFjayA6IHNldFRpbWVvdXQ7XG5jb25zdCBfY2FuY2VsSWRsZUNhbGxiYWNrID1cbiAgICB0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgPyBjYW5jZWxJZGxlQ2FsbGJhY2sgOiBjbGVhclRpbWVvdXQ7XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgYHsjZGVmZXJ9YCBibG9ja3MuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBgZGVmZXJgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIHByaW1hcnlUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHByaW1hcnkgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmN5UmVzb2x2ZXJGbiBGdW5jdGlvbiB0aGF0IGNvbnRhaW5zIGRlcGVuZGVuY2llcyBmb3IgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsb2FkaW5nVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBgezpsb2FkaW5nfWAgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgYHs6cGxhY2Vob2xkZXJ9YCBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGVycm9yVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBgezplcnJvcn1gIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gbG9hZGluZ0NvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGB7OmxvYWRpbmd9YC5cbiAqICAgICBibG9jay5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlckNvbmZpZ0luZGV4SW5kZXggaW4gdGhlIGNvbnN0YW50cyBhcnJheSBvZiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGVcbiAqICAgICBgezpwbGFjZWhvbGRlcn1gIGJsb2NrLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXIoXG4gICAgaW5kZXg6IG51bWJlciwgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLCBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwsXG4gICAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlcnxudWxsLCBwbGFjZWhvbGRlclRtcGxJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVycm9yVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY29uc3QgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzID0ge1xuICAgICAgcHJpbWFyeVRtcGxJbmRleCxcbiAgICAgIGxvYWRpbmdUbXBsSW5kZXg6IGxvYWRpbmdUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyVG1wbEluZGV4OiBwbGFjZWhvbGRlclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgZXJyb3JUbXBsSW5kZXg6IGVycm9yVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlckJsb2NrQ29uZmlnOiBwbGFjZWhvbGRlckNvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgbG9hZGluZ0Jsb2NrQ29uZmlnOiBsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBsb2FkaW5nQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgZGVwZW5kZW5jeVJlc29sdmVyRm46IGRlcGVuZGVuY3lSZXNvbHZlckZuID8/IG51bGwsXG4gICAgICBsb2FkaW5nU3RhdGU6IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVELFxuICAgICAgbG9hZGluZ1Byb21pc2U6IG51bGwsXG4gICAgfTtcblxuICAgIHNldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgYWRqdXN0ZWRJbmRleCwgZGVmZXJCbG9ja0NvbmZpZyk7XG4gIH1cblxuICAvLyBMb29rdXAgZGVoeWRyYXRlZCB2aWV3cyB0aGF0IGJlbG9uZyB0byB0aGlzIExDb250YWluZXIuXG4gIC8vIEluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgb3BlcmF0aW9uIGlzIG5vb3AuXG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1thZGp1c3RlZEluZGV4XTtcbiAgcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICAvLyBJbml0IGluc3RhbmNlLXNwZWNpZmljIGRlZmVyIGRldGFpbHMgYW5kIHN0b3JlIGl0LlxuICBjb25zdCBsRGV0YWlscyA9IFtdO1xuICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsO1xuICBzZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIGFkanVzdGVkSW5kZXgsIGxEZXRhaWxzIGFzIExEZWZlckJsb2NrRGV0YWlscyk7XG59XG5cbi8qKlxuICogTG9hZHMgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIHdoZW4gYSB0cmlnZ2VyIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcldoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSAmJiByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsKSB7XG4gICAgICAvLyBJZiBub3RoaW5nIGlzIHJlbmRlcmVkIHlldCwgcmVuZGVyIGEgcGxhY2Vob2xkZXIgKGlmIGRlZmluZWQpLlxuICAgICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICB2YWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAocmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCB8fFxuICAgICAgICAgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKSkge1xuICAgICAgLy8gVGhlIGB3aGVuYCBjb25kaXRpb24gaGFzIGNoYW5nZWQgdG8gYHRydWVgLCB0cmlnZ2VyIGRlZmVyIGJsb2NrIGxvYWRpbmdcbiAgICAgIC8vIGlmIHRoZSBibG9jayBpcyBlaXRoZXIgaW4gaW5pdGlhbCAobm90aGluZyBpcyByZW5kZXJlZCkgb3IgYSBwbGFjZWhvbGRlclxuICAgICAgLy8gc3RhdGUuXG4gICAgICB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByZWZldGNoZXMgdGhlIGRlZmVycmVkIGNvbnRlbnQgd2hlbiBhIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcblxuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgdmFsdWUgPSBCb29sZWFuKHJhd1ZhbHVlKTsgIC8vIGhhbmRsZSB0cnV0aHkgb3IgZmFsc3kgdmFsdWVzXG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcbiAgICBpZiAodmFsdWUgPT09IHRydWUgJiYgdERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgICAgLy8gSWYgbG9hZGluZyBoYXMgbm90IGJlZW4gc3RhcnRlZCB5ZXQsIHRyaWdnZXIgaXQgbm93LlxuICAgICAgdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBoYW5kbGVycyB0aGF0IHJlcHJlc2VudCBgb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbklkbGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcblxuICAvLyBOb3RlOiB3ZSBwYXNzIGFuIGBsVmlld2AgYXMgYSBzZWNvbmQgYXJndW1lbnQgdG8gY2FuY2VsIGFuIGBpZGxlYFxuICAvLyBjYWxsYmFjayBpbiBjYXNlIGFuIExWaWV3IGdvdCBkZXN0cm95ZWQgYmVmb3JlIGFuIGBpZGxlYCBjYWxsYmFja1xuICAvLyBpcyBpbnZva2VkLlxuICBvbklkbGUoKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSwgbFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSWRsZSgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBQcmV2ZW50IHNjaGVkdWxpbmcgbW9yZSB0aGFuIG9uZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgY2FsbFxuICAgIC8vIGZvciBlYWNoIGRlZmVyIGJsb2NrLiBGb3IgdGhpcyByZWFzb24gd2UgdXNlIG9ubHkgYSB0cmlnZ2VyXG4gICAgLy8gaWRlbnRpZmllciBpbiBhIGtleSwgc28gYWxsIGluc3RhbmNlcyB3b3VsZCB1c2UgdGhlIHNhbWUga2V5LlxuICAgIGNvbnN0IGtleSA9IFN0cmluZyhEZWZlckJsb2NrVHJpZ2dlcnMuT25JZGxlKTtcbiAgICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gICAgY29uc3QgbWFuYWdlciA9IGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpO1xuICAgIGlmICghbWFuYWdlci5oYXModERldGFpbHMsIGtleSkpIHtcbiAgICAgIC8vIEluIGNhc2Ugb2YgcHJlZmV0Y2hpbmcsIHdlIGludGVudGlvbmFsbHkgYXZvaWQgY2FuY2VsbGluZyByZXNvdXJjZSBsb2FkaW5nIGlmXG4gICAgICAvLyBhbiB1bmRlcmx5aW5nIExWaWV3IGdldCBkZXN0cm95ZWQgKHRodXMgcGFzc2luZyBgbnVsbGAgYXMgYSBzZWNvbmQgYXJndW1lbnQpLFxuICAgICAgLy8gYmVjYXVzZSB0aGVyZSBtaWdodCBiZSBvdGhlciBMVmlld3MgKHRoYXQgcmVwcmVzZW50IGVtYmVkZGVkIHZpZXdzKSB0aGF0XG4gICAgICAvLyBkZXBlbmQgb24gcmVzb3VyY2UgbG9hZGluZy5cbiAgICAgIGNvbnN0IGNsZWFudXBGbiA9IG9uSWRsZSgoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSwgbnVsbCAvKiBMVmlldyAqLyk7XG4gICAgICByZWdpc3RlclREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMsIGtleSwgY2xlYW51cEZuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkltbWVkaWF0ZSgpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbW1lZGlhdGUoKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB0aW1lcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgdGltZSB0byB3YWl0IGJlZm9yZSBsb2FkaW5nIHRoZSBjb250ZW50LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVGltZXIoZGVsYXk6IG51bWJlcikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25Ib3ZlciwgKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkhvdmVyKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvbkhvdmVyLFxuICAgICAgICAoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkludGVyYWN0aW9uKHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lcz86IG51bWJlcikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG4gIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbnRlcmFjdGlvbih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25JbnRlcmFjdGlvbixcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25WaWV3cG9ydCh0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25WaWV3cG9ydCxcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKioqKioqKioqIEhlbHBlciBmdW5jdGlvbnMgKioqKioqKioqKi9cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IHRoZSBMVmlldyBpbiB3aGljaCBhIGRlZmVycmVkIGJsb2NrJ3MgdHJpZ2dlciBpcyByZW5kZXJlZC5cbiAqIEBwYXJhbSBkZWZlcnJlZEhvc3RMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXJyZWQgYmxvY2sgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSBkZWZlcnJlZFROb2RlIFROb2RlIGRlZmluaW5nIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAgaW4gdGhlIHZpZXcgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIncyB2aWV3LlxuICogICBBIG5lZ2F0aXZlIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBibG9jaydzIHBsYWNlaG9sZGVyLCB3aGlsZSBhbiB1bmRlZmluZWRcbiAqICAgdmFsdWUgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSBMVmlldyBhcyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIGdldFRyaWdnZXJMVmlldyhcbiAgICBkZWZlcnJlZEhvc3RMVmlldzogTFZpZXcsIGRlZmVycmVkVE5vZGU6IFROb2RlLCB3YWxrVXBUaW1lczogbnVtYmVyfHVuZGVmaW5lZCk6IExWaWV3fG51bGwge1xuICAvLyBUaGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSB2aWV3LCB3ZSBkb24ndCBuZWVkIHRvIHRyYXZlcnNlLlxuICBpZiAod2Fsa1VwVGltZXMgPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWZlcnJlZEhvc3RMVmlldztcbiAgfVxuXG4gIC8vIEEgcG9zaXRpdmUgdmFsdWUgb3IgemVybyBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluIGEgcGFyZW50IHZpZXcuXG4gIGlmICh3YWxrVXBUaW1lcyA+PSAwKSB7XG4gICAgcmV0dXJuIHdhbGtVcFZpZXdzKHdhbGtVcFRpbWVzLCBkZWZlcnJlZEhvc3RMVmlldyk7XG4gIH1cblxuICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVnYXRpdmUsIGl0IG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBwbGFjZWhvbGRlci5cbiAgY29uc3QgZGVmZXJyZWRDb250YWluZXIgPSBkZWZlcnJlZEhvc3RMVmlld1tkZWZlcnJlZFROb2RlLmluZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVmZXJyZWRDb250YWluZXIpO1xuICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBkZWZlcnJlZENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF0gPz8gbnVsbDtcblxuICAvLyBXZSBuZWVkIHRvIG51bGwgY2hlY2ssIGJlY2F1c2UgdGhlIHBsYWNlaG9sZGVyIG1pZ2h0IG5vdCBoYXZlIGJlZW4gcmVuZGVyZWQgeWV0LlxuICBpZiAobmdEZXZNb2RlICYmIHRyaWdnZXJMVmlldyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGRlZmVycmVkSG9zdExWaWV3LCBkZWZlcnJlZFROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICByZW5kZXJlZFN0YXRlLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsXG4gICAgICAgICdFeHBlY3RlZCBhIHBsYWNlaG9sZGVyIHRvIGJlIHJlbmRlcmVkIGluIHRoaXMgZGVmZXIgYmxvY2suJyk7XG4gICAgYXNzZXJ0TFZpZXcodHJpZ2dlckxWaWV3KTtcbiAgfVxuXG4gIHJldHVybiB0cmlnZ2VyTFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZWxlbWVudCB0aGF0IGEgZGVmZXJyZWQgYmxvY2sncyB0cmlnZ2VyIGlzIHBvaW50aW5nIHRvLlxuICogQHBhcmFtIHRyaWdnZXJMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgdHJpZ2dlciBpcyBkZWZpbmVkLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgdHJpZ2dlciBlbGVtZW50IHNob3VsZCd2ZSBiZWVuIHJlbmRlcmVkLlxuICovXG5mdW5jdGlvbiBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXc6IExWaWV3LCB0cmlnZ2VySW5kZXg6IG51bWJlcik6IEVsZW1lbnQge1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChIRUFERVJfT0ZGU0VUICsgdHJpZ2dlckluZGV4LCB0cmlnZ2VyTFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RWxlbWVudChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBET00tbm9kZSBiYXNlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGluaXRpYWxMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXIgYmxvY2sgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgcmVwcmVzZW50aW5nIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cC9kb3duIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIHJlZ2lzdGVyRm4gRnVuY3Rpb24gdGhhdCB3aWxsIHJlZ2lzdGVyIHRoZSBET00gZXZlbnRzLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciByZWNlaXZlcyB0aGUgZXZlbnQgdGhhdCBzaG91bGQgcmVuZGVyXG4gKiAgICAgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5mdW5jdGlvbiByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgaW5pdGlhbExWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCB0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM6IG51bWJlcnx1bmRlZmluZWQsXG4gICAgcmVnaXN0ZXJGbjogKGVsZW1lbnQ6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3RvcikgPT4gVm9pZEZ1bmN0aW9uLFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBpbml0aWFsTFZpZXdbSU5KRUNUT1JdITtcblxuICAvLyBBc3N1bXB0aW9uOiB0aGUgYGFmdGVyUmVuZGVyYCByZWZlcmVuY2Ugc2hvdWxkIGJlIGRlc3Ryb3llZFxuICAvLyBhdXRvbWF0aWNhbGx5IHNvIHdlIGRvbid0IG5lZWQgdG8ga2VlcCB0cmFjayBvZiBpdC5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJSZWYgPSBhZnRlclJlbmRlcigoKSA9PiB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaW5pdGlhbExWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcblxuICAgIC8vIElmIHRoZSBibG9jayB3YXMgbG9hZGVkIGJlZm9yZSB0aGUgdHJpZ2dlciB3YXMgcmVzb2x2ZWQsIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmcuXG4gICAgaWYgKHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwgJiZcbiAgICAgICAgcmVuZGVyZWRTdGF0ZSAhPT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKSB7XG4gICAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZ2V0VHJpZ2dlckxWaWV3KGluaXRpYWxMVmlldywgdE5vZGUsIHdhbGtVcFRpbWVzKTtcblxuICAgIC8vIEtlZXAgcG9sbGluZyB1bnRpbCB3ZSByZXNvbHZlIHRoZSB0cmlnZ2VyJ3MgTFZpZXcuXG4gICAgLy8gYGFmdGVyUmVuZGVyYCBzaG91bGQgc3RvcCBhdXRvbWF0aWNhbGx5IGlmIHRoZSB2aWV3IGlzIGRlc3Ryb3llZC5cbiAgICBpZiAoIXRyaWdnZXJMVmlldykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgdHJpZ2dlcidzIHZpZXcgd2FzIGRlc3Ryb3llZCBiZWZvcmUgd2UgcmVzb2x2ZWQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAgICBpZiAodHJpZ2dlckxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSB7XG4gICAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYWRkIGludGVncmF0aW9uIHdpdGggYERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcmAuXG4gICAgY29uc3QgZWxlbWVudCA9IGdldFRyaWdnZXJFbGVtZW50KHRyaWdnZXJMVmlldywgdHJpZ2dlckluZGV4KTtcbiAgICBjb25zdCBjbGVhbnVwID0gcmVnaXN0ZXJGbihlbGVtZW50LCAoKSA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcbiAgICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgICByZW1vdmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgICAgfVxuICAgICAgY2xlYW51cCgpO1xuICAgIH0sIGluamVjdG9yKTtcblxuICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICBzdG9yZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG5cbiAgICAvLyBTaW5jZSB0aGUgdHJpZ2dlciBhbmQgZGVmZXJyZWQgYmxvY2sgbWlnaHQgYmUgaW4gZGlmZmVyZW50XG4gICAgLy8gdmlld3MsIHdlIGhhdmUgdG8gcmVnaXN0ZXIgdGhlIGNhbGxiYWNrIGluIGJvdGggbG9jYXRpb25zLlxuICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgc3RvcmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgIH1cbiAgfSwge2luamVjdG9yfSk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHNjaGVkdWxlIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIGEgYnJvd3NlciBiZWNvbWVzIGlkbGUuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCB3aGVuIGEgYnJvd3NlciBiZWNvbWVzIGlkbGUuXG4gKiBAcGFyYW0gbFZpZXcgQW4gb3B0aW9uYWwgTFZpZXcgdGhhdCBob3N0cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLiBMVmlldyBpc1xuICogICAgdXNlZCB0byByZWdpc3RlciBhIGNsZWFudXAgY2FsbGJhY2sgaW4gY2FzZSB0aGF0IExWaWV3IGdvdCBkZXN0cm95ZWQgYmVmb3JlXG4gKiAgICBjYWxsYmFjayB3YXMgaW52b2tlZC4gSW4gdGhpcyBjYXNlLCBhbiBgaWRsZWAgY2FsbGJhY2sgaXMgbmV2ZXIgaW52b2tlZC4gVGhpcyBpc1xuICogICAgaGVscGZ1bCBmb3IgY2FzZXMgd2hlbiBhIGRlZmVyIGJsb2NrIGhhcyBzY2hlZHVsZWQgcmVuZGVyaW5nLCBidXQgYW4gdW5kZXJseWluZ1xuICogICAgTFZpZXcgZ290IGRlc3Ryb3llZCBwcmlvciB0byB0aCBibG9jayByZW5kZXJpbmcuXG4gKi9cbmZ1bmN0aW9uIG9uSWRsZShjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXd8bnVsbCk6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBpZDogbnVtYmVyO1xuICBjb25zdCByZW1vdmVJZGxlQ2FsbGJhY2sgPSAoKSA9PiBfY2FuY2VsSWRsZUNhbGxiYWNrKGlkKTtcbiAgaWQgPSBfcmVxdWVzdElkbGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICByZW1vdmVJZGxlQ2FsbGJhY2soKTtcbiAgICAgICAgIGlmIChsVmlldyAhPT0gbnVsbCkge1xuICAgICAgICAgICAvLyBUaGUgaWRsZSBjYWxsYmFjayBpcyBpbnZva2VkLCB3ZSBubyBsb25nZXIgbmVlZFxuICAgICAgICAgICAvLyB0byByZXRhaW4gYSBjbGVhbnVwIGNhbGxiYWNrIGluIGFuIExWaWV3LlxuICAgICAgICAgICByZW1vdmVMVmlld09uRGVzdHJveShsVmlldywgcmVtb3ZlSWRsZUNhbGxiYWNrKTtcbiAgICAgICAgIH1cbiAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgfSkgYXMgbnVtYmVyO1xuXG4gIGlmIChsVmlldyAhPT0gbnVsbCkge1xuICAgIC8vIFN0b3JlIGEgY2xlYW51cCBmdW5jdGlvbiBvbiBMVmlldywgc28gdGhhdCB3ZSBjYW5jZWwgaWRsZVxuICAgIC8vIGNhbGxiYWNrIGluIGNhc2UgdGhpcyBMVmlldyBpcyBkZXN0cm95ZWQgYmVmb3JlIGEgY2FsbGJhY2tcbiAgICAvLyBpcyBpbnZva2VkLlxuICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3kobFZpZXcsIHJlbW92ZUlkbGVDYWxsYmFjayk7XG4gIH1cbiAgcmV0dXJuIHJlbW92ZUlkbGVDYWxsYmFjaztcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgZGF0YSBzbG90IGluZGV4IGZvciBkZWZlciBibG9jayBpbmZvIChlaXRoZXIgc3RhdGljIG9yXG4gKiBpbnN0YW5jZS1zcGVjaWZpYyksIGdpdmVuIGFuIGluZGV4IG9mIGEgZGVmZXIgaW5zdHJ1Y3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4OiBudW1iZXIpIHtcbiAgLy8gSW5zdGFuY2Ugc3RhdGUgaXMgbG9jYXRlZCBhdCB0aGUgKm5leHQqIHBvc2l0aW9uXG4gIC8vIGFmdGVyIHRoZSBkZWZlciBibG9jayBzbG90IGluIGFuIExWaWV3IG9yIFRWaWV3LmRhdGEuXG4gIHJldHVybiBkZWZlckJsb2NrSW5kZXggKyAxO1xufVxuXG4vKiogUmV0cmlldmVzIGEgZGVmZXIgYmxvY2sgc3RhdGUgZnJvbSBhbiBMVmlldywgZ2l2ZW4gYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBibG9jay4gKi9cbmZ1bmN0aW9uIGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IExEZWZlckJsb2NrRGV0YWlscyB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KHROb2RlLmluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHJldHVybiBsVmlld1tzbG90SW5kZXhdO1xufVxuXG4vKiogU3RvcmVzIGEgZGVmZXIgYmxvY2sgaW5zdGFuY2Ugc3RhdGUgaW4gTFZpZXcuICovXG5mdW5jdGlvbiBzZXRMRGVmZXJCbG9ja0RldGFpbHMoXG4gICAgbFZpZXc6IExWaWV3LCBkZWZlckJsb2NrSW5kZXg6IG51bWJlciwgbERldGFpbHM6IExEZWZlckJsb2NrRGV0YWlscykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgbFZpZXdbc2xvdEluZGV4XSA9IGxEZXRhaWxzO1xufVxuXG4vKiogUmV0cmlldmVzIHN0YXRpYyBpbmZvIGFib3V0IGEgZGVmZXIgYmxvY2ssIGdpdmVuIGEgVFZpZXcgYW5kIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmxvY2suICovXG5mdW5jdGlvbiBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiBURGVmZXJCbG9ja0RldGFpbHMge1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KHROb2RlLmluZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHJldHVybiB0Vmlldy5kYXRhW3Nsb3RJbmRleF0gYXMgVERlZmVyQmxvY2tEZXRhaWxzO1xufVxuXG4vKiogU3RvcmVzIGEgZGVmZXIgYmxvY2sgc3RhdGljIGluZm8gaW4gYFRWaWV3LmRhdGFgLiAqL1xuZnVuY3Rpb24gc2V0VERlZmVyQmxvY2tEZXRhaWxzKFxuICAgIHRWaWV3OiBUVmlldywgZGVmZXJCbG9ja0luZGV4OiBudW1iZXIsIGRlZmVyQmxvY2tDb25maWc6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICB0Vmlldy5kYXRhW3Nsb3RJbmRleF0gPSBkZWZlckJsb2NrQ29uZmlnO1xufVxuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgaG9zdExWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogbnVtYmVyfG51bGwge1xuICBjb25zdCB0VmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgc3dpdGNoIChuZXdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLnByaW1hcnlUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuTG9hZGluZzpcbiAgICAgIHJldHVybiB0RGV0YWlscy5sb2FkaW5nVG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkVycm9yOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLmVycm9yVG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLnBsYWNlaG9sZGVyVG1wbEluZGV4O1xuICAgIGRlZmF1bHQ6XG4gICAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcihgVW5leHBlY3RlZCBkZWZlciBibG9jayBzdGF0ZTogJHtuZXdTdGF0ZX1gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbnMgYSBkZWZlciBibG9jayB0byB0aGUgbmV3IHN0YXRlLiBVcGRhdGVzIHRoZSAgbmVjZXNzYXJ5XG4gKiBkYXRhIHN0cnVjdHVyZXMgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBibG9jay5cbiAqXG4gKiBAcGFyYW0gbmV3U3RhdGUgTmV3IHN0YXRlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVmZXJCbG9ja1N0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IHZvaWQge1xuICBjb25zdCBob3N0TFZpZXcgPSBsQ29udGFpbmVyW1BBUkVOVF07XG5cbiAgLy8gQ2hlY2sgaWYgdGhpcyB2aWV3IGlzIG5vdCBkZXN0cm95ZWQuIFNpbmNlIHRoZSBsb2FkaW5nIHByb2Nlc3Mgd2FzIGFzeW5jLFxuICAvLyB0aGUgdmlldyBtaWdodCBlbmQgdXAgYmVpbmcgZGVzdHJveWVkIGJ5IHRoZSB0aW1lIHJlbmRlcmluZyBoYXBwZW5zLlxuICBpZiAoaXNEZXN0cm95ZWQoaG9zdExWaWV3KSkgcmV0dXJuO1xuXG4gIC8vIE1ha2Ugc3VyZSB0aGlzIFROb2RlIGJlbG9uZ3MgdG8gVFZpZXcgdGhhdCByZXByZXNlbnRzIGhvc3QgTFZpZXcuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHROb2RlLCBob3N0TFZpZXcpO1xuXG4gIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGhvc3RMVmlldywgdE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxEZXRhaWxzLCAnRXhwZWN0ZWQgYSBkZWZlciBibG9jayBzdGF0ZSBkZWZpbmVkJyk7XG5cbiAgY29uc3Qgc3RhdGVUbXBsSW5kZXggPSBnZXRUZW1wbGF0ZUluZGV4Rm9yU3RhdGUobmV3U3RhdGUsIGhvc3RMVmlldywgdE5vZGUpO1xuICAvLyBOb3RlOiB3ZSB0cmFuc2l0aW9uIHRvIHRoZSBuZXh0IHN0YXRlIGlmIHRoZSBwcmV2aW91cyBzdGF0ZSB3YXMgcmVwcmVzZW50ZWRcbiAgLy8gd2l0aCBhIG51bWJlciB0aGF0IGlzIGxlc3MgdGhhbiB0aGUgbmV4dCBzdGF0ZS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBjdXJyZW50XG4gIC8vIHN0YXRlIGlzIFwibG9hZGluZ1wiIChyZXByZXNlbnRlZCBhcyBgMmApLCB3ZSBzaG91bGQgbm90IHNob3cgYSBwbGFjZWhvbGRlclxuICAvLyAocmVwcmVzZW50ZWQgYXMgYDFgKS5cbiAgaWYgKGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA8IG5ld1N0YXRlICYmIHN0YXRlVG1wbEluZGV4ICE9PSBudWxsKSB7XG4gICAgbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdID0gbmV3U3RhdGU7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gc3RhdGVUbXBsSW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaG9zdFRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcblxuICAgIC8vIFRoZXJlIGlzIG9ubHkgMSB2aWV3IHRoYXQgY2FuIGJlIHByZXNlbnQgaW4gYW4gTENvbnRhaW5lciB0aGF0XG4gICAgLy8gcmVwcmVzZW50cyBhIGB7I2RlZmVyfWAgYmxvY2ssIHNvIGFsd2F5cyByZWZlciB0byB0aGUgZmlyc3Qgb25lLlxuICAgIGNvbnN0IHZpZXdJbmRleCA9IDA7XG5cbiAgICByZW1vdmVMVmlld0Zyb21MQ29udGFpbmVyKGxDb250YWluZXIsIHZpZXdJbmRleCk7XG4gICAgY29uc3QgZGVoeWRyYXRlZFZpZXcgPSBmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlldyhsQ29udGFpbmVyLCB0Tm9kZS50VmlldyEuc3NySWQpO1xuICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBjcmVhdGVBbmRSZW5kZXJFbWJlZGRlZExWaWV3KGhvc3RMVmlldywgdE5vZGUsIG51bGwsIHtkZWh5ZHJhdGVkVmlld30pO1xuICAgIGFkZExWaWV3VG9MQ29udGFpbmVyKFxuICAgICAgICBsQ29udGFpbmVyLCBlbWJlZGRlZExWaWV3LCB2aWV3SW5kZXgsIHNob3VsZEFkZFZpZXdUb0RvbSh0Tm9kZSwgZGVoeWRyYXRlZFZpZXcpKTtcbiAgfVxufVxuXG4vKipcbiAqIFRyaWdnZXIgcHJlZmV0Y2hpbmcgb2YgZGVwZW5kZW5jaWVzIGZvciBhIGRlZmVyIGJsb2NrLlxuICpcbiAqIEBwYXJhbSB0RGV0YWlscyBTdGF0aWMgaW5mb3JtYXRpb24gYWJvdXQgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyBvZiBhIGhvc3Qgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGxWaWV3W0lOSkVDVE9SXSAmJiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhsVmlld1tJTkpFQ1RPUl0hKSkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRyaWdnZXIgbG9hZGluZyBvZiBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgaWYgdGhlIHByb2Nlc3MgaGFzbid0IHN0YXJ0ZWQgeWV0LlxuICpcbiAqIEBwYXJhbSB0RGV0YWlscyBTdGF0aWMgaW5mb3JtYXRpb24gYWJvdXQgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyBvZiBhIGhvc3Qgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgbFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSAhPT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBJZiB0aGUgbG9hZGluZyBzdGF0dXMgaXMgZGlmZmVyZW50IGZyb20gaW5pdGlhbCBvbmUsIGl0IG1lYW5zIHRoYXRcbiAgICAvLyB0aGUgbG9hZGluZyBvZiBkZXBlbmRlbmNpZXMgaXMgaW4gcHJvZ3Jlc3MgYW5kIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG9cbiAgICAvLyBpbiB0aGlzIGZ1bmN0aW9uLiBBbGwgZGV0YWlscyBjYW4gYmUgb2J0YWluZWQgZnJvbSB0aGUgYHREZXRhaWxzYCBvYmplY3QuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcHJpbWFyeUJsb2NrVE5vZGUgPSBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldywgdERldGFpbHMpO1xuXG4gIC8vIFN3aXRjaCBmcm9tIE5PVF9TVEFSVEVEIC0+IElOX1BST0dSRVNTIHN0YXRlLlxuICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUztcblxuICAvLyBDaGVjayBpZiBkZXBlbmRlbmN5IGZ1bmN0aW9uIGludGVyY2VwdG9yIGlzIGNvbmZpZ3VyZWQuXG4gIGNvbnN0IGRlZmVyRGVwZW5kZW5jeUludGVyY2VwdG9yID1cbiAgICAgIGluamVjdG9yLmdldChERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICBjb25zdCBkZXBlbmRlbmNpZXNGbiA9IGRlZmVyRGVwZW5kZW5jeUludGVyY2VwdG9yID9cbiAgICAgIGRlZmVyRGVwZW5kZW5jeUludGVyY2VwdG9yLmludGVyY2VwdCh0RGV0YWlscy5kZXBlbmRlbmN5UmVzb2x2ZXJGbikgOlxuICAgICAgdERldGFpbHMuZGVwZW5kZW5jeVJlc29sdmVyRm47XG5cbiAgLy8gVGhlIGBkZXBlbmRlbmNpZXNGbmAgbWlnaHQgYmUgYG51bGxgIHdoZW4gYWxsIGRlcGVuZGVuY2llcyB3aXRoaW5cbiAgLy8gYSBnaXZlbiBgeyNkZWZlcn1gIGJsb2NrIHdlcmUgZWFnZXJseSByZWZlcmVuY2VzIGVsc2V3aGVyZSBpbiBhIGZpbGUsXG4gIC8vIHRodXMgbm8gZHluYW1pYyBgaW1wb3J0KClgcyB3ZXJlIHByb2R1Y2VkLlxuICBpZiAoIWRlcGVuZGVuY2llc0ZuKSB7XG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIERlZmVyIGJsb2NrIG1heSBoYXZlIG11bHRpcGxlIHByZWZldGNoIHRyaWdnZXJzLiBPbmNlIHRoZSBsb2FkaW5nXG4gIC8vIHN0YXJ0cywgaW52b2tlIGFsbCBjbGVhbiBmdW5jdGlvbnMsIHNpbmNlIHRoZXkgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG4gIGludm9rZVREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMpO1xuXG4gIC8vIFN0YXJ0IGRvd25sb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLmFsbFNldHRsZWQoZGVwZW5kZW5jaWVzRm4oKSkudGhlbihyZXN1bHRzID0+IHtcbiAgICBsZXQgZmFpbGVkID0gZmFsc2U7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdCA9IFtdO1xuICAgIGNvbnN0IHBpcGVEZWZzOiBQaXBlRGVmTGlzdCA9IFtdO1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSByZXN1bHQudmFsdWU7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGdldENvbXBvbmVudERlZihkZXBlbmRlbmN5KSB8fCBnZXREaXJlY3RpdmVEZWYoZGVwZW5kZW5jeSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVEZWYpIHtcbiAgICAgICAgICBkaXJlY3RpdmVEZWZzLnB1c2goZGlyZWN0aXZlRGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwaXBlRGVmID0gZ2V0UGlwZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgICBpZiAocGlwZURlZikge1xuICAgICAgICAgICAgcGlwZURlZnMucHVzaChwaXBlRGVmKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvYWRpbmcgaXMgY29tcGxldGVkLCB3ZSBubyBsb25nZXIgbmVlZCB0aGlzIFByb21pc2UuXG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuXG4gICAgaWYgKGZhaWxlZCkge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEO1xuICAgIH0gZWxzZSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTtcblxuICAgICAgLy8gVXBkYXRlIGRpcmVjdGl2ZSBhbmQgcGlwZSByZWdpc3RyaWVzIHRvIGFkZCBuZXdseSBkb3dubG9hZGVkIGRlcGVuZGVuY2llcy5cbiAgICAgIGNvbnN0IHByaW1hcnlCbG9ja1RWaWV3ID0gcHJpbWFyeUJsb2NrVE5vZGUudFZpZXchO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSA9IHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID9cbiAgICAgICAgICAgIFsuLi5wcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgLi4uZGlyZWN0aXZlRGVmc10gOlxuICAgICAgICAgICAgZGlyZWN0aXZlRGVmcztcbiAgICAgIH1cbiAgICAgIGlmIChwaXBlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA9IHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA/XG4gICAgICAgICAgICBbLi4ucHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5LCAuLi5waXBlRGVmc10gOlxuICAgICAgICAgICAgcGlwZURlZnM7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVuZGVyIGB7OnBsYWNlaG9sZGVyfWAgY29udGVudCAoaWYgcHJlc2VudCkgKi9cbmZ1bmN0aW9uIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLCB0Tm9kZSwgbENvbnRhaW5lcik7XG59XG5cbi8qKlxuICogU3Vic2NyaWJlcyB0byB0aGUgXCJsb2FkaW5nXCIgUHJvbWlzZSBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGRlZmVyIHN1Yi1ibG9jayxcbiAqIGJhc2VkIG9uIHRoZSBsb2FkaW5nIHJlc3VsdHMuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFJlcHJlc2VudHMgZGVmZXIgYmxvY2sgaW5mbyBzaGFyZWQgYWNyb3NzIGFsbCBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyhcbiAgICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlLCAnRXhwZWN0ZWQgbG9hZGluZyBQcm9taXNlIHRvIGV4aXN0IG9uIHRoaXMgZGVmZXIgYmxvY2snKTtcblxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSEudGhlbigoKSA9PiB7XG4gICAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG5cbiAgICAgIC8vIEV2ZXJ5dGhpbmcgaXMgbG9hZGVkLCBzaG93IHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnRcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiogUmV0cmlldmVzIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIG1haW4gY29udGVudCBvZiBhIGRlZmVyIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXc6IFRWaWV3LCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKTogVENvbnRhaW5lck5vZGUge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gdERldGFpbHMucHJpbWFyeVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIHJldHVybiBnZXRUTm9kZSh0VmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gdHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAqIElmIHRoZSBibG9jayBpcyBhbHJlYWR5IGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlIC1cbiAqIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgdGFrZW4uXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBDb25kaXRpb24gaXMgdHJpZ2dlcmVkLCB0cnkgdG8gcmVuZGVyIGxvYWRpbmcgc3RhdGUgYW5kIHN0YXJ0IGRvd25sb2FkaW5nLlxuICAvLyBOb3RlOiBpZiBhIGJsb2NrIGlzIGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlLCB0aGlzIGNhbGwgd291bGQgYmUgYSBub29wLlxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmcsIHROb2RlLCBsQ29udGFpbmVyKTtcblxuICBzd2l0Y2ggKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSkge1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQ6XG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCBsVmlldyk7XG5cbiAgICAgIC8vIFRoZSBgbG9hZGluZ1N0YXRlYCBtaWdodCBoYXZlIGNoYW5nZWQgdG8gXCJsb2FkaW5nXCIuXG4gICAgICBpZiAoKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSBhcyBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSkgPT09XG4gICAgICAgICAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1MpIHtcbiAgICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTOlxuICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFOlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuQ29tcGxldGUsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEOlxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgdGhyb3dFcnJvcignVW5rbm93biBkZWZlciBibG9jayBzdGF0ZScpO1xuICAgICAgfVxuICB9XG59XG5cbi8qKlxuICogQXNzZXJ0cyB3aGV0aGVyIGFsbCBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2sgYXJlIGxvYWRlZC5cbiAqIEFsd2F5cyBydW4gdGhpcyBmdW5jdGlvbiAoaW4gZGV2IG1vZGUpIGJlZm9yZSByZW5kZXJpbmcgYSBkZWZlclxuICogYmxvY2sgaW4gY29tcGxldGVkIHN0YXRlLlxuICovXG5mdW5jdGlvbiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlLCBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSxcbiAgICAgICdFeHBlY3RpbmcgYWxsIGRlZmVycmVkIGRlcGVuZGVuY2llcyB0byBiZSBsb2FkZWQuJyk7XG59XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIERlc2NyaWJlcyBhIGhlbHBlciBjbGFzcyB0aGF0IGFsbG93cyB0byBpbnRlcmNlcHQgYSBjYWxsIHRvIHJldHJpZXZlIGN1cnJlbnRcbiAqIGRlcGVuZGVuY3kgbG9hZGluZyBmdW5jdGlvbiBhbmQgcmVwbGFjZSBpdCB3aXRoIGEgZGlmZmVyZW50IGltcGxlbWVudGF0aW9uLlxuICogVGhpcyBpbnRlcmNlcHRvciBjbGFzcyBpcyBuZWVkZWQgdG8gYWxsb3cgdGVzdGluZyBibG9ja3MgaW4gZGlmZmVyZW50IHN0YXRlc1xuICogYnkgc2ltdWxhdGluZyBsb2FkaW5nIHJlc3BvbnNlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3Ige1xuICAvKipcbiAgICogSW52b2tlZCBmb3IgZWFjaCBkZWZlciBibG9jayB3aGVuIGRlcGVuZGVuY3kgbG9hZGluZyBmdW5jdGlvbiBpcyBhY2Nlc3NlZC5cbiAgICovXG4gIGludGVyY2VwdChkZXBlbmRlbmN5Rm46IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwpOiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsO1xuXG4gIC8qKlxuICAgKiBBbGxvd3MgdG8gY29uZmlndXJlIGFuIGludGVyY2VwdG9yIGZ1bmN0aW9uLlxuICAgKi9cbiAgc2V0SW50ZXJjZXB0b3IoaW50ZXJjZXB0b3JGbjogKGN1cnJlbnQ6IERlcGVuZGVuY3lSZXNvbHZlckZuKSA9PiBEZXBlbmRlbmN5UmVzb2x2ZXJGbik6IHZvaWQ7XG59XG5cbi8qKlxuICogKipJTlRFUk5BTCoqLCBhdm9pZCByZWZlcmVuY2luZyBpdCBpbiBhcHBsaWNhdGlvbiBjb2RlLlxuICpcbiAqIEluamVjdG9yIHRva2VuIHRoYXQgYWxsb3dzIHRvIHByb3ZpZGUgYERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3JgIGNsYXNzXG4gKiBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yPihcbiAgICAgICAgbmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1InIDogJycpO1xuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiB2YWx1ZSBtYXRjaGVzIHRoZSBleHBlY3RlZCBzdHJ1Y3R1cmUgb2YgYSBkZWZlciBibG9ja1xuICpcbiAqIFdlIGNhbiBzYWZlbHkgcmVseSBvbiB0aGUgcHJpbWFyeVRtcGxJbmRleCBiZWNhdXNlIGV2ZXJ5IGRlZmVyIGJsb2NrIHJlcXVpcmVzXG4gKiB0aGF0IGEgcHJpbWFyeSB0ZW1wbGF0ZSBleGlzdHMuIEFsbCB0aGUgb3RoZXIgdGVtcGxhdGUgb3B0aW9ucyBhcmUgb3B0aW9uYWwuXG4gKi9cbmZ1bmN0aW9uIGlzVERlZmVyQmxvY2tEZXRhaWxzKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSAmJlxuICAgICAgKHR5cGVvZiAodmFsdWUgYXMgVERlZmVyQmxvY2tEZXRhaWxzKS5wcmltYXJ5VG1wbEluZGV4ID09PSAnbnVtYmVyJyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdXNlZCBmb3IgY29uZmlndXJpbmcgZGVmZXIgYmxvY2sgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19DT05GSUcgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxEZWZlckJsb2NrQ29uZmlnPihuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfQ09ORklHJyA6ICcnKTtcblxuLyoqXG4gKiBEZWZlciBibG9jayBpbnN0YW5jZSBmb3IgdGVzdGluZy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZlckJsb2NrRGV0YWlscyB7XG4gIGxDb250YWluZXI6IExDb250YWluZXI7XG4gIGxWaWV3OiBMVmlldztcbiAgdE5vZGU6IFROb2RlO1xuICB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbGwgZGVmZXIgYmxvY2tzIGluIGEgZ2l2ZW4gTFZpZXcuXG4gKlxuICogQHBhcmFtIGxWaWV3IGxWaWV3IHdpdGggZGVmZXIgYmxvY2tzXG4gKiBAcGFyYW0gZGVmZXJCbG9ja3MgZGVmZXIgYmxvY2sgYWdncmVnYXRvciBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmZXJCbG9ja3MobFZpZXc6IExWaWV3LCBkZWZlckJsb2NrczogRGVmZXJCbG9ja0RldGFpbHNbXSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpXTtcbiAgICAgIC8vIEFuIExDb250YWluZXIgbWF5IHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLCBpbiB3aGljaCBjYXNlXG4gICAgICAvLyB3ZSBzdG9yZSBpdCBhcyBhIHJlc3VsdC4gT3RoZXJ3aXNlLCBrZWVwIGl0ZXJhdGluZyBvdmVyIExDb250YWluZXIgdmlld3MgYW5kXG4gICAgICAvLyBsb29rIGZvciBkZWZlciBibG9ja3MuXG4gICAgICBjb25zdCBpc0xhc3QgPSBpID09PSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCAtIDE7XG4gICAgICBpZiAoIWlzTGFzdCkge1xuICAgICAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaV0gYXMgVE5vZGU7XG4gICAgICAgIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICAgIGlmIChpc1REZWZlckJsb2NrRGV0YWlscyh0RGV0YWlscykpIHtcbiAgICAgICAgICBkZWZlckJsb2Nrcy5wdXNoKHtsQ29udGFpbmVyLCBsVmlldywgdE5vZGUsIHREZXRhaWxzfSk7XG4gICAgICAgICAgLy8gVGhpcyBMQ29udGFpbmVyIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gd2UgZXhpdFxuICAgICAgICAgIC8vIHRoaXMgaXRlcmF0aW9uIGFuZCBkb24ndCBpbnNwZWN0IHZpZXdzIGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICBnZXREZWZlckJsb2NrcyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBkZWZlckJsb2Nrcyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0xWaWV3KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgZW50ZXIgdGhlIGBnZXREZWZlckJsb2Nrc2AgcmVjdXJzaXZlbHkuXG4gICAgICBnZXREZWZlckJsb2NrcyhsVmlld1tpXSwgZGVmZXJCbG9ja3MpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIGNsZWFudXAgZnVuY3Rpb24gYXNzb2NpYXRlZCB3aXRoIGEgcHJlZmV0Y2hpbmcgdHJpZ2dlclxuICogb2YgYSBnaXZlbiBkZWZlciBibG9jay5cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2xlYW51cEZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuYWRkKHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG59XG5cbi8qKlxuICogSW52b2tlcyBhbGwgcmVnaXN0ZXJlZCBwcmVmZXRjaCBjbGVhbnVwIHRyaWdnZXJzXG4gKiBhbmQgcmVtb3ZlcyBhbGwgY2xlYW51cCBmdW5jdGlvbnMgYWZ0ZXJ3YXJkcy5cbiAqL1xuZnVuY3Rpb24gaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yOiBJbmplY3RvciwgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKS5jbGVhbnVwKHREZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBzZXJ2aWNlIHRvIGtlZXAgdHJhY2sgb2YgY2xlYW51cCBmdW5jdGlvbnMgYXNzb2NpYXRlZFxuICogd2l0aCBkZWZlciBibG9ja3MuIFRoaXMgY2xhc3MgaXMgdXNlZCB0byBtYW5hZ2UgY2xlYW51cCBmdW5jdGlvbnNcbiAqIGNyZWF0ZWQgZm9yIHByZWZldGNoaW5nIHRyaWdnZXJzLlxuICovXG5jbGFzcyBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIge1xuICBwcml2YXRlIGJsb2NrcyA9IG5ldyBNYXA8VERlZmVyQmxvY2tEZXRhaWxzLCBNYXA8c3RyaW5nLCBWb2lkRnVuY3Rpb25bXT4+KCk7XG5cbiAgYWRkKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgaWYgKCF0aGlzLmJsb2Nrcy5oYXModERldGFpbHMpKSB7XG4gICAgICB0aGlzLmJsb2Nrcy5zZXQodERldGFpbHMsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKSE7XG4gICAgaWYgKCFibG9jay5oYXMoa2V5KSkge1xuICAgICAgYmxvY2suc2V0KGtleSwgW10pO1xuICAgIH1cbiAgICBjb25zdCBjYWxsYmFja3MgPSBibG9jay5nZXQoa2V5KSE7XG4gICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgaGFzKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKT8uaGFzKGtleSk7XG4gIH1cblxuICBjbGVhbnVwKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk7XG4gICAgaWYgKGJsb2NrKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrcyBvZiBPYmplY3QudmFsdWVzKGJsb2NrKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGNhbGxiYWNrcykge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuYmxvY2tzLmRlbGV0ZSh0RGV0YWlscyk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgZm9yIChjb25zdCBbYmxvY2tdIG9mIHRoaXMuYmxvY2tzKSB7XG4gICAgICB0aGlzLmNsZWFudXAoYmxvY2spO1xuICAgIH1cbiAgICB0aGlzLmJsb2Nrcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKCksXG4gIH0pO1xufVxuIl19