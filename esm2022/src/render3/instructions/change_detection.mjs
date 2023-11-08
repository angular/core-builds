/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerAfterComputation, consumerBeforeComputation, consumerPollProducersForChange } from '@angular/core/primitives/signals';
import { RuntimeError } from '../../errors';
import { assertDefined, assertEqual } from '../../util/assert';
import { assertLContainer } from '../assert';
import { getComponentViewByInstance } from '../context_discovery';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, HAS_CHILD_VIEWS_TO_REFRESH, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS } from '../interfaces/container';
import { CONTEXT, EFFECTS_TO_SCHEDULE, ENVIRONMENT, FLAGS, PARENT, REACTIVE_TEMPLATE_CONSUMER, TVIEW } from '../interfaces/view';
import { getOrBorrowReactiveLViewConsumer, maybeReturnReactiveLViewConsumer } from '../reactive_lview_consumer';
import { enterView, isInCheckNoChangesMode, leaveView, setBindingIndex, setIsInCheckNoChangesMode } from '../state';
import { getFirstLContainer, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, isCreationMode, markAncestorsForTraversal, markViewForRefresh, resetPreOrderHookFlags, viewAttachedToChangeDetector } from '../util/view_utils';
import { executeTemplate, executeViewQueryFn, handleError, processHostBindingOpCodes, refreshContentQueries } from './shared';
/**
 * The maximum number of times the change detection traversal will rerun before throwing an error.
 */
const MAXIMUM_REFRESH_RERUNS = 100;
export function detectChangesInternal(tView, lView, context, notifyErrorHandler = true) {
    const environment = lView[ENVIRONMENT];
    const rendererFactory = environment.rendererFactory;
    const afterRenderEventManager = environment.afterRenderEventManager;
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to invoke renderer factory functions in that mode
    // to avoid any possible side-effects.
    const checkNoChangesMode = !!ngDevMode && isInCheckNoChangesMode();
    if (!checkNoChangesMode) {
        rendererFactory.begin?.();
        afterRenderEventManager?.begin();
    }
    try {
        refreshView(tView, lView, tView.template, context);
        detectChangesInViewWhileDirty(lView);
    }
    catch (error) {
        if (notifyErrorHandler) {
            handleError(lView, error);
        }
        throw error;
    }
    finally {
        if (!checkNoChangesMode) {
            rendererFactory.end?.();
            // One final flush of the effects queue to catch any effects created in `ngAfterViewInit` or
            // other post-order hooks.
            environment.inlineEffectRunner?.flush();
            // Invoke all callbacks registered via `after*Render`, if needed.
            afterRenderEventManager?.end();
        }
    }
}
function detectChangesInViewWhileDirty(lView) {
    let retries = 0;
    // If after running change detection, this view still needs to be refreshed or there are
    // descendants views that need to be refreshed due to re-dirtying during the change detection
    // run, detect changes on the view again. We run change detection in `Targeted` mode to only
    // refresh views with the `RefreshView` flag.
    while (lView[FLAGS] & (1024 /* LViewFlags.RefreshView */ | 8192 /* LViewFlags.HasChildViewsToRefresh */) ||
        lView[REACTIVE_TEMPLATE_CONSUMER]?.dirty) {
        if (retries === MAXIMUM_REFRESH_RERUNS) {
            throw new RuntimeError(103 /* RuntimeErrorCode.INFINITE_CHANGE_DETECTION */, ngDevMode &&
                'Infinite change detection while trying to refresh views. ' +
                    'There may be components which each cause the other to require a refresh, ' +
                    'causing an infinite loop.');
        }
        retries++;
        // Even if this view is detached, we still detect changes in targeted mode because this was
        // the root of the change detection run.
        detectChangesInView(lView, 1 /* ChangeDetectionMode.Targeted */);
    }
}
export function checkNoChangesInternal(tView, lView, context, notifyErrorHandler = true) {
    setIsInCheckNoChangesMode(true);
    try {
        detectChangesInternal(tView, lView, context, notifyErrorHandler);
    }
    finally {
        setIsInCheckNoChangesMode(false);
    }
}
/**
 * Synchronously perform change detection on a component (and possibly its sub-components).
 *
 * This function triggers change detection in a synchronous way on a component.
 *
 * @param component The component which the change detection should be performed on.
 */
export function detectChanges(component) {
    const view = getComponentViewByInstance(component);
    detectChangesInternal(view[TVIEW], view, component);
}
/**
 * Processes a view in update mode. This includes a number of steps in a specific order:
 * - executing a template function in update mode;
 * - executing hooks;
 * - refreshing queries;
 * - setting host bindings;
 * - refreshing child (embedded and component) views.
 */
