/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';
import { prepareI18nBlockForHydration } from '../../hydration/i18n';
import { assertDefined } from '../../util/assert';
import { bindingUpdated } from '../bindings';
import { applyCreateOpCodes, applyI18n, setMaskBit } from '../i18n/i18n_apply';
import { i18nAttributesFirstPass, i18nStartFirstCreatePass } from '../i18n/i18n_parse';
import { i18nPostprocess } from '../i18n/i18n_postprocess';
import { DECLARATION_COMPONENT_VIEW, FLAGS, HEADER_OFFSET, T_HOST, } from '../interfaces/view';
import { getClosestRElement } from '../node_manipulation';
import { getCurrentParentTNode, getLView, getTView, nextBindingIndex, setInI18nBlock, } from '../state';
import { getConstant } from '../util/view_utils';
/**
 * Marks a block of text as translatable.
 *
 * The instructions `i18nStart` and `i18nEnd` mark the translation block in the template.
 * The translation `message` is the value which is locale specific. The translation string may
 * contain placeholders which associate inner elements and sub-templates within the translation.
 *
 * The translation `message` placeholders are:
 * - `�{index}(:{block})�`: *Binding Placeholder*: Marks a location where an expression will be
 *   interpolated into. The placeholder `index` points to the expression binding index. An optional
 *   `block` that matches the sub-template in which it was declared.
 * - `�#{index}(:{block})�`/`�/#{index}(:{block})�`: *Element Placeholder*:  Marks the beginning
 *   and end of DOM element that were embedded in the original translation block. The placeholder
 *   `index` points to the element index in the template instructions set. An optional `block` that
 *   matches the sub-template in which it was declared.
 * - `�*{index}:{block}�`/`�/*{index}:{block}�`: *Sub-template Placeholder*: Sub-templates must be
 *   split up and translated separately in each angular template function. The `index` points to the
 *   `template` instruction index. A `block` that matches the sub-template in which it was declared.
 *
 * @param index A unique index of the translation in the static block.
 * @param messageIndex An index of the translation message from the `def.consts` array.
 * @param subTemplateIndex Optional sub-template index in the `message`.
 *
 * @codeGenApi
 */
export function ɵɵi18nStart(index, messageIndex, subTemplateIndex = -1) {
    const tView = getTView();
    const lView = getLView();
    const adjustedIndex = HEADER_OFFSET + index;
    ngDevMode && assertDefined(tView, `tView should be defined`);
    const message = getConstant(tView.consts, messageIndex);
    const parentTNode = getCurrentParentTNode();
    if (tView.firstCreatePass) {
        i18nStartFirstCreatePass(tView, parentTNode === null ? 0 : parentTNode.index, lView, adjustedIndex, message, subTemplateIndex);
    }
    // Set a flag that this LView has i18n blocks.
    // The flag is later used to determine whether this component should
    // be hydrated (currently hydration is not supported for i18n blocks).
    if (tView.type === 2 /* TViewType.Embedded */) {
        // Annotate host component's LView (not embedded view's LView),
        // since hydration can be skipped on per-component basis only.
        const componentLView = lView[DECLARATION_COMPONENT_VIEW];
        componentLView[FLAGS] |= 32 /* LViewFlags.HasI18n */;
    }
    else {
        lView[FLAGS] |= 32 /* LViewFlags.HasI18n */;
    }
    const tI18n = tView.data[adjustedIndex];
    const sameViewParentTNode = parentTNode === lView[T_HOST] ? null : parentTNode;
    const parentRNode = getClosestRElement(tView, sameViewParentTNode, lView);
    // If `parentTNode` is an `ElementContainer` than it has `<!--ng-container--->`.
    // When we do inserts we have to make sure to insert in front of `<!--ng-container--->`.
    const insertInFrontOf = parentTNode && parentTNode.type & 8 /* TNodeType.ElementContainer */ ? lView[parentTNode.index] : null;
    prepareI18nBlockForHydration(lView, adjustedIndex, parentTNode, subTemplateIndex);
    applyCreateOpCodes(lView, tI18n.create, parentRNode, insertInFrontOf);
    setInI18nBlock(true);
}
/**
 * Translates a translation block marked by `i18nStart` and `i18nEnd`. It inserts the text/ICU nodes
 * into the render tree, moves the placeholder nodes and removes the deleted nodes.
 *
 * @codeGenApi
 */
