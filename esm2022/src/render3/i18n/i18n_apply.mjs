/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
import { getPluralCase } from '../../i18n/localization';
import { assertDefined, assertDomNode, assertEqual, assertGreaterThan, assertIndexInRange, throwError } from '../../util/assert';
import { assertIndexInExpandoRange, assertTIcu } from '../assert';
import { attachPatchData } from '../context_discovery';
import { elementPropertyInternal, setElementAttribute } from '../instructions/shared';
import { ELEMENT_MARKER, I18nCreateOpCode, ICU_MARKER } from '../interfaces/i18n';
import { HEADER_OFFSET, RENDERER } from '../interfaces/view';
import { createCommentNode, createElementNode, createTextNode, nativeInsertBefore, nativeParentNode, nativeRemoveNode, updateTextNode } from '../node_manipulation';
import { getBindingIndex, lastNodeWasCreated } from '../state';
import { renderStringify } from '../util/stringify_utils';
import { getNativeByIndex, unwrapRNode } from '../util/view_utils';
import { getLocaleId } from './i18n_locale_id';
import { getCurrentICUCaseIndex, getParentFromIcuCreateOpCode, getRefFromIcuCreateOpCode, getTIcu } from './i18n_util';
/**
 * Keep track of which input bindings in `ɵɵi18nExp` have changed.
 *
 * This is used to efficiently update expressions in i18n only when the corresponding input has
 * changed.
 *
 * 1) Each bit represents which of the `ɵɵi18nExp` has changed.
 * 2) There are 32 bits allowed in JS.
 * 3) Bit 32 is special as it is shared for all changes past 32. (In other words if you have more
 * than 32 `ɵɵi18nExp` then all changes past 32nd `ɵɵi18nExp` will be mapped to same bit. This means
 * that we may end up changing more than we need to. But i18n expressions with 32 bindings is rare
 * so in practice it should not be an issue.)
 */
let changeMask = 0b0;
/**
 * Keeps track of which bit needs to be updated in `changeMask`
 *
 * This value gets incremented on every call to `ɵɵi18nExp`
 */
let changeMaskCounter = 0;
/**
 * Keep track of which input bindings in `ɵɵi18nExp` have changed.
 *
 * `setMaskBit` gets invoked by each call to `ɵɵi18nExp`.
 *
 * @param hasChange did `ɵɵi18nExp` detect a change.
 */
export function setMaskBit(hasChange) {
    if (hasChange) {
        changeMask = changeMask | (1 << Math.min(changeMaskCounter, 31));
    }
    changeMaskCounter++;
}
export function applyI18n(tView, lView, index) {
    if (changeMaskCounter > 0) {
        ngDevMode && assertDefined(tView, `tView should be defined`);
        const tI18n = tView.data[index];
        // When `index` points to an `ɵɵi18nAttributes` then we have an array otherwise `TI18n`
        const updateOpCodes = Array.isArray(tI18n) ? tI18n : tI18n.update;
        const bindingsStartIndex = getBindingIndex() - changeMaskCounter - 1;
        applyUpdateOpCodes(tView, lView, updateOpCodes, bindingsStartIndex, changeMask);
    }
    // Reset changeMask & maskBit to default for the next update cycle
    changeMask = 0b0;
    changeMaskCounter = 0;
}
function locateOrCreateNode(lView, index, textOrName, nodeType) {
    // TODO: Add support for hydration
    lastNodeWasCreated(true);
    const renderer = lView[RENDERER];
    switch (nodeType) {
        case Node.COMMENT_NODE:
            return createCommentNode(renderer, textOrName);
        case Node.TEXT_NODE:
            return createTextNode(renderer, textOrName);
        case Node.ELEMENT_NODE:
            return createElementNode(renderer, textOrName, null);
    }
}
/**
 * Apply `I18nCreateOpCodes` op-codes as stored in `TI18n.create`.
 *
 * Creates text (and comment) nodes which are internationalized.
 *
 * @param lView Current lView
 * @param createOpCodes Set of op-codes to apply
 * @param parentRNode Parent node (so that direct children can be added eagerly) or `null` if it is
 *     a root node.
 * @param insertInFrontOf DOM node that should be used as an anchor.
 */
export function applyCreateOpCodes(lView, createOpCodes, parentRNode, insertInFrontOf) {
    const renderer = lView[RENDERER];
    for (let i = 0; i < createOpCodes.length; i++) {
        const opCode = createOpCodes[i++];
        const text = createOpCodes[i];
        const isComment = (opCode & I18nCreateOpCode.COMMENT) === I18nCreateOpCode.COMMENT;
        const appendNow = (opCode & I18nCreateOpCode.APPEND_EAGERLY) === I18nCreateOpCode.APPEND_EAGERLY;
        const index = opCode >>> I18nCreateOpCode.SHIFT;
        let rNode = lView[index];
        if (rNode === null) {
            // We only create new DOM nodes if they don't already exist: If ICU switches case back to a
            // case which was already instantiated, no need to create new DOM nodes.
            rNode = lView[index] =
                locateOrCreateNode(lView, index, text, isComment ? Node.COMMENT_NODE : Node.TEXT_NODE);
        }
        if (appendNow && parentRNode !== null) {
            nativeInsertBefore(renderer, parentRNode, rNode, insertInFrontOf, false);
        }
    }
}
/**
 * Apply `I18nMutateOpCodes` OpCodes.
 *
 * @param tView Current `TView`
 * @param mutableOpCodes Mutable OpCodes to process
 * @param lView Current `LView`
 * @param anchorRNode place where the i18n node should be inserted.
 */
