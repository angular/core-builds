/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isLContainer } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, HOST, RENDERER, TVIEW } from '../render3/interfaces/view';
import { unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { getComponentLViewForHydration, NGH_ATTR_NAME, NGH_DATA_KEY } from './utils';
/**
 * A collection that tracks all serialized views (`ngh` DOM annotations)
 * to avoid duplication. An attempt to add a duplicate view results in the
 * collection returning the index of the previously collected serialized view.
 * This reduces the number of annotations needed for a given page.
 */
class SerializedViewCollection {
    constructor() {
        this.views = [];
        this.indexByContent = new Map();
    }
    add(serializedView) {
        const viewAsString = JSON.stringify(serializedView);
        if (!this.indexByContent.has(viewAsString)) {
            const index = this.views.length;
            this.views.push(serializedView);
            this.indexByContent.set(viewAsString, index);
            return index;
        }
        return this.indexByContent.get(viewAsString);
    }
    getAll() {
        return this.views;
    }
}
/**
 * Annotates all components bootstrapped in a given ApplicationRef
 * with info needed for hydration.
 *
 * @param appRef An instance of an ApplicationRef.
 * @param doc A reference to the current Document instance.
 */
export function annotateForHydration(appRef, doc) {
    const serializedViewCollection = new SerializedViewCollection();
    const viewRefs = appRef._views;
    for (const viewRef of viewRefs) {
        const lView = getComponentLViewForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lView !== null) {
            const hostElement = lView[HOST];
            if (hostElement) {
                const context = {
                    serializedViewCollection,
                };
                annotateHostElementForHydration(hostElement, lView, context);
            }
        }
    }
    const allSerializedViews = serializedViewCollection.getAll();
    if (allSerializedViews.length > 0) {
        const transferState = appRef.injector.get(TransferState);
        transferState.set(NGH_DATA_KEY, allSerializedViews);
    }
}
/**
 * Serializes the lView data into a SerializedView object that will later be added
 * to the TransferState storage and referenced using the `ngh` attribute on a host
 * element.
 *
 * @param lView the lView we are serializing
 * @param context the hydration context
 * @returns the `SerializedView` object containing the data to be added to the host node
 */
function serializeLView(lView, context) {
    const ngh = {};
    const tView = lView[TVIEW];
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        // Local refs (e.g. <div #localRef>) take up an extra slot in LViews
        // to store the same element. In this case, there is no information in
        // a corresponding slot in TNode data structure. If that's the case, just
        // skip this slot and move to the next one.
        if (!tNode) {
            continue;
        }
        if (isLContainer(lView[i])) {
            // TODO: serialization of LContainers will be added
            // in followup PRs.
        }
        else if (Array.isArray(lView[i])) {
            // This is a component, annotate the host node with an `ngh` attribute.
            const targetNode = unwrapRNode(lView[i][HOST]);
            annotateHostElementForHydration(targetNode, lView[i], context);
        }
    }
    return ngh;
}
/**
 * Physically adds the `ngh` attribute and serialized data to the host element.
 *
 * @param element The Host element to be annotated
 * @param lView The associated LView
 * @param context The hydration context
 */
