import { TVIEW, T_HOST } from '../interfaces/view';
import { applyProjection } from '../node_manipulation';
import { getProjectAsAttrValue, isNodeMatchingSelectorList, isSelectorInSelectorList } from '../node_selector_matcher';
import { getLView, setIsNotParent } from '../state';
import { findComponentView } from '../util/view_traversal_utils';
import { getOrCreateTNode } from './shared';
/**
 * Checks a given node against matching projection slots and returns the
 * determined slot index. Returns "null" if no slot matched the given node.
 *
 * This function takes into account the parsed ngProjectAs selector from the
 * node's attributes. If present, it will check whether the ngProjectAs selector
 * matches any of the projection slot selectors.
 */
export function matchingProjectionSlotIndex(tNode, projectionSlots) {
    var wildcardNgContentIndex = null;
    var ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (var i = 0; i < projectionSlots.length; i++) {
        var slotValue = projectionSlots[i];
        // The last wildcard projection slot should match all nodes which aren't matching
        // any selector. This is necessary to be backwards compatible with view engine.
        if (slotValue === '*') {
            wildcardNgContentIndex = i;
            continue;
        }
        // If we ran into an `ngProjectAs` attribute, we should match its parsed selector
        // to the list of selectors, otherwise we fall back to matching against the node.
        if (ngProjectAsAttrVal === null ?
            isNodeMatchingSelectorList(tNode, slotValue, /* isProjectionMode */ true) :
            isSelectorInSelectorList(ngProjectAsAttrVal, slotValue)) {
            return i; // first matching selector "captures" a given node
        }
    }
    return wildcardNgContentIndex;
}
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
 * @param projectionSlots? A collection of projection slots. A projection slot can be based
 *        on a parsed CSS selectors or set to the wildcard selector ("*") in order to match
 *        all nodes which do not match any selector. If not specified, a single wildcard
 *        selector projection slot will be defined.
 *
 * @codeGenApi
 */
export function ɵɵprojectionDef(projectionSlots) {
    var componentNode = findComponentView(getLView())[T_HOST];
    if (!componentNode.projection) {
        // If no explicit projection slots are defined, fall back to a single
        // projection slot with the wildcard selector.
        var numProjectionSlots = projectionSlots ? projectionSlots.length : 1;
        var projectionHeads = componentNode.projection =
            new Array(numProjectionSlots).fill(null);
        var tails = projectionHeads.slice();
        var componentChild = componentNode.child;
        while (componentChild !== null) {
            var slotIndex = projectionSlots ? matchingProjectionSlotIndex(componentChild, projectionSlots) : 0;
            if (slotIndex !== null) {
                if (tails[slotIndex]) {
                    tails[slotIndex].projectionNext = componentChild;
                }
                else {
                    projectionHeads[slotIndex] = componentChild;
                }
                tails[slotIndex] = componentChild;
            }
            componentChild = componentChild.next;
        }
    }
}
var delayProjection = false;
export function setDelayProjection(value) {
    delayProjection = value;
}
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 *
 * @codeGenApi