export function applyMutableOpCodes(tView, mutableOpCodes, lView, anchorRNode) {
    ngDevMode && assertDomNode(anchorRNode);
    const renderer = lView[RENDERER];
    // `rootIdx` represents the node into which all inserts happen.
    let rootIdx = null;
    // `rootRNode` represents the real node into which we insert. This can be different from
    // `lView[rootIdx]` if we have projection.
    //  - null we don't have a parent (as can be the case in when we are inserting into a root of
    //    LView which has no parent.)
    //  - `RElement` The element representing the root after taking projection into account.
    let rootRNode;
    for (let i = 0; i < mutableOpCodes.length; i++) {
        const opCode = mutableOpCodes[i];
        if (typeof opCode == 'string') {
            const textNodeIndex = mutableOpCodes[++i];
            if (lView[textNodeIndex] === null) {
                ngDevMode && ngDevMode.rendererCreateTextNode++;
                ngDevMode && assertIndexInRange(lView, textNodeIndex);
                lView[textNodeIndex] = locateOrCreateNode(lView, textNodeIndex, opCode, Node.TEXT_NODE);
            }
        }
        else if (typeof opCode == 'number') {
            switch (opCode & 1 /* IcuCreateOpCode.MASK_INSTRUCTION */) {
                case 0 /* IcuCreateOpCode.AppendChild */:
                    const parentIdx = getParentFromIcuCreateOpCode(opCode);
                    if (rootIdx === null) {
                        // The first operation should save the `rootIdx` because the first operation
                        // must insert into the root. (Only subsequent operations can insert into a dynamic
                        // parent)
                        rootIdx = parentIdx;
                        rootRNode = nativeParentNode(renderer, anchorRNode);
                    }
                    let insertInFrontOf;
                    let parentRNode;
                    if (parentIdx === rootIdx) {
                        insertInFrontOf = anchorRNode;
                        parentRNode = rootRNode;
                    }
                    else {
                        insertInFrontOf = null;
                        parentRNode = unwrapRNode(lView[parentIdx]);
                    }
                    // FIXME(misko): Refactor with `processI18nText`
                    if (parentRNode !== null) {
                        // This can happen if the `LView` we are adding to is not attached to a parent `LView`.
                        // In such a case there is no "root" we can attach to. This is fine, as we still need to
                        // create the elements. When the `LView` gets later added to a parent these "root" nodes
                        // get picked up and added.
                        ngDevMode && assertDomNode(parentRNode);
                        const refIdx = getRefFromIcuCreateOpCode(opCode);
                        ngDevMode && assertGreaterThan(refIdx, HEADER_OFFSET, 'Missing ref');
                        // `unwrapRNode` is not needed here as all of these point to RNodes as part of the i18n
                        // which can't have components.
                        const child = lView[refIdx];
                        ngDevMode && assertDomNode(child);
                        nativeInsertBefore(renderer, parentRNode, child, insertInFrontOf, false);
                        const tIcu = getTIcu(tView, refIdx);
                        if (tIcu !== null && typeof tIcu === 'object') {
                            // If we just added a comment node which has ICU then that ICU may have already been
                            // rendered and therefore we need to re-add it here.
                            ngDevMode && assertTIcu(tIcu);
                            const caseIndex = getCurrentICUCaseIndex(tIcu, lView);
                            if (caseIndex !== null) {
                                applyMutableOpCodes(tView, tIcu.create[caseIndex], lView, lView[tIcu.anchorIdx]);
                            }
                        }
                    }
                    break;
                case 1 /* IcuCreateOpCode.Attr */:
                    const elementNodeIndex = opCode >>> 1 /* IcuCreateOpCode.SHIFT_REF */;
                    const attrName = mutableOpCodes[++i];
                    const attrValue = mutableOpCodes[++i];
                    // This code is used for ICU expressions only, since we don't support
                    // directives/components in ICUs, we don't need to worry about inputs here
                    setElementAttribute(renderer, getNativeByIndex(elementNodeIndex, lView), null, null, attrName, attrValue, null);
                    break;
                default:
                    if (ngDevMode) {
                        throw new RuntimeError(700 /* RuntimeErrorCode.INVALID_I18N_STRUCTURE */, `Unable to determine the type of mutate operation for "${opCode}"`);
                    }
            }
        }
        else {
            switch (opCode) {
                case ICU_MARKER:
                    const commentValue = mutableOpCodes[++i];
                    const commentNodeIndex = mutableOpCodes[++i];
                    if (lView[commentNodeIndex] === null) {
                        ngDevMode &&
                            assertEqual(typeof commentValue, 'string', `Expected "${commentValue}" to be a comment node value`);
                        ngDevMode && ngDevMode.rendererCreateComment++;
                        ngDevMode && assertIndexInExpandoRange(lView, commentNodeIndex);
                        const commentRNode = lView[commentNodeIndex] =
                            locateOrCreateNode(lView, commentNodeIndex, commentValue, Node.COMMENT_NODE);
                        // FIXME(misko): Attaching patch data is only needed for the root (Also add tests)
                        attachPatchData(commentRNode, lView);
                    }
                    break;
                case ELEMENT_MARKER:
                    const tagName = mutableOpCodes[++i];
                    const elementNodeIndex = mutableOpCodes[++i];
                    if (lView[elementNodeIndex] === null) {
                        ngDevMode &&
                            assertEqual(typeof tagName, 'string', `Expected "${tagName}" to be an element node tag name`);
                        ngDevMode && ngDevMode.rendererCreateElement++;
                        ngDevMode && assertIndexInExpandoRange(lView, elementNodeIndex);
                        const elementRNode = lView[elementNodeIndex] =
                            locateOrCreateNode(lView, elementNodeIndex, tagName, Node.ELEMENT_NODE);
                        // FIXME(misko): Attaching patch data is only needed for the root (Also add tests)
                        attachPatchData(elementRNode, lView);
                    }
                    break;
                default:
                    ngDevMode &&
                        throwError(`Unable to determine the type of mutate operation for "${opCode}"`);
            }
        }
    }
}
/**
 * Apply `I18nUpdateOpCodes` OpCodes
 *
 * @param tView Current `TView`
 * @param lView Current `LView`
 * @param updateOpCodes OpCodes to process
 * @param bindingsStartIndex Location of the first `ɵɵi18nApply`
 * @param changeMask Each bit corresponds to a `ɵɵi18nExp` (Counting backwards from
 *     `bindingsStartIndex`)
 */
export function applyUpdateOpCodes(tView, lView, updateOpCodes, bindingsStartIndex, changeMask) {
    for (let i = 0; i < updateOpCodes.length; i++) {
        // bit code to check if we should apply the next update
        const checkBit = updateOpCodes[i];
        // Number of opCodes to skip until next set of update codes
        const skipCodes = updateOpCodes[++i];
        if (checkBit & changeMask) {
            // The value has been updated since last checked
            let value = '';
            for (let j = i + 1; j <= (i + skipCodes); j++) {
                const opCode = updateOpCodes[j];
                if (typeof opCode == 'string') {
                    value += opCode;
                }
                else if (typeof opCode == 'number') {
                    if (opCode < 0) {
                        // Negative opCode represent `i18nExp` values offset.
                        value += renderStringify(lView[bindingsStartIndex - opCode]);
                    }
                    else {
                        const nodeIndex = (opCode >>> 2 /* I18nUpdateOpCode.SHIFT_REF */);
                        switch (opCode & 3 /* I18nUpdateOpCode.MASK_OPCODE */) {
                            case 1 /* I18nUpdateOpCode.Attr */:
                                const propName = updateOpCodes[++j];
                                const sanitizeFn = updateOpCodes[++j];
                                const tNodeOrTagName = tView.data[nodeIndex];
                                ngDevMode && assertDefined(tNodeOrTagName, 'Experting TNode or string');
                                if (typeof tNodeOrTagName === 'string') {
                                    // IF we don't have a `TNode`, then we are an element in ICU (as ICU content does
                                    // not have TNode), in which case we know that there are no directives, and hence
                                    // we use attribute setting.
                                    setElementAttribute(lView[RENDERER], lView[nodeIndex], null, tNodeOrTagName, propName, value, sanitizeFn);
                                }
                                else {
                                    elementPropertyInternal(tView, tNodeOrTagName, lView, propName, value, lView[RENDERER], sanitizeFn, false);
                                }
                                break;
                            case 0 /* I18nUpdateOpCode.Text */:
                                const rText = lView[nodeIndex];
                                rText !== null && updateTextNode(lView[RENDERER], rText, value);
                                break;
                            case 2 /* I18nUpdateOpCode.IcuSwitch */:
                                applyIcuSwitchCase(tView, getTIcu(tView, nodeIndex), lView, value);
                                break;
                            case 3 /* I18nUpdateOpCode.IcuUpdate */:
                                applyIcuUpdateCase(tView, getTIcu(tView, nodeIndex), bindingsStartIndex, lView);
                                break;
                        }
                    }
                }
            }
        }
        else {
            const opCode = updateOpCodes[i + 1];
            if (opCode > 0 && (opCode & 3 /* I18nUpdateOpCode.MASK_OPCODE */) === 3 /* I18nUpdateOpCode.IcuUpdate */) {
                // Special case for the `icuUpdateCase`. It could be that the mask did not match, but
                // we still need to execute `icuUpdateCase` because the case has changed recently due to
                // previous `icuSwitchCase` instruction. (`icuSwitchCase` and `icuUpdateCase` always come in
                // pairs.)
                const nodeIndex = (opCode >>> 2 /* I18nUpdateOpCode.SHIFT_REF */);
                const tIcu = getTIcu(tView, nodeIndex);
                const currentIndex = lView[tIcu.currentCaseLViewIndex];
                if (currentIndex < 0) {
                    applyIcuUpdateCase(tView, tIcu, bindingsStartIndex, lView);
                }
            }
        }
        i += skipCodes;
    }
}
/**
 * Apply OpCodes associated with updating an existing ICU.
 *
 * @param tView Current `TView`
 * @param tIcu Current `TIcu`
 * @param bindingsStartIndex Location of the first `ɵɵi18nApply`
 * @param lView Current `LView`
 */
