/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';
import { getTemplateContent, SRCSET_ATTRS, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS } from '../../sanitization/html_sanitizer';
import { getInertBodyHelper } from '../../sanitization/inert_body';
import { _sanitizeUrl, sanitizeSrcset } from '../../sanitization/url_sanitizer';
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertOneOf, assertString } from '../../util/assert';
import { loadIcuContainerVisitor } from '../instructions/i18n_icu_container_visitor';
import { allocExpando, createTNodeAtIndex, elementAttributeInternal, setInputsForProperty, setNgReflectProperties } from '../instructions/shared';
import { getDocument } from '../interfaces/document';
import { ELEMENT_MARKER, I18nCreateOpCode, ICU_MARKER } from '../interfaces/i18n';
import { HEADER_OFFSET } from '../interfaces/view';
import { getCurrentParentTNode, getCurrentTNode, setCurrentTNode } from '../state';
import { attachDebugGetter } from '../util/debug_utils';
import { getNativeByIndex, getTNode } from '../util/view_utils';
import { i18nCreateOpCodesToString, i18nRemoveOpCodesToString, i18nUpdateOpCodesToString, icuCreateOpCodesToString } from './i18n_debug';
import { addTNodeAndUpdateInsertBeforeIndex } from './i18n_insert_before_index';
import { ensureIcuContainerVisitorLoaded } from './i18n_tree_shaking';
import { createTNodePlaceholder, icuCreateOpCode, setTIcu, setTNodeInsertBeforeIndex } from './i18n_util';
const BINDING_REGEXP = /�(\d+):?\d*�/gi;
const ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
const NESTED_ICU = /�(\d+)�/;
const ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;
const MARKER = `�`;
const SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
const PH_REGEXP = /�(\/?[#*!]\d+):?\d*�/gi;
/**
 * Angular Dart introduced &ngsp; as a placeholder for non-removable space, see:
 * https://github.com/dart-lang/angular/blob/0bb611387d29d65b5af7f9d2515ab571fd3fbee4/_tests/test/compiler/preserve_whitespace_test.dart#L25-L32
 * In Angular Dart &ngsp; is converted to the 0xE500 PUA (Private Use Areas) unicode character
 * and later on replaced by a space. We are re-implementing the same idea here, since translations
 * might contain this special character.
 */
const NGSP_UNICODE_REGEXP = /\uE500/g;
function replaceNgsp(value) {
    return value.replace(NGSP_UNICODE_REGEXP, ' ');
}
/**
 * Create dynamic nodes from i18n translation block.
 *
 * - Text nodes are created synchronously
 * - TNodes are linked into tree lazily
 *
 * @param tView Current `TView`
 * @parentTNodeIndex index to the parent TNode of this i18n block
 * @param lView Current `LView`
 * @param index Index of `ɵɵi18nStart` instruction.
 * @param message Message to translate.
 * @param subTemplateIndex Index into the sub template of message translation. (ie in case of
 *     `ngIf`) (-1 otherwise)
 */
export function i18nStartFirstCreatePass(tView, parentTNodeIndex, lView, index, message, subTemplateIndex) {
    const rootTNode = getCurrentParentTNode();
    const createOpCodes = [];
    const updateOpCodes = [];
    const existingTNodeStack = [[]];
    if (ngDevMode) {
        attachDebugGetter(createOpCodes, i18nCreateOpCodesToString);
        attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
    }
    message = getTranslationForTemplate(message, subTemplateIndex);
    const msgParts = replaceNgsp(message).split(PH_REGEXP);
    for (let i = 0; i < msgParts.length; i++) {
        let value = msgParts[i];
        if ((i & 1) === 0) {
            // Even indexes are text (including bindings & ICU expressions)
            const parts = i18nParseTextIntoPartsAndICU(value);
            for (let j = 0; j < parts.length; j++) {
                let part = parts[j];
                if ((j & 1) === 0) {
                    // `j` is odd therefore `part` is string
                    const text = part;
                    ngDevMode && assertString(text, 'Parsed ICU part should be string');
                    if (text !== '') {
                        i18nStartFirstCreatePassProcessTextNode(tView, rootTNode, existingTNodeStack[0], createOpCodes, updateOpCodes, lView, text);
                    }
                }
                else {
                    // `j` is Even therefor `part` is an `ICUExpression`
                    const icuExpression = part;
                    // Verify that ICU expression has the right shape. Translations might contain invalid
                    // constructions (while original messages were correct), so ICU parsing at runtime may
                    // not succeed (thus `icuExpression` remains a string).
                    if (ngDevMode && typeof icuExpression !== 'object') {
                        throw new Error(`Unable to parse ICU expression in "${message}" message.`);
                    }
                    const icuContainerTNode = createTNodeAndAddOpCode(tView, rootTNode, existingTNodeStack[0], lView, createOpCodes, ngDevMode ? `ICU ${index}:${icuExpression.mainBinding}` : '', true);
                    const icuNodeIndex = icuContainerTNode.index;
                    ngDevMode &&
                        assertGreaterThanOrEqual(icuNodeIndex, HEADER_OFFSET, 'Index must be in absolute LView offset');
                    icuStart(tView, lView, updateOpCodes, parentTNodeIndex, icuExpression, icuNodeIndex);
                }
            }
        }
        else {
            // Odd indexes are placeholders (elements and sub-templates)
            // At this point value is something like: '/#1:2' (orginally coming from '�/#1:2�')
            const isClosing = value.charCodeAt(0) === 47 /* SLASH */;
            const type = value.charCodeAt(isClosing ? 1 : 0);
            ngDevMode && assertOneOf(type, 42 /* STAR */, 35 /* HASH */, 33 /* EXCLAMATION */);
            const index = HEADER_OFFSET + Number.parseInt(value.substring((isClosing ? 2 : 1)));
            if (isClosing) {
                existingTNodeStack.shift();
                setCurrentTNode(getCurrentParentTNode(), false);
            }
            else {
                const tNode = createTNodePlaceholder(tView, existingTNodeStack[0], index);
                existingTNodeStack.unshift([]);
                setCurrentTNode(tNode, true);
            }
        }
    }
    tView.data[index] = {
        create: createOpCodes,
        update: updateOpCodes,
    };
}
/**
 * Allocate space in i18n Range add create OpCode instruction to crete a text or comment node.
 *
 * @param tView Current `TView` needed to allocate space in i18n range.
 * @param rootTNode Root `TNode` of the i18n block. This node determines if the new TNode will be
 *     added as part of the `i18nStart` instruction or as part of the `TNode.insertBeforeIndex`.
 * @param existingTNodes internal state for `addTNodeAndUpdateInsertBeforeIndex`.
 * @param lView Current `LView` needed to allocate space in i18n range.
 * @param createOpCodes Array storing `I18nCreateOpCodes` where new opCodes will be added.
 * @param text Text to be added when the `Text` or `Comment` node will be created.
 * @param isICU true if a `Comment` node for ICU (instead of `Text`) node should be created.
 */
function createTNodeAndAddOpCode(tView, rootTNode, existingTNodes, lView, createOpCodes, text, isICU) {
    const i18nNodeIdx = allocExpando(tView, lView, 1);
    let opCode = i18nNodeIdx << I18nCreateOpCode.SHIFT;
    let parentTNode = getCurrentParentTNode();
    if (rootTNode === parentTNode) {
        // FIXME(misko): A null `parentTNode` should represent when we fall of the `LView` boundary.
        // (there is no parent), but in some circumstances (because we are inconsistent about how we set
        // `previousOrParentTNode`) it could point to `rootTNode` So this is a work around.
        parentTNode = null;
    }
    if (parentTNode === null) {
        // If we don't have a parent that means that we can eagerly add nodes.
        // If we have a parent than these nodes can't be added now (as the parent has not been created
        // yet) and instead the `parentTNode` is responsible for adding it. See
        // `TNode.insertBeforeIndex`
        opCode |= I18nCreateOpCode.APPEND_EAGERLY;
    }
    if (isICU) {
        opCode |= I18nCreateOpCode.COMMENT;
        ensureIcuContainerVisitorLoaded(loadIcuContainerVisitor);
    }
    createOpCodes.push(opCode, text === null ? '' : text);
    // We store `{{?}}` so that when looking at debug `TNodeType.template` we can see where the
    // bindings are.
    const tNode = createTNodeAtIndex(tView, i18nNodeIdx, isICU ? 32 /* Icu */ : 1 /* Text */, text === null ? (ngDevMode ? '{{?}}' : '') : text, null);
    addTNodeAndUpdateInsertBeforeIndex(existingTNodes, tNode);
    const tNodeIdx = tNode.index;
    setCurrentTNode(tNode, false /* Text nodes are self closing */);
    if (parentTNode !== null && rootTNode !== parentTNode) {
        // We are a child of deeper node (rather than a direct child of `i18nStart` instruction.)
        // We have to make sure to add ourselves to the parent.
        setTNodeInsertBeforeIndex(parentTNode, tNodeIdx);
    }
    return tNode;
}
/**
 * Processes text node in i18n block.
 *
 * Text nodes can have:
 * - Create instruction in `createOpCodes` for creating the text node.
 * - Allocate spec for text node in i18n range of `LView`
 * - If contains binding:
 *    - bindings => allocate space in i18n range of `LView` to store the binding value.
 *    - populate `updateOpCodes` with update instructions.
 *
 * @param tView Current `TView`
 * @param rootTNode Root `TNode` of the i18n block. This node determines if the new TNode will
 *     be added as part of the `i18nStart` instruction or as part of the
 *     `TNode.insertBeforeIndex`.
 * @param existingTNodes internal state for `addTNodeAndUpdateInsertBeforeIndex`.
 * @param createOpCodes Location where the creation OpCodes will be stored.
 * @param lView Current `LView`
 * @param text The translated text (which may contain binding)
 */
function i18nStartFirstCreatePassProcessTextNode(tView, rootTNode, existingTNodes, createOpCodes, updateOpCodes, lView, text) {
    const hasBinding = text.match(BINDING_REGEXP);
    const tNode = createTNodeAndAddOpCode(tView, rootTNode, existingTNodes, lView, createOpCodes, hasBinding ? null : text, false);
    if (hasBinding) {
        generateBindingUpdateOpCodes(updateOpCodes, text, tNode.index);
    }
}
/**
 * See `i18nAttributes` above.
 */
export function i18nAttributesFirstPass(lView, tView, index, values) {
    const previousElement = getCurrentTNode();
    const previousElementIndex = previousElement.index;
    const updateOpCodes = [];
    if (ngDevMode) {
        attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
    }
    for (let i = 0; i < values.length; i += 2) {
        const attrName = values[i];
        const message = values[i + 1];
        const parts = message.split(ICU_REGEXP);
        for (let j = 0; j < parts.length; j++) {
            const value = parts[j];
            if (j & 1) {
                // Odd indexes are ICU expressions
                // TODO(ocombe): support ICU expressions in attributes
                throw new Error('ICU expressions are not yet supported in attributes');
            }
            else if (value !== '') {
                // Even indexes are text (including bindings)
                const hasBinding = !!value.match(BINDING_REGEXP);
                if (hasBinding) {
                    if (tView.firstCreatePass && tView.data[index] === null) {
                        generateBindingUpdateOpCodes(updateOpCodes, value, previousElementIndex, attrName);
                    }
                }
                else {
                    const tNode = getTNode(tView, previousElementIndex);
                    // Set attributes for Elements only, for other types (like ElementContainer),
                    // only set inputs below
                    if (tNode.type & 3 /* AnyRNode */) {
                        elementAttributeInternal(tNode, lView, attrName, value, null, null);
                    }
                    // Check if that attribute is a directive input
                    const dataValue = tNode.inputs !== null && tNode.inputs[attrName];
                    if (dataValue) {
                        setInputsForProperty(tView, lView, dataValue, attrName, value);
                        if (ngDevMode) {
                            const element = getNativeByIndex(previousElementIndex, lView);
                            setNgReflectProperties(lView, element, tNode.type, dataValue, value);
                        }
                    }
                }
            }
        }
    }
    if (tView.firstCreatePass && tView.data[index] === null) {
        tView.data[index] = updateOpCodes;
    }
}
/**
 * Generate the OpCodes to update the bindings of a string.
 *
 * @param updateOpCodes Place where the update opcodes will be stored.
 * @param str The string containing the bindings.
 * @param destinationNode Index of the destination node which will receive the binding.
 * @param attrName Name of the attribute, if the string belongs to an attribute.
 * @param sanitizeFn Sanitization function used to sanitize the string after update, if necessary.
 */
export function generateBindingUpdateOpCodes(updateOpCodes, str, destinationNode, attrName, sanitizeFn = null) {
    ngDevMode &&
        assertGreaterThanOrEqual(destinationNode, HEADER_OFFSET, 'Index must be in absolute LView offset');
    const maskIndex = updateOpCodes.length; // Location of mask
    const sizeIndex = maskIndex + 1; // location of size for skipping
    updateOpCodes.push(null, null); // Alloc space for mask and size
    const startIndex = maskIndex + 2; // location of first allocation.
    if (ngDevMode) {
        attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
    }
    const textParts = str.split(BINDING_REGEXP);
    let mask = 0;
    for (let j = 0; j < textParts.length; j++) {
        const textValue = textParts[j];
        if (j & 1) {
            // Odd indexes are bindings
            const bindingIndex = parseInt(textValue, 10);
            updateOpCodes.push(-1 - bindingIndex);
            mask = mask | toMaskBit(bindingIndex);
        }
        else if (textValue !== '') {
            // Even indexes are text
            updateOpCodes.push(textValue);
        }
    }
    updateOpCodes.push(destinationNode << 2 /* SHIFT_REF */ |
        (attrName ? 1 /* Attr */ : 0 /* Text */));
    if (attrName) {
        updateOpCodes.push(attrName, sanitizeFn);
    }
    updateOpCodes[maskIndex] = mask;
    updateOpCodes[sizeIndex] = updateOpCodes.length - startIndex;
    return mask;
}
/**
 * Convert binding index to mask bit.
 *
 * Each index represents a single bit on the bit-mask. Because bit-mask only has 32 bits, we make
 * the 32nd bit share all masks for all bindings higher than 32. Since it is extremely rare to
 * have more than 32 bindings this will be hit very rarely. The downside of hitting this corner
 * case is that we will execute binding code more often than necessary. (penalty of performance)
 */
function toMaskBit(bindingIndex) {
    return 1 << Math.min(bindingIndex, 31);
}
export function isRootTemplateMessage(subTemplateIndex) {
    return subTemplateIndex === -1;
}
/**
 * Removes everything inside the sub-templates of a message.
 */
function removeInnerTemplateTranslation(message) {
    let match;
    let res = '';
    let index = 0;
    let inTemplate = false;
    let tagMatched;
    while ((match = SUBTEMPLATE_REGEXP.exec(message)) !== null) {
        if (!inTemplate) {
            res += message.substring(index, match.index + match[0].length);
            tagMatched = match[1];
            inTemplate = true;
        }
        else {
            if (match[0] === `${MARKER}/*${tagMatched}${MARKER}`) {
                index = match.index;
                inTemplate = false;
            }
        }
    }
    ngDevMode &&
        assertEqual(inTemplate, false, `Tag mismatch: unable to find the end of the sub-template in the translation "${message}"`);
    res += message.substr(index);
    return res;
}
/**
 * Extracts a part of a message and removes the rest.
 *
 * This method is used for extracting a part of the message associated with a template. A
 * translated message can span multiple templates.
 *
 * Example:
 * ```
 * <div i18n>Translate <span *ngIf>me</span>!</div>
 * ```
 *
 * @param message The message to crop
 * @param subTemplateIndex Index of the sub-template to extract. If undefined it returns the
 * external template and removes all sub-templates.
 */
export function getTranslationForTemplate(message, subTemplateIndex) {
    if (isRootTemplateMessage(subTemplateIndex)) {
        // We want the root template message, ignore all sub-templates
        return removeInnerTemplateTranslation(message);
    }
    else {
        // We want a specific sub-template
        const start = message.indexOf(`:${subTemplateIndex}${MARKER}`) + 2 + subTemplateIndex.toString().length;
        const end = message.search(new RegExp(`${MARKER}\\/\\*\\d+:${subTemplateIndex}${MARKER}`));
        return removeInnerTemplateTranslation(message.substring(start, end));
    }
}
/**
 * Generate the OpCodes for ICU expressions.
 *
 * @param icuExpression
 * @param index Index where the anchor is stored and an optional `TIcuContainerNode`
 *   - `lView[anchorIdx]` points to a `Comment` node representing the anchor for the ICU.
 *   - `tView.data[anchorIdx]` points to the `TIcuContainerNode` if ICU is root (`null` otherwise)
 */
export function icuStart(tView, lView, updateOpCodes, parentIdx, icuExpression, anchorIdx) {
    ngDevMode && assertDefined(icuExpression, 'ICU expression must be defined');
    let bindingMask = 0;
    const tIcu = {
        type: icuExpression.type,
        currentCaseLViewIndex: allocExpando(tView, lView, 1),
        anchorIdx,
        cases: [],
        create: [],
        remove: [],
        update: []
    };
    addUpdateIcuSwitch(updateOpCodes, icuExpression, anchorIdx);
    setTIcu(tView, anchorIdx, tIcu);
    const values = icuExpression.values;
    for (let i = 0; i < values.length; i++) {
        // Each value is an array of strings & other ICU expressions
        const valueArr = values[i];
        const nestedIcus = [];
        for (let j = 0; j < valueArr.length; j++) {
            const value = valueArr[j];
            if (typeof value !== 'string') {
                // It is an nested ICU expression
                const icuIndex = nestedIcus.push(value) - 1;
                // Replace nested ICU expression by a comment node
                valueArr[j] = `<!--�${icuIndex}�-->`;
            }
        }
        bindingMask = parseIcuCase(tView, tIcu, lView, updateOpCodes, parentIdx, icuExpression.cases[i], valueArr.join(''), nestedIcus) |
            bindingMask;
    }
    if (bindingMask) {
        addUpdateIcuUpdate(updateOpCodes, bindingMask, anchorIdx);
    }
}
/**
 * Parses text containing an ICU expression and produces a JSON object for it.
 * Original code from closure library, modified for Angular.
 *
 * @param pattern Text containing an ICU expression that needs to be parsed.
 *
 */
export function parseICUBlock(pattern) {
    const cases = [];
    const values = [];
    let icuType = 1 /* plural */;
    let mainBinding = 0;
    pattern = pattern.replace(ICU_BLOCK_REGEXP, function (str, binding, type) {
        if (type === 'select') {
            icuType = 0 /* select */;
        }
        else {
            icuType = 1 /* plural */;
        }
        mainBinding = parseInt(binding.substr(1), 10);
        return '';
    });
    const parts = i18nParseTextIntoPartsAndICU(pattern);
    // Looking for (key block)+ sequence. One of the keys has to be "other".
    for (let pos = 0; pos < parts.length;) {
        let key = parts[pos++].trim();
        if (icuType === 1 /* plural */) {
            // Key can be "=x", we just want "x"
            key = key.replace(/\s*(?:=)?(\w+)\s*/, '$1');
        }
        if (key.length) {
            cases.push(key);
        }
        const blocks = i18nParseTextIntoPartsAndICU(parts[pos++]);
        if (cases.length > values.length) {
            values.push(blocks);
        }
    }
    // TODO(ocombe): support ICU expressions in attributes, see #21615
    return { type: icuType, mainBinding: mainBinding, cases, values };
}
/**
 * Breaks pattern into strings and top level {...} blocks.
 * Can be used to break a message into text and ICU expressions, or to break an ICU expression
 * into keys and cases. Original code from closure library, modified for Angular.
 *
 * @param pattern (sub)Pattern to be broken.
 * @returns An `Array<string|IcuExpression>` where:
 *   - odd positions: `string` => text between ICU expressions
 *   - even positions: `ICUExpression` => ICU expression parsed into `ICUExpression` record.
 */
export function i18nParseTextIntoPartsAndICU(pattern) {
    if (!pattern) {
        return [];
    }
    let prevPos = 0;
    const braceStack = [];
    const results = [];
    const braces = /[{}]/g;
    // lastIndex doesn't get set to 0 so we have to.
    braces.lastIndex = 0;
    let match;
    while (match = braces.exec(pattern)) {
        const pos = match.index;
        if (match[0] == '}') {
            braceStack.pop();
            if (braceStack.length == 0) {
                // End of the block.
                const block = pattern.substring(prevPos, pos);
                if (ICU_BLOCK_REGEXP.test(block)) {
                    results.push(parseICUBlock(block));
                }
                else {
                    results.push(block);
                }
                prevPos = pos + 1;
            }
        }
        else {
            if (braceStack.length == 0) {
                const substring = pattern.substring(prevPos, pos);
                results.push(substring);
                prevPos = pos + 1;
            }
            braceStack.push('{');
        }
    }
    const substring = pattern.substring(prevPos);
    results.push(substring);
    return results;
}
/**
 * Parses a node, its children and its siblings, and generates the mutate & update OpCodes.
 *
 */
export function parseIcuCase(tView, tIcu, lView, updateOpCodes, parentIdx, caseName, unsafeCaseHtml, nestedIcus) {
    const create = [];
    const remove = [];
    const update = [];
    if (ngDevMode) {
        attachDebugGetter(create, icuCreateOpCodesToString);
        attachDebugGetter(remove, i18nRemoveOpCodesToString);
        attachDebugGetter(update, i18nUpdateOpCodesToString);
    }
    tIcu.cases.push(caseName);
    tIcu.create.push(create);
    tIcu.remove.push(remove);
    tIcu.update.push(update);
    const inertBodyHelper = getInertBodyHelper(getDocument());
    const inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeCaseHtml);
    ngDevMode && assertDefined(inertBodyElement, 'Unable to generate inert body element');
    const inertRootNode = getTemplateContent(inertBodyElement) || inertBodyElement;
    if (inertRootNode) {
        return walkIcuTree(tView, tIcu, lView, updateOpCodes, create, remove, update, inertRootNode, parentIdx, nestedIcus, 0);
    }
    else {
        return 0;
    }
}
function walkIcuTree(tView, tIcu, lView, sharedUpdateOpCodes, create, remove, update, parentNode, parentIdx, nestedIcus, depth) {
    let bindingMask = 0;
    let currentNode = parentNode.firstChild;
    while (currentNode) {
        const newIndex = allocExpando(tView, lView, 1);
        switch (currentNode.nodeType) {
            case Node.ELEMENT_NODE:
                const element = currentNode;
                const tagName = element.tagName.toLowerCase();
                if (VALID_ELEMENTS.hasOwnProperty(tagName)) {
                    addCreateNodeAndAppend(create, ELEMENT_MARKER, tagName, parentIdx, newIndex);
                    tView.data[newIndex] = tagName;
                    const elAttrs = element.attributes;
                    for (let i = 0; i < elAttrs.length; i++) {
                        const attr = elAttrs.item(i);
                        const lowerAttrName = attr.name.toLowerCase();
                        const hasBinding = !!attr.value.match(BINDING_REGEXP);
                        // we assume the input string is safe, unless it's using a binding
                        if (hasBinding) {
                            if (VALID_ATTRS.hasOwnProperty(lowerAttrName)) {
                                if (URI_ATTRS[lowerAttrName]) {
                                    generateBindingUpdateOpCodes(update, attr.value, newIndex, attr.name, _sanitizeUrl);
                                }
                                else if (SRCSET_ATTRS[lowerAttrName]) {
                                    generateBindingUpdateOpCodes(update, attr.value, newIndex, attr.name, sanitizeSrcset);
                                }
                                else {
                                    generateBindingUpdateOpCodes(update, attr.value, newIndex, attr.name);
                                }
                            }
                            else {
                                ngDevMode && console.warn(` WARNING:
      ignoring unsafe attribute value ${lowerAttrName} on element $ {
    tagName
  } (see http://g.co/ng/security#xss)`);
                            }
                        }
                        else {
                            addCreateAttribute(create, newIndex, attr);
                        }
                    }
                    // Parse the children of this node (if any)
                    bindingMask = walkIcuTree(tView, tIcu, lView, sharedUpdateOpCodes, create, remove, update, currentNode, newIndex, nestedIcus, depth + 1) |
                        bindingMask;
                    addRemoveNode(remove, newIndex, depth);
                }
                break;
            case Node.TEXT_NODE:
                const value = currentNode.textContent || '';
                const hasBinding = value.match(BINDING_REGEXP);
                addCreateNodeAndAppend(create, null, hasBinding ? '' : value, parentIdx, newIndex);
                addRemoveNode(remove, newIndex, depth);
                if (hasBinding) {
                    bindingMask = generateBindingUpdateOpCodes(update, value, newIndex) | bindingMask;
                }
                break;
            case Node.COMMENT_NODE:
                // Check if the comment node is a placeholder for a nested ICU
                const isNestedIcu = NESTED_ICU.exec(currentNode.textContent || '');
                if (isNestedIcu) {
                    const nestedIcuIndex = parseInt(isNestedIcu[1], 10);
                    const icuExpression = nestedIcus[nestedIcuIndex];
                    // Create the comment node that will anchor the ICU expression
                    addCreateNodeAndAppend(create, ICU_MARKER, ngDevMode ? `nested ICU ${nestedIcuIndex}` : '', parentIdx, newIndex);
                    icuStart(tView, lView, sharedUpdateOpCodes, parentIdx, icuExpression, newIndex);
                    addRemoveNestedIcu(remove, newIndex, depth);
                }
                break;
        }
        currentNode = currentNode.nextSibling;
    }
    return bindingMask;
}
function addRemoveNode(remove, index, depth) {
    if (depth === 0) {
        remove.push(index);
    }
}
function addRemoveNestedIcu(remove, index, depth) {
    if (depth === 0) {
        remove.push(~index); // remove ICU at `index`
        remove.push(index); // remove ICU comment at `index`
    }
}
function addUpdateIcuSwitch(update, icuExpression, index) {
    update.push(toMaskBit(icuExpression.mainBinding), 2, -1 - icuExpression.mainBinding, index << 2 /* SHIFT_REF */ | 2 /* IcuSwitch */);
}
function addUpdateIcuUpdate(update, bindingMask, index) {
    update.push(bindingMask, 1, index << 2 /* SHIFT_REF */ | 3 /* IcuUpdate */);
}
function addCreateNodeAndAppend(create, marker, text, appendToParentIdx, createAtIdx) {
    if (marker !== null) {
        create.push(marker);
    }
    create.push(text, createAtIdx, icuCreateOpCode(0 /* AppendChild */, appendToParentIdx, createAtIdx));
}
function addCreateAttribute(create, newIndex, attr) {
    create.push(newIndex << 1 /* SHIFT_REF */ | 1 /* Attr */, attr.name, attr.value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9wYXJzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi9pMThuX3BhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sd0JBQXdCLENBQUM7QUFDaEMsT0FBTyxpQ0FBaUMsQ0FBQztBQUV6QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDM0gsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUM5RSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFbEgsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFDbkYsT0FBTyxFQUFDLFlBQVksRUFBRSxrQkFBa0IsRUFBRSx3QkFBd0IsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ2hKLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUE2RSxVQUFVLEVBQXlFLE1BQU0sb0JBQW9CLENBQUM7QUFJbk8sT0FBTyxFQUFDLGFBQWEsRUFBZSxNQUFNLG9CQUFvQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2pGLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxn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QyxDQUFDLENBQUUsd0JBQXdCO1FBQzlDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRyxnQ0FBZ0M7S0FDdkQ7QUFDSCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsTUFBeUIsRUFBRSxhQUE0QixFQUFFLEtBQWE7SUFDeEUsTUFBTSxDQUFDLElBQUksQ0FDUCxTQUFTLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsV0FBVyxFQUN2RSxLQUFLLHFCQUE4QixvQkFBNkIsQ0FBQyxDQUFDO0FBQ3hFLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE1BQXlCLEVBQUUsV0FBbUIsRUFBRSxLQUFhO0lBQ3ZGLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxLQUFLLHFCQUE4QixvQkFBNkIsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUMzQixNQUF3QixFQUFFLE1BQXNDLEVBQUUsSUFBWSxFQUM5RSxpQkFBeUIsRUFBRSxXQUFtQjtJQUNoRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQjtJQUNELE1BQU0sQ0FBQyxJQUFJLENBQ1AsSUFBSSxFQUFFLFdBQVcsRUFDakIsZUFBZSxzQkFBOEIsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUNwRixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxNQUF3QixFQUFFLFFBQWdCLEVBQUUsSUFBVTtJQUNoRixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEscUJBQTZCLGVBQXVCLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCAnLi4vLi4vdXRpbC9uZ19pMThuX2Nsb3N1cmVfbW9kZSc7XG5cbmltcG9ydCB7Z2V0VGVtcGxhdGVDb250ZW50LCBTUkNTRVRfQVRUUlMsIFVSSV9BVFRSUywgVkFMSURfQVRUUlMsIFZBTElEX0VMRU1FTlRTfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtnZXRJbmVydEJvZHlIZWxwZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5JztcbmltcG9ydCB7X3Nhbml0aXplVXJsLCBzYW5pdGl6ZVNyY3NldH0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3VybF9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLCBhc3NlcnRPbmVPZiwgYXNzZXJ0U3RyaW5nfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0NoYXJDb2RlfSBmcm9tICcuLi8uLi91dGlsL2NoYXJfY29kZSc7XG5pbXBvcnQge2xvYWRJY3VDb250YWluZXJWaXNpdG9yfSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvaTE4bl9pY3VfY29udGFpbmVyX3Zpc2l0b3InO1xuaW1wb3J0IHthbGxvY0V4cGFuZG8sIGNyZWF0ZVROb2RlQXRJbmRleCwgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eSwgc2V0TmdSZWZsZWN0UHJvcGVydGllc30gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL2RvY3VtZW50JztcbmltcG9ydCB7RUxFTUVOVF9NQVJLRVIsIEkxOG5DcmVhdGVPcENvZGUsIEkxOG5DcmVhdGVPcENvZGVzLCBJMThuUmVtb3ZlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIElDVV9NQVJLRVIsIEljdUNyZWF0ZU9wQ29kZSwgSWN1Q3JlYXRlT3BDb2RlcywgSWN1RXhwcmVzc2lvbiwgSWN1VHlwZSwgVEkxOG4sIFRJY3V9IGZyb20gJy4uL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q3VycmVudFBhcmVudFROb2RlLCBnZXRDdXJyZW50VE5vZGUsIHNldEN1cnJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthdHRhY2hEZWJ1Z0dldHRlcn0gZnJvbSAnLi4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2kxOG5DcmVhdGVPcENvZGVzVG9TdHJpbmcsIGkxOG5SZW1vdmVPcENvZGVzVG9TdHJpbmcsIGkxOG5VcGRhdGVPcENvZGVzVG9TdHJpbmcsIGljdUNyZWF0ZU9wQ29kZXNUb1N0cmluZ30gZnJvbSAnLi9pMThuX2RlYnVnJztcbmltcG9ydCB7YWRkVE5vZGVBbmRVcGRhdGVJbnNlcnRCZWZvcmVJbmRleH0gZnJvbSAnLi9pMThuX2luc2VydF9iZWZvcmVfaW5kZXgnO1xuaW1wb3J0IHtlbnN1cmVJY3VDb250YWluZXJWaXNpdG9yTG9hZGVkfSBmcm9tICcuL2kxOG5fdHJlZV9zaGFraW5nJztcbmltcG9ydCB7Y3JlYXRlVE5vZGVQbGFjZWhvbGRlciwgaWN1Q3JlYXRlT3BDb2RlLCBzZXRUSWN1LCBzZXRUTm9kZUluc2VydEJlZm9yZUluZGV4fSBmcm9tICcuL2kxOG5fdXRpbCc7XG5cblxuXG5jb25zdCBCSU5ESU5HX1JFR0VYUCA9IC/vv70oXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBJQ1VfUkVHRVhQID0gLyh7XFxzKu+/vVxcZCs6P1xcZCrvv71cXHMqLFxccypcXFN7Nn1cXHMqLFtcXHNcXFNdKn0pL2dpO1xuY29uc3QgTkVTVEVEX0lDVSA9IC/vv70oXFxkKynvv70vO1xuY29uc3QgSUNVX0JMT0NLX1JFR0VYUCA9IC9eXFxzKijvv71cXGQrOj9cXGQq77+9KVxccyosXFxzKihzZWxlY3R8cGx1cmFsKVxccyosLztcblxuY29uc3QgTUFSS0VSID0gYO+/vWA7XG5jb25zdCBTVUJURU1QTEFURV9SRUdFWFAgPSAv77+9XFwvP1xcKihcXGQrOlxcZCsp77+9L2dpO1xuY29uc3QgUEhfUkVHRVhQID0gL++/vShcXC8/WyMqIV1cXGQrKTo/XFxkKu+/vS9naTtcblxuLyoqXG4gKiBBbmd1bGFyIERhcnQgaW50cm9kdWNlZCAmbmdzcDsgYXMgYSBwbGFjZWhvbGRlciBmb3Igbm9uLXJlbW92YWJsZSBzcGFjZSwgc2VlOlxuICogaHR0cHM6Ly9naXRodWIuY29tL2RhcnQtbGFuZy9hbmd1bGFyL2Jsb2IvMGJiNjExMzg3ZDI5ZDY1YjVhZjdmOWQyNTE1YWI1NzFmZDNmYmVlNC9fdGVzdHMvdGVzdC9jb21waWxlci9wcmVzZXJ2ZV93aGl0ZXNwYWNlX3Rlc3QuZGFydCNMMjUtTDMyXG4gKiBJbiBBbmd1bGFyIERhcnQgJm5nc3A7IGlzIGNvbnZlcnRlZCB0byB0aGUgMHhFNTAwIFBVQSAoUHJpdmF0ZSBVc2UgQXJlYXMpIHVuaWNvZGUgY2hhcmFjdGVyXG4gKiBhbmQgbGF0ZXIgb24gcmVwbGFjZWQgYnkgYSBzcGFjZS4gV2UgYXJlIHJlLWltcGxlbWVudGluZyB0aGUgc2FtZSBpZGVhIGhlcmUsIHNpbmNlIHRyYW5zbGF0aW9uc1xuICogbWlnaHQgY29udGFpbiB0aGlzIHNwZWNpYWwgY2hhcmFjdGVyLlxuICovXG5jb25zdCBOR1NQX1VOSUNPREVfUkVHRVhQID0gL1xcdUU1MDAvZztcbmZ1bmN0aW9uIHJlcGxhY2VOZ3NwKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZShOR1NQX1VOSUNPREVfUkVHRVhQLCAnICcpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBkeW5hbWljIG5vZGVzIGZyb20gaTE4biB0cmFuc2xhdGlvbiBibG9jay5cbiAqXG4gKiAtIFRleHQgbm9kZXMgYXJlIGNyZWF0ZWQgc3luY2hyb25vdXNseVxuICogLSBUTm9kZXMgYXJlIGxpbmtlZCBpbnRvIHRyZWUgbGF6aWx5XG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmVudFROb2RlSW5kZXggaW5kZXggdG8gdGhlIHBhcmVudCBUTm9kZSBvZiB0aGlzIGkxOG4gYmxvY2tcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiBgybXJtWkxOG5TdGFydGAgaW5zdHJ1Y3Rpb24uXG4gKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIHRyYW5zbGF0ZS5cbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IGludG8gdGhlIHN1YiB0ZW1wbGF0ZSBvZiBtZXNzYWdlIHRyYW5zbGF0aW9uLiAoaWUgaW4gY2FzZSBvZlxuICogICAgIGBuZ0lmYCkgKC0xIG90aGVyd2lzZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5TdGFydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICB0VmlldzogVFZpZXcsIHBhcmVudFROb2RlSW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsXG4gICAgc3ViVGVtcGxhdGVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBjcmVhdGVPcENvZGVzOiBJMThuQ3JlYXRlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXSBhcyBhbnk7XG4gIGNvbnN0IGV4aXN0aW5nVE5vZGVTdGFjazogVE5vZGVbXVtdID0gW1tdXTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKGNyZWF0ZU9wQ29kZXMsIGkxOG5DcmVhdGVPcENvZGVzVG9TdHJpbmcpO1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKHVwZGF0ZU9wQ29kZXMsIGkxOG5VcGRhdGVPcENvZGVzVG9TdHJpbmcpO1xuICB9XG5cbiAgbWVzc2FnZSA9IGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIGNvbnN0IG1zZ1BhcnRzID0gcmVwbGFjZU5nc3AobWVzc2FnZSkuc3BsaXQoUEhfUkVHRVhQKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtc2dQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IG1zZ1BhcnRzW2ldO1xuICAgIGlmICgoaSAmIDEpID09PSAwKSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncyAmIElDVSBleHByZXNzaW9ucylcbiAgICAgIGNvbnN0IHBhcnRzID0gaTE4blBhcnNlVGV4dEludG9QYXJ0c0FuZElDVSh2YWx1ZSk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGxldCBwYXJ0ID0gcGFydHNbal07XG4gICAgICAgIGlmICgoaiAmIDEpID09PSAwKSB7XG4gICAgICAgICAgLy8gYGpgIGlzIG9kZCB0aGVyZWZvcmUgYHBhcnRgIGlzIHN0cmluZ1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBwYXJ0IGFzIHN0cmluZztcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKHRleHQsICdQYXJzZWQgSUNVIHBhcnQgc2hvdWxkIGJlIHN0cmluZycpO1xuICAgICAgICAgIGlmICh0ZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgaTE4blN0YXJ0Rmlyc3RDcmVhdGVQYXNzUHJvY2Vzc1RleHROb2RlKFxuICAgICAgICAgICAgICAgIHRWaWV3LCByb290VE5vZGUsIGV4aXN0aW5nVE5vZGVTdGFja1swXSwgY3JlYXRlT3BDb2RlcywgdXBkYXRlT3BDb2RlcywgbFZpZXcsIHRleHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBgamAgaXMgRXZlbiB0aGVyZWZvciBgcGFydGAgaXMgYW4gYElDVUV4cHJlc3Npb25gXG4gICAgICAgICAgY29uc3QgaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiA9IHBhcnQgYXMgSWN1RXhwcmVzc2lvbjtcbiAgICAgICAgICAvLyBWZXJpZnkgdGhhdCBJQ1UgZXhwcmVzc2lvbiBoYXMgdGhlIHJpZ2h0IHNoYXBlLiBUcmFuc2xhdGlvbnMgbWlnaHQgY29udGFpbiBpbnZhbGlkXG4gICAgICAgICAgLy8gY29uc3RydWN0aW9ucyAod2hpbGUgb3JpZ2luYWwgbWVzc2FnZXMgd2VyZSBjb3JyZWN0KSwgc28gSUNVIHBhcnNpbmcgYXQgcnVudGltZSBtYXlcbiAgICAgICAgICAvLyBub3Qgc3VjY2VlZCAodGh1cyBgaWN1RXhwcmVzc2lvbmAgcmVtYWlucyBhIHN0cmluZykuXG4gICAgICAgICAgaWYgKG5nRGV2TW9kZSAmJiB0eXBlb2YgaWN1RXhwcmVzc2lvbiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHBhcnNlIElDVSBleHByZXNzaW9uIGluIFwiJHttZXNzYWdlfVwiIG1lc3NhZ2UuYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGljdUNvbnRhaW5lclROb2RlID0gY3JlYXRlVE5vZGVBbmRBZGRPcENvZGUoXG4gICAgICAgICAgICAgIHRWaWV3LCByb290VE5vZGUsIGV4aXN0aW5nVE5vZGVTdGFja1swXSwgbFZpZXcsIGNyZWF0ZU9wQ29kZXMsXG4gICAgICAgICAgICAgIG5nRGV2TW9kZSA/IGBJQ1UgJHtpbmRleH06JHtpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nfWAgOiAnJywgdHJ1ZSk7XG4gICAgICAgICAgY29uc3QgaWN1Tm9kZUluZGV4ID0gaWN1Q29udGFpbmVyVE5vZGUuaW5kZXg7XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChcbiAgICAgICAgICAgICAgICAgIGljdU5vZGVJbmRleCwgSEVBREVSX09GRlNFVCwgJ0luZGV4IG11c3QgYmUgaW4gYWJzb2x1dGUgTFZpZXcgb2Zmc2V0Jyk7XG4gICAgICAgICAgaWN1U3RhcnQodFZpZXcsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBwYXJlbnRUTm9kZUluZGV4LCBpY3VFeHByZXNzaW9uLCBpY3VOb2RlSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzKVxuICAgICAgLy8gQXQgdGhpcyBwb2ludCB2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogJy8jMToyJyAob3JnaW5hbGx5IGNvbWluZyBmcm9tICfvv70vIzE6Mu+/vScpXG4gICAgICBjb25zdCBpc0Nsb3NpbmcgPSB2YWx1ZS5jaGFyQ29kZUF0KDApID09PSBDaGFyQ29kZS5TTEFTSDtcbiAgICAgIGNvbnN0IHR5cGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGlzQ2xvc2luZyA/IDEgOiAwKTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRPbmVPZih0eXBlLCBDaGFyQ29kZS5TVEFSLCBDaGFyQ29kZS5IQVNILCBDaGFyQ29kZS5FWENMQU1BVElPTik7XG4gICAgICBjb25zdCBpbmRleCA9IEhFQURFUl9PRkZTRVQgKyBOdW1iZXIucGFyc2VJbnQodmFsdWUuc3Vic3RyaW5nKChpc0Nsb3NpbmcgPyAyIDogMSkpKTtcbiAgICAgIGlmIChpc0Nsb3NpbmcpIHtcbiAgICAgICAgZXhpc3RpbmdUTm9kZVN0YWNrLnNoaWZ0KCk7XG4gICAgICAgIHNldEN1cnJlbnRUTm9kZShnZXRDdXJyZW50UGFyZW50VE5vZGUoKSEsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHROb2RlID0gY3JlYXRlVE5vZGVQbGFjZWhvbGRlcih0VmlldywgZXhpc3RpbmdUTm9kZVN0YWNrWzBdLCBpbmRleCk7XG4gICAgICAgIGV4aXN0aW5nVE5vZGVTdGFjay51bnNoaWZ0KFtdKTtcbiAgICAgICAgc2V0Q3VycmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0Vmlldy5kYXRhW2luZGV4XSA9IDxUSTE4bj57XG4gICAgY3JlYXRlOiBjcmVhdGVPcENvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlT3BDb2RlcyxcbiAgfTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZSBzcGFjZSBpbiBpMThuIFJhbmdlIGFkZCBjcmVhdGUgT3BDb2RlIGluc3RydWN0aW9uIHRvIGNyZXRlIGEgdGV4dCBvciBjb21tZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YCBuZWVkZWQgdG8gYWxsb2NhdGUgc3BhY2UgaW4gaTE4biByYW5nZS5cbiAqIEBwYXJhbSByb290VE5vZGUgUm9vdCBgVE5vZGVgIG9mIHRoZSBpMThuIGJsb2NrLiBUaGlzIG5vZGUgZGV0ZXJtaW5lcyBpZiB0aGUgbmV3IFROb2RlIHdpbGwgYmVcbiAqICAgICBhZGRlZCBhcyBwYXJ0IG9mIHRoZSBgaTE4blN0YXJ0YCBpbnN0cnVjdGlvbiBvciBhcyBwYXJ0IG9mIHRoZSBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgLlxuICogQHBhcmFtIGV4aXN0aW5nVE5vZGVzIGludGVybmFsIHN0YXRlIGZvciBgYWRkVE5vZGVBbmRVcGRhdGVJbnNlcnRCZWZvcmVJbmRleGAuXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgIG5lZWRlZCB0byBhbGxvY2F0ZSBzcGFjZSBpbiBpMThuIHJhbmdlLlxuICogQHBhcmFtIGNyZWF0ZU9wQ29kZXMgQXJyYXkgc3RvcmluZyBgSTE4bkNyZWF0ZU9wQ29kZXNgIHdoZXJlIG5ldyBvcENvZGVzIHdpbGwgYmUgYWRkZWQuXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIGJlIGFkZGVkIHdoZW4gdGhlIGBUZXh0YCBvciBgQ29tbWVudGAgbm9kZSB3aWxsIGJlIGNyZWF0ZWQuXG4gKiBAcGFyYW0gaXNJQ1UgdHJ1ZSBpZiBhIGBDb21tZW50YCBub2RlIGZvciBJQ1UgKGluc3RlYWQgb2YgYFRleHRgKSBub2RlIHNob3VsZCBiZSBjcmVhdGVkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVUTm9kZUFuZEFkZE9wQ29kZShcbiAgICB0VmlldzogVFZpZXcsIHJvb3RUTm9kZTogVE5vZGV8bnVsbCwgZXhpc3RpbmdUTm9kZXM6IFROb2RlW10sIGxWaWV3OiBMVmlldyxcbiAgICBjcmVhdGVPcENvZGVzOiBJMThuQ3JlYXRlT3BDb2RlcywgdGV4dDogc3RyaW5nfG51bGwsIGlzSUNVOiBib29sZWFuKTogVE5vZGUge1xuICBjb25zdCBpMThuTm9kZUlkeCA9IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIDEpO1xuICBsZXQgb3BDb2RlID0gaTE4bk5vZGVJZHggPDwgSTE4bkNyZWF0ZU9wQ29kZS5TSElGVDtcbiAgbGV0IHBhcmVudFROb2RlID0gZ2V0Q3VycmVudFBhcmVudFROb2RlKCk7XG5cbiAgaWYgKHJvb3RUTm9kZSA9PT0gcGFyZW50VE5vZGUpIHtcbiAgICAvLyBGSVhNRShtaXNrbyk6IEEgbnVsbCBgcGFyZW50VE5vZGVgIHNob3VsZCByZXByZXNlbnQgd2hlbiB3ZSBmYWxsIG9mIHRoZSBgTFZpZXdgIGJvdW5kYXJ5LlxuICAgIC8vICh0aGVyZSBpcyBubyBwYXJlbnQpLCBidXQgaW4gc29tZSBjaXJjdW1zdGFuY2VzIChiZWNhdXNlIHdlIGFyZSBpbmNvbnNpc3RlbnQgYWJvdXQgaG93IHdlIHNldFxuICAgIC8vIGBwcmV2aW91c09yUGFyZW50VE5vZGVgKSBpdCBjb3VsZCBwb2ludCB0byBgcm9vdFROb2RlYCBTbyB0aGlzIGlzIGEgd29yayBhcm91bmQuXG4gICAgcGFyZW50VE5vZGUgPSBudWxsO1xuICB9XG4gIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSBwYXJlbnQgdGhhdCBtZWFucyB0aGF0IHdlIGNhbiBlYWdlcmx5IGFkZCBub2Rlcy5cbiAgICAvLyBJZiB3ZSBoYXZlIGEgcGFyZW50IHRoYW4gdGhlc2Ugbm9kZXMgY2FuJ3QgYmUgYWRkZWQgbm93IChhcyB0aGUgcGFyZW50IGhhcyBub3QgYmVlbiBjcmVhdGVkXG4gICAgLy8geWV0KSBhbmQgaW5zdGVhZCB0aGUgYHBhcmVudFROb2RlYCBpcyByZXNwb25zaWJsZSBmb3IgYWRkaW5nIGl0LiBTZWVcbiAgICAvLyBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgXG4gICAgb3BDb2RlIHw9IEkxOG5DcmVhdGVPcENvZGUuQVBQRU5EX0VBR0VSTFk7XG4gIH1cbiAgaWYgKGlzSUNVKSB7XG4gICAgb3BDb2RlIHw9IEkxOG5DcmVhdGVPcENvZGUuQ09NTUVOVDtcbiAgICBlbnN1cmVJY3VDb250YWluZXJWaXNpdG9yTG9hZGVkKGxvYWRJY3VDb250YWluZXJWaXNpdG9yKTtcbiAgfVxuICBjcmVhdGVPcENvZGVzLnB1c2gob3BDb2RlLCB0ZXh0ID09PSBudWxsID8gJycgOiB0ZXh0KTtcbiAgLy8gV2Ugc3RvcmUgYHt7P319YCBzbyB0aGF0IHdoZW4gbG9va2luZyBhdCBkZWJ1ZyBgVE5vZGVUeXBlLnRlbXBsYXRlYCB3ZSBjYW4gc2VlIHdoZXJlIHRoZVxuICAvLyBiaW5kaW5ncyBhcmUuXG4gIGNvbnN0IHROb2RlID0gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgICAgdFZpZXcsIGkxOG5Ob2RlSWR4LCBpc0lDVSA/IFROb2RlVHlwZS5JY3UgOiBUTm9kZVR5cGUuVGV4dCxcbiAgICAgIHRleHQgPT09IG51bGwgPyAobmdEZXZNb2RlID8gJ3t7P319JyA6ICcnKSA6IHRleHQsIG51bGwpO1xuICBhZGRUTm9kZUFuZFVwZGF0ZUluc2VydEJlZm9yZUluZGV4KGV4aXN0aW5nVE5vZGVzLCB0Tm9kZSk7XG4gIGNvbnN0IHROb2RlSWR4ID0gdE5vZGUuaW5kZXg7XG4gIHNldEN1cnJlbnRUTm9kZSh0Tm9kZSwgZmFsc2UgLyogVGV4dCBub2RlcyBhcmUgc2VsZiBjbG9zaW5nICovKTtcbiAgaWYgKHBhcmVudFROb2RlICE9PSBudWxsICYmIHJvb3RUTm9kZSAhPT0gcGFyZW50VE5vZGUpIHtcbiAgICAvLyBXZSBhcmUgYSBjaGlsZCBvZiBkZWVwZXIgbm9kZSAocmF0aGVyIHRoYW4gYSBkaXJlY3QgY2hpbGQgb2YgYGkxOG5TdGFydGAgaW5zdHJ1Y3Rpb24uKVxuICAgIC8vIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRvIGFkZCBvdXJzZWx2ZXMgdG8gdGhlIHBhcmVudC5cbiAgICBzZXRUTm9kZUluc2VydEJlZm9yZUluZGV4KHBhcmVudFROb2RlLCB0Tm9kZUlkeCk7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIFByb2Nlc3NlcyB0ZXh0IG5vZGUgaW4gaTE4biBibG9jay5cbiAqXG4gKiBUZXh0IG5vZGVzIGNhbiBoYXZlOlxuICogLSBDcmVhdGUgaW5zdHJ1Y3Rpb24gaW4gYGNyZWF0ZU9wQ29kZXNgIGZvciBjcmVhdGluZyB0aGUgdGV4dCBub2RlLlxuICogLSBBbGxvY2F0ZSBzcGVjIGZvciB0ZXh0IG5vZGUgaW4gaTE4biByYW5nZSBvZiBgTFZpZXdgXG4gKiAtIElmIGNvbnRhaW5zIGJpbmRpbmc6XG4gKiAgICAtIGJpbmRpbmdzID0+IGFsbG9jYXRlIHNwYWNlIGluIGkxOG4gcmFuZ2Ugb2YgYExWaWV3YCB0byBzdG9yZSB0aGUgYmluZGluZyB2YWx1ZS5cbiAqICAgIC0gcG9wdWxhdGUgYHVwZGF0ZU9wQ29kZXNgIHdpdGggdXBkYXRlIGluc3RydWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gcm9vdFROb2RlIFJvb3QgYFROb2RlYCBvZiB0aGUgaTE4biBibG9jay4gVGhpcyBub2RlIGRldGVybWluZXMgaWYgdGhlIG5ldyBUTm9kZSB3aWxsXG4gKiAgICAgYmUgYWRkZWQgYXMgcGFydCBvZiB0aGUgYGkxOG5TdGFydGAgaW5zdHJ1Y3Rpb24gb3IgYXMgcGFydCBvZiB0aGVcbiAqICAgICBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgLlxuICogQHBhcmFtIGV4aXN0aW5nVE5vZGVzIGludGVybmFsIHN0YXRlIGZvciBgYWRkVE5vZGVBbmRVcGRhdGVJbnNlcnRCZWZvcmVJbmRleGAuXG4gKiBAcGFyYW0gY3JlYXRlT3BDb2RlcyBMb2NhdGlvbiB3aGVyZSB0aGUgY3JlYXRpb24gT3BDb2RlcyB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2BcbiAqIEBwYXJhbSB0ZXh0IFRoZSB0cmFuc2xhdGVkIHRleHQgKHdoaWNoIG1heSBjb250YWluIGJpbmRpbmcpXG4gKi9cbmZ1bmN0aW9uIGkxOG5TdGFydEZpcnN0Q3JlYXRlUGFzc1Byb2Nlc3NUZXh0Tm9kZShcbiAgICB0VmlldzogVFZpZXcsIHJvb3RUTm9kZTogVE5vZGV8bnVsbCwgZXhpc3RpbmdUTm9kZXM6IFROb2RlW10sIGNyZWF0ZU9wQ29kZXM6IEkxOG5DcmVhdGVPcENvZGVzLFxuICAgIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBsVmlldzogTFZpZXcsIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBoYXNCaW5kaW5nID0gdGV4dC5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlVE5vZGVBbmRBZGRPcENvZGUoXG4gICAgICB0Vmlldywgcm9vdFROb2RlLCBleGlzdGluZ1ROb2RlcywgbFZpZXcsIGNyZWF0ZU9wQ29kZXMsIGhhc0JpbmRpbmcgPyBudWxsIDogdGV4dCwgZmFsc2UpO1xuICBpZiAoaGFzQmluZGluZykge1xuICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModXBkYXRlT3BDb2RlcywgdGV4dCwgdE5vZGUuaW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogU2VlIGBpMThuQXR0cmlidXRlc2AgYWJvdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyhcbiAgICBsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnQgPSBnZXRDdXJyZW50VE5vZGUoKSE7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudEluZGV4ID0gcHJldmlvdXNFbGVtZW50LmluZGV4O1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKHVwZGF0ZU9wQ29kZXMsIGkxOG5VcGRhdGVPcENvZGVzVG9TdHJpbmcpO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG4gICAgY29uc3QgcGFydHMgPSBtZXNzYWdlLnNwbGl0KElDVV9SRUdFWFApO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFydHNbal07XG5cbiAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lDVSBleHByZXNzaW9ucyBhcmUgbm90IHlldCBzdXBwb3J0ZWQgaW4gYXR0cmlidXRlcycpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIXZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXhdID09PSBudWxsKSB7XG4gICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHVwZGF0ZU9wQ29kZXMsIHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHRWaWV3LCBwcmV2aW91c0VsZW1lbnRJbmRleCk7XG4gICAgICAgICAgLy8gU2V0IGF0dHJpYnV0ZXMgZm9yIEVsZW1lbnRzIG9ubHksIGZvciBvdGhlciB0eXBlcyAobGlrZSBFbGVtZW50Q29udGFpbmVyKSxcbiAgICAgICAgICAvLyBvbmx5IHNldCBpbnB1dHMgYmVsb3dcbiAgICAgICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKHROb2RlLCBsVmlldywgYXR0ck5hbWUsIHZhbHVlLCBudWxsLCBudWxsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhhdCBhdHRyaWJ1dGUgaXMgYSBkaXJlY3RpdmUgaW5wdXRcbiAgICAgICAgICBjb25zdCBkYXRhVmFsdWUgPSB0Tm9kZS5pbnB1dHMgIT09IG51bGwgJiYgdE5vZGUuaW5wdXRzW2F0dHJOYW1lXTtcbiAgICAgICAgICBpZiAoZGF0YVZhbHVlKSB7XG4gICAgICAgICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGRhdGFWYWx1ZSwgYXR0ck5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgocHJldmlvdXNFbGVtZW50SW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICAgICAgICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXhdID09PSBudWxsKSB7XG4gICAgdFZpZXcuZGF0YVtpbmRleF0gPSB1cGRhdGVPcENvZGVzO1xuICB9XG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyB0byB1cGRhdGUgdGhlIGJpbmRpbmdzIG9mIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB1cGRhdGVPcENvZGVzIFBsYWNlIHdoZXJlIHRoZSB1cGRhdGUgb3Bjb2RlcyB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBiaW5kaW5ncy5cbiAqIEBwYXJhbSBkZXN0aW5hdGlvbk5vZGUgSW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIG5vZGUgd2hpY2ggd2lsbCByZWNlaXZlIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGF0dHJOYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSwgaWYgdGhlIHN0cmluZyBiZWxvbmdzIHRvIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZUZuIFNhbml0aXphdGlvbiBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSBzdHJpbmcgYWZ0ZXIgdXBkYXRlLCBpZiBuZWNlc3NhcnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBzdHI6IHN0cmluZywgZGVzdGluYXRpb25Ob2RlOiBudW1iZXIsIGF0dHJOYW1lPzogc3RyaW5nLFxuICAgIHNhbml0aXplRm46IFNhbml0aXplckZufG51bGwgPSBudWxsKTogbnVtYmVyIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICAgICAgZGVzdGluYXRpb25Ob2RlLCBIRUFERVJfT0ZGU0VULCAnSW5kZXggbXVzdCBiZSBpbiBhYnNvbHV0ZSBMVmlldyBvZmZzZXQnKTtcbiAgY29uc3QgbWFza0luZGV4ID0gdXBkYXRlT3BDb2Rlcy5sZW5ndGg7ICAvLyBMb2NhdGlvbiBvZiBtYXNrXG4gIGNvbnN0IHNpemVJbmRleCA9IG1hc2tJbmRleCArIDE7ICAgICAgICAgLy8gbG9jYXRpb24gb2Ygc2l6ZSBmb3Igc2tpcHBpbmdcbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKG51bGwsIG51bGwpOyAgICAgICAgICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBjb25zdCBzdGFydEluZGV4ID0gbWFza0luZGV4ICsgMjsgICAgICAgIC8vIGxvY2F0aW9uIG9mIGZpcnN0IGFsbG9jYXRpb24uXG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcih1cGRhdGVPcENvZGVzLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuICBjb25zdCB0ZXh0UGFydHMgPSBzdHIuc3BsaXQoQklORElOR19SRUdFWFApO1xuICBsZXQgbWFzayA9IDA7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCB0ZXh0UGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB0ZXh0UGFydHNbal07XG5cbiAgICBpZiAoaiAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gcGFyc2VJbnQodGV4dFZhbHVlLCAxMCk7XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2goLTEgLSBiaW5kaW5nSW5kZXgpO1xuICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2UgaWYgKHRleHRWYWx1ZSAhPT0gJycpIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dFxuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKHRleHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgIChhdHRyTmFtZSA/IEkxOG5VcGRhdGVPcENvZGUuQXR0ciA6IEkxOG5VcGRhdGVPcENvZGUuVGV4dCkpO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbbWFza0luZGV4XSA9IG1hc2s7XG4gIHVwZGF0ZU9wQ29kZXNbc2l6ZUluZGV4XSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gc3RhcnRJbmRleDtcbiAgcmV0dXJuIG1hc2s7XG59XG5cblxuLyoqXG4gKiBDb252ZXJ0IGJpbmRpbmcgaW5kZXggdG8gbWFzayBiaXQuXG4gKlxuICogRWFjaCBpbmRleCByZXByZXNlbnRzIGEgc2luZ2xlIGJpdCBvbiB0aGUgYml0LW1hc2suIEJlY2F1c2UgYml0LW1hc2sgb25seSBoYXMgMzIgYml0cywgd2UgbWFrZVxuICogdGhlIDMybmQgYml0IHNoYXJlIGFsbCBtYXNrcyBmb3IgYWxsIGJpbmRpbmdzIGhpZ2hlciB0aGFuIDMyLiBTaW5jZSBpdCBpcyBleHRyZW1lbHkgcmFyZSB0b1xuICogaGF2ZSBtb3JlIHRoYW4gMzIgYmluZGluZ3MgdGhpcyB3aWxsIGJlIGhpdCB2ZXJ5IHJhcmVseS4gVGhlIGRvd25zaWRlIG9mIGhpdHRpbmcgdGhpcyBjb3JuZXJcbiAqIGNhc2UgaXMgdGhhdCB3ZSB3aWxsIGV4ZWN1dGUgYmluZGluZyBjb2RlIG1vcmUgb2Z0ZW4gdGhhbiBuZWNlc3NhcnkuIChwZW5hbHR5IG9mIHBlcmZvcm1hbmNlKVxuICovXG5mdW5jdGlvbiB0b01hc2tCaXQoYmluZGluZ0luZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gMSA8PCBNYXRoLm1pbihiaW5kaW5nSW5kZXgsIDMxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUm9vdFRlbXBsYXRlTWVzc2FnZShzdWJUZW1wbGF0ZUluZGV4OiBudW1iZXIpOiBzdWJUZW1wbGF0ZUluZGV4IGlzIC0gMSB7XG4gIHJldHVybiBzdWJUZW1wbGF0ZUluZGV4ID09PSAtMTtcbn1cblxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgaW5UZW1wbGF0ZSwgZmFsc2UsXG4gICAgICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7XG4gICAgICAgICAgICAgIG1lc3NhZ2V9XCJgKTtcblxuICByZXMgKz0gbWVzc2FnZS5zdWJzdHIoaW5kZXgpO1xuICByZXR1cm4gcmVzO1xufVxuXG5cbi8qKlxuICogRXh0cmFjdHMgYSBwYXJ0IG9mIGEgbWVzc2FnZSBhbmQgcmVtb3ZlcyB0aGUgcmVzdC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBleHRyYWN0aW5nIGEgcGFydCBvZiB0aGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gQVxuICogdHJhbnNsYXRlZCBtZXNzYWdlIGNhbiBzcGFuIG11bHRpcGxlIHRlbXBsYXRlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGkxOG4+VHJhbnNsYXRlIDxzcGFuICpuZ0lmPm1lPC9zcGFuPiE8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGNyb3BcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IG9mIHRoZSBzdWItdGVtcGxhdGUgdG8gZXh0cmFjdC4gSWYgdW5kZWZpbmVkIGl0IHJldHVybnMgdGhlXG4gKiBleHRlcm5hbCB0ZW1wbGF0ZSBhbmQgcmVtb3ZlcyBhbGwgc3ViLXRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGlzUm9vdFRlbXBsYXRlTWVzc2FnZShzdWJUZW1wbGF0ZUluZGV4KSkge1xuICAgIC8vIFdlIHdhbnQgdGhlIHJvb3QgdGVtcGxhdGUgbWVzc2FnZSwgaWdub3JlIGFsbCBzdWItdGVtcGxhdGVzXG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSB3YW50IGEgc3BlY2lmaWMgc3ViLXRlbXBsYXRlXG4gICAgY29uc3Qgc3RhcnQgPVxuICAgICAgICBtZXNzYWdlLmluZGV4T2YoYDoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkgKyAyICsgc3ViVGVtcGxhdGVJbmRleC50b1N0cmluZygpLmxlbmd0aDtcbiAgICBjb25zdCBlbmQgPSBtZXNzYWdlLnNlYXJjaChuZXcgUmVnRXhwKGAke01BUktFUn1cXFxcL1xcXFwqXFxcXGQrOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSk7XG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlLnN1YnN0cmluZyhzdGFydCwgZW5kKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyBmb3IgSUNVIGV4cHJlc3Npb25zLlxuICpcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggd2hlcmUgdGhlIGFuY2hvciBpcyBzdG9yZWQgYW5kIGFuIG9wdGlvbmFsIGBUSWN1Q29udGFpbmVyTm9kZWBcbiAqICAgLSBgbFZpZXdbYW5jaG9ySWR4XWAgcG9pbnRzIHRvIGEgYENvbW1lbnRgIG5vZGUgcmVwcmVzZW50aW5nIHRoZSBhbmNob3IgZm9yIHRoZSBJQ1UuXG4gKiAgIC0gYHRWaWV3LmRhdGFbYW5jaG9ySWR4XWAgcG9pbnRzIHRvIHRoZSBgVEljdUNvbnRhaW5lck5vZGVgIGlmIElDVSBpcyByb290IChgbnVsbGAgb3RoZXJ3aXNlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gaWN1U3RhcnQoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBwYXJlbnRJZHg6IG51bWJlcixcbiAgICBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBhbmNob3JJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChpY3VFeHByZXNzaW9uLCAnSUNVIGV4cHJlc3Npb24gbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGxldCBiaW5kaW5nTWFzayA9IDA7XG4gIGNvbnN0IHRJY3U6IFRJY3UgPSB7XG4gICAgdHlwZTogaWN1RXhwcmVzc2lvbi50eXBlLFxuICAgIGN1cnJlbnRDYXNlTFZpZXdJbmRleDogYWxsb2NFeHBhbmRvKHRWaWV3LCBsVmlldywgMSksXG4gICAgYW5jaG9ySWR4LFxuICAgIGNhc2VzOiBbXSxcbiAgICBjcmVhdGU6IFtdLFxuICAgIHJlbW92ZTogW10sXG4gICAgdXBkYXRlOiBbXVxuICB9O1xuICBhZGRVcGRhdGVJY3VTd2l0Y2godXBkYXRlT3BDb2RlcywgaWN1RXhwcmVzc2lvbiwgYW5jaG9ySWR4KTtcbiAgc2V0VEljdSh0VmlldywgYW5jaG9ySWR4LCB0SWN1KTtcbiAgY29uc3QgdmFsdWVzID0gaWN1RXhwcmVzc2lvbi52YWx1ZXM7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gRWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzICYgb3RoZXIgSUNVIGV4cHJlc3Npb25zXG4gICAgY29uc3QgdmFsdWVBcnIgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIEl0IGlzIGFuIG5lc3RlZCBJQ1UgZXhwcmVzc2lvblxuICAgICAgICBjb25zdCBpY3VJbmRleCA9IG5lc3RlZEljdXMucHVzaCh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uKSAtIDE7XG4gICAgICAgIC8vIFJlcGxhY2UgbmVzdGVkIElDVSBleHByZXNzaW9uIGJ5IGEgY29tbWVudCBub2RlXG4gICAgICAgIHZhbHVlQXJyW2pdID0gYDwhLS3vv70ke2ljdUluZGV4fe+/vS0tPmA7XG4gICAgICB9XG4gICAgfVxuICAgIGJpbmRpbmdNYXNrID0gcGFyc2VJY3VDYXNlKFxuICAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCB0SWN1LCBsVmlldywgdXBkYXRlT3BDb2RlcywgcGFyZW50SWR4LCBpY3VFeHByZXNzaW9uLmNhc2VzW2ldLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlQXJyLmpvaW4oJycpLCBuZXN0ZWRJY3VzKSB8XG4gICAgICAgIGJpbmRpbmdNYXNrO1xuICB9XG4gIGlmIChiaW5kaW5nTWFzaykge1xuICAgIGFkZFVwZGF0ZUljdVVwZGF0ZSh1cGRhdGVPcENvZGVzLCBiaW5kaW5nTWFzaywgYW5jaG9ySWR4KTtcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlcyB0ZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gYW5kIHByb2R1Y2VzIGEgSlNPTiBvYmplY3QgZm9yIGl0LlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gVGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdW10gPSBbXTtcbiAgbGV0IGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgbGV0IG1haW5CaW5kaW5nID0gMDtcbiAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShJQ1VfQkxPQ0tfUkVHRVhQLCBmdW5jdGlvbihzdHI6IHN0cmluZywgYmluZGluZzogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICAgIH1cbiAgICBtYWluQmluZGluZyA9IHBhcnNlSW50KGJpbmRpbmcuc3Vic3RyKDEpLCAxMCk7XG4gICAgcmV0dXJuICcnO1xuICB9KTtcblxuICBjb25zdCBwYXJ0cyA9IGkxOG5QYXJzZVRleHRJbnRvUGFydHNBbmRJQ1UocGF0dGVybikgYXMgc3RyaW5nW107XG4gIC8vIExvb2tpbmcgZm9yIChrZXkgYmxvY2spKyBzZXF1ZW5jZS4gT25lIG9mIHRoZSBrZXlzIGhhcyB0byBiZSBcIm90aGVyXCIuXG4gIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IHBhcnRzLmxlbmd0aDspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbcG9zKytdLnRyaW0oKTtcbiAgICBpZiAoaWN1VHlwZSA9PT0gSWN1VHlwZS5wbHVyYWwpIHtcbiAgICAgIC8vIEtleSBjYW4gYmUgXCI9eFwiLCB3ZSBqdXN0IHdhbnQgXCJ4XCJcbiAgICAgIGtleSA9IGtleS5yZXBsYWNlKC9cXHMqKD86PSk/KFxcdyspXFxzKi8sICckMScpO1xuICAgIH1cbiAgICBpZiAoa2V5Lmxlbmd0aCkge1xuICAgICAgY2FzZXMucHVzaChrZXkpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrcyA9IGkxOG5QYXJzZVRleHRJbnRvUGFydHNBbmRJQ1UocGFydHNbcG9zKytdKSBhcyBzdHJpbmdbXTtcbiAgICBpZiAoY2FzZXMubGVuZ3RoID4gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdmFsdWVzLnB1c2goYmxvY2tzKTtcbiAgICB9XG4gIH1cblxuICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXMsIHNlZSAjMjE2MTVcbiAgcmV0dXJuIHt0eXBlOiBpY3VUeXBlLCBtYWluQmluZGluZzogbWFpbkJpbmRpbmcsIGNhc2VzLCB2YWx1ZXN9O1xufVxuXG5cbi8qKlxuICogQnJlYWtzIHBhdHRlcm4gaW50byBzdHJpbmdzIGFuZCB0b3AgbGV2ZWwgey4uLn0gYmxvY2tzLlxuICogQ2FuIGJlIHVzZWQgdG8gYnJlYWsgYSBtZXNzYWdlIGludG8gdGV4dCBhbmQgSUNVIGV4cHJlc3Npb25zLCBvciB0byBicmVhayBhbiBJQ1UgZXhwcmVzc2lvblxuICogaW50byBrZXlzIGFuZCBjYXNlcy4gT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gKHN1YilQYXR0ZXJuIHRvIGJlIGJyb2tlbi5cbiAqIEByZXR1cm5zIEFuIGBBcnJheTxzdHJpbmd8SWN1RXhwcmVzc2lvbj5gIHdoZXJlOlxuICogICAtIG9kZCBwb3NpdGlvbnM6IGBzdHJpbmdgID0+IHRleHQgYmV0d2VlbiBJQ1UgZXhwcmVzc2lvbnNcbiAqICAgLSBldmVuIHBvc2l0aW9uczogYElDVUV4cHJlc3Npb25gID0+IElDVSBleHByZXNzaW9uIHBhcnNlZCBpbnRvIGBJQ1VFeHByZXNzaW9uYCByZWNvcmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuUGFyc2VUZXh0SW50b1BhcnRzQW5kSUNVKHBhdHRlcm46IHN0cmluZyk6IChzdHJpbmd8SWN1RXhwcmVzc2lvbilbXSB7XG4gIGlmICghcGF0dGVybikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGxldCBwcmV2UG9zID0gMDtcbiAgY29uc3QgYnJhY2VTdGFjayA9IFtdO1xuICBjb25zdCByZXN1bHRzOiAoc3RyaW5nfEljdUV4cHJlc3Npb24pW10gPSBbXTtcbiAgY29uc3QgYnJhY2VzID0gL1t7fV0vZztcbiAgLy8gbGFzdEluZGV4IGRvZXNuJ3QgZ2V0IHNldCB0byAwIHNvIHdlIGhhdmUgdG8uXG4gIGJyYWNlcy5sYXN0SW5kZXggPSAwO1xuXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKG1hdGNoID0gYnJhY2VzLmV4ZWMocGF0dGVybikpIHtcbiAgICBjb25zdCBwb3MgPSBtYXRjaC5pbmRleDtcbiAgICBpZiAobWF0Y2hbMF0gPT0gJ30nKSB7XG4gICAgICBicmFjZVN0YWNrLnBvcCgpO1xuXG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBFbmQgb2YgdGhlIGJsb2NrLlxuICAgICAgICBjb25zdCBibG9jayA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIGlmIChJQ1VfQkxPQ0tfUkVHRVhQLnRlc3QoYmxvY2spKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHBhcnNlSUNVQmxvY2soYmxvY2spKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goYmxvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICAgIGJyYWNlU3RhY2sucHVzaCgneycpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MpO1xuICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJY3VDYXNlKFxuICAgIHRWaWV3OiBUVmlldywgdEljdTogVEljdSwgbFZpZXc6IExWaWV3LCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgcGFyZW50SWR4OiBudW1iZXIsXG4gICAgY2FzZU5hbWU6IHN0cmluZywgdW5zYWZlQ2FzZUh0bWw6IHN0cmluZywgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdKTogbnVtYmVyIHtcbiAgY29uc3QgY3JlYXRlOiBJY3VDcmVhdGVPcENvZGVzID0gW10gYXMgYW55O1xuICBjb25zdCByZW1vdmU6IEkxOG5SZW1vdmVPcENvZGVzID0gW10gYXMgYW55O1xuICBjb25zdCB1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzID0gW10gYXMgYW55O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIoY3JlYXRlLCBpY3VDcmVhdGVPcENvZGVzVG9TdHJpbmcpO1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKHJlbW92ZSwgaTE4blJlbW92ZU9wQ29kZXNUb1N0cmluZyk7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIodXBkYXRlLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuICB0SWN1LmNhc2VzLnB1c2goY2FzZU5hbWUpO1xuICB0SWN1LmNyZWF0ZS5wdXNoKGNyZWF0ZSk7XG4gIHRJY3UucmVtb3ZlLnB1c2gocmVtb3ZlKTtcbiAgdEljdS51cGRhdGUucHVzaCh1cGRhdGUpO1xuXG4gIGNvbnN0IGluZXJ0Qm9keUhlbHBlciA9IGdldEluZXJ0Qm9keUhlbHBlcihnZXREb2N1bWVudCgpKTtcbiAgY29uc3QgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUNhc2VIdG1sKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaW5lcnRCb2R5RWxlbWVudCwgJ1VuYWJsZSB0byBnZW5lcmF0ZSBpbmVydCBib2R5IGVsZW1lbnQnKTtcbiAgY29uc3QgaW5lcnRSb290Tm9kZSA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50ISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50O1xuICBpZiAoaW5lcnRSb290Tm9kZSkge1xuICAgIHJldHVybiB3YWxrSWN1VHJlZShcbiAgICAgICAgdFZpZXcsIHRJY3UsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBjcmVhdGUsIHJlbW92ZSwgdXBkYXRlLCBpbmVydFJvb3ROb2RlLCBwYXJlbnRJZHgsXG4gICAgICAgIG5lc3RlZEljdXMsIDApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdhbGtJY3VUcmVlKFxuICAgIHRWaWV3OiBUVmlldywgdEljdTogVEljdSwgbFZpZXc6IExWaWV3LCBzaGFyZWRVcGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyxcbiAgICBjcmVhdGU6IEljdUNyZWF0ZU9wQ29kZXMsIHJlbW92ZTogSTE4blJlbW92ZU9wQ29kZXMsIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXMsXG4gICAgcGFyZW50Tm9kZTogRWxlbWVudCwgcGFyZW50SWR4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSwgZGVwdGg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBiaW5kaW5nTWFzayA9IDA7XG4gIGxldCBjdXJyZW50Tm9kZSA9IHBhcmVudE5vZGUuZmlyc3RDaGlsZDtcbiAgd2hpbGUgKGN1cnJlbnROb2RlKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCAxKTtcbiAgICBzd2l0Y2ggKGN1cnJlbnROb2RlLm5vZGVUeXBlKSB7XG4gICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICBjb25zdCBlbGVtZW50ID0gY3VycmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHtcbiAgICAgICAgICBhZGRDcmVhdGVOb2RlQW5kQXBwZW5kKGNyZWF0ZSwgRUxFTUVOVF9NQVJLRVIsIHRhZ05hbWUsIHBhcmVudElkeCwgbmV3SW5kZXgpO1xuICAgICAgICAgIHRWaWV3LmRhdGFbbmV3SW5kZXhdID0gdGFnTmFtZTtcbiAgICAgICAgICBjb25zdCBlbEF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSE7XG4gICAgICAgICAgICBjb25zdCBsb3dlckF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISFhdHRyLnZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGUgaW5wdXQgc3RyaW5nIGlzIHNhZmUsIHVubGVzcyBpdCdzIHVzaW5nIGEgYmluZGluZ1xuICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgaWYgKFZBTElEX0FUVFJTLmhhc093blByb3BlcnR5KGxvd2VyQXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFVSSV9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgICB1cGRhdGUsIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIF9zYW5pdGl6ZVVybCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChTUkNTRVRfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgICAgdXBkYXRlLCBhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBzYW5pdGl6ZVNyY3NldCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModXBkYXRlLCBhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmdEZXZNb2RlICYmIGNvbnNvbGUud2FybihgIFdBUk5JTkc6XG4gICAgICBpZ25vcmluZyB1bnNhZmUgYXR0cmlidXRlIHZhbHVlICR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAkIHtcbiAgICB0YWdOYW1lXG4gIH0gKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFkZENyZWF0ZUF0dHJpYnV0ZShjcmVhdGUsIG5ld0luZGV4LCBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUGFyc2UgdGhlIGNoaWxkcmVuIG9mIHRoaXMgbm9kZSAoaWYgYW55KVxuICAgICAgICAgIGJpbmRpbmdNYXNrID0gd2Fsa0ljdVRyZWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdFZpZXcsIHRJY3UsIGxWaWV3LCBzaGFyZWRVcGRhdGVPcENvZGVzLCBjcmVhdGUsIHJlbW92ZSwgdXBkYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlIGFzIEVsZW1lbnQsIG5ld0luZGV4LCBuZXN0ZWRJY3VzLCBkZXB0aCArIDEpIHxcbiAgICAgICAgICAgICAgYmluZGluZ01hc2s7XG4gICAgICAgICAgYWRkUmVtb3ZlTm9kZShyZW1vdmUsIG5ld0luZGV4LCBkZXB0aCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgICBjb25zdCB2YWx1ZSA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICBhZGRDcmVhdGVOb2RlQW5kQXBwZW5kKGNyZWF0ZSwgbnVsbCwgaGFzQmluZGluZyA/ICcnIDogdmFsdWUsIHBhcmVudElkeCwgbmV3SW5kZXgpO1xuICAgICAgICBhZGRSZW1vdmVOb2RlKHJlbW92ZSwgbmV3SW5kZXgsIGRlcHRoKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBiaW5kaW5nTWFzayA9IGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModXBkYXRlLCB2YWx1ZSwgbmV3SW5kZXgpIHwgYmluZGluZ01hc2s7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgY29tbWVudCBub2RlIGlzIGEgcGxhY2Vob2xkZXIgZm9yIGEgbmVzdGVkIElDVVxuICAgICAgICBjb25zdCBpc05lc3RlZEljdSA9IE5FU1RFRF9JQ1UuZXhlYyhjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJyk7XG4gICAgICAgIGlmIChpc05lc3RlZEljdSkge1xuICAgICAgICAgIGNvbnN0IG5lc3RlZEljdUluZGV4ID0gcGFyc2VJbnQoaXNOZXN0ZWRJY3VbMV0sIDEwKTtcbiAgICAgICAgICBjb25zdCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uID0gbmVzdGVkSWN1c1tuZXN0ZWRJY3VJbmRleF07XG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBhZGRDcmVhdGVOb2RlQW5kQXBwZW5kKFxuICAgICAgICAgICAgICBjcmVhdGUsIElDVV9NQVJLRVIsIG5nRGV2TW9kZSA/IGBuZXN0ZWQgSUNVICR7bmVzdGVkSWN1SW5kZXh9YCA6ICcnLCBwYXJlbnRJZHgsXG4gICAgICAgICAgICAgIG5ld0luZGV4KTtcbiAgICAgICAgICBpY3VTdGFydCh0VmlldywgbFZpZXcsIHNoYXJlZFVwZGF0ZU9wQ29kZXMsIHBhcmVudElkeCwgaWN1RXhwcmVzc2lvbiwgbmV3SW5kZXgpO1xuICAgICAgICAgIGFkZFJlbW92ZU5lc3RlZEljdShyZW1vdmUsIG5ld0luZGV4LCBkZXB0aCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gIH1cbiAgcmV0dXJuIGJpbmRpbmdNYXNrO1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmVOb2RlKHJlbW92ZTogSTE4blJlbW92ZU9wQ29kZXMsIGluZGV4OiBudW1iZXIsIGRlcHRoOiBudW1iZXIpIHtcbiAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgcmVtb3ZlLnB1c2goaW5kZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZFJlbW92ZU5lc3RlZEljdShyZW1vdmU6IEkxOG5SZW1vdmVPcENvZGVzLCBpbmRleDogbnVtYmVyLCBkZXB0aDogbnVtYmVyKSB7XG4gIGlmIChkZXB0aCA9PT0gMCkge1xuICAgIHJlbW92ZS5wdXNoKH5pbmRleCk7ICAvLyByZW1vdmUgSUNVIGF0IGBpbmRleGBcbiAgICByZW1vdmUucHVzaChpbmRleCk7ICAgLy8gcmVtb3ZlIElDVSBjb21tZW50IGF0IGBpbmRleGBcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRVcGRhdGVJY3VTd2l0Y2goXG4gICAgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgaW5kZXg6IG51bWJlcikge1xuICB1cGRhdGUucHVzaChcbiAgICAgIHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKSwgMiwgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgICAgaW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCk7XG59XG5cbmZ1bmN0aW9uIGFkZFVwZGF0ZUljdVVwZGF0ZSh1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzLCBiaW5kaW5nTWFzazogbnVtYmVyLCBpbmRleDogbnVtYmVyKSB7XG4gIHVwZGF0ZS5wdXNoKGJpbmRpbmdNYXNrLCAxLCBpbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlKTtcbn1cblxuZnVuY3Rpb24gYWRkQ3JlYXRlTm9kZUFuZEFwcGVuZChcbiAgICBjcmVhdGU6IEljdUNyZWF0ZU9wQ29kZXMsIG1hcmtlcjogbnVsbHxJQ1VfTUFSS0VSfEVMRU1FTlRfTUFSS0VSLCB0ZXh0OiBzdHJpbmcsXG4gICAgYXBwZW5kVG9QYXJlbnRJZHg6IG51bWJlciwgY3JlYXRlQXRJZHg6IG51bWJlcikge1xuICBpZiAobWFya2VyICE9PSBudWxsKSB7XG4gICAgY3JlYXRlLnB1c2gobWFya2VyKTtcbiAgfVxuICBjcmVhdGUucHVzaChcbiAgICAgIHRleHQsIGNyZWF0ZUF0SWR4LFxuICAgICAgaWN1Q3JlYXRlT3BDb2RlKEljdUNyZWF0ZU9wQ29kZS5BcHBlbmRDaGlsZCwgYXBwZW5kVG9QYXJlbnRJZHgsIGNyZWF0ZUF0SWR4KSk7XG59XG5cbmZ1bmN0aW9uIGFkZENyZWF0ZUF0dHJpYnV0ZShjcmVhdGU6IEljdUNyZWF0ZU9wQ29kZXMsIG5ld0luZGV4OiBudW1iZXIsIGF0dHI6IEF0dHIpIHtcbiAgY3JlYXRlLnB1c2gobmV3SW5kZXggPDwgSWN1Q3JlYXRlT3BDb2RlLlNISUZUX1JFRiB8IEljdUNyZWF0ZU9wQ29kZS5BdHRyLCBhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xufSJdfQ==