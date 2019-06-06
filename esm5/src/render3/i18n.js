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
import { elementAttributeInternal, setDelayProjection, ɵɵload, ɵɵtextBinding } from './instructions/all';
import { attachI18nOpCodesDebug } from './instructions/lview_debug';
import { allocExpando, elementPropertyInternal, getOrCreateTNode, setInputsForProperty } from './instructions/shared';
import { NATIVE } from './interfaces/container';
import { COMMENT_MARKER, ELEMENT_MARKER } from './interfaces/i18n';
import { BINDING_INDEX, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from './interfaces/view';
import { appendChild, appendProjectedNodes, createTextNode, nativeRemoveNode } from './node_manipulation';
import { getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from './state';
import { NO_CHANGE } from './tokens';
import { renderStringify } from './util/misc_utils';
import { findComponentView } from './util/view_traversal_utils';
import { getNativeByIndex, getNativeByTNode, getTNode, isLContainer } from './util/view_utils';
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
    var msgParts = templateTranslation.split(PH_REGEXP);
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
    allocExpando(viewData, i18nVarsCount);
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
function appendI18nNode(tNode, parentTNode, previousTNode) {
    ngDevMode && ngDevMode.rendererMoveNode++;
    var nextNode = tNode.next;
    var viewData = getLView();
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
 * 3. Replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�)
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
     * Step 3: replace all ICU references with corresponding values (like �ICU_EXP_ICU_1�) in case
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
                    previousTNode = appendI18nNode(currentTNode, destinationTNode, previousTNode);
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
                    var renderer_1 = viewData[RENDERER];
                    // This code is used for ICU expressions only, since we don't support
                    // directives/components in ICUs, we don't need to worry about inputs here
                    elementAttributeInternal(elementNodeIndex, attrName, attrValue, viewData, renderer_1);
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
                                ɵɵtextBinding(nodeIndex, value);
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
    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nAttributesFirstPass(tView, index, values);
    }
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
                    addAllToArray(generateBindingUpdateOpCodes(value, previousElementIndex, attrName), updateOpCodes);
                }
                else {
                    var lView = getLView();
                    var renderer = lView[RENDERER];
                    elementAttributeInternal(previousElementIndex, attrName, value, lView, renderer);
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
    tView.data[index + HEADER_OFFSET] = updateOpCodes;
}
var changeMask = 0;
var shiftsCounter = 0;
/**
 * Stores the values of the bindings during each update cycle in order to determine if we need to
 * update the translated nodes.
 *
 * @param expression The binding's new value or NO_CHANGE
 *
 * @codeGenApi
 */
