/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { T_HOST } from '../interfaces/view';
import { appendProjectedNodes } from '../node_manipulation';
import { matchingProjectionSelectorIndex } from '../node_selector_matcher';
import { getLView, setIsParent } from '../state';
import { findComponentView } from '../util/view_traversal_utils';
import { createNodeAtIndex } from './shared';
/**
 * Instruction to distribute projectable nodes among <ng-content> occurrences in a given template.
 * It takes all the selectors from the entire component's template and decides where
 * each projected node belongs (it re-distributes nodes among "buckets" where each "bucket" is
 * backed by a selector).
 *
 * This function requires CSS selectors to be provided in 2 forms: parsed (by a compiler) and text,
 * un-parsed form.
 *
 * The parsed form is needed for efficient matching of a node against a given CSS selector.
 * The un-parsed, textual form is needed for support of the ngProjectAs attribute.
 *
 * Having a CSS selector in 2 different formats is not ideal, but alternatives have even more
 * drawbacks:
 * - having only a textual form would require runtime parsing of CSS selectors;
 * - we can't have only a parsed as we can't re-construct textual form from it (as entered by a
 * template author).
 *
 * \@publicApi
 * @param {?=} selectors A collection of parsed CSS selectors
 * @return {?}
 */
export function ΔprojectionDef(selectors) {
    /** @type {?} */
    const componentNode = (/** @type {?} */ (findComponentView(getLView())[T_HOST]));
    if (!componentNode.projection) {
        /** @type {?} */
        const noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        /** @type {?} */
        const projectionHeads = componentNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        /** @type {?} */
        const tails = projectionHeads.slice();
        /** @type {?} */
        let componentChild = componentNode.child;
        while (componentChild !== null) {
            /** @type {?} */
            const bucketIndex = selectors ? matchingProjectionSelectorIndex(componentChild, selectors) : 0;
            if (tails[bucketIndex]) {
                (/** @type {?} */ (tails[bucketIndex])).projectionNext = componentChild;
            }
            else {
                projectionHeads[bucketIndex] = componentChild;
            }
            tails[bucketIndex] = componentChild;
            componentChild = componentChild.next;
        }
    }
}
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * \@publicApi
 * @param {?} nodeIndex
 * @param {?=} selectorIndex
 * @param {?=} attrs
 * @return {?}
 */
