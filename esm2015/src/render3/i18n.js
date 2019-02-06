/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { assertDefined, assertEqual, assertGreaterThan } from '../util/assert';
import { attachPatchData } from './context_discovery';
import { allocExpando, createNodeAtIndex, elementAttribute, load, textBinding } from './instructions';
import { NATIVE } from './interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { BINDING_INDEX, HEADER_OFFSET, HOST_NODE, RENDERER, TVIEW } from './interfaces/view';
import { appendChild, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getIsParent, getLView, getPreviousOrParentTNode, setIsParent, setPreviousOrParentTNode } from './state';
import { NO_CHANGE } from './tokens';
import { addAllToArray, getNativeByIndex, getNativeByTNode, getTNode, isLContainer, renderStringify } from './util';
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
 * @param {?} index A unique index of the translation in the static block.
 * @param {?} message The translation message.
 * @param {?=} subTemplateIndex Optional sub-template index in the `message`.
 * @return {?}
 */
export function i18nStart(index, message, subTemplateIndex) {
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
    let parentIndex = parentTNode && parentTNode !== viewData[HOST_NODE] ?
        parentTNode.index - HEADER_OFFSET :
        index;
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
    const viewData = getLView();
    if (!previousTNode) {
        previousTNode = parentTNode;
    }
    // re-organize node tree to put this node in the correct position.
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
    if (parentTNode !== viewData[HOST_NODE]) {
        tNode.parent = (/** @type {?} */ (parentTNode));
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
 * \@publicAPI
 * @param {?} message Raw translation string for post processing
 * @param {?=} replacements Set of replacements that should be applied
 *
 * @return {?} Transformed string that can be consumed by i18nStart instruction
 *
 */
export function i18nPostprocess(message, replacements = {}) {
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
        result = result.replace(PP_PLACEHOLDERS_REGEXP, (m, phs, tmpl) => {
            /** @type {?} */
            const content = phs || tmpl;
            if (!matches[content]) {
                /** @type {?} */
                const placeholders = [];
                content.split('|').forEach((placeholder) => {
                    /** @type {?} */
                    const match = placeholder.match(PP_TEMPLATE_ID_REGEXP);
                    /** @type {?} */
                    const templateId = match ? parseInt(match[1], 10) : ROOT_TEMPLATE_ID;
                    /** @type {?} */
                    const isCloseTemplateTag = PP_CLOSE_TEMPLATE_REGEXP.test(placeholder);
                    placeholders.push([templateId, isCloseTemplateTag, placeholder]);
                });
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
        });
        // verify that we injected all values
        /** @type {?} */
        const hasUnmatchedValues = Object.keys(matches).some(key => !!matches[key].length);
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
    result = result.replace(PP_ICU_VARS_REGEXP, (match, start, key, _type, _idx, end) => {
        return replacements.hasOwnProperty(key) ? `${start}${replacements[key]}${end}` : match;
    });
    /**
     * Step 3: replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�) in case
     * multiple ICUs have the same placeholder name
     */
    result = result.replace(PP_ICUS_REGEXP, (match, key) => {
        if (replacements.hasOwnProperty(key)) {
            /** @type {?} */
            const list = (/** @type {?} */ (replacements[key]));
            if (!list.length) {
                throw new Error(`i18n postprocess: unmatched ICU - ${match} with key: ${key}`);
            }
            return (/** @type {?} */ (list.shift()));
        }
        return match;
    });
    return result;
}
/**
 * Translates a translation block marked by `i18nStart` and `i18nEnd`. It inserts the text/ICU nodes
 * into the render tree, moves the placeholder nodes and removes the deleted nodes.
 * @return {?}
 */
export function i18nEnd() {
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
    // The last placeholder that was added before `i18nEnd`
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const visitedPlaceholders = readCreateOpCodes(rootIndex, tI18n.create, tI18n.icus, viewData);
    // Remove deleted placeholders
    // The last placeholder that was added before `i18nEnd` is `previousOrParentTNode`
    for (let i = rootIndex + 1; i <= previousOrParentTNode.index - HEADER_OFFSET; i++) {
        if (visitedPlaceholders.indexOf(i) === -1) {
            removeNode(i, viewData);
        }
    }
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
    const visitedPlaceholders = [];
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
            currentTNode = createNodeAtIndex(textNodeIndex, 3 /* Element */, textRNode, null, null);
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
                        destinationTNode = (/** @type {?} */ (viewData[HOST_NODE]));
                    }
                    else {
                        destinationTNode = getTNode(destinationNodeIndex, viewData);
                    }
                    ngDevMode &&
                        assertDefined((/** @type {?} */ (currentTNode)), `You need to create or select a node before you can insert it into the DOM`);
                    previousTNode = appendI18nNode((/** @type {?} */ (currentTNode)), destinationTNode, previousTNode);
                    destinationTNode.next = null;
                    break;
                case 0 /* Select */:
                    /** @type {?} */
                    const nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    visitedPlaceholders.push(nodeIndex);
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
                    elementAttribute(elementNodeIndex, attrName, attrValue);
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
                    currentTNode =
                        createNodeAtIndex(commentNodeIndex, 5 /* IcuContainer */, commentRNode, null, null);
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
                    currentTNode = createNodeAtIndex(elementNodeIndex, 3 /* Element */, elementRNode, tagNameValue, null);
                    break;
                default:
                    throw new Error(`Unable to determine the type of mutate operation for "${opCode}"`);
            }
        }
    }
    setIsParent(false);
    return visitedPlaceholders;
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
                        switch (opCode & 3 /* MASK_OPCODE */) {
                            case 1 /* Attr */:
                                /** @type {?} */
                                const attrName = (/** @type {?} */ (updateOpCodes[++j]));
                                /** @type {?} */
                                const sanitizeFn = (/** @type {?} */ (updateOpCodes[++j]));
                                elementAttribute(nodeIndex, attrName, value, sanitizeFn);
                                break;
                            case 0 /* Text */:
                                textBinding(nodeIndex, value);
                                break;
                            case 2 /* IcuSwitch */:
                                /** @type {?} */
                                let tIcuIndex = (/** @type {?} */ (updateOpCodes[++j]));
                                /** @type {?} */
                                let tIcu = (/** @type {?} */ (icus))[tIcuIndex];
                                /** @type {?} */
                                let icuTNode = (/** @type {?} */ (getTNode(nodeIndex, viewData)));
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
    removedPhTNode.detached = true;
    ngDevMode && ngDevMode.rendererRemoveNode++;
    /** @type {?} */
    const slotValue = (/** @type {?} */ (load(index)));
    if (isLContainer(slotValue)) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (slotValue));
        if (removedPhTNode.type !== 0 /* Container */) {
            nativeRemoveNode(viewData[RENDERER], lContainer[NATIVE]);
        }
    }
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
 * @param {?} index A unique index of the translation in the static block.
 * @param {?} message The translation message.
 * @param {?=} subTemplateIndex Optional sub-template index in the `message`.
 * @return {?}
 */
export function i18n(index, message, subTemplateIndex) {
    i18nStart(index, message, subTemplateIndex);
    i18nEnd();
}
/**
 * Marks a list of attributes as translatable.
 *
 * @param {?} index A unique index in the static block
 * @param {?} values
 * @return {?}
 */