export function ɵɵi18nExp(expression) {
    if (expression !== NO_CHANGE) {
        changeMask = changeMask | (1 << shiftsCounter);
    }
    shiftsCounter++;
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
    if (placeholders === void 0) { placeholders = {}; }
    if (typeof TRANSLATIONS[input] !== 'undefined') { // to account for empty string
        input = TRANSLATIONS[input];
    }
    return Object.keys(placeholders).length ?
        input.replace(LOCALIZE_PH_REGEXP, function (match, key) { return placeholders[key] || ''; }) :
        input;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyw4QkFBOEIsQ0FBQztBQUN0QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3hILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxZQUFZLEVBQUUsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwSCxPQUFPLEVBQWEsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlHLE1BQU0sbUJBQW1CLENBQUM7QUFLakssT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFh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QUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsV0FBVztJQUN6QixPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4uL3V0aWwvbmdfaTE4bl9jbG9zdXJlX21vZGUnO1xuaW1wb3J0IHtnZXRQbHVyYWxDYXNlfSBmcm9tICcuLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge1NSQ1NFVF9BVFRSUywgVVJJX0FUVFJTLCBWQUxJRF9BVFRSUywgVkFMSURfRUxFTUVOVFMsIGdldFRlbXBsYXRlQ29udGVudH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7ZWxlbWVudEF0dHJpYnV0ZUludGVybmFsLCBzZXREZWxheVByb2plY3Rpb24sIMm1ybVsb2FkLCDJtcm1dGV4dEJpbmRpbmd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge2F0dGFjaEkxOG5PcENvZGVzRGVidWd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7YWxsb2NFeHBhbmRvLCBlbGVtZW50UHJvcGVydHlJbnRlcm5hbCwgZ2V0T3JDcmVhdGVUTm9kZSwgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0xDb250YWluZXIsIE5BVElWRX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlcywgY3JlYXRlVGV4dE5vZGUsIG5hdGl2ZVJlbW92ZU5vZGV9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlLCBpc0xDb250YWluZXJ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5jb25zdCBNQVJLRVIgPSBg77+9YDtcbmNvbnN0IElDVV9CTE9DS19SRUdFWFAgPSAvXlxccyoo77+9XFxkKzo/XFxkKu+/vSlcXHMqLFxccyooc2VsZWN0fHBsdXJhbClcXHMqLC87XG5jb25zdCBTVUJURU1QTEFURV9SRUdFWFAgPSAv77+9XFwvP1xcKihcXGQrOlxcZCsp77+9L2dpO1xuY29uc3QgUEhfUkVHRVhQID0gL++/vShcXC8/WyMqIV1cXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IEJJTkRJTkdfUkVHRVhQID0gL++/vShcXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IElDVV9SRUdFWFAgPSAvKHtcXHMq77+9XFxkKzo/XFxkKu+/vVxccyosXFxzKlxcU3s2fVxccyosW1xcc1xcU10qfSkvZ2k7XG5jb25zdCBlbnVtIFRhZ1R5cGUge1xuICBFTEVNRU5UID0gJyMnLFxuICBURU1QTEFURSA9ICcqJyxcbiAgUFJPSkVDVElPTiA9ICchJyxcbn1cblxuLy8gaTE4blBvc3Rwcm9jZXNzIGNvbnN0c1xuY29uc3QgUk9PVF9URU1QTEFURV9JRCA9IDA7XG5jb25zdCBQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXS87XG5jb25zdCBQUF9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXXwo77+9XFwvP1xcKlxcZCs6XFxkK++/vSkvZztcbmNvbnN0IFBQX0lDVV9WQVJTX1JFR0VYUCA9IC8oe1xccyopKFZBUl8oUExVUkFMfFNFTEVDVCkoX1xcZCspPykoXFxzKiwpL2c7XG5jb25zdCBQUF9JQ1VTX1JFR0VYUCA9IC/vv71JMThOX0VYUF8oSUNVKF9cXGQrKT8p77+9L2c7XG5jb25zdCBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAgPSAvXFwvXFwqLztcbmNvbnN0IFBQX1RFTVBMQVRFX0lEX1JFR0VYUCA9IC9cXGQrXFw6KFxcZCspLztcblxuLy8gUGFyc2VkIHBsYWNlaG9sZGVyIHN0cnVjdHVyZSB1c2VkIGluIHBvc3Rwcm9jZXNzaW5nICh3aXRoaW4gYGkxOG5Qb3N0cHJvY2Vzc2AgZnVuY3Rpb24pXG4vLyBDb250YWlucyB0aGUgZm9sbG93aW5nIGZpZWxkczogW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdXG50eXBlIFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXIgPSBbbnVtYmVyLCBib29sZWFuLCBzdHJpbmddO1xuXG5pbnRlcmZhY2UgSWN1RXhwcmVzc2lvbiB7XG4gIHR5cGU6IEljdVR5cGU7XG4gIG1haW5CaW5kaW5nOiBudW1iZXI7XG4gIGNhc2VzOiBzdHJpbmdbXTtcbiAgdmFsdWVzOiAoc3RyaW5nfEljdUV4cHJlc3Npb24pW11bXTtcbn1cblxuaW50ZXJmYWNlIEljdUNhc2Uge1xuICAvKipcbiAgICogTnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jYXRlIGluIGV4cGFuZG8gZm9yIHRoaXMgY2FzZS5cbiAgICpcbiAgICogVGhpcyBpcyB0aGUgbWF4IG51bWJlciBvZiBET00gZWxlbWVudHMgd2hpY2ggd2lsbCBiZSBjcmVhdGVkIGJ5IHRoaXMgaTE4biArIElDVSBibG9ja3MuIFdoZW5cbiAgICogdGhlIERPTSBlbGVtZW50cyBhcmUgYmVpbmcgY3JlYXRlZCB0aGV5IGFyZSBzdG9yZWQgaW4gdGhlIEVYUEFORE8sIHNvIHRoYXQgdXBkYXRlIE9wQ29kZXMgY2FuXG4gICAqIHdyaXRlIGludG8gdGhlbS5cbiAgICovXG4gIHZhcnM6IG51bWJlcjtcblxuICAvKipcbiAgICogQW4gb3B0aW9uYWwgYXJyYXkgb2YgY2hpbGQvc3ViIElDVXMuXG4gICAqL1xuICBjaGlsZEljdXM6IG51bWJlcltdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGJ1aWxkIHVwIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1VcbiAgICovXG4gIGNyZWF0ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gZGVzdHJveSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVLlxuICAgKi9cbiAgcmVtb3ZlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byB1cGRhdGUgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVSBiaW5kaW5ncy5cbiAgICovXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXM7XG59XG5cbi8qKlxuICogQnJlYWtzIHBhdHRlcm4gaW50byBzdHJpbmdzIGFuZCB0b3AgbGV2ZWwgey4uLn0gYmxvY2tzLlxuICogQ2FuIGJlIHVzZWQgdG8gYnJlYWsgYSBtZXNzYWdlIGludG8gdGV4dCBhbmQgSUNVIGV4cHJlc3Npb25zLCBvciB0byBicmVhayBhbiBJQ1UgZXhwcmVzc2lvbiBpbnRvXG4gKiBrZXlzIGFuZCBjYXNlcy5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIChzdWIpUGF0dGVybiB0byBiZSBicm9rZW4uXG4gKlxuICovXG5mdW5jdGlvbiBleHRyYWN0UGFydHMocGF0dGVybjogc3RyaW5nKTogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10ge1xuICBpZiAoIXBhdHRlcm4pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgcHJldlBvcyA9IDA7XG4gIGNvbnN0IGJyYWNlU3RhY2sgPSBbXTtcbiAgY29uc3QgcmVzdWx0czogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10gPSBbXTtcbiAgY29uc3QgYnJhY2VzID0gL1t7fV0vZztcbiAgLy8gbGFzdEluZGV4IGRvZXNuJ3QgZ2V0IHNldCB0byAwIHNvIHdlIGhhdmUgdG8uXG4gIGJyYWNlcy5sYXN0SW5kZXggPSAwO1xuXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKG1hdGNoID0gYnJhY2VzLmV4ZWMocGF0dGVybikpIHtcbiAgICBjb25zdCBwb3MgPSBtYXRjaC5pbmRleDtcbiAgICBpZiAobWF0Y2hbMF0gPT0gJ30nKSB7XG4gICAgICBicmFjZVN0YWNrLnBvcCgpO1xuXG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBFbmQgb2YgdGhlIGJsb2NrLlxuICAgICAgICBjb25zdCBibG9jayA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIGlmIChJQ1VfQkxPQ0tfUkVHRVhQLnRlc3QoYmxvY2spKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHBhcnNlSUNVQmxvY2soYmxvY2spKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goYmxvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICAgIGJyYWNlU3RhY2sucHVzaCgneycpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MpO1xuICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogUGFyc2VzIHRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiBhbmQgcHJvZHVjZXMgYSBKU09OIG9iamVjdCBmb3IgaXQuXG4gKiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiBUZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gdGhhdCBuZWVkcyB0byBiZSBwYXJzZWQuXG4gKlxuICovXG5mdW5jdGlvbiBwYXJzZUlDVUJsb2NrKHBhdHRlcm46IHN0cmluZyk6IEljdUV4cHJlc3Npb24ge1xuICBjb25zdCBjYXNlcyA9IFtdO1xuICBjb25zdCB2YWx1ZXM6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdW10gPSBbXTtcbiAgbGV0IGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgbGV0IG1haW5CaW5kaW5nID0gMDtcbiAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShJQ1VfQkxPQ0tfUkVHRVhQLCBmdW5jdGlvbihzdHI6IHN0cmluZywgYmluZGluZzogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICAgIH1cbiAgICBtYWluQmluZGluZyA9IHBhcnNlSW50KGJpbmRpbmcuc3Vic3RyKDEpLCAxMCk7XG4gICAgcmV0dXJuICcnO1xuICB9KTtcblxuICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyhwYXR0ZXJuKSBhcyBzdHJpbmdbXTtcbiAgLy8gTG9va2luZyBmb3IgKGtleSBibG9jaykrIHNlcXVlbmNlLiBPbmUgb2YgdGhlIGtleXMgaGFzIHRvIGJlIFwib3RoZXJcIi5cbiAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgcGFydHMubGVuZ3RoOykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1twb3MrK10udHJpbSgpO1xuICAgIGlmIChpY3VUeXBlID09PSBJY3VUeXBlLnBsdXJhbCkge1xuICAgICAgLy8gS2V5IGNhbiBiZSBcIj14XCIsIHdlIGp1c3Qgd2FudCBcInhcIlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccyooPzo9KT8oXFx3KylcXHMqLywgJyQxJyk7XG4gICAgfVxuICAgIGlmIChrZXkubGVuZ3RoKSB7XG4gICAgICBjYXNlcy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gZXh0cmFjdFBhcnRzKHBhcnRzW3BvcysrXSkgYXMgc3RyaW5nW107XG4gICAgaWYgKGNhc2VzLmxlbmd0aCA+IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHZhbHVlcy5wdXNoKGJsb2Nrcyk7XG4gICAgfVxuICB9XG5cbiAgYXNzZXJ0R3JlYXRlclRoYW4oY2FzZXMuaW5kZXhPZignb3RoZXInKSwgLTEsICdNaXNzaW5nIGtleSBcIm90aGVyXCIgaW4gSUNVIHN0YXRlbWVudC4nKTtcbiAgLy8gVE9ETyhvY29tYmUpOiBzdXBwb3J0IElDVSBleHByZXNzaW9ucyBpbiBhdHRyaWJ1dGVzLCBzZWUgIzIxNjE1XG4gIHJldHVybiB7dHlwZTogaWN1VHlwZSwgbWFpbkJpbmRpbmc6IG1haW5CaW5kaW5nLCBjYXNlcywgdmFsdWVzfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSBzdWItdGVtcGxhdGVzIG9mIGEgbWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBtYXRjaDtcbiAgbGV0IHJlcyA9ICcnO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICBsZXQgdGFnTWF0Y2hlZDtcblxuICB3aGlsZSAoKG1hdGNoID0gU1VCVEVNUExBVEVfUkVHRVhQLmV4ZWMobWVzc2FnZSkpICE9PSBudWxsKSB7XG4gICAgaWYgKCFpblRlbXBsYXRlKSB7XG4gICAgICByZXMgKz0gbWVzc2FnZS5zdWJzdHJpbmcoaW5kZXgsIG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIHRhZ01hdGNoZWQgPSBtYXRjaFsxXTtcbiAgICAgIGluVGVtcGxhdGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWF0Y2hbMF0gPT09IGAke01BUktFUn0vKiR7dGFnTWF0Y2hlZH0ke01BUktFUn1gKSB7XG4gICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXg7XG4gICAgICAgIGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGluVGVtcGxhdGUsIGZhbHNlLFxuICAgICAgICAgIGBUYWcgbWlzbWF0Y2g6IHVuYWJsZSB0byBmaW5kIHRoZSBlbmQgb2YgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB0aGUgdHJhbnNsYXRpb24gXCIke21lc3NhZ2V9XCJgKTtcblxuICByZXMgKz0gbWVzc2FnZS5zdWJzdHIoaW5kZXgpO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIGEgcGFydCBvZiBhIG1lc3NhZ2UgYW5kIHJlbW92ZXMgdGhlIHJlc3QuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCBmb3IgZXh0cmFjdGluZyBhIHBhcnQgb2YgdGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIGEgdGVtcGxhdGUuIEEgdHJhbnNsYXRlZFxuICogbWVzc2FnZSBjYW4gc3BhbiBtdWx0aXBsZSB0ZW1wbGF0ZXMuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogPGRpdiBpMThuPlRyYW5zbGF0ZSA8c3BhbiAqbmdJZj5tZTwvc3Bhbj4hPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBjcm9wXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBJbmRleCBvZiB0aGUgc3ViLXRlbXBsYXRlIHRvIGV4dHJhY3QuIElmIHVuZGVmaW5lZCBpdCByZXR1cm5zIHRoZVxuICogZXh0ZXJuYWwgdGVtcGxhdGUgYW5kIHJlbW92ZXMgYWxsIHN1Yi10ZW1wbGF0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcikge1xuICBpZiAodHlwZW9mIHN1YlRlbXBsYXRlSW5kZXggIT09ICdudW1iZXInKSB7XG4gICAgLy8gV2Ugd2FudCB0aGUgcm9vdCB0ZW1wbGF0ZSBtZXNzYWdlLCBpZ25vcmUgYWxsIHN1Yi10ZW1wbGF0ZXNcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdlIHdhbnQgYSBzcGVjaWZpYyBzdWItdGVtcGxhdGVcbiAgICBjb25zdCBzdGFydCA9XG4gICAgICAgIG1lc3NhZ2UuaW5kZXhPZihgOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSArIDIgKyBzdWJUZW1wbGF0ZUluZGV4LnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgIGNvbnN0IGVuZCA9IG1lc3NhZ2Uuc2VhcmNoKG5ldyBSZWdFeHAoYCR7TUFSS0VSfVxcXFwvXFxcXCpcXFxcZCs6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApKTtcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIHRvIHVwZGF0ZSB0aGUgYmluZGluZ3Mgb2YgYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJpbmRpbmdzLlxuICogQHBhcmFtIGRlc3RpbmF0aW9uTm9kZSBJbmRleCBvZiB0aGUgZGVzdGluYXRpb24gbm9kZSB3aGljaCB3aWxsIHJlY2VpdmUgdGhlIGJpbmRpbmcuXG4gKiBAcGFyYW0gYXR0ck5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLCBpZiB0aGUgc3RyaW5nIGJlbG9uZ3MgdG8gYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHNhbml0aXplRm4gU2FuaXRpemF0aW9uIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHN0cmluZyBhZnRlciB1cGRhdGUsIGlmIG5lY2Vzc2FyeS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICBzdHI6IHN0cmluZywgZGVzdGluYXRpb25Ob2RlOiBudW1iZXIsIGF0dHJOYW1lPzogc3RyaW5nLFxuICAgIHNhbml0aXplRm46IFNhbml0aXplckZuIHwgbnVsbCA9IG51bGwpOiBJMThuVXBkYXRlT3BDb2RlcyB7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW251bGwsIG51bGxdOyAgLy8gQWxsb2Mgc3BhY2UgZm9yIG1hc2sgYW5kIHNpemVcbiAgY29uc3QgdGV4dFBhcnRzID0gc3RyLnNwbGl0KEJJTkRJTkdfUkVHRVhQKTtcbiAgbGV0IG1hc2sgPSAwO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgdGV4dFBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgY29uc3QgdGV4dFZhbHVlID0gdGV4dFBhcnRzW2pdO1xuXG4gICAgaWYgKGogJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IHBhcnNlSW50KHRleHRWYWx1ZSwgMTApO1xuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKC0xIC0gYmluZGluZ0luZGV4KTtcbiAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIGlmICh0ZXh0VmFsdWUgIT09ICcnKSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHRcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCh0ZXh0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgIGRlc3RpbmF0aW9uTm9kZSA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8XG4gICAgICAoYXR0ck5hbWUgPyBJMThuVXBkYXRlT3BDb2RlLkF0dHIgOiBJMThuVXBkYXRlT3BDb2RlLlRleHQpKTtcbiAgaWYgKGF0dHJOYW1lKSB7XG4gICAgdXBkYXRlT3BDb2Rlcy5wdXNoKGF0dHJOYW1lLCBzYW5pdGl6ZUZuKTtcbiAgfVxuICB1cGRhdGVPcENvZGVzWzBdID0gbWFzaztcbiAgdXBkYXRlT3BDb2Rlc1sxXSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gMjtcbiAgcmV0dXJuIHVwZGF0ZU9wQ29kZXM7XG59XG5cbmZ1bmN0aW9uIGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIG1hc2sgPSAwKTogbnVtYmVyIHtcbiAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyk7XG4gIGxldCBtYXRjaDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpY3VFeHByZXNzaW9uLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlQXJyID0gaWN1RXhwcmVzc2lvbi52YWx1ZXNbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdoaWxlIChtYXRjaCA9IEJJTkRJTkdfUkVHRVhQLmV4ZWModmFsdWUpKSB7XG4gICAgICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQocGFyc2VJbnQobWF0Y2hbMV0sIDEwKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hc2sgPSBnZXRCaW5kaW5nTWFzayh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uLCBtYXNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hc2s7XG59XG5cbmNvbnN0IGkxOG5JbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xubGV0IGkxOG5JbmRleFN0YWNrUG9pbnRlciA9IC0xO1xuXG4vKipcbiAqIENvbnZlcnQgYmluZGluZyBpbmRleCB0byBtYXNrIGJpdC5cbiAqXG4gKiBFYWNoIGluZGV4IHJlcHJlc2VudHMgYSBzaW5nbGUgYml0IG9uIHRoZSBiaXQtbWFzay4gQmVjYXVzZSBiaXQtbWFzayBvbmx5IGhhcyAzMiBiaXRzLCB3ZSBtYWtlXG4gKiB0aGUgMzJuZCBiaXQgc2hhcmUgYWxsIG1hc2tzIGZvciBhbGwgYmluZGluZ3MgaGlnaGVyIHRoYW4gMzIuIFNpbmNlIGl0IGlzIGV4dHJlbWVseSByYXJlIHRvIGhhdmVcbiAqIG1vcmUgdGhhbiAzMiBiaW5kaW5ncyB0aGlzIHdpbGwgYmUgaGl0IHZlcnkgcmFyZWx5LiBUaGUgZG93bnNpZGUgb2YgaGl0dGluZyB0aGlzIGNvcm5lciBjYXNlIGlzXG4gKiB0aGF0IHdlIHdpbGwgZXhlY3V0ZSBiaW5kaW5nIGNvZGUgbW9yZSBvZnRlbiB0aGFuIG5lY2Vzc2FyeS4gKHBlbmFsdHkgb2YgcGVyZm9ybWFuY2UpXG4gKi9cbmZ1bmN0aW9uIHRvTWFza0JpdChiaW5kaW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IE1hdGgubWluKGJpbmRpbmdJbmRleCwgMzEpO1xufVxuXG5jb25zdCBwYXJlbnRJbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIE1hcmtzIGEgYmxvY2sgb2YgdGV4dCBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgIG1hcmsgdGhlIHRyYW5zbGF0aW9uIGJsb2NrIGluIHRoZSB0ZW1wbGF0ZS5cbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9IXtpbmRleH0oOntibG9ja30p77+9YC9g77+9LyF7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpQcm9qZWN0aW9uIFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZVxuICogICBiZWdpbm5pbmcgYW5kIGVuZCBvZiA8bmctY29udGVudD4gdGhhdCB3YXMgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLlxuICogICBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuXG4gKiAgIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuU3RhcnQoaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkluZGV4U3RhY2tbKytpMThuSW5kZXhTdGFja1BvaW50ZXJdID0gaW5kZXg7XG4gIC8vIFdlIG5lZWQgdG8gZGVsYXkgcHJvamVjdGlvbnMgdW50aWwgYGkxOG5FbmRgXG4gIHNldERlbGF5UHJvamVjdGlvbih0cnVlKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIGkxOG5TdGFydEZpcnN0UGFzcyh0VmlldywgaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICB9XG59XG5cbi8vIENvdW50IGZvciB0aGUgbnVtYmVyIG9mIHZhcnMgdGhhdCB3aWxsIGJlIGFsbG9jYXRlZCBmb3IgZWFjaCBpMThuIGJsb2NrLlxuLy8gSXQgaXMgZ2xvYmFsIGJlY2F1c2UgdGhpcyBpcyB1c2VkIGluIG11bHRpcGxlIGZ1bmN0aW9ucyB0aGF0IGluY2x1ZGUgbG9vcHMgYW5kIHJlY3Vyc2l2ZSBjYWxscy5cbi8vIFRoaXMgaXMgcmVzZXQgdG8gMCB3aGVuIGBpMThuU3RhcnRGaXJzdFBhc3NgIGlzIGNhbGxlZC5cbmxldCBpMThuVmFyc0NvdW50OiBudW1iZXI7XG5cbi8qKlxuICogU2VlIGBpMThuU3RhcnRgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuU3RhcnRGaXJzdFBhc3MoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdGFydEluZGV4ID0gdFZpZXcuYmx1ZXByaW50Lmxlbmd0aCAtIEhFQURFUl9PRkZTRVQ7XG4gIGkxOG5WYXJzQ291bnQgPSAwO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSBnZXRJc1BhcmVudCgpID8gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4ID1cbiAgICAgIHBhcmVudFROb2RlICYmIHBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtUX0hPU1RdID8gcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUIDogaW5kZXg7XG4gIGxldCBwYXJlbnRJbmRleFBvaW50ZXIgPSAwO1xuICBwYXJlbnRJbmRleFN0YWNrW3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleDtcbiAgY29uc3QgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMgPSBbXTtcbiAgLy8gSWYgdGhlIHByZXZpb3VzIG5vZGUgd2Fzbid0IHRoZSBkaXJlY3QgcGFyZW50IHRoZW4gd2UgaGF2ZSBhIHRyYW5zbGF0aW9uIHdpdGhvdXQgdG9wIGxldmVsXG4gIC8vIGVsZW1lbnQgYW5kIHdlIG5lZWQgdG8ga2VlcCBhIHJlZmVyZW5jZSBvZiB0aGUgcHJldmlvdXMgZWxlbWVudCBpZiB0aGVyZSBpcyBvbmVcbiAgaWYgKGluZGV4ID4gMCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUgIT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gQ3JlYXRlIGFuIE9wQ29kZSB0byBzZWxlY3QgdGhlIHByZXZpb3VzIFROb2RlXG4gICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCk7XG4gIH1cbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXTtcbiAgY29uc3QgaWN1RXhwcmVzc2lvbnM6IFRJY3VbXSA9IFtdO1xuXG4gIGNvbnN0IHRlbXBsYXRlVHJhbnNsYXRpb24gPSBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICBjb25zdCBtc2dQYXJ0cyA9IHRlbXBsYXRlVHJhbnNsYXRpb24uc3BsaXQoUEhfUkVHRVhQKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtc2dQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IG1zZ1BhcnRzW2ldO1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVycyAoZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMpXG4gICAgICBpZiAodmFsdWUuY2hhckF0KDApID09PSAnLycpIHtcbiAgICAgICAgLy8gSXQgaXMgYSBjbG9zaW5nIHRhZ1xuICAgICAgICBpZiAodmFsdWUuY2hhckF0KDEpID09PSBUYWdUeXBlLkVMRU1FTlQpIHtcbiAgICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDIpLCAxMCk7XG4gICAgICAgICAgcGFyZW50SW5kZXggPSBwYXJlbnRJbmRleFN0YWNrWy0tcGFyZW50SW5kZXhQb2ludGVyXTtcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2gocGhJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBoSW5kZXggPSBwYXJzZUludCh2YWx1ZS5zdWJzdHIoMSksIDEwKTtcbiAgICAgICAgLy8gVGhlIHZhbHVlIHJlcHJlc2VudHMgYSBwbGFjZWhvbGRlciB0aGF0IHdlIG1vdmUgdG8gdGhlIGRlc2lnbmF0ZWQgaW5kZXhcbiAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgcGhJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0LFxuICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICBpZiAodmFsdWUuY2hhckF0KDApID09PSBUYWdUeXBlLkVMRU1FTlQpIHtcbiAgICAgICAgICBwYXJlbnRJbmRleFN0YWNrWysrcGFyZW50SW5kZXhQb2ludGVyXSA9IHBhcmVudEluZGV4ID0gcGhJbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncyAmIElDVSBleHByZXNzaW9ucylcbiAgICAgIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHZhbHVlKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKGogJiAxKSB7XG4gICAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1Tm9kZUluZGV4ID0gc3RhcnRJbmRleCArIGkxOG5WYXJzQ291bnQrKztcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZ0Rldk1vZGUgPyBgSUNVICR7aWN1Tm9kZUluZGV4fWAgOiAnJywgaWN1Tm9kZUluZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgLy8gVXBkYXRlIGNvZGVzIGZvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBjb25zdCBpY3VFeHByZXNzaW9uID0gcGFydHNbal0gYXMgSWN1RXhwcmVzc2lvbjtcbiAgICAgICAgICBjb25zdCBtYXNrID0gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbik7XG4gICAgICAgICAgaWN1U3RhcnQoaWN1RXhwcmVzc2lvbnMsIGljdUV4cHJlc3Npb24sIGljdU5vZGVJbmRleCwgaWN1Tm9kZUluZGV4KTtcbiAgICAgICAgICAvLyBTaW5jZSB0aGlzIGlzIHJlY3Vyc2l2ZSwgdGhlIGxhc3QgVEljdSB0aGF0IHdhcyBwdXNoZWQgaXMgdGhlIG9uZSB3ZSB3YW50XG4gICAgICAgICAgY29uc3QgdEljdUluZGV4ID0gaWN1RXhwcmVzc2lvbnMubGVuZ3RoIC0gMTtcbiAgICAgICAgICB1cGRhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgICAgICAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgICAgICAtMSAtIGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcsXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLCB0SWN1SW5kZXgsXG4gICAgICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgICAyLCAgICAgLy8gc2tpcCAyIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsIHRJY3VJbmRleCk7XG4gICAgICAgIH0gZWxzZSBpZiAocGFydHNbal0gIT09ICcnKSB7XG4gICAgICAgICAgY29uc3QgdGV4dCA9IHBhcnRzW2pdIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncylcbiAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdGV4dC5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgLy8gQ3JlYXRlIHRleHQgbm9kZXNcbiAgICAgICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gc3RhcnRJbmRleCArIGkxOG5WYXJzQ291bnQrKztcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgYmluZGluZywgdGhlIHZhbHVlIHdpbGwgYmUgc2V0IGR1cmluZyB1cGRhdGVcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdGV4dCwgdGV4dE5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModGV4dCwgdGV4dE5vZGVJbmRleCksIHVwZGF0ZU9wQ29kZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFsbG9jRXhwYW5kbyh2aWV3RGF0YSwgaTE4blZhcnNDb3VudCk7XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXMsIGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCwgdmlld0RhdGEpO1xuXG4gIC8vIE5PVEU6IGxvY2FsIHZhciBuZWVkZWQgdG8gcHJvcGVybHkgYXNzZXJ0IHRoZSB0eXBlIG9mIGBUSTE4bmAuXG4gIGNvbnN0IHRJMThuOiBUSTE4biA9IHtcbiAgICB2YXJzOiBpMThuVmFyc0NvdW50LFxuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgaWN1czogaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLFxuICB9O1xuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHRJMThuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZSh0Tm9kZTogVE5vZGUsIHBhcmVudFROb2RlOiBUTm9kZSwgcHJldmlvdXNUTm9kZTogVE5vZGUgfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyTW92ZU5vZGUrKztcbiAgY29uc3QgbmV4dE5vZGUgPSB0Tm9kZS5uZXh0O1xuICBjb25zdCB2aWV3RGF0YSA9IGdldExWaWV3KCk7XG4gIGlmICghcHJldmlvdXNUTm9kZSkge1xuICAgIHByZXZpb3VzVE5vZGUgPSBwYXJlbnRUTm9kZTtcbiAgfVxuXG4gIC8vIFJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBpZiAocHJldmlvdXNUTm9kZSA9PT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHBhcmVudFROb2RlLmNoaWxkKSB7XG4gICAgdE5vZGUubmV4dCA9IHBhcmVudFROb2RlLmNoaWxkO1xuICAgIHBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gIH0gZWxzZSBpZiAocHJldmlvdXNUTm9kZSAhPT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHByZXZpb3VzVE5vZGUubmV4dCkge1xuICAgIHROb2RlLm5leHQgPSBwcmV2aW91c1ROb2RlLm5leHQ7XG4gICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICBpZiAocGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW1RfSE9TVF0pIHtcbiAgICB0Tm9kZS5wYXJlbnQgPSBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGU7XG4gIH1cblxuICAvLyBJZiB0Tm9kZSB3YXMgbW92ZWQgYXJvdW5kLCB3ZSBtaWdodCBuZWVkIHRvIGZpeCBhIGJyb2tlbiBsaW5rLlxuICBsZXQgY3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGUubmV4dDtcbiAgd2hpbGUgKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3IubmV4dCA9PT0gdE5vZGUpIHtcbiAgICAgIGN1cnNvci5uZXh0ID0gbmV4dE5vZGU7XG4gICAgfVxuICAgIGN1cnNvciA9IGN1cnNvci5uZXh0O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBsYWNlaG9sZGVyIHRvIGFwcGVuZCBpcyBhIHByb2plY3Rpb24sIHdlIG5lZWQgdG8gbW92ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGluc3RlYWRcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgY29uc3QgdFByb2plY3Rpb25Ob2RlID0gdE5vZGUgYXMgVFByb2plY3Rpb25Ob2RlO1xuICAgIGFwcGVuZFByb2plY3RlZE5vZGVzKFxuICAgICAgICB2aWV3RGF0YSwgdFByb2plY3Rpb25Ob2RlLCB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiwgZmluZENvbXBvbmVudFZpZXcodmlld0RhdGEpKTtcbiAgICByZXR1cm4gdE5vZGU7XG4gIH1cblxuICBhcHBlbmRDaGlsZChnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3RGF0YSksIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gdmlld0RhdGFbdE5vZGUuaW5kZXhdO1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIE5vZGVzIHRoYXQgaW5qZWN0IFZpZXdDb250YWluZXJSZWYgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gICAgYXBwZW5kQ2hpbGQoc2xvdFZhbHVlW05BVElWRV0sIHROb2RlLCB2aWV3RGF0YSk7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGZvciBpbnRlcm5hdGlvbmFsaXphdGlvbi5cbiAqXG4gKiBIYW5kbGVzIG1lc3NhZ2Ugc3RyaW5nIHBvc3QtcHJvY2Vzc2luZyBieSB0cmFuc2Zvcm1pbmcgaXQgZnJvbSBpbnRlcm1lZGlhdGVcbiAqIGZvcm1hdCAodGhhdCBtaWdodCBjb250YWluIHNvbWUgbWFya2VycyB0aGF0IHdlIG5lZWQgdG8gcmVwbGFjZSkgdG8gdGhlIGZpbmFsXG4gKiBmb3JtLCBjb25zdW1hYmxlIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvbi4gUG9zdCBwcm9jZXNzaW5nIHN0ZXBzIGluY2x1ZGU6XG4gKlxuICogMS4gUmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgY2FzZXMgKGxpa2UgW++/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71877+9Ne+/vV0pXG4gKiAyLiBSZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAqIDMuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blBvc3Rwcm9jZXNzKFxuICAgIG1lc3NhZ2U6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7W2tleTogc3RyaW5nXTogKHN0cmluZyB8IHN0cmluZ1tdKX0gPSB7fSk6IHN0cmluZyB7XG4gIC8qKlxuICAgKiBTdGVwIDE6IHJlc29sdmUgYWxsIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBsaWtlIFvvv70jNe+/vXzvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9XVxuICAgKlxuICAgKiBOb3RlOiBkdWUgdG8gdGhlIHdheSB3ZSBwcm9jZXNzIG5lc3RlZCB0ZW1wbGF0ZXMgKEJGUyksIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBhcmUgdHlwaWNhbGx5XG4gICAqIGdyb3VwZWQgYnkgdGVtcGxhdGVzLCBmb3IgZXhhbXBsZTogW++/vSM177+9fO+/vSM277+9fO+/vSMxOjHvv71877+9IzM6Mu+/vV0gd2hlcmUg77+9IzXvv70gYW5kIO+/vSM277+9IGJlbG9uZyB0byByb290XG4gICAqIHRlbXBsYXRlLCDvv70jMTox77+9IGJlbG9uZyB0byBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleCAxIGFuZCDvv70jMToy77+9IC0gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXhcbiAgICogMy4gSG93ZXZlciBpbiByZWFsIHRlbXBsYXRlcyB0aGUgb3JkZXIgbWlnaHQgYmUgZGlmZmVyZW50OiBpLmUuIO+/vSMxOjHvv70gYW5kL29yIO+/vSMzOjLvv70gbWF5IGdvIGluXG4gICAqIGZyb250IG9mIO+/vSM277+9LiBUaGUgcG9zdCBwcm9jZXNzaW5nIHN0ZXAgcmVzdG9yZXMgdGhlIHJpZ2h0IG9yZGVyIGJ5IGtlZXBpbmcgdHJhY2sgb2YgdGhlXG4gICAqIHRlbXBsYXRlIGlkIHN0YWNrIGFuZCBsb29rcyBmb3IgcGxhY2Vob2xkZXJzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlbXBsYXRlLlxuICAgKi9cbiAgbGV0IHJlc3VsdDogc3RyaW5nID0gbWVzc2FnZTtcbiAgaWYgKFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAudGVzdChtZXNzYWdlKSkge1xuICAgIGNvbnN0IG1hdGNoZXM6IHtba2V5OiBzdHJpbmddOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW119ID0ge307XG4gICAgY29uc3QgdGVtcGxhdGVJZHNTdGFjazogbnVtYmVyW10gPSBbUk9PVF9URU1QTEFURV9JRF07XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfUExBQ0VIT0xERVJTX1JFR0VYUCwgKG06IGFueSwgcGhzOiBzdHJpbmcsIHRtcGw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcGhzIHx8IHRtcGw7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlcnM6IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXSA9IG1hdGNoZXNbY29udGVudF0gfHwgW107XG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgY29udGVudC5zcGxpdCgnfCcpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHBsYWNlaG9sZGVyLm1hdGNoKFBQX1RFTVBMQVRFX0lEX1JFR0VYUCk7XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVJZCA9IG1hdGNoID8gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSA6IFJPT1RfVEVNUExBVEVfSUQ7XG4gICAgICAgICAgY29uc3QgaXNDbG9zZVRlbXBsYXRlVGFnID0gUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQLnRlc3QocGxhY2Vob2xkZXIpO1xuICAgICAgICAgIHBsYWNlaG9sZGVycy5wdXNoKFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVzW2NvbnRlbnRdID0gcGxhY2Vob2xkZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgcGxhY2Vob2xkZXIgLSAke2NvbnRlbnR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZUlkID0gdGVtcGxhdGVJZHNTdGFja1t0ZW1wbGF0ZUlkc1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGlkeCA9IDA7XG4gICAgICAvLyBmaW5kIHBsYWNlaG9sZGVyIGluZGV4IHRoYXQgbWF0Y2hlcyBjdXJyZW50IHRlbXBsYXRlIGlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYWNlaG9sZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGxhY2Vob2xkZXJzW2ldWzBdID09PSBjdXJyZW50VGVtcGxhdGVJZCkge1xuICAgICAgICAgIGlkeCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHVwZGF0ZSB0ZW1wbGF0ZSBpZCBzdGFjayBiYXNlZCBvbiB0aGUgY3VycmVudCB0YWcgZXh0cmFjdGVkXG4gICAgICBjb25zdCBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0gPSBwbGFjZWhvbGRlcnNbaWR4XTtcbiAgICAgIGlmIChpc0Nsb3NlVGVtcGxhdGVUYWcpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wb3AoKTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRlbXBsYXRlSWQgIT09IHRlbXBsYXRlSWQpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgfVxuICAgICAgLy8gcmVtb3ZlIHByb2Nlc3NlZCB0YWcgZnJvbSB0aGUgbGlzdFxuICAgICAgcGxhY2Vob2xkZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gcmV0dXJuIGN1cnJlbnQgcmVzdWx0IGlmIG5vIHJlcGxhY2VtZW50cyBzcGVjaWZpZWRcbiAgaWYgKCFPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogU3RlcCAyOiByZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9WQVJTX1JFR0VYUCwgKG1hdGNoLCBzdGFydCwga2V5LCBfdHlwZSwgX2lkeCwgZW5kKTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyBgJHtzdGFydH0ke3JlcGxhY2VtZW50c1trZXldfSR7ZW5kfWAgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgMzogcmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KSBpbiBjYXNlXG4gICAqIG11bHRpcGxlIElDVXMgaGF2ZSB0aGUgc2FtZSBwbGFjZWhvbGRlciBuYW1lXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VTX1JFR0VYUCwgKG1hdGNoLCBrZXkpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChyZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgbGlzdCA9IHJlcGxhY2VtZW50c1trZXldIGFzIHN0cmluZ1tdO1xuICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBJQ1UgLSAke21hdGNofSB3aXRoIGtleTogJHtrZXl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGlzdC5zaGlmdCgpICE7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgbWFya2VkIGJ5IGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAuIEl0IGluc2VydHMgdGhlIHRleHQvSUNVIG5vZGVzXG4gKiBpbnRvIHRoZSByZW5kZXIgdHJlZSwgbW92ZXMgdGhlIHBsYWNlaG9sZGVyIG5vZGVzIGFuZCByZW1vdmVzIHRoZSBkZWxldGVkIG5vZGVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkVuZCgpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuRW5kRmlyc3RQYXNzKHRWaWV3KTtcbiAgLy8gU3RvcCBkZWxheWluZyBwcm9qZWN0aW9uc1xuICBzZXREZWxheVByb2plY3Rpb24oZmFsc2UpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkVuZGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5FbmRGaXJzdFBhc3ModFZpZXc6IFRWaWV3KSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2aWV3RGF0YVtUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2kxOG5FbmQgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcblxuICBjb25zdCByb290SW5kZXggPSBpMThuSW5kZXhTdGFja1tpMThuSW5kZXhTdGFja1BvaW50ZXItLV07XG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtyb290SW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUSTE4bjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEkxOG4sIGBZb3Ugc2hvdWxkIGNhbGwgaTE4blN0YXJ0IGJlZm9yZSBpMThuRW5kYCk7XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBub2RlIHRoYXQgd2FzIGFkZGVkIGJlZm9yZSBgaTE4bkVuZGBcbiAgbGV0IGxhc3RDcmVhdGVkTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuXG4gIC8vIFJlYWQgdGhlIGluc3RydWN0aW9ucyB0byBpbnNlcnQvbW92ZS9yZW1vdmUgRE9NIGVsZW1lbnRzXG4gIGNvbnN0IHZpc2l0ZWROb2RlcyA9IHJlYWRDcmVhdGVPcENvZGVzKHJvb3RJbmRleCwgdEkxOG4uY3JlYXRlLCB0STE4bi5pY3VzLCB2aWV3RGF0YSk7XG5cbiAgLy8gUmVtb3ZlIGRlbGV0ZWQgbm9kZXNcbiAgZm9yIChsZXQgaSA9IHJvb3RJbmRleCArIDE7IGkgPD0gbGFzdENyZWF0ZWROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDsgaSsrKSB7XG4gICAgaWYgKHZpc2l0ZWROb2Rlcy5pbmRleE9mKGkpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZShpLCB2aWV3RGF0YSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgc3RvcmVzIHRoZSBkeW5hbWljIFROb2RlLCBhbmQgdW5ob29rcyBpdCBmcm9tIHRoZSB0cmVlIGZvciBub3cuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsKTogVEVsZW1lbnROb2RlfFRJY3VDb250YWluZXJOb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IG5hdGl2ZTtcbiAgY29uc3QgdE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIHR5cGUgYXMgYW55LCBuYW1lLCBudWxsKTtcblxuICAvLyBXZSBhcmUgY3JlYXRpbmcgYSBkeW5hbWljIG5vZGUsIHRoZSBwcmV2aW91cyB0Tm9kZSBtaWdodCBub3QgYmUgcG9pbnRpbmcgYXQgdGhpcyBub2RlLlxuICAvLyBXZSB3aWxsIGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUgbGF0ZXIgd2l0aCBgYXBwZW5kSTE4bk5vZGVgLlxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPT09IHROb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5mdW5jdGlvbiByZWFkQ3JlYXRlT3BDb2RlcyhcbiAgICBpbmRleDogbnVtYmVyLCBjcmVhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICB2aWV3RGF0YTogTFZpZXcpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGxldCBjdXJyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHZpc2l0ZWROb2RlczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUob3BDb2RlLCByZW5kZXJlcik7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIGN1cnJlbnRUTm9kZSA9XG4gICAgICAgICAgY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KHZpZXdEYXRhLCB0ZXh0Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dFJOb2RlLCBudWxsKTtcbiAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKHRleHROb2RlSW5kZXgpO1xuICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvblROb2RlOiBUTm9kZTtcbiAgICAgICAgICBpZiAoZGVzdGluYXRpb25Ob2RlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGVzdGluYXRpb24gbm9kZSBpcyBgaTE4blN0YXJ0YCwgd2UgZG9uJ3QgaGF2ZSBhXG4gICAgICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZSBhbmQgd2Ugc2hvdWxkIHVzZSB0aGUgaG9zdCBub2RlIGluc3RlYWRcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSB2aWV3RGF0YVtUX0hPU1RdICE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBnZXRUTm9kZShkZXN0aW5hdGlvbk5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRUTm9kZSAhLFxuICAgICAgICAgICAgICAgICAgYFlvdSBuZWVkIHRvIGNyZWF0ZSBvciBzZWxlY3QgYSBub2RlIGJlZm9yZSB5b3UgY2FuIGluc2VydCBpdCBpbnRvIHRoZSBET01gKTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gYXBwZW5kSTE4bk5vZGUoY3VycmVudFROb2RlICEsIGRlc3RpbmF0aW9uVE5vZGUsIHByZXZpb3VzVE5vZGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2gobm9kZUluZGV4KTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIGlmIChjdXJyZW50VE5vZGUpIHtcbiAgICAgICAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShjdXJyZW50VE5vZGUsIGN1cnJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICBjb25zdCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IHJlbmRlcmVyID0gdmlld0RhdGFbUkVOREVSRVJdO1xuICAgICAgICAgIC8vIFRoaXMgY29kZSBpcyB1c2VkIGZvciBJQ1UgZXhwcmVzc2lvbnMgb25seSwgc2luY2Ugd2UgZG9uJ3Qgc3VwcG9ydFxuICAgICAgICAgIC8vIGRpcmVjdGl2ZXMvY29tcG9uZW50cyBpbiBJQ1VzLCB3ZSBkb24ndCBuZWVkIHRvIHdvcnJ5IGFib3V0IGlucHV0cyBoZXJlXG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKGVsZW1lbnROb2RlSW5kZXgsIGF0dHJOYW1lLCBhdHRyVmFsdWUsIHZpZXdEYXRhLCByZW5kZXJlcik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb21tZW50VmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHtjb21tZW50VmFsdWV9XCIgdG8gYmUgYSBjb21tZW50IG5vZGUgdmFsdWVgKTtcbiAgICAgICAgICBjb25zdCBjb21tZW50Uk5vZGUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KGNvbW1lbnRWYWx1ZSk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgdmlld0RhdGEsIGNvbW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5JY3VDb250YWluZXIsIGNvbW1lbnRSTm9kZSwgbnVsbCk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goY29tbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbW1lbnRSTm9kZSwgdmlld0RhdGEpO1xuICAgICAgICAgIChjdXJyZW50VE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUpLmFjdGl2ZUNhc2VJbmRleCA9IG51bGw7XG4gICAgICAgICAgLy8gV2Ugd2lsbCBhZGQgdGhlIGNhc2Ugbm9kZXMgbGF0ZXIsIGR1cmluZyB0aGUgdXBkYXRlIHBoYXNlXG4gICAgICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIHZpZXdEYXRhLCBlbGVtZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgZWxlbWVudFJOb2RlLCB0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGVsZW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0SXNOb3RQYXJlbnQoKTtcblxuICByZXR1cm4gdmlzaXRlZE5vZGVzO1xufVxuXG5mdW5jdGlvbiByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCwgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsXG4gICAgY2hhbmdlTWFzazogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcsIGJ5cGFzc0NoZWNrQml0ID0gZmFsc2UpIHtcbiAgbGV0IGNhc2VDcmVhdGVkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdXBkYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICBjb25zdCBjaGVja0JpdCA9IHVwZGF0ZU9wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgY29uc3Qgc2tpcENvZGVzID0gdXBkYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICBpZiAoYnlwYXNzQ2hlY2tCaXQgfHwgKGNoZWNrQml0ICYgY2hhbmdlTWFzaykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2hlY2tlZFxuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgYmluZGluZyBpbmRleCB3aG9zZSB2YWx1ZSBpcyBuZWdhdGl2ZVxuICAgICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KHZpZXdEYXRhW2JpbmRpbmdzU3RhcnRJbmRleCAtIG9wQ29kZV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBsZXQgaWN1VE5vZGU6IFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIFNhbml0aXplckZuIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChub2RlSW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVGbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIMm1ybV0ZXh0QmluZGluZyhub2RlSW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaDpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSB1cGRhdGVPcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGFjdGl2ZSBjYXNlLCBkZWxldGUgdGhlIG9sZCBub2Rlc1xuICAgICAgICAgICAgICAgIGlmIChpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZUNvZGVzID0gdEljdS5yZW1vdmVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4XTtcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcmVtb3ZlQ29kZXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlT3BDb2RlID0gcmVtb3ZlQ29kZXNba10gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlbW92ZU9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZU5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlTmVzdGVkSWN1OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1Tm9kZUluZGV4ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVDb2Rlc1trICsgMV0gYXMgbnVtYmVyID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdVROb2RlID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRUTm9kZShuZXN0ZWRJY3VOb2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUluZGV4ID0gbmVzdGVkSWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdVRJbmRleCA9IHJlbW92ZU9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZFRJY3UgPSBpY3VzICFbbmVzdGVkSWN1VEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShuZXN0ZWRUSWN1LnJlbW92ZVthY3RpdmVJbmRleF0sIHJlbW92ZUNvZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBhY3RpdmUgY2FzZUluZGV4XG4gICAgICAgICAgICAgICAgY29uc3QgY2FzZUluZGV4ID0gZ2V0Q2FzZUluZGV4KHRJY3UsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggPSBjYXNlSW5kZXggIT09IC0xID8gY2FzZUluZGV4IDogbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbm9kZXMgZm9yIHRoZSBuZXcgY2FzZVxuICAgICAgICAgICAgICAgIHJlYWRDcmVhdGVPcENvZGVzKC0xLCB0SWN1LmNyZWF0ZVtjYXNlSW5kZXhdLCBpY3VzLCB2aWV3RGF0YSk7XG4gICAgICAgICAgICAgICAgY2FzZUNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGljdVROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgIHRJY3UudXBkYXRlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCAhXSwgaWN1cywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrLFxuICAgICAgICAgICAgICAgICAgICB2aWV3RGF0YSwgY2FzZUNyZWF0ZWQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpICs9IHNraXBDb2RlcztcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVOb2RlKGluZGV4OiBudW1iZXIsIHZpZXdEYXRhOiBMVmlldykge1xuICBjb25zdCByZW1vdmVkUGhUTm9kZSA9IGdldFROb2RlKGluZGV4LCB2aWV3RGF0YSk7XG4gIGNvbnN0IHJlbW92ZWRQaFJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgdmlld0RhdGEpO1xuICBpZiAocmVtb3ZlZFBoUk5vZGUpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHZpZXdEYXRhW1JFTkRFUkVSXSwgcmVtb3ZlZFBoUk5vZGUpO1xuICB9XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gybXJtWxvYWQoaW5kZXgpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMQ29udGFpbmVyIHwgU3R5bGluZ0NvbnRleHQ7XG4gIGlmIChpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBzbG90VmFsdWUgYXMgTENvbnRhaW5lcjtcbiAgICBpZiAocmVtb3ZlZFBoVE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgbmF0aXZlUmVtb3ZlTm9kZSh2aWV3RGF0YVtSRU5ERVJFUl0sIGxDb250YWluZXJbTkFUSVZFXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGVmaW5lIHRoaXMgbm9kZSBhcyBkZXRhY2hlZCBzbyB0aGF0IHdlIGRvbid0IHJpc2sgcHJvamVjdGluZyBpdFxuICByZW1vdmVkUGhUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGV0YWNoZWQ7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG59XG5cbi8qKlxuICpcbiAqIFVzZSB0aGlzIGluc3RydWN0aW9uIHRvIGNyZWF0ZSBhIHRyYW5zbGF0aW9uIGJsb2NrIHRoYXQgZG9lc24ndCBjb250YWluIGFueSBwbGFjZWhvbGRlci5cbiAqIEl0IGNhbGxzIGJvdGgge0BsaW5rIGkxOG5TdGFydH0gYW5kIHtAbGluayBpMThuRW5kfSBpbiBvbmUgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG4oaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIMm1ybVpMThuU3RhcnQoaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICDJtcm1aTE4bkVuZCgpO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgbGlzdCBvZiBhdHRyaWJ1dGVzIGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggaW4gdGhlIHN0YXRpYyBibG9ja1xuICogQHBhcmFtIHZhbHVlc1xuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkF0dHJpYnV0ZXMoaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyh0VmlldywgaW5kZXgsIHZhbHVlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWUgYGkxOG5BdHRyaWJ1dGVzYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnRJbmRleCA9IHByZXZpb3VzRWxlbWVudC5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSB2YWx1ZXNbaV07XG4gICAgY29uc3QgbWVzc2FnZSA9IHZhbHVlc1tpICsgMV07XG4gICAgY29uc3QgcGFydHMgPSBtZXNzYWdlLnNwbGl0KElDVV9SRUdFWFApO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFydHNbal07XG5cbiAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgIC8vIFRPRE8ob2NvbWJlKTogc3VwcG9ydCBJQ1UgZXhwcmVzc2lvbnMgaW4gYXR0cmlidXRlc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lDVSBleHByZXNzaW9ucyBhcmUgbm90IHlldCBzdXBwb3J0ZWQgaW4gYXR0cmlidXRlcycpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIXZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgICAgICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSwgdmFsdWUsIGxWaWV3LCByZW5kZXJlcik7XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhhdCBhdHRyaWJ1dGUgaXMgYSBkaXJlY3RpdmUgaW5wdXRcbiAgICAgICAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHByZXZpb3VzRWxlbWVudEluZGV4LCBsVmlldyk7XG4gICAgICAgICAgY29uc3QgZGF0YVZhbHVlID0gdE5vZGUuaW5wdXRzICYmIHROb2RlLmlucHV0c1thdHRyTmFtZV07XG4gICAgICAgICAgaWYgKGRhdGFWYWx1ZSkge1xuICAgICAgICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHVwZGF0ZU9wQ29kZXM7XG59XG5cbmxldCBjaGFuZ2VNYXNrID0gMGIwO1xubGV0IHNoaWZ0c0NvdW50ZXIgPSAwO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgdmFsdWVzIG9mIHRoZSBiaW5kaW5ncyBkdXJpbmcgZWFjaCB1cGRhdGUgY3ljbGUgaW4gb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG9cbiAqIHVwZGF0ZSB0aGUgdHJhbnNsYXRlZCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gZXhwcmVzc2lvbiBUaGUgYmluZGluZydzIG5ldyB2YWx1ZSBvciBOT19DSEFOR0VcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FeHA8VD4oZXhwcmVzc2lvbjogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAoZXhwcmVzc2lvbiAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkFwcGx5KGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHNoaWZ0c0NvdW50ZXIpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICAgIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdO1xuICAgIGxldCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcztcbiAgICBsZXQgaWN1czogVEljdVtdfG51bGwgPSBudWxsO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRJMThuKSkge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9IHRJMThuIGFzIEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gKHRJMThuIGFzIFRJMThuKS51cGRhdGU7XG4gICAgICBpY3VzID0gKHRJMThuIGFzIFRJMThuKS5pY3VzO1xuICAgIH1cbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSAtIHNoaWZ0c0NvdW50ZXIgLSAxO1xuICAgIHJlYWRVcGRhdGVPcENvZGVzKHVwZGF0ZU9wQ29kZXMsIGljdXMsIGJpbmRpbmdzU3RhcnRJbmRleCwgY2hhbmdlTWFzaywgbFZpZXcpO1xuXG4gICAgLy8gUmVzZXQgY2hhbmdlTWFzayAmIG1hc2tCaXQgdG8gZGVmYXVsdCBmb3IgdGhlIG5leHQgdXBkYXRlIGN5Y2xlXG4gICAgY2hhbmdlTWFzayA9IDBiMDtcbiAgICBzaGlmdHNDb3VudGVyID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNhc2Ugb2YgYW4gSUNVIGV4cHJlc3Npb24gZGVwZW5kaW5nIG9uIHRoZSBtYWluIGJpbmRpbmcgdmFsdWVcbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGJpbmRpbmdWYWx1ZSBUaGUgdmFsdWUgb2YgdGhlIG1haW4gYmluZGluZyB1c2VkIGJ5IHRoaXMgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FzZUluZGV4KGljdUV4cHJlc3Npb246IFRJY3UsIGJpbmRpbmdWYWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXNlKGJpbmRpbmdWYWx1ZSwgZ2V0TG9jYWxlSWQoKSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIGZvciBJQ1UgZXhwcmVzc2lvbnMuXG4gKlxuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIHN0YXJ0SW5kZXhcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBpY3VTdGFydChcbiAgICB0SWN1czogVEljdVtdLCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBzdGFydEluZGV4OiBudW1iZXIsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjcmVhdGVDb2RlcyA9IFtdO1xuICBjb25zdCByZW1vdmVDb2RlcyA9IFtdO1xuICBjb25zdCB1cGRhdGVDb2RlcyA9IFtdO1xuICBjb25zdCB2YXJzID0gW107XG4gIGNvbnN0IGNoaWxkSWN1czogbnVtYmVyW11bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gRWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzICYgb3RoZXIgSUNVIGV4cHJlc3Npb25zXG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBjb25zdCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gbmVzdGVkIElDVSBleHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGljdUluZGV4ID0gbmVzdGVkSWN1cy5wdXNoKHZhbHVlIGFzIEljdUV4cHJlc3Npb24pIC0gMTtcbiAgICAgICAgLy8gUmVwbGFjZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb24gYnkgYSBjb21tZW50IG5vZGVcbiAgICAgICAgdmFsdWVBcnJbal0gPSBgPCEtLe+/vSR7aWN1SW5kZXh977+9LS0+YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaWN1Q2FzZTogSWN1Q2FzZSA9XG4gICAgICAgIHBhcnNlSWN1Q2FzZSh2YWx1ZUFyci5qb2luKCcnKSwgc3RhcnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICBjcmVhdGVDb2Rlcy5wdXNoKGljdUNhc2UuY3JlYXRlKTtcbiAgICByZW1vdmVDb2Rlcy5wdXNoKGljdUNhc2UucmVtb3ZlKTtcbiAgICB1cGRhdGVDb2Rlcy5wdXNoKGljdUNhc2UudXBkYXRlKTtcbiAgICB2YXJzLnB1c2goaWN1Q2FzZS52YXJzKTtcbiAgICBjaGlsZEljdXMucHVzaChpY3VDYXNlLmNoaWxkSWN1cyk7XG4gIH1cbiAgY29uc3QgdEljdTogVEljdSA9IHtcbiAgICB0eXBlOiBpY3VFeHByZXNzaW9uLnR5cGUsXG4gICAgdmFycyxcbiAgICBjaGlsZEljdXMsXG4gICAgY2FzZXM6IGljdUV4cHJlc3Npb24uY2FzZXMsXG4gICAgY3JlYXRlOiBjcmVhdGVDb2RlcyxcbiAgICByZW1vdmU6IHJlbW92ZUNvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlQ29kZXNcbiAgfTtcbiAgdEljdXMucHVzaCh0SWN1KTtcbiAgLy8gQWRkaW5nIHRoZSBtYXhpbXVtIHBvc3NpYmxlIG9mIHZhcnMgbmVlZGVkIChiYXNlZCBvbiB0aGUgY2FzZXMgd2l0aCB0aGUgbW9zdCB2YXJzKVxuICBpMThuVmFyc0NvdW50ICs9IE1hdGgubWF4KC4uLnZhcnMpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgdGVtcGxhdGUgaW50byBhbiBIVE1MIHRlbXBsYXRlIGFuZCBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdXBkYXRlXG4gKiBhdHRyaWJ1dGVzIG9yIG5vZGVzIHRoYXQgY29udGFpbiBiaW5kaW5ncy5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCBUaGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0gcGFyZW50SW5kZXhcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBwYXJzZUljdUNhc2UoXG4gICAgdW5zYWZlSHRtbDogc3RyaW5nLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sIHRJY3VzOiBUSWN1W10sXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IEljdUNhc2Uge1xuICBjb25zdCBpbmVydEJvZHlIZWxwZXIgPSBuZXcgSW5lcnRCb2R5SGVscGVyKGRvY3VtZW50KTtcbiAgY29uc3QgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuICBpZiAoIWluZXJ0Qm9keUVsZW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBnZW5lcmF0ZSBpbmVydCBib2R5IGVsZW1lbnQnKTtcbiAgfVxuICBjb25zdCB3cmFwcGVyID0gZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQgISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50O1xuICBjb25zdCBvcENvZGVzOiBJY3VDYXNlID0ge3ZhcnM6IDAsIGNoaWxkSWN1czogW10sIGNyZWF0ZTogW10sIHJlbW92ZTogW10sIHVwZGF0ZTogW119O1xuICBwYXJzZU5vZGVzKHdyYXBwZXIuZmlyc3RDaGlsZCwgb3BDb2RlcywgcGFyZW50SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gIHJldHVybiBvcENvZGVzO1xufVxuXG5jb25zdCBORVNURURfSUNVID0gL++/vShcXGQrKe+/vS87XG5cbi8qKlxuICogUGFyc2VzIGEgbm9kZSwgaXRzIGNoaWxkcmVuIGFuZCBpdHMgc2libGluZ3MsIGFuZCBnZW5lcmF0ZXMgdGhlIG11dGF0ZSAmIHVwZGF0ZSBPcENvZGVzLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50Tm9kZSBUaGUgZmlyc3Qgbm9kZSB0byBwYXJzZVxuICogQHBhcmFtIGljdUNhc2UgVGhlIGRhdGEgZm9yIHRoZSBJQ1UgZXhwcmVzc2lvbiBjYXNlIHRoYXQgY29udGFpbnMgdGhvc2Ugbm9kZXNcbiAqIEBwYXJhbSBwYXJlbnRJbmRleCBJbmRleCBvZiB0aGUgY3VycmVudCBub2RlJ3MgcGFyZW50XG4gKiBAcGFyYW0gbmVzdGVkSWN1cyBEYXRhIGZvciB0aGUgbmVzdGVkIElDVSBleHByZXNzaW9ucyB0aGF0IHRoaXMgY2FzZSBjb250YWluc1xuICogQHBhcmFtIHRJY3VzIERhdGEgZm9yIGFsbCBJQ1UgZXhwcmVzc2lvbnMgb2YgdGhlIGN1cnJlbnQgbWVzc2FnZVxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4IEV4cGFuZG8gc3RhcnQgaW5kZXggZm9yIHRoZSBjdXJyZW50IElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIHBhcnNlTm9kZXMoXG4gICAgY3VycmVudE5vZGU6IE5vZGUgfCBudWxsLCBpY3VDYXNlOiBJY3VDYXNlLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sXG4gICAgdEljdXM6IFRJY3VbXSwgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcikge1xuICBpZiAoY3VycmVudE5vZGUpIHtcbiAgICBjb25zdCBuZXN0ZWRJY3VzVG9DcmVhdGU6IFtJY3VFeHByZXNzaW9uLCBudW1iZXJdW10gPSBbXTtcbiAgICB3aGlsZSAoY3VycmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IG5leHROb2RlOiBOb2RlfG51bGwgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gZXhwYW5kb1N0YXJ0SW5kZXggKyArK2ljdUNhc2UudmFycztcbiAgICAgIHN3aXRjaCAoY3VycmVudE5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgICAgICBjb25zdCBlbGVtZW50ID0gY3VycmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKCFWQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgICAgICAgLy8gVGhpcyBpc24ndCBhIHZhbGlkIGVsZW1lbnQsIHdlIHdvbid0IGNyZWF0ZSBhbiBlbGVtZW50IGZvciBpdFxuICAgICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgRUxFTUVOVF9NQVJLRVIsIHRhZ05hbWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgICBjb25zdCBlbEF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbEF0dHJzLml0ZW0oaSkgITtcbiAgICAgICAgICAgICAgY29uc3QgbG93ZXJBdHRyTmFtZSA9IGF0dHIubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISFhdHRyLnZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAgICAgLy8gd2UgYXNzdW1lIHRoZSBpbnB1dCBzdHJpbmcgaXMgc2FmZSwgdW5sZXNzIGl0J3MgdXNpbmcgYSBiaW5kaW5nXG4gICAgICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKFZBTElEX0FUVFJTLmhhc093blByb3BlcnR5KGxvd2VyQXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoVVJJX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIF9zYW5pdGl6ZVVybCksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFNSQ1NFVF9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBzYW5pdGl6ZVNyY3NldCksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBgV0FSTklORzogaWdub3JpbmcgdW5zYWZlIGF0dHJpYnV0ZSB2YWx1ZSAke2xvd2VyQXR0ck5hbWV9IG9uIGVsZW1lbnQgJHt0YWdOYW1lfSAoc2VlIGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5I3hzcylgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkF0dHIsIGF0dHIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBjaGlsZHJlbiBvZiB0aGlzIG5vZGUgKGlmIGFueSlcbiAgICAgICAgICAgIHBhcnNlTm9kZXMoXG4gICAgICAgICAgICAgICAgY3VycmVudE5vZGUuZmlyc3RDaGlsZCwgaWN1Q2FzZSwgbmV3SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHBhcmVudCBub2RlIGFmdGVyIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHZhbHVlLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModmFsdWUsIG5ld0luZGV4KSwgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY29tbWVudCBub2RlIGlzIGEgcGxhY2Vob2xkZXIgZm9yIGEgbmVzdGVkIElDVVxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gTkVTVEVEX0lDVS5leGVjKGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnKTtcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdUluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0xvY2FsID0gbmdEZXZNb2RlID8gYG5lc3RlZCBJQ1UgJHtuZXN0ZWRJY3VJbmRleH1gIDogJyc7XG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmV3TG9jYWwsIG5ld0luZGV4LFxuICAgICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzW25lc3RlZEljdUluZGV4XTtcbiAgICAgICAgICAgIG5lc3RlZEljdXNUb0NyZWF0ZS5wdXNoKFtuZXN0ZWRJY3UsIG5ld0luZGV4XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlIGRvIG5vdCBoYW5kbGUgYW55IG90aGVyIHR5cGUgb2YgY29tbWVudFxuICAgICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIFdlIGRvIG5vdCBoYW5kbGUgYW55IG90aGVyIHR5cGUgb2YgZWxlbWVudFxuICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgfVxuICAgICAgY3VycmVudE5vZGUgPSBuZXh0Tm9kZSAhO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVzdGVkSWN1c1RvQ3JlYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMF07XG4gICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMV07XG4gICAgICBpY3VTdGFydCh0SWN1cywgbmVzdGVkSWN1LCBuZXN0ZWRJY3VOb2RlSW5kZXgsIGV4cGFuZG9TdGFydEluZGV4ICsgaWN1Q2FzZS52YXJzKTtcbiAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgIGNvbnN0IG5lc3RUSWN1SW5kZXggPSB0SWN1cy5sZW5ndGggLSAxO1xuICAgICAgaWN1Q2FzZS52YXJzICs9IE1hdGgubWF4KC4uLnRJY3VzW25lc3RUSWN1SW5kZXhdLnZhcnMpO1xuICAgICAgaWN1Q2FzZS5jaGlsZEljdXMucHVzaChuZXN0VEljdUluZGV4KTtcbiAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhuZXN0ZWRJY3UpO1xuICAgICAgaWN1Q2FzZS51cGRhdGUucHVzaChcbiAgICAgICAgICB0b01hc2tCaXQobmVzdGVkSWN1Lm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAtMSAtIG5lc3RlZEljdS5tYWluQmluZGluZyxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCxcbiAgICAgICAgICBuZXN0VEljdUluZGV4LFxuICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgpO1xuICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChcbiAgICAgICAgICBuZXN0VEljdUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3UsXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgVFJBTlNMQVRJT05TOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuZXhwb3J0IGludGVyZmFjZSBJMThuTG9jYWxpemVPcHRpb25zIHsgdHJhbnNsYXRpb25zOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTsgfVxuXG4vKipcbiAqIFNldCB0aGUgY29uZmlndXJhdGlvbiBmb3IgYGkxOG5Mb2NhbGl6ZWAuXG4gKlxuICogQGRlcHJlY2F0ZWQgdGhpcyBtZXRob2QgaXMgdGVtcG9yYXJ5ICYgc2hvdWxkIG5vdCBiZSB1c2VkIGFzIGl0IHdpbGwgYmUgcmVtb3ZlZCBzb29uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuQ29uZmlndXJlTG9jYWxpemUob3B0aW9uczogSTE4bkxvY2FsaXplT3B0aW9ucyA9IHtcbiAgdHJhbnNsYXRpb25zOiB7fVxufSkge1xuICBUUkFOU0xBVElPTlMgPSBvcHRpb25zLnRyYW5zbGF0aW9ucztcbn1cblxuY29uc3QgTE9DQUxJWkVfUEhfUkVHRVhQID0gL1xce1xcJCguKj8pXFx9L2c7XG5cbi8qKlxuICogQSBnb29nLmdldE1zZy1saWtlIGZ1bmN0aW9uIGZvciB1c2VycyB0aGF0IGRvIG5vdCB1c2UgQ2xvc3VyZS5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyByZXF1aXJlZCBhcyBhICp0ZW1wb3JhcnkqIG1lYXN1cmUgdG8gcHJldmVudCBpMThuIHRlc3RzIGZyb20gYmVpbmcgYmxvY2tlZCB3aGlsZVxuICogcnVubmluZyBvdXRzaWRlIG9mIENsb3N1cmUgQ29tcGlsZXIuIFRoaXMgbWV0aG9kIHdpbGwgbm90IGJlIG5lZWRlZCBvbmNlIHJ1bnRpbWUgdHJhbnNsYXRpb25cbiAqIHNlcnZpY2Ugc3VwcG9ydCBpcyBpbnRyb2R1Y2VkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKiBAZGVwcmVjYXRlZCB0aGlzIG1ldGhvZCBpcyB0ZW1wb3JhcnkgJiBzaG91bGQgbm90IGJlIHVzZWQgYXMgaXQgd2lsbCBiZSByZW1vdmVkIHNvb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuTG9jYWxpemUoaW5wdXQ6IHN0cmluZywgcGxhY2Vob2xkZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9KSB7XG4gIGlmICh0eXBlb2YgVFJBTlNMQVRJT05TW2lucHV0XSAhPT0gJ3VuZGVmaW5lZCcpIHsgIC8vIHRvIGFjY291bnQgZm9yIGVtcHR5IHN0cmluZ1xuICAgIGlucHV0ID0gVFJBTlNMQVRJT05TW2lucHV0XTtcbiAgfVxuICByZXR1cm4gT2JqZWN0LmtleXMocGxhY2Vob2xkZXJzKS5sZW5ndGggP1xuICAgICAgaW5wdXQucmVwbGFjZShMT0NBTElaRV9QSF9SRUdFWFAsIChtYXRjaCwga2V5KSA9PiBwbGFjZWhvbGRlcnNba2V5XSB8fCAnJykgOlxuICAgICAgaW5wdXQ7XG59XG5cbi8qKlxuICogVGhlIGxvY2FsZSBpZCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBpcyBjdXJyZW50bHkgdXNpbmcgKGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucykuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0xPQ0FMRV9JRCA9ICdlbi1VUyc7XG5sZXQgTE9DQUxFX0lEID0gREVGQVVMVF9MT0NBTEVfSUQ7XG5cbi8qKlxuICogU2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbG9jYWxlSWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldExvY2FsZUlkKGxvY2FsZUlkOiBzdHJpbmcpIHtcbiAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUlkKCk6IHN0cmluZyB7XG4gIHJldHVybiBMT0NBTEVfSUQ7XG59XG4iXX0=