function annotateHostElementForHydration(element, lView, context) {
    const ngh = serializeLView(lView, context);
    const index = context.serializedViewCollection.add(ngh);
    const renderer = lView[RENDERER];
    renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQy9ELE9BQU8sRUFBQyxhQUFhLEVBQUUsSUFBSSxFQUFTLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUN2RixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR2hELE9BQU8sRUFBQyw2QkFBNkIsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRW5GOzs7OztHQUtHO0FBQ0gsTUFBTSx3QkFBd0I7SUFBOUI7UUFDVSxVQUFLLEdBQXFCLEVBQUUsQ0FBQztRQUM3QixtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBZ0JyRCxDQUFDO0lBZEMsR0FBRyxDQUFDLGNBQThCO1FBQ2hDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQzFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3QyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQsTUFBTTtRQUNKLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUFXRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsTUFBc0IsRUFBRSxHQUFhO0lBQ3hFLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO0lBQ2hFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDL0IsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7UUFDOUIsTUFBTSxLQUFLLEdBQUcsNkJBQTZCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckQsdURBQXVEO1FBQ3ZELDJDQUEyQztRQUMzQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDbEIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLElBQUksV0FBVyxFQUFFO2dCQUNmLE1BQU0sT0FBTyxHQUFxQjtvQkFDaEMsd0JBQXdCO2lCQUN6QixDQUFDO2dCQUNGLCtCQUErQixDQUFDLFdBQTBCLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzdFO1NBQ0Y7S0FDRjtJQUNELE1BQU0sa0JBQWtCLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDN0QsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2pDLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pELGFBQWEsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQUM7S0FDckQ7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLGNBQWMsQ0FBQyxLQUFZLEVBQUUsT0FBeUI7SUFDN0QsTUFBTSxHQUFHLEdBQW1CLEVBQUUsQ0FBQztJQUMvQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsbURBQW1EO0lBQ25ELEtBQUssSUFBSSxDQUFDLEdBQUcsYUFBYSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQVUsQ0FBQztRQUNyQyxvRUFBb0U7UUFDcEUsc0VBQXNFO1FBQ3RFLHlFQUF5RTtRQUN6RSwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLFNBQVM7U0FDVjtRQUNELElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzFCLG1EQUFtRDtZQUNuRCxtQkFBbUI7U0FDcEI7YUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEMsdUVBQXVFO1lBQ3ZFLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQztZQUNoRCwrQkFBK0IsQ0FBQyxVQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1RTtLQUNGO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUywrQkFBK0IsQ0FDcEMsT0FBaUIsRUFBRSxLQUFZLEVBQUUsT0FBeUI7SUFDNUQsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5cbmltcG9ydCB7U2VyaWFsaXplZFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uLCBOR0hfQVRUUl9OQU1FLCBOR0hfREFUQV9LRVl9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEEgY29sbGVjdGlvbiB0aGF0IHRyYWNrcyBhbGwgc2VyaWFsaXplZCB2aWV3cyAoYG5naGAgRE9NIGFubm90YXRpb25zKVxuICogdG8gYXZvaWQgZHVwbGljYXRpb24uIEFuIGF0dGVtcHQgdG8gYWRkIGEgZHVwbGljYXRlIHZpZXcgcmVzdWx0cyBpbiB0aGVcbiAqIGNvbGxlY3Rpb24gcmV0dXJuaW5nIHRoZSBpbmRleCBvZiB0aGUgcHJldmlvdXNseSBjb2xsZWN0ZWQgc2VyaWFsaXplZCB2aWV3LlxuICogVGhpcyByZWR1Y2VzIHRoZSBudW1iZXIgb2YgYW5ub3RhdGlvbnMgbmVlZGVkIGZvciBhIGdpdmVuIHBhZ2UuXG4gKi9cbmNsYXNzIFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiB7XG4gIHByaXZhdGUgdmlld3M6IFNlcmlhbGl6ZWRWaWV3W10gPSBbXTtcbiAgcHJpdmF0ZSBpbmRleEJ5Q29udGVudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgYWRkKHNlcmlhbGl6ZWRWaWV3OiBTZXJpYWxpemVkVmlldyk6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICghdGhpcy5pbmRleEJ5Q29udGVudC5oYXModmlld0FzU3RyaW5nKSkge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnZpZXdzLmxlbmd0aDtcbiAgICAgIHRoaXMudmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgICB0aGlzLmluZGV4QnlDb250ZW50LnNldCh2aWV3QXNTdHJpbmcsIGluZGV4KTtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5kZXhCeUNvbnRlbnQuZ2V0KHZpZXdBc1N0cmluZykhO1xuICB9XG5cbiAgZ2V0QWxsKCk6IFNlcmlhbGl6ZWRWaWV3W10ge1xuICAgIHJldHVybiB0aGlzLnZpZXdzO1xuICB9XG59XG5cbi8qKlxuICogRGVzY3JpYmVzIGEgY29udGV4dCBhdmFpbGFibGUgZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uXG4gKiBwcm9jZXNzLiBUaGUgY29udGV4dCBpcyB1c2VkIHRvIHNoYXJlIGFuZCBjb2xsZWN0IGluZm9ybWF0aW9uXG4gKiBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb24uXG4gKi9cbmludGVyZmFjZSBIeWRyYXRpb25Db250ZXh0IHtcbiAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uOiBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb247XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFsbCBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCBpbiBhIGdpdmVuIEFwcGxpY2F0aW9uUmVmXG4gKiB3aXRoIGluZm8gbmVlZGVkIGZvciBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIGFwcFJlZiBBbiBpbnN0YW5jZSBvZiBhbiBBcHBsaWNhdGlvblJlZi5cbiAqIEBwYXJhbSBkb2MgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgRG9jdW1lbnQgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZUZvckh5ZHJhdGlvbihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBkb2M6IERvY3VtZW50KSB7XG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3Qgdmlld1JlZnMgPSBhcHBSZWYuX3ZpZXdzO1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBob3N0RWxlbWVudCA9IGxWaWV3W0hPU1RdO1xuICAgICAgaWYgKGhvc3RFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgICAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLFxuICAgICAgICB9O1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IGFsbFNlcmlhbGl6ZWRWaWV3cyA9IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5nZXRBbGwoKTtcbiAgaWYgKGFsbFNlcmlhbGl6ZWRWaWV3cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGFwcFJlZi5pbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSk7XG4gICAgdHJhbnNmZXJTdGF0ZS5zZXQoTkdIX0RBVEFfS0VZLCBhbGxTZXJpYWxpemVkVmlld3MpO1xuICB9XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbFZpZXcgZGF0YSBpbnRvIGEgU2VyaWFsaXplZFZpZXcgb2JqZWN0IHRoYXQgd2lsbCBsYXRlciBiZSBhZGRlZFxuICogdG8gdGhlIFRyYW5zZmVyU3RhdGUgc3RvcmFnZSBhbmQgcmVmZXJlbmNlZCB1c2luZyB0aGUgYG5naGAgYXR0cmlidXRlIG9uIGEgaG9zdFxuICogZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3QgY29udGFpbmluZyB0aGUgZGF0YSB0byBiZSBhZGRlZCB0byB0aGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxWaWV3KGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNlcmlhbGl6ZWRWaWV3IHtcbiAgY29uc3QgbmdoOiBTZXJpYWxpemVkVmlldyA9IHt9O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gSXRlcmF0ZSBvdmVyIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4gYW4gTFZpZXcuXG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICAvLyBMb2NhbCByZWZzIChlLmcuIDxkaXYgI2xvY2FsUmVmPikgdGFrZSB1cCBhbiBleHRyYSBzbG90IGluIExWaWV3c1xuICAgIC8vIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUTm9kZSBkYXRhIHN0cnVjdHVyZS4gSWYgdGhhdCdzIHRoZSBjYXNlLCBqdXN0XG4gICAgLy8gc2tpcCB0aGlzIHNsb3QgYW5kIG1vdmUgdG8gdGhlIG5leHQgb25lLlxuICAgIGlmICghdE5vZGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoaXNMQ29udGFpbmVyKGxWaWV3W2ldKSkge1xuICAgICAgLy8gVE9ETzogc2VyaWFsaXphdGlvbiBvZiBMQ29udGFpbmVycyB3aWxsIGJlIGFkZGVkXG4gICAgICAvLyBpbiBmb2xsb3d1cCBQUnMuXG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgYW5ub3RhdGUgdGhlIGhvc3Qgbm9kZSB3aXRoIGFuIGBuZ2hgIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXVtIT1NUXSEpO1xuICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlIGFzIFJFbGVtZW50LCBsVmlld1tpXSwgY29udGV4dCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuZ2g7XG59XG5cbi8qKlxuICogUGh5c2ljYWxseSBhZGRzIHRoZSBgbmdoYCBhdHRyaWJ1dGUgYW5kIHNlcmlhbGl6ZWQgZGF0YSB0byB0aGUgaG9zdCBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBIb3N0IGVsZW1lbnQgdG8gYmUgYW5ub3RhdGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGFzc29jaWF0ZWQgTFZpZXdcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBoeWRyYXRpb24gY29udGV4dFxuICovXG5mdW5jdGlvbiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiB2b2lkIHtcbiAgY29uc3QgbmdoID0gc2VyaWFsaXplTFZpZXcobFZpZXcsIGNvbnRleHQpO1xuICBjb25zdCBpbmRleCA9IGNvbnRleHQuc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmFkZChuZ2gpO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIE5HSF9BVFRSX05BTUUsIGluZGV4LnRvU3RyaW5nKCkpO1xufVxuIl19