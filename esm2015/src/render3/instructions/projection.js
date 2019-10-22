/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { newArray } from '../../util/array_utils';
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
 * @param {?} tNode
 * @param {?} projectionSlots
 * @return {?}
 */
export function matchingProjectionSlotIndex(tNode, projectionSlots) {
    /** @type {?} */
    let wildcardNgContentIndex = null;
    /** @type {?} */
    const ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (let i = 0; i < projectionSlots.length; i++) {
        /** @type {?} */
        const slotValue = projectionSlots[i];
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
 * \@codeGenApi
 * @param {?=} projectionSlots
 * @return {?}
 */
export function ɵɵprojectionDef(projectionSlots) {
    /** @type {?} */
    const componentNode = (/** @type {?} */ (findComponentView(getLView())[T_HOST]));
    if (!componentNode.projection) {
        // If no explicit projection slots are defined, fall back to a single
        // projection slot with the wildcard selector.
        /** @type {?} */
        const numProjectionSlots = projectionSlots ? projectionSlots.length : 1;
        /** @type {?} */
        const projectionHeads = componentNode.projection =
            newArray(numProjectionSlots, (/** @type {?} */ ((/** @type {?} */ (null)))));
        /** @type {?} */
        const tails = projectionHeads.slice();
        /** @type {?} */
        let componentChild = componentNode.child;
        while (componentChild !== null) {
            /** @type {?} */
            const slotIndex = projectionSlots ? matchingProjectionSlotIndex(componentChild, projectionSlots) : 0;
            if (slotIndex !== null) {
                if (tails[slotIndex]) {
                    (/** @type {?} */ (tails[slotIndex])).projectionNext = componentChild;
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
/** @type {?} */
let delayProjection = false;
/**
 * @param {?} value
 * @return {?}
 */
export function setDelayProjection(value) {
    delayProjection = value;
}
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * \@codeGenApi
 * @param {?} nodeIndex
 * @param {?=} selectorIndex
 * @param {?=} attrs
 * @return {?}
 */
export function ɵɵprojection(nodeIndex, selectorIndex = 0, attrs) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tProjectionNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], nodeIndex, 1 /* Projection */, null, attrs || null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3Byb2plY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHaEQsT0FBTyxFQUFDLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLDBCQUEwQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckgsT0FBTyxFQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFL0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7QUFZMUMsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEtBQVksRUFBRSxlQUFnQzs7UUFFcEYsc0JBQXNCLEdBQUcsSUFBSTs7VUFDM0Isa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDO0lBQ3ZELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztjQUN6QyxTQUFTLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUNwQyxpRkFBaUY7UUFDakYsK0VBQStFO1FBQy9FLElBQUksU0FBUyxLQUFLLEdBQUcsRUFBRTtZQUNyQixzQkFBc0IsR0FBRyxDQUFDLENBQUM7WUFDM0IsU0FBUztTQUNWO1FBQ0QsaUZBQWlGO1FBQ2pGLGlGQUFpRjtRQUNqRixJQUFJLGtCQUFrQixLQUFLLElBQUksQ0FBQyxDQUFDO1lBQ3pCLDBCQUEwQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRSx3QkFBd0IsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLENBQUMsRUFBRTtZQUMvRCxPQUFPLENBQUMsQ0FBQyxDQUFFLGtEQUFrRDtTQUM5RDtLQUNGO0lBQ0QsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCRCxNQUFNLFVBQVUsZUFBZSxDQUFDLGVBQWlDOztVQUN6RCxhQUFhLEdBQUcsbUJBQUEsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBZ0I7SUFFM0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUU7Ozs7Y0FHdkIsa0JBQWtCLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztjQUNqRSxlQUFlLEdBQXFCLGFBQWEsQ0FBQyxVQUFVO1lBQzlELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxtQkFBQSxtQkFBQSxJQUFJLEVBQUUsRUFBUSxDQUFDOztjQUMxQyxLQUFLLEdBQXFCLGVBQWUsQ0FBQyxLQUFLLEVBQUU7O1lBRW5ELGNBQWMsR0FBZSxhQUFhLENBQUMsS0FBSztRQUVwRCxPQUFPLGNBQWMsS0FBSyxJQUFJLEVBQUU7O2tCQUN4QixTQUFTLEdBQ1gsZUFBZSxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO2dCQUN0QixJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDcEIsbUJBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztpQkFDcEQ7cUJBQU07b0JBQ0wsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLGNBQWMsQ0FBQztpQkFDN0M7Z0JBQ0QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLGNBQWMsQ0FBQzthQUNuQztZQUVELGNBQWMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO1NBQ3RDO0tBQ0Y7QUFDSCxDQUFDOztJQUVHLGVBQWUsR0FBRyxLQUFLOzs7OztBQUMzQixNQUFNLFVBQVUsa0JBQWtCLENBQUMsS0FBYztJQUMvQyxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzFCLENBQUM7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxVQUFVLFlBQVksQ0FDeEIsU0FBaUIsRUFBRSxnQkFBd0IsQ0FBQyxFQUFFLEtBQW1COztVQUM3RCxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixlQUFlLEdBQUcsZ0JBQWdCLENBQ3BDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxzQkFBd0IsSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLENBQUM7SUFFdEYsNkZBQTZGO0lBQzdGLElBQUksZUFBZSxDQUFDLFVBQVUsS0FBSyxJQUFJO1FBQUUsZUFBZSxDQUFDLFVBQVUsR0FBRyxhQUFhLENBQUM7SUFFcEYsZ0NBQWdDO0lBQ2hDLGNBQWMsRUFBRSxDQUFDO0lBRWpCLDRGQUE0RjtJQUM1RixJQUFJLENBQUMsZUFBZSxFQUFFO1FBQ3BCLDZFQUE2RTtRQUM3RSxlQUFlLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0tBQ3pDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7bmV3QXJyYXl9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtUQXR0cmlidXRlcywgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQcm9qZWN0aW9uU2xvdHN9IGZyb20gJy4uL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge1RWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGx5UHJvamVjdGlvbn0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRQcm9qZWN0QXNBdHRyVmFsdWUsIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBpc1NlbGVjdG9ySW5TZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2dldExWaWV3LCBzZXRJc05vdFBhcmVudH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbmltcG9ydCB7Z2V0T3JDcmVhdGVUTm9kZX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBDaGVja3MgYSBnaXZlbiBub2RlIGFnYWluc3QgbWF0Y2hpbmcgcHJvamVjdGlvbiBzbG90cyBhbmQgcmV0dXJucyB0aGVcbiAqIGRldGVybWluZWQgc2xvdCBpbmRleC4gUmV0dXJucyBcIm51bGxcIiBpZiBubyBzbG90IG1hdGNoZWQgdGhlIGdpdmVuIG5vZGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBpbnRvIGFjY291bnQgdGhlIHBhcnNlZCBuZ1Byb2plY3RBcyBzZWxlY3RvciBmcm9tIHRoZVxuICogbm9kZSdzIGF0dHJpYnV0ZXMuIElmIHByZXNlbnQsIGl0IHdpbGwgY2hlY2sgd2hldGhlciB0aGUgbmdQcm9qZWN0QXMgc2VsZWN0b3JcbiAqIG1hdGNoZXMgYW55IG9mIHRoZSBwcm9qZWN0aW9uIHNsb3Qgc2VsZWN0b3JzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdQcm9qZWN0aW9uU2xvdEluZGV4KHROb2RlOiBUTm9kZSwgcHJvamVjdGlvblNsb3RzOiBQcm9qZWN0aW9uU2xvdHMpOiBudW1iZXJ8XG4gICAgbnVsbCB7XG4gIGxldCB3aWxkY2FyZE5nQ29udGVudEluZGV4ID0gbnVsbDtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9qZWN0aW9uU2xvdHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBzbG90VmFsdWUgPSBwcm9qZWN0aW9uU2xvdHNbaV07XG4gICAgLy8gVGhlIGxhc3Qgd2lsZGNhcmQgcHJvamVjdGlvbiBzbG90IHNob3VsZCBtYXRjaCBhbGwgbm9kZXMgd2hpY2ggYXJlbid0IG1hdGNoaW5nXG4gICAgLy8gYW55IHNlbGVjdG9yLiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBiZSBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIHZpZXcgZW5naW5lLlxuICAgIGlmIChzbG90VmFsdWUgPT09ICcqJykge1xuICAgICAgd2lsZGNhcmROZ0NvbnRlbnRJbmRleCA9IGk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gSWYgd2UgcmFuIGludG8gYW4gYG5nUHJvamVjdEFzYCBhdHRyaWJ1dGUsIHdlIHNob3VsZCBtYXRjaCBpdHMgcGFyc2VkIHNlbGVjdG9yXG4gICAgLy8gdG8gdGhlIGxpc3Qgb2Ygc2VsZWN0b3JzLCBvdGhlcndpc2Ugd2UgZmFsbCBiYWNrIHRvIG1hdGNoaW5nIGFnYWluc3QgdGhlIG5vZGUuXG4gICAgaWYgKG5nUHJvamVjdEFzQXR0clZhbCA9PT0gbnVsbCA/XG4gICAgICAgICAgICBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgc2xvdFZhbHVlLCAvKiBpc1Byb2plY3Rpb25Nb2RlICovIHRydWUpIDpcbiAgICAgICAgICAgIGlzU2VsZWN0b3JJblNlbGVjdG9yTGlzdChuZ1Byb2plY3RBc0F0dHJWYWwsIHNsb3RWYWx1ZSkpIHtcbiAgICAgIHJldHVybiBpOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gd2lsZGNhcmROZ0NvbnRlbnRJbmRleDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHByb2plY3Rpb25TbG90cz8gQSBjb2xsZWN0aW9uIG9mIHByb2plY3Rpb24gc2xvdHMuIEEgcHJvamVjdGlvbiBzbG90IGNhbiBiZSBiYXNlZFxuICogICAgICAgIG9uIGEgcGFyc2VkIENTUyBzZWxlY3RvcnMgb3Igc2V0IHRvIHRoZSB3aWxkY2FyZCBzZWxlY3RvciAoXCIqXCIpIGluIG9yZGVyIHRvIG1hdGNoXG4gKiAgICAgICAgYWxsIG5vZGVzIHdoaWNoIGRvIG5vdCBtYXRjaCBhbnkgc2VsZWN0b3IuIElmIG5vdCBzcGVjaWZpZWQsIGEgc2luZ2xlIHdpbGRjYXJkXG4gKiAgICAgICAgc2VsZWN0b3IgcHJvamVjdGlvbiBzbG90IHdpbGwgYmUgZGVmaW5lZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb2plY3Rpb25EZWYocHJvamVjdGlvblNsb3RzPzogUHJvamVjdGlvblNsb3RzKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50VmlldyhnZXRMVmlldygpKVtUX0hPU1RdIGFzIFRFbGVtZW50Tm9kZTtcblxuICBpZiAoIWNvbXBvbmVudE5vZGUucHJvamVjdGlvbikge1xuICAgIC8vIElmIG5vIGV4cGxpY2l0IHByb2plY3Rpb24gc2xvdHMgYXJlIGRlZmluZWQsIGZhbGwgYmFjayB0byBhIHNpbmdsZVxuICAgIC8vIHByb2plY3Rpb24gc2xvdCB3aXRoIHRoZSB3aWxkY2FyZCBzZWxlY3Rvci5cbiAgICBjb25zdCBudW1Qcm9qZWN0aW9uU2xvdHMgPSBwcm9qZWN0aW9uU2xvdHMgPyBwcm9qZWN0aW9uU2xvdHMubGVuZ3RoIDogMTtcbiAgICBjb25zdCBwcm9qZWN0aW9uSGVhZHM6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXdBcnJheShudW1Qcm9qZWN0aW9uU2xvdHMsIG51bGwgIWFzIFROb2RlKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHByb2plY3Rpb25IZWFkcy5zbGljZSgpO1xuXG4gICAgbGV0IGNvbXBvbmVudENoaWxkOiBUTm9kZXxudWxsID0gY29tcG9uZW50Tm9kZS5jaGlsZDtcblxuICAgIHdoaWxlIChjb21wb25lbnRDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc2xvdEluZGV4ID1cbiAgICAgICAgICBwcm9qZWN0aW9uU2xvdHMgPyBtYXRjaGluZ1Byb2plY3Rpb25TbG90SW5kZXgoY29tcG9uZW50Q2hpbGQsIHByb2plY3Rpb25TbG90cykgOiAwO1xuXG4gICAgICBpZiAoc2xvdEluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh0YWlsc1tzbG90SW5kZXhdKSB7XG4gICAgICAgICAgdGFpbHNbc2xvdEluZGV4XSAhLnByb2plY3Rpb25OZXh0ID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvamVjdGlvbkhlYWRzW3Nsb3RJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcbiAgICAgICAgfVxuICAgICAgICB0YWlsc1tzbG90SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICB9XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gY29tcG9uZW50Q2hpbGQubmV4dDtcbiAgICB9XG4gIH1cbn1cblxubGV0IGRlbGF5UHJvamVjdGlvbiA9IGZhbHNlO1xuZXhwb3J0IGZ1bmN0aW9uIHNldERlbGF5UHJvamVjdGlvbih2YWx1ZTogYm9vbGVhbikge1xuICBkZWxheVByb2plY3Rpb24gPSB2YWx1ZTtcbn1cblxuXG4vKipcbiAqIEluc2VydHMgcHJldmlvdXNseSByZS1kaXN0cmlidXRlZCBwcm9qZWN0ZWQgbm9kZXMuIFRoaXMgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBwcmVjZWRlZCBieSBhIGNhbGxcbiAqIHRvIHRoZSBwcm9qZWN0aW9uRGVmIGluc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXhcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4OlxuICogICAgICAgIC0gMCB3aGVuIHRoZSBzZWxlY3RvciBpcyBgKmAgKG9yIHVuc3BlY2lmaWVkIGFzIHRoaXMgaXMgdGhlIGRlZmF1bHQgdmFsdWUpLFxuICogICAgICAgIC0gMSBiYXNlZCBpbmRleCBvZiB0aGUgc2VsZWN0b3IgZnJvbSB0aGUge0BsaW5rIHByb2plY3Rpb25EZWZ9XG4gKlxuICogQGNvZGVHZW5BcGlcbiovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb2plY3Rpb24oXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIHNlbGVjdG9ySW5kZXg6IG51bWJlciA9IDAsIGF0dHJzPzogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0UHJvamVjdGlvbk5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKFxuICAgICAgbFZpZXdbVFZJRVddLCBsVmlld1tUX0hPU1RdLCBub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgc2V0SXNOb3RQYXJlbnQoKTtcblxuICAvLyBXZSBtaWdodCBuZWVkIHRvIGRlbGF5IHRoZSBwcm9qZWN0aW9uIG9mIG5vZGVzIGlmIHRoZXkgYXJlIGluIHRoZSBtaWRkbGUgb2YgYW4gaTE4biBibG9ja1xuICBpZiAoIWRlbGF5UHJvamVjdGlvbikge1xuICAgIC8vIHJlLWRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0YWJsZSBub2RlcyBpcyBzdG9yZWQgb24gYSBjb21wb25lbnQncyB2aWV3IGxldmVsXG4gICAgYXBwbHlQcm9qZWN0aW9uKGxWaWV3LCB0UHJvamVjdGlvbk5vZGUpO1xuICB9XG59XG4iXX0=