export function ɵɵi18nEnd() {
    setInI18nBlock(false);
}
/**
 *
 * Use this instruction to create a translation block that doesn't contain any placeholder.
 * It calls both {@link i18nStart} and {@link i18nEnd} in one instruction.
 *
 * The translation `message` is the value which is locale specific. The translation string may
 * contain placeholders which associate inner elements and sub-templates within the translation.
 *
 * The translation `message` placeholders are:
 * - `�{index}(:{block})�`: *Binding Placeholder*: Marks a location where an expression will be
 *   interpolated into. The placeholder `index` points to the expression binding index. An optional
 *   `block` that matches the sub-template in which it was declared.
 * - `�#{index}(:{block})�`/`�/#{index}(:{block})�`: *Element Placeholder*:  Marks the beginning
 *   and end of DOM element that were embedded in the original translation block. The placeholder
 *   `index` points to the element index in the template instructions set. An optional `block` that
 *   matches the sub-template in which it was declared.
 * - `�*{index}:{block}�`/`�/*{index}:{block}�`: *Sub-template Placeholder*: Sub-templates must be
 *   split up and translated separately in each angular template function. The `index` points to the
 *   `template` instruction index. A `block` that matches the sub-template in which it was declared.
 *
 * @param index A unique index of the translation in the static block.
 * @param messageIndex An index of the translation message from the `def.consts` array.
 * @param subTemplateIndex Optional sub-template index in the `message`.
 *
 * @codeGenApi
 */
export function ɵɵi18n(index, messageIndex, subTemplateIndex) {
    ɵɵi18nStart(index, messageIndex, subTemplateIndex);
    ɵɵi18nEnd();
}
/**
 * Marks a list of attributes as translatable.
 *
 * @param index A unique index in the static block
 * @param values
 *
 * @codeGenApi
 */
export function ɵɵi18nAttributes(index, attrsIndex) {
    const tView = getTView();
    ngDevMode && assertDefined(tView, `tView should be defined`);
    const attrs = getConstant(tView.consts, attrsIndex);
    i18nAttributesFirstPass(tView, index + HEADER_OFFSET, attrs);
}
/**
 * Stores the values of the bindings during each update cycle in order to determine if we need to
 * update the translated nodes.
 *
 * @param value The binding's value
 * @returns This function returns itself so that it may be chained
 * (e.g. `i18nExp(ctx.name)(ctx.title)`)
 *
 * @codeGenApi
 */
export function ɵɵi18nExp(value) {
    const lView = getLView();
    setMaskBit(bindingUpdated(lView, nextBindingIndex(), value));
    return ɵɵi18nExp;
}
/**
 * Updates a translation block or an i18n attribute when the bindings have changed.
 *
 * @param index Index of either {@link i18nStart} (translation block) or {@link i18nAttributes}
 * (i18n attribute) on which it should update the content.
 *
 * @codeGenApi
 */
export function ɵɵi18nApply(index) {
    applyI18n(getTView(), getLView(), index + HEADER_OFFSET);
}
/**
 * Handles message string post-processing for internationalization.
 *
 * Handles message string post-processing by transforming it from intermediate
 * format (that might contain some markers that we need to replace) to the final
 * form, consumable by i18nStart instruction. Post processing steps include:
 *
 * 1. Resolve all multi-value cases (like [�*1:1��#2:1�|�#4:1�|�5�])
 * 2. Replace all ICU vars (like "VAR_PLURAL")
 * 3. Replace all placeholders used inside ICUs in a form of {PLACEHOLDER}
 * 4. Replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�)
 *    in case multiple ICUs have the same placeholder name
 *
 * @param message Raw translation string for post processing
 * @param replacements Set of replacements that should be applied
 *
 * @returns Transformed string that can be consumed by i18nStart instruction
 *
 * @codeGenApi
 */
