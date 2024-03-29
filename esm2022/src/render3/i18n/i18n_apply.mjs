/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
import { claimDehydratedIcuCase, isI18nHydrationSupportEnabled } from '../../hydration/i18n';
import { locateI18nRNodeByIndex } from '../../hydration/node_lookup_utils';
import { isDisconnectedNode, markRNodeAsClaimedByHydration } from '../../hydration/utils';
import { getPluralCase } from '../../i18n/localization';
import { assertDefined, assertDomNode, assertEqual, assertGreaterThan, assertIndexInRange, throwError } from '../../util/assert';
import { assertIndexInExpandoRange, assertTIcu } from '../assert';
import { attachPatchData } from '../context_discovery';
import { elementPropertyInternal, setElementAttribute } from '../instructions/shared';
import { ELEMENT_MARKER, I18nCreateOpCode, ICU_MARKER } from '../interfaces/i18n';
import { HEADER_OFFSET, HYDRATION, RENDERER } from '../interfaces/view';
import { createCommentNode, createElementNode, createTextNode, nativeInsertBefore, nativeParentNode, nativeRemoveNode, updateTextNode } from '../node_manipulation';
import { getBindingIndex, isInSkipHydrationBlock, lastNodeWasCreated, wasLastNodeCreated } from '../state';
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
function createNodeWithoutHydration(lView, textOrName, nodeType) {
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
let _locateOrCreateNode = (lView, index, textOrName, nodeType) => {
    lastNodeWasCreated(true);
    return createNodeWithoutHydration(lView, textOrName, nodeType);
};
function locateOrCreateNodeImpl(lView, index, textOrName, nodeType) {
    const hydrationInfo = lView[HYDRATION];
    const noOffsetIndex = index - HEADER_OFFSET;
    const isNodeCreationMode = !isI18nHydrationSupportEnabled() || !hydrationInfo ||
        isInSkipHydrationBlock() || isDisconnectedNode(hydrationInfo, noOffsetIndex);
    lastNodeWasCreated(isNodeCreationMode);
    if (isNodeCreationMode) {
        return createNodeWithoutHydration(lView, textOrName, nodeType);
    }
    const native = locateI18nRNodeByIndex(hydrationInfo, noOffsetIndex);
    // TODO: Improve error handling
    //
    // Other hydration paths use validateMatchingNode() in order to provide
    // detailed information in development mode about the expected DOM.
    // However, not every node in an i18n block has a TNode. Instead, we
    // need to be able to use the AST to generate a similar message.
    ngDevMode && assertDefined(native, 'expected native element');
    ngDevMode && assertEqual(native.nodeType, nodeType, 'expected matching nodeType');
    ngDevMode && nodeType === Node.ELEMENT_NODE &&
        assertEqual(native.tagName.toLowerCase(), textOrName.toLowerCase(), 'expecting matching tagName');
    ngDevMode && markRNodeAsClaimedByHydration(native);
    return native;
}
export function enableLocateOrCreateI18nNodeImpl() {
    _locateOrCreateNode = locateOrCreateNodeImpl;
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
        let lastNodeWasCreated = false;
        if (rNode === null) {
            // We only create new DOM nodes if they don't already exist: If ICU switches case back to a
            // case which was already instantiated, no need to create new DOM nodes.
            rNode = lView[index] =
                _locateOrCreateNode(lView, index, text, isComment ? Node.COMMENT_NODE : Node.TEXT_NODE);
            lastNodeWasCreated = wasLastNodeCreated();
        }
        if (appendNow && parentRNode !== null && lastNodeWasCreated) {
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
                lView[textNodeIndex] = _locateOrCreateNode(lView, textNodeIndex, opCode, Node.TEXT_NODE);
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
                            _locateOrCreateNode(lView, commentNodeIndex, commentValue, Node.COMMENT_NODE);
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
                            _locateOrCreateNode(lView, elementNodeIndex, tagName, Node.ELEMENT_NODE);
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
            claimDehydratedIcuCase(lView, tIcu.anchorIdx, caseIndex);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9hcHBseS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi9pMThuX2FwcGx5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSw2QkFBNkIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzNGLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ3pFLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSw2QkFBNkIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3hGLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0gsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFVBQVUsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBMEQsVUFBVSxFQUEwRCxNQUFNLG9CQUFvQixDQUFDO0FBSWpNLE9BQU8sRUFBQyxhQUFhLEVBQUUsU0FBUyxFQUFTLFFBQVEsRUFBUSxNQUFNLG9CQUFvQixDQUFDO0FBQ3BGLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFDLE1BQU0sc0JB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SyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3QyxNQUFNO1lBQ1IsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge2NsYWltRGVoeWRyYXRlZEljdUNhc2UsIGlzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkfSBmcm9tICcuLi8uLi9oeWRyYXRpb24vaTE4bic7XG5pbXBvcnQge2xvY2F0ZUkxOG5STm9kZUJ5SW5kZXh9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9ub2RlX2xvb2t1cF91dGlscyc7XG5pbXBvcnQge2lzRGlzY29ubmVjdGVkTm9kZSwgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb259IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi91dGlscyc7XG5pbXBvcnQge2dldFBsdXJhbENhc2V9IGZyb20gJy4uLy4uL2kxOG4vbG9jYWxpemF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRJbmRleEluUmFuZ2UsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0SW5kZXhJbkV4cGFuZG9SYW5nZSwgYXNzZXJ0VEljdX0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2VsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBzZXRFbGVtZW50QXR0cmlidXRlfSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7RUxFTUVOVF9NQVJLRVIsIEkxOG5DcmVhdGVPcENvZGUsIEkxOG5DcmVhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgSUNVX01BUktFUiwgSWN1Q3JlYXRlT3BDb2RlLCBJY3VDcmVhdGVPcENvZGVzLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZSwgUlRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSFlEUkFUSU9OLCBMVmlldywgUkVOREVSRVIsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtjcmVhdGVDb21tZW50Tm9kZSwgY3JlYXRlRWxlbWVudE5vZGUsIGNyZWF0ZVRleHROb2RlLCBuYXRpdmVJbnNlcnRCZWZvcmUsIG5hdGl2ZVBhcmVudE5vZGUsIG5hdGl2ZVJlbW92ZU5vZGUsIHVwZGF0ZVRleHROb2RlfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgaXNJblNraXBIeWRyYXRpb25CbG9jaywgbGFzdE5vZGVXYXNDcmVhdGVkLCB3YXNMYXN0Tm9kZUNyZWF0ZWR9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2dldExvY2FsZUlkfSBmcm9tICcuL2kxOG5fbG9jYWxlX2lkJztcbmltcG9ydCB7Z2V0Q3VycmVudElDVUNhc2VJbmRleCwgZ2V0UGFyZW50RnJvbUljdUNyZWF0ZU9wQ29kZSwgZ2V0UmVmRnJvbUljdUNyZWF0ZU9wQ29kZSwgZ2V0VEljdX0gZnJvbSAnLi9pMThuX3V0aWwnO1xuXG5cblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIHdoaWNoIGlucHV0IGJpbmRpbmdzIGluIGDJtcm1aTE4bkV4cGAgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBlZmZpY2llbnRseSB1cGRhdGUgZXhwcmVzc2lvbnMgaW4gaTE4biBvbmx5IHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgaW5wdXQgaGFzXG4gKiBjaGFuZ2VkLlxuICpcbiAqIDEpIEVhY2ggYml0IHJlcHJlc2VudHMgd2hpY2ggb2YgdGhlIGDJtcm1aTE4bkV4cGAgaGFzIGNoYW5nZWQuXG4gKiAyKSBUaGVyZSBhcmUgMzIgYml0cyBhbGxvd2VkIGluIEpTLlxuICogMykgQml0IDMyIGlzIHNwZWNpYWwgYXMgaXQgaXMgc2hhcmVkIGZvciBhbGwgY2hhbmdlcyBwYXN0IDMyLiAoSW4gb3RoZXIgd29yZHMgaWYgeW91IGhhdmUgbW9yZVxuICogdGhhbiAzMiBgybXJtWkxOG5FeHBgIHRoZW4gYWxsIGNoYW5nZXMgcGFzdCAzMm5kIGDJtcm1aTE4bkV4cGAgd2lsbCBiZSBtYXBwZWQgdG8gc2FtZSBiaXQuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2UgbWF5IGVuZCB1cCBjaGFuZ2luZyBtb3JlIHRoYW4gd2UgbmVlZCB0by4gQnV0IGkxOG4gZXhwcmVzc2lvbnMgd2l0aCAzMiBiaW5kaW5ncyBpcyByYXJlXG4gKiBzbyBpbiBwcmFjdGljZSBpdCBzaG91bGQgbm90IGJlIGFuIGlzc3VlLilcbiAqL1xubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2Ygd2hpY2ggYml0IG5lZWRzIHRvIGJlIHVwZGF0ZWQgaW4gYGNoYW5nZU1hc2tgXG4gKlxuICogVGhpcyB2YWx1ZSBnZXRzIGluY3JlbWVudGVkIG9uIGV2ZXJ5IGNhbGwgdG8gYMm1ybVpMThuRXhwYFxuICovXG5sZXQgY2hhbmdlTWFza0NvdW50ZXIgPSAwO1xuXG4vKipcbiAqIEtlZXAgdHJhY2sgb2Ygd2hpY2ggaW5wdXQgYmluZGluZ3MgaW4gYMm1ybVpMThuRXhwYCBoYXZlIGNoYW5nZWQuXG4gKlxuICogYHNldE1hc2tCaXRgIGdldHMgaW52b2tlZCBieSBlYWNoIGNhbGwgdG8gYMm1ybVpMThuRXhwYC5cbiAqXG4gKiBAcGFyYW0gaGFzQ2hhbmdlIGRpZCBgybXJtWkxOG5FeHBgIGRldGVjdCBhIGNoYW5nZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldE1hc2tCaXQoaGFzQ2hhbmdlOiBib29sZWFuKSB7XG4gIGlmIChoYXNDaGFuZ2UpIHtcbiAgICBjaGFuZ2VNYXNrID0gY2hhbmdlTWFzayB8ICgxIDw8IE1hdGgubWluKGNoYW5nZU1hc2tDb3VudGVyLCAzMSkpO1xuICB9XG4gIGNoYW5nZU1hc2tDb3VudGVyKys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUkxOG4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGNoYW5nZU1hc2tDb3VudGVyID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFRJMThuIHwgSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgLy8gV2hlbiBgaW5kZXhgIHBvaW50cyB0byBhbiBgybXJtWkxOG5BdHRyaWJ1dGVzYCB0aGVuIHdlIGhhdmUgYW4gYXJyYXkgb3RoZXJ3aXNlIGBUSTE4bmBcbiAgICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkodEkxOG4pID8gdEkxOG4gYXMgSTE4blVwZGF0ZU9wQ29kZXMgOiAodEkxOG4gYXMgVEkxOG4pLnVwZGF0ZTtcbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBnZXRCaW5kaW5nSW5kZXgoKSAtIGNoYW5nZU1hc2tDb3VudGVyIC0gMTtcbiAgICBhcHBseVVwZGF0ZU9wQ29kZXModFZpZXcsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2spO1xuICB9XG4gIC8vIFJlc2V0IGNoYW5nZU1hc2sgJiBtYXNrQml0IHRvIGRlZmF1bHQgZm9yIHRoZSBuZXh0IHVwZGF0ZSBjeWNsZVxuICBjaGFuZ2VNYXNrID0gMGIwO1xuICBjaGFuZ2VNYXNrQ291bnRlciA9IDA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vZGVXaXRob3V0SHlkcmF0aW9uKFxuICAgIGxWaWV3OiBMVmlldywgdGV4dE9yTmFtZTogc3RyaW5nLFxuICAgIG5vZGVUeXBlOiB0eXBlb2YgTm9kZS5DT01NRU5UX05PREV8dHlwZW9mIE5vZGUuVEVYVF9OT0RFfHR5cGVvZiBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcblxuICBzd2l0Y2ggKG5vZGVUeXBlKSB7XG4gICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgIHJldHVybiBjcmVhdGVDb21tZW50Tm9kZShyZW5kZXJlciwgdGV4dE9yTmFtZSk7XG5cbiAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgcmV0dXJuIGNyZWF0ZVRleHROb2RlKHJlbmRlcmVyLCB0ZXh0T3JOYW1lKTtcblxuICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICByZXR1cm4gY3JlYXRlRWxlbWVudE5vZGUocmVuZGVyZXIsIHRleHRPck5hbWUsIG51bGwpO1xuICB9XG59XG5cbmxldCBfbG9jYXRlT3JDcmVhdGVOb2RlOiB0eXBlb2YgbG9jYXRlT3JDcmVhdGVOb2RlSW1wbCA9IChsVmlldywgaW5kZXgsIHRleHRPck5hbWUsIG5vZGVUeXBlKSA9PiB7XG4gIGxhc3ROb2RlV2FzQ3JlYXRlZCh0cnVlKTtcbiAgcmV0dXJuIGNyZWF0ZU5vZGVXaXRob3V0SHlkcmF0aW9uKGxWaWV3LCB0ZXh0T3JOYW1lLCBub2RlVHlwZSk7XG59O1xuXG5mdW5jdGlvbiBsb2NhdGVPckNyZWF0ZU5vZGVJbXBsKFxuICAgIGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdGV4dE9yTmFtZTogc3RyaW5nLFxuICAgIG5vZGVUeXBlOiB0eXBlb2YgTm9kZS5DT01NRU5UX05PREV8dHlwZW9mIE5vZGUuVEVYVF9OT0RFfHR5cGVvZiBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICBjb25zdCBoeWRyYXRpb25JbmZvID0gbFZpZXdbSFlEUkFUSU9OXTtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IGluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3QgaXNOb2RlQ3JlYXRpb25Nb2RlID0gIWlzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkKCkgfHwgIWh5ZHJhdGlvbkluZm8gfHxcbiAgICAgIGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soKSB8fCBpc0Rpc2Nvbm5lY3RlZE5vZGUoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCk7XG5cbiAgbGFzdE5vZGVXYXNDcmVhdGVkKGlzTm9kZUNyZWF0aW9uTW9kZSk7XG4gIGlmIChpc05vZGVDcmVhdGlvbk1vZGUpIHtcbiAgICByZXR1cm4gY3JlYXRlTm9kZVdpdGhvdXRIeWRyYXRpb24obFZpZXcsIHRleHRPck5hbWUsIG5vZGVUeXBlKTtcbiAgfVxuXG4gIGNvbnN0IG5hdGl2ZSA9IGxvY2F0ZUkxOG5STm9kZUJ5SW5kZXgoaHlkcmF0aW9uSW5mbyEsIG5vT2Zmc2V0SW5kZXgpIGFzIFJOb2RlO1xuXG4gIC8vIFRPRE86IEltcHJvdmUgZXJyb3IgaGFuZGxpbmdcbiAgLy9cbiAgLy8gT3RoZXIgaHlkcmF0aW9uIHBhdGhzIHVzZSB2YWxpZGF0ZU1hdGNoaW5nTm9kZSgpIGluIG9yZGVyIHRvIHByb3ZpZGVcbiAgLy8gZGV0YWlsZWQgaW5mb3JtYXRpb24gaW4gZGV2ZWxvcG1lbnQgbW9kZSBhYm91dCB0aGUgZXhwZWN0ZWQgRE9NLlxuICAvLyBIb3dldmVyLCBub3QgZXZlcnkgbm9kZSBpbiBhbiBpMThuIGJsb2NrIGhhcyBhIFROb2RlLiBJbnN0ZWFkLCB3ZVxuICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gdXNlIHRoZSBBU1QgdG8gZ2VuZXJhdGUgYSBzaW1pbGFyIG1lc3NhZ2UuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5hdGl2ZSwgJ2V4cGVjdGVkIG5hdGl2ZSBlbGVtZW50Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCgobmF0aXZlIGFzIE5vZGUpLm5vZGVUeXBlLCBub2RlVHlwZSwgJ2V4cGVjdGVkIG1hdGNoaW5nIG5vZGVUeXBlJyk7XG4gIG5nRGV2TW9kZSAmJiBub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIChuYXRpdmUgYXMgSFRNTEVsZW1lbnQpLnRhZ05hbWUudG9Mb3dlckNhc2UoKSwgdGV4dE9yTmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICdleHBlY3RpbmcgbWF0Y2hpbmcgdGFnTmFtZScpO1xuICBuZ0Rldk1vZGUgJiYgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb24obmF0aXZlKTtcblxuICByZXR1cm4gbmF0aXZlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlTG9jYXRlT3JDcmVhdGVJMThuTm9kZUltcGwoKSB7XG4gIF9sb2NhdGVPckNyZWF0ZU5vZGUgPSBsb2NhdGVPckNyZWF0ZU5vZGVJbXBsO1xufVxuXG4vKipcbiAqIEFwcGx5IGBJMThuQ3JlYXRlT3BDb2Rlc2Agb3AtY29kZXMgYXMgc3RvcmVkIGluIGBUSTE4bi5jcmVhdGVgLlxuICpcbiAqIENyZWF0ZXMgdGV4dCAoYW5kIGNvbW1lbnQpIG5vZGVzIHdoaWNoIGFyZSBpbnRlcm5hdGlvbmFsaXplZC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBsVmlld1xuICogQHBhcmFtIGNyZWF0ZU9wQ29kZXMgU2V0IG9mIG9wLWNvZGVzIHRvIGFwcGx5XG4gKiBAcGFyYW0gcGFyZW50Uk5vZGUgUGFyZW50IG5vZGUgKHNvIHRoYXQgZGlyZWN0IGNoaWxkcmVuIGNhbiBiZSBhZGRlZCBlYWdlcmx5KSBvciBgbnVsbGAgaWYgaXQgaXNcbiAqICAgICBhIHJvb3Qgbm9kZS5cbiAqIEBwYXJhbSBpbnNlcnRJbkZyb250T2YgRE9NIG5vZGUgdGhhdCBzaG91bGQgYmUgdXNlZCBhcyBhbiBhbmNob3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNyZWF0ZU9wQ29kZXMoXG4gICAgbFZpZXc6IExWaWV3LCBjcmVhdGVPcENvZGVzOiBJMThuQ3JlYXRlT3BDb2RlcywgcGFyZW50Uk5vZGU6IFJFbGVtZW50fG51bGwsXG4gICAgaW5zZXJ0SW5Gcm9udE9mOiBSRWxlbWVudHxudWxsKTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNyZWF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBvcENvZGUgPSBjcmVhdGVPcENvZGVzW2krK10gYXMgYW55O1xuICAgIGNvbnN0IHRleHQgPSBjcmVhdGVPcENvZGVzW2ldIGFzIHN0cmluZztcbiAgICBjb25zdCBpc0NvbW1lbnQgPSAob3BDb2RlICYgSTE4bkNyZWF0ZU9wQ29kZS5DT01NRU5UKSA9PT0gSTE4bkNyZWF0ZU9wQ29kZS5DT01NRU5UO1xuICAgIGNvbnN0IGFwcGVuZE5vdyA9XG4gICAgICAgIChvcENvZGUgJiBJMThuQ3JlYXRlT3BDb2RlLkFQUEVORF9FQUdFUkxZKSA9PT0gSTE4bkNyZWF0ZU9wQ29kZS5BUFBFTkRfRUFHRVJMWTtcbiAgICBjb25zdCBpbmRleCA9IG9wQ29kZSA+Pj4gSTE4bkNyZWF0ZU9wQ29kZS5TSElGVDtcbiAgICBsZXQgck5vZGUgPSBsVmlld1tpbmRleF07XG4gICAgbGV0IGxhc3ROb2RlV2FzQ3JlYXRlZCA9IGZhbHNlO1xuICAgIGlmIChyTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gV2Ugb25seSBjcmVhdGUgbmV3IERPTSBub2RlcyBpZiB0aGV5IGRvbid0IGFscmVhZHkgZXhpc3Q6IElmIElDVSBzd2l0Y2hlcyBjYXNlIGJhY2sgdG8gYVxuICAgICAgLy8gY2FzZSB3aGljaCB3YXMgYWxyZWFkeSBpbnN0YW50aWF0ZWQsIG5vIG5lZWQgdG8gY3JlYXRlIG5ldyBET00gbm9kZXMuXG4gICAgICByTm9kZSA9IGxWaWV3W2luZGV4XSA9XG4gICAgICAgICAgX2xvY2F0ZU9yQ3JlYXRlTm9kZShsVmlldywgaW5kZXgsIHRleHQsIGlzQ29tbWVudCA/IE5vZGUuQ09NTUVOVF9OT0RFIDogTm9kZS5URVhUX05PREUpO1xuICAgICAgbGFzdE5vZGVXYXNDcmVhdGVkID0gd2FzTGFzdE5vZGVDcmVhdGVkKCk7XG4gICAgfVxuICAgIGlmIChhcHBlbmROb3cgJiYgcGFyZW50Uk5vZGUgIT09IG51bGwgJiYgbGFzdE5vZGVXYXNDcmVhdGVkKSB7XG4gICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCByTm9kZSwgaW5zZXJ0SW5Gcm9udE9mLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXBwbHkgYEkxOG5NdXRhdGVPcENvZGVzYCBPcENvZGVzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSBtdXRhYmxlT3BDb2RlcyBNdXRhYmxlIE9wQ29kZXMgdG8gcHJvY2Vzc1xuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YFxuICogQHBhcmFtIGFuY2hvclJOb2RlIHBsYWNlIHdoZXJlIHRoZSBpMThuIG5vZGUgc2hvdWxkIGJlIGluc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlNdXRhYmxlT3BDb2RlcyhcbiAgICB0VmlldzogVFZpZXcsIG11dGFibGVPcENvZGVzOiBJY3VDcmVhdGVPcENvZGVzLCBsVmlldzogTFZpZXcsIGFuY2hvclJOb2RlOiBSTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShhbmNob3JSTm9kZSk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAvLyBgcm9vdElkeGAgcmVwcmVzZW50cyB0aGUgbm9kZSBpbnRvIHdoaWNoIGFsbCBpbnNlcnRzIGhhcHBlbi5cbiAgbGV0IHJvb3RJZHg6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgLy8gYHJvb3RSTm9kZWAgcmVwcmVzZW50cyB0aGUgcmVhbCBub2RlIGludG8gd2hpY2ggd2UgaW5zZXJ0LiBUaGlzIGNhbiBiZSBkaWZmZXJlbnQgZnJvbVxuICAvLyBgbFZpZXdbcm9vdElkeF1gIGlmIHdlIGhhdmUgcHJvamVjdGlvbi5cbiAgLy8gIC0gbnVsbCB3ZSBkb24ndCBoYXZlIGEgcGFyZW50IChhcyBjYW4gYmUgdGhlIGNhc2UgaW4gd2hlbiB3ZSBhcmUgaW5zZXJ0aW5nIGludG8gYSByb290IG9mXG4gIC8vICAgIExWaWV3IHdoaWNoIGhhcyBubyBwYXJlbnQuKVxuICAvLyAgLSBgUkVsZW1lbnRgIFRoZSBlbGVtZW50IHJlcHJlc2VudGluZyB0aGUgcm9vdCBhZnRlciB0YWtpbmcgcHJvamVjdGlvbiBpbnRvIGFjY291bnQuXG4gIGxldCByb290Uk5vZGUhOiBSRWxlbWVudHxudWxsO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG11dGFibGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gbXV0YWJsZU9wQ29kZXNbaV07XG4gICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHRleHROb2RlSW5kZXggPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChsVmlld1t0ZXh0Tm9kZUluZGV4XSA9PT0gbnVsbCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgdGV4dE5vZGVJbmRleCk7XG4gICAgICAgIGxWaWV3W3RleHROb2RlSW5kZXhdID0gX2xvY2F0ZU9yQ3JlYXRlTm9kZShsVmlldywgdGV4dE5vZGVJbmRleCwgb3BDb2RlLCBOb2RlLlRFWFRfTk9ERSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSAmIEljdUNyZWF0ZU9wQ29kZS5NQVNLX0lOU1RSVUNUSU9OKSB7XG4gICAgICAgIGNhc2UgSWN1Q3JlYXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgIGNvbnN0IHBhcmVudElkeCA9IGdldFBhcmVudEZyb21JY3VDcmVhdGVPcENvZGUob3BDb2RlKTtcbiAgICAgICAgICBpZiAocm9vdElkeCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gVGhlIGZpcnN0IG9wZXJhdGlvbiBzaG91bGQgc2F2ZSB0aGUgYHJvb3RJZHhgIGJlY2F1c2UgdGhlIGZpcnN0IG9wZXJhdGlvblxuICAgICAgICAgICAgLy8gbXVzdCBpbnNlcnQgaW50byB0aGUgcm9vdC4gKE9ubHkgc3Vic2VxdWVudCBvcGVyYXRpb25zIGNhbiBpbnNlcnQgaW50byBhIGR5bmFtaWNcbiAgICAgICAgICAgIC8vIHBhcmVudClcbiAgICAgICAgICAgIHJvb3RJZHggPSBwYXJlbnRJZHg7XG4gICAgICAgICAgICByb290Uk5vZGUgPSBuYXRpdmVQYXJlbnROb2RlKHJlbmRlcmVyLCBhbmNob3JSTm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBpbnNlcnRJbkZyb250T2Y6IFJOb2RlfG51bGw7XG4gICAgICAgICAgbGV0IHBhcmVudFJOb2RlOiBSRWxlbWVudHxudWxsO1xuICAgICAgICAgIGlmIChwYXJlbnRJZHggPT09IHJvb3RJZHgpIHtcbiAgICAgICAgICAgIGluc2VydEluRnJvbnRPZiA9IGFuY2hvclJOb2RlO1xuICAgICAgICAgICAgcGFyZW50Uk5vZGUgPSByb290Uk5vZGU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluc2VydEluRnJvbnRPZiA9IG51bGw7XG4gICAgICAgICAgICBwYXJlbnRSTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W3BhcmVudElkeF0pIGFzIFJFbGVtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBGSVhNRShtaXNrbyk6IFJlZmFjdG9yIHdpdGggYHByb2Nlc3NJMThuVGV4dGBcbiAgICAgICAgICBpZiAocGFyZW50Uk5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgY2FuIGhhcHBlbiBpZiB0aGUgYExWaWV3YCB3ZSBhcmUgYWRkaW5nIHRvIGlzIG5vdCBhdHRhY2hlZCB0byBhIHBhcmVudCBgTFZpZXdgLlxuICAgICAgICAgICAgLy8gSW4gc3VjaCBhIGNhc2UgdGhlcmUgaXMgbm8gXCJyb290XCIgd2UgY2FuIGF0dGFjaCB0by4gVGhpcyBpcyBmaW5lLCBhcyB3ZSBzdGlsbCBuZWVkIHRvXG4gICAgICAgICAgICAvLyBjcmVhdGUgdGhlIGVsZW1lbnRzLiBXaGVuIHRoZSBgTFZpZXdgIGdldHMgbGF0ZXIgYWRkZWQgdG8gYSBwYXJlbnQgdGhlc2UgXCJyb290XCIgbm9kZXNcbiAgICAgICAgICAgIC8vIGdldCBwaWNrZWQgdXAgYW5kIGFkZGVkLlxuICAgICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUocGFyZW50Uk5vZGUpO1xuICAgICAgICAgICAgY29uc3QgcmVmSWR4ID0gZ2V0UmVmRnJvbUljdUNyZWF0ZU9wQ29kZShvcENvZGUpO1xuICAgICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKHJlZklkeCwgSEVBREVSX09GRlNFVCwgJ01pc3NpbmcgcmVmJyk7XG4gICAgICAgICAgICAvLyBgdW53cmFwUk5vZGVgIGlzIG5vdCBuZWVkZWQgaGVyZSBhcyBhbGwgb2YgdGhlc2UgcG9pbnQgdG8gUk5vZGVzIGFzIHBhcnQgb2YgdGhlIGkxOG5cbiAgICAgICAgICAgIC8vIHdoaWNoIGNhbid0IGhhdmUgY29tcG9uZW50cy5cbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gbFZpZXdbcmVmSWR4XSBhcyBSRWxlbWVudDtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKGNoaWxkKTtcbiAgICAgICAgICAgIG5hdGl2ZUluc2VydEJlZm9yZShyZW5kZXJlciwgcGFyZW50Uk5vZGUsIGNoaWxkLCBpbnNlcnRJbkZyb250T2YsIGZhbHNlKTtcbiAgICAgICAgICAgIGNvbnN0IHRJY3UgPSBnZXRUSWN1KHRWaWV3LCByZWZJZHgpO1xuICAgICAgICAgICAgaWYgKHRJY3UgIT09IG51bGwgJiYgdHlwZW9mIHRJY3UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgIC8vIElmIHdlIGp1c3QgYWRkZWQgYSBjb21tZW50IG5vZGUgd2hpY2ggaGFzIElDVSB0aGVuIHRoYXQgSUNVIG1heSBoYXZlIGFscmVhZHkgYmVlblxuICAgICAgICAgICAgICAvLyByZW5kZXJlZCBhbmQgdGhlcmVmb3JlIHdlIG5lZWQgdG8gcmUtYWRkIGl0IGhlcmUuXG4gICAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUSWN1KHRJY3UpO1xuICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDdXJyZW50SUNVQ2FzZUluZGV4KHRJY3UsIGxWaWV3KTtcbiAgICAgICAgICAgICAgaWYgKGNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGFwcGx5TXV0YWJsZU9wQ29kZXModFZpZXcsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIGxWaWV3LCBsVmlld1t0SWN1LmFuY2hvcklkeF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEljdUNyZWF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBvcENvZGUgPj4+IEljdUNyZWF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBUaGlzIGNvZGUgaXMgdXNlZCBmb3IgSUNVIGV4cHJlc3Npb25zIG9ubHksIHNpbmNlIHdlIGRvbid0IHN1cHBvcnRcbiAgICAgICAgICAvLyBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaW4gSUNVcywgd2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpbnB1dHMgaGVyZVxuICAgICAgICAgIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIHJlbmRlcmVyLCBnZXROYXRpdmVCeUluZGV4KGVsZW1lbnROb2RlSW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCwgbnVsbCwgbnVsbCwgYXR0ck5hbWUsXG4gICAgICAgICAgICAgIGF0dHJWYWx1ZSwgbnVsbCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklOVkFMSURfSTE4Tl9TVFJVQ1RVUkUsXG4gICAgICAgICAgICAgICAgYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgY2FzZSBJQ1VfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IGNvbW1lbnRWYWx1ZSA9IG11dGFibGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnROb2RlSW5kZXggPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBpZiAobFZpZXdbY29tbWVudE5vZGVJbmRleF0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY29tbWVudFZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHtjb21tZW50VmFsdWV9XCIgdG8gYmUgYSBjb21tZW50IG5vZGUgdmFsdWVgKTtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkV4cGFuZG9SYW5nZShsVmlldywgY29tbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBjb21tZW50Uk5vZGUgPSBsVmlld1tjb21tZW50Tm9kZUluZGV4XSA9XG4gICAgICAgICAgICAgICAgX2xvY2F0ZU9yQ3JlYXRlTm9kZShsVmlldywgY29tbWVudE5vZGVJbmRleCwgY29tbWVudFZhbHVlLCBOb2RlLkNPTU1FTlRfTk9ERSk7XG4gICAgICAgICAgICAvLyBGSVhNRShtaXNrbyk6IEF0dGFjaGluZyBwYXRjaCBkYXRhIGlzIG9ubHkgbmVlZGVkIGZvciB0aGUgcm9vdCAoQWxzbyBhZGQgdGVzdHMpXG4gICAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29tbWVudFJOb2RlLCBsVmlldyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVMRU1FTlRfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgaWYgKGxWaWV3W2VsZW1lbnROb2RlSW5kZXhdID09PSBudWxsKSB7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHRhZ05hbWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICBgRXhwZWN0ZWQgXCIke3RhZ05hbWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG5cbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJbkV4cGFuZG9SYW5nZShsVmlldywgZWxlbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50Uk5vZGUgPSBsVmlld1tlbGVtZW50Tm9kZUluZGV4XSA9XG4gICAgICAgICAgICAgICAgX2xvY2F0ZU9yQ3JlYXRlTm9kZShsVmlldywgZWxlbWVudE5vZGVJbmRleCwgdGFnTmFtZSwgTm9kZS5FTEVNRU5UX05PREUpO1xuICAgICAgICAgICAgLy8gRklYTUUobWlza28pOiBBdHRhY2hpbmcgcGF0Y2ggZGF0YSBpcyBvbmx5IG5lZWRlZCBmb3IgdGhlIHJvb3QgKEFsc28gYWRkIHRlc3RzKVxuICAgICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGVsZW1lbnRSTm9kZSwgbFZpZXcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgdGhyb3dFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBBcHBseSBgSTE4blVwZGF0ZU9wQ29kZXNgIE9wQ29kZXNcbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gdXBkYXRlT3BDb2RlcyBPcENvZGVzIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBiaW5kaW5nc1N0YXJ0SW5kZXggTG9jYXRpb24gb2YgdGhlIGZpcnN0IGDJtcm1aTE4bkFwcGx5YFxuICogQHBhcmFtIGNoYW5nZU1hc2sgRWFjaCBiaXQgY29ycmVzcG9uZHMgdG8gYSBgybXJtWkxOG5FeHBgIChDb3VudGluZyBiYWNrd2FyZHMgZnJvbVxuICogICAgIGBiaW5kaW5nc1N0YXJ0SW5kZXhgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlVcGRhdGVPcENvZGVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsXG4gICAgY2hhbmdlTWFzazogbnVtYmVyKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdXBkYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICBjb25zdCBjaGVja0JpdCA9IHVwZGF0ZU9wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgY29uc3Qgc2tpcENvZGVzID0gdXBkYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICBpZiAoY2hlY2tCaXQgJiBjaGFuZ2VNYXNrKSB7XG4gICAgICAvLyBUaGUgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCBzaW5jZSBsYXN0IGNoZWNrZWRcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gTmVnYXRpdmUgb3BDb2RlIHJlcHJlc2VudCBgaTE4bkV4cGAgdmFsdWVzIG9mZnNldC5cbiAgICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeShsVmlld1tiaW5kaW5nc1N0YXJ0SW5kZXggLSBvcENvZGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gKG9wQ29kZSA+Pj4gSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYpO1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIFNhbml0aXplckZuIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBjb25zdCB0Tm9kZU9yVGFnTmFtZSA9IHRWaWV3LmRhdGFbbm9kZUluZGV4XSBhcyBUTm9kZSB8IHN0cmluZztcbiAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZU9yVGFnTmFtZSwgJ0V4cGVydGluZyBUTm9kZSBvciBzdHJpbmcnKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHROb2RlT3JUYWdOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgLy8gSUYgd2UgZG9uJ3QgaGF2ZSBhIGBUTm9kZWAsIHRoZW4gd2UgYXJlIGFuIGVsZW1lbnQgaW4gSUNVIChhcyBJQ1UgY29udGVudCBkb2VzXG4gICAgICAgICAgICAgICAgICAvLyBub3QgaGF2ZSBUTm9kZSksIGluIHdoaWNoIGNhc2Ugd2Uga25vdyB0aGF0IHRoZXJlIGFyZSBubyBkaXJlY3RpdmVzLCBhbmQgaGVuY2VcbiAgICAgICAgICAgICAgICAgIC8vIHdlIHVzZSBhdHRyaWJ1dGUgc2V0dGluZy5cbiAgICAgICAgICAgICAgICAgIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICAgICAgbFZpZXdbUkVOREVSRVJdLCBsVmlld1tub2RlSW5kZXhdLCBudWxsLCB0Tm9kZU9yVGFnTmFtZSwgcHJvcE5hbWUsIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgIHNhbml0aXplRm4pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChcbiAgICAgICAgICAgICAgICAgICAgICB0VmlldywgdE5vZGVPclRhZ05hbWUsIGxWaWV3LCBwcm9wTmFtZSwgdmFsdWUsIGxWaWV3W1JFTkRFUkVSXSwgc2FuaXRpemVGbixcbiAgICAgICAgICAgICAgICAgICAgICBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuVGV4dDpcbiAgICAgICAgICAgICAgICBjb25zdCByVGV4dCA9IGxWaWV3W25vZGVJbmRleF0gYXMgUlRleHQgfCBudWxsO1xuICAgICAgICAgICAgICAgIHJUZXh0ICE9PSBudWxsICYmIHVwZGF0ZVRleHROb2RlKGxWaWV3W1JFTkRFUkVSXSwgclRleHQsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICBhcHBseUljdVN3aXRjaENhc2UodFZpZXcsIGdldFRJY3UodFZpZXcsIG5vZGVJbmRleCkhLCBsVmlldywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlOlxuICAgICAgICAgICAgICAgIGFwcGx5SWN1VXBkYXRlQ2FzZSh0VmlldywgZ2V0VEljdSh0Vmlldywgbm9kZUluZGV4KSEsIGJpbmRpbmdzU3RhcnRJbmRleCwgbFZpZXcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBvcENvZGUgPSB1cGRhdGVPcENvZGVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBpZiAob3BDb2RlID4gMCAmJiAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkgPT09IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlKSB7XG4gICAgICAgIC8vIFNwZWNpYWwgY2FzZSBmb3IgdGhlIGBpY3VVcGRhdGVDYXNlYC4gSXQgY291bGQgYmUgdGhhdCB0aGUgbWFzayBkaWQgbm90IG1hdGNoLCBidXRcbiAgICAgICAgLy8gd2Ugc3RpbGwgbmVlZCB0byBleGVjdXRlIGBpY3VVcGRhdGVDYXNlYCBiZWNhdXNlIHRoZSBjYXNlIGhhcyBjaGFuZ2VkIHJlY2VudGx5IGR1ZSB0b1xuICAgICAgICAvLyBwcmV2aW91cyBgaWN1U3dpdGNoQ2FzZWAgaW5zdHJ1Y3Rpb24uIChgaWN1U3dpdGNoQ2FzZWAgYW5kIGBpY3VVcGRhdGVDYXNlYCBhbHdheXMgY29tZSBpblxuICAgICAgICAvLyBwYWlycy4pXG4gICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IChvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGKTtcbiAgICAgICAgY29uc3QgdEljdSA9IGdldFRJY3UodFZpZXcsIG5vZGVJbmRleCkhO1xuICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBsVmlld1t0SWN1LmN1cnJlbnRDYXNlTFZpZXdJbmRleF07XG4gICAgICAgIGlmIChjdXJyZW50SW5kZXggPCAwKSB7XG4gICAgICAgICAgYXBwbHlJY3VVcGRhdGVDYXNlKHRWaWV3LCB0SWN1LCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpICs9IHNraXBDb2RlcztcbiAgfVxufVxuXG4vKipcbiAqIEFwcGx5IE9wQ29kZXMgYXNzb2NpYXRlZCB3aXRoIHVwZGF0aW5nIGFuIGV4aXN0aW5nIElDVS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gdEljdSBDdXJyZW50IGBUSWN1YFxuICogQHBhcmFtIGJpbmRpbmdzU3RhcnRJbmRleCBMb2NhdGlvbiBvZiB0aGUgZmlyc3QgYMm1ybVpMThuQXBwbHlgXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKi9cbmZ1bmN0aW9uIGFwcGx5SWN1VXBkYXRlQ2FzZSh0VmlldzogVFZpZXcsIHRJY3U6IFRJY3UsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgdEljdS5jdXJyZW50Q2FzZUxWaWV3SW5kZXgpO1xuICBsZXQgYWN0aXZlQ2FzZUluZGV4ID0gbFZpZXdbdEljdS5jdXJyZW50Q2FzZUxWaWV3SW5kZXhdO1xuICBpZiAoYWN0aXZlQ2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgbGV0IG1hc2sgPSBjaGFuZ2VNYXNrO1xuICAgIGlmIChhY3RpdmVDYXNlSW5kZXggPCAwKSB7XG4gICAgICAvLyBDbGVhciB0aGUgZmxhZy5cbiAgICAgIC8vIE5lZ2F0aXZlIG51bWJlciBtZWFucyB0aGF0IHRoZSBJQ1Ugd2FzIGZyZXNobHkgY3JlYXRlZCBhbmQgd2UgbmVlZCB0byBmb3JjZSB0aGUgdXBkYXRlLlxuICAgICAgYWN0aXZlQ2FzZUluZGV4ID0gbFZpZXdbdEljdS5jdXJyZW50Q2FzZUxWaWV3SW5kZXhdID0gfmFjdGl2ZUNhc2VJbmRleDtcbiAgICAgIC8vIC0xIGlzIHNhbWUgYXMgYWxsIGJpdHMgb24sIHdoaWNoIHNpbXVsYXRlcyBjcmVhdGlvbiBzaW5jZSBpdCBtYXJrcyBhbGwgYml0cyBkaXJ0eVxuICAgICAgbWFzayA9IC0xO1xuICAgIH1cbiAgICBhcHBseVVwZGF0ZU9wQ29kZXModFZpZXcsIGxWaWV3LCB0SWN1LnVwZGF0ZVthY3RpdmVDYXNlSW5kZXhdLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIG1hc2spO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgT3BDb2RlcyBhc3NvY2lhdGVkIHdpdGggc3dpdGNoaW5nIGEgY2FzZSBvbiBJQ1UuXG4gKlxuICogVGhpcyBpbnZvbHZlcyB0ZWFyaW5nIGRvd24gZXhpc3RpbmcgY2FzZSBhbmQgdGhhbiBidWlsZGluZyB1cCBhIG5ldyBjYXNlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSB0SWN1IEN1cnJlbnQgYFRJY3VgXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgb2YgdGhlIGNhc2UgdG8gdXBkYXRlIHRvLlxuICovXG5mdW5jdGlvbiBhcHBseUljdVN3aXRjaENhc2UodFZpZXc6IFRWaWV3LCB0SWN1OiBUSWN1LCBsVmlldzogTFZpZXcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgLy8gUmVidWlsZCBhIG5ldyBjYXNlIGZvciB0aGlzIElDVVxuICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICBsZXQgYWN0aXZlQ2FzZUluZGV4ID0gZ2V0Q3VycmVudElDVUNhc2VJbmRleCh0SWN1LCBsVmlldyk7XG4gIGlmIChhY3RpdmVDYXNlSW5kZXggIT09IGNhc2VJbmRleCkge1xuICAgIGFwcGx5SWN1U3dpdGNoQ2FzZVJlbW92ZSh0VmlldywgdEljdSwgbFZpZXcpO1xuICAgIGxWaWV3W3RJY3UuY3VycmVudENhc2VMVmlld0luZGV4XSA9IGNhc2VJbmRleCA9PT0gbnVsbCA/IG51bGwgOiB+Y2FzZUluZGV4O1xuICAgIGlmIChjYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICAgIC8vIEFkZCB0aGUgbm9kZXMgZm9yIHRoZSBuZXcgY2FzZVxuICAgICAgY29uc3QgYW5jaG9yUk5vZGUgPSBsVmlld1t0SWN1LmFuY2hvcklkeF07XG4gICAgICBpZiAoYW5jaG9yUk5vZGUpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUoYW5jaG9yUk5vZGUpO1xuICAgICAgICBhcHBseU11dGFibGVPcENvZGVzKHRWaWV3LCB0SWN1LmNyZWF0ZVtjYXNlSW5kZXhdLCBsVmlldywgYW5jaG9yUk5vZGUpO1xuICAgICAgfVxuICAgICAgY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZShsVmlldywgdEljdS5hbmNob3JJZHgsIGNhc2VJbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXBwbHkgT3BDb2RlcyBhc3NvY2lhdGVkIHdpdGggdGVhcmluZyBJQ1UgY2FzZS5cbiAqXG4gKiBUaGlzIGludm9sdmVzIHRlYXJpbmcgZG93biBleGlzdGluZyBjYXNlIGFuZCB0aGFuIGJ1aWxkaW5nIHVwIGEgbmV3IGNhc2UuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIHRJY3UgQ3VycmVudCBgVEljdWBcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqL1xuZnVuY3Rpb24gYXBwbHlJY3VTd2l0Y2hDYXNlUmVtb3ZlKHRWaWV3OiBUVmlldywgdEljdTogVEljdSwgbFZpZXc6IExWaWV3KSB7XG4gIGxldCBhY3RpdmVDYXNlSW5kZXggPSBnZXRDdXJyZW50SUNVQ2FzZUluZGV4KHRJY3UsIGxWaWV3KTtcbiAgaWYgKGFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHJlbW92ZUNvZGVzID0gdEljdS5yZW1vdmVbYWN0aXZlQ2FzZUluZGV4XTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbW92ZUNvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBub2RlT3JJY3VJbmRleCA9IHJlbW92ZUNvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChub2RlT3JJY3VJbmRleCA+IDApIHtcbiAgICAgICAgLy8gUG9zaXRpdmUgbnVtYmVycyBhcmUgYFJOb2RlYHMuXG4gICAgICAgIGNvbnN0IHJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChub2RlT3JJY3VJbmRleCwgbFZpZXcpO1xuICAgICAgICByTm9kZSAhPT0gbnVsbCAmJiBuYXRpdmVSZW1vdmVOb2RlKGxWaWV3W1JFTkRFUkVSXSwgck5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBhcmUgSUNVc1xuICAgICAgICBhcHBseUljdVN3aXRjaENhc2VSZW1vdmUodFZpZXcsIGdldFRJY3UodFZpZXcsIH5ub2RlT3JJY3VJbmRleCkhLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBjYXNlIG9mIGFuIElDVSBleHByZXNzaW9uIGRlcGVuZGluZyBvbiB0aGUgbWFpbiBiaW5kaW5nIHZhbHVlXG4gKlxuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBiaW5kaW5nVmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBtYWluIGJpbmRpbmcgdXNlZCBieSB0aGlzIElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIGdldENhc2VJbmRleChpY3VFeHByZXNzaW9uOiBUSWN1LCBiaW5kaW5nVmFsdWU6IHN0cmluZyk6IG51bWJlcnxudWxsIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXNlKGJpbmRpbmdWYWx1ZSwgZ2V0TG9jYWxlSWQoKSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4ID09PSAtMSA/IG51bGwgOiBpbmRleDtcbn1cbiJdfQ==