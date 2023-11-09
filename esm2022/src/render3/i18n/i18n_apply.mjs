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
import { getBindingIndex } from '../state';
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
                isComment ? renderer.createComment(text) : createTextNode(renderer, text);
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
                lView[textNodeIndex] = createTextNode(renderer, opCode);
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
                            createCommentNode(renderer, commentValue);
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
                            createElementNode(renderer, tagName, null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9hcHBseS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi9pMThuX2FwcGx5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0gsT0FBTyxFQUFDLHlCQUF5QixFQUFFLFVBQVUsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDcEYsT0FBTyxFQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBMEQsVUFBVSxFQUEwRCxNQUFNLG9CQUFvQixDQUFDO0FBSWpNLE9BQU8sRUFBQyxhQUFhLEVBQVMsUUFBUSxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDekUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsSyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFakUsT0FBTyxFQUFDLFdBQVcs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QyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge2dldFBsdXJhbENhc2V9IGZyb20gJy4uLy4uL2kxOG4vbG9jYWxpemF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRJbmRleEluUmFuZ2UsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0SW5kZXhJbkV4cGFuZG9SYW5nZSwgYXNzZXJ0VEljdX0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2VsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBzZXRFbGVtZW50QXR0cmlidXRlfSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7RUxFTUVOVF9NQVJLRVIsIEkxOG5DcmVhdGVPcENvZGUsIEkxOG5DcmVhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgSUNVX01BUktFUiwgSWN1Q3JlYXRlT3BDb2RlLCBJY3VDcmVhdGVPcENvZGVzLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZSwgUlRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFJFTkRFUkVSLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Y3JlYXRlQ29tbWVudE5vZGUsIGNyZWF0ZUVsZW1lbnROb2RlLCBjcmVhdGVUZXh0Tm9kZSwgbmF0aXZlSW5zZXJ0QmVmb3JlLCBuYXRpdmVQYXJlbnROb2RlLCBuYXRpdmVSZW1vdmVOb2RlLCB1cGRhdGVUZXh0Tm9kZX0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2dldExvY2FsZUlkfSBmcm9tICcuL2kxOG5fbG9jYWxlX2lkJztcbmltcG9ydCB7Z2V0Q3VycmVudElDVUNhc2VJbmRleCwgZ2V0UGFyZW50RnJvbUljdUNyZWF0ZU9wQ29kZSwgZ2V0UmVmRnJvbUljdUNyZWF0ZU9wQ29kZSwgZ2V0VEljdX0gZnJvbSAnLi9pMThuX3V0aWwnO1xuXG5cblxuLyoqXG4gKiBLZWVwIHRyYWNrIG9mIHdoaWNoIGlucHV0IGJpbmRpbmdzIGluIGDJtcm1aTE4bkV4cGAgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBlZmZpY2llbnRseSB1cGRhdGUgZXhwcmVzc2lvbnMgaW4gaTE4biBvbmx5IHdoZW4gdGhlIGNvcnJlc3BvbmRpbmcgaW5wdXQgaGFzXG4gKiBjaGFuZ2VkLlxuICpcbiAqIDEpIEVhY2ggYml0IHJlcHJlc2VudHMgd2hpY2ggb2YgdGhlIGDJtcm1aTE4bkV4cGAgaGFzIGNoYW5nZWQuXG4gKiAyKSBUaGVyZSBhcmUgMzIgYml0cyBhbGxvd2VkIGluIEpTLlxuICogMykgQml0IDMyIGlzIHNwZWNpYWwgYXMgaXQgaXMgc2hhcmVkIGZvciBhbGwgY2hhbmdlcyBwYXN0IDMyLiAoSW4gb3RoZXIgd29yZHMgaWYgeW91IGhhdmUgbW9yZVxuICogdGhhbiAzMiBgybXJtWkxOG5FeHBgIHRoZW4gYWxsIGNoYW5nZXMgcGFzdCAzMm5kIGDJtcm1aTE4bkV4cGAgd2lsbCBiZSBtYXBwZWQgdG8gc2FtZSBiaXQuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2UgbWF5IGVuZCB1cCBjaGFuZ2luZyBtb3JlIHRoYW4gd2UgbmVlZCB0by4gQnV0IGkxOG4gZXhwcmVzc2lvbnMgd2l0aCAzMiBiaW5kaW5ncyBpcyByYXJlXG4gKiBzbyBpbiBwcmFjdGljZSBpdCBzaG91bGQgbm90IGJlIGFuIGlzc3VlLilcbiAqL1xubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5cbi8qKlxuICogS2VlcHMgdHJhY2sgb2Ygd2hpY2ggYml0IG5lZWRzIHRvIGJlIHVwZGF0ZWQgaW4gYGNoYW5nZU1hc2tgXG4gKlxuICogVGhpcyB2YWx1ZSBnZXRzIGluY3JlbWVudGVkIG9uIGV2ZXJ5IGNhbGwgdG8gYMm1ybVpMThuRXhwYFxuICovXG5sZXQgY2hhbmdlTWFza0NvdW50ZXIgPSAwO1xuXG4vKipcbiAqIEtlZXAgdHJhY2sgb2Ygd2hpY2ggaW5wdXQgYmluZGluZ3MgaW4gYMm1ybVpMThuRXhwYCBoYXZlIGNoYW5nZWQuXG4gKlxuICogYHNldE1hc2tCaXRgIGdldHMgaW52b2tlZCBieSBlYWNoIGNhbGwgdG8gYMm1ybVpMThuRXhwYC5cbiAqXG4gKiBAcGFyYW0gaGFzQ2hhbmdlIGRpZCBgybXJtWkxOG5FeHBgIGRldGVjdCBhIGNoYW5nZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldE1hc2tCaXQoaGFzQ2hhbmdlOiBib29sZWFuKSB7XG4gIGlmIChoYXNDaGFuZ2UpIHtcbiAgICBjaGFuZ2VNYXNrID0gY2hhbmdlTWFzayB8ICgxIDw8IE1hdGgubWluKGNoYW5nZU1hc2tDb3VudGVyLCAzMSkpO1xuICB9XG4gIGNoYW5nZU1hc2tDb3VudGVyKys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUkxOG4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGNoYW5nZU1hc2tDb3VudGVyID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFRJMThuIHwgSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgLy8gV2hlbiBgaW5kZXhgIHBvaW50cyB0byBhbiBgybXJtWkxOG5BdHRyaWJ1dGVzYCB0aGVuIHdlIGhhdmUgYW4gYXJyYXkgb3RoZXJ3aXNlIGBUSTE4bmBcbiAgICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkodEkxOG4pID8gdEkxOG4gYXMgSTE4blVwZGF0ZU9wQ29kZXMgOiAodEkxOG4gYXMgVEkxOG4pLnVwZGF0ZTtcbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBnZXRCaW5kaW5nSW5kZXgoKSAtIGNoYW5nZU1hc2tDb3VudGVyIC0gMTtcbiAgICBhcHBseVVwZGF0ZU9wQ29kZXModFZpZXcsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2spO1xuICB9XG4gIC8vIFJlc2V0IGNoYW5nZU1hc2sgJiBtYXNrQml0IHRvIGRlZmF1bHQgZm9yIHRoZSBuZXh0IHVwZGF0ZSBjeWNsZVxuICBjaGFuZ2VNYXNrID0gMGIwO1xuICBjaGFuZ2VNYXNrQ291bnRlciA9IDA7XG59XG5cblxuLyoqXG4gKiBBcHBseSBgSTE4bkNyZWF0ZU9wQ29kZXNgIG9wLWNvZGVzIGFzIHN0b3JlZCBpbiBgVEkxOG4uY3JlYXRlYC5cbiAqXG4gKiBDcmVhdGVzIHRleHQgKGFuZCBjb21tZW50KSBub2RlcyB3aGljaCBhcmUgaW50ZXJuYXRpb25hbGl6ZWQuXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgbFZpZXdcbiAqIEBwYXJhbSBjcmVhdGVPcENvZGVzIFNldCBvZiBvcC1jb2RlcyB0byBhcHBseVxuICogQHBhcmFtIHBhcmVudFJOb2RlIFBhcmVudCBub2RlIChzbyB0aGF0IGRpcmVjdCBjaGlsZHJlbiBjYW4gYmUgYWRkZWQgZWFnZXJseSkgb3IgYG51bGxgIGlmIGl0IGlzXG4gKiAgICAgYSByb290IG5vZGUuXG4gKiBAcGFyYW0gaW5zZXJ0SW5Gcm9udE9mIERPTSBub2RlIHRoYXQgc2hvdWxkIGJlIHVzZWQgYXMgYW4gYW5jaG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDcmVhdGVPcENvZGVzKFxuICAgIGxWaWV3OiBMVmlldywgY3JlYXRlT3BDb2RlczogSTE4bkNyZWF0ZU9wQ29kZXMsIHBhcmVudFJOb2RlOiBSRWxlbWVudHxudWxsLFxuICAgIGluc2VydEluRnJvbnRPZjogUkVsZW1lbnR8bnVsbCk6IHZvaWQge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpKytdIGFzIGFueTtcbiAgICBjb25zdCB0ZXh0ID0gY3JlYXRlT3BDb2Rlc1tpXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaXNDb21tZW50ID0gKG9wQ29kZSAmIEkxOG5DcmVhdGVPcENvZGUuQ09NTUVOVCkgPT09IEkxOG5DcmVhdGVPcENvZGUuQ09NTUVOVDtcbiAgICBjb25zdCBhcHBlbmROb3cgPVxuICAgICAgICAob3BDb2RlICYgSTE4bkNyZWF0ZU9wQ29kZS5BUFBFTkRfRUFHRVJMWSkgPT09IEkxOG5DcmVhdGVPcENvZGUuQVBQRU5EX0VBR0VSTFk7XG4gICAgY29uc3QgaW5kZXggPSBvcENvZGUgPj4+IEkxOG5DcmVhdGVPcENvZGUuU0hJRlQ7XG4gICAgbGV0IHJOb2RlID0gbFZpZXdbaW5kZXhdO1xuICAgIGlmIChyTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gV2Ugb25seSBjcmVhdGUgbmV3IERPTSBub2RlcyBpZiB0aGV5IGRvbid0IGFscmVhZHkgZXhpc3Q6IElmIElDVSBzd2l0Y2hlcyBjYXNlIGJhY2sgdG8gYVxuICAgICAgLy8gY2FzZSB3aGljaCB3YXMgYWxyZWFkeSBpbnN0YW50aWF0ZWQsIG5vIG5lZWQgdG8gY3JlYXRlIG5ldyBET00gbm9kZXMuXG4gICAgICByTm9kZSA9IGxWaWV3W2luZGV4XSA9XG4gICAgICAgICAgaXNDb21tZW50ID8gcmVuZGVyZXIuY3JlYXRlQ29tbWVudCh0ZXh0KSA6IGNyZWF0ZVRleHROb2RlKHJlbmRlcmVyLCB0ZXh0KTtcbiAgICB9XG4gICAgaWYgKGFwcGVuZE5vdyAmJiBwYXJlbnRSTm9kZSAhPT0gbnVsbCkge1xuICAgICAgbmF0aXZlSW5zZXJ0QmVmb3JlKHJlbmRlcmVyLCBwYXJlbnRSTm9kZSwgck5vZGUsIGluc2VydEluRnJvbnRPZiwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFwcGx5IGBJMThuTXV0YXRlT3BDb2Rlc2AgT3BDb2Rlcy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gbXV0YWJsZU9wQ29kZXMgTXV0YWJsZSBPcENvZGVzIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqIEBwYXJhbSBhbmNob3JSTm9kZSBwbGFjZSB3aGVyZSB0aGUgaTE4biBub2RlIHNob3VsZCBiZSBpbnNlcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5TXV0YWJsZU9wQ29kZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBtdXRhYmxlT3BDb2RlczogSWN1Q3JlYXRlT3BDb2RlcywgbFZpZXc6IExWaWV3LCBhbmNob3JSTm9kZTogUk5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUoYW5jaG9yUk5vZGUpO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgLy8gYHJvb3RJZHhgIHJlcHJlc2VudHMgdGhlIG5vZGUgaW50byB3aGljaCBhbGwgaW5zZXJ0cyBoYXBwZW4uXG4gIGxldCByb290SWR4OiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gIC8vIGByb290Uk5vZGVgIHJlcHJlc2VudHMgdGhlIHJlYWwgbm9kZSBpbnRvIHdoaWNoIHdlIGluc2VydC4gVGhpcyBjYW4gYmUgZGlmZmVyZW50IGZyb21cbiAgLy8gYGxWaWV3W3Jvb3RJZHhdYCBpZiB3ZSBoYXZlIHByb2plY3Rpb24uXG4gIC8vICAtIG51bGwgd2UgZG9uJ3QgaGF2ZSBhIHBhcmVudCAoYXMgY2FuIGJlIHRoZSBjYXNlIGluIHdoZW4gd2UgYXJlIGluc2VydGluZyBpbnRvIGEgcm9vdCBvZlxuICAvLyAgICBMVmlldyB3aGljaCBoYXMgbm8gcGFyZW50LilcbiAgLy8gIC0gYFJFbGVtZW50YCBUaGUgZWxlbWVudCByZXByZXNlbnRpbmcgdGhlIHJvb3QgYWZ0ZXIgdGFraW5nIHByb2plY3Rpb24gaW50byBhY2NvdW50LlxuICBsZXQgcm9vdFJOb2RlITogUkVsZW1lbnR8bnVsbDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtdXRhYmxlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG9wQ29kZSA9IG11dGFibGVPcENvZGVzW2ldO1xuICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICBpZiAobFZpZXdbdGV4dE5vZGVJbmRleF0gPT09IG51bGwpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIHRleHROb2RlSW5kZXgpO1xuICAgICAgICBsVmlld1t0ZXh0Tm9kZUluZGV4XSA9IGNyZWF0ZVRleHROb2RlKHJlbmRlcmVyLCBvcENvZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgc3dpdGNoIChvcENvZGUgJiBJY3VDcmVhdGVPcENvZGUuTUFTS19JTlNUUlVDVElPTikge1xuICAgICAgICBjYXNlIEljdUNyZWF0ZU9wQ29kZS5BcHBlbmRDaGlsZDpcbiAgICAgICAgICBjb25zdCBwYXJlbnRJZHggPSBnZXRQYXJlbnRGcm9tSWN1Q3JlYXRlT3BDb2RlKG9wQ29kZSk7XG4gICAgICAgICAgaWYgKHJvb3RJZHggPT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFRoZSBmaXJzdCBvcGVyYXRpb24gc2hvdWxkIHNhdmUgdGhlIGByb290SWR4YCBiZWNhdXNlIHRoZSBmaXJzdCBvcGVyYXRpb25cbiAgICAgICAgICAgIC8vIG11c3QgaW5zZXJ0IGludG8gdGhlIHJvb3QuIChPbmx5IHN1YnNlcXVlbnQgb3BlcmF0aW9ucyBjYW4gaW5zZXJ0IGludG8gYSBkeW5hbWljXG4gICAgICAgICAgICAvLyBwYXJlbnQpXG4gICAgICAgICAgICByb290SWR4ID0gcGFyZW50SWR4O1xuICAgICAgICAgICAgcm9vdFJOb2RlID0gbmF0aXZlUGFyZW50Tm9kZShyZW5kZXJlciwgYW5jaG9yUk5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgaW5zZXJ0SW5Gcm9udE9mOiBSTm9kZXxudWxsO1xuICAgICAgICAgIGxldCBwYXJlbnRSTm9kZTogUkVsZW1lbnR8bnVsbDtcbiAgICAgICAgICBpZiAocGFyZW50SWR4ID09PSByb290SWR4KSB7XG4gICAgICAgICAgICBpbnNlcnRJbkZyb250T2YgPSBhbmNob3JSTm9kZTtcbiAgICAgICAgICAgIHBhcmVudFJOb2RlID0gcm9vdFJOb2RlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnNlcnRJbkZyb250T2YgPSBudWxsO1xuICAgICAgICAgICAgcGFyZW50Uk5vZGUgPSB1bndyYXBSTm9kZShsVmlld1twYXJlbnRJZHhdKSBhcyBSRWxlbWVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRklYTUUobWlza28pOiBSZWZhY3RvciB3aXRoIGBwcm9jZXNzSTE4blRleHRgXG4gICAgICAgICAgaWYgKHBhcmVudFJOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gaWYgdGhlIGBMVmlld2Agd2UgYXJlIGFkZGluZyB0byBpcyBub3QgYXR0YWNoZWQgdG8gYSBwYXJlbnQgYExWaWV3YC5cbiAgICAgICAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHRoZXJlIGlzIG5vIFwicm9vdFwiIHdlIGNhbiBhdHRhY2ggdG8uIFRoaXMgaXMgZmluZSwgYXMgd2Ugc3RpbGwgbmVlZCB0b1xuICAgICAgICAgICAgLy8gY3JlYXRlIHRoZSBlbGVtZW50cy4gV2hlbiB0aGUgYExWaWV3YCBnZXRzIGxhdGVyIGFkZGVkIHRvIGEgcGFyZW50IHRoZXNlIFwicm9vdFwiIG5vZGVzXG4gICAgICAgICAgICAvLyBnZXQgcGlja2VkIHVwIGFuZCBhZGRlZC5cbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKHBhcmVudFJOb2RlKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZklkeCA9IGdldFJlZkZyb21JY3VDcmVhdGVPcENvZGUob3BDb2RlKTtcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihyZWZJZHgsIEhFQURFUl9PRkZTRVQsICdNaXNzaW5nIHJlZicpO1xuICAgICAgICAgICAgLy8gYHVud3JhcFJOb2RlYCBpcyBub3QgbmVlZGVkIGhlcmUgYXMgYWxsIG9mIHRoZXNlIHBvaW50IHRvIFJOb2RlcyBhcyBwYXJ0IG9mIHRoZSBpMThuXG4gICAgICAgICAgICAvLyB3aGljaCBjYW4ndCBoYXZlIGNvbXBvbmVudHMuXG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IGxWaWV3W3JlZklkeF0gYXMgUkVsZW1lbnQ7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShjaGlsZCk7XG4gICAgICAgICAgICBuYXRpdmVJbnNlcnRCZWZvcmUocmVuZGVyZXIsIHBhcmVudFJOb2RlLCBjaGlsZCwgaW5zZXJ0SW5Gcm9udE9mLCBmYWxzZSk7XG4gICAgICAgICAgICBjb25zdCB0SWN1ID0gZ2V0VEljdSh0VmlldywgcmVmSWR4KTtcbiAgICAgICAgICAgIGlmICh0SWN1ICE9PSBudWxsICYmIHR5cGVvZiB0SWN1ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAvLyBJZiB3ZSBqdXN0IGFkZGVkIGEgY29tbWVudCBub2RlIHdoaWNoIGhhcyBJQ1UgdGhlbiB0aGF0IElDVSBtYXkgaGF2ZSBhbHJlYWR5IGJlZW5cbiAgICAgICAgICAgICAgLy8gcmVuZGVyZWQgYW5kIHRoZXJlZm9yZSB3ZSBuZWVkIHRvIHJlLWFkZCBpdCBoZXJlLlxuICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VEljdSh0SWN1KTtcbiAgICAgICAgICAgICAgY29uc3QgY2FzZUluZGV4ID0gZ2V0Q3VycmVudElDVUNhc2VJbmRleCh0SWN1LCBsVmlldyk7XG4gICAgICAgICAgICAgIGlmIChjYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcHBseU11dGFibGVPcENvZGVzKHRWaWV3LCB0SWN1LmNyZWF0ZVtjYXNlSW5kZXhdLCBsVmlldywgbFZpZXdbdEljdS5hbmNob3JJZHhdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJY3VDcmVhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJY3VDcmVhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gVGhpcyBjb2RlIGlzIHVzZWQgZm9yIElDVSBleHByZXNzaW9ucyBvbmx5LCBzaW5jZSB3ZSBkb24ndCBzdXBwb3J0XG4gICAgICAgICAgLy8gZGlyZWN0aXZlcy9jb21wb25lbnRzIGluIElDVXMsIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaW5wdXRzIGhlcmVcbiAgICAgICAgICBzZXRFbGVtZW50QXR0cmlidXRlKFxuICAgICAgICAgICAgICByZW5kZXJlciwgZ2V0TmF0aXZlQnlJbmRleChlbGVtZW50Tm9kZUluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQsIG51bGwsIG51bGwsIGF0dHJOYW1lLFxuICAgICAgICAgICAgICBhdHRyVmFsdWUsIG51bGwpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX0kxOE5fU1RSVUNUVVJFLFxuICAgICAgICAgICAgICAgIGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgIGNhc2UgSUNVX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBtdXRhYmxlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBjb21tZW50Tm9kZUluZGV4ID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgaWYgKGxWaWV3W2NvbW1lbnROb2RlSW5kZXhdID09PSBudWxsKSB7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGNvbW1lbnRWYWx1ZSwgJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7Y29tbWVudFZhbHVlfVwiIHRvIGJlIGEgY29tbWVudCBub2RlIHZhbHVlYCk7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5FeHBhbmRvUmFuZ2UobFZpZXcsIGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgICAgY29uc3QgY29tbWVudFJOb2RlID0gbFZpZXdbY29tbWVudE5vZGVJbmRleF0gPVxuICAgICAgICAgICAgICAgIGNyZWF0ZUNvbW1lbnROb2RlKHJlbmRlcmVyLCBjb21tZW50VmFsdWUpO1xuICAgICAgICAgICAgLy8gRklYTUUobWlza28pOiBBdHRhY2hpbmcgcGF0Y2ggZGF0YSBpcyBvbmx5IG5lZWRlZCBmb3IgdGhlIHJvb3QgKEFsc28gYWRkIHRlc3RzKVxuICAgICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbW1lbnRSTm9kZSwgbFZpZXcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gbXV0YWJsZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgZWxlbWVudE5vZGVJbmRleCA9IG11dGFibGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIGlmIChsVmlld1tlbGVtZW50Tm9kZUluZGV4XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lfVwiIHRvIGJlIGFuIGVsZW1lbnQgbm9kZSB0YWcgbmFtZWApO1xuXG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICAgICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5FeHBhbmRvUmFuZ2UobFZpZXcsIGVsZW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gbFZpZXdbZWxlbWVudE5vZGVJbmRleF0gPVxuICAgICAgICAgICAgICAgIGNyZWF0ZUVsZW1lbnROb2RlKHJlbmRlcmVyLCB0YWdOYW1lLCBudWxsKTtcbiAgICAgICAgICAgIC8vIEZJWE1FKG1pc2tvKTogQXR0YWNoaW5nIHBhdGNoIGRhdGEgaXMgb25seSBuZWVkZWQgZm9yIHRoZSByb290IChBbHNvIGFkZCB0ZXN0cylcbiAgICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShlbGVtZW50Uk5vZGUsIGxWaWV3KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIHRocm93RXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQXBwbHkgYEkxOG5VcGRhdGVPcENvZGVzYCBPcENvZGVzXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YFxuICogQHBhcmFtIHVwZGF0ZU9wQ29kZXMgT3BDb2RlcyB0byBwcm9jZXNzXG4gKiBAcGFyYW0gYmluZGluZ3NTdGFydEluZGV4IExvY2F0aW9uIG9mIHRoZSBmaXJzdCBgybXJtWkxOG5BcHBseWBcbiAqIEBwYXJhbSBjaGFuZ2VNYXNrIEVhY2ggYml0IGNvcnJlc3BvbmRzIHRvIGEgYMm1ybVpMThuRXhwYCAoQ291bnRpbmcgYmFja3dhcmRzIGZyb21cbiAqICAgICBgYmluZGluZ3NTdGFydEluZGV4YClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5VXBkYXRlT3BDb2RlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNoYW5nZU1hc2s6IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVwZGF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgY29uc3QgY2hlY2tCaXQgPSB1cGRhdGVPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgIGNvbnN0IHNraXBDb2RlcyA9IHVwZGF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgaWYgKGNoZWNrQml0ICYgY2hhbmdlTWFzaykge1xuICAgICAgLy8gVGhlIHZhbHVlIGhhcyBiZWVuIHVwZGF0ZWQgc2luY2UgbGFzdCBjaGVja2VkXG4gICAgICBsZXQgdmFsdWUgPSAnJztcbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8PSAoaSArIHNraXBDb2Rlcyk7IGorKykge1xuICAgICAgICBjb25zdCBvcENvZGUgPSB1cGRhdGVPcENvZGVzW2pdO1xuICAgICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIE5lZ2F0aXZlIG9wQ29kZSByZXByZXNlbnQgYGkxOG5FeHBgIHZhbHVlcyBvZmZzZXQuXG4gICAgICAgICAgICB2YWx1ZSArPSByZW5kZXJTdHJpbmdpZnkobFZpZXdbYmluZGluZ3NTdGFydEluZGV4IC0gb3BDb2RlXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IChvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGKTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBTYW5pdGl6ZXJGbiB8IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3QgdE5vZGVPclRhZ05hbWUgPSB0Vmlldy5kYXRhW25vZGVJbmRleF0gYXMgVE5vZGUgfCBzdHJpbmc7XG4gICAgICAgICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGVPclRhZ05hbWUsICdFeHBlcnRpbmcgVE5vZGUgb3Igc3RyaW5nJyk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0Tm9kZU9yVGFnTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgIC8vIElGIHdlIGRvbid0IGhhdmUgYSBgVE5vZGVgLCB0aGVuIHdlIGFyZSBhbiBlbGVtZW50IGluIElDVSAoYXMgSUNVIGNvbnRlbnQgZG9lc1xuICAgICAgICAgICAgICAgICAgLy8gbm90IGhhdmUgVE5vZGUpLCBpbiB3aGljaCBjYXNlIHdlIGtub3cgdGhhdCB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcywgYW5kIGhlbmNlXG4gICAgICAgICAgICAgICAgICAvLyB3ZSB1c2UgYXR0cmlidXRlIHNldHRpbmcuXG4gICAgICAgICAgICAgICAgICBzZXRFbGVtZW50QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgIGxWaWV3W1JFTkRFUkVSXSwgbFZpZXdbbm9kZUluZGV4XSwgbnVsbCwgdE5vZGVPclRhZ05hbWUsIHByb3BOYW1lLCB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBzYW5pdGl6ZUZuKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoXG4gICAgICAgICAgICAgICAgICAgICAgdFZpZXcsIHROb2RlT3JUYWdOYW1lLCBsVmlldywgcHJvcE5hbWUsIHZhbHVlLCBsVmlld1tSRU5ERVJFUl0sIHNhbml0aXplRm4sXG4gICAgICAgICAgICAgICAgICAgICAgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgY29uc3QgclRleHQgPSBsVmlld1tub2RlSW5kZXhdIGFzIFJUZXh0IHwgbnVsbDtcbiAgICAgICAgICAgICAgICByVGV4dCAhPT0gbnVsbCAmJiB1cGRhdGVUZXh0Tm9kZShsVmlld1tSRU5ERVJFUl0sIHJUZXh0LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgYXBwbHlJY3VTd2l0Y2hDYXNlKHRWaWV3LCBnZXRUSWN1KHRWaWV3LCBub2RlSW5kZXgpISwgbFZpZXcsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICBhcHBseUljdVVwZGF0ZUNhc2UodFZpZXcsIGdldFRJY3UodFZpZXcsIG5vZGVJbmRleCkhLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKG9wQ29kZSA+IDAgJiYgKG9wQ29kZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREUpID09PSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSkge1xuICAgICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIHRoZSBgaWN1VXBkYXRlQ2FzZWAuIEl0IGNvdWxkIGJlIHRoYXQgdGhlIG1hc2sgZGlkIG5vdCBtYXRjaCwgYnV0XG4gICAgICAgIC8vIHdlIHN0aWxsIG5lZWQgdG8gZXhlY3V0ZSBgaWN1VXBkYXRlQ2FzZWAgYmVjYXVzZSB0aGUgY2FzZSBoYXMgY2hhbmdlZCByZWNlbnRseSBkdWUgdG9cbiAgICAgICAgLy8gcHJldmlvdXMgYGljdVN3aXRjaENhc2VgIGluc3RydWN0aW9uLiAoYGljdVN3aXRjaENhc2VgIGFuZCBgaWN1VXBkYXRlQ2FzZWAgYWx3YXlzIGNvbWUgaW5cbiAgICAgICAgLy8gcGFpcnMuKVxuICAgICAgICBjb25zdCBub2RlSW5kZXggPSAob3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRik7XG4gICAgICAgIGNvbnN0IHRJY3UgPSBnZXRUSWN1KHRWaWV3LCBub2RlSW5kZXgpITtcbiAgICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gbFZpZXdbdEljdS5jdXJyZW50Q2FzZUxWaWV3SW5kZXhdO1xuICAgICAgICBpZiAoY3VycmVudEluZGV4IDwgMCkge1xuICAgICAgICAgIGFwcGx5SWN1VXBkYXRlQ2FzZSh0VmlldywgdEljdSwgYmluZGluZ3NTdGFydEluZGV4LCBsVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaSArPSBza2lwQ29kZXM7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBPcENvZGVzIGFzc29jaWF0ZWQgd2l0aCB1cGRhdGluZyBhbiBleGlzdGluZyBJQ1UuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIHRJY3UgQ3VycmVudCBgVEljdWBcbiAqIEBwYXJhbSBiaW5kaW5nc1N0YXJ0SW5kZXggTG9jYXRpb24gb2YgdGhlIGZpcnN0IGDJtcm1aTE4bkFwcGx5YFxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YFxuICovXG5mdW5jdGlvbiBhcHBseUljdVVwZGF0ZUNhc2UodFZpZXc6IFRWaWV3LCB0SWN1OiBUSWN1LCBiaW5kaW5nc1N0YXJ0SW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIHRJY3UuY3VycmVudENhc2VMVmlld0luZGV4KTtcbiAgbGV0IGFjdGl2ZUNhc2VJbmRleCA9IGxWaWV3W3RJY3UuY3VycmVudENhc2VMVmlld0luZGV4XTtcbiAgaWYgKGFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgIGxldCBtYXNrID0gY2hhbmdlTWFzaztcbiAgICBpZiAoYWN0aXZlQ2FzZUluZGV4IDwgMCkge1xuICAgICAgLy8gQ2xlYXIgdGhlIGZsYWcuXG4gICAgICAvLyBOZWdhdGl2ZSBudW1iZXIgbWVhbnMgdGhhdCB0aGUgSUNVIHdhcyBmcmVzaGx5IGNyZWF0ZWQgYW5kIHdlIG5lZWQgdG8gZm9yY2UgdGhlIHVwZGF0ZS5cbiAgICAgIGFjdGl2ZUNhc2VJbmRleCA9IGxWaWV3W3RJY3UuY3VycmVudENhc2VMVmlld0luZGV4XSA9IH5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAvLyAtMSBpcyBzYW1lIGFzIGFsbCBiaXRzIG9uLCB3aGljaCBzaW11bGF0ZXMgY3JlYXRpb24gc2luY2UgaXQgbWFya3MgYWxsIGJpdHMgZGlydHlcbiAgICAgIG1hc2sgPSAtMTtcbiAgICB9XG4gICAgYXBwbHlVcGRhdGVPcENvZGVzKHRWaWV3LCBsVmlldywgdEljdS51cGRhdGVbYWN0aXZlQ2FzZUluZGV4XSwgYmluZGluZ3NTdGFydEluZGV4LCBtYXNrKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGx5IE9wQ29kZXMgYXNzb2NpYXRlZCB3aXRoIHN3aXRjaGluZyBhIGNhc2Ugb24gSUNVLlxuICpcbiAqIFRoaXMgaW52b2x2ZXMgdGVhcmluZyBkb3duIGV4aXN0aW5nIGNhc2UgYW5kIHRoYW4gYnVpbGRpbmcgdXAgYSBuZXcgY2FzZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gdEljdSBDdXJyZW50IGBUSWN1YFxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YFxuICogQHBhcmFtIHZhbHVlIFZhbHVlIG9mIHRoZSBjYXNlIHRvIHVwZGF0ZSB0by5cbiAqL1xuZnVuY3Rpb24gYXBwbHlJY3VTd2l0Y2hDYXNlKHRWaWV3OiBUVmlldywgdEljdTogVEljdSwgbFZpZXc6IExWaWV3LCB2YWx1ZTogc3RyaW5nKSB7XG4gIC8vIFJlYnVpbGQgYSBuZXcgY2FzZSBmb3IgdGhpcyBJQ1VcbiAgY29uc3QgY2FzZUluZGV4ID0gZ2V0Q2FzZUluZGV4KHRJY3UsIHZhbHVlKTtcbiAgbGV0IGFjdGl2ZUNhc2VJbmRleCA9IGdldEN1cnJlbnRJQ1VDYXNlSW5kZXgodEljdSwgbFZpZXcpO1xuICBpZiAoYWN0aXZlQ2FzZUluZGV4ICE9PSBjYXNlSW5kZXgpIHtcbiAgICBhcHBseUljdVN3aXRjaENhc2VSZW1vdmUodFZpZXcsIHRJY3UsIGxWaWV3KTtcbiAgICBsVmlld1t0SWN1LmN1cnJlbnRDYXNlTFZpZXdJbmRleF0gPSBjYXNlSW5kZXggPT09IG51bGwgPyBudWxsIDogfmNhc2VJbmRleDtcbiAgICBpZiAoY2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAvLyBBZGQgdGhlIG5vZGVzIGZvciB0aGUgbmV3IGNhc2VcbiAgICAgIGNvbnN0IGFuY2hvclJOb2RlID0gbFZpZXdbdEljdS5hbmNob3JJZHhdO1xuICAgICAgaWYgKGFuY2hvclJOb2RlKSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKGFuY2hvclJOb2RlKTtcbiAgICAgICAgYXBwbHlNdXRhYmxlT3BDb2Rlcyh0VmlldywgdEljdS5jcmVhdGVbY2FzZUluZGV4XSwgbFZpZXcsIGFuY2hvclJOb2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBPcENvZGVzIGFzc29jaWF0ZWQgd2l0aCB0ZWFyaW5nIElDVSBjYXNlLlxuICpcbiAqIFRoaXMgaW52b2x2ZXMgdGVhcmluZyBkb3duIGV4aXN0aW5nIGNhc2UgYW5kIHRoYW4gYnVpbGRpbmcgdXAgYSBuZXcgY2FzZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gdEljdSBDdXJyZW50IGBUSWN1YFxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YFxuICovXG5mdW5jdGlvbiBhcHBseUljdVN3aXRjaENhc2VSZW1vdmUodFZpZXc6IFRWaWV3LCB0SWN1OiBUSWN1LCBsVmlldzogTFZpZXcpIHtcbiAgbGV0IGFjdGl2ZUNhc2VJbmRleCA9IGdldEN1cnJlbnRJQ1VDYXNlSW5kZXgodEljdSwgbFZpZXcpO1xuICBpZiAoYWN0aXZlQ2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgY29uc3QgcmVtb3ZlQ29kZXMgPSB0SWN1LnJlbW92ZVthY3RpdmVDYXNlSW5kZXhdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtb3ZlQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5vZGVPckljdUluZGV4ID0gcmVtb3ZlQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKG5vZGVPckljdUluZGV4ID4gMCkge1xuICAgICAgICAvLyBQb3NpdGl2ZSBudW1iZXJzIGFyZSBgUk5vZGVgcy5cbiAgICAgICAgY29uc3Qgck5vZGUgPSBnZXROYXRpdmVCeUluZGV4KG5vZGVPckljdUluZGV4LCBsVmlldyk7XG4gICAgICAgIHJOb2RlICE9PSBudWxsICYmIG5hdGl2ZVJlbW92ZU5vZGUobFZpZXdbUkVOREVSRVJdLCByTm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIGFyZSBJQ1VzXG4gICAgICAgIGFwcGx5SWN1U3dpdGNoQ2FzZVJlbW92ZSh0VmlldywgZ2V0VEljdSh0Vmlldywgfm5vZGVPckljdUluZGV4KSEsIGxWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNhc2Ugb2YgYW4gSUNVIGV4cHJlc3Npb24gZGVwZW5kaW5nIG9uIHRoZSBtYWluIGJpbmRpbmcgdmFsdWVcbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGJpbmRpbmdWYWx1ZSBUaGUgdmFsdWUgb2YgdGhlIG1haW4gYmluZGluZyB1c2VkIGJ5IHRoaXMgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FzZUluZGV4KGljdUV4cHJlc3Npb246IFRJY3UsIGJpbmRpbmdWYWx1ZTogc3RyaW5nKTogbnVtYmVyfG51bGwge1xuICBsZXQgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoYmluZGluZ1ZhbHVlKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHN3aXRjaCAoaWN1RXhwcmVzc2lvbi50eXBlKSB7XG4gICAgICBjYXNlIEljdVR5cGUucGx1cmFsOiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQ2FzZSA9IGdldFBsdXJhbENhc2UoYmluZGluZ1ZhbHVlLCBnZXRMb2NhbGVJZCgpKTtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YocmVzb2x2ZWRDYXNlKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiByZXNvbHZlZENhc2UgIT09ICdvdGhlcicpIHtcbiAgICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgSWN1VHlwZS5zZWxlY3Q6IHtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXggPT09IC0xID8gbnVsbCA6IGluZGV4O1xufVxuIl19