export function refreshView(tView, lView, templateFn, context) {
    ngDevMode && assertEqual(isCreationMode(lView), false, 'Should be run in update mode');
    const flags = lView[FLAGS];
    if ((flags & 256 /* LViewFlags.Destroyed */) === 256 /* LViewFlags.Destroyed */)
        return;
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to execute lifecycle hooks in that mode.
    const isInCheckNoChangesPass = ngDevMode && isInCheckNoChangesMode();
    !isInCheckNoChangesPass && lView[ENVIRONMENT].inlineEffectRunner?.flush();
    // Start component reactive context
    // - We might already be in a reactive context if this is an embedded view of the host.
    // - We might be descending into a view that needs a consumer.
    enterView(lView);
    let prevConsumer = null;
    let currentConsumer = null;
    if (!isInCheckNoChangesPass && viewShouldHaveReactiveConsumer(tView)) {
        currentConsumer = getOrBorrowReactiveLViewConsumer(lView);
        prevConsumer = consumerBeforeComputation(currentConsumer);
    }
    try {
        resetPreOrderHookFlags(lView);
        setBindingIndex(tView.bindingStartIndex);
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 2 /* RenderFlags.Update */, context);
        }
        const hooksInitPhaseCompleted = (flags & 3 /* LViewFlags.InitPhaseStateMask */) === 3 /* InitPhaseState.InitPhaseCompleted */;
        // execute pre-order hooks (OnInit, OnChanges, DoCheck)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!isInCheckNoChangesPass) {
            if (hooksInitPhaseCompleted) {
                const preOrderCheckHooks = tView.preOrderCheckHooks;
                if (preOrderCheckHooks !== null) {
                    executeCheckHooks(lView, preOrderCheckHooks, null);
                }
            }
            else {
                const preOrderHooks = tView.preOrderHooks;
                if (preOrderHooks !== null) {
                    executeInitAndCheckHooks(lView, preOrderHooks, 0 /* InitPhaseState.OnInitHooksToBeRun */, null);
                }
                incrementInitPhaseFlags(lView, 0 /* InitPhaseState.OnInitHooksToBeRun */);
            }
        }
        // First mark transplanted views that are declared in this lView as needing a refresh at their
        // insertion points. This is needed to avoid the situation where the template is defined in this
        // `LView` but its declaration appears after the insertion component.
        markTransplantedViewsForRefresh(lView);
        detectChangesInEmbeddedViews(lView, 0 /* ChangeDetectionMode.Global */);
        // Content query results must be refreshed before content hooks are called.
        if (tView.contentQueries !== null) {
            refreshContentQueries(tView, lView);
        }
        // execute content hooks (AfterContentInit, AfterContentChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!isInCheckNoChangesPass) {
            if (hooksInitPhaseCompleted) {
                const contentCheckHooks = tView.contentCheckHooks;
                if (contentCheckHooks !== null) {
                    executeCheckHooks(lView, contentCheckHooks);
                }
            }
            else {
                const contentHooks = tView.contentHooks;
                if (contentHooks !== null) {
                    executeInitAndCheckHooks(lView, contentHooks, 1 /* InitPhaseState.AfterContentInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 1 /* InitPhaseState.AfterContentInitHooksToBeRun */);
            }
        }
        processHostBindingOpCodes(tView, lView);
        // Refresh child component views.
        const components = tView.components;
        if (components !== null) {
            detectChangesInChildComponents(lView, components, 0 /* ChangeDetectionMode.Global */);
        }
        // View queries must execute after refreshing child components because a template in this view
        // could be inserted in a child component. If the view query executes before child component
        // refresh, the template might not yet be inserted.
        const viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(2 /* RenderFlags.Update */, viewQuery, context);
        }
        // execute view hooks (AfterViewInit, AfterViewChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!isInCheckNoChangesPass) {
            if (hooksInitPhaseCompleted) {
                const viewCheckHooks = tView.viewCheckHooks;
                if (viewCheckHooks !== null) {
                    executeCheckHooks(lView, viewCheckHooks);
                }
            }
            else {
                const viewHooks = tView.viewHooks;
                if (viewHooks !== null) {
                    executeInitAndCheckHooks(lView, viewHooks, 2 /* InitPhaseState.AfterViewInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 2 /* InitPhaseState.AfterViewInitHooksToBeRun */);
            }
        }
        if (tView.firstUpdatePass === true) {
            // We need to make sure that we only flip the flag on successful `refreshView` only
            // Don't do this in `finally` block.
            // If we did this in `finally` block then an exception could block the execution of styling
            // instructions which in turn would be unable to insert themselves into the styling linked
            // list. The result of this would be that if the exception would not be throw on subsequent CD
            // the styling would be unable to process it data and reflect to the DOM.
            tView.firstUpdatePass = false;
        }
        // Schedule any effects that are waiting on the update pass of this view.
        if (lView[EFFECTS_TO_SCHEDULE]) {
            for (const notifyEffect of lView[EFFECTS_TO_SCHEDULE]) {
                notifyEffect();
            }
            // Once they've been run, we can drop the array.
            lView[EFFECTS_TO_SCHEDULE] = null;
        }
        // Do not reset the dirty state when running in check no changes mode. We don't want components
        // to behave differently depending on whether check no changes is enabled or not. For example:
        // Marking an OnPush component as dirty from within the `ngAfterViewInit` hook in order to
        // refresh a `NgClass` binding should work. If we would reset the dirty state in the check
        // no changes cycle, the component would be not be dirty for the next update pass. This would
        // be different in production mode where the component dirty state is not reset.
        if (!isInCheckNoChangesPass) {
            lView[FLAGS] &= ~(64 /* LViewFlags.Dirty */ | 8 /* LViewFlags.FirstLViewPass */);
        }
    }
    catch (e) {
        // If refreshing a view causes an error, we need to remark the ancestors as needing traversal
        // because the error might have caused a situation where views below the current location are
        // dirty but will be unreachable because the "has dirty children" flag in the ancestors has been
        // cleared during change detection and we failed to run to completion.
        markAncestorsForTraversal(lView);
        throw e;
    }
    finally {
        if (currentConsumer !== null) {
            consumerAfterComputation(currentConsumer, prevConsumer);
            maybeReturnReactiveLViewConsumer(currentConsumer);
        }
        leaveView();
    }
}
/**
 * Indicates if the view should get its own reactive consumer node.
 *
 * In the current design, all embedded views share a consumer with the component view. This allows
 * us to refresh at the component level rather than at a per-view level. In addition, root views get
 * their own reactive node because root component will have a host view that executes the
 * component's host bindings. This needs to be tracked in a consumer as well.
 *
 * To get a more granular change detection than per-component, all we would just need to update the
 * condition here so that a given view gets a reactive consumer which can become dirty independently
 * from its parent component. For example embedded views for signal components could be created with
 * a new type "SignalEmbeddedView" and the condition here wouldn't even need updating in order to
 * get granular per-view change detection for signal components.
 */
