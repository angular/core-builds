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
import { enterView, isInCheckNoChangesMode, leaveView, setBindingIndex, setIsInCheckNoChangesMode } from '../state';
import { getFirstLContainer, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, isCreationMode, markAncestorsForTraversal, markViewForRefresh, requiresRefreshOrTraversal, resetPreOrderHookFlags, viewAttachedToChangeDetector } from '../util/view_utils';
import { executeTemplate, executeViewQueryFn, handleError, processHostBindingOpCodes, refreshContentQueries } from './shared';
/**
 * The maximum number of times the change detection traversal will rerun before throwing an error.
 */
const MAXIMUM_REFRESH_RERUNS = 100;
export function detectChangesInternal(lView, notifyErrorHandler = true) {
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
    detectChangesInView(lView, 0 /* ChangeDetectionMode.Global */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLDhCQUE4QixFQUFlLE1BQU0sa0NBQWtDLENBQUM7QUFFbkosT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlGLE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxlQUFlLEVBQUUsV0FBVyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUcsT0FBTyxFQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFxQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsS0FBSyxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3BMLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsRUFBd0IsTUFBTSw0QkFBNEIsQ0FBQztBQUNySSxPQUFPLEVBQUMsU0FBUyxFQUFFLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEgsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDbkYsT0FBTyxFQUFDLHdCQUF3QixFQUFFLGNBQWMsRUFBRSx5QkFBeUIsRUFBRSxrQkFBa0IsRUFB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QUFvRTtBQUNwRSxTQUFTLDhCQUE4QixDQUNuQyxTQUFnQixFQUFFLFVBQW9CLEVBQUUsSUFBeUI7SUFDbkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzQyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNELENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29uc3VtZXJBZnRlckNvbXB1dGF0aW9uLCBjb25zdW1lckJlZm9yZUNvbXB1dGF0aW9uLCBjb25zdW1lclBvbGxQcm9kdWNlcnNGb3JDaGFuZ2UsIFJlYWN0aXZlTm9kZX0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL3NpZ25hbHMnO1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lcn0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIExDb250YWluZXJGbGFncywgTU9WRURfVklFV1N9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGUsIFJlbmRlckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05URVhULCBFRkZFQ1RTX1RPX1NDSEVEVUxFLCBFTlZJUk9OTUVOVCwgRkxBR1MsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUiwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldE9yQm9ycm93UmVhY3RpdmVMVmlld0NvbnN1bWVyLCBtYXliZVJldHVyblJlYWN0aXZlTFZpZXdDb25zdW1lciwgUmVhY3RpdmVMVmlld0NvbnN1bWVyfSBmcm9tICcuLi9yZWFjdGl2ZV9sdmlld19jb25zdW1lcic7XG5pbXBvcnQge2VudGVyVmlldywgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSwgbGVhdmVWaWV3LCBzZXRCaW5kaW5nSW5kZXgsIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Rmlyc3RMQ29udGFpbmVyLCBnZXROZXh0TENvbnRhaW5lcn0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgaXNDcmVhdGlvbk1vZGUsIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwsIG1hcmtWaWV3Rm9yUmVmcmVzaCwgcmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWwsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7ZXhlY3V0ZVRlbXBsYXRlLCBleGVjdXRlVmlld1F1ZXJ5Rm4sIGhhbmRsZUVycm9yLCBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzLCByZWZyZXNoQ29udGVudFF1ZXJpZXN9IGZyb20gJy4vc2hhcmVkJztcblxuLyoqXG4gKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIHdpbGwgcmVydW4gYmVmb3JlIHRocm93aW5nIGFuIGVycm9yLlxuICovXG5jb25zdCBNQVhJTVVNX1JFRlJFU0hfUkVSVU5TID0gMTAwO1xuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGxWaWV3OiBMVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyID0gdHJ1ZSkge1xuICBjb25zdCBlbnZpcm9ubWVudCA9IGxWaWV3W0VOVklST05NRU5UXTtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gZW52aXJvbm1lbnQucmVuZGVyZXJGYWN0b3J5O1xuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGVudmlyb25tZW50LmFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyO1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gaW52b2tlIHJlbmRlcmVyIGZhY3RvcnkgZnVuY3Rpb25zIGluIHRoYXQgbW9kZVxuICAvLyB0byBhdm9pZCBhbnkgcG9zc2libGUgc2lkZS1lZmZlY3RzLlxuICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSAhIW5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4/LigpO1xuICAgIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyPy5iZWdpbigpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3V2hpbGVEaXJ0eShsVmlldyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKG5vdGlmeUVycm9ySGFuZGxlcikge1xuICAgICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQ/LigpO1xuXG4gICAgICAvLyBPbmUgZmluYWwgZmx1c2ggb2YgdGhlIGVmZmVjdHMgcXVldWUgdG8gY2F0Y2ggYW55IGVmZmVjdHMgY3JlYXRlZCBpbiBgbmdBZnRlclZpZXdJbml0YCBvclxuICAgICAgLy8gb3RoZXIgcG9zdC1vcmRlciBob29rcy5cbiAgICAgIGVudmlyb25tZW50LmlubGluZUVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcblxuICAgICAgLy8gSW52b2tlIGFsbCBjYWxsYmFja3MgcmVnaXN0ZXJlZCB2aWEgYGFmdGVyKlJlbmRlcmAsIGlmIG5lZWRlZC5cbiAgICAgIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyPy5lbmQoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHkobFZpZXc6IExWaWV3KSB7XG4gIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsKTtcblxuICBsZXQgcmV0cmllcyA9IDA7XG4gIC8vIElmIGFmdGVyIHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiwgdGhpcyB2aWV3IHN0aWxsIG5lZWRzIHRvIGJlIHJlZnJlc2hlZCBvciB0aGVyZSBhcmVcbiAgLy8gZGVzY2VuZGFudHMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZCBkdWUgdG8gcmUtZGlydHlpbmcgZHVyaW5nIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gIC8vIHJ1biwgZGV0ZWN0IGNoYW5nZXMgb24gdGhlIHZpZXcgYWdhaW4uIFdlIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIGluIGBUYXJnZXRlZGAgbW9kZSB0byBvbmx5XG4gIC8vIHJlZnJlc2ggdmlld3Mgd2l0aCB0aGUgYFJlZnJlc2hWaWV3YCBmbGFnLlxuICB3aGlsZSAocmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWwobFZpZXcpKSB7XG4gICAgaWYgKHJldHJpZXMgPT09IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAnSW5maW5pdGUgY2hhbmdlIGRldGVjdGlvbiB3aGlsZSB0cnlpbmcgdG8gcmVmcmVzaCB2aWV3cy4gJyArXG4gICAgICAgICAgICAgICAgICAnVGhlcmUgbWF5IGJlIGNvbXBvbmVudHMgd2hpY2ggZWFjaCBjYXVzZSB0aGUgb3RoZXIgdG8gcmVxdWlyZSBhIHJlZnJlc2gsICcgK1xuICAgICAgICAgICAgICAgICAgJ2NhdXNpbmcgYW4gaW5maW5pdGUgbG9vcC4nKTtcbiAgICB9XG4gICAgcmV0cmllcysrO1xuICAgIC8vIEV2ZW4gaWYgdGhpcyB2aWV3IGlzIGRldGFjaGVkLCB3ZSBzdGlsbCBkZXRlY3QgY2hhbmdlcyBpbiB0YXJnZXRlZCBtb2RlIGJlY2F1c2UgdGhpcyB3YXNcbiAgICAvLyB0aGUgcm9vdCBvZiB0aGUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWwobFZpZXc6IExWaWV3LCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlKSB7XG4gIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGxWaWV3LCBub3RpZnlFcnJvckhhbmRsZXIpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cblxuLyoqXG4gKiBEaWZmZXJlbnQgbW9kZXMgb2YgdHJhdmVyc2luZyB0aGUgbG9naWNhbCB2aWV3IHRyZWUgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICpcbiAqIFRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbCBhbGdvcml0aG0gc3dpdGNoZXMgYmV0d2VlbiB0aGVzZSBtb2RlcyBiYXNlZCBvbiB2YXJpb3VzXG4gKiBjb25kaXRpb25zLlxuICovXG5jb25zdCBlbnVtIENoYW5nZURldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogSW4gYEdsb2JhbGAgbW9kZSwgYERpcnR5YCBhbmQgYENoZWNrQWx3YXlzYCB2aWV3cyBhcmUgcmVmcmVzaGVkIGFzIHdlbGwgYXMgdmlld3Mgd2l0aCB0aGVcbiAgICogYFJlZnJlc2hWaWV3YCBmbGFnLlxuICAgKi9cbiAgR2xvYmFsLFxuICAvKipcbiAgICogSW4gYFRhcmdldGVkYCBtb2RlLCBvbmx5IHZpZXdzIHdpdGggdGhlIGBSZWZyZXNoVmlld2AgZmxhZyBhcmUgcmVmcmVzaGVkLlxuICAgKi9cbiAgVGFyZ2V0ZWQsXG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hWaWV3PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgY29udGV4dDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGlmICgoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkKSByZXR1cm47XG5cbiAgLy8gQ2hlY2sgbm8gY2hhbmdlcyBtb2RlIGlzIGEgZGV2IG9ubHkgbW9kZSB1c2VkIHRvIHZlcmlmeSB0aGF0IGJpbmRpbmdzIGhhdmUgbm90IGNoYW5nZWRcbiAgLy8gc2luY2UgdGhleSB3ZXJlIGFzc2lnbmVkLiBXZSBkbyBub3Qgd2FudCB0byBleGVjdXRlIGxpZmVjeWNsZSBob29rcyBpbiB0aGF0IG1vZGUuXG4gIGNvbnN0IGlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgPSBuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gICFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzICYmIGxWaWV3W0VOVklST05NRU5UXS5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG5cblxuICAvLyBTdGFydCBjb21wb25lbnQgcmVhY3RpdmUgY29udGV4dFxuICAvLyAtIFdlIG1pZ2h0IGFscmVhZHkgYmUgaW4gYSByZWFjdGl2ZSBjb250ZXh0IGlmIHRoaXMgaXMgYW4gZW1iZWRkZWQgdmlldyBvZiB0aGUgaG9zdC5cbiAgLy8gLSBXZSBtaWdodCBiZSBkZXNjZW5kaW5nIGludG8gYSB2aWV3IHRoYXQgbmVlZHMgYSBjb25zdW1lci5cbiAgZW50ZXJWaWV3KGxWaWV3KTtcbiAgbGV0IHByZXZDb25zdW1lcjogUmVhY3RpdmVOb2RlfG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudENvbnN1bWVyOiBSZWFjdGl2ZUxWaWV3Q29uc3VtZXJ8bnVsbCA9IG51bGw7XG4gIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyAmJiB2aWV3U2hvdWxkSGF2ZVJlYWN0aXZlQ29uc3VtZXIodFZpZXcpKSB7XG4gICAgY3VycmVudENvbnN1bWVyID0gZ2V0T3JCb3Jyb3dSZWFjdGl2ZUxWaWV3Q29uc3VtZXIobFZpZXcpO1xuICAgIHByZXZDb25zdW1lciA9IGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24oY3VycmVudENvbnN1bWVyKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG5cbiAgICBzZXRCaW5kaW5nSW5kZXgodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG5cbiAgICAvLyBleGVjdXRlIHByZS1vcmRlciBob29rcyAoT25Jbml0LCBPbkNoYW5nZXMsIERvQ2hlY2spXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpcnN0IG1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIHRoYXQgYXJlIGRlY2xhcmVkIGluIHRoaXMgbFZpZXcgYXMgbmVlZGluZyBhIHJlZnJlc2ggYXQgdGhlaXJcbiAgICAvLyBpbnNlcnRpb24gcG9pbnRzLiBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCB0aGUgc2l0dWF0aW9uIHdoZXJlIHRoZSB0ZW1wbGF0ZSBpcyBkZWZpbmVkIGluIHRoaXNcbiAgICAvLyBgTFZpZXdgIGJ1dCBpdHMgZGVjbGFyYXRpb24gYXBwZWFycyBhZnRlciB0aGUgaW5zZXJ0aW9uIGNvbXBvbmVudC5cbiAgICBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3KTtcbiAgICBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3LCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgY29udGVudCBob29rcyAoQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJDb250ZW50Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRDaGVja0hvb2tzID0gdFZpZXcuY29udGVudENoZWNrSG9va3M7XG4gICAgICAgIGlmIChjb250ZW50Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBjb250ZW50Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRIb29rcyA9IHRWaWV3LmNvbnRlbnRIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICAgICAgICAgICAgbFZpZXcsIGNvbnRlbnRIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXModFZpZXcsIGxWaWV3KTtcblxuICAgIC8vIFJlZnJlc2ggY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICBkZXRlY3RDaGFuZ2VzSW5DaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMsIENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsKTtcbiAgICB9XG5cbiAgICAvLyBWaWV3IHF1ZXJpZXMgbXVzdCBleGVjdXRlIGFmdGVyIHJlZnJlc2hpbmcgY2hpbGQgY29tcG9uZW50cyBiZWNhdXNlIGEgdGVtcGxhdGUgaW4gdGhpcyB2aWV3XG4gICAgLy8gY291bGQgYmUgaW5zZXJ0ZWQgaW4gYSBjaGlsZCBjb21wb25lbnQuIElmIHRoZSB2aWV3IHF1ZXJ5IGV4ZWN1dGVzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRcbiAgICAvLyByZWZyZXNoLCB0aGUgdGVtcGxhdGUgbWlnaHQgbm90IHlldCBiZSBpbnNlcnRlZC5cbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFJlbmRlckZsYWdzLlVwZGF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIHZpZXcgaG9va3MgKEFmdGVyVmlld0luaXQsIEFmdGVyVmlld0NoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCB2aWV3Q2hlY2tIb29rcyA9IHRWaWV3LnZpZXdDaGVja0hvb2tzO1xuICAgICAgICBpZiAodmlld0NoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgdmlld0NoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2aWV3SG9va3MgPSB0Vmlldy52aWV3SG9va3M7XG4gICAgICAgIGlmICh2aWV3SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHZpZXdIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzID09PSB0cnVlKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIG9ubHkgZmxpcCB0aGUgZmxhZyBvbiBzdWNjZXNzZnVsIGByZWZyZXNoVmlld2Agb25seVxuICAgICAgLy8gRG9uJ3QgZG8gdGhpcyBpbiBgZmluYWxseWAgYmxvY2suXG4gICAgICAvLyBJZiB3ZSBkaWQgdGhpcyBpbiBgZmluYWxseWAgYmxvY2sgdGhlbiBhbiBleGNlcHRpb24gY291bGQgYmxvY2sgdGhlIGV4ZWN1dGlvbiBvZiBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgd2hpY2ggaW4gdHVybiB3b3VsZCBiZSB1bmFibGUgdG8gaW5zZXJ0IHRoZW1zZWx2ZXMgaW50byB0aGUgc3R5bGluZyBsaW5rZWRcbiAgICAgIC8vIGxpc3QuIFRoZSByZXN1bHQgb2YgdGhpcyB3b3VsZCBiZSB0aGF0IGlmIHRoZSBleGNlcHRpb24gd291bGQgbm90IGJlIHRocm93IG9uIHN1YnNlcXVlbnQgQ0RcbiAgICAgIC8vIHRoZSBzdHlsaW5nIHdvdWxkIGJlIHVuYWJsZSB0byBwcm9jZXNzIGl0IGRhdGEgYW5kIHJlZmxlY3QgdG8gdGhlIERPTS5cbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFNjaGVkdWxlIGFueSBlZmZlY3RzIHRoYXQgYXJlIHdhaXRpbmcgb24gdGhlIHVwZGF0ZSBwYXNzIG9mIHRoaXMgdmlldy5cbiAgICBpZiAobFZpZXdbRUZGRUNUU19UT19TQ0hFRFVMRV0pIHtcbiAgICAgIGZvciAoY29uc3Qgbm90aWZ5RWZmZWN0IG9mIGxWaWV3W0VGRkVDVFNfVE9fU0NIRURVTEVdKSB7XG4gICAgICAgIG5vdGlmeUVmZmVjdCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBPbmNlIHRoZXkndmUgYmVlbiBydW4sIHdlIGNhbiBkcm9wIHRoZSBhcnJheS5cbiAgICAgIGxWaWV3W0VGRkVDVFNfVE9fU0NIRURVTEVdID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBEbyBub3QgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIHdoZW4gcnVubmluZyBpbiBjaGVjayBubyBjaGFuZ2VzIG1vZGUuIFdlIGRvbid0IHdhbnQgY29tcG9uZW50c1xuICAgIC8vIHRvIGJlaGF2ZSBkaWZmZXJlbnRseSBkZXBlbmRpbmcgb24gd2hldGhlciBjaGVjayBubyBjaGFuZ2VzIGlzIGVuYWJsZWQgb3Igbm90LiBGb3IgZXhhbXBsZTpcbiAgICAvLyBNYXJraW5nIGFuIE9uUHVzaCBjb21wb25lbnQgYXMgZGlydHkgZnJvbSB3aXRoaW4gdGhlIGBuZ0FmdGVyVmlld0luaXRgIGhvb2sgaW4gb3JkZXIgdG9cbiAgICAvLyByZWZyZXNoIGEgYE5nQ2xhc3NgIGJpbmRpbmcgc2hvdWxkIHdvcmsuIElmIHdlIHdvdWxkIHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBpbiB0aGUgY2hlY2tcbiAgICAvLyBubyBjaGFuZ2VzIGN5Y2xlLCB0aGUgY29tcG9uZW50IHdvdWxkIGJlIG5vdCBiZSBkaXJ0eSBmb3IgdGhlIG5leHQgdXBkYXRlIHBhc3MuIFRoaXMgd291bGRcbiAgICAvLyBiZSBkaWZmZXJlbnQgaW4gcHJvZHVjdGlvbiBtb2RlIHdoZXJlIHRoZSBjb21wb25lbnQgZGlydHkgc3RhdGUgaXMgbm90IHJlc2V0LlxuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElmIHJlZnJlc2hpbmcgYSB2aWV3IGNhdXNlcyBhbiBlcnJvciwgd2UgbmVlZCB0byByZW1hcmsgdGhlIGFuY2VzdG9ycyBhcyBuZWVkaW5nIHRyYXZlcnNhbFxuICAgIC8vIGJlY2F1c2UgdGhlIGVycm9yIG1pZ2h0IGhhdmUgY2F1c2VkIGEgc2l0dWF0aW9uIHdoZXJlIHZpZXdzIGJlbG93IHRoZSBjdXJyZW50IGxvY2F0aW9uIGFyZVxuICAgIC8vIGRpcnR5IGJ1dCB3aWxsIGJlIHVucmVhY2hhYmxlIGJlY2F1c2UgdGhlIFwiaGFzIGRpcnR5IGNoaWxkcmVuXCIgZmxhZyBpbiB0aGUgYW5jZXN0b3JzIGhhcyBiZWVuXG4gICAgLy8gY2xlYXJlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiBhbmQgd2UgZmFpbGVkIHRvIHJ1biB0byBjb21wbGV0aW9uLlxuXG4gICAgbWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbChsVmlldyk7XG4gICAgdGhyb3cgZTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoY3VycmVudENvbnN1bWVyICE9PSBudWxsKSB7XG4gICAgICBjb25zdW1lckFmdGVyQ29tcHV0YXRpb24oY3VycmVudENvbnN1bWVyLCBwcmV2Q29uc3VtZXIpO1xuICAgICAgbWF5YmVSZXR1cm5SZWFjdGl2ZUxWaWV3Q29uc3VtZXIoY3VycmVudENvbnN1bWVyKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgaWYgdGhlIHZpZXcgc2hvdWxkIGdldCBpdHMgb3duIHJlYWN0aXZlIGNvbnN1bWVyIG5vZGUuXG4gKlxuICogSW4gdGhlIGN1cnJlbnQgZGVzaWduLCBhbGwgZW1iZWRkZWQgdmlld3Mgc2hhcmUgYSBjb25zdW1lciB3aXRoIHRoZSBjb21wb25lbnQgdmlldy4gVGhpcyBhbGxvd3NcbiAqIHVzIHRvIHJlZnJlc2ggYXQgdGhlIGNvbXBvbmVudCBsZXZlbCByYXRoZXIgdGhhbiBhdCBhIHBlci12aWV3IGxldmVsLiBJbiBhZGRpdGlvbiwgcm9vdCB2aWV3cyBnZXRcbiAqIHRoZWlyIG93biByZWFjdGl2ZSBub2RlIGJlY2F1c2Ugcm9vdCBjb21wb25lbnQgd2lsbCBoYXZlIGEgaG9zdCB2aWV3IHRoYXQgZXhlY3V0ZXMgdGhlXG4gKiBjb21wb25lbnQncyBob3N0IGJpbmRpbmdzLiBUaGlzIG5lZWRzIHRvIGJlIHRyYWNrZWQgaW4gYSBjb25zdW1lciBhcyB3ZWxsLlxuICpcbiAqIFRvIGdldCBhIG1vcmUgZ3JhbnVsYXIgY2hhbmdlIGRldGVjdGlvbiB0aGFuIHBlci1jb21wb25lbnQsIGFsbCB3ZSB3b3VsZCBqdXN0IG5lZWQgdG8gdXBkYXRlIHRoZVxuICogY29uZGl0aW9uIGhlcmUgc28gdGhhdCBhIGdpdmVuIHZpZXcgZ2V0cyBhIHJlYWN0aXZlIGNvbnN1bWVyIHdoaWNoIGNhbiBiZWNvbWUgZGlydHkgaW5kZXBlbmRlbnRseVxuICogZnJvbSBpdHMgcGFyZW50IGNvbXBvbmVudC4gRm9yIGV4YW1wbGUgZW1iZWRkZWQgdmlld3MgZm9yIHNpZ25hbCBjb21wb25lbnRzIGNvdWxkIGJlIGNyZWF0ZWQgd2l0aFxuICogYSBuZXcgdHlwZSBcIlNpZ25hbEVtYmVkZGVkVmlld1wiIGFuZCB0aGUgY29uZGl0aW9uIGhlcmUgd291bGRuJ3QgZXZlbiBuZWVkIHVwZGF0aW5nIGluIG9yZGVyIHRvXG4gKiBnZXQgZ3JhbnVsYXIgcGVyLXZpZXcgY2hhbmdlIGRldGVjdGlvbiBmb3Igc2lnbmFsIGNvbXBvbmVudHMuXG4gKi9cbmZ1bmN0aW9uIHZpZXdTaG91bGRIYXZlUmVhY3RpdmVDb25zdW1lcih0VmlldzogVFZpZXcpIHtcbiAgcmV0dXJuIHRWaWV3LnR5cGUgIT09IFRWaWV3VHlwZS5FbWJlZGRlZDtcbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZBdHRhY2hlZChlbWJlZGRlZExWaWV3LCBtb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrIHRyYW5zcGxhbnRlZCB2aWV3cyBhcyBuZWVkaW5nIHRvIGJlIHJlZnJlc2hlZCBhdCB0aGVpciBpbnNlcnRpb24gcG9pbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IG1heSBoYXZlIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqL1xuZnVuY3Rpb24gbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgaWYgKCEobENvbnRhaW5lcltGTEFHU10gJiBMQ29udGFpbmVyRmxhZ3MuSGFzVHJhbnNwbGFudGVkVmlld3MpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IG1vdmVkVmlld3MgPSBsQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW92ZWRWaWV3cywgJ1RyYW5zcGxhbnRlZCBWaWV3IGZsYWdzIHNldCBidXQgbWlzc2luZyBNT1ZFRF9WSUVXUycpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW92ZWRWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0hO1xuICAgICAgY29uc3QgaW5zZXJ0aW9uTENvbnRhaW5lciA9IG1vdmVkTFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG4gICAgICBtYXJrVmlld0ZvclJlZnJlc2gobW92ZWRMVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZWN0cyBjaGFuZ2VzIGluIGEgY29tcG9uZW50IGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsXG4gKiBxdWVyaWVzLCBldGMuIGlmIGl0IGlzIENoZWNrQWx3YXlzLCBPblB1c2ggYW5kIERpcnR5LCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkNvbXBvbmVudChcbiAgICBob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGNvbXBvbmVudFZpZXcsIG1vZGUpO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHZpZXcgYXMgcGFydCBvZiBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbC5cbiAqXG4gKiBJZiB0aGUgdmlldyBpcyBkZXRhY2hlZCwgbm8gYWRkaXRpb25hbCB0cmF2ZXJzYWwgaGFwcGVucy5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGlmICghdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3RvcihsVmlldykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgbW9kZSk7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgdmlldyBhcyBwYXJ0IG9mIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsLlxuICpcbiAqIFRoZSB2aWV3IGlzIHJlZnJlc2hlZCBpZjpcbiAqIC0gSWYgdGhlIHZpZXcgaXMgQ2hlY2tBbHdheXMgb3IgRGlydHkgYW5kIENoYW5nZURldGVjdGlvbk1vZGUgaXMgYEdsb2JhbGBcbiAqIC0gSWYgdGhlIHZpZXcgaGFzIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWdcbiAqXG4gKiBUaGUgdmlldyBpcyBub3QgcmVmcmVzaGVkLCBidXQgZGVzY2VuZGFudHMgYXJlIHRyYXZlcnNlZCBpbiBgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZGAgaWYgdGhlXG4gKiB2aWV3IEhhc0NoaWxkVmlld3NUb1JlZnJlc2ggZmxhZyBpcyBzZXQuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGNvbnN0IGlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgPSBuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGNvbnN0IGNvbnN1bWVyID0gbFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdO1xuXG4gIC8vIFJlZnJlc2ggQ2hlY2tBbHdheXMgdmlld3MgaW4gR2xvYmFsIG1vZGUuXG4gIGxldCBzaG91bGRSZWZyZXNoVmlldzogYm9vbGVhbiA9XG4gICAgICAhIShtb2RlID09PSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCAmJiBmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuXG4gIC8vIFJlZnJlc2ggRGlydHkgdmlld3MgaW4gR2xvYmFsIG1vZGUsIGFzIGxvbmcgYXMgd2UncmUgbm90IGluIGNoZWNrTm9DaGFuZ2VzLlxuICAvLyBDaGVja05vQ2hhbmdlcyBuZXZlciB3b3JrZWQgd2l0aCBgT25QdXNoYCBjb21wb25lbnRzIGJlY2F1c2UgdGhlIGBEaXJ0eWAgZmxhZyB3YXNcbiAgLy8gY2xlYXJlZCBiZWZvcmUgY2hlY2tOb0NoYW5nZXMgcmFuLiBCZWNhdXNlIHRoZXJlIGlzIG5vdyBhIGxvb3AgZm9yIHRvIGNoZWNrIGZvclxuICAvLyBiYWNrd2FyZHMgdmlld3MsIGl0IGdpdmVzIGFuIG9wcG9ydHVuaXR5IGZvciBgT25QdXNoYCBjb21wb25lbnRzIHRvIGJlIG1hcmtlZCBgRGlydHlgXG4gIC8vIGJlZm9yZSB0aGUgQ2hlY2tOb0NoYW5nZXMgcGFzcy4gV2UgZG9uJ3Qgd2FudCBleGlzdGluZyBlcnJvcnMgdGhhdCBhcmUgaGlkZGVuIGJ5IHRoZVxuICAvLyBjdXJyZW50IENoZWNrTm9DaGFuZ2VzIGJ1ZyB0byBzdXJmYWNlIHdoZW4gbWFraW5nIHVucmVsYXRlZCBjaGFuZ2VzLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoXG4gICAgICBmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkgJiYgbW9kZSA9PT0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwgJiYgIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpO1xuXG4gIC8vIEFsd2F5cyByZWZyZXNoIHZpZXdzIG1hcmtlZCBmb3IgcmVmcmVzaCwgcmVnYXJkbGVzcyBvZiBtb2RlLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoZmxhZ3MgJiBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3KTtcblxuICAvLyBSZWZyZXNoIHZpZXdzIHdoZW4gdGhleSBoYXZlIGEgZGlydHkgcmVhY3RpdmUgY29uc3VtZXIsIHJlZ2FyZGxlc3Mgb2YgbW9kZS5cbiAgc2hvdWxkUmVmcmVzaFZpZXcgfHw9ICEhKGNvbnN1bWVyPy5kaXJ0eSAmJiBjb25zdW1lclBvbGxQcm9kdWNlcnNGb3JDaGFuZ2UoY29uc3VtZXIpKTtcblxuICAvLyBNYXJrIHRoZSBGbGFncyBhbmQgYFJlYWN0aXZlTm9kZWAgYXMgbm90IGRpcnR5IGJlZm9yZSByZWZyZXNoaW5nIHRoZSBjb21wb25lbnQsIHNvIHRoYXQgdGhleVxuICAvLyBjYW4gYmUgcmUtZGlydGllZCBkdXJpbmcgdGhlIHJlZnJlc2ggcHJvY2Vzcy5cbiAgaWYgKGNvbnN1bWVyKSB7XG4gICAgY29uc3VtZXIuZGlydHkgPSBmYWxzZTtcbiAgfVxuICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2ggfCBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3KTtcblxuICBpZiAoc2hvdWxkUmVmcmVzaFZpZXcpIHtcbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBsVmlld1tDT05URVhUXSk7XG4gIH0gZWxzZSBpZiAoZmxhZ3MgJiBMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2gpIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3LCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzLCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKHVwZGF0ZSBtb2RlKS4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhcbiAgICBob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSwgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Db21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldLCBtb2RlKTtcbiAgfVxufVxuIl19