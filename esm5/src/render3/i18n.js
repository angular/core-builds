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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyw4QkFBOEIsQ0FBQztBQUV0QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3hILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhHLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2xFLE9BQU8sRUFBbUIsWUFBWSxFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckwsT0FBTyxFQUFhLE1BQU0sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFpRyxNQUFNLG1CQUFtQixDQUFDO0FBS2pLLE9BQU8sRUFBQyxh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QUFDO0FBQ3pDLElBQUksU0FBUyxHQUFHLGlCQUFpQixDQUFDO0FBRWxDOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsUUFBZ0I7SUFDMUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFdBQVc7SUFDekIsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2kxOG5fY2xvc3VyZV9tb2RlJztcblxuaW1wb3J0IHtnZXRQbHVyYWxDYXNlfSBmcm9tICcuLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge1NSQ1NFVF9BVFRSUywgVVJJX0FUVFJTLCBWQUxJRF9BVFRSUywgVkFMSURfRUxFTUVOVFMsIGdldFRlbXBsYXRlQ29udGVudH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtiaW5kLCBzZXREZWxheVByb2plY3Rpb24sIMm1ybVsb2FkfSBmcm9tICcuL2luc3RydWN0aW9ucy9hbGwnO1xuaW1wb3J0IHthdHRhY2hJMThuT3BDb2Rlc0RlYnVnfSBmcm9tICcuL2luc3RydWN0aW9ucy9sdmlld19kZWJ1Zyc7XG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDksIGFsbG9jRXhwYW5kbywgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsLCBlbGVtZW50UHJvcGVydHlJbnRlcm5hbCwgZ2V0T3JDcmVhdGVUTm9kZSwgc2V0SW5wdXRzRm9yUHJvcGVydHksIHRleHRCaW5kaW5nSW50ZXJuYWx9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0xDb250YWluZXIsIE5BVElWRX0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NPTU1FTlRfTUFSS0VSLCBFTEVNRU5UX01BUktFUiwgSTE4bk11dGF0ZU9wQ29kZSwgSTE4bk11dGF0ZU9wQ29kZXMsIEkxOG5VcGRhdGVPcENvZGUsIEkxOG5VcGRhdGVPcENvZGVzLCBJY3VUeXBlLCBUSTE4biwgVEljdX0gZnJvbSAnLi9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlcywgY3JlYXRlVGV4dE5vZGUsIG5hdGl2ZVJlbW92ZU5vZGV9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlLCBpc0xDb250YWluZXJ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5jb25zdCBNQVJLRVIgPSBg77+9YDtcbmNvbnN0IElDVV9CTE9DS19SRUdFWFAgPSAvXlxccyoo77+9XFxkKzo/XFxkKu+/vSlcXHMqLFxccyooc2VsZWN0fHBsdXJhbClcXHMqLC87XG5jb25zdCBTVUJURU1QTEFURV9SRUdFWFAgPSAv77+9XFwvP1xcKihcXGQrOlxcZCsp77+9L2dpO1xuY29uc3QgUEhfUkVHRVhQID0gL++/vShcXC8/WyMqIV1cXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IEJJTkRJTkdfUkVHRVhQID0gL++/vShcXGQrKTo/XFxkKu+/vS9naTtcbmNvbnN0IElDVV9SRUdFWFAgPSAvKHtcXHMq77+9XFxkKzo/XFxkKu+/vVxccyosXFxzKlxcU3s2fVxccyosW1xcc1xcU10qfSkvZ2k7XG5jb25zdCBlbnVtIFRhZ1R5cGUge1xuICBFTEVNRU5UID0gJyMnLFxuICBURU1QTEFURSA9ICcqJyxcbiAgUFJPSkVDVElPTiA9ICchJyxcbn1cblxuLy8gaTE4blBvc3Rwcm9jZXNzIGNvbnN0c1xuY29uc3QgUk9PVF9URU1QTEFURV9JRCA9IDA7XG5jb25zdCBQUF9NVUxUSV9WQUxVRV9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXS87XG5jb25zdCBQUF9QTEFDRUhPTERFUlNfUkVHRVhQID0gL1xcWyjvv70uKz/vv70/KVxcXXwo77+9XFwvP1xcKlxcZCs6XFxkK++/vSkvZztcbmNvbnN0IFBQX0lDVV9WQVJTX1JFR0VYUCA9IC8oe1xccyopKFZBUl8oUExVUkFMfFNFTEVDVCkoX1xcZCspPykoXFxzKiwpL2c7XG5jb25zdCBQUF9JQ1VTX1JFR0VYUCA9IC/vv71JMThOX0VYUF8oSUNVKF9cXGQrKT8p77+9L2c7XG5jb25zdCBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAgPSAvXFwvXFwqLztcbmNvbnN0IFBQX1RFTVBMQVRFX0lEX1JFR0VYUCA9IC9cXGQrXFw6KFxcZCspLztcblxuLy8gUGFyc2VkIHBsYWNlaG9sZGVyIHN0cnVjdHVyZSB1c2VkIGluIHBvc3Rwcm9jZXNzaW5nICh3aXRoaW4gYGkxOG5Qb3N0cHJvY2Vzc2AgZnVuY3Rpb24pXG4vLyBDb250YWlucyB0aGUgZm9sbG93aW5nIGZpZWxkczogW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdXG50eXBlIFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXIgPSBbbnVtYmVyLCBib29sZWFuLCBzdHJpbmddO1xuXG5pbnRlcmZhY2UgSWN1RXhwcmVzc2lvbiB7XG4gIHR5cGU6IEljdVR5cGU7XG4gIG1haW5CaW5kaW5nOiBudW1iZXI7XG4gIGNhc2VzOiBzdHJpbmdbXTtcbiAgdmFsdWVzOiAoc3RyaW5nfEljdUV4cHJlc3Npb24pW11bXTtcbn1cblxuaW50ZXJmYWNlIEljdUNhc2Uge1xuICAvKipcbiAgICogTnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jYXRlIGluIGV4cGFuZG8gZm9yIHRoaXMgY2FzZS5cbiAgICpcbiAgICogVGhpcyBpcyB0aGUgbWF4IG51bWJlciBvZiBET00gZWxlbWVudHMgd2hpY2ggd2lsbCBiZSBjcmVhdGVkIGJ5IHRoaXMgaTE4biArIElDVSBibG9ja3MuIFdoZW5cbiAgICogdGhlIERPTSBlbGVtZW50cyBhcmUgYmVpbmcgY3JlYXRlZCB0aGV5IGFyZSBzdG9yZWQgaW4gdGhlIEVYUEFORE8sIHNvIHRoYXQgdXBkYXRlIE9wQ29kZXMgY2FuXG4gICAqIHdyaXRlIGludG8gdGhlbS5cbiAgICovXG4gIHZhcnM6IG51bWJlcjtcblxuICAvKipcbiAgICogQW4gb3B0aW9uYWwgYXJyYXkgb2YgY2hpbGQvc3ViIElDVXMuXG4gICAqL1xuICBjaGlsZEljdXM6IG51bWJlcltdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGJ1aWxkIHVwIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1VcbiAgICovXG4gIGNyZWF0ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gZGVzdHJveSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVLlxuICAgKi9cbiAgcmVtb3ZlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byB1cGRhdGUgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVSBiaW5kaW5ncy5cbiAgICovXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXM7XG59XG5cbi8qKlxuICogQnJlYWtzIHBhdHRlcm4gaW50byBzdHJpbmdzIGFuZCB0b3AgbGV2ZWwgey4uLn0gYmxvY2tzLlxuICogQ2FuIGJlIHVzZWQgdG8gYnJlYWsgYSBtZXNzYWdlIGludG8gdGV4dCBhbmQgSUNVIGV4cHJlc3Npb25zLCBvciB0byBicmVhayBhbiBJQ1UgZXhwcmVzc2lvbiBpbnRvXG4gKiBrZXlzIGFuZCBjYXNlcy5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIChzdWIpUGF0dGVybiB0byBiZSBicm9rZW4uXG4gKlxuICovXG5mdW5jdGlvbiBleHRyYWN0UGFydHMocGF0dGVybjogc3RyaW5nKTogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10ge1xuICBpZiAoIXBhdHRlcm4pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgcHJldlBvcyA9IDA7XG4gIGNvbnN0IGJyYWNlU3RhY2sgPSBbXTtcbiAgY29uc3QgcmVzdWx0czogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10gPSBbXTtcbiAgY29uc3QgYnJhY2VzID0gL1t7fV0vZztcbiAgLy8gbGFzdEluZGV4IGRvZXNuJ3QgZ2V0IHNldCB0byAwIHNvIHdlIGhhdmUgdG8uXG4gIGJyYWNlcy5sYXN0SW5kZXggPSAwO1xuXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKG1hdGNoID0gYnJhY2VzLmV4ZWMocGF0dGVybikpIHtcbiAgICBjb25zdCBwb3MgPSBtYXRjaC5pbmRleDtcbiAgICBpZiAobWF0Y2hbMF0gPT0gJ30nKSB7XG4gICAgICBicmFjZVN0YWNrLnBvcCgpO1xuXG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBFbmQgb2YgdGhlIGJsb2NrLlxuICAgICAgICBjb25zdCBibG9jayA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIGlmIChJQ1VfQkxPQ0tfUkVHRVhQLnRlc3QoYmxvY2spKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHBhcnNlSUNVQmxvY2soYmxvY2spKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goYmxvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICAgIGJyYWNlU3RhY2sucHVzaCgneycpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MpO1xuICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogUGFyc2VzIHRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiBhbmQgcHJvZHVjZXMgYSBKU09OIG9iamVjdCBmb3IgaXQuXG4gKiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiBUZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gdGhhdCBuZWVkcyB0byBiZSBwYXJzZWQuXG4gKlxuICovXG5mdW5jdGlvbiBwYXJzZUlDVUJsb2NrKHBhdHRlcm46IHN0cmluZyk6IEljdUV4cHJlc3Npb24ge1xuICBjb25zdCBjYXNlcyA9IFtdO1xuICBjb25zdCB2YWx1ZXM6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdW10gPSBbXTtcbiAgbGV0IGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgbGV0IG1haW5CaW5kaW5nID0gMDtcbiAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShJQ1VfQkxPQ0tfUkVHRVhQLCBmdW5jdGlvbihzdHI6IHN0cmluZywgYmluZGluZzogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICAgIH1cbiAgICBtYWluQmluZGluZyA9IHBhcnNlSW50KGJpbmRpbmcuc3Vic3RyKDEpLCAxMCk7XG4gICAgcmV0dXJuICcnO1xuICB9KTtcblxuICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyhwYXR0ZXJuKSBhcyBzdHJpbmdbXTtcbiAgLy8gTG9va2luZyBmb3IgKGtleSBibG9jaykrIHNlcXVlbmNlLiBPbmUgb2YgdGhlIGtleXMgaGFzIHRvIGJlIFwib3RoZXJcIi5cbiAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgcGFydHMubGVuZ3RoOykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1twb3MrK10udHJpbSgpO1xuICAgIGlmIChpY3VUeXBlID09PSBJY3VUeXBlLnBsdXJhbCkge1xuICAgICAgLy8gS2V5IGNhbiBiZSBcIj14XCIsIHdlIGp1c3Qgd2FudCBcInhcIlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccyooPzo9KT8oXFx3KylcXHMqLywgJyQxJyk7XG4gICAgfVxuICAgIGlmIChrZXkubGVuZ3RoKSB7XG4gICAgICBjYXNlcy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gZXh0cmFjdFBhcnRzKHBhcnRzW3BvcysrXSkgYXMgc3RyaW5nW107XG4gICAgaWYgKGNhc2VzLmxlbmd0aCA+IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHZhbHVlcy5wdXNoKGJsb2Nrcyk7XG4gICAgfVxuICB9XG5cbiAgYXNzZXJ0R3JlYXRlclRoYW4oY2FzZXMuaW5kZXhPZignb3RoZXInKSwgLTEsICdNaXNzaW5nIGtleSBcIm90aGVyXCIgaW4gSUNVIHN0YXRlbWVudC4nKTtcbiAgLy8gVE9ETyhvY29tYmUpOiBzdXBwb3J0IElDVSBleHByZXNzaW9ucyBpbiBhdHRyaWJ1dGVzLCBzZWUgIzIxNjE1XG4gIHJldHVybiB7dHlwZTogaWN1VHlwZSwgbWFpbkJpbmRpbmc6IG1haW5CaW5kaW5nLCBjYXNlcywgdmFsdWVzfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSBzdWItdGVtcGxhdGVzIG9mIGEgbWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBtYXRjaDtcbiAgbGV0IHJlcyA9ICcnO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICBsZXQgdGFnTWF0Y2hlZDtcblxuICB3aGlsZSAoKG1hdGNoID0gU1VCVEVNUExBVEVfUkVHRVhQLmV4ZWMobWVzc2FnZSkpICE9PSBudWxsKSB7XG4gICAgaWYgKCFpblRlbXBsYXRlKSB7XG4gICAgICByZXMgKz0gbWVzc2FnZS5zdWJzdHJpbmcoaW5kZXgsIG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIHRhZ01hdGNoZWQgPSBtYXRjaFsxXTtcbiAgICAgIGluVGVtcGxhdGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWF0Y2hbMF0gPT09IGAke01BUktFUn0vKiR7dGFnTWF0Y2hlZH0ke01BUktFUn1gKSB7XG4gICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXg7XG4gICAgICAgIGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGluVGVtcGxhdGUsIGZhbHNlLFxuICAgICAgICAgIGBUYWcgbWlzbWF0Y2g6IHVuYWJsZSB0byBmaW5kIHRoZSBlbmQgb2YgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB0aGUgdHJhbnNsYXRpb24gXCIke21lc3NhZ2V9XCJgKTtcblxuICByZXMgKz0gbWVzc2FnZS5zdWJzdHIoaW5kZXgpO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIGEgcGFydCBvZiBhIG1lc3NhZ2UgYW5kIHJlbW92ZXMgdGhlIHJlc3QuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCBmb3IgZXh0cmFjdGluZyBhIHBhcnQgb2YgdGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIGEgdGVtcGxhdGUuIEEgdHJhbnNsYXRlZFxuICogbWVzc2FnZSBjYW4gc3BhbiBtdWx0aXBsZSB0ZW1wbGF0ZXMuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogPGRpdiBpMThuPlRyYW5zbGF0ZSA8c3BhbiAqbmdJZj5tZTwvc3Bhbj4hPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBjcm9wXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBJbmRleCBvZiB0aGUgc3ViLXRlbXBsYXRlIHRvIGV4dHJhY3QuIElmIHVuZGVmaW5lZCBpdCByZXR1cm5zIHRoZVxuICogZXh0ZXJuYWwgdGVtcGxhdGUgYW5kIHJlbW92ZXMgYWxsIHN1Yi10ZW1wbGF0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcikge1xuICBpZiAodHlwZW9mIHN1YlRlbXBsYXRlSW5kZXggIT09ICdudW1iZXInKSB7XG4gICAgLy8gV2Ugd2FudCB0aGUgcm9vdCB0ZW1wbGF0ZSBtZXNzYWdlLCBpZ25vcmUgYWxsIHN1Yi10ZW1wbGF0ZXNcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdlIHdhbnQgYSBzcGVjaWZpYyBzdWItdGVtcGxhdGVcbiAgICBjb25zdCBzdGFydCA9XG4gICAgICAgIG1lc3NhZ2UuaW5kZXhPZihgOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSArIDIgKyBzdWJUZW1wbGF0ZUluZGV4LnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgIGNvbnN0IGVuZCA9IG1lc3NhZ2Uuc2VhcmNoKG5ldyBSZWdFeHAoYCR7TUFSS0VSfVxcXFwvXFxcXCpcXFxcZCs6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApKTtcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIHRvIHVwZGF0ZSB0aGUgYmluZGluZ3Mgb2YgYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJpbmRpbmdzLlxuICogQHBhcmFtIGRlc3RpbmF0aW9uTm9kZSBJbmRleCBvZiB0aGUgZGVzdGluYXRpb24gbm9kZSB3aGljaCB3aWxsIHJlY2VpdmUgdGhlIGJpbmRpbmcuXG4gKiBAcGFyYW0gYXR0ck5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLCBpZiB0aGUgc3RyaW5nIGJlbG9uZ3MgdG8gYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHNhbml0aXplRm4gU2FuaXRpemF0aW9uIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHN0cmluZyBhZnRlciB1cGRhdGUsIGlmIG5lY2Vzc2FyeS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICBzdHI6IHN0cmluZywgZGVzdGluYXRpb25Ob2RlOiBudW1iZXIsIGF0dHJOYW1lPzogc3RyaW5nLFxuICAgIHNhbml0aXplRm46IFNhbml0aXplckZuIHwgbnVsbCA9IG51bGwpOiBJMThuVXBkYXRlT3BDb2RlcyB7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW251bGwsIG51bGxdOyAgLy8gQWxsb2Mgc3BhY2UgZm9yIG1hc2sgYW5kIHNpemVcbiAgY29uc3QgdGV4dFBhcnRzID0gc3RyLnNwbGl0KEJJTkRJTkdfUkVHRVhQKTtcbiAgbGV0IG1hc2sgPSAwO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgdGV4dFBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgY29uc3QgdGV4dFZhbHVlID0gdGV4dFBhcnRzW2pdO1xuXG4gICAgaWYgKGogJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IHBhcnNlSW50KHRleHRWYWx1ZSwgMTApO1xuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKC0xIC0gYmluZGluZ0luZGV4KTtcbiAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIGlmICh0ZXh0VmFsdWUgIT09ICcnKSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHRcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCh0ZXh0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgIGRlc3RpbmF0aW9uTm9kZSA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8XG4gICAgICAoYXR0ck5hbWUgPyBJMThuVXBkYXRlT3BDb2RlLkF0dHIgOiBJMThuVXBkYXRlT3BDb2RlLlRleHQpKTtcbiAgaWYgKGF0dHJOYW1lKSB7XG4gICAgdXBkYXRlT3BDb2Rlcy5wdXNoKGF0dHJOYW1lLCBzYW5pdGl6ZUZuKTtcbiAgfVxuICB1cGRhdGVPcENvZGVzWzBdID0gbWFzaztcbiAgdXBkYXRlT3BDb2Rlc1sxXSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gMjtcbiAgcmV0dXJuIHVwZGF0ZU9wQ29kZXM7XG59XG5cbmZ1bmN0aW9uIGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIG1hc2sgPSAwKTogbnVtYmVyIHtcbiAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyk7XG4gIGxldCBtYXRjaDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpY3VFeHByZXNzaW9uLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlQXJyID0gaWN1RXhwcmVzc2lvbi52YWx1ZXNbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdoaWxlIChtYXRjaCA9IEJJTkRJTkdfUkVHRVhQLmV4ZWModmFsdWUpKSB7XG4gICAgICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQocGFyc2VJbnQobWF0Y2hbMV0sIDEwKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hc2sgPSBnZXRCaW5kaW5nTWFzayh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uLCBtYXNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hc2s7XG59XG5cbmNvbnN0IGkxOG5JbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xubGV0IGkxOG5JbmRleFN0YWNrUG9pbnRlciA9IC0xO1xuXG4vKipcbiAqIENvbnZlcnQgYmluZGluZyBpbmRleCB0byBtYXNrIGJpdC5cbiAqXG4gKiBFYWNoIGluZGV4IHJlcHJlc2VudHMgYSBzaW5nbGUgYml0IG9uIHRoZSBiaXQtbWFzay4gQmVjYXVzZSBiaXQtbWFzayBvbmx5IGhhcyAzMiBiaXRzLCB3ZSBtYWtlXG4gKiB0aGUgMzJuZCBiaXQgc2hhcmUgYWxsIG1hc2tzIGZvciBhbGwgYmluZGluZ3MgaGlnaGVyIHRoYW4gMzIuIFNpbmNlIGl0IGlzIGV4dHJlbWVseSByYXJlIHRvIGhhdmVcbiAqIG1vcmUgdGhhbiAzMiBiaW5kaW5ncyB0aGlzIHdpbGwgYmUgaGl0IHZlcnkgcmFyZWx5LiBUaGUgZG93bnNpZGUgb2YgaGl0dGluZyB0aGlzIGNvcm5lciBjYXNlIGlzXG4gKiB0aGF0IHdlIHdpbGwgZXhlY3V0ZSBiaW5kaW5nIGNvZGUgbW9yZSBvZnRlbiB0aGFuIG5lY2Vzc2FyeS4gKHBlbmFsdHkgb2YgcGVyZm9ybWFuY2UpXG4gKi9cbmZ1bmN0aW9uIHRvTWFza0JpdChiaW5kaW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IE1hdGgubWluKGJpbmRpbmdJbmRleCwgMzEpO1xufVxuXG5jb25zdCBwYXJlbnRJbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIE1hcmtzIGEgYmxvY2sgb2YgdGV4dCBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgIG1hcmsgdGhlIHRyYW5zbGF0aW9uIGJsb2NrIGluIHRoZSB0ZW1wbGF0ZS5cbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9IXtpbmRleH0oOntibG9ja30p77+9YC9g77+9LyF7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpQcm9qZWN0aW9uIFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZVxuICogICBiZWdpbm5pbmcgYW5kIGVuZCBvZiA8bmctY29udGVudD4gdGhhdCB3YXMgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLlxuICogICBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuXG4gKiAgIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuU3RhcnQoaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkluZGV4U3RhY2tbKytpMThuSW5kZXhTdGFja1BvaW50ZXJdID0gaW5kZXg7XG4gIC8vIFdlIG5lZWQgdG8gZGVsYXkgcHJvamVjdGlvbnMgdW50aWwgYGkxOG5FbmRgXG4gIHNldERlbGF5UHJvamVjdGlvbih0cnVlKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIGkxOG5TdGFydEZpcnN0UGFzcyh0VmlldywgaW5kZXgsIG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICB9XG59XG5cbi8vIENvdW50IGZvciB0aGUgbnVtYmVyIG9mIHZhcnMgdGhhdCB3aWxsIGJlIGFsbG9jYXRlZCBmb3IgZWFjaCBpMThuIGJsb2NrLlxuLy8gSXQgaXMgZ2xvYmFsIGJlY2F1c2UgdGhpcyBpcyB1c2VkIGluIG11bHRpcGxlIGZ1bmN0aW9ucyB0aGF0IGluY2x1ZGUgbG9vcHMgYW5kIHJlY3Vyc2l2ZSBjYWxscy5cbi8vIFRoaXMgaXMgcmVzZXQgdG8gMCB3aGVuIGBpMThuU3RhcnRGaXJzdFBhc3NgIGlzIGNhbGxlZC5cbmxldCBpMThuVmFyc0NvdW50OiBudW1iZXI7XG5cbi8qKlxuICogU2VlIGBpMThuU3RhcnRgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuU3RhcnRGaXJzdFBhc3MoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdGFydEluZGV4ID0gdFZpZXcuYmx1ZXByaW50Lmxlbmd0aCAtIEhFQURFUl9PRkZTRVQ7XG4gIGkxOG5WYXJzQ291bnQgPSAwO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcGFyZW50VE5vZGUgPSBnZXRJc1BhcmVudCgpID8gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4ID1cbiAgICAgIHBhcmVudFROb2RlICYmIHBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtUX0hPU1RdID8gcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUIDogaW5kZXg7XG4gIGxldCBwYXJlbnRJbmRleFBvaW50ZXIgPSAwO1xuICBwYXJlbnRJbmRleFN0YWNrW3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleDtcbiAgY29uc3QgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMgPSBbXTtcbiAgLy8gSWYgdGhlIHByZXZpb3VzIG5vZGUgd2Fzbid0IHRoZSBkaXJlY3QgcGFyZW50IHRoZW4gd2UgaGF2ZSBhIHRyYW5zbGF0aW9uIHdpdGhvdXQgdG9wIGxldmVsXG4gIC8vIGVsZW1lbnQgYW5kIHdlIG5lZWQgdG8ga2VlcCBhIHJlZmVyZW5jZSBvZiB0aGUgcHJldmlvdXMgZWxlbWVudCBpZiB0aGVyZSBpcyBvbmVcbiAgaWYgKGluZGV4ID4gMCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUgIT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gQ3JlYXRlIGFuIE9wQ29kZSB0byBzZWxlY3QgdGhlIHByZXZpb3VzIFROb2RlXG4gICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCk7XG4gIH1cbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXTtcbiAgY29uc3QgaWN1RXhwcmVzc2lvbnM6IFRJY3VbXSA9IFtdO1xuXG4gIGNvbnN0IHRlbXBsYXRlVHJhbnNsYXRpb24gPSBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICBjb25zdCBtc2dQYXJ0cyA9IHRlbXBsYXRlVHJhbnNsYXRpb24uc3BsaXQoUEhfUkVHRVhQKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtc2dQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZSA9IG1zZ1BhcnRzW2ldO1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVycyAoZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMpXG4gICAgICBpZiAodmFsdWUuY2hhckF0KDApID09PSAnLycpIHtcbiAgICAgICAgLy8gSXQgaXMgYSBjbG9zaW5nIHRhZ1xuICAgICAgICBpZiAodmFsdWUuY2hhckF0KDEpID09PSBUYWdUeXBlLkVMRU1FTlQpIHtcbiAgICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDIpLCAxMCk7XG4gICAgICAgICAgcGFyZW50SW5kZXggPSBwYXJlbnRJbmRleFN0YWNrWy0tcGFyZW50SW5kZXhQb2ludGVyXTtcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2gocGhJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBoSW5kZXggPSBwYXJzZUludCh2YWx1ZS5zdWJzdHIoMSksIDEwKTtcbiAgICAgICAgLy8gVGhlIHZhbHVlIHJlcHJlc2VudHMgYSBwbGFjZWhvbGRlciB0aGF0IHdlIG1vdmUgdG8gdGhlIGRlc2lnbmF0ZWQgaW5kZXhcbiAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgcGhJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0LFxuICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICBpZiAodmFsdWUuY2hhckF0KDApID09PSBUYWdUeXBlLkVMRU1FTlQpIHtcbiAgICAgICAgICBwYXJlbnRJbmRleFN0YWNrWysrcGFyZW50SW5kZXhQb2ludGVyXSA9IHBhcmVudEluZGV4ID0gcGhJbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncyAmIElDVSBleHByZXNzaW9ucylcbiAgICAgIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHZhbHVlKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKGogJiAxKSB7XG4gICAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1Tm9kZUluZGV4ID0gc3RhcnRJbmRleCArIGkxOG5WYXJzQ291bnQrKztcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZ0Rldk1vZGUgPyBgSUNVICR7aWN1Tm9kZUluZGV4fWAgOiAnJywgaWN1Tm9kZUluZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgLy8gVXBkYXRlIGNvZGVzIGZvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBjb25zdCBpY3VFeHByZXNzaW9uID0gcGFydHNbal0gYXMgSWN1RXhwcmVzc2lvbjtcbiAgICAgICAgICBjb25zdCBtYXNrID0gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbik7XG4gICAgICAgICAgaWN1U3RhcnQoaWN1RXhwcmVzc2lvbnMsIGljdUV4cHJlc3Npb24sIGljdU5vZGVJbmRleCwgaWN1Tm9kZUluZGV4KTtcbiAgICAgICAgICAvLyBTaW5jZSB0aGlzIGlzIHJlY3Vyc2l2ZSwgdGhlIGxhc3QgVEljdSB0aGF0IHdhcyBwdXNoZWQgaXMgdGhlIG9uZSB3ZSB3YW50XG4gICAgICAgICAgY29uc3QgdEljdUluZGV4ID0gaWN1RXhwcmVzc2lvbnMubGVuZ3RoIC0gMTtcbiAgICAgICAgICB1cGRhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgICAgICAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgICAgICAtMSAtIGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcsXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLCB0SWN1SW5kZXgsXG4gICAgICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgICAyLCAgICAgLy8gc2tpcCAyIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsIHRJY3VJbmRleCk7XG4gICAgICAgIH0gZWxzZSBpZiAocGFydHNbal0gIT09ICcnKSB7XG4gICAgICAgICAgY29uc3QgdGV4dCA9IHBhcnRzW2pdIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncylcbiAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdGV4dC5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgLy8gQ3JlYXRlIHRleHQgbm9kZXNcbiAgICAgICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gc3RhcnRJbmRleCArIGkxOG5WYXJzQ291bnQrKztcbiAgICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgYmluZGluZywgdGhlIHZhbHVlIHdpbGwgYmUgc2V0IGR1cmluZyB1cGRhdGVcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdGV4dCwgdGV4dE5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModGV4dCwgdGV4dE5vZGVJbmRleCksIHVwZGF0ZU9wQ29kZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFsbG9jRXhwYW5kbyh2aWV3RGF0YSwgaTE4blZhcnNDb3VudCk7XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXMsIGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCwgdmlld0RhdGEpO1xuXG4gIC8vIE5PVEU6IGxvY2FsIHZhciBuZWVkZWQgdG8gcHJvcGVybHkgYXNzZXJ0IHRoZSB0eXBlIG9mIGBUSTE4bmAuXG4gIGNvbnN0IHRJMThuOiBUSTE4biA9IHtcbiAgICB2YXJzOiBpMThuVmFyc0NvdW50LFxuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgaWN1czogaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLFxuICB9O1xuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHRJMThuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIHBhcmVudFROb2RlOiBUTm9kZSwgcHJldmlvdXNUTm9kZTogVE5vZGUgfCBudWxsLCB2aWV3RGF0YTogTFZpZXcpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICBjb25zdCBuZXh0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIGlmICghcHJldmlvdXNUTm9kZSkge1xuICAgIHByZXZpb3VzVE5vZGUgPSBwYXJlbnRUTm9kZTtcbiAgfVxuXG4gIC8vIFJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBpZiAocHJldmlvdXNUTm9kZSA9PT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHBhcmVudFROb2RlLmNoaWxkKSB7XG4gICAgdE5vZGUubmV4dCA9IHBhcmVudFROb2RlLmNoaWxkO1xuICAgIHBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gIH0gZWxzZSBpZiAocHJldmlvdXNUTm9kZSAhPT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHByZXZpb3VzVE5vZGUubmV4dCkge1xuICAgIHROb2RlLm5leHQgPSBwcmV2aW91c1ROb2RlLm5leHQ7XG4gICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICBpZiAocGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW1RfSE9TVF0pIHtcbiAgICB0Tm9kZS5wYXJlbnQgPSBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGU7XG4gIH1cblxuICAvLyBJZiB0Tm9kZSB3YXMgbW92ZWQgYXJvdW5kLCB3ZSBtaWdodCBuZWVkIHRvIGZpeCBhIGJyb2tlbiBsaW5rLlxuICBsZXQgY3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGUubmV4dDtcbiAgd2hpbGUgKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3IubmV4dCA9PT0gdE5vZGUpIHtcbiAgICAgIGN1cnNvci5uZXh0ID0gbmV4dE5vZGU7XG4gICAgfVxuICAgIGN1cnNvciA9IGN1cnNvci5uZXh0O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBsYWNlaG9sZGVyIHRvIGFwcGVuZCBpcyBhIHByb2plY3Rpb24sIHdlIG5lZWQgdG8gbW92ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGluc3RlYWRcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgY29uc3QgdFByb2plY3Rpb25Ob2RlID0gdE5vZGUgYXMgVFByb2plY3Rpb25Ob2RlO1xuICAgIGFwcGVuZFByb2plY3RlZE5vZGVzKFxuICAgICAgICB2aWV3RGF0YSwgdFByb2plY3Rpb25Ob2RlLCB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiwgZmluZENvbXBvbmVudFZpZXcodmlld0RhdGEpKTtcbiAgICByZXR1cm4gdE5vZGU7XG4gIH1cblxuICBhcHBlbmRDaGlsZChnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3RGF0YSksIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gdmlld0RhdGFbdE5vZGUuaW5kZXhdO1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBpc0xDb250YWluZXIoc2xvdFZhbHVlKSkge1xuICAgIC8vIE5vZGVzIHRoYXQgaW5qZWN0IFZpZXdDb250YWluZXJSZWYgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gICAgYXBwZW5kQ2hpbGQoc2xvdFZhbHVlW05BVElWRV0sIHROb2RlLCB2aWV3RGF0YSk7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGZvciBpbnRlcm5hdGlvbmFsaXphdGlvbi5cbiAqXG4gKiBIYW5kbGVzIG1lc3NhZ2Ugc3RyaW5nIHBvc3QtcHJvY2Vzc2luZyBieSB0cmFuc2Zvcm1pbmcgaXQgZnJvbSBpbnRlcm1lZGlhdGVcbiAqIGZvcm1hdCAodGhhdCBtaWdodCBjb250YWluIHNvbWUgbWFya2VycyB0aGF0IHdlIG5lZWQgdG8gcmVwbGFjZSkgdG8gdGhlIGZpbmFsXG4gKiBmb3JtLCBjb25zdW1hYmxlIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvbi4gUG9zdCBwcm9jZXNzaW5nIHN0ZXBzIGluY2x1ZGU6XG4gKlxuICogMS4gUmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgY2FzZXMgKGxpa2UgW++/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71877+9Ne+/vV0pXG4gKiAyLiBSZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAqIDMuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blBvc3Rwcm9jZXNzKFxuICAgIG1lc3NhZ2U6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7W2tleTogc3RyaW5nXTogKHN0cmluZyB8IHN0cmluZ1tdKX0gPSB7fSk6IHN0cmluZyB7XG4gIC8qKlxuICAgKiBTdGVwIDE6IHJlc29sdmUgYWxsIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBsaWtlIFvvv70jNe+/vXzvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9XVxuICAgKlxuICAgKiBOb3RlOiBkdWUgdG8gdGhlIHdheSB3ZSBwcm9jZXNzIG5lc3RlZCB0ZW1wbGF0ZXMgKEJGUyksIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBhcmUgdHlwaWNhbGx5XG4gICAqIGdyb3VwZWQgYnkgdGVtcGxhdGVzLCBmb3IgZXhhbXBsZTogW++/vSM177+9fO+/vSM277+9fO+/vSMxOjHvv71877+9IzM6Mu+/vV0gd2hlcmUg77+9IzXvv70gYW5kIO+/vSM277+9IGJlbG9uZyB0byByb290XG4gICAqIHRlbXBsYXRlLCDvv70jMTox77+9IGJlbG9uZyB0byBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleCAxIGFuZCDvv70jMToy77+9IC0gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXhcbiAgICogMy4gSG93ZXZlciBpbiByZWFsIHRlbXBsYXRlcyB0aGUgb3JkZXIgbWlnaHQgYmUgZGlmZmVyZW50OiBpLmUuIO+/vSMxOjHvv70gYW5kL29yIO+/vSMzOjLvv70gbWF5IGdvIGluXG4gICAqIGZyb250IG9mIO+/vSM277+9LiBUaGUgcG9zdCBwcm9jZXNzaW5nIHN0ZXAgcmVzdG9yZXMgdGhlIHJpZ2h0IG9yZGVyIGJ5IGtlZXBpbmcgdHJhY2sgb2YgdGhlXG4gICAqIHRlbXBsYXRlIGlkIHN0YWNrIGFuZCBsb29rcyBmb3IgcGxhY2Vob2xkZXJzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlbXBsYXRlLlxuICAgKi9cbiAgbGV0IHJlc3VsdDogc3RyaW5nID0gbWVzc2FnZTtcbiAgaWYgKFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAudGVzdChtZXNzYWdlKSkge1xuICAgIGNvbnN0IG1hdGNoZXM6IHtba2V5OiBzdHJpbmddOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW119ID0ge307XG4gICAgY29uc3QgdGVtcGxhdGVJZHNTdGFjazogbnVtYmVyW10gPSBbUk9PVF9URU1QTEFURV9JRF07XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfUExBQ0VIT0xERVJTX1JFR0VYUCwgKG06IGFueSwgcGhzOiBzdHJpbmcsIHRtcGw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcGhzIHx8IHRtcGw7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlcnM6IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXSA9IG1hdGNoZXNbY29udGVudF0gfHwgW107XG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgY29udGVudC5zcGxpdCgnfCcpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHBsYWNlaG9sZGVyLm1hdGNoKFBQX1RFTVBMQVRFX0lEX1JFR0VYUCk7XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVJZCA9IG1hdGNoID8gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSA6IFJPT1RfVEVNUExBVEVfSUQ7XG4gICAgICAgICAgY29uc3QgaXNDbG9zZVRlbXBsYXRlVGFnID0gUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQLnRlc3QocGxhY2Vob2xkZXIpO1xuICAgICAgICAgIHBsYWNlaG9sZGVycy5wdXNoKFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVzW2NvbnRlbnRdID0gcGxhY2Vob2xkZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgcGxhY2Vob2xkZXIgLSAke2NvbnRlbnR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZUlkID0gdGVtcGxhdGVJZHNTdGFja1t0ZW1wbGF0ZUlkc1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGlkeCA9IDA7XG4gICAgICAvLyBmaW5kIHBsYWNlaG9sZGVyIGluZGV4IHRoYXQgbWF0Y2hlcyBjdXJyZW50IHRlbXBsYXRlIGlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYWNlaG9sZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGxhY2Vob2xkZXJzW2ldWzBdID09PSBjdXJyZW50VGVtcGxhdGVJZCkge1xuICAgICAgICAgIGlkeCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHVwZGF0ZSB0ZW1wbGF0ZSBpZCBzdGFjayBiYXNlZCBvbiB0aGUgY3VycmVudCB0YWcgZXh0cmFjdGVkXG4gICAgICBjb25zdCBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0gPSBwbGFjZWhvbGRlcnNbaWR4XTtcbiAgICAgIGlmIChpc0Nsb3NlVGVtcGxhdGVUYWcpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wb3AoKTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRlbXBsYXRlSWQgIT09IHRlbXBsYXRlSWQpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgfVxuICAgICAgLy8gcmVtb3ZlIHByb2Nlc3NlZCB0YWcgZnJvbSB0aGUgbGlzdFxuICAgICAgcGxhY2Vob2xkZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gcmV0dXJuIGN1cnJlbnQgcmVzdWx0IGlmIG5vIHJlcGxhY2VtZW50cyBzcGVjaWZpZWRcbiAgaWYgKCFPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogU3RlcCAyOiByZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9WQVJTX1JFR0VYUCwgKG1hdGNoLCBzdGFydCwga2V5LCBfdHlwZSwgX2lkeCwgZW5kKTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyBgJHtzdGFydH0ke3JlcGxhY2VtZW50c1trZXldfSR7ZW5kfWAgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgMzogcmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KSBpbiBjYXNlXG4gICAqIG11bHRpcGxlIElDVXMgaGF2ZSB0aGUgc2FtZSBwbGFjZWhvbGRlciBuYW1lXG4gICAqL1xuICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9JQ1VTX1JFR0VYUCwgKG1hdGNoLCBrZXkpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChyZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgY29uc3QgbGlzdCA9IHJlcGxhY2VtZW50c1trZXldIGFzIHN0cmluZ1tdO1xuICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBJQ1UgLSAke21hdGNofSB3aXRoIGtleTogJHtrZXl9YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGlzdC5zaGlmdCgpICE7XG4gICAgfVxuICAgIHJldHVybiBtYXRjaDtcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBUcmFuc2xhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgbWFya2VkIGJ5IGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAuIEl0IGluc2VydHMgdGhlIHRleHQvSUNVIG5vZGVzXG4gKiBpbnRvIHRoZSByZW5kZXIgdHJlZSwgbW92ZXMgdGhlIHBsYWNlaG9sZGVyIG5vZGVzIGFuZCByZW1vdmVzIHRoZSBkZWxldGVkIG5vZGVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkVuZCgpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuRW5kRmlyc3RQYXNzKHRWaWV3KTtcbiAgLy8gU3RvcCBkZWxheWluZyBwcm9qZWN0aW9uc1xuICBzZXREZWxheVByb2plY3Rpb24oZmFsc2UpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkVuZGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5FbmRGaXJzdFBhc3ModFZpZXc6IFRWaWV3KSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2aWV3RGF0YVtUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2kxOG5FbmQgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcblxuICBjb25zdCByb290SW5kZXggPSBpMThuSW5kZXhTdGFja1tpMThuSW5kZXhTdGFja1BvaW50ZXItLV07XG4gIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtyb290SW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUSTE4bjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEkxOG4sIGBZb3Ugc2hvdWxkIGNhbGwgaTE4blN0YXJ0IGJlZm9yZSBpMThuRW5kYCk7XG5cbiAgLy8gRmluZCB0aGUgbGFzdCBub2RlIHRoYXQgd2FzIGFkZGVkIGJlZm9yZSBgaTE4bkVuZGBcbiAgbGV0IGxhc3RDcmVhdGVkTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuXG4gIC8vIFJlYWQgdGhlIGluc3RydWN0aW9ucyB0byBpbnNlcnQvbW92ZS9yZW1vdmUgRE9NIGVsZW1lbnRzXG4gIGNvbnN0IHZpc2l0ZWROb2RlcyA9IHJlYWRDcmVhdGVPcENvZGVzKHJvb3RJbmRleCwgdEkxOG4uY3JlYXRlLCB0STE4bi5pY3VzLCB2aWV3RGF0YSk7XG5cbiAgLy8gUmVtb3ZlIGRlbGV0ZWQgbm9kZXNcbiAgZm9yIChsZXQgaSA9IHJvb3RJbmRleCArIDE7IGkgPD0gbGFzdENyZWF0ZWROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDsgaSsrKSB7XG4gICAgaWYgKHZpc2l0ZWROb2Rlcy5pbmRleE9mKGkpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZShpLCB2aWV3RGF0YSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgc3RvcmVzIHRoZSBkeW5hbWljIFROb2RlLCBhbmQgdW5ob29rcyBpdCBmcm9tIHRoZSB0cmVlIGZvciBub3cuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsKTogVEVsZW1lbnROb2RlfFRJY3VDb250YWluZXJOb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IG5hdGl2ZTtcbiAgY29uc3QgdE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIHR5cGUgYXMgYW55LCBuYW1lLCBudWxsKTtcblxuICAvLyBXZSBhcmUgY3JlYXRpbmcgYSBkeW5hbWljIG5vZGUsIHRoZSBwcmV2aW91cyB0Tm9kZSBtaWdodCBub3QgYmUgcG9pbnRpbmcgYXQgdGhpcyBub2RlLlxuICAvLyBXZSB3aWxsIGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUgbGF0ZXIgd2l0aCBgYXBwZW5kSTE4bk5vZGVgLlxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPT09IHROb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5mdW5jdGlvbiByZWFkQ3JlYXRlT3BDb2RlcyhcbiAgICBpbmRleDogbnVtYmVyLCBjcmVhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCxcbiAgICB2aWV3RGF0YTogTFZpZXcpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGxldCBjdXJyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgcHJldmlvdXNUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHZpc2l0ZWROb2RlczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjcmVhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgb3BDb2RlID0gY3JlYXRlT3BDb2Rlc1tpXTtcbiAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUob3BDb2RlLCByZW5kZXJlcik7XG4gICAgICBjb25zdCB0ZXh0Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIGN1cnJlbnRUTm9kZSA9XG4gICAgICAgICAgY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KHZpZXdEYXRhLCB0ZXh0Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dFJOb2RlLCBudWxsKTtcbiAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKHRleHROb2RlSW5kZXgpO1xuICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQ6XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb25Ob2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UO1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvblROb2RlOiBUTm9kZTtcbiAgICAgICAgICBpZiAoZGVzdGluYXRpb25Ob2RlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZGVzdGluYXRpb24gbm9kZSBpcyBgaTE4blN0YXJ0YCwgd2UgZG9uJ3QgaGF2ZSBhXG4gICAgICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZSBhbmQgd2Ugc2hvdWxkIHVzZSB0aGUgaG9zdCBub2RlIGluc3RlYWRcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSB2aWV3RGF0YVtUX0hPU1RdICE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uVE5vZGUgPSBnZXRUTm9kZShkZXN0aW5hdGlvbk5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRUTm9kZSAhLFxuICAgICAgICAgICAgICAgICAgYFlvdSBuZWVkIHRvIGNyZWF0ZSBvciBzZWxlY3QgYSBub2RlIGJlZm9yZSB5b3UgY2FuIGluc2VydCBpdCBpbnRvIHRoZSBET01gKTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gYXBwZW5kSTE4bk5vZGUoY3VycmVudFROb2RlICEsIGRlc3RpbmF0aW9uVE5vZGUsIHByZXZpb3VzVE5vZGUsIHZpZXdEYXRhKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdDpcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKG5vZGVJbmRleCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICBpZiAoY3VycmVudFROb2RlKSB7XG4gICAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlLCBjdXJyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQ6XG4gICAgICAgICAgY29uc3QgZWxlbWVudEluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgYXR0clZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICAvLyBUaGlzIGNvZGUgaXMgdXNlZCBmb3IgSUNVIGV4cHJlc3Npb25zIG9ubHksIHNpbmNlIHdlIGRvbid0IHN1cHBvcnRcbiAgICAgICAgICAvLyBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaW4gSUNVcywgd2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBpbnB1dHMgaGVyZVxuICAgICAgICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChlbGVtZW50Tm9kZUluZGV4LCBhdHRyTmFtZSwgYXR0clZhbHVlLCB2aWV3RGF0YSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChvcENvZGUpIHtcbiAgICAgICAgY2FzZSBDT01NRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCBjb21tZW50VmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjb21tZW50VmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHtjb21tZW50VmFsdWV9XCIgdG8gYmUgYSBjb21tZW50IG5vZGUgdmFsdWVgKTtcbiAgICAgICAgICBjb25zdCBjb21tZW50Uk5vZGUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KGNvbW1lbnRWYWx1ZSk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgdmlld0RhdGEsIGNvbW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5JY3VDb250YWluZXIsIGNvbW1lbnRSTm9kZSwgbnVsbCk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goY29tbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYXR0YWNoUGF0Y2hEYXRhKGNvbW1lbnRSTm9kZSwgdmlld0RhdGEpO1xuICAgICAgICAgIChjdXJyZW50VE5vZGUgYXMgVEljdUNvbnRhaW5lck5vZGUpLmFjdGl2ZUNhc2VJbmRleCA9IG51bGw7XG4gICAgICAgICAgLy8gV2Ugd2lsbCBhZGQgdGhlIGNhc2Ugbm9kZXMgbGF0ZXIsIGR1cmluZyB0aGUgdXBkYXRlIHBoYXNlXG4gICAgICAgICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFTEVNRU5UX01BUktFUjpcbiAgICAgICAgICBjb25zdCB0YWdOYW1lVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0YWdOYW1lVmFsdWUsICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgYEV4cGVjdGVkIFwiJHt0YWdOYW1lVmFsdWV9XCIgdG8gYmUgYW4gZWxlbWVudCBub2RlIHRhZyBuYW1lYCk7XG4gICAgICAgICAgY29uc3QgZWxlbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudCh0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIHZpZXdEYXRhLCBlbGVtZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgZWxlbWVudFJOb2RlLCB0YWdOYW1lVmFsdWUpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGVsZW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0SXNOb3RQYXJlbnQoKTtcblxuICByZXR1cm4gdmlzaXRlZE5vZGVzO1xufVxuXG5mdW5jdGlvbiByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcywgaWN1czogVEljdVtdIHwgbnVsbCwgYmluZGluZ3NTdGFydEluZGV4OiBudW1iZXIsXG4gICAgY2hhbmdlTWFzazogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcsIGJ5cGFzc0NoZWNrQml0ID0gZmFsc2UpIHtcbiAgbGV0IGNhc2VDcmVhdGVkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdXBkYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGJpdCBjb2RlIHRvIGNoZWNrIGlmIHdlIHNob3VsZCBhcHBseSB0aGUgbmV4dCB1cGRhdGVcbiAgICBjb25zdCBjaGVja0JpdCA9IHVwZGF0ZU9wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgIC8vIE51bWJlciBvZiBvcENvZGVzIHRvIHNraXAgdW50aWwgbmV4dCBzZXQgb2YgdXBkYXRlIGNvZGVzXG4gICAgY29uc3Qgc2tpcENvZGVzID0gdXBkYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICBpZiAoYnlwYXNzQ2hlY2tCaXQgfHwgKGNoZWNrQml0ICYgY2hhbmdlTWFzaykpIHtcbiAgICAgIC8vIFRoZSB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkIHNpbmNlIGxhc3QgY2hlY2tlZFxuICAgICAgbGV0IHZhbHVlID0gJyc7XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPD0gKGkgKyBza2lwQ29kZXMpOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3BDb2RlID0gdXBkYXRlT3BDb2Rlc1tqXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSArPSBvcENvZGU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgYmluZGluZyBpbmRleCB3aG9zZSB2YWx1ZSBpcyBuZWdhdGl2ZVxuICAgICAgICAgICAgdmFsdWUgKz0gcmVuZGVyU3RyaW5naWZ5KHZpZXdEYXRhW2JpbmRpbmdzU3RhcnRJbmRleCAtIG9wQ29kZV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgbGV0IHRJY3VJbmRleDogbnVtYmVyO1xuICAgICAgICAgICAgbGV0IHRJY3U6IFRJY3U7XG4gICAgICAgICAgICBsZXQgaWN1VE5vZGU6IFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuVXBkYXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgICAgICAgIGNvbnN0IHByb3BOYW1lID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBjb25zdCBzYW5pdGl6ZUZuID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIFNhbml0aXplckZuIHwgbnVsbDtcbiAgICAgICAgICAgICAgICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChub2RlSW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVGbik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5UZXh0OlxuICAgICAgICAgICAgICAgIHRleHRCaW5kaW5nSW50ZXJuYWwodmlld0RhdGEsIG5vZGVJbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoOlxuICAgICAgICAgICAgICAgIHRJY3VJbmRleCA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgdEljdSA9IGljdXMgIVt0SWN1SW5kZXhdO1xuICAgICAgICAgICAgICAgIGljdVROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gYWN0aXZlIGNhc2UsIGRlbGV0ZSB0aGUgb2xkIG5vZGVzXG4gICAgICAgICAgICAgICAgaWYgKGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlQ29kZXMgPSB0SWN1LnJlbW92ZVtpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZW1vdmVDb2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVPcENvZGUgPSByZW1vdmVDb2Rlc1trXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVtb3ZlT3BDb2RlICYgSTE4bk11dGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmU6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3U6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUNvZGVzW2sgKyAxXSBhcyBudW1iZXIgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VE5vZGUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5lc3RlZEljdU5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSBuZXN0ZWRJY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VEluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkVEljdSA9IGljdXMgIVtuZXN0ZWRJY3VUSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KG5lc3RlZFRJY3UucmVtb3ZlW2FjdGl2ZUluZGV4XSwgcmVtb3ZlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGFjdGl2ZSBjYXNlSW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICAgICAgICAgICAgcmVhZENyZWF0ZU9wQ29kZXMoLTEsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIGljdXMsIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgdEljdS51cGRhdGVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICFdLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssXG4gICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhLCBjYXNlQ3JlYXRlZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KSB7XG4gIGNvbnN0IHJlbW92ZWRQaFROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIHZpZXdEYXRhKTtcbiAgY29uc3QgcmVtb3ZlZFBoUk5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSk7XG4gIGlmIChyZW1vdmVkUGhSTm9kZSkge1xuICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCByZW1vdmVkUGhSTm9kZSk7XG4gIH1cblxuICBjb25zdCBzbG90VmFsdWUgPSDJtcm1bG9hZChpbmRleCkgYXMgUkVsZW1lbnQgfCBSQ29tbWVudCB8IExDb250YWluZXIgfCBTdHlsaW5nQ29udGV4dDtcbiAgaWYgKGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHNsb3RWYWx1ZSBhcyBMQ29udGFpbmVyO1xuICAgIGlmIChyZW1vdmVkUGhUTm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICBuYXRpdmVSZW1vdmVOb2RlKHZpZXdEYXRhW1JFTkRFUkVSXSwgbENvbnRhaW5lcltOQVRJVkVdKTtcbiAgICB9XG4gIH1cblxuICAvLyBEZWZpbmUgdGhpcyBub2RlIGFzIGRldGFjaGVkIHNvIHRoYXQgd2UgZG9uJ3QgcmlzayBwcm9qZWN0aW5nIGl0XG4gIHJlbW92ZWRQaFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZU5vZGUrKztcbn1cblxuLyoqXG4gKlxuICogVXNlIHRoaXMgaW5zdHJ1Y3Rpb24gdG8gY3JlYXRlIGEgdHJhbnNsYXRpb24gYmxvY2sgdGhhdCBkb2Vzbid0IGNvbnRhaW4gYW55IHBsYWNlaG9sZGVyLlxuICogSXQgY2FsbHMgYm90aCB7QGxpbmsgaTE4blN0YXJ0fSBhbmQge0BsaW5rIGkxOG5FbmR9IGluIG9uZSBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIGlzIHRoZSB2YWx1ZSB3aGljaCBpcyBsb2NhbGUgc3BlY2lmaWMuIFRoZSB0cmFuc2xhdGlvbiBzdHJpbmcgbWF5XG4gKiBjb250YWluIHBsYWNlaG9sZGVycyB3aGljaCBhc3NvY2lhdGUgaW5uZXIgZWxlbWVudHMgYW5kIHN1Yi10ZW1wbGF0ZXMgd2l0aGluIHRoZSB0cmFuc2xhdGlvbi5cbiAqXG4gKiBUaGUgdHJhbnNsYXRpb24gYG1lc3NhZ2VgIHBsYWNlaG9sZGVycyBhcmU6XG4gKiAtIGDvv717aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpCaW5kaW5nIFBsYWNlaG9sZGVyKjogTWFya3MgYSBsb2NhdGlvbiB3aGVyZSBhbiBleHByZXNzaW9uIHdpbGwgYmVcbiAqICAgaW50ZXJwb2xhdGVkIGludG8uIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZXhwcmVzc2lvbiBiaW5kaW5nIGluZGV4LiBBbiBvcHRpb25hbFxuICogICBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSN7aW5kZXh9KDp7YmxvY2t9Ke+/vWAvYO+/vS8je2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqRWxlbWVudCBQbGFjZWhvbGRlcio6ICBNYXJrcyB0aGUgYmVnaW5uaW5nXG4gKiAgIGFuZCBlbmQgb2YgRE9NIGVsZW1lbnQgdGhhdCB3ZXJlIGVtYmVkZGVkIGluIHRoZSBvcmlnaW5hbCB0cmFuc2xhdGlvbiBibG9jay4gVGhlIHBsYWNlaG9sZGVyXG4gKiAgIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBlbGVtZW50IGluZGV4IGluIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMgc2V0LiBBbiBvcHRpb25hbCBgYmxvY2tgIHRoYXRcbiAqICAgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqIC0gYO+/vSp7aW5kZXh9OntibG9ja33vv71gL2Dvv70vKntpbmRleH06e2Jsb2Nrfe+/vWA6ICpTdWItdGVtcGxhdGUgUGxhY2Vob2xkZXIqOiBTdWItdGVtcGxhdGVzIG11c3QgYmVcbiAqICAgc3BsaXQgdXAgYW5kIHRyYW5zbGF0ZWQgc2VwYXJhdGVseSBpbiBlYWNoIGFuZ3VsYXIgdGVtcGxhdGUgZnVuY3Rpb24uIFRoZSBgaW5kZXhgIHBvaW50cyB0byB0aGVcbiAqICAgYHRlbXBsYXRlYCBpbnN0cnVjdGlvbiBpbmRleC4gQSBgYmxvY2tgIHRoYXQgbWF0Y2hlcyB0aGUgc3ViLXRlbXBsYXRlIGluIHdoaWNoIGl0IHdhcyBkZWNsYXJlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggQSB1bmlxdWUgaW5kZXggb2YgdGhlIHRyYW5zbGF0aW9uIGluIHRoZSBzdGF0aWMgYmxvY2suXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgdHJhbnNsYXRpb24gbWVzc2FnZS5cbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IE9wdGlvbmFsIHN1Yi10ZW1wbGF0ZSBpbmRleCBpbiB0aGUgYG1lc3NhZ2VgLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bihpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgybXJtWkxOG5TdGFydChpbmRleCwgbWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIMm1ybVpMThuRW5kKCk7XG59XG5cbi8qKlxuICogTWFya3MgYSBsaXN0IG9mIGF0dHJpYnV0ZXMgYXMgdHJhbnNsYXRhYmxlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBpbiB0aGUgc3RhdGljIGJsb2NrXG4gKiBAcGFyYW0gdmFsdWVzXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuQXR0cmlidXRlcyhpbmRleDogbnVtYmVyLCB2YWx1ZXM6IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkF0dHJpYnV0ZXNGaXJzdFBhc3ModFZpZXcsIGluZGV4LCB2YWx1ZXMpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkF0dHJpYnV0ZXNgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyh0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pIHtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50ID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHByZXZpb3VzRWxlbWVudEluZGV4ID0gcHJldmlvdXNFbGVtZW50LmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IHZhbHVlc1tpXTtcbiAgICBjb25zdCBtZXNzYWdlID0gdmFsdWVzW2kgKyAxXTtcbiAgICBjb25zdCBwYXJ0cyA9IG1lc3NhZ2Uuc3BsaXQoSUNVX1JFR0VYUCk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSBwYXJ0c1tqXTtcblxuICAgICAgaWYgKGogJiAxKSB7XG4gICAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBJQ1UgZXhwcmVzc2lvbnNcbiAgICAgICAgLy8gVE9ETyhvY29tYmUpOiBzdXBwb3J0IElDVSBleHByZXNzaW9ucyBpbiBhdHRyaWJ1dGVzXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSUNVIGV4cHJlc3Npb25zIGFyZSBub3QgeWV0IHN1cHBvcnRlZCBpbiBhdHRyaWJ1dGVzJyk7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlICE9PSAnJykge1xuICAgICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHQgKGluY2x1ZGluZyBiaW5kaW5ncylcbiAgICAgICAgY29uc3QgaGFzQmluZGluZyA9ICEhdmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgcHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lKSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICAgICAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwocHJldmlvdXNFbGVtZW50SW5kZXgsIGF0dHJOYW1lLCB2YWx1ZSwgbFZpZXcpO1xuICAgICAgICAgIC8vIENoZWNrIGlmIHRoYXQgYXR0cmlidXRlIGlzIGEgZGlyZWN0aXZlIGlucHV0XG4gICAgICAgICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShwcmV2aW91c0VsZW1lbnRJbmRleCwgbFZpZXcpO1xuICAgICAgICAgIGNvbnN0IGRhdGFWYWx1ZSA9IHROb2RlLmlucHV0cyAmJiB0Tm9kZS5pbnB1dHNbYXR0ck5hbWVdO1xuICAgICAgICAgIGlmIChkYXRhVmFsdWUpIHtcbiAgICAgICAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdXBkYXRlT3BDb2RlcztcbiAgfVxufVxuXG5sZXQgY2hhbmdlTWFzayA9IDBiMDtcbmxldCBzaGlmdHNDb3VudGVyID0gMDtcblxuLyoqXG4gKiBTdG9yZXMgdGhlIHZhbHVlcyBvZiB0aGUgYmluZGluZ3MgZHVyaW5nIGVhY2ggdXBkYXRlIGN5Y2xlIGluIG9yZGVyIHRvIGRldGVybWluZSBpZiB3ZSBuZWVkIHRvXG4gKiB1cGRhdGUgdGhlIHRyYW5zbGF0ZWQgbm9kZXMuXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBiaW5kaW5nJ3MgdmFsdWVcbiAqIEByZXR1cm5zIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBpdHNlbGYgc28gdGhhdCBpdCBtYXkgYmUgY2hhaW5lZFxuICogKGUuZy4gYGkxOG5FeHAoY3R4Lm5hbWUpKGN0eC50aXRsZSlgKVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkV4cDxUPih2YWx1ZTogVCk6IFRzaWNrbGVJc3N1ZTEwMDkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGV4cHJlc3Npb24gPSBiaW5kKGxWaWV3LCB2YWx1ZSk7XG4gIGlmIChleHByZXNzaW9uICE9PSBOT19DSEFOR0UpIHtcbiAgICBjaGFuZ2VNYXNrID0gY2hhbmdlTWFzayB8ICgxIDw8IHNoaWZ0c0NvdW50ZXIpO1xuICB9XG4gIHNoaWZ0c0NvdW50ZXIrKztcbiAgcmV0dXJuIMm1ybVpMThuRXhwO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgYSB0cmFuc2xhdGlvbiBibG9jayBvciBhbiBpMThuIGF0dHJpYnV0ZSB3aGVuIHRoZSBiaW5kaW5ncyBoYXZlIGNoYW5nZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIGVpdGhlciB7QGxpbmsgaTE4blN0YXJ0fSAodHJhbnNsYXRpb24gYmxvY2spIG9yIHtAbGluayBpMThuQXR0cmlidXRlc31cbiAqIChpMThuIGF0dHJpYnV0ZSkgb24gd2hpY2ggaXQgc2hvdWxkIHVwZGF0ZSB0aGUgY29udGVudC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5BcHBseShpbmRleDogbnVtYmVyKSB7XG4gIGlmIChzaGlmdHNDb3VudGVyKSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXTtcbiAgICBsZXQgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgbGV0IGljdXM6IFRJY3VbXXxudWxsID0gbnVsbDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0STE4bikpIHtcbiAgICAgIHVwZGF0ZU9wQ29kZXMgPSB0STE4biBhcyBJMThuVXBkYXRlT3BDb2RlcztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9ICh0STE4biBhcyBUSTE4bikudXBkYXRlO1xuICAgICAgaWN1cyA9ICh0STE4biBhcyBUSTE4bikuaWN1cztcbiAgICB9XG4gICAgY29uc3QgYmluZGluZ3NTdGFydEluZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gLSBzaGlmdHNDb3VudGVyIC0gMTtcbiAgICByZWFkVXBkYXRlT3BDb2Rlcyh1cGRhdGVPcENvZGVzLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssIGxWaWV3KTtcblxuICAgIC8vIFJlc2V0IGNoYW5nZU1hc2sgJiBtYXNrQml0IHRvIGRlZmF1bHQgZm9yIHRoZSBuZXh0IHVwZGF0ZSBjeWNsZVxuICAgIGNoYW5nZU1hc2sgPSAwYjA7XG4gICAgc2hpZnRzQ291bnRlciA9IDA7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBjYXNlIG9mIGFuIElDVSBleHByZXNzaW9uIGRlcGVuZGluZyBvbiB0aGUgbWFpbiBiaW5kaW5nIHZhbHVlXG4gKlxuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBiaW5kaW5nVmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBtYWluIGJpbmRpbmcgdXNlZCBieSB0aGlzIElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIGdldENhc2VJbmRleChpY3VFeHByZXNzaW9uOiBUSWN1LCBiaW5kaW5nVmFsdWU6IHN0cmluZyk6IG51bWJlciB7XG4gIGxldCBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZihiaW5kaW5nVmFsdWUpO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgc3dpdGNoIChpY3VFeHByZXNzaW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgSWN1VHlwZS5wbHVyYWw6IHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRDYXNlID0gZ2V0UGx1cmFsQ2FzZShiaW5kaW5nVmFsdWUsIGdldExvY2FsZUlkKCkpO1xuICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZihyZXNvbHZlZENhc2UpO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xICYmIHJlc29sdmVkQ2FzZSAhPT0gJ290aGVyJykge1xuICAgICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBJY3VUeXBlLnNlbGVjdDoge1xuICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB0aGUgT3BDb2RlcyBmb3IgSUNVIGV4cHJlc3Npb25zLlxuICpcbiAqIEBwYXJhbSB0SWN1c1xuICogQHBhcmFtIGljdUV4cHJlc3Npb25cbiAqIEBwYXJhbSBzdGFydEluZGV4XG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXhcbiAqL1xuZnVuY3Rpb24gaWN1U3RhcnQoXG4gICAgdEljdXM6IFRJY3VbXSwgaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgc3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY3JlYXRlQ29kZXMgPSBbXTtcbiAgY29uc3QgcmVtb3ZlQ29kZXMgPSBbXTtcbiAgY29uc3QgdXBkYXRlQ29kZXMgPSBbXTtcbiAgY29uc3QgdmFycyA9IFtdO1xuICBjb25zdCBjaGlsZEljdXM6IG51bWJlcltdW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpY3VFeHByZXNzaW9uLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIEVhY2ggdmFsdWUgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyAmIG90aGVyIElDVSBleHByZXNzaW9uc1xuICAgIGNvbnN0IHZhbHVlQXJyID0gaWN1RXhwcmVzc2lvbi52YWx1ZXNbaV07XG4gICAgY29uc3QgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIEl0IGlzIGFuIG5lc3RlZCBJQ1UgZXhwcmVzc2lvblxuICAgICAgICBjb25zdCBpY3VJbmRleCA9IG5lc3RlZEljdXMucHVzaCh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uKSAtIDE7XG4gICAgICAgIC8vIFJlcGxhY2UgbmVzdGVkIElDVSBleHByZXNzaW9uIGJ5IGEgY29tbWVudCBub2RlXG4gICAgICAgIHZhbHVlQXJyW2pdID0gYDwhLS3vv70ke2ljdUluZGV4fe+/vS0tPmA7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGljdUNhc2U6IEljdUNhc2UgPVxuICAgICAgICBwYXJzZUljdUNhc2UodmFsdWVBcnIuam9pbignJyksIHN0YXJ0SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gICAgY3JlYXRlQ29kZXMucHVzaChpY3VDYXNlLmNyZWF0ZSk7XG4gICAgcmVtb3ZlQ29kZXMucHVzaChpY3VDYXNlLnJlbW92ZSk7XG4gICAgdXBkYXRlQ29kZXMucHVzaChpY3VDYXNlLnVwZGF0ZSk7XG4gICAgdmFycy5wdXNoKGljdUNhc2UudmFycyk7XG4gICAgY2hpbGRJY3VzLnB1c2goaWN1Q2FzZS5jaGlsZEljdXMpO1xuICB9XG4gIGNvbnN0IHRJY3U6IFRJY3UgPSB7XG4gICAgdHlwZTogaWN1RXhwcmVzc2lvbi50eXBlLFxuICAgIHZhcnMsXG4gICAgY2hpbGRJY3VzLFxuICAgIGNhc2VzOiBpY3VFeHByZXNzaW9uLmNhc2VzLFxuICAgIGNyZWF0ZTogY3JlYXRlQ29kZXMsXG4gICAgcmVtb3ZlOiByZW1vdmVDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZUNvZGVzXG4gIH07XG4gIHRJY3VzLnB1c2godEljdSk7XG4gIC8vIEFkZGluZyB0aGUgbWF4aW11bSBwb3NzaWJsZSBvZiB2YXJzIG5lZWRlZCAoYmFzZWQgb24gdGhlIGNhc2VzIHdpdGggdGhlIG1vc3QgdmFycylcbiAgaTE4blZhcnNDb3VudCArPSBNYXRoLm1heCguLi52YXJzKTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGEgc3RyaW5nIHRlbXBsYXRlIGludG8gYW4gSFRNTCB0ZW1wbGF0ZSBhbmQgYSBsaXN0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHVwZGF0ZVxuICogYXR0cmlidXRlcyBvciBub2RlcyB0aGF0IGNvbnRhaW4gYmluZGluZ3MuXG4gKlxuICogQHBhcmFtIHVuc2FmZUh0bWwgVGhlIHN0cmluZyB0byBwYXJzZVxuICogQHBhcmFtIHBhcmVudEluZGV4XG4gKiBAcGFyYW0gbmVzdGVkSWN1c1xuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXhcbiAqL1xuZnVuY3Rpb24gcGFyc2VJY3VDYXNlKFxuICAgIHVuc2FmZUh0bWw6IHN0cmluZywgcGFyZW50SW5kZXg6IG51bWJlciwgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdLCB0SWN1czogVEljdVtdLFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIpOiBJY3VDYXNlIHtcbiAgY29uc3QgaW5lcnRCb2R5SGVscGVyID0gbmV3IEluZXJ0Qm9keUhlbHBlcihkb2N1bWVudCk7XG4gIGNvbnN0IGluZXJ0Qm9keUVsZW1lbnQgPSBpbmVydEJvZHlIZWxwZXIuZ2V0SW5lcnRCb2R5RWxlbWVudCh1bnNhZmVIdG1sKTtcbiAgaWYgKCFpbmVydEJvZHlFbGVtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZ2VuZXJhdGUgaW5lcnQgYm9keSBlbGVtZW50Jyk7XG4gIH1cbiAgY29uc3Qgd3JhcHBlciA9IGdldFRlbXBsYXRlQ29udGVudChpbmVydEJvZHlFbGVtZW50ICEpIGFzIEVsZW1lbnQgfHwgaW5lcnRCb2R5RWxlbWVudDtcbiAgY29uc3Qgb3BDb2RlczogSWN1Q2FzZSA9IHt2YXJzOiAwLCBjaGlsZEljdXM6IFtdLCBjcmVhdGU6IFtdLCByZW1vdmU6IFtdLCB1cGRhdGU6IFtdfTtcbiAgcGFyc2VOb2Rlcyh3cmFwcGVyLmZpcnN0Q2hpbGQsIG9wQ29kZXMsIHBhcmVudEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICByZXR1cm4gb3BDb2Rlcztcbn1cblxuY29uc3QgTkVTVEVEX0lDVSA9IC/vv70oXFxkKynvv70vO1xuXG4vKipcbiAqIFBhcnNlcyBhIG5vZGUsIGl0cyBjaGlsZHJlbiBhbmQgaXRzIHNpYmxpbmdzLCBhbmQgZ2VuZXJhdGVzIHRoZSBtdXRhdGUgJiB1cGRhdGUgT3BDb2Rlcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudE5vZGUgVGhlIGZpcnN0IG5vZGUgdG8gcGFyc2VcbiAqIEBwYXJhbSBpY3VDYXNlIFRoZSBkYXRhIGZvciB0aGUgSUNVIGV4cHJlc3Npb24gY2FzZSB0aGF0IGNvbnRhaW5zIHRob3NlIG5vZGVzXG4gKiBAcGFyYW0gcGFyZW50SW5kZXggSW5kZXggb2YgdGhlIGN1cnJlbnQgbm9kZSdzIHBhcmVudFxuICogQHBhcmFtIG5lc3RlZEljdXMgRGF0YSBmb3IgdGhlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbnMgdGhhdCB0aGlzIGNhc2UgY29udGFpbnNcbiAqIEBwYXJhbSB0SWN1cyBEYXRhIGZvciBhbGwgSUNVIGV4cHJlc3Npb25zIG9mIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleCBFeHBhbmRvIHN0YXJ0IGluZGV4IGZvciB0aGUgY3VycmVudCBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBwYXJzZU5vZGVzKFxuICAgIGN1cnJlbnROb2RlOiBOb2RlIHwgbnVsbCwgaWN1Q2FzZTogSWN1Q2FzZSwgcGFyZW50SW5kZXg6IG51bWJlciwgbmVzdGVkSWN1czogSWN1RXhwcmVzc2lvbltdLFxuICAgIHRJY3VzOiBUSWN1W10sIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGN1cnJlbnROb2RlKSB7XG4gICAgY29uc3QgbmVzdGVkSWN1c1RvQ3JlYXRlOiBbSWN1RXhwcmVzc2lvbiwgbnVtYmVyXVtdID0gW107XG4gICAgd2hpbGUgKGN1cnJlbnROb2RlKSB7XG4gICAgICBjb25zdCBuZXh0Tm9kZTogTm9kZXxudWxsID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICBjb25zdCBuZXdJbmRleCA9IGV4cGFuZG9TdGFydEluZGV4ICsgKytpY3VDYXNlLnZhcnM7XG4gICAgICBzd2l0Y2ggKGN1cnJlbnROb2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IGN1cnJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmICghVkFMSURfRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZSkpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXNuJ3QgYSB2YWxpZCBlbGVtZW50LCB3ZSB3b24ndCBjcmVhdGUgYW4gZWxlbWVudCBmb3IgaXRcbiAgICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIEVMRU1FTlRfTUFSS0VSLCB0YWdOYW1lLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgICAgY29uc3QgZWxBdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcztcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBjb25zdCBhdHRyID0gZWxBdHRycy5pdGVtKGkpICE7XG4gICAgICAgICAgICAgIGNvbnN0IGxvd2VyQXR0ck5hbWUgPSBhdHRyLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9ICEhYXR0ci52YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGUgaW5wdXQgc3RyaW5nIGlzIHNhZmUsIHVubGVzcyBpdCdzIHVzaW5nIGEgYmluZGluZ1xuICAgICAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgICAgIGlmIChWQUxJRF9BVFRSUy5oYXNPd25Qcm9wZXJ0eShsb3dlckF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgaWYgKFVSSV9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBfc2FuaXRpemVVcmwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChTUkNTRVRfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgc2FuaXRpemVTcmNzZXQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYFdBUk5JTkc6IGlnbm9yaW5nIHVuc2FmZSBhdHRyaWJ1dGUgdmFsdWUgJHtsb3dlckF0dHJOYW1lfSBvbiBlbGVtZW50ICR7dGFnTmFtZX0gKHNlZSBodHRwOi8vZy5jby9uZy9zZWN1cml0eSN4c3MpYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5BdHRyLCBhdHRyLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQYXJzZSB0aGUgY2hpbGRyZW4gb2YgdGhpcyBub2RlIChpZiBhbnkpXG4gICAgICAgICAgICBwYXJzZU5vZGVzKFxuICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLmZpcnN0Q2hpbGQsIGljdUNhc2UsIG5ld0luZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBwYXJlbnQgbm9kZSBhZnRlciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICBoYXNCaW5kaW5nID8gJycgOiB2YWx1ZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBuZXdJbmRleCksIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvbW1lbnQgbm9kZSBpcyBhIHBsYWNlaG9sZGVyIGZvciBhIG5lc3RlZCBJQ1VcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IE5FU1RFRF9JQ1UuZXhlYyhjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJyk7XG4gICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VJbmRleCA9IHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgICAgICAgICBjb25zdCBuZXdMb2NhbCA9IG5nRGV2TW9kZSA/IGBuZXN0ZWQgSUNVICR7bmVzdGVkSWN1SW5kZXh9YCA6ICcnO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5ld0xvY2FsLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1ID0gbmVzdGVkSWN1c1tuZXN0ZWRJY3VJbmRleF07XG4gICAgICAgICAgICBuZXN0ZWRJY3VzVG9DcmVhdGUucHVzaChbbmVzdGVkSWN1LCBuZXdJbmRleF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkbyBub3QgaGFuZGxlIGFueSBvdGhlciB0eXBlIG9mIGNvbW1lbnRcbiAgICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyBXZSBkbyBub3QgaGFuZGxlIGFueSBvdGhlciB0eXBlIG9mIGVsZW1lbnRcbiAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gbmV4dE5vZGUgITtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5lc3RlZEljdXNUb0NyZWF0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmVzdGVkSWN1ID0gbmVzdGVkSWN1c1RvQ3JlYXRlW2ldWzBdO1xuICAgICAgY29uc3QgbmVzdGVkSWN1Tm9kZUluZGV4ID0gbmVzdGVkSWN1c1RvQ3JlYXRlW2ldWzFdO1xuICAgICAgaWN1U3RhcnQodEljdXMsIG5lc3RlZEljdSwgbmVzdGVkSWN1Tm9kZUluZGV4LCBleHBhbmRvU3RhcnRJbmRleCArIGljdUNhc2UudmFycyk7XG4gICAgICAvLyBTaW5jZSB0aGlzIGlzIHJlY3Vyc2l2ZSwgdGhlIGxhc3QgVEljdSB0aGF0IHdhcyBwdXNoZWQgaXMgdGhlIG9uZSB3ZSB3YW50XG4gICAgICBjb25zdCBuZXN0VEljdUluZGV4ID0gdEljdXMubGVuZ3RoIC0gMTtcbiAgICAgIGljdUNhc2UudmFycyArPSBNYXRoLm1heCguLi50SWN1c1tuZXN0VEljdUluZGV4XS52YXJzKTtcbiAgICAgIGljdUNhc2UuY2hpbGRJY3VzLnB1c2gobmVzdFRJY3VJbmRleCk7XG4gICAgICBjb25zdCBtYXNrID0gZ2V0QmluZGluZ01hc2sobmVzdGVkSWN1KTtcbiAgICAgIGljdUNhc2UudXBkYXRlLnB1c2goXG4gICAgICAgICAgdG9NYXNrQml0KG5lc3RlZEljdS5tYWluQmluZGluZyksICAvLyBtYXNrIG9mIHRoZSBtYWluIGJpbmRpbmdcbiAgICAgICAgICAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgMyBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgLTEgLSBuZXN0ZWRJY3UubWFpbkJpbmRpbmcsXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2gsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCxcbiAgICAgICAgICBtYXNrLCAgLy8gbWFzayBvZiBhbGwgdGhlIGJpbmRpbmdzIG9mIHRoaXMgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAyLCAgICAgLy8gc2tpcCAyIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSxcbiAgICAgICAgICBuZXN0VEljdUluZGV4KTtcbiAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2goXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlTmVzdGVkSWN1LFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICB9XG4gIH1cbn1cblxubGV0IFRSQU5TTEFUSU9OUzoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcbmV4cG9ydCBpbnRlcmZhY2UgSTE4bkxvY2FsaXplT3B0aW9ucyB7IHRyYW5zbGF0aW9uczoge1trZXk6IHN0cmluZ106IHN0cmluZ307IH1cblxuLyoqXG4gKiBTZXQgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIGBpMThuTG9jYWxpemVgLlxuICpcbiAqIEBkZXByZWNhdGVkIHRoaXMgbWV0aG9kIGlzIHRlbXBvcmFyeSAmIHNob3VsZCBub3QgYmUgdXNlZCBhcyBpdCB3aWxsIGJlIHJlbW92ZWQgc29vblxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkNvbmZpZ3VyZUxvY2FsaXplKG9wdGlvbnM6IEkxOG5Mb2NhbGl6ZU9wdGlvbnMgPSB7XG4gIHRyYW5zbGF0aW9uczoge31cbn0pIHtcbiAgVFJBTlNMQVRJT05TID0gb3B0aW9ucy50cmFuc2xhdGlvbnM7XG59XG5cbmNvbnN0IExPQ0FMSVpFX1BIX1JFR0VYUCA9IC9cXHtcXCQoLio/KVxcfS9nO1xuXG4vKipcbiAqIEEgZ29vZy5nZXRNc2ctbGlrZSBmdW5jdGlvbiBmb3IgdXNlcnMgdGhhdCBkbyBub3QgdXNlIENsb3N1cmUuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgcmVxdWlyZWQgYXMgYSAqdGVtcG9yYXJ5KiBtZWFzdXJlIHRvIHByZXZlbnQgaTE4biB0ZXN0cyBmcm9tIGJlaW5nIGJsb2NrZWQgd2hpbGVcbiAqIHJ1bm5pbmcgb3V0c2lkZSBvZiBDbG9zdXJlIENvbXBpbGVyLiBUaGlzIG1ldGhvZCB3aWxsIG5vdCBiZSBuZWVkZWQgb25jZSBydW50aW1lIHRyYW5zbGF0aW9uXG4gKiBzZXJ2aWNlIHN1cHBvcnQgaXMgaW50cm9kdWNlZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICogQGRlcHJlY2F0ZWQgdGhpcyBtZXRob2QgaXMgdGVtcG9yYXJ5ICYgc2hvdWxkIG5vdCBiZSB1c2VkIGFzIGl0IHdpbGwgYmUgcmVtb3ZlZCBzb29uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkxvY2FsaXplKGlucHV0OiBzdHJpbmcsIHBsYWNlaG9sZGVycz86IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KSB7XG4gIGlmICh0eXBlb2YgVFJBTlNMQVRJT05TW2lucHV0XSAhPT0gJ3VuZGVmaW5lZCcpIHsgIC8vIHRvIGFjY291bnQgZm9yIGVtcHR5IHN0cmluZ1xuICAgIGlucHV0ID0gVFJBTlNMQVRJT05TW2lucHV0XTtcbiAgfVxuICBpZiAocGxhY2Vob2xkZXJzICE9PSB1bmRlZmluZWQgJiYgT2JqZWN0LmtleXMocGxhY2Vob2xkZXJzKS5sZW5ndGgpIHtcbiAgICByZXR1cm4gaW5wdXQucmVwbGFjZShMT0NBTElaRV9QSF9SRUdFWFAsIChfLCBrZXkpID0+IHBsYWNlaG9sZGVyc1trZXldIHx8ICcnKTtcbiAgfVxuICByZXR1cm4gaW5wdXQ7XG59XG5cbi8qKlxuICogVGhlIGxvY2FsZSBpZCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBpcyBjdXJyZW50bHkgdXNpbmcgKGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucykuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0xPQ0FMRV9JRCA9ICdlbi1VUyc7XG5sZXQgTE9DQUxFX0lEID0gREVGQVVMVF9MT0NBTEVfSUQ7XG5cbi8qKlxuICogU2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbG9jYWxlSWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldExvY2FsZUlkKGxvY2FsZUlkOiBzdHJpbmcpIHtcbiAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUlkKCk6IHN0cmluZyB7XG4gIHJldHVybiBMT0NBTEVfSUQ7XG59XG4iXX0=