function viewShouldHaveReactiveConsumer(tView) {
    return tView.type !== 2 /* TViewType.Embedded */;
}
/**
 * Goes over embedded views (ones created through ViewContainerRef APIs) and refreshes
 * them by executing an associated template function.
 */
function detectChangesInEmbeddedViews(lView, mode) {
    for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
        lContainer[HAS_CHILD_VIEWS_TO_REFRESH] = false;
        for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
            const embeddedLView = lContainer[i];
            detectChangesInViewIfAttached(embeddedLView, mode);
        }
    }
}
/**
 * Mark transplanted views as needing to be refreshed at their insertion points.
 *
 * @param lView The `LView` that may have transplanted views.
 */
function markTransplantedViewsForRefresh(lView) {
    for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
        if (!lContainer[HAS_TRANSPLANTED_VIEWS])
            continue;
        const movedViews = lContainer[MOVED_VIEWS];
        ngDevMode && assertDefined(movedViews, 'Transplanted View flags set but missing MOVED_VIEWS');
        for (let i = 0; i < movedViews.length; i++) {
            const movedLView = movedViews[i];
            const insertionLContainer = movedLView[PARENT];
            ngDevMode && assertLContainer(insertionLContainer);
            markViewForRefresh(movedLView);
        }
    }
}
/**
 * Detects changes in a component by entering the component view and processing its bindings,
 * queries, etc. if it is CheckAlways, OnPush and Dirty, etc.
 *
 * @param componentHostIdx  Element index in LView[] (adjusted for HEADER_OFFSET)
 */
function detectChangesInComponent(hostLView, componentHostIdx, mode) {
    ngDevMode && assertEqual(isCreationMode(hostLView), false, 'Should be run in update mode');
    const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
    detectChangesInViewIfAttached(componentView, mode);
}
/**
 * Visits a view as part of change detection traversal.
 *
 * If the view is detached, no additional traversal happens.
 */
function detectChangesInViewIfAttached(lView, mode) {
    if (!viewAttachedToChangeDetector(lView)) {
        return;
    }
    detectChangesInView(lView, mode);
}
/**
 * Visits a view as part of change detection traversal.
 *
 * The view is refreshed if:
 * - If the view is CheckAlways or Dirty and ChangeDetectionMode is `Global`
 * - If the view has the `RefreshTransplantedView` flag
 *
 * The view is not refreshed, but descendants are traversed in `ChangeDetectionMode.Targeted` if the
 * view HasChildViewsToRefresh flag is set.
 */
