/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getNativeByTNode } from '../render3/util/view_utils';
import { assertDefined } from '../util/assert';
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
        const previousTNode = tNode.prev ?? tNode.parent;
        ngDevMode &&
            assertDefined(previousTNode, 'Unexpected state: current TNode does not have a connection ' +
                'to the previous node or a parent node.');
        const previousRElement = getNativeByTNode(previousTNode, lView);
        if (previousTNodeParent) {
            native = previousRElement.firstChild;
        }
        else {
            native = previousRElement.nextSibling;
        }
    }
    return native;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9sb29rdXBfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vbm9kZV9sb29rdXBfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSTdDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsYUFBNkIsRUFBRSxLQUFZLEVBQUUsS0FBcUIsRUFBRSxLQUFZO0lBQ2xGLElBQUksTUFBTSxHQUFlLElBQUksQ0FBQztJQUM5QixJQUFJLEtBQUssQ0FBQyxVQUFVLEtBQUssS0FBSyxFQUFFO1FBQzlCLDZEQUE2RDtRQUM3RCwwQ0FBMEM7UUFDMUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUM7S0FDbkM7U0FBTTtRQUNMLDhEQUE4RDtRQUM5RCxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO1FBQ2hELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUNqRCxTQUFTO1lBQ0wsYUFBYSxDQUNULGFBQWEsRUFDYiw2REFBNkQ7Z0JBQ3pELHdDQUF3QyxDQUFDLENBQUM7UUFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxhQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakUsSUFBSSxtQkFBbUIsRUFBRTtZQUN2QixNQUFNLEdBQUksZ0JBQTZCLENBQUMsVUFBVSxDQUFDO1NBQ3BEO2FBQU07WUFDTCxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO1NBQ3ZDO0tBQ0Y7SUFDRCxPQUFPLE1BQVcsQ0FBQztBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0RlaHlkcmF0ZWRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuXG4vKipcbiAqIExvY2F0ZSBhIG5vZGUgaW4gRE9NIHRyZWUgdGhhdCBjb3JyZXNwb25kcyB0byBhIGdpdmVuIFROb2RlLlxuICpcbiAqIEBwYXJhbSBoeWRyYXRpb25JbmZvIFRoZSBoeWRyYXRpb24gYW5ub3RhdGlvbiBkYXRhXG4gKiBAcGFyYW0gdFZpZXcgdGhlIGN1cnJlbnQgdFZpZXdcbiAqIEBwYXJhbSBsVmlldyB0aGUgY3VycmVudCBsVmlld1xuICogQHBhcmFtIHROb2RlIHRoZSBjdXJyZW50IHROb2RlXG4gKiBAcmV0dXJucyBhbiBSTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBnaXZlbiB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlTmV4dFJOb2RlPFQgZXh0ZW5kcyBSTm9kZT4oXG4gICAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3PHVua25vd24+LCB0Tm9kZTogVE5vZGUpOiBUfG51bGwge1xuICBsZXQgbmF0aXZlOiBSTm9kZXxudWxsID0gbnVsbDtcbiAgaWYgKHRWaWV3LmZpcnN0Q2hpbGQgPT09IHROb2RlKSB7XG4gICAgLy8gV2UgY3JlYXRlIGEgZmlyc3Qgbm9kZSBpbiB0aGlzIHZpZXcsIHNvIHdlIHVzZSBhIHJlZmVyZW5jZVxuICAgIC8vIHRvIHRoZSBmaXJzdCBjaGlsZCBpbiB0aGlzIERPTSBzZWdtZW50LlxuICAgIG5hdGl2ZSA9IGh5ZHJhdGlvbkluZm8uZmlyc3RDaGlsZDtcbiAgfSBlbHNlIHtcbiAgICAvLyBMb2NhdGUgYSBub2RlIGJhc2VkIG9uIGEgcHJldmlvdXMgc2libGluZyBvciBhIHBhcmVudCBub2RlLlxuICAgIGNvbnN0IHByZXZpb3VzVE5vZGVQYXJlbnQgPSB0Tm9kZS5wcmV2ID09PSBudWxsO1xuICAgIGNvbnN0IHByZXZpb3VzVE5vZGUgPSB0Tm9kZS5wcmV2ID8/IHROb2RlLnBhcmVudDtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHByZXZpb3VzVE5vZGUsXG4gICAgICAgICAgICAnVW5leHBlY3RlZCBzdGF0ZTogY3VycmVudCBUTm9kZSBkb2VzIG5vdCBoYXZlIGEgY29ubmVjdGlvbiAnICtcbiAgICAgICAgICAgICAgICAndG8gdGhlIHByZXZpb3VzIG5vZGUgb3IgYSBwYXJlbnQgbm9kZS4nKTtcbiAgICBjb25zdCBwcmV2aW91c1JFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c1ROb2RlISwgbFZpZXcpO1xuICAgIGlmIChwcmV2aW91c1ROb2RlUGFyZW50KSB7XG4gICAgICBuYXRpdmUgPSAocHJldmlvdXNSRWxlbWVudCBhcyBSRWxlbWVudCkuZmlyc3RDaGlsZDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcHJldmlvdXNSRWxlbWVudC5uZXh0U2libGluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZSBhcyBUO1xufVxuIl19