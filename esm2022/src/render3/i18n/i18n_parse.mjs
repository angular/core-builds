/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';
import { XSS_SECURITY_URL } from '../../error_details_base_url';
import { getTemplateContent, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS, } from '../../sanitization/html_sanitizer';
import { getInertBodyHelper } from '../../sanitization/inert_body';
import { _sanitizeUrl } from '../../sanitization/url_sanitizer';
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertOneOf, assertString, } from '../../util/assert';
import { loadIcuContainerVisitor } from '../instructions/i18n_icu_container_visitor';
import { allocExpando, createTNodeAtIndex } from '../instructions/shared';
import { getDocument } from '../interfaces/document';
import { ELEMENT_MARKER, I18nCreateOpCode, ICU_MARKER, } from '../interfaces/i18n';
import { HEADER_OFFSET } from '../interfaces/view';
import { getCurrentParentTNode, getCurrentTNode, setCurrentTNode } from '../state';
import { i18nCreateOpCodesToString, i18nRemoveOpCodesToString, i18nUpdateOpCodesToString, icuCreateOpCodesToString, } from './i18n_debug';
import { addTNodeAndUpdateInsertBeforeIndex } from './i18n_insert_before_index';
import { ensureIcuContainerVisitorLoaded } from './i18n_tree_shaking';
import { createTNodePlaceholder, icuCreateOpCode, isRootTemplateMessage, setTIcu, setTNodeInsertBeforeIndex, } from './i18n_util';
const BINDING_REGEXP = /�(\d+):?\d*�/gi;
const ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
const NESTED_ICU = /�(\d+)�/;
const ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;
const MARKER = `�`;
const SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
const PH_REGEXP = /�(\/?[#*]\d+):?\d*�/gi;
/**
 * Angular uses the special entity &ngsp; as a placeholder for non-removable space.
 * It's replaced by the 0xE500 PUA (Private Use Areas) unicode character and later on replaced by a
 * space.
 * We are re-implementing the same idea since translations might contain this special character.
 */
const NGSP_UNICODE_REGEXP = /\uE500/g;
function replaceNgsp(value) {
    return value.replace(NGSP_UNICODE_REGEXP, ' ');
}
/**
 * Patch a `debug` property getter on top of the existing object.
 *
 * NOTE: always call this method with `ngDevMode && attachDebugObject(...)`
 *
 * @param obj Object to patch
 * @param debugGetter Getter returning a value to patch
 */
function attachDebugGetter(obj, debugGetter) {
    if (ngDevMode) {
        Object.defineProperty(obj, 'debug', { get: debugGetter, enumerable: false });
    }
    else {
        throw new Error('This method should be guarded with `ngDevMode` so that it can be tree shaken in production!');
    }
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
    const astStack = [[]];
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
                        i18nStartFirstCreatePassProcessTextNode(astStack[0], tView, rootTNode, existingTNodeStack[0], createOpCodes, updateOpCodes, lView, text);
                    }
                }
                else {
                    // `j` is Even therefor `part` is an `ICUExpression`
                    const icuExpression = part;
                    // Verify that ICU expression has the right shape. Translations might contain invalid
                    // constructions (while original messages were correct), so ICU parsing at runtime may
                    // not succeed (thus `icuExpression` remains a string).
                    // Note: we intentionally retain the error here by not using `ngDevMode`, because
                    // the value can change based on the locale and users aren't guaranteed to hit
                    // an invalid string while they're developing.
                    if (typeof icuExpression !== 'object') {
                        throw new Error(`Unable to parse ICU expression in "${message}" message.`);
                    }
                    const icuContainerTNode = createTNodeAndAddOpCode(tView, rootTNode, existingTNodeStack[0], lView, createOpCodes, ngDevMode ? `ICU ${index}:${icuExpression.mainBinding}` : '', true);
                    const icuNodeIndex = icuContainerTNode.index;
                    ngDevMode &&
                        assertGreaterThanOrEqual(icuNodeIndex, HEADER_OFFSET, 'Index must be in absolute LView offset');
                    icuStart(astStack[0], tView, lView, updateOpCodes, parentTNodeIndex, icuExpression, icuNodeIndex);
                }
            }
        }
        else {
            // Odd indexes are placeholders (elements and sub-templates)
            // At this point value is something like: '/#1:2' (originally coming from '�/#1:2�')
            const isClosing = value.charCodeAt(0) === 47 /* CharCode.SLASH */;
            const type = value.charCodeAt(isClosing ? 1 : 0);
            ngDevMode && assertOneOf(type, 42 /* CharCode.STAR */, 35 /* CharCode.HASH */);
            const index = HEADER_OFFSET + Number.parseInt(value.substring(isClosing ? 2 : 1));
            if (isClosing) {
                existingTNodeStack.shift();
                astStack.shift();
                setCurrentTNode(getCurrentParentTNode(), false);
            }
            else {
                const tNode = createTNodePlaceholder(tView, existingTNodeStack[0], index);
                existingTNodeStack.unshift([]);
                setCurrentTNode(tNode, true);
                const placeholderNode = {
                    kind: 2 /* I18nNodeKind.PLACEHOLDER */,
                    index,
                    children: [],
                    type: type === 35 /* CharCode.HASH */ ? 0 /* I18nPlaceholderType.ELEMENT */ : 1 /* I18nPlaceholderType.SUBTEMPLATE */,
                };
                astStack[0].push(placeholderNode);
                astStack.unshift(placeholderNode.children);
            }
        }
    }
    tView.data[index] = {
        create: createOpCodes,
        update: updateOpCodes,
        ast: astStack[0],
        parentTNodeIndex,
    };
}
/**
 * Allocate space in i18n Range add create OpCode instruction to create a text or comment node.
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
    const i18nNodeIdx = allocExpando(tView, lView, 1, null);
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
    const tNode = createTNodeAtIndex(tView, i18nNodeIdx, isICU ? 32 /* TNodeType.Icu */ : 1 /* TNodeType.Text */, text === null ? (ngDevMode ? '{{?}}' : '') : text, null);
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
function i18nStartFirstCreatePassProcessTextNode(ast, tView, rootTNode, existingTNodes, createOpCodes, updateOpCodes, lView, text) {
    const hasBinding = text.match(BINDING_REGEXP);
    const tNode = createTNodeAndAddOpCode(tView, rootTNode, existingTNodes, lView, createOpCodes, hasBinding ? null : text, false);
    const index = tNode.index;
    if (hasBinding) {
        generateBindingUpdateOpCodes(updateOpCodes, text, index, null, 0, null);
    }
    ast.push({ kind: 0 /* I18nNodeKind.TEXT */, index });
}
/**
 * See `i18nAttributes` above.
 */
export function i18nAttributesFirstPass(tView, index, values) {
    const previousElement = getCurrentTNode();
    const previousElementIndex = previousElement.index;
    const updateOpCodes = [];
    if (ngDevMode) {
        attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
    }
    if (tView.firstCreatePass && tView.data[index] === null) {
        for (let i = 0; i < values.length; i += 2) {
            const attrName = values[i];
            const message = values[i + 1];
            if (message !== '') {
                // Check if attribute value contains an ICU and throw an error if that's the case.
                // ICUs in element attributes are not supported.
                // Note: we intentionally retain the error here by not using `ngDevMode`, because
                // the `value` can change based on the locale and users aren't guaranteed to hit
                // an invalid string while they're developing.
                if (ICU_REGEXP.test(message)) {
                    throw new Error(`ICU expressions are not supported in attributes. Message: "${message}".`);
                }
                // i18n attributes that hit this code path are guaranteed to have bindings, because
                // the compiler treats static i18n attributes as regular attribute bindings.
                // Since this may not be the first i18n attribute on this element we need to pass in how
                // many previous bindings there have already been.
                generateBindingUpdateOpCodes(updateOpCodes, message, previousElementIndex, attrName, countBindings(updateOpCodes), null);
            }
        }
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
 * @param bindingStart The lView index of the next expression that can be bound via an opCode.
 * @returns The mask value for these bindings
 */
function generateBindingUpdateOpCodes(updateOpCodes, str, destinationNode, attrName, bindingStart, sanitizeFn) {
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
            const bindingIndex = bindingStart + parseInt(textValue, 10);
            updateOpCodes.push(-1 - bindingIndex);
            mask = mask | toMaskBit(bindingIndex);
        }
        else if (textValue !== '') {
            // Even indexes are text
            updateOpCodes.push(textValue);
        }
    }
    updateOpCodes.push((destinationNode << 2 /* I18nUpdateOpCode.SHIFT_REF */) |
        (attrName ? 1 /* I18nUpdateOpCode.Attr */ : 0 /* I18nUpdateOpCode.Text */));
    if (attrName) {
        updateOpCodes.push(attrName, sanitizeFn);
    }
    updateOpCodes[maskIndex] = mask;
    updateOpCodes[sizeIndex] = updateOpCodes.length - startIndex;
    return mask;
}
/**
 * Count the number of bindings in the given `opCodes`.
 *
 * It could be possible to speed this up, by passing the number of bindings found back from
 * `generateBindingUpdateOpCodes()` to `i18nAttributesFirstPass()` but this would then require more
 * complexity in the code and/or transient objects to be created.
 *
 * Since this function is only called once when the template is instantiated, is trivial in the
 * first instance (since `opCodes` will be an empty array), and it is not common for elements to
 * contain multiple i18n bound attributes, it seems like this is a reasonable compromise.
 */
function countBindings(opCodes) {
    let count = 0;
    for (let i = 0; i < opCodes.length; i++) {
        const opCode = opCodes[i];
        // Bindings are negative numbers.
        if (typeof opCode === 'number' && opCode < 0) {
            count++;
        }
    }
    return count;
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
    res += message.slice(index);
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
function icuStart(ast, tView, lView, updateOpCodes, parentIdx, icuExpression, anchorIdx) {
    ngDevMode && assertDefined(icuExpression, 'ICU expression must be defined');
    let bindingMask = 0;
    const tIcu = {
        type: icuExpression.type,
        currentCaseLViewIndex: allocExpando(tView, lView, 1, null),
        anchorIdx,
        cases: [],
        create: [],
        remove: [],
        update: [],
    };
    addUpdateIcuSwitch(updateOpCodes, icuExpression, anchorIdx);
    setTIcu(tView, anchorIdx, tIcu);
    const values = icuExpression.values;
    const cases = [];
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
        const caseAst = [];
        cases.push(caseAst);
        bindingMask =
            parseIcuCase(caseAst, tView, tIcu, lView, updateOpCodes, parentIdx, icuExpression.cases[i], valueArr.join(''), nestedIcus) | bindingMask;
    }
    if (bindingMask) {
        addUpdateIcuUpdate(updateOpCodes, bindingMask, anchorIdx);
    }
    ast.push({
        kind: 3 /* I18nNodeKind.ICU */,
        index: anchorIdx,
        cases,
        currentCaseLViewIndex: tIcu.currentCaseLViewIndex,
    });
}
/**
 * Parses text containing an ICU expression and produces a JSON object for it.
 * Original code from closure library, modified for Angular.
 *
 * @param pattern Text containing an ICU expression that needs to be parsed.
 *
 */
