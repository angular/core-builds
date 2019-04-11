/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SRCSET_ATTRS, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS, getTemplateContent } from '../sanitization/html_sanitizer';
import { InertBodyHelper } from '../sanitization/inert_body';
import { _sanitizeUrl, sanitizeSrcset } from '../sanitization/url_sanitizer';
import { addAllToArray } from '../util/array_utils';
import { assertDefined, assertEqual, assertGreaterThan } from '../util/assert';
import { attachPatchData } from './context_discovery';
import { attachI18nOpCodesDebug } from './debug';
import { ΔelementAttribute, Δload, ΔtextBinding } from './instructions/all';
import { allocExpando, createNodeAtIndex } from './instructions/shared';
import { NATIVE } from './interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { BINDING_INDEX, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from './interfaces/view';
import { appendChild, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getIsParent, getLView, getPreviousOrParentTNode, setIsParent, setPreviousOrParentTNode } from './state';
import { NO_CHANGE } from './tokens';
import { renderStringify } from './util/misc_utils';
import { getNativeByIndex, getNativeByTNode, getTNode, isLContainer } from './util/view_utils';
/** @type {?} */
const MARKER = `�`;
/** @type {?} */
const ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;
/** @type {?} */
const SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
/** @type {?} */
const PH_REGEXP = /�(\/?[#*]\d+):?\d*�/gi;
/** @type {?} */
const BINDING_REGEXP = /�(\d+):?\d*�/gi;
/** @type {?} */
const ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
// i18nPostprocess consts
/** @type {?} */
const ROOT_TEMPLATE_ID = 0;
/** @type {?} */
const PP_MULTI_VALUE_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]/;
/** @type {?} */
const PP_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]|(�\/?\*\d+:\d+�)/g;
/** @type {?} */
const PP_ICU_VARS_REGEXP = /({\s*)(VAR_(PLURAL|SELECT)(_\d+)?)(\s*,)/g;
/** @type {?} */
const PP_ICUS_REGEXP = /�I18N_EXP_(ICU(_\d+)?)�/g;
/** @type {?} */
const PP_CLOSE_TEMPLATE_REGEXP = /\/\*/;
/** @type {?} */
const PP_TEMPLATE_ID_REGEXP = /\d+\:(\d+)/;
/**
 * @record
 */
function IcuExpression() { }
if (false) {
    /** @type {?} */
    IcuExpression.prototype.type;
    /** @type {?} */
    IcuExpression.prototype.mainBinding;
    /** @type {?} */
    IcuExpression.prototype.cases;
    /** @type {?} */
    IcuExpression.prototype.values;
}
/**
 * @record
 */
function IcuCase() { }
if (false) {
    /**
     * Number of slots to allocate in expando for this case.
     *
     * This is the max number of DOM elements which will be created by this i18n + ICU blocks. When
     * the DOM elements are being created they are stored in the EXPANDO, so that update OpCodes can
     * write into them.
     * @type {?}
     */
    IcuCase.prototype.vars;
    /**
     * An optional array of child/sub ICUs.
     * @type {?}
     */
    IcuCase.prototype.childIcus;
    /**
     * A set of OpCodes to apply in order to build up the DOM render tree for the ICU
     * @type {?}
     */
    IcuCase.prototype.create;
    /**
     * A set of OpCodes to apply in order to destroy the DOM render tree for the ICU.
     * @type {?}
     */
    IcuCase.prototype.remove;
    /**
     * A set of OpCodes to apply in order to update the DOM render tree for the ICU bindings.
     * @type {?}
     */
    IcuCase.prototype.update;
}
/**
 * Breaks pattern into strings and top level {...} blocks.
 * Can be used to break a message into text and ICU expressions, or to break an ICU expression into
 * keys and cases.
 * Original code from closure library, modified for Angular.
 *
 * @param {?} pattern (sub)Pattern to be broken.
 *
 * @return {?}
 */
function extractParts(pattern) {
    if (!pattern) {
        return [];
    }
    /** @type {?} */
    let prevPos = 0;
    /** @type {?} */
    const braceStack = [];
    /** @type {?} */
    const results = [];
    /** @type {?} */
    const braces = /[{}]/g;
    // lastIndex doesn't get set to 0 so we have to.
    braces.lastIndex = 0;
    /** @type {?} */
    let match;
    while (match = braces.exec(pattern)) {
        /** @type {?} */
        const pos = match.index;
        if (match[0] == '}') {
            braceStack.pop();
            if (braceStack.length == 0) {
                // End of the block.
                /** @type {?} */
                const block = pattern.substring(prevPos, pos);
                if (ICU_BLOCK_REGEXP.test(block)) {
                    results.push(parseICUBlock(block));
                }
                else if (block) { // Don't push empty strings
                    results.push(block);
                }
                prevPos = pos + 1;
            }
        }
        else {
            if (braceStack.length == 0) {
                /** @type {?} */
                const substring = pattern.substring(prevPos, pos);
                results.push(substring);
                prevPos = pos + 1;
            }
            braceStack.push('{');
        }
    }
    /** @type {?} */
    const substring = pattern.substring(prevPos);
    if (substring != '') {
        results.push(substring);
    }
    return results;
}
/**
 * Parses text containing an ICU expression and produces a JSON object for it.
 * Original code from closure library, modified for Angular.
 *
 * @param {?} pattern Text containing an ICU expression that needs to be parsed.
 *
 * @return {?}
 */
function parseICUBlock(pattern) {
    /** @type {?} */
    const cases = [];
    /** @type {?} */
    const values = [];
    /** @type {?} */
    let icuType = 1 /* plural */;
    /** @type {?} */
    let mainBinding = 0;
    pattern = pattern.replace(ICU_BLOCK_REGEXP, (/**
     * @param {?} str
     * @param {?} binding
     * @param {?} type
     * @return {?}
     */
    function (str, binding, type) {
        if (type === 'select') {
            icuType = 0 /* select */;
        }
        else {
            icuType = 1 /* plural */;
        }
        mainBinding = parseInt(binding.substr(1), 10);
        return '';
    }));
    /** @type {?} */
    const parts = (/** @type {?} */ (extractParts(pattern)));
    // Looking for (key block)+ sequence. One of the keys has to be "other".
    for (let pos = 0; pos < parts.length;) {
        /** @type {?} */
        let key = parts[pos++].trim();
        if (icuType === 1 /* plural */) {
            // Key can be "=x", we just want "x"
            key = key.replace(/\s*(?:=)?(\w+)\s*/, '$1');
        }
        if (key.length) {
            cases.push(key);
        }
        /** @type {?} */
        const blocks = (/** @type {?} */ (extractParts(parts[pos++])));
        if (blocks.length) {
            values.push(blocks);
        }
    }
    assertGreaterThan(cases.indexOf('other'), -1, 'Missing key "other" in ICU statement.');
    // TODO(ocombe): support ICU expressions in attributes, see #21615
    return { type: icuType, mainBinding: mainBinding, cases, values };
}
/**
 * Removes everything inside the sub-templates of a message.
 * @param {?} message
 * @return {?}
 */
function removeInnerTemplateTranslation(message) {
    /** @type {?} */
    let match;
    /** @type {?} */
    let res = '';
    /** @type {?} */
    let index = 0;
    /** @type {?} */
    let inTemplate = false;
    /** @type {?} */
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
 * @param {?} message The message to crop
 * @param {?=} subTemplateIndex Index of the sub-template to extract. If undefined it returns the
 * external template and removes all sub-templates.
 * @return {?}
 */
export function getTranslationForTemplate(message, subTemplateIndex) {
    if (typeof subTemplateIndex !== 'number') {
        // We want the root template message, ignore all sub-templates
        return removeInnerTemplateTranslation(message);
    }
    else {
        // We want a specific sub-template
        /** @type {?} */
        const start = message.indexOf(`:${subTemplateIndex}${MARKER}`) + 2 + subTemplateIndex.toString().length;
        /** @type {?} */
        const end = message.search(new RegExp(`${MARKER}\\/\\*\\d+:${subTemplateIndex}${MARKER}`));
        return removeInnerTemplateTranslation(message.substring(start, end));
    }
}
/**
 * Generate the OpCodes to update the bindings of a string.
 *
 * @param {?} str The string containing the bindings.
 * @param {?} destinationNode Index of the destination node which will receive the binding.
 * @param {?=} attrName Name of the attribute, if the string belongs to an attribute.
 * @param {?=} sanitizeFn Sanitization function used to sanitize the string after update, if necessary.
 * @return {?}
 */
function generateBindingUpdateOpCodes(str, destinationNode, attrName, sanitizeFn = null) {
    /** @type {?} */
    const updateOpCodes = [null, null];
    // Alloc space for mask and size
    /** @type {?} */
    const textParts = str.split(BINDING_REGEXP);
    /** @type {?} */
    let mask = 0;
    for (let j = 0; j < textParts.length; j++) {
        /** @type {?} */
        const textValue = textParts[j];
        if (j & 1) {
            // Odd indexes are bindings
            /** @type {?} */
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
/**
 * @param {?} icuExpression
 * @param {?=} mask
 * @return {?}
 */
function getBindingMask(icuExpression, mask = 0) {
    mask = mask | toMaskBit(icuExpression.mainBinding);
    /** @type {?} */
    let match;
    for (let i = 0; i < icuExpression.values.length; i++) {
        /** @type {?} */
        const valueArr = icuExpression.values[i];
        for (let j = 0; j < valueArr.length; j++) {
            /** @type {?} */
            const value = valueArr[j];
            if (typeof value === 'string') {
                while (match = BINDING_REGEXP.exec(value)) {
                    mask = mask | toMaskBit(parseInt(match[1], 10));
                }
            }
            else {
                mask = getBindingMask((/** @type {?} */ (value)), mask);
            }
        }
    }
    return mask;
}
/** @type {?} */
const i18nIndexStack = [];
/** @type {?} */
let i18nIndexStackPointer = -1;
/**
 * Convert binding index to mask bit.
 *
 * Each index represents a single bit on the bit-mask. Because bit-mask only has 32 bits, we make
 * the 32nd bit share all masks for all bindings higher than 32. Since it is extremely rare to have
 * more than 32 bindings this will be hit very rarely. The downside of hitting this corner case is
 * that we will execute binding code more often than necessary. (penalty of performance)
 * @param {?} bindingIndex
 * @return {?}
 */
function toMaskBit(bindingIndex) {
    return 1 << Math.min(bindingIndex, 31);
}
/** @type {?} */
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
 * - `�*{index}:{block}�`/`�/*{index}:{block}�`: *Sub-template Placeholder*: Sub-templates must be
 *   split up and translated separately in each angular template function. The `index` points to the
 *   `template` instruction index. A `block` that matches the sub-template in which it was declared.
 *
 * \@codeGenApi
 * @param {?} index A unique index of the translation in the static block.
 * @param {?} message The translation message.
 * @param {?=} subTemplateIndex Optional sub-template index in the `message`.
 *
 * @return {?}
 */
export function Δi18nStart(index, message, subTemplateIndex) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nIndexStack[++i18nIndexStackPointer] = index;
    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nStartFirstPass(tView, index, message, subTemplateIndex);
    }
}
// Count for the number of vars that will be allocated for each i18n block.
// It is global because this is used in multiple functions that include loops and recursive calls.
// This is reset to 0 when `i18nStartFirstPass` is called.
/** @type {?} */
let i18nVarsCount;
/**
 * See `i18nStart` above.
 * @param {?} tView
 * @param {?} index
 * @param {?} message
 * @param {?=} subTemplateIndex
 * @return {?}
 */
function i18nStartFirstPass(tView, index, message, subTemplateIndex) {
    /** @type {?} */
    const viewData = getLView();
    /** @type {?} */
    const startIndex = tView.blueprint.length - HEADER_OFFSET;
    i18nVarsCount = 0;
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const parentTNode = getIsParent() ? getPreviousOrParentTNode() :
        previousOrParentTNode && previousOrParentTNode.parent;
    /** @type {?} */
    let parentIndex = parentTNode && parentTNode !== viewData[T_HOST] ? parentTNode.index - HEADER_OFFSET : index;
    /** @type {?} */
    let parentIndexPointer = 0;
    parentIndexStack[parentIndexPointer] = parentIndex;
    /** @type {?} */
    const createOpCodes = [];
    // If the previous node wasn't the direct parent then we have a translation without top level
    // element and we need to keep a reference of the previous element if there is one
    if (index > 0 && previousOrParentTNode !== parentTNode) {
        // Create an OpCode to select the previous TNode
        createOpCodes.push(previousOrParentTNode.index << 3 /* SHIFT_REF */ | 0 /* Select */);
    }
    /** @type {?} */
    const updateOpCodes = [];
    /** @type {?} */
    const icuExpressions = [];
    /** @type {?} */
    const templateTranslation = getTranslationForTemplate(message, subTemplateIndex);
    /** @type {?} */
    const msgParts = templateTranslation.split(PH_REGEXP);
    for (let i = 0; i < msgParts.length; i++) {
        /** @type {?} */
        let value = msgParts[i];
        if (i & 1) {
            // Odd indexes are placeholders (elements and sub-templates)
            if (value.charAt(0) === '/') {
                // It is a closing tag
                if (value.charAt(1) === '#') {
                    /** @type {?} */
                    const phIndex = parseInt(value.substr(2), 10);
                    parentIndex = parentIndexStack[--parentIndexPointer];
                    createOpCodes.push(phIndex << 3 /* SHIFT_REF */ | 5 /* ElementEnd */);
                }
            }
            else {
                /** @type {?} */
                const phIndex = parseInt(value.substr(1), 10);
                // The value represents a placeholder that we move to the designated index
                createOpCodes.push(phIndex << 3 /* SHIFT_REF */ | 0 /* Select */, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                if (value.charAt(0) === '#') {
                    parentIndexStack[++parentIndexPointer] = parentIndex = phIndex;
                }
            }
        }
        else {
            // Even indexes are text (including bindings & ICU expressions)
            /** @type {?} */
            const parts = extractParts(value);
            for (let j = 0; j < parts.length; j++) {
                if (j & 1) {
                    // Odd indexes are ICU expressions
                    // Create the comment node that will anchor the ICU expression
                    /** @type {?} */
                    const icuNodeIndex = startIndex + i18nVarsCount++;
                    createOpCodes.push(COMMENT_MARKER, ngDevMode ? `ICU ${icuNodeIndex}` : '', icuNodeIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                    // Update codes for the ICU expression
                    /** @type {?} */
                    const icuExpression = (/** @type {?} */ (parts[j]));
                    /** @type {?} */
                    const mask = getBindingMask(icuExpression);
                    icuStart(icuExpressions, icuExpression, icuNodeIndex, icuNodeIndex);
                    // Since this is recursive, the last TIcu that was pushed is the one we want
                    /** @type {?} */
                    const tIcuIndex = icuExpressions.length - 1;
                    updateOpCodes.push(toMaskBit(icuExpression.mainBinding), // mask of the main binding
                    3, // skip 3 opCodes if not changed
                    -1 - icuExpression.mainBinding, icuNodeIndex << 2 /* SHIFT_REF */ | 2 /* IcuSwitch */, tIcuIndex, mask, // mask of all the bindings of this ICU expression
                    2, // skip 2 opCodes if not changed
                    icuNodeIndex << 2 /* SHIFT_REF */ | 3 /* IcuUpdate */, tIcuIndex);
                }
                else if (parts[j] !== '') {
                    /** @type {?} */
                    const text = (/** @type {?} */ (parts[j]));
                    // Even indexes are text (including bindings)
                    /** @type {?} */
                    const hasBinding = text.match(BINDING_REGEXP);
                    // Create text nodes
                    /** @type {?} */
                    const textNodeIndex = startIndex + i18nVarsCount++;
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
    allocExpando(viewData, i18nVarsCount);
    ngDevMode &&
        attachI18nOpCodesDebug(createOpCodes, updateOpCodes, icuExpressions.length ? icuExpressions : null, viewData);
    // NOTE: local var needed to properly assert the type of `TI18n`.
    /** @type {?} */
    const tI18n = {
        vars: i18nVarsCount,
        create: createOpCodes,
        update: updateOpCodes,
        icus: icuExpressions.length ? icuExpressions : null,
    };
    tView.data[index + HEADER_OFFSET] = tI18n;
}
/**
 * @param {?} tNode
 * @param {?} parentTNode
 * @param {?} previousTNode
 * @return {?}
 */
function appendI18nNode(tNode, parentTNode, previousTNode) {
    ngDevMode && ngDevMode.rendererMoveNode++;
    /** @type {?} */
    const nextNode = tNode.next;
    /** @type {?} */
    const viewData = getLView();
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
    if (parentTNode !== viewData[T_HOST]) {
        tNode.parent = (/** @type {?} */ (parentTNode));
    }
    // If tNode was moved around, we might need to fix a broken link.
    /** @type {?} */
    let cursor = tNode.next;
    while (cursor) {
        if (cursor.next === tNode) {
            cursor.next = nextNode;
        }
        cursor = cursor.next;
    }
    appendChild(getNativeByTNode(tNode, viewData), tNode, viewData);
    /** @type {?} */
    const slotValue = viewData[tNode.index];
    if (tNode.type !== 0 /* Container */ && isLContainer(slotValue)) {
        // Nodes that inject ViewContainerRef also have a comment node that should be moved
        appendChild(slotValue[NATIVE], tNode, viewData);
    }
    return tNode;
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
 * 3. Replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�)
 *    in case multiple ICUs have the same placeholder name
 *
 * \@codeGenApi
 * @param {?} message Raw translation string for post processing
 * @param {?=} replacements Set of replacements that should be applied
 *
 * @return {?} Transformed string that can be consumed by i18nStart instruction
 *
 */
export function Δi18nPostprocess(message, replacements = {}) {
    /**
     * Step 1: resolve all multi-value placeholders like [�#5�|�*1:1��#2:1�|�#4:1�]
     *
     * Note: due to the way we process nested templates (BFS), multi-value placeholders are typically
     * grouped by templates, for example: [�#5�|�#6�|�#1:1�|�#3:2�] where �#5� and �#6� belong to root
     * template, �#1:1� belong to nested template with index 1 and �#1:2� - nested template with index
     * 3. However in real templates the order might be different: i.e. �#1:1� and/or �#3:2� may go in
     * front of �#6�. The post processing step restores the right order by keeping track of the
     * template id stack and looks for placeholders that belong to the currently active template.
     * @type {?}
     */
    let result = message;
    if (PP_MULTI_VALUE_PLACEHOLDERS_REGEXP.test(message)) {
        /** @type {?} */
        const matches = {};
        /** @type {?} */
        const templateIdsStack = [ROOT_TEMPLATE_ID];
        result = result.replace(PP_PLACEHOLDERS_REGEXP, (/**
         * @param {?} m
         * @param {?} phs
         * @param {?} tmpl
         * @return {?}
         */
        (m, phs, tmpl) => {
            /** @type {?} */
            const content = phs || tmpl;
            if (!matches[content]) {
                /** @type {?} */
                const placeholders = [];
                content.split('|').forEach((/**
                 * @param {?} placeholder
                 * @return {?}
                 */
                (placeholder) => {
                    /** @type {?} */
                    const match = placeholder.match(PP_TEMPLATE_ID_REGEXP);
                    /** @type {?} */
                    const templateId = match ? parseInt(match[1], 10) : ROOT_TEMPLATE_ID;
                    /** @type {?} */
                    const isCloseTemplateTag = PP_CLOSE_TEMPLATE_REGEXP.test(placeholder);
                    placeholders.push([templateId, isCloseTemplateTag, placeholder]);
                }));
                matches[content] = placeholders;
            }
            if (!matches[content].length) {
                throw new Error(`i18n postprocess: unmatched placeholder - ${content}`);
            }
            /** @type {?} */
            const currentTemplateId = templateIdsStack[templateIdsStack.length - 1];
            /** @type {?} */
            const placeholders = matches[content];
            /** @type {?} */
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
        }));
        // verify that we injected all values
        /** @type {?} */
        const hasUnmatchedValues = Object.keys(matches).some((/**
         * @param {?} key
         * @return {?}
         */
        key => !!matches[key].length));
        if (hasUnmatchedValues) {
            throw new Error(`i18n postprocess: unmatched values - ${JSON.stringify(matches)}`);
        }
    }
    // return current result if no replacements specified
    if (!Object.keys(replacements).length) {
        return result;
    }
    /**
     * Step 2: replace all ICU vars (like "VAR_PLURAL")
     */
    result = result.replace(PP_ICU_VARS_REGEXP, (/**
     * @param {?} match
     * @param {?} start
     * @param {?} key
     * @param {?} _type
     * @param {?} _idx
     * @param {?} end
     * @return {?}
     */
    (match, start, key, _type, _idx, end) => {
        return replacements.hasOwnProperty(key) ? `${start}${replacements[key]}${end}` : match;
    }));
    /**
     * Step 3: replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�) in case
     * multiple ICUs have the same placeholder name
     */
    result = result.replace(PP_ICUS_REGEXP, (/**
     * @param {?} match
     * @param {?} key
     * @return {?}
     */
    (match, key) => {
        if (replacements.hasOwnProperty(key)) {
            /** @type {?} */
            const list = (/** @type {?} */ (replacements[key]));
            if (!list.length) {
                throw new Error(`i18n postprocess: unmatched ICU - ${match} with key: ${key}`);
            }
            return (/** @type {?} */ (list.shift()));
        }
        return match;
    }));
    return result;
}
/**
 * Translates a translation block marked by `i18nStart` and `i18nEnd`. It inserts the text/ICU nodes
 * into the render tree, moves the placeholder nodes and removes the deleted nodes.
 *
 * \@codeGenApi
 * @return {?}
 */
export function Δi18nEnd() {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nEndFirstPass(tView);
}
/**
 * See `i18nEnd` above.
 * @param {?} tView
 * @return {?}
 */
function i18nEndFirstPass(tView) {
    /** @type {?} */
    const viewData = getLView();
    ngDevMode && assertEqual(viewData[BINDING_INDEX], viewData[TVIEW].bindingStartIndex, 'i18nEnd should be called before any binding');
    /** @type {?} */
    const rootIndex = i18nIndexStack[i18nIndexStackPointer--];
    /** @type {?} */
    const tI18n = (/** @type {?} */ (tView.data[rootIndex + HEADER_OFFSET]));
    ngDevMode && assertDefined(tI18n, `You should call i18nStart before i18nEnd`);
    // Find the last node that was added before `i18nEnd`
    /** @type {?} */
    let lastCreatedNode = getPreviousOrParentTNode();
    // Read the instructions to insert/move/remove DOM elements
    /** @type {?} */
    const visitedNodes = readCreateOpCodes(rootIndex, tI18n.create, tI18n.icus, viewData);
    // Remove deleted nodes
    for (let i = rootIndex + 1; i <= lastCreatedNode.index - HEADER_OFFSET; i++) {
        if (visitedNodes.indexOf(i) === -1) {
            removeNode(i, viewData);
        }
    }
}
/**
 * Creates and stores the dynamic TNode, and unhooks it from the tree for now.
 * @param {?} index
 * @param {?} type
 * @param {?} native
 * @param {?} name
 * @return {?}
 */
function createDynamicNodeAtIndex(index, type, native, name) {
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const tNode = createNodeAtIndex(index, (/** @type {?} */ (type)), native, name, null);
    // We are creating a dynamic node, the previous tNode might not be pointing at this node.
    // We will link ourselves into the tree later with `appendI18nNode`.
    if (previousOrParentTNode.next === tNode) {
        previousOrParentTNode.next = null;
    }
    return tNode;
}
/**
 * @param {?} index
 * @param {?} createOpCodes
 * @param {?} icus
 * @param {?} viewData
 * @return {?}
 */
function readCreateOpCodes(index, createOpCodes, icus, viewData) {
    /** @type {?} */
    const renderer = getLView()[RENDERER];
    /** @type {?} */
    let currentTNode = null;
    /** @type {?} */
    let previousTNode = null;
    /** @type {?} */
    const visitedNodes = [];
    for (let i = 0; i < createOpCodes.length; i++) {
        /** @type {?} */
        const opCode = createOpCodes[i];
        if (typeof opCode == 'string') {
            /** @type {?} */
            const textRNode = createTextNode(opCode, renderer);
            /** @type {?} */
            const textNodeIndex = (/** @type {?} */ (createOpCodes[++i]));
            ngDevMode && ngDevMode.rendererCreateTextNode++;
            previousTNode = currentTNode;
            currentTNode = createDynamicNodeAtIndex(textNodeIndex, 3 /* Element */, textRNode, null);
            visitedNodes.push(textNodeIndex);
            setIsParent(false);
        }
        else if (typeof opCode == 'number') {
            switch (opCode & 7 /* MASK_OPCODE */) {
                case 1 /* AppendChild */:
                    /** @type {?} */
                    const destinationNodeIndex = opCode >>> 17 /* SHIFT_PARENT */;
                    /** @type {?} */
                    let destinationTNode;
                    if (destinationNodeIndex === index) {
                        // If the destination node is `i18nStart`, we don't have a
                        // top-level node and we should use the host node instead
                        destinationTNode = (/** @type {?} */ (viewData[T_HOST]));
                    }
                    else {
                        destinationTNode = getTNode(destinationNodeIndex, viewData);
                    }
                    ngDevMode &&
                        assertDefined((/** @type {?} */ (currentTNode)), `You need to create or select a node before you can insert it into the DOM`);
                    previousTNode = appendI18nNode((/** @type {?} */ (currentTNode)), destinationTNode, previousTNode);
                    break;
                case 0 /* Select */:
                    /** @type {?} */
                    const nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    visitedNodes.push(nodeIndex);
                    previousTNode = currentTNode;
                    currentTNode = getTNode(nodeIndex, viewData);
                    if (currentTNode) {
                        setPreviousOrParentTNode(currentTNode);
                        if (currentTNode.type === 3 /* Element */) {
                            setIsParent(true);
                        }
                    }
                    break;
                case 5 /* ElementEnd */:
                    /** @type {?} */
                    const elementIndex = opCode >>> 3 /* SHIFT_REF */;
                    previousTNode = currentTNode = getTNode(elementIndex, viewData);
                    setPreviousOrParentTNode(currentTNode);
                    setIsParent(false);
                    break;
                case 4 /* Attr */:
                    /** @type {?} */
                    const elementNodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    /** @type {?} */
                    const attrName = (/** @type {?} */ (createOpCodes[++i]));
                    /** @type {?} */
                    const attrValue = (/** @type {?} */ (createOpCodes[++i]));
                    ΔelementAttribute(elementNodeIndex, attrName, attrValue);
                    break;
                default:
                    throw new Error(`Unable to determine the type of mutate operation for "${opCode}"`);
            }
        }
        else {
            switch (opCode) {
                case COMMENT_MARKER:
                    /** @type {?} */
                    const commentValue = (/** @type {?} */ (createOpCodes[++i]));
                    /** @type {?} */
                    const commentNodeIndex = (/** @type {?} */ (createOpCodes[++i]));
                    ngDevMode && assertEqual(typeof commentValue, 'string', `Expected "${commentValue}" to be a comment node value`);
                    /** @type {?} */
                    const commentRNode = renderer.createComment(commentValue);
                    ngDevMode && ngDevMode.rendererCreateComment++;
                    previousTNode = currentTNode;
                    currentTNode = createDynamicNodeAtIndex(commentNodeIndex, 5 /* IcuContainer */, commentRNode, null);
                    visitedNodes.push(commentNodeIndex);
                    attachPatchData(commentRNode, viewData);
                    ((/** @type {?} */ (currentTNode))).activeCaseIndex = null;
                    // We will add the case nodes later, during the update phase
                    setIsParent(false);
                    break;
                case ELEMENT_MARKER:
                    /** @type {?} */
                    const tagNameValue = (/** @type {?} */ (createOpCodes[++i]));
                    /** @type {?} */
                    const elementNodeIndex = (/** @type {?} */ (createOpCodes[++i]));
                    ngDevMode && assertEqual(typeof tagNameValue, 'string', `Expected "${tagNameValue}" to be an element node tag name`);
                    /** @type {?} */
                    const elementRNode = renderer.createElement(tagNameValue);
                    ngDevMode && ngDevMode.rendererCreateElement++;
                    previousTNode = currentTNode;
                    currentTNode = createDynamicNodeAtIndex(elementNodeIndex, 3 /* Element */, elementRNode, tagNameValue);
                    visitedNodes.push(elementNodeIndex);
                    break;
                default:
                    throw new Error(`Unable to determine the type of mutate operation for "${opCode}"`);
            }
        }
    }
    setIsParent(false);
    return visitedNodes;
}
/**
 * @param {?} updateOpCodes
 * @param {?} icus
 * @param {?} bindingsStartIndex
 * @param {?} changeMask
 * @param {?} viewData
 * @param {?=} bypassCheckBit
 * @return {?}
 */
function readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, viewData, bypassCheckBit = false) {
    /** @type {?} */
    let caseCreated = false;
    for (let i = 0; i < updateOpCodes.length; i++) {
        // bit code to check if we should apply the next update
        /** @type {?} */
        const checkBit = (/** @type {?} */ (updateOpCodes[i]));
        // Number of opCodes to skip until next set of update codes
        /** @type {?} */
        const skipCodes = (/** @type {?} */ (updateOpCodes[++i]));
        if (bypassCheckBit || (checkBit & changeMask)) {
            // The value has been updated since last checked
            /** @type {?} */
            let value = '';
            for (let j = i + 1; j <= (i + skipCodes); j++) {
                /** @type {?} */
                const opCode = updateOpCodes[j];
                if (typeof opCode == 'string') {
                    value += opCode;
                }
                else if (typeof opCode == 'number') {
                    if (opCode < 0) {
                        // It's a binding index whose value is negative
                        value += renderStringify(viewData[bindingsStartIndex - opCode]);
                    }
                    else {
                        /** @type {?} */
                        const nodeIndex = opCode >>> 2 /* SHIFT_REF */;
                        /** @type {?} */
                        let tIcuIndex;
                        /** @type {?} */
                        let tIcu;
                        /** @type {?} */
                        let icuTNode;
                        switch (opCode & 3 /* MASK_OPCODE */) {
                            case 1 /* Attr */:
                                /** @type {?} */
                                const attrName = (/** @type {?} */ (updateOpCodes[++j]));
                                /** @type {?} */
                                const sanitizeFn = (/** @type {?} */ (updateOpCodes[++j]));
                                ΔelementAttribute(nodeIndex, attrName, value, sanitizeFn);
                                break;
                            case 0 /* Text */:
                                ΔtextBinding(nodeIndex, value);
                                break;
                            case 2 /* IcuSwitch */:
                                tIcuIndex = (/** @type {?} */ (updateOpCodes[++j]));
                                tIcu = (/** @type {?} */ (icus))[tIcuIndex];
                                icuTNode = (/** @type {?} */ (getTNode(nodeIndex, viewData)));
                                // If there is an active case, delete the old nodes
                                if (icuTNode.activeCaseIndex !== null) {
                                    /** @type {?} */
                                    const removeCodes = tIcu.remove[icuTNode.activeCaseIndex];
                                    for (let k = 0; k < removeCodes.length; k++) {
                                        /** @type {?} */
                                        const removeOpCode = (/** @type {?} */ (removeCodes[k]));
                                        switch (removeOpCode & 7 /* MASK_OPCODE */) {
                                            case 3 /* Remove */:
                                                /** @type {?} */
                                                const nodeIndex = removeOpCode >>> 3 /* SHIFT_REF */;
                                                removeNode(nodeIndex, viewData);
                                                break;
                                            case 6 /* RemoveNestedIcu */:
                                                /** @type {?} */
                                                const nestedIcuNodeIndex = (/** @type {?} */ (removeCodes[k + 1])) >>> 3 /* SHIFT_REF */;
                                                /** @type {?} */
                                                const nestedIcuTNode = (/** @type {?} */ (getTNode(nestedIcuNodeIndex, viewData)));
                                                /** @type {?} */
                                                const activeIndex = nestedIcuTNode.activeCaseIndex;
                                                if (activeIndex !== null) {
                                                    /** @type {?} */
                                                    const nestedIcuTIndex = removeOpCode >>> 3 /* SHIFT_REF */;
                                                    /** @type {?} */
                                                    const nestedTIcu = (/** @type {?} */ (icus))[nestedIcuTIndex];
                                                    addAllToArray(nestedTIcu.remove[activeIndex], removeCodes);
                                                }
                                                break;
                                        }
                                    }
                                }
                                // Update the active caseIndex
                                /** @type {?} */
                                const caseIndex = getCaseIndex(tIcu, value);
                                icuTNode.activeCaseIndex = caseIndex !== -1 ? caseIndex : null;
                                // Add the nodes for the new case
                                readCreateOpCodes(-1, tIcu.create[caseIndex], icus, viewData);
                                caseCreated = true;
                                break;
                            case 3 /* IcuUpdate */:
                                tIcuIndex = (/** @type {?} */ (updateOpCodes[++j]));
                                tIcu = (/** @type {?} */ (icus))[tIcuIndex];
                                icuTNode = (/** @type {?} */ (getTNode(nodeIndex, viewData)));
                                readUpdateOpCodes(tIcu.update[(/** @type {?} */ (icuTNode.activeCaseIndex))], icus, bindingsStartIndex, changeMask, viewData, caseCreated);
                                break;
                        }
                    }
                }
            }
        }
        i += skipCodes;
    }
}
/**
 * @param {?} index
 * @param {?} viewData
 * @return {?}
 */
function removeNode(index, viewData) {
    /** @type {?} */
    const removedPhTNode = getTNode(index, viewData);
    /** @type {?} */
    const removedPhRNode = getNativeByIndex(index, viewData);
    if (removedPhRNode) {
        nativeRemoveNode(viewData[RENDERER], removedPhRNode);
    }
    /** @type {?} */
    const slotValue = (/** @type {?} */ (Δload(index)));
    if (isLContainer(slotValue)) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (slotValue));
        if (removedPhTNode.type !== 0 /* Container */) {
            nativeRemoveNode(viewData[RENDERER], lContainer[NATIVE]);
        }
    }
    ngDevMode && ngDevMode.rendererRemoveNode++;
}
/**
 *
 * Use this instruction to create a translation block that doesn't contain any placeholder.
 * It calls both {\@link i18nStart} and {\@link i18nEnd} in one instruction.
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
 * \@codeGenApi
 * @param {?} index A unique index of the translation in the static block.
 * @param {?} message The translation message.
 * @param {?=} subTemplateIndex Optional sub-template index in the `message`.
 *
 * @return {?}
 */
export function Δi18n(index, message, subTemplateIndex) {
    Δi18nStart(index, message, subTemplateIndex);
    Δi18nEnd();
}
/**
 * Marks a list of attributes as translatable.
 *
 * \@codeGenApi
 * @param {?} index A unique index in the static block
 * @param {?} values
 *
 * @return {?}
 */
export function Δi18nAttributes(index, values) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode && assertDefined(tView, `tView should be defined`);
    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nAttributesFirstPass(tView, index, values);
    }
}
/**
 * See `i18nAttributes` above.
 * @param {?} tView
 * @param {?} index
 * @param {?} values
 * @return {?}
 */
function i18nAttributesFirstPass(tView, index, values) {
    /** @type {?} */
    const previousElement = getPreviousOrParentTNode();
    /** @type {?} */
    const previousElementIndex = previousElement.index - HEADER_OFFSET;
    /** @type {?} */
    const updateOpCodes = [];
    for (let i = 0; i < values.length; i += 2) {
        /** @type {?} */
        const attrName = values[i];
        /** @type {?} */
        const message = values[i + 1];
        /** @type {?} */
        const parts = message.split(ICU_REGEXP);
        for (let j = 0; j < parts.length; j++) {
            /** @type {?} */
            const value = parts[j];
            if (j & 1) {
                // Odd indexes are ICU expressions
                // TODO(ocombe): support ICU expressions in attributes
            }
            else if (value !== '') {
                // Even indexes are text (including bindings)
                /** @type {?} */
                const hasBinding = !!value.match(BINDING_REGEXP);
                if (hasBinding) {
                    addAllToArray(generateBindingUpdateOpCodes(value, previousElementIndex, attrName), updateOpCodes);
                }
                else {
                    ΔelementAttribute(previousElementIndex, attrName, value);
                }
            }
        }
    }
    tView.data[index + HEADER_OFFSET] = updateOpCodes;
}
/** @type {?} */
let changeMask = 0b0;
/** @type {?} */
let shiftsCounter = 0;
/**
 * Stores the values of the bindings during each update cycle in order to determine if we need to
 * update the translated nodes.
 *
 * \@codeGenApi
 * @template T
 * @param {?} expression The binding's new value or NO_CHANGE
 *
 * @return {?}
 */
export function Δi18nExp(expression) {
    if (expression !== NO_CHANGE) {
        changeMask = changeMask | (1 << shiftsCounter);
    }
    shiftsCounter++;
}
/**
 * Updates a translation block or an i18n attribute when the bindings have changed.
 *
 * \@codeGenApi
 * @param {?} index Index of either {\@link i18nStart} (translation block) or {\@link i18nAttributes}
 * (i18n attribute) on which it should update the content.
 *
 * @return {?}
 */
export function Δi18nApply(index) {
    if (shiftsCounter) {
        /** @type {?} */
        const lView = getLView();
        /** @type {?} */
        const tView = lView[TVIEW];
        ngDevMode && assertDefined(tView, `tView should be defined`);
        /** @type {?} */
        const tI18n = tView.data[index + HEADER_OFFSET];
        /** @type {?} */
        let updateOpCodes;
        /** @type {?} */
        let icus = null;
        if (Array.isArray(tI18n)) {
            updateOpCodes = (/** @type {?} */ (tI18n));
        }
        else {
            updateOpCodes = ((/** @type {?} */ (tI18n))).update;
            icus = ((/** @type {?} */ (tI18n))).icus;
        }
        /** @type {?} */
        const bindingsStartIndex = lView[BINDING_INDEX] - shiftsCounter - 1;
        readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, lView);
        // Reset changeMask & maskBit to default for the next update cycle
        changeMask = 0b0;
        shiftsCounter = 0;
    }
}
/** @enum {number} */
const Plural = {
    Zero: 0,
    One: 1,
    Two: 2,
    Few: 3,
    Many: 4,
    Other: 5,
};
Plural[Plural.Zero] = 'Zero';
Plural[Plural.One] = 'One';
Plural[Plural.Two] = 'Two';
Plural[Plural.Few] = 'Few';
Plural[Plural.Many] = 'Many';
Plural[Plural.Other] = 'Other';
/**
 * Returns the plural case based on the locale.
 * This is a copy of the deprecated function that we used in Angular v4.
 * // TODO(ocombe): remove this once we can the real getPluralCase function
 *
 * @deprecated from v5 the plural case function is in locale data files common/locales/*.ts
 * @param {?} locale
 * @param {?} nLike
 * @return {?}
 */
function getPluralCase(locale, nLike) {
    if (typeof nLike === 'string') {
        nLike = parseInt((/** @type {?} */ (nLike)), 10);
    }
    /** @type {?} */
    const n = (/** @type {?} */ (nLike));
    /** @type {?} */
    const nDecimal = n.toString().replace(/^[^.]*\.?/, '');
    /** @type {?} */
    const i = Math.floor(Math.abs(n));
    /** @type {?} */
    const v = nDecimal.length;
    /** @type {?} */
    const f = parseInt(nDecimal, 10);
    /** @type {?} */
    const t = parseInt(n.toString().replace(/^[^.]*\.?|0+$/g, ''), 10) || 0;
    /** @type {?} */
    const lang = locale.split('-')[0].toLowerCase();
    switch (lang) {
        case 'af':
        case 'asa':
        case 'az':
        case 'bem':
        case 'bez':
        case 'bg':
        case 'brx':
        case 'ce':
        case 'cgg':
        case 'chr':
        case 'ckb':
        case 'ee':
        case 'el':
        case 'eo':
        case 'es':
        case 'eu':
        case 'fo':
        case 'fur':
        case 'gsw':
        case 'ha':
        case 'haw':
        case 'hu':
        case 'jgo':
        case 'jmc':
        case 'ka':
        case 'kk':
        case 'kkj':
        case 'kl':
        case 'ks':
        case 'ksb':
        case 'ky':
        case 'lb':
        case 'lg':
        case 'mas':
        case 'mgo':
        case 'ml':
        case 'mn':
        case 'nb':
        case 'nd':
        case 'ne':
        case 'nn':
        case 'nnh':
        case 'nyn':
        case 'om':
        case 'or':
        case 'os':
        case 'ps':
        case 'rm':
        case 'rof':
        case 'rwk':
        case 'saq':
        case 'seh':
        case 'sn':
        case 'so':
        case 'sq':
        case 'ta':
        case 'te':
        case 'teo':
        case 'tk':
        case 'tr':
        case 'ug':
        case 'uz':
        case 'vo':
        case 'vun':
        case 'wae':
        case 'xog':
            if (n === 1)
                return Plural.One;
            return Plural.Other;
        case 'ak':
        case 'ln':
        case 'mg':
        case 'pa':
        case 'ti':
            if (n === Math.floor(n) && n >= 0 && n <= 1)
                return Plural.One;
            return Plural.Other;
        case 'am':
        case 'as':
        case 'bn':
        case 'fa':
        case 'gu':
        case 'hi':
        case 'kn':
        case 'mr':
        case 'zu':
            if (i === 0 || n === 1)
                return Plural.One;
            return Plural.Other;
        case 'ar':
            if (n === 0)
                return Plural.Zero;
            if (n === 1)
                return Plural.One;
            if (n === 2)
                return Plural.Two;
            if (n % 100 === Math.floor(n % 100) && n % 100 >= 3 && n % 100 <= 10)
                return Plural.Few;
            if (n % 100 === Math.floor(n % 100) && n % 100 >= 11 && n % 100 <= 99)
                return Plural.Many;
            return Plural.Other;
        case 'ast':
        case 'ca':
        case 'de':
        case 'en':
        case 'et':
        case 'fi':
        case 'fy':
        case 'gl':
        case 'it':
        case 'nl':
        case 'sv':
        case 'sw':
        case 'ur':
        case 'yi':
            if (i === 1 && v === 0)
                return Plural.One;
            return Plural.Other;
        case 'be':
            if (n % 10 === 1 && !(n % 100 === 11))
                return Plural.One;
            if (n % 10 === Math.floor(n % 10) && n % 10 >= 2 && n % 10 <= 4 &&
                !(n % 100 >= 12 && n % 100 <= 14))
                return Plural.Few;
            if (n % 10 === 0 || n % 10 === Math.floor(n % 10) && n % 10 >= 5 && n % 10 <= 9 ||
                n % 100 === Math.floor(n % 100) && n % 100 >= 11 && n % 100 <= 14)
                return Plural.Many;
            return Plural.Other;
        case 'br':
            if (n % 10 === 1 && !(n % 100 === 11 || n % 100 === 71 || n % 100 === 91))
                return Plural.One;
            if (n % 10 === 2 && !(n % 100 === 12 || n % 100 === 72 || n % 100 === 92))
                return Plural.Two;
            if (n % 10 === Math.floor(n % 10) && (n % 10 >= 3 && n % 10 <= 4 || n % 10 === 9) &&
                !(n % 100 >= 10 && n % 100 <= 19 || n % 100 >= 70 && n % 100 <= 79 ||
                    n % 100 >= 90 && n % 100 <= 99))
                return Plural.Few;
            if (!(n === 0) && n % 1e6 === 0)
                return Plural.Many;
            return Plural.Other;
        case 'bs':
        case 'hr':
        case 'sr':
            if (v === 0 && i % 10 === 1 && !(i % 100 === 11) || f % 10 === 1 && !(f % 100 === 11))
                return Plural.One;
            if (v === 0 && i % 10 === Math.floor(i % 10) && i % 10 >= 2 && i % 10 <= 4 &&
                !(i % 100 >= 12 && i % 100 <= 14) ||
                f % 10 === Math.floor(f % 10) && f % 10 >= 2 && f % 10 <= 4 &&
                    !(f % 100 >= 12 && f % 100 <= 14))
                return Plural.Few;
            return Plural.Other;
        case 'cs':
        case 'sk':
            if (i === 1 && v === 0)
                return Plural.One;
            if (i === Math.floor(i) && i >= 2 && i <= 4 && v === 0)
                return Plural.Few;
            if (!(v === 0))
                return Plural.Many;
            return Plural.Other;
        case 'cy':
            if (n === 0)
                return Plural.Zero;
            if (n === 1)
                return Plural.One;
            if (n === 2)
                return Plural.Two;
            if (n === 3)
                return Plural.Few;
            if (n === 6)
                return Plural.Many;
            return Plural.Other;
        case 'da':
            if (n === 1 || !(t === 0) && (i === 0 || i === 1))
                return Plural.One;
            return Plural.Other;
        case 'dsb':
        case 'hsb':
            if (v === 0 && i % 100 === 1 || f % 100 === 1)
                return Plural.One;
            if (v === 0 && i % 100 === 2 || f % 100 === 2)
                return Plural.Two;
            if (v === 0 && i % 100 === Math.floor(i % 100) && i % 100 >= 3 && i % 100 <= 4 ||
                f % 100 === Math.floor(f % 100) && f % 100 >= 3 && f % 100 <= 4)
                return Plural.Few;
            return Plural.Other;
        case 'ff':
        case 'fr':
        case 'hy':
        case 'kab':
            if (i === 0 || i === 1)
                return Plural.One;
            return Plural.Other;
        case 'fil':
            if (v === 0 && (i === 1 || i === 2 || i === 3) ||
                v === 0 && !(i % 10 === 4 || i % 10 === 6 || i % 10 === 9) ||
                !(v === 0) && !(f % 10 === 4 || f % 10 === 6 || f % 10 === 9))
                return Plural.One;
            return Plural.Other;
        case 'ga':
            if (n === 1)
                return Plural.One;
            if (n === 2)
                return Plural.Two;
            if (n === Math.floor(n) && n >= 3 && n <= 6)
                return Plural.Few;
            if (n === Math.floor(n) && n >= 7 && n <= 10)
                return Plural.Many;
            return Plural.Other;
        case 'gd':
            if (n === 1 || n === 11)
                return Plural.One;
            if (n === 2 || n === 12)
                return Plural.Two;
            if (n === Math.floor(n) && (n >= 3 && n <= 10 || n >= 13 && n <= 19))
                return Plural.Few;
            return Plural.Other;
        case 'gv':
            if (v === 0 && i % 10 === 1)
                return Plural.One;
            if (v === 0 && i % 10 === 2)
                return Plural.Two;
            if (v === 0 &&
                (i % 100 === 0 || i % 100 === 20 || i % 100 === 40 || i % 100 === 60 || i % 100 === 80))
                return Plural.Few;
            if (!(v === 0))
                return Plural.Many;
            return Plural.Other;
        case 'he':
            if (i === 1 && v === 0)
                return Plural.One;
            if (i === 2 && v === 0)
                return Plural.Two;
            if (v === 0 && !(n >= 0 && n <= 10) && n % 10 === 0)
                return Plural.Many;
            return Plural.Other;
        case 'is':
            if (t === 0 && i % 10 === 1 && !(i % 100 === 11) || !(t === 0))
                return Plural.One;
            return Plural.Other;
        case 'ksh':
            if (n === 0)
                return Plural.Zero;
            if (n === 1)
                return Plural.One;
            return Plural.Other;
        case 'kw':
        case 'naq':
        case 'se':
        case 'smn':
            if (n === 1)
                return Plural.One;
            if (n === 2)
                return Plural.Two;
            return Plural.Other;
        case 'lag':
            if (n === 0)
                return Plural.Zero;
            if ((i === 0 || i === 1) && !(n === 0))
                return Plural.One;
            return Plural.Other;
        case 'lt':
            if (n % 10 === 1 && !(n % 100 >= 11 && n % 100 <= 19))
                return Plural.One;
            if (n % 10 === Math.floor(n % 10) && n % 10 >= 2 && n % 10 <= 9 &&
                !(n % 100 >= 11 && n % 100 <= 19))
                return Plural.Few;
            if (!(f === 0))
                return Plural.Many;
            return Plural.Other;
        case 'lv':
        case 'prg':
            if (n % 10 === 0 || n % 100 === Math.floor(n % 100) && n % 100 >= 11 && n % 100 <= 19 ||
                v === 2 && f % 100 === Math.floor(f % 100) && f % 100 >= 11 && f % 100 <= 19)
                return Plural.Zero;
            if (n % 10 === 1 && !(n % 100 === 11) || v === 2 && f % 10 === 1 && !(f % 100 === 11) ||
                !(v === 2) && f % 10 === 1)
                return Plural.One;
            return Plural.Other;
        case 'mk':
            if (v === 0 && i % 10 === 1 || f % 10 === 1)
                return Plural.One;
            return Plural.Other;
        case 'mt':
            if (n === 1)
                return Plural.One;
            if (n === 0 || n % 100 === Math.floor(n % 100) && n % 100 >= 2 && n % 100 <= 10)
                return Plural.Few;
            if (n % 100 === Math.floor(n % 100) && n % 100 >= 11 && n % 100 <= 19)
                return Plural.Many;
            return Plural.Other;
        case 'pl':
            if (i === 1 && v === 0)
                return Plural.One;
            if (v === 0 && i % 10 === Math.floor(i % 10) && i % 10 >= 2 && i % 10 <= 4 &&
                !(i % 100 >= 12 && i % 100 <= 14))
                return Plural.Few;
            if (v === 0 && !(i === 1) && i % 10 === Math.floor(i % 10) && i % 10 >= 0 && i % 10 <= 1 ||
                v === 0 && i % 10 === Math.floor(i % 10) && i % 10 >= 5 && i % 10 <= 9 ||
                v === 0 && i % 100 === Math.floor(i % 100) && i % 100 >= 12 && i % 100 <= 14)
                return Plural.Many;
            return Plural.Other;
        case 'pt':
            if (n === Math.floor(n) && n >= 0 && n <= 2 && !(n === 2))
                return Plural.One;
            return Plural.Other;
        case 'ro':
            if (i === 1 && v === 0)
                return Plural.One;
            if (!(v === 0) || n === 0 ||
                !(n === 1) && n % 100 === Math.floor(n % 100) && n % 100 >= 1 && n % 100 <= 19)
                return Plural.Few;
            return Plural.Other;
        case 'ru':
        case 'uk':
            if (v === 0 && i % 10 === 1 && !(i % 100 === 11))
                return Plural.One;
            if (v === 0 && i % 10 === Math.floor(i % 10) && i % 10 >= 2 && i % 10 <= 4 &&
                !(i % 100 >= 12 && i % 100 <= 14))
                return Plural.Few;
            if (v === 0 && i % 10 === 0 ||
                v === 0 && i % 10 === Math.floor(i % 10) && i % 10 >= 5 && i % 10 <= 9 ||
                v === 0 && i % 100 === Math.floor(i % 100) && i % 100 >= 11 && i % 100 <= 14)
                return Plural.Many;
            return Plural.Other;
        case 'shi':
            if (i === 0 || n === 1)
                return Plural.One;
            if (n === Math.floor(n) && n >= 2 && n <= 10)
                return Plural.Few;
            return Plural.Other;
        case 'si':
            if (n === 0 || n === 1 || i === 0 && f === 1)
                return Plural.One;
            return Plural.Other;
        case 'sl':
            if (v === 0 && i % 100 === 1)
                return Plural.One;
            if (v === 0 && i % 100 === 2)
                return Plural.Two;
            if (v === 0 && i % 100 === Math.floor(i % 100) && i % 100 >= 3 && i % 100 <= 4 || !(v === 0))
                return Plural.Few;
            return Plural.Other;
        case 'tzm':
            if (n === Math.floor(n) && n >= 0 && n <= 1 || n === Math.floor(n) && n >= 11 && n <= 99)
                return Plural.One;
            return Plural.Other;
        // When there is no specification, the default is always "other"
        // Spec: http://cldr.unicode.org/index/cldr-spec/plural-rules
        // > other (required—general plural form — also used if the language only has a single form)
        default:
            return Plural.Other;
    }
}
/**
 * @param {?} value
 * @param {?} locale
 * @return {?}
 */
function getPluralCategory(value, locale) {
    /** @type {?} */
    const plural = getPluralCase(locale, value);
    switch (plural) {
        case Plural.Zero:
            return 'zero';
        case Plural.One:
            return 'one';
        case Plural.Two:
            return 'two';
        case Plural.Few:
            return 'few';
        case Plural.Many:
            return 'many';
        default:
            return 'other';
    }
}
/**
 * Returns the index of the current case of an ICU expression depending on the main binding value
 *
 * @param {?} icuExpression
 * @param {?} bindingValue The value of the main binding used by this ICU expression
 * @return {?}
 */
function getCaseIndex(icuExpression, bindingValue) {
    /** @type {?} */
    let index = icuExpression.cases.indexOf(bindingValue);
    if (index === -1) {
        switch (icuExpression.type) {
            case 1 /* plural */: {
                // TODO(ocombe): replace this hard-coded value by the real LOCALE_ID value
                /** @type {?} */
                const locale = 'en-US';
                /** @type {?} */
                const resolvedCase = getPluralCategory(bindingValue, locale);
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
 * @param {?} tIcus
 * @param {?} icuExpression
 * @param {?} startIndex
 * @param {?} expandoStartIndex
 * @return {?}
 */
function icuStart(tIcus, icuExpression, startIndex, expandoStartIndex) {
    /** @type {?} */
    const createCodes = [];
    /** @type {?} */
    const removeCodes = [];
    /** @type {?} */
    const updateCodes = [];
    /** @type {?} */
    const vars = [];
    /** @type {?} */
    const childIcus = [];
    for (let i = 0; i < icuExpression.values.length; i++) {
        // Each value is an array of strings & other ICU expressions
        /** @type {?} */
        const valueArr = icuExpression.values[i];
        /** @type {?} */
        const nestedIcus = [];
        for (let j = 0; j < valueArr.length; j++) {
            /** @type {?} */
            const value = valueArr[j];
            if (typeof value !== 'string') {
                // It is an nested ICU expression
                /** @type {?} */
                const icuIndex = nestedIcus.push((/** @type {?} */ (value))) - 1;
                // Replace nested ICU expression by a comment node
                valueArr[j] = `<!--�${icuIndex}�-->`;
            }
        }
        /** @type {?} */
        const icuCase = parseIcuCase(valueArr.join(''), startIndex, nestedIcus, tIcus, expandoStartIndex);
        createCodes.push(icuCase.create);
        removeCodes.push(icuCase.remove);
        updateCodes.push(icuCase.update);
        vars.push(icuCase.vars);
        childIcus.push(icuCase.childIcus);
    }
    /** @type {?} */
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
 * @param {?} unsafeHtml The string to parse
 * @param {?} parentIndex
 * @param {?} nestedIcus
 * @param {?} tIcus
 * @param {?} expandoStartIndex
 * @return {?}
 */
function parseIcuCase(unsafeHtml, parentIndex, nestedIcus, tIcus, expandoStartIndex) {
    /** @type {?} */
    const inertBodyHelper = new InertBodyHelper(document);
    /** @type {?} */
    const inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
    if (!inertBodyElement) {
        throw new Error('Unable to generate inert body element');
    }
    /** @type {?} */
    const wrapper = (/** @type {?} */ (getTemplateContent((/** @type {?} */ (inertBodyElement))))) || inertBodyElement;
    /** @type {?} */
    const opCodes = { vars: 0, childIcus: [], create: [], remove: [], update: [] };
    parseNodes(wrapper.firstChild, opCodes, parentIndex, nestedIcus, tIcus, expandoStartIndex);
    return opCodes;
}
/** @type {?} */
const NESTED_ICU = /�(\d+)�/;
/**
 * Parses a node, its children and its siblings, and generates the mutate & update OpCodes.
 *
 * @param {?} currentNode The first node to parse
 * @param {?} icuCase The data for the ICU expression case that contains those nodes
 * @param {?} parentIndex Index of the current node's parent
 * @param {?} nestedIcus Data for the nested ICU expressions that this case contains
 * @param {?} tIcus Data for all ICU expressions of the current message
 * @param {?} expandoStartIndex Expando start index for the current ICU expression
 * @return {?}
 */
function parseNodes(currentNode, icuCase, parentIndex, nestedIcus, tIcus, expandoStartIndex) {
    if (currentNode) {
        /** @type {?} */
        const nestedIcusToCreate = [];
        while (currentNode) {
            /** @type {?} */
            const nextNode = currentNode.nextSibling;
            /** @type {?} */
            const newIndex = expandoStartIndex + ++icuCase.vars;
            switch (currentNode.nodeType) {
                case Node.ELEMENT_NODE:
                    /** @type {?} */
                    const element = (/** @type {?} */ (currentNode));
                    /** @type {?} */
                    const tagName = element.tagName.toLowerCase();
                    if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
                        // This isn't a valid element, we won't create an element for it
                        icuCase.vars--;
                    }
                    else {
                        icuCase.create.push(ELEMENT_MARKER, tagName, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        /** @type {?} */
                        const elAttrs = element.attributes;
                        for (let i = 0; i < elAttrs.length; i++) {
                            /** @type {?} */
                            const attr = (/** @type {?} */ (elAttrs.item(i)));
                            /** @type {?} */
                            const lowerAttrName = attr.name.toLowerCase();
                            /** @type {?} */
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
                    /** @type {?} */
                    const value = currentNode.textContent || '';
                    /** @type {?} */
                    const hasBinding = value.match(BINDING_REGEXP);
                    icuCase.create.push(hasBinding ? '' : value, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                    icuCase.remove.push(newIndex << 3 /* SHIFT_REF */ | 3 /* Remove */);
                    if (hasBinding) {
                        addAllToArray(generateBindingUpdateOpCodes(value, newIndex), icuCase.update);
                    }
                    break;
                case Node.COMMENT_NODE:
                    // Check if the comment node is a placeholder for a nested ICU
                    /** @type {?} */
                    const match = NESTED_ICU.exec(currentNode.textContent || '');
                    if (match) {
                        /** @type {?} */
                        const nestedIcuIndex = parseInt(match[1], 10);
                        /** @type {?} */
                        const newLocal = ngDevMode ? `nested ICU ${nestedIcuIndex}` : '';
                        // Create the comment node that will anchor the ICU expression
                        icuCase.create.push(COMMENT_MARKER, newLocal, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        /** @type {?} */
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
            currentNode = (/** @type {?} */ (nextNode));
        }
        for (let i = 0; i < nestedIcusToCreate.length; i++) {
            /** @type {?} */
            const nestedIcu = nestedIcusToCreate[i][0];
            /** @type {?} */
            const nestedIcuNodeIndex = nestedIcusToCreate[i][1];
            icuStart(tIcus, nestedIcu, nestedIcuNodeIndex, expandoStartIndex + icuCase.vars);
            // Since this is recursive, the last TIcu that was pushed is the one we want
            /** @type {?} */
            const nestTIcuIndex = tIcus.length - 1;
            icuCase.vars += Math.max(...tIcus[nestTIcuIndex].vars);
            icuCase.childIcus.push(nestTIcuIndex);
            /** @type {?} */
            const mask = getBindingMask(nestedIcu);
            icuCase.update.push(toMaskBit(nestedIcu.mainBinding), // mask of the main binding
            3, // skip 3 opCodes if not changed
            -1 - nestedIcu.mainBinding, nestedIcuNodeIndex << 2 /* SHIFT_REF */ | 2 /* IcuSwitch */, nestTIcuIndex, mask, // mask of all the bindings of this ICU expression
            2, // skip 2 opCodes if not changed
            nestedIcuNodeIndex << 2 /* SHIFT_REF */ | 3 /* IcuUpdate */, nestTIcuIndex);
            icuCase.remove.push(nestTIcuIndex << 3 /* SHIFT_REF */ | 6 /* RemoveNestedIcu */, nestedIcuNodeIndex << 3 /* SHIFT_REF */ | 3 /* Remove */);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4SCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbEQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3RSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDMUUsT0FBTyxFQUFDLFlBQVksRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RFLE9BQU8sRUFBYSxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBaUcsTUFBTSxtQkFBbUIsQ0FBQztBQUtqSyxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFTLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3RHLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbEYsT0FBTyxF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SyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUs7WUFDUixJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQztZQUMvQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDdEIs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QUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDOztrQkFDaEMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2YsU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRywyQkFBMkI7WUFDOUQsQ0FBQyxFQUFrQyxnQ0FBZ0M7WUFDbkUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFDMUIsa0JBQWtCLHFCQUE4QixvQkFBNkIsRUFDN0UsYUFBYSxFQUNiLElBQUksRUFBRyxrREFBa0Q7WUFDekQsQ0FBQyxFQUFNLGdDQUFnQztZQUN2QyxrQkFBa0IscUJBQThCLG9CQUE2QixFQUM3RSxhQUFhLENBQUMsQ0FBQztZQUNuQixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZixhQUFhLHFCQUE4QiwwQkFBbUMsRUFDOUUsa0JBQWtCLHFCQUE4QixpQkFBMEIsQ0FBQyxDQUFDO1NBQ2pGO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NSQ1NFVF9BVFRSUywgVVJJX0FUVFJTLCBWQUxJRF9BVFRSUywgVkFMSURfRUxFTUVOVFMsIGdldFRlbXBsYXRlQ29udGVudH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2F0dGFjaEkxOG5PcENvZGVzRGVidWd9IGZyb20gJy4vZGVidWcnO1xuaW1wb3J0IHvOlGVsZW1lbnRBdHRyaWJ1dGUsIM6UbG9hZCwgzpR0ZXh0QmluZGluZ30gZnJvbSAnLi9pbnN0cnVjdGlvbnMvYWxsJztcbmltcG9ydCB7YWxsb2NFeHBhbmRvLCBjcmVhdGVOb2RlQXRJbmRleH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIEljdVR5cGUsIFRJMThuLCBUSWN1fSBmcm9tICcuL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBjcmVhdGVUZXh0Tm9kZSwgbmF0aXZlUmVtb3ZlTm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRJc1BhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgaXNMQ29udGFpbmVyfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgSUNVX0JMT0NLX1JFR0VYUCA9IC9eXFxzKijvv71cXGQrOj9cXGQq77+9KVxccyosXFxzKihzZWxlY3R8cGx1cmFsKVxccyosLztcbmNvbnN0IFNVQlRFTVBMQVRFX1JFR0VYUCA9IC/vv71cXC8/XFwqKFxcZCs6XFxkKynvv70vZ2k7XG5jb25zdCBQSF9SRUdFWFAgPSAv77+9KFxcLz9bIypdXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBCSU5ESU5HX1JFR0VYUCA9IC/vv70oXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBJQ1VfUkVHRVhQID0gLyh7XFxzKu+/vVxcZCs6P1xcZCrvv71cXHMqLFxccypcXFN7Nn1cXHMqLFtcXHNcXFNdKn0pL2dpO1xuXG4vLyBpMThuUG9zdHByb2Nlc3MgY29uc3RzXG5jb25zdCBST09UX1RFTVBMQVRFX0lEID0gMDtcbmNvbnN0IFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdLztcbmNvbnN0IFBQX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdfCjvv71cXC8/XFwqXFxkKzpcXGQr77+9KS9nO1xuY29uc3QgUFBfSUNVX1ZBUlNfUkVHRVhQID0gLyh7XFxzKikoVkFSXyhQTFVSQUx8U0VMRUNUKShfXFxkKyk/KShcXHMqLCkvZztcbmNvbnN0IFBQX0lDVVNfUkVHRVhQID0gL++/vUkxOE5fRVhQXyhJQ1UoX1xcZCspPynvv70vZztcbmNvbnN0IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUCA9IC9cXC9cXCovO1xuY29uc3QgUFBfVEVNUExBVEVfSURfUkVHRVhQID0gL1xcZCtcXDooXFxkKykvO1xuXG4vLyBQYXJzZWQgcGxhY2Vob2xkZXIgc3RydWN0dXJlIHVzZWQgaW4gcG9zdHByb2Nlc3NpbmcgKHdpdGhpbiBgaTE4blBvc3Rwcm9jZXNzYCBmdW5jdGlvbilcbi8vIENvbnRhaW5zIHRoZSBmb2xsb3dpbmcgZmllbGRzOiBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl1cbnR5cGUgUG9zdHByb2Nlc3NQbGFjZWhvbGRlciA9IFtudW1iZXIsIGJvb2xlYW4sIHN0cmluZ107XG5cbmludGVyZmFjZSBJY3VFeHByZXNzaW9uIHtcbiAgdHlwZTogSWN1VHlwZTtcbiAgbWFpbkJpbmRpbmc6IG51bWJlcjtcbiAgY2FzZXM6IHN0cmluZ1tdO1xuICB2YWx1ZXM6IChzdHJpbmd8SWN1RXhwcmVzc2lvbilbXVtdO1xufVxuXG5pbnRlcmZhY2UgSWN1Q2FzZSB7XG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2NhdGUgaW4gZXhwYW5kbyBmb3IgdGhpcyBjYXNlLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYXggbnVtYmVyIG9mIERPTSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgYnkgdGhpcyBpMThuICsgSUNVIGJsb2Nrcy4gV2hlblxuICAgKiB0aGUgRE9NIGVsZW1lbnRzIGFyZSBiZWluZyBjcmVhdGVkIHRoZXkgYXJlIHN0b3JlZCBpbiB0aGUgRVhQQU5ETywgc28gdGhhdCB1cGRhdGUgT3BDb2RlcyBjYW5cbiAgICogd3JpdGUgaW50byB0aGVtLlxuICAgKi9cbiAgdmFyczogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBhcnJheSBvZiBjaGlsZC9zdWIgSUNVcy5cbiAgICovXG4gIGNoaWxkSWN1czogbnVtYmVyW107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gYnVpbGQgdXAgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVVxuICAgKi9cbiAgY3JlYXRlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBkZXN0cm95IHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UuXG4gICAqL1xuICByZW1vdmU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIHVwZGF0ZSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVIGJpbmRpbmdzLlxuICAgKi9cbiAgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2Rlcztcbn1cblxuLyoqXG4gKiBCcmVha3MgcGF0dGVybiBpbnRvIHN0cmluZ3MgYW5kIHRvcCBsZXZlbCB7Li4ufSBibG9ja3MuXG4gKiBDYW4gYmUgdXNlZCB0byBicmVhayBhIG1lc3NhZ2UgaW50byB0ZXh0IGFuZCBJQ1UgZXhwcmVzc2lvbnMsIG9yIHRvIGJyZWFrIGFuIElDVSBleHByZXNzaW9uIGludG9cbiAqIGtleXMgYW5kIGNhc2VzLlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gKHN1YilQYXR0ZXJuIHRvIGJlIGJyb2tlbi5cbiAqXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQYXJ0cyhwYXR0ZXJuOiBzdHJpbmcpOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSB7XG4gIGlmICghcGF0dGVybikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGxldCBwcmV2UG9zID0gMDtcbiAgY29uc3QgYnJhY2VTdGFjayA9IFtdO1xuICBjb25zdCByZXN1bHRzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSA9IFtdO1xuICBjb25zdCBicmFjZXMgPSAvW3t9XS9nO1xuICAvLyBsYXN0SW5kZXggZG9lc24ndCBnZXQgc2V0IHRvIDAgc28gd2UgaGF2ZSB0by5cbiAgYnJhY2VzLmxhc3RJbmRleCA9IDA7XG5cbiAgbGV0IG1hdGNoO1xuICB3aGlsZSAobWF0Y2ggPSBicmFjZXMuZXhlYyhwYXR0ZXJuKSkge1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmluZGV4O1xuICAgIGlmIChtYXRjaFswXSA9PSAnfScpIHtcbiAgICAgIGJyYWNlU3RhY2sucG9wKCk7XG5cbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIEVuZCBvZiB0aGUgYmxvY2suXG4gICAgICAgIGNvbnN0IGJsb2NrID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgaWYgKElDVV9CTE9DS19SRUdFWFAudGVzdChibG9jaykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocGFyc2VJQ1VCbG9jayhibG9jaykpO1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrKSB7ICAvLyBEb24ndCBwdXNoIGVtcHR5IHN0cmluZ3NcbiAgICAgICAgICByZXN1bHRzLnB1c2goYmxvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICAgIGJyYWNlU3RhY2sucHVzaCgneycpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MpO1xuICBpZiAoc3Vic3RyaW5nICE9ICcnKSB7XG4gICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW11bXSA9IFtdO1xuICBsZXQgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICBsZXQgbWFpbkJpbmRpbmcgPSAwO1xuICBwYXR0ZXJuID0gcGF0dGVybi5yZXBsYWNlKElDVV9CTE9DS19SRUdFWFAsIGZ1bmN0aW9uKHN0cjogc3RyaW5nLCBiaW5kaW5nOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgIGlmICh0eXBlID09PSAnc2VsZWN0Jykge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUuc2VsZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gICAgfVxuICAgIG1haW5CaW5kaW5nID0gcGFyc2VJbnQoYmluZGluZy5zdWJzdHIoMSksIDEwKTtcbiAgICByZXR1cm4gJyc7XG4gIH0pO1xuXG4gIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHBhdHRlcm4pIGFzIHN0cmluZ1tdO1xuICAvLyBMb29raW5nIGZvciAoa2V5IGJsb2NrKSsgc2VxdWVuY2UuIE9uZSBvZiB0aGUga2V5cyBoYXMgdG8gYmUgXCJvdGhlclwiLlxuICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBwYXJ0cy5sZW5ndGg7KSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW3BvcysrXS50cmltKCk7XG4gICAgaWYgKGljdVR5cGUgPT09IEljdVR5cGUucGx1cmFsKSB7XG4gICAgICAvLyBLZXkgY2FuIGJlIFwiPXhcIiwgd2UganVzdCB3YW50IFwieFwiXG4gICAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzKig/Oj0pPyhcXHcrKVxccyovLCAnJDEnKTtcbiAgICB9XG4gICAgaWYgKGtleS5sZW5ndGgpIHtcbiAgICAgIGNhc2VzLnB1c2goa2V5KTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBleHRyYWN0UGFydHMocGFydHNbcG9zKytdKSBhcyBzdHJpbmdbXTtcbiAgICBpZiAoYmxvY2tzLmxlbmd0aCkge1xuICAgICAgdmFsdWVzLnB1c2goYmxvY2tzKTtcbiAgICB9XG4gIH1cblxuICBhc3NlcnRHcmVhdGVyVGhhbihjYXNlcy5pbmRleE9mKCdvdGhlcicpLCAtMSwgJ01pc3Npbmcga2V5IFwib3RoZXJcIiBpbiBJQ1Ugc3RhdGVtZW50LicpO1xuICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXMsIHNlZSAjMjE2MTVcbiAgcmV0dXJuIHt0eXBlOiBpY3VUeXBlLCBtYWluQmluZGluZzogbWFpbkJpbmRpbmcsIGNhc2VzLCB2YWx1ZXN9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgaW5UZW1wbGF0ZSwgZmFsc2UsXG4gICAgICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7bWVzc2FnZX1cImApO1xuXG4gIHJlcyArPSBtZXNzYWdlLnN1YnN0cihpbmRleCk7XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSBwYXJ0IG9mIGEgbWVzc2FnZSBhbmQgcmVtb3ZlcyB0aGUgcmVzdC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBleHRyYWN0aW5nIGEgcGFydCBvZiB0aGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gQSB0cmFuc2xhdGVkXG4gKiBtZXNzYWdlIGNhbiBzcGFuIG11bHRpcGxlIHRlbXBsYXRlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGkxOG4+VHJhbnNsYXRlIDxzcGFuICpuZ0lmPm1lPC9zcGFuPiE8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGNyb3BcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IG9mIHRoZSBzdWItdGVtcGxhdGUgdG8gZXh0cmFjdC4gSWYgdW5kZWZpbmVkIGl0IHJldHVybnMgdGhlXG4gKiBleHRlcm5hbCB0ZW1wbGF0ZSBhbmQgcmVtb3ZlcyBhbGwgc3ViLXRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKSB7XG4gIGlmICh0eXBlb2Ygc3ViVGVtcGxhdGVJbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAvLyBXZSB3YW50IHRoZSByb290IHRlbXBsYXRlIG1lc3NhZ2UsIGlnbm9yZSBhbGwgc3ViLXRlbXBsYXRlc1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2Ugd2FudCBhIHNwZWNpZmljIHN1Yi10ZW1wbGF0ZVxuICAgIGNvbnN0IHN0YXJ0ID1cbiAgICAgICAgbWVzc2FnZS5pbmRleE9mKGA6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApICsgMiArIHN1YlRlbXBsYXRlSW5kZXgudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgY29uc3QgZW5kID0gbWVzc2FnZS5zZWFyY2gobmV3IFJlZ0V4cChgJHtNQVJLRVJ9XFxcXC9cXFxcKlxcXFxkKzoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkpO1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgdG8gdXBkYXRlIHRoZSBiaW5kaW5ncyBvZiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmluZGluZ3MuXG4gKiBAcGFyYW0gZGVzdGluYXRpb25Ob2RlIEluZGV4IG9mIHRoZSBkZXN0aW5hdGlvbiBub2RlIHdoaWNoIHdpbGwgcmVjZWl2ZSB0aGUgYmluZGluZy5cbiAqIEBwYXJhbSBhdHRyTmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUsIGlmIHRoZSBzdHJpbmcgYmVsb25ncyB0byBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gc2FuaXRpemVGbiBTYW5pdGl6YXRpb24gZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgc3RyaW5nIGFmdGVyIHVwZGF0ZSwgaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgIHN0cjogc3RyaW5nLCBkZXN0aW5hdGlvbk5vZGU6IG51bWJlciwgYXR0ck5hbWU/OiBzdHJpbmcsXG4gICAgc2FuaXRpemVGbjogU2FuaXRpemVyRm4gfCBudWxsID0gbnVsbCk6IEkxOG5VcGRhdGVPcENvZGVzIHtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbbnVsbCwgbnVsbF07ICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBjb25zdCB0ZXh0UGFydHMgPSBzdHIuc3BsaXQoQklORElOR19SRUdFWFApO1xuICBsZXQgbWFzayA9IDA7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCB0ZXh0UGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB0ZXh0UGFydHNbal07XG5cbiAgICBpZiAoaiAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gcGFyc2VJbnQodGV4dFZhbHVlLCAxMCk7XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2goLTEgLSBiaW5kaW5nSW5kZXgpO1xuICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2UgaWYgKHRleHRWYWx1ZSAhPT0gJycpIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dFxuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKHRleHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgIChhdHRyTmFtZSA/IEkxOG5VcGRhdGVPcENvZGUuQXR0ciA6IEkxOG5VcGRhdGVPcENvZGUuVGV4dCkpO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbMF0gPSBtYXNrO1xuICB1cGRhdGVPcENvZGVzWzFdID0gdXBkYXRlT3BDb2Rlcy5sZW5ndGggLSAyO1xuICByZXR1cm4gdXBkYXRlT3BDb2Rlcztcbn1cblxuZnVuY3Rpb24gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgbWFzayA9IDApOiBudW1iZXIge1xuICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKTtcbiAgbGV0IG1hdGNoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgd2hpbGUgKG1hdGNoID0gQklORElOR19SRUdFWFAuZXhlYyh2YWx1ZSkpIHtcbiAgICAgICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChwYXJzZUludChtYXRjaFsxXSwgMTApKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFzayA9IGdldEJpbmRpbmdNYXNrKHZhbHVlIGFzIEljdUV4cHJlc3Npb24sIG1hc2spO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWFzaztcbn1cblxuY29uc3QgaTE4bkluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5sZXQgaTE4bkluZGV4U3RhY2tQb2ludGVyID0gLTE7XG5cbi8qKlxuICogQ29udmVydCBiaW5kaW5nIGluZGV4IHRvIG1hc2sgYml0LlxuICpcbiAqIEVhY2ggaW5kZXggcmVwcmVzZW50cyBhIHNpbmdsZSBiaXQgb24gdGhlIGJpdC1tYXNrLiBCZWNhdXNlIGJpdC1tYXNrIG9ubHkgaGFzIDMyIGJpdHMsIHdlIG1ha2VcbiAqIHRoZSAzMm5kIGJpdCBzaGFyZSBhbGwgbWFza3MgZm9yIGFsbCBiaW5kaW5ncyBoaWdoZXIgdGhhbiAzMi4gU2luY2UgaXQgaXMgZXh0cmVtZWx5IHJhcmUgdG8gaGF2ZVxuICogbW9yZSB0aGFuIDMyIGJpbmRpbmdzIHRoaXMgd2lsbCBiZSBoaXQgdmVyeSByYXJlbHkuIFRoZSBkb3duc2lkZSBvZiBoaXR0aW5nIHRoaXMgY29ybmVyIGNhc2UgaXNcbiAqIHRoYXQgd2Ugd2lsbCBleGVjdXRlIGJpbmRpbmcgY29kZSBtb3JlIG9mdGVuIHRoYW4gbmVjZXNzYXJ5LiAocGVuYWx0eSBvZiBwZXJmb3JtYW5jZSlcbiAqL1xuZnVuY3Rpb24gdG9NYXNrQml0KGJpbmRpbmdJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIDEgPDwgTWF0aC5taW4oYmluZGluZ0luZGV4LCAzMSk7XG59XG5cbmNvbnN0IHBhcmVudEluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5cbi8qKlxuICogTWFya3MgYSBibG9jayBvZiB0ZXh0IGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBUaGUgaW5zdHJ1Y3Rpb25zIGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAgbWFyayB0aGUgdHJhbnNsYXRpb24gYmxvY2sgaW4gdGhlIHRlbXBsYXRlLlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRpMThuU3RhcnQoaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkluZGV4U3RhY2tbKytpMThuSW5kZXhTdGFja1BvaW50ZXJdID0gaW5kZXg7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICBpMThuU3RhcnRGaXJzdFBhc3ModFZpZXcsIGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgfVxufVxuXG4vLyBDb3VudCBmb3IgdGhlIG51bWJlciBvZiB2YXJzIHRoYXQgd2lsbCBiZSBhbGxvY2F0ZWQgZm9yIGVhY2ggaTE4biBibG9jay5cbi8vIEl0IGlzIGdsb2JhbCBiZWNhdXNlIHRoaXMgaXMgdXNlZCBpbiBtdWx0aXBsZSBmdW5jdGlvbnMgdGhhdCBpbmNsdWRlIGxvb3BzIGFuZCByZWN1cnNpdmUgY2FsbHMuXG4vLyBUaGlzIGlzIHJlc2V0IHRvIDAgd2hlbiBgaTE4blN0YXJ0Rmlyc3RQYXNzYCBpcyBjYWxsZWQuXG5sZXQgaTE4blZhcnNDb3VudDogbnVtYmVyO1xuXG4vKipcbiAqIFNlZSBgaTE4blN0YXJ0YCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4blN0YXJ0Rmlyc3RQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJsdWVwcmludC5sZW5ndGggLSBIRUFERVJfT0ZGU0VUO1xuICBpMThuVmFyc0NvdW50ID0gMDtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gZ2V0SXNQYXJlbnQoKSA/IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG4gIGxldCBwYXJlbnRJbmRleCA9XG4gICAgICBwYXJlbnRUTm9kZSAmJiBwYXJlbnRUTm9kZSAhPT0gdmlld0RhdGFbVF9IT1NUXSA/IHBhcmVudFROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCA6IGluZGV4O1xuICBsZXQgcGFyZW50SW5kZXhQb2ludGVyID0gMDtcbiAgcGFyZW50SW5kZXhTdGFja1twYXJlbnRJbmRleFBvaW50ZXJdID0gcGFyZW50SW5kZXg7XG4gIGNvbnN0IGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzID0gW107XG4gIC8vIElmIHRoZSBwcmV2aW91cyBub2RlIHdhc24ndCB0aGUgZGlyZWN0IHBhcmVudCB0aGVuIHdlIGhhdmUgYSB0cmFuc2xhdGlvbiB3aXRob3V0IHRvcCBsZXZlbFxuICAvLyBlbGVtZW50IGFuZCB3ZSBuZWVkIHRvIGtlZXAgYSByZWZlcmVuY2Ugb2YgdGhlIHByZXZpb3VzIGVsZW1lbnQgaWYgdGhlcmUgaXMgb25lXG4gIGlmIChpbmRleCA+IDAgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSBwYXJlbnRUTm9kZSkge1xuICAgIC8vIENyZWF0ZSBhbiBPcENvZGUgdG8gc2VsZWN0IHRoZSBwcmV2aW91cyBUTm9kZVxuICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QpO1xuICB9XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGNvbnN0IGljdUV4cHJlc3Npb25zOiBUSWN1W10gPSBbXTtcblxuICBjb25zdCB0ZW1wbGF0ZVRyYW5zbGF0aW9uID0gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgY29uc3QgbXNnUGFydHMgPSB0ZW1wbGF0ZVRyYW5zbGF0aW9uLnNwbGl0KFBIX1JFR0VYUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXNnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWUgPSBtc2dQYXJ0c1tpXTtcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzKVxuICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJy8nKSB7XG4gICAgICAgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgxKSA9PT0gJyMnKSB7XG4gICAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigyKSwgMTApO1xuICAgICAgICAgIHBhcmVudEluZGV4ID0gcGFyZW50SW5kZXhTdGFja1stLXBhcmVudEluZGV4UG9pbnRlcl07XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDEpLCAxMCk7XG4gICAgICAgIC8vIFRoZSB2YWx1ZSByZXByZXNlbnRzIGEgcGxhY2Vob2xkZXIgdGhhdCB3ZSBtb3ZlIHRvIHRoZSBkZXNpZ25hdGVkIGluZGV4XG4gICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgIHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCxcbiAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJyMnKSB7XG4gICAgICAgICAgcGFyZW50SW5kZXhTdGFja1srK3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleCA9IHBoSW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MgJiBJQ1UgZXhwcmVzc2lvbnMpXG4gICAgICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyh2YWx1ZSk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBJQ1UgZXhwcmVzc2lvbnNcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdU5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmdEZXZNb2RlID8gYElDVSAke2ljdU5vZGVJbmRleH1gIDogJycsIGljdU5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSBjb2RlcyBmb3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1RXhwcmVzc2lvbiA9IHBhcnRzW2pdIGFzIEljdUV4cHJlc3Npb247XG4gICAgICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb24pO1xuICAgICAgICAgIGljdVN0YXJ0KGljdUV4cHJlc3Npb25zLCBpY3VFeHByZXNzaW9uLCBpY3VOb2RlSW5kZXgsIGljdU5vZGVJbmRleCk7XG4gICAgICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgICAgIGNvbnN0IHRJY3VJbmRleCA9IGljdUV4cHJlc3Npb25zLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyksICAvLyBtYXNrIG9mIHRoZSBtYWluIGJpbmRpbmdcbiAgICAgICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCwgdEljdUluZGV4LFxuICAgICAgICAgICAgICBtYXNrLCAgLy8gbWFzayBvZiBhbGwgdGhlIGJpbmRpbmdzIG9mIHRoaXMgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLCB0SWN1SW5kZXgpO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnRzW2pdICE9PSAnJykge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBwYXJ0c1tqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHRleHQubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGVzXG4gICAgICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGJpbmRpbmcsIHRoZSB2YWx1ZSB3aWxsIGJlIHNldCBkdXJpbmcgdXBkYXRlXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHRleHQsIHRleHROb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHRleHQsIHRleHROb2RlSW5kZXgpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhbGxvY0V4cGFuZG8odmlld0RhdGEsIGkxOG5WYXJzQ291bnQpO1xuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXR0YWNoSTE4bk9wQ29kZXNEZWJ1ZyhcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzLCBpY3VFeHByZXNzaW9ucy5sZW5ndGggPyBpY3VFeHByZXNzaW9ucyA6IG51bGwsIHZpZXdEYXRhKTtcblxuICAvLyBOT1RFOiBsb2NhbCB2YXIgbmVlZGVkIHRvIHByb3Blcmx5IGFzc2VydCB0aGUgdHlwZSBvZiBgVEkxOG5gLlxuICBjb25zdCB0STE4bjogVEkxOG4gPSB7XG4gICAgdmFyczogaTE4blZhcnNDb3VudCxcbiAgICBjcmVhdGU6IGNyZWF0ZU9wQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVPcENvZGVzLFxuICAgIGljdXM6IGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCxcbiAgfTtcblxuICB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSB0STE4bjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGUodE5vZGU6IFROb2RlLCBwYXJlbnRUTm9kZTogVE5vZGUsIHByZXZpb3VzVE5vZGU6IFROb2RlIHwgbnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIGNvbnN0IG5leHROb2RlID0gdE5vZGUubmV4dDtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBpZiAoIXByZXZpb3VzVE5vZGUpIHtcbiAgICBwcmV2aW91c1ROb2RlID0gcGFyZW50VE5vZGU7XG4gIH1cblxuICAvLyBSZS1vcmdhbml6ZSBub2RlIHRyZWUgdG8gcHV0IHRoaXMgbm9kZSBpbiB0aGUgY29ycmVjdCBwb3NpdGlvbi5cbiAgaWYgKHByZXZpb3VzVE5vZGUgPT09IHBhcmVudFROb2RlICYmIHROb2RlICE9PSBwYXJlbnRUTm9kZS5jaGlsZCkge1xuICAgIHROb2RlLm5leHQgPSBwYXJlbnRUTm9kZS5jaGlsZDtcbiAgICBwYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICB9IGVsc2UgaWYgKHByZXZpb3VzVE5vZGUgIT09IHBhcmVudFROb2RlICYmIHROb2RlICE9PSBwcmV2aW91c1ROb2RlLm5leHQpIHtcbiAgICB0Tm9kZS5uZXh0ID0gcHJldmlvdXNUTm9kZS5uZXh0O1xuICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICB9IGVsc2Uge1xuICAgIHROb2RlLm5leHQgPSBudWxsO1xuICB9XG5cbiAgaWYgKHBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtUX0hPU1RdKSB7XG4gICAgdE5vZGUucGFyZW50ID0gcGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuICB9XG5cbiAgLy8gSWYgdE5vZGUgd2FzIG1vdmVkIGFyb3VuZCwgd2UgbWlnaHQgbmVlZCB0byBmaXggYSBicm9rZW4gbGluay5cbiAgbGV0IGN1cnNvcjogVE5vZGV8bnVsbCA9IHROb2RlLm5leHQ7XG4gIHdoaWxlIChjdXJzb3IpIHtcbiAgICBpZiAoY3Vyc29yLm5leHQgPT09IHROb2RlKSB7XG4gICAgICBjdXJzb3IubmV4dCA9IG5leHROb2RlO1xuICAgIH1cbiAgICBjdXJzb3IgPSBjdXJzb3IubmV4dDtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIHZpZXdEYXRhKSwgdE5vZGUsIHZpZXdEYXRhKTtcblxuICBjb25zdCBzbG90VmFsdWUgPSB2aWV3RGF0YVt0Tm9kZS5pbmRleF07XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gTm9kZXMgdGhhdCBpbmplY3QgVmlld0NvbnRhaW5lclJlZiBhbHNvIGhhdmUgYSBjb21tZW50IG5vZGUgdGhhdCBzaG91bGQgYmUgbW92ZWRcbiAgICBhcHBlbmRDaGlsZChzbG90VmFsdWVbTkFUSVZFXSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgZm9yIGludGVybmF0aW9uYWxpemF0aW9uLlxuICpcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGJ5IHRyYW5zZm9ybWluZyBpdCBmcm9tIGludGVybWVkaWF0ZVxuICogZm9ybWF0ICh0aGF0IG1pZ2h0IGNvbnRhaW4gc29tZSBtYXJrZXJzIHRoYXQgd2UgbmVlZCB0byByZXBsYWNlKSB0byB0aGUgZmluYWxcbiAqIGZvcm0sIGNvbnN1bWFibGUgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uLiBQb3N0IHByb2Nlc3Npbmcgc3RlcHMgaW5jbHVkZTpcbiAqXG4gKiAxLiBSZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBjYXNlcyAobGlrZSBb77+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vXzvv70177+9XSlcbiAqIDIuIFJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICogMy4gUmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KVxuICogICAgaW4gY2FzZSBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFJhdyB0cmFuc2xhdGlvbiBzdHJpbmcgZm9yIHBvc3QgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHJlcGxhY2VtZW50cyBTZXQgb2YgcmVwbGFjZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWRcbiAqXG4gKiBAcmV0dXJucyBUcmFuc2Zvcm1lZCBzdHJpbmcgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UaTE4blBvc3Rwcm9jZXNzKFxuICAgIG1lc3NhZ2U6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7W2tleTogc3RyaW5nXTogKHN0cmluZyB8IHN0cmluZ1tdKX0gPSB7fSk6IHN0cmluZyB7XG4gIC8qKlxuICAgKiBTdGVwIDE6IHJlc29sdmUgYWxsIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBsaWtlIFvvv70jNe+/vXzvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9XVxuICAgKlxuICAgKiBOb3RlOiBkdWUgdG8gdGhlIHdheSB3ZSBwcm9jZXNzIG5lc3RlZCB0ZW1wbGF0ZXMgKEJGUyksIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBhcmUgdHlwaWNhbGx5XG4gICAqIGdyb3VwZWQgYnkgdGVtcGxhdGVzLCBmb3IgZXhhbXBsZTogW++/vSM177+9fO+/vSM277+9fO+/vSMxOjHvv71877+9IzM6Mu+/vV0gd2hlcmUg77+9IzXvv70gYW5kIO+/vSM277+9IGJlbG9uZyB0byByb290XG4gICAqIHRlbXBsYXRlLCDvv70jMTox77+9IGJlbG9uZyB0byBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleCAxIGFuZCDvv70jMToy77+9IC0gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXhcbiAgICogMy4gSG93ZXZlciBpbiByZWFsIHRlbXBsYXRlcyB0aGUgb3JkZXIgbWlnaHQgYmUgZGlmZmVyZW50OiBpLmUuIO+/vSMxOjHvv70gYW5kL29yIO+/vSMzOjLvv70gbWF5IGdvIGluXG4gICAqIGZyb250IG9mIO+/vSM277+9LiBUaGUgcG9zdCBwcm9jZXNzaW5nIHN0ZXAgcmVzdG9yZXMgdGhlIHJpZ2h0IG9yZGVyIGJ5IGtlZXBpbmcgdHJhY2sgb2YgdGhlXG4gICAqIHRlbXBsYXRlIGlkIHN0YWNrIGFuZCBsb29rcyBmb3IgcGxhY2Vob2xkZXJzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlbXBsYXRlLlxuICAgKi9cbiAgbGV0IHJlc3VsdDogc3RyaW5nID0gbWVzc2FnZTtcbiAgaWYgKFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAudGVzdChtZXNzYWdlKSkge1xuICAgIGNvbnN0IG1hdGNoZXM6IHtba2V5OiBzdHJpbmddOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW119ID0ge307XG4gICAgY29uc3QgdGVtcGxhdGVJZHNTdGFjazogbnVtYmVyW10gPSBbUk9PVF9URU1QTEFURV9JRF07XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfUExBQ0VIT0xERVJTX1JFR0VYUCwgKG06IGFueSwgcGhzOiBzdHJpbmcsIHRtcGw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcGhzIHx8IHRtcGw7XG4gICAgICBpZiAoIW1hdGNoZXNbY29udGVudF0pIHtcbiAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW10gPSBbXTtcbiAgICAgICAgY29udGVudC5zcGxpdCgnfCcpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHBsYWNlaG9sZGVyLm1hdGNoKFBQX1RFTVBMQVRFX0lEX1JFR0VYUCk7XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVJZCA9IG1hdGNoID8gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSA6IFJPT1RfVEVNUExBVEVfSUQ7XG4gICAgICAgICAgY29uc3QgaXNDbG9zZVRlbXBsYXRlVGFnID0gUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQLnRlc3QocGxhY2Vob2xkZXIpO1xuICAgICAgICAgIHBsYWNlaG9sZGVycy5wdXNoKFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVzW2NvbnRlbnRdID0gcGxhY2Vob2xkZXJzO1xuICAgICAgfVxuICAgICAgaWYgKCFtYXRjaGVzW2NvbnRlbnRdLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBwbGFjZWhvbGRlciAtICR7Y29udGVudH1gKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZUlkID0gdGVtcGxhdGVJZHNTdGFja1t0ZW1wbGF0ZUlkc1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgcGxhY2Vob2xkZXJzID0gbWF0Y2hlc1tjb250ZW50XTtcbiAgICAgIGxldCBpZHggPSAwO1xuICAgICAgLy8gZmluZCBwbGFjZWhvbGRlciBpbmRleCB0aGF0IG1hdGNoZXMgY3VycmVudCB0ZW1wbGF0ZSBpZFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwbGFjZWhvbGRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBsYWNlaG9sZGVyc1tpXVswXSA9PT0gY3VycmVudFRlbXBsYXRlSWQpIHtcbiAgICAgICAgICBpZHggPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyB1cGRhdGUgdGVtcGxhdGUgaWQgc3RhY2sgYmFzZWQgb24gdGhlIGN1cnJlbnQgdGFnIGV4dHJhY3RlZFxuICAgICAgY29uc3QgW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdID0gcGxhY2Vob2xkZXJzW2lkeF07XG4gICAgICBpZiAoaXNDbG9zZVRlbXBsYXRlVGFnKSB7XG4gICAgICAgIHRlbXBsYXRlSWRzU3RhY2sucG9wKCk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRUZW1wbGF0ZUlkICE9PSB0ZW1wbGF0ZUlkKSB7XG4gICAgICAgIHRlbXBsYXRlSWRzU3RhY2sucHVzaCh0ZW1wbGF0ZUlkKTtcbiAgICAgIH1cbiAgICAgIC8vIHJlbW92ZSBwcm9jZXNzZWQgdGFnIGZyb20gdGhlIGxpc3RcbiAgICAgIHBsYWNlaG9sZGVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHJldHVybiBwbGFjZWhvbGRlcjtcbiAgICB9KTtcblxuICAgIC8vIHZlcmlmeSB0aGF0IHdlIGluamVjdGVkIGFsbCB2YWx1ZXNcbiAgICBjb25zdCBoYXNVbm1hdGNoZWRWYWx1ZXMgPSBPYmplY3Qua2V5cyhtYXRjaGVzKS5zb21lKGtleSA9PiAhIW1hdGNoZXNba2V5XS5sZW5ndGgpO1xuICAgIGlmIChoYXNVbm1hdGNoZWRWYWx1ZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgaTE4biBwb3N0cHJvY2VzczogdW5tYXRjaGVkIHZhbHVlcyAtICR7SlNPTi5zdHJpbmdpZnkobWF0Y2hlcyl9YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gcmV0dXJuIGN1cnJlbnQgcmVzdWx0IGlmIG5vIHJlcGxhY2VtZW50cyBzcGVjaWZpZWRcbiAgaWYgKCFPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogU3RlcCAyOiByZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9WQVJTX1JFR0VYUCwgKG1hdGNoLCBzdGFydCwga2V5LCBfdHlwZSwgX2lkeCwgZW5kKTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyBgJHtzdGFydH0ke3JlcGxhY2VtZW50c1trZXldfSR7ZW5kfWAgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgMzogcmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KSBpbiBjYXNlXG4gICAqIG11bHRpcGxlIElDVXMgaGF2ZSB0aGUgc2FtZSBwbGFjZWhvbGRlciBuYW1lXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VTX1JFR0VYUCwgKG1hdGNoLCBrZXkpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChyZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgbGlzdCA9IHJlcGxhY2VtZW50c1trZXldIGFzIHN0cmluZ1tdO1xuICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBJQ1UgLSAke21hdGNofSB3aXRoIGtleTogJHtrZXl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGlzdC5zaGlmdCgpICE7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgbWFya2VkIGJ5IGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAuIEl0IGluc2VydHMgdGhlIHRleHQvSUNVIG5vZGVzXG4gKiBpbnRvIHRoZSByZW5kZXIgdHJlZSwgbW92ZXMgdGhlIHBsYWNlaG9sZGVyIG5vZGVzIGFuZCByZW1vdmVzIHRoZSBkZWxldGVkIG5vZGVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGkxOG5FbmQoKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkVuZEZpcnN0UGFzcyh0Vmlldyk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuRW5kYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkVuZEZpcnN0UGFzcyh0VmlldzogVFZpZXcpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHZpZXdEYXRhW1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnaTE4bkVuZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZycpO1xuXG4gIGNvbnN0IHJvb3RJbmRleCA9IGkxOG5JbmRleFN0YWNrW2kxOG5JbmRleFN0YWNrUG9pbnRlci0tXTtcbiAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW3Jvb3RJbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFRJMThuO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0STE4biwgYFlvdSBzaG91bGQgY2FsbCBpMThuU3RhcnQgYmVmb3JlIGkxOG5FbmRgKTtcblxuICAvLyBGaW5kIHRoZSBsYXN0IG5vZGUgdGhhdCB3YXMgYWRkZWQgYmVmb3JlIGBpMThuRW5kYFxuICBsZXQgbGFzdENyZWF0ZWROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG5cbiAgLy8gUmVhZCB0aGUgaW5zdHJ1Y3Rpb25zIHRvIGluc2VydC9tb3ZlL3JlbW92ZSBET00gZWxlbWVudHNcbiAgY29uc3QgdmlzaXRlZE5vZGVzID0gcmVhZENyZWF0ZU9wQ29kZXMocm9vdEluZGV4LCB0STE4bi5jcmVhdGUsIHRJMThuLmljdXMsIHZpZXdEYXRhKTtcblxuICAvLyBSZW1vdmUgZGVsZXRlZCBub2Rlc1xuICBmb3IgKGxldCBpID0gcm9vdEluZGV4ICsgMTsgaSA8PSBsYXN0Q3JlYXRlZE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUOyBpKyspIHtcbiAgICBpZiAodmlzaXRlZE5vZGVzLmluZGV4T2YoaSkgPT09IC0xKSB7XG4gICAgICByZW1vdmVOb2RlKGksIHZpZXdEYXRhKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBzdG9yZXMgdGhlIGR5bmFtaWMgVE5vZGUsIGFuZCB1bmhvb2tzIGl0IGZyb20gdGhlIHRyZWUgZm9yIG5vdy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsKTogVEVsZW1lbnROb2RlfFRJY3VDb250YWluZXJOb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIHR5cGUgYXMgYW55LCBuYXRpdmUsIG5hbWUsIG51bGwpO1xuXG4gIC8vIFdlIGFyZSBjcmVhdGluZyBhIGR5bmFtaWMgbm9kZSwgdGhlIHByZXZpb3VzIHROb2RlIG1pZ2h0IG5vdCBiZSBwb2ludGluZyBhdCB0aGlzIG5vZGUuXG4gIC8vIFdlIHdpbGwgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZSBsYXRlciB3aXRoIGBhcHBlbmRJMThuTm9kZWAuXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9PT0gdE5vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRDcmVhdGVPcENvZGVzKFxuICAgIGluZGV4OiBudW1iZXIsIGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLFxuICAgIHZpZXdEYXRhOiBMVmlldyk6IG51bWJlcltdIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRMVmlldygpW1JFTkRFUkVSXTtcbiAgbGV0IGN1cnJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgY29uc3QgdmlzaXRlZE5vZGVzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNyZWF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBvcENvZGUgPSBjcmVhdGVPcENvZGVzW2ldO1xuICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCB0ZXh0Uk5vZGUgPSBjcmVhdGVUZXh0Tm9kZShvcENvZGUsIHJlbmRlcmVyKTtcbiAgICAgIGNvbnN0IHRleHROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KHRleHROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Uk5vZGUsIG51bGwpO1xuICAgICAgdmlzaXRlZE5vZGVzLnB1c2godGV4dE5vZGVJbmRleCk7XG4gICAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVDtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb25UTm9kZTogVE5vZGU7XG4gICAgICAgICAgaWYgKGRlc3RpbmF0aW9uTm9kZUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGRlc3RpbmF0aW9uIG5vZGUgaXMgYGkxOG5TdGFydGAsIHdlIGRvbid0IGhhdmUgYVxuICAgICAgICAgICAgLy8gdG9wLWxldmVsIG5vZGUgYW5kIHdlIHNob3VsZCB1c2UgdGhlIGhvc3Qgbm9kZSBpbnN0ZWFkXG4gICAgICAgICAgICBkZXN0aW5hdGlvblROb2RlID0gdmlld0RhdGFbVF9IT1NUXSAhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblROb2RlID0gZ2V0VE5vZGUoZGVzdGluYXRpb25Ob2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICBjdXJyZW50VE5vZGUgISxcbiAgICAgICAgICAgICAgICAgIGBZb3UgbmVlZCB0byBjcmVhdGUgb3Igc2VsZWN0IGEgbm9kZSBiZWZvcmUgeW91IGNhbiBpbnNlcnQgaXQgaW50byB0aGUgRE9NYCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKGN1cnJlbnRUTm9kZSAhLCBkZXN0aW5hdGlvblROb2RlLCBwcmV2aW91c1ROb2RlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKG5vZGVJbmRleCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICBpZiAoY3VycmVudFROb2RlKSB7XG4gICAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICBjb25zdCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlKTtcbiAgICAgICAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIM6UZWxlbWVudEF0dHJpYnV0ZShlbGVtZW50Tm9kZUluZGV4LCBhdHRyTmFtZSwgYXR0clZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICBjYXNlIENPTU1FTlRfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IGNvbW1lbnRWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgY29tbWVudE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGNvbW1lbnRWYWx1ZSwgJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBgRXhwZWN0ZWQgXCIke2NvbW1lbnRWYWx1ZX1cIiB0byBiZSBhIGNvbW1lbnQgbm9kZSB2YWx1ZWApO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnRSTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQoY29tbWVudFZhbHVlKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgICAgICAgICAgICBjb21tZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBjb21tZW50Uk5vZGUsIG51bGwpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb21tZW50Uk5vZGUsIHZpZXdEYXRhKTtcbiAgICAgICAgICAoY3VycmVudFROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlKS5hY3RpdmVDYXNlSW5kZXggPSBudWxsO1xuICAgICAgICAgIC8vIFdlIHdpbGwgYWRkIHRoZSBjYXNlIG5vZGVzIGxhdGVyLCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZVxuICAgICAgICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIGVsZW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBlbGVtZW50Uk5vZGUsIHRhZ05hbWVWYWx1ZSk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goZWxlbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRJc1BhcmVudChmYWxzZSk7XG5cbiAgcmV0dXJuIHZpc2l0ZWROb2Rlcztcbn1cblxuZnVuY3Rpb24gcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNoYW5nZU1hc2s6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBieXBhc3NDaGVja0JpdCA9IGZhbHNlKSB7XG4gIGxldCBjYXNlQ3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVwZGF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgY29uc3QgY2hlY2tCaXQgPSB1cGRhdGVPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgIGNvbnN0IHNraXBDb2RlcyA9IHVwZGF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgaWYgKGJ5cGFzc0NoZWNrQml0IHx8IChjaGVja0JpdCAmIGNoYW5nZU1hc2spKSB7XG4gICAgICAvLyBUaGUgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCBzaW5jZSBsYXN0IGNoZWNrZWRcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeSh2aWV3RGF0YVtiaW5kaW5nc1N0YXJ0SW5kZXggLSBvcENvZGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgbGV0IGljdVROb2RlOiBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBTYW5pdGl6ZXJGbiB8IG51bGw7XG4gICAgICAgICAgICAgICAgzpRlbGVtZW50QXR0cmlidXRlKG5vZGVJbmRleCwgYXR0ck5hbWUsIHZhbHVlLCBzYW5pdGl6ZUZuKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgzpR0ZXh0QmluZGluZyhub2RlSW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSB1cGRhdGVPcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGFjdGl2ZSBjYXNlLCBkZWxldGUgdGhlIG9sZCBub2Rlc1xuICAgICAgICAgICAgICAgIGlmIChpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUNvZGVzID0gdEljdS5yZW1vdmVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcmVtb3ZlQ29kZXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlT3BDb2RlID0gcmVtb3ZlQ29kZXNba10gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlbW92ZU9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZU5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlTmVzdGVkSWN1OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1Tm9kZUluZGV4ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVDb2Rlc1trICsgMV0gYXMgbnVtYmVyID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdVROb2RlID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRUTm9kZShuZXN0ZWRJY3VOb2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUluZGV4ID0gbmVzdGVkSWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdVRJbmRleCA9IHJlbW92ZU9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZFRJY3UgPSBpY3VzICFbbmVzdGVkSWN1VEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShuZXN0ZWRUSWN1LnJlbW92ZVthY3RpdmVJbmRleF0sIHJlbW92ZUNvZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBhY3RpdmUgY2FzZUluZGV4XG4gICAgICAgICAgICAgICAgY29uc3QgY2FzZUluZGV4ID0gZ2V0Q2FzZUluZGV4KHRJY3UsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggPSBjYXNlSW5kZXggIT09IC0xID8gY2FzZUluZGV4IDogbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbm9kZXMgZm9yIHRoZSBuZXcgY2FzZVxuICAgICAgICAgICAgICAgIHJlYWRDcmVhdGVPcENvZGVzKC0xLCB0SWN1LmNyZWF0ZVtjYXNlSW5kZXhdLCBpY3VzLCB2aWV3RGF0YSk7XG4gICAgICAgICAgICAgICAgY2FzZUNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGljdVROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgIHRJY3UudXBkYXRlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCAhXSwgaWN1cywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrLFxuICAgICAgICAgICAgICAgICAgICB2aWV3RGF0YSwgY2FzZUNyZWF0ZWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpICs9IHNraXBDb2RlcztcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVOb2RlKGluZGV4OiBudW1iZXIsIHZpZXdEYXRhOiBMVmlldykge1xuICBjb25zdCByZW1vdmVkUGhUTm9kZSA9IGdldFROb2RlKGluZGV4LCB2aWV3RGF0YSk7XG4gIGNvbnN0IHJlbW92ZWRQaFJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgdmlld0RhdGEpO1xuICBpZiAocmVtb3ZlZFBoUk5vZGUpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHZpZXdEYXRhW1JFTkRFUkVSXSwgcmVtb3ZlZFBoUk5vZGUpO1xuICB9XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gzpRsb2FkKGluZGV4KSBhcyBSRWxlbWVudCB8IFJDb21tZW50IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0O1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gc2xvdFZhbHVlIGFzIExDb250YWluZXI7XG4gICAgaWYgKHJlbW92ZWRQaFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG59XG5cbi8qKlxuICpcbiAqIFVzZSB0aGlzIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRyYW5zbGF0aW9uIGJsb2NrIHRoYXQgZG9lc24ndCBjb250YWluIGFueSBwbGFjZWhvbGRlci5cbiAqIEl0IGNhbGxzIGJvdGgge0BsaW5rIGkxOG5TdGFydH0gYW5kIHtAbGluayBpMThuRW5kfSBpbiBvbmUgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRpMThuKGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICDOlGkxOG5TdGFydChpbmRleCwgbWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIM6UaTE4bkVuZCgpO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgbGlzdCBvZiBhdHRyaWJ1dGVzIGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggaW4gdGhlIHN0YXRpYyBibG9ja1xuICogQHBhcmFtIHZhbHVlc1xuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXcsIGluZGV4LCB2YWx1ZXMpO1xuICB9XG59XG5cbi8qKlxuICogU2VlIGBpMThuQXR0cmlidXRlc2AgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50SW5kZXggPSBwcmV2aW91c0VsZW1lbnQuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWVzW2ldO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB2YWx1ZXNbaSArIDFdO1xuICAgIGNvbnN0IHBhcnRzID0gbWVzc2FnZS5zcGxpdChJQ1VfUkVHRVhQKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcnRzW2pdO1xuXG4gICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXNcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09ICcnKSB7XG4gICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISF2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgcHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lKSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgzpRlbGVtZW50QXR0cmlidXRlKHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdXBkYXRlT3BDb2Rlcztcbn1cblxubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5sZXQgc2hpZnRzQ291bnRlciA9IDA7XG5cbi8qKlxuICogU3RvcmVzIHRoZSB2YWx1ZXMgb2YgdGhlIGJpbmRpbmdzIGR1cmluZyBlYWNoIHVwZGF0ZSBjeWNsZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0b1xuICogdXBkYXRlIHRoZSB0cmFuc2xhdGVkIG5vZGVzLlxuICpcbiAqIEBwYXJhbSBleHByZXNzaW9uIFRoZSBiaW5kaW5nJ3MgbmV3IHZhbHVlIG9yIE5PX0NIQU5HRVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGkxOG5FeHA8VD4oZXhwcmVzc2lvbjogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAoZXhwcmVzc2lvbiAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGkxOG5BcHBseShpbmRleDogbnVtYmVyKSB7XG4gIGlmIChzaGlmdHNDb3VudGVyKSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXTtcbiAgICBsZXQgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgbGV0IGljdXM6IFRJY3VbXXxudWxsID0gbnVsbDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0STE4bikpIHtcbiAgICAgIHVwZGF0ZU9wQ29kZXMgPSB0STE4biBhcyBJMThuVXBkYXRlT3BDb2RlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9ICh0STE4biBhcyBUSTE4bikudXBkYXRlO1xuICAgICAgaWN1cyA9ICh0STE4biBhcyBUSTE4bikuaWN1cztcbiAgICB9XG4gICAgY29uc3QgYmluZGluZ3NTdGFydEluZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gLSBzaGlmdHNDb3VudGVyIC0gMTtcbiAgICByZWFkVXBkYXRlT3BDb2Rlcyh1cGRhdGVPcENvZGVzLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssIGxWaWV3KTtcblxuICAgIC8vIFJlc2V0IGNoYW5nZU1hc2sgJiBtYXNrQml0IHRvIGRlZmF1bHQgZm9yIHRoZSBuZXh0IHVwZGF0ZSBjeWNsZVxuICAgIGNoYW5nZU1hc2sgPSAwYjA7XG4gICAgc2hpZnRzQ291bnRlciA9IDA7XG4gIH1cbn1cblxuZW51bSBQbHVyYWwge1xuICBaZXJvID0gMCxcbiAgT25lID0gMSxcbiAgVHdvID0gMixcbiAgRmV3ID0gMyxcbiAgTWFueSA9IDQsXG4gIE90aGVyID0gNSxcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwbHVyYWwgY2FzZSBiYXNlZCBvbiB0aGUgbG9jYWxlLlxuICogVGhpcyBpcyBhIGNvcHkgb2YgdGhlIGRlcHJlY2F0ZWQgZnVuY3Rpb24gdGhhdCB3ZSB1c2VkIGluIEFuZ3VsYXIgdjQuXG4gKiAvLyBUT0RPKG9jb21iZSk6IHJlbW92ZSB0aGlzIG9uY2Ugd2UgY2FuIHRoZSByZWFsIGdldFBsdXJhbENhc2UgZnVuY3Rpb25cbiAqXG4gKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHRoZSBwbHVyYWwgY2FzZSBmdW5jdGlvbiBpcyBpbiBsb2NhbGUgZGF0YSBmaWxlcyBjb21tb24vbG9jYWxlcy8qLnRzXG4gKi9cbmZ1bmN0aW9uIGdldFBsdXJhbENhc2UobG9jYWxlOiBzdHJpbmcsIG5MaWtlOiBudW1iZXIgfCBzdHJpbmcpOiBQbHVyYWwge1xuICBpZiAodHlwZW9mIG5MaWtlID09PSAnc3RyaW5nJykge1xuICAgIG5MaWtlID0gcGFyc2VJbnQoPHN0cmluZz5uTGlrZSwgMTApO1xuICB9XG4gIGNvbnN0IG46IG51bWJlciA9IG5MaWtlIGFzIG51bWJlcjtcbiAgY29uc3QgbkRlY2ltYWwgPSBuLnRvU3RyaW5nKCkucmVwbGFjZSgvXlteLl0qXFwuPy8sICcnKTtcbiAgY29uc3QgaSA9IE1hdGguZmxvb3IoTWF0aC5hYnMobikpO1xuICBjb25zdCB2ID0gbkRlY2ltYWwubGVuZ3RoO1xuICBjb25zdCBmID0gcGFyc2VJbnQobkRlY2ltYWwsIDEwKTtcbiAgY29uc3QgdCA9IHBhcnNlSW50KG4udG9TdHJpbmcoKS5yZXBsYWNlKC9eW14uXSpcXC4/fDArJC9nLCAnJyksIDEwKSB8fCAwO1xuXG4gIGNvbnN0IGxhbmcgPSBsb2NhbGUuc3BsaXQoJy0nKVswXS50b0xvd2VyQ2FzZSgpO1xuXG4gIHN3aXRjaCAobGFuZykge1xuICAgIGNhc2UgJ2FmJzpcbiAgICBjYXNlICdhc2EnOlxuICAgIGNhc2UgJ2F6JzpcbiAgICBjYXNlICdiZW0nOlxuICAgIGNhc2UgJ2Jleic6XG4gICAgY2FzZSAnYmcnOlxuICAgIGNhc2UgJ2JyeCc6XG4gICAgY2FzZSAnY2UnOlxuICAgIGNhc2UgJ2NnZyc6XG4gICAgY2FzZSAnY2hyJzpcbiAgICBjYXNlICdja2InOlxuICAgIGNhc2UgJ2VlJzpcbiAgICBjYXNlICdlbCc6XG4gICAgY2FzZSAnZW8nOlxuICAgIGNhc2UgJ2VzJzpcbiAgICBjYXNlICdldSc6XG4gICAgY2FzZSAnZm8nOlxuICAgIGNhc2UgJ2Z1cic6XG4gICAgY2FzZSAnZ3N3JzpcbiAgICBjYXNlICdoYSc6XG4gICAgY2FzZSAnaGF3JzpcbiAgICBjYXNlICdodSc6XG4gICAgY2FzZSAnamdvJzpcbiAgICBjYXNlICdqbWMnOlxuICAgIGNhc2UgJ2thJzpcbiAgICBjYXNlICdrayc6XG4gICAgY2FzZSAna2tqJzpcbiAgICBjYXNlICdrbCc6XG4gICAgY2FzZSAna3MnOlxuICAgIGNhc2UgJ2tzYic6XG4gICAgY2FzZSAna3knOlxuICAgIGNhc2UgJ2xiJzpcbiAgICBjYXNlICdsZyc6XG4gICAgY2FzZSAnbWFzJzpcbiAgICBjYXNlICdtZ28nOlxuICAgIGNhc2UgJ21sJzpcbiAgICBjYXNlICdtbic6XG4gICAgY2FzZSAnbmInOlxuICAgIGNhc2UgJ25kJzpcbiAgICBjYXNlICduZSc6XG4gICAgY2FzZSAnbm4nOlxuICAgIGNhc2UgJ25uaCc6XG4gICAgY2FzZSAnbnluJzpcbiAgICBjYXNlICdvbSc6XG4gICAgY2FzZSAnb3InOlxuICAgIGNhc2UgJ29zJzpcbiAgICBjYXNlICdwcyc6XG4gICAgY2FzZSAncm0nOlxuICAgIGNhc2UgJ3JvZic6XG4gICAgY2FzZSAncndrJzpcbiAgICBjYXNlICdzYXEnOlxuICAgIGNhc2UgJ3NlaCc6XG4gICAgY2FzZSAnc24nOlxuICAgIGNhc2UgJ3NvJzpcbiAgICBjYXNlICdzcSc6XG4gICAgY2FzZSAndGEnOlxuICAgIGNhc2UgJ3RlJzpcbiAgICBjYXNlICd0ZW8nOlxuICAgIGNhc2UgJ3RrJzpcbiAgICBjYXNlICd0cic6XG4gICAgY2FzZSAndWcnOlxuICAgIGNhc2UgJ3V6JzpcbiAgICBjYXNlICd2byc6XG4gICAgY2FzZSAndnVuJzpcbiAgICBjYXNlICd3YWUnOlxuICAgIGNhc2UgJ3hvZyc6XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2FrJzpcbiAgICBjYXNlICdsbic6XG4gICAgY2FzZSAnbWcnOlxuICAgIGNhc2UgJ3BhJzpcbiAgICBjYXNlICd0aSc6XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDAgJiYgbiA8PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYW0nOlxuICAgIGNhc2UgJ2FzJzpcbiAgICBjYXNlICdibic6XG4gICAgY2FzZSAnZmEnOlxuICAgIGNhc2UgJ2d1JzpcbiAgICBjYXNlICdoaSc6XG4gICAgY2FzZSAna24nOlxuICAgIGNhc2UgJ21yJzpcbiAgICBjYXNlICd6dSc6XG4gICAgICBpZiAoaSA9PT0gMCB8fCBuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYXInOlxuICAgICAgaWYgKG4gPT09IDApIHJldHVybiBQbHVyYWwuWmVybztcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmIChuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMyAmJiBuICUgMTAwIDw9IDEwKSByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmIChuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMTEgJiYgbiAlIDEwMCA8PSA5OSkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdhc3QnOlxuICAgIGNhc2UgJ2NhJzpcbiAgICBjYXNlICdkZSc6XG4gICAgY2FzZSAnZW4nOlxuICAgIGNhc2UgJ2V0JzpcbiAgICBjYXNlICdmaSc6XG4gICAgY2FzZSAnZnknOlxuICAgIGNhc2UgJ2dsJzpcbiAgICBjYXNlICdpdCc6XG4gICAgY2FzZSAnbmwnOlxuICAgIGNhc2UgJ3N2JzpcbiAgICBjYXNlICdzdyc6XG4gICAgY2FzZSAndXInOlxuICAgIGNhc2UgJ3lpJzpcbiAgICAgIGlmIChpID09PSAxICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdiZSc6XG4gICAgICBpZiAobiAlIDEwID09PSAxICYmICEobiAlIDEwMCA9PT0gMTEpKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuICUgMTAgPT09IE1hdGguZmxvb3IobiAlIDEwKSAmJiBuICUgMTAgPj0gMiAmJiBuICUgMTAgPD0gNCAmJlxuICAgICAgICAgICEobiAlIDEwMCA+PSAxMiAmJiBuICUgMTAwIDw9IDE0KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAobiAlIDEwID09PSAwIHx8IG4gJSAxMCA9PT0gTWF0aC5mbG9vcihuICUgMTApICYmIG4gJSAxMCA+PSA1ICYmIG4gJSAxMCA8PSA5IHx8XG4gICAgICAgICAgbiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDExICYmIG4gJSAxMDAgPD0gMTQpXG4gICAgICAgIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYnInOlxuICAgICAgaWYgKG4gJSAxMCA9PT0gMSAmJiAhKG4gJSAxMDAgPT09IDExIHx8IG4gJSAxMDAgPT09IDcxIHx8IG4gJSAxMDAgPT09IDkxKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiAlIDEwID09PSAyICYmICEobiAlIDEwMCA9PT0gMTIgfHwgbiAlIDEwMCA9PT0gNzIgfHwgbiAlIDEwMCA9PT0gOTIpKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmIChuICUgMTAgPT09IE1hdGguZmxvb3IobiAlIDEwKSAmJiAobiAlIDEwID49IDMgJiYgbiAlIDEwIDw9IDQgfHwgbiAlIDEwID09PSA5KSAmJlxuICAgICAgICAgICEobiAlIDEwMCA+PSAxMCAmJiBuICUgMTAwIDw9IDE5IHx8IG4gJSAxMDAgPj0gNzAgJiYgbiAlIDEwMCA8PSA3OSB8fFxuICAgICAgICAgICAgbiAlIDEwMCA+PSA5MCAmJiBuICUgMTAwIDw9IDk5KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAoIShuID09PSAwKSAmJiBuICUgMWU2ID09PSAwKSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2JzJzpcbiAgICBjYXNlICdocic6XG4gICAgY2FzZSAnc3InOlxuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSAxICYmICEoaSAlIDEwMCA9PT0gMTEpIHx8IGYgJSAxMCA9PT0gMSAmJiAhKGYgJSAxMDAgPT09IDExKSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IE1hdGguZmxvb3IoaSAlIDEwKSAmJiBpICUgMTAgPj0gMiAmJiBpICUgMTAgPD0gNCAmJlxuICAgICAgICAgICAgICAhKGkgJSAxMDAgPj0gMTIgJiYgaSAlIDEwMCA8PSAxNCkgfHxcbiAgICAgICAgICBmICUgMTAgPT09IE1hdGguZmxvb3IoZiAlIDEwKSAmJiBmICUgMTAgPj0gMiAmJiBmICUgMTAgPD0gNCAmJlxuICAgICAgICAgICAgICAhKGYgJSAxMDAgPj0gMTIgJiYgZiAlIDEwMCA8PSAxNCkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdjcyc6XG4gICAgY2FzZSAnc2snOlxuICAgICAgaWYgKGkgPT09IDEgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAoaSA9PT0gTWF0aC5mbG9vcihpKSAmJiBpID49IDIgJiYgaSA8PSA0ICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKCEodiA9PT0gMCkpIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnY3knOlxuICAgICAgaWYgKG4gPT09IDApIHJldHVybiBQbHVyYWwuWmVybztcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmIChuID09PSAzKSByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmIChuID09PSA2KSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2RhJzpcbiAgICAgIGlmIChuID09PSAxIHx8ICEodCA9PT0gMCkgJiYgKGkgPT09IDAgfHwgaSA9PT0gMSkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdkc2InOlxuICAgIGNhc2UgJ2hzYic6XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAwID09PSAxIHx8IGYgJSAxMDAgPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gMiB8fCBmICUgMTAwID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMDAgPT09IE1hdGguZmxvb3IoaSAlIDEwMCkgJiYgaSAlIDEwMCA+PSAzICYmIGkgJSAxMDAgPD0gNCB8fFxuICAgICAgICAgIGYgJSAxMDAgPT09IE1hdGguZmxvb3IoZiAlIDEwMCkgJiYgZiAlIDEwMCA+PSAzICYmIGYgJSAxMDAgPD0gNClcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2ZmJzpcbiAgICBjYXNlICdmcic6XG4gICAgY2FzZSAnaHknOlxuICAgIGNhc2UgJ2thYic6XG4gICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZmlsJzpcbiAgICAgIGlmICh2ID09PSAwICYmIChpID09PSAxIHx8IGkgPT09IDIgfHwgaSA9PT0gMykgfHxcbiAgICAgICAgICB2ID09PSAwICYmICEoaSAlIDEwID09PSA0IHx8IGkgJSAxMCA9PT0gNiB8fCBpICUgMTAgPT09IDkpIHx8XG4gICAgICAgICAgISh2ID09PSAwKSAmJiAhKGYgJSAxMCA9PT0gNCB8fCBmICUgMTAgPT09IDYgfHwgZiAlIDEwID09PSA5KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2dhJzpcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gMyAmJiBuIDw9IDYpIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSA3ICYmIG4gPD0gMTApIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZ2QnOlxuICAgICAgaWYgKG4gPT09IDEgfHwgbiA9PT0gMTEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IDIgfHwgbiA9PT0gMTIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgKG4gPj0gMyAmJiBuIDw9IDEwIHx8IG4gPj0gMTMgJiYgbiA8PSAxOSkpIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdndic6XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmICh2ID09PSAwICYmXG4gICAgICAgICAgKGkgJSAxMDAgPT09IDAgfHwgaSAlIDEwMCA9PT0gMjAgfHwgaSAlIDEwMCA9PT0gNDAgfHwgaSAlIDEwMCA9PT0gNjAgfHwgaSAlIDEwMCA9PT0gODApKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmICghKHYgPT09IDApKSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2hlJzpcbiAgICAgIGlmIChpID09PSAxICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKGkgPT09IDIgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAodiA9PT0gMCAmJiAhKG4gPj0gMCAmJiBuIDw9IDEwKSAmJiBuICUgMTAgPT09IDApIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnaXMnOlxuICAgICAgaWYgKHQgPT09IDAgJiYgaSAlIDEwID09PSAxICYmICEoaSAlIDEwMCA9PT0gMTEpIHx8ICEodCA9PT0gMCkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdrc2gnOlxuICAgICAgaWYgKG4gPT09IDApIHJldHVybiBQbHVyYWwuWmVybztcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAna3cnOlxuICAgIGNhc2UgJ25hcSc6XG4gICAgY2FzZSAnc2UnOlxuICAgIGNhc2UgJ3Ntbic6XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2xhZyc6XG4gICAgICBpZiAobiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5aZXJvO1xuICAgICAgaWYgKChpID09PSAwIHx8IGkgPT09IDEpICYmICEobiA9PT0gMCkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdsdCc6XG4gICAgICBpZiAobiAlIDEwID09PSAxICYmICEobiAlIDEwMCA+PSAxMSAmJiBuICUgMTAwIDw9IDE5KSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiAlIDEwID09PSBNYXRoLmZsb29yKG4gJSAxMCkgJiYgbiAlIDEwID49IDIgJiYgbiAlIDEwIDw9IDkgJiZcbiAgICAgICAgICAhKG4gJSAxMDAgPj0gMTEgJiYgbiAlIDEwMCA8PSAxOSkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKCEoZiA9PT0gMCkpIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnbHYnOlxuICAgIGNhc2UgJ3ByZyc6XG4gICAgICBpZiAobiAlIDEwID09PSAwIHx8IG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAxMSAmJiBuICUgMTAwIDw9IDE5IHx8XG4gICAgICAgICAgdiA9PT0gMiAmJiBmICUgMTAwID09PSBNYXRoLmZsb29yKGYgJSAxMDApICYmIGYgJSAxMDAgPj0gMTEgJiYgZiAlIDEwMCA8PSAxOSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5aZXJvO1xuICAgICAgaWYgKG4gJSAxMCA9PT0gMSAmJiAhKG4gJSAxMDAgPT09IDExKSB8fCB2ID09PSAyICYmIGYgJSAxMCA9PT0gMSAmJiAhKGYgJSAxMDAgPT09IDExKSB8fFxuICAgICAgICAgICEodiA9PT0gMikgJiYgZiAlIDEwID09PSAxKVxuICAgICAgICByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnbWsnOlxuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSAxIHx8IGYgJSAxMCA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ210JzpcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSAwIHx8IG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAyICYmIG4gJSAxMDAgPD0gMTApXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAxMSAmJiBuICUgMTAwIDw9IDE5KSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3BsJzpcbiAgICAgIGlmIChpID09PSAxICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSBNYXRoLmZsb29yKGkgJSAxMCkgJiYgaSAlIDEwID49IDIgJiYgaSAlIDEwIDw9IDQgJiZcbiAgICAgICAgICAhKGkgJSAxMDAgPj0gMTIgJiYgaSAlIDEwMCA8PSAxNCkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKHYgPT09IDAgJiYgIShpID09PSAxKSAmJiBpICUgMTAgPT09IE1hdGguZmxvb3IoaSAlIDEwKSAmJiBpICUgMTAgPj0gMCAmJiBpICUgMTAgPD0gMSB8fFxuICAgICAgICAgIHYgPT09IDAgJiYgaSAlIDEwID09PSBNYXRoLmZsb29yKGkgJSAxMCkgJiYgaSAlIDEwID49IDUgJiYgaSAlIDEwIDw9IDkgfHxcbiAgICAgICAgICB2ID09PSAwICYmIGkgJSAxMDAgPT09IE1hdGguZmxvb3IoaSAlIDEwMCkgJiYgaSAlIDEwMCA+PSAxMiAmJiBpICUgMTAwIDw9IDE0KVxuICAgICAgICByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3B0JzpcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gMCAmJiBuIDw9IDIgJiYgIShuID09PSAyKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3JvJzpcbiAgICAgIGlmIChpID09PSAxICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKCEodiA9PT0gMCkgfHwgbiA9PT0gMCB8fFxuICAgICAgICAgICEobiA9PT0gMSkgJiYgbiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDEgJiYgbiAlIDEwMCA8PSAxOSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3J1JzpcbiAgICBjYXNlICd1ayc6XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IDEgJiYgIShpICUgMTAwID09PSAxMSkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSBNYXRoLmZsb29yKGkgJSAxMCkgJiYgaSAlIDEwID49IDIgJiYgaSAlIDEwIDw9IDQgJiZcbiAgICAgICAgICAhKGkgJSAxMDAgPj0gMTIgJiYgaSAlIDEwMCA8PSAxNCkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSAwIHx8XG4gICAgICAgICAgdiA9PT0gMCAmJiBpICUgMTAgPT09IE1hdGguZmxvb3IoaSAlIDEwKSAmJiBpICUgMTAgPj0gNSAmJiBpICUgMTAgPD0gOSB8fFxuICAgICAgICAgIHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gTWF0aC5mbG9vcihpICUgMTAwKSAmJiBpICUgMTAwID49IDExICYmIGkgJSAxMDAgPD0gMTQpXG4gICAgICAgIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnc2hpJzpcbiAgICAgIGlmIChpID09PSAwIHx8IG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSAyICYmIG4gPD0gMTApIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdzaSc6XG4gICAgICBpZiAobiA9PT0gMCB8fCBuID09PSAxIHx8IGkgPT09IDAgJiYgZiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3NsJzpcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMDAgPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAwID09PSBNYXRoLmZsb29yKGkgJSAxMDApICYmIGkgJSAxMDAgPj0gMyAmJiBpICUgMTAwIDw9IDQgfHwgISh2ID09PSAwKSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3R6bSc6XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDAgJiYgbiA8PSAxIHx8IG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSAxMSAmJiBuIDw9IDk5KVxuICAgICAgICByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgLy8gV2hlbiB0aGVyZSBpcyBubyBzcGVjaWZpY2F0aW9uLCB0aGUgZGVmYXVsdCBpcyBhbHdheXMgXCJvdGhlclwiXG4gICAgLy8gU3BlYzogaHR0cDovL2NsZHIudW5pY29kZS5vcmcvaW5kZXgvY2xkci1zcGVjL3BsdXJhbC1ydWxlc1xuICAgIC8vID4gb3RoZXIgKHJlcXVpcmVk4oCUZ2VuZXJhbCBwbHVyYWwgZm9ybSDigJQgYWxzbyB1c2VkIGlmIHRoZSBsYW5ndWFnZSBvbmx5IGhhcyBhIHNpbmdsZSBmb3JtKVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFBsdXJhbENhdGVnb3J5KHZhbHVlOiBhbnksIGxvY2FsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGx1cmFsID0gZ2V0UGx1cmFsQ2FzZShsb2NhbGUsIHZhbHVlKTtcblxuICBzd2l0Y2ggKHBsdXJhbCkge1xuICAgIGNhc2UgUGx1cmFsLlplcm86XG4gICAgICByZXR1cm4gJ3plcm8nO1xuICAgIGNhc2UgUGx1cmFsLk9uZTpcbiAgICAgIHJldHVybiAnb25lJztcbiAgICBjYXNlIFBsdXJhbC5Ud286XG4gICAgICByZXR1cm4gJ3R3byc7XG4gICAgY2FzZSBQbHVyYWwuRmV3OlxuICAgICAgcmV0dXJuICdmZXcnO1xuICAgIGNhc2UgUGx1cmFsLk1hbnk6XG4gICAgICByZXR1cm4gJ21hbnknO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ290aGVyJztcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNhc2Ugb2YgYW4gSUNVIGV4cHJlc3Npb24gZGVwZW5kaW5nIG9uIHRoZSBtYWluIGJpbmRpbmcgdmFsdWVcbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGJpbmRpbmdWYWx1ZSBUaGUgdmFsdWUgb2YgdGhlIG1haW4gYmluZGluZyB1c2VkIGJ5IHRoaXMgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FzZUluZGV4KGljdUV4cHJlc3Npb246IFRJY3UsIGJpbmRpbmdWYWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICAvLyBUT0RPKG9jb21iZSk6IHJlcGxhY2UgdGhpcyBoYXJkLWNvZGVkIHZhbHVlIGJ5IHRoZSByZWFsIExPQ0FMRV9JRCB2YWx1ZVxuICAgICAgICBjb25zdCBsb2NhbGUgPSAnZW4tVVMnO1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXRlZ29yeShiaW5kaW5nVmFsdWUsIGxvY2FsZSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIGZvciBJQ1UgZXhwcmVzc2lvbnMuXG4gKlxuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIHN0YXJ0SW5kZXhcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBpY3VTdGFydChcbiAgICB0SWN1czogVEljdVtdLCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBzdGFydEluZGV4OiBudW1iZXIsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjcmVhdGVDb2RlcyA9IFtdO1xuICBjb25zdCByZW1vdmVDb2RlcyA9IFtdO1xuICBjb25zdCB1cGRhdGVDb2RlcyA9IFtdO1xuICBjb25zdCB2YXJzID0gW107XG4gIGNvbnN0IGNoaWxkSWN1czogbnVtYmVyW11bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gRWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzICYgb3RoZXIgSUNVIGV4cHJlc3Npb25zXG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBjb25zdCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gbmVzdGVkIElDVSBleHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGljdUluZGV4ID0gbmVzdGVkSWN1cy5wdXNoKHZhbHVlIGFzIEljdUV4cHJlc3Npb24pIC0gMTtcbiAgICAgICAgLy8gUmVwbGFjZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb24gYnkgYSBjb21tZW50IG5vZGVcbiAgICAgICAgdmFsdWVBcnJbal0gPSBgPCEtLe+/vSR7aWN1SW5kZXh977+9LS0+YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaWN1Q2FzZTogSWN1Q2FzZSA9XG4gICAgICAgIHBhcnNlSWN1Q2FzZSh2YWx1ZUFyci5qb2luKCcnKSwgc3RhcnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICBjcmVhdGVDb2Rlcy5wdXNoKGljdUNhc2UuY3JlYXRlKTtcbiAgICByZW1vdmVDb2Rlcy5wdXNoKGljdUNhc2UucmVtb3ZlKTtcbiAgICB1cGRhdGVDb2Rlcy5wdXNoKGljdUNhc2UudXBkYXRlKTtcbiAgICB2YXJzLnB1c2goaWN1Q2FzZS52YXJzKTtcbiAgICBjaGlsZEljdXMucHVzaChpY3VDYXNlLmNoaWxkSWN1cyk7XG4gIH1cbiAgY29uc3QgdEljdTogVEljdSA9IHtcbiAgICB0eXBlOiBpY3VFeHByZXNzaW9uLnR5cGUsXG4gICAgdmFycyxcbiAgICBjaGlsZEljdXMsXG4gICAgY2FzZXM6IGljdUV4cHJlc3Npb24uY2FzZXMsXG4gICAgY3JlYXRlOiBjcmVhdGVDb2RlcyxcbiAgICByZW1vdmU6IHJlbW92ZUNvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlQ29kZXNcbiAgfTtcbiAgdEljdXMucHVzaCh0SWN1KTtcbiAgLy8gQWRkaW5nIHRoZSBtYXhpbXVtIHBvc3NpYmxlIG9mIHZhcnMgbmVlZGVkIChiYXNlZCBvbiB0aGUgY2FzZXMgd2l0aCB0aGUgbW9zdCB2YXJzKVxuICBpMThuVmFyc0NvdW50ICs9IE1hdGgubWF4KC4uLnZhcnMpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgdGVtcGxhdGUgaW50byBhbiBIVE1MIHRlbXBsYXRlIGFuZCBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdXBkYXRlXG4gKiBhdHRyaWJ1dGVzIG9yIG5vZGVzIHRoYXQgY29udGFpbiBiaW5kaW5ncy5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCBUaGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0gcGFyZW50SW5kZXhcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBwYXJzZUljdUNhc2UoXG4gICAgdW5zYWZlSHRtbDogc3RyaW5nLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sIHRJY3VzOiBUSWN1W10sXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IEljdUNhc2Uge1xuICBjb25zdCBpbmVydEJvZHlIZWxwZXIgPSBuZXcgSW5lcnRCb2R5SGVscGVyKGRvY3VtZW50KTtcbiAgY29uc3QgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuICBpZiAoIWluZXJ0Qm9keUVsZW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBnZW5lcmF0ZSBpbmVydCBib2R5IGVsZW1lbnQnKTtcbiAgfVxuICBjb25zdCB3cmFwcGVyID0gZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQgISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50O1xuICBjb25zdCBvcENvZGVzOiBJY3VDYXNlID0ge3ZhcnM6IDAsIGNoaWxkSWN1czogW10sIGNyZWF0ZTogW10sIHJlbW92ZTogW10sIHVwZGF0ZTogW119O1xuICBwYXJzZU5vZGVzKHdyYXBwZXIuZmlyc3RDaGlsZCwgb3BDb2RlcywgcGFyZW50SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gIHJldHVybiBvcENvZGVzO1xufVxuXG5jb25zdCBORVNURURfSUNVID0gL++/vShcXGQrKe+/vS87XG5cbi8qKlxuICogUGFyc2VzIGEgbm9kZSwgaXRzIGNoaWxkcmVuIGFuZCBpdHMgc2libGluZ3MsIGFuZCBnZW5lcmF0ZXMgdGhlIG11dGF0ZSAmIHVwZGF0ZSBPcENvZGVzLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50Tm9kZSBUaGUgZmlyc3Qgbm9kZSB0byBwYXJzZVxuICogQHBhcmFtIGljdUNhc2UgVGhlIGRhdGEgZm9yIHRoZSBJQ1UgZXhwcmVzc2lvbiBjYXNlIHRoYXQgY29udGFpbnMgdGhvc2Ugbm9kZXNcbiAqIEBwYXJhbSBwYXJlbnRJbmRleCBJbmRleCBvZiB0aGUgY3VycmVudCBub2RlJ3MgcGFyZW50XG4gKiBAcGFyYW0gbmVzdGVkSWN1cyBEYXRhIGZvciB0aGUgbmVzdGVkIElDVSBleHByZXNzaW9ucyB0aGF0IHRoaXMgY2FzZSBjb250YWluc1xuICogQHBhcmFtIHRJY3VzIERhdGEgZm9yIGFsbCBJQ1UgZXhwcmVzc2lvbnMgb2YgdGhlIGN1cnJlbnQgbWVzc2FnZVxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4IEV4cGFuZG8gc3RhcnQgaW5kZXggZm9yIHRoZSBjdXJyZW50IElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIHBhcnNlTm9kZXMoXG4gICAgY3VycmVudE5vZGU6IE5vZGUgfCBudWxsLCBpY3VDYXNlOiBJY3VDYXNlLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sXG4gICAgdEljdXM6IFRJY3VbXSwgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcikge1xuICBpZiAoY3VycmVudE5vZGUpIHtcbiAgICBjb25zdCBuZXN0ZWRJY3VzVG9DcmVhdGU6IFtJY3VFeHByZXNzaW9uLCBudW1iZXJdW10gPSBbXTtcbiAgICB3aGlsZSAoY3VycmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IG5leHROb2RlOiBOb2RlfG51bGwgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gZXhwYW5kb1N0YXJ0SW5kZXggKyArK2ljdUNhc2UudmFycztcbiAgICAgIHN3aXRjaCAoY3VycmVudE5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgICAgICBjb25zdCBlbGVtZW50ID0gY3VycmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKCFWQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgICAgICAgLy8gVGhpcyBpc24ndCBhIHZhbGlkIGVsZW1lbnQsIHdlIHdvbid0IGNyZWF0ZSBhbiBlbGVtZW50IGZvciBpdFxuICAgICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgRUxFTUVOVF9NQVJLRVIsIHRhZ05hbWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgICBjb25zdCBlbEF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbEF0dHJzLml0ZW0oaSkgITtcbiAgICAgICAgICAgICAgY29uc3QgbG93ZXJBdHRyTmFtZSA9IGF0dHIubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISFhdHRyLnZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAgICAgLy8gd2UgYXNzdW1lIHRoZSBpbnB1dCBzdHJpbmcgaXMgc2FmZSwgdW5sZXNzIGl0J3MgdXNpbmcgYSBiaW5kaW5nXG4gICAgICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKFZBTElEX0FUVFJTLmhhc093blByb3BlcnR5KGxvd2VyQXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoVVJJX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIF9zYW5pdGl6ZVVybCksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFNSQ1NFVF9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBzYW5pdGl6ZVNyY3NldCksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBgV0FSTklORzogaWdub3JpbmcgdW5zYWZlIGF0dHJpYnV0ZSB2YWx1ZSAke2xvd2VyQXR0ck5hbWV9IG9uIGVsZW1lbnQgJHt0YWdOYW1lfSAoc2VlIGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5I3hzcylgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkF0dHIsIGF0dHIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBjaGlsZHJlbiBvZiB0aGlzIG5vZGUgKGlmIGFueSlcbiAgICAgICAgICAgIHBhcnNlTm9kZXMoXG4gICAgICAgICAgICAgICAgY3VycmVudE5vZGUuZmlyc3RDaGlsZCwgaWN1Q2FzZSwgbmV3SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHBhcmVudCBub2RlIGFmdGVyIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHZhbHVlLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModmFsdWUsIG5ld0luZGV4KSwgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY29tbWVudCBub2RlIGlzIGEgcGxhY2Vob2xkZXIgZm9yIGEgbmVzdGVkIElDVVxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gTkVTVEVEX0lDVS5leGVjKGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnKTtcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdUluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0xvY2FsID0gbmdEZXZNb2RlID8gYG5lc3RlZCBJQ1UgJHtuZXN0ZWRJY3VJbmRleH1gIDogJyc7XG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmV3TG9jYWwsIG5ld0luZGV4LFxuICAgICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzW25lc3RlZEljdUluZGV4XTtcbiAgICAgICAgICAgIG5lc3RlZEljdXNUb0NyZWF0ZS5wdXNoKFtuZXN0ZWRJY3UsIG5ld0luZGV4XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlIGRvIG5vdCBoYW5kbGUgYW55IG90aGVyIHR5cGUgb2YgY29tbWVudFxuICAgICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIFdlIGRvIG5vdCBoYW5kbGUgYW55IG90aGVyIHR5cGUgb2YgZWxlbWVudFxuICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgfVxuICAgICAgY3VycmVudE5vZGUgPSBuZXh0Tm9kZSAhO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVzdGVkSWN1c1RvQ3JlYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMF07XG4gICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMV07XG4gICAgICBpY3VTdGFydCh0SWN1cywgbmVzdGVkSWN1LCBuZXN0ZWRJY3VOb2RlSW5kZXgsIGV4cGFuZG9TdGFydEluZGV4ICsgaWN1Q2FzZS52YXJzKTtcbiAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgIGNvbnN0IG5lc3RUSWN1SW5kZXggPSB0SWN1cy5sZW5ndGggLSAxO1xuICAgICAgaWN1Q2FzZS52YXJzICs9IE1hdGgubWF4KC4uLnRJY3VzW25lc3RUSWN1SW5kZXhdLnZhcnMpO1xuICAgICAgaWN1Q2FzZS5jaGlsZEljdXMucHVzaChuZXN0VEljdUluZGV4KTtcbiAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhuZXN0ZWRJY3UpO1xuICAgICAgaWN1Q2FzZS51cGRhdGUucHVzaChcbiAgICAgICAgICB0b01hc2tCaXQobmVzdGVkSWN1Lm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAtMSAtIG5lc3RlZEljdS5tYWluQmluZGluZyxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCxcbiAgICAgICAgICBuZXN0VEljdUluZGV4LFxuICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgpO1xuICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChcbiAgICAgICAgICBuZXN0VEljdUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3UsXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgIH1cbiAgfVxufVxuIl19