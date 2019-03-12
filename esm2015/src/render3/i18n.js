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
import { BINDING_INDEX, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from './interfaces/view';
import { appendChild, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getIsParent, getLView, getPreviousOrParentTNode, setIsParent, setPreviousOrParentTNode } from './state';
import { NO_CHANGE } from './tokens';
import { addAllToArray } from './util/array_utils';
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
 * @param {?} node
 * @return {?}
 */
function findLastNode(node) {
    while (node.next) {
        node = node.next;
    }
    if (node.child) {
        return findLastNode(node.child);
    }
    return node;
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
    if (lastCreatedNode.child) {
        lastCreatedNode = findLastNode(lastCreatedNode.child);
    }
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
                                elementAttribute(nodeIndex, attrName, value, sanitizeFn);
                                break;
                            case 0 /* Text */:
                                textBinding(nodeIndex, value);
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
    const slotValue = (/** @type {?} */ (load(index)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4SCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRyxPQUFPLEVBQWEsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlHLE1BQU0sbUJBQW1CLENBQUM7QUFLakssT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQVMsUUFBUSxFQUFFLEtBQUssRUFBUyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RyxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMvRyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25D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SyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLElBQUksQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUM7UUFDVixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxLQUFLO1lBQ1IsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFBRSxPQUFPLE1B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RSxhQUFhLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RCxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzs7a0JBQ2hDLElBQUksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUNmLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUcsMkJBQTJCO1lBQzlELENBQUMsRUFBa0MsZ0NBQWdDO1lBQ25FLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQzFCLGtCQUFrQixxQkFBOEIsb0JBQTZCLEVBQzdFLGFBQWEsRUFDYixJQUFJLEVBQUcsa0RBQWtEO1lBQ3pELENBQUMsRUFBTSxnQ0FBZ0M7WUFDdkMsa0JBQWtCLHFCQUE4QixvQkFBNkIsRUFDN0UsYUFBYSxDQUFDLENBQUM7WUFDbkIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2YsYUFBYSxxQkFBOEIsMEJBQW1DLEVBQzlFLGtCQUFrQixxQkFBOEIsaUJBQTBCLENBQUMsQ0FBQztTQUNqRjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTUkNTRVRfQVRUUlMsIFVSSV9BVFRSUywgVkFMSURfQVRUUlMsIFZBTElEX0VMRU1FTlRTLCBnZXRUZW1wbGF0ZUNvbnRlbnR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge0luZXJ0Qm9keUhlbHBlcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2luZXJ0X2JvZHknO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwsIHNhbml0aXplU3Jjc2V0fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHthbGxvY0V4cGFuZG8sIGNyZWF0ZU5vZGVBdEluZGV4LCBlbGVtZW50QXR0cmlidXRlLCBsb2FkLCB0ZXh0QmluZGluZ30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDT01NRU5UX01BUktFUiwgRUxFTUVOVF9NQVJLRVIsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgSWN1VHlwZSwgVEkxOG4sIFRJY3V9IGZyb20gJy4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlLCBuYXRpdmVSZW1vdmVOb2RlfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldElzUGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlLCBpc0xDb250YWluZXJ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuY29uc3QgTUFSS0VSID0gYO+/vWA7XG5jb25zdCBJQ1VfQkxPQ0tfUkVHRVhQID0gL15cXHMqKO+/vVxcZCs6P1xcZCrvv70pXFxzKixcXHMqKHNlbGVjdHxwbHVyYWwpXFxzKiwvO1xuY29uc3QgU1VCVEVNUExBVEVfUkVHRVhQID0gL++/vVxcLz9cXCooXFxkKzpcXGQrKe+/vS9naTtcbmNvbnN0IFBIX1JFR0VYUCA9IC/vv70oXFwvP1sjKl1cXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IEJJTkRJTkdfUkVHRVhQID0gL++/vShcXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IElDVV9SRUdFWFAgPSAvKHtcXHMq77+9XFxkKzo/XFxkKu+/vVxccyosXFxzKlxcU3s2fVxccyosW1xcc1xcU10qfSkvZ2k7XG5cbi8vIGkxOG5Qb3N0cHJvY2VzcyBjb25zdHNcbmNvbnN0IFJPT1RfVEVNUExBVEVfSUQgPSAwO1xuY29uc3QgUFBfTVVMVElfVkFMVUVfUExBQ0VIT0xERVJTX1JFR0VYUCA9IC9cXFso77+9Lis/77+9PylcXF0vO1xuY29uc3QgUFBfUExBQ0VIT0xERVJTX1JFR0VYUCA9IC9cXFso77+9Lis/77+9PylcXF18KO+/vVxcLz9cXCpcXGQrOlxcZCvvv70pL2c7XG5jb25zdCBQUF9JQ1VfVkFSU19SRUdFWFAgPSAvKHtcXHMqKShWQVJfKFBMVVJBTHxTRUxFQ1QpKF9cXGQrKT8pKFxccyosKS9nO1xuY29uc3QgUFBfSUNVU19SRUdFWFAgPSAv77+9STE4Tl9FWFBfKElDVShfXFxkKyk/Ke+/vS9nO1xuY29uc3QgUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQID0gL1xcL1xcKi87XG5jb25zdCBQUF9URU1QTEFURV9JRF9SRUdFWFAgPSAvXFxkK1xcOihcXGQrKS87XG5cbi8vIFBhcnNlZCBwbGFjZWhvbGRlciBzdHJ1Y3R1cmUgdXNlZCBpbiBwb3N0cHJvY2Vzc2luZyAod2l0aGluIGBpMThuUG9zdHByb2Nlc3NgIGZ1bmN0aW9uKVxuLy8gQ29udGFpbnMgdGhlIGZvbGxvd2luZyBmaWVsZHM6IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXVxudHlwZSBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyID0gW251bWJlciwgYm9vbGVhbiwgc3RyaW5nXTtcblxuaW50ZXJmYWNlIEljdUV4cHJlc3Npb24ge1xuICB0eXBlOiBJY3VUeXBlO1xuICBtYWluQmluZGluZzogbnVtYmVyO1xuICBjYXNlczogc3RyaW5nW107XG4gIHZhbHVlczogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdW107XG59XG5cbmludGVyZmFjZSBJY3VDYXNlIHtcbiAgLyoqXG4gICAqIE51bWJlciBvZiBzbG90cyB0byBhbGxvY2F0ZSBpbiBleHBhbmRvIGZvciB0aGlzIGNhc2UuXG4gICAqXG4gICAqIFRoaXMgaXMgdGhlIG1heCBudW1iZXIgb2YgRE9NIGVsZW1lbnRzIHdoaWNoIHdpbGwgYmUgY3JlYXRlZCBieSB0aGlzIGkxOG4gKyBJQ1UgYmxvY2tzLiBXaGVuXG4gICAqIHRoZSBET00gZWxlbWVudHMgYXJlIGJlaW5nIGNyZWF0ZWQgdGhleSBhcmUgc3RvcmVkIGluIHRoZSBFWFBBTkRPLCBzbyB0aGF0IHVwZGF0ZSBPcENvZGVzIGNhblxuICAgKiB3cml0ZSBpbnRvIHRoZW0uXG4gICAqL1xuICB2YXJzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGFycmF5IG9mIGNoaWxkL3N1YiBJQ1VzLlxuICAgKi9cbiAgY2hpbGRJY3VzOiBudW1iZXJbXTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBidWlsZCB1cCB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVXG4gICAqL1xuICBjcmVhdGU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGRlc3Ryb3kgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVS5cbiAgICovXG4gIHJlbW92ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gdXBkYXRlIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UgYmluZGluZ3MuXG4gICAqL1xuICB1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzO1xufVxuXG4vKipcbiAqIEJyZWFrcyBwYXR0ZXJuIGludG8gc3RyaW5ncyBhbmQgdG9wIGxldmVsIHsuLi59IGJsb2Nrcy5cbiAqIENhbiBiZSB1c2VkIHRvIGJyZWFrIGEgbWVzc2FnZSBpbnRvIHRleHQgYW5kIElDVSBleHByZXNzaW9ucywgb3IgdG8gYnJlYWsgYW4gSUNVIGV4cHJlc3Npb24gaW50b1xuICoga2V5cyBhbmQgY2FzZXMuXG4gKiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiAoc3ViKVBhdHRlcm4gdG8gYmUgYnJva2VuLlxuICpcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBhcnRzKHBhdHRlcm46IHN0cmluZyk6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdIHtcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgbGV0IHByZXZQb3MgPSAwO1xuICBjb25zdCBicmFjZVN0YWNrID0gW107XG4gIGNvbnN0IHJlc3VsdHM6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdID0gW107XG4gIGNvbnN0IGJyYWNlcyA9IC9be31dL2c7XG4gIC8vIGxhc3RJbmRleCBkb2Vzbid0IGdldCBzZXQgdG8gMCBzbyB3ZSBoYXZlIHRvLlxuICBicmFjZXMubGFzdEluZGV4ID0gMDtcblxuICBsZXQgbWF0Y2g7XG4gIHdoaWxlIChtYXRjaCA9IGJyYWNlcy5leGVjKHBhdHRlcm4pKSB7XG4gICAgY29uc3QgcG9zID0gbWF0Y2guaW5kZXg7XG4gICAgaWYgKG1hdGNoWzBdID09ICd9Jykge1xuICAgICAgYnJhY2VTdGFjay5wb3AoKTtcblxuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gRW5kIG9mIHRoZSBibG9jay5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICBpZiAoSUNVX0JMT0NLX1JFR0VYUC50ZXN0KGJsb2NrKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChwYXJzZUlDVUJsb2NrKGJsb2NrKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYmxvY2spIHsgIC8vIERvbid0IHB1c2ggZW1wdHkgc3RyaW5nc1xuICAgICAgICAgIHJlc3VsdHMucHVzaChibG9jayk7XG4gICAgICAgIH1cblxuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgICAgYnJhY2VTdGFjay5wdXNoKCd7Jyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcyk7XG4gIGlmIChzdWJzdHJpbmcgIT0gJycpIHtcbiAgICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIFBhcnNlcyB0ZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gYW5kIHByb2R1Y2VzIGEgSlNPTiBvYmplY3QgZm9yIGl0LlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gVGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxuICpcbiAqL1xuZnVuY3Rpb24gcGFyc2VJQ1VCbG9jayhwYXR0ZXJuOiBzdHJpbmcpOiBJY3VFeHByZXNzaW9uIHtcbiAgY29uc3QgY2FzZXMgPSBbXTtcbiAgY29uc3QgdmFsdWVzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXVtdID0gW107XG4gIGxldCBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gIGxldCBtYWluQmluZGluZyA9IDA7XG4gIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoSUNVX0JMT0NLX1JFR0VYUCwgZnVuY3Rpb24oc3RyOiBzdHJpbmcsIGJpbmRpbmc6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgaWYgKHR5cGUgPT09ICdzZWxlY3QnKSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5zZWxlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgICB9XG4gICAgbWFpbkJpbmRpbmcgPSBwYXJzZUludChiaW5kaW5nLnN1YnN0cigxKSwgMTApO1xuICAgIHJldHVybiAnJztcbiAgfSk7XG5cbiAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHMocGF0dGVybikgYXMgc3RyaW5nW107XG4gIC8vIExvb2tpbmcgZm9yIChrZXkgYmxvY2spKyBzZXF1ZW5jZS4gT25lIG9mIHRoZSBrZXlzIGhhcyB0byBiZSBcIm90aGVyXCIuXG4gIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IHBhcnRzLmxlbmd0aDspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbcG9zKytdLnRyaW0oKTtcbiAgICBpZiAoaWN1VHlwZSA9PT0gSWN1VHlwZS5wbHVyYWwpIHtcbiAgICAgIC8vIEtleSBjYW4gYmUgXCI9eFwiLCB3ZSBqdXN0IHdhbnQgXCJ4XCJcbiAgICAgIGtleSA9IGtleS5yZXBsYWNlKC9cXHMqKD86PSk/KFxcdyspXFxzKi8sICckMScpO1xuICAgIH1cbiAgICBpZiAoa2V5Lmxlbmd0aCkge1xuICAgICAgY2FzZXMucHVzaChrZXkpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrcyA9IGV4dHJhY3RQYXJ0cyhwYXJ0c1twb3MrK10pIGFzIHN0cmluZ1tdO1xuICAgIGlmIChibG9ja3MubGVuZ3RoKSB7XG4gICAgICB2YWx1ZXMucHVzaChibG9ja3MpO1xuICAgIH1cbiAgfVxuXG4gIGFzc2VydEdyZWF0ZXJUaGFuKGNhc2VzLmluZGV4T2YoJ290aGVyJyksIC0xLCAnTWlzc2luZyBrZXkgXCJvdGhlclwiIGluIElDVSBzdGF0ZW1lbnQuJyk7XG4gIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlcywgc2VlICMyMTYxNVxuICByZXR1cm4ge3R5cGU6IGljdVR5cGUsIG1haW5CaW5kaW5nOiBtYWluQmluZGluZywgY2FzZXMsIHZhbHVlc307XG59XG5cbi8qKlxuICogUmVtb3ZlcyBldmVyeXRoaW5nIGluc2lkZSB0aGUgc3ViLXRlbXBsYXRlcyBvZiBhIG1lc3NhZ2UuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgbWF0Y2g7XG4gIGxldCByZXMgPSAnJztcbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgbGV0IHRhZ01hdGNoZWQ7XG5cbiAgd2hpbGUgKChtYXRjaCA9IFNVQlRFTVBMQVRFX1JFR0VYUC5leGVjKG1lc3NhZ2UpKSAhPT0gbnVsbCkge1xuICAgIGlmICghaW5UZW1wbGF0ZSkge1xuICAgICAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyaW5nKGluZGV4LCBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICB0YWdNYXRjaGVkID0gbWF0Y2hbMV07XG4gICAgICBpblRlbXBsYXRlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG1hdGNoWzBdID09PSBgJHtNQVJLRVJ9Lyoke3RhZ01hdGNoZWR9JHtNQVJLRVJ9YCkge1xuICAgICAgICBpbmRleCA9IG1hdGNoLmluZGV4O1xuICAgICAgICBpblRlbXBsYXRlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBpblRlbXBsYXRlLCBmYWxzZSxcbiAgICAgICAgICBgVGFnIG1pc21hdGNoOiB1bmFibGUgdG8gZmluZCB0aGUgZW5kIG9mIHRoZSBzdWItdGVtcGxhdGUgaW4gdGhlIHRyYW5zbGF0aW9uIFwiJHttZXNzYWdlfVwiYCk7XG5cbiAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyKGluZGV4KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBhIHBhcnQgb2YgYSBtZXNzYWdlIGFuZCByZW1vdmVzIHRoZSByZXN0LlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIGV4dHJhY3RpbmcgYSBwYXJ0IG9mIHRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCBhIHRlbXBsYXRlLiBBIHRyYW5zbGF0ZWRcbiAqIG1lc3NhZ2UgY2FuIHNwYW4gbXVsdGlwbGUgdGVtcGxhdGVzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgaTE4bj5UcmFuc2xhdGUgPHNwYW4gKm5nSWY+bWU8L3NwYW4+ITwvZGl2PlxuICogYGBgXG4gKlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gY3JvcFxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggSW5kZXggb2YgdGhlIHN1Yi10ZW1wbGF0ZSB0byBleHRyYWN0LiBJZiB1bmRlZmluZWQgaXQgcmV0dXJucyB0aGVcbiAqIGV4dGVybmFsIHRlbXBsYXRlIGFuZCByZW1vdmVzIGFsbCBzdWItdGVtcGxhdGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBzdWJUZW1wbGF0ZUluZGV4ICE9PSAnbnVtYmVyJykge1xuICAgIC8vIFdlIHdhbnQgdGhlIHJvb3QgdGVtcGxhdGUgbWVzc2FnZSwgaWdub3JlIGFsbCBzdWItdGVtcGxhdGVzXG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSB3YW50IGEgc3BlY2lmaWMgc3ViLXRlbXBsYXRlXG4gICAgY29uc3Qgc3RhcnQgPVxuICAgICAgICBtZXNzYWdlLmluZGV4T2YoYDoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkgKyAyICsgc3ViVGVtcGxhdGVJbmRleC50b1N0cmluZygpLmxlbmd0aDtcbiAgICBjb25zdCBlbmQgPSBtZXNzYWdlLnNlYXJjaChuZXcgUmVnRXhwKGAke01BUktFUn1cXFxcL1xcXFwqXFxcXGQrOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSk7XG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlLnN1YnN0cmluZyhzdGFydCwgZW5kKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyB0byB1cGRhdGUgdGhlIGJpbmRpbmdzIG9mIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBiaW5kaW5ncy5cbiAqIEBwYXJhbSBkZXN0aW5hdGlvbk5vZGUgSW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIG5vZGUgd2hpY2ggd2lsbCByZWNlaXZlIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGF0dHJOYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSwgaWYgdGhlIHN0cmluZyBiZWxvbmdzIHRvIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZUZuIFNhbml0aXphdGlvbiBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSBzdHJpbmcgYWZ0ZXIgdXBkYXRlLCBpZiBuZWNlc3NhcnkuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgc3RyOiBzdHJpbmcsIGRlc3RpbmF0aW9uTm9kZTogbnVtYmVyLCBhdHRyTmFtZT86IHN0cmluZyxcbiAgICBzYW5pdGl6ZUZuOiBTYW5pdGl6ZXJGbiB8IG51bGwgPSBudWxsKTogSTE4blVwZGF0ZU9wQ29kZXMge1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtudWxsLCBudWxsXTsgIC8vIEFsbG9jIHNwYWNlIGZvciBtYXNrIGFuZCBzaXplXG4gIGNvbnN0IHRleHRQYXJ0cyA9IHN0ci5zcGxpdChCSU5ESU5HX1JFR0VYUCk7XG4gIGxldCBtYXNrID0gMDtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IHRleHRQYXJ0cy5sZW5ndGg7IGorKykge1xuICAgIGNvbnN0IHRleHRWYWx1ZSA9IHRleHRQYXJ0c1tqXTtcblxuICAgIGlmIChqICYgMSkge1xuICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBwYXJzZUludCh0ZXh0VmFsdWUsIDEwKTtcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCgtMSAtIGJpbmRpbmdJbmRleCk7XG4gICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChiaW5kaW5nSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAodGV4dFZhbHVlICE9PSAnJykge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2godGV4dFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVPcENvZGVzLnB1c2goXG4gICAgICBkZXN0aW5hdGlvbk5vZGUgPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfFxuICAgICAgKGF0dHJOYW1lID8gSTE4blVwZGF0ZU9wQ29kZS5BdHRyIDogSTE4blVwZGF0ZU9wQ29kZS5UZXh0KSk7XG4gIGlmIChhdHRyTmFtZSkge1xuICAgIHVwZGF0ZU9wQ29kZXMucHVzaChhdHRyTmFtZSwgc2FuaXRpemVGbik7XG4gIH1cbiAgdXBkYXRlT3BDb2Rlc1swXSA9IG1hc2s7XG4gIHVwZGF0ZU9wQ29kZXNbMV0gPSB1cGRhdGVPcENvZGVzLmxlbmd0aCAtIDI7XG4gIHJldHVybiB1cGRhdGVPcENvZGVzO1xufVxuXG5mdW5jdGlvbiBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBtYXNrID0gMCk6IG51bWJlciB7XG4gIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpO1xuICBsZXQgbWF0Y2g7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICB3aGlsZSAobWF0Y2ggPSBCSU5ESU5HX1JFR0VYUC5leGVjKHZhbHVlKSkge1xuICAgICAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KHBhcnNlSW50KG1hdGNoWzFdLCAxMCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXNrID0gZ2V0QmluZGluZ01hc2sodmFsdWUgYXMgSWN1RXhwcmVzc2lvbiwgbWFzayk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXNrO1xufVxuXG5jb25zdCBpMThuSW5kZXhTdGFjazogbnVtYmVyW10gPSBbXTtcbmxldCBpMThuSW5kZXhTdGFja1BvaW50ZXIgPSAtMTtcblxuLyoqXG4gKiBDb252ZXJ0IGJpbmRpbmcgaW5kZXggdG8gbWFzayBiaXQuXG4gKlxuICogRWFjaCBpbmRleCByZXByZXNlbnRzIGEgc2luZ2xlIGJpdCBvbiB0aGUgYml0LW1hc2suIEJlY2F1c2UgYml0LW1hc2sgb25seSBoYXMgMzIgYml0cywgd2UgbWFrZVxuICogdGhlIDMybmQgYml0IHNoYXJlIGFsbCBtYXNrcyBmb3IgYWxsIGJpbmRpbmdzIGhpZ2hlciB0aGFuIDMyLiBTaW5jZSBpdCBpcyBleHRyZW1lbHkgcmFyZSB0byBoYXZlXG4gKiBtb3JlIHRoYW4gMzIgYmluZGluZ3MgdGhpcyB3aWxsIGJlIGhpdCB2ZXJ5IHJhcmVseS4gVGhlIGRvd25zaWRlIG9mIGhpdHRpbmcgdGhpcyBjb3JuZXIgY2FzZSBpc1xuICogdGhhdCB3ZSB3aWxsIGV4ZWN1dGUgYmluZGluZyBjb2RlIG1vcmUgb2Z0ZW4gdGhhbiBuZWNlc3NhcnkuIChwZW5hbHR5IG9mIHBlcmZvcm1hbmNlKVxuICovXG5mdW5jdGlvbiB0b01hc2tCaXQoYmluZGluZ0luZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gMSA8PCBNYXRoLm1pbihiaW5kaW5nSW5kZXgsIDMxKTtcbn1cblxuY29uc3QgcGFyZW50SW5kZXhTdGFjazogbnVtYmVyW10gPSBbXTtcblxuLyoqXG4gKiBNYXJrcyBhIGJsb2NrIG9mIHRleHQgYXMgdHJhbnNsYXRhYmxlLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgYGkxOG5TdGFydGAgYW5kIGBpMThuRW5kYCBtYXJrIHRoZSB0cmFuc2xhdGlvbiBibG9jayBpbiB0aGUgdGVtcGxhdGUuXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIGlzIHRoZSB2YWx1ZSB3aGljaCBpcyBsb2NhbGUgc3BlY2lmaWMuIFRoZSB0cmFuc2xhdGlvbiBzdHJpbmcgbWF5XG4gKiBjb250YWluIHBsYWNlaG9sZGVycyB3aGljaCBhc3NvY2lhdGUgaW5uZXIgZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMgd2l0aGluIHRoZSB0cmFuc2xhdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIHBsYWNlaG9sZGVycyBhcmU6XG4gKiAtIGDvv717aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpCaW5kaW5nIFBsYWNlaG9sZGVyKjogTWFya3MgYSBsb2NhdGlvbiB3aGVyZSBhbiBleHByZXNzaW9uIHdpbGwgYmVcbiAqICAgaW50ZXJwb2xhdGVkIGludG8uIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZXhwcmVzc2lvbiBiaW5kaW5nIGluZGV4LiBBbiBvcHRpb25hbFxuICogICBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSN7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8je2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqRWxlbWVudCBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGUgYmVnaW5uaW5nXG4gKiAgIGFuZCBlbmQgb2YgRE9NIGVsZW1lbnQgdGhhdCB3ZXJlIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay4gVGhlIHBsYWNlaG9sZGVyXG4gKiAgIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LiBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXRcbiAqICAgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSp7aW5kZXh9OntibG9ja33vv71gL2Dvv70vKntpbmRleH06e2Jsb2Nrfe+/vWA6ICpTdWItdGVtcGxhdGUgUGxhY2Vob2xkZXIqOiBTdWItdGVtcGxhdGVzIG11c3QgYmVcbiAqICAgc3BsaXQgdXAgYW5kIHRyYW5zbGF0ZWQgc2VwYXJhdGVseSBpbiBlYWNoIGFuZ3VsYXIgdGVtcGxhdGUgZnVuY3Rpb24uIFRoZSBgaW5kZXhgIHBvaW50cyB0byB0aGVcbiAqICAgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbiBpbmRleC4gQSBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggb2YgdGhlIHRyYW5zbGF0aW9uIGluIHRoZSBzdGF0aWMgYmxvY2suXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgdHJhbnNsYXRpb24gbWVzc2FnZS5cbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IE9wdGlvbmFsIHN1Yi10ZW1wbGF0ZSBpbmRleCBpbiB0aGUgYG1lc3NhZ2VgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4blN0YXJ0KGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5JbmRleFN0YWNrWysraTE4bkluZGV4U3RhY2tQb2ludGVyXSA9IGluZGV4O1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgaTE4blN0YXJ0Rmlyc3RQYXNzKHRWaWV3LCBpbmRleCwgbWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIH1cbn1cblxuLy8gQ291bnQgZm9yIHRoZSBudW1iZXIgb2YgdmFycyB0aGF0IHdpbGwgYmUgYWxsb2NhdGVkIGZvciBlYWNoIGkxOG4gYmxvY2suXG4vLyBJdCBpcyBnbG9iYWwgYmVjYXVzZSB0aGlzIGlzIHVzZWQgaW4gbXVsdGlwbGUgZnVuY3Rpb25zIHRoYXQgaW5jbHVkZSBsb29wcyBhbmQgcmVjdXJzaXZlIGNhbGxzLlxuLy8gVGhpcyBpcyByZXNldCB0byAwIHdoZW4gYGkxOG5TdGFydEZpcnN0UGFzc2AgaXMgY2FsbGVkLlxubGV0IGkxOG5WYXJzQ291bnQ6IG51bWJlcjtcblxuLyoqXG4gKiBTZWUgYGkxOG5TdGFydGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5TdGFydEZpcnN0UGFzcyhcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcikge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSB0Vmlldy5ibHVlcHJpbnQubGVuZ3RoIC0gSEVBREVSX09GRlNFVDtcbiAgaTE4blZhcnNDb3VudCA9IDA7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldElzUGFyZW50KCkgPyBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICBsZXQgcGFyZW50SW5kZXggPVxuICAgICAgcGFyZW50VE5vZGUgJiYgcGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW1RfSE9TVF0gPyBwYXJlbnRUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQgOiBpbmRleDtcbiAgbGV0IHBhcmVudEluZGV4UG9pbnRlciA9IDA7XG4gIHBhcmVudEluZGV4U3RhY2tbcGFyZW50SW5kZXhQb2ludGVyXSA9IHBhcmVudEluZGV4O1xuICBjb25zdCBjcmVhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcyA9IFtdO1xuICAvLyBJZiB0aGUgcHJldmlvdXMgbm9kZSB3YXNuJ3QgdGhlIGRpcmVjdCBwYXJlbnQgdGhlbiB3ZSBoYXZlIGEgdHJhbnNsYXRpb24gd2l0aG91dCB0b3AgbGV2ZWxcbiAgLy8gZWxlbWVudCBhbmQgd2UgbmVlZCB0byBrZWVwIGEgcmVmZXJlbmNlIG9mIHRoZSBwcmV2aW91cyBlbGVtZW50IGlmIHRoZXJlIGlzIG9uZVxuICBpZiAoaW5kZXggPiAwICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAhPT0gcGFyZW50VE5vZGUpIHtcbiAgICAvLyBDcmVhdGUgYW4gT3BDb2RlIHRvIHNlbGVjdCB0aGUgcHJldmlvdXMgVE5vZGVcbiAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0KTtcbiAgfVxuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBjb25zdCBpY3VFeHByZXNzaW9uczogVEljdVtdID0gW107XG5cbiAgY29uc3QgdGVtcGxhdGVUcmFuc2xhdGlvbiA9IGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIGNvbnN0IG1zZ1BhcnRzID0gdGVtcGxhdGVUcmFuc2xhdGlvbi5zcGxpdChQSF9SRUdFWFApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHZhbHVlID0gbXNnUGFydHNbaV07XG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzIChlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcylcbiAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgICAvLyBJdCBpcyBhIGNsb3NpbmcgdGFnXG4gICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMSkgPT09ICcjJykge1xuICAgICAgICAgIGNvbnN0IHBoSW5kZXggPSBwYXJzZUludCh2YWx1ZS5zdWJzdHIoMiksIDEwKTtcbiAgICAgICAgICBwYXJlbnRJbmRleCA9IHBhcmVudEluZGV4U3RhY2tbLS1wYXJlbnRJbmRleFBvaW50ZXJdO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigxKSwgMTApO1xuICAgICAgICAvLyBUaGUgdmFsdWUgcmVwcmVzZW50cyBhIHBsYWNlaG9sZGVyIHRoYXQgd2UgbW92ZSB0byB0aGUgZGVzaWduYXRlZCBpbmRleFxuICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICBwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QsXG4gICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMCkgPT09ICcjJykge1xuICAgICAgICAgIHBhcmVudEluZGV4U3RhY2tbKytwYXJlbnRJbmRleFBvaW50ZXJdID0gcGFyZW50SW5kZXggPSBwaEluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzICYgSUNVIGV4cHJlc3Npb25zKVxuICAgICAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHModmFsdWUpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBjb25zdCBpY3VOb2RlSW5kZXggPSBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5nRGV2TW9kZSA/IGBJQ1UgJHtpY3VOb2RlSW5kZXh9YCA6ICcnLCBpY3VOb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgY29kZXMgZm9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdUV4cHJlc3Npb24gPSBwYXJ0c1tqXSBhcyBJY3VFeHByZXNzaW9uO1xuICAgICAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uKTtcbiAgICAgICAgICBpY3VTdGFydChpY3VFeHByZXNzaW9ucywgaWN1RXhwcmVzc2lvbiwgaWN1Tm9kZUluZGV4LCBpY3VOb2RlSW5kZXgpO1xuICAgICAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgICAgICBjb25zdCB0SWN1SW5kZXggPSBpY3VFeHByZXNzaW9ucy5sZW5ndGggLSAxO1xuICAgICAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgMyBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIC0xIC0gaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyxcbiAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2gsIHRJY3VJbmRleCxcbiAgICAgICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSwgdEljdUluZGV4KTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tqXSAhPT0gJycpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gcGFydHNbal0gYXMgc3RyaW5nO1xuICAgICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB0ZXh0Lm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAvLyBDcmVhdGUgdGV4dCBub2Rlc1xuICAgICAgICAgIGNvbnN0IHRleHROb2RlSW5kZXggPSBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBiaW5kaW5nLCB0aGUgdmFsdWUgd2lsbCBiZSBzZXQgZHVyaW5nIHVwZGF0ZVxuICAgICAgICAgICAgICBoYXNCaW5kaW5nID8gJycgOiB0ZXh0LCB0ZXh0Tm9kZUluZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh0ZXh0LCB0ZXh0Tm9kZUluZGV4KSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYWxsb2NFeHBhbmRvKHZpZXdEYXRhLCBpMThuVmFyc0NvdW50KTtcblxuICAvLyBOT1RFOiBsb2NhbCB2YXIgbmVlZGVkIHRvIHByb3Blcmx5IGFzc2VydCB0aGUgdHlwZSBvZiBgVEkxOG5gLlxuICBjb25zdCB0STE4bjogVEkxOG4gPSB7XG4gICAgdmFyczogaTE4blZhcnNDb3VudCxcbiAgICBjcmVhdGU6IGNyZWF0ZU9wQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVPcENvZGVzLFxuICAgIGljdXM6IGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCxcbiAgfTtcbiAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdEkxOG47XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEkxOG5Ob2RlKHROb2RlOiBUTm9kZSwgcGFyZW50VE5vZGU6IFROb2RlLCBwcmV2aW91c1ROb2RlOiBUTm9kZSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICBjb25zdCBuZXh0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgaWYgKCFwcmV2aW91c1ROb2RlKSB7XG4gICAgcHJldmlvdXNUTm9kZSA9IHBhcmVudFROb2RlO1xuICB9XG5cbiAgLy8gUmUtb3JnYW5pemUgbm9kZSB0cmVlIHRvIHB1dCB0aGlzIG5vZGUgaW4gdGhlIGNvcnJlY3QgcG9zaXRpb24uXG4gIGlmIChwcmV2aW91c1ROb2RlID09PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcGFyZW50VE5vZGUuY2hpbGQpIHtcbiAgICB0Tm9kZS5uZXh0ID0gcGFyZW50VE5vZGUuY2hpbGQ7XG4gICAgcGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgfSBlbHNlIGlmIChwcmV2aW91c1ROb2RlICE9PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcHJldmlvdXNUTm9kZS5uZXh0KSB7XG4gICAgdE5vZGUubmV4dCA9IHByZXZpb3VzVE5vZGUubmV4dDtcbiAgICBwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICB0Tm9kZS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIGlmIChwYXJlbnRUTm9kZSAhPT0gdmlld0RhdGFbVF9IT1NUXSkge1xuICAgIHROb2RlLnBhcmVudCA9IHBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgfVxuXG4gIC8vIElmIHROb2RlIHdhcyBtb3ZlZCBhcm91bmQsIHdlIG1pZ2h0IG5lZWQgdG8gZml4IGEgYnJva2VuIGxpbmsuXG4gIGxldCBjdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZS5uZXh0O1xuICB3aGlsZSAoY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvci5uZXh0ID09PSB0Tm9kZSkge1xuICAgICAgY3Vyc29yLm5leHQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gICAgY3Vyc29yID0gY3Vyc29yLm5leHQ7XG4gIH1cblxuICBhcHBlbmRDaGlsZChnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3RGF0YSksIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gdmlld0RhdGFbdE5vZGUuaW5kZXhdO1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIE5vZGVzIHRoYXQgaW5qZWN0IFZpZXdDb250YWluZXJSZWYgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gICAgYXBwZW5kQ2hpbGQoc2xvdFZhbHVlW05BVElWRV0sIHROb2RlLCB2aWV3RGF0YSk7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGZvciBpbnRlcm5hdGlvbmFsaXphdGlvbi5cbiAqXG4gKiBIYW5kbGVzIG1lc3NhZ2Ugc3RyaW5nIHBvc3QtcHJvY2Vzc2luZyBieSB0cmFuc2Zvcm1pbmcgaXQgZnJvbSBpbnRlcm1lZGlhdGVcbiAqIGZvcm1hdCAodGhhdCBtaWdodCBjb250YWluIHNvbWUgbWFya2VycyB0aGF0IHdlIG5lZWQgdG8gcmVwbGFjZSkgdG8gdGhlIGZpbmFsXG4gKiBmb3JtLCBjb25zdW1hYmxlIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvbi4gUG9zdCBwcm9jZXNzaW5nIHN0ZXBzIGluY2x1ZGU6XG4gKlxuICogMS4gUmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgY2FzZXMgKGxpa2UgW++/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71877+9Ne+/vV0pXG4gKiAyLiBSZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAqIDMuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBwdWJsaWNBUElcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5Qb3N0cHJvY2VzcyhcbiAgICBtZXNzYWdlOiBzdHJpbmcsIHJlcGxhY2VtZW50czoge1trZXk6IHN0cmluZ106IChzdHJpbmcgfCBzdHJpbmdbXSl9ID0ge30pOiBzdHJpbmcge1xuICAvKipcbiAgICogU3RlcCAxOiByZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBwbGFjZWhvbGRlcnMgbGlrZSBb77+9IzXvv71877+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vV1cbiAgICpcbiAgICogTm90ZTogZHVlIHRvIHRoZSB3YXkgd2UgcHJvY2VzcyBuZXN0ZWQgdGVtcGxhdGVzIChCRlMpLCBtdWx0aS12YWx1ZSBwbGFjZWhvbGRlcnMgYXJlIHR5cGljYWxseVxuICAgKiBncm91cGVkIGJ5IHRlbXBsYXRlcywgZm9yIGV4YW1wbGU6IFvvv70jNe+/vXzvv70jNu+/vXzvv70jMTox77+9fO+/vSMzOjLvv71dIHdoZXJlIO+/vSM177+9IGFuZCDvv70jNu+/vSBiZWxvbmcgdG8gcm9vdFxuICAgKiB0ZW1wbGF0ZSwg77+9IzE6Me+/vSBiZWxvbmcgdG8gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXggMSBhbmQg77+9IzE6Mu+/vSAtIG5lc3RlZCB0ZW1wbGF0ZSB3aXRoIGluZGV4XG4gICAqIDMuIEhvd2V2ZXIgaW4gcmVhbCB0ZW1wbGF0ZXMgdGhlIG9yZGVyIG1pZ2h0IGJlIGRpZmZlcmVudDogaS5lLiDvv70jMTox77+9IGFuZC9vciDvv70jMzoy77+9IG1heSBnbyBpblxuICAgKiBmcm9udCBvZiDvv70jNu+/vS4gVGhlIHBvc3QgcHJvY2Vzc2luZyBzdGVwIHJlc3RvcmVzIHRoZSByaWdodCBvcmRlciBieSBrZWVwaW5nIHRyYWNrIG9mIHRoZVxuICAgKiB0ZW1wbGF0ZSBpZCBzdGFjayBhbmQgbG9va3MgZm9yIHBsYWNlaG9sZGVycyB0aGF0IGJlbG9uZyB0byB0aGUgY3VycmVudGx5IGFjdGl2ZSB0ZW1wbGF0ZS5cbiAgICovXG4gIGxldCByZXN1bHQ6IHN0cmluZyA9IG1lc3NhZ2U7XG4gIGlmIChQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQLnRlc3QobWVzc2FnZSkpIHtcbiAgICBjb25zdCBtYXRjaGVzOiB7W2tleTogc3RyaW5nXTogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdfSA9IHt9O1xuICAgIGNvbnN0IHRlbXBsYXRlSWRzU3RhY2s6IG51bWJlcltdID0gW1JPT1RfVEVNUExBVEVfSURdO1xuICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX1BMQUNFSE9MREVSU19SRUdFWFAsIChtOiBhbnksIHBoczogc3RyaW5nLCB0bXBsOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IHBocyB8fCB0bXBsO1xuICAgICAgaWYgKCFtYXRjaGVzW2NvbnRlbnRdKSB7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdID0gW107XG4gICAgICAgIGNvbnRlbnQuc3BsaXQoJ3wnKS5mb3JFYWNoKChwbGFjZWhvbGRlcjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBwbGFjZWhvbGRlci5tYXRjaChQUF9URU1QTEFURV9JRF9SRUdFWFApO1xuICAgICAgICAgIGNvbnN0IHRlbXBsYXRlSWQgPSBtYXRjaCA/IHBhcnNlSW50KG1hdGNoWzFdLCAxMCkgOiBST09UX1RFTVBMQVRFX0lEO1xuICAgICAgICAgIGNvbnN0IGlzQ2xvc2VUZW1wbGF0ZVRhZyA9IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUC50ZXN0KHBsYWNlaG9sZGVyKTtcbiAgICAgICAgICBwbGFjZWhvbGRlcnMucHVzaChbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0pO1xuICAgICAgICB9KTtcbiAgICAgICAgbWF0Y2hlc1tjb250ZW50XSA9IHBsYWNlaG9sZGVycztcbiAgICAgIH1cbiAgICAgIGlmICghbWF0Y2hlc1tjb250ZW50XS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgcGxhY2Vob2xkZXIgLSAke2NvbnRlbnR9YCk7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50VGVtcGxhdGVJZCA9IHRlbXBsYXRlSWRzU3RhY2tbdGVtcGxhdGVJZHNTdGFjay5sZW5ndGggLSAxXTtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVycyA9IG1hdGNoZXNbY29udGVudF07XG4gICAgICBsZXQgaWR4ID0gMDtcbiAgICAgIC8vIGZpbmQgcGxhY2Vob2xkZXIgaW5kZXggdGhhdCBtYXRjaGVzIGN1cnJlbnQgdGVtcGxhdGUgaWRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhY2Vob2xkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwbGFjZWhvbGRlcnNbaV1bMF0gPT09IGN1cnJlbnRUZW1wbGF0ZUlkKSB7XG4gICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIHRlbXBsYXRlIGlkIHN0YWNrIGJhc2VkIG9uIHRoZSBjdXJyZW50IHRhZyBleHRyYWN0ZWRcbiAgICAgIGNvbnN0IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSA9IHBsYWNlaG9sZGVyc1tpZHhdO1xuICAgICAgaWYgKGlzQ2xvc2VUZW1wbGF0ZVRhZykge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGVtcGxhdGVJZCAhPT0gdGVtcGxhdGVJZCkge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnB1c2godGVtcGxhdGVJZCk7XG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgcHJvY2Vzc2VkIHRhZyBmcm9tIHRoZSBsaXN0XG4gICAgICBwbGFjZWhvbGRlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfSk7XG5cbiAgICAvLyB2ZXJpZnkgdGhhdCB3ZSBpbmplY3RlZCBhbGwgdmFsdWVzXG4gICAgY29uc3QgaGFzVW5tYXRjaGVkVmFsdWVzID0gT2JqZWN0LmtleXMobWF0Y2hlcykuc29tZShrZXkgPT4gISFtYXRjaGVzW2tleV0ubGVuZ3RoKTtcbiAgICBpZiAoaGFzVW5tYXRjaGVkVmFsdWVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCB2YWx1ZXMgLSAke0pTT04uc3RyaW5naWZ5KG1hdGNoZXMpfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiBjdXJyZW50IHJlc3VsdCBpZiBubyByZXBsYWNlbWVudHMgc3BlY2lmaWVkXG4gIGlmICghT2JqZWN0LmtleXMocmVwbGFjZW1lbnRzKS5sZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0ZXAgMjogcmVwbGFjZSBhbGwgSUNVIHZhcnMgKGxpa2UgXCJWQVJfUExVUkFMXCIpXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VfVkFSU19SRUdFWFAsIChtYXRjaCwgc3RhcnQsIGtleSwgX3R5cGUsIF9pZHgsIGVuZCk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gYCR7c3RhcnR9JHtyZXBsYWNlbWVudHNba2V5XX0ke2VuZH1gIDogbWF0Y2g7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTdGVwIDM6IHJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSkgaW4gY2FzZVxuICAgKiBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVU19SRUdFWFAsIChtYXRjaCwga2V5KTogc3RyaW5nID0+IHtcbiAgICBpZiAocmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnN0IGxpc3QgPSByZXBsYWNlbWVudHNba2V5XSBhcyBzdHJpbmdbXTtcbiAgICAgIGlmICghbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgSUNVIC0gJHttYXRjaH0gd2l0aCBrZXk6ICR7a2V5fWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxpc3Quc2hpZnQoKSAhO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG1hcmtlZCBieSBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgLiBJdCBpbnNlcnRzIHRoZSB0ZXh0L0lDVSBub2Rlc1xuICogaW50byB0aGUgcmVuZGVyIHRyZWUsIG1vdmVzIHRoZSBwbGFjZWhvbGRlciBub2RlcyBhbmQgcmVtb3ZlcyB0aGUgZGVsZXRlZCBub2Rlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FbmQoKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkVuZEZpcnN0UGFzcyh0Vmlldyk7XG59XG5cbmZ1bmN0aW9uIGZpbmRMYXN0Tm9kZShub2RlOiBUTm9kZSk6IFROb2RlIHtcbiAgd2hpbGUgKG5vZGUubmV4dCkge1xuICAgIG5vZGUgPSBub2RlLm5leHQ7XG4gIH1cbiAgaWYgKG5vZGUuY2hpbGQpIHtcbiAgICByZXR1cm4gZmluZExhc3ROb2RlKG5vZGUuY2hpbGQpO1xuICB9XG4gIHJldHVybiBub2RlO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkVuZGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5FbmRGaXJzdFBhc3ModFZpZXc6IFRWaWV3KSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2aWV3RGF0YVtUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2kxOG5FbmQgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcblxuICBjb25zdCByb290SW5kZXggPSBpMThuSW5kZXhTdGFja1tpMThuSW5kZXhTdGFja1BvaW50ZXItLV07XG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtyb290SW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUSTE4bjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEkxOG4sIGBZb3Ugc2hvdWxkIGNhbGwgaTE4blN0YXJ0IGJlZm9yZSBpMThuRW5kYCk7XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBub2RlIHRoYXQgd2FzIGFkZGVkIGJlZm9yZSBgaTE4bkVuZGBcbiAgbGV0IGxhc3RDcmVhdGVkTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAobGFzdENyZWF0ZWROb2RlLmNoaWxkKSB7XG4gICAgbGFzdENyZWF0ZWROb2RlID0gZmluZExhc3ROb2RlKGxhc3RDcmVhdGVkTm9kZS5jaGlsZCk7XG4gIH1cblxuICBjb25zdCB2aXNpdGVkTm9kZXMgPSByZWFkQ3JlYXRlT3BDb2Rlcyhyb290SW5kZXgsIHRJMThuLmNyZWF0ZSwgdEkxOG4uaWN1cywgdmlld0RhdGEpO1xuXG4gIC8vIFJlbW92ZSBkZWxldGVkIG5vZGVzXG4gIGZvciAobGV0IGkgPSByb290SW5kZXggKyAxOyBpIDw9IGxhc3RDcmVhdGVkTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7IGkrKykge1xuICAgIGlmICh2aXNpdGVkTm9kZXMuaW5kZXhPZihpKSA9PT0gLTEpIHtcbiAgICAgIHJlbW92ZU5vZGUoaSwgdmlld0RhdGEpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHN0b3JlcyB0aGUgZHluYW1pYyBUTm9kZSwgYW5kIHVuaG9va3MgaXQgZnJvbSB0aGUgdHJlZSBmb3Igbm93LlxuICovXG5mdW5jdGlvbiBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwpOiBURWxlbWVudE5vZGV8VEljdUNvbnRhaW5lck5vZGUge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgdHlwZSBhcyBhbnksIG5hdGl2ZSwgbmFtZSwgbnVsbCk7XG5cbiAgLy8gV2UgYXJlIGNyZWF0aW5nIGEgZHluYW1pYyBub2RlLCB0aGUgcHJldmlvdXMgdE5vZGUgbWlnaHQgbm90IGJlIHBvaW50aW5nIGF0IHRoaXMgbm9kZS5cbiAgLy8gV2Ugd2lsbCBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlIGxhdGVyIHdpdGggYGFwcGVuZEkxOG5Ob2RlYC5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID09PSB0Tm9kZSkge1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZnVuY3Rpb24gcmVhZENyZWF0ZU9wQ29kZXMoXG4gICAgaW5kZXg6IG51bWJlciwgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsXG4gICAgdmlld0RhdGE6IExWaWV3KTogbnVtYmVyW10ge1xuICBjb25zdCByZW5kZXJlciA9IGdldExWaWV3KClbUkVOREVSRVJdO1xuICBsZXQgY3VycmVudFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgbGV0IHByZXZpb3VzVE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBjb25zdCB2aXNpdGVkTm9kZXM6IG51bWJlcltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY3JlYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG9wQ29kZSA9IGNyZWF0ZU9wQ29kZXNbaV07XG4gICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHRleHRSTm9kZSA9IGNyZWF0ZVRleHROb2RlKG9wQ29kZSwgcmVuZGVyZXIpO1xuICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgodGV4dE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCk7XG4gICAgICB2aXNpdGVkTm9kZXMucHVzaCh0ZXh0Tm9kZUluZGV4KTtcbiAgICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvblROb2RlOiBUTm9kZTtcbiAgICAgICAgICBpZiAoZGVzdGluYXRpb25Ob2RlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGVzdGluYXRpb24gbm9kZSBpcyBgaTE4blN0YXJ0YCwgd2UgZG9uJ3QgaGF2ZSBhXG4gICAgICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZSBhbmQgd2Ugc2hvdWxkIHVzZSB0aGUgaG9zdCBub2RlIGluc3RlYWRcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSB2aWV3RGF0YVtUX0hPU1RdICE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBnZXRUTm9kZShkZXN0aW5hdGlvbk5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRUTm9kZSAhLFxuICAgICAgICAgICAgICAgICAgYFlvdSBuZWVkIHRvIGNyZWF0ZSBvciBzZWxlY3QgYSBub2RlIGJlZm9yZSB5b3UgY2FuIGluc2VydCBpdCBpbnRvIHRoZSBET01gKTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gYXBwZW5kSTE4bk5vZGUoY3VycmVudFROb2RlICEsIGRlc3RpbmF0aW9uVE5vZGUsIHByZXZpb3VzVE5vZGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2gobm9kZUluZGV4KTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIGlmIChjdXJyZW50VE5vZGUpIHtcbiAgICAgICAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShjdXJyZW50VE5vZGUpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgICAgICAgICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShjdXJyZW50VE5vZGUpO1xuICAgICAgICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgY29uc3QgZWxlbWVudE5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZShlbGVtZW50Tm9kZUluZGV4LCBhdHRyTmFtZSwgYXR0clZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICBjYXNlIENPTU1FTlRfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IGNvbW1lbnRWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgY29tbWVudE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGNvbW1lbnRWYWx1ZSwgJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBgRXhwZWN0ZWQgXCIke2NvbW1lbnRWYWx1ZX1cIiB0byBiZSBhIGNvbW1lbnQgbm9kZSB2YWx1ZWApO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnRSTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQoY29tbWVudFZhbHVlKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgICAgICAgICAgICBjb21tZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBjb21tZW50Uk5vZGUsIG51bGwpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb21tZW50Uk5vZGUsIHZpZXdEYXRhKTtcbiAgICAgICAgICAoY3VycmVudFROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlKS5hY3RpdmVDYXNlSW5kZXggPSBudWxsO1xuICAgICAgICAgIC8vIFdlIHdpbGwgYWRkIHRoZSBjYXNlIG5vZGVzIGxhdGVyLCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZVxuICAgICAgICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIGVsZW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBlbGVtZW50Uk5vZGUsIHRhZ05hbWVWYWx1ZSk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goZWxlbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRJc1BhcmVudChmYWxzZSk7XG5cbiAgcmV0dXJuIHZpc2l0ZWROb2Rlcztcbn1cblxuZnVuY3Rpb24gcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNoYW5nZU1hc2s6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBieXBhc3NDaGVja0JpdCA9IGZhbHNlKSB7XG4gIGxldCBjYXNlQ3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVwZGF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgY29uc3QgY2hlY2tCaXQgPSB1cGRhdGVPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgIGNvbnN0IHNraXBDb2RlcyA9IHVwZGF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgaWYgKGJ5cGFzc0NoZWNrQml0IHx8IChjaGVja0JpdCAmIGNoYW5nZU1hc2spKSB7XG4gICAgICAvLyBUaGUgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCBzaW5jZSBsYXN0IGNoZWNrZWRcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeSh2aWV3RGF0YVtiaW5kaW5nc1N0YXJ0SW5kZXggLSBvcENvZGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgbGV0IGljdVROb2RlOiBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBTYW5pdGl6ZXJGbiB8IG51bGw7XG4gICAgICAgICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZShub2RlSW5kZXgsIGF0dHJOYW1lLCB2YWx1ZSwgc2FuaXRpemVGbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHRleHRCaW5kaW5nKG5vZGVJbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGljdVROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gYWN0aXZlIGNhc2UsIGRlbGV0ZSB0aGUgb2xkIG5vZGVzXG4gICAgICAgICAgICAgICAgaWYgKGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlQ29kZXMgPSB0SWN1LnJlbW92ZVtpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmVDb2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVPcENvZGUgPSByZW1vdmVDb2Rlc1trXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVtb3ZlT3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmU6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3U6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUNvZGVzW2sgKyAxXSBhcyBudW1iZXIgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VE5vZGUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5lc3RlZEljdU5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSBuZXN0ZWRJY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VEluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkVEljdSA9IGljdXMgIVtuZXN0ZWRJY3VUSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KG5lc3RlZFRJY3UucmVtb3ZlW2FjdGl2ZUluZGV4XSwgcmVtb3ZlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGFjdGl2ZSBjYXNlSW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICAgICAgICAgICAgcmVhZENyZWF0ZU9wQ29kZXMoLTEsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIGljdXMsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgdEljdS51cGRhdGVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICFdLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssXG4gICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhLCBjYXNlQ3JlYXRlZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KSB7XG4gIGNvbnN0IHJlbW92ZWRQaFROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIHZpZXdEYXRhKTtcbiAgY29uc3QgcmVtb3ZlZFBoUk5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSk7XG4gIGlmIChyZW1vdmVkUGhSTm9kZSkge1xuICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCByZW1vdmVkUGhSTm9kZSk7XG4gIH1cblxuICBjb25zdCBzbG90VmFsdWUgPSBsb2FkKGluZGV4KSBhcyBSRWxlbWVudCB8IFJDb21tZW50IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0O1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gc2xvdFZhbHVlIGFzIExDb250YWluZXI7XG4gICAgaWYgKHJlbW92ZWRQaFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG59XG5cbi8qKlxuICpcbiAqIFVzZSB0aGlzIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRyYW5zbGF0aW9uIGJsb2NrIHRoYXQgZG9lc24ndCBjb250YWluIGFueSBwbGFjZWhvbGRlci5cbiAqIEl0IGNhbGxzIGJvdGgge0BsaW5rIGkxOG5TdGFydH0gYW5kIHtAbGluayBpMThuRW5kfSBpbiBvbmUgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG4oaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGkxOG5TdGFydChpbmRleCwgbWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIGkxOG5FbmQoKTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IGluIHRoZSBzdGF0aWMgYmxvY2tcbiAqIEBwYXJhbSB2YWx1ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXcsIGluZGV4LCB2YWx1ZXMpO1xuICB9XG59XG5cbi8qKlxuICogU2VlIGBpMThuQXR0cmlidXRlc2AgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50SW5kZXggPSBwcmV2aW91c0VsZW1lbnQuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWVzW2ldO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB2YWx1ZXNbaSArIDFdO1xuICAgIGNvbnN0IHBhcnRzID0gbWVzc2FnZS5zcGxpdChJQ1VfUkVHRVhQKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcnRzW2pdO1xuXG4gICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXNcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09ICcnKSB7XG4gICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISF2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgcHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lKSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZShwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHVwZGF0ZU9wQ29kZXM7XG59XG5cbmxldCBjaGFuZ2VNYXNrID0gMGIwO1xubGV0IHNoaWZ0c0NvdW50ZXIgPSAwO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgdmFsdWVzIG9mIHRoZSBiaW5kaW5ncyBkdXJpbmcgZWFjaCB1cGRhdGUgY3ljbGUgaW4gb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG9cbiAqIHVwZGF0ZSB0aGUgdHJhbnNsYXRlZCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gZXhwcmVzc2lvbiBUaGUgYmluZGluZydzIG5ldyB2YWx1ZSBvciBOT19DSEFOR0VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FeHA8VD4oZXhwcmVzc2lvbjogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAoZXhwcmVzc2lvbiAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkFwcGx5KGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHNoaWZ0c0NvdW50ZXIpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICAgIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdO1xuICAgIGxldCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcztcbiAgICBsZXQgaWN1czogVEljdVtdfG51bGwgPSBudWxsO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRJMThuKSkge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9IHRJMThuIGFzIEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gKHRJMThuIGFzIFRJMThuKS51cGRhdGU7XG4gICAgICBpY3VzID0gKHRJMThuIGFzIFRJMThuKS5pY3VzO1xuICAgIH1cbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSAtIHNoaWZ0c0NvdW50ZXIgLSAxO1xuICAgIHJlYWRVcGRhdGVPcENvZGVzKHVwZGF0ZU9wQ29kZXMsIGljdXMsIGJpbmRpbmdzU3RhcnRJbmRleCwgY2hhbmdlTWFzaywgbFZpZXcpO1xuXG4gICAgLy8gUmVzZXQgY2hhbmdlTWFzayAmIG1hc2tCaXQgdG8gZGVmYXVsdCBmb3IgdGhlIG5leHQgdXBkYXRlIGN5Y2xlXG4gICAgY2hhbmdlTWFzayA9IDBiMDtcbiAgICBzaGlmdHNDb3VudGVyID0gMDtcbiAgfVxufVxuXG5lbnVtIFBsdXJhbCB7XG4gIFplcm8gPSAwLFxuICBPbmUgPSAxLFxuICBUd28gPSAyLFxuICBGZXcgPSAzLFxuICBNYW55ID0gNCxcbiAgT3RoZXIgPSA1LFxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHBsdXJhbCBjYXNlIGJhc2VkIG9uIHRoZSBsb2NhbGUuXG4gKiBUaGlzIGlzIGEgY29weSBvZiB0aGUgZGVwcmVjYXRlZCBmdW5jdGlvbiB0aGF0IHdlIHVzZWQgaW4gQW5ndWxhciB2NC5cbiAqIC8vIFRPRE8ob2NvbWJlKTogcmVtb3ZlIHRoaXMgb25jZSB3ZSBjYW4gdGhlIHJlYWwgZ2V0UGx1cmFsQ2FzZSBmdW5jdGlvblxuICpcbiAqIEBkZXByZWNhdGVkIGZyb20gdjUgdGhlIHBsdXJhbCBjYXNlIGZ1bmN0aW9uIGlzIGluIGxvY2FsZSBkYXRhIGZpbGVzIGNvbW1vbi9sb2NhbGVzLyoudHNcbiAqL1xuZnVuY3Rpb24gZ2V0UGx1cmFsQ2FzZShsb2NhbGU6IHN0cmluZywgbkxpa2U6IG51bWJlciB8IHN0cmluZyk6IFBsdXJhbCB7XG4gIGlmICh0eXBlb2Ygbkxpa2UgPT09ICdzdHJpbmcnKSB7XG4gICAgbkxpa2UgPSBwYXJzZUludCg8c3RyaW5nPm5MaWtlLCAxMCk7XG4gIH1cbiAgY29uc3QgbjogbnVtYmVyID0gbkxpa2UgYXMgbnVtYmVyO1xuICBjb25zdCBuRGVjaW1hbCA9IG4udG9TdHJpbmcoKS5yZXBsYWNlKC9eW14uXSpcXC4/LywgJycpO1xuICBjb25zdCBpID0gTWF0aC5mbG9vcihNYXRoLmFicyhuKSk7XG4gIGNvbnN0IHYgPSBuRGVjaW1hbC5sZW5ndGg7XG4gIGNvbnN0IGYgPSBwYXJzZUludChuRGVjaW1hbCwgMTApO1xuICBjb25zdCB0ID0gcGFyc2VJbnQobi50b1N0cmluZygpLnJlcGxhY2UoL15bXi5dKlxcLj98MCskL2csICcnKSwgMTApIHx8IDA7XG5cbiAgY29uc3QgbGFuZyA9IGxvY2FsZS5zcGxpdCgnLScpWzBdLnRvTG93ZXJDYXNlKCk7XG5cbiAgc3dpdGNoIChsYW5nKSB7XG4gICAgY2FzZSAnYWYnOlxuICAgIGNhc2UgJ2FzYSc6XG4gICAgY2FzZSAnYXonOlxuICAgIGNhc2UgJ2JlbSc6XG4gICAgY2FzZSAnYmV6JzpcbiAgICBjYXNlICdiZyc6XG4gICAgY2FzZSAnYnJ4JzpcbiAgICBjYXNlICdjZSc6XG4gICAgY2FzZSAnY2dnJzpcbiAgICBjYXNlICdjaHInOlxuICAgIGNhc2UgJ2NrYic6XG4gICAgY2FzZSAnZWUnOlxuICAgIGNhc2UgJ2VsJzpcbiAgICBjYXNlICdlbyc6XG4gICAgY2FzZSAnZXMnOlxuICAgIGNhc2UgJ2V1JzpcbiAgICBjYXNlICdmbyc6XG4gICAgY2FzZSAnZnVyJzpcbiAgICBjYXNlICdnc3cnOlxuICAgIGNhc2UgJ2hhJzpcbiAgICBjYXNlICdoYXcnOlxuICAgIGNhc2UgJ2h1JzpcbiAgICBjYXNlICdqZ28nOlxuICAgIGNhc2UgJ2ptYyc6XG4gICAgY2FzZSAna2EnOlxuICAgIGNhc2UgJ2trJzpcbiAgICBjYXNlICdra2onOlxuICAgIGNhc2UgJ2tsJzpcbiAgICBjYXNlICdrcyc6XG4gICAgY2FzZSAna3NiJzpcbiAgICBjYXNlICdreSc6XG4gICAgY2FzZSAnbGInOlxuICAgIGNhc2UgJ2xnJzpcbiAgICBjYXNlICdtYXMnOlxuICAgIGNhc2UgJ21nbyc6XG4gICAgY2FzZSAnbWwnOlxuICAgIGNhc2UgJ21uJzpcbiAgICBjYXNlICduYic6XG4gICAgY2FzZSAnbmQnOlxuICAgIGNhc2UgJ25lJzpcbiAgICBjYXNlICdubic6XG4gICAgY2FzZSAnbm5oJzpcbiAgICBjYXNlICdueW4nOlxuICAgIGNhc2UgJ29tJzpcbiAgICBjYXNlICdvcic6XG4gICAgY2FzZSAnb3MnOlxuICAgIGNhc2UgJ3BzJzpcbiAgICBjYXNlICdybSc6XG4gICAgY2FzZSAncm9mJzpcbiAgICBjYXNlICdyd2snOlxuICAgIGNhc2UgJ3NhcSc6XG4gICAgY2FzZSAnc2VoJzpcbiAgICBjYXNlICdzbic6XG4gICAgY2FzZSAnc28nOlxuICAgIGNhc2UgJ3NxJzpcbiAgICBjYXNlICd0YSc6XG4gICAgY2FzZSAndGUnOlxuICAgIGNhc2UgJ3Rlbyc6XG4gICAgY2FzZSAndGsnOlxuICAgIGNhc2UgJ3RyJzpcbiAgICBjYXNlICd1Zyc6XG4gICAgY2FzZSAndXonOlxuICAgIGNhc2UgJ3ZvJzpcbiAgICBjYXNlICd2dW4nOlxuICAgIGNhc2UgJ3dhZSc6XG4gICAgY2FzZSAneG9nJzpcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYWsnOlxuICAgIGNhc2UgJ2xuJzpcbiAgICBjYXNlICdtZyc6XG4gICAgY2FzZSAncGEnOlxuICAgIGNhc2UgJ3RpJzpcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gMCAmJiBuIDw9IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdhbSc6XG4gICAgY2FzZSAnYXMnOlxuICAgIGNhc2UgJ2JuJzpcbiAgICBjYXNlICdmYSc6XG4gICAgY2FzZSAnZ3UnOlxuICAgIGNhc2UgJ2hpJzpcbiAgICBjYXNlICdrbic6XG4gICAgY2FzZSAnbXInOlxuICAgIGNhc2UgJ3p1JzpcbiAgICAgIGlmIChpID09PSAwIHx8IG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdhcic6XG4gICAgICBpZiAobiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5aZXJvO1xuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAzICYmIG4gJSAxMDAgPD0gMTApIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKG4gJSAxMDAgPT09IE1hdGguZmxvb3IobiAlIDEwMCkgJiYgbiAlIDEwMCA+PSAxMSAmJiBuICUgMTAwIDw9IDk5KSByZXR1cm4gUGx1cmFsLk1hbnk7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2FzdCc6XG4gICAgY2FzZSAnY2EnOlxuICAgIGNhc2UgJ2RlJzpcbiAgICBjYXNlICdlbic6XG4gICAgY2FzZSAnZXQnOlxuICAgIGNhc2UgJ2ZpJzpcbiAgICBjYXNlICdmeSc6XG4gICAgY2FzZSAnZ2wnOlxuICAgIGNhc2UgJ2l0JzpcbiAgICBjYXNlICdubCc6XG4gICAgY2FzZSAnc3YnOlxuICAgIGNhc2UgJ3N3JzpcbiAgICBjYXNlICd1cic6XG4gICAgY2FzZSAneWknOlxuICAgICAgaWYgKGkgPT09IDEgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2JlJzpcbiAgICAgIGlmIChuICUgMTAgPT09IDEgJiYgIShuICUgMTAwID09PSAxMSkpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gJSAxMCA9PT0gTWF0aC5mbG9vcihuICUgMTApICYmIG4gJSAxMCA+PSAyICYmIG4gJSAxMCA8PSA0ICYmXG4gICAgICAgICAgIShuICUgMTAwID49IDEyICYmIG4gJSAxMDAgPD0gMTQpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmIChuICUgMTAgPT09IDAgfHwgbiAlIDEwID09PSBNYXRoLmZsb29yKG4gJSAxMCkgJiYgbiAlIDEwID49IDUgJiYgbiAlIDEwIDw9IDkgfHxcbiAgICAgICAgICBuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMTEgJiYgbiAlIDEwMCA8PSAxNClcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdicic6XG4gICAgICBpZiAobiAlIDEwID09PSAxICYmICEobiAlIDEwMCA9PT0gMTEgfHwgbiAlIDEwMCA9PT0gNzEgfHwgbiAlIDEwMCA9PT0gOTEpKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuICUgMTAgPT09IDIgJiYgIShuICUgMTAwID09PSAxMiB8fCBuICUgMTAwID09PSA3MiB8fCBuICUgMTAwID09PSA5MikpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKG4gJSAxMCA9PT0gTWF0aC5mbG9vcihuICUgMTApICYmIChuICUgMTAgPj0gMyAmJiBuICUgMTAgPD0gNCB8fCBuICUgMTAgPT09IDkpICYmXG4gICAgICAgICAgIShuICUgMTAwID49IDEwICYmIG4gJSAxMDAgPD0gMTkgfHwgbiAlIDEwMCA+PSA3MCAmJiBuICUgMTAwIDw9IDc5IHx8XG4gICAgICAgICAgICBuICUgMTAwID49IDkwICYmIG4gJSAxMDAgPD0gOTkpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIGlmICghKG4gPT09IDApICYmIG4gJSAxZTYgPT09IDApIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnYnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdzcic6XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IDEgJiYgIShpICUgMTAwID09PSAxMSkgfHwgZiAlIDEwID09PSAxICYmICEoZiAlIDEwMCA9PT0gMTEpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gTWF0aC5mbG9vcihpICUgMTApICYmIGkgJSAxMCA+PSAyICYmIGkgJSAxMCA8PSA0ICYmXG4gICAgICAgICAgICAgICEoaSAlIDEwMCA+PSAxMiAmJiBpICUgMTAwIDw9IDE0KSB8fFxuICAgICAgICAgIGYgJSAxMCA9PT0gTWF0aC5mbG9vcihmICUgMTApICYmIGYgJSAxMCA+PSAyICYmIGYgJSAxMCA8PSA0ICYmXG4gICAgICAgICAgICAgICEoZiAlIDEwMCA+PSAxMiAmJiBmICUgMTAwIDw9IDE0KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2NzJzpcbiAgICBjYXNlICdzayc6XG4gICAgICBpZiAoaSA9PT0gMSAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChpID09PSBNYXRoLmZsb29yKGkpICYmIGkgPj0gMiAmJiBpIDw9IDQgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAoISh2ID09PSAwKSkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdjeSc6XG4gICAgICBpZiAobiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5aZXJvO1xuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKG4gPT09IDMpIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKG4gPT09IDYpIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZGEnOlxuICAgICAgaWYgKG4gPT09IDEgfHwgISh0ID09PSAwKSAmJiAoaSA9PT0gMCB8fCBpID09PSAxKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2RzYic6XG4gICAgY2FzZSAnaHNiJzpcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMDAgPT09IDEgfHwgZiAlIDEwMCA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAwID09PSAyIHx8IGYgJSAxMDAgPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gTWF0aC5mbG9vcihpICUgMTAwKSAmJiBpICUgMTAwID49IDMgJiYgaSAlIDEwMCA8PSA0IHx8XG4gICAgICAgICAgZiAlIDEwMCA9PT0gTWF0aC5mbG9vcihmICUgMTAwKSAmJiBmICUgMTAwID49IDMgJiYgZiAlIDEwMCA8PSA0KVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZmYnOlxuICAgIGNhc2UgJ2ZyJzpcbiAgICBjYXNlICdoeSc6XG4gICAgY2FzZSAna2FiJzpcbiAgICAgIGlmIChpID09PSAwIHx8IGkgPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdmaWwnOlxuICAgICAgaWYgKHYgPT09IDAgJiYgKGkgPT09IDEgfHwgaSA9PT0gMiB8fCBpID09PSAzKSB8fFxuICAgICAgICAgIHYgPT09IDAgJiYgIShpICUgMTAgPT09IDQgfHwgaSAlIDEwID09PSA2IHx8IGkgJSAxMCA9PT0gOSkgfHxcbiAgICAgICAgICAhKHYgPT09IDApICYmICEoZiAlIDEwID09PSA0IHx8IGYgJSAxMCA9PT0gNiB8fCBmICUgMTAgPT09IDkpKVxuICAgICAgICByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnZ2EnOlxuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSAzICYmIG4gPD0gNikgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDcgJiYgbiA8PSAxMCkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdnZCc6XG4gICAgICBpZiAobiA9PT0gMSB8fCBuID09PSAxMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gMiB8fCBuID09PSAxMikgcmV0dXJuIFBsdXJhbC5Ud287XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiAobiA+PSAzICYmIG4gPD0gMTAgfHwgbiA+PSAxMyAmJiBuIDw9IDE5KSkgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2d2JzpcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IDIpIHJldHVybiBQbHVyYWwuVHdvO1xuICAgICAgaWYgKHYgPT09IDAgJiZcbiAgICAgICAgICAoaSAlIDEwMCA9PT0gMCB8fCBpICUgMTAwID09PSAyMCB8fCBpICUgMTAwID09PSA0MCB8fCBpICUgMTAwID09PSA2MCB8fCBpICUgMTAwID09PSA4MCkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuRmV3O1xuICAgICAgaWYgKCEodiA9PT0gMCkpIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnaGUnOlxuICAgICAgaWYgKGkgPT09IDEgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAoaSA9PT0gMiAmJiB2ID09PSAwKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmICh2ID09PSAwICYmICEobiA+PSAwICYmIG4gPD0gMTApICYmIG4gJSAxMCA9PT0gMCkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdpcyc6XG4gICAgICBpZiAodCA9PT0gMCAmJiBpICUgMTAgPT09IDEgJiYgIShpICUgMTAwID09PSAxMSkgfHwgISh0ID09PSAwKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2tzaCc6XG4gICAgICBpZiAobiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5aZXJvO1xuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdrdyc6XG4gICAgY2FzZSAnbmFxJzpcbiAgICBjYXNlICdzZSc6XG4gICAgY2FzZSAnc21uJzpcbiAgICAgIGlmIChuID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnbGFnJzpcbiAgICAgIGlmIChuID09PSAwKSByZXR1cm4gUGx1cmFsLlplcm87XG4gICAgICBpZiAoKGkgPT09IDAgfHwgaSA9PT0gMSkgJiYgIShuID09PSAwKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ2x0JzpcbiAgICAgIGlmIChuICUgMTAgPT09IDEgJiYgIShuICUgMTAwID49IDExICYmIG4gJSAxMDAgPD0gMTkpKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIGlmIChuICUgMTAgPT09IE1hdGguZmxvb3IobiAlIDEwKSAmJiBuICUgMTAgPj0gMiAmJiBuICUgMTAgPD0gOSAmJlxuICAgICAgICAgICEobiAlIDEwMCA+PSAxMSAmJiBuICUgMTAwIDw9IDE5KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAoIShmID09PSAwKSkgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdsdic6XG4gICAgY2FzZSAncHJnJzpcbiAgICAgIGlmIChuICUgMTAgPT09IDAgfHwgbiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDExICYmIG4gJSAxMDAgPD0gMTkgfHxcbiAgICAgICAgICB2ID09PSAyICYmIGYgJSAxMDAgPT09IE1hdGguZmxvb3IoZiAlIDEwMCkgJiYgZiAlIDEwMCA+PSAxMSAmJiBmICUgMTAwIDw9IDE5KVxuICAgICAgICByZXR1cm4gUGx1cmFsLlplcm87XG4gICAgICBpZiAobiAlIDEwID09PSAxICYmICEobiAlIDEwMCA9PT0gMTEpIHx8IHYgPT09IDIgJiYgZiAlIDEwID09PSAxICYmICEoZiAlIDEwMCA9PT0gMTEpIHx8XG4gICAgICAgICAgISh2ID09PSAyKSAmJiBmICUgMTAgPT09IDEpXG4gICAgICAgIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdtayc6XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IDEgfHwgZiAlIDEwID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnbXQnOlxuICAgICAgaWYgKG4gPT09IDEpIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgaWYgKG4gPT09IDAgfHwgbiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDIgJiYgbiAlIDEwMCA8PSAxMClcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAobiAlIDEwMCA9PT0gTWF0aC5mbG9vcihuICUgMTAwKSAmJiBuICUgMTAwID49IDExICYmIG4gJSAxMDAgPD0gMTkpIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAncGwnOlxuICAgICAgaWYgKGkgPT09IDEgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IE1hdGguZmxvb3IoaSAlIDEwKSAmJiBpICUgMTAgPj0gMiAmJiBpICUgMTAgPD0gNCAmJlxuICAgICAgICAgICEoaSAlIDEwMCA+PSAxMiAmJiBpICUgMTAwIDw9IDE0KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAodiA9PT0gMCAmJiAhKGkgPT09IDEpICYmIGkgJSAxMCA9PT0gTWF0aC5mbG9vcihpICUgMTApICYmIGkgJSAxMCA+PSAwICYmIGkgJSAxMCA8PSAxIHx8XG4gICAgICAgICAgdiA9PT0gMCAmJiBpICUgMTAgPT09IE1hdGguZmxvb3IoaSAlIDEwKSAmJiBpICUgMTAgPj0gNSAmJiBpICUgMTAgPD0gOSB8fFxuICAgICAgICAgIHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gTWF0aC5mbG9vcihpICUgMTAwKSAmJiBpICUgMTAwID49IDEyICYmIGkgJSAxMDAgPD0gMTQpXG4gICAgICAgIHJldHVybiBQbHVyYWwuTWFueTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAncHQnOlxuICAgICAgaWYgKG4gPT09IE1hdGguZmxvb3IobikgJiYgbiA+PSAwICYmIG4gPD0gMiAmJiAhKG4gPT09IDIpKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAncm8nOlxuICAgICAgaWYgKGkgPT09IDEgJiYgdiA9PT0gMCkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAoISh2ID09PSAwKSB8fCBuID09PSAwIHx8XG4gICAgICAgICAgIShuID09PSAxKSAmJiBuICUgMTAwID09PSBNYXRoLmZsb29yKG4gJSAxMDApICYmIG4gJSAxMDAgPj0gMSAmJiBuICUgMTAwIDw9IDE5KVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAncnUnOlxuICAgIGNhc2UgJ3VrJzpcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMCA9PT0gMSAmJiAhKGkgJSAxMDAgPT09IDExKSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IE1hdGguZmxvb3IoaSAlIDEwKSAmJiBpICUgMTAgPj0gMiAmJiBpICUgMTAgPD0gNCAmJlxuICAgICAgICAgICEoaSAlIDEwMCA+PSAxMiAmJiBpICUgMTAwIDw9IDE0KSlcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAgPT09IDAgfHxcbiAgICAgICAgICB2ID09PSAwICYmIGkgJSAxMCA9PT0gTWF0aC5mbG9vcihpICUgMTApICYmIGkgJSAxMCA+PSA1ICYmIGkgJSAxMCA8PSA5IHx8XG4gICAgICAgICAgdiA9PT0gMCAmJiBpICUgMTAwID09PSBNYXRoLmZsb29yKGkgJSAxMDApICYmIGkgJSAxMDAgPj0gMTEgJiYgaSAlIDEwMCA8PSAxNClcbiAgICAgICAgcmV0dXJuIFBsdXJhbC5NYW55O1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICBjYXNlICdzaGknOlxuICAgICAgaWYgKGkgPT09IDAgfHwgbiA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAobiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDIgJiYgbiA8PSAxMCkgcmV0dXJuIFBsdXJhbC5GZXc7XG4gICAgICByZXR1cm4gUGx1cmFsLk90aGVyO1xuICAgIGNhc2UgJ3NpJzpcbiAgICAgIGlmIChuID09PSAwIHx8IG4gPT09IDEgfHwgaSA9PT0gMCAmJiBmID09PSAxKSByZXR1cm4gUGx1cmFsLk9uZTtcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAnc2wnOlxuICAgICAgaWYgKHYgPT09IDAgJiYgaSAlIDEwMCA9PT0gMSkgcmV0dXJuIFBsdXJhbC5PbmU7XG4gICAgICBpZiAodiA9PT0gMCAmJiBpICUgMTAwID09PSAyKSByZXR1cm4gUGx1cmFsLlR3bztcbiAgICAgIGlmICh2ID09PSAwICYmIGkgJSAxMDAgPT09IE1hdGguZmxvb3IoaSAlIDEwMCkgJiYgaSAlIDEwMCA+PSAzICYmIGkgJSAxMDAgPD0gNCB8fCAhKHYgPT09IDApKVxuICAgICAgICByZXR1cm4gUGx1cmFsLkZldztcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gICAgY2FzZSAndHptJzpcbiAgICAgIGlmIChuID09PSBNYXRoLmZsb29yKG4pICYmIG4gPj0gMCAmJiBuIDw9IDEgfHwgbiA9PT0gTWF0aC5mbG9vcihuKSAmJiBuID49IDExICYmIG4gPD0gOTkpXG4gICAgICAgIHJldHVybiBQbHVyYWwuT25lO1xuICAgICAgcmV0dXJuIFBsdXJhbC5PdGhlcjtcbiAgICAvLyBXaGVuIHRoZXJlIGlzIG5vIHNwZWNpZmljYXRpb24sIHRoZSBkZWZhdWx0IGlzIGFsd2F5cyBcIm90aGVyXCJcbiAgICAvLyBTcGVjOiBodHRwOi8vY2xkci51bmljb2RlLm9yZy9pbmRleC9jbGRyLXNwZWMvcGx1cmFsLXJ1bGVzXG4gICAgLy8gPiBvdGhlciAocmVxdWlyZWTigJRnZW5lcmFsIHBsdXJhbCBmb3JtIOKAlCBhbHNvIHVzZWQgaWYgdGhlIGxhbmd1YWdlIG9ubHkgaGFzIGEgc2luZ2xlIGZvcm0pXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBQbHVyYWwuT3RoZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGx1cmFsQ2F0ZWdvcnkodmFsdWU6IGFueSwgbG9jYWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwbHVyYWwgPSBnZXRQbHVyYWxDYXNlKGxvY2FsZSwgdmFsdWUpO1xuXG4gIHN3aXRjaCAocGx1cmFsKSB7XG4gICAgY2FzZSBQbHVyYWwuWmVybzpcbiAgICAgIHJldHVybiAnemVybyc7XG4gICAgY2FzZSBQbHVyYWwuT25lOlxuICAgICAgcmV0dXJuICdvbmUnO1xuICAgIGNhc2UgUGx1cmFsLlR3bzpcbiAgICAgIHJldHVybiAndHdvJztcbiAgICBjYXNlIFBsdXJhbC5GZXc6XG4gICAgICByZXR1cm4gJ2Zldyc7XG4gICAgY2FzZSBQbHVyYWwuTWFueTpcbiAgICAgIHJldHVybiAnbWFueSc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnb3RoZXInO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2FzZSBvZiBhbiBJQ1UgZXhwcmVzc2lvbiBkZXBlbmRpbmcgb24gdGhlIG1haW4gYmluZGluZyB2YWx1ZVxuICpcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gYmluZGluZ1ZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgbWFpbiBiaW5kaW5nIHVzZWQgYnkgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBnZXRDYXNlSW5kZXgoaWN1RXhwcmVzc2lvbjogVEljdSwgYmluZGluZ1ZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoYmluZGluZ1ZhbHVlKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHN3aXRjaCAoaWN1RXhwcmVzc2lvbi50eXBlKSB7XG4gICAgICBjYXNlIEljdVR5cGUucGx1cmFsOiB7XG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogcmVwbGFjZSB0aGlzIGhhcmQtY29kZWQgdmFsdWUgYnkgdGhlIHJlYWwgTE9DQUxFX0lEIHZhbHVlXG4gICAgICAgIGNvbnN0IGxvY2FsZSA9ICdlbi1VUyc7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQ2FzZSA9IGdldFBsdXJhbENhdGVnb3J5KGJpbmRpbmdWYWx1ZSwgbG9jYWxlKTtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YocmVzb2x2ZWRDYXNlKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiByZXNvbHZlZENhc2UgIT09ICdvdGhlcicpIHtcbiAgICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgSWN1VHlwZS5zZWxlY3Q6IHtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgZm9yIElDVSBleHByZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gc3RhcnRJbmRleFxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIGljdVN0YXJ0KFxuICAgIHRJY3VzOiBUSWN1W10sIGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIHN0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNyZWF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHJlbW92ZUNvZGVzID0gW107XG4gIGNvbnN0IHVwZGF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHZhcnMgPSBbXTtcbiAgY29uc3QgY2hpbGRJY3VzOiBudW1iZXJbXVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBFYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MgJiBvdGhlciBJQ1UgZXhwcmVzc2lvbnNcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGNvbnN0IG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBJdCBpcyBhbiBuZXN0ZWQgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgY29uc3QgaWN1SW5kZXggPSBuZXN0ZWRJY3VzLnB1c2godmFsdWUgYXMgSWN1RXhwcmVzc2lvbikgLSAxO1xuICAgICAgICAvLyBSZXBsYWNlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbiBieSBhIGNvbW1lbnQgbm9kZVxuICAgICAgICB2YWx1ZUFycltqXSA9IGA8IS0t77+9JHtpY3VJbmRleH3vv70tLT5gO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBpY3VDYXNlOiBJY3VDYXNlID1cbiAgICAgICAgcGFyc2VJY3VDYXNlKHZhbHVlQXJyLmpvaW4oJycpLCBzdGFydEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgIGNyZWF0ZUNvZGVzLnB1c2goaWN1Q2FzZS5jcmVhdGUpO1xuICAgIHJlbW92ZUNvZGVzLnB1c2goaWN1Q2FzZS5yZW1vdmUpO1xuICAgIHVwZGF0ZUNvZGVzLnB1c2goaWN1Q2FzZS51cGRhdGUpO1xuICAgIHZhcnMucHVzaChpY3VDYXNlLnZhcnMpO1xuICAgIGNoaWxkSWN1cy5wdXNoKGljdUNhc2UuY2hpbGRJY3VzKTtcbiAgfVxuICBjb25zdCB0SWN1OiBUSWN1ID0ge1xuICAgIHR5cGU6IGljdUV4cHJlc3Npb24udHlwZSxcbiAgICB2YXJzLFxuICAgIGNoaWxkSWN1cyxcbiAgICBjYXNlczogaWN1RXhwcmVzc2lvbi5jYXNlcyxcbiAgICBjcmVhdGU6IGNyZWF0ZUNvZGVzLFxuICAgIHJlbW92ZTogcmVtb3ZlQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVDb2Rlc1xuICB9O1xuICB0SWN1cy5wdXNoKHRJY3UpO1xuICAvLyBBZGRpbmcgdGhlIG1heGltdW0gcG9zc2libGUgb2YgdmFycyBuZWVkZWQgKGJhc2VkIG9uIHRoZSBjYXNlcyB3aXRoIHRoZSBtb3N0IHZhcnMpXG4gIGkxOG5WYXJzQ291bnQgKz0gTWF0aC5tYXgoLi4udmFycyk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIHN0cmluZyB0ZW1wbGF0ZSBpbnRvIGFuIEhUTUwgdGVtcGxhdGUgYW5kIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB1cGRhdGVcbiAqIGF0dHJpYnV0ZXMgb3Igbm9kZXMgdGhhdCBjb250YWluIGJpbmRpbmdzLlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIFRoZSBzdHJpbmcgdG8gcGFyc2VcbiAqIEBwYXJhbSBwYXJlbnRJbmRleFxuICogQHBhcmFtIG5lc3RlZEljdXNcbiAqIEBwYXJhbSB0SWN1c1xuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIHBhcnNlSWN1Q2FzZShcbiAgICB1bnNhZmVIdG1sOiBzdHJpbmcsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSwgdEljdXM6IFRJY3VbXSxcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogSWN1Q2FzZSB7XG4gIGNvbnN0IGluZXJ0Qm9keUhlbHBlciA9IG5ldyBJbmVydEJvZHlIZWxwZXIoZG9jdW1lbnQpO1xuICBjb25zdCBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gIGlmICghaW5lcnRCb2R5RWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGdlbmVyYXRlIGluZXJ0IGJvZHkgZWxlbWVudCcpO1xuICB9XG4gIGNvbnN0IHdyYXBwZXIgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCAhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gIGNvbnN0IG9wQ29kZXM6IEljdUNhc2UgPSB7dmFyczogMCwgY2hpbGRJY3VzOiBbXSwgY3JlYXRlOiBbXSwgcmVtb3ZlOiBbXSwgdXBkYXRlOiBbXX07XG4gIHBhcnNlTm9kZXMod3JhcHBlci5maXJzdENoaWxkLCBvcENvZGVzLCBwYXJlbnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgcmV0dXJuIG9wQ29kZXM7XG59XG5cbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICogQHBhcmFtIGN1cnJlbnROb2RlIFRoZSBmaXJzdCBub2RlIHRvIHBhcnNlXG4gKiBAcGFyYW0gaWN1Q2FzZSBUaGUgZGF0YSBmb3IgdGhlIElDVSBleHByZXNzaW9uIGNhc2UgdGhhdCBjb250YWlucyB0aG9zZSBub2Rlc1xuICogQHBhcmFtIHBhcmVudEluZGV4IEluZGV4IG9mIHRoZSBjdXJyZW50IG5vZGUncyBwYXJlbnRcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzIERhdGEgZm9yIHRoZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb25zIHRoYXQgdGhpcyBjYXNlIGNvbnRhaW5zXG4gKiBAcGFyYW0gdEljdXMgRGF0YSBmb3IgYWxsIElDVSBleHByZXNzaW9ucyBvZiB0aGUgY3VycmVudCBtZXNzYWdlXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXggRXhwYW5kbyBzdGFydCBpbmRleCBmb3IgdGhlIGN1cnJlbnQgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gcGFyc2VOb2RlcyhcbiAgICBjdXJyZW50Tm9kZTogTm9kZSB8IG51bGwsIGljdUNhc2U6IEljdUNhc2UsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSxcbiAgICB0SWN1czogVEljdVtdLCBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5lc3RlZEljdXNUb0NyZWF0ZTogW0ljdUV4cHJlc3Npb24sIG51bWJlcl1bXSA9IFtdO1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgICAgY29uc3QgbmV4dE5vZGU6IE5vZGV8bnVsbCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBleHBhbmRvU3RhcnRJbmRleCArICsraWN1Q2FzZS52YXJzO1xuICAgICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGEgdmFsaWQgZWxlbWVudCwgd2Ugd29uJ3QgY3JlYXRlIGFuIGVsZW1lbnQgZm9yIGl0XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSAhO1xuICAgICAgICAgICAgICBjb25zdCBsb3dlckF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIWF0dHIudmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIGlucHV0IHN0cmluZyBpcyBzYWZlLCB1bmxlc3MgaXQncyB1c2luZyBhIGJpbmRpbmdcbiAgICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXJBdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgX3Nhbml0aXplVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIHNhbml0aXplU3Jjc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGBXQVJOSU5HOiBpZ25vcmluZyB1bnNhZmUgYXR0cmlidXRlIHZhbHVlICR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAke3RhZ05hbWV9IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuQXR0ciwgYXR0ci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGNoaWxkcmVuIG9mIHRoaXMgbm9kZSAoaWYgYW55KVxuICAgICAgICAgICAgcGFyc2VOb2RlcyhcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5maXJzdENoaWxkLCBpY3VDYXNlLCBuZXdJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcGFyZW50IG5vZGUgYWZ0ZXIgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdmFsdWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgbmV3SW5kZXgpLCBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21tZW50IG5vZGUgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBuZXN0ZWQgSUNVXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBORVNURURfSUNVLmV4ZWMoY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJycpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1SW5kZXggPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgY29uc3QgbmV3TG9jYWwgPSBuZ0Rldk1vZGUgPyBgbmVzdGVkIElDVSAke25lc3RlZEljdUluZGV4fWAgOiAnJztcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZXdMb2NhbCwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNbbmVzdGVkSWN1SW5kZXhdO1xuICAgICAgICAgICAgbmVzdGVkSWN1c1RvQ3JlYXRlLnB1c2goW25lc3RlZEljdSwgbmV3SW5kZXhdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBjb21tZW50XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBlbGVtZW50XG4gICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IG5leHROb2RlICE7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWRJY3VzVG9DcmVhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVswXTtcbiAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVsxXTtcbiAgICAgIGljdVN0YXJ0KHRJY3VzLCBuZXN0ZWRJY3UsIG5lc3RlZEljdU5vZGVJbmRleCwgZXhwYW5kb1N0YXJ0SW5kZXggKyBpY3VDYXNlLnZhcnMpO1xuICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgY29uc3QgbmVzdFRJY3VJbmRleCA9IHRJY3VzLmxlbmd0aCAtIDE7XG4gICAgICBpY3VDYXNlLnZhcnMgKz0gTWF0aC5tYXgoLi4udEljdXNbbmVzdFRJY3VJbmRleF0udmFycyk7XG4gICAgICBpY3VDYXNlLmNoaWxkSWN1cy5wdXNoKG5lc3RUSWN1SW5kZXgpO1xuICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKG5lc3RlZEljdSk7XG4gICAgICBpY3VDYXNlLnVwZGF0ZS5wdXNoKFxuICAgICAgICAgIHRvTWFza0JpdChuZXN0ZWRJY3UubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIC0xIC0gbmVzdGVkSWN1Lm1haW5CaW5kaW5nLFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgsXG4gICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCk7XG4gICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdSxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgfVxuICB9XG59XG4iXX0=