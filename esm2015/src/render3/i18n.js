/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_i18n_closure_mode';
import '../util/ng_dev_mode';
import { DEFAULT_LOCALE_ID, getPluralCase } from '../i18n/localization';
import { getTemplateContent, SRCSET_ATTRS, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS } from '../sanitization/html_sanitizer';
import { getInertBodyHelper } from '../sanitization/inert_body';
import { _sanitizeUrl, sanitizeSrcset } from '../sanitization/url_sanitizer';
import { addAllToArray } from '../util/array_utils';
import { assertDataInRange, assertDefined, assertEqual } from '../util/assert';
import { bindingUpdated } from './bindings';
import { attachPatchData } from './context_discovery';
import { i18nMutateOpCodesToString, i18nUpdateOpCodesToString } from './i18n_debug';
import { setDelayProjection } from './instructions/all';
import { allocExpando, elementAttributeInternal, elementPropertyInternal, getOrCreateTNode, setInputsForProperty, setNgReflectProperties, textBindingInternal } from './instructions/shared';
import { NATIVE } from './interfaces/container';
import { getDocument } from './interfaces/document';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { isLContainer } from './interfaces/type_checks';
import { HEADER_OFFSET, RENDERER, T_HOST } from './interfaces/view';
import { appendChild, applyProjection, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getBindingIndex, getIsParent, getLView, getPreviousOrParentTNode, getTView, nextBindingIndex, setIsNotParent, setPreviousOrParentTNode } from './state';
import { attachDebugGetter } from './util/debug_utils';
import { renderStringify } from './util/misc_utils';
import { getNativeByIndex, getNativeByTNode, getTNode, load } from './util/view_utils';
const MARKER = `�`;
const ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;
const SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
const PH_REGEXP = /�(\/?[#*!]\d+):?\d*�/gi;
const BINDING_REGEXP = /�(\d+):?\d*�/gi;
const ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
// i18nPostprocess consts
const ROOT_TEMPLATE_ID = 0;
const PP_MULTI_VALUE_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]/;
const PP_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]|(�\/?\*\d+:\d+�)/g;
const PP_ICU_VARS_REGEXP = /({\s*)(VAR_(PLURAL|SELECT)(_\d+)?)(\s*,)/g;
const PP_ICU_PLACEHOLDERS_REGEXP = /{([A-Z0-9_]+)}/g;
const PP_ICUS_REGEXP = /�I18N_EXP_(ICU(_\d+)?)�/g;
const PP_CLOSE_TEMPLATE_REGEXP = /\/\*/;
const PP_TEMPLATE_ID_REGEXP = /\d+\:(\d+)/;
/**
 * Breaks pattern into strings and top level {...} blocks.
 * Can be used to break a message into text and ICU expressions, or to break an ICU expression into
 * keys and cases.
 * Original code from closure library, modified for Angular.
 *
 * @param pattern (sub)Pattern to be broken.
 *
 */
function extractParts(pattern) {
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
 * Parses text containing an ICU expression and produces a JSON object for it.
 * Original code from closure library, modified for Angular.
 *
 * @param pattern Text containing an ICU expression that needs to be parsed.
 *
 */
function parseICUBlock(pattern) {
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
    const parts = extractParts(pattern);
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
        const blocks = extractParts(parts[pos++]);
        if (cases.length > values.length) {
            values.push(blocks);
        }
    }
    // TODO(ocombe): support ICU expressions in attributes, see #21615
    return { type: icuType, mainBinding: mainBinding, cases, values };
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
 * This method is used for extracting a part of the message associated with a template. A translated
 * message can span multiple templates.
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
 * Generate the OpCodes to update the bindings of a string.
 *
 * @param str The string containing the bindings.
 * @param destinationNode Index of the destination node which will receive the binding.
 * @param attrName Name of the attribute, if the string belongs to an attribute.
 * @param sanitizeFn Sanitization function used to sanitize the string after update, if necessary.
 */
function generateBindingUpdateOpCodes(str, destinationNode, attrName, sanitizeFn = null) {
    const updateOpCodes = [null, null]; // Alloc space for mask and size
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
    updateOpCodes[0] = mask;
    updateOpCodes[1] = updateOpCodes.length - 2;
    return updateOpCodes;
}
function getBindingMask(icuExpression, mask = 0) {
    mask = mask | toMaskBit(icuExpression.mainBinding);
    let match;
    for (let i = 0; i < icuExpression.values.length; i++) {
        const valueArr = icuExpression.values[i];
        for (let j = 0; j < valueArr.length; j++) {
            const value = valueArr[j];
            if (typeof value === 'string') {
                while (match = BINDING_REGEXP.exec(value)) {
                    mask = mask | toMaskBit(parseInt(match[1], 10));
                }
            }
            else {
                mask = getBindingMask(value, mask);
            }
        }
    }
    return mask;
}
const i18nIndexStack = [];
let i18nIndexStackPointer = -1;
/**
 * Convert binding index to mask bit.
 *
 * Each index represents a single bit on the bit-mask. Because bit-mask only has 32 bits, we make
 * the 32nd bit share all masks for all bindings higher than 32. Since it is extremely rare to have
 * more than 32 bindings this will be hit very rarely. The downside of hitting this corner case is
 * that we will execute binding code more often than necessary. (penalty of performance)
 */
function toMaskBit(bindingIndex) {
    return 1 << Math.min(bindingIndex, 31);
}
const parentIndexStack = [];
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
 * - `�!{index}(:{block})�`/`�/!{index}(:{block})�`: *Projection Placeholder*:  Marks the
 *   beginning and end of <ng-content> that was embedded in the original translation block.
 *   The placeholder `index` points to the element index in the template instructions set.
 *   An optional `block` that matches the sub-template in which it was declared.
 * - `�*{index}:{block}�`/`�/*{index}:{block}�`: *Sub-template Placeholder*: Sub-templates must be
 *   split up and translated separately in each angular template function. The `index` points to the
 *   `template` instruction index. A `block` that matches the sub-template in which it was declared.
 *
 * @param index A unique index of the translation in the static block.
 * @param message The translation message.
 * @param subTemplateIndex Optional sub-template index in the `message`.
 *
 * @codeGenApi
 */
export function ɵɵi18nStart(index, message, subTemplateIndex) {
    const tView = getTView();
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nIndexStack[++i18nIndexStackPointer] = index;
    // We need to delay projections until `i18nEnd`
    setDelayProjection(true);
    if (tView.firstCreatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nStartFirstPass(getLView(), tView, index, message, subTemplateIndex);
    }
}
// Count for the number of vars that will be allocated for each i18n block.
// It is global because this is used in multiple functions that include loops and recursive calls.
// This is reset to 0 when `i18nStartFirstPass` is called.
let i18nVarsCount;
function allocNodeIndex(startIndex) {
    return startIndex + i18nVarsCount++;
}
/**
 * See `i18nStart` above.
 */
function i18nStartFirstPass(lView, tView, index, message, subTemplateIndex) {
    const startIndex = tView.blueprint.length - HEADER_OFFSET;
    i18nVarsCount = 0;
    const previousOrParentTNode = getPreviousOrParentTNode();
    const parentTNode = getIsParent() ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    let parentIndex = parentTNode && parentTNode !== lView[T_HOST] ? parentTNode.index - HEADER_OFFSET : index;
    let parentIndexPointer = 0;
    parentIndexStack[parentIndexPointer] = parentIndex;
    const createOpCodes = [];
    if (ngDevMode) {
        attachDebugGetter(createOpCodes, i18nMutateOpCodesToString);
    }
    // If the previous node wasn't the direct parent then we have a translation without top level
    // element and we need to keep a reference of the previous element if there is one. We should also
    // keep track whether an element was a parent node or not, so that the logic that consumes
    // the generated `I18nMutateOpCode`s can leverage this information to properly set TNode state
    // (whether it's a parent or sibling).
    if (index > 0 && previousOrParentTNode !== parentTNode) {
        let previousTNodeIndex = previousOrParentTNode.index - HEADER_OFFSET;
        // If current TNode is a sibling node, encode it using a negative index. This information is
        // required when the `Select` action is processed (see the `readCreateOpCodes` function).
        if (!getIsParent()) {
            previousTNodeIndex = ~previousTNodeIndex;
        }
        // Create an OpCode to select the previous TNode
        createOpCodes.push(previousTNodeIndex << 3 /* SHIFT_REF */ | 0 /* Select */);
    }
    const updateOpCodes = [];
    if (ngDevMode) {
        attachDebugGetter(updateOpCodes, i18nUpdateOpCodesToString);
    }
    const icuExpressions = [];
    if (message === '' && isRootTemplateMessage(subTemplateIndex)) {
        // If top level translation is an empty string, do not invoke additional processing
        // and just create op codes for empty text node instead.
        createOpCodes.push(message, allocNodeIndex(startIndex), parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
    }
    else {
        const templateTranslation = getTranslationForTemplate(message, subTemplateIndex);
        const msgParts = replaceNgsp(templateTranslation).split(PH_REGEXP);
        for (let i = 0; i < msgParts.length; i++) {
            let value = msgParts[i];
            if (i & 1) {
                // Odd indexes are placeholders (elements and sub-templates)
                if (value.charAt(0) === '/') {
                    // It is a closing tag
                    if (value.charAt(1) === "#" /* ELEMENT */) {
                        const phIndex = parseInt(value.substr(2), 10);
                        parentIndex = parentIndexStack[--parentIndexPointer];
                        createOpCodes.push(phIndex << 3 /* SHIFT_REF */ | 5 /* ElementEnd */);
                    }
                }
                else {
                    const phIndex = parseInt(value.substr(1), 10);
                    const isElement = value.charAt(0) === "#" /* ELEMENT */;
                    // The value represents a placeholder that we move to the designated index.
                    // Note: positive indicies indicate that a TNode with a given index should also be marked
                    // as parent while executing `Select` instruction.
                    createOpCodes.push((isElement ? phIndex : ~phIndex) << 3 /* SHIFT_REF */ |
                        0 /* Select */, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                    if (isElement) {
                        parentIndexStack[++parentIndexPointer] = parentIndex = phIndex;
                    }
                }
            }
            else {
                // Even indexes are text (including bindings & ICU expressions)
                const parts = extractParts(value);
                for (let j = 0; j < parts.length; j++) {
                    if (j & 1) {
                        // Odd indexes are ICU expressions
                        const icuExpression = parts[j];
                        // Verify that ICU expression has the right shape. Translations might contain invalid
                        // constructions (while original messages were correct), so ICU parsing at runtime may
                        // not succeed (thus `icuExpression` remains a string).
                        if (typeof icuExpression !== 'object') {
                            throw new Error(`Unable to parse ICU expression in "${templateTranslation}" message.`);
                        }
                        // Create the comment node that will anchor the ICU expression
                        const icuNodeIndex = allocNodeIndex(startIndex);
                        createOpCodes.push(COMMENT_MARKER, ngDevMode ? `ICU ${icuNodeIndex}` : '', icuNodeIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        // Update codes for the ICU expression
                        const mask = getBindingMask(icuExpression);
                        icuStart(icuExpressions, icuExpression, icuNodeIndex, icuNodeIndex);
                        // Since this is recursive, the last TIcu that was pushed is the one we want
                        const tIcuIndex = icuExpressions.length - 1;
                        updateOpCodes.push(toMaskBit(icuExpression.mainBinding), // mask of the main binding
                        3, // skip 3 opCodes if not changed
                        -1 - icuExpression.mainBinding, icuNodeIndex << 2 /* SHIFT_REF */ | 2 /* IcuSwitch */, tIcuIndex, mask, // mask of all the bindings of this ICU expression
                        2, // skip 2 opCodes if not changed
                        icuNodeIndex << 2 /* SHIFT_REF */ | 3 /* IcuUpdate */, tIcuIndex);
                    }
                    else if (parts[j] !== '') {
                        const text = parts[j];
                        // Even indexes are text (including bindings)
                        const hasBinding = text.match(BINDING_REGEXP);
                        // Create text nodes
                        const textNodeIndex = allocNodeIndex(startIndex);
                        createOpCodes.push(
                        // If there is a binding, the value will be set during update
                        hasBinding ? '' : text, textNodeIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        if (hasBinding) {
                            addAllToArray(generateBindingUpdateOpCodes(text, textNodeIndex), updateOpCodes);
                        }
                    }
                }
            }
        }
    }
    if (i18nVarsCount > 0) {
        allocExpando(tView, lView, i18nVarsCount);
    }
    // NOTE: local var needed to properly assert the type of `TI18n`.
    const tI18n = {
        vars: i18nVarsCount,
        create: createOpCodes,
        update: updateOpCodes,
        icus: icuExpressions.length ? icuExpressions : null,
    };
    tView.data[index + HEADER_OFFSET] = tI18n;
}
function appendI18nNode(tView, tNode, parentTNode, previousTNode, lView) {
    ngDevMode && ngDevMode.rendererMoveNode++;
    const nextNode = tNode.next;
    if (!previousTNode) {
        previousTNode = parentTNode;
    }
    // Re-organize node tree to put this node in the correct position.
    if (previousTNode === parentTNode && tNode !== parentTNode.child) {
        tNode.next = parentTNode.child;
        parentTNode.child = tNode;
    }
    else if (previousTNode !== parentTNode && tNode !== previousTNode.next) {
        tNode.next = previousTNode.next;
        previousTNode.next = tNode;
    }
    else {
        tNode.next = null;
    }
    if (parentTNode !== lView[T_HOST]) {
        tNode.parent = parentTNode;
    }
    // If tNode was moved around, we might need to fix a broken link.
    let cursor = tNode.next;
    while (cursor) {
        if (cursor.next === tNode) {
            cursor.next = nextNode;
        }
        cursor = cursor.next;
    }
    // If the placeholder to append is a projection, we need to move the projected nodes instead
    if (tNode.type === 1 /* Projection */) {
        applyProjection(tView, lView, tNode);
        return tNode;
    }
    appendChild(tView, lView, getNativeByTNode(tNode, lView), tNode);
    const slotValue = lView[tNode.index];
    if (tNode.type !== 0 /* Container */ && isLContainer(slotValue)) {
        // Nodes that inject ViewContainerRef also have a comment node that should be moved
        appendChild(tView, lView, slotValue[NATIVE], tNode);
    }
    return tNode;
}
function isRootTemplateMessage(subTemplateIndex) {
    return subTemplateIndex === undefined;
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
    /**
     * Step 1: resolve all multi-value placeholders like [�#5�|�*1:1��#2:1�|�#4:1�]
     *
     * Note: due to the way we process nested templates (BFS), multi-value placeholders are typically
     * grouped by templates, for example: [�#5�|�#6�|�#1:1�|�#3:2�] where �#5� and �#6� belong to root
     * template, �#1:1� belong to nested template with index 1 and �#1:2� - nested template with index
     * 3. However in real templates the order might be different: i.e. �#1:1� and/or �#3:2� may go in
     * front of �#6�. The post processing step restores the right order by keeping track of the
     * template id stack and looks for placeholders that belong to the currently active template.
     */
    let result = message;
    if (PP_MULTI_VALUE_PLACEHOLDERS_REGEXP.test(message)) {
        const matches = {};
        const templateIdsStack = [ROOT_TEMPLATE_ID];
        result = result.replace(PP_PLACEHOLDERS_REGEXP, (m, phs, tmpl) => {
            const content = phs || tmpl;
            const placeholders = matches[content] || [];
            if (!placeholders.length) {
                content.split('|').forEach((placeholder) => {
                    const match = placeholder.match(PP_TEMPLATE_ID_REGEXP);
                    const templateId = match ? parseInt(match[1], 10) : ROOT_TEMPLATE_ID;
                    const isCloseTemplateTag = PP_CLOSE_TEMPLATE_REGEXP.test(placeholder);
                    placeholders.push([templateId, isCloseTemplateTag, placeholder]);
                });
                matches[content] = placeholders;
            }
            if (!placeholders.length) {
                throw new Error(`i18n postprocess: unmatched placeholder - ${content}`);
            }
            const currentTemplateId = templateIdsStack[templateIdsStack.length - 1];
            let idx = 0;
            // find placeholder index that matches current template id
            for (let i = 0; i < placeholders.length; i++) {
                if (placeholders[i][0] === currentTemplateId) {
                    idx = i;
                    break;
                }
            }
            // update template id stack based on the current tag extracted
            const [templateId, isCloseTemplateTag, placeholder] = placeholders[idx];
            if (isCloseTemplateTag) {
                templateIdsStack.pop();
            }
            else if (currentTemplateId !== templateId) {
                templateIdsStack.push(templateId);
            }
            // remove processed tag from the list
            placeholders.splice(idx, 1);
            return placeholder;
        });
    }
    // return current result if no replacements specified
    if (!Object.keys(replacements).length) {
        return result;
    }
    /**
     * Step 2: replace all ICU vars (like "VAR_PLURAL")
     */
    result = result.replace(PP_ICU_VARS_REGEXP, (match, start, key, _type, _idx, end) => {
        return replacements.hasOwnProperty(key) ? `${start}${replacements[key]}${end}` : match;
    });
    /**
     * Step 3: replace all placeholders used inside ICUs in a form of {PLACEHOLDER}
     */
    result = result.replace(PP_ICU_PLACEHOLDERS_REGEXP, (match, key) => {
        return replacements.hasOwnProperty(key) ? replacements[key] : match;
    });
    /**
     * Step 4: replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�) in case
     * multiple ICUs have the same placeholder name
     */
    result = result.replace(PP_ICUS_REGEXP, (match, key) => {
        if (replacements.hasOwnProperty(key)) {
            const list = replacements[key];
            if (!list.length) {
                throw new Error(`i18n postprocess: unmatched ICU - ${match} with key: ${key}`);
            }
            return list.shift();
        }
        return match;
    });
    return result;
}
/**
 * Translates a translation block marked by `i18nStart` and `i18nEnd`. It inserts the text/ICU nodes
 * into the render tree, moves the placeholder nodes and removes the deleted nodes.
 *
 * @codeGenApi
 */
export function ɵɵi18nEnd() {
    const lView = getLView();
    const tView = getTView();
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nEndFirstPass(tView, lView);
    // Stop delaying projections
    setDelayProjection(false);
}
/**
 * See `i18nEnd` above.
 */
function i18nEndFirstPass(tView, lView) {
    ngDevMode &&
        assertEqual(getBindingIndex(), tView.bindingStartIndex, 'i18nEnd should be called before any binding');
    const rootIndex = i18nIndexStack[i18nIndexStackPointer--];
    const tI18n = tView.data[rootIndex + HEADER_OFFSET];
    ngDevMode && assertDefined(tI18n, `You should call i18nStart before i18nEnd`);
    // Find the last node that was added before `i18nEnd`
    const lastCreatedNode = getPreviousOrParentTNode();
    // Read the instructions to insert/move/remove DOM elements
    const visitedNodes = readCreateOpCodes(rootIndex, tI18n.create, tView, lView);
    // Remove deleted nodes
    let index = rootIndex + 1;
    while (index <= lastCreatedNode.index - HEADER_OFFSET) {
        if (visitedNodes.indexOf(index) === -1) {
            removeNode(tView, lView, index, /* markAsDetached */ true);
        }
        // Check if an element has any local refs and skip them
        const tNode = getTNode(tView, index);
        if (tNode &&
            (tNode.type === 0 /* Container */ || tNode.type === 3 /* Element */ ||
                tNode.type === 4 /* ElementContainer */) &&
            tNode.localNames !== null) {
            // Divide by 2 to get the number of local refs,
            // since they are stored as an array that also includes directive indexes,
            // i.e. ["localRef", directiveIndex, ...]
            index += tNode.localNames.length >> 1;
        }
        index++;
    }
}
/**
 * Creates and stores the dynamic TNode, and unhooks it from the tree for now.
 */
function createDynamicNodeAtIndex(tView, lView, index, type, native, name) {
    const previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    lView[index + HEADER_OFFSET] = native;
    // FIXME(misko): Why does this create A TNode??? I would not expect this to be here.
    const tNode = getOrCreateTNode(tView, lView[T_HOST], index, type, name, null);
    // We are creating a dynamic node, the previous tNode might not be pointing at this node.
    // We will link ourselves into the tree later with `appendI18nNode`.
    if (previousOrParentTNode && previousOrParentTNode.next === tNode) {
        previousOrParentTNode.next = null;
    }
    return tNode;
}
function readCreateOpCodes(index, createOpCodes, tView, lView) {
    const renderer = lView[RENDERER];
    let currentTNode = null;
    let previousTNode = null;
    const visitedNodes = [];
    for (let i = 0; i < createOpCodes.length; i++) {
        const opCode = createOpCodes[i];
        if (typeof opCode == 'string') {
            const textRNode = createTextNode(opCode, renderer);
            const textNodeIndex = createOpCodes[++i];
            ngDevMode && ngDevMode.rendererCreateTextNode++;
            previousTNode = currentTNode;
            currentTNode =
                createDynamicNodeAtIndex(tView, lView, textNodeIndex, 3 /* Element */, textRNode, null);
            visitedNodes.push(textNodeIndex);
            setIsNotParent();
        }
        else if (typeof opCode == 'number') {
            switch (opCode & 7 /* MASK_INSTRUCTION */) {
                case 1 /* AppendChild */:
                    const destinationNodeIndex = opCode >>> 17 /* SHIFT_PARENT */;
                    let destinationTNode;
                    if (destinationNodeIndex === index) {
                        // If the destination node is `i18nStart`, we don't have a
                        // top-level node and we should use the host node instead
                        destinationTNode = lView[T_HOST];
                    }
                    else {
                        destinationTNode = getTNode(tView, destinationNodeIndex);
                    }
                    ngDevMode &&
                        assertDefined(currentTNode, `You need to create or select a node before you can insert it into the DOM`);
                    previousTNode =
                        appendI18nNode(tView, currentTNode, destinationTNode, previousTNode, lView);
                    break;
                case 0 /* Select */:
                    // Negative indices indicate that a given TNode is a sibling node, not a parent node
                    // (see `i18nStartFirstPass` for additional information).
                    const isParent = opCode >= 0;
                    // FIXME(misko): This SHIFT_REF looks suspect as it does not have mask.
                    const nodeIndex = (isParent ? opCode : ~opCode) >>> 3 /* SHIFT_REF */;
                    visitedNodes.push(nodeIndex);
                    previousTNode = currentTNode;
                    currentTNode = getTNode(tView, nodeIndex);
                    if (currentTNode) {
                        setPreviousOrParentTNode(currentTNode, isParent);
                    }
                    break;
                case 5 /* ElementEnd */:
                    const elementIndex = opCode >>> 3 /* SHIFT_REF */;
                    previousTNode = currentTNode = getTNode(tView, elementIndex);
                    setPreviousOrParentTNode(currentTNode, false);
                    break;
                case 4 /* Attr */:
                    const elementNodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    const attrName = createOpCodes[++i];
                    const attrValue = createOpCodes[++i];
                    // This code is used for ICU expressions only, since we don't support
                    // directives/components in ICUs, we don't need to worry about inputs here
                    elementAttributeInternal(getTNode(tView, elementNodeIndex), lView, attrName, attrValue, null, null);
                    break;
                default:
                    throw new Error(`Unable to determine the type of mutate operation for "${opCode}"`);
            }
        }
        else {
            switch (opCode) {
                case COMMENT_MARKER:
                    const commentValue = createOpCodes[++i];
                    const commentNodeIndex = createOpCodes[++i];
                    ngDevMode &&
                        assertEqual(typeof commentValue, 'string', `Expected "${commentValue}" to be a comment node value`);
                    const commentRNode = renderer.createComment(commentValue);
                    ngDevMode && ngDevMode.rendererCreateComment++;
                    previousTNode = currentTNode;
                    currentTNode = createDynamicNodeAtIndex(tView, lView, commentNodeIndex, 5 /* IcuContainer */, commentRNode, null);
                    visitedNodes.push(commentNodeIndex);
                    attachPatchData(commentRNode, lView);
                    currentTNode.activeCaseIndex = null;
                    // We will add the case nodes later, during the update phase
                    setIsNotParent();
                    break;
                case ELEMENT_MARKER:
                    const tagNameValue = createOpCodes[++i];
                    const elementNodeIndex = createOpCodes[++i];
                    ngDevMode &&
                        assertEqual(typeof tagNameValue, 'string', `Expected "${tagNameValue}" to be an element node tag name`);
                    const elementRNode = renderer.createElement(tagNameValue);
                    ngDevMode && ngDevMode.rendererCreateElement++;
                    previousTNode = currentTNode;
                    currentTNode = createDynamicNodeAtIndex(tView, lView, elementNodeIndex, 3 /* Element */, elementRNode, tagNameValue);
                    visitedNodes.push(elementNodeIndex);
                    break;
                default:
                    throw new Error(`Unable to determine the type of mutate operation for "${opCode}"`);
            }
        }
    }
    setIsNotParent();
    return visitedNodes;
}
function readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, tView, lView, bypassCheckBit) {
    let caseCreated = false;
    for (let i = 0; i < updateOpCodes.length; i++) {
        // bit code to check if we should apply the next update
        const checkBit = updateOpCodes[i];
        // Number of opCodes to skip until next set of update codes
        const skipCodes = updateOpCodes[++i];
        if (bypassCheckBit || (checkBit & changeMask)) {
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
                        const nodeIndex = opCode >>> 2 /* SHIFT_REF */;
                        switch (opCode & 3 /* MASK_OPCODE */) {
                            case 1 /* Attr */:
                                const propName = updateOpCodes[++j];
                                const sanitizeFn = updateOpCodes[++j];
                                elementPropertyInternal(tView, getTNode(tView, nodeIndex), lView, propName, value, lView[RENDERER], sanitizeFn, false);
                                break;
                            case 0 /* Text */:
                                textBindingInternal(lView, nodeIndex, value);
                                break;
                            case 2 /* IcuSwitch */:
                                caseCreated = icuSwitchCase(tView, updateOpCodes[++j], nodeIndex, icus, lView, value);
                                break;
                            case 3 /* IcuUpdate */:
                                icuUpdateCase(tView, lView, updateOpCodes[++j], nodeIndex, bindingsStartIndex, icus, caseCreated);
                                break;
                        }
                    }
                }
            }
        }
        i += skipCodes;
    }
}
function icuUpdateCase(tView, lView, tIcuIndex, nodeIndex, bindingsStartIndex, tIcus, caseCreated) {
    const tIcu = tIcus[tIcuIndex];
    const icuTNode = getTNode(tView, nodeIndex);
    if (icuTNode.activeCaseIndex !== null) {
        readUpdateOpCodes(tIcu.update[icuTNode.activeCaseIndex], tIcus, bindingsStartIndex, changeMask, tView, lView, caseCreated);
    }
}
function icuSwitchCase(tView, tIcuIndex, nodeIndex, tIcus, lView, value) {
    const tIcu = tIcus[tIcuIndex];
    const icuTNode = getTNode(tView, nodeIndex);
    let caseCreated = false;
    // If there is an active case, delete the old nodes
    if (icuTNode.activeCaseIndex !== null) {
        const removeCodes = tIcu.remove[icuTNode.activeCaseIndex];
        for (let k = 0; k < removeCodes.length; k++) {
            const removeOpCode = removeCodes[k];
            const nodeOrIcuIndex = removeOpCode >>> 3 /* SHIFT_REF */;
            switch (removeOpCode & 7 /* MASK_INSTRUCTION */) {
                case 3 /* Remove */:
                    // Remove DOM element, but do *not* mark TNode as detached, since we are
                    // just switching ICU cases (while keeping the same TNode), so a DOM element
                    // representing a new ICU case will be re-created.
                    removeNode(tView, lView, nodeOrIcuIndex, /* markAsDetached */ false);
                    break;
                case 6 /* RemoveNestedIcu */:
                    removeNestedIcu(tView, tIcus, removeCodes, nodeOrIcuIndex, removeCodes[k + 1] >>> 3 /* SHIFT_REF */);
                    break;
            }
        }
    }
    // Update the active caseIndex
    const caseIndex = getCaseIndex(tIcu, value);
    icuTNode.activeCaseIndex = caseIndex !== -1 ? caseIndex : null;
    if (caseIndex > -1) {
        // Add the nodes for the new case
        readCreateOpCodes(-1 /* -1 means we don't have parent node */, tIcu.create[caseIndex], tView, lView);
        caseCreated = true;
    }
    return caseCreated;
}
function removeNestedIcu(tView, tIcus, removeCodes, nodeIndex, nestedIcuNodeIndex) {
    const nestedIcuTNode = getTNode(tView, nestedIcuNodeIndex);
    const activeIndex = nestedIcuTNode.activeCaseIndex;
    if (activeIndex !== null) {
        const nestedTIcu = tIcus[nodeIndex];
        // FIXME(misko): the fact that we are adding items to parent list looks very suspect!
        addAllToArray(nestedTIcu.remove[activeIndex], removeCodes);
    }
}
function removeNode(tView, lView, index, markAsDetached) {
    const removedPhTNode = getTNode(tView, index);
    const removedPhRNode = getNativeByIndex(index, lView);
    if (removedPhRNode) {
        nativeRemoveNode(lView[RENDERER], removedPhRNode);
    }
    const slotValue = load(lView, index);
    if (isLContainer(slotValue)) {
        const lContainer = slotValue;
        if (removedPhTNode.type !== 0 /* Container */) {
            nativeRemoveNode(lView[RENDERER], lContainer[NATIVE]);
        }
    }
    if (markAsDetached) {
        // Define this node as detached to avoid projecting it later
        removedPhTNode.flags |= 64 /* isDetached */;
    }
    ngDevMode && ngDevMode.rendererRemoveNode++;
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
 * @param message The translation message.
 * @param subTemplateIndex Optional sub-template index in the `message`.
 *
 * @codeGenApi
 */
export function ɵɵi18n(index, message, subTemplateIndex) {
    ɵɵi18nStart(index, message, subTemplateIndex);
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
export function ɵɵi18nAttributes(index, values) {
    const lView = getLView();
    const tView = getTView();
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nAttributesFirstPass(lView, tView, index, values);
}
/**
 * See `i18nAttributes` above.
 */
function i18nAttributesFirstPass(lView, tView, index, values) {
    const previousElement = getPreviousOrParentTNode();
    const previousElementIndex = previousElement.index - HEADER_OFFSET;
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
                    if (tView.firstCreatePass && tView.data[index + HEADER_OFFSET] === null) {
                        addAllToArray(generateBindingUpdateOpCodes(value, previousElementIndex, attrName), updateOpCodes);
                    }
                }
                else {
                    const tNode = getTNode(tView, previousElementIndex);
                    // Set attributes for Elements only, for other types (like ElementContainer),
                    // only set inputs below
                    if (tNode.type === 3 /* Element */) {
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
    if (tView.firstCreatePass && tView.data[index + HEADER_OFFSET] === null) {
        tView.data[index + HEADER_OFFSET] = updateOpCodes;
    }
}
let changeMask = 0b0;
let shiftsCounter = 0;
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
    if (bindingUpdated(lView, nextBindingIndex(), value)) {
        changeMask = changeMask | (1 << shiftsCounter);
    }
    shiftsCounter++;
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
    if (shiftsCounter) {
        const tView = getTView();
        ngDevMode && assertDefined(tView, `tView should be defined`);
        const tI18n = tView.data[index + HEADER_OFFSET];
        let updateOpCodes;
        let icus = null;
        if (Array.isArray(tI18n)) {
            updateOpCodes = tI18n;
        }
        else {
            updateOpCodes = tI18n.update;
            icus = tI18n.icus;
        }
        const bindingsStartIndex = getBindingIndex() - shiftsCounter - 1;
        const lView = getLView();
        readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, tView, lView, false);
        // Reset changeMask & maskBit to default for the next update cycle
        changeMask = 0b0;
        shiftsCounter = 0;
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
            case 1 /* plural */: {
                const resolvedCase = getPluralCase(bindingValue, getLocaleId());
                index = icuExpression.cases.indexOf(resolvedCase);
                if (index === -1 && resolvedCase !== 'other') {
                    index = icuExpression.cases.indexOf('other');
                }
                break;
            }
            case 0 /* select */: {
                index = icuExpression.cases.indexOf('other');
                break;
            }
        }
    }
    return index;
}
/**
 * Generate the OpCodes for ICU expressions.
 *
 * @param tIcus
 * @param icuExpression
 * @param startIndex
 * @param expandoStartIndex
 */
function icuStart(tIcus, icuExpression, startIndex, expandoStartIndex) {
    const createCodes = [];
    const removeCodes = [];
    const updateCodes = [];
    const vars = [];
    const childIcus = [];
    for (let i = 0; i < icuExpression.values.length; i++) {
        // Each value is an array of strings & other ICU expressions
        const valueArr = icuExpression.values[i];
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
        const icuCase = parseIcuCase(valueArr.join(''), startIndex, nestedIcus, tIcus, expandoStartIndex);
        createCodes.push(icuCase.create);
        removeCodes.push(icuCase.remove);
        updateCodes.push(icuCase.update);
        vars.push(icuCase.vars);
        childIcus.push(icuCase.childIcus);
    }
    const tIcu = {
        type: icuExpression.type,
        vars,
        childIcus,
        cases: icuExpression.cases,
        create: createCodes,
        remove: removeCodes,
        update: updateCodes
    };
    tIcus.push(tIcu);
    // Adding the maximum possible of vars needed (based on the cases with the most vars)
    i18nVarsCount += Math.max(...vars);
}
/**
 * Transforms a string template into an HTML template and a list of instructions used to update
 * attributes or nodes that contain bindings.
 *
 * @param unsafeHtml The string to parse
 * @param parentIndex
 * @param nestedIcus
 * @param tIcus
 * @param expandoStartIndex
 */
function parseIcuCase(unsafeHtml, parentIndex, nestedIcus, tIcus, expandoStartIndex) {
    const inertBodyHelper = getInertBodyHelper(getDocument());
    const inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
    if (!inertBodyElement) {
        throw new Error('Unable to generate inert body element');
    }
    const wrapper = getTemplateContent(inertBodyElement) || inertBodyElement;
    const opCodes = { vars: 0, childIcus: [], create: [], remove: [], update: [] };
    if (ngDevMode) {
        attachDebugGetter(opCodes.create, i18nMutateOpCodesToString);
        attachDebugGetter(opCodes.remove, i18nMutateOpCodesToString);
        attachDebugGetter(opCodes.update, i18nUpdateOpCodesToString);
    }
    parseNodes(wrapper.firstChild, opCodes, parentIndex, nestedIcus, tIcus, expandoStartIndex);
    return opCodes;
}
const NESTED_ICU = /�(\d+)�/;
/**
 * Parses a node, its children and its siblings, and generates the mutate & update OpCodes.
 *
 * @param currentNode The first node to parse
 * @param icuCase The data for the ICU expression case that contains those nodes
 * @param parentIndex Index of the current node's parent
 * @param nestedIcus Data for the nested ICU expressions that this case contains
 * @param tIcus Data for all ICU expressions of the current message
 * @param expandoStartIndex Expando start index for the current ICU expression
 */
function parseNodes(currentNode, icuCase, parentIndex, nestedIcus, tIcus, expandoStartIndex) {
    if (currentNode) {
        const nestedIcusToCreate = [];
        while (currentNode) {
            const nextNode = currentNode.nextSibling;
            const newIndex = expandoStartIndex + ++icuCase.vars;
            switch (currentNode.nodeType) {
                case Node.ELEMENT_NODE:
                    const element = currentNode;
                    const tagName = element.tagName.toLowerCase();
                    if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
                        // This isn't a valid element, we won't create an element for it
                        icuCase.vars--;
                    }
                    else {
                        icuCase.create.push(ELEMENT_MARKER, tagName, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        const elAttrs = element.attributes;
                        for (let i = 0; i < elAttrs.length; i++) {
                            const attr = elAttrs.item(i);
                            const lowerAttrName = attr.name.toLowerCase();
                            const hasBinding = !!attr.value.match(BINDING_REGEXP);
                            // we assume the input string is safe, unless it's using a binding
                            if (hasBinding) {
                                if (VALID_ATTRS.hasOwnProperty(lowerAttrName)) {
                                    if (URI_ATTRS[lowerAttrName]) {
                                        addAllToArray(generateBindingUpdateOpCodes(attr.value, newIndex, attr.name, _sanitizeUrl), icuCase.update);
                                    }
                                    else if (SRCSET_ATTRS[lowerAttrName]) {
                                        addAllToArray(generateBindingUpdateOpCodes(attr.value, newIndex, attr.name, sanitizeSrcset), icuCase.update);
                                    }
                                    else {
                                        addAllToArray(generateBindingUpdateOpCodes(attr.value, newIndex, attr.name), icuCase.update);
                                    }
                                }
                                else {
                                    ngDevMode &&
                                        console.warn(`WARNING: ignoring unsafe attribute value ${lowerAttrName} on element ${tagName} (see http://g.co/ng/security#xss)`);
                                }
                            }
                            else {
                                icuCase.create.push(newIndex << 3 /* SHIFT_REF */ | 4 /* Attr */, attr.name, attr.value);
                            }
                        }
                        // Parse the children of this node (if any)
                        parseNodes(currentNode.firstChild, icuCase, newIndex, nestedIcus, tIcus, expandoStartIndex);
                        // Remove the parent node after the children
                        icuCase.remove.push(newIndex << 3 /* SHIFT_REF */ | 3 /* Remove */);
                    }
                    break;
                case Node.TEXT_NODE:
                    const value = currentNode.textContent || '';
                    const hasBinding = value.match(BINDING_REGEXP);
                    icuCase.create.push(hasBinding ? '' : value, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                    icuCase.remove.push(newIndex << 3 /* SHIFT_REF */ | 3 /* Remove */);
                    if (hasBinding) {
                        addAllToArray(generateBindingUpdateOpCodes(value, newIndex), icuCase.update);
                    }
                    break;
                case Node.COMMENT_NODE:
                    // Check if the comment node is a placeholder for a nested ICU
                    const match = NESTED_ICU.exec(currentNode.textContent || '');
                    if (match) {
                        const nestedIcuIndex = parseInt(match[1], 10);
                        const newLocal = ngDevMode ? `nested ICU ${nestedIcuIndex}` : '';
                        // Create the comment node that will anchor the ICU expression
                        icuCase.create.push(COMMENT_MARKER, newLocal, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        const nestedIcu = nestedIcus[nestedIcuIndex];
                        nestedIcusToCreate.push([nestedIcu, newIndex]);
                    }
                    else {
                        // We do not handle any other type of comment
                        icuCase.vars--;
                    }
                    break;
                default:
                    // We do not handle any other type of element
                    icuCase.vars--;
            }
            currentNode = nextNode;
        }
        for (let i = 0; i < nestedIcusToCreate.length; i++) {
            const nestedIcu = nestedIcusToCreate[i][0];
            const nestedIcuNodeIndex = nestedIcusToCreate[i][1];
            icuStart(tIcus, nestedIcu, nestedIcuNodeIndex, expandoStartIndex + icuCase.vars);
            // Since this is recursive, the last TIcu that was pushed is the one we want
            const nestTIcuIndex = tIcus.length - 1;
            icuCase.vars += Math.max(...tIcus[nestTIcuIndex].vars);
            icuCase.childIcus.push(nestTIcuIndex);
            const mask = getBindingMask(nestedIcu);
            icuCase.update.push(toMaskBit(nestedIcu.mainBinding), // mask of the main binding
            3, // skip 3 opCodes if not changed
            -1 - nestedIcu.mainBinding, nestedIcuNodeIndex << 2 /* SHIFT_REF */ | 2 /* IcuSwitch */, 
            // FIXME(misko): Index should be part of the opcode
            nestTIcuIndex, mask, // mask of all the bindings of this ICU expression
            2, // skip 2 opCodes if not changed
            nestedIcuNodeIndex << 2 /* SHIFT_REF */ | 3 /* IcuUpdate */, nestTIcuIndex);
            icuCase.remove.push(nestTIcuIndex << 3 /* SHIFT_REF */ | 6 /* RemoveNestedIcu */, 
            // FIXME(misko): Index should be part of the opcode
            nestedIcuNodeIndex << 3 /* SHIFT_REF */ | 3 /* Remove */);
        }
    }
}
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
 * The locale id that the application is currently using (for translations and ICU expressions).
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 */
let LOCALE_ID = DEFAULT_LOCALE_ID;
/**
 * Sets the locale id that will be used for translations and ICU expressions.
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 *
 * @param localeId
 */
export function setLocaleId(localeId) {
    assertDefined(localeId, `Expected localeId to be defined`);
    if (typeof localeId === 'string') {
        LOCALE_ID = localeId.toLowerCase().replace(/_/g, '-');
    }
}
/**
 * Gets the locale id that will be used for translations and ICU expressions.
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 */
export function getLocaleId() {
    return LOCALE_ID;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLDhCQUE4QixDQUFDO0FBQ3RDLE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4SCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNsRixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLHNCQUFzQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0wsT0FBTyxFQUFhLE1BQU0sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFB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RztBQUNILE1BQU0sVUFBVSxXQUFXO0lBQ3pCLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vdXRpbC9uZ19pMThuX2Nsb3N1cmVfbW9kZSc7XG5pbXBvcnQgJy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge0RFRkFVTFRfTE9DQUxFX0lELCBnZXRQbHVyYWxDYXNlfSBmcm9tICcuLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge2dldFRlbXBsYXRlQ29udGVudCwgU1JDU0VUX0FUVFJTLCBVUklfQVRUUlMsIFZBTElEX0FUVFJTLCBWQUxJRF9FTEVNRU5UU30gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7aTE4bk11dGF0ZU9wQ29kZXNUb1N0cmluZywgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZ30gZnJvbSAnLi9pMThuX2RlYnVnJztcbmltcG9ydCB7c2V0RGVsYXlQcm9qZWN0aW9ufSBmcm9tICcuL2luc3RydWN0aW9ucy9hbGwnO1xuaW1wb3J0IHthbGxvY0V4cGFuZG8sIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbCwgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwsIGdldE9yQ3JlYXRlVE5vZGUsIHNldElucHV0c0ZvclByb3BlcnR5LCBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzLCB0ZXh0QmluZGluZ0ludGVybmFsfSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtnZXREb2N1bWVudH0gZnJvbSAnLi9pbnRlcmZhY2VzL2RvY3VtZW50JztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIEljdVR5cGUsIFRJMThuLCBUSWN1fSBmcm9tICcuL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFJFTkRFUkVSLCBUX0hPU1QsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgYXBwbHlQcm9qZWN0aW9uLCBjcmVhdGVUZXh0Tm9kZSwgbmF0aXZlUmVtb3ZlTm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFRWaWV3LCBuZXh0QmluZGluZ0luZGV4LCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoRGVidWdHZXR0ZXJ9IGZyb20gJy4vdXRpbC9kZWJ1Z191dGlscyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgbG9hZH0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgSUNVX0JMT0NLX1JFR0VYUCA9IC9eXFxzKijvv71cXGQrOj9cXGQq77+9KVxccyosXFxzKihzZWxlY3R8cGx1cmFsKVxccyosLztcbmNvbnN0IFNVQlRFTVBMQVRFX1JFR0VYUCA9IC/vv71cXC8/XFwqKFxcZCs6XFxkKynvv70vZ2k7XG5jb25zdCBQSF9SRUdFWFAgPSAv77+9KFxcLz9bIyohXVxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgQklORElOR19SRUdFWFAgPSAv77+9KFxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgSUNVX1JFR0VYUCA9IC8oe1xccyrvv71cXGQrOj9cXGQq77+9XFxzKixcXHMqXFxTezZ9XFxzKixbXFxzXFxTXSp9KS9naTtcbmNvbnN0IGVudW0gVGFnVHlwZSB7XG4gIEVMRU1FTlQgPSAnIycsXG4gIFRFTVBMQVRFID0gJyonLFxuICBQUk9KRUNUSU9OID0gJyEnLFxufVxuXG4vLyBpMThuUG9zdHByb2Nlc3MgY29uc3RzXG5jb25zdCBST09UX1RFTVBMQVRFX0lEID0gMDtcbmNvbnN0IFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdLztcbmNvbnN0IFBQX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdfCjvv71cXC8/XFwqXFxkKzpcXGQr77+9KS9nO1xuY29uc3QgUFBfSUNVX1ZBUlNfUkVHRVhQID0gLyh7XFxzKikoVkFSXyhQTFVSQUx8U0VMRUNUKShfXFxkKyk/KShcXHMqLCkvZztcbmNvbnN0IFBQX0lDVV9QTEFDRUhPTERFUlNfUkVHRVhQID0gL3soW0EtWjAtOV9dKyl9L2c7XG5jb25zdCBQUF9JQ1VTX1JFR0VYUCA9IC/vv71JMThOX0VYUF8oSUNVKF9cXGQrKT8p77+9L2c7XG5jb25zdCBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAgPSAvXFwvXFwqLztcbmNvbnN0IFBQX1RFTVBMQVRFX0lEX1JFR0VYUCA9IC9cXGQrXFw6KFxcZCspLztcblxuLy8gUGFyc2VkIHBsYWNlaG9sZGVyIHN0cnVjdHVyZSB1c2VkIGluIHBvc3Rwcm9jZXNzaW5nICh3aXRoaW4gYGkxOG5Qb3N0cHJvY2Vzc2AgZnVuY3Rpb24pXG4vLyBDb250YWlucyB0aGUgZm9sbG93aW5nIGZpZWxkczogW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdXG50eXBlIFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXIgPSBbbnVtYmVyLCBib29sZWFuLCBzdHJpbmddO1xuXG5pbnRlcmZhY2UgSWN1RXhwcmVzc2lvbiB7XG4gIHR5cGU6IEljdVR5cGU7XG4gIG1haW5CaW5kaW5nOiBudW1iZXI7XG4gIGNhc2VzOiBzdHJpbmdbXTtcbiAgdmFsdWVzOiAoc3RyaW5nfEljdUV4cHJlc3Npb24pW11bXTtcbn1cblxuaW50ZXJmYWNlIEljdUNhc2Uge1xuICAvKipcbiAgICogTnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jYXRlIGluIGV4cGFuZG8gZm9yIHRoaXMgY2FzZS5cbiAgICpcbiAgICogVGhpcyBpcyB0aGUgbWF4IG51bWJlciBvZiBET00gZWxlbWVudHMgd2hpY2ggd2lsbCBiZSBjcmVhdGVkIGJ5IHRoaXMgaTE4biArIElDVSBibG9ja3MuIFdoZW5cbiAgICogdGhlIERPTSBlbGVtZW50cyBhcmUgYmVpbmcgY3JlYXRlZCB0aGV5IGFyZSBzdG9yZWQgaW4gdGhlIEVYUEFORE8sIHNvIHRoYXQgdXBkYXRlIE9wQ29kZXMgY2FuXG4gICAqIHdyaXRlIGludG8gdGhlbS5cbiAgICovXG4gIHZhcnM6IG51bWJlcjtcblxuICAvKipcbiAgICogQW4gb3B0aW9uYWwgYXJyYXkgb2YgY2hpbGQvc3ViIElDVXMuXG4gICAqL1xuICBjaGlsZEljdXM6IG51bWJlcltdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGJ1aWxkIHVwIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1VcbiAgICovXG4gIGNyZWF0ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gZGVzdHJveSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVLlxuICAgKi9cbiAgcmVtb3ZlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byB1cGRhdGUgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVSBiaW5kaW5ncy5cbiAgICovXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXM7XG59XG5cbi8qKlxuICogQnJlYWtzIHBhdHRlcm4gaW50byBzdHJpbmdzIGFuZCB0b3AgbGV2ZWwgey4uLn0gYmxvY2tzLlxuICogQ2FuIGJlIHVzZWQgdG8gYnJlYWsgYSBtZXNzYWdlIGludG8gdGV4dCBhbmQgSUNVIGV4cHJlc3Npb25zLCBvciB0byBicmVhayBhbiBJQ1UgZXhwcmVzc2lvbiBpbnRvXG4gKiBrZXlzIGFuZCBjYXNlcy5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIChzdWIpUGF0dGVybiB0byBiZSBicm9rZW4uXG4gKlxuICovXG5mdW5jdGlvbiBleHRyYWN0UGFydHMocGF0dGVybjogc3RyaW5nKTogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdIHtcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgbGV0IHByZXZQb3MgPSAwO1xuICBjb25zdCBicmFjZVN0YWNrID0gW107XG4gIGNvbnN0IHJlc3VsdHM6IChzdHJpbmd8SWN1RXhwcmVzc2lvbilbXSA9IFtdO1xuICBjb25zdCBicmFjZXMgPSAvW3t9XS9nO1xuICAvLyBsYXN0SW5kZXggZG9lc24ndCBnZXQgc2V0IHRvIDAgc28gd2UgaGF2ZSB0by5cbiAgYnJhY2VzLmxhc3RJbmRleCA9IDA7XG5cbiAgbGV0IG1hdGNoO1xuICB3aGlsZSAobWF0Y2ggPSBicmFjZXMuZXhlYyhwYXR0ZXJuKSkge1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmluZGV4O1xuICAgIGlmIChtYXRjaFswXSA9PSAnfScpIHtcbiAgICAgIGJyYWNlU3RhY2sucG9wKCk7XG5cbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIEVuZCBvZiB0aGUgYmxvY2suXG4gICAgICAgIGNvbnN0IGJsb2NrID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgaWYgKElDVV9CTE9DS19SRUdFWFAudGVzdChibG9jaykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocGFyc2VJQ1VCbG9jayhibG9jaykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChibG9jayk7XG4gICAgICAgIH1cblxuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgICAgYnJhY2VTdGFjay5wdXNoKCd7Jyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcyk7XG4gIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdW10gPSBbXTtcbiAgbGV0IGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgbGV0IG1haW5CaW5kaW5nID0gMDtcbiAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShJQ1VfQkxPQ0tfUkVHRVhQLCBmdW5jdGlvbihzdHI6IHN0cmluZywgYmluZGluZzogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICAgIH1cbiAgICBtYWluQmluZGluZyA9IHBhcnNlSW50KGJpbmRpbmcuc3Vic3RyKDEpLCAxMCk7XG4gICAgcmV0dXJuICcnO1xuICB9KTtcblxuICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyhwYXR0ZXJuKSBhcyBzdHJpbmdbXTtcbiAgLy8gTG9va2luZyBmb3IgKGtleSBibG9jaykrIHNlcXVlbmNlLiBPbmUgb2YgdGhlIGtleXMgaGFzIHRvIGJlIFwib3RoZXJcIi5cbiAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgcGFydHMubGVuZ3RoOykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1twb3MrK10udHJpbSgpO1xuICAgIGlmIChpY3VUeXBlID09PSBJY3VUeXBlLnBsdXJhbCkge1xuICAgICAgLy8gS2V5IGNhbiBiZSBcIj14XCIsIHdlIGp1c3Qgd2FudCBcInhcIlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccyooPzo9KT8oXFx3KylcXHMqLywgJyQxJyk7XG4gICAgfVxuICAgIGlmIChrZXkubGVuZ3RoKSB7XG4gICAgICBjYXNlcy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gZXh0cmFjdFBhcnRzKHBhcnRzW3BvcysrXSkgYXMgc3RyaW5nW107XG4gICAgaWYgKGNhc2VzLmxlbmd0aCA+IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHZhbHVlcy5wdXNoKGJsb2Nrcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETyhvY29tYmUpOiBzdXBwb3J0IElDVSBleHByZXNzaW9ucyBpbiBhdHRyaWJ1dGVzLCBzZWUgIzIxNjE1XG4gIHJldHVybiB7dHlwZTogaWN1VHlwZSwgbWFpbkJpbmRpbmc6IG1haW5CaW5kaW5nLCBjYXNlcywgdmFsdWVzfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSBzdWItdGVtcGxhdGVzIG9mIGEgbWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBtYXRjaDtcbiAgbGV0IHJlcyA9ICcnO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICBsZXQgdGFnTWF0Y2hlZDtcblxuICB3aGlsZSAoKG1hdGNoID0gU1VCVEVNUExBVEVfUkVHRVhQLmV4ZWMobWVzc2FnZSkpICE9PSBudWxsKSB7XG4gICAgaWYgKCFpblRlbXBsYXRlKSB7XG4gICAgICByZXMgKz0gbWVzc2FnZS5zdWJzdHJpbmcoaW5kZXgsIG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIHRhZ01hdGNoZWQgPSBtYXRjaFsxXTtcbiAgICAgIGluVGVtcGxhdGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWF0Y2hbMF0gPT09IGAke01BUktFUn0vKiR7dGFnTWF0Y2hlZH0ke01BUktFUn1gKSB7XG4gICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXg7XG4gICAgICAgIGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGluVGVtcGxhdGUsIGZhbHNlLFxuICAgICAgICAgIGBUYWcgbWlzbWF0Y2g6IHVuYWJsZSB0byBmaW5kIHRoZSBlbmQgb2YgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB0aGUgdHJhbnNsYXRpb24gXCIke1xuICAgICAgICAgICAgICBtZXNzYWdlfVwiYCk7XG5cbiAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyKGluZGV4KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBhIHBhcnQgb2YgYSBtZXNzYWdlIGFuZCByZW1vdmVzIHRoZSByZXN0LlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIGV4dHJhY3RpbmcgYSBwYXJ0IG9mIHRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCBhIHRlbXBsYXRlLiBBIHRyYW5zbGF0ZWRcbiAqIG1lc3NhZ2UgY2FuIHNwYW4gbXVsdGlwbGUgdGVtcGxhdGVzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgaTE4bj5UcmFuc2xhdGUgPHNwYW4gKm5nSWY+bWU8L3NwYW4+ITwvZGl2PlxuICogYGBgXG4gKlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gY3JvcFxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggSW5kZXggb2YgdGhlIHN1Yi10ZW1wbGF0ZSB0byBleHRyYWN0LiBJZiB1bmRlZmluZWQgaXQgcmV0dXJucyB0aGVcbiAqIGV4dGVybmFsIHRlbXBsYXRlIGFuZCByZW1vdmVzIGFsbCBzdWItdGVtcGxhdGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgaWYgKGlzUm9vdFRlbXBsYXRlTWVzc2FnZShzdWJUZW1wbGF0ZUluZGV4KSkge1xuICAgIC8vIFdlIHdhbnQgdGhlIHJvb3QgdGVtcGxhdGUgbWVzc2FnZSwgaWdub3JlIGFsbCBzdWItdGVtcGxhdGVzXG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSB3YW50IGEgc3BlY2lmaWMgc3ViLXRlbXBsYXRlXG4gICAgY29uc3Qgc3RhcnQgPVxuICAgICAgICBtZXNzYWdlLmluZGV4T2YoYDoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkgKyAyICsgc3ViVGVtcGxhdGVJbmRleC50b1N0cmluZygpLmxlbmd0aDtcbiAgICBjb25zdCBlbmQgPSBtZXNzYWdlLnNlYXJjaChuZXcgUmVnRXhwKGAke01BUktFUn1cXFxcL1xcXFwqXFxcXGQrOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSk7XG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlLnN1YnN0cmluZyhzdGFydCwgZW5kKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyB0byB1cGRhdGUgdGhlIGJpbmRpbmdzIG9mIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBiaW5kaW5ncy5cbiAqIEBwYXJhbSBkZXN0aW5hdGlvbk5vZGUgSW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIG5vZGUgd2hpY2ggd2lsbCByZWNlaXZlIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGF0dHJOYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSwgaWYgdGhlIHN0cmluZyBiZWxvbmdzIHRvIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZUZuIFNhbml0aXphdGlvbiBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSBzdHJpbmcgYWZ0ZXIgdXBkYXRlLCBpZiBuZWNlc3NhcnkuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgc3RyOiBzdHJpbmcsIGRlc3RpbmF0aW9uTm9kZTogbnVtYmVyLCBhdHRyTmFtZT86IHN0cmluZyxcbiAgICBzYW5pdGl6ZUZuOiBTYW5pdGl6ZXJGbnxudWxsID0gbnVsbCk6IEkxOG5VcGRhdGVPcENvZGVzIHtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbbnVsbCwgbnVsbF07ICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIodXBkYXRlT3BDb2RlcywgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gIH1cbiAgY29uc3QgdGV4dFBhcnRzID0gc3RyLnNwbGl0KEJJTkRJTkdfUkVHRVhQKTtcbiAgbGV0IG1hc2sgPSAwO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgdGV4dFBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgY29uc3QgdGV4dFZhbHVlID0gdGV4dFBhcnRzW2pdO1xuXG4gICAgaWYgKGogJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IHBhcnNlSW50KHRleHRWYWx1ZSwgMTApO1xuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKC0xIC0gYmluZGluZ0luZGV4KTtcbiAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIGlmICh0ZXh0VmFsdWUgIT09ICcnKSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHRcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCh0ZXh0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgIGRlc3RpbmF0aW9uTm9kZSA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8XG4gICAgICAoYXR0ck5hbWUgPyBJMThuVXBkYXRlT3BDb2RlLkF0dHIgOiBJMThuVXBkYXRlT3BDb2RlLlRleHQpKTtcbiAgaWYgKGF0dHJOYW1lKSB7XG4gICAgdXBkYXRlT3BDb2Rlcy5wdXNoKGF0dHJOYW1lLCBzYW5pdGl6ZUZuKTtcbiAgfVxuICB1cGRhdGVPcENvZGVzWzBdID0gbWFzaztcbiAgdXBkYXRlT3BDb2Rlc1sxXSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gMjtcbiAgcmV0dXJuIHVwZGF0ZU9wQ29kZXM7XG59XG5cbmZ1bmN0aW9uIGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIG1hc2sgPSAwKTogbnVtYmVyIHtcbiAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyk7XG4gIGxldCBtYXRjaDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpY3VFeHByZXNzaW9uLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlQXJyID0gaWN1RXhwcmVzc2lvbi52YWx1ZXNbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdoaWxlIChtYXRjaCA9IEJJTkRJTkdfUkVHRVhQLmV4ZWModmFsdWUpKSB7XG4gICAgICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQocGFyc2VJbnQobWF0Y2hbMV0sIDEwKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hc2sgPSBnZXRCaW5kaW5nTWFzayh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uLCBtYXNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hc2s7XG59XG5cbmNvbnN0IGkxOG5JbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xubGV0IGkxOG5JbmRleFN0YWNrUG9pbnRlciA9IC0xO1xuXG4vKipcbiAqIENvbnZlcnQgYmluZGluZyBpbmRleCB0byBtYXNrIGJpdC5cbiAqXG4gKiBFYWNoIGluZGV4IHJlcHJlc2VudHMgYSBzaW5nbGUgYml0IG9uIHRoZSBiaXQtbWFzay4gQmVjYXVzZSBiaXQtbWFzayBvbmx5IGhhcyAzMiBiaXRzLCB3ZSBtYWtlXG4gKiB0aGUgMzJuZCBiaXQgc2hhcmUgYWxsIG1hc2tzIGZvciBhbGwgYmluZGluZ3MgaGlnaGVyIHRoYW4gMzIuIFNpbmNlIGl0IGlzIGV4dHJlbWVseSByYXJlIHRvIGhhdmVcbiAqIG1vcmUgdGhhbiAzMiBiaW5kaW5ncyB0aGlzIHdpbGwgYmUgaGl0IHZlcnkgcmFyZWx5LiBUaGUgZG93bnNpZGUgb2YgaGl0dGluZyB0aGlzIGNvcm5lciBjYXNlIGlzXG4gKiB0aGF0IHdlIHdpbGwgZXhlY3V0ZSBiaW5kaW5nIGNvZGUgbW9yZSBvZnRlbiB0aGFuIG5lY2Vzc2FyeS4gKHBlbmFsdHkgb2YgcGVyZm9ybWFuY2UpXG4gKi9cbmZ1bmN0aW9uIHRvTWFza0JpdChiaW5kaW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IE1hdGgubWluKGJpbmRpbmdJbmRleCwgMzEpO1xufVxuXG5jb25zdCBwYXJlbnRJbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIE1hcmtzIGEgYmxvY2sgb2YgdGV4dCBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgIG1hcmsgdGhlIHRyYW5zbGF0aW9uIGJsb2NrIGluIHRoZSB0ZW1wbGF0ZS5cbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9IXtpbmRleH0oOntibG9ja30p77+9YC9g77+9LyF7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpQcm9qZWN0aW9uIFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZVxuICogICBiZWdpbm5pbmcgYW5kIGVuZCBvZiA8bmctY29udGVudD4gdGhhdCB3YXMgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLlxuICogICBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuXG4gKiAgIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuU3RhcnQoaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuSW5kZXhTdGFja1srK2kxOG5JbmRleFN0YWNrUG9pbnRlcl0gPSBpbmRleDtcbiAgLy8gV2UgbmVlZCB0byBkZWxheSBwcm9qZWN0aW9ucyB1bnRpbCBgaTE4bkVuZGBcbiAgc2V0RGVsYXlQcm9qZWN0aW9uKHRydWUpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIGkxOG5TdGFydEZpcnN0UGFzcyhnZXRMVmlldygpLCB0VmlldywgaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICB9XG59XG5cbi8vIENvdW50IGZvciB0aGUgbnVtYmVyIG9mIHZhcnMgdGhhdCB3aWxsIGJlIGFsbG9jYXRlZCBmb3IgZWFjaCBpMThuIGJsb2NrLlxuLy8gSXQgaXMgZ2xvYmFsIGJlY2F1c2UgdGhpcyBpcyB1c2VkIGluIG11bHRpcGxlIGZ1bmN0aW9ucyB0aGF0IGluY2x1ZGUgbG9vcHMgYW5kIHJlY3Vyc2l2ZSBjYWxscy5cbi8vIFRoaXMgaXMgcmVzZXQgdG8gMCB3aGVuIGBpMThuU3RhcnRGaXJzdFBhc3NgIGlzIGNhbGxlZC5cbmxldCBpMThuVmFyc0NvdW50OiBudW1iZXI7XG5cbmZ1bmN0aW9uIGFsbG9jTm9kZUluZGV4KHN0YXJ0SW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4blN0YXJ0YCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4blN0YXJ0Rmlyc3RQYXNzKFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJsdWVwcmludC5sZW5ndGggLSBIRUFERVJfT0ZGU0VUO1xuICBpMThuVmFyc0NvdW50ID0gMDtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHBhcmVudFROb2RlID1cbiAgICAgIGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4ID1cbiAgICAgIHBhcmVudFROb2RlICYmIHBhcmVudFROb2RlICE9PSBsVmlld1tUX0hPU1RdID8gcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUIDogaW5kZXg7XG4gIGxldCBwYXJlbnRJbmRleFBvaW50ZXIgPSAwO1xuICBwYXJlbnRJbmRleFN0YWNrW3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleDtcbiAgY29uc3QgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMgPSBbXTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKGNyZWF0ZU9wQ29kZXMsIGkxOG5NdXRhdGVPcENvZGVzVG9TdHJpbmcpO1xuICB9XG4gIC8vIElmIHRoZSBwcmV2aW91cyBub2RlIHdhc24ndCB0aGUgZGlyZWN0IHBhcmVudCB0aGVuIHdlIGhhdmUgYSB0cmFuc2xhdGlvbiB3aXRob3V0IHRvcCBsZXZlbFxuICAvLyBlbGVtZW50IGFuZCB3ZSBuZWVkIHRvIGtlZXAgYSByZWZlcmVuY2Ugb2YgdGhlIHByZXZpb3VzIGVsZW1lbnQgaWYgdGhlcmUgaXMgb25lLiBXZSBzaG91bGQgYWxzb1xuICAvLyBrZWVwIHRyYWNrIHdoZXRoZXIgYW4gZWxlbWVudCB3YXMgYSBwYXJlbnQgbm9kZSBvciBub3QsIHNvIHRoYXQgdGhlIGxvZ2ljIHRoYXQgY29uc3VtZXNcbiAgLy8gdGhlIGdlbmVyYXRlZCBgSTE4bk11dGF0ZU9wQ29kZWBzIGNhbiBsZXZlcmFnZSB0aGlzIGluZm9ybWF0aW9uIHRvIHByb3Blcmx5IHNldCBUTm9kZSBzdGF0ZVxuICAvLyAod2hldGhlciBpdCdzIGEgcGFyZW50IG9yIHNpYmxpbmcpLlxuICBpZiAoaW5kZXggPiAwICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAhPT0gcGFyZW50VE5vZGUpIHtcbiAgICBsZXQgcHJldmlvdXNUTm9kZUluZGV4ID0gcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgICAvLyBJZiBjdXJyZW50IFROb2RlIGlzIGEgc2libGluZyBub2RlLCBlbmNvZGUgaXQgdXNpbmcgYSBuZWdhdGl2ZSBpbmRleC4gVGhpcyBpbmZvcm1hdGlvbiBpc1xuICAgIC8vIHJlcXVpcmVkIHdoZW4gdGhlIGBTZWxlY3RgIGFjdGlvbiBpcyBwcm9jZXNzZWQgKHNlZSB0aGUgYHJlYWRDcmVhdGVPcENvZGVzYCBmdW5jdGlvbikuXG4gICAgaWYgKCFnZXRJc1BhcmVudCgpKSB7XG4gICAgICBwcmV2aW91c1ROb2RlSW5kZXggPSB+cHJldmlvdXNUTm9kZUluZGV4O1xuICAgIH1cbiAgICAvLyBDcmVhdGUgYW4gT3BDb2RlIHRvIHNlbGVjdCB0aGUgcHJldmlvdXMgVE5vZGVcbiAgICBjcmVhdGVPcENvZGVzLnB1c2gocHJldmlvdXNUTm9kZUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QpO1xuICB9XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcih1cGRhdGVPcENvZGVzLCBpMThuVXBkYXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgfVxuICBjb25zdCBpY3VFeHByZXNzaW9uczogVEljdVtdID0gW107XG5cbiAgaWYgKG1lc3NhZ2UgPT09ICcnICYmIGlzUm9vdFRlbXBsYXRlTWVzc2FnZShzdWJUZW1wbGF0ZUluZGV4KSkge1xuICAgIC8vIElmIHRvcCBsZXZlbCB0cmFuc2xhdGlvbiBpcyBhbiBlbXB0eSBzdHJpbmcsIGRvIG5vdCBpbnZva2UgYWRkaXRpb25hbCBwcm9jZXNzaW5nXG4gICAgLy8gYW5kIGp1c3QgY3JlYXRlIG9wIGNvZGVzIGZvciBlbXB0eSB0ZXh0IG5vZGUgaW5zdGVhZC5cbiAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgIG1lc3NhZ2UsIGFsbG9jTm9kZUluZGV4KHN0YXJ0SW5kZXgpLFxuICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRlbXBsYXRlVHJhbnNsYXRpb24gPSBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICAgIGNvbnN0IG1zZ1BhcnRzID0gcmVwbGFjZU5nc3AodGVtcGxhdGVUcmFuc2xhdGlvbikuc3BsaXQoUEhfUkVHRVhQKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdmFsdWUgPSBtc2dQYXJ0c1tpXTtcbiAgICAgIGlmIChpICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzIChlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcylcbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJy8nKSB7XG4gICAgICAgICAgLy8gSXQgaXMgYSBjbG9zaW5nIHRhZ1xuICAgICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMSkgPT09IFRhZ1R5cGUuRUxFTUVOVCkge1xuICAgICAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigyKSwgMTApO1xuICAgICAgICAgICAgcGFyZW50SW5kZXggPSBwYXJlbnRJbmRleFN0YWNrWy0tcGFyZW50SW5kZXhQb2ludGVyXTtcbiAgICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigxKSwgMTApO1xuICAgICAgICAgIGNvbnN0IGlzRWxlbWVudCA9IHZhbHVlLmNoYXJBdCgwKSA9PT0gVGFnVHlwZS5FTEVNRU5UO1xuICAgICAgICAgIC8vIFRoZSB2YWx1ZSByZXByZXNlbnRzIGEgcGxhY2Vob2xkZXIgdGhhdCB3ZSBtb3ZlIHRvIHRoZSBkZXNpZ25hdGVkIGluZGV4LlxuICAgICAgICAgIC8vIE5vdGU6IHBvc2l0aXZlIGluZGljaWVzIGluZGljYXRlIHRoYXQgYSBUTm9kZSB3aXRoIGEgZ2l2ZW4gaW5kZXggc2hvdWxkIGFsc28gYmUgbWFya2VkXG4gICAgICAgICAgLy8gYXMgcGFyZW50IHdoaWxlIGV4ZWN1dGluZyBgU2VsZWN0YCBpbnN0cnVjdGlvbi5cbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIChpc0VsZW1lbnQgPyBwaEluZGV4IDogfnBoSW5kZXgpIDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgICAgICAgICAgICAgIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgaWYgKGlzRWxlbWVudCkge1xuICAgICAgICAgICAgcGFyZW50SW5kZXhTdGFja1srK3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleCA9IHBoSW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncyAmIElDVSBleHByZXNzaW9ucylcbiAgICAgICAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHModmFsdWUpO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGogJiAxKSB7XG4gICAgICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgICAgICBjb25zdCBpY3VFeHByZXNzaW9uID0gcGFydHNbal0gYXMgSWN1RXhwcmVzc2lvbjtcblxuICAgICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgSUNVIGV4cHJlc3Npb24gaGFzIHRoZSByaWdodCBzaGFwZS4gVHJhbnNsYXRpb25zIG1pZ2h0IGNvbnRhaW4gaW52YWxpZFxuICAgICAgICAgICAgLy8gY29uc3RydWN0aW9ucyAod2hpbGUgb3JpZ2luYWwgbWVzc2FnZXMgd2VyZSBjb3JyZWN0KSwgc28gSUNVIHBhcnNpbmcgYXQgcnVudGltZSBtYXlcbiAgICAgICAgICAgIC8vIG5vdCBzdWNjZWVkICh0aHVzIGBpY3VFeHByZXNzaW9uYCByZW1haW5zIGEgc3RyaW5nKS5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgaWN1RXhwcmVzc2lvbiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgYFVuYWJsZSB0byBwYXJzZSBJQ1UgZXhwcmVzc2lvbiBpbiBcIiR7dGVtcGxhdGVUcmFuc2xhdGlvbn1cIiBtZXNzYWdlLmApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgY29uc3QgaWN1Tm9kZUluZGV4ID0gYWxsb2NOb2RlSW5kZXgoc3RhcnRJbmRleCk7XG4gICAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5nRGV2TW9kZSA/IGBJQ1UgJHtpY3VOb2RlSW5kZXh9YCA6ICcnLCBpY3VOb2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgICAgLy8gVXBkYXRlIGNvZGVzIGZvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uKTtcbiAgICAgICAgICAgIGljdVN0YXJ0KGljdUV4cHJlc3Npb25zLCBpY3VFeHByZXNzaW9uLCBpY3VOb2RlSW5kZXgsIGljdU5vZGVJbmRleCk7XG4gICAgICAgICAgICAvLyBTaW5jZSB0aGlzIGlzIHJlY3Vyc2l2ZSwgdGhlIGxhc3QgVEljdSB0aGF0IHdhcyBwdXNoZWQgaXMgdGhlIG9uZSB3ZSB3YW50XG4gICAgICAgICAgICBjb25zdCB0SWN1SW5kZXggPSBpY3VFeHByZXNzaW9ucy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICAgIHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgMyBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLCB0SWN1SW5kZXgsXG4gICAgICAgICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsIHRJY3VJbmRleCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tqXSAhPT0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBwYXJ0c1tqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncylcbiAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB0ZXh0Lm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGVzXG4gICAgICAgICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gYWxsb2NOb2RlSW5kZXgoc3RhcnRJbmRleCk7XG4gICAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBiaW5kaW5nLCB0aGUgdmFsdWUgd2lsbCBiZSBzZXQgZHVyaW5nIHVwZGF0ZVxuICAgICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHRleHQsIHRleHROb2RlSW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHRleHQsIHRleHROb2RlSW5kZXgpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaTE4blZhcnNDb3VudCA+IDApIHtcbiAgICBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBpMThuVmFyc0NvdW50KTtcbiAgfVxuXG4gIC8vIE5PVEU6IGxvY2FsIHZhciBuZWVkZWQgdG8gcHJvcGVybHkgYXNzZXJ0IHRoZSB0eXBlIG9mIGBUSTE4bmAuXG4gIGNvbnN0IHRJMThuOiBUSTE4biA9IHtcbiAgICB2YXJzOiBpMThuVmFyc0NvdW50LFxuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgaWN1czogaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLFxuICB9O1xuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHRJMThuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgcGFyZW50VE5vZGU6IFROb2RlLCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsLFxuICAgIGxWaWV3OiBMVmlldyk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIGNvbnN0IG5leHROb2RlID0gdE5vZGUubmV4dDtcbiAgaWYgKCFwcmV2aW91c1ROb2RlKSB7XG4gICAgcHJldmlvdXNUTm9kZSA9IHBhcmVudFROb2RlO1xuICB9XG5cbiAgLy8gUmUtb3JnYW5pemUgbm9kZSB0cmVlIHRvIHB1dCB0aGlzIG5vZGUgaW4gdGhlIGNvcnJlY3QgcG9zaXRpb24uXG4gIGlmIChwcmV2aW91c1ROb2RlID09PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcGFyZW50VE5vZGUuY2hpbGQpIHtcbiAgICB0Tm9kZS5uZXh0ID0gcGFyZW50VE5vZGUuY2hpbGQ7XG4gICAgcGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgfSBlbHNlIGlmIChwcmV2aW91c1ROb2RlICE9PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcHJldmlvdXNUTm9kZS5uZXh0KSB7XG4gICAgdE5vZGUubmV4dCA9IHByZXZpb3VzVE5vZGUubmV4dDtcbiAgICBwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICB0Tm9kZS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIGlmIChwYXJlbnRUTm9kZSAhPT0gbFZpZXdbVF9IT1NUXSkge1xuICAgIHROb2RlLnBhcmVudCA9IHBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgfVxuXG4gIC8vIElmIHROb2RlIHdhcyBtb3ZlZCBhcm91bmQsIHdlIG1pZ2h0IG5lZWQgdG8gZml4IGEgYnJva2VuIGxpbmsuXG4gIGxldCBjdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZS5uZXh0O1xuICB3aGlsZSAoY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvci5uZXh0ID09PSB0Tm9kZSkge1xuICAgICAgY3Vyc29yLm5leHQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gICAgY3Vyc29yID0gY3Vyc29yLm5leHQ7XG4gIH1cblxuICAvLyBJZiB0aGUgcGxhY2Vob2xkZXIgdG8gYXBwZW5kIGlzIGEgcHJvamVjdGlvbiwgd2UgbmVlZCB0byBtb3ZlIHRoZSBwcm9qZWN0ZWQgbm9kZXMgaW5zdGVhZFxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICBhcHBseVByb2plY3Rpb24odFZpZXcsIGxWaWV3LCB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGUpO1xuICAgIHJldHVybiB0Tm9kZTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKHRWaWV3LCBsVmlldywgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpLCB0Tm9kZSk7XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gbFZpZXdbdE5vZGUuaW5kZXhdO1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIE5vZGVzIHRoYXQgaW5qZWN0IFZpZXdDb250YWluZXJSZWYgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gICAgYXBwZW5kQ2hpbGQodFZpZXcsIGxWaWV3LCBzbG90VmFsdWVbTkFUSVZFXSwgdE5vZGUpO1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZnVuY3Rpb24gaXNSb290VGVtcGxhdGVNZXNzYWdlKHN1YlRlbXBsYXRlSW5kZXg6IG51bWJlcnx1bmRlZmluZWQpOiBzdWJUZW1wbGF0ZUluZGV4IGlzIHVuZGVmaW5lZCB7XG4gIHJldHVybiBzdWJUZW1wbGF0ZUluZGV4ID09PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgZm9yIGludGVybmF0aW9uYWxpemF0aW9uLlxuICpcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGJ5IHRyYW5zZm9ybWluZyBpdCBmcm9tIGludGVybWVkaWF0ZVxuICogZm9ybWF0ICh0aGF0IG1pZ2h0IGNvbnRhaW4gc29tZSBtYXJrZXJzIHRoYXQgd2UgbmVlZCB0byByZXBsYWNlKSB0byB0aGUgZmluYWxcbiAqIGZvcm0sIGNvbnN1bWFibGUgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uLiBQb3N0IHByb2Nlc3Npbmcgc3RlcHMgaW5jbHVkZTpcbiAqXG4gKiAxLiBSZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBjYXNlcyAobGlrZSBb77+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vXzvv70177+9XSlcbiAqIDIuIFJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICogMy4gUmVwbGFjZSBhbGwgcGxhY2Vob2xkZXJzIHVzZWQgaW5zaWRlIElDVXMgaW4gYSBmb3JtIG9mIHtQTEFDRUhPTERFUn1cbiAqIDQuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blBvc3Rwcm9jZXNzKFxuICAgIG1lc3NhZ2U6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7W2tleTogc3RyaW5nXTogKHN0cmluZ3xzdHJpbmdbXSl9ID0ge30pOiBzdHJpbmcge1xuICAvKipcbiAgICogU3RlcCAxOiByZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBwbGFjZWhvbGRlcnMgbGlrZSBb77+9IzXvv71877+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vV1cbiAgICpcbiAgICogTm90ZTogZHVlIHRvIHRoZSB3YXkgd2UgcHJvY2VzcyBuZXN0ZWQgdGVtcGxhdGVzIChCRlMpLCBtdWx0aS12YWx1ZSBwbGFjZWhvbGRlcnMgYXJlIHR5cGljYWxseVxuICAgKiBncm91cGVkIGJ5IHRlbXBsYXRlcywgZm9yIGV4YW1wbGU6IFvvv70jNe+/vXzvv70jNu+/vXzvv70jMTox77+9fO+/vSMzOjLvv71dIHdoZXJlIO+/vSM177+9IGFuZCDvv70jNu+/vSBiZWxvbmcgdG8gcm9vdFxuICAgKiB0ZW1wbGF0ZSwg77+9IzE6Me+/vSBiZWxvbmcgdG8gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXggMSBhbmQg77+9IzE6Mu+/vSAtIG5lc3RlZCB0ZW1wbGF0ZSB3aXRoIGluZGV4XG4gICAqIDMuIEhvd2V2ZXIgaW4gcmVhbCB0ZW1wbGF0ZXMgdGhlIG9yZGVyIG1pZ2h0IGJlIGRpZmZlcmVudDogaS5lLiDvv70jMTox77+9IGFuZC9vciDvv70jMzoy77+9IG1heSBnbyBpblxuICAgKiBmcm9udCBvZiDvv70jNu+/vS4gVGhlIHBvc3QgcHJvY2Vzc2luZyBzdGVwIHJlc3RvcmVzIHRoZSByaWdodCBvcmRlciBieSBrZWVwaW5nIHRyYWNrIG9mIHRoZVxuICAgKiB0ZW1wbGF0ZSBpZCBzdGFjayBhbmQgbG9va3MgZm9yIHBsYWNlaG9sZGVycyB0aGF0IGJlbG9uZyB0byB0aGUgY3VycmVudGx5IGFjdGl2ZSB0ZW1wbGF0ZS5cbiAgICovXG4gIGxldCByZXN1bHQ6IHN0cmluZyA9IG1lc3NhZ2U7XG4gIGlmIChQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQLnRlc3QobWVzc2FnZSkpIHtcbiAgICBjb25zdCBtYXRjaGVzOiB7W2tleTogc3RyaW5nXTogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdfSA9IHt9O1xuICAgIGNvbnN0IHRlbXBsYXRlSWRzU3RhY2s6IG51bWJlcltdID0gW1JPT1RfVEVNUExBVEVfSURdO1xuICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX1BMQUNFSE9MREVSU19SRUdFWFAsIChtOiBhbnksIHBoczogc3RyaW5nLCB0bXBsOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IHBocyB8fCB0bXBsO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJzOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW10gPSBtYXRjaGVzW2NvbnRlbnRdIHx8IFtdO1xuICAgICAgaWYgKCFwbGFjZWhvbGRlcnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRlbnQuc3BsaXQoJ3wnKS5mb3JFYWNoKChwbGFjZWhvbGRlcjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBwbGFjZWhvbGRlci5tYXRjaChQUF9URU1QTEFURV9JRF9SRUdFWFApO1xuICAgICAgICAgIGNvbnN0IHRlbXBsYXRlSWQgPSBtYXRjaCA/IHBhcnNlSW50KG1hdGNoWzFdLCAxMCkgOiBST09UX1RFTVBMQVRFX0lEO1xuICAgICAgICAgIGNvbnN0IGlzQ2xvc2VUZW1wbGF0ZVRhZyA9IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUC50ZXN0KHBsYWNlaG9sZGVyKTtcbiAgICAgICAgICBwbGFjZWhvbGRlcnMucHVzaChbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0pO1xuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlc1tjb250ZW50XSA9IHBsYWNlaG9sZGVycztcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGFjZWhvbGRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaTE4biBwb3N0cHJvY2VzczogdW5tYXRjaGVkIHBsYWNlaG9sZGVyIC0gJHtjb250ZW50fWApO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjdXJyZW50VGVtcGxhdGVJZCA9IHRlbXBsYXRlSWRzU3RhY2tbdGVtcGxhdGVJZHNTdGFjay5sZW5ndGggLSAxXTtcbiAgICAgIGxldCBpZHggPSAwO1xuICAgICAgLy8gZmluZCBwbGFjZWhvbGRlciBpbmRleCB0aGF0IG1hdGNoZXMgY3VycmVudCB0ZW1wbGF0ZSBpZFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFjZWhvbGRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBsYWNlaG9sZGVyc1tpXVswXSA9PT0gY3VycmVudFRlbXBsYXRlSWQpIHtcbiAgICAgICAgICBpZHggPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyB1cGRhdGUgdGVtcGxhdGUgaWQgc3RhY2sgYmFzZWQgb24gdGhlIGN1cnJlbnQgdGFnIGV4dHJhY3RlZFxuICAgICAgY29uc3QgW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdID0gcGxhY2Vob2xkZXJzW2lkeF07XG4gICAgICBpZiAoaXNDbG9zZVRlbXBsYXRlVGFnKSB7XG4gICAgICAgIHRlbXBsYXRlSWRzU3RhY2sucG9wKCk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRUZW1wbGF0ZUlkICE9PSB0ZW1wbGF0ZUlkKSB7XG4gICAgICAgIHRlbXBsYXRlSWRzU3RhY2sucHVzaCh0ZW1wbGF0ZUlkKTtcbiAgICAgIH1cbiAgICAgIC8vIHJlbW92ZSBwcm9jZXNzZWQgdGFnIGZyb20gdGhlIGxpc3RcbiAgICAgIHBsYWNlaG9sZGVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBwbGFjZWhvbGRlcjtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHJldHVybiBjdXJyZW50IHJlc3VsdCBpZiBubyByZXBsYWNlbWVudHMgc3BlY2lmaWVkXG4gIGlmICghT2JqZWN0LmtleXMocmVwbGFjZW1lbnRzKS5sZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0ZXAgMjogcmVwbGFjZSBhbGwgSUNVIHZhcnMgKGxpa2UgXCJWQVJfUExVUkFMXCIpXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VfVkFSU19SRUdFWFAsIChtYXRjaCwgc3RhcnQsIGtleSwgX3R5cGUsIF9pZHgsIGVuZCk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gYCR7c3RhcnR9JHtyZXBsYWNlbWVudHNba2V5XX0ke2VuZH1gIDogbWF0Y2g7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTdGVwIDM6IHJlcGxhY2UgYWxsIHBsYWNlaG9sZGVycyB1c2VkIGluc2lkZSBJQ1VzIGluIGEgZm9ybSBvZiB7UExBQ0VIT0xERVJ9XG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VfUExBQ0VIT0xERVJTX1JFR0VYUCwgKG1hdGNoLCBrZXkpOiBzdHJpbmcgPT4ge1xuICAgIHJldHVybiByZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSA/IHJlcGxhY2VtZW50c1trZXldIGFzIHN0cmluZyA6IG1hdGNoO1xuICB9KTtcblxuICAvKipcbiAgICogU3RlcCA0OiByZXBsYWNlIGFsbCBJQ1UgcmVmZXJlbmNlcyB3aXRoIGNvcnJlc3BvbmRpbmcgdmFsdWVzIChsaWtlIO+/vUlDVV9FWFBfSUNVXzHvv70pIGluIGNhc2VcbiAgICogbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVVNfUkVHRVhQLCAobWF0Y2gsIGtleSk6IHN0cmluZyA9PiB7XG4gICAgaWYgKHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBjb25zdCBsaXN0ID0gcmVwbGFjZW1lbnRzW2tleV0gYXMgc3RyaW5nW107XG4gICAgICBpZiAoIWxpc3QubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaTE4biBwb3N0cHJvY2VzczogdW5tYXRjaGVkIElDVSAtICR7bWF0Y2h9IHdpdGgga2V5OiAke2tleX1gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsaXN0LnNoaWZ0KCkhO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG1hcmtlZCBieSBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgLiBJdCBpbnNlcnRzIHRoZSB0ZXh0L0lDVSBub2Rlc1xuICogaW50byB0aGUgcmVuZGVyIHRyZWUsIG1vdmVzIHRoZSBwbGFjZWhvbGRlciBub2RlcyBhbmQgcmVtb3ZlcyB0aGUgZGVsZXRlZCBub2Rlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FbmQoKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5FbmRGaXJzdFBhc3ModFZpZXcsIGxWaWV3KTtcbiAgLy8gU3RvcCBkZWxheWluZyBwcm9qZWN0aW9uc1xuICBzZXREZWxheVByb2plY3Rpb24oZmFsc2UpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkVuZGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5FbmRGaXJzdFBhc3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBnZXRCaW5kaW5nSW5kZXgoKSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgJ2kxOG5FbmQgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcblxuICBjb25zdCByb290SW5kZXggPSBpMThuSW5kZXhTdGFja1tpMThuSW5kZXhTdGFja1BvaW50ZXItLV07XG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtyb290SW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUSTE4bjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEkxOG4sIGBZb3Ugc2hvdWxkIGNhbGwgaTE4blN0YXJ0IGJlZm9yZSBpMThuRW5kYCk7XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBub2RlIHRoYXQgd2FzIGFkZGVkIGJlZm9yZSBgaTE4bkVuZGBcbiAgY29uc3QgbGFzdENyZWF0ZWROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG5cbiAgLy8gUmVhZCB0aGUgaW5zdHJ1Y3Rpb25zIHRvIGluc2VydC9tb3ZlL3JlbW92ZSBET00gZWxlbWVudHNcbiAgY29uc3QgdmlzaXRlZE5vZGVzID0gcmVhZENyZWF0ZU9wQ29kZXMocm9vdEluZGV4LCB0STE4bi5jcmVhdGUsIHRWaWV3LCBsVmlldyk7XG5cbiAgLy8gUmVtb3ZlIGRlbGV0ZWQgbm9kZXNcbiAgbGV0IGluZGV4ID0gcm9vdEluZGV4ICsgMTtcbiAgd2hpbGUgKGluZGV4IDw9IGxhc3RDcmVhdGVkTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpIHtcbiAgICBpZiAodmlzaXRlZE5vZGVzLmluZGV4T2YoaW5kZXgpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZSh0VmlldywgbFZpZXcsIGluZGV4LCAvKiBtYXJrQXNEZXRhY2hlZCAqLyB0cnVlKTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgYW4gZWxlbWVudCBoYXMgYW55IGxvY2FsIHJlZnMgYW5kIHNraXAgdGhlbVxuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUodFZpZXcsIGluZGV4KTtcbiAgICBpZiAodE5vZGUgJiZcbiAgICAgICAgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHxcbiAgICAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSAmJlxuICAgICAgICB0Tm9kZS5sb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgICAvLyBEaXZpZGUgYnkgMiB0byBnZXQgdGhlIG51bWJlciBvZiBsb2NhbCByZWZzLFxuICAgICAgLy8gc2luY2UgdGhleSBhcmUgc3RvcmVkIGFzIGFuIGFycmF5IHRoYXQgYWxzbyBpbmNsdWRlcyBkaXJlY3RpdmUgaW5kZXhlcyxcbiAgICAgIC8vIGkuZS4gW1wibG9jYWxSZWZcIiwgZGlyZWN0aXZlSW5kZXgsIC4uLl1cbiAgICAgIGluZGV4ICs9IHROb2RlLmxvY2FsTmFtZXMubGVuZ3RoID4+IDE7XG4gICAgfVxuICAgIGluZGV4Kys7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBzdG9yZXMgdGhlIGR5bmFtaWMgVE5vZGUsIGFuZCB1bmhvb2tzIGl0IGZyb20gdGhlIHRyZWUgZm9yIG5vdy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUkVsZW1lbnR8UlRleHR8bnVsbCxcbiAgICBuYW1lOiBzdHJpbmd8bnVsbCk6IFRFbGVtZW50Tm9kZXxUSWN1Q29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSBuYXRpdmU7XG4gIC8vIEZJWE1FKG1pc2tvKTogV2h5IGRvZXMgdGhpcyBjcmVhdGUgQSBUTm9kZT8/PyBJIHdvdWxkIG5vdCBleHBlY3QgdGhpcyB0byBiZSBoZXJlLlxuICBjb25zdCB0Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCB0eXBlIGFzIGFueSwgbmFtZSwgbnVsbCk7XG5cbiAgLy8gV2UgYXJlIGNyZWF0aW5nIGEgZHluYW1pYyBub2RlLCB0aGUgcHJldmlvdXMgdE5vZGUgbWlnaHQgbm90IGJlIHBvaW50aW5nIGF0IHRoaXMgbm9kZS5cbiAgLy8gV2Ugd2lsbCBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlIGxhdGVyIHdpdGggYGFwcGVuZEkxOG5Ob2RlYC5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9PT0gdE5vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRDcmVhdGVPcENvZGVzKFxuICAgIGluZGV4OiBudW1iZXIsIGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IG51bWJlcltdIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGxldCBjdXJyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHZpc2l0ZWROb2RlczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUob3BDb2RlLCByZW5kZXJlcik7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIGN1cnJlbnRUTm9kZSA9XG4gICAgICAgICAgY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KHRWaWV3LCBsVmlldywgdGV4dE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCk7XG4gICAgICB2aXNpdGVkTm9kZXMucHVzaCh0ZXh0Tm9kZUluZGV4KTtcbiAgICAgIHNldElzTm90UGFyZW50KCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19JTlNUUlVDVElPTikge1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvblROb2RlOiBUTm9kZTtcbiAgICAgICAgICBpZiAoZGVzdGluYXRpb25Ob2RlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGVzdGluYXRpb24gbm9kZSBpcyBgaTE4blN0YXJ0YCwgd2UgZG9uJ3QgaGF2ZSBhXG4gICAgICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZSBhbmQgd2Ugc2hvdWxkIHVzZSB0aGUgaG9zdCBub2RlIGluc3RlYWRcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBsVmlld1tUX0hPU1RdITtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVzdGluYXRpb25UTm9kZSA9IGdldFROb2RlKHRWaWV3LCBkZXN0aW5hdGlvbk5vZGVJbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgY3VycmVudFROb2RlISxcbiAgICAgICAgICAgICAgICAgIGBZb3UgbmVlZCB0byBjcmVhdGUgb3Igc2VsZWN0IGEgbm9kZSBiZWZvcmUgeW91IGNhbiBpbnNlcnQgaXQgaW50byB0aGUgRE9NYCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9XG4gICAgICAgICAgICAgIGFwcGVuZEkxOG5Ob2RlKHRWaWV3LCBjdXJyZW50VE5vZGUhLCBkZXN0aW5hdGlvblROb2RlLCBwcmV2aW91c1ROb2RlLCBsVmlldyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3Q6XG4gICAgICAgICAgLy8gTmVnYXRpdmUgaW5kaWNlcyBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gVE5vZGUgaXMgYSBzaWJsaW5nIG5vZGUsIG5vdCBhIHBhcmVudCBub2RlXG4gICAgICAgICAgLy8gKHNlZSBgaTE4blN0YXJ0Rmlyc3RQYXNzYCBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbikuXG4gICAgICAgICAgY29uc3QgaXNQYXJlbnQgPSBvcENvZGUgPj0gMDtcbiAgICAgICAgICAvLyBGSVhNRShtaXNrbyk6IFRoaXMgU0hJRlRfUkVGIGxvb2tzIHN1c3BlY3QgYXMgaXQgZG9lcyBub3QgaGF2ZSBtYXNrLlxuICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IChpc1BhcmVudCA/IG9wQ29kZSA6IH5vcENvZGUpID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICB2aXNpdGVkTm9kZXMucHVzaChub2RlSW5kZXgpO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gZ2V0VE5vZGUodFZpZXcsIG5vZGVJbmRleCk7XG4gICAgICAgICAgaWYgKGN1cnJlbnRUTm9kZSkge1xuICAgICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgaXNQYXJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgY29uc3QgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlID0gZ2V0VE5vZGUodFZpZXcsIGVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBUaGlzIGNvZGUgaXMgdXNlZCBmb3IgSUNVIGV4cHJlc3Npb25zIG9ubHksIHNpbmNlIHdlIGRvbid0IHN1cHBvcnRcbiAgICAgICAgICAvLyBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaW4gSUNVcywgd2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpbnB1dHMgaGVyZVxuICAgICAgICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChcbiAgICAgICAgICAgICAgZ2V0VE5vZGUodFZpZXcsIGVsZW1lbnROb2RlSW5kZXgpLCBsVmlldywgYXR0ck5hbWUsIGF0dHJWYWx1ZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb21tZW50VmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHtjb21tZW50VmFsdWV9XCIgdG8gYmUgYSBjb21tZW50IG5vZGUgdmFsdWVgKTtcbiAgICAgICAgICBjb25zdCBjb21tZW50Uk5vZGUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KGNvbW1lbnRWYWx1ZSk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgdFZpZXcsIGxWaWV3LCBjb21tZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBjb21tZW50Uk5vZGUsIG51bGwpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb21tZW50Uk5vZGUsIGxWaWV3KTtcbiAgICAgICAgICAoY3VycmVudFROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlKS5hY3RpdmVDYXNlSW5kZXggPSBudWxsO1xuICAgICAgICAgIC8vIFdlIHdpbGwgYWRkIHRoZSBjYXNlIG5vZGVzIGxhdGVyLCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZVxuICAgICAgICAgIHNldElzTm90UGFyZW50KCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRUxFTUVOVF9NQVJLRVI6XG4gICAgICAgICAgY29uc3QgdGFnTmFtZVZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICB0eXBlb2YgdGFnTmFtZVZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7dGFnTmFtZVZhbHVlfVwiIHRvIGJlIGFuIGVsZW1lbnQgbm9kZSB0YWcgbmFtZWApO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRSTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQodGFnTmFtZVZhbHVlKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgICAgICAgICAgICB0VmlldywgbFZpZXcsIGVsZW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBlbGVtZW50Uk5vZGUsIHRhZ05hbWVWYWx1ZSk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goZWxlbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRJc05vdFBhcmVudCgpO1xuXG4gIHJldHVybiB2aXNpdGVkTm9kZXM7XG59XG5cbmZ1bmN0aW9uIHJlYWRVcGRhdGVPcENvZGVzKFxuICAgIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W118bnVsbCwgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsXG4gICAgY2hhbmdlTWFzazogbnVtYmVyLCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgYnlwYXNzQ2hlY2tCaXQ6IGJvb2xlYW4pIHtcbiAgbGV0IGNhc2VDcmVhdGVkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdXBkYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICBjb25zdCBjaGVja0JpdCA9IHVwZGF0ZU9wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgY29uc3Qgc2tpcENvZGVzID0gdXBkYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICBpZiAoYnlwYXNzQ2hlY2tCaXQgfHwgKGNoZWNrQml0ICYgY2hhbmdlTWFzaykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2hlY2tlZFxuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBvcENvZGUgcmVwcmVzZW50IGBpMThuRXhwYCB2YWx1ZXMgb2Zmc2V0LlxuICAgICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KGxWaWV3W2JpbmRpbmdzU3RhcnRJbmRleCAtIG9wQ29kZV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIFNhbml0aXplckZuIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChcbiAgICAgICAgICAgICAgICAgICAgdFZpZXcsIGdldFROb2RlKHRWaWV3LCBub2RlSW5kZXgpLCBsVmlldywgcHJvcE5hbWUsIHZhbHVlLCBsVmlld1tSRU5ERVJFUl0sXG4gICAgICAgICAgICAgICAgICAgIHNhbml0aXplRm4sIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldywgbm9kZUluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgY2FzZUNyZWF0ZWQgPSBpY3VTd2l0Y2hDYXNlKFxuICAgICAgICAgICAgICAgICAgICB0VmlldywgdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlciwgbm9kZUluZGV4LCBpY3VzISwgbFZpZXcsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICBpY3VVcGRhdGVDYXNlKFxuICAgICAgICAgICAgICAgICAgICB0VmlldywgbFZpZXcsIHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBudW1iZXIsIG5vZGVJbmRleCwgYmluZGluZ3NTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICBpY3VzISwgY2FzZUNyZWF0ZWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpICs9IHNraXBDb2RlcztcbiAgfVxufVxuXG5mdW5jdGlvbiBpY3VVcGRhdGVDYXNlKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0SWN1SW5kZXg6IG51bWJlciwgbm9kZUluZGV4OiBudW1iZXIsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIHRJY3VzOiBUSWN1W10sIGNhc2VDcmVhdGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHRJY3UgPSB0SWN1c1t0SWN1SW5kZXhdO1xuICBjb25zdCBpY3VUTm9kZSA9IGdldFROb2RlKHRWaWV3LCBub2RlSW5kZXgpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICBpZiAoaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgICAgIHRJY3UudXBkYXRlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleF0sIHRJY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssIHRWaWV3LCBsVmlldyxcbiAgICAgICAgY2FzZUNyZWF0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGljdVN3aXRjaENhc2UoXG4gICAgdFZpZXc6IFRWaWV3LCB0SWN1SW5kZXg6IG51bWJlciwgbm9kZUluZGV4OiBudW1iZXIsIHRJY3VzOiBUSWN1W10sIGxWaWV3OiBMVmlldyxcbiAgICB2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRJY3UgPSB0SWN1c1t0SWN1SW5kZXhdO1xuICBjb25zdCBpY3VUTm9kZSA9IGdldFROb2RlKHRWaWV3LCBub2RlSW5kZXgpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICBsZXQgY2FzZUNyZWF0ZWQgPSBmYWxzZTtcbiAgLy8gSWYgdGhlcmUgaXMgYW4gYWN0aXZlIGNhc2UsIGRlbGV0ZSB0aGUgb2xkIG5vZGVzXG4gIGlmIChpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICBjb25zdCByZW1vdmVDb2RlcyA9IHRJY3UucmVtb3ZlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleF07XG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmVDb2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgY29uc3QgcmVtb3ZlT3BDb2RlID0gcmVtb3ZlQ29kZXNba10gYXMgbnVtYmVyO1xuICAgICAgY29uc3Qgbm9kZU9ySWN1SW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgc3dpdGNoIChyZW1vdmVPcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfSU5TVFJVQ1RJT04pIHtcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZTpcbiAgICAgICAgICAvLyBSZW1vdmUgRE9NIGVsZW1lbnQsIGJ1dCBkbyAqbm90KiBtYXJrIFROb2RlIGFzIGRldGFjaGVkLCBzaW5jZSB3ZSBhcmVcbiAgICAgICAgICAvLyBqdXN0IHN3aXRjaGluZyBJQ1UgY2FzZXMgKHdoaWxlIGtlZXBpbmcgdGhlIHNhbWUgVE5vZGUpLCBzbyBhIERPTSBlbGVtZW50XG4gICAgICAgICAgLy8gcmVwcmVzZW50aW5nIGEgbmV3IElDVSBjYXNlIHdpbGwgYmUgcmUtY3JlYXRlZC5cbiAgICAgICAgICByZW1vdmVOb2RlKHRWaWV3LCBsVmlldywgbm9kZU9ySWN1SW5kZXgsIC8qIG1hcmtBc0RldGFjaGVkICovIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdTpcbiAgICAgICAgICByZW1vdmVOZXN0ZWRJY3UoXG4gICAgICAgICAgICAgIHRWaWV3LCB0SWN1cywgcmVtb3ZlQ29kZXMsIG5vZGVPckljdUluZGV4LFxuICAgICAgICAgICAgICByZW1vdmVDb2Rlc1trICsgMV0gYXMgbnVtYmVyID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVXBkYXRlIHRoZSBhY3RpdmUgY2FzZUluZGV4XG4gIGNvbnN0IGNhc2VJbmRleCA9IGdldENhc2VJbmRleCh0SWN1LCB2YWx1ZSk7XG4gIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuICBpZiAoY2FzZUluZGV4ID4gLTEpIHtcbiAgICAvLyBBZGQgdGhlIG5vZGVzIGZvciB0aGUgbmV3IGNhc2VcbiAgICByZWFkQ3JlYXRlT3BDb2RlcyhcbiAgICAgICAgLTEgLyogLTEgbWVhbnMgd2UgZG9uJ3QgaGF2ZSBwYXJlbnQgbm9kZSAqLywgdEljdS5jcmVhdGVbY2FzZUluZGV4XSwgdFZpZXcsIGxWaWV3KTtcbiAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIGNhc2VDcmVhdGVkO1xufVxuXG5mdW5jdGlvbiByZW1vdmVOZXN0ZWRJY3UoXG4gICAgdFZpZXc6IFRWaWV3LCB0SWN1czogVEljdVtdLCByZW1vdmVDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIG5vZGVJbmRleDogbnVtYmVyLFxuICAgIG5lc3RlZEljdU5vZGVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IG5lc3RlZEljdVROb2RlID0gZ2V0VE5vZGUodFZpZXcsIG5lc3RlZEljdU5vZGVJbmRleCkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gIGNvbnN0IGFjdGl2ZUluZGV4ID0gbmVzdGVkSWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4O1xuICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICBjb25zdCBuZXN0ZWRUSWN1ID0gdEljdXNbbm9kZUluZGV4XTtcbiAgICAvLyBGSVhNRShtaXNrbyk6IHRoZSBmYWN0IHRoYXQgd2UgYXJlIGFkZGluZyBpdGVtcyB0byBwYXJlbnQgbGlzdCBsb29rcyB2ZXJ5IHN1c3BlY3QhXG4gICAgYWRkQWxsVG9BcnJheShuZXN0ZWRUSWN1LnJlbW92ZVthY3RpdmVJbmRleF0sIHJlbW92ZUNvZGVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVOb2RlKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBtYXJrQXNEZXRhY2hlZDogYm9vbGVhbikge1xuICBjb25zdCByZW1vdmVkUGhUTm9kZSA9IGdldFROb2RlKHRWaWV3LCBpbmRleCk7XG4gIGNvbnN0IHJlbW92ZWRQaFJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpO1xuICBpZiAocmVtb3ZlZFBoUk5vZGUpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKGxWaWV3W1JFTkRFUkVSXSwgcmVtb3ZlZFBoUk5vZGUpO1xuICB9XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gbG9hZChsVmlldywgaW5kZXgpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMQ29udGFpbmVyO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gc2xvdFZhbHVlIGFzIExDb250YWluZXI7XG4gICAgaWYgKHJlbW92ZWRQaFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUobFZpZXdbUkVOREVSRVJdLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtYXJrQXNEZXRhY2hlZCkge1xuICAgIC8vIERlZmluZSB0aGlzIG5vZGUgYXMgZGV0YWNoZWQgdG8gYXZvaWQgcHJvamVjdGluZyBpdCBsYXRlclxuICAgIHJlbW92ZWRQaFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xufVxuXG4vKipcbiAqXG4gKiBVc2UgdGhpcyBpbnN0cnVjdGlvbiB0byBjcmVhdGUgYSB0cmFuc2xhdGlvbiBibG9jayB0aGF0IGRvZXNuJ3QgY29udGFpbiBhbnkgcGxhY2Vob2xkZXIuXG4gKiBJdCBjYWxscyBib3RoIHtAbGluayBpMThuU3RhcnR9IGFuZCB7QGxpbmsgaTE4bkVuZH0gaW4gb25lIGluc3RydWN0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuKGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICDJtcm1aTE4blN0YXJ0KGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgybXJtWkxOG5FbmQoKTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IGluIHRoZSBzdGF0aWMgYmxvY2tcbiAqIEBwYXJhbSB2YWx1ZXNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3MobFZpZXcsIHRWaWV3LCBpbmRleCwgdmFsdWVzKTtcbn1cblxuLyoqXG4gKiBTZWUgYGkxOG5BdHRyaWJ1dGVzYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3MobFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pIHtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50ID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudEluZGV4ID0gcHJldmlvdXNFbGVtZW50LmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKHVwZGF0ZU9wQ29kZXMsIGkxOG5VcGRhdGVPcENvZGVzVG9TdHJpbmcpO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG4gICAgY29uc3QgcGFydHMgPSBtZXNzYWdlLnNwbGl0KElDVV9SRUdFWFApO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFydHNbal07XG5cbiAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lDVSBleHByZXNzaW9ucyBhcmUgbm90IHlldCBzdXBwb3J0ZWQgaW4gYXR0cmlidXRlcycpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIXZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZSh0VmlldywgcHJldmlvdXNFbGVtZW50SW5kZXgpO1xuICAgICAgICAgIC8vIFNldCBhdHRyaWJ1dGVzIGZvciBFbGVtZW50cyBvbmx5LCBmb3Igb3RoZXIgdHlwZXMgKGxpa2UgRWxlbWVudENvbnRhaW5lciksXG4gICAgICAgICAgLy8gb25seSBzZXQgaW5wdXRzIGJlbG93XG4gICAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwodE5vZGUsIGxWaWV3LCBhdHRyTmFtZSwgdmFsdWUsIG51bGwsIG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGF0IGF0dHJpYnV0ZSBpcyBhIGRpcmVjdGl2ZSBpbnB1dFxuICAgICAgICAgIGNvbnN0IGRhdGFWYWx1ZSA9IHROb2RlLmlucHV0cyAhPT0gbnVsbCAmJiB0Tm9kZS5pbnB1dHNbYXR0ck5hbWVdO1xuICAgICAgICAgIGlmIChkYXRhVmFsdWUpIHtcbiAgICAgICAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KHRWaWV3LCBsVmlldywgZGF0YVZhbHVlLCBhdHRyTmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChwcmV2aW91c0VsZW1lbnRJbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG4gICAgICAgICAgICAgIHNldE5nUmVmbGVjdFByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdXBkYXRlT3BDb2RlcztcbiAgfVxufVxuXG5sZXQgY2hhbmdlTWFzayA9IDBiMDtcbmxldCBzaGlmdHNDb3VudGVyID0gMDtcblxuLyoqXG4gKiBTdG9yZXMgdGhlIHZhbHVlcyBvZiB0aGUgYmluZGluZ3MgZHVyaW5nIGVhY2ggdXBkYXRlIGN5Y2xlIGluIG9yZGVyIHRvIGRldGVybWluZSBpZiB3ZSBuZWVkIHRvXG4gKiB1cGRhdGUgdGhlIHRyYW5zbGF0ZWQgbm9kZXMuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBiaW5kaW5nJ3MgdmFsdWVcbiAqIEByZXR1cm5zIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBpdHNlbGYgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZFxuICogKGUuZy4gYGkxOG5FeHAoY3R4Lm5hbWUpKGN0eC50aXRsZSlgKVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkV4cDxUPih2YWx1ZTogVCk6IHR5cGVvZiDJtcm1aTE4bkV4cCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBuZXh0QmluZGluZ0luZGV4KCksIHZhbHVlKSkge1xuICAgIGNoYW5nZU1hc2sgPSBjaGFuZ2VNYXNrIHwgKDEgPDwgc2hpZnRzQ291bnRlcik7XG4gIH1cbiAgc2hpZnRzQ291bnRlcisrO1xuICByZXR1cm4gybXJtWkxOG5FeHA7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkFwcGx5KGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHNoaWZ0c0NvdW50ZXIpIHtcbiAgICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICAgIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdO1xuICAgIGxldCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcztcbiAgICBsZXQgaWN1czogVEljdVtdfG51bGwgPSBudWxsO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRJMThuKSkge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9IHRJMThuIGFzIEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gKHRJMThuIGFzIFRJMThuKS51cGRhdGU7XG4gICAgICBpY3VzID0gKHRJMThuIGFzIFRJMThuKS5pY3VzO1xuICAgIH1cbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBnZXRCaW5kaW5nSW5kZXgoKSAtIHNoaWZ0c0NvdW50ZXIgLSAxO1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICByZWFkVXBkYXRlT3BDb2Rlcyh1cGRhdGVPcENvZGVzLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssIHRWaWV3LCBsVmlldywgZmFsc2UpO1xuXG4gICAgLy8gUmVzZXQgY2hhbmdlTWFzayAmIG1hc2tCaXQgdG8gZGVmYXVsdCBmb3IgdGhlIG5leHQgdXBkYXRlIGN5Y2xlXG4gICAgY2hhbmdlTWFzayA9IDBiMDtcbiAgICBzaGlmdHNDb3VudGVyID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNhc2Ugb2YgYW4gSUNVIGV4cHJlc3Npb24gZGVwZW5kaW5nIG9uIHRoZSBtYWluIGJpbmRpbmcgdmFsdWVcbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGJpbmRpbmdWYWx1ZSBUaGUgdmFsdWUgb2YgdGhlIG1haW4gYmluZGluZyB1c2VkIGJ5IHRoaXMgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FzZUluZGV4KGljdUV4cHJlc3Npb246IFRJY3UsIGJpbmRpbmdWYWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXNlKGJpbmRpbmdWYWx1ZSwgZ2V0TG9jYWxlSWQoKSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIGZvciBJQ1UgZXhwcmVzc2lvbnMuXG4gKlxuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIHN0YXJ0SW5kZXhcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBpY3VTdGFydChcbiAgICB0SWN1czogVEljdVtdLCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBzdGFydEluZGV4OiBudW1iZXIsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjcmVhdGVDb2RlczogSTE4bk11dGF0ZU9wQ29kZXNbXSA9IFtdO1xuICBjb25zdCByZW1vdmVDb2RlczogSTE4bk11dGF0ZU9wQ29kZXNbXSA9IFtdO1xuICBjb25zdCB1cGRhdGVDb2RlczogSTE4blVwZGF0ZU9wQ29kZXNbXSA9IFtdO1xuICBjb25zdCB2YXJzID0gW107XG4gIGNvbnN0IGNoaWxkSWN1czogbnVtYmVyW11bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gRWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzICYgb3RoZXIgSUNVIGV4cHJlc3Npb25zXG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBjb25zdCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gbmVzdGVkIElDVSBleHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGljdUluZGV4ID0gbmVzdGVkSWN1cy5wdXNoKHZhbHVlIGFzIEljdUV4cHJlc3Npb24pIC0gMTtcbiAgICAgICAgLy8gUmVwbGFjZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb24gYnkgYSBjb21tZW50IG5vZGVcbiAgICAgICAgdmFsdWVBcnJbal0gPSBgPCEtLe+/vSR7aWN1SW5kZXh977+9LS0+YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaWN1Q2FzZTogSWN1Q2FzZSA9XG4gICAgICAgIHBhcnNlSWN1Q2FzZSh2YWx1ZUFyci5qb2luKCcnKSwgc3RhcnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICBjcmVhdGVDb2Rlcy5wdXNoKGljdUNhc2UuY3JlYXRlKTtcbiAgICByZW1vdmVDb2Rlcy5wdXNoKGljdUNhc2UucmVtb3ZlKTtcbiAgICB1cGRhdGVDb2Rlcy5wdXNoKGljdUNhc2UudXBkYXRlKTtcbiAgICB2YXJzLnB1c2goaWN1Q2FzZS52YXJzKTtcbiAgICBjaGlsZEljdXMucHVzaChpY3VDYXNlLmNoaWxkSWN1cyk7XG4gIH1cbiAgY29uc3QgdEljdTogVEljdSA9IHtcbiAgICB0eXBlOiBpY3VFeHByZXNzaW9uLnR5cGUsXG4gICAgdmFycyxcbiAgICBjaGlsZEljdXMsXG4gICAgY2FzZXM6IGljdUV4cHJlc3Npb24uY2FzZXMsXG4gICAgY3JlYXRlOiBjcmVhdGVDb2RlcyxcbiAgICByZW1vdmU6IHJlbW92ZUNvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlQ29kZXNcbiAgfTtcbiAgdEljdXMucHVzaCh0SWN1KTtcbiAgLy8gQWRkaW5nIHRoZSBtYXhpbXVtIHBvc3NpYmxlIG9mIHZhcnMgbmVlZGVkIChiYXNlZCBvbiB0aGUgY2FzZXMgd2l0aCB0aGUgbW9zdCB2YXJzKVxuICBpMThuVmFyc0NvdW50ICs9IE1hdGgubWF4KC4uLnZhcnMpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgdGVtcGxhdGUgaW50byBhbiBIVE1MIHRlbXBsYXRlIGFuZCBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdXBkYXRlXG4gKiBhdHRyaWJ1dGVzIG9yIG5vZGVzIHRoYXQgY29udGFpbiBiaW5kaW5ncy5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCBUaGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0gcGFyZW50SW5kZXhcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBwYXJzZUljdUNhc2UoXG4gICAgdW5zYWZlSHRtbDogc3RyaW5nLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sIHRJY3VzOiBUSWN1W10sXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IEljdUNhc2Uge1xuICBjb25zdCBpbmVydEJvZHlIZWxwZXIgPSBnZXRJbmVydEJvZHlIZWxwZXIoZ2V0RG9jdW1lbnQoKSk7XG4gIGNvbnN0IGluZXJ0Qm9keUVsZW1lbnQgPSBpbmVydEJvZHlIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudCh1bnNhZmVIdG1sKTtcbiAgaWYgKCFpbmVydEJvZHlFbGVtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZ2VuZXJhdGUgaW5lcnQgYm9keSBlbGVtZW50Jyk7XG4gIH1cbiAgY29uc3Qgd3JhcHBlciA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50ISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50O1xuICBjb25zdCBvcENvZGVzOiBJY3VDYXNlID0ge3ZhcnM6IDAsIGNoaWxkSWN1czogW10sIGNyZWF0ZTogW10sIHJlbW92ZTogW10sIHVwZGF0ZTogW119O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXR0YWNoRGVidWdHZXR0ZXIob3BDb2Rlcy5jcmVhdGUsIGkxOG5NdXRhdGVPcENvZGVzVG9TdHJpbmcpO1xuICAgIGF0dGFjaERlYnVnR2V0dGVyKG9wQ29kZXMucmVtb3ZlLCBpMThuTXV0YXRlT3BDb2Rlc1RvU3RyaW5nKTtcbiAgICBhdHRhY2hEZWJ1Z0dldHRlcihvcENvZGVzLnVwZGF0ZSwgaTE4blVwZGF0ZU9wQ29kZXNUb1N0cmluZyk7XG4gIH1cbiAgcGFyc2VOb2Rlcyh3cmFwcGVyLmZpcnN0Q2hpbGQsIG9wQ29kZXMsIHBhcmVudEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICByZXR1cm4gb3BDb2Rlcztcbn1cblxuY29uc3QgTkVTVEVEX0lDVSA9IC/vv70oXFxkKynvv70vO1xuXG4vKipcbiAqIFBhcnNlcyBhIG5vZGUsIGl0cyBjaGlsZHJlbiBhbmQgaXRzIHNpYmxpbmdzLCBhbmQgZ2VuZXJhdGVzIHRoZSBtdXRhdGUgJiB1cGRhdGUgT3BDb2Rlcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudE5vZGUgVGhlIGZpcnN0IG5vZGUgdG8gcGFyc2VcbiAqIEBwYXJhbSBpY3VDYXNlIFRoZSBkYXRhIGZvciB0aGUgSUNVIGV4cHJlc3Npb24gY2FzZSB0aGF0IGNvbnRhaW5zIHRob3NlIG5vZGVzXG4gKiBAcGFyYW0gcGFyZW50SW5kZXggSW5kZXggb2YgdGhlIGN1cnJlbnQgbm9kZSdzIHBhcmVudFxuICogQHBhcmFtIG5lc3RlZEljdXMgRGF0YSBmb3IgdGhlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbnMgdGhhdCB0aGlzIGNhc2UgY29udGFpbnNcbiAqIEBwYXJhbSB0SWN1cyBEYXRhIGZvciBhbGwgSUNVIGV4cHJlc3Npb25zIG9mIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleCBFeHBhbmRvIHN0YXJ0IGluZGV4IGZvciB0aGUgY3VycmVudCBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBwYXJzZU5vZGVzKFxuICAgIGN1cnJlbnROb2RlOiBOb2RlfG51bGwsIGljdUNhc2U6IEljdUNhc2UsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSxcbiAgICB0SWN1czogVEljdVtdLCBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5lc3RlZEljdXNUb0NyZWF0ZTogW0ljdUV4cHJlc3Npb24sIG51bWJlcl1bXSA9IFtdO1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgICAgY29uc3QgbmV4dE5vZGU6IE5vZGV8bnVsbCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBleHBhbmRvU3RhcnRJbmRleCArICsraWN1Q2FzZS52YXJzO1xuICAgICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGEgdmFsaWQgZWxlbWVudCwgd2Ugd29uJ3QgY3JlYXRlIGFuIGVsZW1lbnQgZm9yIGl0XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSE7XG4gICAgICAgICAgICAgIGNvbnN0IGxvd2VyQXR0ck5hbWUgPSBhdHRyLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9ICEhYXR0ci52YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGUgaW5wdXQgc3RyaW5nIGlzIHNhZmUsIHVubGVzcyBpdCdzIHVzaW5nIGEgYmluZGluZ1xuICAgICAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgICAgIGlmIChWQUxJRF9BVFRSUy5oYXNPd25Qcm9wZXJ0eShsb3dlckF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgaWYgKFVSSV9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBfc2FuaXRpemVVcmwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChTUkNTRVRfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgc2FuaXRpemVTcmNzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgV0FSTklORzogaWdub3JpbmcgdW5zYWZlIGF0dHJpYnV0ZSB2YWx1ZSAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlckF0dHJOYW1lfSBvbiBlbGVtZW50ICR7dGFnTmFtZX0gKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5BdHRyLCBhdHRyLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQYXJzZSB0aGUgY2hpbGRyZW4gb2YgdGhpcyBub2RlIChpZiBhbnkpXG4gICAgICAgICAgICBwYXJzZU5vZGVzKFxuICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmZpcnN0Q2hpbGQsIGljdUNhc2UsIG5ld0luZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBwYXJlbnQgbm9kZSBhZnRlciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICBoYXNCaW5kaW5nID8gJycgOiB2YWx1ZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBuZXdJbmRleCksIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvbW1lbnQgbm9kZSBpcyBhIHBsYWNlaG9sZGVyIGZvciBhIG5lc3RlZCBJQ1VcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IE5FU1RFRF9JQ1UuZXhlYyhjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJyk7XG4gICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VJbmRleCA9IHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgICAgICAgICBjb25zdCBuZXdMb2NhbCA9IG5nRGV2TW9kZSA/IGBuZXN0ZWQgSUNVICR7bmVzdGVkSWN1SW5kZXh9YCA6ICcnO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5ld0xvY2FsLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1ID0gbmVzdGVkSWN1c1tuZXN0ZWRJY3VJbmRleF07XG4gICAgICAgICAgICBuZXN0ZWRJY3VzVG9DcmVhdGUucHVzaChbbmVzdGVkSWN1LCBuZXdJbmRleF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkbyBub3QgaGFuZGxlIGFueSBvdGhlciB0eXBlIG9mIGNvbW1lbnRcbiAgICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBXZSBkbyBub3QgaGFuZGxlIGFueSBvdGhlciB0eXBlIG9mIGVsZW1lbnRcbiAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gbmV4dE5vZGUhO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVzdGVkSWN1c1RvQ3JlYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMF07XG4gICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMV07XG4gICAgICBpY3VTdGFydCh0SWN1cywgbmVzdGVkSWN1LCBuZXN0ZWRJY3VOb2RlSW5kZXgsIGV4cGFuZG9TdGFydEluZGV4ICsgaWN1Q2FzZS52YXJzKTtcbiAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgIGNvbnN0IG5lc3RUSWN1SW5kZXggPSB0SWN1cy5sZW5ndGggLSAxO1xuICAgICAgaWN1Q2FzZS52YXJzICs9IE1hdGgubWF4KC4uLnRJY3VzW25lc3RUSWN1SW5kZXhdLnZhcnMpO1xuICAgICAgaWN1Q2FzZS5jaGlsZEljdXMucHVzaChuZXN0VEljdUluZGV4KTtcbiAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhuZXN0ZWRJY3UpO1xuICAgICAgaWN1Q2FzZS51cGRhdGUucHVzaChcbiAgICAgICAgICB0b01hc2tCaXQobmVzdGVkSWN1Lm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAtMSAtIG5lc3RlZEljdS5tYWluQmluZGluZyxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCxcbiAgICAgICAgICAvLyBGSVhNRShtaXNrbyk6IEluZGV4IHNob3VsZCBiZSBwYXJ0IG9mIHRoZSBvcGNvZGVcbiAgICAgICAgICBuZXN0VEljdUluZGV4LFxuICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgpO1xuICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChcbiAgICAgICAgICBuZXN0VEljdUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3UsXG4gICAgICAgICAgLy8gRklYTUUobWlza28pOiBJbmRleCBzaG91bGQgYmUgcGFydCBvZiB0aGUgb3Bjb2RlXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuZ3VsYXIgRGFydCBpbnRyb2R1Y2VkICZuZ3NwOyBhcyBhIHBsYWNlaG9sZGVyIGZvciBub24tcmVtb3ZhYmxlIHNwYWNlLCBzZWU6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZGFydC1sYW5nL2FuZ3VsYXIvYmxvYi8wYmI2MTEzODdkMjlkNjViNWFmN2Y5ZDI1MTVhYjU3MWZkM2ZiZWU0L190ZXN0cy90ZXN0L2NvbXBpbGVyL3ByZXNlcnZlX3doaXRlc3BhY2VfdGVzdC5kYXJ0I0wyNS1MMzJcbiAqIEluIEFuZ3VsYXIgRGFydCAmbmdzcDsgaXMgY29udmVydGVkIHRvIHRoZSAweEU1MDAgUFVBIChQcml2YXRlIFVzZSBBcmVhcykgdW5pY29kZSBjaGFyYWN0ZXJcbiAqIGFuZCBsYXRlciBvbiByZXBsYWNlZCBieSBhIHNwYWNlLiBXZSBhcmUgcmUtaW1wbGVtZW50aW5nIHRoZSBzYW1lIGlkZWEgaGVyZSwgc2luY2UgdHJhbnNsYXRpb25zXG4gKiBtaWdodCBjb250YWluIHRoaXMgc3BlY2lhbCBjaGFyYWN0ZXIuXG4gKi9cbmNvbnN0IE5HU1BfVU5JQ09ERV9SRUdFWFAgPSAvXFx1RTUwMC9nO1xuZnVuY3Rpb24gcmVwbGFjZU5nc3AodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKE5HU1BfVU5JQ09ERV9SRUdFWFAsICcgJyk7XG59XG5cbi8qKlxuICogVGhlIGxvY2FsZSBpZCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBpcyBjdXJyZW50bHkgdXNpbmcgKGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucykuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKi9cbmxldCBMT0NBTEVfSUQgPSBERUZBVUxUX0xPQ0FMRV9JRDtcblxuLyoqXG4gKiBTZXRzIHRoZSBsb2NhbGUgaWQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zLlxuICogVGhpcyBpcyB0aGUgaXZ5IHZlcnNpb24gb2YgYExPQ0FMRV9JRGAgdGhhdCB3YXMgZGVmaW5lZCBhcyBhbiBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSB2aWV3IGVuZ2luZVxuICogYnV0IGlzIG5vdyBkZWZpbmVkIGFzIGEgZ2xvYmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBsb2NhbGVJZFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0TG9jYWxlSWQobG9jYWxlSWQ6IHN0cmluZykge1xuICBhc3NlcnREZWZpbmVkKGxvY2FsZUlkLCBgRXhwZWN0ZWQgbG9jYWxlSWQgdG8gYmUgZGVmaW5lZGApO1xuICBpZiAodHlwZW9mIGxvY2FsZUlkID09PSAnc3RyaW5nJykge1xuICAgIExPQ0FMRV9JRCA9IGxvY2FsZUlkLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpO1xuICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUlkKCk6IHN0cmluZyB7XG4gIHJldHVybiBMT0NBTEVfSUQ7XG59XG4iXX0=