export function Δprojection(nodeIndex, selectorIndex = 0, attrs) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    setIsParent(false);
    // re-distribution of projectable nodes is stored on a component's view level
    appendProjectedNodes(lView, tProjectionNode, selectorIndex, findComponentView(lView));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3Byb2plY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxQyxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEIzQyxNQUFNLFVBQVUsY0FBYyxDQUFDLFNBQTZCOztVQUNwRCxhQUFhLEdBQUcsbUJBQUEsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBZ0I7SUFFM0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUU7O2NBQ3ZCLGVBQWUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztjQUN0RCxlQUFlLEdBQXFCLGFBQWEsQ0FBQyxVQUFVO1lBQzlELElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7O2NBQ25DLEtBQUssR0FBcUIsZUFBZSxDQUFDLEtBQUssRUFBRTs7WUFFbkQsY0FBYyxHQUFlLGFBQWEsQ0FBQyxLQUFLO1FBRXBELE9BQU8sY0FBYyxLQUFLLElBQUksRUFBRTs7a0JBQ3hCLFdBQVcsR0FDYixTQUFTLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU5RSxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDdEIsbUJBQUEsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQzthQUN0RDtpQkFBTTtnQkFDTCxlQUFlLENBQUMsV0FBVyxDQUFDLEdBQUcsY0FBYyxDQUFDO2FBQy9DO1lBQ0QsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLGNBQWMsQ0FBQztZQUVwQyxjQUFjLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQztTQUN0QztLQUNGO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixTQUFpQixFQUFFLGdCQUF3QixDQUFDLEVBQUUsS0FBbUI7O1VBQzdELEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLGVBQWUsR0FDakIsaUJBQWlCLENBQUMsU0FBUyxzQkFBd0IsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxDQUFDO0lBRWpGLDZGQUE2RjtJQUM3RixJQUFJLGVBQWUsQ0FBQyxVQUFVLEtBQUssSUFBSTtRQUFFLGVBQWUsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDO0lBRXBGLGdDQUFnQztJQUNoQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFbkIsNkVBQTZFO0lBQzdFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDeEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGVuZFByb2plY3RlZE5vZGVzfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge21hdGNoaW5nUHJvamVjdGlvblNlbGVjdG9ySW5kZXh9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2dldExWaWV3LCBzZXRJc1BhcmVudH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbmltcG9ydCB7Y3JlYXRlTm9kZUF0SW5kZXh9IGZyb20gJy4vc2hhcmVkJztcblxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UcHJvamVjdGlvbkRlZihzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSk6IHZvaWQge1xuICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudFZpZXcoZ2V0TFZpZXcoKSlbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnByb2plY3Rpb24pIHtcbiAgICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gICAgY29uc3QgcHJvamVjdGlvbkhlYWRzOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3IEFycmF5KG5vT2ZOb2RlQnVja2V0cykuZmlsbChudWxsKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHByb2plY3Rpb25IZWFkcy5zbGljZSgpO1xuXG4gICAgbGV0IGNvbXBvbmVudENoaWxkOiBUTm9kZXxudWxsID0gY29tcG9uZW50Tm9kZS5jaGlsZDtcblxuICAgIHdoaWxlIChjb21wb25lbnRDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgYnVja2V0SW5kZXggPVxuICAgICAgICAgIHNlbGVjdG9ycyA/IG1hdGNoaW5nUHJvamVjdGlvblNlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQsIHNlbGVjdG9ycykgOiAwO1xuXG4gICAgICBpZiAodGFpbHNbYnVja2V0SW5kZXhdKSB7XG4gICAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSAhLnByb2plY3Rpb25OZXh0ID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9qZWN0aW9uSGVhZHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICB9XG4gICAgICB0YWlsc1tidWNrZXRJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcblxuICAgICAgY29tcG9uZW50Q2hpbGQgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogSW5zZXJ0cyBwcmV2aW91c2x5IHJlLWRpc3RyaWJ1dGVkIHByb2plY3RlZCBub2Rlcy4gVGhpcyBpbnN0cnVjdGlvbiBtdXN0IGJlIHByZWNlZGVkIGJ5IGEgY2FsbFxuICogdG8gdGhlIHByb2plY3Rpb25EZWYgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAgKlxuICogQHB1YmxpY0FwaVxuKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHByb2plY3Rpb24oXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIHNlbGVjdG9ySW5kZXg6IG51bWJlciA9IDAsIGF0dHJzPzogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0UHJvamVjdGlvbk5vZGUgPVxuICAgICAgY3JlYXRlTm9kZUF0SW5kZXgobm9kZUluZGV4LCBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbnVsbCwgbnVsbCwgYXR0cnMgfHwgbnVsbCk7XG5cbiAgLy8gV2UgY2FuJ3QgdXNlIHZpZXdEYXRhW0hPU1RfTk9ERV0gYmVjYXVzZSBwcm9qZWN0aW9uIG5vZGVzIGNhbiBiZSBuZXN0ZWQgaW4gZW1iZWRkZWQgdmlld3MuXG4gIGlmICh0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9PT0gbnVsbCkgdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24gPSBzZWxlY3RvckluZGV4O1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIHNldElzUGFyZW50KGZhbHNlKTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBhcHBlbmRQcm9qZWN0ZWROb2RlcyhsVmlldywgdFByb2plY3Rpb25Ob2RlLCBzZWxlY3RvckluZGV4LCBmaW5kQ29tcG9uZW50VmlldyhsVmlldykpO1xufVxuIl19