export function i18nAttributes(index, values) {
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
                    elementAttribute(previousElementIndex, attrName, value);
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
 * @template T
 * @param {?} expression The binding's new value or NO_CHANGE
 * @return {?}
 */
export function i18nExp(expression) {
    if (expression !== NO_CHANGE) {
        changeMask = changeMask | (1 << shiftsCounter);
    }
    shiftsCounter++;
}
/**
 * Updates a translation block or an i18n attribute when the bindings have changed.
 *
 * @param {?} index Index of either {\@link i18nStart} (translation block) or {\@link i18nAttributes}
 * (i18n attribute) on which it should update the content.
 * @return {?}
 */
export function i18nApply(index) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4SCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRyxPQUFPLEVBQWEsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlHLE1BQU0sbUJBQW1CLENBQUM7QUFLakssT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFTLFFBQVEsRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RyxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMvRyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25D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LElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSztZQUNSLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQUUsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQy9CLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztRQUN0QixL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Q0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQztZQUMxQyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDdEIsS0FBSyxLQUFLO1lBQ1IsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMxRCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0QsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQ3BCLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztRQUN0QixLQUFLLElBQUk7WUFDUCxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQUUsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQy9ELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFBRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENB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SSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7O2tCQUNoQyxJQUFJLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZixTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFHLDJCQUEyQjtZQUM5RCxDQUFDLEVBQWtDLGdDQUFnQztZQUNuRSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsV0FBVyxFQUMxQixrQkFBa0IscUJBQThCLG9CQUE2QixFQUM3RSxhQUFhLEVBQ2IsSUFBSSxFQUFHLGtEQUFrRDtZQUN6RCxDQUFDLEVBQU0sZ0NBQWdDO1lBQ3ZDLGtCQUFrQixxQkFBOEIsb0JBQTZCLEVBQzdFLGFBQWEsQ0FBQyxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLGFBQWEscUJBQThCLDBCQUFtQyxFQUM5RSxrQkFBa0IscUJBQThCLGlCQUEwQixDQUFDLENBQUM7U0FDakY7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U1JDU0VUX0FUVFJTLCBVUklfQVRUUlMsIFZBTElEX0FUVFJTLCBWQUxJRF9FTEVNRU5UUywgZ2V0VGVtcGxhdGVDb250ZW50fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaHRtbF9zYW5pdGl6ZXInO1xuaW1wb3J0IHtJbmVydEJvZHlIZWxwZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5JztcbmltcG9ydCB7X3Nhbml0aXplVXJsLCBzYW5pdGl6ZVNyY3NldH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3VybF9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHthbGxvY0V4cGFuZG8sIGNyZWF0ZU5vZGVBdEluZGV4LCBlbGVtZW50QXR0cmlidXRlLCBsb2FkLCB0ZXh0QmluZGluZ30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDT01NRU5UX01BUktFUiwgRUxFTUVOVF9NQVJLRVIsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgSWN1VHlwZSwgVEkxOG4sIFRJY3V9IGZyb20gJy4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBMVmlldywgUkVOREVSRVIsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgY3JlYXRlVGV4dE5vZGUsIG5hdGl2ZVJlbW92ZU5vZGV9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0SXNQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHthZGRBbGxUb0FycmF5LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgaXNMQ29udGFpbmVyLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgSUNVX0JMT0NLX1JFR0VYUCA9IC9eXFxzKijvv71cXGQrOj9cXGQq77+9KVxccyosXFxzKihzZWxlY3R8cGx1cmFsKVxccyosLztcbmNvbnN0IFNVQlRFTVBMQVRFX1JFR0VYUCA9IC/vv71cXC8/XFwqKFxcZCs6XFxkKynvv70vZ2k7XG5jb25zdCBQSF9SRUdFWFAgPSAv77+9KFxcLz9bIypdXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBCSU5ESU5HX1JFR0VYUCA9IC/vv70oXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBJQ1VfUkVHRVhQID0gLyh7XFxzKu+/vVxcZCs6P1xcZCrvv71cXHMqLFxccypcXFN7Nn1cXHMqLFtcXHNcXFNdKn0pL2dpO1xuXG4vLyBpMThuUG9zdHByb2Nlc3MgY29uc3RzXG5jb25zdCBST09UX1RFTVBMQVRFX0lEID0gMDtcbmNvbnN0IFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdLztcbmNvbnN0IFBQX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdfCjvv71cXC8/XFwqXFxkKzpcXGQr77+9KS9nO1xuY29uc3QgUFBfSUNVX1ZBUlNfUkVHRVhQID0gLyh7XFxzKikoVkFSXyhQTFVSQUx8U0VMRUNUKShfXFxkKyk/KShcXHMqLCkvZztcbmNvbnN0IFBQX0lDVVNfUkVHRVhQID0gL++/vUkxOE5fRVhQXyhJQ1UoX1xcZCspPynvv70vZztcbmNvbnN0IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUCA9IC9cXC9cXCovO1xuY29uc3QgUFBfVEVNUExBVEVfSURfUkVHRVhQID0gL1xcZCtcXDooXFxkKykvO1xuXG4vLyBQYXJzZWQgcGxhY2Vob2xkZXIgc3RydWN0dXJlIHVzZWQgaW4gcG9zdHByb2Nlc3NpbmcgKHdpdGhpbiBgaTE4blBvc3Rwcm9jZXNzYCBmdW5jdGlvbilcbi8vIENvbnRhaW5zIHRoZSBmb2xsb3dpbmcgZmllbGRzOiBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl1cbnR5cGUgUG9zdHByb2Nlc3NQbGFjZWhvbGRlciA9IFtudW1iZXIsIGJvb2xlYW4sIHN0cmluZ107XG5cbmludGVyZmFjZSBJY3VFeHByZXNzaW9uIHtcbiAgdHlwZTogSWN1VHlwZTtcbiAgbWFpbkJpbmRpbmc6IG51bWJlcjtcbiAgY2FzZXM6IHN0cmluZ1tdO1xuICB2YWx1ZXM6IChzdHJpbmd8SWN1RXhwcmVzc2lvbilbXVtdO1xufVxuXG5pbnRlcmZhY2UgSWN1Q2FzZSB7XG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2NhdGUgaW4gZXhwYW5kbyBmb3IgdGhpcyBjYXNlLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYXggbnVtYmVyIG9mIERPTSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgYnkgdGhpcyBpMThuICsgSUNVIGJsb2Nrcy4gV2hlblxuICAgKiB0aGUgRE9NIGVsZW1lbnRzIGFyZSBiZWluZyBjcmVhdGVkIHRoZXkgYXJlIHN0b3JlZCBpbiB0aGUgRVhQQU5ETywgc28gdGhhdCB1cGRhdGUgT3BDb2RlcyBjYW5cbiAgICogd3JpdGUgaW50byB0aGVtLlxuICAgKi9cbiAgdmFyczogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBhcnJheSBvZiBjaGlsZC9zdWIgSUNVcy5cbiAgICovXG4gIGNoaWxkSWN1czogbnVtYmVyW107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gYnVpbGQgdXAgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVVxuICAgKi9cbiAgY3JlYXRlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBkZXN0cm95IHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UuXG4gICAqL1xuICByZW1vdmU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIHVwZGF0ZSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVIGJpbmRpbmdzLlxuICAgKi9cbiAgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2Rlcztcbn1cblxuLyoqXG4gKiBCcmVha3MgcGF0dGVybiBpbnRvIHN0cmluZ3MgYW5kIHRvcCBsZXZlbCB7Li4ufSBibG9ja3MuXG4gKiBDYW4gYmUgdXNlZCB0byBicmVhayBhIG1lc3NhZ2UgaW50byB0ZXh0IGFuZCBJQ1UgZXhwcmVzc2lvbnMsIG9yIHRvIGJyZWFrIGFuIElDVSBleHByZXNzaW9uIGludG9cbiAqIGtleXMgYW5kIGNhc2VzLlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gKHN1YilQYXR0ZXJuIHRvIGJlIGJyb2tlbi5cbiAqXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQYXJ0cyhwYXR0ZXJuOiBzdHJpbmcpOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSB7XG4gIGlmICghcGF0dGVybikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGxldCBwcmV2UG9zID0gMDtcbiAgY29uc3QgYnJhY2VTdGFjayA9IFtdO1xuICBjb25zdCByZXN1bHRzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSA9IFtdO1xuICBjb25zdCBicmFjZXMgPSAvW3t9XS9nO1xuICAvLyBsYXN0SW5kZXggZG9lc24ndCBnZXQgc2V0IHRvIDAgc28gd2UgaGF2ZSB0by5cbiAgYnJhY2VzLmxhc3RJbmRleCA9IDA7XG5cbiAgbGV0IG1hdGNoO1xuICB3aGlsZSAobWF0Y2ggPSBicmFjZXMuZXhlYyhwYXR0ZXJuKSkge1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmluZGV4O1xuICAgIGlmIChtYXRjaFswXSA9PSAnfScpIHtcbiAgICAgIGJyYWNlU3RhY2sucG9wKCk7XG5cbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIEVuZCBvZiB0aGUgYmxvY2suXG4gICAgICAgIGNvbnN0IGJsb2NrID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgaWYgKElDVV9CTE9DS19SRUdFWFAudGVzdChibG9jaykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocGFyc2VJQ1VCbG9jayhibG9jaykpO1xuICAgICAgICB9IGVsc2UgaWYgKGJsb2NrKSB7ICAvLyBEb24ndCBwdXNoIGVtcHR5IHN0cmluZ3NcbiAgICAgICAgICByZXN1bHRzLnB1c2goYmxvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICAgIGJyYWNlU3RhY2sucHVzaCgneycpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MpO1xuICBpZiAoc3Vic3RyaW5nICE9ICcnKSB7XG4gICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW11bXSA9IFtdO1xuICBsZXQgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICBsZXQgbWFpbkJpbmRpbmcgPSAwO1xuICBwYXR0ZXJuID0gcGF0dGVybi5yZXBsYWNlKElDVV9CTE9DS19SRUdFWFAsIGZ1bmN0aW9uKHN0cjogc3RyaW5nLCBiaW5kaW5nOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgIGlmICh0eXBlID09PSAnc2VsZWN0Jykge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUuc2VsZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gICAgfVxuICAgIG1haW5CaW5kaW5nID0gcGFyc2VJbnQoYmluZGluZy5zdWJzdHIoMSksIDEwKTtcbiAgICByZXR1cm4gJyc7XG4gIH0pO1xuXG4gIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHBhdHRlcm4pIGFzIHN0cmluZ1tdO1xuICAvLyBMb29raW5nIGZvciAoa2V5IGJsb2NrKSsgc2VxdWVuY2UuIE9uZSBvZiB0aGUga2V5cyBoYXMgdG8gYmUgXCJvdGhlclwiLlxuICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBwYXJ0cy5sZW5ndGg7KSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW3BvcysrXS50cmltKCk7XG4gICAgaWYgKGljdVR5cGUgPT09IEljdVR5cGUucGx1cmFsKSB7XG4gICAgICAvLyBLZXkgY2FuIGJlIFwiPXhcIiwgd2UganVzdCB3YW50IFwieFwiXG4gICAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzKig/Oj0pPyhcXHcrKVxccyovLCAnJDEnKTtcbiAgICB9XG4gICAgaWYgKGtleS5sZW5ndGgpIHtcbiAgICAgIGNhc2VzLnB1c2goa2V5KTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBleHRyYWN0UGFydHMocGFydHNbcG9zKytdKSBhcyBzdHJpbmdbXTtcbiAgICBpZiAoYmxvY2tzLmxlbmd0aCkge1xuICAgICAgdmFsdWVzLnB1c2goYmxvY2tzKTtcbiAgICB9XG4gIH1cblxuICBhc3NlcnRHcmVhdGVyVGhhbihjYXNlcy5pbmRleE9mKCdvdGhlcicpLCAtMSwgJ01pc3Npbmcga2V5IFwib3RoZXJcIiBpbiBJQ1Ugc3RhdGVtZW50LicpO1xuICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXMsIHNlZSAjMjE2MTVcbiAgcmV0dXJuIHt0eXBlOiBpY3VUeXBlLCBtYWluQmluZGluZzogbWFpbkJpbmRpbmcsIGNhc2VzLCB2YWx1ZXN9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgaW5UZW1wbGF0ZSwgZmFsc2UsXG4gICAgICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7bWVzc2FnZX1cImApO1xuXG4gIHJlcyArPSBtZXNzYWdlLnN1YnN0cihpbmRleCk7XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSBwYXJ0IG9mIGEgbWVzc2FnZSBhbmQgcmVtb3ZlcyB0aGUgcmVzdC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBleHRyYWN0aW5nIGEgcGFydCBvZiB0aGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gQSB0cmFuc2xhdGVkXG4gKiBtZXNzYWdlIGNhbiBzcGFuIG11bHRpcGxlIHRlbXBsYXRlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGkxOG4+VHJhbnNsYXRlIDxzcGFuICpuZ0lmPm1lPC9zcGFuPiE8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGNyb3BcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IG9mIHRoZSBzdWItdGVtcGxhdGUgdG8gZXh0cmFjdC4gSWYgdW5kZWZpbmVkIGl0IHJldHVybnMgdGhlXG4gKiBleHRlcm5hbCB0ZW1wbGF0ZSBhbmQgcmVtb3ZlcyBhbGwgc3ViLXRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKSB7XG4gIGlmICh0eXBlb2Ygc3ViVGVtcGxhdGVJbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAvLyBXZSB3YW50IHRoZSByb290IHRlbXBsYXRlIG1lc3NhZ2UsIGlnbm9yZSBhbGwgc3ViLXRlbXBsYXRlc1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2Ugd2FudCBhIHNwZWNpZmljIHN1Yi10ZW1wbGF0ZVxuICAgIGNvbnN0IHN0YXJ0ID1cbiAgICAgICAgbWVzc2FnZS5pbmRleE9mKGA6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApICsgMiArIHN1YlRlbXBsYXRlSW5kZXgudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgY29uc3QgZW5kID0gbWVzc2FnZS5zZWFyY2gobmV3IFJlZ0V4cChgJHtNQVJLRVJ9XFxcXC9cXFxcKlxcXFxkKzoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkpO1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgdG8gdXBkYXRlIHRoZSBiaW5kaW5ncyBvZiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmluZGluZ3MuXG4gKiBAcGFyYW0gZGVzdGluYXRpb25Ob2RlIEluZGV4IG9mIHRoZSBkZXN0aW5hdGlvbiBub2RlIHdoaWNoIHdpbGwgcmVjZWl2ZSB0aGUgYmluZGluZy5cbiAqIEBwYXJhbSBhdHRyTmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUsIGlmIHRoZSBzdHJpbmcgYmVsb25ncyB0byBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gc2FuaXRpemVGbiBTYW5pdGl6YXRpb24gZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgc3RyaW5nIGFmdGVyIHVwZGF0ZSwgaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgIHN0cjogc3RyaW5nLCBkZXN0aW5hdGlvbk5vZGU6IG51bWJlciwgYXR0ck5hbWU/OiBzdHJpbmcsXG4gICAgc2FuaXRpemVGbjogU2FuaXRpemVyRm4gfCBudWxsID0gbnVsbCk6IEkxOG5VcGRhdGVPcENvZGVzIHtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbbnVsbCwgbnVsbF07ICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBjb25zdCB0ZXh0UGFydHMgPSBzdHIuc3BsaXQoQklORElOR19SRUdFWFApO1xuICBsZXQgbWFzayA9IDA7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCB0ZXh0UGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB0ZXh0UGFydHNbal07XG5cbiAgICBpZiAoaiAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gcGFyc2VJbnQodGV4dFZhbHVlLCAxMCk7XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2goLTEgLSBiaW5kaW5nSW5kZXgpO1xuICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2UgaWYgKHRleHRWYWx1ZSAhPT0gJycpIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dFxuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKHRleHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgIChhdHRyTmFtZSA/IEkxOG5VcGRhdGVPcENvZGUuQXR0ciA6IEkxOG5VcGRhdGVPcENvZGUuVGV4dCkpO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbMF0gPSBtYXNrO1xuICB1cGRhdGVPcENvZGVzWzFdID0gdXBkYXRlT3BDb2Rlcy5sZW5ndGggLSAyO1xuICByZXR1cm4gdXBkYXRlT3BDb2Rlcztcbn1cblxuZnVuY3Rpb24gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgbWFzayA9IDApOiBudW1iZXIge1xuICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKTtcbiAgbGV0IG1hdGNoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgd2hpbGUgKG1hdGNoID0gQklORElOR19SRUdFWFAuZXhlYyh2YWx1ZSkpIHtcbiAgICAgICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChwYXJzZUludChtYXRjaFsxXSwgMTApKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFzayA9IGdldEJpbmRpbmdNYXNrKHZhbHVlIGFzIEljdUV4cHJlc3Npb24sIG1hc2spO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWFzaztcbn1cblxuY29uc3QgaTE4bkluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5sZXQgaTE4bkluZGV4U3RhY2tQb2ludGVyID0gLTE7XG5cbi8qKlxuICogQ29udmVydCBiaW5kaW5nIGluZGV4IHRvIG1hc2sgYml0LlxuICpcbiAqIEVhY2ggaW5kZXggcmVwcmVzZW50cyBhIHNpbmdsZSBiaXQgb24gdGhlIGJpdC1tYXNrLiBCZWNhdXNlIGJpdC1tYXNrIG9ubHkgaGFzIDMyIGJpdHMsIHdlIG1ha2VcbiAqIHRoZSAzMm5kIGJpdCBzaGFyZSBhbGwgbWFza3MgZm9yIGFsbCBiaW5kaW5ncyBoaWdoZXIgdGhhbiAzMi4gU2luY2UgaXQgaXMgZXh0cmVtZWx5IHJhcmUgdG8gaGF2ZVxuICogbW9yZSB0aGFuIDMyIGJpbmRpbmdzIHRoaXMgd2lsbCBiZSBoaXQgdmVyeSByYXJlbHkuIFRoZSBkb3duc2lkZSBvZiBoaXR0aW5nIHRoaXMgY29ybmVyIGNhc2UgaXNcbiAqIHRoYXQgd2Ugd2lsbCBleGVjdXRlIGJpbmRpbmcgY29kZSBtb3JlIG9mdGVuIHRoYW4gbmVjZXNzYXJ5LiAocGVuYWx0eSBvZiBwZXJmb3JtYW5jZSlcbiAqL1xuZnVuY3Rpb24gdG9NYXNrQml0KGJpbmRpbmdJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIDEgPDwgTWF0aC5taW4oYmluZGluZ0luZGV4LCAzMSk7XG59XG5cbmNvbnN0IHBhcmVudEluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5cbi8qKlxuICogTWFya3MgYSBibG9jayBvZiB0ZXh0IGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBUaGUgaW5zdHJ1Y3Rpb25zIGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAgbWFyayB0aGUgdHJhbnNsYXRpb24gYmxvY2sgaW4gdGhlIHRlbXBsYXRlLlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5TdGFydChpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuSW5kZXhTdGFja1srK2kxOG5JbmRleFN0YWNrUG9pbnRlcl0gPSBpbmRleDtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIGkxOG5TdGFydEZpcnN0UGFzcyh0VmlldywgaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICB9XG59XG5cbi8vIENvdW50IGZvciB0aGUgbnVtYmVyIG9mIHZhcnMgdGhhdCB3aWxsIGJlIGFsbG9jYXRlZCBmb3IgZWFjaCBpMThuIGJsb2NrLlxuLy8gSXQgaXMgZ2xvYmFsIGJlY2F1c2UgdGhpcyBpcyB1c2VkIGluIG11bHRpcGxlIGZ1bmN0aW9ucyB0aGF0IGluY2x1ZGUgbG9vcHMgYW5kIHJlY3Vyc2l2ZSBjYWxscy5cbi8vIFRoaXMgaXMgcmVzZXQgdG8gMCB3aGVuIGBpMThuU3RhcnRGaXJzdFBhc3NgIGlzIGNhbGxlZC5cbmxldCBpMThuVmFyc0NvdW50OiBudW1iZXI7XG5cbi8qKlxuICogU2VlIGBpMThuU3RhcnRgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuU3RhcnRGaXJzdFBhc3MoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdGFydEluZGV4ID0gdFZpZXcuYmx1ZXByaW50Lmxlbmd0aCAtIEhFQURFUl9PRkZTRVQ7XG4gIGkxOG5WYXJzQ291bnQgPSAwO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSBnZXRJc1BhcmVudCgpID8gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4ID0gcGFyZW50VE5vZGUgJiYgcGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV0gP1xuICAgICAgcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUIDpcbiAgICAgIGluZGV4O1xuICBsZXQgcGFyZW50SW5kZXhQb2ludGVyID0gMDtcbiAgcGFyZW50SW5kZXhTdGFja1twYXJlbnRJbmRleFBvaW50ZXJdID0gcGFyZW50SW5kZXg7XG4gIGNvbnN0IGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzID0gW107XG4gIC8vIElmIHRoZSBwcmV2aW91cyBub2RlIHdhc24ndCB0aGUgZGlyZWN0IHBhcmVudCB0aGVuIHdlIGhhdmUgYSB0cmFuc2xhdGlvbiB3aXRob3V0IHRvcCBsZXZlbFxuICAvLyBlbGVtZW50IGFuZCB3ZSBuZWVkIHRvIGtlZXAgYSByZWZlcmVuY2Ugb2YgdGhlIHByZXZpb3VzIGVsZW1lbnQgaWYgdGhlcmUgaXMgb25lXG4gIGlmIChpbmRleCA+IDAgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSBwYXJlbnRUTm9kZSkge1xuICAgIC8vIENyZWF0ZSBhbiBPcENvZGUgdG8gc2VsZWN0IHRoZSBwcmV2aW91cyBUTm9kZVxuICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QpO1xuICB9XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGNvbnN0IGljdUV4cHJlc3Npb25zOiBUSWN1W10gPSBbXTtcblxuICBjb25zdCB0ZW1wbGF0ZVRyYW5zbGF0aW9uID0gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgY29uc3QgbXNnUGFydHMgPSB0ZW1wbGF0ZVRyYW5zbGF0aW9uLnNwbGl0KFBIX1JFR0VYUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXNnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWUgPSBtc2dQYXJ0c1tpXTtcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzKVxuICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJy8nKSB7XG4gICAgICAgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgxKSA9PT0gJyMnKSB7XG4gICAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigyKSwgMTApO1xuICAgICAgICAgIHBhcmVudEluZGV4ID0gcGFyZW50SW5kZXhTdGFja1stLXBhcmVudEluZGV4UG9pbnRlcl07XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDEpLCAxMCk7XG4gICAgICAgIC8vIFRoZSB2YWx1ZSByZXByZXNlbnRzIGEgcGxhY2Vob2xkZXIgdGhhdCB3ZSBtb3ZlIHRvIHRoZSBkZXNpZ25hdGVkIGluZGV4XG4gICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgIHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCxcbiAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJyMnKSB7XG4gICAgICAgICAgcGFyZW50SW5kZXhTdGFja1srK3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleCA9IHBoSW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MgJiBJQ1UgZXhwcmVzc2lvbnMpXG4gICAgICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyh2YWx1ZSk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBJQ1UgZXhwcmVzc2lvbnNcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdU5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmdEZXZNb2RlID8gYElDVSAke2ljdU5vZGVJbmRleH1gIDogJycsIGljdU5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSBjb2RlcyBmb3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1RXhwcmVzc2lvbiA9IHBhcnRzW2pdIGFzIEljdUV4cHJlc3Npb247XG4gICAgICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb24pO1xuICAgICAgICAgIGljdVN0YXJ0KGljdUV4cHJlc3Npb25zLCBpY3VFeHByZXNzaW9uLCBpY3VOb2RlSW5kZXgsIGljdU5vZGVJbmRleCk7XG4gICAgICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgICAgIGNvbnN0IHRJY3VJbmRleCA9IGljdUV4cHJlc3Npb25zLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyksICAvLyBtYXNrIG9mIHRoZSBtYWluIGJpbmRpbmdcbiAgICAgICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCwgdEljdUluZGV4LFxuICAgICAgICAgICAgICBtYXNrLCAgLy8gbWFzayBvZiBhbGwgdGhlIGJpbmRpbmdzIG9mIHRoaXMgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLCB0SWN1SW5kZXgpO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnRzW2pdICE9PSAnJykge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBwYXJ0c1tqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHRleHQubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGVzXG4gICAgICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGJpbmRpbmcsIHRoZSB2YWx1ZSB3aWxsIGJlIHNldCBkdXJpbmcgdXBkYXRlXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHRleHQsIHRleHROb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHRleHQsIHRleHROb2RlSW5kZXgpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhbGxvY0V4cGFuZG8odmlld0RhdGEsIGkxOG5WYXJzQ291bnQpO1xuXG4gIC8vIE5PVEU6IGxvY2FsIHZhciBuZWVkZWQgdG8gcHJvcGVybHkgYXNzZXJ0IHRoZSB0eXBlIG9mIGBUSTE4bmAuXG4gIGNvbnN0IHRJMThuOiBUSTE4biA9IHtcbiAgICB2YXJzOiBpMThuVmFyc0NvdW50LFxuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgaWN1czogaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLFxuICB9O1xuICB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSB0STE4bjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGUodE5vZGU6IFROb2RlLCBwYXJlbnRUTm9kZTogVE5vZGUsIHByZXZpb3VzVE5vZGU6IFROb2RlIHwgbnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgaWYgKCFwcmV2aW91c1ROb2RlKSB7XG4gICAgcHJldmlvdXNUTm9kZSA9IHBhcmVudFROb2RlO1xuICB9XG4gIC8vIHJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBpZiAocHJldmlvdXNUTm9kZSA9PT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHBhcmVudFROb2RlLmNoaWxkKSB7XG4gICAgdE5vZGUubmV4dCA9IHBhcmVudFROb2RlLmNoaWxkO1xuICAgIHBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gIH0gZWxzZSBpZiAocHJldmlvdXNUTm9kZSAhPT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHByZXZpb3VzVE5vZGUubmV4dCkge1xuICAgIHROb2RlLm5leHQgPSBwcmV2aW91c1ROb2RlLm5leHQ7XG4gICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICBpZiAocGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV0pIHtcbiAgICB0Tm9kZS5wYXJlbnQgPSBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGU7XG4gIH1cblxuICBhcHBlbmRDaGlsZChnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3RGF0YSksIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gdmlld0RhdGFbdE5vZGUuaW5kZXhdO1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIE5vZGVzIHRoYXQgaW5qZWN0IFZpZXdDb250YWluZXJSZWYgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gICAgYXBwZW5kQ2hpbGQoc2xvdFZhbHVlW05BVElWRV0sIHROb2RlLCB2aWV3RGF0YSk7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGZvciBpbnRlcm5hdGlvbmFsaXphdGlvbi5cbiAqXG4gKiBIYW5kbGVzIG1lc3NhZ2Ugc3RyaW5nIHBvc3QtcHJvY2Vzc2luZyBieSB0cmFuc2Zvcm1pbmcgaXQgZnJvbSBpbnRlcm1lZGlhdGVcbiAqIGZvcm1hdCAodGhhdCBtaWdodCBjb250YWluIHNvbWUgbWFya2VycyB0aGF0IHdlIG5lZWQgdG8gcmVwbGFjZSkgdG8gdGhlIGZpbmFsXG4gKiBmb3JtLCBjb25zdW1hYmxlIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvbi4gUG9zdCBwcm9jZXNzaW5nIHN0ZXBzIGluY2x1ZGU6XG4gKlxuICogMS4gUmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgY2FzZXMgKGxpa2UgW++/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71877+9Ne+/vV0pXG4gKiAyLiBSZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAqIDMuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBwdWJsaWNBUElcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5Qb3N0cHJvY2VzcyhcbiAgICBtZXNzYWdlOiBzdHJpbmcsIHJlcGxhY2VtZW50czoge1trZXk6IHN0cmluZ106IChzdHJpbmcgfCBzdHJpbmdbXSl9ID0ge30pOiBzdHJpbmcge1xuICAvKipcbiAgICogU3RlcCAxOiByZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBwbGFjZWhvbGRlcnMgbGlrZSBb77+9IzXvv71877+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vV1cbiAgICpcbiAgICogTm90ZTogZHVlIHRvIHRoZSB3YXkgd2UgcHJvY2VzcyBuZXN0ZWQgdGVtcGxhdGVzIChCRlMpLCBtdWx0aS12YWx1ZSBwbGFjZWhvbGRlcnMgYXJlIHR5cGljYWxseVxuICAgKiBncm91cGVkIGJ5IHRlbXBsYXRlcywgZm9yIGV4YW1wbGU6IFvvv70jNe+/vXzvv70jNu+/vXzvv70jMTox77+9fO+/vSMzOjLvv71dIHdoZXJlIO+/vSM177+9IGFuZCDvv70jNu+/vSBiZWxvbmcgdG8gcm9vdFxuICAgKiB0ZW1wbGF0ZSwg77+9IzE6Me+/vSBiZWxvbmcgdG8gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXggMSBhbmQg77+9IzE6Mu+/vSAtIG5lc3RlZCB0ZW1wbGF0ZSB3aXRoIGluZGV4XG4gICAqIDMuIEhvd2V2ZXIgaW4gcmVhbCB0ZW1wbGF0ZXMgdGhlIG9yZGVyIG1pZ2h0IGJlIGRpZmZlcmVudDogaS5lLiDvv70jMTox77+9IGFuZC9vciDvv70jMzoy77+9IG1heSBnbyBpblxuICAgKiBmcm9udCBvZiDvv70jNu+/vS4gVGhlIHBvc3QgcHJvY2Vzc2luZyBzdGVwIHJlc3RvcmVzIHRoZSByaWdodCBvcmRlciBieSBrZWVwaW5nIHRyYWNrIG9mIHRoZVxuICAgKiB0ZW1wbGF0ZSBpZCBzdGFjayBhbmQgbG9va3MgZm9yIHBsYWNlaG9sZGVycyB0aGF0IGJlbG9uZyB0byB0aGUgY3VycmVudGx5IGFjdGl2ZSB0ZW1wbGF0ZS5cbiAgICovXG4gIGxldCByZXN1bHQ6IHN0cmluZyA9IG1lc3NhZ2U7XG4gIGlmIChQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQLnRlc3QobWVzc2FnZSkpIHtcbiAgICBjb25zdCBtYXRjaGVzOiB7W2tleTogc3RyaW5nXTogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdfSA9IHt9O1xuICAgIGNvbnN0IHRlbXBsYXRlSWRzU3RhY2s6IG51bWJlcltdID0gW1JPT1RfVEVNUExBVEVfSURdO1xuICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX1BMQUNFSE9MREVSU19SRUdFWFAsIChtOiBhbnksIHBoczogc3RyaW5nLCB0bXBsOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IHBocyB8fCB0bXBsO1xuICAgICAgaWYgKCFtYXRjaGVzW2NvbnRlbnRdKSB7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdID0gW107XG4gICAgICAgIGNvbnRlbnQuc3BsaXQoJ3wnKS5mb3JFYWNoKChwbGFjZWhvbGRlcjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBwbGFjZWhvbGRlci5tYXRjaChQUF9URU1QTEFURV9JRF9SRUdFWFApO1xuICAgICAgICAgIGNvbnN0IHRlbXBsYXRlSWQgPSBtYXRjaCA/IHBhcnNlSW50KG1hdGNoWzFdLCAxMCkgOiBST09UX1RFTVBMQVRFX0lEO1xuICAgICAgICAgIGNvbnN0IGlzQ2xvc2VUZW1wbGF0ZVRhZyA9IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUC50ZXN0KHBsYWNlaG9sZGVyKTtcbiAgICAgICAgICBwbGFjZWhvbGRlcnMucHVzaChbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0pO1xuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlc1tjb250ZW50XSA9IHBsYWNlaG9sZGVycztcbiAgICAgIH1cbiAgICAgIGlmICghbWF0Y2hlc1tjb250ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgcGxhY2Vob2xkZXIgLSAke2NvbnRlbnR9YCk7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50VGVtcGxhdGVJZCA9IHRlbXBsYXRlSWRzU3RhY2tbdGVtcGxhdGVJZHNTdGFjay5sZW5ndGggLSAxXTtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG1hdGNoZXNbY29udGVudF07XG4gICAgICBsZXQgaWR4ID0gMDtcbiAgICAgIC8vIGZpbmQgcGxhY2Vob2xkZXIgaW5kZXggdGhhdCBtYXRjaGVzIGN1cnJlbnQgdGVtcGxhdGUgaWRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhY2Vob2xkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwbGFjZWhvbGRlcnNbaV1bMF0gPT09IGN1cnJlbnRUZW1wbGF0ZUlkKSB7XG4gICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIHRlbXBsYXRlIGlkIHN0YWNrIGJhc2VkIG9uIHRoZSBjdXJyZW50IHRhZyBleHRyYWN0ZWRcbiAgICAgIGNvbnN0IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSA9IHBsYWNlaG9sZGVyc1tpZHhdO1xuICAgICAgaWYgKGlzQ2xvc2VUZW1wbGF0ZVRhZykge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGVtcGxhdGVJZCAhPT0gdGVtcGxhdGVJZCkge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnB1c2godGVtcGxhdGVJZCk7XG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgcHJvY2Vzc2VkIHRhZyBmcm9tIHRoZSBsaXN0XG4gICAgICBwbGFjZWhvbGRlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfSk7XG5cbiAgICAvLyB2ZXJpZnkgdGhhdCB3ZSBpbmplY3RlZCBhbGwgdmFsdWVzXG4gICAgY29uc3QgaGFzVW5tYXRjaGVkVmFsdWVzID0gT2JqZWN0LmtleXMobWF0Y2hlcykuc29tZShrZXkgPT4gISFtYXRjaGVzW2tleV0ubGVuZ3RoKTtcbiAgICBpZiAoaGFzVW5tYXRjaGVkVmFsdWVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCB2YWx1ZXMgLSAke0pTT04uc3RyaW5naWZ5KG1hdGNoZXMpfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiBjdXJyZW50IHJlc3VsdCBpZiBubyByZXBsYWNlbWVudHMgc3BlY2lmaWVkXG4gIGlmICghT2JqZWN0LmtleXMocmVwbGFjZW1lbnRzKS5sZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0ZXAgMjogcmVwbGFjZSBhbGwgSUNVIHZhcnMgKGxpa2UgXCJWQVJfUExVUkFMXCIpXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VfVkFSU19SRUdFWFAsIChtYXRjaCwgc3RhcnQsIGtleSwgX3R5cGUsIF9pZHgsIGVuZCk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gYCR7c3RhcnR9JHtyZXBsYWNlbWVudHNba2V5XX0ke2VuZH1gIDogbWF0Y2g7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTdGVwIDM6IHJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSkgaW4gY2FzZVxuICAgKiBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVU19SRUdFWFAsIChtYXRjaCwga2V5KTogc3RyaW5nID0+IHtcbiAgICBpZiAocmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnN0IGxpc3QgPSByZXBsYWNlbWVudHNba2V5XSBhcyBzdHJpbmdbXTtcbiAgICAgIGlmICghbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgSUNVIC0gJHttYXRjaH0gd2l0aCBrZXk6ICR7a2V5fWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxpc3Quc2hpZnQoKSAhO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG1hcmtlZCBieSBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgLiBJdCBpbnNlcnRzIHRoZSB0ZXh0L0lDVSBub2Rlc1xuICogaW50byB0aGUgcmVuZGVyIHRyZWUsIG1vdmVzIHRoZSBwbGFjZWhvbGRlciBub2RlcyBhbmQgcmVtb3ZlcyB0aGUgZGVsZXRlZCBub2Rlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FbmQoKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkVuZEZpcnN0UGFzcyh0Vmlldyk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuRW5kYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkVuZEZpcnN0UGFzcyh0VmlldzogVFZpZXcpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHZpZXdEYXRhW1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnaTE4bkVuZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZycpO1xuXG4gIGNvbnN0IHJvb3RJbmRleCA9IGkxOG5JbmRleFN0YWNrW2kxOG5JbmRleFN0YWNrUG9pbnRlci0tXTtcbiAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW3Jvb3RJbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFRJMThuO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0STE4biwgYFlvdSBzaG91bGQgY2FsbCBpMThuU3RhcnQgYmVmb3JlIGkxOG5FbmRgKTtcblxuICAvLyBUaGUgbGFzdCBwbGFjZWhvbGRlciB0aGF0IHdhcyBhZGRlZCBiZWZvcmUgYGkxOG5FbmRgXG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCB2aXNpdGVkUGxhY2Vob2xkZXJzID0gcmVhZENyZWF0ZU9wQ29kZXMocm9vdEluZGV4LCB0STE4bi5jcmVhdGUsIHRJMThuLmljdXMsIHZpZXdEYXRhKTtcblxuICAvLyBSZW1vdmUgZGVsZXRlZCBwbGFjZWhvbGRlcnNcbiAgLy8gVGhlIGxhc3QgcGxhY2Vob2xkZXIgdGhhdCB3YXMgYWRkZWQgYmVmb3JlIGBpMThuRW5kYCBpcyBgcHJldmlvdXNPclBhcmVudFROb2RlYFxuICBmb3IgKGxldCBpID0gcm9vdEluZGV4ICsgMTsgaSA8PSBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUOyBpKyspIHtcbiAgICBpZiAodmlzaXRlZFBsYWNlaG9sZGVycy5pbmRleE9mKGkpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZShpLCB2aWV3RGF0YSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRDcmVhdGVPcENvZGVzKFxuICAgIGluZGV4OiBudW1iZXIsIGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLFxuICAgIHZpZXdEYXRhOiBMVmlldyk6IG51bWJlcltdIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRMVmlldygpW1JFTkRFUkVSXTtcbiAgbGV0IGN1cnJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgY29uc3QgdmlzaXRlZFBsYWNlaG9sZGVyczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUob3BDb2RlLCByZW5kZXJlcik7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KHRleHROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Uk5vZGUsIG51bGwsIG51bGwpO1xuICAgICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZDpcbiAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbk5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQ7XG4gICAgICAgICAgbGV0IGRlc3RpbmF0aW9uVE5vZGU6IFROb2RlO1xuICAgICAgICAgIGlmIChkZXN0aW5hdGlvbk5vZGVJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBkZXN0aW5hdGlvbiBub2RlIGlzIGBpMThuU3RhcnRgLCB3ZSBkb24ndCBoYXZlIGFcbiAgICAgICAgICAgIC8vIHRvcC1sZXZlbCBub2RlIGFuZCB3ZSBzaG91bGQgdXNlIHRoZSBob3N0IG5vZGUgaW5zdGVhZFxuICAgICAgICAgICAgZGVzdGluYXRpb25UTm9kZSA9IHZpZXdEYXRhW0hPU1RfTk9ERV0gITtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVzdGluYXRpb25UTm9kZSA9IGdldFROb2RlKGRlc3RpbmF0aW9uTm9kZUluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgY3VycmVudFROb2RlICEsXG4gICAgICAgICAgICAgICAgICBgWW91IG5lZWQgdG8gY3JlYXRlIG9yIHNlbGVjdCBhIG5vZGUgYmVmb3JlIHlvdSBjYW4gaW5zZXJ0IGl0IGludG8gdGhlIERPTWApO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBhcHBlbmRJMThuTm9kZShjdXJyZW50VE5vZGUgISwgZGVzdGluYXRpb25UTm9kZSwgcHJldmlvdXNUTm9kZSk7XG4gICAgICAgICAgZGVzdGluYXRpb25UTm9kZS5uZXh0ID0gbnVsbDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHZpc2l0ZWRQbGFjZWhvbGRlcnMucHVzaChub2RlSW5kZXgpO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgaWYgKGN1cnJlbnRUTm9kZSkge1xuICAgICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgICAgICAgIHNldElzUGFyZW50KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgY29uc3QgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSk7XG4gICAgICAgICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBlbGVtZW50QXR0cmlidXRlKGVsZW1lbnROb2RlSW5kZXgsIGF0dHJOYW1lLCBhdHRyVmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgY29uc3QgY29tbWVudFZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBjb21tZW50Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY29tbWVudFZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7Y29tbWVudFZhbHVlfVwiIHRvIGJlIGEgY29tbWVudCBub2RlIHZhbHVlYCk7XG4gICAgICAgICAgY29uc3QgY29tbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChjb21tZW50VmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPVxuICAgICAgICAgICAgICBjcmVhdGVOb2RlQXRJbmRleChjb21tZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBjb21tZW50Uk5vZGUsIG51bGwsIG51bGwpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb21tZW50Uk5vZGUsIHZpZXdEYXRhKTtcbiAgICAgICAgICAoY3VycmVudFROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlKS5hY3RpdmVDYXNlSW5kZXggPSBudWxsO1xuICAgICAgICAgIC8vIFdlIHdpbGwgYWRkIHRoZSBjYXNlIG5vZGVzIGxhdGVyLCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZVxuICAgICAgICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgZWxlbWVudE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIGVsZW1lbnRSTm9kZSwgdGFnTmFtZVZhbHVlLCBudWxsKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldElzUGFyZW50KGZhbHNlKTtcblxuICByZXR1cm4gdmlzaXRlZFBsYWNlaG9sZGVycztcbn1cblxuZnVuY3Rpb24gcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNoYW5nZU1hc2s6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBieXBhc3NDaGVja0JpdCA9IGZhbHNlKSB7XG4gIGxldCBjYXNlQ3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVwZGF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgY29uc3QgY2hlY2tCaXQgPSB1cGRhdGVPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgIGNvbnN0IHNraXBDb2RlcyA9IHVwZGF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgaWYgKGJ5cGFzc0NoZWNrQml0IHx8IChjaGVja0JpdCAmIGNoYW5nZU1hc2spKSB7XG4gICAgICAvLyBUaGUgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCBzaW5jZSBsYXN0IGNoZWNrZWRcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeSh2aWV3RGF0YVtiaW5kaW5nc1N0YXJ0SW5kZXggLSBvcENvZGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBTYW5pdGl6ZXJGbiB8IG51bGw7XG4gICAgICAgICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZShub2RlSW5kZXgsIGF0dHJOYW1lLCB2YWx1ZSwgc2FuaXRpemVGbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHRleHRCaW5kaW5nKG5vZGVJbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIGxldCB0SWN1SW5kZXggPSB1cGRhdGVPcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIGxldCB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgbGV0IGljdVROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gYWN0aXZlIGNhc2UsIGRlbGV0ZSB0aGUgb2xkIG5vZGVzXG4gICAgICAgICAgICAgICAgaWYgKGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlQ29kZXMgPSB0SWN1LnJlbW92ZVtpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmVDb2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVPcENvZGUgPSByZW1vdmVDb2Rlc1trXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVtb3ZlT3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmU6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3U6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUNvZGVzW2sgKyAxXSBhcyBudW1iZXIgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VE5vZGUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5lc3RlZEljdU5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSBuZXN0ZWRJY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VEluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkVEljdSA9IGljdXMgIVtuZXN0ZWRJY3VUSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KG5lc3RlZFRJY3UucmVtb3ZlW2FjdGl2ZUluZGV4XSwgcmVtb3ZlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGFjdGl2ZSBjYXNlSW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICAgICAgICAgICAgcmVhZENyZWF0ZU9wQ29kZXMoLTEsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIGljdXMsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgdEljdS51cGRhdGVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICFdLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssXG4gICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhLCBjYXNlQ3JlYXRlZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KSB7XG4gIGNvbnN0IHJlbW92ZWRQaFROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIHZpZXdEYXRhKTtcbiAgY29uc3QgcmVtb3ZlZFBoUk5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSk7XG4gIGlmIChyZW1vdmVkUGhSTm9kZSkge1xuICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCByZW1vdmVkUGhSTm9kZSk7XG4gIH1cblxuICByZW1vdmVkUGhUTm9kZS5kZXRhY2hlZCA9IHRydWU7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gbG9hZChpbmRleCkgYXMgUkVsZW1lbnQgfCBSQ29tbWVudCB8IExDb250YWluZXIgfCBTdHlsaW5nQ29udGV4dDtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHNsb3RWYWx1ZSBhcyBMQ29udGFpbmVyO1xuICAgIGlmIChyZW1vdmVkUGhUTm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBuYXRpdmVSZW1vdmVOb2RlKHZpZXdEYXRhW1JFTkRFUkVSXSwgbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKlxuICogVXNlIHRoaXMgaW5zdHJ1Y3Rpb24gdG8gY3JlYXRlIGEgdHJhbnNsYXRpb24gYmxvY2sgdGhhdCBkb2Vzbid0IGNvbnRhaW4gYW55IHBsYWNlaG9sZGVyLlxuICogSXQgY2FsbHMgYm90aCB7QGxpbmsgaTE4blN0YXJ0fSBhbmQge0BsaW5rIGkxOG5FbmR9IGluIG9uZSBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIGlzIHRoZSB2YWx1ZSB3aGljaCBpcyBsb2NhbGUgc3BlY2lmaWMuIFRoZSB0cmFuc2xhdGlvbiBzdHJpbmcgbWF5XG4gKiBjb250YWluIHBsYWNlaG9sZGVycyB3aGljaCBhc3NvY2lhdGUgaW5uZXIgZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMgd2l0aGluIHRoZSB0cmFuc2xhdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIHBsYWNlaG9sZGVycyBhcmU6XG4gKiAtIGDvv717aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpCaW5kaW5nIFBsYWNlaG9sZGVyKjogTWFya3MgYSBsb2NhdGlvbiB3aGVyZSBhbiBleHByZXNzaW9uIHdpbGwgYmVcbiAqICAgaW50ZXJwb2xhdGVkIGludG8uIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZXhwcmVzc2lvbiBiaW5kaW5nIGluZGV4LiBBbiBvcHRpb25hbFxuICogICBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSN7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8je2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqRWxlbWVudCBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGUgYmVnaW5uaW5nXG4gKiAgIGFuZCBlbmQgb2YgRE9NIGVsZW1lbnQgdGhhdCB3ZXJlIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay4gVGhlIHBsYWNlaG9sZGVyXG4gKiAgIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LiBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXRcbiAqICAgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSp7aW5kZXh9OntibG9ja33vv71gL2Dvv70vKntpbmRleH06e2Jsb2Nrfe+/vWA6ICpTdWItdGVtcGxhdGUgUGxhY2Vob2xkZXIqOiBTdWItdGVtcGxhdGVzIG11c3QgYmVcbiAqICAgc3BsaXQgdXAgYW5kIHRyYW5zbGF0ZWQgc2VwYXJhdGVseSBpbiBlYWNoIGFuZ3VsYXIgdGVtcGxhdGUgZnVuY3Rpb24uIFRoZSBgaW5kZXhgIHBvaW50cyB0byB0aGVcbiAqICAgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbiBpbmRleC4gQSBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggb2YgdGhlIHRyYW5zbGF0aW9uIGluIHRoZSBzdGF0aWMgYmxvY2suXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgdHJhbnNsYXRpb24gbWVzc2FnZS5cbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IE9wdGlvbmFsIHN1Yi10ZW1wbGF0ZSBpbmRleCBpbiB0aGUgYG1lc3NhZ2VgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bihpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgaTE4blN0YXJ0KGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgaTE4bkVuZCgpO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgbGlzdCBvZiBhdHRyaWJ1dGVzIGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggaW4gdGhlIHN0YXRpYyBibG9ja1xuICogQHBhcmFtIHZhbHVlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkF0dHJpYnV0ZXMoaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyh0VmlldywgaW5kZXgsIHZhbHVlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWUgYGkxOG5BdHRyaWJ1dGVzYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnRJbmRleCA9IHByZXZpb3VzRWxlbWVudC5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG4gICAgY29uc3QgcGFydHMgPSBtZXNzYWdlLnNwbGl0KElDVV9SRUdFWFApO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFydHNbal07XG5cbiAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlc1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIXZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50QXR0cmlidXRlKHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdXBkYXRlT3BDb2Rlcztcbn1cblxubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5sZXQgc2hpZnRzQ291bnRlciA9IDA7XG5cbi8qKlxuICogU3RvcmVzIHRoZSB2YWx1ZXMgb2YgdGhlIGJpbmRpbmdzIGR1cmluZyBlYWNoIHVwZGF0ZSBjeWNsZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0b1xuICogdXBkYXRlIHRoZSB0cmFuc2xhdGVkIG5vZGVzLlxuICpcbiAqIEBwYXJhbSBleHByZXNzaW9uIFRoZSBiaW5kaW5nJ3MgbmV3IHZhbHVlIG9yIE5PX0NIQU5HRVxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkV4cDxUPihleHByZXNzaW9uOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmIChleHByZXNzaW9uICE9PSBOT19DSEFOR0UpIHtcbiAgICBjaGFuZ2VNYXNrID0gY2hhbmdlTWFzayB8ICgxIDw8IHNoaWZ0c0NvdW50ZXIpO1xuICB9XG4gIHNoaWZ0c0NvdW50ZXIrKztcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgb3IgYW4gaTE4biBhdHRyaWJ1dGUgd2hlbiB0aGUgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiBlaXRoZXIge0BsaW5rIGkxOG5TdGFydH0gKHRyYW5zbGF0aW9uIGJsb2NrKSBvciB7QGxpbmsgaTE4bkF0dHJpYnV0ZXN9XG4gKiAoaTE4biBhdHRyaWJ1dGUpIG9uIHdoaWNoIGl0IHNob3VsZCB1cGRhdGUgdGhlIGNvbnRlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuQXBwbHkoaW5kZXg6IG51bWJlcikge1xuICBpZiAoc2hpZnRzQ291bnRlcikge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gICAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG4gICAgbGV0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIGxldCBpY3VzOiBUSWN1W118bnVsbCA9IG51bGw7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodEkxOG4pKSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gdEkxOG4gYXMgSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZU9wQ29kZXMgPSAodEkxOG4gYXMgVEkxOG4pLnVwZGF0ZTtcbiAgICAgIGljdXMgPSAodEkxOG4gYXMgVEkxOG4pLmljdXM7XG4gICAgfVxuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gc2hpZnRzQ291bnRlciAtIDE7XG4gICAgcmVhZFVwZGF0ZU9wQ29kZXModXBkYXRlT3BDb2RlcywgaWN1cywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrLCBsVmlldyk7XG5cbiAgICAvLyBSZXNldCBjaGFuZ2VNYXNrICYgbWFza0JpdCB0byBkZWZhdWx0IGZvciB0aGUgbmV4dCB1cGRhdGUgY3ljbGVcbiAgICBjaGFuZ2VNYXNrID0gMGIwO1xuICAgIHNoaWZ0c0NvdW50ZXIgPSAwO1xuICB9XG59XG5cbmVudW0gUGx1cmFsIHtcbiAgWmVybyA9IDAsXG4gIE9uZSA9IDEsXG4gIFR3byA9IDIsXG4gIEZldyA9IDMsXG4gIE1hbnkgPSA0LFxuICBPdGhlciA9IDUsXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcGx1cmFsIGNhc2UgYmFzZWQgb24gdGhlIGxvY2FsZS5cbiAqIFRoaXMgaXMgYSBjb3B5IG9mIHRoZSBkZXByZWNhdGVkIGZ1bmN0aW9uIHRoYXQgd2UgdXNlZCBpbiBBbmd1bGFyIHY0LlxuICogLy8gVE9ETyhvY29tYmUpOiByZW1vdmUgdGhpcyBvbmNlIHdlIGNhbiB0aGUgcmVhbCBnZXRQbHVyYWxDYXNlIGZ1bmN0aW9uXG4gKlxuICogQGRlcHJlY2F0ZWQgZnJvbSB2NSB0aGUgcGx1cmFsIGNhc2UgZnVuY3Rpb24gaXMgaW4gbG9jYWxlIGRhdGEgZmlsZXMgY29tbW9uL2xvY2FsZXMvKi50c1xuICovXG5mdW5jdGlvbiBnZXRQbHVyYWxDYXNlKGxvY2FsZTogc3RyaW5nLCBuTGlrZTogbnVtYmVyIHwgc3RyaW5nKTogUGx1cmFsIHtcbiAgaWYgKHR5cGVvZiBuTGlrZSA9PT0gJ3N0cmluZycpIHtcbiAgICBuTGlrZSA9IHBhcnNlSW50KDxzdHJpbmc+bkxpa2UsIDEwKTtcbiAgfVxuICBjb25zdCBuOiBudW1iZXIgPSBuTGlrZSBhcyBudW1iZXI7XG4gIGNvbnN0IG5EZWNpbWFsID0gbi50b1N0cmluZygpLnJlcGxhY2UoL15bXi5dKlxcLj8vLCAnJyk7XG4gIGNvbnN0IGkgPSBNYXRoLmZsb29yKE1hdGguYWJzKG4pKTtcbiAgY29uc3QgdiA9IG5EZWNpbWFsLmxlbmd0aDtcbiAgY29uc3QgZiA9IHBhcnNlSW50KG5EZWNpbWFsLCAxMCk7XG4gIGNvbnN0IHQgPSBwYXJzZUludChuLnRvU3RyaW5nKCkucmVwbGFjZSgvXlteLl0qXFwuP3wwKyQvZywgJycpLCAxMCkgfHwgMDtcblxuICBjb25zdCBsYW5nID0gbG9jYWxlLnNwbGl0KCctJylbMF0udG9Mb3dlckNhc2UoKTtcblxuICBzd2l0Y2ggKGxhbmcpIHtcbiAgICBjYXNlICdhZic6XG4gICAgY2FzZSAnYXNhJzpcbiAgICBjYXNlICdheic6XG4gICAgY2FzZSAnYmVtJzpcbiAgICBjYXNlICdiZXonOlxuICAgIGNhc2UgJ2JnJzpcbiAgICBjYXNlICdicngnOlxuICAgIGNhc2UgJ2NlJzpcbiAgICBjYXNlICdjZ2cnOlxuICAgIGNhc2UgJ2Nocic6XG4gICAgY2FzZSAnY2tiJzpcbiAgICBjYXNlICdlZSc6XG4gICAgY2FzZSAnZWwnOlxuICAgIGNhc2UgJ2VvJzpcbiAgICBjYXNlICdlcyc6XG4gICAgY2FzZSAnZXUnOlxuICAgIGNhc2UgJ2ZvJzpcbiAgICBjYXNlICdmdXInOlxuICAgIGNhc2UgJ2dzdyc6XG4gICAgY2FzZSAnaGEnOlxuICAgIGNhc2UgJ2hhdyc6XG4gICAgY2FzZSAnaHUnOlxuICAgIGNhc2UgJ2pnbyc6XG4gICAgY2FzZSAnam1jJzpcbiAgICBjYXNlICdrYSc6XG4gICAgY2FzZSAna2snOlxuICAgIGNhc2UgJ2traic6XG4gICAgY2FzZSAna2wnOlxuICAgIGNhc2UgJ2tzJzpcbiAgICBjYXNlICdrc2InOlxuICAgIGNhc2UgJ2t5JzpcbiAgICBjYXNlICdsYic6XG4gICAgY2FzZSAnbGcnOlxuICAgIGNhc2UgJ21hcyc6XG4gICAgY2FzZSAnbWdvJzpcbiAgICBjYXNlICdtbCc6XG4gICAgY2FzZSAnbW4nOlxuICAgIGNhc2UgJ25iJzpcbiAgICBjYXNlICduZCc6XG4gICAgY2FzZSAnbmUnOlxuICAgIGNhc2UgJ25uJzpcbiAgICBjYXNlICdubmgnOlxuICAgIGNhc2UgJ255bic6XG4gICAgY2FzZSAnb20nOlxuICAgIGNhc2UgJ29yJzpcbiAgICBjYXNlICdvcyc6XG4gICAgY2FzZSAncHMnOlxuICAgIGNhc2UgJ3JtJzpcbiAgICBjYXNlICdyb2YnOlxuICAgIGNhc2UgJ3J3ayc6XG4gICAgY2FzZSAnc2FxJzpcbiAgICBjYXNlICdzZWgnOlxuICAgIGNhc2UgJ3NuJzpcbiAgICBjYXNlICdzbyc6XG4gICAgY2FzZSAnc3EnOlxuICAgIGNhc2UgJ3RhJzpcbiAgICBjYXNlICd0ZSc6XG4gICAgY2FzZSAndGVvJzpcbiAgICBjYXNlICd0ayc6XG4gICAgY2FzZSAndHInOlxuICAgIGNhc2UgJ3VnJzpcbiAgICBjYXNlICd1eic6XG4gICAgY2FzZSAndm8nOlxuICAgIGNhc2UgJ3Z1bic6XG4gICAgY2FzZSAnd2FlJzpcbiAgICBjYXNlICd4b2cnOlxuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdhayc6XG4gICAgY2FzZSAnbG4nOlxuICAgIGNhc2UgJ21nJzpcbiAgICBjYXNlICdwYSc6XG4gICAgY2FzZSAndGknOlxuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSAwICYmIG4gPD0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2FtJzpcbiAgICBjYXNlICdhcyc6XG4gICAgY2FzZSAnYm4nOlxuICAgIGNhc2UgJ2ZhJzpcbiAgICBjYXNlICdndSc6XG4gICAgY2FzZSAnaGknOlxuICAgIGNhc2UgJ2tuJzpcbiAgICBjYXNlICdtcic6XG4gICAgY2FzZSAnenUnOlxuICAgICAgaWYgKGkgPT09IDAgfHwgbiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2FyJzpcbiAgICAgIGlmIChuID09PSAwKSByZXR1cm4gUGx1cmFsLlplcm87XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAobiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDMgJiYgbiAlIDEwMCA8PSAxMCkgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAobiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDExICYmIG4gJSAxMDAgPD0gOTkpIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYXN0JzpcbiAgICBjYXNlICdjYSc6XG4gICAgY2FzZSAnZGUnOlxuICAgIGNhc2UgJ2VuJzpcbiAgICBjYXNlICdldCc6XG4gICAgY2FzZSAnZmknOlxuICAgIGNhc2UgJ2Z5JzpcbiAgICBjYXNlICdnbCc6XG4gICAgY2FzZSAnaXQnOlxuICAgIGNhc2UgJ25sJzpcbiAgICBjYXNlICdzdic6XG4gICAgY2FzZSAnc3cnOlxuICAgIGNhc2UgJ3VyJzpcbiAgICBjYXNlICd5aSc6XG4gICAgICBpZiAoaSA9PT0gMSAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYmUnOlxuICAgICAgaWYgKG4gJSAxMCA9PT0gMSAmJiAhKG4gJSAxMDAgPT09IDExKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiAlIDEwID09PSBNYXRoLmZsb29yKG4gJSAxMCkgJiYgbiAlIDEwID49IDIgJiYgbiAlIDEwIDw9IDQgJiZcbiAgICAgICAgICAhKG4gJSAxMDAgPj0gMTIgJiYgbiAlIDEwMCA8PSAxNCkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKG4gJSAxMCA9PT0gMCB8fCBuICUgMTAgPT09IE1hdGguZmxvb3IobiAlIDEwKSAmJiBuICUgMTAgPj0gNSAmJiBuICUgMTAgPD0gOSB8fFxuICAgICAgICAgIG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAxMSAmJiBuICUgMTAwIDw9IDE0KVxuICAgICAgICByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2JyJzpcbiAgICAgIGlmIChuICUgMTAgPT09IDEgJiYgIShuICUgMTAwID09PSAxMSB8fCBuICUgMTAwID09PSA3MSB8fCBuICUgMTAwID09PSA5MSkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gJSAxMCA9PT0gMiAmJiAhKG4gJSAxMDAgPT09IDEyIHx8IG4gJSAxMDAgPT09IDcyIHx8IG4gJSAxMDAgPT09IDkyKSkgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAobiAlIDEwID09PSBNYXRoLmZsb29yKG4gJSAxMCkgJiYgKG4gJSAxMCA+PSAzICYmIG4gJSAxMCA8PSA0IHx8IG4gJSAxMCA9PT0gOSkgJiZcbiAgICAgICAgICAhKG4gJSAxMDAgPj0gMTAgJiYgbiAlIDEwMCA8PSAxOSB8fCBuICUgMTAwID49IDcwICYmIG4gJSAxMDAgPD0gNzkgfHxcbiAgICAgICAgICAgIG4gJSAxMDAgPj0gOTAgJiYgbiAlIDEwMCA8PSA5OSkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKCEobiA9PT0gMCkgJiYgbiAlIDFlNiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdicyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ3NyJzpcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gMSAmJiAhKGkgJSAxMDAgPT09IDExKSB8fCBmICUgMTAgPT09IDEgJiYgIShmICUgMTAwID09PSAxMSkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSBNYXRoLmZsb29yKGkgJSAxMCkgJiYgaSAlIDEwID49IDIgJiYgaSAlIDEwIDw9IDQgJiZcbiAgICAgICAgICAgICAgIShpICUgMTAwID49IDEyICYmIGkgJSAxMDAgPD0gMTQpIHx8XG4gICAgICAgICAgZiAlIDEwID09PSBNYXRoLmZsb29yKGYgJSAxMCkgJiYgZiAlIDEwID49IDIgJiYgZiAlIDEwIDw9IDQgJiZcbiAgICAgICAgICAgICAgIShmICUgMTAwID49IDEyICYmIGYgJSAxMDAgPD0gMTQpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnY3MnOlxuICAgIGNhc2UgJ3NrJzpcbiAgICAgIGlmIChpID09PSAxICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKGkgPT09IE1hdGguZmxvb3IoaSkgJiYgaSA+PSAyICYmIGkgPD0gNCAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmICghKHYgPT09IDApKSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2N5JzpcbiAgICAgIGlmIChuID09PSAwKSByZXR1cm4gUGx1cmFsLlplcm87XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAobiA9PT0gMykgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAobiA9PT0gNikgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdkYSc6XG4gICAgICBpZiAobiA9PT0gMSB8fCAhKHQgPT09IDApICYmIChpID09PSAwIHx8IGkgPT09IDEpKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZHNiJzpcbiAgICBjYXNlICdoc2InOlxuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gMSB8fCBmICUgMTAwID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMDAgPT09IDIgfHwgZiAlIDEwMCA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAwID09PSBNYXRoLmZsb29yKGkgJSAxMDApICYmIGkgJSAxMDAgPj0gMyAmJiBpICUgMTAwIDw9IDQgfHxcbiAgICAgICAgICBmICUgMTAwID09PSBNYXRoLmZsb29yKGYgJSAxMDApICYmIGYgJSAxMDAgPj0gMyAmJiBmICUgMTAwIDw9IDQpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdmZic6XG4gICAgY2FzZSAnZnInOlxuICAgIGNhc2UgJ2h5JzpcbiAgICBjYXNlICdrYWInOlxuICAgICAgaWYgKGkgPT09IDAgfHwgaSA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2ZpbCc6XG4gICAgICBpZiAodiA9PT0gMCAmJiAoaSA9PT0gMSB8fCBpID09PSAyIHx8IGkgPT09IDMpIHx8XG4gICAgICAgICAgdiA9PT0gMCAmJiAhKGkgJSAxMCA9PT0gNCB8fCBpICUgMTAgPT09IDYgfHwgaSAlIDEwID09PSA5KSB8fFxuICAgICAgICAgICEodiA9PT0gMCkgJiYgIShmICUgMTAgPT09IDQgfHwgZiAlIDEwID09PSA2IHx8IGYgJSAxMCA9PT0gOSkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdnYSc6XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDMgJiYgbiA8PSA2KSByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gNyAmJiBuIDw9IDEwKSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2dkJzpcbiAgICAgIGlmIChuID09PSAxIHx8IG4gPT09IDExKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSAyIHx8IG4gPT09IDEyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIChuID49IDMgJiYgbiA8PSAxMCB8fCBuID49IDEzICYmIG4gPD0gMTkpKSByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZ3YnOlxuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAodiA9PT0gMCAmJlxuICAgICAgICAgIChpICUgMTAwID09PSAwIHx8IGkgJSAxMDAgPT09IDIwIHx8IGkgJSAxMDAgPT09IDQwIHx8IGkgJSAxMDAgPT09IDYwIHx8IGkgJSAxMDAgPT09IDgwKSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAoISh2ID09PSAwKSkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdoZSc6XG4gICAgICBpZiAoaSA9PT0gMSAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChpID09PSAyICYmIHYgPT09IDApIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKHYgPT09IDAgJiYgIShuID49IDAgJiYgbiA8PSAxMCkgJiYgbiAlIDEwID09PSAwKSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2lzJzpcbiAgICAgIGlmICh0ID09PSAwICYmIGkgJSAxMCA9PT0gMSAmJiAhKGkgJSAxMDAgPT09IDExKSB8fCAhKHQgPT09IDApKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAna3NoJzpcbiAgICAgIGlmIChuID09PSAwKSByZXR1cm4gUGx1cmFsLlplcm87XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2t3JzpcbiAgICBjYXNlICduYXEnOlxuICAgIGNhc2UgJ3NlJzpcbiAgICBjYXNlICdzbW4nOlxuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdsYWcnOlxuICAgICAgaWYgKG4gPT09IDApIHJldHVybiBQbHVyYWwuWmVybztcbiAgICAgIGlmICgoaSA9PT0gMCB8fCBpID09PSAxKSAmJiAhKG4gPT09IDApKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnbHQnOlxuICAgICAgaWYgKG4gJSAxMCA9PT0gMSAmJiAhKG4gJSAxMDAgPj0gMTEgJiYgbiAlIDEwMCA8PSAxOSkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gJSAxMCA9PT0gTWF0aC5mbG9vcihuICUgMTApICYmIG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA5ICYmXG4gICAgICAgICAgIShuICUgMTAwID49IDExICYmIG4gJSAxMDAgPD0gMTkpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmICghKGYgPT09IDApKSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2x2JzpcbiAgICBjYXNlICdwcmcnOlxuICAgICAgaWYgKG4gJSAxMCA9PT0gMCB8fCBuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMTEgJiYgbiAlIDEwMCA8PSAxOSB8fFxuICAgICAgICAgIHYgPT09IDIgJiYgZiAlIDEwMCA9PT0gTWF0aC5mbG9vcihmICUgMTAwKSAmJiBmICUgMTAwID49IDExICYmIGYgJSAxMDAgPD0gMTkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuWmVybztcbiAgICAgIGlmIChuICUgMTAgPT09IDEgJiYgIShuICUgMTAwID09PSAxMSkgfHwgdiA9PT0gMiAmJiBmICUgMTAgPT09IDEgJiYgIShmICUgMTAwID09PSAxMSkgfHxcbiAgICAgICAgICAhKHYgPT09IDIpICYmIGYgJSAxMCA9PT0gMSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ21rJzpcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gMSB8fCBmICUgMTAgPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdtdCc6XG4gICAgICBpZiAobiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gMCB8fCBuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMiAmJiBuICUgMTAwIDw9IDEwKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmIChuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMTEgJiYgbiAlIDEwMCA8PSAxOSkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdwbCc6XG4gICAgICBpZiAoaSA9PT0gMSAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gTWF0aC5mbG9vcihpICUgMTApICYmIGkgJSAxMCA+PSAyICYmIGkgJSAxMCA8PSA0ICYmXG4gICAgICAgICAgIShpICUgMTAwID49IDEyICYmIGkgJSAxMDAgPD0gMTQpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmICh2ID09PSAwICYmICEoaSA9PT0gMSkgJiYgaSAlIDEwID09PSBNYXRoLmZsb29yKGkgJSAxMCkgJiYgaSAlIDEwID49IDAgJiYgaSAlIDEwIDw9IDEgfHxcbiAgICAgICAgICB2ID09PSAwICYmIGkgJSAxMCA9PT0gTWF0aC5mbG9vcihpICUgMTApICYmIGkgJSAxMCA+PSA1ICYmIGkgJSAxMCA8PSA5IHx8XG4gICAgICAgICAgdiA9PT0gMCAmJiBpICUgMTAwID09PSBNYXRoLmZsb29yKGkgJSAxMDApICYmIGkgJSAxMDAgPj0gMTIgJiYgaSAlIDEwMCA8PSAxNClcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdwdCc6XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDAgJiYgbiA8PSAyICYmICEobiA9PT0gMikpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdybyc6XG4gICAgICBpZiAoaSA9PT0gMSAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICghKHYgPT09IDApIHx8IG4gPT09IDAgfHxcbiAgICAgICAgICAhKG4gPT09IDEpICYmIG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAxICYmIG4gJSAxMDAgPD0gMTkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdydSc6XG4gICAgY2FzZSAndWsnOlxuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwID09PSAxICYmICEoaSAlIDEwMCA9PT0gMTEpKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gTWF0aC5mbG9vcihpICUgMTApICYmIGkgJSAxMCA+PSAyICYmIGkgJSAxMCA8PSA0ICYmXG4gICAgICAgICAgIShpICUgMTAwID49IDEyICYmIGkgJSAxMDAgPD0gMTQpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gMCB8fFxuICAgICAgICAgIHYgPT09IDAgJiYgaSAlIDEwID09PSBNYXRoLmZsb29yKGkgJSAxMCkgJiYgaSAlIDEwID49IDUgJiYgaSAlIDEwIDw9IDkgfHxcbiAgICAgICAgICB2ID09PSAwICYmIGkgJSAxMDAgPT09IE1hdGguZmxvb3IoaSAlIDEwMCkgJiYgaSAlIDEwMCA+PSAxMSAmJiBpICUgMTAwIDw9IDE0KVxuICAgICAgICByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3NoaSc6XG4gICAgICBpZiAoaSA9PT0gMCB8fCBuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gMiAmJiBuIDw9IDEwKSByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnc2knOlxuICAgICAgaWYgKG4gPT09IDAgfHwgbiA9PT0gMSB8fCBpID09PSAwICYmIGYgPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdzbCc6XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAwID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMDAgPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gTWF0aC5mbG9vcihpICUgMTAwKSAmJiBpICUgMTAwID49IDMgJiYgaSAlIDEwMCA8PSA0IHx8ICEodiA9PT0gMCkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICd0em0nOlxuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSAwICYmIG4gPD0gMSB8fCBuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gMTEgJiYgbiA8PSA5OSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIC8vIFdoZW4gdGhlcmUgaXMgbm8gc3BlY2lmaWNhdGlvbiwgdGhlIGRlZmF1bHQgaXMgYWx3YXlzIFwib3RoZXJcIlxuICAgIC8vIFNwZWM6IGh0dHA6Ly9jbGRyLnVuaWNvZGUub3JnL2luZGV4L2NsZHItc3BlYy9wbHVyYWwtcnVsZXNcbiAgICAvLyA+IG90aGVyIChyZXF1aXJlZOKAlGdlbmVyYWwgcGx1cmFsIGZvcm0g4oCUIGFsc28gdXNlZCBpZiB0aGUgbGFuZ3VhZ2Ugb25seSBoYXMgYSBzaW5nbGUgZm9ybSlcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQbHVyYWxDYXRlZ29yeSh2YWx1ZTogYW55LCBsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBsdXJhbCA9IGdldFBsdXJhbENhc2UobG9jYWxlLCB2YWx1ZSk7XG5cbiAgc3dpdGNoIChwbHVyYWwpIHtcbiAgICBjYXNlIFBsdXJhbC5aZXJvOlxuICAgICAgcmV0dXJuICd6ZXJvJztcbiAgICBjYXNlIFBsdXJhbC5PbmU6XG4gICAgICByZXR1cm4gJ29uZSc7XG4gICAgY2FzZSBQbHVyYWwuVHdvOlxuICAgICAgcmV0dXJuICd0d28nO1xuICAgIGNhc2UgUGx1cmFsLkZldzpcbiAgICAgIHJldHVybiAnZmV3JztcbiAgICBjYXNlIFBsdXJhbC5NYW55OlxuICAgICAgcmV0dXJuICdtYW55JztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdvdGhlcic7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBjYXNlIG9mIGFuIElDVSBleHByZXNzaW9uIGRlcGVuZGluZyBvbiB0aGUgbWFpbiBiaW5kaW5nIHZhbHVlXG4gKlxuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBiaW5kaW5nVmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBtYWluIGJpbmRpbmcgdXNlZCBieSB0aGlzIElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIGdldENhc2VJbmRleChpY3VFeHByZXNzaW9uOiBUSWN1LCBiaW5kaW5nVmFsdWU6IHN0cmluZyk6IG51bWJlciB7XG4gIGxldCBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZihiaW5kaW5nVmFsdWUpO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgc3dpdGNoIChpY3VFeHByZXNzaW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgSWN1VHlwZS5wbHVyYWw6IHtcbiAgICAgICAgLy8gVE9ETyhvY29tYmUpOiByZXBsYWNlIHRoaXMgaGFyZC1jb2RlZCB2YWx1ZSBieSB0aGUgcmVhbCBMT0NBTEVfSUQgdmFsdWVcbiAgICAgICAgY29uc3QgbG9jYWxlID0gJ2VuLVVTJztcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRDYXNlID0gZ2V0UGx1cmFsQ2F0ZWdvcnkoYmluZGluZ1ZhbHVlLCBsb2NhbGUpO1xuICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZihyZXNvbHZlZENhc2UpO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xICYmIHJlc29sdmVkQ2FzZSAhPT0gJ290aGVyJykge1xuICAgICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBJY3VUeXBlLnNlbGVjdDoge1xuICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyBmb3IgSUNVIGV4cHJlc3Npb25zLlxuICpcbiAqIEBwYXJhbSB0SWN1c1xuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBzdGFydEluZGV4XG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXhcbiAqL1xuZnVuY3Rpb24gaWN1U3RhcnQoXG4gICAgdEljdXM6IFRJY3VbXSwgaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgc3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY3JlYXRlQ29kZXMgPSBbXTtcbiAgY29uc3QgcmVtb3ZlQ29kZXMgPSBbXTtcbiAgY29uc3QgdXBkYXRlQ29kZXMgPSBbXTtcbiAgY29uc3QgdmFycyA9IFtdO1xuICBjb25zdCBjaGlsZEljdXM6IG51bWJlcltdW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpY3VFeHByZXNzaW9uLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIEVhY2ggdmFsdWUgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyAmIG90aGVyIElDVSBleHByZXNzaW9uc1xuICAgIGNvbnN0IHZhbHVlQXJyID0gaWN1RXhwcmVzc2lvbi52YWx1ZXNbaV07XG4gICAgY29uc3QgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIEl0IGlzIGFuIG5lc3RlZCBJQ1UgZXhwcmVzc2lvblxuICAgICAgICBjb25zdCBpY3VJbmRleCA9IG5lc3RlZEljdXMucHVzaCh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uKSAtIDE7XG4gICAgICAgIC8vIFJlcGxhY2UgbmVzdGVkIElDVSBleHByZXNzaW9uIGJ5IGEgY29tbWVudCBub2RlXG4gICAgICAgIHZhbHVlQXJyW2pdID0gYDwhLS3vv70ke2ljdUluZGV4fe+/vS0tPmA7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGljdUNhc2U6IEljdUNhc2UgPVxuICAgICAgICBwYXJzZUljdUNhc2UodmFsdWVBcnIuam9pbignJyksIHN0YXJ0SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gICAgY3JlYXRlQ29kZXMucHVzaChpY3VDYXNlLmNyZWF0ZSk7XG4gICAgcmVtb3ZlQ29kZXMucHVzaChpY3VDYXNlLnJlbW92ZSk7XG4gICAgdXBkYXRlQ29kZXMucHVzaChpY3VDYXNlLnVwZGF0ZSk7XG4gICAgdmFycy5wdXNoKGljdUNhc2UudmFycyk7XG4gICAgY2hpbGRJY3VzLnB1c2goaWN1Q2FzZS5jaGlsZEljdXMpO1xuICB9XG4gIGNvbnN0IHRJY3U6IFRJY3UgPSB7XG4gICAgdHlwZTogaWN1RXhwcmVzc2lvbi50eXBlLFxuICAgIHZhcnMsXG4gICAgY2hpbGRJY3VzLFxuICAgIGNhc2VzOiBpY3VFeHByZXNzaW9uLmNhc2VzLFxuICAgIGNyZWF0ZTogY3JlYXRlQ29kZXMsXG4gICAgcmVtb3ZlOiByZW1vdmVDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZUNvZGVzXG4gIH07XG4gIHRJY3VzLnB1c2godEljdSk7XG4gIC8vIEFkZGluZyB0aGUgbWF4aW11bSBwb3NzaWJsZSBvZiB2YXJzIG5lZWRlZCAoYmFzZWQgb24gdGhlIGNhc2VzIHdpdGggdGhlIG1vc3QgdmFycylcbiAgaTE4blZhcnNDb3VudCArPSBNYXRoLm1heCguLi52YXJzKTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGEgc3RyaW5nIHRlbXBsYXRlIGludG8gYW4gSFRNTCB0ZW1wbGF0ZSBhbmQgYSBsaXN0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHVwZGF0ZVxuICogYXR0cmlidXRlcyBvciBub2RlcyB0aGF0IGNvbnRhaW4gYmluZGluZ3MuXG4gKlxuICogQHBhcmFtIHVuc2FmZUh0bWwgVGhlIHN0cmluZyB0byBwYXJzZVxuICogQHBhcmFtIHBhcmVudEluZGV4XG4gKiBAcGFyYW0gbmVzdGVkSWN1c1xuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXhcbiAqL1xuZnVuY3Rpb24gcGFyc2VJY3VDYXNlKFxuICAgIHVuc2FmZUh0bWw6IHN0cmluZywgcGFyZW50SW5kZXg6IG51bWJlciwgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdLCB0SWN1czogVEljdVtdLFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIpOiBJY3VDYXNlIHtcbiAgY29uc3QgaW5lcnRCb2R5SGVscGVyID0gbmV3IEluZXJ0Qm9keUhlbHBlcihkb2N1bWVudCk7XG4gIGNvbnN0IGluZXJ0Qm9keUVsZW1lbnQgPSBpbmVydEJvZHlIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudCh1bnNhZmVIdG1sKTtcbiAgaWYgKCFpbmVydEJvZHlFbGVtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZ2VuZXJhdGUgaW5lcnQgYm9keSBlbGVtZW50Jyk7XG4gIH1cbiAgY29uc3Qgd3JhcHBlciA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50ICEpIGFzIEVsZW1lbnQgfHwgaW5lcnRCb2R5RWxlbWVudDtcbiAgY29uc3Qgb3BDb2RlczogSWN1Q2FzZSA9IHt2YXJzOiAwLCBjaGlsZEljdXM6IFtdLCBjcmVhdGU6IFtdLCByZW1vdmU6IFtdLCB1cGRhdGU6IFtdfTtcbiAgcGFyc2VOb2Rlcyh3cmFwcGVyLmZpcnN0Q2hpbGQsIG9wQ29kZXMsIHBhcmVudEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICByZXR1cm4gb3BDb2Rlcztcbn1cblxuY29uc3QgTkVTVEVEX0lDVSA9IC/vv70oXFxkKynvv70vO1xuXG4vKipcbiAqIFBhcnNlcyBhIG5vZGUsIGl0cyBjaGlsZHJlbiBhbmQgaXRzIHNpYmxpbmdzLCBhbmQgZ2VuZXJhdGVzIHRoZSBtdXRhdGUgJiB1cGRhdGUgT3BDb2Rlcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudE5vZGUgVGhlIGZpcnN0IG5vZGUgdG8gcGFyc2VcbiAqIEBwYXJhbSBpY3VDYXNlIFRoZSBkYXRhIGZvciB0aGUgSUNVIGV4cHJlc3Npb24gY2FzZSB0aGF0IGNvbnRhaW5zIHRob3NlIG5vZGVzXG4gKiBAcGFyYW0gcGFyZW50SW5kZXggSW5kZXggb2YgdGhlIGN1cnJlbnQgbm9kZSdzIHBhcmVudFxuICogQHBhcmFtIG5lc3RlZEljdXMgRGF0YSBmb3IgdGhlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbnMgdGhhdCB0aGlzIGNhc2UgY29udGFpbnNcbiAqIEBwYXJhbSB0SWN1cyBEYXRhIGZvciBhbGwgSUNVIGV4cHJlc3Npb25zIG9mIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleCBFeHBhbmRvIHN0YXJ0IGluZGV4IGZvciB0aGUgY3VycmVudCBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBwYXJzZU5vZGVzKFxuICAgIGN1cnJlbnROb2RlOiBOb2RlIHwgbnVsbCwgaWN1Q2FzZTogSWN1Q2FzZSwgcGFyZW50SW5kZXg6IG51bWJlciwgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdLFxuICAgIHRJY3VzOiBUSWN1W10sIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGN1cnJlbnROb2RlKSB7XG4gICAgY29uc3QgbmVzdGVkSWN1c1RvQ3JlYXRlOiBbSWN1RXhwcmVzc2lvbiwgbnVtYmVyXVtdID0gW107XG4gICAgd2hpbGUgKGN1cnJlbnROb2RlKSB7XG4gICAgICBjb25zdCBuZXh0Tm9kZTogTm9kZXxudWxsID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICBjb25zdCBuZXdJbmRleCA9IGV4cGFuZG9TdGFydEluZGV4ICsgKytpY3VDYXNlLnZhcnM7XG4gICAgICBzd2l0Y2ggKGN1cnJlbnROb2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IGN1cnJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmICghVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXNuJ3QgYSB2YWxpZCBlbGVtZW50LCB3ZSB3b24ndCBjcmVhdGUgYW4gZWxlbWVudCBmb3IgaXRcbiAgICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIEVMRU1FTlRfTUFSS0VSLCB0YWdOYW1lLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgICAgY29uc3QgZWxBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBjb25zdCBhdHRyID0gZWxBdHRycy5pdGVtKGkpICE7XG4gICAgICAgICAgICAgIGNvbnN0IGxvd2VyQXR0ck5hbWUgPSBhdHRyLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9ICEhYXR0ci52YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGUgaW5wdXQgc3RyaW5nIGlzIHNhZmUsIHVubGVzcyBpdCdzIHVzaW5nIGEgYmluZGluZ1xuICAgICAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgICAgIGlmIChWQUxJRF9BVFRSUy5oYXNPd25Qcm9wZXJ0eShsb3dlckF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgaWYgKFVSSV9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBfc2FuaXRpemVVcmwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChTUkNTRVRfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgc2FuaXRpemVTcmNzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYFdBUk5JTkc6IGlnbm9yaW5nIHVuc2FmZSBhdHRyaWJ1dGUgdmFsdWUgJHtsb3dlckF0dHJOYW1lfSBvbiBlbGVtZW50ICR7dGFnTmFtZX0gKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5BdHRyLCBhdHRyLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQYXJzZSB0aGUgY2hpbGRyZW4gb2YgdGhpcyBub2RlIChpZiBhbnkpXG4gICAgICAgICAgICBwYXJzZU5vZGVzKFxuICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmZpcnN0Q2hpbGQsIGljdUNhc2UsIG5ld0luZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBwYXJlbnQgbm9kZSBhZnRlciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICBoYXNCaW5kaW5nID8gJycgOiB2YWx1ZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBuZXdJbmRleCksIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvbW1lbnQgbm9kZSBpcyBhIHBsYWNlaG9sZGVyIGZvciBhIG5lc3RlZCBJQ1VcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IE5FU1RFRF9JQ1UuZXhlYyhjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJyk7XG4gICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VJbmRleCA9IHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgICAgICAgICBjb25zdCBuZXdMb2NhbCA9IG5nRGV2TW9kZSA/IGBuZXN0ZWQgSUNVICR7bmVzdGVkSWN1SW5kZXh9YCA6ICcnO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5ld0xvY2FsLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1ID0gbmVzdGVkSWN1c1tuZXN0ZWRJY3VJbmRleF07XG4gICAgICAgICAgICBuZXN0ZWRJY3VzVG9DcmVhdGUucHVzaChbbmVzdGVkSWN1LCBuZXdJbmRleF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkbyBub3QgaGFuZGxlIGFueSBvdGhlciB0eXBlIG9mIGNvbW1lbnRcbiAgICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBXZSBkbyBub3QgaGFuZGxlIGFueSBvdGhlciB0eXBlIG9mIGVsZW1lbnRcbiAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gbmV4dE5vZGUgITtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5lc3RlZEljdXNUb0NyZWF0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmVzdGVkSWN1ID0gbmVzdGVkSWN1c1RvQ3JlYXRlW2ldWzBdO1xuICAgICAgY29uc3QgbmVzdGVkSWN1Tm9kZUluZGV4ID0gbmVzdGVkSWN1c1RvQ3JlYXRlW2ldWzFdO1xuICAgICAgaWN1U3RhcnQodEljdXMsIG5lc3RlZEljdSwgbmVzdGVkSWN1Tm9kZUluZGV4LCBleHBhbmRvU3RhcnRJbmRleCArIGljdUNhc2UudmFycyk7XG4gICAgICAvLyBTaW5jZSB0aGlzIGlzIHJlY3Vyc2l2ZSwgdGhlIGxhc3QgVEljdSB0aGF0IHdhcyBwdXNoZWQgaXMgdGhlIG9uZSB3ZSB3YW50XG4gICAgICBjb25zdCBuZXN0VEljdUluZGV4ID0gdEljdXMubGVuZ3RoIC0gMTtcbiAgICAgIGljdUNhc2UudmFycyArPSBNYXRoLm1heCguLi50SWN1c1tuZXN0VEljdUluZGV4XS52YXJzKTtcbiAgICAgIGljdUNhc2UuY2hpbGRJY3VzLnB1c2gobmVzdFRJY3VJbmRleCk7XG4gICAgICBjb25zdCBtYXNrID0gZ2V0QmluZGluZ01hc2sobmVzdGVkSWN1KTtcbiAgICAgIGljdUNhc2UudXBkYXRlLnB1c2goXG4gICAgICAgICAgdG9NYXNrQml0KG5lc3RlZEljdS5tYWluQmluZGluZyksICAvLyBtYXNrIG9mIHRoZSBtYWluIGJpbmRpbmdcbiAgICAgICAgICAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgMyBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgLTEgLSBuZXN0ZWRJY3UubWFpbkJpbmRpbmcsXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2gsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCxcbiAgICAgICAgICBtYXNrLCAgLy8gbWFzayBvZiBhbGwgdGhlIGJpbmRpbmdzIG9mIHRoaXMgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAyLCAgICAgLy8gc2tpcCAyIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSxcbiAgICAgICAgICBuZXN0VEljdUluZGV4KTtcbiAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2goXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlTmVzdGVkSWN1LFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==