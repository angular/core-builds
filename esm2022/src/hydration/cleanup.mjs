/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CONTAINER_HEADER_OFFSET, DEHYDRATED_VIEWS } from '../render3/interfaces/container';
import { isLContainer, isLView } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, HOST, PARENT, RENDERER, TVIEW } from '../render3/interfaces/view';
import { nativeRemoveNode } from '../render3/node_manipulation';
import { EMPTY_ARRAY } from '../util/empty';
import { validateSiblingNodeExists } from './error_handling';
import { cleanupI18nHydrationData } from './i18n';
import { NUM_ROOT_NODES } from './interfaces';
import { getLNodeForHydration } from './utils';
/**
 * Removes all dehydrated views from a given LContainer:
 * both in internal data structure, as well as removing
 * corresponding DOM nodes that belong to that dehydrated view.
 */
export function removeDehydratedViews(lContainer) {
    const views = lContainer[DEHYDRATED_VIEWS] ?? [];
    const parentLView = lContainer[PARENT];
    const renderer = parentLView[RENDERER];
    for (const view of views) {
        removeDehydratedView(view, renderer);
        ngDevMode && ngDevMode.dehydratedViewsRemoved++;
    }
    // Reset the value to an empty array to indicate that no
    // further processing of dehydrated views is needed for
    // this view container (i.e. do not trigger the lookup process
    // once again in case a `ViewContainerRef` is created later).
    lContainer[DEHYDRATED_VIEWS] = EMPTY_ARRAY;
}
/**
 * Helper function to remove all nodes from a dehydrated view.
 */
function removeDehydratedView(dehydratedView, renderer) {
    let nodesRemoved = 0;
    let currentRNode = dehydratedView.firstChild;
    if (currentRNode) {
        const numNodes = dehydratedView.data[NUM_ROOT_NODES];
        while (nodesRemoved < numNodes) {
            ngDevMode && validateSiblingNodeExists(currentRNode);
            const nextSibling = currentRNode.nextSibling;
            nativeRemoveNode(renderer, currentRNode, false);
            currentRNode = nextSibling;
            nodesRemoved++;
        }
    }
}
/**
 * Walks over all views within this LContainer invokes dehydrated views
 * cleanup function for each one.
 */
function cleanupLContainer(lContainer) {
    removeDehydratedViews(lContainer);
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        cleanupLView(lContainer[i]);
    }
}
/**
 * Walks over `LContainer`s and components registered within
 * this LView and invokes dehydrated views cleanup function for each one.
 */
function cleanupLView(lView) {
    cleanupI18nHydrationData(lView);
    const tView = lView[TVIEW];
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        if (isLContainer(lView[i])) {
            const lContainer = lView[i];
            cleanupLContainer(lContainer);
        }
        else if (isLView(lView[i])) {
            // This is a component, enter the `cleanupLView` recursively.
            cleanupLView(lView[i]);
        }
    }
}
/**
 * Walks over all views registered within the ApplicationRef and removes
 * all dehydrated views from all `LContainer`s along the way.
 */