function applyIcuUpdateCase(tView, tIcu, bindingsStartIndex, lView) {
    ngDevMode && assertIndexInRange(lView, tIcu.currentCaseLViewIndex);
    let activeCaseIndex = lView[tIcu.currentCaseLViewIndex];
    if (activeCaseIndex !== null) {
        let mask = changeMask;
        if (activeCaseIndex < 0) {
            // Clear the flag.
            // Negative number means that the ICU was freshly created and we need to force the update.
            activeCaseIndex = lView[tIcu.currentCaseLViewIndex] = ~activeCaseIndex;
            // -1 is same as all bits on, which simulates creation since it marks all bits dirty
            mask = -1;
        }
        applyUpdateOpCodes(tView, lView, tIcu.update[activeCaseIndex], bindingsStartIndex, mask);
    }
}
/**
 * Apply OpCodes associated with switching a case on ICU.
 *
 * This involves tearing down existing case and than building up a new case.
 *
 * @param tView Current `TView`
 * @param tIcu Current `TIcu`
 * @param lView Current `LView`
 * @param value Value of the case to update to.
 */
function applyIcuSwitchCase(tView, tIcu, lView, value) {
    // Rebuild a new case for this ICU
    const caseIndex = getCaseIndex(tIcu, value);
    let activeCaseIndex = getCurrentICUCaseIndex(tIcu, lView);
    if (activeCaseIndex !== caseIndex) {
        applyIcuSwitchCaseRemove(tView, tIcu, lView);
        lView[tIcu.currentCaseLViewIndex] = caseIndex === null ? null : ~caseIndex;
        if (caseIndex !== null) {
            // Add the nodes for the new case
            const anchorRNode = lView[tIcu.anchorIdx];
            if (anchorRNode) {
                ngDevMode && assertDomNode(anchorRNode);
                applyMutableOpCodes(tView, tIcu.create[caseIndex], lView, anchorRNode);
            }
        }
    }
}
/**
 * Apply OpCodes associated with tearing ICU case.
 *
 * This involves tearing down existing case and than building up a new case.
 *
 * @param tView Current `TView`
 * @param tIcu Current `TIcu`
 * @param lView Current `LView`
 */
function applyIcuSwitchCaseRemove(tView, tIcu, lView) {
    let activeCaseIndex = getCurrentICUCaseIndex(tIcu, lView);
    if (activeCaseIndex !== null) {
        const removeCodes = tIcu.remove[activeCaseIndex];
        for (let i = 0; i < removeCodes.length; i++) {
            const nodeOrIcuIndex = removeCodes[i];
            if (nodeOrIcuIndex > 0) {
                // Positive numbers are `RNode`s.
                const rNode = getNativeByIndex(nodeOrIcuIndex, lView);
                rNode !== null && nativeRemoveNode(lView[RENDERER], rNode);
            }
            else {
                // Negative numbers are ICUs
                applyIcuSwitchCaseRemove(tView, getTIcu(tView, ~nodeOrIcuIndex), lView);
            }
        }
    }
}
/**
 * Returns the index of the current case of an ICU expression depending on the main binding value
 *
 * @param icuExpression
 * @param bindingValue The value of the main binding used by this ICU expression
 */
