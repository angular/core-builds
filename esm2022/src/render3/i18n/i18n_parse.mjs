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
import { getTemplateContent, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS } from '../../sanitization/html_sanitizer';
import { getInertBodyHelper } from '../../sanitization/inert_body';
import { _sanitizeUrl } from '../../sanitization/url_sanitizer';
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertOneOf, assertString } from '../../util/assert';
import { loadIcuContainerVisitor } from '../instructions/i18n_icu_container_visitor';
import { allocExpando, createTNodeAtIndex } from '../instructions/shared';
import { getDocument } from '../interfaces/document';
import { ELEMENT_MARKER, I18nCreateOpCode, ICU_MARKER } from '../interfaces/i18n';
import { HEADER_OFFSET } from '../interfaces/view';
import { getCurrentParentTNode, getCurrentTNode, setCurrentTNode } from '../state';
import { i18nCreateOpCodesToString, i18nRemoveOpCodesToString, i18nUpdateOpCodesToString, icuCreateOpCodesToString } from './i18n_debug';
import { addTNodeAndUpdateInsertBeforeIndex } from './i18n_insert_before_index';
import { ensureIcuContainerVisitorLoaded } from './i18n_tree_shaking';
import { createTNodePlaceholder, icuCreateOpCode, isRootTemplateMessage, setTIcu, setTNodeInsertBeforeIndex } from './i18n_util';
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
            const index = HEADER_OFFSET + Number.parseInt(value.substring((isClosing ? 2 : 1)));
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
                    type: type === 35 /* CharCode.HASH */ ? 0 /* I18nPlaceholderType.ELEMENT */ :
                        1 /* I18nPlaceholderType.SUBTEMPLATE */,
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
    updateOpCodes.push(destinationNode << 2 /* I18nUpdateOpCode.SHIFT_REF */ |
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
        update: []
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
        bindingMask = parseIcuCase(caseAst, tView, tIcu, lView, updateOpCodes, parentIdx, icuExpression.cases[i], valueArr.join(''), nestedIcus) |
            bindingMask;
    }
    if (bindingMask) {
        addUpdateIcuUpdate(updateOpCodes, bindingMask, anchorIdx);
    }
    ast.push({
        kind: 3 /* I18nNodeKind.ICU */,
        index: anchorIdx,
        cases,
        currentCaseLViewIndex: tIcu.currentCaseLViewIndex
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
                        walkIcuTree(elementNode.children, tView, tIcu, lView, sharedUpdateOpCodes, create, remove, update, currentNode, newIndex, nestedIcus, depth + 1) |
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
    update.push(toMaskBit(icuExpression.mainBinding), 2, -1 - icuExpression.mainBinding, index << 2 /* I18nUpdateOpCode.SHIFT_REF */ | 2 /* I18nUpdateOpCode.IcuSwitch */);
}
function addUpdateIcuUpdate(update, bindingMask, index) {
    update.push(bindingMask, 1, index << 2 /* I18nUpdateOpCode.SHIFT_REF */ | 3 /* I18nUpdateOpCode.IcuUpdate */);
}
function addCreateNodeAndAppend(create, marker, text, appendToParentIdx, createAtIdx) {
    if (marker !== null) {
        create.push(marker);
    }
    create.push(text, createAtIdx, icuCreateOpCode(0 /* IcuCreateOpCode.AppendChild */, appendToParentIdx, createAtIdx));
}
function addCreateAttribute(create, newIndex, attr) {
    create.push(newIndex << 1 /* IcuCreateOpCode.SHIFT_REF */ | 1 /* IcuCreateOpCode.Attr */, attr.name, attr.value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9wYXJzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi9pMThuX3BhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sd0JBQXdCLENBQUM7QUFDaEMsT0FBTyxpQ0FBaUMsQ0FBQztBQUV6QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWxILE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLDRDQUE0QyxDQUFDO0FBQ25GLE9BQU8sRUFBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN4RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBZ0ssVUFBVSxFQUF5RSxNQUFNLG9CQUFvQixDQUFDO0FBR3RULE9BQU8sRUFBQyxhQUFhLEVBQWUsTUFBTSxvQkFBb0IsQ0FBQztBQUMvRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVqRixPQUFPLEVBQUMseUJBQXlCLEVBQUUseUJBQXlCLEVBQUUseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxjQUFj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LENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUMzQixNQUF3QixFQUFFLE1BQXNDLEVBQUUsSUFBWSxFQUM5RSxpQkFBeUIsRUFBRSxXQUFtQjtJQUNoRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBSSxDQUNQLElBQUksRUFBRSxXQUFXLEVBQ2pCLGVBQWUsc0NBQThCLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDcEYsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsTUFBd0IsRUFBRSxRQUFnQixFQUFFLElBQVU7SUFDaEYsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLHFDQUE2QiwrQkFBdUIsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0ICcuLi8uLi91dGlsL25nX2kxOG5fY2xvc3VyZV9tb2RlJztcblxuaW1wb3J0IHtYU1NfU0VDVVJJVFlfVVJMfSBmcm9tICcuLi8uLi9lcnJvcl9kZXRhaWxzX2Jhc2VfdXJsJztcbmltcG9ydCB7Z2V0VGVtcGxhdGVDb250ZW50LCBVUklfQVRUUlMsIFZBTElEX0FUVFJTLCBWQUxJRF9FTEVNRU5UU30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybH0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3VybF9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLCBhc3NlcnRPbmVPZiwgYXNzZXJ0U3RyaW5nfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0NoYXJDb2RlfSBmcm9tICcuLi8uLi91dGlsL2NoYXJfY29kZSc7XG5pbXBvcnQge2xvYWRJY3VDb250YWluZXJWaXNpdG9yfSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvaTE4bl9pY3VfY29udGFpbmVyX3Zpc2l0b3InO1xuaW1wb3J0IHthbGxvY0V4cGFuZG8sIGNyZWF0ZVROb2RlQXRJbmRleH0gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL2RvY3VtZW50JztcbmltcG9ydCB7RUxFTUVOVF9NQVJLRVIsIEkxOG5DcmVhdGVPcENvZGUsIEkxOG5DcmVhdGVPcENvZGVzLCBJMThuRWxlbWVudE5vZGUsIEkxOG5Ob2RlLCBJMThuTm9kZUtpbmQsIEkxOG5QbGFjZWhvbGRlck5vZGUsIEkxOG5QbGFjZWhvbGRlclR5cGUsIEkxOG5SZW1vdmVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgSUNVX01BUktFUiwgSWN1Q3JlYXRlT3BDb2RlLCBJY3VDcmVhdGVPcENvZGVzLCBJY3VFeHByZXNzaW9uLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDdXJyZW50UGFyZW50VE5vZGUsIGdldEN1cnJlbnRUTm9kZSwgc2V0Q3VycmVudFROb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5cbmltcG9ydCB7aTE4bkNyZWF0ZU9wQ29kZXNUb1N0cmluZywgaTE4blJlbW92ZU9wQ29kZXNUb1N0cmluZywgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZywgaWN1Q3JlYXRlT3BDb2Rlc1RvU3RyaW5nfSBmcm9tICcuL2kxOG5fZGVidWcnO1xuaW1wb3J0IHthZGRUTm9kZUFuZFVwZGF0ZUluc2VydEJlZm9yZUluZGV4fSBmcm9tICcuL2kxOG5faW5zZXJ0X2JlZm9yZV9pbmRleCc7XG5pbXBvcnQge2Vuc3VyZUljdUNvbnRhaW5lclZpc2l0b3JMb2FkZWR9IGZyb20gJy4vaTE4bl90cmVlX3NoYWtpbmcnO1xuaW1wb3J0IHtjcmVhdGVUTm9kZVBsYWNlaG9sZGVyLCBpY3VDcmVhdGVPcENvZGUsIGlzUm9vdFRlbXBsYXRlTWVzc2FnZSwgc2V0VEljdSwgc2V0VE5vZGVJbnNlcnRCZWZvcmVJbmRleH0gZnJvbSAnLi9pMThuX3V0aWwnO1xuXG5cblxuY29uc3QgQklORElOR19SRUdFWFAgPSAv77+9KFxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgSUNVX1JFR0VYUCA9IC8oe1xccyrvv71cXGQrOj9cXGQq77+9XFxzKixcXHMqXFxTezZ9XFxzKixbXFxzXFxTXSp9KS9naTtcbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcbmNvbnN0IElDVV9CTE9DS19SRUdFWFAgPSAvXlxccyoo77+9XFxkKzo/XFxkKu+/vSlcXHMqLFxccyooc2VsZWN0fHBsdXJhbClcXHMqLC87XG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgU1VCVEVNUExBVEVfUkVHRVhQID0gL++/vVxcLz9cXCooXFxkKzpcXGQrKe+/vS9naTtcbmNvbnN0IFBIX1JFR0VYUCA9IC/vv70oXFwvP1sjKl1cXGQrKTo/XFxkKu+/vS9naTtcblxuLyoqXG4gKiBBbmd1bGFyIHVzZXMgdGhlIHNwZWNpYWwgZW50aXR5ICZuZ3NwOyBhcyBhIHBsYWNlaG9sZGVyIGZvciBub24tcmVtb3ZhYmxlIHNwYWNlLlxuICogSXQncyByZXBsYWNlZCBieSB0aGUgMHhFNTAwIFBVQSAoUHJpdmF0ZSBVc2UgQXJlYXMpIHVuaWNvZGUgY2hhcmFjdGVyIGFuZCBsYXRlciBvbiByZXBsYWNlZCBieSBhXG4gKiBzcGFjZS5cbiAqIFdlIGFyZSByZS1pbXBsZW1lbnRpbmcgdGhlIHNhbWUgaWRlYSBzaW5jZSB0cmFuc2xhdGlvbnMgbWlnaHQgY29udGFpbiB0aGlzIHNwZWNpYWwgY2hhcmFjdGVyLlxuICovXG5jb25zdCBOR1NQX1VOSUNPREVfUkVHRVhQID0gL1xcdUU1MDAvZztcbmZ1bmN0aW9uIHJlcGxhY2VOZ3NwKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZShOR1NQX1VOSUNPREVfUkVHRVhQLCAnICcpO1xufVxuXG4vKipcbiAqIFBhdGNoIGEgYGRlYnVnYCBwcm9wZXJ0eSBnZXR0ZXIgb24gdG9wIG9mIHRoZSBleGlzdGluZyBvYmplY3QuXG4gKlxuICogTk9URTogYWx3YXlzIGNhbGwgdGhpcyBtZXRob2Qgd2l0aCBgbmdEZXZNb2RlICYmIGF0dGFjaERlYnVnT2JqZWN0KC4uLilgXG4gKlxuICogQHBhcmFtIG9iaiBPYmplY3QgdG8gcGF0Y2hcbiAqIEBwYXJhbSBkZWJ1Z0dldHRlciBHZXR0ZXIgcmV0dXJuaW5nIGEgdmFsdWUgdG8gcGF0Y2hcbiAqL1xuZnVuY3Rpb24gYXR0YWNoRGVidWdHZXR0ZXI8VD4ob2JqOiBULCBkZWJ1Z0dldHRlcjogKHRoaXM6IFQpID0+IGFueSk6IHZvaWQge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgJ2RlYnVnJywge2dldDogZGVidWdHZXR0ZXIsIGVudW1lcmFibGU6IGZhbHNlfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGd1YXJkZWQgd2l0aCBgbmdEZXZNb2RlYCBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBpbiBwcm9kdWN0aW9uIScpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGR5bmFtaWMgbm9kZXMgZnJvbSBpMThuIHRyYW5zbGF0aW9uIGJsb2NrLlxuICpcbiAqIC0gVGV4dCBub2RlcyBhcmUgY3JlYXRlZCBzeW5jaHJvbm91c2x5XG4gKiAtIFROb2RlcyBhcmUgbGlua2VkIGludG8gdHJlZSBsYXppbHlcbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyZW50VE5vZGVJbmRleCBpbmRleCB0byB0aGUgcGFyZW50IFROb2RlIG9mIHRoaXMgaTE4biBibG9ja1xuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YFxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIGDJtcm1aTE4blN0YXJ0YCBpbnN0cnVjdGlvbi5cbiAqIEBwYXJhbSBtZXNzYWdlIE1lc3NhZ2UgdG8gdHJhbnNsYXRlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggSW5kZXggaW50byB0aGUgc3ViIHRlbXBsYXRlIG9mIG1lc3NhZ2UgdHJhbnNsYXRpb24uIChpZSBpbiBjYXNlIG9mXG4gKiAgICAgYG5nSWZgKSAoLTEgb3RoZXJ3aXNlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4blN0YXJ0Rmlyc3RDcmVhdGVQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgcGFyZW50VE5vZGVJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBzdWJUZW1wbGF0ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0Q3VycmVudFBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGNyZWF0ZU9wQ29kZXM6IEkxOG5DcmVhdGVPcENvZGVzID0gW10gYXMgYW55O1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgY29uc3QgZXhpc3RpbmdUTm9kZVN0YWNrOiBUTm9kZVtdW10gPSBbW11dO1xuICBjb25zdCBhc3RTdGFjazogQXJyYXk8QXJyYXk8STE4bk5vZGU+PiA9IFtbXV07XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcihjcmVhdGVPcENvZGVzLCBpMThuQ3JlYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcih1cGRhdGVPcENvZGVzLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICBjb25zdCBtc2dQYXJ0cyA9IHJlcGxhY2VOZ3NwKG1lc3NhZ2UpLnNwbGl0KFBIX1JFR0VYUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXNnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWUgPSBtc2dQYXJ0c1tpXTtcbiAgICBpZiAoKGkgJiAxKSA9PT0gMCkge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MgJiBJQ1UgZXhwcmVzc2lvbnMpXG4gICAgICBjb25zdCBwYXJ0cyA9IGkxOG5QYXJzZVRleHRJbnRvUGFydHNBbmRJQ1UodmFsdWUpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBsZXQgcGFydCA9IHBhcnRzW2pdO1xuICAgICAgICBpZiAoKGogJiAxKSA9PT0gMCkge1xuICAgICAgICAgIC8vIGBqYCBpcyBvZGQgdGhlcmVmb3JlIGBwYXJ0YCBpcyBzdHJpbmdcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gcGFydCBhcyBzdHJpbmc7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyh0ZXh0LCAnUGFyc2VkIElDVSBwYXJ0IHNob3VsZCBiZSBzdHJpbmcnKTtcbiAgICAgICAgICBpZiAodGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgIGkxOG5TdGFydEZpcnN0Q3JlYXRlUGFzc1Byb2Nlc3NUZXh0Tm9kZShcbiAgICAgICAgICAgICAgICBhc3RTdGFja1swXSwgdFZpZXcsIHJvb3RUTm9kZSwgZXhpc3RpbmdUTm9kZVN0YWNrWzBdLCBjcmVhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzLFxuICAgICAgICAgICAgICAgIGxWaWV3LCB0ZXh0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYGpgIGlzIEV2ZW4gdGhlcmVmb3IgYHBhcnRgIGlzIGFuIGBJQ1VFeHByZXNzaW9uYFxuICAgICAgICAgIGNvbnN0IGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24gPSBwYXJ0IGFzIEljdUV4cHJlc3Npb247XG4gICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgSUNVIGV4cHJlc3Npb24gaGFzIHRoZSByaWdodCBzaGFwZS4gVHJhbnNsYXRpb25zIG1pZ2h0IGNvbnRhaW4gaW52YWxpZFxuICAgICAgICAgIC8vIGNvbnN0cnVjdGlvbnMgKHdoaWxlIG9yaWdpbmFsIG1lc3NhZ2VzIHdlcmUgY29ycmVjdCksIHNvIElDVSBwYXJzaW5nIGF0IHJ1bnRpbWUgbWF5XG4gICAgICAgICAgLy8gbm90IHN1Y2NlZWQgKHRodXMgYGljdUV4cHJlc3Npb25gIHJlbWFpbnMgYSBzdHJpbmcpLlxuICAgICAgICAgIC8vIE5vdGU6IHdlIGludGVudGlvbmFsbHkgcmV0YWluIHRoZSBlcnJvciBoZXJlIGJ5IG5vdCB1c2luZyBgbmdEZXZNb2RlYCwgYmVjYXVzZVxuICAgICAgICAgIC8vIHRoZSB2YWx1ZSBjYW4gY2hhbmdlIGJhc2VkIG9uIHRoZSBsb2NhbGUgYW5kIHVzZXJzIGFyZW4ndCBndWFyYW50ZWVkIHRvIGhpdFxuICAgICAgICAgIC8vIGFuIGludmFsaWQgc3RyaW5nIHdoaWxlIHRoZXkncmUgZGV2ZWxvcGluZy5cbiAgICAgICAgICBpZiAodHlwZW9mIGljdUV4cHJlc3Npb24gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBwYXJzZSBJQ1UgZXhwcmVzc2lvbiBpbiBcIiR7bWVzc2FnZX1cIiBtZXNzYWdlLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBpY3VDb250YWluZXJUTm9kZSA9IGNyZWF0ZVROb2RlQW5kQWRkT3BDb2RlKFxuICAgICAgICAgICAgICB0Vmlldywgcm9vdFROb2RlLCBleGlzdGluZ1ROb2RlU3RhY2tbMF0sIGxWaWV3LCBjcmVhdGVPcENvZGVzLFxuICAgICAgICAgICAgICBuZ0Rldk1vZGUgPyBgSUNVICR7aW5kZXh9OiR7aWN1RXhwcmVzc2lvbi5tYWluQmluZGluZ31gIDogJycsIHRydWUpO1xuICAgICAgICAgIGNvbnN0IGljdU5vZGVJbmRleCA9IGljdUNvbnRhaW5lclROb2RlLmluZGV4O1xuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICAgICAgICAgICAgICBpY3VOb2RlSW5kZXgsIEhFQURFUl9PRkZTRVQsICdJbmRleCBtdXN0IGJlIGluIGFic29sdXRlIExWaWV3IG9mZnNldCcpO1xuICAgICAgICAgIGljdVN0YXJ0KFxuICAgICAgICAgICAgICBhc3RTdGFja1swXSwgdFZpZXcsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBwYXJlbnRUTm9kZUluZGV4LCBpY3VFeHByZXNzaW9uLFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzKVxuICAgICAgLy8gQXQgdGhpcyBwb2ludCB2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogJy8jMToyJyAob3JpZ2luYWxseSBjb21pbmcgZnJvbSAn77+9LyMxOjLvv70nKVxuICAgICAgY29uc3QgaXNDbG9zaW5nID0gdmFsdWUuY2hhckNvZGVBdCgwKSA9PT0gQ2hhckNvZGUuU0xBU0g7XG4gICAgICBjb25zdCB0eXBlID0gdmFsdWUuY2hhckNvZGVBdChpc0Nsb3NpbmcgPyAxIDogMCk7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0T25lT2YodHlwZSwgQ2hhckNvZGUuU1RBUiwgQ2hhckNvZGUuSEFTSCk7XG4gICAgICBjb25zdCBpbmRleCA9IEhFQURFUl9PRkZTRVQgKyBOdW1iZXIucGFyc2VJbnQodmFsdWUuc3Vic3RyaW5nKChpc0Nsb3NpbmcgPyAyIDogMSkpKTtcbiAgICAgIGlmIChpc0Nsb3NpbmcpIHtcbiAgICAgICAgZXhpc3RpbmdUTm9kZVN0YWNrLnNoaWZ0KCk7XG4gICAgICAgIGFzdFN0YWNrLnNoaWZ0KCk7XG4gICAgICAgIHNldEN1cnJlbnRUTm9kZShnZXRDdXJyZW50UGFyZW50VE5vZGUoKSEsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHROb2RlID0gY3JlYXRlVE5vZGVQbGFjZWhvbGRlcih0VmlldywgZXhpc3RpbmdUTm9kZVN0YWNrWzBdLCBpbmRleCk7XG4gICAgICAgIGV4aXN0aW5nVE5vZGVTdGFjay51bnNoaWZ0KFtdKTtcbiAgICAgICAgc2V0Q3VycmVudFROb2RlKHROb2RlLCB0cnVlKTtcblxuICAgICAgICBjb25zdCBwbGFjZWhvbGRlck5vZGU6IEkxOG5QbGFjZWhvbGRlck5vZGUgPSB7XG4gICAgICAgICAga2luZDogSTE4bk5vZGVLaW5kLlBMQUNFSE9MREVSLFxuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgICAgICB0eXBlOiB0eXBlID09PSBDaGFyQ29kZS5IQVNIID8gSTE4blBsYWNlaG9sZGVyVHlwZS5FTEVNRU5UIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSTE4blBsYWNlaG9sZGVyVHlwZS5TVUJURU1QTEFURSxcbiAgICAgICAgfTtcbiAgICAgICAgYXN0U3RhY2tbMF0ucHVzaChwbGFjZWhvbGRlck5vZGUpO1xuICAgICAgICBhc3RTdGFjay51bnNoaWZ0KHBsYWNlaG9sZGVyTm9kZS5jaGlsZHJlbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdFZpZXcuZGF0YVtpbmRleF0gPSA8VEkxOG4+e1xuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgYXN0OiBhc3RTdGFja1swXSxcbiAgfTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZSBzcGFjZSBpbiBpMThuIFJhbmdlIGFkZCBjcmVhdGUgT3BDb2RlIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRleHQgb3IgY29tbWVudCBub2RlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2AgbmVlZGVkIHRvIGFsbG9jYXRlIHNwYWNlIGluIGkxOG4gcmFuZ2UuXG4gKiBAcGFyYW0gcm9vdFROb2RlIFJvb3QgYFROb2RlYCBvZiB0aGUgaTE4biBibG9jay4gVGhpcyBub2RlIGRldGVybWluZXMgaWYgdGhlIG5ldyBUTm9kZSB3aWxsIGJlXG4gKiAgICAgYWRkZWQgYXMgcGFydCBvZiB0aGUgYGkxOG5TdGFydGAgaW5zdHJ1Y3Rpb24gb3IgYXMgcGFydCBvZiB0aGUgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YC5cbiAqIEBwYXJhbSBleGlzdGluZ1ROb2RlcyBpbnRlcm5hbCBzdGF0ZSBmb3IgYGFkZFROb2RlQW5kVXBkYXRlSW5zZXJ0QmVmb3JlSW5kZXhgLlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YCBuZWVkZWQgdG8gYWxsb2NhdGUgc3BhY2UgaW4gaTE4biByYW5nZS5cbiAqIEBwYXJhbSBjcmVhdGVPcENvZGVzIEFycmF5IHN0b3JpbmcgYEkxOG5DcmVhdGVPcENvZGVzYCB3aGVyZSBuZXcgb3BDb2RlcyB3aWxsIGJlIGFkZGVkLlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBiZSBhZGRlZCB3aGVuIHRoZSBgVGV4dGAgb3IgYENvbW1lbnRgIG5vZGUgd2lsbCBiZSBjcmVhdGVkLlxuICogQHBhcmFtIGlzSUNVIHRydWUgaWYgYSBgQ29tbWVudGAgbm9kZSBmb3IgSUNVIChpbnN0ZWFkIG9mIGBUZXh0YCkgbm9kZSBzaG91bGQgYmUgY3JlYXRlZC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlVE5vZGVBbmRBZGRPcENvZGUoXG4gICAgdFZpZXc6IFRWaWV3LCByb290VE5vZGU6IFROb2RlfG51bGwsIGV4aXN0aW5nVE5vZGVzOiBUTm9kZVtdLCBsVmlldzogTFZpZXcsXG4gICAgY3JlYXRlT3BDb2RlczogSTE4bkNyZWF0ZU9wQ29kZXMsIHRleHQ6IHN0cmluZ3xudWxsLCBpc0lDVTogYm9vbGVhbik6IFROb2RlIHtcbiAgY29uc3QgaTE4bk5vZGVJZHggPSBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCAxLCBudWxsKTtcbiAgbGV0IG9wQ29kZSA9IGkxOG5Ob2RlSWR4IDw8IEkxOG5DcmVhdGVPcENvZGUuU0hJRlQ7XG4gIGxldCBwYXJlbnRUTm9kZSA9IGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpO1xuXG4gIGlmIChyb290VE5vZGUgPT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gRklYTUUobWlza28pOiBBIG51bGwgYHBhcmVudFROb2RlYCBzaG91bGQgcmVwcmVzZW50IHdoZW4gd2UgZmFsbCBvZiB0aGUgYExWaWV3YCBib3VuZGFyeS5cbiAgICAvLyAodGhlcmUgaXMgbm8gcGFyZW50KSwgYnV0IGluIHNvbWUgY2lyY3Vtc3RhbmNlcyAoYmVjYXVzZSB3ZSBhcmUgaW5jb25zaXN0ZW50IGFib3V0IGhvdyB3ZSBzZXRcbiAgICAvLyBgcHJldmlvdXNPclBhcmVudFROb2RlYCkgaXQgY291bGQgcG9pbnQgdG8gYHJvb3RUTm9kZWAgU28gdGhpcyBpcyBhIHdvcmsgYXJvdW5kLlxuICAgIHBhcmVudFROb2RlID0gbnVsbDtcbiAgfVxuICBpZiAocGFyZW50VE5vZGUgPT09IG51bGwpIHtcbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgcGFyZW50IHRoYXQgbWVhbnMgdGhhdCB3ZSBjYW4gZWFnZXJseSBhZGQgbm9kZXMuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIHBhcmVudCB0aGFuIHRoZXNlIG5vZGVzIGNhbid0IGJlIGFkZGVkIG5vdyAoYXMgdGhlIHBhcmVudCBoYXMgbm90IGJlZW4gY3JlYXRlZFxuICAgIC8vIHlldCkgYW5kIGluc3RlYWQgdGhlIGBwYXJlbnRUTm9kZWAgaXMgcmVzcG9uc2libGUgZm9yIGFkZGluZyBpdC4gU2VlXG4gICAgLy8gYFROb2RlLmluc2VydEJlZm9yZUluZGV4YFxuICAgIG9wQ29kZSB8PSBJMThuQ3JlYXRlT3BDb2RlLkFQUEVORF9FQUdFUkxZO1xuICB9XG4gIGlmIChpc0lDVSkge1xuICAgIG9wQ29kZSB8PSBJMThuQ3JlYXRlT3BDb2RlLkNPTU1FTlQ7XG4gICAgZW5zdXJlSWN1Q29udGFpbmVyVmlzaXRvckxvYWRlZChsb2FkSWN1Q29udGFpbmVyVmlzaXRvcik7XG4gIH1cbiAgY3JlYXRlT3BDb2Rlcy5wdXNoKG9wQ29kZSwgdGV4dCA9PT0gbnVsbCA/ICcnIDogdGV4dCk7XG4gIC8vIFdlIHN0b3JlIGB7ez99fWAgc28gdGhhdCB3aGVuIGxvb2tpbmcgYXQgZGVidWcgYFROb2RlVHlwZS50ZW1wbGF0ZWAgd2UgY2FuIHNlZSB3aGVyZSB0aGVcbiAgLy8gYmluZGluZ3MgYXJlLlxuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZVROb2RlQXRJbmRleChcbiAgICAgIHRWaWV3LCBpMThuTm9kZUlkeCwgaXNJQ1UgPyBUTm9kZVR5cGUuSWN1IDogVE5vZGVUeXBlLlRleHQsXG4gICAgICB0ZXh0ID09PSBudWxsID8gKG5nRGV2TW9kZSA/ICd7ez99fScgOiAnJykgOiB0ZXh0LCBudWxsKTtcbiAgYWRkVE5vZGVBbmRVcGRhdGVJbnNlcnRCZWZvcmVJbmRleChleGlzdGluZ1ROb2RlcywgdE5vZGUpO1xuICBjb25zdCB0Tm9kZUlkeCA9IHROb2RlLmluZGV4O1xuICBzZXRDdXJyZW50VE5vZGUodE5vZGUsIGZhbHNlIC8qIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZyAqLyk7XG4gIGlmIChwYXJlbnRUTm9kZSAhPT0gbnVsbCAmJiByb290VE5vZGUgIT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gV2UgYXJlIGEgY2hpbGQgb2YgZGVlcGVyIG5vZGUgKHJhdGhlciB0aGFuIGEgZGlyZWN0IGNoaWxkIG9mIGBpMThuU3RhcnRgIGluc3RydWN0aW9uLilcbiAgICAvLyBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0byBhZGQgb3Vyc2VsdmVzIHRvIHRoZSBwYXJlbnQuXG4gICAgc2V0VE5vZGVJbnNlcnRCZWZvcmVJbmRleChwYXJlbnRUTm9kZSwgdE5vZGVJZHgpO1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgdGV4dCBub2RlIGluIGkxOG4gYmxvY2suXG4gKlxuICogVGV4dCBub2RlcyBjYW4gaGF2ZTpcbiAqIC0gQ3JlYXRlIGluc3RydWN0aW9uIGluIGBjcmVhdGVPcENvZGVzYCBmb3IgY3JlYXRpbmcgdGhlIHRleHQgbm9kZS5cbiAqIC0gQWxsb2NhdGUgc3BlYyBmb3IgdGV4dCBub2RlIGluIGkxOG4gcmFuZ2Ugb2YgYExWaWV3YFxuICogLSBJZiBjb250YWlucyBiaW5kaW5nOlxuICogICAgLSBiaW5kaW5ncyA9PiBhbGxvY2F0ZSBzcGFjZSBpbiBpMThuIHJhbmdlIG9mIGBMVmlld2AgdG8gc3RvcmUgdGhlIGJpbmRpbmcgdmFsdWUuXG4gKiAgICAtIHBvcHVsYXRlIGB1cGRhdGVPcENvZGVzYCB3aXRoIHVwZGF0ZSBpbnN0cnVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YFxuICogQHBhcmFtIHJvb3RUTm9kZSBSb290IGBUTm9kZWAgb2YgdGhlIGkxOG4gYmxvY2suIFRoaXMgbm9kZSBkZXRlcm1pbmVzIGlmIHRoZSBuZXcgVE5vZGUgd2lsbFxuICogICAgIGJlIGFkZGVkIGFzIHBhcnQgb2YgdGhlIGBpMThuU3RhcnRgIGluc3RydWN0aW9uIG9yIGFzIHBhcnQgb2YgdGhlXG4gKiAgICAgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YC5cbiAqIEBwYXJhbSBleGlzdGluZ1ROb2RlcyBpbnRlcm5hbCBzdGF0ZSBmb3IgYGFkZFROb2RlQW5kVXBkYXRlSW5zZXJ0QmVmb3JlSW5kZXhgLlxuICogQHBhcmFtIGNyZWF0ZU9wQ29kZXMgTG9jYXRpb24gd2hlcmUgdGhlIGNyZWF0aW9uIE9wQ29kZXMgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gdGV4dCBUaGUgdHJhbnNsYXRlZCB0ZXh0ICh3aGljaCBtYXkgY29udGFpbiBiaW5kaW5nKVxuICovXG5mdW5jdGlvbiBpMThuU3RhcnRGaXJzdENyZWF0ZVBhc3NQcm9jZXNzVGV4dE5vZGUoXG4gICAgYXN0OiBJMThuTm9kZVtdLCB0VmlldzogVFZpZXcsIHJvb3RUTm9kZTogVE5vZGV8bnVsbCwgZXhpc3RpbmdUTm9kZXM6IFROb2RlW10sXG4gICAgY3JlYXRlT3BDb2RlczogSTE4bkNyZWF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBsVmlldzogTFZpZXcsXG4gICAgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGhhc0JpbmRpbmcgPSB0ZXh0Lm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVUTm9kZUFuZEFkZE9wQ29kZShcbiAgICAgIHRWaWV3LCByb290VE5vZGUsIGV4aXN0aW5nVE5vZGVzLCBsVmlldywgY3JlYXRlT3BDb2RlcywgaGFzQmluZGluZyA/IG51bGwgOiB0ZXh0LCBmYWxzZSk7XG4gIGNvbnN0IGluZGV4ID0gdE5vZGUuaW5kZXg7XG4gIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh1cGRhdGVPcENvZGVzLCB0ZXh0LCBpbmRleCwgbnVsbCwgMCwgbnVsbCk7XG4gIH1cbiAgYXN0LnB1c2goe2tpbmQ6IEkxOG5Ob2RlS2luZC5URVhULCBpbmRleH0pO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkF0dHJpYnV0ZXNgIGFib3ZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudCA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50SW5kZXggPSBwcmV2aW91c0VsZW1lbnQuaW5kZXg7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW10gYXMgYW55O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIodXBkYXRlT3BDb2RlcywgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gIH1cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4XSA9PT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHZhbHVlc1tpXTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB2YWx1ZXNbaSArIDFdO1xuXG4gICAgICBpZiAobWVzc2FnZSAhPT0gJycpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYXR0cmlidXRlIHZhbHVlIGNvbnRhaW5zIGFuIElDVSBhbmQgdGhyb3cgYW4gZXJyb3IgaWYgdGhhdCdzIHRoZSBjYXNlLlxuICAgICAgICAvLyBJQ1VzIGluIGVsZW1lbnQgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZC5cbiAgICAgICAgLy8gTm90ZTogd2UgaW50ZW50aW9uYWxseSByZXRhaW4gdGhlIGVycm9yIGhlcmUgYnkgbm90IHVzaW5nIGBuZ0Rldk1vZGVgLCBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBgdmFsdWVgIGNhbiBjaGFuZ2UgYmFzZWQgb24gdGhlIGxvY2FsZSBhbmQgdXNlcnMgYXJlbid0IGd1YXJhbnRlZWQgdG8gaGl0XG4gICAgICAgIC8vIGFuIGludmFsaWQgc3RyaW5nIHdoaWxlIHRoZXkncmUgZGV2ZWxvcGluZy5cbiAgICAgICAgaWYgKElDVV9SRUdFWFAudGVzdChtZXNzYWdlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYElDVSBleHByZXNzaW9ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBhdHRyaWJ1dGVzLiBNZXNzYWdlOiBcIiR7bWVzc2FnZX1cIi5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGkxOG4gYXR0cmlidXRlcyB0aGF0IGhpdCB0aGlzIGNvZGUgcGF0aCBhcmUgZ3VhcmFudGVlZCB0byBoYXZlIGJpbmRpbmdzLCBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBjb21waWxlciB0cmVhdHMgc3RhdGljIGkxOG4gYXR0cmlidXRlcyBhcyByZWd1bGFyIGF0dHJpYnV0ZSBiaW5kaW5ncy5cbiAgICAgICAgLy8gU2luY2UgdGhpcyBtYXkgbm90IGJlIHRoZSBmaXJzdCBpMThuIGF0dHJpYnV0ZSBvbiB0aGlzIGVsZW1lbnQgd2UgbmVlZCB0byBwYXNzIGluIGhvd1xuICAgICAgICAvLyBtYW55IHByZXZpb3VzIGJpbmRpbmdzIHRoZXJlIGhhdmUgYWxyZWFkeSBiZWVuLlxuICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgdXBkYXRlT3BDb2RlcywgbWVzc2FnZSwgcHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lLCBjb3VudEJpbmRpbmdzKHVwZGF0ZU9wQ29kZXMpLFxuICAgICAgICAgICAgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRWaWV3LmRhdGFbaW5kZXhdID0gdXBkYXRlT3BDb2RlcztcbiAgfVxufVxuXG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgdG8gdXBkYXRlIHRoZSBiaW5kaW5ncyBvZiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gdXBkYXRlT3BDb2RlcyBQbGFjZSB3aGVyZSB0aGUgdXBkYXRlIG9wY29kZXMgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmluZGluZ3MuXG4gKiBAcGFyYW0gZGVzdGluYXRpb25Ob2RlIEluZGV4IG9mIHRoZSBkZXN0aW5hdGlvbiBub2RlIHdoaWNoIHdpbGwgcmVjZWl2ZSB0aGUgYmluZGluZy5cbiAqIEBwYXJhbSBhdHRyTmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUsIGlmIHRoZSBzdHJpbmcgYmVsb25ncyB0byBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gc2FuaXRpemVGbiBTYW5pdGl6YXRpb24gZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgc3RyaW5nIGFmdGVyIHVwZGF0ZSwgaWYgbmVjZXNzYXJ5LlxuICogQHBhcmFtIGJpbmRpbmdTdGFydCBUaGUgbFZpZXcgaW5kZXggb2YgdGhlIG5leHQgZXhwcmVzc2lvbiB0aGF0IGNhbiBiZSBib3VuZCB2aWEgYW4gb3BDb2RlLlxuICogQHJldHVybnMgVGhlIG1hc2sgdmFsdWUgZm9yIHRoZXNlIGJpbmRpbmdzXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIHN0cjogc3RyaW5nLCBkZXN0aW5hdGlvbk5vZGU6IG51bWJlciwgYXR0ck5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGJpbmRpbmdTdGFydDogbnVtYmVyLCBzYW5pdGl6ZUZuOiBTYW5pdGl6ZXJGbnxudWxsKTogbnVtYmVyIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICAgICAgZGVzdGluYXRpb25Ob2RlLCBIRUFERVJfT0ZGU0VULCAnSW5kZXggbXVzdCBiZSBpbiBhYnNvbHV0ZSBMVmlldyBvZmZzZXQnKTtcbiAgY29uc3QgbWFza0luZGV4ID0gdXBkYXRlT3BDb2Rlcy5sZW5ndGg7ICAvLyBMb2NhdGlvbiBvZiBtYXNrXG4gIGNvbnN0IHNpemVJbmRleCA9IG1hc2tJbmRleCArIDE7ICAgICAgICAgLy8gbG9jYXRpb24gb2Ygc2l6ZSBmb3Igc2tpcHBpbmdcbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKG51bGwsIG51bGwpOyAgICAgICAgICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBjb25zdCBzdGFydEluZGV4ID0gbWFza0luZGV4ICsgMjsgICAgICAgIC8vIGxvY2F0aW9uIG9mIGZpcnN0IGFsbG9jYXRpb24uXG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcih1cGRhdGVPcENvZGVzLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuICBjb25zdCB0ZXh0UGFydHMgPSBzdHIuc3BsaXQoQklORElOR19SRUdFWFApO1xuICBsZXQgbWFzayA9IDA7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCB0ZXh0UGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB0ZXh0UGFydHNbal07XG5cbiAgICBpZiAoaiAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gYmluZGluZ1N0YXJ0ICsgcGFyc2VJbnQodGV4dFZhbHVlLCAxMCk7XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2goLTEgLSBiaW5kaW5nSW5kZXgpO1xuICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2UgaWYgKHRleHRWYWx1ZSAhPT0gJycpIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dFxuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKHRleHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgIChhdHRyTmFtZSA/IEkxOG5VcGRhdGVPcENvZGUuQXR0ciA6IEkxOG5VcGRhdGVPcENvZGUuVGV4dCkpO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbbWFza0luZGV4XSA9IG1hc2s7XG4gIHVwZGF0ZU9wQ29kZXNbc2l6ZUluZGV4XSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gc3RhcnRJbmRleDtcbiAgcmV0dXJuIG1hc2s7XG59XG5cbi8qKlxuICogQ291bnQgdGhlIG51bWJlciBvZiBiaW5kaW5ncyBpbiB0aGUgZ2l2ZW4gYG9wQ29kZXNgLlxuICpcbiAqIEl0IGNvdWxkIGJlIHBvc3NpYmxlIHRvIHNwZWVkIHRoaXMgdXAsIGJ5IHBhc3NpbmcgdGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3VuZCBiYWNrIGZyb21cbiAqIGBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKClgIHRvIGBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcygpYCBidXQgdGhpcyB3b3VsZCB0aGVuIHJlcXVpcmUgbW9yZVxuICogY29tcGxleGl0eSBpbiB0aGUgY29kZSBhbmQvb3IgdHJhbnNpZW50IG9iamVjdHMgdG8gYmUgY3JlYXRlZC5cbiAqXG4gKiBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIG9ubHkgY2FsbGVkIG9uY2Ugd2hlbiB0aGUgdGVtcGxhdGUgaXMgaW5zdGFudGlhdGVkLCBpcyB0cml2aWFsIGluIHRoZVxuICogZmlyc3QgaW5zdGFuY2UgKHNpbmNlIGBvcENvZGVzYCB3aWxsIGJlIGFuIGVtcHR5IGFycmF5KSwgYW5kIGl0IGlzIG5vdCBjb21tb24gZm9yIGVsZW1lbnRzIHRvXG4gKiBjb250YWluIG11bHRpcGxlIGkxOG4gYm91bmQgYXR0cmlidXRlcywgaXQgc2VlbXMgbGlrZSB0aGlzIGlzIGEgcmVhc29uYWJsZSBjb21wcm9taXNlLlxuICovXG5mdW5jdGlvbiBjb3VudEJpbmRpbmdzKG9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzKTogbnVtYmVyIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gb3BDb2Rlc1tpXTtcbiAgICAvLyBCaW5kaW5ncyBhcmUgbmVnYXRpdmUgbnVtYmVycy5cbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PT0gJ251bWJlcicgJiYgb3BDb2RlIDwgMCkge1xuICAgICAgY291bnQrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufVxuXG4vKipcbiAqIENvbnZlcnQgYmluZGluZyBpbmRleCB0byBtYXNrIGJpdC5cbiAqXG4gKiBFYWNoIGluZGV4IHJlcHJlc2VudHMgYSBzaW5nbGUgYml0IG9uIHRoZSBiaXQtbWFzay4gQmVjYXVzZSBiaXQtbWFzayBvbmx5IGhhcyAzMiBiaXRzLCB3ZSBtYWtlXG4gKiB0aGUgMzJuZCBiaXQgc2hhcmUgYWxsIG1hc2tzIGZvciBhbGwgYmluZGluZ3MgaGlnaGVyIHRoYW4gMzIuIFNpbmNlIGl0IGlzIGV4dHJlbWVseSByYXJlIHRvXG4gKiBoYXZlIG1vcmUgdGhhbiAzMiBiaW5kaW5ncyB0aGlzIHdpbGwgYmUgaGl0IHZlcnkgcmFyZWx5LiBUaGUgZG93bnNpZGUgb2YgaGl0dGluZyB0aGlzIGNvcm5lclxuICogY2FzZSBpcyB0aGF0IHdlIHdpbGwgZXhlY3V0ZSBiaW5kaW5nIGNvZGUgbW9yZSBvZnRlbiB0aGFuIG5lY2Vzc2FyeS4gKHBlbmFsdHkgb2YgcGVyZm9ybWFuY2UpXG4gKi9cbmZ1bmN0aW9uIHRvTWFza0JpdChiaW5kaW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IE1hdGgubWluKGJpbmRpbmdJbmRleCwgMzEpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgaW5UZW1wbGF0ZSwgZmFsc2UsXG4gICAgICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7XG4gICAgICAgICAgICAgIG1lc3NhZ2V9XCJgKTtcblxuICByZXMgKz0gbWVzc2FnZS5zbGljZShpbmRleCk7XG4gIHJldHVybiByZXM7XG59XG5cblxuLyoqXG4gKiBFeHRyYWN0cyBhIHBhcnQgb2YgYSBtZXNzYWdlIGFuZCByZW1vdmVzIHRoZSByZXN0LlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIGV4dHJhY3RpbmcgYSBwYXJ0IG9mIHRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCBhIHRlbXBsYXRlLiBBXG4gKiB0cmFuc2xhdGVkIG1lc3NhZ2UgY2FuIHNwYW4gbXVsdGlwbGUgdGVtcGxhdGVzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgaTE4bj5UcmFuc2xhdGUgPHNwYW4gKm5nSWY+bWU8L3NwYW4+ITwvZGl2PlxuICogYGBgXG4gKlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gY3JvcFxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggSW5kZXggb2YgdGhlIHN1Yi10ZW1wbGF0ZSB0byBleHRyYWN0LiBJZiB1bmRlZmluZWQgaXQgcmV0dXJucyB0aGVcbiAqIGV4dGVybmFsIHRlbXBsYXRlIGFuZCByZW1vdmVzIGFsbCBzdWItdGVtcGxhdGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg6IG51bWJlcikge1xuICBpZiAoaXNSb290VGVtcGxhdGVNZXNzYWdlKHN1YlRlbXBsYXRlSW5kZXgpKSB7XG4gICAgLy8gV2Ugd2FudCB0aGUgcm9vdCB0ZW1wbGF0ZSBtZXNzYWdlLCBpZ25vcmUgYWxsIHN1Yi10ZW1wbGF0ZXNcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdlIHdhbnQgYSBzcGVjaWZpYyBzdWItdGVtcGxhdGVcbiAgICBjb25zdCBzdGFydCA9XG4gICAgICAgIG1lc3NhZ2UuaW5kZXhPZihgOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSArIDIgKyBzdWJUZW1wbGF0ZUluZGV4LnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgIGNvbnN0IGVuZCA9IG1lc3NhZ2Uuc2VhcmNoKG5ldyBSZWdFeHAoYCR7TUFSS0VSfVxcXFwvXFxcXCpcXFxcZCs6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApKTtcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIGZvciBJQ1UgZXhwcmVzc2lvbnMuXG4gKlxuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBpbmRleCBJbmRleCB3aGVyZSB0aGUgYW5jaG9yIGlzIHN0b3JlZCBhbmQgYW4gb3B0aW9uYWwgYFRJY3VDb250YWluZXJOb2RlYFxuICogICAtIGBsVmlld1thbmNob3JJZHhdYCBwb2ludHMgdG8gYSBgQ29tbWVudGAgbm9kZSByZXByZXNlbnRpbmcgdGhlIGFuY2hvciBmb3IgdGhlIElDVS5cbiAqICAgLSBgdFZpZXcuZGF0YVthbmNob3JJZHhdYCBwb2ludHMgdG8gdGhlIGBUSWN1Q29udGFpbmVyTm9kZWAgaWYgSUNVIGlzIHJvb3QgKGBudWxsYCBvdGhlcndpc2UpXG4gKi9cbmZ1bmN0aW9uIGljdVN0YXJ0KFxuICAgIGFzdDogSTE4bk5vZGVbXSwgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLFxuICAgIHBhcmVudElkeDogbnVtYmVyLCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBhbmNob3JJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChpY3VFeHByZXNzaW9uLCAnSUNVIGV4cHJlc3Npb24gbXVzdCBiZSBkZWZpbmVkJyk7XG4gIGxldCBiaW5kaW5nTWFzayA9IDA7XG4gIGNvbnN0IHRJY3U6IFRJY3UgPSB7XG4gICAgdHlwZTogaWN1RXhwcmVzc2lvbi50eXBlLFxuICAgIGN1cnJlbnRDYXNlTFZpZXdJbmRleDogYWxsb2NFeHBhbmRvKHRWaWV3LCBsVmlldywgMSwgbnVsbCksXG4gICAgYW5jaG9ySWR4LFxuICAgIGNhc2VzOiBbXSxcbiAgICBjcmVhdGU6IFtdLFxuICAgIHJlbW92ZTogW10sXG4gICAgdXBkYXRlOiBbXVxuICB9O1xuICBhZGRVcGRhdGVJY3VTd2l0Y2godXBkYXRlT3BDb2RlcywgaWN1RXhwcmVzc2lvbiwgYW5jaG9ySWR4KTtcbiAgc2V0VEljdSh0VmlldywgYW5jaG9ySWR4LCB0SWN1KTtcbiAgY29uc3QgdmFsdWVzID0gaWN1RXhwcmVzc2lvbi52YWx1ZXM7XG4gIGNvbnN0IGNhc2VzOiBJMThuTm9kZVtdW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBFYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MgJiBvdGhlciBJQ1UgZXhwcmVzc2lvbnNcbiAgICBjb25zdCB2YWx1ZUFyciA9IHZhbHVlc1tpXTtcbiAgICBjb25zdCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gbmVzdGVkIElDVSBleHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGljdUluZGV4ID0gbmVzdGVkSWN1cy5wdXNoKHZhbHVlIGFzIEljdUV4cHJlc3Npb24pIC0gMTtcbiAgICAgICAgLy8gUmVwbGFjZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb24gYnkgYSBjb21tZW50IG5vZGVcbiAgICAgICAgdmFsdWVBcnJbal0gPSBgPCEtLe+/vSR7aWN1SW5kZXh977+9LS0+YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY2FzZUFzdDogSTE4bk5vZGVbXSA9IFtdO1xuICAgIGNhc2VzLnB1c2goY2FzZUFzdCk7XG4gICAgYmluZGluZ01hc2sgPSBwYXJzZUljdUNhc2UoXG4gICAgICAgICAgICAgICAgICAgICAgY2FzZUFzdCwgdFZpZXcsIHRJY3UsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBwYXJlbnRJZHgsIGljdUV4cHJlc3Npb24uY2FzZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWVBcnIuam9pbignJyksIG5lc3RlZEljdXMpIHxcbiAgICAgICAgYmluZGluZ01hc2s7XG4gIH1cbiAgaWYgKGJpbmRpbmdNYXNrKSB7XG4gICAgYWRkVXBkYXRlSWN1VXBkYXRlKHVwZGF0ZU9wQ29kZXMsIGJpbmRpbmdNYXNrLCBhbmNob3JJZHgpO1xuICB9XG4gIGFzdC5wdXNoKHtcbiAgICBraW5kOiBJMThuTm9kZUtpbmQuSUNVLFxuICAgIGluZGV4OiBhbmNob3JJZHgsXG4gICAgY2FzZXMsXG4gICAgY3VycmVudENhc2VMVmlld0luZGV4OiB0SWN1LmN1cnJlbnRDYXNlTFZpZXdJbmRleFxuICB9KTtcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdW10gPSBbXTtcbiAgbGV0IGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgbGV0IG1haW5CaW5kaW5nID0gMDtcbiAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShJQ1VfQkxPQ0tfUkVHRVhQLCBmdW5jdGlvbihzdHI6IHN0cmluZywgYmluZGluZzogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICAgIH1cbiAgICBtYWluQmluZGluZyA9IHBhcnNlSW50KGJpbmRpbmcuc2xpY2UoMSksIDEwKTtcbiAgICByZXR1cm4gJyc7XG4gIH0pO1xuXG4gIGNvbnN0IHBhcnRzID0gaTE4blBhcnNlVGV4dEludG9QYXJ0c0FuZElDVShwYXR0ZXJuKSBhcyBzdHJpbmdbXTtcbiAgLy8gTG9va2luZyBmb3IgKGtleSBibG9jaykrIHNlcXVlbmNlLiBPbmUgb2YgdGhlIGtleXMgaGFzIHRvIGJlIFwib3RoZXJcIi5cbiAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgcGFydHMubGVuZ3RoOykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1twb3MrK10udHJpbSgpO1xuICAgIGlmIChpY3VUeXBlID09PSBJY3VUeXBlLnBsdXJhbCkge1xuICAgICAgLy8gS2V5IGNhbiBiZSBcIj14XCIsIHdlIGp1c3Qgd2FudCBcInhcIlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccyooPzo9KT8oXFx3KylcXHMqLywgJyQxJyk7XG4gICAgfVxuICAgIGlmIChrZXkubGVuZ3RoKSB7XG4gICAgICBjYXNlcy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gaTE4blBhcnNlVGV4dEludG9QYXJ0c0FuZElDVShwYXJ0c1twb3MrK10pIGFzIHN0cmluZ1tdO1xuICAgIGlmIChjYXNlcy5sZW5ndGggPiB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZXMucHVzaChibG9ja3MpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlcywgc2VlICMyMTYxNVxuICByZXR1cm4ge3R5cGU6IGljdVR5cGUsIG1haW5CaW5kaW5nOiBtYWluQmluZGluZywgY2FzZXMsIHZhbHVlc307XG59XG5cblxuLyoqXG4gKiBCcmVha3MgcGF0dGVybiBpbnRvIHN0cmluZ3MgYW5kIHRvcCBsZXZlbCB7Li4ufSBibG9ja3MuXG4gKiBDYW4gYmUgdXNlZCB0byBicmVhayBhIG1lc3NhZ2UgaW50byB0ZXh0IGFuZCBJQ1UgZXhwcmVzc2lvbnMsIG9yIHRvIGJyZWFrIGFuIElDVSBleHByZXNzaW9uXG4gKiBpbnRvIGtleXMgYW5kIGNhc2VzLiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiAoc3ViKVBhdHRlcm4gdG8gYmUgYnJva2VuLlxuICogQHJldHVybnMgQW4gYEFycmF5PHN0cmluZ3xJY3VFeHByZXNzaW9uPmAgd2hlcmU6XG4gKiAgIC0gb2RkIHBvc2l0aW9uczogYHN0cmluZ2AgPT4gdGV4dCBiZXR3ZWVuIElDVSBleHByZXNzaW9uc1xuICogICAtIGV2ZW4gcG9zaXRpb25zOiBgSUNVRXhwcmVzc2lvbmAgPT4gSUNVIGV4cHJlc3Npb24gcGFyc2VkIGludG8gYElDVUV4cHJlc3Npb25gIHJlY29yZC5cbiAqL1xuZnVuY3Rpb24gaTE4blBhcnNlVGV4dEludG9QYXJ0c0FuZElDVShwYXR0ZXJuOiBzdHJpbmcpOiAoc3RyaW5nfEljdUV4cHJlc3Npb24pW10ge1xuICBpZiAoIXBhdHRlcm4pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgcHJldlBvcyA9IDA7XG4gIGNvbnN0IGJyYWNlU3RhY2sgPSBbXTtcbiAgY29uc3QgcmVzdWx0czogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdID0gW107XG4gIGNvbnN0IGJyYWNlcyA9IC9be31dL2c7XG4gIC8vIGxhc3RJbmRleCBkb2Vzbid0IGdldCBzZXQgdG8gMCBzbyB3ZSBoYXZlIHRvLlxuICBicmFjZXMubGFzdEluZGV4ID0gMDtcblxuICBsZXQgbWF0Y2g7XG4gIHdoaWxlIChtYXRjaCA9IGJyYWNlcy5leGVjKHBhdHRlcm4pKSB7XG4gICAgY29uc3QgcG9zID0gbWF0Y2guaW5kZXg7XG4gICAgaWYgKG1hdGNoWzBdID09ICd9Jykge1xuICAgICAgYnJhY2VTdGFjay5wb3AoKTtcblxuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gRW5kIG9mIHRoZSBibG9jay5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICBpZiAoSUNVX0JMT0NLX1JFR0VYUC50ZXN0KGJsb2NrKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChwYXJzZUlDVUJsb2NrKGJsb2NrKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKGJsb2NrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICBjb25zdCBzdWJzdHJpbmcgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgICBicmFjZVN0YWNrLnB1c2goJ3snKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdWJzdHJpbmcgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zKTtcbiAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5cbi8qKlxuICogUGFyc2VzIGEgbm9kZSwgaXRzIGNoaWxkcmVuIGFuZCBpdHMgc2libGluZ3MsIGFuZCBnZW5lcmF0ZXMgdGhlIG11dGF0ZSAmIHVwZGF0ZSBPcENvZGVzLlxuICpcbiAqL1xuZnVuY3Rpb24gcGFyc2VJY3VDYXNlKFxuICAgIGFzdDogSTE4bk5vZGVbXSwgdFZpZXc6IFRWaWV3LCB0SWN1OiBUSWN1LCBsVmlldzogTFZpZXcsIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLFxuICAgIHBhcmVudElkeDogbnVtYmVyLCBjYXNlTmFtZTogc3RyaW5nLCB1bnNhZmVDYXNlSHRtbDogc3RyaW5nLFxuICAgIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSk6IG51bWJlciB7XG4gIGNvbnN0IGNyZWF0ZTogSWN1Q3JlYXRlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgY29uc3QgcmVtb3ZlOiBJMThuUmVtb3ZlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgY29uc3QgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdIGFzIGFueTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKGNyZWF0ZSwgaWN1Q3JlYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcihyZW1vdmUsIGkxOG5SZW1vdmVPcENvZGVzVG9TdHJpbmcpO1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKHVwZGF0ZSwgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gIH1cbiAgdEljdS5jYXNlcy5wdXNoKGNhc2VOYW1lKTtcbiAgdEljdS5jcmVhdGUucHVzaChjcmVhdGUpO1xuICB0SWN1LnJlbW92ZS5wdXNoKHJlbW92ZSk7XG4gIHRJY3UudXBkYXRlLnB1c2godXBkYXRlKTtcblxuICBjb25zdCBpbmVydEJvZHlIZWxwZXIgPSBnZXRJbmVydEJvZHlIZWxwZXIoZ2V0RG9jdW1lbnQoKSk7XG4gIGNvbnN0IGluZXJ0Qm9keUVsZW1lbnQgPSBpbmVydEJvZHlIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudCh1bnNhZmVDYXNlSHRtbCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGluZXJ0Qm9keUVsZW1lbnQsICdVbmFibGUgdG8gZ2VuZXJhdGUgaW5lcnQgYm9keSBlbGVtZW50Jyk7XG4gIGNvbnN0IGluZXJ0Um9vdE5vZGUgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCEpIGFzIEVsZW1lbnQgfHwgaW5lcnRCb2R5RWxlbWVudDtcbiAgaWYgKGluZXJ0Um9vdE5vZGUpIHtcbiAgICByZXR1cm4gd2Fsa0ljdVRyZWUoXG4gICAgICAgIGFzdCwgdFZpZXcsIHRJY3UsIGxWaWV3LCB1cGRhdGVPcENvZGVzLCBjcmVhdGUsIHJlbW92ZSwgdXBkYXRlLCBpbmVydFJvb3ROb2RlLCBwYXJlbnRJZHgsXG4gICAgICAgIG5lc3RlZEljdXMsIDApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAwO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdhbGtJY3VUcmVlKFxuICAgIGFzdDogSTE4bk5vZGVbXSwgdFZpZXc6IFRWaWV3LCB0SWN1OiBUSWN1LCBsVmlldzogTFZpZXcsIHNoYXJlZFVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLFxuICAgIGNyZWF0ZTogSWN1Q3JlYXRlT3BDb2RlcywgcmVtb3ZlOiBJMThuUmVtb3ZlT3BDb2RlcywgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2RlcyxcbiAgICBwYXJlbnROb2RlOiBFbGVtZW50LCBwYXJlbnRJZHg6IG51bWJlciwgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdLCBkZXB0aDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IGJpbmRpbmdNYXNrID0gMDtcbiAgbGV0IGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZS5maXJzdENoaWxkO1xuICB3aGlsZSAoY3VycmVudE5vZGUpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIDEsIG51bGwpO1xuICAgIHN3aXRjaCAoY3VycmVudE5vZGUubm9kZVR5cGUpIHtcbiAgICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChWQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgICAgIGFkZENyZWF0ZU5vZGVBbmRBcHBlbmQoY3JlYXRlLCBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgcGFyZW50SWR4LCBuZXdJbmRleCk7XG4gICAgICAgICAgdFZpZXcuZGF0YVtuZXdJbmRleF0gPSB0YWdOYW1lO1xuICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhdHRyID0gZWxBdHRycy5pdGVtKGkpITtcbiAgICAgICAgICAgIGNvbnN0IGxvd2VyQXR0ck5hbWUgPSBhdHRyLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIWF0dHIudmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgICAgLy8gd2UgYXNzdW1lIHRoZSBpbnB1dCBzdHJpbmcgaXMgc2FmZSwgdW5sZXNzIGl0J3MgdXNpbmcgYSBiaW5kaW5nXG4gICAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgICBpZiAoVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXJBdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoVVJJX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZSwgYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgMCwgX3Nhbml0aXplVXJsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh1cGRhdGUsIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIDAsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgYFdBUk5JTkc6IGlnbm9yaW5nIHVuc2FmZSBhdHRyaWJ1dGUgdmFsdWUgYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgJHtsb3dlckF0dHJOYW1lfSBvbiBlbGVtZW50ICR7dGFnTmFtZX0gYCArXG4gICAgICAgICAgICAgICAgICAgICAgICBgKHNlZSAke1hTU19TRUNVUklUWV9VUkx9KWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhZGRDcmVhdGVBdHRyaWJ1dGUoY3JlYXRlLCBuZXdJbmRleCwgYXR0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlOiBJMThuRWxlbWVudE5vZGUgPSB7XG4gICAgICAgICAgICBraW5kOiBJMThuTm9kZUtpbmQuRUxFTUVOVCxcbiAgICAgICAgICAgIGluZGV4OiBuZXdJbmRleCxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGFzdC5wdXNoKGVsZW1lbnROb2RlKTtcbiAgICAgICAgICAvLyBQYXJzZSB0aGUgY2hpbGRyZW4gb2YgdGhpcyBub2RlIChpZiBhbnkpXG4gICAgICAgICAgYmluZGluZ01hc2sgPVxuICAgICAgICAgICAgICB3YWxrSWN1VHJlZShcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnROb2RlLmNoaWxkcmVuLCB0VmlldywgdEljdSwgbFZpZXcsIHNoYXJlZFVwZGF0ZU9wQ29kZXMsIGNyZWF0ZSwgcmVtb3ZlLFxuICAgICAgICAgICAgICAgICAgdXBkYXRlLCBjdXJyZW50Tm9kZSBhcyBFbGVtZW50LCBuZXdJbmRleCwgbmVzdGVkSWN1cywgZGVwdGggKyAxKSB8XG4gICAgICAgICAgICAgIGJpbmRpbmdNYXNrO1xuICAgICAgICAgIGFkZFJlbW92ZU5vZGUocmVtb3ZlLCBuZXdJbmRleCwgZGVwdGgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgY29uc3QgdmFsdWUgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgYWRkQ3JlYXRlTm9kZUFuZEFwcGVuZChjcmVhdGUsIG51bGwsIGhhc0JpbmRpbmcgPyAnJyA6IHZhbHVlLCBwYXJlbnRJZHgsIG5ld0luZGV4KTtcbiAgICAgICAgYWRkUmVtb3ZlTm9kZShyZW1vdmUsIG5ld0luZGV4LCBkZXB0aCk7XG4gICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgYmluZGluZ01hc2sgPVxuICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHVwZGF0ZSwgdmFsdWUsIG5ld0luZGV4LCBudWxsLCAwLCBudWxsKSB8IGJpbmRpbmdNYXNrO1xuICAgICAgICB9XG4gICAgICAgIGFzdC5wdXNoKHtcbiAgICAgICAgICBraW5kOiBJMThuTm9kZUtpbmQuVEVYVCxcbiAgICAgICAgICBpbmRleDogbmV3SW5kZXgsXG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21tZW50IG5vZGUgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBuZXN0ZWQgSUNVXG4gICAgICAgIGNvbnN0IGlzTmVzdGVkSWN1ID0gTkVTVEVEX0lDVS5leGVjKGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnKTtcbiAgICAgICAgaWYgKGlzTmVzdGVkSWN1KSB7XG4gICAgICAgICAgY29uc3QgbmVzdGVkSWN1SW5kZXggPSBwYXJzZUludChpc05lc3RlZEljdVsxXSwgMTApO1xuICAgICAgICAgIGNvbnN0IGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24gPSBuZXN0ZWRJY3VzW25lc3RlZEljdUluZGV4XTtcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGFkZENyZWF0ZU5vZGVBbmRBcHBlbmQoXG4gICAgICAgICAgICAgIGNyZWF0ZSwgSUNVX01BUktFUiwgbmdEZXZNb2RlID8gYG5lc3RlZCBJQ1UgJHtuZXN0ZWRJY3VJbmRleH1gIDogJycsIHBhcmVudElkeCxcbiAgICAgICAgICAgICAgbmV3SW5kZXgpO1xuICAgICAgICAgIGljdVN0YXJ0KGFzdCwgdFZpZXcsIGxWaWV3LCBzaGFyZWRVcGRhdGVPcENvZGVzLCBwYXJlbnRJZHgsIGljdUV4cHJlc3Npb24sIG5ld0luZGV4KTtcbiAgICAgICAgICBhZGRSZW1vdmVOZXN0ZWRJY3UocmVtb3ZlLCBuZXdJbmRleCwgZGVwdGgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICB9XG4gIHJldHVybiBiaW5kaW5nTWFzaztcbn1cblxuZnVuY3Rpb24gYWRkUmVtb3ZlTm9kZShyZW1vdmU6IEkxOG5SZW1vdmVPcENvZGVzLCBpbmRleDogbnVtYmVyLCBkZXB0aDogbnVtYmVyKSB7XG4gIGlmIChkZXB0aCA9PT0gMCkge1xuICAgIHJlbW92ZS5wdXNoKGluZGV4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmVOZXN0ZWRJY3UocmVtb3ZlOiBJMThuUmVtb3ZlT3BDb2RlcywgaW5kZXg6IG51bWJlciwgZGVwdGg6IG51bWJlcikge1xuICBpZiAoZGVwdGggPT09IDApIHtcbiAgICByZW1vdmUucHVzaCh+aW5kZXgpOyAgLy8gcmVtb3ZlIElDVSBhdCBgaW5kZXhgXG4gICAgcmVtb3ZlLnB1c2goaW5kZXgpOyAgIC8vIHJlbW92ZSBJQ1UgY29tbWVudCBhdCBgaW5kZXhgXG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkVXBkYXRlSWN1U3dpdGNoKFxuICAgIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXMsIGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIGluZGV4OiBudW1iZXIpIHtcbiAgdXBkYXRlLnB1c2goXG4gICAgICB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyksIDIsIC0xIC0gaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyxcbiAgICAgIGluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2gpO1xufVxuXG5mdW5jdGlvbiBhZGRVcGRhdGVJY3VVcGRhdGUodXBkYXRlOiBJMThuVXBkYXRlT3BDb2RlcywgYmluZGluZ01hc2s6IG51bWJlciwgaW5kZXg6IG51bWJlcikge1xuICB1cGRhdGUucHVzaChiaW5kaW5nTWFzaywgMSwgaW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGFkZENyZWF0ZU5vZGVBbmRBcHBlbmQoXG4gICAgY3JlYXRlOiBJY3VDcmVhdGVPcENvZGVzLCBtYXJrZXI6IG51bGx8SUNVX01BUktFUnxFTEVNRU5UX01BUktFUiwgdGV4dDogc3RyaW5nLFxuICAgIGFwcGVuZFRvUGFyZW50SWR4OiBudW1iZXIsIGNyZWF0ZUF0SWR4OiBudW1iZXIpIHtcbiAgaWYgKG1hcmtlciAhPT0gbnVsbCkge1xuICAgIGNyZWF0ZS5wdXNoKG1hcmtlcik7XG4gIH1cbiAgY3JlYXRlLnB1c2goXG4gICAgICB0ZXh0LCBjcmVhdGVBdElkeCxcbiAgICAgIGljdUNyZWF0ZU9wQ29kZShJY3VDcmVhdGVPcENvZGUuQXBwZW5kQ2hpbGQsIGFwcGVuZFRvUGFyZW50SWR4LCBjcmVhdGVBdElkeCkpO1xufVxuXG5mdW5jdGlvbiBhZGRDcmVhdGVBdHRyaWJ1dGUoY3JlYXRlOiBJY3VDcmVhdGVPcENvZGVzLCBuZXdJbmRleDogbnVtYmVyLCBhdHRyOiBBdHRyKSB7XG4gIGNyZWF0ZS5wdXNoKG5ld0luZGV4IDw8IEljdUNyZWF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJY3VDcmVhdGVPcENvZGUuQXR0ciwgYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcbn1cbiJdfQ==