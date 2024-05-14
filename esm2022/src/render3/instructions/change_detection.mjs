/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerAfterComputation, consumerBeforeComputation, consumerPollProducersForChange, } from '@angular/core/primitives/signals';
import { RuntimeError } from '../../errors';
import { assertDefined, assertEqual } from '../../util/assert';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS, } from '../interfaces/container';
import { CONTEXT, EFFECTS_TO_SCHEDULE, ENVIRONMENT, FLAGS, REACTIVE_TEMPLATE_CONSUMER, TVIEW, } from '../interfaces/view';
import { getOrBorrowReactiveLViewConsumer, maybeReturnReactiveLViewConsumer, } from '../reactive_lview_consumer';
import { CheckNoChangesMode, enterView, isExhaustiveCheckNoChanges, isInCheckNoChangesMode, isRefreshingViews, leaveView, setBindingIndex, setIsInCheckNoChangesMode, setIsRefreshingViews, } from '../state';
import { getFirstLContainer, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, isCreationMode, markAncestorsForTraversal, markViewForRefresh, requiresRefreshOrTraversal, resetPreOrderHookFlags, viewAttachedToChangeDetector, } from '../util/view_utils';
import { executeTemplate, executeViewQueryFn, handleError, processHostBindingOpCodes, refreshContentQueries, } from './shared';
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
export function checkNoChangesInternal(lView, mode, notifyErrorHandler = true) {
    setIsInCheckNoChangesMode(mode);
    try {
        detectChangesInternal(lView, notifyErrorHandler);
    }
    finally {
        setIsInCheckNoChangesMode(CheckNoChangesMode.Off);
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
        if (!isInCheckNoChangesPass) {
            // If refreshing a view causes an error, we need to remark the ancestors as needing traversal
            // because the error might have caused a situation where views below the current location are
            // dirty but will be unreachable because the "has dirty children" flag in the ancestors has been
            // cleared during change detection and we failed to run to completion.
            markAncestorsForTraversal(lView);
        }
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
 * Mark transplanted views as needing to be refreshed at their attachment points.
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
    shouldRefreshView ||= !!(flags & 64 /* LViewFlags.Dirty */ &&
        mode === 0 /* ChangeDetectionMode.Global */ &&
        !isInCheckNoChangesPass);
    // Always refresh views marked for refresh, regardless of mode.
    shouldRefreshView ||= !!(flags & 1024 /* LViewFlags.RefreshView */);
    // Refresh views when they have a dirty reactive consumer, regardless of mode.
    shouldRefreshView ||= !!(consumer?.dirty && consumerPollProducersForChange(consumer));
    shouldRefreshView ||= !!(ngDevMode && isExhaustiveCheckNoChanges());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLHdCQUF3QixFQUN4Qix5QkFBeUIsRUFDekIsOEJBQThCLEdBRS9CLE1BQU0sa0NBQWtDLENBQUM7QUFFMUMsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU3RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUYsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixlQUFlLEVBQ2YsV0FBVyxHQUNaLE1BQU0seUJBQXlCLENBQUM7QUFFakMsT0FBTyxFQUNMLE9BQU8sRUFDUCxtQkFBbUIsRUFDbkIsV0FBVyxFQUNYLEtBQUssRUFLTCwwQkFBMEIsRUFDMUIsS0FBSyxHQUdOLE1BQU0sb0JBQW9CLENBQUM7QUFDNUIsT0FBTyxFQUNMLGdDQUFnQyxFQUNoQyxnQ0FBZ0MsR0FFakMsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLFNBQVMsRUFDVCwwQkFBMEIsRUFDMUIsc0JBQXNCLEVBQ3RCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsZUFBZSxFQUNmLHlCQUF5QixFQUN6QixvQkFBb0IsR0FDckIsTUFBTSxVQUFVLENBQUM7QUFDbEIsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDbkYsT0FBTyxFQUNMLHdCQUF3QixFQUN4QixjQUFjLEVBQ2QseUJBQXlCLEVBQ3pCLGtC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UUFDbEUsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUNwQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN4Qiw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsVUFBVSx1Q0FBK0IsQ0FBQztRQUNsRixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFFRCxvRUFBb0U7QUFDcEUsU0FBUyw4QkFBOEIsQ0FDckMsU0FBZ0IsRUFDaEIsVUFBb0IsRUFDcEIsSUFBeUI7SUFFekIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzQyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNELENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIGNvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbixcbiAgY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbixcbiAgY29uc3VtZXJQb2xsUHJvZHVjZXJzRm9yQ2hhbmdlLFxuICBSZWFjdGl2ZU5vZGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXJ9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge1xuICBDT05UQUlORVJfSEVBREVSX09GRlNFVCxcbiAgTENvbnRhaW5lcixcbiAgTENvbnRhaW5lckZsYWdzLFxuICBNT1ZFRF9WSUVXUyxcbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1xuICBDT05URVhULFxuICBFRkZFQ1RTX1RPX1NDSEVEVUxFLFxuICBFTlZJUk9OTUVOVCxcbiAgRkxBR1MsXG4gIEluaXRQaGFzZVN0YXRlLFxuICBMVmlldyxcbiAgTFZpZXdGbGFncyxcbiAgUEFSRU5ULFxuICBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUixcbiAgVFZJRVcsXG4gIFRWaWV3LFxuICBUVmlld1R5cGUsXG59IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1xuICBnZXRPckJvcnJvd1JlYWN0aXZlTFZpZXdDb25zdW1lcixcbiAgbWF5YmVSZXR1cm5SZWFjdGl2ZUxWaWV3Q29uc3VtZXIsXG4gIFJlYWN0aXZlTFZpZXdDb25zdW1lcixcbn0gZnJvbSAnLi4vcmVhY3RpdmVfbHZpZXdfY29uc3VtZXInO1xuaW1wb3J0IHtcbiAgQ2hlY2tOb0NoYW5nZXNNb2RlLFxuICBlbnRlclZpZXcsXG4gIGlzRXhoYXVzdGl2ZUNoZWNrTm9DaGFuZ2VzLFxuICBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlLFxuICBpc1JlZnJlc2hpbmdWaWV3cyxcbiAgbGVhdmVWaWV3LFxuICBzZXRCaW5kaW5nSW5kZXgsXG4gIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUsXG4gIHNldElzUmVmcmVzaGluZ1ZpZXdzLFxufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEZpcnN0TENvbnRhaW5lciwgZ2V0TmV4dExDb250YWluZXJ9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtcbiAgZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LFxuICBpc0NyZWF0aW9uTW9kZSxcbiAgbWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbCxcbiAgbWFya1ZpZXdGb3JSZWZyZXNoLFxuICByZXF1aXJlc1JlZnJlc2hPclRyYXZlcnNhbCxcbiAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyxcbiAgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcixcbn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtcbiAgZXhlY3V0ZVRlbXBsYXRlLFxuICBleGVjdXRlVmlld1F1ZXJ5Rm4sXG4gIGhhbmRsZUVycm9yLFxuICBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzLFxuICByZWZyZXNoQ29udGVudFF1ZXJpZXMsXG59IGZyb20gJy4vc2hhcmVkJztcblxuLyoqXG4gKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIHdpbGwgcmVydW4gYmVmb3JlIHRocm93aW5nIGFuIGVycm9yLlxuICovXG5leHBvcnQgY29uc3QgTUFYSU1VTV9SRUZSRVNIX1JFUlVOUyA9IDEwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbChcbiAgbFZpZXc6IExWaWV3LFxuICBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlLFxuICBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwsXG4pIHtcbiAgY29uc3QgZW52aXJvbm1lbnQgPSBsVmlld1tFTlZJUk9OTUVOVF07XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGVudmlyb25tZW50LnJlbmRlcmVyRmFjdG9yeTtcblxuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGludm9rZSByZW5kZXJlciBmYWN0b3J5IGZ1bmN0aW9ucyBpbiB0aGF0IG1vZGVcbiAgLy8gdG8gYXZvaWQgYW55IHBvc3NpYmxlIHNpZGUtZWZmZWN0cy5cbiAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gISFuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luPy4oKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHkobFZpZXcsIG1vZGUpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChub3RpZnlFcnJvckhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kPy4oKTtcblxuICAgICAgLy8gT25lIGZpbmFsIGZsdXNoIG9mIHRoZSBlZmZlY3RzIHF1ZXVlIHRvIGNhdGNoIGFueSBlZmZlY3RzIGNyZWF0ZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgb3JcbiAgICAgIC8vIG90aGVyIHBvc3Qtb3JkZXIgaG9va3MuXG4gICAgICBlbnZpcm9ubWVudC5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXdXaGlsZURpcnR5KGxWaWV3OiBMVmlldywgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSkge1xuICBjb25zdCBsYXN0SXNSZWZyZXNoaW5nVmlld3NWYWx1ZSA9IGlzUmVmcmVzaGluZ1ZpZXdzKCk7XG4gIHRyeSB7XG4gICAgc2V0SXNSZWZyZXNoaW5nVmlld3ModHJ1ZSk7XG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgbW9kZSk7XG5cbiAgICBsZXQgcmV0cmllcyA9IDA7XG4gICAgLy8gSWYgYWZ0ZXIgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCB0aGlzIHZpZXcgc3RpbGwgbmVlZHMgdG8gYmUgcmVmcmVzaGVkIG9yIHRoZXJlIGFyZVxuICAgIC8vIGRlc2NlbmRhbnRzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSByZWZyZXNoZWQgZHVlIHRvIHJlLWRpcnR5aW5nIGR1cmluZyB0aGUgY2hhbmdlIGRldGVjdGlvblxuICAgIC8vIHJ1biwgZGV0ZWN0IGNoYW5nZXMgb24gdGhlIHZpZXcgYWdhaW4uIFdlIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIGluIGBUYXJnZXRlZGAgbW9kZSB0byBvbmx5XG4gICAgLy8gcmVmcmVzaCB2aWV3cyB3aXRoIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWcuXG4gICAgd2hpbGUgKHJlcXVpcmVzUmVmcmVzaE9yVHJhdmVyc2FsKGxWaWV3KSkge1xuICAgICAgaWYgKHJldHJpZXMgPT09IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnSW5maW5pdGUgY2hhbmdlIGRldGVjdGlvbiB3aGlsZSB0cnlpbmcgdG8gcmVmcmVzaCB2aWV3cy4gJyArXG4gICAgICAgICAgICAgICdUaGVyZSBtYXkgYmUgY29tcG9uZW50cyB3aGljaCBlYWNoIGNhdXNlIHRoZSBvdGhlciB0byByZXF1aXJlIGEgcmVmcmVzaCwgJyArXG4gICAgICAgICAgICAgICdjYXVzaW5nIGFuIGluZmluaXRlIGxvb3AuJyxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHJpZXMrKztcbiAgICAgIC8vIEV2ZW4gaWYgdGhpcyB2aWV3IGlzIGRldGFjaGVkLCB3ZSBzdGlsbCBkZXRlY3QgY2hhbmdlcyBpbiB0YXJnZXRlZCBtb2RlIGJlY2F1c2UgdGhpcyB3YXNcbiAgICAgIC8vIHRoZSByb290IG9mIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAgICAgIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZXN0b3JlIHN0YXRlIHRvIHdoYXQgaXQgd2FzIGJlZm9yZSBlbnRlcmluZyB0aGlzIGNoYW5nZSBkZXRlY3Rpb24gbG9vcFxuICAgIHNldElzUmVmcmVzaGluZ1ZpZXdzKGxhc3RJc1JlZnJlc2hpbmdWaWV3c1ZhbHVlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbChcbiAgbFZpZXc6IExWaWV3LFxuICBtb2RlOiBDaGVja05vQ2hhbmdlc01vZGUsXG4gIG5vdGlmeUVycm9ySGFuZGxlciA9IHRydWUsXG4pIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShtb2RlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwobFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlcik7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShDaGVja05vQ2hhbmdlc01vZGUuT2ZmKTtcbiAgfVxufVxuXG4vKipcbiAqIERpZmZlcmVudCBtb2RlcyBvZiB0cmF2ZXJzaW5nIHRoZSBsb2dpY2FsIHZpZXcgdHJlZSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKlxuICogVGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIGFsZ29yaXRobSBzd2l0Y2hlcyBiZXR3ZWVuIHRoZXNlIG1vZGVzIGJhc2VkIG9uIHZhcmlvdXNcbiAqIGNvbmRpdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIENoYW5nZURldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogSW4gYEdsb2JhbGAgbW9kZSwgYERpcnR5YCBhbmQgYENoZWNrQWx3YXlzYCB2aWV3cyBhcmUgcmVmcmVzaGVkIGFzIHdlbGwgYXMgdmlld3Mgd2l0aCB0aGVcbiAgICogYFJlZnJlc2hWaWV3YCBmbGFnLlxuICAgKi9cbiAgR2xvYmFsLFxuICAvKipcbiAgICogSW4gYFRhcmdldGVkYCBtb2RlLCBvbmx5IHZpZXdzIHdpdGggdGhlIGBSZWZyZXNoVmlld2AgZmxhZyBvciB1cGRhdGVkIHNpZ25hbHMgYXJlIHJlZnJlc2hlZC5cbiAgICovXG4gIFRhcmdldGVkLFxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdXBkYXRlIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdXBkYXRlIG1vZGU7XG4gKiAtIGV4ZWN1dGluZyBob29rcztcbiAqIC0gcmVmcmVzaGluZyBxdWVyaWVzO1xuICogLSBzZXR0aW5nIGhvc3QgYmluZGluZ3M7XG4gKiAtIHJlZnJlc2hpbmcgY2hpbGQgKGVtYmVkZGVkIGFuZCBjb21wb25lbnQpIHZpZXdzLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PiB8IG51bGwsXG4gIGNvbnRleHQ6IFQsXG4pIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgcmV0dXJuO1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gZXhlY3V0ZSBsaWZlY3ljbGUgaG9va3MgaW4gdGhhdCBtb2RlLlxuICBjb25zdCBpc0luQ2hlY2tOb0NoYW5nZXNQYXNzID0gbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICAhaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyAmJiBsVmlld1tFTlZJUk9OTUVOVF0uaW5saW5lRWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuXG4gIC8vIFN0YXJ0IGNvbXBvbmVudCByZWFjdGl2ZSBjb250ZXh0XG4gIC8vIC0gV2UgbWlnaHQgYWxyZWFkeSBiZSBpbiBhIHJlYWN0aXZlIGNvbnRleHQgaWYgdGhpcyBpcyBhbiBlbWJlZGRlZCB2aWV3IG9mIHRoZSBob3N0LlxuICAvLyAtIFdlIG1pZ2h0IGJlIGRlc2NlbmRpbmcgaW50byBhIHZpZXcgdGhhdCBuZWVkcyBhIGNvbnN1bWVyLlxuICBlbnRlclZpZXcobFZpZXcpO1xuICBsZXQgcHJldkNvbnN1bWVyOiBSZWFjdGl2ZU5vZGUgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRDb25zdW1lcjogUmVhY3RpdmVMVmlld0NvbnN1bWVyIHwgbnVsbCA9IG51bGw7XG4gIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyAmJiB2aWV3U2hvdWxkSGF2ZVJlYWN0aXZlQ29uc3VtZXIodFZpZXcpKSB7XG4gICAgY3VycmVudENvbnN1bWVyID0gZ2V0T3JCb3Jyb3dSZWFjdGl2ZUxWaWV3Q29uc3VtZXIobFZpZXcpO1xuICAgIHByZXZDb25zdW1lciA9IGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24oY3VycmVudENvbnN1bWVyKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG5cbiAgICBzZXRCaW5kaW5nSW5kZXgodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgIChmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuXG4gICAgLy8gZXhlY3V0ZSBwcmUtb3JkZXIgaG9va3MgKE9uSW5pdCwgT25DaGFuZ2VzLCBEb0NoZWNrKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSB0Vmlldy5wcmVPcmRlckhvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaXJzdCBtYXJrIHRyYW5zcGxhbnRlZCB2aWV3cyB0aGF0IGFyZSBkZWNsYXJlZCBpbiB0aGlzIGxWaWV3IGFzIG5lZWRpbmcgYSByZWZyZXNoIGF0IHRoZWlyXG4gICAgLy8gaW5zZXJ0aW9uIHBvaW50cy4gVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgdGhlIHNpdHVhdGlvbiB3aGVyZSB0aGUgdGVtcGxhdGUgaXMgZGVmaW5lZCBpbiB0aGlzXG4gICAgLy8gYExWaWV3YCBidXQgaXRzIGRlY2xhcmF0aW9uIGFwcGVhcnMgYWZ0ZXIgdGhlIGluc2VydGlvbiBjb21wb25lbnQuXG4gICAgbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldyk7XG4gICAgZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpO1xuXG4gICAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gICAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIGNvbnRlbnQgaG9va3MgKEFmdGVyQ29udGVudEluaXQsIEFmdGVyQ29udGVudENoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjb250ZW50Q2hlY2tIb29rcyA9IHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzO1xuICAgICAgICBpZiAoY29udGVudENoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgY29udGVudENoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb250ZW50SG9va3MgPSB0Vmlldy5jb250ZW50SG9va3M7XG4gICAgICAgIGlmIChjb250ZW50SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MoXG4gICAgICAgICAgICBsVmlldyxcbiAgICAgICAgICAgIGNvbnRlbnRIb29rcyxcbiAgICAgICAgICAgIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gU2NoZWR1bGUgYW55IGVmZmVjdHMgdGhhdCBhcmUgd2FpdGluZyBvbiB0aGUgdXBkYXRlIHBhc3Mgb2YgdGhpcyB2aWV3LlxuICAgIGlmIChsVmlld1tFRkZFQ1RTX1RPX1NDSEVEVUxFXSkge1xuICAgICAgZm9yIChjb25zdCBub3RpZnlFZmZlY3Qgb2YgbFZpZXdbRUZGRUNUU19UT19TQ0hFRFVMRV0pIHtcbiAgICAgICAgbm90aWZ5RWZmZWN0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uY2UgdGhleSd2ZSBiZWVuIHJ1biwgd2UgY2FuIGRyb3AgdGhlIGFycmF5LlxuICAgICAgbFZpZXdbRUZGRUNUU19UT19TQ0hFRFVMRV0gPSBudWxsO1xuICAgIH1cblxuICAgIC8vIERvIG5vdCByZXNldCB0aGUgZGlydHkgc3RhdGUgd2hlbiBydW5uaW5nIGluIGNoZWNrIG5vIGNoYW5nZXMgbW9kZS4gV2UgZG9uJ3Qgd2FudCBjb21wb25lbnRzXG4gICAgLy8gdG8gYmVoYXZlIGRpZmZlcmVudGx5IGRlcGVuZGluZyBvbiB3aGV0aGVyIGNoZWNrIG5vIGNoYW5nZXMgaXMgZW5hYmxlZCBvciBub3QuIEZvciBleGFtcGxlOlxuICAgIC8vIE1hcmtpbmcgYW4gT25QdXNoIGNvbXBvbmVudCBhcyBkaXJ0eSBmcm9tIHdpdGhpbiB0aGUgYG5nQWZ0ZXJWaWV3SW5pdGAgaG9vayBpbiBvcmRlciB0b1xuICAgIC8vIHJlZnJlc2ggYSBgTmdDbGFzc2AgYmluZGluZyBzaG91bGQgd29yay4gSWYgd2Ugd291bGQgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIGluIHRoZSBjaGVja1xuICAgIC8vIG5vIGNoYW5nZXMgY3ljbGUsIHRoZSBjb21wb25lbnQgd291bGQgYmUgbm90IGJlIGRpcnR5IGZvciB0aGUgbmV4dCB1cGRhdGUgcGFzcy4gVGhpcyB3b3VsZFxuICAgIC8vIGJlIGRpZmZlcmVudCBpbiBwcm9kdWN0aW9uIG1vZGUgd2hlcmUgdGhlIGNvbXBvbmVudCBkaXJ0eSBzdGF0ZSBpcyBub3QgcmVzZXQuXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICAvLyBJZiByZWZyZXNoaW5nIGEgdmlldyBjYXVzZXMgYW4gZXJyb3IsIHdlIG5lZWQgdG8gcmVtYXJrIHRoZSBhbmNlc3RvcnMgYXMgbmVlZGluZyB0cmF2ZXJzYWxcbiAgICAgIC8vIGJlY2F1c2UgdGhlIGVycm9yIG1pZ2h0IGhhdmUgY2F1c2VkIGEgc2l0dWF0aW9uIHdoZXJlIHZpZXdzIGJlbG93IHRoZSBjdXJyZW50IGxvY2F0aW9uIGFyZVxuICAgICAgLy8gZGlydHkgYnV0IHdpbGwgYmUgdW5yZWFjaGFibGUgYmVjYXVzZSB0aGUgXCJoYXMgZGlydHkgY2hpbGRyZW5cIiBmbGFnIGluIHRoZSBhbmNlc3RvcnMgaGFzIGJlZW5cbiAgICAgIC8vIGNsZWFyZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gYW5kIHdlIGZhaWxlZCB0byBydW4gdG8gY29tcGxldGlvbi5cbiAgICAgIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwobFZpZXcpO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChjdXJyZW50Q29uc3VtZXIgIT09IG51bGwpIHtcbiAgICAgIGNvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbihjdXJyZW50Q29uc3VtZXIsIHByZXZDb25zdW1lcik7XG4gICAgICBtYXliZVJldHVyblJlYWN0aXZlTFZpZXdDb25zdW1lcihjdXJyZW50Q29uc3VtZXIpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcoKTtcbiAgfVxufVxuXG4vKipcbiAqIEluZGljYXRlcyBpZiB0aGUgdmlldyBzaG91bGQgZ2V0IGl0cyBvd24gcmVhY3RpdmUgY29uc3VtZXIgbm9kZS5cbiAqXG4gKiBJbiB0aGUgY3VycmVudCBkZXNpZ24sIGFsbCBlbWJlZGRlZCB2aWV3cyBzaGFyZSBhIGNvbnN1bWVyIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3LiBUaGlzIGFsbG93c1xuICogdXMgdG8gcmVmcmVzaCBhdCB0aGUgY29tcG9uZW50IGxldmVsIHJhdGhlciB0aGFuIGF0IGEgcGVyLXZpZXcgbGV2ZWwuIEluIGFkZGl0aW9uLCByb290IHZpZXdzIGdldFxuICogdGhlaXIgb3duIHJlYWN0aXZlIG5vZGUgYmVjYXVzZSByb290IGNvbXBvbmVudCB3aWxsIGhhdmUgYSBob3N0IHZpZXcgdGhhdCBleGVjdXRlcyB0aGVcbiAqIGNvbXBvbmVudCdzIGhvc3QgYmluZGluZ3MuIFRoaXMgbmVlZHMgdG8gYmUgdHJhY2tlZCBpbiBhIGNvbnN1bWVyIGFzIHdlbGwuXG4gKlxuICogVG8gZ2V0IGEgbW9yZSBncmFudWxhciBjaGFuZ2UgZGV0ZWN0aW9uIHRoYW4gcGVyLWNvbXBvbmVudCwgYWxsIHdlIHdvdWxkIGp1c3QgbmVlZCB0byB1cGRhdGUgdGhlXG4gKiBjb25kaXRpb24gaGVyZSBzbyB0aGF0IGEgZ2l2ZW4gdmlldyBnZXRzIGEgcmVhY3RpdmUgY29uc3VtZXIgd2hpY2ggY2FuIGJlY29tZSBkaXJ0eSBpbmRlcGVuZGVudGx5XG4gKiBmcm9tIGl0cyBwYXJlbnQgY29tcG9uZW50LiBGb3IgZXhhbXBsZSBlbWJlZGRlZCB2aWV3cyBmb3Igc2lnbmFsIGNvbXBvbmVudHMgY291bGQgYmUgY3JlYXRlZCB3aXRoXG4gKiBhIG5ldyB0eXBlIFwiU2lnbmFsRW1iZWRkZWRWaWV3XCIgYW5kIHRoZSBjb25kaXRpb24gaGVyZSB3b3VsZG4ndCBldmVuIG5lZWQgdXBkYXRpbmcgaW4gb3JkZXIgdG9cbiAqIGdldCBncmFudWxhciBwZXItdmlldyBjaGFuZ2UgZGV0ZWN0aW9uIGZvciBzaWduYWwgY29tcG9uZW50cy5cbiAqL1xuZnVuY3Rpb24gdmlld1Nob3VsZEhhdmVSZWFjdGl2ZUNvbnN1bWVyKHRWaWV3OiBUVmlldykge1xuICByZXR1cm4gdFZpZXcudHlwZSAhPT0gVFZpZXdUeXBlLkVtYmVkZGVkO1xufVxuXG4vKipcbiAqIEdvZXMgb3ZlciBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzXG4gKiB0aGVtIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldywgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSkge1xuICBmb3IgKFxuICAgIGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTtcbiAgICBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKVxuICApIHtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGVtYmVkZGVkTFZpZXcsIG1vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIGFzIG5lZWRpbmcgdG8gYmUgcmVmcmVzaGVkIGF0IHRoZWlyIGF0dGFjaG1lbnQgcG9pbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IG1heSBoYXZlIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqL1xuZnVuY3Rpb24gbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldzogTFZpZXcpIHtcbiAgZm9yIChcbiAgICBsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7XG4gICAgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcilcbiAgKSB7XG4gICAgaWYgKCEobENvbnRhaW5lcltGTEFHU10gJiBMQ29udGFpbmVyRmxhZ3MuSGFzVHJhbnNwbGFudGVkVmlld3MpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IG1vdmVkVmlld3MgPSBsQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW92ZWRWaWV3cywgJ1RyYW5zcGxhbnRlZCBWaWV3IGZsYWdzIHNldCBidXQgbWlzc2luZyBNT1ZFRF9WSUVXUycpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW92ZWRWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0hO1xuICAgICAgbWFya1ZpZXdGb3JSZWZyZXNoKG1vdmVkTFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgY2hhbmdlcyBpbiBhIGNvbXBvbmVudCBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLFxuICogcXVlcmllcywgZXRjLiBpZiBpdCBpcyBDaGVja0Fsd2F5cywgT25QdXNoIGFuZCBEaXJ0eSwgZXRjLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRIb3N0SWR4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Db21wb25lbnQoXG4gIGhvc3RMVmlldzogTFZpZXcsXG4gIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcixcbiAgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSxcbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQoY29tcG9uZW50VmlldywgbW9kZSk7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgdmlldyBhcyBwYXJ0IG9mIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsLlxuICpcbiAqIElmIHRoZSB2aWV3IGlzIGRldGFjaGVkLCBubyBhZGRpdGlvbmFsIHRyYXZlcnNhbCBoYXBwZW5zLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZBdHRhY2hlZChsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgaWYgKCF2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGxWaWV3KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBkZXRlY3RDaGFuZ2VzSW5WaWV3KGxWaWV3LCBtb2RlKTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSB2aWV3IGFzIHBhcnQgb2YgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwuXG4gKlxuICogVGhlIHZpZXcgaXMgcmVmcmVzaGVkIGlmOlxuICogLSBJZiB0aGUgdmlldyBpcyBDaGVja0Fsd2F5cyBvciBEaXJ0eSBhbmQgQ2hhbmdlRGV0ZWN0aW9uTW9kZSBpcyBgR2xvYmFsYFxuICogLSBJZiB0aGUgdmlldyBoYXMgdGhlIGBSZWZyZXNoVmlld2AgZmxhZ1xuICpcbiAqIFRoZSB2aWV3IGlzIG5vdCByZWZyZXNoZWQsIGJ1dCBkZXNjZW5kYW50cyBhcmUgdHJhdmVyc2VkIGluIGBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkYCBpZiB0aGVcbiAqIHZpZXcgSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCBmbGFnIGlzIHNldC5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgY29uc3QgaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyA9IG5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgY29uc3QgY29uc3VtZXIgPSBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl07XG5cbiAgLy8gUmVmcmVzaCBDaGVja0Fsd2F5cyB2aWV3cyBpbiBHbG9iYWwgbW9kZS5cbiAgbGV0IHNob3VsZFJlZnJlc2hWaWV3OiBib29sZWFuID0gISEoXG4gICAgbW9kZSA9PT0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwgJiYgZmxhZ3MgJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzXG4gICk7XG5cbiAgLy8gUmVmcmVzaCBEaXJ0eSB2aWV3cyBpbiBHbG9iYWwgbW9kZSwgYXMgbG9uZyBhcyB3ZSdyZSBub3QgaW4gY2hlY2tOb0NoYW5nZXMuXG4gIC8vIENoZWNrTm9DaGFuZ2VzIG5ldmVyIHdvcmtlZCB3aXRoIGBPblB1c2hgIGNvbXBvbmVudHMgYmVjYXVzZSB0aGUgYERpcnR5YCBmbGFnIHdhc1xuICAvLyBjbGVhcmVkIGJlZm9yZSBjaGVja05vQ2hhbmdlcyByYW4uIEJlY2F1c2UgdGhlcmUgaXMgbm93IGEgbG9vcCBmb3IgdG8gY2hlY2sgZm9yXG4gIC8vIGJhY2t3YXJkcyB2aWV3cywgaXQgZ2l2ZXMgYW4gb3Bwb3J0dW5pdHkgZm9yIGBPblB1c2hgIGNvbXBvbmVudHMgdG8gYmUgbWFya2VkIGBEaXJ0eWBcbiAgLy8gYmVmb3JlIHRoZSBDaGVja05vQ2hhbmdlcyBwYXNzLiBXZSBkb24ndCB3YW50IGV4aXN0aW5nIGVycm9ycyB0aGF0IGFyZSBoaWRkZW4gYnkgdGhlXG4gIC8vIGN1cnJlbnQgQ2hlY2tOb0NoYW5nZXMgYnVnIHRvIHN1cmZhY2Ugd2hlbiBtYWtpbmcgdW5yZWxhdGVkIGNoYW5nZXMuXG4gIHNob3VsZFJlZnJlc2hWaWV3IHx8PSAhIShcbiAgICBmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkgJiZcbiAgICBtb2RlID09PSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCAmJlxuICAgICFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzXG4gICk7XG5cbiAgLy8gQWx3YXlzIHJlZnJlc2ggdmlld3MgbWFya2VkIGZvciByZWZyZXNoLCByZWdhcmRsZXNzIG9mIG1vZGUuXG4gIHNob3VsZFJlZnJlc2hWaWV3IHx8PSAhIShmbGFncyAmIExWaWV3RmxhZ3MuUmVmcmVzaFZpZXcpO1xuXG4gIC8vIFJlZnJlc2ggdmlld3Mgd2hlbiB0aGV5IGhhdmUgYSBkaXJ0eSByZWFjdGl2ZSBjb25zdW1lciwgcmVnYXJkbGVzcyBvZiBtb2RlLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoY29uc3VtZXI/LmRpcnR5ICYmIGNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZShjb25zdW1lcikpO1xuXG4gIHNob3VsZFJlZnJlc2hWaWV3IHx8PSAhIShuZ0Rldk1vZGUgJiYgaXNFeGhhdXN0aXZlQ2hlY2tOb0NoYW5nZXMoKSk7XG5cbiAgLy8gTWFyayB0aGUgRmxhZ3MgYW5kIGBSZWFjdGl2ZU5vZGVgIGFzIG5vdCBkaXJ0eSBiZWZvcmUgcmVmcmVzaGluZyB0aGUgY29tcG9uZW50LCBzbyB0aGF0IHRoZXlcbiAgLy8gY2FuIGJlIHJlLWRpcnRpZWQgZHVyaW5nIHRoZSByZWZyZXNoIHByb2Nlc3MuXG4gIGlmIChjb25zdW1lcikge1xuICAgIGNvbnN1bWVyLmRpcnR5ID0gZmFsc2U7XG4gIH1cbiAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5IYXNDaGlsZFZpZXdzVG9SZWZyZXNoIHwgTFZpZXdGbGFncy5SZWZyZXNoVmlldyk7XG5cbiAgaWYgKHNob3VsZFJlZnJlc2hWaWV3KSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgbFZpZXdbQ09OVEVYVF0pO1xuICB9IGVsc2UgaWYgKGZsYWdzICYgTFZpZXdGbGFncy5IYXNDaGlsZFZpZXdzVG9SZWZyZXNoKSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3ICh1cGRhdGUgbW9kZSkuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5DaGlsZENvbXBvbmVudHMoXG4gIGhvc3RMVmlldzogTFZpZXcsXG4gIGNvbXBvbmVudHM6IG51bWJlcltdLFxuICBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlLFxuKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGRldGVjdENoYW5nZXNJbkNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0sIG1vZGUpO1xuICB9XG59XG4iXX0=