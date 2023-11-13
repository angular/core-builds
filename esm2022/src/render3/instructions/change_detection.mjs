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
import { CONTAINER_HEADER_OFFSET, LContainerFlags, MOVED_VIEWS } from '../interfaces/container';
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
        lContainer[FLAGS] &= ~LContainerFlags.HasChildViewsToRefresh;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLDhCQUE4QixFQUFlLE1BQU0sa0NBQWtDLENBQUM7QUFFbkosT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlGLE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxlQUFlLEVBQUUsV0FBVyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUcsT0FBTyxFQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFxQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsS0FBSyxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3BMLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsRUFBd0IsTUFBTSw0QkFBNEIsQ0FBQztBQUNySSxPQUFPLEVBQUMsU0FBUyxFQUFFLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEgsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDbkYsT0FBTyxFQUFD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SUFBeUI7SUFDbkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsd0JBQXdCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMxRDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb25zdW1lckFmdGVyQ29tcHV0YXRpb24sIGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24sIGNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZSwgUmVhY3RpdmVOb2RlfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtleGVjdXRlQ2hlY2tIb29rcywgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzLCBpbmNyZW1lbnRJbml0UGhhc2VGbGFnc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTENvbnRhaW5lckZsYWdzLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRFWFQsIEVGRkVDVFNfVE9fU0NIRURVTEUsIEVOVklST05NRU5ULCBGTEFHUywgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSLCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0T3JCb3Jyb3dSZWFjdGl2ZUxWaWV3Q29uc3VtZXIsIG1heWJlUmV0dXJuUmVhY3RpdmVMVmlld0NvbnN1bWVyLCBSZWFjdGl2ZUxWaWV3Q29uc3VtZXJ9IGZyb20gJy4uL3JlYWN0aXZlX2x2aWV3X2NvbnN1bWVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlLCBsZWF2ZVZpZXcsIHNldEJpbmRpbmdJbmRleCwgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRGaXJzdExDb250YWluZXIsIGdldE5leHRMQ29udGFpbmVyfSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBpc0NyZWF0aW9uTW9kZSwgbWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbCwgbWFya1ZpZXdGb3JSZWZyZXNoLCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2V4ZWN1dGVUZW1wbGF0ZSwgZXhlY3V0ZVZpZXdRdWVyeUZuLCBoYW5kbGVFcnJvciwgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2RlcywgcmVmcmVzaENvbnRlbnRRdWVyaWVzfSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIHRpbWVzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbCB3aWxsIHJlcnVuIGJlZm9yZSB0aHJvd2luZyBhbiBlcnJvci5cbiAqL1xuY29uc3QgTUFYSU1VTV9SRUZSRVNIX1JFUlVOUyA9IDEwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCwgbm90aWZ5RXJyb3JIYW5kbGVyID0gdHJ1ZSkge1xuICBjb25zdCBlbnZpcm9ubWVudCA9IGxWaWV3W0VOVklST05NRU5UXTtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gZW52aXJvbm1lbnQucmVuZGVyZXJGYWN0b3J5O1xuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGVudmlyb25tZW50LmFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyO1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gaW52b2tlIHJlbmRlcmVyIGZhY3RvcnkgZnVuY3Rpb25zIGluIHRoYXQgbW9kZVxuICAvLyB0byBhdm9pZCBhbnkgcG9zc2libGUgc2lkZS1lZmZlY3RzLlxuICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSAhIW5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4/LigpO1xuICAgIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyPy5iZWdpbigpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBjb250ZXh0KTtcbiAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3V2hpbGVEaXJ0eShsVmlldyk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKG5vdGlmeUVycm9ySGFuZGxlcikge1xuICAgICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQ/LigpO1xuXG4gICAgICAvLyBPbmUgZmluYWwgZmx1c2ggb2YgdGhlIGVmZmVjdHMgcXVldWUgdG8gY2F0Y2ggYW55IGVmZmVjdHMgY3JlYXRlZCBpbiBgbmdBZnRlclZpZXdJbml0YCBvclxuICAgICAgLy8gb3RoZXIgcG9zdC1vcmRlciBob29rcy5cbiAgICAgIGVudmlyb25tZW50LmlubGluZUVmZmVjdFJ1bm5lcj8uZmx1c2goKTtcblxuICAgICAgLy8gSW52b2tlIGFsbCBjYWxsYmFja3MgcmVnaXN0ZXJlZCB2aWEgYGFmdGVyKlJlbmRlcmAsIGlmIG5lZWRlZC5cbiAgICAgIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyPy5lbmQoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlld1doaWxlRGlydHkobFZpZXc6IExWaWV3KSB7XG4gIGxldCByZXRyaWVzID0gMDtcbiAgLy8gSWYgYWZ0ZXIgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uLCB0aGlzIHZpZXcgc3RpbGwgbmVlZHMgdG8gYmUgcmVmcmVzaGVkIG9yIHRoZXJlIGFyZVxuICAvLyBkZXNjZW5kYW50cyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgcmVmcmVzaGVkIGR1ZSB0byByZS1kaXJ0eWluZyBkdXJpbmcgdGhlIGNoYW5nZSBkZXRlY3Rpb25cbiAgLy8gcnVuLCBkZXRlY3QgY2hhbmdlcyBvbiB0aGUgdmlldyBhZ2Fpbi4gV2UgcnVuIGNoYW5nZSBkZXRlY3Rpb24gaW4gYFRhcmdldGVkYCBtb2RlIHRvIG9ubHlcbiAgLy8gcmVmcmVzaCB2aWV3cyB3aXRoIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWcuXG4gIHdoaWxlIChsVmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5SZWZyZXNoVmlldyB8IExWaWV3RmxhZ3MuSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCkgfHxcbiAgICAgICAgIGxWaWV3W1JFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSXT8uZGlydHkpIHtcbiAgICBpZiAocmV0cmllcyA9PT0gTUFYSU1VTV9SRUZSRVNIX1JFUlVOUykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdJbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIHdoaWxlIHRyeWluZyB0byByZWZyZXNoIHZpZXdzLiAnICtcbiAgICAgICAgICAgICAgICAgICdUaGVyZSBtYXkgYmUgY29tcG9uZW50cyB3aGljaCBlYWNoIGNhdXNlIHRoZSBvdGhlciB0byByZXF1aXJlIGEgcmVmcmVzaCwgJyArXG4gICAgICAgICAgICAgICAgICAnY2F1c2luZyBhbiBpbmZpbml0ZSBsb29wLicpO1xuICAgIH1cbiAgICByZXRyaWVzKys7XG4gICAgLy8gRXZlbiBpZiB0aGlzIHZpZXcgaXMgZGV0YWNoZWQsIHdlIHN0aWxsIGRldGVjdCBjaGFuZ2VzIGluIHRhcmdldGVkIG1vZGUgYmVjYXVzZSB0aGlzIHdhc1xuICAgIC8vIHRoZSByb290IG9mIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAgICBkZXRlY3RDaGFuZ2VzSW5WaWV3KGxWaWV3LCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCwgbm90aWZ5RXJyb3JIYW5kbGVyID0gdHJ1ZSkge1xuICBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh0VmlldywgbFZpZXcsIGNvbnRleHQsIG5vdGlmeUVycm9ySGFuZGxlcik7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQ6IHt9KTogdm9pZCB7XG4gIGNvbnN0IHZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnQpO1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodmlld1tUVklFV10sIHZpZXcsIGNvbXBvbmVudCk7XG59XG5cbi8qKlxuICogRGlmZmVyZW50IG1vZGVzIG9mIHRyYXZlcnNpbmcgdGhlIGxvZ2ljYWwgdmlldyB0cmVlIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqXG4gKiBUaGUgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwgYWxnb3JpdGhtIHN3aXRjaGVzIGJldHdlZW4gdGhlc2UgbW9kZXMgYmFzZWQgb24gdmFyaW91c1xuICogY29uZGl0aW9ucy5cbiAqL1xuY29uc3QgZW51bSBDaGFuZ2VEZXRlY3Rpb25Nb2RlIHtcbiAgLyoqXG4gICAqIEluIGBHbG9iYWxgIG1vZGUsIGBEaXJ0eWAgYW5kIGBDaGVja0Fsd2F5c2Agdmlld3MgYXJlIHJlZnJlc2hlZCBhcyB3ZWxsIGFzIHZpZXdzIHdpdGggdGhlXG4gICAqIGBSZWZyZXNoVHJhbnNwbGFudGVkVmlld2AgZmxhZy5cbiAgICovXG4gIEdsb2JhbCxcbiAgLyoqXG4gICAqIEluIGBUYXJnZXRlZGAgbW9kZSwgb25seSB2aWV3cyB3aXRoIHRoZSBgUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdgXG4gICAqIGZsYWcgYXJlIHJlZnJlc2hlZC5cbiAgICovXG4gIFRhcmdldGVkLFxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdXBkYXRlIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdXBkYXRlIG1vZGU7XG4gKiAtIGV4ZWN1dGluZyBob29rcztcbiAqIC0gcmVmcmVzaGluZyBxdWVyaWVzO1xuICogLSBzZXR0aW5nIGhvc3QgYmluZGluZ3M7XG4gKiAtIHJlZnJlc2hpbmcgY2hpbGQgKGVtYmVkZGVkIGFuZCBjb21wb25lbnQpIHZpZXdzLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgcmV0dXJuO1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gZXhlY3V0ZSBsaWZlY3ljbGUgaG9va3MgaW4gdGhhdCBtb2RlLlxuICBjb25zdCBpc0luQ2hlY2tOb0NoYW5nZXNQYXNzID0gbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICAhaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyAmJiBsVmlld1tFTlZJUk9OTUVOVF0uaW5saW5lRWZmZWN0UnVubmVyPy5mbHVzaCgpO1xuXG5cbiAgLy8gU3RhcnQgY29tcG9uZW50IHJlYWN0aXZlIGNvbnRleHRcbiAgLy8gLSBXZSBtaWdodCBhbHJlYWR5IGJlIGluIGEgcmVhY3RpdmUgY29udGV4dCBpZiB0aGlzIGlzIGFuIGVtYmVkZGVkIHZpZXcgb2YgdGhlIGhvc3QuXG4gIC8vIC0gV2UgbWlnaHQgYmUgZGVzY2VuZGluZyBpbnRvIGEgdmlldyB0aGF0IG5lZWRzIGEgY29uc3VtZXIuXG4gIGVudGVyVmlldyhsVmlldyk7XG4gIGxldCBwcmV2Q29uc3VtZXI6IFJlYWN0aXZlTm9kZXxudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRDb25zdW1lcjogUmVhY3RpdmVMVmlld0NvbnN1bWVyfG51bGwgPSBudWxsO1xuICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgJiYgdmlld1Nob3VsZEhhdmVSZWFjdGl2ZUNvbnN1bWVyKHRWaWV3KSkge1xuICAgIGN1cnJlbnRDb25zdW1lciA9IGdldE9yQm9ycm93UmVhY3RpdmVMVmlld0NvbnN1bWVyKGxWaWV3KTtcbiAgICBwcmV2Q29uc3VtZXIgPSBjb25zdW1lckJlZm9yZUNvbXB1dGF0aW9uKGN1cnJlbnRDb25zdW1lcik7XG4gIH1cblxuICB0cnkge1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuXG4gICAgc2V0QmluZGluZ0luZGV4KHRWaWV3LmJpbmRpbmdTdGFydEluZGV4KTtcbiAgICBpZiAodGVtcGxhdGVGbiAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlKHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICBjb25zdCBob29rc0luaXRQaGFzZUNvbXBsZXRlZCA9XG4gICAgICAgIChmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuXG4gICAgLy8gZXhlY3V0ZSBwcmUtb3JkZXIgaG9va3MgKE9uSW5pdCwgT25DaGFuZ2VzLCBEb0NoZWNrKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSB0Vmlldy5wcmVPcmRlckhvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaXJzdCBtYXJrIHRyYW5zcGxhbnRlZCB2aWV3cyB0aGF0IGFyZSBkZWNsYXJlZCBpbiB0aGlzIGxWaWV3IGFzIG5lZWRpbmcgYSByZWZyZXNoIGF0IHRoZWlyXG4gICAgLy8gaW5zZXJ0aW9uIHBvaW50cy4gVGhpcyBpcyBuZWVkZWQgdG8gYXZvaWQgdGhlIHNpdHVhdGlvbiB3aGVyZSB0aGUgdGVtcGxhdGUgaXMgZGVmaW5lZCBpbiB0aGlzXG4gICAgLy8gYExWaWV3YCBidXQgaXRzIGRlY2xhcmF0aW9uIGFwcGVhcnMgYWZ0ZXIgdGhlIGluc2VydGlvbiBjb21wb25lbnQuXG4gICAgbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldyk7XG4gICAgZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpO1xuXG4gICAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gICAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIGNvbnRlbnQgaG9va3MgKEFmdGVyQ29udGVudEluaXQsIEFmdGVyQ29udGVudENoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjb250ZW50Q2hlY2tIb29rcyA9IHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzO1xuICAgICAgICBpZiAoY29udGVudENoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgY29udGVudENoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb250ZW50SG9va3MgPSB0Vmlldy5jb250ZW50SG9va3M7XG4gICAgICAgIGlmIChjb250ZW50SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MoXG4gICAgICAgICAgICAgIGxWaWV3LCBjb250ZW50SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzKHRWaWV3LCBsVmlldyk7XG5cbiAgICAvLyBSZWZyZXNoIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzLCBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCk7XG4gICAgfVxuXG4gICAgLy8gVmlldyBxdWVyaWVzIG11c3QgZXhlY3V0ZSBhZnRlciByZWZyZXNoaW5nIGNoaWxkIGNvbXBvbmVudHMgYmVjYXVzZSBhIHRlbXBsYXRlIGluIHRoaXMgdmlld1xuICAgIC8vIGNvdWxkIGJlIGluc2VydGVkIGluIGEgY2hpbGQgY29tcG9uZW50LiBJZiB0aGUgdmlldyBxdWVyeSBleGVjdXRlcyBiZWZvcmUgY2hpbGQgY29tcG9uZW50XG4gICAgLy8gcmVmcmVzaCwgdGhlIHRlbXBsYXRlIG1pZ2h0IG5vdCB5ZXQgYmUgaW5zZXJ0ZWQuXG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbjxUPihSZW5kZXJGbGFncy5VcGRhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSB2aWV3IGhvb2tzIChBZnRlclZpZXdJbml0LCBBZnRlclZpZXdDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3Qgdmlld0NoZWNrSG9va3MgPSB0Vmlldy52aWV3Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKHZpZXdDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHZpZXdDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdmlld0hvb2tzID0gdFZpZXcudmlld0hvb2tzO1xuICAgICAgICBpZiAodmlld0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCB2aWV3SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9PT0gdHJ1ZSkge1xuICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgdGhhdCB3ZSBvbmx5IGZsaXAgdGhlIGZsYWcgb24gc3VjY2Vzc2Z1bCBgcmVmcmVzaFZpZXdgIG9ubHlcbiAgICAgIC8vIERvbid0IGRvIHRoaXMgaW4gYGZpbmFsbHlgIGJsb2NrLlxuICAgICAgLy8gSWYgd2UgZGlkIHRoaXMgaW4gYGZpbmFsbHlgIGJsb2NrIHRoZW4gYW4gZXhjZXB0aW9uIGNvdWxkIGJsb2NrIHRoZSBleGVjdXRpb24gb2Ygc3R5bGluZ1xuICAgICAgLy8gaW5zdHJ1Y3Rpb25zIHdoaWNoIGluIHR1cm4gd291bGQgYmUgdW5hYmxlIHRvIGluc2VydCB0aGVtc2VsdmVzIGludG8gdGhlIHN0eWxpbmcgbGlua2VkXG4gICAgICAvLyBsaXN0LiBUaGUgcmVzdWx0IG9mIHRoaXMgd291bGQgYmUgdGhhdCBpZiB0aGUgZXhjZXB0aW9uIHdvdWxkIG5vdCBiZSB0aHJvdyBvbiBzdWJzZXF1ZW50IENEXG4gICAgICAvLyB0aGUgc3R5bGluZyB3b3VsZCBiZSB1bmFibGUgdG8gcHJvY2VzcyBpdCBkYXRhIGFuZCByZWZsZWN0IHRvIHRoZSBET00uXG4gICAgICB0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBTY2hlZHVsZSBhbnkgZWZmZWN0cyB0aGF0IGFyZSB3YWl0aW5nIG9uIHRoZSB1cGRhdGUgcGFzcyBvZiB0aGlzIHZpZXcuXG4gICAgaWYgKGxWaWV3W0VGRkVDVFNfVE9fU0NIRURVTEVdKSB7XG4gICAgICBmb3IgKGNvbnN0IG5vdGlmeUVmZmVjdCBvZiBsVmlld1tFRkZFQ1RTX1RPX1NDSEVEVUxFXSkge1xuICAgICAgICBub3RpZnlFZmZlY3QoKTtcbiAgICAgIH1cblxuICAgICAgLy8gT25jZSB0aGV5J3ZlIGJlZW4gcnVuLCB3ZSBjYW4gZHJvcCB0aGUgYXJyYXkuXG4gICAgICBsVmlld1tFRkZFQ1RTX1RPX1NDSEVEVUxFXSA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZiByZWZyZXNoaW5nIGEgdmlldyBjYXVzZXMgYW4gZXJyb3IsIHdlIG5lZWQgdG8gcmVtYXJrIHRoZSBhbmNlc3RvcnMgYXMgbmVlZGluZyB0cmF2ZXJzYWxcbiAgICAvLyBiZWNhdXNlIHRoZSBlcnJvciBtaWdodCBoYXZlIGNhdXNlZCBhIHNpdHVhdGlvbiB3aGVyZSB2aWV3cyBiZWxvdyB0aGUgY3VycmVudCBsb2NhdGlvbiBhcmVcbiAgICAvLyBkaXJ0eSBidXQgd2lsbCBiZSB1bnJlYWNoYWJsZSBiZWNhdXNlIHRoZSBcImhhcyBkaXJ0eSBjaGlsZHJlblwiIGZsYWcgaW4gdGhlIGFuY2VzdG9ycyBoYXMgYmVlblxuICAgIC8vIGNsZWFyZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gYW5kIHdlIGZhaWxlZCB0byBydW4gdG8gY29tcGxldGlvbi5cblxuICAgIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwobFZpZXcpO1xuICAgIHRocm93IGU7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGN1cnJlbnRDb25zdW1lciAhPT0gbnVsbCkge1xuICAgICAgY29uc3VtZXJBZnRlckNvbXB1dGF0aW9uKGN1cnJlbnRDb25zdW1lciwgcHJldkNvbnN1bWVyKTtcbiAgICAgIG1heWJlUmV0dXJuUmVhY3RpdmVMVmlld0NvbnN1bWVyKGN1cnJlbnRDb25zdW1lcik7XG4gICAgfVxuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbi8qKlxuICogSW5kaWNhdGVzIGlmIHRoZSB2aWV3IHNob3VsZCBnZXQgaXRzIG93biByZWFjdGl2ZSBjb25zdW1lciBub2RlLlxuICpcbiAqIEluIHRoZSBjdXJyZW50IGRlc2lnbiwgYWxsIGVtYmVkZGVkIHZpZXdzIHNoYXJlIGEgY29uc3VtZXIgd2l0aCB0aGUgY29tcG9uZW50IHZpZXcuIFRoaXMgYWxsb3dzXG4gKiB1cyB0byByZWZyZXNoIGF0IHRoZSBjb21wb25lbnQgbGV2ZWwgcmF0aGVyIHRoYW4gYXQgYSBwZXItdmlldyBsZXZlbC4gSW4gYWRkaXRpb24sIHJvb3Qgdmlld3MgZ2V0XG4gKiB0aGVpciBvd24gcmVhY3RpdmUgbm9kZSBiZWNhdXNlIHJvb3QgY29tcG9uZW50IHdpbGwgaGF2ZSBhIGhvc3QgdmlldyB0aGF0IGV4ZWN1dGVzIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBiaW5kaW5ncy4gVGhpcyBuZWVkcyB0byBiZSB0cmFja2VkIGluIGEgY29uc3VtZXIgYXMgd2VsbC5cbiAqXG4gKiBUbyBnZXQgYSBtb3JlIGdyYW51bGFyIGNoYW5nZSBkZXRlY3Rpb24gdGhhbiBwZXItY29tcG9uZW50LCBhbGwgd2Ugd291bGQganVzdCBuZWVkIHRvIHVwZGF0ZSB0aGVcbiAqIGNvbmRpdGlvbiBoZXJlIHNvIHRoYXQgYSBnaXZlbiB2aWV3IGdldHMgYSByZWFjdGl2ZSBjb25zdW1lciB3aGljaCBjYW4gYmVjb21lIGRpcnR5IGluZGVwZW5kZW50bHlcbiAqIGZyb20gaXRzIHBhcmVudCBjb21wb25lbnQuIEZvciBleGFtcGxlIGVtYmVkZGVkIHZpZXdzIGZvciBzaWduYWwgY29tcG9uZW50cyBjb3VsZCBiZSBjcmVhdGVkIHdpdGhcbiAqIGEgbmV3IHR5cGUgXCJTaWduYWxFbWJlZGRlZFZpZXdcIiBhbmQgdGhlIGNvbmRpdGlvbiBoZXJlIHdvdWxkbid0IGV2ZW4gbmVlZCB1cGRhdGluZyBpbiBvcmRlciB0b1xuICogZ2V0IGdyYW51bGFyIHBlci12aWV3IGNoYW5nZSBkZXRlY3Rpb24gZm9yIHNpZ25hbCBjb21wb25lbnRzLlxuICovXG5mdW5jdGlvbiB2aWV3U2hvdWxkSGF2ZVJlYWN0aXZlQ29uc3VtZXIodFZpZXc6IFRWaWV3KSB7XG4gIHJldHVybiB0Vmlldy50eXBlICE9PSBUVmlld1R5cGUuRW1iZWRkZWQ7XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW0gYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbkVtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3LCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGxDb250YWluZXJbRkxBR1NdICY9IH5MQ29udGFpbmVyRmxhZ3MuSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaDtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGVtYmVkZGVkTFZpZXcsIG1vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIGFzIG5lZWRpbmcgdG8gYmUgcmVmcmVzaGVkIGF0IHRoZWlyIGluc2VydGlvbiBwb2ludHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgbWF5IGhhdmUgdHJhbnNwbGFudGVkIHZpZXdzLlxuICovXG5mdW5jdGlvbiBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBpZiAoIShsQ29udGFpbmVyW0ZMQUdTXSAmIExDb250YWluZXJGbGFncy5IYXNUcmFuc3BsYW50ZWRWaWV3cykpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFZpZXdzLCAnVHJhbnNwbGFudGVkIFZpZXcgZmxhZ3Mgc2V0IGJ1dCBtaXNzaW5nIE1PVkVEX1ZJRVdTJyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtb3ZlZExWaWV3ID0gbW92ZWRWaWV3c1tpXSE7XG4gICAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcbiAgICAgIG1hcmtWaWV3Rm9yUmVmcmVzaChtb3ZlZExWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIGNoYW5nZXMgaW4gYSBjb21wb25lbnQgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncyxcbiAqIHF1ZXJpZXMsIGV0Yy4gaWYgaXQgaXMgQ2hlY2tBbHdheXMsIE9uUHVzaCBhbmQgRGlydHksIGV0Yy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SG9zdElkeCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luQ29tcG9uZW50KFxuICAgIGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlciwgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQoY29tcG9uZW50VmlldywgbW9kZSk7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgdmlldyBhcyBwYXJ0IG9mIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsLlxuICpcbiAqIElmIHRoZSB2aWV3IGlzIGRldGFjaGVkLCBubyBhZGRpdGlvbmFsIHRyYXZlcnNhbCBoYXBwZW5zLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZBdHRhY2hlZChsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgaWYgKCF2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGxWaWV3KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBkZXRlY3RDaGFuZ2VzSW5WaWV3KGxWaWV3LCBtb2RlKTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSB2aWV3IGFzIHBhcnQgb2YgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwuXG4gKlxuICogVGhlIHZpZXcgaXMgcmVmcmVzaGVkIGlmOlxuICogLSBJZiB0aGUgdmlldyBpcyBDaGVja0Fsd2F5cyBvciBEaXJ0eSBhbmQgQ2hhbmdlRGV0ZWN0aW9uTW9kZSBpcyBgR2xvYmFsYFxuICogLSBJZiB0aGUgdmlldyBoYXMgdGhlIGBSZWZyZXNoVHJhbnNwbGFudGVkVmlld2AgZmxhZ1xuICpcbiAqIFRoZSB2aWV3IGlzIG5vdCByZWZyZXNoZWQsIGJ1dCBkZXNjZW5kYW50cyBhcmUgdHJhdmVyc2VkIGluIGBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkYCBpZiB0aGVcbiAqIHZpZXcgSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCBmbGFnIGlzIHNldC5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgY29uc3QgaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyA9IG5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgY29uc3QgY29uc3VtZXIgPSBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl07XG5cbiAgLy8gUmVmcmVzaCBDaGVja0Fsd2F5cyB2aWV3cyBpbiBHbG9iYWwgbW9kZS5cbiAgbGV0IHNob3VsZFJlZnJlc2hWaWV3OiBib29sZWFuID1cbiAgICAgICEhKG1vZGUgPT09IENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsICYmIGZsYWdzICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG5cbiAgLy8gUmVmcmVzaCBEaXJ0eSB2aWV3cyBpbiBHbG9iYWwgbW9kZSwgYXMgbG9uZyBhcyB3ZSdyZSBub3QgaW4gY2hlY2tOb0NoYW5nZXMuXG4gIC8vIENoZWNrTm9DaGFuZ2VzIG5ldmVyIHdvcmtlZCB3aXRoIGBPblB1c2hgIGNvbXBvbmVudHMgYmVjYXVzZSB0aGUgYERpcnR5YCBmbGFnIHdhc1xuICAvLyBjbGVhcmVkIGJlZm9yZSBjaGVja05vQ2hhbmdlcyByYW4uIEJlY2F1c2UgdGhlcmUgaXMgbm93IGEgbG9vcCBmb3IgdG8gY2hlY2sgZm9yXG4gIC8vIGJhY2t3YXJkcyB2aWV3cywgaXQgZ2l2ZXMgYW4gb3Bwb3J0dW5pdHkgZm9yIGBPblB1c2hgIGNvbXBvbmVudHMgdG8gYmUgbWFya2VkIGBEaXJ0eWBcbiAgLy8gYmVmb3JlIHRoZSBDaGVja05vQ2hhbmdlcyBwYXNzLiBXZSBkb24ndCB3YW50IGV4aXN0aW5nIGVycm9ycyB0aGF0IGFyZSBoaWRkZW4gYnkgdGhlXG4gIC8vIGN1cnJlbnQgQ2hlY2tOb0NoYW5nZXMgYnVnIHRvIHN1cmZhY2Ugd2hlbiBtYWtpbmcgdW5yZWxhdGVkIGNoYW5nZXMuXG4gIHNob3VsZFJlZnJlc2hWaWV3IHx8PSAhIShcbiAgICAgIGZsYWdzICYgTFZpZXdGbGFncy5EaXJ0eSAmJiBtb2RlID09PSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCAmJiAhaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyk7XG5cbiAgLy8gQWx3YXlzIHJlZnJlc2ggdmlld3MgbWFya2VkIGZvciByZWZyZXNoLCByZWdhcmRsZXNzIG9mIG1vZGUuXG4gIHNob3VsZFJlZnJlc2hWaWV3IHx8PSAhIShmbGFncyAmIExWaWV3RmxhZ3MuUmVmcmVzaFZpZXcpO1xuXG4gIC8vIFJlZnJlc2ggdmlld3Mgd2hlbiB0aGV5IGhhdmUgYSBkaXJ0eSByZWFjdGl2ZSBjb25zdW1lciwgcmVnYXJkbGVzcyBvZiBtb2RlLlxuICBzaG91bGRSZWZyZXNoVmlldyB8fD0gISEoY29uc3VtZXI/LmRpcnR5ICYmIGNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZShjb25zdW1lcikpO1xuXG4gIC8vIE1hcmsgdGhlIEZsYWdzIGFuZCBgUmVhY3RpdmVOb2RlYCBhcyBub3QgZGlydHkgYmVmb3JlIHJlZnJlc2hpbmcgdGhlIGNvbXBvbmVudCwgc28gdGhhdCB0aGV5XG4gIC8vIGNhbiBiZSByZS1kaXJ0aWVkIGR1cmluZyB0aGUgcmVmcmVzaCBwcm9jZXNzLlxuICBpZiAoY29uc3VtZXIpIHtcbiAgICBjb25zdW1lci5kaXJ0eSA9IGZhbHNlO1xuICB9XG4gIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCB8IExWaWV3RmxhZ3MuUmVmcmVzaFZpZXcpO1xuXG4gIGlmIChzaG91bGRSZWZyZXNoVmlldykge1xuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdFZpZXcudGVtcGxhdGUsIGxWaWV3W0NPTlRFWFRdKTtcbiAgfSBlbHNlIGlmIChmbGFncyAmIExWaWV3RmxhZ3MuSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCkge1xuICAgIGRldGVjdENoYW5nZXNJbkVtYmVkZGVkVmlld3MobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQpO1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICBkZXRlY3RDaGFuZ2VzSW5DaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMsIENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAodXBkYXRlIG1vZGUpLiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKFxuICAgIGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdLCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGRldGVjdENoYW5nZXNJbkNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0sIG1vZGUpO1xuICB9XG59XG4iXX0=