export function cleanupDehydratedViews(appRef) {
    const viewRefs = appRef._views;
    for (const viewRef of viewRefs) {
        const lNode = getLNodeForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lNode !== null && lNode[HOST] !== null) {
            if (isLView(lNode)) {
                cleanupLView(lNode);
            }
            else {
                // Cleanup in the root component view
                const componentLView = lNode[HOST];
                cleanupLView(componentLView);
                // Cleanup in all views within this view container
                cleanupLContainer(lNode);
            }
            ngDevMode && ngDevMode.dehydratedViewsCleanupRuns++;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xlYW51cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2h5ZHJhdGlvbi9jbGVhbnVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBYSxNQUFNLGlDQUFpQyxDQUFDO0FBR3RHLE9BQU8sRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDeEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQW9CLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDMUcsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDOUQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUxQyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEQsT0FBTyxFQUEwQixjQUFjLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDckUsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTdDOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQUMsVUFBc0I7SUFDMUQsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUN6QixvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckMs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QUFrRDtnQkFDbEQsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUNELFNBQVMsSUFBSSxTQUFTLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUN0RCxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIERFSFlEUkFURURfVklFV1MsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSZW5kZXJlcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Uk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhPU1QsIEhZRFJBVElPTiwgTFZpZXcsIFBBUkVOVCwgUkVOREVSRVIsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge25hdGl2ZVJlbW92ZU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vdXRpbC9lbXB0eSc7XG5cbmltcG9ydCB7dmFsaWRhdGVTaWJsaW5nTm9kZUV4aXN0c30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge2NsZWFudXBJMThuSHlkcmF0aW9uRGF0YX0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7RGVoeWRyYXRlZENvbnRhaW5lclZpZXcsIE5VTV9ST09UX05PREVTfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRMTm9kZUZvckh5ZHJhdGlvbn0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgZGVoeWRyYXRlZCB2aWV3cyBmcm9tIGEgZ2l2ZW4gTENvbnRhaW5lcjpcbiAqIGJvdGggaW4gaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUsIGFzIHdlbGwgYXMgcmVtb3ZpbmdcbiAqIGNvcnJlc3BvbmRpbmcgRE9NIG5vZGVzIHRoYXQgYmVsb25nIHRvIHRoYXQgZGVoeWRyYXRlZCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGVoeWRyYXRlZFZpZXdzKGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW0RFSFlEUkFURURfVklFV1NdID8/IFtdO1xuICBjb25zdCBwYXJlbnRMVmlldyA9IGxDb250YWluZXJbUEFSRU5UXTtcbiAgY29uc3QgcmVuZGVyZXIgPSBwYXJlbnRMVmlld1tSRU5ERVJFUl07XG4gIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgIHJlbW92ZURlaHlkcmF0ZWRWaWV3KHZpZXcsIHJlbmRlcmVyKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmRlaHlkcmF0ZWRWaWV3c1JlbW92ZWQrKztcbiAgfVxuICAvLyBSZXNldCB0aGUgdmFsdWUgdG8gYW4gZW1wdHkgYXJyYXkgdG8gaW5kaWNhdGUgdGhhdCBub1xuICAvLyBmdXJ0aGVyIHByb2Nlc3Npbmcgb2YgZGVoeWRyYXRlZCB2aWV3cyBpcyBuZWVkZWQgZm9yXG4gIC8vIHRoaXMgdmlldyBjb250YWluZXIgKGkuZS4gZG8gbm90IHRyaWdnZXIgdGhlIGxvb2t1cCBwcm9jZXNzXG4gIC8vIG9uY2UgYWdhaW4gaW4gY2FzZSBhIGBWaWV3Q29udGFpbmVyUmVmYCBpcyBjcmVhdGVkIGxhdGVyKS5cbiAgbENvbnRhaW5lcltERUhZRFJBVEVEX1ZJRVdTXSA9IEVNUFRZX0FSUkFZO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byByZW1vdmUgYWxsIG5vZGVzIGZyb20gYSBkZWh5ZHJhdGVkIHZpZXcuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZURlaHlkcmF0ZWRWaWV3KGRlaHlkcmF0ZWRWaWV3OiBEZWh5ZHJhdGVkQ29udGFpbmVyVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyKSB7XG4gIGxldCBub2Rlc1JlbW92ZWQgPSAwO1xuICBsZXQgY3VycmVudFJOb2RlID0gZGVoeWRyYXRlZFZpZXcuZmlyc3RDaGlsZDtcbiAgaWYgKGN1cnJlbnRSTm9kZSkge1xuICAgIGNvbnN0IG51bU5vZGVzID0gZGVoeWRyYXRlZFZpZXcuZGF0YVtOVU1fUk9PVF9OT0RFU107XG4gICAgd2hpbGUgKG5vZGVzUmVtb3ZlZCA8IG51bU5vZGVzKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVTaWJsaW5nTm9kZUV4aXN0cyhjdXJyZW50Uk5vZGUpO1xuICAgICAgY29uc3QgbmV4dFNpYmxpbmc6IFJOb2RlID0gY3VycmVudFJOb2RlLm5leHRTaWJsaW5nITtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXIsIGN1cnJlbnRSTm9kZSwgZmFsc2UpO1xuICAgICAgY3VycmVudFJOb2RlID0gbmV4dFNpYmxpbmc7XG4gICAgICBub2Rlc1JlbW92ZWQrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBXYWxrcyBvdmVyIGFsbCB2aWV3cyB3aXRoaW4gdGhpcyBMQ29udGFpbmVyIGludm9rZXMgZGVoeWRyYXRlZCB2aWV3c1xuICogY2xlYW51cCBmdW5jdGlvbiBmb3IgZWFjaCBvbmUuXG4gKi9cbmZ1bmN0aW9uIGNsZWFudXBMQ29udGFpbmVyKGxDb250YWluZXI6IExDb250YWluZXIpIHtcbiAgcmVtb3ZlRGVoeWRyYXRlZFZpZXdzKGxDb250YWluZXIpO1xuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY2xlYW51cExWaWV3KGxDb250YWluZXJbaV0gYXMgTFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogV2Fsa3Mgb3ZlciBgTENvbnRhaW5lcmBzIGFuZCBjb21wb25lbnRzIHJlZ2lzdGVyZWQgd2l0aGluXG4gKiB0aGlzIExWaWV3IGFuZCBpbnZva2VzIGRlaHlkcmF0ZWQgdmlld3MgY2xlYW51cCBmdW5jdGlvbiBmb3IgZWFjaCBvbmUuXG4gKi9cbmZ1bmN0aW9uIGNsZWFudXBMVmlldyhsVmlldzogTFZpZXcpIHtcbiAgY2xlYW51cEkxOG5IeWRyYXRpb25EYXRhKGxWaWV3KTtcblxuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tpXTtcbiAgICAgIGNsZWFudXBMQ29udGFpbmVyKGxDb250YWluZXIpO1xuICAgIH0gZWxzZSBpZiAoaXNMVmlldyhsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGVudGVyIHRoZSBgY2xlYW51cExWaWV3YCByZWN1cnNpdmVseS5cbiAgICAgIGNsZWFudXBMVmlldyhsVmlld1tpXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV2Fsa3Mgb3ZlciBhbGwgdmlld3MgcmVnaXN0ZXJlZCB3aXRoaW4gdGhlIEFwcGxpY2F0aW9uUmVmIGFuZCByZW1vdmVzXG4gKiBhbGwgZGVoeWRyYXRlZCB2aWV3cyBmcm9tIGFsbCBgTENvbnRhaW5lcmBzIGFsb25nIHRoZSB3YXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwRGVoeWRyYXRlZFZpZXdzKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAgY29uc3Qgdmlld1JlZnMgPSBhcHBSZWYuX3ZpZXdzO1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxOb2RlICE9PSBudWxsICYmIGxOb2RlW0hPU1RdICE9PSBudWxsKSB7XG4gICAgICBpZiAoaXNMVmlldyhsTm9kZSkpIHtcbiAgICAgICAgY2xlYW51cExWaWV3KGxOb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENsZWFudXAgaW4gdGhlIHJvb3QgY29tcG9uZW50IHZpZXdcbiAgICAgICAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsTm9kZVtIT1NUXSBhcyBMVmlldzx1bmtub3duPjtcbiAgICAgICAgY2xlYW51cExWaWV3KGNvbXBvbmVudExWaWV3KTtcblxuICAgICAgICAvLyBDbGVhbnVwIGluIGFsbCB2aWV3cyB3aXRoaW4gdGhpcyB2aWV3IGNvbnRhaW5lclxuICAgICAgICBjbGVhbnVwTENvbnRhaW5lcihsTm9kZSk7XG4gICAgICB9XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmRlaHlkcmF0ZWRWaWV3c0NsZWFudXBSdW5zKys7XG4gICAgfVxuICB9XG59XG4iXX0=