function getCaseIndex(icuExpression, bindingValue) {
    let index = icuExpression.cases.indexOf(bindingValue);
    if (index === -1) {
        switch (icuExpression.type) {
            case 1 /* IcuType.plural */: {
                const resolvedCase = getPluralCase(bindingValue, getLocaleId());
                index = icuExpression.cases.indexOf(resolvedCase);
                if (index === -1 && resolvedCase !== 'other') {
                    index = icuExpression.cases.indexOf('other');
                }
                break;
            }
            case 0 /* IcuType.select */: {
                index = icuExpression.cases.indexOf('other');
                break;
            }
        }
    }
    return index === -1 ? null : index;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9hcHBseS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi9pMThuX2FwcGx5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0gsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFVBQVUsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBMEQsVUFBVSxFQUEwRCxNQUFNLG9CQUFvQixDQUFDO0FBSWpNLE9BQU8sRUFBQyxhQUFhLEVBQVMsUUFBUSxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDekUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsSyxPQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFakUsT0FB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LEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2pCLFFBQVEsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzNCLDJCQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDcEIsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xELElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxJQUFJLFlBQVksS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDN0MsS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2dCQUNELE1BQU07WUFDUixDQUFDO1lBQ0QsMkJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixLQUFLLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdDLE1BQU07WUFDUixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7Z2V0UGx1cmFsQ2FzZX0gZnJvbSAnLi4vLi4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydEluZGV4SW5SYW5nZSwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRJbmRleEluRXhwYW5kb1JhbmdlLCBhc3NlcnRUSWN1fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7ZWxlbWVudFByb3BlcnR5SW50ZXJuYWwsIHNldEVsZW1lbnRBdHRyaWJ1dGV9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtFTEVNRU5UX01BUktFUiwgSTE4bkNyZWF0ZU9wQ29kZSwgSTE4bkNyZWF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBJQ1VfTUFSS0VSLCBJY3VDcmVhdGVPcENvZGUsIEljdUNyZWF0ZU9wQ29kZXMsIEljdVR5cGUsIFRJMThuLCBUSWN1fSBmcm9tICcuLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlLCBSVGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtjcmVhdGVDb21tZW50Tm9kZSwgY3JlYXRlRWxlbWVudE5vZGUsIGNyZWF0ZVRleHROb2RlLCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZVBhcmVudE5vZGUsIG5hdGl2ZVJlbW92ZU5vZGUsIHVwZGF0ZVRleHROb2RlfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgbGFzdE5vZGVXYXNDcmVhdGVkfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4LCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtnZXRMb2NhbGVJZH0gZnJvbSAnLi9pMThuX2xvY2FsZV9pZCc7XG5pbXBvcnQge2dldEN1cnJlbnRJQ1VDYXNlSW5kZXgsIGdldFBhcmVudEZyb21JY3VDcmVhdGVPcENvZGUsIGdldFJlZkZyb21JY3VDcmVhdGVPcENvZGUsIGdldFRJY3V9IGZyb20gJy4vaTE4bl91dGlsJztcblxuXG5cbi8qKlxuICogS2VlcCB0cmFjayBvZiB3aGljaCBpbnB1dCBiaW5kaW5ncyBpbiBgybXJtWkxOG5FeHBgIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gZWZmaWNpZW50bHkgdXBkYXRlIGV4cHJlc3Npb25zIGluIGkxOG4gb25seSB3aGVuIHRoZSBjb3JyZXNwb25kaW5nIGlucHV0IGhhc1xuICogY2hhbmdlZC5cbiAqXG4gKiAxKSBFYWNoIGJpdCByZXByZXNlbnRzIHdoaWNoIG9mIHRoZSBgybXJtWkxOG5FeHBgIGhhcyBjaGFuZ2VkLlxuICogMikgVGhlcmUgYXJlIDMyIGJpdHMgYWxsb3dlZCBpbiBKUy5cbiAqIDMpIEJpdCAzMiBpcyBzcGVjaWFsIGFzIGl0IGlzIHNoYXJlZCBmb3IgYWxsIGNoYW5nZXMgcGFzdCAzMi4gKEluIG90aGVyIHdvcmRzIGlmIHlvdSBoYXZlIG1vcmVcbiAqIHRoYW4gMzIgYMm1ybVpMThuRXhwYCB0aGVuIGFsbCBjaGFuZ2VzIHBhc3QgMzJuZCBgybXJtWkxOG5FeHBgIHdpbGwgYmUgbWFwcGVkIHRvIHNhbWUgYml0LiBUaGlzIG1lYW5zXG4gKiB0aGF0IHdlIG1heSBlbmQgdXAgY2hhbmdpbmcgbW9yZSB0aGFuIHdlIG5lZWQgdG8uIEJ1dCBpMThuIGV4cHJlc3Npb25zIHdpdGggMzIgYmluZGluZ3MgaXMgcmFyZVxuICogc28gaW4gcHJhY3RpY2UgaXQgc2hvdWxkIG5vdCBiZSBhbiBpc3N1ZS4pXG4gKi9cbmxldCBjaGFuZ2VNYXNrID0gMGIwO1xuXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIHdoaWNoIGJpdCBuZWVkcyB0byBiZSB1cGRhdGVkIGluIGBjaGFuZ2VNYXNrYFxuICpcbiAqIFRoaXMgdmFsdWUgZ2V0cyBpbmNyZW1lbnRlZCBvbiBldmVyeSBjYWxsIHRvIGDJtcm1aTE4bkV4cGBcbiAqL1xubGV0IGNoYW5nZU1hc2tDb3VudGVyID0gMDtcblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIHdoaWNoIGlucHV0IGJpbmRpbmdzIGluIGDJtcm1aTE4bkV4cGAgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIGBzZXRNYXNrQml0YCBnZXRzIGludm9rZWQgYnkgZWFjaCBjYWxsIHRvIGDJtcm1aTE4bkV4cGAuXG4gKlxuICogQHBhcmFtIGhhc0NoYW5nZSBkaWQgYMm1ybVpMThuRXhwYCBkZXRlY3QgYSBjaGFuZ2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXNrQml0KGhhc0NoYW5nZTogYm9vbGVhbikge1xuICBpZiAoaGFzQ2hhbmdlKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBNYXRoLm1pbihjaGFuZ2VNYXNrQ291bnRlciwgMzEpKTtcbiAgfVxuICBjaGFuZ2VNYXNrQ291bnRlcisrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlJMThuKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyKSB7XG4gIGlmIChjaGFuZ2VNYXNrQ291bnRlciA+IDApIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gICAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW2luZGV4XSBhcyBUSTE4biB8IEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIC8vIFdoZW4gYGluZGV4YCBwb2ludHMgdG8gYW4gYMm1ybVpMThuQXR0cmlidXRlc2AgdGhlbiB3ZSBoYXZlIGFuIGFycmF5IG90aGVyd2lzZSBgVEkxOG5gXG4gICAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPVxuICAgICAgICBBcnJheS5pc0FycmF5KHRJMThuKSA/IHRJMThuIGFzIEkxOG5VcGRhdGVPcENvZGVzIDogKHRJMThuIGFzIFRJMThuKS51cGRhdGU7XG4gICAgY29uc3QgYmluZGluZ3NTdGFydEluZGV4ID0gZ2V0QmluZGluZ0luZGV4KCkgLSBjaGFuZ2VNYXNrQ291bnRlciAtIDE7XG4gICAgYXBwbHlVcGRhdGVPcENvZGVzKHRWaWV3LCBsVmlldywgdXBkYXRlT3BDb2RlcywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrKTtcbiAgfVxuICAvLyBSZXNldCBjaGFuZ2VNYXNrICYgbWFza0JpdCB0byBkZWZhdWx0IGZvciB0aGUgbmV4dCB1cGRhdGUgY3ljbGVcbiAgY2hhbmdlTWFzayA9IDBiMDtcbiAgY2hhbmdlTWFza0NvdW50ZXIgPSAwO1xufVxuXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZU5vZGUoXG4gICAgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB0ZXh0T3JOYW1lOiBzdHJpbmcsXG4gICAgbm9kZVR5cGU6IHR5cGVvZiBOb2RlLkNPTU1FTlRfTk9ERXx0eXBlb2YgTm9kZS5URVhUX05PREV8dHlwZW9mIE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBoeWRyYXRpb25cbiAgbGFzdE5vZGVXYXNDcmVhdGVkKHRydWUpO1xuXG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuXG4gIHN3aXRjaCAobm9kZVR5cGUpIHtcbiAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgcmV0dXJuIGNyZWF0ZUNvbW1lbnROb2RlKHJlbmRlcmVyLCB0ZXh0T3JOYW1lKTtcblxuICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICByZXR1cm4gY3JlYXRlVGV4dE5vZGUocmVuZGVyZXIsIHRleHRPck5hbWUpO1xuXG4gICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50Tm9kZShyZW5kZXJlciwgdGV4dE9yTmFtZSwgbnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBgSTE4bkNyZWF0ZU9wQ29kZXNgIG9wLWNvZGVzIGFzIHN0b3JlZCBpbiBgVEkxOG4uY3JlYXRlYC5cbiAqXG4gKiBDcmVhdGVzIHRleHQgKGFuZCBjb21tZW50KSBub2RlcyB3aGljaCBhcmUgaW50ZXJuYXRpb25hbGl6ZWQuXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgbFZpZXdcbiAqIEBwYXJhbSBjcmVhdGVPcENvZGVzIFNldCBvZiBvcC1jb2RlcyB0byBhcHBseVxuICogQHBhcmFtIHBhcmVudFJOb2RlIFBhcmVudCBub2RlIChzbyB0aGF0IGRpcmVjdCBjaGlsZHJlbiBjYW4gYmUgYWRkZWQgZWFnZXJseSkgb3IgYG51bGxgIGlmIGl0IGlzXG4gKiAgICAgYSByb290IG5vZGUuXG4gKiBAcGFyYW0gaW5zZXJ0SW5Gcm9udE9mIERPTSBub2RlIHRoYXQgc2hvdWxkIGJlIHVzZWQgYXMgYW4gYW5jaG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDcmVhdGVPcENvZGVzKFxuICAgIGxWaWV3OiBMVmlldywgY3JlYXRlT3BDb2RlczogSTE4bkNyZWF0ZU9wQ29kZXMsIHBhcmVudFJOb2RlOiBSRWxlbWVudHxudWxsLFxuICAgIGluc2VydEluRnJvbnRPZjogUkVsZW1lbnR8bnVsbCk6IHZvaWQge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpKytdIGFzIGFueTtcbiAgICBjb25zdCB0ZXh0ID0gY3JlYXRlT3BDb2Rlc1tpXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaXNDb21tZW50ID0gKG9wQ29kZSAmIEkxOG5DcmVhdGVPcENvZGUuQ09NTUVOVCkgPT09IEkxOG5DcmVhdGVPcENvZGUuQ09NTUVOVDtcbiAgICBjb25zdCBhcHBlbmROb3cgPVxuICAgICAgICAob3BDb2RlICYgSTE4bkNyZWF0ZU9wQ29kZS5BUFBFTkRfRUFHRVJMWSkgPT09IEkxOG5DcmVhdGVPcENvZGUuQVBQRU5EX0VBR0VSTFk7XG4gICAgY29uc3QgaW5kZXggPSBvcENvZGUgPj4+IEkxOG5DcmVhdGVPcENvZGUuU0hJRlQ7XG4gICAgbGV0IHJOb2RlID0gbFZpZXdbaW5kZXhdO1xuICAgIGlmIChyTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gV2Ugb25seSBjcmVhdGUgbmV3IERPTSBub2RlcyBpZiB0aGV5IGRvbid0IGFscmVhZHkgZXhpc3Q6IElmIElDVSBzd2l0Y2hlcyBjYXNlIGJhY2sgdG8gYVxuICAgICAgLy8gY2FzZSB3aGljaCB3YXMgYWxyZWFkeSBpbnN0YW50aWF0ZWQsIG5vIG5lZWQgdG8gY3JlYXRlIG5ldyBET00gbm9kZXMuXG4gICAgICByTm9kZSA9IGxWaWV3W2luZGV4XSA9XG4gICAgICAgICAgbG9jYXRlT3JDcmVhdGVOb2RlKGxWaWV3LCBpbmRleCwgdGV4dCwgaXNDb21tZW50ID8gTm9kZS5DT01NRU5UX05PREUgOiBOb2RlLlRFWFRfTk9ERSk7XG4gICAgfVxuICAgIGlmIChhcHBlbmROb3cgJiYgcGFyZW50Uk5vZGUgIT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50Uk5vZGUsIHJOb2RlLCBpbnNlcnRJbkZyb250T2YsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBgSTE4bk11dGF0ZU9wQ29kZXNgIE9wQ29kZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIG11dGFibGVPcENvZGVzIE11dGFibGUgT3BDb2RlcyB0byBwcm9jZXNzXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gYW5jaG9yUk5vZGUgcGxhY2Ugd2hlcmUgdGhlIGkxOG4gbm9kZSBzaG91bGQgYmUgaW5zZXJ0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseU11dGFibGVPcENvZGVzKFxuICAgIHRWaWV3OiBUVmlldywgbXV0YWJsZU9wQ29kZXM6IEljdUNyZWF0ZU9wQ29kZXMsIGxWaWV3OiBMVmlldywgYW5jaG9yUk5vZGU6IFJOb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKGFuY2hvclJOb2RlKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIC8vIGByb290SWR4YCByZXByZXNlbnRzIHRoZSBub2RlIGludG8gd2hpY2ggYWxsIGluc2VydHMgaGFwcGVuLlxuICBsZXQgcm9vdElkeDogbnVtYmVyfG51bGwgPSBudWxsO1xuICAvLyBgcm9vdFJOb2RlYCByZXByZXNlbnRzIHRoZSByZWFsIG5vZGUgaW50byB3aGljaCB3ZSBpbnNlcnQuIFRoaXMgY2FuIGJlIGRpZmZlcmVudCBmcm9tXG4gIC8vIGBsVmlld1tyb290SWR4XWAgaWYgd2UgaGF2ZSBwcm9qZWN0aW9uLlxuICAvLyAgLSBudWxsIHdlIGRvbid0IGhhdmUgYSBwYXJlbnQgKGFzIGNhbiBiZSB0aGUgY2FzZSBpbiB3aGVuIHdlIGFyZSBpbnNlcnRpbmcgaW50byBhIHJvb3Qgb2ZcbiAgLy8gICAgTFZpZXcgd2hpY2ggaGFzIG5vIHBhcmVudC4pXG4gIC8vICAtIGBSRWxlbWVudGAgVGhlIGVsZW1lbnQgcmVwcmVzZW50aW5nIHRoZSByb290IGFmdGVyIHRha2luZyBwcm9qZWN0aW9uIGludG8gYWNjb3VudC5cbiAgbGV0IHJvb3RSTm9kZSE6IFJFbGVtZW50fG51bGw7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXV0YWJsZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBvcENvZGUgPSBtdXRhYmxlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IG11dGFibGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKGxWaWV3W3RleHROb2RlSW5kZXhdID09PSBudWxsKSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCB0ZXh0Tm9kZUluZGV4KTtcbiAgICAgICAgbFZpZXdbdGV4dE5vZGVJbmRleF0gPSBsb2NhdGVPckNyZWF0ZU5vZGUobFZpZXcsIHRleHROb2RlSW5kZXgsIG9wQ29kZSwgTm9kZS5URVhUX05PREUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgc3dpdGNoIChvcENvZGUgJiBJY3VDcmVhdGVPcENvZGUuTUFTS19JTlNUUlVDVElPTikge1xuICAgICAgICBjYXNlIEljdUNyZWF0ZU9wQ29kZS5BcHBlbmRDaGlsZDpcbiAgICAgICAgICBjb25zdCBwYXJlbnRJZHggPSBnZXRQYXJlbnRGcm9tSWN1Q3JlYXRlT3BDb2RlKG9wQ29kZSk7XG4gICAgICAgICAgaWYgKHJvb3RJZHggPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFRoZSBmaXJzdCBvcGVyYXRpb24gc2hvdWxkIHNhdmUgdGhlIGByb290SWR4YCBiZWNhdXNlIHRoZSBmaXJzdCBvcGVyYXRpb25cbiAgICAgICAgICAgIC8vIG11c3QgaW5zZXJ0IGludG8gdGhlIHJvb3QuIChPbmx5IHN1YnNlcXVlbnQgb3BlcmF0aW9ucyBjYW4gaW5zZXJ0IGludG8gYSBkeW5hbWljXG4gICAgICAgICAgICAvLyBwYXJlbnQpXG4gICAgICAgICAgICByb290SWR4ID0gcGFyZW50SWR4O1xuICAgICAgICAgICAgcm9vdFJOb2RlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgYW5jaG9yUk5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgaW5zZXJ0SW5Gcm9udE9mOiBSTm9kZXxudWxsO1xuICAgICAgICAgIGxldCBwYXJlbnRSTm9kZTogUkVsZW1lbnR8bnVsbDtcbiAgICAgICAgICBpZiAocGFyZW50SWR4ID09PSByb290SWR4KSB7XG4gICAgICAgICAgICBpbnNlcnRJbkZyb250T2YgPSBhbmNob3JSTm9kZTtcbiAgICAgICAgICAgIHBhcmVudFJOb2RlID0gcm9vdFJOb2RlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnNlcnRJbkZyb250T2YgPSBudWxsO1xuICAgICAgICAgICAgcGFyZW50Uk5vZGUgPSB1bndyYXBSTm9kZShsVmlld1twYXJlbnRJZHhdKSBhcyBSRWxlbWVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRklYTUUobWlza28pOiBSZWZhY3RvciB3aXRoIGBwcm9jZXNzSTE4blRleHRgXG4gICAgICAgICAgaWYgKHBhcmVudFJOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gaWYgdGhlIGBMVmlld2Agd2UgYXJlIGFkZGluZyB0byBpcyBub3QgYXR0YWNoZWQgdG8gYSBwYXJlbnQgYExWaWV3YC5cbiAgICAgICAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHRoZXJlIGlzIG5vIFwicm9vdFwiIHdlIGNhbiBhdHRhY2ggdG8uIFRoaXMgaXMgZmluZSwgYXMgd2Ugc3RpbGwgbmVlZCB0b1xuICAgICAgICAgICAgLy8gY3JlYXRlIHRoZSBlbGVtZW50cy4gV2hlbiB0aGUgYExWaWV3YCBnZXRzIGxhdGVyIGFkZGVkIHRvIGEgcGFyZW50IHRoZXNlIFwicm9vdFwiIG5vZGVzXG4gICAgICAgICAgICAvLyBnZXQgcGlja2VkIHVwIGFuZCBhZGRlZC5cbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKHBhcmVudFJOb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZklkeCA9IGdldFJlZkZyb21JY3VDcmVhdGVPcENvZGUob3BDb2RlKTtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihyZWZJZHgsIEhFQURFUl9PRkZTRVQsICdNaXNzaW5nIHJlZicpO1xuICAgICAgICAgICAgLy8gYHVud3JhcFJOb2RlYCBpcyBub3QgbmVlZGVkIGhlcmUgYXMgYWxsIG9mIHRoZXNlIHBvaW50IHRvIFJOb2RlcyBhcyBwYXJ0IG9mIHRoZSBpMThuXG4gICAgICAgICAgICAvLyB3aGljaCBjYW4ndCBoYXZlIGNvbXBvbmVudHMuXG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IGxWaWV3W3JlZklkeF0gYXMgUkVsZW1lbnQ7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShjaGlsZCk7XG4gICAgICAgICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCBjaGlsZCwgaW5zZXJ0SW5Gcm9udE9mLCBmYWxzZSk7XG4gICAgICAgICAgICBjb25zdCB0SWN1ID0gZ2V0VEljdSh0VmlldywgcmVmSWR4KTtcbiAgICAgICAgICAgIGlmICh0SWN1ICE9PSBudWxsICYmIHR5cGVvZiB0SWN1ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAvLyBJZiB3ZSBqdXN0IGFkZGVkIGEgY29tbWVudCBub2RlIHdoaWNoIGhhcyBJQ1UgdGhlbiB0aGF0IElDVSBtYXkgaGF2ZSBhbHJlYWR5IGJlZW5cbiAgICAgICAgICAgICAgLy8gcmVuZGVyZWQgYW5kIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIHJlLWFkZCBpdCBoZXJlLlxuICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VEljdSh0SWN1KTtcbiAgICAgICAgICAgICAgY29uc3QgY2FzZUluZGV4ID0gZ2V0Q3VycmVudElDVUNhc2VJbmRleCh0SWN1LCBsVmlldyk7XG4gICAgICAgICAgICAgIGlmIChjYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcHBseU11dGFibGVPcENvZGVzKHRWaWV3LCB0SWN1LmNyZWF0ZVtjYXNlSW5kZXhdLCBsVmlldywgbFZpZXdbdEljdS5hbmNob3JJZHhdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJY3VDcmVhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJY3VDcmVhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gVGhpcyBjb2RlIGlzIHVzZWQgZm9yIElDVSBleHByZXNzaW9ucyBvbmx5LCBzaW5jZSB3ZSBkb24ndCBzdXBwb3J0XG4gICAgICAgICAgLy8gZGlyZWN0aXZlcy9jb21wb25lbnRzIGluIElDVXMsIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaW5wdXRzIGhlcmVcbiAgICAgICAgICBzZXRFbGVtZW50QXR0cmlidXRlKFxuICAgICAgICAgICAgICByZW5kZXJlciwgZ2V0TmF0aXZlQnlJbmRleChlbGVtZW50Tm9kZUluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQsIG51bGwsIG51bGwsIGF0dHJOYW1lLFxuICAgICAgICAgICAgICBhdHRyVmFsdWUsIG51bGwpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX0kxOE5fU1RSVUNUVVJFLFxuICAgICAgICAgICAgICAgIGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgIGNhc2UgSUNVX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBjb21tZW50Tm9kZUluZGV4ID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgaWYgKGxWaWV3W2NvbW1lbnROb2RlSW5kZXhdID09PSBudWxsKSB7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGNvbW1lbnRWYWx1ZSwgJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7Y29tbWVudFZhbHVlfVwiIHRvIGJlIGEgY29tbWVudCBub2RlIHZhbHVlYCk7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5FeHBhbmRvUmFuZ2UobFZpZXcsIGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgICAgY29uc3QgY29tbWVudFJOb2RlID0gbFZpZXdbY29tbWVudE5vZGVJbmRleF0gPVxuICAgICAgICAgICAgICAgIGxvY2F0ZU9yQ3JlYXRlTm9kZShsVmlldywgY29tbWVudE5vZGVJbmRleCwgY29tbWVudFZhbHVlLCBOb2RlLkNPTU1FTlRfTk9ERSk7XG4gICAgICAgICAgICAvLyBGSVhNRShtaXNrbyk6IEF0dGFjaGluZyBwYXRjaCBkYXRhIGlzIG9ubHkgbmVlZGVkIGZvciB0aGUgcm9vdCAoQWxzbyBhZGQgdGVzdHMpXG4gICAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29tbWVudFJOb2RlLCBsVmlldyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVMRU1FTlRfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgaWYgKGxWaWV3W2VsZW1lbnROb2RlSW5kZXhdID09PSBudWxsKSB7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHRhZ05hbWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBgRXhwZWN0ZWQgXCIke3RhZ05hbWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG5cbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkV4cGFuZG9SYW5nZShsVmlldywgZWxlbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50Uk5vZGUgPSBsVmlld1tlbGVtZW50Tm9kZUluZGV4XSA9XG4gICAgICAgICAgICAgICAgbG9jYXRlT3JDcmVhdGVOb2RlKGxWaWV3LCBlbGVtZW50Tm9kZUluZGV4LCB0YWdOYW1lLCBOb2RlLkVMRU1FTlRfTk9ERSk7XG4gICAgICAgICAgICAvLyBGSVhNRShtaXNrbyk6IEF0dGFjaGluZyBwYXRjaCBkYXRhIGlzIG9ubHkgbmVlZGVkIGZvciB0aGUgcm9vdCAoQWxzbyBhZGQgdGVzdHMpXG4gICAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoZWxlbWVudFJOb2RlLCBsVmlldyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICB0aHJvd0Vycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIEFwcGx5IGBJMThuVXBkYXRlT3BDb2Rlc2AgT3BDb2Rlc1xuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqIEBwYXJhbSB1cGRhdGVPcENvZGVzIE9wQ29kZXMgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGJpbmRpbmdzU3RhcnRJbmRleCBMb2NhdGlvbiBvZiB0aGUgZmlyc3QgYMm1ybVpMThuQXBwbHlgXG4gKiBAcGFyYW0gY2hhbmdlTWFzayBFYWNoIGJpdCBjb3JyZXNwb25kcyB0byBhIGDJtcm1aTE4bkV4cGAgKENvdW50aW5nIGJhY2t3YXJkcyBmcm9tXG4gKiAgICAgYGJpbmRpbmdzU3RhcnRJbmRleGApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVVwZGF0ZU9wQ29kZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBiaW5kaW5nc1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBjaGFuZ2VNYXNrOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cGRhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gYml0IGNvZGUgdG8gY2hlY2sgaWYgd2Ugc2hvdWxkIGFwcGx5IHRoZSBuZXh0IHVwZGF0ZVxuICAgIGNvbnN0IGNoZWNrQml0ID0gdXBkYXRlT3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgLy8gTnVtYmVyIG9mIG9wQ29kZXMgdG8gc2tpcCB1bnRpbCBuZXh0IHNldCBvZiB1cGRhdGUgY29kZXNcbiAgICBjb25zdCBza2lwQ29kZXMgPSB1cGRhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgIGlmIChjaGVja0JpdCAmIGNoYW5nZU1hc2spIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2hlY2tlZFxuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBvcENvZGUgcmVwcmVzZW50IGBpMThuRXhwYCB2YWx1ZXMgb2Zmc2V0LlxuICAgICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KGxWaWV3W2JpbmRpbmdzU3RhcnRJbmRleCAtIG9wQ29kZV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSAob3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRik7XG4gICAgICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcE5hbWUgPSB1cGRhdGVPcENvZGVzWysral0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhbml0aXplRm4gPSB1cGRhdGVPcENvZGVzWysral0gYXMgU2FuaXRpemVyRm4gfCBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHROb2RlT3JUYWdOYW1lID0gdFZpZXcuZGF0YVtub2RlSW5kZXhdIGFzIFROb2RlIHwgc3RyaW5nO1xuICAgICAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlT3JUYWdOYW1lLCAnRXhwZXJ0aW5nIFROb2RlIG9yIHN0cmluZycpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdE5vZGVPclRhZ05hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAvLyBJRiB3ZSBkb24ndCBoYXZlIGEgYFROb2RlYCwgdGhlbiB3ZSBhcmUgYW4gZWxlbWVudCBpbiBJQ1UgKGFzIElDVSBjb250ZW50IGRvZXNcbiAgICAgICAgICAgICAgICAgIC8vIG5vdCBoYXZlIFROb2RlKSwgaW4gd2hpY2ggY2FzZSB3ZSBrbm93IHRoYXQgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMsIGFuZCBoZW5jZVxuICAgICAgICAgICAgICAgICAgLy8gd2UgdXNlIGF0dHJpYnV0ZSBzZXR0aW5nLlxuICAgICAgICAgICAgICAgICAgc2V0RWxlbWVudEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgICAgICBsVmlld1tSRU5ERVJFUl0sIGxWaWV3W25vZGVJbmRleF0sIG51bGwsIHROb2RlT3JUYWdOYW1lLCBwcm9wTmFtZSwgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgc2FuaXRpemVGbik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKFxuICAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCB0Tm9kZU9yVGFnTmFtZSwgbFZpZXcsIHByb3BOYW1lLCB2YWx1ZSwgbFZpZXdbUkVOREVSRVJdLCBzYW5pdGl6ZUZuLFxuICAgICAgICAgICAgICAgICAgICAgIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIGNvbnN0IHJUZXh0ID0gbFZpZXdbbm9kZUluZGV4XSBhcyBSVGV4dCB8IG51bGw7XG4gICAgICAgICAgICAgICAgclRleHQgIT09IG51bGwgJiYgdXBkYXRlVGV4dE5vZGUobFZpZXdbUkVOREVSRVJdLCByVGV4dCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIGFwcGx5SWN1U3dpdGNoQ2FzZSh0VmlldywgZ2V0VEljdSh0Vmlldywgbm9kZUluZGV4KSEsIGxWaWV3LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgYXBwbHlJY3VVcGRhdGVDYXNlKHRWaWV3LCBnZXRUSWN1KHRWaWV3LCBub2RlSW5kZXgpISwgYmluZGluZ3NTdGFydEluZGV4LCBsVmlldyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGlmIChvcENvZGUgPiAwICYmIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSA9PT0gSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUpIHtcbiAgICAgICAgLy8gU3BlY2lhbCBjYXNlIGZvciB0aGUgYGljdVVwZGF0ZUNhc2VgLiBJdCBjb3VsZCBiZSB0aGF0IHRoZSBtYXNrIGRpZCBub3QgbWF0Y2gsIGJ1dFxuICAgICAgICAvLyB3ZSBzdGlsbCBuZWVkIHRvIGV4ZWN1dGUgYGljdVVwZGF0ZUNhc2VgIGJlY2F1c2UgdGhlIGNhc2UgaGFzIGNoYW5nZWQgcmVjZW50bHkgZHVlIHRvXG4gICAgICAgIC8vIHByZXZpb3VzIGBpY3VTd2l0Y2hDYXNlYCBpbnN0cnVjdGlvbi4gKGBpY3VTd2l0Y2hDYXNlYCBhbmQgYGljdVVwZGF0ZUNhc2VgIGFsd2F5cyBjb21lIGluXG4gICAgICAgIC8vIHBhaXJzLilcbiAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gKG9wQ29kZSA+Pj4gSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYpO1xuICAgICAgICBjb25zdCB0SWN1ID0gZ2V0VEljdSh0Vmlldywgbm9kZUluZGV4KSE7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGxWaWV3W3RJY3UuY3VycmVudENhc2VMVmlld0luZGV4XTtcbiAgICAgICAgaWYgKGN1cnJlbnRJbmRleCA8IDApIHtcbiAgICAgICAgICBhcHBseUljdVVwZGF0ZUNhc2UodFZpZXcsIHRJY3UsIGJpbmRpbmdzU3RhcnRJbmRleCwgbFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgT3BDb2RlcyBhc3NvY2lhdGVkIHdpdGggdXBkYXRpbmcgYW4gZXhpc3RpbmcgSUNVLlxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSB0SWN1IEN1cnJlbnQgYFRJY3VgXG4gKiBAcGFyYW0gYmluZGluZ3NTdGFydEluZGV4IExvY2F0aW9uIG9mIHRoZSBmaXJzdCBgybXJtWkxOG5BcHBseWBcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqL1xuZnVuY3Rpb24gYXBwbHlJY3VVcGRhdGVDYXNlKHRWaWV3OiBUVmlldywgdEljdTogVEljdSwgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCB0SWN1LmN1cnJlbnRDYXNlTFZpZXdJbmRleCk7XG4gIGxldCBhY3RpdmVDYXNlSW5kZXggPSBsVmlld1t0SWN1LmN1cnJlbnRDYXNlTFZpZXdJbmRleF07XG4gIGlmIChhY3RpdmVDYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICBsZXQgbWFzayA9IGNoYW5nZU1hc2s7XG4gICAgaWYgKGFjdGl2ZUNhc2VJbmRleCA8IDApIHtcbiAgICAgIC8vIENsZWFyIHRoZSBmbGFnLlxuICAgICAgLy8gTmVnYXRpdmUgbnVtYmVyIG1lYW5zIHRoYXQgdGhlIElDVSB3YXMgZnJlc2hseSBjcmVhdGVkIGFuZCB3ZSBuZWVkIHRvIGZvcmNlIHRoZSB1cGRhdGUuXG4gICAgICBhY3RpdmVDYXNlSW5kZXggPSBsVmlld1t0SWN1LmN1cnJlbnRDYXNlTFZpZXdJbmRleF0gPSB+YWN0aXZlQ2FzZUluZGV4O1xuICAgICAgLy8gLTEgaXMgc2FtZSBhcyBhbGwgYml0cyBvbiwgd2hpY2ggc2ltdWxhdGVzIGNyZWF0aW9uIHNpbmNlIGl0IG1hcmtzIGFsbCBiaXRzIGRpcnR5XG4gICAgICBtYXNrID0gLTE7XG4gICAgfVxuICAgIGFwcGx5VXBkYXRlT3BDb2Rlcyh0VmlldywgbFZpZXcsIHRJY3UudXBkYXRlW2FjdGl2ZUNhc2VJbmRleF0sIGJpbmRpbmdzU3RhcnRJbmRleCwgbWFzayk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBPcENvZGVzIGFzc29jaWF0ZWQgd2l0aCBzd2l0Y2hpbmcgYSBjYXNlIG9uIElDVS5cbiAqXG4gKiBUaGlzIGludm9sdmVzIHRlYXJpbmcgZG93biBleGlzdGluZyBjYXNlIGFuZCB0aGFuIGJ1aWxkaW5nIHVwIGEgbmV3IGNhc2UuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIHRJY3UgQ3VycmVudCBgVEljdWBcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSBvZiB0aGUgY2FzZSB0byB1cGRhdGUgdG8uXG4gKi9cbmZ1bmN0aW9uIGFwcGx5SWN1U3dpdGNoQ2FzZSh0VmlldzogVFZpZXcsIHRJY3U6IFRJY3UsIGxWaWV3OiBMVmlldywgdmFsdWU6IHN0cmluZykge1xuICAvLyBSZWJ1aWxkIGEgbmV3IGNhc2UgZm9yIHRoaXMgSUNVXG4gIGNvbnN0IGNhc2VJbmRleCA9IGdldENhc2VJbmRleCh0SWN1LCB2YWx1ZSk7XG4gIGxldCBhY3RpdmVDYXNlSW5kZXggPSBnZXRDdXJyZW50SUNVQ2FzZUluZGV4KHRJY3UsIGxWaWV3KTtcbiAgaWYgKGFjdGl2ZUNhc2VJbmRleCAhPT0gY2FzZUluZGV4KSB7XG4gICAgYXBwbHlJY3VTd2l0Y2hDYXNlUmVtb3ZlKHRWaWV3LCB0SWN1LCBsVmlldyk7XG4gICAgbFZpZXdbdEljdS5jdXJyZW50Q2FzZUxWaWV3SW5kZXhdID0gY2FzZUluZGV4ID09PSBudWxsID8gbnVsbCA6IH5jYXNlSW5kZXg7XG4gICAgaWYgKGNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICBjb25zdCBhbmNob3JSTm9kZSA9IGxWaWV3W3RJY3UuYW5jaG9ySWR4XTtcbiAgICAgIGlmIChhbmNob3JSTm9kZSkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShhbmNob3JSTm9kZSk7XG4gICAgICAgIGFwcGx5TXV0YWJsZU9wQ29kZXModFZpZXcsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIGxWaWV3LCBhbmNob3JSTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXBwbHkgT3BDb2RlcyBhc3NvY2lhdGVkIHdpdGggdGVhcmluZyBJQ1UgY2FzZS5cbiAqXG4gKiBUaGlzIGludm9sdmVzIHRlYXJpbmcgZG93biBleGlzdGluZyBjYXNlIGFuZCB0aGFuIGJ1aWxkaW5nIHVwIGEgbmV3IGNhc2UuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIHRJY3UgQ3VycmVudCBgVEljdWBcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqL1xuZnVuY3Rpb24gYXBwbHlJY3VTd2l0Y2hDYXNlUmVtb3ZlKHRWaWV3OiBUVmlldywgdEljdTogVEljdSwgbFZpZXc6IExWaWV3KSB7XG4gIGxldCBhY3RpdmVDYXNlSW5kZXggPSBnZXRDdXJyZW50SUNVQ2FzZUluZGV4KHRJY3UsIGxWaWV3KTtcbiAgaWYgKGFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHJlbW92ZUNvZGVzID0gdEljdS5yZW1vdmVbYWN0aXZlQ2FzZUluZGV4XTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbW92ZUNvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlT3JJY3VJbmRleCA9IHJlbW92ZUNvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChub2RlT3JJY3VJbmRleCA+IDApIHtcbiAgICAgICAgLy8gUG9zaXRpdmUgbnVtYmVycyBhcmUgYFJOb2RlYHMuXG4gICAgICAgIGNvbnN0IHJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChub2RlT3JJY3VJbmRleCwgbFZpZXcpO1xuICAgICAgICByTm9kZSAhPT0gbnVsbCAmJiBuYXRpdmVSZW1vdmVOb2RlKGxWaWV3W1JFTkRFUkVSXSwgck5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBhcmUgSUNVc1xuICAgICAgICBhcHBseUljdVN3aXRjaENhc2VSZW1vdmUodFZpZXcsIGdldFRJY3UodFZpZXcsIH5ub2RlT3JJY3VJbmRleCkhLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBjYXNlIG9mIGFuIElDVSBleHByZXNzaW9uIGRlcGVuZGluZyBvbiB0aGUgbWFpbiBiaW5kaW5nIHZhbHVlXG4gKlxuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBiaW5kaW5nVmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBtYWluIGJpbmRpbmcgdXNlZCBieSB0aGlzIElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIGdldENhc2VJbmRleChpY3VFeHByZXNzaW9uOiBUSWN1LCBiaW5kaW5nVmFsdWU6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXNlKGJpbmRpbmdWYWx1ZSwgZ2V0TG9jYWxlSWQoKSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IG51bGwgOiBpbmRleDtcbn1cbiJdfQ==