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
import { setDelayProjection, ɵɵbind, ɵɵload } from './instructions/all';
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
 *
 * @codeGenApi
 */
export function ɵɵi18nExp(value) {
    var expression = ɵɵbind(value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyw4QkFBOEIsQ0FBQztBQUV0QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3hILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhHLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxZQUFZLEVBQUUsd0JBQXdCLEVBQUUsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNuSyxPQUFPLEVBQWEsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGNBQWMsRUFBRSxjQUFjLEVBQWlHLE1BQU0sbUJBQW1CLENBQUM7QUFLakssT0FBTyxFQUFDLGFB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VyxDQUFDLFFBQWdCO0lBQzFDLFNBQVMsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxXQUFXO0lBQ3pCLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19pMThuX2Nsb3N1cmVfbW9kZSc7XG5cbmltcG9ydCB7Z2V0UGx1cmFsQ2FzZX0gZnJvbSAnLi4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtTUkNTRVRfQVRUUlMsIFVSSV9BVFRSUywgVkFMSURfQVRUUlMsIFZBTElEX0VMRU1FTlRTLCBnZXRUZW1wbGF0ZUNvbnRlbnR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9odG1sX3Nhbml0aXplcic7XG5pbXBvcnQge0luZXJ0Qm9keUhlbHBlcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2luZXJ0X2JvZHknO1xuaW1wb3J0IHtfc2FuaXRpemVVcmwsIHNhbml0aXplU3Jjc2V0fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vdXJsX3Nhbml0aXplcic7XG5pbXBvcnQge2FkZEFsbFRvQXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFufSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7c2V0RGVsYXlQcm9qZWN0aW9uLCDJtcm1YmluZCwgybXJtWxvYWR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge2F0dGFjaEkxOG5PcENvZGVzRGVidWd9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7YWxsb2NFeHBhbmRvLCBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwsIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBnZXRPckNyZWF0ZVROb2RlLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eSwgdGV4dEJpbmRpbmdJbnRlcm5hbH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7TENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q09NTUVOVF9NQVJLRVIsIEVMRU1FTlRfTUFSS0VSLCBJMThuTXV0YXRlT3BDb2RlLCBJMThuTXV0YXRlT3BDb2RlcywgSTE4blVwZGF0ZU9wQ29kZSwgSTE4blVwZGF0ZU9wQ29kZXMsIEljdVR5cGUsIFRJMThuLCBUSWN1fSBmcm9tICcuL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGVuZFByb2plY3RlZE5vZGVzLCBjcmVhdGVUZXh0Tm9kZSwgbmF0aXZlUmVtb3ZlTm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50Vmlld30gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzTENvbnRhaW5lcn0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgSUNVX0JMT0NLX1JFR0VYUCA9IC9eXFxzKijvv71cXGQrOj9cXGQq77+9KVxccyosXFxzKihzZWxlY3R8cGx1cmFsKVxccyosLztcbmNvbnN0IFNVQlRFTVBMQVRFX1JFR0VYUCA9IC/vv71cXC8/XFwqKFxcZCs6XFxkKynvv70vZ2k7XG5jb25zdCBQSF9SRUdFWFAgPSAv77+9KFxcLz9bIyohXVxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgQklORElOR19SRUdFWFAgPSAv77+9KFxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgSUNVX1JFR0VYUCA9IC8oe1xccyrvv71cXGQrOj9cXGQq77+9XFxzKixcXHMqXFxTezZ9XFxzKixbXFxzXFxTXSp9KS9naTtcbmNvbnN0IGVudW0gVGFnVHlwZSB7XG4gIEVMRU1FTlQgPSAnIycsXG4gIFRFTVBMQVRFID0gJyonLFxuICBQUk9KRUNUSU9OID0gJyEnLFxufVxuXG4vLyBpMThuUG9zdHByb2Nlc3MgY29uc3RzXG5jb25zdCBST09UX1RFTVBMQVRFX0lEID0gMDtcbmNvbnN0IFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdLztcbmNvbnN0IFBQX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdfCjvv71cXC8/XFwqXFxkKzpcXGQr77+9KS9nO1xuY29uc3QgUFBfSUNVX1ZBUlNfUkVHRVhQID0gLyh7XFxzKikoVkFSXyhQTFVSQUx8U0VMRUNUKShfXFxkKyk/KShcXHMqLCkvZztcbmNvbnN0IFBQX0lDVVNfUkVHRVhQID0gL++/vUkxOE5fRVhQXyhJQ1UoX1xcZCspPynvv70vZztcbmNvbnN0IFBQX0NMT1NFX1RFTVBMQVRFX1JFR0VYUCA9IC9cXC9cXCovO1xuY29uc3QgUFBfVEVNUExBVEVfSURfUkVHRVhQID0gL1xcZCtcXDooXFxkKykvO1xuXG4vLyBQYXJzZWQgcGxhY2Vob2xkZXIgc3RydWN0dXJlIHVzZWQgaW4gcG9zdHByb2Nlc3NpbmcgKHdpdGhpbiBgaTE4blBvc3Rwcm9jZXNzYCBmdW5jdGlvbilcbi8vIENvbnRhaW5zIHRoZSBmb2xsb3dpbmcgZmllbGRzOiBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl1cbnR5cGUgUG9zdHByb2Nlc3NQbGFjZWhvbGRlciA9IFtudW1iZXIsIGJvb2xlYW4sIHN0cmluZ107XG5cbmludGVyZmFjZSBJY3VFeHByZXNzaW9uIHtcbiAgdHlwZTogSWN1VHlwZTtcbiAgbWFpbkJpbmRpbmc6IG51bWJlcjtcbiAgY2FzZXM6IHN0cmluZ1tdO1xuICB2YWx1ZXM6IChzdHJpbmd8SWN1RXhwcmVzc2lvbilbXVtdO1xufVxuXG5pbnRlcmZhY2UgSWN1Q2FzZSB7XG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2NhdGUgaW4gZXhwYW5kbyBmb3IgdGhpcyBjYXNlLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYXggbnVtYmVyIG9mIERPTSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgYnkgdGhpcyBpMThuICsgSUNVIGJsb2Nrcy4gV2hlblxuICAgKiB0aGUgRE9NIGVsZW1lbnRzIGFyZSBiZWluZyBjcmVhdGVkIHRoZXkgYXJlIHN0b3JlZCBpbiB0aGUgRVhQQU5ETywgc28gdGhhdCB1cGRhdGUgT3BDb2RlcyBjYW5cbiAgICogd3JpdGUgaW50byB0aGVtLlxuICAgKi9cbiAgdmFyczogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBhcnJheSBvZiBjaGlsZC9zdWIgSUNVcy5cbiAgICovXG4gIGNoaWxkSWN1czogbnVtYmVyW107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gYnVpbGQgdXAgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVVxuICAgKi9cbiAgY3JlYXRlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byBkZXN0cm95IHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1UuXG4gICAqL1xuICByZW1vdmU6IEkxOG5NdXRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIHVwZGF0ZSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVIGJpbmRpbmdzLlxuICAgKi9cbiAgdXBkYXRlOiBJMThuVXBkYXRlT3BDb2Rlcztcbn1cblxuLyoqXG4gKiBCcmVha3MgcGF0dGVybiBpbnRvIHN0cmluZ3MgYW5kIHRvcCBsZXZlbCB7Li4ufSBibG9ja3MuXG4gKiBDYW4gYmUgdXNlZCB0byBicmVhayBhIG1lc3NhZ2UgaW50byB0ZXh0IGFuZCBJQ1UgZXhwcmVzc2lvbnMsIG9yIHRvIGJyZWFrIGFuIElDVSBleHByZXNzaW9uIGludG9cbiAqIGtleXMgYW5kIGNhc2VzLlxuICogT3JpZ2luYWwgY29kZSBmcm9tIGNsb3N1cmUgbGlicmFyeSwgbW9kaWZpZWQgZm9yIEFuZ3VsYXIuXG4gKlxuICogQHBhcmFtIHBhdHRlcm4gKHN1YilQYXR0ZXJuIHRvIGJlIGJyb2tlbi5cbiAqXG4gKi9cbmZ1bmN0aW9uIGV4dHJhY3RQYXJ0cyhwYXR0ZXJuOiBzdHJpbmcpOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSB7XG4gIGlmICghcGF0dGVybikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGxldCBwcmV2UG9zID0gMDtcbiAgY29uc3QgYnJhY2VTdGFjayA9IFtdO1xuICBjb25zdCByZXN1bHRzOiAoc3RyaW5nIHwgSWN1RXhwcmVzc2lvbilbXSA9IFtdO1xuICBjb25zdCBicmFjZXMgPSAvW3t9XS9nO1xuICAvLyBsYXN0SW5kZXggZG9lc24ndCBnZXQgc2V0IHRvIDAgc28gd2UgaGF2ZSB0by5cbiAgYnJhY2VzLmxhc3RJbmRleCA9IDA7XG5cbiAgbGV0IG1hdGNoO1xuICB3aGlsZSAobWF0Y2ggPSBicmFjZXMuZXhlYyhwYXR0ZXJuKSkge1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmluZGV4O1xuICAgIGlmIChtYXRjaFswXSA9PSAnfScpIHtcbiAgICAgIGJyYWNlU3RhY2sucG9wKCk7XG5cbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIEVuZCBvZiB0aGUgYmxvY2suXG4gICAgICAgIGNvbnN0IGJsb2NrID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgaWYgKElDVV9CTE9DS19SRUdFWFAudGVzdChibG9jaykpIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2gocGFyc2VJQ1VCbG9jayhibG9jaykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChibG9jayk7XG4gICAgICAgIH1cblxuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJyYWNlU3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcywgcG9zKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1YnN0cmluZyk7XG4gICAgICAgIHByZXZQb3MgPSBwb3MgKyAxO1xuICAgICAgfVxuICAgICAgYnJhY2VTdGFjay5wdXNoKCd7Jyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3Vic3RyaW5nID0gcGF0dGVybi5zdWJzdHJpbmcocHJldlBvcyk7XG4gIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGV4dCBjb250YWluaW5nIGFuIElDVSBleHByZXNzaW9uIGFuZCBwcm9kdWNlcyBhIEpTT04gb2JqZWN0IGZvciBpdC5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIFRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiB0aGF0IG5lZWRzIHRvIGJlIHBhcnNlZC5cbiAqXG4gKi9cbmZ1bmN0aW9uIHBhcnNlSUNVQmxvY2socGF0dGVybjogc3RyaW5nKTogSWN1RXhwcmVzc2lvbiB7XG4gIGNvbnN0IGNhc2VzID0gW107XG4gIGNvbnN0IHZhbHVlczogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW11bXSA9IFtdO1xuICBsZXQgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICBsZXQgbWFpbkJpbmRpbmcgPSAwO1xuICBwYXR0ZXJuID0gcGF0dGVybi5yZXBsYWNlKElDVV9CTE9DS19SRUdFWFAsIGZ1bmN0aW9uKHN0cjogc3RyaW5nLCBiaW5kaW5nOiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgIGlmICh0eXBlID09PSAnc2VsZWN0Jykge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUuc2VsZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpY3VUeXBlID0gSWN1VHlwZS5wbHVyYWw7XG4gICAgfVxuICAgIG1haW5CaW5kaW5nID0gcGFyc2VJbnQoYmluZGluZy5zdWJzdHIoMSksIDEwKTtcbiAgICByZXR1cm4gJyc7XG4gIH0pO1xuXG4gIGNvbnN0IHBhcnRzID0gZXh0cmFjdFBhcnRzKHBhdHRlcm4pIGFzIHN0cmluZ1tdO1xuICAvLyBMb29raW5nIGZvciAoa2V5IGJsb2NrKSsgc2VxdWVuY2UuIE9uZSBvZiB0aGUga2V5cyBoYXMgdG8gYmUgXCJvdGhlclwiLlxuICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBwYXJ0cy5sZW5ndGg7KSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW3BvcysrXS50cmltKCk7XG4gICAgaWYgKGljdVR5cGUgPT09IEljdVR5cGUucGx1cmFsKSB7XG4gICAgICAvLyBLZXkgY2FuIGJlIFwiPXhcIiwgd2UganVzdCB3YW50IFwieFwiXG4gICAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxzKig/Oj0pPyhcXHcrKVxccyovLCAnJDEnKTtcbiAgICB9XG4gICAgaWYgKGtleS5sZW5ndGgpIHtcbiAgICAgIGNhc2VzLnB1c2goa2V5KTtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBleHRyYWN0UGFydHMocGFydHNbcG9zKytdKSBhcyBzdHJpbmdbXTtcbiAgICBpZiAoY2FzZXMubGVuZ3RoID4gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgdmFsdWVzLnB1c2goYmxvY2tzKTtcbiAgICB9XG4gIH1cblxuICBhc3NlcnRHcmVhdGVyVGhhbihjYXNlcy5pbmRleE9mKCdvdGhlcicpLCAtMSwgJ01pc3Npbmcga2V5IFwib3RoZXJcIiBpbiBJQ1Ugc3RhdGVtZW50LicpO1xuICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXMsIHNlZSAjMjE2MTVcbiAgcmV0dXJuIHt0eXBlOiBpY3VUeXBlLCBtYWluQmluZGluZzogbWFpbkJpbmRpbmcsIGNhc2VzLCB2YWx1ZXN9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHN1Yi10ZW1wbGF0ZXMgb2YgYSBtZXNzYWdlLlxuICovXG5mdW5jdGlvbiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG1hdGNoO1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCBpbmRleCA9IDA7XG4gIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gIGxldCB0YWdNYXRjaGVkO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBTVUJURU1QTEFURV9SRUdFWFAuZXhlYyhtZXNzYWdlKSkgIT09IG51bGwpIHtcbiAgICBpZiAoIWluVGVtcGxhdGUpIHtcbiAgICAgIHJlcyArPSBtZXNzYWdlLnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgdGFnTWF0Y2hlZCA9IG1hdGNoWzFdO1xuICAgICAgaW5UZW1wbGF0ZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXRjaFswXSA9PT0gYCR7TUFSS0VSfS8qJHt0YWdNYXRjaGVkfSR7TUFSS0VSfWApIHtcbiAgICAgICAgaW5kZXggPSBtYXRjaC5pbmRleDtcbiAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgaW5UZW1wbGF0ZSwgZmFsc2UsXG4gICAgICAgICAgYFRhZyBtaXNtYXRjaDogdW5hYmxlIHRvIGZpbmQgdGhlIGVuZCBvZiB0aGUgc3ViLXRlbXBsYXRlIGluIHRoZSB0cmFuc2xhdGlvbiBcIiR7bWVzc2FnZX1cImApO1xuXG4gIHJlcyArPSBtZXNzYWdlLnN1YnN0cihpbmRleCk7XG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdHMgYSBwYXJ0IG9mIGEgbWVzc2FnZSBhbmQgcmVtb3ZlcyB0aGUgcmVzdC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBleHRyYWN0aW5nIGEgcGFydCBvZiB0aGUgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggYSB0ZW1wbGF0ZS4gQSB0cmFuc2xhdGVkXG4gKiBtZXNzYWdlIGNhbiBzcGFuIG11bHRpcGxlIHRlbXBsYXRlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGkxOG4+VHJhbnNsYXRlIDxzcGFuICpuZ0lmPm1lPC9zcGFuPiE8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIGNyb3BcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IEluZGV4IG9mIHRoZSBzdWItdGVtcGxhdGUgdG8gZXh0cmFjdC4gSWYgdW5kZWZpbmVkIGl0IHJldHVybnMgdGhlXG4gKiBleHRlcm5hbCB0ZW1wbGF0ZSBhbmQgcmVtb3ZlcyBhbGwgc3ViLXRlbXBsYXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKSB7XG4gIGlmICh0eXBlb2Ygc3ViVGVtcGxhdGVJbmRleCAhPT0gJ251bWJlcicpIHtcbiAgICAvLyBXZSB3YW50IHRoZSByb290IHRlbXBsYXRlIG1lc3NhZ2UsIGlnbm9yZSBhbGwgc3ViLXRlbXBsYXRlc1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2Ugd2FudCBhIHNwZWNpZmljIHN1Yi10ZW1wbGF0ZVxuICAgIGNvbnN0IHN0YXJ0ID1cbiAgICAgICAgbWVzc2FnZS5pbmRleE9mKGA6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApICsgMiArIHN1YlRlbXBsYXRlSW5kZXgudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgY29uc3QgZW5kID0gbWVzc2FnZS5zZWFyY2gobmV3IFJlZ0V4cChgJHtNQVJLRVJ9XFxcXC9cXFxcKlxcXFxkKzoke3N1YlRlbXBsYXRlSW5kZXh9JHtNQVJLRVJ9YCkpO1xuICAgIHJldHVybiByZW1vdmVJbm5lclRlbXBsYXRlVHJhbnNsYXRpb24obWVzc2FnZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgdG8gdXBkYXRlIHRoZSBiaW5kaW5ncyBvZiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmluZGluZ3MuXG4gKiBAcGFyYW0gZGVzdGluYXRpb25Ob2RlIEluZGV4IG9mIHRoZSBkZXN0aW5hdGlvbiBub2RlIHdoaWNoIHdpbGwgcmVjZWl2ZSB0aGUgYmluZGluZy5cbiAqIEBwYXJhbSBhdHRyTmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUsIGlmIHRoZSBzdHJpbmcgYmVsb25ncyB0byBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gc2FuaXRpemVGbiBTYW5pdGl6YXRpb24gZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgc3RyaW5nIGFmdGVyIHVwZGF0ZSwgaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgIHN0cjogc3RyaW5nLCBkZXN0aW5hdGlvbk5vZGU6IG51bWJlciwgYXR0ck5hbWU/OiBzdHJpbmcsXG4gICAgc2FuaXRpemVGbjogU2FuaXRpemVyRm4gfCBudWxsID0gbnVsbCk6IEkxOG5VcGRhdGVPcENvZGVzIHtcbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbbnVsbCwgbnVsbF07ICAvLyBBbGxvYyBzcGFjZSBmb3IgbWFzayBhbmQgc2l6ZVxuICBjb25zdCB0ZXh0UGFydHMgPSBzdHIuc3BsaXQoQklORElOR19SRUdFWFApO1xuICBsZXQgbWFzayA9IDA7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCB0ZXh0UGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB0ZXh0UGFydHNbal07XG5cbiAgICBpZiAoaiAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gcGFyc2VJbnQodGV4dFZhbHVlLCAxMCk7XG4gICAgICB1cGRhdGVPcENvZGVzLnB1c2goLTEgLSBiaW5kaW5nSW5kZXgpO1xuICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2UgaWYgKHRleHRWYWx1ZSAhPT0gJycpIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dFxuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKHRleHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgZGVzdGluYXRpb25Ob2RlIDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHxcbiAgICAgIChhdHRyTmFtZSA/IEkxOG5VcGRhdGVPcENvZGUuQXR0ciA6IEkxOG5VcGRhdGVPcENvZGUuVGV4dCkpO1xuICBpZiAoYXR0ck5hbWUpIHtcbiAgICB1cGRhdGVPcENvZGVzLnB1c2goYXR0ck5hbWUsIHNhbml0aXplRm4pO1xuICB9XG4gIHVwZGF0ZU9wQ29kZXNbMF0gPSBtYXNrO1xuICB1cGRhdGVPcENvZGVzWzFdID0gdXBkYXRlT3BDb2Rlcy5sZW5ndGggLSAyO1xuICByZXR1cm4gdXBkYXRlT3BDb2Rlcztcbn1cblxuZnVuY3Rpb24gZ2V0QmluZGluZ01hc2soaWN1RXhwcmVzc2lvbjogSWN1RXhwcmVzc2lvbiwgbWFzayA9IDApOiBudW1iZXIge1xuICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nKTtcbiAgbGV0IG1hdGNoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgd2hpbGUgKG1hdGNoID0gQklORElOR19SRUdFWFAuZXhlYyh2YWx1ZSkpIHtcbiAgICAgICAgICBtYXNrID0gbWFzayB8IHRvTWFza0JpdChwYXJzZUludChtYXRjaFsxXSwgMTApKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWFzayA9IGdldEJpbmRpbmdNYXNrKHZhbHVlIGFzIEljdUV4cHJlc3Npb24sIG1hc2spO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWFzaztcbn1cblxuY29uc3QgaTE4bkluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5sZXQgaTE4bkluZGV4U3RhY2tQb2ludGVyID0gLTE7XG5cbi8qKlxuICogQ29udmVydCBiaW5kaW5nIGluZGV4IHRvIG1hc2sgYml0LlxuICpcbiAqIEVhY2ggaW5kZXggcmVwcmVzZW50cyBhIHNpbmdsZSBiaXQgb24gdGhlIGJpdC1tYXNrLiBCZWNhdXNlIGJpdC1tYXNrIG9ubHkgaGFzIDMyIGJpdHMsIHdlIG1ha2VcbiAqIHRoZSAzMm5kIGJpdCBzaGFyZSBhbGwgbWFza3MgZm9yIGFsbCBiaW5kaW5ncyBoaWdoZXIgdGhhbiAzMi4gU2luY2UgaXQgaXMgZXh0cmVtZWx5IHJhcmUgdG8gaGF2ZVxuICogbW9yZSB0aGFuIDMyIGJpbmRpbmdzIHRoaXMgd2lsbCBiZSBoaXQgdmVyeSByYXJlbHkuIFRoZSBkb3duc2lkZSBvZiBoaXR0aW5nIHRoaXMgY29ybmVyIGNhc2UgaXNcbiAqIHRoYXQgd2Ugd2lsbCBleGVjdXRlIGJpbmRpbmcgY29kZSBtb3JlIG9mdGVuIHRoYW4gbmVjZXNzYXJ5LiAocGVuYWx0eSBvZiBwZXJmb3JtYW5jZSlcbiAqL1xuZnVuY3Rpb24gdG9NYXNrQml0KGJpbmRpbmdJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIDEgPDwgTWF0aC5taW4oYmluZGluZ0luZGV4LCAzMSk7XG59XG5cbmNvbnN0IHBhcmVudEluZGV4U3RhY2s6IG51bWJlcltdID0gW107XG5cbi8qKlxuICogTWFya3MgYSBibG9jayBvZiB0ZXh0IGFzIHRyYW5zbGF0YWJsZS5cbiAqXG4gKiBUaGUgaW5zdHJ1Y3Rpb25zIGBpMThuU3RhcnRgIGFuZCBgaTE4bkVuZGAgbWFyayB0aGUgdHJhbnNsYXRpb24gYmxvY2sgaW4gdGhlIHRlbXBsYXRlLlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBpcyB0aGUgdmFsdWUgd2hpY2ggaXMgbG9jYWxlIHNwZWNpZmljLiBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIG1heVxuICogY29udGFpbiBwbGFjZWhvbGRlcnMgd2hpY2ggYXNzb2NpYXRlIGlubmVyIGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzIHdpdGhpbiB0aGUgdHJhbnNsYXRpb24uXG4gKlxuICogVGhlIHRyYW5zbGF0aW9uIGBtZXNzYWdlYCBwbGFjZWhvbGRlcnMgYXJlOlxuICogLSBg77+9e2luZGV4fSg6e2Jsb2NrfSnvv71gOiAqQmluZGluZyBQbGFjZWhvbGRlcio6IE1hcmtzIGEgbG9jYXRpb24gd2hlcmUgYW4gZXhwcmVzc2lvbiB3aWxsIGJlXG4gKiAgIGludGVycG9sYXRlZCBpbnRvLiBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGV4cHJlc3Npb24gYmluZGluZyBpbmRleC4gQW4gb3B0aW9uYWxcbiAqICAgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70je2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vI3tpbmRleH0oOntibG9ja30p77+9YDogKkVsZW1lbnQgUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlIGJlZ2lubmluZ1xuICogICBhbmQgZW5kIG9mIERPTSBlbGVtZW50IHRoYXQgd2VyZSBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suIFRoZSBwbGFjZWhvbGRlclxuICogICBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC4gQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0XG4gKiAgIG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70he2luZGV4fSg6e2Jsb2NrfSnvv71gL2Dvv70vIXtpbmRleH0oOntibG9ja30p77+9YDogKlByb2plY3Rpb24gUGxhY2Vob2xkZXIqOiAgTWFya3MgdGhlXG4gKiAgIGJlZ2lubmluZyBhbmQgZW5kIG9mIDxuZy1jb250ZW50PiB0aGF0IHdhcyBlbWJlZGRlZCBpbiB0aGUgb3JpZ2luYWwgdHJhbnNsYXRpb24gYmxvY2suXG4gKiAgIFRoZSBwbGFjZWhvbGRlciBgaW5kZXhgIHBvaW50cyB0byB0aGUgZWxlbWVudCBpbmRleCBpbiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zIHNldC5cbiAqICAgQW4gb3B0aW9uYWwgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKiAtIGDvv70qe2luZGV4fTp7YmxvY2t977+9YC9g77+9Lyp7aW5kZXh9OntibG9ja33vv71gOiAqU3ViLXRlbXBsYXRlIFBsYWNlaG9sZGVyKjogU3ViLXRlbXBsYXRlcyBtdXN0IGJlXG4gKiAgIHNwbGl0IHVwIGFuZCB0cmFuc2xhdGVkIHNlcGFyYXRlbHkgaW4gZWFjaCBhbmd1bGFyIHRlbXBsYXRlIGZ1bmN0aW9uLiBUaGUgYGluZGV4YCBwb2ludHMgdG8gdGhlXG4gKiAgIGB0ZW1wbGF0ZWAgaW5zdHJ1Y3Rpb24gaW5kZXguIEEgYGJsb2NrYCB0aGF0IG1hdGNoZXMgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB3aGljaCBpdCB3YXMgZGVjbGFyZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IG9mIHRoZSB0cmFuc2xhdGlvbiBpbiB0aGUgc3RhdGljIGJsb2NrLlxuICogQHBhcmFtIG1lc3NhZ2UgVGhlIHRyYW5zbGF0aW9uIG1lc3NhZ2UuXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBPcHRpb25hbCBzdWItdGVtcGxhdGUgaW5kZXggaW4gdGhlIGBtZXNzYWdlYC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5TdGFydChpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuSW5kZXhTdGFja1srK2kxOG5JbmRleFN0YWNrUG9pbnRlcl0gPSBpbmRleDtcbiAgLy8gV2UgbmVlZCB0byBkZWxheSBwcm9qZWN0aW9ucyB1bnRpbCBgaTE4bkVuZGBcbiAgc2V0RGVsYXlQcm9qZWN0aW9uKHRydWUpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID09PSBudWxsKSB7XG4gICAgaTE4blN0YXJ0Rmlyc3RQYXNzKHRWaWV3LCBpbmRleCwgbWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIH1cbn1cblxuLy8gQ291bnQgZm9yIHRoZSBudW1iZXIgb2YgdmFycyB0aGF0IHdpbGwgYmUgYWxsb2NhdGVkIGZvciBlYWNoIGkxOG4gYmxvY2suXG4vLyBJdCBpcyBnbG9iYWwgYmVjYXVzZSB0aGlzIGlzIHVzZWQgaW4gbXVsdGlwbGUgZnVuY3Rpb25zIHRoYXQgaW5jbHVkZSBsb29wcyBhbmQgcmVjdXJzaXZlIGNhbGxzLlxuLy8gVGhpcyBpcyByZXNldCB0byAwIHdoZW4gYGkxOG5TdGFydEZpcnN0UGFzc2AgaXMgY2FsbGVkLlxubGV0IGkxOG5WYXJzQ291bnQ6IG51bWJlcjtcblxuLyoqXG4gKiBTZWUgYGkxOG5TdGFydGAgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5TdGFydEZpcnN0UGFzcyhcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcikge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0YXJ0SW5kZXggPSB0Vmlldy5ibHVlcHJpbnQubGVuZ3RoIC0gSEVBREVSX09GRlNFVDtcbiAgaTE4blZhcnNDb3VudCA9IDA7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBwYXJlbnRUTm9kZSA9IGdldElzUGFyZW50KCkgPyBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICBsZXQgcGFyZW50SW5kZXggPVxuICAgICAgcGFyZW50VE5vZGUgJiYgcGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW1RfSE9TVF0gPyBwYXJlbnRUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQgOiBpbmRleDtcbiAgbGV0IHBhcmVudEluZGV4UG9pbnRlciA9IDA7XG4gIHBhcmVudEluZGV4U3RhY2tbcGFyZW50SW5kZXhQb2ludGVyXSA9IHBhcmVudEluZGV4O1xuICBjb25zdCBjcmVhdGVPcENvZGVzOiBJMThuTXV0YXRlT3BDb2RlcyA9IFtdO1xuICAvLyBJZiB0aGUgcHJldmlvdXMgbm9kZSB3YXNuJ3QgdGhlIGRpcmVjdCBwYXJlbnQgdGhlbiB3ZSBoYXZlIGEgdHJhbnNsYXRpb24gd2l0aG91dCB0b3AgbGV2ZWxcbiAgLy8gZWxlbWVudCBhbmQgd2UgbmVlZCB0byBrZWVwIGEgcmVmZXJlbmNlIG9mIHRoZSBwcmV2aW91cyBlbGVtZW50IGlmIHRoZXJlIGlzIG9uZVxuICBpZiAoaW5kZXggPiAwICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAhPT0gcGFyZW50VE5vZGUpIHtcbiAgICAvLyBDcmVhdGUgYW4gT3BDb2RlIHRvIHNlbGVjdCB0aGUgcHJldmlvdXMgVE5vZGVcbiAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0KTtcbiAgfVxuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBjb25zdCBpY3VFeHByZXNzaW9uczogVEljdVtdID0gW107XG5cbiAgY29uc3QgdGVtcGxhdGVUcmFuc2xhdGlvbiA9IGdldFRyYW5zbGF0aW9uRm9yVGVtcGxhdGUobWVzc2FnZSwgc3ViVGVtcGxhdGVJbmRleCk7XG4gIGNvbnN0IG1zZ1BhcnRzID0gdGVtcGxhdGVUcmFuc2xhdGlvbi5zcGxpdChQSF9SRUdFWFApO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1zZ1BhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHZhbHVlID0gbXNnUGFydHNbaV07XG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzIChlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcylcbiAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgICAvLyBJdCBpcyBhIGNsb3NpbmcgdGFnXG4gICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMSkgPT09IFRhZ1R5cGUuRUxFTUVOVCkge1xuICAgICAgICAgIGNvbnN0IHBoSW5kZXggPSBwYXJzZUludCh2YWx1ZS5zdWJzdHIoMiksIDEwKTtcbiAgICAgICAgICBwYXJlbnRJbmRleCA9IHBhcmVudEluZGV4U3RhY2tbLS1wYXJlbnRJbmRleFBvaW50ZXJdO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigxKSwgMTApO1xuICAgICAgICAvLyBUaGUgdmFsdWUgcmVwcmVzZW50cyBhIHBsYWNlaG9sZGVyIHRoYXQgd2UgbW92ZSB0byB0aGUgZGVzaWduYXRlZCBpbmRleFxuICAgICAgICBjcmVhdGVPcENvZGVzLnB1c2goXG4gICAgICAgICAgICBwaEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3QsXG4gICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgIGlmICh2YWx1ZS5jaGFyQXQoMCkgPT09IFRhZ1R5cGUuRUxFTUVOVCkge1xuICAgICAgICAgIHBhcmVudEluZGV4U3RhY2tbKytwYXJlbnRJbmRleFBvaW50ZXJdID0gcGFyZW50SW5kZXggPSBwaEluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzICYgSUNVIGV4cHJlc3Npb25zKVxuICAgICAgY29uc3QgcGFydHMgPSBleHRyYWN0UGFydHModmFsdWUpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJ0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgSUNVIGV4cHJlc3Npb25zXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb21tZW50IG5vZGUgdGhhdCB3aWxsIGFuY2hvciB0aGUgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICBjb25zdCBpY3VOb2RlSW5kZXggPSBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgQ09NTUVOVF9NQVJLRVIsIG5nRGV2TW9kZSA/IGBJQ1UgJHtpY3VOb2RlSW5kZXh9YCA6ICcnLCBpY3VOb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgY29kZXMgZm9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdUV4cHJlc3Npb24gPSBwYXJ0c1tqXSBhcyBJY3VFeHByZXNzaW9uO1xuICAgICAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhpY3VFeHByZXNzaW9uKTtcbiAgICAgICAgICBpY3VTdGFydChpY3VFeHByZXNzaW9ucywgaWN1RXhwcmVzc2lvbiwgaWN1Tm9kZUluZGV4LCBpY3VOb2RlSW5kZXgpO1xuICAgICAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgICAgICBjb25zdCB0SWN1SW5kZXggPSBpY3VFeHByZXNzaW9ucy5sZW5ndGggLSAxO1xuICAgICAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgdG9NYXNrQml0KGljdUV4cHJlc3Npb24ubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgMyBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIC0xIC0gaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyxcbiAgICAgICAgICAgICAgaWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2gsIHRJY3VJbmRleCxcbiAgICAgICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZSwgdEljdUluZGV4KTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tqXSAhPT0gJycpIHtcbiAgICAgICAgICBjb25zdCB0ZXh0ID0gcGFydHNbal0gYXMgc3RyaW5nO1xuICAgICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB0ZXh0Lm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAvLyBDcmVhdGUgdGV4dCBub2Rlc1xuICAgICAgICAgIGNvbnN0IHRleHROb2RlSW5kZXggPSBzdGFydEluZGV4ICsgaTE4blZhcnNDb3VudCsrO1xuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBiaW5kaW5nLCB0aGUgdmFsdWUgd2lsbCBiZSBzZXQgZHVyaW5nIHVwZGF0ZVxuICAgICAgICAgICAgICBoYXNCaW5kaW5nID8gJycgOiB0ZXh0LCB0ZXh0Tm9kZUluZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuXG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh0ZXh0LCB0ZXh0Tm9kZUluZGV4KSwgdXBkYXRlT3BDb2Rlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYWxsb2NFeHBhbmRvKHZpZXdEYXRhLCBpMThuVmFyc0NvdW50KTtcblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGF0dGFjaEkxOG5PcENvZGVzRGVidWcoXG4gICAgICAgICAgY3JlYXRlT3BDb2RlcywgdXBkYXRlT3BDb2RlcywgaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLCB2aWV3RGF0YSk7XG5cbiAgLy8gTk9URTogbG9jYWwgdmFyIG5lZWRlZCB0byBwcm9wZXJseSBhc3NlcnQgdGhlIHR5cGUgb2YgYFRJMThuYC5cbiAgY29uc3QgdEkxOG46IFRJMThuID0ge1xuICAgIHZhcnM6IGkxOG5WYXJzQ291bnQsXG4gICAgY3JlYXRlOiBjcmVhdGVPcENvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlT3BDb2RlcyxcbiAgICBpY3VzOiBpY3VFeHByZXNzaW9ucy5sZW5ndGggPyBpY3VFeHByZXNzaW9ucyA6IG51bGwsXG4gIH07XG5cbiAgdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID0gdEkxOG47XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEkxOG5Ob2RlKFxuICAgIHROb2RlOiBUTm9kZSwgcGFyZW50VE5vZGU6IFROb2RlLCBwcmV2aW91c1ROb2RlOiBUTm9kZSB8IG51bGwsIHZpZXdEYXRhOiBMVmlldyk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIGNvbnN0IG5leHROb2RlID0gdE5vZGUubmV4dDtcbiAgaWYgKCFwcmV2aW91c1ROb2RlKSB7XG4gICAgcHJldmlvdXNUTm9kZSA9IHBhcmVudFROb2RlO1xuICB9XG5cbiAgLy8gUmUtb3JnYW5pemUgbm9kZSB0cmVlIHRvIHB1dCB0aGlzIG5vZGUgaW4gdGhlIGNvcnJlY3QgcG9zaXRpb24uXG4gIGlmIChwcmV2aW91c1ROb2RlID09PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcGFyZW50VE5vZGUuY2hpbGQpIHtcbiAgICB0Tm9kZS5uZXh0ID0gcGFyZW50VE5vZGUuY2hpbGQ7XG4gICAgcGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgfSBlbHNlIGlmIChwcmV2aW91c1ROb2RlICE9PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcHJldmlvdXNUTm9kZS5uZXh0KSB7XG4gICAgdE5vZGUubmV4dCA9IHByZXZpb3VzVE5vZGUubmV4dDtcbiAgICBwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZTtcbiAgfSBlbHNlIHtcbiAgICB0Tm9kZS5uZXh0ID0gbnVsbDtcbiAgfVxuXG4gIGlmIChwYXJlbnRUTm9kZSAhPT0gdmlld0RhdGFbVF9IT1NUXSkge1xuICAgIHROb2RlLnBhcmVudCA9IHBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgfVxuXG4gIC8vIElmIHROb2RlIHdhcyBtb3ZlZCBhcm91bmQsIHdlIG1pZ2h0IG5lZWQgdG8gZml4IGEgYnJva2VuIGxpbmsuXG4gIGxldCBjdXJzb3I6IFROb2RlfG51bGwgPSB0Tm9kZS5uZXh0O1xuICB3aGlsZSAoY3Vyc29yKSB7XG4gICAgaWYgKGN1cnNvci5uZXh0ID09PSB0Tm9kZSkge1xuICAgICAgY3Vyc29yLm5leHQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gICAgY3Vyc29yID0gY3Vyc29yLm5leHQ7XG4gIH1cblxuICAvLyBJZiB0aGUgcGxhY2Vob2xkZXIgdG8gYXBwZW5kIGlzIGEgcHJvamVjdGlvbiwgd2UgbmVlZCB0byBtb3ZlIHRoZSBwcm9qZWN0ZWQgbm9kZXMgaW5zdGVhZFxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICBjb25zdCB0UHJvamVjdGlvbk5vZGUgPSB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGU7XG4gICAgYXBwZW5kUHJvamVjdGVkTm9kZXMoXG4gICAgICAgIHZpZXdEYXRhLCB0UHJvamVjdGlvbk5vZGUsIHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uLCBmaW5kQ29tcG9uZW50Vmlldyh2aWV3RGF0YSkpO1xuICAgIHJldHVybiB0Tm9kZTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIHZpZXdEYXRhKSwgdE5vZGUsIHZpZXdEYXRhKTtcblxuICBjb25zdCBzbG90VmFsdWUgPSB2aWV3RGF0YVt0Tm9kZS5pbmRleF07XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gTm9kZXMgdGhhdCBpbmplY3QgVmlld0NvbnRhaW5lclJlZiBhbHNvIGhhdmUgYSBjb21tZW50IG5vZGUgdGhhdCBzaG91bGQgYmUgbW92ZWRcbiAgICBhcHBlbmRDaGlsZChzbG90VmFsdWVbTkFUSVZFXSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgZm9yIGludGVybmF0aW9uYWxpemF0aW9uLlxuICpcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGJ5IHRyYW5zZm9ybWluZyBpdCBmcm9tIGludGVybWVkaWF0ZVxuICogZm9ybWF0ICh0aGF0IG1pZ2h0IGNvbnRhaW4gc29tZSBtYXJrZXJzIHRoYXQgd2UgbmVlZCB0byByZXBsYWNlKSB0byB0aGUgZmluYWxcbiAqIGZvcm0sIGNvbnN1bWFibGUgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uLiBQb3N0IHByb2Nlc3Npbmcgc3RlcHMgaW5jbHVkZTpcbiAqXG4gKiAxLiBSZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBjYXNlcyAobGlrZSBb77+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vXzvv70177+9XSlcbiAqIDIuIFJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICogMy4gUmVwbGFjZSBhbGwgSUNVIHJlZmVyZW5jZXMgd2l0aCBjb3JyZXNwb25kaW5nIHZhbHVlcyAobGlrZSDvv71JQ1VfRVhQX0lDVV8x77+9KVxuICogICAgaW4gY2FzZSBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICpcbiAqIEBwYXJhbSBtZXNzYWdlIFJhdyB0cmFuc2xhdGlvbiBzdHJpbmcgZm9yIHBvc3QgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHJlcGxhY2VtZW50cyBTZXQgb2YgcmVwbGFjZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGFwcGxpZWRcbiAqXG4gKiBAcmV0dXJucyBUcmFuc2Zvcm1lZCBzdHJpbmcgdGhhdCBjYW4gYmUgY29uc3VtZWQgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuUG9zdHByb2Nlc3MoXG4gICAgbWVzc2FnZTogc3RyaW5nLCByZXBsYWNlbWVudHM6IHtba2V5OiBzdHJpbmddOiAoc3RyaW5nIHwgc3RyaW5nW10pfSA9IHt9KTogc3RyaW5nIHtcbiAgLyoqXG4gICAqIFN0ZXAgMTogcmVzb2x2ZSBhbGwgbXVsdGktdmFsdWUgcGxhY2Vob2xkZXJzIGxpa2UgW++/vSM177+9fO+/vSoxOjHvv73vv70jMjox77+9fO+/vSM0OjHvv71dXG4gICAqXG4gICAqIE5vdGU6IGR1ZSB0byB0aGUgd2F5IHdlIHByb2Nlc3MgbmVzdGVkIHRlbXBsYXRlcyAoQkZTKSwgbXVsdGktdmFsdWUgcGxhY2Vob2xkZXJzIGFyZSB0eXBpY2FsbHlcbiAgICogZ3JvdXBlZCBieSB0ZW1wbGF0ZXMsIGZvciBleGFtcGxlOiBb77+9IzXvv71877+9Izbvv71877+9IzE6Me+/vXzvv70jMzoy77+9XSB3aGVyZSDvv70jNe+/vSBhbmQg77+9Izbvv70gYmVsb25nIHRvIHJvb3RcbiAgICogdGVtcGxhdGUsIO+/vSMxOjHvv70gYmVsb25nIHRvIG5lc3RlZCB0ZW1wbGF0ZSB3aXRoIGluZGV4IDEgYW5kIO+/vSMxOjLvv70gLSBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleFxuICAgKiAzLiBIb3dldmVyIGluIHJlYWwgdGVtcGxhdGVzIHRoZSBvcmRlciBtaWdodCBiZSBkaWZmZXJlbnQ6IGkuZS4g77+9IzE6Me+/vSBhbmQvb3Ig77+9IzM6Mu+/vSBtYXkgZ28gaW5cbiAgICogZnJvbnQgb2Yg77+9Izbvv70uIFRoZSBwb3N0IHByb2Nlc3Npbmcgc3RlcCByZXN0b3JlcyB0aGUgcmlnaHQgb3JkZXIgYnkga2VlcGluZyB0cmFjayBvZiB0aGVcbiAgICogdGVtcGxhdGUgaWQgc3RhY2sgYW5kIGxvb2tzIGZvciBwbGFjZWhvbGRlcnMgdGhhdCBiZWxvbmcgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgdGVtcGxhdGUuXG4gICAqL1xuICBsZXQgcmVzdWx0OiBzdHJpbmcgPSBtZXNzYWdlO1xuICBpZiAoUFBfTVVMVElfVkFMVUVfUExBQ0VIT0xERVJTX1JFR0VYUC50ZXN0KG1lc3NhZ2UpKSB7XG4gICAgY29uc3QgbWF0Y2hlczoge1trZXk6IHN0cmluZ106IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXX0gPSB7fTtcbiAgICBjb25zdCB0ZW1wbGF0ZUlkc1N0YWNrOiBudW1iZXJbXSA9IFtST09UX1RFTVBMQVRFX0lEXTtcbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShQUF9QTEFDRUhPTERFUlNfUkVHRVhQLCAobTogYW55LCBwaHM6IHN0cmluZywgdG1wbDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBwaHMgfHwgdG1wbDtcbiAgICAgIGNvbnN0IHBsYWNlaG9sZGVyczogUG9zdHByb2Nlc3NQbGFjZWhvbGRlcltdID0gbWF0Y2hlc1tjb250ZW50XSB8fCBbXTtcbiAgICAgIGlmICghcGxhY2Vob2xkZXJzLmxlbmd0aCkge1xuICAgICAgICBjb250ZW50LnNwbGl0KCd8JykuZm9yRWFjaCgocGxhY2Vob2xkZXI6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gcGxhY2Vob2xkZXIubWF0Y2goUFBfVEVNUExBVEVfSURfUkVHRVhQKTtcbiAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUlkID0gbWF0Y2ggPyBwYXJzZUludChtYXRjaFsxXSwgMTApIDogUk9PVF9URU1QTEFURV9JRDtcbiAgICAgICAgICBjb25zdCBpc0Nsb3NlVGVtcGxhdGVUYWcgPSBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAudGVzdChwbGFjZWhvbGRlcik7XG4gICAgICAgICAgcGxhY2Vob2xkZXJzLnB1c2goW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGNoZXNbY29udGVudF0gPSBwbGFjZWhvbGRlcnM7XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxhY2Vob2xkZXJzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGkxOG4gcG9zdHByb2Nlc3M6IHVubWF0Y2hlZCBwbGFjZWhvbGRlciAtICR7Y29udGVudH1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVudFRlbXBsYXRlSWQgPSB0ZW1wbGF0ZUlkc1N0YWNrW3RlbXBsYXRlSWRzU3RhY2subGVuZ3RoIC0gMV07XG4gICAgICBsZXQgaWR4ID0gMDtcbiAgICAgIC8vIGZpbmQgcGxhY2Vob2xkZXIgaW5kZXggdGhhdCBtYXRjaGVzIGN1cnJlbnQgdGVtcGxhdGUgaWRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGxhY2Vob2xkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwbGFjZWhvbGRlcnNbaV1bMF0gPT09IGN1cnJlbnRUZW1wbGF0ZUlkKSB7XG4gICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdXBkYXRlIHRlbXBsYXRlIGlkIHN0YWNrIGJhc2VkIG9uIHRoZSBjdXJyZW50IHRhZyBleHRyYWN0ZWRcbiAgICAgIGNvbnN0IFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSA9IHBsYWNlaG9sZGVyc1tpZHhdO1xuICAgICAgaWYgKGlzQ2xvc2VUZW1wbGF0ZVRhZykge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50VGVtcGxhdGVJZCAhPT0gdGVtcGxhdGVJZCkge1xuICAgICAgICB0ZW1wbGF0ZUlkc1N0YWNrLnB1c2godGVtcGxhdGVJZCk7XG4gICAgICB9XG4gICAgICAvLyByZW1vdmUgcHJvY2Vzc2VkIHRhZyBmcm9tIHRoZSBsaXN0XG4gICAgICBwbGFjZWhvbGRlcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfSk7XG4gIH1cblxuICAvLyByZXR1cm4gY3VycmVudCByZXN1bHQgaWYgbm8gcmVwbGFjZW1lbnRzIHNwZWNpZmllZFxuICBpZiAoIU9iamVjdC5rZXlzKHJlcGxhY2VtZW50cykubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGVwIDI6IHJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVX1ZBUlNfUkVHRVhQLCAobWF0Y2gsIHN0YXJ0LCBrZXksIF90eXBlLCBfaWR4LCBlbmQpOiBzdHJpbmcgPT4ge1xuICAgIHJldHVybiByZXBsYWNlbWVudHMuaGFzT3duUHJvcGVydHkoa2V5KSA/IGAke3N0YXJ0fSR7cmVwbGFjZW1lbnRzW2tleV19JHtlbmR9YCA6IG1hdGNoO1xuICB9KTtcblxuICAvKipcbiAgICogU3RlcCAzOiByZXBsYWNlIGFsbCBJQ1UgcmVmZXJlbmNlcyB3aXRoIGNvcnJlc3BvbmRpbmcgdmFsdWVzIChsaWtlIO+/vUlDVV9FWFBfSUNVXzHvv70pIGluIGNhc2VcbiAgICogbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVVNfUkVHRVhQLCAobWF0Y2gsIGtleSk6IHN0cmluZyA9PiB7XG4gICAgaWYgKHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBjb25zdCBsaXN0ID0gcmVwbGFjZW1lbnRzW2tleV0gYXMgc3RyaW5nW107XG4gICAgICBpZiAoIWxpc3QubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaTE4biBwb3N0cHJvY2VzczogdW5tYXRjaGVkIElDVSAtICR7bWF0Y2h9IHdpdGgga2V5OiAke2tleX1gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsaXN0LnNoaWZ0KCkgITtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoO1xuICB9KTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFRyYW5zbGF0ZXMgYSB0cmFuc2xhdGlvbiBibG9jayBtYXJrZWQgYnkgYGkxOG5TdGFydGAgYW5kIGBpMThuRW5kYC4gSXQgaW5zZXJ0cyB0aGUgdGV4dC9JQ1Ugbm9kZXNcbiAqIGludG8gdGhlIHJlbmRlciB0cmVlLCBtb3ZlcyB0aGUgcGxhY2Vob2xkZXIgbm9kZXMgYW5kIHJlbW92ZXMgdGhlIGRlbGV0ZWQgbm9kZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuRW5kKCk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gIGkxOG5FbmRGaXJzdFBhc3ModFZpZXcpO1xuICAvLyBTdG9wIGRlbGF5aW5nIHByb2plY3Rpb25zXG4gIHNldERlbGF5UHJvamVjdGlvbihmYWxzZSk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuRW5kYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkVuZEZpcnN0UGFzcyh0VmlldzogVFZpZXcpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHZpZXdEYXRhW1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnaTE4bkVuZCBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZycpO1xuXG4gIGNvbnN0IHJvb3RJbmRleCA9IGkxOG5JbmRleFN0YWNrW2kxOG5JbmRleFN0YWNrUG9pbnRlci0tXTtcbiAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW3Jvb3RJbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFRJMThuO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0STE4biwgYFlvdSBzaG91bGQgY2FsbCBpMThuU3RhcnQgYmVmb3JlIGkxOG5FbmRgKTtcblxuICAvLyBGaW5kIHRoZSBsYXN0IG5vZGUgdGhhdCB3YXMgYWRkZWQgYmVmb3JlIGBpMThuRW5kYFxuICBsZXQgbGFzdENyZWF0ZWROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG5cbiAgLy8gUmVhZCB0aGUgaW5zdHJ1Y3Rpb25zIHRvIGluc2VydC9tb3ZlL3JlbW92ZSBET00gZWxlbWVudHNcbiAgY29uc3QgdmlzaXRlZE5vZGVzID0gcmVhZENyZWF0ZU9wQ29kZXMocm9vdEluZGV4LCB0STE4bi5jcmVhdGUsIHRJMThuLmljdXMsIHZpZXdEYXRhKTtcblxuICAvLyBSZW1vdmUgZGVsZXRlZCBub2Rlc1xuICBmb3IgKGxldCBpID0gcm9vdEluZGV4ICsgMTsgaSA8PSBsYXN0Q3JlYXRlZE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUOyBpKyspIHtcbiAgICBpZiAodmlzaXRlZE5vZGVzLmluZGV4T2YoaSkgPT09IC0xKSB7XG4gICAgICByZW1vdmVOb2RlKGksIHZpZXdEYXRhKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBzdG9yZXMgdGhlIGR5bmFtaWMgVE5vZGUsIGFuZCB1bmhvb2tzIGl0IGZyb20gdGhlIHRyZWUgZm9yIG5vdy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgIGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwpOiBURWxlbWVudE5vZGV8VEljdUNvbnRhaW5lck5vZGUge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdID0gbmF0aXZlO1xuICBjb25zdCB0Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUobFZpZXdbVFZJRVddLCBsVmlld1tUX0hPU1RdLCBpbmRleCwgdHlwZSBhcyBhbnksIG5hbWUsIG51bGwpO1xuXG4gIC8vIFdlIGFyZSBjcmVhdGluZyBhIGR5bmFtaWMgbm9kZSwgdGhlIHByZXZpb3VzIHROb2RlIG1pZ2h0IG5vdCBiZSBwb2ludGluZyBhdCB0aGlzIG5vZGUuXG4gIC8vIFdlIHdpbGwgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZSBsYXRlciB3aXRoIGBhcHBlbmRJMThuTm9kZWAuXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9PT0gdE5vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRDcmVhdGVPcENvZGVzKFxuICAgIGluZGV4OiBudW1iZXIsIGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLFxuICAgIHZpZXdEYXRhOiBMVmlldyk6IG51bWJlcltdIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRMVmlldygpW1JFTkRFUkVSXTtcbiAgbGV0IGN1cnJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGxldCBwcmV2aW91c1ROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgY29uc3QgdmlzaXRlZE5vZGVzOiBudW1iZXJbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNyZWF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBvcENvZGUgPSBjcmVhdGVPcENvZGVzW2ldO1xuICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCB0ZXh0Uk5vZGUgPSBjcmVhdGVUZXh0Tm9kZShvcENvZGUsIHJlbmRlcmVyKTtcbiAgICAgIGNvbnN0IHRleHROb2RlSW5kZXggPSBjcmVhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgY3VycmVudFROb2RlID1cbiAgICAgICAgICBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgodmlld0RhdGEsIHRleHROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Uk5vZGUsIG51bGwpO1xuICAgICAgdmlzaXRlZE5vZGVzLnB1c2godGV4dE5vZGVJbmRleCk7XG4gICAgICBzZXRJc05vdFBhcmVudCgpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wQ29kZSA9PSAnbnVtYmVyJykge1xuICAgICAgc3dpdGNoIChvcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZDpcbiAgICAgICAgICBjb25zdCBkZXN0aW5hdGlvbk5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQ7XG4gICAgICAgICAgbGV0IGRlc3RpbmF0aW9uVE5vZGU6IFROb2RlO1xuICAgICAgICAgIGlmIChkZXN0aW5hdGlvbk5vZGVJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBkZXN0aW5hdGlvbiBub2RlIGlzIGBpMThuU3RhcnRgLCB3ZSBkb24ndCBoYXZlIGFcbiAgICAgICAgICAgIC8vIHRvcC1sZXZlbCBub2RlIGFuZCB3ZSBzaG91bGQgdXNlIHRoZSBob3N0IG5vZGUgaW5zdGVhZFxuICAgICAgICAgICAgZGVzdGluYXRpb25UTm9kZSA9IHZpZXdEYXRhW1RfSE9TVF0gITtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVzdGluYXRpb25UTm9kZSA9IGdldFROb2RlKGRlc3RpbmF0aW9uTm9kZUluZGV4LCB2aWV3RGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgY3VycmVudFROb2RlICEsXG4gICAgICAgICAgICAgICAgICBgWW91IG5lZWQgdG8gY3JlYXRlIG9yIHNlbGVjdCBhIG5vZGUgYmVmb3JlIHlvdSBjYW4gaW5zZXJ0IGl0IGludG8gdGhlIERPTWApO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBhcHBlbmRJMThuTm9kZShjdXJyZW50VE5vZGUgISwgZGVzdGluYXRpb25UTm9kZSwgcHJldmlvdXNUTm9kZSwgdmlld0RhdGEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuU2VsZWN0OlxuICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2gobm9kZUluZGV4KTtcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgIGlmIChjdXJyZW50VE5vZGUpIHtcbiAgICAgICAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShjdXJyZW50VE5vZGUsIGN1cnJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEkxOG5NdXRhdGVPcENvZGUuRWxlbWVudEVuZDpcbiAgICAgICAgICBjb25zdCBlbGVtZW50SW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIHZpZXdEYXRhKTtcbiAgICAgICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoY3VycmVudFROb2RlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5BdHRyOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnROb2RlSW5kZXggPSBvcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgIGNvbnN0IGF0dHJOYW1lID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIC8vIFRoaXMgY29kZSBpcyB1c2VkIGZvciBJQ1UgZXhwcmVzc2lvbnMgb25seSwgc2luY2Ugd2UgZG9uJ3Qgc3VwcG9ydFxuICAgICAgICAgIC8vIGRpcmVjdGl2ZXMvY29tcG9uZW50cyBpbiBJQ1VzLCB3ZSBkb24ndCBuZWVkIHRvIHdvcnJ5IGFib3V0IGlucHV0cyBoZXJlXG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKGVsZW1lbnROb2RlSW5kZXgsIGF0dHJOYW1lLCBhdHRyVmFsdWUsIHZpZXdEYXRhKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSkge1xuICAgICAgICBjYXNlIENPTU1FTlRfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IGNvbW1lbnRWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgY29tbWVudE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGNvbW1lbnRWYWx1ZSwgJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBgRXhwZWN0ZWQgXCIke2NvbW1lbnRWYWx1ZX1cIiB0byBiZSBhIGNvbW1lbnQgbm9kZSB2YWx1ZWApO1xuICAgICAgICAgIGNvbnN0IGNvbW1lbnRSTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQoY29tbWVudFZhbHVlKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgICAgICAgICAgICB2aWV3RGF0YSwgY29tbWVudE5vZGVJbmRleCwgVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgY29tbWVudFJOb2RlLCBudWxsKTtcbiAgICAgICAgICB2aXNpdGVkTm9kZXMucHVzaChjb21tZW50Tm9kZUluZGV4KTtcbiAgICAgICAgICBhdHRhY2hQYXRjaERhdGEoY29tbWVudFJOb2RlLCB2aWV3RGF0YSk7XG4gICAgICAgICAgKGN1cnJlbnRUTm9kZSBhcyBUSWN1Q29udGFpbmVyTm9kZSkuYWN0aXZlQ2FzZUluZGV4ID0gbnVsbDtcbiAgICAgICAgICAvLyBXZSB3aWxsIGFkZCB0aGUgY2FzZSBub2RlcyBsYXRlciwgZHVyaW5nIHRoZSB1cGRhdGUgcGhhc2VcbiAgICAgICAgICBzZXRJc05vdFBhcmVudCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVMRU1FTlRfTUFSS0VSOlxuICAgICAgICAgIGNvbnN0IHRhZ05hbWVWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgY29uc3QgZWxlbWVudE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHRhZ05hbWVWYWx1ZSwgJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBgRXhwZWN0ZWQgXCIke3RhZ05hbWVWYWx1ZX1cIiB0byBiZSBhbiBlbGVtZW50IG5vZGUgdGFnIG5hbWVgKTtcbiAgICAgICAgICBjb25zdCBlbGVtZW50Uk5vZGUgPSByZW5kZXJlci5jcmVhdGVFbGVtZW50KHRhZ05hbWVWYWx1ZSk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgICAgICAgICBwcmV2aW91c1ROb2RlID0gY3VycmVudFROb2RlO1xuICAgICAgICAgIGN1cnJlbnRUTm9kZSA9IGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChcbiAgICAgICAgICAgICAgdmlld0RhdGEsIGVsZW1lbnROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBlbGVtZW50Uk5vZGUsIHRhZ05hbWVWYWx1ZSk7XG4gICAgICAgICAgdmlzaXRlZE5vZGVzLnB1c2goZWxlbWVudE5vZGVJbmRleCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIG11dGF0ZSBvcGVyYXRpb24gZm9yIFwiJHtvcENvZGV9XCJgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXRJc05vdFBhcmVudCgpO1xuXG4gIHJldHVybiB2aXNpdGVkTm9kZXM7XG59XG5cbmZ1bmN0aW9uIHJlYWRVcGRhdGVPcENvZGVzKFxuICAgIHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzLCBpY3VzOiBUSWN1W10gfCBudWxsLCBiaW5kaW5nc1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBjaGFuZ2VNYXNrOiBudW1iZXIsIHZpZXdEYXRhOiBMVmlldywgYnlwYXNzQ2hlY2tCaXQgPSBmYWxzZSkge1xuICBsZXQgY2FzZUNyZWF0ZWQgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cGRhdGVPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gYml0IGNvZGUgdG8gY2hlY2sgaWYgd2Ugc2hvdWxkIGFwcGx5IHRoZSBuZXh0IHVwZGF0ZVxuICAgIGNvbnN0IGNoZWNrQml0ID0gdXBkYXRlT3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgLy8gTnVtYmVyIG9mIG9wQ29kZXMgdG8gc2tpcCB1bnRpbCBuZXh0IHNldCBvZiB1cGRhdGUgY29kZXNcbiAgICBjb25zdCBza2lwQ29kZXMgPSB1cGRhdGVPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgIGlmIChieXBhc3NDaGVja0JpdCB8fCAoY2hlY2tCaXQgJiBjaGFuZ2VNYXNrKSkge1xuICAgICAgLy8gVGhlIHZhbHVlIGhhcyBiZWVuIHVwZGF0ZWQgc2luY2UgbGFzdCBjaGVja2VkXG4gICAgICBsZXQgdmFsdWUgPSAnJztcbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8PSAoaSArIHNraXBDb2Rlcyk7IGorKykge1xuICAgICAgICBjb25zdCBvcENvZGUgPSB1cGRhdGVPcENvZGVzW2pdO1xuICAgICAgICBpZiAodHlwZW9mIG9wQ29kZSA9PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlICs9IG9wQ29kZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBiaW5kaW5nIGluZGV4IHdob3NlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gICAgICAgICAgICB2YWx1ZSArPSByZW5kZXJTdHJpbmdpZnkodmlld0RhdGFbYmluZGluZ3NTdGFydEluZGV4IC0gb3BDb2RlXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICBsZXQgdEljdUluZGV4OiBudW1iZXI7XG4gICAgICAgICAgICBsZXQgdEljdTogVEljdTtcbiAgICAgICAgICAgIGxldCBpY3VUTm9kZTogVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5VcGRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcE5hbWUgPSB1cGRhdGVPcENvZGVzWysral0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNhbml0aXplRm4gPSB1cGRhdGVPcENvZGVzWysral0gYXMgU2FuaXRpemVyRm4gfCBudWxsO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKG5vZGVJbmRleCwgcHJvcE5hbWUsIHZhbHVlLCBzYW5pdGl6ZUZuKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgdGV4dEJpbmRpbmdJbnRlcm5hbCh2aWV3RGF0YSwgbm9kZUluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBhY3RpdmUgY2FzZSwgZGVsZXRlIHRoZSBvbGQgbm9kZXNcbiAgICAgICAgICAgICAgICBpZiAoaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVDb2RlcyA9IHRJY3UucmVtb3ZlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleF07XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHJlbW92ZUNvZGVzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZU9wQ29kZSA9IHJlbW92ZUNvZGVzW2tdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyZW1vdmVPcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IHJlbW92ZU9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVOb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQ29kZXNbayArIDFdIGFzIG51bWJlciA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VUTm9kZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0VE5vZGUobmVzdGVkSWN1Tm9kZUluZGV4LCB2aWV3RGF0YSkgYXMgVEljdUNvbnRhaW5lck5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVJbmRleCA9IG5lc3RlZEljdVROb2RlLmFjdGl2ZUNhc2VJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VUSW5kZXggPSByZW1vdmVPcENvZGUgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRUSWN1ID0gaWN1cyAhW25lc3RlZEljdVRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkobmVzdGVkVEljdS5yZW1vdmVbYWN0aXZlSW5kZXhdLCByZW1vdmVDb2Rlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgYWN0aXZlIGNhc2VJbmRleFxuICAgICAgICAgICAgICAgIGNvbnN0IGNhc2VJbmRleCA9IGdldENhc2VJbmRleCh0SWN1LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ID0gY2FzZUluZGV4ICE9PSAtMSA/IGNhc2VJbmRleCA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIG5vZGVzIGZvciB0aGUgbmV3IGNhc2VcbiAgICAgICAgICAgICAgICByZWFkQ3JlYXRlT3BDb2RlcygtMSwgdEljdS5jcmVhdGVbY2FzZUluZGV4XSwgaWN1cywgdmlld0RhdGEpO1xuICAgICAgICAgICAgICAgIGNhc2VDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLkljdVVwZGF0ZTpcbiAgICAgICAgICAgICAgICB0SWN1SW5kZXggPSB1cGRhdGVPcENvZGVzWysral0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgIHRJY3UgPSBpY3VzICFbdEljdUluZGV4XTtcbiAgICAgICAgICAgICAgICBpY3VUTm9kZSA9IGdldFROb2RlKG5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgIHJlYWRVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICB0SWN1LnVwZGF0ZVtpY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXggIV0sIGljdXMsIGJpbmRpbmdzU3RhcnRJbmRleCwgY2hhbmdlTWFzayxcbiAgICAgICAgICAgICAgICAgICAgdmlld0RhdGEsIGNhc2VDcmVhdGVkKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaSArPSBza2lwQ29kZXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlTm9kZShpbmRleDogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcpIHtcbiAgY29uc3QgcmVtb3ZlZFBoVE5vZGUgPSBnZXRUTm9kZShpbmRleCwgdmlld0RhdGEpO1xuICBjb25zdCByZW1vdmVkUGhSTm9kZSA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIHZpZXdEYXRhKTtcbiAgaWYgKHJlbW92ZWRQaFJOb2RlKSB7XG4gICAgbmF0aXZlUmVtb3ZlTm9kZSh2aWV3RGF0YVtSRU5ERVJFUl0sIHJlbW92ZWRQaFJOb2RlKTtcbiAgfVxuXG4gIGNvbnN0IHNsb3RWYWx1ZSA9IMm1ybVsb2FkKGluZGV4KSBhcyBSRWxlbWVudCB8IFJDb21tZW50IHwgTENvbnRhaW5lciB8IFN0eWxpbmdDb250ZXh0O1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gc2xvdFZhbHVlIGFzIExDb250YWluZXI7XG4gICAgaWYgKHJlbW92ZWRQaFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIERlZmluZSB0aGlzIG5vZGUgYXMgZGV0YWNoZWQgc28gdGhhdCB3ZSBkb24ndCByaXNrIHByb2plY3RpbmcgaXRcbiAgcmVtb3ZlZFBoVE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0RldGFjaGVkO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xufVxuXG4vKipcbiAqXG4gKiBVc2UgdGhpcyBpbnN0cnVjdGlvbiB0byBjcmVhdGUgYSB0cmFuc2xhdGlvbiBibG9jayB0aGF0IGRvZXNuJ3QgY29udGFpbiBhbnkgcGxhY2Vob2xkZXIuXG4gKiBJdCBjYWxscyBib3RoIHtAbGluayBpMThuU3RhcnR9IGFuZCB7QGxpbmsgaTE4bkVuZH0gaW4gb25lIGluc3RydWN0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuKGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICDJtcm1aTE4blN0YXJ0KGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgybXJtWkxOG5FbmQoKTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IGluIHRoZSBzdGF0aWMgYmxvY2tcbiAqIEBwYXJhbSB2YWx1ZXNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyh0VmlldywgaW5kZXgsIHZhbHVlcyk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuQXR0cmlidXRlc2AgYWJvdmUuXG4gKi9cbmZ1bmN0aW9uIGkxOG5BdHRyaWJ1dGVzRmlyc3RQYXNzKHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50SW5kZXggPSBwcmV2aW91c0VsZW1lbnQuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWVzW2ldO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB2YWx1ZXNbaSArIDFdO1xuICAgIGNvbnN0IHBhcnRzID0gbWVzc2FnZS5zcGxpdChJQ1VfUkVHRVhQKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcnRzW2pdO1xuXG4gICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJQ1UgZXhwcmVzc2lvbnMgYXJlIG5vdCB5ZXQgc3VwcG9ydGVkIGluIGF0dHJpYnV0ZXMnKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09ICcnKSB7XG4gICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISF2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgICAgICAgIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUsIHZhbHVlLCBsVmlldyk7XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhhdCBhdHRyaWJ1dGUgaXMgYSBkaXJlY3RpdmUgaW5wdXRcbiAgICAgICAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHByZXZpb3VzRWxlbWVudEluZGV4LCBsVmlldyk7XG4gICAgICAgICAgY29uc3QgZGF0YVZhbHVlID0gdE5vZGUuaW5wdXRzICYmIHROb2RlLmlucHV0c1thdHRyTmFtZV07XG4gICAgICAgICAgaWYgKGRhdGFWYWx1ZSkge1xuICAgICAgICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPT09IG51bGwpIHtcbiAgICB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSB1cGRhdGVPcENvZGVzO1xuICB9XG59XG5cbmxldCBjaGFuZ2VNYXNrID0gMGIwO1xubGV0IHNoaWZ0c0NvdW50ZXIgPSAwO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgdmFsdWVzIG9mIHRoZSBiaW5kaW5ncyBkdXJpbmcgZWFjaCB1cGRhdGUgY3ljbGUgaW4gb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG9cbiAqIHVwZGF0ZSB0aGUgdHJhbnNsYXRlZCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVGhlIGJpbmRpbmcncyB2YWx1ZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkV4cDxUPih2YWx1ZTogVCk6IHZvaWQge1xuICBjb25zdCBleHByZXNzaW9uID0gybXJtWJpbmQodmFsdWUpO1xuICBpZiAoZXhwcmVzc2lvbiAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG9yIGFuIGkxOG4gYXR0cmlidXRlIHdoZW4gdGhlIGJpbmRpbmdzIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgZWl0aGVyIHtAbGluayBpMThuU3RhcnR9ICh0cmFuc2xhdGlvbiBibG9jaykgb3Ige0BsaW5rIGkxOG5BdHRyaWJ1dGVzfVxuICogKGkxOG4gYXR0cmlidXRlKSBvbiB3aGljaCBpdCBzaG91bGQgdXBkYXRlIHRoZSBjb250ZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4bkFwcGx5KGluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHNoaWZ0c0NvdW50ZXIpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICAgIGNvbnN0IHRJMThuID0gdFZpZXcuZGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdO1xuICAgIGxldCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcztcbiAgICBsZXQgaWN1czogVEljdVtdfG51bGwgPSBudWxsO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRJMThuKSkge1xuICAgICAgdXBkYXRlT3BDb2RlcyA9IHRJMThuIGFzIEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gKHRJMThuIGFzIFRJMThuKS51cGRhdGU7XG4gICAgICBpY3VzID0gKHRJMThuIGFzIFRJMThuKS5pY3VzO1xuICAgIH1cbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0SW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSAtIHNoaWZ0c0NvdW50ZXIgLSAxO1xuICAgIHJlYWRVcGRhdGVPcENvZGVzKHVwZGF0ZU9wQ29kZXMsIGljdXMsIGJpbmRpbmdzU3RhcnRJbmRleCwgY2hhbmdlTWFzaywgbFZpZXcpO1xuXG4gICAgLy8gUmVzZXQgY2hhbmdlTWFzayAmIG1hc2tCaXQgdG8gZGVmYXVsdCBmb3IgdGhlIG5leHQgdXBkYXRlIGN5Y2xlXG4gICAgY2hhbmdlTWFzayA9IDBiMDtcbiAgICBzaGlmdHNDb3VudGVyID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNhc2Ugb2YgYW4gSUNVIGV4cHJlc3Npb24gZGVwZW5kaW5nIG9uIHRoZSBtYWluIGJpbmRpbmcgdmFsdWVcbiAqXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIGJpbmRpbmdWYWx1ZSBUaGUgdmFsdWUgb2YgdGhlIG1haW4gYmluZGluZyB1c2VkIGJ5IHRoaXMgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FzZUluZGV4KGljdUV4cHJlc3Npb246IFRJY3UsIGJpbmRpbmdWYWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKGJpbmRpbmdWYWx1ZSk7XG4gIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICBzd2l0Y2ggKGljdUV4cHJlc3Npb24udHlwZSkge1xuICAgICAgY2FzZSBJY3VUeXBlLnBsdXJhbDoge1xuICAgICAgICBjb25zdCByZXNvbHZlZENhc2UgPSBnZXRQbHVyYWxDYXNlKGJpbmRpbmdWYWx1ZSwgZ2V0TG9jYWxlSWQoKSk7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKHJlc29sdmVkQ2FzZSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEgJiYgcmVzb2x2ZWRDYXNlICE9PSAnb3RoZXInKSB7XG4gICAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIEljdVR5cGUuc2VsZWN0OiB7XG4gICAgICAgIGluZGV4ID0gaWN1RXhwcmVzc2lvbi5jYXNlcy5pbmRleE9mKCdvdGhlcicpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIGZvciBJQ1UgZXhwcmVzc2lvbnMuXG4gKlxuICogQHBhcmFtIHRJY3VzXG4gKiBAcGFyYW0gaWN1RXhwcmVzc2lvblxuICogQHBhcmFtIHN0YXJ0SW5kZXhcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBpY3VTdGFydChcbiAgICB0SWN1czogVEljdVtdLCBpY3VFeHByZXNzaW9uOiBJY3VFeHByZXNzaW9uLCBzdGFydEluZGV4OiBudW1iZXIsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjcmVhdGVDb2RlcyA9IFtdO1xuICBjb25zdCByZW1vdmVDb2RlcyA9IFtdO1xuICBjb25zdCB1cGRhdGVDb2RlcyA9IFtdO1xuICBjb25zdCB2YXJzID0gW107XG4gIGNvbnN0IGNoaWxkSWN1czogbnVtYmVyW11bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGljdUV4cHJlc3Npb24udmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gRWFjaCB2YWx1ZSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzICYgb3RoZXIgSUNVIGV4cHJlc3Npb25zXG4gICAgY29uc3QgdmFsdWVBcnIgPSBpY3VFeHByZXNzaW9uLnZhbHVlc1tpXTtcbiAgICBjb25zdCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlQXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlQXJyW2pdO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gbmVzdGVkIElDVSBleHByZXNzaW9uXG4gICAgICAgIGNvbnN0IGljdUluZGV4ID0gbmVzdGVkSWN1cy5wdXNoKHZhbHVlIGFzIEljdUV4cHJlc3Npb24pIC0gMTtcbiAgICAgICAgLy8gUmVwbGFjZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb24gYnkgYSBjb21tZW50IG5vZGVcbiAgICAgICAgdmFsdWVBcnJbal0gPSBgPCEtLe+/vSR7aWN1SW5kZXh977+9LS0+YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaWN1Q2FzZTogSWN1Q2FzZSA9XG4gICAgICAgIHBhcnNlSWN1Q2FzZSh2YWx1ZUFyci5qb2luKCcnKSwgc3RhcnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICBjcmVhdGVDb2Rlcy5wdXNoKGljdUNhc2UuY3JlYXRlKTtcbiAgICByZW1vdmVDb2Rlcy5wdXNoKGljdUNhc2UucmVtb3ZlKTtcbiAgICB1cGRhdGVDb2Rlcy5wdXNoKGljdUNhc2UudXBkYXRlKTtcbiAgICB2YXJzLnB1c2goaWN1Q2FzZS52YXJzKTtcbiAgICBjaGlsZEljdXMucHVzaChpY3VDYXNlLmNoaWxkSWN1cyk7XG4gIH1cbiAgY29uc3QgdEljdTogVEljdSA9IHtcbiAgICB0eXBlOiBpY3VFeHByZXNzaW9uLnR5cGUsXG4gICAgdmFycyxcbiAgICBjaGlsZEljdXMsXG4gICAgY2FzZXM6IGljdUV4cHJlc3Npb24uY2FzZXMsXG4gICAgY3JlYXRlOiBjcmVhdGVDb2RlcyxcbiAgICByZW1vdmU6IHJlbW92ZUNvZGVzLFxuICAgIHVwZGF0ZTogdXBkYXRlQ29kZXNcbiAgfTtcbiAgdEljdXMucHVzaCh0SWN1KTtcbiAgLy8gQWRkaW5nIHRoZSBtYXhpbXVtIHBvc3NpYmxlIG9mIHZhcnMgbmVlZGVkIChiYXNlZCBvbiB0aGUgY2FzZXMgd2l0aCB0aGUgbW9zdCB2YXJzKVxuICBpMThuVmFyc0NvdW50ICs9IE1hdGgubWF4KC4uLnZhcnMpO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybXMgYSBzdHJpbmcgdGVtcGxhdGUgaW50byBhbiBIVE1MIHRlbXBsYXRlIGFuZCBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdXBkYXRlXG4gKiBhdHRyaWJ1dGVzIG9yIG5vZGVzIHRoYXQgY29udGFpbiBiaW5kaW5ncy5cbiAqXG4gKiBAcGFyYW0gdW5zYWZlSHRtbCBUaGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0gcGFyZW50SW5kZXhcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBleHBhbmRvU3RhcnRJbmRleFxuICovXG5mdW5jdGlvbiBwYXJzZUljdUNhc2UoXG4gICAgdW5zYWZlSHRtbDogc3RyaW5nLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sIHRJY3VzOiBUSWN1W10sXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcik6IEljdUNhc2Uge1xuICBjb25zdCBpbmVydEJvZHlIZWxwZXIgPSBuZXcgSW5lcnRCb2R5SGVscGVyKGRvY3VtZW50KTtcbiAgY29uc3QgaW5lcnRCb2R5RWxlbWVudCA9IGluZXJ0Qm9keUhlbHBlci5nZXRJbmVydEJvZHlFbGVtZW50KHVuc2FmZUh0bWwpO1xuICBpZiAoIWluZXJ0Qm9keUVsZW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBnZW5lcmF0ZSBpbmVydCBib2R5IGVsZW1lbnQnKTtcbiAgfVxuICBjb25zdCB3cmFwcGVyID0gZ2V0VGVtcGxhdGVDb250ZW50KGluZXJ0Qm9keUVsZW1lbnQgISkgYXMgRWxlbWVudCB8fCBpbmVydEJvZHlFbGVtZW50O1xuICBjb25zdCBvcENvZGVzOiBJY3VDYXNlID0ge3ZhcnM6IDAsIGNoaWxkSWN1czogW10sIGNyZWF0ZTogW10sIHJlbW92ZTogW10sIHVwZGF0ZTogW119O1xuICBwYXJzZU5vZGVzKHdyYXBwZXIuZmlyc3RDaGlsZCwgb3BDb2RlcywgcGFyZW50SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gIHJldHVybiBvcENvZGVzO1xufVxuXG5jb25zdCBORVNURURfSUNVID0gL++/vShcXGQrKe+/vS87XG5cbi8qKlxuICogUGFyc2VzIGEgbm9kZSwgaXRzIGNoaWxkcmVuIGFuZCBpdHMgc2libGluZ3MsIGFuZCBnZW5lcmF0ZXMgdGhlIG11dGF0ZSAmIHVwZGF0ZSBPcENvZGVzLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50Tm9kZSBUaGUgZmlyc3Qgbm9kZSB0byBwYXJzZVxuICogQHBhcmFtIGljdUNhc2UgVGhlIGRhdGEgZm9yIHRoZSBJQ1UgZXhwcmVzc2lvbiBjYXNlIHRoYXQgY29udGFpbnMgdGhvc2Ugbm9kZXNcbiAqIEBwYXJhbSBwYXJlbnRJbmRleCBJbmRleCBvZiB0aGUgY3VycmVudCBub2RlJ3MgcGFyZW50XG4gKiBAcGFyYW0gbmVzdGVkSWN1cyBEYXRhIGZvciB0aGUgbmVzdGVkIElDVSBleHByZXNzaW9ucyB0aGF0IHRoaXMgY2FzZSBjb250YWluc1xuICogQHBhcmFtIHRJY3VzIERhdGEgZm9yIGFsbCBJQ1UgZXhwcmVzc2lvbnMgb2YgdGhlIGN1cnJlbnQgbWVzc2FnZVxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4IEV4cGFuZG8gc3RhcnQgaW5kZXggZm9yIHRoZSBjdXJyZW50IElDVSBleHByZXNzaW9uXG4gKi9cbmZ1bmN0aW9uIHBhcnNlTm9kZXMoXG4gICAgY3VycmVudE5vZGU6IE5vZGUgfCBudWxsLCBpY3VDYXNlOiBJY3VDYXNlLCBwYXJlbnRJbmRleDogbnVtYmVyLCBuZXN0ZWRJY3VzOiBJY3VFeHByZXNzaW9uW10sXG4gICAgdEljdXM6IFRJY3VbXSwgZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcikge1xuICBpZiAoY3VycmVudE5vZGUpIHtcbiAgICBjb25zdCBuZXN0ZWRJY3VzVG9DcmVhdGU6IFtJY3VFeHByZXNzaW9uLCBudW1iZXJdW10gPSBbXTtcbiAgICB3aGlsZSAoY3VycmVudE5vZGUpIHtcbiAgICAgIGNvbnN0IG5leHROb2RlOiBOb2RlfG51bGwgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZztcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gZXhwYW5kb1N0YXJ0SW5kZXggKyArK2ljdUNhc2UudmFycztcbiAgICAgIHN3aXRjaCAoY3VycmVudE5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgICAgICBjb25zdCBlbGVtZW50ID0gY3VycmVudE5vZGUgYXMgRWxlbWVudDtcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgaWYgKCFWQUxJRF9FTEVNRU5UUy5oYXNPd25Qcm9wZXJ0eSh0YWdOYW1lKSkge1xuICAgICAgICAgICAgLy8gVGhpcyBpc24ndCBhIHZhbGlkIGVsZW1lbnQsIHdlIHdvbid0IGNyZWF0ZSBhbiBlbGVtZW50IGZvciBpdFxuICAgICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgICAgRUxFTUVOVF9NQVJLRVIsIHRhZ05hbWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgICBjb25zdCBlbEF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbEF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGF0dHIgPSBlbEF0dHJzLml0ZW0oaSkgITtcbiAgICAgICAgICAgICAgY29uc3QgbG93ZXJBdHRyTmFtZSA9IGF0dHIubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISFhdHRyLnZhbHVlLm1hdGNoKEJJTkRJTkdfUkVHRVhQKTtcbiAgICAgICAgICAgICAgLy8gd2UgYXNzdW1lIHRoZSBpbnB1dCBzdHJpbmcgaXMgc2FmZSwgdW5sZXNzIGl0J3MgdXNpbmcgYSBiaW5kaW5nXG4gICAgICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKFZBTElEX0FUVFJTLmhhc093blByb3BlcnR5KGxvd2VyQXR0ck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoVVJJX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIF9zYW5pdGl6ZVVybCksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFNSQ1NFVF9BVFRSU1tsb3dlckF0dHJOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lLCBzYW5pdGl6ZVNyY3NldCksXG4gICAgICAgICAgICAgICAgICAgICAgICBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhhdHRyLnZhbHVlLCBuZXdJbmRleCwgYXR0ci5uYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBgV0FSTklORzogaWdub3JpbmcgdW5zYWZlIGF0dHJpYnV0ZSB2YWx1ZSAke2xvd2VyQXR0ck5hbWV9IG9uIGVsZW1lbnQgJHt0YWdOYW1lfSAoc2VlIGh0dHA6Ly9nLmNvL25nL3NlY3VyaXR5I3hzcylgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkF0dHIsIGF0dHIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBjaGlsZHJlbiBvZiB0aGlzIG5vZGUgKGlmIGFueSlcbiAgICAgICAgICAgIHBhcnNlTm9kZXMoXG4gICAgICAgICAgICAgICAgY3VycmVudE5vZGUuZmlyc3RDaGlsZCwgaWN1Q2FzZSwgbmV3SW5kZXgsIG5lc3RlZEljdXMsIHRJY3VzLCBleHBhbmRvU3RhcnRJbmRleCk7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHBhcmVudCBub2RlIGFmdGVyIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuUmVtb3ZlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCB8fCAnJztcbiAgICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gdmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIGljdUNhc2UuY3JlYXRlLnB1c2goXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHZhbHVlLCBuZXdJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgICBhZGRBbGxUb0FycmF5KGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXModmFsdWUsIG5ld0luZGV4KSwgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY29tbWVudCBub2RlIGlzIGEgcGxhY2Vob2xkZXIgZm9yIGEgbmVzdGVkIElDVVxuICAgICAgICAgIGNvbnN0IG1hdGNoID0gTkVTVEVEX0lDVS5leGVjKGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnKTtcbiAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdUluZGV4ID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0xvY2FsID0gbmdEZXZNb2RlID8gYG5lc3RlZCBJQ1UgJHtuZXN0ZWRJY3VJbmRleH1gIDogJyc7XG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmV3TG9jYWwsIG5ld0luZGV4LFxuICAgICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzW25lc3RlZEljdUluZGV4XTtcbiAgICAgICAgICAgIG5lc3RlZEljdXNUb0NyZWF0ZS5wdXNoKFtuZXN0ZWRJY3UsIG5ld0luZGV4XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlIGRvIG5vdCBoYW5kbGUgYW55IG90aGVyIHR5cGUgb2YgY29tbWVudFxuICAgICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIC8vIFdlIGRvIG5vdCBoYW5kbGUgYW55IG90aGVyIHR5cGUgb2YgZWxlbWVudFxuICAgICAgICAgIGljdUNhc2UudmFycy0tO1xuICAgICAgfVxuICAgICAgY3VycmVudE5vZGUgPSBuZXh0Tm9kZSAhO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmVzdGVkSWN1c1RvQ3JlYXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuZXN0ZWRJY3UgPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMF07XG4gICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPSBuZXN0ZWRJY3VzVG9DcmVhdGVbaV1bMV07XG4gICAgICBpY3VTdGFydCh0SWN1cywgbmVzdGVkSWN1LCBuZXN0ZWRJY3VOb2RlSW5kZXgsIGV4cGFuZG9TdGFydEluZGV4ICsgaWN1Q2FzZS52YXJzKTtcbiAgICAgIC8vIFNpbmNlIHRoaXMgaXMgcmVjdXJzaXZlLCB0aGUgbGFzdCBUSWN1IHRoYXQgd2FzIHB1c2hlZCBpcyB0aGUgb25lIHdlIHdhbnRcbiAgICAgIGNvbnN0IG5lc3RUSWN1SW5kZXggPSB0SWN1cy5sZW5ndGggLSAxO1xuICAgICAgaWN1Q2FzZS52YXJzICs9IE1hdGgubWF4KC4uLnRJY3VzW25lc3RUSWN1SW5kZXhdLnZhcnMpO1xuICAgICAgaWN1Q2FzZS5jaGlsZEljdXMucHVzaChuZXN0VEljdUluZGV4KTtcbiAgICAgIGNvbnN0IG1hc2sgPSBnZXRCaW5kaW5nTWFzayhuZXN0ZWRJY3UpO1xuICAgICAgaWN1Q2FzZS51cGRhdGUucHVzaChcbiAgICAgICAgICB0b01hc2tCaXQobmVzdGVkSWN1Lm1haW5CaW5kaW5nKSwgIC8vIG1hc2sgb2YgdGhlIG1haW4gYmluZGluZ1xuICAgICAgICAgIDMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAtMSAtIG5lc3RlZEljdS5tYWluQmluZGluZyxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCxcbiAgICAgICAgICBuZXN0VEljdUluZGV4LFxuICAgICAgICAgIG1hc2ssICAvLyBtYXNrIG9mIGFsbCB0aGUgYmluZGluZ3Mgb2YgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIDIsICAgICAvLyBza2lwIDIgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgpO1xuICAgICAgaWN1Q2FzZS5yZW1vdmUucHVzaChcbiAgICAgICAgICBuZXN0VEljdUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3UsXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgVFJBTlNMQVRJT05TOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuZXhwb3J0IGludGVyZmFjZSBJMThuTG9jYWxpemVPcHRpb25zIHsgdHJhbnNsYXRpb25zOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTsgfVxuXG4vKipcbiAqIFNldCB0aGUgY29uZmlndXJhdGlvbiBmb3IgYGkxOG5Mb2NhbGl6ZWAuXG4gKlxuICogQGRlcHJlY2F0ZWQgdGhpcyBtZXRob2QgaXMgdGVtcG9yYXJ5ICYgc2hvdWxkIG5vdCBiZSB1c2VkIGFzIGl0IHdpbGwgYmUgcmVtb3ZlZCBzb29uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuQ29uZmlndXJlTG9jYWxpemUob3B0aW9uczogSTE4bkxvY2FsaXplT3B0aW9ucyA9IHtcbiAgdHJhbnNsYXRpb25zOiB7fVxufSkge1xuICBUUkFOU0xBVElPTlMgPSBvcHRpb25zLnRyYW5zbGF0aW9ucztcbn1cblxuY29uc3QgTE9DQUxJWkVfUEhfUkVHRVhQID0gL1xce1xcJCguKj8pXFx9L2c7XG5cbi8qKlxuICogQSBnb29nLmdldE1zZy1saWtlIGZ1bmN0aW9uIGZvciB1c2VycyB0aGF0IGRvIG5vdCB1c2UgQ2xvc3VyZS5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyByZXF1aXJlZCBhcyBhICp0ZW1wb3JhcnkqIG1lYXN1cmUgdG8gcHJldmVudCBpMThuIHRlc3RzIGZyb20gYmVpbmcgYmxvY2tlZCB3aGlsZVxuICogcnVubmluZyBvdXRzaWRlIG9mIENsb3N1cmUgQ29tcGlsZXIuIFRoaXMgbWV0aG9kIHdpbGwgbm90IGJlIG5lZWRlZCBvbmNlIHJ1bnRpbWUgdHJhbnNsYXRpb25cbiAqIHNlcnZpY2Ugc3VwcG9ydCBpcyBpbnRyb2R1Y2VkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKiBAZGVwcmVjYXRlZCB0aGlzIG1ldGhvZCBpcyB0ZW1wb3JhcnkgJiBzaG91bGQgbm90IGJlIHVzZWQgYXMgaXQgd2lsbCBiZSByZW1vdmVkIHNvb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuTG9jYWxpemUoaW5wdXQ6IHN0cmluZywgcGxhY2Vob2xkZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9KSB7XG4gIGlmICh0eXBlb2YgVFJBTlNMQVRJT05TW2lucHV0XSAhPT0gJ3VuZGVmaW5lZCcpIHsgIC8vIHRvIGFjY291bnQgZm9yIGVtcHR5IHN0cmluZ1xuICAgIGlucHV0ID0gVFJBTlNMQVRJT05TW2lucHV0XTtcbiAgfVxuICByZXR1cm4gT2JqZWN0LmtleXMocGxhY2Vob2xkZXJzKS5sZW5ndGggP1xuICAgICAgaW5wdXQucmVwbGFjZShMT0NBTElaRV9QSF9SRUdFWFAsIChtYXRjaCwga2V5KSA9PiBwbGFjZWhvbGRlcnNba2V5XSB8fCAnJykgOlxuICAgICAgaW5wdXQ7XG59XG5cbi8qKlxuICogVGhlIGxvY2FsZSBpZCB0aGF0IHRoZSBhcHBsaWNhdGlvbiBpcyBjdXJyZW50bHkgdXNpbmcgKGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucykuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0xPQ0FMRV9JRCA9ICdlbi1VUyc7XG5sZXQgTE9DQUxFX0lEID0gREVGQVVMVF9MT0NBTEVfSUQ7XG5cbi8qKlxuICogU2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbG9jYWxlSWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldExvY2FsZUlkKGxvY2FsZUlkOiBzdHJpbmcpIHtcbiAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbG9jYWxlIGlkIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucy5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUlkKCk6IHN0cmluZyB7XG4gIHJldHVybiBMT0NBTEVfSUQ7XG59XG4iXX0=