function parseICUBlock(pattern) {
    const cases = [];
    const values = [];
    let icuType = 1 /* IcuType.plural */;
    let mainBinding = 0;
    pattern = pattern.replace(ICU_BLOCK_REGEXP, function (str, binding, type) {
        if (type === 'select') {
            icuType = 0 /* IcuType.select */;
        }
        else {
            icuType = 1 /* IcuType.plural */;
        }
        mainBinding = parseInt(binding.slice(1), 10);
        return '';
    });
    const parts = i18nParseTextIntoPartsAndICU(pattern);
    // Looking for (key block)+ sequence. One of the keys has to be "other".
    for (let pos = 0; pos < parts.length;) {
        let key = parts[pos++].trim();
        if (icuType === 1 /* IcuType.plural */) {
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
function i18nParseTextIntoPartsAndICU(pattern) {
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
    while ((match = braces.exec(pattern))) {
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
function parseIcuCase(ast, tView, tIcu, lView, updateOpCodes, parentIdx, caseName, unsafeCaseHtml, nestedIcus) {
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
        return walkIcuTree(ast, tView, tIcu, lView, updateOpCodes, create, remove, update, inertRootNode, parentIdx, nestedIcus, 0);
    }
    else {
        return 0;
    }
}
function walkIcuTree(ast, tView, tIcu, lView, sharedUpdateOpCodes, create, remove, update, parentNode, parentIdx, nestedIcus, depth) {
    let bindingMask = 0;
    let currentNode = parentNode.firstChild;
    while (currentNode) {
        const newIndex = allocExpando(tView, lView, 1, null);
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
                                    generateBindingUpdateOpCodes(update, attr.value, newIndex, attr.name, 0, _sanitizeUrl);
                                }
                                else {
                                    generateBindingUpdateOpCodes(update, attr.value, newIndex, attr.name, 0, null);
                                }
                            }
                            else {
                                ngDevMode &&
                                    console.warn(`WARNING: ignoring unsafe attribute value ` +
                                        `${lowerAttrName} on element ${tagName} ` +
                                        `(see ${XSS_SECURITY_URL})`);
                            }
                        }
                        else {
                            addCreateAttribute(create, newIndex, attr);
                        }
                    }
                    const elementNode = {
                        kind: 1 /* I18nNodeKind.ELEMENT */,
                        index: newIndex,
                        children: [],
                    };
                    ast.push(elementNode);
                    // Parse the children of this node (if any)
                    bindingMask =
                        walkIcuTree(elementNode.children, tView, tIcu, lView, sharedUpdateOpCodes, create, remove, update, currentNode, newIndex, nestedIcus, depth + 1) | bindingMask;
                    addRemoveNode(remove, newIndex, depth);
                }
                break;
            case Node.TEXT_NODE:
                const value = currentNode.textContent || '';
                const hasBinding = value.match(BINDING_REGEXP);
                addCreateNodeAndAppend(create, null, hasBinding ? '' : value, parentIdx, newIndex);
                addRemoveNode(remove, newIndex, depth);
                if (hasBinding) {
                    bindingMask =
                        generateBindingUpdateOpCodes(update, value, newIndex, null, 0, null) | bindingMask;
                }
                ast.push({
                    kind: 0 /* I18nNodeKind.TEXT */,
                    index: newIndex,
                });
                break;
            case Node.COMMENT_NODE:
                // Check if the comment node is a placeholder for a nested ICU
                const isNestedIcu = NESTED_ICU.exec(currentNode.textContent || '');
                if (isNestedIcu) {
                    const nestedIcuIndex = parseInt(isNestedIcu[1], 10);
                    const icuExpression = nestedIcus[nestedIcuIndex];
                    // Create the comment node that will anchor the ICU expression
                    addCreateNodeAndAppend(create, ICU_MARKER, ngDevMode ? `nested ICU ${nestedIcuIndex}` : '', parentIdx, newIndex);
                    icuStart(ast, tView, lView, sharedUpdateOpCodes, parentIdx, icuExpression, newIndex);
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
    update.push(toMaskBit(icuExpression.mainBinding), 2, -1 - icuExpression.mainBinding, (index << 2 /* I18nUpdateOpCode.SHIFT_REF */) | 2 /* I18nUpdateOpCode.IcuSwitch */);
}
function addUpdateIcuUpdate(update, bindingMask, index) {
    update.push(bindingMask, 1, (index << 2 /* I18nUpdateOpCode.SHIFT_REF */) | 3 /* I18nUpdateOpCode.IcuUpdate */);
}
function addCreateNodeAndAppend(create, marker, text, appendToParentIdx, createAtIdx) {
    if (marker !== null) {
        create.push(marker);
    }
    create.push(text, createAtIdx, icuCreateOpCode(0 /* IcuCreateOpCode.AppendChild */, appendToParentIdx, createAtIdx));
}
function addCreateAttribute(create, newIndex, attr) {
    create.push((newIndex << 1 /* IcuCreateOpCode.SHIFT_REF */) | 1 /* IcuCreateOpCode.Attr */, attr.name, attr.value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9wYXJzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi9pMThuX3BhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sd0JBQXdCLENBQUM7QUFDaEMsT0FBTyxpQ0FBaUMsQ0FBQztBQUV6QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLFNBQVMsRUFDVCxXQUFXLEVBQ1gsY0FBYyxHQUNmLE1BQU0sbUNBQW1DLENBQUM7QUFDM0MsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDakUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQzlELE9BQU8sRUFDTCxhQUFhLEVBQ2IsV0FBVyxFQUNYLHdCQUF3QixFQUN4QixXQUFXLEVBQ1gsWUFBWSxHQUNiLE1BQU0sbUJBQW1CLENBQUM7QUFFM0IsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFDbkYsT0FBTyxFQUFDLFlBQVksRUFBRSxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQ0wsY0FBYyxFQUNkLGdCQUFnQixFQVVoQixVQUFVLEdBT1gsTUFBTSxvQkFBb0IsQ0FBQztBQUc1QixPQUFPLEVBQUMsYUFBYSxFQUFlLE1BQU0sb0JBQW9CLENBQUM7QUFDL0QsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFakYsT0FBTyxFQUNMLHlCQUF5QixFQUN6Qix5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLHdCQUF3QixHQUN6QixNQUFN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Q0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxzQ0FBOEIsQ0FBQyxxQ0FBNkIsQ0FBQyxDQUFDO0FBQ2xHLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUM3QixNQUF3QixFQUN4QixNQUEwQyxFQUMxQyxJQUFZLEVBQ1osaUJBQXlCLEVBQ3pCLFdBQW1CO0lBRW5CLElBQUksTUFBTSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUNELE1BQU0sQ0FBQyxJQUFJLENBQ1QsSUFBSSxFQUNKLFdBQVcsRUFDWCxlQUFlLHNDQUE4QixpQkFBaUIsRUFBRSxXQUFXLENBQUMsQ0FDN0UsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE1BQXdCLEVBQUUsUUFBZ0IsRUFBRSxJQUFVO0lBQ2hGLE1BQU0sQ0FBQyxJQUFJLENBQ1QsQ0FBQyxRQUFRLHFDQUE2QixDQUFDLCtCQUF1QixFQUM5RCxJQUFJLENBQUMsSUFBSSxFQUNULElBQUksQ0FBQyxLQUFLLENBQ1gsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5pbXBvcnQgJy4uLy4uL3V0aWwvbmdfaTE4bl9jbG9zdXJlX21vZGUnO1xuXG5pbXBvcnQge1hTU19TRUNVUklUWV9VUkx9IGZyb20gJy4uLy4uL2Vycm9yX2RldGFpbHNfYmFzZV91cmwnO1xuaW1wb3J0IHtcbiAgZ2V0VGVtcGxhdGVDb250ZW50LFxuICBVUklfQVRUUlMsXG4gIFZBTElEX0FUVFJTLFxuICBWQUxJRF9FTEVNRU5UUyxcbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybH0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3VybF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtcbiAgYXNzZXJ0RGVmaW5lZCxcbiAgYXNzZXJ0RXF1YWwsXG4gIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbCxcbiAgYXNzZXJ0T25lT2YsXG4gIGFzc2VydFN0cmluZyxcbn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtDaGFyQ29kZX0gZnJvbSAnLi4vLi4vdXRpbC9jaGFyX2NvZGUnO1xuaW1wb3J0IHtsb2FkSWN1Q29udGFpbmVyVmlzaXRvcn0gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL2kxOG5faWN1X2NvbnRhaW5lcl92aXNpdG9yJztcbmltcG9ydCB7YWxsb2NFeHBhbmRvLCBjcmVhdGVUTm9kZUF0SW5kZXh9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtnZXREb2N1bWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge1xuICBFTEVNRU5UX01BUktFUixcbiAgSTE4bkNyZWF0ZU9wQ29kZSxcbiAgSTE4bkNyZWF0ZU9wQ29kZXMsXG4gIEkxOG5FbGVtZW50Tm9kZSxcbiAgSTE4bk5vZGUsXG4gIEkxOG5Ob2RlS2luZCxcbiAgSTE4blBsYWNlaG9sZGVyTm9kZSxcbiAgSTE4blBsYWNlaG9sZGVyVHlwZSxcbiAgSTE4blJlbW92ZU9wQ29kZXMsXG4gIEkxOG5VcGRhdGVPcENvZGUsXG4gIEkxOG5VcGRhdGVPcENvZGVzLFxuICBJQ1VfTUFSS0VSLFxuICBJY3VDcmVhdGVPcENvZGUsXG4gIEljdUNyZWF0ZU9wQ29kZXMsXG4gIEljdUV4cHJlc3Npb24sXG4gIEljdVR5cGUsXG4gIFRJMThuLFxuICBUSWN1LFxufSBmcm9tICcuLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEN1cnJlbnRQYXJlbnRUTm9kZSwgZ2V0Q3VycmVudFROb2RlLCBzZXRDdXJyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcblxuaW1wb3J0IHtcbiAgaTE4bkNyZWF0ZU9wQ29kZXNUb1N0cmluZyxcbiAgaTE4blJlbW92ZU9wQ29kZXNUb1N0cmluZyxcbiAgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyxcbiAgaWN1Q3JlYXRlT3BDb2Rlc1RvU3RyaW5nLFxufSBmcm9tICcuL2kxOG5fZGVidWcnO1xuaW1wb3J0IHthZGRUTm9kZUFuZFVwZGF0ZUluc2VydEJlZm9yZUluZGV4fSBmcm9tICcuL2kxOG5faW5zZXJ0X2JlZm9yZV9pbmRleCc7XG5pbXBvcnQge2Vuc3VyZUljdUNvbnRhaW5lclZpc2l0b3JMb2FkZWR9IGZyb20gJy4vaTE4bl90cmVlX3NoYWtpbmcnO1xuaW1wb3J0IHtcbiAgY3JlYXRlVE5vZGVQbGFjZWhvbGRlcixcbiAgaWN1Q3JlYXRlT3BDb2RlLFxuICBpc1Jvb3RUZW1wbGF0ZU1lc3NhZ2UsXG4gIHNldFRJY3UsXG4gIHNldFROb2RlSW5zZXJ0QmVmb3JlSW5kZXgsXG59IGZyb20gJy4vaTE4bl91dGlsJztcblxuY29uc3QgQklORElOR19SRUdFWFAgPSAv77+9KFxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgSUNVX1JFR0VYUCA9IC8oe1xccyrvv71cXGQrOj9cXGQq77+9XFxzKixcXHMqXFxTezZ9XFxzKixbXFxzXFxTXSp9KS9naTtcbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcbmNvbnN0IElDVV9CTE9DS19SRUdFWFAgPSAvXlxccyoo77+9XFxkKzo/XFxkKu+/vSlcXHMqLFxccyooc2VsZWN0fHBsdXJhbClcXHMqLC87XG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgU1VCVEVNUExBVEVfUkVHRVhQID0gL++/vVxcLz9cXCooXFxkKzpcXGQrKe+/vS9naTtcbmNvbnN0IFBIX1JFR0VYUCA9IC/vv70oXFwvP1sjKl1cXGQrKTo/XFxkKu+/vS9naTtcblxuLyoqXG4gKiBBbmd1bGFyIHVzZXMgdGhlIHNwZWNpYWwgZW50aXR5ICZuZ3NwOyBhcyBhIHBsYWNlaG9sZGVyIGZvciBub24tcmVtb3ZhYmxlIHNwYWNlLlxuICogSXQncyByZXBsYWNlZCBieSB0aGUgMHhFNTAwIFBVQSAoUHJpdmF0ZSBVc2UgQXJlYXMpIHVuaWNvZGUgY2hhcmFjdGVyIGFuZCBsYXRlciBvbiByZXBsYWNlZCBieSBhXG4gKiBzcGFjZS5cbiAqIFdlIGFyZSByZS1pbXBsZW1lbnRpbmcgdGhlIHNhbWUgaWRlYSBzaW5jZSB0cmFuc2xhdGlvbnMgbWlnaHQgY29udGFpbiB0aGlzIHNwZWNpYWwgY2hhcmFjdGVyLlxuICovXG5jb25zdCBOR1NQX1VOSUNPREVfUkVHRVhQID0gL1xcdUU1MDAvZztcbmZ1bmN0aW9uIHJlcGxhY2VOZ3NwKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZShOR1NQX1VOSUNPREVfUkVHRVhQLCAnICcpO1xufVxuXG4vKipcbiAqIFBhdGNoIGEgYGRlYnVnYCBwcm9wZXJ0eSBnZXR0ZXIgb24gdG9wIG9mIHRoZSBleGlzdGluZyBvYmplY3QuXG4gKlxuICogTk9URTogYWx3YXlzIGNhbGwgdGhpcyBtZXRob2Qgd2l0aCBgbmdEZXZNb2RlICYmIGF0dGFjaERlYnVnT2JqZWN0KC4uLilgXG4gKlxuICogQHBhcmFtIG9iaiBPYmplY3QgdG8gcGF0Y2hcbiAqIEBwYXJhbSBkZWJ1Z0dldHRlciBHZXR0ZXIgcmV0dXJuaW5nIGEgdmFsdWUgdG8gcGF0Y2hcbiAqL1xuZnVuY3Rpb24gYXR0YWNoRGVidWdHZXR0ZXI8VD4ob2JqOiBULCBkZWJ1Z0dldHRlcjogKHRoaXM6IFQpID0+IGFueSk6IHZvaWQge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgJ2RlYnVnJywge2dldDogZGVidWdHZXR0ZXIsIGVudW1lcmFibGU6IGZhbHNlfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ1RoaXMgbWV0aG9kIHNob3VsZCBiZSBndWFyZGVkIHdpdGggYG5nRGV2TW9kZWAgc28gdGhhdCBpdCBjYW4gYmUgdHJlZSBzaGFrZW4gaW4gcHJvZHVjdGlvbiEnLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgZHluYW1pYyBub2RlcyBmcm9tIGkxOG4gdHJhbnNsYXRpb24gYmxvY2suXG4gKlxuICogLSBUZXh0IG5vZGVzIGFyZSBjcmVhdGVkIHN5bmNocm9ub3VzbHlcbiAqIC0gVE5vZGVzIGFyZSBsaW5rZWQgaW50byB0cmVlIGxhemlseVxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJlbnRUTm9kZUluZGV4IGluZGV4IHRvIHRoZSBwYXJlbnQgVE5vZGUgb2YgdGhpcyBpMThuIGJsb2NrXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgYMm1ybVpMThuU3RhcnRgIGluc3RydWN0aW9uLlxuICogQHBhcmFtIG1lc3NhZ2UgTWVzc2FnZSB0byB0cmFuc2xhdGUuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBJbmRleCBpbnRvIHRoZSBzdWIgdGVtcGxhdGUgb2YgbWVzc2FnZSB0cmFuc2xhdGlvbi4gKGllIGluIGNhc2Ugb2ZcbiAqICAgICBgbmdJZmApICgtMSBvdGhlcndpc2UpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuU3RhcnRGaXJzdENyZWF0ZVBhc3MoXG4gIHRWaWV3OiBUVmlldyxcbiAgcGFyZW50VE5vZGVJbmRleDogbnVtYmVyLFxuICBsVmlldzogTFZpZXcsXG4gIGluZGV4OiBudW1iZXIsXG4gIG1lc3NhZ2U6IHN0cmluZyxcbiAgc3ViVGVtcGxhdGVJbmRleDogbnVtYmVyLFxuKSB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBjcmVhdGVPcENvZGVzOiBJMThuQ3JlYXRlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXSBhcyBhbnk7XG4gIGNvbnN0IGV4aXN0aW5nVE5vZGVTdGFjazogVE5vZGVbXVtdID0gW1tdXTtcbiAgY29uc3QgYXN0U3RhY2s6IEFycmF5PEFycmF5PEkxOG5Ob2RlPj4gPSBbW11dO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIoY3JlYXRlT3BDb2RlcywgaTE4bkNyZWF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIodXBkYXRlT3BDb2RlcywgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gIH1cblxuICBtZXNzYWdlID0gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgY29uc3QgbXNnUGFydHMgPSByZXBsYWNlTmdzcChtZXNzYWdlKS5zcGxpdChQSF9SRUdFWFApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHZhbHVlID0gbXNnUGFydHNbaV07XG4gICAgaWYgKChpICYgMSkgPT09IDApIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzICYgSUNVIGV4cHJlc3Npb25zKVxuICAgICAgY29uc3QgcGFydHMgPSBpMThuUGFyc2VUZXh0SW50b1BhcnRzQW5kSUNVKHZhbHVlKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgbGV0IHBhcnQgPSBwYXJ0c1tqXTtcbiAgICAgICAgaWYgKChqICYgMSkgPT09IDApIHtcbiAgICAgICAgICAvLyBgamAgaXMgb2RkIHRoZXJlZm9yZSBgcGFydGAgaXMgc3RyaW5nXG4gICAgICAgICAgY29uc3QgdGV4dCA9IHBhcnQgYXMgc3RyaW5nO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRTdHJpbmcodGV4dCwgJ1BhcnNlZCBJQ1UgcGFydCBzaG91bGQgYmUgc3RyaW5nJyk7XG4gICAgICAgICAgaWYgKHRleHQgIT09ICcnKSB7XG4gICAgICAgICAgICBpMThuU3RhcnRGaXJzdENyZWF0ZVBhc3NQcm9jZXNzVGV4dE5vZGUoXG4gICAgICAgICAgICAgIGFzdFN0YWNrWzBdLFxuICAgICAgICAgICAgICB0VmlldyxcbiAgICAgICAgICAgICAgcm9vdFROb2RlLFxuICAgICAgICAgICAgICBleGlzdGluZ1ROb2RlU3RhY2tbMF0sXG4gICAgICAgICAgICAgIGNyZWF0ZU9wQ29kZXMsXG4gICAgICAgICAgICAgIHVwZGF0ZU9wQ29kZXMsXG4gICAgICAgICAgICAgIGxWaWV3LFxuICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYGpgIGlzIEV2ZW4gdGhlcmVmb3IgYHBhcnRgIGlzIGFuIGBJQ1VFeHByZXNzaW9uYFxuICAgICAgICAgIGNvbnN0IGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24gPSBwYXJ0IGFzIEljdUV4cHJlc3Npb247XG4gICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgSUNVIGV4cHJlc3Npb24gaGFzIHRoZSByaWdodCBzaGFwZS4gVHJhbnNsYXRpb25zIG1pZ2h0IGNvbnRhaW4gaW52YWxpZFxuICAgICAgICAgIC8vIGNvbnN0cnVjdGlvbnMgKHdoaWxlIG9yaWdpbmFsIG1lc3NhZ2VzIHdlcmUgY29ycmVjdCksIHNvIElDVSBwYXJzaW5nIGF0IHJ1bnRpbWUgbWF5XG4gICAgICAgICAgLy8gbm90IHN1Y2NlZWQgKHRodXMgYGljdUV4cHJlc3Npb25gIHJlbWFpbnMgYSBzdHJpbmcpLlxuICAgICAgICAgIC8vIE5vdGU6IHdlIGludGVudGlvbmFsbHkgcmV0YWluIHRoZSBlcnJvciBoZXJlIGJ5IG5vdCB1c2luZyBgbmdEZXZNb2RlYCwgYmVjYXVzZVxuICAgICAgICAgIC8vIHRoZSB2YWx1ZSBjYW4gY2hhbmdlIGJhc2VkIG9uIHRoZSBsb2NhbGUgYW5kIHVzZXJzIGFyZW4ndCBndWFyYW50ZWVkIHRvIGhpdFxuICAgICAgICAgIC8vIGFuIGludmFsaWQgc3RyaW5nIHdoaWxlIHRoZXkncmUgZGV2ZWxvcGluZy5cbiAgICAgICAgICBpZiAodHlwZW9mIGljdUV4cHJlc3Npb24gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBwYXJzZSBJQ1UgZXhwcmVzc2lvbiBpbiBcIiR7bWVzc2FnZX1cIiBtZXNzYWdlLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBpY3VDb250YWluZXJUTm9kZSA9IGNyZWF0ZVROb2RlQW5kQWRkT3BDb2RlKFxuICAgICAgICAgICAgdFZpZXcsXG4gICAgICAgICAgICByb290VE5vZGUsXG4gICAgICAgICAgICBleGlzdGluZ1ROb2RlU3RhY2tbMF0sXG4gICAgICAgICAgICBsVmlldyxcbiAgICAgICAgICAgIGNyZWF0ZU9wQ29kZXMsXG4gICAgICAgICAgICBuZ0Rldk1vZGUgPyBgSUNVICR7aW5kZXh9OiR7aWN1RXhwcmVzc2lvbi5tYWluQmluZGluZ31gIDogJycsXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29uc3QgaWN1Tm9kZUluZGV4ID0gaWN1Q29udGFpbmVyVE5vZGUuaW5kZXg7XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCxcbiAgICAgICAgICAgICAgSEVBREVSX09GRlNFVCxcbiAgICAgICAgICAgICAgJ0luZGV4IG11c3QgYmUgaW4gYWJzb2x1dGUgTFZpZXcgb2Zmc2V0JyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgaWN1U3RhcnQoXG4gICAgICAgICAgICBhc3RTdGFja1swXSxcbiAgICAgICAgICAgIHRWaWV3LFxuICAgICAgICAgICAgbFZpZXcsXG4gICAgICAgICAgICB1cGRhdGVPcENvZGVzLFxuICAgICAgICAgICAgcGFyZW50VE5vZGVJbmRleCxcbiAgICAgICAgICAgIGljdUV4cHJlc3Npb24sXG4gICAgICAgICAgICBpY3VOb2RlSW5kZXgsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzIChlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcylcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQgdmFsdWUgaXMgc29tZXRoaW5nIGxpa2U6ICcvIzE6MicgKG9yaWdpbmFsbHkgY29taW5nIGZyb20gJ++/vS8jMToy77+9JylcbiAgICAgIGNvbnN0IGlzQ2xvc2luZyA9IHZhbHVlLmNoYXJDb2RlQXQoMCkgPT09IENoYXJDb2RlLlNMQVNIO1xuICAgICAgY29uc3QgdHlwZSA9IHZhbHVlLmNoYXJDb2RlQXQoaXNDbG9zaW5nID8gMSA6IDApO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE9uZU9mKHR5cGUsIENoYXJDb2RlLlNUQVIsIENoYXJDb2RlLkhBU0gpO1xuICAgICAgY29uc3QgaW5kZXggPSBIRUFERVJfT0ZGU0VUICsgTnVtYmVyLnBhcnNlSW50KHZhbHVlLnN1YnN0cmluZyhpc0Nsb3NpbmcgPyAyIDogMSkpO1xuICAgICAgaWYgKGlzQ2xvc2luZykge1xuICAgICAgICBleGlzdGluZ1ROb2RlU3RhY2suc2hpZnQoKTtcbiAgICAgICAgYXN0U3RhY2suc2hpZnQoKTtcbiAgICAgICAgc2V0Q3VycmVudFROb2RlKGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpISwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSBjcmVhdGVUTm9kZVBsYWNlaG9sZGVyKHRWaWV3LCBleGlzdGluZ1ROb2RlU3RhY2tbMF0sIGluZGV4KTtcbiAgICAgICAgZXhpc3RpbmdUTm9kZVN0YWNrLnVuc2hpZnQoW10pO1xuICAgICAgICBzZXRDdXJyZW50VE5vZGUodE5vZGUsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyTm9kZTogSTE4blBsYWNlaG9sZGVyTm9kZSA9IHtcbiAgICAgICAgICBraW5kOiBJMThuTm9kZUtpbmQuUExBQ0VIT0xERVIsXG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgIHR5cGU6XG4gICAgICAgICAgICB0eXBlID09PSBDaGFyQ29kZS5IQVNIID8gSTE4blBsYWNlaG9sZGVyVHlwZS5FTEVNRU5UIDogSTE4blBsYWNlaG9sZGVyVHlwZS5TVUJURU1QTEFURSxcbiAgICAgICAgfTtcbiAgICAgICAgYXN0U3RhY2tbMF0ucHVzaChwbGFjZWhvbGRlck5vZGUpO1xuICAgICAgICBhc3RTdGFjay51bnNoaWZ0KHBsYWNlaG9sZGVyTm9kZS5jaGlsZHJlbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdFZpZXcuZGF0YVtpbmRleF0gPSA8VEkxOG4+e1xuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgYXN0OiBhc3RTdGFja1swXSxcbiAgICBwYXJlbnRUTm9kZUluZGV4LFxuICB9O1xufVxuXG4vKipcbiAqIEFsbG9jYXRlIHNwYWNlIGluIGkxOG4gUmFuZ2UgYWRkIGNyZWF0ZSBPcENvZGUgaW5zdHJ1Y3Rpb24gdG8gY3JlYXRlIGEgdGV4dCBvciBjb21tZW50IG5vZGUuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YCBuZWVkZWQgdG8gYWxsb2NhdGUgc3BhY2UgaW4gaTE4biByYW5nZS5cbiAqIEBwYXJhbSByb290VE5vZGUgUm9vdCBgVE5vZGVgIG9mIHRoZSBpMThuIGJsb2NrLiBUaGlzIG5vZGUgZGV0ZXJtaW5lcyBpZiB0aGUgbmV3IFROb2RlIHdpbGwgYmVcbiAqICAgICBhZGRlZCBhcyBwYXJ0IG9mIHRoZSBgaTE4blN0YXJ0YCBpbnN0cnVjdGlvbiBvciBhcyBwYXJ0IG9mIHRoZSBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgLlxuICogQHBhcmFtIGV4aXN0aW5nVE5vZGVzIGludGVybmFsIHN0YXRlIGZvciBgYWRkVE5vZGVBbmRVcGRhdGVJbnNlcnRCZWZvcmVJbmRleGAuXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgIG5lZWRlZCB0byBhbGxvY2F0ZSBzcGFjZSBpbiBpMThuIHJhbmdlLlxuICogQHBhcmFtIGNyZWF0ZU9wQ29kZXMgQXJyYXkgc3RvcmluZyBgSTE4bkNyZWF0ZU9wQ29kZXNgIHdoZXJlIG5ldyBvcENvZGVzIHdpbGwgYmUgYWRkZWQuXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIGJlIGFkZGVkIHdoZW4gdGhlIGBUZXh0YCBvciBgQ29tbWVudGAgbm9kZSB3aWxsIGJlIGNyZWF0ZWQuXG4gKiBAcGFyYW0gaXNJQ1UgdHJ1ZSBpZiBhIGBDb21tZW50YCBub2RlIGZvciBJQ1UgKGluc3RlYWQgb2YgYFRleHRgKSBub2RlIHNob3VsZCBiZSBjcmVhdGVkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVUTm9kZUFuZEFkZE9wQ29kZShcbiAgdFZpZXc6IFRWaWV3LFxuICByb290VE5vZGU6IFROb2RlIHwgbnVsbCxcbiAgZXhpc3RpbmdUTm9kZXM6IFROb2RlW10sXG4gIGxWaWV3OiBMVmlldyxcbiAgY3JlYXRlT3BDb2RlczogSTE4bkNyZWF0ZU9wQ29kZXMsXG4gIHRleHQ6IHN0cmluZyB8IG51bGwsXG4gIGlzSUNVOiBib29sZWFuLFxuKTogVE5vZGUge1xuICBjb25zdCBpMThuTm9kZUlkeCA9IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIDEsIG51bGwpO1xuICBsZXQgb3BDb2RlID0gaTE4bk5vZGVJZHggPDwgSTE4bkNyZWF0ZU9wQ29kZS5TSElGVDtcbiAgbGV0IHBhcmVudFROb2RlID0gZ2V0Q3VycmVudFBhcmVudFROb2RlKCk7XG5cbiAgaWYgKHJvb3RUTm9kZSA9PT0gcGFyZW50VE5vZGUpIHtcbiAgICAvLyBGSVhNRShtaXNrbyk6IEEgbnVsbCBgcGFyZW50VE5vZGVgIHNob3VsZCByZXByZXNlbnQgd2hlbiB3ZSBmYWxsIG9mIHRoZSBgTFZpZXdgIGJvdW5kYXJ5LlxuICAgIC8vICh0aGVyZSBpcyBubyBwYXJlbnQpLCBidXQgaW4gc29tZSBjaXJjdW1zdGFuY2VzIChiZWNhdXNlIHdlIGFyZSBpbmNvbnNpc3RlbnQgYWJvdXQgaG93IHdlIHNldFxuICAgIC8vIGBwcmV2aW91c09yUGFyZW50VE5vZGVgKSBpdCBjb3VsZCBwb2ludCB0byBgcm9vdFROb2RlYCBTbyB0aGlzIGlzIGEgd29yayBhcm91bmQuXG4gICAgcGFyZW50VE5vZGUgPSBudWxsO1xuICB9XG4gIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSBwYXJlbnQgdGhhdCBtZWFucyB0aGF0IHdlIGNhbiBlYWdlcmx5IGFkZCBub2Rlcy5cbiAgICAvLyBJZiB3ZSBoYXZlIGEgcGFyZW50IHRoYW4gdGhlc2Ugbm9kZXMgY2FuJ3QgYmUgYWRkZWQgbm93IChhcyB0aGUgcGFyZW50IGhhcyBub3QgYmVlbiBjcmVhdGVkXG4gICAgLy8geWV0KSBhbmQgaW5zdGVhZCB0aGUgYHBhcmVudFROb2RlYCBpcyByZXNwb25zaWJsZSBmb3IgYWRkaW5nIGl0LiBTZWVcbiAgICAvLyBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgXG4gICAgb3BDb2RlIHw9IEkxOG5DcmVhdGVPcENvZGUuQVBQRU5EX0VBR0VSTFk7XG4gIH1cbiAgaWYgKGlzSUNVKSB7XG4gICAgb3BDb2RlIHw9IEkxOG5DcmVhdGVPcENvZGUuQ09NTUVOVDtcbiAgICBlbnN1cmVJY3VDb250YWluZXJWaXNpdG9yTG9hZGVkKGxvYWRJY3VDb250YWluZXJWaXNpdG9yKTtcbiAgfVxuICBjcmVhdGVPcENvZGVzLnB1c2gob3BDb2RlLCB0ZXh0ID09PSBudWxsID8gJycgOiB0ZXh0KTtcbiAgLy8gV2Ugc3RvcmUgYHt7P319YCBzbyB0aGF0IHdoZW4gbG9va2luZyBhdCBkZWJ1ZyBgVE5vZGVUeXBlLnRlbXBsYXRlYCB3ZSBjYW4gc2VlIHdoZXJlIHRoZVxuICAvLyBiaW5kaW5ncyBhcmUuXG4gIGNvbnN0IHROb2RlID0gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3LFxuICAgIGkxOG5Ob2RlSWR4LFxuICAgIGlzSUNVID8gVE5vZGVUeXBlLkljdSA6IFROb2RlVHlwZS5UZXh0LFxuICAgIHRleHQgPT09IG51bGwgPyAobmdEZXZNb2RlID8gJ3t7P319JyA6ICcnKSA6IHRleHQsXG4gICAgbnVsbCxcbiAgKTtcbiAgYWRkVE5vZGVBbmRVcGRhdGVJbnNlcnRCZWZvcmVJbmRleChleGlzdGluZ1ROb2RlcywgdE5vZGUpO1xuICBjb25zdCB0Tm9kZUlkeCA9IHROb2RlLmluZGV4O1xuICBzZXRDdXJyZW50VE5vZGUodE5vZGUsIGZhbHNlIC8qIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZyAqLyk7XG4gIGlmIChwYXJlbnRUTm9kZSAhPT0gbnVsbCAmJiByb290VE5vZGUgIT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gV2UgYXJlIGEgY2hpbGQgb2YgZGVlcGVyIG5vZGUgKHJhdGhlciB0aGFuIGEgZGlyZWN0IGNoaWxkIG9mIGBpMThuU3RhcnRgIGluc3RydWN0aW9uLilcbiAgICAvLyBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0byBhZGQgb3Vyc2VsdmVzIHRvIHRoZSBwYXJlbnQuXG4gICAgc2V0VE5vZGVJbnNlcnRCZWZvcmVJbmRleChwYXJlbnRUTm9kZSwgdE5vZGVJZHgpO1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgdGV4dCBub2RlIGluIGkxOG4gYmxvY2suXG4gKlxuICogVGV4dCBub2RlcyBjYW4gaGF2ZTpcbiAqIC0gQ3JlYXRlIGluc3RydWN0aW9uIGluIGBjcmVhdGVPcENvZGVzYCBmb3IgY3JlYXRpbmcgdGhlIHRleHQgbm9kZS5cbiAqIC0gQWxsb2NhdGUgc3BlYyBmb3IgdGV4dCBub2RlIGluIGkxOG4gcmFuZ2Ugb2YgYExWaWV3YFxuICogLSBJZiBjb250YWlucyBiaW5kaW5nOlxuICogICAgLSBiaW5kaW5ncyA9PiBhbGxvY2F0ZSBzcGFjZSBpbiBpMThuIHJhbmdlIG9mIGBMVmlld2AgdG8gc3RvcmUgdGhlIGJpbmRpbmcgdmFsdWUuXG4gKiAgICAtIHBvcHVsYXRlIGB1cGRhdGVPcENvZGVzYCB3aXRoIHVwZGF0ZSBpbnN0cnVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIHJvb3RUTm9kZSBSb290IGBUTm9kZWAgb2YgdGhlIGkxOG4gYmxvY2suIFRoaXMgbm9kZSBkZXRlcm1pbmVzIGlmIHRoZSBuZXcgVE5vZGUgd2lsbFxuICogICAgIGJlIGFkZGVkIGFzIHBhcnQgb2YgdGhlIGBpMThuU3RhcnRgIGluc3RydWN0aW9uIG9yIGFzIHBhcnQgb2YgdGhlXG4gKiAgICAgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YC5cbiAqIEBwYXJhbSBleGlzdGluZ1ROb2RlcyBpbnRlcm5hbCBzdGF0ZSBmb3IgYGFkZFROb2RlQW5kVXBkYXRlSW5zZXJ0QmVmb3JlSW5kZXhgLlxuICogQHBhcmFtIGNyZWF0ZU9wQ29kZXMgTG9jYXRpb24gd2hlcmUgdGhlIGNyZWF0aW9uIE9wQ29kZXMgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gdGV4dCBUaGUgdHJhbnNsYXRlZCB0ZXh0ICh3aGljaCBtYXkgY29udGFpbiBiaW5kaW5nKVxuICovXG5mdW5jdGlvbiBpMThuU3RhcnRGaXJzdENyZWF0ZVBhc3NQcm9jZXNzVGV4dE5vZGUoXG4gIGFzdDogSTE4bk5vZGVbXSxcbiAgdFZpZXc6IFRWaWV3LFxuICByb290VE5vZGU6IFROb2RlIHwgbnVsbCxcbiAgZXhpc3RpbmdUTm9kZXM6IFROb2RlW10sXG4gIGNyZWF0ZU9wQ29kZXM6IEkxOG5DcmVhdGVPcENvZGVzLFxuICB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyxcbiAgbFZpZXc6IExWaWV3LFxuICB0ZXh0OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgaGFzQmluZGluZyA9IHRleHQubWF0Y2goQklORElOR19SRUdFWFApO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZVROb2RlQW5kQWRkT3BDb2RlKFxuICAgIHRWaWV3LFxuICAgIHJvb3RUTm9kZSxcbiAgICBleGlzdGluZ1ROb2RlcyxcbiAgICBsVmlldyxcbiAgICBjcmVhdGVPcENvZGVzLFxuICAgIGhhc0JpbmRpbmcgPyBudWxsIDogdGV4dCxcbiAgICBmYWxzZSxcbiAgKTtcbiAgY29uc3QgaW5kZXggPSB0Tm9kZS5pbmRleDtcbiAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHVwZGF0ZU9wQ29kZXMsIHRleHQsIGluZGV4LCBudWxsLCAwLCBudWxsKTtcbiAgfVxuICBhc3QucHVzaCh7a2luZDogSTE4bk5vZGVLaW5kLlRFWFQsIGluZGV4fSk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuQXR0cmlidXRlc2AgYWJvdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pIHtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50ID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnRJbmRleCA9IHByZXZpb3VzRWxlbWVudC5pbmRleDtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXSBhcyBhbnk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcih1cGRhdGVPcENvZGVzLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXhdID09PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWVzW2ldO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG5cbiAgICAgIGlmIChtZXNzYWdlICE9PSAnJykge1xuICAgICAgICAvLyBDaGVjayBpZiBhdHRyaWJ1dGUgdmFsdWUgY29udGFpbnMgYW4gSUNVIGFuZCB0aHJvdyBhbiBlcnJvciBpZiB0aGF0J3MgdGhlIGNhc2UuXG4gICAgICAgIC8vIElDVXMgaW4gZWxlbWVudCBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkLlxuICAgICAgICAvLyBOb3RlOiB3ZSBpbnRlbnRpb25hbGx5IHJldGFpbiB0aGUgZXJyb3IgaGVyZSBieSBub3QgdXNpbmcgYG5nRGV2TW9kZWAsIGJlY2F1c2VcbiAgICAgICAgLy8gdGhlIGB2YWx1ZWAgY2FuIGNoYW5nZSBiYXNlZCBvbiB0aGUgbG9jYWxlIGFuZCB1c2VycyBhcmVuJ3QgZ3VhcmFudGVlZCB0byBoaXRcbiAgICAgICAgLy8gYW4gaW52YWxpZCBzdHJpbmcgd2hpbGUgdGhleSdyZSBkZXZlbG9waW5nLlxuICAgICAgICBpZiAoSUNVX1JFR0VYUC50ZXN0KG1lc3NhZ2UpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYElDVSBleHByZXNzaW9ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBhdHRyaWJ1dGVzLiBNZXNzYWdlOiBcIiR7bWVzc2FnZX1cIi5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpMThuIGF0dHJpYnV0ZXMgdGhhdCBoaXQgdGhpcyBjb2RlIHBhdGggYXJlIGd1YXJhbnRlZWQgdG8gaGF2ZSBiaW5kaW5ncywgYmVjYXVzZVxuICAgICAgICAvLyB0aGUgY29tcGlsZXIgdHJlYXRzIHN0YXRpYyBpMThuIGF0dHJpYnV0ZXMgYXMgcmVndWxhciBhdHRyaWJ1dGUgYmluZGluZ3MuXG4gICAgICAgIC8vIFNpbmNlIHRoaXMgbWF5IG5vdCBiZSB0aGUgZmlyc3QgaTE4biBhdHRyaWJ1dGUgb24gdGhpcyBlbGVtZW50IHdlIG5lZWQgdG8gcGFzcyBpbiBob3dcbiAgICAgICAgLy8gbWFueSBwcmV2aW91cyBiaW5kaW5ncyB0aGVyZSBoYXZlIGFscmVhZHkgYmVlbi5cbiAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICB1cGRhdGVPcENvZGVzLFxuICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgcHJldmlvdXNFbGVtZW50SW5kZXgsXG4gICAgICAgICAgYXR0ck5hbWUsXG4gICAgICAgICAgY291bnRCaW5kaW5ncyh1cGRhdGVPcENvZGVzKSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICB0Vmlldy5kYXRhW2luZGV4XSA9IHVwZGF0ZU9wQ29kZXM7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyB0byB1cGRhdGUgdGhlIGJpbmRpbmdzIG9mIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB1cGRhdGVPcENvZGVzIFBsYWNlIHdoZXJlIHRoZSB1cGRhdGUgb3Bjb2RlcyB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBiaW5kaW5ncy5cbiAqIEBwYXJhbSBkZXN0aW5hdGlvbk5vZGUgSW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIG5vZGUgd2hpY2ggd2lsbCByZWNlaXZlIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGF0dHJOYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSwgaWYgdGhlIHN0cmluZyBiZWxvbmdzIHRvIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZUZuIFNhbml0aXphdGlvbiBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSBzdHJpbmcgYWZ0ZXIgdXBkYXRlLCBpZiBuZWNlc3NhcnkuXG4gKiBAcGFyYW0gYmluZGluZ1N0YXJ0IFRoZSBsVmlldyBpbmRleCBvZiB0aGUgbmV4dCBleHByZXNzaW9uIHRoYXQgY2FuIGJlIGJvdW5kIHZpYSBhbiBvcENvZGUuXG4gKiBAcmV0dXJucyBUaGUgbWFzayB2YWx1ZSBmb3IgdGhlc2UgYmluZGluZ3NcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsXG4gIHN0cjogc3RyaW5nLFxuICBkZXN0aW5hdGlvbk5vZGU6IG51bWJlcixcbiAgYXR0ck5hbWU6IHN0cmluZyB8IG51bGwsXG4gIGJpbmRpbmdTdGFydDogbnVtYmVyLFxuICBzYW5pdGl6ZUZuOiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4pOiBudW1iZXIge1xuICBuZ0Rldk1vZGUgJiZcbiAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICBkZXN0aW5hdGlvbk5vZGUsXG4gICAgICBIRUFERVJfT0ZGU0VULFxuICAgICAgJ0luZGV4IG11c3QgYmUgaW4gYWJzb2x1dGUgTFZpZXcgb2Zmc2V0JyxcbiAgICApO1xuICBjb25zdCBtYXNrSW5kZXggPSB1cGRhdGVPcENvZGVzLmxlbmd0aDsgLy8gTG9jYXRpb24gb2YgbWFza1xuICBjb25zdCBzaXplSW5kZXggPSBtYXNrSW5kZXggKyAxOyAvLyBsb2NhdGlvbiBvZiBzaXplIGZvciBza2lwcGluZ1xuICB1cGRhdGVPcENvZGVzLnB1c2gobnVsbCwgbnVsbCk7IC8vIEFsbG9jIHNwYWNlIGZvciBtYXNrIGFuZCBzaXplXG4gIGNvbnN0IHN0YXJ0SW5kZXggPSBtYXNrSW5kZXggKyAyOyAvLyBsb2NhdGlvbiBvZiBmaXJzdCBhbGxvY2F0aW9uLlxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIodXBkYXRlT3BDb2RlcywgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gIH1cbiAgY29uc3QgdGV4dFBhcnRzID0gc3RyLnNwbGl0KEJJTkRJTkdfUkVHRVhQKTtcbiAgbGV0IG1hc2sgPSAwO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgdGV4dFBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgY29uc3QgdGV4dFZhbHVlID0gdGV4dFBhcnRzW2pdO1xuXG4gICAgaWYgKGogJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGJpbmRpbmdTdGFydCArIHBhcnNlSW50KHRleHRWYWx1ZSwgMTApO1xuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKC0xIC0gYmluZGluZ0luZGV4KTtcbiAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIGlmICh0ZXh0VmFsdWUgIT09ICcnKSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHRcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCh0ZXh0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAoZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGKSB8XG4gICAgICAoYXR0ck5hbWUgPyBJMThuVXBkYXRlT3BDb2RlLkF0dHIgOiBJMThuVXBkYXRlT3BDb2RlLlRleHQpLFxuICApO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbbWFza0luZGV4XSA9IG1hc2s7XG4gIHVwZGF0ZU9wQ29kZXNbc2l6ZUluZGV4XSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gc3RhcnRJbmRleDtcbiAgcmV0dXJuIG1hc2s7XG59XG5cbi8qKlxuICogQ291bnQgdGhlIG51bWJlciBvZiBiaW5kaW5ncyBpbiB0aGUgZ2l2ZW4gYG9wQ29kZXNgLlxuICpcbiAqIEl0IGNvdWxkIGJlIHBvc3NpYmxlIHRvIHNwZWVkIHRoaXMgdXAsIGJ5IHBhc3NpbmcgdGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3VuZCBiYWNrIGZyb21cbiAqIGBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKClgIHRvIGBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcygpYCBidXQgdGhpcyB3b3VsZCB0aGVuIHJlcXVpcmUgbW9yZVxuICogY29tcGxleGl0eSBpbiB0aGUgY29kZSBhbmQvb3IgdHJhbnNpZW50IG9iamVjdHMgdG8gYmUgY3JlYXRlZC5cbiAqXG4gKiBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIG9ubHkgY2FsbGVkIG9uY2Ugd2hlbiB0aGUgdGVtcGxhdGUgaXMgaW5zdGFudGlhdGVkLCBpcyB0cml2aWFsIGluIHRoZVxuICogZmlyc3QgaW5zdGFuY2UgKHNpbmNlIGBvcENvZGVzYCB3aWxsIGJlIGFuIGVtcHR5IGFycmF5KSwgYW5kIGl0IGlzIG5vdCBjb21tb24gZm9yIGVsZW1lbnRzIHRvXG4gKiBjb250YWluIG11bHRpcGxlIGkxOG4gYm91bmQgYXR0cmlidXRlcywgaXQgc2VlbXMgbGlrZSB0aGlzIGlzIGEgcmVhc29uYWJsZSBjb21wcm9taXNlLlxuICovXG5mdW5jdGlvbiBjb3VudEJpbmRpbmdzKG9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gb3BDb2Rlc1tpXTtcbiAgICAvLyBCaW5kaW5ncyBhcmUgbmVnYXRpdmUgbnVtYmVycy5cbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicgJiYgb3BDb2RlIDwgMCkge1xuICAgICAgY291bnQrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufVxuXG4vKipcbiAqIENvbnZlcnQgYmluZGluZyBpbmRleCB0byBtYXNrIGJpdC5cbiAqXG4gKiBFYWNoIGluZGV4IHJlcHJlc2VudHMgYSBzaW5nbGUgYml0IG9uIHRoZSBiaXQtbWFzay4gQmVjYXVzZSBiaXQtbWFzayBvbmx5IGhhcyAzMiBiaXRzLCB3ZSBtYWtlXG4gKiB0aGUgMzJuZCBiaXQgc2hhcmUgYWxsIG1hc2tzIGZvciBhbGwgYmluZGluZ3MgaGlnaGVyIHRoYW4gMzIuIFNpbmNlIGl0IGlzIGV4dHJlbWVseSByYXJlIHRvXG4gKiBoYXZlIG1vcmUgdGhhbiAzMiBiaW5kaW5ncyB0aGlzIHdpbGwgYmUgaGl0IHZlcnkgcmFyZWx5LiBUaGUgZG93bnNpZGUgb2YgaGl0dGluZyB0aGlzIGNvcm5lclxuICogY2FzZSBpcyB0aGF0IHdlIHdpbGwgZXhlY3V0ZSBiaW5kaW5nIGNvZGUgbW9yZSBvZnRlbiB0aGFuIG5lY2Vzc2FyeS4gKHBlbmFsdHkgb2YgcGVyZm9ybWFuY2UpXG4gKi9cbmZ1bmN0aW9uIHRvTWFza0JpdChiaW5kaW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IE1hdGgubWluKGJpbmRpbmdJbmRleCwgMzEpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydEVxdWFsKFxuICAgICAgaW5UZW1wbGF0ZSxcbiAgICAgIGZhbHNlLFxuICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7bWVzc2FnZX1cImAsXG4gICAgKTtcblxuICByZXMgKz0gbWVzc2FnZS5zbGljZShpbmRleCk7XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSBwYXJ0IG9mIGEgbWVzc2FnZSBhbmQgcmVtb3ZlcyB0aGUgcmVzdC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBleHRyYWN0aW5nIGEgcGFydCBvZiB0aGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gQVxuICogdHJhbnNsYXRlZCBtZXNzYWdlIGNhbiBzcGFuIG11bHRpcGxlIHRlbXBsYXRlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGkxOG4+VHJhbnNsYXRlIDxzcGFuICpuZ0lmPm1lPC9zcGFuPiE8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGNyb3BcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IG9mIHRoZSBzdWItdGVtcGxhdGUgdG8gZXh0cmFjdC4gSWYgdW5kZWZpbmVkIGl0IHJldHVybnMgdGhlXG4gKiBleHRlcm5hbCB0ZW1wbGF0ZSBhbmQgcmVtb3ZlcyBhbGwgc3ViLXRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGlzUm9vdFRlbXBsYXRlTWVzc2FnZShzdWJUZW1wbGF0ZUluZGV4KSkge1xuICAgIC8vIFdlIHdhbnQgdGhlIHJvb3QgdGVtcGxhdGUgbWVzc2FnZSwgaWdub3JlIGFsbCBzdWItdGVtcGxhdGVzXG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSB3YW50IGEgc3BlY2lmaWMgc3ViLXRlbXBsYXRlXG4gICAgY29uc3Qgc3RhcnQgPVxuICAgICAgbWVzc2FnZS5pbmRleE9mKGA6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApICsgMiArIHN1YlRlbXBsYXRlSW5kZXgudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgY29uc3QgZW5kID0gbWVzc2FnZS5zZWFyY2gobmV3IFJlZ0V4cChgJHtNQVJLRVJ9XFxcXC9cXFxcKlxcXFxkKzoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkpO1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgZm9yIElDVSBleHByZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGluZGV4IEluZGV4IHdoZXJlIHRoZSBhbmNob3IgaXMgc3RvcmVkIGFuZCBhbiBvcHRpb25hbCBgVEljdUNvbnRhaW5lck5vZGVgXG4gKiAgIC0gYGxWaWV3W2FuY2hvcklkeF1gIHBvaW50cyB0byBhIGBDb21tZW50YCBub2RlIHJlcHJlc2VudGluZyB0aGUgYW5jaG9yIGZvciB0aGUgSUNVLlxuICogICAtIGB0Vmlldy5kYXRhW2FuY2hvcklkeF1gIHBvaW50cyB0byB0aGUgYFRJY3VDb250YWluZXJOb2RlYCBpZiBJQ1UgaXMgcm9vdCAoYG51bGxgIG90aGVyd2lzZSlcbiAqL1xuZnVuY3Rpb24gaWN1U3RhcnQoXG4gIGFzdDogSTE4bk5vZGVbXSxcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLFxuICBwYXJlbnRJZHg6IG51bWJlcixcbiAgaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbixcbiAgYW5jaG9ySWR4OiBudW1iZXIsXG4pIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaWN1RXhwcmVzc2lvbiwgJ0lDVSBleHByZXNzaW9uIG11c3QgYmUgZGVmaW5lZCcpO1xuICBsZXQgYmluZGluZ01hc2sgPSAwO1xuICBjb25zdCB0SWN1OiBUSWN1ID0ge1xuICAgIHR5cGU6IGljdUV4cHJlc3Npb24udHlwZSxcbiAgICBjdXJyZW50Q2FzZUxWaWV3SW5kZXg6IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIDEsIG51bGwpLFxuICAgIGFuY2hvcklkeCxcbiAgICBjYXNlczogW10sXG4gICAgY3JlYXRlOiBbXSxcbiAgICByZW1vdmU6IFtdLFxuICAgIHVwZGF0ZTogW10sXG4gIH07XG4gIGFkZFVwZGF0ZUljdVN3aXRjaCh1cGRhdGVPcENvZGVzLCBpY3VFeHByZXNzaW9uLCBhbmNob3JJZHgpO1xuICBzZXRUSWN1KHRWaWV3LCBhbmNob3JJZHgsIHRJY3UpO1xuICBjb25zdCB2YWx1ZXMgPSBpY3VFeHByZXNzaW9uLnZhbHVlcztcbiAgY29uc3QgY2FzZXM6IEkxOG5Ob2RlW11bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIEVhY2ggdmFsdWUgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyAmIG90aGVyIElDVSBleHByZXNzaW9uc1xuICAgIGNvbnN0IHZhbHVlQXJyID0gdmFsdWVzW2ldO1xuICAgIGNvbnN0IG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBJdCBpcyBhbiBuZXN0ZWQgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgY29uc3QgaWN1SW5kZXggPSBuZXN0ZWRJY3VzLnB1c2godmFsdWUgYXMgSWN1RXhwcmVzc2lvbikgLSAxO1xuICAgICAgICAvLyBSZXBsYWNlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbiBieSBhIGNvbW1lbnQgbm9kZVxuICAgICAgICB2YWx1ZUFycltqXSA9IGA8IS0t77+9JHtpY3VJbmRleH3vv70tLT5gO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjYXNlQXN0OiBJMThuTm9kZVtdID0gW107XG4gICAgY2FzZXMucHVzaChjYXNlQXN0KTtcbiAgICBiaW5kaW5nTWFzayA9XG4gICAgICBwYXJzZUljdUNhc2UoXG4gICAgICAgIGNhc2VBc3QsXG4gICAgICAgIHRWaWV3LFxuICAgICAgICB0SWN1LFxuICAgICAgICBsVmlldyxcbiAgICAgICAgdXBkYXRlT3BDb2RlcyxcbiAgICAgICAgcGFyZW50SWR4LFxuICAgICAgICBpY3VFeHByZXNzaW9uLmNhc2VzW2ldLFxuICAgICAgICB2YWx1ZUFyci5qb2luKCcnKSxcbiAgICAgICAgbmVzdGVkSWN1cyxcbiAgICAgICkgfCBiaW5kaW5nTWFzaztcbiAgfVxuICBpZiAoYmluZGluZ01hc2spIHtcbiAgICBhZGRVcGRhdGVJY3VVcGRhdGUodXBkYXRlT3BDb2RlcywgYmluZGluZ01hc2ssIGFuY2hvcklkeCk7XG4gIH1cbiAgYXN0LnB1c2goe1xuICAgIGtpbmQ6IEkxOG5Ob2RlS2luZC5JQ1UsXG4gICAgaW5kZXg6IGFuY2hvcklkeCxcbiAgICBjYXNlcyxcbiAgICBjdXJyZW50Q2FzZUxWaWV3SW5kZXg6IHRJY3UuY3VycmVudENhc2VMVmlld0luZGV4LFxuICB9KTtcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW11bXSA9IFtdO1xuICBsZXQgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICBsZXQgbWFpbkJpbmRpbmcgPSAwO1xuICBwYXR0ZXJuID0gcGF0dGVybi5yZXBsYWNlKFxuICAgIElDVV9CTE9DS19SRUdFWFAsXG4gICAgZnVuY3Rpb24gKHN0cjogc3RyaW5nLCBiaW5kaW5nOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgICAgaWYgKHR5cGUgPT09ICdzZWxlY3QnKSB7XG4gICAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgICAgIH1cbiAgICAgIG1haW5CaW5kaW5nID0gcGFyc2VJbnQoYmluZGluZy5zbGljZSgxKSwgMTApO1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0sXG4gICk7XG5cbiAgY29uc3QgcGFydHMgPSBpMThuUGFyc2VUZXh0SW50b1BhcnRzQW5kSUNVKHBhdHRlcm4pIGFzIHN0cmluZ1tdO1xuICAvLyBMb29raW5nIGZvciAoa2V5IGJsb2NrKSsgc2VxdWVuY2UuIE9uZSBvZiB0aGUga2V5cyBoYXMgdG8gYmUgXCJvdGhlclwiLlxuICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBwYXJ0cy5sZW5ndGg7ICkge1xuICAgIGxldCBrZXkgPSBwYXJ0c1twb3MrK10udHJpbSgpO1xuICAgIGlmIChpY3VUeXBlID09PSBJY3VUeXBlLnBsdXJhbCkge1xuICAgICAgLy8gS2V5IGNhbiBiZSBcIj14XCIsIHdlIGp1c3Qgd2FudCBcInhcIlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccyooPzo9KT8oXFx3KylcXHMqLywgJyQxJyk7XG4gICAgfVxuICAgIGlmIChrZXkubGVuZ3RoKSB7XG4gICAgICBjYXNlcy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gaTE4blBhcnNlVGV4dEludG9QYXJ0c0FuZElDVShwYXJ0c1twb3MrK10pIGFzIHN0cmluZ1tdO1xuICAgIGlmIChjYXNlcy5sZW5ndGggPiB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZXMucHVzaChibG9ja3MpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlcywgc2VlICMyMTYxNVxuICByZXR1cm4ge3R5cGU6IGljdVR5cGUsIG1haW5CaW5kaW5nOiBtYWluQmluZGluZywgY2FzZXMsIHZhbHVlc307XG59XG5cbi8qKlxuICogQnJlYWtzIHBhdHRlcm4gaW50byBzdHJpbmdzIGFuZCB0b3AgbGV2ZWwgey4uLn0gYmxvY2tzLlxuICogQ2FuIGJlIHVzZWQgdG8gYnJlYWsgYSBtZXNzYWdlIGludG8gdGV4dCBhbmQgSUNVIGV4cHJlc3Npb25zLCBvciB0byBicmVhayBhbiBJQ1UgZXhwcmVzc2lvblxuICogaW50byBrZXlzIGFuZCBjYXNlcy4gT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gKHN1YilQYXR0ZXJuIHRvIGJlIGJyb2tlbi5cbiAqIEByZXR1cm5zIEFuIGBBcnJheTxzdHJpbmd8SWN1RXhwcmVzc2lvbj5gIHdoZXJlOlxuICogICAtIG9kZCBwb3NpdGlvbnM6IGBzdHJpbmdgID0+IHRleHQgYmV0d2VlbiBJQ1UgZXhwcmVzc2lvbnNcbiAqICAgLSBldmVuIHBvc2l0aW9uczogYElDVUV4cHJlc3Npb25gID0+IElDVSBleHByZXNzaW9uIHBhcnNlZCBpbnRvIGBJQ1VFeHByZXNzaW9uYCByZWNvcmQuXG4gKi9cbmZ1bmN0aW9uIGkxOG5QYXJzZVRleHRJbnRvUGFydHNBbmRJQ1UocGF0dGVybjogc3RyaW5nKTogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10ge1xuICBpZiAoIXBhdHRlcm4pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgcHJldlBvcyA9IDA7XG4gIGNvbnN0IGJyYWNlU3RhY2sgPSBbXTtcbiAgY29uc3QgcmVzdWx0czogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10gPSBbXTtcbiAgY29uc3QgYnJhY2VzID0gL1t7fV0vZztcbiAgLy8gbGFzdEluZGV4IGRvZXNuJ3QgZ2V0IHNldCB0byAwIHNvIHdlIGhhdmUgdG8uXG4gIGJyYWNlcy5sYXN0SW5kZXggPSAwO1xuXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKChtYXRjaCA9IGJyYWNlcy5leGVjKHBhdHRlcm4pKSkge1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmluZGV4O1xuICAgIGlmIChtYXRjaFswXSA9PSAnfScpIHtcbiAgICAgIGJyYWNlU3RhY2sucG9wKCk7XG5cbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIEVuZCBvZiB0aGUgYmxvY2suXG4gICAgICAgIGNvbnN0IGJsb2NrID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgaWYgKElDVV9CTE9DS19SRUdFWFAudGVzdChibG9jaykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocGFyc2VJQ1VCbG9jayhibG9jaykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChibG9jayk7XG4gICAgICAgIH1cblxuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgICAgYnJhY2VTdGFjay5wdXNoKCd7Jyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcyk7XG4gIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICovXG5mdW5jdGlvbiBwYXJzZUljdUNhc2UoXG4gIGFzdDogSTE4bk5vZGVbXSxcbiAgdFZpZXc6IFRWaWV3LFxuICB0SWN1OiBUSWN1LFxuICBsVmlldzogTFZpZXcsXG4gIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLFxuICBwYXJlbnRJZHg6IG51bWJlcixcbiAgY2FzZU5hbWU6IHN0cmluZyxcbiAgdW5zYWZlQ2FzZUh0bWw6IHN0cmluZyxcbiAgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdLFxuKTogbnVtYmVyIHtcbiAgY29uc3QgY3JlYXRlOiBJY3VDcmVhdGVPcENvZGVzID0gW10gYXMgYW55O1xuICBjb25zdCByZW1vdmU6IEkxOG5SZW1vdmVPcENvZGVzID0gW10gYXMgYW55O1xuICBjb25zdCB1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzID0gW10gYXMgYW55O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIoY3JlYXRlLCBpY3VDcmVhdGVPcENvZGVzVG9TdHJpbmcpO1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKHJlbW92ZSwgaTE4blJlbW92ZU9wQ29kZXNUb1N0cmluZyk7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIodXBkYXRlLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuICB0SWN1LmNhc2VzLnB1c2goY2FzZU5hbWUpO1xuICB0SWN1LmNyZWF0ZS5wdXNoKGNyZWF0ZSk7XG4gIHRJY3UucmVtb3ZlLnB1c2gocmVtb3ZlKTtcbiAgdEljdS51cGRhdGUucHVzaCh1cGRhdGUpO1xuXG4gIGNvbnN0IGluZXJ0Qm9keUhlbHBlciA9IGdldEluZXJ0Qm9keUhlbHBlcihnZXREb2N1bWVudCgpKTtcbiAgY29uc3QgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUNhc2VIdG1sKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaW5lcnRCb2R5RWxlbWVudCwgJ1VuYWJsZSB0byBnZW5lcmF0ZSBpbmVydCBib2R5IGVsZW1lbnQnKTtcbiAgY29uc3QgaW5lcnRSb290Tm9kZSA9IChnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCEpIGFzIEVsZW1lbnQpIHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gIGlmIChpbmVydFJvb3ROb2RlKSB7XG4gICAgcmV0dXJuIHdhbGtJY3VUcmVlKFxuICAgICAgYXN0LFxuICAgICAgdFZpZXcsXG4gICAgICB0SWN1LFxuICAgICAgbFZpZXcsXG4gICAgICB1cGRhdGVPcENvZGVzLFxuICAgICAgY3JlYXRlLFxuICAgICAgcmVtb3ZlLFxuICAgICAgdXBkYXRlLFxuICAgICAgaW5lcnRSb290Tm9kZSxcbiAgICAgIHBhcmVudElkeCxcbiAgICAgIG5lc3RlZEljdXMsXG4gICAgICAwLFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gd2Fsa0ljdVRyZWUoXG4gIGFzdDogSTE4bk5vZGVbXSxcbiAgdFZpZXc6IFRWaWV3LFxuICB0SWN1OiBUSWN1LFxuICBsVmlldzogTFZpZXcsXG4gIHNoYXJlZFVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLFxuICBjcmVhdGU6IEljdUNyZWF0ZU9wQ29kZXMsXG4gIHJlbW92ZTogSTE4blJlbW92ZU9wQ29kZXMsXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXMsXG4gIHBhcmVudE5vZGU6IEVsZW1lbnQsXG4gIHBhcmVudElkeDogbnVtYmVyLFxuICBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sXG4gIGRlcHRoOiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBsZXQgYmluZGluZ01hc2sgPSAwO1xuICBsZXQgY3VycmVudE5vZGUgPSBwYXJlbnROb2RlLmZpcnN0Q2hpbGQ7XG4gIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gYWxsb2NFeHBhbmRvKHRWaWV3LCBsVmlldywgMSwgbnVsbCk7XG4gICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGN1cnJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKFZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgYWRkQ3JlYXRlTm9kZUFuZEFwcGVuZChjcmVhdGUsIEVMRU1FTlRfTUFSS0VSLCB0YWdOYW1lLCBwYXJlbnRJZHgsIG5ld0luZGV4KTtcbiAgICAgICAgICB0Vmlldy5kYXRhW25ld0luZGV4XSA9IHRhZ05hbWU7XG4gICAgICAgICAgY29uc3QgZWxBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbEF0dHJzLml0ZW0oaSkhO1xuICAgICAgICAgICAgY29uc3QgbG93ZXJBdHRyTmFtZSA9IGF0dHIubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9ICEhYXR0ci52YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIGlucHV0IHN0cmluZyBpcyBzYWZlLCB1bmxlc3MgaXQncyB1c2luZyBhIGJpbmRpbmdcbiAgICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICAgIGlmIChWQUxJRF9BVFRSUy5oYXNPd25Qcm9wZXJ0eShsb3dlckF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIGF0dHIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgX3Nhbml0aXplVXJsLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh1cGRhdGUsIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIDAsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgYFdBUk5JTkc6IGlnbm9yaW5nIHVuc2FmZSBhdHRyaWJ1dGUgdmFsdWUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgYCR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAke3RhZ05hbWV9IGAgK1xuICAgICAgICAgICAgICAgICAgICAgIGAoc2VlICR7WFNTX1NFQ1VSSVRZX1VSTH0pYCxcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFkZENyZWF0ZUF0dHJpYnV0ZShjcmVhdGUsIG5ld0luZGV4LCBhdHRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZWxlbWVudE5vZGU6IEkxOG5FbGVtZW50Tm9kZSA9IHtcbiAgICAgICAgICAgIGtpbmQ6IEkxOG5Ob2RlS2luZC5FTEVNRU5ULFxuICAgICAgICAgICAgaW5kZXg6IG5ld0luZGV4LFxuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgIH07XG4gICAgICAgICAgYXN0LnB1c2goZWxlbWVudE5vZGUpO1xuICAgICAgICAgIC8vIFBhcnNlIHRoZSBjaGlsZHJlbiBvZiB0aGlzIG5vZGUgKGlmIGFueSlcbiAgICAgICAgICBiaW5kaW5nTWFzayA9XG4gICAgICAgICAgICB3YWxrSWN1VHJlZShcbiAgICAgICAgICAgICAgZWxlbWVudE5vZGUuY2hpbGRyZW4sXG4gICAgICAgICAgICAgIHRWaWV3LFxuICAgICAgICAgICAgICB0SWN1LFxuICAgICAgICAgICAgICBsVmlldyxcbiAgICAgICAgICAgICAgc2hhcmVkVXBkYXRlT3BDb2RlcyxcbiAgICAgICAgICAgICAgY3JlYXRlLFxuICAgICAgICAgICAgICByZW1vdmUsXG4gICAgICAgICAgICAgIHVwZGF0ZSxcbiAgICAgICAgICAgICAgY3VycmVudE5vZGUgYXMgRWxlbWVudCxcbiAgICAgICAgICAgICAgbmV3SW5kZXgsXG4gICAgICAgICAgICAgIG5lc3RlZEljdXMsXG4gICAgICAgICAgICAgIGRlcHRoICsgMSxcbiAgICAgICAgICAgICkgfCBiaW5kaW5nTWFzaztcbiAgICAgICAgICBhZGRSZW1vdmVOb2RlKHJlbW92ZSwgbmV3SW5kZXgsIGRlcHRoKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICAgIGNvbnN0IHZhbHVlID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgIGFkZENyZWF0ZU5vZGVBbmRBcHBlbmQoY3JlYXRlLCBudWxsLCBoYXNCaW5kaW5nID8gJycgOiB2YWx1ZSwgcGFyZW50SWR4LCBuZXdJbmRleCk7XG4gICAgICAgIGFkZFJlbW92ZU5vZGUocmVtb3ZlLCBuZXdJbmRleCwgZGVwdGgpO1xuICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgIGJpbmRpbmdNYXNrID1cbiAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModXBkYXRlLCB2YWx1ZSwgbmV3SW5kZXgsIG51bGwsIDAsIG51bGwpIHwgYmluZGluZ01hc2s7XG4gICAgICAgIH1cbiAgICAgICAgYXN0LnB1c2goe1xuICAgICAgICAgIGtpbmQ6IEkxOG5Ob2RlS2luZC5URVhULFxuICAgICAgICAgIGluZGV4OiBuZXdJbmRleCxcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvbW1lbnQgbm9kZSBpcyBhIHBsYWNlaG9sZGVyIGZvciBhIG5lc3RlZCBJQ1VcbiAgICAgICAgY29uc3QgaXNOZXN0ZWRJY3UgPSBORVNURURfSUNVLmV4ZWMoY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJycpO1xuICAgICAgICBpZiAoaXNOZXN0ZWRJY3UpIHtcbiAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VJbmRleCA9IHBhcnNlSW50KGlzTmVzdGVkSWN1WzFdLCAxMCk7XG4gICAgICAgICAgY29uc3QgaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiA9IG5lc3RlZEljdXNbbmVzdGVkSWN1SW5kZXhdO1xuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgYWRkQ3JlYXRlTm9kZUFuZEFwcGVuZChcbiAgICAgICAgICAgIGNyZWF0ZSxcbiAgICAgICAgICAgIElDVV9NQVJLRVIsXG4gICAgICAgICAgICBuZ0Rldk1vZGUgPyBgbmVzdGVkIElDVSAke25lc3RlZEljdUluZGV4fWAgOiAnJyxcbiAgICAgICAgICAgIHBhcmVudElkeCxcbiAgICAgICAgICAgIG5ld0luZGV4LFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWN1U3RhcnQoYXN0LCB0VmlldywgbFZpZXcsIHNoYXJlZFVwZGF0ZU9wQ29kZXMsIHBhcmVudElkeCwgaWN1RXhwcmVzc2lvbiwgbmV3SW5kZXgpO1xuICAgICAgICAgIGFkZFJlbW92ZU5lc3RlZEljdShyZW1vdmUsIG5ld0luZGV4LCBkZXB0aCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gIH1cbiAgcmV0dXJuIGJpbmRpbmdNYXNrO1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmVOb2RlKHJlbW92ZTogSTE4blJlbW92ZU9wQ29kZXMsIGluZGV4OiBudW1iZXIsIGRlcHRoOiBudW1iZXIpIHtcbiAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgcmVtb3ZlLnB1c2goaW5kZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZFJlbW92ZU5lc3RlZEljdShyZW1vdmU6IEkxOG5SZW1vdmVPcENvZGVzLCBpbmRleDogbnVtYmVyLCBkZXB0aDogbnVtYmVyKSB7XG4gIGlmIChkZXB0aCA9PT0gMCkge1xuICAgIHJlbW92ZS5wdXNoKH5pbmRleCk7IC8vIHJlbW92ZSBJQ1UgYXQgYGluZGV4YFxuICAgIHJlbW92ZS5wdXNoKGluZGV4KTsgLy8gcmVtb3ZlIElDVSBjb21tZW50IGF0IGBpbmRleGBcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRVcGRhdGVJY3VTd2l0Y2goXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXMsXG4gIGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sXG4gIGluZGV4OiBudW1iZXIsXG4pIHtcbiAgdXBkYXRlLnB1c2goXG4gICAgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpLFxuICAgIDIsXG4gICAgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgIChpbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRikgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCxcbiAgKTtcbn1cblxuZnVuY3Rpb24gYWRkVXBkYXRlSWN1VXBkYXRlKHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXMsIGJpbmRpbmdNYXNrOiBudW1iZXIsIGluZGV4OiBudW1iZXIpIHtcbiAgdXBkYXRlLnB1c2goYmluZGluZ01hc2ssIDEsIChpbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRikgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGFkZENyZWF0ZU5vZGVBbmRBcHBlbmQoXG4gIGNyZWF0ZTogSWN1Q3JlYXRlT3BDb2RlcyxcbiAgbWFya2VyOiBudWxsIHwgSUNVX01BUktFUiB8IEVMRU1FTlRfTUFSS0VSLFxuICB0ZXh0OiBzdHJpbmcsXG4gIGFwcGVuZFRvUGFyZW50SWR4OiBudW1iZXIsXG4gIGNyZWF0ZUF0SWR4OiBudW1iZXIsXG4pIHtcbiAgaWYgKG1hcmtlciAhPT0gbnVsbCkge1xuICAgIGNyZWF0ZS5wdXNoKG1hcmtlcik7XG4gIH1cbiAgY3JlYXRlLnB1c2goXG4gICAgdGV4dCxcbiAgICBjcmVhdGVBdElkeCxcbiAgICBpY3VDcmVhdGVPcENvZGUoSWN1Q3JlYXRlT3BDb2RlLkFwcGVuZENoaWxkLCBhcHBlbmRUb1BhcmVudElkeCwgY3JlYXRlQXRJZHgpLFxuICApO1xufVxuXG5mdW5jdGlvbiBhZGRDcmVhdGVBdHRyaWJ1dGUoY3JlYXRlOiBJY3VDcmVhdGVPcENvZGVzLCBuZXdJbmRleDogbnVtYmVyLCBhdHRyOiBBdHRyKSB7XG4gIGNyZWF0ZS5wdXNoKFxuICAgIChuZXdJbmRleCA8PCBJY3VDcmVhdGVPcENvZGUuU0hJRlRfUkVGKSB8IEljdUNyZWF0ZU9wQ29kZS5BdHRyLFxuICAgIGF0dHIubmFtZSxcbiAgICBhdHRyLnZhbHVlLFxuICApO1xufVxuIl19