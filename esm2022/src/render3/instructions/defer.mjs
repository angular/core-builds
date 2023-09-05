/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../../di';
import { findMatchingDehydratedView } from '../../hydration/views';
import { populateDehydratedViewsInContainer } from '../../linker/view_container_ref';
import { assertDefined, assertEqual, throwError } from '../../util/assert';
import { assertIndexInDeclRange, assertLContainer, assertTNodeForLView } from '../assert';
import { bindingUpdated } from '../bindings';
import { getComponentDef, getDirectiveDef, getPipeDef } from '../definition';
import { DEFER_BLOCK_STATE } from '../interfaces/defer';
import { isDestroyed } from '../interfaces/type_checks';
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
            loadingState: 0 /* DeferDependenciesLoadingState.NOT_STARTED */,
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
    lDetails[DEFER_BLOCK_STATE] = 0 /* DeferBlockInstanceState.INITIAL */;
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
        if (value === false && renderedState === 0 /* DeferBlockInstanceState.INITIAL */) {
            // If nothing is rendered yet, render a placeholder (if defined).
            renderPlaceholder(lView, tNode);
        }
        else if (value === true &&
            (renderedState === 0 /* DeferBlockInstanceState.INITIAL */ ||
                renderedState === 1 /* DeferBlockInstanceState.PLACEHOLDER */)) {
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
        if (value === true && tDetails.loadingState === 0 /* DeferDependenciesLoadingState.NOT_STARTED */) {
            // If loading has not been started yet, trigger it now.
            triggerResourceLoading(tDetails, tView, lView);
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
    if (tDetails.loadingState === 0 /* DeferDependenciesLoadingState.NOT_STARTED */) {
        // Set loading to the scheduled state, so that we don't register it again.
        tDetails.loadingState = 1 /* DeferDependenciesLoadingState.SCHEDULED */;
        // In case of prefetching, we intentionally avoid cancelling prefetching if
        // an underlying LView get destroyed (thus passing `null` as a second argument),
        // because there might be other LViews (that represent embedded views) that
        // depend on resource loading.
        onIdle(() => triggerResourceLoading(tDetails, tView, lView), null /* LView */);
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
/**
 * Transitions a defer block to the new state. Updates the  necessary
 * data structures and renders corresponding block.
 *
 * @param newState New state that should be applied to the defer block.
 * @param tNode TNode that represents a defer block.
 * @param lContainer Represents an instance of a defer block.
 * @param stateTmplIndex Index of a template that should be rendered.
 */
function renderDeferBlockState(newState, tNode, lContainer, stateTmplIndex) {
    const hostLView = lContainer[PARENT];
    // Check if this view is not destroyed. Since the loading process was async,
    // the view might end up being destroyed by the time rendering happens.
    if (isDestroyed(hostLView))
        return;
    // Make sure this TNode belongs to TView that represents host LView.
    ngDevMode && assertTNodeForLView(tNode, hostLView);
    const lDetails = getLDeferBlockDetails(hostLView, tNode);
    ngDevMode && assertDefined(lDetails, 'Expected a defer block state defined');
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
 * Trigger loading of defer block dependencies if the process hasn't started yet.
 *
 * @param tDetails Static information about this defer block.
 * @param tView TView of a host view.
 * @param lView LView of a host view.
 */
function triggerResourceLoading(tDetails, tView, lView) {
    const injector = lView[INJECTOR];
    if (!shouldTriggerDeferBlock(injector) ||
        (tDetails.loadingState !== 0 /* DeferDependenciesLoadingState.NOT_STARTED */ &&
            tDetails.loadingState !== 1 /* DeferDependenciesLoadingState.SCHEDULED */)) {
        // If the loading status is different from initial one, it means that
        // the loading of dependencies is in progress and there is nothing to do
        // in this function. All details can be obtained from the `tDetails` object.
        return;
    }
    const primaryBlockTNode = getPrimaryBlockTNode(tView, tDetails);
    // Switch from NOT_STARTED -> IN_PROGRESS state.
    tDetails.loadingState = 2 /* DeferDependenciesLoadingState.IN_PROGRESS */;
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
            tDetails.loadingState = 3 /* DeferDependenciesLoadingState.COMPLETE */;
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
            tDetails.loadingState = 4 /* DeferDependenciesLoadingState.FAILED */;
        }
        else {
            tDetails.loadingState = 3 /* DeferDependenciesLoadingState.COMPLETE */;
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
    renderDeferBlockState(1 /* DeferBlockInstanceState.PLACEHOLDER */, tNode, lContainer, tDetails.placeholderTmplIndex);
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
        if (tDetails.loadingState === 3 /* DeferDependenciesLoadingState.COMPLETE */) {
            ngDevMode && assertDeferredDependenciesLoaded(tDetails);
            // Everything is loaded, show the primary block content
            renderDeferBlockState(3 /* DeferBlockInstanceState.COMPLETE */, tNode, lContainer, tDetails.primaryTmplIndex);
        }
        else if (tDetails.loadingState === 4 /* DeferDependenciesLoadingState.FAILED */) {
            renderDeferBlockState(4 /* DeferBlockInstanceState.ERROR */, tNode, lContainer, tDetails.errorTmplIndex);
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
    renderDeferBlockState(2 /* DeferBlockInstanceState.LOADING */, tNode, lContainer, tDetails.loadingTmplIndex);
    switch (tDetails.loadingState) {
        case 0 /* DeferDependenciesLoadingState.NOT_STARTED */:
        case 1 /* DeferDependenciesLoadingState.SCHEDULED */:
            triggerResourceLoading(tDetails, lView[TVIEW], lView);
            // The `loadingState` might have changed to "loading".
            if (tDetails.loadingState ===
                2 /* DeferDependenciesLoadingState.IN_PROGRESS */) {
                renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
            }
            break;
        case 2 /* DeferDependenciesLoadingState.IN_PROGRESS */:
            renderDeferStateAfterResourceLoading(tDetails, tNode, lContainer);
            break;
        case 3 /* DeferDependenciesLoadingState.COMPLETE */:
            ngDevMode && assertDeferredDependenciesLoaded(tDetails);
            renderDeferBlockState(3 /* DeferBlockInstanceState.COMPLETE */, tNode, lContainer, tDetails.primaryTmplIndex);
            break;
        case 4 /* DeferDependenciesLoadingState.FAILED */:
            renderDeferBlockState(4 /* DeferBlockInstanceState.ERROR */, tNode, lContainer, tDetails.errorTmplIndex);
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
    assertEqual(tDetails.loadingState, 3 /* DeferDependenciesLoadingState.COMPLETE */, 'Expecting all deferred dependencies to be loaded.');
}
/**
 * **INTERNAL**, avoid referencing it in application code.
 *
 * Injector token that allows to provide `DeferBlockDependencyInterceptor` class
 * implementation.
 */
export const DEFER_BLOCK_DEPENDENCY_INTERCEPTOR = new InjectionToken(ngDevMode ? 'DEFER_BLOCK_DEPENDENCY_INTERCEPTOR' : '');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9kZWZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFXLE1BQU0sVUFBVSxDQUFDO0FBQ2xELE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxrQ0FBa0MsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN4RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUzRSxPQUFPLEVBQUMsaUJBQWlCLEVBQW1MLE1BQU0scUJBQXFCLENBQUM7QUFHeE8sT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUUsUUFBUSxFQUFTLE1BQU0sRUFBRSxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RixPQUFPLEVBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDakcsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDckQsT0FBTyxFQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxvQkFBb0IsQ0FB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RDs7OztHQUlHO0FBQ0gsU0FBUyxnQ0FBZ0MsQ0FBQyxRQUE0QjtJQUNwRSxXQUFXLENBQ1AsUUFBUSxDQUFDLFlBQVksa0RBQ3JCLG1EQUFtRCxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQXNCRDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxNQUFNLGtDQUFrQyxHQUMzQyxJQUFJLGNBQWMsQ0FDZCxTQUFTLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGlvblRva2VuLCBJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtmaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3ZpZXdzJztcbmltcG9ydCB7cG9wdWxhdGVEZWh5ZHJhdGVkVmlld3NJbkNvbnRhaW5lcn0gZnJvbSAnLi4vLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCB0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEluZGV4SW5EZWNsUmFuZ2UsIGFzc2VydExDb250YWluZXIsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtERUZFUl9CTE9DS19TVEFURSwgRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLCBEZWZlcnJlZExvYWRpbmdCbG9ja0NvbmZpZywgRGVmZXJyZWRQbGFjZWhvbGRlckJsb2NrQ29uZmlnLCBEZXBlbmRlbmN5UmVzb2x2ZXJGbiwgTERlZmVyQmxvY2tEZXRhaWxzLCBURGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZMaXN0LCBQaXBlRGVmTGlzdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0Rlc3Ryb3llZH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIElOSkVDVE9SLCBMVmlldywgUEFSRU5ULCBUVklFVywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRUTm9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkVE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0VE5vZGUsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95fSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthZGRMVmlld1RvTENvbnRhaW5lciwgY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldywgcmVtb3ZlTFZpZXdGcm9tTENvbnRhaW5lciwgc2hvdWxkQWRkVmlld1RvRG9tfSBmcm9tICcuLi92aWV3X21hbmlwdWxhdGlvbic7XG5cbmltcG9ydCB7ybXJtXRlbXBsYXRlfSBmcm9tICcuL3RlbXBsYXRlJztcblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgZGVmZXIgYmxvY2tzIHNob3VsZCBiZSB0cmlnZ2VyZWQuXG4gKlxuICogQ3VycmVudGx5LCBkZWZlciBibG9ja3MgYXJlIG5vdCB0cmlnZ2VyZWQgb24gdGhlIHNlcnZlcixcbiAqIG9ubHkgcGxhY2Vob2xkZXIgY29udGVudCBpcyByZW5kZXJlZCAoaWYgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBzaG91bGRUcmlnZ2VyRGVmZXJCbG9jayhpbmplY3RvcjogSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKTtcbn1cblxuLyoqXG4gKiBTaGltcyBmb3IgdGhlIGByZXF1ZXN0SWRsZUNhbGxiYWNrYCBhbmQgYGNhbmNlbElkbGVDYWxsYmFja2AgZnVuY3Rpb25zIGZvciBlbnZpcm9ubWVudHNcbiAqIHdoZXJlIHRob3NlIGZ1bmN0aW9ucyBhcmUgbm90IGF2YWlsYWJsZSAoZS5nLiBOb2RlLmpzKS5cbiAqL1xuY29uc3QgX3JlcXVlc3RJZGxlQ2FsbGJhY2sgPVxuICAgIHR5cGVvZiByZXF1ZXN0SWRsZUNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyA/IHJlcXVlc3RJZGxlQ2FsbGJhY2sgOiBzZXRUaW1lb3V0O1xuY29uc3QgX2NhbmNlbElkbGVDYWxsYmFjayA9XG4gICAgdHlwZW9mIHJlcXVlc3RJZGxlQ2FsbGJhY2sgIT09ICd1bmRlZmluZWQnID8gY2FuY2VsSWRsZUNhbGxiYWNrIDogY2xlYXJUaW1lb3V0O1xuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIGB7I2RlZmVyfWAgYmxvY2tzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgYGRlZmVyYCBpbnN0cnVjdGlvbi5cbiAqIEBwYXJhbSBwcmltYXJ5VG1wbEluZGV4IEluZGV4IG9mIHRoZSB0ZW1wbGF0ZSB3aXRoIHRoZSBwcmltYXJ5IGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gZGVwZW5kZW5jeVJlc29sdmVyRm4gRnVuY3Rpb24gdGhhdCBjb250YWlucyBkZXBlbmRlbmNpZXMgZm9yIHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gbG9hZGluZ1RtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgYHs6bG9hZGluZ31gIGJsb2NrIGNvbnRlbnQuXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJUbXBsSW5kZXggSW5kZXggb2YgdGhlIHRlbXBsYXRlIHdpdGggdGhlIGB7OnBsYWNlaG9sZGVyfWAgYmxvY2sgY29udGVudC5cbiAqIEBwYXJhbSBlcnJvclRtcGxJbmRleCBJbmRleCBvZiB0aGUgdGVtcGxhdGUgd2l0aCB0aGUgYHs6ZXJyb3J9YCBibG9jayBjb250ZW50LlxuICogQHBhcmFtIGxvYWRpbmdDb25maWdJbmRleCBJbmRleCBpbiB0aGUgY29uc3RhbnRzIGFycmF5IG9mIHRoZSBjb25maWd1cmF0aW9uIG9mIHRoZSBgezpsb2FkaW5nfWAuXG4gKiAgICAgYmxvY2suXG4gKiBAcGFyYW0gcGxhY2Vob2xkZXJDb25maWdJbmRleEluZGV4IGluIHRoZSBjb25zdGFudHMgYXJyYXkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb2YgdGhlXG4gKiAgICAgYHs6cGxhY2Vob2xkZXJ9YCBibG9jay5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyKFxuICAgIGluZGV4OiBudW1iZXIsIHByaW1hcnlUbXBsSW5kZXg6IG51bWJlciwgZGVwZW5kZW5jeVJlc29sdmVyRm4/OiBEZXBlbmRlbmN5UmVzb2x2ZXJGbnxudWxsLFxuICAgIGxvYWRpbmdUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCwgcGxhY2Vob2xkZXJUbXBsSW5kZXg/OiBudW1iZXJ8bnVsbCxcbiAgICBlcnJvclRtcGxJbmRleD86IG51bWJlcnxudWxsLCBsb2FkaW5nQ29uZmlnSW5kZXg/OiBudW1iZXJ8bnVsbCxcbiAgICBwbGFjZWhvbGRlckNvbmZpZ0luZGV4PzogbnVtYmVyfG51bGwpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHRWaWV3Q29uc3RzID0gdFZpZXcuY29uc3RzO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gIMm1ybV0ZW1wbGF0ZShpbmRleCwgbnVsbCwgMCwgMCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGNvbnN0IGRlZmVyQmxvY2tDb25maWc6IFREZWZlckJsb2NrRGV0YWlscyA9IHtcbiAgICAgIHByaW1hcnlUbXBsSW5kZXgsXG4gICAgICBsb2FkaW5nVG1wbEluZGV4OiBsb2FkaW5nVG1wbEluZGV4ID8/IG51bGwsXG4gICAgICBwbGFjZWhvbGRlclRtcGxJbmRleDogcGxhY2Vob2xkZXJUbXBsSW5kZXggPz8gbnVsbCxcbiAgICAgIGVycm9yVG1wbEluZGV4OiBlcnJvclRtcGxJbmRleCA/PyBudWxsLFxuICAgICAgcGxhY2Vob2xkZXJCbG9ja0NvbmZpZzogcGxhY2Vob2xkZXJDb25maWdJbmRleCAhPSBudWxsID9cbiAgICAgICAgICBnZXRDb25zdGFudDxEZWZlcnJlZFBsYWNlaG9sZGVyQmxvY2tDb25maWc+KHRWaWV3Q29uc3RzLCBwbGFjZWhvbGRlckNvbmZpZ0luZGV4KSA6XG4gICAgICAgICAgbnVsbCxcbiAgICAgIGxvYWRpbmdCbG9ja0NvbmZpZzogbG9hZGluZ0NvbmZpZ0luZGV4ICE9IG51bGwgP1xuICAgICAgICAgIGdldENvbnN0YW50PERlZmVycmVkTG9hZGluZ0Jsb2NrQ29uZmlnPih0Vmlld0NvbnN0cywgbG9hZGluZ0NvbmZpZ0luZGV4KSA6XG4gICAgICAgICAgbnVsbCxcbiAgICAgIGRlcGVuZGVuY3lSZXNvbHZlckZuOiBkZXBlbmRlbmN5UmVzb2x2ZXJGbiA/PyBudWxsLFxuICAgICAgbG9hZGluZ1N0YXRlOiBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCxcbiAgICAgIGxvYWRpbmdQcm9taXNlOiBudWxsLFxuICAgIH07XG5cbiAgICBzZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIGFkanVzdGVkSW5kZXgsIGRlZmVyQmxvY2tDb25maWcpO1xuICB9XG5cbiAgLy8gTG9va3VwIGRlaHlkcmF0ZWQgdmlld3MgdGhhdCBiZWxvbmcgdG8gdGhpcyBMQ29udGFpbmVyLlxuICAvLyBJbiBjbGllbnQtb25seSBtb2RlLCB0aGlzIG9wZXJhdGlvbiBpcyBub29wLlxuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF07XG4gIHBvcHVsYXRlRGVoeWRyYXRlZFZpZXdzSW5Db250YWluZXIobENvbnRhaW5lcik7XG5cbiAgLy8gSW5pdCBpbnN0YW5jZS1zcGVjaWZpYyBkZWZlciBkZXRhaWxzIGFuZCBzdG9yZSBpdC5cbiAgY29uc3QgbERldGFpbHMgPSBbXTtcbiAgbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdID0gRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUuSU5JVElBTDtcbiAgc2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3LCBhZGp1c3RlZEluZGV4LCBsRGV0YWlscyBhcyBMRGVmZXJCbG9ja0RldGFpbHMpO1xufVxuXG4vKipcbiAqIExvYWRzIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcyB3aGVuIGEgdHJpZ2dlciB2YWx1ZSBiZWNvbWVzIHRydXRoeS5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSAmJiByZW5kZXJlZFN0YXRlID09PSBEZWZlckJsb2NrSW5zdGFuY2VTdGF0ZS5JTklUSUFMKSB7XG4gICAgICAvLyBJZiBub3RoaW5nIGlzIHJlbmRlcmVkIHlldCwgcmVuZGVyIGEgcGxhY2Vob2xkZXIgKGlmIGRlZmluZWQpLlxuICAgICAgcmVuZGVyUGxhY2Vob2xkZXIobFZpZXcsIHROb2RlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICB2YWx1ZSA9PT0gdHJ1ZSAmJlxuICAgICAgICAocmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUuSU5JVElBTCB8fFxuICAgICAgICAgcmVuZGVyZWRTdGF0ZSA9PT0gRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUuUExBQ0VIT0xERVIpKSB7XG4gICAgICAvLyBUaGUgYHdoZW5gIGNvbmRpdGlvbiBoYXMgY2hhbmdlZCB0byBgdHJ1ZWAsIHRyaWdnZXIgZGVmZXIgYmxvY2sgbG9hZGluZ1xuICAgICAgLy8gaWYgdGhlIGJsb2NrIGlzIGVpdGhlciBpbiBpbml0aWFsIChub3RoaW5nIGlzIHJlbmRlcmVkKSBvciBhIHBsYWNlaG9sZGVyXG4gICAgICAvLyBzdGF0ZS5cbiAgICAgIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJlZmV0Y2hlcyB0aGUgZGVmZXJyZWQgY29udGVudCB3aGVuIGEgdmFsdWUgYmVjb21lcyB0cnV0aHkuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hXaGVuKHJhd1ZhbHVlOiB1bmtub3duKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuXG4gIGlmIChiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCByYXdWYWx1ZSkpIHtcbiAgICBjb25zdCB2YWx1ZSA9IEJvb2xlYW4ocmF3VmFsdWUpOyAgLy8gaGFuZGxlIHRydXRoeSBvciBmYWxzeSB2YWx1ZXNcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFNlbGVjdGVkVE5vZGUoKTtcbiAgICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSAmJiB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgICAvLyBJZiBsb2FkaW5nIGhhcyBub3QgYmVlbiBzdGFydGVkIHlldCwgdHJpZ2dlciBpdCBub3cuXG4gICAgICB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0VmlldywgbFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgdXAgaGFuZGxlcnMgdGhhdCByZXByZXNlbnQgYG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25JZGxlKCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuXG4gIHJlbmRlclBsYWNlaG9sZGVyKGxWaWV3LCB0Tm9kZSk7XG5cbiAgLy8gTm90ZTogd2UgcGFzcyBhbiBgbFZpZXdgIGFzIGEgc2Vjb25kIGFyZ3VtZW50IHRvIGNhbmNlbCBhbiBgaWRsZWBcbiAgLy8gY2FsbGJhY2sgaW4gY2FzZSBhbiBMVmlldyBnb3QgZGVzdHJveWVkIGJlZm9yZSBhbiBgaWRsZWAgY2FsbGJhY2tcbiAgLy8gaXMgaW52b2tlZC5cbiAgb25JZGxlKCgpID0+IHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3LCB0Tm9kZSksIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGlkbGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbklkbGUoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0RGV0YWlscyA9IGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldywgdE5vZGUpO1xuXG4gIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEKSB7XG4gICAgLy8gU2V0IGxvYWRpbmcgdG8gdGhlIHNjaGVkdWxlZCBzdGF0ZSwgc28gdGhhdCB3ZSBkb24ndCByZWdpc3RlciBpdCBhZ2Fpbi5cbiAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5TQ0hFRFVMRUQ7XG5cbiAgICAvLyBJbiBjYXNlIG9mIHByZWZldGNoaW5nLCB3ZSBpbnRlbnRpb25hbGx5IGF2b2lkIGNhbmNlbGxpbmcgcHJlZmV0Y2hpbmcgaWZcbiAgICAvLyBhbiB1bmRlcmx5aW5nIExWaWV3IGdldCBkZXN0cm95ZWQgKHRodXMgcGFzc2luZyBgbnVsbGAgYXMgYSBzZWNvbmQgYXJndW1lbnQpLFxuICAgIC8vIGJlY2F1c2UgdGhlcmUgbWlnaHQgYmUgb3RoZXIgTFZpZXdzICh0aGF0IHJlcHJlc2VudCBlbWJlZGRlZCB2aWV3cykgdGhhdFxuICAgIC8vIGRlcGVuZCBvbiByZXNvdXJjZSBsb2FkaW5nLlxuICAgIG9uSWRsZSgoKSA9PiB0cmlnZ2VyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0VmlldywgbFZpZXcpLCBudWxsIC8qIExWaWV3ICovKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaW1tZWRpYXRlYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW1tZWRpYXRlKCkge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiBpbW1lZGlhdGVgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkltbWVkaWF0ZSgpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHRpbWVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGRlbGF5IEFtb3VudCBvZiB0aW1lIHRvIHdhaXQgYmVmb3JlIGxvYWRpbmcgdGhlIGNvbnRlbnQuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25UaW1lcihkZWxheTogbnVtYmVyKSB7fSAgLy8gVE9ETzogaW1wbGVtZW50IHJ1bnRpbWUgbG9naWMuXG5cbi8qKlxuICogQ3JlYXRlcyBydW50aW1lIGRhdGEgc3RydWN0dXJlcyBmb3IgdGhlIGBwcmVmZXRjaCBvbiB0aW1lcmAgZGVmZXJyZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBkZWxheSBBbW91bnQgb2YgdGltZSB0byB3YWl0IGJlZm9yZSBwcmVmZXRjaGluZyB0aGUgY29udGVudC5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZGVmZXJQcmVmZXRjaE9uVGltZXIoZGVsYXk6IG51bWJlcikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgb24gaG92ZXJgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyT25Ib3ZlcigpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYHByZWZldGNoIG9uIGhvdmVyYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlclByZWZldGNoT25Ib3ZlcigpIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIGludGVyYWN0aW9uYCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRhcmdldCBPcHRpb25hbCBlbGVtZW50IG9uIHdoaWNoIHRvIGxpc3RlbiBmb3IgaG92ZXIgZXZlbnRzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uSW50ZXJhY3Rpb24odGFyZ2V0PzogdW5rbm93bikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gaW50ZXJhY3Rpb25gIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdGFyZ2V0IE9wdGlvbmFsIGVsZW1lbnQgb24gd2hpY2ggdG8gbGlzdGVuIGZvciBob3ZlciBldmVudHMuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPbkludGVyYWN0aW9uKHRhcmdldD86IHVua25vd24pIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqXG4gKiBDcmVhdGVzIHJ1bnRpbWUgZGF0YSBzdHJ1Y3R1cmVzIGZvciB0aGUgYG9uIHZpZXdwb3J0YCBkZWZlcnJlZCB0cmlnZ2VyLlxuICogQHBhcmFtIHRhcmdldCBPcHRpb25hbCBlbGVtZW50IG9uIHdoaWNoIHRvIGxpc3RlbiBmb3IgaG92ZXIgZXZlbnRzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVkZWZlck9uVmlld3BvcnQodGFyZ2V0PzogdW5rbm93bikge30gIC8vIFRPRE86IGltcGxlbWVudCBydW50aW1lIGxvZ2ljLlxuXG4vKipcbiAqIENyZWF0ZXMgcnVudGltZSBkYXRhIHN0cnVjdHVyZXMgZm9yIHRoZSBgcHJlZmV0Y2ggb24gdmlld3BvcnRgIGRlZmVycmVkIHRyaWdnZXIuXG4gKiBAcGFyYW0gdGFyZ2V0IE9wdGlvbmFsIGVsZW1lbnQgb24gd2hpY2ggdG8gbGlzdGVuIGZvciBob3ZlciBldmVudHMuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWRlZmVyUHJlZmV0Y2hPblZpZXdwb3J0KHRhcmdldD86IHVua25vd24pIHt9ICAvLyBUT0RPOiBpbXBsZW1lbnQgcnVudGltZSBsb2dpYy5cblxuLyoqKioqKioqKiogSGVscGVyIGZ1bmN0aW9ucyAqKioqKioqKioqL1xuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBzY2hlZHVsZSBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbiBhIGJyb3dzZXIgYmVjb21lcyBpZGxlLlxuICogQHBhcmFtIGxWaWV3IEFuIG9wdGlvbmFsIExWaWV3IHRoYXQgaG9zdHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay4gTFZpZXcgaXNcbiAqICAgIHVzZWQgdG8gcmVnaXN0ZXIgYSBjbGVhbnVwIGNhbGxiYWNrIGluIGNhc2UgdGhhdCBMVmlldyBnb3QgZGVzdHJveWVkIGJlZm9yZVxuICogICAgY2FsbGJhY2sgd2FzIGludm9rZWQuIEluIHRoaXMgY2FzZSwgYW4gYGlkbGVgIGNhbGxiYWNrIGlzIG5ldmVyIGludm9rZWQuIFRoaXMgaXNcbiAqICAgIGhlbHBmdWwgZm9yIGNhc2VzIHdoZW4gYSBkZWZlciBibG9jayBoYXMgc2NoZWR1bGVkIHJlbmRlcmluZywgYnV0IGFuIHVuZGVybHlpbmdcbiAqICAgIExWaWV3IGdvdCBkZXN0cm95ZWQgcHJpb3IgdG8gdGggYmxvY2sgcmVuZGVyaW5nLlxuICovXG5mdW5jdGlvbiBvbklkbGUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgbFZpZXc6IExWaWV3fG51bGwpIHtcbiAgbGV0IGlkOiBudW1iZXI7XG4gIGNvbnN0IHJlbW92ZUlkbGVDYWxsYmFjayA9ICgpID0+IF9jYW5jZWxJZGxlQ2FsbGJhY2soaWQpO1xuICBpZCA9IF9yZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgIHJlbW92ZUlkbGVDYWxsYmFjaygpO1xuICAgICAgICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgICAgIC8vIFRoZSBpZGxlIGNhbGxiYWNrIGlzIGludm9rZWQsIHdlIG5vIGxvbmdlciBuZWVkXG4gICAgICAgICAgIC8vIHRvIHJldGFpbiBhIGNsZWFudXAgY2FsbGJhY2sgaW4gYW4gTFZpZXcuXG4gICAgICAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGxWaWV3LCByZW1vdmVJZGxlQ2FsbGJhY2spO1xuICAgICAgICAgfVxuICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICB9KSBhcyBudW1iZXI7XG5cbiAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgLy8gU3RvcmUgYSBjbGVhbnVwIGZ1bmN0aW9uIG9uIExWaWV3LCBzbyB0aGF0IHdlIGNhbmNlbCBpZGxlXG4gICAgLy8gY2FsbGJhY2sgaW4gY2FzZSB0aGlzIExWaWV3IGlzIGRlc3Ryb3llZCBiZWZvcmUgYSBjYWxsYmFja1xuICAgIC8vIGlzIGludm9rZWQuXG4gICAgc3RvcmVMVmlld09uRGVzdHJveShsVmlldywgcmVtb3ZlSWRsZUNhbGxiYWNrKTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgYSBkYXRhIHNsb3QgaW5kZXggZm9yIGRlZmVyIGJsb2NrIGluZm8gKGVpdGhlciBzdGF0aWMgb3JcbiAqIGluc3RhbmNlLXNwZWNpZmljKSwgZ2l2ZW4gYW4gaW5kZXggb2YgYSBkZWZlciBpbnN0cnVjdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0RGVmZXJCbG9ja0RhdGFJbmRleChkZWZlckJsb2NrSW5kZXg6IG51bWJlcikge1xuICAvLyBJbnN0YW5jZSBzdGF0ZSBpcyBsb2NhdGVkIGF0IHRoZSAqbmV4dCogcG9zaXRpb25cbiAgLy8gYWZ0ZXIgdGhlIGRlZmVyIGJsb2NrIHNsb3QgaW4gYW4gTFZpZXcgb3IgVFZpZXcuZGF0YS5cbiAgcmV0dXJuIGRlZmVyQmxvY2tJbmRleCArIDE7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSBkZWZlciBibG9jayBzdGF0ZSBmcm9tIGFuIExWaWV3LCBnaXZlbiBhIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogTERlZmVyQmxvY2tEZXRhaWxzIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgodE5vZGUuaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgcmV0dXJuIGxWaWV3W3Nsb3RJbmRleF07XG59XG5cbi8qKiBTdG9yZXMgYSBkZWZlciBibG9jayBpbnN0YW5jZSBzdGF0ZSBpbiBMVmlldy4gKi9cbmZ1bmN0aW9uIHNldExEZWZlckJsb2NrRGV0YWlscyhcbiAgICBsVmlldzogTFZpZXcsIGRlZmVyQmxvY2tJbmRleDogbnVtYmVyLCBsRGV0YWlsczogTERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBzbG90SW5kZXggPSBnZXREZWZlckJsb2NrRGF0YUluZGV4KGRlZmVyQmxvY2tJbmRleCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluRGVjbFJhbmdlKHRWaWV3LCBzbG90SW5kZXgpO1xuICBsVmlld1tzbG90SW5kZXhdID0gbERldGFpbHM7XG59XG5cbi8qKiBSZXRyaWV2ZXMgc3RhdGljIGluZm8gYWJvdXQgYSBkZWZlciBibG9jaywgZ2l2ZW4gYSBUVmlldyBhbmQgYSBUTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBibG9jay4gKi9cbmZ1bmN0aW9uIGdldFREZWZlckJsb2NrRGV0YWlscyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IFREZWZlckJsb2NrRGV0YWlscyB7XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgodE5vZGUuaW5kZXgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkRlY2xSYW5nZSh0Vmlldywgc2xvdEluZGV4KTtcbiAgcmV0dXJuIHRWaWV3LmRhdGFbc2xvdEluZGV4XSBhcyBURGVmZXJCbG9ja0RldGFpbHM7XG59XG5cbi8qKiBTdG9yZXMgYSBkZWZlciBibG9jayBzdGF0aWMgaW5mbyBpbiBgVFZpZXcuZGF0YWAuICovXG5mdW5jdGlvbiBzZXRURGVmZXJCbG9ja0RldGFpbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBkZWZlckJsb2NrSW5kZXg6IG51bWJlciwgZGVmZXJCbG9ja0NvbmZpZzogVERlZmVyQmxvY2tEZXRhaWxzKSB7XG4gIGNvbnN0IHNsb3RJbmRleCA9IGdldERlZmVyQmxvY2tEYXRhSW5kZXgoZGVmZXJCbG9ja0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5EZWNsUmFuZ2UodFZpZXcsIHNsb3RJbmRleCk7XG4gIHRWaWV3LmRhdGFbc2xvdEluZGV4XSA9IGRlZmVyQmxvY2tDb25maWc7XG59XG5cbi8qKlxuICogVHJhbnNpdGlvbnMgYSBkZWZlciBibG9jayB0byB0aGUgbmV3IHN0YXRlLiBVcGRhdGVzIHRoZSAgbmVjZXNzYXJ5XG4gKiBkYXRhIHN0cnVjdHVyZXMgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBibG9jay5cbiAqXG4gKiBAcGFyYW0gbmV3U3RhdGUgTmV3IHN0YXRlIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhlIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHRoYXQgcmVwcmVzZW50cyBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIGxDb250YWluZXIgUmVwcmVzZW50cyBhbiBpbnN0YW5jZSBvZiBhIGRlZmVyIGJsb2NrLlxuICogQHBhcmFtIHN0YXRlVG1wbEluZGV4IEluZGV4IG9mIGEgdGVtcGxhdGUgdGhhdCBzaG91bGQgYmUgcmVuZGVyZWQuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShcbiAgICBuZXdTdGF0ZTogRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUsIHROb2RlOiBUTm9kZSwgbENvbnRhaW5lcjogTENvbnRhaW5lcixcbiAgICBzdGF0ZVRtcGxJbmRleDogbnVtYmVyfG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaG9zdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuXG4gIC8vIENoZWNrIGlmIHRoaXMgdmlldyBpcyBub3QgZGVzdHJveWVkLiBTaW5jZSB0aGUgbG9hZGluZyBwcm9jZXNzIHdhcyBhc3luYyxcbiAgLy8gdGhlIHZpZXcgbWlnaHQgZW5kIHVwIGJlaW5nIGRlc3Ryb3llZCBieSB0aGUgdGltZSByZW5kZXJpbmcgaGFwcGVucy5cbiAgaWYgKGlzRGVzdHJveWVkKGhvc3RMVmlldykpIHJldHVybjtcblxuICAvLyBNYWtlIHN1cmUgdGhpcyBUTm9kZSBiZWxvbmdzIHRvIFRWaWV3IHRoYXQgcmVwcmVzZW50cyBob3N0IExWaWV3LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Tm9kZSwgaG9zdExWaWV3KTtcblxuICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhob3N0TFZpZXcsIHROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsRGV0YWlscywgJ0V4cGVjdGVkIGEgZGVmZXIgYmxvY2sgc3RhdGUgZGVmaW5lZCcpO1xuXG4gIC8vIE5vdGU6IHdlIHRyYW5zaXRpb24gdG8gdGhlIG5leHQgc3RhdGUgaWYgdGhlIHByZXZpb3VzIHN0YXRlIHdhcyByZXByZXNlbnRlZFxuICAvLyB3aXRoIGEgbnVtYmVyIHRoYXQgaXMgbGVzcyB0aGFuIHRoZSBuZXh0IHN0YXRlLiBGb3IgZXhhbXBsZSwgaWYgdGhlIGN1cnJlbnRcbiAgLy8gc3RhdGUgaXMgXCJsb2FkaW5nXCIgKHJlcHJlc2VudGVkIGFzIGAyYCksIHdlIHNob3VsZCBub3Qgc2hvdyBhIHBsYWNlaG9sZGVyXG4gIC8vIChyZXByZXNlbnRlZCBhcyBgMWApLlxuICBpZiAobERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdIDwgbmV3U3RhdGUgJiYgc3RhdGVUbXBsSW5kZXggIT09IG51bGwpIHtcbiAgICBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV0gPSBuZXdTdGF0ZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0TFZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBzdGF0ZVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0VFZpZXcsIGFkanVzdGVkSW5kZXgpIGFzIFRDb250YWluZXJOb2RlO1xuXG4gICAgLy8gVGhlcmUgaXMgb25seSAxIHZpZXcgdGhhdCBjYW4gYmUgcHJlc2VudCBpbiBhbiBMQ29udGFpbmVyIHRoYXRcbiAgICAvLyByZXByZXNlbnRzIGEgYHsjZGVmZXJ9YCBibG9jaywgc28gYWx3YXlzIHJlZmVyIHRvIHRoZSBmaXJzdCBvbmUuXG4gICAgY29uc3Qgdmlld0luZGV4ID0gMDtcblxuICAgIHJlbW92ZUxWaWV3RnJvbUxDb250YWluZXIobENvbnRhaW5lciwgdmlld0luZGV4KTtcblxuICAgIGNvbnN0IGRlaHlkcmF0ZWRWaWV3ID0gZmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXcobENvbnRhaW5lciwgdE5vZGUudFZpZXchLnNzcklkKTtcbiAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gY3JlYXRlQW5kUmVuZGVyRW1iZWRkZWRMVmlldyhob3N0TFZpZXcsIHROb2RlLCBudWxsLCB7ZGVoeWRyYXRlZFZpZXd9KTtcbiAgICBhZGRMVmlld1RvTENvbnRhaW5lcihcbiAgICAgICAgbENvbnRhaW5lciwgZW1iZWRkZWRMVmlldywgdmlld0luZGV4LCBzaG91bGRBZGRWaWV3VG9Eb20odE5vZGUsIGRlaHlkcmF0ZWRWaWV3KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzIGlmIHRoZSBwcm9jZXNzIGhhc24ndCBzdGFydGVkIHlldC5cbiAqXG4gKiBAcGFyYW0gdERldGFpbHMgU3RhdGljIGluZm9ybWF0aW9uIGFib3V0IHRoaXMgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdFZpZXcgVFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKiBAcGFyYW0gbFZpZXcgTFZpZXcgb2YgYSBob3N0IHZpZXcuXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJSZXNvdXJjZUxvYWRpbmcodERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpIHx8XG4gICAgICAodERldGFpbHMubG9hZGluZ1N0YXRlICE9PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5OT1RfU1RBUlRFRCAmJlxuICAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSAhPT0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuU0NIRURVTEVEKSkge1xuICAgIC8vIElmIHRoZSBsb2FkaW5nIHN0YXR1cyBpcyBkaWZmZXJlbnQgZnJvbSBpbml0aWFsIG9uZSwgaXQgbWVhbnMgdGhhdFxuICAgIC8vIHRoZSBsb2FkaW5nIG9mIGRlcGVuZGVuY2llcyBpcyBpbiBwcm9ncmVzcyBhbmQgdGhlcmUgaXMgbm90aGluZyB0byBkb1xuICAgIC8vIGluIHRoaXMgZnVuY3Rpb24uIEFsbCBkZXRhaWxzIGNhbiBiZSBvYnRhaW5lZCBmcm9tIHRoZSBgdERldGFpbHNgIG9iamVjdC5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmltYXJ5QmxvY2tUTm9kZSA9IGdldFByaW1hcnlCbG9ja1ROb2RlKHRWaWV3LCB0RGV0YWlscyk7XG5cbiAgLy8gU3dpdGNoIGZyb20gTk9UX1NUQVJURUQgLT4gSU5fUFJPR1JFU1Mgc3RhdGUuXG4gIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTO1xuXG4gIC8vIENoZWNrIGlmIGRlcGVuZGVuY3kgZnVuY3Rpb24gaW50ZXJjZXB0b3IgaXMgY29uZmlndXJlZC5cbiAgY29uc3QgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgPVxuICAgICAgaW5qZWN0b3IuZ2V0KERFRkVSX0JMT0NLX0RFUEVOREVOQ1lfSU5URVJDRVBUT1IsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIGNvbnN0IGRlcGVuZGVuY2llc0ZuID0gZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IgP1xuICAgICAgZGVmZXJEZXBlbmRlbmN5SW50ZXJjZXB0b3IuaW50ZXJjZXB0KHREZXRhaWxzLmRlcGVuZGVuY3lSZXNvbHZlckZuKSA6XG4gICAgICB0RGV0YWlscy5kZXBlbmRlbmN5UmVzb2x2ZXJGbjtcblxuICAvLyBUaGUgYGRlcGVuZGVuY2llc0ZuYCBtaWdodCBiZSBgbnVsbGAgd2hlbiBhbGwgZGVwZW5kZW5jaWVzIHdpdGhpblxuICAvLyBhIGdpdmVuIGB7I2RlZmVyfWAgYmxvY2sgd2VyZSBlYWdlcmx5IHJlZmVyZW5jZXMgZWxzZXdoZXJlIGluIGEgZmlsZSxcbiAgLy8gdGh1cyBubyBkeW5hbWljIGBpbXBvcnQoKWBzIHdlcmUgcHJvZHVjZWQuXG4gIGlmICghZGVwZW5kZW5jaWVzRm4pIHtcbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdERldGFpbHMubG9hZGluZ1N0YXRlID0gRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuQ09NUExFVEU7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gU3RhcnQgZG93bmxvYWRpbmcgb2YgZGVmZXIgYmxvY2sgZGVwZW5kZW5jaWVzLlxuICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IFByb21pc2UuYWxsU2V0dGxlZChkZXBlbmRlbmNpZXNGbigpKS50aGVuKHJlc3VsdHMgPT4ge1xuICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWZMaXN0ID0gW107XG4gICAgY29uc3QgcGlwZURlZnM6IFBpcGVEZWZMaXN0ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBpZiAocmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcpIHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeSA9IHJlc3VsdC52YWx1ZTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZ2V0Q29tcG9uZW50RGVmKGRlcGVuZGVuY3kpIHx8IGdldERpcmVjdGl2ZURlZihkZXBlbmRlbmN5KTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZURlZikge1xuICAgICAgICAgIGRpcmVjdGl2ZURlZnMucHVzaChkaXJlY3RpdmVEZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHBpcGVEZWYgPSBnZXRQaXBlRGVmKGRlcGVuZGVuY3kpO1xuICAgICAgICAgIGlmIChwaXBlRGVmKSB7XG4gICAgICAgICAgICBwaXBlRGVmcy5wdXNoKHBpcGVEZWYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9hZGluZyBpcyBjb21wbGV0ZWQsIHdlIG5vIGxvbmdlciBuZWVkIHRoaXMgUHJvbWlzZS5cbiAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICBpZiAoZmFpbGVkKSB7XG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUgPSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREZXRhaWxzLmxvYWRpbmdTdGF0ZSA9IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFO1xuXG4gICAgICAvLyBVcGRhdGUgZGlyZWN0aXZlIGFuZCBwaXBlIHJlZ2lzdHJpZXMgdG8gYWRkIG5ld2x5IGRvd25sb2FkZWQgZGVwZW5kZW5jaWVzLlxuICAgICAgY29uc3QgcHJpbWFyeUJsb2NrVFZpZXcgPSBwcmltYXJ5QmxvY2tUTm9kZS50VmlldyE7XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcuZGlyZWN0aXZlUmVnaXN0cnkgP1xuICAgICAgICAgICAgWy4uLnByaW1hcnlCbG9ja1RWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCAuLi5kaXJlY3RpdmVEZWZzXSA6XG4gICAgICAgICAgICBkaXJlY3RpdmVEZWZzO1xuICAgICAgfVxuICAgICAgaWYgKHBpcGVEZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID0gcHJpbWFyeUJsb2NrVFZpZXcucGlwZVJlZ2lzdHJ5ID9cbiAgICAgICAgICAgIFsuLi5wcmltYXJ5QmxvY2tUVmlldy5waXBlUmVnaXN0cnksIC4uLnBpcGVEZWZzXSA6XG4gICAgICAgICAgICBwaXBlRGVmcztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vKiogVXRpbGl0eSBmdW5jdGlvbiB0byByZW5kZXIgYHs6cGxhY2Vob2xkZXJ9YCBjb250ZW50IChpZiBwcmVzZW50KSAqL1xuZnVuY3Rpb24gcmVuZGVyUGxhY2Vob2xkZXIobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGNvbnN0IHREZXRhaWxzID0gZ2V0VERlZmVyQmxvY2tEZXRhaWxzKHRWaWV3LCB0Tm9kZSk7XG4gIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShcbiAgICAgIERlZmVyQmxvY2tJbnN0YW5jZVN0YXRlLlBMQUNFSE9MREVSLCB0Tm9kZSwgbENvbnRhaW5lciwgdERldGFpbHMucGxhY2Vob2xkZXJUbXBsSW5kZXgpO1xufVxuXG4vKipcbiAqIFN1YnNjcmliZXMgdG8gdGhlIFwibG9hZGluZ1wiIFByb21pc2UgYW5kIHJlbmRlcnMgY29ycmVzcG9uZGluZyBkZWZlciBzdWItYmxvY2ssXG4gKiBiYXNlZCBvbiB0aGUgbG9hZGluZyByZXN1bHRzLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFJlcHJlc2VudHMgYW4gaW5zdGFuY2Ugb2YgYSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0Tm9kZSBSZXByZXNlbnRzIGRlZmVyIGJsb2NrIGluZm8gc2hhcmVkIGFjcm9zcyBhbGwgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiByZW5kZXJEZWZlclN0YXRlQWZ0ZXJSZXNvdXJjZUxvYWRpbmcoXG4gICAgdERldGFpbHM6IFREZWZlckJsb2NrRGV0YWlscywgdE5vZGU6IFROb2RlLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICB0RGV0YWlscy5sb2FkaW5nUHJvbWlzZSwgJ0V4cGVjdGVkIGxvYWRpbmcgUHJvbWlzZSB0byBleGlzdCBvbiB0aGlzIGRlZmVyIGJsb2NrJyk7XG5cbiAgdERldGFpbHMubG9hZGluZ1Byb21pc2UhLnRoZW4oKCkgPT4ge1xuICAgIGlmICh0RGV0YWlscy5sb2FkaW5nU3RhdGUgPT09IERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmZXJyZWREZXBlbmRlbmNpZXNMb2FkZWQodERldGFpbHMpO1xuXG4gICAgICAvLyBFdmVyeXRoaW5nIGlzIGxvYWRlZCwgc2hvdyB0aGUgcHJpbWFyeSBibG9jayBjb250ZW50XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgICAgICAgRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUuQ09NUExFVEUsIHROb2RlLCBsQ29udGFpbmVyLCB0RGV0YWlscy5wcmltYXJ5VG1wbEluZGV4KTtcblxuICAgIH0gZWxzZSBpZiAodERldGFpbHMubG9hZGluZ1N0YXRlID09PSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQpIHtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShcbiAgICAgICAgICBEZWZlckJsb2NrSW5zdGFuY2VTdGF0ZS5FUlJPUiwgdE5vZGUsIGxDb250YWluZXIsIHREZXRhaWxzLmVycm9yVG1wbEluZGV4KTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKiogUmV0cmlldmVzIGEgVE5vZGUgdGhhdCByZXByZXNlbnRzIG1haW4gY29udGVudCBvZiBhIGRlZmVyIGJsb2NrLiAqL1xuZnVuY3Rpb24gZ2V0UHJpbWFyeUJsb2NrVE5vZGUodFZpZXc6IFRWaWV3LCB0RGV0YWlsczogVERlZmVyQmxvY2tEZXRhaWxzKTogVENvbnRhaW5lck5vZGUge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gdERldGFpbHMucHJpbWFyeVRtcGxJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIHJldHVybiBnZXRUTm9kZSh0VmlldywgYWRqdXN0ZWRJbmRleCkgYXMgVENvbnRhaW5lck5vZGU7XG59XG5cbi8qKlxuICogQXR0ZW1wdHMgdG8gdHJpZ2dlciBsb2FkaW5nIG9mIGRlZmVyIGJsb2NrIGRlcGVuZGVuY2llcy5cbiAqIElmIHRoZSBibG9jayBpcyBhbHJlYWR5IGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlIC1cbiAqIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgdGFrZW4uXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEZWZlckJsb2NrKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGxDb250YWluZXIpO1xuXG4gIGlmICghc2hvdWxkVHJpZ2dlckRlZmVyQmxvY2soaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgdERldGFpbHMgPSBnZXRURGVmZXJCbG9ja0RldGFpbHModFZpZXcsIHROb2RlKTtcblxuICAvLyBDb25kaXRpb24gaXMgdHJpZ2dlcmVkLCB0cnkgdG8gcmVuZGVyIGxvYWRpbmcgc3RhdGUgYW5kIHN0YXJ0IGRvd25sb2FkaW5nLlxuICAvLyBOb3RlOiBpZiBhIGJsb2NrIGlzIGluIGEgbG9hZGluZywgY29tcGxldGVkIG9yIGFuIGVycm9yIHN0YXRlLCB0aGlzIGNhbGwgd291bGQgYmUgYSBub29wLlxuICByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgICBEZWZlckJsb2NrSW5zdGFuY2VTdGF0ZS5MT0FESU5HLCB0Tm9kZSwgbENvbnRhaW5lciwgdERldGFpbHMubG9hZGluZ1RtcGxJbmRleCk7XG5cbiAgc3dpdGNoICh0RGV0YWlscy5sb2FkaW5nU3RhdGUpIHtcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLk5PVF9TVEFSVEVEOlxuICAgIGNhc2UgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuU0NIRURVTEVEOlxuICAgICAgdHJpZ2dlclJlc291cmNlTG9hZGluZyh0RGV0YWlscywgbFZpZXdbVFZJRVddLCBsVmlldyk7XG5cbiAgICAgIC8vIFRoZSBgbG9hZGluZ1N0YXRlYCBtaWdodCBoYXZlIGNoYW5nZWQgdG8gXCJsb2FkaW5nXCIuXG4gICAgICBpZiAoKHREZXRhaWxzLmxvYWRpbmdTdGF0ZSBhcyBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZSkgPT09XG4gICAgICAgICAgRGVmZXJEZXBlbmRlbmNpZXNMb2FkaW5nU3RhdGUuSU5fUFJPR1JFU1MpIHtcbiAgICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLklOX1BST0dSRVNTOlxuICAgICAgcmVuZGVyRGVmZXJTdGF0ZUFmdGVyUmVzb3VyY2VMb2FkaW5nKHREZXRhaWxzLCB0Tm9kZSwgbENvbnRhaW5lcik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFOlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzKTtcbiAgICAgIHJlbmRlckRlZmVyQmxvY2tTdGF0ZShcbiAgICAgICAgICBEZWZlckJsb2NrSW5zdGFuY2VTdGF0ZS5DT01QTEVURSwgdE5vZGUsIGxDb250YWluZXIsIHREZXRhaWxzLnByaW1hcnlUbXBsSW5kZXgpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBEZWZlckRlcGVuZGVuY2llc0xvYWRpbmdTdGF0ZS5GQUlMRUQ6XG4gICAgICByZW5kZXJEZWZlckJsb2NrU3RhdGUoXG4gICAgICAgICAgRGVmZXJCbG9ja0luc3RhbmNlU3RhdGUuRVJST1IsIHROb2RlLCBsQ29udGFpbmVyLCB0RGV0YWlscy5lcnJvclRtcGxJbmRleCk7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICB0aHJvd0Vycm9yKCdVbmtub3duIGRlZmVyIGJsb2NrIHN0YXRlJyk7XG4gICAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBc3NlcnRzIHdoZXRoZXIgYWxsIGRlcGVuZGVuY2llcyBmb3IgYSBkZWZlciBibG9jayBhcmUgbG9hZGVkLlxuICogQWx3YXlzIHJ1biB0aGlzIGZ1bmN0aW9uIChpbiBkZXYgbW9kZSkgYmVmb3JlIHJlbmRlcmluZyBhIGRlZmVyXG4gKiBibG9jayBpbiBjb21wbGV0ZWQgc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIGFzc2VydERlZmVycmVkRGVwZW5kZW5jaWVzTG9hZGVkKHREZXRhaWxzOiBURGVmZXJCbG9ja0RldGFpbHMpIHtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICB0RGV0YWlscy5sb2FkaW5nU3RhdGUsIERlZmVyRGVwZW5kZW5jaWVzTG9hZGluZ1N0YXRlLkNPTVBMRVRFLFxuICAgICAgJ0V4cGVjdGluZyBhbGwgZGVmZXJyZWQgZGVwZW5kZW5jaWVzIHRvIGJlIGxvYWRlZC4nKTtcbn1cblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKlxuICogRGVzY3JpYmVzIGEgaGVscGVyIGNsYXNzIHRoYXQgYWxsb3dzIHRvIGludGVyY2VwdCBhIGNhbGwgdG8gcmV0cmlldmUgY3VycmVudFxuICogZGVwZW5kZW5jeSBsb2FkaW5nIGZ1bmN0aW9uIGFuZCByZXBsYWNlIGl0IHdpdGggYSBkaWZmZXJlbnQgaW1wbGVtZW50YXRpb24uXG4gKiBUaGlzIGludGVyY2VwdG9yIGNsYXNzIGlzIG5lZWRlZCB0byBhbGxvdyB0ZXN0aW5nIGJsb2NrcyBpbiBkaWZmZXJlbnQgc3RhdGVzXG4gKiBieSBzaW11bGF0aW5nIGxvYWRpbmcgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvciB7XG4gIC8qKlxuICAgKiBJbnZva2VkIGZvciBlYWNoIGRlZmVyIGJsb2NrIHdoZW4gZGVwZW5kZW5jeSBsb2FkaW5nIGZ1bmN0aW9uIGlzIGFjY2Vzc2VkLlxuICAgKi9cbiAgaW50ZXJjZXB0KGRlcGVuZGVuY3lGbjogRGVwZW5kZW5jeVJlc29sdmVyRm58bnVsbCk6IERlcGVuZGVuY3lSZXNvbHZlckZufG51bGw7XG5cbiAgLyoqXG4gICAqIEFsbG93cyB0byBjb25maWd1cmUgYW4gaW50ZXJjZXB0b3IgZnVuY3Rpb24uXG4gICAqL1xuICBzZXRJbnRlcmNlcHRvcihpbnRlcmNlcHRvckZuOiAoY3VycmVudDogRGVwZW5kZW5jeVJlc29sdmVyRm4pID0+IERlcGVuZGVuY3lSZXNvbHZlckZuKTogdm9pZDtcbn1cblxuLyoqXG4gKiAqKklOVEVSTkFMKiosIGF2b2lkIHJlZmVyZW5jaW5nIGl0IGluIGFwcGxpY2F0aW9uIGNvZGUuXG4gKlxuICogSW5qZWN0b3IgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcHJvdmlkZSBgRGVmZXJCbG9ja0RlcGVuZGVuY3lJbnRlcmNlcHRvcmAgY2xhc3NcbiAqIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPERlZmVyQmxvY2tEZXBlbmRlbmN5SW50ZXJjZXB0b3I+KFxuICAgICAgICBuZ0Rldk1vZGUgPyAnREVGRVJfQkxPQ0tfREVQRU5ERU5DWV9JTlRFUkNFUFRPUicgOiAnJyk7XG4iXX0=