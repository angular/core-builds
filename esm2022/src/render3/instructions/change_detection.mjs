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
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS } from '../interfaces/container';
import { CONTEXT, EFFECTS_TO_SCHEDULE, ENVIRONMENT, FLAGS, PARENT, REACTIVE_TEMPLATE_CONSUMER, TVIEW } from '../interfaces/view';
import { getOrBorrowReactiveLViewConsumer, maybeReturnReactiveLViewConsumer } from '../reactive_lview_consumer';
import { enterView, isInCheckNoChangesMode, isRefreshingViews, leaveView, setBindingIndex, setIsInCheckNoChangesMode, setIsRefreshingViews } from '../state';
import { getFirstLContainer, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, isCreationMode, markAncestorsForTraversal, markViewForRefresh, requiresRefreshOrTraversal, resetPreOrderHookFlags, viewAttachedToChangeDetector } from '../util/view_utils';
import { executeTemplate, executeViewQueryFn, handleError, processHostBindingOpCodes, refreshContentQueries } from './shared';
/**
 * The maximum number of times the change detection traversal will rerun before throwing an error.
 */
export const MAXIMUM_REFRESH_RERUNS = 100;
export function detectChangesInternal(lView, notifyErrorHandler = true, mode = 0 /* ChangeDetectionMode.Global */) {
    const environment = lView[ENVIRONMENT];
    const rendererFactory = environment.rendererFactory;
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to invoke renderer factory functions in that mode
    // to avoid any possible side-effects.
    const checkNoChangesMode = !!ngDevMode && isInCheckNoChangesMode();
    if (!checkNoChangesMode) {
        rendererFactory.begin?.();
    }
    try {
        detectChangesInViewWhileDirty(lView, mode);
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
        }
    }
}
function detectChangesInViewWhileDirty(lView, mode) {
    const lastIsRefreshingViewsValue = isRefreshingViews();
    try {
        setIsRefreshingViews(true);
        detectChangesInView(lView, mode);
        let retries = 0;
        // If after running change detection, this view still needs to be refreshed or there are
        // descendants views that need to be refreshed due to re-dirtying during the change detection
        // run, detect changes on the view again. We run change detection in `Targeted` mode to only
        // refresh views with the `RefreshView` flag.
        while (requiresRefreshOrTraversal(lView)) {
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
    finally {
        // restore state to what it was before entering this change detection loop
        setIsRefreshingViews(lastIsRefreshingViewsValue);
    }
}
export function checkNoChangesInternal(lView, notifyErrorHandler = true) {
    setIsInCheckNoChangesMode(true);
    try {
        detectChangesInternal(lView, notifyErrorHandler);
    }
    finally {
        setIsInCheckNoChangesMode(false);
    }
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
        if (!(lContainer[FLAGS] & LContainerFlags.HasTransplantedViews))
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
 * - If the view has the `RefreshView` flag
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLDhCQUE4QixFQUFlLE1BQU0sa0NBQWtDLENBQUM7QUFFbkosT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlGLE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxlQUFlLEVBQUUsV0FBVyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUcsT0FBTyxFQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFxQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsS0FBSyxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3BMLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsRUFBd0IsTUFBTSw0QkFBNEIsQ0FBQztBQUNySSxPQUFPLEVBQUMsU0FBUyxFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUseUJBQXlCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDM0osT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDbkYsT0FBTyxFQUFDLHdCQUF3QixFQUFFLGNBQWMsRUFB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Q0FBQztRQUNwQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN4Qiw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsVUFBVSx1Q0FBK0IsQ0FBQztRQUNsRixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRCxvRUFBb0U7QUFDcEUsU0FBUyw4QkFBOEIsQ0FDbkMsU0FBZ0IsRUFBRSxVQUFvQixFQUFFLElBQXlCO0lBQ25FLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDM0Msd0JBQXdCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbiwgY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbiwgY29uc3VtZXJQb2xsUHJvZHVjZXJzRm9yQ2hhbmdlLCBSZWFjdGl2ZU5vZGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXJ9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBMQ29udGFpbmVyRmxhZ3MsIE1PVkVEX1ZJRVdTfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlLCBSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09OVEVYVCwgRUZGRUNUU19UT19TQ0hFRFVMRSwgRU5WSVJPTk1FTlQsIEZMQUdTLCBJbml0UGhhc2VTdGF0ZSwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVIsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRPckJvcnJvd1JlYWN0aXZlTFZpZXdDb25zdW1lciwgbWF5YmVSZXR1cm5SZWFjdGl2ZUxWaWV3Q29uc3VtZXIsIFJlYWN0aXZlTFZpZXdDb25zdW1lcn0gZnJvbSAnLi4vcmVhY3RpdmVfbHZpZXdfY29uc3VtZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUsIGlzUmVmcmVzaGluZ1ZpZXdzLCBsZWF2ZVZpZXcsIHNldEJpbmRpbmdJbmRleCwgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSwgc2V0SXNSZWZyZXNoaW5nVmlld3N9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Rmlyc3RMQ29udGFpbmVyLCBnZXROZXh0TENvbnRhaW5lcn0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgaXNDcmVhdGlvbk1vZGUsIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwsIG1hcmtWaWV3Rm9yUmVmcmVzaCwgcmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWwsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7ZXhlY3V0ZVRlbXBsYXRlLCBleGVjdXRlVmlld1F1ZXJ5Rm4sIGhhbmRsZUVycm9yLCBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzLCByZWZyZXNoQ29udGVudFF1ZXJpZXN9IGZyb20gJy4vc2hhcmVkJztcblxuLyoqXG4gKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIHdpbGwgcmVydW4gYmVmb3JlIHRocm93aW5nIGFuIGVycm9yLlxuICovXG5leHBvcnQgY29uc3QgTUFYSU1VTV9SRUZSRVNIX1JFUlVOUyA9IDEwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbChcbiAgICBsVmlldzogTFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlciA9IHRydWUsIG1vZGUgPSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCkge1xuICBjb25zdCBlbnZpcm9ubWVudCA9IGxWaWV3W0VOVklST05NRU5UXTtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gZW52aXJvbm1lbnQucmVuZGVyZXJGYWN0b3J5O1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gaW52b2tlIHJlbmRlcmVyIGZhY3RvcnkgZnVuY3Rpb25zIGluIHRoYXQgbW9kZVxuICAvLyB0byBhdm9pZCBhbnkgcG9zc2libGUgc2lkZS1lZmZlY3RzLlxuICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSAhIW5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4/LigpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3V2hpbGVEaXJ0eShsVmlldywgbW9kZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKG5vdGlmeUVycm9ySGFuZGxlcikge1xuICAgICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQ/LigpO1xuXG4gICAgICAvLyBPbmUgZmluYWwgZmx1c2ggb2YgdGhlIGVmZmVjdHMgcXVldWUgdG8gY2F0Y2ggYW55IGVmZmVjdHMgY3JlYXRlZCBpbiBgbmdBZnRlclZpZXdJbml0YCBvclxuICAgICAgLy8gb3RoZXIgcG9zdC1vcmRlciBob29rcy5cbiAgICAgIGVudmlyb25tZW50LmlubGluZUVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHkobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGNvbnN0IGxhc3RJc1JlZnJlc2hpbmdWaWV3c1ZhbHVlID0gaXNSZWZyZXNoaW5nVmlld3MoKTtcbiAgdHJ5IHtcbiAgICBzZXRJc1JlZnJlc2hpbmdWaWV3cyh0cnVlKTtcbiAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3KGxWaWV3LCBtb2RlKTtcblxuICAgIGxldCByZXRyaWVzID0gMDtcbiAgICAvLyBJZiBhZnRlciBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHRoaXMgdmlldyBzdGlsbCBuZWVkcyB0byBiZSByZWZyZXNoZWQgb3IgdGhlcmUgYXJlXG4gICAgLy8gZGVzY2VuZGFudHMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZCBkdWUgdG8gcmUtZGlydHlpbmcgZHVyaW5nIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAgLy8gcnVuLCBkZXRlY3QgY2hhbmdlcyBvbiB0aGUgdmlldyBhZ2Fpbi4gV2UgcnVuIGNoYW5nZSBkZXRlY3Rpb24gaW4gYFRhcmdldGVkYCBtb2RlIHRvIG9ubHlcbiAgICAvLyByZWZyZXNoIHZpZXdzIHdpdGggdGhlIGBSZWZyZXNoVmlld2AgZmxhZy5cbiAgICB3aGlsZSAocmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWwobFZpZXcpKSB7XG4gICAgICBpZiAocmV0cmllcyA9PT0gTUFYSU1VTV9SRUZSRVNIX1JFUlVOUykge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgJ0luZmluaXRlIGNoYW5nZSBkZXRlY3Rpb24gd2hpbGUgdHJ5aW5nIHRvIHJlZnJlc2ggdmlld3MuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVGhlcmUgbWF5IGJlIGNvbXBvbmVudHMgd2hpY2ggZWFjaCBjYXVzZSB0aGUgb3RoZXIgdG8gcmVxdWlyZSBhIHJlZnJlc2gsICcgK1xuICAgICAgICAgICAgICAgICAgICAnY2F1c2luZyBhbiBpbmZpbml0ZSBsb29wLicpO1xuICAgICAgfVxuICAgICAgcmV0cmllcysrO1xuICAgICAgLy8gRXZlbiBpZiB0aGlzIHZpZXcgaXMgZGV0YWNoZWQsIHdlIHN0aWxsIGRldGVjdCBjaGFuZ2VzIGluIHRhcmdldGVkIG1vZGUgYmVjYXVzZSB0aGlzIHdhc1xuICAgICAgLy8gdGhlIHJvb3Qgb2YgdGhlIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICAgICAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIC8vIHJlc3RvcmUgc3RhdGUgdG8gd2hhdCBpdCB3YXMgYmVmb3JlIGVudGVyaW5nIHRoaXMgY2hhbmdlIGRldGVjdGlvbiBsb29wXG4gICAgc2V0SXNSZWZyZXNoaW5nVmlld3MobGFzdElzUmVmcmVzaGluZ1ZpZXdzVmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsKGxWaWV3OiBMVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyID0gdHJ1ZSkge1xuICBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChsVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG5cbi8qKlxuICogRGlmZmVyZW50IG1vZGVzIG9mIHRyYXZlcnNpbmcgdGhlIGxvZ2ljYWwgdmlldyB0cmVlIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqXG4gKiBUaGUgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwgYWxnb3JpdGhtIHN3aXRjaGVzIGJldHdlZW4gdGhlc2UgbW9kZXMgYmFzZWQgb24gdmFyaW91c1xuICogY29uZGl0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQ2hhbmdlRGV0ZWN0aW9uTW9kZSB7XG4gIC8qKlxuICAgKiBJbiBgR2xvYmFsYCBtb2RlLCBgRGlydHlgIGFuZCBgQ2hlY2tBbHdheXNgIHZpZXdzIGFyZSByZWZyZXNoZWQgYXMgd2VsbCBhcyB2aWV3cyB3aXRoIHRoZVxuICAgKiBgUmVmcmVzaFZpZXdgIGZsYWcuXG4gICAqL1xuICBHbG9iYWwsXG4gIC8qKlxuICAgKiBJbiBgVGFyZ2V0ZWRgIG1vZGUsIG9ubHkgdmlld3Mgd2l0aCB0aGUgYFJlZnJlc2hWaWV3YCBmbGFnIG9yIHVwZGF0ZWQgc2lnbmFscyBhcmUgcmVmcmVzaGVkLlxuICAgKi9cbiAgVGFyZ2V0ZWQsXG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hWaWV3PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgY29udGV4dDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGlmICgoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkKSByZXR1cm47XG5cbiAgLy8gQ2hlY2sgbm8gY2hhbmdlcyBtb2RlIGlzIGEgZGV2IG9ubHkgbW9kZSB1c2VkIHRvIHZlcmlmeSB0aGF0IGJpbmRpbmdzIGhhdmUgbm90IGNoYW5nZWRcbiAgLy8gc2luY2UgdGhleSB3ZXJlIGFzc2lnbmVkLiBXZSBkbyBub3Qgd2FudCB0byBleGVjdXRlIGxpZmVjeWNsZSBob29rcyBpbiB0aGF0IG1vZGUuXG4gIGNvbnN0IGlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgPSBuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gICFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzICYmIGxWaWV3W0VOVklST05NRU5UXS5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG5cblxuICAvLyBTdGFydCBjb21wb25lbnQgcmVhY3RpdmUgY29udGV4dFxuICAvLyAtIFdlIG1pZ2h0IGFscmVhZHkgYmUgaW4gYSByZWFjdGl2ZSBjb250ZXh0IGlmIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiB0aGUgaG9zdC5cbiAgLy8gLSBXZSBtaWdodCBiZSBkZXNjZW5kaW5nIGludG8gYSB2aWV3IHRoYXQgbmVlZHMgYSBjb25zdW1lci5cbiAgZW50ZXJWaWV3KGxWaWV3KTtcbiAgbGV0IHByZXZDb25zdW1lcjogUmVhY3RpdmVOb2RlfG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudENvbnN1bWVyOiBSZWFjdGl2ZUxWaWV3Q29uc3VtZXJ8bnVsbCA9IG51bGw7XG4gIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyAmJiB2aWV3U2hvdWxkSGF2ZVJlYWN0aXZlQ29uc3VtZXIodFZpZXcpKSB7XG4gICAgY3VycmVudENvbnN1bWVyID0gZ2V0T3JCb3Jyb3dSZWFjdGl2ZUxWaWV3Q29uc3VtZXIobFZpZXcpO1xuICAgIHByZXZDb25zdW1lciA9IGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24oY3VycmVudENvbnN1bWVyKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG5cbiAgICBzZXRCaW5kaW5nSW5kZXgodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG5cbiAgICAvLyBleGVjdXRlIHByZS1vcmRlciBob29rcyAoT25Jbml0LCBPbkNoYW5nZXMsIERvQ2hlY2spXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpcnN0IG1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIHRoYXQgYXJlIGRlY2xhcmVkIGluIHRoaXMgbFZpZXcgYXMgbmVlZGluZyBhIHJlZnJlc2ggYXQgdGhlaXJcbiAgICAvLyBpbnNlcnRpb24gcG9pbnRzLiBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCB0aGUgc2l0dWF0aW9uIHdoZXJlIHRoZSB0ZW1wbGF0ZSBpcyBkZWZpbmVkIGluIHRoaXNcbiAgICAvLyBgTFZpZXdgIGJ1dCBpdHMgZGVjbGFyYXRpb24gYXBwZWFycyBhZnRlciB0aGUgaW5zZXJ0aW9uIGNvbXBvbmVudC5cbiAgICBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3KTtcbiAgICBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3LCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgY29udGVudCBob29rcyAoQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJDb250ZW50Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRDaGVja0hvb2tzID0gdFZpZXcuY29udGVudENoZWNrSG9va3M7XG4gICAgICAgIGlmIChjb250ZW50Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBjb250ZW50Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRIb29rcyA9IHRWaWV3LmNvbnRlbnRIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICAgICAgICAgICAgbFZpZXcsIGNvbnRlbnRIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXModFZpZXcsIGxWaWV3KTtcblxuICAgIC8vIFJlZnJlc2ggY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICBkZXRlY3RDaGFuZ2VzSW5DaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMsIENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsKTtcbiAgICB9XG5cbiAgICAvLyBWaWV3IHF1ZXJpZXMgbXVzdCBleGVjdXRlIGFmdGVyIHJlZnJlc2hpbmcgY2hpbGQgY29tcG9uZW50cyBiZWNhdXNlIGEgdGVtcGxhdGUgaW4gdGhpcyB2aWV3XG4gICAgLy8gY291bGQgYmUgaW5zZXJ0ZWQgaW4gYSBjaGlsZCBjb21wb25lbnQuIElmIHRoZSB2aWV3IHF1ZXJ5IGV4ZWN1dGVzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRcbiAgICAvLyByZWZyZXNoLCB0aGUgdGVtcGxhdGUgbWlnaHQgbm90IHlldCBiZSBpbnNlcnRlZC5cbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFJlbmRlckZsYWdzLlVwZGF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIHZpZXcgaG9va3MgKEFmdGVyVmlld0luaXQsIEFmdGVyVmlld0NoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCB2aWV3Q2hlY2tIb29rcyA9IHRWaWV3LnZpZXdDaGVja0hvb2tzO1xuICAgICAgICBpZiAodmlld0NoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgdmlld0NoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2aWV3SG9va3MgPSB0Vmlldy52aWV3SG9va3M7XG4gICAgICAgIGlmICh2aWV3SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHZpZXdIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzID09PSB0cnVlKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIG9ubHkgZmxpcCB0aGUgZmxhZyBvbiBzdWNjZXNzZnVsIGByZWZyZXNoVmlld2Agb25seVxuICAgICAgLy8gRG9uJ3QgZG8gdGhpcyBpbiBgZmluYWxseWAgYmxvY2suXG4gICAgICAvLyBJZiB3ZSBkaWQgdGhpcyBpbiBgZmluYWxseWAgYmxvY2sgdGhlbiBhbiBleGNlcHRpb24gY291bGQgYmxvY2sgdGhlIGV4ZWN1dGlvbiBvZiBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgd2hpY2ggaW4gdHVybiB3b3VsZCBiZSB1bmFibGUgdG8gaW5zZXJ0IHRoZW1zZWx2ZXMgaW50byB0aGUgc3R5bGluZyBsaW5rZWRcbiAgICAgIC8vIGxpc3QuIFRoZSByZXN1bHQgb2YgdGhpcyB3b3VsZCBiZSB0aGF0IGlmIHRoZSBleGNlcHRpb24gd291bGQgbm90IGJlIHRocm93IG9uIHN1YnNlcXVlbnQgQ0RcbiAgICAgIC8vIHRoZSBzdHlsaW5nIHdvdWxkIGJlIHVuYWJsZSB0byBwcm9jZXNzIGl0IGRhdGEgYW5kIHJlZmxlY3QgdG8gdGhlIERPTS5cbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFNjaGVkdWxlIGFueSBlZmZlY3RzIHRoYXQgYXJlIHdhaXRpbmcgb24gdGhlIHVwZGF0ZSBwYXNzIG9mIHRoaXMgdmlldy5cbiAgICBpZiAobFZpZXdbRUZGRUNUU19UT19TQ0hFRFVMRV0pIHtcbiAgICAgIGZvciAoY29uc3Qgbm90aWZ5RWZmZWN0IG9mIGxWaWV3W0VGRkVDVFNfVE9fU0NIRURVTEVdKSB7XG4gICAgICAgIG5vdGlmeUVmZmVjdCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBPbmNlIHRoZXkndmUgYmVlbiBydW4sIHdlIGNhbiBkcm9wIHRoZSBhcnJheS5cbiAgICAgIGxWaWV3W0VGRkVDVFNfVE9fU0NIRURVTEVdID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBEbyBub3QgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIHdoZW4gcnVubmluZyBpbiBjaGVjayBubyBjaGFuZ2VzIG1vZGUuIFdlIGRvbid0IHdhbnQgY29tcG9uZW50c1xuICAgIC8vIHRvIGJlaGF2ZSBkaWZmZXJlbnRseSBkZXBlbmRpbmcgb24gd2hldGhlciBjaGVjayBubyBjaGFuZ2VzIGlzIGVuYWJsZWQgb3Igbm90LiBGb3IgZXhhbXBsZTpcbiAgICAvLyBNYXJraW5nIGFuIE9uUHVzaCBjb21wb25lbnQgYXMgZGlydHkgZnJvbSB3aXRoaW4gdGhlIGBuZ0FmdGVyVmlld0luaXRgIGhvb2sgaW4gb3JkZXIgdG9cbiAgICAvLyByZWZyZXNoIGEgYE5nQ2xhc3NgIGJpbmRpbmcgc2hvdWxkIHdvcmsuIElmIHdlIHdvdWxkIHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBpbiB0aGUgY2hlY2tcbiAgICAvLyBubyBjaGFuZ2VzIGN5Y2xlLCB0aGUgY29tcG9uZW50IHdvdWxkIGJlIG5vdCBiZSBkaXJ0eSBmb3IgdGhlIG5leHQgdXBkYXRlIHBhc3MuIFRoaXMgd291bGRcbiAgICAvLyBiZSBkaWZmZXJlbnQgaW4gcHJvZHVjdGlvbiBtb2RlIHdoZXJlIHRoZSBjb21wb25lbnQgZGlydHkgc3RhdGUgaXMgbm90IHJlc2V0LlxuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElmIHJlZnJlc2hpbmcgYSB2aWV3IGNhdXNlcyBhbiBlcnJvciwgd2UgbmVlZCB0byByZW1hcmsgdGhlIGFuY2VzdG9ycyBhcyBuZWVkaW5nIHRyYXZlcnNhbFxuICAgIC8vIGJlY2F1c2UgdGhlIGVycm9yIG1pZ2h0IGhhdmUgY2F1c2VkIGEgc2l0dWF0aW9uIHdoZXJlIHZpZXdzIGJlbG93IHRoZSBjdXJyZW50IGxvY2F0aW9uIGFyZVxuICAgIC8vIGRpcnR5IGJ1dCB3aWxsIGJlIHVucmVhY2hhYmxlIGJlY2F1c2UgdGhlIFwiaGFzIGRpcnR5IGNoaWxkcmVuXCIgZmxhZyBpbiB0aGUgYW5jZXN0b3JzIGhhcyBiZWVuXG4gICAgLy8gY2xlYXJlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBhbmQgd2UgZmFpbGVkIHRvIHJ1biB0byBjb21wbGV0aW9uLlxuXG4gICAgbWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbChsVmlldyk7XG4gICAgdGhyb3cgZTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoY3VycmVudENvbnN1bWVyICE9PSBudWxsKSB7XG4gICAgICBjb25zdW1lckFmdGVyQ29tcHV0YXRpb24oY3VycmVudENvbnN1bWVyLCBwcmV2Q29uc3VtZXIpO1xuICAgICAgbWF5YmVSZXR1cm5SZWFjdGl2ZUxWaWV3Q29uc3VtZXIoY3VycmVudENvbnN1bWVyKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgaWYgdGhlIHZpZXcgc2hvdWxkIGdldCBpdHMgb3duIHJlYWN0aXZlIGNvbnN1bWVyIG5vZGUuXG4gKlxuICogSW4gdGhlIGN1cnJlbnQgZGVzaWduLCBhbGwgZW1iZWRkZWQgdmlld3Mgc2hhcmUgYSBjb25zdW1lciB3aXRoIHRoZSBjb21wb25lbnQgdmlldy4gVGhpcyBhbGxvd3NcbiAqIHVzIHRvIHJlZnJlc2ggYXQgdGhlIGNvbXBvbmVudCBsZXZlbCByYXRoZXIgdGhhbiBhdCBhIHBlci12aWV3IGxldmVsLiBJbiBhZGRpdGlvbiwgcm9vdCB2aWV3cyBnZXRcbiAqIHRoZWlyIG93biByZWFjdGl2ZSBub2RlIGJlY2F1c2Ugcm9vdCBjb21wb25lbnQgd2lsbCBoYXZlIGEgaG9zdCB2aWV3IHRoYXQgZXhlY3V0ZXMgdGhlXG4gKiBjb21wb25lbnQncyBob3N0IGJpbmRpbmdzLiBUaGlzIG5lZWRzIHRvIGJlIHRyYWNrZWQgaW4gYSBjb25zdW1lciBhcyB3ZWxsLlxuICpcbiAqIFRvIGdldCBhIG1vcmUgZ3JhbnVsYXIgY2hhbmdlIGRldGVjdGlvbiB0aGFuIHBlci1jb21wb25lbnQsIGFsbCB3ZSB3b3VsZCBqdXN0IG5lZWQgdG8gdXBkYXRlIHRoZVxuICogY29uZGl0aW9uIGhlcmUgc28gdGhhdCBhIGdpdmVuIHZpZXcgZ2V0cyBhIHJlYWN0aXZlIGNvbnN1bWVyIHdoaWNoIGNhbiBiZWNvbWUgZGlydHkgaW5kZXBlbmRlbnRseVxuICogZnJvbSBpdHMgcGFyZW50IGNvbXBvbmVudC4gRm9yIGV4YW1wbGUgZW1iZWRkZWQgdmlld3MgZm9yIHNpZ25hbCBjb21wb25lbnRzIGNvdWxkIGJlIGNyZWF0ZWQgd2l0aFxuICogYSBuZXcgdHlwZSBcIlNpZ25hbEVtYmVkZGVkVmlld1wiIGFuZCB0aGUgY29uZGl0aW9uIGhlcmUgd291bGRuJ3QgZXZlbiBuZWVkIHVwZGF0aW5nIGluIG9yZGVyIHRvXG4gKiBnZXQgZ3JhbnVsYXIgcGVyLXZpZXcgY2hhbmdlIGRldGVjdGlvbiBmb3Igc2lnbmFsIGNvbXBvbmVudHMuXG4gKi9cbmZ1bmN0aW9uIHZpZXdTaG91bGRIYXZlUmVhY3RpdmVDb25zdW1lcih0VmlldzogVFZpZXcpIHtcbiAgcmV0dXJuIHRWaWV3LnR5cGUgIT09IFRWaWV3VHlwZS5FbWJlZGRlZDtcbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZBdHRhY2hlZChlbWJlZGRlZExWaWV3LCBtb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrIHRyYW5zcGxhbnRlZCB2aWV3cyBhcyBuZWVkaW5nIHRvIGJlIHJlZnJlc2hlZCBhdCB0aGVpciBpbnNlcnRpb24gcG9pbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IG1heSBoYXZlIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqL1xuZnVuY3Rpb24gbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgaWYgKCEobENvbnRhaW5lcltGTEFHU10gJiBMQ29udGFpbmVyRmxhZ3MuSGFzVHJhbnNwbGFudGVkVmlld3MpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IG1vdmVkVmlld3MgPSBsQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW92ZWRWaWV3cywgJ1RyYW5zcGxhbnRlZCBWaWV3IGZsYWdzIHNldCBidXQgbWlzc2luZyBNT1ZFRF9WSUVXUycpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW92ZWRWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0hO1xuICAgICAgY29uc3QgaW5zZXJ0aW9uTENvbnRhaW5lciA9IG1vdmVkTFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG4gICAgICBtYXJrVmlld0ZvclJlZnJlc2gobW92ZWRMVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZWN0cyBjaGFuZ2VzIGluIGEgY29tcG9uZW50IGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsXG4gKiBxdWVyaWVzLCBldGMuIGlmIGl0IGlzIENoZWNrQWx3YXlzLCBPblB1c2ggYW5kIERpcnR5LCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkNvbXBvbmVudChcbiAgICBob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGNvbXBvbmVudFZpZXcsIG1vZGUpO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHZpZXcgYXMgcGFydCBvZiBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbC5cbiAqXG4gKiBJZiB0aGUgdmlldyBpcyBkZXRhY2hlZCwgbm8gYWRkaXRpb25hbCB0cmF2ZXJzYWwgaGFwcGVucy5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGlmICghdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3RvcihsVmlldykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgbW9kZSk7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgdmlldyBhcyBwYXJ0IG9mIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsLlxuICpcbiAqIFRoZSB2aWV3IGlzIHJlZnJlc2hlZCBpZjpcbiAqIC0gSWYgdGhlIHZpZXcgaXMgQ2hlY2tBbHdheXMgb3IgRGlydHkgYW5kIENoYW5nZURldGVjdGlvbk1vZGUgaXMgYEdsb2JhbGBcbiAqIC0gSWYgdGhlIHZpZXcgaGFzIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWdcbiAqXG4gKiBUaGUgdmlldyBpcyBub3QgcmVmcmVzaGVkLCBidXQgZGVzY2VuZGFudHMgYXJlIHRyYXZlcnNlZCBpbiBgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZGAgaWYgdGhlXG4gKiB2aWV3IEhhc0NoaWxkVmlld3NUb1JlZnJlc2ggZmxhZyBpcyBzZXQuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGNvbnN0IGlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgPSBuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGNvbnN0IGNvbnN1bWVyID0gbFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdO1xuXG4gIC8vIFJlZnJlc2ggQ2hlY2tBbHdheXMgdmlld3MgaW4gR2xvYmFsIG1vZGUuXG4gIGxldCBzaG91bGRSZWZyZXNoVmlldzogYm9vbGVhbiA9XG4gICAgICAhIShtb2RlID09PSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCAmJiBmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuXG4gIC8vIFJlZnJlc2ggRGlydHkgdmlld3MgaW4gR2xvYmFsIG1vZGUsIGFzIGxvbmcgYXMgd2UncmUgbm90IGluIGNoZWNrTm9DaGFuZ2VzLlxuICAvLyBDaGVja05vQ2hhbmdlcyBuZXZlciB3b3JrZWQgd2l0aCBgT25QdXNoYCBjb21wb25lbnRzIGJlY2F1c2UgdGhlIGBEaXJ0eWAgZmxhZyB3YXNcbiAgLy8gY2xlYXJlZCBiZWZvcmUgY2hlY2tOb0NoYW5nZXMgcmFuLiBCZWNhdXNlIHRoZXJlIGlzIG5vdyBhIGxvb3AgZm9yIHRvIGNoZWNrIGZvclxuICAvLyBiYWNrd2FyZHMgdmlld3MsIGl0IGdpdmVzIGFuIG9wcG9ydHVuaXR5IGZvciBgT25QdXNoYCBjb21wb25lbnRzIHRvIGJlIG1hcmtlZCBgRGlydHlgXG4gIC8vIGJlZm9yZSB0aGUgQ2hlY2tOb0NoYW5nZXMgcGFzcy4gV2UgZG9uJ3Qgd2FudCBleGlzdGluZyBlcnJvcnMgdGhhdCBhcmUgaGlkZGVuIGJ5IHRoZVxuICAvLyBjdXJyZW50IENoZWNrTm9DaGFuZ2VzIGJ1ZyB0byBzdXJmYWNlIHdoZW4gbWFraW5nIHVucmVsYXRlZCBjaGFuZ2VzLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoXG4gICAgICBmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkgJiYgbW9kZSA9PT0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwgJiYgIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpO1xuXG4gIC8vIEFsd2F5cyByZWZyZXNoIHZpZXdzIG1hcmtlZCBmb3IgcmVmcmVzaCwgcmVnYXJkbGVzcyBvZiBtb2RlLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoZmxhZ3MgJiBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3KTtcblxuICAvLyBSZWZyZXNoIHZpZXdzIHdoZW4gdGhleSBoYXZlIGEgZGlydHkgcmVhY3RpdmUgY29uc3VtZXIsIHJlZ2FyZGxlc3Mgb2YgbW9kZS5cbiAgc2hvdWxkUmVmcmVzaFZpZXcgfHw9ICEhKGNvbnN1bWVyPy5kaXJ0eSAmJiBjb25zdW1lclBvbGxQcm9kdWNlcnNGb3JDaGFuZ2UoY29uc3VtZXIpKTtcblxuICAvLyBNYXJrIHRoZSBGbGFncyBhbmQgYFJlYWN0aXZlTm9kZWAgYXMgbm90IGRpcnR5IGJlZm9yZSByZWZyZXNoaW5nIHRoZSBjb21wb25lbnQsIHNvIHRoYXQgdGhleVxuICAvLyBjYW4gYmUgcmUtZGlydGllZCBkdXJpbmcgdGhlIHJlZnJlc2ggcHJvY2Vzcy5cbiAgaWYgKGNvbnN1bWVyKSB7XG4gICAgY29uc3VtZXIuZGlydHkgPSBmYWxzZTtcbiAgfVxuICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2ggfCBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3KTtcblxuICBpZiAoc2hvdWxkUmVmcmVzaFZpZXcpIHtcbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBsVmlld1tDT05URVhUXSk7XG4gIH0gZWxzZSBpZiAoZmxhZ3MgJiBMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2gpIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3LCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzLCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKHVwZGF0ZSBtb2RlKS4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhcbiAgICBob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSwgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Db21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldLCBtb2RlKTtcbiAgfVxufVxuIl19