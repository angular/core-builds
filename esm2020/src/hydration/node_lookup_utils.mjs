/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HEADER_OFFSET } from '../render3/interfaces/view';
import { getNativeByTNode } from '../render3/util/view_utils';
import { assertDefined } from '../util/assert';
import { validateSiblingNodeExists } from './error_handling';
import { calcSerializedContainerSize, getSegmentHead } from './utils';
/** Whether current TNode is a first node in an <ng-container>. */
function isFirstElementInNgContainer(tNode) {
    return !tNode.prev && tNode.parent?.type === 8 /* TNodeType.ElementContainer */;
}
/**
 * Locate a node in DOM tree that corresponds to a given TNode.
 *
 * @param hydrationInfo The hydration annotation data
 * @param tView the current tView
 * @param lView the current lView
 * @param tNode the current tNode
 * @returns an RNode that represents a given tNode
 */
export function locateNextRNode(hydrationInfo, tView, lView, tNode) {
    let native = null;
    if (tView.firstChild === tNode) {
        // We create a first node in this view, so we use a reference
        // to the first child in this DOM segment.
        native = hydrationInfo.firstChild;
    }
    else {
        // Locate a node based on a previous sibling or a parent node.
        const previousTNodeParent = tNode.prev === null;
        const previousTNode = (tNode.prev ?? tNode.parent);
        ngDevMode &&
            assertDefined(previousTNode, 'Unexpected state: current TNode does not have a connection ' +
                'to the previous node or a parent node.');
        if (isFirstElementInNgContainer(tNode)) {
            const noOffsetParentIndex = tNode.parent.index - HEADER_OFFSET;
            native = getSegmentHead(hydrationInfo, noOffsetParentIndex);
        }
        else {
            let previousRElement = getNativeByTNode(previousTNode, lView);
            if (previousTNodeParent) {
                native = previousRElement.firstChild;
            }
            else {
                // If the previous node is an element, but it also has container info,
                // this means that we are processing a node like `<div #vcrTarget>`, which is
                // represented in the DOM as `<div></div>...<!--container-->`.
                // In this case, there are nodes *after* this element and we need to skip
                // all of them to reach an element that we are looking for.
                const noOffsetPrevSiblingIndex = previousTNode.index - HEADER_OFFSET;
                const segmentHead = getSegmentHead(hydrationInfo, noOffsetPrevSiblingIndex);
                if (previousTNode.type === 2 /* TNodeType.Element */ && segmentHead) {
                    const numRootNodesToSkip = calcSerializedContainerSize(hydrationInfo, noOffsetPrevSiblingIndex);
                    // `+1` stands for an anchor comment node after all the views in this container.
                    const nodesToSkip = numRootNodesToSkip + 1;
                    // First node after this segment.
                    native = siblingAfter(nodesToSkip, segmentHead);
                }
                else {
                    native = previousRElement.nextSibling;
                }
            }
        }
    }
    return native;
}
/**
 * Skips over a specified number of nodes and returns the next sibling node after that.
 */
