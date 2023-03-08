/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { collectNativeNodes } from '../render3/collect_native_nodes';
import { isLContainer } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, HOST, RENDERER, TVIEW } from '../render3/interfaces/view';
import { unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { ELEMENT_CONTAINERS } from './interfaces';
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
 * Computes the number of root nodes in a given view
 * (or child nodes in a given container if a tNode is provided).
 */
function calcNumRootNodes(tView, lView, tNode) {
    const rootNodes = [];
    collectNativeNodes(tView, lView, tNode, rootNodes);
    return rootNodes.length;
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
        const noOffsetIndex = i - HEADER_OFFSET;
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
        else {
            // <ng-container> case
            if (tNode.type & 8 /* TNodeType.ElementContainer */) {
                // An <ng-container> is represented by the number of
                // top-level nodes. This information is needed to skip over
                // those nodes to reach a corresponding anchor node (comment node).
                ngh[ELEMENT_CONTAINERS] ?? (ngh[ELEMENT_CONTAINERS] = {});
                ngh[ELEMENT_CONTAINERS][noOffsetIndex] = calcNumRootNodes(tView, lView, tNode.child);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFHbkUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQy9ELE9BQU8sRUFBQyxhQUFhLEVBQUUsSUFBSSxFQUFTLFFBQVEsRUFBUyxLQUFLLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM5RixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWhELE9BQU8sRUFBQyxrQkFBa0IsRUFBaUIsTUFBTSxjQUFjLENBQUM7QUFDaEUsT0FBTyxFQUFDLDZCQUE2QixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFbkY7Ozs7O0dBS0c7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBQzdCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7SUFnQnJELENBQUM7SUFkQyxHQUFHLENBQUMsY0FBOEI7UUFDaEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFH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WUFDTCxzQkFBc0I7WUFDdEIsSUFBSSxLQUFLLENBQUMsSUFBSSxxQ0FBNkIsRUFBRTtnQkFDM0Msb0RBQW9EO2dCQUNwRCwyREFBMkQ7Z0JBQzNELG1FQUFtRTtnQkFDbkUsR0FBRyxDQUFDLGtCQUFrQixNQUF0QixHQUFHLENBQUMsa0JBQWtCLElBQU0sRUFBRSxFQUFDO2dCQUMvQixHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0RjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLCtCQUErQixDQUNwQyxPQUFpQixFQUFFLEtBQVksRUFBRSxPQUF5QjtJQUM1RCxNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge2NvbGxlY3ROYXRpdmVOb2Rlc30gZnJvbSAnLi4vcmVuZGVyMy9jb2xsZWN0X25hdGl2ZV9ub2Rlcyc7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBSRU5ERVJFUiwgVFZpZXcsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Vud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcblxuaW1wb3J0IHtFTEVNRU5UX0NPTlRBSU5FUlMsIFNlcmlhbGl6ZWRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbiwgTkdIX0FUVFJfTkFNRSwgTkdIX0RBVEFfS0VZfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gdGhhdCB0cmFja3MgYWxsIHNlcmlhbGl6ZWQgdmlld3MgKGBuZ2hgIERPTSBhbm5vdGF0aW9ucylcbiAqIHRvIGF2b2lkIGR1cGxpY2F0aW9uLiBBbiBhdHRlbXB0IHRvIGFkZCBhIGR1cGxpY2F0ZSB2aWV3IHJlc3VsdHMgaW4gdGhlXG4gKiBjb2xsZWN0aW9uIHJldHVybmluZyB0aGUgaW5kZXggb2YgdGhlIHByZXZpb3VzbHkgY29sbGVjdGVkIHNlcmlhbGl6ZWQgdmlldy5cbiAqIFRoaXMgcmVkdWNlcyB0aGUgbnVtYmVyIG9mIGFubm90YXRpb25zIG5lZWRlZCBmb3IgYSBnaXZlbiBwYWdlLlxuICovXG5jbGFzcyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24ge1xuICBwcml2YXRlIHZpZXdzOiBTZXJpYWxpemVkVmlld1tdID0gW107XG4gIHByaXZhdGUgaW5kZXhCeUNvbnRlbnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGFkZChzZXJpYWxpemVkVmlldzogU2VyaWFsaXplZFZpZXcpOiBudW1iZXIge1xuICAgIGNvbnN0IHZpZXdBc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZWRWaWV3KTtcbiAgICBpZiAoIXRoaXMuaW5kZXhCeUNvbnRlbnQuaGFzKHZpZXdBc1N0cmluZykpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy52aWV3cy5sZW5ndGg7XG4gICAgICB0aGlzLnZpZXdzLnB1c2goc2VyaWFsaXplZFZpZXcpO1xuICAgICAgdGhpcy5pbmRleEJ5Q29udGVudC5zZXQodmlld0FzU3RyaW5nLCBpbmRleCk7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmluZGV4QnlDb250ZW50LmdldCh2aWV3QXNTdHJpbmcpITtcbiAgfVxuXG4gIGdldEFsbCgpOiBTZXJpYWxpemVkVmlld1tdIHtcbiAgICByZXR1cm4gdGhpcy52aWV3cztcbiAgfVxufVxuXG4vKipcbiAqIERlc2NyaWJlcyBhIGNvbnRleHQgYXZhaWxhYmxlIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvblxuICogcHJvY2Vzcy4gVGhlIGNvbnRleHQgaXMgdXNlZCB0byBzaGFyZSBhbmQgY29sbGVjdCBpbmZvcm1hdGlvblxuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uLlxuICovXG5pbnRlcmZhY2UgSHlkcmF0aW9uQ29udGV4dCB7XG4gIHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjogU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhIGdpdmVuIHZpZXdcbiAqIChvciBjaGlsZCBub2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lciBpZiBhIHROb2RlIGlzIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gY2FsY051bVJvb3ROb2Rlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlfG51bGwpOiBudW1iZXIge1xuICBjb25zdCByb290Tm9kZXM6IHVua25vd25bXSA9IFtdO1xuICBjb2xsZWN0TmF0aXZlTm9kZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgcm9vdE5vZGVzKTtcbiAgcmV0dXJuIHJvb3ROb2Rlcy5sZW5ndGg7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFsbCBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCBpbiBhIGdpdmVuIEFwcGxpY2F0aW9uUmVmXG4gKiB3aXRoIGluZm8gbmVlZGVkIGZvciBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIGFwcFJlZiBBbiBpbnN0YW5jZSBvZiBhbiBBcHBsaWNhdGlvblJlZi5cbiAqIEBwYXJhbSBkb2MgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgRG9jdW1lbnQgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZUZvckh5ZHJhdGlvbihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBkb2M6IERvY3VtZW50KSB7XG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3Qgdmlld1JlZnMgPSBhcHBSZWYuX3ZpZXdzO1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBob3N0RWxlbWVudCA9IGxWaWV3W0hPU1RdO1xuICAgICAgaWYgKGhvc3RFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgICAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLFxuICAgICAgICB9O1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IGFsbFNlcmlhbGl6ZWRWaWV3cyA9IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5nZXRBbGwoKTtcbiAgaWYgKGFsbFNlcmlhbGl6ZWRWaWV3cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGFwcFJlZi5pbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSk7XG4gICAgdHJhbnNmZXJTdGF0ZS5zZXQoTkdIX0RBVEFfS0VZLCBhbGxTZXJpYWxpemVkVmlld3MpO1xuICB9XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbFZpZXcgZGF0YSBpbnRvIGEgU2VyaWFsaXplZFZpZXcgb2JqZWN0IHRoYXQgd2lsbCBsYXRlciBiZSBhZGRlZFxuICogdG8gdGhlIFRyYW5zZmVyU3RhdGUgc3RvcmFnZSBhbmQgcmVmZXJlbmNlZCB1c2luZyB0aGUgYG5naGAgYXR0cmlidXRlIG9uIGEgaG9zdFxuICogZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3QgY29udGFpbmluZyB0aGUgZGF0YSB0byBiZSBhZGRlZCB0byB0aGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxWaWV3KGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNlcmlhbGl6ZWRWaWV3IHtcbiAgY29uc3QgbmdoOiBTZXJpYWxpemVkVmlldyA9IHt9O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gSXRlcmF0ZSBvdmVyIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4gYW4gTFZpZXcuXG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICBjb25zdCBub09mZnNldEluZGV4ID0gaSAtIEhFQURFUl9PRkZTRVQ7XG4gICAgLy8gTG9jYWwgcmVmcyAoZS5nLiA8ZGl2ICNsb2NhbFJlZj4pIHRha2UgdXAgYW4gZXh0cmEgc2xvdCBpbiBMVmlld3NcbiAgICAvLyB0byBzdG9yZSB0aGUgc2FtZSBlbGVtZW50LiBJbiB0aGlzIGNhc2UsIHRoZXJlIGlzIG5vIGluZm9ybWF0aW9uIGluXG4gICAgLy8gYSBjb3JyZXNwb25kaW5nIHNsb3QgaW4gVE5vZGUgZGF0YSBzdHJ1Y3R1cmUuIElmIHRoYXQncyB0aGUgY2FzZSwganVzdFxuICAgIC8vIHNraXAgdGhpcyBzbG90IGFuZCBtb3ZlIHRvIHRoZSBuZXh0IG9uZS5cbiAgICBpZiAoIXROb2RlKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRPRE86IHNlcmlhbGl6YXRpb24gb2YgTENvbnRhaW5lcnMgd2lsbCBiZSBhZGRlZFxuICAgICAgLy8gaW4gZm9sbG93dXAgUFJzLlxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGFubm90YXRlIHRoZSBob3N0IG5vZGUgd2l0aCBhbiBgbmdoYCBhdHRyaWJ1dGUuXG4gICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV1bSE9TVF0hKTtcbiAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSBhcyBSRWxlbWVudCwgbFZpZXdbaV0sIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyA8bmctY29udGFpbmVyPiBjYXNlXG4gICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIC8vIEFuIDxuZy1jb250YWluZXI+IGlzIHJlcHJlc2VudGVkIGJ5IHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gdG9wLWxldmVsIG5vZGVzLiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCB0byBza2lwIG92ZXJcbiAgICAgICAgLy8gdGhvc2Ugbm9kZXMgdG8gcmVhY2ggYSBjb3JyZXNwb25kaW5nIGFuY2hvciBub2RlIChjb21tZW50IG5vZGUpLlxuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXSA/Pz0ge307XG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gY2FsY051bVJvb3ROb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLmNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5naDtcbn1cblxuLyoqXG4gKiBQaHlzaWNhbGx5IGFkZHMgdGhlIGBuZ2hgIGF0dHJpYnV0ZSBhbmQgc2VyaWFsaXplZCBkYXRhIHRvIHRoZSBob3N0IGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgVGhlIEhvc3QgZWxlbWVudCB0byBiZSBhbm5vdGF0ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYXNzb2NpYXRlZCBMVmlld1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IHZvaWQge1xuICBjb25zdCBuZ2ggPSBzZXJpYWxpemVMVmlldyhsVmlldywgY29udGV4dCk7XG4gIGNvbnN0IGluZGV4ID0gY29udGV4dC5zZXJpYWxpemVkVmlld0NvbGxlY3Rpb24uYWRkKG5naCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgTkdIX0FUVFJfTkFNRSwgaW5kZXgudG9TdHJpbmcoKSk7XG59XG4iXX0=