function detectChangesInView(lView, mode) {
    const isInCheckNoChangesPass = ngDevMode && isInCheckNoChangesMode();
    const tView = lView[TVIEW];
    const flags = lView[FLAGS];
    const consumer = lView[REACTIVE_TEMPLATE_CONSUMER];
    // Refresh CheckAlways views in Global mode.
    let shouldRefreshView = !!(mode === 0 /* ChangeDetectionMode.Global */ && flags & 16 /* LViewFlags.CheckAlways */);
    // Refresh Dirty views in Global mode, as long as we're not in checkNoChanges.
    // CheckNoChanges never worked with `OnPush` components because the `Dirty` flag was
    // cleared before checkNoChanges ran. Because there is now a loop for to check for
    // backwards views, it gives an opportunity for `OnPush` components to be marked `Dirty`
    // before the CheckNoChanges pass. We don't want existing errors that are hidden by the
    // current CheckNoChanges bug to surface when making unrelated changes.
    shouldRefreshView ||= !!(flags & 64 /* LViewFlags.Dirty */ && mode === 0 /* ChangeDetectionMode.Global */ && !isInCheckNoChangesPass);
    // Always refresh views marked for refresh, regardless of mode.
    shouldRefreshView ||= !!(flags & 1024 /* LViewFlags.RefreshView */);
    // Refresh views when they have a dirty reactive consumer, regardless of mode.
    shouldRefreshView ||= !!(consumer?.dirty && consumerPollProducersForChange(consumer));
    // Mark the Flags and `ReactiveNode` as not dirty before refreshing the component, so that they
    // can be re-dirtied during the refresh process.
    if (consumer) {
        consumer.dirty = false;
    }
    lView[FLAGS] &= ~(8192 /* LViewFlags.HasChildViewsToRefresh */ | 1024 /* LViewFlags.RefreshView */);
    if (shouldRefreshView) {
        refreshView(tView, lView, tView.template, lView[CONTEXT]);
    }
    else if (flags & 8192 /* LViewFlags.HasChildViewsToRefresh */) {
        detectChangesInEmbeddedViews(lView, 1 /* ChangeDetectionMode.Targeted */);
        const components = tView.components;
        if (components !== null) {
            detectChangesInChildComponents(lView, components, 1 /* ChangeDetectionMode.Targeted */);
        }
    }
}
/** Refreshes child components in the current view (update mode). */
function detectChangesInChildComponents(hostLView, components, mode) {
    for (let i = 0; i < components.length; i++) {
        detectChangesInComponent(hostLView, components[i], mode);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLDhCQUE4QixFQUFlLE1BQU0sa0NBQWtDLENBQUM7QUFFbkosT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlGLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSwwQkFBMEIsRUFBRSxzQkFBc0IsRUFBYyxXQUFXLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUU3SSxPQUFPLEVBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQXFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRSxLQUFLLEVBQW1CLE1BQU0sb0JBQW9CLENBQUM7QUFDcEwsT0FBTyxFQUFDLGdDQUFnQyxFQUFFLGdDQUFnQyxFQUF3QixNQUFNLDRCQUE0QixDQUFDO0FBQ3JJLE9BQU8sRUFBQyxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztB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LENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzFEO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbiwgY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbiwgY29uc3VtZXJQb2xsUHJvZHVjZXJzRm9yQ2hhbmdlLCBSZWFjdGl2ZU5vZGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXJ9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluc3RhbmNlfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfQ0hJTERfVklFV1NfVE9fUkVGUkVTSCwgSEFTX1RSQU5TUExBTlRFRF9WSUVXUywgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGUsIFJlbmRlckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05URVhULCBFRkZFQ1RTX1RPX1NDSEVEVUxFLCBFTlZJUk9OTUVOVCwgRkxBR1MsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUiwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldE9yQm9ycm93UmVhY3RpdmVMVmlld0NvbnN1bWVyLCBtYXliZVJldHVyblJlYWN0aXZlTFZpZXdDb25zdW1lciwgUmVhY3RpdmVMVmlld0NvbnN1bWVyfSBmcm9tICcuLi9yZWFjdGl2ZV9sdmlld19jb25zdW1lcic7XG5pbXBvcnQge2VudGVyVmlldywgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSwgbGVhdmVWaWV3LCBzZXRCaW5kaW5nSW5kZXgsIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Rmlyc3RMQ29udGFpbmVyLCBnZXROZXh0TENvbnRhaW5lcn0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgaXNDcmVhdGlvbk1vZGUsIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwsIG1hcmtWaWV3Rm9yUmVmcmVzaCwgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtleGVjdXRlVGVtcGxhdGUsIGV4ZWN1dGVWaWV3UXVlcnlGbiwgaGFuZGxlRXJyb3IsIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXMsIHJlZnJlc2hDb250ZW50UXVlcmllc30gZnJvbSAnLi9zaGFyZWQnO1xuXG4vKipcbiAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiB0aW1lcyB0aGUgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwgd2lsbCByZXJ1biBiZWZvcmUgdGhyb3dpbmcgYW4gZXJyb3IuXG4gKi9cbmNvbnN0IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMgPSAxMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IFQsIG5vdGlmeUVycm9ySGFuZGxlciA9IHRydWUpIHtcbiAgY29uc3QgZW52aXJvbm1lbnQgPSBsVmlld1tFTlZJUk9OTUVOVF07XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGVudmlyb25tZW50LnJlbmRlcmVyRmFjdG9yeTtcbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBlbnZpcm9ubWVudC5hZnRlclJlbmRlckV2ZW50TWFuYWdlcjtcblxuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGludm9rZSByZW5kZXJlciBmYWN0b3J5IGZ1bmN0aW9ucyBpbiB0aGF0IG1vZGVcbiAgLy8gdG8gYXZvaWQgYW55IHBvc3NpYmxlIHNpZGUtZWZmZWN0cy5cbiAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gISFuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luPy4oKTtcbiAgICBhZnRlclJlbmRlckV2ZW50TWFuYWdlcj8uYmVnaW4oKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHkobFZpZXcpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChub3RpZnlFcnJvckhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kPy4oKTtcblxuICAgICAgLy8gT25lIGZpbmFsIGZsdXNoIG9mIHRoZSBlZmZlY3RzIHF1ZXVlIHRvIGNhdGNoIGFueSBlZmZlY3RzIGNyZWF0ZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgb3JcbiAgICAgIC8vIG90aGVyIHBvc3Qtb3JkZXIgaG9va3MuXG4gICAgICBlbnZpcm9ubWVudC5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG5cbiAgICAgIC8vIEludm9rZSBhbGwgY2FsbGJhY2tzIHJlZ2lzdGVyZWQgdmlhIGBhZnRlcipSZW5kZXJgLCBpZiBuZWVkZWQuXG4gICAgICBhZnRlclJlbmRlckV2ZW50TWFuYWdlcj8uZW5kKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXdXaGlsZURpcnR5KGxWaWV3OiBMVmlldykge1xuICBsZXQgcmV0cmllcyA9IDA7XG4gIC8vIElmIGFmdGVyIHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiwgdGhpcyB2aWV3IHN0aWxsIG5lZWRzIHRvIGJlIHJlZnJlc2hlZCBvciB0aGVyZSBhcmVcbiAgLy8gZGVzY2VuZGFudHMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZCBkdWUgdG8gcmUtZGlydHlpbmcgZHVyaW5nIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gIC8vIHJ1biwgZGV0ZWN0IGNoYW5nZXMgb24gdGhlIHZpZXcgYWdhaW4uIFdlIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIGluIGBUYXJnZXRlZGAgbW9kZSB0byBvbmx5XG4gIC8vIHJlZnJlc2ggdmlld3Mgd2l0aCB0aGUgYFJlZnJlc2hWaWV3YCBmbGFnLlxuICB3aGlsZSAobFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuUmVmcmVzaFZpZXcgfCBMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2gpIHx8XG4gICAgICAgICBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl0/LmRpcnR5KSB7XG4gICAgaWYgKHJldHJpZXMgPT09IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAnSW5maW5pdGUgY2hhbmdlIGRldGVjdGlvbiB3aGlsZSB0cnlpbmcgdG8gcmVmcmVzaCB2aWV3cy4gJyArXG4gICAgICAgICAgICAgICAgICAnVGhlcmUgbWF5IGJlIGNvbXBvbmVudHMgd2hpY2ggZWFjaCBjYXVzZSB0aGUgb3RoZXIgdG8gcmVxdWlyZSBhIHJlZnJlc2gsICcgK1xuICAgICAgICAgICAgICAgICAgJ2NhdXNpbmcgYW4gaW5maW5pdGUgbG9vcC4nKTtcbiAgICB9XG4gICAgcmV0cmllcysrO1xuICAgIC8vIEV2ZW4gaWYgdGhpcyB2aWV3IGlzIGRldGFjaGVkLCB3ZSBzdGlsbCBkZXRlY3QgY2hhbmdlcyBpbiB0YXJnZXRlZCBtb2RlIGJlY2F1c2UgdGhpcyB3YXNcbiAgICAvLyB0aGUgcm9vdCBvZiB0aGUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWw8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IFQsIG5vdGlmeUVycm9ySGFuZGxlciA9IHRydWUpIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodFZpZXcsIGxWaWV3LCBjb250ZXh0LCBub3RpZnlFcnJvckhhbmRsZXIpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSBjb21wb25lbnQgKGFuZCBwb3NzaWJseSBpdHMgc3ViLWNvbXBvbmVudHMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBpbiBhIHN5bmNocm9ub3VzIHdheSBvbiBhIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXMoY29tcG9uZW50OiB7fSk6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KTtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHZpZXdbVFZJRVddLCB2aWV3LCBjb21wb25lbnQpO1xufVxuXG4vKipcbiAqIERpZmZlcmVudCBtb2RlcyBvZiB0cmF2ZXJzaW5nIHRoZSBsb2dpY2FsIHZpZXcgdHJlZSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKlxuICogVGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIGFsZ29yaXRobSBzd2l0Y2hlcyBiZXR3ZWVuIHRoZXNlIG1vZGVzIGJhc2VkIG9uIHZhcmlvdXNcbiAqIGNvbmRpdGlvbnMuXG4gKi9cbmNvbnN0IGVudW0gQ2hhbmdlRGV0ZWN0aW9uTW9kZSB7XG4gIC8qKlxuICAgKiBJbiBgR2xvYmFsYCBtb2RlLCBgRGlydHlgIGFuZCBgQ2hlY2tBbHdheXNgIHZpZXdzIGFyZSByZWZyZXNoZWQgYXMgd2VsbCBhcyB2aWV3cyB3aXRoIHRoZVxuICAgKiBgUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdgIGZsYWcuXG4gICAqL1xuICBHbG9iYWwsXG4gIC8qKlxuICAgKiBJbiBgVGFyZ2V0ZWRgIG1vZGUsIG9ubHkgdmlld3Mgd2l0aCB0aGUgYFJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3YFxuICAgKiBmbGFnIGFyZSByZWZyZXNoZWQuXG4gICAqL1xuICBUYXJnZXRlZCxcbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHVwZGF0ZSBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGV4ZWN1dGluZyBhIHRlbXBsYXRlIGZ1bmN0aW9uIGluIHVwZGF0ZSBtb2RlO1xuICogLSBleGVjdXRpbmcgaG9va3M7XG4gKiAtIHJlZnJlc2hpbmcgcXVlcmllcztcbiAqIC0gc2V0dGluZyBob3N0IGJpbmRpbmdzO1xuICogLSByZWZyZXNoaW5nIGNoaWxkIChlbWJlZGRlZCBhbmQgY29tcG9uZW50KSB2aWV3cy5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFZpZXc8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCBjb250ZXh0OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgaWYgKChmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSA9PT0gTFZpZXdGbGFncy5EZXN0cm95ZWQpIHJldHVybjtcblxuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGV4ZWN1dGUgbGlmZWN5Y2xlIGhvb2tzIGluIHRoYXQgbW9kZS5cbiAgY29uc3QgaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyA9IG5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgJiYgbFZpZXdbRU5WSVJPTk1FTlRdLmlubGluZUVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcblxuXG4gIC8vIFN0YXJ0IGNvbXBvbmVudCByZWFjdGl2ZSBjb250ZXh0XG4gIC8vIC0gV2UgbWlnaHQgYWxyZWFkeSBiZSBpbiBhIHJlYWN0aXZlIGNvbnRleHQgaWYgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIHRoZSBob3N0LlxuICAvLyAtIFdlIG1pZ2h0IGJlIGRlc2NlbmRpbmcgaW50byBhIHZpZXcgdGhhdCBuZWVkcyBhIGNvbnN1bWVyLlxuICBlbnRlclZpZXcobFZpZXcpO1xuICBsZXQgcHJldkNvbnN1bWVyOiBSZWFjdGl2ZU5vZGV8bnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50Q29uc3VtZXI6IFJlYWN0aXZlTFZpZXdDb25zdW1lcnxudWxsID0gbnVsbDtcbiAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzICYmIHZpZXdTaG91bGRIYXZlUmVhY3RpdmVDb25zdW1lcih0VmlldykpIHtcbiAgICBjdXJyZW50Q29uc3VtZXIgPSBnZXRPckJvcnJvd1JlYWN0aXZlTFZpZXdDb25zdW1lcihsVmlldyk7XG4gICAgcHJldkNvbnN1bWVyID0gY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbihjdXJyZW50Q29uc3VtZXIpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdJbmRleCh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjaylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmlyc3QgbWFyayB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBhcmUgZGVjbGFyZWQgaW4gdGhpcyBsVmlldyBhcyBuZWVkaW5nIGEgcmVmcmVzaCBhdCB0aGVpclxuICAgIC8vIGluc2VydGlvbiBwb2ludHMuIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIHRoZSBzaXR1YXRpb24gd2hlcmUgdGhlIHRlbXBsYXRlIGlzIGRlZmluZWQgaW4gdGhpc1xuICAgIC8vIGBMVmlld2AgYnV0IGl0cyBkZWNsYXJhdGlvbiBhcHBlYXJzIGFmdGVyIHRoZSBpbnNlcnRpb24gY29tcG9uZW50LlxuICAgIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXcpO1xuICAgIGRldGVjdENoYW5nZXNJbkVtYmVkZGVkVmlld3MobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsKTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gU2NoZWR1bGUgYW55IGVmZmVjdHMgdGhhdCBhcmUgd2FpdGluZyBvbiB0aGUgdXBkYXRlIHBhc3Mgb2YgdGhpcyB2aWV3LlxuICAgIGlmIChsVmlld1tFRkZFQ1RTX1RPX1NDSEVEVUxFXSkge1xuICAgICAgZm9yIChjb25zdCBub3RpZnlFZmZlY3Qgb2YgbFZpZXdbRUZGRUNUU19UT19TQ0hFRFVMRV0pIHtcbiAgICAgICAgbm90aWZ5RWZmZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uY2UgdGhleSd2ZSBiZWVuIHJ1biwgd2UgY2FuIGRyb3AgdGhlIGFycmF5LlxuICAgICAgbFZpZXdbRUZGRUNUU19UT19TQ0hFRFVMRV0gPSBudWxsO1xuICAgIH1cblxuICAgIC8vIERvIG5vdCByZXNldCB0aGUgZGlydHkgc3RhdGUgd2hlbiBydW5uaW5nIGluIGNoZWNrIG5vIGNoYW5nZXMgbW9kZS4gV2UgZG9uJ3Qgd2FudCBjb21wb25lbnRzXG4gICAgLy8gdG8gYmVoYXZlIGRpZmZlcmVudGx5IGRlcGVuZGluZyBvbiB3aGV0aGVyIGNoZWNrIG5vIGNoYW5nZXMgaXMgZW5hYmxlZCBvciBub3QuIEZvciBleGFtcGxlOlxuICAgIC8vIE1hcmtpbmcgYW4gT25QdXNoIGNvbXBvbmVudCBhcyBkaXJ0eSBmcm9tIHdpdGhpbiB0aGUgYG5nQWZ0ZXJWaWV3SW5pdGAgaG9vayBpbiBvcmRlciB0b1xuICAgIC8vIHJlZnJlc2ggYSBgTmdDbGFzc2AgYmluZGluZyBzaG91bGQgd29yay4gSWYgd2Ugd291bGQgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIGluIHRoZSBjaGVja1xuICAgIC8vIG5vIGNoYW5nZXMgY3ljbGUsIHRoZSBjb21wb25lbnQgd291bGQgYmUgbm90IGJlIGRpcnR5IGZvciB0aGUgbmV4dCB1cGRhdGUgcGFzcy4gVGhpcyB3b3VsZFxuICAgIC8vIGJlIGRpZmZlcmVudCBpbiBwcm9kdWN0aW9uIG1vZGUgd2hlcmUgdGhlIGNvbXBvbmVudCBkaXJ0eSBzdGF0ZSBpcyBub3QgcmVzZXQuXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWYgcmVmcmVzaGluZyBhIHZpZXcgY2F1c2VzIGFuIGVycm9yLCB3ZSBuZWVkIHRvIHJlbWFyayB0aGUgYW5jZXN0b3JzIGFzIG5lZWRpbmcgdHJhdmVyc2FsXG4gICAgLy8gYmVjYXVzZSB0aGUgZXJyb3IgbWlnaHQgaGF2ZSBjYXVzZWQgYSBzaXR1YXRpb24gd2hlcmUgdmlld3MgYmVsb3cgdGhlIGN1cnJlbnQgbG9jYXRpb24gYXJlXG4gICAgLy8gZGlydHkgYnV0IHdpbGwgYmUgdW5yZWFjaGFibGUgYmVjYXVzZSB0aGUgXCJoYXMgZGlydHkgY2hpbGRyZW5cIiBmbGFnIGluIHRoZSBhbmNlc3RvcnMgaGFzIGJlZW5cbiAgICAvLyBjbGVhcmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCB3ZSBmYWlsZWQgdG8gcnVuIHRvIGNvbXBsZXRpb24uXG5cbiAgICBtYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsKGxWaWV3KTtcbiAgICB0aHJvdyBlO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChjdXJyZW50Q29uc3VtZXIgIT09IG51bGwpIHtcbiAgICAgIGNvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbihjdXJyZW50Q29uc3VtZXIsIHByZXZDb25zdW1lcik7XG4gICAgICBtYXliZVJldHVyblJlYWN0aXZlTFZpZXdDb25zdW1lcihjdXJyZW50Q29uc3VtZXIpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcoKTtcbiAgfVxufVxuXG4vKipcbiAqIEluZGljYXRlcyBpZiB0aGUgdmlldyBzaG91bGQgZ2V0IGl0cyBvd24gcmVhY3RpdmUgY29uc3VtZXIgbm9kZS5cbiAqXG4gKiBJbiB0aGUgY3VycmVudCBkZXNpZ24sIGFsbCBlbWJlZGRlZCB2aWV3cyBzaGFyZSBhIGNvbnN1bWVyIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3LiBUaGlzIGFsbG93c1xuICogdXMgdG8gcmVmcmVzaCBhdCB0aGUgY29tcG9uZW50IGxldmVsIHJhdGhlciB0aGFuIGF0IGEgcGVyLXZpZXcgbGV2ZWwuIEluIGFkZGl0aW9uLCByb290IHZpZXdzIGdldFxuICogdGhlaXIgb3duIHJlYWN0aXZlIG5vZGUgYmVjYXVzZSByb290IGNvbXBvbmVudCB3aWxsIGhhdmUgYSBob3N0IHZpZXcgdGhhdCBleGVjdXRlcyB0aGVcbiAqIGNvbXBvbmVudCdzIGhvc3QgYmluZGluZ3MuIFRoaXMgbmVlZHMgdG8gYmUgdHJhY2tlZCBpbiBhIGNvbnN1bWVyIGFzIHdlbGwuXG4gKlxuICogVG8gZ2V0IGEgbW9yZSBncmFudWxhciBjaGFuZ2UgZGV0ZWN0aW9uIHRoYW4gcGVyLWNvbXBvbmVudCwgYWxsIHdlIHdvdWxkIGp1c3QgbmVlZCB0byB1cGRhdGUgdGhlXG4gKiBjb25kaXRpb24gaGVyZSBzbyB0aGF0IGEgZ2l2ZW4gdmlldyBnZXRzIGEgcmVhY3RpdmUgY29uc3VtZXIgd2hpY2ggY2FuIGJlY29tZSBkaXJ0eSBpbmRlcGVuZGVudGx5XG4gKiBmcm9tIGl0cyBwYXJlbnQgY29tcG9uZW50LiBGb3IgZXhhbXBsZSBlbWJlZGRlZCB2aWV3cyBmb3Igc2lnbmFsIGNvbXBvbmVudHMgY291bGQgYmUgY3JlYXRlZCB3aXRoXG4gKiBhIG5ldyB0eXBlIFwiU2lnbmFsRW1iZWRkZWRWaWV3XCIgYW5kIHRoZSBjb25kaXRpb24gaGVyZSB3b3VsZG4ndCBldmVuIG5lZWQgdXBkYXRpbmcgaW4gb3JkZXIgdG9cbiAqIGdldCBncmFudWxhciBwZXItdmlldyBjaGFuZ2UgZGV0ZWN0aW9uIGZvciBzaWduYWwgY29tcG9uZW50cy5cbiAqL1xuZnVuY3Rpb24gdmlld1Nob3VsZEhhdmVSZWFjdGl2ZUNvbnN1bWVyKHRWaWV3OiBUVmlldykge1xuICByZXR1cm4gdFZpZXcudHlwZSAhPT0gVFZpZXdUeXBlLkVtYmVkZGVkO1xufVxuXG4vKipcbiAqIEdvZXMgb3ZlciBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzXG4gKiB0aGVtIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldywgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSkge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBsQ29udGFpbmVyW0hBU19DSElMRF9WSUVXU19UT19SRUZSRVNIXSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQoZW1iZWRkZWRMVmlldywgbW9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWFyayB0cmFuc3BsYW50ZWQgdmlld3MgYXMgbmVlZGluZyB0byBiZSByZWZyZXNoZWQgYXQgdGhlaXIgaW5zZXJ0aW9uIHBvaW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBtYXkgaGF2ZSB0cmFuc3BsYW50ZWQgdmlld3MuXG4gKi9cbmZ1bmN0aW9uIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGlmICghbENvbnRhaW5lcltIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTXSkgY29udGludWU7XG5cbiAgICBjb25zdCBtb3ZlZFZpZXdzID0gbENvbnRhaW5lcltNT1ZFRF9WSUVXU10hO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVmlld3MsICdUcmFuc3BsYW50ZWQgVmlldyBmbGFncyBzZXQgYnV0IG1pc3NpbmcgTU9WRURfVklFV1MnKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vdmVkVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1vdmVkTFZpZXcgPSBtb3ZlZFZpZXdzW2ldITtcbiAgICAgIGNvbnN0IGluc2VydGlvbkxDb250YWluZXIgPSBtb3ZlZExWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGluc2VydGlvbkxDb250YWluZXIpO1xuICAgICAgbWFya1ZpZXdGb3JSZWZyZXNoKG1vdmVkTFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgY2hhbmdlcyBpbiBhIGNvbXBvbmVudCBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLFxuICogcXVlcmllcywgZXRjLiBpZiBpdCBpcyBDaGVja0Fsd2F5cywgT25QdXNoIGFuZCBEaXJ0eSwgZXRjLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRIb3N0SWR4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Db21wb25lbnQoXG4gICAgaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50SG9zdElkeDogbnVtYmVyLCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZBdHRhY2hlZChjb21wb25lbnRWaWV3LCBtb2RlKTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSB2aWV3IGFzIHBhcnQgb2YgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwuXG4gKlxuICogSWYgdGhlIHZpZXcgaXMgZGV0YWNoZWQsIG5vIGFkZGl0aW9uYWwgdHJhdmVyc2FsIGhhcHBlbnMuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGxWaWV3OiBMVmlldywgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSkge1xuICBpZiAoIXZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IobFZpZXcpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXcsIG1vZGUpO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHZpZXcgYXMgcGFydCBvZiBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbC5cbiAqXG4gKiBUaGUgdmlldyBpcyByZWZyZXNoZWQgaWY6XG4gKiAtIElmIHRoZSB2aWV3IGlzIENoZWNrQWx3YXlzIG9yIERpcnR5IGFuZCBDaGFuZ2VEZXRlY3Rpb25Nb2RlIGlzIGBHbG9iYWxgXG4gKiAtIElmIHRoZSB2aWV3IGhhcyB0aGUgYFJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3YCBmbGFnXG4gKlxuICogVGhlIHZpZXcgaXMgbm90IHJlZnJlc2hlZCwgYnV0IGRlc2NlbmRhbnRzIGFyZSB0cmF2ZXJzZWQgaW4gYENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWRgIGlmIHRoZVxuICogdmlldyBIYXNDaGlsZFZpZXdzVG9SZWZyZXNoIGZsYWcgaXMgc2V0LlxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5WaWV3KGxWaWV3OiBMVmlldywgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSkge1xuICBjb25zdCBpc0luQ2hlY2tOb0NoYW5nZXNQYXNzID0gbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBjb25zdCBjb25zdW1lciA9IGxWaWV3W1JFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSXTtcblxuICAvLyBSZWZyZXNoIENoZWNrQWx3YXlzIHZpZXdzIGluIEdsb2JhbCBtb2RlLlxuICBsZXQgc2hvdWxkUmVmcmVzaFZpZXc6IGJvb2xlYW4gPVxuICAgICAgISEobW9kZSA9PT0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwgJiYgZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKTtcblxuICAvLyBSZWZyZXNoIERpcnR5IHZpZXdzIGluIEdsb2JhbCBtb2RlLCBhcyBsb25nIGFzIHdlJ3JlIG5vdCBpbiBjaGVja05vQ2hhbmdlcy5cbiAgLy8gQ2hlY2tOb0NoYW5nZXMgbmV2ZXIgd29ya2VkIHdpdGggYE9uUHVzaGAgY29tcG9uZW50cyBiZWNhdXNlIHRoZSBgRGlydHlgIGZsYWcgd2FzXG4gIC8vIGNsZWFyZWQgYmVmb3JlIGNoZWNrTm9DaGFuZ2VzIHJhbi4gQmVjYXVzZSB0aGVyZSBpcyBub3cgYSBsb29wIGZvciB0byBjaGVjayBmb3JcbiAgLy8gYmFja3dhcmRzIHZpZXdzLCBpdCBnaXZlcyBhbiBvcHBvcnR1bml0eSBmb3IgYE9uUHVzaGAgY29tcG9uZW50cyB0byBiZSBtYXJrZWQgYERpcnR5YFxuICAvLyBiZWZvcmUgdGhlIENoZWNrTm9DaGFuZ2VzIHBhc3MuIFdlIGRvbid0IHdhbnQgZXhpc3RpbmcgZXJyb3JzIHRoYXQgYXJlIGhpZGRlbiBieSB0aGVcbiAgLy8gY3VycmVudCBDaGVja05vQ2hhbmdlcyBidWcgdG8gc3VyZmFjZSB3aGVuIG1ha2luZyB1bnJlbGF0ZWQgY2hhbmdlcy5cbiAgc2hvdWxkUmVmcmVzaFZpZXcgfHw9ICEhKFxuICAgICAgZmxhZ3MgJiBMVmlld0ZsYWdzLkRpcnR5ICYmIG1vZGUgPT09IENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsICYmICFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKTtcblxuICAvLyBBbHdheXMgcmVmcmVzaCB2aWV3cyBtYXJrZWQgZm9yIHJlZnJlc2gsIHJlZ2FyZGxlc3Mgb2YgbW9kZS5cbiAgc2hvdWxkUmVmcmVzaFZpZXcgfHw9ICEhKGZsYWdzICYgTFZpZXdGbGFncy5SZWZyZXNoVmlldyk7XG5cbiAgLy8gUmVmcmVzaCB2aWV3cyB3aGVuIHRoZXkgaGF2ZSBhIGRpcnR5IHJlYWN0aXZlIGNvbnN1bWVyLCByZWdhcmRsZXNzIG9mIG1vZGUuXG4gIHNob3VsZFJlZnJlc2hWaWV3IHx8PSAhIShjb25zdW1lcj8uZGlydHkgJiYgY29uc3VtZXJQb2xsUHJvZHVjZXJzRm9yQ2hhbmdlKGNvbnN1bWVyKSk7XG5cbiAgLy8gTWFyayB0aGUgRmxhZ3MgYW5kIGBSZWFjdGl2ZU5vZGVgIGFzIG5vdCBkaXJ0eSBiZWZvcmUgcmVmcmVzaGluZyB0aGUgY29tcG9uZW50LCBzbyB0aGF0IHRoZXlcbiAgLy8gY2FuIGJlIHJlLWRpcnRpZWQgZHVyaW5nIHRoZSByZWZyZXNoIHByb2Nlc3MuXG4gIGlmIChjb25zdW1lcikge1xuICAgIGNvbnN1bWVyLmRpcnR5ID0gZmFsc2U7XG4gIH1cbiAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5IYXNDaGlsZFZpZXdzVG9SZWZyZXNoIHwgTFZpZXdGbGFncy5SZWZyZXNoVmlldyk7XG5cbiAgaWYgKHNob3VsZFJlZnJlc2hWaWV3KSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgbFZpZXdbQ09OVEVYVF0pO1xuICB9IGVsc2UgaWYgKGZsYWdzICYgTFZpZXdGbGFncy5IYXNDaGlsZFZpZXdzVG9SZWZyZXNoKSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3ICh1cGRhdGUgbW9kZSkuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5DaGlsZENvbXBvbmVudHMoXG4gICAgaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50czogbnVtYmVyW10sIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSwgbW9kZSk7XG4gIH1cbn1cbiJdfQ==