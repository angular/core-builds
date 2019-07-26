/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import '../util/ng_i18n_closure_mode';
import { getPluralCase } from '../i18n/localization';
import { SRCSET_ATTRS, URI_ATTRS, VALID_ATTRS, VALID_ELEMENTS, getTemplateContent } from '../sanitization/html_sanitizer';
import { InertBodyHelper } from '../sanitization/inert_body';
import { _sanitizeUrl, sanitizeSrcset } from '../sanitization/url_sanitizer';
import { addAllToArray } from '../util/array_utils';
import { assertDataInRange, assertDefined, assertEqual, assertGreaterThan } from '../util/assert';
import { attachPatchData } from './context_discovery';
import { bind, setDelayProjection, ɵɵload } from './instructions/all';
import { attachI18nOpCodesDebug } from './instructions/lview_debug';
import { allocExpando, elementAttributeInternal, elementPropertyInternal, getOrCreateTNode, setInputsForProperty, textBindingInternal } from './instructions/shared';
import { NATIVE } from './interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { isLContainer } from './interfaces/type_checks';
import { BINDING_INDEX, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from './interfaces/view';
import { appendChild, appendProjectedNodes, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from './state';
import { NO_CHANGE } from './tokens';
import { renderStringify } from './util/misc_utils';
import { findComponentView } from './util/view_traversal_utils';
import { getNativeByIndex, getNativeByTNode, getTNode } from './util/view_utils';
var MARKER = "\uFFFD";
var ICU_BLOCK_REGEXP = /^\s*(�\d+:?\d*�)\s*,\s*(select|plural)\s*,/;
var SUBTEMPLATE_REGEXP = /�\/?\*(\d+:\d+)�/gi;
var PH_REGEXP = /�(\/?[#*!]\d+):?\d*�/gi;
var BINDING_REGEXP = /�(\d+):?\d*�/gi;
var ICU_REGEXP = /({\s*�\d+:?\d*�\s*,\s*\S{6}\s*,[\s\S]*})/gi;
// i18nPostprocess consts
var ROOT_TEMPLATE_ID = 0;
var PP_MULTI_VALUE_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]/;
var PP_PLACEHOLDERS_REGEXP = /\[(�.+?�?)\]|(�\/?\*\d+:\d+�)/g;
var PP_ICU_VARS_REGEXP = /({\s*)(VAR_(PLURAL|SELECT)(_\d+)?)(\s*,)/g;
var PP_ICU_PLACEHOLDERS_REGEXP = /{([A-Z0-9_]+)}/g;
var PP_ICUS_REGEXP = /�I18N_EXP_(ICU(_\d+)?)�/g;
var PP_CLOSE_TEMPLATE_REGEXP = /\/\*/;
var PP_TEMPLATE_ID_REGEXP = /\d+\:(\d+)/;
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
    var prevPos = 0;
    var braceStack = [];
    var results = [];
    var braces = /[{}]/g;
    // lastIndex doesn't get set to 0 so we have to.
    braces.lastIndex = 0;
    var match;
    while (match = braces.exec(pattern)) {
        var pos = match.index;
        if (match[0] == '}') {
            braceStack.pop();
            if (braceStack.length == 0) {
                // End of the block.
                var block = pattern.substring(prevPos, pos);
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
                var substring_1 = pattern.substring(prevPos, pos);
                results.push(substring_1);
                prevPos = pos + 1;
            }
            braceStack.push('{');
        }
    }
    var substring = pattern.substring(prevPos);
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
    var cases = [];
    var values = [];
    var icuType = 1 /* plural */;
    var mainBinding = 0;
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
    var parts = extractParts(pattern);
    // Looking for (key block)+ sequence. One of the keys has to be "other".
    for (var pos = 0; pos < parts.length;) {
        var key = parts[pos++].trim();
        if (icuType === 1 /* plural */) {
            // Key can be "=x", we just want "x"
            key = key.replace(/\s*(?:=)?(\w+)\s*/, '$1');
        }
        if (key.length) {
            cases.push(key);
        }
        var blocks = extractParts(parts[pos++]);
        if (cases.length > values.length) {
            values.push(blocks);
        }
    }
    assertGreaterThan(cases.indexOf('other'), -1, 'Missing key "other" in ICU statement.');
    // TODO(ocombe): support ICU expressions in attributes, see #21615
    return { type: icuType, mainBinding: mainBinding, cases: cases, values: values };
}
/**
 * Removes everything inside the sub-templates of a message.
 */
function removeInnerTemplateTranslation(message) {
    var match;
    var res = '';
    var index = 0;
    var inTemplate = false;
    var tagMatched;
    while ((match = SUBTEMPLATE_REGEXP.exec(message)) !== null) {
        if (!inTemplate) {
            res += message.substring(index, match.index + match[0].length);
            tagMatched = match[1];
            inTemplate = true;
        }
        else {
            if (match[0] === MARKER + "/*" + tagMatched + MARKER) {
                index = match.index;
                inTemplate = false;
            }
        }
    }
    ngDevMode &&
        assertEqual(inTemplate, false, "Tag mismatch: unable to find the end of the sub-template in the translation \"" + message + "\"");
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
    if (typeof subTemplateIndex !== 'number') {
        // We want the root template message, ignore all sub-templates
        return removeInnerTemplateTranslation(message);
    }
    else {
        // We want a specific sub-template
        var start = message.indexOf(":" + subTemplateIndex + MARKER) + 2 + subTemplateIndex.toString().length;
        var end = message.search(new RegExp(MARKER + "\\/\\*\\d+:" + subTemplateIndex + MARKER));
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
function generateBindingUpdateOpCodes(str, destinationNode, attrName, sanitizeFn) {
    if (sanitizeFn === void 0) { sanitizeFn = null; }
    var updateOpCodes = [null, null]; // Alloc space for mask and size
    var textParts = str.split(BINDING_REGEXP);
    var mask = 0;
    for (var j = 0; j < textParts.length; j++) {
        var textValue = textParts[j];
        if (j & 1) {
            // Odd indexes are bindings
            var bindingIndex = parseInt(textValue, 10);
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
function getBindingMask(icuExpression, mask) {
    if (mask === void 0) { mask = 0; }
    mask = mask | toMaskBit(icuExpression.mainBinding);
    var match;
    for (var i = 0; i < icuExpression.values.length; i++) {
        var valueArr = icuExpression.values[i];
        for (var j = 0; j < valueArr.length; j++) {
            var value = valueArr[j];
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
var i18nIndexStack = [];
var i18nIndexStackPointer = -1;
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
var parentIndexStack = [];
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
    var tView = getLView()[TVIEW];
    ngDevMode && assertDefined(tView, "tView should be defined");
    i18nIndexStack[++i18nIndexStackPointer] = index;
    // We need to delay projections until `i18nEnd`
    setDelayProjection(true);
    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nStartFirstPass(tView, index, message, subTemplateIndex);
    }
}
// Count for the number of vars that will be allocated for each i18n block.
// It is global because this is used in multiple functions that include loops and recursive calls.
// This is reset to 0 when `i18nStartFirstPass` is called.
var i18nVarsCount;
/**
 * See `i18nStart` above.
 */
function i18nStartFirstPass(tView, index, message, subTemplateIndex) {
    var viewData = getLView();
    var startIndex = tView.blueprint.length - HEADER_OFFSET;
    i18nVarsCount = 0;
    var previousOrParentTNode = getPreviousOrParentTNode();
    var parentTNode = getIsParent() ? getPreviousOrParentTNode() :
        previousOrParentTNode && previousOrParentTNode.parent;
    var parentIndex = parentTNode && parentTNode !== viewData[T_HOST] ? parentTNode.index - HEADER_OFFSET : index;
    var parentIndexPointer = 0;
    parentIndexStack[parentIndexPointer] = parentIndex;
    var createOpCodes = [];
    // If the previous node wasn't the direct parent then we have a translation without top level
    // element and we need to keep a reference of the previous element if there is one
    if (index > 0 && previousOrParentTNode !== parentTNode) {
        // Create an OpCode to select the previous TNode
        createOpCodes.push(previousOrParentTNode.index << 3 /* SHIFT_REF */ | 0 /* Select */);
    }
    var updateOpCodes = [];
    var icuExpressions = [];
    var templateTranslation = getTranslationForTemplate(message, subTemplateIndex);
    var msgParts = replaceNgsp(templateTranslation).split(PH_REGEXP);
    for (var i = 0; i < msgParts.length; i++) {
        var value = msgParts[i];
        if (i & 1) {
            // Odd indexes are placeholders (elements and sub-templates)
            if (value.charAt(0) === '/') {
                // It is a closing tag
                if (value.charAt(1) === "#" /* ELEMENT */) {
                    var phIndex = parseInt(value.substr(2), 10);
                    parentIndex = parentIndexStack[--parentIndexPointer];
                    createOpCodes.push(phIndex << 3 /* SHIFT_REF */ | 5 /* ElementEnd */);
                }
            }
            else {
                var phIndex = parseInt(value.substr(1), 10);
                // The value represents a placeholder that we move to the designated index
                createOpCodes.push(phIndex << 3 /* SHIFT_REF */ | 0 /* Select */, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                if (value.charAt(0) === "#" /* ELEMENT */) {
                    parentIndexStack[++parentIndexPointer] = parentIndex = phIndex;
                }
            }
        }
        else {
            // Even indexes are text (including bindings & ICU expressions)
            var parts = extractParts(value);
            for (var j = 0; j < parts.length; j++) {
                if (j & 1) {
                    // Odd indexes are ICU expressions
                    // Create the comment node that will anchor the ICU expression
                    var icuNodeIndex = startIndex + i18nVarsCount++;
                    createOpCodes.push(COMMENT_MARKER, ngDevMode ? "ICU " + icuNodeIndex : '', icuNodeIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                    // Update codes for the ICU expression
                    var icuExpression = parts[j];
                    var mask = getBindingMask(icuExpression);
                    icuStart(icuExpressions, icuExpression, icuNodeIndex, icuNodeIndex);
                    // Since this is recursive, the last TIcu that was pushed is the one we want
                    var tIcuIndex = icuExpressions.length - 1;
                    updateOpCodes.push(toMaskBit(icuExpression.mainBinding), // mask of the main binding
                    3, // skip 3 opCodes if not changed
                    -1 - icuExpression.mainBinding, icuNodeIndex << 2 /* SHIFT_REF */ | 2 /* IcuSwitch */, tIcuIndex, mask, // mask of all the bindings of this ICU expression
                    2, // skip 2 opCodes if not changed
                    icuNodeIndex << 2 /* SHIFT_REF */ | 3 /* IcuUpdate */, tIcuIndex);
                }
                else if (parts[j] !== '') {
                    var text = parts[j];
                    // Even indexes are text (including bindings)
                    var hasBinding = text.match(BINDING_REGEXP);
                    // Create text nodes
                    var textNodeIndex = startIndex + i18nVarsCount++;
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
        allocExpando(viewData, i18nVarsCount);
    }
    ngDevMode &&
        attachI18nOpCodesDebug(createOpCodes, updateOpCodes, icuExpressions.length ? icuExpressions : null, viewData);
    // NOTE: local var needed to properly assert the type of `TI18n`.
    var tI18n = {
        vars: i18nVarsCount,
        create: createOpCodes,
        update: updateOpCodes,
        icus: icuExpressions.length ? icuExpressions : null,
    };
    tView.data[index + HEADER_OFFSET] = tI18n;
}
function appendI18nNode(tNode, parentTNode, previousTNode, viewData) {
    ngDevMode && ngDevMode.rendererMoveNode++;
    var nextNode = tNode.next;
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
        tNode.parent = parentTNode;
    }
    // If tNode was moved around, we might need to fix a broken link.
    var cursor = tNode.next;
    while (cursor) {
        if (cursor.next === tNode) {
            cursor.next = nextNode;
        }
        cursor = cursor.next;
    }
    // If the placeholder to append is a projection, we need to move the projected nodes instead
    if (tNode.type === 1 /* Projection */) {
        var tProjectionNode = tNode;
        appendProjectedNodes(viewData, tProjectionNode, tProjectionNode.projection, findComponentView(viewData));
        return tNode;
    }
    appendChild(getNativeByTNode(tNode, viewData), tNode, viewData);
    var slotValue = viewData[tNode.index];
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
export function ɵɵi18nPostprocess(message, replacements) {
    if (replacements === void 0) { replacements = {}; }
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
    var result = message;
    if (PP_MULTI_VALUE_PLACEHOLDERS_REGEXP.test(message)) {
        var matches_1 = {};
        var templateIdsStack_1 = [ROOT_TEMPLATE_ID];
        result = result.replace(PP_PLACEHOLDERS_REGEXP, function (m, phs, tmpl) {
            var content = phs || tmpl;
            var placeholders = matches_1[content] || [];
            if (!placeholders.length) {
                content.split('|').forEach(function (placeholder) {
                    var match = placeholder.match(PP_TEMPLATE_ID_REGEXP);
                    var templateId = match ? parseInt(match[1], 10) : ROOT_TEMPLATE_ID;
                    var isCloseTemplateTag = PP_CLOSE_TEMPLATE_REGEXP.test(placeholder);
                    placeholders.push([templateId, isCloseTemplateTag, placeholder]);
                });
                matches_1[content] = placeholders;
            }
            if (!placeholders.length) {
                throw new Error("i18n postprocess: unmatched placeholder - " + content);
            }
            var currentTemplateId = templateIdsStack_1[templateIdsStack_1.length - 1];
            var idx = 0;
            // find placeholder index that matches current template id
            for (var i = 0; i < placeholders.length; i++) {
                if (placeholders[i][0] === currentTemplateId) {
                    idx = i;
                    break;
                }
            }
            // update template id stack based on the current tag extracted
            var _a = tslib_1.__read(placeholders[idx], 3), templateId = _a[0], isCloseTemplateTag = _a[1], placeholder = _a[2];
            if (isCloseTemplateTag) {
                templateIdsStack_1.pop();
            }
            else if (currentTemplateId !== templateId) {
                templateIdsStack_1.push(templateId);
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
    result = result.replace(PP_ICU_VARS_REGEXP, function (match, start, key, _type, _idx, end) {
        return replacements.hasOwnProperty(key) ? "" + start + replacements[key] + end : match;
    });
    /**
     * Step 3: replace all placeholders used inside ICUs in a form of {PLACEHOLDER}
     */
    result = result.replace(PP_ICU_PLACEHOLDERS_REGEXP, function (match, key) {
        return replacements.hasOwnProperty(key) ? replacements[key] : match;
    });
    /**
     * Step 4: replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�) in case
     * multiple ICUs have the same placeholder name
     */
    result = result.replace(PP_ICUS_REGEXP, function (match, key) {
        if (replacements.hasOwnProperty(key)) {
            var list = replacements[key];
            if (!list.length) {
                throw new Error("i18n postprocess: unmatched ICU - " + match + " with key: " + key);
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
    var tView = getLView()[TVIEW];
    ngDevMode && assertDefined(tView, "tView should be defined");
    i18nEndFirstPass(tView);
    // Stop delaying projections
    setDelayProjection(false);
}
/**
 * See `i18nEnd` above.
 */
function i18nEndFirstPass(tView) {
    var viewData = getLView();
    ngDevMode && assertEqual(viewData[BINDING_INDEX], viewData[TVIEW].bindingStartIndex, 'i18nEnd should be called before any binding');
    var rootIndex = i18nIndexStack[i18nIndexStackPointer--];
    var tI18n = tView.data[rootIndex + HEADER_OFFSET];
    ngDevMode && assertDefined(tI18n, "You should call i18nStart before i18nEnd");
    // Find the last node that was added before `i18nEnd`
    var lastCreatedNode = getPreviousOrParentTNode();
    // Read the instructions to insert/move/remove DOM elements
    var visitedNodes = readCreateOpCodes(rootIndex, tI18n.create, tI18n.icus, viewData);
    // Remove deleted nodes
    for (var i = rootIndex + 1; i <= lastCreatedNode.index - HEADER_OFFSET; i++) {
        if (visitedNodes.indexOf(i) === -1) {
            removeNode(i, viewData);
        }
    }
}
/**
 * Creates and stores the dynamic TNode, and unhooks it from the tree for now.
 */
function createDynamicNodeAtIndex(lView, index, type, native, name) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    lView[index + HEADER_OFFSET] = native;
    var tNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], index, type, name, null);
    // We are creating a dynamic node, the previous tNode might not be pointing at this node.
    // We will link ourselves into the tree later with `appendI18nNode`.
    if (previousOrParentTNode.next === tNode) {
        previousOrParentTNode.next = null;
    }
    return tNode;
}
function readCreateOpCodes(index, createOpCodes, icus, viewData) {
    var renderer = getLView()[RENDERER];
    var currentTNode = null;
    var previousTNode = null;
    var visitedNodes = [];
    for (var i = 0; i < createOpCodes.length; i++) {
        var opCode = createOpCodes[i];
        if (typeof opCode == 'string') {
            var textRNode = createTextNode(opCode, renderer);
            var textNodeIndex = createOpCodes[++i];
            ngDevMode && ngDevMode.rendererCreateTextNode++;
            previousTNode = currentTNode;
            currentTNode =
                createDynamicNodeAtIndex(viewData, textNodeIndex, 3 /* Element */, textRNode, null);
            visitedNodes.push(textNodeIndex);
            setIsNotParent();
        }
        else if (typeof opCode == 'number') {
            switch (opCode & 7 /* MASK_OPCODE */) {
                case 1 /* AppendChild */:
                    var destinationNodeIndex = opCode >>> 17 /* SHIFT_PARENT */;
                    var destinationTNode = void 0;
                    if (destinationNodeIndex === index) {
                        // If the destination node is `i18nStart`, we don't have a
                        // top-level node and we should use the host node instead
                        destinationTNode = viewData[T_HOST];
                    }
                    else {
                        destinationTNode = getTNode(destinationNodeIndex, viewData);
                    }
                    ngDevMode &&
                        assertDefined(currentTNode, "You need to create or select a node before you can insert it into the DOM");
                    previousTNode = appendI18nNode(currentTNode, destinationTNode, previousTNode, viewData);
                    break;
                case 0 /* Select */:
                    var nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    visitedNodes.push(nodeIndex);
                    previousTNode = currentTNode;
                    currentTNode = getTNode(nodeIndex, viewData);
                    if (currentTNode) {
                        setPreviousOrParentTNode(currentTNode, currentTNode.type === 3 /* Element */);
                    }
                    break;
                case 5 /* ElementEnd */:
                    var elementIndex = opCode >>> 3 /* SHIFT_REF */;
                    previousTNode = currentTNode = getTNode(elementIndex, viewData);
                    setPreviousOrParentTNode(currentTNode, false);
                    break;
                case 4 /* Attr */:
                    var elementNodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    var attrName = createOpCodes[++i];
                    var attrValue = createOpCodes[++i];
                    // This code is used for ICU expressions only, since we don't support
                    // directives/components in ICUs, we don't need to worry about inputs here
                    elementAttributeInternal(elementNodeIndex, attrName, attrValue, viewData);
                    break;
                default:
                    throw new Error("Unable to determine the type of mutate operation for \"" + opCode + "\"");
            }
        }
        else {
            switch (opCode) {
                case COMMENT_MARKER:
                    var commentValue = createOpCodes[++i];
                    var commentNodeIndex = createOpCodes[++i];
                    ngDevMode && assertEqual(typeof commentValue, 'string', "Expected \"" + commentValue + "\" to be a comment node value");
                    var commentRNode = renderer.createComment(commentValue);
                    ngDevMode && ngDevMode.rendererCreateComment++;
                    previousTNode = currentTNode;
                    currentTNode = createDynamicNodeAtIndex(viewData, commentNodeIndex, 5 /* IcuContainer */, commentRNode, null);
                    visitedNodes.push(commentNodeIndex);
                    attachPatchData(commentRNode, viewData);
                    currentTNode.activeCaseIndex = null;
                    // We will add the case nodes later, during the update phase
                    setIsNotParent();
                    break;
                case ELEMENT_MARKER:
                    var tagNameValue = createOpCodes[++i];
                    var elementNodeIndex = createOpCodes[++i];
                    ngDevMode && assertEqual(typeof tagNameValue, 'string', "Expected \"" + tagNameValue + "\" to be an element node tag name");
                    var elementRNode = renderer.createElement(tagNameValue);
                    ngDevMode && ngDevMode.rendererCreateElement++;
                    previousTNode = currentTNode;
                    currentTNode = createDynamicNodeAtIndex(viewData, elementNodeIndex, 3 /* Element */, elementRNode, tagNameValue);
                    visitedNodes.push(elementNodeIndex);
                    break;
                default:
                    throw new Error("Unable to determine the type of mutate operation for \"" + opCode + "\"");
            }
        }
    }
    setIsNotParent();
    return visitedNodes;
}
function readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, viewData, bypassCheckBit) {
    if (bypassCheckBit === void 0) { bypassCheckBit = false; }
    var caseCreated = false;
    for (var i = 0; i < updateOpCodes.length; i++) {
        // bit code to check if we should apply the next update
        var checkBit = updateOpCodes[i];
        // Number of opCodes to skip until next set of update codes
        var skipCodes = updateOpCodes[++i];
        if (bypassCheckBit || (checkBit & changeMask)) {
            // The value has been updated since last checked
            var value = '';
            for (var j = i + 1; j <= (i + skipCodes); j++) {
                var opCode = updateOpCodes[j];
                if (typeof opCode == 'string') {
                    value += opCode;
                }
                else if (typeof opCode == 'number') {
                    if (opCode < 0) {
                        // It's a binding index whose value is negative
                        value += renderStringify(viewData[bindingsStartIndex - opCode]);
                    }
                    else {
                        var nodeIndex = opCode >>> 2 /* SHIFT_REF */;
                        var tIcuIndex = void 0;
                        var tIcu = void 0;
                        var icuTNode = void 0;
                        switch (opCode & 3 /* MASK_OPCODE */) {
                            case 1 /* Attr */:
                                var propName = updateOpCodes[++j];
                                var sanitizeFn = updateOpCodes[++j];
                                elementPropertyInternal(nodeIndex, propName, value, sanitizeFn);
                                break;
                            case 0 /* Text */:
                                textBindingInternal(viewData, nodeIndex, value);
                                break;
                            case 2 /* IcuSwitch */:
                                tIcuIndex = updateOpCodes[++j];
                                tIcu = icus[tIcuIndex];
                                icuTNode = getTNode(nodeIndex, viewData);
                                // If there is an active case, delete the old nodes
                                if (icuTNode.activeCaseIndex !== null) {
                                    var removeCodes = tIcu.remove[icuTNode.activeCaseIndex];
                                    for (var k = 0; k < removeCodes.length; k++) {
                                        var removeOpCode = removeCodes[k];
                                        switch (removeOpCode & 7 /* MASK_OPCODE */) {
                                            case 3 /* Remove */:
                                                var nodeIndex_1 = removeOpCode >>> 3 /* SHIFT_REF */;
                                                removeNode(nodeIndex_1, viewData);
                                                break;
                                            case 6 /* RemoveNestedIcu */:
                                                var nestedIcuNodeIndex = removeCodes[k + 1] >>> 3 /* SHIFT_REF */;
                                                var nestedIcuTNode = getTNode(nestedIcuNodeIndex, viewData);
                                                var activeIndex = nestedIcuTNode.activeCaseIndex;
                                                if (activeIndex !== null) {
                                                    var nestedIcuTIndex = removeOpCode >>> 3 /* SHIFT_REF */;
                                                    var nestedTIcu = icus[nestedIcuTIndex];
                                                    addAllToArray(nestedTIcu.remove[activeIndex], removeCodes);
                                                }
                                                break;
                                        }
                                    }
                                }
                                // Update the active caseIndex
                                var caseIndex = getCaseIndex(tIcu, value);
                                icuTNode.activeCaseIndex = caseIndex !== -1 ? caseIndex : null;
                                // Add the nodes for the new case
                                readCreateOpCodes(-1, tIcu.create[caseIndex], icus, viewData);
                                caseCreated = true;
                                break;
                            case 3 /* IcuUpdate */:
                                tIcuIndex = updateOpCodes[++j];
                                tIcu = icus[tIcuIndex];
                                icuTNode = getTNode(nodeIndex, viewData);
                                readUpdateOpCodes(tIcu.update[icuTNode.activeCaseIndex], icus, bindingsStartIndex, changeMask, viewData, caseCreated);
                                break;
                        }
                    }
                }
            }
        }
        i += skipCodes;
    }
}
function removeNode(index, viewData) {
    var removedPhTNode = getTNode(index, viewData);
    var removedPhRNode = getNativeByIndex(index, viewData);
    if (removedPhRNode) {
        nativeRemoveNode(viewData[RENDERER], removedPhRNode);
    }
    var slotValue = ɵɵload(index);
    if (isLContainer(slotValue)) {
        var lContainer = slotValue;
        if (removedPhTNode.type !== 0 /* Container */) {
            nativeRemoveNode(viewData[RENDERER], lContainer[NATIVE]);
        }
    }
    // Define this node as detached so that we don't risk projecting it
    removedPhTNode.flags |= 32 /* isDetached */;
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
    var tView = getLView()[TVIEW];
    ngDevMode && assertDefined(tView, "tView should be defined");
    i18nAttributesFirstPass(tView, index, values);
}
/**
 * See `i18nAttributes` above.
 */
function i18nAttributesFirstPass(tView, index, values) {
    var previousElement = getPreviousOrParentTNode();
    var previousElementIndex = previousElement.index - HEADER_OFFSET;
    var updateOpCodes = [];
    for (var i = 0; i < values.length; i += 2) {
        var attrName = values[i];
        var message = values[i + 1];
        var parts = message.split(ICU_REGEXP);
        for (var j = 0; j < parts.length; j++) {
            var value = parts[j];
            if (j & 1) {
                // Odd indexes are ICU expressions
                // TODO(ocombe): support ICU expressions in attributes
                throw new Error('ICU expressions are not yet supported in attributes');
            }
            else if (value !== '') {
                // Even indexes are text (including bindings)
                var hasBinding = !!value.match(BINDING_REGEXP);
                if (hasBinding) {
                    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
                        addAllToArray(generateBindingUpdateOpCodes(value, previousElementIndex, attrName), updateOpCodes);
                    }
                }
                else {
                    var lView = getLView();
                    elementAttributeInternal(previousElementIndex, attrName, value, lView);
                    // Check if that attribute is a directive input
                    var tNode = getTNode(previousElementIndex, lView);
                    var dataValue = tNode.inputs && tNode.inputs[attrName];
                    if (dataValue) {
                        setInputsForProperty(lView, dataValue, value);
                    }
                }
            }
        }
    }
    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
        tView.data[index + HEADER_OFFSET] = updateOpCodes;
    }
}
var changeMask = 0;
var shiftsCounter = 0;
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
    var lView = getLView();
    var expression = bind(lView, value);
    if (expression !== NO_CHANGE) {
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
        var lView = getLView();
        var tView = lView[TVIEW];
        ngDevMode && assertDefined(tView, "tView should be defined");
        var tI18n = tView.data[index + HEADER_OFFSET];
        var updateOpCodes = void 0;
        var icus = null;
        if (Array.isArray(tI18n)) {
            updateOpCodes = tI18n;
        }
        else {
            updateOpCodes = tI18n.update;
            icus = tI18n.icus;
        }
        var bindingsStartIndex = lView[BINDING_INDEX] - shiftsCounter - 1;
        readUpdateOpCodes(updateOpCodes, icus, bindingsStartIndex, changeMask, lView);
        // Reset changeMask & maskBit to default for the next update cycle
        changeMask = 0;
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
    var index = icuExpression.cases.indexOf(bindingValue);
    if (index === -1) {
        switch (icuExpression.type) {
            case 1 /* plural */: {
                var resolvedCase = getPluralCase(bindingValue, getLocaleId());
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
    var createCodes = [];
    var removeCodes = [];
    var updateCodes = [];
    var vars = [];
    var childIcus = [];
    for (var i = 0; i < icuExpression.values.length; i++) {
        // Each value is an array of strings & other ICU expressions
        var valueArr = icuExpression.values[i];
        var nestedIcus = [];
        for (var j = 0; j < valueArr.length; j++) {
            var value = valueArr[j];
            if (typeof value !== 'string') {
                // It is an nested ICU expression
                var icuIndex = nestedIcus.push(value) - 1;
                // Replace nested ICU expression by a comment node
                valueArr[j] = "<!--\uFFFD" + icuIndex + "\uFFFD-->";
            }
        }
        var icuCase = parseIcuCase(valueArr.join(''), startIndex, nestedIcus, tIcus, expandoStartIndex);
        createCodes.push(icuCase.create);
        removeCodes.push(icuCase.remove);
        updateCodes.push(icuCase.update);
        vars.push(icuCase.vars);
        childIcus.push(icuCase.childIcus);
    }
    var tIcu = {
        type: icuExpression.type,
        vars: vars,
        childIcus: childIcus,
        cases: icuExpression.cases,
        create: createCodes,
        remove: removeCodes,
        update: updateCodes
    };
    tIcus.push(tIcu);
    // Adding the maximum possible of vars needed (based on the cases with the most vars)
    i18nVarsCount += Math.max.apply(Math, tslib_1.__spread(vars));
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
    var inertBodyHelper = new InertBodyHelper(document);
    var inertBodyElement = inertBodyHelper.getInertBodyElement(unsafeHtml);
    if (!inertBodyElement) {
        throw new Error('Unable to generate inert body element');
    }
    var wrapper = getTemplateContent(inertBodyElement) || inertBodyElement;
    var opCodes = { vars: 0, childIcus: [], create: [], remove: [], update: [] };
    parseNodes(wrapper.firstChild, opCodes, parentIndex, nestedIcus, tIcus, expandoStartIndex);
    return opCodes;
}
var NESTED_ICU = /�(\d+)�/;
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
        var nestedIcusToCreate = [];
        while (currentNode) {
            var nextNode = currentNode.nextSibling;
            var newIndex = expandoStartIndex + ++icuCase.vars;
            switch (currentNode.nodeType) {
                case Node.ELEMENT_NODE:
                    var element = currentNode;
                    var tagName = element.tagName.toLowerCase();
                    if (!VALID_ELEMENTS.hasOwnProperty(tagName)) {
                        // This isn't a valid element, we won't create an element for it
                        icuCase.vars--;
                    }
                    else {
                        icuCase.create.push(ELEMENT_MARKER, tagName, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        var elAttrs = element.attributes;
                        for (var i = 0; i < elAttrs.length; i++) {
                            var attr = elAttrs.item(i);
                            var lowerAttrName = attr.name.toLowerCase();
                            var hasBinding_1 = !!attr.value.match(BINDING_REGEXP);
                            // we assume the input string is safe, unless it's using a binding
                            if (hasBinding_1) {
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
                                        console.warn("WARNING: ignoring unsafe attribute value " + lowerAttrName + " on element " + tagName + " (see http://g.co/ng/security#xss)");
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
                    var value = currentNode.textContent || '';
                    var hasBinding = value.match(BINDING_REGEXP);
                    icuCase.create.push(hasBinding ? '' : value, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                    icuCase.remove.push(newIndex << 3 /* SHIFT_REF */ | 3 /* Remove */);
                    if (hasBinding) {
                        addAllToArray(generateBindingUpdateOpCodes(value, newIndex), icuCase.update);
                    }
                    break;
                case Node.COMMENT_NODE:
                    // Check if the comment node is a placeholder for a nested ICU
                    var match = NESTED_ICU.exec(currentNode.textContent || '');
                    if (match) {
                        var nestedIcuIndex = parseInt(match[1], 10);
                        var newLocal = ngDevMode ? "nested ICU " + nestedIcuIndex : '';
                        // Create the comment node that will anchor the ICU expression
                        icuCase.create.push(COMMENT_MARKER, newLocal, newIndex, parentIndex << 17 /* SHIFT_PARENT */ | 1 /* AppendChild */);
                        var nestedIcu = nestedIcus[nestedIcuIndex];
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
        for (var i = 0; i < nestedIcusToCreate.length; i++) {
            var nestedIcu = nestedIcusToCreate[i][0];
            var nestedIcuNodeIndex = nestedIcusToCreate[i][1];
            icuStart(tIcus, nestedIcu, nestedIcuNodeIndex, expandoStartIndex + icuCase.vars);
            // Since this is recursive, the last TIcu that was pushed is the one we want
            var nestTIcuIndex = tIcus.length - 1;
            icuCase.vars += Math.max.apply(Math, tslib_1.__spread(tIcus[nestTIcuIndex].vars));
            icuCase.childIcus.push(nestTIcuIndex);
            var mask = getBindingMask(nestedIcu);
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
 */
var NGSP_UNICODE_REGEXP = /\uE500/g;
function replaceNgsp(value) {
    return value.replace(NGSP_UNICODE_REGEXP, ' ');
}
var TRANSLATIONS = {};
/**
 * Set the configuration for `i18nLocalize`.
 *
 * @deprecated this method is temporary & should not be used as it will be removed soon
 */
export function i18nConfigureLocalize(options) {
    if (options === void 0) { options = {
        translations: {}
    }; }
    TRANSLATIONS = options.translations;
}
var LOCALIZE_PH_REGEXP = /\{\$(.*?)\}/g;
/**
 * A goog.getMsg-like function for users that do not use Closure.
 *
 * This method is required as a *temporary* measure to prevent i18n tests from being blocked while
 * running outside of Closure Compiler. This method will not be needed once runtime translation
 * service support is introduced.
 *
 * @codeGenApi
 * @deprecated this method is temporary & should not be used as it will be removed soon
 */
export function ɵɵi18nLocalize(input, placeholders) {
    if (typeof TRANSLATIONS[input] !== 'undefined') { // to account for empty string
        input = TRANSLATIONS[input];
    }
    if (placeholders !== undefined && Object.keys(placeholders).length) {
        return input.replace(LOCALIZE_PH_REGEXP, function (_, key) { return placeholders[key] || ''; });
    }
    return input;
}
/**
 * The locale id that the application is currently using (for translations and ICU expressions).
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 */
export var DEFAULT_LOCALE_ID = 'en-US';
var LOCALE_ID = DEFAULT_LOCALE_ID;
/**
 * Sets the locale id that will be used for translations and ICU expressions.
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 *
 * @param localeId
 */
export function setLocaleId(localeId) {
    LOCALE_ID = localeId.toLowerCase().replace(/_/g, '-');
}
/**
 * Gets the locale id that will be used for translations and ICU expressions.
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 */
export function getLocaleId() {
    return LOCALE_ID;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyw4QkFBOEIsQ0FBQztBQUV0QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3hILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhHLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2xFLE9BQU8sRUFBbUIsWUFBWSxFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckwsT0FBTyxFQUFhLE1BQU0sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFpRyxNQUFNLG1CQUFtQixDQUFDO0FBSWpLLE9BQU8sRUFBQyxZ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Q0FBQztBQUUxQzs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQWEsRUFBRSxZQUFzQztJQUNsRixJQUFJLE9BQU8sWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLFdBQVcsRUFBRSxFQUFHLDhCQUE4QjtRQUMvRSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzdCO0lBQ0QsSUFBSSxZQUFZLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxFQUFFO1FBQ2xFLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxVQUFDLENBQUMsRUFBRSxHQUFHLElBQUssT0FBQSxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUF2QixDQUF1QixDQUFDLENBQUM7S0FDL0U7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLElBQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDO0FBQ3pDLElBQUksU0FBUyxHQUFHLGlCQUFpQixDQUFDO0FBRWxDOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsUUFBZ0I7SUFDMUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFdBQVc7SUFDekIsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2kxOG5fY2xvc3VyZV9tb2RlJztcblxuaW1wb3J0IHtnZXRQbHVyYWxDYXNlfSBmcm9tICcuLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge1NSQ1NFVF9BVFRSUywgVVJJX0FUVFJTLCBWQUxJRF9BVFRSUywgVkFMSURfRUxFTUVOVFMsIGdldFRlbXBsYXRlQ29udGVudH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtiaW5kLCBzZXREZWxheVByb2plY3Rpb24sIMm1ybVsb2FkfSBmcm9tICcuL2luc3RydWN0aW9ucy9hbGwnO1xuaW1wb3J0IHthdHRhY2hJMThuT3BDb2Rlc0RlYnVnfSBmcm9tICcuL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zyc7XG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDksIGFsbG9jRXhwYW5kbywgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsLCBlbGVtZW50UHJvcGVydHlJbnRlcm5hbCwgZ2V0T3JDcmVhdGVUTm9kZSwgc2V0SW5wdXRzRm9yUHJvcGVydHksIHRleHRCaW5kaW5nSW50ZXJuYWx9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0xDb250YWluZXIsIE5BVElWRX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtpc0xDb250YWluZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGVuZFByb2plY3RlZE5vZGVzLCBjcmVhdGVUZXh0Tm9kZSwgbmF0aXZlUmVtb3ZlTm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5jb25zdCBNQVJLRVIgPSBg77+9YDtcbmNvbnN0IElDVV9CTE9DS19SRUdFWFAgPSAvXlxccyoo77+9XFxkKzo/XFxkKu+/vSlcXHMqLFxccyooc2VsZWN0fHBsdXJhbClcXHMqLC87XG5jb25zdCBTVUJURU1QTEFURV9SRUdFWFAgPSAv77+9XFwvP1xcKihcXGQrOlxcZCsp77+9L2dpO1xuY29uc3QgUEhfUkVHRVhQID0gL++/vShcXC8/WyMqIV1cXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IEJJTkRJTkdfUkVHRVhQID0gL++/vShcXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IElDVV9SRUdFWFAgPSAvKHtcXHMq77+9XFxkKzo/XFxkKu+/vVxccyosXFxzKlxcU3s2fVxccyosW1xcc1xcU10qfSkvZ2k7XG5jb25zdCBlbnVtIFRhZ1R5cGUge1xuICBFTEVNRU5UID0gJyMnLFxuICBURU1QTEFURSA9ICcqJyxcbiAgUFJPSkVDVElPTiA9ICchJyxcbn1cblxuLy8gaTE4blBvc3Rwcm9jZXNzIGNvbnN0c1xuY29uc3QgUk9PVF9URU1QTEFURV9JRCA9IDA7XG5jb25zdCBQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXS87XG5jb25zdCBQUF9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXXwo77+9XFwvP1xcKlxcZCs6XFxkK++/vSkvZztcbmNvbnN0IFBQX0lDVV9WQVJTX1JFR0VYUCA9IC8oe1xccyopKFZBUl8oUExVUkFMfFNFTEVDVCkoX1xcZCspPykoXFxzKiwpL2c7XG5jb25zdCBQUF9JQ1VfUExBQ0VIT0xERVJTX1JFR0VYUCA9IC97KFtBLVowLTlfXSspfS9nO1xuY29uc3QgUFBfSUNVU19SRUdFWFAgPSAv77+9STE4Tl9FWFBfKElDVShfXFxkKyk/Ke+/vS9nO1xuY29uc3QgUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQID0gL1xcL1xcKi87XG5jb25zdCBQUF9URU1QTEFURV9JRF9SRUdFWFAgPSAvXFxkK1xcOihcXGQrKS87XG5cbi8vIFBhcnNlZCBwbGFjZWhvbGRlciBzdHJ1Y3R1cmUgdXNlZCBpbiBwb3N0cHJvY2Vzc2luZyAod2l0aGluIGBpMThuUG9zdHByb2Nlc3NgIGZ1bmN0aW9uKVxuLy8gQ29udGFpbnMgdGhlIGZvbGxvd2luZyBmaWVsZHM6IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXVxudHlwZSBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyID0gW251bWJlciwgYm9vbGVhbiwgc3RyaW5nXTtcblxuaW50ZXJmYWNlIEljdUV4cHJlc3Npb24ge1xuICB0eXBlOiBJY3VUeXBlO1xuICBtYWluQmluZGluZzogbnVtYmVyO1xuICBjYXNlczogc3RyaW5nW107XG4gIHZhbHVlczogKHN0cmluZ3xJY3VFeHByZXNzaW9uKVtdW107XG59XG5cbmludGVyZmFjZSBJY3VDYXNlIHtcbiAgLyoqXG4gICAqIE51bWJlciBvZiBzbG90cyB0byBhbGxvY2F0ZSBpbiBleHBhbmRvIGZvciB0aGlzIGNhc2UuXG4gICAqXG4gICAqIFRoaXMgaXMgdGhlIG1heCBudW1iZXIgb2YgRE9NIGVsZW1lbnRzIHdoaWNoIHdpbGwgYmUgY3JlYXRlZCBieSB0aGlzIGkxOG4gKyBJQ1UgYmxvY2tzLiBXaGVuXG4gICAqIHRoZSBET00gZWxlbWVudHMgYXJlIGJlaW5nIGNyZWF0ZWQgdGhleSBhcmUgc3RvcmVkIGluIHRoZSBFWFBBTkRPLCBzbyB0aGF0IHVwZGF0ZSBPcENvZGVzIGNhblxuICAgKiB3cml0ZSBpbnRvIHRoZW0uXG4gICAqL1xuICB2YXJzOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGFycmF5IG9mIGNoaWxkL3N1YiBJQ1VzLlxuICAgKi9cbiAgY2hpbGRJY3VzOiBudW1iZXJbXTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBidWlsZCB1cCB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVXG4gICAqL1xuICBjcmVhdGU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGRlc3Ryb3kgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVS5cbiAgICovXG4gIHJlbW92ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gdXBkYXRlIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UgYmluZGluZ3MuXG4gICAqL1xuICB1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzO1xufVxuXG4vKipcbiAqIEJyZWFrcyBwYXR0ZXJuIGludG8gc3RyaW5ncyBhbmQgdG9wIGxldmVsIHsuLi59IGJsb2Nrcy5cbiAqIENhbiBiZSB1c2VkIHRvIGJyZWFrIGEgbWVzc2FnZSBpbnRvIHRleHQgYW5kIElDVSBleHByZXNzaW9ucywgb3IgdG8gYnJlYWsgYW4gSUNVIGV4cHJlc3Npb24gaW50b1xuICoga2V5cyBhbmQgY2FzZXMuXG4gKiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiAoc3ViKVBhdHRlcm4gdG8gYmUgYnJva2VuLlxuICpcbiAqL1xuZnVuY3Rpb24gZXh0cmFjdFBhcnRzKHBhdHRlcm46IHN0cmluZyk6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdIHtcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgbGV0IHByZXZQb3MgPSAwO1xuICBjb25zdCBicmFjZVN0YWNrID0gW107XG4gIGNvbnN0IHJlc3VsdHM6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdID0gW107XG4gIGNvbnN0IGJyYWNlcyA9IC9be31dL2c7XG4gIC8vIGxhc3RJbmRleCBkb2Vzbid0IGdldCBzZXQgdG8gMCBzbyB3ZSBoYXZlIHRvLlxuICBicmFjZXMubGFzdEluZGV4ID0gMDtcblxuICBsZXQgbWF0Y2g7XG4gIHdoaWxlIChtYXRjaCA9IGJyYWNlcy5leGVjKHBhdHRlcm4pKSB7XG4gICAgY29uc3QgcG9zID0gbWF0Y2guaW5kZXg7XG4gICAgaWYgKG1hdGNoWzBdID09ICd9Jykge1xuICAgICAgYnJhY2VTdGFjay5wb3AoKTtcblxuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gRW5kIG9mIHRoZSBibG9jay5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICBpZiAoSUNVX0JMT0NLX1JFR0VYUC50ZXN0KGJsb2NrKSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChwYXJzZUlDVUJsb2NrKGJsb2NrKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKGJsb2NrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICBjb25zdCBzdWJzdHJpbmcgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zLCBwb3MpO1xuICAgICAgICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgICBicmFjZVN0YWNrLnB1c2goJ3snKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdWJzdHJpbmcgPSBwYXR0ZXJuLnN1YnN0cmluZyhwcmV2UG9zKTtcbiAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIFBhcnNlcyB0ZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gYW5kIHByb2R1Y2VzIGEgSlNPTiBvYmplY3QgZm9yIGl0LlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gVGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIHRoYXQgbmVlZHMgdG8gYmUgcGFyc2VkLlxuICpcbiAqL1xuZnVuY3Rpb24gcGFyc2VJQ1VCbG9jayhwYXR0ZXJuOiBzdHJpbmcpOiBJY3VFeHByZXNzaW9uIHtcbiAgY29uc3QgY2FzZXMgPSBbXTtcbiAgY29uc3QgdmFsdWVzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXVtdID0gW107XG4gIGxldCBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gIGxldCBtYWluQmluZGluZyA9IDA7XG4gIHBhdHRlcm4gPSBwYXR0ZXJuLnJlcGxhY2UoSUNVX0JMT0NLX1JFR0VYUCwgZnVuY3Rpb24oc3RyOiBzdHJpbmcsIGJpbmRpbmc6IHN0cmluZywgdHlwZTogc3RyaW5nKSB7XG4gICAgaWYgKHR5cGUgPT09ICdzZWxlY3QnKSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5zZWxlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgICB9XG4gICAgbWFpbkJpbmRpbmcgPSBwYXJzZUludChiaW5kaW5nLnN1YnN0cigxKSwgMTApO1xuICAgIHJldHVybiAnJztcbiAgfSk7XG5cbiAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHMocGF0dGVybikgYXMgc3RyaW5nW107XG4gIC8vIExvb2tpbmcgZm9yIChrZXkgYmxvY2spKyBzZXF1ZW5jZS4gT25lIG9mIHRoZSBrZXlzIGhhcyB0byBiZSBcIm90aGVyXCIuXG4gIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IHBhcnRzLmxlbmd0aDspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbcG9zKytdLnRyaW0oKTtcbiAgICBpZiAoaWN1VHlwZSA9PT0gSWN1VHlwZS5wbHVyYWwpIHtcbiAgICAgIC8vIEtleSBjYW4gYmUgXCI9eFwiLCB3ZSBqdXN0IHdhbnQgXCJ4XCJcbiAgICAgIGtleSA9IGtleS5yZXBsYWNlKC9cXHMqKD86PSk/KFxcdyspXFxzKi8sICckMScpO1xuICAgIH1cbiAgICBpZiAoa2V5Lmxlbmd0aCkge1xuICAgICAgY2FzZXMucHVzaChrZXkpO1xuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrcyA9IGV4dHJhY3RQYXJ0cyhwYXJ0c1twb3MrK10pIGFzIHN0cmluZ1tdO1xuICAgIGlmIChjYXNlcy5sZW5ndGggPiB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICB2YWx1ZXMucHVzaChibG9ja3MpO1xuICAgIH1cbiAgfVxuXG4gIGFzc2VydEdyZWF0ZXJUaGFuKGNhc2VzLmluZGV4T2YoJ290aGVyJyksIC0xLCAnTWlzc2luZyBrZXkgXCJvdGhlclwiIGluIElDVSBzdGF0ZW1lbnQuJyk7XG4gIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlcywgc2VlICMyMTYxNVxuICByZXR1cm4ge3R5cGU6IGljdVR5cGUsIG1haW5CaW5kaW5nOiBtYWluQmluZGluZywgY2FzZXMsIHZhbHVlc307XG59XG5cbi8qKlxuICogUmVtb3ZlcyBldmVyeXRoaW5nIGluc2lkZSB0aGUgc3ViLXRlbXBsYXRlcyBvZiBhIG1lc3NhZ2UuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgbWF0Y2g7XG4gIGxldCByZXMgPSAnJztcbiAgbGV0IGluZGV4ID0gMDtcbiAgbGV0IGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgbGV0IHRhZ01hdGNoZWQ7XG5cbiAgd2hpbGUgKChtYXRjaCA9IFNVQlRFTVBMQVRFX1JFR0VYUC5leGVjKG1lc3NhZ2UpKSAhPT0gbnVsbCkge1xuICAgIGlmICghaW5UZW1wbGF0ZSkge1xuICAgICAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyaW5nKGluZGV4LCBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICB0YWdNYXRjaGVkID0gbWF0Y2hbMV07XG4gICAgICBpblRlbXBsYXRlID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG1hdGNoWzBdID09PSBgJHtNQVJLRVJ9Lyoke3RhZ01hdGNoZWR9JHtNQVJLRVJ9YCkge1xuICAgICAgICBpbmRleCA9IG1hdGNoLmluZGV4O1xuICAgICAgICBpblRlbXBsYXRlID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBpblRlbXBsYXRlLCBmYWxzZSxcbiAgICAgICAgICBgVGFnIG1pc21hdGNoOiB1bmFibGUgdG8gZmluZCB0aGUgZW5kIG9mIHRoZSBzdWItdGVtcGxhdGUgaW4gdGhlIHRyYW5zbGF0aW9uIFwiJHttZXNzYWdlfVwiYCk7XG5cbiAgcmVzICs9IG1lc3NhZ2Uuc3Vic3RyKGluZGV4KTtcbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBhIHBhcnQgb2YgYSBtZXNzYWdlIGFuZCByZW1vdmVzIHRoZSByZXN0LlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIGV4dHJhY3RpbmcgYSBwYXJ0IG9mIHRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCBhIHRlbXBsYXRlLiBBIHRyYW5zbGF0ZWRcbiAqIG1lc3NhZ2UgY2FuIHNwYW4gbXVsdGlwbGUgdGVtcGxhdGVzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgaTE4bj5UcmFuc2xhdGUgPHNwYW4gKm5nSWY+bWU8L3NwYW4+ITwvZGl2PlxuICogYGBgXG4gKlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gY3JvcFxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggSW5kZXggb2YgdGhlIHN1Yi10ZW1wbGF0ZSB0byBleHRyYWN0LiBJZiB1bmRlZmluZWQgaXQgcmV0dXJucyB0aGVcbiAqIGV4dGVybmFsIHRlbXBsYXRlIGFuZCByZW1vdmVzIGFsbCBzdWItdGVtcGxhdGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBzdWJUZW1wbGF0ZUluZGV4ICE9PSAnbnVtYmVyJykge1xuICAgIC8vIFdlIHdhbnQgdGhlIHJvb3QgdGVtcGxhdGUgbWVzc2FnZSwgaWdub3JlIGFsbCBzdWItdGVtcGxhdGVzXG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXZSB3YW50IGEgc3BlY2lmaWMgc3ViLXRlbXBsYXRlXG4gICAgY29uc3Qgc3RhcnQgPVxuICAgICAgICBtZXNzYWdlLmluZGV4T2YoYDoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkgKyAyICsgc3ViVGVtcGxhdGVJbmRleC50b1N0cmluZygpLmxlbmd0aDtcbiAgICBjb25zdCBlbmQgPSBtZXNzYWdlLnNlYXJjaChuZXcgUmVnRXhwKGAke01BUktFUn1cXFxcL1xcXFwqXFxcXGQrOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSk7XG4gICAgcmV0dXJuIHJlbW92ZUlubmVyVGVtcGxhdGVUcmFuc2xhdGlvbihtZXNzYWdlLnN1YnN0cmluZyhzdGFydCwgZW5kKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyB0byB1cGRhdGUgdGhlIGJpbmRpbmdzIG9mIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBzdHIgVGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBiaW5kaW5ncy5cbiAqIEBwYXJhbSBkZXN0aW5hdGlvbk5vZGUgSW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIG5vZGUgd2hpY2ggd2lsbCByZWNlaXZlIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGF0dHJOYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZSwgaWYgdGhlIHN0cmluZyBiZWxvbmdzIHRvIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZUZuIFNhbml0aXphdGlvbiBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSBzdHJpbmcgYWZ0ZXIgdXBkYXRlLCBpZiBuZWNlc3NhcnkuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgc3RyOiBzdHJpbmcsIGRlc3RpbmF0aW9uTm9kZTogbnVtYmVyLCBhdHRyTmFtZT86IHN0cmluZyxcbiAgICBzYW5pdGl6ZUZuOiBTYW5pdGl6ZXJGbiB8IG51bGwgPSBudWxsKTogSTE4blVwZGF0ZU9wQ29kZXMge1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtudWxsLCBudWxsXTsgIC8vIEFsbG9jIHNwYWNlIGZvciBtYXNrIGFuZCBzaXplXG4gIGNvbnN0IHRleHRQYXJ0cyA9IHN0ci5zcGxpdChCSU5ESU5HX1JFR0VYUCk7XG4gIGxldCBtYXNrID0gMDtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IHRleHRQYXJ0cy5sZW5ndGg7IGorKykge1xuICAgIGNvbnN0IHRleHRWYWx1ZSA9IHRleHRQYXJ0c1tqXTtcblxuICAgIGlmIChqICYgMSkge1xuICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBwYXJzZUludCh0ZXh0VmFsdWUsIDEwKTtcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCgtMSAtIGJpbmRpbmdJbmRleCk7XG4gICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChiaW5kaW5nSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAodGV4dFZhbHVlICE9PSAnJykge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2godGV4dFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVPcENvZGVzLnB1c2goXG4gICAgICBkZXN0aW5hdGlvbk5vZGUgPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfFxuICAgICAgKGF0dHJOYW1lID8gSTE4blVwZGF0ZU9wQ29kZS5BdHRyIDogSTE4blVwZGF0ZU9wQ29kZS5UZXh0KSk7XG4gIGlmIChhdHRyTmFtZSkge1xuICAgIHVwZGF0ZU9wQ29kZXMucHVzaChhdHRyTmFtZSwgc2FuaXRpemVGbik7XG4gIH1cbiAgdXBkYXRlT3BDb2Rlc1swXSA9IG1hc2s7XG4gIHVwZGF0ZU9wQ29kZXNbMV0gPSB1cGRhdGVPcENvZGVzLmxlbmd0aCAtIDI7XG4gIHJldHVybiB1cGRhdGVPcENvZGVzO1xufVxuXG5mdW5jdGlvbiBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBtYXNrID0gMCk6IG51bWJlciB7XG4gIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpO1xuICBsZXQgbWF0Y2g7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICB3aGlsZSAobWF0Y2ggPSBCSU5ESU5HX1JFR0VYUC5leGVjKHZhbHVlKSkge1xuICAgICAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KHBhcnNlSW50KG1hdGNoWzFdLCAxMCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXNrID0gZ2V0QmluZGluZ01hc2sodmFsdWUgYXMgSWN1RXhwcmVzc2lvbiwgbWFzayk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXNrO1xufVxuXG5jb25zdCBpMThuSW5kZXhTdGFjazogbnVtYmVyW10gPSBbXTtcbmxldCBpMThuSW5kZXhTdGFja1BvaW50ZXIgPSAtMTtcblxuLyoqXG4gKiBDb252ZXJ0IGJpbmRpbmcgaW5kZXggdG8gbWFzayBiaXQuXG4gKlxuICogRWFjaCBpbmRleCByZXByZXNlbnRzIGEgc2luZ2xlIGJpdCBvbiB0aGUgYml0LW1hc2suIEJlY2F1c2UgYml0LW1hc2sgb25seSBoYXMgMzIgYml0cywgd2UgbWFrZVxuICogdGhlIDMybmQgYml0IHNoYXJlIGFsbCBtYXNrcyBmb3IgYWxsIGJpbmRpbmdzIGhpZ2hlciB0aGFuIDMyLiBTaW5jZSBpdCBpcyBleHRyZW1lbHkgcmFyZSB0byBoYXZlXG4gKiBtb3JlIHRoYW4gMzIgYmluZGluZ3MgdGhpcyB3aWxsIGJlIGhpdCB2ZXJ5IHJhcmVseS4gVGhlIGRvd25zaWRlIG9mIGhpdHRpbmcgdGhpcyBjb3JuZXIgY2FzZSBpc1xuICogdGhhdCB3ZSB3aWxsIGV4ZWN1dGUgYmluZGluZyBjb2RlIG1vcmUgb2Z0ZW4gdGhhbiBuZWNlc3NhcnkuIChwZW5hbHR5IG9mIHBlcmZvcm1hbmNlKVxuICovXG5mdW5jdGlvbiB0b01hc2tCaXQoYmluZGluZ0luZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gMSA8PCBNYXRoLm1pbihiaW5kaW5nSW5kZXgsIDMxKTtcbn1cblxuY29uc3QgcGFyZW50SW5kZXhTdGFjazogbnVtYmVyW10gPSBbXTtcblxuLyoqXG4gKiBNYXJrcyBhIGJsb2NrIG9mIHRleHQgYXMgdHJhbnNsYXRhYmxlLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgYGkxOG5TdGFydGAgYW5kIGBpMThuRW5kYCBtYXJrIHRoZSB0cmFuc2xhdGlvbiBibG9jayBpbiB0aGUgdGVtcGxhdGUuXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIGlzIHRoZSB2YWx1ZSB3aGljaCBpcyBsb2NhbGUgc3BlY2lmaWMuIFRoZSB0cmFuc2xhdGlvbiBzdHJpbmcgbWF5XG4gKiBjb250YWluIHBsYWNlaG9sZGVycyB3aGljaCBhc3NvY2lhdGUgaW5uZXIgZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMgd2l0aGluIHRoZSB0cmFuc2xhdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIHBsYWNlaG9sZGVycyBhcmU6XG4gKiAtIGDvv717aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpCaW5kaW5nIFBsYWNlaG9sZGVyKjogTWFya3MgYSBsb2NhdGlvbiB3aGVyZSBhbiBleHByZXNzaW9uIHdpbGwgYmVcbiAqICAgaW50ZXJwb2xhdGVkIGludG8uIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZXhwcmVzc2lvbiBiaW5kaW5nIGluZGV4LiBBbiBvcHRpb25hbFxuICogICBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSN7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8je2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqRWxlbWVudCBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGUgYmVnaW5uaW5nXG4gKiAgIGFuZCBlbmQgb2YgRE9NIGVsZW1lbnQgdGhhdCB3ZXJlIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay4gVGhlIHBsYWNlaG9sZGVyXG4gKiAgIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LiBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXRcbiAqICAgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSF7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8he2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqUHJvamVjdGlvbiBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGVcbiAqICAgYmVnaW5uaW5nIGFuZCBlbmQgb2YgPG5nLWNvbnRlbnQ+IHRoYXQgd2FzIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay5cbiAqICAgVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LlxuICogICBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSp7aW5kZXh9OntibG9ja33vv71gL2Dvv70vKntpbmRleH06e2Jsb2Nrfe+/vWA6ICpTdWItdGVtcGxhdGUgUGxhY2Vob2xkZXIqOiBTdWItdGVtcGxhdGVzIG11c3QgYmVcbiAqICAgc3BsaXQgdXAgYW5kIHRyYW5zbGF0ZWQgc2VwYXJhdGVseSBpbiBlYWNoIGFuZ3VsYXIgdGVtcGxhdGUgZnVuY3Rpb24uIFRoZSBgaW5kZXhgIHBvaW50cyB0byB0aGVcbiAqICAgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbiBpbmRleC4gQSBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggb2YgdGhlIHRyYW5zbGF0aW9uIGluIHRoZSBzdGF0aWMgYmxvY2suXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgdHJhbnNsYXRpb24gbWVzc2FnZS5cbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IE9wdGlvbmFsIHN1Yi10ZW1wbGF0ZSBpbmRleCBpbiB0aGUgYG1lc3NhZ2VgLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blN0YXJ0KGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5JbmRleFN0YWNrWysraTE4bkluZGV4U3RhY2tQb2ludGVyXSA9IGluZGV4O1xuICAvLyBXZSBuZWVkIHRvIGRlbGF5IHByb2plY3Rpb25zIHVudGlsIGBpMThuRW5kYFxuICBzZXREZWxheVByb2plY3Rpb24odHJ1ZSk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICBpMThuU3RhcnRGaXJzdFBhc3ModFZpZXcsIGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgfVxufVxuXG4vLyBDb3VudCBmb3IgdGhlIG51bWJlciBvZiB2YXJzIHRoYXQgd2lsbCBiZSBhbGxvY2F0ZWQgZm9yIGVhY2ggaTE4biBibG9jay5cbi8vIEl0IGlzIGdsb2JhbCBiZWNhdXNlIHRoaXMgaXMgdXNlZCBpbiBtdWx0aXBsZSBmdW5jdGlvbnMgdGhhdCBpbmNsdWRlIGxvb3BzIGFuZCByZWN1cnNpdmUgY2FsbHMuXG4vLyBUaGlzIGlzIHJlc2V0IHRvIDAgd2hlbiBgaTE4blN0YXJ0Rmlyc3RQYXNzYCBpcyBjYWxsZWQuXG5sZXQgaTE4blZhcnNDb3VudDogbnVtYmVyO1xuXG4vKipcbiAqIFNlZSBgaTE4blN0YXJ0YCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4blN0YXJ0Rmlyc3RQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJsdWVwcmludC5sZW5ndGggLSBIRUFERVJfT0ZGU0VUO1xuICBpMThuVmFyc0NvdW50ID0gMDtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gZ2V0SXNQYXJlbnQoKSA/IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG4gIGxldCBwYXJlbnRJbmRleCA9XG4gICAgICBwYXJlbnRUTm9kZSAmJiBwYXJlbnRUTm9kZSAhPT0gdmlld0RhdGFbVF9IT1NUXSA/IHBhcmVudFROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCA6IGluZGV4O1xuICBsZXQgcGFyZW50SW5kZXhQb2ludGVyID0gMDtcbiAgcGFyZW50SW5kZXhTdGFja1twYXJlbnRJbmRleFBvaW50ZXJdID0gcGFyZW50SW5kZXg7XG4gIGNvbnN0IGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzID0gW107XG4gIC8vIElmIHRoZSBwcmV2aW91cyBub2RlIHdhc24ndCB0aGUgZGlyZWN0IHBhcmVudCB0aGVuIHdlIGhhdmUgYSB0cmFuc2xhdGlvbiB3aXRob3V0IHRvcCBsZXZlbFxuICAvLyBlbGVtZW50IGFuZCB3ZSBuZWVkIHRvIGtlZXAgYSByZWZlcmVuY2Ugb2YgdGhlIHByZXZpb3VzIGVsZW1lbnQgaWYgdGhlcmUgaXMgb25lXG4gIGlmIChpbmRleCA+IDAgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSBwYXJlbnRUTm9kZSkge1xuICAgIC8vIENyZWF0ZSBhbiBPcENvZGUgdG8gc2VsZWN0IHRoZSBwcmV2aW91cyBUTm9kZVxuICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QpO1xuICB9XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGNvbnN0IGljdUV4cHJlc3Npb25zOiBUSWN1W10gPSBbXTtcblxuICBjb25zdCB0ZW1wbGF0ZVRyYW5zbGF0aW9uID0gZ2V0VHJhbnNsYXRpb25Gb3JUZW1wbGF0ZShtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgY29uc3QgbXNnUGFydHMgPSByZXBsYWNlTmdzcCh0ZW1wbGF0ZVRyYW5zbGF0aW9uKS5zcGxpdChQSF9SRUdFWFApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHZhbHVlID0gbXNnUGFydHNbaV07XG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzIChlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcylcbiAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgICAvLyBJdCBpcyBhIGNsb3NpbmcgdGFnXG4gICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMSkgPT09IFRhZ1R5cGUuRUxFTUVOVCkge1xuICAgICAgICAgIGNvbnN0IHBoSW5kZXggPSBwYXJzZUludCh2YWx1ZS5zdWJzdHIoMiksIDEwKTtcbiAgICAgICAgICBwYXJlbnRJbmRleCA9IHBhcmVudEluZGV4U3RhY2tbLS1wYXJlbnRJbmRleFBvaW50ZXJdO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigxKSwgMTApO1xuICAgICAgICAvLyBUaGUgdmFsdWUgcmVwcmVzZW50cyBhIHBsYWNlaG9sZGVyIHRoYXQgd2UgbW92ZSB0byB0aGUgZGVzaWduYXRlZCBpbmRleFxuICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICBwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QsXG4gICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMCkgPT09IFRhZ1R5cGUuRUxFTUVOVCkge1xuICAgICAgICAgIHBhcmVudEluZGV4U3RhY2tbKytwYXJlbnRJbmRleFBvaW50ZXJdID0gcGFyZW50SW5kZXggPSBwaEluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzICYgSUNVIGV4cHJlc3Npb25zKVxuICAgICAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHModmFsdWUpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBjb25zdCBpY3VOb2RlSW5kZXggPSBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5nRGV2TW9kZSA/IGBJQ1UgJHtpY3VOb2RlSW5kZXh9YCA6ICcnLCBpY3VOb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgY29kZXMgZm9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdUV4cHJlc3Npb24gPSBwYXJ0c1tqXSBhcyBJY3VFeHByZXNzaW9uO1xuICAgICAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uKTtcbiAgICAgICAgICBpY3VTdGFydChpY3VFeHByZXNzaW9ucywgaWN1RXhwcmVzc2lvbiwgaWN1Tm9kZUluZGV4LCBpY3VOb2RlSW5kZXgpO1xuICAgICAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgICAgICBjb25zdCB0SWN1SW5kZXggPSBpY3VFeHByZXNzaW9ucy5sZW5ndGggLSAxO1xuICAgICAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgMyBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIC0xIC0gaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyxcbiAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2gsIHRJY3VJbmRleCxcbiAgICAgICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSwgdEljdUluZGV4KTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tqXSAhPT0gJycpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gcGFydHNbal0gYXMgc3RyaW5nO1xuICAgICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB0ZXh0Lm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAvLyBDcmVhdGUgdGV4dCBub2Rlc1xuICAgICAgICAgIGNvbnN0IHRleHROb2RlSW5kZXggPSBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBiaW5kaW5nLCB0aGUgdmFsdWUgd2lsbCBiZSBzZXQgZHVyaW5nIHVwZGF0ZVxuICAgICAgICAgICAgICBoYXNCaW5kaW5nID8gJycgOiB0ZXh0LCB0ZXh0Tm9kZUluZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh0ZXh0LCB0ZXh0Tm9kZUluZGV4KSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGkxOG5WYXJzQ291bnQgPiAwKSB7XG4gICAgYWxsb2NFeHBhbmRvKHZpZXdEYXRhLCBpMThuVmFyc0NvdW50KTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXR0YWNoSTE4bk9wQ29kZXNEZWJ1ZyhcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLCB1cGRhdGVPcENvZGVzLCBpY3VFeHByZXNzaW9ucy5sZW5ndGggPyBpY3VFeHByZXNzaW9ucyA6IG51bGwsIHZpZXdEYXRhKTtcblxuICAvLyBOT1RFOiBsb2NhbCB2YXIgbmVlZGVkIHRvIHByb3Blcmx5IGFzc2VydCB0aGUgdHlwZSBvZiBgVEkxOG5gLlxuICBjb25zdCB0STE4bjogVEkxOG4gPSB7XG4gICAgdmFyczogaTE4blZhcnNDb3VudCxcbiAgICBjcmVhdGU6IGNyZWF0ZU9wQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVPcENvZGVzLFxuICAgIGljdXM6IGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCxcbiAgfTtcblxuICB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSB0STE4bjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCBwYXJlbnRUTm9kZTogVE5vZGUsIHByZXZpb3VzVE5vZGU6IFROb2RlIHwgbnVsbCwgdmlld0RhdGE6IExWaWV3KTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyTW92ZU5vZGUrKztcbiAgY29uc3QgbmV4dE5vZGUgPSB0Tm9kZS5uZXh0O1xuICBpZiAoIXByZXZpb3VzVE5vZGUpIHtcbiAgICBwcmV2aW91c1ROb2RlID0gcGFyZW50VE5vZGU7XG4gIH1cblxuICAvLyBSZS1vcmdhbml6ZSBub2RlIHRyZWUgdG8gcHV0IHRoaXMgbm9kZSBpbiB0aGUgY29ycmVjdCBwb3NpdGlvbi5cbiAgaWYgKHByZXZpb3VzVE5vZGUgPT09IHBhcmVudFROb2RlICYmIHROb2RlICE9PSBwYXJlbnRUTm9kZS5jaGlsZCkge1xuICAgIHROb2RlLm5leHQgPSBwYXJlbnRUTm9kZS5jaGlsZDtcbiAgICBwYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICB9IGVsc2UgaWYgKHByZXZpb3VzVE5vZGUgIT09IHBhcmVudFROb2RlICYmIHROb2RlICE9PSBwcmV2aW91c1ROb2RlLm5leHQpIHtcbiAgICB0Tm9kZS5uZXh0ID0gcHJldmlvdXNUTm9kZS5uZXh0O1xuICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICB9IGVsc2Uge1xuICAgIHROb2RlLm5leHQgPSBudWxsO1xuICB9XG5cbiAgaWYgKHBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtUX0hPU1RdKSB7XG4gICAgdE5vZGUucGFyZW50ID0gcGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuICB9XG5cbiAgLy8gSWYgdE5vZGUgd2FzIG1vdmVkIGFyb3VuZCwgd2UgbWlnaHQgbmVlZCB0byBmaXggYSBicm9rZW4gbGluay5cbiAgbGV0IGN1cnNvcjogVE5vZGV8bnVsbCA9IHROb2RlLm5leHQ7XG4gIHdoaWxlIChjdXJzb3IpIHtcbiAgICBpZiAoY3Vyc29yLm5leHQgPT09IHROb2RlKSB7XG4gICAgICBjdXJzb3IubmV4dCA9IG5leHROb2RlO1xuICAgIH1cbiAgICBjdXJzb3IgPSBjdXJzb3IubmV4dDtcbiAgfVxuXG4gIC8vIElmIHRoZSBwbGFjZWhvbGRlciB0byBhcHBlbmQgaXMgYSBwcm9qZWN0aW9uLCB3ZSBuZWVkIHRvIG1vdmUgdGhlIHByb2plY3RlZCBub2RlcyBpbnN0ZWFkXG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9IHROb2RlIGFzIFRQcm9qZWN0aW9uTm9kZTtcbiAgICBhcHBlbmRQcm9qZWN0ZWROb2RlcyhcbiAgICAgICAgdmlld0RhdGEsIHRQcm9qZWN0aW9uTm9kZSwgdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24sIGZpbmRDb21wb25lbnRWaWV3KHZpZXdEYXRhKSk7XG4gICAgcmV0dXJuIHROb2RlO1xuICB9XG5cbiAgYXBwZW5kQ2hpbGQoZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgdmlld0RhdGEpLCB0Tm9kZSwgdmlld0RhdGEpO1xuXG4gIGNvbnN0IHNsb3RWYWx1ZSA9IHZpZXdEYXRhW3ROb2RlLmluZGV4XTtcbiAgaWYgKHROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICAvLyBOb2RlcyB0aGF0IGluamVjdCBWaWV3Q29udGFpbmVyUmVmIGFsc28gaGF2ZSBhIGNvbW1lbnQgbm9kZSB0aGF0IHNob3VsZCBiZSBtb3ZlZFxuICAgIGFwcGVuZENoaWxkKHNsb3RWYWx1ZVtOQVRJVkVdLCB0Tm9kZSwgdmlld0RhdGEpO1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBIYW5kbGVzIG1lc3NhZ2Ugc3RyaW5nIHBvc3QtcHJvY2Vzc2luZyBmb3IgaW50ZXJuYXRpb25hbGl6YXRpb24uXG4gKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgYnkgdHJhbnNmb3JtaW5nIGl0IGZyb20gaW50ZXJtZWRpYXRlXG4gKiBmb3JtYXQgKHRoYXQgbWlnaHQgY29udGFpbiBzb21lIG1hcmtlcnMgdGhhdCB3ZSBuZWVkIHRvIHJlcGxhY2UpIHRvIHRoZSBmaW5hbFxuICogZm9ybSwgY29uc3VtYWJsZSBieSBpMThuU3RhcnQgaW5zdHJ1Y3Rpb24uIFBvc3QgcHJvY2Vzc2luZyBzdGVwcyBpbmNsdWRlOlxuICpcbiAqIDEuIFJlc29sdmUgYWxsIG11bHRpLXZhbHVlIGNhc2VzIChsaWtlIFvvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9fO+/vTXvv71dKVxuICogMi4gUmVwbGFjZSBhbGwgSUNVIHZhcnMgKGxpa2UgXCJWQVJfUExVUkFMXCIpXG4gKiAzLiBSZXBsYWNlIGFsbCBwbGFjZWhvbGRlcnMgdXNlZCBpbnNpZGUgSUNVcyBpbiBhIGZvcm0gb2Yge1BMQUNFSE9MREVSfVxuICogNC4gUmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KVxuICogICAgaW4gY2FzZSBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFJhdyB0cmFuc2xhdGlvbiBzdHJpbmcgZm9yIHBvc3QgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHJlcGxhY2VtZW50cyBTZXQgb2YgcmVwbGFjZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWRcbiAqXG4gKiBAcmV0dXJucyBUcmFuc2Zvcm1lZCBzdHJpbmcgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuUG9zdHByb2Nlc3MoXG4gICAgbWVzc2FnZTogc3RyaW5nLCByZXBsYWNlbWVudHM6IHtba2V5OiBzdHJpbmddOiAoc3RyaW5nIHwgc3RyaW5nW10pfSA9IHt9KTogc3RyaW5nIHtcbiAgLyoqXG4gICAqIFN0ZXAgMTogcmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgcGxhY2Vob2xkZXJzIGxpa2UgW++/vSM177+9fO+/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71dXG4gICAqXG4gICAqIE5vdGU6IGR1ZSB0byB0aGUgd2F5IHdlIHByb2Nlc3MgbmVzdGVkIHRlbXBsYXRlcyAoQkZTKSwgbXVsdGktdmFsdWUgcGxhY2Vob2xkZXJzIGFyZSB0eXBpY2FsbHlcbiAgICogZ3JvdXBlZCBieSB0ZW1wbGF0ZXMsIGZvciBleGFtcGxlOiBb77+9IzXvv71877+9Izbvv71877+9IzE6Me+/vXzvv70jMzoy77+9XSB3aGVyZSDvv70jNe+/vSBhbmQg77+9Izbvv70gYmVsb25nIHRvIHJvb3RcbiAgICogdGVtcGxhdGUsIO+/vSMxOjHvv70gYmVsb25nIHRvIG5lc3RlZCB0ZW1wbGF0ZSB3aXRoIGluZGV4IDEgYW5kIO+/vSMxOjLvv70gLSBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleFxuICAgKiAzLiBIb3dldmVyIGluIHJlYWwgdGVtcGxhdGVzIHRoZSBvcmRlciBtaWdodCBiZSBkaWZmZXJlbnQ6IGkuZS4g77+9IzE6Me+/vSBhbmQvb3Ig77+9IzM6Mu+/vSBtYXkgZ28gaW5cbiAgICogZnJvbnQgb2Yg77+9Izbvv70uIFRoZSBwb3N0IHByb2Nlc3Npbmcgc3RlcCByZXN0b3JlcyB0aGUgcmlnaHQgb3JkZXIgYnkga2VlcGluZyB0cmFjayBvZiB0aGVcbiAgICogdGVtcGxhdGUgaWQgc3RhY2sgYW5kIGxvb2tzIGZvciBwbGFjZWhvbGRlcnMgdGhhdCBiZWxvbmcgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgdGVtcGxhdGUuXG4gICAqL1xuICBsZXQgcmVzdWx0OiBzdHJpbmcgPSBtZXNzYWdlO1xuICBpZiAoUFBfTVVMVElfVkFMVUVfUExBQ0VIT0xERVJTX1JFR0VYUC50ZXN0KG1lc3NhZ2UpKSB7XG4gICAgY29uc3QgbWF0Y2hlczoge1trZXk6IHN0cmluZ106IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXX0gPSB7fTtcbiAgICBjb25zdCB0ZW1wbGF0ZUlkc1N0YWNrOiBudW1iZXJbXSA9IFtST09UX1RFTVBMQVRFX0lEXTtcbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9QTEFDRUhPTERFUlNfUkVHRVhQLCAobTogYW55LCBwaHM6IHN0cmluZywgdG1wbDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBwaHMgfHwgdG1wbDtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdID0gbWF0Y2hlc1tjb250ZW50XSB8fCBbXTtcbiAgICAgIGlmICghcGxhY2Vob2xkZXJzLmxlbmd0aCkge1xuICAgICAgICBjb250ZW50LnNwbGl0KCd8JykuZm9yRWFjaCgocGxhY2Vob2xkZXI6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gcGxhY2Vob2xkZXIubWF0Y2goUFBfVEVNUExBVEVfSURfUkVHRVhQKTtcbiAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUlkID0gbWF0Y2ggPyBwYXJzZUludChtYXRjaFsxXSwgMTApIDogUk9PVF9URU1QTEFURV9JRDtcbiAgICAgICAgICBjb25zdCBpc0Nsb3NlVGVtcGxhdGVUYWcgPSBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAudGVzdChwbGFjZWhvbGRlcik7XG4gICAgICAgICAgcGxhY2Vob2xkZXJzLnB1c2goW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZXNbY29udGVudF0gPSBwbGFjZWhvbGRlcnM7XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxhY2Vob2xkZXJzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBwbGFjZWhvbGRlciAtICR7Y29udGVudH1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVudFRlbXBsYXRlSWQgPSB0ZW1wbGF0ZUlkc1N0YWNrW3RlbXBsYXRlSWRzU3RhY2subGVuZ3RoIC0gMV07XG4gICAgICBsZXQgaWR4ID0gMDtcbiAgICAgIC8vIGZpbmQgcGxhY2Vob2xkZXIgaW5kZXggdGhhdCBtYXRjaGVzIGN1cnJlbnQgdGVtcGxhdGUgaWRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhY2Vob2xkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwbGFjZWhvbGRlcnNbaV1bMF0gPT09IGN1cnJlbnRUZW1wbGF0ZUlkKSB7XG4gICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIHRlbXBsYXRlIGlkIHN0YWNrIGJhc2VkIG9uIHRoZSBjdXJyZW50IHRhZyBleHRyYWN0ZWRcbiAgICAgIGNvbnN0IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSA9IHBsYWNlaG9sZGVyc1tpZHhdO1xuICAgICAgaWYgKGlzQ2xvc2VUZW1wbGF0ZVRhZykge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGVtcGxhdGVJZCAhPT0gdGVtcGxhdGVJZCkge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnB1c2godGVtcGxhdGVJZCk7XG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgcHJvY2Vzc2VkIHRhZyBmcm9tIHRoZSBsaXN0XG4gICAgICBwbGFjZWhvbGRlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfSk7XG4gIH1cblxuICAvLyByZXR1cm4gY3VycmVudCByZXN1bHQgaWYgbm8gcmVwbGFjZW1lbnRzIHNwZWNpZmllZFxuICBpZiAoIU9iamVjdC5rZXlzKHJlcGxhY2VtZW50cykubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGVwIDI6IHJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVX1ZBUlNfUkVHRVhQLCAobWF0Y2gsIHN0YXJ0LCBrZXksIF90eXBlLCBfaWR4LCBlbmQpOiBzdHJpbmcgPT4ge1xuICAgIHJldHVybiByZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSA/IGAke3N0YXJ0fSR7cmVwbGFjZW1lbnRzW2tleV19JHtlbmR9YCA6IG1hdGNoO1xuICB9KTtcblxuICAvKipcbiAgICogU3RlcCAzOiByZXBsYWNlIGFsbCBwbGFjZWhvbGRlcnMgdXNlZCBpbnNpZGUgSUNVcyBpbiBhIGZvcm0gb2Yge1BMQUNFSE9MREVSfVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVX1BMQUNFSE9MREVSU19SRUdFWFAsIChtYXRjaCwga2V5KTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyByZXBsYWNlbWVudHNba2V5XSBhcyBzdHJpbmcgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgNDogcmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KSBpbiBjYXNlXG4gICAqIG11bHRpcGxlIElDVXMgaGF2ZSB0aGUgc2FtZSBwbGFjZWhvbGRlciBuYW1lXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VTX1JFR0VYUCwgKG1hdGNoLCBrZXkpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChyZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgbGlzdCA9IHJlcGxhY2VtZW50c1trZXldIGFzIHN0cmluZ1tdO1xuICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBJQ1UgLSAke21hdGNofSB3aXRoIGtleTogJHtrZXl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGlzdC5zaGlmdCgpICE7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgbWFya2VkIGJ5IGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAuIEl0IGluc2VydHMgdGhlIHRleHQvSUNVIG5vZGVzXG4gKiBpbnRvIHRoZSByZW5kZXIgdHJlZSwgbW92ZXMgdGhlIHBsYWNlaG9sZGVyIG5vZGVzIGFuZCByZW1vdmVzIHRoZSBkZWxldGVkIG5vZGVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkVuZCgpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuRW5kRmlyc3RQYXNzKHRWaWV3KTtcbiAgLy8gU3RvcCBkZWxheWluZyBwcm9qZWN0aW9uc1xuICBzZXREZWxheVByb2plY3Rpb24oZmFsc2UpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkVuZGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5FbmRGaXJzdFBhc3ModFZpZXc6IFRWaWV3KSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2aWV3RGF0YVtUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2kxOG5FbmQgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcblxuICBjb25zdCByb290SW5kZXggPSBpMThuSW5kZXhTdGFja1tpMThuSW5kZXhTdGFja1BvaW50ZXItLV07XG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtyb290SW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUSTE4bjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEkxOG4sIGBZb3Ugc2hvdWxkIGNhbGwgaTE4blN0YXJ0IGJlZm9yZSBpMThuRW5kYCk7XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBub2RlIHRoYXQgd2FzIGFkZGVkIGJlZm9yZSBgaTE4bkVuZGBcbiAgbGV0IGxhc3RDcmVhdGVkTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuXG4gIC8vIFJlYWQgdGhlIGluc3RydWN0aW9ucyB0byBpbnNlcnQvbW92ZS9yZW1vdmUgRE9NIGVsZW1lbnRzXG4gIGNvbnN0IHZpc2l0ZWROb2RlcyA9IHJlYWRDcmVhdGVPcENvZGVzKHJvb3RJbmRleCwgdEkxOG4uY3JlYXRlLCB0STE4bi5pY3VzLCB2aWV3RGF0YSk7XG5cbiAgLy8gUmVtb3ZlIGRlbGV0ZWQgbm9kZXNcbiAgZm9yIChsZXQgaSA9IHJvb3RJbmRleCArIDE7IGkgPD0gbGFzdENyZWF0ZWROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDsgaSsrKSB7XG4gICAgaWYgKHZpc2l0ZWROb2Rlcy5pbmRleE9mKGkpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZShpLCB2aWV3RGF0YSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgc3RvcmVzIHRoZSBkeW5hbWljIFROb2RlLCBhbmQgdW5ob29rcyBpdCBmcm9tIHRoZSB0cmVlIGZvciBub3cuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsKTogVEVsZW1lbnROb2RlfFRJY3VDb250YWluZXJOb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IG5hdGl2ZTtcbiAgY29uc3QgdE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIHR5cGUgYXMgYW55LCBuYW1lLCBudWxsKTtcblxuICAvLyBXZSBhcmUgY3JlYXRpbmcgYSBkeW5hbWljIG5vZGUsIHRoZSBwcmV2aW91cyB0Tm9kZSBtaWdodCBub3QgYmUgcG9pbnRpbmcgYXQgdGhpcyBub2RlLlxuICAvLyBXZSB3aWxsIGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUgbGF0ZXIgd2l0aCBgYXBwZW5kSTE4bk5vZGVgLlxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPT09IHROb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5mdW5jdGlvbiByZWFkQ3JlYXRlT3BDb2RlcyhcbiAgICBpbmRleDogbnVtYmVyLCBjcmVhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICB2aWV3RGF0YTogTFZpZXcpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGxldCBjdXJyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHZpc2l0ZWROb2RlczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUob3BDb2RlLCByZW5kZXJlcik7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIGN1cnJlbnRUTm9kZSA9XG4gICAgICAgICAgY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KHZpZXdEYXRhLCB0ZXh0Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dFJOb2RlLCBudWxsKTtcbiAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKHRleHROb2RlSW5kZXgpO1xuICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvblROb2RlOiBUTm9kZTtcbiAgICAgICAgICBpZiAoZGVzdGluYXRpb25Ob2RlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGVzdGluYXRpb24gbm9kZSBpcyBgaTE4blN0YXJ0YCwgd2UgZG9uJ3QgaGF2ZSBhXG4gICAgICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZSBhbmQgd2Ugc2hvdWxkIHVzZSB0aGUgaG9zdCBub2RlIGluc3RlYWRcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSB2aWV3RGF0YVtUX0hPU1RdICE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBnZXRUTm9kZShkZXN0aW5hdGlvbk5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRUTm9kZSAhLFxuICAgICAgICAgICAgICAgICAgYFlvdSBuZWVkIHRvIGNyZWF0ZSBvciBzZWxlY3QgYSBub2RlIGJlZm9yZSB5b3UgY2FuIGluc2VydCBpdCBpbnRvIHRoZSBET01gKTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gYXBwZW5kSTE4bk5vZGUoY3VycmVudFROb2RlICEsIGRlc3RpbmF0aW9uVE5vZGUsIHByZXZpb3VzVE5vZGUsIHZpZXdEYXRhKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKG5vZGVJbmRleCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICBpZiAoY3VycmVudFROb2RlKSB7XG4gICAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlLCBjdXJyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgY29uc3QgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBUaGlzIGNvZGUgaXMgdXNlZCBmb3IgSUNVIGV4cHJlc3Npb25zIG9ubHksIHNpbmNlIHdlIGRvbid0IHN1cHBvcnRcbiAgICAgICAgICAvLyBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaW4gSUNVcywgd2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpbnB1dHMgaGVyZVxuICAgICAgICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChlbGVtZW50Tm9kZUluZGV4LCBhdHRyTmFtZSwgYXR0clZhbHVlLCB2aWV3RGF0YSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb21tZW50VmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHtjb21tZW50VmFsdWV9XCIgdG8gYmUgYSBjb21tZW50IG5vZGUgdmFsdWVgKTtcbiAgICAgICAgICBjb25zdCBjb21tZW50Uk5vZGUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KGNvbW1lbnRWYWx1ZSk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgdmlld0RhdGEsIGNvbW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5JY3VDb250YWluZXIsIGNvbW1lbnRSTm9kZSwgbnVsbCk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goY29tbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbW1lbnRSTm9kZSwgdmlld0RhdGEpO1xuICAgICAgICAgIChjdXJyZW50VE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUpLmFjdGl2ZUNhc2VJbmRleCA9IG51bGw7XG4gICAgICAgICAgLy8gV2Ugd2lsbCBhZGQgdGhlIGNhc2Ugbm9kZXMgbGF0ZXIsIGR1cmluZyB0aGUgdXBkYXRlIHBoYXNlXG4gICAgICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIHZpZXdEYXRhLCBlbGVtZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgZWxlbWVudFJOb2RlLCB0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGVsZW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0SXNOb3RQYXJlbnQoKTtcblxuICByZXR1cm4gdmlzaXRlZE5vZGVzO1xufVxuXG5mdW5jdGlvbiByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCwgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsXG4gICAgY2hhbmdlTWFzazogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcsIGJ5cGFzc0NoZWNrQml0ID0gZmFsc2UpIHtcbiAgbGV0IGNhc2VDcmVhdGVkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdXBkYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICBjb25zdCBjaGVja0JpdCA9IHVwZGF0ZU9wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgY29uc3Qgc2tpcENvZGVzID0gdXBkYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICBpZiAoYnlwYXNzQ2hlY2tCaXQgfHwgKGNoZWNrQml0ICYgY2hhbmdlTWFzaykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2hlY2tlZFxuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgYmluZGluZyBpbmRleCB3aG9zZSB2YWx1ZSBpcyBuZWdhdGl2ZVxuICAgICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KHZpZXdEYXRhW2JpbmRpbmdzU3RhcnRJbmRleCAtIG9wQ29kZV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBsZXQgaWN1VE5vZGU6IFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIFNhbml0aXplckZuIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChub2RlSW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVGbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHRleHRCaW5kaW5nSW50ZXJuYWwodmlld0RhdGEsIG5vZGVJbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGljdVROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gYWN0aXZlIGNhc2UsIGRlbGV0ZSB0aGUgb2xkIG5vZGVzXG4gICAgICAgICAgICAgICAgaWYgKGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlQ29kZXMgPSB0SWN1LnJlbW92ZVtpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmVDb2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVPcENvZGUgPSByZW1vdmVDb2Rlc1trXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVtb3ZlT3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmU6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3U6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUNvZGVzW2sgKyAxXSBhcyBudW1iZXIgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VE5vZGUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5lc3RlZEljdU5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSBuZXN0ZWRJY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VEluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkVEljdSA9IGljdXMgIVtuZXN0ZWRJY3VUSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KG5lc3RlZFRJY3UucmVtb3ZlW2FjdGl2ZUluZGV4XSwgcmVtb3ZlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGFjdGl2ZSBjYXNlSW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICAgICAgICAgICAgcmVhZENyZWF0ZU9wQ29kZXMoLTEsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIGljdXMsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgdEljdS51cGRhdGVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICFdLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssXG4gICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhLCBjYXNlQ3JlYXRlZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KSB7XG4gIGNvbnN0IHJlbW92ZWRQaFROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIHZpZXdEYXRhKTtcbiAgY29uc3QgcmVtb3ZlZFBoUk5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSk7XG4gIGlmIChyZW1vdmVkUGhSTm9kZSkge1xuICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCByZW1vdmVkUGhSTm9kZSk7XG4gIH1cblxuICBjb25zdCBzbG90VmFsdWUgPSDJtcm1bG9hZChpbmRleCkgYXMgUkVsZW1lbnQgfCBSQ29tbWVudCB8IExDb250YWluZXI7XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBzbG90VmFsdWUgYXMgTENvbnRhaW5lcjtcbiAgICBpZiAocmVtb3ZlZFBoVE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgbmF0aXZlUmVtb3ZlTm9kZSh2aWV3RGF0YVtSRU5ERVJFUl0sIGxDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGVmaW5lIHRoaXMgbm9kZSBhcyBkZXRhY2hlZCBzbyB0aGF0IHdlIGRvbid0IHJpc2sgcHJvamVjdGluZyBpdFxuICByZW1vdmVkUGhUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGV0YWNoZWQ7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG59XG5cbi8qKlxuICpcbiAqIFVzZSB0aGlzIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRyYW5zbGF0aW9uIGJsb2NrIHRoYXQgZG9lc24ndCBjb250YWluIGFueSBwbGFjZWhvbGRlci5cbiAqIEl0IGNhbGxzIGJvdGgge0BsaW5rIGkxOG5TdGFydH0gYW5kIHtAbGluayBpMThuRW5kfSBpbiBvbmUgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG4oaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIMm1ybVpMThuU3RhcnQoaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICDJtcm1aTE4bkVuZCgpO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgbGlzdCBvZiBhdHRyaWJ1dGVzIGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggaW4gdGhlIHN0YXRpYyBibG9ja1xuICogQHBhcmFtIHZhbHVlc1xuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkF0dHJpYnV0ZXMoaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKHRWaWV3LCBpbmRleCwgdmFsdWVzKTtcbn1cblxuLyoqXG4gKiBTZWUgYGkxOG5BdHRyaWJ1dGVzYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnRJbmRleCA9IHByZXZpb3VzRWxlbWVudC5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG4gICAgY29uc3QgcGFydHMgPSBtZXNzYWdlLnNwbGl0KElDVV9SRUdFWFApO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFydHNbal07XG5cbiAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lDVSBleHByZXNzaW9ucyBhcmUgbm90IHlldCBzdXBwb3J0ZWQgaW4gYXR0cmlidXRlcycpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIXZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModmFsdWUsIHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSksIHVwZGF0ZU9wQ29kZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSwgdmFsdWUsIGxWaWV3KTtcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGF0IGF0dHJpYnV0ZSBpcyBhIGRpcmVjdGl2ZSBpbnB1dFxuICAgICAgICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUocHJldmlvdXNFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICBjb25zdCBkYXRhVmFsdWUgPSB0Tm9kZS5pbnB1dHMgJiYgdE5vZGUuaW5wdXRzW2F0dHJOYW1lXTtcbiAgICAgICAgICBpZiAoZGF0YVZhbHVlKSB7XG4gICAgICAgICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHVwZGF0ZU9wQ29kZXM7XG4gIH1cbn1cblxubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5sZXQgc2hpZnRzQ291bnRlciA9IDA7XG5cbi8qKlxuICogU3RvcmVzIHRoZSB2YWx1ZXMgb2YgdGhlIGJpbmRpbmdzIGR1cmluZyBlYWNoIHVwZGF0ZSBjeWNsZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0b1xuICogdXBkYXRlIHRoZSB0cmFuc2xhdGVkIG5vZGVzLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgYmluZGluZydzIHZhbHVlXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBpMThuRXhwKGN0eC5uYW1lKShjdHgudGl0bGUpYClcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FeHA8VD4odmFsdWU6IFQpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBleHByZXNzaW9uID0gYmluZChsVmlldywgdmFsdWUpO1xuICBpZiAoZXhwcmVzc2lvbiAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG4gIHJldHVybiDJtcm1aTE4bkV4cDtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgb3IgYW4gaTE4biBhdHRyaWJ1dGUgd2hlbiB0aGUgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiBlaXRoZXIge0BsaW5rIGkxOG5TdGFydH0gKHRyYW5zbGF0aW9uIGJsb2NrKSBvciB7QGxpbmsgaTE4bkF0dHJpYnV0ZXN9XG4gKiAoaTE4biBhdHRyaWJ1dGUpIG9uIHdoaWNoIGl0IHNob3VsZCB1cGRhdGUgdGhlIGNvbnRlbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuQXBwbHkoaW5kZXg6IG51bWJlcikge1xuICBpZiAoc2hpZnRzQ291bnRlcikge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gICAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG4gICAgbGV0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIGxldCBpY3VzOiBUSWN1W118bnVsbCA9IG51bGw7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodEkxOG4pKSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gdEkxOG4gYXMgSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZU9wQ29kZXMgPSAodEkxOG4gYXMgVEkxOG4pLnVwZGF0ZTtcbiAgICAgIGljdXMgPSAodEkxOG4gYXMgVEkxOG4pLmljdXM7XG4gICAgfVxuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gc2hpZnRzQ291bnRlciAtIDE7XG4gICAgcmVhZFVwZGF0ZU9wQ29kZXModXBkYXRlT3BDb2RlcywgaWN1cywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrLCBsVmlldyk7XG5cbiAgICAvLyBSZXNldCBjaGFuZ2VNYXNrICYgbWFza0JpdCB0byBkZWZhdWx0IGZvciB0aGUgbmV4dCB1cGRhdGUgY3ljbGVcbiAgICBjaGFuZ2VNYXNrID0gMGIwO1xuICAgIHNoaWZ0c0NvdW50ZXIgPSAwO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2FzZSBvZiBhbiBJQ1UgZXhwcmVzc2lvbiBkZXBlbmRpbmcgb24gdGhlIG1haW4gYmluZGluZyB2YWx1ZVxuICpcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gYmluZGluZ1ZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgbWFpbiBiaW5kaW5nIHVzZWQgYnkgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBnZXRDYXNlSW5kZXgoaWN1RXhwcmVzc2lvbjogVEljdSwgYmluZGluZ1ZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoYmluZGluZ1ZhbHVlKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHN3aXRjaCAoaWN1RXhwcmVzc2lvbi50eXBlKSB7XG4gICAgICBjYXNlIEljdVR5cGUucGx1cmFsOiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQ2FzZSA9IGdldFBsdXJhbENhc2UoYmluZGluZ1ZhbHVlLCBnZXRMb2NhbGVJZCgpKTtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YocmVzb2x2ZWRDYXNlKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiByZXNvbHZlZENhc2UgIT09ICdvdGhlcicpIHtcbiAgICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgSWN1VHlwZS5zZWxlY3Q6IHtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgZm9yIElDVSBleHByZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gc3RhcnRJbmRleFxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIGljdVN0YXJ0KFxuICAgIHRJY3VzOiBUSWN1W10sIGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIHN0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNyZWF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHJlbW92ZUNvZGVzID0gW107XG4gIGNvbnN0IHVwZGF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHZhcnMgPSBbXTtcbiAgY29uc3QgY2hpbGRJY3VzOiBudW1iZXJbXVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBFYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MgJiBvdGhlciBJQ1UgZXhwcmVzc2lvbnNcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGNvbnN0IG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBJdCBpcyBhbiBuZXN0ZWQgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgY29uc3QgaWN1SW5kZXggPSBuZXN0ZWRJY3VzLnB1c2godmFsdWUgYXMgSWN1RXhwcmVzc2lvbikgLSAxO1xuICAgICAgICAvLyBSZXBsYWNlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbiBieSBhIGNvbW1lbnQgbm9kZVxuICAgICAgICB2YWx1ZUFycltqXSA9IGA8IS0t77+9JHtpY3VJbmRleH3vv70tLT5gO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBpY3VDYXNlOiBJY3VDYXNlID1cbiAgICAgICAgcGFyc2VJY3VDYXNlKHZhbHVlQXJyLmpvaW4oJycpLCBzdGFydEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgIGNyZWF0ZUNvZGVzLnB1c2goaWN1Q2FzZS5jcmVhdGUpO1xuICAgIHJlbW92ZUNvZGVzLnB1c2goaWN1Q2FzZS5yZW1vdmUpO1xuICAgIHVwZGF0ZUNvZGVzLnB1c2goaWN1Q2FzZS51cGRhdGUpO1xuICAgIHZhcnMucHVzaChpY3VDYXNlLnZhcnMpO1xuICAgIGNoaWxkSWN1cy5wdXNoKGljdUNhc2UuY2hpbGRJY3VzKTtcbiAgfVxuICBjb25zdCB0SWN1OiBUSWN1ID0ge1xuICAgIHR5cGU6IGljdUV4cHJlc3Npb24udHlwZSxcbiAgICB2YXJzLFxuICAgIGNoaWxkSWN1cyxcbiAgICBjYXNlczogaWN1RXhwcmVzc2lvbi5jYXNlcyxcbiAgICBjcmVhdGU6IGNyZWF0ZUNvZGVzLFxuICAgIHJlbW92ZTogcmVtb3ZlQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVDb2Rlc1xuICB9O1xuICB0SWN1cy5wdXNoKHRJY3UpO1xuICAvLyBBZGRpbmcgdGhlIG1heGltdW0gcG9zc2libGUgb2YgdmFycyBuZWVkZWQgKGJhc2VkIG9uIHRoZSBjYXNlcyB3aXRoIHRoZSBtb3N0IHZhcnMpXG4gIGkxOG5WYXJzQ291bnQgKz0gTWF0aC5tYXgoLi4udmFycyk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIHN0cmluZyB0ZW1wbGF0ZSBpbnRvIGFuIEhUTUwgdGVtcGxhdGUgYW5kIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB1cGRhdGVcbiAqIGF0dHJpYnV0ZXMgb3Igbm9kZXMgdGhhdCBjb250YWluIGJpbmRpbmdzLlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIFRoZSBzdHJpbmcgdG8gcGFyc2VcbiAqIEBwYXJhbSBwYXJlbnRJbmRleFxuICogQHBhcmFtIG5lc3RlZEljdXNcbiAqIEBwYXJhbSB0SWN1c1xuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIHBhcnNlSWN1Q2FzZShcbiAgICB1bnNhZmVIdG1sOiBzdHJpbmcsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSwgdEljdXM6IFRJY3VbXSxcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogSWN1Q2FzZSB7XG4gIGNvbnN0IGluZXJ0Qm9keUhlbHBlciA9IG5ldyBJbmVydEJvZHlIZWxwZXIoZG9jdW1lbnQpO1xuICBjb25zdCBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gIGlmICghaW5lcnRCb2R5RWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGdlbmVyYXRlIGluZXJ0IGJvZHkgZWxlbWVudCcpO1xuICB9XG4gIGNvbnN0IHdyYXBwZXIgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCAhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gIGNvbnN0IG9wQ29kZXM6IEljdUNhc2UgPSB7dmFyczogMCwgY2hpbGRJY3VzOiBbXSwgY3JlYXRlOiBbXSwgcmVtb3ZlOiBbXSwgdXBkYXRlOiBbXX07XG4gIHBhcnNlTm9kZXMod3JhcHBlci5maXJzdENoaWxkLCBvcENvZGVzLCBwYXJlbnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgcmV0dXJuIG9wQ29kZXM7XG59XG5cbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICogQHBhcmFtIGN1cnJlbnROb2RlIFRoZSBmaXJzdCBub2RlIHRvIHBhcnNlXG4gKiBAcGFyYW0gaWN1Q2FzZSBUaGUgZGF0YSBmb3IgdGhlIElDVSBleHByZXNzaW9uIGNhc2UgdGhhdCBjb250YWlucyB0aG9zZSBub2Rlc1xuICogQHBhcmFtIHBhcmVudEluZGV4IEluZGV4IG9mIHRoZSBjdXJyZW50IG5vZGUncyBwYXJlbnRcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzIERhdGEgZm9yIHRoZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb25zIHRoYXQgdGhpcyBjYXNlIGNvbnRhaW5zXG4gKiBAcGFyYW0gdEljdXMgRGF0YSBmb3IgYWxsIElDVSBleHByZXNzaW9ucyBvZiB0aGUgY3VycmVudCBtZXNzYWdlXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXggRXhwYW5kbyBzdGFydCBpbmRleCBmb3IgdGhlIGN1cnJlbnQgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gcGFyc2VOb2RlcyhcbiAgICBjdXJyZW50Tm9kZTogTm9kZSB8IG51bGwsIGljdUNhc2U6IEljdUNhc2UsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSxcbiAgICB0SWN1czogVEljdVtdLCBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5lc3RlZEljdXNUb0NyZWF0ZTogW0ljdUV4cHJlc3Npb24sIG51bWJlcl1bXSA9IFtdO1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgICAgY29uc3QgbmV4dE5vZGU6IE5vZGV8bnVsbCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBleHBhbmRvU3RhcnRJbmRleCArICsraWN1Q2FzZS52YXJzO1xuICAgICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGEgdmFsaWQgZWxlbWVudCwgd2Ugd29uJ3QgY3JlYXRlIGFuIGVsZW1lbnQgZm9yIGl0XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSAhO1xuICAgICAgICAgICAgICBjb25zdCBsb3dlckF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIWF0dHIudmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIGlucHV0IHN0cmluZyBpcyBzYWZlLCB1bmxlc3MgaXQncyB1c2luZyBhIGJpbmRpbmdcbiAgICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXJBdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgX3Nhbml0aXplVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIHNhbml0aXplU3Jjc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGBXQVJOSU5HOiBpZ25vcmluZyB1bnNhZmUgYXR0cmlidXRlIHZhbHVlICR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAke3RhZ05hbWV9IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuQXR0ciwgYXR0ci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGNoaWxkcmVuIG9mIHRoaXMgbm9kZSAoaWYgYW55KVxuICAgICAgICAgICAgcGFyc2VOb2RlcyhcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5maXJzdENoaWxkLCBpY3VDYXNlLCBuZXdJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcGFyZW50IG5vZGUgYWZ0ZXIgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdmFsdWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgbmV3SW5kZXgpLCBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21tZW50IG5vZGUgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBuZXN0ZWQgSUNVXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBORVNURURfSUNVLmV4ZWMoY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJycpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1SW5kZXggPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgY29uc3QgbmV3TG9jYWwgPSBuZ0Rldk1vZGUgPyBgbmVzdGVkIElDVSAke25lc3RlZEljdUluZGV4fWAgOiAnJztcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZXdMb2NhbCwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNbbmVzdGVkSWN1SW5kZXhdO1xuICAgICAgICAgICAgbmVzdGVkSWN1c1RvQ3JlYXRlLnB1c2goW25lc3RlZEljdSwgbmV3SW5kZXhdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBjb21tZW50XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBlbGVtZW50XG4gICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IG5leHROb2RlICE7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWRJY3VzVG9DcmVhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVswXTtcbiAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVsxXTtcbiAgICAgIGljdVN0YXJ0KHRJY3VzLCBuZXN0ZWRJY3UsIG5lc3RlZEljdU5vZGVJbmRleCwgZXhwYW5kb1N0YXJ0SW5kZXggKyBpY3VDYXNlLnZhcnMpO1xuICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgY29uc3QgbmVzdFRJY3VJbmRleCA9IHRJY3VzLmxlbmd0aCAtIDE7XG4gICAgICBpY3VDYXNlLnZhcnMgKz0gTWF0aC5tYXgoLi4udEljdXNbbmVzdFRJY3VJbmRleF0udmFycyk7XG4gICAgICBpY3VDYXNlLmNoaWxkSWN1cy5wdXNoKG5lc3RUSWN1SW5kZXgpO1xuICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKG5lc3RlZEljdSk7XG4gICAgICBpY3VDYXNlLnVwZGF0ZS5wdXNoKFxuICAgICAgICAgIHRvTWFza0JpdChuZXN0ZWRJY3UubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIC0xIC0gbmVzdGVkSWN1Lm1haW5CaW5kaW5nLFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgsXG4gICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCk7XG4gICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdSxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQW5ndWxhciBEYXJ0IGludHJvZHVjZWQgJm5nc3A7IGFzIGEgcGxhY2Vob2xkZXIgZm9yIG5vbi1yZW1vdmFibGUgc3BhY2UsIHNlZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJ0LWxhbmcvYW5ndWxhci9ibG9iLzBiYjYxMTM4N2QyOWQ2NWI1YWY3ZjlkMjUxNWFiNTcxZmQzZmJlZTQvX3Rlc3RzL3Rlc3QvY29tcGlsZXIvcHJlc2VydmVfd2hpdGVzcGFjZV90ZXN0LmRhcnQjTDI1LUwzMlxuICogSW4gQW5ndWxhciBEYXJ0ICZuZ3NwOyBpcyBjb252ZXJ0ZWQgdG8gdGhlIDB4RTUwMCBQVUEgKFByaXZhdGUgVXNlIEFyZWFzKSB1bmljb2RlIGNoYXJhY3RlclxuICogYW5kIGxhdGVyIG9uIHJlcGxhY2VkIGJ5IGEgc3BhY2UuIFdlIGFyZSByZS1pbXBsZW1lbnRpbmcgdGhlIHNhbWUgaWRlYSBoZXJlLCBzaW5jZSB0cmFuc2xhdGlvbnNcbiAqIG1pZ2h0IGNvbnRhaW4gdGhpcyBzcGVjaWFsIGNoYXJhY3Rlci5cbiAqL1xuY29uc3QgTkdTUF9VTklDT0RFX1JFR0VYUCA9IC9cXHVFNTAwL2c7XG5mdW5jdGlvbiByZXBsYWNlTmdzcCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoTkdTUF9VTklDT0RFX1JFR0VYUCwgJyAnKTtcbn1cblxubGV0IFRSQU5TTEFUSU9OUzoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbmV4cG9ydCBpbnRlcmZhY2UgSTE4bkxvY2FsaXplT3B0aW9ucyB7IHRyYW5zbGF0aW9uczoge1trZXk6IHN0cmluZ106IHN0cmluZ307IH1cblxuLyoqXG4gKiBTZXQgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIGBpMThuTG9jYWxpemVgLlxuICpcbiAqIEBkZXByZWNhdGVkIHRoaXMgbWV0aG9kIGlzIHRlbXBvcmFyeSAmIHNob3VsZCBub3QgYmUgdXNlZCBhcyBpdCB3aWxsIGJlIHJlbW92ZWQgc29vblxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkNvbmZpZ3VyZUxvY2FsaXplKG9wdGlvbnM6IEkxOG5Mb2NhbGl6ZU9wdGlvbnMgPSB7XG4gIHRyYW5zbGF0aW9uczoge31cbn0pIHtcbiAgVFJBTlNMQVRJT05TID0gb3B0aW9ucy50cmFuc2xhdGlvbnM7XG59XG5cbmNvbnN0IExPQ0FMSVpFX1BIX1JFR0VYUCA9IC9cXHtcXCQoLio/KVxcfS9nO1xuXG4vKipcbiAqIEEgZ29vZy5nZXRNc2ctbGlrZSBmdW5jdGlvbiBmb3IgdXNlcnMgdGhhdCBkbyBub3QgdXNlIENsb3N1cmUuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgcmVxdWlyZWQgYXMgYSAqdGVtcG9yYXJ5KiBtZWFzdXJlIHRvIHByZXZlbnQgaTE4biB0ZXN0cyBmcm9tIGJlaW5nIGJsb2NrZWQgd2hpbGVcbiAqIHJ1bm5pbmcgb3V0c2lkZSBvZiBDbG9zdXJlIENvbXBpbGVyLiBUaGlzIG1ldGhvZCB3aWxsIG5vdCBiZSBuZWVkZWQgb25jZSBydW50aW1lIHRyYW5zbGF0aW9uXG4gKiBzZXJ2aWNlIHN1cHBvcnQgaXMgaW50cm9kdWNlZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICogQGRlcHJlY2F0ZWQgdGhpcyBtZXRob2QgaXMgdGVtcG9yYXJ5ICYgc2hvdWxkIG5vdCBiZSB1c2VkIGFzIGl0IHdpbGwgYmUgcmVtb3ZlZCBzb29uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkxvY2FsaXplKGlucHV0OiBzdHJpbmcsIHBsYWNlaG9sZGVycz86IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KSB7XG4gIGlmICh0eXBlb2YgVFJBTlNMQVRJT05TW2lucHV0XSAhPT0gJ3VuZGVmaW5lZCcpIHsgIC8vIHRvIGFjY291bnQgZm9yIGVtcHR5IHN0cmluZ1xuICAgIGlucHV0ID0gVFJBTlNMQVRJT05TW2lucHV0XTtcbiAgfVxuICBpZiAocGxhY2Vob2xkZXJzICE9PSB1bmRlZmluZWQgJiYgT2JqZWN0LmtleXMocGxhY2Vob2xkZXJzKS5sZW5ndGgpIHtcbiAgICByZXR1cm4gaW5wdXQucmVwbGFjZShMT0NBTElaRV9QSF9SRUdFWFAsIChfLCBrZXkpID0+IHBsYWNlaG9sZGVyc1trZXldIHx8ICcnKTtcbiAgfVxuICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogVGhlIGxvY2FsZSBpZCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBpcyBjdXJyZW50bHkgdXNpbmcgKGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucykuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0xPQ0FMRV9JRCA9ICdlbi1VUyc7XG5sZXQgTE9DQUxFX0lEID0gREVGQVVMVF9MT0NBTEVfSUQ7XG5cbi8qKlxuICogU2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbG9jYWxlSWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldExvY2FsZUlkKGxvY2FsZUlkOiBzdHJpbmcpIHtcbiAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUlkKCk6IHN0cmluZyB7XG4gIHJldHVybiBMT0NBTEVfSUQ7XG59XG4iXX0=