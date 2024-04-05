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
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS } from '../interfaces/container';
import { CONTEXT, EFFECTS_TO_SCHEDULE, ENVIRONMENT, FLAGS, REACTIVE_TEMPLATE_CONSUMER, TVIEW } from '../interfaces/view';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLDhCQUE4QixFQUFlLE1BQU0sa0NBQWtDLENBQUM7QUFFbkosT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU3RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUYsT0FBTyxFQUFDLHVCQUF1QixFQUFjLGVBQWUsRUFBRSxXQUFXLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUUxRyxPQUFPLEVBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQTZDLDBCQUEwQixFQUFFLEtBQUssRUFBbUIsTUFBTSxvQkFBb0IsQ0FBQztBQUNwTCxPQUFPLEVBQUMsZ0NBQWdDLEVBQUUsZ0NBQWdDLEVBQXdCLE1BQU0sNEJBQTRCLENBQUM7QUFDckksT0FBTyxFQUFDLFNBQVMsRUFBRSxzQkFBc0IsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNKLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ25GLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxjQUFjLEVBQUUseUJBQXlCLEVBQUUsa0JBQWtCLEVBQUUsMEJBQTBCLEVBQUUsc0JBQXNCLEVBQUUsNEJB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LENBQ25DLFNBQWdCLEVBQUUsVUFBb0IsRUFBRSxJQUF5QjtJQUNuRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzNDLHdCQUF3QixDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0QsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb25zdW1lckFmdGVyQ29tcHV0YXRpb24sIGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24sIGNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZSwgUmVhY3RpdmVOb2RlfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtleGVjdXRlQ2hlY2tIb29rcywgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzLCBpbmNyZW1lbnRJbml0UGhhc2VGbGFnc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTENvbnRhaW5lckZsYWdzLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRFWFQsIEVGRkVDVFNfVE9fU0NIRURVTEUsIEVOVklST05NRU5ULCBGTEFHUywgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSLCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0T3JCb3Jyb3dSZWFjdGl2ZUxWaWV3Q29uc3VtZXIsIG1heWJlUmV0dXJuUmVhY3RpdmVMVmlld0NvbnN1bWVyLCBSZWFjdGl2ZUxWaWV3Q29uc3VtZXJ9IGZyb20gJy4uL3JlYWN0aXZlX2x2aWV3X2NvbnN1bWVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlLCBpc1JlZnJlc2hpbmdWaWV3cywgbGVhdmVWaWV3LCBzZXRCaW5kaW5nSW5kZXgsIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUsIHNldElzUmVmcmVzaGluZ1ZpZXdzfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEZpcnN0TENvbnRhaW5lciwgZ2V0TmV4dExDb250YWluZXJ9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGlzQ3JlYXRpb25Nb2RlLCBtYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsLCBtYXJrVmlld0ZvclJlZnJlc2gsIHJlcXVpcmVzUmVmcmVzaE9yVHJhdmVyc2FsLCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2V4ZWN1dGVUZW1wbGF0ZSwgZXhlY3V0ZVZpZXdRdWVyeUZuLCBoYW5kbGVFcnJvciwgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2RlcywgcmVmcmVzaENvbnRlbnRRdWVyaWVzfSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIHRpbWVzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbCB3aWxsIHJlcnVuIGJlZm9yZSB0aHJvd2luZyBhbiBlcnJvci5cbiAqL1xuZXhwb3J0IGNvbnN0IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMgPSAxMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlLCBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpIHtcbiAgY29uc3QgZW52aXJvbm1lbnQgPSBsVmlld1tFTlZJUk9OTUVOVF07XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGVudmlyb25tZW50LnJlbmRlcmVyRmFjdG9yeTtcblxuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGludm9rZSByZW5kZXJlciBmYWN0b3J5IGZ1bmN0aW9ucyBpbiB0aGF0IG1vZGVcbiAgLy8gdG8gYXZvaWQgYW55IHBvc3NpYmxlIHNpZGUtZWZmZWN0cy5cbiAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gISFuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luPy4oKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHkobFZpZXcsIG1vZGUpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChub3RpZnlFcnJvckhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kPy4oKTtcblxuICAgICAgLy8gT25lIGZpbmFsIGZsdXNoIG9mIHRoZSBlZmZlY3RzIHF1ZXVlIHRvIGNhdGNoIGFueSBlZmZlY3RzIGNyZWF0ZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgb3JcbiAgICAgIC8vIG90aGVyIHBvc3Qtb3JkZXIgaG9va3MuXG4gICAgICBlbnZpcm9ubWVudC5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXdXaGlsZURpcnR5KGxWaWV3OiBMVmlldywgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSkge1xuICBjb25zdCBsYXN0SXNSZWZyZXNoaW5nVmlld3NWYWx1ZSA9IGlzUmVmcmVzaGluZ1ZpZXdzKCk7XG4gIHRyeSB7XG4gICAgc2V0SXNSZWZyZXNoaW5nVmlld3ModHJ1ZSk7XG4gICAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgbW9kZSk7XG5cbiAgICBsZXQgcmV0cmllcyA9IDA7XG4gICAgLy8gSWYgYWZ0ZXIgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCB0aGlzIHZpZXcgc3RpbGwgbmVlZHMgdG8gYmUgcmVmcmVzaGVkIG9yIHRoZXJlIGFyZVxuICAgIC8vIGRlc2NlbmRhbnRzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSByZWZyZXNoZWQgZHVlIHRvIHJlLWRpcnR5aW5nIGR1cmluZyB0aGUgY2hhbmdlIGRldGVjdGlvblxuICAgIC8vIHJ1biwgZGV0ZWN0IGNoYW5nZXMgb24gdGhlIHZpZXcgYWdhaW4uIFdlIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIGluIGBUYXJnZXRlZGAgbW9kZSB0byBvbmx5XG4gICAgLy8gcmVmcmVzaCB2aWV3cyB3aXRoIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWcuXG4gICAgd2hpbGUgKHJlcXVpcmVzUmVmcmVzaE9yVHJhdmVyc2FsKGxWaWV3KSkge1xuICAgICAgaWYgKHJldHJpZXMgPT09IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5GSU5JVEVfQ0hBTkdFX0RFVEVDVElPTixcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgICdJbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIHdoaWxlIHRyeWluZyB0byByZWZyZXNoIHZpZXdzLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1RoZXJlIG1heSBiZSBjb21wb25lbnRzIHdoaWNoIGVhY2ggY2F1c2UgdGhlIG90aGVyIHRvIHJlcXVpcmUgYSByZWZyZXNoLCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2NhdXNpbmcgYW4gaW5maW5pdGUgbG9vcC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHJpZXMrKztcbiAgICAgIC8vIEV2ZW4gaWYgdGhpcyB2aWV3IGlzIGRldGFjaGVkLCB3ZSBzdGlsbCBkZXRlY3QgY2hhbmdlcyBpbiB0YXJnZXRlZCBtb2RlIGJlY2F1c2UgdGhpcyB3YXNcbiAgICAgIC8vIHRoZSByb290IG9mIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAgICAgIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZXN0b3JlIHN0YXRlIHRvIHdoYXQgaXQgd2FzIGJlZm9yZSBlbnRlcmluZyB0aGlzIGNoYW5nZSBkZXRlY3Rpb24gbG9vcFxuICAgIHNldElzUmVmcmVzaGluZ1ZpZXdzKGxhc3RJc1JlZnJlc2hpbmdWaWV3c1ZhbHVlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbChsVmlldzogTFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlciA9IHRydWUpIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwobFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlcik7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIERpZmZlcmVudCBtb2RlcyBvZiB0cmF2ZXJzaW5nIHRoZSBsb2dpY2FsIHZpZXcgdHJlZSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKlxuICogVGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIGFsZ29yaXRobSBzd2l0Y2hlcyBiZXR3ZWVuIHRoZXNlIG1vZGVzIGJhc2VkIG9uIHZhcmlvdXNcbiAqIGNvbmRpdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIENoYW5nZURldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogSW4gYEdsb2JhbGAgbW9kZSwgYERpcnR5YCBhbmQgYENoZWNrQWx3YXlzYCB2aWV3cyBhcmUgcmVmcmVzaGVkIGFzIHdlbGwgYXMgdmlld3Mgd2l0aCB0aGVcbiAgICogYFJlZnJlc2hWaWV3YCBmbGFnLlxuICAgKi9cbiAgR2xvYmFsLFxuICAvKipcbiAgICogSW4gYFRhcmdldGVkYCBtb2RlLCBvbmx5IHZpZXdzIHdpdGggdGhlIGBSZWZyZXNoVmlld2AgZmxhZyBvciB1cGRhdGVkIHNpZ25hbHMgYXJlIHJlZnJlc2hlZC5cbiAgICovXG4gIFRhcmdldGVkLFxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdXBkYXRlIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdXBkYXRlIG1vZGU7XG4gKiAtIGV4ZWN1dGluZyBob29rcztcbiAqIC0gcmVmcmVzaGluZyBxdWVyaWVzO1xuICogLSBzZXR0aW5nIGhvc3QgYmluZGluZ3M7XG4gKiAtIHJlZnJlc2hpbmcgY2hpbGQgKGVtYmVkZGVkIGFuZCBjb21wb25lbnQpIHZpZXdzLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgcmV0dXJuO1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gZXhlY3V0ZSBsaWZlY3ljbGUgaG9va3MgaW4gdGhhdCBtb2RlLlxuICBjb25zdCBpc0luQ2hlY2tOb0NoYW5nZXNQYXNzID0gbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICAhaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyAmJiBsVmlld1tFTlZJUk9OTUVOVF0uaW5saW5lRWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuXG5cbiAgLy8gU3RhcnQgY29tcG9uZW50IHJlYWN0aXZlIGNvbnRleHRcbiAgLy8gLSBXZSBtaWdodCBhbHJlYWR5IGJlIGluIGEgcmVhY3RpdmUgY29udGV4dCBpZiB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgdGhlIGhvc3QuXG4gIC8vIC0gV2UgbWlnaHQgYmUgZGVzY2VuZGluZyBpbnRvIGEgdmlldyB0aGF0IG5lZWRzIGEgY29uc3VtZXIuXG4gIGVudGVyVmlldyhsVmlldyk7XG4gIGxldCBwcmV2Q29uc3VtZXI6IFJlYWN0aXZlTm9kZXxudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRDb25zdW1lcjogUmVhY3RpdmVMVmlld0NvbnN1bWVyfG51bGwgPSBudWxsO1xuICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgJiYgdmlld1Nob3VsZEhhdmVSZWFjdGl2ZUNvbnN1bWVyKHRWaWV3KSkge1xuICAgIGN1cnJlbnRDb25zdW1lciA9IGdldE9yQm9ycm93UmVhY3RpdmVMVmlld0NvbnN1bWVyKGxWaWV3KTtcbiAgICBwcmV2Q29uc3VtZXIgPSBjb25zdW1lckJlZm9yZUNvbXB1dGF0aW9uKGN1cnJlbnRDb25zdW1lcik7XG4gIH1cblxuICB0cnkge1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuXG4gICAgc2V0QmluZGluZ0luZGV4KHRWaWV3LmJpbmRpbmdTdGFydEluZGV4KTtcbiAgICBpZiAodGVtcGxhdGVGbiAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlKHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICBjb25zdCBob29rc0luaXRQaGFzZUNvbXBsZXRlZCA9XG4gICAgICAgIChmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuXG4gICAgLy8gZXhlY3V0ZSBwcmUtb3JkZXIgaG9va3MgKE9uSW5pdCwgT25DaGFuZ2VzLCBEb0NoZWNrKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSB0Vmlldy5wcmVPcmRlckhvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaXJzdCBtYXJrIHRyYW5zcGxhbnRlZCB2aWV3cyB0aGF0IGFyZSBkZWNsYXJlZCBpbiB0aGlzIGxWaWV3IGFzIG5lZWRpbmcgYSByZWZyZXNoIGF0IHRoZWlyXG4gICAgLy8gaW5zZXJ0aW9uIHBvaW50cy4gVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgdGhlIHNpdHVhdGlvbiB3aGVyZSB0aGUgdGVtcGxhdGUgaXMgZGVmaW5lZCBpbiB0aGlzXG4gICAgLy8gYExWaWV3YCBidXQgaXRzIGRlY2xhcmF0aW9uIGFwcGVhcnMgYWZ0ZXIgdGhlIGluc2VydGlvbiBjb21wb25lbnQuXG4gICAgbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldyk7XG4gICAgZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpO1xuXG4gICAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gICAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIGNvbnRlbnQgaG9va3MgKEFmdGVyQ29udGVudEluaXQsIEFmdGVyQ29udGVudENoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjb250ZW50Q2hlY2tIb29rcyA9IHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzO1xuICAgICAgICBpZiAoY29udGVudENoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgY29udGVudENoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb250ZW50SG9va3MgPSB0Vmlldy5jb250ZW50SG9va3M7XG4gICAgICAgIGlmIChjb250ZW50SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MoXG4gICAgICAgICAgICAgIGxWaWV3LCBjb250ZW50SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzKHRWaWV3LCBsVmlldyk7XG5cbiAgICAvLyBSZWZyZXNoIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzLCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCk7XG4gICAgfVxuXG4gICAgLy8gVmlldyBxdWVyaWVzIG11c3QgZXhlY3V0ZSBhZnRlciByZWZyZXNoaW5nIGNoaWxkIGNvbXBvbmVudHMgYmVjYXVzZSBhIHRlbXBsYXRlIGluIHRoaXMgdmlld1xuICAgIC8vIGNvdWxkIGJlIGluc2VydGVkIGluIGEgY2hpbGQgY29tcG9uZW50LiBJZiB0aGUgdmlldyBxdWVyeSBleGVjdXRlcyBiZWZvcmUgY2hpbGQgY29tcG9uZW50XG4gICAgLy8gcmVmcmVzaCwgdGhlIHRlbXBsYXRlIG1pZ2h0IG5vdCB5ZXQgYmUgaW5zZXJ0ZWQuXG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbjxUPihSZW5kZXJGbGFncy5VcGRhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSB2aWV3IGhvb2tzIChBZnRlclZpZXdJbml0LCBBZnRlclZpZXdDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3Qgdmlld0NoZWNrSG9va3MgPSB0Vmlldy52aWV3Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKHZpZXdDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHZpZXdDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdmlld0hvb2tzID0gdFZpZXcudmlld0hvb2tzO1xuICAgICAgICBpZiAodmlld0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCB2aWV3SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9PT0gdHJ1ZSkge1xuICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgdGhhdCB3ZSBvbmx5IGZsaXAgdGhlIGZsYWcgb24gc3VjY2Vzc2Z1bCBgcmVmcmVzaFZpZXdgIG9ubHlcbiAgICAgIC8vIERvbid0IGRvIHRoaXMgaW4gYGZpbmFsbHlgIGJsb2NrLlxuICAgICAgLy8gSWYgd2UgZGlkIHRoaXMgaW4gYGZpbmFsbHlgIGJsb2NrIHRoZW4gYW4gZXhjZXB0aW9uIGNvdWxkIGJsb2NrIHRoZSBleGVjdXRpb24gb2Ygc3R5bGluZ1xuICAgICAgLy8gaW5zdHJ1Y3Rpb25zIHdoaWNoIGluIHR1cm4gd291bGQgYmUgdW5hYmxlIHRvIGluc2VydCB0aGVtc2VsdmVzIGludG8gdGhlIHN0eWxpbmcgbGlua2VkXG4gICAgICAvLyBsaXN0LiBUaGUgcmVzdWx0IG9mIHRoaXMgd291bGQgYmUgdGhhdCBpZiB0aGUgZXhjZXB0aW9uIHdvdWxkIG5vdCBiZSB0aHJvdyBvbiBzdWJzZXF1ZW50IENEXG4gICAgICAvLyB0aGUgc3R5bGluZyB3b3VsZCBiZSB1bmFibGUgdG8gcHJvY2VzcyBpdCBkYXRhIGFuZCByZWZsZWN0IHRvIHRoZSBET00uXG4gICAgICB0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBTY2hlZHVsZSBhbnkgZWZmZWN0cyB0aGF0IGFyZSB3YWl0aW5nIG9uIHRoZSB1cGRhdGUgcGFzcyBvZiB0aGlzIHZpZXcuXG4gICAgaWYgKGxWaWV3W0VGRkVDVFNfVE9fU0NIRURVTEVdKSB7XG4gICAgICBmb3IgKGNvbnN0IG5vdGlmeUVmZmVjdCBvZiBsVmlld1tFRkZFQ1RTX1RPX1NDSEVEVUxFXSkge1xuICAgICAgICBub3RpZnlFZmZlY3QoKTtcbiAgICAgIH1cblxuICAgICAgLy8gT25jZSB0aGV5J3ZlIGJlZW4gcnVuLCB3ZSBjYW4gZHJvcCB0aGUgYXJyYXkuXG4gICAgICBsVmlld1tFRkZFQ1RTX1RPX1NDSEVEVUxFXSA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZiByZWZyZXNoaW5nIGEgdmlldyBjYXVzZXMgYW4gZXJyb3IsIHdlIG5lZWQgdG8gcmVtYXJrIHRoZSBhbmNlc3RvcnMgYXMgbmVlZGluZyB0cmF2ZXJzYWxcbiAgICAvLyBiZWNhdXNlIHRoZSBlcnJvciBtaWdodCBoYXZlIGNhdXNlZCBhIHNpdHVhdGlvbiB3aGVyZSB2aWV3cyBiZWxvdyB0aGUgY3VycmVudCBsb2NhdGlvbiBhcmVcbiAgICAvLyBkaXJ0eSBidXQgd2lsbCBiZSB1bnJlYWNoYWJsZSBiZWNhdXNlIHRoZSBcImhhcyBkaXJ0eSBjaGlsZHJlblwiIGZsYWcgaW4gdGhlIGFuY2VzdG9ycyBoYXMgYmVlblxuICAgIC8vIGNsZWFyZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gYW5kIHdlIGZhaWxlZCB0byBydW4gdG8gY29tcGxldGlvbi5cblxuICAgIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwobFZpZXcpO1xuICAgIHRocm93IGU7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGN1cnJlbnRDb25zdW1lciAhPT0gbnVsbCkge1xuICAgICAgY29uc3VtZXJBZnRlckNvbXB1dGF0aW9uKGN1cnJlbnRDb25zdW1lciwgcHJldkNvbnN1bWVyKTtcbiAgICAgIG1heWJlUmV0dXJuUmVhY3RpdmVMVmlld0NvbnN1bWVyKGN1cnJlbnRDb25zdW1lcik7XG4gICAgfVxuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbi8qKlxuICogSW5kaWNhdGVzIGlmIHRoZSB2aWV3IHNob3VsZCBnZXQgaXRzIG93biByZWFjdGl2ZSBjb25zdW1lciBub2RlLlxuICpcbiAqIEluIHRoZSBjdXJyZW50IGRlc2lnbiwgYWxsIGVtYmVkZGVkIHZpZXdzIHNoYXJlIGEgY29uc3VtZXIgd2l0aCB0aGUgY29tcG9uZW50IHZpZXcuIFRoaXMgYWxsb3dzXG4gKiB1cyB0byByZWZyZXNoIGF0IHRoZSBjb21wb25lbnQgbGV2ZWwgcmF0aGVyIHRoYW4gYXQgYSBwZXItdmlldyBsZXZlbC4gSW4gYWRkaXRpb24sIHJvb3Qgdmlld3MgZ2V0XG4gKiB0aGVpciBvd24gcmVhY3RpdmUgbm9kZSBiZWNhdXNlIHJvb3QgY29tcG9uZW50IHdpbGwgaGF2ZSBhIGhvc3QgdmlldyB0aGF0IGV4ZWN1dGVzIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBiaW5kaW5ncy4gVGhpcyBuZWVkcyB0byBiZSB0cmFja2VkIGluIGEgY29uc3VtZXIgYXMgd2VsbC5cbiAqXG4gKiBUbyBnZXQgYSBtb3JlIGdyYW51bGFyIGNoYW5nZSBkZXRlY3Rpb24gdGhhbiBwZXItY29tcG9uZW50LCBhbGwgd2Ugd291bGQganVzdCBuZWVkIHRvIHVwZGF0ZSB0aGVcbiAqIGNvbmRpdGlvbiBoZXJlIHNvIHRoYXQgYSBnaXZlbiB2aWV3IGdldHMgYSByZWFjdGl2ZSBjb25zdW1lciB3aGljaCBjYW4gYmVjb21lIGRpcnR5IGluZGVwZW5kZW50bHlcbiAqIGZyb20gaXRzIHBhcmVudCBjb21wb25lbnQuIEZvciBleGFtcGxlIGVtYmVkZGVkIHZpZXdzIGZvciBzaWduYWwgY29tcG9uZW50cyBjb3VsZCBiZSBjcmVhdGVkIHdpdGhcbiAqIGEgbmV3IHR5cGUgXCJTaWduYWxFbWJlZGRlZFZpZXdcIiBhbmQgdGhlIGNvbmRpdGlvbiBoZXJlIHdvdWxkbid0IGV2ZW4gbmVlZCB1cGRhdGluZyBpbiBvcmRlciB0b1xuICogZ2V0IGdyYW51bGFyIHBlci12aWV3IGNoYW5nZSBkZXRlY3Rpb24gZm9yIHNpZ25hbCBjb21wb25lbnRzLlxuICovXG5mdW5jdGlvbiB2aWV3U2hvdWxkSGF2ZVJlYWN0aXZlQ29uc3VtZXIodFZpZXc6IFRWaWV3KSB7XG4gIHJldHVybiB0Vmlldy50eXBlICE9PSBUVmlld1R5cGUuRW1iZWRkZWQ7XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW0gYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkVtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQoZW1iZWRkZWRMVmlldywgbW9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWFyayB0cmFuc3BsYW50ZWQgdmlld3MgYXMgbmVlZGluZyB0byBiZSByZWZyZXNoZWQgYXQgdGhlaXIgYXR0YWNobWVudCBwb2ludHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgbWF5IGhhdmUgdHJhbnNwbGFudGVkIHZpZXdzLlxuICovXG5mdW5jdGlvbiBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBpZiAoIShsQ29udGFpbmVyW0ZMQUdTXSAmIExDb250YWluZXJGbGFncy5IYXNUcmFuc3BsYW50ZWRWaWV3cykpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFZpZXdzLCAnVHJhbnNwbGFudGVkIFZpZXcgZmxhZ3Mgc2V0IGJ1dCBtaXNzaW5nIE1PVkVEX1ZJRVdTJyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtb3ZlZExWaWV3ID0gbW92ZWRWaWV3c1tpXSE7XG4gICAgICBtYXJrVmlld0ZvclJlZnJlc2gobW92ZWRMVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZWN0cyBjaGFuZ2VzIGluIGEgY29tcG9uZW50IGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsXG4gKiBxdWVyaWVzLCBldGMuIGlmIGl0IGlzIENoZWNrQWx3YXlzLCBPblB1c2ggYW5kIERpcnR5LCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkNvbXBvbmVudChcbiAgICBob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGNvbXBvbmVudFZpZXcsIG1vZGUpO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHZpZXcgYXMgcGFydCBvZiBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbC5cbiAqXG4gKiBJZiB0aGUgdmlldyBpcyBkZXRhY2hlZCwgbm8gYWRkaXRpb25hbCB0cmF2ZXJzYWwgaGFwcGVucy5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGlmICghdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3RvcihsVmlldykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgbW9kZSk7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgdmlldyBhcyBwYXJ0IG9mIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsLlxuICpcbiAqIFRoZSB2aWV3IGlzIHJlZnJlc2hlZCBpZjpcbiAqIC0gSWYgdGhlIHZpZXcgaXMgQ2hlY2tBbHdheXMgb3IgRGlydHkgYW5kIENoYW5nZURldGVjdGlvbk1vZGUgaXMgYEdsb2JhbGBcbiAqIC0gSWYgdGhlIHZpZXcgaGFzIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWdcbiAqXG4gKiBUaGUgdmlldyBpcyBub3QgcmVmcmVzaGVkLCBidXQgZGVzY2VuZGFudHMgYXJlIHRyYXZlcnNlZCBpbiBgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZGAgaWYgdGhlXG4gKiB2aWV3IEhhc0NoaWxkVmlld3NUb1JlZnJlc2ggZmxhZyBpcyBzZXQuXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGNvbnN0IGlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgPSBuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGNvbnN0IGNvbnN1bWVyID0gbFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdO1xuXG4gIC8vIFJlZnJlc2ggQ2hlY2tBbHdheXMgdmlld3MgaW4gR2xvYmFsIG1vZGUuXG4gIGxldCBzaG91bGRSZWZyZXNoVmlldzogYm9vbGVhbiA9XG4gICAgICAhIShtb2RlID09PSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCAmJiBmbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuXG4gIC8vIFJlZnJlc2ggRGlydHkgdmlld3MgaW4gR2xvYmFsIG1vZGUsIGFzIGxvbmcgYXMgd2UncmUgbm90IGluIGNoZWNrTm9DaGFuZ2VzLlxuICAvLyBDaGVja05vQ2hhbmdlcyBuZXZlciB3b3JrZWQgd2l0aCBgT25QdXNoYCBjb21wb25lbnRzIGJlY2F1c2UgdGhlIGBEaXJ0eWAgZmxhZyB3YXNcbiAgLy8gY2xlYXJlZCBiZWZvcmUgY2hlY2tOb0NoYW5nZXMgcmFuLiBCZWNhdXNlIHRoZXJlIGlzIG5vdyBhIGxvb3AgZm9yIHRvIGNoZWNrIGZvclxuICAvLyBiYWNrd2FyZHMgdmlld3MsIGl0IGdpdmVzIGFuIG9wcG9ydHVuaXR5IGZvciBgT25QdXNoYCBjb21wb25lbnRzIHRvIGJlIG1hcmtlZCBgRGlydHlgXG4gIC8vIGJlZm9yZSB0aGUgQ2hlY2tOb0NoYW5nZXMgcGFzcy4gV2UgZG9uJ3Qgd2FudCBleGlzdGluZyBlcnJvcnMgdGhhdCBhcmUgaGlkZGVuIGJ5IHRoZVxuICAvLyBjdXJyZW50IENoZWNrTm9DaGFuZ2VzIGJ1ZyB0byBzdXJmYWNlIHdoZW4gbWFraW5nIHVucmVsYXRlZCBjaGFuZ2VzLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoXG4gICAgICBmbGFncyAmIExWaWV3RmxhZ3MuRGlydHkgJiYgbW9kZSA9PT0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwgJiYgIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpO1xuXG4gIC8vIEFsd2F5cyByZWZyZXNoIHZpZXdzIG1hcmtlZCBmb3IgcmVmcmVzaCwgcmVnYXJkbGVzcyBvZiBtb2RlLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoZmxhZ3MgJiBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3KTtcblxuICAvLyBSZWZyZXNoIHZpZXdzIHdoZW4gdGhleSBoYXZlIGEgZGlydHkgcmVhY3RpdmUgY29uc3VtZXIsIHJlZ2FyZGxlc3Mgb2YgbW9kZS5cbiAgc2hvdWxkUmVmcmVzaFZpZXcgfHw9ICEhKGNvbnN1bWVyPy5kaXJ0eSAmJiBjb25zdW1lclBvbGxQcm9kdWNlcnNGb3JDaGFuZ2UoY29uc3VtZXIpKTtcblxuICAvLyBNYXJrIHRoZSBGbGFncyBhbmQgYFJlYWN0aXZlTm9kZWAgYXMgbm90IGRpcnR5IGJlZm9yZSByZWZyZXNoaW5nIHRoZSBjb21wb25lbnQsIHNvIHRoYXQgdGhleVxuICAvLyBjYW4gYmUgcmUtZGlydGllZCBkdXJpbmcgdGhlIHJlZnJlc2ggcHJvY2Vzcy5cbiAgaWYgKGNvbnN1bWVyKSB7XG4gICAgY29uc3VtZXIuZGlydHkgPSBmYWxzZTtcbiAgfVxuICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2ggfCBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3KTtcblxuICBpZiAoc2hvdWxkUmVmcmVzaFZpZXcpIHtcbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBsVmlld1tDT05URVhUXSk7XG4gIH0gZWxzZSBpZiAoZmxhZ3MgJiBMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2gpIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5FbWJlZGRlZFZpZXdzKGxWaWV3LCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzLCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKHVwZGF0ZSBtb2RlKS4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhcbiAgICBob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSwgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Db21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldLCBtb2RlKTtcbiAgfVxufVxuIl19