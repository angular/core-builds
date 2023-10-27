/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
import { assertDefined, assertEqual } from '../../util/assert';
import { assertLContainer } from '../assert';
import { getComponentViewByInstance } from '../context_discovery';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, HAS_CHILD_VIEWS_TO_REFRESH, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS } from '../interfaces/container';
import { CONTEXT, ENVIRONMENT, FLAGS, PARENT, REACTIVE_TEMPLATE_CONSUMER, TVIEW } from '../interfaces/view';
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
        let retries = 0;
        // If after running change detection, this view still needs to be refreshed or there are
        // descendants views that need to be refreshed due to re-dirtying during the change detection
        // run, detect changes on the view again. We run change detection in `Targeted` mode to only
        // refresh views with the `RefreshView` flag.
        while (lView[FLAGS] & (1024 /* LViewFlags.RefreshView */ | 8192 /* LViewFlags.HasChildViewsToRefresh */)) {
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
    enterView(lView);
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
            const consumer = lView[REACTIVE_TEMPLATE_CONSUMER];
            try {
                consumer && (consumer.isRunning = true);
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
            finally {
                consumer && (consumer.isRunning = false);
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
        leaveView();
    }
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
    const tView = lView[TVIEW];
    const flags = lView[FLAGS];
    // Flag cleared before change detection runs so that the view can be re-marked for traversal if
    // necessary.
    lView[FLAGS] &= ~(8192 /* LViewFlags.HasChildViewsToRefresh */ | 1024 /* LViewFlags.RefreshView */);
    if ((flags & (16 /* LViewFlags.CheckAlways */ | 64 /* LViewFlags.Dirty */) &&
        mode === 0 /* ChangeDetectionMode.Global */) ||
        flags & 1024 /* LViewFlags.RefreshView */) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2NoYW5nZV9kZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDaEUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlGLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSwwQkFBMEIsRUFBRSxzQkFBc0IsRUFBYyxXQUFXLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUU3SSxPQUFPLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQXFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRSxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUNwSixPQUFPLEVBQUMsU0FBUyxFQUFFLHNCQUFzQixFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEgsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDbkYsT0FBTyxFQUFDLHdCQUF3QixFQUFFLGNBQWMsRUFBRSx5QkFBeUIsRUFBRSxrQkFBa0IsRUFBRSxzQkFBc0IsRUFBRSw0QkFBNEIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRWpMLE9BQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLEVBQUUs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Q0FBQyxLQUFLLENBQUMsQ0FBQztJQUUzQiwrRkFBK0Y7SUFDL0YsYUFBYTtJQUNiLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsZ0ZBQTBELENBQUMsQ0FBQztJQUU5RSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsMkRBQXlDLENBQUM7UUFDbkQsSUFBSSx1Q0FBK0IsQ0FBQztRQUNyQyxLQUFLLG9DQUF5QixFQUFFO1FBQ2xDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDM0Q7U0FBTSxJQUFJLEtBQUssK0NBQW9DLEVBQUU7UUFDcEQsNEJBQTRCLENBQUMsS0FBSyx1Q0FBK0IsQ0FBQztRQUNsRSxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2Qiw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsVUFBVSx1Q0FBK0IsQ0FBQztTQUNqRjtLQUNGO0FBQ0gsQ0FBQztBQUVELG9FQUFvRTtBQUNwRSxTQUFTLDhCQUE4QixDQUNuQyxTQUFnQixFQUFFLFVBQW9CLEVBQUUsSUFBeUI7SUFDbkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsd0JBQXdCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMxRDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXJ9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluc3RhbmNlfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfQ0hJTERfVklFV1NfVE9fUkVGUkVTSCwgSEFTX1RSQU5TUExBTlRFRF9WSUVXUywgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGUsIFJlbmRlckZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05URVhULCBFTlZJUk9OTUVOVCwgRkxBR1MsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUiwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtlbnRlclZpZXcsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUsIGxlYXZlVmlldywgc2V0QmluZGluZ0luZGV4LCBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEZpcnN0TENvbnRhaW5lciwgZ2V0TmV4dExDb250YWluZXJ9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGlzQ3JlYXRpb25Nb2RlLCBtYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsLCBtYXJrVmlld0ZvclJlZnJlc2gsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7ZXhlY3V0ZVRlbXBsYXRlLCBleGVjdXRlVmlld1F1ZXJ5Rm4sIGhhbmRsZUVycm9yLCBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzLCByZWZyZXNoQ29udGVudFF1ZXJpZXN9IGZyb20gJy4vc2hhcmVkJztcblxuLyoqXG4gKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsIHdpbGwgcmVydW4gYmVmb3JlIHRocm93aW5nIGFuIGVycm9yLlxuICovXG5jb25zdCBNQVhJTVVNX1JFRlJFU0hfUkVSVU5TID0gMTAwO1xuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlKSB7XG4gIGNvbnN0IGVudmlyb25tZW50ID0gbFZpZXdbRU5WSVJPTk1FTlRdO1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBlbnZpcm9ubWVudC5yZW5kZXJlckZhY3Rvcnk7XG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gZW52aXJvbm1lbnQuYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXI7XG5cbiAgLy8gQ2hlY2sgbm8gY2hhbmdlcyBtb2RlIGlzIGEgZGV2IG9ubHkgbW9kZSB1c2VkIHRvIHZlcmlmeSB0aGF0IGJpbmRpbmdzIGhhdmUgbm90IGNoYW5nZWRcbiAgLy8gc2luY2UgdGhleSB3ZXJlIGFzc2lnbmVkLiBXZSBkbyBub3Qgd2FudCB0byBpbnZva2UgcmVuZGVyZXIgZmFjdG9yeSBmdW5jdGlvbnMgaW4gdGhhdCBtb2RlXG4gIC8vIHRvIGF2b2lkIGFueSBwb3NzaWJsZSBzaWRlLWVmZmVjdHMuXG4gIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9ICEhbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbj8uKCk7XG4gICAgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXI/LmJlZ2luKCk7XG4gIH1cblxuICB0cnkge1xuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdFZpZXcudGVtcGxhdGUsIGNvbnRleHQpO1xuICAgIGxldCByZXRyaWVzID0gMDtcbiAgICAvLyBJZiBhZnRlciBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24sIHRoaXMgdmlldyBzdGlsbCBuZWVkcyB0byBiZSByZWZyZXNoZWQgb3IgdGhlcmUgYXJlXG4gICAgLy8gZGVzY2VuZGFudHMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZCBkdWUgdG8gcmUtZGlydHlpbmcgZHVyaW5nIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAgLy8gcnVuLCBkZXRlY3QgY2hhbmdlcyBvbiB0aGUgdmlldyBhZ2Fpbi4gV2UgcnVuIGNoYW5nZSBkZXRlY3Rpb24gaW4gYFRhcmdldGVkYCBtb2RlIHRvIG9ubHlcbiAgICAvLyByZWZyZXNoIHZpZXdzIHdpdGggdGhlIGBSZWZyZXNoVmlld2AgZmxhZy5cbiAgICB3aGlsZSAobFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuUmVmcmVzaFZpZXcgfCBMVmlld0ZsYWdzLkhhc0NoaWxkVmlld3NUb1JlZnJlc2gpKSB7XG4gICAgICBpZiAocmV0cmllcyA9PT0gTUFYSU1VTV9SRUZSRVNIX1JFUlVOUykge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgJ0luZmluaXRlIGNoYW5nZSBkZXRlY3Rpb24gd2hpbGUgdHJ5aW5nIHRvIHJlZnJlc2ggdmlld3MuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVGhlcmUgbWF5IGJlIGNvbXBvbmVudHMgd2hpY2ggZWFjaCBjYXVzZSB0aGUgb3RoZXIgdG8gcmVxdWlyZSBhIHJlZnJlc2gsICcgK1xuICAgICAgICAgICAgICAgICAgICAnY2F1c2luZyBhbiBpbmZpbml0ZSBsb29wLicpO1xuICAgICAgfVxuICAgICAgcmV0cmllcysrO1xuICAgICAgLy8gRXZlbiBpZiB0aGlzIHZpZXcgaXMgZGV0YWNoZWQsIHdlIHN0aWxsIGRldGVjdCBjaGFuZ2VzIGluIHRhcmdldGVkIG1vZGUgYmVjYXVzZSB0aGlzIHdhc1xuICAgICAgLy8gdGhlIHJvb3Qgb2YgdGhlIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICAgICAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChub3RpZnlFcnJvckhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kPy4oKTtcblxuICAgICAgLy8gT25lIGZpbmFsIGZsdXNoIG9mIHRoZSBlZmZlY3RzIHF1ZXVlIHRvIGNhdGNoIGFueSBlZmZlY3RzIGNyZWF0ZWQgaW4gYG5nQWZ0ZXJWaWV3SW5pdGAgb3JcbiAgICAgIC8vIG90aGVyIHBvc3Qtb3JkZXIgaG9va3MuXG4gICAgICBlbnZpcm9ubWVudC5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG5cbiAgICAgIC8vIEludm9rZSBhbGwgY2FsbGJhY2tzIHJlZ2lzdGVyZWQgdmlhIGBhZnRlcipSZW5kZXJgLCBpZiBuZWVkZWQuXG4gICAgICBhZnRlclJlbmRlckV2ZW50TWFuYWdlcj8uZW5kKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlKSB7XG4gIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHRWaWV3LCBsVmlldywgY29udGV4dCwgbm90aWZ5RXJyb3JIYW5kbGVyKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgY29tcG9uZW50IChhbmQgcG9zc2libHkgaXRzIHN1Yi1jb21wb25lbnRzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gaW4gYSBzeW5jaHJvbm91cyB3YXkgb24gYSBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzKGNvbXBvbmVudDoge30pOiB2b2lkIHtcbiAgY29uc3QgdmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudCk7XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbCh2aWV3W1RWSUVXXSwgdmlldywgY29tcG9uZW50KTtcbn1cblxuLyoqXG4gKiBEaWZmZXJlbnQgbW9kZXMgb2YgdHJhdmVyc2luZyB0aGUgbG9naWNhbCB2aWV3IHRyZWUgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICpcbiAqIFRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRyYXZlcnNhbCBhbGdvcml0aG0gc3dpdGNoZXMgYmV0d2VlbiB0aGVzZSBtb2RlcyBiYXNlZCBvbiB2YXJpb3VzXG4gKiBjb25kaXRpb25zLlxuICovXG5jb25zdCBlbnVtIENoYW5nZURldGVjdGlvbk1vZGUge1xuICAvKipcbiAgICogSW4gYEdsb2JhbGAgbW9kZSwgYERpcnR5YCBhbmQgYENoZWNrQWx3YXlzYCB2aWV3cyBhcmUgcmVmcmVzaGVkIGFzIHdlbGwgYXMgdmlld3Mgd2l0aCB0aGVcbiAgICogYFJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3YCBmbGFnLlxuICAgKi9cbiAgR2xvYmFsLFxuICAvKipcbiAgICogSW4gYFRhcmdldGVkYCBtb2RlLCBvbmx5IHZpZXdzIHdpdGggdGhlIGBSZWZyZXNoVHJhbnNwbGFudGVkVmlld2BcbiAgICogZmxhZyBhcmUgcmVmcmVzaGVkLlxuICAgKi9cbiAgVGFyZ2V0ZWQsXG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hWaWV3PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgY29udGV4dDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGlmICgoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkKSByZXR1cm47XG5cbiAgLy8gQ2hlY2sgbm8gY2hhbmdlcyBtb2RlIGlzIGEgZGV2IG9ubHkgbW9kZSB1c2VkIHRvIHZlcmlmeSB0aGF0IGJpbmRpbmdzIGhhdmUgbm90IGNoYW5nZWRcbiAgLy8gc2luY2UgdGhleSB3ZXJlIGFzc2lnbmVkLiBXZSBkbyBub3Qgd2FudCB0byBleGVjdXRlIGxpZmVjeWNsZSBob29rcyBpbiB0aGF0IG1vZGUuXG4gIGNvbnN0IGlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgPSBuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gICFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzICYmIGxWaWV3W0VOVklST05NRU5UXS5pbmxpbmVFZmZlY3RSdW5uZXI/LmZsdXNoKCk7XG5cbiAgZW50ZXJWaWV3KGxWaWV3KTtcbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdJbmRleCh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjaylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgY29uc3QgY29uc3VtZXIgPSBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl07XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdW1lciAmJiAoY29uc3VtZXIuaXNSdW5uaW5nID0gdHJ1ZSk7XG4gICAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGNvbnN1bWVyICYmIChjb25zdW1lci5pc1J1bm5pbmcgPSBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmlyc3QgbWFyayB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBhcmUgZGVjbGFyZWQgaW4gdGhpcyBsVmlldyBhcyBuZWVkaW5nIGEgcmVmcmVzaCBhdCB0aGVpclxuICAgIC8vIGluc2VydGlvbiBwb2ludHMuIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIHRoZSBzaXR1YXRpb24gd2hlcmUgdGhlIHRlbXBsYXRlIGlzIGRlZmluZWQgaW4gdGhpc1xuICAgIC8vIGBMVmlld2AgYnV0IGl0cyBkZWNsYXJhdGlvbiBhcHBlYXJzIGFmdGVyIHRoZSBpbnNlcnRpb24gY29tcG9uZW50LlxuICAgIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXcpO1xuICAgIGRldGVjdENoYW5nZXNJbkVtYmVkZGVkVmlld3MobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsKTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIGRldGVjdENoYW5nZXNJbkNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cywgQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWwpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZiByZWZyZXNoaW5nIGEgdmlldyBjYXVzZXMgYW4gZXJyb3IsIHdlIG5lZWQgdG8gcmVtYXJrIHRoZSBhbmNlc3RvcnMgYXMgbmVlZGluZyB0cmF2ZXJzYWxcbiAgICAvLyBiZWNhdXNlIHRoZSBlcnJvciBtaWdodCBoYXZlIGNhdXNlZCBhIHNpdHVhdGlvbiB3aGVyZSB2aWV3cyBiZWxvdyB0aGUgY3VycmVudCBsb2NhdGlvbiBhcmVcbiAgICAvLyBkaXJ0eSBidXQgd2lsbCBiZSB1bnJlYWNoYWJsZSBiZWNhdXNlIHRoZSBcImhhcyBkaXJ0eSBjaGlsZHJlblwiIGZsYWcgaW4gdGhlIGFuY2VzdG9ycyBoYXMgYmVlblxuICAgIC8vIGNsZWFyZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gYW5kIHdlIGZhaWxlZCB0byBydW4gdG8gY29tcGxldGlvbi5cblxuICAgIG1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWwobFZpZXcpO1xuICAgIHRocm93IGU7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgbENvbnRhaW5lcltIQVNfQ0hJTERfVklFV1NfVE9fUkVGUkVTSF0gPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGRldGVjdENoYW5nZXNJblZpZXdJZkF0dGFjaGVkKGVtYmVkZGVkTFZpZXcsIG1vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIGFzIG5lZWRpbmcgdG8gYmUgcmVmcmVzaGVkIGF0IHRoZWlyIGluc2VydGlvbiBwb2ludHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgbWF5IGhhdmUgdHJhbnNwbGFudGVkIHZpZXdzLlxuICovXG5mdW5jdGlvbiBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBpZiAoIWxDb250YWluZXJbSEFTX1RSQU5TUExBTlRFRF9WSUVXU10pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFZpZXdzLCAnVHJhbnNwbGFudGVkIFZpZXcgZmxhZ3Mgc2V0IGJ1dCBtaXNzaW5nIE1PVkVEX1ZJRVdTJyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtb3ZlZExWaWV3ID0gbW92ZWRWaWV3c1tpXSE7XG4gICAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcbiAgICAgIG1hcmtWaWV3Rm9yUmVmcmVzaChtb3ZlZExWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIGNoYW5nZXMgaW4gYSBjb21wb25lbnQgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncyxcbiAqIHF1ZXJpZXMsIGV0Yy4gaWYgaXQgaXMgQ2hlY2tBbHdheXMsIE9uUHVzaCBhbmQgRGlydHksIGV0Yy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SG9zdElkeCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luQ29tcG9uZW50KFxuICAgIGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlciwgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgZGV0ZWN0Q2hhbmdlc0luVmlld0lmQXR0YWNoZWQoY29tcG9uZW50VmlldywgbW9kZSk7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgdmlldyBhcyBwYXJ0IG9mIGNoYW5nZSBkZXRlY3Rpb24gdHJhdmVyc2FsLlxuICpcbiAqIElmIHRoZSB2aWV3IGlzIGRldGFjaGVkLCBubyBhZGRpdGlvbmFsIHRyYXZlcnNhbCBoYXBwZW5zLlxuICovXG5mdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZBdHRhY2hlZChsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgaWYgKCF2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGxWaWV3KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBkZXRlY3RDaGFuZ2VzSW5WaWV3KGxWaWV3LCBtb2RlKTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSB2aWV3IGFzIHBhcnQgb2YgY2hhbmdlIGRldGVjdGlvbiB0cmF2ZXJzYWwuXG4gKlxuICogVGhlIHZpZXcgaXMgcmVmcmVzaGVkIGlmOlxuICogLSBJZiB0aGUgdmlldyBpcyBDaGVja0Fsd2F5cyBvciBEaXJ0eSBhbmQgQ2hhbmdlRGV0ZWN0aW9uTW9kZSBpcyBgR2xvYmFsYFxuICogLSBJZiB0aGUgdmlldyBoYXMgdGhlIGBSZWZyZXNoVHJhbnNwbGFudGVkVmlld2AgZmxhZ1xuICpcbiAqIFRoZSB2aWV3IGlzIG5vdCByZWZyZXNoZWQsIGJ1dCBkZXNjZW5kYW50cyBhcmUgdHJhdmVyc2VkIGluIGBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkYCBpZiB0aGVcbiAqIHZpZXcgSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCBmbGFnIGlzIHNldC5cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldzogTFZpZXcsIG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuXG4gIC8vIEZsYWcgY2xlYXJlZCBiZWZvcmUgY2hhbmdlIGRldGVjdGlvbiBydW5zIHNvIHRoYXQgdGhlIHZpZXcgY2FuIGJlIHJlLW1hcmtlZCBmb3IgdHJhdmVyc2FsIGlmXG4gIC8vIG5lY2Vzc2FyeS5cbiAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5IYXNDaGlsZFZpZXdzVG9SZWZyZXNoIHwgTFZpZXdGbGFncy5SZWZyZXNoVmlldyk7XG5cbiAgaWYgKChmbGFncyAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkgJiZcbiAgICAgICBtb2RlID09PSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbCkgfHxcbiAgICAgIGZsYWdzICYgTFZpZXdGbGFncy5SZWZyZXNoVmlldykge1xuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdFZpZXcudGVtcGxhdGUsIGxWaWV3W0NPTlRFWFRdKTtcbiAgfSBlbHNlIGlmIChmbGFncyAmIExWaWV3RmxhZ3MuSGFzQ2hpbGRWaWV3c1RvUmVmcmVzaCkge1xuICAgIGRldGVjdENoYW5nZXNJbkVtYmVkZGVkVmlld3MobFZpZXcsIENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQpO1xuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICBkZXRlY3RDaGFuZ2VzSW5DaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMsIENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAodXBkYXRlIG1vZGUpLiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luQ2hpbGRDb21wb25lbnRzKFxuICAgIGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdLCBtb2RlOiBDaGFuZ2VEZXRlY3Rpb25Nb2RlKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGRldGVjdENoYW5nZXNJbkNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0sIG1vZGUpO1xuICB9XG59XG4iXX0=