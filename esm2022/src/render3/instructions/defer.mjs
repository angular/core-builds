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
 * Sets up logic to handle the `on idle` deferred trigger.
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
            const cleanupFn = onIdle(() => triggerPrefetching(tDetails, lView), null /* LView */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFZLGtCQUFrQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN4RixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNyRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQW9CLHVCQUF1QixFQUFFLGVBQWUsRUFBc0IsNkJBQTZCLEVBQTJILE1BQU0scUJBQXFCLENBQUM7QUFHblQsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0UsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFxQixNQUFNLEVBQUUsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDM0cs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QUMsRUFBRTtnQkFDNUMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7b0JBQ2hDLFFBQVEsRUFBRSxDQUFDO2lCQUNaO2FBQ0Y7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5QjtJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsS0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3JCO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsd0JBQXdCO1FBQy9CLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLHdCQUF3QixFQUFFO0tBQzlDLENBQUMsQUFKVSxDQUlUIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW4sIEluamVjdG9yLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7cG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcn0gZnJvbSAnLi4vLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVsZW1lbnQsIGFzc2VydEVxdWFsLCB0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2FmdGVyUmVuZGVyfSBmcm9tICcuLi9hZnRlcl9yZW5kZXJfaG9va3MnO1xuaW1wb3J0IHthc3NlcnRJbmRleEluRGVjbFJhbmdlLCBhc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtERUZFUl9CTE9DS19TVEFURSwgRGVmZXJCbG9ja0JlaGF2aW9yLCBEZWZlckJsb2NrQ29uZmlnLCBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlLCBEZWZlckJsb2NrVHJpZ2dlcnMsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLCBEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZywgRGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnLCBEZXBlbmRlbmN5UmVzb2x2ZXJGbiwgTERlZmVyQmxvY2tEZXRhaWxzLCBURGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0Rlc3Ryb3llZCwgaXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBUVklFVywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkVE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0VE5vZGUsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95LCB3YWxrVXBWaWV3c30gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vdmlld19tYW5pcHVsYXRpb24nO1xuXG5pbXBvcnQge29uSG92ZXIsIG9uSW50ZXJhY3Rpb24sIG9uVmlld3BvcnR9IGZyb20gJy4vZGVmZXJfZXZlbnRzJztcbmltcG9ydCB7ybXJtXRlbXBsYXRlfSBmcm9tICcuL3RlbXBsYXRlJztcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgZGVmZXIgYmxvY2tzIHNob3VsZCBiZSB0cmlnZ2VyZWQuXG4gKlxuICogQ3VycmVudGx5LCBkZWZlciBibG9ja3MgYXJlIG5vdCB0cmlnZ2VyZWQgb24gdGhlIHNlcnZlcixcbiAqIG9ubHkgcGxhY2Vob2xkZXIgY29udGVudCBpcyByZW5kZXJlZCAoaWYgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcjogSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgY29uc3QgY29uZmlnID0gaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0NPTkZJRywgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gIGlmIChjb25maWc/LmJlaGF2aW9yID09PSBEZWZlckJsb2NrQmVoYXZpb3IuTWFudWFsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBpc1BsYXRmb3JtQnJvd3NlcihpbmplY3Rvcik7XG59XG5cbi8qKlxuICogU2hpbXMgZm9yIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgYW5kIGBjYW5jZWxJZGxlQ2FsbGJhY2tgIGZ1bmN0aW9ucyBmb3IgZW52aXJvbm1lbnRzXG4gKiB3aGVyZSB0aG9zZSBmdW5jdGlvbnMgYXJlIG5vdCBhdmFpbGFibGUgKGUuZy4gTm9kZS5qcykuXG4gKi9cbmNvbnN0IF9yZXF1ZXN0SWRsZUNhbGxiYWNrID1cbiAgICB0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgPyByZXF1ZXN0SWRsZUNhbGxiYWNrIDogc2V0VGltZW91dDtcbmNvbnN0IF9jYW5jZWxJZGxlQ2FsbGJhY2sgPVxuICAgIHR5cGVvZiByZXF1ZXN0SWRsZUNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyA/IGNhbmNlbElkbGVDYWxsYmFjayA6IGNsZWFyVGltZW91dDtcblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciBkZWZlciBibG9ja3MuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBgZGVmZXJgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIHByaW1hcnlUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHByaW1hcnkgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmN5UmVzb2x2ZXJGbiBGdW5jdGlvbiB0aGF0IGNvbnRhaW5zIGRlcGVuZGVuY2llcyBmb3IgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsb2FkaW5nVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBsb2FkaW5nIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHBsYWNlaG9sZGVyIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZXJyb3JUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGVycm9yIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gbG9hZGluZ0NvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGxvYWRpbmcuXG4gKiAgICAgYmxvY2suXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJDb25maWdJbmRleEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgcGxhY2Vob2xkZXIgYmxvY2suXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcihcbiAgICBpbmRleDogbnVtYmVyLCBwcmltYXJ5VG1wbEluZGV4OiBudW1iZXIsIGRlcGVuZGVuY3lSZXNvbHZlckZuPzogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCxcbiAgICBsb2FkaW5nVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIHBsYWNlaG9sZGVyVG1wbEluZGV4PzogbnVtYmVyfG51bGwsXG4gICAgZXJyb3JUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCwgbG9hZGluZ0NvbmZpZ0luZGV4PzogbnVtYmVyfG51bGwsXG4gICAgcGxhY2Vob2xkZXJDb25maWdJbmRleD86IG51bWJlcnxudWxsKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcblxuICDJtcm1dGVtcGxhdGUoaW5kZXgsIG51bGwsIDAsIDApO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBjb25zdCBkZWZlckJsb2NrQ29uZmlnOiBURGVmZXJCbG9ja0RldGFpbHMgPSB7XG4gICAgICBwcmltYXJ5VG1wbEluZGV4LFxuICAgICAgbG9hZGluZ1RtcGxJbmRleDogbG9hZGluZ1RtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJUbXBsSW5kZXg6IHBsYWNlaG9sZGVyVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBlcnJvclRtcGxJbmRleDogZXJyb3JUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyQmxvY2tDb25maWc6IHBsYWNlaG9sZGVyQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnPih0Vmlld0NvbnN0cywgcGxhY2Vob2xkZXJDb25maWdJbmRleCkgOlxuICAgICAgICAgIG51bGwsXG4gICAgICBsb2FkaW5nQmxvY2tDb25maWc6IGxvYWRpbmdDb25maWdJbmRleCAhPSBudWxsID9cbiAgICAgICAgICBnZXRDb25zdGFudDxEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIGxvYWRpbmdDb25maWdJbmRleCkgOlxuICAgICAgICAgIG51bGwsXG4gICAgICBkZXBlbmRlbmN5UmVzb2x2ZXJGbjogZGVwZW5kZW5jeVJlc29sdmVyRm4gPz8gbnVsbCxcbiAgICAgIGxvYWRpbmdTdGF0ZTogRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQsXG4gICAgICBsb2FkaW5nUHJvbWlzZTogbnVsbCxcbiAgICB9O1xuXG4gICAgc2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCBhZGp1c3RlZEluZGV4LCBkZWZlckJsb2NrQ29uZmlnKTtcbiAgfVxuXG4gIC8vIExvb2t1cCBkZWh5ZHJhdGVkIHZpZXdzIHRoYXQgYmVsb25nIHRvIHRoaXMgTENvbnRhaW5lci5cbiAgLy8gSW4gY2xpZW50LW9ubHkgbW9kZSwgdGhpcyBvcGVyYXRpb24gaXMgbm9vcC5cbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdO1xuICBwb3B1bGF0ZURlaHlkcmF0ZWRWaWV3c0luQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIC8vIEluaXQgaW5zdGFuY2Utc3BlY2lmaWMgZGVmZXIgZGV0YWlscyBhbmQgc3RvcmUgaXQuXG4gIGNvbnN0IGxEZXRhaWxzID0gW107XG4gIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWw7XG4gIHNldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgYWRqdXN0ZWRJbmRleCwgbERldGFpbHMgYXMgTERlZmVyQmxvY2tEZXRhaWxzKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMgd2hlbiBhIHRyaWdnZXIgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHJhd1ZhbHVlKSkge1xuICAgIGNvbnN0IHZhbHVlID0gQm9vbGVhbihyYXdWYWx1ZSk7ICAvLyBoYW5kbGUgdHJ1dGh5IG9yIGZhbHN5IHZhbHVlc1xuICAgIGNvbnN0IHROb2RlID0gZ2V0U2VsZWN0ZWRUTm9kZSgpO1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlICYmIHJlbmRlcmVkU3RhdGUgPT09IERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLkluaXRpYWwpIHtcbiAgICAgIC8vIElmIG5vdGhpbmcgaXMgcmVuZGVyZWQgeWV0LCByZW5kZXIgYSBwbGFjZWhvbGRlciAoaWYgZGVmaW5lZCkuXG4gICAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHZhbHVlID09PSB0cnVlICYmXG4gICAgICAgIChyZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsIHx8XG4gICAgICAgICByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpKSB7XG4gICAgICAvLyBUaGUgYHdoZW5gIGNvbmRpdGlvbiBoYXMgY2hhbmdlZCB0byBgdHJ1ZWAsIHRyaWdnZXIgZGVmZXIgYmxvY2sgbG9hZGluZ1xuICAgICAgLy8gaWYgdGhlIGJsb2NrIGlzIGVpdGhlciBpbiBpbml0aWFsIChub3RoaW5nIGlzIHJlbmRlcmVkKSBvciBhIHBsYWNlaG9sZGVyXG4gICAgICAvLyBzdGF0ZS5cbiAgICAgIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJlZmV0Y2hlcyB0aGUgZGVmZXJyZWQgY29udGVudCB3aGVuIGEgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSAmJiB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gTm90ZTogd2UgcGFzcyBhbiBgbFZpZXdgIGFzIGEgc2Vjb25kIGFyZ3VtZW50IHRvIGNhbmNlbCBhbiBgaWRsZWBcbiAgLy8gY2FsbGJhY2sgaW4gY2FzZSBhbiBMVmlldyBnb3QgZGVzdHJveWVkIGJlZm9yZSBhbiBgaWRsZWAgY2FsbGJhY2tcbiAgLy8gaXMgaW52b2tlZC5cbiAgb25JZGxlKCgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbklkbGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gUHJldmVudCBzY2hlZHVsaW5nIG1vcmUgdGhhbiBvbmUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGNhbGxcbiAgICAvLyBmb3IgZWFjaCBkZWZlciBibG9jay4gRm9yIHRoaXMgcmVhc29uIHdlIHVzZSBvbmx5IGEgdHJpZ2dlclxuICAgIC8vIGlkZW50aWZpZXIgaW4gYSBrZXksIHNvIGFsbCBpbnN0YW5jZXMgd291bGQgdXNlIHRoZSBzYW1lIGtleS5cbiAgICBjb25zdCBrZXkgPSBTdHJpbmcoRGVmZXJCbG9ja1RyaWdnZXJzLk9uSWRsZSk7XG4gICAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICAgIGNvbnN0IG1hbmFnZXIgPSBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKTtcbiAgICBpZiAoIW1hbmFnZXIuaGFzKHREZXRhaWxzLCBrZXkpKSB7XG4gICAgICAvLyBJbiBjYXNlIG9mIHByZWZldGNoaW5nLCB3ZSBpbnRlbnRpb25hbGx5IGF2b2lkIGNhbmNlbGxpbmcgcmVzb3VyY2UgbG9hZGluZyBpZlxuICAgICAgLy8gYW4gdW5kZXJseWluZyBMVmlldyBnZXQgZGVzdHJveWVkICh0aHVzIHBhc3NpbmcgYG51bGxgIGFzIGEgc2Vjb25kIGFyZ3VtZW50KSxcbiAgICAgIC8vIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgTFZpZXdzICh0aGF0IHJlcHJlc2VudCBlbWJlZGRlZCB2aWV3cykgdGhhdFxuICAgICAgLy8gZGVwZW5kIG9uIHJlc291cmNlIGxvYWRpbmcuXG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSBvbklkbGUoKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldyksIG51bGwgLyogTFZpZXcgKi8pO1xuICAgICAgcmVnaXN0ZXJURGV0YWlsc0NsZWFudXAoaW5qZWN0b3IsIHREZXRhaWxzLCBrZXksIGNsZWFudXBGbik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JbW1lZGlhdGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIFJlbmRlciBwbGFjZWhvbGRlciBibG9jayBvbmx5IGlmIGxvYWRpbmcgdGVtcGxhdGUgaXMgbm90IHByZXNlbnRcbiAgLy8gdG8gYXZvaWQgY29udGVudCBmbGlja2VyaW5nLCBzaW5jZSBpdCB3b3VsZCBiZSBpbW1lZGlhdGVseSByZXBsYWNlZFxuICAvLyBieSB0aGUgbG9hZGluZyBibG9jay5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXggPT09IG51bGwpIHtcbiAgICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICB9XG4gIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG59XG5cblxuLyoqXG4gKiBTZXRzIHVwIGxvZ2ljIHRvIGhhbmRsZSB0aGUgYHByZWZldGNoIG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW1tZWRpYXRlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgbG9hZGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPblRpbWVyKGRlbGF5OiBudW1iZXIpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIHByZWZldGNoaW5nIHRoZSBjb250ZW50LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25UaW1lcihkZWxheTogbnVtYmVyKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25Ib3Zlcih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSG92ZXIsICgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25Ib3Zlcih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICAgIGxWaWV3LCB0Tm9kZSwgdHJpZ2dlckluZGV4LCB3YWxrVXBUaW1lcywgb25Ib3ZlcixcbiAgICAgICAgKCkgPT4gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byB3YWxrIHVwL2Rvd24gdGhlIHRyZWUgaGllcmFyY2h5IHRvIGZpbmQgdGhlIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JbnRlcmFjdGlvbih0cmlnZ2VySW5kZXg6IG51bWJlciwgd2Fsa1VwVGltZXM/OiBudW1iZXIpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcblxuICByZW5kZXJQbGFjZWhvbGRlcihsVmlldywgdE5vZGUpO1xuICByZWdpc3RlckRvbVRyaWdnZXIoXG4gICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSW50ZXJhY3Rpb24sXG4gICAgICAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSW50ZXJhY3Rpb24odHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uSW50ZXJhY3Rpb24sXG4gICAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gd2FsayB1cC9kb3duIHRoZSB0cmVlIGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVmlld3BvcnQodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgbFZpZXcsIHROb2RlLCB0cmlnZ2VySW5kZXgsIHdhbGtVcFRpbWVzLCBvblZpZXdwb3J0LCAoKSA9PiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIHZpZXdwb3J0YCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0byBmaW5kIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIHdhbGsgdXAvZG93biB0aGUgdHJlZSBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uVmlld3BvcnQodHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzPzogbnVtYmVyKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgICAgICBsVmlldywgdE5vZGUsIHRyaWdnZXJJbmRleCwgd2Fsa1VwVGltZXMsIG9uVmlld3BvcnQsXG4gICAgICAgICgpID0+IHRyaWdnZXJQcmVmZXRjaGluZyh0RGV0YWlscywgbFZpZXcpKTtcbiAgfVxufVxuXG4vKioqKioqKioqKiBIZWxwZXIgZnVuY3Rpb25zICoqKioqKioqKiovXG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgTFZpZXcgaW4gd2hpY2ggYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRIb3N0TFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVycmVkIGJsb2NrIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRUTm9kZSBUTm9kZSBkZWZpbmluZyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyJ3Mgdmlldy5cbiAqICAgQSBuZWdhdGl2ZSB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgYmxvY2sncyBwbGFjZWhvbGRlciwgd2hpbGUgYW4gdW5kZWZpbmVkXG4gKiAgIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgTFZpZXcgYXMgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5mdW5jdGlvbiBnZXRUcmlnZ2VyTFZpZXcoXG4gICAgZGVmZXJyZWRIb3N0TFZpZXc6IExWaWV3LCBkZWZlcnJlZFROb2RlOiBUTm9kZSwgd2Fsa1VwVGltZXM6IG51bWJlcnx1bmRlZmluZWQpOiBMVmlld3xudWxsIHtcbiAgLy8gVGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgdmlldywgd2UgZG9uJ3QgbmVlZCB0byB0cmF2ZXJzZS5cbiAgaWYgKHdhbGtVcFRpbWVzID09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmZXJyZWRIb3N0TFZpZXc7XG4gIH1cblxuICAvLyBBIHBvc2l0aXZlIHZhbHVlIG9yIHplcm8gbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiBhIHBhcmVudCB2aWV3LlxuICBpZiAod2Fsa1VwVGltZXMgPj0gMCkge1xuICAgIHJldHVybiB3YWxrVXBWaWV3cyh3YWxrVXBUaW1lcywgZGVmZXJyZWRIb3N0TFZpZXcpO1xuICB9XG5cbiAgLy8gSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlLCBpdCBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgcGxhY2Vob2xkZXIuXG4gIGNvbnN0IGRlZmVycmVkQ29udGFpbmVyID0gZGVmZXJyZWRIb3N0TFZpZXdbZGVmZXJyZWRUTm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlZmVycmVkQ29udGFpbmVyKTtcbiAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZGVmZXJyZWRDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdID8/IG51bGw7XG5cbiAgLy8gV2UgbmVlZCB0byBudWxsIGNoZWNrLCBiZWNhdXNlIHRoZSBwbGFjZWhvbGRlciBtaWdodCBub3QgaGF2ZSBiZWVuIHJlbmRlcmVkIHlldC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB0cmlnZ2VyTFZpZXcgIT09IG51bGwpIHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhkZWZlcnJlZEhvc3RMVmlldywgZGVmZXJyZWRUTm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgcmVuZGVyZWRTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyLFxuICAgICAgICAnRXhwZWN0ZWQgYSBwbGFjZWhvbGRlciB0byBiZSByZW5kZXJlZCBpbiB0aGlzIGRlZmVyIGJsb2NrLicpO1xuICAgIGFzc2VydExWaWV3KHRyaWdnZXJMVmlldyk7XG4gIH1cblxuICByZXR1cm4gdHJpZ2dlckxWaWV3O1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGVsZW1lbnQgdGhhdCBhIGRlZmVycmVkIGJsb2NrJ3MgdHJpZ2dlciBpcyBwb2ludGluZyB0by5cbiAqIEBwYXJhbSB0cmlnZ2VyTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIHRyaWdnZXIgaXMgZGVmaW5lZC5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdGhlIHRyaWdnZXIgZWxlbWVudCBzaG91bGQndmUgYmVlbiByZW5kZXJlZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VHJpZ2dlckVsZW1lbnQodHJpZ2dlckxWaWV3OiBMVmlldywgdHJpZ2dlckluZGV4OiBudW1iZXIpOiBFbGVtZW50IHtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoSEVBREVSX09GRlNFVCArIHRyaWdnZXJJbmRleCwgdHJpZ2dlckxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVsZW1lbnQoZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50IGFzIEVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgRE9NLW5vZGUgYmFzZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBpbml0aWFsTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVyIGJsb2NrIGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHJlcHJlc2VudGluZyB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAvZG93biBpbiB0aGUgdmlldyBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSByZWdpc3RlckZuIEZ1bmN0aW9uIHRoYXQgd2lsbCByZWdpc3RlciB0aGUgRE9NIGV2ZW50cy5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgcmVjZWl2ZXMgdGhlIGV2ZW50IHRoYXQgc2hvdWxkIHJlbmRlclxuICogICAgIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqL1xuZnVuY3Rpb24gcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgIGluaXRpYWxMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgdHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgIHJlZ2lzdGVyRm46IChlbGVtZW50OiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IFZvaWRGdW5jdGlvbixcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGluamVjdG9yID0gaW5pdGlhbExWaWV3W0lOSkVDVE9SXSE7XG5cbiAgLy8gQXNzdW1wdGlvbjogdGhlIGBhZnRlclJlbmRlcmAgcmVmZXJlbmNlIHNob3VsZCBiZSBkZXN0cm95ZWRcbiAgLy8gYXV0b21hdGljYWxseSBzbyB3ZSBkb24ndCBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgaXQuXG4gIGNvbnN0IGFmdGVyUmVuZGVyUmVmID0gYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGluaXRpYWxMVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG5cbiAgICAvLyBJZiB0aGUgYmxvY2sgd2FzIGxvYWRlZCBiZWZvcmUgdGhlIHRyaWdnZXIgd2FzIHJlc29sdmVkLCB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nLlxuICAgIGlmIChyZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsICYmXG4gICAgICAgIHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaWdnZXJMVmlldyA9IGdldFRyaWdnZXJMVmlldyhpbml0aWFsTFZpZXcsIHROb2RlLCB3YWxrVXBUaW1lcyk7XG5cbiAgICAvLyBLZWVwIHBvbGxpbmcgdW50aWwgd2UgcmVzb2x2ZSB0aGUgdHJpZ2dlcidzIExWaWV3LlxuICAgIC8vIGBhZnRlclJlbmRlcmAgc2hvdWxkIHN0b3AgYXV0b21hdGljYWxseSBpZiB0aGUgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAgaWYgKCF0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHRyaWdnZXIncyB2aWV3IHdhcyBkZXN0cm95ZWQgYmVmb3JlIHdlIHJlc29sdmVkIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gICAgaWYgKHRyaWdnZXJMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGFkZCBpbnRlZ3JhdGlvbiB3aXRoIGBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXJgLlxuICAgIGNvbnN0IGVsZW1lbnQgPSBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXcsIHRyaWdnZXJJbmRleCk7XG4gICAgY29uc3QgY2xlYW51cCA9IHJlZ2lzdGVyRm4oZWxlbWVudCwgKCkgPT4ge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG4gICAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICAgIH1cbiAgICAgIGNsZWFudXAoKTtcbiAgICB9LCBpbmplY3Rvcik7XG5cbiAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgc3RvcmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuXG4gICAgLy8gU2luY2UgdGhlIHRyaWdnZXIgYW5kIGRlZmVycmVkIGJsb2NrIG1pZ2h0IGJlIGluIGRpZmZlcmVudFxuICAgIC8vIHZpZXdzLCB3ZSBoYXZlIHRvIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayBpbiBib3RoIGxvY2F0aW9ucy5cbiAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICB9XG4gIH0sIHtpbmplY3Rvcn0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBzY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICogQHBhcmFtIGxWaWV3IEFuIG9wdGlvbmFsIExWaWV3IHRoYXQgaG9zdHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay4gTFZpZXcgaXNcbiAqICAgIHVzZWQgdG8gcmVnaXN0ZXIgYSBjbGVhbnVwIGNhbGxiYWNrIGluIGNhc2UgdGhhdCBMVmlldyBnb3QgZGVzdHJveWVkIGJlZm9yZVxuICogICAgY2FsbGJhY2sgd2FzIGludm9rZWQuIEluIHRoaXMgY2FzZSwgYW4gYGlkbGVgIGNhbGxiYWNrIGlzIG5ldmVyIGludm9rZWQuIFRoaXMgaXNcbiAqICAgIGhlbHBmdWwgZm9yIGNhc2VzIHdoZW4gYSBkZWZlciBibG9jayBoYXMgc2NoZWR1bGVkIHJlbmRlcmluZywgYnV0IGFuIHVuZGVybHlpbmdcbiAqICAgIExWaWV3IGdvdCBkZXN0cm95ZWQgcHJpb3IgdG8gdGggYmxvY2sgcmVuZGVyaW5nLlxuICovXG5mdW5jdGlvbiBvbklkbGUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3fG51bGwpOiBWb2lkRnVuY3Rpb24ge1xuICBsZXQgaWQ6IG51bWJlcjtcbiAgY29uc3QgcmVtb3ZlSWRsZUNhbGxiYWNrID0gKCkgPT4gX2NhbmNlbElkbGVDYWxsYmFjayhpZCk7XG4gIGlkID0gX3JlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgcmVtb3ZlSWRsZUNhbGxiYWNrKCk7XG4gICAgICAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgICAgLy8gVGhlIGlkbGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgd2Ugbm8gbG9uZ2VyIG5lZWRcbiAgICAgICAgICAgLy8gdG8gcmV0YWluIGEgY2xlYW51cCBjYWxsYmFjayBpbiBhbiBMVmlldy5cbiAgICAgICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kobFZpZXcsIHJlbW92ZUlkbGVDYWxsYmFjayk7XG4gICAgICAgICB9XG4gICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgIH0pIGFzIG51bWJlcjtcblxuICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAvLyBTdG9yZSBhIGNsZWFudXAgZnVuY3Rpb24gb24gTFZpZXcsIHNvIHRoYXQgd2UgY2FuY2VsIGlkbGVcbiAgICAvLyBjYWxsYmFjayBpbiBjYXNlIHRoaXMgTFZpZXcgaXMgZGVzdHJveWVkIGJlZm9yZSBhIGNhbGxiYWNrXG4gICAgLy8gaXMgaW52b2tlZC5cbiAgICBzdG9yZUxWaWV3T25EZXN0cm95KGxWaWV3LCByZW1vdmVJZGxlQ2FsbGJhY2spO1xuICB9XG4gIHJldHVybiByZW1vdmVJZGxlQ2FsbGJhY2s7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBhIGRhdGEgc2xvdCBpbmRleCBmb3IgZGVmZXIgYmxvY2sgaW5mbyAoZWl0aGVyIHN0YXRpYyBvclxuICogaW5zdGFuY2Utc3BlY2lmaWMpLCBnaXZlbiBhbiBpbmRleCBvZiBhIGRlZmVyIGluc3RydWN0aW9uLlxuICovXG5mdW5jdGlvbiBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleDogbnVtYmVyKSB7XG4gIC8vIEluc3RhbmNlIHN0YXRlIGlzIGxvY2F0ZWQgYXQgdGhlICpuZXh0KiBwb3NpdGlvblxuICAvLyBhZnRlciB0aGUgZGVmZXIgYmxvY2sgc2xvdCBpbiBhbiBMVmlldyBvciBUVmlldy5kYXRhLlxuICByZXR1cm4gZGVmZXJCbG9ja0luZGV4ICsgMTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIGRlZmVyIGJsb2NrIHN0YXRlIGZyb20gYW4gTFZpZXcsIGdpdmVuIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgYmxvY2suICovXG5mdW5jdGlvbiBnZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBMRGVmZXJCbG9ja0RldGFpbHMge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleCh0Tm9kZS5pbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICByZXR1cm4gbFZpZXdbc2xvdEluZGV4XTtcbn1cblxuLyoqIFN0b3JlcyBhIGRlZmVyIGJsb2NrIGluc3RhbmNlIHN0YXRlIGluIExWaWV3LiAqL1xuZnVuY3Rpb24gc2V0TERlZmVyQmxvY2tEZXRhaWxzKFxuICAgIGxWaWV3OiBMVmlldywgZGVmZXJCbG9ja0luZGV4OiBudW1iZXIsIGxEZXRhaWxzOiBMRGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIGxWaWV3W3Nsb3RJbmRleF0gPSBsRGV0YWlscztcbn1cblxuLyoqIFJldHJpZXZlcyBzdGF0aWMgaW5mbyBhYm91dCBhIGRlZmVyIGJsb2NrLCBnaXZlbiBhIFRWaWV3IGFuZCBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogVERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleCh0Tm9kZS5pbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICByZXR1cm4gdFZpZXcuZGF0YVtzbG90SW5kZXhdIGFzIFREZWZlckJsb2NrRGV0YWlscztcbn1cblxuLyoqIFN0b3JlcyBhIGRlZmVyIGJsb2NrIHN0YXRpYyBpbmZvIGluIGBUVmlldy5kYXRhYC4gKi9cbmZ1bmN0aW9uIHNldFREZWZlckJsb2NrRGV0YWlscyhcbiAgICB0VmlldzogVFZpZXcsIGRlZmVyQmxvY2tJbmRleDogbnVtYmVyLCBkZWZlckJsb2NrQ29uZmlnOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgY29uc3Qgc2xvdEluZGV4ID0gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgdFZpZXcuZGF0YVtzbG90SW5kZXhdID0gZGVmZXJCbG9ja0NvbmZpZztcbn1cblxuZnVuY3Rpb24gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKFxuICAgIG5ld1N0YXRlOiBEZWZlckJsb2NrU3RhdGUsIGhvc3RMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIHN3aXRjaCAobmV3U3RhdGUpIHtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZTpcbiAgICAgIHJldHVybiB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4O1xuICAgIGNhc2UgRGVmZXJCbG9ja1N0YXRlLkxvYWRpbmc6XG4gICAgICByZXR1cm4gdERldGFpbHMubG9hZGluZ1RtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5FcnJvcjpcbiAgICAgIHJldHVybiB0RGV0YWlscy5lcnJvclRtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcjpcbiAgICAgIHJldHVybiB0RGV0YWlscy5wbGFjZWhvbGRlclRtcGxJbmRleDtcbiAgICBkZWZhdWx0OlxuICAgICAgbmdEZXZNb2RlICYmIHRocm93RXJyb3IoYFVuZXhwZWN0ZWQgZGVmZXIgYmxvY2sgc3RhdGU6ICR7bmV3U3RhdGV9YCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFRyYW5zaXRpb25zIGEgZGVmZXIgYmxvY2sgdG8gdGhlIG5ldyBzdGF0ZS4gVXBkYXRlcyB0aGUgIG5lY2Vzc2FyeVxuICogZGF0YSBzdHJ1Y3R1cmVzIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgYmxvY2suXG4gKlxuICogQHBhcmFtIG5ld1N0YXRlIE5ldyBzdGF0ZSB0aGF0IHNob3VsZCBiZSBhcHBsaWVkIHRvIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsQ29udGFpbmVyIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShcbiAgICBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlLCB0Tm9kZTogVE5vZGUsIGxDb250YWluZXI6IExDb250YWluZXIpOiB2b2lkIHtcbiAgY29uc3QgaG9zdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuXG4gIC8vIENoZWNrIGlmIHRoaXMgdmlldyBpcyBub3QgZGVzdHJveWVkLiBTaW5jZSB0aGUgbG9hZGluZyBwcm9jZXNzIHdhcyBhc3luYyxcbiAgLy8gdGhlIHZpZXcgbWlnaHQgZW5kIHVwIGJlaW5nIGRlc3Ryb3llZCBieSB0aGUgdGltZSByZW5kZXJpbmcgaGFwcGVucy5cbiAgaWYgKGlzRGVzdHJveWVkKGhvc3RMVmlldykpIHJldHVybjtcblxuICAvLyBNYWtlIHN1cmUgdGhpcyBUTm9kZSBiZWxvbmdzIHRvIFRWaWV3IHRoYXQgcmVwcmVzZW50cyBob3N0IExWaWV3LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgaG9zdExWaWV3KTtcblxuICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhob3N0TFZpZXcsIHROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsRGV0YWlscywgJ0V4cGVjdGVkIGEgZGVmZXIgYmxvY2sgc3RhdGUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IHN0YXRlVG1wbEluZGV4ID0gZ2V0VGVtcGxhdGVJbmRleEZvclN0YXRlKG5ld1N0YXRlLCBob3N0TFZpZXcsIHROb2RlKTtcbiAgLy8gTm90ZTogd2UgdHJhbnNpdGlvbiB0byB0aGUgbmV4dCBzdGF0ZSBpZiB0aGUgcHJldmlvdXMgc3RhdGUgd2FzIHJlcHJlc2VudGVkXG4gIC8vIHdpdGggYSBudW1iZXIgdGhhdCBpcyBsZXNzIHRoYW4gdGhlIG5leHQgc3RhdGUuIEZvciBleGFtcGxlLCBpZiB0aGUgY3VycmVudFxuICAvLyBzdGF0ZSBpcyBcImxvYWRpbmdcIiAocmVwcmVzZW50ZWQgYXMgYDJgKSwgd2Ugc2hvdWxkIG5vdCBzaG93IGEgcGxhY2Vob2xkZXJcbiAgLy8gKHJlcHJlc2VudGVkIGFzIGAxYCkuXG4gIGlmIChsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPCBuZXdTdGF0ZSAmJiBzdGF0ZVRtcGxJbmRleCAhPT0gbnVsbCkge1xuICAgIGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXSA9IG5ld1N0YXRlO1xuICAgIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RMVmlld1tUVklFV107XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IHN0YXRlVG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGhvc3RUVmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG5cbiAgICAvLyBUaGVyZSBpcyBvbmx5IDEgdmlldyB0aGF0IGNhbiBiZSBwcmVzZW50IGluIGFuIExDb250YWluZXIgdGhhdFxuICAgIC8vIHJlcHJlc2VudHMgYSBkZWZlciBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXIsIHROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0Tm9kZSwgbnVsbCwge2RlaHlkcmF0ZWRWaWV3fSk7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIGxDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBwcmVmZXRjaGluZyBvZiBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2suXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBpZiAobFZpZXdbSU5KRUNUT1JdICYmIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGxWaWV3W0lOSkVDVE9SXSEpKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyBpZiB0aGUgcHJvY2VzcyBoYXNuJ3Qgc3RhcnRlZCB5ZXQuXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlICE9PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIC8vIElmIHRoZSBsb2FkaW5nIHN0YXR1cyBpcyBkaWZmZXJlbnQgZnJvbSBpbml0aWFsIG9uZSwgaXQgbWVhbnMgdGhhdFxuICAgIC8vIHRoZSBsb2FkaW5nIG9mIGRlcGVuZGVuY2llcyBpcyBpbiBwcm9ncmVzcyBhbmQgdGhlcmUgaXMgbm90aGluZyB0byBkb1xuICAgIC8vIGluIHRoaXMgZnVuY3Rpb24uIEFsbCBkZXRhaWxzIGNhbiBiZSBvYnRhaW5lZCBmcm9tIHRoZSBgdERldGFpbHNgIG9iamVjdC5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmltYXJ5QmxvY2tUTm9kZSA9IGdldFByaW1hcnlCbG9ja1ROb2RlKHRWaWV3LCB0RGV0YWlscyk7XG5cbiAgLy8gU3dpdGNoIGZyb20gTk9UX1NUQVJURUQgLT4gSU5fUFJPR1JFU1Mgc3RhdGUuXG4gIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTO1xuXG4gIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgY29uc3QgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgPVxuICAgICAgaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgP1xuICAgICAgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IuaW50ZXJjZXB0KHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuKSA6XG4gICAgICB0RGV0YWlscy5kZXBlbmRlbmN5UmVzb2x2ZXJGbjtcblxuICAvLyBUaGUgYGRlcGVuZGVuY2llc0ZuYCBtaWdodCBiZSBgbnVsbGAgd2hlbiBhbGwgZGVwZW5kZW5jaWVzIHdpdGhpblxuICAvLyBhIGdpdmVuIGRlZmVyIGJsb2NrIHdlcmUgZWFnZXJseSByZWZlcmVuY2VzIGVsc2V3aGVyZSBpbiBhIGZpbGUsXG4gIC8vIHRodXMgbm8gZHluYW1pYyBgaW1wb3J0KClgcyB3ZXJlIHByb2R1Y2VkLlxuICBpZiAoIWRlcGVuZGVuY2llc0ZuKSB7XG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIERlZmVyIGJsb2NrIG1heSBoYXZlIG11bHRpcGxlIHByZWZldGNoIHRyaWdnZXJzLiBPbmNlIHRoZSBsb2FkaW5nXG4gIC8vIHN0YXJ0cywgaW52b2tlIGFsbCBjbGVhbiBmdW5jdGlvbnMsIHNpbmNlIHRoZXkgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG4gIGludm9rZVREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMpO1xuXG4gIC8vIFN0YXJ0IGRvd25sb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBQcm9taXNlLmFsbFNldHRsZWQoZGVwZW5kZW5jaWVzRm4oKSkudGhlbihyZXN1bHRzID0+IHtcbiAgICBsZXQgZmFpbGVkID0gZmFsc2U7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmTGlzdCA9IFtdO1xuICAgIGNvbnN0IHBpcGVEZWZzOiBQaXBlRGVmTGlzdCA9IFtdO1xuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdmdWxmaWxsZWQnKSB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSByZXN1bHQudmFsdWU7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGdldENvbXBvbmVudERlZihkZXBlbmRlbmN5KSB8fCBnZXREaXJlY3RpdmVEZWYoZGVwZW5kZW5jeSk7XG4gICAgICAgIGlmIChkaXJlY3RpdmVEZWYpIHtcbiAgICAgICAgICBkaXJlY3RpdmVEZWZzLnB1c2goZGlyZWN0aXZlRGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwaXBlRGVmID0gZ2V0UGlwZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgICBpZiAocGlwZURlZikge1xuICAgICAgICAgICAgcGlwZURlZnMucHVzaChwaXBlRGVmKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvYWRpbmcgaXMgY29tcGxldGVkLCB3ZSBubyBsb25nZXIgbmVlZCB0aGlzIFByb21pc2UuXG4gICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UgPSBudWxsO1xuXG4gICAgaWYgKGZhaWxlZCkge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEO1xuICAgIH0gZWxzZSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTtcblxuICAgICAgLy8gVXBkYXRlIGRpcmVjdGl2ZSBhbmQgcGlwZSByZWdpc3RyaWVzIHRvIGFkZCBuZXdseSBkb3dubG9hZGVkIGRlcGVuZGVuY2llcy5cbiAgICAgIGNvbnN0IHByaW1hcnlCbG9ja1RWaWV3ID0gcHJpbWFyeUJsb2NrVE5vZGUudFZpZXchO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZnMubGVuZ3RoID4gMCkge1xuICAgICAgICBwcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSA9IHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID9cbiAgICAgICAgICAgIFsuLi5wcmltYXJ5QmxvY2tUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgLi4uZGlyZWN0aXZlRGVmc10gOlxuICAgICAgICAgICAgZGlyZWN0aXZlRGVmcztcbiAgICAgIH1cbiAgICAgIGlmIChwaXBlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA9IHByaW1hcnlCbG9ja1RWaWV3LnBpcGVSZWdpc3RyeSA/XG4gICAgICAgICAgICBbLi4ucHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5LCAuLi5waXBlRGVmc10gOlxuICAgICAgICAgICAgcGlwZURlZnM7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLyoqIFV0aWxpdHkgZnVuY3Rpb24gdG8gcmVuZGVyIHBsYWNlaG9sZGVyIGNvbnRlbnQgKGlmIHByZXNlbnQpICovXG5mdW5jdGlvbiByZW5kZXJQbGFjZWhvbGRlcihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcbiAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlciwgdE5vZGUsIGxDb250YWluZXIpO1xufVxuXG4vKipcbiAqIFN1YnNjcmliZXMgdG8gdGhlIFwibG9hZGluZ1wiIFByb21pc2UgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBkZWZlciBzdWItYmxvY2ssXG4gKiBiYXNlZCBvbiB0aGUgbG9hZGluZyByZXN1bHRzLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSBSZXByZXNlbnRzIGRlZmVyIGJsb2NrIGluZm8gc2hhcmVkIGFjcm9zcyBhbGwgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcoXG4gICAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgdE5vZGU6IFROb2RlLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSwgJ0V4cGVjdGVkIGxvYWRpbmcgUHJvbWlzZSB0byBleGlzdCBvbiB0aGlzIGRlZmVyIGJsb2NrJyk7XG5cbiAgdERldGFpbHMubG9hZGluZ1Byb21pc2UhLnRoZW4oKCkgPT4ge1xuICAgIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHMpO1xuXG4gICAgICAvLyBFdmVyeXRoaW5nIGlzIGxvYWRlZCwgc2hvdyB0aGUgcHJpbWFyeSBibG9jayBjb250ZW50XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG5cbiAgICB9IGVsc2UgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuRkFJTEVEKSB7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkVycm9yLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBtYWluIGNvbnRlbnQgb2YgYSBkZWZlciBibG9jay4gKi9cbmZ1bmN0aW9uIGdldFByaW1hcnlCbG9ja1ROb2RlKHRWaWV3OiBUVmlldywgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscyk6IFRDb250YWluZXJOb2RlIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IHREZXRhaWxzLnByaW1hcnlUbXBsSW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICByZXR1cm4gZ2V0VE5vZGUodFZpZXcsIGFkanVzdGVkSW5kZXgpIGFzIFRDb250YWluZXJOb2RlO1xufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHRyaWdnZXIgbG9hZGluZyBvZiBkZWZlciBibG9jayBkZXBlbmRlbmNpZXMuXG4gKiBJZiB0aGUgYmxvY2sgaXMgYWxyZWFkeSBpbiBhIGxvYWRpbmcsIGNvbXBsZXRlZCBvciBhbiBlcnJvciBzdGF0ZSAtXG4gKiBubyBhZGRpdGlvbmFsIGFjdGlvbnMgYXJlIHRha2VuLlxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICBpZiAoIXNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gQ29uZGl0aW9uIGlzIHRyaWdnZXJlZCwgdHJ5IHRvIHJlbmRlciBsb2FkaW5nIHN0YXRlIGFuZCBzdGFydCBkb3dubG9hZGluZy5cbiAgLy8gTm90ZTogaWYgYSBibG9jayBpcyBpbiBhIGxvYWRpbmcsIGNvbXBsZXRlZCBvciBhbiBlcnJvciBzdGF0ZSwgdGhpcyBjYWxsIHdvdWxkIGJlIGEgbm9vcC5cbiAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nLCB0Tm9kZSwgbENvbnRhaW5lcik7XG5cbiAgc3dpdGNoICh0RGV0YWlscy5sb2FkaW5nU3RhdGUpIHtcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEOlxuICAgICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcpO1xuXG4gICAgICAvLyBUaGUgYGxvYWRpbmdTdGF0ZWAgbWlnaHQgaGF2ZSBjaGFuZ2VkIHRvIFwibG9hZGluZ1wiLlxuICAgICAgaWYgKCh0RGV0YWlscy5sb2FkaW5nU3RhdGUgYXMgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUpID09PVxuICAgICAgICAgIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTKSB7XG4gICAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUzpcbiAgICAgIHJlbmRlckRlZmVyU3RhdGVBZnRlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURTpcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZlcnJlZERlcGVuZGVuY2llc0xvYWRlZCh0RGV0YWlscyk7XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkNvbXBsZXRlLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRDpcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuRXJyb3IsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIHRocm93RXJyb3IoJ1Vua25vd24gZGVmZXIgYmxvY2sgc3RhdGUnKTtcbiAgICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFzc2VydHMgd2hldGhlciBhbGwgZGVwZW5kZW5jaWVzIGZvciBhIGRlZmVyIGJsb2NrIGFyZSBsb2FkZWQuXG4gKiBBbHdheXMgcnVuIHRoaXMgZnVuY3Rpb24gKGluIGRldiBtb2RlKSBiZWZvcmUgcmVuZGVyaW5nIGEgZGVmZXJcbiAqIGJsb2NrIGluIGNvbXBsZXRlZCBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICBhc3NlcnRFcXVhbChcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSwgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEUsXG4gICAgICAnRXhwZWN0aW5nIGFsbCBkZWZlcnJlZCBkZXBlbmRlbmNpZXMgdG8gYmUgbG9hZGVkLicpO1xufVxuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgYXZvaWQgcmVmZXJlbmNpbmcgaXQgaW4gYXBwbGljYXRpb24gY29kZS5cbiAqXG4gKiBEZXNjcmliZXMgYSBoZWxwZXIgY2xhc3MgdGhhdCBhbGxvd3MgdG8gaW50ZXJjZXB0IGEgY2FsbCB0byByZXRyaWV2ZSBjdXJyZW50XG4gKiBkZXBlbmRlbmN5IGxvYWRpbmcgZnVuY3Rpb24gYW5kIHJlcGxhY2UgaXQgd2l0aCBhIGRpZmZlcmVudCBpbXBsZW1lbnRhdGlvbi5cbiAqIFRoaXMgaW50ZXJjZXB0b3IgY2xhc3MgaXMgbmVlZGVkIHRvIGFsbG93IHRlc3RpbmcgYmxvY2tzIGluIGRpZmZlcmVudCBzdGF0ZXNcbiAqIGJ5IHNpbXVsYXRpbmcgbG9hZGluZyByZXNwb25zZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yIHtcbiAgLyoqXG4gICAqIEludm9rZWQgZm9yIGVhY2ggZGVmZXIgYmxvY2sgd2hlbiBkZXBlbmRlbmN5IGxvYWRpbmcgZnVuY3Rpb24gaXMgYWNjZXNzZWQuXG4gICAqL1xuICBpbnRlcmNlcHQoZGVwZW5kZW5jeUZuOiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsKTogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbDtcblxuICAvKipcbiAgICogQWxsb3dzIHRvIGNvbmZpZ3VyZSBhbiBpbnRlcmNlcHRvciBmdW5jdGlvbi5cbiAgICovXG4gIHNldEludGVyY2VwdG9yKGludGVyY2VwdG9yRm46IChjdXJyZW50OiBEZXBlbmRlbmN5UmVzb2x2ZXJGbikgPT4gRGVwZW5kZW5jeVJlc29sdmVyRm4pOiB2b2lkO1xufVxuXG4vKipcbiAqICoqSU5URVJOQUwqKiwgYXZvaWQgcmVmZXJlbmNpbmcgaXQgaW4gYXBwbGljYXRpb24gY29kZS5cbiAqXG4gKiBJbmplY3RvciB0b2tlbiB0aGF0IGFsbG93cyB0byBwcm92aWRlIGBEZWZlckJsb2NrRGVwZW5kZW5jeUludGVyY2VwdG9yYCBjbGFzc1xuICogaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcj4oXG4gICAgICAgIG5nRGV2TW9kZSA/ICdERUZFUl9CTE9DS19ERVBFTkRFTkNZX0lOVEVSQ0VQVE9SJyA6ICcnKTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gdmFsdWUgbWF0Y2hlcyB0aGUgZXhwZWN0ZWQgc3RydWN0dXJlIG9mIGEgZGVmZXIgYmxvY2tcbiAqXG4gKiBXZSBjYW4gc2FmZWx5IHJlbHkgb24gdGhlIHByaW1hcnlUbXBsSW5kZXggYmVjYXVzZSBldmVyeSBkZWZlciBibG9jayByZXF1aXJlc1xuICogdGhhdCBhIHByaW1hcnkgdGVtcGxhdGUgZXhpc3RzLiBBbGwgdGhlIG90aGVyIHRlbXBsYXRlIG9wdGlvbnMgYXJlIG9wdGlvbmFsLlxuICovXG5mdW5jdGlvbiBpc1REZWZlckJsb2NrRGV0YWlscyh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFREZWZlckJsb2NrRGV0YWlscyB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykgJiZcbiAgICAgICh0eXBlb2YgKHZhbHVlIGFzIFREZWZlckJsb2NrRGV0YWlscykucHJpbWFyeVRtcGxJbmRleCA9PT0gJ251bWJlcicpO1xufVxuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHVzZWQgZm9yIGNvbmZpZ3VyaW5nIGRlZmVyIGJsb2NrIGJlaGF2aW9yLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfQ09ORklHID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48RGVmZXJCbG9ja0NvbmZpZz4obmdEZXZNb2RlID8gJ0RFRkVSX0JMT0NLX0NPTkZJRycgOiAnJyk7XG5cbi8qKlxuICogRGVmZXIgYmxvY2sgaW5zdGFuY2UgZm9yIHRlc3RpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmZXJCbG9ja0RldGFpbHMge1xuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyO1xuICBsVmlldzogTFZpZXc7XG4gIHROb2RlOiBUTm9kZTtcbiAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscztcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYWxsIGRlZmVyIGJsb2NrcyBpbiBhIGdpdmVuIExWaWV3LlxuICpcbiAqIEBwYXJhbSBsVmlldyBsVmlldyB3aXRoIGRlZmVyIGJsb2Nrc1xuICogQHBhcmFtIGRlZmVyQmxvY2tzIGRlZmVyIGJsb2NrIGFnZ3JlZ2F0b3IgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmVyQmxvY2tzKGxWaWV3OiBMVmlldywgZGVmZXJCbG9ja3M6IERlZmVyQmxvY2tEZXRhaWxzW10pIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbaV07XG4gICAgICAvLyBBbiBMQ29udGFpbmVyIG1heSByZXByZXNlbnQgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jaywgaW4gd2hpY2ggY2FzZVxuICAgICAgLy8gd2Ugc3RvcmUgaXQgYXMgYSByZXN1bHQuIE90aGVyd2lzZSwga2VlcCBpdGVyYXRpbmcgb3ZlciBMQ29udGFpbmVyIHZpZXdzIGFuZFxuICAgICAgLy8gbG9vayBmb3IgZGVmZXIgYmxvY2tzLlxuICAgICAgY29uc3QgaXNMYXN0ID0gaSA9PT0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggLSAxO1xuICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgICAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgICAgICBpZiAoaXNURGVmZXJCbG9ja0RldGFpbHModERldGFpbHMpKSB7XG4gICAgICAgICAgZGVmZXJCbG9ja3MucHVzaCh7bENvbnRhaW5lciwgbFZpZXcsIHROb2RlLCB0RGV0YWlsc30pO1xuICAgICAgICAgIC8vIFRoaXMgTENvbnRhaW5lciByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2ssIHNvIHdlIGV4aXRcbiAgICAgICAgICAvLyB0aGlzIGl0ZXJhdGlvbiBhbmQgZG9uJ3QgaW5zcGVjdCB2aWV3cyBpbiB0aGlzIExDb250YWluZXIuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZ2V0RGVmZXJCbG9ja3MobENvbnRhaW5lcltpXSBhcyBMVmlldywgZGVmZXJCbG9ja3MpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNMVmlldyhsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGVudGVyIHRoZSBgZ2V0RGVmZXJCbG9ja3NgIHJlY3Vyc2l2ZWx5LlxuICAgICAgZ2V0RGVmZXJCbG9ja3MobFZpZXdbaV0sIGRlZmVyQmxvY2tzKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBjbGVhbnVwIGZ1bmN0aW9uIGFzc29jaWF0ZWQgd2l0aCBhIHByZWZldGNoaW5nIHRyaWdnZXJcbiAqIG9mIGEgZ2l2ZW4gZGVmZXIgYmxvY2suXG4gKi9cbmZ1bmN0aW9uIHJlZ2lzdGVyVERldGFpbHNDbGVhbnVwKFxuICAgIGluamVjdG9yOiBJbmplY3RvciwgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcsIGNsZWFudXBGbjogVm9pZEZ1bmN0aW9uKSB7XG4gIGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpLmFkZCh0RGV0YWlscywga2V5LCBjbGVhbnVwRm4pO1xufVxuXG4vKipcbiAqIEludm9rZXMgYWxsIHJlZ2lzdGVyZWQgcHJlZmV0Y2ggY2xlYW51cCB0cmlnZ2Vyc1xuICogYW5kIHJlbW92ZXMgYWxsIGNsZWFudXAgZnVuY3Rpb25zIGFmdGVyd2FyZHMuXG4gKi9cbmZ1bmN0aW9uIGludm9rZVREZXRhaWxzQ2xlYW51cChpbmplY3RvcjogSW5qZWN0b3IsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgaW5qZWN0b3IuZ2V0KERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcikuY2xlYW51cCh0RGV0YWlscyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgc2VydmljZSB0byBrZWVwIHRyYWNrIG9mIGNsZWFudXAgZnVuY3Rpb25zIGFzc29jaWF0ZWRcbiAqIHdpdGggZGVmZXIgYmxvY2tzLiBUaGlzIGNsYXNzIGlzIHVzZWQgdG8gbWFuYWdlIGNsZWFudXAgZnVuY3Rpb25zXG4gKiBjcmVhdGVkIGZvciBwcmVmZXRjaGluZyB0cmlnZ2Vycy5cbiAqL1xuY2xhc3MgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBibG9ja3MgPSBuZXcgTWFwPFREZWZlckJsb2NrRGV0YWlscywgTWFwPHN0cmluZywgVm9pZEZ1bmN0aW9uW10+PigpO1xuXG4gIGFkZCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZywgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGlmICghdGhpcy5ibG9ja3MuaGFzKHREZXRhaWxzKSkge1xuICAgICAgdGhpcy5ibG9ja3Muc2V0KHREZXRhaWxzLCBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBjb25zdCBibG9jayA9IHRoaXMuYmxvY2tzLmdldCh0RGV0YWlscykhO1xuICAgIGlmICghYmxvY2suaGFzKGtleSkpIHtcbiAgICAgIGJsb2NrLnNldChrZXksIFtdKTtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2tzID0gYmxvY2suZ2V0KGtleSkhO1xuICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGhhcyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXRoaXMuYmxvY2tzLmdldCh0RGV0YWlscyk/LmhhcyhrZXkpO1xuICB9XG5cbiAgY2xlYW51cCh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpO1xuICAgIGlmIChibG9jaykge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFja3Mgb2YgT2JqZWN0LnZhbHVlcyhibG9jaykpIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBjYWxsYmFja3MpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmJsb2Nrcy5kZWxldGUodERldGFpbHMpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGZvciAoY29uc3QgW2Jsb2NrXSBvZiB0aGlzLmJsb2Nrcykge1xuICAgICAgdGhpcy5jbGVhbnVwKGJsb2NrKTtcbiAgICB9XG4gICAgdGhpcy5ibG9ja3MuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==