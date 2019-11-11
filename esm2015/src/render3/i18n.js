/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_i18n_closure_mode';
import { DEFAULT_LOCALE_ID, getPluralCase } from '../i18n/localization';
import { SRCSET_ATTRS, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS, getTemplateContent } from '../sanitization/html_sanitizer';
import { InertBodyHelper } from '../sanitization/inert_body';
import { _sanitizeUrl, sanitizeSrcset } from '../sanitization/url_sanitizer';
import { addAllToArray } from '../util/array_utils';
import { assertDataInRange, assertDefined, assertEqual, assertGreaterThan } from '../util/assert';
import { bindingUpdated } from './bindings';
import { attachPatchData } from './context_discovery';
import { setDelayProjection } from './instructions/all';
import { attachI18nOpCodesDebug } from './instructions/lview_debug';
import { allocExpando, elementAttributeInternal, elementPropertyInternal, getOrCreateTNode, setInputsForProperty, setNgReflectProperties, textBindingInternal } from './instructions/shared';
import { NATIVE } from './interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { isLContainer } from './interfaces/type_checks';
import { HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from './interfaces/view';
import { appendChild, applyProjection, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getBindingIndex, getIsParent, getLView, getPreviousOrParentTNode, nextBindingIndex, setIsNotParent, setPreviousOrParentTNode } from './state';
import { renderStringify } from './util/misc_utils';
import { getNativeByIndex, getNativeByTNode, getTNode, load } from './util/view_utils';
/** @type {?} */
const MARKER = `�`;
/** @type {?} */
const ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;
/** @type {?} */
const SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
/** @type {?} */
const PH_REGEXP = /�(\/?[#*!]\d+):?\d*�/gi;
/** @type {?} */
const BINDING_REGEXP = /�(\d+):?\d*�/gi;
/** @type {?} */
const ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
/** @enum {string} */
const TagType = {
    ELEMENT: '#',
    TEMPLATE: '*',
    PROJECTION: '!',
};
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
const PP_ICU_PLACEHOLDERS_REGEXP = /{([A-Z0-9_]+)}/g;
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
                else {
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
    results.push(substring);
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
        if (cases.length > values.length) {
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
 * - `�!{index}(:{block})�`/`�/!{index}(:{block})�`: *Projection Placeholder*:  Marks the
 *   beginning and end of <ng-content> that was embedded in the original translation block.
 *   The placeholder `index` points to the element index in the template instructions set.
 *   An optional `block` that matches the sub-template in which it was declared.
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
export function ɵɵi18nStart(index, message, subTemplateIndex) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nIndexStack[++i18nIndexStackPointer] = index;
    // We need to delay projections until `i18nEnd`
    setDelayProjection(true);
    if (tView.firstCreatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nStartFirstPass(lView, tView, index, message, subTemplateIndex);
    }
}
// Count for the number of vars that will be allocated for each i18n block.
// It is global because this is used in multiple functions that include loops and recursive calls.
// This is reset to 0 when `i18nStartFirstPass` is called.
/** @type {?} */
let i18nVarsCount;
/**
 * See `i18nStart` above.
 * @param {?} lView
 * @param {?} tView
 * @param {?} index
 * @param {?} message
 * @param {?=} subTemplateIndex
 * @return {?}
 */
function i18nStartFirstPass(lView, tView, index, message, subTemplateIndex) {
    /** @type {?} */
    const startIndex = tView.blueprint.length - HEADER_OFFSET;
    i18nVarsCount = 0;
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const parentTNode = getIsParent() ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    /** @type {?} */
    let parentIndex = parentTNode && parentTNode !== lView[T_HOST] ? parentTNode.index - HEADER_OFFSET : index;
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
    const msgParts = replaceNgsp(templateTranslation).split(PH_REGEXP);
    for (let i = 0; i < msgParts.length; i++) {
        /** @type {?} */
        let value = msgParts[i];
        if (i & 1) {
            // Odd indexes are placeholders (elements and sub-templates)
            if (value.charAt(0) === '/') {
                // It is a closing tag
                if (value.charAt(1) === "#" /* ELEMENT */) {
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
                if (value.charAt(0) === "#" /* ELEMENT */) {
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
    if (i18nVarsCount > 0) {
        allocExpando(lView, i18nVarsCount);
    }
    ngDevMode &&
        attachI18nOpCodesDebug(createOpCodes, updateOpCodes, icuExpressions.length ? icuExpressions : null, lView);
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
 * @param {?} lView
 * @return {?}
 */
function appendI18nNode(tNode, parentTNode, previousTNode, lView) {
    ngDevMode && ngDevMode.rendererMoveNode++;
    /** @type {?} */
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
    // If the placeholder to append is a projection, we need to move the projected nodes instead
    if (tNode.type === 1 /* Projection */) {
        applyProjection(lView, (/** @type {?} */ (tNode)));
        return tNode;
    }
    appendChild(getNativeByTNode(tNode, lView), tNode, lView);
    /** @type {?} */
    const slotValue = lView[tNode.index];
    if (tNode.type !== 0 /* Container */ && isLContainer(slotValue)) {
        // Nodes that inject ViewContainerRef also have a comment node that should be moved
        appendChild(slotValue[NATIVE], tNode, lView);
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
 * 3. Replace all placeholders used inside ICUs in a form of {PLACEHOLDER}
 * 4. Replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�)
 *    in case multiple ICUs have the same placeholder name
 *
 * \@codeGenApi
 * @param {?} message Raw translation string for post processing
 * @param {?=} replacements Set of replacements that should be applied
 *
 * @return {?} Transformed string that can be consumed by i18nStart instruction
 *
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
            /** @type {?} */
            const placeholders = matches[content] || [];
            if (!placeholders.length) {
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
            if (!placeholders.length) {
                throw new Error(`i18n postprocess: unmatched placeholder - ${content}`);
            }
            /** @type {?} */
            const currentTemplateId = templateIdsStack[templateIdsStack.length - 1];
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
     * Step 3: replace all placeholders used inside ICUs in a form of {PLACEHOLDER}
     */
    result = result.replace(PP_ICU_PLACEHOLDERS_REGEXP, (/**
     * @param {?} match
     * @param {?} key
     * @return {?}
     */
    (match, key) => {
        return replacements.hasOwnProperty(key) ? (/** @type {?} */ (replacements[key])) : match;
    }));
    /**
     * Step 4: replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�) in case
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
export function ɵɵi18nEnd() {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nEndFirstPass(lView, tView);
    // Stop delaying projections
    setDelayProjection(false);
}
/**
 * See `i18nEnd` above.
 * @param {?} lView
 * @param {?} tView
 * @return {?}
 */
function i18nEndFirstPass(lView, tView) {
    ngDevMode && assertEqual(getBindingIndex(), tView.bindingStartIndex, 'i18nEnd should be called before any binding');
    /** @type {?} */
    const rootIndex = i18nIndexStack[i18nIndexStackPointer--];
    /** @type {?} */
    const tI18n = (/** @type {?} */ (tView.data[rootIndex + HEADER_OFFSET]));
    ngDevMode && assertDefined(tI18n, `You should call i18nStart before i18nEnd`);
    // Find the last node that was added before `i18nEnd`
    /** @type {?} */
    const lastCreatedNode = getPreviousOrParentTNode();
    // Read the instructions to insert/move/remove DOM elements
    /** @type {?} */
    const visitedNodes = readCreateOpCodes(rootIndex, tI18n.create, lView);
    // Remove deleted nodes
    /** @type {?} */
    let index = rootIndex + 1;
    while (index <= lastCreatedNode.index - HEADER_OFFSET) {
        if (visitedNodes.indexOf(index) === -1) {
            removeNode(index, lView, /* markAsDetached */ true);
        }
        // Check if an element has any local refs and skip them
        /** @type {?} */
        const tNode = getTNode(index, lView);
        if (tNode && (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) &&
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
 * @param {?} lView
 * @param {?} index
 * @param {?} type
 * @param {?} native
 * @param {?} name
 * @return {?}
 */
function createDynamicNodeAtIndex(lView, index, type, native, name) {
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    lView[index + HEADER_OFFSET] = native;
    /** @type {?} */
    const tNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], index, (/** @type {?} */ (type)), name, null);
    // We are creating a dynamic node, the previous tNode might not be pointing at this node.
    // We will link ourselves into the tree later with `appendI18nNode`.
    if (previousOrParentTNode && previousOrParentTNode.next === tNode) {
        previousOrParentTNode.next = null;
    }
    return tNode;
}
/**
 * @param {?} index
 * @param {?} createOpCodes
 * @param {?} lView
 * @return {?}
 */
function readCreateOpCodes(index, createOpCodes, lView) {
    /** @type {?} */
    const renderer = lView[RENDERER];
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
            currentTNode =
                createDynamicNodeAtIndex(lView, textNodeIndex, 3 /* Element */, textRNode, null);
            visitedNodes.push(textNodeIndex);
            setIsNotParent();
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
                        destinationTNode = (/** @type {?} */ (lView[T_HOST]));
                    }
                    else {
                        destinationTNode = getTNode(destinationNodeIndex, lView);
                    }
                    ngDevMode &&
                        assertDefined((/** @type {?} */ (currentTNode)), `You need to create or select a node before you can insert it into the DOM`);
                    previousTNode = appendI18nNode((/** @type {?} */ (currentTNode)), destinationTNode, previousTNode, lView);
                    break;
                case 0 /* Select */:
                    /** @type {?} */
                    const nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    visitedNodes.push(nodeIndex);
                    previousTNode = currentTNode;
                    currentTNode = getTNode(nodeIndex, lView);
                    if (currentTNode) {
                        setPreviousOrParentTNode(currentTNode, currentTNode.type === 3 /* Element */);
                    }
                    break;
                case 5 /* ElementEnd */:
                    /** @type {?} */
                    const elementIndex = opCode >>> 3 /* SHIFT_REF */;
                    previousTNode = currentTNode = getTNode(elementIndex, lView);
                    setPreviousOrParentTNode(currentTNode, false);
                    break;
                case 4 /* Attr */:
                    /** @type {?} */
                    const elementNodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    /** @type {?} */
                    const attrName = (/** @type {?} */ (createOpCodes[++i]));
                    /** @type {?} */
                    const attrValue = (/** @type {?} */ (createOpCodes[++i]));
                    // This code is used for ICU expressions only, since we don't support
                    // directives/components in ICUs, we don't need to worry about inputs here
                    elementAttributeInternal(elementNodeIndex, attrName, attrValue, lView);
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
                    currentTNode = createDynamicNodeAtIndex(lView, commentNodeIndex, 5 /* IcuContainer */, commentRNode, null);
                    visitedNodes.push(commentNodeIndex);
                    attachPatchData(commentRNode, lView);
                    ((/** @type {?} */ (currentTNode))).activeCaseIndex = null;
                    // We will add the case nodes later, during the update phase
                    setIsNotParent();
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
                    currentTNode = createDynamicNodeAtIndex(lView, elementNodeIndex, 3 /* Element */, elementRNode, tagNameValue);
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
                                const propName = (/** @type {?} */ (updateOpCodes[++j]));
                                /** @type {?} */
                                const sanitizeFn = (/** @type {?} */ (updateOpCodes[++j]));
                                elementPropertyInternal(viewData, nodeIndex, propName, value, sanitizeFn);
                                break;
                            case 0 /* Text */:
                                textBindingInternal(viewData, nodeIndex, value);
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
                                                // Remove DOM element, but do *not* mark TNode as detached, since we are
                                                // just switching ICU cases (while keeping the same TNode), so a DOM element
                                                // representing a new ICU case will be re-created.
                                                removeNode(nodeIndex, viewData, /* markAsDetached */ false);
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
                                readCreateOpCodes(-1, tIcu.create[caseIndex], viewData);
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
 * @param {?} markAsDetached
 * @return {?}
 */
function removeNode(index, viewData, markAsDetached) {
    /** @type {?} */
    const removedPhTNode = getTNode(index, viewData);
    /** @type {?} */
    const removedPhRNode = getNativeByIndex(index, viewData);
    if (removedPhRNode) {
        nativeRemoveNode(viewData[RENDERER], removedPhRNode);
    }
    /** @type {?} */
    const slotValue = (/** @type {?} */ (load(viewData, index)));
    if (isLContainer(slotValue)) {
        /** @type {?} */
        const lContainer = (/** @type {?} */ (slotValue));
        if (removedPhTNode.type !== 0 /* Container */) {
            nativeRemoveNode(viewData[RENDERER], lContainer[NATIVE]);
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
export function ɵɵi18n(index, message, subTemplateIndex) {
    ɵɵi18nStart(index, message, subTemplateIndex);
    ɵɵi18nEnd();
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
export function ɵɵi18nAttributes(index, values) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertDefined(tView, `tView should be defined`);
    i18nAttributesFirstPass(lView, tView, index, values);
}
/**
 * See `i18nAttributes` above.
 * @param {?} lView
 * @param {?} tView
 * @param {?} index
 * @param {?} values
 * @return {?}
 */
function i18nAttributesFirstPass(lView, tView, index, values) {
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
                throw new Error('ICU expressions are not yet supported in attributes');
            }
            else if (value !== '') {
                // Even indexes are text (including bindings)
                /** @type {?} */
                const hasBinding = !!value.match(BINDING_REGEXP);
                if (hasBinding) {
                    if (tView.firstCreatePass && tView.data[index + HEADER_OFFSET] === null) {
                        addAllToArray(generateBindingUpdateOpCodes(value, previousElementIndex, attrName), updateOpCodes);
                    }
                }
                else {
                    /** @type {?} */
                    const tNode = getTNode(previousElementIndex, lView);
                    // Set attributes for Elements only, for other types (like ElementContainer),
                    // only set inputs below
                    if (tNode.type === 3 /* Element */) {
                        elementAttributeInternal(previousElementIndex, attrName, value, lView);
                    }
                    // Check if that attribute is a directive input
                    /** @type {?} */
                    const dataValue = tNode.inputs && tNode.inputs[attrName];
                    if (dataValue) {
                        setInputsForProperty(lView, dataValue, value);
                        if (ngDevMode) {
                            /** @type {?} */
                            const element = (/** @type {?} */ (getNativeByIndex(previousElementIndex, lView)));
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
 * @param {?} value The binding's value
 * @return {?} This function returns itself so that it may be chained
 * (e.g. `i18nExp(ctx.name)(ctx.title)`)
 *
 */
export function ɵɵi18nExp(value) {
    /** @type {?} */
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
 * \@codeGenApi
 * @param {?} index Index of either {\@link i18nStart} (translation block) or {\@link i18nAttributes}
 * (i18n attribute) on which it should update the content.
 *
 * @return {?}
 */
export function ɵɵi18nApply(index) {
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
        const bindingsStartIndex = getBindingIndex() - shiftsCounter - 1;
        readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, lView);
        // Reset changeMask & maskBit to default for the next update cycle
        changeMask = 0b0;
        shiftsCounter = 0;
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
                /** @type {?} */
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
/**
 * Angular Dart introduced &ngsp; as a placeholder for non-removable space, see:
 * https://github.com/dart-lang/angular/blob/0bb611387d29d65b5af7f9d2515ab571fd3fbee4/_tests/test/compiler/preserve_whitespace_test.dart#L25-L32
 * In Angular Dart &ngsp; is converted to the 0xE500 PUA (Private Use Areas) unicode character
 * and later on replaced by a space. We are re-implementing the same idea here, since translations
 * might contain this special character.
 * @type {?}
 */
const NGSP_UNICODE_REGEXP = /\uE500/g;
/**
 * @param {?} value
 * @return {?}
 */
function replaceNgsp(value) {
    return value.replace(NGSP_UNICODE_REGEXP, ' ');
}
/**
 * The locale id that the application is currently using (for translations and ICU expressions).
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 * @type {?}
 */
let LOCALE_ID = DEFAULT_LOCALE_ID;
/**
 * Sets the locale id that will be used for translations and ICU expressions.
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 *
 * @param {?} localeId
 * @return {?}
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
 * @return {?}
 */
export function getLocaleId() {
    return LOCALE_ID;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sOEJBQThCLENBQUM7QUFFdEMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4SCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVoRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNsRSxPQUFPLEVBQW1CLFlBQVksRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdNLE9BQU8sRUFBYSxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsY0FBYyxFQUFFLGNBQWMsRUFBaUcsTUFB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QztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi91dGlsL25nX2kxOG5fY2xvc3VyZV9tb2RlJztcblxuaW1wb3J0IHtERUZBVUxUX0xPQ0FMRV9JRCwgZ2V0UGx1cmFsQ2FzZX0gZnJvbSAnLi4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtTUkNTRVRfQVRUUlMsIFVSSV9BVFRSUywgVkFMSURfQVRUUlMsIFZBTElEX0VMRU1FTlRTLCBnZXRUZW1wbGF0ZUNvbnRlbnR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge0luZXJ0Qm9keUhlbHBlcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2luZXJ0X2JvZHknO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwsIHNhbml0aXplU3Jjc2V0fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplcic7XG5pbXBvcnQge2FkZEFsbFRvQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtzZXREZWxheVByb2plY3Rpb259IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge2F0dGFjaEkxOG5PcENvZGVzRGVidWd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgYWxsb2NFeHBhbmRvLCBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwsIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBnZXRPckNyZWF0ZVROb2RlLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eSwgc2V0TmdSZWZsZWN0UHJvcGVydGllcywgdGV4dEJpbmRpbmdJbnRlcm5hbH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIEljdVR5cGUsIFRJMThuLCBUSWN1fSBmcm9tICcuL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzTENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFJFTkRFUkVSLCBUVklFVywgVFZpZXcsIFRfSE9TVH0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgYXBwbHlQcm9qZWN0aW9uLCBjcmVhdGVUZXh0Tm9kZSwgbmF0aXZlUmVtb3ZlTm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIG5leHRCaW5kaW5nSW5kZXgsIHNldElzTm90UGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGxvYWR9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5jb25zdCBNQVJLRVIgPSBg77+9YDtcbmNvbnN0IElDVV9CTE9DS19SRUdFWFAgPSAvXlxccyoo77+9XFxkKzo/XFxkKu+/vSlcXHMqLFxccyooc2VsZWN0fHBsdXJhbClcXHMqLC87XG5jb25zdCBTVUJURU1QTEFURV9SRUdFWFAgPSAv77+9XFwvP1xcKihcXGQrOlxcZCsp77+9L2dpO1xuY29uc3QgUEhfUkVHRVhQID0gL++/vShcXC8/WyMqIV1cXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IEJJTkRJTkdfUkVHRVhQID0gL++/vShcXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IElDVV9SRUdFWFAgPSAvKHtcXHMq77+9XFxkKzo/XFxkKu+/vVxccyosXFxzKlxcU3s2fVxccyosW1xcc1xcU10qfSkvZ2k7XG5jb25zdCBlbnVtIFRhZ1R5cGUge1xuICBFTEVNRU5UID0gJyMnLFxuICBURU1QTEFURSA9ICcqJyxcbiAgUFJPSkVDVElPTiA9ICchJyxcbn1cblxuLy8gaTE4blBvc3Rwcm9jZXNzIGNvbnN0c1xuY29uc3QgUk9PVF9URU1QTEFURV9JRCA9IDA7XG5jb25zdCBQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXS87XG5jb25zdCBQUF9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXXwo77+9XFwvP1xcKlxcZCs6XFxkK++/vSkvZztcbmNvbnN0IFBQX0lDVV9WQVJTX1JFR0VYUCA9IC8oe1xccyopKFZBUl8oUExVUkFMfFNFTEVDVCkoX1xcZCspPykoXFxzKiwpL2c7XG5jb25zdCBQUF9JQ1VfUExBQ0VIT0xERVJTX1JFR0VYUCA9IC97KFtBLVowLTlfXSspfS9nO1xuY29uc3QgUFBfSUNVU19SRUdFWFAgPSAv77+9STE4Tl9FWFBfKElDVShfXFxkKyk/Ke+/vS9nO1xuY29uc3QgUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQID0gL1xcL1xcKi87XG5jb25zdCBQUF9URU1QTEFURV9JRF9SRUdFWFAgPSAvXFxkK1xcOihcXGQrKS87XG5cbi8vIFBhcnNlZCBwbGFjZWhvbGRlciBzdHJ1Y3R1cmUgdXNlZCBpbiBwb3N0cHJvY2Vzc2luZyAod2l0aGluIGBpMThuUG9zdHByb2Nlc3NgIGZ1bmN0aW9uKVxuLy8gQ29udGFpbnMgdGhlIGZvbGxvd2luZyBmaWVsZHM6IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXVxudHlwZSBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyID0gW251bWJlciwgYm9vbGVhbiwgc3RyaW5nXTtcblxuaW50ZXJmYWNlIEljdUV4cHJlc3Npb24ge1xuICB0eXBlOiBJY3VUeXBlO1xuICBtYWluQmluZGluZzogbnVtYmVyO1xuICBjYXNlczogc3RyaW5nW107XG4gIHZhbHVlczogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdW107XG59XG5cbmludGVyZmFjZSBJY3VDYXNlIHtcbiAgLyoqXG4gICAqIE51bWJlciBvZiBzbG90cyB0byBhbGxvY2F0ZSBpbiBleHBhbmRvIGZvciB0aGlzIGNhc2UuXG4gICAqXG4gICAqIFRoaXMgaXMgdGhlIG1heCBudW1iZXIgb2YgRE9NIGVsZW1lbnRzIHdoaWNoIHdpbGwgYmUgY3JlYXRlZCBieSB0aGlzIGkxOG4gKyBJQ1UgYmxvY2tzLiBXaGVuXG4gICAqIHRoZSBET00gZWxlbWVudHMgYXJlIGJlaW5nIGNyZWF0ZWQgdGhleSBhcmUgc3RvcmVkIGluIHRoZSBFWFBBTkRPLCBzbyB0aGF0IHVwZGF0ZSBPcENvZGVzIGNhblxuICAgKiB3cml0ZSBpbnRvIHRoZW0uXG4gICAqL1xuICB2YXJzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGFycmF5IG9mIGNoaWxkL3N1YiBJQ1VzLlxuICAgKi9cbiAgY2hpbGRJY3VzOiBudW1iZXJbXTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBidWlsZCB1cCB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVXG4gICAqL1xuICBjcmVhdGU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGRlc3Ryb3kgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVS5cbiAgICovXG4gIHJlbW92ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gdXBkYXRlIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UgYmluZGluZ3MuXG4gICAqL1xuICB1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzO1xufVxuXG4vKipcbiAqIEJyZWFrcyBwYXR0ZXJuIGludG8gc3RyaW5ncyBhbmQgdG9wIGxldmVsIHsuLi59IGJsb2Nrcy5cbiAqIENhbiBiZSB1c2VkIHRvIGJyZWFrIGEgbWVzc2FnZSBpbnRvIHRleHQgYW5kIElDVSBleHByZXNzaW9ucywgb3IgdG8gYnJlYWsgYW4gSUNVIGV4cHJlc3Npb24gaW50b1xuICoga2V5cyBhbmQgY2FzZXMuXG4gKiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiAoc3ViKVBhdHRlcm4gdG8gYmUgYnJva2VuLlxuICpcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBhcnRzKHBhdHRlcm46IHN0cmluZyk6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdIHtcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgbGV0IHByZXZQb3MgPSAwO1xuICBjb25zdCBicmFjZVN0YWNrID0gW107XG4gIGNvbnN0IHJlc3VsdHM6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdID0gW107XG4gIGNvbnN0IGJyYWNlcyA9IC9be31dL2c7XG4gIC8vIGxhc3RJbmRleCBkb2Vzbid0IGdldCBzZXQgdG8gMCBzbyB3ZSBoYXZlIHRvLlxuICBicmFjZXMubGFzdEluZGV4ID0gMDtcblxuICBsZXQgbWF0Y2g7XG4gIHdoaWxlIChtYXRjaCA9IGJyYWNlcy5leGVjKHBhdHRlcm4pKSB7XG4gICAgY29uc3QgcG9zID0gbWF0Y2guaW5kZXg7XG4gICAgaWYgKG1hdGNoWzBdID09ICd9Jykge1xuICAgICAgYnJhY2VTdGFjay5wb3AoKTtcblxuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gRW5kIG9mIHRoZSBibG9jay5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICBpZiAoSUNVX0JMT0NLX1JFR0VYUC50ZXN0KGJsb2NrKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChwYXJzZUlDVUJsb2NrKGJsb2NrKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKGJsb2NrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICBjb25zdCBzdWJzdHJpbmcgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgICBicmFjZVN0YWNrLnB1c2goJ3snKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdWJzdHJpbmcgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zKTtcbiAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIFBhcnNlcyB0ZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gYW5kIHByb2R1Y2VzIGEgSlNPTiBvYmplY3QgZm9yIGl0LlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gVGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxuICpcbiAqL1xuZnVuY3Rpb24gcGFyc2VJQ1VCbG9jayhwYXR0ZXJuOiBzdHJpbmcpOiBJY3VFeHByZXNzaW9uIHtcbiAgY29uc3QgY2FzZXMgPSBbXTtcbiAgY29uc3QgdmFsdWVzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXVtdID0gW107XG4gIGxldCBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gIGxldCBtYWluQmluZGluZyA9IDA7XG4gIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoSUNVX0JMT0NLX1JFR0VYUCwgZnVuY3Rpb24oc3RyOiBzdHJpbmcsIGJpbmRpbmc6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgaWYgKHR5cGUgPT09ICdzZWxlY3QnKSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5zZWxlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgICB9XG4gICAgbWFpbkJpbmRpbmcgPSBwYXJzZUludChiaW5kaW5nLnN1YnN0cigxKSwgMTApO1xuICAgIHJldHVybiAnJztcbiAgfSk7XG5cbiAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHMocGF0dGVybikgYXMgc3RyaW5nW107XG4gIC8vIExvb2tpbmcgZm9yIChrZXkgYmxvY2spKyBzZXF1ZW5jZS4gT25lIG9mIHRoZSBrZXlzIGhhcyB0byBiZSBcIm90aGVyXCIuXG4gIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IHBhcnRzLmxlbmd0aDspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbcG9zKytdLnRyaW0oKTtcbiAgICBpZiAoaWN1VHlwZSA9PT0gSWN1VHlwZS5wbHVyYWwpIHtcbiAgICAgIC8vIEtleSBjYW4gYmUgXCI9eFwiLCB3ZSBqdXN0IHdhbnQgXCJ4XCJcbiAgICAgIGtleSA9IGtleS5yZXBsYWNlKC9cXHMqKD86PSk/KFxcdyspXFxzKi8sICckMScpO1xuICAgIH1cbiAgICBpZiAoa2V5Lmxlbmd0aCkge1xuICAgICAgY2FzZXMucHVzaChrZXkpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrcyA9IGV4dHJhY3RQYXJ0cyhwYXJ0c1twb3MrK10pIGFzIHN0cmluZ1tdO1xuICAgIGlmIChjYXNlcy5sZW5ndGggPiB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZXMucHVzaChibG9ja3MpO1xuICAgIH1cbiAgfVxuXG4gIGFzc2VydEdyZWF0ZXJUaGFuKGNhc2VzLmluZGV4T2YoJ290aGVyJyksIC0xLCAnTWlzc2luZyBrZXkgXCJvdGhlclwiIGluIElDVSBzdGF0ZW1lbnQuJyk7XG4gIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlcywgc2VlICMyMTYxNVxuICByZXR1cm4ge3R5cGU6IGljdVR5cGUsIG1haW5CaW5kaW5nOiBtYWluQmluZGluZywgY2FzZXMsIHZhbHVlc307XG59XG5cbi8qKlxuICogUmVtb3ZlcyBldmVyeXRoaW5nIGluc2lkZSB0aGUgc3ViLXRlbXBsYXRlcyBvZiBhIG1lc3NhZ2UuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgbWF0Y2g7XG4gIGxldCByZXMgPSAnJztcbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgbGV0IHRhZ01hdGNoZWQ7XG5cbiAgd2hpbGUgKChtYXRjaCA9IFNVQlRFTVBMQVRFX1JFR0VYUC5leGVjKG1lc3NhZ2UpKSAhPT0gbnVsbCkge1xuICAgIGlmICghaW5UZW1wbGF0ZSkge1xuICAgICAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyaW5nKGluZGV4LCBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICB0YWdNYXRjaGVkID0gbWF0Y2hbMV07XG4gICAgICBpblRlbXBsYXRlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG1hdGNoWzBdID09PSBgJHtNQVJLRVJ9Lyoke3RhZ01hdGNoZWR9JHtNQVJLRVJ9YCkge1xuICAgICAgICBpbmRleCA9IG1hdGNoLmluZGV4O1xuICAgICAgICBpblRlbXBsYXRlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBpblRlbXBsYXRlLCBmYWxzZSxcbiAgICAgICAgICBgVGFnIG1pc21hdGNoOiB1bmFibGUgdG8gZmluZCB0aGUgZW5kIG9mIHRoZSBzdWItdGVtcGxhdGUgaW4gdGhlIHRyYW5zbGF0aW9uIFwiJHttZXNzYWdlfVwiYCk7XG5cbiAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyKGluZGV4KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBhIHBhcnQgb2YgYSBtZXNzYWdlIGFuZCByZW1vdmVzIHRoZSByZXN0LlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIGV4dHJhY3RpbmcgYSBwYXJ0IG9mIHRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCBhIHRlbXBsYXRlLiBBIHRyYW5zbGF0ZWRcbiAqIG1lc3NhZ2UgY2FuIHNwYW4gbXVsdGlwbGUgdGVtcGxhdGVzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgaTE4bj5UcmFuc2xhdGUgPHNwYW4gKm5nSWY+bWU8L3NwYW4+ITwvZGl2PlxuICogYGBgXG4gKlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gY3JvcFxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggSW5kZXggb2YgdGhlIHN1Yi10ZW1wbGF0ZSB0byBleHRyYWN0LiBJZiB1bmRlZmluZWQgaXQgcmV0dXJucyB0aGVcbiAqIGV4dGVybmFsIHRlbXBsYXRlIGFuZCByZW1vdmVzIGFsbCBzdWItdGVtcGxhdGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBzdWJUZW1wbGF0ZUluZGV4ICE9PSAnbnVtYmVyJykge1xuICAgIC8vIFdlIHdhbnQgdGhlIHJvb3QgdGVtcGxhdGUgbWVzc2FnZSwgaWdub3JlIGFsbCBzdWItdGVtcGxhdGVzXG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSB3YW50IGEgc3BlY2lmaWMgc3ViLXRlbXBsYXRlXG4gICAgY29uc3Qgc3RhcnQgPVxuICAgICAgICBtZXNzYWdlLmluZGV4T2YoYDoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkgKyAyICsgc3ViVGVtcGxhdGVJbmRleC50b1N0cmluZygpLmxlbmd0aDtcbiAgICBjb25zdCBlbmQgPSBtZXNzYWdlLnNlYXJjaChuZXcgUmVnRXhwKGAke01BUktFUn1cXFxcL1xcXFwqXFxcXGQrOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSk7XG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlLnN1YnN0cmluZyhzdGFydCwgZW5kKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyB0byB1cGRhdGUgdGhlIGJpbmRpbmdzIG9mIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBiaW5kaW5ncy5cbiAqIEBwYXJhbSBkZXN0aW5hdGlvbk5vZGUgSW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIG5vZGUgd2hpY2ggd2lsbCByZWNlaXZlIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGF0dHJOYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSwgaWYgdGhlIHN0cmluZyBiZWxvbmdzIHRvIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZUZuIFNhbml0aXphdGlvbiBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSBzdHJpbmcgYWZ0ZXIgdXBkYXRlLCBpZiBuZWNlc3NhcnkuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgc3RyOiBzdHJpbmcsIGRlc3RpbmF0aW9uTm9kZTogbnVtYmVyLCBhdHRyTmFtZT86IHN0cmluZyxcbiAgICBzYW5pdGl6ZUZuOiBTYW5pdGl6ZXJGbiB8IG51bGwgPSBudWxsKTogSTE4blVwZGF0ZU9wQ29kZXMge1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtudWxsLCBudWxsXTsgIC8vIEFsbG9jIHNwYWNlIGZvciBtYXNrIGFuZCBzaXplXG4gIGNvbnN0IHRleHRQYXJ0cyA9IHN0ci5zcGxpdChCSU5ESU5HX1JFR0VYUCk7XG4gIGxldCBtYXNrID0gMDtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IHRleHRQYXJ0cy5sZW5ndGg7IGorKykge1xuICAgIGNvbnN0IHRleHRWYWx1ZSA9IHRleHRQYXJ0c1tqXTtcblxuICAgIGlmIChqICYgMSkge1xuICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBwYXJzZUludCh0ZXh0VmFsdWUsIDEwKTtcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCgtMSAtIGJpbmRpbmdJbmRleCk7XG4gICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChiaW5kaW5nSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAodGV4dFZhbHVlICE9PSAnJykge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2godGV4dFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVPcENvZGVzLnB1c2goXG4gICAgICBkZXN0aW5hdGlvbk5vZGUgPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfFxuICAgICAgKGF0dHJOYW1lID8gSTE4blVwZGF0ZU9wQ29kZS5BdHRyIDogSTE4blVwZGF0ZU9wQ29kZS5UZXh0KSk7XG4gIGlmIChhdHRyTmFtZSkge1xuICAgIHVwZGF0ZU9wQ29kZXMucHVzaChhdHRyTmFtZSwgc2FuaXRpemVGbik7XG4gIH1cbiAgdXBkYXRlT3BDb2Rlc1swXSA9IG1hc2s7XG4gIHVwZGF0ZU9wQ29kZXNbMV0gPSB1cGRhdGVPcENvZGVzLmxlbmd0aCAtIDI7XG4gIHJldHVybiB1cGRhdGVPcENvZGVzO1xufVxuXG5mdW5jdGlvbiBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBtYXNrID0gMCk6IG51bWJlciB7XG4gIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpO1xuICBsZXQgbWF0Y2g7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICB3aGlsZSAobWF0Y2ggPSBCSU5ESU5HX1JFR0VYUC5leGVjKHZhbHVlKSkge1xuICAgICAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KHBhcnNlSW50KG1hdGNoWzFdLCAxMCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXNrID0gZ2V0QmluZGluZ01hc2sodmFsdWUgYXMgSWN1RXhwcmVzc2lvbiwgbWFzayk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXNrO1xufVxuXG5jb25zdCBpMThuSW5kZXhTdGFjazogbnVtYmVyW10gPSBbXTtcbmxldCBpMThuSW5kZXhTdGFja1BvaW50ZXIgPSAtMTtcblxuLyoqXG4gKiBDb252ZXJ0IGJpbmRpbmcgaW5kZXggdG8gbWFzayBiaXQuXG4gKlxuICogRWFjaCBpbmRleCByZXByZXNlbnRzIGEgc2luZ2xlIGJpdCBvbiB0aGUgYml0LW1hc2suIEJlY2F1c2UgYml0LW1hc2sgb25seSBoYXMgMzIgYml0cywgd2UgbWFrZVxuICogdGhlIDMybmQgYml0IHNoYXJlIGFsbCBtYXNrcyBmb3IgYWxsIGJpbmRpbmdzIGhpZ2hlciB0aGFuIDMyLiBTaW5jZSBpdCBpcyBleHRyZW1lbHkgcmFyZSB0byBoYXZlXG4gKiBtb3JlIHRoYW4gMzIgYmluZGluZ3MgdGhpcyB3aWxsIGJlIGhpdCB2ZXJ5IHJhcmVseS4gVGhlIGRvd25zaWRlIG9mIGhpdHRpbmcgdGhpcyBjb3JuZXIgY2FzZSBpc1xuICogdGhhdCB3ZSB3aWxsIGV4ZWN1dGUgYmluZGluZyBjb2RlIG1vcmUgb2Z0ZW4gdGhhbiBuZWNlc3NhcnkuIChwZW5hbHR5IG9mIHBlcmZvcm1hbmNlKVxuICovXG5mdW5jdGlvbiB0b01hc2tCaXQoYmluZGluZ0luZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gMSA8PCBNYXRoLm1pbihiaW5kaW5nSW5kZXgsIDMxKTtcbn1cblxuY29uc3QgcGFyZW50SW5kZXhTdGFjazogbnVtYmVyW10gPSBbXTtcblxuLyoqXG4gKiBNYXJrcyBhIGJsb2NrIG9mIHRleHQgYXMgdHJhbnNsYXRhYmxlLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgYGkxOG5TdGFydGAgYW5kIGBpMThuRW5kYCBtYXJrIHRoZSB0cmFuc2xhdGlvbiBibG9jayBpbiB0aGUgdGVtcGxhdGUuXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIGlzIHRoZSB2YWx1ZSB3aGljaCBpcyBsb2NhbGUgc3BlY2lmaWMuIFRoZSB0cmFuc2xhdGlvbiBzdHJpbmcgbWF5XG4gKiBjb250YWluIHBsYWNlaG9sZGVycyB3aGljaCBhc3NvY2lhdGUgaW5uZXIgZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMgd2l0aGluIHRoZSB0cmFuc2xhdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIHBsYWNlaG9sZGVycyBhcmU6XG4gKiAtIGDvv717aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpCaW5kaW5nIFBsYWNlaG9sZGVyKjogTWFya3MgYSBsb2NhdGlvbiB3aGVyZSBhbiBleHByZXNzaW9uIHdpbGwgYmVcbiAqICAgaW50ZXJwb2xhdGVkIGludG8uIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZXhwcmVzc2lvbiBiaW5kaW5nIGluZGV4LiBBbiBvcHRpb25hbFxuICogICBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSN7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8je2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqRWxlbWVudCBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGUgYmVnaW5uaW5nXG4gKiAgIGFuZCBlbmQgb2YgRE9NIGVsZW1lbnQgdGhhdCB3ZXJlIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay4gVGhlIHBsYWNlaG9sZGVyXG4gKiAgIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LiBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXRcbiAqICAgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSF7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8he2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqUHJvamVjdGlvbiBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGVcbiAqICAgYmVnaW5uaW5nIGFuZCBlbmQgb2YgPG5nLWNvbnRlbnQ+IHRoYXQgd2FzIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay5cbiAqICAgVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LlxuICogICBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSp7aW5kZXh9OntibG9ja33vv71gL2Dvv70vKntpbmRleH06e2Jsb2Nrfe+/vWA6ICpTdWItdGVtcGxhdGUgUGxhY2Vob2xkZXIqOiBTdWItdGVtcGxhdGVzIG11c3QgYmVcbiAqICAgc3BsaXQgdXAgYW5kIHRyYW5zbGF0ZWQgc2VwYXJhdGVseSBpbiBlYWNoIGFuZ3VsYXIgdGVtcGxhdGUgZnVuY3Rpb24uIFRoZSBgaW5kZXhgIHBvaW50cyB0byB0aGVcbiAqICAgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbiBpbmRleC4gQSBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggb2YgdGhlIHRyYW5zbGF0aW9uIGluIHRoZSBzdGF0aWMgYmxvY2suXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgdHJhbnNsYXRpb24gbWVzc2FnZS5cbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IE9wdGlvbmFsIHN1Yi10ZW1wbGF0ZSBpbmRleCBpbiB0aGUgYG1lc3NhZ2VgLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blN0YXJ0KGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5JbmRleFN0YWNrWysraTE4bkluZGV4U3RhY2tQb2ludGVyXSA9IGluZGV4O1xuICAvLyBXZSBuZWVkIHRvIGRlbGF5IHByb2plY3Rpb25zIHVudGlsIGBpMThuRW5kYFxuICBzZXREZWxheVByb2plY3Rpb24odHJ1ZSk7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgaTE4blN0YXJ0Rmlyc3RQYXNzKGxWaWV3LCB0VmlldywgaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICB9XG59XG5cbi8vIENvdW50IGZvciB0aGUgbnVtYmVyIG9mIHZhcnMgdGhhdCB3aWxsIGJlIGFsbG9jYXRlZCBmb3IgZWFjaCBpMThuIGJsb2NrLlxuLy8gSXQgaXMgZ2xvYmFsIGJlY2F1c2UgdGhpcyBpcyB1c2VkIGluIG11bHRpcGxlIGZ1bmN0aW9ucyB0aGF0IGluY2x1ZGUgbG9vcHMgYW5kIHJlY3Vyc2l2ZSBjYWxscy5cbi8vIFRoaXMgaXMgcmVzZXQgdG8gMCB3aGVuIGBpMThuU3RhcnRGaXJzdFBhc3NgIGlzIGNhbGxlZC5cbmxldCBpMThuVmFyc0NvdW50OiBudW1iZXI7XG5cbi8qKlxuICogU2VlIGBpMThuU3RhcnRgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuU3RhcnRGaXJzdFBhc3MoXG4gICAgbFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcikge1xuICBjb25zdCBzdGFydEluZGV4ID0gdFZpZXcuYmx1ZXByaW50Lmxlbmd0aCAtIEhFQURFUl9PRkZTRVQ7XG4gIGkxOG5WYXJzQ291bnQgPSAwO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcGFyZW50VE5vZGUgPVxuICAgICAgZ2V0SXNQYXJlbnQoKSA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICBsZXQgcGFyZW50SW5kZXggPVxuICAgICAgcGFyZW50VE5vZGUgJiYgcGFyZW50VE5vZGUgIT09IGxWaWV3W1RfSE9TVF0gPyBwYXJlbnRUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQgOiBpbmRleDtcbiAgbGV0IHBhcmVudEluZGV4UG9pbnRlciA9IDA7XG4gIHBhcmVudEluZGV4U3RhY2tbcGFyZW50SW5kZXhQb2ludGVyXSA9IHBhcmVudEluZGV4O1xuICBjb25zdCBjcmVhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcyA9IFtdO1xuICAvLyBJZiB0aGUgcHJldmlvdXMgbm9kZSB3YXNuJ3QgdGhlIGRpcmVjdCBwYXJlbnQgdGhlbiB3ZSBoYXZlIGEgdHJhbnNsYXRpb24gd2l0aG91dCB0b3AgbGV2ZWxcbiAgLy8gZWxlbWVudCBhbmQgd2UgbmVlZCB0byBrZWVwIGEgcmVmZXJlbmNlIG9mIHRoZSBwcmV2aW91cyBlbGVtZW50IGlmIHRoZXJlIGlzIG9uZVxuICBpZiAoaW5kZXggPiAwICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAhPT0gcGFyZW50VE5vZGUpIHtcbiAgICAvLyBDcmVhdGUgYW4gT3BDb2RlIHRvIHNlbGVjdCB0aGUgcHJldmlvdXMgVE5vZGVcbiAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0KTtcbiAgfVxuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBjb25zdCBpY3VFeHByZXNzaW9uczogVEljdVtdID0gW107XG5cbiAgY29uc3QgdGVtcGxhdGVUcmFuc2xhdGlvbiA9IGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIGNvbnN0IG1zZ1BhcnRzID0gcmVwbGFjZU5nc3AodGVtcGxhdGVUcmFuc2xhdGlvbikuc3BsaXQoUEhfUkVHRVhQKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtc2dQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IG1zZ1BhcnRzW2ldO1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVycyAoZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMpXG4gICAgICBpZiAodmFsdWUuY2hhckF0KDApID09PSAnLycpIHtcbiAgICAgICAgLy8gSXQgaXMgYSBjbG9zaW5nIHRhZ1xuICAgICAgICBpZiAodmFsdWUuY2hhckF0KDEpID09PSBUYWdUeXBlLkVMRU1FTlQpIHtcbiAgICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDIpLCAxMCk7XG4gICAgICAgICAgcGFyZW50SW5kZXggPSBwYXJlbnRJbmRleFN0YWNrWy0tcGFyZW50SW5kZXhQb2ludGVyXTtcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2gocGhJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBoSW5kZXggPSBwYXJzZUludCh2YWx1ZS5zdWJzdHIoMSksIDEwKTtcbiAgICAgICAgLy8gVGhlIHZhbHVlIHJlcHJlc2VudHMgYSBwbGFjZWhvbGRlciB0aGF0IHdlIG1vdmUgdG8gdGhlIGRlc2lnbmF0ZWQgaW5kZXhcbiAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgcGhJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0LFxuICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICBpZiAodmFsdWUuY2hhckF0KDApID09PSBUYWdUeXBlLkVMRU1FTlQpIHtcbiAgICAgICAgICBwYXJlbnRJbmRleFN0YWNrWysrcGFyZW50SW5kZXhQb2ludGVyXSA9IHBhcmVudEluZGV4ID0gcGhJbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncyAmIElDVSBleHByZXNzaW9ucylcbiAgICAgIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHZhbHVlKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKGogJiAxKSB7XG4gICAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1Tm9kZUluZGV4ID0gc3RhcnRJbmRleCArIGkxOG5WYXJzQ291bnQrKztcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZ0Rldk1vZGUgPyBgSUNVICR7aWN1Tm9kZUluZGV4fWAgOiAnJywgaWN1Tm9kZUluZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgLy8gVXBkYXRlIGNvZGVzIGZvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBjb25zdCBpY3VFeHByZXNzaW9uID0gcGFydHNbal0gYXMgSWN1RXhwcmVzc2lvbjtcbiAgICAgICAgICBjb25zdCBtYXNrID0gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbik7XG4gICAgICAgICAgaWN1U3RhcnQoaWN1RXhwcmVzc2lvbnMsIGljdUV4cHJlc3Npb24sIGljdU5vZGVJbmRleCwgaWN1Tm9kZUluZGV4KTtcbiAgICAgICAgICAvLyBTaW5jZSB0aGlzIGlzIHJlY3Vyc2l2ZSwgdGhlIGxhc3QgVEljdSB0aGF0IHdhcyBwdXNoZWQgaXMgdGhlIG9uZSB3ZSB3YW50XG4gICAgICAgICAgY29uc3QgdEljdUluZGV4ID0gaWN1RXhwcmVzc2lvbnMubGVuZ3RoIC0gMTtcbiAgICAgICAgICB1cGRhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgICAgICAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgICAgICAtMSAtIGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcsXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLCB0SWN1SW5kZXgsXG4gICAgICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgICAyLCAgICAgLy8gc2tpcCAyIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsIHRJY3VJbmRleCk7XG4gICAgICAgIH0gZWxzZSBpZiAocGFydHNbal0gIT09ICcnKSB7XG4gICAgICAgICAgY29uc3QgdGV4dCA9IHBhcnRzW2pdIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncylcbiAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdGV4dC5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgLy8gQ3JlYXRlIHRleHQgbm9kZXNcbiAgICAgICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gc3RhcnRJbmRleCArIGkxOG5WYXJzQ291bnQrKztcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgYmluZGluZywgdGhlIHZhbHVlIHdpbGwgYmUgc2V0IGR1cmluZyB1cGRhdGVcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdGV4dCwgdGV4dE5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModGV4dCwgdGV4dE5vZGVJbmRleCksIHVwZGF0ZU9wQ29kZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChpMThuVmFyc0NvdW50ID4gMCkge1xuICAgIGFsbG9jRXhwYW5kbyhsVmlldywgaTE4blZhcnNDb3VudCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGF0dGFjaEkxOG5PcENvZGVzRGVidWcoXG4gICAgICAgICAgY3JlYXRlT3BDb2RlcywgdXBkYXRlT3BDb2RlcywgaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLCBsVmlldyk7XG5cbiAgLy8gTk9URTogbG9jYWwgdmFyIG5lZWRlZCB0byBwcm9wZXJseSBhc3NlcnQgdGhlIHR5cGUgb2YgYFRJMThuYC5cbiAgY29uc3QgdEkxOG46IFRJMThuID0ge1xuICAgIHZhcnM6IGkxOG5WYXJzQ291bnQsXG4gICAgY3JlYXRlOiBjcmVhdGVPcENvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlT3BDb2RlcyxcbiAgICBpY3VzOiBpY3VFeHByZXNzaW9ucy5sZW5ndGggPyBpY3VFeHByZXNzaW9ucyA6IG51bGwsXG4gIH07XG5cbiAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdEkxOG47XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEkxOG5Ob2RlKFxuICAgIHROb2RlOiBUTm9kZSwgcGFyZW50VE5vZGU6IFROb2RlLCBwcmV2aW91c1ROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldyk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIGNvbnN0IG5leHROb2RlID0gdE5vZGUubmV4dDtcbiAgaWYgKCFwcmV2aW91c1ROb2RlKSB7XG4gICAgcHJldmlvdXNUTm9kZSA9IHBhcmVudFROb2RlO1xuICB9XG5cbiAgLy8gUmUtb3JnYW5pemUgbm9kZSB0cmVlIHRvIHB1dCB0aGlzIG5vZGUgaW4gdGhlIGNvcnJlY3QgcG9zaXRpb24uXG4gIGlmIChwcmV2aW91c1ROb2RlID09PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcGFyZW50VE5vZGUuY2hpbGQpIHtcbiAgICB0Tm9kZS5uZXh0ID0gcGFyZW50VE5vZGUuY2hpbGQ7XG4gICAgcGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgfSBlbHNlIGlmIChwcmV2aW91c1ROb2RlICE9PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcHJldmlvdXNUTm9kZS5uZXh0KSB7XG4gICAgdE5vZGUubmV4dCA9IHByZXZpb3VzVE5vZGUubmV4dDtcbiAgICBwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICB0Tm9kZS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIGlmIChwYXJlbnRUTm9kZSAhPT0gbFZpZXdbVF9IT1NUXSkge1xuICAgIHROb2RlLnBhcmVudCA9IHBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgfVxuXG4gIC8vIElmIHROb2RlIHdhcyBtb3ZlZCBhcm91bmQsIHdlIG1pZ2h0IG5lZWQgdG8gZml4IGEgYnJva2VuIGxpbmsuXG4gIGxldCBjdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZS5uZXh0O1xuICB3aGlsZSAoY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvci5uZXh0ID09PSB0Tm9kZSkge1xuICAgICAgY3Vyc29yLm5leHQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gICAgY3Vyc29yID0gY3Vyc29yLm5leHQ7XG4gIH1cblxuICAvLyBJZiB0aGUgcGxhY2Vob2xkZXIgdG8gYXBwZW5kIGlzIGEgcHJvamVjdGlvbiwgd2UgbmVlZCB0byBtb3ZlIHRoZSBwcm9qZWN0ZWQgbm9kZXMgaW5zdGVhZFxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICBhcHBseVByb2plY3Rpb24obFZpZXcsIHROb2RlIGFzIFRQcm9qZWN0aW9uTm9kZSk7XG4gICAgcmV0dXJuIHROb2RlO1xuICB9XG5cbiAgYXBwZW5kQ2hpbGQoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIGNvbnN0IHNsb3RWYWx1ZSA9IGxWaWV3W3ROb2RlLmluZGV4XTtcbiAgaWYgKHROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBOb2RlcyB0aGF0IGluamVjdCBWaWV3Q29udGFpbmVyUmVmIGFsc28gaGF2ZSBhIGNvbW1lbnQgbm9kZSB0aGF0IHNob3VsZCBiZSBtb3ZlZFxuICAgIGFwcGVuZENoaWxkKHNsb3RWYWx1ZVtOQVRJVkVdLCB0Tm9kZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBIYW5kbGVzIG1lc3NhZ2Ugc3RyaW5nIHBvc3QtcHJvY2Vzc2luZyBmb3IgaW50ZXJuYXRpb25hbGl6YXRpb24uXG4gKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgYnkgdHJhbnNmb3JtaW5nIGl0IGZyb20gaW50ZXJtZWRpYXRlXG4gKiBmb3JtYXQgKHRoYXQgbWlnaHQgY29udGFpbiBzb21lIG1hcmtlcnMgdGhhdCB3ZSBuZWVkIHRvIHJlcGxhY2UpIHRvIHRoZSBmaW5hbFxuICogZm9ybSwgY29uc3VtYWJsZSBieSBpMThuU3RhcnQgaW5zdHJ1Y3Rpb24uIFBvc3QgcHJvY2Vzc2luZyBzdGVwcyBpbmNsdWRlOlxuICpcbiAqIDEuIFJlc29sdmUgYWxsIG11bHRpLXZhbHVlIGNhc2VzIChsaWtlIFvvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9fO+/vTXvv71dKVxuICogMi4gUmVwbGFjZSBhbGwgSUNVIHZhcnMgKGxpa2UgXCJWQVJfUExVUkFMXCIpXG4gKiAzLiBSZXBsYWNlIGFsbCBwbGFjZWhvbGRlcnMgdXNlZCBpbnNpZGUgSUNVcyBpbiBhIGZvcm0gb2Yge1BMQUNFSE9MREVSfVxuICogNC4gUmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KVxuICogICAgaW4gY2FzZSBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFJhdyB0cmFuc2xhdGlvbiBzdHJpbmcgZm9yIHBvc3QgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHJlcGxhY2VtZW50cyBTZXQgb2YgcmVwbGFjZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWRcbiAqXG4gKiBAcmV0dXJucyBUcmFuc2Zvcm1lZCBzdHJpbmcgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuUG9zdHByb2Nlc3MoXG4gICAgbWVzc2FnZTogc3RyaW5nLCByZXBsYWNlbWVudHM6IHtba2V5OiBzdHJpbmddOiAoc3RyaW5nIHwgc3RyaW5nW10pfSA9IHt9KTogc3RyaW5nIHtcbiAgLyoqXG4gICAqIFN0ZXAgMTogcmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgcGxhY2Vob2xkZXJzIGxpa2UgW++/vSM177+9fO+/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71dXG4gICAqXG4gICAqIE5vdGU6IGR1ZSB0byB0aGUgd2F5IHdlIHByb2Nlc3MgbmVzdGVkIHRlbXBsYXRlcyAoQkZTKSwgbXVsdGktdmFsdWUgcGxhY2Vob2xkZXJzIGFyZSB0eXBpY2FsbHlcbiAgICogZ3JvdXBlZCBieSB0ZW1wbGF0ZXMsIGZvciBleGFtcGxlOiBb77+9IzXvv71877+9Izbvv71877+9IzE6Me+/vXzvv70jMzoy77+9XSB3aGVyZSDvv70jNe+/vSBhbmQg77+9Izbvv70gYmVsb25nIHRvIHJvb3RcbiAgICogdGVtcGxhdGUsIO+/vSMxOjHvv70gYmVsb25nIHRvIG5lc3RlZCB0ZW1wbGF0ZSB3aXRoIGluZGV4IDEgYW5kIO+/vSMxOjLvv70gLSBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleFxuICAgKiAzLiBIb3dldmVyIGluIHJlYWwgdGVtcGxhdGVzIHRoZSBvcmRlciBtaWdodCBiZSBkaWZmZXJlbnQ6IGkuZS4g77+9IzE6Me+/vSBhbmQvb3Ig77+9IzM6Mu+/vSBtYXkgZ28gaW5cbiAgICogZnJvbnQgb2Yg77+9Izbvv70uIFRoZSBwb3N0IHByb2Nlc3Npbmcgc3RlcCByZXN0b3JlcyB0aGUgcmlnaHQgb3JkZXIgYnkga2VlcGluZyB0cmFjayBvZiB0aGVcbiAgICogdGVtcGxhdGUgaWQgc3RhY2sgYW5kIGxvb2tzIGZvciBwbGFjZWhvbGRlcnMgdGhhdCBiZWxvbmcgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgdGVtcGxhdGUuXG4gICAqL1xuICBsZXQgcmVzdWx0OiBzdHJpbmcgPSBtZXNzYWdlO1xuICBpZiAoUFBfTVVMVElfVkFMVUVfUExBQ0VIT0xERVJTX1JFR0VYUC50ZXN0KG1lc3NhZ2UpKSB7XG4gICAgY29uc3QgbWF0Y2hlczoge1trZXk6IHN0cmluZ106IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXX0gPSB7fTtcbiAgICBjb25zdCB0ZW1wbGF0ZUlkc1N0YWNrOiBudW1iZXJbXSA9IFtST09UX1RFTVBMQVRFX0lEXTtcbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9QTEFDRUhPTERFUlNfUkVHRVhQLCAobTogYW55LCBwaHM6IHN0cmluZywgdG1wbDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBwaHMgfHwgdG1wbDtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdID0gbWF0Y2hlc1tjb250ZW50XSB8fCBbXTtcbiAgICAgIGlmICghcGxhY2Vob2xkZXJzLmxlbmd0aCkge1xuICAgICAgICBjb250ZW50LnNwbGl0KCd8JykuZm9yRWFjaCgocGxhY2Vob2xkZXI6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gcGxhY2Vob2xkZXIubWF0Y2goUFBfVEVNUExBVEVfSURfUkVHRVhQKTtcbiAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUlkID0gbWF0Y2ggPyBwYXJzZUludChtYXRjaFsxXSwgMTApIDogUk9PVF9URU1QTEFURV9JRDtcbiAgICAgICAgICBjb25zdCBpc0Nsb3NlVGVtcGxhdGVUYWcgPSBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAudGVzdChwbGFjZWhvbGRlcik7XG4gICAgICAgICAgcGxhY2Vob2xkZXJzLnB1c2goW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZXNbY29udGVudF0gPSBwbGFjZWhvbGRlcnM7XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxhY2Vob2xkZXJzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBwbGFjZWhvbGRlciAtICR7Y29udGVudH1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVudFRlbXBsYXRlSWQgPSB0ZW1wbGF0ZUlkc1N0YWNrW3RlbXBsYXRlSWRzU3RhY2subGVuZ3RoIC0gMV07XG4gICAgICBsZXQgaWR4ID0gMDtcbiAgICAgIC8vIGZpbmQgcGxhY2Vob2xkZXIgaW5kZXggdGhhdCBtYXRjaGVzIGN1cnJlbnQgdGVtcGxhdGUgaWRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhY2Vob2xkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwbGFjZWhvbGRlcnNbaV1bMF0gPT09IGN1cnJlbnRUZW1wbGF0ZUlkKSB7XG4gICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIHRlbXBsYXRlIGlkIHN0YWNrIGJhc2VkIG9uIHRoZSBjdXJyZW50IHRhZyBleHRyYWN0ZWRcbiAgICAgIGNvbnN0IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSA9IHBsYWNlaG9sZGVyc1tpZHhdO1xuICAgICAgaWYgKGlzQ2xvc2VUZW1wbGF0ZVRhZykge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGVtcGxhdGVJZCAhPT0gdGVtcGxhdGVJZCkge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnB1c2godGVtcGxhdGVJZCk7XG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgcHJvY2Vzc2VkIHRhZyBmcm9tIHRoZSBsaXN0XG4gICAgICBwbGFjZWhvbGRlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfSk7XG4gIH1cblxuICAvLyByZXR1cm4gY3VycmVudCByZXN1bHQgaWYgbm8gcmVwbGFjZW1lbnRzIHNwZWNpZmllZFxuICBpZiAoIU9iamVjdC5rZXlzKHJlcGxhY2VtZW50cykubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGVwIDI6IHJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVX1ZBUlNfUkVHRVhQLCAobWF0Y2gsIHN0YXJ0LCBrZXksIF90eXBlLCBfaWR4LCBlbmQpOiBzdHJpbmcgPT4ge1xuICAgIHJldHVybiByZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSA/IGAke3N0YXJ0fSR7cmVwbGFjZW1lbnRzW2tleV19JHtlbmR9YCA6IG1hdGNoO1xuICB9KTtcblxuICAvKipcbiAgICogU3RlcCAzOiByZXBsYWNlIGFsbCBwbGFjZWhvbGRlcnMgdXNlZCBpbnNpZGUgSUNVcyBpbiBhIGZvcm0gb2Yge1BMQUNFSE9MREVSfVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVX1BMQUNFSE9MREVSU19SRUdFWFAsIChtYXRjaCwga2V5KTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyByZXBsYWNlbWVudHNba2V5XSBhcyBzdHJpbmcgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgNDogcmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KSBpbiBjYXNlXG4gICAqIG11bHRpcGxlIElDVXMgaGF2ZSB0aGUgc2FtZSBwbGFjZWhvbGRlciBuYW1lXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VTX1JFR0VYUCwgKG1hdGNoLCBrZXkpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChyZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgbGlzdCA9IHJlcGxhY2VtZW50c1trZXldIGFzIHN0cmluZ1tdO1xuICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBJQ1UgLSAke21hdGNofSB3aXRoIGtleTogJHtrZXl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGlzdC5zaGlmdCgpICE7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgbWFya2VkIGJ5IGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAuIEl0IGluc2VydHMgdGhlIHRleHQvSUNVIG5vZGVzXG4gKiBpbnRvIHRoZSByZW5kZXIgdHJlZSwgbW92ZXMgdGhlIHBsYWNlaG9sZGVyIG5vZGVzIGFuZCByZW1vdmVzIHRoZSBkZWxldGVkIG5vZGVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkVuZCgpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuRW5kRmlyc3RQYXNzKGxWaWV3LCB0Vmlldyk7XG4gIC8vIFN0b3AgZGVsYXlpbmcgcHJvamVjdGlvbnNcbiAgc2V0RGVsYXlQcm9qZWN0aW9uKGZhbHNlKTtcbn1cblxuLyoqXG4gKiBTZWUgYGkxOG5FbmRgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuRW5kRmlyc3RQYXNzKGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3KSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBnZXRCaW5kaW5nSW5kZXgoKSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2kxOG5FbmQgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcblxuICBjb25zdCByb290SW5kZXggPSBpMThuSW5kZXhTdGFja1tpMThuSW5kZXhTdGFja1BvaW50ZXItLV07XG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtyb290SW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUSTE4bjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEkxOG4sIGBZb3Ugc2hvdWxkIGNhbGwgaTE4blN0YXJ0IGJlZm9yZSBpMThuRW5kYCk7XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBub2RlIHRoYXQgd2FzIGFkZGVkIGJlZm9yZSBgaTE4bkVuZGBcbiAgY29uc3QgbGFzdENyZWF0ZWROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG5cbiAgLy8gUmVhZCB0aGUgaW5zdHJ1Y3Rpb25zIHRvIGluc2VydC9tb3ZlL3JlbW92ZSBET00gZWxlbWVudHNcbiAgY29uc3QgdmlzaXRlZE5vZGVzID0gcmVhZENyZWF0ZU9wQ29kZXMocm9vdEluZGV4LCB0STE4bi5jcmVhdGUsIGxWaWV3KTtcblxuICAvLyBSZW1vdmUgZGVsZXRlZCBub2Rlc1xuICBsZXQgaW5kZXggPSByb290SW5kZXggKyAxO1xuICB3aGlsZSAoaW5kZXggPD0gbGFzdENyZWF0ZWROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCkge1xuICAgIGlmICh2aXNpdGVkTm9kZXMuaW5kZXhPZihpbmRleCkgPT09IC0xKSB7XG4gICAgICByZW1vdmVOb2RlKGluZGV4LCBsVmlldywgLyogbWFya0FzRGV0YWNoZWQgKi8gdHJ1ZSk7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIGFuIGVsZW1lbnQgaGFzIGFueSBsb2NhbCByZWZzIGFuZCBza2lwIHRoZW1cbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gICAgaWYgKHROb2RlICYmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgJiZcbiAgICAgICAgdE5vZGUubG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgICAgLy8gRGl2aWRlIGJ5IDIgdG8gZ2V0IHRoZSBudW1iZXIgb2YgbG9jYWwgcmVmcyxcbiAgICAgIC8vIHNpbmNlIHRoZXkgYXJlIHN0b3JlZCBhcyBhbiBhcnJheSB0aGF0IGFsc28gaW5jbHVkZXMgZGlyZWN0aXZlIGluZGV4ZXMsXG4gICAgICAvLyBpLmUuIFtcImxvY2FsUmVmXCIsIGRpcmVjdGl2ZUluZGV4LCAuLi5dXG4gICAgICBpbmRleCArPSB0Tm9kZS5sb2NhbE5hbWVzLmxlbmd0aCA+PiAxO1xuICAgIH1cbiAgICBpbmRleCsrO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgc3RvcmVzIHRoZSBkeW5hbWljIFROb2RlLCBhbmQgdW5ob29rcyBpdCBmcm9tIHRoZSB0cmVlIGZvciBub3cuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsKTogVEVsZW1lbnROb2RlfFRJY3VDb250YWluZXJOb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IG5hdGl2ZTtcbiAgY29uc3QgdE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIHR5cGUgYXMgYW55LCBuYW1lLCBudWxsKTtcblxuICAvLyBXZSBhcmUgY3JlYXRpbmcgYSBkeW5hbWljIG5vZGUsIHRoZSBwcmV2aW91cyB0Tm9kZSBtaWdodCBub3QgYmUgcG9pbnRpbmcgYXQgdGhpcyBub2RlLlxuICAvLyBXZSB3aWxsIGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUgbGF0ZXIgd2l0aCBgYXBwZW5kSTE4bk5vZGVgLlxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID09PSB0Tm9kZSkge1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZnVuY3Rpb24gcmVhZENyZWF0ZU9wQ29kZXMoXG4gICAgaW5kZXg6IG51bWJlciwgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMsIGxWaWV3OiBMVmlldyk6IG51bWJlcltdIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGxldCBjdXJyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHZpc2l0ZWROb2RlczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUob3BDb2RlLCByZW5kZXJlcik7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIGN1cnJlbnRUTm9kZSA9XG4gICAgICAgICAgY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KGxWaWV3LCB0ZXh0Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dFJOb2RlLCBudWxsKTtcbiAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKHRleHROb2RlSW5kZXgpO1xuICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvblROb2RlOiBUTm9kZTtcbiAgICAgICAgICBpZiAoZGVzdGluYXRpb25Ob2RlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGVzdGluYXRpb24gbm9kZSBpcyBgaTE4blN0YXJ0YCwgd2UgZG9uJ3QgaGF2ZSBhXG4gICAgICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZSBhbmQgd2Ugc2hvdWxkIHVzZSB0aGUgaG9zdCBub2RlIGluc3RlYWRcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBsVmlld1tUX0hPU1RdICE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBnZXRUTm9kZShkZXN0aW5hdGlvbk5vZGVJbmRleCwgbFZpZXcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRUTm9kZSAhLFxuICAgICAgICAgICAgICAgICAgYFlvdSBuZWVkIHRvIGNyZWF0ZSBvciBzZWxlY3QgYSBub2RlIGJlZm9yZSB5b3UgY2FuIGluc2VydCBpdCBpbnRvIHRoZSBET01gKTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gYXBwZW5kSTE4bk5vZGUoY3VycmVudFROb2RlICEsIGRlc3RpbmF0aW9uVE5vZGUsIHByZXZpb3VzVE5vZGUsIGxWaWV3KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKG5vZGVJbmRleCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICBpZiAoY3VycmVudFROb2RlKSB7XG4gICAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlLCBjdXJyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgY29uc3QgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBUaGlzIGNvZGUgaXMgdXNlZCBmb3IgSUNVIGV4cHJlc3Npb25zIG9ubHksIHNpbmNlIHdlIGRvbid0IHN1cHBvcnRcbiAgICAgICAgICAvLyBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaW4gSUNVcywgd2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpbnB1dHMgaGVyZVxuICAgICAgICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChlbGVtZW50Tm9kZUluZGV4LCBhdHRyTmFtZSwgYXR0clZhbHVlLCBsVmlldyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb21tZW50VmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHtjb21tZW50VmFsdWV9XCIgdG8gYmUgYSBjb21tZW50IG5vZGUgdmFsdWVgKTtcbiAgICAgICAgICBjb25zdCBjb21tZW50Uk5vZGUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KGNvbW1lbnRWYWx1ZSk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgbFZpZXcsIGNvbW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5JY3VDb250YWluZXIsIGNvbW1lbnRSTm9kZSwgbnVsbCk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goY29tbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbW1lbnRSTm9kZSwgbFZpZXcpO1xuICAgICAgICAgIChjdXJyZW50VE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUpLmFjdGl2ZUNhc2VJbmRleCA9IG51bGw7XG4gICAgICAgICAgLy8gV2Ugd2lsbCBhZGQgdGhlIGNhc2Ugbm9kZXMgbGF0ZXIsIGR1cmluZyB0aGUgdXBkYXRlIHBoYXNlXG4gICAgICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIGxWaWV3LCBlbGVtZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgZWxlbWVudFJOb2RlLCB0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGVsZW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0SXNOb3RQYXJlbnQoKTtcblxuICByZXR1cm4gdmlzaXRlZE5vZGVzO1xufVxuXG5mdW5jdGlvbiByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCwgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsXG4gICAgY2hhbmdlTWFzazogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcsIGJ5cGFzc0NoZWNrQml0ID0gZmFsc2UpIHtcbiAgbGV0IGNhc2VDcmVhdGVkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdXBkYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICBjb25zdCBjaGVja0JpdCA9IHVwZGF0ZU9wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgY29uc3Qgc2tpcENvZGVzID0gdXBkYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICBpZiAoYnlwYXNzQ2hlY2tCaXQgfHwgKGNoZWNrQml0ICYgY2hhbmdlTWFzaykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2hlY2tlZFxuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgYmluZGluZyBpbmRleCB3aG9zZSB2YWx1ZSBpcyBuZWdhdGl2ZVxuICAgICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KHZpZXdEYXRhW2JpbmRpbmdzU3RhcnRJbmRleCAtIG9wQ29kZV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBsZXQgaWN1VE5vZGU6IFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIFNhbml0aXplckZuIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbCh2aWV3RGF0YSwgbm9kZUluZGV4LCBwcm9wTmFtZSwgdmFsdWUsIHNhbml0aXplRm4pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuVGV4dDpcbiAgICAgICAgICAgICAgICB0ZXh0QmluZGluZ0ludGVybmFsKHZpZXdEYXRhLCBub2RlSW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSB1cGRhdGVPcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGFjdGl2ZSBjYXNlLCBkZWxldGUgdGhlIG9sZCBub2Rlc1xuICAgICAgICAgICAgICAgIGlmIChpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUNvZGVzID0gdEljdS5yZW1vdmVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcmVtb3ZlQ29kZXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlT3BDb2RlID0gcmVtb3ZlQ29kZXNba10gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlbW92ZU9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBET00gZWxlbWVudCwgYnV0IGRvICpub3QqIG1hcmsgVE5vZGUgYXMgZGV0YWNoZWQsIHNpbmNlIHdlIGFyZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBzd2l0Y2hpbmcgSUNVIGNhc2VzICh3aGlsZSBrZWVwaW5nIHRoZSBzYW1lIFROb2RlKSwgc28gYSBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVwcmVzZW50aW5nIGEgbmV3IElDVSBjYXNlIHdpbGwgYmUgcmUtY3JlYXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZU5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSwgLyogbWFya0FzRGV0YWNoZWQgKi8gZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQ29kZXNbayArIDFdIGFzIG51bWJlciA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VUTm9kZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0VE5vZGUobmVzdGVkSWN1Tm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVJbmRleCA9IG5lc3RlZEljdVROb2RlLmFjdGl2ZUNhc2VJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VUSW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRUSWN1ID0gaWN1cyAhW25lc3RlZEljdVRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkobmVzdGVkVEljdS5yZW1vdmVbYWN0aXZlSW5kZXhdLCByZW1vdmVDb2Rlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgYWN0aXZlIGNhc2VJbmRleFxuICAgICAgICAgICAgICAgIGNvbnN0IGNhc2VJbmRleCA9IGdldENhc2VJbmRleCh0SWN1LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ID0gY2FzZUluZGV4ICE9PSAtMSA/IGNhc2VJbmRleCA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIG5vZGVzIGZvciB0aGUgbmV3IGNhc2VcbiAgICAgICAgICAgICAgICByZWFkQ3JlYXRlT3BDb2RlcygtMSwgdEljdS5jcmVhdGVbY2FzZUluZGV4XSwgdmlld0RhdGEpO1xuICAgICAgICAgICAgICAgIGNhc2VDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSB1cGRhdGVPcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgIHJlYWRVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICB0SWN1LnVwZGF0ZVtpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggIV0sIGljdXMsIGJpbmRpbmdzU3RhcnRJbmRleCwgY2hhbmdlTWFzayxcbiAgICAgICAgICAgICAgICAgICAgdmlld0RhdGEsIGNhc2VDcmVhdGVkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaSArPSBza2lwQ29kZXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlTm9kZShpbmRleDogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcsIG1hcmtBc0RldGFjaGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHJlbW92ZWRQaFROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIHZpZXdEYXRhKTtcbiAgY29uc3QgcmVtb3ZlZFBoUk5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSk7XG4gIGlmIChyZW1vdmVkUGhSTm9kZSkge1xuICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCByZW1vdmVkUGhSTm9kZSk7XG4gIH1cblxuICBjb25zdCBzbG90VmFsdWUgPSBsb2FkKHZpZXdEYXRhLCBpbmRleCkgYXMgUkVsZW1lbnQgfCBSQ29tbWVudCB8IExDb250YWluZXI7XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBzbG90VmFsdWUgYXMgTENvbnRhaW5lcjtcbiAgICBpZiAocmVtb3ZlZFBoVE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgbmF0aXZlUmVtb3ZlTm9kZSh2aWV3RGF0YVtSRU5ERVJFUl0sIGxDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG1hcmtBc0RldGFjaGVkKSB7XG4gICAgLy8gRGVmaW5lIHRoaXMgbm9kZSBhcyBkZXRhY2hlZCB0byBhdm9pZCBwcm9qZWN0aW5nIGl0IGxhdGVyXG4gICAgcmVtb3ZlZFBoVE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0RldGFjaGVkO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG59XG5cbi8qKlxuICpcbiAqIFVzZSB0aGlzIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRyYW5zbGF0aW9uIGJsb2NrIHRoYXQgZG9lc24ndCBjb250YWluIGFueSBwbGFjZWhvbGRlci5cbiAqIEl0IGNhbGxzIGJvdGgge0BsaW5rIGkxOG5TdGFydH0gYW5kIHtAbGluayBpMThuRW5kfSBpbiBvbmUgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG4oaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIMm1ybVpMThuU3RhcnQoaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICDJtcm1aTE4bkVuZCgpO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgbGlzdCBvZiBhdHRyaWJ1dGVzIGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggaW4gdGhlIHN0YXRpYyBibG9ja1xuICogQHBhcmFtIHZhbHVlc1xuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkF0dHJpYnV0ZXMoaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKGxWaWV3LCB0VmlldywgaW5kZXgsIHZhbHVlcyk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuQXR0cmlidXRlc2AgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnRJbmRleCA9IHByZXZpb3VzRWxlbWVudC5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG4gICAgY29uc3QgcGFydHMgPSBtZXNzYWdlLnNwbGl0KElDVV9SRUdFWFApO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFydHNbal07XG5cbiAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lDVSBleHByZXNzaW9ucyBhcmUgbm90IHlldCBzdXBwb3J0ZWQgaW4gYXR0cmlidXRlcycpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIXZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShwcmV2aW91c0VsZW1lbnRJbmRleCwgbFZpZXcpO1xuICAgICAgICAgIC8vIFNldCBhdHRyaWJ1dGVzIGZvciBFbGVtZW50cyBvbmx5LCBmb3Igb3RoZXIgdHlwZXMgKGxpa2UgRWxlbWVudENvbnRhaW5lciksXG4gICAgICAgICAgLy8gb25seSBzZXQgaW5wdXRzIGJlbG93XG4gICAgICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwocHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lLCB2YWx1ZSwgbFZpZXcpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGF0IGF0dHJpYnV0ZSBpcyBhIGRpcmVjdGl2ZSBpbnB1dFxuICAgICAgICAgIGNvbnN0IGRhdGFWYWx1ZSA9IHROb2RlLmlucHV0cyAmJiB0Tm9kZS5pbnB1dHNbYXR0ck5hbWVdO1xuICAgICAgICAgIGlmIChkYXRhVmFsdWUpIHtcbiAgICAgICAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgocHJldmlvdXNFbGVtZW50SW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICAgICAgICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHVwZGF0ZU9wQ29kZXM7XG4gIH1cbn1cblxubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5sZXQgc2hpZnRzQ291bnRlciA9IDA7XG5cbi8qKlxuICogU3RvcmVzIHRoZSB2YWx1ZXMgb2YgdGhlIGJpbmRpbmdzIGR1cmluZyBlYWNoIHVwZGF0ZSBjeWNsZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0b1xuICogdXBkYXRlIHRoZSB0cmFuc2xhdGVkIG5vZGVzLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgYmluZGluZydzIHZhbHVlXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBpMThuRXhwKGN0eC5uYW1lKShjdHgudGl0bGUpYClcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FeHA8VD4odmFsdWU6IFQpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIG5leHRCaW5kaW5nSW5kZXgoKSwgdmFsdWUpKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG4gIHJldHVybiDJtcm1aTE4bkV4cDtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgb3IgYW4gaTE4biBhdHRyaWJ1dGUgd2hlbiB0aGUgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiBlaXRoZXIge0BsaW5rIGkxOG5TdGFydH0gKHRyYW5zbGF0aW9uIGJsb2NrKSBvciB7QGxpbmsgaTE4bkF0dHJpYnV0ZXN9XG4gKiAoaTE4biBhdHRyaWJ1dGUpIG9uIHdoaWNoIGl0IHNob3VsZCB1cGRhdGUgdGhlIGNvbnRlbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuQXBwbHkoaW5kZXg6IG51bWJlcikge1xuICBpZiAoc2hpZnRzQ291bnRlcikge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gICAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG4gICAgbGV0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIGxldCBpY3VzOiBUSWN1W118bnVsbCA9IG51bGw7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodEkxOG4pKSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gdEkxOG4gYXMgSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZU9wQ29kZXMgPSAodEkxOG4gYXMgVEkxOG4pLnVwZGF0ZTtcbiAgICAgIGljdXMgPSAodEkxOG4gYXMgVEkxOG4pLmljdXM7XG4gICAgfVxuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRJbmRleCA9IGdldEJpbmRpbmdJbmRleCgpIC0gc2hpZnRzQ291bnRlciAtIDE7XG4gICAgcmVhZFVwZGF0ZU9wQ29kZXModXBkYXRlT3BDb2RlcywgaWN1cywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrLCBsVmlldyk7XG5cbiAgICAvLyBSZXNldCBjaGFuZ2VNYXNrICYgbWFza0JpdCB0byBkZWZhdWx0IGZvciB0aGUgbmV4dCB1cGRhdGUgY3ljbGVcbiAgICBjaGFuZ2VNYXNrID0gMGIwO1xuICAgIHNoaWZ0c0NvdW50ZXIgPSAwO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2FzZSBvZiBhbiBJQ1UgZXhwcmVzc2lvbiBkZXBlbmRpbmcgb24gdGhlIG1haW4gYmluZGluZyB2YWx1ZVxuICpcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gYmluZGluZ1ZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgbWFpbiBiaW5kaW5nIHVzZWQgYnkgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBnZXRDYXNlSW5kZXgoaWN1RXhwcmVzc2lvbjogVEljdSwgYmluZGluZ1ZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoYmluZGluZ1ZhbHVlKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHN3aXRjaCAoaWN1RXhwcmVzc2lvbi50eXBlKSB7XG4gICAgICBjYXNlIEljdVR5cGUucGx1cmFsOiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQ2FzZSA9IGdldFBsdXJhbENhc2UoYmluZGluZ1ZhbHVlLCBnZXRMb2NhbGVJZCgpKTtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YocmVzb2x2ZWRDYXNlKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiByZXNvbHZlZENhc2UgIT09ICdvdGhlcicpIHtcbiAgICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgSWN1VHlwZS5zZWxlY3Q6IHtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgZm9yIElDVSBleHByZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gc3RhcnRJbmRleFxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIGljdVN0YXJ0KFxuICAgIHRJY3VzOiBUSWN1W10sIGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIHN0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNyZWF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHJlbW92ZUNvZGVzID0gW107XG4gIGNvbnN0IHVwZGF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHZhcnMgPSBbXTtcbiAgY29uc3QgY2hpbGRJY3VzOiBudW1iZXJbXVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBFYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MgJiBvdGhlciBJQ1UgZXhwcmVzc2lvbnNcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGNvbnN0IG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBJdCBpcyBhbiBuZXN0ZWQgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgY29uc3QgaWN1SW5kZXggPSBuZXN0ZWRJY3VzLnB1c2godmFsdWUgYXMgSWN1RXhwcmVzc2lvbikgLSAxO1xuICAgICAgICAvLyBSZXBsYWNlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbiBieSBhIGNvbW1lbnQgbm9kZVxuICAgICAgICB2YWx1ZUFycltqXSA9IGA8IS0t77+9JHtpY3VJbmRleH3vv70tLT5gO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBpY3VDYXNlOiBJY3VDYXNlID1cbiAgICAgICAgcGFyc2VJY3VDYXNlKHZhbHVlQXJyLmpvaW4oJycpLCBzdGFydEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgIGNyZWF0ZUNvZGVzLnB1c2goaWN1Q2FzZS5jcmVhdGUpO1xuICAgIHJlbW92ZUNvZGVzLnB1c2goaWN1Q2FzZS5yZW1vdmUpO1xuICAgIHVwZGF0ZUNvZGVzLnB1c2goaWN1Q2FzZS51cGRhdGUpO1xuICAgIHZhcnMucHVzaChpY3VDYXNlLnZhcnMpO1xuICAgIGNoaWxkSWN1cy5wdXNoKGljdUNhc2UuY2hpbGRJY3VzKTtcbiAgfVxuICBjb25zdCB0SWN1OiBUSWN1ID0ge1xuICAgIHR5cGU6IGljdUV4cHJlc3Npb24udHlwZSxcbiAgICB2YXJzLFxuICAgIGNoaWxkSWN1cyxcbiAgICBjYXNlczogaWN1RXhwcmVzc2lvbi5jYXNlcyxcbiAgICBjcmVhdGU6IGNyZWF0ZUNvZGVzLFxuICAgIHJlbW92ZTogcmVtb3ZlQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVDb2Rlc1xuICB9O1xuICB0SWN1cy5wdXNoKHRJY3UpO1xuICAvLyBBZGRpbmcgdGhlIG1heGltdW0gcG9zc2libGUgb2YgdmFycyBuZWVkZWQgKGJhc2VkIG9uIHRoZSBjYXNlcyB3aXRoIHRoZSBtb3N0IHZhcnMpXG4gIGkxOG5WYXJzQ291bnQgKz0gTWF0aC5tYXgoLi4udmFycyk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIHN0cmluZyB0ZW1wbGF0ZSBpbnRvIGFuIEhUTUwgdGVtcGxhdGUgYW5kIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB1cGRhdGVcbiAqIGF0dHJpYnV0ZXMgb3Igbm9kZXMgdGhhdCBjb250YWluIGJpbmRpbmdzLlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIFRoZSBzdHJpbmcgdG8gcGFyc2VcbiAqIEBwYXJhbSBwYXJlbnRJbmRleFxuICogQHBhcmFtIG5lc3RlZEljdXNcbiAqIEBwYXJhbSB0SWN1c1xuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIHBhcnNlSWN1Q2FzZShcbiAgICB1bnNhZmVIdG1sOiBzdHJpbmcsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSwgdEljdXM6IFRJY3VbXSxcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogSWN1Q2FzZSB7XG4gIGNvbnN0IGluZXJ0Qm9keUhlbHBlciA9IG5ldyBJbmVydEJvZHlIZWxwZXIoZG9jdW1lbnQpO1xuICBjb25zdCBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gIGlmICghaW5lcnRCb2R5RWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGdlbmVyYXRlIGluZXJ0IGJvZHkgZWxlbWVudCcpO1xuICB9XG4gIGNvbnN0IHdyYXBwZXIgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCAhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gIGNvbnN0IG9wQ29kZXM6IEljdUNhc2UgPSB7dmFyczogMCwgY2hpbGRJY3VzOiBbXSwgY3JlYXRlOiBbXSwgcmVtb3ZlOiBbXSwgdXBkYXRlOiBbXX07XG4gIHBhcnNlTm9kZXMod3JhcHBlci5maXJzdENoaWxkLCBvcENvZGVzLCBwYXJlbnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgcmV0dXJuIG9wQ29kZXM7XG59XG5cbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICogQHBhcmFtIGN1cnJlbnROb2RlIFRoZSBmaXJzdCBub2RlIHRvIHBhcnNlXG4gKiBAcGFyYW0gaWN1Q2FzZSBUaGUgZGF0YSBmb3IgdGhlIElDVSBleHByZXNzaW9uIGNhc2UgdGhhdCBjb250YWlucyB0aG9zZSBub2Rlc1xuICogQHBhcmFtIHBhcmVudEluZGV4IEluZGV4IG9mIHRoZSBjdXJyZW50IG5vZGUncyBwYXJlbnRcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzIERhdGEgZm9yIHRoZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb25zIHRoYXQgdGhpcyBjYXNlIGNvbnRhaW5zXG4gKiBAcGFyYW0gdEljdXMgRGF0YSBmb3IgYWxsIElDVSBleHByZXNzaW9ucyBvZiB0aGUgY3VycmVudCBtZXNzYWdlXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXggRXhwYW5kbyBzdGFydCBpbmRleCBmb3IgdGhlIGN1cnJlbnQgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gcGFyc2VOb2RlcyhcbiAgICBjdXJyZW50Tm9kZTogTm9kZSB8IG51bGwsIGljdUNhc2U6IEljdUNhc2UsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSxcbiAgICB0SWN1czogVEljdVtdLCBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5lc3RlZEljdXNUb0NyZWF0ZTogW0ljdUV4cHJlc3Npb24sIG51bWJlcl1bXSA9IFtdO1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgICAgY29uc3QgbmV4dE5vZGU6IE5vZGV8bnVsbCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBleHBhbmRvU3RhcnRJbmRleCArICsraWN1Q2FzZS52YXJzO1xuICAgICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGEgdmFsaWQgZWxlbWVudCwgd2Ugd29uJ3QgY3JlYXRlIGFuIGVsZW1lbnQgZm9yIGl0XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSAhO1xuICAgICAgICAgICAgICBjb25zdCBsb3dlckF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIWF0dHIudmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIGlucHV0IHN0cmluZyBpcyBzYWZlLCB1bmxlc3MgaXQncyB1c2luZyBhIGJpbmRpbmdcbiAgICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXJBdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgX3Nhbml0aXplVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIHNhbml0aXplU3Jjc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGBXQVJOSU5HOiBpZ25vcmluZyB1bnNhZmUgYXR0cmlidXRlIHZhbHVlICR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAke3RhZ05hbWV9IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuQXR0ciwgYXR0ci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGNoaWxkcmVuIG9mIHRoaXMgbm9kZSAoaWYgYW55KVxuICAgICAgICAgICAgcGFyc2VOb2RlcyhcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5maXJzdENoaWxkLCBpY3VDYXNlLCBuZXdJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcGFyZW50IG5vZGUgYWZ0ZXIgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdmFsdWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgbmV3SW5kZXgpLCBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21tZW50IG5vZGUgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBuZXN0ZWQgSUNVXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBORVNURURfSUNVLmV4ZWMoY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJycpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1SW5kZXggPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgY29uc3QgbmV3TG9jYWwgPSBuZ0Rldk1vZGUgPyBgbmVzdGVkIElDVSAke25lc3RlZEljdUluZGV4fWAgOiAnJztcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZXdMb2NhbCwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNbbmVzdGVkSWN1SW5kZXhdO1xuICAgICAgICAgICAgbmVzdGVkSWN1c1RvQ3JlYXRlLnB1c2goW25lc3RlZEljdSwgbmV3SW5kZXhdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBjb21tZW50XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBlbGVtZW50XG4gICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IG5leHROb2RlICE7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWRJY3VzVG9DcmVhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVswXTtcbiAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVsxXTtcbiAgICAgIGljdVN0YXJ0KHRJY3VzLCBuZXN0ZWRJY3UsIG5lc3RlZEljdU5vZGVJbmRleCwgZXhwYW5kb1N0YXJ0SW5kZXggKyBpY3VDYXNlLnZhcnMpO1xuICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgY29uc3QgbmVzdFRJY3VJbmRleCA9IHRJY3VzLmxlbmd0aCAtIDE7XG4gICAgICBpY3VDYXNlLnZhcnMgKz0gTWF0aC5tYXgoLi4udEljdXNbbmVzdFRJY3VJbmRleF0udmFycyk7XG4gICAgICBpY3VDYXNlLmNoaWxkSWN1cy5wdXNoKG5lc3RUSWN1SW5kZXgpO1xuICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKG5lc3RlZEljdSk7XG4gICAgICBpY3VDYXNlLnVwZGF0ZS5wdXNoKFxuICAgICAgICAgIHRvTWFza0JpdChuZXN0ZWRJY3UubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIC0xIC0gbmVzdGVkSWN1Lm1haW5CaW5kaW5nLFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgsXG4gICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCk7XG4gICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdSxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQW5ndWxhciBEYXJ0IGludHJvZHVjZWQgJm5nc3A7IGFzIGEgcGxhY2Vob2xkZXIgZm9yIG5vbi1yZW1vdmFibGUgc3BhY2UsIHNlZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJ0LWxhbmcvYW5ndWxhci9ibG9iLzBiYjYxMTM4N2QyOWQ2NWI1YWY3ZjlkMjUxNWFiNTcxZmQzZmJlZTQvX3Rlc3RzL3Rlc3QvY29tcGlsZXIvcHJlc2VydmVfd2hpdGVzcGFjZV90ZXN0LmRhcnQjTDI1LUwzMlxuICogSW4gQW5ndWxhciBEYXJ0ICZuZ3NwOyBpcyBjb252ZXJ0ZWQgdG8gdGhlIDB4RTUwMCBQVUEgKFByaXZhdGUgVXNlIEFyZWFzKSB1bmljb2RlIGNoYXJhY3RlclxuICogYW5kIGxhdGVyIG9uIHJlcGxhY2VkIGJ5IGEgc3BhY2UuIFdlIGFyZSByZS1pbXBsZW1lbnRpbmcgdGhlIHNhbWUgaWRlYSBoZXJlLCBzaW5jZSB0cmFuc2xhdGlvbnNcbiAqIG1pZ2h0IGNvbnRhaW4gdGhpcyBzcGVjaWFsIGNoYXJhY3Rlci5cbiAqL1xuY29uc3QgTkdTUF9VTklDT0RFX1JFR0VYUCA9IC9cXHVFNTAwL2c7XG5mdW5jdGlvbiByZXBsYWNlTmdzcCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoTkdTUF9VTklDT0RFX1JFR0VYUCwgJyAnKTtcbn1cblxuLyoqXG4gKiBUaGUgbG9jYWxlIGlkIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGlzIGN1cnJlbnRseSB1c2luZyAoZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zKS5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xubGV0IExPQ0FMRV9JRCA9IERFRkFVTFRfTE9DQUxFX0lEO1xuXG4vKipcbiAqIFNldHMgdGhlIGxvY2FsZSBpZCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdHJhbnNsYXRpb25zIGFuZCBJQ1UgZXhwcmVzc2lvbnMuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxvY2FsZUlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRMb2NhbGVJZChsb2NhbGVJZDogc3RyaW5nKSB7XG4gIGFzc2VydERlZmluZWQobG9jYWxlSWQsIGBFeHBlY3RlZCBsb2NhbGVJZCB0byBiZSBkZWZpbmVkYCk7XG4gIGlmICh0eXBlb2YgbG9jYWxlSWQgPT09ICdzdHJpbmcnKSB7XG4gICAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsb2NhbGUgaWQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zLlxuICogVGhpcyBpcyB0aGUgaXZ5IHZlcnNpb24gb2YgYExPQ0FMRV9JRGAgdGhhdCB3YXMgZGVmaW5lZCBhcyBhbiBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSB2aWV3IGVuZ2luZVxuICogYnV0IGlzIG5vdyBkZWZpbmVkIGFzIGEgZ2xvYmFsIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlSWQoKTogc3RyaW5nIHtcbiAgcmV0dXJuIExPQ0FMRV9JRDtcbn1cbiJdfQ==