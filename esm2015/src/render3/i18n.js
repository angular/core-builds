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
import { getDocument } from './interfaces/document';
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
    const inertBodyHelper = new InertBodyHelper(getDocument());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sOEJBQThCLENBQUM7QUFFdEMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4SCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBRSxjQUFjLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVoRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNsRSxPQUFPLEVBQW1CLFlBQVksRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdNLE9BQU8sRUFBYSxNQUFNLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENB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QUM7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsV0FBVztJQUN6QixPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi91dGlsL25nX2kxOG5fY2xvc3VyZV9tb2RlJztcblxuaW1wb3J0IHtERUZBVUxUX0xPQ0FMRV9JRCwgZ2V0UGx1cmFsQ2FzZX0gZnJvbSAnLi4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtTUkNTRVRfQVRUUlMsIFVSSV9BVFRSUywgVkFMSURfQVRUUlMsIFZBTElEX0VMRU1FTlRTLCBnZXRUZW1wbGF0ZUNvbnRlbnR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge0luZXJ0Qm9keUhlbHBlcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2luZXJ0X2JvZHknO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwsIHNhbml0aXplU3Jjc2V0fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplcic7XG5pbXBvcnQge2FkZEFsbFRvQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtzZXREZWxheVByb2plY3Rpb259IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge2F0dGFjaEkxOG5PcENvZGVzRGVidWd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgYWxsb2NFeHBhbmRvLCBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwsIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBnZXRPckNyZWF0ZVROb2RlLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eSwgc2V0TmdSZWZsZWN0UHJvcGVydGllcywgdGV4dEJpbmRpbmdJbnRlcm5hbH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4vaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtpc0xDb250YWluZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGx5UHJvamVjdGlvbiwgY3JlYXRlVGV4dE5vZGUsIG5hdGl2ZVJlbW92ZU5vZGV9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRCaW5kaW5nSW5kZXgsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBuZXh0QmluZGluZ0luZGV4LCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlLCBsb2FkfSBmcm9tICcuL3V0aWwvdmlld191dGlscyc7XG5cblxuY29uc3QgTUFSS0VSID0gYO+/vWA7XG5jb25zdCBJQ1VfQkxPQ0tfUkVHRVhQID0gL15cXHMqKO+/vVxcZCs6P1xcZCrvv70pXFxzKixcXHMqKHNlbGVjdHxwbHVyYWwpXFxzKiwvO1xuY29uc3QgU1VCVEVNUExBVEVfUkVHRVhQID0gL++/vVxcLz9cXCooXFxkKzpcXGQrKe+/vS9naTtcbmNvbnN0IFBIX1JFR0VYUCA9IC/vv70oXFwvP1sjKiFdXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBCSU5ESU5HX1JFR0VYUCA9IC/vv70oXFxkKyk6P1xcZCrvv70vZ2k7XG5jb25zdCBJQ1VfUkVHRVhQID0gLyh7XFxzKu+/vVxcZCs6P1xcZCrvv71cXHMqLFxccypcXFN7Nn1cXHMqLFtcXHNcXFNdKn0pL2dpO1xuY29uc3QgZW51bSBUYWdUeXBlIHtcbiAgRUxFTUVOVCA9ICcjJyxcbiAgVEVNUExBVEUgPSAnKicsXG4gIFBST0pFQ1RJT04gPSAnIScsXG59XG5cbi8vIGkxOG5Qb3N0cHJvY2VzcyBjb25zdHNcbmNvbnN0IFJPT1RfVEVNUExBVEVfSUQgPSAwO1xuY29uc3QgUFBfTVVMVElfVkFMVUVfUExBQ0VIT0xERVJTX1JFR0VYUCA9IC9cXFso77+9Lis/77+9PylcXF0vO1xuY29uc3QgUFBfUExBQ0VIT0xERVJTX1JFR0VYUCA9IC9cXFso77+9Lis/77+9PylcXF18KO+/vVxcLz9cXCpcXGQrOlxcZCvvv70pL2c7XG5jb25zdCBQUF9JQ1VfVkFSU19SRUdFWFAgPSAvKHtcXHMqKShWQVJfKFBMVVJBTHxTRUxFQ1QpKF9cXGQrKT8pKFxccyosKS9nO1xuY29uc3QgUFBfSUNVX1BMQUNFSE9MREVSU19SRUdFWFAgPSAveyhbQS1aMC05X10rKX0vZztcbmNvbnN0IFBQX0lDVVNfUkVHRVhQID0gL++/vUkxOE5fRVhQXyhJQ1UoX1xcZCspPynvv70vZztcbmNvbnN0IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUCA9IC9cXC9cXCovO1xuY29uc3QgUFBfVEVNUExBVEVfSURfUkVHRVhQID0gL1xcZCtcXDooXFxkKykvO1xuXG4vLyBQYXJzZWQgcGxhY2Vob2xkZXIgc3RydWN0dXJlIHVzZWQgaW4gcG9zdHByb2Nlc3NpbmcgKHdpdGhpbiBgaTE4blBvc3Rwcm9jZXNzYCBmdW5jdGlvbilcbi8vIENvbnRhaW5zIHRoZSBmb2xsb3dpbmcgZmllbGRzOiBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl1cbnR5cGUgUG9zdHByb2Nlc3NQbGFjZWhvbGRlciA9IFtudW1iZXIsIGJvb2xlYW4sIHN0cmluZ107XG5cbmludGVyZmFjZSBJY3VFeHByZXNzaW9uIHtcbiAgdHlwZTogSWN1VHlwZTtcbiAgbWFpbkJpbmRpbmc6IG51bWJlcjtcbiAgY2FzZXM6IHN0cmluZ1tdO1xuICB2YWx1ZXM6IChzdHJpbmd8SWN1RXhwcmVzc2lvbilbXVtdO1xufVxuXG5pbnRlcmZhY2UgSWN1Q2FzZSB7XG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2NhdGUgaW4gZXhwYW5kbyBmb3IgdGhpcyBjYXNlLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYXggbnVtYmVyIG9mIERPTSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgYnkgdGhpcyBpMThuICsgSUNVIGJsb2Nrcy4gV2hlblxuICAgKiB0aGUgRE9NIGVsZW1lbnRzIGFyZSBiZWluZyBjcmVhdGVkIHRoZXkgYXJlIHN0b3JlZCBpbiB0aGUgRVhQQU5ETywgc28gdGhhdCB1cGRhdGUgT3BDb2RlcyBjYW5cbiAgICogd3JpdGUgaW50byB0aGVtLlxuICAgKi9cbiAgdmFyczogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBhcnJheSBvZiBjaGlsZC9zdWIgSUNVcy5cbiAgICovXG4gIGNoaWxkSWN1czogbnVtYmVyW107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gYnVpbGQgdXAgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVVxuICAgKi9cbiAgY3JlYXRlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBkZXN0cm95IHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UuXG4gICAqL1xuICByZW1vdmU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIHVwZGF0ZSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVIGJpbmRpbmdzLlxuICAgKi9cbiAgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2Rlcztcbn1cblxuLyoqXG4gKiBCcmVha3MgcGF0dGVybiBpbnRvIHN0cmluZ3MgYW5kIHRvcCBsZXZlbCB7Li4ufSBibG9ja3MuXG4gKiBDYW4gYmUgdXNlZCB0byBicmVhayBhIG1lc3NhZ2UgaW50byB0ZXh0IGFuZCBJQ1UgZXhwcmVzc2lvbnMsIG9yIHRvIGJyZWFrIGFuIElDVSBleHByZXNzaW9uIGludG9cbiAqIGtleXMgYW5kIGNhc2VzLlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gKHN1YilQYXR0ZXJuIHRvIGJlIGJyb2tlbi5cbiAqXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQYXJ0cyhwYXR0ZXJuOiBzdHJpbmcpOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSB7XG4gIGlmICghcGF0dGVybikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGxldCBwcmV2UG9zID0gMDtcbiAgY29uc3QgYnJhY2VTdGFjayA9IFtdO1xuICBjb25zdCByZXN1bHRzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSA9IFtdO1xuICBjb25zdCBicmFjZXMgPSAvW3t9XS9nO1xuICAvLyBsYXN0SW5kZXggZG9lc24ndCBnZXQgc2V0IHRvIDAgc28gd2UgaGF2ZSB0by5cbiAgYnJhY2VzLmxhc3RJbmRleCA9IDA7XG5cbiAgbGV0IG1hdGNoO1xuICB3aGlsZSAobWF0Y2ggPSBicmFjZXMuZXhlYyhwYXR0ZXJuKSkge1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmluZGV4O1xuICAgIGlmIChtYXRjaFswXSA9PSAnfScpIHtcbiAgICAgIGJyYWNlU3RhY2sucG9wKCk7XG5cbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIEVuZCBvZiB0aGUgYmxvY2suXG4gICAgICAgIGNvbnN0IGJsb2NrID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgaWYgKElDVV9CTE9DS19SRUdFWFAudGVzdChibG9jaykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocGFyc2VJQ1VCbG9jayhibG9jaykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChibG9jayk7XG4gICAgICAgIH1cblxuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgICAgYnJhY2VTdGFjay5wdXNoKCd7Jyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcyk7XG4gIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW11bXSA9IFtdO1xuICBsZXQgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICBsZXQgbWFpbkJpbmRpbmcgPSAwO1xuICBwYXR0ZXJuID0gcGF0dGVybi5yZXBsYWNlKElDVV9CTE9DS19SRUdFWFAsIGZ1bmN0aW9uKHN0cjogc3RyaW5nLCBiaW5kaW5nOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgIGlmICh0eXBlID09PSAnc2VsZWN0Jykge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUuc2VsZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gICAgfVxuICAgIG1haW5CaW5kaW5nID0gcGFyc2VJbnQoYmluZGluZy5zdWJzdHIoMSksIDEwKTtcbiAgICByZXR1cm4gJyc7XG4gIH0pO1xuXG4gIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHBhdHRlcm4pIGFzIHN0cmluZ1tdO1xuICAvLyBMb29raW5nIGZvciAoa2V5IGJsb2NrKSsgc2VxdWVuY2UuIE9uZSBvZiB0aGUga2V5cyBoYXMgdG8gYmUgXCJvdGhlclwiLlxuICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBwYXJ0cy5sZW5ndGg7KSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW3BvcysrXS50cmltKCk7XG4gICAgaWYgKGljdVR5cGUgPT09IEljdVR5cGUucGx1cmFsKSB7XG4gICAgICAvLyBLZXkgY2FuIGJlIFwiPXhcIiwgd2UganVzdCB3YW50IFwieFwiXG4gICAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzKig/Oj0pPyhcXHcrKVxccyovLCAnJDEnKTtcbiAgICB9XG4gICAgaWYgKGtleS5sZW5ndGgpIHtcbiAgICAgIGNhc2VzLnB1c2goa2V5KTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBleHRyYWN0UGFydHMocGFydHNbcG9zKytdKSBhcyBzdHJpbmdbXTtcbiAgICBpZiAoY2FzZXMubGVuZ3RoID4gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdmFsdWVzLnB1c2goYmxvY2tzKTtcbiAgICB9XG4gIH1cblxuICBhc3NlcnRHcmVhdGVyVGhhbihjYXNlcy5pbmRleE9mKCdvdGhlcicpLCAtMSwgJ01pc3Npbmcga2V5IFwib3RoZXJcIiBpbiBJQ1Ugc3RhdGVtZW50LicpO1xuICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXMsIHNlZSAjMjE2MTVcbiAgcmV0dXJuIHt0eXBlOiBpY3VUeXBlLCBtYWluQmluZGluZzogbWFpbkJpbmRpbmcsIGNhc2VzLCB2YWx1ZXN9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgaW5UZW1wbGF0ZSwgZmFsc2UsXG4gICAgICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7bWVzc2FnZX1cImApO1xuXG4gIHJlcyArPSBtZXNzYWdlLnN1YnN0cihpbmRleCk7XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSBwYXJ0IG9mIGEgbWVzc2FnZSBhbmQgcmVtb3ZlcyB0aGUgcmVzdC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBleHRyYWN0aW5nIGEgcGFydCBvZiB0aGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gQSB0cmFuc2xhdGVkXG4gKiBtZXNzYWdlIGNhbiBzcGFuIG11bHRpcGxlIHRlbXBsYXRlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGkxOG4+VHJhbnNsYXRlIDxzcGFuICpuZ0lmPm1lPC9zcGFuPiE8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGNyb3BcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IG9mIHRoZSBzdWItdGVtcGxhdGUgdG8gZXh0cmFjdC4gSWYgdW5kZWZpbmVkIGl0IHJldHVybnMgdGhlXG4gKiBleHRlcm5hbCB0ZW1wbGF0ZSBhbmQgcmVtb3ZlcyBhbGwgc3ViLXRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKSB7XG4gIGlmICh0eXBlb2Ygc3ViVGVtcGxhdGVJbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAvLyBXZSB3YW50IHRoZSByb290IHRlbXBsYXRlIG1lc3NhZ2UsIGlnbm9yZSBhbGwgc3ViLXRlbXBsYXRlc1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2Ugd2FudCBhIHNwZWNpZmljIHN1Yi10ZW1wbGF0ZVxuICAgIGNvbnN0IHN0YXJ0ID1cbiAgICAgICAgbWVzc2FnZS5pbmRleE9mKGA6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApICsgMiArIHN1YlRlbXBsYXRlSW5kZXgudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgY29uc3QgZW5kID0gbWVzc2FnZS5zZWFyY2gobmV3IFJlZ0V4cChgJHtNQVJLRVJ9XFxcXC9cXFxcKlxcXFxkKzoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkpO1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgdG8gdXBkYXRlIHRoZSBiaW5kaW5ncyBvZiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmluZGluZ3MuXG4gKiBAcGFyYW0gZGVzdGluYXRpb25Ob2RlIEluZGV4IG9mIHRoZSBkZXN0aW5hdGlvbiBub2RlIHdoaWNoIHdpbGwgcmVjZWl2ZSB0aGUgYmluZGluZy5cbiAqIEBwYXJhbSBhdHRyTmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUsIGlmIHRoZSBzdHJpbmcgYmVsb25ncyB0byBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gc2FuaXRpemVGbiBTYW5pdGl6YXRpb24gZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgc3RyaW5nIGFmdGVyIHVwZGF0ZSwgaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgIHN0cjogc3RyaW5nLCBkZXN0aW5hdGlvbk5vZGU6IG51bWJlciwgYXR0ck5hbWU/OiBzdHJpbmcsXG4gICAgc2FuaXRpemVGbjogU2FuaXRpemVyRm4gfCBudWxsID0gbnVsbCk6IEkxOG5VcGRhdGVPcENvZGVzIHtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbbnVsbCwgbnVsbF07ICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBjb25zdCB0ZXh0UGFydHMgPSBzdHIuc3BsaXQoQklORElOR19SRUdFWFApO1xuICBsZXQgbWFzayA9IDA7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCB0ZXh0UGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB0ZXh0UGFydHNbal07XG5cbiAgICBpZiAoaiAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gcGFyc2VJbnQodGV4dFZhbHVlLCAxMCk7XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2goLTEgLSBiaW5kaW5nSW5kZXgpO1xuICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2UgaWYgKHRleHRWYWx1ZSAhPT0gJycpIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dFxuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKHRleHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgIChhdHRyTmFtZSA/IEkxOG5VcGRhdGVPcENvZGUuQXR0ciA6IEkxOG5VcGRhdGVPcENvZGUuVGV4dCkpO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbMF0gPSBtYXNrO1xuICB1cGRhdGVPcENvZGVzWzFdID0gdXBkYXRlT3BDb2Rlcy5sZW5ndGggLSAyO1xuICByZXR1cm4gdXBkYXRlT3BDb2Rlcztcbn1cblxuZnVuY3Rpb24gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgbWFzayA9IDApOiBudW1iZXIge1xuICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKTtcbiAgbGV0IG1hdGNoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgd2hpbGUgKG1hdGNoID0gQklORElOR19SRUdFWFAuZXhlYyh2YWx1ZSkpIHtcbiAgICAgICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChwYXJzZUludChtYXRjaFsxXSwgMTApKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFzayA9IGdldEJpbmRpbmdNYXNrKHZhbHVlIGFzIEljdUV4cHJlc3Npb24sIG1hc2spO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWFzaztcbn1cblxuY29uc3QgaTE4bkluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5sZXQgaTE4bkluZGV4U3RhY2tQb2ludGVyID0gLTE7XG5cbi8qKlxuICogQ29udmVydCBiaW5kaW5nIGluZGV4IHRvIG1hc2sgYml0LlxuICpcbiAqIEVhY2ggaW5kZXggcmVwcmVzZW50cyBhIHNpbmdsZSBiaXQgb24gdGhlIGJpdC1tYXNrLiBCZWNhdXNlIGJpdC1tYXNrIG9ubHkgaGFzIDMyIGJpdHMsIHdlIG1ha2VcbiAqIHRoZSAzMm5kIGJpdCBzaGFyZSBhbGwgbWFza3MgZm9yIGFsbCBiaW5kaW5ncyBoaWdoZXIgdGhhbiAzMi4gU2luY2UgaXQgaXMgZXh0cmVtZWx5IHJhcmUgdG8gaGF2ZVxuICogbW9yZSB0aGFuIDMyIGJpbmRpbmdzIHRoaXMgd2lsbCBiZSBoaXQgdmVyeSByYXJlbHkuIFRoZSBkb3duc2lkZSBvZiBoaXR0aW5nIHRoaXMgY29ybmVyIGNhc2UgaXNcbiAqIHRoYXQgd2Ugd2lsbCBleGVjdXRlIGJpbmRpbmcgY29kZSBtb3JlIG9mdGVuIHRoYW4gbmVjZXNzYXJ5LiAocGVuYWx0eSBvZiBwZXJmb3JtYW5jZSlcbiAqL1xuZnVuY3Rpb24gdG9NYXNrQml0KGJpbmRpbmdJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIDEgPDwgTWF0aC5taW4oYmluZGluZ0luZGV4LCAzMSk7XG59XG5cbmNvbnN0IHBhcmVudEluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5cbi8qKlxuICogTWFya3MgYSBibG9jayBvZiB0ZXh0IGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBUaGUgaW5zdHJ1Y3Rpb25zIGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAgbWFyayB0aGUgdHJhbnNsYXRpb24gYmxvY2sgaW4gdGhlIHRlbXBsYXRlLlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70he2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vIXtpbmRleH0oOntibG9ja30p77+9YDogKlByb2plY3Rpb24gUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlXG4gKiAgIGJlZ2lubmluZyBhbmQgZW5kIG9mIDxuZy1jb250ZW50PiB0aGF0IHdhcyBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suXG4gKiAgIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC5cbiAqICAgQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5TdGFydChpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuSW5kZXhTdGFja1srK2kxOG5JbmRleFN0YWNrUG9pbnRlcl0gPSBpbmRleDtcbiAgLy8gV2UgbmVlZCB0byBkZWxheSBwcm9qZWN0aW9ucyB1bnRpbCBgaTE4bkVuZGBcbiAgc2V0RGVsYXlQcm9qZWN0aW9uKHRydWUpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIGkxOG5TdGFydEZpcnN0UGFzcyhsVmlldywgdFZpZXcsIGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgfVxufVxuXG4vLyBDb3VudCBmb3IgdGhlIG51bWJlciBvZiB2YXJzIHRoYXQgd2lsbCBiZSBhbGxvY2F0ZWQgZm9yIGVhY2ggaTE4biBibG9jay5cbi8vIEl0IGlzIGdsb2JhbCBiZWNhdXNlIHRoaXMgaXMgdXNlZCBpbiBtdWx0aXBsZSBmdW5jdGlvbnMgdGhhdCBpbmNsdWRlIGxvb3BzIGFuZCByZWN1cnNpdmUgY2FsbHMuXG4vLyBUaGlzIGlzIHJlc2V0IHRvIDAgd2hlbiBgaTE4blN0YXJ0Rmlyc3RQYXNzYCBpcyBjYWxsZWQuXG5sZXQgaTE4blZhcnNDb3VudDogbnVtYmVyO1xuXG4vKipcbiAqIFNlZSBgaTE4blN0YXJ0YCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4blN0YXJ0Rmlyc3RQYXNzKFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJsdWVwcmludC5sZW5ndGggLSBIRUFERVJfT0ZGU0VUO1xuICBpMThuVmFyc0NvdW50ID0gMDtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHBhcmVudFROb2RlID1cbiAgICAgIGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4ID1cbiAgICAgIHBhcmVudFROb2RlICYmIHBhcmVudFROb2RlICE9PSBsVmlld1tUX0hPU1RdID8gcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUIDogaW5kZXg7XG4gIGxldCBwYXJlbnRJbmRleFBvaW50ZXIgPSAwO1xuICBwYXJlbnRJbmRleFN0YWNrW3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleDtcbiAgY29uc3QgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMgPSBbXTtcbiAgLy8gSWYgdGhlIHByZXZpb3VzIG5vZGUgd2Fzbid0IHRoZSBkaXJlY3QgcGFyZW50IHRoZW4gd2UgaGF2ZSBhIHRyYW5zbGF0aW9uIHdpdGhvdXQgdG9wIGxldmVsXG4gIC8vIGVsZW1lbnQgYW5kIHdlIG5lZWQgdG8ga2VlcCBhIHJlZmVyZW5jZSBvZiB0aGUgcHJldmlvdXMgZWxlbWVudCBpZiB0aGVyZSBpcyBvbmVcbiAgaWYgKGluZGV4ID4gMCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUgIT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gQ3JlYXRlIGFuIE9wQ29kZSB0byBzZWxlY3QgdGhlIHByZXZpb3VzIFROb2RlXG4gICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCk7XG4gIH1cbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXTtcbiAgY29uc3QgaWN1RXhwcmVzc2lvbnM6IFRJY3VbXSA9IFtdO1xuXG4gIGNvbnN0IHRlbXBsYXRlVHJhbnNsYXRpb24gPSBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICBjb25zdCBtc2dQYXJ0cyA9IHJlcGxhY2VOZ3NwKHRlbXBsYXRlVHJhbnNsYXRpb24pLnNwbGl0KFBIX1JFR0VYUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXNnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWUgPSBtc2dQYXJ0c1tpXTtcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzKVxuICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJy8nKSB7XG4gICAgICAgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgxKSA9PT0gVGFnVHlwZS5FTEVNRU5UKSB7XG4gICAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigyKSwgMTApO1xuICAgICAgICAgIHBhcmVudEluZGV4ID0gcGFyZW50SW5kZXhTdGFja1stLXBhcmVudEluZGV4UG9pbnRlcl07XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDEpLCAxMCk7XG4gICAgICAgIC8vIFRoZSB2YWx1ZSByZXByZXNlbnRzIGEgcGxhY2Vob2xkZXIgdGhhdCB3ZSBtb3ZlIHRvIHRoZSBkZXNpZ25hdGVkIGluZGV4XG4gICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgIHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCxcbiAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gVGFnVHlwZS5FTEVNRU5UKSB7XG4gICAgICAgICAgcGFyZW50SW5kZXhTdGFja1srK3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleCA9IHBoSW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MgJiBJQ1UgZXhwcmVzc2lvbnMpXG4gICAgICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyh2YWx1ZSk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBJQ1UgZXhwcmVzc2lvbnNcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdU5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmdEZXZNb2RlID8gYElDVSAke2ljdU5vZGVJbmRleH1gIDogJycsIGljdU5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSBjb2RlcyBmb3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1RXhwcmVzc2lvbiA9IHBhcnRzW2pdIGFzIEljdUV4cHJlc3Npb247XG4gICAgICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb24pO1xuICAgICAgICAgIGljdVN0YXJ0KGljdUV4cHJlc3Npb25zLCBpY3VFeHByZXNzaW9uLCBpY3VOb2RlSW5kZXgsIGljdU5vZGVJbmRleCk7XG4gICAgICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgICAgIGNvbnN0IHRJY3VJbmRleCA9IGljdUV4cHJlc3Npb25zLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyksICAvLyBtYXNrIG9mIHRoZSBtYWluIGJpbmRpbmdcbiAgICAgICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCwgdEljdUluZGV4LFxuICAgICAgICAgICAgICBtYXNrLCAgLy8gbWFzayBvZiBhbGwgdGhlIGJpbmRpbmdzIG9mIHRoaXMgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLCB0SWN1SW5kZXgpO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnRzW2pdICE9PSAnJykge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBwYXJ0c1tqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHRleHQubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGVzXG4gICAgICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGJpbmRpbmcsIHRoZSB2YWx1ZSB3aWxsIGJlIHNldCBkdXJpbmcgdXBkYXRlXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHRleHQsIHRleHROb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHRleHQsIHRleHROb2RlSW5kZXgpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaTE4blZhcnNDb3VudCA+IDApIHtcbiAgICBhbGxvY0V4cGFuZG8obFZpZXcsIGkxOG5WYXJzQ291bnQpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXMsIGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCwgbFZpZXcpO1xuXG4gIC8vIE5PVEU6IGxvY2FsIHZhciBuZWVkZWQgdG8gcHJvcGVybHkgYXNzZXJ0IHRoZSB0eXBlIG9mIGBUSTE4bmAuXG4gIGNvbnN0IHRJMThuOiBUSTE4biA9IHtcbiAgICB2YXJzOiBpMThuVmFyc0NvdW50LFxuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgaWN1czogaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLFxuICB9O1xuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHRJMThuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIHBhcmVudFROb2RlOiBUTm9kZSwgcHJldmlvdXNUTm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICBjb25zdCBuZXh0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIGlmICghcHJldmlvdXNUTm9kZSkge1xuICAgIHByZXZpb3VzVE5vZGUgPSBwYXJlbnRUTm9kZTtcbiAgfVxuXG4gIC8vIFJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBpZiAocHJldmlvdXNUTm9kZSA9PT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHBhcmVudFROb2RlLmNoaWxkKSB7XG4gICAgdE5vZGUubmV4dCA9IHBhcmVudFROb2RlLmNoaWxkO1xuICAgIHBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gIH0gZWxzZSBpZiAocHJldmlvdXNUTm9kZSAhPT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHByZXZpb3VzVE5vZGUubmV4dCkge1xuICAgIHROb2RlLm5leHQgPSBwcmV2aW91c1ROb2RlLm5leHQ7XG4gICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICBpZiAocGFyZW50VE5vZGUgIT09IGxWaWV3W1RfSE9TVF0pIHtcbiAgICB0Tm9kZS5wYXJlbnQgPSBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGU7XG4gIH1cblxuICAvLyBJZiB0Tm9kZSB3YXMgbW92ZWQgYXJvdW5kLCB3ZSBtaWdodCBuZWVkIHRvIGZpeCBhIGJyb2tlbiBsaW5rLlxuICBsZXQgY3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGUubmV4dDtcbiAgd2hpbGUgKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3IubmV4dCA9PT0gdE5vZGUpIHtcbiAgICAgIGN1cnNvci5uZXh0ID0gbmV4dE5vZGU7XG4gICAgfVxuICAgIGN1cnNvciA9IGN1cnNvci5uZXh0O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBsYWNlaG9sZGVyIHRvIGFwcGVuZCBpcyBhIHByb2plY3Rpb24sIHdlIG5lZWQgdG8gbW92ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGluc3RlYWRcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgYXBwbHlQcm9qZWN0aW9uKGxWaWV3LCB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGUpO1xuICAgIHJldHVybiB0Tm9kZTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSwgdE5vZGUsIGxWaWV3KTtcblxuICBjb25zdCBzbG90VmFsdWUgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gTm9kZXMgdGhhdCBpbmplY3QgVmlld0NvbnRhaW5lclJlZiBhbHNvIGhhdmUgYSBjb21tZW50IG5vZGUgdGhhdCBzaG91bGQgYmUgbW92ZWRcbiAgICBhcHBlbmRDaGlsZChzbG90VmFsdWVbTkFUSVZFXSwgdE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgZm9yIGludGVybmF0aW9uYWxpemF0aW9uLlxuICpcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGJ5IHRyYW5zZm9ybWluZyBpdCBmcm9tIGludGVybWVkaWF0ZVxuICogZm9ybWF0ICh0aGF0IG1pZ2h0IGNvbnRhaW4gc29tZSBtYXJrZXJzIHRoYXQgd2UgbmVlZCB0byByZXBsYWNlKSB0byB0aGUgZmluYWxcbiAqIGZvcm0sIGNvbnN1bWFibGUgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uLiBQb3N0IHByb2Nlc3Npbmcgc3RlcHMgaW5jbHVkZTpcbiAqXG4gKiAxLiBSZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBjYXNlcyAobGlrZSBb77+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vXzvv70177+9XSlcbiAqIDIuIFJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICogMy4gUmVwbGFjZSBhbGwgcGxhY2Vob2xkZXJzIHVzZWQgaW5zaWRlIElDVXMgaW4gYSBmb3JtIG9mIHtQTEFDRUhPTERFUn1cbiAqIDQuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blBvc3Rwcm9jZXNzKFxuICAgIG1lc3NhZ2U6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7W2tleTogc3RyaW5nXTogKHN0cmluZyB8IHN0cmluZ1tdKX0gPSB7fSk6IHN0cmluZyB7XG4gIC8qKlxuICAgKiBTdGVwIDE6IHJlc29sdmUgYWxsIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBsaWtlIFvvv70jNe+/vXzvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9XVxuICAgKlxuICAgKiBOb3RlOiBkdWUgdG8gdGhlIHdheSB3ZSBwcm9jZXNzIG5lc3RlZCB0ZW1wbGF0ZXMgKEJGUyksIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBhcmUgdHlwaWNhbGx5XG4gICAqIGdyb3VwZWQgYnkgdGVtcGxhdGVzLCBmb3IgZXhhbXBsZTogW++/vSM177+9fO+/vSM277+9fO+/vSMxOjHvv71877+9IzM6Mu+/vV0gd2hlcmUg77+9IzXvv70gYW5kIO+/vSM277+9IGJlbG9uZyB0byByb290XG4gICAqIHRlbXBsYXRlLCDvv70jMTox77+9IGJlbG9uZyB0byBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleCAxIGFuZCDvv70jMToy77+9IC0gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXhcbiAgICogMy4gSG93ZXZlciBpbiByZWFsIHRlbXBsYXRlcyB0aGUgb3JkZXIgbWlnaHQgYmUgZGlmZmVyZW50OiBpLmUuIO+/vSMxOjHvv70gYW5kL29yIO+/vSMzOjLvv70gbWF5IGdvIGluXG4gICAqIGZyb250IG9mIO+/vSM277+9LiBUaGUgcG9zdCBwcm9jZXNzaW5nIHN0ZXAgcmVzdG9yZXMgdGhlIHJpZ2h0IG9yZGVyIGJ5IGtlZXBpbmcgdHJhY2sgb2YgdGhlXG4gICAqIHRlbXBsYXRlIGlkIHN0YWNrIGFuZCBsb29rcyBmb3IgcGxhY2Vob2xkZXJzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlbXBsYXRlLlxuICAgKi9cbiAgbGV0IHJlc3VsdDogc3RyaW5nID0gbWVzc2FnZTtcbiAgaWYgKFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAudGVzdChtZXNzYWdlKSkge1xuICAgIGNvbnN0IG1hdGNoZXM6IHtba2V5OiBzdHJpbmddOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW119ID0ge307XG4gICAgY29uc3QgdGVtcGxhdGVJZHNTdGFjazogbnVtYmVyW10gPSBbUk9PVF9URU1QTEFURV9JRF07XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfUExBQ0VIT0xERVJTX1JFR0VYUCwgKG06IGFueSwgcGhzOiBzdHJpbmcsIHRtcGw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcGhzIHx8IHRtcGw7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlcnM6IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXSA9IG1hdGNoZXNbY29udGVudF0gfHwgW107XG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgY29udGVudC5zcGxpdCgnfCcpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHBsYWNlaG9sZGVyLm1hdGNoKFBQX1RFTVBMQVRFX0lEX1JFR0VYUCk7XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVJZCA9IG1hdGNoID8gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSA6IFJPT1RfVEVNUExBVEVfSUQ7XG4gICAgICAgICAgY29uc3QgaXNDbG9zZVRlbXBsYXRlVGFnID0gUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQLnRlc3QocGxhY2Vob2xkZXIpO1xuICAgICAgICAgIHBsYWNlaG9sZGVycy5wdXNoKFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVzW2NvbnRlbnRdID0gcGxhY2Vob2xkZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgcGxhY2Vob2xkZXIgLSAke2NvbnRlbnR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZUlkID0gdGVtcGxhdGVJZHNTdGFja1t0ZW1wbGF0ZUlkc1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGlkeCA9IDA7XG4gICAgICAvLyBmaW5kIHBsYWNlaG9sZGVyIGluZGV4IHRoYXQgbWF0Y2hlcyBjdXJyZW50IHRlbXBsYXRlIGlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYWNlaG9sZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGxhY2Vob2xkZXJzW2ldWzBdID09PSBjdXJyZW50VGVtcGxhdGVJZCkge1xuICAgICAgICAgIGlkeCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHVwZGF0ZSB0ZW1wbGF0ZSBpZCBzdGFjayBiYXNlZCBvbiB0aGUgY3VycmVudCB0YWcgZXh0cmFjdGVkXG4gICAgICBjb25zdCBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0gPSBwbGFjZWhvbGRlcnNbaWR4XTtcbiAgICAgIGlmIChpc0Nsb3NlVGVtcGxhdGVUYWcpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wb3AoKTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRlbXBsYXRlSWQgIT09IHRlbXBsYXRlSWQpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgfVxuICAgICAgLy8gcmVtb3ZlIHByb2Nlc3NlZCB0YWcgZnJvbSB0aGUgbGlzdFxuICAgICAgcGxhY2Vob2xkZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gcmV0dXJuIGN1cnJlbnQgcmVzdWx0IGlmIG5vIHJlcGxhY2VtZW50cyBzcGVjaWZpZWRcbiAgaWYgKCFPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogU3RlcCAyOiByZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9WQVJTX1JFR0VYUCwgKG1hdGNoLCBzdGFydCwga2V5LCBfdHlwZSwgX2lkeCwgZW5kKTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyBgJHtzdGFydH0ke3JlcGxhY2VtZW50c1trZXldfSR7ZW5kfWAgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgMzogcmVwbGFjZSBhbGwgcGxhY2Vob2xkZXJzIHVzZWQgaW5zaWRlIElDVXMgaW4gYSBmb3JtIG9mIHtQTEFDRUhPTERFUn1cbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9QTEFDRUhPTERFUlNfUkVHRVhQLCAobWF0Y2gsIGtleSk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gcmVwbGFjZW1lbnRzW2tleV0gYXMgc3RyaW5nIDogbWF0Y2g7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTdGVwIDQ6IHJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSkgaW4gY2FzZVxuICAgKiBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVU19SRUdFWFAsIChtYXRjaCwga2V5KTogc3RyaW5nID0+IHtcbiAgICBpZiAocmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnN0IGxpc3QgPSByZXBsYWNlbWVudHNba2V5XSBhcyBzdHJpbmdbXTtcbiAgICAgIGlmICghbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgSUNVIC0gJHttYXRjaH0gd2l0aCBrZXk6ICR7a2V5fWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxpc3Quc2hpZnQoKSAhO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG1hcmtlZCBieSBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgLiBJdCBpbnNlcnRzIHRoZSB0ZXh0L0lDVSBub2Rlc1xuICogaW50byB0aGUgcmVuZGVyIHRyZWUsIG1vdmVzIHRoZSBwbGFjZWhvbGRlciBub2RlcyBhbmQgcmVtb3ZlcyB0aGUgZGVsZXRlZCBub2Rlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FbmQoKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkVuZEZpcnN0UGFzcyhsVmlldywgdFZpZXcpO1xuICAvLyBTdG9wIGRlbGF5aW5nIHByb2plY3Rpb25zXG4gIHNldERlbGF5UHJvamVjdGlvbihmYWxzZSk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuRW5kYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkVuZEZpcnN0UGFzcyhsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdpMThuRW5kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nJyk7XG5cbiAgY29uc3Qgcm9vdEluZGV4ID0gaTE4bkluZGV4U3RhY2tbaTE4bkluZGV4U3RhY2tQb2ludGVyLS1dO1xuICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbcm9vdEluZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVEkxOG47XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRJMThuLCBgWW91IHNob3VsZCBjYWxsIGkxOG5TdGFydCBiZWZvcmUgaTE4bkVuZGApO1xuXG4gIC8vIEZpbmQgdGhlIGxhc3Qgbm9kZSB0aGF0IHdhcyBhZGRlZCBiZWZvcmUgYGkxOG5FbmRgXG4gIGNvbnN0IGxhc3RDcmVhdGVkTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuXG4gIC8vIFJlYWQgdGhlIGluc3RydWN0aW9ucyB0byBpbnNlcnQvbW92ZS9yZW1vdmUgRE9NIGVsZW1lbnRzXG4gIGNvbnN0IHZpc2l0ZWROb2RlcyA9IHJlYWRDcmVhdGVPcENvZGVzKHJvb3RJbmRleCwgdEkxOG4uY3JlYXRlLCBsVmlldyk7XG5cbiAgLy8gUmVtb3ZlIGRlbGV0ZWQgbm9kZXNcbiAgbGV0IGluZGV4ID0gcm9vdEluZGV4ICsgMTtcbiAgd2hpbGUgKGluZGV4IDw9IGxhc3RDcmVhdGVkTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpIHtcbiAgICBpZiAodmlzaXRlZE5vZGVzLmluZGV4T2YoaW5kZXgpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZShpbmRleCwgbFZpZXcsIC8qIG1hcmtBc0RldGFjaGVkICovIHRydWUpO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiBhbiBlbGVtZW50IGhhcyBhbnkgbG9jYWwgcmVmcyBhbmQgc2tpcCB0aGVtXG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgIGlmICh0Tm9kZSAmJiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpICYmXG4gICAgICAgIHROb2RlLmxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICAgIC8vIERpdmlkZSBieSAyIHRvIGdldCB0aGUgbnVtYmVyIG9mIGxvY2FsIHJlZnMsXG4gICAgICAvLyBzaW5jZSB0aGV5IGFyZSBzdG9yZWQgYXMgYW4gYXJyYXkgdGhhdCBhbHNvIGluY2x1ZGVzIGRpcmVjdGl2ZSBpbmRleGVzLFxuICAgICAgLy8gaS5lLiBbXCJsb2NhbFJlZlwiLCBkaXJlY3RpdmVJbmRleCwgLi4uXVxuICAgICAgaW5kZXggKz0gdE5vZGUubG9jYWxOYW1lcy5sZW5ndGggPj4gMTtcbiAgICB9XG4gICAgaW5kZXgrKztcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHN0b3JlcyB0aGUgZHluYW1pYyBUTm9kZSwgYW5kIHVuaG9va3MgaXQgZnJvbSB0aGUgdHJlZSBmb3Igbm93LlxuICovXG5mdW5jdGlvbiBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCk6IFRFbGVtZW50Tm9kZXxUSWN1Q29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSBuYXRpdmU7XG4gIGNvbnN0IHROb2RlID0gZ2V0T3JDcmVhdGVUTm9kZShsVmlld1tUVklFV10sIGxWaWV3W1RfSE9TVF0sIGluZGV4LCB0eXBlIGFzIGFueSwgbmFtZSwgbnVsbCk7XG5cbiAgLy8gV2UgYXJlIGNyZWF0aW5nIGEgZHluYW1pYyBub2RlLCB0aGUgcHJldmlvdXMgdE5vZGUgbWlnaHQgbm90IGJlIHBvaW50aW5nIGF0IHRoaXMgbm9kZS5cbiAgLy8gV2Ugd2lsbCBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlIGxhdGVyIHdpdGggYGFwcGVuZEkxOG5Ob2RlYC5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9PT0gdE5vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRDcmVhdGVPcENvZGVzKFxuICAgIGluZGV4OiBudW1iZXIsIGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBsVmlldzogTFZpZXcpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBsZXQgY3VycmVudFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgbGV0IHByZXZpb3VzVE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBjb25zdCB2aXNpdGVkTm9kZXM6IG51bWJlcltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY3JlYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG9wQ29kZSA9IGNyZWF0ZU9wQ29kZXNbaV07XG4gICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHRleHRSTm9kZSA9IGNyZWF0ZVRleHROb2RlKG9wQ29kZSwgcmVuZGVyZXIpO1xuICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICBjdXJyZW50VE5vZGUgPVxuICAgICAgICAgIGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChsVmlldywgdGV4dE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCk7XG4gICAgICB2aXNpdGVkTm9kZXMucHVzaCh0ZXh0Tm9kZUluZGV4KTtcbiAgICAgIHNldElzTm90UGFyZW50KCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVDtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb25UTm9kZTogVE5vZGU7XG4gICAgICAgICAgaWYgKGRlc3RpbmF0aW9uTm9kZUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGRlc3RpbmF0aW9uIG5vZGUgaXMgYGkxOG5TdGFydGAsIHdlIGRvbid0IGhhdmUgYVxuICAgICAgICAgICAgLy8gdG9wLWxldmVsIG5vZGUgYW5kIHdlIHNob3VsZCB1c2UgdGhlIGhvc3Qgbm9kZSBpbnN0ZWFkXG4gICAgICAgICAgICBkZXN0aW5hdGlvblROb2RlID0gbFZpZXdbVF9IT1NUXSAhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblROb2RlID0gZ2V0VE5vZGUoZGVzdGluYXRpb25Ob2RlSW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICBjdXJyZW50VE5vZGUgISxcbiAgICAgICAgICAgICAgICAgIGBZb3UgbmVlZCB0byBjcmVhdGUgb3Igc2VsZWN0IGEgbm9kZSBiZWZvcmUgeW91IGNhbiBpbnNlcnQgaXQgaW50byB0aGUgRE9NYCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKGN1cnJlbnRUTm9kZSAhLCBkZXN0aW5hdGlvblROb2RlLCBwcmV2aW91c1ROb2RlLCBsVmlldyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3Q6XG4gICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICB2aXNpdGVkTm9kZXMucHVzaChub2RlSW5kZXgpO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCBsVmlldyk7XG4gICAgICAgICAgaWYgKGN1cnJlbnRUTm9kZSkge1xuICAgICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgY3VycmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICAgICAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShjdXJyZW50VE5vZGUsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgY29uc3QgZWxlbWVudE5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gVGhpcyBjb2RlIGlzIHVzZWQgZm9yIElDVSBleHByZXNzaW9ucyBvbmx5LCBzaW5jZSB3ZSBkb24ndCBzdXBwb3J0XG4gICAgICAgICAgLy8gZGlyZWN0aXZlcy9jb21wb25lbnRzIGluIElDVXMsIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaW5wdXRzIGhlcmVcbiAgICAgICAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoZWxlbWVudE5vZGVJbmRleCwgYXR0ck5hbWUsIGF0dHJWYWx1ZSwgbFZpZXcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgY29uc3QgY29tbWVudFZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBjb21tZW50Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY29tbWVudFZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7Y29tbWVudFZhbHVlfVwiIHRvIGJlIGEgY29tbWVudCBub2RlIHZhbHVlYCk7XG4gICAgICAgICAgY29uc3QgY29tbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChjb21tZW50VmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIGxWaWV3LCBjb21tZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBjb21tZW50Uk5vZGUsIG51bGwpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb21tZW50Uk5vZGUsIGxWaWV3KTtcbiAgICAgICAgICAoY3VycmVudFROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlKS5hY3RpdmVDYXNlSW5kZXggPSBudWxsO1xuICAgICAgICAgIC8vIFdlIHdpbGwgYWRkIHRoZSBjYXNlIG5vZGVzIGxhdGVyLCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZVxuICAgICAgICAgIHNldElzTm90UGFyZW50KCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRUxFTUVOVF9NQVJLRVI6XG4gICAgICAgICAgY29uc3QgdGFnTmFtZVZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGFnTmFtZVZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7dGFnTmFtZVZhbHVlfVwiIHRvIGJlIGFuIGVsZW1lbnQgbm9kZSB0YWcgbmFtZWApO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRSTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQodGFnTmFtZVZhbHVlKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgICAgICAgICAgICBsVmlldywgZWxlbWVudE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIGVsZW1lbnRSTm9kZSwgdGFnTmFtZVZhbHVlKTtcbiAgICAgICAgICB2aXNpdGVkTm9kZXMucHVzaChlbGVtZW50Tm9kZUluZGV4KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldElzTm90UGFyZW50KCk7XG5cbiAgcmV0dXJuIHZpc2l0ZWROb2Rlcztcbn1cblxuZnVuY3Rpb24gcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNoYW5nZU1hc2s6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBieXBhc3NDaGVja0JpdCA9IGZhbHNlKSB7XG4gIGxldCBjYXNlQ3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVwZGF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgY29uc3QgY2hlY2tCaXQgPSB1cGRhdGVPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgIGNvbnN0IHNraXBDb2RlcyA9IHVwZGF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgaWYgKGJ5cGFzc0NoZWNrQml0IHx8IChjaGVja0JpdCAmIGNoYW5nZU1hc2spKSB7XG4gICAgICAvLyBUaGUgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCBzaW5jZSBsYXN0IGNoZWNrZWRcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeSh2aWV3RGF0YVtiaW5kaW5nc1N0YXJ0SW5kZXggLSBvcENvZGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgbGV0IGljdVROb2RlOiBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBTYW5pdGl6ZXJGbiB8IG51bGw7XG4gICAgICAgICAgICAgICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwodmlld0RhdGEsIG5vZGVJbmRleCwgcHJvcE5hbWUsIHZhbHVlLCBzYW5pdGl6ZUZuKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgdGV4dEJpbmRpbmdJbnRlcm5hbCh2aWV3RGF0YSwgbm9kZUluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBhY3RpdmUgY2FzZSwgZGVsZXRlIHRoZSBvbGQgbm9kZXNcbiAgICAgICAgICAgICAgICBpZiAoaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVDb2RlcyA9IHRJY3UucmVtb3ZlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleF07XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHJlbW92ZUNvZGVzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZU9wQ29kZSA9IHJlbW92ZUNvZGVzW2tdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyZW1vdmVPcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IHJlbW92ZU9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgRE9NIGVsZW1lbnQsIGJ1dCBkbyAqbm90KiBtYXJrIFROb2RlIGFzIGRldGFjaGVkLCBzaW5jZSB3ZSBhcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGp1c3Qgc3dpdGNoaW5nIElDVSBjYXNlcyAod2hpbGUga2VlcGluZyB0aGUgc2FtZSBUTm9kZSksIHNvIGEgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcHJlc2VudGluZyBhIG5ldyBJQ1UgY2FzZSB3aWxsIGJlIHJlLWNyZWF0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVOb2RlKG5vZGVJbmRleCwgdmlld0RhdGEsIC8qIG1hcmtBc0RldGFjaGVkICovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3U6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUNvZGVzW2sgKyAxXSBhcyBudW1iZXIgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VE5vZGUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5lc3RlZEljdU5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSBuZXN0ZWRJY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VEluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkVEljdSA9IGljdXMgIVtuZXN0ZWRJY3VUSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KG5lc3RlZFRJY3UucmVtb3ZlW2FjdGl2ZUluZGV4XSwgcmVtb3ZlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGFjdGl2ZSBjYXNlSW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICAgICAgICAgICAgcmVhZENyZWF0ZU9wQ29kZXMoLTEsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgdEljdS51cGRhdGVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICFdLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssXG4gICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhLCBjYXNlQ3JlYXRlZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBtYXJrQXNEZXRhY2hlZDogYm9vbGVhbikge1xuICBjb25zdCByZW1vdmVkUGhUTm9kZSA9IGdldFROb2RlKGluZGV4LCB2aWV3RGF0YSk7XG4gIGNvbnN0IHJlbW92ZWRQaFJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgdmlld0RhdGEpO1xuICBpZiAocmVtb3ZlZFBoUk5vZGUpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHZpZXdEYXRhW1JFTkRFUkVSXSwgcmVtb3ZlZFBoUk5vZGUpO1xuICB9XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gbG9hZCh2aWV3RGF0YSwgaW5kZXgpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMQ29udGFpbmVyO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gc2xvdFZhbHVlIGFzIExDb250YWluZXI7XG4gICAgaWYgKHJlbW92ZWRQaFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtYXJrQXNEZXRhY2hlZCkge1xuICAgIC8vIERlZmluZSB0aGlzIG5vZGUgYXMgZGV0YWNoZWQgdG8gYXZvaWQgcHJvamVjdGluZyBpdCBsYXRlclxuICAgIHJlbW92ZWRQaFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xufVxuXG4vKipcbiAqXG4gKiBVc2UgdGhpcyBpbnN0cnVjdGlvbiB0byBjcmVhdGUgYSB0cmFuc2xhdGlvbiBibG9jayB0aGF0IGRvZXNuJ3QgY29udGFpbiBhbnkgcGxhY2Vob2xkZXIuXG4gKiBJdCBjYWxscyBib3RoIHtAbGluayBpMThuU3RhcnR9IGFuZCB7QGxpbmsgaTE4bkVuZH0gaW4gb25lIGluc3RydWN0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuKGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICDJtcm1aTE4blN0YXJ0KGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgybXJtWkxOG5FbmQoKTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IGluIHRoZSBzdGF0aWMgYmxvY2tcbiAqIEBwYXJhbSB2YWx1ZXNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyhsVmlldywgdFZpZXcsIGluZGV4LCB2YWx1ZXMpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkF0dHJpYnV0ZXNgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyhsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50SW5kZXggPSBwcmV2aW91c0VsZW1lbnQuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWVzW2ldO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB2YWx1ZXNbaSArIDFdO1xuICAgIGNvbnN0IHBhcnRzID0gbWVzc2FnZS5zcGxpdChJQ1VfUkVHRVhQKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcnRzW2pdO1xuXG4gICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJQ1UgZXhwcmVzc2lvbnMgYXJlIG5vdCB5ZXQgc3VwcG9ydGVkIGluIGF0dHJpYnV0ZXMnKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09ICcnKSB7XG4gICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISF2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgcHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lKSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUocHJldmlvdXNFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICAvLyBTZXQgYXR0cmlidXRlcyBmb3IgRWxlbWVudHMgb25seSwgZm9yIG90aGVyIHR5cGVzIChsaWtlIEVsZW1lbnRDb250YWluZXIpLFxuICAgICAgICAgIC8vIG9ubHkgc2V0IGlucHV0cyBiZWxvd1xuICAgICAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSwgdmFsdWUsIGxWaWV3KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhhdCBhdHRyaWJ1dGUgaXMgYSBkaXJlY3RpdmUgaW5wdXRcbiAgICAgICAgICBjb25zdCBkYXRhVmFsdWUgPSB0Tm9kZS5pbnB1dHMgJiYgdE5vZGUuaW5wdXRzW2F0dHJOYW1lXTtcbiAgICAgICAgICBpZiAoZGF0YVZhbHVlKSB7XG4gICAgICAgICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KHByZXZpb3VzRWxlbWVudEluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgICAgICAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSB1cGRhdGVPcENvZGVzO1xuICB9XG59XG5cbmxldCBjaGFuZ2VNYXNrID0gMGIwO1xubGV0IHNoaWZ0c0NvdW50ZXIgPSAwO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgdmFsdWVzIG9mIHRoZSBiaW5kaW5ncyBkdXJpbmcgZWFjaCB1cGRhdGUgY3ljbGUgaW4gb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG9cbiAqIHVwZGF0ZSB0aGUgdHJhbnNsYXRlZCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVGhlIGJpbmRpbmcncyB2YWx1ZVxuICogQHJldHVybnMgVGhpcyBmdW5jdGlvbiByZXR1cm5zIGl0c2VsZiBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkXG4gKiAoZS5nLiBgaTE4bkV4cChjdHgubmFtZSkoY3R4LnRpdGxlKWApXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuRXhwPFQ+KHZhbHVlOiBUKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgaWYgKGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBuZXh0QmluZGluZ0luZGV4KCksIHZhbHVlKSkge1xuICAgIGNoYW5nZU1hc2sgPSBjaGFuZ2VNYXNrIHwgKDEgPDwgc2hpZnRzQ291bnRlcik7XG4gIH1cbiAgc2hpZnRzQ291bnRlcisrO1xuICByZXR1cm4gybXJtWkxOG5FeHA7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkFwcGx5KGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHNoaWZ0c0NvdW50ZXIpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICAgIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdO1xuICAgIGxldCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcztcbiAgICBsZXQgaWN1czogVEljdVtdfG51bGwgPSBudWxsO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRJMThuKSkge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9IHRJMThuIGFzIEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gKHRJMThuIGFzIFRJMThuKS51cGRhdGU7XG4gICAgICBpY3VzID0gKHRJMThuIGFzIFRJMThuKS5pY3VzO1xuICAgIH1cbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBnZXRCaW5kaW5nSW5kZXgoKSAtIHNoaWZ0c0NvdW50ZXIgLSAxO1xuICAgIHJlYWRVcGRhdGVPcENvZGVzKHVwZGF0ZU9wQ29kZXMsIGljdXMsIGJpbmRpbmdzU3RhcnRJbmRleCwgY2hhbmdlTWFzaywgbFZpZXcpO1xuXG4gICAgLy8gUmVzZXQgY2hhbmdlTWFzayAmIG1hc2tCaXQgdG8gZGVmYXVsdCBmb3IgdGhlIG5leHQgdXBkYXRlIGN5Y2xlXG4gICAgY2hhbmdlTWFzayA9IDBiMDtcbiAgICBzaGlmdHNDb3VudGVyID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNhc2Ugb2YgYW4gSUNVIGV4cHJlc3Npb24gZGVwZW5kaW5nIG9uIHRoZSBtYWluIGJpbmRpbmcgdmFsdWVcbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGJpbmRpbmdWYWx1ZSBUaGUgdmFsdWUgb2YgdGhlIG1haW4gYmluZGluZyB1c2VkIGJ5IHRoaXMgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FzZUluZGV4KGljdUV4cHJlc3Npb246IFRJY3UsIGJpbmRpbmdWYWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXNlKGJpbmRpbmdWYWx1ZSwgZ2V0TG9jYWxlSWQoKSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIGZvciBJQ1UgZXhwcmVzc2lvbnMuXG4gKlxuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIHN0YXJ0SW5kZXhcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBpY3VTdGFydChcbiAgICB0SWN1czogVEljdVtdLCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBzdGFydEluZGV4OiBudW1iZXIsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjcmVhdGVDb2RlcyA9IFtdO1xuICBjb25zdCByZW1vdmVDb2RlcyA9IFtdO1xuICBjb25zdCB1cGRhdGVDb2RlcyA9IFtdO1xuICBjb25zdCB2YXJzID0gW107XG4gIGNvbnN0IGNoaWxkSWN1czogbnVtYmVyW11bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gRWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzICYgb3RoZXIgSUNVIGV4cHJlc3Npb25zXG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBjb25zdCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gbmVzdGVkIElDVSBleHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGljdUluZGV4ID0gbmVzdGVkSWN1cy5wdXNoKHZhbHVlIGFzIEljdUV4cHJlc3Npb24pIC0gMTtcbiAgICAgICAgLy8gUmVwbGFjZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb24gYnkgYSBjb21tZW50IG5vZGVcbiAgICAgICAgdmFsdWVBcnJbal0gPSBgPCEtLe+/vSR7aWN1SW5kZXh977+9LS0+YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaWN1Q2FzZTogSWN1Q2FzZSA9XG4gICAgICAgIHBhcnNlSWN1Q2FzZSh2YWx1ZUFyci5qb2luKCcnKSwgc3RhcnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICBjcmVhdGVDb2Rlcy5wdXNoKGljdUNhc2UuY3JlYXRlKTtcbiAgICByZW1vdmVDb2Rlcy5wdXNoKGljdUNhc2UucmVtb3ZlKTtcbiAgICB1cGRhdGVDb2Rlcy5wdXNoKGljdUNhc2UudXBkYXRlKTtcbiAgICB2YXJzLnB1c2goaWN1Q2FzZS52YXJzKTtcbiAgICBjaGlsZEljdXMucHVzaChpY3VDYXNlLmNoaWxkSWN1cyk7XG4gIH1cbiAgY29uc3QgdEljdTogVEljdSA9IHtcbiAgICB0eXBlOiBpY3VFeHByZXNzaW9uLnR5cGUsXG4gICAgdmFycyxcbiAgICBjaGlsZEljdXMsXG4gICAgY2FzZXM6IGljdUV4cHJlc3Npb24uY2FzZXMsXG4gICAgY3JlYXRlOiBjcmVhdGVDb2RlcyxcbiAgICByZW1vdmU6IHJlbW92ZUNvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlQ29kZXNcbiAgfTtcbiAgdEljdXMucHVzaCh0SWN1KTtcbiAgLy8gQWRkaW5nIHRoZSBtYXhpbXVtIHBvc3NpYmxlIG9mIHZhcnMgbmVlZGVkIChiYXNlZCBvbiB0aGUgY2FzZXMgd2l0aCB0aGUgbW9zdCB2YXJzKVxuICBpMThuVmFyc0NvdW50ICs9IE1hdGgubWF4KC4uLnZhcnMpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgdGVtcGxhdGUgaW50byBhbiBIVE1MIHRlbXBsYXRlIGFuZCBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdXBkYXRlXG4gKiBhdHRyaWJ1dGVzIG9yIG5vZGVzIHRoYXQgY29udGFpbiBiaW5kaW5ncy5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCBUaGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0gcGFyZW50SW5kZXhcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBwYXJzZUljdUNhc2UoXG4gICAgdW5zYWZlSHRtbDogc3RyaW5nLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sIHRJY3VzOiBUSWN1W10sXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IEljdUNhc2Uge1xuICBjb25zdCBpbmVydEJvZHlIZWxwZXIgPSBuZXcgSW5lcnRCb2R5SGVscGVyKGdldERvY3VtZW50KCkpO1xuICBjb25zdCBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gIGlmICghaW5lcnRCb2R5RWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGdlbmVyYXRlIGluZXJ0IGJvZHkgZWxlbWVudCcpO1xuICB9XG4gIGNvbnN0IHdyYXBwZXIgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCAhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gIGNvbnN0IG9wQ29kZXM6IEljdUNhc2UgPSB7dmFyczogMCwgY2hpbGRJY3VzOiBbXSwgY3JlYXRlOiBbXSwgcmVtb3ZlOiBbXSwgdXBkYXRlOiBbXX07XG4gIHBhcnNlTm9kZXMod3JhcHBlci5maXJzdENoaWxkLCBvcENvZGVzLCBwYXJlbnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgcmV0dXJuIG9wQ29kZXM7XG59XG5cbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICogQHBhcmFtIGN1cnJlbnROb2RlIFRoZSBmaXJzdCBub2RlIHRvIHBhcnNlXG4gKiBAcGFyYW0gaWN1Q2FzZSBUaGUgZGF0YSBmb3IgdGhlIElDVSBleHByZXNzaW9uIGNhc2UgdGhhdCBjb250YWlucyB0aG9zZSBub2Rlc1xuICogQHBhcmFtIHBhcmVudEluZGV4IEluZGV4IG9mIHRoZSBjdXJyZW50IG5vZGUncyBwYXJlbnRcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzIERhdGEgZm9yIHRoZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb25zIHRoYXQgdGhpcyBjYXNlIGNvbnRhaW5zXG4gKiBAcGFyYW0gdEljdXMgRGF0YSBmb3IgYWxsIElDVSBleHByZXNzaW9ucyBvZiB0aGUgY3VycmVudCBtZXNzYWdlXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXggRXhwYW5kbyBzdGFydCBpbmRleCBmb3IgdGhlIGN1cnJlbnQgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gcGFyc2VOb2RlcyhcbiAgICBjdXJyZW50Tm9kZTogTm9kZSB8IG51bGwsIGljdUNhc2U6IEljdUNhc2UsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSxcbiAgICB0SWN1czogVEljdVtdLCBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5lc3RlZEljdXNUb0NyZWF0ZTogW0ljdUV4cHJlc3Npb24sIG51bWJlcl1bXSA9IFtdO1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgICAgY29uc3QgbmV4dE5vZGU6IE5vZGV8bnVsbCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBleHBhbmRvU3RhcnRJbmRleCArICsraWN1Q2FzZS52YXJzO1xuICAgICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGEgdmFsaWQgZWxlbWVudCwgd2Ugd29uJ3QgY3JlYXRlIGFuIGVsZW1lbnQgZm9yIGl0XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSAhO1xuICAgICAgICAgICAgICBjb25zdCBsb3dlckF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIWF0dHIudmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIGlucHV0IHN0cmluZyBpcyBzYWZlLCB1bmxlc3MgaXQncyB1c2luZyBhIGJpbmRpbmdcbiAgICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXJBdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgX3Nhbml0aXplVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIHNhbml0aXplU3Jjc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGBXQVJOSU5HOiBpZ25vcmluZyB1bnNhZmUgYXR0cmlidXRlIHZhbHVlICR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAke3RhZ05hbWV9IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuQXR0ciwgYXR0ci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGNoaWxkcmVuIG9mIHRoaXMgbm9kZSAoaWYgYW55KVxuICAgICAgICAgICAgcGFyc2VOb2RlcyhcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5maXJzdENoaWxkLCBpY3VDYXNlLCBuZXdJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcGFyZW50IG5vZGUgYWZ0ZXIgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdmFsdWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgbmV3SW5kZXgpLCBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21tZW50IG5vZGUgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBuZXN0ZWQgSUNVXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBORVNURURfSUNVLmV4ZWMoY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJycpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1SW5kZXggPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgY29uc3QgbmV3TG9jYWwgPSBuZ0Rldk1vZGUgPyBgbmVzdGVkIElDVSAke25lc3RlZEljdUluZGV4fWAgOiAnJztcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZXdMb2NhbCwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNbbmVzdGVkSWN1SW5kZXhdO1xuICAgICAgICAgICAgbmVzdGVkSWN1c1RvQ3JlYXRlLnB1c2goW25lc3RlZEljdSwgbmV3SW5kZXhdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBjb21tZW50XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBlbGVtZW50XG4gICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IG5leHROb2RlICE7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWRJY3VzVG9DcmVhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVswXTtcbiAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVsxXTtcbiAgICAgIGljdVN0YXJ0KHRJY3VzLCBuZXN0ZWRJY3UsIG5lc3RlZEljdU5vZGVJbmRleCwgZXhwYW5kb1N0YXJ0SW5kZXggKyBpY3VDYXNlLnZhcnMpO1xuICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgY29uc3QgbmVzdFRJY3VJbmRleCA9IHRJY3VzLmxlbmd0aCAtIDE7XG4gICAgICBpY3VDYXNlLnZhcnMgKz0gTWF0aC5tYXgoLi4udEljdXNbbmVzdFRJY3VJbmRleF0udmFycyk7XG4gICAgICBpY3VDYXNlLmNoaWxkSWN1cy5wdXNoKG5lc3RUSWN1SW5kZXgpO1xuICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKG5lc3RlZEljdSk7XG4gICAgICBpY3VDYXNlLnVwZGF0ZS5wdXNoKFxuICAgICAgICAgIHRvTWFza0JpdChuZXN0ZWRJY3UubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIC0xIC0gbmVzdGVkSWN1Lm1haW5CaW5kaW5nLFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgsXG4gICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCk7XG4gICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdSxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQW5ndWxhciBEYXJ0IGludHJvZHVjZWQgJm5nc3A7IGFzIGEgcGxhY2Vob2xkZXIgZm9yIG5vbi1yZW1vdmFibGUgc3BhY2UsIHNlZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJ0LWxhbmcvYW5ndWxhci9ibG9iLzBiYjYxMTM4N2QyOWQ2NWI1YWY3ZjlkMjUxNWFiNTcxZmQzZmJlZTQvX3Rlc3RzL3Rlc3QvY29tcGlsZXIvcHJlc2VydmVfd2hpdGVzcGFjZV90ZXN0LmRhcnQjTDI1LUwzMlxuICogSW4gQW5ndWxhciBEYXJ0ICZuZ3NwOyBpcyBjb252ZXJ0ZWQgdG8gdGhlIDB4RTUwMCBQVUEgKFByaXZhdGUgVXNlIEFyZWFzKSB1bmljb2RlIGNoYXJhY3RlclxuICogYW5kIGxhdGVyIG9uIHJlcGxhY2VkIGJ5IGEgc3BhY2UuIFdlIGFyZSByZS1pbXBsZW1lbnRpbmcgdGhlIHNhbWUgaWRlYSBoZXJlLCBzaW5jZSB0cmFuc2xhdGlvbnNcbiAqIG1pZ2h0IGNvbnRhaW4gdGhpcyBzcGVjaWFsIGNoYXJhY3Rlci5cbiAqL1xuY29uc3QgTkdTUF9VTklDT0RFX1JFR0VYUCA9IC9cXHVFNTAwL2c7XG5mdW5jdGlvbiByZXBsYWNlTmdzcCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoTkdTUF9VTklDT0RFX1JFR0VYUCwgJyAnKTtcbn1cblxuLyoqXG4gKiBUaGUgbG9jYWxlIGlkIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGlzIGN1cnJlbnRseSB1c2luZyAoZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zKS5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xubGV0IExPQ0FMRV9JRCA9IERFRkFVTFRfTE9DQUxFX0lEO1xuXG4vKipcbiAqIFNldHMgdGhlIGxvY2FsZSBpZCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdHJhbnNsYXRpb25zIGFuZCBJQ1UgZXhwcmVzc2lvbnMuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxvY2FsZUlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRMb2NhbGVJZChsb2NhbGVJZDogc3RyaW5nKSB7XG4gIGFzc2VydERlZmluZWQobG9jYWxlSWQsIGBFeHBlY3RlZCBsb2NhbGVJZCB0byBiZSBkZWZpbmVkYCk7XG4gIGlmICh0eXBlb2YgbG9jYWxlSWQgPT09ICdzdHJpbmcnKSB7XG4gICAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsb2NhbGUgaWQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zLlxuICogVGhpcyBpcyB0aGUgaXZ5IHZlcnNpb24gb2YgYExPQ0FMRV9JRGAgdGhhdCB3YXMgZGVmaW5lZCBhcyBhbiBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSB2aWV3IGVuZ2luZVxuICogYnV0IGlzIG5vdyBkZWZpbmVkIGFzIGEgZ2xvYmFsIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlSWQoKTogc3RyaW5nIHtcbiAgcmV0dXJuIExPQ0FMRV9JRDtcbn1cbiJdfQ==