export function ɵɵi18nPostprocess(message, replacements = {}) {
    return i18nPostprocess(message, replacements);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2kxOG4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyx3QkFBd0IsQ0FBQztBQUNoQyxPQUFPLGlDQUFpQyxDQUFDO0FBRXpDLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDN0UsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHdCQUF3QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDckYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBR3pELE9BQU8sRUFDTCwwQkFBMEIsRUFDMUIsS0FBSyxFQUNMLGFBQWEsRUFFYixNQUFNLEdBRVAsTUFBTSxvQkFBb0IsQ0FBQztBQUM1QixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLFFBQVEsRUFDUixRQUFRLEVBQ1IsZ0JBQWdCLEVBQ2hCLGNBQWMsR0FDZixNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFL0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdCRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQ3pCLEtBQWEsRUFDYixZQUFvQixFQUNwQixtQkFBMkIsQ0FBQyxDQUFDO0lBRTdCLE1BQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pC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QU0sVUFBVSxTQUFTLENBQUksS0FBUTtJQUNuQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixVQUFVLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDN0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQWE7SUFDdkMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQy9CLE9BQWUsRUFDZixlQUFtRCxFQUFFO0lBRXJELE9BQU8sZUFBZSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztBQUNoRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0ICcuLi8uLi91dGlsL25nX2kxOG5fY2xvc3VyZV9tb2RlJztcblxuaW1wb3J0IHtwcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9ufSBmcm9tICcuLi8uLi9oeWRyYXRpb24vaTE4bic7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7YXBwbHlDcmVhdGVPcENvZGVzLCBhcHBseUkxOG4sIHNldE1hc2tCaXR9IGZyb20gJy4uL2kxOG4vaTE4bl9hcHBseSc7XG5pbXBvcnQge2kxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzLCBpMThuU3RhcnRGaXJzdENyZWF0ZVBhc3N9IGZyb20gJy4uL2kxOG4vaTE4bl9wYXJzZSc7XG5pbXBvcnQge2kxOG5Qb3N0cHJvY2Vzc30gZnJvbSAnLi4vaTE4bi9pMThuX3Bvc3Rwcm9jZXNzJztcbmltcG9ydCB7VEkxOG59IGZyb20gJy4uL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtcbiAgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsXG4gIEZMQUdTLFxuICBIRUFERVJfT0ZGU0VULFxuICBMVmlld0ZsYWdzLFxuICBUX0hPU1QsXG4gIFRWaWV3VHlwZSxcbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q2xvc2VzdFJFbGVtZW50fSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge1xuICBnZXRDdXJyZW50UGFyZW50VE5vZGUsXG4gIGdldExWaWV3LFxuICBnZXRUVmlldyxcbiAgbmV4dEJpbmRpbmdJbmRleCxcbiAgc2V0SW5JMThuQmxvY2ssXG59IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Q29uc3RhbnR9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbi8qKlxuICogTWFya3MgYSBibG9jayBvZiB0ZXh0IGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBUaGUgaW5zdHJ1Y3Rpb25zIGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAgbWFyayB0aGUgdHJhbnNsYXRpb24gYmxvY2sgaW4gdGhlIHRlbXBsYXRlLlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2VJbmRleCBBbiBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gbWVzc2FnZSBmcm9tIHRoZSBgZGVmLmNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5TdGFydChcbiAgaW5kZXg6IG51bWJlcixcbiAgbWVzc2FnZUluZGV4OiBudW1iZXIsXG4gIHN1YlRlbXBsYXRlSW5kZXg6IG51bWJlciA9IC0xLFxuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gSEVBREVSX09GRlNFVCArIGluZGV4O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGNvbnN0IG1lc3NhZ2UgPSBnZXRDb25zdGFudDxzdHJpbmc+KHRWaWV3LmNvbnN0cywgbWVzc2FnZUluZGV4KSE7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gZ2V0Q3VycmVudFBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgbnVsbDtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGkxOG5TdGFydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICAgIHRWaWV3LFxuICAgICAgcGFyZW50VE5vZGUgPT09IG51bGwgPyAwIDogcGFyZW50VE5vZGUuaW5kZXgsXG4gICAgICBsVmlldyxcbiAgICAgIGFkanVzdGVkSW5kZXgsXG4gICAgICBtZXNzYWdlLFxuICAgICAgc3ViVGVtcGxhdGVJbmRleCxcbiAgICApO1xuICB9XG5cbiAgLy8gU2V0IGEgZmxhZyB0aGF0IHRoaXMgTFZpZXcgaGFzIGkxOG4gYmxvY2tzLlxuICAvLyBUaGUgZmxhZyBpcyBsYXRlciB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMgY29tcG9uZW50IHNob3VsZFxuICAvLyBiZSBoeWRyYXRlZCAoY3VycmVudGx5IGh5ZHJhdGlvbiBpcyBub3Qgc3VwcG9ydGVkIGZvciBpMThuIGJsb2NrcykuXG4gIGlmICh0Vmlldy50eXBlID09PSBUVmlld1R5cGUuRW1iZWRkZWQpIHtcbiAgICAvLyBBbm5vdGF0ZSBob3N0IGNvbXBvbmVudCdzIExWaWV3IChub3QgZW1iZWRkZWQgdmlldydzIExWaWV3KSxcbiAgICAvLyBzaW5jZSBoeWRyYXRpb24gY2FuIGJlIHNraXBwZWQgb24gcGVyLWNvbXBvbmVudCBiYXNpcyBvbmx5LlxuICAgIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddO1xuICAgIGNvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkhhc0kxOG47XG4gIH0gZWxzZSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuSGFzSTE4bjtcbiAgfVxuXG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBUSTE4bjtcbiAgY29uc3Qgc2FtZVZpZXdQYXJlbnRUTm9kZSA9IHBhcmVudFROb2RlID09PSBsVmlld1tUX0hPU1RdID8gbnVsbCA6IHBhcmVudFROb2RlO1xuICBjb25zdCBwYXJlbnRSTm9kZSA9IGdldENsb3Nlc3RSRWxlbWVudCh0Vmlldywgc2FtZVZpZXdQYXJlbnRUTm9kZSwgbFZpZXcpO1xuICAvLyBJZiBgcGFyZW50VE5vZGVgIGlzIGFuIGBFbGVtZW50Q29udGFpbmVyYCB0aGFuIGl0IGhhcyBgPCEtLW5nLWNvbnRhaW5lci0tLT5gLlxuICAvLyBXaGVuIHdlIGRvIGluc2VydHMgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdG8gaW5zZXJ0IGluIGZyb250IG9mIGA8IS0tbmctY29udGFpbmVyLS0tPmAuXG4gIGNvbnN0IGluc2VydEluRnJvbnRPZiA9XG4gICAgcGFyZW50VE5vZGUgJiYgcGFyZW50VE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyID8gbFZpZXdbcGFyZW50VE5vZGUuaW5kZXhdIDogbnVsbDtcbiAgcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbihsVmlldywgYWRqdXN0ZWRJbmRleCwgcGFyZW50VE5vZGUsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICBhcHBseUNyZWF0ZU9wQ29kZXMobFZpZXcsIHRJMThuLmNyZWF0ZSwgcGFyZW50Uk5vZGUsIGluc2VydEluRnJvbnRPZik7XG4gIHNldEluSTE4bkJsb2NrKHRydWUpO1xufVxuXG4vKipcbiAqIFRyYW5zbGF0ZXMgYSB0cmFuc2xhdGlvbiBibG9jayBtYXJrZWQgYnkgYGkxOG5TdGFydGAgYW5kIGBpMThuRW5kYC4gSXQgaW5zZXJ0cyB0aGUgdGV4dC9JQ1Ugbm9kZXNcbiAqIGludG8gdGhlIHJlbmRlciB0cmVlLCBtb3ZlcyB0aGUgcGxhY2Vob2xkZXIgbm9kZXMgYW5kIHJlbW92ZXMgdGhlIGRlbGV0ZWQgbm9kZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuRW5kKCk6IHZvaWQge1xuICBzZXRJbkkxOG5CbG9jayhmYWxzZSk7XG59XG5cbi8qKlxuICpcbiAqIFVzZSB0aGlzIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRyYW5zbGF0aW9uIGJsb2NrIHRoYXQgZG9lc24ndCBjb250YWluIGFueSBwbGFjZWhvbGRlci5cbiAqIEl0IGNhbGxzIGJvdGgge0BsaW5rIGkxOG5TdGFydH0gYW5kIHtAbGluayBpMThuRW5kfSBpbiBvbmUgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2VJbmRleCBBbiBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gbWVzc2FnZSBmcm9tIHRoZSBgZGVmLmNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG4oaW5kZXg6IG51bWJlciwgbWVzc2FnZUluZGV4OiBudW1iZXIsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgybXJtWkxOG5TdGFydChpbmRleCwgbWVzc2FnZUluZGV4LCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgybXJtWkxOG5FbmQoKTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IGluIHRoZSBzdGF0aWMgYmxvY2tcbiAqIEBwYXJhbSB2YWx1ZXNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIGF0dHJzSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgY29uc3QgYXR0cnMgPSBnZXRDb25zdGFudDxzdHJpbmdbXT4odFZpZXcuY29uc3RzLCBhdHRyc0luZGV4KSE7XG4gIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKHRWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQsIGF0dHJzKTtcbn1cblxuLyoqXG4gKiBTdG9yZXMgdGhlIHZhbHVlcyBvZiB0aGUgYmluZGluZ3MgZHVyaW5nIGVhY2ggdXBkYXRlIGN5Y2xlIGluIG9yZGVyIHRvIGRldGVybWluZSBpZiB3ZSBuZWVkIHRvXG4gKiB1cGRhdGUgdGhlIHRyYW5zbGF0ZWQgbm9kZXMuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBiaW5kaW5nJ3MgdmFsdWVcbiAqIEByZXR1cm5zIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBpdHNlbGYgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZFxuICogKGUuZy4gYGkxOG5FeHAoY3R4Lm5hbWUpKGN0eC50aXRsZSlgKVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkV4cDxUPih2YWx1ZTogVCk6IHR5cGVvZiDJtcm1aTE4bkV4cCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgc2V0TWFza0JpdChiaW5kaW5nVXBkYXRlZChsVmlldywgbmV4dEJpbmRpbmdJbmRleCgpLCB2YWx1ZSkpO1xuICByZXR1cm4gybXJtWkxOG5FeHA7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkFwcGx5KGluZGV4OiBudW1iZXIpIHtcbiAgYXBwbHlJMThuKGdldFRWaWV3KCksIGdldExWaWV3KCksIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG59XG5cbi8qKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgZm9yIGludGVybmF0aW9uYWxpemF0aW9uLlxuICpcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGJ5IHRyYW5zZm9ybWluZyBpdCBmcm9tIGludGVybWVkaWF0ZVxuICogZm9ybWF0ICh0aGF0IG1pZ2h0IGNvbnRhaW4gc29tZSBtYXJrZXJzIHRoYXQgd2UgbmVlZCB0byByZXBsYWNlKSB0byB0aGUgZmluYWxcbiAqIGZvcm0sIGNvbnN1bWFibGUgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uLiBQb3N0IHByb2Nlc3Npbmcgc3RlcHMgaW5jbHVkZTpcbiAqXG4gKiAxLiBSZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBjYXNlcyAobGlrZSBb77+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vXzvv70177+9XSlcbiAqIDIuIFJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICogMy4gUmVwbGFjZSBhbGwgcGxhY2Vob2xkZXJzIHVzZWQgaW5zaWRlIElDVXMgaW4gYSBmb3JtIG9mIHtQTEFDRUhPTERFUn1cbiAqIDQuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blBvc3Rwcm9jZXNzKFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIHJlcGxhY2VtZW50czoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IHN0cmluZ1tdfSA9IHt9LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIGkxOG5Qb3N0cHJvY2VzcyhtZXNzYWdlLCByZXBsYWNlbWVudHMpO1xufVxuIl19