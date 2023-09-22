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
import { assertDefined, assertEqual, throwError } from '../../util/assert';
import { assertIndexInDeclRange, assertLContainer, assertTNodeForLView } from '../assert';
import { bindingUpdated } from '../bindings';
import { getComponentDef, getDirectiveDef, getPipeDef } from '../definition';
import { CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { DEFER_BLOCK_STATE, DeferBlockBehavior, DeferBlockInternalState, DeferBlockState, DeferDependenciesLoadingState } from '../interfaces/defer';
import { isDestroyed, isLContainer, isLView } from '../interfaces/type_checks';
import { HEADER_OFFSET, INJECTOR, PARENT, TVIEW } from '../interfaces/view';
import { getCurrentTNode, getLView, getSelectedTNode, getTView, nextBindingIndex } from '../state';
import { isPlatformBrowser } from '../util/misc_utils';
import { getConstant, getTNode, removeLViewOnDestroy, storeLViewOnDestroy } from '../util/view_utils';
import { addLViewToLContainer, createAndRenderEmbeddedLView, removeLViewFromLContainer, shouldAddViewToDom } from '../view_manipulation';
import { ɵɵtemplate } from './template';
/**
 * Returns whether defer blocks should be triggered.
 *
 * Currently, defer blocks are not triggered on the server,
 * only placeholder content is rendered (if provided).
 */
function shouldTriggerDeferBlock(injector) {
    const config = injector.get(DEFER_BLOCK_CONFIG, { optional: true });
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
 * @codeGenApi
 */
export function ɵɵdeferOnHover() { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on hover` deferred trigger.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnHover() { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `on interaction` deferred trigger.
 * @param target Optional element on which to listen for hover events.
 * @codeGenApi
 */
export function ɵɵdeferOnInteraction(target) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on interaction` deferred trigger.
 * @param target Optional element on which to listen for hover events.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnInteraction(target) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `on viewport` deferred trigger.
 * @param target Optional element on which to listen for hover events.
 * @codeGenApi
 */
export function ɵɵdeferOnViewport(target) { } // TODO: implement runtime logic.
/**
 * Creates runtime data structures for the `prefetch on viewport` deferred trigger.
 * @param target Optional element on which to listen for hover events.
 * @codeGenApi
 */
export function ɵɵdeferPrefetchOnViewport(target) { } // TODO: implement runtime logic.
/********** Helper functions **********/
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFZLGtCQUFrQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN4RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMzRSxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQW9CLHVCQUF1QixFQUFFLGVBQWUsRUFBc0IsNkJBQTZCLEVBQTJILE1BQU0scUJBQXFCLENBQUM7QUFHblQsT0FBTyxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0UsT0FBTyxFQUFDLGFBQWEsRUFBRSxRQUFRLEVBQVMsTUFBTSxFQUFFLEtBQUssRUFBUSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hGLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSw0QkFBNEIsRUFBRSx5QkFBeUIsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRXZJLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFdEM7Ozs7O0dBS0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFFBQWtCO0lBQ2pELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUNsRSxJQUFJLE1BQU0sRUFBRSxRQUFRLEtBQUssa0JBQWtCLENBQUMsTUFBTSxFQUFFO1FBQ2xELE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLG9CQUFvQixHQUN0QixPQUFPLG1CQUFtQixLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztBQUNsRixNQUFNLG1CQUFtQixHQUNyQixPQUFPLG1CQUFtQixLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUVuRjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFNLFVBQVUsT0FBTyxDQUNuQixLQUFhLEVBQUUsZ0JBQXdCLEVBQUUsb0JBQWdELEVBQ3pGLGdCQUE4QixFQUFFLG9CQUFrQyxFQUNsRSxjQUE0QixFQUFFLGtCQUFnQyxFQUM5RCxzQkFBb0M7SUFDdEMsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxNQUFNLGFBQWEsR0FBRyxLQUFLLEdBQUcsYUFBYSxDQUFDO0lBRTVDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU5QixJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsTUFBTSxnQkFBZ0IsR0FBdUI7WUFDM0MsZ0JBQWdCO1lBQ2hCLGdCQUFnQixFQUFFLGdCQUFnQixJQUFJLElBQUk7WUFDMUMsb0JBQW9CLEVBQUUsb0JBQW9CLElBQUksSUFBSTtZQUNsRCxjQUFjLEVBQUUsY0FBYyxJQUFJLElBQUk7WUFDdEMsc0JBQXNCLEVBQUUsc0JBQXNCLElBQUksSUFBSSxDQUFDLENBQUM7Z0JBQ3BELFdBQVcsQ0FBaUMsV0FBVyxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQztnQkFDbEYsSUFBSTtZQUNSLGtCQUFrQixFQUFFLGtCQUFrQixJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxXQUFXLENBQTZCLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLElBQUk7WUFDUixvQkFBb0IsRUFBRSxvQkFBb0IsSUFBSSxJQUFJO1lBQ2xELFlBQVksRUFBRSw2QkFBNkIsQ0FBQyxXQUFXO1lBQ3ZELGNBQWMsRUFBRSxJQUFJO1NBQ3JCLENBQUM7UUFFRixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7S0FDL0Q7SUFFRCwwREFBMEQ7SUFDMUQsK0NBQStDO0lBQy9DLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN4QyxrQ0FBa0MsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUUvQyxxREFBcUQ7SUFDckQsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQztJQUM5RCxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFFBQThCLENBQUMsQ0FBQztBQUM5RSxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxRQUFpQjtJQUMzQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLFlBQVksR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3hDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDakQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUUsZ0NBQWdDO1FBQ2xFLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDakMsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2xELElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxhQUFhLEtBQUssdUJBQXVCLENBQUMsT0FBTyxFQUFFO1lBQ3hFLGlFQUFpRTtZQUNqRSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDakM7YUFBTSxJQUNILEtBQUssS0FBSyxJQUFJO1lBQ2QsQ0FBQyxhQUFhLEtBQUssdUJBQXVCLENBQUMsT0FBTztnQkFDakQsYUFBYSxLQUFLLGVBQWUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNuRCwwRUFBMEU7WUFDMUUsMkVBQTJFO1lBQzNFLFNBQVM7WUFDVCxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDakM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsUUFBaUI7SUFDbkQsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUV4QyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1FBQ2pELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFFLGdDQUFnQztRQUNsRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztRQUNqQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsV0FBVyxFQUFFO1lBQ3pGLHVEQUF1RDtZQUN2RCxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsYUFBYTtJQUMzQixNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUVqQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFaEMsb0VBQW9FO0lBQ3BFLG9FQUFvRTtJQUNwRSxjQUFjO0lBQ2QsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2RCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQjtJQUNuQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXJELElBQUksUUFBUSxDQUFDLFlBQVksS0FBSyw2QkFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDdkUsOERBQThEO1FBQzlELDhEQUE4RDtRQUM5RCxnRUFBZ0U7UUFDaEUsTUFBTSxHQUFHLEdBQUcsTUFBTSxtQ0FBMkIsQ0FBQztRQUM5QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7UUFDbEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRTtZQUMvQixnRkFBZ0Y7WUFDaEYsZ0ZBQWdGO1lBQ2hGLDJFQUEyRTtZQUMzRSw4QkFBOEI7WUFDOUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEYsdUJBQXVCLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDN0Q7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLEtBQUksQ0FBQyxDQUFFLGlDQUFpQztBQUcxRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLEtBQUksQ0FBQyxDQUFFLGlDQUFpQztBQUVsRjs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFhLElBQUcsQ0FBQyxDQUFFLGlDQUFpQztBQUVuRjs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEtBQWEsSUFBRyxDQUFDLENBQUUsaUNBQWlDO0FBRTNGOzs7R0FHRztBQUNILE1BQU0sVUFBVSxjQUFjLEtBQUksQ0FBQyxDQUFFLGlDQUFpQztBQUV0RTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLEtBQUksQ0FBQyxDQUFFLGlDQUFpQztBQUU5RTs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUFDLE1BQWdCLElBQUcsQ0FBQyxDQUFFLGlDQUFpQztBQUU1Rjs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUFDLE1BQWdCLElBQUcsQ0FBQyxDQUFFLGlDQUFpQztBQUVwRzs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLE1BQWdCLElBQUcsQ0FBQyxDQUFFLGlDQUFpQztBQUV6Rjs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QixDQUFDLE1BQWdCLElBQUcsQ0FBQyxDQUFFLGlDQUFpQztBQUVqRyx3Q0FBd0M7QUFFeEM7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBUyxNQUFNLENBQUMsUUFBc0IsRUFBRSxLQUFpQjtJQUN2RCxJQUFJLEVBQVUsQ0FBQztJQUNmLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDekQsRUFBRSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsRUFBRTtRQUN4QixrQkFBa0IsRUFBRSxDQUFDO1FBQ3JCLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixrREFBa0Q7WUFDbEQsNENBQTRDO1lBQzVDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsUUFBUSxFQUFFLENBQUM7SUFDYixDQUFDLENBQVcsQ0FBQztJQUVsQixJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsNERBQTREO1FBQzVELDZEQUE2RDtRQUM3RCxjQUFjO1FBQ2QsbUJBQW1CLENBQUMsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLGtCQUFrQixDQUFDO0FBQzVCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLGVBQXVCO0lBQ3JELG1EQUFtRDtJQUNuRCx3REFBd0Q7SUFDeEQsT0FBTyxlQUFlLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFFRCwwRkFBMEY7QUFDMUYsU0FBUyxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN2RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RELFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEQsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDMUIsQ0FBQztBQUVELG9EQUFvRDtBQUNwRCxTQUFTLHFCQUFxQixDQUMxQixLQUFZLEVBQUUsZUFBdUIsRUFBRSxRQUE0QjtJQUNyRSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDMUQsU0FBUyxJQUFJLHNCQUFzQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN0RCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsUUFBUSxDQUFDO0FBQzlCLENBQUM7QUFFRCxvR0FBb0c7QUFDcEcsU0FBUyxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN2RCxNQUFNLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEQsU0FBUyxJQUFJLHNCQUFzQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN0RCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUF1QixDQUFDO0FBQ3JELENBQUM7QUFFRCx3REFBd0Q7QUFDeEQsU0FBUyxxQkFBcUIsQ0FDMUIsS0FBWSxFQUFFLGVBQXVCLEVBQUUsZ0JBQW9DO0lBQzdFLE1BQU0sU0FBUyxHQUFHLHNCQUFzQixDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzFELFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEQsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQztBQUMzQyxDQUFDO0FBRUQsU0FBUyx3QkFBd0IsQ0FDN0IsUUFBeUIsRUFBRSxTQUFnQixFQUFFLEtBQVk7SUFDM0QsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVyRCxRQUFRLFFBQVEsRUFBRTtRQUNoQixLQUFLLGVBQWUsQ0FBQyxRQUFRO1lBQzNCLE9BQU8sUUFBUSxDQUFDLGdCQUFnQixDQUFDO1FBQ25DLEtBQUssZUFBZSxDQUFDLE9BQU87WUFDMUIsT0FBTyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7UUFDbkMsS0FBSyxlQUFlLENBQUMsS0FBSztZQUN4QixPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUM7UUFDakMsS0FBSyxlQUFlLENBQUMsV0FBVztZQUM5QixPQUFPLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQztRQUN2QztZQUNFLFNBQVMsSUFBSSxVQUFVLENBQUMsaUNBQWlDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDckUsT0FBTyxJQUFJLENBQUM7S0FDZjtBQUNILENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxRQUF5QixFQUFFLEtBQVksRUFBRSxVQUFzQjtJQUNqRSxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFckMsNEVBQTRFO0lBQzVFLHVFQUF1RTtJQUN2RSxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFBRSxPQUFPO0lBRW5DLG9FQUFvRTtJQUNwRSxTQUFTLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRW5ELE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV6RCxTQUFTLElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO0lBRTdFLE1BQU0sY0FBYyxHQUFHLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUUsOEVBQThFO0lBQzlFLDhFQUE4RTtJQUM5RSw0RUFBNEU7SUFDNUUsd0JBQXdCO0lBQ3hCLElBQUksUUFBUSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsUUFBUSxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDckUsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsUUFBUSxDQUFDO1FBQ3ZDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxNQUFNLGFBQWEsR0FBRyxjQUFjLEdBQUcsYUFBYSxDQUFDO1FBQ3JELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFtQixDQUFDO1FBRW5FLGlFQUFpRTtRQUNqRSxtRUFBbUU7UUFDbkUsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRXBCLHlCQUF5QixDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNqRCxNQUFNLGNBQWMsR0FBRywwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLEtBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRixNQUFNLGFBQWEsR0FBRyw0QkFBNEIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFDLGNBQWMsRUFBQyxDQUFDLENBQUM7UUFDN0Ysb0JBQW9CLENBQ2hCLFVBQVUsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0tBQ3RGO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLFFBQTRCLEVBQUUsS0FBWTtJQUMzRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUMsRUFBRTtRQUNoRSxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDekM7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsUUFBNEIsRUFBRSxLQUFZO0lBQy9FLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQztJQUNsQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0IsSUFBSSxRQUFRLENBQUMsWUFBWSxLQUFLLDZCQUE2QixDQUFDLFdBQVcsRUFBRTtRQUN2RSxxRUFBcUU7UUFDckUsd0VBQXdFO1FBQ3hFLDRFQUE0RTtRQUM1RSxPQUFPO0tBQ1I7SUFFRCxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVoRSxnREFBZ0Q7SUFDaEQsUUFBUSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxXQUFXLENBQUM7SUFFbEUsMERBQTBEO0lBQzFELE1BQU0sMEJBQTBCLEdBQzVCLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7SUFFN0UsTUFBTSxjQUFjLEdBQUcsMEJBQTBCLENBQUMsQ0FBQztRQUMvQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUNyRSxRQUFRLENBQUMsb0JBQW9CLENBQUM7SUFFbEMsb0VBQW9FO0lBQ3BFLHdFQUF3RTtJQUN4RSw2Q0FBNkM7SUFDN0MsSUFBSSxDQUFDLGNBQWMsRUFBRTtRQUNuQixRQUFRLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ3BELFFBQVEsQ0FBQyxZQUFZLEdBQUcsNkJBQTZCLENBQUMsUUFBUSxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTztLQUNSO0lBRUQsb0VBQW9FO0lBQ3BFLHVFQUF1RTtJQUN2RSxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFMUMsaURBQWlEO0lBQ2pELFFBQVEsQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM1RSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDbkIsTUFBTSxhQUFhLEdBQXFCLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBZ0IsRUFBRSxDQUFDO1FBRWpDLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQzVCLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxXQUFXLEVBQUU7Z0JBQ2pDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ2hDLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2hGLElBQUksWUFBWSxFQUFFO29CQUNoQixhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUNsQztxQkFBTTtvQkFDTCxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3ZDLElBQUksT0FBTyxFQUFFO3dCQUNYLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7cUJBQ3hCO2lCQUNGO2FBQ0Y7aUJBQU07Z0JBQ0wsTUFBTSxHQUFHLElBQUksQ0FBQztnQkFDZCxNQUFNO2FBQ1A7U0FDRjtRQUVELHdEQUF3RDtRQUN4RCxRQUFRLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUUvQixJQUFJLE1BQU0sRUFBRTtZQUNWLFFBQVEsQ0FBQyxZQUFZLEdBQUcsNkJBQTZCLENBQUMsTUFBTSxDQUFDO1NBQzlEO2FBQU07WUFDTCxRQUFRLENBQUMsWUFBWSxHQUFHLDZCQUE2QixDQUFDLFFBQVEsQ0FBQztZQUUvRCw2RUFBNkU7WUFDN0UsTUFBTSxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxLQUFNLENBQUM7WUFDbkQsSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDNUIsaUJBQWlCLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDdkUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDNUQsYUFBYSxDQUFDO2FBQ25CO1lBQ0QsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsaUJBQWlCLENBQUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUM3RCxDQUFDLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDbEQsUUFBUSxDQUFDO2FBQ2Q7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELHVFQUF1RTtBQUN2RSxTQUFTLGlCQUFpQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ25ELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUUxQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckQscUJBQXFCLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsb0NBQW9DLENBQ3pDLFFBQTRCLEVBQUUsS0FBWSxFQUFFLFVBQXNCO0lBQ3BFLFNBQVM7UUFDTCxhQUFhLENBQ1QsUUFBUSxDQUFDLGNBQWMsRUFBRSx1REFBdUQsQ0FBQyxDQUFDO0lBRTFGLFFBQVEsQ0FBQyxjQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNqQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsUUFBUSxFQUFFO1lBQ3BFLFNBQVMsSUFBSSxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4RCx1REFBdUQ7WUFDdkQscUJBQXFCLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FFcEU7YUFBTSxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssNkJBQTZCLENBQUMsTUFBTSxFQUFFO1lBQ3pFLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2pFO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsdUVBQXVFO0FBQ3ZFLFNBQVMsb0JBQW9CLENBQUMsS0FBWSxFQUFFLFFBQTRCO0lBQ3RFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxhQUFhLENBQUM7SUFDaEUsT0FBTyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBbUIsQ0FBQztBQUMxRCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsaUJBQWlCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDbkQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQ2xDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUUxQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDO1FBQUUsT0FBTztJQUUvQyxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckQsNkVBQTZFO0lBQzdFLDRGQUE0RjtJQUM1RixxQkFBcUIsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztJQUVsRSxRQUFRLFFBQVEsQ0FBQyxZQUFZLEVBQUU7UUFDN0IsS0FBSyw2QkFBNkIsQ0FBQyxXQUFXO1lBQzVDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV4QyxzREFBc0Q7WUFDdEQsSUFBSyxRQUFRLENBQUMsWUFBOEM7Z0JBQ3hELDZCQUE2QixDQUFDLFdBQVcsRUFBRTtnQkFDN0Msb0NBQW9DLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQzthQUNuRTtZQUNELE1BQU07UUFDUixLQUFLLDZCQUE2QixDQUFDLFdBQVc7WUFDNUMsb0NBQW9DLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsRSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxRQUFRO1lBQ3pDLFNBQVMsSUFBSSxnQ0FBZ0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNuRSxNQUFNO1FBQ1IsS0FBSyw2QkFBNkIsQ0FBQyxNQUFNO1lBQ3ZDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU07UUFDUjtZQUNFLElBQUksU0FBUyxFQUFFO2dCQUNiLFVBQVUsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2FBQ3pDO0tBQ0o7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsZ0NBQWdDLENBQUMsUUFBNEI7SUFDcEUsV0FBVyxDQUNQLFFBQVEsQ0FBQyxZQUFZLEVBQUUsNkJBQTZCLENBQUMsUUFBUSxFQUM3RCxtREFBbUQsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFzQkQ7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQUMsTUFBTSxrQ0FBa0MsR0FDM0MsSUFBSSxjQUFjLENBQ2QsU0FBUyxDQUFDLENBQUMsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFFL0Q7Ozs7O0dBS0c7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQWM7SUFDMUMsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQztRQUM5QixDQUFDLE9BQVEsS0FBNEIsQ0FBQyxnQkFBZ0IsS0FBSyxRQUFRLENBQUMsQ0FBQztBQUMzRSxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FDM0IsSUFBSSxjQUFjLENBQW1CLFNBQVMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBWWhGOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsV0FBZ0M7SUFDM0UsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLEtBQUssSUFBSSxDQUFDLEdBQUcsYUFBYSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUQsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLDBFQUEwRTtZQUMxRSwrRUFBK0U7WUFDL0UseUJBQXlCO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBSyxLQUFLLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ1gsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQVUsQ0FBQztnQkFDckMsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNsQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FBQztvQkFDdkQsdURBQXVEO29CQUN2RCw2REFBNkQ7b0JBQzdELFNBQVM7aUJBQ1Y7YUFDRjtZQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hFLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDckQ7U0FDRjthQUFNLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzVCLCtEQUErRDtZQUMvRCxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3ZDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDNUIsUUFBa0IsRUFBRSxRQUE0QixFQUFFLEdBQVcsRUFBRSxTQUF1QjtJQUN4RixRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkUsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMscUJBQXFCLENBQUMsUUFBa0IsRUFBRSxRQUE0QjtJQUM3RSxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSx3QkFBd0I7SUFBOUI7UUFDVSxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQW1ELENBQUM7SUEyQzlFLENBQUM7SUF6Q0MsR0FBRyxDQUFDLFFBQTRCLEVBQUUsR0FBVyxFQUFFLFFBQXNCO1FBQ25FLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3RDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbkIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDcEI7UUFDRCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO1FBQ2xDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELEdBQUcsQ0FBQyxRQUE0QixFQUFFLEdBQVc7UUFDM0MsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxPQUFPLENBQUMsUUFBNEI7UUFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsSUFBSSxLQUFLLEVBQUU7WUFDVCxLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO29CQUNoQyxRQUFRLEVBQUUsQ0FBQztpQkFDWjthQUNGO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDOUI7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyQjtRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHdCQUF3QjtRQUMvQixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx3QkFBd0IsRUFBRTtLQUM5QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VuLCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7ZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXd9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi92aWV3cyc7XG5pbXBvcnQge3BvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXJ9IGZyb20gJy4uLy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRJbmRleEluRGVjbFJhbmdlLCBhc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRUTm9kZUZvckxWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrQmVoYXZpb3IsIERlZmVyQmxvY2tDb25maWcsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGUsIERlZmVyQmxvY2tUcmlnZ2VycywgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUsIERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnLCBEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWcsIERlcGVuZGVuY3lSZXNvbHZlckZuLCBMRGVmZXJCbG9ja0RldGFpbHMsIFREZWZlckJsb2NrRGV0YWlsc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZlcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGVzdHJveWVkLCBpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXcsIFBBUkVOVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRTZWxlY3RlZFROb2RlLCBnZXRUVmlldywgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGdldFROb2RlLCByZW1vdmVMVmlld09uRGVzdHJveSwgc3RvcmVMVmlld09uRGVzdHJveX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YWRkTFZpZXdUb0xDb250YWluZXIsIGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcsIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIsIHNob3VsZEFkZFZpZXdUb0RvbX0gZnJvbSAnLi4vdmlld19tYW5pcHVsYXRpb24nO1xuXG5pbXBvcnQge8m1ybV0ZW1wbGF0ZX0gZnJvbSAnLi90ZW1wbGF0ZSc7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIGRlZmVyIGJsb2NrcyBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuICpcbiAqIEN1cnJlbnRseSwgZGVmZXIgYmxvY2tzIGFyZSBub3QgdHJpZ2dlcmVkIG9uIHRoZSBzZXJ2ZXIsXG4gKiBvbmx5IHBsYWNlaG9sZGVyIGNvbnRlbnQgaXMgcmVuZGVyZWQgKGlmIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3I6IEluamVjdG9yKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGluamVjdG9yLmdldChERUZFUl9CTE9DS19DT05GSUcsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBpZiAoY29uZmlnPy5iZWhhdmlvciA9PT0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpO1xufVxuXG4vKipcbiAqIFNoaW1zIGZvciB0aGUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGFuZCBgY2FuY2VsSWRsZUNhbGxiYWNrYCBmdW5jdGlvbnMgZm9yIGVudmlyb25tZW50c1xuICogd2hlcmUgdGhvc2UgZnVuY3Rpb25zIGFyZSBub3QgYXZhaWxhYmxlIChlLmcuIE5vZGUuanMpLlxuICovXG5jb25zdCBfcmVxdWVzdElkbGVDYWxsYmFjayA9XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gcmVxdWVzdElkbGVDYWxsYmFjayA6IHNldFRpbWVvdXQ7XG5jb25zdCBfY2FuY2VsSWRsZUNhbGxiYWNrID1cbiAgICB0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgPyBjYW5jZWxJZGxlQ2FsbGJhY2sgOiBjbGVhclRpbWVvdXQ7XG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgYHsjZGVmZXJ9YCBibG9ja3MuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBgZGVmZXJgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIHByaW1hcnlUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIHByaW1hcnkgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBkZXBlbmRlbmN5UmVzb2x2ZXJGbiBGdW5jdGlvbiB0aGF0IGNvbnRhaW5zIGRlcGVuZGVuY2llcyBmb3IgdGhpcyBkZWZlciBibG9jay5cbiAqIEBwYXJhbSBsb2FkaW5nVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBgezpsb2FkaW5nfWAgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgYHs6cGxhY2Vob2xkZXJ9YCBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGVycm9yVG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBgezplcnJvcn1gIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gbG9hZGluZ0NvbmZpZ0luZGV4IEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlIGB7OmxvYWRpbmd9YC5cbiAqICAgICBibG9jay5cbiAqIEBwYXJhbSBwbGFjZWhvbGRlckNvbmZpZ0luZGV4SW5kZXggaW4gdGhlIGNvbnN0YW50cyBhcnJheSBvZiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGVcbiAqICAgICBgezpwbGFjZWhvbGRlcn1gIGJsb2NrLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXIoXG4gICAgaW5kZXg6IG51bWJlciwgcHJpbWFyeVRtcGxJbmRleDogbnVtYmVyLCBkZXBlbmRlbmN5UmVzb2x2ZXJGbj86IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGwsXG4gICAgbG9hZGluZ1RtcGxJbmRleD86IG51bWJlcnxudWxsLCBwbGFjZWhvbGRlclRtcGxJbmRleD86IG51bWJlcnxudWxsLFxuICAgIGVycm9yVG1wbEluZGV4PzogbnVtYmVyfG51bGwsIGxvYWRpbmdDb25maWdJbmRleD86IG51bWJlcnxudWxsLFxuICAgIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgybXJtXRlbXBsYXRlKGluZGV4LCBudWxsLCAwLCAwKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgY29uc3QgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzID0ge1xuICAgICAgcHJpbWFyeVRtcGxJbmRleCxcbiAgICAgIGxvYWRpbmdUbXBsSW5kZXg6IGxvYWRpbmdUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIHBsYWNlaG9sZGVyVG1wbEluZGV4OiBwbGFjZWhvbGRlclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgZXJyb3JUbXBsSW5kZXg6IGVycm9yVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlckJsb2NrQ29uZmlnOiBwbGFjZWhvbGRlckNvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkUGxhY2Vob2xkZXJCbG9ja0NvbmZpZz4odFZpZXdDb25zdHMsIHBsYWNlaG9sZGVyQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgbG9hZGluZ0Jsb2NrQ29uZmlnOiBsb2FkaW5nQ29uZmlnSW5kZXggIT0gbnVsbCA/XG4gICAgICAgICAgZ2V0Q29uc3RhbnQ8RGVmZXJyZWRMb2FkaW5nQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBsb2FkaW5nQ29uZmlnSW5kZXgpIDpcbiAgICAgICAgICBudWxsLFxuICAgICAgZGVwZW5kZW5jeVJlc29sdmVyRm46IGRlcGVuZGVuY3lSZXNvbHZlckZuID8/IG51bGwsXG4gICAgICBsb2FkaW5nU3RhdGU6IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVELFxuICAgICAgbG9hZGluZ1Byb21pc2U6IG51bGwsXG4gICAgfTtcblxuICAgIHNldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgYWRqdXN0ZWRJbmRleCwgZGVmZXJCbG9ja0NvbmZpZyk7XG4gIH1cblxuICAvLyBMb29rdXAgZGVoeWRyYXRlZCB2aWV3cyB0aGF0IGJlbG9uZyB0byB0aGlzIExDb250YWluZXIuXG4gIC8vIEluIGNsaWVudC1vbmx5IG1vZGUsIHRoaXMgb3BlcmF0aW9uIGlzIG5vb3AuXG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1thZGp1c3RlZEluZGV4XTtcbiAgcG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcihsQ29udGFpbmVyKTtcblxuICAvLyBJbml0IGluc3RhbmNlLXNwZWNpZmljIGRlZmVyIGRldGFpbHMgYW5kIHN0b3JlIGl0LlxuICBjb25zdCBsRGV0YWlscyA9IFtdO1xuICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsO1xuICBzZXRMRGVmZXJCbG9ja0RldGFpbHMobFZpZXcsIGFkanVzdGVkSW5kZXgsIGxEZXRhaWxzIGFzIExEZWZlckJsb2NrRGV0YWlscyk7XG59XG5cbi8qKlxuICogTG9hZHMgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIHdoZW4gYSB0cmlnZ2VyIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlcldoZW4ocmF3VmFsdWU6IHVua25vd24pIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSAmJiByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsKSB7XG4gICAgICAvLyBJZiBub3RoaW5nIGlzIHJlbmRlcmVkIHlldCwgcmVuZGVyIGEgcGxhY2Vob2xkZXIgKGlmIGRlZmluZWQpLlxuICAgICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICB2YWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAocmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCB8fFxuICAgICAgICAgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja1N0YXRlLlBsYWNlaG9sZGVyKSkge1xuICAgICAgLy8gVGhlIGB3aGVuYCBjb25kaXRpb24gaGFzIGNoYW5nZWQgdG8gYHRydWVgLCB0cmlnZ2VyIGRlZmVyIGJsb2NrIGxvYWRpbmdcbiAgICAgIC8vIGlmIHRoZSBibG9jayBpcyBlaXRoZXIgaW4gaW5pdGlhbCAobm90aGluZyBpcyByZW5kZXJlZCkgb3IgYSBwbGFjZWhvbGRlclxuICAgICAgLy8gc3RhdGUuXG4gICAgICB0cmlnZ2VyRGVmZXJCbG9jayhsVmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByZWZldGNoZXMgdGhlIGRlZmVycmVkIGNvbnRlbnQgd2hlbiBhIHZhbHVlIGJlY29tZXMgdHJ1dGh5LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoV2hlbihyYXdWYWx1ZTogdW5rbm93bikge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcblxuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgcmF3VmFsdWUpKSB7XG4gICAgY29uc3QgdmFsdWUgPSBCb29sZWFuKHJhd1ZhbHVlKTsgIC8vIGhhbmRsZSB0cnV0aHkgb3IgZmFsc3kgdmFsdWVzXG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgY29uc3QgdE5vZGUgPSBnZXRTZWxlY3RlZFROb2RlKCk7XG4gICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcbiAgICBpZiAodmFsdWUgPT09IHRydWUgJiYgdERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgICAgLy8gSWYgbG9hZGluZyBoYXMgbm90IGJlZW4gc3RhcnRlZCB5ZXQsIHRyaWdnZXIgaXQgbm93LlxuICAgICAgdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzLCBsVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB1cCBoYW5kbGVycyB0aGF0IHJlcHJlc2VudCBgb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbklkbGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG5cbiAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcblxuICAvLyBOb3RlOiB3ZSBwYXNzIGFuIGBsVmlld2AgYXMgYSBzZWNvbmQgYXJndW1lbnQgdG8gY2FuY2VsIGFuIGBpZGxlYFxuICAvLyBjYWxsYmFjayBpbiBjYXNlIGFuIExWaWV3IGdvdCBkZXN0cm95ZWQgYmVmb3JlIGFuIGBpZGxlYCBjYWxsYmFja1xuICAvLyBpcyBpbnZva2VkLlxuICBvbklkbGUoKCkgPT4gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXcsIHROb2RlKSwgbFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaWRsZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSWRsZSgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG5cbiAgaWYgKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9PT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuTk9UX1NUQVJURUQpIHtcbiAgICAvLyBQcmV2ZW50IHNjaGVkdWxpbmcgbW9yZSB0aGFuIG9uZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgY2FsbFxuICAgIC8vIGZvciBlYWNoIGRlZmVyIGJsb2NrLiBGb3IgdGhpcyByZWFzb24gd2UgdXNlIG9ubHkgYSB0cmlnZ2VyXG4gICAgLy8gaWRlbnRpZmllciBpbiBhIGtleSwgc28gYWxsIGluc3RhbmNlcyB3b3VsZCB1c2UgdGhlIHNhbWUga2V5LlxuICAgIGNvbnN0IGtleSA9IFN0cmluZyhEZWZlckJsb2NrVHJpZ2dlcnMuT25JZGxlKTtcbiAgICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gICAgY29uc3QgbWFuYWdlciA9IGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpO1xuICAgIGlmICghbWFuYWdlci5oYXModERldGFpbHMsIGtleSkpIHtcbiAgICAgIC8vIEluIGNhc2Ugb2YgcHJlZmV0Y2hpbmcsIHdlIGludGVudGlvbmFsbHkgYXZvaWQgY2FuY2VsbGluZyByZXNvdXJjZSBsb2FkaW5nIGlmXG4gICAgICAvLyBhbiB1bmRlcmx5aW5nIExWaWV3IGdldCBkZXN0cm95ZWQgKHRodXMgcGFzc2luZyBgbnVsbGAgYXMgYSBzZWNvbmQgYXJndW1lbnQpLFxuICAgICAgLy8gYmVjYXVzZSB0aGVyZSBtaWdodCBiZSBvdGhlciBMVmlld3MgKHRoYXQgcmVwcmVzZW50IGVtYmVkZGVkIHZpZXdzKSB0aGF0XG4gICAgICAvLyBkZXBlbmQgb24gcmVzb3VyY2UgbG9hZGluZy5cbiAgICAgIGNvbnN0IGNsZWFudXBGbiA9IG9uSWRsZSgoKSA9PiB0cmlnZ2VyUHJlZmV0Y2hpbmcodERldGFpbHMsIGxWaWV3KSwgbnVsbCAvKiBMVmlldyAqLyk7XG4gICAgICByZWdpc3RlclREZXRhaWxzQ2xlYW51cChpbmplY3RvciwgdERldGFpbHMsIGtleSwgY2xlYW51cEZuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGltbWVkaWF0ZWAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkltbWVkaWF0ZSgpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbW1lZGlhdGUoKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB0aW1lcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgdGltZSB0byB3YWl0IGJlZm9yZSBsb2FkaW5nIHRoZSBjb250ZW50LlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVGltZXIoZGVsYXk6IG51bWJlcikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdGltZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gZGVsYXkgQW1vdW50IG9mIHRpbWUgdG8gd2FpdCBiZWZvcmUgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblRpbWVyKGRlbGF5OiBudW1iZXIpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSG92ZXIoKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBob3ZlcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uSG92ZXIoKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiBpbnRlcmFjdGlvbmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0YXJnZXQgT3B0aW9uYWwgZWxlbWVudCBvbiB3aGljaCB0byBsaXN0ZW4gZm9yIGhvdmVyIGV2ZW50cy5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPbkludGVyYWN0aW9uKHRhcmdldD86IHVua25vd24pIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRhcmdldCBPcHRpb25hbCBlbGVtZW50IG9uIHdoaWNoIHRvIGxpc3RlbiBmb3IgaG92ZXIgZXZlbnRzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25JbnRlcmFjdGlvbih0YXJnZXQ/OiB1bmtub3duKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBvbiB2aWV3cG9ydGAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0YXJnZXQgT3B0aW9uYWwgZWxlbWVudCBvbiB3aGljaCB0byBsaXN0ZW4gZm9yIGhvdmVyIGV2ZW50cy5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJPblZpZXdwb3J0KHRhcmdldD86IHVua25vd24pIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIHZpZXdwb3J0YCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRhcmdldCBPcHRpb25hbCBlbGVtZW50IG9uIHdoaWNoIHRvIGxpc3RlbiBmb3IgaG92ZXIgZXZlbnRzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25WaWV3cG9ydCh0YXJnZXQ/OiB1bmtub3duKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKioqKioqKioqIEhlbHBlciBmdW5jdGlvbnMgKioqKioqKioqKi9cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gc2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gYSBicm93c2VyIGJlY29tZXMgaWRsZS5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHdoZW4gYSBicm93c2VyIGJlY29tZXMgaWRsZS5cbiAqIEBwYXJhbSBsVmlldyBBbiBvcHRpb25hbCBMVmlldyB0aGF0IGhvc3RzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suIExWaWV3IGlzXG4gKiAgICB1c2VkIHRvIHJlZ2lzdGVyIGEgY2xlYW51cCBjYWxsYmFjayBpbiBjYXNlIHRoYXQgTFZpZXcgZ290IGRlc3Ryb3llZCBiZWZvcmVcbiAqICAgIGNhbGxiYWNrIHdhcyBpbnZva2VkLiBJbiB0aGlzIGNhc2UsIGFuIGBpZGxlYCBjYWxsYmFjayBpcyBuZXZlciBpbnZva2VkLiBUaGlzIGlzXG4gKiAgICBoZWxwZnVsIGZvciBjYXNlcyB3aGVuIGEgZGVmZXIgYmxvY2sgaGFzIHNjaGVkdWxlZCByZW5kZXJpbmcsIGJ1dCBhbiB1bmRlcmx5aW5nXG4gKiAgICBMVmlldyBnb3QgZGVzdHJveWVkIHByaW9yIHRvIHRoIGJsb2NrIHJlbmRlcmluZy5cbiAqL1xuZnVuY3Rpb24gb25JZGxlKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlld3xudWxsKTogVm9pZEZ1bmN0aW9uIHtcbiAgbGV0IGlkOiBudW1iZXI7XG4gIGNvbnN0IHJlbW92ZUlkbGVDYWxsYmFjayA9ICgpID0+IF9jYW5jZWxJZGxlQ2FsbGJhY2soaWQpO1xuICBpZCA9IF9yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgIHJlbW92ZUlkbGVDYWxsYmFjaygpO1xuICAgICAgICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgICAgIC8vIFRoZSBpZGxlIGNhbGxiYWNrIGlzIGludm9rZWQsIHdlIG5vIGxvbmdlciBuZWVkXG4gICAgICAgICAgIC8vIHRvIHJldGFpbiBhIGNsZWFudXAgY2FsbGJhY2sgaW4gYW4gTFZpZXcuXG4gICAgICAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGxWaWV3LCByZW1vdmVJZGxlQ2FsbGJhY2spO1xuICAgICAgICAgfVxuICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICB9KSBhcyBudW1iZXI7XG5cbiAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgLy8gU3RvcmUgYSBjbGVhbnVwIGZ1bmN0aW9uIG9uIExWaWV3LCBzbyB0aGF0IHdlIGNhbmNlbCBpZGxlXG4gICAgLy8gY2FsbGJhY2sgaW4gY2FzZSB0aGlzIExWaWV3IGlzIGRlc3Ryb3llZCBiZWZvcmUgYSBjYWxsYmFja1xuICAgIC8vIGlzIGludm9rZWQuXG4gICAgc3RvcmVMVmlld09uRGVzdHJveShsVmlldywgcmVtb3ZlSWRsZUNhbGxiYWNrKTtcbiAgfVxuICByZXR1cm4gcmVtb3ZlSWRsZUNhbGxiYWNrO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgYSBkYXRhIHNsb3QgaW5kZXggZm9yIGRlZmVyIGJsb2NrIGluZm8gKGVpdGhlciBzdGF0aWMgb3JcbiAqIGluc3RhbmNlLXNwZWNpZmljKSwgZ2l2ZW4gYW4gaW5kZXggb2YgYSBkZWZlciBpbnN0cnVjdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXg6IG51bWJlcikge1xuICAvLyBJbnN0YW5jZSBzdGF0ZSBpcyBsb2NhdGVkIGF0IHRoZSAqbmV4dCogcG9zaXRpb25cbiAgLy8gYWZ0ZXIgdGhlIGRlZmVyIGJsb2NrIHNsb3QgaW4gYW4gTFZpZXcgb3IgVFZpZXcuZGF0YS5cbiAgcmV0dXJuIGRlZmVyQmxvY2tJbmRleCArIDE7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBkZWZlciBibG9jayBzdGF0ZSBmcm9tIGFuIExWaWV3LCBnaXZlbiBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogTERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgodE5vZGUuaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W3Nsb3RJbmRleF07XG59XG5cbi8qKiBTdG9yZXMgYSBkZWZlciBibG9jayBpbnN0YW5jZSBzdGF0ZSBpbiBMVmlldy4gKi9cbmZ1bmN0aW9uIHNldExEZWZlckJsb2NrRGV0YWlscyhcbiAgICBsVmlldzogTFZpZXcsIGRlZmVyQmxvY2tJbmRleDogbnVtYmVyLCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICBsVmlld1tzbG90SW5kZXhdID0gbERldGFpbHM7XG59XG5cbi8qKiBSZXRyaWV2ZXMgc3RhdGljIGluZm8gYWJvdXQgYSBkZWZlciBibG9jaywgZ2l2ZW4gYSBUVmlldyBhbmQgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBibG9jay4gKi9cbmZ1bmN0aW9uIGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IFREZWZlckJsb2NrRGV0YWlscyB7XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgodE5vZGUuaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgcmV0dXJuIHRWaWV3LmRhdGFbc2xvdEluZGV4XSBhcyBURGVmZXJCbG9ja0RldGFpbHM7XG59XG5cbi8qKiBTdG9yZXMgYSBkZWZlciBibG9jayBzdGF0aWMgaW5mbyBpbiBgVFZpZXcuZGF0YWAuICovXG5mdW5jdGlvbiBzZXRURGVmZXJCbG9ja0RldGFpbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBkZWZlckJsb2NrSW5kZXg6IG51bWJlciwgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHRWaWV3LmRhdGFbc2xvdEluZGV4XSA9IGRlZmVyQmxvY2tDb25maWc7XG59XG5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlSW5kZXhGb3JTdGF0ZShcbiAgICBuZXdTdGF0ZTogRGVmZXJCbG9ja1N0YXRlLCBob3N0TFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IHRWaWV3ID0gaG9zdExWaWV3W1RWSUVXXTtcbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICBzd2l0Y2ggKG5ld1N0YXRlKSB7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuQ29tcGxldGU6XG4gICAgICByZXR1cm4gdERldGFpbHMucHJpbWFyeVRtcGxJbmRleDtcbiAgICBjYXNlIERlZmVyQmxvY2tTdGF0ZS5Mb2FkaW5nOlxuICAgICAgcmV0dXJuIHREZXRhaWxzLmxvYWRpbmdUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuRXJyb3I6XG4gICAgICByZXR1cm4gdERldGFpbHMuZXJyb3JUbXBsSW5kZXg7XG4gICAgY2FzZSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXI6XG4gICAgICByZXR1cm4gdERldGFpbHMucGxhY2Vob2xkZXJUbXBsSW5kZXg7XG4gICAgZGVmYXVsdDpcbiAgICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKGBVbmV4cGVjdGVkIGRlZmVyIGJsb2NrIHN0YXRlOiAke25ld1N0YXRlfWApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmFuc2l0aW9ucyBhIGRlZmVyIGJsb2NrIHRvIHRoZSBuZXcgc3RhdGUuIFVwZGF0ZXMgdGhlICBuZWNlc3NhcnlcbiAqIGRhdGEgc3RydWN0dXJlcyBhbmQgcmVuZGVycyBjb3JyZXNwb25kaW5nIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBuZXdTdGF0ZSBOZXcgc3RhdGUgdGhhdCBzaG91bGQgYmUgYXBwbGllZCB0byB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgdGhhdCByZXByZXNlbnRzIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgbmV3U3RhdGU6IERlZmVyQmxvY2tTdGF0ZSwgdE5vZGU6IFROb2RlLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogdm9pZCB7XG4gIGNvbnN0IGhvc3RMVmlldyA9IGxDb250YWluZXJbUEFSRU5UXTtcblxuICAvLyBDaGVjayBpZiB0aGlzIHZpZXcgaXMgbm90IGRlc3Ryb3llZC4gU2luY2UgdGhlIGxvYWRpbmcgcHJvY2VzcyB3YXMgYXN5bmMsXG4gIC8vIHRoZSB2aWV3IG1pZ2h0IGVuZCB1cCBiZWluZyBkZXN0cm95ZWQgYnkgdGhlIHRpbWUgcmVuZGVyaW5nIGhhcHBlbnMuXG4gIGlmIChpc0Rlc3Ryb3llZChob3N0TFZpZXcpKSByZXR1cm47XG5cbiAgLy8gTWFrZSBzdXJlIHRoaXMgVE5vZGUgYmVsb25ncyB0byBUVmlldyB0aGF0IHJlcHJlc2VudHMgaG9zdCBMVmlldy5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodE5vZGUsIGhvc3RMVmlldyk7XG5cbiAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoaG9zdExWaWV3LCB0Tm9kZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobERldGFpbHMsICdFeHBlY3RlZCBhIGRlZmVyIGJsb2NrIHN0YXRlIGRlZmluZWQnKTtcblxuICBjb25zdCBzdGF0ZVRtcGxJbmRleCA9IGdldFRlbXBsYXRlSW5kZXhGb3JTdGF0ZShuZXdTdGF0ZSwgaG9zdExWaWV3LCB0Tm9kZSk7XG4gIC8vIE5vdGU6IHdlIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUgaWYgdGhlIHByZXZpb3VzIHN0YXRlIHdhcyByZXByZXNlbnRlZFxuICAvLyB3aXRoIGEgbnVtYmVyIHRoYXQgaXMgbGVzcyB0aGFuIHRoZSBuZXh0IHN0YXRlLiBGb3IgZXhhbXBsZSwgaWYgdGhlIGN1cnJlbnRcbiAgLy8gc3RhdGUgaXMgXCJsb2FkaW5nXCIgKHJlcHJlc2VudGVkIGFzIGAyYCksIHdlIHNob3VsZCBub3Qgc2hvdyBhIHBsYWNlaG9sZGVyXG4gIC8vIChyZXByZXNlbnRlZCBhcyBgMWApLlxuICBpZiAobERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdIDwgbmV3U3RhdGUgJiYgc3RhdGVUbXBsSW5kZXggIT09IG51bGwpIHtcbiAgICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBzdGF0ZVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0VFZpZXcsIGFkanVzdGVkSW5kZXgpIGFzIFRDb250YWluZXJOb2RlO1xuXG4gICAgLy8gVGhlcmUgaXMgb25seSAxIHZpZXcgdGhhdCBjYW4gYmUgcHJlc2VudCBpbiBhbiBMQ29udGFpbmVyIHRoYXRcbiAgICAvLyByZXByZXNlbnRzIGEgYHsjZGVmZXJ9YCBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcbiAgICBjb25zdCBkZWh5ZHJhdGVkVmlldyA9IGZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3KGxDb250YWluZXIsIHROb2RlLnRWaWV3IS5zc3JJZCk7XG4gICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGNyZWF0ZUFuZFJlbmRlckVtYmVkZGVkTFZpZXcoaG9zdExWaWV3LCB0Tm9kZSwgbnVsbCwge2RlaHlkcmF0ZWRWaWV3fSk7XG4gICAgYWRkTFZpZXdUb0xDb250YWluZXIoXG4gICAgICAgIGxDb250YWluZXIsIGVtYmVkZGVkTFZpZXcsIHZpZXdJbmRleCwgc2hvdWxkQWRkVmlld1RvRG9tKHROb2RlLCBkZWh5ZHJhdGVkVmlldykpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBwcmVmZXRjaGluZyBvZiBkZXBlbmRlbmNpZXMgZm9yIGEgZGVmZXIgYmxvY2suXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclByZWZldGNoaW5nKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGxWaWV3OiBMVmlldykge1xuICBpZiAobFZpZXdbSU5KRUNUT1JdICYmIHNob3VsZFRyaWdnZXJEZWZlckJsb2NrKGxWaWV3W0lOSkVDVE9SXSEpKSB7XG4gICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyBpZiB0aGUgcHJvY2VzcyBoYXNuJ3Qgc3RhcnRlZCB5ZXQuXG4gKlxuICogQHBhcmFtIHREZXRhaWxzIFN0YXRpYyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxWaWV3IExWaWV3IG9mIGEgaG9zdCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlICE9PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCkge1xuICAgIC8vIElmIHRoZSBsb2FkaW5nIHN0YXR1cyBpcyBkaWZmZXJlbnQgZnJvbSBpbml0aWFsIG9uZSwgaXQgbWVhbnMgdGhhdFxuICAgIC8vIHRoZSBsb2FkaW5nIG9mIGRlcGVuZGVuY2llcyBpcyBpbiBwcm9ncmVzcyBhbmQgdGhlcmUgaXMgbm90aGluZyB0byBkb1xuICAgIC8vIGluIHRoaXMgZnVuY3Rpb24uIEFsbCBkZXRhaWxzIGNhbiBiZSBvYnRhaW5lZCBmcm9tIHRoZSBgdERldGFpbHNgIG9iamVjdC5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmltYXJ5QmxvY2tUTm9kZSA9IGdldFByaW1hcnlCbG9ja1ROb2RlKHRWaWV3LCB0RGV0YWlscyk7XG5cbiAgLy8gU3dpdGNoIGZyb20gTk9UX1NUQVJURUQgLT4gSU5fUFJPR1JFU1Mgc3RhdGUuXG4gIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTO1xuXG4gIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgY29uc3QgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgPVxuICAgICAgaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgP1xuICAgICAgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IuaW50ZXJjZXB0KHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuKSA6XG4gICAgICB0RGV0YWlscy5kZXBlbmRlbmN5UmVzb2x2ZXJGbjtcblxuICAvLyBUaGUgYGRlcGVuZGVuY2llc0ZuYCBtaWdodCBiZSBgbnVsbGAgd2hlbiBhbGwgZGVwZW5kZW5jaWVzIHdpdGhpblxuICAvLyBhIGdpdmVuIGB7I2RlZmVyfWAgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRGVmZXIgYmxvY2sgbWF5IGhhdmUgbXVsdGlwbGUgcHJlZmV0Y2ggdHJpZ2dlcnMuIE9uY2UgdGhlIGxvYWRpbmdcbiAgLy8gc3RhcnRzLCBpbnZva2UgYWxsIGNsZWFuIGZ1bmN0aW9ucywgc2luY2UgdGhleSBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbiAgaW52b2tlVERldGFpbHNDbGVhbnVwKGluamVjdG9yLCB0RGV0YWlscyk7XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnkgP1xuICAgICAgICAgICAgWy4uLnByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCAuLi5kaXJlY3RpdmVEZWZzXSA6XG4gICAgICAgICAgICBkaXJlY3RpdmVEZWZzO1xuICAgICAgfVxuICAgICAgaWYgKHBpcGVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID9cbiAgICAgICAgICAgIFsuLi5wcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnksIC4uLnBpcGVEZWZzXSA6XG4gICAgICAgICAgICBwaXBlRGVmcztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgYHs6cGxhY2Vob2xkZXJ9YCBjb250ZW50IChpZiBwcmVzZW50KSAqL1xuZnVuY3Rpb24gcmVuZGVyUGxhY2Vob2xkZXIobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsIHROb2RlLCBsQ29udGFpbmVyKTtcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIHRoZSBcImxvYWRpbmdcIiBQcm9taXNlIGFuZCByZW5kZXJzIGNvcnJlc3BvbmRpbmcgZGVmZXIgc3ViLWJsb2NrLFxuICogYmFzZWQgb24gdGhlIGxvYWRpbmcgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdE5vZGUgUmVwcmVzZW50cyBkZWZlciBibG9jayBpbmZvIHNoYXJlZCBhY3Jvc3MgYWxsIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKFxuICAgIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgdERldGFpbHMubG9hZGluZ1Byb21pc2UsICdFeHBlY3RlZCBsb2FkaW5nIFByb21pc2UgdG8gZXhpc3Qgb24gdGhpcyBkZWZlciBibG9jaycpO1xuXG4gIHREZXRhaWxzLmxvYWRpbmdQcm9taXNlIS50aGVuKCgpID0+IHtcbiAgICBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5DT01QTEVURSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcblxuICAgICAgLy8gRXZlcnl0aGluZyBpcyBsb2FkZWQsIHNob3cgdGhlIHByaW1hcnkgYmxvY2sgY29udGVudFxuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gICAgfSBlbHNlIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkZBSUxFRCkge1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5FcnJvciwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgbWFpbiBjb250ZW50IG9mIGEgZGVmZXIgYmxvY2suICovXG5mdW5jdGlvbiBnZXRQcmltYXJ5QmxvY2tUTm9kZSh0VmlldzogVFZpZXcsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpOiBUQ29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgcmV0dXJuIGdldFROb2RlKHRWaWV3LCBhZGp1c3RlZEluZGV4KSBhcyBUQ29udGFpbmVyTm9kZTtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byB0cmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICogSWYgdGhlIGJsb2NrIGlzIGFscmVhZHkgaW4gYSBsb2FkaW5nLCBjb21wbGV0ZWQgb3IgYW4gZXJyb3Igc3RhdGUgLVxuICogbm8gYWRkaXRpb25hbCBhY3Rpb25zIGFyZSB0YWtlbi5cbiAqL1xuZnVuY3Rpb24gdHJpZ2dlckRlZmVyQmxvY2sobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIobENvbnRhaW5lcik7XG5cbiAgaWYgKCFzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIC8vIENvbmRpdGlvbiBpcyB0cmlnZ2VyZWQsIHRyeSB0byByZW5kZXIgbG9hZGluZyBzdGF0ZSBhbmQgc3RhcnQgZG93bmxvYWRpbmcuXG4gIC8vIE5vdGU6IGlmIGEgYmxvY2sgaXMgaW4gYSBsb2FkaW5nLCBjb21wbGV0ZWQgb3IgYW4gZXJyb3Igc3RhdGUsIHRoaXMgY2FsbCB3b3VsZCBiZSBhIG5vb3AuXG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShEZWZlckJsb2NrU3RhdGUuTG9hZGluZywgdE5vZGUsIGxDb250YWluZXIpO1xuXG4gIHN3aXRjaCAodERldGFpbHMubG9hZGluZ1N0YXRlKSB7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRDpcbiAgICAgIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIGxWaWV3KTtcblxuICAgICAgLy8gVGhlIGBsb2FkaW5nU3RhdGVgIG1pZ2h0IGhhdmUgY2hhbmdlZCB0byBcImxvYWRpbmdcIi5cbiAgICAgIGlmICgodERldGFpbHMubG9hZGluZ1N0YXRlIGFzIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlKSA9PT1cbiAgICAgICAgICBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5JTl9QUk9HUkVTUykge1xuICAgICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1M6XG4gICAgICByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHMsIHROb2RlLCBsQ29udGFpbmVyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU6XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHMpO1xuICAgICAgcmVuZGVyRGVmZXJCbG9ja1N0YXRlKERlZmVyQmxvY2tTdGF0ZS5Db21wbGV0ZSwgdE5vZGUsIGxDb250YWluZXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoRGVmZXJCbG9ja1N0YXRlLkVycm9yLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICB0aHJvd0Vycm9yKCdVbmtub3duIGRlZmVyIGJsb2NrIHN0YXRlJyk7XG4gICAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBc3NlcnRzIHdoZXRoZXIgYWxsIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jayBhcmUgbG9hZGVkLlxuICogQWx3YXlzIHJ1biB0aGlzIGZ1bmN0aW9uIChpbiBkZXYgbW9kZSkgYmVmb3JlIHJlbmRlcmluZyBhIGRlZmVyXG4gKiBibG9jayBpbiBjb21wbGV0ZWQgc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFLFxuICAgICAgJ0V4cGVjdGluZyBhbGwgZGVmZXJyZWQgZGVwZW5kZW5jaWVzIHRvIGJlIGxvYWRlZC4nKTtcbn1cblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKlxuICogRGVzY3JpYmVzIGEgaGVscGVyIGNsYXNzIHRoYXQgYWxsb3dzIHRvIGludGVyY2VwdCBhIGNhbGwgdG8gcmV0cmlldmUgY3VycmVudFxuICogZGVwZW5kZW5jeSBsb2FkaW5nIGZ1bmN0aW9uIGFuZCByZXBsYWNlIGl0IHdpdGggYSBkaWZmZXJlbnQgaW1wbGVtZW50YXRpb24uXG4gKiBUaGlzIGludGVyY2VwdG9yIGNsYXNzIGlzIG5lZWRlZCB0byBhbGxvdyB0ZXN0aW5nIGJsb2NrcyBpbiBkaWZmZXJlbnQgc3RhdGVzXG4gKiBieSBzaW11bGF0aW5nIGxvYWRpbmcgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvciB7XG4gIC8qKlxuICAgKiBJbnZva2VkIGZvciBlYWNoIGRlZmVyIGJsb2NrIHdoZW4gZGVwZW5kZW5jeSBsb2FkaW5nIGZ1bmN0aW9uIGlzIGFjY2Vzc2VkLlxuICAgKi9cbiAgaW50ZXJjZXB0KGRlcGVuZGVuY3lGbjogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCk6IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbG93cyB0byBjb25maWd1cmUgYW4gaW50ZXJjZXB0b3IgZnVuY3Rpb24uXG4gICAqL1xuICBzZXRJbnRlcmNlcHRvcihpbnRlcmNlcHRvckZuOiAoY3VycmVudDogRGVwZW5kZW5jeVJlc29sdmVyRm4pID0+IERlcGVuZGVuY3lSZXNvbHZlckZuKTogdm9pZDtcbn1cblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKlxuICogSW5qZWN0b3IgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcHJvdmlkZSBgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcmAgY2xhc3NcbiAqIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3I+KFxuICAgICAgICBuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUicgOiAnJyk7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGdpdmVuIHZhbHVlIG1hdGNoZXMgdGhlIGV4cGVjdGVkIHN0cnVjdHVyZSBvZiBhIGRlZmVyIGJsb2NrXG4gKlxuICogV2UgY2FuIHNhZmVseSByZWx5IG9uIHRoZSBwcmltYXJ5VG1wbEluZGV4IGJlY2F1c2UgZXZlcnkgZGVmZXIgYmxvY2sgcmVxdWlyZXNcbiAqIHRoYXQgYSBwcmltYXJ5IHRlbXBsYXRlIGV4aXN0cy4gQWxsIHRoZSBvdGhlciB0ZW1wbGF0ZSBvcHRpb25zIGFyZSBvcHRpb25hbC5cbiAqL1xuZnVuY3Rpb24gaXNURGVmZXJCbG9ja0RldGFpbHModmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBURGVmZXJCbG9ja0RldGFpbHMge1xuICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpICYmXG4gICAgICAodHlwZW9mICh2YWx1ZSBhcyBURGVmZXJCbG9ja0RldGFpbHMpLnByaW1hcnlUbXBsSW5kZXggPT09ICdudW1iZXInKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB1c2VkIGZvciBjb25maWd1cmluZyBkZWZlciBibG9jayBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkVSX0JMT0NLX0NPTkZJRyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPERlZmVyQmxvY2tDb25maWc+KG5nRGV2TW9kZSA/ICdERUZFUl9CTE9DS19DT05GSUcnIDogJycpO1xuXG4vKipcbiAqIERlZmVyIGJsb2NrIGluc3RhbmNlIGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgbENvbnRhaW5lcjogTENvbnRhaW5lcjtcbiAgbFZpZXc6IExWaWV3O1xuICB0Tm9kZTogVE5vZGU7XG4gIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFsbCBkZWZlciBibG9ja3MgaW4gYSBnaXZlbiBMVmlldy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgbFZpZXcgd2l0aCBkZWZlciBibG9ja3NcbiAqIEBwYXJhbSBkZWZlckJsb2NrcyBkZWZlciBibG9jayBhZ2dyZWdhdG9yIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZlckJsb2NrcyhsVmlldzogTFZpZXcsIGRlZmVyQmxvY2tzOiBEZWZlckJsb2NrRGV0YWlsc1tdKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gSEVBREVSX09GRlNFVDsgaSA8IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4OyBpKyspIHtcbiAgICBpZiAoaXNMQ29udGFpbmVyKGxWaWV3W2ldKSkge1xuICAgICAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2ldO1xuICAgICAgLy8gQW4gTENvbnRhaW5lciBtYXkgcmVwcmVzZW50IGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2ssIGluIHdoaWNoIGNhc2VcbiAgICAgIC8vIHdlIHN0b3JlIGl0IGFzIGEgcmVzdWx0LiBPdGhlcndpc2UsIGtlZXAgaXRlcmF0aW5nIG92ZXIgTENvbnRhaW5lciB2aWV3cyBhbmRcbiAgICAgIC8vIGxvb2sgZm9yIGRlZmVyIGJsb2Nrcy5cbiAgICAgIGNvbnN0IGlzTGFzdCA9IGkgPT09IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gMTtcbiAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICAgICAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcbiAgICAgICAgaWYgKGlzVERlZmVyQmxvY2tEZXRhaWxzKHREZXRhaWxzKSkge1xuICAgICAgICAgIGRlZmVyQmxvY2tzLnB1c2goe2xDb250YWluZXIsIGxWaWV3LCB0Tm9kZSwgdERldGFpbHN9KTtcbiAgICAgICAgICAvLyBUaGlzIExDb250YWluZXIgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLCBzbyB3ZSBleGl0XG4gICAgICAgICAgLy8gdGhpcyBpdGVyYXRpb24gYW5kIGRvbid0IGluc3BlY3Qgdmlld3MgaW4gdGhpcyBMQ29udGFpbmVyLlxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGdldERlZmVyQmxvY2tzKGxDb250YWluZXJbaV0gYXMgTFZpZXcsIGRlZmVyQmxvY2tzKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzTFZpZXcobFZpZXdbaV0pKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBlbnRlciB0aGUgYGdldERlZmVyQmxvY2tzYCByZWN1cnNpdmVseS5cbiAgICAgIGdldERlZmVyQmxvY2tzKGxWaWV3W2ldLCBkZWZlckJsb2Nrcyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgY2xlYW51cCBmdW5jdGlvbiBhc3NvY2lhdGVkIHdpdGggYSBwcmVmZXRjaGluZyB0cmlnZ2VyXG4gKiBvZiBhIGdpdmVuIGRlZmVyIGJsb2NrLlxuICovXG5mdW5jdGlvbiByZWdpc3RlclREZXRhaWxzQ2xlYW51cChcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMsIGtleTogc3RyaW5nLCBjbGVhbnVwRm46IFZvaWRGdW5jdGlvbikge1xuICBpbmplY3Rvci5nZXQoRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyKS5hZGQodERldGFpbHMsIGtleSwgY2xlYW51cEZuKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGFsbCByZWdpc3RlcmVkIHByZWZldGNoIGNsZWFudXAgdHJpZ2dlcnNcbiAqIGFuZCByZW1vdmVzIGFsbCBjbGVhbnVwIGZ1bmN0aW9ucyBhZnRlcndhcmRzLlxuICovXG5mdW5jdGlvbiBpbnZva2VURGV0YWlsc0NsZWFudXAoaW5qZWN0b3I6IEluamVjdG9yLCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGluamVjdG9yLmdldChEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIpLmNsZWFudXAodERldGFpbHMpO1xufVxuXG4vKipcbiAqIEludGVybmFsIHNlcnZpY2UgdG8ga2VlcCB0cmFjayBvZiBjbGVhbnVwIGZ1bmN0aW9ucyBhc3NvY2lhdGVkXG4gKiB3aXRoIGRlZmVyIGJsb2Nrcy4gVGhpcyBjbGFzcyBpcyB1c2VkIHRvIG1hbmFnZSBjbGVhbnVwIGZ1bmN0aW9uc1xuICogY3JlYXRlZCBmb3IgcHJlZmV0Y2hpbmcgdHJpZ2dlcnMuXG4gKi9cbmNsYXNzIERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlciB7XG4gIHByaXZhdGUgYmxvY2tzID0gbmV3IE1hcDxURGVmZXJCbG9ja0RldGFpbHMsIE1hcDxzdHJpbmcsIFZvaWRGdW5jdGlvbltdPj4oKTtcblxuICBhZGQodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBpZiAoIXRoaXMuYmxvY2tzLmhhcyh0RGV0YWlscykpIHtcbiAgICAgIHRoaXMuYmxvY2tzLnNldCh0RGV0YWlscywgbmV3IE1hcCgpKTtcbiAgICB9XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpITtcbiAgICBpZiAoIWJsb2NrLmhhcyhrZXkpKSB7XG4gICAgICBibG9jay5zZXQoa2V5LCBbXSk7XG4gICAgfVxuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGJsb2NrLmdldChrZXkpITtcbiAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICBoYXModERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywga2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLmJsb2Nrcy5nZXQodERldGFpbHMpPy5oYXMoa2V5KTtcbiAgfVxuXG4gIGNsZWFudXAodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscykge1xuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5ibG9ja3MuZ2V0KHREZXRhaWxzKTtcbiAgICBpZiAoYmxvY2spIHtcbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2tzIG9mIE9iamVjdC52YWx1ZXMoYmxvY2spKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgY2FsbGJhY2tzKSB7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5ibG9ja3MuZGVsZXRlKHREZXRhaWxzKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBmb3IgKGNvbnN0IFtibG9ja10gb2YgdGhpcy5ibG9ja3MpIHtcbiAgICAgIHRoaXMuY2xlYW51cChibG9jayk7XG4gICAgfVxuICAgIHRoaXMuYmxvY2tzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXIoKSxcbiAgfSk7XG59XG4iXX0=