/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/projection.ts
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
import { DECLARATION_COMPONENT_VIEW, TVIEW, T_HOST } from '../interfaces/view';
import { applyProjection } from '../node_manipulation';
import { getProjectAsAttrValue, isNodeMatchingSelectorList, isSelectorInSelectorList } from '../node_selector_matcher';
import { getLView, setIsNotParent } from '../state';
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
    const componentNode = (/** @type {?} */ (getLView()[DECLARATION_COMPONENT_VIEW][T_HOST]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3Byb2plY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR2hELE9BQU8sRUFBQywwQkFBMEIsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDN0UsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSwwQkFBMEIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3JILE9BQU8sRUFBQyxRQUFRLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWTFDLE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxLQUFZLEVBQUUsZUFBZ0M7O1FBRXBGLHNCQUFzQixHQUFHLElBQUk7O1VBQzNCLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQztJQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7Y0FDekMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsaUZBQWlGO1FBQ2pGLCtFQUErRTtRQUMvRSxJQUFJLFNBQVMsS0FBSyxHQUFHLEVBQUU7WUFDckIsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLFNBQVM7U0FDVjtRQUNELGlGQUFpRjtRQUNqRixpRkFBaUY7UUFDakYsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLENBQUMsQ0FBQztZQUN6QiwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0Usd0JBQXdCLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLEVBQUU7WUFDL0QsT0FBTyxDQUFDLENBQUMsQ0FBRSxrREFBa0Q7U0FDOUQ7S0FDRjtJQUNELE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQkQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxlQUFpQzs7VUFDekQsYUFBYSxHQUFHLG1CQUFBLFFBQVEsRUFBRSxDQUFDLDBCQUEwQixDQUFDLENBQUMsTUFBTSxDQUFDLEVBQWdCO0lBRXBGLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFOzs7O2NBR3ZCLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Y0FDakUsZUFBZSxHQUFxQixhQUFhLENBQUMsVUFBVTtZQUM5RCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsbUJBQUEsbUJBQUEsSUFBSSxFQUFFLEVBQVEsQ0FBQzs7Y0FDMUMsS0FBSyxHQUFxQixlQUFlLENBQUMsS0FBSyxFQUFFOztZQUVuRCxjQUFjLEdBQWUsYUFBYSxDQUFDLEtBQUs7UUFFcEQsT0FBTyxjQUFjLEtBQUssSUFBSSxFQUFFOztrQkFDeEIsU0FBUyxHQUNYLGVBQWUsQ0FBQyxDQUFDLENBQUMsMkJBQTJCLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtnQkFDdEIsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ3BCLG1CQUFBLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7aUJBQ3BEO3FCQUFNO29CQUNMLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxjQUFjLENBQUM7aUJBQzdDO2dCQUNELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxjQUFjLENBQUM7YUFDbkM7WUFFRCxjQUFjLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQztTQUN0QztLQUNGO0FBQ0gsQ0FBQzs7SUFFRyxlQUFlLEdBQUcsS0FBSzs7Ozs7QUFDM0IsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEtBQWM7SUFDL0MsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUMxQixDQUFDOzs7Ozs7Ozs7OztBQWNELE1BQU0sVUFBVSxZQUFZLENBQ3hCLFNBQWlCLEVBQUUsZ0JBQXdCLENBQUMsRUFBRSxLQUFtQjs7VUFDN0QsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsZUFBZSxHQUFHLGdCQUFnQixDQUNwQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsc0JBQXdCLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxDQUFDO0lBRXRGLDZGQUE2RjtJQUM3RixJQUFJLGVBQWUsQ0FBQyxVQUFVLEtBQUssSUFBSTtRQUFFLGVBQWUsQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDO0lBRXBGLGdDQUFnQztJQUNoQyxjQUFjLEVBQUUsQ0FBQztJQUVqQiw0RkFBNEY7SUFDNUYsSUFBSSxDQUFDLGVBQWUsRUFBRTtRQUNwQiw2RUFBNkU7UUFDN0UsZUFBZSxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztLQUN6QztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge25ld0FycmF5fSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UHJvamVjdGlvblNsb3RzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwbHlQcm9qZWN0aW9ufSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldFByb2plY3RBc0F0dHJWYWx1ZSwgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIGlzU2VsZWN0b3JJblNlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7Z2V0TFZpZXcsIHNldElzTm90UGFyZW50fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldE9yQ3JlYXRlVE5vZGV9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qKlxuICogQ2hlY2tzIGEgZ2l2ZW4gbm9kZSBhZ2FpbnN0IG1hdGNoaW5nIHByb2plY3Rpb24gc2xvdHMgYW5kIHJldHVybnMgdGhlXG4gKiBkZXRlcm1pbmVkIHNsb3QgaW5kZXguIFJldHVybnMgXCJudWxsXCIgaWYgbm8gc2xvdCBtYXRjaGVkIHRoZSBnaXZlbiBub2RlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgaW50byBhY2NvdW50IHRoZSBwYXJzZWQgbmdQcm9qZWN0QXMgc2VsZWN0b3IgZnJvbSB0aGVcbiAqIG5vZGUncyBhdHRyaWJ1dGVzLiBJZiBwcmVzZW50LCBpdCB3aWxsIGNoZWNrIHdoZXRoZXIgdGhlIG5nUHJvamVjdEFzIHNlbGVjdG9yXG4gKiBtYXRjaGVzIGFueSBvZiB0aGUgcHJvamVjdGlvbiBzbG90IHNlbGVjdG9ycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nUHJvamVjdGlvblNsb3RJbmRleCh0Tm9kZTogVE5vZGUsIHByb2plY3Rpb25TbG90czogUHJvamVjdGlvblNsb3RzKTogbnVtYmVyfFxuICAgIG51bGwge1xuICBsZXQgd2lsZGNhcmROZ0NvbnRlbnRJbmRleCA9IG51bGw7XG4gIGNvbnN0IG5nUHJvamVjdEFzQXR0clZhbCA9IGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdGlvblNsb3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgc2xvdFZhbHVlID0gcHJvamVjdGlvblNsb3RzW2ldO1xuICAgIC8vIFRoZSBsYXN0IHdpbGRjYXJkIHByb2plY3Rpb24gc2xvdCBzaG91bGQgbWF0Y2ggYWxsIG5vZGVzIHdoaWNoIGFyZW4ndCBtYXRjaGluZ1xuICAgIC8vIGFueSBzZWxlY3Rvci4gVGhpcyBpcyBuZWNlc3NhcnkgdG8gYmUgYmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCB2aWV3IGVuZ2luZS5cbiAgICBpZiAoc2xvdFZhbHVlID09PSAnKicpIHtcbiAgICAgIHdpbGRjYXJkTmdDb250ZW50SW5kZXggPSBpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIElmIHdlIHJhbiBpbnRvIGFuIGBuZ1Byb2plY3RBc2AgYXR0cmlidXRlLCB3ZSBzaG91bGQgbWF0Y2ggaXRzIHBhcnNlZCBzZWxlY3RvclxuICAgIC8vIHRvIHRoZSBsaXN0IG9mIHNlbGVjdG9ycywgb3RoZXJ3aXNlIHdlIGZhbGwgYmFjayB0byBtYXRjaGluZyBhZ2FpbnN0IHRoZSBub2RlLlxuICAgIGlmIChuZ1Byb2plY3RBc0F0dHJWYWwgPT09IG51bGwgP1xuICAgICAgICAgICAgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIHNsb3RWYWx1ZSwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyB0cnVlKSA6XG4gICAgICAgICAgICBpc1NlbGVjdG9ySW5TZWxlY3Rvckxpc3QobmdQcm9qZWN0QXNBdHRyVmFsLCBzbG90VmFsdWUpKSB7XG4gICAgICByZXR1cm4gaTsgIC8vIGZpcnN0IG1hdGNoaW5nIHNlbGVjdG9yIFwiY2FwdHVyZXNcIiBhIGdpdmVuIG5vZGVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHdpbGRjYXJkTmdDb250ZW50SW5kZXg7XG59XG5cbi8qKlxuICogSW5zdHJ1Y3Rpb24gdG8gZGlzdHJpYnV0ZSBwcm9qZWN0YWJsZSBub2RlcyBhbW9uZyA8bmctY29udGVudD4gb2NjdXJyZW5jZXMgaW4gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEl0IHRha2VzIGFsbCB0aGUgc2VsZWN0b3JzIGZyb20gdGhlIGVudGlyZSBjb21wb25lbnQncyB0ZW1wbGF0ZSBhbmQgZGVjaWRlcyB3aGVyZVxuICogZWFjaCBwcm9qZWN0ZWQgbm9kZSBiZWxvbmdzIChpdCByZS1kaXN0cmlidXRlcyBub2RlcyBhbW9uZyBcImJ1Y2tldHNcIiB3aGVyZSBlYWNoIFwiYnVja2V0XCIgaXNcbiAqIGJhY2tlZCBieSBhIHNlbGVjdG9yKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlcXVpcmVzIENTUyBzZWxlY3RvcnMgdG8gYmUgcHJvdmlkZWQgaW4gMiBmb3JtczogcGFyc2VkIChieSBhIGNvbXBpbGVyKSBhbmQgdGV4dCxcbiAqIHVuLXBhcnNlZCBmb3JtLlxuICpcbiAqIFRoZSBwYXJzZWQgZm9ybSBpcyBuZWVkZWQgZm9yIGVmZmljaWVudCBtYXRjaGluZyBvZiBhIG5vZGUgYWdhaW5zdCBhIGdpdmVuIENTUyBzZWxlY3Rvci5cbiAqIFRoZSB1bi1wYXJzZWQsIHRleHR1YWwgZm9ybSBpcyBuZWVkZWQgZm9yIHN1cHBvcnQgb2YgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZS5cbiAqXG4gKiBIYXZpbmcgYSBDU1Mgc2VsZWN0b3IgaW4gMiBkaWZmZXJlbnQgZm9ybWF0cyBpcyBub3QgaWRlYWwsIGJ1dCBhbHRlcm5hdGl2ZXMgaGF2ZSBldmVuIG1vcmVcbiAqIGRyYXdiYWNrczpcbiAqIC0gaGF2aW5nIG9ubHkgYSB0ZXh0dWFsIGZvcm0gd291bGQgcmVxdWlyZSBydW50aW1lIHBhcnNpbmcgb2YgQ1NTIHNlbGVjdG9ycztcbiAqIC0gd2UgY2FuJ3QgaGF2ZSBvbmx5IGEgcGFyc2VkIGFzIHdlIGNhbid0IHJlLWNvbnN0cnVjdCB0ZXh0dWFsIGZvcm0gZnJvbSBpdCAoYXMgZW50ZXJlZCBieSBhXG4gKiB0ZW1wbGF0ZSBhdXRob3IpLlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0aW9uU2xvdHM/IEEgY29sbGVjdGlvbiBvZiBwcm9qZWN0aW9uIHNsb3RzLiBBIHByb2plY3Rpb24gc2xvdCBjYW4gYmUgYmFzZWRcbiAqICAgICAgICBvbiBhIHBhcnNlZCBDU1Mgc2VsZWN0b3JzIG9yIHNldCB0byB0aGUgd2lsZGNhcmQgc2VsZWN0b3IgKFwiKlwiKSBpbiBvcmRlciB0byBtYXRjaFxuICogICAgICAgIGFsbCBub2RlcyB3aGljaCBkbyBub3QgbWF0Y2ggYW55IHNlbGVjdG9yLiBJZiBub3Qgc3BlY2lmaWVkLCBhIHNpbmdsZSB3aWxkY2FyZFxuICogICAgICAgIHNlbGVjdG9yIHByb2plY3Rpb24gc2xvdCB3aWxsIGJlIGRlZmluZWQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9qZWN0aW9uRGVmKHByb2plY3Rpb25TbG90cz86IFByb2plY3Rpb25TbG90cyk6IHZvaWQge1xuICBjb25zdCBjb21wb25lbnROb2RlID0gZ2V0TFZpZXcoKVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11bVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnByb2plY3Rpb24pIHtcbiAgICAvLyBJZiBubyBleHBsaWNpdCBwcm9qZWN0aW9uIHNsb3RzIGFyZSBkZWZpbmVkLCBmYWxsIGJhY2sgdG8gYSBzaW5nbGVcbiAgICAvLyBwcm9qZWN0aW9uIHNsb3Qgd2l0aCB0aGUgd2lsZGNhcmQgc2VsZWN0b3IuXG4gICAgY29uc3QgbnVtUHJvamVjdGlvblNsb3RzID0gcHJvamVjdGlvblNsb3RzID8gcHJvamVjdGlvblNsb3RzLmxlbmd0aCA6IDE7XG4gICAgY29uc3QgcHJvamVjdGlvbkhlYWRzOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3QXJyYXkobnVtUHJvamVjdGlvblNsb3RzLCBudWxsICFhcyBUTm9kZSk7XG4gICAgY29uc3QgdGFpbHM6IChUTm9kZSB8IG51bGwpW10gPSBwcm9qZWN0aW9uSGVhZHMuc2xpY2UoKTtcblxuICAgIGxldCBjb21wb25lbnRDaGlsZDogVE5vZGV8bnVsbCA9IGNvbXBvbmVudE5vZGUuY2hpbGQ7XG5cbiAgICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHNsb3RJbmRleCA9XG4gICAgICAgICAgcHJvamVjdGlvblNsb3RzID8gbWF0Y2hpbmdQcm9qZWN0aW9uU2xvdEluZGV4KGNvbXBvbmVudENoaWxkLCBwcm9qZWN0aW9uU2xvdHMpIDogMDtcblxuICAgICAgaWYgKHNsb3RJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICBpZiAodGFpbHNbc2xvdEluZGV4XSkge1xuICAgICAgICAgIHRhaWxzW3Nsb3RJbmRleF0gIS5wcm9qZWN0aW9uTmV4dCA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2plY3Rpb25IZWFkc1tzbG90SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgdGFpbHNbc2xvdEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfVxuXG4gICAgICBjb21wb25lbnRDaGlsZCA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG4gICAgfVxuICB9XG59XG5cbmxldCBkZWxheVByb2plY3Rpb24gPSBmYWxzZTtcbmV4cG9ydCBmdW5jdGlvbiBzZXREZWxheVByb2plY3Rpb24odmFsdWU6IGJvb2xlYW4pIHtcbiAgZGVsYXlQcm9qZWN0aW9uID0gdmFsdWU7XG59XG5cblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICpcbiAqIEBjb2RlR2VuQXBpXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9qZWN0aW9uKFxuICAgIG5vZGVJbmRleDogbnVtYmVyLCBzZWxlY3RvckluZGV4OiBudW1iZXIgPSAwLCBhdHRycz86IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFByb2plY3Rpb25Ob2RlID0gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICAgIGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgbm9kZUluZGV4LCBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbnVsbCwgYXR0cnMgfHwgbnVsbCk7XG5cbiAgLy8gV2UgY2FuJ3QgdXNlIHZpZXdEYXRhW0hPU1RfTk9ERV0gYmVjYXVzZSBwcm9qZWN0aW9uIG5vZGVzIGNhbiBiZSBuZXN0ZWQgaW4gZW1iZWRkZWQgdmlld3MuXG4gIGlmICh0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9PT0gbnVsbCkgdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24gPSBzZWxlY3RvckluZGV4O1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIHNldElzTm90UGFyZW50KCk7XG5cbiAgLy8gV2UgbWlnaHQgbmVlZCB0byBkZWxheSB0aGUgcHJvamVjdGlvbiBvZiBub2RlcyBpZiB0aGV5IGFyZSBpbiB0aGUgbWlkZGxlIG9mIGFuIGkxOG4gYmxvY2tcbiAgaWYgKCFkZWxheVByb2plY3Rpb24pIHtcbiAgICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICAgIGFwcGx5UHJvamVjdGlvbihsVmlldywgdFByb2plY3Rpb25Ob2RlKTtcbiAgfVxufVxuIl19