export function siblingAfter(skip, from) {
    let currentNode = from;
    for (let i = 0; i < skip; i++) {
        ngDevMode && validateSiblingNodeExists(currentNode);
        currentNode = currentNode.nextSibling;
    }
    return currentNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9sb29rdXBfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vbm9kZV9sb29rdXBfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGFBQWEsRUFBZSxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3QyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUzRCxPQUFPLEVBQUMsMkJBQTJCLEVBQUUsY0FBYyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXBFLGtFQUFrRTtBQUNsRSxTQUFTLDJCQUEyQixDQUFDLEtBQVk7SUFDL0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLHVDQUErQixDQUFDO0FBQzFFLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQzNCLGFBQTZCLEVBQUUsS0FBWSxFQUFFLEtBQXFCLEVBQUUsS0FBWTtJQUNsRixJQUFJLE1BQU0sR0FBZSxJQUFJLENBQUM7SUFDOUIsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLEtBQUssRUFBRTtRQUM5Qiw2REFBNkQ7UUFDN0QsMENBQTBDO1FBQzFDLE1BQU0sR0FBRyxhQUFhLENBQUMsVUFBVSxDQUFDO0tBQ25DO1NBQU07UUFDTCw4REFBOEQ7UUFDOUQsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQztRQUNoRCxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQ3BELFNBQVM7WUFDTCxhQUFhLENBQ1QsYUFBYSxFQUNiLDZEQUE2RDtnQkFDekQsd0NBQXdDLENBQUMsQ0FBQztRQUN0RCxJQUFJLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLE1BQU8sQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDO1lBQ2hFLE1BQU0sR0FBRyxjQUFjLENBQUMsYUFBYSxFQUFFLG1CQUFtQixDQUFDLENBQUM7U0FDN0Q7YUFBTTtZQUNMLElBQUksZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELElBQUksbUJBQW1CLEVBQUU7Z0JBQ3ZCLE1BQU0sR0FBSSxnQkFBNkIsQ0FBQyxVQUFVLENBQUM7YUFDcEQ7aUJBQU07Z0JBQ0wsc0VBQXNFO2dCQUN0RSw2RUFBNkU7Z0JBQzdFLDhEQUE4RDtnQkFDOUQseUVBQXlFO2dCQUN6RSwyREFBMkQ7Z0JBQzNELE1BQU0sd0JBQXdCLEdBQUcsYUFBYSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUM7Z0JBQ3JFLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxhQUFhLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztnQkFDNUUsSUFBSSxhQUFhLENBQUMsSUFBSSw4QkFBc0IsSUFBSSxXQUFXLEVBQUU7b0JBQzNELE1BQU0sa0JBQWtCLEdBQ3BCLDJCQUEyQixDQUFDLGFBQWEsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUN6RSxnRkFBZ0Y7b0JBQ2hGLE1BQU0sV0FBVyxHQUFHLGtCQUFrQixHQUFHLENBQUMsQ0FBQztvQkFDM0MsaUNBQWlDO29CQUNqQyxNQUFNLEdBQUcsWUFBWSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztpQkFDakQ7cUJBQU07b0JBQ0wsTUFBTSxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQztpQkFDdkM7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLE1BQVcsQ0FBQztBQUNyQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFrQixJQUFZLEVBQUUsSUFBVztJQUNyRSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM3QixTQUFTLElBQUkseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsV0FBVyxHQUFHLFdBQVcsQ0FBQyxXQUFZLENBQUM7S0FDeEM7SUFDRCxPQUFPLFdBQWdCLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge3ZhbGlkYXRlU2libGluZ05vZGVFeGlzdHN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Y2FsY1NlcmlhbGl6ZWRDb250YWluZXJTaXplLCBnZXRTZWdtZW50SGVhZH0gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBXaGV0aGVyIGN1cnJlbnQgVE5vZGUgaXMgYSBmaXJzdCBub2RlIGluIGFuIDxuZy1jb250YWluZXI+LiAqL1xuZnVuY3Rpb24gaXNGaXJzdEVsZW1lbnRJbk5nQ29udGFpbmVyKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gIXROb2RlLnByZXYgJiYgdE5vZGUucGFyZW50Py50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjtcbn1cblxuLyoqXG4gKiBMb2NhdGUgYSBub2RlIGluIERPTSB0cmVlIHRoYXQgY29ycmVzcG9uZHMgdG8gYSBnaXZlbiBUTm9kZS5cbiAqXG4gKiBAcGFyYW0gaHlkcmF0aW9uSW5mbyBUaGUgaHlkcmF0aW9uIGFubm90YXRpb24gZGF0YVxuICogQHBhcmFtIHRWaWV3IHRoZSBjdXJyZW50IHRWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGN1cnJlbnQgbFZpZXdcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCB0Tm9kZVxuICogQHJldHVybnMgYW4gUk5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gdE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZU5leHRSTm9kZTxUIGV4dGVuZHMgUk5vZGU+KFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzx1bmtub3duPiwgdE5vZGU6IFROb2RlKTogVHxudWxsIHtcbiAgbGV0IG5hdGl2ZTogUk5vZGV8bnVsbCA9IG51bGw7XG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSB0Tm9kZSkge1xuICAgIC8vIFdlIGNyZWF0ZSBhIGZpcnN0IG5vZGUgaW4gdGhpcyB2aWV3LCBzbyB3ZSB1c2UgYSByZWZlcmVuY2VcbiAgICAvLyB0byB0aGUgZmlyc3QgY2hpbGQgaW4gdGhpcyBET00gc2VnbWVudC5cbiAgICBuYXRpdmUgPSBoeWRyYXRpb25JbmZvLmZpcnN0Q2hpbGQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gTG9jYXRlIGEgbm9kZSBiYXNlZCBvbiBhIHByZXZpb3VzIHNpYmxpbmcgb3IgYSBwYXJlbnQgbm9kZS5cbiAgICBjb25zdCBwcmV2aW91c1ROb2RlUGFyZW50ID0gdE5vZGUucHJldiA9PT0gbnVsbDtcbiAgICBjb25zdCBwcmV2aW91c1ROb2RlID0gKHROb2RlLnByZXYgPz8gdE5vZGUucGFyZW50KSE7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICBwcmV2aW91c1ROb2RlLFxuICAgICAgICAgICAgJ1VuZXhwZWN0ZWQgc3RhdGU6IGN1cnJlbnQgVE5vZGUgZG9lcyBub3QgaGF2ZSBhIGNvbm5lY3Rpb24gJyArXG4gICAgICAgICAgICAgICAgJ3RvIHRoZSBwcmV2aW91cyBub2RlIG9yIGEgcGFyZW50IG5vZGUuJyk7XG4gICAgaWYgKGlzRmlyc3RFbGVtZW50SW5OZ0NvbnRhaW5lcih0Tm9kZSkpIHtcbiAgICAgIGNvbnN0IG5vT2Zmc2V0UGFyZW50SW5kZXggPSB0Tm9kZS5wYXJlbnQhLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgICAgIG5hdGl2ZSA9IGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0UGFyZW50SW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcHJldmlvdXNSRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNUTm9kZSwgbFZpZXcpO1xuICAgICAgaWYgKHByZXZpb3VzVE5vZGVQYXJlbnQpIHtcbiAgICAgICAgbmF0aXZlID0gKHByZXZpb3VzUkVsZW1lbnQgYXMgUkVsZW1lbnQpLmZpcnN0Q2hpbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB0aGUgcHJldmlvdXMgbm9kZSBpcyBhbiBlbGVtZW50LCBidXQgaXQgYWxzbyBoYXMgY29udGFpbmVyIGluZm8sXG4gICAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB3ZSBhcmUgcHJvY2Vzc2luZyBhIG5vZGUgbGlrZSBgPGRpdiAjdmNyVGFyZ2V0PmAsIHdoaWNoIGlzXG4gICAgICAgIC8vIHJlcHJlc2VudGVkIGluIHRoZSBET00gYXMgYDxkaXY+PC9kaXY+Li4uPCEtLWNvbnRhaW5lci0tPmAuXG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSwgdGhlcmUgYXJlIG5vZGVzICphZnRlciogdGhpcyBlbGVtZW50IGFuZCB3ZSBuZWVkIHRvIHNraXBcbiAgICAgICAgLy8gYWxsIG9mIHRoZW0gdG8gcmVhY2ggYW4gZWxlbWVudCB0aGF0IHdlIGFyZSBsb29raW5nIGZvci5cbiAgICAgICAgY29uc3Qgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4ID0gcHJldmlvdXNUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRIZWFkID0gZ2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4KTtcbiAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgc2VnbWVudEhlYWQpIHtcbiAgICAgICAgICBjb25zdCBudW1Sb290Tm9kZXNUb1NraXAgPVxuICAgICAgICAgICAgICBjYWxjU2VyaWFsaXplZENvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4KTtcbiAgICAgICAgICAvLyBgKzFgIHN0YW5kcyBmb3IgYW4gYW5jaG9yIGNvbW1lbnQgbm9kZSBhZnRlciBhbGwgdGhlIHZpZXdzIGluIHRoaXMgY29udGFpbmVyLlxuICAgICAgICAgIGNvbnN0IG5vZGVzVG9Ta2lwID0gbnVtUm9vdE5vZGVzVG9Ta2lwICsgMTtcbiAgICAgICAgICAvLyBGaXJzdCBub2RlIGFmdGVyIHRoaXMgc2VnbWVudC5cbiAgICAgICAgICBuYXRpdmUgPSBzaWJsaW5nQWZ0ZXIobm9kZXNUb1NraXAsIHNlZ21lbnRIZWFkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuYXRpdmUgPSBwcmV2aW91c1JFbGVtZW50Lm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuYXRpdmUgYXMgVDtcbn1cblxuLyoqXG4gKiBTa2lwcyBvdmVyIGEgc3BlY2lmaWVkIG51bWJlciBvZiBub2RlcyBhbmQgcmV0dXJucyB0aGUgbmV4dCBzaWJsaW5nIG5vZGUgYWZ0ZXIgdGhhdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpYmxpbmdBZnRlcjxUIGV4dGVuZHMgUk5vZGU+KHNraXA6IG51bWJlciwgZnJvbTogUk5vZGUpOiBUfG51bGwge1xuICBsZXQgY3VycmVudE5vZGUgPSBmcm9tO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNraXA7IGkrKykge1xuICAgIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZVNpYmxpbmdOb2RlRXhpc3RzKGN1cnJlbnROb2RlKTtcbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nITtcbiAgfVxuICByZXR1cm4gY3VycmVudE5vZGUgYXMgVDtcbn1cbiJdfQ==