*/
export function ɵɵprojection(nodeIndex, selectorIndex, attrs) {
    if (selectorIndex === void 0) { selectorIndex = 0; }
    var lView = getLView();
    var tProjectionNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], nodeIndex, 1 /* Projection */, null, attrs || null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    setIsNotParent();
    // We might need to delay the projection of nodes if they are in the middle of an i18n block
    if (!delayProjection) {
        // re-distribution of projectable nodes is stored on a component's view level
        applyProjection(lView, tProjectionNode);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3Byb2plY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLDBCQUEwQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckgsT0FBTyxFQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFL0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSTFDOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsMkJBQTJCLENBQUMsS0FBWSxFQUFFLGVBQWdDO0lBRXhGLElBQUksc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLElBQU0sa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDL0MsSUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLGlGQUFpRjtRQUNqRiwrRUFBK0U7UUFDL0UsSUFBSSxTQUFTLEtBQUssR0FBRyxFQUFFO1lBQ3JCLHNCQUFzQixHQUFHLENBQUMsQ0FBQztZQUMzQixTQUFTO1NBQ1Y7UUFDRCxpRkFBaUY7UUFDakYsaUZBQWlGO1FBQ2pGLElBQUksa0JBQWtCLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDekIsMEJBQTBCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNFLHdCQUF3QixDQUFDLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQy9ELE9BQU8sQ0FBQyxDQUFDLENBQUUsa0RBQWtEO1NBQzlEO0tBQ0Y7SUFDRCxPQUFPLHNCQUFzQixDQUFDO0FBQ2hDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FBQyxlQUFpQztJQUMvRCxJQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBaUIsQ0FBQztJQUU1RSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRTtRQUM3QixxRUFBcUU7UUFDckUsOENBQThDO1FBQzlDLElBQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEUsSUFBTSxlQUFlLEdBQXFCLGFBQWEsQ0FBQyxVQUFVO1lBQzlELElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQU0sS0FBSyxHQUFxQixlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFeEQsSUFBSSxjQUFjLEdBQWUsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUVyRCxPQUFPLGNBQWMsS0FBSyxJQUFJLEVBQUU7WUFDOUIsSUFBTSxTQUFTLEdBQ1gsZUFBZSxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV2RixJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RCLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFO29CQUNwQixLQUFLLENBQUMsU0FBUyxDQUFHLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztpQkFDcEQ7cUJBQU07b0JBQ0wsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLGNBQWMsQ0FBQztpQkFDN0M7Z0JBQ0QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLGNBQWMsQ0FBQzthQUNuQztZQUVELGNBQWMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO1NBQ3RDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzVCLE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxLQUFjO0lBQy9DLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDMUIsQ0FBQztBQUdEOzs7Ozs7Ozs7O0VBVUU7QUFDRixNQUFNLFVBQVUsWUFBWSxDQUN4QixTQUFpQixFQUFFLGFBQXlCLEVBQUUsS0FBbUI7SUFBOUMsOEJBQUEsRUFBQSxpQkFBeUI7SUFDOUMsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxlQUFlLEdBQUcsZ0JBQWdCLENBQ3BDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxzQkFBd0IsSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQztJQUV2Riw2RkFBNkY7SUFDN0YsSUFBSSxlQUFlLENBQUMsVUFBVSxLQUFLLElBQUk7UUFBRSxlQUFlLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQztJQUVwRixnQ0FBZ0M7SUFDaEMsY0FBYyxFQUFFLENBQUM7SUFFakIsNEZBQTRGO0lBQzVGLElBQUksQ0FBQyxlQUFlLEVBQUU7UUFDcEIsNkVBQTZFO1FBQzdFLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUM7S0FDekM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtUQXR0cmlidXRlcywgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQcm9qZWN0aW9uU2xvdHN9IGZyb20gJy4uL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1RWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGx5UHJvamVjdGlvbn0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRQcm9qZWN0QXNBdHRyVmFsdWUsIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBpc1NlbGVjdG9ySW5TZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2dldExWaWV3LCBzZXRJc05vdFBhcmVudH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbmltcG9ydCB7Z2V0T3JDcmVhdGVUTm9kZX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBDaGVja3MgYSBnaXZlbiBub2RlIGFnYWluc3QgbWF0Y2hpbmcgcHJvamVjdGlvbiBzbG90cyBhbmQgcmV0dXJucyB0aGVcbiAqIGRldGVybWluZWQgc2xvdCBpbmRleC4gUmV0dXJucyBcIm51bGxcIiBpZiBubyBzbG90IG1hdGNoZWQgdGhlIGdpdmVuIG5vZGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBpbnRvIGFjY291bnQgdGhlIHBhcnNlZCBuZ1Byb2plY3RBcyBzZWxlY3RvciBmcm9tIHRoZVxuICogbm9kZSdzIGF0dHJpYnV0ZXMuIElmIHByZXNlbnQsIGl0IHdpbGwgY2hlY2sgd2hldGhlciB0aGUgbmdQcm9qZWN0QXMgc2VsZWN0b3JcbiAqIG1hdGNoZXMgYW55IG9mIHRoZSBwcm9qZWN0aW9uIHNsb3Qgc2VsZWN0b3JzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdQcm9qZWN0aW9uU2xvdEluZGV4KHROb2RlOiBUTm9kZSwgcHJvamVjdGlvblNsb3RzOiBQcm9qZWN0aW9uU2xvdHMpOiBudW1iZXJ8XG4gICAgbnVsbCB7XG4gIGxldCB3aWxkY2FyZE5nQ29udGVudEluZGV4ID0gbnVsbDtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9qZWN0aW9uU2xvdHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzbG90VmFsdWUgPSBwcm9qZWN0aW9uU2xvdHNbaV07XG4gICAgLy8gVGhlIGxhc3Qgd2lsZGNhcmQgcHJvamVjdGlvbiBzbG90IHNob3VsZCBtYXRjaCBhbGwgbm9kZXMgd2hpY2ggYXJlbid0IG1hdGNoaW5nXG4gICAgLy8gYW55IHNlbGVjdG9yLiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBiZSBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIHZpZXcgZW5naW5lLlxuICAgIGlmIChzbG90VmFsdWUgPT09ICcqJykge1xuICAgICAgd2lsZGNhcmROZ0NvbnRlbnRJbmRleCA9IGk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gSWYgd2UgcmFuIGludG8gYW4gYG5nUHJvamVjdEFzYCBhdHRyaWJ1dGUsIHdlIHNob3VsZCBtYXRjaCBpdHMgcGFyc2VkIHNlbGVjdG9yXG4gICAgLy8gdG8gdGhlIGxpc3Qgb2Ygc2VsZWN0b3JzLCBvdGhlcndpc2Ugd2UgZmFsbCBiYWNrIHRvIG1hdGNoaW5nIGFnYWluc3QgdGhlIG5vZGUuXG4gICAgaWYgKG5nUHJvamVjdEFzQXR0clZhbCA9PT0gbnVsbCA/XG4gICAgICAgICAgICBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgc2xvdFZhbHVlLCAvKiBpc1Byb2plY3Rpb25Nb2RlICovIHRydWUpIDpcbiAgICAgICAgICAgIGlzU2VsZWN0b3JJblNlbGVjdG9yTGlzdChuZ1Byb2plY3RBc0F0dHJWYWwsIHNsb3RWYWx1ZSkpIHtcbiAgICAgIHJldHVybiBpOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gd2lsZGNhcmROZ0NvbnRlbnRJbmRleDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHByb2plY3Rpb25TbG90cz8gQSBjb2xsZWN0aW9uIG9mIHByb2plY3Rpb24gc2xvdHMuIEEgcHJvamVjdGlvbiBzbG90IGNhbiBiZSBiYXNlZFxuICogICAgICAgIG9uIGEgcGFyc2VkIENTUyBzZWxlY3RvcnMgb3Igc2V0IHRvIHRoZSB3aWxkY2FyZCBzZWxlY3RvciAoXCIqXCIpIGluIG9yZGVyIHRvIG1hdGNoXG4gKiAgICAgICAgYWxsIG5vZGVzIHdoaWNoIGRvIG5vdCBtYXRjaCBhbnkgc2VsZWN0b3IuIElmIG5vdCBzcGVjaWZpZWQsIGEgc2luZ2xlIHdpbGRjYXJkXG4gKiAgICAgICAgc2VsZWN0b3IgcHJvamVjdGlvbiBzbG90IHdpbGwgYmUgZGVmaW5lZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb2plY3Rpb25EZWYocHJvamVjdGlvblNsb3RzPzogUHJvamVjdGlvblNsb3RzKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50VmlldyhnZXRMVmlldygpKVtUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcblxuICBpZiAoIWNvbXBvbmVudE5vZGUucHJvamVjdGlvbikge1xuICAgIC8vIElmIG5vIGV4cGxpY2l0IHByb2plY3Rpb24gc2xvdHMgYXJlIGRlZmluZWQsIGZhbGwgYmFjayB0byBhIHNpbmdsZVxuICAgIC8vIHByb2plY3Rpb24gc2xvdCB3aXRoIHRoZSB3aWxkY2FyZCBzZWxlY3Rvci5cbiAgICBjb25zdCBudW1Qcm9qZWN0aW9uU2xvdHMgPSBwcm9qZWN0aW9uU2xvdHMgPyBwcm9qZWN0aW9uU2xvdHMubGVuZ3RoIDogMTtcbiAgICBjb25zdCBwcm9qZWN0aW9uSGVhZHM6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXcgQXJyYXkobnVtUHJvamVjdGlvblNsb3RzKS5maWxsKG51bGwpO1xuICAgIGNvbnN0IHRhaWxzOiAoVE5vZGUgfCBudWxsKVtdID0gcHJvamVjdGlvbkhlYWRzLnNsaWNlKCk7XG5cbiAgICBsZXQgY29tcG9uZW50Q2hpbGQ6IFROb2RlfG51bGwgPSBjb21wb25lbnROb2RlLmNoaWxkO1xuXG4gICAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBzbG90SW5kZXggPVxuICAgICAgICAgIHByb2plY3Rpb25TbG90cyA/IG1hdGNoaW5nUHJvamVjdGlvblNsb3RJbmRleChjb21wb25lbnRDaGlsZCwgcHJvamVjdGlvblNsb3RzKSA6IDA7XG5cbiAgICAgIGlmIChzbG90SW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHRhaWxzW3Nsb3RJbmRleF0pIHtcbiAgICAgICAgICB0YWlsc1tzbG90SW5kZXhdICEucHJvamVjdGlvbk5leHQgPSBjb21wb25lbnRDaGlsZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9qZWN0aW9uSGVhZHNbc2xvdEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgICB9XG4gICAgICAgIHRhaWxzW3Nsb3RJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH1cblxuICAgICAgY29tcG9uZW50Q2hpbGQgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG5sZXQgZGVsYXlQcm9qZWN0aW9uID0gZmFsc2U7XG5leHBvcnQgZnVuY3Rpb24gc2V0RGVsYXlQcm9qZWN0aW9uKHZhbHVlOiBib29sZWFuKSB7XG4gIGRlbGF5UHJvamVjdGlvbiA9IHZhbHVlO1xufVxuXG5cbi8qKlxuICogSW5zZXJ0cyBwcmV2aW91c2x5IHJlLWRpc3RyaWJ1dGVkIHByb2plY3RlZCBub2Rlcy4gVGhpcyBpbnN0cnVjdGlvbiBtdXN0IGJlIHByZWNlZGVkIGJ5IGEgY2FsbFxuICogdG8gdGhlIHByb2plY3Rpb25EZWYgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqXG4gKiBAY29kZUdlbkFwaVxuKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cHJvamVjdGlvbihcbiAgICBub2RlSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBUQXR0cmlidXRlcyk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgICBsVmlld1tUVklFV10sIGxWaWV3W1RfSE9TVF0sIG5vZGVJbmRleCwgVE5vZGVUeXBlLlByb2plY3Rpb24sIG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIC8vIFdlIGNhbid0IHVzZSB2aWV3RGF0YVtIT1NUX05PREVdIGJlY2F1c2UgcHJvamVjdGlvbiBub2RlcyBjYW4gYmUgbmVzdGVkIGluIGVtYmVkZGVkIHZpZXdzLlxuICBpZiAodFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24gPT09IG51bGwpIHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID0gc2VsZWN0b3JJbmRleDtcblxuICAvLyBgPG5nLWNvbnRlbnQ+YCBoYXMgbm8gY29udGVudFxuICBzZXRJc05vdFBhcmVudCgpO1xuXG4gIC8vIFdlIG1pZ2h0IG5lZWQgdG8gZGVsYXkgdGhlIHByb2plY3Rpb24gb2Ygbm9kZXMgaWYgdGhleSBhcmUgaW4gdGhlIG1pZGRsZSBvZiBhbiBpMThuIGJsb2NrXG4gIGlmICghZGVsYXlQcm9qZWN0aW9uKSB7XG4gICAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIHN0b3JlZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgICBhcHBseVByb2plY3Rpb24obFZpZXcsIHRQcm9qZWN0aW9uTm9kZSk7XG4gIH1cbn1cbiJdfQ==